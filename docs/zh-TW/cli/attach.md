---
read_when:
    - 你想讓 Claude Code 使用 OpenClaw 閘道 MCP 工具
    - 你需要為外部測試框架取得一個與工作階段綁定的臨時 MCP 授權
summary: '`openclaw attach` 的命令列介面參考（使用限定範圍的閘道 MCP 授權啟動 Claude Code）'
title: 附加命令列介面
x-i18n:
    generated_at: "2026-07-11T21:13:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` 會使用嚴格的暫時 MCP 設定啟動 Claude Code，並繫結至單一閘道工作階段。

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

選項：

- `--session <key>` 將授權繫結至閘道工作階段。預設為主要工作階段。
- `--ttl <ms>` 要求以毫秒為單位的正數授權存活時間。閘道會套用自身的上限。
- `--bin <path>` 選擇 Claude Code 二進位檔。預設值：`claude`。
- `--print-config` 會寫入暫時的 `.mcp.json`、輸出啟動命令與環境變數，並讓授權保持有效直到存活時間到期（不會啟動 Claude Code，也不會撤銷授權）。

不記名權杖透過環境變數傳遞，而非 argv。OpenClaw 會使用 `--strict-mcp-config --mcp-config <path>` 啟動 Claude Code，避免環境中既有的 Claude MCP 伺服器加入所附加的工作階段。一般啟動（未使用 `--print-config`）會在 Claude Code 程序結束時撤銷授權。

另請參閱：[閘道命令列介面](/zh-TW/cli/gateway)、[MCP 命令列介面](/zh-TW/cli/mcp)和 [ACP 命令列介面](/zh-TW/cli/acp)。
