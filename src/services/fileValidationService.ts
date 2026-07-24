/**
 * File Validation Service
 * Handles client-side and server-ready security validation of files
 * strictly ensuring safe extensions, types, and sizing limits.
 */

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

const BLOCKED_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'msi', 'dll', 'com', 'scr', 'vbs', 'sh', 'bash', 'bin', 'msu', 'gadget'
];

const MAX_FILE_SIZE_MB = 100; // 100MB limit as requested

export const fileValidationService = {
  /**
   * Validate file extension and MIME type
   */
  validateFile(file: File): FileValidationResult {
    if (!file || typeof file !== 'object') {
      return {
        isValid: false,
        error: 'Arquivo inválido ou não selecionado.'
      };
    }

    const fileName = file.name || 'arquivo';
    const fileSize = typeof file.size === 'number' ? file.size : 0;
    const fileType = typeof file.type === 'string' ? file.type : '';

    // 1. Block empty files or zero byte files
    if (fileSize <= 0) {
      return {
        isValid: false,
        error: 'Arquivo inválido: O arquivo está vazio (0 bytes).'
      };
    }

    // Extract extension
    const extensionMatch = fileName.match(/\.([^.]+)$/);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';

    // 2. Block empty names/extensions
    if (!extension) {
      return {
        isValid: false,
        error: 'Arquivo inválido: Extensão de arquivo não identificada.'
      };
    }

    // 3. Block dangerous extensions
    if (BLOCKED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: `Arquivo perigoso bloqueado (.${extension}). Executáveis e scripts não são permitidos por segurança.`
      };
    }

    // 4. Max size check
    const sizeInMB = fileSize / (1024 * 1024);
    if (sizeInMB > MAX_FILE_SIZE_MB) {
      return {
        isValid: false,
        error: `Arquivo muito grande (${sizeInMB.toFixed(1)} MB). O limite máximo de envio é de ${MAX_FILE_SIZE_MB} MB.`
      };
    }

    // 5. Validate dangerous mime types safely
    const dangerousMimeTypes = [
      'application/x-msdownload',
      'application/x-sh',
      'application/x-bash',
      'application/x-msi'
    ];
    if (fileType && dangerousMimeTypes.includes(fileType.toLowerCase())) {
      return {
        isValid: false,
        error: 'Tipo MIME inválido: Executáveis e scripts não são permitidos.'
      };
    }

    return { isValid: true };
  },

  /**
   * Get file type category
   */
  getFileCategory(fileName: string): 'image' | 'pdf' | 'word' | 'excel' | 'powerpoint' | 'zip' | 'other' {
    const extensionMatch = fileName.match(/\.([^.]+)$/);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';

    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'];
    const pdfExts = ['pdf'];
    const wordExts = ['doc', 'docx', 'odt', 'rtf'];
    const excelExts = ['xls', 'xlsx', 'ods', 'csv'];
    const pptExts = ['ppt', 'pptx', 'odp'];
    const zipExts = ['zip', 'rar', 'tar', 'gz', '7z'];

    if (imageExts.includes(extension)) return 'image';
    if (pdfExts.includes(extension)) return 'pdf';
    if (wordExts.includes(extension)) return 'word';
    if (excelExts.includes(extension)) return 'excel';
    if (pptExts.includes(extension)) return 'powerpoint';
    if (zipExts.includes(extension)) return 'zip';

    return 'other';
  },

  /**
   * Format file size to human-readable format
   */
  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
};
