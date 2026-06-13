import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SupportForm from "./SupportForm"; // We will extract the form to a client component

export const revalidate = 0;

export default async function SupportPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="p-8 text-center text-zinc-400">
        Please sign in to access Customer Support.
      </div>
    );
  }

  const messages = await prisma.message.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-6">Customer Support</h1>
        <SupportForm />
      </div>

      {messages.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Your Messages</h2>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg">
                <div className="text-xs text-zinc-500 mb-2">
                  {new Date(message.createdAt).toLocaleString()}
                </div>
                <p className="text-zinc-300 mb-4 whitespace-pre-wrap">{message.content}</p>

                {message.reply ? (
                  <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
                    <div className="text-xs font-bold text-green-500 mb-1 uppercase tracking-wider">Admin Reply</div>
                    <p className="text-zinc-400">{message.reply}</p>
                  </div>
                ) : (
                  <div className="inline-block bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded uppercase tracking-wider font-bold">
                    Pending Reply
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
