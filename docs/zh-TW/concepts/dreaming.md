---
read_when:
    - 你想要記憶提升自動執行
    - 你想了解每個夢境整理階段的作用
    - 你想調整彙整設定，而不污染 MEMORY.md
sidebarTitle: Dreaming
summary: 具備淺層、深層和 REM 階段，以及夢境日誌的背景記憶整合
title: 夢境整理
x-i18n:
    generated_at: "2026-06-30T13:47:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b636df63cdc5b60758f9600af695b3b6453122a03b0cc6fdc69d3c9259d1e61
    source_path: concepts/dreaming.md
    workflow: 16
---

夢境整理是 `memory-core` 中的背景記憶整合系統。它可協助 OpenClaw 將強烈的短期訊號移入持久記憶，同時讓流程保持可解釋且可審閱。

<Note>
夢境整理是**選用**功能，預設為停用。
</Note>

## 夢境整理寫入的內容

夢境整理會保留兩種輸出：

- `memory/.dreams/` 中的**機器狀態**（召回儲存、階段訊號、擷取檢查點、鎖定）。
- `DREAMS.md`（或現有的 `dreams.md`）中的**人類可讀輸出**，以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 底下可選的階段報告檔案。

長期提升仍然只會寫入 `MEMORY.md`。

## 階段模型

夢境整理使用三個協作階段：

| 階段 | 用途 | 持久寫入 |
| ----- | ----------------------------------------- | ----------------- |
| 輕層 | 整理並暫存近期短期素材 | 否 |
| 深層 | 評分並提升持久候選項目 | 是（`MEMORY.md`） |
| REM | 反思主題與反覆出現的想法 | 否 |

這些階段是內部實作細節，不是分開由使用者設定的「模式」。

<AccordionGroup>
  <Accordion title="輕層階段">
    輕層階段會擷取近期每日記憶訊號與召回軌跡、去除重複項目，並暫存候選行。

    - 可用時，從短期召回狀態、近期每日記憶檔案，以及已遮蔽的工作階段逐字稿讀取。
    - 當儲存包含行內輸出時，寫入受管理的 `## Light Sleep` 區塊。
    - 記錄強化訊號供後續深層排序使用。
    - 絕不寫入 `MEMORY.md`。

  </Accordion>
  <Accordion title="深層階段">
    深層階段會決定哪些內容成為長期記憶。

    - 使用加權評分與門檻關卡排序候選項目。
    - 必須通過 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
    - 寫入前會從即時每日檔案重新補回片段，因此會略過過時或已刪除的片段。
    - 將提升的項目附加到 `MEMORY.md`。
    - 將 `## Deep Sleep` 摘要寫入 `DREAMS.md`，並可選擇寫入 `memory/dreaming/deep/YYYY-MM-DD.md`。

  </Accordion>
  <Accordion title="REM 階段">
    REM 階段會擷取模式與反思訊號。

    - 從近期短期軌跡建立主題與反思摘要。
    - 當儲存包含行內輸出時，寫入受管理的 `## REM Sleep` 區塊。
    - 記錄深層排序使用的 REM 強化訊號。
    - 絕不寫入 `MEMORY.md`。

  </Accordion>
</AccordionGroup>

## 工作階段逐字稿擷取

夢境整理可以將已遮蔽的工作階段逐字稿擷取到夢境整理語料庫中。當逐字稿可用時，它們會與每日記憶訊號和召回軌跡一同送入輕層階段。個人與敏感內容會在擷取前被遮蔽。

## 夢境日記

夢境整理也會在 `DREAMS.md` 中保留敘事式**夢境日記**。每個階段有足夠素材後，`memory-core` 會以最佳努力方式執行一次背景子代理回合，並附加一則短日記項目。除非設定了 `dreaming.model`，否則它會使用預設執行階段模型。如果設定的模型不可用，夢境日記會使用工作階段預設模型重試一次。

<Note>
這份日記供人類在 Dreams UI 中閱讀，不是提升來源。夢境整理產生的日記／報告成品會排除於短期提升之外。只有有根據的記憶片段才符合提升到 `MEMORY.md` 的資格。
</Note>

此外，也有一條有根據的歷史回填路徑，用於審閱與復原工作：

<AccordionGroup>
  <Accordion title="回填命令">
    - `memory rem-harness --path ... --grounded` 會從歷史 `YYYY-MM-DD.md` 筆記預覽有根據的日記輸出。
    - `memory rem-backfill --path ...` 會將可回復的有根據日記項目寫入 `DREAMS.md`。
    - `memory rem-backfill --path ... --stage-short-term` 會將有根據的持久候選項目暫存到一般深層階段已使用的同一個短期證據儲存中。
    - `memory rem-backfill --rollback` 和 `--rollback-short-term` 會移除這些已暫存的回填成品，而不影響一般日記項目或即時短期召回。

  </Accordion>
</AccordionGroup>

Control UI 會公開相同的日記回填／重設流程，讓你能在決定有根據的候選項目是否值得提升前，先在 Dreams 場景中檢查結果。Scene 也會顯示獨立的有根據路徑，讓你看出哪些已暫存短期項目來自歷史重播、哪些已提升項目是由有根據項目帶動，以及只清除僅有根據的已暫存項目，而不影響一般即時短期狀態。

## 深層排序訊號

