const { Resend } = require("resend");

async function sendEmail(to,subject,html){if(!process.env.RESEND_API_KEY||!to)return{sent:false};const resend=new Resend(process.env.RESEND_API_KEY);const result=await resend.emails.send({from:process.env.FROM_EMAIL||"onboarding@resend.dev",to,subject,html});if(result?.error)throw new Error(result.error.message||"Email provider rejected the message");return{sent:true,id:result?.data?.id||null}}
module.exports = { sendEmail };
