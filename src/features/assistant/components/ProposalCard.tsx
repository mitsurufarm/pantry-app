import { useState } from "react";
import { ConfirmDialog } from "../../../shared/components";

interface ProposalCardProps {
  proposal: {
    proposal_id: string;
    ai_response: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
  onRevise: (revision: string) => void;
  isActionPending: boolean;
  isAskPending: boolean;
}

export function ProposalCard({
  proposal,
  onConfirm,
  onCancel,
  onRevise,
  isActionPending,
  isAskPending,
}: ProposalCardProps) {
  const [revision, setRevision] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleConfirmClick = () => {
    setConfirmDialog({
      isOpen: true,
      title: "提案の反映",
      message: "この提案を在庫に反映しますか？",
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        onConfirm();
      },
    });
  };

  const handleCancelClick = () => {
    setConfirmDialog({
      isOpen: true,
      title: "提案の取り消し",
      message: "この提案を取り消しますか？",
      isDanger: true,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        onCancel();
      },
    });
  };

  const handleReviseClick = () => {
    if (!revision.trim() || isAskPending) return;
    onRevise(revision);
    setRevision("");
  };

  return (
    <article className="card proposal">
      <h2>変更案</h2>
      <p>{proposal.ai_response}</p>
      <div className="button-row">
        <button disabled={isActionPending} onClick={handleConfirmClick}>
          反映する
        </button>
        <button
          className="secondary"
          disabled={isActionPending}
          onClick={handleCancelClick}
        >
          取り消す
        </button>
      </div>
      <label>
        再提案の追加指示
        <textarea
          maxLength={1000}
          value={revision}
          onChange={(event) => setRevision(event.target.value)}
          placeholder="例：小分けは3つにして"
        />
      </label>
      <button
        disabled={!revision.trim() || isAskPending}
        onClick={handleReviseClick}
      >
        再提案
      </button>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDanger={confirmDialog.isDanger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </article>
  );
}
