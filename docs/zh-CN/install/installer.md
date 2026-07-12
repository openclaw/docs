---
read_when:
    - 你想了解 `openclaw.ai/install.sh`
    - 你希望自动执行安装（CI / 无头模式）
    - 你想从 GitHub 检出版本安装
summary: 安装脚本（install.sh、install-cli.sh、install.ps1）的工作原理、标志和自动化机制
title: 安装程序内部机制
x-i18n:
    generated_at: "2026-07-12T14:31:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw 提供三个安装程序脚本，均由 `openclaw.ai` 托管。

| 脚本                               | 平台                 | 功能                                                                                              |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 按需安装 Node，通过 npm（默认）或 git 安装 OpenClaw，并可运行新手引导。                            |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | 通过 npm 或 git 将 Node + OpenClaw 安装到本地前缀（`~/.openclaw`）下。无需 root 权限。              |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 按需安装 Node，通过 npm（默认）或 git 安装 OpenClaw，并可运行新手引导。                            |

这三个脚本均支持 Node **22.19+、23.11+ 或 24+**；全新安装默认以 Node 24 为目标版本。

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
建议用于 macOS/Linux/WSL 上的大多数交互式安装。
</Tip>

### 流程（install.sh）

<Steps>
  <Step title="检测操作系统">
    支持 macOS 和 Linux（包括 WSL）。
  </Step>
  <Step title="默认确保安装 Node.js 24">
    检查 Node 版本，并在需要时安装 Node 24（macOS 使用 Homebrew，Linux apt/dnf/yum 使用 NodeSource 设置脚本）。在 macOS 上，仅当安装程序需要使用 Homebrew 安装 Node 或 Git 时才会安装 Homebrew。为保持兼容性，仍支持 Node 22.19+ 和 23.11+。
    在 Alpine/musl Linux 上，安装程序使用 apk 软件包而非 NodeSource；配置的 Alpine 软件仓库必须提供受支持的 Node 版本（本文撰写时要求 Alpine 3.21 或更高版本）。
  </Step>
  <Step title="确保安装 Git">
    如果缺少 Git，则使用检测到的软件包管理器进行安装，包括 macOS 上的 Homebrew 和 Alpine 上的 apk。
  </Step>
  <Step title="安装 OpenClaw">
    - `npm` 方法（默认）：使用 npm 全局安装
    - `git` 方法：克隆/更新仓库、使用 pnpm 安装依赖项、构建，然后在 `~/.local/bin/openclaw` 安装包装脚本

  </Step>
  <Step title="安装后任务">
    - 解析刚安装的 `openclaw` 二进制文件，以用于后续命令
    - 对于尚未配置的安装，在运行 Doctor 或 Gateway 网关探测之前启动新手引导。使用 `--no-onboard` 或没有 TTY 时，会输出稍后完成设置所需的命令。
    - 对于已配置的安装，以尽力而为的方式刷新并重启已加载的 Gateway 网关服务，然后运行 Doctor。升级时会尽可能更新插件；如果在启用了提示的无头运行中无法更新，则输出手动命令。
    - 运行 `--verify` 时，会检查已安装的版本，并且仅在配置存在后检查 Gateway 健康。

  </Step>
</Steps>

### 源代码检出检测

如果在 OpenClaw 检出目录（包含 `package.json` + `pnpm-workspace.yaml`）中运行，该脚本会提供以下选项：

- 使用检出目录（`git`），或
- 使用全局安装（`npm`）

如果没有可用的 TTY 且未设置安装方法，则默认使用 `npm` 并发出警告。

如果选择了无效的方法或提供了无效的 `--install-method` 值，脚本将以代码 `2` 退出。

### 示例（install.sh）

<Tabs>
  <Tab title="默认">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="跳过新手引导">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git 安装">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main 检出">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="试运行">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="安装后验证">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="标志参考">

| 标志                                    | 说明                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | 选择安装方法（默认：`npm`）                                                 |
| `--npm`                                 | npm 方法的快捷方式                                                          |
| `--git \| --github`                     | git 方法的快捷方式                                                          |
| `--version <version\|dist-tag\|spec>`   | npm 版本、dist-tag 或软件包规范（默认：`latest`）                           |
| `--beta`                                | 如果可用则使用 beta dist-tag，否则回退到 `latest`                           |
| `--git-dir \| --dir <path>`             | 检出目录（默认：`~/openclaw`）                                              |
| `--no-git-update`                       | 对现有检出目录跳过 `git pull`                                               |
| `--no-prompt`                           | 禁用提示                                                                    |
| `--no-onboard`                          | 跳过新手引导                                                                |
| `--onboard`                             | 启用新手引导                                                                |
| `--verify`                              | 运行安装后冒烟验证（`--version`，如果已加载则检查 Gateway 健康）            |
| `--dry-run`                             | 输出操作但不应用更改                                                        |
| `--verbose`                             | 启用调试输出（`set -x`、npm notice 级别日志）                               |
| `--help \| -h`                          | 显示用法                                                                    |

  </Accordion>

  <Accordion title="环境变量参考">

