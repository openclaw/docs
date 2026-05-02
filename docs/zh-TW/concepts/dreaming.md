---
read_when:
    - 您想要自動執行記憶提升
    - 你想了解每個 Dreaming 階段的作用
    - 你想微調整合機制，而不污染 MEMORY.md
sidebarTitle: Dreaming
summary: 背景記憶整合，包含淺層、深層與 REM 階段，以及夢境日記
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T22:18:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: b56f93c68f53178e0998b9809ff358910956260f72ff7213b7d0dd92300f5d24
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming 是 `memory-core` 中的背景記憶整合系統。它協助 OpenClaw 將強烈的短期訊號移入持久記憶，同時讓流程保持可解釋且可審查。

<Note>
Dreaming 是**選擇啟用**，預設為停用。
</Note>

## Dreaming 寫入的內容

Dreaming 保留兩種輸出：

- **機器狀態**位於 `memory/.dreams/`（召回儲存、階段訊號、擷取檢查點、鎖定）。
- **人類可讀輸出**位於 `DREAMS.md`（或既有的 `dreams.md`），以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的選用階段報告檔案。

長期提升仍然只會寫入 `MEMORY.md`。

## 階段模型

Dreaming 使用三個協作階段：

| 階段  | 目的                     | 持久寫入          |
| ----- | ------------------------ | ----------------- |
| Light | 排序並暫存近期短期素材   | 否                |
| Deep  | 評分並提升持久候選項目   | 是（`MEMORY.md`） |
| REM   | 反思主題與反覆出現的想法 | 否                |

這些階段是內部實作細節，不是分開由使用者設定的「模式」。

<AccordionGroup>
  <Accordion title="Light 階段">
    Light 階段會擷取近期每日記憶訊號與召回軌跡、進行去重，並暫存候選行。

    - 從短期召回狀態、近期每日記憶檔案，以及可用時已遮蔽的工作階段轉錄讀取。
    - 當儲存包含內嵌輸出時，寫入受管理的 `## Light Sleep` 區塊。
    - 記錄強化訊號，供後續 Deep 排名使用。
    - 絕不寫入 `MEMORY.md`。

  </Accordion>
  <Accordion title="Deep 階段">
    Deep 階段決定哪些內容會成為長期記憶。

    - 使用加權評分與門檻閘門排序候選項目。
    - 必須通過 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
    - 寫入前會從即時每日檔案重新補水片段，因此會略過過時或已刪除的片段。
    - 將已提升的項目附加到 `MEMORY.md`。
    - 將 `## Deep Sleep` 摘要寫入 `DREAMS.md`，並可選擇寫入 `memory/dreaming/deep/YYYY-MM-DD.md`。

  </Accordion>
  <Accordion title="REM 階段">
    REM 階段會擷取模式與反思訊號。

    - 從近期短期軌跡建立主題與反思摘要。
    - 當儲存包含內嵌輸出時，寫入受管理的 `## REM Sleep` 區塊。
    - 記錄 REM 強化訊號，供 Deep 排名使用。
    - 絕不寫入 `MEMORY.md`。

  </Accordion>
</AccordionGroup>

## 工作階段轉錄擷取

Dreaming 可以將已遮蔽的工作階段轉錄擷取到 Dreaming 語料庫中。當轉錄可用時，它們會和每日記憶訊號與召回軌跡一起送入 Light 階段。個人與敏感內容會在擷取前先遮蔽。

## 夢境日記

Dreaming 也會在 `DREAMS.md` 中保留敘事性的**夢境日記**。每個階段有足夠素材後，`memory-core` 會以最佳努力方式執行背景子代理回合，並附加一則簡短日記項目。除非設定了 `dreaming.model`，否則會使用預設執行階段模型。如果設定的模型無法使用，夢境日記會使用工作階段預設模型重試一次。

<Note>
這份日記供人類在 Dreams UI 中閱讀，不是提升來源。Dreaming 產生的日記/報告成品會排除在短期提升之外。只有有依據的記憶片段才有資格提升到 `MEMORY.md`。
</Note>

另外也有一條有依據的歷史回填通道，可用於審查與復原工作：

<AccordionGroup>
  <Accordion title="回填命令">
    - `memory rem-harness --path ... --grounded` 會從歷史 `YYYY-MM-DD.md` 筆記預覽有依據的日記輸出。
    - `memory rem-backfill --path ...` 會將可逆的有依據日記項目寫入 `DREAMS.md`。
    - `memory rem-backfill --path ... --stage-short-term` 會將有依據的持久候選項目暫存到正常 Deep 階段已在使用的相同短期證據儲存。
    - `memory rem-backfill --rollback` 和 `--rollback-short-term` 會移除這些已暫存的回填成品，而不觸及一般日記項目或即時短期召回。

  </Accordion>
