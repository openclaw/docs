---
read_when:
    - Docker の代わりに Podman を使ったコンテナ化 Gateway が必要な場合
summary: rootless Podman コンテナで OpenClaw を実行する
title: Podman
x-i18n:
    generated_at: "2026-04-24T05:05:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 559ac707e0a3ef173d0300ee2f8c6f4ed664ff5afbf1e3f1848312a9d441e9e4
    source_path: install/podman.md
    workflow: 15
---

rootless Podman コンテナで OpenClaw Gateway を実行し、現在の非 root ユーザーで管理します。

想定されるモデルは次のとおりです。

- Podman が Gateway コンテナを実行する。
- ホスト上の `openclaw` CLI が control plane になる。
- 永続 state はデフォルトでホスト上の `~/.openclaw` に保存される。
- 日常的な管理では、`sudo -u openclaw`、`podman exec`、別のサービスユーザーの代わりに `openclaw --container <name> ...` を使う。

## 前提条件

- rootless モードの **Podman**
- ホストにインストールされた **OpenClaw CLI**
- **任意:** Quadlet 管理の自動起動が必要なら `systemd --user`
- **任意:** ヘッドレスホストでブート時永続化のために `loginctl enable-linger "$(whoami)"` を使うなら `sudo`

## クイックスタート

<Steps>
  <Step title="初回セットアップ">
    リポジトリルートで `./scripts/podman/setup.sh` を実行します。
  </Step>

  <Step title="Gateway コンテナを起動する">
    `./scripts/run-openclaw-podman.sh launch` でコンテナを起動します。
  </Step>

  <Step title="コンテナ内でオンボーディングを実行する">
    `./scripts/run-openclaw-podman.sh launch setup` を実行し、その後 `http://127.0.0.1:18789/` を開きます。
  </Step>

  <Step title="ホスト CLI から実行中コンテナを管理する">
    `OPENCLAW_CONTAINER=openclaw` を設定し、その後はホストから通常の `openclaw` コマンドを使います。
  </Step>
</Steps>

セットアップ詳細:

- `./scripts/podman/setup.sh` は、デフォルトでは rootless Podman ストアに `openclaw:local` をビルドします。`OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` を設定していれば、それを使います。
- `~/.openclaw/openclaw.json` が存在しない場合は `gateway.mode: "local"` 付きで作成します。
- `~/.openclaw/.env` が存在しない場合は `OPENCLAW_GATEWAY_TOKEN` を含めて作成します。
- 手動起動では、ヘルパーは `~/.openclaw/.env` から Podman 関連キーの小さな allowlist だけを読み取り、明示的な runtime env var をコンテナに渡します。env ファイル全体を Podman に渡すことはありません。

Quadlet 管理セットアップ:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet は systemd user service に依存するため Linux 専用オプションです。

`OPENCLAW_PODMAN_QUADLET=1` を設定することもできます。

任意のビルド/セットアップ env var:

- `OPENCLAW_IMAGE` または `OPENCLAW_PODMAN_IMAGE` -- `openclaw:local` をビルドせず、既存/取得済みイメージを使う
- `OPENCLAW_DOCKER_APT_PACKAGES` -- イメージビルド中に追加の apt パッケージをインストールする
- `OPENCLAW_EXTENSIONS` -- Plugin 依存関係をビルド時に事前インストールする

コンテナ起動:

```bash
./scripts/run-openclaw-podman.sh launch
```

このスクリプトは、現在の uid/gid で `--userns=keep-id` を使ってコンテナを起動し、
OpenClaw state をコンテナへ bind mount します。

オンボーディング:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

その後 `http://127.0.0.1:18789/` を開き、`~/.openclaw/.env` の token を使ってください。

ホスト CLI のデフォルト:

```bash
export OPENCLAW_CONTAINER=openclaw
```

