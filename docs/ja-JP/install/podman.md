---
read_when:
    - Dockerの代わりにPodmanでコンテナ化されたGatewayを使いたい場合
summary: rootless PodmanコンテナでOpenClawを実行する
title: Podman
x-i18n:
    generated_at: "2026-04-23T14:05:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: df478ad4ac63b363c86a53bc943494b32602abfaad8576c5e899e77f7699a533
    source_path: install/podman.md
    workflow: 15
---

# Podman

現在の非rootユーザーが管理するrootless PodmanコンテナでOpenClaw Gatewayを実行します。

想定されるモデルは次のとおりです:

- PodmanがGatewayコンテナを実行します。
- ホストの `openclaw` CLIがコントロールプレーンになります。
- 永続状態はデフォルトでホスト上の `~/.openclaw` に保存されます。
- 日常の管理には、`sudo -u openclaw`、`podman exec`、または別のサービスユーザーではなく、`openclaw --container <name> ...` を使います。

## 前提条件

- rootlessモードの **Podman**
- ホストにインストールされた **OpenClaw CLI**
- **任意:** Quadlet管理の自動起動が必要なら `systemd --user`
- **任意:** ヘッドレスホストでブート永続化のために `loginctl enable-linger "$(whoami)"` を使いたい場合のみ `sudo`

## クイックスタート

<Steps>
  <Step title="初回セットアップ">
    リポジトリルートから `./scripts/podman/setup.sh` を実行します。
  </Step>

  <Step title="Gatewayコンテナを起動する">
    `./scripts/run-openclaw-podman.sh launch` でコンテナを起動します。
  </Step>

  <Step title="コンテナ内でオンボーディングを実行する">
    `./scripts/run-openclaw-podman.sh launch setup` を実行し、その後 `http://127.0.0.1:18789/` を開きます。
  </Step>

  <Step title="ホストCLIから実行中コンテナを管理する">
    `OPENCLAW_CONTAINER=openclaw` を設定し、その後はホストから通常の `openclaw` コマンドを使います。
  </Step>
</Steps>

セットアップの詳細:

- `./scripts/podman/setup.sh` は、デフォルトであなたのrootless Podmanストア内に `openclaw:local` をビルドします。`OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` を設定している場合はそれを使用します。
- `~/.openclaw/openclaw.json` が存在しない場合、`gateway.mode: "local"` を設定して作成します。
- `~/.openclaw/.env` が存在しない場合、`OPENCLAW_GATEWAY_TOKEN` を設定して作成します。
- 手動起動では、ヘルパーは `~/.openclaw/.env` からPodman関連キーの小さな許可リストのみを読み取り、明示的なランタイム環境変数をコンテナへ渡します。envファイル全体をPodmanへ渡すことはありません。

Quadlet管理セットアップ:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadletはsystemdユーザーサービスに依存するため、Linux専用オプションです。

`OPENCLAW_PODMAN_QUADLET=1` を設定することもできます。

任意のビルド/セットアップ環境変数:

- `OPENCLAW_IMAGE` または `OPENCLAW_PODMAN_IMAGE` -- `openclaw:local` をビルドする代わりに、既存/取得済みイメージを使います
- `OPENCLAW_DOCKER_APT_PACKAGES` -- イメージビルド時に追加のaptパッケージをインストールします
- `OPENCLAW_EXTENSIONS` -- ビルド時にPlugin依存関係を事前インストールします

コンテナ起動:

```bash
./scripts/run-openclaw-podman.sh launch
```

このスクリプトは、`--userns=keep-id` を付けて現在のuid/gidでコンテナを起動し、OpenClawの状態をコンテナ内へbind mountします。

オンボーディング:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

その後 `http://127.0.0.1:18789/` を開き、`~/.openclaw/.env` 内のトークンを使用してください。

ホストCLIのデフォルト:

```bash
export OPENCLAW_CONTAINER=openclaw
```

