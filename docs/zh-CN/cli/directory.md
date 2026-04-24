---
read_when:
    - 你想为某个渠道查找联系人 / 群组 / 自身 ID
    - 你正在开发一个渠道目录适配器
summary: '`openclaw directory` 的 CLI 参考（自己、对等方、群组）'
title: 目录
x-i18n:
    generated_at: "2026-04-24T04:00:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

适用于支持该功能的渠道的目录查询（联系人 / 对等方、群组以及“我自己”）。

## 常用标志

- `--channel <name>`：渠道 id / 别名（当配置了多个渠道时必填；如果只配置了一个渠道则会自动选择）
- `--account <id>`：账户 id（默认：渠道默认账户）
- `--json`：输出 JSON

## 说明

- `directory` 用于帮助你查找可粘贴到其他命令中的 ID（尤其是 `openclaw message send --target ...`）。
- 对于许多渠道，结果基于配置提供（允许列表 / 已配置的群组），而不是来自提供商的实时目录。
- 默认输出为以制表符分隔的 `id`（有时还包括 `name`）；如需脚本化处理，请使用 `--json`。

## 将结果用于 `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 格式（按渠道）

- WhatsApp：`+15551234567`（私信），`1234567890-1234567890@g.us`（群组）
- Telegram：`@username` 或数字 chat id；群组使用数字 id
- Slack：`user:U…` 和 `channel:C…`
- Discord：`user:<id>` 和 `channel:<id>`
- Matrix（插件）：`user:@user:server`、`room:!roomId:server` 或 `#alias:server`
- Microsoft Teams（插件）：`user:<id>` 和 `conversation:<id>`
- Zalo（插件）：用户 id（Bot API）
- Zalo Personal / `zalouser`（插件）：来自 `zca` 的 thread id（私信 / 群组）（`me`、`friend list`、`group list`）

## 自己（“me”）

```bash
openclaw directory self --channel zalouser
```

## 对等方（联系人 / 用户）

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

## 相关内容

- [CLI 参考](/zh-CN/cli)
