// components/SignIn.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface SignInProps {
  onLogin: (accessToken: string) => void;
}

const KeyCloak_HostAddress = "http://localhost:8080";
const realm = "myrealm";
const clientId = "myclient";

const SignIn: React.FC<SignInProps> = ({ onLogin }) => {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleLogin = async () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      toast({ title: "Error", description: "Please enter username and password." });
      return;
    }
    try {
      const response = await fetch(
        `${KeyCloak_HostAddress}/realms/${realm}/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "password",
            client_id: clientId,
            username: loginUsername,
            password: loginPassword,
          }).toString(),
        }
      );

      if (!response.ok) {
        console.error("Login failed:", response.status);
        toast({ title: "Error", description: `Login failed: ${response.statusText}` });
        return;
      }

      const data = await response.json();
      onLogin(data.access_token);
      console.log("Logged in successfully from SignIn");
    } catch (error) {
      console.error("Error during login:", error);
      toast({ title: "Error", description: `Error during login: ${error}` });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-8 min-h-0 max-w-md w-full p-6">
        <header className="flex flex-col items-center gap-4">
          <h1 className="text-3xl font-bold">EmojiGram</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </header>
        <div className="space-y-4 w-full">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button className="w-full" onClick={handleLogin}>
            Log In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;