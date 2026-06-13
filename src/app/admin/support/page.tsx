import { prisma } from "@/lib/prisma";

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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
