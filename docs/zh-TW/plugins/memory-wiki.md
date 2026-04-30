---
read_when:
    - 你想要的不只是普通的 MEMORY.md 筆記，而是持久知識
    - 你正在設定隨附的 memory-wiki Plugin
    - 你想了解 wiki_search、wiki_get 或橋接模式
summary: memory-wiki：含出處、聲明、儀表板和橋接模式的已編譯知識庫
title: 記憶維基
x-i18n:
    generated_at: "2026-04-30T03:24:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 744d569f8b0c9b668ea54dc057f808544359eaae87d5557de2e6acd1b31acd89
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` 是一個內建 Plugin，會將持久記憶轉換成編譯後的知識庫。

它**不會**取代 Active Memory Plugin。Active Memory Plugin 仍然負責召回、提升、索引與 Dreaming。`memory-wiki` 與它並列運作，並將持久知識編譯成可瀏覽的 wiki，包含確定性頁面、結構化主張、來源、儀表板與機器可讀摘要。

當你希望記憶更像是維護良好的知識層，而不是一堆 Markdown 檔案時，就使用它。

## 它新增了什麼

- 具有確定性頁面版面的專用 wiki 知識庫
- 結構化主張與證據中繼資料，而不只是散文
- 頁面層級的來源、信心度、矛盾與待解問題
- 供代理程式與執行階段使用者使用的編譯摘要
- wiki 原生搜尋、取得、套用與 lint 工具
- 可選的橋接模式，可從 Active Memory Plugin 匯入公開成品
- 可選的 Obsidian 友善轉譯模式與 CLI 整合

## 它如何與記憶配合

可以把分工想成這樣：

| 層級                                                    | 負責                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Active Memory Plugin（`memory-core`、QMD、Honcho 等） | 召回、語意搜尋、提升、Dreaming、記憶執行階段                               |
| `memory-wiki`                                           | 編譯後的 wiki 頁面、富含來源的綜合內容、儀表板、wiki 專用搜尋、取得與套用 |

如果 Active Memory Plugin 暴露共享召回成品，OpenClaw 可以使用 `memory_search corpus=all` 在一次流程中搜尋兩個層級。

當你需要 wiki 專用排序、來源，或直接頁面存取時，請改用 wiki 原生工具。

## 建議的混合模式

對於本機優先設定，一個穩健的預設值是：

- 使用 QMD 作為 Active Memory 後端，用於召回與廣泛語意搜尋
- 以 `bridge` 模式使用 `memory-wiki`，產生持久的綜合知識頁面

這種分工很有效，因為每個層級都能保持專注：

- QMD 讓原始筆記、工作階段匯出與額外集合保持可搜尋
- `memory-wiki` 編譯穩定實體、主張、儀表板與來源頁面

實用規則：

- 當你想要跨記憶進行一次廣泛召回時，使用 `memory_search`
- 當你想要具備來源感知的 wiki 結果時，使用 `wiki_search` 與 `wiki_get`
- 當你希望共享搜尋涵蓋兩個層級時，使用 `memory_search corpus=all`

如果橋接模式回報匯出的成品為零，表示 Active Memory Plugin 目前尚未暴露公開橋接輸入。請先執行 `openclaw wiki doctor`，然後確認 Active Memory Plugin 支援公開成品。

當橋接模式啟用且 `bridge.readMemoryArtifacts` 已啟用時，`openclaw wiki status`、`openclaw wiki doctor` 與 `openclaw wiki bridge import` 會透過正在執行的 Gateway 讀取。這會讓 CLI 橋接檢查與執行階段記憶 Plugin 情境保持一致。如果橋接停用或成品讀取已關閉，這些命令會維持其本機與離線行為。

## 知識庫模式

`memory-wiki` 支援三種知識庫模式：

### `isolated`

自有知識庫、自有來源，不依賴 `memory-core`。

當你希望 wiki 成為自己的策展知識儲存庫時，使用此模式。

### `bridge`

透過公開 Plugin SDK 接縫，從 Active Memory Plugin 讀取公開記憶成品與記憶事件。

當你希望 wiki 編譯並整理記憶 Plugin 的匯出成品，而不深入私有 Plugin 內部實作時，使用此模式。

橋接模式可以索引：

- 匯出的記憶成品
- 夢境報告
- 每日筆記
- 記憶根目錄檔案
- 記憶事件記錄

### `unsafe-local`

明確的同機器逃生出口，用於本機私有路徑。

此模式刻意設計為實驗性且不可攜。只有在你了解信任邊界，且特別需要橋接模式無法提供的本機檔案系統存取時才使用。

## 知識庫版面

此 Plugin 會初始化如下的知識庫：

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

受管理內容會留在產生的區塊內。人工筆記區塊會被保留。

主要頁面群組為：

- `sources/` 用於匯入的原始材料與橋接支援頁面
- `entities/` 用於持久的事物、人物、系統、專案與物件
- `concepts/` 用於想法、抽象概念、模式與政策
- `syntheses/` 用於編譯後摘要與維護中的彙整
- `reports/` 用於產生的儀表板

## 結構化主張與證據

頁面可以攜帶結構化 `claims` frontmatter，而不只是自由格式文字。

每個主張可以包含：

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

這正是讓 wiki 更像信念層，而不是被動筆記堆的原因。主張可以被追蹤、評分、質疑，並回溯到來源加以解析。

## 面向代理程式的實體中繼資料

實體頁面也可以攜帶供代理程式使用的路由中繼資料。這是通用 frontmatter，因此適用於人物、團隊、系統、專案或任何其他實體類型。

常見欄位包括：

- `entityType`：例如 `person`、`team`、`system` 或 `project`
- `canonicalId`：跨別名與匯入使用的穩定身分鍵
- `aliases`：應解析到同一頁面的名稱、帳號或標籤
- `privacyTier`：`public`、`local-private`、`sensitive` 或 `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`：精簡路由提示
- `lastRefreshedAt`：與頁面編輯時間分開的來源重新整理時間戳
- `personCard`：可選的人物專用路由卡，包含帳號、社群、電子郵件、時區、路線、適合詢問、避免詢問、信心度與隱私
- `relationships`：指向相關頁面的型別化邊，包含目標、種類、權重、信心度、證據種類、隱私層級與備註

對於人物 wiki，代理程式通常應先從 `reports/person-agent-directory.md` 開始，接著在使用聯絡資訊或推論事實之前，用 `wiki_get` 開啟人物頁面。

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

這些摘要的存在，是為了讓代理程式與執行階段程式碼不必抓取 Markdown 頁面。

編譯後輸出也會支援：

- 搜尋與取得流程的一階 wiki 索引
- 從主張 ID 查回擁有該主張的頁面
- 精簡提示補充內容
- 報告與儀表板產生

## 儀表板與健康報告

當 `render.createDashboards` 啟用時，編譯會維護 `reports/` 底下的儀表板。

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

- 矛盾備註叢集
- 競爭主張叢集
- 缺少結構化證據的主張
- 低信心度頁面與主張
- 過期或未知的新鮮度
- 有未解問題的頁面
- 人物與實體路由卡
- 結構化關係邊
- 證據類別覆蓋率
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

- `wiki_search` 與 `wiki_get` 會在可能時使用編譯摘要作為第一階段
- 主張 ID 可以解析回擁有該主張的頁面
- 受爭議、過期與新鮮主張會影響排序
- 來源標籤可以保留到結果中
- 搜尋模式可以偏向人物查找、問題路由、來源證據或原始主張的排序

實用規則：

- 使用 `memory_search corpus=all` 進行一次廣泛召回
- 當你在意 wiki 專用排序、來源或頁面層級信念結構時，使用 `wiki_search` + `wiki_get`

搜尋模式：

- `auto`：平衡的預設值
- `find-person`：提高類人物實體、別名、帳號、社群與 canonical ID 的權重
- `route-question`：提高代理程式卡、適合詢問提示、最適用提示與關係情境的權重
- `source-evidence`：提高來源頁面與結構化證據中繼資料的權重
- `raw-claim`：提高相符結構化主張的權重，並在結果中傳回主張與證據中繼資料

當結果符合結構化主張時，`wiki_search` 可以在其詳細資料 payload 中傳回 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 與 `evidenceSourceIds`。文字輸出也會在可用時包含精簡的 `Claim:` 與 `Evidence:` 行。

## 代理程式工具

此 Plugin 會註冊這些工具：

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

它們的用途：

- `wiki_status`：目前的知識庫模式、健康狀態、Obsidian CLI 可用性
- `wiki_search`：搜尋 wiki 頁面，以及在設定時搜尋共享記憶語料庫；接受 `mode` 以進行人物查找、問題路由、來源證據或原始主張深入查詢
- `wiki_get`：依 ID 或路徑讀取 wiki 頁面，或回退到共享記憶語料庫
- `wiki_apply`：進行狹窄的綜合與中繼資料變更，不做自由格式頁面手術
- `wiki_lint`：結構檢查、來源缺口、矛盾、待解問題

此 Plugin 也會註冊非獨佔的記憶語料庫補充，因此當 Active Memory Plugin 支援語料庫選擇時，共享的 `memory_search` 與 `memory_get` 可以連到 wiki。

## 提示與情境行為

當 `context.includeCompiledDigestPrompt` 啟用時，記憶提示區段會附加來自 `agent-digest.json` 的精簡編譯快照。

該快照刻意保持小而高訊號：

- 僅限最重要頁面
- 僅限最重要主張
- 矛盾數量
- 問題數量
- 信心度與新鮮度限定詞

這是選擇性啟用，因為它會改變提示形狀，且主要適用於明確使用記憶補充內容的情境引擎或舊版提示組裝。

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

主要切換選項：

- `vaultMode`：`isolated`、`bridge`、`unsafe-local`
- `vault.renderMode`：`native` 或 `obsidian`
- `bridge.readMemoryArtifacts`：匯入 Active Memory Plugin 公開成品
- `bridge.followMemoryEvents`：在橋接模式中包含事件記錄
- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `context.includeCompiledDigestPrompt`：將精簡摘要快照附加到記憶提示區段
- `render.createBacklinks`：產生確定性的相關區塊
- `render.createDashboards`：產生儀表板頁面

### 範例：QMD + 橋接模式

當你想用 QMD 進行回想，並用 `memory-wiki` 維護知識層時，請使用這個設定：

```json5
{
  memory: {
    backend: "qmd",
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

這會保持：

- 由 QMD 負責 Active Memory 回想
- `memory-wiki` 專注於已編譯頁面與儀表板
- 提示形狀維持不變，直到你有意啟用已編譯摘要提示為止

## CLI

`memory-wiki` 也公開頂層 CLI 介面：

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

完整命令參考請見 [CLI：wiki](/zh-TW/cli/wiki)。

## Obsidian 支援

當 `vault.renderMode` 是 `obsidian` 時，Plugin 會寫入適合 Obsidian 的 Markdown，並可選擇使用官方 `obsidian` CLI。

支援的工作流程包括：

- 狀態探測
- vault 搜尋
- 開啟頁面
- 呼叫 Obsidian 命令
- 跳到每日筆記

這是選用功能。即使沒有 Obsidian，wiki 仍可在原生模式中運作。

## 建議工作流程

1. 保留你的 Active Memory Plugin 來進行回想、提升與 Dreaming。
2. 啟用 `memory-wiki`。
3. 除非你明確想要橋接模式，否則先從 `isolated` 模式開始。
4. 當來源可追溯性很重要時，使用 `wiki_search` / `wiki_get`。
5. 使用 `wiki_apply` 進行範圍精準的整合或中繼資料更新。
6. 在有意義的變更後執行 `wiki_lint`。
7. 如果你想看見過時/矛盾內容，請開啟儀表板。

## 相關文件

- [記憶概觀](/zh-TW/concepts/memory)
- [CLI：memory](/zh-TW/cli/memory)
- [CLI：wiki](/zh-TW/cli/wiki)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
