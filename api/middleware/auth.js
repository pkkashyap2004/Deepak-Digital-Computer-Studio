function token(u){return jwt.sign({id:u._id.toString(),role:u.role},process.env.JWT_SECRET,{expiresIn:"7d"})}
function auth(req,res,next){try{const h=req.headers.authorization||"";if(!h.startsWith("Bearer "))return res.status(401).json({message:"Authentication required"});req.user=jwt.verify(h.slice(7),process.env.JWT_SECRET||"dev-secret");next()}catch{return res.status(401).json({message:"Invalid or expired token"})}}
function admin(req,res,next){return req.user?.role==="admin"?next():res.status(403).json({message:"Admin access required"})}
module.exports = { token, auth, admin };
