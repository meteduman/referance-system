const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
   
username: {
    type: String
      
 },
 email: {
    type: String
    
},
key: {
    type: String
    
}

}, { timestamps: true})

const log = mongoose.model('log', logSchema)
module.exports = log