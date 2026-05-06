---
read_when:
    - Docker ではなく Podman でコンテナ化された Gateway が必要な場合
summary: ルートレス Podman コンテナーで OpenClaw を実行する
title: Podman
x-i18n:
    generated_at: "2026-05-06T05:10:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44f89feede7fe10325810599dad457f8fcc3adbd9c139e26df67b9ad12019d56
    source_path: install/podman.md
    workflow: 16
---

OpenClaw Gateway を rootless Podman コンテナで実行し、現在の非 root ユーザーで管理します。

想定するモデルは次のとおりです。

- Podman が gateway コンテナを実行します。
- ホストの `openclaw` CLI が制御プレーンです。
- 永続状態はデフォルトでホスト上の `~/.openclaw` に置かれます。
- 日常的な管理では、`sudo -u openclaw`、`podman exec`、または別のサービスユーザーの代わりに `openclaw --container <name> ...` を使用します。

## 前提条件

- rootless モードの **Podman**
- ホストにインストール済みの **OpenClaw CLI**
- **任意:** Quadlet 管理の自動起動が必要な場合は `systemd --user`
- **任意:** ヘッドレスホストで起動時の永続化に `loginctl enable-linger "$(whoami)"` を使う場合のみ `sudo`

## クイックスタート

<Steps>
  <Step title="One-time setup">
    リポジトリルートから `./scripts/podman/setup.sh` を実行します。
  </Step>

  <Step title="Start the Gateway container">
    `./scripts/run-openclaw-podman.sh launch` でコンテナを起動します。
  </Step>

  <Step title="Run onboarding inside the container">
    `./scripts/run-openclaw-podman.sh launch setup` を実行してから、`http://127.0.0.1:18789/` を開きます。
  </Step>

  <Step title="Manage the running container from the host CLI">
    `OPENCLAW_CONTAINER=openclaw` を設定してから、ホストで通常の `openclaw` コマンドを使用します。
  </Step>
</Steps>

セットアップの詳細:

- `./scripts/podman/setup.sh` はデフォルトで rootless Podman ストア内に `openclaw:local` をビルドします。`OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` を設定している場合はそれを使用します。
- 存在しない場合は、`gateway.mode: "local"` を含む `~/.openclaw/openclaw.json` を作成します。
- 存在しない場合は、`OPENCLAW_GATEWAY_TOKEN` を含む `~/.openclaw/.env` を作成します。
- 手動起動では、ヘルパーは `~/.openclaw/.env` から Podman 関連キーの小さな許可リストだけを読み取り、明示的な実行時環境変数をコンテナに渡します。env ファイル全体を Podman に渡すことはありません。

Quadlet 管理のセットアップ:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet は systemd ユーザーサービスに依存するため、Linux 専用のオプションです。

`OPENCLAW_PODMAN_QUADLET=1` を設定することもできます。

任意のビルド/セットアップ環境変数:

- `OPENCLAW_IMAGE` または `OPENCLAW_PODMAN_IMAGE` -- `openclaw:local` をビルドする代わりに、既存または取得済みのイメージを使用します
- `OPENCLAW_DOCKER_APT_PACKAGES` -- イメージビルド中に追加の apt パッケージをインストールします
- `OPENCLAW_EXTENSIONS` -- ビルド時に Plugin 依存関係を事前インストールします
- `OPENCLAW_INSTALL_BROWSER` -- ブラウザー自動化用に Chromium と Xvfb を事前インストールします（有効化するには `1` に設定）

コンテナ起動:

```bash
./scripts/run-openclaw-podman.sh launch
```

このスクリプトは、`--userns=keep-id` を使って現在の uid/gid としてコンテナを起動し、OpenClaw の状態をコンテナ内に bind mount します。

オンボーディング:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

次に `http://127.0.0.1:18789/` を開き、`~/.openclaw/.env` のトークンを使用します。

ホスト CLI のデフォルト:

```bash
export OPENCLAW_CONTAINER=openclaw
```

すると、次のようなコマンドは自動的にそのコンテナ内で実行されます。

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

