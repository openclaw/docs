---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: OpenClaw のサンドボックス機能の仕組み：モード、スコープ、ワークスペースへのアクセス、イメージ
title: サンドボックス化
x-i18n:
    generated_at: "2026-07-11T22:16:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClawは、影響範囲を縮小するために、サンドボックスバックエンド内でツールを実行できます。サンドボックス化はデフォルトでは無効で、`agents.defaults.sandbox`（グローバル）または`agents.list[].sandbox`（エージェント単位）で制御します。Gatewayプロセスは常にホスト上に留まり、有効にした場合にツール実行だけがサンドボックスへ移動します。

<Note>
これは完全なセキュリティ境界ではありませんが、モデルが不適切な動作をした場合のファイルシステムおよびプロセスへのアクセスを大幅に制限します。
</Note>

## サンドボックス化されるもの

- ツール実行：`exec`、`read`、`write`、`edit`、`apply_patch`、`process`など。
- オプションのサンドボックス化ブラウザー（`agents.defaults.sandbox.browser`）。

サンドボックス化されないもの：

- Gatewayプロセス自体。
- `tools.elevated`によってサンドボックス外での実行が明示的に許可されたツール。昇格されたexecはサンドボックス化を迂回し、設定されたエスケープパス（デフォルトは`gateway`、execターゲットが`node`の場合は`node`）で実行されます。サンドボックス化が無効な場合、execはすでにホスト上で実行されるため、`tools.elevated`による変化はありません。[昇格モード](/ja-JP/tools/elevated)を参照してください。

## モード、スコープ、バックエンド

サンドボックスの動作は、互いに独立した3つの設定で制御します。

| 設定 | キー                              | 値                           | デフォルト |
| ---- | --------------------------------- | ---------------------------- | ---------- |
| モード | `agents.defaults.sandbox.mode`    | `off`、`non-main`、`all`     | `off`      |
| スコープ | `agents.defaults.sandbox.scope`   | `agent`、`session`、`shared` | `agent`    |
| バックエンド | `agents.defaults.sandbox.backend` | `docker`、`ssh`、`openshell` | `docker`   |

**モード**は、サンドボックス化をいつ適用するかを制御します。

- `off`：サンドボックス化しません。
- `non-main`：エージェントのメインセッションを除くすべてのセッションをサンドボックス化します。メインセッションキーは常に`agent:<agentId>:main`（`session.scope`が`"global"`の場合は`global`）であり、変更できません。グループ／チャンネルセッションは独自のキーを使用するため、常に非メインとして扱われ、サンドボックス化されます。
- `all`：すべてのセッションをサンドボックス内で実行します。

**スコープ**は、作成するコンテナ／環境の数を制御します。

- `agent`：エージェントごとに1つのコンテナ。
- `session`：セッションごとに1つのコンテナ。
- `shared`：サンドボックス化されたすべてのセッションで1つのコンテナを共有します（このスコープでは、エージェント単位の`docker`／`ssh`／`browser`オーバーライドは無視されます）。

**バックエンド**は、サンドボックス化されたツールを実行するランタイムを制御します。SSH固有の設定は`agents.defaults.sandbox.ssh`に、OpenShell固有の設定は`plugins.entries.openshell.config`にあります。

|                       | Docker                           | SSH                            | OpenShell                                      |
| --------------------- | -------------------------------- | ------------------------------ | ---------------------------------------------- |
| **実行場所**          | ローカルコンテナ                 | SSHでアクセス可能な任意のホスト | OpenShell管理のサンドボックス                  |
| **セットアップ**      | `scripts/sandbox-setup.sh`       | SSHキー＋ターゲットホスト      | OpenShell Pluginを有効化                       |
| **ワークスペースモデル** | バインドマウントまたはコピー     | リモートを正とする（初回のみシード） | `mirror`または`remote`                         |
| **ネットワーク制御**  | `docker.network`（デフォルト：なし） | リモートホストに依存           | OpenShellに依存                                |
| **ブラウザーサンドボックス** | 対応                             | 非対応                         | 現時点では非対応                               |
| **バインドマウント**  | `docker.binds`                   | 該当なし                       | 該当なし                                       |
| **最適な用途**        | ローカル開発、完全な分離         | リモートマシンへのオフロード   | オプションの双方向同期を備えた管理対象リモートサンドボックス |

