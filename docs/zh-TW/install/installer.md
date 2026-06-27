---
read_when:
    - 你想了解 `openclaw.ai/install.sh`
    - 你想要自動化安裝（CI / 無頭環境）
    - 你想要從 GitHub checkout 安裝
summary: 安裝程式指令碼的運作方式（install.sh、install-cli.sh、install.ps1）、旗標與自動化
title: 安裝程式內部原理
x-i18n:
    generated_at: "2026-06-27T19:27:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

OpenClaw 隨附三個安裝程式指令碼，由 `openclaw.ai` 提供。

| 指令碼                             | 平台                 | 功能                                                                                                           |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 視需要安裝 Node，透過 npm（預設）或 git 安裝 OpenClaw，並可執行初始設定。                   |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | 使用 npm 或 git checkout 模式，將 Node + OpenClaw 安裝到本機前置目錄（`~/.openclaw`）。不需要 root 權限。 |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 視需要安裝 Node，透過 npm（預設）或 git 安裝 OpenClaw，並可執行初始設定。                   |

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
建議大多數在 macOS/Linux/WSL 上的互動式安裝使用。
</Tip>

### 流程（install.sh）

<Steps>
  <Step title="Detect OS">
    支援 macOS 和 Linux（包含 WSL）。
  </Step>
  <Step title="Ensure Node.js 24 by default">
    檢查 Node 版本，並在需要時安裝 Node 24（macOS 上使用 Homebrew，Linux apt/dnf/yum 上使用 NodeSource 設定指令碼）。在 macOS 上，只有當安裝程式需要 Homebrew 來安裝 Node 或 Git 時，才會安裝 Homebrew。為了相容性，OpenClaw 仍支援 Node 22 LTS，目前為 `22.19+`。
    在 Alpine/musl Linux 上，安裝程式會使用 apk 套件而非 NodeSource；設定的 Alpine 儲存庫必須提供 Node `22.19+`（撰寫本文時為 Alpine 3.21 或更新版本）。
  </Step>
  <Step title="Ensure Git">
    如果缺少 Git，會使用偵測到的套件管理器安裝，包含 macOS 上的 Homebrew 和 Alpine 上的 apk。
  </Step>
  <Step title="Install OpenClaw">
    - `npm` 方法（預設）：全域 npm 安裝
    - `git` 方法：clone/update repo、使用 pnpm 安裝相依套件、建置，然後在 `~/.local/bin/openclaw` 安裝 wrapper

  </Step>
  <Step title="Post-install tasks">
    - 盡力重新整理已載入的閘道服務（`openclaw gateway install --force`，然後重新啟動）
    - 在升級和 git 安裝時執行 `openclaw doctor --non-interactive`（盡力執行）
    - 在適當時嘗試初始設定（TTY 可用、初始設定未停用，且 bootstrap/config 檢查通過）

  </Step>
</Steps>

### 原始碼 checkout 偵測

如果在 OpenClaw checkout（`package.json` + `pnpm-workspace.yaml`）內執行，指令碼會提供：

- 使用 checkout（`git`），或
- 使用全域安裝（`npm`）

如果沒有可用的 TTY，且未設定安裝方法，預設會使用 `npm` 並顯示警告。

若方法選擇無效或 `--install-method` 值無效，指令碼會以代碼 `2` 結束。

### 範例（install.sh）

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Skip onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git install">
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
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| 旗標                                  | 說明                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | 選擇安裝方法（預設：`npm`）。別名：`--method`  |
| `--npm`                               | npm 方法的捷徑                                    |
| `--git`                               | git 方法的捷徑。別名：`--github`                 |
| `--version <version\|dist-tag\|spec>` | npm 版本、dist-tag，或套件 spec（預設：`latest`） |
| `--beta`                              | 如果可用則使用 beta dist-tag，否則 fallback 到 `latest`  |
| `--git-dir <path>`                    | Checkout 目錄（預設：`~/openclaw`）。別名：`--dir` |
| `--no-git-update`                     | 對既有 checkout 略過 `git pull`                      |
| `--no-prompt`                         | 停用提示                                            |
| `--no-onboard`                        | 略過初始設定                                            |
| `--onboard`                           | 啟用初始設定                                          |
| `--dry-run`                           | 列印動作但不套用變更                     |
| `--verbose`                           | 啟用偵錯輸出（`set -x`、npm notice-level logs）      |
| `--help`                              | 顯示用法（`-h`）                                          |

  </Accordion>

  <Accordion title="Environment variables reference">

