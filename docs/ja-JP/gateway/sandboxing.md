---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClaw のサンドボックス化の仕組み: モード、スコープ、ワークスペースアクセス、画像'
title: サンドボックス化
x-i18n:
    generated_at: "2026-07-05T11:23:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c12441ddcecc6bbd2ed6dfa28af843c1492ab39621cc7ead25d51e0a7bacba6a
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw は、影響範囲を小さくするために、ツール実行をサンドボックスバックエンド内で実行できます。サンドボックス化はデフォルトでオフで、`agents.defaults.sandbox`（グローバル）または `agents.list[].sandbox`（エージェント単位）で制御されます。Gateway プロセスは常にホスト上に残ります。有効な場合にサンドボックスへ移動するのはツール実行だけです。

<Note>
これは完全なセキュリティ境界ではありませんが、モデルが不適切な動作をした場合のファイルシステムおよびプロセスへのアクセスを実質的に制限します。
</Note>

## サンドボックス化されるもの

- ツール実行: `exec`、`read`、`write`、`edit`、`apply_patch`、`process` など。
- 任意のサンドボックス化ブラウザー（`agents.defaults.sandbox.browser`）。

サンドボックス化されないもの:

- Gateway プロセス自体。
- `tools.elevated` 経由でサンドボックス外での実行を明示的に許可されたツール。昇格された exec はサンドボックス化をバイパスし、設定されたエスケープパス（デフォルトは `gateway`、exec ターゲットが `node` の場合は `node`）で実行されます。サンドボックス化がオフの場合、exec はすでにホスト上で実行されているため、`tools.elevated` は何も変更しません。[昇格モード](/ja-JP/tools/elevated)を参照してください。

## モード、スコープ、バックエンド

3 つの独立した設定がサンドボックスの動作を制御します。

