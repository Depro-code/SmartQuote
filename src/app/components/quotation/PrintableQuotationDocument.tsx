import { forwardRef } from 'react';
import type { CSSProperties } from 'react';
import type { Quotation, Settings } from '../../lib/types';
import { amountToWords, formatInvoiceCurrency, formatInvoiceDate } from '../invoice/invoiceUtils';

interface PrintableQuotationDocumentProps {
  quotation: Quotation;
  settings: Settings;
}

const bodyFontFamily = 'Arial, Helvetica, sans-serif';
const headingFontFamily = '"Arial Black", Arial, Helvetica, sans-serif';

const pageStyle: CSSProperties = {
  position: 'relative',
  width: '794px',
  minHeight: '1123px',
  margin: '0 auto',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  color: '#111111',
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.14)',
  fontFamily: bodyFontFamily,
};

const accentGraphicStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '278px',
  zIndex: 3,
  pointerEvents: 'none',
};

const bottomAccentBaseStyle: CSSProperties = {
  position: 'absolute',
  right: 0,
  bottom: 0,
  width: '180px',
  height: '160px',
  pointerEvents: 'none',
};

const tableCellBase: CSSProperties = {
  border: '1px solid #6f6f6f',
  padding: '4px 6px',
  fontSize: '12px',
  lineHeight: 1.25,
  verticalAlign: 'top',
};

const metadataLabelStyle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
};

