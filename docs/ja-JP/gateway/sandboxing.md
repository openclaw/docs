---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClaw のサンドボックス化の仕組み: モード、スコープ、ワークスペースアクセス、画像'
title: サンドボックス化
x-i18n:
    generated_at: "2026-05-02T04:56:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f313333ec676aaef636b42d4a6f28f35bf213d9e1c5292ffb4868f312cf0eda
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw は**サンドボックスバックエンド内でツール**を実行して、影響範囲を小さくできます。これは**任意**であり、設定（`agents.defaults.sandbox` または `agents.list[].sandbox`）で制御されます。サンドボックス化がオフの場合、ツールはホスト上で実行されます。Gateway はホスト上に残り、ツール実行は有効化されている場合に隔離されたサンドボックス内で実行されます。

<Note>
これは完全なセキュリティ境界ではありませんが、モデルが不適切な操作をした場合のファイルシステムおよびプロセスへのアクセスを実質的に制限します。
</Note>

## サンドボックス化されるもの

- ツール実行（`exec`、`read`、`write`、`edit`、`apply_patch`、`process` など）。
- 任意のサンドボックス化ブラウザー（`agents.defaults.sandbox.browser`）。

<AccordionGroup>
  <Accordion title="サンドボックス化ブラウザーの詳細">
    - 既定では、ブラウザーツールが必要とする場合、サンドボックスブラウザーは自動起動します（CDP に到達可能であることを保証します）。`agents.defaults.sandbox.browser.autoStart` と `agents.defaults.sandbox.browser.autoStartTimeoutMs` で設定します。
    - 既定では、サンドボックスブラウザーコンテナーはグローバルな `bridge` ネットワークではなく、専用の Docker ネットワーク（`openclaw-sandbox-browser`）を使用します。`agents.defaults.sandbox.browser.network` で設定します。
    - 任意の `agents.defaults.sandbox.browser.cdpSourceRange` は、CIDR 許可リスト（例: `172.21.0.1/32`）でコンテナー境界の CDP ingress を制限します。
    - noVNC の観察者アクセスは既定でパスワード保護されています。OpenClaw は短命のトークン URL を発行し、ローカルのブートストラップページを提供して、URL フラグメント（クエリやヘッダーログではありません）内のパスワードで noVNC を開きます。
    - `agents.defaults.sandbox.browser.allowHostControl` により、サンドボックス化されたセッションがホストブラウザーを明示的に対象にできます。
    - 任意の許可リストは `target: "custom"` を制御します: `allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

  </Accordion>
</AccordionGroup>

サンドボックス化されないもの:

- Gateway プロセス自体。
- サンドボックス外での実行が明示的に許可された任意のツール（例: `tools.elevated`）。
  - **昇格された exec はサンドボックス化をバイパスし、設定されたエスケープパス（既定では `gateway`、または exec 対象が `node` の場合は `node`）を使用します。**
  - サンドボックス化がオフの場合、`tools.elevated` は実行を変更しません（すでにホスト上です）。[昇格モード](/ja-JP/tools/elevated)を参照してください。

## モード

`agents.defaults.sandbox.mode` はサンドボックス化を使用する**タイミング**を制御します。

<Tabs>
  <Tab title="off">
    サンドボックス化しません。
  </Tab>
  <Tab title="non-main">
    **non-main** セッションのみをサンドボックス化します（通常のチャットをホスト上で実行したい場合の既定）。

    `"non-main"` はエージェント ID ではなく `session.mainKey`（既定は `"main"`）に基づきます。グループ/チャンネルセッションは独自のキーを使用するため、non-main とみなされ、サンドボックス化されます。

  </Tab>
  <Tab title="all">
    すべてのセッションがサンドボックス内で実行されます。
  </Tab>
</Tabs>

## スコープ

`agents.defaults.sandbox.scope` は作成される**コンテナー数**を制御します。

- `"agent"`（既定）: エージェントごとに 1 つのコンテナー。
- `"session"`: セッションごとに 1 つのコンテナー。
- `"shared"`: すべてのサンドボックス化セッションで共有される 1 つのコンテナー。

## バックエンド

`agents.defaults.sandbox.backend` はサンドボックスを提供する**ランタイム**を制御します。

- `"docker"`（サンドボックス化が有効な場合の既定）: ローカルの Docker ベースのサンドボックスランタイム。
- `"ssh"`: 汎用の SSH ベースのリモートサンドボックスランタイム。
- `"openshell"`: OpenShell ベースのサンドボックスランタイム。

SSH 固有の設定は `agents.defaults.sandbox.ssh` の下にあります。OpenShell 固有の設定は `plugins.entries.openshell.config` の下にあります。

### バックエンドの選択

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **実行場所**        | ローカルコンテナー               | SSH でアクセス可能な任意のホスト | OpenShell 管理のサンドボックス                      |
| **セットアップ**    | `scripts/sandbox-setup.sh`       | SSH キー + 対象ホスト          | OpenShell Plugin が有効                             |
| **ワークスペースモデル** | バインドマウントまたはコピー | リモート正規（初回のみシード） | `mirror` または `remote`                            |
| **ネットワーク制御** | `docker.network`（既定: なし）  | リモートホストに依存           | OpenShell に依存                                    |
| **ブラウザーサンドボックス** | 対応                    | 非対応                         | まだ非対応                                          |
| **バインドマウント** | `docker.binds`                  | N/A                            | N/A                                                 |
| **最適な用途**      | ローカル開発、完全な隔離         | リモートマシンへのオフロード   | 任意の双方向同期を伴う管理型リモートサンドボックス |

### Docker バックエンド

サンドボックス化は既定でオフです。サンドボックス化を有効にしてバックエンドを選択しない場合、OpenClaw は Docker バックエンドを使用します。Docker デーモンソケット（`/var/run/docker.sock`）を介して、ツールとサンドボックスブラウザーをローカルで実行します。サンドボックスコンテナーの隔離は Docker 名前空間によって決まります。

ホスト GPU を Docker サンドボックスに公開するには、`agents.defaults.sandbox.docker.gpus` またはエージェントごとの `agents.list[].sandbox.docker.gpus` オーバーライドを設定します。この値は Docker の `--gpus` フラグに個別の引数として渡されます。たとえば `"all"` または `"device=GPU-uuid"` です。また、NVIDIA Container Toolkit のような互換性のあるホストランタイムが必要です。

<Warning>
**Docker-out-of-Docker（DooD）の制約**

OpenClaw Gateway 自体を Docker コンテナーとしてデプロイする場合、ホストの Docker ソケットを使用して兄弟サンドボックスコンテナーをオーケストレーションします（DooD）。これにより、特定のパスマッピング制約が生じます。

- **設定にはホストパスが必要**: `openclaw.json` の `workspace` 設定には、内部 Gateway コンテナーパスではなく、**ホストの絶対パス**（例: `/home/user/.openclaw/workspaces`）を含める必要があります。OpenClaw が Docker デーモンにサンドボックスの生成を依頼すると、デーモンは Gateway 名前空間ではなくホスト OS 名前空間を基準にパスを評価します。
- **FS ブリッジの同等性（同一のボリュームマップ）**: OpenClaw Gateway のネイティブプロセスも `workspace` ディレクトリに Heartbeat とブリッジファイルを書き込みます。Gateway は自身のコンテナー化された環境内からまったく同じ文字列（ホストパス）を評価するため、Gateway のデプロイにはホスト名前空間をネイティブにリンクする同一のボリュームマップ（`-v /home/user/.openclaw:/home/user/.openclaw`）を含める必要があります。

絶対ホスト同等性なしで内部的にパスをマップすると、完全修飾パス文字列がネイティブに存在しないため、OpenClaw はコンテナー環境内で Heartbeat を書き込もうとして `EACCES` 権限エラーをネイティブにスローします。
</Warning>

### SSH バックエンド

任意の SSH でアクセス可能なマシン上で OpenClaw に `exec`、ファイルツール、メディア読み取りをサンドボックス化させたい場合は、`backend: "ssh"` を使用します。

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

<AccordionGroup>
  <Accordion title="仕組み">
    - OpenClaw は `sandbox.ssh.workspaceRoot` の下にスコープごとのリモートルートを作成します。
    - 作成または再作成後の初回使用時に、OpenClaw はローカルワークスペースからそのリモートワークスペースを一度シードします。
    - その後、`exec`、`read`、`write`、`edit`、`apply_patch`、プロンプトメディア読み取り、受信メディアのステージングは、SSH 経由でリモートワークスペースに対して直接実行されます。
    - OpenClaw はリモートの変更をローカルワークスペースへ自動的には同期しません。

  </Accordion>
  <Accordion title="認証マテリアル">
    - `identityFile`、`certificateFile`、`knownHostsFile`: 既存のローカルファイルを使用し、OpenSSH 設定を通じて渡します。
    - `identityData`、`certificateData`、`knownHostsData`: インライン文字列または SecretRefs を使用します。OpenClaw は通常のシークレットランタイムスナップショットを通じてそれらを解決し、`0600` の一時ファイルに書き込み、SSH セッション終了時に削除します。
    - 同じ項目に `*File` と `*Data` の両方が設定されている場合、その SSH セッションでは `*Data` が優先されます。

  </Accordion>
  <Accordion title="リモート正規の結果">
    これは**リモート正規**モデルです。初期シード後、リモート SSH ワークスペースが実際のサンドボックス状態になります。

    - シード手順の後に OpenClaw の外部で行われたホストローカルの編集は、サンドボックスを再作成するまでリモートには表示されません。
    - `openclaw sandbox recreate` はスコープごとのリモートルートを削除し、次回使用時にローカルから再度シードします。
    - SSH バックエンドではブラウザーサンドボックス化はサポートされていません。
    - `sandbox.docker.*` 設定は SSH バックエンドには適用されません。

  </Accordion>
</AccordionGroup>

### OpenShell バックエンド

OpenShell 管理のリモート環境で OpenClaw にツールをサンドボックス化させたい場合は、`backend: "openshell"` を使用します。完全なセットアップガイド、設定リファレンス、ワークスペースモード比較については、専用の [OpenShell ページ](/ja-JP/gateway/openshell)を参照してください。

OpenShell は汎用 SSH バックエンドと同じコア SSH トランスポートおよびリモートファイルシステムブリッジを再利用し、OpenShell 固有のライフサイクル（`sandbox create/get/delete`、`sandbox ssh-config`）に加えて、任意の `mirror` ワークスペースモードを追加します。

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
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

OpenShell モード:

- `mirror`（既定）: ローカルワークスペースが正規のままです。OpenClaw は exec の前にローカルファイルを OpenShell に同期し、exec の後にリモートワークスペースを同期し戻します。
- `remote`: サンドボックスが作成された後は OpenShell ワークスペースが正規です。OpenClaw はローカルワークスペースからリモートワークスペースを一度シードし、その後ファイルツールと exec は変更を同期し戻すことなくリモートサンドボックスに対して直接実行されます。

<AccordionGroup>
  <Accordion title="リモートトランスポートの詳細">
    - OpenClaw は `openshell sandbox ssh-config <name>` を介して、サンドボックス固有の SSH 設定を OpenShell に要求します。
    - コアはその SSH 設定を一時ファイルに書き込み、SSH セッションを開き、`backend: "ssh"` で使用されるものと同じリモートファイルシステムブリッジを再利用します。
    - `mirror` モードではライフサイクルだけが異なります。exec の前にローカルをリモートへ同期し、その後 exec の後に同期し戻します。

  </Accordion>
  <Accordion title="現在の OpenShell の制限">
    - サンドボックスブラウザーはまだサポートされていません
    - `sandbox.docker.binds` は OpenShell バックエンドではサポートされていません
    - `sandbox.docker.*` の下にある Docker 固有のランタイムノブは、引き続き Docker バックエンドにのみ適用されます

  </Accordion>
</AccordionGroup>

#### ワークスペースモード

OpenShell には 2 つのワークスペースモデルがあります。実務上、ここが最も重要な部分です。

<Tabs>
  <Tab title="mirror（ローカル正規）">
    **ローカルワークスペースを正規のままにしたい**場合は、`plugins.entries.openshell.config.mode: "mirror"` を使用します。

    動作:

    - `exec` の前に、OpenClaw はローカルワークスペースを OpenShell サンドボックスに同期します。
    - `exec` の後に、OpenClaw はリモートワークスペースをローカルワークスペースに同期し戻します。
    - ファイルツールは引き続きサンドボックスブリッジを通じて動作しますが、ターン間ではローカルワークスペースが信頼できる情報源のままです。

    これを使用する場合:

    - OpenClaw の外側でローカルにファイルを編集し、その変更を sandbox に自動で反映したい
    - OpenShell sandbox をできるだけ Docker backend と同じように動作させたい
    - 各 exec ターン後に、sandbox の書き込みを host workspace に反映したい

    トレードオフ: exec の前後に追加の同期コストが発生します。

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    **OpenShell workspace を canonical にしたい**場合は、`plugins.entries.openshell.config.mode: "remote"` を使用します。

    動作:

    - sandbox が最初に作成されるとき、OpenClaw は local workspace から remote workspace へ一度だけ初期投入します。
    - その後、`exec`、`read`、`write`、`edit`、`apply_patch` は remote OpenShell workspace に対して直接動作します。
    - OpenClaw は exec 後に remote の変更を local workspace へ同期しません。
    - prompt 時のメディア読み取りは引き続き動作します。file ツールと media ツールは local host path を仮定せず、sandbox bridge 経由で読み取るためです。
    - transport は `openshell sandbox ssh-config` が返す OpenShell sandbox への SSH です。

    重要な影響:

    - seed ステップ後に OpenClaw の外側で host 上のファイルを編集しても、remote sandbox はその変更を**自動では**認識しません。
    - sandbox が再作成された場合、remote workspace は local workspace から再度 seed されます。
    - `scope: "agent"` または `scope: "shared"` では、その remote workspace は同じスコープで共有されます。

    次の場合に使用します:

    - sandbox を主に remote OpenShell 側で維持したい
    - ターンごとの同期オーバーヘッドを下げたい
    - host-local の編集で remote sandbox state を暗黙に上書きしたくない

  </Tab>
</Tabs>

sandbox を一時的な実行環境と考える場合は `mirror` を選びます。sandbox を実際の workspace と考える場合は `remote` を選びます。

#### OpenShell のライフサイクル

OpenShell sandbox は、通常の sandbox ライフサイクルを通じて引き続き管理されます:

- `openclaw sandbox list` は Docker runtime だけでなく OpenShell runtime も表示します
- `openclaw sandbox recreate` は現在の runtime を削除し、次回使用時に OpenClaw が再作成できるようにします
- prune ロジックも backend を認識します

`remote` モードでは、recreate が特に重要です:

- recreate はそのスコープの canonical remote workspace を削除します
- 次回使用時に、local workspace から新しい remote workspace を seed します

`mirror` モードでは、local workspace がいずれにせよ canonical のままなので、recreate は主に remote 実行環境をリセットします。

## Workspace アクセス

`agents.defaults.sandbox.workspaceAccess` は、**sandbox が何を参照できるか**を制御します:

<Tabs>
  <Tab title="none (default)">
    ツールは `~/.openclaw/sandboxes` 配下の sandbox workspace を参照します。
  </Tab>
  <Tab title="ro">
    agent workspace を `/agent` に read-only で mount します（`write`/`edit`/`apply_patch` を無効化します）。
  </Tab>
  <Tab title="rw">
    agent workspace を `/workspace` に read/write で mount します。
  </Tab>
</Tabs>

OpenShell backend では:

- `mirror` モードは exec ターン間の canonical source として引き続き local workspace を使用します
- `remote` モードは初期 seed 後、remote OpenShell workspace を canonical source として使用します
- `workspaceAccess: "ro"` と `"none"` は、書き込み動作を同じように引き続き制限します

受信メディアは active sandbox workspace（`media/inbound/*`）にコピーされます。

<Note>
**Skills 注記:** `read` ツールは sandbox root を基準にします。`workspaceAccess: "none"` では、OpenClaw は対象の Skills を sandbox workspace（`.../skills`）に mirror し、読み取れるようにします。`"rw"` では、workspace Skills は `/workspace/skills` から読み取れます。
</Note>

## カスタム bind mount

`agents.defaults.sandbox.docker.binds` は追加の host directory を container に mount します。形式: `host:container:mode`（例: `"/home/user/source:/source:rw"`）。

global bind と agent ごとの bind は**マージ**されます（置き換えられません）。`scope: "shared"` では、agent ごとの bind は無視されます。

`agents.defaults.sandbox.browser.binds` は追加の host directory を**sandbox browser** container にのみ mount します。

- 設定されている場合（`[]` を含む）、browser container では `agents.defaults.sandbox.docker.binds` を置き換えます。
- 省略された場合、browser container は `agents.defaults.sandbox.docker.binds` にフォールバックします（後方互換）。

例（read-only source + 追加の data directory）:

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
**Bind のセキュリティ**

- bind は sandbox filesystem をバイパスします。設定した mode（`:ro` または `:rw`）で host path を公開します。
- OpenClaw は危険な bind source（例: `docker.sock`、`/etc`、`/proc`、`/sys`、`/dev`、およびそれらを公開する parent mount）をブロックします。
- OpenClaw は `~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm`、`~/.ssh` など、一般的な home directory credential root もブロックします。
- bind validation は単なる文字列一致ではありません。OpenClaw は source path を正規化し、その後、存在する最も深い ancestor を通じて再度解決してから、blocked path と allowed root を再チェックします。
- つまり、最終 leaf がまだ存在しない場合でも、symlink-parent escape は fail closed します。例: `run-link` がそこを指している場合、`/workspace/run-link/new-file` は引き続き `/var/run/...` として解決されます。
- allowed source root も同じ方法で canonicalize されるため、symlink resolution 前に allowlist の内側に見えるだけの path は、`outside allowed roots` として引き続き拒否されます。
- sensitive mount（secrets、SSH keys、service credentials）は、絶対に必要でない限り `:ro` にするべきです。
- workspace への read access だけが必要な場合は `workspaceAccess: "ro"` と組み合わせます。bind mode は独立したままです。
- bind が tool policy および elevated exec とどのように相互作用するかについては、[Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

</Warning>

## Image と setup

デフォルトの Docker image: `openclaw-sandbox:bookworm-slim`

<Note>
**Source checkout と npm install**

`scripts/sandbox-setup.sh`、`scripts/sandbox-common-setup.sh`、`scripts/sandbox-browser-setup.sh` helper script は、[source checkout](https://github.com/openclaw/openclaw) から実行している場合にのみ利用できます。npm package には含まれていません。

`npm install -g openclaw` で OpenClaw をインストールした場合は、代わりに以下に示す inline `docker build` command を使用してください。
</Note>

<Steps>
  <Step title="Build the default image">
    source checkout から:

    ```bash
    scripts/sandbox-setup.sh
    ```

    npm install から（source checkout は不要）:

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

    デフォルト image には Node は含まれません。skill が Node（または他の runtime）を必要とする場合は、custom image に組み込むか、`sandbox.docker.setupCommand` でインストールしてください（network egress + writable root + root user が必要です）。

    `openclaw-sandbox:bookworm-slim` が存在しない場合、OpenClaw は plain `debian:bookworm-slim` に暗黙に置き換えません。デフォルト image を対象にする sandbox run は、ビルドされるまで build instruction とともに fast fail します。これは bundled image が sandbox の write/edit helper 用に `python3` を含むためです。

  </Step>
  <Step title="Optional: build the common image">
    common tooling（例: `curl`、`jq`、`nodejs`、`python3`、`git`）を備えた、より機能的な sandbox image を使う場合:

    source checkout から:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    npm install からの場合は、まずデフォルト image をビルドし（上記参照）、その後 repository の [`Dockerfile.sandbox-common`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-common) を使用して、その上に common image をビルドします。

    その後、`agents.defaults.sandbox.docker.image` を `openclaw-sandbox-common:bookworm-slim` に設定します。

  </Step>
  <Step title="Optional: build the sandbox browser image">
    source checkout から:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    npm install からの場合は、repository の [`Dockerfile.sandbox-browser`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-browser) を使用してビルドします。

  </Step>
</Steps>

デフォルトでは、Docker sandbox container は**ネットワークなし**で実行されます。`agents.defaults.sandbox.docker.network` で上書きします。

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    bundled sandbox browser image は、containerized workload 向けに conservative な Chromium startup default も適用します。現在の container default には次が含まれます:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-3d-apis`
    - `--disable-gpu`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-extensions`
    - `--disable-features=TranslateUI`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--disable-software-rasterizer`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--renderer-process-limit=2`
    - `noSandbox` が有効な場合は `--no-sandbox`。
    - 3 つの graphics hardening flag（`--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu`）は任意であり、container に GPU support がない場合に有用です。workload が WebGL またはその他の 3D/browser feature を必要とする場合は、`OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` を設定します。
    - `--disable-extensions` はデフォルトで有効で、extension に依存する flow では `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で無効化できます。
    - `--renderer-process-limit=2` は `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で制御され、`0` は Chromium のデフォルトを維持します。

    別の runtime profile が必要な場合は、custom browser image を使用し、独自の entrypoint を指定します。local（non-container）Chromium profile では、追加の startup flag を付加するために `browser.extraArgs` を使用します。

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` はブロックされます。
    - `network: "container:<id>"` はデフォルトでブロックされます（namespace join bypass のリスク）。
    - break-glass override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker install と containerized Gateway はこちらにあります: [Docker](/ja-JP/install/docker)

Docker Gateway deployment では、`scripts/docker/setup.sh` で sandbox config を bootstrap できます。その path を有効化するには `OPENCLAW_SANDBOX=1`（または `true`/`yes`/`on`）を設定します。socket location は `OPENCLAW_DOCKER_SOCKET` で上書きできます。完全な setup と env reference: [Docker](/ja-JP/install/docker#agent-sandbox)。

## setupCommand（one-time container setup）

`setupCommand` は sandbox container が作成された後に**一度だけ**実行されます（毎回の run ではありません）。container 内で `sh -lc` により実行されます。

Path:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Per-agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - デフォルトの `docker.network` は `"none"`（egress なし）なので、package install は失敗します。
    - `docker.network: "container:<id>"` には `dangerouslyAllowContainerNamespaceJoin: true` が必要で、break-glass 専用です。
    - `readOnlyRoot: true` は書き込みを防ぎます。`readOnlyRoot: false` を設定するか、custom image に組み込んでください。
    - package install では `user` が root である必要があります（`user` を省略するか、`user: "0:0"` を設定します）。
    - sandbox exec は host の `process.env` を継承しません。skill API key には `agents.defaults.sandbox.docker.env`（または custom image）を使用します。

  </Accordion>
</AccordionGroup>

## ツールポリシーとエスケープハッチ

ツールの許可/拒否ポリシーは、サンドボックスルールより先に適用されます。ツールがグローバルまたはエージェントごとに拒否されている場合、サンドボックス化によってそれが復活することはありません。

`tools.elevated` は、サンドボックスの外で `exec` を実行する明示的なエスケープハッチです（デフォルトでは `gateway`、exec ターゲットが `node` の場合は `node`）。`/exec` ディレクティブは認可された送信者にのみ適用され、セッションごとに保持されます。`exec` を完全に無効にするには、ツールポリシーの拒否を使用してください（[サンドボックス vs ツールポリシー vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照）。

デバッグ:

- 有効なサンドボックスモード、ツールポリシー、修正用の設定キーを調べるには、`openclaw sandbox explain` を使用します。
- 「なぜこれがブロックされるのか?」というメンタルモデルについては、[サンドボックス vs ツールポリシー vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

ロックダウンした状態を保ってください。

## マルチエージェントの上書き

各エージェントはサンドボックス + ツールを上書きできます: `agents.list[].sandbox` と `agents.list[].tools`（さらにサンドボックスツールポリシー用の `agents.list[].tools.sandbox.tools`）。優先順位については、[マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

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

## 関連

- [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) — エージェントごとの上書きと優先順位
- [OpenShell](/ja-JP/gateway/openshell) — 管理されたサンドボックスバックエンドのセットアップ、ワークスペースモード、設定リファレンス
- [サンドボックス設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- [サンドボックス vs ツールポリシー vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) — 「なぜこれがブロックされるのか?」のデバッグ
- [セキュリティ](/ja-JP/gateway/security)
