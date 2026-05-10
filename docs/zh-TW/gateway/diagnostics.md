---
read_when:
    - 準備錯誤報告或支援請求
    - 偵錯 Gateway 當機、重新啟動、記憶體壓力或過大的酬載
    - 檢閱哪些診斷資料會被記錄或遮蔽
summary: 為錯誤回報建立可分享的 Gateway 診斷資料包
title: 診斷匯出
x-i18n:
    generated_at: "2026-05-10T19:34:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6df695c590fd8239226e2e4d4e266a7b705f3963f00a005be38c526b1f28afb
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw 可以建立本機診斷 zip 供錯誤回報使用。它會合併已清理的 Gateway 狀態、健康狀態、記錄、設定形狀，以及近期不含承載內容的穩定性事件。

在檢閱診斷套件前，請將它們視同秘密處理。它們設計上會省略或遮蔽承載內容和憑證，但仍會摘要本機 Gateway 記錄和主機層級執行階段狀態。

## 快速開始

```bash
openclaw gateway diagnostics export
```

此指令會列印寫入的 zip 路徑。若要選擇路徑：

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

用於自動化：

```bash
openclaw gateway diagnostics export --json
```

## 聊天指令

擁有者可以在聊天中使用 `/diagnostics [note]` 要求本機 Gateway 匯出。當錯誤發生在真實對話中，而你想要一份可複製貼上的支援報告時，請使用此指令：

1. 在你發現問題的對話中傳送 `/diagnostics`。如有幫助，可加入簡短備註，例如 `/diagnostics bad tool choice`。
2. OpenClaw 會傳送診斷前言，並要求一次明確的 exec 核准。該核准會執行 `openclaw gateway diagnostics export --json`。請勿透過允許全部的規則核准診斷。
3. 核准後，OpenClaw 會回覆一份可貼上的報告，其中包含本機套件路徑、清單摘要、隱私注意事項，以及相關工作階段 ID。

在群組聊天中，擁有者仍可執行 `/diagnostics`，但 OpenClaw 不會將診斷詳細資料貼回共享聊天。它會透過私人核准路由，將前言、核准提示、Gateway 匯出結果，以及 Codex 工作階段/執行緒分解傳送給擁有者。群組只會收到一則簡短通知，表示診斷流程已私下傳送。如果 OpenClaw 找不到私人擁有者路由，指令會以封閉方式失敗，並要求擁有者從 DM 執行。

當作用中的 OpenClaw 工作階段正在使用原生 OpenAI Codex harness 時，同一次 exec 核准也會涵蓋 OpenClaw 已知 Codex 執行階段執行緒的 OpenAI 意見回饋上傳。該上傳與本機 Gateway zip 分開，且只會出現在 Codex harness 工作階段中。核准前，提示會說明核准診斷也會傳送 Codex 意見回饋，但不會列出 Codex 工作階段或執行緒 ID。核准後，聊天回覆會列出已傳送到 OpenAI 伺服器的頻道、OpenClaw 工作階段 ID、Codex 執行緒 ID，以及本機續接指令。如果你拒絕或忽略該核准，OpenClaw 不會執行匯出、不會傳送 Codex 意見回饋，也不會列印 Codex ID。

