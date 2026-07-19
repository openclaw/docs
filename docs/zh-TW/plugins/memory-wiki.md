---
read_when:
    - 你想要超越純 MEMORY.md 筆記的持久知識
    - 你正在設定隨附的 memory-wiki 外掛
    - 你需要為同一個閘道中的代理程式分別建立獨立的 Wiki 知識庫
    - 你想要瞭解 wiki_search、wiki_get 或橋接模式
summary: memory-wiki：具備來源追溯、聲明、儀表板與橋接模式的編譯式知識庫
title: 記憶 Wiki
x-i18n:
    generated_at: "2026-07-19T13:52:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cba1a17dc6a6021df51ebc8028663034bb82909aafd9e8e5716fca3a8ea3d03a
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` 是一個內建外掛，可將持久知識編譯成
可瀏覽的 wiki：確定性頁面、附帶證據的結構化宣告、
來源資訊、儀表板及機器可讀的摘要。

它不會取代主動記憶外掛。回憶、提升、索引及
夢境整理仍由設定的記憶後端
（`memory-core`、QMD、Honcho 等）負責。`memory-wiki` 與其並存，並將
知識編譯成可維護的 wiki 層。

| 層級                 | 負責項目                                                                          |
| -------------------- | --------------------------------------------------------------------------------- |
| 主動記憶外掛         | 回憶、語意搜尋、提升、夢境整理、記憶執行階段                                      |
| `memory-wiki`        | 編譯後的 wiki 頁面、富含來源資訊的綜合內容、儀表板、wiki 搜尋／取得／套用          |

實用原則：

- `memory_search`，對所有已設定的語料庫執行一次廣泛的回憶查詢
- 需要 wiki 專用的排序、來源資訊或頁面層級的信念結構時，使用 `wiki_search`／`wiki_get`
- 若主動記憶外掛支援選取語料庫，使用 `memory_search corpus=all` 即可透過一次呼叫橫跨兩層

常見的本機優先設定：使用 QMD 作為負責回憶的主動記憶後端，並以
`bridge` 模式執行 `memory-wiki`，產生持久的綜合頁面。請參閱
[設定](#configuration)中的 QMD + 橋接模式範例。

如果橋接模式回報匯出的成品數量為零，表示主動記憶外掛
目前未公開橋接輸入。請先執行 `openclaw wiki doctor`，
再確認主動記憶外掛支援公開成品。

## 儲存庫模式

- `isolated`（預設）：擁有自己的儲存庫與來源，不依賴主動記憶外掛。適合用於自成一體、經過整理的知識儲存區。
- `bridge`：透過公開的外掛 SDK 介面，讀取主動記憶外掛提供的公開記憶成品及事件記錄。適合用來編譯記憶外掛匯出的成品，而無須存取外掛的私有內部實作。
- `unsafe-local`：明確供同一台機器使用的逃生通道，可存取本機私有路徑。此模式刻意維持實驗性且不可攜；僅限了解信任邊界，且確實需要橋接模式無法提供的本機檔案系統存取時使用。

儲存庫模式與儲存庫範圍是兩項獨立選擇：

- `vaultMode` 選擇 wiki 輸入的來源。
- `vault.scope` 選擇所有代理程式共用一個儲存庫，或每個代理程式各自擁有一個子儲存庫。

`vault.scope: "global"` 是預設值，會保留既有的單一儲存庫
行為。當代理程式之間不得共用 wiki 頁面、編譯摘要、搜尋結果或寫入內容時，
請搭配 `isolated` 或 `bridge` 模式使用 `vault.scope: "agent"`。
代理程式範圍不能與 `unsafe-local` 模式併用，因為這些設定的
私有路徑不是代理程式所擁有的輸入。設定驗證會拒絕此
組合。

橋接模式可依照 `bridge.*` 設定開關建立下列內容的索引：

- 匯出的記憶成品（`indexMemoryRoot`）
- 每日筆記（`indexDailyNotes`）
- 夢境整理報告（`indexDreamReports`）
- 記憶事件記錄（`followMemoryEvents`）

啟用橋接模式及 `bridge.readMemoryArtifacts` 後，
`openclaw wiki status`、`openclaw wiki doctor` 及 `openclaw wiki bridge
import` 會透過執行中的閘道路由，因此可取得與代理程式／執行階段記憶相同的主動記憶
外掛情境。若停用橋接或關閉成品
讀取，這些命令會維持本機／離線行為。

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

受管理的內容會保留在產生的區塊內；人工筆記區塊則會在
重新產生時保留。

- `sources/`：匯入的原始素材，以及由橋接／不安全本機模式支援的頁面
- `entities/`：持久存在的事物、人員、系統、專案、物件
- `concepts/`：概念、抽象觀念、模式、政策（也是 OKF 匯入內容的存放位置）
- `syntheses/`：編譯後的摘要及持續維護的彙總
- `reports/`：產生的儀表板

## Open Knowledge Format 匯入

```bash
openclaw wiki okf import ./bundles/ga4
```

將已解壓縮的 Open Knowledge Format 套件匯入 wiki 概念頁面。當
資料目錄、文件爬蟲或資料增補代理程式已經
產生 OKF 時尤其合適：保留 OKF 作為可攜式交換成品，再由 `memory-wiki`
將其轉換成 OpenClaw 原生概念頁面及編譯摘要。

- 非保留的 `.md` 檔案會作為概念文件
- 每個匯入的概念都必須具有非空白的 `type` frontmatter 欄位；缺少 `type` 時會產生 `missing-type` 警告，並略過該檔案
- 未知的 `type` 值會作為一般概念接受
- `index.md` 與 `log.md` 為保留項目，絕不會作為概念匯入
- 損壞或外部的 Markdown 連結會維持不變

匯入的頁面會平面化存放於 `concepts/` 下，讓現有的編譯、搜尋、取得及
儀表板流程無須第二棵 wiki 樹即可看見它們。每個頁面都會保留
原始 OKF 概念 ID、來源路徑、`type`、`resource`、`tags`、時間戳記，
以及完整的產生器 frontmatter。內部 OKF 連結會改寫至產生的
wiki 概念頁面，並同時產生含有
`kind: okf-link` 的結構化 `relationships` 項目。

## 結構化宣告與證據

頁面含有結構化的 `claims` frontmatter，而不只有自由格式文字。每項
宣告可包含 `id`、`text`、`status`、`confidence`、`evidence[]` 及
`updatedAt`。每項證據可包含 `kind`、`sourceId`、`path`、
`lines`、`weight`、`confidence`、`privacyTier`、`note` 及 `updatedAt`。

這使 wiki 能作為信念層運作，而不是被動的筆記堆放區。
宣告可被追蹤、評分、質疑，並回溯至來源以解決爭議。

## 供代理程式使用的實體中繼資料

實體頁面包含通用路由中繼資料，可用於人員、團隊、
系統、專案或任何其他實體類型：

- `entityType`：例如 `person`、`team`、`system`、`project`
- `canonicalId`：跨別名與匯入內容的穩定身分識別鍵
- `aliases`：解析至同一頁面的名稱、帳號名稱或標籤
- `privacyTier`：自由格式字串；`public` 會視為不需審查，任何其他值（例如 `local-private`、`sensitive`、`confirm-before-use`）都會在 `reports/privacy-review.md` 中標示
- `bestUsedFor`／`notEnoughFor`：精簡路由提示
- `lastRefreshedAt`：來源重新整理時間戳記，與頁面編輯時間分開
- `personCard`：選用的人員專用路由卡片（帳號名稱、社群帳號、電子郵件、時區、負責領域、適合詢問事項、不宜詢問事項、信心水準、隱私層級）
- `relationships`：連至相關頁面的型別化邊（目標、種類、權重、信心水準、證據種類、隱私層級、備註）

對於人員 wiki，請先從 `reports/person-agent-directory.md` 開始，再以
`wiki_get` 開啟人員頁面，之後才使用聯絡資訊或推論出的
事實。

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
    - 範例推出相關問題
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
    text: Alex 適合協助範例生態系路由。
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## 編譯流水線

編譯程序會讀取 wiki 頁面、正規化摘要，並在 OpenClaw 的共用 SQLite 外掛狀態中
保存供機器使用的快照。執行階段程式碼會使用
由生命週期所擁有的擁有者快照，在非同步提示準備期間載入 SQLite；
同步提示組合絕不會抓取 Markdown 或讀取快取檔案。
編譯後的輸出也會支援搜尋／取得所使用的第一階段 wiki 索引、將宣告 ID
查回其所屬頁面、精簡提示補充內容及報告
產生。

來源編輯與儲存庫還原只有在下次
編譯後才會對機器端生效。重新啟動或重新整理外掛生命週期時，會比較儲存庫中
具有因果鏈的編譯發布與 SQLite，並拒絕來自
較新但已回復狀態的快照。在回復前啟動的編譯器無法
針對已還原的前置狀態發布。提示準備程序不會輪詢
儲存庫，也不會安裝檔案監看器。
回復隔離後，在執行中程序內進行編譯會立即清除擁有者；
若使用獨立的編譯器程序，則需要重新整理外掛生命週期，讓
常駐程式確認新的持久發布。
編譯快取可以重建：早於發布時期的快取資料列會
視為未命中，並由下次編譯取代；它們不會被遷移。

## 儀表板與健康狀態報告

啟用 `render.createDashboards` 後，編譯程序會在
`reports/` 下維護儀表板：

| 報告                                | 追蹤項目                                           |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | 含有未解決問題的頁面                               |
| `reports/contradictions.md`         | 矛盾備註叢集                                       |
| `reports/low-confidence.md`         | 低信心水準的頁面與宣告                             |
| `reports/claim-health.md`           | 缺少結構化證據的宣告                               |
| `reports/stale-pages.md`            | 過時或未知的新鮮度                                 |
| `reports/person-agent-directory.md` | 人員／實體路由卡片                                 |
| `reports/relationship-graph.md`     | 結構化關係邊                                       |
| `reports/provenance-coverage.md`    | 證據類別涵蓋率                                     |
| `reports/privacy-review.md`         | 使用前需要審查的非公開隱私層級                     |

## 搜尋與擷取

兩種搜尋後端：

- `shared`：可用時使用共用記憶搜尋流程
- `local`：在本機搜尋 wiki

三種語料庫：`wiki`、`memory`、`all`。

- `wiki_search`／`wiki_get` 會盡可能使用編譯摘要進行第一階段搜尋
- 宣告 ID 會解析回其所屬頁面
- 有爭議／過時／最新的宣告會影響排序
- 來源資訊標籤會保留在結果中

搜尋模式（`--mode`／工具的 `mode` 參數）：

| 模式              | 增強項目                                                         |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | 平衡的預設值                                               |
| `find-person`     | 類人物實體、別名、帳號名稱、社群帳號、標準 ID |
| `route-question`  | 代理程式卡片、適合詢問／最佳用途提示、關係脈絡 |
| `source-evidence` | 來源頁面與結構化證據中繼資料                  |
| `raw-claim`       | 比對結構化宣告；傳回宣告／證據中繼資料    |

當結果符合結構化宣告時，`wiki_search` 會在其詳細資料承載內容中傳回
`matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、
`evidenceKinds` 和 `evidenceSourceIds`。文字輸出會在可用時
包含精簡的 `Claim:` 和 `Evidence:` 行。

