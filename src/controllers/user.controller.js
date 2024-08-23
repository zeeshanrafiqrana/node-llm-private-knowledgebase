import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { options } from "../utils/cookieOptions.js";
import { uploadOnFirebase } from "../utils/firebase.js";

const genrateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access token and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body;
  const avatarLocalPath = req.file;
  if (
    [username, fullName, email, password].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avatar = await uploadOnFirebase(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    avatar: avatar,
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(400, "User does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await genrateAccessAndRefreshToken(
    user._id
  );
  const logedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: logedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logout successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodesToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodesToken?._id);
    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } = await genrateAccessAndRefreshToken(
      user._id
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confPassword } = req.body;

  if (!(confPassword || newPassword)) {
    throw new ApiError(400, "Confirm password are note matche");
  }

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  return res
    .status(200)
    .json(new ApiResponse(200, user, "current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  try {
    const { username, fullName, email } = req.body;
    if (!(username || fullName || email)) {
      throw new ApiError(400, "invalid details");
    }

    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (username) user.username = username;
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;

    await user.save({ validateBeforeSave: true });
    return res
      .status(200)
      .json(new ApiResponse(200, user, "Account details updated successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "An error occurred while updating the user"
    );
  }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  try {
    const avatarLocalPath = req.file;
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
    }
    const avatar = await uploadOnFirebase(avatarLocalPath);
    if (!avatar) {
      throw new ApiError(400, "Avatar file is required");
    }
    const user = req.user;
    if (avatar) user.avatar = avatar;
    await user.save({ validateBeforeSave: true });
    return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar Update Successfuly"));
  } catch (error) {
    throw new ApiError(500, "something went wrong while uploading avatar");
  }
});
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "User deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "An error occurred while deleting the user");
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  deleteUser,
};
