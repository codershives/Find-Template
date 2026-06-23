import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getTemplateLimitMessage, hasPurchasedTemplate, isPackageActive } from '../utils/packageRules.js';

const effectiveOwnerId = (req) => {
  if (req.user.role === 'admin' || req.user.isOwner) return req.user._id;
  return req.user.ownerId;
};

const ownerFilter = (req) => ({ ownerId: effectiveOwnerId(req) });

const isAssignedProjectRole = (role) => role === 'developer' || role === 'designer';

const canAccessProject = (req, projectId) => {
  if (!isAssignedProjectRole(req.user.role)) return true;
  const allowedProjectIds = (req.user.assignedProjects || []).map((assignedProjectId) => String(assignedProjectId));
  return allowedProjectIds.includes(String(projectId));
};

const projectAccessFilter = (req) => {
  const filter = ownerFilter(req);

  if (isAssignedProjectRole(req.user.role)) {
    filter._id = { $in: req.user.assignedProjects || [] };
  }

  return filter;
};

const teamMemberFilter = (req) => ({
  ownerId: effectiveOwnerId(req),
  role: { $in: ['developer', 'designer', 'manager'] },
});

const serializeProject = (project, assignedMembers = []) => ({
  ...(project.toObject ? project.toObject() : project),
  assignedMembers,
  assignedMembersCount: assignedMembers.length,
});

const validateProjectTemplateAccess = (req) => {
  if (!req.body.templateKey) return null;

  if (!isPackageActive(req.user)) {
    return getTemplateLimitMessage(req.user);
  }

  if (!hasPurchasedTemplate(req.user, req.body.templateKey)) {
    return 'This project template is not included in your purchased templates. Please add this template first or update your plan.';
  }

  return null;
};

export const listProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find(projectAccessFilter(req)).sort({ createdAt: -1 });
  const projectIds = projects.map((project) => project._id);
  const members = await User.find({ ...teamMemberFilter(req), assignedProjects: { $in: projectIds } })
    .select('name email role assignedProjects');

  const data = projects.map((project) => {
    const assignedMembers = members
      .filter((member) => (member.assignedProjects || []).some((projectId) => String(projectId) === String(project._id)))
      .map((member) => ({ _id: member._id, name: member.name, email: member.email, role: member.role }));

    return serializeProject(project, assignedMembers);
  });

  return res.json({ success: true, message: 'Projects fetched successfully', data });
});

export const createProject = asyncHandler(async (req, res) => {
  const templateAccessError = validateProjectTemplateAccess(req);
  if (templateAccessError) {
    return res.status(403).json({ success: false, message: templateAccessError });
  }

  const project = await Project.create({
    ...req.body,
    startDate: new Date(req.body.startDate),
    endDate: new Date(req.body.endDate),
    ownerId: req.user._id,
    createdBy: req.user._id,
  });

  return res.status(201).json({ success: true, message: 'Project created successfully', data: project });
});

export const getProject = asyncHandler(async (req, res) => {
  if (!canAccessProject(req, req.params.id)) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  const project = await Project.findOne({ _id: req.params.id, ...ownerFilter(req) });

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  const assignedMembers = await User.find({ ...teamMemberFilter(req), assignedProjects: project._id })
    .select('name email role')
    .sort({ createdAt: -1 });

  return res.json({
    success: true,
    message: 'Project fetched successfully',
    data: serializeProject(
      project,
      assignedMembers.map((member) => ({ _id: member._id, name: member.name, email: member.email, role: member.role }))
    ),
  });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOneAndDelete({ _id: req.params.id, ...ownerFilter(req) });

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  return res.json({ success: true, message: 'Project deleted successfully', data: null });
});

export const updateProjectStatus = asyncHandler(async (req, res) => {
  if (!canAccessProject(req, req.params.id)) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  const project = await Project.findOne({ _id: req.params.id, ...ownerFilter(req) });

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  project.status = req.body.status;
  await project.save();

  return res.json({ success: true, message: 'Project status updated successfully', data: project });
});

export const updateProjectTemplate = asyncHandler(async (req, res) => {
  if (!canAccessProject(req, req.params.id)) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  const project = await Project.findOne({ _id: req.params.id, ...ownerFilter(req) });

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  const isUpdatingTemplateDetails = req.body.templateKey !== undefined || req.body.templateName !== undefined || req.body.templateType !== undefined;

  if (isUpdatingTemplateDetails) {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can attach a template to a project.' });
    }

    const templateAccessError = validateProjectTemplateAccess(req);
    if (templateAccessError) {
      return res.status(403).json({ success: false, message: templateAccessError });
    }
  }

  if (req.body.templateKey !== undefined) project.templateKey = req.body.templateKey || null;
  if (req.body.templateName !== undefined) project.templateName = req.body.templateName || null;
  if (req.body.templateType !== undefined) project.templateType = req.body.templateType || null;
  if (req.body.templateContent !== undefined) project.templateContent = req.body.templateContent || null;
  if (req.body.heroImage !== undefined) project.heroImage = req.body.heroImage || '';
  project.templateUpdatedAt = new Date();
  project.templateUpdatedBy = req.user._id;

  await project.save();

  const assignedMembers = await User.find({ ...teamMemberFilter(req), assignedProjects: project._id })
    .select('name email role')
    .sort({ createdAt: -1 });

  return res.json({
    success: true,
    message: 'Template changes saved successfully',
    data: serializeProject(
      project,
      assignedMembers.map((member) => ({ _id: member._id, name: member.name, email: member.email, role: member.role }))
    ),
  });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, ...ownerFilter(req) });

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  const { name, status, startDate, endDate, clientName, budget } = req.body;

  if (name !== undefined) project.name = name;
  if (status !== undefined) project.status = status;
  if (startDate !== undefined) project.startDate = new Date(startDate);
  if (endDate !== undefined) project.endDate = new Date(endDate);
  if (clientName !== undefined) project.clientName = clientName;
  if (budget !== undefined) project.budget = budget;

  await project.save();

  return res.json({ success: true, message: 'Project updated successfully', data: project });
});
