---
read_when:
    - 你需要「開始使用」快速入門以外的安裝方式
    - 您想部署到雲端平台
    - 你需要更新、遷移或解除安裝
summary: 安裝 OpenClaw - 安裝程式指令碼、npm/pnpm/bun、從原始碼安裝、Docker 等
title: 安裝
x-i18n:
    generated_at: "2026-05-06T02:51:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d5b38787ad80f91c82aa1fd4020a11c99f440ccbf2e9b9309da336dd5883462
    source_path: install/index.md
    workflow: 16
---

## 系統需求

- **Node 24**（建議）或 Node 22.14+ - 安裝程式腳本會自動處理
- **macOS、Linux 或 Windows** - 支援原生 Windows 和 WSL2；WSL2 較穩定。請參閱 [Windows](/zh-TW/platforms/windows)。
- 只有從原始碼建置時才需要 `pnpm`

## 建議：安裝程式腳本

最快的安裝方式。它會偵測你的作業系統、視需要安裝 Node、安裝 OpenClaw，並啟動入門設定。

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

若要安裝但不執行入門設定：

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

如需所有旗標和 CI/自動化選項，請參閱[安裝程式內部機制](/zh-TW/install/installer)。

## 其他安裝方式

### 本機 prefix 安裝程式（`install-cli.sh`）

當你想將 OpenClaw 和 Node 保留在本機 prefix（例如
`~/.openclaw`）底下，而不依賴系統範圍的 Node 安裝時，請使用此方式：

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

它預設支援 npm 安裝，也支援在相同 prefix 流程下進行 git-checkout 安裝。完整參考：[安裝程式內部機制](/zh-TW/install/installer#install-clish)。

已經安裝了嗎？使用 `openclaw update --channel dev` 和 `openclaw update --channel stable` 在套件安裝與 git 安裝之間切換。請參閱[更新](/zh-TW/install/updating#switch-between-npm-and-git-installs)。

### npm、pnpm 或 bun

如果你已自行管理 Node：

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm 需要明確核准含有建置腳本的套件。第一次安裝後請執行 `pnpm approve-builds -g`。
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    全域 CLI 安裝路徑支援 Bun。對於 Gateway 執行階段，Node 仍是建議的 daemon 執行階段。
    </Note>

  </Tab>
</Tabs>

<Accordion title="Troubleshooting: sharp build errors (npm)">
  如果 `sharp` 因全域安裝的 libvips 而失敗：

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### 從原始碼安裝

適用於貢獻者，或任何想從本機 checkout 執行的人：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

或者略過 link，並在 repo 內使用 `pnpm openclaw ...`。完整開發工作流程請參閱[設定](/zh-TW/start/setup)。

### 從 GitHub main 安裝

```bash
npm install -g github:openclaw/openclaw#main
```

### 容器與套件管理器

<CardGroup cols={2}>
  <Card title="Docker" href="/zh-TW/install/docker" icon="container">
    容器化或無介面部署。
  </Card>
  <Card title="Podman" href="/zh-TW/install/podman" icon="container">
    Docker 的 rootless 容器替代方案。
  </Card>
  <Card title="Nix" href="/zh-TW/install/nix" icon="snowflake">
    透過 Nix flake 進行宣告式安裝。
  </Card>
  <Card title="Ansible" href="/zh-TW/install/ansible" icon="server">
    自動化機群佈建。
  </Card>
  <Card title="Bun" href="/zh-TW/install/bun" icon="zap">
    透過 Bun 執行階段使用，僅限 CLI。
  </Card>
</CardGroup>

## 驗證安裝

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

如果你想在安裝後使用受管理的啟動：

- macOS：透過 `openclaw onboard --install-daemon` 或 `openclaw gateway install` 使用 LaunchAgent
- Linux/WSL2：透過相同指令使用 systemd 使用者服務
- 原生 Windows：優先使用排程工作；如果建立工作遭拒，則 fallback 到每位使用者的 Startup 資料夾登入項目

## 託管與部署

在雲端伺服器或 VPS 上部署 OpenClaw：

<CardGroup cols={3}>
  <Card title="VPS" href="/zh-TW/vps">任何 Linux VPS</Card>
  <Card title="Docker VM" href="/zh-TW/install/docker-vm-runtime">共用 Docker 步驟</Card>
  <Card title="Kubernetes" href="/zh-TW/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/zh-TW/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/zh-TW/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/zh-TW/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/zh-TW/install/azure">Azure</Card>
  <Card title="Railway" href="/zh-TW/install/railway">Railway</Card>
  <Card title="Render" href="/zh-TW/install/render">Render</Card>
  <Card title="Northflank" href="/zh-TW/install/northflank">Northflank</Card>
</CardGroup>

## 更新、遷移或解除安裝

<CardGroup cols={3}>
  <Card title="Updating" href="/zh-TW/install/updating" icon="refresh-cw">
    讓 OpenClaw 保持最新狀態。
  </Card>
  <Card title="Migrating" href="/zh-TW/install/migrating" icon="arrow-right">
    移至新機器。
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

然後開啟新的終端機。更多詳細資訊請參閱 [Node 設定](/zh-TW/install/node)。
