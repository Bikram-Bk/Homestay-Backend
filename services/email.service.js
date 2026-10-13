import nodemailer from "nodemailer";
import env from "../config/env.js";

let transporter = null;

if (env.SMTP_USER && env.SMTP_PASS) {
  try {
    if (env.SMTP_HOST && env.SMTP_HOST !== "smtp.gmail.com") {
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      console.log(`[email] Custom SMTP transporter initialized (${env.SMTP_HOST}).`);
    } else {
      // Default to Gmail service
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS, // 16-digit App Password
        },
      });
      console.log(`[email] Gmail SMTP initialized for ${env.SMTP_USER}.`);
    }
  } catch (error) {
    console.warn(`[email] SMTP init error: ${error.message}`);
  }
} else {
  console.warn("[email] SMTP credentials (SMTP_USER, SMTP_PASS) not configured in .env. Emails are logged to terminal only.");
}

/**
 * Send Welcome Email upon registration
 */
export async function sendWelcomeEmail(toEmail, userName) {
  const subject = "Namaste & Welcome to HomestayNepal! 🏔️";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E0CAB0; border-radius: 8px; background-color: #FAF6F0; color: #2C1810;">
      <h2 style="color: #C4654A; margin-bottom: 8px;">Namaste ${userName || "Traveler"},</h2>
      <p style="font-size: 16px; line-height: 1.6;">
        Welcome to <strong>HomestayNepal</strong>! Your account has been created successfully.
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #6B4226;">
        You can now discover and book authentic community homestays in Ghandruk, Sirubari, Bandipur, Chitwan, and beyond. Experience warm Nepali hospitality directly with local host families.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${env.FRONTEND_URL}/homestays" style="background-color: #C4654A; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Explore Authentic Homestays
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #E0CAB0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #7A5C45; text-align: center;">
        HomestayNepal — Atithi Devo Bhava (Guest is God)
      </p>
    </div>
  `;

  // Terminal dev logger
  console.log(`
┌────────────────────────────────────────────────────────┐
│ 📬 [EMAIL DISPATCHED: WELCOME]                         │
│ To:      ${toEmail.padEnd(46)}│
│ Name:    ${(userName || "Traveler").padEnd(46)}│
│ Status:  Account created successfully                  │
└────────────────────────────────────────────────────────┘`);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: toEmail,
        subject,
        html,
      });
    } catch (err) {
      console.warn(`[email] Failed to send live welcome email to ${toEmail}:`, err.message);
    }
  }

  return true;
}

/**
 * Send 6-Digit Password Reset OTP Email
 */
export async function sendPasswordResetOtpEmail(toEmail, userName, otp) {
  const subject = "Your Password Reset OTP — HomestayNepal 🔐";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E0CAB0; border-radius: 8px; background-color: #FAF6F0; color: #2C1810;">
      <h2 style="color: #C4654A; margin-bottom: 8px;">Password Reset Request</h2>
      <p style="font-size: 15px; line-height: 1.6;">
        Hello ${userName || "Traveler"}, we received a request to reset your password for your HomestayNepal account.
      </p>
      <div style="background-color: #FFF8F2; border: 2px dashed #C4654A; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-size: 13px; color: #7A5C45; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">Your 6-Digit Verification Code</span>
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #8B2E1A;">${otp}</span>
        <span style="font-size: 13px; color: #D4A017; display: block; margin-top: 6px;">⏱️ Valid for 10 minutes only</span>
      </div>
      <p style="font-size: 14px; color: #6B4226;">
        If you did not request this password reset, please ignore this email or contact support. Your password will remain unchanged.
      </p>
      <hr style="border: none; border-top: 1px solid #E0CAB0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #7A5C45; text-align: center;">
        HomestayNepal Security Team
      </p>
    </div>
  `;

  // Terminal dev logger
  console.log(`
┌────────────────────────────────────────────────────────┐
│ 🔐 [EMAIL DISPATCHED: PASSWORD RESET OTP]              │
│ To:      ${toEmail.padEnd(46)}│
│ OTP:     ${otp.padEnd(46)}│
│ Expiry:  10 Minutes                                    │
└────────────────────────────────────────────────────────┘`);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: toEmail,
        subject,
        html,
      });
    } catch (err) {
      console.warn(`[email] Failed to send live OTP email to ${toEmail}:`, err.message);
    }
  }

  return true;
}

