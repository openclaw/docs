---
read_when:
    - 你想要為語意記憶建立索引或搜尋語意記憶
    - 正在排查記憶體可用性或索引問題
    - 你想要將已回想的短期記憶提升為 `MEMORY.md`
summary: '`openclaw memory` 的 CLI 參考（status/index/search/promote/promote-explain/rem-harness）'
title: 記憶
x-i18n:
    generated_at: "2026-05-06T17:53:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7137f8a9529095204699de5fee7a0baf5d5a377792dc93b4059145d0eefab737
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

管理語意記憶索引與搜尋。
由 Active Memory Plugin 提供（預設：`memory-core`；設定 `plugins.slots.memory = "none"` 可停用）。

相關：

- 記憶概念：[記憶](/zh-TW/concepts/memory)
- 記憶 Wiki：[記憶 Wiki](/zh-TW/plugins/memory-wiki)
- Wiki CLI：[wiki](/zh-TW/cli/wiki)
- Plugins：[Plugins](/zh-TW/tools/plugin)

## 範例

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## 選項

`memory status` 和 `memory index`：

- `--agent <id>`：限定在單一代理程式。若未指定，這些命令會對每個已設定的代理程式執行；若未設定代理程式清單，則會退回使用預設代理程式。
- `--verbose`：在探測與索引期間輸出詳細記錄。

`memory status`：

- `--deep`：探測本機向量儲存準備狀態、嵌入提供者準備狀態，以及語意向量搜尋準備狀態。單純的 `memory status` 會保持快速，且不會執行即時嵌入或提供者探索工作；未知的向量儲存或語意向量狀態表示該命令未探測它。QMD 詞彙 `searchMode: "search"` 即使搭配 `--deep`，也會略過語意向量探測與嵌入維護。
- `--index`：如果儲存區為 dirty，則執行重新索引（意味著 `--deep`）。
- `--fix`：修復過時的回憶鎖定並正規化提升中繼資料。
- `--json`：列印 JSON 輸出。

