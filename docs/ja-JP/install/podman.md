---
read_when:
    - Docker ではなく Podman を使用してコンテナ化された Gateway を構築したい場合
summary: ルートレス Podman コンテナで OpenClaw を実行する
title: Podman
x-i18n:
    generated_at: "2026-07-11T22:20:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

OpenClaw Gateway を、現在の非 root ユーザーが管理する rootless Podman コンテナで実行します。

構成は次のとおりです。

- Podman が Gateway コンテナを実行します。
- ホストの `openclaw` CLI がコントロールプレーンになります。
- 永続状態はデフォルトでホストの `~/.openclaw` 配下に保存されます。
- 日常的な管理には、`sudo -u openclaw`、`podman exec`、または専用のサービスユーザーではなく、`openclaw --container <name> ...` を使用します。

## 前提条件

- rootless モードの **Podman**
- ホストにインストールされた **OpenClaw CLI**
- **任意:** Quadlet による自動起動を使用する場合は `systemd --user`
- **任意:** ヘッドレスホストで起動時の永続化に `loginctl enable-linger "$(whoami)"` を使用する場合のみ `sudo`

## クイックスタート

<Steps>
  <Step title="初回セットアップ">
    リポジトリのルートから `./scripts/podman/setup.sh` を実行します。

    これにより、rootless Podman ストア内に `openclaw:local` がビルドされます（`OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` が設定されている場合はそれをプルします）。また、存在しない場合は `gateway.mode: "local"` を設定した `~/.openclaw/openclaw.json` と、生成された `OPENCLAW_GATEWAY_TOKEN` を含む `~/.openclaw/.env` が作成されます。

    ビルド時に使用できる任意の環境変数:

    | 変数 | 効果 |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | `openclaw:local` をビルドする代わりに、既存またはプルしたイメージを使用します |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | イメージのビルド中に追加の apt パッケージをインストールします（従来の `OPENCLAW_DOCKER_APT_PACKAGES` も使用できます） |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | イメージのビルド中に追加の Python パッケージをインストールします。バージョンを固定し、信頼できるパッケージインデックスのみを使用してください |
    | `OPENCLAW_EXTENSIONS` | 選択した対応 Plugin をコンパイルしてパッケージ化し、そのランタイム依存関係をインストールします |
    | `OPENCLAW_INSTALL_BROWSER` | ブラウザー自動化用の Chromium と Xvfb を事前インストールします（`1` に設定） |

    代わりに Quadlet 管理のセットアップを行う場合（Linux + systemd ユーザーサービスのみ）:

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    または、`OPENCLAW_PODMAN_QUADLET=1` を設定します。

  </Step>

  <Step title="Gateway コンテナを起動する">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    `--userns=keep-id` を使用して現在の uid/gid でコンテナを起動し、OpenClaw の状態をコンテナにバインドマウントします。

  </Step>

  <Step title="コンテナ内でオンボーディングを実行する">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    次に `http://127.0.0.1:18789/` を開き、`~/.openclaw/.env` のトークンを使用します。

    モデル認証: セットアップ中は OpenClaw が管理する認証を使用します（Anthropic API キー、または Codex ベースの OpenAI 向け OpenAI Codex ブラウザー OAuth／デバイスコード認証）。Podman ランチャーは、`~/.claude` や `~/.codex` など、ホスト CLI の認証情報ホームをセットアップコンテナや Gateway コンテナにマウントしません。ホスト CLI の既存ログインは同一ホスト上での利便性のための経路にすぎません。コンテナへのインストールでは、プロバイダー認証をセットアップが管理する、マウント済みの `~/.openclaw` 状態内に保持してください。

  </Step>

  <Step title="ホスト CLI から実行中のコンテナを管理する">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    これにより、通常の `openclaw` コマンドがそのコンテナ内で自動的に実行されます。

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # 追加のサービススキャンを含む
    openclaw doctor
    openclaw channels login
    ```

    macOS では、Podman machine によってブラウザーが Gateway からローカルではないように見える場合があります。起動後に Control UI でデバイス認証エラーが報告される場合は、[Podman と Tailscale](#podman-and-tailscale)の Tailscale ガイダンスを使用してください。

  </Step>
</Steps>

手動ランチャーは `~/.openclaw/.env` から Podman 関連キーの小さな許可リストのみを読み取り、明示的なランタイム環境変数をコンテナに渡します。環境変数ファイル全体を Podman に渡すことはありません。

<a id="podman-and-tailscale"></a>

## Podman と Tailscale

HTTPS またはリモートブラウザーアクセスについては、Tailscale のメインドキュメントに従ってください。

Podman 固有の注意事項:

- Podman の公開ホストは `127.0.0.1` のままにします。
- `openclaw gateway --tailscale serve` より、ホストで管理する `tailscale serve` を優先してください。
- macOS でローカルブラウザーのデバイス認証コンテキストが安定しない場合は、場当たり的なローカルトンネルの回避策ではなく Tailscale アクセスを使用してください。

[Tailscale](/ja-JP/gateway/tailscale)および[Control UI](/ja-JP/web/control-ui)を参照してください。

## Systemd（Quadlet、任意）

`./scripts/podman/setup.sh --quadlet` を実行した場合、セットアップによって Quadlet ファイルが `~/.config/containers/systemd/openclaw.container` にインストールされます。

| 操作 | コマンド                                    |
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

SSH／ヘッドレスホストで起動時の永続化を行うには、現在のユーザーの lingering を有効にします。

```bash
sudo loginctl enable-linger "$(whoami)"
```

生成される Quadlet サービスは、固定された堅牢なデフォルト構成を維持します。具体的には、`127.0.0.1` で公開されるポート（`18789` は Gateway、`18790` はブリッジ）、コンテナ内の `--bind lan`、`keep-id` ユーザー名前空間、`OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure`、および `TimeoutStartSec=300` です。`OPENCLAW_GATEWAY_TOKEN` などの値について、ランタイムの `EnvironmentFile` として `~/.openclaw/.env` を読み取りますが、手動ランチャーの Podman 固有のオーバーライド許可リストは使用しません。公開ポート、公開ホスト、その他のコンテナ実行フラグをカスタマイズする場合は、代わりに手動ランチャーを使用するか、`~/.config/containers/systemd/openclaw.container` を直接編集してからサービスを再読み込みして再起動してください。

## 設定、環境変数、ストレージ

- **設定ディレクトリ:** `~/.openclaw`
- **ワークスペースディレクトリ:** `~/.openclaw/workspace`
- **トークンファイル:** `~/.openclaw/.env`
- **起動ヘルパー:** `./scripts/run-openclaw-podman.sh`

起動スクリプトと Quadlet は、ホストの状態をコンテナにバインドマウントします。`OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`、`OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace` です。デフォルトでは、これらは匿名のコンテナ状態ではなくホストディレクトリであるため、`openclaw.json`、エージェントごとの `auth-profiles.json`、チャンネル／プロバイダーの状態、セッション、ワークスペースはコンテナを置き換えても保持されます。また、ローカルダッシュボードがコンテナの非ループバックバインドで動作するように、セットアップは公開された Gateway ポート上の `127.0.0.1` と `localhost` を `gateway.controlUi.allowedOrigins` に初期設定します。

手動ランチャーで使用できる便利な環境変数（`~/.openclaw/.env` に保存してください。ランチャーはコンテナ／イメージのデフォルト値を確定する前にこのファイルを読み取ります）:

| 変数                                        | デフォルト          | 効果                                 |
| ------------------------------------------ | ---------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | コンテナ名                         |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | 実行するイメージ                           |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | コンテナの `18789` にマッピングするホストポート  |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | コンテナの `18790` にマッピングするホストポート  |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | 公開ポートに使用するホストインターフェース     |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | コンテナ内の Gateway バインドモード |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`、`auto`、または `host`           |

