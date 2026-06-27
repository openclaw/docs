---
read_when:
    - DockerではなくPodmanでコンテナ化されたGatewayを使いたい
summary: rootless Podman コンテナで OpenClaw を実行する
title: Podman
x-i18n:
    generated_at: "2026-06-27T11:50:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f6950956551dc3c274db33712cf66632fb5facbca4954bf67c30a8bff740c2f
    source_path: install/podman.md
    workflow: 16
---

OpenClaw Gateway を rootless Podman コンテナで実行し、現在の非 root ユーザーで管理します。

想定モデルは次のとおりです。

- Podman が gateway コンテナを実行します。
- ホストの `openclaw` CLI がコントロールプレーンです。
- 永続状態はデフォルトでホスト上の `~/.openclaw` 配下に置かれます。
- 日常的な管理では、`sudo -u openclaw`、`podman exec`、または別のサービスユーザーではなく、`openclaw --container <name> ...` を使用します。

## 前提条件

- rootless モードの **Podman**
- ホストにインストール済みの **OpenClaw CLI**
- **任意:** Quadlet 管理の自動起動が必要な場合は `systemd --user`
- **任意:** ヘッドレスホストで起動時の永続化に `loginctl enable-linger "$(whoami)"` が必要な場合のみ `sudo`

## クイックスタート

<Steps>
  <Step title="One-time setup">
    リポジトリルートから `./scripts/podman/setup.sh` を実行します。
  </Step>

  <Step title="Start the Gateway container">
    `./scripts/run-openclaw-podman.sh launch` でコンテナを起動します。
  </Step>

  <Step title="Run onboarding inside the container">
    `./scripts/run-openclaw-podman.sh launch setup` を実行し、`http://127.0.0.1:18789/` を開きます。
  </Step>

  <Step title="Manage the running container from the host CLI">
    `OPENCLAW_CONTAINER=openclaw` を設定し、ホストから通常の `openclaw` コマンドを使用します。
  </Step>
</Steps>

セットアップの詳細:

- `./scripts/podman/setup.sh` はデフォルトで rootless Podman ストアに `openclaw:local` をビルドします。`OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` を設定している場合はそれを使用します。
- 存在しない場合、`gateway.mode: "local"` を含む `~/.openclaw/openclaw.json` を作成します。
- 存在しない場合、`OPENCLAW_GATEWAY_TOKEN` を含む `~/.openclaw/.env` を作成します。
- 手動起動では、ヘルパーは `~/.openclaw/.env` から Podman 関連キーの小さな許可リストのみを読み取り、明示的なランタイム環境変数をコンテナに渡します。env ファイル全体を Podman に渡すことはありません。

Quadlet 管理セットアップ:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet は systemd ユーザーサービスに依存するため、Linux 専用のオプションです。

`OPENCLAW_PODMAN_QUADLET=1` を設定することもできます。

任意のビルド/セットアップ環境変数:

- `OPENCLAW_IMAGE` または `OPENCLAW_PODMAN_IMAGE` -- `openclaw:local` をビルドする代わりに、既存または取得済みのイメージを使用します
- `OPENCLAW_IMAGE_APT_PACKAGES` -- イメージビルド中に追加の apt パッケージをインストールします（従来の `OPENCLAW_DOCKER_APT_PACKAGES` も受け付けます）
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- イメージビルド中に追加の Python パッケージをインストールします。バージョンを固定し、信頼するパッケージインデックスのみを使用してください
- `OPENCLAW_EXTENSIONS` -- ビルド時に Plugin 依存関係を事前インストールします
- `OPENCLAW_INSTALL_BROWSER` -- ブラウザー自動化用に Chromium と Xvfb を事前インストールします（有効にするには `1` に設定）

コンテナ起動:

```bash
./scripts/run-openclaw-podman.sh launch
```

このスクリプトは、`--userns=keep-id` を使って現在の uid/gid としてコンテナを起動し、OpenClaw の状態をコンテナに bind mount します。

オンボーディング:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

その後、`http://127.0.0.1:18789/` を開き、`~/.openclaw/.env` のトークンを使用します。

Podman でのモデル認証:

- セットアップ中は OpenClaw 管理の認証を使用します。Anthropic には Anthropic API キー、Codex-backed OpenAI には OpenAI Codex ブラウザー OAuth/device-code 認証を使用します。
- Podman ランチャーは、`~/.claude` や `~/.codex` などのホスト CLI 認証情報ホームを、セットアップコンテナまたは gateway コンテナにマウントしません。
- 既存のホスト CLI ログインは、同一ホスト上の利便性のためのパスです。コンテナインストールでは、プロバイダー認証をセットアップが管理するマウント済みの `~/.openclaw` 状態に保持してください。

ホスト CLI のデフォルト:

```bash
export OPENCLAW_CONTAINER=openclaw
```

その後、次のようなコマンドは自動的にそのコンテナ内で実行されます。

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

