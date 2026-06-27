---
read_when:
    - 你需要一個用於本機 OpenClaw 狀態的一級備份封存
    - 您想在重設或解除安裝前預覽會包含哪些路徑
summary: '`openclaw backup` 的命令列介面參考（建立本機備份封存）'
title: 備份
x-i18n:
    generated_at: "2026-06-27T19:04:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ac7d8e4babd24f1c46ac48dca6c413e12361173df83cfe485dd3945ccd30c3e
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

為 OpenClaw 狀態、設定、驗證設定檔、通道/提供者憑證、工作階段，以及選擇性的工作區建立本機備份封存檔。

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## 備註

- 封存檔包含一個 `manifest.json` 檔案，其中有解析後的來源路徑與封存檔版面配置。
- 預設輸出是在目前工作目錄中、帶有時間戳記的 `.tar.gz` 封存檔。
- 帶時間戳記的備份檔名使用你機器的本機時區，並包含 UTC 偏移。
- 如果目前工作目錄位於已備份的來源樹內，OpenClaw 會改用你的家目錄作為預設封存檔位置。
- 現有的封存檔絕不會被覆寫。
- 來源狀態/工作區樹內的輸出路徑會被拒絕，以避免自我包含。
- `openclaw backup verify <archive>` 會驗證封存檔正好包含一個根清單，拒絕遍歷式封存路徑，並檢查每個清單宣告的酬載都存在於 tarball 中。
- `openclaw backup create --verify` 會在寫入封存檔後立即執行該驗證。
- `openclaw backup create --only-config` 只會備份作用中的 JSON 設定檔。

## 會備份哪些內容

`openclaw backup create` 會從你的本機 OpenClaw 安裝規劃備份來源：

- OpenClaw 本機狀態解析器傳回的狀態目錄，通常是 `~/.openclaw`
- 作用中的設定檔路徑
- 當解析出的 `credentials/` 目錄存在於狀態目錄之外時
- 從目前設定探索到的工作區目錄，除非你傳入 `--no-include-workspace`

模型驗證設定檔已經是狀態目錄的一部分，位於
`agents/<agentId>/agent/auth-profiles.json`，因此通常會由狀態備份項目涵蓋。

如果你使用 `--only-config`，OpenClaw 會略過狀態、憑證目錄與工作區探索，只封存作用中的設定檔路徑。

OpenClaw 會在建立封存檔前先將路徑正規化。如果設定、憑證目錄或工作區已經位於狀態目錄內，它們不會作為獨立的頂層備份來源重複納入。缺少的路徑會被略過。

封存檔酬載會儲存這些來源樹中的檔案內容，而內嵌的 `manifest.json` 會記錄解析後的絕對來源路徑，以及每個資產使用的封存檔版面配置。

建立封存檔期間，OpenClaw 會略過已知會即時變動且沒有還原價值的檔案，包括作用中的代理工作階段逐字稿、排程執行記錄、滾動記錄、遞送佇列、狀態目錄下的 socket/pid/暫存檔，以及相關的耐久佇列暫存檔。JSON 結果包含 `skippedVolatileCount`，讓自動化流程可以知道有多少檔案是刻意省略的。

狀態目錄 `extensions/` 樹下已安裝的外掛來源與清單檔案會被納入，但其巢狀的 `node_modules/` 相依性樹會被略過。這些相依性是可重新建置的安裝成品；還原封存檔後，當還原的外掛回報缺少相依性時，請使用 `openclaw plugins update <id>`，或以 `openclaw plugins install <spec> --force` 重新安裝外掛。

## 無效設定行為

`openclaw backup` 會刻意繞過一般設定預檢，讓它在復原期間仍可提供協助。因為工作區探索仰賴有效設定，當設定檔存在但無效且工作區備份仍啟用時，`openclaw backup create` 現在會快速失敗。

如果你在這種情況下仍想要部分備份，請重新執行：

```bash
openclaw backup create --no-include-workspace
```

這會讓狀態、設定與外部憑證目錄仍在範圍內，同時完全略過工作區探索。

如果你只需要設定檔本身的副本，`--only-config` 在設定格式錯誤時也可運作，因為它不依賴解析設定來探索工作區。

## 大小與效能

OpenClaw 不會強制執行內建的備份大小上限或單一檔案大小限制。

實際限制來自本機與目的地檔案系統：

- 暫存封存寫入加上最終封存檔所需的可用空間
- 走訪大型工作區樹並將其壓縮為 `.tar.gz` 所需的時間
- 如果你使用 `openclaw backup create --verify` 或執行 `openclaw backup verify`，重新掃描封存檔所需的時間
- 目的地路徑的檔案系統行為。OpenClaw 偏好使用不覆寫的硬連結發布步驟，當不支援硬連結時則回退為獨占複製

大型工作區通常是封存檔大小的主要因素。如果你想要更小或更快的備份，請使用 `--no-include-workspace`。

若要最小的封存檔，請使用 `--only-config`。

## 相關

- [命令列介面參考](/zh-TW/cli)
