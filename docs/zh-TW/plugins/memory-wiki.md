---
read_when:
    - 你希望擁有超越一般 MEMORY.md 筆記的持久知識
    - 您正在設定內建的 memory-wiki 外掛
    - 你需要為同一個閘道中的代理程式分別建立獨立的 Wiki 儲存庫
    - 你想瞭解 wiki_search、wiki_get 或橋接模式
summary: memory-wiki：具備來源追溯、主張、儀表板與橋接模式的編譯式知識庫
title: 記憶維基
x-i18n:
    generated_at: "2026-07-11T21:34:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` 是一個隨附的外掛，可將持久知識編譯成可導覽的
Wiki：具決定性的頁面、附帶證據的結構化主張、
來源追溯、儀表板，以及機器可讀摘要。

它不會取代主動記憶外掛。召回、提升、索引與
夢境整理仍由已設定的記憶後端
（`memory-core`、QMD、Honcho 等）負責。`memory-wiki` 與其並行運作，將
知識編譯成持續維護的 Wiki 層。

| 層級                 | 負責範圍                                                                          |
| -------------------- | --------------------------------------------------------------------------------- |
| 主動記憶外掛         | 召回、語意搜尋、提升、夢境整理、記憶執行階段                                      |
| `memory-wiki`        | 編譯後的 Wiki 頁面、富含來源追溯資訊的綜合內容、儀表板、Wiki 搜尋／取得／套用      |

實務原則：

- 使用 `memory_search` 對所有已設定的語料庫執行一次廣泛召回
- 當你需要 Wiki 專屬排序、來源追溯或頁面層級的信念結構時，使用 `wiki_search`／`wiki_get`
- 當主動記憶外掛支援語料庫選擇時，使用 `memory_search corpus=all` 在一次呼叫中涵蓋兩個層級

