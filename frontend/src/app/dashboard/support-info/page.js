'use client';

import { Button, Form, Input } from 'antd';
import { useState } from 'react';
import { getApiError } from '@/lib/api/client';
import { submitInquiry } from '@/lib/api/dashboard';
import { notifyError, notifySuccess } from '@/lib/notify';
import {
  ArrowRightOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  LinkedinOutlined,
  MailOutlined,
  PhoneOutlined,
  RocketOutlined,
  SendOutlined,
  SmileOutlined,
  UserOutlined,
} from '@ant-design/icons';

const contactDetails = [
  {
    label: 'Email',
    value: 'admin@findtempletes.com',
    icon: <MailOutlined />,
    href: 'mailto:admin@findtempletes.com',
    theme: 'blue',
  },
  {
    label: 'Phone',
    value: '18254452843',
    icon: <PhoneOutlined />,
    href: 'tel:18254452843',
    theme: 'cyan',
  },
  {
    label: 'LinkedIn',
    value: 'Coming soon',
    icon: <LinkedinOutlined />,
    href: '',
    theme: 'purple',
  },
  {
    label: 'Website',
    value: 'wwwfindtemplates.com',
    icon: <GlobalOutlined />,
    href: 'https://wwwfindtemplates.com',
    theme: 'emerald',
  },
  {
    label: 'Location',
    value: '195 Huntingford Trail, Woodstock ON N4T 0M4, Canada',
    icon: <EnvironmentOutlined />,
    href: '',
    theme: 'amber',
  },
  {
    label: 'Response Time',
    value: 'Usually within 24 hours',
    icon: <ClockCircleOutlined />,
    href: '',
    theme: 'rose',
  },
];

export default function SupportInfoPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await submitInquiry({
        name: values.name,
        email: values.email,
        message: `Subject: ${values.subject}\nPhone: ${values.phone || 'Not provided'}\n\n${values.message}`,
      });
      notifySuccess('Message Sent', 'Thanks! Your message has been sent to the FindTemplates team.');
      form.resetFields();
    } catch (error) {
      notifyError('Message Failed', getApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="support-premium-page">
      <div className="support-hero-banner">
        <div className="support-hero-glow" />
        <div className="support-hero-glow-2" />
        <div className="support-hero-content">
          <div className="support-hero-left">
            <span className="support-hero-badge">
              <RocketOutlined /> Support & Info
            </span>
            <h1 className="support-hero-title">
              Premium help for your <span className="text-gradient">FindTemplates</span> workspace.
            </h1>
            <p className="support-hero-subtitle">
              Connect with the FindTemplates team for website, web app, platform, template, and dashboard support.
            </p>
          </div>
          <div className="support-hero-card">
            <span><ClockCircleOutlined /> Response Time</span>
            <strong>Usually within 24 hours</strong>
            <small>Fast, clear, and professional communication.</small>
          </div>
        </div>
      </div>

      <div className="support-content-grid">
        <section className="support-about-card">
          <div className="support-section-heading">
            <span><UserOutlined /> About</span>
            <h2>FindTemplates builds modern digital experiences.</h2>
          </div>
          <div className="support-about-copy">
            <p>
              FindTemplates is a professional full-stack web development agency specialising in building modern,
              high-performance websites, web apps, and digital platforms.
            </p>
            <p>
              From crafting stunning landing pages to building complete agency management systems like this one,
              every product is designed with performance, scalability, and a great user experience in mind.
            </p>
            <p>
              Passionate about clean code, thoughtful UI/UX, and delivering real business value through technology.
            </p>
          </div>
          <div className="support-about-pills">
            <span>Clean Code</span>
            <span>Modern UI/UX</span>
            <span>Scalable Builds</span>
          </div>
        </section>

        <section className="support-contact-card">
          <div className="support-section-heading">
            <span><MailOutlined /> Contact Details</span>
            <h2>Reach the team directly.</h2>
          </div>
          <div className="support-contact-list">
            {contactDetails.map((item) => {
              const content = (
                <>
                  <span className={`support-contact-icon support-contact-icon-${item.theme}`}>{item.icon}</span>
                  <span className="support-contact-text">
                    <small>{item.label}</small>
                    <strong>{item.value}</strong>
                  </span>
                </>
              );

              return item.href ? (
                <a className="support-contact-item" href={item.href} key={item.label} target={item.label === 'Website' ? '_blank' : undefined} rel={item.label === 'Website' ? 'noreferrer' : undefined}>
                  {content}
                </a>
              ) : (
                <div className="support-contact-item" key={item.label}>
                  {content}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="support-form-section">
        <div className="support-form-side">
          <span className="support-form-badge"><SmileOutlined /> Get in Touch</span>
          <h2>Send Contact Form</h2>
          <p>
            Share your requirement, question, or project idea and the FindTemplates team will respond as soon as possible.
          </p>
          <div className="support-form-highlight">
            <SendOutlined />
            <span>Best for template support, custom website requests, dashboard questions, and business inquiries.</span>
          </div>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} className="support-contact-form">
          <div className="support-form-two-col">
            <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter your name' }]}>
              <Input size="large" placeholder="Enter your full name" />
            </Form.Item>
            <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
              <Input size="large" placeholder="you@example.com" />
            </Form.Item>
          </div>
          <div className="support-form-two-col">
            <Form.Item name="phone" label="Phone Number">
              <Input size="large" placeholder="Your phone number" />
            </Form.Item>
            <Form.Item name="subject" label="Subject" rules={[{ required: true, message: 'Please enter a subject' }]}>
              <Input size="large" placeholder="How can we help?" />
            </Form.Item>
          </div>
          <Form.Item name="message" label="Message" rules={[{ required: true, message: 'Please write your message' }]}>
            <Input.TextArea rows={5} placeholder="Tell us about your request..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" className="support-submit-btn" loading={loading} block>
            Send Message <ArrowRightOutlined />
          </Button>
        </Form>
      </section>
    </div>
  );
}
