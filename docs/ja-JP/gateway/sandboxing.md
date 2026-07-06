---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClaw のサンドボックス化の仕組み: モード、スコープ、ワークスペースアクセス、画像'
title: サンドボックス化
x-i18n:
    generated_at: "2026-07-06T10:49:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw は、影響範囲を抑えるためにツール実行をサンドボックスバックエンド内で実行できます。サンドボックス化はデフォルトではオフで、`agents.defaults.sandbox`（グローバル）または `agents.list[].sandbox`（エージェントごと）で制御されます。Gateway プロセスは常にホスト上に残り、有効化されている場合のみツール実行がサンドボックスへ移動します。

<Note>
これは完全なセキュリティ境界ではありませんが、モデルが不適切な動作をした場合に、ファイルシステムとプロセスへのアクセスを実質的に制限します。
</Note>

## サンドボックス化されるもの

- ツール実行: `exec`、`read`、`write`、`edit`、`apply_patch`、`process` など。
- 任意のサンドボックス化ブラウザー（`agents.defaults.sandbox.browser`）。

サンドボックス化されないもの:

- Gateway プロセス自体。
- `tools.elevated` によってサンドボックス外での実行が明示的に許可されたツール。昇格された exec はサンドボックス化をバイパスし、設定されたエスケープパス（デフォルトでは `gateway`、exec ターゲットが `node` の場合は `node`）上で実行されます。サンドボックス化がオフの場合、exec はすでにホスト上で実行されているため、`tools.elevated` は何も変更しません。[昇格モード](/ja-JP/tools/elevated)を参照してください。

## モード、スコープ、バックエンド

3 つの独立した設定でサンドボックスの動作を制御します。

