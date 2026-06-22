'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Form, Input, Select, Typography } from 'antd';
import { ArrowRightOutlined, BankOutlined, LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { signupUser } from '@/lib/api/auth';
import { getApiError } from '@/lib/api/client';
import { ACCOUNT_TYPES, SIGNUP_ROLES } from '@/lib/constants/roles';
import { notifyError, notifySuccess } from '@/lib/notify';

export default function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState('freelancer');

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        companyName: values.accountType === 'company_business' ? values.companyName : undefined,
        companyEmail: values.accountType === 'company_business' ? values.companyEmail : undefined,
      };
      await signupUser(payload);

      notifySuccess('Account Created', 'Your account was created successfully. Please login to continue.');
      router.push('/auth/login');
    } catch (error) {
      notifyError('Signup Failed', getApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="auth-card">
      <Typography.Title level={2} style={{ marginTop: 0, letterSpacing: '-0.04em' }}>Create Account</Typography.Title>
      <Typography.Paragraph type="secondary">Start your FindTemplates workspace with an Admin / Owner account.</Typography.Paragraph>
      <Form layout="vertical" initialValues={{ accountType, role: 'admin' }} onFinish={onFinish} requiredMark={false}>
        <Form.Item name="accountType" label="Account Type" rules={[{ required: true }]}>
          <Select size="large" options={ACCOUNT_TYPES} onChange={setAccountType} />
        </Form.Item>
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
          <Input size="large" prefix={<UserOutlined />} placeholder="Your name" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}>
          <Input size="large" prefix={<MailOutlined />} placeholder="admin@example.com" />
        </Form.Item>
        <Form.Item name="role" label="Select Role" rules={[{ required: true }]}>
          <Select size="large" options={SIGNUP_ROLES} />
        </Form.Item>
        {accountType === 'company_business' && (
          <>
            <Form.Item name="companyName" label="Company Name" rules={[{ required: true, message: 'Company name is required' }]}>
              <Input size="large" prefix={<BankOutlined />} placeholder="Company name" />
            </Form.Item>
            <Form.Item name="companyEmail" label="Company Email" rules={[{ required: true, type: 'email', message: 'Valid company email is required' }]}>
              <Input size="large" prefix={<MailOutlined />} placeholder="company@example.com" />
            </Form.Item>
          </>
        )}
        <Form.Item name="password" label="Password" rules={[{ required: true, min: 8, message: 'Password must be at least 8 characters' }]}>
          <Input.Password size="large" prefix={<LockOutlined />} placeholder="Password" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Confirm Password"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Confirm password is required' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve();
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password size="large" prefix={<LockOutlined />} placeholder="Confirm password" />
        </Form.Item>
        <Button className="auth-submit-btn" type="primary" htmlType="submit" loading={loading} block size="large" icon={<ArrowRightOutlined />}>Create Account</Button>
      </Form>
      <Typography.Paragraph style={{ marginTop: 18, textAlign: 'center' }}>
        Already have an account? <Link href="/auth/login">Login</Link>
      </Typography.Paragraph>
    </Card>
  );
}
