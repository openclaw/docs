---
read_when:
    - 你希望自動執行記憶提升
    - 你想了解每個夢境整理階段的作用
    - 你想要調整整合設定，又不想污染 MEMORY.md
sidebarTitle: Dreaming
summary: 具備淺層、深層與 REM 階段的背景記憶整合，以及夢境日記
title: 夢境整理
x-i18n:
    generated_at: "2026-07-12T14:25:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 501ab42cfdfa0216c308896aa8c1719b06b49d64a62afdb004e097102a376eac
    source_path: concepts/dreaming.md
    workflow: 16
---

夢境整理是 `memory-core` 中的背景記憶整合系統。它會將強烈的短期訊號轉移至持久記憶，同時讓整個流程保持可解釋且可供檢視。

<Note>
夢境整理採用**選用啟用**，預設為停用。
</Note>

## 夢境整理會寫入的內容

- `memory/.dreams/` 中的**機器狀態**（召回儲存區、階段訊號、擷取檢查點、鎖定）。
- `DREAMS.md`（或現有的 `dreams.md`）中的**人類可讀輸出**，以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的選用階段報告檔案。

長期提升仍只會寫入 `MEMORY.md`。

## 階段模型

每次掃描時，夢境整理會依序執行三個協同階段：淺眠 -> REM -> 深眠。這些是內部實作階段，而非由使用者分別設定的模式。

| 階段 | 用途                           | 持久寫入          |
| ---- | ------------------------------ | ----------------- |
| 淺眠 | 整理並暫存近期短期素材         | 否                |
| REM  | 反思主題與反覆出現的想法       | 否                |
| 深眠 | 評分並提升持久記憶候選項目     | 是（`MEMORY.md`） |

<AccordionGroup>
  <Accordion title="淺眠階段">
    - 讀取近期短期召回狀態、每日記憶檔案，以及可用時已遮蔽敏感資訊的工作階段文字記錄。
    - 將訊號去重並暫存候選行。
    - 當儲存設定包含行內輸出時，寫入受管理的 `## Light Sleep` 區塊。
    - 記錄強化訊號，供後續深眠排序使用。
    - 絕不寫入 `MEMORY.md`。

  </Accordion>
  <Accordion title="REM 階段">
    - 根據近期短期軌跡建立主題與反思摘要。
    - 當儲存設定包含行內輸出時，寫入受管理的 `## REM Sleep` 區塊。
    - 記錄供深眠排序使用的 REM 強化訊號。
    - 絕不寫入 `MEMORY.md`。

  </Accordion>
  <Accordion title="深眠階段">
    - 使用加權評分與門檻條件排列候選項目（`minScore`、`minRecallCount`、`minUniqueQueries` 必須全數通過）。
    - 寫入前，從即時每日檔案重新載入片段，因此會略過過時或已刪除的片段。
    - 將已提升的項目附加至 `MEMORY.md`。
    - 將 `## Deep Sleep` 摘要寫入 `DREAMS.md`，並可選擇寫入 `memory/dreaming/deep/YYYY-MM-DD.md`。

  </Accordion>
</AccordionGroup>

## 工作階段文字記錄擷取

夢境整理可以將已遮蔽敏感資訊的工作階段文字記錄擷取至夢境整理語料庫。文字記錄可用時，會與每日記憶訊號及召回軌跡一同提供給淺眠階段。個人與敏感內容會在擷取前遮蔽。

## 夢境日記

夢境整理會在 `DREAMS.md` 中保留敘事形式的**夢境日記**。每個階段累積足夠素材後，`memory-core` 會以盡力而為的方式在背景執行一次子代理程式回合，並附加一則簡短日記項目；除非已設定 `dreaming.model`，否則使用預設執行階段模型。如果設定的模型無法使用，日記執行程序會以工作階段預設模型重試一次；信任或允許清單失敗不會重試，並會保留在記錄中供查看，而不會默默改用通用日記項目。

<Note>
日記供使用者在夢境使用者介面中閱讀，不是提升來源。日記／報告成品不納入短期提升；只有以實際內容為依據的記憶片段才有資格提升至 `MEMORY.md`。
</Note>

另有一條以實際內容為依據的歷史回填路徑，可用於檢視與復原工作：

<AccordionGroup>
  <Accordion title="回填命令">
    - `memory rem-harness --path ... --grounded` 可預覽由歷史 `YYYY-MM-DD.md` 筆記產生、以實際內容為依據的日記輸出。
    - `memory rem-backfill --path ...` 會將可還原、以實際內容為依據的日記項目寫入 `DREAMS.md`。
    - `memory rem-backfill --path ... --stage-short-term` 會將以實際內容為依據的持久候選項目，暫存至一般深眠階段所使用的同一個短期證據儲存區。
    - `memory rem-backfill --rollback` 和 `--rollback-short-term` 會移除這些已暫存的回填成品，而不會影響一般日記項目或即時短期召回。

  </Accordion>
</AccordionGroup>

控制介面也在代理程式的「記憶」分頁（「代理程式」頁面）提供相同的日記回填／重設流程，讓你能先在夢境場景中檢查結果，再決定以實際內容為依據的候選項目是否值得提升。獨立的實據場景路徑會顯示哪些已暫存短期項目來自歷史重播、哪些已提升項目由實據主導，並可讓你只清除僅以實據為依據的暫存項目，而不影響即時短期狀態。

## 深眠排序訊號

