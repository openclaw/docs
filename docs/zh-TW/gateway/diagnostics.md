---
read_when:
    - 準備錯誤報告或支援請求
    - 偵錯 Gateway 當機、重新啟動、記憶體壓力或過大的酬載
    - 檢視哪些診斷資料會被記錄或遮蔽
summary: 建立可分享的 Gateway 診斷套件，用於錯誤報告
title: 診斷資料匯出
x-i18n:
    generated_at: "2026-05-05T01:46:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56539280bc7a7868063328626e63b2576feb5578e2651d3a2976ee9c34243382
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw 可以為錯誤回報建立本機診斷 zip。它會合併
經過清理的 Gateway 狀態、健康狀態、記錄、設定形狀，以及近期不含酬載的
穩定性事件。

在你檢視診斷封包之前，請將其視為機密。它們的設計會省略或遮蔽酬載與憑證，
但仍會摘要本機 Gateway 記錄與主機層級的執行階段狀態。

## 快速開始

```bash
openclaw gateway diagnostics export
```

此命令會列印寫入的 zip 路徑。若要選擇路徑：

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

用於自動化：

```bash
openclaw gateway diagnostics export --json
```

## 聊天命令

擁有者可以在聊天中使用 `/diagnostics [note]` 來要求匯出本機 Gateway。
當錯誤發生在真實對話中，且你希望取得一份可複製貼上的支援回報時，
請使用此命令：

1. 在你注意到問題的對話中傳送 `/diagnostics`。如果有幫助，可以加入
   簡短備註，例如 `/diagnostics bad tool choice`。
2. OpenClaw 會傳送診斷前言，並要求一次明確的 exec 核准。
   該核准會執行 `openclaw gateway diagnostics export --json`。
   不要透過允許全部的規則核准診斷。
3. 核准後，OpenClaw 會回覆一份可貼上的回報，其中包含本機封包路徑、
   manifest 摘要、隱私注意事項，以及相關工作階段 ID。

在群組聊天中，擁有者仍可執行 `/diagnostics`，但 OpenClaw 不會
將診斷詳細資料貼回共享聊天。它會透過私有核准路由，將前言、核准提示、
Gateway 匯出結果，以及 Codex 工作階段/執行緒明細傳送給擁有者。
群組只會收到一則簡短通知，表示診斷流程已私下傳送。如果 OpenClaw 找不到
私有擁有者路由，該命令會安全失敗，並要求擁有者從 DM 執行。

當作用中的 OpenClaw 工作階段正在使用原生 OpenAI Codex 框架時，
同一個 exec 核准也會涵蓋針對 OpenClaw 已知 Codex 執行階段執行緒的
OpenAI 意見回饋上傳。該上傳與本機 Gateway zip 分開，且只會出現在
Codex 框架工作階段中。核准前，提示會說明核准診斷也會傳送 Codex
意見回饋，但不會列出 Codex 工作階段或執行緒 ID。核准後，聊天回覆會列出
已傳送到 OpenAI 伺服器的頻道、OpenClaw 工作階段 ID、Codex 執行緒 ID，
以及本機繼續命令。如果你拒絕或忽略核准，OpenClaw 不會執行匯出、
不會傳送 Codex 意見回饋，也不會列印 Codex ID。

