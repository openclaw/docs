---
read_when:
    - 你想使用 memory-wiki 命令列介面
    - 你正在記錄或變更 `openclaw wiki`
summary: '`openclaw wiki` 的命令列介面參考（memory-wiki 儲存庫狀態、搜尋、編譯、檢查、套用、橋接、ChatGPT 匯入及 Obsidian 輔助工具）'
title: 維基百科
x-i18n:
    generated_at: "2026-07-21T08:58:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1f793d52de270068cf3a06b13f52242bb66738235718639486e090a2de213e73
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

檢查並維護 `memory-wiki` 知識庫。由隨附的選用 `memory-wiki` 外掛提供。首次使用前請先啟用：

```bash
openclaw plugins enable memory-wiki
openclaw gateway restart
```

相關內容：[記憶 Wiki 外掛](/zh-TW/plugins/memory-wiki)、[記憶概觀](/zh-TW/concepts/memory)、[命令列介面：memory](/zh-TW/cli/memory)

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

當 `plugins.entries.memory-wiki.config.vault.scope` 為 `agent` 時，請使用頂層 `--agent <id>` 選項選取
知識庫：

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

在設定了多個代理程式的環境中，命令列介面操作必須提供 `--agent`，
以防命令讀取或寫入任意的預設知識庫。如果僅設定一個代理程式，
該代理程式仍為預設值。未知的代理程式 ID 會在知識庫操作開始前
導致失敗。當 `vault.scope` 為 `global` 時，此選項不會變更所選
路徑。

閘道用戶端遵循相同規則：在代理程式範圍的多代理程式設定中，針對以知識庫為基礎的 `wiki.*`
要求傳入 `agentId`。缺少或未知的 ID
會造成錯誤。代理程式回合、Wiki 工具、記憶語料庫補充內容，以及已編譯的提示詞
摘要，均已帶有目前有效的執行階段代理程式情境。

## 命令

### `wiki status`

顯示知識庫模式與範圍、解析出的代理程式、健康狀態，以及 Obsidian 命令列介面的可用性。請先使用此命令，確認預期的知識庫是否已初始化、橋接模式是否正常，或 Obsidian 整合是否可用。

當橋接模式啟用且設定為讀取記憶成品時，此命令會查詢執行中的閘道，因此看到的有效記憶外掛情境與代理程式／執行階段記憶相同。

### `wiki doctor`

執行 Wiki 健康檢查並回報可採取的修正措施。狀態不健康時會以非零狀態碼結束。

當橋接模式啟用且設定為讀取記憶成品時，此命令會先查詢執行中的閘道，再建立報告。已停用的橋接匯入，以及未讀取記憶成品的橋接設定，會維持本機／離線運作。

常見問題：

- 已啟用橋接模式，但沒有公開記憶成品
- 知識庫配置無效或缺失
- 預期使用 Obsidian 模式時，缺少外部 Obsidian 命令列介面

### `wiki init`

建立 Wiki 知識庫配置與起始頁面，包括頂層索引和快取目錄。

### `wiki ingest <path>`

將本機 Markdown 或文字檔匯入 Wiki 的 `sources/` 資料夾，作為來源頁面。`<path>` 必須是本機檔案路徑；目前不支援從 URL 匯入。會拒絕二進位檔案。

匯入的來源頁面包含來源資訊 frontmatter（`sourceType: local-file`、`sourcePath`、`ingestedAt`）。擷取後一律會重新編譯知識庫。

旗標：`--title <title>` 可覆寫來源標題（預設值：由檔名推導）。

### `wiki okf import <path>`

將解壓縮的 Open Knowledge Format 套件匯入 Wiki 概念頁面。

匯入器會讀取 OKF 目錄樹中每個非保留的 `.md` 概念文件，要求 `type` 欄位不可為空，並將未知的 OKF `type` 值視為一般概念。保留的 OKF `index.md` 和 `log.md` 檔案不會匯入為概念。

匯入的頁面會扁平化放在 `concepts/` 下，讓現有的 Wiki 編譯、搜尋、取得、摘要和儀表板流程立即看到這些頁面。原始 OKF 概念 ID、`type`、`resource`、`tags`、時間戳記、來源路徑和完整 frontmatter 都會保留在頁面 frontmatter 中。內部 OKF Markdown 連結會改寫為產生的 Wiki 頁面；損壞或外部連結則維持不變。匯入後一律會重新編譯知識庫。

範例：

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

重建索引、相關內容區塊、儀表板，以及已編譯的查詢／提示詞快照。快照會保存在 OpenClaw 的共用 SQLite 外掛狀態中，並保留於記憶體以供同步投射提示詞；不會在知識庫中建立快取檔案。

如果已啟用 `render.createDashboards`，編譯也會重新整理報告頁面。

### `wiki lint`

檢查知識庫並寫入涵蓋下列項目的報告：

- 結構問題（損壞的連結、缺少／重複的 ID、缺少頁面類型或標題、無效的 frontmatter）
- 來源資訊缺口（缺少來源 ID、缺少匯入來源資訊）
- 矛盾內容（已標記的矛盾、互相衝突的主張）
- 未決問題
- 低信賴度頁面與主張
- 過時的頁面與主張

