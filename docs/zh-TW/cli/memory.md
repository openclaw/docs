---
read_when:
    - 你想要建立語意記憶索引或搜尋語意記憶
    - 你正在偵錯記憶可用性或索引問題
    - 您想將回想起的短期記憶提升為 `MEMORY.md`
summary: '`openclaw memory` 的命令列介面參考（status/index/search/promote/promote-explain/rem-harness/rem-backfill）'
title: 記憶
x-i18n:
    generated_at: "2026-07-11T21:13:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

管理語意記憶的索引、搜尋，以及提升至 `MEMORY.md`。
此功能由內建的 `memory-core` 外掛提供，當
`plugins.slots.memory` 選取 `memory-core`（預設值）時可用。其他記憶
外掛會提供各自的命令列介面命名空間。

相關內容：[記憶](/zh-TW/concepts/memory)概念、[夢境整理](/zh-TW/concepts/dreaming)、
[記憶設定參考](/zh-TW/reference/memory-config)、[記憶 Wiki](/zh-TW/plugins/memory-wiki)、
[Wiki](/zh-TW/cli/wiki)、[外掛](/zh-TW/tools/plugin)。

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

未指定 `--agent` 時，會針對 `agents.list` 中的每個代理執行；若未
設定代理清單，則改用預設代理。

| 旗標        | 效果                                                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | 探測向量儲存區、嵌入提供者及語意搜尋是否就緒（會額外呼叫提供者）。一般的 `memory status` 會保持快速並略過此操作；向量／語意狀態為未知表示尚未探測。即使指定 `--deep`，QMD 詞彙式 `searchMode: "search"` 仍一律略過語意向量探測。 |
| `--index`   | 若儲存區處於未同步狀態，則重新建立索引。隱含 `--deep`。                                                                                                                                                                                                                                                          |
| `--fix`     | 修復過時的召回鎖定，並正規化提升中繼資料。                                                                                                                                                                                                                                               |
| `--json`    | 輸出 JSON。                                                                                                                                                                                                                                                                                               |
| `--verbose` | 輸出各階段的詳細記錄。                                                                                                                                                                                                                                                                             |

若即使設定 `dreaming.enabled: true`，`Dreaming` 行仍顯示為 `off`，或
排程掃描似乎從未執行，這是因為受管理的夢境整理排程需依賴
預設代理的心跳偵測觸發，才能進行協調。排程詳情請參閱
[夢境整理](/zh-TW/concepts/dreaming)。

狀態也會列出 `agents.defaults.memorySearch.extraPaths` 中的所有額外搜尋路徑。

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

代理範圍與 `status` 相同。`--force` 會執行完整重新索引，而非
增量重新索引。`--verbose` 會先輸出各代理的提供者、模型、來源及
額外路徑詳情，再顯示索引進度。

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- 查詢：位置參數 `[query]` 或 `--query <text>`。若兩者皆有設定，以 `--query`
  為準。若兩者皆未設定，命令會傳回錯誤。
- `--agent <id>`：預設為預設代理（而非完整代理清單）。
- `--max-results <n>`：限制結果數量（正整數）。
- `--min-score <n>`：濾除分數低於此值的符合項目。

## `memory promote`

對 `memory/YYYY-MM-DD.md` 中的短期候選項目進行排名，並可選擇將
排名最高的項目附加至 `MEMORY.md`。

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| 旗標                       | 預設值      | 效果                                                            |
| -------------------------- | ------------ | ----------------------------------------------------------------- |
| `--limit <n>`              |              | 可傳回／套用的候選項目數量上限。                                   |
| `--min-score <n>`          | `0.75`       | 最低加權提升分數。                                 |
| `--min-recall-count <n>`   | `3`          | 所需的最低召回次數。                                    |
| `--min-unique-queries <n>` | `2`          | 所需的最低相異查詢數量。                            |
| `--apply`                  | 僅預覽 | 將選取的候選項目附加至 `MEMORY.md`，並將其標記為已提升。 |
| `--include-promoted`       |              | 包含先前週期中已提升的候選項目。           |
| `--json`                   |              | 輸出 JSON。                                                       |

