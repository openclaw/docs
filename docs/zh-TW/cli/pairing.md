---
read_when:
    - 你正在使用配對模式私訊，且需要核准傳送者
summary: CLI 參考：`openclaw pairing`（核准/列出配對請求）
title: 配對
x-i18n:
    generated_at: "2026-04-30T02:55:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

核准或檢視 DM 配對請求（適用於支援配對的通道）。

相關：

- 配對流程：[配對](/zh-TW/channels/pairing)

## 命令

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

列出某個通道的待處理配對請求。

選項：

- `[channel]`：位置式通道 ID
- `--channel <channel>`：明確的通道 ID
- `--account <accountId>`：多帳號通道的帳號 ID
- `--json`：機器可讀輸出

注意事項：

- 如果已設定多個支援配對的通道，你必須以位置參數或 `--channel` 提供通道。
- 只要通道 ID 有效，也允許使用擴充通道。

## `pairing approve`

核准待處理的配對碼，並允許該傳送者。

用法：

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- 已設定的支援配對通道剛好只有一個時，使用 `openclaw pairing approve <code>`

選項：

- `--channel <channel>`：明確的通道 ID
- `--account <accountId>`：多帳號通道的帳號 ID
- `--notify`：在同一通道傳送確認訊息給請求者

擁有者啟動設定：

- 如果你核准配對碼時 `commands.ownerAllowFrom` 是空的，OpenClaw 也會將核准的傳送者記錄為命令擁有者，使用通道作用域項目，例如 `telegram:123456789`。
- 這只會啟動設定第一位擁有者。後續配對核准不會取代或擴充 `commands.ownerAllowFrom`。
- 命令擁有者是允許執行僅限擁有者命令，以及核准危險動作（例如 `/diagnostics`、`/export-trajectory`、`/config` 和 exec 核准）的人類操作員帳號。

## 注意事項

- 通道輸入：以位置參數傳入（`pairing list telegram`），或使用 `--channel <channel>`。
- `pairing list` 支援針對多帳號通道使用 `--account <accountId>`。
- `pairing approve` 支援 `--account <accountId>` 和 `--notify`。
- 如果已設定的支援配對通道只有一個，則允許使用 `pairing approve <code>`。
- 如果你在此啟動設定存在之前已核准某位傳送者，請執行 `openclaw doctor`；當未設定命令擁有者時，它會發出警告，並顯示用來修正的 `openclaw config set commands.ownerAllowFrom ...` 命令。

## 相關

- [CLI 參考](/zh-TW/cli)
- [通道配對](/zh-TW/channels/pairing)
