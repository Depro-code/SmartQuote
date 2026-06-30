import { forwardRef } from 'react';
import type { CSSProperties } from 'react';
import type { Quotation, Settings } from '../../lib/types';
import { amountToWords, formatInvoiceCurrency, formatInvoiceDate } from './invoiceUtils';

interface PrintableCashReceiptDocumentProps {
  quotation: Quotation;
  settings: Settings;
}

const bodyFontFamily = 'Arial, Helvetica, sans-serif';
const headingFontFamily = '"Arial Black", Arial, sans-serif';
const receiptHeaderFontFamily = '"Arial Black", "Franklin Gothic Heavy", "Helvetica Neue", sans-serif';
const cellBorder = '1px solid #aaaaaa';

export const PrintableCashReceiptDocument = forwardRef<HTMLDivElement, PrintableCashReceiptDocumentProps>(
  function PrintableCashReceiptDocument({ quotation, settings }, ref) {
    const totalInWords = amountToWords(quotation.grandTotal, settings.currency)
      .replace(/\bXAF\b/i, 'francs')
      .replace(/\bCFA\b/i, 'francs');
    const hasTax = Boolean(quotation.taxRate && quotation.taxRate > 0);

    const tableCellStyle: CSSProperties = {
      border: cellBorder,
      padding: '8px 6px 16px',
      fontSize: '18px',
      lineHeight: '18px',
      fontFamily: bodyFontFamily,
      verticalAlign: 'top',
    };

    const tableHeadStyle: CSSProperties = {
      ...tableCellStyle,
      backgroundColor: '#029834',
      color: '#ffffff',
      fontWeight: 900,
      textAlign: 'center',
      fontFamily: headingFontFamily,
    };

    return (
      <div
        ref={ref}
        style={{
          width: '794px',
          minHeight: '1123px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          boxShadow: '0 24px 60px rgba(0,0,0,0.14)',
          overflow: 'hidden',
          color: '#1a1a1a',
          fontFamily: bodyFontFamily,
        }}
      >
        <div style={{ position: 'relative', width: '100%', backgroundColor: '#016432', boxSizing: 'border-box', overflow: 'hidden' }}>
          <div style={{ marginTop: '0px', height: '16px', backgroundColor: '#029834', marginLeft: '-28px', marginBottom: '20px', padding: '20px 28px 0px', width: 'calc(100% + 56px)' }} />

          {/* Top-right diagonal dark shape */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '0', height: '0', borderStyle: 'solid', borderWidth: '0 50px 40px 0', borderColor: 'transparent #029834 transparent transparent' }} />

          {/* Company name */}
          <div style={{
            fontSize: '17px',
            fontWeight: 900,
            color: '#ffffff',
            fontFamily: receiptHeaderFontFamily,
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            WebkitFontSmoothing: 'antialiased',
            textRendering: 'optimizeLegibility',
          }}>
            AMAZING MEDICAL EQUIPMENT NETWORK- CAM LIMITED (AMEN-CAM LTD)
          </div>

          {/* Yellow subtitle */}
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#C3D34F',
            fontFamily: receiptHeaderFontFamily,
            textAlign: 'center',
            marginTop: '3px',
            letterSpacing: '0.03em',
          }}>
            Dealer in; Medical Equipment Materials Contracts Import and General Commerce
          </div>

          {/* Two-column info row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginTop: '6px', fontSize: '11px', color: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ textAlign: 'right' }}>
              <div><span style={{ fontWeight: 700 }}>Tax payer's No.:</span> {'M050214422523x'}</div>
              <div><span style={{ fontWeight: 700 }}>CNPS No.:</span> {'370-0113792-000-R'}</div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div><span style={{ fontWeight: 700 }}>Email:</span> {settings.email}</div>
              <div><span style={{ fontWeight: 700 }}>P.O.Box</span> 5210, Nkwen, Bamenda</div>
              <div><span style={{ fontWeight: 700 }}>Tel:</span> {settings.phone}</div>
            </div>
          </div>


          {/* Thin bright green line */}
          <div style={{ height: '10px', backgroundColor: '#029834', width: 'calc(100% + 56px)', marginLeft: '-28px', marginTop: '10px' }} />
        </div>

        <div style={{ padding: '12px 24px', borderBottom: '2px solid #1a5c1a' }}>
          <div style={{ textAlign: 'right', fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>
            DATE: {formatInvoiceDate(quotation.issueDate)}
          </div>
          <div style={{ textAlign: 'center', fontSize: '28px', fontWeight: 900, fontFamily: headingFontFamily, color: '#1a1a1a' }}>
            Cash Receipt Voucher
          </div>
          <div style={{ textAlign: 'left', fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>
            RECEIPT NO: {quotation.quoteNumber}
          </div>
          <div style={{ textAlign: 'left', fontSize: '18px', fontWeight: 700, marginTop: '6px' }}>
            CLIENT: {quotation.customerName}
          </div>
        </div>

        <div style={{ padding: '18px 24px 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ ...tableHeadStyle, width: '8%' }}>S/N</th>
                <th style={{ ...tableHeadStyle, width: '50%' }}>DESCRIPTION</th>
                <th style={{ ...tableHeadStyle, width: '10%' }}>QTY</th>
                <th style={{ ...tableHeadStyle, width: '14%' }}>U.P</th>
                <th style={{ ...tableHeadStyle, width: '18%' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item, index) => (
                <tr key={`${item.nameSnapshot}-${index}`} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff' }}>
                  <td style={{ ...tableCellStyle, textAlign: 'center', fontWeight: 700 }}>{index + 1}</td>
                  <td style={{ ...tableCellStyle, fontWeight: 700 }}>{item.nameSnapshot}</td>
                  <td style={{ ...tableCellStyle, textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 700 }}>
                    {formatInvoiceCurrency(item.unitPriceSnapshot, settings.currency)}
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 700 }}>
                    {formatInvoiceCurrency(item.lineTotal, settings.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <table style={{ width: '46%', marginLeft: 'auto', marginTop: '14px', borderCollapse: 'collapse' }}>
            <tbody>
              {hasTax ? (
                <>
                  <tr>
                    <td style={{ ...tableCellStyle, fontWeight: 800 }}>SUB TOTAL</td>
                    <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 800 }}>
                      {formatInvoiceCurrency(quotation.subTotal, settings.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ ...tableCellStyle, fontWeight: 800 }}>VAT ({quotation.taxRate}%)</td>
                    <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 800 }}>
                      {formatInvoiceCurrency(quotation.taxAmount || 0, settings.currency)}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#f5c518', fontWeight: 900, fontSize: '22px' }}>
                    <td style={{ ...tableCellStyle, fontWeight: 900, fontSize: '22px' }}>TOTAL AMOUNT</td>
                    <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 900, fontSize: '22px' }}>
                      {formatInvoiceCurrency(quotation.grandTotal, settings.currency)}
                    </td>
                  </tr>
                </>
              ) : (
                <tr style={{ backgroundColor: '#f5c518', fontWeight: 900, fontSize: '18px' }}>
                  <td style={{ ...tableCellStyle, textAlign: 'center', fontWeight: 900, fontSize: '18px' }}>TOTAL AMOUNT</td>
                  <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 900, fontSize: '18px' }}>
                    {formatInvoiceCurrency(quotation.grandTotal, settings.currency)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ marginTop: '16px', fontSize: '18px', fontWeight: 700 }}>
            Amount in words: {totalInWords}
          </div>

          <footer style={{ marginTop: `${quotation.items.length <= 8 ? '98px' : '18px'}`, position: 'relative', paddingBottom: '20px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                alignItems: 'start',
                columnGap: '8px',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 900, fontFamily: headingFontFamily }}>Service provider</p>
              </div>

              <div style={{ textAlign: 'center', paddingTop: '8px' }}>
                <p style={{ margin: 0, fontSize: '12px', fontFamily: bodyFontFamily }}>Your Satisfaction Is Our First Priority</p>
                <p style={{ margin: '6px 0 0', fontSize: '12px', fontFamily: bodyFontFamily }}>Contact Us Now</p>
                <p style={{ margin: '8px 0 0', fontSize: '12px', fontFamily: bodyFontFamily }}>Tel: {settings.phone}</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', fontFamily: bodyFontFamily }}>Email us at {settings.email}</p>
              </div>

              <div style={{ textAlign: 'center', paddingTop: '4px' }}>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 900, fontFamily: headingFontFamily }}>Customer</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  },
);
