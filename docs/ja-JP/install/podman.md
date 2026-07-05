---
read_when:
    - Docker の代わりに Podman でコンテナ化された Gateway を使いたい
summary: rootless Podman コンテナで OpenClaw を実行する
title: Podman
x-i18n:
    generated_at: "2026-07-05T11:27:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70b35745eb2ecee734fe686d2f4eb19f462214fbf40fca19fc906ea73d5d28c0
    source_path: install/podman.md
    workflow: 16
---

OpenClaw Gateway を rootless Podman コンテナで実行し、現在の非 root ユーザーで管理します。

モデル:

- Podman が Gateway コンテナを実行します。
- ホストの `openclaw` CLI がコントロールプレーンです。
- 永続状態はデフォルトでホスト上の `~/.openclaw` 配下に置かれます。
- 日常的な管理では、`sudo -u openclaw`、`podman exec`、または別のサービスユーザーではなく、`openclaw --container <name> ...` を使用します。

## 前提条件

- rootless モードの **Podman**
- ホストにインストール済みの **OpenClaw CLI**
- **任意:** Quadlet 管理の自動起動が必要な場合は `systemd --user`
- **任意:** ヘッドレスホストで起動時の永続化に `loginctl enable-linger "$(whoami)"` を使いたい場合のみ `sudo`

## クイックスタート

<Steps>
  <Step title="初回セットアップ">
    リポジトリルートから `./scripts/podman/setup.sh` を実行します。

    これにより、rootless Podman ストアに `openclaw:local` がビルドされます（`OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` が設定されている場合はそれを pull します）。また、存在しない場合は `gateway.mode: "local"` を含む `~/.openclaw/openclaw.json` を作成し、存在しない場合は生成された `OPENCLAW_GATEWAY_TOKEN` を含む `~/.openclaw/.env` を作成します。

    任意のビルド時環境変数:

    | 変数 | 効果 |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | `openclaw:local` をビルドする代わりに、既存または pull 済みのイメージを使用します |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | イメージビルド中に追加の apt パッケージをインストールします（レガシーの `OPENCLAW_DOCKER_APT_PACKAGES` も受け付けます） |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | イメージビルド中に追加の Python パッケージをインストールします。バージョンを固定し、信頼できるパッケージインデックスのみを使用してください |
    | `OPENCLAW_EXTENSIONS` | ビルド時に Plugin 依存関係を事前インストールします |
    | `OPENCLAW_INSTALL_BROWSER` | ブラウザー自動化用に Chromium と Xvfb を事前インストールします（`1` に設定） |

    代わりに Quadlet 管理のセットアップを使用する場合（Linux + systemd ユーザーサービスのみ）:

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    または `OPENCLAW_PODMAN_QUADLET=1` を設定します。

  </Step>

  <Step title="Gateway コンテナを起動する">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    `--userns=keep-id` を使って現在の uid/gid としてコンテナを起動し、OpenClaw 状態をコンテナへ bind mount します。

  </Step>

  <Step title="コンテナ内でオンボーディングを実行する">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    次に `http://127.0.0.1:18789/` を開き、`~/.openclaw/.env` のトークンを使用します。

    モデル認証: セットアップ中は OpenClaw 管理の認証を使用します（Anthropic API キー、または Codex-backed OpenAI 用の OpenAI Codex ブラウザー OAuth/device-code 認証）。Podman ランチャーは、`~/.claude` や `~/.codex` などのホスト CLI 認証情報ホームをセットアップコンテナや Gateway コンテナにマウントしません。既存のホスト CLI ログインは同一ホスト上の利便性のためのパスにすぎません。コンテナインストールでは、プロバイダー認証をセットアップが管理する、マウント済みの `~/.openclaw` 状態に保持してください。

  </Step>

  <Step title="ホスト CLI から実行中のコンテナを管理する">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    その後、通常の `openclaw` コマンドはそのコンテナ内で自動的に実行されます。

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # includes extra service scan
    openclaw doctor
    openclaw channels login
    ```

    macOS では、Podman machine によってブラウザーが Gateway から見てローカルではないように見える場合があります。起動後に Control UI がデバイス認証エラーを報告する場合は、[Podman と Tailscale](#podman-and-tailscale) の Tailscale ガイダンスを使用してください。

  </Step>
</Steps>

手動ランチャーは、`~/.openclaw/.env` から Podman 関連キーの小さな allowlist のみを読み取り、明示的なランタイム環境変数をコンテナに渡します。環境ファイル全体を Podman に渡すことはありません。

<a id="podman-and-tailscale"></a>

## Podman と Tailscale

HTTPS またはリモートブラウザーアクセスについては、メインの Tailscale ドキュメントに従ってください。

Podman 固有の注意点:

- Podman の publish host は `127.0.0.1` のままにします。
- `openclaw gateway --tailscale serve` よりも、ホスト管理の `tailscale serve` を推奨します。
- macOS でローカルブラウザーのデバイス認証コンテキストが不安定な場合は、その場しのぎのローカルトンネル回避策ではなく Tailscale アクセスを使用してください。

[Tailscale](/ja-JP/gateway/tailscale) と [Control UI](/ja-JP/web/control-ui) を参照してください。

## Systemd（Quadlet、任意）

`./scripts/podman/setup.sh --quadlet` を実行した場合、セットアップは Quadlet ファイルを `~/.config/containers/systemd/openclaw.container` にインストールします。

| 操作 | コマンド                                   |
| ------ | ------------------------------------------ |
| 起動  | `systemctl --user start openclaw.service`  |
| 停止   | `systemctl --user stop openclaw.service`   |
| 状態 | `systemctl --user status openclaw.service` |
| ログ   | `journalctl --user -u openclaw.service -f` |

Quadlet ファイルを編集した後:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

SSH/ヘッドレスホストで起動時の永続化を行うには、現在のユーザーに lingering を有効化します。

```bash
sudo loginctl enable-linger "$(whoami)"
```

生成される Quadlet サービスは、固定された強化済みのデフォルト形状を維持します。公開ポートは `127.0.0.1`（`18789` Gateway、`18790` bridge）、コンテナ内は `--bind lan`、`keep-id` ユーザー名前空間、`OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure`、`TimeoutStartSec=300` です。`OPENCLAW_GATEWAY_TOKEN` などの値について、ランタイム `EnvironmentFile` として `~/.openclaw/.env` を読み取りますが、手動ランチャーの Podman 固有 override allowlist は消費しません。カスタムの公開ポート、publish host、またはその他の container-run フラグを使う場合は、代わりに手動ランチャーを使用するか、`~/.config/containers/systemd/openclaw.container` を直接編集してからサービスを reload して restart してください。

## 設定、環境変数、ストレージ

- **設定ディレクトリ:** `~/.openclaw`
- **ワークスペースディレクトリ:** `~/.openclaw/workspace`
- **トークンファイル:** `~/.openclaw/.env`
- **起動ヘルパー:** `./scripts/run-openclaw-podman.sh`

起動スクリプトと Quadlet は、ホスト状態をコンテナに bind mount します。`OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`、`OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace` です。デフォルトではこれらは匿名コンテナ状態ではなくホストディレクトリであるため、`openclaw.json`、エージェントごとの `auth-profiles.json`、チャネル/プロバイダー状態、セッション、ワークスペースはコンテナを置き換えても残ります。セットアップは、ローカルダッシュボードがコンテナの非 loopback bind で動作するよう、公開された Gateway ポート上の `127.0.0.1` と `localhost` に対して `gateway.controlUi.allowedOrigins` も seed します。

手動ランチャーで有用な環境変数（これらは `~/.openclaw/.env` に永続化してください。ランチャーはコンテナ/イメージのデフォルトを確定する前にこのファイルを読み取ります）:

| 変数                                        | デフォルト          | 効果                                 |
| ------------------------------------------ | ---------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | コンテナ名                         |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | 実行するイメージ                           |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | コンテナの `18789` にマップされるホストポート  |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | コンテナの `18790` にマップされるホストポート  |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | 公開ポート用のホストインターフェース     |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | コンテナ内の Gateway bind モード |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`、`auto`、または `host`           |

