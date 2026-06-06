import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      recipients = [],
      cc = [],
      bcc = [],
      subject = "",
      content = "",
      contentType = "text",
      fromName = "",
      replyTo = "",
    } = body;

    // Validate required fields
    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "No recipients provided." },
        { status: 400 }
      );
    }
    if (!subject.trim()) {
      return NextResponse.json(
        { success: false, error: "Subject is required." },
        { status: 400 }
      );
    }
    if (!content.trim()) {
      return NextResponse.json(
        { success: false, error: "Email body is empty." },
        { status: 400 }
      );
    }

    // Get SMTP config from environment variables
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const defaultFromName = process.env.FROM_NAME || "MailBlast";

    if (!smtpUser || !smtpPass) {
      return NextResponse.json(
        { success: false, error: "SMTP credentials not configured on the server." },
        { status: 500 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const displayName = fromName.trim() || defaultFromName;

    // All actual delivery addresses (To + CC + BCC)
    const allRecipients = [...recipients, ...cc, ...bcc];

    // Send mail
    await transporter.sendMail({
      from: `"${displayName}" <${smtpUser}>`,
      to: recipients.join(", "),
      cc: cc.length > 0 ? cc.join(", ") : undefined,
      bcc: bcc.length > 0 ? bcc.join(", ") : undefined,
      replyTo: replyTo || undefined,
      subject: subject,
      text: contentType === "html" ? undefined : content,
      html: contentType === "html" ? content : undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Email delivered to ${allRecipients.length} recipient(s).`,
      count: allRecipients.length,
    });
  } catch (error: any) {
    console.error("Email send error:", error);
    
    if (error.code === "EAUTH") {
      return NextResponse.json(
        { success: false, error: "SMTP authentication failed. Check your SMTP_USER and SMTP_PASS." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