## Dockerバックエンド

サンドボックス化を有効にすると、Dockerがデフォルトのバックエンドになります。Dockerデーモンソケット（`/var/run/docker.sock`）を介してツールとサンドボックスブラウザーをローカルで実行し、Docker名前空間によって分離します。

デフォルト：`network: "none"`（外向き通信なし）、`readOnlyRoot: true`、`capDrop: ["ALL"]`、イメージ`openclaw-sandbox:bookworm-slim`。

ホストGPUを公開するには、`agents.defaults.sandbox.docker.gpus`（またはエージェント単位のオーバーライド）を`"all"`や`"device=GPU-uuid"`などの値に設定します。これはDockerの`--gpus`フラグに渡され、NVIDIA Container Toolkitなど、互換性のあるホストランタイムが必要です。

<Warning>
**Docker-out-of-Docker（DooD）の制約**

OpenClaw Gateway自体をDockerコンテナとしてデプロイする場合、ホストのDockerソケットを使用して同階層のサンドボックスコンテナをオーケストレーションします（DooD）。これにより、パスマッピングに次の制約が生じます。

- **設定にはホストパスが必要**：`openclaw.json`の`workspace`には、Gatewayコンテナ内のパスではなく、**ホストの絶対パス**（例：`/home/user/.openclaw/workspaces`）を指定する必要があります。Dockerデーモンは、Gateway自身の名前空間ではなく、ホストOSの名前空間を基準にパスを評価します。
- **一致するボリュームマップが必要**：Gatewayプロセスも、その`workspace`パスにHeartbeatファイルとブリッジファイルを書き込みます。同じホストパスがGatewayコンテナ内からも正しく解決されるように、Gatewayコンテナに同一のボリュームマップ（`-v /home/user/.openclaw:/home/user/.openclaw`）を指定してください。マッピングが一致しない場合、GatewayがHeartbeatを書き込もうとしたときに`EACCES`が発生します。
- **Codexコードモード**：OpenClawサンドボックスが有効な場合、そのターンでは、サンドボックスのツールポリシーが必要なツールを公開し、試験的なサンドボックスexec-serverパスを明示的に有効化していない限り、OpenClawはCodex app-serverのネイティブCode Mode、ユーザーMCPサーバー、およびアプリ連携Pluginの実行を無効にします（これらはOpenClawサンドボックスバックエンドではなく、Gatewayホスト上のapp-serverプロセスから実行されます）。その場合、シェルアクセスは`sandbox_exec`や`sandbox_process`など、OpenClawのサンドボックスバックエンド対応ツールを経由します。ホストのDockerソケットをエージェントのサンドボックスコンテナやカスタムCodexサンドボックスにマウントしないでください。完全な動作については、[Codexハーネス](/ja-JP/plugins/codex-harness)を参照してください。

Dockerサンドボックスモードを有効にしたUbuntu／AppArmorホストでは、Codex app-serverの`workspace-write`シェル実行に、サンドボックスコンテナ内の非特権ユーザー名前空間が必要です。サービスユーザーがそれを作成できない場合、シェルの起動前に失敗することがあります。Dockerサンドボックスの外向き通信を無効にしている場合（デフォルトの`network: "none"`）、非特権ネットワーク名前空間も必要です。一般的な症状は、`bwrap: setting up uid map: Permission denied`および`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`です。`openclaw doctor`を実行してください。Codexのbwrap名前空間プローブ失敗が報告された場合は、OpenClawサービスプロセスに必要な名前空間を許可するAppArmorプロファイルを優先してください。`kernel.apparmor_restrict_unprivileged_userns=0`はセキュリティ上のトレードオフを伴うホスト全体のフォールバックです。そのホストのセキュリティ方針で許容できる場合にのみ使用してください。
</Warning>

### サンドボックス化されたブラウザー

