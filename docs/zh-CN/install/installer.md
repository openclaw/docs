---
read_when:
    - 你想了解 `openclaw.ai/install.sh`
    - 你想自动化安装（CI / 无头环境）
    - 你想从 GitHub 检出副本安装
summary: 安装脚本（install.sh、install-cli.sh、install.ps1）的工作原理、标志和自动化
title: 安装程序内部机制
x-i18n:
    generated_at: "2026-05-02T05:00:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 119d94edae8cae2460e1bce9fe6bb31dc3c91d23443090cd34bf10adde9e10f1
    source_path: install/installer.md
    workflow: 16
---

OpenClaw 随附三个安装脚本，由 `openclaw.ai` 提供。

| 脚本                               | 平台                 | 作用                                                                                                           |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 按需安装 Node，通过 npm（默认）或 git 安装 OpenClaw，并可运行新手引导。                   |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | 将 Node + OpenClaw 安装到本地前缀（`~/.openclaw`），支持 npm 或 git checkout 模式。无需 root 权限。 |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 按需安装 Node，通过 npm（默认）或 git 安装 OpenClaw，并可运行新手引导。                   |

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
如果安装成功但在新终端中找不到 `openclaw`，请参阅 [Node.js 故障排除](/zh-CN/install/node#troubleshooting)。
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
推荐用于 macOS/Linux/WSL 上的大多数交互式安装。
</Tip>

### 流程（install.sh）

<Steps>
  <Step title="检测操作系统">
    支持 macOS 和 Linux（包括 WSL）。如果检测到 macOS，会在缺少 Homebrew 时安装它。
  </Step>
  <Step title="默认确保 Node.js 24 可用">
    检查 Node 版本，并在需要时安装 Node 24（macOS 上使用 Homebrew，Linux apt/dnf/yum 上使用 NodeSource 设置脚本）。为兼容性，OpenClaw 仍支持 Node 22 LTS，当前为 `22.14+`。
  </Step>
  <Step title="确保 Git 可用">
    如果缺少 Git，则安装它。
  </Step>
  <Step title="安装 OpenClaw">
    - `npm` 方法（默认）：全局 npm 安装
    - `git` 方法：克隆/更新仓库，使用 pnpm 安装依赖，构建，然后在 `~/.local/bin/openclaw` 安装包装器

  </Step>
  <Step title="安装后任务">
    - 尽力刷新已加载的 Gateway 网关服务（`openclaw gateway install --force`，然后重启）
    - 在升级和 git 安装时运行 `openclaw doctor --non-interactive`（尽力执行）
    - 在适当时尝试新手引导（TTY 可用、未禁用新手引导，并且 bootstrap/配置检查通过）
    - 默认设置 `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### 源码 checkout 检测

如果在 OpenClaw checkout 内运行（`package.json` + `pnpm-workspace.yaml`），脚本会提供：

- 使用 checkout（`git`），或
- 使用全局安装（`npm`）

如果没有可用 TTY 且未设置安装方法，它会默认使用 `npm` 并发出警告。

如果方法选择无效或 `--install-method` 值无效，脚本会以代码 `2` 退出。

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
  <Tab title="通过 npm 使用 GitHub main">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="试运行">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="标志参考">

| 标志                                  | 描述                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | 选择安装方法（默认：`npm`）。别名：`--method`  |
| `--npm`                               | npm 方法的快捷方式                                    |
| `--git`                               | git 方法的快捷方式。别名：`--github`                 |
| `--version <version\|dist-tag\|spec>` | npm 版本、dist-tag 或 package spec（默认：`latest`） |
| `--beta`                              | 如果可用则使用 beta dist-tag，否则回退到 `latest`  |
| `--git-dir <path>`                    | checkout 目录（默认：`~/openclaw`）。别名：`--dir` |
| `--no-git-update`                     | 对现有 checkout 跳过 `git pull`                      |
| `--no-prompt`                         | 禁用提示                                            |
| `--no-onboard`                        | 跳过新手引导                                            |
| `--onboard`                           | 启用新手引导                                          |
| `--dry-run`                           | 打印操作而不应用更改                     |
| `--verbose`                           | 启用调试输出（`set -x`，npm notice 级别日志）      |
| `--help`                              | 显示用法（`-h`）                                          |

  </Accordion>

  <Accordion title="环境变量参考">

| 变量                                                | 描述                                   |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | 安装方法                                |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm 版本、dist-tag 或 package spec        |
| `OPENCLAW_BETA=0\|1`                                    | 如果可用则使用 beta                         |
| `OPENCLAW_GIT_DIR=<path>`                               | checkout 目录                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | 切换 git 更新                            |
| `OPENCLAW_NO_PROMPT=1`                                  | 禁用提示                               |
| `OPENCLAW_NO_ONBOARD=1`                                 | 跳过新手引导                               |
| `OPENCLAW_DRY_RUN=1`                                    | 试运行模式                                  |
| `OPENCLAW_VERBOSE=1`                                    | 调试模式                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm 日志级别                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | 控制 sharp/libvips 行为（默认：`1`） |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
专为希望所有内容都位于本地前缀下（默认 `~/.openclaw`）且不依赖系统 Node 的环境而设计。默认支持 npm 安装，也支持在同一前缀流程下进行 git-checkout 安装。
</Info>

### 流程（install-cli.sh）

<Steps>
  <Step title="安装本地 Node 运行时">
    将固定的受支持 Node LTS tarball（版本嵌入在脚本中，并独立更新）下载到 `<prefix>/tools/node-v<version>`，并验证 SHA-256。
  </Step>
  <Step title="确保 Git 可用">
    如果缺少 Git，会尝试在 Linux 上通过 apt/dnf/yum 安装，或在 macOS 上通过 Homebrew 安装。
  </Step>
  <Step title="在前缀下安装 OpenClaw">
    - `npm` 方法（默认）：使用 npm 安装到该前缀下，然后将包装器写入 `<prefix>/bin/openclaw`
    - `git` 方法：克隆/更新 checkout（默认 `~/openclaw`），并仍将包装器写入 `<prefix>/bin/openclaw`

  </Step>
  <Step title="刷新已加载的 Gateway 网关服务">
    如果已有 Gateway 网关服务从同一前缀加载，脚本会运行
    `openclaw gateway install --force`，然后运行 `openclaw gateway restart`，并
    尽力探测 Gateway 网关健康状态。
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

| 标志                        | 描述                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | 安装前缀（默认：`~/.openclaw`）                                         |
| `--install-method npm\|git` | 选择安装方法（默认：`npm`）。别名：`--method`                       |
| `--npm`                     | npm 方法的快捷方式                                                         |
| `--git`, `--github`         | git 方法的快捷方式                                                         |
| `--git-dir <path>`          | Git checkout 目录（默认：`~/openclaw`）。别名：`--dir`                  |
| `--version <ver>`           | OpenClaw 版本或 dist-tag（默认：`latest`）                                |
| `--node-version <ver>`      | Node 版本（默认：`22.22.0`）                                               |
| `--json`                    | 发出 NDJSON 事件                                                              |
| `--onboard`                 | 安装后运行 `openclaw onboard`                                            |
| `--no-onboard`              | 跳过新手引导（默认）                                                       |
| `--set-npm-prefix`          | 在 Linux 上，如果当前前缀不可写，则强制将 npm 前缀设为 `~/.npm-global` |
| `--help`                    | 显示用法（`-h`）                                                               |

  </Accordion>

  <Accordion title="环境变量参考">

| 变量                                        | 描述                                          |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | 安装前缀                                      |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | 安装方式                                      |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw 版本或 dist-tag                      |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node 版本                                     |
| `OPENCLAW_GIT_DIR=<path>`                   | git 安装的 Git 检出目录                       |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 为现有检出切换 git 更新                       |
| `OPENCLAW_NO_ONBOARD=1`                     | 跳过新手引导                                  |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm 日志级别                                  |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | 控制 sharp/libvips 行为（默认：`1`）          |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### 流程（install.ps1）

<Steps>
  <Step title="确保 PowerShell + Windows 环境">
    需要 PowerShell 5+。
  </Step>
  <Step title="默认确保 Node.js 24">
    如果缺失，会尝试通过 winget 安装，然后是 Chocolatey，再然后是 Scoop。Node 22 LTS（当前为 `22.14+`）仍受支持以保持兼容性。
  </Step>
  <Step title="安装 OpenClaw">
    - `npm` 方式（默认）：使用选定的 `-Tag` 执行全局 npm 安装，并从可写的安装器临时目录启动，因此在 `C:\` 等受保护文件夹中打开的 shell 仍可正常工作
    - `git` 方式：克隆/更新仓库，使用 pnpm 安装/构建，并在 `%USERPROFILE%\.local\bin\openclaw.cmd` 安装包装器

  </Step>
  <Step title="安装后任务">
    - 尽可能将所需的 bin 目录添加到用户 PATH
    - 尽力刷新已加载的 Gateway 网关服务（`openclaw gateway install --force`，然后重启）
    - 在升级和 git 安装时运行 `openclaw doctor --non-interactive`（尽力执行）

  </Step>
  <Step title="处理失败">
    `iwr ... | iex` 和 scriptblock 安装会报告终止错误，但不会关闭当前 PowerShell 会话。直接使用 `powershell -File` / `pwsh -File` 安装时，自动化场景仍会以非零状态退出。
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
  <Tab title="通过 npm 使用 GitHub main">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
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
  <Tab title="调试跟踪">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="标志参考">

| 标志                        | 描述                                                        |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | 安装方式（默认：`npm`）                                    |
| `-Tag <tag\|version\|spec>` | npm dist-tag、版本或包 spec（默认：`latest`）              |
| `-GitDir <path>`            | 检出目录（默认：`%USERPROFILE%\openclaw`）                 |
| `-NoOnboard`                | 跳过新手引导                                               |
| `-NoGitUpdate`              | 跳过 `git pull`                                            |
| `-DryRun`                   | 仅打印操作                                                 |

  </Accordion>

  <Accordion title="环境变量参考">

| 变量                               | 描述       |
| ---------------------------------- | ---------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | 安装方式   |
| `OPENCLAW_GIT_DIR=<path>`          | 检出目录   |
| `OPENCLAW_NO_ONBOARD=1`            | 跳过新手引导 |
| `OPENCLAW_GIT_UPDATE=0`            | 禁用 git pull |
| `OPENCLAW_DRY_RUN=1`               | 试运行模式 |

  </Accordion>
</AccordionGroup>

<Note>
如果使用 `-InstallMethod git` 且缺少 Git，该脚本会退出并打印 Git for Windows 链接。
</Note>

---

## CI 和自动化

使用非交互式标志/环境变量以获得可预测的运行结果。

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

## 故障排除

<AccordionGroup>
  <Accordion title="为什么需要 Git？">
    `git` 安装方式需要 Git。对于 `npm` 安装，仍会检查/安装 Git，以避免依赖项使用 git URL 时出现 `spawn git ENOENT` 失败。
  </Accordion>

  <Accordion title="为什么 npm 在 Linux 上遇到 EACCES？">
    某些 Linux 设置会将 npm 全局前缀指向 root 拥有的路径。`install.sh` 可以将前缀切换到 `~/.npm-global`，并将 PATH 导出追加到 shell rc 文件（当这些文件存在时）。
  </Accordion>

  <Accordion title="sharp/libvips 问题">
    脚本默认设置 `SHARP_IGNORE_GLOBAL_LIBVIPS=1`，以避免 sharp 基于系统 libvips 构建。要覆盖此设置：

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows：“npm error spawn git / ENOENT”'>
    安装 Git for Windows，重新打开 PowerShell，然后重新运行安装器。
  </Accordion>

  <Accordion title='Windows：“openclaw is not recognized”'>
    运行 `npm config get prefix`，并将该目录添加到你的用户 PATH（Windows 上不需要 `\bin` 后缀），然后重新打开 PowerShell。
  </Accordion>

  <Accordion title="Windows：如何获取详细安装器输出">
    `install.ps1` 目前不公开 `-Verbose` 开关。
    使用 PowerShell 跟踪进行脚本级诊断：

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="安装后找不到 openclaw">
    通常是 PATH 问题。参见 [Node.js 故障排除](/zh-CN/install/node#troubleshooting)。
  </Accordion>
</AccordionGroup>

## 相关内容

- [安装概览](/zh-CN/install)
- [更新](/zh-CN/install/updating)
- [卸载](/zh-CN/install/uninstall)
