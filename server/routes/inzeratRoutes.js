import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { 
    createItem, 
    deleteInzerat, 
    getInzeratData, 
    getInzeratItemData,
    getPendingInzeraty,
    publishInzerat,
    getUserInzerats, 
    editInzerat,
    getUserFavoriteInzerats, 
    addToFavoriteInzerat, 
    removeFromFavoriteInzerat, 
    addInterestedUser, 
    removeInterestedUser,
    incrementViews,         
    getNearbyInzerats,        
    selectWinner,
    getWinnerInzerats,
    setInterestedUserLike,
    setInterestedUserRead,
    getMapInzerats             
} from '../controllers/inzeratController.js';

const inzeratRouter = express.Router();

// 🟢 CRUD routes
inzeratRouter.post('/createInzerat', userAuth, createItem);
inzeratRouter.delete('/deleteInzerat', userAuth, deleteInzerat);
inzeratRouter.post('/editInzerat', userAuth, editInzerat);
inzeratRouter.post('/publishInzerat', userAuth, publishInzerat);

// 🟢 Get routes
inzeratRouter.get('/getInzeraty', userAuth, getInzeratData);
inzeratRouter.get('/getInzerat', userAuth, getInzeratItemData);
inzeratRouter.get('/getUserInzerats', userAuth, getUserInzerats);
inzeratRouter.get('/getPendingInzerats', userAuth, getPendingInzeraty);
inzeratRouter.get('/getUserFavoriteInzerats', userAuth, getUserFavoriteInzerats);

// 🟢 Favorites
inzeratRouter.post('/addToFavoriteInzerat', userAuth, addToFavoriteInzerat);
inzeratRouter.post('/removeFromFavoriteInzerat', userAuth, removeFromFavoriteInzerat);


// 🟢 Interested users
inzeratRouter.post('/addInterestedUser', userAuth, addInterestedUser);
inzeratRouter.post('/removeInterestedUser', userAuth, removeInterestedUser);
inzeratRouter.post('/setInterestedUserLike', userAuth, setInterestedUserLike);
inzeratRouter.post('/setInterestedUserRead', userAuth, setInterestedUserRead);
// 🟢 Winner
inzeratRouter.post('/selectWinner',userAuth,selectWinner)
inzeratRouter.get("/getWinnerInzerats", getWinnerInzerats);
// 🆕 Extras
inzeratRouter.post('/incrementViews', userAuth, incrementViews);         // ✅ Přičíst zobrazení
inzeratRouter.get('/getNearbyInzerats', userAuth, getNearbyInzerats);    // ✅ Najít inzeráty poblíž
inzeratRouter.get('/getMapInzerats', userAuth, getMapInzerats);

export default inzeratRouter;

