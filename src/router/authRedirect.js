// Only registered, internal content routes may be used as return destinations.
export function getAuthRedirect(router, value) {
  const fallback = { name: 'home' }
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    [...value].some(
      (character) =>
        character === '\\' || character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    )
  ) {
    return fallback
  }

  try {
    const target = router.resolve(value)
    if (
      !target.matched.length ||
      target.matched.some((record) => record.meta.guestOnly || record.meta.authCallback)
    ) {
      return fallback
    }
    return { path: target.path, query: target.query, hash: target.hash }
  } catch {
    return fallback
  }
}

export function getAuthRouteRedirect(router, route, user) {
  if (route.meta.requiresAuth && !user) {
    return { name: 'login', query: { redirect: route.fullPath }, replace: true }
  }
  if (route.meta.guestOnly && user) {
    return { ...getAuthRedirect(router, route.query.redirect), replace: true }
  }
}
