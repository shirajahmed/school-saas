"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { step3Schema, type Step3Data } from "@/lib/validations/onboarding";

import toast from "react-hot-toast";

interface Step3FormProps {
  onSubmit: (data: Step3Data) => void;
  isLoading: boolean;
  selectedPlan?: any;
  token?: string;
  onStepComplete?: () => void;
}

export function Step3Form({
  onSubmit,
  isLoading,
  selectedPlan,
  token,
  onStepComplete,
}: Step3FormProps) {
  const [paymentMethod, setPaymentMethod] = useState<"phonepe" | "stripe">(
    "stripe"
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Use fallback plan if selectedPlan is null
  const plan = selectedPlan || {
    id: "STARTER",
    name: "Starter Plan",
    price: 29,
  };
  const amount = plan.price;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    mode: "onChange",
    defaultValues: {
      paymentMethod: "phonepe",
      amount: amount,
    },
  });

  useEffect(() => {
    setValue("paymentMethod", paymentMethod);
    setValue("amount", amount);
  }, [paymentMethod, amount, setValue]);

  const handlePaymentSuccess = async () => {
    if (!token) {
      toast.error("Missing payment information");
      return;
    }

    setIsProcessing(true);
    try {
      // Step 3: Submit payment data
      await submitStep3({
        paymentMethod: "stripe",
        paymentToken: "tok_visa"
      });
      
      toast.success("Step 3 completed! Setting up your account...");
      
      // Show loading screen
      setTimeout(async () => {
        try {
          // Complete onboarding
          await completeOnboarding(token);
          toast.success("Setup completed successfully!");
          onStepComplete?.();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Setup failed. Please try again.");
        } finally {
          setIsProcessing(false);
        }
      }, 2000);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const submitStep3 = async (stepData: any) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        step: 3,
        stepData
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit step 3');
    }

    return response.json();
  };

  const handlePhonePePayment = async () => {
    await handlePaymentSuccess();
  };

  const completeOnboarding = async (onboardingToken: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: onboardingToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to complete onboarding');
    }

    return response.json();
  };

  const handleFormSubmit = async (data: Step3Data) => {
    await handlePaymentSuccess();
  };

  // Show loading screen during processing
  if (isProcessing) {
    return (
      <div className="text-center space-y-6 py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Setting up your account...</h3>
          <p className="text-gray-600">Please wait while we complete your onboarding</p>
        </div>
      </div>
    );
  }

  // Skip payment for free trial
  if (plan.price === 0) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Free Trial Selected
          </h3>
          <p className="text-green-600 mb-4">
            No payment required! You can start using the system immediately.
          </p>
          <Button
            onClick={async () => {
              await handlePaymentSuccess();
            }}
            disabled={isLoading || isProcessing}
            className="w-full"
          >
            {isProcessing ? "Setting up..." : "Complete Setup"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Complete Payment</h3>
        <p className="text-gray-600">Secure payment for your selected plan</p>
      </div>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Plan:</span>
              <span className="font-medium">{plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-medium">₹{amount}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Billing:</span>
              <span>Monthly</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>₹{amount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("phonepe")}
                className={`p-4 border rounded-lg text-center transition-all ${
                  paymentMethod === "phonepe"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium">PhonePe</div>
                <div className="text-sm text-gray-500">UPI, Cards, Wallets</div>
                <div className="text-xs text-green-600 mt-1">Recommended</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("stripe")}
                className={`p-4 border rounded-lg text-center transition-all ${
                  paymentMethod === "stripe"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium">Stripe</div>
                <div className="text-sm text-gray-500">Credit/Debit Cards</div>
                <div className="text-xs text-blue-600 mt-1">Test Mode</div>
              </button>
            </div>

            {paymentMethod === "phonepe" && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">PhonePe Payment Gateway</h4>
                <p className="text-sm text-gray-600 mb-3">
                  You will be redirected to PhonePe's secure payment page.
                </p>
                <Button
                  onClick={handlePhonePePayment}
                  disabled={isLoading || isProcessing}
                  className="w-full"
                >
                  {isProcessing
                    ? "Processing..."
                    : `Pay ₹${amount} with PhonePe`}
                </Button>
              </div>
            )}

            {paymentMethod === "stripe" && (
              <form
                onSubmit={handleSubmit(handleFormSubmit)}
                className="space-y-4"
              >
                <FormField
                  label="Payment Token"
                  type="text"
                  placeholder="For demo, use: tok_visa"
                  error={errors.paymentToken?.message}
                  required
                  {...register("paymentToken")}
                />

                <div className="bg-blue-50 p-4 rounded-lg text-sm">
                  <p className="font-semibold mb-2">Demo Payment:</p>
                  <p>
                    For testing purposes, use payment token:{" "}
                    <code className="bg-white px-2 py-1 rounded">tok_visa</code>
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!isValid || isLoading || isProcessing}
                >
                  {isProcessing
                    ? "Processing Payment..."
                    : `Pay ₹${amount} with Stripe`}
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