| 變數                                          | 說明                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | 安裝方法                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm 版本、dist-tag，或套件 spec                             |
| `OPENCLAW_BETA=0\|1`                              | 如果可用則使用 beta                                              |
| `OPENCLAW_HOME=<path>`                            | OpenClaw 狀態與預設 git/初始設定路徑的基底目錄 |
| `OPENCLAW_GIT_DIR=<path>`                         | Checkout 目錄                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | 切換 git 更新                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | 停用提示                                                    |
| `OPENCLAW_NO_ONBOARD=1`                           | 略過初始設定                                                    |
| `OPENCLAW_DRY_RUN=1`                              | Dry run 模式                                                       |
| `OPENCLAW_VERBOSE=1`                              | 偵錯模式                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm 記錄層級                                                      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
專為想將所有內容放在本機前置目錄
（預設 `~/.openclaw`）且不依賴系統 Node 的環境設計。預設支援 npm 安裝，
並支援同一前置目錄流程下的 git-checkout 安裝。
</Info>

### 流程（install-cli.sh）

<Steps>
  <Step title="Install local Node runtime">
    下載釘選的受支援 Node LTS tarball（版本嵌入在指令碼中並獨立更新）到 `<prefix>/tools/node-v<version>`，並驗證 SHA-256。
    在 Alpine/musl Linux 上，由於 Node 不發布與釘選 runtime 相容的 tarball，會使用 `apk` 安裝 `nodejs` 和 `npm`，並將該 runtime 連結到前置目錄 wrapper 路徑。Alpine 儲存庫必須提供 Node `22.19+`；如果較舊的儲存庫只提供 Node 20 或 21，請使用 Alpine 3.21 或更新版本。
  </Step>
  <Step title="Ensure Git">
    如果缺少 Git，會嘗試在 Linux 上透過 apt/dnf/yum/apk 安裝，或在 macOS 上透過 Homebrew 安裝。
  </Step>
  <Step title="Install OpenClaw under prefix">
    - `npm` 方法（預設）：使用 npm 安裝到前置目錄下，然後將 wrapper 寫入 `<prefix>/bin/openclaw`
    - `git` 方法：clones/updates checkout（預設 `~/openclaw`），並且仍將 wrapper 寫入 `<prefix>/bin/openclaw`

  </Step>
  <Step title="Refresh loaded gateway service">
    如果同一前置目錄中已載入閘道服務，指令碼會執行
    `openclaw gateway install --force`，接著執行 `openclaw gateway restart`，並
    盡力探測閘道健康狀態。
  </Step>
</Steps>

### 範例（install-cli.sh）

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Custom prefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Automation JSON output">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Run onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| 旗標                        | 說明                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | 安裝前綴（預設：`~/.openclaw`）                                         |
| `--install-method npm\|git` | 選擇安裝方法（預設：`npm`）。別名：`--method`                       |
| `--npm`                     | npm 方法的捷徑                                                         |
| `--git`, `--github`         | git 方法的捷徑                                                         |
| `--git-dir <path>`          | Git checkout 目錄（預設：`~/openclaw`）。別名：`--dir`                  |
| `--version <ver>`           | OpenClaw 版本或 dist-tag（預設：`latest`）                                |
| `--node-version <ver>`      | 節點版本（預設：`22.22.0`）                                               |
| `--json`                    | 輸出 NDJSON 事件                                                              |
| `--onboard`                 | 安裝後執行 `openclaw onboard`                                            |
| `--no-onboard`              | 略過 onboarding（預設）                                                       |
| `--set-npm-prefix`          | 在 Linux 上，如果目前前綴不可寫入，強制將 npm 前綴設為 `~/.npm-global` |
| `--help`                    | 顯示用法（`-h`）                                                               |

  </Accordion>

  <Accordion title="環境變數參考">

| 變數                                    | 說明                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | 安裝前綴                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | 安裝方法                                                     |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw 版本或 dist-tag                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | 節點版本                                                       |
| `OPENCLAW_HOME=<path>`                      | OpenClaw 狀態與預設 git/onboarding 路徑的基底目錄 |
| `OPENCLAW_GIT_DIR=<path>`                   | git 安裝的 Git checkout 目錄                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 切換既有 checkout 的 git 更新                          |
| `OPENCLAW_NO_ONBOARD=1`                     | 略過 onboarding                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm 記錄層級                                                      |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### 流程（install.ps1）

