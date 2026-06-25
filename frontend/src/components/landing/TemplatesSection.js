'use client';

import Image from 'next/image';
import Link from 'next/link';
import storeImage from '@/assets/images/images/fashion.png';
import photographerImage from '@/assets/images/images/photo.png';
import startupImage from '@/assets/images/images/startup.jpg';

const templates = [
  { title: 'Fashion Store', type: 'Ecommerce', image: storeImage },
  { title: 'Photographer', type: 'Portfolio', image: photographerImage },
  { title: 'Startup Landing', type: 'Business', image: startupImage },
];

export default function TemplatesSection() {
  return (
    <section id="templates" className="section alt-section">
      <div className="section-header">
        <div className="section-kicker">Templates</div>
        <h2 className="section-title">Premium templates for every launch.</h2>
        <p className="section-text">Start with a polished website layout. You can add more templates later from your assets and database.</p>
      </div>
      <div className="template-grid">
        {templates.map((template) => (
          <article className="template-card" key={template.title}>
            <div className="template-image-wrap">
              <Image src={template.image} alt={template.title} className="template-image" />
            </div>
            <div className="template-content">
              <div>
                <h3 className="template-name">{template.title}</h3>
                <div className="template-type">{template.type}</div>
              </div>
              <Link href="/auth/signup" className="premium-btn-dark">Buy Now</Link>
            </div>
          </article>
        ))}
      </div>
      <div className="center-action">
        <Link href="/templates" className="premium-btn-dark">View All</Link>
      </div>
    </section>
  );
}