macOS では、Podman machine によりブラウザーが gateway に対してローカルではないように見える場合があります。
起動後にコントロール UI がデバイス認証エラーを報告する場合は、
[Podman と Tailscale](#podman--tailscale) のガイダンスを使用してください。

<a id="podman--tailscale"></a>

## Podman と Tailscale

HTTPS またはリモートブラウザーアクセスについては、メインの Tailscale ドキュメントに従ってください。

Podman 固有の注意:

- Podman の公開ホストは `127.0.0.1` のままにします。
- `openclaw gateway --tailscale serve` よりも、ホスト管理の `tailscale serve` を優先します。
- macOS でローカルブラウザーのデバイス認証コンテキストが不安定な場合は、場当たり的なローカルトンネル回避策ではなく Tailscale アクセスを使用します。

参照:

- [Tailscale](/ja-JP/gateway/tailscale)
- [コントロール UI](/ja-JP/web/control-ui)

## Systemd（Quadlet、任意）

`./scripts/podman/setup.sh --quadlet` を実行した場合、セットアップは Quadlet ファイルを次の場所にインストールします。

```bash
~/.config/containers/systemd/openclaw.container
```

便利なコマンド:

- **起動:** `systemctl --user start openclaw.service`
- **停止:** `systemctl --user stop openclaw.service`
- **状態:** `systemctl --user status openclaw.service`
- **ログ:** `journalctl --user -u openclaw.service -f`

Quadlet ファイルを編集した後:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

SSH/ヘッドレスホストで起動時の永続化を行うには、現在のユーザーの linger を有効化します。

```bash
sudo loginctl enable-linger "$(whoami)"
```

## 設定、環境変数、ストレージ

- **設定ディレクトリ:** `~/.openclaw`
- **ワークスペースディレクトリ:** `~/.openclaw/workspace`
- **トークンファイル:** `~/.openclaw/.env`
- **起動ヘルパー:** `./scripts/run-openclaw-podman.sh`

起動スクリプトと Quadlet は、ホストの状態をコンテナ内に bind mount します。

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

デフォルトでは、これらは匿名のコンテナ状態ではなくホストディレクトリです。そのため、
`openclaw.json`、エージェントごとの `auth-profiles.json`、channel/provider の状態、
セッション、ワークスペースはコンテナを置き換えても保持されます。
Podman セットアップは、公開された gateway ポート上の `127.0.0.1` と `localhost` に対して `gateway.controlUi.allowedOrigins` もシードするため、ローカルダッシュボードはコンテナの非ループバック bind で動作します。

手動ランチャーで便利な環境変数:

- `OPENCLAW_PODMAN_CONTAINER` -- コンテナ名（デフォルトは `openclaw`）
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- 実行するイメージ
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- コンテナの `18789` にマップするホストポート
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- コンテナの `18790` にマップするホストポート
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- 公開ポートのホストインターフェイス。デフォルトは `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- コンテナ内の gateway bind モード。デフォルトは `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id`（デフォルト）、`auto`、または `host`

手動ランチャーはコンテナ/イメージのデフォルトを確定する前に `~/.openclaw/.env` を読み取るため、これらをそこに永続化できます。

デフォルト以外の `OPENCLAW_CONFIG_DIR` または `OPENCLAW_WORKSPACE_DIR` を使用する場合は、`./scripts/podman/setup.sh` と後続の `./scripts/run-openclaw-podman.sh launch` コマンドの両方に同じ変数を設定してください。リポジトリローカルのランチャーは、カスタムパスの上書きをシェル間で永続化しません。

Quadlet の注意:

- 生成される Quadlet サービスは、固定された強化済みのデフォルト形状を意図的に維持します。`127.0.0.1` の公開ポート、コンテナ内の `--bind lan`、`keep-id` ユーザー名前空間です。
- `OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure`、`TimeoutStartSec=300` を固定します。
- `127.0.0.1:18789:18789`（gateway）と `127.0.0.1:18790:18790`（bridge）の両方を公開します。
- `OPENCLAW_GATEWAY_TOKEN` などの値について、実行時の `EnvironmentFile` として `~/.openclaw/.env` を読み取りますが、手動ランチャーの Podman 固有の上書き許可リストは使用しません。
- カスタム公開ポート、公開ホスト、またはその他の container-run フラグが必要な場合は、手動ランチャーを使用するか、`~/.config/containers/systemd/openclaw.container` を直接編集してから、サービスをリロードして再起動します。

## 便利なコマンド

- **コンテナログ:** `podman logs -f openclaw`
- **コンテナを停止:** `podman stop openclaw`
- **コンテナを削除:** `podman rm -f openclaw`
- **ホスト CLI からダッシュボード URL を開く:** `openclaw dashboard --no-open`
- **ホスト CLI 経由のヘルス/状態:** `openclaw gateway status --deep`（RPC プローブ + 追加の
  サービススキャン）

## トラブルシューティング

- **設定またはワークスペースで Permission denied（EACCES）:** コンテナはデフォルトで `--userns=keep-id` と `--user <your uid>:<your gid>` を使って実行されます。ホストの設定/ワークスペースパスが現在のユーザーに所有されていることを確認してください。
- **Gateway の起動がブロックされる（`gateway.mode=local` がない）:** `~/.openclaw/openclaw.json` が存在し、`gateway.mode="local"` を設定していることを確認してください。存在しない場合、`scripts/podman/setup.sh` がこれを作成します。
- **コンテナ CLI コマンドが誤ったターゲットに到達する:** `openclaw --container <name> ...` を明示的に使用するか、シェルで `OPENCLAW_CONTAINER=<name>` を export します。
- **`openclaw update` が `--container` 付きで失敗する:** 想定どおりです。イメージを再ビルドまたは pull してから、コンテナまたは Quadlet サービスを再起動してください。
- **Quadlet サービスが起動しない:** `systemctl --user daemon-reload` を実行してから、`systemctl --user start openclaw.service` を実行します。ヘッドレスシステムでは `sudo loginctl enable-linger "$(whoami)"` も必要な場合があります。
- **SELinux が bind mount をブロックする:** デフォルトの mount 動作はそのままにしてください。Linux で SELinux が enforcing または permissive の場合、ランチャーは自動で `:Z` を追加します。

## 関連

- [Docker](/ja-JP/install/docker)
- [Gateway バックグラウンドプロセス](/ja-JP/gateway/background-process)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