<Steps>
  <Step title="確認 PowerShell + Windows 環境">
    需要 PowerShell 5+。
  </Step>
  <Step title="預設確認 Node.js 24">
    如果缺少，會嘗試透過 winget 安裝，接著 Chocolatey，再接著 Scoop。如果沒有可用的套件管理器，指令碼會將官方 Node.js Windows zip 下載到 `%LOCALAPPDATA%\OpenClaw\deps\portable-node`，並將其加入目前程序與使用者 PATH。Node 22 LTS，目前為 `22.19+`，仍支援相容性。
  </Step>
  <Step title="安裝 OpenClaw">
    - `npm` 方法（預設）：使用所選 `-Tag` 進行全域 npm 安裝，從可寫入的安裝程式暫存目錄啟動，因此在受保護資料夾（例如 `C:\`）中開啟的 shell 仍可運作
    - `git` 方法：clone/update repo、使用 pnpm install/build，並在 `%USERPROFILE%\.local\bin\openclaw.cmd` 安裝 wrapper。如果缺少 Git，指令碼會在 `%LOCALAPPDATA%\OpenClaw\deps\portable-git` 下引導安裝使用者本機 MinGit，並將其加入目前程序與使用者 PATH。

  </Step>
  <Step title="安裝後工作">
    - 盡可能將所需的 bin 目錄加入使用者 PATH
    - 以最佳努力重新整理已載入的閘道服務（`openclaw gateway install --force`，然後重新啟動）
    - 在升級與 git 安裝時執行 `openclaw doctor --non-interactive`（最佳努力）

  </Step>
  <Step title="處理失敗">
    `iwr ... | iex` 與 scriptblock 安裝會回報終止錯誤，但不會關閉目前 PowerShell 工作階段。直接 `powershell -File` / `pwsh -File` 安裝仍會為自動化以非零狀態結束。
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
  <Tab title="GitHub main checkout">
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
  <Tab title="偵錯追蹤">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="旗標參考">

| 旗標                        | 說明                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | 安裝方法（預設：`npm`）                            |
| `-Tag <tag\|version\|spec>` | npm dist-tag、版本或套件規格（預設：`latest`） |
| `-GitDir <path>`            | checkout 目錄（預設：`%USERPROFILE%\openclaw`）     |
| `-NoOnboard`                | 略過 onboarding                                            |
| `-NoGitUpdate`              | 略過 `git pull`                                            |
| `-DryRun`                   | 僅列印動作                                         |

  </Accordion>

  <Accordion title="環境變數參考">

| 變數                           | 說明        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | 安裝方法     |
| `OPENCLAW_GIT_DIR=<path>`          | checkout 目錄 |
| `OPENCLAW_NO_ONBOARD=1`            | 略過 onboarding    |
| `OPENCLAW_GIT_UPDATE=0`            | 停用 git pull   |
| `OPENCLAW_DRY_RUN=1`               | 試執行模式       |

  </Accordion>
</AccordionGroup>

<Note>
如果使用 `-InstallMethod git` 且缺少 Git，指令碼會先嘗試使用者本機 MinGit 引導安裝，再列印 Git for Windows 連結。
</Note>

---

## CI 與自動化

使用非互動式旗標/env vars 以取得可預測的執行。

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
  <Tab title="install.ps1（略過 onboarding）">
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
    某些 Linux 設定會將 npm 全域前綴指向 root 擁有的路徑。`install.sh` 可以將前綴切換到 `~/.npm-global`，並將 PATH exports 附加到 shell rc 檔案（當這些檔案存在時）。
  </Accordion>

  <Accordion title='Windows："npm error spawn git / ENOENT"'>
    重新執行安裝程式，讓它可以引導安裝使用者本機 MinGit，或安裝 Git for Windows 並重新開啟 PowerShell。
  </Accordion>

  <Accordion title='Windows："openclaw is not recognized"'>
    執行 `npm config get prefix`，並將該目錄加入你的使用者 PATH（Windows 上不需要 `\bin` 後綴），然後重新開啟 PowerShell。
  </Accordion>

  <Accordion title="Windows：如何取得詳細安裝程式輸出">
    `install.ps1` 目前未公開 `-Verbose` 開關。
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
