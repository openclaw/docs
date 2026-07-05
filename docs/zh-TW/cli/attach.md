---
read_when:
    - 你想讓 Claude Code 使用 OpenClaw 閘道 MCP 工具
    - 你需要一個臨時、綁定工作階段的 MCP 授權，供外部測試框架使用
summary: '`openclaw attach` 的命令列介面參考（使用範圍限定的閘道 MCP 授權啟動 Claude Code）'
title: 附加命令列介面
x-i18n:
    generated_at: "2026-07-05T11:08:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` 會以嚴格的臨時 MCP 設定啟動 Claude Code，並綁定到單一閘道工作階段。

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

選項：

- `--session <key>` 將授權綁定到閘道工作階段。預設為主工作階段。
- `--ttl <ms>` 要求以毫秒為單位的正值授權 TTL。閘道會套用自己的上限。
- `--bin <path>` 選取 Claude Code 二進位檔。預設：`claude`。
- `--print-config` 會寫入臨時 `.mcp.json`，列印啟動命令與環境，並讓授權保持有效直到 TTL 到期（它不會產生 Claude Code 或撤銷授權）。

持有人權杖會透過環境變數傳遞，而不是透過命令列引數。OpenClaw 會以 `--strict-mcp-config --mcp-config <path>` 啟動 Claude Code，因此環境中的 Claude MCP 伺服器不會加入附加的工作階段。一般啟動（不使用 `--print-config`）會在 Claude Code 程序結束時撤銷授權。

另請參閱：[閘道命令列介面](/zh-TW/cli/gateway)、[MCP 命令列介面](/zh-TW/cli/mcp) 和 [ACP 命令列介面](/zh-TW/cli/acp)。