</AccordionGroup>

Control UI 會公開相同的日記回填/重設流程，讓你在決定有依據的候選項目是否值得提升前，可以先在 Dreams 場景中檢查結果。該場景也會顯示獨立的有依據通道，讓你能看到哪些已暫存的短期項目來自歷史重播、哪些已提升項目是由有依據內容引導，並且只清除僅有依據的已暫存項目，而不觸及一般即時短期狀態。

## Deep 排名訊號

Deep 排名使用六個加權基礎訊號，加上階段強化：

| 訊號       | 權重 | 說明                         |
| ---------- | ---- | ---------------------------- |
| 頻率       | 0.24 | 該項目累積了多少短期訊號     |
| 相關性     | 0.30 | 該項目的平均檢索品質         |
| 查詢多樣性 | 0.15 | 使其浮現的不同查詢/日期情境  |
| 近期性     | 0.15 | 隨時間衰減的新鮮度分數       |
| 整合       | 0.10 | 跨多日重複出現的強度         |
| 概念豐富度 | 0.06 | 來自片段/路徑的概念標籤密度  |

Light 和 REM 階段命中會從 `memory/.dreams/phase-signals.json` 加上一個小幅、隨近期性衰減的提升。

## 排程

啟用時，`memory-core` 會自動管理一個 Cron 工作，用於完整的 Dreaming 掃描。每次掃描會依序執行階段：Light → REM → Deep。

掃描會包含主要執行階段工作區，以及任何已設定的代理工作區，並依路徑去重，因此子代理工作區展開不會排除主代理的 `DREAMS.md` 與記憶狀態。

預設節奏行為：

| 設定                 | 預設         |
| -------------------- | ------------ |
| `dreaming.frequency` | `0 3 * * *`  |
| `dreaming.model`     | 預設模型     |

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
  <Tab title="提升預覽 / 套用">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    手動 `memory promote` 預設會使用 Deep 階段門檻，除非以 CLI 旗標覆寫。

  </Tab>
  <Tab title="說明提升">
    說明特定候選項目為何會或不會提升：

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness 預覽">
    預覽 REM 反思、候選事實與 Deep 提升輸出，而不寫入任何內容：

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## 主要預設值

所有設定都位於 `plugins.entries.memory-core.config.dreaming` 之下。

<ParamField path="enabled" type="boolean" default="false">
  啟用或停用 Dreaming 掃描。
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  完整 Dreaming 掃描的 Cron 節奏。
</ParamField>
<ParamField path="model" type="string">
  選用的夢境日記子代理模型覆寫。當同時設定子代理 `allowedModels` 允許清單時，請使用標準的 `provider/model` 值。
</ParamField>

<Warning>
`dreaming.model` 需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`。若要限制它，也請設定 `plugins.entries.memory-core.subagent.allowedModels`。信任或允許清單失敗會保持可見，而不是靜默退回；重試只涵蓋模型無法使用的錯誤。
</Warning>

<Note>
階段政策、門檻與儲存行為是內部實作細節（不是面向使用者的設定）。完整鍵清單請參閱[記憶設定參考](/zh-TW/reference/memory-config#dreaming)。
</Note>

## Dreams UI

啟用時，Gateway **Dreams** 分頁會顯示：

- 目前 Dreaming 啟用狀態
- 階段層級狀態與受管理掃描是否存在
- 短期、有依據、訊號與今日已提升計數
- 下一次排程執行時間
- 用於已暫存歷史重播項目的獨立有依據場景通道
- 由 `doctor.memory.dreamDiary` 支援的可展開夢境日記閱讀器

## Dreaming 從未執行：狀態顯示 blocked

如果 `openclaw memory status` 回報 `Dreaming status: blocked`，表示受管理 Cron 存在，但預設代理 Heartbeat 未觸發。請確認預設代理已啟用 Heartbeat，且其目標不是 `none`，然後在下一個 Heartbeat 間隔後再次執行 `openclaw memory status --deep`。

## 相關

- [記憶](/zh-TW/concepts/memory)
- [記憶 CLI](/zh-TW/cli/memory)
- [記憶設定參考](/zh-TW/reference/memory-config)
- [記憶搜尋](/zh-TW/concepts/memory-search)