| 設定 | キー                              | 値                           | デフォルト |
| ------- | --------------------------------- | ---------------------------- | -------- |
| モード    | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`    |
| スコープ   | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`  |
| バックエンド | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker` |

**モード** は、サンドボックス化が適用されるタイミングを制御します。

- `off`: サンドボックス化しません。
- `non-main`: エージェントのメインセッションを除くすべてのセッションをサンドボックス化します。メインセッションキーは常に `agent:<agentId>:main`（または `session.scope` が `"global"` の場合は `global`）で、設定できません。グループ/チャネルセッションは独自のキーを使うため、常に non-main と見なされ、サンドボックス化されます。
- `all`: すべてのセッションがサンドボックス内で実行されます。

**スコープ** は、作成されるコンテナー/環境の数を制御します。

- `agent`: エージェントごとに 1 つのコンテナー。
- `session`: セッションごとに 1 つのコンテナー。
- `shared`: すべてのサンドボックス化セッションで共有される 1 つのコンテナー（このスコープでは、エージェント単位の `docker`/`ssh`/`browser` オーバーライドは無視されます）。

**バックエンド** は、サンドボックス化されたツールを実行するランタイムを制御します。SSH 固有の設定は `agents.defaults.sandbox.ssh` の下にあります。OpenShell 固有の設定は `plugins.entries.openshell.config` の下にあります。

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **実行場所**   | ローカルコンテナー                  | SSH でアクセス可能な任意のホスト        | OpenShell 管理のサンドボックス                           |
| **セットアップ**           | `scripts/sandbox-setup.sh`       | SSH キー + ターゲットホスト          | OpenShell Plugin が有効                            |
| **ワークスペースモデル** | バインドマウントまたはコピー               | リモートを正とする（一度だけシード）   | `mirror` または `remote`                                |
| **ネットワーク制御** | `docker.network`（デフォルト: なし） | リモートホストに依存         | OpenShell に依存                                |
| **ブラウザーサンドボックス** | 対応                        | 未対応                  | まだ未対応                                   |
| **バインドマウント**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **最適な用途**        | ローカル開発、完全な分離        | リモートマシンへのオフロード | 任意の双方向同期を備えた管理リモートサンドボックス |

## Docker バックエンド

Docker は、サンドボックス化が有効になるとデフォルトのバックエンドになります。Docker デーモンソケット（`/var/run/docker.sock`）経由でツールとサンドボックスブラウザーをローカル実行します。分離は Docker 名前空間によって提供されます。

デフォルト: `network: "none"`（外向き通信なし）、`readOnlyRoot: true`、`capDrop: ["ALL"]`、イメージ `openclaw-sandbox:bookworm-slim`。

ホスト GPU を公開するには、`agents.defaults.sandbox.docker.gpus`（またはエージェント単位のオーバーライド）を `"all"` や `"device=GPU-uuid"` のような値に設定します。これは Docker の `--gpus` フラグに渡され、NVIDIA Container Toolkit などの互換性のあるホストランタイムが必要です。

<Warning>
**Docker-out-of-Docker (DooD) の制約**

OpenClaw Gateway 自体を Docker コンテナーとしてデプロイする場合、ホストの Docker ソケットを使って兄弟サンドボックスコンテナーをオーケストレーションします（DooD）。これにより、パスマッピングの制約が生じます。

- **設定にはホストパスが必要**: `openclaw.json` の `workspace` には、内部 Gateway コンテナーパスではなく、**ホストの絶対パス**（例: `/home/user/.openclaw/workspaces`）を含める必要があります。Docker デーモンは、Gateway 自身の名前空間ではなく、ホスト OS の名前空間を基準にパスを評価します。
- **一致するボリュームマップが必要**: Gateway プロセスもその `workspace` パスに Heartbeat とブリッジファイルを書き込みます。同じホストパスが Gateway コンテナー内からも正しく解決されるように、Gateway コンテナーに同一のボリュームマップ（`-v /home/user/.openclaw:/home/user/.openclaw`）を指定してください。マッピングが一致しない場合、Gateway が Heartbeat を書き込もうとしたときに `EACCES` として現れます。
- **Codex コードモード**: OpenClaw サンドボックスがアクティブな場合、OpenClaw はそのターンについて、Codex app-server ネイティブ Code Mode、ユーザー MCP サーバー、アプリに支えられた Plugin 実行を無効にします（これらは OpenClaw サンドボックスバックエンドではなく、Gateway ホストの app-server プロセスから実行されます）。ただし、サンドボックスツールポリシーが必要なツールを公開し、実験的なサンドボックス exec-server パスを明示的に有効にした場合を除きます。その場合、シェルアクセスは `sandbox_exec` や `sandbox_process` などの OpenClaw サンドボックスに支えられたツール経由でルーティングされます。ホストの Docker ソケットをエージェントサンドボックスコンテナーやカスタム Codex サンドボックスにマウントしないでください。完全な動作については [Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。

Docker サンドボックスモードが有効な Ubuntu/AppArmor ホストでは、Codex app-server の `workspace-write` シェル実行にはサンドボックスコンテナー内の非特権ユーザー名前空間が必要であり、サービスユーザーがそれらを作成できない場合、シェル起動前に失敗することがあります。Docker サンドボックスの外向き通信が無効（`network: "none"`、デフォルト）な場合は、非特権ネットワーク名前空間も必要です。一般的な症状: `bwrap: setting up uid map: Permission denied` および `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。`openclaw doctor` を実行してください。Codex bwrap 名前空間プローブの失敗が報告された場合は、OpenClaw サービスプロセスに必要な名前空間を許可する AppArmor プロファイルを優先してください。`kernel.apparmor_restrict_unprivileged_userns=0` はホスト全体のフォールバックであり、セキュリティ上のトレードオフがあります。そのホストの態勢として許容できる場合にのみ使用してください。
</Warning>

### サンドボックス化ブラウザー

