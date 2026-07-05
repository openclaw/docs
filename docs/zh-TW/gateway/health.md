---
read_when:
    - 診斷頻道連線能力或閘道健康狀態
    - 了解健康檢查命令列介面命令與選項
summary: 健康檢查命令與閘道健康監控
title: 健康檢查
x-i18n:
    generated_at: "2026-07-05T11:18:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930bd0f5b91bd4e7abb79a3e0f13eb59317023b796106cf0f0fdc0af51d657fe
    source_path: gateway/health.md
    workflow: 16
---

不用猜測即可驗證頻道連線能力的簡短指南。

## 快速檢查

- `openclaw status` - 本機摘要：閘道可達性/模式、更新提示、已連結頻道驗證年齡、工作階段 + 近期活動。
- `openclaw status --all` - 完整本機診斷（唯讀、彩色、可安全貼上用於偵錯）。
- `openclaw status --deep` - 要求執行中的閘道進行即時探測（含 `probe:true` 的 `health`），在支援時包含各帳戶的頻道探測。
- `openclaw status --usage` - 顯示模型提供者用量/配額快照。
- `openclaw health` - 要求執行中的閘道提供其健康狀態快照（僅限 WS；命令列介面不會直接連接頻道 socket）。
- `openclaw health --verbose`（別名 `--debug`）- 強制進行即時健康狀態探測並列印閘道連線詳細資料。
- `openclaw health --json` - 機器可讀的健康狀態快照輸出。
- 在任何頻道中以獨立聊天命令傳送 `/status`，即可取得狀態回覆而不會叫用代理。
- 記錄：追蹤 `/tmp/openclaw/openclaw-*.log`，並篩選 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound`。

對 Discord 和其他聊天提供者而言，工作階段列不代表 socket 存活狀態。
`openclaw sessions`、閘道 `sessions.list` 和代理 `sessions_list` 工具
讀取的是已儲存的對話狀態。提供者可以重新連線並顯示健康的頻道
狀態，而新的工作階段列尚未具現化。請使用上方的頻道狀態與
健康狀態命令進行即時連線檢查。

## 深度診斷

- 磁碟上的憑證：`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（mtime 應該是近期時間）。
- 工作階段儲存區：`ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（可在設定中覆寫路徑）。`status` 會顯示數量和近期收件者。
- 重新連結流程：當狀態碼 409-515 或記錄中出現 `loggedOut` 時，執行 `openclaw channels logout && openclaw channels login --verbose`。QR 登入流程在配對後遇到狀態 515 時會自動重新啟動一次。
- 診斷預設啟用（`diagnostics.enabled: false` 會停用）。記憶體事件會記錄 RSS/heap 位元組數、臨界值/成長壓力；嚴重記憶體壓力會透過閘道記錄器記錄，且當設定 `diagnostics.memoryPressureSnapshot: true` 時，也會寫入 OOM 前穩定性套件（V8 heap 統計、可用時的 Linux cgroup 計數器、作用中資源數量、依已遮蔽相對路徑列出的最大工作階段/轉錄檔案）。存活警告會在程序仍在執行但已飽和時，記錄事件迴圈延遲/使用率、CPU 核心比率，以及作用中/等待中/已佇列工作階段數。過大承載事件會記錄遭拒絕/截斷/分塊的項目與大小和限制，但絕不記錄訊息文字、附件內容、網路鉤子本文、原始請求/回應本文、權杖、Cookie 或秘密值。
- 相同的心跳偵測會驅動有界穩定性記錄器：`openclaw gateway stability`（或 `diagnostics.stability` 閘道 RPC）。致命閘道結束、關機逾時、重新啟動啟動失敗，以及（當 `diagnostics.memoryPressureSnapshot: true` 時）嚴重記憶體壓力，會將最新快照保存在 `~/.openclaw/logs/stability/` 下。使用 `openclaw gateway stability --bundle latest` 檢查最新套件。
- 回報錯誤時，請執行 `openclaw gateway diagnostics export` 並附上產生的 zip：Markdown 摘要、最新穩定性套件、已清理的記錄中繼資料、已清理的閘道狀態/健康狀態快照，以及設定形狀。聊天文字、網路鉤子本文、工具輸出、憑證、Cookie、帳戶/訊息識別碼與秘密值都會被省略或遮蔽。請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

## 健康狀態監控設定

- `gateway.channelHealthCheckMinutes`：閘道檢查頻道健康狀態的頻率。預設值：`5`。設為 `0` 可全域停用健康狀態監控重新啟動。
- `gateway.channelStaleEventThresholdMinutes`：已連線頻道可維持閒置多久，之後健康狀態監控會將其視為過期並重新啟動。預設值：`30`。請讓此值大於或等於 `gateway.channelHealthCheckMinutes`。
- `gateway.channelMaxRestartsPerHour`：每個頻道/帳戶每一滾動小時內的健康狀態監控重新啟動上限。預設值：`10`。
- `channels.<provider>.healthMonitor.enabled`：針對特定頻道停用健康狀態監控重新啟動，同時保留全域監控啟用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多帳戶覆寫，優先於頻道層級設定。
- 這些各頻道覆寫目前適用於有公開此功能的內建頻道：Discord、Google Chat、iMessage、IRC、Microsoft Teams、Signal、Slack、Telegram 和 WhatsApp。

## 正常運作時間監控

外部正常運作時間監控服務應使用專用的 `/health` 端點，而不是 `/v1/chat/completions`。

- **請使用：** `GET /health` - 立即回應、不建立工作階段、不呼叫 LLM，回傳 `{"ok":true,"status":"live"}`
- **請勿使用：** `/v1/chat/completions` 進行健康狀態檢查 - 每個請求都會建立完整代理工作階段，包含 skill 快照、內容組裝和 LLM 呼叫

當未提供 `x-openclaw-session-key` 標頭或 `user` 欄位時，`/v1/chat/completions` 會為每個請求產生新的隨機工作階段。每 15 分鐘 ping 一次的監控服務每天會建立約 96 個工作階段，每個消耗 4-22KB。長期下來會造成工作階段儲存區膨脹，並可能導致內容視窗溢位。

### 監控服務設定範例

- **BetterStack：** 將健康狀態檢查 URL 設為 `https://<your-gateway-host>:<port>/health`
- **UptimeRobot：** 新增一個 HTTP 監控器，URL 為 `https://<your-gateway-host>:<port>/health`
- **一般：** 當閘道健康時，任何對 `/health` 的 HTTP GET 都會回傳 200 與 `{"ok":true}`

