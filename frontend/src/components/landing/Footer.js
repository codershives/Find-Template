'use client';

import Link from 'next/link';
import { FacebookFilled, InstagramFilled, LinkedinFilled, TwitterOutlined } from '@ant-design/icons';

export default function Footer() {
  return (
    <footer className="footer-premium">
      <div className="footer-grid footer-grid-compact">
        <div>
          <h2 style={{ fontSize: 34, marginTop: 0 }}>FindTemplates</h2>
          <p style={{ color: '#94a3b8', lineHeight: 1.8, maxWidth: 520 }}>
            Premium website templates and workspace tools for freelancers, businesses, agencies, restaurants, photographers, and ecommerce brands.
          </p>
          <div className="social-row">
            <span className="social-icon"><FacebookFilled /></span>
            <span className="social-icon"><InstagramFilled /></span>
            <span className="social-icon"><LinkedinFilled /></span>
            <span className="social-icon"><TwitterOutlined /></span>
          </div>
        </div>
        <div>
          <h3>Legal</h3>
          <Link className="footer-link" href="/terms-and-conditions">Terms and Conditions</Link>
          <Link className="footer-link" href="/privacy-policy">Privacy Policy</Link>
          <Link className="footer-link" href="/refund-policy">Refund Policy</Link>
        </div>
        <div>
          <h3>Contact</h3>
          <p style={{ color: '#94a3b8', lineHeight: 1.8 }}>
            WASIF AHMED<br />
            195 Huntingford Trail<br />
            Woodstock ON N4T 0M4, Canada<br />
            <a href="mailto:admin@findtempletes.com">admin@findtempletes.com</a><br />
            <a href="tel:18254452843">18254452843</a>
          </p>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 44, paddingTop: 24, color: '#64748b' }}>
        © FindTemplates. All rights reserved.
      </div>
    </footer>
  );
}
