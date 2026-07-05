---
read_when:
    - 你想要記憶提升自動執行
    - 您想了解每個夢境整理階段的作用
    - 你想調整整合設定而不污染 MEMORY.md
sidebarTitle: Dreaming
summary: 背景記憶整理，包含淺層、深層和 REM 階段，以及夢境日記
title: 夢境整理
x-i18n:
    generated_at: "2026-07-05T11:13:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 220b41de84a3cecf932f1409faa7e53f17c3845fa90f4b67f5add6e224196aae
    source_path: concepts/dreaming.md
    workflow: 16
---

夢境整理是 `memory-core` 中的背景記憶整合系統。它會將強烈的短期訊號移入持久記憶，同時讓流程保持可解釋、可審查。

<Note>
夢境整理是**選擇啟用**，且預設停用。
</Note>

## 夢境整理會寫入什麼

- `memory/.dreams/` 中的**機器狀態**（召回儲存、階段訊號、擷取檢查點、鎖定）。
- `DREAMS.md`（或現有的 `dreams.md`）中的**人類可讀輸出**，以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的選用階段報告檔案。

長期提升仍然只會寫入 `MEMORY.md`。

## 階段模型

夢境整理每次掃描會依序執行三個協作階段：淺眠 -> REM -> 深眠。這些是內部實作階段，不是個別由使用者設定的模式。

| 階段 | 目的                                      | 持久寫入          |
| ----- | ----------------------------------------- | ----------------- |
| 淺眠 | 排序並暫存近期短期素材                    | 否                |
| REM   | 反思主題與反覆出現的想法                 | 否                |
| 深眠  | 評分並提升持久候選項                     | 是（`MEMORY.md`） |

<AccordionGroup>
  <Accordion title="淺眠階段">
    - 讀取近期短期召回狀態、每日記憶檔案，以及可用時經過遮蔽的工作階段逐字稿。
    - 去除重複訊號並暫存候選行。
    - 當儲存包含內嵌輸出時，寫入受管理的 `## Light Sleep` 區塊。
    - 記錄強化訊號，供後續深眠排序使用。
    - 絕不寫入 `MEMORY.md`。

  </Accordion>
  <Accordion title="REM 階段">
    - 從近期短期軌跡建立主題與反思摘要。
    - 當儲存包含內嵌輸出時，寫入受管理的 `## REM Sleep` 區塊。
    - 記錄深眠排序會使用的 REM 強化訊號。
    - 絕不寫入 `MEMORY.md`。

  </Accordion>
  <Accordion title="深眠階段">
    - 使用加權評分與門檻閘口排序候選項（`minScore`、`minRecallCount`、`minUniqueQueries` 都必須通過）。
    - 寫入前從即時每日檔案重新補水片段，因此會略過過時或已刪除的片段。
    - 將已提升項目附加至 `MEMORY.md`。
    - 將 `## Deep Sleep` 摘要寫入 `DREAMS.md`，並可選擇寫入 `memory/dreaming/deep/YYYY-MM-DD.md`。

  </Accordion>
</AccordionGroup>

## 工作階段逐字稿擷取

夢境整理可以將經過遮蔽的工作階段逐字稿擷取到夢境整理語料庫中。可用時，逐字稿會與每日記憶訊號和召回軌跡一起提供給淺眠階段使用。個人與敏感內容會在擷取前遮蔽。

## 夢境日誌

夢境整理會在 `DREAMS.md` 中維護敘事式**夢境日誌**。每個階段有足夠素材後，`memory-core` 會執行一次盡力而為的背景子代理回合，並附加一則簡短日誌項目；除非已設定 `dreaming.model`，否則使用預設執行階段模型。如果設定的模型無法使用，日誌執行會使用工作階段預設模型重試一次；信任或允許清單失敗不會重試，並會保留在記錄中可見，而不是靜默退回到一般日誌項目。

<Note>
日誌是給人類在 Dreams UI 中閱讀，不是提升來源。日誌／報告成品會排除在短期提升之外；只有有根據的記憶片段才有資格提升到 `MEMORY.md`。
</Note>

另有一條有根據的歷史回填路徑，用於審查與復原工作：

<AccordionGroup>
  <Accordion title="回填命令">
    - `memory rem-harness --path ... --grounded` 會從歷史 `YYYY-MM-DD.md` 筆記預覽有根據的日誌輸出。
    - `memory rem-backfill --path ...` 會將可逆的有根據日誌項目寫入 `DREAMS.md`。
    - `memory rem-backfill --path ... --stage-short-term` 會將有根據的持久候選項暫存到一般深眠階段使用的同一個短期證據儲存。
    - `memory rem-backfill --rollback` 和 `--rollback-short-term` 會移除那些暫存的回填成品，而不觸及一般日誌項目或即時短期召回。

  </Accordion>
</AccordionGroup>

