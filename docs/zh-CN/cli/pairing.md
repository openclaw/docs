---
read_when:
    - 你正在使用结对模式私信，需要批准发送者
summary: '`openclaw pairing` 的 CLI 参考（批准/列出配对请求）'
title: 配对
x-i18n:
    generated_at: "2026-05-06T16:00:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

批准或查看私信配对请求（适用于支持配对的渠道）。

相关：

- 配对流程：[配对](/zh-CN/channels/pairing)

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

选项：

- `[channel]`：位置参数渠道 ID
- `--channel <channel>`：显式渠道 ID
- `--account <accountId>`：多账户渠道的账户 ID
- `--json`：机器可读输出

注意：

- 如果配置了多个支持配对的渠道，你必须通过位置参数或 `--channel` 提供一个渠道。
- 只要渠道 ID 有效，就允许使用插件渠道。

## `pairing approve`

批准待处理的配对码，并允许该发送者。

用法：

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- 当只配置了一个支持配对的渠道时，可使用 `openclaw pairing approve <code>`

选项：

- `--channel <channel>`：显式渠道 ID
- `--account <accountId>`：多账户渠道的账户 ID
- `--notify`：通过同一渠道向请求者发回确认消息

所有者引导：

- 如果你批准配对码时 `commands.ownerAllowFrom` 为空，OpenClaw 还会使用渠道范围的条目（例如 `telegram:123456789`）将已批准的发送者记录为命令所有者。
- 这只会引导第一个所有者。后续配对批准不会替换或扩展 `commands.ownerAllowFrom`。
- 命令所有者是被允许运行仅所有者可用命令，并批准危险操作的人类操作员账户，例如 `/diagnostics`、`/export-trajectory`、`/config` 和 exec 批准。

## 注意

- 渠道输入：通过位置参数传入（`pairing list telegram`），或使用 `--channel <channel>`。
- `pairing list` 支持用于多账户渠道的 `--account <accountId>`。
- `pairing approve` 支持 `--account <accountId>` 和 `--notify`。
- 如果只配置了一个支持配对的渠道，则允许使用 `pairing approve <code>`。
- 如果你在此引导机制存在之前批准过某个发送者，请运行 `openclaw doctor`；当未配置命令所有者时，它会发出警告，并显示用于修复的 `openclaw config set commands.ownerAllowFrom ...` 命令。

## 相关

- [CLI 参考](/zh-CN/cli)
- [渠道配对](/zh-CN/channels/pairing)
