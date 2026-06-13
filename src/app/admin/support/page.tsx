import { prisma } from "@/lib/prisma";
import { replyToMessage } from "../actions";

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
                  <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800">
                    <div className="text-sm font-bold text-green-500 mb-1">Admin Reply:</div>
                    <p className="text-zinc-400 whitespace-pre-wrap">{message.reply}</p>
                  </div>
                ) : (
                  <form action={replyToMessage} className="mt-4 flex gap-2">
                    <input type="hidden" name="messageId" value={message.id} />
                    <input
                      type="text"
                      name="reply"
                      placeholder="Type a reply..."
                      required
                      className="flex-1 rounded-md border-0 bg-zinc-950 py-2 px-3 text-white focus:ring-1 focus:ring-green-500"
                    />
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors"
                    >
                      Reply
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
