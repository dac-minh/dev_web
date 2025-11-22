import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, User2, Phone, Lock } from "lucide-react";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="rounded-2xl bg-[#0f0f0f] p-6 ring-2 ring-yellow-400/40">
          <div className="mb-4 border-b border-yellow-400/40 pb-3">
            <h2 className="text-xl font-extrabold tracking-wider text-yellow-300">
              Account Settings
            </h2>
            <p className="mt-1 text-xs text-yellow-200/60">
              Personal Information
            </p>
          </div>

          <form className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username" className="text-yellow-200/90">
                Username
              </Label>
              <div className="relative">
                <User2
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-yellow-200/60"
                />
                <Input
                  id="username"
                  placeholder="username"
                  className="pl-10 bg-black/30 text-white ring-1 ring-white/10"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-yellow-200/90">
                Email
              </Label>
              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-yellow-200/60"
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@domain.com"
                  className="pl-10 bg-black/30 text-white ring-1 ring-white/10"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-yellow-200/90">
                Phone
              </Label>
              <div className="relative">
                <Phone
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-yellow-200/60"
                />
                <Input
                  id="phone"
                  placeholder="0901234567"
                  className="pl-10 bg-black/30 text-white ring-1 ring-white/10"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button className="rounded-full bg-yellow-300 text-black hover:bg-yellow-200">
                Save Changes
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-yellow-300 text-yellow-300 hover:bg-yellow-300/10"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl bg-[#0f0f0f] p-6 ring-2 ring-yellow-400/40">
          <div className="mb-4 border-b border-yellow-400/40 pb-3">
            <h3 className="text-base font-semibold text-yellow-200">
              Change Password
            </h3>
          </div>
          <form className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="current" className="text-yellow-200/90">
                Current Password
              </Label>
              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-yellow-200/60"
                />
                <Input
                  id="current"
                  type="password"
                  className="pl-10 bg-black/30 text-white ring-1 ring-white/10"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new" className="text-yellow-200/90">
                New Password
              </Label>
              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-yellow-200/60"
                />
                <Input
                  id="new"
                  type="password"
                  className="pl-10 bg-black/30 text-white ring-1 ring-white/10"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm" className="text-yellow-200/90">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-yellow-200/60"
                />
                <Input
                  id="confirm"
                  type="password"
                  className="pl-10 bg-black/30 text-white ring-1 ring-white/10"
                />
              </div>
            </div>
            <div className="mt-3">
              <Button className="rounded-full bg-yellow-300 text-black hover:bg-yellow-200">
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
