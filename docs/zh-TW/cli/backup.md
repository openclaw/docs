---
read_when:
    - 你想要一個用於本機 OpenClaw 狀態的一流備份封存檔
    - 你需要一份 OpenClaw SQLite 資料庫的精簡且經過驗證的快照
    - 你想在重設或解除安裝前預覽會包含哪些路徑
summary: '`openclaw backup` 的命令列介面參考（封存檔與 SQLite 快照）'
title: 備份
x-i18n:
    generated_at: "2026-07-14T13:33:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 6f52d6c96feb08862d2f666c0ed777f5ecb12713a10d6a8ec4cc0374d015250d
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

為 OpenClaw 狀態、設定、驗證設定檔、頻道／提供者認證資訊、工作階段，以及選用的工作區建立本機備份封存檔。

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

- 封存檔內嵌一份 `manifest.json`，其中包含解析後的來源路徑與封存配置。
- 預設輸出是在目前工作目錄中，以時間戳記命名的 `.tar.gz` 封存檔。時間戳記檔名使用你電腦的本地時區，並包含 UTC 偏移量。如果目前工作目錄位於要備份的來源樹狀目錄內，OpenClaw 會改用你的家目錄作為預設封存位置。
- 絕不覆寫既有的封存檔。為避免將輸出本身納入封存，位於來源狀態／工作區樹狀目錄內的輸出路徑會遭拒絕。
- `openclaw backup verify <archive>` 會檢查封存檔是否恰好包含一份根資訊清單、拒絕目錄周遊形式的封存路徑與 SQLite 附屬檔案、確認資訊清單宣告的每個承載內容都存在、驗證每個 SQLite 快照的檔案形式，並對標準 OpenClaw 資料庫執行完整的完整性與角色檢查。專用的外掛結構描述仍視為不透明內容，因為它們可能需要擁有者定義的 SQLite 功能。`openclaw backup create --verify` 會在寫入封存檔後立即執行該驗證。
- `openclaw backup create --only-config` 僅備份使用中的 JSON 設定檔。

## SQLite 快照

當你需要針對單一 OpenClaw 擁有的 SQLite 資料庫建立可攜式成品，而非廣泛的狀態封存檔時，請使用 `openclaw backup sqlite`。

建立快照時，必須且只能指定一個具名來源：

| 命令                                                         | 資料庫               |
| --------------------------------------------------------------- | ---------------------- |
| `openclaw backup sqlite create --global --repository <dir>`     | OpenClaw 共用狀態  |
| `openclaw backup sqlite create --agent <id> --repository <dir>` | 每個代理程式各一個資料庫 |

儲存庫會為每個已提交的快照包含一個目錄。每個快照目錄恰好包含：

- `manifest.json`
- `database.sqlite`

建立快照時，會先驗證即時資料庫，再使用 SQLite `VACUUM INTO` 將已提交的 WAL 狀態擷取至精簡資料庫中，接著再次驗證產生的資料庫，最後在不覆寫既有路徑的情況下發布完成的目錄。全域快照會移除暫時性的傳遞佇列資料列並再次壓縮，避免已刪除的佇列承載內容留存在可用頁面中。

請勿將即時的 `.sqlite`、`-wal`、`-shm` 或 `-journal` 檔案複製為可攜式成品。僅複製已完成的快照目錄。

SQLite 快照可能包含驗證設定檔、工作階段狀態、外掛狀態及其他敏感記錄。請使用與即時 OpenClaw 狀態目錄相同的權限、加密、保留政策與目的地限制來保護儲存庫。

### 驗證與還原

```bash
openclaw backup sqlite verify <snapshot-directory>
openclaw backup sqlite restore <snapshot-directory> --target <new-database-path>
```

驗證作業會檢查嚴格的資訊清單形式、成品大小與 SHA-256、SQLite 完整性、外部索引鍵、結構描述版本、資料庫角色與擁有者，以及 OpenClaw 擁有的索引定義。

驗證作業會驗證一份私密且內容固定的副本，因此路徑名稱競爭條件無法替換 SQLite 所檢查的位元組。依預設，該暫存副本會建立在快照儲存庫旁，並在命令返回前移除。預備根目錄及其祖先目錄鏈必須防止其他使用者替換該副本。POSIX 根目錄必須由目前使用者擁有，且群組與所有人皆不可寫入；若子目錄由使用者擁有，則可接受 `/tmp` 等具有黏著位元的祖先目錄。若 macOS ACL 授權會暴露預備區或使其可遭替換，便會遭拒絕。Windows 根目錄與祖先目錄必須由目前使用者或受信任的作業系統主體擁有，且 ACL 必須拒絕不受信任者存取預備區。對於唯讀掛載點或網路共用，請在具備同等加密與目的地控制的儲存空間上傳入 `--scratch <existing-private-directory>`。

建立快照時，也會在預備或發布資料庫位元組前，對儲存庫套用相同的擁有者、ACL、祖先目錄與路徑身分檢查。

