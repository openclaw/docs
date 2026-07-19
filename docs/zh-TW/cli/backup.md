---
read_when:
    - 你想要為本機 OpenClaw 狀態建立一流的備份封存檔
    - 你需要一份精簡且經過驗證的單一 OpenClaw SQLite 資料庫快照
    - 你想要在重設或解除安裝前預覽會包含哪些路徑
summary: '`openclaw backup` 的命令列介面參考（封存與 SQLite 快照）'
title: 備份
x-i18n:
    generated_at: "2026-07-19T13:41:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa9444b5e57e9c6f9492e4b017be96ea8d9da88cf335fd163ea6744975fda37b
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

為 OpenClaw 狀態、設定、認證設定檔、頻道／供應商認證資訊、工作階段，以及選用的工作區建立本機備份封存檔。

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
openclaw backup sqlite create --global --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite create --agent main --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite list --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite verify ~/Backups/openclaw-sqlite/<snapshot-id>
openclaw backup sqlite verify ~/Backups/openclaw-sqlite/<snapshot-id> --scratch ~/Private/openclaw-scratch
openclaw backup sqlite restore ~/Backups/openclaw-sqlite/<snapshot-id> --target ./restored/openclaw.sqlite
```

## 注意事項

- 封存檔內嵌一個 `manifest.json`，其中包含解析後的來源路徑和封存檔版面配置。
- 預設輸出是目前工作目錄中帶時間戳記的 `.tar.gz` 封存檔。帶時間戳記的檔名使用你機器的本地時區，並包含 UTC 偏移量。如果目前工作目錄位於要備份的來源樹狀目錄內，OpenClaw 會改用你的家目錄作為預設封存檔位置。
- 絕不覆寫現有封存檔。系統會拒絕位於來源狀態／工作區樹狀目錄內的輸出路徑，以免將封存檔本身納入備份。
- `openclaw backup verify <archive>` 會檢查封存檔是否恰好包含一個根資訊清單、拒絕路徑遊走形式的封存路徑和 SQLite 側載檔、確認資訊清單宣告的每個承載內容都存在、驗證每個 SQLite 快照的檔案結構，並對標準 OpenClaw 資料庫執行完整的完整性與角色檢查。專用的外掛結構描述會維持不透明，因為它們可能需要擁有者定義的 SQLite 功能。`openclaw backup create --verify` 會在寫入封存檔後立即執行該驗證。
- `openclaw backup create --only-config` 僅備份使用中的 JSON 設定檔。

## SQLite 快照

當你需要的是單一 OpenClaw 所擁有之 SQLite 資料庫的可攜式成品，而非廣泛的狀態封存檔時，請使用 `openclaw backup sqlite`。

建立快照時只接受一個具名來源：

| 命令                                                         | 資料庫               |
| --------------------------------------------------------------- | ---------------------- |
| `openclaw backup sqlite create --global --repository <dir>`     | 共用 OpenClaw 狀態  |
| `openclaw backup sqlite create --agent <id> --repository <dir>` | 每個代理程式各一個資料庫 |

儲存庫中每個已提交的快照各有一個目錄。每個快照目錄恰好包含：

- `manifest.json`
- `database.sqlite`

建立快照時，會先驗證即時資料庫再讀取它，使用 SQLite `VACUUM INTO` 將已提交的 WAL 狀態擷取至精簡資料庫，再次驗證產生的資料庫，並在不覆寫現有路徑的情況下發布已完成的目錄。全域快照會移除暫時性的傳遞佇列資料列並再次壓縮，因此已刪除的佇列承載內容不會保留在可用頁面中。

請勿將即時的 `.sqlite`、`-wal`、`-shm` 或 `-journal` 檔案複製為可攜式成品。僅複製已完成的快照目錄。

SQLite 快照可能包含認證設定檔、工作階段狀態、外掛狀態及其他敏感記錄。請使用與即時 OpenClaw 狀態目錄相同的權限、加密、保留政策與目的地限制來保護儲存庫。

### 驗證與還原

```bash
openclaw backup sqlite verify <snapshot-directory>
openclaw backup sqlite restore <snapshot-directory> --target <new-database-path>
```

驗證會檢查嚴格的資訊清單結構、成品大小與 SHA-256、SQLite 完整性、外部索引鍵、結構描述版本、資料庫角色與擁有者，以及 OpenClaw 所擁有的索引定義。

驗證會檢查內容固定的私人副本，避免路徑名稱競爭條件替換 SQLite 所檢查的位元組。預設情況下，該暫存副本會建立在快照儲存庫旁，並於命令返回前移除。暫存根目錄及其祖先鏈必須防止其他使用者替換它。POSIX 根目錄必須由目前使用者擁有，且群組／所有人皆不可寫入；對於由使用者擁有的子目錄，可接受 `/tmp` 之類具有黏著位元的祖先目錄。系統會拒絕會暴露暫存區或使其可被替換的 macOS ACL 授權。Windows 根目錄及祖先目錄必須由目前使用者或受信任的作業系統主體擁有，且 ACL 須拒絕不受信任者存取暫存區。若是唯讀掛載點或網路共用，請在具備同等加密與目的地控制的儲存空間上傳入 `--scratch <existing-private-directory>`。

在暫存或發布資料庫位元組之前，建立快照也會對儲存庫套用相同的擁有者、ACL、祖先目錄與路徑身分檢查。

還原會再次執行驗證，而且只會寫入全新的目標。它會拒絕現有目標、`-wal`、`-shm` 或 `-journal` 側載檔，且絕不會就地替換即時 OpenClaw 資料庫。目標父目錄須符合與驗證暫存目錄相同的路徑安全要求。啟用已還原的資料庫仍須由操作人員明確地離線執行。

快照儲存庫是本機目錄。排程、上傳、保留、增量 WAL 套件、容錯移轉及開機時還原行為刻意不屬於此命令的範圍。

## 備份內容

`openclaw backup create` 會根據你的本機 OpenClaw 安裝規劃來源：

- 狀態目錄（通常是 `~/.openclaw`）
- 使用中的設定檔路徑
- 解析後的 `credentials/` 目錄（當它存在於狀態目錄之外時）
- 從目前設定中探索到的工作區目錄，除非你傳入 `--no-include-workspace`

認證設定檔和其他個別代理程式執行階段狀態都位於狀態目錄下的 SQLite 中（`agents/<agentId>/agent/openclaw-agent.sqlite`），因此會自動由狀態備份項目涵蓋。

`--only-config` 會略過狀態、認證資訊目錄及工作區探索，且僅封存使用中的設定檔路徑。

OpenClaw 會先將路徑標準化再建立封存檔：如果設定檔、認證資訊目錄或工作區已位於狀態目錄內，便不會將它們複製為獨立的頂層備份來源。不存在的路徑會略過。

建立封存檔期間，OpenClaw 會在 `tar` 讀取已知會即時變動的路徑前將其排除。這可避免檔案記錄的大小與並行寫入之間發生競爭條件。篩選器會在每個要備份的狀態目錄下套用以下相對於狀態目錄的規則：

| 相對於狀態目錄的範圍                         | 略過的檔案副檔名         |
| -------------------------------------------- | ----------------------------- |
| `sessions/**`                                | `.jsonl`、`.log`              |
| `agents/<agentId>/sessions/**`               | `.jsonl`、`.log`              |
| `cron/runs/**`                               | `.jsonl`、`.log`              |
| `logs/**`                                    | `.jsonl`、`.log`              |
| `delivery-queue/**`                          | `.json`、`.delivered`、`.tmp` |
| `session-delivery-queue/**`                  | `.json`、`.delivered`、`.tmp` |
| 已備份狀態目錄下的任何路徑 | `.sock`、`.pid`、`.tmp`       |

這些規則不會篩選狀態目錄外的工作區檔案。它們也會省略符合表格條件的已完成逐字稿和記錄檔，因此需要時請另外保留這些記錄。JSON 結果中的 `skippedVolatileCount` 會回報刻意省略的檔案數量。

狀態目錄下的 SQLite 資料庫會使用 `VACUUM INTO` 壓縮，以免已刪除頁面的殘留內容進入封存檔，且不會複製即時 WAL／SHM 檔案。需要目前無法使用之擁有者定義 SQLite 功能的外掛所擁有資料庫會採取失敗關閉，而非退回原始頁面複製。透過工作區備份納入的 SQLite 檔案會視為工作區檔案複製，不適用此壓縮保證。

狀態目錄的 `extensions/` 樹狀目錄下，已安裝外掛的原始碼和資訊清單檔案會納入備份，但其巢狀 `node_modules/` 相依性樹狀目錄會被略過，因為它們是可重建的安裝成品。還原封存檔後，如果還原的外掛回報缺少相依性，請使用 `openclaw plugins update <id>`，或使用 `openclaw plugins install <spec> --force` 重新安裝。

狀態目錄下由安裝程式管理且可重建的執行階段根目錄也會略過：`dev/`、`git/`、`npm/`、舊版 `npm-runtime/` 及 `tools/`。這些目錄包含受管理的簽出、套件樹狀目錄與下載的執行階段，而非具權威性的使用者狀態；還原後請重新安裝或更新對應的執行階段或外掛。位於這些根目錄之一且經明確設定的設定檔、認證資訊目錄或工作區仍會納入備份。

## 無效設定行為

`openclaw backup` 會略過一般設定預先檢查，因此在復原期間仍可提供協助。工作區探索需要有效的設定，因此當設定檔存在但無效，且工作區備份仍啟用時，`openclaw backup create` 會快速失敗。

若要在這種情況下進行部分備份，請使用 `--no-include-workspace` 重新執行：它會保留狀態、設定和外部認證資訊目錄的範圍，同時完全略過工作區探索。

當設定格式錯誤時，`--only-config` 仍可運作，因為它不會為了探索工作區而剖析設定。

## 大小與效能

OpenClaw 不會強制執行內建的最大備份大小或個別檔案大小限制。如果寫入封存檔的作業五分鐘內未產生任何資料，作業會失敗並移除未完成的暫存檔，而不是無限期停滯。其他實際限制來自：

- 暫存封存檔寫入及最終封存檔所需的可用空間
- 走訪大型工作區樹狀目錄並將其壓縮成 `.tar.gz` 所需的時間
- 使用 `--verify` 或 `openclaw backup verify` 重新掃描封存檔所需的時間
- 目的地檔案系統行為：OpenClaw 優先使用不覆寫的硬連結發布步驟，並在不支援硬連結時退回獨佔複製

大型工作區通常是封存檔大小的主要影響因素。使用 `--no-include-workspace` 可取得較小／較快的備份，或使用 `--only-config` 取得最小的封存檔。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
