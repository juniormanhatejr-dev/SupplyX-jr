import React from 'react';
import { CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';
import SupplyXLogo from './SupplyXLogo';
import logoImg from '../assets/images/supplyx_icon_perfect_1779289258482.png';

interface QuotationItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  vatPer: number;
}

interface QuotationDocumentProps {
  data: {
    quoteNumber: string;
    date: string;
    validityDays: number;
    supplier: {
      name: string;
      isVerified: boolean;
      address: string;
      email: string;
      phone: string;
      nuit: string;
      license?: string;
      logoURL?: string;
      bankAccounts?: { bankName: string; accountNumber: string; nib: string }[];
      mobileWallets?: { provider: string; number: string; name: string }[];
      signatureURL?: string;
      stampURL?: string;
    };
    client: {
      name: string;
      nuit: string;
      address: string;
      email: string;
      phone: string;
    };
    items: QuotationItem[];
  };
  innerRef?: React.RefObject<HTMLDivElement>;
  language?: 'PT' | 'EN';
}

const QuotationDocument: React.FC<QuotationDocumentProps> = ({ data, innerRef, language = 'PT' }) => {
  const COLORS = {
    teal: '#0f9fa8',
    darkBlue: '#06213a',
    lightGray: '#f4f7f8',
    borderGray: '#d9e1e5',
    textDark: '#1a202c',
    textMuted: '#718096',
    white: '#ffffff',
  };

  const text = {
    PT: {
      verified: 'Fornecedor Verificado',
      clientInfo: 'Informação do Cliente',
      contact: 'Contacto',
      manager: 'Gestor',
      centralProcurement: 'Central Procurement',
      name: 'Nome:',
      nuit: 'NUIT:',
      address: 'Endereço:',
      platformId: 'ID Platform:',
      validity: `Esta cotação é válida por ${data.validityDays} dias`,
      validityLabel: 'Validade:',
      docNo: 'Doc #:',
      originalDate: 'Data original:',
      continuation: 'COTAÇÃO CONTINUAÇÃO (PÁG. {pageNumber})',
      tableDesc: 'Descrição do Material',
      tableQty: 'Quant.',
      tableUnit: 'Un.',
      tablePrice: 'P. Unitário',
      tableVat: 'IVA (%)',
      tableTotal: 'Total',
      continues: 'A cotação continua na próxima página — verifique a Folha {pageNumber + 1}...',
      verificationTitle: 'Informação de Verificação',
      verificationText: 'A SupplyX Platform garante a autenticidade deste fornecedor e a integridade documental desta cotação. Os preços apresentados são finais para processamento via plataforma.',
      digitalValidation: 'VALIDAÇÃO DIGITAL',
      paymentData: 'Dados de Pagamento (Fornecedor)',
      bankInfo: 'Contas Bancárias',
      mobileWallets: 'Carteiras Móveis',
      subtotalLabel: 'Subtotal:',
      totalDiscountLabel: 'Desconto Total',
      totalVatLabel: 'IVA Total:',
      finalTotal: 'TOTAL FINAL',
      signatureLabel: 'Assinatura & Carimbo Eletrónico',
      verifiedVia: 'Verificado via SupplyX Platform',
      pageOf: 'PÁGINA {pageNumber} DE {totalPages}',
      byPlatform: 'Gestão Documental & Intermediação: Manhate Link África, Lda - Registada em Moçambique sob Nuit 400123456',
      documentValidity: 'Este documento é gerado automaticamente e possui validade jurídica de cotação em território Moçambicano.',
      quoteNoLabel: 'Cotação Nº:',
      dateLabel: 'Data:',
      sobConsulta: 'Sob Consulta',
      email: 'Email:',
      phone: 'Tel:',
      alvara: 'Alvará'
    },
    EN: {
      verified: 'Verified Supplier',
      clientInfo: 'Client Information',
      contact: 'Contact',
      manager: 'Manager',
      centralProcurement: 'Central Procurement',
      name: 'Name:',
      nuit: 'NUIT (Tax ID):',
      address: 'Address:',
      platformId: 'Platform ID:',
      validity: `This quotation is valid for ${data.validityDays} days`,
      validityLabel: 'Validity:',
      docNo: 'Doc #:',
      originalDate: 'Original Date:',
      continuation: 'QUOTATION CONTINUATION (PAGE {pageNumber})',
      tableDesc: 'Material Description',
      tableQty: 'Qty.',
      tableUnit: 'Unit',
      tablePrice: 'Unit Price',
      tableVat: 'VAT (%)',
      tableTotal: 'Total',
      continues: 'Quotation continues on next page — check Page {pageNumber + 1}...',
      verificationTitle: 'Verification Information',
      verificationText: 'SupplyX Platform guarantees the authenticity of this supplier and the document integrity of this quote. Prices shown are final for processing via the platform.',
      digitalValidation: 'DIGITAL VALIDATION',
      paymentData: 'Payment Details (Supplier)',
      bankInfo: 'Bank Accounts',
      mobileWallets: 'Mobile Wallets',
      subtotalLabel: 'Subtotal:',
      totalDiscountLabel: 'Total Discount',
      totalVatLabel: 'Total VAT:',
      finalTotal: 'GRAND TOTAL',
      signatureLabel: 'Signature & Electronic Stamp',
      verifiedVia: 'Verified via SupplyX Platform',
      pageOf: 'PAGE {pageNumber} OF {totalPages}',
      byPlatform: 'Document Management & Intermediation: Manhate Link Africa, Lda - Registered in Mozambique under Nuit 400123456',
      documentValidity: 'This document is automatically generated and has legal validity as a quotation in Mozambican territory.',
      quoteNoLabel: 'Quotation No:',
      dateLabel: 'Date:',
      sobConsulta: 'Under Consultation',
      email: 'Email:',
      phone: 'Phone:',
      alvara: 'License'
    }
  }[language || 'PT'];

  const calculateSubtotal = () => {
    return data.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  };

  const calculateTotalDiscount = () => {
    return data.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice * (item.discount / 100)), 0);
  };

  const calculateTotalVAT = () => {
    return data.items.reduce((acc, item) => {
      const discountedPrice = item.unitPrice * (1 - item.discount / 100);
      return acc + (item.quantity * discountedPrice * (item.vatPer / 100));
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const totalDiscount = calculateTotalDiscount();
  const totalVAT = calculateTotalVAT();
  const grandTotal = subtotal - totalDiscount + totalVAT;
  const discountPercent = data.items[0]?.discount || 0;

  const formatCurrency = (value: number) => {
    if (value === 0) return text.sobConsulta;
    return value.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MT';
  };

  // Dynamic Pagination Logic based on real height estimations (in mm)
  const items = data.items || [];
  
  const paginateItems = (itemsList: QuotationItem[]) => {
    // Height estimation helper in millimeters
    const getItemHeight = (item: QuotationItem) => {
      const descLines = Math.ceil((item.description || '').length / 45) || 1;
      // 8mm padding/borders + 4.5mm per text line
      return 8 + (descLines * 4.5);
    };

    // Constants in millimeters
    const PAGE_HEIGHT = 297;
    const TOP_PADDING = 20;
    const BOTTOM_PADDING = 20;
    const FOOTER_RESERVA = 30; // Buffer zone for corporate absolute footer to prevent overlapping
    const MAX_CONTENT_HEIGHT = PAGE_HEIGHT - TOP_PADDING - BOTTOM_PADDING - FOOTER_RESERVA; // 227mm

    const firstPageHeaderHeight = 105; 
    const miniHeaderHeight = 20;
    const tableHeaderHeight = 8;
    const totalsBlockHeight = 80;

    // 1. If everything fits nicely on a single page, keep it all on Page 1
    let totalItemsHeight = 0;
    for (const item of itemsList) {
      totalItemsHeight += getItemHeight(item);
    }
    const singlePageNeededHeight = firstPageHeaderHeight + tableHeaderHeight + totalItemsHeight + totalsBlockHeight;
    if (singlePageNeededHeight <= MAX_CONTENT_HEIGHT + 10) { // Allow minor flexibility (up to 237mm)
      return [itemsList];
    }

    // 2. Multi-page packing
    const pages: QuotationItem[][] = [];
    let currentPageItems: QuotationItem[] = [];
    let currentY = firstPageHeaderHeight + tableHeaderHeight;

    for (let i = 0; i < itemsList.length; i++) {
      const item = itemsList[i];
      const rowH = getItemHeight(item);

      // If adding this item exceeds the page limit, push existing items and start a new page
      if (currentY + rowH > MAX_CONTENT_HEIGHT) {
        pages.push(currentPageItems);
        currentPageItems = [];
        currentY = miniHeaderHeight + tableHeaderHeight;
      }

      currentPageItems.push(item);
      currentY += rowH;
    }

    if (currentPageItems.length > 0) {
      pages.push(currentPageItems);
    }

    // 3. Look-ahead to make sure the totals/signatures block fits on the last page.
    // If not, transfer items from the last page to a new page until there is enough space.
    let lastPageIndex = pages.length - 1;
    let lastPageItems = pages[lastPageIndex];
    let lastPageY = (pages.length === 1 ? firstPageHeaderHeight : miniHeaderHeight) + tableHeaderHeight;
    for (const item of lastPageItems) {
      lastPageY += getItemHeight(item);
    }

    if (lastPageY + totalsBlockHeight > MAX_CONTENT_HEIGHT) {
      // Pop items to the next page to make space for the Totals/Signatures block
      // ensuring at least 1 item stays on the last page.
      const nextPageItems: QuotationItem[] = [];
      while (lastPageItems.length > 1 && lastPageY + totalsBlockHeight > MAX_CONTENT_HEIGHT) {
        const popped = lastPageItems.pop();
        if (popped) {
          nextPageItems.unshift(popped);
          lastPageY -= getItemHeight(popped);
        }
      }
      pages[lastPageIndex] = lastPageItems;
      pages.push(nextPageItems);
    }

    return pages;
  };

  const pagesList = paginateItems(items);
  const totalPages = pagesList.length;

  return (
    <div 
      ref={innerRef}
      id="quotation-document"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {pagesList.map((pageItems, pIndex) => {
        const isFirstPage = pIndex === 0;
        const isLastPage = pIndex === totalPages - 1;
        const pageNumber = pIndex + 1;

        return (
          <div
            key={pIndex}
            className="quotation-page"
            style={{
              width: '210mm',
              height: '297mm',
              backgroundColor: COLORS.white,
              padding: '20mm',
              fontFamily: "'Inter', sans-serif",
              color: COLORS.textDark,
              fontSize: '11px',
              lineHeight: '1.4',
              boxSizing: 'border-box',
              position: 'relative',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}
          >
            {/* Watermark Logo & Text */}
            <div style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img 
                src={logoImg} 
                alt="Watermark" 
                style={{ 
                  width: '280px', 
                  height: '280px', 
                  objectFit: 'contain',
                  transform: 'rotate(-10deg)',
                  opacity: 0.03
                }}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
              <div style={{
                position: 'absolute',
                bottom: '18%',
                fontSize: '11px',
                fontWeight: 800,
                color: '#1e3a8a',
                textTransform: 'uppercase',
                letterSpacing: '0.25em',
                textAlign: 'center',
                width: '100%',
                fontFamily: '"Inter", sans-serif',
                opacity: 0.03,
                transform: 'rotate(-10deg)'
              }}>
                Powered by Manhate Link África
              </div>
            </div>

            {/* Header section */}
            {isFirstPage ? (
              <>
                {/* Top Branding Section on First Page */}
                <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '15px', flex: 1 }}>
                    {data.supplier.logoURL && (
                      <div style={{ 
                        width: '70px', 
                        height: '70px', 
                        borderRadius: '12px', 
                        overflow: 'hidden',
                        border: `1px solid ${COLORS.borderGray}`,
                        backgroundColor: COLORS.lightGray,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <img 
                          src={data.supplier.logoURL} 
                          alt="Logo" 
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h1 style={{ 
                        fontSize: '22px', 
                        fontWeight: 900, 
                        color: COLORS.darkBlue, 
                        margin: 0, 
                        textTransform: 'uppercase',
                        letterSpacing: '-0.5px'
                      }}>
                        {data.supplier.name}
                      </h1>
                      <div style={{ marginTop: '4px', fontSize: '8.5px', fontWeight: 700, color: COLORS.textDark, lineHeight: '1.3' }}>
                        <p style={{ margin: '1px 0' }}>{data.supplier.address}</p>
                        <p style={{ margin: '1px 0' }}>
                          NUIT: <span style={{ fontWeight: 800 }}>{data.supplier.nuit}</span> 
                          {data.supplier.license ? ` | ${text.alvara}: ${data.supplier.license}` : ''}
                        </p>
                        <p style={{ margin: '1px 0' }}>Email: {data.supplier.email} | {text.phone} {data.supplier.phone}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        {data.supplier.isVerified && (
                          <div style={{ 
                            backgroundColor: COLORS.teal, 
                            color: COLORS.white, 
                            padding: '3px 6px', 
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '8px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            <CheckCircle2 size={10} />
                            {text.verified}
                          </div>
                        )}
                        <div style={{ fontSize: '8px', color: COLORS.textMuted, fontWeight: 600 }}>
                          Procurement ID: SX-SUP-{data.supplier.nuit.slice(-4)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{ 
                      width: '64px', 
                      height: '64px', 
                      borderRadius: '12px', 
                      overflow: 'hidden',
                      border: `1px solid ${COLORS.borderGray}`,
                      backgroundColor: COLORS.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginBottom: '4px'
                    }}>
                      <img 
                        src={logoImg} 
                        alt="SupplyX Logo" 
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} 
                      />
                    </div>
                    <div style={{ 
                      fontSize: '8px', 
                      color: COLORS.textMuted, 
                      textAlign: 'right', 
                      fontWeight: 700,
                      lineHeight: '1.2'
                    }}>
                      SupplyX Digital Global Platform<br />
                      Business Documentation Official ID<br />
                      Certified by Manhate Link África, Lda<br />
                      Valid within the SupplyX Ecosystem
                    </div>
                  </div>
                </div>

                <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', height: '1px', backgroundColor: COLORS.borderGray, width: '100%', marginBottom: '15px' }}></div>

                {/* Quotation Header Details */}
                <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', display: 'flex', gap: '8px', marginBottom: '15px' }}>
                  <div style={{ 
                    backgroundColor: COLORS.teal, 
                    color: COLORS.white, 
                    padding: '8px 15px', 
                    borderRadius: '6px', 
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{text.quoteNoLabel}</span>
                    <span style={{ fontWeight: 900, fontSize: '14px' }}>{data.quoteNumber}</span>
                  </div>
                  <div style={{ 
                    backgroundColor: COLORS.darkBlue, 
                    color: COLORS.white, 
                    padding: '8px 15px', 
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{text.dateLabel}</span>
                    <span style={{ fontWeight: 900, fontSize: '14px' }}>{data.date}</span>
                  </div>
                </div>

                {/* Client & Contact Info Grid */}
                <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ 
                      backgroundColor: COLORS.teal, 
                      color: COLORS.white, 
                      padding: '6px 12px', 
                      fontSize: '9px', 
                      fontWeight: 800, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px',
                      borderRadius: '6px 6px 0 0'
                    }}>
                      {text.clientInfo}
                    </div>
                    <div style={{ 
                      padding: '10px 12px', 
                      backgroundColor: COLORS.lightGray, 
                      border: `1px solid ${COLORS.borderGray}`, 
                      borderTop: 'none',
                      borderRadius: '0 0 6px 6px',
                      minHeight: '85px'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ color: COLORS.textMuted, fontSize: '9px', fontWeight: 700, padding: '3px 0', width: '80px', textTransform: 'uppercase' }}>{text.name}</td>
                            <td style={{ fontWeight: 800, color: COLORS.darkBlue }}>{data.client.name}</td>
                          </tr>
                          <tr>
                            <td style={{ color: COLORS.textMuted, fontSize: '9px', fontWeight: 700, padding: '3px 0', textTransform: 'uppercase' }}>NUIT:</td>
                            <td style={{ fontWeight: 700 }}>{data.client.nuit}</td>
                          </tr>
                          <tr>
                            <td style={{ color: COLORS.textMuted, fontSize: '9px', fontWeight: 700, padding: '3px 0', textTransform: 'uppercase' }}>{text.address}</td>
                            <td style={{ fontWeight: 700 }}>{data.client.address}</td>
                          </tr>
                          <tr>
                            <td style={{ color: COLORS.textMuted, fontSize: '9px', fontWeight: 700, padding: '3px 0', textTransform: 'uppercase' }}>{text.platformId}</td>
                            <td style={{ fontWeight: 700 }}>SX-CLI-{data.client.nuit.slice(-4)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <div style={{ 
                      backgroundColor: COLORS.teal, 
                      color: COLORS.white, 
                      padding: '6px 12px', 
                      fontSize: '9px', 
                      fontWeight: 800, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px',
                      borderRadius: '6px 6px 0 0'
                    }}>
                      {text.contact}
                    </div>
                    <div style={{ 
                      padding: '10px 12px', 
                      backgroundColor: COLORS.lightGray, 
                      border: `1px solid ${COLORS.borderGray}`, 
                      borderTop: 'none',
                      borderRadius: '0 0 6px 6px',
                      minHeight: '85px'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ color: COLORS.textMuted, fontSize: '9px', fontWeight: 700, padding: '3px 0', width: '60px', textTransform: 'uppercase' }}>Email:</td>
                            <td style={{ fontWeight: 700, fontSize: '10px' }}>{data.client.email}</td>
                          </tr>
                          <tr>
                            <td style={{ color: COLORS.textMuted, fontSize: '9px', fontWeight: 700, padding: '3px 0', textTransform: 'uppercase' }}>{text.phone}</td>
                            <td style={{ fontWeight: 700 }}>{data.client.phone}</td>
                          </tr>
                          <tr>
                            <td style={{ color: COLORS.textMuted, fontSize: '9px', fontWeight: 700, padding: '3px 0', textTransform: 'uppercase' }}>{text.manager}:</td>
                            <td style={{ fontWeight: 700 }}>{text.centralProcurement}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', marginBottom: '10px' }}>
                  <p style={{ 
                    fontSize: '10px', 
                    fontWeight: 900, 
                    color: COLORS.darkBlue, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    margin: '0 0 8px 5px'
                  }}>
                    {text.validityLabel} <span style={{ color: COLORS.teal }}>{text.validity}</span>
                  </p>
                </div>
              </>
            ) : (
              /* Custom Mini Header for pages > 1 */
              <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${COLORS.darkBlue}`, paddingBottom: '8px', marginBottom: '15px', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid #e4e4e7',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <img 
                        src={logoImg} 
                        alt="SupplyX" 
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }}
                      />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'sans-serif', letterSpacing: '-0.5px' }}>
                      <span style={{ color: '#06213a' }}>Supply</span>
                      <span style={{ color: '#0f9fa8' }}>X</span>
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: COLORS.teal, letterSpacing: '0.5px', fontStyle: 'italic', textTransform: 'uppercase' }}>| {text.continuation.replace('{pageNumber}', pageNumber.toString())}</span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '9px', fontWeight: 700, color: COLORS.textMuted }}>
                  <p style={{ margin: 0, fontWeight: 800, color: COLORS.darkBlue }}>{text.docNo} {data.quoteNumber}</p>
                  <p style={{ margin: 0, fontSize: '8px' }}>{text.originalDate} {data.date}</p>
                </div>
              </div>
            )}

            {/* Products Table */}
            <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '6px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.darkBlue, color: COLORS.white }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}>{text.tableDesc}</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', width: '60px' }}>{text.tableQty}</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', width: '50px' }}>{text.tableUnit}</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', width: '90px' }}>{text.tablePrice}</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', width: '60px' }}>{text.tableVat}</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', width: '100px', backgroundColor: COLORS.teal }}>{text.tableTotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item, index) => (
                    <tr key={`${item.description}_${index}`} style={{ 
                      backgroundColor: index % 2 === 0 ? COLORS.white : COLORS.lightGray,
                      borderBottom: `1px solid ${COLORS.borderGray}`
                    }}>
                      <td style={{ padding: '8px 10px', fontWeight: 800, fontSize: '10px' }}>{item.description}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, fontSize: '10px' }}>{item.quantity.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', fontSize: '8px' }}>{item.unit}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, fontSize: '10px' }}>{formatCurrency(item.unitPrice)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, fontSize: '9px' }}>{item.vatPer.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: COLORS.darkBlue, fontSize: '10px' }}>{formatCurrency(item.quantity * item.unitPrice * (1 + item.vatPer / 100))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!isLastPage && (
                <div style={{ marginTop: '15px', textAlign: 'right', fontStyle: 'italic', color: COLORS.teal, fontSize: '9.5px', fontWeight: 800, letterSpacing: '0.5px' }}>
                  {text.continues.replace('{pageNumber + 1}', (pageNumber + 1).toString())}
                </div>
              )}
            </div>

            {/* Totals Summary Column — Only on Last Page */}
            {isLastPage && (
              <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', alignItems: 'start', marginTop: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Notes Box */}
                  <div style={{ 
                    padding: '10px 12px', 
                    backgroundColor: COLORS.lightGray, 
                    border: `1px solid ${COLORS.borderGray}`, 
                    borderRadius: '6px'
                  }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        backgroundColor: COLORS.teal, 
                        borderRadius: '4px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: COLORS.white,
                        flexShrink: 0
                      }}>
                        <ShieldCheck size={16} />
                      </div>
                      <div>
                        <p style={{ margin: '0 0 3px 0', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: COLORS.darkBlue }}>
                          {text.verificationTitle}
                        </p>
                        <p style={{ margin: 0, fontSize: '8px', fontWeight: 600, color: COLORS.textMuted, fontStyle: 'italic', lineHeight: '1.3' }}>
                          {text.verificationText}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                    {/* QR Code Validation */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        width: '75px', 
                        height: '75px', 
                        border: `1px solid ${COLORS.borderGray}`, 
                        borderRadius: '6px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginBottom: '4px',
                        backgroundColor: COLORS.white
                      }}>
                        <QrCode size={52} color={COLORS.darkBlue} />
                      </div>
                      <p style={{ fontSize: '7px', fontWeight: 800, margin: 0, color: COLORS.textMuted }}>{text.digitalValidation}</p>
                    </div>

                    {/* Banking and Wallets Details */}
                    <div style={{ flex: 1, minWidth: '0' }}>
                      <p style={{ fontSize: '9px', fontWeight: 800, color: COLORS.darkBlue, textTransform: 'uppercase', marginBottom: '4px' }}>{text.paymentData}</p>
                      
                      {data.supplier.bankAccounts && data.supplier.bankAccounts.length > 0 && (
                        <div style={{ marginBottom: '6px' }}>
                          <p style={{ fontSize: '8px', fontWeight: 800, color: COLORS.teal, textTransform: 'uppercase', marginBottom: '2px' }}>{text.bankInfo}</p>
                          {data.supplier.bankAccounts.map((acc, i) => (
                            <div key={i} style={{ fontSize: '8px', fontWeight: 700, color: COLORS.textDark, marginBottom: '2px', paddingLeft: '4px', borderLeft: `2px solid ${COLORS.teal}` }}>
                              <p style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.bankName}: {acc.accountNumber} {acc.nib ? `/ NIB: ${acc.nib}` : ''}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {data.supplier.mobileWallets && data.supplier.mobileWallets.length > 0 && (
                        <div>
                          <p style={{ fontSize: '8px', fontWeight: 800, color: COLORS.teal, textTransform: 'uppercase', marginBottom: '2px' }}>{text.mobileWallets}</p>
                          {data.supplier.mobileWallets.map((wallet, i) => (
                            <div key={i} style={{ fontSize: '8px', fontWeight: 700, color: COLORS.textDark, marginBottom: '2px', paddingLeft: '4px', borderLeft: `2px solid ${COLORS.teal}` }}>
                              <p style={{ margin: 0 }}>{wallet.provider}: {wallet.number} ({wallet.name})</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ border: `1px solid ${COLORS.borderGray}`, borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 12px', backgroundColor: COLORS.lightGray, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: COLORS.textMuted }}>
                        <span>{text.subtotalLabel}</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: '#e53e3e' }}>
                        <span>{text.totalDiscountLabel} {discountPercent > 0 ? `(${discountPercent}%)` : ''}:</span>
                        <span>-{formatCurrency(totalDiscount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: COLORS.textDark }}>
                        <span>{text.totalVatLabel}</span>
                        <span>{formatCurrency(totalVAT)}</span>
                      </div>
                    </div>
                    <div style={{ 
                      padding: '12px 12px', 
                      backgroundColor: COLORS.darkBlue, 
                      color: COLORS.white, 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '2px'
                    }}>
                      <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>{text.finalTotal}</span>
                      <span style={{ fontSize: '18px', fontWeight: 900 }}>{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', textAlign: 'center', position: 'relative' }}>
                    <div style={{ height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${COLORS.borderGray}`, marginBottom: '6px' }}>
                      {data.supplier.signatureURL && (
                        <img 
                          src={data.supplier.signatureURL} 
                          alt="Signature" 
                          style={{ maxHeight: '42px' }} 
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      {data.supplier.stampURL && (
                        <img 
                          src={data.supplier.stampURL} 
                          alt="Stamp" 
                          style={{ maxHeight: '42px', opacity: 0.8, marginLeft: '15px' }} 
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <p style={{ fontSize: '8px', fontWeight: 800, margin: 0, color: COLORS.textMuted, textTransform: 'uppercase' }}>{text.signatureLabel}</p>
                    <p style={{ fontSize: '6px', fontWeight: 600, margin: '1px 0', color: COLORS.textMuted }}>{text.verifiedVia}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Corporate Footer */}
            <div 
              className="quotation-corporate-footer"
              style={{ 
                position: 'absolute', 
                zIndex: 10,
                pointerEvents: 'auto',
                bottom: '15mm', 
                left: '20mm', 
                right: '20mm',
                borderTop: `1px solid ${COLORS.borderGray}`,
                paddingTop: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ fontSize: '7.5px', color: COLORS.textMuted, fontWeight: 700, lineHeight: '1.3' }}>
                {data.supplier.address} | {text.phone} {data.supplier.phone} | Email: {data.supplier.email}<br />
                <span style={{ fontSize: '7px', opacity: 0.8 }}>{text.byPlatform}</span><br />
                <span style={{ fontSize: '6px', opacity: 0.6 }}>{text.documentValidity}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ fontSize: '7.5px', fontWeight: 900, fontStyle: 'italic' }}>Powered by</span>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid #e4e4e7',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <img 
                      src={logoImg} 
                      alt="SupplyX" 
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1.5px' }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '8px', fontWeight: 900, color: COLORS.teal }}>{text.pageOf.replace('{pageNumber}', pageNumber.toString()).replace('{totalPages}', totalPages.toString())}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuotationDocument;
