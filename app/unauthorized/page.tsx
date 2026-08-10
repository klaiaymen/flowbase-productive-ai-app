import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <AppShell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-4">
        <div className="relative mb-6">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-xl shadow-rose-500/20">
            <Lock className="size-10" />
          </div>
          <div className="absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-full bg-white text-rose-600 shadow-md">
            <ShieldAlert className="size-5" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Access Restricted
        </h1>
        <p className="mt-3 max-w-md text-base text-slate-600">
          You do not have the required permissions or role to view this page. If you believe this is an error, please contact your administrator.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Button asChild size="lg" className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-6">
            <Link href="/kanban">
              <ArrowLeft className="mr-2 size-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