- ブラウザーツールが必要としたときに、サンドボックスブラウザーは自動起動します（CDP に到達できることを保証します）。`agents.defaults.sandbox.browser.autoStart`（デフォルト `true`）と `autoStartTimeoutMs`（デフォルト 12s）で設定します。
- サンドボックスブラウザーコンテナーは、グローバルな `bridge` ネットワークの代わりに専用の Docker ネットワーク（`openclaw-sandbox-browser`）を使用します。`agents.defaults.sandbox.browser.network` で設定します。
- `agents.defaults.sandbox.browser.cdpSourceRange` は、CIDR 許可リスト（例: `172.21.0.1/32`）でコンテナーエッジの CDP 入力を制限します。
- noVNC オブザーバーアクセスはデフォルトでパスワード保護されています。OpenClaw は、ローカルブートストラップページを提供し、URL フラグメント（クエリ文字列やヘッダーログではありません）にパスワードを含めて noVNC を開く短命トークン URL を出力します。
- `agents.defaults.sandbox.browser.allowHostControl`（デフォルト `false`）は、サンドボックス化セッションがホストブラウザーを明示的にターゲットにできるようにします。
- 任意の許可リストが `target: "custom"` をゲートします: `allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

## SSH バックエンド

任意の SSH でアクセス可能なマシン上で `exec`、ファイルツール、メディア読み取りをサンドボックス化するには、`backend: "ssh"` を使用します。

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

- **ライフサイクル**: OpenClaw は `sandbox.ssh.workspaceRoot` の下にスコープ単位のリモートルートを作成します。作成または再作成後の初回使用時に、ローカルワークスペースからそのリモートワークスペースへ一度だけシードします。その後、`exec`、`read`、`write`、`edit`、`apply_patch`、プロンプトメディア読み取り、受信メディアのステージングは、SSH 経由でリモートワークスペースに対して直接実行されます。OpenClaw はリモートの変更をローカルワークスペースへ自動的に同期しません。
- **認証素材**: `identityFile`/`certificateFile`/`knownHostsFile` は既存のローカルファイルを参照します。`identityData`/`certificateData`/`knownHostsData` はインライン文字列または SecretRefs を受け付け、通常のシークレットランタイムスナップショットを通じて解決され、モード `0600` の一時ファイルに書き込まれ、SSH セッション終了時に削除されます。同じ項目に `*File` と `*Data` の両方のバリアントが設定されている場合、そのセッションでは `*Data` が優先されます。
- **リモートを正とする場合の影響**: 初回シード後、リモート SSH ワークスペースが実際のサンドボックス状態になります。シード手順後に OpenClaw 外で行われたホストローカル編集は、サンドボックスを再作成するまでリモートには見えません。`openclaw sandbox recreate` はスコープ単位のリモートルートを削除し、次回使用時にローカルから再度シードします。このバックエンドではブラウザーサンドボックス化はサポートされず、`sandbox.docker.*` 設定は適用されません。

## OpenShell バックエンド

OpenShell 管理のリモート環境でツールをサンドボックス化するには、`backend: "openshell"` を使用します。OpenShell は汎用 SSH バックエンドと同じ SSH トランスポートおよびリモートファイルシステムブリッジを再利用し、OpenShell ライフサイクル（`sandbox create/get/delete/ssh-config`）と任意の `mirror` ワークスペース同期モードを追加します。

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

`mode: "mirror"`（デフォルト）は、ローカルワークスペースを正とします。OpenClaw は `exec` の前にローカルをサンドボックスへ同期し、その後に同期し戻します。`mode: "remote"` は、リモートワークスペースをローカルから一度だけシードし、その後は同期し戻さずに、リモートワークスペースに対して `exec`/`read`/`write`/`edit`/`apply_patch` を直接実行します。シード後のローカル編集は、`openclaw sandbox recreate` するまで見えません。`scope: "agent"` または `scope: "shared"` の下では、そのリモートワークスペースは同じスコープで共有されます。現在の制限: サンドボックスブラウザーはまだサポートされておらず、`sandbox.docker.binds` はこのバックエンドには適用されません。

`openclaw sandbox list`/`recreate`/prune all は、OpenShell ランタイムを Docker ランタイムと同じように扱います。prune ロジックはバックエンドを認識します。

完全な前提条件、設定リファレンス、ワークスペースモード比較、ライフサイクルの詳細については、[OpenShell](/ja-JP/gateway/openshell)を参照してください。

## ワークスペースアクセス

`agents.defaults.sandbox.workspaceAccess` は、サンドボックスが参照できる内容を制御します:

| 値               | 動作                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none` (デフォルト) | ツールは `~/.openclaw/sandboxes` 配下の分離されたサンドボックスワークスペースを見る。      |
| `ro`             | エージェントワークスペースを読み取り専用で `/agent` にマウントする（`write`/`edit`/`apply_patch` を無効化）。 |
| `rw`             | エージェントワークスペースを読み書き可能で `/workspace` にマウントする。                  |

