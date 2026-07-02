---
read_when:
    - 你希望 Claude Code 使用 OpenClaw 閘道 MCP 工具
    - 你需要一個用於外部測試框架的臨時工作階段綁定 MCP 授權
summary: '`openclaw attach` 的命令列介面參考（使用具範圍限制的閘道 MCP 授權啟動 Claude Code）'
title: 附加命令列介面
x-i18n:
    generated_at: "2026-07-02T00:43:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` 會啟動 Claude Code，並使用綁定到單一閘道工作階段的嚴格暫時 MCP 設定。

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

選項：

- `--session <key>` 會將授權綁定到一個閘道工作階段。預設為主要工作階段。
- `--ttl <ms>` 會要求以毫秒為單位的正值授權 TTL。閘道會套用自己的上限。
- `--bin <path>` 會選取 Claude Code 二進位檔。預設為 `claude`。
- `--print-config` 會寫入暫時的 `.mcp.json`、列印啟動命令與環境變數，並讓授權維持有效直到 TTL 到期。

Bearer 權杖會透過環境變數傳遞，而不是 argv。OpenClaw 會使用 `--strict-mcp-config --mcp-config <path>` 啟動 Claude Code，因此周圍環境中的 Claude MCP 伺服器不會加入已附加的工作階段。一般啟動會在 Claude Code 程序結束時撤銷授權。

另請參閱：[閘道命令列介面](/zh-TW/cli/gateway)、[MCP 命令列介面](/zh-TW/cli/mcp) 和 [ACP 命令列介面](/zh-TW/cli/acp)。
