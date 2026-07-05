---
read_when:
    - 你想从终端读取已存储的转录摘要
    - 你需要 transcripts Markdown 摘要的路径
    - 你正在调试核心转录存储布局
summary: '`openclaw transcripts` 的 CLI 参考（列出、显示和定位已存储的转录记录）'
title: 文字记录 CLI
x-i18n:
    generated_at: "2026-07-05T11:10:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

用于检查由 `transcripts` 智能体工具写入的转录记录的只读检查器。
捕获、导入和摘要生成通过该工具运行，而不是通过此 CLI。

工件位于状态目录下：

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

默认状态目录是 `~/.openclaw`；可用 `OPENCLAW_STATE_DIR` 覆盖。
日期目录来自会话开始时间；会话目录是从会话 ID 派生的文件系统安全 slug。

## 命令

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

| 命令                          | 说明                                            |
| ----------------------------- | ----------------------------------------------- |
| `list`                        | 列出已存储的会话。                              |
| `show <session>`              | 打印已存储的 `summary.md`。                     |
| `path <session>`              | 打印 `summary.md` 路径。                        |
| `path <session> --dir`        | 打印会话目录。                                  |
| `path <session> --metadata`   | 打印 `metadata.json`。                          |
| `path <session> --transcript` | 打印 `transcript.jsonl`。                       |
| `--json`                      | 打印机器可读输出（任意子命令）。                |

`<session>` 接受裸会话 ID 或带日期限定的选择器
（`YYYY-MM-DD/<session>`）。当同一个会话 ID 在多天出现时，请使用限定形式，例如 `openclaw transcripts show
2026-05-22/standup`。默认会话 ID 包含时间戳和随机后缀；只有在该 ID 在当天唯一时，才给会话指定固定 ID。

## 输出

`list` 每个会话打印一行制表符分隔的内容：选择器、开始时间、标题、摘要路径。

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

选择器是传回给 `show` 或 `path` 的最安全值。

`list --json` 返回包含 `sessionId`、`selector`、`date`、`title`、
`startedAt`、`stoppedAt`、`source`、`path`、`summaryPath`、`hasSummary` 的对象。

`show --json` 返回已存储的会话元数据、选择器、会话目录、摘要路径和摘要 Markdown 文本。

`path --json` 返回所选路径以及该文件是否存在。

## 每天多个会话

会话先按日期分组，再按会话 ID 分组。一天中的十场会议会成为十个同级文件夹：

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

自动化场景请使用默认生成的 ID。只有当固定 ID（如 `standup`）不会在同一日期重复时才使用它。

## 缺少摘要

实时会话在会话停止时写入 `summary.md`；导入的转录记录会在导入后立即写入它。捕获仍处于活动状态、提供商在停止期间失败，或在任何话语到达前就写入了元数据时，会话可能会出现在 `list` 中但没有摘要。

使用 `path <session> --transcript` 检查原始的仅追加转录记录，或运行 `transcripts` 工具的 `summarize` 操作来重新生成 Markdown 摘要。

## 配置

捕获是选择加入的（实时来源可以加入并录制会议音频）。通过以下方式启用：

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled`（默认 `false`）：启用该工具。
- `maxUtterances`（默认 `2000`，限制在 1-10000）：每个会话的话语缓冲区大小。

使用 `transcripts.autoStart` 配置自动启动来源。每个条目只要存在即为启用；省略某个条目即可禁用该来源。`discord-voice`
是内置的支持自动启动的来源，并且需要 `guildId` 和 `channelId`：

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
