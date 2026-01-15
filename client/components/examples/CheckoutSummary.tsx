import CheckoutSummary from '../CheckoutSummary';

export default function CheckoutSummaryExample() {
  return (
    <div className="p-8 max-w-md">
      <CheckoutSummary itemPrice={850} deliveryFee={68} />
    </div>
  );
}