その後、次のようなコマンドは自動的にそのコンテナ内で実行されます。

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # 追加のサービススキャンを含む
openclaw doctor
openclaw channels login
```

macOS では、Podman machine によって browser が Gateway に対してローカルに見えなくなることがあります。
起動後に Control UI が device-auth エラーを報告する場合は、
[Podman + Tailscale](#podman--tailscale) の Tailscale ガイダンスを使ってください。

<a id="podman--tailscale"></a>

## Podman + Tailscale

HTTPS または remote browser アクセスについては、メインの Tailscale ドキュメントに従ってください。

Podman 固有の注意:

- Podman の publish host は `127.0.0.1` のままにしてください。
- `openclaw gateway --tailscale serve` より、ホスト管理の `tailscale serve` を優先してください。
- macOS でローカル browser の device-auth コンテキストが不安定な場合は、場当たり的なローカルトンネル回避策ではなく Tailscale アクセスを使ってください。

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

Quadlet ファイルを編集した後は:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

SSH/ヘッドレスホストでブート時永続化が必要なら、現在のユーザーに対して lingering を有効化してください。

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Config、env、ストレージ

- **Config dir:** `~/.openclaw`
- **Workspace dir:** `~/.openclaw/workspace`
- **Token ファイル:** `~/.openclaw/.env`
- **起動ヘルパー:** `./scripts/run-openclaw-podman.sh`

起動スクリプトと Quadlet は、ホスト state をコンテナに bind mount します。

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

デフォルトでは、これらは無名のコンテナ state ではなくホストディレクトリなので、
`openclaw.json`、エージェントごとの `auth-profiles.json`、チャネル/プロバイダー state、
sessions、workspace はコンテナを置き換えても保持されます。
Podman セットアップは、コンテナの non-loopback bind でもローカルダッシュボードが動作するように、公開 Gateway port に対して `127.0.0.1` と `localhost` 用の `gateway.controlUi.allowedOrigins` も投入します。

手動ランチャー用の便利な env var:

- `OPENCLAW_PODMAN_CONTAINER` -- コンテナ名（デフォルトは `openclaw`）
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- 実行するイメージ
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- コンテナ `18789` にマップされるホスト port
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- コンテナ `18790` にマップされるホスト port
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- 公開 port 用のホストインターフェイス。デフォルトは `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- コンテナ内の Gateway bind mode。デフォルトは `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id`（デフォルト）、`auto`、または `host`

手動ランチャーは、コンテナ/イメージのデフォルトを確定する前に `~/.openclaw/.env` を読み込むため、これらをそこに保存して永続化できます。

`OPENCLAW_CONFIG_DIR` または `OPENCLAW_WORKSPACE_DIR` をデフォルト以外にする場合は、`./scripts/podman/setup.sh` と、その後の `./scripts/run-openclaw-podman.sh launch` の両方に同じ変数を設定してください。リポジトリローカルのランチャーは、カスタムパス上書きをシェルをまたいで永続化しません。

Quadlet に関する注意:

- 生成される Quadlet サービスは、意図的に固定されたハードニング済みデフォルト形状を維持します。`127.0.0.1` 公開 port、コンテナ内の `--bind lan`、`keep-id` user namespace です。
- `OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure`、`TimeoutStartSec=300` を固定します。
- `127.0.0.1:18789:18789`（Gateway）と `127.0.0.1:18790:18790`（bridge）の両方を公開します。
- `OPENCLAW_GATEWAY_TOKEN` のような値に対して、`~/.openclaw/.env` を runtime の `EnvironmentFile` として読み込みますが、手動ランチャーの Podman 固有上書き allowlist は使いません。
- カスタム publish port、publish host、またはその他の container-run フラグが必要な場合は、手動ランチャーを使うか、`~/.config/containers/systemd/openclaw.container` を直接編集し、その後サービスを reload/restart してください。

## 便利なコマンド

- **コンテナログ:** `podman logs -f openclaw`
- **コンテナ停止:** `podman stop openclaw`
- **コンテナ削除:** `podman rm -f openclaw`
- **ホスト CLI からダッシュボード URL を開く:** `openclaw dashboard --no-open`
- **ホスト CLI 経由のヘルス/状態:** `openclaw gateway status --deep`（RPC プローブ + 追加の
  サービススキャン）

## トラブルシューティング

- **config または workspace で Permission denied（EACCES）:** コンテナはデフォルトで `--userns=keep-id` と `--user <your uid>:<your gid>` で実行されます。ホストの config/workspace パスが現在のユーザーに所有されていることを確認してください。
- **Gateway 起動がブロックされる（`gateway.mode=local` がない）:** `~/.openclaw/openclaw.json` が存在し、`gateway.mode="local"` を設定していることを確認してください。`scripts/podman/setup.sh` は、存在しない場合これを作成します。
- **コンテナ CLI コマンドが間違った対象に到達する:** `openclaw --container <name> ...` を明示的に使うか、シェルで `OPENCLAW_CONTAINER=<name>` を export してください。
- **`openclaw update` が `--container` で失敗する:** 想定された動作です。イメージを再ビルド/取得し、その後コンテナまたは Quadlet サービスを再起動してください。
- **Quadlet サービスが起動しない:** `systemctl --user daemon-reload` を実行し、その後 `systemctl --user start openclaw.service` を実行してください。ヘッドレスシステムでは `sudo loginctl enable-linger "$(whoami)"` も必要な場合があります。
- **SELinux が bind mount をブロックする:** デフォルトのマウント動作はそのままにしてください。ランチャーは、Linux で SELinux が enforcing または permissive の場合に自動で `:Z` を追加します。

## 関連

- [Docker](/ja-JP/install/docker)
- [Gateway バックグラウンドプロセス](/ja-JP/gateway/background-process)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
