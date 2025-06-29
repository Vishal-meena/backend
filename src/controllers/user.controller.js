import { asyncHandler } from "../utils/asyncHandler.js";

import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/Fileuploader.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async(req, res) => {

    //  get user details from frontend
    //  validation  - not empty
    //  check if user already exists: username, email
    //  check for images, check for avatat
    //  upload them to cloudinary, avatar 
    //  create user object  - create entry in db
    //  remove password and refresh token field from response
    //  check for user creation
    //  return res


    const { fullName, email, username, Password } = req.body
    console.log("email: ", email);

    if (
        [fullName, email, username, Password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser){
        throw new ApiError(409, "User with email or username already exists");
    }

    //console.log(req.files);

    const avatarLocalpath = req.files?.avatar[0]?.path;
    // const coverImageLocalpath = req.files?.coverImage[0]?.path;

    let coverImageLocalpath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
    {
        coverImageLocalpath = req.files.coverImage[0].path
    }

    if (!avatarLocalpath){
        throw new ApiError(400, "Avatar file is required");
        
    }

    const avatar = await uploadOnCloudinary(avatarLocalpath)
    const coverImage = await uploadOnCloudinary(coverImageLocalpath)

    if(!avatar)
    {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullName, 
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        Password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-Password -refreshToken"
    )

    if (!createdUser)
    {
        throw new ApiError(500, "Something went wrong while registering the user");
    }


    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully" )
    )
})


export {registerUser}