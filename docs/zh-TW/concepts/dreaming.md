---
read_when:
    - 你想要讓記憶提升自動執行
    - 你想了解每個 Dreaming 階段的作用
    - 您想在不污染 MEMORY.md 的情況下調整彙整機制
sidebarTitle: Dreaming
summary: 背景記憶整合，包含輕度、深度與 REM 階段，並提供夢境日誌
title: Dreaming
x-i18n:
    generated_at: "2026-04-30T02:59:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85c323c073fc786069835aad25ee68781af49bb031e63b9601674461f385cc2a
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming 是 `memory-core` 中的背景記憶整合系統。它協助 OpenClaw 將強烈的短期訊號移入持久記憶，同時讓流程保持可解釋且可審查。

<Note>
Dreaming 是**選擇啟用**，預設為停用。
</Note>

## Dreaming 寫入什麼

Dreaming 會保留兩種輸出：

- **機器狀態**於 `memory/.dreams/`（回憶儲存、階段訊號、擷取檢查點、鎖定）。
- **人類可讀輸出**於 `DREAMS.md`（或既有的 `dreams.md`），以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的選用階段報告檔案。

長期提升仍只會寫入 `MEMORY.md`。

## 階段模型

Dreaming 使用三個協作階段：

| 階段 | 用途                                      | 持久寫入          |
| ---- | ----------------------------------------- | ----------------- |
| 淺層 | 分類並暫存近期短期素材                    | 否                |
| 深層 | 評分並提升持久候選項                      | 是（`MEMORY.md`） |
| REM  | 反思主題與反覆出現的想法                  | 否                |

這些階段是內部實作細節，不是分開由使用者設定的「模式」。

<AccordionGroup>
  <Accordion title="淺層階段">
    淺層階段會擷取近期每日記憶訊號與回憶軌跡，將其去重，並暫存候選行。

    - 從短期回憶狀態、近期每日記憶檔案，以及可用時已遮蔽的工作階段逐字稿讀取。
    - 當儲存包含行內輸出時，寫入受管理的 `## Light Sleep` 區塊。
    - 記錄強化訊號，供之後的深層排序使用。
    - 絕不寫入 `MEMORY.md`。

  </Accordion>
  <Accordion title="深層階段">
    深層階段會決定哪些內容成為長期記憶。

    - 使用加權評分與門檻關卡排序候選項。
    - 需要通過 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
    - 在寫入前從即時每日檔案重新補水片段，因此會跳過過時或已刪除的片段。
    - 將提升的項目附加到 `MEMORY.md`。
    - 將 `## Deep Sleep` 摘要寫入 `DREAMS.md`，並可選擇寫入 `memory/dreaming/deep/YYYY-MM-DD.md`。

  </Accordion>
  <Accordion title="REM 階段">
    REM 階段會萃取模式與反思訊號。

    - 從近期短期軌跡建立主題與反思摘要。
    - 當儲存包含行內輸出時，寫入受管理的 `## REM Sleep` 區塊。
    - 記錄深層排序使用的 REM 強化訊號。
    - 絕不寫入 `MEMORY.md`。

  </Accordion>
</AccordionGroup>

## 工作階段逐字稿擷取

Dreaming 可以將已遮蔽的工作階段逐字稿擷取到 dreaming 語料庫中。當逐字稿可用時，它們會與每日記憶訊號和回憶軌跡一起送入淺層階段。個人與敏感內容會在擷取前先被遮蔽。

## 夢境日誌

Dreaming 也會在 `DREAMS.md` 中保留敘事式的**夢境日誌**。每個階段累積足夠素材後，`memory-core` 會以最大努力方式執行一次背景子代理回合，並附加一則短日誌項目。除非設定了 `dreaming.model`，否則它會使用預設執行階段模型。如果設定的模型無法使用，夢境日誌會使用工作階段預設模型重試一次。

<Note>
此日誌是供人類在 Dreams UI 中閱讀，不是提升來源。Dreaming 產生的日誌/報告成品會從短期提升中排除。只有有根據的記憶片段才有資格提升到 `MEMORY.md`。
</Note>

