"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

type Message = {
  id: string;
  content: string;
  reply: string | null;
  createdAt: Date;
};

export function SupportClient({ initialMessages }: { initialMessages: Message[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setStatus("sending");
    const toastId = toast.loading("Sending message...");

    try {
      const res = await fetch("/api/support/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages([newMessage, ...messages]);
        setStatus("success");
        setContent("");
        toast.success("Message sent successfully!", { id: toastId });
      } else {
        setStatus("error");
        toast.error("Failed to send message.", { id: toastId });
      }
    } catch (error) {
      setStatus("error");
      toast.error("An unexpected error occurred.", { id: toastId });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-4 md:p-8 space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Customer Support</h1>
        <p className="text-zinc-400">
          Have an issue with a bet or a question about your account? Send a message to our admin team.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
              placeholder="Describe your issue..."
            />
          </div>

          <button
            type="submit"
            disabled={status === "sending" || !content.trim()}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {status === "sending" ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>

      <div className="space-y-4 mt-8">
        <h2 className="text-2xl font-bold text-white mb-4">Past Messages</h2>
        {messages.length === 0 ? (
          <p className="text-zinc-500">No previous support tickets.</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-4 bg-zinc-800/50">
                <div className="text-xs text-zinc-500 mb-2">{new Date(msg.createdAt).toLocaleString()}</div>
                <p className="text-white whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.reply && (
                <div className="p-4 border-t border-zinc-800 bg-zinc-900">
                  <div className="text-xs text-green-500 font-bold uppercase tracking-wider mb-2">Admin Reply</div>
                  <p className="text-zinc-300 whitespace-pre-wrap">{msg.reply}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
