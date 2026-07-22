---
read_when:
    - 你想要為語意記憶建立索引或進行搜尋
    - 你正在偵錯記憶可用性或索引問題
    - 你想將回想起的短期記憶提升為 `MEMORY.md`
summary: '`openclaw memory` 的命令列介面參考（status/index/search/promote/promote-explain/rem-harness/rem-backfill）'
title: 記憶
x-i18n:
    generated_at: "2026-07-22T10:28:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6354745f8622ee80345325fa6f3e7d6c5f280cb63b9cdb100a766cf9e300af59
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

管理語意記憶的索引、搜尋，以及提升至 `MEMORY.md`。
由隨附的 `memory-core` 外掛提供，在
`plugins.slots.memory` 選取 `memory-core`（預設值）時可用。其他記憶
外掛會公開各自的命令列介面命名空間。

相關內容：[記憶](/zh-TW/concepts/memory)概念、[夢境整理](/zh-TW/concepts/dreaming)、
[記憶設定參考](/zh-TW/reference/memory-config)、[記憶 Wiki](/zh-TW/plugins/memory-wiki)、
[Wiki](/zh-TW/cli/wiki)、[外掛](/zh-TW/tools/plugin)。

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

未指定 `--agent` 時，會對 `agents.entries` 中的每個代理執行；若未設定代理清單，
則改用預設代理。

| 旗標        | 效果                                                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | 探測向量儲存區、嵌入提供者與語意搜尋的就緒狀態（會產生額外的提供者呼叫）。一般的 `memory status` 會保持快速並略過此步驟；向量／語意狀態不明表示未進行探測。即使使用 `--deep`，QMD 詞彙 `searchMode: "search"` 也一律略過語意向量探測。 |
| `--index`   | 若儲存區處於未同步狀態，則重新建立索引。隱含啟用 `--deep`。                                                                                                                                                                                                                                                          |
| `--fix`     | 修復過期的回憶鎖定，並正規化提升中繼資料。                                                                                                                                                                                                                                               |
| `--json`    | 輸出 JSON。                                                                                                                                                                                                                                                                                               |
| `--verbose` | 輸出各階段的詳細日誌。                                                                                                                                                                                                                                                                             |

若即使使用 `dreaming.enabled: true`，`Dreaming` 行仍維持 `off`，
或排程掃描似乎從未執行，受管理的夢境整理排程工作會依賴
預設代理的心跳偵測觸發，以啟動協調程序。排程詳情請參閱
[夢境整理](/zh-TW/concepts/dreaming)。

狀態也會列出 `memory.search.extraPaths` 中的所有額外搜尋路徑。

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

每個代理的範圍設定與 `status` 相同。`--force` 會執行完整重新索引，而非
增量索引。`--verbose` 會先輸出各代理的提供者、模型、來源與
額外路徑詳細資料，再顯示索引進度。

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- 查詢：位置引數 `[query]` 或 `--query <text>`。若兩者皆有設定，以 `--query`
  為準。若兩者皆未設定，命令會回報錯誤。
- `--agent <id>`：預設使用預設代理（而非完整代理清單）。
- `--max-results <n>`：限制結果數量（正整數）。
- `--min-score <n>`：篩除分數低於此值的相符項目。

## `memory promote`

從 `memory/YYYY-MM-DD.md` 排列短期候選項目的優先順序，並可選擇將
排名最高的項目附加至 `MEMORY.md`。

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| 旗標                       | 預設值      | 效果                                                            |
| -------------------------- | ------------ | ----------------------------------------------------------------- |
| `--limit <n>`              |              | 可傳回／套用的候選項目上限。                                   |
| `--min-score <n>`          | `0.75`       | 加權提升分數下限。                                 |
| `--min-recall-count <n>`   | `3`          | 所需的最低回憶次數。                                    |
| `--min-unique-queries <n>` | `2`          | 所需的最低相異查詢數。                            |
| `--apply`                  | 僅預覽 | 將選取的候選項目附加至 `MEMORY.md`，並將其標記為已提升。 |
| `--include-promoted`       |              | 包含先前週期中已提升的候選項目。           |
| `--json`                   |              | 輸出 JSON。                                                       |

