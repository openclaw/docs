---
read_when:
    - 你需要超越單純 MEMORY.md 筆記的持久知識
    - 你正在設定隨附的 memory-wiki Plugin
    - 你想了解 wiki_search、wiki_get 或橋接模式
summary: memory-wiki：已編譯的知識庫，包含來源依據、主張、儀表板與橋接模式
title: 記憶維基
x-i18n:
    generated_at: "2026-05-04T02:45:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: b070177b7c1217e9102bc57680b4009265e3584ede7ad6dc3ba7b6393260fefe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` 是一個內建 Plugin，會將持久記憶轉換為已編譯的知識庫。

它**不會**取代 Active Memory Plugin。Active Memory Plugin 仍然負責回想、提升、索引與 Dreaming。`memory-wiki` 位於它旁邊，並將持久知識編譯成可導覽的 wiki，包含確定性頁面、結構化主張、來源、儀表板，以及機器可讀的摘要。

當你希望記憶的行為更像維護良好的知識層，而不是一堆 Markdown 檔案時，請使用它。

## 它新增了什麼

- 具備確定性頁面配置的專用 wiki vault
- 結構化的主張與證據中繼資料，而不只是文字敘述
- 頁面層級的來源、信心度、矛盾與開放問題
- 供 agent/runtime 消費者使用的已編譯摘要
- wiki 原生的搜尋/取得/套用/lint 工具
- 可選的橋接模式，可從 Active Memory Plugin 匯入公開成品
- 可選的 Obsidian 友善算繪模式與 CLI 整合

## 它如何配合記憶

可以這樣理解分工：

| 層級                                                    | 負責                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Active Memory Plugin (`memory-core`, QMD, Honcho 等)    | 回想、語意搜尋、提升、Dreaming、記憶 runtime                                               |
| `memory-wiki`                                           | 已編譯 wiki 頁面、富含來源的綜合內容、儀表板、wiki 專用搜尋/取得/套用                    |

如果 Active Memory Plugin 暴露共享回想成品，OpenClaw 可以透過 `memory_search corpus=all` 在一次流程中搜尋兩個層級。

當你需要 wiki 專用的排序、來源或直接頁面存取時，請改用 wiki 原生工具。

## 建議的混合模式

對 local-first 設定來說，一個穩健的預設是：

- 使用 QMD 作為 Active Memory 後端，用於回想與廣泛語意搜尋
- 使用 `memory-wiki` 的 `bridge` 模式建立持久的綜合知識頁面

這樣的分工效果很好，因為每個層級都能保持專注：

- QMD 讓原始筆記、工作階段匯出與額外集合保持可搜尋
- `memory-wiki` 編譯穩定實體、主張、儀表板與來源頁面

實務規則：

- 當你想跨記憶做一次廣泛回想時，使用 `memory_search`
- 當你想取得具備來源感知的 wiki 結果時，使用 `wiki_search` 和 `wiki_get`
- 當你想讓共享搜尋橫跨兩個層級時，使用 `memory_search corpus=all`

如果橋接模式回報匯出的成品為零，表示 Active Memory Plugin 目前尚未暴露公開橋接輸入。先執行 `openclaw wiki doctor`，再確認 Active Memory Plugin 支援公開成品。

當橋接模式啟用且 `bridge.readMemoryArtifacts` 已啟用時，`openclaw wiki status`、`openclaw wiki doctor` 與 `openclaw wiki bridge
import` 會透過執行中的 Gateway 讀取。這會讓 CLI 橋接檢查與 runtime 記憶 Plugin 上下文保持一致。如果橋接已停用或成品讀取已關閉，這些命令會保留其本機/離線行為。

## Vault 模式

`memory-wiki` 支援三種 vault 模式：

### `isolated`

自己的 vault、自己的來源，不依賴 `memory-core`。

當你希望 wiki 成為獨立策展的知識儲存庫時，請使用此模式。

### `bridge`