| 設定 | キー                               | 値                           | デフォルト |
| ------- | --------------------------------- | ---------------------------- | -------- |
| モード    | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`    |
| スコープ   | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`  |
| バックエンド | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker` |

**モード** はサンドボックス化を適用するタイミングを制御します。

- `off`: サンドボックス化しません。
- `non-main`: エージェントのメインセッションを除くすべてのセッションをサンドボックス化します。メインセッションキーは常に `agent:<agentId>:main`（または `session.scope` が `"global"` の場合は `global`）であり、設定できません。グループ/チャンネルセッションは独自のキーを使用するため、常に non-main と見なされ、サンドボックス化されます。
- `all`: すべてのセッションがサンドボックス内で実行されます。

**スコープ** は作成されるコンテナ/環境の数を制御します。

- `agent`: エージェントごとに 1 つのコンテナ。
- `session`: セッションごとに 1 つのコンテナ。
- `shared`: すべてのサンドボックス化されたセッションで共有される 1 つのコンテナ（このスコープでは、エージェントごとの `docker`/`ssh`/`browser` オーバーライドは無視されます）。

**バックエンド** は、どのランタイムがサンドボックス化されたツールを実行するかを制御します。SSH 固有の設定は `agents.defaults.sandbox.ssh` 配下にあります。OpenShell 固有の設定は `plugins.entries.openshell.config` 配下にあります。

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **実行場所**   | ローカルコンテナ                  | SSH でアクセス可能な任意のホスト        | OpenShell 管理のサンドボックス                           |
| **セットアップ**           | `scripts/sandbox-setup.sh`       | SSH キー + ターゲットホスト          | OpenShell Plugin が有効                            |
| **ワークスペースモデル** | バインドマウントまたはコピー               | リモートを正とする（一度だけシード）   | `mirror` または `remote`                                |
| **ネットワーク制御** | `docker.network`（デフォルト: なし） | リモートホストに依存         | OpenShell に依存                                |
| **ブラウザーサンドボックス** | 対応                        | 非対応                  | まだ非対応                                   |
| **バインドマウント**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **最適な用途**        | ローカル開発、完全な分離        | リモートマシンへのオフロード | 任意の双方向同期を備えた管理型リモートサンドボックス |

## Docker バックエンド

Docker は、サンドボックス化が有効になるとデフォルトのバックエンドになります。Docker デーモンソケット（`/var/run/docker.sock`）を通じてツールとサンドボックスブラウザーをローカルで実行します。分離は Docker 名前空間によって実現されます。

デフォルト: `network: "none"`（外向き通信なし）、`readOnlyRoot: true`、`capDrop: ["ALL"]`、イメージ `openclaw-sandbox:bookworm-slim`。

ホスト GPU を公開するには、`agents.defaults.sandbox.docker.gpus`（またはエージェントごとのオーバーライド）を `"all"` や `"device=GPU-uuid"` のような値に設定します。これは Docker の `--gpus` フラグに渡され、NVIDIA Container Toolkit などの互換性のあるホストランタイムが必要です。

<Warning>
**Docker-out-of-Docker (DooD) の制約**

OpenClaw Gateway 自体を Docker コンテナとしてデプロイする場合、ホストの Docker ソケット（DooD）を使って兄弟サンドボックスコンテナをオーケストレーションします。これにより、パスマッピング上の制約が生じます。

- **設定にはホストパスが必要**: `openclaw.json` の `workspace` には、内部の Gateway コンテナパスではなく、**ホストの絶対パス**（例: `/home/user/.openclaw/workspaces`）を含める必要があります。Docker デーモンは、Gateway 自身の名前空間ではなく、ホスト OS 名前空間を基準にパスを評価します。
- **一致するボリュームマップが必要**: Gateway プロセスも、その `workspace` パスに heartbeat とブリッジファイルを書き込みます。Gateway コンテナに同一のボリュームマップ（`-v /home/user/.openclaw:/home/user/.openclaw`）を与え、Gateway コンテナ内からも同じホストパスが正しく解決されるようにしてください。マッピングが一致しない場合、Gateway が heartbeat を書き込もうとしたときに `EACCES` として現れます。
- **Codex コードモード**: OpenClaw サンドボックスがアクティブな場合、そのターンでは OpenClaw は Codex アプリサーバーのネイティブ Code Mode、ユーザー MCP サーバー、アプリ支援 Plugin 実行を無効化します（これらは OpenClaw サンドボックスバックエンドではなく、Gateway ホストのアプリサーバープロセスから実行されるため）。ただし、サンドボックスツールポリシーが必要なツールを公開しており、実験的なサンドボックス exec-server パスにオプトインしている場合を除きます。その場合、シェルアクセスは `sandbox_exec` や `sandbox_process` などの OpenClaw サンドボックス支援ツール経由でルーティングされます。ホストの Docker ソケットをエージェントサンドボックスコンテナやカスタム Codex サンドボックスにマウントしないでください。完全な動作については [Codex Harness](/ja-JP/plugins/codex-harness) を参照してください。

Docker サンドボックスモードが有効な Ubuntu/AppArmor ホストでは、Codex アプリサーバーの `workspace-write` シェル実行に、サンドボックスコンテナ内の非特権ユーザー名前空間が必要です。サービスユーザーがそれらを作成できない場合、シェル起動前に失敗することがあります。Docker サンドボックスの外向き通信が無効（`network: "none"`、デフォルト）な場合は、非特権ネットワーク名前空間も必要です。一般的な症状: `bwrap: setting up uid map: Permission denied` および `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。`openclaw doctor` を実行してください。Codex bwrap 名前空間プローブの失敗が報告された場合は、必要な名前空間を OpenClaw サービスプロセスに許可する AppArmor プロファイルを優先してください。`kernel.apparmor_restrict_unprivileged_userns=0` は、セキュリティ上のトレードオフを伴うホスト全体のフォールバックです。そのホストの姿勢として許容できる場合にのみ使用してください。
</Warning>

### サンドボックス化ブラウザー

