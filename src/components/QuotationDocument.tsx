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
}

const QuotationDocument: React.FC<QuotationDocumentProps> = ({ data, innerRef }) => {
  const COLORS = {
    teal: '#0f9fa8',
    darkBlue: '#06213a',
    lightGray: '#f4f7f8',
    borderGray: '#d9e1e5',
    textDark: '#1a202c',
    textMuted: '#718096',
    white: '#ffffff',
  };

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
    if (value === 0) return 'Sob Consulta';
    return value.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MT';
  };

  // Pagination Logic specifically tuned to prevent overflows
  const items = data.items || [];
  
  const paginateItems = (itemsList: QuotationItem[]) => {
    if (itemsList.length <= 4) {
      return [itemsList];
    }
    
    const pagesList: QuotationItem[][] = [];
    // Page 1 gets max 4 items (takes up ~40% space with head/metadata block)
    pagesList.push(itemsList.slice(0, 4));
    
    let remaining = itemsList.slice(4);
    while (remaining.length > 0) {
      // If remaining fits perfectly with totals & payment block (max 4 items) on the last page
      if (remaining.length <= 4) {
        pagesList.push(remaining);
        remaining = [];
      } else {
        // Otherwise grab 6 items for this page and keep going
        pagesList.push(remaining.slice(0, 6));
        remaining = remaining.slice(6);
      }
    }
    return pagesList;
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
                          {data.supplier.license ? ` | Alvará: ${data.supplier.license}` : ''}
                        </p>
                        <p style={{ margin: '1px 0' }}>Email: {data.supplier.email} | Tel: {data.supplier.phone}</p>
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
                            Fornecedor Verificado
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
                      backgroundColor: COLORS.lightGray,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginBottom: '4px'
                    }}>
                      <SupplyXLogo size="md" showText={false} />
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
                    <span style={{ fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cotação Nº:</span>
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
                    <span style={{ fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data:</span>
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
                      Informação do Cliente
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
                            <td style={{ color: COLORS.textMuted, fontSize: '9px', fontWeight: 700, padding: '3px 0', width: '80px', textTransform: 'uppercase' }}>Nome:</td>
                            <td style={{ fontWeight: 800, color: COLORS.darkBlue }}>{data.client.name}</td>
                          </tr>
                          <tr>
                            <td style={{ color: COLORS.textMuted, fontSize: '9px', fontWeight: 700, padding: '3px 0', textTransform: 'uppercase' }}>NUIT:</td>
                            <td style={{ fontWeight: 700 }}>{data.client.nuit}</td>
                          </tr>
                          <tr>
                            <td style={{ color: COLORS.textMuted, fontSize: '9px', fontWeight: 700, padding: '3px 0', textTransform: 'uppercase' }}>Endereço:</td>
                            <td style={{ fontWeight: 700 }}>{data.client.address}</td>
                          </tr>
                          <tr>
                            <td style={{ color: COLORS.textMuted, fontSize: '9px', fontWeight: 700, padding: '3px 0', textTransform: 'uppercase' }}>ID Platform:</td>
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
                      Contacto
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
                            <td style={{ color: COLORS.textMuted, fontSize: '9px', fontWeight: 700, padding: '3px 0', textTransform: 'uppercase' }}>Tel:</td>
                            <td style={{ fontWeight: 700 }}>{data.client.phone}</td>
                          </tr>
                          <tr>
                            <td style={{ color: COLORS.textMuted, fontSize: '9px', fontWeight: 700, padding: '3px 0', textTransform: 'uppercase' }}>Gestor:</td>
                            <td style={{ fontWeight: 700 }}>Central Procurement</td>
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
                    Validade: <span style={{ color: COLORS.teal }}>Esta cotação é válida por {data.validityDays} dias</span>
                  </p>
                </div>
              </>
            ) : (
              /* Custom Mini Header for pages > 1 */
              <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${COLORS.darkBlue}`, paddingBottom: '8px', marginBottom: '15px', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SupplyXLogo size="sm" showText={true} />
                  <span style={{ fontSize: '10px', fontWeight: 900, color: COLORS.teal, letterSpacing: '0.5px', fontStyle: 'italic', textTransform: 'uppercase' }}>| COTAÇÃO CONTINUAÇÃO (PÁG. {pageNumber})</span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '9px', fontWeight: 700, color: COLORS.textMuted }}>
                  <p style={{ margin: 0, fontWeight: 800, color: COLORS.darkBlue }}>Doc #: {data.quoteNumber}</p>
                  <p style={{ margin: 0, fontSize: '8px' }}>Data original: {data.date}</p>
                </div>
              </div>
            )}

            {/* Products Table */}
            <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '6px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.darkBlue, color: COLORS.white }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}>Descrição do Material</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', width: '60px' }}>Quant.</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', width: '50px' }}>Un.</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', width: '90px' }}>P. Unitário</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', width: '60px' }}>IVA (%)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', width: '100px', backgroundColor: COLORS.teal }}>Total</th>
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
                  A cotação continua na próxima página — verifique a Folha {pageNumber + 1}...
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
                          Informação de Verificação
                        </p>
                        <p style={{ margin: 0, fontSize: '8px', fontWeight: 600, color: COLORS.textMuted, fontStyle: 'italic', lineHeight: '1.3' }}>
                          A SupplyX Platform garante a autenticidade deste fornecedor e a integridade documental desta cotação. 
                          Os preços apresentados são finais para processamento via plataforma.
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
                      <p style={{ fontSize: '7px', fontWeight: 800, margin: 0, color: COLORS.textMuted }}>VALIDAÇÃO DIGITAL</p>
                    </div>

                    {/* Banking and Wallets Details */}
                    <div style={{ flex: 1, minWidth: '0' }}>
                      <p style={{ fontSize: '9px', fontWeight: 800, color: COLORS.darkBlue, textTransform: 'uppercase', marginBottom: '4px' }}>Dados de Pagamento (Fornecedor)</p>
                      
                      {data.supplier.bankAccounts && data.supplier.bankAccounts.length > 0 && (
                        <div style={{ marginBottom: '6px' }}>
                          <p style={{ fontSize: '8px', fontWeight: 800, color: COLORS.teal, textTransform: 'uppercase', marginBottom: '2px' }}>Contas Bancárias</p>
                          {data.supplier.bankAccounts.map((acc, i) => (
                            <div key={i} style={{ fontSize: '8px', fontWeight: 700, color: COLORS.textDark, marginBottom: '2px', paddingLeft: '4px', borderLeft: `2px solid ${COLORS.teal}` }}>
                              <p style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.bankName}: {acc.accountNumber} {acc.nib ? `/ NIB: ${acc.nib}` : ''}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {data.supplier.mobileWallets && data.supplier.mobileWallets.length > 0 && (
                        <div>
                          <p style={{ fontSize: '8px', fontWeight: 800, color: COLORS.teal, textTransform: 'uppercase', marginBottom: '2px' }}>Carteiras Móveis</p>
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
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: '#e53e3e' }}>
                        <span>Desconto Total {discountPercent > 0 ? `(${discountPercent}%)` : ''}:</span>
                        <span>-{formatCurrency(totalDiscount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: COLORS.textDark }}>
                        <span>IVA Total:</span>
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
                      <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>TOTAL FINAL</span>
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
                    <p style={{ fontSize: '8px', fontWeight: 800, margin: 0, color: COLORS.textMuted, textTransform: 'uppercase' }}>Assinatura & Carimbo Eletrónico</p>
                    <p style={{ fontSize: '6px', fontWeight: 600, margin: '1px 0', color: COLORS.textMuted }}>Verificado via SupplyX Platform</p>
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
                {data.supplier.address} | Tel: {data.supplier.phone} | Email: {data.supplier.email}<br />
                <span style={{ fontSize: '7px', opacity: 0.8 }}>Gestão Documental & Intermediação: Manhate Link África, Lda - Registada em Moçambique sob Nuit 400123456</span><br />
                <span style={{ fontSize: '6px', opacity: 0.6 }}>Este documento é gerado automaticamente e possui validade jurídica de cotação em território Moçambicano.</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ fontSize: '7.5px', fontWeight: 900, fontStyle: 'italic' }}>Powered by</span>
                  <SupplyXLogo size="sm" showText={false} />
                </div>
                <div style={{ fontSize: '8px', fontWeight: 900, color: COLORS.teal }}>PÁGINA {pageNumber} DE {totalPages}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuotationDocument;
