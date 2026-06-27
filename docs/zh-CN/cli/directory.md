---
read_when:
    - 你想查找某个渠道的联系人/群组/自身 ID
    - 你正在开发一个渠道目录适配器
summary: '`openclaw directory` 的 CLI 参考（自身、对等方、群组）'
title: 目录
x-i18n:
    generated_at: "2026-05-06T16:00:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 855f9312790134f2d1da53ffbb106167c190155510a7bdef212b5d38c2fba0b3
    source_path: cli/directory.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw directory`

用于支持目录查找的渠道（联系人/对等方、群组和 `"me"`）的目录查找。

## 常用标志

- `--channel <name>`：渠道 ID/别名（配置了多个渠道时必需；仅配置一个渠道时自动使用）
- `--account <id>`：账户 ID（默认：渠道默认值）
- `--json`：输出 JSON

## 说明

- `directory` 旨在帮助你找到可粘贴到其他命令中的 ID（尤其是 `openclaw message send --target ...`）。
- 对许多渠道来说，结果由配置支持（允许列表/已配置群组），而不是来自实时提供商目录。
- 已安装的渠道插件仍可省略目录支持；在这种情况下，命令会报告不支持的目录操作，而不是重新安装插件。
- 默认输出为 `id`（有时还有 `name`），用制表符分隔；脚本使用请加 `--json`。

## 将结果用于 `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 格式（按渠道）

- WhatsApp：`+15551234567`（私信）、`1234567890-1234567890@g.us`（群组）、`120363123456789@newsletter`（频道/Newsletter 出站目标）
- Telegram：`@username` 或数字聊天 ID；群组是数字 ID
- Slack：`user:U…` 和 `channel:C…`
- Discord：`user:<id>` 和 `channel:<id>`
- Matrix（插件）：`user:@user:server`、`room:!roomId:server` 或 `#alias:server`
- Microsoft Teams（插件）：`user:<id>` 和 `conversation:<id>`
- Zalo（插件）：用户 ID（Bot API）
- Zalo Personal / `zalouser`（插件）：来自 `zca`（`me`、`friend list`、`group list`）的线程 ID（私信/群组）

## 自己（"me"）

```bash
openclaw directory self --channel zalouser
```

## 对等方（联系人/用户）

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## 群组

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## 相关

- [CLI 参考](/zh-CN/cli)