這些命令列介面預設值與排程夢境整理掃描的深層階段
門檻不同（請參閱下方的[夢境整理](#dreaming)）；若要進行與
掃描行為一致的單次手動執行，請明確傳入旗標。

排名訊號包括：回憶頻率、擷取相關性、查詢多樣性、
時間新近性、跨日整合，以及衍生概念的豐富度；資料取自
記憶回憶與每日擷取階段，並對夢境整理中重複重訪的內容
提供輕度／REM 階段強化加成。寫入前，提升程序會重新讀取即時每日筆記，
因此會考量排名後對短期片段所做的編輯或刪除，
而不會從過期的快照進行提升。

## `memory promote-explain`

說明單一提升候選項目的分數明細。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` 可比對候選項目的鍵值（完全相符或子字串）、路徑或片段
文字。

## `memory rem-harness`

預覽 REM 反思、候選事實與深層階段提升輸出，
而不寫入任何內容。

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`：從歷史 `YYYY-MM-DD.md`
  每日檔案為測試工具提供初始資料，而非使用即時工作區。
- `--grounded`：另從歷史筆記呈現有依據的 `What Happened`／`Reflections`／
  `Possible Lasting Updates` 預覽。

## `memory rem-backfill`

將有依據的歷史 REM 摘要寫入 `DREAMS.md`，以供使用者介面審查。
此操作可復原。

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`：除非已設定 `--rollback`/`--rollback-short-term`，
  否則為必填。要作為回填來源的歷史每日記憶檔案或目錄。
- `--stage-short-term`：另將有依據的持久候選項目植入即時
  短期提升儲存區，讓一般深層階段可對其進行排名。
- `--rollback`：從 `DREAMS.md` 移除先前寫入且有依據的日記
  項目。
- `--rollback-short-term`：移除先前暫存且有依據的短期
  候選項目。

## 夢境整理

夢境整理是背景記憶整合系統，包含三個相互配合的
階段，依序按同一排程執行：**輕度**（整理／暫存短期
資料）、**REM**（反思並呈現主題）、**深層**（將持久
事實提升至 `MEMORY.md`）。只有深層階段會寫入 `MEMORY.md`。

- 使用 `plugins.entries.memory-core.config.dreaming.enabled: true` 啟用
  （預設為 `false`）；`memory-core` 會自動管理掃描排程工作，不需要手動
  `openclaw cron add`。
- 在聊天中使用 `/dreaming on|off` 切換；使用 `/dreaming status`
  （或 `/dreaming`/`/dreaming help`）檢查。`on`/`off` 需要頻道擁有者身分
  或閘道 `operator.admin`；任何可叫用此命令的人仍可使用 `status` 與說明。
- 人類可讀的階段輸出會寫入 `DREAMS.md`（或現有的 `dreams.md`）。
  依預設（`dreaming.storage.mode: "separate"`），每個階段也會將
  獨立報告寫入 `memory/dreaming/<phase>/YYYY-MM-DD.md`；設定 `mode:
"inline"` 可改為將報告合併至每日記憶檔案，或設定 `"both"`
  以同時使用兩者。
- 排程與手動 `memory promote` 執行會共用相同的深層階段
  排名訊號；只有預設門檻不同（請參閱上表與
  下方的排程預設值）。
- 排程執行會分派至每個已設定代理的記憶工作區。

排程預設值（`plugins.entries.memory-core.config.dreaming`）：

| 鍵值                                    | 預設值     |
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

完整鍵值清單與階段詳細資料：[夢境整理](/zh-TW/concepts/dreaming)、
[記憶設定參考](/zh-TW/reference/memory-config#dreaming)。

## SecretRef 閘道相依性

若主動記憶遠端 API 金鑰欄位設定為 SecretRef，`memory`
命令會從作用中的閘道快照解析這些欄位；若閘道
無法使用，命令會立即失敗。這需要支援
`secrets.resolve` 方法的閘道；較舊的閘道會傳回未知方法錯誤。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [記憶概覽](/zh-TW/concepts/memory)
