import { db, cleanFirestoreData } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export interface SyncMessageParams {
  messageText: string;
  senderId: string;
  senderName?: string;
  targetUserId?: string;
  cargoId?: string;
}

export async function syncChatMessageToFreightOrders({
  messageText,
  senderId,
  senderName,
  targetUserId,
  cargoId
}: SyncMessageParams) {
  if (!messageText || !messageText.trim()) return;

  try {
    const freightOrdersRef = collection(db, 'freight_orders');
    let matchingDocs: any[] = [];

    // 1. Try finding by direct cargoId if provided
    if (cargoId) {
      const q = query(freightOrdersRef, where('id', '==', cargoId));
      const snap = await getDocs(q);
      snap.forEach(d => matchingDocs.push({ docId: d.id, ...d.data() }));
    }

    // 2. If no direct cargoId, query open freight orders for matching buyer/supplier/requester
    if (matchingDocs.length === 0) {
      const snapAll = await getDocs(freightOrdersRef);
      snapAll.forEach(d => {
        const data = d.data();
        const bId = data.buyerId || data.userId;
        const sId = data.supplierId;

        const isMatchTarget = targetUserId && (bId === targetUserId || sId === targetUserId);
        const isMatchSender = senderId && (bId === senderId || sId === senderId);

        if (isMatchTarget || isMatchSender || (!targetUserId && data.status !== 'Entregue' && data.status !== 'Concluído')) {
          matchingDocs.push({ docId: d.id, ...data });
        }
      });
    }

    // 3. Fallback to localStorage if Firestore docs not loaded
    let localRequests: any[] = [];
    try {
      const saved = localStorage.getItem('supplyx_freight_requests');
      if (saved) localRequests = JSON.parse(saved);
    } catch (e) {
      console.warn('Could not parse supplyx_freight_requests:', e);
    }

    const isLogisticsSender =
      senderId.includes('logistica') ||
      senderId.includes('carrier') ||
      senderId.includes('ops_') ||
      (senderName || '').toLowerCase().includes('logístic') ||
      (senderName || '').toLowerCase().includes('transport') ||
      (senderName || '').toLowerCase().includes('operador');

    const formattedSenderName = senderName || (isLogisticsSender ? 'Operador Logístico' : 'Cliente Remetente');

    const newReply = {
      id: `rep-sync-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender: isLogisticsSender ? 'logistics' : 'requester',
      senderName: formattedSenderName,
      text: messageText,
      timestamp: new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      logisticsUserId: isLogisticsSender ? senderId : (targetUserId || 'ops_logistica_default'),
      logisticsUserName: isLogisticsSender ? formattedSenderName : (senderName || 'Cliente Remetente')
    };

    if (matchingDocs.length > 0) {
      for (const order of matchingDocs) {
        const existingReplies = order.logisticsReplies || [];
        const updatedReplies = [...existingReplies, newReply];

        let newStatus = order.status;
        if (order.status === 'Pendente') {
          newStatus = 'Em concurso';
        } else if (order.status === 'Em concurso' && isLogisticsSender) {
          newStatus = 'Em negociação';
        }

        const updateData: any = {
          logisticsReplies: updatedReplies,
          proposalsCount: (order.proposalsCount || 0) + 1,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };

        // Extract price if present
        if (isLogisticsSender && (messageText.includes('MZN') || messageText.includes('MT') || messageText.includes('$'))) {
          const matchPrice = messageText.match(/(?:MT|MZN|\$)\s*([\d\.\,]+)|([\d\.\,]+)\s*(?:MT|MZN|\$)/i);
          if (matchPrice) {
            const rawVal = matchPrice[1] || matchPrice[2];
            if (rawVal) {
              updateData.targetPrice = `MT ${rawVal} MZN`;
            }
          }
        }

        await updateDoc(doc(db, 'freight_orders', order.docId), cleanFirestoreData(updateData)).catch(err => {
          console.warn('Could not updateDoc freight_orders:', err);
        });

        localRequests = localRequests.map((r: any) => {
          if (r.id === order.id || r.id === order.docId) {
            return {
              ...r,
              ...updateData
            };
          }
          return r;
        });
      }
    } else if (localRequests.length > 0) {
      const activeIdx = localRequests.findIndex((r: any) => r.status !== 'Entregue' && r.status !== 'Concluído');
      if (activeIdx !== -1) {
        const order = localRequests[activeIdx];
        const updatedReplies = [...(order.logisticsReplies || []), newReply];
        localRequests[activeIdx] = {
          ...order,
          logisticsReplies: updatedReplies,
          proposalsCount: (order.proposalsCount || 0) + 1,
          status: order.status === 'Pendente' ? 'Em concurso' : order.status
        };
      }
    }

    localStorage.setItem('supplyx_freight_requests', JSON.stringify(localRequests));
    window.dispatchEvent(new Event('supplyx_freight_requests_updated'));
  } catch (err) {
    console.error('Error in syncChatMessageToFreightOrders:', err);
  }
}
