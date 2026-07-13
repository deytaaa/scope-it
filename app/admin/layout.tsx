import { LogoutButton } from "@/components/admin/LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b-[0.5px] border-border bg-chrome">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="font-mono text-sm text-primary">ConsultAI admin</span>
          <LogoutButton />
        </div>
      </header>
      {children}
    </>
  );
}