| 变量                                              | 说明                                                            |
| ------------------------------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | 安装方法                                                        |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm 版本、dist-tag 或软件包规范                                 |
| `OPENCLAW_BETA=0\|1`                              | 如果可用则使用 beta                                             |
| `OPENCLAW_HOME=<path>`                            | OpenClaw 状态及默认 git/新手引导路径的基础目录                  |
| `OPENCLAW_GIT_DIR=<path>`                         | 检出目录                                                        |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | 切换 git 更新                                                   |
| `OPENCLAW_NO_PROMPT=1`                            | 禁用提示                                                        |
| `OPENCLAW_VERIFY_INSTALL=1`                       | 运行安装后冒烟验证                                              |
| `OPENCLAW_NO_ONBOARD=1`                           | 跳过新手引导                                                    |
| `OPENCLAW_DRY_RUN=1`                              | 试运行模式                                                      |
| `OPENCLAW_VERBOSE=1`                              | 调试模式                                                        |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm 日志级别（默认：`error`，隐藏 npm 弃用提示噪声）            |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
专为希望将所有内容放在本地前缀
（默认 `~/.openclaw`）下且不依赖系统 Node 的环境设计。默认支持 npm 安装，
也支持在相同前缀流程下进行 git 检出安装。
</Info>

### 流程（install-cli.sh）

<Steps>
  <Step title="安装本地 Node 运行时">
    将固定版本且受支持的 Node LTS tarball（版本嵌入脚本中并独立更新，默认为 `22.22.2`）下载到 `<prefix>/tools/node-v<version>`，并验证 SHA-256。
    在 Alpine/musl Linux 上，由于 Node 不会为固定运行时发布兼容的 tarball，因此使用 `apk` 安装 `nodejs` 和 `npm`，并将该运行时链接到前缀包装脚本路径中。Alpine 软件仓库必须提供受支持的 Node 版本（22.19+、23.11+ 或 24+）；如果较旧的软件仓库仅提供 Node 20 或 21，请使用 Alpine 3.21 或更高版本。
  </Step>
  <Step title="确保安装 Git">
    如果缺少 Git，则尝试在 Linux 上通过 apt/dnf/yum/apk 安装，或在 macOS 上通过 Homebrew 安装。
  </Step>
  <Step title="在前缀下安装 OpenClaw">
    - `npm` 方法（默认）：使用 npm 安装到前缀下，然后将包装脚本写入 `<prefix>/bin/openclaw`
    - `git` 方法：克隆/更新检出目录（默认 `~/openclaw`），并仍将包装脚本写入 `<prefix>/bin/openclaw`

  </Step>
  <Step title="刷新已加载的 Gateway 网关服务">
    如果已从同一前缀加载 Gateway 网关服务，脚本会运行
    `openclaw gateway install --force`，然后运行 `openclaw gateway restart`，并
    以尽力而为的方式探测 Gateway 健康。
  </Step>
</Steps>

### 示例（install-cli.sh）

<Tabs>
  <Tab title="默认">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="自定义前缀 + 版本">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git 安装">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="自动化 JSON 输出">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="运行新手引导">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="标志参考">

| 标志                                    | 说明                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `--prefix <path>`                       | 安装前缀（默认：`~/.openclaw`）                                         |
| `--install-method \| --method npm\|git` | 选择安装方法（默认：`npm`）                                              |
| `--npm`                                 | npm 方法的快捷方式                                                       |
| `--git \| --github`                     | git 方法的快捷方式                                                       |
| `--git-dir \| --dir <path>`             | Git 检出目录（默认：`~/openclaw`）                                       |
| `--version <ver>`                       | OpenClaw 版本或 dist-tag（默认：`latest`）                               |
| `--node-version <ver>`                  | Node 版本（默认：`22.22.2`）                                             |
| `--json`                                | 输出 NDJSON 事件                                                         |
| `--onboard`                             | 安装后运行 `openclaw onboard`                                            |
| `--no-onboard`                          | 跳过新手引导（默认）                                                     |
| `--set-npm-prefix`                      | 在 Linux 上，如果当前前缀不可写，则强制将 npm 前缀设为 `~/.npm-global`   |
| `--help \| -h`                          | 显示用法                                                                 |

  </Accordion>

  <Accordion title="环境变量参考">

