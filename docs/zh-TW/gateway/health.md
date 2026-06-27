---
read_when:
    - 診斷通道連線能力或閘道健康狀態
    - 了解健康檢查的命令列介面命令與選項
summary: 健康檢查命令與閘道健康狀態監控
title: 健康檢查
x-i18n:
    generated_at: "2026-06-27T19:18:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d6475bef9fead191c11a801151d4fab76c47034d3f30f90a18c15d6e32b5d26
    source_path: gateway/health.md
    workflow: 16
---

用於驗證頻道連線狀態的簡短指南，避免憑空猜測。

## 快速檢查

- `openclaw status` — 本機摘要：閘道可達性/模式、更新提示、已連結頻道授權年齡、工作階段 + 最近活動。
- `openclaw status --all` — 完整本機診斷（唯讀、彩色、可安全貼上供偵錯）。
- `openclaw status --deep` — 要求執行中的閘道進行即時健康探測（`health` 搭配 `probe:true`），包含支援時的逐帳號頻道探測。
- `openclaw health` — 要求執行中的閘道提供其健康快照（僅限 WS；命令列介面 不會直接開啟頻道 socket）。
- `openclaw health --verbose` — 強制執行即時健康探測並列印閘道連線詳細資訊。
- `openclaw health --json` — 機器可讀的健康快照輸出。
- 在 WhatsApp/WebChat 中將 `/status` 作為獨立訊息傳送，以取得狀態回覆，而不會叫用代理。
- 日誌：追蹤 `/tmp/openclaw/openclaw-*.log`，並篩選 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound`。

對 Discord 和其他聊天提供者而言，工作階段列並不等於 socket 存活狀態。
`openclaw sessions`、閘道 `sessions.list`，以及代理 `sessions_list` 工具
讀取的是已儲存的對話狀態。提供者可以重新連線並顯示健康的頻道
狀態，而不一定已具體產生任何新的工作階段列。請使用上方的頻道狀態與
健康命令來進行即時連線檢查。

## 深度診斷

- 磁碟上的憑證：`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（mtime 應該是近期）。
- 工作階段存放區：`ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（路徑可在設定中覆寫）。計數與最近收件者會透過 `status` 顯示。
- 重新連結流程：當狀態碼 409–515 或日誌中出現 `loggedOut` 時，執行 `openclaw channels logout && openclaw channels login --verbose`。（注意：QR 登入流程會在配對後遇到狀態 515 時自動重新啟動一次。）
- 診斷預設為啟用。除非設定了 `diagnostics.enabled: false`，否則閘道會記錄操作事實。記憶體事件會記錄 RSS/堆積位元組計數、臨界壓力與成長壓力。嚴重記憶體壓力會透過閘道記錄器寫入日誌。設定 `diagnostics.memoryPressureSnapshot: true` 時，嚴重記憶體壓力也會寫入一個 OOM 前穩定性套件，其中包含 V8 堆積統計、可用時的 Linux cgroup 計數器、作用中資源計數，以及依已遮蔽相對路徑列出的最大工作階段/轉錄檔案。存活性警告會在程序仍在執行但已飽和時，記錄事件迴圈延遲、事件迴圈使用率、CPU 核心比率，以及作用中/等待中/佇列中的工作階段計數。過大承載事件會記錄哪些內容遭拒絕、截斷或分塊，以及可用時的大小與限制。它們不會記錄訊息文字、附件內容、網路鉤子內文、原始請求或回應內文、權杖、Cookie 或秘密值。同一個心跳偵測會啟動有界穩定性記錄器，可透過 `openclaw gateway stability` 或 `diagnostics.stability` 閘道 RPC 取得。當事件存在時，致命閘道結束、關機逾時與重新啟動啟動失敗會將最新記錄器快照保存在 `~/.openclaw/logs/stability/` 下；嚴重記憶體壓力只有在設定 `diagnostics.memoryPressureSnapshot: true` 時也會如此。使用 `openclaw gateway stability --bundle latest` 檢查最新儲存的套件。
- 若要回報錯誤，請執行 `openclaw gateway diagnostics export` 並附上產生的 zip。匯出內容會合併 Markdown 摘要、最新穩定性套件、已清理的日誌中繼資料、已清理的閘道狀態/健康快照，以及設定形狀。它的設計目的是可供分享：聊天文字、網路鉤子內文、工具輸出、憑證、Cookie、帳號/訊息識別碼與秘密值都會被省略或遮蔽。請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

## 健康監控設定

- `gateway.channelHealthCheckMinutes`：閘道檢查頻道健康狀態的頻率。預設值：`5`。設為 `0` 可全域停用健康監控重新啟動。
- `gateway.channelStaleEventThresholdMinutes`：已連線頻道可保持閒置多久，才會被健康監控視為過期並重新啟動。預設值：`30`。請保持此值大於或等於 `gateway.channelHealthCheckMinutes`。
- `gateway.channelMaxRestartsPerHour`：每個頻道/帳號在滾動一小時內的健康監控重新啟動上限。預設值：`10`。
- `channels.<provider>.healthMonitor.enabled`：在保留全域監控啟用的同時，停用特定頻道的健康監控重新啟動。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多帳號覆寫，優先於頻道層級設定。
- 這些逐頻道覆寫會套用到目前公開支援此功能的內建頻道監控：Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram 和 WhatsApp。

## 正常運作時間監控

外部正常運作時間監控服務應使用專用的 `/health` 端點，而不是 `/v1/chat/completions`。

- **請使用：** `GET /health` — 即時回應、不建立工作階段、不呼叫 LLM，回傳 `{"ok":true,"status":"live"}`
- **請勿使用：** `/v1/chat/completions` 進行健康檢查 — 每個請求都會建立完整代理工作階段，包含 skill 快照、上下文組裝與 LLM 呼叫

未提供 `x-openclaw-session-key` 標頭或 `user` 欄位時，`/v1/chat/completions` 會為每個請求產生新的隨機工作階段。每 15 分鐘 ping 一次的監控服務會建立約 96 個工作階段/天，每個消耗 4–22KB。長期下來會造成工作階段存放區膨脹，並可能導致上下文視窗溢位。

### 監控服務設定範例

- **BetterStack：** 將健康檢查 URL 設為 `https://<your-gateway-host>:<port>/health`
- **UptimeRobot：** 新增 HTTP 監控，URL 為 `https://<your-gateway-host>:<port>/health`
- **通用：** 當閘道健康時，任何對 `/health` 的 HTTP GET 都會回傳 200 和 `{"ok":true}`