export const PrintableQuotationDocument = forwardRef<HTMLDivElement, PrintableQuotationDocumentProps>(
  function PrintableQuotationDocument({ quotation, settings }, ref) {
    const totalInWords = amountToWords(quotation.grandTotal, settings.currency)
      .replace(/\bXAF\b/i, 'francs')
      .replace(/\bCFA\b/i, 'francs');

    return (
      <div ref={ref} style={pageStyle}>
        <svg viewBox="0 0 794 278" preserveAspectRatio="none" style={accentGraphicStyle} aria-hidden="true">
          <defs>
            <clipPath id="top-left-accent-clip">
              <path d="M18 10 H794 V42 H470 C392 42 323 53 262 80 C198 108 144 150 92 206 C60 239 35 252 18 252 Z" />
            </clipPath>
          </defs>

          <path
            d="M18 10 H794 V42 H470 C392 42 323 53 262 80 C198 108 144 150 92 206 C60 239 35 252 18 252 Z"
            fill="#a9b92f"
          />

          <g clipPath="url(#top-left-accent-clip)">
            <rect
              x="97"
              y="18"
              width="24"
              height="188"
              rx="12"
              ry="12"
              fill="#111111"
              transform="rotate(39 97 18)"
            />
            <rect
              x="141"
              y="2"
              width="26"
              height="236"
              rx="13"
              ry="13"
              fill="#18c2d0"
              transform="rotate(39 141 2)"
            />
          </g>
        </svg>

        <div
          style={{
            position: 'relative',
            zIndex: 4,
            padding: '12px 28px 28px',
          }}
        >
          <header style={{ textAlign: 'center', paddingTop: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={`${settings.companyName} logo`}
                  style={{ width: '52px', height: '52px', objectFit: 'contain' }}
                />
              ) : null}
              <h1
                style={{
                  margin: 0,
                  fontSize: '34px',
                  fontWeight: 900,
                  fontFamily: headingFontFamily,
                  letterSpacing: '-0.03em',
                  textTransform: 'uppercase',
                }}
              >
                {settings.companyName}
              </h1>
            </div>

            <p
              style={{
                margin: '2px 0 0',
                fontSize: '16px',
                fontWeight: 900,
                fontFamily: headingFontFamily,
                textTransform: 'uppercase',
              }}
            >
              {settings.headerLine1}
            </p>

            <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 700, fontFamily: bodyFontFamily }}>{settings.headerLine2}</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 700, fontFamily: bodyFontFamily }}>{settings.headerLine3}</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 700, fontFamily: bodyFontFamily }}>{settings.address}</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 700, fontFamily: bodyFontFamily }}>Tel: {settings.phone}</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 700, fontFamily: bodyFontFamily }}>Email: {settings.email}</p>
          </header>

          <div
            style={{
              marginTop: '10px',
              borderTop: '2px solid #1f1f1f',
              borderBottom: '2px solid #1f1f1f',
              padding: '12px 18px',
              minHeight: '88px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, fontFamily: headingFontFamily }}>
                DATE: {formatInvoiceDate(quotation.issueDate)}
              </p>
            </div>

            <div style={{ marginTop: '8px' }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 900, fontFamily: headingFontFamily, textAlign: 'center' }}>
                {settings.invoiceTitle}: {quotation.quoteNumber}
              </p>
              <p style={{ margin: '10px 0 0', fontSize: '18px', textAlign: 'left', fontFamily: bodyFontFamily }}>
                <span style={{ fontWeight: 700, fontSize: '16px', fontFamily: headingFontFamily }}>CLIENT:</span>{' '}
                <span style={{ fontWeight: 900, fontFamily: headingFontFamily }}>{quotation.customerName}</span>
              </p>
            </div>
          </div>

          <section style={{ marginTop: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#f7f7f7' }}>
              <thead>
                <tr style={{ backgroundColor: '#d7de72' }}>
                  <th style={{ ...tableCellBase, width: '8%', fontSize: '15px', fontWeight: 900, fontFamily: headingFontFamily, textAlign: 'center' }}>
                    S/N
                  </th>
                  <th style={{ ...tableCellBase, width: '50%', fontSize: '15px', fontWeight: 900, fontFamily: headingFontFamily, textAlign: 'center' }}>
                    DESCRIPTION
                  </th>
                  <th style={{ ...tableCellBase, width: '10%', fontSize: '15px', fontWeight: 900, fontFamily: headingFontFamily, textAlign: 'center' }}>
                    QTY
                  </th>
                  <th style={{ ...tableCellBase, width: '14%', fontSize: '15px', fontWeight: 900, fontFamily: headingFontFamily, textAlign: 'center' }}>
                    U. P
                  </th>
                  <th style={{ ...tableCellBase, width: '18%', fontSize: '15px', fontWeight: 900, fontFamily: headingFontFamily, textAlign: 'center' }}>
                    AMOUNT
                  </th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item, index) => (
                  <tr key={`${item.productId}-${index}`}>
                    <td style={{ ...tableCellBase, textAlign: 'center', fontWeight: 700, fontFamily: bodyFontFamily }}>{index + 1}</td>
                    <td style={{ ...tableCellBase, fontWeight: 700, fontFamily: bodyFontFamily }}>{item.nameSnapshot}</td>
                    <td style={{ ...tableCellBase, textAlign: 'center', fontWeight: 700, fontFamily: bodyFontFamily }}>
                      {String(item.quantity).padStart(2, '0')}
                    </td>
                    <td style={{ ...tableCellBase, textAlign: 'right', fontWeight: 700, fontFamily: bodyFontFamily }}>
                      {formatInvoiceCurrency(item.unitPriceSnapshot, settings.currency)}
                    </td>
                    <td style={{ ...tableCellBase, textAlign: 'right', fontWeight: 700, fontFamily: bodyFontFamily }}>
                      {formatInvoiceCurrency(item.lineTotal, settings.currency)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      ...tableCellBase,
                      padding: '6px 12px',
                      fontSize: '18px',
                      fontWeight: 900,
                      fontFamily: headingFontFamily,
                      textAlign: 'center',
                      textTransform: 'uppercase',
                    }}
                  >
                    Total Amount
                  </td>
                  <td
                    style={{
                      ...tableCellBase,
                      padding: '6px 12px',
                      fontSize: '18px',
                      fontWeight: 900,
                      fontFamily: headingFontFamily,
                      textAlign: 'right',
                    }}
                  >
                    {formatInvoiceCurrency(quotation.grandTotal, settings.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: 900, fontFamily: headingFontFamily }}>
            Amount in words:{' '}
            <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: bodyFontFamily }}>
              {totalInWords.charAt(0).toUpperCase()}
              {totalInWords.slice(1)}
            </span>
          </div>

          <footer style={{ marginTop: '18px', position: 'relative', paddingBottom: '20px' }}>
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
                <div
                  style={{
                    width: '82px',
                    height: '82px',
                    margin: '14px auto 0',
                    borderRadius: '50%',
                    border: '2px solid #3b82f6',
                    position: 'relative',
                    color: '#3b82f6',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: '10px',
                      borderRadius: '50%',
                      border: '1px solid #3b82f6',
                    }}
                  />
                  <p
                    style={{
                      margin: 0,
                      position: 'absolute',
                      top: '31px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '100%',
                      fontSize: '8px',
                      fontWeight: 700,
                      fontFamily: bodyFontFamily,
                      letterSpacing: '0.08em',
                    }}
                  >
                    {settings.companyName}
                  </p>
                </div>
                <p
                  style={{
                    margin: '-28px 0 0',
                    fontSize: '28px',
                    fontFamily: '"Brush Script MT", "Segoe Script", cursive',
                    color: '#2563eb',
                    transform: 'rotate(-7deg)',
                  }}
                >
                  Signature
                </p>
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

        <div style={bottomAccentBaseStyle}>
          <div
            style={{
              position: 'absolute',
              right: '-22px',
              bottom: '54px',
              width: '164px',
              height: '24px',
              backgroundColor: '#0b0b0b',
              transform: 'rotate(-39deg)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '8px',
              bottom: '28px',
              width: '154px',
              height: '16px',
              backgroundColor: '#18bfd0',
              transform: 'rotate(-39deg)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '34px',
              bottom: '52px',
              width: '124px',
              height: '18px',
              backgroundColor: '#a4b51f',
              transform: 'rotate(-39deg)',
            }}
          />
        </div>
      </div>
    );
  },
);
