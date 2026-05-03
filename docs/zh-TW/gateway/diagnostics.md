---
read_when:
    - 準備錯誤報告或支援請求
    - 偵錯 Gateway 當機、重新啟動、記憶體壓力或過大的承載資料
    - 檢閱已記錄或已遮蔽的診斷資料
summary: 建立可分享的 Gateway 診斷資料包以供錯誤回報
title: 診斷資料匯出
x-i18n:
    generated_at: "2026-05-03T21:32:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6cf8e00fe8033e339b5c947ce3dd10fdee736048a358ad3a0c2ccb77e939f4b
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw 可以建立本機診斷 zip，供錯誤回報使用。它會合併經過清理的 Gateway 狀態、健康狀態、日誌、設定形狀，以及最近不含承載資料的穩定性事件。

在你檢閱之前，請把診斷套件視為秘密資訊。它們設計上會省略或遮蔽承載資料與憑證，但仍會摘要本機 Gateway 日誌與主機層級的執行階段狀態。

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

擁有者可以在聊天中使用 `/diagnostics [note]` 來要求本機 Gateway 匯出。當錯誤發生在真實對話中，而你想要一份可複製貼上的支援回報時，請使用此方式：

1. 在你注意到問題的對話中傳送 `/diagnostics`。如果有幫助，可以加上一段簡短註記，例如 `/diagnostics bad tool choice`。
2. OpenClaw 會傳送診斷前言，並要求一次明確的 exec 核准。該核准會執行 `openclaw gateway diagnostics export --json`。請勿透過全部允許規則核准診斷。
3. 核准後，OpenClaw 會回覆一份可貼上的報告，其中包含本機套件路徑、清單摘要、隱私權註記，以及相關工作階段 ID。

在群組聊天中，擁有者仍可執行 `/diagnostics`，但 OpenClaw 不會把診斷詳細資料發回共用聊天。它會透過私人核准路徑，將前言、核准提示、Gateway 匯出結果，以及 Codex 工作階段/執行緒明細傳送給擁有者。群組只會收到一則簡短通知，說明診斷流程已私下傳送。如果 OpenClaw 找不到私人的擁有者路徑，命令會以關閉方式失敗，並要求擁有者從 DM 執行它。

當作用中的 OpenClaw 工作階段使用原生 OpenAI Codex harness 時，同一次 exec 核准也會涵蓋針對 OpenClaw 所知 Codex 執行階段執行緒的 OpenAI 回饋上傳。該上傳與本機 Gateway zip 分開，而且只會出現在 Codex harness 工作階段。核准前，提示會說明核准診斷也會傳送 Codex 回饋，但不會列出 Codex 工作階段或執行緒 ID。核准後，聊天回覆會列出已傳送到 OpenAI 伺服器的頻道、OpenClaw 工作階段 ID、Codex 執行緒 ID，以及本機續用命令。如果你拒絕或忽略核准，OpenClaw 不會執行匯出、不會傳送 Codex 回饋，也不會列印 Codex ID。

這讓常見的 Codex 偵錯迴圈變得很短：在 Telegram、Discord 或其他頻道中注意到不良行為，執行 `/diagnostics`，核准一次，將報告分享給支援人員，接著如果你想自行檢查原生 Codex 執行緒，就在本機執行列印出的 `codex resume <thread-id>` 命令。該檢查工作流程請參閱 [Codex harness](/zh-TW/plugins/codex-harness#inspect-a-codex-thread-from-the-cli)。

## 匯出內容

zip 包含：

- `summary.md`：供支援人員閱讀的人類可讀概覽。
- `diagnostics.json`：設定、日誌、狀態、健康狀態與穩定性資料的機器可讀摘要。
- `manifest.json`：匯出中繼資料與檔案清單。
- 經清理的設定形狀與非秘密設定詳細資料。
- 經清理的日誌摘要與最近經遮蔽的日誌行。
- 盡力而為的 Gateway 狀態與健康狀態快照。
- `stability/latest.json`：可用時，最新保存的穩定性套件。

即使 Gateway 不健康，此匯出仍很有用。如果 Gateway 無法回應狀態或健康狀態請求，本機日誌、設定形狀與最新穩定性套件仍會在可用時被收集。

## 隱私權模型

診斷設計為可分享。匯出會保留有助於偵錯的操作資料，例如：

- 子系統名稱、Plugin ID、提供者 ID、頻道 ID，以及已設定的模式
- 狀態碼、持續時間、位元組計數、佇列狀態與記憶體讀數
- 經清理的日誌中繼資料與經遮蔽的操作訊息
- 設定形狀與非秘密功能設定

匯出會省略或遮蔽：

- 聊天文字、提示、指示、Webhook 內文與工具輸出
- 憑證、API 金鑰、權杖、Cookie 與秘密值
- 原始請求或回應內文
- 帳號 ID、訊息 ID、原始工作階段 ID、主機名稱與本機使用者名稱

當日誌訊息看起來像使用者、聊天、提示或工具承載文字時，匯出只會保留某則訊息已被省略以及位元組計數。

## 穩定性記錄器

啟用診斷時，Gateway 預設會記錄一個有界且不含承載資料的穩定性串流。它用於操作事實，而不是內容。

當 Gateway 持續執行但 Node.js 事件迴圈或 CPU 看起來飽和時，同一個診斷 Heartbeat 會記錄存活性樣本。這些 `diagnostic.liveness.warning` 事件包含事件迴圈延遲、事件迴圈使用率、CPU 核心比率，以及作用中/等待中/已佇列的工作階段計數。閒置樣本會以 `info` 層級保留在遙測中。只有在工作正在等待或佇列中，或作用中工作與持續事件迴圈延遲重疊時，存活性樣本才會成為 Gateway 警告。在其他健康的背景工作期間，短暫的最大延遲尖峰會留在偵錯日誌中。它們本身不會重新啟動 Gateway。

檢查即時記錄器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

在致命結束、關機逾時或重新啟動啟動失敗後，檢查最新保存的穩定性套件：

```bash
openclaw gateway stability --bundle latest
```

從最新保存的套件建立診斷 zip：

```bash
openclaw gateway stability --bundle latest --export
```

當事件存在時，保存的套件位於 `~/.openclaw/logs/stability/` 之下。

## 實用選項

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`：寫入特定 zip 路徑。
- `--log-lines <count>`：要包含的最大清理後日誌行數。
- `--log-bytes <bytes>`：要檢查的最大日誌位元組數。
- `--url <url>`：用於狀態與健康狀態快照的 Gateway WebSocket URL。
- `--token <token>`：用於狀態與健康狀態快照的 Gateway 權杖。
- `--password <password>`：用於狀態與健康狀態快照的 Gateway 密碼。
- `--timeout <ms>`：狀態與健康狀態快照逾時。
- `--no-stability-bundle`：略過保存的穩定性套件查詢。
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

停用診斷會減少錯誤回報細節。它不會影響一般 Gateway 日誌記錄。

## 相關

- [健康檢查](/zh-TW/gateway/health)
- [Gateway CLI](/zh-TW/cli/gateway#gateway-diagnostics-export)
- [Gateway protocol](/zh-TW/gateway/protocol#system-and-identity)
- [日誌記錄](/zh-TW/logging)
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — 將診斷串流到收集器的獨立流程
