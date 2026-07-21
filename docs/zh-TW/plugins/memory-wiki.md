---
read_when:
    - 你想要超越純 MEMORY.md 筆記的持久知識
    - 你正在設定內建的 memory-wiki 外掛
    - 你需要為同一個閘道中的代理程式建立各自獨立的 Wiki 知識庫
    - 你想瞭解 wiki_search、wiki_get 或橋接模式
summary: memory-wiki：具備來源追溯、聲明、儀表板與橋接模式的編譯式知識庫
title: 記憶 Wiki
x-i18n:
    generated_at: "2026-07-21T09:00:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fda3c801ae39b529a3f1fcaf8791b6dcb1d8116ba2e73e99cca62dca6c64140a
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` 是一個內建外掛，可將持久知識編譯成
可瀏覽的 Wiki：確定性頁面、附有證據的結構化主張、
來源追溯、儀表板，以及機器可讀的摘要。

它不會取代主動記憶外掛。回憶、提升、索引和
夢境整理仍由所設定的記憶後端負責
（`memory-core`、QMD、Honcho 等）。`memory-wiki` 與其並存，並將
知識編譯成持續維護的 Wiki 層。

使用此外掛的命令列介面、工具或執行階段整合前，請先啟用它：

```bash
openclaw plugins enable memory-wiki
openclaw gateway restart
```

| 層                   | 負責                                                                              |
| -------------------- | --------------------------------------------------------------------------------- |
| 主動記憶外掛         | 回憶、語意搜尋、提升、夢境整理、記憶體執行階段                                    |
| `memory-wiki`        | 編譯後的 Wiki 頁面、具豐富來源追溯資訊的綜合內容、儀表板、Wiki 搜尋／取得／套用   |

實用原則：

- `memory_search`：對所有已設定的語料庫執行一次廣泛的回憶
- 需要 Wiki 專屬排序、來源追溯或頁面層級的信念結構時，使用 `wiki_search` / `wiki_get`
- 當主動記憶外掛支援語料庫選取時，使用 `memory_search corpus=all` 在一次呼叫中涵蓋兩層

常見的本機優先設定：使用 QMD 作為主動記憶後端來進行回憶，並以
`bridge` 模式使用 `memory-wiki` 產生持久的綜合頁面。請參閱
[設定](#configuration)下的 QMD + 橋接模式範例。

如果橋接模式回報匯出的成品為零，表示主動記憶外掛
目前未公開橋接輸入。請先執行 `openclaw wiki doctor`，
再確認主動記憶外掛支援公開成品。

## 儲存庫模式

- `isolated`（預設）：擁有自己的儲存庫與來源，不依賴主動記憶外掛。適合用於自給自足、經過策展的知識庫。
- `bridge`：透過公開的外掛 SDK 介面，讀取主動記憶外掛提供的公開記憶成品和事件記錄。適合用於編譯記憶外掛匯出的成品，且無須存取外掛的私有內部實作。
- `unsafe-local`：明確限定於同一台機器的逃生機制，用於存取本機私有路徑。此模式刻意保持實驗性且不可攜；只有在了解信任邊界，且明確需要橋接模式無法提供的本機檔案系統存取時才使用。

儲存庫模式與儲存庫範圍是兩個獨立的選擇：

- `vaultMode` 選擇 Wiki 輸入的來源。
- `vault.scope` 選擇所有代理程式共用一個儲存庫，或每個代理程式各自取得一個子儲存庫。

`vault.scope: "global"` 是預設值，會保留既有的單一儲存庫
行為。當代理程式不得共用 Wiki 頁面、編譯摘要、搜尋結果或寫入內容時，
請搭配 `isolated` 或 `bridge` 模式使用 `vault.scope: "agent"`。
代理程式範圍不能與 `unsafe-local` 模式結合，因為這些設定的
私有路徑不是代理程式擁有的輸入。設定驗證會拒絕此
組合。

橋接模式可依照 `bridge.*` 設定切換項目索引：

- 匯出的記憶成品（`indexMemoryRoot`）
- 每日筆記（`indexDailyNotes`）
- 夢境整理報告（`indexDreamReports`）
- 記憶事件記錄（`followMemoryEvents`）

當橋接模式啟用且 `bridge.readMemoryArtifacts` 已啟用時，
`openclaw wiki status`、`openclaw wiki doctor` 和 `openclaw wiki bridge
import` 會透過執行中的閘道路由，因此它們能看到與代理程式／執行階段記憶相同的主動記憶
外掛情境。如果橋接已停用或成品讀取已關閉，這些命令會維持本機／離線行為。

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

受管理的內容會保留在產生的區塊內；人工撰寫的筆記區塊則會
在重新產生時保留。

- `sources/`：匯入的原始素材，以及由橋接／不安全本機模式支援的頁面
- `entities/`：持久存在的事物、人員、系統、專案、物件
- `concepts/`：想法、抽象概念、模式、政策（也是 OKF 匯入內容的存放位置）
- `syntheses/`：編譯後的摘要和持續維護的彙整
- `reports/`：產生的儀表板

## Open Knowledge Format 匯入

```bash
openclaw wiki okf import ./bundles/ga4
```

將已解壓縮的 Open Knowledge Format 套件匯入 Wiki 概念頁面。當資料目錄、文件爬蟲或擴充代理程式已經
產生 OKF 時非常適合：將 OKF 保留為可攜式交換成品，再由 `memory-wiki`
將其轉換為 OpenClaw 原生概念頁面和編譯摘要。

- 非保留的 `.md` 檔案是概念文件
- 每個匯入的概念都必須有非空白的 `type` frontmatter 欄位；缺少 `type` 會產生 `missing-type` 警告，並略過該檔案
- 未知的 `type` 值會被接受為一般概念
- `index.md` 和 `log.md` 是保留項目，永遠不會匯入為概念
- 損壞或外部的 Markdown 連結會保持不變

匯入的頁面會平鋪於 `concepts/` 下，因此既有的編譯、搜尋、取得和
儀表板流程不需要第二個 Wiki 樹狀結構就能看到它們。每個頁面都會保留
原始 OKF 概念 ID、來源路徑、`type`、`resource`、`tags`、時間戳記，
以及完整的產生者 frontmatter。內部 OKF 連結會改寫為產生的
Wiki 概念頁面，並同時輸出包含 `kind: okf-link` 的結構化
`relationships` 項目。

## 結構化主張和證據

頁面包含結構化的 `claims` frontmatter，而不只是自由格式文字。每項
主張可以包含 `id`、`text`、`status`、`confidence`、`evidence[]` 和
`updatedAt`。每個證據項目可以包含 `kind`、`sourceId`、`path`、
`lines`、`weight`、`confidence`、`privacyTier`、`note` 和 `updatedAt`。

這讓 Wiki 成為信念層，而不是被動的筆記堆放處。
主張可以被追蹤、評分、質疑，並回溯至來源加以釐清。

## 供代理程式使用的實體中繼資料

實體頁面包含一般路由中繼資料，可供人員、團隊、
系統、專案或任何其他實體類型使用：

- `entityType`：例如 `person`、`team`、`system`、`project`
- `canonicalId`：跨別名和匯入內容的穩定身分識別鍵
- `aliases`：解析至同一頁面的名稱、帳號代稱或標籤
- `privacyTier`：自由格式字串；`public` 會視為無須審查，其他任何值（例如 `local-private`、`sensitive`、`confirm-before-use`）都會在 `reports/privacy-review.md` 中標示
- `bestUsedFor` / `notEnoughFor`：精簡的路由提示
- `lastRefreshedAt`：來源重新整理時間戳記，與頁面編輯時間分開
- `personCard`：選用的個人專屬路由卡（帳號代稱、社群帳號、電子郵件、時區、負責領域、適合詢問事項、不適合詢問事項、信心度、隱私層級）
- `relationships`：連至相關頁面的具型別邊（目標、種類、權重、信心度、證據種類、隱私層級、備註）

對於人員 Wiki，請從 `reports/person-agent-directory.md` 開始，接著先使用
`wiki_get` 開啟人員頁面，再使用聯絡資訊或推論出的
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
    - 範例推出問題
  avoidAskingFor:
    - 無關的帳務決策
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

編譯會讀取 Wiki 頁面、正規化摘要，並在 OpenClaw 的共用 SQLite
外掛狀態中保存供機器使用的快照。執行階段程式碼會使用
由生命週期擁有者管理的快照，在非同步提示準備期間載入 SQLite；
同步提示組合永遠不會擷取 Markdown 或讀取快取檔案。
編譯輸出也會為搜尋／取得功能提供第一輪 Wiki 索引、將主張 ID
反查至其所屬頁面、提供精簡的提示補充內容，以及產生
報告。

來源編輯和儲存庫還原只會在下一次
編譯後供機器使用。重新啟動或重新整理外掛生命週期時，會比較儲存庫中
具有因果鏈的編譯發布與 SQLite，並拒絕來自
較新但已回復狀態的快照。在回復前啟動的編譯器，無法
針對已還原的前置狀態發布。提示準備不會輪詢
儲存庫或安裝檔案監看器。
回復隔離後，在執行中處理程序內進行編譯會立即清除擁有者；
獨立的編譯器處理程序則需要重新整理外掛生命週期，讓
常駐程式確認新的持久發布。
編譯快取可以重建：發布紀元之前的快取資料列會
視為未命中，並由下一次編譯取代；這些資料列不會進行移轉。

## 儀表板和健康狀態報告

啟用 `render.createDashboards` 時，編譯會維護
`reports/` 下的儀表板：

| 報告                                | 追蹤項目                                           |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | 有未解決問題的頁面                                 |
| `reports/contradictions.md`         | 矛盾備註叢集                                       |
| `reports/low-confidence.md`         | 低信心度頁面和主張                                 |
| `reports/claim-health.md`           | 缺少結構化證據的主張                               |
| `reports/stale-pages.md`            | 過時或未知的新鮮度                                 |
| `reports/person-agent-directory.md` | 人員／實體路由卡                                   |
| `reports/relationship-graph.md`     | 結構化關係邊                                       |
| `reports/provenance-coverage.md`    | 證據類別涵蓋範圍                                   |
| `reports/privacy-review.md`         | 使用前需要審查的非公開隱私層級                     |

## 搜尋和擷取

兩種搜尋後端：

- `shared`：可用時使用共用記憶搜尋流程
- `local`：在本機搜尋 Wiki

三種語料庫：`wiki`、`memory`、`all`。

- `wiki_search` / `wiki_get` 會盡可能使用編譯摘要進行第一輪處理
- 主張 ID 會反查至其所屬頁面
- 有爭議／過時／新鮮的主張會影響排序
- 來源追溯標籤會保留在結果中

搜尋模式（`--mode`／工具的 `mode` 參數）：

| 模式              | 強化項目                                                         |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | 平衡的預設值                                               |
| `find-person`     | 類人物實體、別名、帳號名稱、社群資料、標準 ID |
| `route-question`  | 代理卡片、適合詢問／最適用情境提示、關係脈絡 |
| `source-evidence` | 來源頁面與結構化證據中繼資料                  |
| `raw-claim`       | 比對結構化宣告；傳回宣告／證據中繼資料    |

當結果符合結構化宣告時，`wiki_search` 會在其詳細資料承載內容中傳回
`matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、
`evidenceKinds` 和 `evidenceSourceIds`。若有可用資料，文字輸出
會包含精簡的 `Claim:` 與 `Evidence:` 行。

