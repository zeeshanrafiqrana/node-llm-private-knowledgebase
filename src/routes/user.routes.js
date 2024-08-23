import { Router } from "express";
import {
  changeCurrentPassword,
  deleteUser,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.firebase.middleware.js";

const router = Router();

router.route("/register").post(
  upload.single("avatar"),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-user").patch(verifyJWT, updateAccountDetails);
router
  .route("/update-user-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/delete-user").delete(verifyJWT, deleteUser);

export default router;
