import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Chrome, Lock, Mail } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Marketing */}
      <section className="relative flex items-center bg-primary text-primary-foreground p-8 md:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_0%_0%,white/25,transparent)]" />
        <div className="relative mx-auto w-full max-w-2xl">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-semibold text-primary-foreground/90 ring-1 ring-primary-foreground/20">
              <span className="size-1.5 rounded-full bg-primary-foreground/80" />
              Logistica
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-[#0a0a0a] drop-shadow [text-shadow:0_1px_0_rgba(255,255,255,0.4)]">
            Designed for full logistic support
          </h1>
          <p className="mt-4 text-lg md:text-xl text-[#1a1a1a]">
            View all the analytics and grow your business from anywhere.
          </p>

          {/* Illustrative dashboard card */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#0a0a0a] p-5 text-foreground shadow-xl ring-1 ring-black/10">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Website traffic
                </div>
                <span className="h-6 rounded-full bg-primary/20 px-2 text-xs font-medium text-primary-foreground/90 ring-1 ring-white/10">
                  12k
                </span>
              </div>
              <div className="mt-6 h-20 w-full rounded-lg bg-gradient-to-tr from-yellow-300/40 via-yellow-400/20 to-transparent" />
            </div>
            <div className="rounded-2xl bg-[#0a0a0a] p-5 text-foreground shadow-xl ring-1 ring-black/10">
              <div className="text-sm text-muted-foreground">Conversion</div>
              <div className="mt-6 flex items-end gap-2">
                {[45, 60, 38, 72, 68].map((h, i) => (
                  <div
                    key={i}
                    className="w-6 rounded-md bg-yellow-300/70"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right: Auth */}
      <section className="relative flex items-center justify-center bg-background p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-4xl font-bold tracking-tight">Log in</h2>
          </div>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/dashboard");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">
                Email address
              </Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="johndoe@gmail.com"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">
                Password
              </Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>
            <Button className="w-full h-11 rounded-full text-base font-semibold">
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <Button
            variant="outline"
            className="w-full h-11 rounded-full bg-background"
          >
            <Chrome className="mr-2" size={18} /> Log in with Google
          </Button>
        </div>
      </section>
    </main>
  );
}
