import { getAuthRedirect } from '../router/authRedirect.js'

export function getPasswordResetUrl(router, redirect, origin) {
  const destination = getAuthRedirect(router, redirect)
  const callback = router.resolve({
    name: 'reset-password',
    query: { redirect: router.resolve(destination).fullPath },
  })
  return new URL(callback.href, origin).toString()
}

// Recovery links establish a session through the existing implicit auth flow.
// A valid authenticated session can also update its own password directly.
export async function getPasswordRecoveryUser(auth) {
  const { error: initializationError } = await auth.initialize()
  if (initializationError) {
    throw new Error('This password reset link is invalid or has expired. Request a new link.')
  }
  const { data, error } = await auth.getUser()
  if (error || !data?.user?.id) {
    throw new Error(
      'Your password reset session is unavailable or has expired. Request a new link.',
    )
  }
  return data.user
}

export async function updateRecoveredPassword(auth, password, expectedUserId) {
  const user = await getPasswordRecoveryUser(auth)
  if (user.id !== expectedUserId) {
    throw new Error('Your account session has changed. Request a new password reset link.')
  }
  const { error } = await auth.updateUser({ password })
  if (!error) return
  if (error.code === 'same_password') {
    throw new Error('Choose a password that is different from your current password.')
  }
  if (error.code === 'weak_password') {
    throw new Error(
      'This password does not meet the account requirements. Choose a stronger password.',
    )
  }
  if (error.status === 401 || error.code === 'session_not_found') {
    throw new Error('Your password reset session has expired. Request a new link.')
  }
  throw new Error('Unable to update your password. Please try again.')
}
