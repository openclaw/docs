---
read_when:
    - 你希望記憶提升自動執行
    - 您想了解每個夢境整理階段的作用
    - 你想要在不污染 MEMORY.md 的情況下微調整合
sidebarTitle: Dreaming
summary: 背景記憶整合，包含淺層、深層與 REM 階段，以及夢境日誌
title: 夢境整理
x-i18n:
    generated_at: "2026-06-27T19:11:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 257e8095114e05f18e0ba7a6870765a6b88c80e1eedaccfa891faa231f68f01b
    source_path: concepts/dreaming.md
    workflow: 16
---

夢境整理是 `memory-core` 中的背景記憶整合系統。它協助 OpenClaw 將強烈的短期訊號移入持久記憶，同時讓流程保持可解釋且可審查。

<Note>
夢境整理是**選用**功能，預設為停用。
</Note>

## 夢境整理會寫入什麼

夢境整理會保留兩類輸出：

- `memory/.dreams/` 中的**機器狀態**（召回儲存、階段訊號、擷取檢查點、鎖定）。
- `DREAMS.md`（或既有的 `dreams.md`）中的**人類可讀輸出**，以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的選用階段報告檔案。

長期提升仍然只會寫入 `MEMORY.md`。

## 階段模型

夢境整理使用三個協作階段：

| 階段 | 目的 | 持久寫入 |
| ----- | ----------------------------------------- | ----------------- |
| 淺層 | 分類並暫存近期短期素材 | 否 |
| 深層 | 評分並提升持久候選項目 | 是（`MEMORY.md`） |
| REM | 反思主題與反覆出現的想法 | 否 |

這些階段是內部實作細節，不是分開由使用者設定的「模式」。

<AccordionGroup>
  <Accordion title="Light phase">
    淺層階段會擷取近期的每日記憶訊號與召回軌跡、去除重複，並暫存候選行。

    - 從短期召回狀態、近期每日記憶檔案，以及可用時已遮蔽的工作階段逐字稿讀取。
    - 當儲存包含內嵌輸出時，寫入受管理的 `## Light Sleep` 區塊。
    - 記錄強化訊號，供之後深層排序使用。
    - 絕不寫入 `MEMORY.md`。

  </Accordion>
  <Accordion title="Deep phase">
    深層階段決定哪些內容會成為長期記憶。

    - 使用加權評分與門檻關卡排序候選項目。
    - 必須通過 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
    - 寫入前會從即時每日檔案重新補水片段，因此會略過過期或已刪除的片段。
    - 將提升的項目附加到 `MEMORY.md`。
    - 將 `## Deep Sleep` 摘要寫入 `DREAMS.md`，並可選擇寫入 `memory/dreaming/deep/YYYY-MM-DD.md`。

  </Accordion>
  <Accordion title="REM phase">
    REM 階段會擷取模式與反思訊號。

    - 從近期短期軌跡建立主題與反思摘要。
    - 當儲存包含內嵌輸出時，寫入受管理的 `## REM Sleep` 區塊。
    - 記錄供深層排序使用的 REM 強化訊號。
    - 絕不寫入 `MEMORY.md`。

  </Accordion>
</AccordionGroup>

## 工作階段逐字稿擷取

夢境整理可以將已遮蔽的工作階段逐字稿擷取到夢境整理語料庫中。當逐字稿可用時，它們會與每日記憶訊號和召回軌跡一起送入淺層階段。個人與敏感內容會在擷取前先遮蔽。

## 夢境日誌

夢境整理也會在 `DREAMS.md` 中保留敘事性的**夢境日誌**。每個階段累積足夠素材後，`memory-core` 會執行一次盡力而為的背景子代理回合，並附加一則簡短日誌項目。除非設定了 `dreaming.model`，否則會使用預設執行階段模型。如果設定的模型無法使用，夢境日誌會使用工作階段預設模型重試一次。

<Note>
此日誌供人類在夢境 UI 中閱讀，不是提升來源。夢境整理產生的日誌與報告成品會排除在短期提升之外。只有有根據的記憶片段才有資格提升到 `MEMORY.md`。
</Note>