這些命令列介面預設值與排程夢境整理掃描的深度階段
門檻不同（請參閱下方的[夢境整理](#dreaming)）；若要進行一次性的手動執行並
比照掃描行為，請明確傳入旗標。

排名訊號包括：召回頻率、檢索相關性、查詢多樣性、
時間新近性、跨日整合，以及衍生概念的豐富度；這些訊號來自
記憶召回與每日擷取流程，另加上輕度／REM 階段針對夢境整理反覆重訪項目的
強化加成。寫入前，提升程序會重新讀取即時的每日日誌，因此會依據
排名後對短期片段所做的編輯或刪除，而非從過時的快照提升。

## `memory promote-explain`

說明單一提升候選項目的分數明細。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` 會比對候選項目的鍵（完全相符或子字串）、路徑或片段
文字。

## `memory rem-harness`

預覽 REM 反思、候選事實及深度階段的提升輸出，
且不寫入任何內容。

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`：從歷史 `YYYY-MM-DD.md`
  每日檔案載入測試框架的初始資料，而非使用即時工作區。
- `--grounded`：另從歷史筆記產生有依據的 `發生了什麼`／`反思`／
  `可能的長期更新` 預覽。

## `memory rem-backfill`

將有依據的歷史 REM 摘要寫入 `DREAMS.md`，供使用者介面檢視。
此操作可復原。

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`：除非已設定 `--rollback`／`--rollback-short-term`，
  否則為必要參數。要用來回填的歷史每日記憶檔案或目錄。
- `--stage-short-term`：另將有依據的持久候選項目植入即時
  短期提升儲存區，使一般深度階段可對其進行排名。
- `--rollback`：從 `DREAMS.md`
  移除先前寫入的有依據日誌項目。
- `--rollback-short-term`：移除先前暫存的有依據短期
  候選項目。

## 夢境整理

夢境整理是一套背景記憶整合系統，包含三個協同運作的
階段，依同一排程按順序執行：**輕度**（整理／暫存短期
資料）、**REM**（反思並呈現主題）、**深度**（將持久
事實提升至 `MEMORY.md`）。只有深度階段會寫入 `MEMORY.md`。

- 使用 `plugins.entries.memory-core.config.dreaming.enabled: true`
  啟用（預設為 `false`）；`memory-core` 會自動管理掃描排程工作，無須手動
  執行 `openclaw cron add`。
- 在聊天中使用 `/dreaming on|off` 切換；使用 `/dreaming status`
  檢查（或使用 `/dreaming`／`/dreaming help`）。`on`／`off` 需要頻道擁有者身分
  或閘道 `operator.admin`；所有可叫用此命令的人仍可使用 `status` 與說明。
- 供人閱讀的階段輸出會寫入 `DREAMS.md`（或既有的 `dreams.md`）。
  預設情況下（`dreaming.storage.mode: "separate"`），每個階段也會將
  獨立報告寫入 `memory/dreaming/<phase>/YYYY-MM-DD.md`；將 `mode:
"inline"` 設為行內模式，即可改將報告整合至每日記憶檔案中，或設為 `"both"`
  同時使用兩種方式。
- 排程執行與手動執行 `memory promote` 會使用相同的深度階段
  排名訊號；只有預設門檻不同（請比較上表與
  下方的排程預設值）。
- 排程執行會分派至每個已設定代理的記憶工作區。

排程預設值（`plugins.entries.memory-core.config.dreaming`）：

| 鍵                                    | 預設值     |
| -------------------------------------- | ----------- |
| `frequency`                            | `0 3 * * *` |
| `phases.deep.minScore`                 | `0.8`       |
| `phases.deep.minRecallCount`           | `3`         |
| `phases.deep.minUniqueQueries`         | `3`         |
| `phases.deep.recencyHalfLifeDays`      | `14`        |
| `phases.deep.maxAgeDays`               | `30`        |
| `phases.deep.maxPromotedSnippetTokens` | `160`       |

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

完整的鍵清單與階段詳情：[夢境整理](/zh-TW/concepts/dreaming)、
[記憶設定參考](/zh-TW/reference/memory-config#dreaming)。

## SecretRef 閘道相依性

若主動記憶的遠端 API 金鑰欄位設定為 SecretRef，`memory`
命令會從作用中的閘道快照解析這些欄位；若閘道
無法使用，命令會立即失敗。這需要閘道支援
`secrets.resolve` 方法；較舊的閘道會傳回未知方法錯誤。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [記憶概覽](/zh-TW/concepts/memory)
