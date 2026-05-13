'use client'
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface ChangePinFormProps {
  setOpen: (open: boolean) => void;
  onPinChange: (oldPin: string, newPin: string) => void;
}

const formSchema = z.object({
  currentPin: z.string().min(4, 'PIN must be at least 4 characters'),
  newPin: z.string().min(4, 'PIN must be at least 4 characters'),
  confirmNewPin: z.string().min(4, 'PIN must be at least 4 characters'),
}).refine((data) => data.newPin === data.confirmNewPin, {
  message: "New PINs don't match",
  path: ["confirmNewPin"],
});

const ChangePinForm = ({ setOpen, onPinChange }: ChangePinFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPin: '',
      newPin: '',
      confirmNewPin: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onPinChange(values.currentPin, values.newPin);
    setOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="currentPin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current PIN</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New PIN</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmNewPin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New PIN</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-4">
          <Button className='w-full' variant="secondary" type="submit">Update PIN</Button>
          <Button className='w-full' type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </form>
    </Form>
  );
};

export default ChangePinForm;
