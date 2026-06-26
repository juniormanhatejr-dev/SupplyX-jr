/**
 * Upload Service
 * Coordinates validation, chunked upload to simulated Azure Storage,
 * and writing file metadata to Firestore (under both 'files_metadata' and 'chats/roomId/messages').
 */

import { blobStorageService, FileMetadata } from './blobStorageService';
import { fileValidationService } from './fileValidationService';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, setDoc, doc, getDoc, updateDoc, increment } from 'firebase/firestore';

export interface UploadProgressEvent {
  progress: number;
  status: 'enviando' | 'concluido' | 'falha' | 'cancelado' | 'pausado' | 'offline';
  message?: string;
}

export const uploadService = {
  /**
   * Upload a file with security checks, progress callbacks and Firestore metadata persistence
   */
  async uploadFile(
    file: File,
    roomId: string,
    onProgressUpdate: (event: UploadProgressEvent) => void
  ): Promise<string> {
    // 1. Verify Authentication
    if (!auth.currentUser) {
      const errorMsg = 'Usuário não autenticado.';
      onProgressUpdate({ progress: 0, status: 'falha', message: errorMsg });
      throw new Error(errorMsg);
    }

    const userId = auth.currentUser.uid;

    // 2. Validate file (security constraints)
    const validation = fileValidationService.validateFile(file);
    if (!validation.isValid) {
      const errorMsg = validation.error || 'Arquivo inválido.';
      onProgressUpdate({ progress: 0, status: 'falha', message: errorMsg });
      throw new Error(errorMsg);
    }

    // 3. Generate a safe unique file ID
    const fileId = 'file_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();

    // 4. Start Simulated Azure Blob Chunk Upload
    return new Promise((resolve, reject) => {
      blobStorageService.startChunkUpload(fileId, file, userId, roomId, {
        onProgress: (progress, statusText) => {
          let mappedStatus: 'enviando' | 'pausado' | 'cancelado' | 'offline' = 'enviando';
          if (statusText === 'Pausado') mappedStatus = 'pausado';
          if (statusText === 'Cancelado') mappedStatus = 'cancelado';
          if (statusText === 'Offline') mappedStatus = 'offline';

          onProgressUpdate({
            progress,
            status: mappedStatus
          });
        },
        onComplete: async (metadata: FileMetadata) => {
          try {
            console.log(`[UploadService] [LOG] Upload do blob concluído. Salvando metadados no Firestore...`);
            
            // Fetch parent chat room document first to get participants (for rule compliance & metadata)
            let participants: string[] = [];
            let otherId: string | null = null;
            try {
              const chatRoomRef = doc(db, 'chats', roomId);
              const chatRoomSnap = await getDoc(chatRoomRef);
              if (chatRoomSnap.exists()) {
                const chatRoomData = chatRoomSnap.data();
                participants = chatRoomData.participants || [];
                otherId = participants.find((id: string) => id !== userId) || null;
              }
            } catch (chatRoomError) {
              console.warn('[UploadService] Warning: Failed to fetch chat room:', chatRoomError);
            }

            // A. Store in Firestore metadata table ('files_metadata')
            const metadataRef = doc(db, 'files_metadata', fileId);
            const metadataPayload = {
              id: metadata.id,
              name: metadata.name,
              extension: metadata.extension,
              size: metadata.size,
              mimeType: metadata.mimeType,
              blobUrl: metadata.blobUrl,
              createdAt: metadata.createdAt,
              userId: metadata.userId,
              roomId: metadata.roomId
            };
            console.log('[UploadService] [DEBUG] Attempting to setDoc in files_metadata with payload:', JSON.stringify(metadataPayload, null, 2));
            try {
              await setDoc(metadataRef, metadataPayload);
              console.log('[UploadService] [DEBUG] setDoc in files_metadata succeeded!');
            } catch (setDocErr: any) {
              console.error('[UploadService] [ERROR] setDoc in files_metadata failed:', setDocErr.message, setDocErr);
              throw setDocErr;
            }

            // B. Send message to corresponding conversation
            const messagesRef = collection(db, `chats/${roomId}/messages`);
            const isImage = metadata.mimeType.startsWith('image/');
            const displayCategory = fileValidationService.getFileCategory(metadata.name);
            
            let displayIcon = '📦';
            if (displayCategory === 'pdf') displayIcon = '📄';
            if (displayCategory === 'image') displayIcon = '🖼️';
            if (displayCategory === 'excel') displayIcon = '📊';
            if (displayCategory === 'zip') displayIcon = '📁';
            if (displayCategory === 'word') displayIcon = '📃';
            if (displayCategory === 'powerpoint') displayIcon = '🎞️';

            const messageText = `${displayIcon} ${metadata.name}`;

            console.log('[UploadService] [DEBUG] Attempting to addDoc in chats/messages...');
            try {
              await addDoc(messagesRef, {
                senderId: userId,
                participants: participants.length > 0 ? participants : [userId], // Rule Pillar 8 compliance
                text: messageText,
                fileId: metadata.id,
                fileUrl: metadata.blobUrl,
                fileType: metadata.mimeType,
                fileName: metadata.name,
                fileSize: metadata.size,
                createdAt: serverTimestamp()
              });
              console.log('[UploadService] [DEBUG] addDoc in chats/messages succeeded!');
            } catch (addDocErr: any) {
              console.error('[UploadService] [ERROR] addDoc in chats/messages failed:', addDocErr.message, addDocErr);
              throw addDocErr;
            }

            // Update parent chat room document with last message info & increment unread count
            try {
              const chatRoomRef = doc(db, 'chats', roomId);
              const updatePayload: Record<string, any> = {
                lastMessage: messageText,
                lastMessageSenderId: userId,
                updatedAt: serverTimestamp()
              };
              if (otherId) {
                updatePayload[`unreadCount.${otherId}`] = increment(1);
              }
              await updateDoc(chatRoomRef, updatePayload);
            } catch (chatRoomError) {
              console.warn('[UploadService] Warning: Failed to update chat room lastMessage metadata:', chatRoomError);
            }

            onProgressUpdate({
              progress: 100,
              status: 'concluido'
            });

            resolve(fileId);
          } catch (err: any) {
            console.error('[UploadService] [LOG] Erro ao persistir metadados do arquivo no Firestore:', err);
            onProgressUpdate({
              progress: 100,
              status: 'falha',
              message: 'Erro ao salvar metadados no banco.'
            });
            reject(err);
          }
        },
        onError: (errorText) => {
          onProgressUpdate({
            progress: 0,
            status: 'falha',
            message: errorText
          });
          reject(new Error(errorText));
        }
      });
    });
  },

  /**
   * Pause an active upload session
   */
  pauseUpload(fileId: string) {
    blobStorageService.pauseUpload(fileId);
  },

  /**
   * Resume a paused upload session
   */
  resumeUpload(fileId: string) {
    blobStorageService.resumeUpload(fileId);
  },

  /**
   * Cancel an upload session
   */
  cancelUpload(fileId: string) {
    blobStorageService.cancelUpload(fileId);
  }
};