另有一條有根據的歷史回填路徑，供審查與復原工作使用：

<AccordionGroup>
  <Accordion title="回填指令">
    - `memory rem-harness --path ... --grounded` 會從歷史 `YYYY-MM-DD.md` 筆記預覽有根據的日誌輸出。
    - `memory rem-backfill --path ...` 會將可逆的有根據日誌項目寫入 `DREAMS.md`。
    - `memory rem-backfill --path ... --stage-short-term` 會將有根據的持久候選項暫存到一般深層階段已使用的相同短期證據儲存中。
    - `memory rem-backfill --rollback` 和 `--rollback-short-term` 會移除這些已暫存的回填成品，而不碰觸一般日誌項目或即時短期回憶。

  </Accordion>
</AccordionGroup>

Control UI 會公開相同的日誌回填/重設流程，讓你可以先在 Dreams 場景中檢查結果，再決定有根據的候選項是否值得提升。場景也會顯示獨立的有根據路徑，讓你看出哪些已暫存短期項目來自歷史重播、哪些已提升項目由有根據內容引導，並且只清除僅限有根據的已暫存項目，而不碰觸一般即時短期狀態。

## 深層排序訊號

深層排序使用六個加權基礎訊號加上階段強化：

| 訊號             | 權重 | 說明                                      |
| ---------------- | ---- | ----------------------------------------- |
| 頻率             | 0.24 | 該項目累積了多少短期訊號                  |
| 相關性           | 0.30 | 該項目的平均擷取品質                      |
| 查詢多樣性       | 0.15 | 讓它浮現的不同查詢/日期情境               |
| 新近性           | 0.15 | 經時間衰減的新鮮度分數                    |
| 整合             | 0.10 | 多日重複出現強度                          |
| 概念豐富度       | 0.06 | 來自片段/路徑的概念標籤密度               |

淺層與 REM 階段命中會從 `memory/.dreams/phase-signals.json` 加上一個小型、經新近性衰減的提升。

## 排程

啟用時，`memory-core` 會自動管理一個 cron 作業，用於完整的 Dreaming 掃描。每次掃描會依序執行階段：淺層 → REM → 深層。

預設節奏行為：

| 設定                 | 預設       |
| -------------------- | ---------- |
| `dreaming.frequency` | `0 3 * * *` |
| `dreaming.model`     | 預設模型   |

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

## 斜線指令

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

    手動 `memory promote` 預設會使用深層階段門檻，除非以 CLI 旗標覆寫。

  </Tab>
  <Tab title="說明提升">
    說明特定候選項為何會或不會被提升：

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness 預覽">
    預覽 REM 反思、候選真實項，以及深層提升輸出，而不寫入任何內容：

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
  選用的夢境日誌子代理模型覆寫。若也設定子代理 `allowedModels` 允許清單，請使用標準 `provider/model` 值。
</ParamField>

<Warning>
`dreaming.model` 需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`。若要限制它，也請設定 `plugins.entries.memory-core.subagent.allowedModels`。信任或允許清單失敗會保持可見，而不是靜默退回；重試只涵蓋模型無法使用的錯誤。
</Warning>

<Note>
階段政策、門檻與儲存行為都是內部實作細節（不是面向使用者的設定）。完整鍵清單請參閱[記憶設定參考](/zh-TW/reference/memory-config#dreaming)。
</Note>

## Dreams UI

啟用時，Gateway **Dreams** 分頁會顯示：

- 目前 Dreaming 啟用狀態
- 階段層級狀態與受管理掃描是否存在
- 短期、有根據、訊號，以及今日已提升的數量
- 下一次排程執行時間
- 用於已暫存歷史重播項目的獨立有根據場景路徑
- 由 `doctor.memory.dreamDiary` 支援的可展開夢境日誌閱讀器

## 相關

- [記憶](/zh-TW/concepts/memory)
- [記憶 CLI](/zh-TW/cli/memory)
- [記憶設定參考](/zh-TW/reference/memory-config)
- [記憶搜尋](/zh-TW/concepts/memory-search)
