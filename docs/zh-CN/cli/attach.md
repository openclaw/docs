---
read_when:
    - 你想让 Claude Code 使用 OpenClaw Gateway 网关 MCP 工具
    - 你需要为外部 harness 配置一个临时的会话绑定 MCP 授权
summary: '`openclaw attach` 的 CLI 参考（使用作用域限定的 Gateway 网关 MCP 授权启动 Claude Code）'
title: 附加 CLI
x-i18n:
    generated_at: "2026-07-02T00:43:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` 会使用绑定到一个 Gateway 网关会话的严格临时 MCP 配置启动 Claude Code。

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

选项：

- `--session <key>` 将授权绑定到一个 Gateway 网关会话。默认使用主会话。
- `--ttl <ms>` 请求以毫秒为单位的正授权 TTL。Gateway 网关会应用自己的上限。
- `--bin <path>` 选择 Claude Code 二进制文件。默认值为 `claude`。
- `--print-config` 写入临时 `.mcp.json`，打印启动命令和环境，并让授权保持有效直到 TTL 过期。

Bearer 令牌通过环境变量传递，而不是通过 argv。OpenClaw 使用 `--strict-mcp-config --mcp-config <path>` 启动 Claude Code，这样环境中的 Claude MCP 服务器就不会加入附加的会话。正常启动会在 Claude Code 进程退出时撤销授权。

另见：[Gateway CLI](/zh-CN/cli/gateway)、[MCP CLI](/zh-CN/cli/mcp) 和 [ACP CLI](/zh-CN/cli/acp)。
