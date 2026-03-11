import dodo from "./src/lib/dodo";

async function testSession() {
  try {
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: process.env.DODO_PREMIUM_PRODUCT_ID || "pdt_3eFwXp644h6j7sUv9kL0M",
          quantity: 1,
        },
      ],
      return_url: "https://auth.crazyui.com/account",
      metadata: {
        plan_type: "premium",
      },
    });
    console.log(session);
  } catch (error) {
    console.error(error);
  }
}

testSession();
