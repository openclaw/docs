---
read_when:
    - 準備錯誤報告或支援請求
    - 偵錯閘道當機、重新啟動、記憶體壓力或過大的酬載
    - 正在檢視記錄或遮蔽了哪些診斷資料
summary: 建立可分享的閘道診斷套件，用於錯誤回報
title: 診斷匯出
x-i18n:
    generated_at: "2026-06-27T19:17:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ce431bafa51a245f2a3829074b0ca92e2d30ddfc1ae9738eed46a4e51ae98208
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw 可以為錯誤回報建立本機診斷 zip。它會結合
已清理的閘道狀態、健康狀態、日誌、設定形狀，以及近期不含承載內容的
穩定性事件。

在你審閱診斷套件之前，請像對待祕密一樣對待它們。它們的設計會省略或遮蔽承載內容與憑證，但仍會摘要
本機閘道日誌和主機層級的執行階段狀態。

## 快速開始

```bash
openclaw gateway diagnostics export
```

此命令會印出寫入的 zip 路徑。若要選擇路徑：

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

用於自動化：

```bash
openclaw gateway diagnostics export --json
```

## 聊天命令

擁有者可以在聊天中使用 `/diagnostics [note]` 來要求本機閘道匯出。
當錯誤發生在真實對話中，而你想要一份可複製貼上的支援報告時，請使用此命令：

1. 在你注意到問題的對話中傳送 `/diagnostics`。如果有幫助，可以加入
   簡短註記，例如 `/diagnostics bad tool choice`。
2. OpenClaw 會傳送診斷前言，並要求一次明確的 exec
   核准。該核准會執行 `openclaw gateway diagnostics export --json`。
   不要透過允許全部的規則核准診斷。
3. 核准後，OpenClaw 會回覆一份可貼上的報告，其中包含本機
   套件路徑、資訊清單摘要、隱私註記，以及相關工作階段 ID。

在群組聊天中，擁有者仍可執行 `/diagnostics`，但 OpenClaw 不會
將診斷詳細資料貼回共享聊天。它會透過私人核准路由，將前言、
核准提示、閘道匯出結果，以及 Codex 工作階段/執行緒細目傳送給
擁有者。群組只會收到一則簡短通知，說明診斷流程已私下傳送。
如果 OpenClaw 找不到私人擁有者路由，該命令會以關閉方式失敗，並要求擁有者從私人訊息中執行。

當作用中的 OpenClaw 工作階段正在使用原生 OpenAI Codex harness 時，
同一個 exec 核准也會涵蓋 OpenClaw 已知 Codex
執行階段執行緒的 OpenAI 意見回饋上傳。該上傳與本機
閘道 zip 分開，且只會出現在 Codex harness 工作階段。核准前，
提示會說明核准診斷也會傳送 Codex 意見回饋，但它
不會列出 Codex 工作階段或執行緒 ID。核准後，聊天回覆會列出
已傳送到 OpenAI 伺服器之執行緒的通道、OpenClaw 工作階段 ID、Codex 執行緒 ID，以及本機續接命令。如果你拒絕或忽略
核准，OpenClaw 不會執行匯出、不會傳送 Codex 意見回饋，也
不會印出 Codex ID。

