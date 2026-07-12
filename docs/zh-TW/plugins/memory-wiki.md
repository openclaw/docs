---
read_when:
    - 你想要超越純 MEMORY.md 筆記的持久知識
    - 你正在設定內建的 memory-wiki 外掛
    - 你需要為同一個閘道中的代理程式使用個別的 Wiki 資料庫
    - 你想瞭解 `wiki_search`、`wiki_get` 或橋接模式
summary: memory-wiki：具備來源追溯、主張、儀表板與橋接模式的編譯式知識庫
title: 記憶 Wiki
x-i18n:
    generated_at: "2026-07-12T14:39:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` 是一個內建外掛，可將持久知識編譯成
可導覽的 wiki：確定性頁面、附有證據的結構化主張、
來源脈絡、儀表板，以及機器可讀的摘要。

它不會取代主動記憶外掛。召回、提升、索引和
夢境整理仍由設定的記憶後端負責
（`memory-core`、QMD、Honcho 等）。`memory-wiki` 與其並行，並將
知識編譯成持續維護的 wiki 層。

| 層                   | 負責                                                                              |
| -------------------- | --------------------------------------------------------------------------------- |
| 主動記憶外掛         | 召回、語意搜尋、提升、夢境整理、記憶執行階段                                      |
| `memory-wiki`        | 編譯後的 wiki 頁面、富含來源脈絡的綜整內容、儀表板、wiki 搜尋／取得／套用          |

實用原則：

- 使用 `memory_search`，對所有已設定的語料庫執行一次廣泛召回
- 當你需要 wiki 專屬的排序、來源脈絡或頁面層級的信念結構時，使用 `wiki_search` / `wiki_get`
- 當主動記憶外掛支援選擇語料庫時，使用 `memory_search corpus=all`，在一次呼叫中涵蓋兩個層級