## 發生失敗時

- `logged out` 或狀態 409-515 -> 使用 `openclaw channels logout` 後接 `openclaw channels login` 重新連結。
- 閘道無法連線 -> 啟動它：`openclaw gateway --port 18789`（若連接埠忙碌，請使用 `--force`）。
- 沒有傳入訊息 -> 確認已連結的手機在線上且寄件者被允許（`channels.whatsapp.allowFrom`）；對於群組聊天，請確認允許清單 + 提及規則相符（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 專用的「health」命令

`openclaw health` 會要求執行中的閘道提供其健康狀態快照（命令列介面不會直接連接頻道
socket）。預設會回傳新的快取閘道快照，且閘道會在背景重新整理該快取；`--verbose` 則會改為強制即時探測。
此命令會回報可用時的已連結憑證/驗證年齡、各頻道探測摘要、
工作階段儲存區摘要，以及探測持續時間。若閘道無法連線，或探測失敗/逾時，則會以非零狀態結束。

選項：

- `--json`：機器可讀的 JSON 輸出
- `--timeout <ms>`：覆寫預設 10 秒探測逾時
- `--verbose`：強制進行即時探測並列印閘道連線詳細資料
- `--debug`：`--verbose` 的別名

健康狀態快照包含：`ok`（布林值）、`ts`（時間戳記）、`durationMs`（探測時間）、各頻道狀態、代理可用性，以及工作階段儲存區摘要。

## 相關

- [閘道操作手冊](/zh-TW/gateway)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
