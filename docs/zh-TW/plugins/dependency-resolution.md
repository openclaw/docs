---
read_when:
    - 你正在偵錯外掛套件安裝
    - 你正在變更外掛啟動、doctor 或套件管理器安裝行為
    - 你正在維護打包的 OpenClaw 安裝或內建外掛資訊清單
sidebarTitle: Dependencies
summary: OpenClaw 如何安裝外掛套件並解析外掛依賴項
title: 外掛相依性解析
x-i18n:
    generated_at: "2026-07-05T11:30:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw 只會在安裝／更新時處理外掛相依性。執行階段載入絕不會執行套件管理器、修復相依性樹，或變更 OpenClaw 套件目錄。

## 職責劃分

外掛套件擁有自己的相依性圖：

- 執行階段相依性位於外掛套件的 `dependencies` 或
  `optionalDependencies`。
- SDK／核心匯入是 peer，或是由 OpenClaw 提供的匯入。
- 本機開發外掛會自備已安裝的相依性。
- npm 和 git 外掛會安裝到 OpenClaw 擁有的套件根目錄。

OpenClaw 只擁有外掛生命週期：

- 探索外掛來源。
- 在明確要求時安裝或更新套件。
- 記錄安裝中繼資料。
- 載入外掛進入點。
- 在缺少相依性時，以可操作的錯誤失敗。

## 安裝根目錄

OpenClaw 使用穩定的每來源根目錄：

- npm 套件會安裝到
  `~/.openclaw/npm/projects/<encoded-package>` 下的每外掛專案。
- git 套件會複製到 `~/.openclaw/git` 下。
- 本機／路徑／封存檔安裝會被複製或參照，而不會修復相依性。