透過公開 Plugin SDK seam，從 Active Memory Plugin 讀取公開記憶成品與記憶事件。

當你希望 wiki 編譯並整理記憶 Plugin 匯出的成品，而不深入私有 Plugin 內部實作時，請使用此模式。

橋接模式可以索引：

- 匯出的記憶成品
- 夢境報告
- 每日筆記
- 記憶根檔案
- 記憶事件記錄

### `unsafe-local`

明確的同機器逃生口，用於本機私有路徑。

此模式刻意設計為實驗性且不可攜。僅在你理解信任邊界，且明確需要橋接模式無法提供的本機檔案系統存取時使用。

## Vault 配置

Plugin 會像這樣初始化 vault：

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
- `entities/` 用於持久事物、人物、系統、專案與物件
- `concepts/` 用於想法、抽象概念、模式與政策
- `syntheses/` 用於已編譯摘要與維護中的彙總
- `reports/` 用於產生的儀表板

## 結構化主張與證據

頁面可以攜帶結構化的 `claims` frontmatter，而不只是自由格式文字。

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

這讓 wiki 更像信念層，而不是被動的筆記傾倒處。主張可以被追蹤、評分、質疑，並解析回來源。

## 面向 Agent 的實體中繼資料

實體頁面也可以攜帶供 agent 使用的路由中繼資料。這是通用 frontmatter，因此適用於人物、團隊、系統、專案或任何其他實體類型。

常見欄位包括：

- `entityType`：例如 `person`、`team`、`system` 或 `project`
- `canonicalId`：跨別名與匯入使用的穩定身分鍵
- `aliases`：應解析到同一頁面的名稱、handle 或標籤
- `privacyTier`：`public`、`local-private`、`sensitive` 或 `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`：精簡路由提示
- `lastRefreshedAt`：與頁面編輯時間分開的來源重新整理時間戳
- `personCard`：可選的人物專用路由卡，包含 handle、社群、電子郵件、時區、lane、ask-for、avoid-asking-for、信心度與隱私
- `relationships`：指向相關頁面的型別化邊，包含目標、種類、權重、信心度、證據種類、隱私層級與備註

對人物 wiki 來說，agent 通常應先從 `reports/person-agent-directory.md` 開始，接著用 `wiki_get` 開啟人物頁面，再使用聯絡資訊或推論出的事實。

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

編譯步驟會讀取 wiki 頁面、正規化摘要，並在下列位置輸出穩定的機器面向成品：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

這些摘要存在的目的，是讓 agent 與 runtime 程式碼不必爬取 Markdown 頁面。

已編譯輸出也會支援：

- 搜尋/取得流程的第一階 wiki 索引
- claim-id 查詢回擁有頁面
- 精簡提示補充
- 報告/儀表板產生

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

這些報告會追蹤下列事項：

- 矛盾備註叢集
- 競爭性主張叢集
- 缺少結構化證據的主張
- 低信心度頁面與主張
- 過時或未知的新鮮度
- 含有未解問題的頁面
- 人物/實體路由卡
- 結構化關係邊
- 證據類別覆蓋率
- 使用前需要審查的非公開隱私層級

## 搜尋與擷取

`memory-wiki` 支援兩個搜尋後端：

- `shared`：可用時使用共享記憶搜尋流程
- `local`：在本機搜尋 wiki

它也支援三個語料庫：

- `wiki`
- `memory`
- `all`

重要行為：

- `wiki_search` 與 `wiki_get` 會在可能時使用已編譯摘要作為第一階段
- claim id 可以解析回擁有頁面
- 受質疑/過時/新鮮主張會影響排序
- 來源標籤可以保留到結果中
- 搜尋模式可以偏向人物查找、問題路由、來源證據或原始主張的排序

實務規則：

- 使用 `memory_search corpus=all` 進行一次廣泛回想
- 當你重視 wiki 專用排序、來源或頁面層級信念結構時，使用 `wiki_search` + `wiki_get`

搜尋模式：

