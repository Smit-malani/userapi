const express = require('express')
const app = express()
const dotenv = require('dotenv')
dotenv.config()
const dbConnect = require('./config/dbConnect')
const fileUpload = require('express-fileupload')
const userRoute = require('./routes/userRoutes')
const categoryRoute = require('./routes/categoryRoutes')
const productRoute = require('./routes/productRoutes') 
const verifyUser = require('./middlewares/auth')

async function startServer(){
    try {
        await dbConnect()
        app.listen(3000,()=>{
            console.log('server runing on port 3000')
        })
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
}

startServer()

app.use(express.json())
app.use(fileUpload())

app.use('/user', verifyUser(['admin']), userRoute)
app.use('/category', verifyUser(['admin', 'sub-admin']), categoryRoute)
app.use('/product',verifyUser(['admin', 'sub-admin']), productRoute)