對 Wiki 進行重大更新後，請執行此命令。

### `wiki search <query>`

搜尋 Wiki 內容。行為取決於設定：

- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `--mode`：`auto`、`find-person`、`route-question`、`source-evidence` 或 `raw-claim`

若需要 Wiki 專用的排名與來源資訊，請使用 `wiki search`。若要進行一次廣泛的共用回想，且有效的記憶外掛公開了共用搜尋功能，請優先使用 `openclaw memory search`。

搜尋模式：

- `find-person`：別名、帳號代稱、社群帳號、標準 ID，以及人物頁面
- `route-question`：可詢問／最適合用途提示和關係情境
- `source-evidence`：來源頁面和結構化證據欄位
- `raw-claim`：包含主張／證據中繼資料的結構化主張文字

範例：

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

當結果符合結構化主張時，文字輸出會包含 `Claim:` 和 `Evidence:` 行。JSON 輸出還會公開 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 和 `evidenceSourceIds`，供代理程式端深入檢視。

### `wiki get <lookup>`

依 ID 或相對路徑讀取 Wiki 頁面。

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

套用範圍明確的變更，無須任意修改頁面：

- `apply synthesis <title>`：建立或重新整理具有受管理摘要本文的綜合頁面
- `apply metadata <lookup>`：更新現有頁面的中繼資料

兩者都接受 `--source-id`、`--contradiction`、`--question`（各自皆可重複）、`--confidence <n>`（0-1）和 `--status <status>`。`apply metadata` 也接受 `--clear-confidence`，以移除已儲存的信賴度值。這是演進 Wiki 頁面的支援方式，可讓受管理的產生區塊保持完整。

### `wiki bridge import`

將有效記憶外掛中的公開記憶成品匯入橋接式來源頁面。在 `bridge` 模式中使用此功能，可將最新匯出的記憶成品提取到 Wiki 知識庫。

對於有效的橋接成品讀取，命令列介面會透過閘道 RPC 路由匯入，以使用執行階段記憶外掛情境。如果橋接匯入已停用或成品讀取已關閉，此命令會維持本機／離線的零匯入行為。匯入後是否重新整理索引，由 `ingest.autoCompile` 控制。

### `wiki unsafe-local import`

在 `unsafe-local` 模式中，從明確設定的本機路徑（`unsafeLocal.paths`）匯入。此功能刻意設為實驗性質，且僅限同一台機器使用。匯入後是否重新整理索引，由 `ingest.autoCompile` 控制。

### `wiki chatgpt import`

將 ChatGPT 匯出內容匯入 Wiki 來源頁面草稿。

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| 旗標              | 預設值    | 說明                                                   |
| ----------------- | ---------- | ------------------------------------------------------------- |
| `--export <path>` | （必要） | ChatGPT 匯出目錄或 `conversations.json` 路徑。        |
| `--dry-run`       | `false`    | 在不寫入頁面的情況下預覽建立／更新／略過的數量。 |

非試執行的匯入若變更任何頁面，會記錄匯入執行 ID 並在摘要中輸出；回復時需要此 ID。

### `wiki chatgpt rollback <run-id>`

回復先前套用的 ChatGPT 匯入執行，移除其建立的頁面，並還原其覆寫的頁面。如果該執行已回復，則不執行任何操作（並回報 `alreadyRolledBack`）。

### `wiki obsidian ...`

供以 Obsidian 友善模式執行之知識庫使用的 Obsidian 輔助命令：`status`、`search`、`open`、`command`、`daily`。當啟用 `obsidian.useOfficialCli` 時，這些命令要求 `PATH` 上必須有官方 `obsidian` 命令列介面。

當 `vault.scope` 為 `agent` 時，設定驗證會拒絕 `obsidian.useOfficialCli: true`，
因為 `obsidian.vaultName` 是一項全域設定，
而非個別代理程式的對應設定。仍可使用 Obsidian 友善的 Markdown 轉譯。

## 實際使用指南

- 當來源資訊和頁面識別資訊很重要時，請使用 `wiki search` + `wiki get`。
- 請使用 `wiki apply`，而非手動編輯受管理的產生區段。
- 在信任互相矛盾或低信賴度的內容前，請使用 `wiki lint`。
- 大量匯入或變更來源後，如果想立即取得最新的儀表板和已編譯摘要，請使用 `wiki compile`。
- 當資料目錄、文件匯出工具或代理程式擴充流程已產生 OKF Markdown 套件時，請使用 `wiki okf import`。
- 當橋接模式依賴新匯出的記憶成品時，請使用 `wiki bridge import`。

## 設定關聯

`openclaw wiki` 的行為受下列項目影響：

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

如需完整設定模型，請參閱[記憶 Wiki 外掛](/zh-TW/plugins/memory-wiki)。

## 相關內容

- [命令列介面參考資料](/zh-TW/cli)
- [記憶 Wiki](/zh-TW/plugins/memory-wiki)
