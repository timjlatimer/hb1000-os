# The Vault — shared decision data (Phase 2 · Slice 0)

"If it is not in the vault, it does not exist."

Every file here is one decision store from the HB1000 OS app — the JSON
behind one `hb1000-*` localStorage key (approvals, PTK entries, nursery
scores, Twin North Star Gate verdicts, …). Files are written **only** from
[`vault.html`](../../vault.html), one git commit per human approval, so this
folder's commit history is the audit trail.

Rules:

- **Human-approved writes only.** Nothing in the app auto-commits here.
- **localStorage = offline cache; this folder = source of truth.**
- **Tokens never land here.** The GitHub token used to commit stays in the
  approving user's browser (`hb1000-vault-token` is excluded from sync).
- Edit files here by hand only if you know what you're doing — the app will
  treat the vault copy as canonical on restore.