## 代理工具

| 工具          | 用途                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | 目前的知識庫模式與範圍、解析後的代理、健康狀態、Obsidian 命令列介面可用性                                                                               |
| `wiki_search` | 搜尋 Wiki 頁面，並在已設定時搜尋共享記憶語料庫；接受 `mode`，用於人物查詢、問題路由、來源證據或原始宣告深入檢視 |
| `wiki_get`    | 依 ID／路徑讀取 Wiki 頁面；啟用共享搜尋且查詢未命中時，改從共享記憶語料庫取得                                     |
| `wiki_apply`  | 執行範圍明確的綜合／中繼資料變更，不任意修改頁面內容                                                                                             |
| `wiki_lint`   | 結構檢查、來源追溯缺口、矛盾、未解問題                                                                                            |

此外掛也會註冊非獨佔的記憶語料庫補充來源，因此當作用中的記憶
外掛支援語料庫選擇時，共享的 `memory_search` 和 `memory_get` 可以存取 Wiki。

## 提示詞與上下文行為

啟用 `context.includeCompiledDigestPrompt` 時，記憶提示詞區段
會附加來自外掛狀態的精簡編譯快照：僅包含熱門頁面、
主要宣告、矛盾數量、問題數量，以及信賴度／新鮮度
限定資訊。這是選用功能，因為它會改變提示詞結構；它主要適用於
明確取用記憶補充內容的上下文引擎或提示詞組裝流程。

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

