"use client";
import React, { useRef } from "react";
import { useForm } from "react-hook-form";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eraser } from "lucide-react";
import { DialogClose } from "../ui/dialog";

interface UpdateClientSignatureFormProps {
  onSignatureUpdate: (signature: string) => void;
  setOpen: (open: boolean) => void;
}

const formSchema = z
  .object({
    pin: z.string().min(4, "PIN must be at least 4 characters"),
    confirmPin: z.string().min(4, "PIN must be at least 4 characters"),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "PINs don't match",
    path: ["confirmPin"],
  });

const UpdateClientSignatureForm = ({ onSignatureUpdate, setOpen }: UpdateClientSignatureFormProps) => {
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pin: "",
      confirmPin: "",
    },
  });

  const clearSignature = () => sigCanvas.current?.clear();

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (sigCanvas.current) {
      const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
      onSignatureUpdate(dataURL);
      console.log("Form values:", values);
      console.log("Signature:", dataURL);
      // Handle form submission here
      setOpen(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-10">
        <div className="relative">
          <label className="mb-2 block text-sm font-medium text-gray-900">Draw your signature here</label>
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              style: {
                border: "1px solid black",
                borderRadius: "5px",
                width: "100%",
                height: "200px",
              },
              className: "sigCanvas",
            }}
          />
          <Button type="button" size="sm" variant="destructive" onClick={clearSignature} className="absolute bottom-2 right-2 flex items-center gap-2">
            <Eraser className="w-4 h-4" />
            Clear
          </Button>
        </div>
        {/* <div className="flex gap-4">
          <FormField
            control={form.control}
            name="pin"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>PIN</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPin"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Confirm PIN</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div> */}
        <div className="flex gap-4 pt-4">
          <DialogClose asChild>
            <Button className="w-full" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button className="w-full" variant="secondary" type="submit">
            Submit <ArrowRight />
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UpdateClientSignatureForm;
