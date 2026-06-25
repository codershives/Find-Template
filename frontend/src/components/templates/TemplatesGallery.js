'use client';

import Image from 'next/image';
import Link from 'next/link';
import { StarFilled } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import fashionImage from '@/assets/images/images/fashion.png';
import photographerImage from '@/assets/images/images/photo.png';
import startupImage from '@/assets/images/images/startup.jpg';
import fineDineImage from '@/assets/images/images/dinner.jpg';
import cafeImage from '@/assets/images/images/cafe.png';
import weddingImage from '@/assets/images/images/wedding.png';
import digitalImage from '@/assets/images/images/digital.jpg';
import jewelryImage from '@/assets/images/images/comm.png';

const templates = [
  { name: 'Fashion Store', type: 'Ecommerce', category: 'Ecommerce', rating: 4.8, image: fashionImage },
  { name: 'Photographer', type: 'Photography', category: 'Photography', rating: 4.7, image: photographerImage },
  { name: 'Startup Landing', type: 'Landing Business', category: 'Business', rating: 4.6, image: startupImage },
  { name: 'Fine Dine', type: 'Restaurant', category: 'Restaurant', rating: 4.9, image: fineDineImage },
  { name: 'Cafe and Bakery', type: 'Restaurant', category: 'Restaurant', rating: 4.5, image: cafeImage },
  { name: 'Wedding Gallery', type: 'Photography', category: 'Photography', rating: 4.8, image: weddingImage },
  { name: 'Digital Marketing', type: 'Agency', category: 'Agency', rating: 4.7, image: digitalImage },
  { name: 'Jewellery and Luxury', type: 'Ecommerce', category: 'Ecommerce', rating: 4.9, image: jewelryImage },
];

const categories = ['All', 'Ecommerce', 'Photography', 'Business', 'Restaurant', 'Agency'];

export default function TemplatesGallery() {
  const [activeCategory, setActiveCategory] = useState('All');

  const categoryStats = useMemo(() => {
    return categories.map((category) => ({
      category,
      count: category === 'All' ? templates.length : templates.filter((template) => template.category === category).length,
    }));
  }, []);

  const filteredTemplates = activeCategory === 'All'
    ? templates
    : templates.filter((template) => template.category === activeCategory);

  return (
    <main className="templates-page">
      <section className="templates-hero">
        <div className="section-kicker">FindTemplates Templates</div>
        <h1>Premium website templates for every business launch.</h1>
        <p>
          Explore polished, conversion-ready templates for ecommerce stores, photographers, restaurants,
          agencies, luxury brands, and startup landing pages. Every template is crafted to feel modern,
          fast, and business-ready.
        </p>
      </section>

      <section className="template-category-section">
        <div className="category-grid">
          {categoryStats.map((item) => (
            <button
              type="button"
              className={`category-card ${activeCategory === item.category ? 'active' : ''}`}
              key={item.category}
              onClick={() => setActiveCategory(item.category)}
            >
              <span>{item.category}</span>
              <strong>{item.count}</strong>
              <small>{item.count === 1 ? 'Template' : 'Templates'}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="templates-list-section">
        <div className="templates-page-grid">
          {filteredTemplates.map((template) => (
            <article className="full-template-card" key={template.name}>
              <div className="full-template-image-wrap">
                <Image src={template.image} alt={template.name} className="full-template-image" />
                <div className="template-rating"><StarFilled /> {template.rating}</div>
              </div>
              <div className="full-template-content">
                <div>
                  <h3>{template.name}</h3>
                  <p>{template.type}</p>
                </div>
                <div className="template-price-row">
                  <strong>$199</strong>
                  <Link href="/auth/signup" className="premium-btn-dark">Buy Now</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
