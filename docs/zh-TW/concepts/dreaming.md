---
read_when:
    - 你想讓記憶提升自動執行
    - 你想了解每個 Dreaming 階段的作用
    - 您想要調整整合流程，而不污染 MEMORY.md
sidebarTitle: Dreaming
summary: 透過淺層、深層與 REM 階段進行背景記憶鞏固，並提供夢境日記
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T20:45:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23057bfeaaac1cc6b2bf2ee78928c8fdd820c817e461cc0b77f7c1e40ac14c22
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming 是 `memory-core` 中的背景記憶鞏固系統。它協助 OpenClaw 將強烈的短期訊號移入持久記憶，同時讓流程保持可解釋且可檢閱。

<Note>
Dreaming 為**選擇啟用**，預設停用。
</Note>

## Dreaming 寫入的內容

Dreaming 會保留兩種輸出：

- `memory/.dreams/` 中的**機器狀態**（召回儲存、階段訊號、擷取檢查點、鎖定）。
- `DREAMS.md`（或既有的 `dreams.md`）中的**人類可讀輸出**，以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 底下的選用階段報告檔案。

長期提升仍只會寫入 `MEMORY.md`。

## 階段模型

Dreaming 使用三個協作階段：

| 階段  | 目的                         | 持久寫入          |
| ----- | ---------------------------- | ----------------- |
| Light | 排序並暫存最近的短期素材     | 否                |
| Deep  | 評分並提升持久候選項         | 是（`MEMORY.md`） |
| REM   | 反思主題與反覆出現的想法     | 否                |

這些階段是內部實作細節，而不是分開由使用者設定的「模式」。

<AccordionGroup>
  <Accordion title="Light 階段">
    Light 階段會擷取最近的每日記憶訊號與召回軌跡、將其去重，並暫存候選行。

    - 從短期召回狀態、最近的每日記憶檔案，以及可用時經遮蔽的工作階段逐字稿讀取。
    - 當儲存包含行內輸出時，寫入受管理的 `## Light Sleep` 區塊。
    - 記錄強化訊號，供後續 Deep 排名使用。
    - 絕不寫入 `MEMORY.md`。

  </Accordion>
  <Accordion title="Deep 階段">
    Deep 階段會決定哪些內容成為長期記憶。

    - 使用加權評分與閾值門檻為候選項排名。
    - 需要通過 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
    - 寫入前會從即時每日檔案重新補回片段，因此會略過過時或已刪除的片段。
    - 將已提升項目附加至 `MEMORY.md`。
    - 將 `## Deep Sleep` 摘要寫入 `DREAMS.md`，並可選擇寫入 `memory/dreaming/deep/YYYY-MM-DD.md`。

  </Accordion>
  <Accordion title="REM 階段">
    REM 階段會萃取模式與反思訊號。

    - 從最近的短期軌跡建立主題與反思摘要。
    - 當儲存包含行內輸出時，寫入受管理的 `## REM Sleep` 區塊。
    - 記錄由 Deep 排名使用的 REM 強化訊號。
    - 絕不寫入 `MEMORY.md`。

  </Accordion>
</AccordionGroup>

## 工作階段逐字稿擷取

Dreaming 可以將經遮蔽的工作階段逐字稿擷取到 Dreaming 語料庫中。當逐字稿可用時，它們會與每日記憶訊號和召回軌跡一起送入 Light 階段。個人與敏感內容會在擷取前先被遮蔽。

## Dream Diary

Dreaming 也會在 `DREAMS.md` 中保留敘事式 **Dream Diary**。每個階段累積足夠素材後，`memory-core` 會執行一次盡力而為的背景子代理回合，並附加一則簡短日記項目。除非設定了 `dreaming.model`，否則它會使用預設執行階段模型。若設定的模型無法使用，Dream Diary 會使用工作階段預設模型重試一次。

<Note>
這份日記是供人類在 Dreams UI 中閱讀，而不是提升來源。Dreaming 產生的日記／報告成品會排除在短期提升之外。只有有根據的記憶片段才有資格提升到 `MEMORY.md`。
</Note>

另有一條有根據的歷史回填路徑，用於檢閱與復原工作：

