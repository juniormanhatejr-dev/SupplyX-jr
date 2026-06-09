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

  return (
    <div 
      ref={innerRef}
      style={{ 
        width: '210mm', 
        minHeight: '297mm', 
        backgroundColor: COLORS.white, 
        padding: '20mm', 
        fontFamily: "'Inter', sans-serif",
        color: COLORS.textDark,
        fontSize: '12px',
        lineHeight: '1.4',
        boxSizing: 'border-box',
        margin: '0 auto',
        boxShadow: '0 0 20px rgba(0,0,0,0.05)',
        position: 'relative'
      }}
      id="quotation-document"
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
            opacity: 0.04
          }}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
        <div style={{
          position: 'absolute',
          bottom: '18%',
          fontSize: '12px',
          fontWeight: 800,
          color: '#1e3a8a',
          textTransform: 'uppercase',
          letterSpacing: '0.25em',
          textAlign: 'center',
          width: '100%',
          fontFamily: '"Inter", sans-serif',
          opacity: 0.04,
          transform: 'rotate(-10deg)'
        }}>
          Powered by Manhate Link África
        </div>
      </div>

      {/* Top Branding Section */}
      <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
          {data.supplier.logoURL && (
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '16px', 
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
              fontSize: '28px', 
              fontWeight: 900, 
              color: COLORS.darkBlue, 
              margin: 0, 
              textTransform: 'uppercase',
              letterSpacing: '-0.5px'
            }}>
              {data.supplier.name}
            </h1>
            <div style={{ marginTop: '5px', fontSize: '9px', fontWeight: 700, color: COLORS.textDark, lineHeight: '1.4' }}>
              <p style={{ margin: '2px 0' }}>{data.supplier.address}</p>
              <p style={{ margin: '2px 0' }}>
                NUIT: <span style={{ fontWeight: 800 }}>{data.supplier.nuit}</span> 
                {data.supplier.license ? ` | Alvará: ${data.supplier.license}` : ''}
              </p>
              <p style={{ margin: '2px 0' }}>Email: {data.supplier.email} | Tel: {data.supplier.phone}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              {data.supplier.isVerified && (
                <div style={{ 
                  backgroundColor: COLORS.teal, 
                  color: COLORS.white, 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <CheckCircle2 size={12} />
                  Fornecedor Verificado
                </div>
              )}
              <div style={{ fontSize: '10px', color: COLORS.textMuted, fontWeight: 600 }}>
                Procurement ID: SX-SUP-{data.supplier.nuit.slice(-4)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '16px', 
            overflow: 'hidden',
            border: `1px solid ${COLORS.borderGray}`,
            backgroundColor: COLORS.lightGray,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginBottom: '5px'
          }}>
            <SupplyXLogo size="lg" showText={false} />
          </div>
          <div style={{ 
            fontSize: '9px', 
            color: COLORS.textMuted, 
            textAlign: 'right', 
            fontWeight: 700,
            lineHeight: '1.3'
          }}>
            SupplyX Digital Global Platform<br />
            Business Documentation Official ID<br />
            Certified by Manhate Link África, Lda<br />
            Valid within the SupplyX Ecosystem
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', height: '1px', backgroundColor: COLORS.borderGray, width: '100%', marginBottom: '25px' }}></div>

      {/* Quotation Header Details */}
      <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <div style={{ 
          backgroundColor: COLORS.teal, 
          color: COLORS.white, 
          padding: '12px 20px', 
          borderRadius: '8px', 
          flex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Cotação Nº:</span>
          <span style={{ fontWeight: 900, fontSize: '16px' }}>{data.quoteNumber}</span>
        </div>
        <div style={{ 
          backgroundColor: COLORS.darkBlue, 
          color: COLORS.white, 
          padding: '12px 20px', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <span style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Data:</span>
          <span style={{ fontWeight: 900, fontSize: '16px' }}>{data.date}</span>
        </div>
      </div>

      {/* Client & Contact Info Grid */}
      <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px', marginBottom: '30px' }}>
        <div>
          <div style={{ 
            backgroundColor: COLORS.teal, 
            color: COLORS.white, 
            padding: '8px 15px', 
            fontSize: '10px', 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            borderRadius: '6px 6px 0 0'
          }}>
            Informação do Cliente
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: COLORS.lightGray, 
            border: `1px solid ${COLORS.borderGray}`, 
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            minHeight: '120px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ color: COLORS.textMuted, fontSize: '10px', fontWeight: 700, padding: '4px 0', width: '100px', textTransform: 'uppercase' }}>Nome:</td>
                  <td style={{ fontWeight: 800, color: COLORS.darkBlue }}>{data.client.name}</td>
                </tr>
                <tr>
                  <td style={{ color: COLORS.textMuted, fontSize: '10px', fontWeight: 700, padding: '4px 0', textTransform: 'uppercase' }}>NUIT:</td>
                  <td style={{ fontWeight: 700 }}>{data.client.nuit}</td>
                </tr>
                <tr>
                  <td style={{ color: COLORS.textMuted, fontSize: '10px', fontWeight: 700, padding: '4px 0', textTransform: 'uppercase' }}>Endereço:</td>
                  <td style={{ fontWeight: 700 }}>{data.client.address}</td>
                </tr>
                <tr>
                  <td style={{ color: COLORS.textMuted, fontSize: '10px', fontWeight: 700, padding: '4px 0', textTransform: 'uppercase' }}>ID Platform:</td>
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
            padding: '8px 15px', 
            fontSize: '10px', 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            borderRadius: '6px 6px 0 0'
          }}>
            Contacto
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: COLORS.lightGray, 
            border: `1px solid ${COLORS.borderGray}`, 
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            minHeight: '120px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ color: COLORS.textMuted, fontSize: '10px', fontWeight: 700, padding: '4px 0', width: '80px', textTransform: 'uppercase' }}>Email:</td>
                  <td style={{ fontWeight: 700, fontSize: '11px' }}>{data.client.email}</td>
                </tr>
                <tr>
                  <td style={{ color: COLORS.textMuted, fontSize: '10px', fontWeight: 700, padding: '4px 0', textTransform: 'uppercase' }}>Tel:</td>
                  <td style={{ fontWeight: 700 }}>{data.client.phone}</td>
                </tr>
                <tr>
                  <td style={{ color: COLORS.textMuted, fontSize: '10px', fontWeight: 700, padding: '4px 0', textTransform: 'uppercase' }}>Gestor:</td>
                  <td style={{ fontWeight: 700 }}>Central Procurement</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', marginBottom: '20px' }}>
        <p style={{ 
          fontSize: '11px', 
          fontWeight: 900, 
          color: COLORS.darkBlue, 
          textTransform: 'uppercase', 
          letterSpacing: '0.5px',
          margin: '0 0 10px 5px'
        }}>
          Validade: <span style={{ color: COLORS.teal }}>Esta cotação é válida por {data.validityDays} dias</span>
        </p>
      </div>

      {/* Products Table */}
      <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', marginBottom: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ backgroundColor: COLORS.darkBlue, color: COLORS.white }}>
              <th style={{ padding: '12px 10px', textAlign: 'left', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}>Descrição do Material</th>
              <th style={{ padding: '12px 10px', textAlign: 'center', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}>Quant.</th>
              <th style={{ padding: '12px 10px', textAlign: 'center', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}>Un.</th>
              <th style={{ padding: '12px 10px', textAlign: 'right', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}>P. Unitário</th>
              <th style={{ padding: '12px 10px', textAlign: 'center', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}>IVA (%)</th>
              <th style={{ padding: '12px 10px', textAlign: 'right', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', backgroundColor: COLORS.teal }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={`${item.description}_${index}`} style={{ 
                backgroundColor: index % 2 === 0 ? COLORS.white : COLORS.lightGray,
                borderBottom: `1px solid ${COLORS.borderGray}`
              }}>
                <td style={{ padding: '10px', fontWeight: 800 }}>{item.description}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>{item.quantity.toFixed(2)}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', fontSize: '9px' }}>{item.unit}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.unitPrice)}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>{item.vatPer.toFixed(2)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 900, color: COLORS.darkBlue }}>{formatCurrency(item.quantity * item.unitPrice * (1 + item.vatPer / 100))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary and Footer Info */}
      <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Notes Box */}
          <div style={{ 
            padding: '15px', 
            backgroundColor: COLORS.lightGray, 
            border: `1px solid ${COLORS.borderGray}`, 
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                backgroundColor: COLORS.teal, 
                borderRadius: '6px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: COLORS.white
              }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: COLORS.darkBlue }}>
                  Informação de Verificação
                </p>
                <p style={{ margin: 0, fontSize: '9px', fontWeight: 600, color: COLORS.textMuted, fontStyle: 'italic' }}>
                  A SupplyX Platform garante a autenticidade deste fornecedor e a integridade documental desta cotação. 
                  Os preços apresentados são finais para processamento via plataforma.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            {/* QR Code Validation */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                border: `1px solid ${COLORS.borderGray}`, 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '5px'
              }}>
                <QrCode size={64} color={COLORS.darkBlue} />
              </div>
              <p style={{ fontSize: '8px', fontWeight: 800, margin: 0, color: COLORS.textMuted }}>VALIDAÇÃO DIGITAL</p>
            </div>

            {/* Banking and Wallets Details */}
            <div style={{ flex: 1, minWidth: '0' }}>
              <p style={{ fontSize: '10px', fontWeight: 800, color: COLORS.darkBlue, textTransform: 'uppercase', marginBottom: '8px' }}>Dados de Pagamento (Fornecedor)</p>
              
              {data.supplier.bankAccounts && data.supplier.bankAccounts.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <p style={{ fontSize: '9px', fontWeight: 800, color: COLORS.teal, textTransform: 'uppercase', marginBottom: '4px' }}>Contas Bancárias</p>
                  {data.supplier.bankAccounts.map((acc, i) => (
                    <div key={i} style={{ fontSize: '9px', fontWeight: 700, color: COLORS.textDark, marginBottom: '5px', paddingLeft: '5px', borderLeft: `2px solid ${COLORS.teal}` }}>
                      <p style={{ margin: '1px 0' }}>{acc.bankName}: {acc.accountNumber} {acc.nib ? `(NIB: ${acc.nib})` : ''}</p>
                    </div>
                  ))}
                </div>
              )}

              {data.supplier.mobileWallets && data.supplier.mobileWallets.length > 0 && (
                <div>
                  <p style={{ fontSize: '9px', fontWeight: 800, color: COLORS.teal, textTransform: 'uppercase', marginBottom: '4px' }}>Carteiras Móveis</p>
                  {data.supplier.mobileWallets.map((wallet, i) => (
                    <div key={i} style={{ fontSize: '9px', fontWeight: 700, color: COLORS.textDark, marginBottom: '5px', paddingLeft: '5px', borderLeft: `2px solid ${COLORS.teal}` }}>
                      <p style={{ margin: '1px 0' }}>{wallet.provider}: {wallet.number} ({wallet.name})</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Totals Summary Column */}
        <div>
          <div style={{ border: `1px solid ${COLORS.borderGray}`, borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '15px', backgroundColor: COLORS.lightGray, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: COLORS.textMuted }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#e53e3e', margin: '8px 0' }}>
                <span>Desconto Total {discountPercent > 0 ? `(${discountPercent}%)` : ''}:</span>
                <span>-{formatCurrency(totalDiscount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: COLORS.textDark }}>
                <span>IVA Total:</span>
                <span>{formatCurrency(totalVAT)}</span>
              </div>
            </div>
            <div style={{ 
              padding: '20px 15px', 
              backgroundColor: COLORS.darkBlue, 
              color: COLORS.white, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '5px'
            }}>
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>TOTAL FINAL</span>
              <span style={{ fontSize: '24px', fontWeight: 900 }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center', position: 'relative' }}>
            <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${COLORS.borderGray}`, marginBottom: '10px' }}>
              {data.supplier.signatureURL && (
                <img 
                  src={data.supplier.signatureURL} 
                  alt="Signature" 
                  style={{ maxHeight: '60px' }} 
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              )}
              {data.supplier.stampURL && (
                <img 
                  src={data.supplier.stampURL} 
                  alt="Stamp" 
                  style={{ maxHeight: '60px', opacity: 0.8, marginLeft: '20px' }} 
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            <p style={{ fontSize: '9px', fontWeight: 800, margin: 0, color: COLORS.textMuted, textTransform: 'uppercase' }}>Assinatura & Carimbo Eletrónico</p>
            <p style={{ fontSize: '7px', fontWeight: 600, margin: '2px 0', color: COLORS.textMuted }}>Verificado via SupplyX Platform</p>
          </div>
        </div>
      </div>

      {/* Corporate Footer */}
      <div 
        id="quotation-corporate-footer"
        style={{ 
          position: 'absolute', 
          zIndex: 10,
          pointerEvents: 'auto',
          bottom: '20mm', 
          left: '20mm', 
          right: '20mm',
          borderTop: `1px solid ${COLORS.borderGray}`,
          paddingTop: '15px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ fontSize: '9px', color: COLORS.textMuted, fontWeight: 700 }}>
          {data.supplier.address} | Tel: {data.supplier.phone} | Email: {data.supplier.email}<br />
          <span style={{ fontSize: '8px', opacity: 0.8 }}>Gestão Documental & Intermediação: Manhate Link África, Lda - Registada em Moçambique sob Nuit 400123456</span><br />
          <span style={{ fontSize: '7px', opacity: 0.6 }}>Este documento é gerado automaticamente pela plataforma SupplyX e possui validade jurídica para efeitos de cotação em território Moçambicano.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, fontStyle: 'italic' }}>Powered by</span>
          <SupplyXLogo size="sm" showText={false} />
        </div>
      </div>
    </div>
  );
};

export default QuotationDocument;