## 代理程式工具

| 工具          | 用途                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | 目前的儲存庫模式與範圍、解析後的代理程式、健康狀態、Obsidian 命令列介面可用性                                                                               |
| `wiki_search` | 搜尋 Wiki 頁面，以及在設定後搜尋共用記憶語料庫；接受 `mode`，用於人物查詢、問題路由、來源證據或原始宣告深入檢視 |
| `wiki_get`    | 依 ID／路徑讀取 Wiki 頁面；啟用共用搜尋且查詢未命中時，改從共用記憶語料庫讀取                                     |
| `wiki_apply`  | 執行範圍有限的綜合／中繼資料變更，不進行自由形式的頁面修改                                                                                             |
| `wiki_lint`   | 結構檢查、來源追溯缺口、矛盾、未解問題                                                                                            |

此外掛也會註冊一個非獨占的記憶語料庫補充來源，因此當主動記憶
外掛支援語料庫選擇時，共用的 `memory_search` 和 `memory_get` 可以存取 Wiki。

## 提示與上下文行為

啟用 `context.includeCompiledDigestPrompt` 時，記憶提示區段會
附加一份來自外掛狀態的精簡編譯快照：僅含排名最前的頁面、
排名最前的宣告、矛盾數量、問題數量，以及信賴度／新鮮度
限定資訊。這是選用功能，因為它會改變提示的結構；它主要適用於
明確使用記憶補充內容的上下文引擎或提示組裝流程。

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