- ブラウザーツールが必要とすると、サンドボックスブラウザーは自動起動します（CDPに到達可能な状態を確保します）。`agents.defaults.sandbox.browser.autoStart`（デフォルト`true`）および`autoStartTimeoutMs`（デフォルト12秒）で設定します。
- サンドボックスブラウザーコンテナは、グローバルな`bridge`ネットワークではなく、専用のDockerネットワーク（`openclaw-sandbox-browser`）を使用します。`agents.defaults.sandbox.browser.network`で設定します。
- `agents.defaults.sandbox.browser.cdpSourceRange`は、CIDR許可リスト（例：`172.21.0.1/32`）を使用して、コンテナ境界でのCDP受信を制限します。
- noVNCオブザーバーアクセスはデフォルトでパスワード保護されています。OpenClawは、有効期間の短いトークンURLを生成します。このURLはローカルのブートストラップページを提供し、URLフラグメントにパスワードを含めてnoVNCを開きます（クエリ文字列やヘッダーログには含めません）。
- `agents.defaults.sandbox.browser.allowHostControl`（デフォルト`false`）を有効にすると、サンドボックス化されたセッションからホストブラウザーを明示的にターゲットにできます。
- オプションの許可リスト`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`によって、`target: "custom"`を制限します。

## SSHバックエンド

任意のSSHアクセス可能なマシン上で`exec`、ファイルツール、メディア読み取りをサンドボックス化するには、`backend: "ssh"`を使用します。

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
          // または、ローカルファイルの代わりにSecretRefs／インライン内容を使用：
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

デフォルト：`command: "ssh"`、`workspaceRoot: "/tmp/openclaw-sandboxes"`、`strictHostKeyChecking: true`、`updateHostKeys: true`。

- **ライフサイクル**：OpenClawは、`sandbox.ssh.workspaceRoot`の下にスコープごとのリモートルートを作成します。作成または再作成後の初回使用時に、ローカルワークスペースからそのリモートワークスペースへ一度だけシードします。その後、`exec`、`read`、`write`、`edit`、`apply_patch`、プロンプト内メディアの読み取り、および受信メディアのステージングは、SSH経由でリモートワークスペースに対して直接実行されます。OpenClawはリモートでの変更をローカルワークスペースへ自動的に同期しません。
- **認証情報**：`identityFile`／`certificateFile`／`knownHostsFile`は、既存のローカルファイルを参照します。`identityData`／`certificateData`／`knownHostsData`は、インライン文字列またはSecretRefsを受け入れます。これらは通常のシークレットランタイムスナップショットを介して解決され、モード`0600`の一時ファイルに書き込まれ、SSHセッション終了時に削除されます。同じ項目に`*File`と`*Data`の両方が設定されている場合、そのセッションでは`*Data`が優先されます。
- **リモートを正とする場合の影響**：初回シード後は、リモートSSHワークスペースが実際のサンドボックス状態になります。シード後にOpenClaw外で行ったホストローカルの編集は、サンドボックスを再作成するまでリモートには反映されません。`openclaw sandbox recreate`はスコープごとのリモートルートを削除し、次回使用時にローカルから再度シードします。このバックエンドではブラウザーのサンドボックス化はサポートされず、`sandbox.docker.*`設定も適用されません。

## OpenShellバックエンド

OpenShellが管理するリモート環境内でツールをサンドボックス化するには、`backend: "openshell"`を使用します。OpenShellは、汎用SSHバックエンドと同じSSHトランスポートおよびリモートファイルシステムブリッジを再利用し、OpenShellのライフサイクル（`sandbox create/get/delete/ssh-config`）と、オプションの`mirror`ワークスペース同期モードを追加します。

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

`mode: "mirror"`（デフォルト）では、ローカルワークスペースを正として維持します。OpenClawは`exec`の前にローカルからサンドボックスへ同期し、実行後にサンドボックスからローカルへ同期します。`mode: "remote"`では、ローカルからリモートワークスペースへ一度だけシードし、その後は同期を戻さずに、リモートワークスペースに対して`exec`／`read`／`write`／`edit`／`apply_patch`を直接実行します。シード後のローカル編集は、`openclaw sandbox recreate`を実行するまで反映されません。`scope: "agent"`または`scope: "shared"`では、そのリモートワークスペースが同じスコープで共有されます。現在の制限：サンドボックスブラウザーはまだサポートされておらず、`sandbox.docker.binds`はこのバックエンドには適用されません。