デフォルト以外の `OPENCLAW_CONFIG_DIR` または `OPENCLAW_WORKSPACE_DIR` を使用する場合は、`./scripts/podman/setup.sh` と、その後の `./scripts/run-openclaw-podman.sh launch` コマンドの両方に同じ変数を設定してください。リポジトリローカルのランチャーは、シェルをまたいでカスタムパス override を永続化しません。

## 便利なコマンド

- **コンテナログ:** `podman logs -f openclaw`
- **コンテナを停止:** `podman stop openclaw`
- **コンテナを削除:** `podman rm -f openclaw`
- **ホスト CLI からダッシュボード URL を開く:** `openclaw dashboard --no-open`
- **ホスト CLI 経由のヘルス/状態:** `openclaw gateway status --deep`（RPC probe + 追加サービススキャン）

## トラブルシューティング

- **設定またはワークスペースで Permission denied（EACCES）:** コンテナはデフォルトで `--userns=keep-id` と `--user <your uid>:<your gid>` を使って実行されます。ホストの設定/ワークスペースパスが現在のユーザーの所有であることを確認してください。
- **Gateway 起動がブロックされる（`gateway.mode=local` がない）:** `~/.openclaw/openclaw.json` が存在し、`gateway.mode="local"` を設定していることを確認してください。存在しない場合、`scripts/podman/setup.sh` がこれを作成します。
- **コンテナ CLI コマンドが間違ったターゲットに当たる:** `openclaw --container <name> ...` を明示的に使用するか、シェルで `OPENCLAW_CONTAINER=<name>` を export してください。
- **`openclaw update` が `--container` で失敗する:** 想定どおりです。イメージを rebuild/pull してから、コンテナまたは Quadlet サービスを再起動してください。
- **Quadlet サービスが起動しない:** `systemctl --user daemon-reload` を実行してから、`systemctl --user start openclaw.service` を実行します。ヘッドレスシステムでは、`sudo loginctl enable-linger "$(whoami)"` も必要になる場合があります。
- **SELinux が bind mount をブロックする:** デフォルトの mount 動作はそのままにしてください。SELinux が enforcing または permissive の Linux では、ランチャーが自動的に `:Z` を追加します。

## 関連

- [Docker](/ja-JP/install/docker)
- [Gateway バックグラウンドプロセス](/ja-JP/gateway/background-process)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