主要切換選項：

| 鍵                                        | 值／預設值                               | 說明                                                                         |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated`（預設）、`bridge`、`unsafe-local` | 選擇輸入與整合行為                                        |
| `vault.scope`                              | `global`（預設）、`agent`                    | 使用一個共享知識庫，或每個代理使用一個子知識庫                                 |
| `vault.path`                               | 全域預設為 `~/.openclaw/wiki/main`         | 全域範圍使用確切知識庫；代理範圍的父目錄預設為 `~/.openclaw/wiki`       |
| `vault.renderMode`                         | `native`（預設）、`obsidian`                 |                                                                               |
| `bridge.readMemoryArtifacts`               | 預設為 `true`                                 | 匯入作用中記憶外掛的公開產物                                  |
| `bridge.followMemoryEvents`                | 預設為 `true`                                 | 在橋接模式中包含事件記錄                                             |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | 預設為 `false`                                | 執行 `unsafe-local` 匯入時為必要設定                                        |
| `unsafeLocal.paths`                        | 預設為 `[]`                                   | 在 `unsafe-local` 模式中要匯入的明確本機路徑                         |
| `search.backend`                           | `shared`（預設）、`local`                    |                                                                               |
| `search.corpus`                            | `wiki`（預設）、`memory`、`all`              |                                                                               |
| `context.includeCompiledDigestPrompt`      | 預設為 `false`                                | 將所選代理的精簡摘要快照附加至記憶提示詞區段 |
| `render.createBacklinks`                   | 預設為 `true`                                 | 產生具確定性的相關內容區塊                                         |
| `render.createDashboards`                  | 預設為 `true`                                 | 產生儀表板頁面                                                      |

### 每個代理各自的知識庫

將 `vault.scope` 設為 `agent`，即可為每個已設定的代理提供獨立 Wiki。
在此範圍內，`vault.path` 是父目錄，OpenClaw 會附加
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
父目錄會預設為 `~/.openclaw/wiki`。因此，預設的 `main` 代理仍會使用
既有的 `~/.openclaw/wiki/main` 路徑。

代理工具、編譯後的提示詞摘要，以及透過
`memory_search`／`memory_get` 公開的 Wiki 補充內容，都會從作用中的代理上下文解析知識庫。
在設定多個代理的環境中進行命令列介面與閘道呼叫時，請透過
`openclaw wiki --agent <agentId> ...` 或閘道要求的 `agentId` 明確指定代理。
若只設定一個代理，未提供 ID 時仍會以該代理為預設值。

在橋接模式中，只有當公開記憶產物的
`agentIds` 包含所選代理時，代理範圍的匯入才會接受該產物。屬於其他代理、
缺少擁有權中繼資料，或擁有者未知的產物都會略過。全域範圍
則保留既有的共享產物行為。

<Warning>
變更 `vault.scope` 不會複製或分割現有知識庫。在代理範圍中，
明確設定的 `vault.path` 會成為父目錄，因此在切換正式環境的代理之前，請審慎
移動或匯入現有頁面。請先備份知識庫。

每個代理各自的知識庫是同一處理程序內的知識邊界，而非作業系統層級的
安全邊界。具有主機檔案系統存取權的外掛和未受沙箱隔離的工具，
仍可讀取其他代理的目錄。當代理彼此不互信時，請使用[沙箱隔離](/zh-TW/gateway/sandboxing)或
[分開的閘道設定檔](/zh-TW/gateway/multiple-gateways)。
</Warning>

### 範例：QMD + 橋接模式

當你想使用 QMD 進行回憶，並使用 `memory-wiki` 作為持續維護的
知識層時，請使用此設定。每一層都各自聚焦：QMD 讓原始筆記、工作階段
匯出內容和其他集合保持可搜尋，而 `memory-wiki` 則編譯
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

這會讓 QMD 負責主動記憶的回憶，讓 `memory-wiki` 專注於
編譯後的頁面與儀表板，並在你刻意啟用編譯摘要提示詞之前，
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

如需完整的命令參考，包括
`wiki okf import`、`wiki apply metadata`、`wiki unsafe-local import`、
`wiki chatgpt import`／`wiki chatgpt rollback`，以及完整的 `wiki obsidian`
子命令集，請參閱[命令列介面：Wiki](/zh-TW/cli/wiki)。

## Obsidian 支援

當 `vault.renderMode` 為 `obsidian` 時，此外掛會寫入適用於 Obsidian 的
Markdown，並可選擇使用官方 `obsidian` 命令列介面，進行狀態
探測、知識庫搜尋、開啟頁面、叫用命令，以及跳至
每日筆記。此功能為選用；即使沒有 Obsidian，Wiki 仍可在原生模式下運作。

代理範圍的知識庫仍可使用適用於 Obsidian 的 Markdown，但設定
驗證會拒絕 `obsidian.useOfficialCli: true` 與 `vault.scope: "agent"` 的組合。
目前的 `obsidian.vaultName` 設定是全域性的，無法為每個代理選擇不同的
Obsidian 知識庫。請改用 Wiki 工具與命令列介面操作，
或將由 Obsidian 操作的 Wiki 維持在全域範圍。

## 建議工作流程

<Steps>
<Step title="保留主動記憶外掛以供回想">
回想、提升與夢境整理仍由已設定的記憶體後端負責。
</Step>
<Step title="啟用 memory-wiki">
除非你明確想使用橋接模式，否則請從 `isolated` 模式開始。
</Step>
<Step title="在來源追溯很重要時使用 wiki_search / wiki_get">
需要 Wiki 專用的排序或頁面層級信念結構時，優先使用這些工具，而非 `memory_search`。
</Step>
<Step title="使用 wiki_apply 進行範圍明確的綜合整理或中繼資料更新">
避免手動編輯受管理的已產生區塊。
</Step>
<Step title="在進行實質變更後執行 wiki_lint">
可偵測矛盾、未解問題及來源追溯缺口。
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
