'use client';

import Image from 'next/image';
import { Button, Form, Input, Modal } from 'antd';
import { StarFilled } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { updateProjectTemplate } from '@/lib/api/projects';
import { getMe } from '@/lib/api/auth';
import { getApiError } from '@/lib/api/client';
import { getTemplateUsage, isPackageActive } from '@/lib/constants/packages';
import { TEMPLATE_CATALOG } from '@/lib/constants/templateCatalog';
import { notifyError, notifySuccess } from '@/lib/notify';
import { purchaseTemplate } from '@/lib/api/payments';
import SquareCardPayment from '@/components/payments/SquareCardPayment';

export default function AddProjectTemplatePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [purchasedKeys, setPurchasedKeys] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [attachProjectId, setAttachProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const squareCardRef = useRef(null);

  useEffect(() => {
    setAttachProjectId(localStorage.getItem('templateAttachProjectId') || '');

    const loadPurchased = async () => {
      try {
        const response = await getMe();
        setProfile(response.data || null);
        setPurchasedKeys((response.data?.purchasedTemplates || []).map((template) => template.templateKey));
      } catch (error) {
        notifyError('Templates Load Failed', getApiError(error));
      }
    };

    loadPurchased();
  }, []);

  const packageActive = isPackageActive(profile);
  const templateUsage = getTemplateUsage(profile);
  const limitMessage = profile?.selectedPackage
    ? `Your current plan allows only ${templateUsage.limit} template${templateUsage.limit === 1 ? '' : 's'}. Please update your plan to add more templates.`
    : 'Please update your plan to add project templates.';

  const templates = useMemo(() => TEMPLATE_CATALOG.map((template) => ({
    ...template,
    purchased: purchasedKeys.includes(template.key),
  })), [purchasedKeys]);

  const attachTemplateToProject = async (template) => {
    if (!attachProjectId) return false;

    await updateProjectTemplate(attachProjectId, {
      templateKey: template.key,
      templateName: template.name,
      templateType: template.type,
    });
    localStorage.removeItem('templateAttachProjectId');
    notifySuccess('Template Added', `${template.name} added to this project.`);
    router.push(`/dashboard/projects/${attachProjectId}`);
    return true;
  };

  const addTemplate = async (template) => {
    if (!packageActive) {
      notifyError('Update Plan Required', profile?.selectedPackage ? 'Your package has expired. Please update your plan to add or use project templates.' : 'Please update your plan to add project templates.');
      return;
    }

    if (template.purchased) {
      if (attachProjectId) {
        setLoading(true);
        try {
          await attachTemplateToProject(template);
        } catch (error) {
          notifyError('Template Attach Failed', getApiError(error));
        } finally {
          setLoading(false);
        }
        return;
      }

      localStorage.setItem('selectedProjectTemplate', JSON.stringify(template));
      router.push('/dashboard/projects');
      return;
    }

    if (templateUsage.reached) {
      notifyError('Update Plan Required', limitMessage);
      return;
    }

    setSelectedTemplate(template);
    form.setFieldsValue({ email: '' });
  };

  const confirmPayment = async (values) => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      const sourceId = await squareCardRef.current.tokenize();
      await purchaseTemplate({
        sourceId,
        templateKey: selectedTemplate.key,
        email: values.email,
        idempotencyKey: crypto.randomUUID(),
      });
      if (attachProjectId) {
        await attachTemplateToProject(selectedTemplate);
      } else {
        notifySuccess('Template Added', `${selectedTemplate.name} added successfully.`);
        localStorage.setItem('selectedProjectTemplate', JSON.stringify(selectedTemplate));
        setTimeout(() => router.push('/dashboard/projects'), 900);
      }
    } catch (error) {
      notifyError('Template Payment Failed', getApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-template-page premium-add-template-page">
      <div className="add-template-hero-card">
        <div className="dashboard-page-heading dashboard-page-heading-center dashboard-pill-only-heading">
          <span>Add Template</span>
        </div>
        <p className="add-template-tagline">
          Choose a premium template and attach it to your project workflow. Templates used: {templateUsage.used} / {templateUsage.limit || 0}
        </p>
      </div>
      <div className="templates-page-grid add-template-grid premium-add-template-grid">
        {templates.map((template) => (
          <article className={`full-template-card add-template-card ${template.purchased ? 'is-purchased' : ''}`} key={template.key}>
            <div className="full-template-image-wrap">
              <Image src={template.image} alt={template.name} className="full-template-image" />
              <div className="template-rating"><StarFilled /> {template.rating}</div>
            </div>
            <div className="full-template-content">
              <div>
                <h3>{template.name}</h3>
                <p>{template.type}</p>
              </div>
              <div className="template-price-row add-template-action-row">
                {template.purchased ? (
                  <strong className="purchased-template-badge">Purchased</strong>
                ) : (
                  <strong className="template-price-label">${template.price}</strong>
                )}
                <Button className="add-template-btn" type="primary" onClick={() => addTemplate(template)}>Add</Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Modal title="Template Checkout" open={Boolean(selectedTemplate)} onCancel={() => setSelectedTemplate(null)} footer={null} centered forceRender={true}>
        <Form form={form} layout="vertical" onFinish={confirmPayment} requiredMark={false}>
          <Form.Item label="Selected Template">
            <Input size="large" value={selectedTemplate ? `${selectedTemplate.name} (${selectedTemplate.type}) - $${selectedTemplate.price}` : ''} disabled />
          </Form.Item>
          <Form.Item name="email" label="Payment Email" rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}>
            <Input size="large" placeholder="payment@example.com" />
          </Form.Item>
          <SquareCardPayment ref={squareCardRef} active={Boolean(selectedTemplate)} />
          <Button type="primary" htmlType="submit" className="auth-submit-btn" loading={loading} block>Confirm Payment</Button>
        </Form>
      </Modal>
    </div>
  );
}