深層排序使用六個加權基礎訊號加上階段強化：

| 訊號 | 權重 | 說明 |
| ------------------- | ------ | ------------------------------------------------- |
| 頻率 | 0.24 | 該項目累積的短期訊號數量 |
| 相關性 | 0.30 | 該項目的平均擷取品質 |
| 查詢多樣性 | 0.15 | 讓它浮現的不同查詢／日期脈絡 |
| 近期性 | 0.15 | 隨時間衰減的新鮮度分數 |
| 整合 | 0.10 | 跨日重複出現的強度 |
| 概念豐富度 | 0.06 | 來自片段／路徑的概念標籤密度 |

輕層與 REM 階段命中會從 `memory/.dreams/phase-signals.json` 加上一個小幅、隨近期性衰減的提升。

陰影試驗結果可以疊加在該基礎分數上，作為任何持久寫入前的審閱訊號。有幫助的試驗會給候選項目一個小幅且有界的提升，中立試驗會讓它保持延後，有害試驗則會在該次評分中將它標記為已拒絕。此訊號仍然僅供報告：它可以改變候選項目排序或審閱中繼資料，但不會寫入 `MEMORY.md`，也不會自行提升候選項目。

## QA 陰影試驗報告覆蓋

QA Lab 包含一個僅供報告的情境，用於探索未來的夢境整理陰影試驗如何在提升前審閱候選記憶。該情境會要求代理比較基準答案與可使用候選記憶的答案，然後寫入一份本機報告，包含裁定、理由和風險旗標。

此覆蓋範圍刻意限定於 QA。它會驗證報告成品與 `MEMORY.md` 保持分離，且代理不會聲稱候選項目已被提升。它不會新增生產環境陰影試驗行為，也不會變更深層階段提升引擎。

`memory-core` 陰影試驗執行器會為需要穩定成品的程式碼路徑保留相同的僅報告合約。它會接受候選項目、試驗提示、基準結果、候選結果、裁定、理由、風險旗標與證據參照，然後寫入一份含有 `promotion action: report-only` 的報告。有幫助的裁定會對應到 `promote` 建議，中立裁定對應到 `defer`，有害裁定對應到 `reject`；這些建議都不會寫入 `MEMORY.md`，也不會套用深層階段提升。

## 排程

啟用後，`memory-core` 會自動管理一個用於完整夢境整理掃描的 Cron 工作。每次掃描會依序執行階段：輕層 → REM → 深層。

掃描包含主要執行階段工作區，以及任何已設定的代理工作區，並依路徑去重，因此子代理工作區展開不會排除主要代理的 `DREAMS.md` 與記憶狀態。

預設週期行為：

| 設定 | 預設 |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *` |
| `dreaming.model` | 預設模型 |

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

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` 和 `/dreaming off` 會變更整個閘道的設定。頻道呼叫者必須是擁有者，且閘道用戶端必須具有 `operator.admin`。`/dreaming status` 和 `/dreaming help` 仍為唯讀。

## 命令列介面工作流程

<Tabs>
  <Tab title="提升預覽／套用">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    除非使用命令列介面旗標覆寫，否則手動 `memory promote` 預設會使用深層階段門檻。

  </Tab>
  <Tab title="說明提升">
    說明特定候選項目為何會或不會提升：

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM 測試工具預覽">
    預覽 REM 反思、候選事實與深層提升輸出，而不寫入任何內容：

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
  完整夢境整理掃描的 Cron 週期。
</ParamField>
<ParamField path="model" type="string">
  可選的夢境日記子代理模型覆寫。同時設定子代理 `allowedModels` 允許清單時，請使用標準 `provider/model` 值。
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  從每個被提升到 `MEMORY.md` 的短期召回片段保留的最大估計 token 數。排序來源仍會可見。
</ParamField>

<Warning>
`dreaming.model` 需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`。若要限制它，另請設定 `plugins.entries.memory-core.subagent.allowedModels`。信任或允許清單失敗會保持可見，而不是靜默退回；重試只涵蓋模型不可用錯誤。
</Warning>

<Note>
大多數階段政策、門檻與儲存行為都是內部實作細節。完整鍵清單請參閱[記憶設定參考](/zh-TW/reference/memory-config#dreaming)。
</Note>

## Dreams UI

啟用後，閘道 **Dreams** 分頁會顯示：

- 目前夢境整理啟用狀態
- 階段層級狀態與受管理掃描是否存在
- 短期、有根據、訊號與今日已提升計數
- 下一次排程執行時間
- 用於已暫存歷史重播項目的獨立有根據 Scene 路徑
- 由 `doctor.memory.dreamDiary` 支援的可展開夢境日記閱讀器

## 夢境整理永不執行：狀態顯示已封鎖

如果 `openclaw memory status` 回報 `Dreaming status: blocked`，表示受管理 Cron 存在，但預設代理心跳偵測未觸發。請檢查預設代理的心跳偵測已啟用，且其目標不是 `none`，然後在下一個心跳偵測間隔後再次執行 `openclaw memory status --deep`。

## 相關

- [記憶](/zh-TW/concepts/memory)
- [記憶命令列介面](/zh-TW/cli/memory)
- [記憶設定參考](/zh-TW/reference/memory-config)
- [記憶搜尋](/zh-TW/concepts/memory-search)
