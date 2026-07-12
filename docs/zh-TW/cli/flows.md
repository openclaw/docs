---
read_when:
    - 您會在較舊的文件或版本說明中看到 `openclaw flows`
    - 你想要一份快速檢查 TaskFlow 的參考指南
summary: 重新導向：流程命令位於 `openclaw tasks flow` 下方
title: 流程（重新導向）
x-i18n:
    generated_at: "2026-07-11T21:11:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

沒有頂層的 `openclaw flows` 命令。持久化 TaskFlow 的檢查功能位於 `openclaw tasks flow` 下。

## 子命令

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| 子命令   | 說明                    | 引數／選項                                                                                  |
| -------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| `list`   | 列出追蹤中的 TaskFlow。 | `--json` 輸出機器可讀格式；`--status <name>` 篩選條件（請參閱下方的狀態值）。                |
| `show`   | 顯示一個 TaskFlow。     | `<lookup>` 流程 ID 或擁有者索引鍵；`--json` 輸出機器可讀格式。                               |
| `cancel` | 取消執行中的 TaskFlow。 | `<lookup>` 流程 ID 或擁有者索引鍵。                                                         |

`<lookup>` 可接受流程 ID（由 `list`／`show` 傳回）或流程的擁有者索引鍵（擁有該流程的子系統用來追蹤流程的穩定識別碼）。

### 狀態篩選值

`list` 的 `--status` 接受下列其中一個值：`queued`、`running`、`waiting`、`blocked`、`succeeded`、`failed`、`cancelled`、`lost`。

## 範例

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

如需瞭解 TaskFlow 概念與編寫方式，請參閱 [TaskFlow](/zh-TW/automation/taskflow)。如需父層 `tasks` 命令的資訊，請參閱 [tasks 命令列介面參考](/zh-TW/cli/tasks)。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [自動化](/zh-TW/automation)
- [TaskFlow](/zh-TW/automation/taskflow)