`openclaw sandbox list`／`recreate`／pruneはすべて、OpenShellランタイムをDockerランタイムと同様に扱います。pruneロジックはバックエンドを認識します。

完全な前提条件、設定リファレンス、ワークスペースモードの比較、ライフサイクルの詳細については、[OpenShell](/ja-JP/gateway/openshell)を参照してください。

## ワークスペースへのアクセス

`agents.defaults.sandbox.workspaceAccess`は、サンドボックスから参照できる範囲を制御します。

| 値               | 動作                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none`（既定）   | ツールには `~/.openclaw/sandboxes` 配下の隔離されたサンドボックスワークスペースが見えます。 |
| `ro`             | エージェントワークスペースを `/agent` に読み取り専用でマウントします（`write`/`edit`/`apply_patch` は無効になります）。 |
| `rw`             | エージェントワークスペースを `/workspace` に読み書き可能でマウントします。                |

OpenShell バックエンドでは、`mirror` モードは引き続き exec ターン間の正規ソースとしてローカルワークスペースを使用し、`remote` モードは初回シード後にリモート OpenShell ワークスペースを正規ソースとして使用します。また、`workspaceAccess: "ro"`/`"none"` は引き続き同じ方法で書き込み動作を制限します。

受信メディアは、アクティブなサンドボックスワークスペース（`media/inbound/*`）にコピーされます。

<Note>
**Skills**：`read` ツールのルートはサンドボックスです。`workspaceAccess: "none"` の場合、OpenClaw は対象となる Skills をサンドボックスワークスペース（`.../skills`）にミラーし、読み取れるようにします。`"rw"` の場合、ワークスペースの Skills は `/workspace/skills` から読み取ることができ、対象となる管理対象、同梱、または Plugin の Skills は、生成された読み取り専用パス `/workspace/.openclaw/sandbox-skills/skills` に実体化されます。
</Note>

## カスタムバインドマウント

`agents.defaults.sandbox.docker.binds` は、追加のホストディレクトリをコンテナにマウントします。形式：`host:container:mode`（例：`"/home/user/source:/source:rw"`）。

グローバルとエージェント単位のバインドはマージされます（置換されません）。`scope: "shared"` では、エージェント単位のバインドは無視されます。

`agents.defaults.sandbox.browser.binds` は、追加のホストディレクトリを **サンドボックスブラウザー** コンテナのみにマウントします。設定されている場合（`[]` を含む）、ブラウザーコンテナでは `docker.binds` を置き換えます。省略した場合、ブラウザーコンテナは `docker.binds` にフォールバックします。

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

- バインドはサンドボックスのファイルシステムを迂回し、設定したモード（`:ro` または `:rw`）でホストパスを公開します。
- OpenClaw は危険なバインド元を既定でブロックします。対象は、システムパス（`/etc`、`/proc`、`/sys`、`/dev`、`/root`、`/boot`）、Docker ソケットディレクトリ（`/run`、`/var/run`、およびそれらの `docker.sock` バリアント）、一般的なホームディレクトリの認証情報ルート（`~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm`、`~/.ssh`）です。
- 検証では、まずソースパスを正規化し、次に存在する最深の祖先を経由して再度解決したうえで、ブロック対象パスと許可ルートを再確認します。そのため、最終リーフがまだ存在しない場合でも、シンボリックリンクの親を使った脱出は安全側に失敗します（例：`run-link` がその場所を指している場合、`/workspace/run-link/new-file` は引き続き `/var/run/...` として解決されます）。
- 予約済みのコンテナマウントポイント（`/workspace`、`/agent`）を覆い隠すバインド先も、既定でブロックされます。上書きするには `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true` を使用します。
- ワークスペースまたはエージェントワークスペースの許可リスト対象ルート外にあるバインド元は、既定でブロックされます。上書きするには `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true` を使用します。許可されたルートも同じ方法で正規化されるため、シンボリックリンクの解決前にのみ許可リスト内に見えるパスは、許可ルート外として引き続き拒否されます。
- 機密性の高いマウント（シークレット、SSH キー、サービス認証情報）は、絶対に必要な場合を除き `:ro` にしてください。
- ワークスペースへの読み取りアクセスだけが必要な場合は、`workspaceAccess: "ro"` と組み合わせてください。バインドモードは独立したままです。
- バインドとツールポリシーおよび昇格 exec の相互作用については、[サンドボックスとツールポリシーと昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)を参照してください。

</Warning>

## イメージとセットアップ

既定の Docker イメージ：`openclaw-sandbox:bookworm-slim`

<Note>
**ソースチェックアウトと npm インストールの違い**

` scripts/sandbox-setup.sh`、`scripts/sandbox-common-setup.sh`、`scripts/sandbox-browser-setup.sh` のヘルパースクリプトは、[ソースチェックアウト](https://github.com/openclaw/openclaw)から実行する場合にのみ利用できます。npm パッケージには含まれていません。

`npm install -g openclaw` で OpenClaw をインストールした場合は、代わりに以下のインライン `docker build` コマンドを使用してください。
</Note>

<Steps>
  <Step title="既定のイメージをビルドする">
    ソースチェックアウトから：

    ```bash
    scripts/sandbox-setup.sh
    ```

    npm インストールから（ソースチェックアウトは不要）：

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

    既定のイメージには Node が含まれて**いません**。Skill が Node（または他のランタイム）を必要とする場合は、カスタムイメージに組み込むか、`sandbox.docker.setupCommand` でインストールしてください（ネットワークへの外向き通信、書き込み可能なルート、root ユーザーが必要です）。

    `openclaw-sandbox:bookworm-slim` が見つからない場合でも、OpenClaw が通常の `debian:bookworm-slim` に暗黙的に置き換えることはありません。同梱イメージにはサンドボックスの書き込み／編集ヘルパー用の `python3` が含まれているため、既定のイメージを対象とするサンドボックス実行は、そのイメージをビルドするまでビルド手順を示して即座に失敗します。

  </Step>
  <Step title="任意：共通イメージをビルドする">
    一般的なツール（たとえば `curl`、`jq`、Node 24、pnpm、`python3`、`git`）を備えた、より高機能なサンドボックスイメージを使用する場合：

    ソースチェックアウトから：

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    npm インストールからは、まず既定のイメージをビルドし（上記参照）、次にリポジトリの [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) を使用して、その上に共通イメージをビルドします。

    次に、`agents.defaults.sandbox.docker.image` を `openclaw-sandbox-common:bookworm-slim` に設定します。

  </Step>
  <Step title="任意：サンドボックスブラウザーイメージをビルドする">
    ソースチェックアウトから：

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    npm インストールからは、リポジトリの [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) を使用してビルドします。

  </Step>
</Steps>

既定では、Docker サンドボックスコンテナは**ネットワークなし**で実行されます。`agents.defaults.sandbox.docker.network` で上書きできます。

<AccordionGroup>
  <Accordion title="サンドボックスブラウザーの Chromium 既定値">
    同梱のサンドボックスブラウザーイメージは、コンテナ化されたワークロード向けに保守的な Chromium 起動フラグを適用します。

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
    - `browser.headless` が有効な場合は `--headless=new`。
    - `browser.noSandbox` が有効な場合は `--no-sandbox --disable-setuid-sandbox`。
    - 既定では `--disable-3d-apis`、`--disable-gpu`、`--disable-software-rasterizer`。これらのグラフィックス強化フラグは、GPU サポートのないコンテナで役立ちます。ワークロードで WebGL またはその他の 3D 機能が必要な場合は、`OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` を設定してください。
    - 既定では `--disable-extensions`。拡張機能に依存するフローでは、`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` を設定してください。
    - 既定では `--renderer-process-limit=2`。`OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で制御し、`0` にすると Chromium の既定値を維持します。

    異なるランタイムプロファイルが必要な場合は、カスタムブラウザーイメージを使用し、独自のエントリーポイントを指定してください。ローカル（コンテナ外）の Chromium プロファイルでは、`browser.extraArgs` を使用して追加の起動フラグを付加します。

  </Accordion>
  <Accordion title="ネットワークセキュリティの既定値">
    - `network: "host"` はブロックされます。
    - `network: "container:<id>"` は既定でブロックされます（名前空間への参加による迂回リスク）。
    - 緊急時の上書き：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker のインストールとコンテナ化された Gateway については、[Docker](/ja-JP/install/docker)を参照してください。

Docker Gateway のデプロイでは、`scripts/docker/setup.sh` でサンドボックス設定をブートストラップできます。この経路を有効にするには、`OPENCLAW_SANDBOX=1`（または `true`/`yes`/`on`）を設定します。ソケットの場所は `OPENCLAW_DOCKER_SOCKET` で上書きできます。完全なセットアップと環境変数のリファレンスについては、[Docker](/ja-JP/install/docker#agent-sandbox)を参照してください。

## setupCommand（コンテナの一回限りのセットアップ）

`setupCommand` は、サンドボックスコンテナの作成後に**一度だけ**実行されます（実行のたびではありません）。コンテナ内で `sh -lc` を介して実行されます。

パス：

- グローバル：`agents.defaults.sandbox.docker.setupCommand`
- エージェント単位：`agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="よくある落とし穴">
    - 既定の `docker.network` は `"none"`（外向き通信なし）なので、パッケージのインストールは失敗します。
    - `docker.network: "container:<id>"` には `dangerouslyAllowContainerNamespaceJoin: true` が必要で、緊急時にのみ使用できます。
    - `readOnlyRoot: true` は書き込みを禁止します。`readOnlyRoot: false` を設定するか、カスタムイメージに組み込んでください。
    - パッケージのインストールには `user` が root である必要があります（`user` を省略するか、`user: "0:0"` を設定します）。
    - サンドボックスの exec は、ホストの `process.env` を継承**しません**。Skill の API キーには、`agents.defaults.sandbox.docker.env`（またはカスタムイメージ）を使用してください。
    - `agents.defaults.sandbox.docker.env` の値は、明示的な Docker コンテナ環境変数として渡されます。Docker デーモンへのアクセス権を持つ人は、`docker inspect` などの Docker メタデータコマンドでそれらを確認できます。そのメタデータ公開が許容できない場合は、カスタムイメージ、マウントしたシークレットファイル、または別のシークレット配信経路を使用してください。

  </Accordion>
</AccordionGroup>

## ツールポリシーと回避手段

ツールの許可／拒否ポリシーは、サンドボックスのルールより先に引き続き適用されます。ツールがグローバルまたはエージェント単位で拒否されている場合、サンドボックス化によって再び利用可能になることはありません。

`tools.elevated` は、サンドボックス外で `exec` を実行するための明示的な回避手段です（既定では `gateway`、exec の対象が `node` の場合は `node`）。`/exec` ディレクティブは許可された送信者にのみ適用され、セッション単位で保持されます。`exec` を完全に無効化するには、ツールポリシーの deny を使用してください（[サンドボックスとツールポリシーと昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)を参照）。

デバッグ：

- `openclaw sandbox list` は、サンドボックスコンテナ、状態、イメージの一致、経過時間、アイドル時間、関連付けられたセッション／エージェントを表示します。
- `openclaw sandbox explain [--session <key>] [--agent <id>]` は、有効なサンドボックスモード、ホストワークスペース、ランタイム作業ディレクトリ、Docker マウント、ツールポリシー、修正用の設定キーを調査します。その `workspaceRoot` フィールドは設定済みのサンドボックスルートのままであり、`effectiveHostWorkspaceRoot` はアクティブなワークスペースが実際に存在する場所を示します。
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` はコンテナ／環境を削除し、次回使用時に現在の設定で再作成されるようにします。
- 「なぜこれがブロックされるのか」を理解するための考え方については、[サンドボックスとツールポリシーと昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)を参照してください。

## マルチエージェントの上書き

各エージェントは、`agents.list[].sandbox` と `agents.list[].tools`（およびサンドボックスのツールポリシー用の `agents.list[].tools.sandbox.tools`）でサンドボックスとツールを上書きできます。優先順位については、[マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)を参照してください。

## 最小限の有効化例

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

## 関連項目

- [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェントごとのオーバーライドと優先順位
- [OpenShell](/ja-JP/gateway/openshell) -- 管理対象サンドボックスバックエンドのセットアップ、ワークスペースモード、設定リファレンス
- [サンドボックス設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- [サンドボックスとツールポリシーと昇格の違い](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) -- 「なぜこれがブロックされるのか？」のデバッグ
- [セキュリティ](/ja-JP/gateway/security)
