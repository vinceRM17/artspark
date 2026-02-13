import { z } from 'zod';

/**
 * Zod schemas for onboarding flow validation
 * Each step has its own schema, and completeOnboardingSchema combines all fields
 */

export const step1Schema = z.object({
  mediums: z.array(z.string()).min(1, 'Pick at least one medium'),
});

export const step2Schema = z.object({
  colorPalettes: z.array(z.string()).optional().default([]),
});

export const step3Schema = z.object({
  subjects: z.array(z.string()).min(1, 'Pick at least one subject'),
});

export const step4Schema = z.object({
  exclusions: z.array(z.string()).optional().default([]),
});

export const step5Schema = z.object({
  notificationHour: z.number().min(0).max(23),
  notificationMinute: z.number().min(0).max(59),
});

export const completeOnboardingSchema = z.object({
  mediums: z.array(z.string()).min(1, 'Pick at least one medium'),
  colorPalettes: z.array(z.string()).optional().default([]),
  subjects: z.array(z.string()).min(1, 'Pick at least one subject'),
  exclusions: z.array(z.string()).optional().default([]),
  notificationHour: z.number().min(0).max(23),
  notificationMinute: z.number().min(0).max(59),
});

export type OnboardingData = z.infer<typeof completeOnboardingSchema>;
