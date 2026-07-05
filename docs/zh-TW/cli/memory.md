---
read_when:
    - 你想要索引或搜尋語意記憶
    - 你正在偵錯記憶體可用性或索引
    - 你想將已回想的短期記憶提升為 `MEMORY.md`
summary: '`openclaw memory` 的命令列介面參考（status/index/search/promote/promote-explain/rem-harness/rem-backfill）'
title: 記憶
x-i18n:
    generated_at: "2026-07-05T11:11:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

管理語意記憶索引、搜尋，以及提升到 `MEMORY.md`。
由內建的 `memory-core` 外掛提供，在
`plugins.slots.memory` 選取 `memory-core`（預設值）時可用。其他記憶
外掛會公開自己的命令列介面命名空間。

相關：[記憶](/zh-TW/concepts/memory) 概念、[夢境整理](/zh-TW/concepts/dreaming)、
[記憶設定參考](/zh-TW/reference/memory-config)、[記憶 Wiki](/zh-TW/plugins/memory-wiki)、
[wiki](/zh-TW/cli/wiki)、[外掛](/zh-TW/tools/plugin)。

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

若未指定 `--agent`，會針對 `agents.list` 中的每個代理執行；如果未設定代理清單，
則回退到預設代理。

| 旗標        | 效果                                                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | 探測向量儲存、嵌入提供者與語意搜尋是否就緒（意味著會有額外的提供者呼叫）。一般的 `memory status` 會保持快速並略過此項；未知的向量/語意狀態表示它未被探測。QMD 詞彙 `searchMode: "search"` 一律略過語意向量探測，即使搭配 `--deep` 也一樣。 |
| `--index`   | 如果儲存區是髒的，則重新建立索引。意味著 `--deep`。                                                                                                                                                                                                                                                          |
| `--fix`     | 修復過期的回想鎖定並正規化提升中繼資料。                                                                                                                                                                                                                                               |
| `--json`    | 列印 JSON。                                                                                                                                                                                                                                                                                               |
| `--verbose` | 輸出每個階段的詳細記錄。                                                                                                                                                                                                                                                                             |

如果即使設定 `dreaming.enabled: true`，`Dreaming` 行仍維持 `off`，或
排程掃描似乎從未執行，受管理的夢境整理排程會依賴
預設代理的心跳偵測觸發協調。排程細節請參閱
[夢境整理](/zh-TW/concepts/dreaming)。

狀態也會列出 `agents.defaults.memorySearch.extraPaths` 中的任何額外搜尋路徑。

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

與 `status` 相同的逐代理範圍。`--force` 會執行完整重新索引，而不是
增量重新索引。`--verbose` 會在顯示索引進度前，列印每個代理的提供者、模型、來源與
額外路徑詳細資訊。

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- 查詢：位置參數 `[query]` 或 `--query <text>`。如果兩者都設定，`--query`
  優先。如果兩者都未設定，命令會報錯。
- `--agent <id>`：預設為預設代理（不是完整代理清單）。
- `--max-results <n>`：限制結果數量（正整數）。
- `--min-score <n>`：篩掉低於此分數的相符項目。

## `memory promote`

從 `memory/YYYY-MM-DD.md` 排序短期候選項，並可選擇將
排名靠前的項目附加到 `MEMORY.md`。

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| 旗標                       | 預設值      | 效果                                                            |
| -------------------------- | ------------ | ----------------------------------------------------------------- |
| `--limit <n>`              |              | 要回傳/套用的最大候選項數。                                   |
| `--min-score <n>`          | `0.75`       | 最低加權提升分數。                                 |
| `--min-recall-count <n>`   | `3`          | 所需的最低回想次數。                                    |
| `--min-unique-queries <n>` | `2`          | 所需的最低不重複查詢數。                            |
| `--apply`                  | 僅預覽 | 將選取的候選項附加到 `MEMORY.md`，並標記為已提升。 |
| `--include-promoted`       |              | 包含先前週期中已提升的候選項。           |
| `--json`                   |              | 列印 JSON。                                                       |

