---
read_when:
    - 你想查询某个渠道的联系人/群组/自身 ID
    - 你正在开发一个渠道目录适配器
summary: CLI 参考：`openclaw directory`（自己、对等方、群组）
title: 目录
x-i18n:
    generated_at: "2026-07-03T15:19:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

用于支持目录查询的渠道（联系人/对等方、群组和 “me”）的目录查找。

## 常用标志

- `--channel <name>`：渠道 id/别名（配置了多个渠道时必填；只配置一个时自动使用）
- `--account <id>`：账号 id（默认：渠道默认值）
- `--json`：输出 JSON

## 说明

- `directory` 旨在帮助你找到可粘贴到其他命令中的 ID（尤其是 `openclaw message send --target ...`）。
- 对于许多渠道，结果由配置提供支持（允许列表/已配置群组），而不是实时提供商目录。
- 已安装的渠道插件仍可能省略目录支持；在这种情况下，该命令会报告不支持的目录操作，而不是重新安装插件。
- 默认输出为 `id`（有时还有 `name`），以制表符分隔；脚本中请使用 `--json`。

## 将结果用于 `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 格式（按渠道）

- WhatsApp：`+15551234567`（私信），`1234567890-1234567890@g.us`（群组），`120363123456789@newsletter`（Channel/Newsletter 出站目标）
- Signal：已配置别名会解析为 E.164/UUID 私信目标或 `group:<id>` 群组目标
- Telegram：`@username` 或数字聊天 id；群组是数字 id
- Slack：`user:U…` 和 `channel:C…`
- Discord：`user:<id>` 和 `channel:<id>`
- Matrix（插件）：`user:@user:server`、`room:!roomId:server` 或 `#alias:server`
- Microsoft Teams（插件）：`user:<id>` 和 `conversation:<id>`
- Zalo（插件）：用户 id（Bot API）
- Zalo Personal / `zalouser`（插件）：来自 `zca` 的线程 id（私信/群组）（`me`、`friend list`、`group list`）

## 自我（“me”）

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
