---
read_when:
    - 你想从终端读取已存储的转录摘要
    - 你需要转录 Markdown 摘要的路径
    - 你正在调试核心转录记录存储布局
summary: CLI 参考：`openclaw transcripts`（列出、显示和定位已存储的转录记录）
title: 转录记录 CLI
x-i18n:
    generated_at: "2026-06-27T01:44:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae6010cfb4e051182f1c48d0d728b30d054542e1e7983ff15a2432840193f9c0
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

检查 OpenClaw 核心 `transcripts` 工具写入的转录记录。这个 CLI 是只读的；采集、导入和摘要由智能体工具以及已配置的自动启动来源负责。

当你想查找昨天的笔记、在编辑器中打开 Markdown 文件、把转录记录提供给另一个工具，或调试某个会话落盘位置时，可以使用这个 CLI。它不会启动或停止采集。

产物位于 OpenClaw 状态目录下：

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

默认状态目录是 `~/.openclaw`；设置 `OPENCLAW_STATE_DIR` 可使用其他目录。日期目录来自会话开始时间，会话目录是从会话 id 派生出的安全文件系统片段。

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

- `list`：列出已存储的会话、带日期限定的选择器、开始时间、标题和 `summary.md` 路径。
- `show <session>`：打印已存储的 `summary.md`。
- `path <session>`：打印 `summary.md` 路径。
- `path <session> --dir`：打印会话目录。
- `path <session> --metadata`：打印 `metadata.json`。
- `path <session> --transcript`：打印 `transcript.jsonl`。
- `--json`：打印机器可读输出。

当人工设置的会话 id 跨天重复时，请使用 `list` 中带日期限定的选择器，例如 `openclaw transcripts show 2026-05-22/standup`。默认会话 id 包含时间戳和随机后缀；只有在固定会话 id 在当天唯一时才配置它。

## 输出

`list` 每行打印一个会话：

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/alex/.openclaw/transcripts/2026-05-22/standup/summary.md
```

输出以制表符分隔。列依次为选择器、开始时间、标题和摘要路径。选择器是传回给 `show` 或 `path` 的最安全取值。

`list --json` 打印包含以下字段的对象：

- `sessionId`
- `selector`
- `date`
- `title`
- `startedAt`
- `stoppedAt`
- `source`
- `path`
- `summaryPath`
- `hasSummary`

`show --json` 返回已存储的会话元数据、选择器、会话目录、摘要路径和摘要 Markdown 文本。`path --json` 返回所选路径以及该文件是否存在。

## 每天多场会议

转录记录先按日期分组，再按会话 id 分组。同一天的十场会议会变成十个同级文件夹：

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

大多数自动化场景使用默认生成的 id。只有在同一个 id 不会在同一日期被使用两次时，才使用 `standup` 这样的固定 id。

## 缺少摘要

实时会话会在会话停止时写入 `summary.md`。导入的转录记录会在导入后立即写入 `summary.md`。当采集正在进行、提供商在停止期间失败，或元数据在任何发言到达之前已写入时，会话仍可能出现在 `list` 中但没有摘要。

使用 `path <session> --transcript` 检查只追加的转录记录，并使用 `transcripts` 工具动作 `summarize` 重新生成 Markdown 摘要。

## 配置

转录采集需要显式启用，因为实时来源可以加入并录制会议音频。使用顶层 `transcripts.enabled` 启用该工具：

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

在 `openclaw.json` 中使用 `transcripts.autoStart` 配置自动启动来源。每个条目只要存在即启用；省略某个条目即可禁用对应来源。

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      },
      {
        "providerId": "slack-huddle",
        "accountId": "workspace",
        "channelId": "C123"
      }
    ]
  }
}
```
