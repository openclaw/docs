---
read_when:
    - 你需要使用「開始使用」快速入門以外的安裝方式
    - 你想要部署到雲端平台
    - 您需要更新、遷移或解除安裝
summary: 安裝 OpenClaw - 安裝程式指令碼、npm/pnpm/bun、從原始碼安裝、Docker 等
title: 安裝
x-i18n:
    generated_at: "2026-06-27T19:27:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## 系統需求

- **Node 24**（建議）或 Node 22.19+ - 安裝程式指令碼會自動處理
- **macOS、Linux 或 Windows** - Windows 使用者可以從原生 Windows Hub 應用程式、PowerShell 命令列介面安裝程式，或 WSL2 閘道開始。請參閱 [Windows](/zh-TW/platforms/windows)。
- 只有從原始碼建置時才需要 `pnpm`

## 建議：安裝程式指令碼

最快的安裝方式。它會偵測你的作業系統、視需要安裝 Node、安裝 OpenClaw，並啟動導覽設定。

<Note>
Windows 桌面使用者也可以安裝原生 [Windows Hub](/zh-TW/platforms/windows#recommended-windows-hub) 配套應用程式，其中包含設定、系統匣狀態、聊天、節點模式，以及本機 MCP 模式。
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

若要安裝但不執行導覽設定：

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

如需所有旗標與 CI/自動化選項，請參閱[安裝程式內部機制](/zh-TW/install/installer)。

## 替代安裝方式

### 本機前綴安裝程式 (`install-cli.sh`)

如果你想讓 OpenClaw 和 Node 保留在本機前綴之下，例如
`~/.openclaw`，而不依賴系統全域 Node 安裝，請使用此方式：

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

它預設支援 npm 安裝，也支援在相同前綴流程下的 git checkout 安裝。完整參考：[安裝程式內部機制](/zh-TW/install/installer#install-clish)。

已經安裝了嗎？可使用 `openclaw update --channel dev` 和 `openclaw update --channel stable` 在套件與 git 安裝之間切換。請參閱[更新](/zh-TW/install/updating#switch-between-npm-and-git-installs)。

### npm、pnpm 或 bun

如果你已自行管理 Node：

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    託管安裝程式會為 OpenClaw 套件安裝清除 npm 新鮮度篩選器，例如 `min-release-age`。如果你使用 npm 手動安裝，仍會套用你自己的 npm 政策。
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm 需要明確核准含有建置指令碼的套件。首次安裝後請執行 `pnpm approve-builds -g`。
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun 支援全域命令列介面安裝路徑。對於閘道執行階段，Node 仍是建議的常駐程式執行階段。
    </Note>

  </Tab>
</Tabs>

### 從原始碼

適用於貢獻者，或任何想從本機 checkout 執行的人：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

或者略過連結，從 repo 內部使用 `pnpm openclaw ...`。完整開發工作流程請參閱[設定](/zh-TW/start/setup)。

### 從 GitHub main checkout 安裝

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### 容器與套件管理器

<CardGroup cols={2}>
  <Card title="Docker" href="/zh-TW/install/docker" icon="container">
    容器化或無頭部署。
  </Card>
  <Card title="Podman" href="/zh-TW/install/podman" icon="container">
    Docker 的無 root 容器替代方案。
  </Card>
  <Card title="Nix" href="/zh-TW/install/nix" icon="snowflake">
    透過 Nix flake 進行宣告式安裝。
  </Card>
  <Card title="Ansible" href="/zh-TW/install/ansible" icon="server">
    自動化機群佈建。
  </Card>
  <Card title="Bun" href="/zh-TW/install/bun" icon="zap">
    透過 Bun 執行階段進行僅命令列介面的使用。
  </Card>
</CardGroup>

## 驗證安裝

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

如果你想在安裝後使用受管理的啟動方式：

- macOS：透過 `openclaw onboard --install-daemon` 或 `openclaw gateway install` 使用 LaunchAgent
- Linux/WSL2：透過相同指令使用 systemd 使用者服務
- 原生 Windows：優先使用排定工作；如果工作建立遭拒，則退回使用每位使用者的啟動資料夾登入項目

## 託管與部署

將 OpenClaw 部署到雲端伺服器或 VPS：

<CardGroup cols={3}>
  <Card title="VPS" href="/zh-TW/vps">
    任何 Linux VPS。
  </Card>
  <Card title="Docker VM" href="/zh-TW/install/docker-vm-runtime">
    共用 Docker 步驟。
  </Card>
  <Card title="Kubernetes" href="/zh-TW/install/kubernetes">
    K8s 部署。
  </Card>
  <Card title="Fly.io" href="/zh-TW/install/fly">
    部署到 Fly.io。
  </Card>
  <Card title="Hetzner" href="/zh-TW/install/hetzner">
    Hetzner 部署。
  </Card>
  <Card title="GCP" href="/zh-TW/install/gcp">
    Google Cloud 部署。
  </Card>
  <Card title="Azure" href="/zh-TW/install/azure">
    Azure 部署。
  </Card>
  <Card title="Railway" href="/zh-TW/install/railway">
    Railway 部署。
  </Card>
  <Card title="Render" href="/zh-TW/install/render">
    Render 部署。
  </Card>
  <Card title="Northflank" href="/zh-TW/install/northflank">
    Northflank 部署。
  </Card>
</CardGroup>

## 更新、遷移或解除安裝

<CardGroup cols={3}>
  <Card title="Updating" href="/zh-TW/install/updating" icon="refresh-cw">
    讓 OpenClaw 保持最新。
  </Card>
  <Card title="Migrating" href="/zh-TW/install/migrating" icon="arrow-right">
    移到新機器。
  </Card>
  <Card title="Uninstall" href="/zh-TW/install/uninstall" icon="trash-2">
    完全移除 OpenClaw。
  </Card>
</CardGroup>

## 疑難排解：找不到 `openclaw`

如果安裝成功，但你的終端機找不到 `openclaw`：

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

如果 `$(npm prefix -g)/bin` 不在你的 `$PATH` 中，請將它加入你的 shell 啟動檔（`~/.zshrc` 或 `~/.bashrc`）：

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

然後開啟新的終端機。如需更多詳細資訊，請參閱 [Node 設定](/zh-TW/install/node)。