/**
 * Send booking request from landing page contact form to admin
 */
export async function sendBookingRequestEmail(data) {
  const { fullName, email, phone, guests, room, dates, message } = data;
  const subject = `New Booking Request — ${fullName || "Guest"} | HomestayNepal`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E0CAB0; border-radius: 8px; background-color: #FAF6F0; color: #2C1810;">
      <h2 style="color: #C4654A; margin-bottom: 8px;">New Booking Request 🙏</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #6B4226;">A guest submitted a booking request via the website contact form:</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #7A5C45;">Full Name</td><td style="padding: 6px 0; font-weight: bold;">${fullName || "—"}</td></tr>
        <tr><td style="padding: 6px 0; color: #7A5C45;">Email</td><td style="padding: 6px 0; font-weight: bold;">${email || "—"}</td></tr>
        <tr><td style="padding: 6px 0; color: #7A5C45;">Phone/WhatsApp</td><td style="padding: 6px 0; font-weight: bold;">${phone || "—"}</td></tr>
        <tr><td style="padding: 6px 0; color: #7A5C45;">Guests</td><td style="padding: 6px 0; font-weight: bold;">${guests || "—"}</td></tr>
        <tr><td style="padding: 6px 0; color: #7A5C45;">Preferred Room</td><td style="padding: 6px 0; font-weight: bold;">${room || "Any available room"}</td></tr>
        <tr><td style="padding: 6px 0; color: #7A5C45;">Dates</td><td style="padding: 6px 0; font-weight: bold;">${dates || "—"}</td></tr>
      </table>
      <div style="background-color: #FFF8F2; border: 1px solid #E0CAB0; border-radius: 8px; padding: 14px; font-size: 14px; line-height: 1.6; color: #2C1810;">
        ${message || "No message provided."}
      </div>
      <hr style="border: none; border-top: 1px solid #E0CAB0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #7A5C45; text-align: center;">HomestayNepal — Booking Request</p>
    </div>
  `;

  console.log(`\n┌────────────────────────────────────────────────────────┐\n│ 📬 [EMAIL DISPATCHED: BOOKING REQUEST]                │\n│ To:      ${env.ADMIN_EMAIL.padEnd(46)}│\n│ From:    ${(fullName || "Guest").padEnd(46)}│\n└────────────────────────────────────────────────────────┘`);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: env.ADMIN_EMAIL,
        replyTo: email || undefined,
        subject,
        html,
      });
    } catch (err) {
      console.warn(`[email] Failed to send booking request to admin:`, err.message);
    }
  }

  return true;
}

/**
 * Booking Created (PENDING) — sent to traveler right after booking is made
 */
export async function sendBookingCreatedEmail({ toEmail, userName, homestayName, village, checkIn, checkOut, guests, totalAmount, bookingId }) {
  const subject = `Booking Request Received — ${homestayName} | HomestayNepal`;
  const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;
  const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E0CAB0; border-radius: 8px; background-color: #FAF6F0; color: #2C1810;">
      <h2 style="color: #C4654A; margin-bottom: 4px;">Booking Request Received 🏡</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #6B4226;">Namaste <strong>${userName || "Traveler"}</strong>! We've received your booking request. Please complete payment within <strong>10 minutes</strong> to secure your dates.</p>
      <div style="background-color: #FFF8F2; border: 1px solid #E0CAB0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px 0; color: #2C1810; font-size: 16px;">${homestayName}${village ? ` — ${village}` : ""}</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 5px 0; color: #7A5C45;">Check-in</td><td style="padding: 5px 0; font-weight: bold;">${fmtDate(checkIn)}</td></tr>
          <tr><td style="padding: 5px 0; color: #7A5C45;">Check-out</td><td style="padding: 5px 0; font-weight: bold;">${fmtDate(checkOut)}</td></tr>
          <tr><td style="padding: 5px 0; color: #7A5C45;">Duration</td><td style="padding: 5px 0; font-weight: bold;">${nights} Night${nights !== 1 ? "s" : ""}</td></tr>
          <tr><td style="padding: 5px 0; color: #7A5C45;">Guests</td><td style="padding: 5px 0; font-weight: bold;">${guests}</td></tr>
          <tr><td style="padding: 5px 0; color: #7A5C45;">Total Amount</td><td style="padding: 5px 0; font-weight: bold; color: #C4654A;">NPR ${Number(totalAmount).toLocaleString()}</td></tr>
        </table>
      </div>
      <div style="background-color: #FFF3CD; border-left: 4px solid #D4A017; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: #6B4226;">⏱️ <strong>Complete payment within 10 minutes</strong> — unpaid bookings are automatically released.</p>
      </div>
      <div style="text-align: center;">
        <a href="${dashboardUrl}" style="background-color: #C4654A; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View My Booking</a>
      </div>
      <hr style="border: none; border-top: 1px solid #E0CAB0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #7A5C45; text-align: center;">HomestayNepal — Atithi Devo Bhava</p>
    </div>
  `;

  console.log(`
┌────────────────────────────────────────────────────────┐
│ 🏡 [EMAIL DISPATCHED: BOOKING CREATED]                 │
│ To:      ${toEmail.padEnd(46)}│
│ Homestay:${(homestayName || "—").padEnd(46)}│
│ Dates:   ${`${fmtDate(checkIn)} → ${fmtDate(checkOut)}`.substring(0, 46).padEnd(46)}│
└────────────────────────────────────────────────────────┘`);

  if (transporter) {
    try { await transporter.sendMail({ from: env.EMAIL_FROM, to: toEmail, subject, html }); }
    catch (err) { console.warn(`[email] Failed to send bookingCreated to ${toEmail}:`, err.message); }
  }
  return true;
}

