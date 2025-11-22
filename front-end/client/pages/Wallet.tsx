import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { useState } from "react";

interface CardItem {
  id: string;
  name: string;
  number: string; // masked
  expiry: string;
  brand: "MasterCard" | "Visa" | "Amex";
}

const newCard = (): CardItem => {
  const last4 = Math.floor(1000 + Math.random() * 9000);
  return {
    id: crypto.randomUUID(),
    name: "Prem Kumar Shahi",
    number: `8050 5040 2030 ${last4}`,
    expiry: "05/28",
    brand: "MasterCard",
  };
};

export default function Wallet() {
  const [cards, setCards] = useState<CardItem[]>([newCard()]);
  const [activeId, setActiveId] = useState(cards[0].id);

  const active = cards.find((c) => c.id === activeId)!;

  const handleAdd = () => {
    const c = newCard();
    setCards((prev) => [...prev, c]);
    setActiveId(c.id);
    toast.success("Đã thêm thẻ mới");
  };
  const handleDelete = () => {
    if (!active) return;
    setCards((prev) => prev.filter((c) => c.id !== active.id));
    toast("Đã xóa thẻ", { description: active.number });
  };
  const handleEdit = () => {
    toast("Thay đổi thông tin thẻ", { description: "Tính năng demo" });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center gap-8 py-8">
        {/* Card preview block */}
        <div
          className="relative rounded-[32px] bg-[#eaf4ff] p-10 shadow-[inset_0_0_40px_#dbeafe]"
          style={{ width: 620 }}
        >
          <div className="absolute inset-0 -z-10 rounded-[32px] bg-white/5 ring-1 ring-white/10" />
          {/* Credit card */}
          <div className="mx-auto w-[420px] rounded-2xl bg-[#0b0b0b] p-6 text-white shadow-2xl ring-1 ring-white/10">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span className="font-semibold">{active.brand}</span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-full bg-[#fbbf24]" />
                <span className="inline-block h-3 w-3 rounded-full bg-[#ef4444] -ml-1" />
              </span>
            </div>
            <div className="mt-8 text-xl tracking-widest">{active.number}</div>
            <div className="mt-8 flex items-center justify-between text-sm text-white/70">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">
                  Card Holder
                </div>
                <div className="font-medium">{active.name}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">
                  Valid Thru
                </div>
                <div className="font-medium">{active.expiry}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <Button
            onClick={handleAdd}
            variant="outline"
            className="rounded-xl bg-background text-white ring-1 ring-white/10"
          >
            <Plus className="mr-2" size={16} /> add thẻ mới
          </Button>
          <Button
            onClick={handleDelete}
            variant="outline"
            className="rounded-xl bg-background text-white ring-1 ring-white/10"
          >
            <Trash2 className="mr-2" size={16} /> Xóa thẻ
          </Button>
          <Button
            onClick={handleEdit}
            className="rounded-xl bg-yellow-300 text-black hover:bg-yellow-200"
          >
            <Edit3 className="mr-2" size={16} /> Thay đổi thông tin thẻ
          </Button>
        </div>

        {/* Small card selector */}
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {cards.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`h-2 w-8 rounded-full ${c.id === activeId ? "bg-yellow-300" : "bg-white/20"}`}
              aria-label={`select card ${c.number.slice(-4)}`}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
