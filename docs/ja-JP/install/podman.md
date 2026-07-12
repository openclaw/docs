---
read_when:
    - Docker の代わりに Podman を使用してコンテナ化された Gateway を利用したい場合
summary: ルートレス Podman コンテナで OpenClaw を実行する
title: Podman
x-i18n:
    generated_at: "2026-07-12T14:36:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

現在の非 root ユーザーによって管理される rootless Podman コンテナ内で、OpenClaw Gateway を実行します。

構成モデル:

- Podman が Gateway コンテナを実行します。
- ホストの `openclaw` CLI がコントロールプレーンです。
- 永続状態はデフォルトでホストの `~/.openclaw` 配下に保存されます。
- 日常的な管理には、`sudo -u openclaw`、`podman exec`、または別のサービスユーザーではなく、`openclaw --container <name> ...` を使用します。

## 前提条件

- rootless モードの **Podman**
- ホストにインストールされた **OpenClaw CLI**
- **任意:** Quadlet 管理の自動起動を使用する場合は `systemd --user`
- **任意:** ヘッドレスホストで起動時の永続性を確保するために `loginctl enable-linger "$(whoami)"` を使用する場合のみ `sudo`

## クイックスタート

<Steps>
  <Step title="初回セットアップ">
    リポジトリルートから `./scripts/podman/setup.sh` を実行します。

    これにより、rootless Podman ストア内に `openclaw:local` がビルドされ（`OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` が設定されている場合はプルされ）、存在しない場合は `gateway.mode: "local"` を含む `~/.openclaw/openclaw.json` と、生成された `OPENCLAW_GATEWAY_TOKEN` を含む `~/.openclaw/.env` が作成されます。

    任意のビルド時環境変数:

    | 変数 | 効果 |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | `openclaw:local` をビルドする代わりに、既存またはプルしたイメージを使用します |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | イメージのビルド中に追加の apt パッケージをインストールします（従来の `OPENCLAW_DOCKER_APT_PACKAGES` も使用可能） |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | イメージのビルド中に追加の Python パッケージをインストールします。バージョンを固定し、信頼できるパッケージインデックスのみを使用してください |
    | `OPENCLAW_EXTENSIONS` | 選択したサポート対象の plugins をコンパイルおよびパッケージ化し、その実行時依存関係をインストールします |
    | `OPENCLAW_INSTALL_BROWSER` | ブラウザ自動化用に Chromium と Xvfb を事前インストールします（`1` に設定） |

    代わりに Quadlet 管理のセットアップを使用する場合（Linux + systemd ユーザーサービスのみ）:

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    または、`OPENCLAW_PODMAN_QUADLET=1` を設定します。

  </Step>

  <Step title="Gateway コンテナを起動する">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    `--userns=keep-id` を使用して現在の uid/gid でコンテナを起動し、OpenClaw の状態をコンテナ内にバインドマウントします。

  </Step>

  <Step title="コンテナ内でオンボーディングを実行する">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    次に `http://127.0.0.1:18789/` を開き、`~/.openclaw/.env` のトークンを使用します。

    モデル認証: セットアップ中は OpenClaw が管理する認証を使用します（Anthropic API キー、または Codex ベースの OpenAI 用の OpenAI Codex ブラウザ OAuth／デバイスコード認証）。Podman ランチャーは、`~/.claude` や `~/.codex` などのホスト CLI の認証情報ホームをセットアップコンテナや Gateway コンテナにマウントしません。既存のホスト CLI ログインは、同一ホスト上での利便性を目的とした経路にすぎません。コンテナへのインストールでは、プロバイダー認証をセットアップが管理する、マウント済みの `~/.openclaw` 状態に保持してください。

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

    macOS では、Podman machine によってブラウザが Gateway から非ローカルに見える場合があります。起動後に Control UI でデバイス認証エラーが報告される場合は、[Podman と Tailscale](#podman-and-tailscale) の Tailscale ガイダンスを使用してください。

  </Step>
</Steps>

手動ランチャーは `~/.openclaw/.env` から Podman 関連キーの小規模な許可リストのみを読み取り、明示的な実行時環境変数をコンテナに渡します。環境ファイル全体を Podman に渡すことはありません。

<a id="podman-and-tailscale"></a>

## Podman と Tailscale

HTTPS またはリモートブラウザアクセスについては、メインの Tailscale ドキュメントに従ってください。

Podman 固有の注意事項:

- Podman の公開ホストは `127.0.0.1` のままにします。
- `openclaw gateway --tailscale serve` よりも、ホストで管理する `tailscale serve` を推奨します。
- macOS でローカルブラウザのデバイス認証コンテキストが不安定な場合は、場当たり的なローカルトンネルの回避策ではなく Tailscale アクセスを使用してください。

[Tailscale](/ja-JP/gateway/tailscale) および [Control UI](/ja-JP/web/control-ui) を参照してください。

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

SSH／ヘッドレスホストで起動時の永続性を確保するには、現在のユーザーに対して lingering を有効にします。

```bash
sudo loginctl enable-linger "$(whoami)"
```

生成された Quadlet サービスは、固定された強化済みのデフォルト構成を維持します。公開ポートは `127.0.0.1`（Gateway は `18789`、ブリッジは `18790`）、コンテナ内では `--bind lan`、ユーザー名前空間は `keep-id`、`OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure`、`TimeoutStartSec=300` です。`OPENCLAW_GATEWAY_TOKEN` などの値については、`~/.openclaw/.env` を実行時の `EnvironmentFile` として読み取りますが、手動ランチャーの Podman 固有オーバーライド許可リストは使用しません。公開ポート、公開ホスト、その他のコンテナ実行フラグをカスタマイズする場合は、代わりに手動ランチャーを使用するか、`~/.config/containers/systemd/openclaw.container` を直接編集してから、サービスを再読み込みして再起動してください。

## 設定、環境変数、ストレージ

- **設定ディレクトリ:** `~/.openclaw`
- **ワークスペースディレクトリ:** `~/.openclaw/workspace`
- **トークンファイル:** `~/.openclaw/.env`
- **起動ヘルパー:** `./scripts/run-openclaw-podman.sh`

起動スクリプトと Quadlet は、ホストの状態をコンテナ内にバインドマウントします。`OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`、`OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace` です。デフォルトでは、これらは匿名のコンテナ状態ではなくホストディレクトリであるため、`openclaw.json`、エージェントごとの `auth-profiles.json`、チャネル／プロバイダーの状態、セッション、ワークスペースはコンテナを置き換えても保持されます。また、コンテナ内では非 loopback にバインドされていてもローカルダッシュボードが動作するよう、セットアップによって、公開された Gateway ポート上の `127.0.0.1` と `localhost` が `gateway.controlUi.allowedOrigins` に初期設定されます。

手動ランチャーで使用できる環境変数（`~/.openclaw/.env` に保存してください。ランチャーはコンテナ／イメージのデフォルトを確定する前にこのファイルを読み取ります）:

| 変数                                        | デフォルト          | 効果                                 |
| ------------------------------------------ | ---------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | コンテナ名                         |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | 実行するイメージ                           |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | コンテナの `18789` にマッピングするホストポート  |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | コンテナの `18790` にマッピングするホストポート  |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | 公開ポートに使用するホストインターフェース     |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | コンテナ内での Gateway バインドモード |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`、`auto`、または `host`           |

デフォルト以外の `OPENCLAW_CONFIG_DIR` または `OPENCLAW_WORKSPACE_DIR` を使用する場合は、`./scripts/podman/setup.sh` と、その後の `./scripts/run-openclaw-podman.sh launch` コマンドの両方に同じ変数を設定してください。リポジトリローカルのランチャーは、カスタムパスのオーバーライドをシェル間で永続化しません。

## イメージのアップグレード

新しいイメージを再ビルドまたはプルした後、コンテナまたは Quadlet サービスを再起動します。
新しい OpenClaw バージョンでの初回起動時に、Gateway は準備完了を報告する前に、安全な状態修復と
plugin 修復を実行します。

Gateway が準備完了にならず終了する場合は、同じマウント済みの状態／設定に対して、同じイメージを使用して
`openclaw doctor --fix` を一度実行してから、通常どおり
Gateway を再起動します。

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

SELinux ホストで Podman がマウント済み状態へのアクセスをブロックする場合は、両方のバインドマウントに
`,Z` を追加してください。

## 便利なコマンド

- **コンテナログ:** `podman logs -f openclaw`
- **コンテナを停止:** `podman stop openclaw`
- **コンテナを削除:** `podman rm -f openclaw`
- **ホスト CLI からダッシュボード URL を開く:** `openclaw dashboard --no-open`
- **ホスト CLI によるヘルス／状態確認:** `openclaw gateway status --deep`（RPC プローブ + 追加のサービススキャン）

## トラブルシューティング

- **設定またはワークスペースで権限拒否（EACCES）が発生する:** コンテナはデフォルトで `--userns=keep-id` と `--user <your uid>:<your gid>` を使用して実行されます。ホストの設定／ワークスペースのパスが現在のユーザーによって所有されていることを確認してください。
- **Gateway の起動がブロックされる（`gateway.mode=local` がない）:** `~/.openclaw/openclaw.json` が存在し、`gateway.mode="local"` が設定されていることを確認してください。存在しない場合は `scripts/podman/setup.sh` が作成します。
- **イメージの更新後にコンテナが再起動する:** [イメージのアップグレード](#upgrading-images) に記載された一回限りの `openclaw doctor --fix` コマンドを実行してから、Gateway を再度起動してください。
- **コンテナ CLI コマンドが誤った対象に接続する:** `openclaw --container <name> ...` を明示的に使用するか、シェルで `OPENCLAW_CONTAINER=<name>` をエクスポートしてください。
- **`--container` を使用すると `openclaw update` が失敗する:** 想定どおりの動作です。イメージを再ビルドまたはプルしてから、コンテナまたは Quadlet サービスを再起動してください。
- **Quadlet サービスが起動しない:** `systemctl --user daemon-reload` を実行してから、`systemctl --user start openclaw.service` を実行してください。ヘッドレスシステムでは、`sudo loginctl enable-linger "$(whoami)"` も必要になる場合があります。
- **SELinux がバインドマウントをブロックする:** デフォルトのマウント動作は変更しないでください。Linux で SELinux が enforcing または permissive の場合、ランチャーが自動的に `:Z` を追加します。

## 関連項目

- [Docker](/ja-JP/install/docker)
- [Gateway バックグラウンドプロセス](/ja-JP/gateway/background-process)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting)
