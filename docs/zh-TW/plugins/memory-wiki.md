---
read_when:
    - 你想要超越單純 MEMORY.md 筆記的持久知識
    - 你正在設定內建的 memory-wiki 外掛
    - 你想了解 wiki_search、wiki_get 或橋接模式
summary: memory-wiki：已編譯的知識庫，具備來源、聲明、儀表板與橋接模式
title: 記憶維基
x-i18n:
    generated_at: "2026-07-05T11:36:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e6233922483e0e858cb39cdeb2537e5f454e5b6df0c49ea5b89dc56da3e0bfe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` 是內建外掛，會將持久知識編譯成可導覽的
wiki：確定性頁面、帶有證據的結構化聲明、
來源、儀表板，以及機器可讀的摘要。

它不會取代主動記憶外掛。回憶、提升、索引與
夢境整理仍由已設定的記憶後端擁有
（`memory-core`、QMD、Honcho 等）。`memory-wiki` 位於其旁，並將
知識編譯成維護中的 wiki 層。

| 層級                 | 擁有                                                                              |
| -------------------- | --------------------------------------------------------------------------------- |
| 主動記憶外掛         | 回憶、語意搜尋、提升、夢境整理、記憶執行階段                                     |
| `memory-wiki`        | 已編譯 wiki 頁面、富含來源的綜合內容、儀表板、wiki 搜尋/取得/套用                |

實用規則：

- 使用 `memory_search` 對已設定的任何語料庫進行一次廣泛回憶
- 當你需要 wiki 專屬排序、來源，或頁面層級的信念結構時，使用 `wiki_search` / `wiki_get`
- 當主動記憶外掛支援語料庫選擇時，使用 `memory_search corpus=all` 在一次呼叫中涵蓋兩個層級

