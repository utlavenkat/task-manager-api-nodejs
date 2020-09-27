const { request, response } = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (request,response,next) => {
    try {
        const token = request.header('Authorization').replace('Bearer ','')
        const decoded =  jwt.verify(token,'mytoken')
        const user = await User.findOne({_id:decoded._id,'tokens.token':token})
        if(!user) {
            throw new Error()
        }
        request.user = user
        request.token = token
        next()
    } catch (error) {
        console.trace(error)
        response.status(401).send('Authentication Failed.')
    }
}

module.exports = auth