| 鍵                                        | 值／預設值                               | 備註                                                                         |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated`（預設）、`bridge`、`unsafe-local` | 選擇輸入與整合行為                                        |
| `vault.scope`                              | `global`（預設）、`agent`                    | 使用一個共用儲存庫，或為每個代理程式使用一個子儲存庫                                 |
| `vault.path`                               | 全域預設值 `~/.openclaw/wiki/main`         | 全域範圍使用確切的儲存庫；代理程式範圍的父目錄預設為 `~/.openclaw/wiki`       |
| `vault.renderMode`                         | `native`（預設）、`obsidian`                 |                                                                               |
| `bridge.readMemoryArtifacts`               | 預設值 `true`                                 | 匯入主動記憶外掛的公開成品                                  |
| `bridge.followMemoryEvents`                | 預設值 `true`                                 | 在橋接模式中納入事件日誌                                             |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | 預設值 `false`                                | 執行 `unsafe-local` 匯入時為必要項目                                        |
| `unsafeLocal.paths`                        | 預設值 `[]`                                   | 在 `unsafe-local` 模式中要匯入的明確本機路徑                         |
| `search.backend`                           | `shared`（預設）、`local`                    |                                                                               |
| `search.corpus`                            | `wiki`（預設）、`memory`、`all`              |                                                                               |
| `context.includeCompiledDigestPrompt`      | 預設值 `false`                                | 將所選代理程式的精簡摘要快照附加至記憶提示區段 |
| `render.createBacklinks`                   | 預設值 `true`                                 | 產生具確定性的相關內容區塊                                         |
| `render.createDashboards`                  | 預設值 `true`                                 | 產生儀表板頁面                                                      |

### 每個代理程式各自的儲存庫

將 `vault.scope` 設為 `agent`，即可為每個已設定的代理程式提供獨立的 Wiki。
在此範圍中，`vault.path` 是父目錄，而 OpenClaw 會附加
正規化後的代理程式 ID：

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
`~/.openclaw/wiki/marketing`。如果在代理程式範圍中省略 `vault.path`，
父目錄會預設為 `~/.openclaw/wiki`。因此，預設的 `main` 代理程式會保留
現有的 `~/.openclaw/wiki/main` 路徑。

代理程式工具、編譯後的提示摘要，以及透過
`memory_search`／`memory_get` 公開的 Wiki 補充內容，都會依主動代理程式上下文解析儲存庫。
在設有多個代理程式的環境中進行命令列介面和閘道呼叫時，請透過
`openclaw wiki --agent <agentId> ...` 或閘道要求的 `agentId`
明確指定代理程式。若只設定一個代理程式，未提供 ID 時仍會將其作為預設值。

在橋接模式中，只有當公開記憶成品的
`agentIds` 包含所選代理程式時，代理程式範圍的匯入才會接受該成品。屬於其他代理程式、
不含擁有權中繼資料，或擁有者未知的成品都會略過。全域範圍
則保留現有的共用成品行為。

<Warning>
變更 `vault.scope` 不會複製或拆分現有的儲存庫。在代理程式範圍中，
明確設定的 `vault.path` 會成為父目錄，因此在切換正式環境中的代理程式前，
請有計畫地移動或匯入現有頁面。請先備份
儲存庫。

每個代理程式各自的儲存庫是同一處理程序內的知識邊界，而不是作業系統層級的
安全邊界。具有主機檔案系統存取權的外掛與未受沙箱限制的工具，
仍可讀取其他代理程式的目錄。當代理程式彼此不信任時，請使用[沙箱化](/zh-TW/gateway/sandboxing)或
[個別的閘道設定檔](/zh-TW/gateway/multiple-gateways)。
</Warning>

### 範例：QMD + 橋接模式

如果你希望使用 QMD 進行回憶，並以 `memory-wiki` 作為持續維護的
知識層，請使用此設定。每一層都能專注於各自職責：QMD 讓原始筆記、工作階段
匯出資料及其他集合保持可搜尋，而 `memory-wiki` 則會編譯
穩定的實體、宣告、儀表板和來源頁面。

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

這會讓 QMD 負責主動記憶回憶，使 `memory-wiki` 專注於
編譯後的頁面與儀表板，並維持提示結構不變，直到你
有意啟用編譯摘要提示為止。

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

當 `vault.renderMode` 為 `obsidian` 時，此外掛會寫入適合 Obsidian 的
Markdown，並可選擇使用官方 `obsidian` 命令列介面，進行狀態
探測、儲存庫搜尋、開啟頁面、叫用命令，以及跳至
每日筆記。此功能為選用；沒有 Obsidian 時，Wiki 仍可在原生模式下運作。

代理程式範圍的儲存庫仍可使用適合 Obsidian 的 Markdown，但設定
驗證會拒絕同時使用 `obsidian.useOfficialCli: true` 與 `vault.scope: "agent"`。
目前的 `obsidian.vaultName` 設定是全域性的，無法為每個代理程式選擇不同的
Obsidian 儲存庫。請改用 Wiki 工具和命令列介面操作，
或將由 Obsidian 操作的 Wiki 保持在全域範圍中。

## 建議工作流程

<Steps>
<Step title="保留主動記憶外掛以供回憶">
回憶、提升與夢境整理仍由已設定的記憶後端負責。
</Step>
<Step title="啟用 memory-wiki">
除非你明確想使用橋接模式，否則請從 `isolated` 模式開始。
</Step>
<Step title="在來源依據很重要時使用 wiki_search / wiki_get">
若需要 Wiki 專屬的排序或頁面層級的信念結構，請優先使用這些工具，而非 `memory_search`。
</Step>
<Step title="使用 wiki_apply 進行範圍有限的彙整或中繼資料更新">
避免手動編輯受管理的已產生區塊。
</Step>
<Step title="在有實質變更後執行 wiki_lint">
可找出矛盾、未解問題與來源依據缺口。
</Step>
<Step title="開啟儀表板以掌握過時內容與矛盾">
設定 `render.createDashboards: true`（預設值）。
</Step>
</Steps>

## 相關文件

- [記憶體概覽](/zh-TW/concepts/memory)
- [命令列介面：記憶體](/zh-TW/cli/memory)
- [命令列介面：Wiki](/zh-TW/cli/wiki)
- [外掛 SDK 概覽](/zh-TW/plugins/sdk-overview)