- `auto`：平衡的預設值
- `find-person`：加權人物類實體、別名、handle、社群與 canonical ID
- `route-question`：加權 agent 卡、ask-for 提示、best-used-for 提示與關係上下文
- `source-evidence`：加權來源頁面與結構化證據中繼資料
- `raw-claim`：加權相符的結構化主張，並在結果中回傳主張/證據中繼資料

當結果符合結構化主張時，`wiki_search` 可以在其詳細資料 payload 中回傳 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 與 `evidenceSourceIds`。可用時，文字輸出也會包含精簡的 `Claim:` 與 `Evidence:` 行。

## Agent 工具

Plugin 會註冊這些工具：

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

它們的用途：

- `wiki_status`：目前 vault 模式、健康狀態、Obsidian CLI 可用性
- `wiki_search`：搜尋 wiki 頁面，以及在設定時搜尋共享記憶語料庫；接受 `mode` 進行人物查找、問題路由、來源證據或原始主張下鑽
- `wiki_get`：依 id/path 讀取 wiki 頁面，或退回共享記憶語料庫
- `wiki_apply`：狹窄的綜合/中繼資料變更，不進行自由格式頁面手術
- `wiki_lint`：結構檢查、來源缺口、矛盾、開放問題

Plugin 也會註冊非獨占的記憶語料庫補充，因此當 Active Memory Plugin 支援語料庫選擇時，共享的 `memory_search` 與 `memory_get` 可以觸及 wiki。

## 提示與上下文行為

當 `context.includeCompiledDigestPrompt` 啟用時，記憶提示區段會附加來自 `agent-digest.json` 的精簡已編譯快照。

該快照刻意保持小巧且高訊號：

- 僅頂層頁面
- 僅頂層主張
- 矛盾數量
- 問題數量
- 信心度/新鮮度限定詞

這是選擇加入，因為它會改變提示形狀，且主要適用於明確消費記憶補充的上下文引擎或舊式提示組裝。

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
- `bridge.readMemoryArtifacts`：匯入 Active Memory Plugin 的公開成品
- `bridge.followMemoryEvents`：在橋接模式中包含事件記錄
- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `context.includeCompiledDigestPrompt`：將精簡摘要快照附加到記憶提示區段
- `render.createBacklinks`：產生確定性的相關區塊
- `render.createDashboards`：產生儀表板頁面

### 範例：QMD + 橋接模式

當你想使用 QMD 進行回憶，並使用 `memory-wiki` 作為維護式知識層時，請使用此設定：

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

這會維持：

- QMD 負責 Active Memory 回憶
- `memory-wiki` 專注於已編譯頁面與儀表板
- 提示形狀保持不變，直到你有意啟用已編譯摘要提示

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

完整命令參考請參閱 [CLI：wiki](/zh-TW/cli/wiki)。

## Obsidian 支援

當 `vault.renderMode` 為 `obsidian` 時，Plugin 會寫入 Obsidian 友善的 Markdown，並可選擇使用官方 `obsidian` CLI。

支援的工作流程包括：

- 狀態探測
- vault 搜尋
- 開啟頁面
- 呼叫 Obsidian 命令
- 跳至每日筆記

這是可選的。即使沒有 Obsidian，wiki 仍可在原生模式下運作。

## 建議工作流程

1. 保留你的 Active Memory Plugin 以進行回憶、提升與 Dreaming。
2. 啟用 `memory-wiki`。
3. 除非你明確想使用橋接模式，否則請從 `isolated` 模式開始。
4. 當來源脈絡很重要時，使用 `wiki_search` / `wiki_get`。
5. 使用 `wiki_apply` 進行小範圍綜合或中繼資料更新。
6. 在有意義的變更後執行 `wiki_lint`。
7. 如果你想要 stale/contradiction 可見性，請開啟儀表板。

## 相關文件

- [Memory 概觀](/zh-TW/concepts/memory)
- [CLI：memory](/zh-TW/cli/memory)
- [CLI：wiki](/zh-TW/cli/wiki)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
