import { useQuery } from "@tanstack/react-query";
import { getUser } from "../services/auth.service";

export const useUserInfo = () => {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    select: (data) => data?.data,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return { user, isLoadingUser: isLoading };
};
