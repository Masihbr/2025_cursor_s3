import { Router } from 'express';
import { GroupController } from '@/controllers/groupController';
import { authenticateToken } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { createGroupSchema, joinGroupSchema, updatePreferencesSchema } from '@/schemas/group';

const router = Router();
const groupController = new GroupController();

// Apply authentication middleware to all group routes
router.use(authenticateToken);

// POST /api/groups - Create a new group
router.post('/', validateRequest(createGroupSchema), groupController.createGroup.bind(groupController));

// GET /api/groups - Get all groups for the authenticated user
router.get('/', groupController.getUserGroups.bind(groupController));

// GET /api/groups/:groupId - Get specific group details
router.get('/:groupId', groupController.getGroupById.bind(groupController));

// DELETE /api/groups/:groupId - Delete a group (owner only)
router.delete('/:groupId', groupController.deleteGroup.bind(groupController));

// POST /api/groups/:groupId/invite - Generate new invitation code (owner only)
router.post('/:groupId/invite', groupController.generateInviteCode.bind(groupController));

// GET /api/groups/invite/:inviteCode - Get invitation details
router.get('/invite/:inviteCode', groupController.getInviteDetails.bind(groupController));

// POST /api/groups/join - Join a group using invitation code
router.post('/join', validateRequest(joinGroupSchema), groupController.joinGroup.bind(groupController));

// POST /api/groups/:groupId/leave - Leave a group
router.post('/:groupId/leave', groupController.leaveGroup.bind(groupController));

// POST /api/groups/:groupId/preferences - Update user's genre preferences
router.post('/:groupId/preferences', validateRequest(updatePreferencesSchema), groupController.updatePreferences.bind(groupController));

// GET /api/groups/:groupId/preferences - Get group preferences
router.get('/:groupId/preferences', groupController.getGroupPreferences.bind(groupController));

export default router; 