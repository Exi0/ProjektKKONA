import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { sendMessage, getMessages, markRead } from '../controllers/messageController.js';

const messageRouter = express.Router();

// poslat zprávu
messageRouter.post('/send', userAuth, sendMessage);

// načíst zprávy v konverzaci
messageRouter.get('/list', userAuth, getMessages);

// označit jako přečtené
messageRouter.post('/read', userAuth, markRead);

export default messageRouter;
