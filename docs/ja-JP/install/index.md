---
read_when:
    - はじめにのクイックスタート以外のインストール方法が必要です
    - クラウドプラットフォームにデプロイしたい
    - 更新、移行、またはアンインストールが必要です
summary: OpenClaw のインストール - インストーラースクリプト、npm/pnpm/bun、ソースから、Docker など
title: インストール
x-i18n:
    generated_at: "2026-06-27T11:49:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## システム要件

- **Node 24**（推奨）または Node 22.19+ - インストーラースクリプトがこれを自動的に処理します
- **macOS、Linux、または Windows** - Windows ユーザーは、ネイティブの Windows Hub アプリ、PowerShell CLI インストーラー、または WSL2 Gateway から始められます。[Windows](/ja-JP/platforms/windows) を参照してください。
- ソースからビルドする場合のみ `pnpm` が必要です

## 推奨: インストーラースクリプト

最速のインストール方法です。OS を検出し、必要に応じて Node をインストールし、OpenClaw をインストールして、オンボーディングを起動します。

<Note>
Windows デスクトップユーザーは、セットアップ、トレイステータス、チャット、ノードモード、ローカル MCP モードを含むネイティブの [Windows Hub](/ja-JP/platforms/windows#recommended-windows-hub) コンパニオンアプリもインストールできます。
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

オンボーディングを実行せずにインストールするには:

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

すべてのフラグと CI/自動化オプションについては、[インストーラー内部](/ja-JP/install/installer) を参照してください。

## 代替インストール方法

### ローカルプレフィックスインストーラー (`install-cli.sh`)

システム全体の Node インストールに依存せず、OpenClaw と Node を
`~/.openclaw` のようなローカルプレフィックス配下に保持したい場合に使用します:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

デフォルトで npm インストールに対応し、同じプレフィックスフロー配下での
git-checkout インストールにも対応しています。完全なリファレンス: [インストーラー内部](/ja-JP/install/installer#install-clish)。

すでにインストール済みですか？`openclaw update --channel dev` と `openclaw update --channel stable` でパッケージインストールと git インストールを切り替えられます。
[更新](/ja-JP/install/updating#switch-between-npm-and-git-installs) を参照してください。

### npm、pnpm、または bun

すでに自分で Node を管理している場合:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    ホスト型インストーラーは、OpenClaw パッケージインストール時に `min-release-age` などの npm 鮮度フィルターを解除します。npm で手動インストールする場合は、自分の npm ポリシーが引き続き適用されます。
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm では、ビルドスクリプトを含むパッケージに明示的な承認が必要です。初回インストール後に `pnpm approve-builds -g` を実行してください。
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun はグローバル CLI インストールパスでサポートされています。Gateway ランタイムでは、Node が引き続き推奨されるデーモンランタイムです。
    </Note>

  </Tab>
</Tabs>

### ソースから

コントリビューター、またはローカルチェックアウトから実行したい場合:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

または、リンクを省略してリポジトリ内から `pnpm openclaw ...` を使用します。完全な開発ワークフローについては [セットアップ](/ja-JP/start/setup) を参照してください。

### GitHub main チェックアウトからインストール

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### コンテナとパッケージマネージャー

<CardGroup cols={2}>
  <Card title="Docker" href="/ja-JP/install/docker" icon="container">
    コンテナ化またはヘッドレスデプロイ。
  </Card>
  <Card title="Podman" href="/ja-JP/install/podman" icon="container">
    Docker の rootless コンテナ代替。
  </Card>
  <Card title="Nix" href="/ja-JP/install/nix" icon="snowflake">
    Nix flake による宣言的インストール。
  </Card>
  <Card title="Ansible" href="/ja-JP/install/ansible" icon="server">
    自動化されたフリートプロビジョニング。
  </Card>
  <Card title="Bun" href="/ja-JP/install/bun" icon="zap">
    Bun ランタイムによる CLI 専用の使用。
  </Card>
</CardGroup>

## インストールの確認

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

インストール後に管理された起動を使用したい場合:

- macOS: `openclaw onboard --install-daemon` または `openclaw gateway install` による LaunchAgent
- Linux/WSL2: 同じコマンドによる systemd ユーザーサービス
- ネイティブ Windows: まず Scheduled Task。タスク作成が拒否された場合は、ユーザーごとの Startup-folder ログイン項目にフォールバック

## ホスティングとデプロイ

クラウドサーバーまたは VPS に OpenClaw をデプロイします:

<CardGroup cols={3}>
  <Card title="VPS" href="/ja-JP/vps">
    任意の Linux VPS。
  </Card>
  <Card title="Docker VM" href="/ja-JP/install/docker-vm-runtime">
    共通の Docker 手順。
  </Card>
  <Card title="Kubernetes" href="/ja-JP/install/kubernetes">
    K8s デプロイ。
  </Card>
  <Card title="Fly.io" href="/ja-JP/install/fly">
    Fly.io にデプロイ。
  </Card>
  <Card title="Hetzner" href="/ja-JP/install/hetzner">
    Hetzner デプロイ。
  </Card>
  <Card title="GCP" href="/ja-JP/install/gcp">
    Google Cloud デプロイ。
  </Card>
  <Card title="Azure" href="/ja-JP/install/azure">
    Azure デプロイ。
  </Card>
  <Card title="Railway" href="/ja-JP/install/railway">
    Railway デプロイ。
  </Card>
  <Card title="Render" href="/ja-JP/install/render">
    Render デプロイ。
  </Card>
  <Card title="Northflank" href="/ja-JP/install/northflank">
    Northflank デプロイ。
  </Card>
</CardGroup>

## 更新、移行、アンインストール

<CardGroup cols={3}>
  <Card title="Updating" href="/ja-JP/install/updating" icon="refresh-cw">
    OpenClaw を最新の状態に保ちます。
  </Card>
  <Card title="Migrating" href="/ja-JP/install/migrating" icon="arrow-right">
    新しいマシンへ移行します。
  </Card>
  <Card title="Uninstall" href="/ja-JP/install/uninstall" icon="trash-2">
    OpenClaw を完全に削除します。
  </Card>
</CardGroup>

## トラブルシューティング: `openclaw` が見つからない

インストールは成功したが、ターミナルで `openclaw` が見つからない場合:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

`$(npm prefix -g)/bin` が `$PATH` に含まれていない場合は、シェルの起動ファイル（`~/.zshrc` または `~/.bashrc`）に追加してください:

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

その後、新しいターミナルを開きます。詳細は [Node セットアップ](/ja-JP/install/node) を参照してください。
