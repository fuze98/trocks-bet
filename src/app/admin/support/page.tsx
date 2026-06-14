import { prisma } from "@/lib/prisma";
import { replyToMessage } from "./actions";

export const revalidate = 0; // Disable static caching for dynamic data

export default async function AdminSupportPage() {
  const messages = await prisma.message.findMany({
    include: {
      user: {
        select: { username: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-6">Customer Messages</h1>
        <p className="text-zinc-400 mb-8">
          View messages submitted by users on the Customer Support page.
        </p>

        <div className="space-y-6">
          {messages.length === 0 ? (
            <div className="text-center p-12 bg-zinc-900 border border-zinc-800 rounded-xl">
              <p className="text-zinc-500">No support messages found.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">User: {message.user.username}</h3>
                    <div className="text-sm text-zinc-400 mt-1">
                      Received: {new Date(message.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-800 rounded-lg p-4 mb-4">
                  <p className="text-zinc-300 whitespace-pre-wrap">{message.content}</p>
                </div>

                {message.reply ? (
                  <div className="mt-4 p-4 border-l-4 border-green-500 bg-green-500/10 rounded-r-lg">
                    <div className="text-xs text-green-500 font-bold uppercase tracking-wider mb-2">Replied</div>
                    <p className="text-zinc-300 whitespace-pre-wrap">{message.reply}</p>
                  </div>
                ) : (
                  <form action={replyToMessage} className="mt-4 space-y-3">
                    <input type="hidden" name="messageId" value={message.id} />
                    <textarea
                      name="reply"
                      required
                      placeholder="Type your reply here..."
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-blue-500 min-h-[100px]"
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition">
                      Send Reply
                    </button>
                  </form>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
