import { NextResponse } from 'next/server';
import { rateLimit, validateCertificateData, validateLinkedInToken, createSecureResponse, sanitizeInput } from '@/lib/security';

const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_MEMBER_URN = process.env.LINKEDIN_MEMBER_URN;
const HRMS_WEBHOOK_URL = process.env.HRMS_WEBHOOK_URL;

async function sendLinkedInPost(payload: {
  studentName: string;
  universityName: string;
  degreeName: string;
  recordUrl: string;
  linkedinToken?: string;
  linkedinMemberId?: string;
}) {
  console.log('=== LinkedIn Post Start ===');
  console.log('Has token:', !!payload.linkedinToken);
  console.log('Has member ID:', !!payload.linkedinMemberId);

  if (!payload.linkedinToken) {
    console.log('Skipping: No token');
    return { status: 'skipped', reason: 'No LinkedIn token provided' };
  }

  // Get member URN - either from payload or fetch it
  let memberUrn = payload.linkedinMemberId;
  console.log('Initial member URN:', memberUrn);

  if (!memberUrn) {
    console.log('Fetching member ID from LinkedIn...');
    // Fallback: fetch from LinkedIn profile API
    try {
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${payload.linkedinToken}`,
        },
      });
      console.log('Profile fetch status:', profileResponse.status);
      const profileData = await profileResponse.json();
      console.log('Profile data:', profileData);
      memberUrn = profileData.sub;
    } catch (error) {
      console.error('Failed to fetch LinkedIn member ID:', error);
      return { status: 'error', error: `Could not get LinkedIn member ID: ${error}` };
    }
  }

  if (!memberUrn) {
    console.error('Member URN is null after fetching');
    return { status: 'error', error: 'LinkedIn member ID is missing' };
  }

  console.log('Final member URN:', memberUrn);

  const body = {
    author: `urn:li:person:${memberUrn}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: `EduVault has verified my ${payload.degreeName} from ${payload.universityName}. View my credential: ${payload.recordUrl}`,
        },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            description: {
              text: `EduVault blockchain credential for ${payload.studentName}`,
            },
            originalUrl: payload.recordUrl,
            title: {
              text: 'EduVault Credential',
            },
          },
        ],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  console.log('Sending request to LinkedIn UGC Posts API...');
  console.log('Body preview:', JSON.stringify(body).substring(0, 200));

  try {
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${payload.linkedinToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });

    console.log('LinkedIn API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LinkedIn UGC Post API error:', response.status, errorText);
      return { status: 'error', error: `LinkedIn API (${response.status}): ${errorText}` };
    }

    const postResult = await response.json();
    console.log('LinkedIn UGC post successful:', postResult);
    return { status: 'success' };
  } catch (error) {
    console.error('Exception during LinkedIn post:', error);
    return { status: 'error', error: `Exception: ${error}` };
  }
}

async function sendHrmsUpdate(payload: {
  studentName: string;
  universityName: string;
  degreeName: string;
  hash: string;
  recordUrl: string;
}) {
  if (!HRMS_WEBHOOK_URL) {
    return { status: 'skipped', reason: 'HRMS webhook not configured' };
  }

  const response = await fetch(HRMS_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      studentName: payload.studentName,
      universityName: payload.universityName,
      degreeName: payload.degreeName,
      credentialHash: payload.hash,
      credentialUrl: payload.recordUrl,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { status: 'error', error: errorText };
  }

  return { status: 'success' };
}

export async function POST(req: Request) {
  console.log('=== Integration Route Start ===');
  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = rateLimit(`integration:${clientIP}`, 5, 60000); // 5 requests per minute

    console.log('Rate limit check:', rateLimitResult.limited ? 'LIMITED' : 'OK');

    if (rateLimitResult.limited) {
      return createSecureResponse(
        { error: 'Rate limit exceeded. Please try again later.' },
        429
      );
    }

    console.log('Parsing request body...');
    const { hash, studentName, universityName, degreeName, recordUrl, linkedinToken, linkedinMemberId } = await req.json();

    console.log('Received data:', {
      hash: hash ? 'present' : 'missing',
      studentName: studentName ? 'present' : 'missing',
      linkedinToken: linkedinToken ? 'present' : 'missing',
      linkedinMemberId: linkedinMemberId ? 'present' : 'missing',
    });

    // Validate input data
    const validationErrors = validateCertificateData({
      hash,
      studentName,
      universityName,
      degreeName,
      recordUrl
    });

    console.log('Validation errors:', validationErrors.length > 0 ? validationErrors : 'none');

    if (validationErrors.length > 0) {
      return createSecureResponse(
        { error: 'Invalid input data', details: validationErrors },
        400
      );
    }

    // Validate LinkedIn token if provided
    if (linkedinToken && !validateLinkedInToken(linkedinToken)) {
      console.error('Invalid LinkedIn token format');
      return createSecureResponse(
        { error: 'Invalid LinkedIn token format' },
        400
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      hash: sanitizeInput(hash),
      studentName: sanitizeInput(studentName),
      universityName: sanitizeInput(universityName),
      degreeName: sanitizeInput(degreeName),
      recordUrl: sanitizeInput(recordUrl),
      linkedinToken: linkedinToken ? sanitizeInput(linkedinToken) : undefined,
      linkedinMemberId: linkedinMemberId ? sanitizeInput(linkedinMemberId) : undefined,
    };

    console.log('Starting LinkedIn post...');
    const linkedInResult = await sendLinkedInPost(sanitizedData);
    console.log('LinkedIn result:', linkedInResult);

    console.log('Starting HRMS update...');
    const hrmsResult = await sendHrmsUpdate(sanitizedData);
    console.log('HRMS result:', hrmsResult);

    const responseData = {
      success: true,
      details: {
        linkedin: linkedInResult.status,
        hrms: hrmsResult.status,
        linkedinReason: linkedInResult.reason,
        hrmsReason: hrmsResult.reason,
        linkedinError: linkedInResult.error,
        hrmsError: hrmsResult.error,
      },
    };

    console.log('=== Integration Route Success ===');
    return createSecureResponse(responseData);
  } catch (error: any) {
    console.error('=== Integration Route Error ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    return createSecureResponse(
      { error: error?.message || 'Integration route failed.' },
      500
    );
  }
}
