---
read_when:
    - 你正在使用配对模式私信，需要批准发送者
summary: '`openclaw pairing` 的 CLI 参考（批准/列出配对请求）'
title: 配对
x-i18n:
    generated_at: "2026-07-05T11:10:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

批准或检查支持配对的渠道的私信配对请求（仅限聊天私信 - 节点/设备配对使用 `openclaw devices`）。

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

列出某个渠道的待处理配对请求。

| 选项                    | 描述                         |
| ----------------------- | ---------------------------- |
| `[channel]`             | 位置参数渠道 id              |
| `--channel <channel>`   | 显式渠道 id                  |
| `--account <accountId>` | 多账号渠道的账号 id          |
| `--json`                | 机器可读输出                 |

如果配置了多个支持配对的渠道，请通过位置参数或 `--channel` 传入渠道。只要渠道 id 有效，扩展渠道也可以使用。

## `pairing approve`

批准一个待处理配对码并允许该发送者。

用法：

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`，当且仅当只配置了一个支持配对的渠道时

选项：`--channel <channel>`、`--account <accountId>`、`--notify`（在同一渠道向请求者发回确认）。

### 所有者引导

如果你批准配对码时 `commands.ownerAllowFrom` 为空，OpenClaw 还会将已批准的发送者记录为命令所有者，使用类似 `telegram:123456789` 的渠道作用域条目。这只会引导第一个所有者 - 后续配对批准绝不会替换或扩展 `commands.ownerAllowFrom`。

命令所有者是被允许运行仅所有者命令并批准危险操作的人类操作员账号，例如 `/diagnostics`、`/export-trajectory`、`/config` 和 Exec 审批。配对只允许发送者与智能体对话；除了这一次性引导之外，它本身不会授予所有者权限。

如果你在这个引导功能存在之前批准过发送者，请运行 `openclaw doctor`；当未配置命令所有者时，它会发出警告，并显示用于修复问题的确切 `openclaw config set commands.ownerAllowFrom ...` 命令。

## 相关

- [CLI 参考](/zh-CN/cli)
- [渠道配对](/zh-CN/channels/pairing)
