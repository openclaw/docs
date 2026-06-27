---
read_when:
    - 你想要超越普通 MEMORY.md 筆記的持久知識
    - 你正在設定內建的 memory-wiki 外掛
    - 你想了解 wiki_search、wiki_get 或 bridge 模式
summary: memory-wiki：帶有來源、主張、儀表板與橋接模式的已編譯知識庫
title: 記憶維基
x-i18n:
    generated_at: "2026-06-27T19:38:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` 是一個內建外掛，會將持久記憶轉成編譯後的知識庫。

它**不會**取代主動記憶外掛。主動記憶外掛仍然負責回憶、提升、索引與夢境整理。`memory-wiki` 位於它旁邊，將持久知識編譯成可導覽的 wiki，並具備確定性的頁面、結構化聲明、來源、儀表板與機器可讀摘要。

當你希望記憶更像一個維護中的知識層，而不是一堆 Markdown 檔案時，請使用它。

## 它新增的功能

- 具備確定性頁面版面的專用 wiki 知識庫
- 結構化聲明與證據中繼資料，而不只是散文
- 頁面層級的來源、信心分數、矛盾與未解問題
- 供代理程式/執行階段消費者使用的編譯摘要
- wiki 原生的搜尋/取得/套用/lint 工具
- 將 Open Knowledge Format 匯入為編譯後的 wiki 概念
- 可選的橋接模式，用來從主動記憶外掛匯入公開成品
- 可選的 Obsidian 友善轉譯模式與命令列介面整合

## 它如何與記憶搭配

可以這樣理解分工：

| 層級                                                    | 負責                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 主動記憶外掛（`memory-core`、QMD、Honcho 等）           | 回憶、語意搜尋、提升、夢境整理、記憶執行階段                                               |
| `memory-wiki`                                           | 編譯後的 wiki 頁面、富含來源的綜合內容、儀表板、wiki 專用搜尋/取得/套用                    |

如果主動記憶外掛公開共享的回憶成品，OpenClaw 可以用 `memory_search corpus=all` 一次搜尋兩個層級。

當你需要 wiki 專用排序、來源或直接頁面存取時，請改用 wiki 原生工具。

## 建議的混合模式

對 local-first 設定來說，一個穩健的預設是：

- 使用 QMD 作為主動記憶後端，以進行回憶與廣泛語意搜尋
- 以 `bridge` 模式使用 `memory-wiki`，產生持久的綜合知識頁面

這種分工很適合，因為每個層級都能保持專注：

- QMD 讓原始筆記、工作階段匯出與額外集合保持可搜尋
- `memory-wiki` 編譯穩定實體、聲明、儀表板與來源頁面

實用規則：

- 當你想對記憶進行一次廣泛回憶時，使用 `memory_search`
- 當你想要具備來源感知的 wiki 結果時，使用 `wiki_search` 和 `wiki_get`
- 當你想讓共享搜尋跨越兩個層級時，使用 `memory_search corpus=all`

如果橋接模式回報匯出的成品數量為零，表示主動記憶外掛目前尚未公開橋接輸入。請先執行 `openclaw wiki doctor`，再確認主動記憶外掛支援公開成品。

當橋接模式啟用且 `bridge.readMemoryArtifacts` 已啟用時，`openclaw wiki status`、`openclaw wiki doctor` 和 `openclaw wiki bridge
import` 會透過執行中的閘道讀取。這會讓命令列介面橋接檢查與執行階段記憶外掛脈絡保持一致。如果橋接已停用，或成品讀取已關閉，這些命令會維持其本機/離線行為。

## 知識庫模式

`memory-wiki` 支援三種知識庫模式：

### `isolated`

自己的知識庫、自己的來源，不依賴 `memory-core`。

當你希望 wiki 成為自己策展的知識儲存區時，請使用此模式。

### `bridge`

透過公開外掛 SDK 介面，從主動記憶外掛讀取公開記憶成品與記憶事件。

當你希望 wiki 編譯並整理記憶外掛匯出的成品，而不深入私有外掛內部實作時，請使用此模式。

橋接模式可以索引：

- 匯出的記憶成品
- 夢境整理報告
- 每日筆記
- 記憶根目錄檔案
- 記憶事件記錄

### `unsafe-local`

針對本機私有路徑的明確同機器逃生口。

此模式刻意設計為實驗性且不可攜。只有在你理解信任邊界，且明確需要橋接模式無法提供的本機檔案系統存取時，才使用它。

## 知識庫版面

此外掛會初始化如下知識庫：

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

受管理內容會保留在產生的區塊內。人工筆記區塊會被保留。

主要頁面群組是：

