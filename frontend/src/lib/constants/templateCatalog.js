import fashionImage from '@/assets/images/images/fashion.png';
import photographerImage from '@/assets/images/images/photo.png';
import startupImage from '@/assets/images/images/startup.jpg';
import fineDineImage from '@/assets/images/images/dinner.jpg';
import cafeImage from '@/assets/images/images/cafe.png';
import weddingImage from '@/assets/images/images/wedding.png';
import digitalImage from '@/assets/images/images/digital.jpg';
import jewelryImage from '@/assets/images/images/comm.png';

export const TEMPLATE_CATALOG = [
  { key: 'fashion-store', name: 'Fashion Store', type: 'Ecommerce', category: 'Ecommerce', rating: 4.8, price: 199, image: fashionImage },
  { key: 'photographer', name: 'Photographer', type: 'Photography', category: 'Photography', rating: 4.7, price: 199, image: photographerImage },
  { key: 'startup-landing', name: 'Startup Landing', type: 'Landing Business', category: 'Business', rating: 4.6, price: 199, image: startupImage },
  { key: 'fine-dine', name: 'Fine Dine', type: 'Restaurant', category: 'Restaurant', rating: 4.9, price: 199, image: fineDineImage },
  { key: 'cafe-and-bakery', name: 'Cafe and Bakery', type: 'Restaurant', category: 'Restaurant', rating: 4.5, price: 199, image: cafeImage },
  { key: 'wedding-gallery', name: 'Wedding Gallery', type: 'Photography', category: 'Photography', rating: 4.8, price: 199, image: weddingImage },
  { key: 'digital-marketing', name: 'Digital Marketing', type: 'Agency', category: 'Agency', rating: 4.7, price: 199, image: digitalImage },
  { key: 'jewellery-and-luxury', name: 'Jewellery and Luxury', type: 'Ecommerce', category: 'Ecommerce', rating: 4.9, price: 199, image: jewelryImage },
];

export const TEMPLATE_CATEGORIES = ['All', 'Ecommerce', 'Photography', 'Business', 'Restaurant', 'Agency'];
