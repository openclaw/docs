---
read_when:
    - 您想要使用 memory-wiki 命令列介面
    - 你正在記錄或變更 `openclaw wiki`
summary: '`openclaw wiki` 的命令列介面參考（memory-wiki 儲存庫狀態、搜尋、編譯、檢查、套用、橋接、ChatGPT 匯入及 Obsidian 輔助工具）'
title: 維基百科
x-i18n:
    generated_at: "2026-07-11T21:15:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

檢查並維護 `memory-wiki` 知識庫。由內建的 `memory-wiki` 外掛提供。

相關資訊：[記憶 Wiki 外掛](/zh-TW/plugins/memory-wiki)、[記憶體概覽](/zh-TW/concepts/memory)、[命令列介面：memory](/zh-TW/cli/memory)

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
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

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

當 `plugins.entries.memory-wiki.config.vault.scope` 為 `agent` 時，使用頂層 `--agent <id>` 選項選取知識庫：

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

在設定了多個代理程式的環境中，命令列介面操作必須指定 `--agent`，以免命令讀取或寫入任意的預設知識庫。如果只設定一個代理程式，該代理程式仍為預設值。未知的代理程式 ID 會在知識庫操作開始前導致失敗。當 `vault.scope` 為 `global` 時，此選項不會變更所選路徑。

閘道用戶端遵循相同規則：在代理程式範圍的多代理程式環境中，對知識庫支援的 `wiki.*` 請求傳入 `agentId`。缺少或未知的 ID 都會導致錯誤。代理程式對話回合、Wiki 工具、記憶語料庫補充內容，以及編譯後的提示摘要，均已帶有作用中執行階段代理程式的情境。

## 命令

### `wiki status`

顯示知識庫模式與範圍、解析後的代理程式、健康狀態，以及 Obsidian 命令列介面的可用性。請先使用此命令，確認預期的知識庫是否已初始化、橋接模式是否正常，或 Obsidian 整合是否可用。

當橋接模式已啟用並設定為讀取記憶成品時，此命令會查詢執行中的閘道，因此它所看到的作用中記憶外掛情境會與代理程式／執行階段記憶相同。

### `wiki doctor`

執行 Wiki 健康狀態檢查並回報可採取的修正措施。狀態不健康時，以非零狀態碼結束。

當橋接模式已啟用並設定為讀取記憶成品時，此命令會先查詢執行中的閘道，再建立報告。已停用的橋接匯入，以及未讀取記憶成品的橋接設定，會維持本機／離線運作。

常見問題：

- 已啟用橋接模式，但沒有公開記憶成品
- 知識庫版面配置無效或缺失
- 預期使用 Obsidian 模式時，缺少外部 Obsidian 命令列介面

### `wiki init`

建立 Wiki 知識庫版面配置與起始頁面，包括頂層索引和快取目錄。

### `wiki ingest <path>`

將本機 Markdown 或文字檔匯入 Wiki 的 `sources/` 資料夾，作為來源頁面。`<path>` 必須是本機檔案路徑；目前不支援從 URL 擷取。二進位檔案會遭到拒絕。

匯入的來源頁面會帶有出處前置資料（`sourceType: local-file`、`sourcePath`、`ingestedAt`）。擷取後一律會重新編譯知識庫。

旗標：`--title <title>` 會覆寫來源標題（預設值：從檔名衍生）。

### `wiki okf import <path>`

將已解壓縮的 Open Knowledge Format 套件匯入 Wiki 概念頁面。

匯入器會讀取 OKF 目錄樹中每個非保留的 `.md` 概念文件、要求非空的 `type` 欄位，並將未知的 OKF `type` 值視為一般概念。保留的 OKF `index.md` 與 `log.md` 檔案不會匯入為概念。

匯入的頁面會平面化放置於 `concepts/` 下，讓現有的 Wiki 編譯、搜尋、取得、摘要和儀表板流程立即可見。原始 OKF 概念 ID、`type`、`resource`、`tags`、時間戳記、來源路徑及完整前置資料，都會保留在頁面的前置資料中。內部 OKF Markdown 連結會改寫為所產生的 Wiki 頁面；損壞或外部連結則維持不變。匯入後一律會重新編譯知識庫。

範例：

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

重建索引、相關區塊、儀表板及編譯後的摘要。將穩定且供機器使用的成品寫入：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

如果已啟用 `render.createDashboards`，編譯也會重新整理報告頁面。

### `wiki lint`

檢查知識庫並寫入涵蓋下列內容的報告：

- 結構問題（損壞的連結、缺少／重複的 ID、缺少頁面類型或標題、無效的前置資料）
- 出處缺漏（缺少來源 ID、缺少匯入出處）
- 矛盾（已標記的矛盾、互相衝突的主張）
- 未解問題
- 低可信度的頁面與主張
- 過時的頁面與主張

