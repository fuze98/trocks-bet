"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-zinc-900 p-8 shadow-2xl ring-1 ring-zinc-800">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">🚜</div>
          <h2 className="text-3xl font-black tracking-tight text-white">
            Trocks<span className="text-green-500">Bet</span>
          </h2>
          <p className="text-sm text-zinc-400">
            Sign in or create an account to start betting.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="sr-only" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                className="block w-full rounded-md border-0 bg-zinc-800/50 py-3 px-4 text-white placeholder-zinc-500 ring-1 ring-inset ring-zinc-700 focus:bg-zinc-800 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm sm:leading-6"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="sr-only" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="block w-full rounded-md border-0 bg-zinc-800/50 py-3 px-4 text-white placeholder-zinc-500 ring-1 ring-inset ring-zinc-700 focus:bg-zinc-800 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm sm:leading-6"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-500 text-center">{error}</div>}

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-green-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              Sign In / Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
