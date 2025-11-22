import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, User2, Phone } from "lucide-react";

export default function Account() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-6">
        <div className="w-full max-w-lg rounded-2xl bg-[#0f0f0f] p-6 ring-2 ring-yellow-400/40 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
          <div className="mb-4 border-b border-yellow-400/40 pb-3">
            <h2 className="text-xl font-extrabold tracking-wider text-yellow-300">
              THÔNG TIN CÁ NHÂN
            </h2>
          </div>

          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-yellow-200/90">
                Họ và tên
              </Label>
              <div className="relative">
                <User2
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-yellow-200/60"
                />
                <Input
                  id="name"
                  placeholder="Nguyễn Văn A"
                  className="pl-10 bg-black/30 text-white ring-1 ring-white/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-yellow-200/90">
                Số điện thoại
              </Label>
              <div className="relative">
                <Phone
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-yellow-200/60"
                />
                <Input
                  id="phone"
                  placeholder="0901234567"
                  className="pl-10 bg-black/30 text-white ring-1 ring-yellow-400/40 focus-visible:ring-yellow-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-yellow-200/90">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@domain.com"
                className="bg-black/30 text-white ring-1 ring-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob" className="text-yellow-200/90">
                Ngày sinh
              </Label>
              <div className="relative">
                <Calendar
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-yellow-200/60"
                />
                <Input
                  id="dob"
                  type="date"
                  className="pl-10 bg-black/30 text-white ring-1 ring-white/10"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button className="rounded-full bg-yellow-300 text-black hover:bg-yellow-200">
                Lưu thay đổi
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-yellow-300 text-yellow-300 hover:bg-yellow-300/10"
              >
                Hủy
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
