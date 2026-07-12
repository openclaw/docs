---
read_when:
    - 你正在使用配對模式的私訊，且需要核准傳送者
summary: '`openclaw pairing` 的命令列介面參考（核准／列出配對請求）'
title: 配對
x-i18n:
    generated_at: "2026-07-11T21:12:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

核准或檢查支援配對之頻道的私訊配對請求（僅限聊天私訊；節點／裝置配對請使用 `openclaw devices`）。

相關：[配對流程](/zh-TW/channels/pairing)

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

列出某個頻道待處理的配對請求。

| 選項                    | 說明                   |
| ----------------------- | ---------------------- |
| `[channel]`             | 位置參數形式的頻道 ID  |
| `--channel <channel>`   | 明確指定頻道 ID        |
| `--account <accountId>` | 多帳號頻道的帳號 ID    |
| `--json`                | 機器可讀輸出           |

如果設定了多個支援配對的頻道，請以位置參數或 `--channel` 傳入頻道。只要頻道 ID 有效，擴充頻道也可使用。

## `pairing approve`

核准待處理的配對碼，並允許該傳送者。

用法：

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- 僅設定一個支援配對的頻道時，可使用 `openclaw pairing approve <code>`

選項：`--channel <channel>`、`--account <accountId>`、`--notify`（透過同一頻道向請求者傳送確認訊息）。

### 擁有者初始設定

如果核准配對碼時 `commands.ownerAllowFrom` 為空，OpenClaw 也會將獲准的傳送者記錄為命令擁有者，並使用頻道範圍的項目，例如 `telegram:123456789`。這只會初始設定第一位擁有者；之後核准配對時，絕不會取代或擴充 `commands.ownerAllowFrom`。

命令擁有者是獲准執行僅限擁有者之命令，以及核准危險操作（例如 `/diagnostics`、`/export-trajectory`、`/config` 和執行核准）的人類操作員帳號。配對只允許傳送者與代理程式交談；除了這次的一次性初始設定外，配對本身不會授予擁有者權限。

如果您在這項初始設定機制推出前已核准某位傳送者，請執行 `openclaw doctor`；當未設定命令擁有者時，它會發出警告，並顯示用於修正問題的確切 `openclaw config set commands.ownerAllowFrom ...` 命令。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [頻道配對](/zh-TW/channels/pairing)
