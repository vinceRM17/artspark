// Sentry wrapper — no-ops in Expo Go, real in EAS builds.
// Metro bundles all require() calls regardless of runtime conditions,
// so we can't conditionally require @sentry/react-native here.
// In EAS/production builds, the real Sentry plugin handles initialization.
// This module provides safe no-op stubs so the rest of the app compiles.

export function init(_config: Record<string, unknown>) {
  // No-op: Sentry plugin initializes in native EAS builds
}

export function captureException(_error: unknown) {
  // No-op in Expo Go
}

export function setUser(_user: { id: string; email?: string } | null) {
  // No-op in Expo Go
}

export function addBreadcrumb(_breadcrumb: { category?: string; message?: string; level?: string }) {
  // No-op in Expo Go
}

export function wrap<T>(component: T): T {
  return component;
}
