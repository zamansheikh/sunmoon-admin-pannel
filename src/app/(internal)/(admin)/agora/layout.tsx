import AgoraGate from "@/components/agora/AgoraGate";

export const metadata = {
  title: "Agora Server | AddaLive Admin",
};

export default function AgoraLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="agora-admin">
      <AgoraGate>{children}</AgoraGate>
    </div>
  );
}
