---
read_when:
    - 準備錯誤回報或支援請求
    - 偵錯閘道當機、重新啟動、記憶體壓力或過大的承載資料
    - 檢視記錄或遮蔽了哪些診斷資料
summary: 建立可分享的閘道診斷套件以供錯誤回報
title: 診斷匯出
x-i18n:
    generated_at: "2026-07-05T11:19:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw 可以為錯誤回報建立本機診斷 `.zip`：已清理的閘道
狀態、健康狀態、日誌、設定形狀，以及近期不含承載資料的穩定性事件。

在審閱前，請把診斷套件視為秘密處理。承載資料和認證資料在設計上會被遮蔽，
但套件仍會摘要本機閘道日誌和主機層級執行階段狀態。

## 快速開始

```bash
openclaw gateway diagnostics export
```

列印已寫入的 zip 路徑。選擇輸出路徑：

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

用於自動化：

```bash
openclaw gateway diagnostics export --json
```

## 聊天命令

擁有者可以在任何對話中執行 `/diagnostics [note]`，請求本機
閘道匯出為一份可複製貼上的支援報告：

1. 傳送 `/diagnostics`，可選擇附上一段簡短備註（`/diagnostics bad tool choice`）。
2. OpenClaw 會傳送前言，並要求一次明確的 exec 核准，這會執行
   `openclaw gateway diagnostics export --json`。不要透過
   allow-all 規則核准診斷。
3. 核准後，OpenClaw 會回覆本機套件路徑、資訊清單
   摘要、隱私說明，以及相關的工作階段 ID。

在群組聊天中，擁有者仍可執行 `/diagnostics`，但 OpenClaw 會將
匯出結果、核准提示，以及 Codex 工作階段/執行緒明細私下傳送給
擁有者。群組只會看到一則簡短通知，說明診斷已私下傳送。
如果沒有私人的擁有者路由，命令會以關閉狀態失敗，並要求
擁有者從 DM 執行。

當作用中的工作階段使用原生 OpenAI Codex harness 時，同一次 exec
核准也會涵蓋針對 OpenClaw 已知 Codex 執行緒的 OpenAI 意見回饋上傳。
該上傳與本機閘道 zip 分開，且只會發生於 Codex harness 工作階段。
核准提示會說明核准也會傳送 Codex 意見回饋，但不會列出 Codex 工作階段或執行緒 ID。
核准後，回覆會列出已傳送給 OpenAI 之執行緒的通道、OpenClaw 工作階段 ID、Codex 執行緒 ID，
以及本機續接命令。拒絕或忽略核准會略過匯出、Codex 意見回饋上傳，以及
Codex ID 清單。

