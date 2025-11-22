import DashboardLayout from "@/layouts/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Analysis() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="rounded-xl bg-[#0f0f0f] p-3 ring-1 ring-white/10">
          <input
            placeholder="Filter"
            className="h-10 w-full rounded-md bg-black/60 px-3 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/60"
          />
        </div>

        <div className="rounded-3xl ring-2 ring-blue-500/50 bg-[#0a0a0a] p-4 min-h-[520px]" />

        <Tabs defaultValue="tab1" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-transparent">
            <TabsTrigger
              value="tab1"
              className="rounded-md bg-[#0f0f0f] text-white ring-1 ring-white/10 data-[state=active]:bg-yellow-300 data-[state=active]:text-black"
            >
              Phân tích chi tiết Coin
            </TabsTrigger>
            <TabsTrigger
              value="tab2"
              className="rounded-md bg-[#0f0f0f] text-white ring-1 ring-white/10 data-[state=active]:bg-yellow-300 data-[state=active]:text-black"
            >
              Nhận định & Tin tức thị trường
            </TabsTrigger>
            <TabsTrigger
              value="tab3"
              className="rounded-md bg-[#0f0f0f] text-white ring-1 ring-white/10 data-[state=active]:bg-yellow-300 data-[state=active]:text-black"
            >
              Tổng quan thị trường
            </TabsTrigger>
            <TabsTrigger
              value="tab4"
              className="rounded-md bg-[#0f0f0f] text-white ring-1 ring-white/10 data-[state=active]:bg-yellow-300 data-[state=active]:text-black"
            >
              So sánh & Danh mục đầu tư
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" />
          <TabsContent value="tab2" />
          <TabsContent value="tab3" />
          <TabsContent value="tab4" />
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
