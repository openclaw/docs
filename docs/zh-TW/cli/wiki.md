---
read_when:
    - 你想要使用 memory-wiki 命令列介面
    - 你正在記錄或變更 `openclaw wiki`
summary: '`openclaw wiki` 的命令列介面參考（memory-wiki 保存庫狀態、搜尋、編譯、lint、套用、橋接、ChatGPT 匯入與 Obsidian 輔助工具）'
title: 維基
x-i18n:
    generated_at: "2026-07-05T11:11:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f50389227366eadfb027b019998604be4651b44430f8d7c04d719990843dd84
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

檢查並維護 `memory-wiki` 儲存庫。由內建的 `memory-wiki` 外掛提供。

相關：[記憶 Wiki 外掛](/zh-TW/plugins/memory-wiki)、[記憶概覽](/zh-TW/concepts/memory)、[命令列介面：memory](/zh-TW/cli/memory)

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

## 命令

### `wiki status`

顯示儲存庫模式、健康狀態，以及 Obsidian 命令列介面的可用性。先使用此命令檢查儲存庫是否已初始化、橋接模式是否健康，或 Obsidian 整合是否可用。

當橋接模式已啟用，且設定為讀取記憶體成品時，此命令會查詢執行中的閘道，因此它會看到與代理程式/執行階段記憶體相同的主動記憶外掛情境。

### `wiki doctor`

執行 Wiki 健康檢查並回報可採取的修正。狀態不健康時會以非零碼結束。

當橋接模式已啟用，且設定為讀取記憶體成品時，此命令會在建立報告前查詢執行中的閘道。停用的橋接匯入，以及不讀取記憶體成品的橋接設定，會保持本機/離線。

常見問題：

- 已啟用橋接模式但沒有公開記憶體成品
- 儲存庫版面無效或缺失
- 預期使用 Obsidian 模式時缺少外部 Obsidian 命令列介面

### `wiki init`

建立 Wiki 儲存庫版面與起始頁面，包括頂層索引和快取目錄。

### `wiki ingest <path>`

將本機 Markdown 或文字檔匯入 Wiki 的 `sources/` 資料夾作為來源頁面。`<path>` 必須是本機檔案路徑；目前沒有 URL 擷取。會拒絕二進位檔案。

匯入的來源頁面會帶有來源前置資料（`sourceType: local-file`、`sourcePath`、`ingestedAt`）。擷取後一律會重新編譯儲存庫。

旗標：`--title <title>` 會覆寫來源標題（預設：由檔名衍生）。

### `wiki okf import <path>`

將已解封的 Open Knowledge Format 套件匯入為 Wiki 概念頁面。

匯入器會讀取 OKF 目錄樹中每個非保留的 `.md` 概念文件，要求存在非空的 `type` 欄位，並將未知的 OKF `type` 值視為通用概念。保留的 OKF `index.md` 和 `log.md` 檔案不會作為概念匯入。

匯入的頁面會扁平化放在 `concepts/` 下，因此既有的 Wiki compile、search、get、digest 和 dashboard 流程可以立即看到它們。原始 OKF 概念 ID、`type`、`resource`、`tags`、時間戳記、來源路徑，以及完整前置資料都會保留在頁面前置資料中。內部 OKF Markdown 連結會改寫為產生的 Wiki 頁面；損壞或外部連結會保持不變。匯入後一律會重新編譯儲存庫。

範例：

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

重建索引、相關區塊、dashboard，以及已編譯摘要。將穩定的機器介面成品寫入：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

如果已啟用 `render.createDashboards`，compile 也會重新整理報告頁面。

### `wiki lint`

檢查儲存庫並寫入涵蓋以下內容的報告：

- 結構問題（損壞連結、缺少/重複 ID、缺少頁面類型或標題、無效前置資料）
- 來源缺口（缺少來源 ID、缺少匯入來源）
- 矛盾（標記的矛盾、衝突的主張）
- 未解問題
- 低信心頁面與主張
- 過期頁面與主張

在有意義的 Wiki 更新後執行此命令。

### `wiki search <query>`

搜尋 Wiki 內容。行為取決於設定：

- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `--mode`：`auto`、`find-person`、`route-question`、`source-evidence` 或 `raw-claim`

