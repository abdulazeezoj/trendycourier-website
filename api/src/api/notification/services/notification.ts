/**
 * notification service
 */
import { errors } from "@strapi/utils";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SMS_URL = process.env.BREVO_SMS_URL;
const BREVO_EMAIL_URL = process.env.BREVO_EMAIL_URL;

export default () => ({
  sendEmail: async (
    email: string,
    name: string,
    subject: string,
    options: {
      message?: string;
      template?: string;
      data?: Record<string, any>;
      attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
      }>;
      isHtml?: boolean;
    }
  ) => {
    strapi.log.info(
      `api::notification - Sending email to ${email} with subject "${subject}"`
    );

    if (!email || !subject || (!options.message && !options.template)) {
      strapi.log.error(
        "api::notification - Email, subject, and message or template are required"
      );
      throw new errors.ValidationError(
        "Email, subject, and message or template are required to send email",
        {
          email: "Email is required",
          subject: "Subject is required",
          message: "Message or template is required",
        }
      );
    }

    if (!BREVO_API_KEY || !BREVO_EMAIL_URL) {
      strapi.log.error(
        "api::notification - BREVO_API_KEY or BREVO_EMAIL_URL is not set"
      );
      throw new errors.ApplicationError(
        "Something went wrong. Please contact support."
      );
    }

    let content = options.message || "";
    if (options.template) {
      content = options.template;
      if (options.data) {
        for (const key in options.data) {
          content = content.replace(
            new RegExp(`{{\\s*${key}\\s*}}`, "g"),
            options.data[key]
          );
        }
      }
    }

    const payload: any = {
      sender: {
        name: "Sinovx Technologies",
        email: "abdulazeezojimoh@gmail.com",
      },
      to: [
        {
          email,
          name,
        },
      ],
      subject,
      ...(options.isHtml ? { htmlContent: content } : { textContent: content }),
    };

    // Attachments support (if your provider supports it)
    if (options.attachments && options.attachments.length > 0) {
      payload.attachment = options.attachments.map((att) => ({
        name: att.filename,
        content:
          typeof att.content === "string"
            ? Buffer.from(att.content).toString("base64")
            : att.content.toString("base64"),
        contentType: att.contentType,
      }));
    }

    const res = await fetch(BREVO_EMAIL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      strapi.log.error(
        "api::notification - Error sending email",
        await res.json()
      );
      throw new errors.ApplicationError(
        "Something went wrong. Please contact support."
      );
    }

    return {
      status: "success",
      message: "Email sent successfully",
    };
  },
  sendSMS: async (
    phoneNumber: string,
    options: {
      message?: string;
      template?: string;
      data?: Record<string, any>;
    }
  ) => {
    strapi.log.info(`api::notification - Sending SMS to ${phoneNumber}`);

    if (!phoneNumber || (!options.message && !options.template)) {
      strapi.log.error(
        "api::notification - Phone number and message or template are required"
      );
      throw new errors.ValidationError(
        "Phone number and message or template are required to send SMS",
        {
          phoneNumber: "Phone number is required",
          message: "Message or template is required",
        }
      );
    }

    if (!BREVO_API_KEY || !BREVO_SMS_URL) {
      strapi.log.error(
        "api::notification - BREVO_SMS_API_KEY or BREVO_SMS_API_URL is not set"
      );
      throw new errors.ApplicationError(
        "Something went wrong. Please contact support."
      );
    }

    let content = options.message || "";
    if (options.template) {
      content = options.template;
      if (options.data) {
        for (const key in options.data) {
          content = content.replace(
            new RegExp(`{{\\s*${key}\\s*}}`, "g"),
            options.data[key]
          );
        }
      }
    }

    const dataToSend = JSON.stringify({
      sender: "Trendy",
      recipient: phoneNumber,
      content,
      type: "transactional",
    });

    const res = await fetch(BREVO_SMS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: dataToSend,
    });

    const response = await res.json();

    if (!res.ok) {
      strapi.log.error(
        `api::notification - Error sending SMS: ${JSON.stringify(response)} with status code ${res.status}`
      );
      throw new errors.ApplicationError(
        "Something went wrong. Please contact support."
      );
    }

    return {
      status: "success",
      message: "SMS sent successfully",
    };
  },
  sendEmailWithTemplate: async (
    email: string,
    subject: string,
    template: string,
    data: Record<string, any>,
    options?: {
      attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
      }>;
      isHtml?: boolean;
    }
  ) => {
    strapi.log.info(
      `api::notification - Sending templated email to ${email} with subject "${subject}"`
    );

    if (!email || !subject || !template.trim()) {
      strapi.log.error(
        "api::notification - Email, subject, and template are required"
      );
      throw new errors.ValidationError(
        "Email, subject, and template are required to send email",
        {
          email: "Email is required",
          subject: "Subject is required",
          template: "Template is required",
        }
      );
    }

    if (!BREVO_API_KEY || !BREVO_EMAIL_URL) {
      strapi.log.error(
        "api::notification - BREVO_API_KEY or BREVO_EMAIL_URL is not set"
      );
      throw new errors.ApplicationError(
        "Something went wrong. Please contact support."
      );
    }

    let filledTemplate = template;
    for (const key in data) {
      filledTemplate = filledTemplate.replace(
        new RegExp(`{{\\s*${key}\\s*}}`, "g"),
        data[key]
      );
    }

    const payload = JSON.stringify({
      sender: {
        name: "Sinovx Technologies",
        email: "abdulazeezojimoh@gmail.com",
      },
      to: [
        {
          email,
          name: data?.name || "",
        },
      ],
      subject,
      ...(options?.isHtml
        ? { htmlContent: filledTemplate }
        : { textContent: filledTemplate }),
    });

    const res = await fetch(BREVO_EMAIL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: payload,
    });

    if (!res.ok) {
      strapi.log.error(
        "api::notification - Error sending templated email",
        await res.json()
      );
      throw new errors.ApplicationError(
        "Something went wrong. Please contact support."
      );
    }

    return {
      status: "success",
      message: "Templated email sent successfully",
    };
  },
});
