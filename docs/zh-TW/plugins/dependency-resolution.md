---
read_when:
    - 你正在偵錯外掛套件安裝問題
    - 你正在變更外掛啟動、doctor 或套件管理器安裝行為
    - 你正在維護封裝版 OpenClaw 安裝項目或隨附的外掛資訊清單
sidebarTitle: Dependencies
summary: OpenClaw 如何安裝外掛套件並解析外掛相依性
title: 外掛相依性解析
x-i18n:
    generated_at: "2026-07-11T21:33:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw 僅在安裝／更新時處理外掛相依性。執行階段載入絕不會執行套件管理器、修復相依性樹狀結構，或修改 OpenClaw 套件目錄。

## 責任劃分

外掛套件自行負責其相依性圖：

- 執行階段相依性位於外掛套件的 `dependencies` 或
  `optionalDependencies`。
- SDK／核心匯入是對等相依項目，或由 OpenClaw 提供的匯入。
- 本機開發外掛自行攜帶已安裝的相依性。
- npm 與 git 外掛會安裝至 OpenClaw 所擁有的套件根目錄。

OpenClaw 僅負責外掛生命週期：

- 探索外掛來源。
- 僅在明確要求時安裝或更新套件。
- 記錄安裝中繼資料。
- 載入外掛進入點。
- 相依性缺失時，以可採取行動的錯誤訊息讓操作失敗。

## 安裝根目錄

OpenClaw 會依來源使用穩定的根目錄：

- npm 套件會安裝到
  `~/.openclaw/npm/projects/<encoded-package>` 下各外掛獨立的專案中。
- git 套件會複製到 `~/.openclaw/git` 下。
- 本機／路徑／封存檔安裝會直接複製或參照，不會修復相依性。

