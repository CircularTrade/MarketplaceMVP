import StripeConnectCard from '../StripeConnectCard';

export default function StripeConnectCardExample() {
  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Not Connected</h3>
        <StripeConnectCard isConnected={false} />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Connected</h3>
        <StripeConnectCard isConnected={true} earnings={24500} />
      </div>
    </div>
  );
}
