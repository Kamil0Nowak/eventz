export const sendEmail = async ({ to, subject, text }: { to: string; subject: string; text: string }) => {
  console.log("----------------------------------------");
  console.log(`E-MAIL DO: ${to}`);
  console.log(`TEMAT: ${subject}`);
  console.log(`TREŚĆ: ${text}`);
  console.log("----------------------------------------");
};