macOS では、Podman machine により、ブラウザーが gateway から見て非ローカルに見える場合があります。
起動後に Control UI が device-auth エラーを報告する場合は、
[Podman and Tailscale](#podman--tailscale) の Tailscale ガイダンスを使用してください。

<a id="podman--tailscale"></a>

## Podman と Tailscale

HTTPS またはリモートブラウザーアクセスには、メインの Tailscale ドキュメントに従ってください。

Podman 固有の注記:

- Podman の publish host は `127.0.0.1` のままにします。
- `openclaw gateway --tailscale serve` より、ホスト管理の `tailscale serve` を優先します。
- macOS でローカルブラウザーの device-auth コンテキストが不安定な場合は、場当たり的なローカルトンネル回避策ではなく Tailscale アクセスを使用してください。

参照:

- [Tailscale](/ja-JP/gateway/tailscale)
- [Control UI](/ja-JP/web/control-ui)

## Systemd（Quadlet、任意）

`./scripts/podman/setup.sh --quadlet` を実行した場合、セットアップは次の場所に Quadlet ファイルをインストールします。

```bash
~/.config/containers/systemd/openclaw.container
```

便利なコマンド:

- **開始:** `systemctl --user start openclaw.service`
- **停止:** `systemctl --user stop openclaw.service`
- **状態:** `systemctl --user status openclaw.service`
- **ログ:** `journalctl --user -u openclaw.service -f`

Quadlet ファイルを編集した後:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

SSH/ヘッドレスホストで起動時の永続化を行うには、現在のユーザーの lingering を有効にします。

```bash
sudo loginctl enable-linger "$(whoami)"
```

## 設定、環境変数、ストレージ

- **設定ディレクトリ:** `~/.openclaw`
- **ワークスペースディレクトリ:** `~/.openclaw/workspace`
- **トークンファイル:** `~/.openclaw/.env`
- **起動ヘルパー:** `./scripts/run-openclaw-podman.sh`

起動スクリプトと Quadlet は、ホスト状態をコンテナに bind mount します。

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

デフォルトでは、これらは匿名のコンテナ状態ではなくホストディレクトリであるため、
`openclaw.json`、agent ごとの `auth-profiles.json`、channel/provider 状態、
sessions、workspace はコンテナを置き換えても保持されます。
Podman セットアップは、公開された gateway ポートの `127.0.0.1` と `localhost` 用に `gateway.controlUi.allowedOrigins` も初期設定するため、ローカル dashboard はコンテナの非 loopback bind でも動作します。

手動ランチャーで便利な環境変数:

- `OPENCLAW_PODMAN_CONTAINER` -- コンテナ名（デフォルトは `openclaw`）
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- 実行するイメージ
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- コンテナの `18789` にマップされるホストポート
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- コンテナの `18790` にマップされるホストポート
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- 公開ポートのホストインターフェイス。デフォルトは `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- コンテナ内の gateway bind モード。デフォルトは `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id`（デフォルト）、`auto`、または `host`

手動ランチャーは、コンテナ/イメージのデフォルトを確定する前に `~/.openclaw/.env` を読み取るため、これらをそこに永続化できます。

デフォルト以外の `OPENCLAW_CONFIG_DIR` または `OPENCLAW_WORKSPACE_DIR` を使用する場合は、`./scripts/podman/setup.sh` と、その後の `./scripts/run-openclaw-podman.sh launch` コマンドの両方に同じ変数を設定してください。リポジトリローカルのランチャーは、シェル間でカスタムパスの上書きを永続化しません。

Quadlet の注記:

- 生成される Quadlet サービスは、固定された強化済みのデフォルト形状を意図的に維持します。`127.0.0.1` の公開ポート、コンテナ内の `--bind lan`、および `keep-id` ユーザー名前空間です。
- `OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure`、`TimeoutStartSec=300` を固定します。
- `127.0.0.1:18789:18789`（gateway）と `127.0.0.1:18790:18790`（bridge）の両方を公開します。
- `OPENCLAW_GATEWAY_TOKEN` などの値のランタイム `EnvironmentFile` として `~/.openclaw/.env` を読み取りますが、手動ランチャーの Podman 固有の上書き許可リストは使用しません。
- カスタム公開ポート、publish host、その他の container-run フラグが必要な場合は、手動ランチャーを使用するか、`~/.config/containers/systemd/openclaw.container` を直接編集してから、サービスを reload して restart してください。

## 便利なコマンド

- **コンテナログ:** `podman logs -f openclaw`
- **コンテナ停止:** `podman stop openclaw`
- **コンテナ削除:** `podman rm -f openclaw`
- **ホスト CLI から dashboard URL を開く:** `openclaw dashboard --no-open`
- **ホスト CLI 経由のヘルス/状態:** `openclaw gateway status --deep`（RPC probe + 追加の
  service scan）

## トラブルシューティング

- **設定またはワークスペースで Permission denied（EACCES）:** コンテナはデフォルトで `--userns=keep-id` と `--user <your uid>:<your gid>` を使って実行されます。ホストの設定/ワークスペースパスが現在のユーザーに所有されていることを確認してください。
- **Gateway 起動がブロックされる（`gateway.mode=local` がない）:** `~/.openclaw/openclaw.json` が存在し、`gateway.mode="local"` を設定していることを確認してください。存在しない場合、`scripts/podman/setup.sh` がこれを作成します。
- **コンテナ CLI コマンドが間違ったターゲットに向かう:** `openclaw --container <name> ...` を明示的に使用するか、シェルで `OPENCLAW_CONTAINER=<name>` を export してください。
- **`openclaw update` が `--container` で失敗する:** 想定どおりです。イメージを再ビルドまたは pull してから、コンテナまたは Quadlet サービスを再起動してください。
- **Quadlet サービスが起動しない:** `systemctl --user daemon-reload` を実行してから、`systemctl --user start openclaw.service` を実行します。ヘッドレスシステムでは、`sudo loginctl enable-linger "$(whoami)"` も必要な場合があります。
- **SELinux が bind mount をブロックする:** デフォルトのマウント動作を変更しないでください。SELinux が enforcing または permissive の Linux では、ランチャーが自動的に `:Z` を追加します。

## 関連

- [Docker](/ja-JP/install/docker)
- [Gateway バックグラウンドプロセス](/ja-JP/gateway/background-process)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
