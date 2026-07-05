---
read_when:
    - 你希望 Claude Code 使用 OpenClaw Gateway 网关 MCP 工具
    - 你需要一个用于外部运行框架的临时会话绑定 MCP 授权
summary: '`openclaw attach` 的 CLI 参考（使用作用域限定的 Gateway 网关 MCP 授权启动 Claude Code）'
title: 附加 CLI
x-i18n:
    generated_at: "2026-07-05T11:07:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` 会使用严格的临时 MCP 配置启动 Claude Code，并将其绑定到一个 Gateway 网关会话。

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

选项：

- `--session <key>` 将授权绑定到一个 Gateway 网关会话。默认使用主会话。
- `--ttl <ms>` 请求一个以毫秒为单位的正数授权 TTL。Gateway 网关会应用自己的上限。
- `--bin <path>` 选择 Claude Code 二进制文件。默认值：`claude`。
- `--print-config` 写入临时 `.mcp.json`，打印启动命令和环境变量，并让授权保持有效直到 TTL 过期（它不会启动 Claude Code，也不会撤销授权）。

Bearer token 通过环境变量传递，而不是通过 argv。OpenClaw 使用 `--strict-mcp-config --mcp-config <path>` 启动 Claude Code，因此环境中的 Claude MCP 服务器不会加入已附加的会话。正常启动（不使用 `--print-config`）会在 Claude Code 进程退出时撤销授权。

另请参阅：[Gateway CLI](/zh-CN/cli/gateway)、[MCP CLI](/zh-CN/cli/mcp) 和 [ACP CLI](/zh-CN/cli/acp)。