| 变量                                        | 说明                                                        |
| ------------------------------------------- | ----------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | 安装前缀                                                    |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | 安装方法                                                    |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw 版本或 dist-tag                                    |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node 版本                                                   |
| `OPENCLAW_HOME=<path>`                      | OpenClaw 状态以及默认 git/新手引导路径的基础目录             |
| `OPENCLAW_GIT_DIR=<path>`                   | git 安装的 Git 检出目录                                     |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 切换现有检出目录的 git 更新                                 |
| `OPENCLAW_NO_ONBOARD=1`                     | 跳过新手引导                                                |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm 日志级别（默认：`error`）                               |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` 和其他 GitHub 源规范不是 npm 安装的有效 `--version` 目标。请改用 `--install-method git --version main`。
</Note>

---

<a id="installps1"></a>

## install.ps1

### 流程（install.ps1）

<Steps>
  <Step title="确保 PowerShell + Windows 环境">
    需要 PowerShell 5+。
  </Step>
  <Step title="默认确保使用 Node.js 24">
    如果缺失，则依次尝试通过 winget、Chocolatey 和 Scoop 安装。如果没有可用的包管理器，脚本会将官方 Node.js 24 Windows zip 下载到 `%LOCALAPPDATA%\OpenClaw\deps\portable-node`，并将其添加到当前进程和用户 PATH。为保持兼容性，仍支持 Node 22.19+ 和 23.11+。
  </Step>
  <Step title="安装 OpenClaw">
    - `npm` 方法（默认）：使用所选 `-Tag` 进行全局 npm 安装，并从可写的安装程序临时目录启动，因此在 `C:\` 等受保护文件夹中打开的 shell 仍可正常工作
    - `git` 方法：克隆/更新仓库，使用 pnpm 安装/构建，并在 `%USERPROFILE%\.local\bin\openclaw.cmd` 安装包装器。如果缺少 Git，脚本会在 `%LOCALAPPDATA%\OpenClaw\deps\portable-git` 下引导安装用户本地的 MinGit，并将其添加到当前进程和用户 PATH。

  </Step>
  <Step title="安装后任务">
    - 尽可能将所需的 bin 目录添加到用户 PATH
    - 尽力刷新已加载的 Gateway 网关服务（先运行 `openclaw gateway install --force`，然后重启）
    - 在升级和 git 安装时运行 `openclaw doctor --non-interactive`（尽力而为）

  </Step>
  <Step title="处理失败">
    `iwr ... | iex` 和脚本块安装会报告终止错误，但不会关闭当前 PowerShell 会话。直接使用 `powershell -File` / `pwsh -File` 安装时，仍会以非零状态退出，以便用于自动化。
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

| 标志                        | 说明                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | 安装方法（默认：`npm`）                                    |
| `-Tag <tag\|version\|spec>` | npm dist-tag、版本或包规范（默认：`latest`）                |
| `-GitDir <path>`            | 检出目录（默认：`%USERPROFILE%\openclaw`）                 |
| `-NoOnboard`                | 跳过新手引导                                               |
| `-NoGitUpdate`              | 跳过 `git pull`                                            |
| `-DryRun`                   | 仅打印操作                                                 |

  </Accordion>

  <Accordion title="环境变量参考">

| 变量                               | 说明         |
| ---------------------------------- | ------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | 安装方法     |
| `OPENCLAW_GIT_DIR=<path>`          | 检出目录     |
| `OPENCLAW_NO_ONBOARD=1`            | 跳过新手引导 |
| `OPENCLAW_GIT_UPDATE=0`            | 禁用 git pull |
| `OPENCLAW_DRY_RUN=1`               | 试运行模式   |

  </Accordion>
</AccordionGroup>

<Note>
如果使用 `-InstallMethod git` 且缺少 Git，脚本会先尝试引导安装用户本地的 MinGit，然后再打印 Git for Windows 链接。
</Note>

---

## CI 和自动化

使用非交互式标志/环境变量可确保运行结果可预测。

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

  <Accordion title="为什么 npm 在 Linux 上会遇到 EACCES？">
    某些 Linux 设置会将 npm 的全局前缀指向 root 所有的路径。`install.sh` 可以将前缀切换到 `~/.npm-global`，并将 PATH 导出配置追加到 shell rc 文件中（如果这些文件存在）。
  </Accordion>

  <Accordion title='Windows：“npm error spawn git / ENOENT”'>
    重新运行安装程序，使其能够引导安装用户本地的 MinGit；或者安装 Git for Windows，然后重新打开 PowerShell。
  </Accordion>

  <Accordion title='Windows：“openclaw is not recognized”'>
    运行 `npm config get prefix`，并将该目录添加到用户 PATH（Windows 上不需要 `\bin` 后缀），然后重新打开 PowerShell。
  </Accordion>

  <Accordion title="Windows：如何获取详细的安装程序输出">
    `install.ps1` 不提供 `-Verbose` 开关。
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

## 相关内容

- [安装概览](/zh-CN/install)
- [更新](/zh-CN/install/updating)
- [卸载](/zh-CN/install/uninstall)
