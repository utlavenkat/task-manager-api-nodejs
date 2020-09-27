const express = require('express')
const bcrypt = require('bcryptjs')
const User = require('../models/user')
const { request, response } = require('express')

const auth = require('../middleware/auth')
const multer = require('multer')


const router = new express.Router()
const avatar = multer({
    //dest: 'avatars',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req,file,callback) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error('Please upload an image'))
        }
        callback(undefined,true)
    }
})

//User Registration API
router.post('/users', async (request,response) => {
    const user = new User(request.body)
    try {
       await user.save()
       const token = await user.generateAuthToken()
       response.status(201).send({user,token})    
    } catch (error) {
        response.status(400).send(error)
    }
})

//Read Users api
router.get("/users", auth,async (request,response) => {
    try {
      const users = await User.find()
      response.status(200).send(users)
    } catch (error) {
        response.status(500).send(error)
    }
})

//Read User Profile
router.get("/users/profile", auth,async (request,response) => {
    response.status(200).send(request.user)
})

//upload a file

router.post("/users/me/avatar", auth,avatar.single('avatar'),  async (request,response) => {
    const user = request.user
    user.avatar = request.file.buffer
    await user.save()
    response.status(200).send()
},(error,request,response,next) => {
    response.status(400).send({error:error})
})

//upload a file

router.delete("/users/me/avatar", auth, async (request,response) => {
    const user = request.user
    user.avatar = undefined
    await user.save()
    response.status(200).send()
},(error,request,response,next) => {
    response.status(400).send({error:error})
})

//Logout Api
router.post("/users/logout", auth,async (request,response) => {
    try {
        const token = request.token
        const user = request.user
        const newTokens = user.tokens.filter((currentToken) => token !== currentToken.token )
        user.tokens = newTokens
        await user.save()
        response.status(200).send()
    } catch (error) {
        response.status(500).send('Unable to logout')
    }
    
})

//Logout from All Devices Api
router.post("/users/logoutAll", auth,async (request,response) => {
    try {
        const user = request.user
        user.tokens = []
        await user.save()
        response.status(200).send()
    } catch (error) {
        response.status(500).send('Unable to logout')
    }
    
})

// Delete User API
router.delete("/users/profile",auth, async (request,response) => {
    try {
        const user = await User.findById(request.user._id)
        await user.remove()
        if(!user) {
            return response.status(404).send({error: 'User Not found'})
        }
        return response.status(200).send(user)
    } catch (error) {
        return response.status(500).send({error: 'Error while deleting user'})
    }

})

// Update User Profile
router.patch("/users/profile", auth, async (request,response) => {
    const updates = Object.keys(request.body)
    const allowedUpdates = ['name','age','email','password']
    const validUpdate = updates.every((update) => allowedUpdates.includes(update))

    if(!validUpdate) {
        return response.status(400).send({error: 'Invalid Update'})
    }

    try {
        const user = request.user
        updates.forEach((update) => {
            user[update] = request.body[update]
        })
        await user.save()
       //const user = await User.findByIdAndUpdate(request.params.id, request.body,{ new: true, runValidators: true})
       return response.status(200).send(user)
    } catch (error) {
        response.status(500).send(error)
    }
})

router.post('/users/login', async (request, response) => {
    try {
       const user = await User.findUserByCredentials(request.body.email, request.body.password)
       const token = await user.generateAuthToken()
       return response.status(200).send({user,token})
    } catch (error) {
        response.status(400).send({error:error.message})
    }
})

module.exports = router