OpenShell バックエンドでは、`mirror` モードは exec ターン間の正規ソースとして引き続きローカルワークスペースを使用し、`remote` モードは初期シード後にリモートの OpenShell ワークスペースを正規ソースとして使用します。また、`workspaceAccess: "ro"`/`"none"` は同じ方法で書き込み動作を制限します。

受信メディアはアクティブなサンドボックスワークスペース（`media/inbound/*`）にコピーされます。

<Note>
**Skills**: `read` ツールはサンドボックスルート基準です。`workspaceAccess: "none"` の場合、OpenClaw は対象の skills をサンドボックスワークスペース（`.../skills`）へミラーするため、それらを読み取れます。`"rw"` の場合、ワークスペースの skills は `/workspace/skills` から読み取り可能で、対象の管理、バンドル、または plugin skills は生成された読み取り専用パス `/workspace/.openclaw/sandbox-skills/skills` に実体化されます。
</Note>

## カスタムバインドマウント

`agents.defaults.sandbox.docker.binds` は追加のホストディレクトリをコンテナにマウントします。形式は `host:container:mode` です（例: `"/home/user/source:/source:rw"`）。

グローバルとエージェントごとのバインドはマージされます（置き換えではありません）。`scope: "shared"` では、エージェントごとのバインドは無視されます。

`agents.defaults.sandbox.browser.binds` は追加のホストディレクトリを **サンドボックスブラウザ** コンテナのみにマウントします。設定されている場合（`[]` を含む）、ブラウザコンテナでは `docker.binds` を置き換えます。省略された場合、ブラウザコンテナは `docker.binds` にフォールバックします。

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

