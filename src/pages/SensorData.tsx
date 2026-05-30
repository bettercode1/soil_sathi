import Layout from "@/components/layout/Layout";
import { SensorIntegrationFlow } from "@/components/sensors/integration/SensorIntegrationFlow";

const SensorData = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-slate-50/50 pb-12">
        <main className="container mx-auto px-4 py-6 md:py-8">
          <div className="max-w-7xl mx-auto">
            <SensorIntegrationFlow />
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default SensorData;
