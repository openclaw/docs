---
read_when:
    - はじめにのクイックスタート以外のインストール方法が必要です
    - クラウドプラットフォームにデプロイしたい場合
    - 更新、移行、またはアンインストールが必要です
summary: OpenClaw のインストール - インストーラースクリプト、npm/pnpm/bun、ソース、Docker など
title: インストール
x-i18n:
    generated_at: "2026-07-16T11:43:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc6c6c33294852c90d2d2904b78ff8b0483b8e72a380d5835c5bdda67547de0c
    source_path: install/index.md
    workflow: 16
---

## システム要件

- **Node 22.22.3+、24.15+、または25.9+** - Node 24がデフォルトの対象です。インストーラースクリプトが自動的に処理します。
- **macOS、Linux、またはWindows** - Windowsユーザーは、ネイティブWindows Hubアプリ、PowerShell CLIインストーラー、またはWSL2 Gatewayから始められます。[Windows](/ja-JP/platforms/windows)を参照してください。
- `pnpm`は、ソースからビルドする場合にのみ必要です。

## 推奨：インストーラースクリプト

最も速いインストール方法です。OSを検出し、必要に応じてNodeをインストールしてから、OpenClawをインストールし、オンボーディングを開始します。

<Note>
Windowsデスクトップユーザーは、セットアップ、トレイステータス、チャット、Nodeモード、ローカルMCPモードを備えたネイティブの[Windows Hub](/ja-JP/platforms/windows#recommended-windows-hub)コンパニオンアプリもインストールできます。
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

オンボーディングを実行せずにインストールするには：

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

すべてのフラグとCI／自動化オプションについては、[インストーラーの内部仕様](/ja-JP/install/installer)を参照してください。

## その他のインストール方法

### ローカルプレフィックスインストーラー（`install-cli.sh`）

システム全体のNodeインストールに依存せず、OpenClawとNodeを
`~/.openclaw`などのローカルプレフィックス内に保持する場合に使用します：

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

デフォルトでnpmインストールをサポートし、同じプレフィックスフローで
gitチェックアウトからのインストールにも対応しています。詳細なリファレンス：[インストーラーの内部仕様](/ja-JP/install/installer#install-clish)。

すでにインストール済みですか？`openclaw update --channel dev`と`openclaw update --channel stable`を使用して、
パッケージインストールとgitインストールを切り替えられます。
[更新](/ja-JP/install/updating#switch-between-npm-and-git-installs)を参照してください。

### npm、pnpm、またはbun

Nodeを自分で管理している場合：

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    ホスト型インストーラーは、OpenClawパッケージのインストール時に`min-release-age`などの
    npmの鮮度フィルターを解除します。npmを使用して手動でインストールする場合は、
    独自のnpmポリシーが引き続き適用されます。
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpmでは、ビルドスクリプトを含むパッケージに明示的な承認が必要です。最初のインストール後に`pnpm approve-builds -g`を実行してください。
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bunはグローバルパッケージをインストールできますが、OpenClawの状態管理では`node:sqlite`を使用するため、生成される`openclaw`実行ファイルにはサポート対象のNodeランタイムが必要です。
    </Note>

  </Tab>
</Tabs>

### ソースから

コントリビューター、またはローカルチェックアウトから実行したい場合：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

または、リンクを省略し、リポジトリ内から`pnpm openclaw ...`を使用します。開発ワークフローの詳細については、[セットアップ](/ja-JP/start/setup)を参照してください。

### GitHubのmainチェックアウトからインストール

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### コンテナとパッケージマネージャー

<CardGroup cols={2}>
  <Card title="Docker" href="/ja-JP/install/docker" icon="container">
    コンテナ化またはヘッドレス環境へのデプロイ。
  </Card>
  <Card title="Podman" href="/ja-JP/install/podman" icon="container">
    Dockerに代わるルートレスコンテナ。
  </Card>
  <Card title="Nix" href="/ja-JP/install/nix" icon="snowflake">
    Nix flakeによる宣言的インストール。
  </Card>
  <Card title="Ansible" href="/ja-JP/install/ansible" icon="server">
    フリートの自動プロビジョニング。
  </Card>
  <Card title="Bun" href="/ja-JP/install/bun" icon="zap">
    オプションの依存関係インストーラー兼パッケージスクリプトランナー。
  </Card>
</CardGroup>

## インストールの確認

```bash
openclaw --version      # CLIが利用可能であることを確認
openclaw doctor         # 設定の問題を確認
openclaw gateway status # Gatewayが実行中であることを確認
```

インストール後に管理された自動起動を使用する場合：

- macOS：`openclaw onboard --install-daemon`または`openclaw gateway install`によるLaunchAgent
- Linux／WSL2：同じコマンドによるsystemdユーザーサービス
- ネイティブWindows：まずScheduled Taskを使用し、タスク作成が拒否された場合はユーザーごとのStartupフォルダーのログイン項目にフォールバック

## ホスティングとデプロイ

OpenClawをクラウドサーバーまたはVPSにデプロイします。プロバイダーの全選択肢
（DigitalOcean、Hetzner、Hostinger、Fly.io、GCP、Azure、Railway、
Northflank、Oracle Cloud、Raspberry Piなど）については[Linuxサーバー](/ja-JP/vps)を参照するか、
[Render](/ja-JP/install/render)上に宣言的にデプロイしてください。

<CardGroup cols={3}>
  <Card title="VPS" href="/ja-JP/vps">
    プロバイダーを選択します。
  </Card>
  <Card title="Docker VM" href="/ja-JP/install/docker-vm-runtime">
    共通のDocker手順。
  </Card>
  <Card title="Kubernetes" href="/ja-JP/install/kubernetes">
    K8sへのデプロイ。
  </Card>
</CardGroup>

## 更新、移行、またはアンインストール

<CardGroup cols={3}>
  <Card title="更新" href="/ja-JP/install/updating" icon="refresh-cw">
    OpenClawを最新の状態に保ちます。
  </Card>
  <Card title="移行" href="/ja-JP/install/migrating" icon="arrow-right">
    新しいマシンに移行します。
  </Card>
  <Card title="アンインストール" href="/ja-JP/install/uninstall" icon="trash-2">
    OpenClawを完全に削除します。
  </Card>
</CardGroup>

## トラブルシューティング：`openclaw`が見つからない

ほとんどの場合、PATHの問題です。npmのグローバルbinディレクトリがシェルの`PATH`に含まれていません。Windowsのパスを含む完全な修正方法については、[Node.jsのトラブルシューティング](/ja-JP/install/node#troubleshooting)を参照してください。

```bash
node -v           # Nodeはインストール済み？
npm prefix -g     # グローバルパッケージの場所は？
echo "$PATH"      # グローバルbinディレクトリはPATHに含まれている？
```
