import { Logo } from "@/components/Logo";
import { PasswordGateForm } from "@/components/PasswordGateForm";

export const dynamic = "force-dynamic";

export default function EntrarPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zosa-cream px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo heightClassName="h-12" textClassName="text-2xl" />
        </div>
        <PasswordGateForm />
      </div>
    </div>
  );
}
