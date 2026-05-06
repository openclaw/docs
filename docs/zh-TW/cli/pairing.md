---
read_when:
    - 您正在使用配對模式私訊，且需要核准傳送者
summary: '`openclaw pairing` 的 CLI 參考（核准/列出配對請求）'
title: 配對
x-i18n:
    generated_at: "2026-05-06T17:54:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

核准或檢查 DM 配對要求（適用於支援配對的通道）。

相關：

- 配對流程：[配對](/zh-TW/channels/pairing)

## 指令

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

列出某個通道的待處理配對要求。

選項：

- `[channel]`：位置式通道 ID
- `--channel <channel>`：明確指定通道 ID
- `--account <accountId>`：多帳戶通道的帳戶 ID
- `--json`：機器可讀輸出

注意事項：

- 如果已設定多個支援配對的通道，你必須以位置參數或 `--channel` 提供通道。
- 只要通道 ID 有效，就允許使用擴充通道。

## `pairing approve`

核准待處理的配對代碼，並允許該傳送者。

用法：

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- 當只設定了一個支援配對的通道時，可使用 `openclaw pairing approve <code>`

選項：

- `--channel <channel>`：明確指定通道 ID
- `--account <accountId>`：多帳戶通道的帳戶 ID
- `--notify`：在同一通道向要求者傳送確認

擁有者啟動設定：

- 如果你核准配對代碼時 `commands.ownerAllowFrom` 為空，OpenClaw 也會使用通道範圍項目（例如 `telegram:123456789`）將已核准的傳送者記錄為指令擁有者。
- 這只會啟動設定第一個擁有者。之後的配對核准不會取代或擴充 `commands.ownerAllowFrom`。
- 指令擁有者是被允許執行僅限擁有者指令，以及核准危險動作（例如 `/diagnostics`、`/export-trajectory`、`/config` 和 exec 核准）的人類操作員帳戶。

## 注意事項

- 通道輸入：以位置參數傳入（`pairing list telegram`），或使用 `--channel <channel>`。
- `pairing list` 支援 `--account <accountId>`，適用於多帳戶通道。
- `pairing approve` 支援 `--account <accountId>` 和 `--notify`。
- 如果只設定了一個支援配對的通道，則允許使用 `pairing approve <code>`。
- 如果你在此啟動設定存在之前就已核准某個傳送者，請執行 `openclaw doctor`；它會在未設定指令擁有者時發出警告，並顯示用於修正的 `openclaw config set commands.ownerAllowFrom ...` 指令。

## 相關

- [CLI 參考](/zh-TW/cli)
- [通道配對](/zh-TW/channels/pairing)
