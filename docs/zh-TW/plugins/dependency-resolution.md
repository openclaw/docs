---
read_when:
    - 你正在偵錯外掛套件安裝
    - 你正在變更外掛啟動、doctor 或套件管理器安裝行為
    - 你正在維護封裝的 OpenClaw 安裝或內建外掛資訊清單
sidebarTitle: Dependencies
summary: OpenClaw 如何安裝外掛套件並解析外掛相依性
title: 外掛依賴解析
x-i18n:
    generated_at: "2026-07-04T15:07:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw 會將外掛相依性工作保留在安裝/更新時執行。執行階段載入
不會執行套件管理器、修復相依性樹，或變更 OpenClaw
套件目錄。

## 職責劃分

外掛套件擁有自己的相依性圖：

- 執行階段相依性位於外掛套件的 `dependencies` 或
  `optionalDependencies`
- SDK/核心匯入是 peer，或由 OpenClaw 匯入提供
- 本機開發外掛會自帶已安裝的相依性
- npm 和 git 外掛會安裝到 OpenClaw 擁有的套件根目錄

OpenClaw 只擁有外掛生命週期：

- 探索外掛來源
- 在明確要求時安裝或更新套件
- 記錄安裝中繼資料
- 載入外掛進入點
- 相依性缺失時，以可操作的錯誤失敗

## 安裝根目錄

OpenClaw 使用穩定的逐來源根目錄：

- npm 套件會安裝到
  `~/.openclaw/npm/projects/<encoded-package>` 下的逐外掛專案
- git 套件會複製到 `~/.openclaw/git` 下
- 本機/路徑/封存檔安裝會被複製或參照，不會修復相依性

