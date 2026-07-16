---
read_when:
    - 你正在使用配对模式私信，需要批准发送者
summary: '`openclaw pairing` 的 CLI 参考（批准/列出配对请求）'
title: 配对
x-i18n:
    generated_at: "2026-07-16T11:30:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 740459efe4d0fa2e9fa04a20b944592fed3dc9a22211658e1418c1e49a736997
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

批准或检查支持配对的渠道中的私信配对请求（仅限聊天私信——节点/设备配对使用 `openclaw devices`）。

相关内容：[配对流程](/zh-CN/channels/pairing)

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

| 选项                  | 说明                           |
| ----------------------- | ------------------------------------- |
| `[channel]`             | 位置参数形式的渠道 ID                 |
| `--channel <channel>`   | 显式指定的渠道 ID                   |
| `--account <accountId>` | 多账号渠道的账号 ID |
| `--json`                | 机器可读输出               |

如果配置了多个支持配对的渠道，请通过位置参数或 `--channel` 传入渠道。只要渠道 ID 有效，扩展渠道也可使用。

## `pairing approve`

批准待处理的配对码，并允许该发送者。

用法：

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`，当且仅当只配置了一个支持配对的渠道时

选项：`--channel <channel>`、`--account <accountId>`、`--notify`（通过同一渠道向请求者发送确认消息）。

### 所有者初始化

如果批准配对码时 `commands.ownerAllowFrom` 为空，OpenClaw 还会将获准的发送者记录为命令所有者，并使用 `telegram:123456789` 之类的渠道范围条目。这仅用于初始化第一个所有者——后续配对批准绝不会替换或扩展 `commands.ownerAllowFrom`。

命令所有者是获准运行仅限所有者的命令，并批准 `/diagnostics`、`/export-session`、`/export-trajectory`、`/config` 和 Exec 审批等危险操作的人类操作员账号。配对仅允许发送者与智能体交谈；除了这一次性初始化外，配对本身不会授予所有者权限。

如果在此初始化机制推出前已经批准过发送者，请运行 `openclaw doctor`；当未配置命令所有者时，它会发出警告，并显示用于修复问题的确切 `openclaw config set commands.ownerAllowFrom ...` 命令。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [渠道配对](/zh-CN/channels/pairing)
