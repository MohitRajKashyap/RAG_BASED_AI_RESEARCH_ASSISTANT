import api from "./api";
import type { TokenResponse, User } from "@/types";

export async function register(email: string, fullName: string, password: string): Promise<User> {
  const { data } = await api.post("/auth/register", {
    email,
    full_name: fullName,
    password,
  });
  return data;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get("/auth/me");
  return data;
}
