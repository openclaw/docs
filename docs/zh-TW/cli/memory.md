---
read_when:
    - 你想要為語意記憶建立索引或搜尋語意記憶
    - 你正在偵錯記憶體可用性或索引
    - 你想要將召回的短期記憶提升為 `MEMORY.md`
summary: '`openclaw memory` 的 CLI 參考 (status/index/search/promote/promote-explain/rem-harness)'
title: 記憶
x-i18n:
    generated_at: "2026-05-03T21:29:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: a33b848272c8853dd1a83e942124f0df30e096312e58a395c0ea08058e41f8fe
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

- `--agent <id>`：範圍限定到單一代理程式。若未指定，這些命令會針對每個已設定的代理程式執行；如果未設定代理程式清單，則會退回使用預設代理程式。
- `--verbose`：在探測和索引期間輸出詳細記錄。

`memory status`：

- `--deep`：探測本機向量儲存就緒狀態、嵌入提供者就緒狀態，以及語意向量搜尋就緒狀態。一般的 `memory status` 會保持快速，且不會執行即時嵌入或提供者探索工作；未知的向量儲存或語意向量狀態表示該命令未探測它。即使搭配 `--deep`，QMD 詞彙式 `searchMode: "search"` 也會略過語意向量探測與嵌入維護。
- `--index`：如果儲存區是髒的，則執行重新索引（隱含 `--deep`）。
- `--fix`：修復過期的回想鎖定並正規化提升中繼資料。
- `--json`：列印 JSON 輸出。

如果 `memory status` 顯示 `Dreaming status: blocked`，表示受管理的 dreaming cron 已啟用，但驅動它的 heartbeat 並未針對預設代理程式觸發。請參閱 [Dreaming 從未執行](/zh-TW/concepts/dreaming#dreaming-never-runs-status-shows-blocked) 了解兩個常見原因。

`memory index`：

- `--force`：強制完整重新索引。

`memory search`：

- 查詢輸入：傳入位置參數 `[query]` 或 `--query <text>`。
- 如果兩者都提供，則以 `--query` 為準。
- 如果兩者都未提供，命令會以錯誤結束。
- `--agent <id>`：範圍限定到單一代理程式（預設：預設代理程式）。
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

- 使用加權提升訊號（`frequency`、`relevance`、`query diversity`、`recency`、`consolidation`、`conceptual richness`）對來自 `memory/YYYY-MM-DD.md` 的短期候選項目排序。
- 使用來自記憶回想和每日擷取流程的短期訊號，加上 light/REM 階段強化訊號。
- 啟用 Dreaming 時，`memory-core` 會自動管理一個 Cron 工作，在背景執行完整掃描（`light -> REM -> deep`）（不需要手動 `openclaw cron add`）。
- `--agent <id>`：範圍限定到單一代理程式（預設：預設代理程式）。
- `--limit <n>`：要傳回/套用的候選項目上限。
- `--min-score <n>`：最低加權提升分數。
- `--min-recall-count <n>`：候選項目所需的最低回想次數。
- `--min-unique-queries <n>`：候選項目所需的最低相異查詢數。
- `--apply`：將選取的候選項目附加到 `MEMORY.md` 並標記為已提升。
- `--include-promoted`：在輸出中包含已提升的候選項目。
- `--json`：列印 JSON 輸出。

`memory promote-explain`：

說明特定提升候選項目及其分數細項。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`：要查找的候選項目鍵、路徑片段或片段摘要。
- `--agent <id>`：範圍限定到單一代理程式（預設：預設代理程式）。
- `--include-promoted`：包含已提升的候選項目。
- `--json`：列印 JSON 輸出。

`memory rem-harness`：

預覽 REM 反思、候選真相，以及 deep 提升輸出，而不寫入任何內容。

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`：範圍限定到單一代理程式（預設：預設代理程式）。
- `--include-promoted`：包含已提升的 deep 候選項目。
- `--json`：列印 JSON 輸出。

## Dreaming

Dreaming 是背景記憶整合系統，具有三個協同運作的
階段：**light**（排序/暫存短期素材）、**deep**（將持久
事實提升到 `MEMORY.md`），以及 **REM**（反思並呈現主題）。

- 使用 `plugins.entries.memory-core.config.dreaming.enabled: true` 啟用。
- 透過聊天中的 `/dreaming on|off` 切換（或使用 `/dreaming status` 檢視）。
- Dreaming 會依一個受管理的掃描排程（`dreaming.frequency`）執行，並按順序執行階段：light、REM、deep。
- 只有 deep 階段會將持久記憶寫入 `MEMORY.md`。
- 人類可讀的階段輸出和日記項目會寫入 `DREAMS.md`（或現有的 `dreams.md`），並可選擇在 `memory/dreaming/<phase>/YYYY-MM-DD.md` 中提供各階段報告。
- 排序使用加權訊號：回想頻率、擷取相關性、查詢多樣性、時間新近性、跨日整合，以及衍生概念豐富度。
- 提升會在寫入 `MEMORY.md` 前重新讀取即時每日筆記，因此已編輯或刪除的短期片段不會從過期的回想儲存快照中被提升。
- 除非你傳入 CLI 閾值覆寫，排程和手動 `memory promote` 執行會共用相同的 deep 階段預設值。
- 自動執行會擴展到所有已設定的記憶工作區。

預設排程：

- **掃描頻率**：`dreaming.frequency = 0 3 * * *`
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

備註：

- `memory index --verbose` 會列印各階段詳細資料（提供者、模型、來源、批次活動）。
- `memory status` 會包含透過 `memorySearch.extraPaths` 設定的任何額外路徑。
- 如果有效的 Active Memory 遠端 API 金鑰欄位設定為 SecretRefs，命令會從作用中的 Gateway 快照解析這些值。如果 Gateway 無法使用，命令會快速失敗。
- Gateway 版本偏差注意事項：此命令路徑需要支援 `secrets.resolve` 的 Gateway；較舊的 Gateway 會傳回 unknown-method 錯誤。
- 使用 `dreaming.frequency` 調整排程掃描頻率。Deep 提升政策在其他方面屬於內部；需要一次性手動覆寫時，請在 `memory promote` 使用 CLI 旗標。
- `memory rem-harness --path <file-or-dir> --grounded` 會從歷史每日筆記預覽有依據的 `What Happened`、`Reflections` 和 `Possible Lasting Updates`，而不寫入任何內容。
- `memory rem-backfill --path <file-or-dir>` 會將可逆的有依據日記項目寫入 `DREAMS.md`，供 UI 審閱。
- `memory rem-backfill --path <file-or-dir> --stage-short-term` 也會將有依據的持久候選項目種入即時短期提升儲存區，讓一般 deep 階段可以排序它們。
- `memory rem-backfill --rollback` 會移除先前寫入的有依據日記項目，而 `memory rem-backfill --rollback-short-term` 會移除先前暫存的有依據短期候選項目。
- 請參閱 [Dreaming](/zh-TW/concepts/dreaming) 取得完整階段說明和設定參考。

## 相關

- [CLI 參考](/zh-TW/cli)
- [記憶概觀](/zh-TW/concepts/memory)
