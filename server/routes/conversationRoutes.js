import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { startConversation, getUserConversations } from '../controllers/conversationController.js';

const conversationRouter = express.Router();

// založit konverzaci (inzerát + 2 účastníci)
conversationRouter.post('/start', userAuth, startConversation);

// získat všechny konverzace uživatele
conversationRouter.get('/user', userAuth, getUserConversations);

export default conversationRouter;
