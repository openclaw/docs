---
read_when:
    - 準備錯誤報告或支援請求
    - 偵錯 Gateway 當機、重新啟動、記憶體壓力或過大的酬載
    - 檢視哪些診斷資料會被記錄或遮蔽
summary: 建立可分享的 Gateway 診斷套件以供錯誤回報使用
title: 診斷匯出
x-i18n:
    generated_at: "2026-04-30T03:05:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: e66f1391da77e531b5d3b0ed19600da222d80960d1b6e54d51925c04b06dae46
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw 可以為錯誤回報建立本機診斷 zip。它會合併經過清理的 Gateway 狀態、健康狀態、記錄、設定形狀，以及近期不含負載的穩定性事件。

在你審閱之前，請把診斷套件視為秘密資料。它們設計上會省略或遮蔽負載與憑證，但仍會摘要本機 Gateway 記錄與主機層級的執行階段狀態。

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

擁有者可以在聊天中使用 `/diagnostics [note]` 來要求本機 Gateway 匯出。當錯誤發生在真實對話中，而你想要一份可複製貼上的支援回報時，請使用此命令：

1. 在你注意到問題的對話中傳送 `/diagnostics`。如果有幫助，可以加上一段簡短備註，例如 `/diagnostics bad tool choice`。
2. OpenClaw 會傳送診斷前言，並要求一次明確的 exec 核准。此核准會執行 `openclaw gateway diagnostics export --json`。不要透過允許所有項目的規則核准診斷。
3. 核准後，OpenClaw 會回覆一份可貼上的回報，其中包含本機套件路徑、manifest 摘要、隱私注意事項，以及相關 session id。

在群組聊天中，擁有者仍可執行 `/diagnostics`，但 OpenClaw 不會把診斷詳細資料傳回共享聊天。它會透過私人核准路由，將前言、核准提示、Gateway 匯出結果，以及 Codex session/thread 明細傳送給擁有者。群組只會收到一則簡短通知，表示診斷流程已私下傳送。如果 OpenClaw 找不到私人擁有者路由，此命令會安全失敗，並要求擁有者從 DM 執行。

當作用中的 OpenClaw session 使用原生 OpenAI Codex harness 時，同一個 exec 核准也會涵蓋針對 OpenClaw 已知 Codex 執行階段 thread 的 OpenAI feedback 上傳。該上傳與本機 Gateway zip 分開，且只會出現在 Codex harness session 中。核准前，提示會說明核准診斷也會傳送 Codex feedback，但不會列出 Codex session 或 thread id。核准後，聊天回覆會列出已傳送到 OpenAI 伺服器的 channel、OpenClaw session id、Codex thread id，以及本機 resume 命令。如果你拒絕或忽略核准，OpenClaw 不會執行匯出、不會傳送 Codex feedback，也不會列印 Codex id。

這讓常見的 Codex 偵錯流程變短：在 Telegram、Discord 或其他 channel 中注意到不良行為，執行 `/diagnostics`，核准一次，與支援團隊分享回報，然後如果你想自行檢查原生 Codex thread，就在本機執行列印出的 `codex resume <thread-id>` 命令。請參閱 [Codex harness](/zh-TW/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) 了解該檢查工作流程。

## 匯出內容

zip 包含：

- `summary.md`：提供給支援人員的人類可讀概覽。
- `diagnostics.json`：設定、記錄、狀態、健康狀態與穩定性資料的機器可讀摘要。
- `manifest.json`：匯出中繼資料與檔案清單。
- 經過清理的設定形狀與非秘密設定詳細資料。
- 經過清理的記錄摘要與近期已遮蔽的記錄行。
- 盡力取得的 Gateway 狀態與健康狀態快照。
- `stability/latest.json`：可用時為最新保存的穩定性套件。

即使 Gateway 不健康，匯出仍然有用。如果 Gateway 無法回應狀態或健康狀態要求，仍會在可用時收集本機記錄、設定形狀，以及最新穩定性套件。

## 隱私模型

診斷設計為可分享。匯出會保留有助於偵錯的作業資料，例如：

- 子系統名稱、plugin id、provider id、channel id，以及已設定的模式
- 狀態碼、持續時間、位元組數、佇列狀態，以及記憶體讀數
- 經過清理的記錄中繼資料與已遮蔽的作業訊息
- 設定形狀與非秘密功能設定

匯出會省略或遮蔽：

- 聊天文字、提示、指示、webhook body，以及工具輸出
- 憑證、API key、token、cookie，以及秘密值
- 原始 request 或 response body
- account id、message id、原始 session id、hostname，以及本機使用者名稱

當記錄訊息看起來像使用者、聊天、提示或工具負載文字時，匯出只會保留有訊息被省略的事實與位元組數。

## 穩定性記錄器

當診斷啟用時，Gateway 預設會記錄有界且不含負載的穩定性串流。它用於作業事實，而非內容。

同一個診斷 Heartbeat 會在 Gateway 持續執行但 Node.js event loop 或 CPU 看起來飽和時記錄存活性警告。這些 `diagnostic.liveness.warning` 事件包含 event-loop delay、event-loop utilization、CPU-core ratio，以及 active/waiting/queued session counts。它們不會自行重新啟動 Gateway。

檢查即時記錄器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

在 fatal exit、shutdown timeout 或 restart startup failure 後，檢查最新保存的穩定性套件：

```bash
openclaw gateway stability --bundle latest
```

從最新保存的套件建立診斷 zip：

```bash
openclaw gateway stability --bundle latest --export
```

保存的套件在事件存在時位於 `~/.openclaw/logs/stability/` 下。

## 實用選項

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`：寫入到指定的 zip 路徑。
- `--log-lines <count>`：要包含的已清理記錄行數上限。
- `--log-bytes <bytes>`：要檢查的記錄位元組數上限。
- `--url <url>`：用於狀態與健康狀態快照的 Gateway WebSocket URL。
- `--token <token>`：用於狀態與健康狀態快照的 Gateway token。
- `--password <password>`：用於狀態與健康狀態快照的 Gateway password。
- `--timeout <ms>`：狀態與健康狀態快照逾時。
- `--no-stability-bundle`：略過保存的穩定性套件查詢。
- `--json`：列印機器可讀的匯出中繼資料。

## 停用診斷

診斷預設啟用。若要停用穩定性記錄器與診斷事件收集：

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

停用診斷會減少錯誤回報細節。它不會影響一般 Gateway 記錄。

## 相關

- [健康狀態檢查](/zh-TW/gateway/health)
- [Gateway CLI](/zh-TW/cli/gateway#gateway-diagnostics-export)
- [Gateway protocol](/zh-TW/gateway/protocol#system-and-identity)
- [記錄](/zh-TW/logging)
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — 將診斷串流到 collector 的獨立流程
