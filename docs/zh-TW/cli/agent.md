---
read_when:
    - 你想要從指令碼執行一個代理程式回合（可選擇傳送回覆）
summary: '`openclaw agent` 的 CLI 參考（透過 Gateway 傳送一次代理程式回合）'
title: 代理
x-i18n:
    generated_at: "2026-04-30T02:51:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: b77668949040933c5281f2f183e48cc2593d09252470483b9ae38dcffd13d071
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

透過 Gateway 執行代理的一輪作業（使用 `--local` 可改用嵌入式）。
使用 `--agent <id>` 可直接指定已設定的代理。

至少傳入一個工作階段選擇器：

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

相關：

- 代理傳送工具：[代理傳送](/zh-TW/tools/agent-send)

## 選項

- `-m, --message <text>`：必要的訊息內容
- `-t, --to <dest>`：用來衍生工作階段金鑰的收件者
- `--session-id <id>`：明確的工作階段 ID
- `--agent <id>`：代理 ID；覆寫路由繫結
- `--model <id>`：此執行的模型覆寫（`provider/model` 或模型 ID）
- `--thinking <level>`：代理思考層級（`off`、`minimal`、`low`、`medium`、`high`，以及提供者支援的自訂層級，例如 `xhigh`、`adaptive` 或 `max`）
- `--verbose <on|off>`：保留此工作階段的詳細程度
- `--channel <channel>`：傳遞通道；省略時使用主要工作階段通道
- `--reply-to <target>`：傳遞目標覆寫
- `--reply-channel <channel>`：傳遞通道覆寫
- `--reply-account <id>`：傳遞帳號覆寫
- `--local`：直接執行嵌入式代理（在 Plugin 登錄檔預載之後）
- `--deliver`：將回覆送回選取的通道/目標
- `--timeout <seconds>`：覆寫代理逾時時間（預設為 600 或設定值）
- `--json`：輸出 JSON

## 範例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 注意事項

- 當 Gateway 請求失敗時，Gateway 模式會退回使用嵌入式代理。使用 `--local` 可一開始就強制使用嵌入式執行。
- `--local` 仍會先預載 Plugin 登錄檔，因此 Plugin 提供的提供者、工具與通道在嵌入式執行期間仍可使用。
- `--local` 與嵌入式備援執行會被視為一次性執行。為該本機程序開啟的內建 MCP 回送資源與暖 Claude stdio 工作階段，會在回覆後被停用，因此腳本化呼叫不會讓本機子程序持續存活。
- Gateway 支援的執行會將 Gateway 擁有的 MCP 回送資源保留在執行中的 Gateway 程序下；較舊的用戶端可能仍會傳送歷史清理旗標，但 Gateway 會將其視為相容性無操作並接受。
- `--channel`、`--reply-channel` 和 `--reply-account` 會影響回覆傳遞，而不是工作階段路由。
- `--json` 會保留 stdout 供 JSON 回應使用。Gateway、Plugin 與嵌入式備援診斷會路由到 stderr，因此腳本可以直接剖析 stdout。
- 嵌入式備援 JSON 包含 `meta.transport: "embedded"` 和 `meta.fallbackFrom: "gateway"`，讓腳本可區分備援執行與 Gateway 執行。
- 如果 Gateway 接受代理執行，但 CLI 等待最終回覆逾時，嵌入式備援會使用新的明確 `gateway-fallback-*` 工作階段/執行 ID，並回報 `meta.fallbackReason: "gateway_timeout"` 加上備援工作階段欄位。這可避免與 Gateway 擁有的逐字稿鎖競爭，或無聲地取代原始路由對話工作階段。
- 當此命令觸發 `models.json` 重新產生時，SecretRef 管理的提供者憑證會以非機密標記保存（例如環境變數名稱、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），而不是解析後的純文字機密。
- 標記寫入以來源為權威：OpenClaw 會保存來自作用中來源設定快照的標記，而不是來自解析後執行階段機密值的標記。

## 相關

- [CLI 參考](/zh-TW/cli)
- [代理執行階段](/zh-TW/concepts/agent)
