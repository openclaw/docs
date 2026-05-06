---
read_when:
    - 「はじめに」のクイックスタート以外のインストール方法が必要です
    - クラウドプラットフォームにデプロイしたい
    - 更新、移行、またはアンインストールが必要です
summary: OpenClaw をインストールする - インストーラースクリプト、npm/pnpm/bun、ソースから、Docker など
title: インストール
x-i18n:
    generated_at: "2026-05-06T05:09:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d5b38787ad80f91c82aa1fd4020a11c99f440ccbf2e9b9309da336dd5883462
    source_path: install/index.md
    workflow: 16
---

## システム要件

- **Node 24**（推奨）または Node 22.14+ - インストーラスクリプトがこれを自動的に処理します
- **macOS、Linux、または Windows** - ネイティブ Windows と WSL2 の両方がサポートされています。WSL2 のほうが安定しています。[Windows](/ja-JP/platforms/windows) を参照してください。
- `pnpm` はソースからビルドする場合にのみ必要です

## 推奨: インストーラスクリプト

最も速いインストール方法です。OS を検出し、必要に応じて Node をインストールし、OpenClaw をインストールして、オンボーディングを起動します。

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

すべてのフラグと CI/自動化オプションについては、[インストーラ内部](/ja-JP/install/installer) を参照してください。

## 代替インストール方法

### ローカルプレフィックスインストーラ (`install-cli.sh`)

システム全体の Node インストールに依存せず、OpenClaw と Node を `~/.openclaw` などのローカルプレフィックス配下に保持したい場合に使用します。

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

デフォルトで npm インストールをサポートし、同じプレフィックスフロー内で git チェックアウトインストールもサポートします。完全なリファレンス: [インストーラ内部](/ja-JP/install/installer#install-clish)。

すでにインストール済みですか？`openclaw update --channel dev` と `openclaw update --channel stable` で、パッケージインストールと git インストールを切り替えられます。[更新](/ja-JP/install/updating#switch-between-npm-and-git-installs) を参照してください。

### npm、pnpm、または bun

すでに自分で Node を管理している場合:

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
    pnpm では、ビルドスクリプトを含むパッケージに明示的な承認が必要です。初回インストール後に `pnpm approve-builds -g` を実行してください。
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun はグローバル CLI インストールパスでサポートされています。Gateway ランタイムでは、引き続き Node が推奨デーモンランタイムです。
    </Note>

  </Tab>
</Tabs>

<Accordion title="トラブルシューティング: sharp ビルドエラー (npm)">
  グローバルにインストールされた libvips が原因で `sharp` が失敗する場合:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### ソースから

コントリビューター、またはローカルチェックアウトから実行したい場合:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

または、リンクを省略し、リポジトリ内から `pnpm openclaw ...` を使用します。完全な開発ワークフローについては、[セットアップ](/ja-JP/start/setup) を参照してください。

### GitHub main からインストール

```bash
npm install -g github:openclaw/openclaw#main
```

### コンテナとパッケージマネージャー

<CardGroup cols={2}>
  <Card title="Docker" href="/ja-JP/install/docker" icon="container">
    コンテナ化された、またはヘッドレスのデプロイ。
  </Card>
  <Card title="Podman" href="/ja-JP/install/podman" icon="container">
    Docker に代わるルートレスコンテナ。
  </Card>
  <Card title="Nix" href="/ja-JP/install/nix" icon="snowflake">
    Nix flake による宣言的インストール。
  </Card>
  <Card title="Ansible" href="/ja-JP/install/ansible" icon="server">
    フリートの自動プロビジョニング。
  </Card>
  <Card title="Bun" href="/ja-JP/install/bun" icon="zap">
    Bun ランタイムによる CLI 専用の使用。
  </Card>
</CardGroup>

## インストールを検証する

```bash
openclaw --version      # CLI が利用可能であることを確認
openclaw doctor         # 設定の問題を確認
openclaw gateway status # Gateway が実行中であることを検証
```

インストール後にマネージド起動を使用したい場合:

- macOS: `openclaw onboard --install-daemon` または `openclaw gateway install` による LaunchAgent
- Linux/WSL2: 同じコマンドによる systemd ユーザーサービス
- ネイティブ Windows: まず Scheduled Task を使用し、タスク作成が拒否された場合はユーザーごとの Startup フォルダーログイン項目にフォールバック

## ホスティングとデプロイ

クラウドサーバーまたは VPS に OpenClaw をデプロイします:

<CardGroup cols={3}>
  <Card title="VPS" href="/ja-JP/vps">任意の Linux VPS</Card>
  <Card title="Docker VM" href="/ja-JP/install/docker-vm-runtime">共有 Docker 手順</Card>
  <Card title="Kubernetes" href="/ja-JP/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/ja-JP/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/ja-JP/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/ja-JP/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/ja-JP/install/azure">Azure</Card>
  <Card title="Railway" href="/ja-JP/install/railway">Railway</Card>
  <Card title="Render" href="/ja-JP/install/render">Render</Card>
  <Card title="Northflank" href="/ja-JP/install/northflank">Northflank</Card>
</CardGroup>

## 更新、移行、またはアンインストール

<CardGroup cols={3}>
  <Card title="更新" href="/ja-JP/install/updating" icon="refresh-cw">
    OpenClaw を最新の状態に保ちます。
  </Card>
  <Card title="移行" href="/ja-JP/install/migrating" icon="arrow-right">
    新しいマシンに移行します。
  </Card>
  <Card title="アンインストール" href="/ja-JP/install/uninstall" icon="trash-2">
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

`$(npm prefix -g)/bin` が `$PATH` に含まれていない場合は、シェルの起動ファイル（`~/.zshrc` または `~/.bashrc`）に追加します:

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

その後、新しいターミナルを開きます。詳細については、[Node セットアップ](/ja-JP/install/node) を参照してください。
