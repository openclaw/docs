---
read_when:
    - 你想要使用 memory-wiki 命令列介面
    - 你正在記錄或變更 `openclaw wiki`
summary: '`openclaw wiki` 的命令列介面參考（memory-wiki 儲存庫狀態、搜尋、編譯、檢查、套用、橋接、ChatGPT 匯入及 Obsidian 輔助工具）'
title: 維基百科
x-i18n:
    generated_at: "2026-07-12T14:25:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

檢查及維護 `memory-wiki` 知識庫。由隨附的 `memory-wiki` 外掛提供。

相關內容：[記憶 Wiki 外掛](/zh-TW/plugins/memory-wiki)、[記憶概觀](/zh-TW/concepts/memory)、[命令列介面：記憶](/zh-TW/cli/memory)

## 常用命令

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "應該向誰詢問 Teams？" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha 摘要" \
  --body "簡短的綜整內文" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "仍在使用中嗎？"

openclaw wiki bridge import
openclaw wiki unsafe-local import
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## 代理程式選擇

當 `plugins.entries.memory-wiki.config.vault.scope` 為 `agent` 時，請使用頂層的 `--agent <id>` 選項選擇知識庫：

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "退款政策"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

在設定了多個代理程式的環境中，命令列介面操作必須指定 `--agent`，避免命令讀取或寫入任意的預設知識庫。若只設定了一個代理程式，該代理程式仍為預設值。未知的代理程式 ID 會在知識庫操作開始前導致失敗。當 `vault.scope` 為 `global` 時，此選項不會變更所選路徑。

閘道用戶端遵循相同規則：在代理程式範圍的多代理程式環境中，對以知識庫為後端的 `wiki.*` 請求傳入 `agentId`。遺漏或未知的 ID 都會造成錯誤。代理程式回合、Wiki 工具、記憶語料庫補充內容及已編譯的提示詞摘要，都已帶有目前作用中的執行階段代理程式內容。

## 命令

### `wiki status`

顯示知識庫模式與範圍、解析後的代理程式、健康狀態，以及 Obsidian 命令列介面的可用性。請先使用此命令，確認預期的知識庫是否已初始化、橋接模式是否正常，或 Obsidian 整合是否可用。

當橋接模式作用中且設定為讀取記憶成品時，此命令會查詢執行中的閘道，因此看到的作用中記憶外掛內容與代理程式／執行階段記憶相同。

### `wiki doctor`

執行 Wiki 健康狀態檢查，並回報可採取的修正方式。狀態不正常時會以非零代碼結束。

當橋接模式作用中且設定為讀取記憶成品時，此命令會先查詢執行中的閘道，再產生報告。已停用的橋接匯入，以及未讀取記憶成品的橋接設定，會維持本機／離線運作。

常見問題：

- 啟用橋接模式，但沒有公開記憶成品
- 知識庫配置無效或缺失
- 預期使用 Obsidian 模式時，缺少外部 Obsidian 命令列介面

### `wiki init`

建立 Wiki 知識庫配置與起始頁面，包括頂層索引及快取目錄。

### `wiki ingest <path>`

將本機 Markdown 或文字檔匯入 Wiki 的 `sources/` 資料夾，作為來源頁面。`<path>` 必須是本機檔案路徑；目前不支援從 URL 擷取。二進位檔案會遭拒絕。

匯入的來源頁面會包含出處 frontmatter（`sourceType: local-file`、`sourcePath`、`ingestedAt`）。擷取後一律會重新編譯知識庫。

旗標：`--title <title>` 會覆寫來源標題（預設：從檔名衍生）。

### `wiki okf import <path>`

將已解壓縮的 Open Knowledge Format 套件匯入 Wiki 概念頁面。

匯入器會讀取 OKF 目錄樹中所有非保留的 `.md` 概念文件，要求 `type` 欄位不得為空，並將未知的 OKF `type` 值視為一般概念。保留的 OKF `index.md` 與 `log.md` 檔案不會匯入為概念。

匯入的頁面會扁平化存放於 `concepts/` 下，因此既有的 Wiki 編譯、搜尋、取得、摘要及儀表板流程可立即存取。原始 OKF 概念 ID、`type`、`resource`、`tags`、時間戳記、來源路徑及完整 frontmatter，都會保留在頁面的 frontmatter 中。內部 OKF Markdown 連結會重寫為所產生的 Wiki 頁面；無效或外部連結則維持不變。匯入後一律會重新編譯知識庫。

範例：

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery 資料表" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

重建索引、相關區塊、儀表板及已編譯摘要。將穩定的機器導向成品寫入：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

若已啟用 `render.createDashboards`，編譯也會重新整理報告頁面。

### `wiki lint`

檢查知識庫並寫入涵蓋下列項目的報告：

- 結構問題（無效連結、缺少／重複 ID、缺少頁面類型或標題、無效 frontmatter）
- 出處缺漏（缺少來源 ID、缺少匯入出處）
- 矛盾（標記的矛盾、互相衝突的主張）
- 未解問題
- 低信賴度頁面與主張
- 過時的頁面與主張

