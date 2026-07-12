---
read_when:
    - 你想查询某个渠道的联系人、群组或自身 ID
    - 你正在开发渠道目录适配器
summary: '`openclaw directory` 的 CLI 参考（自身、对等方、群组）'
title: 目录
x-i18n:
    generated_at: "2026-07-11T20:25:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

查询支持目录功能的渠道：联系人/对等方、群组和“我”（自身）。

查询结果可粘贴到其他命令中使用，尤其是 `openclaw message send --target ...`。

## 常用标志

- `--channel <name>`：渠道 ID/别名（配置了多个渠道时必填；仅配置一个渠道时自动选择）
- `--account <id>`：账户 ID（默认：渠道默认账户）
- `--json`：输出 JSON

默认（非 JSON）输出为 `id`（有时也包含 `name`），以制表符分隔。

## 注意事项

- 对许多渠道而言，结果来自配置（允许列表/已配置群组），而非提供商的实时目录。
- 已安装的渠道插件可能不支持目录功能。在这种情况下，命令会报告不支持该操作；它不会尝试重新安装或升级插件来添加支持。

## 将结果用于 `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## 各渠道的 ID 格式

| 渠道                                | 目标 ID 格式                                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567`（私信）、`1234567890-1234567890@g.us`（群组）、`120363123456789@newsletter`（频道/新闻通讯，仅限出站）       |
| Signal                              | 配置的别名解析为 E.164/UUID 私信目标或 `group:<id>` 群组目标                                                              |
| Telegram                            | `@username` 或数字聊天 ID；群组使用数字 ID                                                                                 |
| Slack                               | `user:U…` 和 `channel:C…`                                                                                                  |
| Discord                             | `user:<id>` 和 `channel:<id>`                                                                                              |
| Matrix（插件）                      | `user:@user:server`、`room:!roomId:server` 或 `#alias:server`                                                              |
| Microsoft Teams（插件）             | `user:<id>` 和 `conversation:<id>`                                                                                         |
| Zalo（插件）                        | 用户 ID（Bot API）                                                                                                         |
| Zalo Personal / `zalouser`（插件）  | 来自 `zca`（`me`、`friend list`、`group list`）的会话线程 ID（私信/群组）                                                  |

## 自身（“我”）

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