- `sources/` 用於匯入的原始素材與橋接支援頁面
- `entities/` 用於持久的事物、人物、系統、專案與物件
- `concepts/` 用於想法、抽象概念、模式與政策
- `syntheses/` 用於編譯後摘要與維護中的彙總
- `reports/` 用於產生的儀表板

## Open Knowledge Format 匯入

`memory-wiki` 可以用以下命令匯入已解封的 Open Knowledge Format bundle：

```bash
openclaw wiki okf import ./bundles/ga4
```

當資料目錄、文件爬蟲或強化代理程式已經產生 OKF 時，這是最乾淨的搭配方式：將 OKF 保留為可攜交換成品，再讓 `memory-wiki` 將其轉成 OpenClaw 原生概念頁面與編譯摘要。

匯入器遵循 OKF v0.1 形狀：

- 非保留的 `.md` 檔案是概念文件
- 每個匯入的概念都需要非空的 `type` frontmatter 欄位
- 未知的 OKF `type` 值會被接受
- 保留的 `index.md` 與 `log.md` 檔案不會作為概念匯入
- 損壞或外部 Markdown 連結會被保留

匯入的概念頁面會扁平化到 `concepts/` 下方，因此既有的編譯、搜尋、取得、儀表板與提示摘要路徑可以看見它們，而不需要新增第二棵 wiki 樹。每個頁面都保留原始 OKF 概念 ID、來源路徑、`type`、`resource`、`tags`、時間戳記，以及完整的產生者 frontmatter。內部 OKF 連結會改寫為產生的 wiki 概念頁面，並且也會以 `kind: okf-link` 輸出為結構化的 `relationships` 項目。

## 結構化聲明與證據

頁面可以攜帶結構化 `claims` frontmatter，而不只是自由格式文字。

每個聲明可以包含：

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

證據項目可以包含：

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

這讓 wiki 更像一個信念層，而不是被動的筆記傾倒區。聲明可以被追蹤、評分、質疑，並解析回來源。

## 面向代理程式的實體中繼資料

實體頁面也可以攜帶供代理程式使用的路由中繼資料。這是通用 frontmatter，因此適用於人物、團隊、系統、專案或任何其他實體類型。

常見欄位包括：

- `entityType`：例如 `person`、`team`、`system` 或 `project`
- `canonicalId`：跨別名與匯入使用的穩定身分鍵
- `aliases`：應解析到同一頁面的名稱、帳號或標籤
- `privacyTier`：`public`、`local-private`、`sensitive` 或 `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`：精簡路由提示
- `lastRefreshedAt`：與頁面編輯時間分開的來源重新整理時間戳記
- `personCard`：選用的人物專用路由卡，包含帳號、社群、電子郵件、時區、工作線、詢問事項、避免詢問事項、信心分數與隱私
- `relationships`：指向相關頁面的型別化邊，包含目標、種類、權重、信心分數、證據種類、隱私層級與註記

對於人物 wiki，代理程式通常應從 `reports/person-agent-directory.md` 開始，然後在使用聯絡資訊或推論事實前，用 `wiki_get` 開啟人物頁面。

範例：

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## 編譯管線

編譯步驟會讀取 wiki 頁面、正規化摘要，並在以下位置輸出穩定的機器面向成品：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

這些摘要存在的目的，是讓代理程式與執行階段程式碼不需要抓取 Markdown 頁面。

編譯輸出也支援：

- 搜尋/取得流程的第一階段 wiki 索引
- 從聲明 ID 查回擁有該聲明的頁面
- 精簡提示補充
- 報告/儀表板產生

## 儀表板與健康報告

當 `render.createDashboards` 啟用時，編譯會維護 `reports/` 下的儀表板。

內建報告包括：

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

這些報告會追蹤如下項目：

- 矛盾註記叢集
- 互相競爭的聲明叢集
- 缺少結構化證據的聲明
- 低信心分數頁面與聲明
- 過期或未知的新鮮度
- 有未解問題的頁面
- 人物/實體路由卡
- 結構化關係邊
- 證據類別涵蓋率
- 使用前需要審查的非公開隱私層級

## 搜尋與擷取

`memory-wiki` 支援兩種搜尋後端：

- `shared`：可用時使用共享記憶搜尋流程
- `local`：在本機搜尋 wiki

它也支援三種語料庫：

- `wiki`
- `memory`
- `all`

重要行為：

- `wiki_search` 和 `wiki_get` 會盡可能使用編譯摘要作為第一階段
- 聲明 ID 可以解析回擁有它的頁面
- 有爭議/過期/新鮮聲明會影響排序
- 來源標籤可以保留到結果中
- 搜尋模式可以讓排序偏向人物查找、問題路由、來源證據或原始聲明