npm 安裝會在該每外掛專案根目錄中執行：

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` 會對本機 npm-pack tarball 使用相同的每外掛 npm
專案根目錄：OpenClaw 會讀取 tarball 的 npm
中繼資料、將它作為複製的 `file:` 相依性加入受管理專案、執行上述一般 npm 安裝，然後在信任外掛之前驗證已安裝 lockfile 的中繼資料。此路徑用於套件驗收與候選發行版本證明，其中本機 pack 成品應該表現得像它所模擬的登錄檔成品。

在發布前測試官方或外部外掛套件時，請使用 `npm-pack:`。原始封存檔或路徑安裝對本機偵錯很有用，但無法證明與已安裝 npm 或 ClawHub
套件相同的相依性路徑。`npm-pack:` 證明受管理套件的安裝形態；它本身並不證明該外掛是已連結目錄的官方內容。

當行為取決於內建外掛或受信任官方外掛狀態時，請將本機套件證明與目錄支援的官方安裝，或記錄官方信任的已發布套件路徑搭配使用。特權輔助程式存取與受信任官方範圍處理，應在該受信任安裝路徑上驗證，而不是從本機 tarball 安裝推斷。

如果外掛在執行階段因缺少匯入而失敗，請修正套件 manifest，而不是手動修復受管理專案。執行階段匯入屬於外掛套件的 `dependencies` 或 `optionalDependencies`；受管理執行階段專案不會安裝 `devDependencies`。在
`~/.openclaw/npm/projects/<encoded-package>` 內執行本機 `npm install` 可以暫時解除診斷阻塞，但這不是套件驗收證明，因為下一次安裝或更新會從套件中繼資料重新建立專案。

npm 可能會將遞移相依性提升到每外掛專案中、外掛套件旁邊的
`node_modules`。OpenClaw 會在信任安裝前掃描受管理專案根目錄，並在解除安裝時移除該專案，因此被提升的執行階段相依性會留在該外掛的清理邊界內。

已發布的 npm 外掛套件可以附帶 `npm-shrinkwrap.json`；npm 會在安裝期間使用該可發布 lockfile，而 OpenClaw 的受管理 npm 專案根目錄會透過一般安裝路徑支援它。OpenClaw 擁有的可發布外掛套件，必須包含從該套件已發布相依性圖產生的套件本機 shrinkwrap：

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

產生器會移除外掛 `devDependencies`、套用 workspace override
政策，並為每個具有 `openclaw.release.publishToNpm: true` 的外掛寫入
`extensions/<id>/npm-shrinkwrap.json`。第三方外掛套件也可以附帶 shrinkwrap；OpenClaw 不要求社群套件必須提供，但 npm 會在存在時遵循它。

在將本機套件視為候選發行版本證明之前，請檢查將被安裝的 tarball：

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

對於相依性變更，也請驗證 production 安裝能在沒有 dev dependencies 的情況下解析執行階段套件：

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

OpenClaw 擁有的 npm 外掛套件也可以使用明確的
`bundledDependencies` 發布。npm 發布路徑會覆寫執行階段相依性名稱清單、從已發布 manifest 移除僅供開發的 workspace 中繼資料、針對套件本機執行階段相依性執行不含 script 的 npm 安裝，然後在包含這些相依性檔案的情況下打包或發布外掛 tarball。大量使用原生元件的套件（Codex、ACPX、Copilot、llama.cpp、
memory-lancedb、Tlon）會以
`openclaw.release.bundleRuntimeDependencies: false` 退出；它們仍會附帶 shrinkwrap，但 npm 會在安裝期間解析執行階段相依性，而不是將每個平台二進位檔嵌入外掛 tarball。根 `openclaw`
套件不會 bundle 其完整相依性樹。

匯入 `openclaw/plugin-sdk/*` 的外掛會將 `openclaw` 宣告為 peer
dependency。OpenClaw 不允許 npm 將主機套件的另一份 registry 副本安裝到受管理專案中，因為過期的主機套件可能會影響該外掛內的 npm peer 解析。受管理的 npm 安裝會略過 npm peer 解析／具體化，而 OpenClaw 會在安裝或更新後，針對宣告主機 peer 的已安裝套件重新確認外掛本機的
`node_modules/openclaw` 連結。

git 安裝會複製或重新整理 repository，然後執行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

已安裝的外掛接著會從該套件目錄載入，因此套件本機與父層
`node_modules` 解析的運作方式，會與一般 Node 套件相同。

## 本機外掛

本機外掛是由開發者控制的目錄。OpenClaw 絕不會對它們執行
`npm install`、`pnpm install` 或相依性修復；如果本機外掛有相依性，請在載入前於該外掛中安裝它們。

第三方 TypeScript 本機外掛會透過 Jiti 作為緊急路徑載入。已封裝的 JavaScript 外掛與內建內部外掛，則透過原生 import/require 載入。

## 啟動與重新載入

閘道啟動與設定重新載入絕不會安裝外掛相依性。它們會讀取外掛安裝記錄、計算進入點，並載入它。

執行階段缺少相依性時，外掛載入會失敗，並顯示一個將操作員指向明確修正方式的錯誤：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 會清理舊版 OpenClaw 產生的相依性狀態，並且在設定仍參照可下載外掛、但本機安裝記錄缺少它們時復原那些外掛。Doctor 不會為已安裝的本機外掛修復相依性。

## 內建外掛

輕量且核心關鍵的內建外掛會作為 OpenClaw 的一部分出貨。它們應該不要攜帶大型執行階段相依性樹，或移出到 ClawHub/npm 上的可下載套件。

如需目前會隨核心套件出貨、外部安裝，或維持僅原始碼狀態的外掛產生清單，請參閱
[外掛庫存](/zh-TW/plugins/plugin-inventory)。

內建外掛 manifest 不得要求相依性 staging。大型或選用的外掛功能應封裝為一般外掛，並透過與第三方外掛相同的 npm/git/ClawHub 路徑安裝。

在原始碼 checkout 中，OpenClaw 會將 repository 視為 pnpm monorepo。在
`pnpm install` 之後，內建外掛會從 `extensions/<id>` 載入，因此套件本機 workspace 相依性可用，且編輯會被直接採用。原始碼 checkout 開發僅支援 pnpm；在 repository 根目錄執行一般 `npm install` 不會準備內建外掛相依性。

| 安裝形態                         | 內建外掛位置                          | 相依性擁有者                                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 套件內的已建置執行階段樹              | OpenClaw 套件與明確的外掛安裝／更新／doctor 流程                    |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace packages  | pnpm workspace，包含每個外掛套件自己的相依性                         |
| `openclaw plugins install ...`   | 受管理 npm 專案／git／ClawHub 根目錄  | 外掛安裝／更新流程                                                   |

## 舊版清理

舊版 OpenClaw 會在啟動時或 doctor 修復期間產生內建外掛相依性根目錄。目前的 doctor cleanup 會透過 `--fix` 移除那些過時目錄與 symlink，包括舊的 `plugin-runtime-deps`
根目錄、指向已修剪 `plugin-runtime-deps` 目標的全域 Node-prefix 套件 symlink、`.openclaw-runtime-deps*` manifest、產生的外掛
`node_modules`、安裝 stage 目錄，以及套件本機 pnpm store。封裝後的 postinstall 也會在修剪舊版目標根目錄前移除那些全域 symlink，因此升級不會留下懸空的 ESM 套件匯入。

較舊的 npm 安裝也使用共享的 `~/.openclaw/npm/node_modules` 根目錄。目前的安裝、更新、解除安裝與 doctor 流程仍會辨識該舊版 flat root，但僅用於復原與清理。新的 npm 安裝會改為建立每外掛專案根目錄。
