---
read_when:
    - 你想查找某个渠道的联系人/群组/自身 ID
    - 你正在开发渠道目录适配器
summary: '`openclaw directory` 的 CLI 参考（自己、联系人、群组）'
title: directory
x-i18n:
    generated_at: "2026-04-05T08:19:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a81a037e0a33f77c24b1adabbc4be16ed4d03c419873f3cbdd63f2ce84a1064
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

对支持该功能的渠道进行目录查询（联系人/对等端、群组，以及“我自己”）。

## 常用标志

- `--channel <name>`：渠道 ID/别名（当配置了多个渠道时为必填；如果只配置了一个渠道则会自动选择）
- `--account <id>`：账号 ID（默认：渠道默认账号）
- `--json`：输出 JSON

## 注意事项

- `directory` 旨在帮助你查找可粘贴到其他命令中的 ID（尤其是 `openclaw message send --target ...`）。
- 对于许多渠道，结果基于配置（允许列表/已配置群组），而不是实时提供商目录。
- 默认输出使用制表符分隔的 `id`（有时也包括 `name`）；如需脚本处理，请使用 `--json`。

## 将结果与 `message send` 一起使用

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 格式（按渠道）

- WhatsApp：`+15551234567`（私信），`1234567890-1234567890@g.us`（群组）
- Telegram：`@username` 或数字 chat ID；群组为数字 ID
- Slack：`user:U…` 和 `channel:C…`
- Discord：`user:<id>` 和 `channel:<id>`
- Matrix（插件）：`user:@user:server`、`room:!roomId:server` 或 `#alias:server`
- Microsoft Teams（插件）：`user:<id>` 和 `conversation:<id>`
- Zalo（插件）：用户 ID（Bot API）
- Zalo Personal / `zalouser`（插件）：来自 `zca` 的线程 ID（私信/群组）（`me`、`friend list`、`group list`）

## 自己（“me”）

```bash
openclaw directory self --channel zalouser
```

## 对等端（联系人/用户）

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
