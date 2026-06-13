"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function SupportForm() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("sending");
    const toastId = toast.loading("Sending message...");

    try {
      const res = await fetch("/api/support/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message })
      });

      if (res.ok) {
        setStatus("success");
        setMessage("");
        toast.success("Message sent successfully!", { id: toastId });
        router.refresh();
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
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl"
    >
      <p className="text-zinc-400 mb-6 text-sm">
        Have an issue with a bet or a question about your account? Send a message to our admin team and we will get back to you.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Your Message
          </label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
            placeholder="Describe your issue..."
          />
        </div>

        <button
          type="submit"
          disabled={status === "sending" || !message.trim()}
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold py-3 rounded-lg transition-colors"
        >
          {status === "sending" ? "Sending..." : "Send Message"}
        </button>
      </form>
    </motion.div>
  );
}
