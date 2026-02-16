import CheckoutForm from "@/components/CheckoutForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
          CrazyUI Membership
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          One-time payment of{" "}
          <span className="font-bold text-gray-900">₹100</span> to get lifetime
          access.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <CheckoutForm />
      </div>
    </div>
  );
}
