---
read_when:
    - 準備錯誤回報或支援請求
    - 偵錯閘道當機、重新啟動、記憶體壓力或過大的承載資料
    - 檢視哪些診斷資料會被記錄或遮蔽
summary: 建立可分享的閘道診斷套件，用於錯誤回報
title: 診斷資料匯出
x-i18n:
    generated_at: "2026-07-11T21:19:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw 可為錯誤回報建立本機診斷 `.zip`：經清理的閘道狀態、健康狀況、日誌、設定結構，以及近期不含承載資料的穩定性事件。

在審查前，請將診斷套件視同機密資料。依設計，承載資料與憑證都會經過遮蔽，但套件仍會摘要本機閘道日誌與主機層級的執行階段狀態。

## 快速開始

```bash
openclaw gateway diagnostics export
```

輸出所寫入的 zip 路徑。若要選擇輸出路徑：

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

用於自動化：

```bash
openclaw gateway diagnostics export --json
```

## 聊天指令

擁有者可在任何對話中執行 `/diagnostics [note]`，請求本機閘道匯出為一份可直接複製貼上的支援報告：

1. 傳送 `/diagnostics`，並可選擇附上簡短備註（`/diagnostics bad tool choice`）。
2. OpenClaw 會傳送前言並要求一次明確的執行核准，以執行
   `openclaw gateway diagnostics export --json`。請勿透過允許全部的規則核准診斷。
3. 核准後，OpenClaw 會回覆本機套件路徑、資訊清單摘要、隱私注意事項，以及相關的工作階段 ID。

在群組聊天中，擁有者仍可執行 `/diagnostics`，但 OpenClaw 會私下將匯出結果、核准提示，以及 Codex 工作階段／討論串明細傳送給擁有者。群組中只會看到一則簡短通知，表示診斷資料已私下傳送。若沒有可供擁有者使用的私下傳送路徑，該指令會採取安全失敗，並要求擁有者改從私訊中執行。

當作用中的工作階段使用原生 OpenAI Codex 執行框架時，同一次執行核准也會涵蓋針對 OpenClaw 已知 Codex 討論串的 OpenAI 意見回饋上傳。該上傳與本機閘道 zip 分開，且只會在 Codex 執行框架工作階段中進行。核准提示會說明核准後也會傳送 Codex 意見回饋，但不會列出 Codex 工作階段或討論串 ID。核准後，回覆會列出傳送至 OpenAI 的討論串所屬頻道、OpenClaw 工作階段 ID、Codex 討論串 ID，以及可在本機使用的繼續執行指令。拒絕或忽略核准，將略過匯出、Codex 意見回饋上傳與 Codex ID 清單。

