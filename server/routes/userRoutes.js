import express from 'express'
import userAuth from '../middleware/userAuth.js';
import { getUserData,getPublicUserProfile,updateProfile,addRating, getRatings,addFavoriteUser,removeFavoriteUser,getTopUsers,requestVerification } from '../controllers/userController.js';
import { requestProfileChange } from '../controllers/ProfileChangeController.js';
import { upload } from '../middleware/multer.js';
const userRouter = express.Router();
userRouter.get('/data',userAuth,getUserData)
userRouter.get('/profile/:userId',userAuth, getPublicUserProfile); // e.g. /api/user/profile/123
userRouter.post('/updateProfile', userAuth,upload.fields([{ name: 'avatar', maxCount: 1  }, { name: 'background', maxCount: 1  }]), updateProfile);
userRouter.post('/requestProfileChange', userAuth,upload.fields([{ name: 'avatar', maxCount: 1  }, { name: 'background', maxCount: 1  }]), requestProfileChange);
// Hodnocení
userRouter.post("/:userId/addRating", userAuth, addRating);
userRouter.get("/getRatings", userAuth, getRatings);
// favorites
userRouter.post("/favorites/add", userAuth, addFavoriteUser);
userRouter.post("/favorites/remove", userAuth, removeFavoriteUser);
// uživatel nahraje doklad
userRouter.post("/requestVerification",userAuth,upload.single("verificationDoc"),requestVerification);
//top
userRouter.get("/top", userAuth,getTopUsers)
export default userRouter;