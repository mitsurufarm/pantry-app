import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../shared/api";
import { operationKey } from "../../shared/utils/operationKey";
import { ErrorMessage, Loading } from "../../shared/components";
import { ProposalCard } from "./components/ProposalCard";

interface AssistantPageProps {
  onNotice: (message: string) => void;
}

export function AssistantPage({ onNotice }: AssistantPageProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [proposal, setProposal] = useState<{
    proposal_id: string;
    ai_response: string;
  } | null>(null);

  const ask = useMutation({
    mutationFn: ({
      text,
      previous,
      key,
    }: {
      text: string;
      previous?: string;
      key: string;
    }) =>
      api.proposeStockChange(
        { message: text, previous_proposal_id: previous },
        key,
      ),
    onSuccess: (result) => {
      setProposal(result);
      setMessage("");
    },
  });

  const action = useMutation({
    mutationFn: ({
      choice,
      key,
    }: {
      choice: "confirm" | "cancel";
      key: string;
    }) => api.proposalAction(proposal!.proposal_id, choice, key),
    onSuccess: async (result) => {
      setProposal(null);
      if (result.status === "applied") {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["stocks"] }),
          queryClient.invalidateQueries({ queryKey: ["menu"] }),
        ]);
        onNotice("提案を在庫に反映しました。");
      } else {
        onNotice("提案を取り消しました。");
      }
    },
  });

  return (
    <section>
      <p className="eyebrow">在庫の小分け・作り置き・消費を相談</p>
      <h1>AIアシスタント</h1>
      <p className="privacy-note">
        依頼内容と必要な在庫情報は提案生成のため外部AIサービスへ送信されます。会話履歴は保存されません。
      </p>

      {!proposal ? (
        <div className="form">
          <label>
            依頼内容
            <textarea
              maxLength={1000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="例：豚バラ肉を100gずつに小分けして冷凍したい"
            />
          </label>
          <button
            disabled={!message.trim() || ask.isPending}
            onClick={() => ask.mutate({ text: message, key: operationKey() })}
          >
            提案を作成
          </button>
        </div>
      ) : (
        <ProposalCard
          proposal={proposal}
          onConfirm={() =>
            action.mutate({ choice: "confirm", key: operationKey() })
          }
          onCancel={() =>
            action.mutate({ choice: "cancel", key: operationKey() })
          }
          onRevise={(revision) =>
            ask.mutate({
              text: revision,
              previous: proposal.proposal_id,
              key: operationKey(),
            })
          }
          isActionPending={action.isPending}
          isAskPending={ask.isPending}
        />
      )}

      <ErrorMessage error={ask.error || action.error} />
      {(ask.isPending || action.isPending) && (
        <Loading label="AIに問い合わせています…" />
      )}
    </section>
  );
}