常見的本機優先設定：使用 QMD 作為負責召回的主動記憶後端，並以
`bridge` 模式執行 `memory-wiki`，用於持久的綜整頁面。請參閱
[設定](#configuration)下的 QMD + bridge 模式範例。

如果 bridge 模式回報匯出的成品為零，表示主動記憶外掛
目前未公開 bridge 輸入。請先執行 `openclaw wiki doctor`，
然後確認主動記憶外掛支援公開成品。

## 儲存庫模式

- `isolated`（預設）：擁有自己的儲存庫和來源，不依賴主動記憶外掛。適合用於自成一體、經過策展的知識庫。
- `bridge`：透過公開的外掛 SDK 介面，讀取主動記憶外掛的公開記憶成品和事件記錄。適合用於編譯記憶外掛匯出的成品，而不深入存取外掛的私有內部實作。
- `unsafe-local`：明確提供的同一機器逃生艙口，用於存取本機私有路徑。這是刻意設計為實驗性且不可攜的模式；只有在你了解信任邊界，且確實需要 bridge 模式無法提供的本機檔案系統存取時才使用。

儲存庫模式與儲存庫範圍是兩個獨立選項：

- `vaultMode` 選擇 wiki 輸入的來源。
- `vault.scope` 選擇所有代理程式共用一個儲存庫，或每個代理程式各自擁有一個子儲存庫。

`vault.scope: "global"` 是預設值，會保留現有的單一儲存庫
行為。當代理程式不得共用 wiki 頁面、編譯後的摘要、搜尋結果或寫入內容時，
請搭配 `isolated` 或 `bridge` 模式使用 `vault.scope: "agent"`。
代理程式範圍不能與 `unsafe-local` 模式結合，因為那些設定的
私有路徑不是代理程式擁有的輸入。設定驗證會拒絕這種
組合。

bridge 模式可依各個 `bridge.*` 設定切換項目，索引：

- 匯出的記憶成品（`indexMemoryRoot`）
- 每日筆記（`indexDailyNotes`）
- 夢境報告（`indexDreamReports`）
- 記憶事件記錄（`followMemoryEvents`）

當 bridge 模式啟用且 `bridge.readMemoryArtifacts` 已啟用時，
`openclaw wiki status`、`openclaw wiki doctor` 和 `openclaw wiki bridge
import` 會透過執行中的閘道路由，因此它們看到的主動記憶
外掛情境會與代理程式／執行階段記憶相同。如果 bridge 已停用或成品
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

受管理的內容會保留在產生的區塊內；人工筆記區塊在
重新產生時會予以保留。

- `sources/`：匯入的原始素材，以及由 bridge／unsafe-local 支援的頁面
- `entities/`：持久的事物、人員、系統、專案、物件
- `concepts/`：想法、抽象概念、模式、政策（也是 OKF 匯入內容的落點）
- `syntheses/`：編譯後的摘要與持續維護的彙整內容
- `reports/`：產生的儀表板

## Open Knowledge Format 匯入

```bash
openclaw wiki okf import ./bundles/ga4
```

將已解壓縮的 Open Knowledge Format 套件匯入 wiki 概念頁面。當資料目錄、
文件爬蟲或資料擴充代理程式已經產生 OKF 時非常適合：將 OKF 保留為可攜式
交換成品，再由 `memory-wiki` 將其轉換成 OpenClaw 原生概念頁面和
編譯摘要。

- 非保留的 `.md` 檔案是概念文件
- 每個匯入的概念都需要非空白的 `type` frontmatter 欄位；缺少 `type` 會產生 `missing-type` 警告，並略過該檔案
- 未知的 `type` 值會被接受為一般概念
- `index.md` 和 `log.md` 是保留檔案，絕不會匯入為概念
- 損壞或外部的 Markdown 連結會保持不變

匯入的頁面會平面化放置於 `concepts/` 下，因此現有的編譯、搜尋、取得和
儀表板流程無須第二棵 wiki 樹即可看到它們。每個頁面都會保留
原始 OKF 概念 ID、來源路徑、`type`、`resource`、`tags`、時間戳記，
以及完整的產生者 frontmatter。內部 OKF 連結會改寫為產生的
wiki 概念頁面，並同時發出具有
`kind: okf-link` 的結構化 `relationships` 項目。

## 結構化主張與證據

頁面帶有結構化的 `claims` frontmatter，而不只是自由格式文字。每個
主張可包含 `id`、`text`、`status`、`confidence`、`evidence[]` 和
`updatedAt`。每個證據項目可包含 `kind`、`sourceId`、`path`、
`lines`、`weight`、`confidence`、`privacyTier`、`note` 和 `updatedAt`。

這使 wiki 成為信念層，而不是被動的筆記堆放處。
主張可以被追蹤、評分、質疑，並回溯至來源以解決爭議。

## 面向代理程式的實體中繼資料

實體頁面帶有可用於人員、團隊、系統、專案或任何其他實體類型的
通用路由中繼資料：

- `entityType`：例如 `person`、`team`、`system`、`project`
- `canonicalId`：跨別名和匯入內容的穩定身分識別鍵
- `aliases`：解析至相同頁面的名稱、帳號名稱或標籤
- `privacyTier`：自由格式字串；`public` 視為無須審查，其他任何值（例如 `local-private`、`sensitive`、`confirm-before-use`）都會在 `reports/privacy-review.md` 中標示
- `bestUsedFor` / `notEnoughFor`：精簡的路由提示
- `lastRefreshedAt`：來源重新整理時間戳記，與頁面編輯時間分開
- `personCard`：選用的個人專屬路由卡片（帳號名稱、社群連結、電子郵件、時區、負責領域、適合詢問的事項、不適合詢問的事項、信賴度、隱私層級）
- `relationships`：指向相關頁面的型別化邊（目標、種類、權重、信賴度、證據種類、隱私層級、備註）

若是人員 wiki，請先從 `reports/person-agent-directory.md` 開始，接著在使用
聯絡資訊或推斷事實之前，使用 `wiki_get` 開啟個人頁面。

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
  - 範例生態系路由
notEnoughFor:
  - 法律核准
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: 範例生態系
  askFor:
    - 範例推出問題
  avoidAskingFor:
    - 不相關的帳務決策
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: 其他人員
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex 適合處理範例生態系路由。
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## 編譯管線

編譯程序會讀取 wiki 頁面、正規化摘要，並在以下位置產生穩定的
機器導向成品：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

代理程式和執行階段程式碼會讀取這些摘要，而不是擷取 Markdown。
編譯輸出也會支援搜尋／取得的第一階段 wiki 索引、將主張 ID
查回其所屬頁面、精簡提示補充內容，以及報告
產生。

## 儀表板與健康狀態報告

啟用 `render.createDashboards` 時，編譯程序會維護
`reports/` 下的儀表板：

| 報告                                | 追蹤內容                                           |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | 有未解決問題的頁面                                 |
| `reports/contradictions.md`         | 矛盾備註群集                                       |
| `reports/low-confidence.md`         | 低信賴度頁面與主張                                 |
| `reports/claim-health.md`           | 缺少結構化證據的主張                               |
| `reports/stale-pages.md`            | 過時或新鮮度未知的頁面                             |
| `reports/person-agent-directory.md` | 人員／實體路由卡片                                 |
| `reports/relationship-graph.md`     | 結構化關係邊                                       |
| `reports/provenance-coverage.md`    | 證據類別涵蓋率                                     |
| `reports/privacy-review.md`         | 使用前需要審查的非公開隱私層級                     |

## 搜尋與擷取

兩種搜尋後端：

- `shared`：可用時使用共用記憶搜尋流程
- `local`：在本機搜尋 wiki

三種語料庫：`wiki`、`memory`、`all`。

- `wiki_search` / `wiki_get` 會在可行時使用編譯摘要進行第一階段處理
- 主張 ID 會解析回所屬頁面
- 受質疑／過時／新鮮的主張會影響排序
- 來源脈絡標籤會保留在結果中

搜尋模式（`--mode` / 工具 `mode` 參數）：

| 模式              | 加權提升內容                                                   |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | 平衡的預設值                                                   |
| `find-person`     | 類似人員的實體、別名、帳號名稱、社群連結、標準 ID             |
| `route-question`  | 代理程式卡片、適合詢問／最適用情境提示、關係脈絡               |
| `source-evidence` | 來源頁面與結構化證據中繼資料                                   |
| `raw-claim`       | 相符的結構化主張；傳回主張／證據中繼資料                       |

當結果與結構化主張相符時，`wiki_search` 會在其詳細資料承載內容中傳回
`matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、
`evidenceKinds` 和 `evidenceSourceIds`。若有可用資料，文字輸出
會包含精簡的 `Claim:` 和 `Evidence:` 行。

## 代理程式工具

| 工具          | 用途                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | 目前的知識庫模式與範圍、解析出的代理、健康狀態、Obsidian 命令列介面可用性                                                                               |
| `wiki_search` | 搜尋 Wiki 頁面，並在設定後搜尋共享記憶語料庫；接受 `mode`，用於人物查詢、問題路由、來源證據或原始主張深入檢視 |
| `wiki_get`    | 依 ID／路徑讀取 Wiki 頁面；啟用共享搜尋且查詢無結果時，會改從共享記憶語料庫讀取                                     |
| `wiki_apply`  | 執行範圍明確的整合／中繼資料變更，不進行自由形式的頁面修改                                                                                             |
| `wiki_lint`   | 結構檢查、出處缺口、矛盾、未解問題                                                                                            |

此外掛也會註冊非獨占的記憶語料庫補充來源，因此當主動記憶
外掛支援語料庫選擇時，共享的 `memory_search` 和 `memory_get`
便能存取 Wiki。

## 提示詞與上下文行為

啟用 `context.includeCompiledDigestPrompt` 時，記憶提示詞區段
會附加來自 `agent-digest.json` 的精簡編譯快照：僅包含主要頁面、
主要主張、矛盾數量、問題數量，以及信賴度／新鮮度
限定條件。此功能須選擇啟用，因為它會改變提示詞結構；其主要適用於
明確使用記憶補充內容的上下文引擎或提示詞組裝流程。

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

主要開關：

| 鍵                                         | 值／預設值                                     | 說明                                                                          |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated`（預設）、`bridge`、`unsafe-local`   | 選擇輸入與整合行為                                                            |
| `vault.scope`                              | `global`（預設）、`agent`                      | 所有代理共用一個知識庫，或每個代理各有一個子知識庫                            |
| `vault.path`                               | 全域預設為 `~/.openclaw/wiki/main`             | 全域範圍的確切知識庫路徑；代理範圍的父目錄預設為 `~/.openclaw/wiki`           |
| `vault.renderMode`                         | `native`（預設）、`obsidian`                   |                                                                               |
| `bridge.readMemoryArtifacts`               | 預設為 `true`                                  | 匯入主動記憶外掛的公開成品                                                    |
| `bridge.followMemoryEvents`                | 預設為 `true`                                  | 在橋接模式中包含事件記錄                                                      |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | 預設為 `false`                                 | 執行 `unsafe-local` 匯入時必須啟用                                            |
| `unsafeLocal.paths`                        | 預設為 `[]`                                    | 在 `unsafe-local` 模式中要匯入的明確本機路徑                                  |
| `search.backend`                           | `shared`（預設）、`local`                      |                                                                               |
| `search.corpus`                            | `wiki`（預設）、`memory`、`all`                |                                                                               |
| `context.includeCompiledDigestPrompt`      | 預設為 `false`                                 | 將所選代理的精簡摘要快照附加至記憶提示詞區段                                  |
| `render.createBacklinks`                   | 預設為 `true`                                  | 產生具確定性的相關內容區塊                                                    |
| `render.createDashboards`                  | 預設為 `true`                                  | 產生儀表板頁面                                                                |

### 每個代理各自的知識庫

將 `vault.scope` 設為 `agent`，即可讓每個已設定的代理擁有獨立的 Wiki。
在此範圍中，`vault.path` 是父目錄，OpenClaw 會附加
正規化後的代理 ID：

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
`~/.openclaw/wiki/marketing`。若在代理範圍中省略 `vault.path`，
父目錄預設為 `~/.openclaw/wiki`。因此，預設的 `main` 代理會繼續使用
現有的 `~/.openclaw/wiki/main` 路徑。

代理工具、編譯後的提示詞摘要，以及透過
`memory_search`／`memory_get` 提供的 Wiki 補充內容，都會依主動代理的上下文
解析知識庫。若設定中有多個代理，進行命令列介面與閘道呼叫時，請使用
`openclaw wiki --agent <agentId> ...` 或閘道
要求中的 `agentId` 明確指定代理。若只設定一個代理，未提供 ID 時仍會以其為
預設代理。

在橋接模式中，代理範圍匯入僅會接受 `agentIds`
包含所選代理的公開記憶成品。屬於其他代理、
缺少擁有權中繼資料，或擁有者不明的成品都會略過。全域範圍
則會保留既有的共享成品行為。

<Warning>
變更 `vault.scope` 不會複製或分割現有知識庫。在代理範圍中，
明確設定的 `vault.path` 會成為父目錄，因此在切換正式環境的代理前，請審慎
移動或匯入現有頁面。請先備份
知識庫。

每個代理各自的知識庫是同一處理程序內的知識邊界，而非作業系統層級的
安全邊界。具有主機檔案系統存取權的外掛與未沙箱化工具，
仍可讀取其他代理的目錄。若代理彼此不信任，請使用[沙箱化](/zh-TW/gateway/sandboxing)或
[個別的閘道設定檔](/zh-TW/gateway/multiple-gateways)。
</Warning>

### 範例：QMD + 橋接模式

當你想使用 QMD 進行回憶，並使用 `memory-wiki` 維護
知識層時，請採用此設定。每一層都專注於各自的職責：QMD 讓原始筆記、工作階段
匯出內容和額外集合保持可搜尋，而 `memory-wiki` 則會編譯
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

這會讓 QMD 負責主動記憶回憶，讓 `memory-wiki` 專注於
編譯頁面和儀表板，且在你有意啟用編譯摘要提示詞之前，
提示詞結構都不會改變。

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

完整命令參考請參閱[命令列介面：Wiki](/zh-TW/cli/wiki)，其中包括
`wiki okf import`、`wiki apply metadata`、`wiki unsafe-local import`、
`wiki chatgpt import`／`wiki chatgpt rollback`，以及完整的 `wiki obsidian`
子命令集。

## Obsidian 支援

當 `vault.renderMode` 為 `obsidian` 時，此外掛會寫入適合 Obsidian 使用的
Markdown，並可選擇使用官方 `obsidian` 命令列介面進行狀態
探測、知識庫搜尋、開啟頁面、叫用命令，以及跳至
每日筆記。這是選用功能；即使沒有 Obsidian，Wiki 仍可在原生模式中
運作。

代理範圍知識庫仍可使用適合 Obsidian 的 Markdown，但設定
驗證會拒絕同時使用 `obsidian.useOfficialCli: true` 與 `vault.scope: "agent"`。
目前的 `obsidian.vaultName` 設定是全域設定，無法為每個代理選擇不同的
Obsidian 知識庫。請改用 Wiki 工具和命令列介面操作，
或將由 Obsidian 操作的 Wiki 保持在全域範圍。

## 建議工作流程

<Steps>
<Step title="保留主動記憶外掛以進行回憶">
回憶、提升與夢境整理仍由已設定的記憶後端負責。
</Step>
<Step title="啟用 memory-wiki">
除非你明確需要橋接模式，否則請先從 `isolated` 模式開始。
</Step>
<Step title="重視出處時使用 wiki_search／wiki_get">
當你需要 Wiki 特有的排序或頁面層級的信念結構時，請優先使用這些工具，而不是 `memory_search`。
</Step>
<Step title="使用 wiki_apply 執行範圍明確的整合或中繼資料更新">
避免手動編輯受管理的產生內容區塊。
</Step>
<Step title="完成重要變更後執行 wiki_lint">
可找出矛盾、未解問題與出處缺口。
</Step>
<Step title="開啟儀表板以掌握過時內容／矛盾">
設定 `render.createDashboards: true`（預設值）。
</Step>
</Steps>

## 相關文件

- [記憶概觀](/zh-TW/concepts/memory)
- [命令列介面：記憶](/zh-TW/cli/memory)
- [命令列介面：Wiki](/zh-TW/cli/wiki)
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)