使用 `wiki search` 取得 Wiki 專用的排序與來源資訊。若要進行一次廣泛的共享回憶查詢，當主動記憶外掛公開共享搜尋時，請優先使用 `openclaw memory search`。

搜尋模式：

- `find-person`：別名、帳號、社群資料、標準 ID，以及人物頁面
- `route-question`：詢問對象/最佳用途提示與關係情境
- `source-evidence`：來源頁面與結構化證據欄位
- `raw-claim`：帶有主張/證據中繼資料的結構化主張文字

範例：

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

當結果符合結構化主張時，文字輸出會包含 `Claim:` 和 `Evidence:` 行。JSON 輸出另外公開 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 和 `evidenceSourceIds`，供代理程式端深入查詢。

### `wiki get <lookup>`

透過 ID 或相對路徑讀取 Wiki 頁面。

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

套用狹窄變更，而不進行自由形式的頁面手術：

- `apply synthesis <title>`：使用受管理的摘要本文建立或重新整理綜合頁面
- `apply metadata <lookup>`：更新既有頁面的中繼資料

兩者都接受 `--source-id`、`--contradiction`、`--question`（每個都可重複）、`--confidence <n>`（0-1）和 `--status <status>`。`apply metadata` 也接受 `--clear-confidence`，用來移除已儲存的信心值。這是演進 Wiki 頁面的受支援方式，可讓受管理的產生區塊保持完整。

### `wiki bridge import`

將主動記憶外掛中的公開記憶體成品匯入為橋接支援的來源頁面。在 `bridge` 模式中使用此命令，將最新匯出的記憶體成品拉入 Wiki 儲存庫。

對於主動橋接成品讀取，命令列介面會透過閘道 RPC 路由匯入，因此會使用執行階段記憶外掛情境。如果橋接匯入已停用或成品讀取已關閉，此命令會保留本機/離線的零匯入行為。匯入後的索引重新整理由 `ingest.autoCompile` 控制。

### `wiki unsafe-local import`

在 `unsafe-local` 模式中，從明確設定的本機路徑（`unsafeLocal.paths`）匯入。這是刻意保留的實驗性功能，且僅限同一台機器使用。匯入後的索引重新整理由 `ingest.autoCompile` 控制。

### `wiki chatgpt import`

將 ChatGPT 匯出匯入為草稿 Wiki 來源頁面。

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| 旗標              | 預設值     | 說明                                                          |
| ----------------- | ---------- | ------------------------------------------------------------- |
| `--export <path>` | （必要）   | ChatGPT 匯出目錄或 `conversations.json` 路徑。                |
| `--dry-run`       | `false`    | 不寫入頁面，預覽建立/更新/略過的數量。                       |

非 dry-run 匯入若變更任何頁面，會記錄匯入執行 ID，並在摘要中印出，回復時需要此 ID。

### `wiki chatgpt rollback <run-id>`

回復先前套用的 ChatGPT 匯入執行，移除它建立的頁面，並還原它覆寫的頁面。如果該執行已回復，則不執行任何操作（並回報 `alreadyRolledBack`）。

### `wiki obsidian ...`

供以 Obsidian 友善模式執行的儲存庫使用的 Obsidian 輔助命令：`status`、`search`、`open`、`command`、`daily`。當 `obsidian.useOfficialCli` 已啟用時，這些命令需要官方 `obsidian` 命令列介面位於 `PATH` 上。

## 實務使用指南

- 當來源與頁面身分很重要時，使用 `wiki search` + `wiki get`。
- 使用 `wiki apply`，而不是手動編輯受管理的產生區段。
- 在信任矛盾或低信心內容前，使用 `wiki lint`。
- 在大量匯入或來源變更後，如果想立即取得最新 dashboard 和已編譯摘要，請使用 `wiki compile`。
- 當資料目錄、文件匯出或代理程式增強管線已經輸出 OKF Markdown 套件時，使用 `wiki okf import`。
- 當橋接模式依賴新匯出的記憶體成品時，使用 `wiki bridge import`。

## 設定關聯

`openclaw wiki` 的行為受以下項目影響：

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

完整設定模型請參閱[記憶 Wiki 外掛](/zh-TW/plugins/memory-wiki)。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [記憶 Wiki](/zh-TW/plugins/memory-wiki)
