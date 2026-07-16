---
read_when:
    - 你想了解 `openclaw.ai/install.sh`
    - 你想要自動化安裝（CI／無頭環境）
    - 你想要從 GitHub 的檢出版本安裝
summary: 安裝程式指令碼（install.sh、install-cli.sh、install.ps1）的運作方式、旗標與自動化
title: 安裝程式內部機制
x-i18n:
    generated_at: "2026-07-16T11:45:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7878f10903893b4e1902bbc79991f43edaa436bd802d5fecde41421e3e05bc2b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw 提供三個安裝程式腳本，由 `openclaw.ai` 提供。

| 腳本                             | 平台             | 功能                                                                                   |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 視需要安裝 Node，透過 npm（預設）或 git 安裝 OpenClaw，並可執行初始設定。       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | 透過 npm 或 git，將 Node 與 OpenClaw 安裝至本機前置路徑（`~/.openclaw`）。不需要 root 權限。 |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 視需要安裝 Node，透過 npm（預設）或 git 安裝 OpenClaw，並可執行初始設定。       |

三者皆支援 Node **22.22.3+、24.15+ 或 25.9+**；全新安裝預設以 Node 24 為目標版本。

## 快速命令

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
如果安裝成功，但在新的終端機中找不到 `openclaw`，請參閱 [Node.js 疑難排解](/zh-TW/install/node#troubleshooting)。
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
建議用於 macOS/Linux/WSL 上大多數的互動式安裝。
</Tip>

### 流程（install.sh）

<Steps>
  <Step title="偵測作業系統">
    支援 macOS 與 Linux（包括 WSL）。
  </Step>
  <Step title="預設確保安裝 Node.js 24">
    檢查 Node 版本，並視需要安裝 Node 24（macOS 使用 Homebrew，Linux 的 apt/dnf/yum 使用 NodeSource 設定腳本）。在 macOS 上，只有當安裝程式需要 Homebrew 來安裝 Node 或 Git 時，才會安裝 Homebrew。支援 Node 22.22.3+、Node 24.15+ 與 Node 25.9+；不支援 Node 23。
    在 Alpine/musl Linux 上，安裝程式會使用 apk 套件而非 NodeSource，並驗證實際連結的 SQLite 版本。目前穩定版 Alpine 套件來源可能會提供版本夠新的 Node，但其系統 SQLite 存在弱點；發生這種情況時，請改用官方 `node:24-alpine` 容器或採用 glibc 的主機。
  </Step>
  <Step title="確保已安裝 Git">
    若未安裝 Git，則使用偵測到的套件管理器進行安裝，包括 macOS 上的 Homebrew 與 Alpine 上的 apk。
  </Step>
  <Step title="安裝 OpenClaw">
    - `npm` 方式（預設）：使用 npm 全域安裝
    - `git` 方式：複製／更新儲存庫、使用 pnpm 安裝相依套件、建置，然後將包裝程式安裝至 `~/.local/bin/openclaw`

  </Step>
  <Step title="安裝後工作">
    - 解析剛安裝的 `openclaw` 二進位檔，以供後續命令使用
    - 若安裝尚未設定，會在 doctor 或閘道探測前開始初始設定。使用 `--no-onboard` 或沒有 TTY 時，會印出稍後完成設定所需的命令。
    - 若安裝已設定，會盡力重新整理並重新啟動已載入的閘道服務，然後執行 doctor。升級時會盡可能更新外掛；若是在無終端但啟用提示的執行環境中，則會印出手動命令。
    - 執行 `--verify` 時，會檢查已安裝的版本，並只在設定存在後檢查閘道健康狀態。

  </Step>
</Steps>

### 原始碼簽出偵測

若在 OpenClaw 簽出目錄（`package.json` + `pnpm-workspace.yaml`）內執行，腳本會提供以下選項：

- 使用簽出目錄（`git`），或
- 使用全域安裝（`npm`）

如果沒有可用的 TTY，且未設定安裝方式，則預設使用 `npm` 並顯示警告。

若選擇的安裝方式無效或 `--install-method` 值無效，腳本會以代碼 `2` 結束。

### 範例（install.sh）

<Tabs>
  <Tab title="預設">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="略過初始設定">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git 安裝">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main 簽出">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="試執行">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="安裝後驗證">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="旗標參考">

| 旗標                                    | 說明                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | 選擇安裝方式（預設：`npm`）                                  |
| `--npm`                                 | npm 方式的捷徑                                                 |
| `--git \| --github`                     | git 方式的捷徑                                                 |
| `--version <version\|dist-tag\|spec>`   | npm 版本、dist-tag 或套件規格（預設：`latest`）              |
| `--beta`                                | 若 beta dist-tag 可用則使用，否則回退至 `latest`              |
| `--git-dir \| --dir <path>`             | 簽出目錄（預設：`~/openclaw`）                              |
| `--no-git-update`                       | 對現有簽出目錄略過 `git pull`                                   |
| `--no-prompt`                           | 停用提示                                                         |
| `--no-onboard`                          | 略過初始設定                                                         |
| `--onboard`                             | 啟用初始設定                                                       |
| `--verify`                              | 執行安裝後的基本驗證（`--version`；若已載入則檢查閘道健康狀態） |
| `--dry-run`                             | 僅印出操作而不套用變更                                  |
| `--verbose`                             | 啟用偵錯輸出（`set -x`、npm notice 層級記錄）                   |
| `--help \| -h`                          | 顯示用法                                                              |

  </Accordion>

  <Accordion title="環境變數參考">

| 變數                                          | 說明                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | 安裝方式                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm 版本、dist-tag 或套件規格                             |
| `OPENCLAW_BETA=0\|1`                              | 若可用則使用 beta                                              |
| `OPENCLAW_HOME=<path>`                            | OpenClaw 狀態及預設 git／初始設定路徑的基礎目錄 |
| `OPENCLAW_GIT_DIR=<path>`                         | 簽出目錄                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | 切換 git 更新                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | 停用提示                                                    |
| `OPENCLAW_VERIFY_INSTALL=1`                       | 執行安裝後的基本驗證                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | 略過初始設定                                                    |
| `OPENCLAW_DRY_RUN=1`                              | 試執行模式                                                       |
| `OPENCLAW_VERBOSE=1`                              | 偵錯模式                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm 記錄層級（預設：`error`，隱藏 npm 棄用雜訊）      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
專為需要將所有內容置於本機前置路徑下
（預設為 `~/.openclaw`），且不依賴系統 Node 的環境設計。預設支援 npm 安裝，
也可在相同的前置路徑流程中進行 git 簽出安裝。
</Info>

### 流程（install-cli.sh）

<Steps>
  <Step title="安裝本機 Node 執行環境">
    將固定版本且受支援的 Node LTS 壓縮檔（版本內嵌於腳本中並獨立更新，預設為 `24.15.0`）下載至 `<prefix>/tools/node-v<version>`，並驗證 SHA-256。
    Linux ARMv7 使用 Node `22.22.3`，因為官方未提供 Node 24+ ARMv7 二進位檔。
    在 Node 未針對固定執行環境發布相容壓縮檔的 Alpine/musl Linux 上，會使用 `apk` 安裝 `nodejs` 與 `npm`，然後驗證 Node 和實際連結的 SQLite 程式庫。目前穩定版 Alpine 套件來源即使提供版本夠新的 Node，仍可能連結至有弱點的 SQLite；當安全檢查拒絕該套件時，請使用官方 `node:24-alpine` 容器或採用 glibc 的主機。
  </Step>
  <Step title="確保已安裝 Git">
    如果缺少 Git，會嘗試在 Linux 上透過 apt/dnf/yum/apk，或在 macOS 上透過 Homebrew 安裝。
  </Step>
  <Step title="在前置路徑下安裝 OpenClaw">
    - `npm` 方式（預設）：使用 npm 安裝至前置路徑下，然後將包裝程式寫入 `<prefix>/bin/openclaw`
    - `git` 方式：複製／更新簽出目錄（預設為 `~/openclaw`），並仍將包裝程式寫入 `<prefix>/bin/openclaw`

  </Step>
  <Step title="重新整理已載入的閘道服務">
    如果已從相同前置路徑載入閘道服務，腳本會執行
    `openclaw gateway install --force`，以啟用替換後的服務，
    接著盡力探測閘道健康狀態。
  </Step>
</Steps>

### 範例（install-cli.sh）

<Tabs>
  <Tab title="預設">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="自訂前置路徑與版本">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git 安裝">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="自動化 JSON 輸出">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="執行初始設定">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="旗標參考">

| 旗標                                    | 說明                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | 安裝前置路徑（預設：`~/.openclaw`）                                         |
| `--install-method \| --method npm\|git` | 選擇安裝方式（預設：`npm`）                                          |
| `--npm`                                 | npm 方式的捷徑                                                         |
| `--git \| --github`                     | git 方式的捷徑                                                         |
| `--git-dir \| --dir <path>`             | Git 簽出目錄（預設：`~/openclaw`）                                  |
| `--version <ver>`                       | OpenClaw 版本或 dist-tag（預設：`latest`）                                |
| `--node-version <ver>`                  | Node 版本（預設：`24.15.0`；Linux ARMv7 上為 `22.22.3`）                     |
| `--json`                                | 輸出 NDJSON 事件                                                              |
| `--onboard`                             | 安裝後執行 `openclaw onboard`                                            |
| `--no-onboard`                          | 略過初始設定（預設）                                                       |
| `--set-npm-prefix`                      | 在 Linux 上，如果目前的前置路徑不可寫入，強制將 npm 前置路徑設為 `~/.npm-global` |
| `--help \| -h`                          | 顯示用法                                                                      |

  </Accordion>

  <Accordion title="環境變數參考">

| 變數                                    | 說明                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | 安裝前置路徑                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | 安裝方式                                                     |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw 版本或 dist-tag                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node 版本                                                       |
| `OPENCLAW_HOME=<path>`                      | OpenClaw 狀態與預設 git／初始設定路徑的基礎目錄 |
| `OPENCLAW_GIT_DIR=<path>`                   | git 安裝的 Git 簽出目錄                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 切換現有簽出目錄的 git 更新                          |
| `OPENCLAW_NO_ONBOARD=1`                     | 略過初始設定                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm 日誌層級（預設：`error`）                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` 與其他 GitHub 來源規格不是 npm 安裝的有效 `--version` 目標。請改用 `--install-method git --version main`。
</Note>

---

<a id="installps1"></a>

## install.ps1

### 流程（install.ps1）

<Steps>
  <Step title="確認 PowerShell 與 Windows 環境">
    需要 PowerShell 5+。
  </Step>
  <Step title="確認預設使用 Node.js 24">
    如果缺少，會依序嘗試透過 winget、Chocolatey、Scoop 安裝。如果沒有可用的套件管理員，指令碼會將官方 Node.js 24 Windows zip 下載至 `%LOCALAPPDATA%\OpenClaw\deps\portable-node`，並將其加入目前處理程序與使用者 PATH。支援 Node 22.22.3+、Node 24.15+ 與 Node 25.9+；不支援 Node 23。
  </Step>
  <Step title="安裝 OpenClaw">
    - `npm` 方式（預設）：使用所選的 `-Tag` 進行全域 npm 安裝，並從可寫入的安裝程式暫存目錄啟動，因此即使是在 `C:\` 等受保護資料夾中開啟的 shell 也能運作
    - `git` 方式：複製／更新儲存庫、使用 pnpm 安裝／建置，並在 `%USERPROFILE%\.local\bin\openclaw.cmd` 安裝包裝程式。如果缺少 Git，指令碼會在 `%LOCALAPPDATA%\OpenClaw\deps\portable-git` 下啟動使用者本機 MinGit，並將其加入目前處理程序與使用者 PATH。

  </Step>
  <Step title="安裝後工作">
    - 在可行時將所需的 bin 目錄加入使用者 PATH
    - 以盡力而為的方式重新整理已載入的閘道服務（先執行 `openclaw gateway install --force`，再重新啟動）
    - 在升級與 git 安裝時執行 `openclaw doctor --non-interactive`（盡力而為）

  </Step>
  <Step title="處理失敗">
    `iwr ... | iex` 與指令碼區塊安裝會回報終止錯誤，但不會關閉目前的 PowerShell 工作階段。直接使用 `powershell -File`／`pwsh -File` 安裝時，仍會以非零狀態結束，以供自動化使用。
  </Step>
</Steps>

### 範例（install.ps1）

<Tabs>
  <Tab title="預設">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git 安裝">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main 簽出">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="自訂 git 目錄">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="試執行">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="旗標參考">

| 旗標                        | 說明                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | 安裝方式（預設：`npm`）                            |
| `-Tag <tag\|version\|spec>` | npm dist-tag、版本或套件規格（預設：`latest`） |
| `-GitDir <path>`            | 簽出目錄（預設：`%USERPROFILE%\openclaw`）     |
| `-NoOnboard`                | 略過初始設定                                            |
| `-NoGitUpdate`              | 略過 `git pull`                                            |
| `-DryRun`                   | 僅列印動作                                         |

  </Accordion>

  <Accordion title="環境變數參考">

| 變數                           | 說明        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | 安裝方式     |
| `OPENCLAW_GIT_DIR=<path>`          | 簽出目錄 |
| `OPENCLAW_NO_ONBOARD=1`            | 略過初始設定    |
| `OPENCLAW_GIT_UPDATE=0`            | 停用 git pull   |
| `OPENCLAW_DRY_RUN=1`               | 試執行模式       |

  </Accordion>
</AccordionGroup>

<Note>
如果使用 `-InstallMethod git` 且缺少 Git，指令碼會先嘗試啟動使用者本機 MinGit，再顯示 Git for Windows 連結。
</Note>

---

## CI 與自動化

使用非互動式旗標／環境變數，以確保執行結果可預測。

<Tabs>
  <Tab title="install.sh（非互動式 npm）">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh（非互動式 git）">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh（JSON）">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1（略過初始設定）">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## 疑難排解

<AccordionGroup>
  <Accordion title="為什麼需要 Git？">
    `git` 安裝方式需要 Git。對於 `npm` 安裝，仍會檢查／安裝 Git，以避免相依套件使用 git URL 時發生 `spawn git ENOENT` 失敗。
  </Accordion>

  <Accordion title="為什麼 npm 在 Linux 上會遇到 EACCES？">
    某些 Linux 設定會將 npm 的全域前置路徑指向 root 擁有的路徑。`install.sh` 可以將前置路徑切換至 `~/.npm-global`，並將 PATH 匯出內容附加至 shell rc 檔案（如果這些檔案存在）。
  </Accordion>

  <Accordion title='Windows："npm error spawn git / ENOENT"'>
    重新執行安裝程式，讓它啟動使用者本機 MinGit，或安裝 Git for Windows，然後重新開啟 PowerShell。
  </Accordion>

  <Accordion title='Windows："openclaw is not recognized"'>
    執行 `npm config get prefix`，並將該目錄加入你的使用者 PATH（Windows 上不需要 `\bin` 後綴），然後重新開啟 PowerShell。
  </Accordion>

  <Accordion title="Windows：如何取得詳細的安裝程式輸出">
    `install.ps1` 不提供 `-Verbose` 開關。
    使用 PowerShell 追蹤來進行指令碼層級的診斷：

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="安裝後找不到 openclaw">
    通常是 PATH 問題。請參閱 [Node.js 疑難排解](/zh-TW/install/node#troubleshooting)。
  </Accordion>
</AccordionGroup>

## 相關內容

- [安裝概覽](/zh-TW/install)
- [更新](/zh-TW/install/updating)
- [解除安裝](/zh-TW/install/uninstall)
