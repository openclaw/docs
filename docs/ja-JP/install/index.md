---
read_when:
    - はじめにのクイックスタート以外のインストール方法が必要です
    - クラウドプラットフォームにデプロイしたい
    - 更新、移行、またはアンインストールが必要です
summary: OpenClaw のインストール - インストーラスクリプト、npm/pnpm/bun、ソースから、Docker など
title: インストール
x-i18n:
    generated_at: "2026-07-05T11:32:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc819cc6c1d57af0739a7d11f0f2834479ddabbca0571b105b8cb9325e87b145
    source_path: install/index.md
    workflow: 16
---

## システム要件

- **Node 22.19+、23.11+、または 24+** - Node 24 がデフォルトのターゲットです。インストーラスクリプトがこれを自動的に処理します。
- **macOS、Linux、または Windows** - Windows ユーザーは、ネイティブ Windows Hub アプリ、PowerShell CLI インストーラー、または WSL2 Gateway から始められます。[Windows](/ja-JP/platforms/windows) を参照してください。
- `pnpm` はソースからビルドする場合にのみ必要です。

## 推奨: インストーラースクリプト

最速のインストール方法です。OS を検出し、必要に応じて Node をインストールし、OpenClaw をインストールして、オンボーディングを起動します。

<Note>
Windows デスクトップユーザーは、ネイティブの [Windows Hub](/ja-JP/platforms/windows#recommended-windows-hub) コンパニオンアプリもインストールできます。これにはセットアップ、トレイ状態、チャット、ノードモード、ローカル MCP モードが含まれます。
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
`~/.openclaw` のようなローカルプレフィックス配下に保持したい場合に使用します。

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

デフォルトで npm インストールに対応し、同じプレフィックスフロー配下で
git チェックアウトインストールにも対応します。完全なリファレンス: [インストーラー内部](/ja-JP/install/installer#install-clish)。

すでにインストール済みですか？`openclaw update --channel dev` と `openclaw update --channel stable` でパッケージインストールと git インストールを切り替えられます。
[更新](/ja-JP/install/updating#switch-between-npm-and-git-installs) を参照してください。

### npm、pnpm、または bun

すでに Node を自分で管理している場合:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    ホスト型インストーラーは、OpenClaw パッケージのインストール時に `min-release-age` などの npm 鮮度フィルターをクリアします。npm で手動インストールする場合は、独自の npm ポリシーが引き続き適用されます。
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm では、ビルドスクリプトを持つパッケージに明示的な承認が必要です。初回インストール後に `pnpm approve-builds -g` を実行してください。
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun はグローバル CLI インストールパスでサポートされています。Gateway ランタイムでは、Node が引き続き推奨のデーモンランタイムです。
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

またはリンクを省略し、リポジトリ内から `pnpm openclaw ...` を使用します。完全な開発ワークフローについては [セットアップ](/ja-JP/start/setup) を参照してください。

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
    Docker のルートレスコンテナ代替。
  </Card>
  <Card title="Nix" href="/ja-JP/install/nix" icon="snowflake">
    Nix flake による宣言的インストール。
  </Card>
  <Card title="Ansible" href="/ja-JP/install/ansible" icon="server">
    自動化されたフリートプロビジョニング。
  </Card>
  <Card title="Bun" href="/ja-JP/install/bun" icon="zap">
    Bun ランタイムによる CLI のみの使用。
  </Card>
</CardGroup>

## インストールを確認する

```bash
openclaw --version      # CLI が利用可能か確認
openclaw doctor         # 設定の問題を確認
openclaw gateway status # Gateway が実行中か確認
```

インストール後に管理された起動を使いたい場合:

- macOS: `openclaw onboard --install-daemon` または `openclaw gateway install` による LaunchAgent
- Linux/WSL2: 同じコマンドによる systemd ユーザーサービス
- ネイティブ Windows: まず Scheduled Task を使用し、タスク作成が拒否された場合はユーザーごとの Startup フォルダーログイン項目にフォールバック

## ホスティングとデプロイ

OpenClaw をクラウドサーバーまたは VPS にデプロイします。完全な
プロバイダー選択（DigitalOcean、Hetzner、Hostinger、Fly.io、GCP、Azure、Railway、
Northflank、Oracle Cloud、Raspberry Pi など）については [Linux サーバー](/ja-JP/vps) を参照するか、
[Render](/ja-JP/install/render) で宣言的にデプロイしてください。

<CardGroup cols={3}>
  <Card title="VPS" href="/ja-JP/vps">
    プロバイダーを選択します。
  </Card>
  <Card title="Docker VM" href="/ja-JP/install/docker-vm-runtime">
    共有 Docker 手順。
  </Card>
  <Card title="Kubernetes" href="/ja-JP/install/kubernetes">
    K8s デプロイ。
  </Card>
</CardGroup>

## 更新、移行、またはアンインストール

<CardGroup cols={3}>
  <Card title="更新" href="/ja-JP/install/updating" icon="refresh-cw">
    OpenClaw を最新の状態に保ちます。
  </Card>
  <Card title="移行" href="/ja-JP/install/migrating" icon="arrow-right">
    新しいマシンへ移行します。
  </Card>
  <Card title="アンインストール" href="/ja-JP/install/uninstall" icon="trash-2">
    OpenClaw を完全に削除します。
  </Card>
</CardGroup>

## トラブルシューティング: `openclaw` が見つからない

ほとんどの場合 PATH の問題です。npm のグローバル bin ディレクトリがシェルの `PATH` に含まれていません。Windows のパスを含む完全な修正方法については、[Node.js トラブルシューティング](/ja-JP/install/node#troubleshooting) を参照してください。

```bash
node -v           # Node はインストール済み？
npm prefix -g     # グローバルパッケージはどこ？
echo "$PATH"      # グローバル bin dir は PATH に含まれている？
```
