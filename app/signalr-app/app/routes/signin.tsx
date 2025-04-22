// app/routes/signin.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "~/context/AuthContext";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      await login(username, password);
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-6 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">EmojiGram</h1>
          <h2 className="mt-2 text-gray-600">Sign in to your account</h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="username" className="pb-2">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <div>
            <Label htmlFor="password" className="pb-2">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <Button className="w-full" onClick={handleLogin}>
            Log In
          </Button>
        </div>
      </div>
    </div>
  );
}
