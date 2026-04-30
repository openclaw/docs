---
read_when:
    - DockerではなくPodmanでコンテナ化されたGatewayを使いたい場合
summary: ルートレス Podman コンテナーで OpenClaw を実行する
title: Podman
x-i18n:
    generated_at: "2026-04-30T05:21:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfdcbbdb62c2f8ca2d6d370b742003e6f92f6921a38c00ba19e810d83e350647
    source_path: install/podman.md
    workflow: 16
---

Run the OpenClaw Gateway を、現在の非 root ユーザーで管理される rootless Podman コンテナー内で実行します。

想定されるモデルは次のとおりです。

- Podman が Gateway コンテナーを実行します。
- ホストの `openclaw` CLI がコントロールプレーンです。
- 永続状態はデフォルトでホスト上の `~/.openclaw` 配下に置かれます。
- 日常的な管理には、`sudo -u openclaw`、`podman exec`、または別のサービスユーザーではなく、`openclaw --container <name> ...` を使用します。

## 前提条件

- rootless モードの **Podman**
- ホストにインストール済みの **OpenClaw CLI**
- **任意:** Quadlet 管理の自動起動が必要な場合は `systemd --user`
- **任意:** ヘッドレスホストで起動時の永続化のために `loginctl enable-linger "$(whoami)"` を使いたい場合のみ `sudo`

## クイックスタート

<Steps>
  <Step title="1 回限りのセットアップ">
    リポジトリルートから `./scripts/podman/setup.sh` を実行します。
  </Step>

  <Step title="Gateway コンテナーを起動">
    `./scripts/run-openclaw-podman.sh launch` でコンテナーを起動します。
  </Step>

  <Step title="コンテナー内でオンボーディングを実行">
    `./scripts/run-openclaw-podman.sh launch setup` を実行し、`http://127.0.0.1:18789/` を開きます。
  </Step>

  <Step title="ホスト CLI から実行中のコンテナーを管理">
    `OPENCLAW_CONTAINER=openclaw` を設定し、ホストから通常の `openclaw` コマンドを使用します。
  </Step>
</Steps>

セットアップの詳細:

- `./scripts/podman/setup.sh` はデフォルトで rootless Podman ストア内に `openclaw:local` をビルドします。`OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` を設定している場合はそれを使用します。
- 存在しない場合は、`gateway.mode: "local"` を含む `~/.openclaw/openclaw.json` を作成します。
- 存在しない場合は、`OPENCLAW_GATEWAY_TOKEN` を含む `~/.openclaw/.env` を作成します。
- 手動起動では、ヘルパーは `~/.openclaw/.env` から Podman 関連キーの小さな許可リストのみを読み取り、明示的なランタイム環境変数をコンテナーに渡します。環境ファイル全体を Podman に渡すことはありません。

Quadlet 管理のセットアップ:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet は systemd ユーザーサービスに依存するため、Linux 専用のオプションです。

`OPENCLAW_PODMAN_QUADLET=1` を設定することもできます。

任意のビルド/セットアップ環境変数:

- `OPENCLAW_IMAGE` または `OPENCLAW_PODMAN_IMAGE` -- `openclaw:local` をビルドする代わりに、既存または pull 済みのイメージを使用します
- `OPENCLAW_DOCKER_APT_PACKAGES` -- イメージビルド中に追加の apt パッケージをインストールします
- `OPENCLAW_EXTENSIONS` -- ビルド時に Plugin 依存関係を事前インストールします
- `OPENCLAW_INSTALL_BROWSER` -- ブラウザー自動化用に Chromium と Xvfb を事前インストールします（有効にするには `1` を設定）

コンテナー起動:

```bash
./scripts/run-openclaw-podman.sh launch
```

このスクリプトは `--userns=keep-id` を使って現在の uid/gid でコンテナーを起動し、OpenClaw の状態をコンテナーに bind mount します。

オンボーディング:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

その後 `http://127.0.0.1:18789/` を開き、`~/.openclaw/.env` のトークンを使用します。

ホスト CLI のデフォルト:

```bash
export OPENCLAW_CONTAINER=openclaw
```

その後、次のようなコマンドはそのコンテナー内で自動的に実行されます。

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

