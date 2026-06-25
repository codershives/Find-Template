export const TEMPLATE_CATALOG = {
  'fashion-store': { name: 'Fashion Store', type: 'Ecommerce', priceCents: 19900 },
  photographer: { name: 'Photographer', type: 'Photography', priceCents: 19900 },
  'startup-landing': { name: 'Startup Landing', type: 'Landing Business', priceCents: 19900 },
  'fine-dine': { name: 'Fine Dine', type: 'Restaurant', priceCents: 19900 },
  'cafe-and-bakery': { name: 'Cafe and Bakery', type: 'Restaurant', priceCents: 19900 },
  'wedding-gallery': { name: 'Wedding Gallery', type: 'Photography', priceCents: 19900 },
  'digital-marketing': { name: 'Digital Marketing', type: 'Agency', priceCents: 19900 },
  'jewellery-and-luxury': { name: 'Jewellery and Luxury', type: 'Ecommerce', priceCents: 19900 },
};

export const getTemplateByKey = (templateKey) => TEMPLATE_CATALOG[templateKey] || null;