デフォルト以外の `OPENCLAW_CONFIG_DIR` または `OPENCLAW_WORKSPACE_DIR` を使用する場合は、`./scripts/podman/setup.sh` と、その後の `./scripts/run-openclaw-podman.sh launch` コマンドの両方で同じ変数を設定してください。リポジトリ内のランチャーは、シェルをまたいでカスタムパスのオーバーライドを保持しません。

## イメージのアップグレード

新しいイメージを再ビルドまたはプルした後、コンテナまたは Quadlet サービスを再起動します。
新しい OpenClaw バージョンの初回起動時には、Gateway が準備完了を報告する前に、安全な状態修復と
Plugin 修復を実行します。

Gateway が準備完了にならず終了する場合は、同じマウント済み状態／設定に対して
同じイメージで `openclaw doctor --fix` を一度実行してから、通常どおり Gateway を
再起動します。

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

SELinux ホストで、Podman がマウントされた状態へのアクセスをブロックする場合は、両方のバインドマウントに
`,Z` を追加します。

## 便利なコマンド

- **コンテナログ:** `podman logs -f openclaw`
- **コンテナを停止:** `podman stop openclaw`
- **コンテナを削除:** `podman rm -f openclaw`
- **ホスト CLI からダッシュボード URL を開く:** `openclaw dashboard --no-open`
- **ホスト CLI からヘルス／状態を確認:** `openclaw gateway status --deep`（RPC プローブ + 追加のサービススキャン）

## トラブルシューティング

- **設定またはワークスペースでアクセス拒否（EACCES）:** コンテナはデフォルトで `--userns=keep-id` と `--user <your uid>:<your gid>` を使用して実行されます。ホストの設定／ワークスペースパスが現在のユーザーによって所有されていることを確認してください。
- **Gateway の起動がブロックされる（`gateway.mode=local` がない）:** `~/.openclaw/openclaw.json` が存在し、`gateway.mode="local"` が設定されていることを確認してください。存在しない場合は `scripts/podman/setup.sh` によって作成されます。
- **イメージ更新後にコンテナが再起動を繰り返す:** [イメージのアップグレード](#upgrading-images)にある一回限りの `openclaw doctor --fix` コマンドを実行してから、Gateway を再度起動してください。
- **コンテナ CLI コマンドが誤った対象に接続する:** `openclaw --container <name> ...` を明示的に使用するか、シェルで `OPENCLAW_CONTAINER=<name>` をエクスポートしてください。
- **`--container` を指定すると `openclaw update` が失敗する:** 想定どおりです。イメージを再ビルドまたはプルしてから、コンテナまたは Quadlet サービスを再起動してください。
- **Quadlet サービスが起動しない:** `systemctl --user daemon-reload` を実行してから、`systemctl --user start openclaw.service` を実行してください。ヘッドレスシステムでは、`sudo loginctl enable-linger "$(whoami)"` も必要な場合があります。
- **SELinux がバインドマウントをブロックする:** デフォルトのマウント動作を変更しないでください。SELinux が enforcing または permissive の場合、ランチャーが Linux 上で自動的に `:Z` を追加します。

## 関連項目

- [Docker](/ja-JP/install/docker)
- [Gateway のバックグラウンドプロセス](/ja-JP/gateway/background-process)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting)
