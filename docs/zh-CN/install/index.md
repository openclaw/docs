---
read_when:
    - 你需要使用入门指南快速开始之外的安装方式
    - 你想要部署到云平台
    - 你需要更新、迁移或卸载
summary: 安装 OpenClaw——安装脚本、npm/pnpm/bun、从源码安装、Docker 及更多方式
title: 安装
x-i18n:
    generated_at: "2026-07-11T20:40:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc819cc6c1d57af0739a7d11f0f2834479ddabbca0571b105b8cb9325e87b145
    source_path: install/index.md
    workflow: 16
---

## 系统要求

- **Node 22.19+、23.11+ 或 24+** - 默认以 Node 24 为目标版本；安装脚本会自动处理。
- **macOS、Linux 或 Windows** - Windows 用户可以从原生 Windows Hub 应用、PowerShell CLI 安装程序或 WSL2 Gateway 网关开始。请参阅 [Windows](/zh-CN/platforms/windows)。
- 只有从源代码构建时才需要 `pnpm`。

## 推荐：安装脚本

这是最快的安装方式。它会检测你的操作系统，在需要时安装 Node，安装 OpenClaw，并启动新手引导。

<Note>
Windows 桌面用户还可以安装原生 [Windows Hub](/zh-CN/platforms/windows#recommended-windows-hub) 配套应用，其中包括设置、托盘状态、聊天、节点模式和本地 MCP 模式。
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

有关所有标志及 CI/自动化选项，请参阅[安装程序内部机制](/zh-CN/install/installer)。

## 其他安装方式

### 本地前缀安装程序（`install-cli.sh`）

如果你希望将 OpenClaw 和 Node 保存在 `~/.openclaw` 等本地前缀下，而不依赖系统级 Node 安装，请使用此方式：

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

默认支持通过 npm 安装，也支持在同一前缀流程下通过 git 检出安装。完整参考：[安装程序内部机制](/zh-CN/install/installer#install-clish)。

已经安装？可使用 `openclaw update --channel dev` 和 `openclaw update --channel stable` 在软件包安装与 git 安装之间切换。请参阅[更新](/zh-CN/install/updating#switch-between-npm-and-git-installs)。

### npm、pnpm 或 bun

如果你已经自行管理 Node：

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    托管安装程序在安装 OpenClaw 软件包时会清除 `min-release-age` 等 npm 时效性筛选规则。如果你使用 npm 手动安装，你自己的 npm 策略仍然适用。
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm 要求明确批准包含构建脚本的软件包。首次安装后，请运行 `pnpm approve-builds -g`。
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

适用于贡献者或希望从本地检出版本运行的用户：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

也可以跳过链接，在仓库内使用 `pnpm openclaw ...`。完整开发工作流请参阅[设置](/zh-CN/start/setup)。

### 从 GitHub main 检出版本安装

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### 容器和软件包管理器

<CardGroup cols={2}>
  <Card title="Docker" href="/zh-CN/install/docker" icon="container">
    容器化或无头部署。
  </Card>
  <Card title="Podman" href="/zh-CN/install/podman" icon="container">
    Docker 的无 Root 权限容器替代方案。
  </Card>
  <Card title="Nix" href="/zh-CN/install/nix" icon="snowflake">
    通过 Nix flake 进行声明式安装。
  </Card>
  <Card title="Ansible" href="/zh-CN/install/ansible" icon="server">
    自动化集群配置。
  </Card>
  <Card title="Bun" href="/zh-CN/install/bun" icon="zap">
    通过 Bun 运行时仅使用 CLI。
  </Card>
</CardGroup>

## 验证安装

```bash
openclaw --version      # 确认 CLI 可用
openclaw doctor         # 检查配置问题
openclaw gateway status # 验证 Gateway 网关正在运行
```

如果你希望安装后进行托管式启动：

- macOS：通过 `openclaw onboard --install-daemon` 或 `openclaw gateway install` 使用 LaunchAgent
- Linux/WSL2：通过相同命令使用 systemd 用户服务
- 原生 Windows：优先使用计划任务；如果任务创建被拒绝，则回退到每用户“启动”文件夹中的登录启动项

## 托管和部署

在云服务器或 VPS 上部署 OpenClaw。有关完整的提供商选择器（DigitalOcean、Hetzner、Hostinger、Fly.io、GCP、Azure、Railway、Northflank、Oracle Cloud、Raspberry Pi 等），请参阅 [Linux 服务器](/zh-CN/vps)；也可以在 [Render](/zh-CN/install/render) 上进行声明式部署。

<CardGroup cols={3}>
  <Card title="VPS" href="/zh-CN/vps">
    选择提供商。
  </Card>
  <Card title="Docker VM" href="/zh-CN/install/docker-vm-runtime">
    通用 Docker 步骤。
  </Card>
  <Card title="Kubernetes" href="/zh-CN/install/kubernetes">
    K8s 部署。
  </Card>
</CardGroup>

## 更新、迁移或卸载

<CardGroup cols={3}>
  <Card title="更新" href="/zh-CN/install/updating" icon="refresh-cw">
    使 OpenClaw 保持最新状态。
  </Card>
  <Card title="迁移" href="/zh-CN/install/migrating" icon="arrow-right">
    迁移到新机器。
  </Card>
  <Card title="卸载" href="/zh-CN/install/uninstall" icon="trash-2">
    完全移除 OpenClaw。
  </Card>
</CardGroup>

## 故障排查：找不到 `openclaw`

这几乎总是 PATH 问题：npm 的全局二进制目录不在 shell 的 `PATH` 中。有关完整修复方法（包括 Windows 路径），请参阅 [Node.js 故障排查](/zh-CN/install/node#troubleshooting)。

```bash
node -v           # 是否已安装 Node？
npm prefix -g     # 全局软件包位于何处？
echo "$PATH"      # 全局二进制目录是否在 PATH 中？
```
