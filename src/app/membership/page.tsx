import { redirect } from "next/navigation";
import dodo from "@/lib/dodo";

export const dynamic = "force-dynamic";

export default async function MembershipPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const planParam = searchParams?.plan || "premium";
  const planType = planParam === "premium-plus" ? "premium-plus" : "premium";

  const productId =
    planType === "premium-plus"
      ? process.env.DODO_PREMIUM_PLUS_PRODUCT_ID!
      : process.env.DODO_PREMIUM_PRODUCT_ID!;

  if (!productId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1>Product Config Error. Please contact support.</h1>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://auth.crazyui.com";

  let checkoutUrl: string | undefined;

  try {
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      return_url: `${baseUrl}/account`,
      metadata: {
        plan_type: planType,
      },
    });

    checkoutUrl =
      (session as any).checkout_url ||
      (session as any).payment_link ||
      (session as any).url;
  } catch (error) {
    console.error("Failed to create Dodo checkout session:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1>Something went wrong. Please try again.</h1>
      </div>
    );
  }

  if (checkoutUrl) {
    redirect(checkoutUrl);
  } else {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1>Loading checkout...</h1>
      </div>
    );
  }
}

