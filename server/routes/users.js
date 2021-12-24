const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const UserError = require('../helpers/errors/UserError');
const UserModel = require('../models/Users');
const authenticateToken = require('../middleware/authenticateToken');
const UserCheck = require('../utils/userCheck');

router.get('/authenticate', authenticateToken, (req, res, next) => {
    return res.status(201).json({success: true});
})

router.post('/register', async function (req, res, next) {
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;
    let cpassword = req.body.cpassword;

    try {
        if (!UserCheck.isUserValid(username)) {
            throw new UserError("Invalid username", 200);
        } else if (!UserCheck.isEmailValid(email)) {
            throw new UserError("Invalid email", 200);
        } else if (!UserCheck.isPasswordSecure(password) && password !== cpassword) {
            throw new UserError("Invalid password", 200);
        }

        const usernameExists = await UserModel.usernameExists(username);
        const emailExists = await UserModel.emailExists(email);
        
        if (usernameExists) throw new UserError("Registration Failed: Username already exists", 200);
        if (emailExists) throw new UserError("Registration Failed: Email already exists", 200);
        
        if (!usernameExists && !emailExists) {
            const userId = await UserModel.create(username, password, email);
            if (userId < 0) {
                throw new UserError("Server Error, user could not be created", 500);
            } else {
                return res.status(201).json({success: true, message: "User registration successful"});
            }
        }
    }
    catch (err) {
        if (err instanceof UserError) {
            return res.status(err.getStatus()).json({success: false, message: err.getMessage()});
        } else next(err);
    }
});

router.post('/login', async function (req, res, next) {
    let username = req.body.username;
    let password = req.body.password;

    try {
        if (!UserCheck.isUserValid(username)) {
            throw new UserError("Invalid username", 200);
        } else if (!UserCheck.isPasswordSecure(password)) {
            throw new UserError("Invalid password", 200);
        }
        
        const userId = await UserModel.authenticate(username, password);
        if(userId > 0){
            const token = jwt.sign(userId, process.env.ACCESS_TOKEN_SECRET);

            res.cookie('token', token, { httpOnly: true, maxAge: 3600000 });  
            return res.status(201).json({success: true, token: token, username: username});
        } else {
            throw new UserError("Invalid username and/or password", 200);
        }
    }
    catch (err) {
        if (err instanceof UserError) {
            return res.status(err.getStatus()).json({success: false, message: err.getMessage()});
        } else next(err);
    }
});

router.post('/logout', authenticateToken, (req, res, next) => {
    // req.session.destroy((err) => {
    //     if(err){
    //         console.log("Session could not be destroyed");
    //         next(err);
    //       }
    //       else{
    //         res.clearCookie('userid');
    //         return res.status(200).json({success: true, message: "User logout successful", redirect: "/login"});
    //       }
    // })
    res.cookie('token', '', { httpOnly: true, maxAge: 1});  
    return res.status(201).json({success: true});
});
module.exports = router;