如果 `memory status` 顯示 `Dreaming status: blocked`，表示受管理的 Dreaming Cron 已啟用，但驅動它的 Heartbeat 未針對預設代理程式觸發。請參閱 [Dreaming 從未執行](/zh-TW/concepts/dreaming#dreaming-never-runs-status-shows-blocked)了解兩個常見原因。

`memory index`：

- `--force`：強制完整重新索引。

`memory search`：

- 查詢輸入：傳入位置參數 `[query]` 或 `--query <text>`。
- 如果兩者皆提供，`--query` 優先。
- 如果兩者皆未提供，命令會以錯誤結束。
- `--agent <id>`：限定在單一代理程式（預設：預設代理程式）。
- `--max-results <n>`：限制傳回的結果數量。
- `--min-score <n>`：篩除低分數相符項目。
- `--json`：列印 JSON 結果。

`memory promote`：

預覽並套用短期記憶提升。

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- 將提升寫入 `MEMORY.md`（預設：僅預覽）。
- `--limit <n>` -- 限制顯示的候選項目數量。
- `--include-promoted` -- 包含先前週期中已提升的項目。

完整選項：

- 使用加權提升訊號（`frequency`、`relevance`、`query diversity`、`recency`、`consolidation`、`conceptual richness`），從 `memory/YYYY-MM-DD.md` 排序短期候選項目。
- 使用來自記憶回憶與每日擷取流程的短期訊號，外加 light/REM 階段強化訊號。
- 當 Dreaming 啟用時，`memory-core` 會自動管理一個在背景執行完整掃描（`light -> REM -> deep`）的 Cron 工作（不需要手動 `openclaw cron add`）。
- `--agent <id>`：限定在單一代理程式（預設：預設代理程式）。
- `--limit <n>`：要傳回/套用的候選項目上限。
- `--min-score <n>`：最低加權提升分數。
- `--min-recall-count <n>`：候選項目所需的最低回憶次數。
- `--min-unique-queries <n>`：候選項目所需的最低不同查詢數。
- `--apply`：將選取的候選項目附加到 `MEMORY.md`，並標記為已提升。
- `--include-promoted`：在輸出中包含已提升的候選項目。
- `--json`：列印 JSON 輸出。

`memory promote-explain`：

說明特定提升候選項目及其分數細分。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`：要查找的候選鍵、路徑片段或片段文字。
- `--agent <id>`：限定在單一代理程式（預設：預設代理程式）。
- `--include-promoted`：包含已提升的候選項目。
- `--json`：列印 JSON 輸出。

`memory rem-harness`：

預覽 REM 反思、候選真實內容與深度提升輸出，而不寫入任何內容。

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`：限定在單一代理程式（預設：預設代理程式）。
- `--include-promoted`：包含已提升的深度候選項目。
- `--json`：列印 JSON 輸出。

## Dreaming

Dreaming 是背景記憶整合系統，包含三個協作
階段：**light**（排序/暫存短期材料）、**deep**（將持久
事實提升到 `MEMORY.md`），以及 **REM**（反思並呈現主題）。

- 使用 `plugins.entries.memory-core.config.dreaming.enabled: true` 啟用。
- 透過聊天中的 `/dreaming on|off` 切換（或用 `/dreaming status` 檢查）。
- Dreaming 會依一個受管理的掃描排程（`dreaming.frequency`）執行，並按順序執行各階段：light、REM、deep。
- 只有 deep 階段會將持久記憶寫入 `MEMORY.md`。
- 人類可讀的階段輸出與日記項目會寫入 `DREAMS.md`（或既有的 `dreams.md`），並可選擇在 `memory/dreaming/<phase>/YYYY-MM-DD.md` 中產生各階段報告。
- 排名使用加權訊號：回憶頻率、擷取相關性、查詢多樣性、時間近因性、跨日整合，以及衍生概念豐富度。
- 提升在寫入 `MEMORY.md` 前會重新讀取即時每日筆記，因此已編輯或刪除的短期片段不會從過時的回憶儲存快照中被提升。
- 排程與手動 `memory promote` 執行會共用相同的 deep 階段預設值，除非你傳入 CLI 閾值覆寫。
- 自動執行會展開到已設定的記憶工作區。

預設排程：

- **掃描節奏**：`dreaming.frequency = 0 3 * * *`
- **Deep 閾值**：`minScore=0.8`、`minRecallCount=3`、`minUniqueQueries=3`、`recencyHalfLifeDays=14`、`maxAgeDays=30`

範例：

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

注意事項：

- `memory index --verbose` 會列印各階段詳細資訊（提供者、模型、來源、批次活動）。
- `memory status` 會包含透過 `memorySearch.extraPaths` 設定的任何額外路徑。
- 如果實際作用中的記憶遠端 API 金鑰欄位設定為 SecretRefs，命令會從作用中的 Gateway 快照解析這些值。如果 Gateway 無法使用，命令會快速失敗。
- Gateway 版本偏差注意事項：此命令路徑需要支援 `secrets.resolve` 的 gateway；較舊的 gateways 會傳回未知方法錯誤。
- 使用 `dreaming.frequency` 調整排程掃描節奏。除此之外，deep 提升政策屬於內部行為；需要一次性手動覆寫時，請在 `memory promote` 使用 CLI 旗標。
- `memory rem-harness --path <file-or-dir> --grounded` 會從歷史每日筆記預覽有根據的 `What Happened`、`Reflections` 和 `Possible Lasting Updates`，而不寫入任何內容。
- `memory rem-backfill --path <file-or-dir>` 會將可逆的有根據日記項目寫入 `DREAMS.md` 以供 UI 檢閱。
- `memory rem-backfill --path <file-or-dir> --stage-short-term` 也會將有根據的持久候選項目植入即時短期提升儲存區，讓一般 deep 階段可以對它們排名。
- `memory rem-backfill --rollback` 會移除先前寫入的有根據日記項目，而 `memory rem-backfill --rollback-short-term` 會移除先前暫存的有根據短期候選項目。
- 請參閱 [Dreaming](/zh-TW/concepts/dreaming) 以取得完整階段說明與設定參考。

## 相關

- [CLI 參考](/zh-TW/cli)
- [記憶概覽](/zh-TW/concepts/memory)
