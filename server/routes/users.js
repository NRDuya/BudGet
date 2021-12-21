const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const UserError = require('../helpers/errors/UserError');
const UserModel = require('../models/Users');
const authenticateToken = require('../middleware/authenticateToken');

function isUserValid(username_){
    if( username_.match(/^[0-9a-zA-Z]+$/) &&
        username_.charAt(0).match(/[a-zA-Z]/) &&
        username_.length >= 3){
            return true;
        }
    else{
        return false;
    }
}

function isEmailValid(email_){
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email_);
} 
  
function isPasswordSecure (password_){
    if( password_.match(/[A-Z]/g) &&
        password_.match(/[0-9]/g) &&
        password_.match(/[^a-zA-Z\d]/g) &&
        password_.length >= 8){
            return true;
        }
    else{
        return false;
    }
};

router.get('/authenticate', authenticateToken, (req, res, next) => {
    return res.status(201).json({success: true});
})

router.post('/register', async function (req, res, next) {
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;
    let cpassword = req.body.cpassword;
    if(isUserValid(username) && isEmailValid(email) && isPasswordSecure(password) && password === cpassword){
        try {
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
    } else {
        return res.status(200).json({success: false, message: "Invalid inputs"});
    }
});

router.post('/login', async function (req, res, next) {
    let username = req.body.username;
    let password = req.body.password;
    
    if(isUserValid(username) && isPasswordSecure(password)){
        try {
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
    }
    else{
        return res.status(200).json({success: false, message: "Invalid inputs"});
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