- バインドはサンドボックスファイルシステムを迂回します。設定したモード（`:ro` または `:rw`）でホストパスを公開します。
- OpenClaw は危険なバインドソースをデフォルトでブロックします。システムパス（`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`）、Docker ソケットディレクトリ（`/run`, `/var/run` とそれらの `docker.sock` バリアント）、一般的なホームディレクトリの認証情報ルート（`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`）です。
- 検証ではソースパスを正規化し、ブロック対象パスと許可ルートを再チェックする前に、存在する最も深い祖先を通じて再度解決します。そのため、最終リーフがまだ存在しない場合でも、シンボリックリンク親による脱出はフェイルクローズします（例: `run-link` がそこを指している場合、`/workspace/run-link/new-file` は引き続き `/var/run/...` として解決されます）。
- 予約済みコンテナマウントポイント（`/workspace`, `/agent`）を覆い隠すバインドターゲットもデフォルトでブロックされます。`agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true` で上書きできます。
- ワークスペース/エージェントワークスペースの許可リストに含まれるルートの外にあるバインドソースは、デフォルトでブロックされます。`agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true` で上書きできます。許可されたルートも同じ方法で正規化されるため、シンボリックリンク解決前に許可リスト内に見えるだけのパスは、許可ルートの外として拒否されます。
- 機密マウント（シークレット、SSH キー、サービス認証情報）は、絶対に必要でない限り `:ro` にする必要があります。
- ワークスペースへの読み取りアクセスだけが必要な場合は、`workspaceAccess: "ro"` と組み合わせてください。バインドモードは独立したままです。
- バインドがツールポリシーおよび昇格 exec とどのように相互作用するかについては、[サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

</Warning>

## イメージとセットアップ

デフォルトの Docker イメージ: `openclaw-sandbox:bookworm-slim`

<Note>
**ソースチェックアウトと npm install**

`scripts/sandbox-setup.sh`、`scripts/sandbox-common-setup.sh`、`scripts/sandbox-browser-setup.sh` ヘルパースクリプトは、[ソースチェックアウト](https://github.com/openclaw/openclaw) から実行している場合にのみ利用できます。npm パッケージには含まれていません。

`npm install -g openclaw` で OpenClaw をインストールした場合は、代わりに以下に示すインラインの `docker build` コマンドを使用してください。
</Note>

<Steps>
  <Step title="デフォルトイメージをビルドする">
    ソースチェックアウトから:

    ```bash
    scripts/sandbox-setup.sh
    ```

    npm install から（ソースチェックアウトは不要）:

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

    デフォルトイメージには **Node** は含まれていません。skill が Node（または他のランタイム）を必要とする場合は、カスタムイメージに組み込むか、`sandbox.docker.setupCommand` 経由でインストールしてください（ネットワーク送信 + 書き込み可能なルート + root ユーザーが必要）。

    `openclaw-sandbox:bookworm-slim` がない場合、OpenClaw はプレーンな `debian:bookworm-slim` にサイレントに置き換えません。デフォルトイメージを対象とするサンドボックス実行は、ビルドするまでビルド手順付きで即座に失敗します。これは、バンドルイメージがサンドボックスの write/edit ヘルパー用に `python3` を含むためです。

  </Step>
  <Step title="任意: 共通イメージをビルドする">
    一般的なツール（たとえば `curl`、`jq`、Node 24、pnpm、`python3`、`git`）を備えた、より機能的なサンドボックスイメージの場合:

    ソースチェックアウトから:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    npm install からは、まずデフォルトイメージをビルドし（上記参照）、次にリポジトリの [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) を使用して、その上に共通イメージをビルドします。

    次に、`agents.defaults.sandbox.docker.image` を `openclaw-sandbox-common:bookworm-slim` に設定します。

  </Step>
  <Step title="任意: サンドボックスブラウザイメージをビルドする">
    ソースチェックアウトから:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    npm install からは、リポジトリの [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) を使用してビルドします。

  </Step>
</Steps>

デフォルトでは、Docker サンドボックスコンテナは **ネットワークなし** で実行されます。`agents.defaults.sandbox.docker.network` で上書きできます。

<AccordionGroup>
  <Accordion title="サンドボックスブラウザ Chromium のデフォルト">
    バンドルされたサンドボックスブラウザイメージは、コンテナ化されたワークロード向けに保守的な Chromium 起動フラグを適用します。

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
    - `--disable-3d-apis`、`--disable-gpu`、`--disable-software-rasterizer` はデフォルトで有効です。これらのグラフィックス強化フラグは、GPU サポートのないコンテナで役立ちます。ワークロードが WebGL または他の 3D 機能を必要とする場合は、`OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` を設定してください。
    - `--disable-extensions` はデフォルトで有効です。拡張機能に依存するフローでは `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` を設定してください。
    - `--renderer-process-limit=2` はデフォルトです。`OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で制御され、`0` は Chromium のデフォルトを維持します。

    別のランタイムプロファイルが必要な場合は、カスタムブラウザイメージを使用し、独自のエントリーポイントを指定してください。ローカル（非コンテナ）の Chromium プロファイルでは、追加の起動フラグを付加するために `browser.extraArgs` を使用してください。

  </Accordion>
  <Accordion title="ネットワークセキュリティのデフォルト">
    - `network: "host"` はブロックされます。
    - `network: "container:<id>"` はデフォルトでブロックされます（名前空間参加による迂回リスク）。
    - 緊急時の上書き: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker インストールとコンテナ化された Gateway はこちらにあります: [Docker](/ja-JP/install/docker)

Docker Gateway デプロイでは、`scripts/docker/setup.sh` がサンドボックス設定をブートストラップできます。そのパスを有効にするには `OPENCLAW_SANDBOX=1`（または `true`/`yes`/`on`）を設定します。ソケットの場所は `OPENCLAW_DOCKER_SOCKET` で上書きできます。完全なセットアップと env リファレンス: [Docker](/ja-JP/install/docker#agent-sandbox)。

## setupCommand（1 回限りのコンテナセットアップ）

`setupCommand` はサンドボックスコンテナが作成された後に **1 回だけ** 実行されます（毎回の実行時ではありません）。コンテナ内で `sh -lc` 経由で実行されます。

パス:

- グローバル: `agents.defaults.sandbox.docker.setupCommand`
- エージェントごと: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="よくある落とし穴">
    - デフォルトの `docker.network` は `"none"`（送信なし）なので、パッケージのインストールは失敗します。
    - `docker.network: "container:<id>"` には `dangerouslyAllowContainerNamespaceJoin: true` が必要で、緊急時専用です。
    - `readOnlyRoot: true` は書き込みを防ぎます。`readOnlyRoot: false` を設定するか、カスタムイメージに組み込んでください。
    - パッケージのインストールには `user` が root である必要があります（`user` を省略するか、`user: "0:0"` を設定）。
    - サンドボックス exec はホストの `process.env` を継承 **しません**。skill API キーには `agents.defaults.sandbox.docker.env`（またはカスタムイメージ）を使用してください。
    - `agents.defaults.sandbox.docker.env` の値は、明示的な Docker コンテナ環境変数として渡されます。Docker デーモンへアクセスできる人は誰でも、`docker inspect` などの Docker メタデータコマンドでそれらを調べられます。そのメタデータ露出が許容できない場合は、カスタムイメージ、マウントされたシークレットファイル、または別のシークレット配布パスを使用してください。

  </Accordion>
</AccordionGroup>

## ツールポリシーとエスケープハッチ

ツールの allow/deny ポリシーは、サンドボックスルールの前に引き続き適用されます。ツールがグローバルまたはエージェントごとに拒否されている場合、サンドボックス化によって復活することはありません。

`tools.elevated` は、サンドボックス外で `exec` を実行する明示的なエスケープハッチです（デフォルトは `gateway`、exec ターゲットが `node` の場合は `node`）。`/exec` ディレクティブは承認済み送信者にのみ適用され、セッションごとに永続化されます。`exec` を強制的に無効化するには、ツールポリシー deny を使用してください（[サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照）。

デバッグ:

- `openclaw sandbox list` はサンドボックスコンテナ、ステータス、イメージ一致、経過時間、アイドル時間、関連するセッション/エージェントを表示します。
- `openclaw sandbox explain [--session <key>] [--agent <id>]` は有効なサンドボックスモード、ツールポリシー、修正用設定キーを検査します。
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` はコンテナ/環境を削除し、次回使用時に現在の設定で再作成されるようにします。
- 「なぜこれがブロックされるのか？」という考え方については、[サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

## マルチエージェントのオーバーライド

各エージェントはサンドボックス + ツールを上書きできます: `agents.list[].sandbox` と `agents.list[].tools`（さらにサンドボックスツールポリシー用の `agents.list[].tools.sandbox.tools`）。優先順位については、[マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

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

- [マルチエージェント Sandbox とツール](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェントごとのオーバーライドと優先順位
- [OpenShell](/ja-JP/gateway/openshell) -- 管理型 sandbox バックエンドのセットアップ、ワークスペースモード、設定リファレンス
- [Sandbox 設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox とツールポリシーと昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) -- 「なぜこれがブロックされるのか？」のデバッグ
- [セキュリティ](/ja-JP/gateway/security)
