---
read_when:
    - 診斷通道連線或 Gateway 健康狀態
    - 了解健康檢查 CLI 指令與選項
summary: 健康檢查命令與 Gateway 健康監控
title: 健康檢查
x-i18n:
    generated_at: "2026-04-30T03:06:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: f34b91ef5d54b0fac7c451e46e07d36520a7d08fb0dce0538c6158d0bc6982b8
    source_path: gateway/health.md
    workflow: 16
---

不用猜測即可驗證頻道連線能力的簡短指南。

## 快速檢查

- `openclaw status` — 本機摘要：gateway 可達性/模式、更新提示、已連結頻道驗證年齡、工作階段與近期活動。
- `openclaw status --all` — 完整本機診斷（唯讀、有顏色、可安全貼上供偵錯使用）。
- `openclaw status --deep` — 要求執行中的 gateway 進行即時健康探測（`health` 搭配 `probe:true`），支援時包含各帳號頻道探測。
- `openclaw health` — 要求執行中的 gateway 提供其健康快照（僅限 WS；CLI 不會直接建立頻道 socket）。
- `openclaw health --verbose` — 強制進行即時健康探測，並列印 gateway 連線詳細資料。
- `openclaw health --json` — 機器可讀的健康快照輸出。
- 在 WhatsApp/WebChat 中以獨立訊息傳送 `/status`，即可取得狀態回覆而不會呼叫代理。
- 記錄：追蹤 `/tmp/openclaw/openclaw-*.log`，並篩選 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound`。

## 深度診斷

- 磁碟上的憑證：`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（mtime 應該是最近的）。
- 工作階段存放區：`ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（路徑可在設定中覆寫）。計數與近期收件者會透過 `status` 顯示。
- 重新連結流程：當狀態碼 409–515 或記錄中出現 `loggedOut` 時，執行 `openclaw channels logout && openclaw channels login --verbose`。（注意：QR 登入流程在配對後遇到狀態 515 時會自動重新啟動一次。）
- 診斷預設為啟用。除非設定 `diagnostics.enabled: false`，否則 gateway 會記錄操作事實。記憶體事件會記錄 RSS/heap 位元組數、臨界壓力與成長壓力。當程序仍在執行但已飽和時，存活性警告會記錄事件迴圈延遲、事件迴圈使用率、CPU 核心比率，以及作用中/等待中/佇列中的工作階段數量。超大承載事件會記錄被拒絕、截斷或分塊的項目，以及可用時的大小與限制。它們不會記錄訊息文字、附件內容、webhook 內文、原始請求或回應內文、token、cookie 或秘密值。同一個 Heartbeat 會啟動有界穩定性記錄器，可透過 `openclaw gateway stability` 或 `diagnostics.stability` Gateway RPC 取得。當事件存在時，致命 Gateway 結束、關機逾時與重新啟動啟動失敗，會將最新記錄器快照保存到 `~/.openclaw/logs/stability/`；使用 `openclaw gateway stability --bundle latest` 檢查最新儲存的套件。
- 回報錯誤時，請執行 `openclaw gateway diagnostics export` 並附上產生的 zip。匯出內容會合併 Markdown 摘要、最新穩定性套件、已清理的記錄中繼資料、已清理的 Gateway 狀態/健康快照，以及設定形狀。它設計為可供分享：聊天文字、webhook 內文、工具輸出、憑證、cookie、帳號/訊息識別碼與秘密值都會被省略或遮蔽。請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

## 健康監控設定

- `gateway.channelHealthCheckMinutes`：gateway 檢查頻道健康狀態的頻率。預設值：`5`。設為 `0` 可全域停用健康監控重新啟動。
- `gateway.channelStaleEventThresholdMinutes`：已連線頻道可保持閒置多久，健康監控才會將其視為過期並重新啟動。預設值：`30`。請保持此值大於或等於 `gateway.channelHealthCheckMinutes`。
- `gateway.channelMaxRestartsPerHour`：每個頻道/帳號在滾動一小時內的健康監控重新啟動上限。預設值：`10`。
- `channels.<provider>.healthMonitor.enabled`：停用特定頻道的健康監控重新啟動，同時保留全域監控啟用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多帳號覆寫，優先於頻道層級設定。
- 這些逐頻道覆寫適用於目前公開它們的內建頻道監控：Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram 和 WhatsApp。

## 發生失敗時

- `logged out` 或狀態 409–515 → 先執行 `openclaw channels logout`，再執行 `openclaw channels login` 重新連結。
- Gateway 無法連線 → 啟動它：`openclaw gateway --port 18789`（如果連接埠忙碌，請使用 `--force`）。
- 沒有傳入訊息 → 確認已連結手機在線上且寄件者被允許（`channels.whatsapp.allowFrom`）；若是群組聊天，請確認允許清單與提及規則相符（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 專用的「health」命令

`openclaw health` 會要求執行中的 gateway 提供其健康快照（CLI 不會直接建立頻道
socket）。預設情況下，它可以回傳新的快取 gateway 快照；接著
gateway 會在背景重新整理該快取。`openclaw health --verbose` 則會強制
進行即時探測。此命令會在可用時回報已連結憑證/驗證年齡、
各頻道探測摘要、工作階段存放區摘要與探測耗時。如果 gateway 無法連線，或探測失敗/逾時，它會以
非零狀態結束。

選項：

- `--json`：機器可讀的 JSON 輸出
- `--timeout <ms>`：覆寫預設 10 秒探測逾時
- `--verbose`：強制進行即時探測並列印 gateway 連線詳細資料
- `--debug`：`--verbose` 的別名

健康快照包含：`ok`（布林值）、`ts`（時間戳記）、`durationMs`（探測時間）、各頻道狀態、代理可用性，以及工作階段存放區摘要。

## 相關

- [Gateway 操作手冊](/zh-TW/gateway)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
