const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    username:{
        type: String,
        required: true,
        unique: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    passwordHash:{
        type: String,
        required: true,
    },
    profilePicture:{
        type: String,
    },
    bio:{
        type: String,
         
    },
    about: { // নতুন যোগ করা হলো
        type: String,
        default: ""
    },
    friends:[{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],  
},{timestamps:true})


module.exports = mongoose.model('User', userSchema);