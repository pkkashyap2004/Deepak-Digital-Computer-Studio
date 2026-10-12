const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Razorpay = require("razorpay");
const { Resend } = require("resend");
const { db } = require("../services/database");
const { seedDb } = require("../services/catalogSeed");
const { sendEmail } = require("../services/emailService");
const { Product, User, Order, Coupon, Inquiry, EmailOtp, SiteMetric } = require("../models");
const { token, auth, admin } = require("../middleware/auth");

function registerApiController(app) {
app.get("/api/health",async(_,res)=>{try{await db();res.json({status:"ok",service:"Deepak Digital Commerce API",database:"connected"})}catch(e){res.status(500).json({status:"error",message:e.message})}});
app.get("/api/products",async(req,res)=>{try{await seedDb();const q=String(req.query.q||""),cat=String(req.query.category||"");const filter={active:true,...(q?{$or:[{name:new RegExp(q,"i")},{category:new RegExp(q,"i")}]}:{}),...(cat?{category:cat}:{})};res.json(await Product.find(filter).sort({featured:-1,createdAt:-1}))}catch(e){res.status(500).json({message:e.message})}});
app.get("/api/products/:slug",async(req,res)=>{try{await seedDb();const p=await Product.findOne({slug:req.params.slug,active:true});if(!p)return res.status(404).json({message:"Product not found"});res.json(p)}catch(e){res.status(500).json({message:e.message})}});
app.post("/api/contact",async(req,res)=>{try{await db();const name=String(req.body?.name||"").trim(),phone=String(req.body?.phone||"").trim(),email=String(req.body?.email||"").trim(),service=String(req.body?.service||"").trim(),message=String(req.body?.message||"").trim();if(name.length<2||name.length>100||!phone||phone.length>25||message.length<2||message.length>1500)return res.status(400).json({message:"Please enter your name, a valid phone number and your message."});if(email&&(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)||email.length>254))return res.status(400).json({message:"Please enter a valid email address."});await Inquiry.create({productName:"General Website Contact"+(service?" — "+service:""),name,phone,note:"Email: "+(email||"Not provided")+"\\nService: "+(service||"Not specified")+"\\nMessage: "+message});if(process.env.RESEND_API_KEY&&process.env.CONTACT_EMAIL){await sendEmail(process.env.CONTACT_EMAIL,"New DDCS website enquiry from "+name,"<h2>New website enquiry</h2><p><b>Name:</b> "+name.replace(/[<>]/g,"")+" </p><p><b>Phone:</b> "+phone.replace(/[<>]/g,"")+"</p><p><b>Email:</b> "+(email||"Not provided").replace(/[<>]/g,"")+"</p><p><b>Service:</b> "+service.replace(/[<>]/g,"")+"</p><p><b>Message:</b> "+message.replace(/[<>]/g,"")+"</p>");}return res.status(201).json({success:true,message:"Thank you! Your enquiry has been received. You can also call 9794210366."});}catch(e){console.error("Contact enquiry failed:",e.message);return res.status(500).json({message:"Could not submit enquiry. Please try again or call 9794210366."})}});
app.post("/api/products/:slug/view",async(req,res)=>{try{await db();const p=await Product.findOneAndUpdate({slug:req.params.slug,active:true},{$inc:{views:1}},{new:true,projection:{views:1}});if(!p)return res.status(404).json({message:"Service not found"});res.json({views:p.views})}catch(e){res.status(500).json({message:"Could not record view"})}});
app.post("/api/products/:slug/inquiry",async(req,res)=>{try{await db();const name=String(req.body?.name||"").trim(),phone=String(req.body?.phone||"").trim(),note=String(req.body?.note||"").trim();if(name.length<2||!phone||phone.length>25)return res.status(400).json({message:"Please enter your name and a valid contact number."});const p=await Product.findOne({slug:req.params.slug,active:true});if(!p)return res.status(404).json({message:"Service not found"});await Inquiry.create({productId:p._id.toString(),productName:p.name,name,phone,note});p.inquiries=(Number(p.inquiries)||0)+1;await p.save();res.status(201).json({success:true,inquiries:p.inquiries,message:"Enquiry received. Our team will contact you soon."})}catch(e){res.status(500).json({message:"Could not submit enquiry. Please try again."})}});
app.post("/api/auth/otp/request",async(req,res)=>{
  try{
    if(!process.env.JWT_SECRET)return res.status(503).json({message:"Email OTP sign-in is not configured: JWT_SECRET is missing."});
    if(!process.env.RESEND_API_KEY)return res.status(503).json({message:"Email OTP is not configured yet. Add RESEND_API_KEY in the deployment environment."});
    const email=String(req.body?.email||"").trim().toLowerCase();
    const suppliedName=String(req.body?.name||"").trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return res.status(400).json({message:"Enter a valid email address."});
    if(suppliedName.length>100)return res.status(400).json({message:"Name must be 100 characters or fewer."});
    await db();
    const user=await User.findOne({email});
    if(!user&&suppliedName.length<2)return res.status(400).json({message:"Enter your name to create a new account with email OTP."});
    const now=new Date();
    const prior=await EmailOtp.findOne({email});
    if(prior&&now.getTime()-new Date(prior.lastSentAt).getTime()<60000)return res.status(429).json({message:"Please wait 60 seconds before requesting another code."});
    const sameWindow=prior&&now.getTime()-new Date(prior.windowStartedAt).getTime()<3600000;
    if(sameWindow&&Number(prior.requestsInWindow||0)>=5)return res.status(429).json({message:"Too many codes requested. Please try again in about an hour."});
    const windowStartedAt=sameWindow?prior.windowStartedAt:now;
    const requestsInWindow=sameWindow?Number(prior.requestsInWindow||0)+1:1;
    const code=String(crypto.randomInt(0,1000000)).padStart(6,"0");
    const secret=process.env.OTP_SECRET||process.env.JWT_SECRET;
    const codeHash=crypto.createHash("sha256").update(email+":"+code+":"+secret).digest("hex");
    await EmailOtp.findOneAndUpdate({email},{$set:{email,name:user?.name||suppliedName,codeHash,codeExpiresAt:new Date(now.getTime()+10*60*1000),expiresAt:new Date(now.getTime()+2*60*60*1000),lastSentAt:now,windowStartedAt,requestsInWindow,attempts:0}}, {upsert:true,new:true,setDefaultsOnInsert:true});
    try{
      await sendEmail(email,"Your DDCS sign-in code","<div style=\"font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px\"><h2>Deepak Digital Computer Studio</h2><p>Your one-time sign-in code is:</p><p style=\"font-size:32px;font-weight:700;letter-spacing:8px\">"+code+"</p><p>This code expires in 10 minutes. Never share it with anyone.</p><p>If you did not request this code, you can ignore this email.</p></div>");
    }catch(mailError){
      console.error("OTP email delivery failed:",mailError.message);
      return res.status(502).json({message:"We could not send the email code. Check the Resend API key and verified sender domain, then try again."});
    }
    return res.json({success:true,message:"If the address can receive DDCS sign-in mail, a code has been sent. Check your inbox and spam folder."});
  }catch(e){console.error("OTP request failed:",e.name,e.message);return res.status(500).json({message:"Could not request an email code right now. Please try again later."})}
});
app.post("/api/auth/otp/verify",async(req,res)=>{
  try{
    if(!process.env.JWT_SECRET)return res.status(503).json({message:"Email OTP sign-in is not configured: JWT_SECRET is missing."});
    const email=String(req.body?.email||"").trim().toLowerCase();
    const code=String(req.body?.code||"").trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!/^[0-9]{6}$/.test(code))return res.status(400).json({message:"Enter the email address and six-digit code."});
    await db();
    const record=await EmailOtp.findOne({email});
    if(!record||new Date(record.codeExpiresAt).getTime()<=Date.now())return res.status(400).json({message:"That code has expired or is no longer valid. Request a new code."});
    if(Number(record.attempts||0)>=5){record.codeHash="";record.codeExpiresAt=new Date(0);await record.save();return res.status(429).json({message:"Too many incorrect attempts. Request a new code."});}
    const secret=process.env.OTP_SECRET||process.env.JWT_SECRET;
    const expected=crypto.createHash("sha256").update(email+":"+code+":"+secret).digest("hex");
    const actualBuffer=Buffer.from(String(record.codeHash||""),"hex");
    const expectedBuffer=Buffer.from(expected,"hex");
    const matches=actualBuffer.length===expectedBuffer.length&&crypto.timingSafeEqual(actualBuffer,expectedBuffer);
    if(!matches){
      record.attempts=Number(record.attempts||0)+1;
      if(record.attempts>=5){record.codeHash="";record.codeExpiresAt=new Date(0);}await record.save();
      return res.status(400).json({message:record.attempts>=5?"Too many incorrect attempts. Request a new code.":"Incorrect code. Please check the email and try again."});
    }
    let user=await User.findOne({email});
    if(!user)user=await User.create({name:String(record.name||"").trim()||"DDCS Customer",email,passwordHash:null,role:"customer"});
    record.codeHash="";
    record.codeExpiresAt=new Date(0);
    record.attempts=0;
    await record.save();
    return res.json({token:token(user),user:{name:user.name,email:user.email,role:user.role}});
  }catch(e){console.error("OTP verification failed:",e.name,e.message);return res.status(500).json({message:"Could not verify this code right now. Please try again."})}
});
app.post("/api/auth/register",async(req,res)=>{try{if(!process.env.JWT_SECRET)return res.status(503).json({message:"Account service is not configured: JWT_SECRET is missing. Please contact the site administrator."});const name=String(req.body?.name||"").trim(),email=String(req.body?.email||"").trim().toLowerCase(),password=typeof req.body?.password==="string"?req.body.password:"";if(name.length<2||name.length>100)return res.status(400).json({message:"Enter your name (2–100 characters)."});if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return res.status(400).json({message:"Enter a valid email address."});if(password.length<8||password.length>128)return res.status(400).json({message:"Password must be 8–128 characters long."});await db();if(await User.findOne({email}))return res.status(409).json({message:"This email is already registered. Please sign in instead."});const u=await User.create({name,email,passwordHash:await bcrypt.hash(password,12)});return res.status(201).json({token:token(u),user:{name:u.name,email:u.email,role:u.role}})}catch(e){console.error("Registration failed:",e.name,e.message);if(e.code===11000)return res.status(409).json({message:"This email is already registered. Please sign in instead."});if(e.name==="MongooseServerSelectionError"||e.name==="MongoServerSelectionError")return res.status(503).json({message:"Database is temporarily unavailable. Check the database connection and try again."});return res.status(500).json({message:"Registration failed because of a server configuration or database error. Please try again later."})}});
app.post("/api/auth/login",async(req,res)=>{try{if(!process.env.JWT_SECRET)return res.status(503).json({message:"Account service is not configured: JWT_SECRET is missing. Please contact the site administrator."});const email=String(req.body?.email||"").trim().toLowerCase(),password=typeof req.body?.password==="string"?req.body.password:"";if(!email||!password)return res.status(400).json({message:"Enter your email address and password."});await db();const u=await User.findOne({email});if(!u||!u.passwordHash||!(await bcrypt.compare(password,u.passwordHash)))return res.status(401).json({message:"Email or password is incorrect."});return res.json({token:token(u),user:{name:u.name,email:u.email,role:u.role}})}catch(e){console.error("Login failed:",e.name,e.message);if(e.name==="MongooseServerSelectionError"||e.name==="MongoServerSelectionError")return res.status(503).json({message:"Database is temporarily unavailable. Please try again later."});return res.status(500).json({message:"Sign-in failed because of a server configuration error. Please try again later."})}});
app.get("/api/auth/me",auth,async(req,res)=>{await db();const u=await User.findById(req.user.id).select("-passwordHash");res.json(u)});
app.patch("/api/account/profile",auth,async(req,res)=>{try{await db();const name=String(req.body.name||"").trim();if(!name||name.length>100)return res.status(400).json({message:"Name is required (maximum 100 characters)"});const u=await User.findByIdAndUpdate(req.user.id,{$set:{name}},{new:true,runValidators:true}).select("-passwordHash");if(!u)return res.status(404).json({message:"Account not found"});res.json({user:u})}catch(e){res.status(500).json({message:"Could not update profile"})}});
app.get("/api/account/addresses",auth,async(req,res)=>{try{await db();const u=await User.findById(req.user.id).select("addresses");if(!u)return res.status(404).json({message:"Account not found"});res.json(u.addresses||[])}catch(e){res.status(500).json({message:"Could not load addresses"})}});
app.post("/api/account/addresses",auth,async(req,res)=>{try{await db();const fields=["fullName","phone","line1","city","state","postalCode"];for(const field of fields){if(!String(req.body[field]||"").trim())return res.status(400).json({message:field+" is required"})}const u=await User.findById(req.user.id);if(!u)return res.status(404).json({message:"Account not found"});if((u.addresses||[]).length>=10)return res.status(400).json({message:"You can save up to 10 addresses"});const address={label:String(req.body.label||"Home").trim().slice(0,40),fullName:String(req.body.fullName).trim(),phone:String(req.body.phone).trim(),line1:String(req.body.line1).trim(),line2:String(req.body.line2||"").trim(),city:String(req.body.city).trim(),state:String(req.body.state).trim(),postalCode:String(req.body.postalCode).trim(),country:String(req.body.country||"India").trim(),isDefault:!!req.body.isDefault};if(address.isDefault)u.addresses.forEach(a=>{a.isDefault=false});if(!u.addresses.length)address.isDefault=true;u.addresses.push(address);await u.save();res.status(201).json(u.addresses[u.addresses.length-1])}catch(e){res.status(500).json({message:"Could not save address"})}});
app.delete("/api/account/addresses/:addressId",auth,async(req,res)=>{try{await db();const u=await User.findById(req.user.id);if(!u)return res.status(404).json({message:"Account not found"});const address=u.addresses.id(req.params.addressId);if(!address)return res.status(404).json({message:"Address not found"});const wasDefault=address.isDefault;address.deleteOne();if(wasDefault&&u.addresses.length)u.addresses[0].isDefault=true;await u.save();res.json({success:true})}catch(e){res.status(500).json({message:"Could not delete address"})}});
app.post("/api/coupons/validate",async(req,res)=>{try{await db();const c=await Coupon.findOne({code:String(req.body.code||"").toUpperCase(),active:true});if(!c||c.expiresAt&&c.expiresAt<new Date()||Number(req.body.total||0)<c.minOrder)return res.status(400).json({message:"Invalid or unavailable coupon"});const total=Number(req.body.total);const discount=c.type==="percent"?Math.min(total,total*c.value/100):Math.min(total,c.value);res.json({code:c.code,discount,total:Math.max(0,total-discount)})}catch(e){res.status(500).json({message:e.message})}});
app.post("/api/orders",async(req,res)=>{try{await db();const{items,total,paymentMethod="cod",shipping}=req.body;if(!Array.isArray(items)||!items.length)return res.status(400).json({message:"Cart is empty"});const ids=items.map(i=>i.productId);const products=await Product.find({_id:{$in:ids},active:true});if(products.length!==items.length)return res.status(400).json({message:"One or more products are unavailable"});for(const i of items){const p=products.find(x=>x._id.toString()===i.productId);if(!p||i.qty<1||p.stock<i.qty)return res.status(400).json({message:"Insufficient stock for "+(p?.name||"product")})}const order=await Order.create({userId:req.user?.id,items,total,paymentMethod,shipping,paymentStatus:paymentMethod==="cod"?"pending":"created"});for(const i of items)await Product.updateOne({_id:i.productId},{$inc:{stock:-i.qty}});if(shipping?.email)await sendEmail(shipping.email,"Order received — DDCS","<h2>Order received</h2><p>Your order <b>"+order._id+"</b> has been received.</p>");res.status(201).json(order)}catch(e){res.status(500).json({message:e.message})}});
app.get("/api/orders",auth,async(req,res)=>{await db();const filter=req.user.role==="admin"?{}:{userId:req.user.id};res.json(await Order.find(filter).sort({createdAt:-1}))});
app.patch("/api/orders/:id/status",auth,admin,async(req,res)=>{await db();const allowed=["pending","confirmed","processing","shipped","delivered","cancelled"];if(!allowed.includes(req.body.status))return res.status(400).json({message:"Invalid status"});const o=await Order.findByIdAndUpdate(req.params.id,{status:req.body.status},{new:true});if(!o)return res.status(404).json({message:"Order not found"});res.json(o)});
app.post("/api/admin/products",auth,admin,async(req,res)=>{await db();res.status(201).json(await Product.create(req.body))});
app.patch("/api/admin/products/:id",auth,admin,async(req,res)=>{await db();res.json(await Product.findByIdAndUpdate(req.params.id,req.body,{new:true}))});
app.delete("/api/admin/products/:id",auth,admin,async(req,res)=>{await db();await Product.findByIdAndUpdate(req.params.id,{active:false});res.json({success:true})});
app.post("/api/payments/create-order",async(req,res)=>{try{if(!process.env.RAZORPAY_KEY_ID||!process.env.RAZORPAY_KEY_SECRET)return res.json({demo:true,orderId:"demo_"+Date.now()});const rzp=new Razorpay({key_id:process.env.RAZORPAY_KEY_ID,key_secret:process.env.RAZORPAY_KEY_SECRET});const order=await rzp.orders.create({amount:Math.round(Number(req.body.amount)*100),currency:"INR",receipt:"ddcs_"+Date.now()});res.json({demo:false,keyId:process.env.RAZORPAY_KEY_ID,...order})}catch(e){res.status(500).json({message:e.message})}});
app.post("/api/payments/verify",async(req,res)=>{try{const{razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body;const expected=crypto.createHmac("sha256",process.env.RAZORPAY_KEY_SECRET||"").update(razorpay_order_id+"|"+razorpay_payment_id).digest("hex");if(!razorpay_signature||expected!==razorpay_signature)return res.status(400).json({verified:false});await db();await Order.findOneAndUpdate({paymentOrderId:razorpay_order_id},{paymentStatus:"paid",paymentId:razorpay_payment_id,status:"confirmed"});res.json({verified:true})}catch(e){res.status(500).json({message:e.message})}});
app.post("/api/automation/order-confirmation",async(req,res)=>{try{res.json({channel:"email",...(await sendEmail(req.body.to,"Order confirmation",req.body.html||"Thanks for your order!"))})}catch(e){res.status(500).json({message:e.message})}});
app.post("/api/metrics/visit",async(_,res)=>{
  try{await db();const metric=await SiteMetric.findOneAndUpdate({key:"site"},{$inc:{totalVisits:1}}, {upsert:true,new:true,setDefaultsOnInsert:true});return res.json({totalVisits:Number(metric.totalVisits||0)});}
  catch(e){console.error("Visit metric update failed:",e.message);return res.status(503).json({message:"Visit count is temporarily unavailable."});}
});
app.get("/api/public/stats",async(_,res)=>{
  try{
    await db();
    const [metric,products,totalProducts]=await Promise.all([SiteMetric.findOne({key:"site"}),Product.find({active:true}).select("rating reviewCount"),Product.countDocuments({active:true})]);
    const totalReviews=products.reduce((sum,p)=>sum+Math.max(0,Number(p.reviewCount)||0),0);
    const ratingPoints=products.reduce((sum,p)=>sum+(Math.max(0,Number(p.reviewCount)||0)*Math.max(0,Number(p.rating)||0)),0);
    return res.json({totalVisits:Number(metric?.totalVisits||0),products:totalProducts,totalReviews,averageRating:totalReviews?Math.round((ratingPoints/totalReviews)*10)/10:0});
  }catch(e){console.error("Public stats unavailable:",e.message);return res.status(503).json({message:"Public statistics are temporarily unavailable."});}
});
app.get("/api/admin/stats",auth,admin,async(_,res)=>{await db();const[products,orders,customers,agg]=await Promise.all([Product.countDocuments({active:true}),Order.countDocuments(),User.countDocuments({role:"customer"}),Order.aggregate([{$match:{paymentStatus:"paid"}},{$group:{_id:null,revenue:{$sum:"$total"}}}])]);res.json({products,orders,customers,revenue:agg[0]?.revenue||0})});
}

module.exports = { registerApiController };
