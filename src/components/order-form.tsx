import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from './ui/button';
import { InputField, TextareaField } from './ui/field';
import { useToast } from './ui/toast';
import { useCreateOrder } from '@/api/queries';
import { createOrderSchema, type CreateOrderPayload, type CreateOrderValues } from '@/lib/schemas';

/**
 * Create-order form (DESIGN.md §10.5).
 *
 * `zodResolver` runs the same rules the server enforces, so the inline error a
 * user sees is the error the API would have returned. On failure the form keeps
 * everything the user typed — nothing is more annoying than a cleared form.
 */
export function OrderForm({ onCreated }: { onCreated?: () => void }) {
  const toast = useToast();
  const createOrder = useCreateOrder();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrderValues, unknown, CreateOrderPayload>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerName: '',
      pickupAddress: '',
      dropoffAddress: '',
      packageWeightKg: '' as unknown as number,
      courierName: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createOrder.mutateAsync(values);
      toast.push('success', 'Order created', `Tracking number ${created.trackingNumber}`);
      reset();
      onCreated?.();
    } catch (error) {
      toast.push(
        'error',
        'Could not create the order',
        error instanceof Error ? error.message : 'Unexpected error',
      );
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <InputField
        label="Customer name"
        placeholder="Farhana Rahman"
        autoComplete="off"
        error={errors.customerName?.message}
        {...register('customerName')}
      />

      <TextareaField
        label="Pickup address"
        placeholder="Onway Hub 3, Tejgaon Industrial Area, Dhaka 1208"
        error={errors.pickupAddress?.message}
        {...register('pickupAddress')}
      />

      <TextareaField
        label="Dropoff address"
        placeholder="House 42, Road 11, Banani, Dhaka 1213"
        error={errors.dropoffAddress?.message}
        {...register('dropoffAddress')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Package weight (kg)"
          type="number"
          step="0.01"
          min="0.01"
          inputMode="decimal"
          placeholder="2.50"
          hint="Kilograms — the brief doesn't specify a unit, so kg is assumed."
          error={errors.packageWeightKg?.message}
          {...register('packageWeightKg')}
        />

        <InputField
          label="Courier (optional)"
          placeholder="Imran Kabir"
          autoComplete="off"
          hint="Assigns the order to a courier's mobile view."
          error={errors.courierName?.message}
          {...register('courierName')}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-hairline pt-4">
        <p className="text-xs text-fog-dim">
          New orders always start as <span className="text-fog">pending</span>.
        </p>
        <Button type="submit" variant="primary" loading={isSubmitting || createOrder.isPending}>
          Create order
        </Button>
      </div>
    </form>
  );
}
