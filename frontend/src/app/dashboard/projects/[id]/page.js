'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Form, Input, Select, Spin, Tabs, Tag, Upload } from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  DollarOutlined,
  DownloadOutlined,
  EditOutlined,
  ProjectOutlined,
  SaveOutlined,
  SyncOutlined,
  UploadOutlined,
  UserOutlined,
  AppstoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { getMe } from '@/lib/api/auth';
import { getProject, updateProject, updateProjectStatus, updateProjectTemplate } from '@/lib/api/projects';
import { getApiError } from '@/lib/api/client';
import { notifyError, notifySuccess } from '@/lib/notify';
import { TEMPLATE_CATALOG } from '@/lib/constants/templateCatalog';

const statusOptions = [
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Pending', value: 'pending' },
];

const statusLabel = (status) => statusOptions.find((item) => item.value === status)?.label || status;

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const safeFileName = (value = 'mini-website') => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '') || 'mini-website';

const downloadBlob = (filename, blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

const getCrc32 = (bytes) => {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc = crcTable[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const getDosDateTime = () => {
  const date = new Date();
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosDate, dosTime };
};

const createZipBlob = (files) => {
  const encoder = new TextEncoder();
  const { dosDate, dosTime } = getDosDateTime();
  const parts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = typeof file.content === 'string' ? encoder.encode(file.content) : file.content;
    const crc = getCrc32(dataBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, dataBytes.length, true);
    localView.setUint32(22, dataBytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, dataBytes.length, true);
    centralView.setUint32(24, dataBytes.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    parts.push(localHeader, dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  });

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const endHeader = new Uint8Array(22);
  const endView = new DataView(endHeader.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  return new Blob([...parts, ...centralParts, endHeader], { type: 'application/zip' });
};

const imageExtensionFromMime = (mime = '') => {
  if (mime.includes('jpeg')) return 'jpg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('avif')) return 'avif';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('svg')) return 'svg';
  return '';
};

const imageExtensionFromSource = (source = '') => {
  const cleanSource = source.split('?')[0].split('#')[0];
  const match = cleanSource.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() || '';
};

const bytesFromDataUrl = (dataUrl) => {
  const [meta = '', data = ''] = dataUrl.split(',');
  const mime = meta.match(/data:([^;]+)/)?.[1] || 'image/png';
  const isBase64 = meta.includes(';base64');
  const binary = isBase64 ? atob(data) : decodeURIComponent(data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return { bytes, mime };
};

const getDownloadedImageAsset = async (imageSrc, folderName) => {
  if (!imageSrc) return null;

  if (imageSrc.startsWith('data:')) {
    const { bytes, mime } = bytesFromDataUrl(imageSrc);
    const extension = imageExtensionFromMime(mime) || 'png';
    return {
      zipPath: `${folderName}/assets/hero-image.${extension}`,
      htmlPath: `assets/hero-image.${extension}`,
      bytes,
    };
  }

  const response = await fetch(new URL(imageSrc, window.location.origin).toString());
  if (!response.ok) throw new Error('Could not download template image');

  const blob = await response.blob();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const extension = imageExtensionFromMime(blob.type) || imageExtensionFromSource(imageSrc) || 'jpg';

  return {
    zipPath: `${folderName}/assets/hero-image.${extension}`,
    htmlPath: `assets/hero-image.${extension}`,
    bytes,
  };
};

const buildMiniSiteCss = () => `* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: Inter, Arial, sans-serif;
  color: #0f172a;
  background: #f7f9fc;
}

.mini-page {
  overflow: hidden;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 48%, #eef6ff 100%);
}

.site-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
  padding: 18px 7%;
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  backdrop-filter: blur(18px);
}

.brand {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.05em;
}

.nav-links {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.nav-links a {
  padding: 10px 16px;
  border-radius: 999px;
  color: #475569;
  font-weight: 800;
  text-decoration: none;
}

.nav-links a:hover {
  background: #eff6ff;
  color: #2563eb;
}

.nav-toggle {
  display: none;
  width: 46px;
  height: 46px;
  align-items: center;
  justify-content: center;
  justify-self: end;
  border: 1px solid #dbeafe;
  border-radius: 15px;
  background: #ffffff;
  cursor: pointer;
  flex-direction: column;
  gap: 5px;
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.12);
}

.nav-toggle span {
  display: block;
  width: 20px;
  height: 2px;
  border-radius: 999px;
  background: #2563eb;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.nav-toggle.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.nav-toggle.open span:nth-child(2) {
  opacity: 0;
}

.nav-toggle.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.hero {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 86vh;
  padding: 96px 7%;
  overflow: hidden;
  background-position: center;
  background-size: cover;
  color: #ffffff;
}

.hero::after {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 24%, rgba(37, 99, 235, 0.34), transparent 34%),
    linear-gradient(90deg, rgba(2, 6, 23, 0.84), rgba(15, 23, 42, 0.52), rgba(15, 23, 42, 0.18));
  content: '';
}

.hero > div {
  position: relative;
  z-index: 1;
  max-width: 820px;
}

.kicker {
  display: inline-flex;
  padding: 9px 14px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero h1 {
  max-width: 760px;
  margin: 0 0 20px;
  color: #ffffff;
  font-size: clamp(42px, 6vw, 78px);
  line-height: 0.96;
  letter-spacing: -0.075em;
  text-shadow: 0 16px 42px rgba(0, 0, 0, 0.42);
}

.hero p {
  max-width: 680px;
  color: #e0f2fe;
  font-size: 20px;
  line-height: 1.8;
  text-shadow: 0 10px 28px rgba(0, 0, 0, 0.36);
}

.section-text {
  color: #64748b;
  font-size: 18px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 32px;
}

.btn {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  padding: 0 22px;
  border-radius: 999px;
  background: #0f172a;
  color: #ffffff;
  font-weight: 900;
  text-decoration: none;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.18);
}

.btn.secondary {
  background: #ffffff;
  color: #2563eb;
  border: 1px solid #dbeafe;
}

.section {
  padding: 90px 7%;
}

.section-header {
  max-width: 820px;
  margin: 0 auto 42px;
  text-align: center;
}

.section-header h2 {
  margin: 14px 0;
  font-size: clamp(36px, 5vw, 58px);
  line-height: 1;
  letter-spacing: -0.06em;
}

.about-card,
.premium-note,
.contact-card {
  max-width: 1050px;
  margin: 0 auto;
  padding: 36px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.09);
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

.service-card {
  min-height: 240px;
  padding: 30px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 30px;
  background: #ffffff;
  box-shadow: 0 20px 54px rgba(15, 23, 42, 0.08);
}

.service-icon {
  display: inline-flex;
  width: 54px;
  height: 54px;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, #2563eb, #22d3ee);
  color: #ffffff;
  font-size: 24px;
}

.premium-note {
  margin-top: 28px;
  text-align: center;
  background: linear-gradient(135deg, #0f172a, #1d4ed8);
  color: #ffffff;
}

.premium-note p {
  margin: 0;
  color: #dbeafe;
  font-size: 18px;
  line-height: 1.8;
}

.contact-card {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 28px;
  align-items: start;
}

.contact-form {
  display: grid;
  gap: 14px;
}

.contact-form input,
.contact-form textarea {
  width: 100%;
  min-height: 52px;
  padding: 14px 16px;
  border: 1px solid #dbeafe;
  border-radius: 16px;
  font: inherit;
}

.contact-form textarea {
  min-height: 130px;
  resize: vertical;
}

.site-footer {
  padding: 28px 7%;
  border-top: 1px solid rgba(226, 232, 240, 0.9);
  background: #020617;
  color: #cbd5e1;
  text-align: center;
  font-size: 15px;
  font-weight: 800;
}

.site-footer p {
  margin: 0;
}

@media (max-width: 900px) {
  .site-nav {
    grid-template-columns: 1fr auto;
    gap: 14px;
    padding: 16px 22px;
  }

  .nav-toggle {
    display: inline-flex;
  }

  .nav-links {
    display: none;
    grid-column: 1 / -1;
    width: 100%;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border: 1px solid rgba(219, 234, 254, 0.9);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 18px 46px rgba(15, 23, 42, 0.1);
  }

  .nav-links.show {
    display: flex;
  }

  .nav-links a {
    width: 100%;
  }

  .hero {
    min-height: 78vh;
    padding: 76px 24px;
  }

  .hero::after {
    background: linear-gradient(180deg, rgba(2, 6, 23, 0.86), rgba(15, 23, 42, 0.5));
  }

  .hero h1 {
    font-size: clamp(38px, 12vw, 62px);
  }

  .services-grid,
  .contact-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .brand {
    font-size: 22px;
  }

  .nav-links a {
    padding: 9px 12px;
    font-size: 13px;
  }

  .hero,
  .section {
    padding-left: 18px;
    padding-right: 18px;
  }

  .hero h1 {
    letter-spacing: -0.055em;
  }

  .hero p,
  .section-text {
    font-size: 16px;
  }

  .about-card,
  .premium-note,
  .contact-card,
  .service-card {
    padding: 24px;
    border-radius: 24px;
  }

  .hero-actions,
  .btn {
    width: 100%;
  }
}
`;

const buildMiniSiteHtml = (content, imageSrc) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(content.brand)} Mini Website</title>
  <style>
${buildMiniSiteCss()}
  </style>
</head>
<body>
  <main class="mini-page">
    <nav class="site-nav">
      <div class="brand">${escapeHtml(content.brand)}</div>
      <button class="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div class="nav-links" id="navLinks">
        <a href="#home">${escapeHtml(content.navHome)}</a>
        <a href="#about">${escapeHtml(content.navAbout)}</a>
        <a href="#service">${escapeHtml(content.navService)}</a>
        <a href="#contact">${escapeHtml(content.navContact)}</a>
      </div>
    </nav>

    <section class="hero" id="home" style="background-image: url('${escapeHtml(imageSrc)}');">
      <div>
        <h1>${escapeHtml(content.heroHeadline)}</h1>
        <p>${escapeHtml(content.heroSubtext)}</p>
        <div class="hero-actions">
          <a class="btn" href="#service">Explore Services</a>
          <a class="btn secondary" href="#contact">Contact Us</a>
        </div>
      </div>
    </section>

    <section class="section" id="about">
      <div class="section-header">
        <span class="kicker">About Us</span>
        <h2>${escapeHtml(content.aboutTitle)}</h2>
      </div>
      <div class="about-card">
        <p class="section-text">${escapeHtml(content.aboutText)}</p>
      </div>
    </section>

    <section class="section" id="service">
      <div class="section-header">
        <span class="kicker">Our Services</span>
        <h2>${escapeHtml(content.servicesTitle)}</h2>
      </div>
      <div class="services-grid">
        <article class="service-card"><span class="service-icon">⚡</span><h3>${escapeHtml(content.serviceOneTitle)}</h3><p class="section-text">${escapeHtml(content.serviceOneText)}</p></article>
        <article class="service-card"><span class="service-icon">✦</span><h3>${escapeHtml(content.serviceTwoTitle)}</h3><p class="section-text">${escapeHtml(content.serviceTwoText)}</p></article>
        <article class="service-card"><span class="service-icon">☏</span><h3>${escapeHtml(content.serviceThreeTitle)}</h3><p class="section-text">${escapeHtml(content.serviceThreeText)}</p></article>
      </div>
      <div class="premium-note"><p>${escapeHtml(content.premiumText)}</p></div>
    </section>

    <section class="section" id="contact">
      <div class="contact-card">
        <div>
          <span class="kicker">Contact</span>
          <h2>${escapeHtml(content.contactTitle)}</h2>
          <p class="section-text">${escapeHtml(content.contactText)}</p>
        </div>
        <form class="contact-form">
          <input type="text" placeholder="Name" />
          <input type="email" placeholder="Email" />
          <textarea placeholder="Message"></textarea>
          <button class="btn" type="button">Send Message</button>
        </form>
      </div>
    </section>

    <footer class="site-footer">
      <p>© ${new Date().getFullYear()} ${escapeHtml(content.brand)}. All rights reserved.</p>
    </footer>
  </main>
  <script>
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const closeMenu = () => {
      navLinks.classList.remove('show');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    };

    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('show');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
  </script>
</body>
</html>`;

const buildMiniSiteReadme = ({ project, templateName, templateType, changes, imageChanged }) => `# ${templateName} Mini Website

## Project Details
- Project: ${project?.name || 'Untitled Project'}
- Client: ${project?.clientName || 'Client'}
- Template: ${templateName}
- Type: ${templateType}
- Exported At: ${new Date().toLocaleString()}

## Files Downloaded
- website.html: Ready-to-open mini website with HTML, CSS, and JavaScript in one file.
- source-code.html: Same complete source code for editing or sharing with a developer.
- README.md: Export details and saved changes.

## Saved Changes
${changes.length ? changes.map((item) => `- ${item}`).join('\n') : '- No text fields changed from the default template copy.'}
- Hero image: ${imageChanged ? 'Changed by user upload' : 'Original selected template image'}

## How To Use
Open website.html in any browser. To edit the code manually, open source-code.html in a code editor.
`;

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isTemplateEditing, setIsTemplateEditing] = useState(false);
  const [templateContent, setTemplateContent] = useState(null);
  const [heroImageOverride, setHeroImageOverride] = useState('');
  const [form] = Form.useForm();
  const isAdmin = user?.role === 'admin';

  const loadProject = async () => {
    try {
      const [projectResponse, profileResponse] = await Promise.all([
        getProject(id),
        getMe(),
      ]);
      setUser(profileResponse.data || null);
      const projData = projectResponse.data || null;
      setProject(projData);
    } catch (error) {
      notifyError('Failed to load project details', getApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  useEffect(() => {
    if (!project) return;

    const formatForInput = (dateStr) => {
      if (!dateStr) return '';
      return new Date(dateStr).toISOString().split('T')[0];
    };

    form.setFieldsValue({
      name: project.name,
      clientName: project.clientName,
      status: project.status,
      startDate: formatForInput(project.startDate),
      endDate: formatForInput(project.endDate),
      budget: project.budget,
    });
  }, [form, project]);

  const templateObj = useMemo(() => {
    if (!project) return null;

    return TEMPLATE_CATALOG.find(
      (t) =>
        (project.templateKey && t.key?.toLowerCase() === project.templateKey?.toLowerCase()) ||
        (project.templateName && t.name?.toLowerCase() === project.templateName?.toLowerCase())
    ) || TEMPLATE_CATALOG.find(
      (t) =>
        (project.templateKey && t.key?.toLowerCase().includes(project.templateKey?.toLowerCase())) ||
        (project.templateName && t.name?.toLowerCase().includes(project.templateName?.toLowerCase()))
    );
  }, [project]);

  const hasTemplate = !!(project?.templateKey || project?.templateName);
  const displayName = templateObj?.name || project?.templateName || '';
  const displayType = templateObj?.type || project?.templateType || 'Template';
  const displayImage = templateObj?.image || TEMPLATE_CATALOG[0].image;
  const displayImageSrc = displayImage?.src || displayImage;
  const currentHeroImage = heroImageOverride || displayImageSrc;

  const defaultMiniSiteContent = useMemo(() => ({
    brand: displayName || project?.name || 'Premium Studio',
    navHome: 'Home',
    navAbout: 'About',
    navService: 'Service',
    navContact: 'Contact',
    heroHeadline: `Create a premium ${displayName || displayType || 'business'} experience`,
    heroSubtext: `A modern one-page website concept crafted for ${project?.clientName || 'your client'}, inspired by the selected ${displayType || 'template'}.`,
    aboutTitle: 'About Us',
    aboutText: `We bring the ${displayName || 'selected template'} vision to life with clean visuals, strong storytelling, and a polished digital experience made to impress every visitor.`,
    servicesTitle: 'Our Services',
    serviceOneTitle: 'Fast Delivery',
    serviceOneText: 'Get a polished website experience ready quickly with a clean structure and smooth user journey.',
    serviceTwoTitle: 'Premium Quality',
    serviceTwoText: 'Every section is designed with elegant spacing, premium visuals, and conversion-focused content.',
    serviceThreeTitle: '24/7 Support',
    serviceThreeText: 'Stay confident with friendly support messaging that helps visitors trust your brand anytime.',
    premiumText: 'Premium brands deserve more than a basic page — this layout blends modern design, clear messaging, and smooth navigation for a high-end client-ready experience.',
    contactTitle: 'Contact Us',
    contactText: 'Share your project details and our team will respond with a tailored premium solution.',
  }), [displayName, displayType, project?.clientName, project?.name]);

  useEffect(() => {
    if (!hasTemplate) {
      setTemplateContent(null);
      setHeroImageOverride('');
      return;
    }

    setTemplateContent({ ...defaultMiniSiteContent, ...(project?.templateContent || {}) });
    setHeroImageOverride(project?.heroImage || '');
    setIsTemplateEditing(false);
  }, [defaultMiniSiteContent, hasTemplate, project?.heroImage, project?.templateContent]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (isAdmin) {
        const payload = {
          ...values,
          budget: Number(values.budget || 0),
        };
        await updateProject(id, payload);
        notifySuccess('Project Updated', 'Project details saved successfully.');
      } else {
        await updateProjectStatus(id, { status: values.status });
        notifySuccess('Status Updated', 'Project status updated successfully.');
      }
      setIsEditing(false);
      await loadProject();
    } catch (error) {
      notifyError('Failed to save details', getApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const updateTemplateField = (field, value) => {
    setTemplateContent((current) => ({ ...(current || defaultMiniSiteContent), [field]: value }));
  };

  const miniSectionId = (section) => `project-${id}-mini-${section}`;

  const scrollToMiniSection = (section) => {
    document.getElementById(miniSectionId(section))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderText = (field, tag = 'span', className = '') => {
    const value = templateContent?.[field] || '';

    if (isTemplateEditing) {
      return (
        <Input.TextArea
          autoSize
          value={value}
          className={`mini-site-edit-input ${className}`}
          onChange={(event) => updateTemplateField(field, event.target.value)}
        />
      );
    }

    const TagName = tag;
    return <TagName className={className}>{value}</TagName>;
  };

  const handleHeroImageUpload = (file) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      notifyError('Unsupported Image', 'Only JPG and PNG images are supported.');
      return Upload.LIST_IGNORE;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setHeroImageOverride(reader.result || '');
    };
    reader.onerror = () => notifyError('Image Upload Failed', 'Please try a different image.');
    reader.readAsDataURL(file);
    return false;
  };

  const handleAddTemplate = () => {
    localStorage.setItem('templateAttachProjectId', id);
    router.push('/dashboard/projects/add-template');
  };

  const handleSaveTemplateChanges = async () => {
    setTemplateSaving(true);
    try {
      const response = await updateProjectTemplate(id, {
        templateContent: templateContent || defaultMiniSiteContent,
        heroImage: heroImageOverride || '',
      });
      setProject(response.data || project);
      setIsTemplateEditing(false);
      notifySuccess('Template Saved', 'Template changes saved successfully.');
    } catch (error) {
      notifyError('Template Save Failed', getApiError(error));
    } finally {
      setTemplateSaving(false);
    }
  };

  const getChangedFields = () => Object.entries(templateContent || {}).reduce((changes, [key, value]) => {
    if (defaultMiniSiteContent[key] !== value) {
      changes.push(`${key}: updated`);
    }
    return changes;
  }, []);

  const handleDownloadMiniSite = async () => {
    const content = templateContent || defaultMiniSiteContent;
    const folderName = safeFileName(`${project?.name || displayName}-mini-website`);

    try {
      const imageAsset = await getDownloadedImageAsset(currentHeroImage, folderName);
      const htmlSource = buildMiniSiteHtml(content, imageAsset?.htmlPath || currentHeroImage);
      const readmeSource = buildMiniSiteReadme({
        project,
        templateName: displayName,
        templateType: displayType,
        changes: getChangedFields(),
        imageChanged: !!heroImageOverride,
      });
      const zipFiles = [
        { name: `${folderName}/website.html`, content: htmlSource },
        { name: `${folderName}/source-code.html`, content: htmlSource },
        { name: `${folderName}/README.md`, content: readmeSource },
      ];

      if (imageAsset) {
        zipFiles.push({ name: imageAsset.zipPath, content: imageAsset.bytes });
      }

      const zipBlob = createZipBlob(zipFiles);
      downloadBlob(`${folderName}.zip`, zipBlob);
      notifySuccess('Download Started', 'ZIP folder with website, source code, README, and hero image is downloading.');
    } catch {
      notifyError('Download Failed', 'Template image could not be packaged. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="overview-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-no-template">
        <h2>Project not found</h2>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/dashboard/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      {/* Hero Welcome Banner */}
      <div className="project-detail-hero">
        <div className="project-detail-hero-content">
          <span className="project-detail-badge" onClick={() => router.push('/dashboard/projects')}>
            <ArrowLeftOutlined /> Back to Projects
          </span>
          <h1 className="project-detail-title">{project.name}</h1>
          <p className="project-detail-subtitle">
            Client: <strong>{project.clientName}</strong> &bull; Status: <strong>{statusLabel(project.status)}</strong>
          </p>
        </div>
      </div>

      <div className="project-tab-card">
        <Tabs
          defaultActiveKey="details"
          items={[
            {
              key: 'details',
              label: (
                <span>
                  <ProjectOutlined /> Project Details
                </span>
              ),
              children: (
                <div className="project-tab-content">
                  <Form form={form} layout="vertical" onFinish={handleSave} requiredMark={false}>
                    {isEditing ? (
                      <>
                        <div className="project-detail-grid">
                          {isAdmin ? (
                            <>
                              <Form.Item name="name" label="Project Name" rules={[{ required: true, message: 'Project name is required' }]}>
                                <Input size="large" />
                              </Form.Item>
                              <Form.Item name="clientName" label="Client Name" rules={[{ required: true, message: 'Client name is required' }]}>
                                <Input size="large" />
                              </Form.Item>
                              <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Status is required' }]}>
                                <Select size="large" options={statusOptions} />
                              </Form.Item>
                              <Form.Item name="budget" label="Project Budget ($)" rules={[{ required: true, message: 'Budget is required' }]}>
                                <Input size="large" type="number" min={0} />
                              </Form.Item>
                              <Form.Item name="startDate" label="Start Date" rules={[{ required: true, message: 'Start date is required' }]}>
                                <Input size="large" type="date" />
                              </Form.Item>
                              <Form.Item name="endDate" label="End Date" rules={[{ required: true, message: 'End date is required' }]}>
                                <Input size="large" type="date" />
                              </Form.Item>
                            </>
                          ) : (
                            <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Status is required' }]}>
                              <Select size="large" options={statusOptions} />
                            </Form.Item>
                          )}
                        </div>
                        <div className="project-edit-actions">
                          <Button size="large" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                          <Button type="primary" size="large" icon={<SaveOutlined />} htmlType="submit" loading={saving}>
                            {isAdmin ? 'Save Changes' : 'Update Status'}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="project-detail-grid">
                          <div className="project-detail-item">
                            <div className="project-detail-item-icon project-detail-item-blue"><ProjectOutlined /></div>
                            <div className="project-detail-item-info">
                              <small>Project Name</small>
                              <strong>{project.name}</strong>
                            </div>
                          </div>
                          <div className="project-detail-item">
                            <div className="project-detail-item-icon project-detail-item-cyan"><UserOutlined /></div>
                            <div className="project-detail-item-info">
                              <small>Client Name</small>
                              <strong>{project.clientName}</strong>
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="project-detail-item">
                              <div className="project-detail-item-icon project-detail-item-emerald"><DollarOutlined /></div>
                              <div className="project-detail-item-info">
                                <small>Budget</small>
                                <strong>${Number(project.budget || 0).toLocaleString()}</strong>
                              </div>
                            </div>
                          )}
                          <div className="project-detail-item">
                            <div className="project-detail-item-icon project-detail-item-amber"><SyncOutlined /></div>
                            <div className="project-detail-item-info">
                              <small>Status</small>
                              <strong>{statusLabel(project.status)}</strong>
                            </div>
                          </div>
                          <div className="project-detail-item">
                            <div className="project-detail-item-icon project-detail-item-blue"><CalendarOutlined /></div>
                            <div className="project-detail-item-info">
                              <small>Start Date</small>
                              <strong>{new Date(project.startDate).toLocaleDateString()}</strong>
                            </div>
                          </div>
                          <div className="project-detail-item">
                            <div className="project-detail-item-icon project-detail-item-cyan"><CalendarOutlined /></div>
                            <div className="project-detail-item-info">
                              <small>End Date</small>
                              <strong>{new Date(project.endDate).toLocaleDateString()}</strong>
                            </div>
                          </div>
                          <div className="project-detail-item project-assigned-members-card">
                            <div className="project-detail-item-icon project-detail-item-blue"><UserOutlined /></div>
                            <div className="project-detail-item-info">
                              <small>Assign Members</small>
                              {project.assignedMembers?.length ? (
                                <div className="project-assigned-members-list">
                                  {project.assignedMembers.map((member) => (
                                    <Tag key={member._id || member.email} className="team-count-tag">
                                      {member.name} — {member.role}
                                    </Tag>
                                  ))}
                                </div>
                              ) : (
                                <strong>No members assigned</strong>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="project-edit-actions">
                          <Button type="primary" size="large" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
                            {isAdmin ? 'Edit Details' : 'Edit Status'}
                          </Button>
                        </div>
                      </>
                    )}
                  </Form>
                </div>
              ),
            },
            {
              key: 'template',
              label: (
                <span>
                  <AppstoreOutlined /> {isAdmin ? 'Edit Template' : 'View Template'}
                </span>
              ),
              children: (
                <div className="project-tab-content">
                  {hasTemplate && templateContent ? (
                    <div className="mini-site-shell">
                      <div className="mini-site-toolbar">
                        <div>
                          <span className="project-template-type-tag">{displayType}</span>
                          <h3>{displayName}</h3>
                          <p>
                            Premium single-page website editor for this selected template.{' '}
                            <span style={{ color: '#dc2626', fontWeight: 800 }}>(only jpg and png images support)</span>
                          </p>
                        </div>
                        <div className="mini-site-actions">
                          {isTemplateEditing && (
                            <Upload accept="image/jpeg,image/png,.jpg,.jpeg,.png" showUploadList={false} beforeUpload={handleHeroImageUpload}>
                              <Button size="large" icon={<UploadOutlined />}>Change Image</Button>
                            </Upload>
                          )}
                          {isTemplateEditing ? (
                            <Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSaveTemplateChanges} loading={templateSaving}>
                              Save Changes
                            </Button>
                          ) : (
                            <Button size="large" icon={<EditOutlined />} onClick={() => setIsTemplateEditing(true)}>
                              Edit
                            </Button>
                          )}
                          <Button size="large" icon={<DownloadOutlined />} onClick={handleDownloadMiniSite}>
                            Download
                          </Button>
                        </div>
                      </div>

                      <div className="mini-site-preview">
                        <nav className="mini-site-navbar">
                          <div className="mini-site-brand">{renderText('brand')}</div>
                          <div className="mini-site-nav-links">
                            <button type="button" onClick={() => !isTemplateEditing && scrollToMiniSection('home')}>{renderText('navHome')}</button>
                            <button type="button" onClick={() => !isTemplateEditing && scrollToMiniSection('about')}>{renderText('navAbout')}</button>
                            <button type="button" onClick={() => !isTemplateEditing && scrollToMiniSection('service')}>{renderText('navService')}</button>
                            <button type="button" onClick={() => !isTemplateEditing && scrollToMiniSection('contact')}>{renderText('navContact')}</button>
                          </div>
                        </nav>

                        <section
                          id={miniSectionId('home')}
                          className="mini-site-hero"
                          style={{ backgroundImage: `url(${currentHeroImage})` }}
                        >
                          <div className="mini-site-hero-copy">
                            {renderText('heroHeadline', 'h1')}
                            {renderText('heroSubtext', 'p')}
                            <div className="mini-site-hero-actions">
                              <button type="button" onClick={() => scrollToMiniSection('service')}>Explore Services</button>
                              <button type="button" className="secondary" onClick={() => scrollToMiniSection('contact')}>Contact Us</button>
                            </div>
                          </div>
                        </section>

                        <section id={miniSectionId('about')} className="mini-site-section mini-site-about">
                          <div className="mini-site-section-header">
                            <span>About Us</span>
                            {renderText('aboutTitle', 'h2')}
                          </div>
                          <div className="mini-site-about-card">
                            {renderText('aboutText', 'p')}
                          </div>
                        </section>

                        <section id={miniSectionId('service')} className="mini-site-section">
                          <div className="mini-site-section-header">
                            <span>Our Services</span>
                            {renderText('servicesTitle', 'h2')}
                          </div>
                          <div className="mini-site-services-grid">
                            <article className="mini-site-service-card">
                              <span>⚡</span>
                              {renderText('serviceOneTitle', 'h3')}
                              {renderText('serviceOneText', 'p')}
                            </article>
                            <article className="mini-site-service-card">
                              <span>✦</span>
                              {renderText('serviceTwoTitle', 'h3')}
                              {renderText('serviceTwoText', 'p')}
                            </article>
                            <article className="mini-site-service-card">
                              <span>☏</span>
                              {renderText('serviceThreeTitle', 'h3')}
                              {renderText('serviceThreeText', 'p')}
                            </article>
                          </div>
                          <div className="mini-site-premium-note">
                            {renderText('premiumText', 'p')}
                          </div>
                        </section>

                        <section id={miniSectionId('contact')} className="mini-site-section">
                          <div className="mini-site-contact-card">
                            <div>
                              <span className="mini-site-kicker">Contact</span>
                              {renderText('contactTitle', 'h2')}
                              {renderText('contactText', 'p')}
                            </div>
                            <div className="mini-site-contact-form">
                              <Input size="large" placeholder="Name" />
                              <Input size="large" placeholder="Email" />
                              <Input.TextArea rows={5} placeholder="Message" />
                              <Button type="primary" size="large">Send Message</Button>
                            </div>
                          </div>
                        </section>
                        <footer className="mini-site-footer">
                          <p>© {new Date().getFullYear()} {templateContent.brand}. All rights reserved.</p>
                        </footer>
                      </div>
                    </div>
                  ) : (
                    <div className="project-no-template">
                      <h3>No template attached to this project.</h3>
                      <p>Add a template now if this project was created without one.</p>
                      {isAdmin && (
                        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAddTemplate}>
                          Add Template
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
