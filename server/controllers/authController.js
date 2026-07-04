import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE,PASSWORD_RESET_TEMPLATE,NEWUSER_TEMPLATE} from '../config/emailTemplates.js';
export const register = async (req,res,next)=>{
    const {name,email,heslo,ico} = req.body;

    if(!name || !email || !heslo || !ico){
        return res.json(({success:false,
            message:'Chybějící detaily'
        }))
    }
    try {

        const existingUserEmail = await userModel.findOne({email});
        const existingUserICO = await userModel.findOne({ico});
        if(existingUserEmail){
            return res.json({success: false, message: `Uživatel s emailem: ${email} už existuje`})
        }
        if(existingUserICO){
            return res.json({success: false, message: `Uživatel s ICO: ${ico} už existuje`})
        }
        const hashedPassword = await bcrypt.hash(heslo, 10)
        
        const user = new userModel({name,email,ico,heslo:hashedPassword})
        await user.save();

        const token = jwt.sign({id: user._id},process.env.JWT_SECRET,{expiresIn: '7d'});
        res.cookie('token',token, {
            httpOnly:true,
            secure: process.env.NODE_ENV ==='production',
            sameSite:process.env.NODE_ENV ==='production'?'none':'strict',
            maxAge:7 * 24 * 60 * 60 * 1000
        });
         // 🔹 Odeslání uvítacího e-mailu
        const verifyLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/email-verify`;
        const htmlContent = NEWUSER_TEMPLATE
        .replace("{{name}}", user.name);
        const mailOptions = {
            from:process.env.SENDER_EMAIL,
            to:email,
            subject: 'Vítá vás Projekt KKona Tinder',
            html: htmlContent,
        }

        await transporter.sendMail(mailOptions)

        return res.json({success:true})
    }
    catch(error){
        // type:"reg" zachováno kvůli frontendu; interní detail jde do logu přes handler
        error.status = 400;
        error.clientResponse = { success:false, type:"reg", message:"Registrace selhala" };
        return next(error)
    }
}
export const login = async (req,res,next)=>{
    const {email,heslo} = req.body;
    if(!email||!heslo){
        return res.json({success:false,
            message: 'Email a heslo jsou potřebné'
        })
    }
    try{
        const user = await userModel.findOne({email})
        if(!user){
            return res.json({success:false,message:'Uživatel nenalezen'})
        }
        const isMatch= await bcrypt.compare(heslo,user.heslo)
        if(!isMatch){
            return res.json({success:false,message:'Neplatné heslo'})
        }
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn: '7d'});
        res.cookie('token',token, {httpOnly:true,
            secure: process.env.NODE_ENV ==='production',
            sameSite:process.env.NODE_ENV ==='production'?'none':'strict',
            maxAge:7 * 24 * 60 * 60 * 1000
        });
        return res.json({success:true})
    }catch(error){
        return next(error)
    }
}
export const logout = async (req,res,next)=>{
    try{
        res.clearCookie('token', {
            httpOnly:true,
            secure: process.env.NODE_ENV ==='production',
            sameSite:process.env.NODE_ENV ==='production'?'none':'strict',
        });
        return res.json({success:true,message:'Byl jste odhlášen'});
    }catch(error){
        return next(error)
    }
}

export const sendVerifyOtp = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.json({ success: false, message: "Chybí userId" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "Uživatel nenalezen" });
    }

    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Účet už byl ověřen" });
    }

    // 🔢 Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
    user.verifyOtpAttempts = 0; // ✅ nový kód → vynulovat pokusy
    await user.save();

    // 📨 E-mail
    const htmlContent = EMAIL_VERIFY_TEMPLATE
      .replace(/{{otp}}/g, otp)
      .replace(/{{email}}/g, user.email);

    const mailOptions = {
      from: `"Projekt KKONA" <${process.env.SENDER_EMAIL}>`,
      to: user.email,
      subject: "✅ Ověření účtu – Projekt KKONA",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Ověřovací kód byl odeslán na e-mail." });
  } catch (error) {
    return next(error);
  }
};
export const verifyEmail = async (req,res,next)=>{
    const {userId,otp}= req.body;
    if(!userId || !otp){
        return res.json({success:false, message:'Chybějící údaje'})
    }
    try{
        const user= await userModel.findById(userId);
        if(!user){
            return res.json({success:false, message:'Uživatel nenalezen'})
        }
        if(user.verifyOtp===''){
            return res.json({success:false, message:'Kod je invalidní'})
        }
        if(user.verifyOtpExpireAt < Date.now()){
            return res.json({success:false, message:'Kod je expirován'})
        }
        // ✅ limit pokusů – ochrana proti brute-force 6místného kódu
        if(user.verifyOtpAttempts >= 5){
            user.verifyOtp='';
            user.verifyOtpExpireAt=0;
            await user.save();
            return res.json({success:false, message:'Příliš mnoho pokusů. Vyžádejte si nový kód.'})
        }
        if(user.verifyOtp!==otp){
            user.verifyOtpAttempts += 1;
            await user.save();
            return res.json({success:false, message:'Kod je invalidní'})
        }
        user.isAccountVerified=true;
        user.verifyOtp='';
        user.verifyOtpExpireAt=0;
        user.verifyOtpAttempts=0;

        await user.save();
        return res.json({success:true,message:'Email ověren'
        })
    }catch(error){
        return next(error)
    }
}

export const isAuthenticated = async(req,res,next)=>{
    try {
        return res.json({success:true})
    } catch (error) {
        return next(error)
    }
}

export const sendResetOtp = async (req,res,next)=>{
    const {email}=req.body;
    if(!email){
        return res.json({success:false,message:"Email je potřebný"})
    }
    try {
        const user = await userModel.findOne({email})
        if(!user){
            return res.json({success:false,message:"Uživatel nenalezen"}) 
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000
        user.resetOtpAttempts = 0; // ✅ nový kód → vynulovat pokusy

        await user.save();

        const mailOption = {
            from:process.env.SENDER_EMAIL,
            to:user.email,
            subject: 'Kod pro resetování hesla',
            //text: `Váš kod pro resetování hesla je ${otp}. Použijte tento kod pro obnovení hesla.`,
            html:PASSWORD_RESET_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
        }
        await transporter.sendMail(mailOption)
         return res.json({success:true, message:"Kod pro reset odeslan"})
    } catch (error) {
        return next(error)
    }
}
export const resetPassword = async (req,res,next)=>{
    const {otp,email,newPassword}= req.body;
    if(!otp || !email || !newPassword){
        return res.json({success:false, message:'Email, kod a nové heslo jsou potřebné'})
    }
    try {
        
        const user= await userModel.findOne({email})
        if(!user){
            return res.json({success:false,message:"Uživatel nenalezen"})
        }
        if(user.resetOtp===""){
            return res.json({success:false,message:"Invalidní kod"})
        }
        if(user.resetOtpExpireAt < Date.now()){
            return res.json({success:false,message:"Kod je expirovaný"})
        }
        // ✅ limit pokusů – ochrana proti brute-force 6místného kódu
        if(user.resetOtpAttempts >= 5){
            user.resetOtp="";
            user.resetOtpExpireAt=0;
            await user.save();
            return res.json({success:false,message:"Příliš mnoho pokusů. Vyžádejte si nový kód."})
        }
        if(user.resetOtp!==otp){
            user.resetOtpAttempts += 1;
            await user.save();
            return res.json({success:false,message:"Invalidní kod"})
        }

        const hashedPassword= await bcrypt.hash(newPassword,10)
        user.heslo=hashedPassword;
        user.resetOtp="";
        user.resetOtpExpireAt=0;
        user.resetOtpAttempts=0;

        await user.save()

        return res.json({success:true,message:"Heslo uspěšně aktualizováno"})
    
    } catch (error) {
        return next(error)
    }
}
