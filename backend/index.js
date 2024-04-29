import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import authRoutes from "./routes/auth"
import propertyRoutes from './routes/property'
import dotenv from 'dotenv'

dotenv.config()
const app = express()

app.use(express.json());
app.use(cors());
app.use(authRoutes);
app.use(propertyRoutes);


//DB CONNECT
const dbURL = process.env.DB_URL || 'mongodb+srv://sdhawan1be22:g9kMw5kAgZWSPPwl@cluster0.32r4job.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(dbURL).then(()=>{
    console.log("Mongo Connected");
}).catch((err)=>{
    console.log(err);
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
    console.log(`Server running on ${PORT}`);
})