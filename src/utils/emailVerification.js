import { getAuthRedirect } from '../router/authRedirect.js'

export function getEmailConfirmationUrl(router, redirect, origin) {
  const destination = getAuthRedirect(router, redirect)
  const callback = router.resolve({
    name: 'auth-confirm',
    query: { redirect: router.resolve(destination).fullPath },
  })
  return new URL(callback.href, origin).toString()
}

// Supabase consumes the default email link's session during client initialization.
export async function confirmEmailSession(auth) {
  const { error: initializationError } = await auth.initialize()
  if (initializationError) {
    throw new Error('This confirmation link is invalid or has expired. Request a new link.')
  }

  const { data, error } = await auth.getUser()
  if (error || !data?.user?.email_confirmed_at) {
    throw new Error('No verified session was found. Request a new link or log in again.')
  }
  return data.user
}
