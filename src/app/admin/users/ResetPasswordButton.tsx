"use client";

import { useState } from "react";
import { resetUserPassword } from "./actions";

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [tempPwd, setTempPwd] = useState("");

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset this user's password?")) {
      const pwd = await resetUserPassword(userId);
      setTempPwd(pwd);
    }
  };

  return (
    <div>
      <button
        onClick={handleReset}
        className="text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-2 py-1 rounded"
      >
        Reset Password
      </button>
      {tempPwd && (
        <div className="mt-2 text-xs text-green-400 font-mono bg-zinc-900 p-1 rounded border border-green-900">
          Temp Pwd: {tempPwd}
        </div>
      )}
    </div>
  );
}
