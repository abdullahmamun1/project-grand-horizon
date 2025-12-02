import nodemailer from 'nodemailer';
import { IBooking } from '../db/models/Booking';
import { IRoom } from '../db/models/Room';
import { IUser } from '../db/models/User';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  
  if (!smtpUser || !smtpPass) {
    return null;
  }
  
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }
  
  return transporter;
}

export async function sendBookingConfirmation(
  user: IUser,
  booking: IBooking,
  room: IRoom
): Promise<void> {
  const checkIn = new Date(booking.checkInDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const checkOut = new Date(booking.checkOutDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const mailOptions = {
    from: '"Grand Horizon Hotel" <bookings@grandhorizon.com>',
    to: user.email,
    subject: 'Booking Confirmation - Grand Horizon Hotel',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Grand Horizon Hotel</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Your Booking is Confirmed!</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1a365d; margin-top: 0;">Hello ${user.firstName},</h2>
          
          <p style="color: #475569; line-height: 1.6;">
            Thank you for choosing Grand Horizon Hotel. We're excited to welcome you!
          </p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h3 style="color: #1a365d; margin-top: 0;">Booking Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Room</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 500; text-align: right;">
                  ${room.name} (${room.category})
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Room Number</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 500; text-align: right;">
                  ${room.roomNumber}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Check-in</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 500; text-align: right;">
                  ${checkIn}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Check-out</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 500; text-align: right;">
                  ${checkOut}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Guests</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 500; text-align: right;">
                  ${booking.guestCount}
                </td>
              </tr>
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #1a365d; font-weight: 600;">Total Amount</td>
                <td style="padding: 12px 0; color: #1a365d; font-weight: 600; text-align: right; font-size: 18px;">
                  $${booking.totalPrice}
                </td>
              </tr>
            </table>
          </div>
          
          ${booking.specialRequests ? `
            <div style="background: #fffbeb; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <strong style="color: #92400e;">Special Requests:</strong>
              <p style="color: #78350f; margin: 8px 0 0 0;">${booking.specialRequests}</p>
            </div>
          ` : ''}
          
          <div style="background: #f0fdf4; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="color: #166534; margin: 0 0 8px 0;">Important Information</h4>
            <ul style="color: #15803d; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Check-in time: 3:00 PM</li>
              <li>Check-out time: 11:00 AM</li>
              <li>Please bring a valid ID for check-in</li>
            </ul>
          </div>
          
          <p style="color: #475569; line-height: 1.6;">
            If you have any questions or need to modify your booking, please don't hesitate to contact us.
          </p>
          
          <p style="color: #475569; margin-bottom: 0;">
            We look forward to welcoming you!<br>
            <strong style="color: #1a365d;">The Grand Horizon Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
          <p>123 Ocean Drive, Paradise Bay, CA 90210</p>
          <p>Phone: +1 (555) 123-4567 | Email: info@grandhorizon.com</p>
        </div>
      </div>
    `,
  };

  try {
    const mailTransporter = getTransporter();
    
    if (!mailTransporter) {
      console.log('Email not configured (SMTP_USER/SMTP_PASS not set) - skipping email notification');
      return;
    }
    
    await mailTransporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent to:', user.email);
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
  }
}