/**
 * Payment Confirmed (PAID) — sent to traveler after eSewa payment verified
 */
export async function sendPaymentConfirmedEmail({ toEmail, userName, homestayName, village, checkIn, checkOut, guests, totalAmount, paymentRef }) {
  const subject = `Payment Confirmed — ${homestayName} | HomestayNepal`;
  const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E0CAB0; border-radius: 8px; background-color: #FAF6F0; color: #2C1810;">
      <h2 style="color: #2E7D32; margin-bottom: 4px;">Payment Confirmed ✅</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #6B4226;">Namaste <strong>${userName || "Traveler"}</strong>! Your payment for <strong>${homestayName}</strong> has been successfully received. Your booking is now awaiting admin confirmation.</p>
      <div style="background-color: #F0FFF4; border: 1px solid #A5D6A7; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 5px 0; color: #7A5C45;">Homestay</td><td style="padding: 5px 0; font-weight: bold;">${homestayName}${village ? ` — ${village}` : ""}</td></tr>
          <tr><td style="padding: 5px 0; color: #7A5C45;">Check-in</td><td style="padding: 5px 0; font-weight: bold;">${fmtDate(checkIn)}</td></tr>
          <tr><td style="padding: 5px 0; color: #7A5C45;">Check-out</td><td style="padding: 5px 0; font-weight: bold;">${fmtDate(checkOut)}</td></tr>
          <tr><td style="padding: 5px 0; color: #7A5C45;">Guests</td><td style="padding: 5px 0; font-weight: bold;">${guests}</td></tr>
          <tr><td style="padding: 5px 0; color: #7A5C45;">Amount Paid</td><td style="padding: 5px 0; font-weight: bold; color: #2E7D32;">NPR ${Number(totalAmount).toLocaleString()}</td></tr>
          ${paymentRef ? `<tr><td style="padding: 5px 0; color: #7A5C45;">Ref</td><td style="padding: 5px 0; font-size: 12px; color: #7A5C45;">${paymentRef}</td></tr>` : ""}
        </table>
      </div>
      <p style="font-size: 14px; color: #6B4226; text-align: center;">🕐 The admin will review and confirm your booking shortly.</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${dashboardUrl}" style="background-color: #2E7D32; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View My Booking</a>
      </div>
      <hr style="border: none; border-top: 1px solid #E0CAB0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #7A5C45; text-align: center;">HomestayNepal — Atithi Devo Bhava</p>
    </div>
  `;

  console.log(`
┌────────────────────────────────────────────────────────┐
│ 💳 [EMAIL DISPATCHED: PAYMENT CONFIRMED]               │
│ To:      ${toEmail.padEnd(46)}│
│ Homestay:${(homestayName || "—").padEnd(46)}│
│ Amount:  NPR ${String(totalAmount).padEnd(43)}│
└────────────────────────────────────────────────────────┘`);

  if (transporter) {
    try { await transporter.sendMail({ from: env.EMAIL_FROM, to: toEmail, subject, html }); }
    catch (err) { console.warn(`[email] Failed to send paymentConfirmed to ${toEmail}:`, err.message); }
  }
  return true;
}

/**
 * Booking Confirmed (CONFIRMED) — sent to traveler when admin confirms the booking
 */
export async function sendBookingConfirmedEmail({ toEmail, userName, homestayName, village, checkIn, checkOut, guests, totalAmount }) {
  const subject = `Booking Confirmed! Pack Your Bags 🎒 — HomestayNepal`;
  const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E0CAB0; border-radius: 8px; background-color: #FAF6F0; color: #2C1810;">
      <h2 style="color: #C4654A; margin-bottom: 4px;">Your Stay is Confirmed! 🎉</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #6B4226;">Namaste <strong>${userName || "Traveler"}</strong>! Great news — your booking at <strong>${homestayName}</strong> has been confirmed. Your authentic Nepali experience awaits!</p>
      <div style="background-color: #FFF8F2; border: 2px solid #C4654A; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px 0; color: #2C1810; font-size: 16px;">📋 Booking Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 5px 0; color: #7A5C45;">Homestay</td><td style="padding: 5px 0; font-weight: bold;">${homestayName}${village ? ` — ${village}` : ""}</td></tr>
          <tr><td style="padding: 5px 0; color: #7A5C45;">Check-in</td><td style="padding: 5px 0; font-weight: bold;">${fmtDate(checkIn)}</td></tr>
          <tr><td style="padding: 5px 0; color: #7A5C45;">Check-out</td><td style="padding: 5px 0; font-weight: bold;">${fmtDate(checkOut)}</td></tr>
          <tr><td style="padding: 5px 0; color: #7A5C45;">Guests</td><td style="padding: 5px 0; font-weight: bold;">${guests}</td></tr>
          <tr><td style="padding: 5px 0; color: #7A5C45;">Total Paid</td><td style="padding: 5px 0; font-weight: bold; color: #C4654A;">NPR ${Number(totalAmount).toLocaleString()}</td></tr>
        </table>
      </div>
      <p style="font-size: 14px; color: #6B4226; text-align: center;">The host family is expecting you. Namaste! 🙏</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${dashboardUrl}" style="background-color: #C4654A; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Booking Details</a>
      </div>
      <hr style="border: none; border-top: 1px solid #E0CAB0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #7A5C45; text-align: center;">HomestayNepal — Atithi Devo Bhava (Guest is God)</p>
    </div>
  `;

  console.log(`
┌────────────────────────────────────────────────────────┐
│ ✅ [EMAIL DISPATCHED: BOOKING CONFIRMED]               │
│ To:      ${toEmail.padEnd(46)}│
│ Homestay:${(homestayName || "—").padEnd(46)}│
│ Check-in:${fmtDate(checkIn).padEnd(46)}│
└────────────────────────────────────────────────────────┘`);

  if (transporter) {
    try { await transporter.sendMail({ from: env.EMAIL_FROM, to: toEmail, subject, html }); }
    catch (err) { console.warn(`[email] Failed to send bookingConfirmed to ${toEmail}:`, err.message); }
  }
  return true;
}