macOS では、Podman machine により、ブラウザーが Gateway からはローカルではないように見える場合があります。
起動後に Control UI がデバイス認証エラーを報告する場合は、
[Podman + Tailscale](#podman--tailscale) の Tailscale ガイダンスを使用してください。

<a id="podman--tailscale"></a>

## Podman + Tailscale

HTTPS またはリモートブラウザーアクセスには、メインの Tailscale ドキュメントに従ってください。

Podman 固有の注意:

- Podman の publish host は `127.0.0.1` のままにします。
- `openclaw gateway --tailscale serve` よりも、ホスト管理の `tailscale serve` を優先します。
- macOS でローカルブラウザーのデバイス認証コンテキストが不安定な場合は、その場しのぎのローカルトンネル回避策ではなく Tailscale アクセスを使用します。

参照:

- [Tailscale](/ja-JP/gateway/tailscale)
- [Control UI](/ja-JP/web/control-ui)

## Systemd（Quadlet、任意）

`./scripts/podman/setup.sh --quadlet` を実行した場合、セットアップは次の場所に Quadlet ファイルをインストールします。

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

SSH/ヘッドレスホストで起動時の永続化を行うには、現在のユーザーの lingering を有効化します。

```bash
sudo loginctl enable-linger "$(whoami)"
```

## 設定、環境変数、ストレージ

- **設定ディレクトリ:** `~/.openclaw`
- **ワークスペースディレクトリ:** `~/.openclaw/workspace`
- **トークンファイル:** `~/.openclaw/.env`
- **起動ヘルパー:** `./scripts/run-openclaw-podman.sh`

起動スクリプトと Quadlet は、ホストの状態をコンテナーに bind mount します。

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

デフォルトでは、これらは匿名のコンテナー状態ではなくホストディレクトリであるため、
`openclaw.json`、エージェントごとの `auth-profiles.json`、チャネル/プロバイダーの状態、
セッション、およびワークスペースはコンテナーの置き換え後も保持されます。
Podman セットアップは、ローカルダッシュボードがコンテナーの非ループバック bind で動作するように、公開された Gateway ポート上の `127.0.0.1` と `localhost` に対して `gateway.controlUi.allowedOrigins` もシードします。

手動ランチャーで便利な環境変数:

- `OPENCLAW_PODMAN_CONTAINER` -- コンテナー名（デフォルトは `openclaw`）
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- 実行するイメージ
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- コンテナーの `18789` にマップされるホストポート
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- コンテナーの `18790` にマップされるホストポート
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- 公開ポート用のホストインターフェイス。デフォルトは `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- コンテナー内の Gateway bind モード。デフォルトは `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id`（デフォルト）、`auto`、または `host`

手動ランチャーはコンテナー/イメージのデフォルトを確定する前に `~/.openclaw/.env` を読み取るため、これらをそこに永続化できます。

デフォルト以外の `OPENCLAW_CONFIG_DIR` または `OPENCLAW_WORKSPACE_DIR` を使用する場合は、`./scripts/podman/setup.sh` と以降の `./scripts/run-openclaw-podman.sh launch` コマンドの両方に同じ変数を設定してください。リポジトリローカルのランチャーは、シェルをまたいでカスタムパスの上書きを永続化しません。

Quadlet の注意:

- 生成される Quadlet サービスは、固定された堅牢なデフォルト形状を意図的に維持します。`127.0.0.1` の公開ポート、コンテナー内の `--bind lan`、および `keep-id` ユーザー名前空間です。
- `OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure`、`TimeoutStartSec=300` を固定します。
- `127.0.0.1:18789:18789`（Gateway）と `127.0.0.1:18790:18790`（bridge）の両方を公開します。
- `OPENCLAW_GATEWAY_TOKEN` などの値のために、ランタイム `EnvironmentFile` として `~/.openclaw/.env` を読み取りますが、手動ランチャーの Podman 固有の上書き許可リストは使用しません。
- カスタム公開ポート、publish host、またはその他の container-run フラグが必要な場合は、手動ランチャーを使用するか、`~/.config/containers/systemd/openclaw.container` を直接編集し、その後サービスを reload して restart してください。

## 便利なコマンド

- **コンテナーログ:** `podman logs -f openclaw`
- **コンテナー停止:** `podman stop openclaw`
- **コンテナー削除:** `podman rm -f openclaw`
- **ホスト CLI からダッシュボード URL を開く:** `openclaw dashboard --no-open`
- **ホスト CLI 経由のヘルス/状態:** `openclaw gateway status --deep`（RPC probe + 追加の
  サービススキャン）

## トラブルシューティング

- **設定またはワークスペースで permission denied（EACCES）:** コンテナーはデフォルトで `--userns=keep-id` と `--user <your uid>:<your gid>` で実行されます。ホストの設定/ワークスペースパスが現在のユーザー所有であることを確認してください。
- **Gateway 起動がブロックされる（`gateway.mode=local` がない）:** `~/.openclaw/openclaw.json` が存在し、`gateway.mode="local"` を設定していることを確認してください。存在しない場合は `scripts/podman/setup.sh` が作成します。
- **コンテナー CLI コマンドが誤ったターゲットに当たる:** `openclaw --container <name> ...` を明示的に使用するか、シェルで `OPENCLAW_CONTAINER=<name>` を export してください。
- **`openclaw update` が `--container` 付きで失敗する:** 想定どおりです。イメージを rebuild/pull してから、コンテナーまたは Quadlet サービスを再起動してください。
- **Quadlet サービスが起動しない:** `systemctl --user daemon-reload` を実行し、その後 `systemctl --user start openclaw.service` を実行します。ヘッドレスシステムでは、`sudo loginctl enable-linger "$(whoami)"` も必要な場合があります。
- **SELinux が bind mount をブロックする:** デフォルトの mount 動作はそのままにしてください。SELinux が enforcing または permissive の Linux では、ランチャーが自動的に `:Z` を追加します。

## 関連

- [Docker](/ja-JP/install/docker)
- [Gateway バックグラウンドプロセス](/ja-JP/gateway/background-process)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