npm 安裝會在該逐外掛專案根目錄中執行：

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` 會對本機 npm-pack tarball 使用相同的逐外掛 npm
專案根目錄。OpenClaw 會讀取 tarball 的 npm
中繼資料、將它作為已複製的 `file:` 相依性加入受管理專案、執行
一般 npm install，然後在信任外掛之前驗證已安裝的 lockfile 中繼資料。
這是為了套件驗收與候選發行版證明而設計，讓
本機 pack 成品能表現得像它模擬的登錄檔成品。

在發布前測試官方或外部外掛套件時，請使用 `npm-pack:`。
原始封存檔或路徑安裝適合本機偵錯，但它
無法證明與已安裝 npm 或 ClawHub 套件相同的相依性路徑。
`npm-pack:` 證明受管理套件的安裝形態；它本身
並不證明外掛是已連結目錄的官方內容。

當行為取決於內建外掛或受信任官方外掛狀態時，請將
本機套件證明與目錄支援的官方安裝，或記錄官方信任的已發布
套件路徑配對。特權 helper 存取和
受信任官方範圍處理，應在該受信任安裝
路徑上驗證，而不是從本機 tarball 安裝推斷。

如果外掛在執行階段因缺少匯入而失敗，請修正套件 manifest，
而不是手動修復受管理專案。執行階段匯入屬於
外掛套件的 `dependencies` 或 `optionalDependencies`；`devDependencies`
不會安裝到受管理執行階段專案。在
`~/.openclaw/npm/projects/<encoded-package>` 中執行本機 `npm install`
可解除暫時診斷阻塞，但它不是套件驗收證明，因為下一次安裝或更新會
從套件中繼資料重新建立專案。

npm 可能會將傳遞相依性 hoist 到逐外掛專案的
`node_modules`，與外掛套件並列。OpenClaw 會在信任安裝前掃描受管理專案
根目錄，並在解除安裝時移除該專案，因此
hoisted 執行階段相依性會留在該外掛的清理邊界內。

已發布的 npm 外掛套件可以隨附 `npm-shrinkwrap.json`。npm 會在
安裝期間使用該可發布 lockfile，而 OpenClaw 的受管理 npm 專案根目錄
會透過一般 npm install 路徑支援它。OpenClaw 擁有的可發布
外掛套件必須包含從該
外掛套件已發布相依性圖產生的套件本機 shrinkwrap：

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

產生器會移除外掛 `devDependencies`、套用 workspace override
政策，並為每個 `publishToNpm` 外掛寫入 `extensions/<id>/npm-shrinkwrap.json`。
第三方外掛套件也可以隨附 shrinkwrap；
OpenClaw 不要求社群套件提供它，但 npm 會在存在時遵循它。

在將本機套件視為候選發行版證明之前，請檢查
將被安裝的 tarball：

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

對於相依性變更，也請驗證生產安裝可以在沒有 dev 相依性的情況下解析
執行階段套件：

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
`bundledDependencies` 發布。npm 發布路徑會覆寫執行階段相依性
名稱清單、從已發布套件
manifest 移除僅供 dev 使用的 workspace 中繼資料、為套件本機執行階段
相依性執行不含 script 的 npm install，然後打包或發布包含這些相依性
檔案的外掛 tarball。包含 Codex 和 ACP 執行階段在內的原生重度套件會使用
`openclaw.release.bundleRuntimeDependencies: false` 選擇退出；這些套件仍然
隨附 shrinkwrap，但 npm 會在安裝期間解析執行階段相依性，
而不是將每個平台二進位嵌入外掛 tarball。根
`openclaw` 套件不會 bundle 其完整相依性樹。

匯入 `openclaw/plugin-sdk/*` 的外掛會將 `openclaw` 宣告為 peer
相依性。OpenClaw 不允許 npm 將主機套件的獨立登錄檔副本安裝到
受管理專案中，因為過期的主機套件可能會影響該外掛內的 npm
peer 解析。受管理的 npm 安裝會跳過 npm peer
解析/具現化，而 OpenClaw 會在安裝或更新後，對宣告主機 peer 的已安裝套件重新確立
外掛本機 `node_modules/openclaw` 連結。

git 安裝會複製或重新整理 repository，然後執行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

已安裝的外掛接著會從該套件目錄載入，因此套件本機
與父層 `node_modules` 解析的運作方式，會與一般
節點套件相同。

## 本機外掛

本機外掛會被視為開發者控制的目錄。OpenClaw 不會
對它們執行 `npm install`、`pnpm install` 或相依性修復。如果本機
外掛有相依性，請在載入前先在該外掛中安裝。

第三方 TypeScript 本機外掛可以使用緊急 Jiti 路徑。已封裝的
JavaScript 外掛和內建內部外掛會透過原生
import/require 載入，而不是 Jiti。

## 啟動與重新載入

閘道啟動與 config 重新載入絕不會安裝外掛相依性。它們會讀取
外掛安裝記錄、計算進入點，並載入它。

如果執行階段缺少相依性，外掛會載入失敗，錯誤
應指引 operator 使用明確修正：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理舊版 OpenClaw 產生的相依性狀態，並在 config
參照可下載外掛但本機安裝記錄缺失時復原它們。
Doctor 不會修復已安裝本機外掛的相依性。

## 內建外掛

輕量且核心關鍵的內建外掛會作為 OpenClaw 的一部分出貨。
它們應該沒有沉重的執行階段相依性樹，或被移出為
ClawHub/npm 上的可下載套件。

如需目前隨核心套件出貨、外部安裝或僅保留原始碼的外掛產生清單，
請參閱 [外掛清單](/zh-TW/plugins/plugin-inventory)。

內建外掛 manifest 不得要求相依性 staging。大型或選用的
外掛功能應封裝為一般外掛，並透過與第三方外掛相同的
npm/git/ClawHub 路徑安裝。

在原始碼 checkout 中，OpenClaw 會將 repository 視為 pnpm monorepo。
`pnpm install` 後，內建外掛會從 `extensions/<id>` 載入，因此套件本機
workspace 相依性可用，且編輯會被直接採用。原始碼
checkout 開發僅支援 pnpm；在 repository 根目錄執行普通
`npm install` 並不是準備內建外掛相依性的受支援方式。

| 安裝形態                         | 內建外掛位置                          | 相依性擁有者                                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 套件內的已建置執行階段樹              | OpenClaw 套件與明確的外掛安裝/更新/doctor 流程                      |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace 套件      | pnpm workspace，包含每個外掛套件自己的相依性                         |
| `openclaw plugins install ...`   | 受管理的 npm project/git/ClawHub 根目錄 | 外掛安裝/更新流程                                                    |

## 舊版清理

較舊的 OpenClaw 版本會在啟動時或 doctor 修復期間產生內建外掛相依性
根目錄。目前的 doctor cleanup 會在使用 `--fix` 時移除那些過期目錄與
symlink，包括舊的 `plugin-runtime-deps` 根目錄、指向已修剪
`plugin-runtime-deps` 目標的全域 節點-prefix 套件 symlink、
`.openclaw-runtime-deps*` manifest、產生的外掛 `node_modules`、安裝
stage 目錄，以及套件本機 pnpm stores。已封裝的 postinstall 也會在修剪舊版目標根目錄前
移除那些全域 symlink，讓升級不會留下懸空的 ESM 套件匯入。

較舊的 npm 安裝也使用共用的 `~/.openclaw/npm/node_modules` 根目錄。
目前的安裝、更新、解除安裝和 doctor 流程仍會辨識該舊版
扁平根目錄，但僅用於復原和清理。新的 npm 安裝應改為建立
逐外掛專案根目錄。