/**
 * Booking Cancelled — sent when user/admin cancels or auto-expiry fires
 */
export async function sendBookingCancelledEmail({ toEmail, userName, homestayName, checkIn, checkOut, reason }) {
  const subject = `Booking Cancelled — ${homestayName} | HomestayNepal`;
  const dashboardUrl = `${env.FRONTEND_URL}/homestays`;
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E0CAB0; border-radius: 8px; background-color: #FAF6F0; color: #2C1810;">
      <h2 style="color: #8B2E1A; margin-bottom: 4px;">Booking Cancelled</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #6B4226;">Hello <strong>${userName || "Traveler"}</strong>, your booking at <strong>${homestayName}</strong> has been cancelled.</p>
      <div style="background-color: #FFF5F5; border: 1px solid #FFCDD2; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 5px 0; color: #7A5C45;">Homestay</td><td style="padding: 5px 0; font-weight: bold;">${homestayName}</td></tr>
          <tr><td style="padding: 5px 0; color: #7A5C45;">Check-in</td><td style="padding: 5px 0; font-weight: bold;">${fmtDate(checkIn)}</td></tr>
          <tr><td style="padding: 5px 0; color: #7A5C45;">Check-out</td><td style="padding: 5px 0; font-weight: bold;">${fmtDate(checkOut)}</td></tr>
          ${reason ? `<tr><td style="padding: 5px 0; color: #7A5C45;">Reason</td><td style="padding: 5px 0; color: #8B2E1A;">${reason}</td></tr>` : ""}
        </table>
      </div>
      <p style="font-size: 14px; color: #6B4226; text-align: center;">Browse other beautiful homestays across Nepal and plan your next adventure.</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${dashboardUrl}" style="background-color: #C4654A; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Explore Other Homestays</a>
      </div>
      <hr style="border: none; border-top: 1px solid #E0CAB0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #7A5C45; text-align: center;">HomestayNepal — Atithi Devo Bhava</p>
    </div>
  `;

  console.log(`
┌────────────────────────────────────────────────────────┐
│ ❌ [EMAIL DISPATCHED: BOOKING CANCELLED]               │
│ To:      ${toEmail.padEnd(46)}│
│ Homestay:${(homestayName || "—").padEnd(46)}│
│ Reason:  ${(reason || "Not specified").substring(0, 46).padEnd(46)}│
└────────────────────────────────────────────────────────┘`);

  if (transporter) {
    try { await transporter.sendMail({ from: env.EMAIL_FROM, to: toEmail, subject, html }); }
    catch (err) { console.warn(`[email] Failed to send bookingCancelled to ${toEmail}:`, err.message); }
  }
  return true;
}

/**
 * Send newsletter/interested candidate details to admin
 */
export async function sendInterestedCandidateEmail({ name, email }) {
  const subject = `New Interested Candidate — ${name || "Subscriber"}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E0CAB0; border-radius: 8px; background-color: #FAF6F0; color: #2C1810;">
      <h2 style="color: #C4654A; margin-bottom: 8px;">New Interested Candidate ✨</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #6B4226;">Someone subscribed via the website footer:</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #7A5C45;">Name</td><td style="padding: 6px 0; font-weight: bold;">${name || "—"}</td></tr>
        <tr><td style="padding: 6px 0; color: #7A5C45;">Email</td><td style="padding: 6px 0; font-weight: bold;">${email || "—"}</td></tr>
      </table>
      <hr style="border: none; border-top: 1px solid #E0CAB0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #7A5C45; text-align: center;">HomestayNepal — Interested Candidates</p>
    </div>
  `;

  console.log(`\n┌────────────────────────────────────────────────────────┐\n│ 📬 [EMAIL DISPATCHED: INTERESTED CANDIDATE]           │\n│ To:      ${env.ADMIN_EMAIL.padEnd(46)}│\n│ Name:    ${(name || "—").padEnd(46)}│\n│ Email:   ${(email || "—").padEnd(46)}│\n└────────────────────────────────────────────────────────┘`);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: env.ADMIN_EMAIL,
        replyTo: email || undefined,
        subject,
        html,
      });
    } catch (err) {
      console.warn(`[email] Failed to send interested candidate to admin:`, err.message);
    }
  }

  return true;
}
