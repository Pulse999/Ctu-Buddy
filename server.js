const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (your HTML, CSS, and JavaScript files)
app.use(express.static(path.join(__dirname)));

// Handle the form submission
app.post("/submit-form", (req, res) => {
  // Destructure the form fields from req.body
  const { name, surname, email, phone, message } = req.body;

  // Log the extracted form data to ensure it is correct
  console.log("Form data received:");
  console.log("Name:", name);
  console.log("Email:", email);
  console.log("Message:", message);

  // Create the email transporter
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "ctubuddy4@gmail.com", // Your Gmail
      pass: "ctxb azqa qmfq wyyz", // Your Gmail password or app password
    },
  });

  // Email sent to yourself with the form data
  const mailOptionsToYou = {
    from: email, // Sender's email
    to: "ctubuddy4@gmail.com", // Your email
    subject: "New Contact Form Submission",
    text: `You have received a new message from the contact form.
           Name: ${name} ${surname}
           Email: ${email}
           Message: ${message}`,
  };

  // Auto-reply email sent to the customer
  const mailOptionsToCustomer = {
    from: "ctubuddy4@gmail.com", // Your email
    to: email, // Customer's email (dynamic from the form input)
    subject: "Thank you for reaching out!",
    text: `Hello there ${name},
     
           Thank you submiting 

           For any queries do not hesitate to reply

           Best regards
           CTU Buddy`,
  };

  // Send email to yourself with form data
  transporter.sendMail(mailOptionsToYou, (error, info) => {
    if (error) {
      console.log("Error sending email to yourself: ", error);
      return res.status(500).send("Error sending email to you.");
    }

    // Send the auto-reply to the customer
    transporter.sendMail(mailOptionsToCustomer, (error, info) => {
      if (error) {
        console.log("Error sending auto-reply to customer: ", error); // Log the actual error message
        return res.status(500).send("Error sending auto-reply to customer.");
      }

      // Redirect to thank you page after both emails are sent successfully
      res.redirect("/thank-you.html");
    });
  });
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
