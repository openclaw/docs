---
read_when:
    - 診斷通道連線能力或 Gateway 健康狀態
    - 了解健康檢查 CLI 指令與選項
summary: 健康檢查命令與 Gateway 健康狀態監控
title: 健康檢查
x-i18n:
    generated_at: "2026-05-02T20:47:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf1e0073a09592c6502f697e615f44d0f1a960caf4599888a8b72f22098c1e91
    source_path: gateway/health.md
    workflow: 16
---

確認頻道連線能力、不靠猜測的簡短指南。

## 快速檢查

- `openclaw status` — 本機摘要：Gateway 可達性/模式、更新提示、已連結頻道授權年齡、工作階段 + 近期活動。
- `openclaw status --all` — 完整本機診斷（唯讀、有色彩，可安全貼上供除錯）。
- `openclaw status --deep` — 要求執行中的 Gateway 進行即時健康探測（`health` 搭配 `probe:true`），支援時包含每個帳號的頻道探測。
- `openclaw health` — 要求執行中的 Gateway 提供其健康快照（僅限 WS；CLI 不會直接開啟頻道 socket）。
- `openclaw health --verbose` — 強制即時健康探測，並列印 Gateway 連線詳細資料。
- `openclaw health --json` — 機器可讀的健康快照輸出。
- 在 WhatsApp/WebChat 中以獨立訊息傳送 `/status`，即可取得狀態回覆而不叫用代理程式。
- 日誌：tail `/tmp/openclaw/openclaw-*.log`，並篩選 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound`。

對於 Discord 和其他聊天提供者，工作階段列不代表 socket 存活狀態。
`openclaw sessions`、Gateway `sessions.list`，以及代理程式 `sessions_list` 工具
會讀取已儲存的對話狀態。提供者可以重新連線並顯示健康的頻道狀態，
而新的工作階段列尚未具體化。請使用上述頻道狀態與健康命令進行即時連線能力檢查。

## 深入診斷

- 磁碟上的認證：`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（mtime 應為近期）。
- 工作階段存放區：`ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（路徑可在設定中覆寫）。計數與近期收件者會透過 `status` 顯示。
- 重新連結流程：當狀態碼 409–515 或日誌中出現 `loggedOut` 時，執行 `openclaw channels logout && openclaw channels login --verbose`。（注意：QR 登入流程在配對後遇到狀態 515 會自動重新啟動一次。）
- 診斷預設為啟用。除非設定了 `diagnostics.enabled: false`，否則 Gateway 會記錄作業事實。記憶體事件會記錄 RSS/heap 位元組數、臨界值壓力與成長壓力。存活警告會在程序仍在執行但已飽和時，記錄事件迴圈延遲、事件迴圈使用率、CPU 核心比例，以及作用中/等待中/佇列中的工作階段數量。過大承載事件會記錄被拒絕、截斷或分塊的內容，以及可用時的大小與限制。它們不會記錄訊息文字、附件內容、Webhook 主體、原始請求或回應主體、token、cookie 或秘密值。同一個 Heartbeat 會啟動有界穩定性記錄器，可透過 `openclaw gateway stability` 或 `diagnostics.stability` Gateway RPC 使用。發生事件時，致命 Gateway 結束、關機逾時與重新啟動時的啟動失敗會將最新記錄器快照保存在 `~/.openclaw/logs/stability/`；使用 `openclaw gateway stability --bundle latest` 檢查最新儲存的套件。
- 回報錯誤時，請執行 `openclaw gateway diagnostics export` 並附上產生的 zip。匯出內容會結合 Markdown 摘要、最新穩定性套件、已清理的日誌中繼資料、已清理的 Gateway 狀態/健康快照，以及設定形狀。它是為共享而設計：聊天文字、Webhook 主體、工具輸出、認證、cookie、帳號/訊息識別碼與秘密值都會被省略或遮蔽。請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

## 健康監控設定

- `gateway.channelHealthCheckMinutes`：Gateway 檢查頻道健康狀態的頻率。預設值：`5`。設為 `0` 可全域停用健康監控重新啟動。
- `gateway.channelStaleEventThresholdMinutes`：已連線頻道可維持閒置多久，之後健康監控會將其視為過期並重新啟動。預設值：`30`。請讓此值大於或等於 `gateway.channelHealthCheckMinutes`。
- `gateway.channelMaxRestartsPerHour`：每個頻道/帳號在滾動一小時內由健康監控重新啟動的上限。預設值：`10`。
- `channels.<provider>.healthMonitor.enabled`：停用特定頻道的健康監控重新啟動，同時保留全域監控啟用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多帳號覆寫，優先於頻道層級設定。
- 這些每頻道覆寫會套用至今日公開它們的內建頻道監控：Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram 和 WhatsApp。

## 發生失敗時

- `logged out` 或狀態 409–515 → 先用 `openclaw channels logout` 再用 `openclaw channels login` 重新連結。
- Gateway 無法連線 → 啟動它：`openclaw gateway --port 18789`（若連接埠忙碌，使用 `--force`）。
- 沒有傳入訊息 → 確認已連結的手機在線上，且寄件者被允許（`channels.whatsapp.allowFrom`）；若為群組聊天，請確保允許清單 + 提及規則相符（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 專用的「health」命令

`openclaw health` 會要求執行中的 Gateway 提供其健康快照（CLI 不會直接開啟頻道
socket）。預設情況下，它可以回傳新的已快取 Gateway 快照；接著
Gateway 會在背景重新整理該快取。`openclaw health --verbose` 則會強制
進行即時探測。此命令會在可用時回報已連結認證/授權年齡、
每頻道探測摘要、工作階段存放區摘要與探測持續時間。如果 Gateway 無法連線，或探測失敗/逾時，它會以
非零狀態結束。

選項：

- `--json`：機器可讀的 JSON 輸出
- `--timeout <ms>`：覆寫預設的 10s 探測逾時
- `--verbose`：強制即時探測，並列印 Gateway 連線詳細資料
- `--debug`：`--verbose` 的別名

健康快照包含：`ok`（布林值）、`ts`（時間戳記）、`durationMs`（探測時間）、每頻道狀態、代理程式可用性與工作階段存放區摘要。

## 相關

- [Gateway 執行手冊](/zh-TW/gateway)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
