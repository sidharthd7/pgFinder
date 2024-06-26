import User from '../models/user.js'
import UserVerification from '../models/userVerification'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'

export const register = async (req,res,next) => {
    try {
        const { name, email, password, phone } = req.body;

        // Finding if already exists
        let user = await User.findOne({ email: email });
        if (user) {
            throw new Error("Email already registered");
        }

        const salt = 10;
        const secPass = await bcrypt.hash(password, salt);
        user = await new User({
            name: name,
            password: secPass,
            email: email,
            phone: phone,
            verified: false
        });
        await user.save()
    }
    catch (errors) {
        res.json({ errors: errors.message, status: false })
    }
}


export const verifyOTP = async(req,res)=>{
    try{
        let {userId, otp} = req.body;
        if(!userId || !otp){
            throw new Error("Empty details are not allowed");
        }
        else{
            const records = await UserVerification.find({userId}).sort({createdAt: -1});
            if(records?.length<=0){
                throw new Error("Account record not exists or has been already verified");
            }
            else{
                const {expiresAt} = records[0];
                const hashOTP = records[0].otp;
                if(expiresAt){
                    if(expiresAt < Date.now().toString()){
                        await UserVerification.deleteMany({userId})
                        throw new Error("Code has expired. Please request again");
                    }else{
                        const validOTP = await bcrypt.compare(otp,hashOTP);
                        if(!validOTP){
                            throw new Error("Invalid Code");
                        }else{
                            const user = await User.findOneAndUpdate({_id: userId}, {verified: true}, {
                                new: true
                            });
                            await UserVerification.deleteMany({userId});
                            const data = {
                                user:{
                                    id: user?.id
                                }
                            }
                            const userAuthToken = jwt.sign(data,process.env.JWT_SECRET);
                            res.json({data: user,userAuthToken: userAuthToken,status: true});
                        }
                    }
                }
            }
        }
    }catch(error){
        res.json({status: false, errors: error.message})
    }
}

export const login = async(req,res,next)=>{
    try{

        const {email, password} = req.body;
        console.log(email,password)
        if(!email || !password){
            throw new Error("Details cannot be blank");
        }

        let user = await User.findOne({email: email});
        if(!user){
            throw new Error("Invalid Credentials");
        }
        const validPass = await bcrypt.compare(password, user.password);
        if(!validPass){
            throw new Error("Invalid Credentials");
        }
        
            // JWT AUTH
            const data = {
                user:{
                    id: user.id
                }
            }
            const userAuthToken = jwt.sign(data,'sidharth');
            res.json({data: user,userAuthToken: userAuthToken,status: true});
        
    }catch(error){
        res.json({status: false, errors: error.message})
    }
}

// const sendVerificationMail = async (user,res) => {
//         try {
//             const otp = `${Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000}`;
//             const secotp = await bcrypt.hash(otp, 10);
//             const newVerification = await new UserVerification({
//                 userId: user._id,
//                 otp: secotp,
//                 createdAt: Date.now(),
//                 expiresAt: Date.now() + 15*60000,
//             });

//             await newVerification.save();

//             // mail configrations
//             let config = {
//                 service: "gmail",
//                 auth: {
//                     user: process.env.AUTH_EMAIL,
//                     pass: process.env.AUTH_PASS
//                 }
//             }

//             let transporter = nodemailer.createTransport(config);
//             const mailoptions = {
//                 from: '"pgFinder" <pgfinder@gmail.com>',
//                 to: user.email,
//                 subject: "Verify your Email",
//                 html: `
//                     <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
//                         <div style="margin:2px auto;width:90%;padding:0px 0">
//                         <div style="border-bottom:1px solid #eee">
//                             <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">pgFinder</a>
//                         </div>
//                         <p style="font-size:1.2em">Hi, <i><b>${user.name}</b></i></p>
//                         <p style="font-size:1.1em">Use the following OTP to complete your Sign Up procedures. OTP is valid for 15 minutes</p>
//                         <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
//                         <p style="font-size:1em;">Regards,<br />pgFinder</p>
//                         <hr style="border:none;border-top:1px solid #eee" />
//                         <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
//                             <p>pgFinder Inc</p>
//                             <p>India</p>
//                         </div>
//                         </div>
//                     </div>
//                 `
//             }
//             await transporter.sendMail(mailoptions);
//             res.json({
//                 status: "Pending",
//                 message: "OTP sent to email address",
//                 data: {
//                     userId: user._id,
//                     email: user.email
//                 }
//             })
//         } catch (errors) {
//             res.json({ status: false, message: errors.message });
//         };
// }