- サンドボックスブラウザーは、ブラウザーツールが必要とするときに自動起動します（CDP に到達可能であることを保証します）。`agents.defaults.sandbox.browser.autoStart`（デフォルト `true`）と `autoStartTimeoutMs`（デフォルト 12s）で設定します。
- サンドボックスブラウザーコンテナは、グローバルな `bridge` ネットワークの代わりに、専用の Docker ネットワーク（`openclaw-sandbox-browser`）を使用します。`agents.defaults.sandbox.browser.network` で設定します。
- `agents.defaults.sandbox.browser.cdpSourceRange` は、CIDR 許可リスト（例: `172.21.0.1/32`）でコンテナエッジの CDP 入口を制限します。
- noVNC オブザーバーアクセスはデフォルトでパスワード保護されます。OpenClaw は、ローカルブートストラップページを提供し、URL フラグメント（クエリ文字列やヘッダーログではありません）内のパスワードで noVNC を開く、短命のトークン URL を出力します。
- `agents.defaults.sandbox.browser.allowHostControl`（デフォルト `false`）は、サンドボックス化されたセッションがホストブラウザーを明示的にターゲットにできるようにします。
- 任意の許可リストが `target: "custom"` をゲートします: `allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

## SSH バックエンド

`backend: "ssh"` を使用して、任意の SSH アクセス可能なマシン上で `exec`、ファイルツール、メディア読み取りをサンドボックス化します。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

デフォルト: `command: "ssh"`、`workspaceRoot: "/tmp/openclaw-sandboxes"`、`strictHostKeyChecking: true`、`updateHostKeys: true`。

- **ライフサイクル**: OpenClaw は `sandbox.ssh.workspaceRoot` の下にスコープごとのリモートルートを作成します。作成または再作成後の初回使用時に、ローカルワークスペースからそのリモートワークスペースへ一度だけシードします。その後、`exec`、`read`、`write`、`edit`、`apply_patch`、プロンプトメディア読み取り、受信メディアのステージングは、SSH 経由でリモートワークスペースに対して直接実行されます。OpenClaw はリモートの変更をローカルワークスペースへ自動的には同期しません。
- **認証素材**: `identityFile`/`certificateFile`/`knownHostsFile` は既存のローカルファイルを参照します。`identityData`/`certificateData`/`knownHostsData` はインライン文字列または SecretRefs を受け付け、通常のシークレットランタイムスナップショットを通じて解決され、モード `0600` の一時ファイルに書き込まれ、SSH セッション終了時に削除されます。同じ項目に `*File` と `*Data` の両方のバリアントが設定されている場合、そのセッションでは `*Data` が優先されます。
- **リモートを正とすることの結果**: 初期シード後、リモート SSH ワークスペースが実際のサンドボックス状態になります。シード手順の後に OpenClaw 外で行われたホストローカルの編集は、サンドボックスを再作成するまでリモートには表示されません。`openclaw sandbox recreate` は、スコープごとのリモートルートを削除し、次回使用時にローカルから再度シードします。このバックエンドではブラウザーサンドボックス化は対応しておらず、`sandbox.docker.*` 設定は適用されません。

## OpenShell バックエンド

`backend: "openshell"` を使用して、OpenShell 管理のリモート環境でツールをサンドボックス化します。OpenShell は汎用 SSH バックエンドと同じ SSH トランスポートおよびリモートファイルシステムブリッジを再利用し、OpenShell ライフサイクル（`sandbox create/get/delete/ssh-config`）に加えて、任意の `mirror` ワークスペース同期モードを追加します。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
        },
      },
    },
  },
}
```

`mode: "mirror"`（デフォルト）は、ローカルワークスペースを正として保ちます。OpenClaw は `exec` の前にローカルをサンドボックスへ同期し、その後に同期し戻します。`mode: "remote"` は、ローカルからリモートワークスペースへ一度だけシードし、その後は同期し戻さずにリモートワークスペースに対して `exec`/`read`/`write`/`edit`/`apply_patch` を直接実行します。シード後のローカル編集は、`openclaw sandbox recreate` するまで見えません。`scope: "agent"` または `scope: "shared"` では、そのリモートワークスペースが同じスコープで共有されます。現在の制限: サンドボックスブラウザーはまだ対応しておらず、`sandbox.docker.binds` はこのバックエンドには適用されません。

`openclaw sandbox list`/`recreate`/prune はすべて、OpenShell ランタイムを Docker ランタイムと同じように扱います。prune ロジックはバックエンドを認識します。

