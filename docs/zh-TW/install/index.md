---
read_when:
    - 你需要「開始使用」快速入門以外的安裝方式
    - 你想要部署到雲端平台
    - 你需要更新、遷移或解除安裝
summary: 安裝 OpenClaw — 安裝程式指令碼、npm/pnpm/bun、從原始碼安裝、Docker 等方式
title: 安裝
x-i18n:
    generated_at: "2026-07-14T13:52:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: dc6c6c33294852c90d2d2904b78ff8b0483b8e72a380d5835c5bdda67547de0c
    source_path: install/index.md
    workflow: 16
---

## 系統需求

- **Node 22.22.3+、24.15+ 或 25.9+** - Node 24 是預設目標版本；安裝程式指令碼會自動處理。
- **macOS、Linux 或 Windows** - Windows 使用者可以從原生 Windows Hub 應用程式、PowerShell 命令列介面安裝程式或 WSL2 閘道開始使用。請參閱 [Windows](/zh-TW/platforms/windows)。
- 只有從原始碼建置時才需要 `pnpm`。

## 建議方式：安裝程式指令碼

這是最快的安裝方式。它會偵測你的作業系統、視需要安裝 Node、安裝 OpenClaw，並啟動初始設定。

<Note>
Windows 桌面使用者也可以安裝原生 [Windows Hub](/zh-TW/platforms/windows#recommended-windows-hub) 輔助應用程式，其中包含設定、系統匣狀態、聊天、節點模式和本機 MCP 模式。
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

若要安裝但不執行初始設定：

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

如需所有旗標和 CI／自動化選項，請參閱[安裝程式內部機制](/zh-TW/install/installer)。

## 替代安裝方式

### 本機前綴安裝程式（`install-cli.sh`）

如果你想將 OpenClaw 和 Node 保留在
`~/.openclaw` 之類的本機前綴下，而不依賴全系統的 Node 安裝，請使用此方式：

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

它預設支援 npm 安裝，也支援在相同前綴流程下進行 git 簽出安裝。完整參考資料：[安裝程式內部機制](/zh-TW/install/installer#install-clish)。

已經安裝了嗎？使用 `openclaw update --channel dev` 和 `openclaw update --channel stable`
在套件安裝與 git 安裝之間切換。請參閱
[更新](/zh-TW/install/updating#switch-between-npm-and-git-installs)。

### npm、pnpm 或 bun

如果你已自行管理 Node：

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    託管的安裝程式會為 OpenClaw 套件安裝清除 npm 的新鮮度篩選條件，例如 `min-release-age`。
    如果你使用 npm 手動安裝，仍會套用你自己的 npm 政策。
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm 要求明確核准含有建置指令碼的套件。首次安裝後，請執行 `pnpm approve-builds -g`。
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun 可以安裝全域套件，但產生的 `openclaw` 執行檔需要受支援的 Node 執行階段，因為 OpenClaw 狀態使用 `node:sqlite`。
    </Note>

  </Tab>
</Tabs>

### 從原始碼安裝

適用於貢獻者，或任何想要從本機簽出版本執行的人：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

你也可以略過連結步驟，直接在儲存庫內使用 `pnpm openclaw ...`。如需完整的開發工作流程，請參閱[設定](/zh-TW/start/setup)。

### 從 GitHub main 簽出版本安裝

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### 容器和套件管理工具

<CardGroup cols={2}>
  <Card title="Docker" href="/zh-TW/install/docker" icon="container">
    容器化或無介面部署。
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
    選用的相依套件安裝程式和套件指令碼執行工具。
  </Card>
</CardGroup>

## 驗證安裝

```bash
openclaw --version      # 確認命令列介面可用
openclaw doctor         # 檢查設定問題
openclaw gateway status # 驗證閘道正在執行
```

如果你希望安裝後由系統管理啟動：

- macOS：透過 `openclaw onboard --install-daemon` 或 `openclaw gateway install` 使用 LaunchAgent
- Linux／WSL2：透過相同命令使用 systemd 使用者服務
- 原生 Windows：優先使用 Scheduled Task；若建立工作遭拒，則改用每位使用者的 Startup 資料夾登入項目

## 託管與部署

在雲端伺服器或 VPS 上部署 OpenClaw。請參閱 [Linux 伺服器](/zh-TW/vps)以取得完整的
供應商選擇器（DigitalOcean、Hetzner、Hostinger、Fly.io、GCP、Azure、Railway、
Northflank、Oracle Cloud、Raspberry Pi 等），或在
[Render](/zh-TW/install/render) 上進行宣告式部署。

<CardGroup cols={3}>
  <Card title="VPS" href="/zh-TW/vps">
    選擇供應商。
  </Card>
  <Card title="Docker VM" href="/zh-TW/install/docker-vm-runtime">
    共用的 Docker 步驟。
  </Card>
  <Card title="Kubernetes" href="/zh-TW/install/kubernetes">
    K8s 部署。
  </Card>
</CardGroup>

## 更新、遷移或解除安裝

<CardGroup cols={3}>
  <Card title="更新" href="/zh-TW/install/updating" icon="refresh-cw">
    讓 OpenClaw 保持最新狀態。
  </Card>
  <Card title="遷移" href="/zh-TW/install/migrating" icon="arrow-right">
    移至新機器。
  </Card>
  <Card title="解除安裝" href="/zh-TW/install/uninstall" icon="trash-2">
    完整移除 OpenClaw。
  </Card>
</CardGroup>

## 疑難排解：找不到 `openclaw`

這幾乎總是 PATH 問題：npm 的全域二進位檔目錄不在 shell 的 `PATH` 中。請參閱 [Node.js 疑難排解](/zh-TW/install/node#troubleshooting)以取得完整修正方式，包括 Windows 路徑。

```bash
node -v           # 已安裝 Node 嗎？
npm prefix -g     # 全域套件位於何處？
echo "$PATH"      # 全域二進位檔目錄在 PATH 中嗎？
```
