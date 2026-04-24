---
read_when:
    - はじめに のクイックスタート以外のインストール方法が必要な場合
    - クラウドプラットフォームにデプロイしたい場合
    - 更新、移行、またはアンインストールが必要な場合
summary: OpenClaw をインストールする — インストーラースクリプト、npm/pnpm/bun、ソースから、Docker など
title: インストール
x-i18n:
    generated_at: "2026-04-24T05:04:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48cb531ff09cd9ba076e5a995753c6acd5273f58d9d0f1e51010bf77a18bf85e
    source_path: install/index.md
    workflow: 15
---

## システム要件

- **Node 24**（推奨）または Node 22.14+ — インストーラースクリプトがこれを自動処理します
- **macOS、Linux、または Windows** — ネイティブ Windows と WSL2 の両方をサポートしますが、WSL2 のほうが安定しています。[Windows](/ja-JP/platforms/windows) を参照してください。
- `pnpm` はソースからビルドする場合にのみ必要です

## 推奨: インストーラースクリプト

最速のインストール方法です。OS を検出し、必要なら Node をインストールし、OpenClaw をインストールして、オンボーディングを開始します。

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

すべてのフラグと CI/自動化オプションについては、[Installer internals](/ja-JP/install/installer) を参照してください。

## 代替のインストール方法

### ローカルプレフィックスインストーラー（`install-cli.sh`）

システム全体の Node インストールに依存せず、OpenClaw と Node を
`~/.openclaw` のようなローカルプレフィックス配下に保持したい場合は、これを使ってください。

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

これはデフォルトで npm install をサポートし、同じ
プレフィックスフロー内で git checkout install もサポートします。完全なリファレンス: [Installer internals](/ja-JP/install/installer#install-clish)。

### npm、pnpm、または bun

すでに Node を自分で管理している場合:

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
    pnpm では、ビルドスクリプトを持つパッケージに明示的な承認が必要です。最初のインストール後に `pnpm approve-builds -g` を実行してください。
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun はグローバル CLI インストール経路ではサポートされています。Gateway ランタイムについては、引き続き Node が推奨 daemon ランタイムです。
    </Note>

  </Tab>
</Tabs>

<Accordion title="トラブルシューティング: `sharp` ビルドエラー（npm）">
  グローバルにインストールされた libvips が原因で `sharp` が失敗する場合:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### ソースから

コントリビューター、またはローカル checkout から実行したい人向け:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

または link を省略して、リポジトリ内から `pnpm openclaw ...` を使ってください。完全な開発ワークフローは [Setup](/ja-JP/start/setup) を参照してください。

### GitHub main からインストール

```bash
npm install -g github:openclaw/openclaw#main
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
    Nix flake 経由の宣言的インストール。
  </Card>
  <Card title="Ansible" href="/ja-JP/install/ansible" icon="server">
    フリートの自動プロビジョニング。
  </Card>
  <Card title="Bun" href="/ja-JP/install/bun" icon="zap">
    Bun ランタイム経由の CLI 専用利用。
  </Card>
</CardGroup>

## インストールを確認する

```bash
openclaw --version      # CLI が使えることを確認
openclaw doctor         # config の問題を確認
openclaw gateway status # Gateway が動作していることを確認
```

インストール後に管理された起動を使いたい場合:

- macOS: `openclaw onboard --install-daemon` または `openclaw gateway install` 経由の LaunchAgent
- Linux/WSL2: 同じコマンド経由の systemd ユーザーサービス
- ネイティブ Windows: まず Scheduled Task。タスク作成が拒否された場合はユーザーごとの Startup フォルダー login item にフォールバック

## ホスティングとデプロイ

クラウドサーバーまたは VPS に OpenClaw をデプロイする:

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
  <Card title="Updating" href="/ja-JP/install/updating" icon="refresh-cw">
    OpenClaw を最新の状態に保つ。
  </Card>
  <Card title="Migrating" href="/ja-JP/install/migrating" icon="arrow-right">
    新しいマシンへ移行する。
  </Card>
  <Card title="Uninstall" href="/ja-JP/install/uninstall" icon="trash-2">
    OpenClaw を完全に削除する。
  </Card>
</CardGroup>

## トラブルシューティング: `openclaw` が見つからない

インストールは成功したのに、ターミナルで `openclaw` が見つからない場合:

```bash
node -v           # Node はインストール済み？
npm prefix -g     # グローバルパッケージの場所は？
echo "$PATH"      # グローバル bin ディレクトリは PATH に入っている？
```

`$(npm prefix -g)/bin` が `$PATH` に含まれていない場合は、シェル起動ファイル（`~/.zshrc` または `~/.bashrc`）に追加してください。

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

その後、新しいターミナルを開いてください。詳細は [Node setup](/ja-JP/install/node) を参照してください。
