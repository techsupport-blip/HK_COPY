import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { UpdateProfileRequest } from "@hearth/shared";
import { useApiClient } from "./context.js";

export const queryKeys = {
  me: ["me"] as const,
  interview: ["interview"] as const,
  matches: ["matches"] as const,
  match: (id: string) => ["match", id] as const,
  activities: (id: string) => ["activities", id] as const,
  conversations: ["conversations"] as const,
  messages: (id: string) => ["messages", id] as const,
};

export function useMe() {
  const client = useApiClient();
  return useQuery({ queryKey: queryKeys.me, queryFn: () => client.me() });
}

export function useUpdateProfile() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => client.updateProfile(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.me }),
  });
}

export function useInterviewState() {
  const client = useApiClient();
  return useQuery({
    queryKey: queryKeys.interview,
    queryFn: () => client.interviewState(),
  });
}

export function useStartInterview() {
  const client = useApiClient();
  return useMutation({ mutationFn: () => client.startInterview() });
}

export function useSubmitTurn() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => client.submitInterviewTurn(content),
    onSuccess: (res) => {
      if (res.done) {
        qc.invalidateQueries({ queryKey: queryKeys.me });
        qc.invalidateQueries({ queryKey: queryKeys.interview });
      }
    },
  });
}

export function useMatches() {
  const client = useApiClient();
  return useQuery({ queryKey: queryKeys.matches, queryFn: () => client.matches() });
}

export function useMatch(id: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: queryKeys.match(id),
    queryFn: () => client.match(id),
    enabled: !!id,
  });
}

export function useGenerateMatches() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => client.generateMatches(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.matches }),
  });
}

export function useActivities(matchId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: queryKeys.activities(matchId),
    queryFn: () => client.activities(matchId),
    enabled: !!matchId,
  });
}

export function useDecideMatch(matchId: string) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (decision: "like" | "pass") =>
      decision === "like" ? client.likeMatch(matchId) : client.passMatch(matchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.matches });
      qc.invalidateQueries({ queryKey: queryKeys.match(matchId) });
      qc.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

export function useConversations() {
  const client = useApiClient();
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: () => client.conversations(),
  });
}

/** Polls for new messages so chat feels live without websockets. */
export function useMessages(conversationId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: () => client.messages(conversationId),
    enabled: !!conversationId,
    refetchInterval: 4000,
  });
}

export function useSendMessage(conversationId: string) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => client.sendMessage(conversationId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
      qc.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

export function useWingman(conversationId: string) {
  const client = useApiClient();
  const openers = useMutation({
    mutationFn: () => client.wingmanOpeners(conversationId),
  });
  const assist = useMutation({
    mutationFn: () => client.wingmanAssist(conversationId),
  });
  return { openers, assist };
}
