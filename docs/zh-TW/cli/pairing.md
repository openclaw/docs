---
read_when:
    - 你正在使用配對模式的私訊，且需要核准傳送者
summary: '`openclaw pairing` 的命令列介面參考（核准／列出配對請求）'
title: 配對
x-i18n:
    generated_at: "2026-07-22T13:19:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e4c6c53f1a3eefe50b4b7a45fa535e9a05faabb50df1ba5195a7635ee13d9da0
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

核准或檢查支援配對之頻道的私訊配對請求（僅限聊天私訊——節點／裝置配對使用 `openclaw devices`）。

相關：[配對流程](/zh-TW/channels/pairing)

相同的待處理請求可在控制介面的 **Settings →
Channels → DM access requests** 下檢視。控制介面支援核准、選擇性通知
請求者，以及略過。略過會移除目前的請求，但不會
永久封鎖傳送者。

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

列出一個頻道的待處理配對請求。

| 選項                  | 說明                           |
| ----------------------- | ------------------------------------- |
| `[channel]`             | 位置式頻道 ID                 |
| `--channel <channel>`   | 明確指定頻道 ID                   |
| `--account <accountId>` | 多帳號頻道的帳號 ID |
| `--json`                | 機器可讀輸出               |

如果設定了多個支援配對的頻道，請以位置引數或 `--channel` 傳入頻道。只要頻道 ID 有效，擴充頻道也可運作。

## `pairing approve`

核准待處理的配對碼，並允許該傳送者。

用法：

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`（僅設定一個支援配對的頻道時）

選項：`--channel <channel>`、`--account <accountId>`、`--notify`（透過相同頻道將確認訊息傳回請求者）。

### 擁有者初始設定

如果核准配對碼時 `commands.ownerAllowFrom` 為空，命令列介面也會將已核准的傳送者記錄為命令擁有者，使用 `telegram:123456789` 之類的頻道範圍項目。這只會初始設定第一位擁有者——後續配對核准絕不會取代或擴充 `commands.ownerAllowFrom`。控制介面會將此權限提升顯示為另一個受 `operator.admin` 保護的核取方塊，而不會自動套用。

命令擁有者是獲准執行僅限擁有者的命令，以及核准 `/diagnostics`、`/export-session`、`/export-trajectory`、`/config` 和 exec 核准等危險動作的人類操作員帳號。配對僅允許傳送者與代理程式交談；除這次性初始設定外，配對本身不會授予擁有者權限。

如果你在此初始設定機制推出前就已核准傳送者，請執行 `openclaw doctor`；未設定命令擁有者時，它會發出警告，並顯示用於修正問題的確切 `openclaw config set commands.ownerAllowFrom ...` 命令。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [頻道配對](/zh-TW/channels/pairing)
