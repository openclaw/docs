---
read_when:
    - 診斷頻道連線能力或閘道健康狀況
    - 了解健康檢查命令列介面指令與選項
summary: 健康檢查命令與閘道健康狀態監控
title: 健康檢查
x-i18n:
    generated_at: "2026-07-22T10:34:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 16880a240f66a9b8e7aa5e839cacc493f725f9c30fc136e3c144d8829fdb1471
    source_path: gateway/health.md
    workflow: 16
---

無須猜測即可驗證頻道連線能力的簡短指南。

## 快速檢查

- `openclaw status` - 本機摘要：閘道連線能力／模式、更新提示、已連結頻道的驗證時間、工作階段及近期活動。
- `openclaw status --all` - 完整本機診斷（唯讀、彩色顯示，可安全貼上以供偵錯）。
- `openclaw status --deep` - 要求執行中的閘道進行即時探測（`health` 搭配 `probe:true`），並在支援時納入各帳號的頻道探測。
- `openclaw status --usage` - 顯示模型供應商的用量／配額快照。
- `openclaw health` - 要求執行中的閘道提供其健康狀態快照（僅限 WS；命令列介面不會直接建立頻道通訊端）。
- `openclaw health --verbose`（別名 `--debug`）- 強制執行即時健康狀態探測，並輸出閘道連線詳細資料。
- `openclaw health --json` - 輸出機器可讀的健康狀態快照。
- 在任一頻道中將 `/status` 作為獨立聊天命令傳送，即可在不叫用代理程式的情況下取得狀態回覆。
- 日誌：持續追蹤 `/tmp/openclaw/openclaw-*.log`，並篩選 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound`。

對 Discord 與其他聊天供應商而言，工作階段資料列不代表通訊端仍存活。
`openclaw sessions`、閘道 `sessions.list`，以及代理程式的 `sessions_list` 工具
會讀取已儲存的對話狀態。供應商重新連線後，可能會在尚未具體建立任何新工作階段資料列前，
就先顯示健康的頻道狀態。請使用上述頻道狀態與
健康狀態命令進行即時連線檢查。

## 深度診斷

- 磁碟上的認證資訊：`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（mtime 應為近期時間）。
- 工作階段儲存區：`ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。`status` 會顯示數量與近期收件者。
- 重新連結流程：當日誌中出現狀態碼 409-515 或 `loggedOut` 時，執行 `openclaw channels logout && openclaw channels login --verbose`。QR 登入流程在配對後若遇到狀態碼 515，會自動重新啟動一次。
- 診斷預設為啟用（`diagnostics.enabled: false` 可將其停用）。記憶體事件會記錄 RSS／堆積位元組數，以及臨界值／成長壓力。當程序仍在執行但已飽和時，存活狀態警告會記錄事件迴圈延遲／使用率、CPU 核心比率，以及作用中／等待中／排隊中的工作階段數量。超大承載資料事件會記錄遭拒絕／截斷／分塊的內容類型及其大小與限制，但絕不記錄訊息文字、附件內容、網路鉤子本文、原始要求／回應本文、權杖、Cookie 或祕密值。
- 同一個心跳偵測也會驅動有界的穩定性記錄器：`openclaw gateway stability`（或 `diagnostics.stability` 閘道 RPC）。致命的閘道結束、關閉逾時與重新啟動時的啟動失敗，都會將最新快照保存於 `~/.openclaw/logs/stability/`。使用 `openclaw gateway stability --bundle latest` 檢查最新的套件組合。
- 回報錯誤時，請執行 `openclaw gateway diagnostics export` 並附上產生的 zip：其中包含 Markdown 摘要、最新的穩定性套件組合、經清理的日誌中繼資料、經清理的閘道狀態／健康狀態快照，以及設定結構。聊天文字、網路鉤子本文、工具輸出、認證資訊、Cookie、帳號／訊息識別碼與祕密值都會被省略或遮蔽。請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

## 健康狀態監控設定

- `channels.<provider>.healthMonitor.enabled`：在保持全域監控啟用的同時，停用特定頻道的健康狀態監控重新啟動功能。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：優先於頻道層級設定的多帳號覆寫值。
- 這些各頻道覆寫值適用於目前公開此功能的內建頻道：Discord、Google Chat、iMessage、IRC、Microsoft Teams、Signal、Slack、Telegram 與 WhatsApp。

## 運作時間監控

外部運作時間監控服務應使用專用的 `/health` 端點，而非 `/v1/chat/completions`。

- **應使用：** `GET /health` - 立即回應、不建立工作階段、不呼叫 LLM，並傳回 `{"ok":true,"status":"live"}`
- **請勿使用：** 不要將 `/v1/chat/completions` 用於健康狀態檢查 - 每個要求都會建立完整的代理程式工作階段，包含技能快照、上下文組裝與 LLM 呼叫

未提供 `x-openclaw-session-key` 標頭或 `user` 欄位時，`/v1/chat/completions` 會為每個要求產生新的隨機工作階段。每 15 分鐘偵測一次的監控服務每天會建立約 96 個工作階段，每個占用 4-22KB。久而久之，這會導致工作階段儲存區膨脹，並可能造成上下文視窗溢位。

### 監控服務設定範例

- **BetterStack：** 將健康狀態檢查 URL 設為 `https://<your-gateway-host>:<port>/health`
- **UptimeRobot：** 新增 HTTP 監控器，並將 URL 設為 `https://<your-gateway-host>:<port>/health`
- **一般方式：** 當閘道健康時，對 `/health` 發出的任何 HTTP GET 都會傳回 200 與 `{"ok":true}`

## 發生失敗時

- `logged out` 或狀態碼 409-515 -> 先使用 `openclaw channels logout`，再使用 `openclaw channels login` 重新連結。
- 無法連線至閘道 -> 啟動閘道：`openclaw gateway --port 18789`（若連接埠忙碌，請使用 `--force`）。
- 沒有傳入訊息 -> 確認已連結的手機在線上，且允許該傳送者（`channels.whatsapp.allowFrom`）；若為群組聊天，請確認允許清單與提及規則相符（`channels.whatsapp.groups`、`agents.entries.*.groupChat.mentionPatterns`）。

## 專用的「health」命令

`openclaw health` 會要求執行中的閘道提供其健康狀態快照（命令列介面不會直接建立頻道
通訊端）。預設會傳回最新的閘道快取快照，且閘道會在背景重新整理該快取；
`--verbose` 則會強制執行即時探測。
此命令會在可用時回報已連結的認證資訊／驗證時間、各頻道探測摘要、
工作階段儲存區摘要與探測持續時間。若無法連線至閘道，或探測失敗／逾時，
則會以非零狀態結束。

選項：

- `--json`：機器可讀的 JSON 輸出
- `--timeout <ms>`：覆寫預設的 10s 探測逾時
- `--verbose`：強制執行即時探測，並輸出閘道連線詳細資料
- `--debug`：`--verbose` 的別名

健康狀態快照包含：`ok`（布林值）、`ts`（時間戳記）、`durationMs`（探測時間）、各頻道狀態、代理程式可用性與工作階段儲存區摘要。

## 相關內容

- [閘道操作手冊](/zh-TW/gateway)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