完全な前提条件、設定リファレンス、ワークスペースモードの比較、ライフサイクルの詳細については、[OpenShell](/ja-JP/gateway/openshell) を参照してください。

## ワークスペースアクセス

`agents.defaults.sandbox.workspaceAccess` はサンドボックスが何を参照できるかを制御します。

| 値               | 動作                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none` (デフォルト) | ツールは `~/.openclaw/sandboxes` 配下の隔離されたサンドボックスワークスペースを参照します。 |
| `ro`             | エージェントワークスペースを `/agent` に読み取り専用でマウントします（`write`/`edit`/`apply_patch` を無効化）。 |
| `rw`             | エージェントワークスペースを `/workspace` に読み書き可能でマウントします。                 |

OpenShell バックエンドでは、`mirror` モードは exec ターン間の正規ソースとして引き続きローカルワークスペースを使用し、`remote` モードは初期シード後の正規ソースとしてリモートの OpenShell ワークスペースを使用します。また、`workspaceAccess: "ro"`/`"none"` は同じ方法で書き込み動作を制限します。

受信メディアはアクティブなサンドボックスワークスペース（`media/inbound/*`）にコピーされます。

<Note>
**Skills**: `read` ツールはサンドボックスルート基準です。`workspaceAccess: "none"` では、OpenClaw は読み取り可能にするため、対象の Skills をサンドボックスワークスペース（`.../skills`）にミラーします。`"rw"` では、ワークスペースの Skills は `/workspace/skills` から読み取り可能で、対象の管理対象、バンドル済み、または Plugin の Skills は、生成された読み取り専用パス `/workspace/.openclaw/sandbox-skills/skills` に実体化されます。
</Note>

## カスタムバインドマウント

`agents.defaults.sandbox.docker.binds` は追加のホストディレクトリをコンテナにマウントします。形式: `host:container:mode`（例: `"/home/user/source:/source:rw"`）。

グローバルバインドとエージェント単位のバインドはマージされます（置き換えではありません）。`scope: "shared"` では、エージェント単位のバインドは無視されます。

`agents.defaults.sandbox.browser.binds` は追加のホストディレクトリを **サンドボックスブラウザ** コンテナにのみマウントします。設定されている場合（`[]` を含む）は、ブラウザコンテナについて `docker.binds` を置き換えます。省略された場合、ブラウザコンテナは `docker.binds` にフォールバックします。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

<Warning>
**バインドのセキュリティ**

- バインドはサンドボックスファイルシステムをバイパスします。設定したモード（`:ro` または `:rw`）でホストパスを公開します。
- OpenClaw は危険なバインド元をデフォルトでブロックします。システムパス（`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`）、Docker ソケットディレクトリ（`/run`, `/var/run` とそれらの `docker.sock` バリアント）、一般的なホームディレクトリの認証情報ルート（`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`）が対象です。
- 検証ではソースパスを正規化し、その後、最も深い既存の祖先を通じて再度解決してから、ブロック済みパスと許可済みルートを再確認します。そのため、最終的なリーフがまだ存在しない場合でも、シンボリックリンク親による脱出は fail closed になります（例: `run-link` がそこを指している場合、`/workspace/run-link/new-file` は引き続き `/var/run/...` として解決されます）。
- 予約済みコンテナマウントポイント（`/workspace`, `/agent`）を隠すバインドターゲットもデフォルトでブロックされます。`agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true` で上書きできます。
- ワークスペース/エージェントワークスペースの許可済みルート外にあるバインド元は、デフォルトでブロックされます。`agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true` で上書きできます。許可済みルートも同じ方法で正規化されるため、シンボリックリンク解決前に許可リスト内に見えるだけのパスも、許可済みルート外として拒否されます。
- 機密マウント（シークレット、SSH キー、サービス認証情報）は、絶対に必要でない限り `:ro` にする必要があります。
- ワークスペースへの読み取りアクセスだけが必要な場合は、`workspaceAccess: "ro"` と組み合わせてください。バインドモードは独立したままです。
- バインドがツールポリシーと昇格 exec とどのように相互作用するかについては、[サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

</Warning>

## イメージとセットアップ

デフォルトの Docker イメージ: `openclaw-sandbox:bookworm-slim`

<Note>
**ソースチェックアウト vs npm install**

`scripts/sandbox-setup.sh`、`scripts/sandbox-common-setup.sh`、`scripts/sandbox-browser-setup.sh` ヘルパースクリプトは、[ソースチェックアウト](https://github.com/openclaw/openclaw) から実行している場合にのみ利用できます。npm パッケージには含まれていません。

`npm install -g openclaw` で OpenClaw をインストールした場合は、代わりに以下に示すインラインの `docker build` コマンドを使用してください。
</Note>

<Steps>
  <Step title="デフォルトイメージをビルドする">
    ソースチェックアウトから:

    ```bash
    scripts/sandbox-setup.sh
    ```

    npm インストールから（ソースチェックアウトは不要）:

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    デフォルトイメージには Node は含まれません。Skill が Node（または他のランタイム）を必要とする場合は、カスタムイメージに焼き込むか、`sandbox.docker.setupCommand` 経由でインストールしてください（ネットワーク egress + 書き込み可能なルート + root ユーザーが必要です）。

    `openclaw-sandbox:bookworm-slim` が見つからない場合でも、OpenClaw はプレーンな `debian:bookworm-slim` を暗黙に代替として使用しません。デフォルトイメージを対象にしたサンドボックス実行は、ビルドするまでビルド手順を表示して即座に失敗します。これは、バンドルされたイメージがサンドボックスの write/edit ヘルパー用に `python3` を含んでいるためです。

  </Step>
  <Step title="任意: 共通イメージをビルドする">
    一般的なツール（たとえば `curl`, `jq`, Node 24, pnpm, `python3`, `git`）を含む、より機能的なサンドボックスイメージを使う場合:

    ソースチェックアウトから:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    npm インストールからは、まずデフォルトイメージをビルドし（上記参照）、その後リポジトリの [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) を使って、その上に共通イメージをビルドします。

    その後、`agents.defaults.sandbox.docker.image` を `openclaw-sandbox-common:bookworm-slim` に設定します。

  </Step>
  <Step title="任意: サンドボックスブラウザ用イメージをビルドする">
    ソースチェックアウトから:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    npm インストールからは、リポジトリの [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) を使ってビルドします。

  </Step>
</Steps>

デフォルトでは、Docker サンドボックスコンテナは **ネットワークなし** で実行されます。`agents.defaults.sandbox.docker.network` で上書きできます。

<AccordionGroup>
  <Accordion title="サンドボックスブラウザの Chromium デフォルト">
    バンドルされたサンドボックスブラウザイメージは、コンテナ化されたワークロード向けに保守的な Chromium 起動フラグを適用します:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - `--headless=new` は `browser.headless` が有効な場合。
    - `--no-sandbox --disable-setuid-sandbox` は `browser.noSandbox` が有効な場合。
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` はデフォルトです。これらのグラフィックス強化フラグは、GPU サポートのないコンテナに役立ちます。ワークロードが WebGL やその他の 3D 機能を必要とする場合は、`OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` を設定してください。
    - `--disable-extensions` はデフォルトです。拡張機能に依存するフローでは `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` を設定してください。
    - `--renderer-process-limit=2` はデフォルトです。`OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で制御され、`0` は Chromium のデフォルトを保持します。

    別のランタイムプロファイルが必要な場合は、カスタムブラウザイメージを使用し、独自のエントリポイントを指定してください。ローカル（非コンテナ）の Chromium プロファイルでは、`browser.extraArgs` を使って追加の起動フラグを付加します。

  </Accordion>
  <Accordion title="ネットワークセキュリティのデフォルト">
    - `network: "host"` はブロックされます。
    - `network: "container:<id>"` はデフォルトでブロックされます（名前空間参加のバイパスリスク）。
    - 緊急時の上書き: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker インストールとコンテナ化された Gateway はこちらです: [Docker](/ja-JP/install/docker)

Docker Gateway デプロイでは、`scripts/docker/setup.sh` がサンドボックス設定をブートストラップできます。そのパスを有効にするには `OPENCLAW_SANDBOX=1`（または `true`/`yes`/`on`）を設定します。ソケットの場所は `OPENCLAW_DOCKER_SOCKET` で上書きできます。完全なセットアップと env リファレンス: [Docker](/ja-JP/install/docker#agent-sandbox)。

## setupCommand（一度だけのコンテナセットアップ）

`setupCommand` はサンドボックスコンテナが作成された後に **一度だけ** 実行されます（毎回の実行ではありません）。コンテナ内で `sh -lc` 経由で実行されます。

パス:

- グローバル: `agents.defaults.sandbox.docker.setupCommand`
- エージェント単位: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="よくある落とし穴">
    - デフォルトの `docker.network` は `"none"`（egress なし）なので、パッケージのインストールは失敗します。
    - `docker.network: "container:<id>"` には `dangerouslyAllowContainerNamespaceJoin: true` が必要で、緊急時専用です。
    - `readOnlyRoot: true` は書き込みを防ぎます。`readOnlyRoot: false` を設定するか、カスタムイメージに焼き込んでください。
    - パッケージインストールには `user` が root である必要があります（`user` を省略するか、`user: "0:0"` を設定）。
    - サンドボックス exec はホストの `process.env` を継承しません。Skill API キーには `agents.defaults.sandbox.docker.env`（またはカスタムイメージ）を使用してください。
    - `agents.defaults.sandbox.docker.env` の値は、明示的な Docker コンテナ環境変数として渡されます。Docker デーモンにアクセスできる人は誰でも、`docker inspect` などの Docker メタデータコマンドでそれらを検査できます。そのメタデータ露出が許容できない場合は、カスタムイメージ、マウントされたシークレットファイル、または別のシークレット配信経路を使用してください。

  </Accordion>
</AccordionGroup>

## ツールポリシーとエスケープハッチ

ツールの allow/deny ポリシーは、サンドボックスルールより前に引き続き適用されます。ツールがグローバルまたはエージェント単位で拒否されている場合、サンドボックス化しても復活しません。

`tools.elevated` は、サンドボックス外で `exec` を実行する明示的なエスケープハッチです（デフォルトは `gateway`、exec ターゲットが `node` の場合は `node`）。`/exec` ディレクティブは承認された送信者にのみ適用され、セッション単位で永続化されます。`exec` を強制的に無効化するには、ツールポリシー deny を使用してください（[サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照）。

デバッグ:

- `openclaw sandbox list` は、サンドボックスコンテナ、ステータス、イメージ一致、経過時間、アイドル時間、関連付けられたセッション/エージェントを表示します。
- `openclaw sandbox explain [--session <key>] [--agent <id>]` は、有効なサンドボックスモード、ホストワークスペース、ランタイム workdir、Docker マウント、ツールポリシー、修正用の設定キーを検査します。その `workspaceRoot` フィールドは設定されたサンドボックスルートのままです。`effectiveHostWorkspaceRoot` はアクティブなワークスペースが実際に存在する場所を示します。
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` は、次回使用時に現在の設定で再作成されるよう、コンテナ/環境を削除します。
- 「なぜこれはブロックされているのか？」というメンタルモデルについては、[サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

## マルチエージェントの上書き

各エージェントはサンドボックス + ツールを上書きできます: `agents.list[].sandbox` と `agents.list[].tools`（サンドボックスツールポリシー用の `agents.list[].tools.sandbox.tools` も含む）。優先順位については、[マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

## 最小有効化例

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## 関連

- [マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェントごとの上書きと優先順位
- [OpenShell](/ja-JP/gateway/openshell) -- 管理されたサンドボックスバックエンドのセットアップ、ワークスペースモード、設定リファレンス
- [サンドボックス設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- [サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) -- 「なぜこれはブロックされるのか？」のデバッグ
- [セキュリティ](/ja-JP/gateway/security)
