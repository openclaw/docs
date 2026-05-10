---
read_when:
    - 你會在較舊的文件或發行說明中遇到 `openclaw flows`
    - 你需要一份 TaskFlow 快速檢查參考
summary: 重新導向：flow 命令位於 `openclaw tasks flow` 下
title: 流程（重新導向）
x-i18n:
    generated_at: "2026-05-10T19:28:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

沒有頂層的 `openclaw flows` 命令。持久化 TaskFlow 檢視位於 `openclaw tasks flow` 之下。

## 子命令

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| 子命令 | 說明                | 引數 / 選項                                                                   |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | 列出追蹤的 TaskFlow。    | `--json` 機器可讀輸出；`--status <name>` 篩選器（請參閱下方狀態值）。 |
| `show`     | 顯示一個 TaskFlow。         | `<lookup>` 流程 ID 或擁有者鍵；`--json` 機器可讀輸出。                    |
| `cancel`   | 取消執行中的 TaskFlow。 | `<lookup>` 流程 ID 或擁有者鍵。                                                      |

`<lookup>` 接受流程 ID（由 `list` / `show` 傳回）或流程的擁有者鍵（擁有該流程的子系統用來追蹤流程的穩定識別碼）。

### 狀態篩選值

`list` 上的 `--status` 接受以下其中之一：

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## 範例

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

如需完整的 TaskFlow 概念與撰寫方式，請參閱 [TaskFlow](/zh-TW/automation/taskflow)。如需父層 `tasks` 命令，請參閱 [tasks CLI 參考](/zh-TW/cli/tasks)。

## 相關

- [CLI 參考](/zh-TW/cli)
- [自動化](/zh-TW/automation)
- [TaskFlow](/zh-TW/automation/taskflow)
