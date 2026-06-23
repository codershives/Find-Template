'use client';

import { Button, Form, Input, Modal, Popconfirm, Space, Table, Tooltip } from 'antd';
import {
  ArrowRightOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  EyeOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  RocketOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { createClient, deleteClient, getClient, getClients, updateClient } from '@/lib/api/clients';
import { getApiError } from '@/lib/api/client';
import { notifyError, notifySuccess } from '@/lib/notify';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'Data not available');
const formatForInput = (value) => (value ? new Date(value).toISOString().split('T')[0] : '');
const formatCurrency = (value) => `$${Number(value || 0).toLocaleString()}`;
const calculatePendingAmount = (projectBudget, receivedAmount) => Math.max(Number(projectBudget || 0) - Number(receivedAmount || 0), 0);

export default function ClientsDashboard() {
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewClient, setViewClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const projectBudget = Form.useWatch('projectBudget', form);
  const receivedAmount = Form.useWatch('receivedAmount', form);

  const loadClients = async () => {
    try {
      const response = await getClients();
      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      notifyError('Clients Load Failed', getApiError(error));
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (!open) return;

    form.resetFields();
    if (editingClient) {
      form.setFieldsValue({
        name: editingClient.name,
        email: editingClient.email,
        mobileNumber: editingClient.mobileNumber,
        projectName: editingClient.projectName,
        websiteType: editingClient.websiteType,
        projectBudget: editingClient.projectBudget,
        receivedAmount: editingClient.receivedAmount,
        pendingAmount: calculatePendingAmount(editingClient.projectBudget, editingClient.receivedAmount),
        paymentDate: formatForInput(editingClient.paymentDate),
      });
      return;
    }

    form.setFieldsValue({ projectBudget: 0, receivedAmount: 0, pendingAmount: 0 });
  }, [editingClient, form, open]);

  useEffect(() => {
    if (!open) return;

    form.setFieldsValue({
      pendingAmount: calculatePendingAmount(projectBudget, receivedAmount),
    });
  }, [form, open, projectBudget, receivedAmount]);

  const stats = useMemo(() => ({
    total: clients.length,
    budget: clients.reduce((sum, client) => sum + Number(client.projectBudget || 0), 0),
    received: clients.reduce((sum, client) => sum + Number(client.receivedAmount || 0), 0),
    pending: clients.reduce((sum, client) => sum + Number(client.pendingAmount || 0), 0),
  }), [clients]);

  const openCreateForm = () => {
    setEditingClient(null);
    setOpen(true);
  };

  const openEditForm = (client) => {
    setEditingClient(client);
    setOpen(true);
  };

  const submitClient = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        projectBudget: Number(values.projectBudget || 0),
        receivedAmount: Number(values.receivedAmount || 0),
        pendingAmount: calculatePendingAmount(values.projectBudget, values.receivedAmount),
      };

      if (editingClient) {
        await updateClient(editingClient._id, payload);
        notifySuccess('Client Updated', 'Client details saved successfully.');
      } else {
        await createClient(payload);
        notifySuccess('Client Added', 'Client added successfully.');
      }

      form.resetFields();
      setOpen(false);
      setEditingClient(null);
      await loadClients();
    } catch (error) {
      notifyError(editingClient ? 'Update Failed' : 'Client Add Failed', getApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const openViewClient = async (client) => {
    try {
      const response = await getClient(client._id);
      setViewClient(response.data || null);
      setViewOpen(true);
    } catch (error) {
      notifyError('Client View Failed', getApiError(error));
    }
  };

  const removeClient = async (client) => {
    try {
      await deleteClient(client._id);
      notifySuccess('Client Deleted', 'Client deleted successfully.');
      await loadClients();
    } catch (error) {
      notifyError('Delete Failed', getApiError(error));
    }
  };

  const columns = [
    {
      title: 'Client Name',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text) => (
        <span className="proj-table-name">
          <UserOutlined className="proj-table-name-icon" />
          {text}
        </span>
      ),
    },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 230 },
    { title: 'Mobile No.', dataIndex: 'mobileNumber', key: 'mobileNumber', width: 150 },
    { title: 'Project Name', dataIndex: 'projectName', key: 'projectName', width: 200, render: (value) => value || 'Data not available' },
    { title: 'Website Type', dataIndex: 'websiteType', key: 'websiteType', width: 170 },
    {
      title: 'Project Budget',
      dataIndex: 'projectBudget',
      key: 'projectBudget',
      width: 160,
      render: formatCurrency,
    },
    {
      title: 'Received Amount',
      dataIndex: 'receivedAmount',
      key: 'receivedAmount',
      width: 170,
      render: formatCurrency,
    },
    {
      title: 'Pending Amount',
      dataIndex: 'pendingAmount',
      key: 'pendingAmount',
      width: 170,
      render: formatCurrency,
    },
    {
      title: 'Payment Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 150,
      render: formatDate,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 170,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button className="proj-action-btn" icon={<EyeOutlined />} onClick={() => openViewClient(record)} />
          </Tooltip>
          <Tooltip title="Edit Client">
            <Button className="proj-action-btn" icon={<EditOutlined />} onClick={() => openEditForm(record)} />
          </Tooltip>
          <Popconfirm
            title="Delete client?"
            description="This client record will be removed."
            okText="Delete"
            cancelText="Cancel"
            onConfirm={() => removeClient(record)}
          >
            <Button className="proj-action-btn proj-delete-btn" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const statCards = [
    { key: 'total', label: 'Total Clients', icon: <TeamOutlined />, value: stats.total, theme: 'blue' },
    { key: 'budget', label: 'Total Budget', icon: <DollarOutlined />, value: formatCurrency(stats.budget), theme: 'emerald' },
    { key: 'received', label: 'Total Received', icon: <DollarOutlined />, value: formatCurrency(stats.received), theme: 'emerald' },
    { key: 'pending', label: 'Total Pending', icon: <RocketOutlined />, value: formatCurrency(stats.pending), theme: 'amber' },
  ];

  return (
    <div className="proj-premium-page clients-premium-page">
      <div className="proj-hero-banner">
        <div className="proj-hero-glow" />
        <div className="proj-hero-glow-2" />
        <div className="proj-hero-content">
          <div className="proj-hero-left">
            <span className="proj-hero-badge">
              <RocketOutlined /> Client Management
            </span>
            <h1 className="proj-hero-title">
              Manage every client with <span className="text-gradient">premium clarity.</span>
            </h1>
            <p className="proj-hero-subtitle">
              Add client details, track project budgets, and keep payment dates organized in one workspace.
            </p>
          </div>
          <div className="proj-hero-right">
            <button type="button" className="proj-hero-add-btn" onClick={openCreateForm}>
              <PlusOutlined /> Add Client
            </button>
          </div>
        </div>
      </div>

      <div className="proj-stats-section">
        <div className="overview-stats-grid clients-stats-grid">
          {statCards.map((item) => (
            <div className={`proj-stat-card proj-stat-${item.theme}`} key={item.key}>
              <div className="proj-stat-card-inner">
                <span className={`proj-stat-icon proj-stat-icon-${item.theme}`}>{item.icon}</span>
                <div className="proj-stat-info">
                  <span className="proj-stat-label">{item.label}</span>
                  <strong className="proj-stat-value">{item.value}</strong>
                </div>
              </div>
              <div className={`proj-stat-bar proj-stat-bar-${item.theme}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="proj-table-section">
        <div className="proj-table-header">
          <div className="proj-table-header-left">
            <span className="proj-table-kicker">Client Records</span>
            <h2 className="proj-table-title">Clients</h2>
          </div>
        </div>
        <div className="proj-table-wrapper">
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={clients}
            pagination={{ pageSize: 6 }}
            scroll={{ x: 'max-content' }}
            className="proj-premium-table"
          />
        </div>
      </div>

      <Modal
        title={null}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditingClient(null);
        }}
        footer={null}
        centered
        width={980}
        className="proj-premium-modal"
        styles={{ body: { maxHeight: '82vh', overflowY: 'auto' } }}
        forceRender={true}
      >
        <div className="proj-modal-header">
          <span className="proj-modal-badge"><TeamOutlined /> {editingClient ? 'Edit Client' : 'Add Client'}</span>
          <h2>{editingClient ? 'Update client details' : 'Register a new client'}</h2>
          <p>Fill in the client information below to keep your business records organized.</p>
        </div>
        <Form form={form} layout="vertical" onFinish={submitClient} requiredMark={false}>
          <div className="payment-two-col">
            <Form.Item name="name" label="Client Name" rules={[{ required: true, message: 'Client name is required' }]}>
              <Input size="large" placeholder="Enter client name" />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}>
              <Input size="large" placeholder="client@example.com" />
            </Form.Item>
          </div>
          <div className="payment-two-col">
            <Form.Item name="mobileNumber" label="Mobile No." rules={[{ required: true, message: 'Mobile number is required' }]}>
              <Input size="large" placeholder="Enter mobile number" />
            </Form.Item>
            <Form.Item name="projectName" label="Project Name" rules={[{ required: true, message: 'Project name is required' }]}>
              <Input size="large" placeholder="Enter project name" />
            </Form.Item>
          </div>
          <Form.Item name="websiteType" label="Website Type" rules={[{ required: true, message: 'Website type is required' }]}>
            <Input size="large" placeholder="E-commerce, Portfolio, Business..." />
          </Form.Item>
          <div className="payment-two-col">
            <Form.Item name="projectBudget" label="Project Budget ($)" rules={[{ required: true, message: 'Project budget is required' }]}>
              <Input size="large" type="number" min={0} placeholder="Enter project budget" />
            </Form.Item>
            <Form.Item name="receivedAmount" label="Received Amount ($)" rules={[{ required: true, message: 'Received amount is required' }]}>
              <Input size="large" type="number" min={0} placeholder="Enter received amount" />
            </Form.Item>
          </div>
          <div className="payment-two-col">
            <Form.Item name="pendingAmount" label="Pending Amount ($)">
              <Input size="large" type="number" min={0} disabled placeholder="Auto calculated" />
            </Form.Item>
            <Form.Item name="paymentDate" label="Payment Date" rules={[{ required: true, message: 'Payment date is required' }]}>
              <Input size="large" type="date" />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit" className="proj-submit-btn" loading={loading} block>
            {editingClient ? 'Save Client' : 'Add Client'} <ArrowRightOutlined />
          </Button>
        </Form>
      </Modal>

      <Modal title={null} open={viewOpen} onCancel={() => setViewOpen(false)} footer={null} centered width={780} className="proj-premium-modal">
        <div className="proj-modal-header">
          <span className="proj-modal-badge"><EyeOutlined /> Client Details</span>
          <h2>{viewClient?.name || 'Client'}</h2>
          <p>Complete client information and payment details.</p>
        </div>
        {viewClient && (
          <div className="team-view-grid">
            <div className="team-view-item"><span><UserOutlined /></span><small>Client Name</small><strong>{viewClient.name}</strong></div>
            <div className="team-view-item"><span><MailOutlined /></span><small>Email</small><strong>{viewClient.email}</strong></div>
            <div className="team-view-item"><span><PhoneOutlined /></span><small>Mobile No.</small><strong>{viewClient.mobileNumber}</strong></div>
            <div className="team-view-item"><span><GlobalOutlined /></span><small>Project Name</small><strong>{viewClient.projectName || 'Data not available'}</strong></div>
            <div className="team-view-item"><span><GlobalOutlined /></span><small>Website Type</small><strong>{viewClient.websiteType}</strong></div>
            <div className="team-view-item"><span><DollarOutlined /></span><small>Project Budget</small><strong>{formatCurrency(viewClient.projectBudget)}</strong></div>
            <div className="team-view-item"><span><DollarOutlined /></span><small>Received Amount</small><strong>{formatCurrency(viewClient.receivedAmount)}</strong></div>
            <div className="team-view-item"><span><RocketOutlined /></span><small>Pending Amount</small><strong>{formatCurrency(viewClient.pendingAmount)}</strong></div>
            <div className="team-view-item"><span><RocketOutlined /></span><small>Payment Date</small><strong>{formatDate(viewClient.paymentDate)}</strong></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
