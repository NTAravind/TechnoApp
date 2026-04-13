import { auth } from "../../../../../auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import CheckoutContent from "./form";
import { LogIn } from "lucide-react";


export default async function CheckOut() {
  const session = await auth();
  
  if (!session?.user) {
    return (
      <div className="min-h-screen  flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center text-center p-8">
            <div className="w-16 h-16  rounded-full flex items-center justify-center mb-6">
              <LogIn className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Sign In Required
            </h1>
            <p className="text-gray-600 mb-6">
              Please sign in to access the checkout page and complete your order.
            </p>
            <Button asChild className="w-full">
              <a href="/login">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = await prisma.customer.findFirst({
    where: { phone: session.user.name as string },
  });

  const userData = { 
    us: user, 
    phone: session.user.name as string 
  };

  return <CheckoutContent user={userData} />;
}