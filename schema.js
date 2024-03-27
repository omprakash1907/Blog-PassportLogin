const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name : String,
    email : {
        type: String,
        unique : true
    },
    password: String
})

const postSchema = new mongoose.Schema({
    post : {
        type: String,
        required: true,
    },
    file: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    }
})

const userModel = mongoose.model('user', userSchema)
const postModel = mongoose.model('post', postSchema)

module.exports = {userModel, postModel}