<AccordionGroup>
  <Accordion title="回填命令">
    - `memory rem-harness --path ... --grounded` 會從歷史 `YYYY-MM-DD.md` 筆記預覽有根據的日記輸出。
    - `memory rem-backfill --path ...` 會將可回復的有根據日記項目寫入 `DREAMS.md`。
    - `memory rem-backfill --path ... --stage-short-term` 會將有根據的持久候選項暫存到一般 Deep 階段已使用的同一個短期證據儲存。
    - `memory rem-backfill --rollback` 和 `--rollback-short-term` 會移除這些已暫存的回填成品，而不觸碰一般日記項目或即時短期召回。

  </Accordion>
</AccordionGroup>

Control UI 會公開同一套日記回填／重設流程，讓你可以先在 Dreams 場景中檢查結果，再決定這些有根據的候選項是否值得提升。場景也會顯示獨立的有根據路徑，讓你能看到哪些已暫存的短期項目來自歷史重播、哪些已提升項目是由有根據流程帶動，以及只清除僅限有根據的已暫存項目，而不觸碰一般即時短期狀態。

## Deep 排名訊號

Deep 排名會使用六個加權基礎訊號加上階段強化：

| 訊號     | 權重 | 說明                             |
| -------- | ---- | -------------------------------- |
| 頻率     | 0.24 | 該項目累積了多少短期訊號         |
| 相關性   | 0.30 | 該項目的平均擷取品質             |
| 查詢多樣性 | 0.15 | 讓它浮現的不同查詢／日期脈絡     |
| 近期性   | 0.15 | 經時間衰減的新鮮度分數           |
| 鞏固     | 0.10 | 跨日重複出現的強度               |
| 概念豐富度 | 0.06 | 來自片段／路徑的概念標籤密度     |

Light 和 REM 階段命中會從 `memory/.dreams/phase-signals.json` 加上一個小型、經近期性衰減的加成。

## 排程

啟用時，`memory-core` 會自動管理一個 Cron 工作，用於完整的 Dreaming 掃描。每次掃描會依序執行各階段：Light → REM → Deep。

掃描包含主要執行階段工作區與任何已設定的代理工作區，並依路徑去重，因此子代理工作區展開不會排除主代理的 `DREAMS.md` 與記憶狀態。

預設節奏行為：

| 設定                 | 預設          |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | 預設模型      |

## 快速開始

<Tabs>
  <Tab title="啟用 Dreaming">
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
  <Tab title="自訂掃描節奏">
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

## CLI 工作流程

<Tabs>
  <Tab title="提升預覽／套用">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    除非以 CLI 旗標覆寫，否則手動 `memory promote` 預設會使用 Deep 階段閾值。

  </Tab>
  <Tab title="說明提升">
    說明特定候選項為什麼會或不會提升：

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM 測試工具預覽">
    預覽 REM 反思、候選真實內容與 Deep 提升輸出，而不寫入任何內容：

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## 主要預設值

所有設定都位於 `plugins.entries.memory-core.config.dreaming` 底下。

<ParamField path="enabled" type="boolean" default="false">
  啟用或停用 Dreaming 掃描。
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  完整 Dreaming 掃描的 Cron 節奏。
</ParamField>
<ParamField path="model" type="string">
  選用的 Dream Diary 子代理模型覆寫。當同時設定子代理 `allowedModels` 允許清單時，請使用標準 `provider/model` 值。
</ParamField>

<Warning>
`dreaming.model` 需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`。若要限制它，也請設定 `plugins.entries.memory-core.subagent.allowedModels`。信任或允許清單失敗會保持可見，而不是靜默退回；重試只涵蓋模型不可用錯誤。
</Warning>

<Note>
階段政策、閾值和儲存行為是內部實作細節（不是面向使用者的設定）。完整鍵清單請參閱[記憶設定參考](/zh-TW/reference/memory-config#dreaming)。
</Note>

## Dreams UI

啟用時，Gateway **Dreams** 分頁會顯示：

- 目前的 Dreaming 啟用狀態
- 階段層級狀態與受管理掃描是否存在
- 短期、有根據、訊號，以及今日已提升計數
- 下一次排程執行時間
- 用於已暫存歷史重播項目的獨立有根據場景路徑
- 由 `doctor.memory.dreamDiary` 支援的可展開 Dream Diary 閱讀器

## 相關

- [記憶](/zh-TW/concepts/memory)
- [記憶 CLI](/zh-TW/cli/memory)
- [記憶設定參考](/zh-TW/reference/memory-config)
- [記憶搜尋](/zh-TW/concepts/memory-search)