完成重要的 Wiki 更新後，請執行此命令。

### `wiki search <query>`

搜尋 Wiki 內容。行為取決於設定：

- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `--mode`：`auto`、`find-person`、`route-question`、`source-evidence` 或 `raw-claim`

需要 Wiki 專屬的排序及出處資訊時，請使用 `wiki search`。若要進行一次廣泛的共享回想搜尋，且作用中的記憶外掛提供共享搜尋，請優先使用 `openclaw memory search`。

搜尋模式：

- `find-person`：別名、使用者代號、社群帳號、標準 ID 及人物頁面
- `route-question`：適合詢問對象／最適合用途的提示，以及關係脈絡
- `source-evidence`：來源頁面及結構化佐證欄位
- `raw-claim`：包含主張／佐證中繼資料的結構化主張文字

範例：

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "誰了解 Teams 推出作業？" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "Teams 的可靠轉介對象" --mode raw-claim --json
```

當結果符合結構化主張時，文字輸出會包含 `Claim:` 與 `Evidence:` 行。JSON 輸出還會提供 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 及 `evidenceSourceIds`，供代理程式端深入查詢。

### `wiki get <lookup>`

依 ID 或相對路徑讀取 Wiki 頁面。

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

套用範圍明確的變更，無須任意修改頁面：

- `apply synthesis <title>`：使用受管理的摘要內文建立或重新整理綜整頁面
- `apply metadata <lookup>`：更新現有頁面的中繼資料

兩者皆接受 `--source-id`、`--contradiction`、`--question`（均可重複指定）、`--confidence <n>`（0-1）及 `--status <status>`。`apply metadata` 也接受 `--clear-confidence`，用來移除已儲存的信賴度值。這是演進 Wiki 頁面的受支援方式，可確保受管理的產生區塊保持完整。

### `wiki bridge import`

將作用中記憶外掛的公開記憶成品匯入以橋接為後端的來源頁面。在 `bridge` 模式下使用此命令，將最新匯出的記憶成品提取至 Wiki 知識庫。

對作用中的橋接成品讀取，命令列介面會透過閘道 RPC 路由匯入，因此會使用執行階段的記憶外掛內容。如果已停用橋接匯入或關閉成品讀取，命令會維持本機／離線的零匯入行為。匯入後是否重新整理索引由 `ingest.autoCompile` 控制。

### `wiki unsafe-local import`

在 `unsafe-local` 模式下，從明確設定的本機路徑（`unsafeLocal.paths`）匯入。此功能刻意維持實驗性質，且僅限同一台機器使用。匯入後是否重新整理索引由 `ingest.autoCompile` 控制。

### `wiki chatgpt import`

將 ChatGPT 匯出資料匯入為 Wiki 來源草稿頁面。

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| 旗標              | 預設值     | 說明                                                          |
| ----------------- | ---------- | ------------------------------------------------------------- |
| `--export <path>` | （必填）   | ChatGPT 匯出目錄或 `conversations.json` 路徑。                 |
| `--dry-run`       | `false`    | 不寫入頁面，僅預覽建立／更新／略過的數量。                    |

非試執行的匯入若變更任何頁面，便會記錄匯入執行 ID，並在摘要中印出；回復操作需要此 ID。

### `wiki chatgpt rollback <run-id>`

回復先前套用的 ChatGPT 匯入執行，移除該次建立的頁面，並還原遭覆寫的頁面。若該次執行已回復，則不執行任何操作（並回報 `alreadyRolledBack`）。

### `wiki obsidian ...`

供以 Obsidian 相容模式執行的知識庫使用的 Obsidian 輔助命令：`status`、`search`、`open`、`command`、`daily`。啟用 `obsidian.useOfficialCli` 時，這些命令要求官方 `obsidian` 命令列介面位於 `PATH` 中。

當 `vault.scope` 為 `agent` 時，設定驗證會拒絕 `obsidian.useOfficialCli: true`，因為 `obsidian.vaultName` 是單一全域設定，而不是各代理程式的對應設定。Obsidian 相容的 Markdown 轉譯仍可使用。

## 實際使用指南

- 當出處和頁面身分很重要時，請使用 `wiki search` + `wiki get`。
- 請使用 `wiki apply`，不要手動編輯受管理的產生區段。
- 信任互相矛盾或低信賴度的內容前，請使用 `wiki lint`。
- 大量匯入或變更來源後，若希望立即取得最新的儀表板及已編譯摘要，請使用 `wiki compile`。
- 當資料目錄、文件匯出或代理程式擴充管線已產生 OKF Markdown 套件時，請使用 `wiki okf import`。
- 當橋接模式依賴新匯出的記憶成品時，請使用 `wiki bridge import`。

## 相關設定

`openclaw wiki` 的行為受以下設定影響：

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

完整設定模型請參閱[記憶 Wiki 外掛](/zh-TW/plugins/memory-wiki)。

## 相關內容

- [命令列介面參考資料](/zh-TW/cli)
- [記憶 Wiki](/zh-TW/plugins/memory-wiki)
