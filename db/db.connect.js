const mongoose = require('mongoose');
require('dotenv').config();
const dbURI = process.env.DB_URI;

const dbConnect = async () =>{
    try{  
        await mongoose.connect(dbURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
        })
        console.log("Connection sucessful");
      }
      catch(err){
        console.error(err)
      }
}

module.exports = dbConnect;