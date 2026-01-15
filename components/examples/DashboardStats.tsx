import DashboardStats from '../DashboardStats';

export default function DashboardStatsExample() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Seller Stats</h3>
        <DashboardStats userType="seller" />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Buyer Stats</h3>
        <DashboardStats userType="buyer" />
      </div>
    </div>
  );
}