Control UI 會公開相同的日誌回填／重設流程，讓你可以在 Dreams 場景中檢查結果，再決定有根據的候選項是否值得提升。一條不同的有根據 Scene 路徑會顯示哪些暫存短期項目來自歷史重播、哪些已提升項目是由有根據項目引導，並讓你只清除僅限有根據的暫存項目，而不觸及即時短期狀態。

## 深眠排序訊號

深眠排序使用六個加權基礎訊號加上階段強化：

| 訊號               | 權重 | 說明                                           |
| ------------------ | ---- | ---------------------------------------------- |
| 相關性             | 0.30 | 該項目的平均擷取品質                           |
| 頻率               | 0.24 | 該項目累積了多少短期訊號                       |
| 查詢多樣性         | 0.15 | 讓它浮現的不同查詢／日期脈絡                   |
| 近期性             | 0.15 | 隨時間衰減的新鮮度分數                         |
| 整合               | 0.10 | 多日重複出現的強度                             |
| 概念豐富度         | 0.06 | 片段／路徑中的概念標籤密度                     |

淺眠和 REM 階段命中會從 `memory/.dreams/phase-signals.json` 加上一個小型、隨近期性衰減的提升。

陰影試驗結果可以作為審查訊號疊加在基礎分數之上，且會在任何持久寫入前發生：有幫助的試驗會給候選項一個小型且有界的提升，中性的試驗會讓它維持延後，而有害的試驗會在該次評分中將它標記為拒絕。這個訊號僅用於報告，可以改變候選項排序或審查中繼資料，但絕不會寫入 `MEMORY.md`，也不會單獨提升候選項。

### QA 陰影試驗報告涵蓋範圍

QA Lab 包含一個僅報告情境，用於探索未來的夢境整理陰影試驗如何在提升前審查候選記憶：代理會比較基準答案與可使用候選記憶的答案，然後寫入一份本機報告，包含判定、原因與風險旗標。此涵蓋範圍限於 QA：它驗證報告成品會與 `MEMORY.md` 保持分離，且代理絕不宣稱候選項已提升。它不會新增生產環境陰影試驗行為，也不會變更深眠階段提升引擎。

`memory-core` 陰影試驗執行器會為需要穩定成品的程式碼路徑維持相同的僅報告契約。它接收候選項、試驗提示、基準結果、候選結果、判定、原因、風險旗標與證據參考，然後寫入一份包含 `promotion action: report-only` 的報告。有幫助的判定會對應到 `promote` 建議，中性判定會對應到 `defer`，有害判定會對應到 `reject`；這些都不會寫入 `MEMORY.md` 或套用深眠階段提升。

## 排程

啟用時，`memory-core` 會自動管理一個完整夢境整理掃描的排程作業，並在主要執行階段工作區與任何已設定的代理工作區之間去重，讓子代理工作區展開不會排除主代理的 `DREAMS.md` 與記憶狀態。

| 設定                 | 預設         |
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

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` 和 `/dreaming off` 對頻道呼叫者需要擁有者狀態，或對 Gateway 用戶端需要 `operator.admin`。`/dreaming status` 和 `/dreaming help` 是唯讀。

## 命令列介面工作流程

<Tabs>
  <Tab title="提升預覽／套用">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    除非以命令列介面旗標覆寫，手動 `memory promote` 預設會使用深眠階段門檻。

  </Tab>
  <Tab title="說明提升">
    說明特定候選項為何會或不會提升：

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM 測試工具預覽">
    預覽 REM 反思、候選事實與深眠提升輸出，而不寫入任何內容：

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## 主要預設值

所有設定都位於 `plugins.entries.memory-core.config.dreaming` 之下。

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
  從每個提升到 `MEMORY.md` 的短期召回片段保留的最大估計權杖數。排序來源仍然可見。
</ParamField>

<Warning>
`dreaming.model` 需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`。若要限制它，也請設定 `plugins.entries.memory-core.subagent.allowedModels`。自動重試只涵蓋模型無法使用錯誤；信任或允許清單失敗會保留在記錄中可見，而不是靜默退回。
</Warning>

<Note>
大多數階段政策、門檻與儲存行為都是內部實作細節。完整鍵清單請參閱[記憶設定參考](/zh-TW/reference/memory-config#dreaming)。
</Note>

## Dreams UI

啟用時，Gateway **Dreams** 分頁會顯示：

- 目前夢境整理啟用狀態
- 階段層級狀態與受管理掃描是否存在
- 短期、有根據、訊號與今日已提升計數
- 下一次排程執行時間
- 用於暫存歷史重播項目的不同有根據 Scene 路徑
- 由 `doctor.memory.dreamDiary` 支援的可展開夢境日誌閱讀器

## 相關

- [記憶](/zh-TW/concepts/memory)
- [記憶命令列介面](/zh-TW/cli/memory)
- [記憶設定參考](/zh-TW/reference/memory-config)
- [記憶搜尋](/zh-TW/concepts/memory-search)