這讓常見的 Codex 偵錯迴圈變短：在
Telegram、Discord 或其他通道中注意到不良行為，執行 `/diagnostics`，核准一次，
與支援分享報告，然後如果你想自行檢查原生 Codex 執行緒，就在本機執行印出的 `codex resume <thread-id>` 命令。請參閱
[Codex harness](/zh-TW/plugins/codex-harness#inspect-codex-threads-locally) 了解
該檢查工作流程。

## 匯出內容

zip 包含：

- `summary.md`：供支援使用的人類可讀概覽。
- `diagnostics.json`：設定、日誌、狀態、健康狀態
  和穩定性資料的機器可讀摘要。
- `manifest.json`：匯出中繼資料和檔案清單。
- 已清理的設定形狀和非祕密設定詳細資料。
- 已清理的日誌摘要和近期已遮蔽的日誌行。
- 盡力擷取的閘道狀態和健康狀態快照。
- `stability/latest.json`：可用時最新的已持久化穩定性套件。

即使閘道不健康，匯出仍然有用。如果閘道無法
回應狀態或健康狀態要求，本機日誌、設定形狀和最新
穩定性套件仍會在可用時被收集。

## 隱私模型

診斷的設計是可供分享的。匯出會保留有助於偵錯的
營運資料，例如：

- 子系統名稱、外掛 ID、提供者 ID、通道 ID，以及已設定模式
- 狀態碼、持續時間、位元組計數、佇列狀態和記憶體讀數
- 已清理的日誌中繼資料和已遮蔽的營運訊息
- 設定形狀和非祕密功能設定

匯出會省略或遮蔽：

- 聊天文字、提示、指令、網路鉤子本文和工具輸出
- 憑證、API 金鑰、權杖、Cookie 和祕密值
- 原始要求或回應本文
- 帳戶 ID、訊息 ID、原始工作階段 ID、主機名稱和本機使用者名稱

當日誌訊息看起來像使用者、聊天、提示或工具承載文字時，
匯出只會保留訊息已被省略以及位元組計數。

## 穩定性記錄器

當診斷啟用時，閘道預設會記錄一個有界且不含承載內容的穩定性串流。
它用於營運事實，而非內容。

當閘道持續執行但 Node.js 事件迴圈或 CPU 看起來飽和時，
同一個診斷心跳偵測會記錄存活性樣本。這些
`diagnostic.liveness.warning` 事件包含事件迴圈延遲、事件迴圈
使用率、CPU 核心比率、作用中/等待中/佇列中工作階段計數、已知時目前的
啟動/執行階段階段、近期階段區段，以及有界的作用中/佇列中
工作標籤。閒置樣本會以 `info` 層級保留在遙測中。只有在工作正在等待或排隊，或作用中工作
與持續事件迴圈延遲重疊時，存活性樣本才會成為閘道警告。其他情況下健康背景工作期間的暫時最大延遲尖峰
會保留在偵錯日誌中。它們本身不會重新啟動
閘道。

啟動階段也會發出 `diagnostic.phase.completed` 事件，包含實際時間和
CPU 計時。停滯的嵌入式執行診斷會在最後一次橋接進度看起來已終止時標記 `terminalProgressStale=true`，
例如原始回應項目或
回應完成事件，但閘道仍認為嵌入式執行
處於作用中。

檢查即時記錄器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

在致命結束、關閉逾時或重新啟動啟動失敗後，檢查最新的已持久化穩定性套件：

```bash
openclaw gateway stability --bundle latest
```

從最新的已持久化套件建立診斷 zip：

```bash
openclaw gateway stability --bundle latest --export
```

當事件存在時，已持久化套件位於 `~/.openclaw/logs/stability/` 底下。

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
- `--url <url>`：用於狀態和健康狀態快照的閘道 WebSocket URL。
- `--token <token>`：用於狀態和健康狀態快照的閘道權杖。
- `--password <password>`：用於狀態和健康狀態快照的閘道密碼。
- `--timeout <ms>`：狀態和健康狀態快照逾時。
- `--no-stability-bundle`：略過已持久化穩定性套件查找。
- `--json`：印出機器可讀的匯出中繼資料。

## 停用診斷

診斷預設為啟用。若要停用穩定性記錄器和
診斷事件收集：

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

停用診斷會減少錯誤回報詳細資料。它不會影響正常的
閘道日誌記錄。

關鍵記憶體壓力快照預設為關閉。若要保留診斷
事件，並同時擷取 OOM 前的穩定性快照：

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

僅在可承受關鍵記憶體壓力期間額外檔案系統掃描和快照
寫入的主機上使用此設定。當快照關閉時，正常記憶體壓力事件仍會
記錄 RSS、堆積、臨界值和成長事實。

## 相關

- [健康檢查](/zh-TW/gateway/health)
- [閘道命令列介面](/zh-TW/cli/gateway#gateway-diagnostics-export)
- [閘道通訊協定](/zh-TW/gateway/protocol#system-and-identity)
- [日誌記錄](/zh-TW/logging)
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — 將診斷串流到收集器的獨立流程
