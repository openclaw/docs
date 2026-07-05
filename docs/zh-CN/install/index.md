---
read_when:
    - 你需要入门指南快速开始以外的安装方法
    - 你想部署到云平台
    - 你需要更新、迁移或卸载
summary: 安装 OpenClaw - 安装脚本、npm/pnpm/bun、从源代码安装、Docker 等
title: 安装
x-i18n:
    generated_at: "2026-07-05T11:27:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc819cc6c1d57af0739a7d11f0f2834479ddabbca0571b105b8cb9325e87b145
    source_path: install/index.md
    workflow: 16
---

## 系统要求

- **Node 22.19+、23.11+ 或 24+** - Node 24 是默认目标；安装脚本会自动处理。
- **macOS、Linux 或 Windows** - Windows 用户可以从原生 Windows Hub 应用、PowerShell CLI 安装器或 WSL2 Gateway 网关开始。请参阅 [Windows](/zh-CN/platforms/windows)。
- 只有从源代码构建时才需要 `pnpm`。

## 推荐：安装脚本

最快的安装方式。它会检测你的操作系统，按需安装 Node，安装 OpenClaw，并启动新手引导。

<Note>
Windows 桌面用户也可以安装原生 [Windows Hub](/zh-CN/platforms/windows#recommended-windows-hub) 配套应用，其中包含设置、托盘状态、聊天、节点模式和本地 MCP 模式。
</Note>

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

如需安装但不运行新手引导：

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

所有标志和 CI/自动化选项，请参阅[安装器内部机制](/zh-CN/install/installer)。

## 其他安装方法

### 本地前缀安装器（`install-cli.sh`）

当你希望将 OpenClaw 和 Node 保存在本地前缀（例如
`~/.openclaw`）下，而不依赖系统级 Node 安装时，请使用此方式：

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

它默认支持 npm 安装，也支持在同一前缀流程下进行 git-checkout 安装。完整参考：[安装器内部机制](/zh-CN/install/installer#install-clish)。

已经安装？使用 `openclaw update --channel dev` 和 `openclaw update --channel stable` 在包安装和 git 安装之间切换。请参阅[更新](/zh-CN/install/updating#switch-between-npm-and-git-installs)。

### npm、pnpm 或 bun

如果你已经自行管理 Node：

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    托管安装器会为 OpenClaw 包安装清除 npm 新鲜度过滤器，例如 `min-release-age`。如果你使用 npm 手动安装，你自己的 npm 策略仍然适用。
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm 要求显式批准带有构建脚本的包。首次安装后运行 `pnpm approve-builds -g`。
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    全局 CLI 安装路径支持 Bun。对于 Gateway 网关运行时，Node 仍是推荐的守护进程运行时。
    </Note>

  </Tab>
</Tabs>

### 从源代码安装

适用于贡献者或任何想从本地检出运行的人：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

或者跳过链接，在仓库内使用 `pnpm openclaw ...`。完整开发工作流请参阅[设置](/zh-CN/start/setup)。

### 从 GitHub main 检出安装

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### 容器和包管理器

<CardGroup cols={2}>
  <Card title="Docker" href="/zh-CN/install/docker" icon="container">
    容器化或无头部署。
  </Card>
  <Card title="Podman" href="/zh-CN/install/podman" icon="container">
    Docker 的无 Root 容器替代方案。
  </Card>
  <Card title="Nix" href="/zh-CN/install/nix" icon="snowflake">
    通过 Nix flake 声明式安装。
  </Card>
  <Card title="Ansible" href="/zh-CN/install/ansible" icon="server">
    自动化集群预配。
  </Card>
  <Card title="Bun" href="/zh-CN/install/bun" icon="zap">
    通过 Bun 运行时进行仅 CLI 使用。
  </Card>
</CardGroup>

## 验证安装

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

如果你希望安装后进行托管启动：

- macOS：通过 `openclaw onboard --install-daemon` 或 `openclaw gateway install` 使用 LaunchAgent
- Linux/WSL2：通过相同命令使用 systemd 用户服务
- 原生 Windows：优先使用计划任务；如果任务创建被拒绝，则回退到按用户的 Startup 文件夹登录项

## 托管和部署

在云服务器或 VPS 上部署 OpenClaw。完整的提供商选择器（DigitalOcean、Hetzner、Hostinger、Fly.io、GCP、Azure、Railway、Northflank、Oracle Cloud、Raspberry Pi 等）请参阅 [Linux 服务器](/zh-CN/vps)，或者在 [Render](/zh-CN/install/render) 上进行声明式部署。

<CardGroup cols={3}>
  <Card title="VPS" href="/zh-CN/vps">
    选择提供商。
  </Card>
  <Card title="Docker VM" href="/zh-CN/install/docker-vm-runtime">
    共享 Docker 步骤。
  </Card>
  <Card title="Kubernetes" href="/zh-CN/install/kubernetes">
    K8s 部署。
  </Card>
</CardGroup>

## 更新、迁移或卸载

<CardGroup cols={3}>
  <Card title="Updating" href="/zh-CN/install/updating" icon="refresh-cw">
    让 OpenClaw 保持最新。
  </Card>
  <Card title="Migrating" href="/zh-CN/install/migrating" icon="arrow-right">
    迁移到新机器。
  </Card>
  <Card title="Uninstall" href="/zh-CN/install/uninstall" icon="trash-2">
    完全移除 OpenClaw。
  </Card>
</CardGroup>

## 故障排查：找不到 `openclaw`

几乎总是 PATH 问题：npm 的全局 bin 目录不在你的 shell 的 `PATH` 中。完整修复方法（包括 Windows 路径）请参阅 [Node.js 故障排查](/zh-CN/install/node#troubleshooting)。

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```
