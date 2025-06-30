import { Router } from 'express';
import { GroupController } from '@/controllers/groupController';
import { authenticateToken } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { groupSchemas } from '@/schemas/group';

const router = Router();
const groupController = new GroupController();

// Apply authentication middleware to all group routes
router.use(authenticateToken);

// Group management routes
router.post('/', validateRequest(groupSchemas.createGroup), groupController.createGroup);
router.get('/', groupController.getUserGroups);
router.get('/:groupId', groupController.getGroupById);
router.put('/:groupId', validateRequest(groupSchemas.updateGroup), groupController.updateGroup);
router.delete('/:groupId', groupController.deleteGroup);

// Group membership routes
router.post('/join', validateRequest(groupSchemas.joinGroup), groupController.joinGroup);
router.post('/:groupId/leave', groupController.leaveGroup);
router.get('/:groupId/members', groupController.getGroupMembers);

// Group preferences routes
router.post('/:groupId/preferences', validateRequest(groupSchemas.updatePreferences), groupController.updatePreferences);
router.get('/:groupId/preferences', groupController.getGroupPreferences);

// Invitation routes
router.post('/:groupId/invite', validateRequest(groupSchemas.generateInvite), groupController.generateInviteCode);
router.get('/invite/:inviteCode', groupController.getInviteDetails);

export default router; 