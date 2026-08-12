import { z } from 'zod';

/**
 * Form-side validation for the create-order dialog.
 *
 * The backend derives its own validator from the Drizzle table via `drizzle-zod`
 * (backend/src/db/schema.ts). Because the two projects live in separate folders
 * with separate installs, this schema is a deliberate restatement rather than a
 * shared import — but it is *not* hand-maintained duplication: the request body
 * is typed by `hc<AppType>`, so if this schema drifts from the server's, the
 * `$post({ json })` call in src/api/queries.ts stops compiling.
 *
 * The rules below match backend/src/db/schema.ts `insertOrderSchema` exactly.
 */
export const createOrderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Customer name must be at least 2 characters')
    .max(100, 'Customer name must be 100 characters or fewer'),
  pickupAddress: z
    .string()
    .trim()
    .min(5, 'Pickup address must be at least 5 characters')
    .max(255, 'Pickup address must be 255 characters or fewer'),
  dropoffAddress: z
    .string()
    .trim()
    .min(5, 'Dropoff address must be at least 5 characters')
    .max(255, 'Dropoff address must be 255 characters or fewer'),
  packageWeightKg: z.coerce
    .number<number>({ error: 'Package weight is required' })
    .positive('Package weight must be greater than 0')
    .max(9999.99, 'Package weight must be 9999.99 kg or less'),
  courierName: z
    .string()
    .trim()
    .max(100, 'Courier name must be 100 characters or fewer')
    .optional()
    .or(z.literal('')),
});

export type CreateOrderValues = z.input<typeof createOrderSchema>;
export type CreateOrderPayload = z.output<typeof createOrderSchema>;

export const loginFormSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginValues = z.infer<typeof loginFormSchema>;
