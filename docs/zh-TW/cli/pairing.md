---
read_when:
    - 你正在使用配對模式私訊，且需要核准寄件者
summary: '`openclaw pairing` 的命令列介面參考（核准/列出配對請求）'
title: 配對
x-i18n:
    generated_at: "2026-07-05T11:10:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

核准或檢查支援配對之通道的 DM 配對請求（僅限聊天 DM - 節點/裝置配對使用 `openclaw devices`）。

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

列出一個通道的待處理配對請求。

| 選項                    | 說明                               |
| ----------------------- | ---------------------------------- |
| `[channel]`             | 位置式通道 ID                      |
| `--channel <channel>`   | 明確指定通道 ID                    |
| `--account <accountId>` | 多帳號通道的帳號 ID                |
| `--json`                | 機器可讀輸出                       |

如果設定了多個具備配對功能的通道，請以位置參數或 `--channel` 傳入通道。只要通道 ID 有效，擴充通道也可使用。

## `pairing approve`

核准待處理的配對代碼並允許該傳送者。

用法：

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`，當只設定了一個具備配對功能的通道時

選項：`--channel <channel>`、`--account <accountId>`、`--notify`（在同一通道向請求者傳送確認）。

### 擁有者啟動設定

如果你核准配對代碼時 `commands.ownerAllowFrom` 是空的，OpenClaw 也會將已核准的傳送者記錄為命令擁有者，使用通道範圍的項目，例如 `telegram:123456789`。這只會啟動設定第一位擁有者 - 後續的配對核准永遠不會取代或擴充 `commands.ownerAllowFrom`。

命令擁有者是允許執行僅限擁有者命令並核准危險動作的人類操作員帳號，例如 `/diagnostics`、`/export-trajectory`、`/config` 和 exec 核准。配對只讓傳送者能與代理程式對話；除了這次一次性的啟動設定外，配對本身不會授予擁有者權限。

如果你在此啟動設定存在之前已核准某位傳送者，請執行 `openclaw doctor`；當未設定命令擁有者時，它會警告，並顯示用來修正的確切 `openclaw config set commands.ownerAllowFrom ...` 命令。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [通道配對](/zh-TW/channels/pairing)
