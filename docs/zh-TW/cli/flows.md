---
read_when:
    - 你可能會在較舊的文件或版本說明中遇到 `openclaw flows`
    - 你想要一份快速的 TaskFlow 檢查參考
summary: 'Redirect: flow 命令位於 `openclaw tasks flow`'
title: 流程（重新導向）
x-i18n:
    generated_at: "2026-07-05T11:09:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

沒有頂層的 `openclaw flows` 命令。持久 TaskFlow 檢查位於 `openclaw tasks flow` 之下。

## 子命令

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| 子命令     | 說明                       | 引數 / 選項                                                                           |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | 列出追蹤中的 TaskFlow。    | `--json` 機器可讀輸出；`--status <name>` 篩選器（請參閱下方狀態值）。                 |
| `show`     | 顯示一個 TaskFlow。        | `<lookup>` 流程 ID 或擁有者鍵；`--json` 機器可讀輸出。                                |
| `cancel`   | 取消執行中的 TaskFlow。    | `<lookup>` 流程 ID 或擁有者鍵。                                                       |

`<lookup>` 接受流程 ID（由 `list` / `show` 傳回）或流程的擁有者鍵（擁有該流程的子系統用來追蹤流程的穩定識別碼）。

### 狀態篩選值

`list` 上的 `--status` 接受以下其中之一：`queued`、`running`、`waiting`、`blocked`、`succeeded`、`failed`、`cancelled`、`lost`。

## 範例

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

如需 TaskFlow 概念與撰寫方式，請參閱 [TaskFlow](/zh-TW/automation/taskflow)。如需父層 `tasks` 命令，請參閱 [tasks 命令列介面參考](/zh-TW/cli/tasks)。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [自動化](/zh-TW/automation)
- [TaskFlow](/zh-TW/automation/taskflow)