常見的本機優先設定：以 QMD 作為負責召回的主動記憶後端，並將
`memory-wiki` 設為 `bridge` 模式，以產生持久的綜合頁面。請參閱
[設定](#configuration)中的 QMD + 橋接模式範例。

如果橋接模式回報匯出的成品數量為零，表示主動記憶外掛
目前未公開橋接輸入。請先執行 `openclaw wiki doctor`，
再確認主動記憶外掛支援公開成品。

## 儲存庫模式

- `isolated`（預設）：使用自己的儲存庫與來源，不依賴主動記憶外掛。適用於自成一體、經過策展的知識庫。
- `bridge`：透過公開的外掛 SDK 介面，從主動記憶外掛讀取公開的記憶成品與事件日誌。用於編譯記憶外掛匯出的成品，而不存取外掛的私有內部實作。
- `unsafe-local`：明確提供的同機逃生通道，可存取本機私有路徑。此模式刻意設計為實驗性且不可移植；僅限於你了解信任邊界，且確實需要橋接模式無法提供的本機檔案系統存取時使用。

儲存庫模式與儲存庫範圍是兩項獨立選擇：

- `vaultMode` 選擇 Wiki 輸入的來源。
- `vault.scope` 選擇所有代理程式共用一個儲存庫，或每個代理程式各自使用一個子儲存庫。

`vault.scope: "global"` 是預設值，並保留既有的單一儲存庫
行為。當代理程式不得共用 Wiki 頁面、編譯摘要、搜尋結果或寫入內容時，
請搭配 `isolated` 或 `bridge` 模式使用 `vault.scope: "agent"`。
代理程式範圍不能與 `unsafe-local` 模式合併使用，因為這些已設定的
私有路徑並非代理程式擁有的輸入。設定驗證會拒絕此
組合。

橋接模式可依各個 `bridge.*` 設定開關建立以下內容的索引：

- 匯出的記憶成品（`indexMemoryRoot`）
- 每日筆記（`indexDailyNotes`）
- 夢境整理報告（`indexDreamReports`）
- 記憶事件日誌（`followMemoryEvents`）

當橋接模式啟用且 `bridge.readMemoryArtifacts` 已開啟時，
`openclaw wiki status`、`openclaw wiki doctor` 與 `openclaw wiki bridge
import` 會透過正在執行的閘道路由，因此可看到與代理程式／執行階段記憶
相同的主動記憶外掛情境。如果橋接已停用或成品
讀取已關閉，這些命令會維持本機／離線行為。

## 儲存庫配置

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

受管理的內容會保留在產生的區塊內；人工筆記區塊會在
重新產生後保留。

- `sources/`：匯入的原始資料，以及由橋接／`unsafe-local` 支援的頁面
- `entities/`：持久存在的事物、人員、系統、專案、物件
- `concepts/`：想法、抽象概念、模式、政策（也是 OKF 匯入內容的落點）
- `syntheses/`：編譯後的摘要與持續維護的彙總
- `reports/`：產生的儀表板

## 開放知識格式匯入

```bash
openclaw wiki okf import ./bundles/ga4
```

將已解壓縮的開放知識格式套件匯入 Wiki 概念頁面。當資料目錄、文件爬蟲或擴充代理程式已經
產生 OKF 時非常適合：將 OKF 保留為可攜式交換成品，並讓 `memory-wiki`
將其轉換成 OpenClaw 原生概念頁面與編譯摘要。

- 非保留的 `.md` 檔案會作為概念文件
- 每個匯入的概念都必須具有非空白的 `type` frontmatter 欄位；缺少 `type` 會產生 `missing-type` 警告，並略過該檔案
- 未知的 `type` 值會作為通用概念接受
- `index.md` 與 `log.md` 為保留檔案，絕不會匯入為概念
- 失效或外部的 Markdown 連結會維持不變

匯入的頁面會平面化置於 `concepts/` 下，讓既有的編譯、搜尋、取得與
儀表板流程無須第二棵 Wiki 樹即可存取。每個頁面都會保留
原始 OKF 概念 ID、來源路徑、`type`、`resource`、`tags`、時間戳記，
以及完整的產生者 frontmatter。內部 OKF 連結會改寫為產生的
Wiki 概念頁面，並同時產生具有
`kind: okf-link` 的結構化 `relationships` 項目。

## 結構化主張與證據

頁面具有結構化的 `claims` frontmatter，而不只是自由格式文字。每個
主張可包含 `id`、`text`、`status`、`confidence`、`evidence[]` 與
`updatedAt`。每個證據項目可包含 `kind`、`sourceId`、`path`、
`lines`、`weight`、`confidence`、`privacyTier`、`note` 與 `updatedAt`。

這使 Wiki 成為信念層，而不是被動的筆記傾印區。
主張可被追蹤、評分、質疑，並追溯至來源加以解決。

## 面向代理程式的實體中繼資料

實體頁面包含可用於人員、團隊、
系統、專案或任何其他實體類型的通用路由中繼資料：

- `entityType`：例如 `person`、`team`、`system`、`project`
- `canonicalId`：跨別名與匯入項目的穩定身分識別鍵
- `aliases`：解析至同一頁面的名稱、帳號代稱或標籤
- `privacyTier`：自由格式字串；`public` 視為無須審查，任何其他值（例如 `local-private`、`sensitive`、`confirm-before-use`）都會在 `reports/privacy-review.md` 中標示
- `bestUsedFor`／`notEnoughFor`：精簡的路由提示
- `lastRefreshedAt`：來源重新整理時間戳記，與頁面編輯時間分開
- `personCard`：選用的人員專屬路由卡片（帳號代稱、社群帳號、電子郵件、時區、工作範疇、適合詢問事項、不宜詢問事項、可信度、隱私層級）
- `relationships`：連往相關頁面的具型別邊線（目標、類型、權重、可信度、證據類型、隱私層級、備註）

若是人員 Wiki，請先從 `reports/person-agent-directory.md` 開始，再於使用聯絡資訊或推論事實前，
透過 `wiki_get` 開啟人員頁面。

<Accordion title="實體頁面範例">
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

編譯程序會讀取 Wiki 頁面、正規化摘要，並在以下位置產生穩定的
機器端成品：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

代理程式與執行階段程式碼會讀取這些摘要，而非抓取 Markdown。
編譯後輸出也支援搜尋／取得的第一階段 Wiki 索引、從主張 ID
查回所屬頁面、精簡的提示詞補充內容，以及報告
產生功能。

## 儀表板與健康狀態報告

當 `render.createDashboards` 啟用時，編譯程序會維護
`reports/` 下的儀表板：

| 報告                                | 追蹤內容                                             |
| ----------------------------------- | ---------------------------------------------------- |
| `reports/open-questions.md`         | 含有未解決問題的頁面                                 |
| `reports/contradictions.md`         | 矛盾備註叢集                                         |
| `reports/low-confidence.md`         | 低可信度的頁面與主張                                 |
| `reports/claim-health.md`           | 缺少結構化證據的主張                                 |
| `reports/stale-pages.md`            | 過時或新鮮度未知的頁面                               |
| `reports/person-agent-directory.md` | 人員／實體路由卡片                                   |
| `reports/relationship-graph.md`     | 結構化關係邊線                                       |
| `reports/provenance-coverage.md`    | 證據類別涵蓋範圍                                     |
| `reports/privacy-review.md`         | 使用前需審查的非公開隱私層級                         |

## 搜尋與擷取

兩種搜尋後端：

- `shared`：可用時使用共用記憶搜尋流程
- `local`：在本機搜尋 Wiki

三種語料庫：`wiki`、`memory`、`all`。

- `wiki_search`／`wiki_get` 會盡可能使用編譯摘要作為第一階段
- 主張 ID 會解析回其所屬頁面
- 受質疑／過時／最新的主張會影響排序
- 來源追溯標籤會保留至結果中

搜尋模式（`--mode`／工具 `mode` 參數）：

| 模式              | 強化項目                                                       |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | 平衡的預設模式                                                 |
| `find-person`     | 類似人員的實體、別名、帳號代稱、社群帳號、規範 ID             |
| `route-question`  | 代理程式卡片、適合詢問／最適用途提示、關係情境                 |
| `source-evidence` | 來源頁面與結構化證據中繼資料                                   |
| `raw-claim`       | 相符的結構化主張；傳回主張／證據中繼資料                       |

當結果符合結構化主張時，`wiki_search` 會在其詳細資料承載內容中傳回
`matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、
`evidenceKinds` 與 `evidenceSourceIds`。若相關資訊可用，文字輸出
會包含精簡的 `Claim:` 與 `Evidence:` 行。

## 代理程式工具

| 工具          | 用途                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | 目前的知識庫模式與範圍、解析後的代理程式、健康狀態、Obsidian 命令列介面的可用性                                                                               |
| `wiki_search` | 搜尋 wiki 頁面，並在設定後搜尋共享記憶語料庫；接受 `mode`，用於人物查找、問題路由、來源證據或原始主張深入檢視 |
| `wiki_get`    | 依識別碼／路徑讀取 wiki 頁面；啟用共享搜尋且查找未命中時，會回退至共享記憶語料庫                                     |
| `wiki_apply`  | 執行範圍有限的綜整／中繼資料變更，不任意修改頁面內容                                                                                             |
| `wiki_lint`   | 結構檢查、來源缺口、矛盾、待解問題                                                                                            |

此外掛也會註冊非獨占的記憶語料庫補充來源，因此當作用中的記憶
外掛支援選擇語料庫時，共享的 `memory_search` 和 `memory_get`
即可存取 wiki。

## 提示詞與上下文行為

啟用 `context.includeCompiledDigestPrompt` 後，記憶提示詞區段
會附加來自 `agent-digest.json` 的精簡編譯快照：僅包含主要頁面、
主要主張、矛盾數量、問題數量，以及信賴度／新鮮度限定資訊。
此功能為選用，因為它會改變提示詞結構；主要適用於明確使用記憶
補充內容的上下文引擎或提示詞組裝流程。

## 設定

將設定放在 `plugins.entries.memory-wiki.config` 下：

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            scope: "global",
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

主要切換項目：

| 鍵                                         | 值／預設值                                      | 備註                                                                         |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated`（預設）、`bridge`、`unsafe-local` | 選擇輸入與整合行為                                        |
| `vault.scope`                              | `global`（預設）、`agent`                    | 使用一個共享知識庫，或每個代理程式各使用一個子知識庫                                 |
| `vault.path`                               | 全域預設為 `~/.openclaw/wiki/main`         | 全域範圍下是知識庫的確切路徑；代理程式範圍下的父目錄預設為 `~/.openclaw/wiki`       |
| `vault.renderMode`                         | `native`（預設）、`obsidian`                 |                                                                               |
| `bridge.readMemoryArtifacts`               | 預設為 `true`                                 | 匯入作用中記憶外掛的公開成品                                  |
| `bridge.followMemoryEvents`                | 預設為 `true`                                 | 在橋接模式中納入事件記錄                                             |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | 預設為 `false`                                | 執行 `unsafe-local` 匯入時必須啟用                                        |
| `unsafeLocal.paths`                        | 預設為 `[]`                                   | 在 `unsafe-local` 模式中要匯入的明確本機路徑                         |
| `search.backend`                           | `shared`（預設）、`local`                    |                                                                               |
| `search.corpus`                            | `wiki`（預設）、`memory`、`all`              |                                                                               |
| `context.includeCompiledDigestPrompt`      | 預設為 `false`                                | 將所選代理程式的精簡摘要快照附加至記憶提示詞區段 |
| `render.createBacklinks`                   | 預設為 `true`                                 | 產生具確定性的相關內容區塊                                         |
| `render.createDashboards`                  | 預設為 `true`                                 | 產生儀表板頁面                                                      |

### 各代理程式的知識庫

將 `vault.scope` 設為 `agent`，即可讓每個已設定的代理程式擁有獨立的 wiki。
在此範圍中，`vault.path` 是父目錄，而 OpenClaw 會附加
正規化後的代理程式識別碼：

```json5
{
  agents: {
    list: [{ id: "support" }, { id: "marketing" }],
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
          },
        },
      },
    },
  },
}
```

這會解析為 `~/.openclaw/wiki/support` 和
`~/.openclaw/wiki/marketing`。若在代理程式範圍中省略 `vault.path`，
父目錄預設為 `~/.openclaw/wiki`。因此，預設的 `main` 代理程式仍會
沿用現有的 `~/.openclaw/wiki/main` 路徑。

代理程式工具、編譯後的提示詞摘要，以及透過
`memory_search`／`memory_get` 提供的 wiki 補充內容，都會依照作用中代理程式的上下文解析知識庫。
在設定了多個代理程式的環境中進行命令列介面和閘道呼叫時，請使用
`openclaw wiki --agent <agentId> ...` 或閘道請求的 `agentId`
明確指定代理程式。若只設定一個代理程式，未提供識別碼時仍會預設使用該代理程式。

在橋接模式下，代理程式範圍的匯入只會接受 `agentIds`
包含所選代理程式的公開記憶成品。由其他代理程式擁有、
沒有擁有權中繼資料，或擁有者未知的成品都會略過。全域範圍則
維持現有的共享成品行為。

<Warning>
變更 `vault.scope` 不會複製或拆分現有知識庫。在代理程式範圍中，
明確設定的 `vault.path` 會成為父目錄，因此在切換正式環境中的代理程式之前，
請審慎移動或匯入現有頁面。請先備份知識庫。

各代理程式知識庫是同一程序內的知識邊界，而非作業系統層級的
安全邊界。可存取主機檔案系統的外掛和未受沙箱隔離的工具，
仍可讀取其他代理程式的目錄。若代理程式彼此不互信，請使用
[沙箱隔離](/zh-TW/gateway/sandboxing)或[獨立的閘道設定檔](/zh-TW/gateway/multiple-gateways)。
</Warning>

### 範例：QMD + 橋接模式

若要使用 QMD 進行記憶檢索，並使用 `memory-wiki` 維護
知識層，請採用此設定。每一層各司其職：QMD 讓原始筆記、工作階段
匯出內容和額外集合保持可搜尋，而 `memory-wiki` 則編譯
穩定的實體、主張、儀表板和來源頁面。

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

此設定會讓 QMD 負責主動記憶檢索，讓 `memory-wiki` 專注於
編譯頁面和儀表板，並在您刻意啟用編譯摘要提示詞之前，
維持提示詞結構不變。

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

完整命令參考請參閱[命令列介面：wiki](/zh-TW/cli/wiki)，其中包括
`wiki okf import`、`wiki apply metadata`、`wiki unsafe-local import`、
`wiki chatgpt import`／`wiki chatgpt rollback`，以及完整的 `wiki obsidian`
子命令集。

## Obsidian 支援

當 `vault.renderMode` 為 `obsidian` 時，此外掛會寫入適合 Obsidian 的
Markdown，並可選擇使用官方 `obsidian` 命令列介面來探測狀態、
搜尋知識庫、開啟頁面、叫用命令，以及跳至每日筆記。
此功能為選用；沒有 Obsidian 時，wiki 仍可在原生模式下運作。

代理程式範圍的知識庫仍可使用適合 Obsidian 的 Markdown，但設定
驗證會拒絕同時使用 `obsidian.useOfficialCli: true` 與 `vault.scope: "agent"`。
目前的 `obsidian.vaultName` 設定是全域的，無法為每個代理程式選擇不同的
Obsidian 知識庫。請改用 wiki 工具和命令列介面操作，
或將由 Obsidian 操作的 wiki 維持在全域範圍。

## 建議工作流程

<Steps>
<Step title="保留主動記憶外掛以進行檢索">
檢索、提升與夢境整理仍由已設定的記憶後端負責。
</Step>
<Step title="啟用 memory-wiki">
除非您明確需要橋接模式，否則請從 `isolated` 模式開始。
</Step>
<Step title="需要來源依據時使用 wiki_search / wiki_get">
若需要 wiki 專用的排序或頁面層級信念結構，請優先使用這些工具，而非 `memory_search`。
</Step>
<Step title="使用 wiki_apply 執行範圍有限的綜整或中繼資料更新">
避免手動編輯受管理的產生內容區塊。
</Step>
<Step title="完成重要變更後執行 wiki_lint">
可偵測矛盾、待解問題與來源缺口。
</Step>
<Step title="開啟儀表板以查看過時資訊與矛盾">
設定 `render.createDashboards: true`（預設值）。
</Step>
</Steps>

## 相關文件

- [記憶概覽](/zh-TW/concepts/memory)
- [命令列介面：記憶](/zh-TW/cli/memory)
- [命令列介面：wiki](/zh-TW/cli/wiki)
- [外掛 SDK 概覽](/zh-TW/plugins/sdk-overview)
