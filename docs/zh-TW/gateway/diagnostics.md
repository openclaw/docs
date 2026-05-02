---
read_when:
    - 準備錯誤報告或支援請求
    - 偵錯 Gateway 當機、重新啟動、記憶體壓力或過大的酬載
    - 檢視哪些診斷資料會被記錄或遮蔽
summary: 建立可分享的 Gateway 診斷套件以用於錯誤回報
title: 診斷資料匯出
x-i18n:
    generated_at: "2026-05-02T20:47:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f7c1e1d96aeeebe30b30c8a23ec3c7b0fb4938f15a3783bf22e861770bf78
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw 可以建立本機診斷 zip 供錯誤回報使用。它會合併
已清理的 Gateway 狀態、健康狀態、日誌、設定形狀，以及近期不含承載內容的
穩定性事件。

在你檢閱之前，請把診斷套件視為秘密資訊。它們的設計會省略或修訂承載內容與憑證，
但仍會摘要本機 Gateway 日誌與主機層級執行階段狀態。

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

擁有者可以在聊天中使用 `/diagnostics [note]` 來要求本機 Gateway 匯出。
當錯誤發生在真實對話中，而且你想要一份可複製貼上的支援回報時，請使用此命令：

1. 在你注意到問題的對話中傳送 `/diagnostics`。如果有幫助，可加入簡短備註，
   例如 `/diagnostics bad tool choice`。
2. OpenClaw 會傳送診斷前言，並要求一次明確的 exec 核准。
   核准會執行 `openclaw gateway diagnostics export --json`。
   不要透過允許全部的規則核准診斷。
3. 核准後，OpenClaw 會回覆一份可貼上的回報，內容包含本機套件路徑、資訊清單摘要、
   隱私注意事項，以及相關 session id。

在群組聊天中，擁有者仍可執行 `/diagnostics`，但 OpenClaw 不會
把診斷詳細資料貼回共用聊天。它會透過私人核准路徑，將前言、
核准提示、Gateway 匯出結果，以及 Codex session/thread 細分傳送給擁有者。
群組只會收到一則簡短通知，說明診斷流程已私下傳送。如果 OpenClaw 找不到私人
擁有者路徑，此命令會安全失敗，並要求擁有者從 DM 執行。

當作用中的 OpenClaw session 使用原生 OpenAI Codex harness 時，
同一次 exec 核准也會涵蓋 OpenClaw 已知 Codex 執行階段 thread 的 OpenAI 回饋上傳。
該上傳與本機 Gateway zip 分開，且只會出現在 Codex harness session 中。
核准前，提示會說明核准診斷也會傳送 Codex 回饋，但不會列出 Codex session 或 thread id。
核准後，聊天回覆會列出已傳送到 OpenAI 伺服器的 thread 所屬 channel、OpenClaw session id、
Codex thread id，以及本機 resume 命令。如果你拒絕或忽略核准，OpenClaw 不會執行匯出、
不會傳送 Codex 回饋，也不會列印 Codex id。

這讓常見的 Codex 偵錯循環變得簡短：在 Telegram、Discord 或其他 channel 中注意到不良行為，
執行 `/diagnostics`，核准一次，與支援團隊分享回報，接著如果你想自行檢查原生 Codex thread，
就在本機執行列印出的 `codex resume <thread-id>` 命令。請參閱
[Codex 執行框架](/zh-TW/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) 了解該檢查工作流程。

## 匯出包含的內容

此 zip 包含：

- `summary.md`：供支援使用的人類可讀概覽。
- `diagnostics.json`：設定、日誌、狀態、健康狀態與穩定性資料的機器可讀摘要。
- `manifest.json`：匯出中繼資料與檔案清單。
- 已清理的設定形狀與非秘密設定詳細資料。
- 已清理的日誌摘要與近期已修訂的日誌行。
- 盡力擷取的 Gateway 狀態與健康狀態快照。
- `stability/latest.json`：可用時，最新的持久化穩定性套件。

即使 Gateway 不健康，此匯出也很有用。如果 Gateway 無法回應狀態或健康狀態要求，
本機日誌、設定形狀與最新穩定性套件仍會在可用時被收集。

## 隱私模型

診斷的設計是可分享的。匯出會保留有助於偵錯的操作資料，例如：

- 子系統名稱、plugin id、provider id、channel id，以及已設定的模式
- 狀態碼、持續時間、位元組計數、佇列狀態與記憶體讀數
- 已清理的日誌中繼資料與已修訂的操作訊息
- 設定形狀與非秘密功能設定

匯出會省略或修訂：

- 聊天文字、提示、指令、webhook 內容主體與工具輸出
- 憑證、API 金鑰、token、cookie 與秘密值
- 原始要求或回應內容主體
- 帳號 id、訊息 id、原始 session id、主機名稱與本機使用者名稱

當日誌訊息看起來像使用者、聊天、提示或工具承載文字時，
匯出只會保留該訊息已被省略以及位元組計數。

## 穩定性記錄器

啟用診斷時，Gateway 預設會記錄有界且不含承載內容的穩定性串流。
它用於操作事實，而不是內容。

當 Gateway 持續執行但 Node.js 事件迴圈或 CPU 看起來飽和時，
同一個診斷 Heartbeat 會記錄活性樣本。這些 `diagnostic.liveness.warning` 事件包含事件迴圈延遲、
事件迴圈使用率、CPU 核心比率，以及作用中/等待中/已佇列的 session 數量。
閒置樣本會以 `info` 層級留在 telemetry；只有在診斷工作處於作用中、等待中或已佇列時，
才會記錄為 Gateway 警告。它們本身不會重新啟動 Gateway。

檢查即時記錄器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

在嚴重結束、關閉逾時或重新啟動啟動失敗後，檢查最新的持久化穩定性套件：

```bash
openclaw gateway stability --bundle latest
```

從最新的持久化套件建立診斷 zip：

```bash
openclaw gateway stability --bundle latest --export
```

有事件時，持久化套件會位於 `~/.openclaw/logs/stability/` 之下。

## 實用選項

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`：寫入特定 zip 路徑。
- `--log-lines <count>`：要包含的已清理日誌行數上限。
- `--log-bytes <bytes>`：要檢查的日誌位元組數上限。
- `--url <url>`：用於狀態與健康狀態快照的 Gateway WebSocket URL。
- `--token <token>`：用於狀態與健康狀態快照的 Gateway token。
- `--password <password>`：用於狀態與健康狀態快照的 Gateway 密碼。
- `--timeout <ms>`：狀態與健康狀態快照逾時。
- `--no-stability-bundle`：略過持久化穩定性套件查詢。
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

停用診斷會減少錯誤回報詳細資料。它不會影響一般 Gateway 日誌記錄。

## 相關

- [健康狀態檢查](/zh-TW/gateway/health)
- [Gateway CLI](/zh-TW/cli/gateway#gateway-diagnostics-export)
- [Gateway 通訊協定](/zh-TW/gateway/protocol#system-and-identity)
- [日誌記錄](/zh-TW/logging)
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — 用於將診斷串流至收集器的獨立流程
