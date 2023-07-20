const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
   
username: {
    type: String
      
 },
ip: {
    type: String
    
}
}, { timestamps: true})

const data = mongoose.model('data', dataSchema)
module.exports = data