實用規則：

- 使用 `memory_search corpus=all` 進行一次廣泛回憶
- 當你在意 wiki 專用排序、來源或頁面層級信念結構時，使用 `wiki_search` + `wiki_get`

搜尋模式：

- `auto`：平衡的預設值
- `find-person`：提升人物類實體、別名、帳號、社群與 canonical ID
- `route-question`：提升代理程式卡、詢問事項提示、最適用途提示與關係脈絡
- `source-evidence`：提升來源頁面與結構化證據中繼資料
- `raw-claim`：提升符合的結構化聲明，並在結果中回傳聲明/證據中繼資料

當結果符合結構化聲明時，`wiki_search` 可以在其 details payload 中回傳 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 和 `evidenceSourceIds`。可用時，文字輸出也會包含精簡的 `Claim:` 與 `Evidence:` 行。

## 代理程式工具

此外掛會註冊這些工具：

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

它們的用途：

- `wiki_status`：目前知識庫模式、健康狀態、Obsidian 命令列介面可用性
- `wiki_search`：搜尋 wiki 頁面，以及在已設定時搜尋共享記憶語料庫；接受 `mode` 以進行人物查找、問題路由、來源證據或原始聲明深入分析
- `wiki_get`：依 ID/路徑讀取 wiki 頁面，或退回到共享記憶語料庫
- `wiki_apply`：狹窄的綜合/中繼資料變更，不進行自由格式頁面手術
- `wiki_lint`：結構檢查、來源缺口、矛盾、未解問題

此外掛也會註冊非獨占的記憶語料庫補充，因此當作用中的主動記憶
外掛支援語料庫選擇時，共用的 `memory_search` 和 `memory_get` 可以觸及 wiki。

## 提示詞與脈絡行為

啟用 `context.includeCompiledDigestPrompt` 時，記憶提示詞區段會
附加來自 `agent-digest.json` 的精簡編譯快照。

該快照刻意保持小巧且高訊號：

- 僅頂層頁面
- 僅頂層主張
- 矛盾數量
- 問題數量
- 信心度/新鮮度限定詞

這是選用項目，因為它會改變提示詞形狀，且主要適用於明確取用記憶補充的脈絡
引擎或舊版提示詞組裝。

## 設定

將設定放在 `plugins.entries.memory-wiki.config` 底下：

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

主要切換項：

- `vaultMode`：`isolated`、`bridge`、`unsafe-local`
- `vault.renderMode`：`native` 或 `obsidian`
- `bridge.readMemoryArtifacts`：匯入主動記憶外掛公開成品
- `bridge.followMemoryEvents`：在橋接模式中包含事件日誌
- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `context.includeCompiledDigestPrompt`：將精簡摘要快照附加到記憶提示詞區段
- `render.createBacklinks`：產生確定性的相關區塊
- `render.createDashboards`：產生儀表板頁面

### 範例：QMD + 橋接模式

當你想使用 QMD 進行回想，並使用 `memory-wiki` 作為維護式
知識層時，請使用此設定：

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

這會保留：

- 由 QMD 負責主動記憶回想
- `memory-wiki` 專注於編譯頁面與儀表板
- 提示詞形狀保持不變，直到你有意啟用編譯摘要提示詞

## 命令列介面

`memory-wiki` 也公開頂層命令列介面介面：

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

完整命令參考請見 [命令列介面：wiki](/zh-TW/cli/wiki)。

## Obsidian 支援

當 `vault.renderMode` 為 `obsidian` 時，此外掛會寫入適合 Obsidian 的
Markdown，並可選擇使用官方 `obsidian` 命令列介面。

支援的工作流程包括：

- 狀態探測
- 知識庫搜尋
- 開啟頁面
- 呼叫 Obsidian 命令
- 跳至每日筆記

這是選用功能。即使沒有 Obsidian，wiki 仍可在原生模式中運作。

## 建議工作流程

1. 保留你的主動記憶外掛，用於回想/提升/夢境整理。
2. 啟用 `memory-wiki`。
3. 除非你明確想要橋接模式，否則請從 `isolated` 模式開始。
4. 當來源脈絡很重要時，使用 `wiki_search` / `wiki_get`。
5. 使用 `wiki_apply` 進行狹窄的綜合或中繼資料更新。
6. 在有意義的變更後執行 `wiki_lint`。
7. 如果你想看見過期/矛盾狀態，請開啟儀表板。

## 相關文件

- [記憶概覽](/zh-TW/concepts/memory)
- [命令列介面：memory](/zh-TW/cli/memory)
- [命令列介面：wiki](/zh-TW/cli/wiki)
- [外掛 SDK 概覽](/zh-TW/plugins/sdk-overview)