這讓常見的 Codex 偵錯循環很短：在 Telegram、Discord 或其他頻道中
注意到不良行為，執行 `/diagnostics`，核准一次，將回報分享給支援人員，
然後如果你想自行檢查原生 Codex 執行緒，就在本機執行列印出的
`codex resume <thread-id>` 命令。該檢查工作流程請參閱
[Codex 框架](/zh-TW/plugins/codex-harness#inspect-a-codex-thread-from-the-cli)。

## 匯出內容

此 zip 包含：

- `summary.md`：供支援人員閱讀的人類可讀概覽。
- `diagnostics.json`：設定、記錄、狀態、健康狀態與穩定性資料的機器可讀摘要。
- `manifest.json`：匯出中繼資料與檔案清單。
- 經過清理的設定形狀與非機密設定細節。
- 經過清理的記錄摘要，以及近期已遮蔽的記錄行。
- 盡力取得的 Gateway 狀態與健康快照。
- `stability/latest.json`：可用時的最新持久化穩定性封包。

即使 Gateway 不健康，匯出仍然有用。如果 Gateway 無法回應狀態或健康請求，
仍會在可用時收集本機記錄、設定形狀與最新穩定性封包。

## 隱私模型

診斷的設計目標是可供分享。匯出會保留有助於偵錯的操作資料，例如：

- 子系統名稱、Plugin ID、供應商 ID、頻道 ID，以及已設定的模式
- 狀態碼、持續時間、位元組數、佇列狀態，以及記憶體讀數
- 經過清理的記錄中繼資料，以及已遮蔽的操作訊息
- 設定形狀與非機密功能設定

匯出會省略或遮蔽：

- 聊天文字、提示、指令、Webhook 內文，以及工具輸出
- 憑證、API 金鑰、權杖、Cookie，以及機密值
- 原始請求或回應內文
- 帳號 ID、訊息 ID、原始工作階段 ID、主機名稱，以及本機使用者名稱

當記錄訊息看起來像使用者、聊天、提示或工具酬載文字時，
匯出只會保留訊息已被省略，以及位元組數。

## 穩定性記錄器

當診斷啟用時，Gateway 預設會記錄有界且不含酬載的穩定性串流。
它用於操作事實，而不是內容。

當 Gateway 持續執行，但 Node.js 事件迴圈或 CPU 看似飽和時，
同一個診斷 Heartbeat 會記錄存活性樣本。這些
`diagnostic.liveness.warning` 事件包含事件迴圈延遲、事件迴圈使用率、
CPU 核心比率、作用中/等待中/已佇列的工作階段數、已知時的目前啟動/執行階段階段、
近期階段區間，以及有界的作用中/已佇列工作標籤。閒置樣本會以 `info`
層級保留在遙測中。只有當工作正在等待或已佇列，或作用中工作與持續事件迴圈延遲重疊時，
存活性樣本才會成為 Gateway 警告。在其他方面健康的背景工作期間發生的短暫最大延遲尖峰，
會保留在除錯記錄中。它們本身不會重新啟動 Gateway。

啟動階段也會發出 `diagnostic.phase.completed` 事件，其中包含牆鐘時間與
CPU 計時。停滯的內嵌執行診斷會在最後一次橋接進度看似終止時，
例如原始回應項目或回應完成事件，但 Gateway 仍認為內嵌執行處於作用中，
標記 `terminalProgressStale=true`。

檢查即時記錄器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

在致命結束、關閉逾時或重新啟動啟動失敗後，檢查最新的持久化穩定性封包：

```bash
openclaw gateway stability --bundle latest
```

從最新的持久化封包建立診斷 zip：

```bash
openclaw gateway stability --bundle latest --export
```

當事件存在時，持久化封包會位於 `~/.openclaw/logs/stability/` 之下。

## 實用選項

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`：寫入特定 zip 路徑。
- `--log-lines <count>`：要包含的最大清理後記錄行數。
- `--log-bytes <bytes>`：要檢查的最大記錄位元組數。
- `--url <url>`：用於狀態與健康快照的 Gateway WebSocket URL。
- `--token <token>`：用於狀態與健康快照的 Gateway 權杖。
- `--password <password>`：用於狀態與健康快照的 Gateway 密碼。
- `--timeout <ms>`：狀態與健康快照逾時。
- `--no-stability-bundle`：略過持久化穩定性封包查詢。
- `--json`：列印機器可讀的匯出中繼資料。

## 停用診斷

診斷預設為啟用。若要停用穩定性記錄器與診斷事件收集：

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

停用診斷會減少錯誤回報細節。它不會影響一般 Gateway 記錄。

## 相關

- [健康檢查](/zh-TW/gateway/health)
- [Gateway CLI](/zh-TW/cli/gateway#gateway-diagnostics-export)
- [Gateway protocol](/zh-TW/gateway/protocol#system-and-identity)
- [記錄](/zh-TW/logging)
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — 將串流診斷傳送到收集器的獨立流程
