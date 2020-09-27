const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const { urlencoded } = require('express')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true,
        validate(age) {
            if(age < 0) {
                throw new Error('Age should be greater than zero')
            }
        }
    },

    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('Email address is not valid')
            }
        }
 
    },

    password: {
        type: String,
        trim: true,
        required: true,
        validate(value) {
            if(value.includes('password')) {
                throw new Error('Invalid password provided')
            }
        }
    },

    tokens: [{
        token : {
            type: String        }
    }],
    avatar: {
        type: Buffer
    }

},{
    timestamps:true
})

userSchema.pre('save', async function(next) {
    const user = this
    if(user.isModified('password')) {
       user.password = await bcrypt.hash(user.password,8)
    }
    return user
})

userSchema.pre('remove', async function(next) {
    const user = this
    await Task.deleteMany({owner: user._id})
    next()
})

userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({ _id: user._id.toString()},process.env.JWT_ENC_TOKEN)
    user.tokens = user.tokens.concat({token})
    await user.save()

    return token
}

userSchema.methods.toJSON =  function() {
    const user = this
    const userObject = user.toObject()

    delete userObject.tokens
    delete userObject.password
    delete userObject.__v

    return userObject
}

userSchema.statics.findUserByCredentials = async (email,password) => {
    const user = await User.findOne({email})
    if(user === null) {
        throw new Error('Incorrect Email or Password')
    }
    const passwordMatched = await bcrypt.compare(password,user.password)

    /*if(!passwordMatched) {
        throw new Error('Incorrect Email or Password')
    }*/
    return user
}

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
}) 

const User = mongoose.model('User',userSchema)

module.exports = User