這讓常見的 Codex 除錯流程變得簡短：在 Telegram、Discord 或其他頻道中注意到不良行為，執行 `/diagnostics`，核准一次，將報告分享給支援人員，然後如果想自行檢查原生 Codex 執行緒，就在本機執行列印出的 `codex resume <thread-id>` 指令。該檢查流程請參閱 [Codex harness](/zh-TW/plugins/codex-harness#inspect-codex-threads-locally)。

## 匯出內容

zip 包含：

- `summary.md`：供支援人員閱讀的人類可讀概覽。
- `diagnostics.json`：設定、記錄、狀態、健康狀態與穩定性資料的機器可讀摘要。
- `manifest.json`：匯出中繼資料和檔案清單。
- 已清理的設定形狀與非秘密設定詳細資料。
- 已清理的記錄摘要和近期已遮蔽記錄行。
- 盡力取得的 Gateway 狀態與健康狀態快照。
- `stability/latest.json`：可用時，最新的已保存穩定性套件。

即使 Gateway 不健康，匯出仍然有用。如果 Gateway 無法回應狀態或健康狀態請求，仍會在可用時收集本機記錄、設定形狀和最新穩定性套件。

## 隱私模型

診斷設計上可供分享。匯出會保留有助於除錯的操作資料，例如：

- 子系統名稱、Plugin ID、提供者 ID、頻道 ID，以及已設定模式
- 狀態碼、持續時間、位元組數、佇列狀態，以及記憶體讀數
- 已清理的記錄中繼資料和已遮蔽的操作訊息
- 設定形狀和非秘密功能設定

匯出會省略或遮蔽：

- 聊天文字、提示、指示、Webhook 主體，以及工具輸出
- 憑證、API 金鑰、權杖、Cookie，以及秘密值
- 原始請求或回應主體
- 帳號 ID、訊息 ID、原始工作階段 ID、主機名稱，以及本機使用者名稱

當記錄訊息看起來像使用者、聊天、提示或工具承載文字時，匯出只會保留該訊息已省略以及位元組數。

## 穩定性記錄器

啟用診斷時，Gateway 預設會記錄一條有界且不含承載內容的穩定性串流。它用於操作事實，而非內容。

當 Gateway 持續執行，但 Node.js 事件迴圈或 CPU 看起來已飽和時，相同的診斷 Heartbeat 會記錄存活性樣本。這些 `diagnostic.liveness.warning` 事件包含事件迴圈延遲、事件迴圈使用率、CPU 核心比率、作用中/等待中/佇列中的工作階段數量、已知時的目前啟動/執行階段階段、近期階段跨度，以及有界的作用中/佇列中工作標籤。閒置樣本會以 `info` 層級留在遙測中。只有在有工作正在等待或排隊，或作用中工作與持續的事件迴圈延遲重疊時，存活性樣本才會成為 Gateway 警告。在其他健康背景工作期間出現的暫時性最大延遲尖峰會留在除錯記錄中。它們本身不會重新啟動 Gateway。

啟動階段也會發出 `diagnostic.phase.completed` 事件，包含實際經過時間和 CPU 計時。當最後的橋接進度看起來已終止，例如原始回應項目或回應完成事件，但 Gateway 仍認為嵌入式執行處於作用中時，停滯的嵌入式執行診斷會標記 `terminalProgressStale=true`。

檢查即時記錄器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

在致命退出、關機逾時或重新啟動時啟動失敗後，檢查最新保存的穩定性套件：

```bash
openclaw gateway stability --bundle latest
```

從最新保存的套件建立診斷 zip：

```bash
openclaw gateway stability --bundle latest --export
```

有事件存在時，已保存套件會位於 `~/.openclaw/logs/stability/` 下。

## 實用選項

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`：寫入指定 zip 路徑。
- `--log-lines <count>`：要包含的已清理記錄行數上限。
- `--log-bytes <bytes>`：要檢查的記錄位元組上限。
- `--url <url>`：用於狀態與健康狀態快照的 Gateway WebSocket URL。
- `--token <token>`：用於狀態與健康狀態快照的 Gateway 權杖。
- `--password <password>`：用於狀態與健康狀態快照的 Gateway 密碼。
- `--timeout <ms>`：狀態與健康狀態快照逾時。
- `--no-stability-bundle`：略過已保存穩定性套件查找。
- `--json`：列印機器可讀的匯出中繼資料。

## 停用診斷

診斷預設已啟用。若要停用穩定性記錄器與診斷事件收集：

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

停用診斷會減少錯誤回報詳細資料。它不會影響正常的 Gateway 記錄。

## 相關

- [健康檢查](/zh-TW/gateway/health)
- [Gateway CLI](/zh-TW/cli/gateway#gateway-diagnostics-export)
- [Gateway 通訊協定](/zh-TW/gateway/protocol#system-and-identity)
- [記錄](/zh-TW/logging)
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — 將診斷串流到收集器的獨立流程