常見的本機優先設定：以 QMD 作為主動記憶後端進行回憶，並讓
`memory-wiki` 以 `bridge` 模式建立持久的綜合頁面。請參閱
[設定](#configuration) 下方的 QMD + bridge 模式範例。

如果 bridge 模式回報匯出的成品數量為零，表示主動記憶外掛目前
沒有公開公用 bridge 輸入。請先執行 `openclaw wiki doctor`，
再確認主動記憶外掛支援公用成品。

## Vault 模式

- `isolated`（預設）：自己的 vault、自己的來源，不依賴主動記憶外掛。用於自含式的策展知識庫。
- `bridge`：透過公用外掛 SDK 接縫，從主動記憶外掛讀取公用記憶成品與事件記錄。用於編譯記憶外掛匯出的成品，而不進入私有外掛內部。
- `unsafe-local`：明確的同機器逃生通道，用於本機私有路徑。刻意設為實驗性且不可移植；只有在你理解信任邊界，且確實需要 bridge 模式無法提供的本機檔案系統存取時才使用。

Bridge 模式可依 `bridge.*` 設定切換項目索引：

- 匯出的記憶成品（`indexMemoryRoot`）
- 每日筆記（`indexDailyNotes`）
- 夢境整理報告（`indexDreamReports`）
- 記憶事件記錄（`followMemoryEvents`）

當 bridge 模式啟用且 `bridge.readMemoryArtifacts` 已啟用時，
`openclaw wiki status`、`openclaw wiki doctor` 和 `openclaw wiki bridge
import` 會透過執行中的 Gateway 路由，因此它們會看見與代理/執行階段記憶
相同的主動記憶外掛脈絡。如果 bridge 已停用或成品讀取關閉，
這些命令會保留本機/離線行為。

## Vault 版面配置

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

受管理的內容會保留在產生的區塊內；人工筆記區塊會在重新產生時
保留下來。

- `sources/`：匯入的原始材料，以及由 bridge/unsafe-local 支援的頁面
- `entities/`：持久的事物、人物、系統、專案、物件
- `concepts/`：想法、抽象概念、模式、政策（也是 OKF 匯入的落點）
- `syntheses/`：已編譯的摘要與維護中的彙整
- `reports/`：產生的儀表板

## 開放知識格式匯入

```bash
openclaw wiki okf import ./bundles/ga4
```

將已解封的開放知識格式 bundle 匯入 wiki 概念頁面。當資料目錄、
文件爬蟲或強化代理已經產生 OKF 時很適合使用：保留 OKF 作為可攜的
交換成品，讓 `memory-wiki` 將它轉成 OpenClaw 原生概念頁面與已編譯摘要。

- 非保留的 `.md` 檔案是概念文件
- 每個匯入的概念都需要非空的 `type` frontmatter 欄位；缺少 `type` 會產生 `missing-type` 警告，且該檔案會被略過
- 未知的 `type` 值會被接受為一般概念
- `index.md` 和 `log.md` 是保留項目，永遠不會作為概念匯入
- 損壞或外部 Markdown 連結會保持不變

匯入的頁面會攤平到 `concepts/` 底下，因此既有的編譯、搜尋、取得與
儀表板流程不需要第二棵 wiki 樹就能看見它們。每個頁面都會保留
原始 OKF 概念 ID、來源路徑、`type`、`resource`、`tags`、時間戳記，
以及完整的產生者 frontmatter。內部 OKF 連結會重寫到產生的
wiki 概念頁面，並同時發出帶有 `kind: okf-link` 的結構化
`relationships` 項目。

## 結構化聲明與證據

頁面會攜帶結構化的 `claims` frontmatter，而不只是自由格式文字。每個
聲明可以包含 `id`、`text`、`status`、`confidence`、`evidence[]` 和
`updatedAt`。每個證據項目可以包含 `kind`、`sourceId`、`path`、
`lines`、`weight`、`confidence`、`privacyTier`、`note` 和 `updatedAt`。

這讓 wiki 的行為像是一個信念層，而不是被動的筆記傾倒處。
聲明可以被追蹤、評分、質疑，並解析回來源。

## 面向代理的實體中繼資料

實體頁面會攜帶通用路由中繼資料，可供人物、團隊、
系統、專案或任何其他實體類型使用：

- `entityType`：例如 `person`、`team`、`system`、`project`
- `canonicalId`：跨別名與匯入的穩定身分鍵
- `aliases`：會解析到同一頁面的名稱、帳號或標籤
- `privacyTier`：自由格式字串；`public` 會被視為不需審查，任何其他值（例如 `local-private`、`sensitive`、`confirm-before-use`）都會在 `reports/privacy-review.md` 中標記
- `bestUsedFor` / `notEnoughFor`：精簡路由提示
- `lastRefreshedAt`：來源重新整理時間戳記，與頁面編輯時間分開
- `personCard`：選用的人物專屬路由卡（帳號、社群、電子郵件、時區、路線、詢問事項、避免詢問事項、可信度、隱私層級）
- `relationships`：指向相關頁面的型別化邊（目標、種類、權重、可信度、證據種類、隱私層級、註記）

若是人物 wiki，請先從 `reports/person-agent-directory.md` 開始，然後在使用
聯絡細節或推斷事實之前，用 `wiki_get` 開啟人物頁面。

<Accordion title="Entity page example">
```yaml
pageType: entity
entityType: person
id: entity.example-person
canonicalId: maintainer.example-person
aliases:
  - Alex
  - example-handle
privacyTier: local-private
bestUsedFor:
  - Example ecosystem routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Example ecosystem
  askFor:
    - Example rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Other Person
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex is useful for example-ecosystem routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## 編譯管線

編譯會讀取 wiki 頁面、正規化摘要，並在以下位置輸出穩定的
面向機器成品：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

代理與執行階段程式碼會讀取這些摘要，而不是擷取 Markdown。
已編譯輸出也會支援第一輪 wiki 索引，用於搜尋/取得、將聲明 ID
查回其所屬頁面、精簡提示補充內容，以及產生報告。

## 儀表板與健康報告

當 `render.createDashboards` 啟用時，編譯會在 `reports/` 底下維護儀表板：

| 報告                                | 追蹤                                               |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | 含有未解決問題的頁面                               |
| `reports/contradictions.md`         | 矛盾註記叢集                                       |
| `reports/low-confidence.md`         | 低可信度頁面與聲明                                 |
| `reports/claim-health.md`           | 缺少結構化證據的聲明                               |
| `reports/stale-pages.md`            | 過期或新鮮度未知                                   |
| `reports/person-agent-directory.md` | 人物/實體路由卡                                    |
| `reports/relationship-graph.md`     | 結構化關係邊                                       |
| `reports/provenance-coverage.md`    | 證據類別涵蓋率                                     |
| `reports/privacy-review.md`         | 使用前需要審查的非公用隱私層級                     |

## 搜尋與擷取

兩種搜尋後端：

- `shared`：可用時使用共享記憶搜尋流程
- `local`：在本機搜尋 wiki

三種語料庫：`wiki`、`memory`、`all`。

- `wiki_search` / `wiki_get` 會在可能時使用已編譯摘要作為第一輪
- 聲明 ID 會解析回其所屬頁面
- 受質疑/過期/新鮮的聲明會影響排序
- 來源標籤會保留到結果中

搜尋模式（`--mode` / 工具 `mode` 參數）：

| 模式              | 強化項目                                                       |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | 平衡的預設值                                                   |
| `find-person`     | 類人物實體、別名、帳號、社群、標準 ID                         |
| `route-question`  | 代理卡、詢問事項/最適合用途提示、關係脈絡                     |
| `source-evidence` | 來源頁面與結構化證據中繼資料                                   |
| `raw-claim`       | 符合的結構化聲明；回傳聲明/證據中繼資料                       |

當結果符合結構化聲明時，`wiki_search` 會在其 details payload 中回傳
`matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、
`evidenceKinds` 和 `evidenceSourceIds`。可用時，文字輸出會包含精簡的
`Claim:` 和 `Evidence:` 行。

## 代理工具

| 工具          | 用途                                                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | 目前 vault 模式、健康狀態、Obsidian 命令列介面可用性                                                                                                      |
| `wiki_search` | 搜尋 wiki 頁面，以及在已設定時搜尋共享記憶語料庫；接受 `mode` 以進行人物查找、問題路由、來源證據或原始聲明鑽取                                           |
| `wiki_get`    | 依 ID/路徑讀取 wiki 頁面；當共享搜尋已啟用且查找未命中時，會退回到共享記憶語料庫                                                                          |
| `wiki_apply`  | 狹窄的綜合/中繼資料變更，不進行自由格式頁面手術                                                                                                           |
| `wiki_lint`   | 結構檢查、來源缺口、矛盾、未解問題                                                                                                                        |

此外掛也會註冊非獨占的記憶語料庫補充，因此當主動記憶外掛支援語料庫選擇時，
共享的 `memory_search` 和 `memory_get` 可以到達 wiki。

## 提示與脈絡行為

當 `context.includeCompiledDigestPrompt` 啟用時，記憶提示區段會
從 `agent-digest.json` 附加精簡的已編譯快照：僅包含頂層頁面、
頂層主張、矛盾計數、問題計數、信心度/新鮮度
限定詞。這是選用的，因為它會改變提示形狀；它主要影響
明確取用記憶補充內容的情境引擎或提示組裝。

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
          unsafeLocal: {
            allowPrivateMemoryCoreAccess: false,
            paths: [],
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

| 鍵                                         | 值 / 預設                                      | 備註                                                     |
| ------------------------------------------ | ---------------------------------------------- | -------------------------------------------------------- |
| `vaultMode`                                | `isolated`（預設）、`bridge`、`unsafe-local`   |                                                          |
| `vault.path`                               | 預設 `~/.openclaw/wiki/main`                   |                                                          |
| `vault.renderMode`                         | `native`（預設）、`obsidian`                   |                                                          |
| `bridge.readMemoryArtifacts`               | 預設 `true`                                    | 匯入主動記憶外掛的公開成品                               |
| `bridge.followMemoryEvents`                | 預設 `true`                                    | 在橋接模式中包含事件日誌                                 |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | 預設 `false`                                   | 執行 `unsafe-local` 匯入時必須啟用                       |
| `unsafeLocal.paths`                        | 預設 `[]`                                      | 在 `unsafe-local` 模式中要匯入的明確本機路徑             |
| `search.backend`                           | `shared`（預設）、`local`                      |                                                          |
| `search.corpus`                            | `wiki`（預設）、`memory`、`all`                |                                                          |
| `context.includeCompiledDigestPrompt`      | 預設 `false`                                   | 將精簡摘要快照附加到記憶提示區段                         |
| `render.createBacklinks`                   | 預設 `true`                                    | 產生確定性的相關區塊                                     |
| `render.createDashboards`                  | 預設 `true`                                    | 產生儀表板頁面                                           |

### 範例：QMD + 橋接模式

當你想使用 QMD 進行回想，並使用 `memory-wiki` 維護
知識層時，請使用此模式。每一層都保持專注：QMD 讓原始筆記、工作階段
匯出和額外集合可搜尋，而 `memory-wiki` 編譯
穩定實體、主張、儀表板和來源頁面。

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

這會讓 QMD 負責主動記憶回想，讓 `memory-wiki` 專注於
已編譯頁面和儀表板，並保持提示形狀不變，直到你
刻意啟用已編譯摘要提示。

## 命令列介面

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

請參閱[命令列介面：wiki](/zh-TW/cli/wiki)以取得完整命令參考，包括
`wiki okf import`、`wiki apply metadata`、`wiki unsafe-local import`、
`wiki chatgpt import` / `wiki chatgpt rollback`，以及完整的 `wiki obsidian`
子命令集。

## Obsidian 支援

當 `vault.renderMode` 為 `obsidian` 時，此外掛會寫入對 Obsidian 友善的
Markdown，並可選擇使用官方 `obsidian` 命令列介面來進行狀態
探測、保管庫搜尋、開啟頁面、叫用命令，以及跳至
每日筆記。這是選用功能；即使沒有 Obsidian，wiki 仍可在原生模式下運作。

## 建議工作流程

<Steps>
<Step title="保留主動記憶外掛用於回想">
回想、提升和夢境整理仍由已設定的記憶後端負責。
</Step>
<Step title="啟用 memory-wiki">
除非你明確想使用橋接模式，否則請從 `isolated` 模式開始。
</Step>
<Step title="在來源依據很重要時使用 wiki_search / wiki_get">
當你想要 wiki 專用排名或頁面層級的信念結構時，優先使用這些，而不是 `memory_search`。
</Step>
<Step title="使用 wiki_apply 進行狹義綜合或中繼資料更新">
避免手動編輯受管理的已產生區塊。
</Step>
<Step title="在有意義的變更後執行 wiki_lint">
可捕捉矛盾、開放問題和來源依據缺口。
</Step>
<Step title="開啟儀表板以顯示過時/矛盾情況">
設定 `render.createDashboards: true`（預設）。
</Step>
</Steps>

## 相關文件

- [記憶概覽](/zh-TW/concepts/memory)
- [命令列介面：memory](/zh-TW/cli/memory)
- [命令列介面：wiki](/zh-TW/cli/wiki)
- [外掛 SDK 概覽](/zh-TW/plugins/sdk-overview)