這能縮短 Codex 的偵錯流程：在頻道中發現不良行為後，執行 `/diagnostics`、核准一次、分享報告；若想自行檢查討論串，再於本機執行輸出的 `codex resume <thread-id>` 指令。請參閱 [Codex 執行框架](/zh-TW/plugins/codex-harness#inspect-codex-threads-locally)。

## 匯出內容

- `summary.md`：供支援人員閱讀的概覽。
- `diagnostics.json`：設定、日誌、狀態、健康狀況與穩定性資料的機器可讀摘要。
- `manifest.json`：匯出中繼資料與檔案清單。
- 經清理的設定結構與非機密設定詳細資料。
- 經清理的日誌摘要與近期經遮蔽的日誌行。
- 盡力取得的閘道狀態與健康狀況快照。
- `stability/latest.json`：最新的已持久化穩定性套件（若有）。

即使閘道狀況不佳，匯出內容仍有幫助：若狀態／健康狀況請求失敗，只要可取得，仍會收集本機日誌、設定結構與最新的穩定性套件。

## 隱私模型

保留：子系統名稱、外掛 ID、提供者 ID、頻道 ID、已設定模式、狀態碼、持續時間、位元組數、佇列狀態、記憶體讀數、經清理的日誌中繼資料、經遮蔽的操作訊息、設定結構，以及非機密功能設定。

省略或遮蔽：聊天文字、提示詞、指示、網路鉤子內文、工具輸出、憑證、API 金鑰、權杖、Cookie、機密值、原始請求／回應內文、帳號 ID、訊息 ID、原始工作階段 ID、主機名稱，以及本機使用者名稱。

當日誌訊息看似包含使用者、聊天、提示詞或工具承載文字時，匯出內容只會保留「該訊息已省略」的資訊及其位元組數。

## 穩定性記錄器

啟用診斷時，閘道預設會記錄有界且不含承載資料的穩定性事件流。它擷取的是操作事實，而非內容。

當事件迴圈或 CPU 看似飽和時，同一個心跳偵測也會取樣存活狀態，並發出包含事件迴圈延遲、事件迴圈使用率、CPU 核心比率、作用中／等待中／已排入佇列的工作階段數、目前啟動／執行階段（若已知）、近期階段時間跨度，以及有界工作標籤的 `diagnostic.liveness.warning` 事件。只有在工作正在等待或排入佇列，或作用中工作與持續的事件迴圈延遲重疊時，這些事件才會成為閘道 `warn` 層級的日誌行；否則會以 `debug` 層級記錄。閒置時的存活狀態取樣仍會記錄為診斷事件，但絕不會自行升級為警告。

啟動階段會發出含實際經過時間與 CPU 計時的 `diagnostic.phase.completed` 事件。當最後一次橋接進度看似已達終止狀態（例如原始回應項目或回應完成事件），但閘道仍將內嵌執行視為作用中時，停滯的內嵌執行診斷會標記 `terminalProgressStale=true`。

檢查即時記錄器：

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

在致命結束、關機逾時或重新啟動時的啟動失敗後，檢查最新的已持久化套件：

```bash
openclaw gateway stability --bundle latest
```

從最新的已持久化套件建立診斷 zip：

```bash
openclaw gateway stability --bundle latest --export
```

有事件時，已持久化套件會儲存在 `~/.openclaw/logs/stability/` 下。

## 實用選項

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| 旗標                    | 預設值                                                                        | 說明                                               |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | 寫入指定的 zip 路徑（或目錄）。                    |
| `--log-lines <count>`   | `5000`                                                                        | 要包含的經清理日誌行數上限。                       |
| `--log-bytes <bytes>`   | `1000000`                                                                     | 要檢查的日誌位元組數上限。                         |
| `--url <url>`           | -                                                                             | 用於狀態／健康狀況快照的閘道 WebSocket URL。       |
| `--token <token>`       | -                                                                             | 用於狀態／健康狀況快照的閘道權杖。                 |
| `--password <password>` | -                                                                             | 用於狀態／健康狀況快照的閘道密碼。                 |
| `--timeout <ms>`        | `3000`                                                                        | 狀態／健康狀況快照逾時時間。                       |
| `--no-stability-bundle` | 關閉                                                                          | 略過已持久化穩定性套件查找。                       |
| `--json`                | 關閉                                                                          | 輸出機器可讀的匯出中繼資料。                       |

## 停用診斷

診斷預設為啟用。若要停用穩定性記錄器與診斷事件收集：

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

停用診斷會減少錯誤回報的詳細程度；不會影響一般閘道日誌記錄。

關鍵記憶體壓力快照預設為關閉。若除了正常診斷事件外，也要擷取 OOM 前的穩定性快照：

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

僅應在能夠承受關鍵記憶體壓力期間額外檔案系統掃描與快照寫入的主機上使用。即使快照關閉，一般記憶體壓力事件仍會記錄 RSS、堆積、臨界值與成長資訊（`rss_threshold`、`heap_threshold`、`rss_growth`）。

## 相關內容

- [健康狀況檢查](/zh-TW/gateway/health)
- [閘道命令列介面](/zh-TW/cli/gateway#gateway-diagnostics-export)
- [閘道通訊協定](/zh-TW/gateway/protocol#rpc-method-families)
- [日誌記錄](/zh-TW/logging)
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) - 用於將串流診斷傳送至收集器的獨立流程