## 當發生故障時

- `logged out` 或狀態 409–515 → 先用 `openclaw channels logout`，再用 `openclaw channels login` 重新連結。
- 閘道無法連線 → 啟動它：`openclaw gateway --port 18789`（若連接埠忙碌，請使用 `--force`）。
- 沒有傳入訊息 → 確認已連結手機在線上，且寄件者已被允許（`channels.whatsapp.allowFrom`）；若是群組聊天，請確保允許清單 + 提及規則相符（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 專用的「健康」命令

`openclaw health` 會要求執行中的閘道提供其健康快照（命令列介面 不會直接開啟頻道
socket）。預設情況下，它可回傳新的快取閘道快照；閘道接著會在背景
重新整理該快取。`openclaw health --verbose` 則會強制執行
即時探測。此命令會在可用時回報已連結憑證/授權年齡、
逐頻道探測摘要、工作階段存放區摘要與探測持續時間。若閘道無法連線，或探測失敗/逾時，它會以
非零狀態結束。

選項：

- `--json`：機器可讀的 JSON 輸出
- `--timeout <ms>`：覆寫預設 10 秒探測逾時
- `--verbose`：強制執行即時探測並列印閘道連線詳細資訊
- `--debug`：`--verbose` 的別名

健康快照包含：`ok`（布林值）、`ts`（時間戳記）、`durationMs`（探測時間）、逐頻道狀態、代理可用性，以及工作階段存放區摘要。

## 相關

- [閘道操作手冊](/zh-TW/gateway)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
