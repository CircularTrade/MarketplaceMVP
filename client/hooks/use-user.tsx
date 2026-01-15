import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useUser() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/user"],
    retry: false,
  });

  return {
    user: user || null,
    isLoading,
    error,
  };
}
