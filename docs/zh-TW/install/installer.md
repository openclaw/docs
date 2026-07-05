---
read_when:
    - 您想了解 `openclaw.ai/install.sh`
    - 你想要自動化安裝（CI / 無頭環境）
    - 你想從 GitHub checkout 安裝
summary: 安裝程式指令碼的運作方式（install.sh、install-cli.sh、install.ps1）、旗標與自動化
title: 安裝程式內部機制
x-i18n:
    generated_at: "2026-07-05T11:26:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09ae87aa8be98fdbeb0e215702ee3d10b19cc304b6a81bd939afd5858d5bb470
    source_path: install/installer.md
    workflow: 16
---

OpenClaw 提供三個安裝程式指令碼，從 `openclaw.ai` 提供。

| 指令碼                             | 平台                 | 功能                                                                                           |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 視需要安裝 Node，透過 npm（預設）或 git 安裝 OpenClaw，可執行初始設定。                       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | 透過 npm 或 git 將 Node + OpenClaw 安裝到本機前綴 (`~/.openclaw`)。不需要 root 權限。          |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 視需要安裝 Node，透過 npm（預設）或 git 安裝 OpenClaw，可執行初始設定。                       |

三者都支援 Node **22.19+、23.11+ 或 24+**；Node 24 是全新安裝的預設目標。

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
如果安裝成功但在新的終端機中找不到 `openclaw`，請參閱 [Node.js 疑難排解](/zh-TW/install/node#troubleshooting)。
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
建議用於大多數 macOS/Linux/WSL 的互動式安裝。
</Tip>

### 流程 (install.sh)

<Steps>
  <Step title="偵測作業系統">
    支援 macOS 和 Linux（包含 WSL）。
  </Step>
  <Step title="預設確保 Node.js 24">
    檢查 Node 版本，並在需要時安裝 Node 24（macOS 使用 Homebrew，Linux apt/dnf/yum 使用 NodeSource 設定指令碼）。在 macOS 上，只有當安裝程式需要 Homebrew 來安裝 Node 或 Git 時才會安裝 Homebrew。Node 22.19+ 和 23.11+ 仍會為了相容性而受支援。
    在 Alpine/musl Linux 上，安裝程式會使用 apk 套件而不是 NodeSource；已設定的 Alpine 軟體庫必須提供受支援的 Node 版本（撰寫本文時為 Alpine 3.21 或更新版本）。
  </Step>
  <Step title="確保 Git">
    如果缺少 Git，會使用偵測到的套件管理器安裝，包含 macOS 上的 Homebrew 和 Alpine 上的 apk。
  </Step>
  <Step title="安裝 OpenClaw">
    - `npm` 方法（預設）：全域 npm 安裝
    - `git` 方法：clone/update repo，使用 pnpm 安裝相依套件、建置，然後將包裝器安裝到 `~/.local/bin/openclaw`

  </Step>
  <Step title="安裝後工作">
    - 盡力重新整理已載入的閘道服務（`openclaw gateway install --force`，然後重新啟動）
    - 在升級和 git 安裝時執行 `openclaw doctor --non-interactive`（盡力執行）
    - 在適當時嘗試初始設定（TTY 可用、未停用初始設定，且 bootstrap/config 檢查通過）
    - 設定 `--verify` 時執行安裝後煙霧驗證

  </Step>
</Steps>

### 原始碼 checkout 偵測

如果在 OpenClaw checkout（`package.json` + `pnpm-workspace.yaml`）內執行，指令碼會提供：

- 使用 checkout (`git`)，或
- 使用全域安裝 (`npm`)

如果沒有可用的 TTY 且未設定安裝方法，預設會使用 `npm` 並發出警告。

對於無效的方法選擇或無效的 `--install-method` 值，指令碼會以代碼 `2` 結束。

### 範例 (install.sh)

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
  <Tab title="GitHub main checkout">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Dry run">
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

| 旗標                                    | 說明                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | 選擇安裝方法（預設：`npm`）                                             |
| `--npm`                                 | npm 方法的捷徑                                                          |
| `--git \| --github`                     | git 方法的捷徑                                                          |
| `--version <version\|dist-tag\|spec>`   | npm 版本、dist-tag 或套件規格（預設：`latest`）                         |
| `--beta`                                | 如果可用則使用 beta dist-tag，否則退回 `latest`                         |
| `--git-dir \| --dir <path>`             | Checkout 目錄（預設：`~/openclaw`）                                     |
| `--no-git-update`                       | 對現有 checkout 略過 `git pull`                                         |
| `--no-prompt`                           | 停用提示                                                                |
| `--no-onboard`                          | 略過初始設定                                                            |
| `--onboard`                             | 啟用初始設定                                                            |
| `--verify`                              | 執行安裝後煙霧驗證（`--version`，若已載入則檢查閘道健康狀態）           |
| `--dry-run`                             | 列印動作但不套用變更                                                    |
| `--verbose`                             | 啟用除錯輸出（`set -x`、npm notice-level logs）                         |
| `--help \| -h`                          | 顯示用法                                                                |

  </Accordion>

  <Accordion title="環境變數參考">

| 變數                                              | 說明                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | 安裝方法                                                           |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm 版本、dist-tag 或套件規格                                      |
| `OPENCLAW_BETA=0\|1`                              | 如果可用則使用 beta                                                |
| `OPENCLAW_HOME=<path>`                            | OpenClaw 狀態和預設 git/初始設定路徑的基底目錄                    |
| `OPENCLAW_GIT_DIR=<path>`                         | Checkout 目錄                                                      |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | 切換 git 更新                                                      |
| `OPENCLAW_NO_PROMPT=1`                            | 停用提示                                                           |
| `OPENCLAW_VERIFY_INSTALL=1`                       | 執行安裝後煙霧驗證                                                 |
| `OPENCLAW_NO_ONBOARD=1`                           | 略過初始設定                                                       |
| `OPENCLAW_DRY_RUN=1`                              | Dry run 模式                                                       |
| `OPENCLAW_VERBOSE=1`                              | 除錯模式                                                           |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm log level（預設：`error`，隱藏 npm deprecation noise）         |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
設計用於你希望所有內容都位於本機前綴
（預設 `~/.openclaw`）且不依賴系統 Node 的環境。預設支援 npm 安裝，
也支援在相同前綴流程下的 git-checkout 安裝。
</Info>

### 流程 (install-cli.sh)

<Steps>
  <Step title="安裝本機 Node 執行階段">
    下載固定的受支援 Node LTS tarball（版本內嵌於指令碼中並獨立更新，預設 `22.22.0`）到 `<prefix>/tools/node-v<version>`，並驗證 SHA-256。
    在 Alpine/musl Linux 上，由於 Node 不會為固定執行階段發布相容的 tarball，因此會使用 `apk` 安裝 `nodejs` 和 `npm`，並將該執行階段連結到前綴包裝器路徑。Alpine 軟體庫必須提供受支援的 Node 版本（22.19+、23.11+ 或 24+）；如果較舊的軟體庫只提供 Node 20 或 21，請使用 Alpine 3.21 或更新版本。
  </Step>
  <Step title="確保 Git">
    如果缺少 Git，會嘗試透過 Linux 上的 apt/dnf/yum/apk 或 macOS 上的 Homebrew 安裝。
  </Step>
  <Step title="在前綴下安裝 OpenClaw">
    - `npm` 方法（預設）：使用 npm 安裝到前綴下，然後將包裝器寫入 `<prefix>/bin/openclaw`
    - `git` 方法：clone/update checkout（預設 `~/openclaw`），並仍將包裝器寫入 `<prefix>/bin/openclaw`

  </Step>
  <Step title="重新整理已載入的閘道服務">
    如果閘道服務已從相同前綴載入，指令碼會執行
    `openclaw gateway install --force`，然後執行 `openclaw gateway restart`，並
    盡力探測閘道健康狀態。
  </Step>
</Steps>

### 範例 (install-cli.sh)

<Tabs>
  <Tab title="預設">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="自訂前綴 + 版本">
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
| `--prefix <path>`                       | 安裝前綴（預設：`~/.openclaw`）                                         |
| `--install-method \| --method npm\|git` | 選擇安裝方法（預設：`npm`）                                          |
| `--npm`                                 | npm 方法的捷徑                                                         |
| `--git \| --github`                     | git 方法的捷徑                                                         |
| `--git-dir \| --dir <path>`             | Git 簽出目錄（預設：`~/openclaw`）                                  |
| `--version <ver>`                       | OpenClaw 版本或 dist-tag（預設：`latest`）                                |
| `--node-version <ver>`                  | 節點版本（預設：`22.22.0`）                                               |
| `--json`                                | 輸出 NDJSON 事件                                                              |
| `--onboard`                             | 安裝後執行 `openclaw onboard`                                            |
| `--no-onboard`                          | 略過入門設定（預設）                                                       |
| `--set-npm-prefix`                      | 在 Linux 上，如果目前前綴無法寫入，強制將 npm 前綴設為 `~/.npm-global` |
| `--help \| -h`                          | 顯示用法                                                                      |

  </Accordion>

  <Accordion title="環境變數參考">

| 變數                                    | 說明                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | 安裝前綴                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | 安裝方法                                                     |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw 版本或 dist-tag                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | 節點版本                                                       |
| `OPENCLAW_HOME=<path>`                      | OpenClaw 狀態與預設 git/入門設定路徑的基礎目錄 |
| `OPENCLAW_GIT_DIR=<path>`                   | git 安裝的 Git 簽出目錄                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 切換現有簽出的 git 更新                          |
| `OPENCLAW_NO_ONBOARD=1`                     | 略過入門設定                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm 記錄等級（預設：`error`）                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` 和其他 GitHub 原始碼規格不是 npm 安裝的有效 `--version` 目標。請改用 `--install-method git --version main`。
</Note>

---

<a id="installps1"></a>

## install.ps1

### 流程 (install.ps1)

<Steps>
  <Step title="確保 PowerShell + Windows 環境">
    需要 PowerShell 5+。
  </Step>
  <Step title="預設確保 Node.js 24">
    如果缺少，會嘗試透過 winget 安裝，接著是 Chocolatey，再來是 Scoop。如果沒有可用的套件管理器，指令碼會將官方 Node.js 24 Windows zip 下載到 `%LOCALAPPDATA%\OpenClaw\deps\portable-node`，並將它加入目前程序和使用者 PATH。為了相容性，仍支援節點 22.19+ 和 23.11+。
  </Step>
  <Step title="安裝 OpenClaw">
    - `npm` 方法（預設）：使用所選的 `-Tag` 進行全域 npm 安裝，並從可寫入的安裝程式暫存目錄啟動，因此在受保護資料夾（例如 `C:\`）中開啟的 shell 仍可運作
    - `git` 方法：clone/更新 repo、使用 pnpm 安裝/建置，並在 `%USERPROFILE%\.local\bin\openclaw.cmd` 安裝包裝器。如果缺少 Git，指令碼會在 `%LOCALAPPDATA%\OpenClaw\deps\portable-git` 下啟動使用者本機的 MinGit，並將它加入目前程序和使用者 PATH。

  </Step>
  <Step title="安裝後工作">
    - 盡可能將所需的 bin 目錄加入使用者 PATH
    - 以最佳努力重新整理已載入的閘道服務（`openclaw gateway install --force`，然後重新啟動）
    - 在升級和 git 安裝時執行 `openclaw doctor --non-interactive`（最佳努力）

  </Step>
  <Step title="處理失敗">
    `iwr ... | iex` 和 scriptblock 安裝會回報終止錯誤，但不會關閉目前的 PowerShell 工作階段。直接使用 `powershell -File` / `pwsh -File` 的安裝仍會為自動化流程以非零狀態結束。
  </Step>
</Steps>

### 範例 (install.ps1)

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
  <Tab title="試跑">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="旗標參考">

| 旗標                        | 說明                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | 安裝方法（預設：`npm`）                            |
| `-Tag <tag\|version\|spec>` | npm dist-tag、版本或套件規格（預設：`latest`） |
| `-GitDir <path>`            | 簽出目錄（預設：`%USERPROFILE%\openclaw`）     |
| `-NoOnboard`                | 略過入門設定                                            |
| `-NoGitUpdate`              | 略過 `git pull`                                            |
| `-DryRun`                   | 僅列印動作                                         |

  </Accordion>

  <Accordion title="環境變數參考">

| 變數                           | 說明        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | 安裝方法     |
| `OPENCLAW_GIT_DIR=<path>`          | 簽出目錄 |
| `OPENCLAW_NO_ONBOARD=1`            | 略過入門設定    |
| `OPENCLAW_GIT_UPDATE=0`            | 停用 git pull   |
| `OPENCLAW_DRY_RUN=1`               | 試跑模式       |

  </Accordion>
</AccordionGroup>

<Note>
如果使用 `-InstallMethod git` 且缺少 Git，指令碼會先嘗試啟動使用者本機的 MinGit，然後才列印 Git for Windows 連結。
</Note>

---

## CI 和自動化

使用非互動式旗標/環境變數，讓執行結果可預測。

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
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1（略過入門設定）">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## 疑難排解

<AccordionGroup>
  <Accordion title="為什麼需要 Git？">
    `git` 安裝方法需要 Git。對於 `npm` 安裝，仍會檢查/安裝 Git，以避免相依項使用 git URL 時發生 `spawn git ENOENT` 失敗。
  </Accordion>

  <Accordion title="為什麼 npm 在 Linux 上遇到 EACCES？">
    某些 Linux 設定會將 npm 的全域前綴指向 root 擁有的路徑。`install.sh` 可以將前綴切換為 `~/.npm-global`，並將 PATH export 附加到 shell rc 檔案（當這些檔案存在時）。
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    重新執行安裝程式，讓它啟動使用者本機的 MinGit，或安裝 Git for Windows 並重新開啟 PowerShell。
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    執行 `npm config get prefix`，並將該目錄加入你的使用者 PATH（在 Windows 上不需要 `\bin` 後綴），然後重新開啟 PowerShell。
  </Accordion>

  <Accordion title="Windows：如何取得詳細的安裝程式輸出">
    `install.ps1` 不公開 `-Verbose` 開關。
    使用 PowerShell 追蹤進行指令碼層級診斷：

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

## 相關

- [安裝概覽](/zh-TW/install)
- [更新](/zh-TW/install/updating)
- [解除安裝](/zh-TW/install/uninstall)