這些命令列介面預設值不同於排程夢境整理掃描的深層階段
閾值（請參閱下方的[夢境整理](#dreaming)）；若要讓一次性的手動執行
符合掃描行為，請傳入明確旗標。

排序訊號：回想頻率、檢索相關性、查詢多樣性、
時間近因、跨日整合，以及衍生概念豐富度，來源包括
記憶回想與每日擷取流程，再加上針對重複夢境整理重訪的 light/REM 階段
強化加成。寫入前，提升會重新讀取即時每日筆記，因此
排序後對短期片段的編輯或刪除會被尊重，而不是從過期快照提升。

## `memory promote-explain`

說明單一提升候選項的分數拆解。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` 會比對候選項的鍵（完全相符或子字串）、路徑或片段
文字。

## `memory rem-harness`

預覽 REM 反思、候選真實內容，以及深層階段提升輸出，
不寫入任何內容。

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`：從歷史 `YYYY-MM-DD.md`
  每日檔案為測試工具播種，而不是使用即時工作區。
- `--grounded`：也從歷史筆記呈現有根據的 `What Happened` / `Reflections` /
  `Possible Lasting Updates` 預覽。

## `memory rem-backfill`

將有根據的歷史 REM 摘要寫入 `DREAMS.md`，供介面審閱。
可復原。

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`：除非設定了 `--rollback`/`--rollback-short-term`，
  否則為必填。要回填來源的歷史每日記憶檔案或目錄。
- `--stage-short-term`：也將有根據的持久候選項播種到即時
  短期提升儲存區，讓一般深層階段能對它們排序。
- `--rollback`：從 `DREAMS.md` 移除先前寫入的有根據日記項目。
- `--rollback-short-term`：移除先前暫存的有根據短期
  候選項。

## 夢境整理

夢境整理是背景記憶整合系統，包含三個協作
階段，依同一排程按順序執行：**light**（排序/暫存短期
素材）、**REM**（反思並浮現主題）、**deep**（將持久
事實提升到 `MEMORY.md`）。只有 deep 會寫入 `MEMORY.md`。

- 使用 `plugins.entries.memory-core.config.dreaming.enabled: true` 啟用
  （預設為 `false`）；`memory-core` 會自動管理掃描排程工作，不需要手動
  `openclaw cron add`。
- 可在聊天中用 `/dreaming on|off` 切換；用 `/dreaming status`
  檢查（或 `/dreaming`/`/dreaming help`）。`on`/`off` 需要頻道擁有者狀態
  或閘道 `operator.admin`；`status` 和說明則維持對任何能
  呼叫此命令的人可用。
- 人類可讀的階段輸出會寫入 `DREAMS.md`（或既有的 `dreams.md`）。
  預設情況下（`dreaming.storage.mode: "separate"`），每個階段也會將
  獨立報告寫入 `memory/dreaming/<phase>/YYYY-MM-DD.md`；將 `mode:
"inline"` 設定為改將報告折疊進每日記憶檔案，或設定為 `"both"`
  兩者皆用。
- 排程與手動 `memory promote` 執行共用相同的深層階段
  排序訊號；只有預設閾值不同（見上表與
  下方排程預設值）。
- 排程執行會展開到每個已設定代理的記憶工作區。

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

完整鍵清單與階段細節：[夢境整理](/zh-TW/concepts/dreaming)、
[記憶設定參考](/zh-TW/reference/memory-config#dreaming)。

## SecretRef 閘道相依性

如果主動記憶遠端 API 金鑰欄位設定為 SecretRefs，`memory`
命令會從作用中的閘道快照解析它們；如果閘道
無法使用，命令會快速失敗。這需要支援
`secrets.resolve` 方法的閘道；較舊的閘道會回傳未知方法錯誤。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [記憶概覽](/zh-TW/concepts/memory)
