---
read_when:
    - 你希望从终端读取已存储的转录摘要
    - 你需要提供转录内容的 Markdown 摘要路径
    - 你正在调试核心对话记录的存储布局
summary: '`openclaw transcripts` 的 CLI 参考（列出、显示和定位已存储的会话记录）'
title: 会话记录 CLI
x-i18n:
    generated_at: "2026-07-11T20:26:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

用于检查由 `transcripts` 智能体工具写入的转录记录，只提供只读功能。
采集、导入和摘要均通过该工具运行，而不是此 CLI。

产物位于状态目录下：

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

默认状态目录为 `~/.openclaw`；可使用 `OPENCLAW_STATE_DIR` 覆盖。
日期目录取自会话开始时间；会话目录是根据会话 ID 生成的文件系统安全 slug。

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

| 命令                          | 说明                                         |
| ----------------------------- | -------------------------------------------- |
| `list`                        | 列出已存储的会话。                           |
| `show <session>`              | 输出已存储的 `summary.md`。                  |
| `path <session>`              | 输出 `summary.md` 的路径。                   |
| `path <session> --dir`        | 输出会话目录。                               |
| `path <session> --metadata`   | 输出 `metadata.json`。                       |
| `path <session> --transcript` | 输出 `transcript.jsonl`。                    |
| `--json`                      | 输出机器可读的结果（适用于任何子命令）。     |

`<session>` 接受单独的会话 ID 或包含日期的选择器
（`YYYY-MM-DD/<session>`）。当相同的会话 ID 出现在多个日期时，请使用包含日期的形式，例如 `openclaw transcripts show
2026-05-22/standup`。默认会话 ID 包含时间戳和随机后缀；仅当固定 ID 在当天唯一时，才为会话指定固定 ID。

## 输出

`list` 为每个会话输出一行制表符分隔的数据：选择器、开始时间、标题、摘要路径。

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  每周站会  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

将选择器传回 `show` 或 `path` 是最安全的做法。

`list --json` 返回包含 `sessionId`、`selector`、`date`、`title`、
`startedAt`、`stoppedAt`、`source`、`path`、`summaryPath`、`hasSummary` 的对象。

`show --json` 返回已存储的会话元数据、选择器、会话目录、摘要路径和摘要 Markdown 文本。

`path --json` 返回所选路径以及该文件是否存在。

## 每天多个会话

会话先按日期分组，再按会话 ID 分组。一天内的十场会议会生成十个同级文件夹：

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

自动化场景请使用默认生成的 ID。仅当同一日期内不会重复时，才使用 `standup` 这类固定 ID。

## 缺少摘要

实时会话在停止时写入 `summary.md`；导入的转录记录会在导入后立即写入该文件。如果采集仍在进行、提供商在停止期间失败，或元数据在任何话语到达前已写入，会话可能会出现在 `list` 中但没有摘要。

使用 `path <session> --transcript` 检查原始的仅追加转录记录，或运行 `transcripts` 工具的 `summarize` 操作以重新生成 Markdown 摘要。

## 配置

采集需要选择启用（实时来源可以加入并录制会议音频）。使用以下配置启用：

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled`（默认值为 `false`）：启用该工具。
- `maxUtterances`（默认值为 `2000`，限制在 1-10000 之间）：每个会话的话语缓冲区大小。

使用 `transcripts.autoStart` 配置自动启动来源。每个条目只要存在即表示启用；省略条目即可禁用对应来源。`discord-voice` 是内置的支持自动启动的来源，需要 `guildId` 和 `channelId`：

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
