---
read_when:
    - 你想了解 `openclaw.ai/install.sh`
    - 你想要自动化安装（CI / 无头环境）
    - 你想从 GitHub checkout 安装
summary: 安装脚本（install.sh、install-cli.sh、install.ps1）的工作方式、标志和自动化
title: 安装器内部机制
x-i18n:
    generated_at: "2026-07-05T11:25:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09ae87aa8be98fdbeb0e215702ee3d10b19cc304b6a81bd939afd5858d5bb470
    source_path: install/installer.md
    workflow: 16
---

OpenClaw 提供三个安装脚本，均由 `openclaw.ai` 提供服务。

| 脚本                               | 平台                 | 作用                                                                                           |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 按需安装 Node，通过 npm（默认）或 git 安装 OpenClaw，并可运行新手引导。                       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | 通过 npm 或 git 将 Node + OpenClaw 安装到本地前缀（`~/.openclaw`）。无需 root。               |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 按需安装 Node，通过 npm（默认）或 git 安装 OpenClaw，并可运行新手引导。                       |

这三个脚本都支持 Node **22.19+、23.11+ 或 24+**；Node 24 是全新安装的默认目标版本。

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
如果安装成功，但在新终端中找不到 `openclaw`，请参阅 [Node.js 故障排除](/zh-CN/install/node#troubleshooting)。
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
推荐用于 macOS/Linux/WSL 上的大多数交互式安装。
</Tip>

### 流程（install.sh）

<Steps>
  <Step title="Detect OS">
    支持 macOS 和 Linux（包括 WSL）。
  </Step>
  <Step title="Ensure Node.js 24 by default">
    检查 Node 版本，并在需要时安装 Node 24（macOS 上使用 Homebrew，Linux apt/dnf/yum 上使用 NodeSource 设置脚本）。在 macOS 上，只有当安装器需要 Homebrew 来安装 Node 或 Git 时，才会安装 Homebrew。Node 22.19+ 和 23.11+ 仍受支持以保持兼容性。
    在 Alpine/musl Linux 上，安装器会使用 apk 软件包而不是 NodeSource；配置的 Alpine 仓库必须提供受支持的 Node 版本（撰写本文时为 Alpine 3.21 或更新版本）。
  </Step>
  <Step title="Ensure Git">
    如果缺少 Git，则使用检测到的软件包管理器安装 Git，包括 macOS 上的 Homebrew 和 Alpine 上的 apk。
  </Step>
  <Step title="Install OpenClaw">
    - `npm` 方法（默认）：全局 npm 安装
    - `git` 方法：克隆/更新仓库，使用 pnpm 安装依赖，构建，然后在 `~/.local/bin/openclaw` 安装包装器

  </Step>
  <Step title="Post-install tasks">
    - 尽力刷新已加载的 Gateway 网关服务（`openclaw gateway install --force`，然后重启）
    - 在升级和 git 安装时运行 `openclaw doctor --non-interactive`（尽力执行）
    - 在条件合适时尝试新手引导（TTY 可用、新手引导未禁用，并且 bootstrap/配置检查通过）
    - 设置 `--verify` 时运行安装后的冒烟验证

  </Step>
</Steps>

### 源码检出检测

如果在 OpenClaw 检出目录（`package.json` + `pnpm-workspace.yaml`）内运行，脚本会提供：

- 使用检出目录（`git`），或
- 使用全局安装（`npm`）

如果没有可用的 TTY 且未设置安装方法，则默认使用 `npm` 并发出警告。

对于无效的方法选择或无效的 `--install-method` 值，脚本会以代码 `2` 退出。

### 示例（install.sh）

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
  <Tab title="Verify after install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| 标志                                    | 描述                                                                  |
| --------------------------------------- | --------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | 选择安装方法（默认：`npm`）                                           |
| `--npm`                                 | npm 方法的快捷方式                                                    |
| `--git \| --github`                     | git 方法的快捷方式                                                    |
| `--version <version\|dist-tag\|spec>`   | npm 版本、dist-tag 或软件包规范（默认：`latest`）                    |
| `--beta`                                | 如可用则使用 beta dist-tag，否则回退到 `latest`                      |
| `--git-dir \| --dir <path>`             | 检出目录（默认：`~/openclaw`）                                        |
| `--no-git-update`                       | 对现有检出目录跳过 `git pull`                                        |
| `--no-prompt`                           | 禁用提示                                                              |
| `--no-onboard`                          | 跳过新手引导                                                          |
| `--onboard`                             | 启用新手引导                                                          |
| `--verify`                              | 运行安装后的冒烟验证（`--version`，如已加载则检查 Gateway 健康）     |
| `--dry-run`                             | 打印操作而不应用更改                                                  |
| `--verbose`                             | 启用调试输出（`set -x`，npm notice 级别日志）                        |
| `--help \| -h`                          | 显示用法                                                              |

  </Accordion>

  <Accordion title="Environment variables reference">

| 变量                                              | 描述                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | 安装方法                                                           |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm 版本、dist-tag 或软件包规范                                    |
| `OPENCLAW_BETA=0\|1`                              | 如可用则使用 beta                                                  |
| `OPENCLAW_HOME=<path>`                            | OpenClaw 状态和默认 git/新手引导路径的基础目录                    |
| `OPENCLAW_GIT_DIR=<path>`                         | 检出目录                                                           |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | 切换 git 更新                                                      |
| `OPENCLAW_NO_PROMPT=1`                            | 禁用提示                                                           |
| `OPENCLAW_VERIFY_INSTALL=1`                       | 运行安装后的冒烟验证                                               |
| `OPENCLAW_NO_ONBOARD=1`                           | 跳过新手引导                                                       |
| `OPENCLAW_DRY_RUN=1`                              | Dry run 模式                                                       |
| `OPENCLAW_VERBOSE=1`                              | 调试模式                                                           |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm 日志级别（默认：`error`，隐藏 npm 弃用噪声）                  |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
适用于你希望所有内容都位于本地前缀下
（默认 `~/.openclaw`）且不依赖系统 Node 的环境。默认支持 npm 安装，
也支持在同一前缀流程下进行 git 检出安装。
</Info>

### 流程（install-cli.sh）

<Steps>
  <Step title="Install local Node runtime">
    下载固定的受支持 Node LTS tarball（版本嵌入脚本中并独立更新，默认 `22.22.0`）到 `<prefix>/tools/node-v<version>`，并验证 SHA-256。
    在 Alpine/musl Linux 上，由于 Node 不发布与固定运行时兼容的 tarball，因此会用 `apk` 安装 `nodejs` 和 `npm`，并将该运行时链接到前缀包装器路径。Alpine 仓库必须提供受支持的 Node 版本（22.19+、23.11+ 或 24+）；如果旧仓库只提供 Node 20 或 21，请使用 Alpine 3.21 或更新版本。
  </Step>
  <Step title="Ensure Git">
    如果缺少 Git，则尝试通过 Linux 上的 apt/dnf/yum/apk 或 macOS 上的 Homebrew 安装。
  </Step>
  <Step title="Install OpenClaw under prefix">
    - `npm` 方法（默认）：使用 npm 安装到前缀下，然后将包装器写入 `<prefix>/bin/openclaw`
    - `git` 方法：克隆/更新检出目录（默认 `~/openclaw`），并仍将包装器写入 `<prefix>/bin/openclaw`

  </Step>
  <Step title="Refresh loaded gateway service">
    如果 Gateway 网关服务已从同一前缀加载，脚本会运行
    `openclaw gateway install --force`，然后运行 `openclaw gateway restart`，并
    尽力探测 Gateway 健康。
  </Step>
</Steps>

### 示例（install-cli.sh）

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

| 标志                                    | 描述                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | 安装前缀（默认：`~/.openclaw`）                                         |
| `--install-method \| --method npm\|git` | 选择安装方法（默认：`npm`）                                          |
| `--npm`                                 | npm 方法的快捷方式                                                         |
| `--git \| --github`                     | git 方法的快捷方式                                                         |
| `--git-dir \| --dir <path>`             | Git 检出目录（默认：`~/openclaw`）                                  |
| `--version <ver>`                       | OpenClaw 版本或 dist-tag（默认：`latest`）                                |
| `--node-version <ver>`                  | Node 版本（默认：`22.22.0`）                                               |
| `--json`                                | 发出 NDJSON 事件                                                              |
| `--onboard`                             | 安装后运行 `openclaw onboard`                                            |
| `--no-onboard`                          | 跳过新手引导（默认）                                                       |
| `--set-npm-prefix`                      | 在 Linux 上，如果当前前缀不可写，则强制将 npm 前缀设为 `~/.npm-global` |
| `--help \| -h`                          | 显示用法                                                                      |

  </Accordion>

  <Accordion title="环境变量参考">

| 变量                                    | 描述                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | 安装前缀                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | 安装方法                                                     |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw 版本或 dist-tag                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node 版本                                                       |
| `OPENCLAW_HOME=<path>`                      | OpenClaw 状态和默认 git/新手引导路径的基础目录 |
| `OPENCLAW_GIT_DIR=<path>`                   | git 安装的 Git 检出目录                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 为现有检出切换 git 更新                          |
| `OPENCLAW_NO_ONBOARD=1`                     | 跳过新手引导                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm 日志级别（默认：`error`）                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` 和其他 GitHub 源规格不是 npm 安装的有效 `--version` 目标。请改用 `--install-method git --version main`。
</Note>

---

<a id="installps1"></a>

## install.ps1

### 流程（install.ps1）

<Steps>
  <Step title="确保 PowerShell + Windows 环境">
    需要 PowerShell 5+。
  </Step>
  <Step title="默认确保 Node.js 24">
    如果缺失，会先尝试通过 winget 安装，然后是 Chocolatey，再然后是 Scoop。如果没有可用的包管理器，脚本会将官方 Node.js 24 Windows zip 下载到 `%LOCALAPPDATA%\OpenClaw\deps\portable-node`，并将其添加到当前进程和用户 PATH。Node 22.19+ 和 23.11+ 仍为兼容性而受支持。
  </Step>
  <Step title="安装 OpenClaw">
    - `npm` 方法（默认）：使用所选 `-Tag` 进行全局 npm 安装，从可写的安装器临时目录启动，因此在 `C:\` 等受保护文件夹中打开的 shell 仍可工作
    - `git` 方法：克隆/更新仓库，使用 pnpm 安装/构建，并在 `%USERPROFILE%\.local\bin\openclaw.cmd` 安装包装器。如果缺少 Git，脚本会在 `%LOCALAPPDATA%\OpenClaw\deps\portable-git` 下引导用户本地 MinGit，并将其添加到当前进程和用户 PATH。

  </Step>
  <Step title="安装后任务">
    - 尽可能将所需 bin 目录添加到用户 PATH
    - 尽力刷新已加载的 Gateway 网关服务（`openclaw gateway install --force`，然后重启）
    - 在升级和 git 安装时运行 `openclaw doctor --non-interactive`（尽力而为）

  </Step>
  <Step title="处理失败">
    `iwr ... | iex` 和 scriptblock 安装会报告终止错误，而不会关闭当前 PowerShell 会话。直接的 `powershell -File` / `pwsh -File` 安装仍会以非零状态退出，便于自动化。
  </Step>
</Steps>

### 示例（install.ps1）

<Tabs>
  <Tab title="默认">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git 安装">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main 检出">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="自定义 git 目录">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="试运行">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="标志参考">

| 标志                        | 描述                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | 安装方法（默认：`npm`）                            |
| `-Tag <tag\|version\|spec>` | npm dist-tag、版本或包规格（默认：`latest`） |
| `-GitDir <path>`            | 检出目录（默认：`%USERPROFILE%\openclaw`）     |
| `-NoOnboard`                | 跳过新手引导                                            |
| `-NoGitUpdate`              | 跳过 `git pull`                                            |
| `-DryRun`                   | 仅打印操作                                         |

  </Accordion>

  <Accordion title="环境变量参考">

| 变量                           | 描述        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | 安装方法     |
| `OPENCLAW_GIT_DIR=<path>`          | 检出目录 |
| `OPENCLAW_NO_ONBOARD=1`            | 跳过新手引导    |
| `OPENCLAW_GIT_UPDATE=0`            | 禁用 git pull   |
| `OPENCLAW_DRY_RUN=1`               | 试运行模式       |

  </Accordion>
</AccordionGroup>

<Note>
如果使用 `-InstallMethod git` 且缺少 Git，脚本会先尝试引导用户本地 MinGit，然后再打印 Git for Windows 链接。
</Note>

---

## CI 和自动化

使用非交互式标志/环境变量以获得可预测的运行。

<Tabs>
  <Tab title="install.sh（非交互式 npm）">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh（非交互式 git）">
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
  <Tab title="install.ps1（跳过新手引导）">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## 故障排查

<AccordionGroup>
  <Accordion title="为什么需要 Git？">
    `git` 安装方法需要 Git。对于 `npm` 安装，仍会检查/安装 Git，以避免依赖项使用 git URL 时出现 `spawn git ENOENT` 失败。
  </Accordion>

  <Accordion title="为什么 npm 在 Linux 上遇到 EACCES？">
    某些 Linux 设置会将 npm 的全局前缀指向 root 拥有的路径。`install.sh` 可以将前缀切换到 `~/.npm-global`，并将 PATH 导出追加到 shell rc 文件（如果这些文件存在）。
  </Accordion>

  <Accordion title='Windows：“npm error spawn git / ENOENT”'>
    重新运行安装器，让它引导用户本地 MinGit，或安装 Git for Windows 并重新打开 PowerShell。
  </Accordion>

  <Accordion title='Windows：“openclaw is not recognized”'>
    运行 `npm config get prefix`，并将该目录添加到你的用户 PATH（Windows 上不需要 `\bin` 后缀），然后重新打开 PowerShell。
  </Accordion>

  <Accordion title="Windows：如何获取详细安装器输出">
    `install.ps1` 不公开 `-Verbose` 开关。
    使用 PowerShell 跟踪进行脚本级诊断：

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="安装后找不到 openclaw">
    通常是 PATH 问题。请参阅 [Node.js 故障排查](/zh-CN/install/node#troubleshooting)。
  </Accordion>
</AccordionGroup>

## 相关

- [安装概览](/zh-CN/install)
- [更新](/zh-CN/install/updating)
- [卸载](/zh-CN/install/uninstall)