這會讓 Codex 偵錯迴圈更短：在通道中注意到不良行為、
執行 `/diagnostics`、核准一次、分享報告，然後如果你想自行檢查該執行緒，
就在本機執行列印出的 `codex resume <thread-id>` 命令。
請參閱 [Codex harness](/zh-TW/plugins/codex-harness#inspect-codex-threads-locally)。

## 匯出內容

- `summary.md`：供支援人員閱讀的人類可讀概覽。
- `diagnostics.json`：設定、日誌、狀態、健康狀態和穩定性資料的機器可讀摘要。
- `manifest.json`：匯出中繼資料和檔案清單。
- 已清理的設定形狀和非秘密設定詳細資料。
- 已清理的日誌摘要和近期已遮蔽的日誌行。
- 盡力取得的閘道狀態和健康狀態快照。
- `stability/latest.json`：最新的已持久化穩定性套件（可用時）。

即使閘道不健康，匯出仍然有用：如果狀態/健康狀態
請求失敗，仍會在可用時收集本機日誌、設定形狀和最新的穩定性套件。

## 隱私模型

保留：子系統名稱、外掛 ID、提供者 ID、通道 ID、已設定
模式、狀態碼、持續時間、位元組數、佇列狀態、記憶體讀數、
已清理的日誌中繼資料、已遮蔽的操作訊息、設定形狀，以及
非秘密功能設定。

省略或遮蔽：聊天文字、提示、指令、網路鉤子本文、工具
輸出、認證資料、API 金鑰、權杖、Cookie、秘密值、原始
請求/回應本文、帳戶 ID、訊息 ID、原始工作階段 ID、
主機名稱，以及本機使用者名稱。

當日誌訊息看起來像使用者、聊天、提示或工具承載文字時，
匯出只會保留訊息已被省略的事實及其位元組數。

## 穩定性記錄器

啟用診斷時，閘道預設會記錄一條有界、無承載資料的穩定性串流。
它擷取的是操作事實，而不是內容。

同一個心跳偵測也會在事件迴圈或 CPU 看起來飽和時取樣存活狀態，
發出包含事件迴圈延遲、事件迴圈使用率、CPU 核心比率、作用中/等待中/已佇列工作階段數、
目前啟動/執行階段階段（已知時）、近期階段跨度，以及
有界工作標籤的 `diagnostic.liveness.warning` 事件。只有在
有工作等待或佇列中，或作用中工作與持續的事件迴圈
延遲重疊時，這些事件才會成為閘道 `warn` 層級日誌行；
否則會以 `debug` 記錄。閒置存活狀態樣本仍會被記錄
為診斷事件，但本身絕不會升級為警告。

啟動階段會發出包含實際時間和 CPU 計時的 `diagnostic.phase.completed` 事件。
停滯的嵌入式執行診斷會在最後一次橋接進度看起來已終止
（例如原始回應項目或回應完成事件），但閘道仍認為
嵌入式執行處於作用中時，標記 `terminalProgressStale=true`。

檢查即時記錄器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

在嚴重結束、關機逾時或重新啟動啟動失敗後，檢查最新的已持久化套件：

```bash
openclaw gateway stability --bundle latest
```

從最新的已持久化套件建立診斷 zip：

```bash
openclaw gateway stability --bundle latest --export
```

有事件存在時，已持久化套件位於 `~/.openclaw/logs/stability/` 底下。

## 實用選項

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| 旗標                    | 預設值                                                                        | 說明                                               |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | 寫入特定 zip 路徑（或目錄）。                      |
| `--log-lines <count>`   | `5000`                                                                        | 要包含的已清理日誌行上限。                         |
| `--log-bytes <bytes>`   | `1000000`                                                                     | 要檢查的日誌位元組上限。                           |
| `--url <url>`           | -                                                                             | 用於狀態/健康狀態快照的閘道 WebSocket URL。        |
| `--token <token>`       | -                                                                             | 用於狀態/健康狀態快照的閘道權杖。                  |
| `--password <password>` | -                                                                             | 用於狀態/健康狀態快照的閘道密碼。                  |
| `--timeout <ms>`        | `3000`                                                                        | 狀態/健康狀態快照逾時。                            |
| `--no-stability-bundle` | 關閉                                                                          | 略過已持久化穩定性套件查找。                       |
| `--json`                | 關閉                                                                          | 列印機器可讀的匯出中繼資料。                       |

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

停用診斷會減少錯誤回報細節；不會影響一般
閘道日誌記錄。

重大記憶體壓力快照預設為關閉。若要在一般診斷事件之外，
也擷取 OOM 前的穩定性快照：

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

僅在主機可以承受重大記憶體壓力期間額外的檔案系統掃描和
快照寫入時使用此選項。快照關閉時，一般記憶體壓力事件
仍會記錄 RSS、heap、threshold 和 growth 事實（`rss_threshold`、
`heap_threshold`、`rss_growth`）。

## 相關

- [健康檢查](/zh-TW/gateway/health)
- [閘道命令列介面](/zh-TW/cli/gateway#gateway-diagnostics-export)
- [閘道協定](/zh-TW/gateway/protocol#rpc-method-families)
- [日誌記錄](/zh-TW/logging)
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) - 將診斷串流至收集器的獨立流程
