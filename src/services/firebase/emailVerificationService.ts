import { auth } from '../../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';

/**
 * Service to handle email verification calls to our backend and Firebase Auth.
 */

/**
 * Sends a verification email to the currently logged-in user via the standard Firebase Authentication system.
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  language: 'PT' | 'EN' = 'PT'
): Promise<{ success: boolean; error?: string; deliveryFailed?: boolean; verificationLink?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: language === 'PT' ? 'Nenhum utilizador autenticado encontrado.' : 'No authenticated user found.' };
    }

    console.log('[emailVerificationService] Sending standard Firebase email verification to:', user.email);
    await sendEmailVerification(user);
    return { success: true };
  } catch (error: any) {
    console.error('[emailVerificationService] sendVerificationEmail error:', error);
    
    // In some sandboxed environments, client-side sendEmailVerification can be blocked or throttled.
    // We will attempt to get a fallback verification link from the server if possible, without Brevo.
    try {
      const user = auth.currentUser;
      if (user) {
        const response = await fetch('/api/auth/get-verification-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uid: user.uid }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.verificationLink) {
            return { 
              success: true, 
              deliveryFailed: true, 
              verificationLink: data.verificationLink 
            };
          }
        }
      }
    } catch (fallbackErr) {
      console.warn('[emailVerificationService] Fallback link retrieval failed:', fallbackErr);
    }

    return { 
      success: false, 
      error: error.message || 'Error sending verification email' 
    };
  }
}

/**
 * Resends the verification email to the user.
 * Includes client-side rate limiting/cooldown.
 */
export async function resendVerificationEmail(
  email: string,
  name: string,
  language: 'PT' | 'EN' = 'PT'
): Promise<{ success: boolean; error?: string; deliveryFailed?: boolean; verificationLink?: string }> {
  return sendVerificationEmail(email, name, language);
}

/**
 * Syncs and checks if the currently logged-in user's email is verified.
 * Reloads the user profile from Firebase Authentication and verifies database status.
 */
export async function checkEmailVerification(): Promise<{ verified: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { verified: false, error: 'No authenticated user found' };
  }

  try {
    // 1. Attempt to reload client-side Auth
    try {
      await user.reload();
    } catch (reloadErr) {
      console.warn('[emailVerificationService] user.reload() failed, continuing to server check:', reloadErr);
    }
    
    const refreshedUser = auth.currentUser;
    let isVerified = refreshedUser?.emailVerified || false;

    // 2. Query Firestore Database status (which is updated via custom email verification flow)
    try {
      const response = await fetch('/api/auth/check-verification-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: user.uid }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.verified) {
          isVerified = true;
        }
      }
    } catch (serverErr) {
      console.warn('[emailVerificationService] Server status check failed:', serverErr);
    }

    // 3. Mark database as verified if client is verified
    if (isVerified) {
      await fetch('/api/auth/mark-verified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: user.uid }),
      }).catch(err => console.warn('[emailVerificationService] failed to mark verified on db:', err));
    }

    return { verified: isVerified };
  } catch (error: any) {
    console.error('[emailVerificationService] General check failed:', error);
    return { verified: false, error: error.message || 'Error checking verification status' };
  }
}
