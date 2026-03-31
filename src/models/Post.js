const mongoose = require('mongoose')


const postSchema = new mongoose.Schema({
    author:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content:{
        type: String,
        trim: true,
        default: ""
        // required: true,
    },
    image:{
        type: String,
    },
    likes: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    commentCount:{
        type: Number,
        default: 0,
    }

}, {timestamps:true})

postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema)

