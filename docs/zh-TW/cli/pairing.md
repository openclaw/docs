---
read_when:
    - 你正在使用配對模式的私訊，並需要核准傳送者
summary: '`openclaw pairing` 的命令列介面參考（核准／列出配對要求）'
title: 配對
x-i18n:
    generated_at: "2026-07-16T11:30:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 740459efe4d0fa2e9fa04a20b944592fed3dc9a22211658e1418c1e49a736997
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

核准或檢視支援配對的頻道之私訊配對請求（僅限聊天私訊——節點／裝置配對使用 `openclaw devices`）。

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

列出一個頻道中待處理的配對請求。

| 選項                    | 說明                                  |
| ----------------------- | ------------------------------------- |
| `[channel]`             | 位置參數形式的頻道 ID                 |
| `--channel <channel>`   | 明確指定的頻道 ID                     |
| `--account <accountId>` | 多帳號頻道的帳號 ID                   |
| `--json`                | 機器可讀的輸出                        |

若已設定多個支援配對的頻道，請以位置參數或 `--channel` 傳入頻道。只要頻道 ID 有效，擴充頻道也可使用。

## `pairing approve`

核准待處理的配對碼，並允許該傳送者。

用法：

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`（僅設定一個支援配對的頻道時）

選項：`--channel <channel>`、`--account <accountId>`、`--notify`（在同一頻道傳送確認訊息給請求者）。

### 擁有者初始設定

核准配對碼時，若 `commands.ownerAllowFrom` 為空，OpenClaw 也會將已核准的傳送者記錄為命令擁有者，並使用頻道範圍的項目，例如 `telegram:123456789`。這只會初始設定第一位擁有者——之後核准配對絕不會取代或擴充 `commands.ownerAllowFrom`。

命令擁有者是獲准執行僅限擁有者使用之命令，並核准危險動作（例如 `/diagnostics`、`/export-session`、`/export-trajectory`、`/config` 及 exec 核准）的人工操作者帳號。配對僅允許傳送者與代理程式交談；除了這次性初始設定外，配對本身不會授予擁有者權限。

若你在此初始設定機制推出前已核准某位傳送者，請執行 `openclaw doctor`；未設定命令擁有者時，它會發出警告，並顯示用於修正問題的確切 `openclaw config set commands.ownerAllowFrom ...` 命令。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [頻道配對](/zh-TW/channels/pairing)