在有實質 Wiki 更新後執行此命令。

### `wiki search <query>`

搜尋 Wiki 內容。行為取決於設定：

- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `--mode`：`auto`、`find-person`、`route-question`、`source-evidence` 或 `raw-claim`

需要 Wiki 專用的排序與出處資訊時，請使用 `wiki search`。如要進行一次廣泛的共用回憶搜尋，當作用中的記憶外掛公開共用搜尋功能時，優先使用 `openclaw memory search`。

搜尋模式：

- `find-person`：別名、帳號名稱、社交帳號、標準 ID，以及人物頁面
- `route-question`：可詢問對象／最適合用途的提示，以及關係情境
- `source-evidence`：來源頁面與結構化證據欄位
- `raw-claim`：含主張／證據中繼資料的結構化主張文字

範例：

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

當結果符合結構化主張時，文字輸出會包含 `Claim:` 與 `Evidence:` 行。JSON 輸出還會公開 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 和 `evidenceSourceIds`，供代理程式端深入查看。

### `wiki get <lookup>`

依 ID 或相對路徑讀取 Wiki 頁面。

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

套用範圍明確的變更，無須任意修改頁面：

- `apply synthesis <title>`：使用受管理的摘要內文建立或重新整理綜合頁面
- `apply metadata <lookup>`：更新現有頁面的中繼資料

兩者都接受 `--source-id`、`--contradiction`、`--question`（每個皆可重複）、`--confidence <n>`（0–1），以及 `--status <status>`。`apply metadata` 也接受 `--clear-confidence`，用來移除已儲存的可信度值。這是演進 Wiki 頁面的受支援方式，可確保受管理的產生區塊維持完整。

### `wiki bridge import`

將作用中記憶外掛的公開記憶成品匯入橋接支援的來源頁面。在 `bridge` 模式中使用此命令，將最新匯出的記憶成品提取到 Wiki 知識庫。

對於作用中的橋接成品讀取，命令列介面會透過閘道 RPC 路由匯入，因此會使用執行階段的記憶外掛情境。如果已停用橋接匯入或關閉成品讀取，命令會維持本機／離線的零匯入行為。匯入後是否重新整理索引由 `ingest.autoCompile` 控制。

### `wiki unsafe-local import`

在 `unsafe-local` 模式中，從明確設定的本機路徑（`unsafeLocal.paths`）匯入。此功能刻意設為實驗性，且僅限同一台機器使用。匯入後是否重新整理索引由 `ingest.autoCompile` 控制。

### `wiki chatgpt import`

將 ChatGPT 匯出內容匯入 Wiki 來源頁面草稿。

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| 旗標              | 預設值     | 說明                                                          |
| ----------------- | ---------- | ------------------------------------------------------------- |
| `--export <path>` | （必填）   | ChatGPT 匯出目錄或 `conversations.json` 路徑。                 |
| `--dry-run`       | `false`    | 在不寫入頁面的情況下，預覽建立／更新／略過的數量。            |

非試執行匯入若變更了任何頁面，便會記錄匯入執行 ID 並將其印在摘要中；回復操作需要此 ID。

### `wiki chatgpt rollback <run-id>`

回復先前已套用的 ChatGPT 匯入執行，移除其建立的頁面，並還原其覆寫的頁面。如果該執行已回復，則不執行任何操作（並回報 `alreadyRolledBack`）。

### `wiki obsidian ...`

供以 Obsidian 友善模式執行之知識庫使用的 Obsidian 輔助命令：`status`、`search`、`open`、`command`、`daily`。啟用 `obsidian.useOfficialCli` 時，這些命令需要在 `PATH` 上提供官方 `obsidian` 命令列介面。

當 `vault.scope` 為 `agent` 時，設定驗證會拒絕 `obsidian.useOfficialCli: true`，因為 `obsidian.vaultName` 是單一全域設定，而不是每個代理程式的對應表。Obsidian 友善的 Markdown 算繪仍然可用。

## 實際使用指南

- 當出處與頁面識別資訊很重要時，使用 `wiki search` + `wiki get`。
- 使用 `wiki apply`，不要手動編輯受管理的產生區段。
- 在信任互相矛盾或低可信度的內容前，使用 `wiki lint`。
- 批次匯入或來源變更後，若要立即取得最新的儀表板和編譯後摘要，請使用 `wiki compile`。
- 當資料目錄、文件匯出或代理程式強化管線已產生 OKF Markdown 套件時，使用 `wiki okf import`。
- 當橋接模式依賴新匯出的記憶成品時，使用 `wiki bridge import`。

## 設定關聯

`openclaw wiki` 的行為由以下設定影響：

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

## 相關資訊

- [命令列介面參考](/zh-TW/cli)
- [記憶 Wiki](/zh-TW/plugins/memory-wiki)
