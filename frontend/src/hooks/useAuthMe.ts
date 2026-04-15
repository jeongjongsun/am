import { useQuery } from '@tanstack/react-query';

import { fetchAuthMe } from '@/api/auth';

export function useAuthMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchAuthMe,
    retry: false,
  });
}