另外也有一條有根據的歷史回填通道，用於審查與復原工作：

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` 會從歷史 `YYYY-MM-DD.md` 筆記預覽有根據的日誌輸出。
    - `memory rem-backfill --path ...` 會將可逆的有根據日誌項目寫入 `DREAMS.md`。
    - `memory rem-backfill --path ... --stage-short-term` 會將有根據的持久候選項目暫存到一般深層階段已在使用的同一個短期證據儲存。
    - `memory rem-backfill --rollback` 和 `--rollback-short-term` 會移除這些暫存的回填成品，而不碰一般日誌項目或即時短期召回。

  </Accordion>
</AccordionGroup>

Control UI 會公開相同的日誌回填／重設流程，讓你可以先在夢境場景中檢視結果，再決定有根據的候選項目是否值得提升。該場景也會顯示獨立的有根據通道，讓你看出哪些暫存短期項目來自歷史重播、哪些已提升項目是由有根據內容主導，並且只清除僅屬於有根據來源的暫存項目，而不碰一般即時短期狀態。

## 深層排序訊號

深層排序使用六個加權基礎訊號，加上階段強化：

| 訊號 | 權重 | 說明 |
| ------------------- | ------ | ------------------------------------------------- |
| 頻率 | 0.24 | 該項目累積了多少短期訊號 |
| 相關性 | 0.30 | 該項目的平均擷取品質 |
| 查詢多樣性 | 0.15 | 讓它浮現的不同查詢／日期情境 |
| 近期性 | 0.15 | 經時間衰減的新鮮度分數 |
| 整合度 | 0.10 | 多日重現強度 |
| 概念豐富度 | 0.06 | 來自片段／路徑的概念標籤密度 |

淺層與 REM 階段命中會從 `memory/.dreams/phase-signals.json` 加上一個小幅、隨近期性衰減的提升。

影子試驗結果可以疊加在該基礎分數之上，作為任何持久寫入前的審查訊號。有幫助的試驗會給候選項目一個小幅且有界的提升，中性的試驗會讓它保持延後，有害的試驗會在該次評分中將它標記為拒絕。此訊號仍然僅供報告：它可以改變候選項目排序或審查中繼資料，但不會寫入 `MEMORY.md`，也不會自行提升候選項目。

## QA 影子試驗報告涵蓋範圍

QA Lab 包含一個僅供報告的情境，用於探索未來的夢境整理影子試驗如何在提升前審查候選記憶。該情境會要求代理比較基準答案與可使用候選記憶的答案，然後寫入一份包含判定、理由與風險旗標的本機報告。

此涵蓋範圍刻意限定於 QA。它會驗證報告成品與 `MEMORY.md` 保持分離，且代理不會宣稱候選項目已提升。它不會加入正式環境影子試驗行為，也不會變更深層階段提升引擎。

`memory-core` 影子試驗執行器會為需要穩定成品的程式碼路徑維持相同的僅供報告合約。它接受候選項目、試驗提示、基準結果、候選結果、判定、理由、風險旗標和證據參照，然後寫入一份包含 `promotion action: report-only` 的報告。有幫助的判定會對應到 `promote` 建議，中性判定會對應到 `defer`，有害判定會對應到 `reject`；這些建議都不會寫入 `MEMORY.md` 或套用深層階段提升。

## 排程

啟用後，`memory-core` 會自動管理一個排程工作，用於完整的夢境整理掃描。每次掃描會依序執行階段：淺層 → REM → 深層。

掃描包含主要執行階段工作區，以及任何已設定的代理工作區，並依路徑去重，因此子代理工作區扇出不會排除主要代理的 `DREAMS.md` 與記憶狀態。

預設節奏行為：

| 設定 | 預設 |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *` |
| `dreaming.model` | 預設模型 |

## 快速開始

<Tabs>
  <Tab title="Enable dreaming">
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
  <Tab title="Custom sweep cadence">
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

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## 命令列介面工作流程

<Tabs>
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    除非以命令列介面旗標覆寫，手動 `memory promote` 預設會使用深層階段門檻。

  </Tab>
  <Tab title="Explain promotion">
    說明特定候選項目為何會或不會提升：

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    預覽 REM 反思、候選事實與深層提升輸出，而不寫入任何內容：

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## 重要預設值

所有設定都位於 `plugins.entries.memory-core.config.dreaming` 下。

<ParamField path="enabled" type="boolean" default="false">
  啟用或停用夢境整理掃描。
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  完整夢境整理掃描的排程節奏。
</ParamField>
<ParamField path="model" type="string">
  選用的夢境日誌子代理模型覆寫。若同時設定子代理 `allowedModels` 允許清單，請使用標準 `provider/model` 值。
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  從每個提升到 `MEMORY.md` 的短期召回片段保留的最大估計 token 數。排序來源仍然可見。
</ParamField>

<Warning>
`dreaming.model` 需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`。若要限制它，也請設定 `plugins.entries.memory-core.subagent.allowedModels`。信任或允許清單失敗會保持可見，而不是靜默退回；重試只涵蓋模型不可用錯誤。
</Warning>

<Note>
大多數階段政策、門檻與儲存行為都是內部實作細節。完整鍵清單請參閱[記憶設定參考](/zh-TW/reference/memory-config#dreaming)。
</Note>

## 夢境 UI

啟用後，閘道的**夢境**分頁會顯示：

- 目前的夢境整理啟用狀態
- 階段層級狀態與受管理掃描是否存在
- 短期、有根據、訊號與今日已提升的計數
- 下一次排程執行時間
- 用於暫存歷史重播項目的獨立有根據場景通道
- 由 `doctor.memory.dreamDiary` 支援的可展開夢境日誌閱讀器

## 夢境整理從未執行：狀態顯示已封鎖

如果 `openclaw memory status` 回報 `Dreaming status: blocked`，表示受管理排程存在，但預設代理心跳偵測未觸發。請確認已為預設代理啟用心跳偵測，且其目標不是 `none`，然後在下一個心跳偵測間隔後再次執行 `openclaw memory status --deep`。

## 相關

- [記憶](/zh-TW/concepts/memory)
- [記憶命令列介面](/zh-TW/cli/memory)
- [記憶設定參考](/zh-TW/reference/memory-config)
- [記憶搜尋](/zh-TW/concepts/memory-search)
