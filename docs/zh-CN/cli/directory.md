---
read_when:
    - 你想查找某个渠道的联系人、群组或自身 ID
    - 你正在开发一个渠道目录适配器
summary: '`openclaw directory` 的 CLI 参考（自身、对等方、群组）'
title: 目录
x-i18n:
    generated_at: "2026-05-02T05:25:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd0be284c0ec1aa347084d84f7001f1e2f47977ec5198025ba303297858aaab
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

对支持目录查询的渠道进行查找（联系人/对等方、群组以及“me”）。

## 通用标志

- `--channel <name>`：渠道 id/别名（配置多个渠道时必填；仅配置一个渠道时自动使用）
- `--account <id>`：账号 id（默认值：渠道默认账号）
- `--json`：输出 JSON

## 说明

- `directory` 用于帮助你找到可粘贴到其他命令中的 ID（尤其是 `openclaw message send --target ...`）。
- 对于许多渠道，结果由配置支持（允许列表/已配置群组），而不是来自实时提供商目录。
- 已安装的渠道插件仍然可以省略目录支持；在这种情况下，该命令会报告不支持的目录操作，而不是重新安装插件。
- 默认输出为用制表符分隔的 `id`（有时还有 `name`）；如需编写脚本，请使用 `--json`。

## 将结果用于 `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 格式（按渠道）

- WhatsApp：`+15551234567`（私信），`1234567890-1234567890@g.us`（群组）
- Telegram：`@username` 或数字聊天 id；群组使用数字 id
- Slack：`user:U…` 和 `channel:C…`
- Discord：`user:<id>` 和 `channel:<id>`
- Matrix（插件）：`user:@user:server`、`room:!roomId:server` 或 `#alias:server`
- Microsoft Teams（插件）：`user:<id>` 和 `conversation:<id>`
- Zalo（插件）：用户 id（Bot API）
- Zalo Personal / `zalouser`（插件）：来自 `zca` 的会话串 id（私信/群组）（`me`、`friend list`、`group list`）

## 自身（“me”）

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

## 相关内容

- [CLI 参考](/zh-CN/cli)
