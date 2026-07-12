---
read_when:
    - 你正在使用配对模式的私信，需要批准发送者
summary: '`openclaw pairing` 的 CLI 参考（批准/列出配对请求）'
title: 配对
x-i18n:
    generated_at: "2026-07-11T20:25:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

批准或检查支持配对的渠道中的私信配对请求（仅限聊天私信——节点/设备配对使用 `openclaw devices`）。

相关：[配对流程](/zh-CN/channels/pairing)

## 命令

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

列出一个渠道中待处理的配对请求。

| 选项                    | 说明                     |
| ----------------------- | ------------------------ |
| `[channel]`             | 位置参数形式的渠道 ID    |
| `--channel <channel>`   | 显式指定的渠道 ID        |
| `--account <accountId>` | 多账号渠道的账号 ID      |
| `--json`                | 机器可读输出             |

如果配置了多个支持配对的渠道，请将渠道作为位置参数传入，或使用 `--channel`。只要渠道 ID 有效，扩展渠道也可使用。

## `pairing approve`

批准待处理的配对码，并允许该发送者访问。

用法：

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- 仅配置了一个支持配对的渠道时，使用 `openclaw pairing approve <code>`

选项：`--channel <channel>`、`--account <accountId>`、`--notify`（通过同一渠道向请求者发送确认消息）。

### 所有者引导设置

如果你批准配对码时 `commands.ownerAllowFrom` 为空，OpenClaw 还会将获准的发送者记录为命令所有者，并使用类似 `telegram:123456789` 的渠道范围条目。此操作只会引导设置第一个所有者——后续批准配对绝不会替换或扩展 `commands.ownerAllowFrom`。

命令所有者是获准运行仅限所有者的命令，以及批准危险操作（例如 `/diagnostics`、`/export-trajectory`、`/config` 和 Exec 审批）的人类操作员账号。配对只允许发送者与智能体交谈；除这次一次性引导设置外，配对本身不会授予所有者权限。

如果你在此引导设置功能推出前批准过发送者，请运行 `openclaw doctor`；当未配置命令所有者时，它会发出警告，并显示用于修复问题的确切 `openclaw config set commands.ownerAllowFrom ...` 命令。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [渠道配对](/zh-CN/channels/pairing)