すると、次のようなコマンドは自動的にそのコンテナ内で実行されます:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # 追加サービススキャンを含む
openclaw doctor
openclaw channels login
```

macOSでは、Podman machineによりブラウザーがGatewayに対してローカルでないように見えることがあります。
起動後にControl UIがdevice-authエラーを報告する場合は、
[Podman + Tailscale](#podman--tailscale) のTailscaleガイダンスを使用してください。

<a id="podman--tailscale"></a>

## Podman + Tailscale

HTTPSまたはリモートブラウザーアクセスについては、メインのTailscaleドキュメントに従ってください。

Podman固有の注意:

- Podmanの公開ホストは `127.0.0.1` のままにしてください。
- `openclaw gateway --tailscale serve` より、ホスト管理の `tailscale serve` を推奨します。
- macOSでローカルブラウザーのdevice-authコンテキストが信頼できない場合は、その場しのぎのローカルトンネル回避策ではなくTailscaleアクセスを使ってください。

参照:

- [Tailscale](/ja-JP/gateway/tailscale)
- [Control UI](/ja-JP/web/control-ui)

## Systemd（Quadlet、任意）

`./scripts/podman/setup.sh --quadlet` を実行した場合、セットアップは次の場所にQuadletファイルをインストールします:

```bash
~/.config/containers/systemd/openclaw.container
```

便利なコマンド:

- **起動:** `systemctl --user start openclaw.service`
- **停止:** `systemctl --user stop openclaw.service`
- **状態:** `systemctl --user status openclaw.service`
- **ログ:** `journalctl --user -u openclaw.service -f`

Quadletファイルを編集した後:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

SSH/ヘッドレスホストでブート永続化を行うには、現在のユーザーに対してlingerを有効にします:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## config、env、ストレージ

- **configディレクトリ:** `~/.openclaw`
- **workspaceディレクトリ:** `~/.openclaw/workspace`
- **トークンファイル:** `~/.openclaw/.env`
- **起動ヘルパー:** `./scripts/run-openclaw-podman.sh`

起動スクリプトとQuadletは、ホストの状態をコンテナ内へbind mountします:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

デフォルトでは、これらは匿名コンテナ状態ではなくホストディレクトリなので、
`openclaw.json`、エージェントごとの `auth-profiles.json`、チャンネル/プロバイダー状態、
セッション、およびworkspaceはコンテナ置き換え後も残ります。
また、Podmanセットアップは、公開されたGatewayポート上でローカルdashboardがコンテナの非loopback bindでも動作するよう、`127.0.0.1` と `localhost` 向けに `gateway.controlUi.allowedOrigins` も初期設定します。

手動ランチャー向けの便利な環境変数:

- `OPENCLAW_PODMAN_CONTAINER` -- コンテナ名（デフォルトは `openclaw`）
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- 実行するイメージ
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- コンテナ `18789` にマップされるホストポート
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- コンテナ `18790` にマップされるホストポート
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- 公開ポート用ホストインターフェース。デフォルトは `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- コンテナ内のGateway bindモード。デフォルトは `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id`（デフォルト）、`auto`、または `host`

手動ランチャーは、コンテナ/イメージのデフォルト確定前に `~/.openclaw/.env` を読み込むため、これらをそこへ永続化できます。

デフォルト以外の `OPENCLAW_CONFIG_DIR` または `OPENCLAW_WORKSPACE_DIR` を使用する場合は、`./scripts/podman/setup.sh` とその後の `./scripts/run-openclaw-podman.sh launch` コマンドの両方に対して同じ変数を設定してください。リポジトリローカルのランチャーは、カスタムパス上書きをシェルをまたいで保持しません。

Quadletに関する注意:

- 生成されるQuadletサービスは、固定された強化済みデフォルト構成を意図的に維持します: `127.0.0.1` 公開ポート、コンテナ内では `--bind lan`、ユーザー名前空間は `keep-id`。
- `OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure`、`TimeoutStartSec=300` を固定します。
- `127.0.0.1:18789:18789`（gateway）と `127.0.0.1:18790:18790`（bridge）の両方を公開します。
- `OPENCLAW_GATEWAY_TOKEN` などの値のために `~/.openclaw/.env` をランタイム `EnvironmentFile` として読み込みますが、手動ランチャーのPodman固有上書き許可リストは使用しません。
- カスタム公開ポート、公開ホスト、またはその他のコンテナ実行フラグが必要な場合は、手動ランチャーを使うか、`~/.config/containers/systemd/openclaw.container` を直接編集し、その後サービスをreloadしてrestartしてください。

## 便利なコマンド

- **コンテナログ:** `podman logs -f openclaw`
- **コンテナ停止:** `podman stop openclaw`
- **コンテナ削除:** `podman rm -f openclaw`
- **ホストCLIからdashboard URLを開く:** `openclaw dashboard --no-open`
- **ホストCLI経由のヘルス/ステータス:** `openclaw gateway status --deep`（RPCプローブ + 追加サービススキャン）

## トラブルシューティング

- **configまたはworkspaceで Permission denied (EACCES):** コンテナはデフォルトで `--userns=keep-id` と `--user <your uid>:<your gid>` で動作します。ホスト上のconfig/workspaceパスが現在のユーザー所有であることを確認してください。
- **Gateway起動がブロックされる（`gateway.mode=local` がない）:** `~/.openclaw/openclaw.json` が存在し、`gateway.mode="local"` を設定していることを確認してください。`scripts/podman/setup.sh` は存在しない場合にこれを作成します。
- **コンテナCLIコマンドが間違ったターゲットへ送られる:** `openclaw --container <name> ...` を明示的に使うか、シェルで `OPENCLAW_CONTAINER=<name>` をexportしてください。
- **`openclaw update` が `--container` 付きで失敗する:** 想定どおりです。イメージを再ビルド/再取得し、その後コンテナまたはQuadletサービスを再起動してください。
- **Quadletサービスが起動しない:** `systemctl --user daemon-reload` を実行し、その後 `systemctl --user start openclaw.service` を実行してください。ヘッドレス環境では `sudo loginctl enable-linger "$(whoami)"` も必要になることがあります。
- **SELinuxがbind mountをブロックする:** デフォルトのマウント動作はそのままにしてください。SELinuxがenforcingまたはpermissiveのLinuxでは、ランチャーが自動的に `:Z` を追加します。

## 関連

- [Docker](/ja-JP/install/docker)
- [Gateway background process](/ja-JP/gateway/background-process)
- [Gateway troubleshooting](/ja-JP/gateway/troubleshooting)
