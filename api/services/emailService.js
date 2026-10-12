async function sendEmail(to,subject,html){if(!process.env.RESEND_API_KEY||!to)return{sent:false};const resend=new Resend(process.env.RESEND_API_KEY);await resend.emails.send({from:process.env.FROM_EMAIL||"orders@example.com",to,subject,html});return{sent:true}}
module.exports = { sendEmail };