深眠排序使用六個加權基礎訊號，再加上階段強化：

| 訊號       | 權重 | 說明                               |
| ---------- | ---- | ---------------------------------- |
| 相關性     | 0.30 | 該項目的平均擷取品質               |
| 頻率       | 0.24 | 該項目累積的短期訊號數量           |
| 查詢多樣性 | 0.15 | 使其浮現的不同查詢／日期情境       |
| 新近性     | 0.15 | 隨時間衰減的新鮮度分數             |
| 整合度     | 0.10 | 跨多日反覆出現的強度               |
| 概念豐富度 | 0.06 | 片段／路徑中的概念標籤密度         |

淺眠和 REM 階段的命中會根據 `memory/.dreams/phase-signals.json`，加入一小部分隨新近性衰減的加成。

在進行任何持久寫入之前，影子試驗結果可疊加於基礎分數之上，作為檢視訊號：有幫助的試驗會給候選項目小幅且有上限的加成，中性的試驗會使其維持延後狀態，而有害的試驗會在該次評分中將其標記為拒絕。此訊號僅用於報告——它可以變更候選項目的順序或檢視中繼資料，但絕不會寫入 `MEMORY.md`，也不會自行提升候選項目。

### QA 影子試驗報告涵蓋範圍

QA Lab 包含一個僅用於報告的情境，用來探索未來的夢境整理影子試驗如何在提升前檢視候選記憶：代理程式會比較基準答案與可使用候選記憶的答案，接著寫入包含判定、原因和風險旗標的本機報告。此涵蓋範圍僅限 QA——它會驗證報告成品與 `MEMORY.md` 保持分離，且代理程式絕不會聲稱候選項目已獲提升。它不會新增正式環境的影子試驗行為，也不會變更深眠階段的提升引擎。

`memory-core` 影子試驗執行器對於需要穩定成品的程式碼路徑，會維持相同的僅報告契約。它接受候選項目、試驗提示、基準結果、候選結果、判定、原因、風險旗標和證據參照，接著寫入含有 `promotion action: report-only` 的報告。有幫助的判定對應至 `promote` 建議，中性的判定對應至 `defer`，而有害的判定對應至 `reject`——這些都不會寫入 `MEMORY.md` 或套用深眠階段提升。

## 排程

啟用時，`memory-core` 會自動管理一項完整夢境整理掃描的排程工作，並在主要執行階段工作區與任何已設定的代理程式工作區之間去重，確保子代理程式工作區的展開不會排除主要代理程式的 `DREAMS.md` 和記憶狀態。

| 設定                 | 預設值       |
| -------------------- | ------------ |
| `dreaming.frequency` | `0 3 * * *`  |
| `dreaming.model`     | 預設模型     |

## 快速開始

<Tabs>
  <Tab title="啟用夢境整理">
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
  </Tab>
  <Tab title="自訂掃描週期">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true,
                "timezone": "America/Los_Angeles",
                "frequency": "0 */6 * * *"
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
</Tabs>

## 斜線命令

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

對頻道呼叫者而言，`/dreaming on` 和 `/dreaming off` 需要擁有者身分；對閘道用戶端而言，則需要 `operator.admin`。`/dreaming status` 和 `/dreaming help` 為唯讀。

## 命令列介面工作流程

<Tabs>
  <Tab title="提升預覽／套用">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    除非透過命令列介面旗標覆寫，手動執行 `memory promote` 預設會使用深眠階段門檻。

  </Tab>
  <Tab title="說明提升">
    說明特定候選項目為何會或不會獲得提升：

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM 測試工具預覽">
    預覽 REM 反思、候選事實和深眠提升輸出，而不寫入任何內容：

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## 主要預設值

所有設定都位於 `plugins.entries.memory-core.config.dreaming` 下。

<ParamField path="enabled" type="boolean" default="false">
  啟用或停用夢境整理掃描。
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  完整夢境整理掃描的排程週期。
</ParamField>
<ParamField path="model" type="string">
  選用的夢境日記子代理程式模型覆寫值。同時設定子代理程式的 `allowedModels` 允許清單時，請使用標準的 `provider/model` 值。
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  從每個提升至 `MEMORY.md` 的短期召回片段中保留的最大估算權杖數。排序來源資訊仍會保留供查看。
</ParamField>

<Warning>
`dreaming.model` 需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`。若要限制它，請同時設定 `plugins.entries.memory-core.subagent.allowedModels`。自動重試僅涵蓋模型無法使用的錯誤；信任或允許清單失敗會保留在記錄中供查看，而不會默默退回其他選項。
</Warning>

<Note>
大多數階段政策、門檻和儲存行為都是內部實作細節。完整的鍵值清單請參閱[記憶設定參考](/zh-TW/reference/memory-config#dreaming)。
</Note>

## 夢境使用者介面

啟用後，閘道的**夢境**分頁會顯示：

- 目前的夢境整理啟用狀態
- 各階段狀態與受管理掃描是否存在
- 短期、實據、訊號及今日已提升的數量
- 下次排定執行的時間
- 用於暫存歷史重播項目的獨立實據場景路徑
- 由 `doctor.memory.dreamDiary` 支援的可展開夢境日記閱讀器

## 相關內容

- [記憶](/zh-TW/concepts/memory)
- [記憶命令列介面](/zh-TW/cli/memory)
- [記憶設定參考](/zh-TW/reference/memory-config)
- [記憶搜尋](/zh-TW/concepts/memory-search)
