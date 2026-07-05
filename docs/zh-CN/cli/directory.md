---
read_when:
    - 你想查询某个渠道的联系人/群组/自身 ID
    - 你正在开发渠道目录适配器
summary: '`openclaw directory` 的 CLI 参考（自身、对等方、群组）'
title: 目录
x-i18n:
    generated_at: "2026-07-05T11:09:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

用于支持目录查询的渠道：联系人/对等方、群组，以及 “me”（自己）。

结果用于粘贴到其他命令中，尤其是 `openclaw message send --target ...`。

## 常用标志

- `--channel <name>`：渠道 id/别名（配置了多个渠道时必填；仅配置一个渠道时自动选择）
- `--account <id>`：账号 id（默认：渠道默认值）
- `--json`：输出 JSON

默认（非 JSON）输出是 `id`（有时还有 `name`），以制表符分隔。

## 说明

- 对于许多渠道，结果由配置支持（允许列表/已配置群组），而不是实时提供商目录。
- 已安装的渠道插件可能缺少目录支持。在这种情况下，命令会报告不支持的操作；它不会尝试重新安装或升级插件来添加支持。

## 将结果与 `message send` 一起使用

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## 各渠道的 ID 格式

| 渠道                                | 目标 id 格式                                                                                                                |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567`（私信），`1234567890-1234567890@g.us`（群组），`120363123456789@newsletter`（Channel/Newsletter，仅出站） |
| Signal                              | 已配置的别名会解析为 E.164/UUID 私信目标，或 `group:<id>` 群组目标                                                         |
| Telegram                            | `@username` 或数字聊天 id；群组使用数字 id                                                                                  |
| Slack                               | `user:U…` 和 `channel:C…`                                                                                                  |
| Discord                             | `user:<id>` 和 `channel:<id>`                                                                                              |
| Matrix（插件）                      | `user:@user:server`、`room:!roomId:server` 或 `#alias:server`                                                              |
| Microsoft Teams（插件）             | `user:<id>` 和 `conversation:<id>`                                                                                         |
| Zalo（插件）                        | 用户 id（Bot API）                                                                                                          |
| Zalo Personal / `zalouser`（插件）  | 线程 id（私信/群组），来自 `zca`（`me`、`friend list`、`group list`）                                                       |

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

## 相关

- [CLI 参考](/zh-CN/cli)