還原作業會再次執行驗證，而且只會寫入全新的目標。它會拒絕既有目標、`-wal`、`-shm` 或 `-journal` 附屬檔案，且絕不會就地替換即時 OpenClaw 資料庫。目標父目錄須符合與驗證暫存空間相同的路徑安全需求。啟用已還原的資料庫仍須由操作人員明確地離線執行。

快照儲存庫是本機目錄。排程、上傳、保留、增量 WAL 套件、容錯移轉及開機時還原行為刻意不屬於此命令的範圍。

## 備份內容

`openclaw backup create` 會從你的本機 OpenClaw 安裝規劃來源：

- 狀態目錄（通常是 `~/.openclaw`）
- 使用中的設定檔路徑
- 解析後的 `credentials/` 目錄（當它存在於狀態目錄之外時）
- 從目前設定中探索到的工作區目錄，除非你傳入 `--no-include-workspace`

驗證設定檔與其他每個代理程式的執行階段狀態，皆存放在狀態目錄下的 SQLite 中（`agents/<agentId>/agent/openclaw-agent.sqlite`），因此狀態備份項目會自動涵蓋這些內容。

`--only-config` 會略過狀態、認證資訊目錄與工作區探索，並只封存使用中的設定檔路徑。

OpenClaw 會在建立封存檔前將路徑標準化：如果設定、認證資訊目錄或工作區已位於狀態目錄內，就不會將其重複列為個別的頂層備份來源。不存在的路徑會被略過。

建立封存檔期間，OpenClaw 會在 `tar` 讀取已知會即時變動的路徑前，先將其排除。這可避免檔案記錄大小與同時寫入之間產生競爭條件。篩選器會在每個備份的狀態目錄下套用下列相對於狀態目錄的規則：

| 相對於狀態目錄的範圍                         | 略過的檔案副檔名         |
| -------------------------------------------- | ----------------------------- |
| `sessions/**`                                | `.jsonl`、`.log`              |
| `agents/<agentId>/sessions/**`               | `.jsonl`、`.log`              |
| `cron/runs/**`                               | `.jsonl`、`.log`              |
| `logs/**`                                    | `.jsonl`、`.log`              |
| `delivery-queue/**`                          | `.json`、`.delivered`、`.tmp` |
| `session-delivery-queue/**`                  | `.json`、`.delivered`、`.tmp` |
| 備份狀態目錄下的任何路徑 | `.sock`、`.pid`、`.tmp`       |

這些規則不會篩選狀態目錄之外的工作區檔案。它們也會省略符合表格條件的已完成文字記錄與記錄檔，因此需要時請另行保留這些記錄。JSON 結果中的 `skippedVolatileCount` 會回報刻意省略的檔案數量。

狀態目錄下的 SQLite 資料庫會使用 `VACUUM INTO` 壓縮，避免已刪除頁面的殘留內容進入封存檔，且不會複製即時 WAL／SHM 檔案。如果某個由外掛擁有的資料庫需要無法取得、由擁有者定義的 SQLite 功能，作業會以封閉方式失敗，而不會退回原始頁面複製。透過工作區備份納入的 SQLite 檔案會當作工作區檔案複製，不受壓縮保證涵蓋。

狀態目錄的 `extensions/` 樹狀目錄下，已安裝外掛的原始碼與資訊清單檔案會被納入，但其巢狀的 `node_modules/` 相依性樹狀目錄會被略過，因為它們是可重新建置的安裝成品。還原封存檔後，如果已還原的外掛回報缺少相依性，請使用 `openclaw plugins update <id>`，或透過 `openclaw plugins install <spec> --force` 重新安裝。

## 無效設定行為

`openclaw backup` 會略過一般設定預檢，因此在復原期間仍可提供協助。工作區探索依賴有效的設定，因此若設定檔存在但無效，且工作區備份仍處於啟用狀態，`openclaw backup create` 會立即失敗。

若要在此情況下進行部分備份，請加上 `--no-include-workspace` 重新執行：它會繼續涵蓋狀態、設定與外部認證資訊目錄，同時完全略過工作區探索。

即使設定格式錯誤，`--only-config` 仍可運作，因為它不會為了探索工作區而剖析設定。

## 大小與效能

OpenClaw 不會強制執行內建的備份大小上限或單一檔案大小限制。實際限制取決於：

- 暫存封存檔寫入加上最終封存檔所需的可用空間
- 走訪大型工作區樹狀目錄並將其壓縮為 `.tar.gz` 所需的時間
- 使用 `--verify` 或 `openclaw backup verify` 重新掃描封存檔所需的時間
- 目的地檔案系統的行為：OpenClaw 優先使用不覆寫的硬連結發布步驟，並在不支援硬連結時退回獨佔複製

大型工作區通常是影響封存檔大小的主要因素。使用 `--no-include-workspace` 可建立較小且較快的備份，或使用 `--only-config` 建立最小的封存檔。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
