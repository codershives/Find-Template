'use client';

import { Button, Checkbox, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Table, Tag, Tooltip } from 'antd';
import {
  ArrowRightOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  MailOutlined,
  PlusOutlined,
  ProjectOutlined,
  RocketOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { getMe } from '@/lib/api/auth';
import { getProjects } from '@/lib/api/projects';
import {
  createTeamMember,
  deleteTeamMember,
  getTeamMember,
  getTeamMembers,
  updateTeamMember,
} from '@/lib/api/teams';
import { getApiError } from '@/lib/api/client';
import { notifyError, notifySuccess } from '@/lib/notify';
import { PLAN_ACCESS } from '@/lib/constants/packages';
import { dashboardMenu } from '@/lib/constants/routes';

const roleOptions = [
  { label: 'Developer', value: 'developer' },
  { label: 'Manager', value: 'manager' },
];

const roleConfig = {
  developer: { color: '#0891b2', bg: '#ecfeff', border: 'rgba(34,211,238,0.3)', label: 'Developer' },
  designer: { color: '#7c3aed', bg: '#f5f3ff', border: 'rgba(124,58,237,0.3)', label: 'Designer' },
  manager: { color: '#d97706', bg: '#fffbeb', border: 'rgba(217,119,6,0.3)', label: 'Manager' },
};

const moduleLabelMap = dashboardMenu.reduce((acc, item) => ({ ...acc, [item.key]: item.label }), {});
const normalizeProjectIds = (projects = []) => projects.map((project) => (typeof project === 'string' ? project : project?._id)).filter(Boolean);

export default function TeamsDashboard() {
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [profile, setProfile] = useState(null);
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewMember, setViewMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const selectedRole = Form.useWatch('role', form);
  const isManagerRole = selectedRole === 'manager';
  const isAdmin = profile?.role === 'admin';

  const managerModuleOptions = useMemo(() => {
    const allowedKeys = PLAN_ACCESS[profile?.selectedPackage || 'none'] || PLAN_ACCESS.none;
    return dashboardMenu
      .filter((item) => allowedKeys.includes(item.key))
      .map((item) => ({ label: item.label, value: item.key }));
  }, [profile?.selectedPackage]);

  const managerModuleKeys = useMemo(() => managerModuleOptions.map((item) => item.value), [managerModuleOptions]);

  const loadData = async () => {
    try {
      const profileRes = await getMe();
      const currentProfile = profileRes.data || null;
      setProfile(currentProfile);

      const membersRes = await getTeamMembers();
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);

      if (currentProfile?.role === 'admin') {
        const projectsRes = await getProjects();
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
      } else {
        setProjects([]);
      }
    } catch (error) {
      notifyError('Teams Load Failed', getApiError(error));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => ({
    total: members.length,
    developer: members.filter((member) => member.role === 'developer').length,
    manager: members.filter((member) => member.role === 'manager').length,
  }), [members]);

  const filteredMembers = filter === 'all' ? members : members.filter((member) => member.role === filter);

  useEffect(() => {
    if (!open) return;

    form.resetFields();
    if (editingMember) {
      form.setFieldsValue({
        name: editingMember.name,
        email: editingMember.email,
        role: roleOptions.some((option) => option.value === editingMember.role) ? editingMember.role : 'developer',
        assignedProjects: normalizeProjectIds(editingMember.assignedProjects),
        assignedProjectModule: !!editingMember.assignedProjectModule,
        assignedModules: (editingMember.assignedModules || []).filter((moduleKey) => managerModuleKeys.includes(moduleKey)),
        password: '',
      });
      return;
    }

    form.setFieldsValue({
      role: 'developer',
      assignedProjects: [],
      assignedProjectModule: true,
      assignedModules: [],
    });
  }, [editingMember, form, managerModuleKeys, open]);

  const openCreateForm = () => {
    setEditingMember(null);
    setOpen(true);
  };

  const openEditForm = (member) => {
    setEditingMember(member);
    setOpen(true);
  };

  const submitMember = async (values) => {
    setLoading(true);
    try {
      const payload = {
        name: values.name,
        email: values.email,
        role: values.role,
        assignedProjects: values.role === 'manager' ? [] : values.assignedProjects || [],
        assignedProjectModule: values.role === 'manager' ? false : !!values.assignedProjectModule,
        assignedModules: values.role === 'manager' ? values.assignedModules || [] : [],
      };

      if (values.password) {
        payload.password = values.password;
      }

      if (editingMember) {
        await updateTeamMember(editingMember._id, payload);
        notifySuccess('Team Member Updated', 'Team member details saved successfully.');
      } else {
        await createTeamMember(payload);
        notifySuccess('Team Member Registered', 'Team member account created successfully.');
      }

      form.resetFields();
      setOpen(false);
      setEditingMember(null);
      await loadData();
    } catch (error) {
      notifyError(editingMember ? 'Update Failed' : 'Register Failed', getApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const openViewMember = async (member) => {
    try {
      const response = await getTeamMember(member._id);
      setViewMember(response.data || null);
      setViewOpen(true);
    } catch (error) {
      notifyError('Member View Failed', getApiError(error));
    }
  };

  const removeMember = async (member) => {
    try {
      await deleteTeamMember(member._id);
      notifySuccess('Team Member Deleted', 'Team member account deleted successfully.');
      await loadData();
    } catch (error) {
      notifyError('Delete Failed', getApiError(error));
    }
  };

  const columns = [
    {
      title: 'Member Name',
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
    {
      title: 'Member Email',
      dataIndex: 'email',
      key: 'email',
      width: 260,
      render: (email) => <span className="team-email-cell"><MailOutlined /> {email}</span>,
    },
    {
      title: 'Assignments',
      key: 'assignments',
      width: 150,
      render: (_, record) => {
        if (record.role === 'manager') {
          const count = record.assignedModules?.length || 0;
          return <Tag className="team-count-tag">{count} Modules</Tag>;
        }
        const count = record.assignedProjectsCount ?? record.assignedProjects?.length ?? 0;
        return <Tag className="team-count-tag">{count} Projects</Tag>;
      },
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role) => {
        const config = roleConfig[role] || {};
        return (
          <Tag
            style={{
              color: config.color,
              background: config.bg,
              border: `1px solid ${config.border}`,
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 12,
              padding: '4px 14px',
            }}
          >
            {config.label || role}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 170,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button className="proj-action-btn" icon={<EyeOutlined />} onClick={() => openViewMember(record)} />
          </Tooltip>
          {isAdmin && (
            <>
              <Tooltip title="Edit Member">
                <Button className="proj-action-btn" icon={<EditOutlined />} onClick={() => openEditForm(record)} />
              </Tooltip>
              <Popconfirm
                title="Delete team member?"
                description="This will remove this member account."
                okText="Delete"
                cancelText="Cancel"
                onConfirm={() => removeMember(record)}
              >
                <Button className="proj-action-btn proj-delete-btn" icon={<DeleteOutlined />} danger />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const statCards = [
    { key: 'all', label: 'Team Members', icon: <TeamOutlined />, value: stats.total, theme: 'blue' },
    { key: 'developer', label: 'Developers', icon: <ProjectOutlined />, value: stats.developer, theme: 'cyan' },
    { key: 'manager', label: 'Managers', icon: <TeamOutlined />, value: stats.manager, theme: 'amber' },
  ];

  return (
    <div className="proj-premium-page team-premium-page">
      <div className="proj-hero-banner">
        <div className="proj-hero-glow" />
        <div className="proj-hero-glow-2" />
        <div className="proj-hero-content">
          <div className="proj-hero-left">
            <span className="proj-hero-badge">
              <RocketOutlined /> Team Management
            </span>
            <h1 className="proj-hero-title">
              Register your team with <span className="text-gradient">premium control.</span>
            </h1>
            <p className="proj-hero-subtitle">
              Create developer and manager accounts with role-based login and package-based module access.
            </p>
          </div>
          {isAdmin && (
            <div className="proj-hero-right">
              <button type="button" className="proj-hero-add-btn" onClick={openCreateForm}>
                <PlusOutlined /> Register Team Member
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="proj-stats-section">
        <Row gutter={[16, 16]}>
          {statCards.map((item) => (
            <Col xs={24} sm={12} lg={6} key={item.key}>
              <div
                className={`proj-stat-card proj-stat-${item.theme}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setFilter(item.key)}
              >
                <div className="proj-stat-card-inner">
                  <span className={`proj-stat-icon proj-stat-icon-${item.theme}`}>
                    {item.icon}
                  </span>
                  <div className="proj-stat-info">
                    <span className="proj-stat-label">{item.label}</span>
                    <strong className="proj-stat-value">{item.value}</strong>
                  </div>
                </div>
                <div className={`proj-stat-bar proj-stat-bar-${item.theme}`} />
              </div>
            </Col>
          ))}
        </Row>
      </div>

      <div className="proj-table-section">
        <div className="proj-table-header">
          <div className="proj-table-header-left">
            <span className="proj-table-kicker">Registered Accounts</span>
            <h2 className="proj-table-title">Team Members</h2>
          </div>
          <div className="proj-table-header-right">
            <Select
              value={filter}
              onChange={setFilter}
              options={[{ label: 'All Members', value: 'all' }, ...roleOptions]}
              size="large"
              className="proj-filter-select"
            />
          </div>
        </div>
        <div className="proj-table-wrapper">
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={filteredMembers}
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
          setEditingMember(null);
        }}
        footer={null}
        centered
        width={980}
        className="proj-premium-modal"
        styles={{ body: { maxHeight: '82vh', overflowY: 'auto' } }}
        forceRender={true}
      >
        <div className="proj-modal-header">
          <span className="proj-modal-badge"><TeamOutlined /> {editingMember ? 'Edit Team Member' : 'Register Team Member'}</span>
          <h2>{editingMember ? 'Update member account' : 'Create a team login account'}</h2>
          <p>Member login uses the member registered email, selected role, and the member password.</p>
        </div>
        <Form form={form} layout="vertical" onFinish={submitMember} requiredMark={false}>
          <div className="payment-two-col">
            <Form.Item name="name" label="Team Member Name" rules={[{ required: true, message: 'Member name is required' }]}>
              <Input size="large" placeholder="Enter member name" />
            </Form.Item>
            <Form.Item name="email" label="Member Contact Email" rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}>
              <Input size="large" placeholder="member@example.com" />
            </Form.Item>
          </div>
          <div className="payment-two-col">
            <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Role is required' }]}>
              <Select size="large" options={roleOptions} />
            </Form.Item>
            <Form.Item
              name="password"
              label={editingMember ? 'New Password' : 'Member Password'}
              rules={editingMember ? [] : [{ required: true, message: 'Password is required' }, { min: 8, message: 'Password must be at least 8 characters' }]}
            >
              <Input.Password size="large" placeholder={editingMember ? 'Leave blank to keep current password' : 'Create member password'} />
            </Form.Item>
          </div>
          {isManagerRole ? (
            <Form.Item
              name="assignedModules"
              label="Assign Module"
              rules={[{ required: true, message: 'Assign at least one module' }]}
            >
              <Checkbox.Group
                className="team-project-checkbox-grid"
                options={managerModuleOptions}
                style={{ maxHeight: 170, overflowY: 'auto' }}
              />
            </Form.Item>
          ) : (
            <>
              <Form.Item name="assignedProjects" label="Assign Projects">
                <Checkbox.Group className="team-project-checkbox-grid" style={{ maxHeight: 170, overflowY: 'auto' }}>
                  {projects.map((project) => (
                    <Checkbox value={project._id} key={project._id}>
                      {project.name}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </Form.Item>
              <Form.Item name="assignedProjectModule" valuePropName="checked" className="team-module-checkbox">
                <Checkbox>Assign Project Module — member will see only assigned Projects after login</Checkbox>
              </Form.Item>
            </>
          )}
          <Button type="primary" htmlType="submit" className="proj-submit-btn" loading={loading} block>
            {editingMember ? 'Save Member' : 'Register Member'} <ArrowRightOutlined />
          </Button>
        </Form>
      </Modal>

      <Modal
        title={null}
        open={viewOpen}
        onCancel={() => setViewOpen(false)}
        footer={null}
        centered
        width={780}
        className="proj-premium-modal"
      >
        <div className="proj-modal-header">
          <span className="proj-modal-badge"><EyeOutlined /> Member Details</span>
          <h2>{viewMember?.name || 'Team Member'}</h2>
          <p>Complete registered account and assigned access details.</p>
        </div>
        {viewMember && (
          <div className="team-view-grid">
            <div className="team-view-item">
              <span><UserOutlined /></span>
              <small>Name</small>
              <strong>{viewMember.name}</strong>
            </div>
            <div className="team-view-item">
              <span><MailOutlined /></span>
              <small>Member Contact Email</small>
              <strong>{viewMember.email}</strong>
            </div>
            <div className="team-view-item">
              <span><TeamOutlined /></span>
              <small>Role</small>
              <strong>{roleConfig[viewMember.role]?.label || viewMember.role}</strong>
            </div>
            <div className="team-view-item team-password-item">
              <span><LockOutlined /></span>
              <small>Password</small>
              <strong>{viewMember.plainPass || 'Not available'}</strong>
            </div>
            {viewMember.role === 'manager' ? (
              <div className="team-view-item team-view-projects">
                <span><ProjectOutlined /></span>
                <small>Assigned Modules</small>
                <div className="team-view-project-list">
                  {viewMember.assignedModules?.length ? viewMember.assignedModules.map((module) => (
                    <Tag key={module} className="team-count-tag">{moduleLabelMap[module] || module}</Tag>
                  )) : <strong>No modules assigned</strong>}
                </div>
              </div>
            ) : (
              <>
                <div className="team-view-item">
                  <span><ProjectOutlined /></span>
                  <small>Assigned Project Module</small>
                  <strong>{viewMember.assignedProjectModule ? 'Enabled' : 'Disabled'}</strong>
                </div>
                <div className="team-view-item team-view-projects">
                  <span><ProjectOutlined /></span>
                  <small>Assigned Projects</small>
                  <div className="team-view-project-list">
                    {viewMember.assignedProjects?.length ? viewMember.assignedProjects.map((project) => (
                      <Tag key={project._id || project} className="team-count-tag">{project.name || project}</Tag>
                    )) : <strong>No projects assigned</strong>}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