npm 安裝會在該外掛的專屬專案根目錄中執行：

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` 會對本機 npm-pack 壓縮封存檔使用相同的外掛專屬 npm 專案根目錄：OpenClaw 會讀取壓縮封存檔的 npm 中繼資料、將其以複製的 `file:` 相依項目加入受管理專案、執行上述一般 npm 安裝，然後在信任該外掛前驗證已安裝的鎖定檔中繼資料。此路徑用於套件驗收與候選版本證明；在這類情境中，本機封裝產物應具有與其所模擬的登錄檔產物相同的行為。

在發布前測試官方或外部外掛套件時，請使用 `npm-pack:`。原始封存檔或路徑安裝適合本機偵錯，但無法證明其相依性路徑與已安裝的 npm 或 ClawHub 套件相同。`npm-pack:` 可證明受管理套件的安裝形式；但它本身無法證明此外掛是與目錄連結的官方內容。

當行為取決於內建外掛或受信任官方外掛狀態時，請將本機套件證明與由目錄支援的官方安裝，或會記錄官方信任狀態的已發布套件路徑搭配使用。特殊權限輔助功能的存取，以及受信任官方範圍的處理，應在該受信任的安裝路徑上驗證，不應從本機壓縮封存檔安裝推論。

如果外掛在執行階段因匯入缺失而失敗，請修正套件資訊清單，而不是手動修復受管理專案。執行階段匯入應位於外掛套件的 `dependencies` 或 `optionalDependencies`；受管理的執行階段專案不會安裝 `devDependencies`。在 `~/.openclaw/npm/projects/<encoded-package>` 內執行本機 `npm install` 可以暫時解除診斷阻礙，但不能作為套件驗收證明，因為下一次安裝或更新會依套件中繼資料重新建立專案。

npm 可能會將傳遞性相依項目提升至外掛套件旁、該外掛專屬專案的 `node_modules`。OpenClaw 會先掃描受管理專案根目錄再信任安裝，並在解除安裝時移除該專案，因此提升後的執行階段相依性仍位於該外掛的清理邊界內。

已發布的 npm 外掛套件可以包含 `npm-shrinkwrap.json`；npm 會在安裝期間使用此可發布的鎖定檔，而 OpenClaw 的受管理 npm 專案根目錄可透過一般安裝路徑支援它。由 OpenClaw 擁有且可發布的外掛套件，必須包含依該套件已發布相依性圖產生的套件本機 shrinkwrap：

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

產生器會移除外掛的 `devDependencies`、套用工作區覆寫原則，並為每個設定了 `openclaw.release.publishToNpm: true` 的外掛寫入 `extensions/<id>/npm-shrinkwrap.json`。第三方外掛套件也可以包含 shrinkwrap；OpenClaw 不要求社群套件提供，但若存在，npm 仍會採用它。

在將本機套件視為候選版本證明前，請檢查即將安裝的壓縮封存檔：

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

若有相依性變更，也請確認正式環境安裝可在沒有開發相依性的情況下解析執行階段套件：

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

由 OpenClaw 擁有的 npm 外掛套件也可透過明確的 `bundledDependencies` 發布。npm 發布路徑會疊加執行階段相依項目名稱清單、從已發布的資訊清單移除僅供開發使用的工作區中繼資料、對套件本機的執行階段相依性執行不含指令碼的 npm 安裝，然後封裝或發布包含這些相依性檔案的外掛壓縮封存檔。大量使用原生元件的套件（Codex、ACPX、Copilot、llama.cpp、memory-lancedb、Tlon）會透過 `openclaw.release.bundleRuntimeDependencies: false` 選擇退出；它們仍會包含 shrinkwrap，但會由 npm 在安裝期間解析執行階段相依性，而不是將各平台的所有二進位檔嵌入外掛壓縮封存檔。根 `openclaw` 套件不會內含其完整相依性樹狀結構。

匯入 `openclaw/plugin-sdk/*` 的外掛會將 `openclaw` 宣告為對等相依性。OpenClaw 不允許 npm 在受管理專案中安裝另一份來自登錄檔的主程式套件，因為過時的主程式套件可能會影響 npm 在該外掛內解析對等相依性的結果。受管理的 npm 安裝會略過 npm 對等相依性的解析／實體化，並在安裝或更新後，針對宣告主程式對等相依性的已安裝套件，重新確保外掛本機的 `node_modules/openclaw` 連結。

git 安裝會複製或重新整理儲存庫，然後執行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

已安裝的外掛接著會從該套件目錄載入，因此套件本機與父層的 `node_modules` 解析方式，會與一般節點套件相同。

## 本機外掛

本機外掛是由開發人員控制的目錄。OpenClaw 絕不會為其執行 `npm install`、`pnpm install` 或相依性修復；如果本機外掛有相依性，請先在該外掛中安裝，再載入外掛。

第三方 TypeScript 本機外掛會透過 Jiti 載入，作為緊急備用途徑。已封裝的 JavaScript 外掛與內建的內部外掛則會透過原生 import／require 載入。

## 啟動與重新載入

閘道啟動與設定重新載入絕不會安裝外掛相依性。它們會讀取外掛安裝記錄、計算進入點，然後載入外掛。

執行階段缺少相依性時，外掛載入會失敗，並顯示引導操作人員採取明確修正措施的錯誤：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 會清理舊版 OpenClaw 產生的相依性狀態，且在設定仍參照可下載外掛、但本機安裝記錄中缺少該外掛時，能夠復原該外掛。Doctor 不會修復已安裝本機外掛的相依性。

## 內建外掛

輕量且對核心至關重要的內建外掛會隨 OpenClaw 一併提供。它們應避免攜帶龐大的執行階段相依性樹狀結構，否則應移至 ClawHub／npm 上的可下載套件。

如需目前產生的清單，查看哪些外掛隨核心套件提供、需從外部安裝，或僅保留原始碼，請參閱[外掛清冊](/zh-TW/plugins/plugin-inventory)。

內建外掛資訊清單不得要求相依性暫存。大型或選用的外掛功能應封裝為一般外掛，並透過與第三方外掛相同的 npm／git／ClawHub 路徑安裝。

在原始碼簽出中，OpenClaw 會將儲存庫視為 pnpm 單體儲存庫。執行 `pnpm install` 後，內建外掛會從 `extensions/<id>` 載入，因此套件本機工作區相依性可供使用，且編輯內容會直接生效。原始碼簽出開發僅支援 pnpm；在儲存庫根目錄執行一般 `npm install` 不會準備內建外掛的相依性。

| 安裝形式                         | 內建外掛位置                          | 相依性負責方                                                       |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| `npm install -g openclaw`        | 套件內的已建置執行階段樹狀結構        | OpenClaw 套件及明確的外掛安裝／更新／doctor 流程                   |
| Git 簽出加上 `pnpm install`      | `extensions/<id>` 工作區套件          | pnpm 工作區，包括每個外掛套件自身的相依性                          |
| `openclaw plugins install ...`   | 受管理的 npm 專案／git／ClawHub 根目錄 | 外掛安裝／更新流程                                                  |

## 舊版清理

較舊版本的 OpenClaw 會在啟動時或 doctor 修復期間，產生內建外掛相依性根目錄。目前的 doctor 清理會透過 `--fix` 移除這些過時目錄與符號連結，包括舊的 `plugin-runtime-deps` 根目錄、指向已刪減 `plugin-runtime-deps` 目標的全域節點前綴套件符號連結、`.openclaw-runtime-deps*` 資訊清單、產生的外掛 `node_modules`、安裝暫存目錄，以及套件本機 pnpm 儲存區。已封裝的 postinstall 也會在刪減舊版目標根目錄前移除這些全域符號連結，因此升級不會留下失效的 ESM 套件匯入。

較舊的 npm 安裝也曾使用共用的 `~/.openclaw/npm/node_modules` 根目錄。目前的安裝、更新、解除安裝及 doctor 流程仍會識別該舊版平面根目錄，但僅用於復原與清理。新的 npm 安裝則會建立各外掛獨立的專案根目錄。
