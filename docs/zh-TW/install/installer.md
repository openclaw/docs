---
read_when:
    - 您想了解 `openclaw.ai/install.sh`
    - 你想要自動化安裝流程（CI / 無頭環境）
    - 您想從 GitHub 簽出副本安裝
summary: 安裝腳本的運作方式（install.sh、install-cli.sh、install.ps1）、旗標與自動化
title: 安裝程式內部機制
x-i18n:
    generated_at: "2026-04-30T03:15:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 278e8d6a1a39651812b7f0955965c53c62afd3ad673b357484f8aecbcfbbdb1d
    source_path: install/installer.md
    workflow: 16
---

OpenClaw 提供三個安裝程式腳本，從 `openclaw.ai` 供應。

| 腳本                               | 平台                 | 功能                                                                                                               |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 視需要安裝 Node，透過 npm（預設）或 git 安裝 OpenClaw，並且可以執行上手設定。                                      |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | 使用 npm 或 git checkout 模式，將 Node + OpenClaw 安裝到本機前綴 (`~/.openclaw`)。不需要 root 權限。               |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 視需要安裝 Node，透過 npm（預設）或 git 安裝 OpenClaw，並且可以執行上手設定。                                      |

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
如果安裝成功但在新終端機中找不到 `openclaw`，請參閱 [Node.js 疑難排解](/zh-TW/install/node#troubleshooting)。
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
建議大多數 macOS/Linux/WSL 互動式安裝使用。
</Tip>

### 流程 (install.sh)

<Steps>
  <Step title="偵測作業系統">
    支援 macOS 和 Linux（包括 WSL）。如果偵測到 macOS，會在缺少 Homebrew 時安裝它。
  </Step>
  <Step title="預設確保 Node.js 24">
    檢查 Node 版本，並視需要安裝 Node 24（macOS 使用 Homebrew，Linux apt/dnf/yum 使用 NodeSource 設定腳本）。OpenClaw 仍支援 Node 22 LTS，目前為 `22.14+`，以維持相容性。
  </Step>
  <Step title="確保 Git">
    如果缺少 Git，會進行安裝。
  </Step>
  <Step title="安裝 OpenClaw">
    - `npm` 方法（預設）：全域 npm 安裝
    - `git` 方法：clone/update repo、使用 pnpm 安裝相依套件、建置，然後在 `~/.local/bin/openclaw` 安裝 wrapper

  </Step>
  <Step title="安裝後任務">
    - 盡力重新整理已載入的 gateway 服務（`openclaw gateway install --force`，然後重新啟動）
    - 在升級和 git 安裝時執行 `openclaw doctor --non-interactive`（盡力執行）
    - 在適當時嘗試上手設定（TTY 可用、未停用上手設定，且 bootstrap/config 檢查通過）
    - 預設 `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### 原始碼 checkout 偵測

如果在 OpenClaw checkout（`package.json` + `pnpm-workspace.yaml`）內執行，腳本會提供：

- 使用 checkout (`git`)，或
- 使用全域安裝 (`npm`)

如果沒有可用的 TTY 且未設定安裝方法，預設為 `npm` 並顯示警告。

對於無效的方法選擇或無效的 `--install-method` 值，腳本會以代碼 `2` 結束。

### 範例 (install.sh)

<Tabs>
  <Tab title="預設">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="略過上手設定">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git 安裝">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="透過 npm 使用 GitHub main">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="旗標參考">

| 旗標                                  | 說明                                                     |
| ------------------------------------- | -------------------------------------------------------- |
| `--install-method npm\|git`           | 選擇安裝方法（預設：`npm`）。別名：`--method`            |
| `--npm`                               | npm 方法的捷徑                                          |
| `--git`                               | git 方法的捷徑。別名：`--github`                        |
| `--version <version\|dist-tag\|spec>` | npm 版本、dist-tag 或 package spec（預設：`latest`）     |
| `--beta`                              | 使用 beta dist-tag（若可用），否則 fallback 到 `latest`  |
| `--git-dir <path>`                    | Checkout 目錄（預設：`~/openclaw`）。別名：`--dir`       |
| `--no-git-update`                     | 對現有 checkout 略過 `git pull`                          |
| `--no-prompt`                         | 停用提示                                                |
| `--no-onboard`                        | 略過上手設定                                            |
| `--onboard`                           | 啟用上手設定                                            |
| `--dry-run`                           | 列印動作而不套用變更                                    |
| `--verbose`                           | 啟用 debug 輸出（`set -x`、npm notice-level logs）       |
| `--help`                              | 顯示用法 (`-h`)                                         |

  </Accordion>

  <Accordion title="環境變數參考">

| 變數                                                    | 說明                                      |
| ------------------------------------------------------- | ----------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | 安裝方法                                  |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm 版本、dist-tag 或 package spec        |
| `OPENCLAW_BETA=0\|1`                                    | 使用 beta（若可用）                       |
| `OPENCLAW_GIT_DIR=<path>`                               | Checkout 目錄                             |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | 切換 git 更新                             |
| `OPENCLAW_NO_PROMPT=1`                                  | 停用提示                                  |
| `OPENCLAW_NO_ONBOARD=1`                                 | 略過上手設定                              |
| `OPENCLAW_DRY_RUN=1`                                    | Dry run 模式                              |
| `OPENCLAW_VERBOSE=1`                                    | Debug 模式                                |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm log 層級                              |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | 控制 sharp/libvips 行為（預設：`1`）      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
設計用於希望所有內容都位於本機前綴（預設 `~/.openclaw`）下，且不依賴系統 Node 的環境。預設支援 npm 安裝，也支援在相同前綴流程下的 git-checkout 安裝。
</Info>

### 流程 (install-cli.sh)

<Steps>
  <Step title="安裝本機 Node runtime">
    將釘選的受支援 Node LTS tarball（版本內嵌於腳本中並獨立更新）下載到 `<prefix>/tools/node-v<version>`，並驗證 SHA-256。
  </Step>
  <Step title="確保 Git">
    如果缺少 Git，會嘗試在 Linux 上透過 apt/dnf/yum 安裝，或在 macOS 上透過 Homebrew 安裝。
  </Step>
  <Step title="在前綴下安裝 OpenClaw">
    - `npm` 方法（預設）：使用 npm 安裝在前綴下，然後將 wrapper 寫入 `<prefix>/bin/openclaw`
    - `git` 方法：clone/update checkout（預設 `~/openclaw`），並仍將 wrapper 寫入 `<prefix>/bin/openclaw`

  </Step>
  <Step title="重新整理已載入的 gateway 服務">
    如果 gateway 服務已從相同前綴載入，腳本會執行
    `openclaw gateway install --force`，接著執行 `openclaw gateway restart`，
    並盡力探測 gateway 健康狀態。
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
  <Tab title="執行上手設定">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="旗標參考">

| 旗標                        | 說明                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | 安裝前綴（預設：`~/.openclaw`）                                                 |
| `--install-method npm\|git` | 選擇安裝方法（預設：`npm`）。別名：`--method`                                   |
| `--npm`                     | npm 方法的捷徑                                                                  |
| `--git`, `--github`         | git 方法的捷徑                                                                  |
| `--git-dir <path>`          | Git checkout 目錄（預設：`~/openclaw`）。別名：`--dir`                          |
| `--version <ver>`           | OpenClaw 版本或 dist-tag（預設：`latest`）                                      |
| `--node-version <ver>`      | Node 版本（預設：`22.22.0`）                                                    |
| `--json`                    | 發出 NDJSON 事件                                                                |
| `--onboard`                 | 安裝後執行 `openclaw onboard`                                                   |
| `--no-onboard`              | 略過上手設定（預設）                                                            |
| `--set-npm-prefix`          | 在 Linux 上，如果目前前綴不可寫入，強制 npm 前綴為 `~/.npm-global`              |
| `--help`                    | 顯示用法 (`-h`)                                                                 |

  </Accordion>

  <Accordion title="環境變數參考">

| 變數                                        | 說明                                          |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | 安裝前置路徑                                  |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | 安裝方法                                      |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw 版本或 dist-tag                      |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node 版本                                     |
| `OPENCLAW_GIT_DIR=<path>`                   | git 安裝的 Git checkout 目錄                  |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 切換現有 checkout 的 git 更新                 |
| `OPENCLAW_NO_ONBOARD=1`                     | 略過入門設定                                  |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm 記錄層級                                  |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | 控制 sharp/libvips 行為（預設：`1`）          |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### 流程 (install.ps1)

<Steps>
  <Step title="確保 PowerShell + Windows 環境">
    需要 PowerShell 5+。
  </Step>
  <Step title="預設確保 Node.js 24">
    如果缺少，會嘗試透過 winget 安裝，接著是 Chocolatey，然後是 Scoop。Node 22 LTS（目前為 `22.14+`）仍支援相容性。
  </Step>
  <Step title="安裝 OpenClaw">
    - `npm` 方法（預設）：使用選取的 `-Tag` 進行全域 npm 安裝
    - `git` 方法：clone/update repo、使用 pnpm install/build，並在 `%USERPROFILE%\.local\bin\openclaw.cmd` 安裝 wrapper

  </Step>
  <Step title="安裝後工作">
    - 盡可能將所需的 bin 目錄加入使用者 PATH
    - 以最佳努力方式重新整理已載入的 Gateway 服務（`openclaw gateway install --force`，然後重新啟動）
    - 在升級和 git 安裝時執行 `openclaw doctor --non-interactive`（最佳努力）

  </Step>
  <Step title="處理失敗">
    `iwr ... | iex` 和 scriptblock 安裝會回報終止錯誤，但不會關閉目前的 PowerShell 工作階段。直接使用 `powershell -File` / `pwsh -File` 安裝時，仍會為自動化流程以非零狀態結束。
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
  <Tab title="透過 npm 使用 GitHub main">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
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

| 旗標                        | 說明                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | 安裝方法（預設：`npm`）                                    |
| `-Tag <tag\|version\|spec>` | npm dist-tag、版本或套件規格（預設：`latest`）             |
| `-GitDir <path>`            | Checkout 目錄（預設：`%USERPROFILE%\openclaw`）            |
| `-NoOnboard`                | 略過入門設定                                               |
| `-NoGitUpdate`              | 略過 `git pull`                                            |
| `-DryRun`                   | 只列印動作                                                 |

  </Accordion>

  <Accordion title="環境變數參考">

| 變數                               | 說明           |
| ---------------------------------- | -------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | 安裝方法       |
| `OPENCLAW_GIT_DIR=<path>`          | Checkout 目錄  |
| `OPENCLAW_NO_ONBOARD=1`            | 略過入門設定   |
| `OPENCLAW_GIT_UPDATE=0`            | 停用 git pull  |
| `OPENCLAW_DRY_RUN=1`               | 試執行模式     |

  </Accordion>
</AccordionGroup>

<Note>
如果使用 `-InstallMethod git` 且缺少 Git，script 會結束並列印 Git for Windows 連結。
</Note>

---

## CI 與自動化

使用非互動式旗標/env vars 來取得可預測的執行結果。

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
    `git` 安裝方法需要 Git。對於 `npm` 安裝，仍會檢查/安裝 Git，以避免相依套件使用 git URL 時發生 `spawn git ENOENT` 失敗。
  </Accordion>

  <Accordion title="為什麼 npm 在 Linux 上遇到 EACCES？">
    某些 Linux 設定會將 npm global prefix 指向 root 擁有的路徑。`install.sh` 可以將 prefix 切換到 `~/.npm-global`，並將 PATH 匯出附加到 shell rc 檔案（當這些檔案存在時）。
  </Accordion>

  <Accordion title="sharp/libvips 問題">
    scripts 預設使用 `SHARP_IGNORE_GLOBAL_LIBVIPS=1`，以避免 sharp 針對系統 libvips 建置。若要覆寫：

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows："npm error spawn git / ENOENT"'>
    安裝 Git for Windows，重新開啟 PowerShell，然後重新執行安裝程式。
  </Accordion>

  <Accordion title='Windows："openclaw is not recognized"'>
    執行 `npm config get prefix`，並將該目錄加入你的使用者 PATH（Windows 上不需要 `\bin` 後綴），然後重新開啟 PowerShell。
  </Accordion>

  <Accordion title="Windows：如何取得詳細的安裝程式輸出">
    `install.ps1` 目前未公開 `-Verbose` switch。
    使用 PowerShell 追蹤進行 script 層級診斷：

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
