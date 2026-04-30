---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClawのサンドボックス化の仕組み: モード、スコープ、ワークスペースアクセス、画像'
title: サンドボックス化
x-i18n:
    generated_at: "2026-04-30T05:15:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw は、影響範囲を抑えるために **sandbox backend 内で tools を実行**できます。これは**任意**であり、設定（`agents.defaults.sandbox` または `agents.list[].sandbox`）で制御します。sandboxing がオフの場合、tools はホスト上で実行されます。Gateway はホスト上に残り、有効化されている場合は tool execution が隔離された sandbox 内で実行されます。

<Note>
これは完全なセキュリティ境界ではありませんが、モデルが不適切な動作をした場合に、ファイルシステムとプロセスへのアクセスを実質的に制限します。
</Note>

## sandbox 化されるもの

- Tool execution（`exec`、`read`、`write`、`edit`、`apply_patch`、`process` など）。
- 任意の sandbox 化ブラウザー（`agents.defaults.sandbox.browser`）。

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - デフォルトでは、browser tool が必要としたときに sandbox browser が自動起動します（CDP に到達できることを保証します）。`agents.defaults.sandbox.browser.autoStart` と `agents.defaults.sandbox.browser.autoStartTimeoutMs` で設定します。
    - デフォルトでは、sandbox browser コンテナーはグローバルな `bridge` ネットワークではなく、専用の Docker ネットワーク（`openclaw-sandbox-browser`）を使用します。`agents.defaults.sandbox.browser.network` で設定します。
    - 任意の `agents.defaults.sandbox.browser.cdpSourceRange` は、CIDR allowlist（例: `172.21.0.1/32`）でコンテナー境界の CDP ingress を制限します。
    - noVNC observer access はデフォルトでパスワード保護されています。OpenClaw は、有効期間の短い token URL を発行し、その URL がローカルの bootstrap page を提供して、パスワードを URL fragment（query/header logs ではありません）に含めて noVNC を開きます。
    - `agents.defaults.sandbox.browser.allowHostControl` により、sandbox 化された sessions が host browser を明示的に対象にできます。
    - 任意の allowlists は `target: "custom"` を制御します: `allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

  </Accordion>
</AccordionGroup>

sandbox 化されないもの:

- Gateway プロセス自体。
- sandbox の外で実行することを明示的に許可された tool（例: `tools.elevated`）。
  - **Elevated exec は sandboxing を迂回し、設定された escape path（デフォルトは `gateway`、exec target が `node` の場合は `node`）を使用します。**
  - sandboxing がオフの場合、`tools.elevated` は実行を変更しません（すでにホスト上です）。[Elevated Mode](/ja-JP/tools/elevated) を参照してください。

## モード

`agents.defaults.sandbox.mode` は、sandboxing を**いつ**使用するかを制御します:

<Tabs>
  <Tab title="off">
    sandboxing なし。
  </Tab>
  <Tab title="non-main">
    **non-main** sessions のみを sandbox 化します（通常の chats を host 上に置きたい場合のデフォルト）。

    `"non-main"` は agent id ではなく、`session.mainKey`（デフォルトは `"main"`）に基づきます。Group/channel sessions は独自の keys を使用するため、non-main と見なされ、sandbox 化されます。

  </Tab>
  <Tab title="all">
    すべての session が sandbox 内で実行されます。
  </Tab>
</Tabs>

## スコープ

`agents.defaults.sandbox.scope` は、**いくつの containers** を作成するかを制御します:

- `"agent"`（デフォルト）: agent ごとに 1 つの container。
- `"session"`: session ごとに 1 つの container。
- `"shared"`: すべての sandbox 化された sessions で共有する 1 つの container。

## Backend

`agents.defaults.sandbox.backend` は、sandbox を提供する**runtime**を制御します:

- `"docker"`（sandboxing が有効な場合のデフォルト）: ローカルの Docker-backed sandbox runtime。
- `"ssh"`: 汎用の SSH-backed remote sandbox runtime。
- `"openshell"`: OpenShell-backed sandbox runtime。

SSH 固有の設定は `agents.defaults.sandbox.ssh` 配下にあります。OpenShell 固有の設定は `plugins.entries.openshell.config` 配下にあります。

### backend の選択

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **実行場所**        | ローカル container               | 任意の SSH-accessible host     | OpenShell managed sandbox                           |
| **セットアップ**    | `scripts/sandbox-setup.sh`       | SSH key + target host          | OpenShell plugin enabled                            |
| **Workspace model** | Bind-mount または copy           | Remote-canonical（seed once）  | `mirror` または `remote`                            |
| **Network control** | `docker.network`（default: none） | remote host に依存             | OpenShell に依存                                    |
| **Browser sandbox** | Supported                        | Not supported                  | Not supported yet                                   |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **最適な用途**      | Local dev、完全な isolation      | remote machine への offloading | optional two-way sync 付きの managed remote sandboxes |

### Docker backend

sandboxing はデフォルトでオフです。sandboxing を有効にし、backend を選択しない場合、OpenClaw は Docker backend を使用します。Docker daemon socket（`/var/run/docker.sock`）経由で tools と sandbox browsers をローカル実行します。Sandbox container isolation は Docker namespaces によって決まります。

host GPUs を Docker sandboxes に公開するには、`agents.defaults.sandbox.docker.gpus` または agent ごとの `agents.list[].sandbox.docker.gpus` override を設定します。この値は Docker の `--gpus` flag に個別の argument として渡されます。例: `"all"` または `"device=GPU-uuid"`。NVIDIA Container Toolkit などの互換性のある host runtime が必要です。

<Warning>
**Docker-out-of-Docker (DooD) の制約**

OpenClaw Gateway 自体を Docker container としてデプロイする場合、host の Docker socket（DooD）を使用して sibling sandbox containers を orchestration します。これにより、特定の path mapping 制約が発生します:

- **設定には host paths が必要**: `openclaw.json` の `workspace` configuration には、internal Gateway container path ではなく、**Host の absolute path**（例: `/home/user/.openclaw/workspaces`）を含める必要があります。OpenClaw が Docker daemon に sandbox の生成を要求すると、daemon は Gateway namespace ではなく Host OS namespace に対して paths を評価します。
- **FS bridge parity（identical volume map）**: OpenClaw Gateway native process も `workspace` directory に heartbeat files と bridge files を書き込みます。Gateway は containerized environment 内からまったく同じ文字列（host path）を評価するため、Gateway deployment には、host namespace を natively にリンクする同一の volume map（`-v /home/user/.openclaw:/home/user/.openclaw`）を含める必要があります。

absolute host parity なしで paths を内部的に map すると、fully qualified path string が natively に存在しないため、OpenClaw は container environment 内で heartbeat を書き込もうとして `EACCES` permission error を natively にスローします。
</Warning>

### SSH backend

OpenClaw に、任意の SSH-accessible machine 上で `exec`、file tools、media reads を sandbox 化させたい場合は、`backend: "ssh"` を使用します。

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
  <Accordion title="How it works">
    - OpenClaw は `sandbox.ssh.workspaceRoot` 配下に per-scope remote root を作成します。
    - 作成または再作成後の初回使用時に、OpenClaw は local workspace から remote workspace へ一度だけ seed します。
    - その後、`exec`、`read`、`write`、`edit`、`apply_patch`、prompt media reads、inbound media staging は、SSH 経由で remote workspace に対して直接実行されます。
    - OpenClaw は remote changes を local workspace に自動で同期しません。

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`、`certificateFile`、`knownHostsFile`: 既存の local files を使用し、OpenSSH config 経由で渡します。
    - `identityData`、`certificateData`、`knownHostsData`: inline strings または SecretRefs を使用します。OpenClaw は通常の secrets runtime snapshot を通じて解決し、それらを `0600` の temp files に書き込み、SSH session 終了時に削除します。
    - 同じ item に `*File` と `*Data` の両方が設定されている場合、その SSH session では `*Data` が優先されます。

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    これは **remote-canonical** model です。initial seed の後、remote SSH workspace が実際の sandbox state になります。

    - seed step 後に OpenClaw の外部で行われた host-local edits は、sandbox を再作成するまで remote には表示されません。
    - `openclaw sandbox recreate` は per-scope remote root を削除し、次回使用時に local から再度 seed します。
    - Browser sandboxing は SSH backend ではサポートされていません。
    - `sandbox.docker.*` settings は SSH backend には適用されません。

  </Accordion>
</AccordionGroup>

### OpenShell backend

OpenShell-managed remote environment 内で OpenClaw に tools を sandbox 化させたい場合は、`backend: "openshell"` を使用します。完全な setup guide、configuration reference、workspace mode comparison については、専用の [OpenShell page](/ja-JP/gateway/openshell) を参照してください。

OpenShell は、generic SSH backend と同じ core SSH transport と remote filesystem bridge を再利用し、OpenShell-specific lifecycle（`sandbox create/get/delete`、`sandbox ssh-config`）に加えて任意の `mirror` workspace mode を追加します。

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

OpenShell modes:

- `mirror`（デフォルト）: local workspace が canonical のままです。OpenClaw は exec 前に local files を OpenShell に同期し、exec 後に remote workspace を同期して戻します。
- `remote`: sandbox 作成後は OpenShell workspace が canonical です。OpenClaw は local workspace から remote workspace へ一度 seed し、その後 file tools と exec は changes を同期して戻さずに remote sandbox に対して直接実行されます。

<AccordionGroup>
  <Accordion title="Remote transport details">
    - OpenClaw は `openshell sandbox ssh-config <name>` 経由で、sandbox-specific SSH config を OpenShell に要求します。
    - Core はその SSH config を temp file に書き込み、SSH session を開き、`backend: "ssh"` で使用されるものと同じ remote filesystem bridge を再利用します。
    - `mirror` mode では lifecycle だけが異なります: exec 前に local を remote に同期し、exec 後に同期して戻します。

  </Accordion>
  <Accordion title="Current OpenShell limitations">
    - sandbox browser はまだサポートされていません
    - `sandbox.docker.binds` は OpenShell backend ではサポートされていません
    - `sandbox.docker.*` 配下の Docker-specific runtime knobs は、引き続き Docker backend のみに適用されます

  </Accordion>
</AccordionGroup>

#### Workspace modes

OpenShell には 2 つの workspace models があります。実務上もっとも重要なのはこの部分です。

<Tabs>
  <Tab title="mirror (local canonical)">
    **local workspace を canonical のままにしたい**場合は、`plugins.entries.openshell.config.mode: "mirror"` を使用します。

    動作:

    - `exec` の前に、OpenClaw は local workspace を OpenShell sandbox に同期します。
    - `exec` の後に、OpenClaw は remote workspace を local workspace に同期して戻します。
    - File tools は引き続き sandbox bridge 経由で動作しますが、turns の間は local workspace が信頼できる情報源のままです。

    これを使用する場合:

    - OpenClaw の外部でローカルにファイルを編集していて、その変更をサンドボックスに自動で反映したい場合
    - OpenShell サンドボックスを Docker バックエンドにできるだけ近い動作にしたい場合
    - 各 exec ターンの後に、ホストワークスペースへサンドボックスの書き込みを反映したい場合

    トレードオフ: exec の前後で追加の同期コストが発生します。

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    **OpenShell ワークスペースを正とする**場合は、`plugins.entries.openshell.config.mode: "remote"` を使用します。

    動作:

    - サンドボックスが最初に作成されるとき、OpenClaw はローカルワークスペースからリモートワークスペースへ一度だけシードします。
    - その後、`exec`、`read`、`write`、`edit`、`apply_patch` はリモートの OpenShell ワークスペースに対して直接動作します。
    - OpenClaw は exec 後にリモートの変更をローカルワークスペースへ同期しません。
    - プロンプト時のメディア読み取りは引き続き機能します。ファイルツールとメディアツールはローカルホストパスを前提にせず、サンドボックスブリッジ経由で読み取るためです。
    - トランスポートは、`openshell sandbox ssh-config` が返す OpenShell サンドボックスへの SSH です。

    重要な結果:

    - シード後に OpenClaw の外部でホスト上のファイルを編集しても、リモートサンドボックスはその変更を**自動では**認識しません。
    - サンドボックスが再作成されると、リモートワークスペースはローカルワークスペースから再びシードされます。
    - `scope: "agent"` または `scope: "shared"` では、そのリモートワークスペースは同じスコープで共有されます。

    使用する場面:

    - サンドボックスを主にリモートの OpenShell 側で保持したい場合
    - ターンごとの同期オーバーヘッドを減らしたい場合
    - ホストローカルの編集がリモートサンドボックスの状態を暗黙に上書きすることを避けたい場合

  </Tab>
</Tabs>

サンドボックスを一時的な実行環境と考えるなら `mirror` を選びます。サンドボックスを実際のワークスペースと考えるなら `remote` を選びます。

#### OpenShell ライフサイクル

OpenShell サンドボックスは、通常のサンドボックスライフサイクルを通じて引き続き管理されます。

- `openclaw sandbox list` は Docker ランタイムだけでなく OpenShell ランタイムも表示します
- `openclaw sandbox recreate` は現在のランタイムを削除し、次回使用時に OpenClaw が再作成できるようにします
- prune ロジックもバックエンドを認識します

`remote` モードでは、再作成が特に重要です。

- 再作成は、そのスコープの正となるリモートワークスペースを削除します
- 次回使用時に、ローカルワークスペースから新しいリモートワークスペースがシードされます

`mirror` モードでは、ローカルワークスペースがいずれにせよ正として残るため、再作成は主にリモート実行環境をリセットします。

## ワークスペースアクセス

`agents.defaults.sandbox.workspaceAccess` は、**サンドボックスが何を参照できるか**を制御します。

<Tabs>
  <Tab title="none (default)">
    ツールは `~/.openclaw/sandboxes` 配下のサンドボックスワークスペースを参照します。
  </Tab>
  <Tab title="ro">
    エージェントワークスペースを `/agent` に読み取り専用でマウントします（`write`/`edit`/`apply_patch` を無効化します）。
  </Tab>
  <Tab title="rw">
    エージェントワークスペースを `/workspace` に読み書き可能でマウントします。
  </Tab>
</Tabs>

OpenShell バックエンドでは:

- `mirror` モードは、exec ターン間の正となるソースとして引き続きローカルワークスペースを使用します
- `remote` モードは、初回シード後に正となるソースとしてリモートの OpenShell ワークスペースを使用します
- `workspaceAccess: "ro"` と `"none"` は、同じ方法で書き込み動作を引き続き制限します

受信メディアは、アクティブなサンドボックスワークスペース（`media/inbound/*`）にコピーされます。

<Note>
**Skills 注記:** `read` ツールはサンドボックスルート基準です。`workspaceAccess: "none"` では、OpenClaw は読み取り可能にするため、対象の Skills をサンドボックスワークスペース（`.../skills`）へミラーします。`"rw"` では、ワークスペースの Skills は `/workspace/skills` から読み取れます。
</Note>

## カスタム bind マウント

`agents.defaults.sandbox.docker.binds` は、追加のホストディレクトリをコンテナにマウントします。形式: `host:container:mode`（例: `"/home/user/source:/source:rw"`）。

グローバル bind とエージェントごとの bind は**マージ**されます（置き換えられません）。`scope: "shared"` では、エージェントごとの bind は無視されます。

`agents.defaults.sandbox.browser.binds` は、追加のホストディレクトリを**サンドボックスブラウザ**コンテナにのみマウントします。

- 設定されている場合（`[]` を含む）、ブラウザコンテナについて `agents.defaults.sandbox.docker.binds` を置き換えます。
- 省略された場合、ブラウザコンテナは `agents.defaults.sandbox.docker.binds` にフォールバックします（後方互換）。

例（読み取り専用ソース + 追加のデータディレクトリ）:

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
**Bind セキュリティ**

- bind はサンドボックスファイルシステムを迂回します。設定したモード（`:ro` または `:rw`）でホストパスを公開します。
- OpenClaw は危険な bind ソースをブロックします（例: `docker.sock`、`/etc`、`/proc`、`/sys`、`/dev`、およびそれらを公開する親マウント）。
- OpenClaw は、`~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm`、`~/.ssh` などの一般的なホームディレクトリ内の認証情報ルートもブロックします。
- bind 検証は単なる文字列一致ではありません。OpenClaw はソースパスを正規化し、ブロック対象パスと許可ルートを再チェックする前に、存在する最も深い祖先を通じて再度解決します。
- つまり、最終的なリーフがまだ存在しない場合でも、シンボリックリンク親による脱出は安全側で失敗します。例: `run-link` がそこを指している場合、`/workspace/run-link/new-file` は引き続き `/var/run/...` として解決されます。
- 許可されたソースルートも同じ方法で正規化されるため、シンボリックリンク解決前に許可リスト内に見えるだけのパスは、`outside allowed roots` として引き続き拒否されます。
- 機密マウント（シークレット、SSH キー、サービス認証情報）は、どうしても必要でない限り `:ro` にする必要があります。
- ワークスペースへの読み取りアクセスだけが必要な場合は、`workspaceAccess: "ro"` と組み合わせます。bind モードは独立したままです。
- bind がツールポリシーや elevated exec とどう相互作用するかは、[サンドボックス vs ツールポリシー vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

</Warning>

## イメージとセットアップ

デフォルトの Docker イメージ: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Build the default image">
    ```bash
    scripts/sandbox-setup.sh
    ```

    デフォルトイメージには Node は含まれません。Skill が Node（または他のランタイム）を必要とする場合は、カスタムイメージに組み込むか、`sandbox.docker.setupCommand` 経由でインストールしてください（ネットワーク送信 + 書き込み可能なルート + root ユーザーが必要）。

    `openclaw-sandbox:bookworm-slim` が見つからない場合でも、OpenClaw はプレーンな `debian:bookworm-slim` に暗黙で置き換えません。デフォルトイメージを対象とするサンドボックス実行は、`scripts/sandbox-setup.sh` を実行するまでビルド手順とともに即座に失敗します。これは、同梱イメージがサンドボックスの write/edit ヘルパー用に `python3` を備えているためです。

  </Step>
  <Step title="Optional: build the common image">
    一般的なツール（例: `curl`、`jq`、`nodejs`、`python3`、`git`）を含む、より機能的なサンドボックスイメージを使用する場合:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    その後、`agents.defaults.sandbox.docker.image` を `openclaw-sandbox-common:bookworm-slim` に設定します。

  </Step>
  <Step title="Optional: build the sandbox browser image">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

デフォルトでは、Docker サンドボックスコンテナは**ネットワークなし**で実行されます。`agents.defaults.sandbox.docker.network` で上書きします。

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    同梱のサンドボックスブラウザイメージは、コンテナ化されたワークロード向けに保守的な Chromium 起動デフォルトも適用します。現在のコンテナデフォルトには次が含まれます。

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
    - 3 つのグラフィックス強化フラグ（`--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu`）は任意で、コンテナに GPU サポートがない場合に有用です。ワークロードが WebGL やその他の 3D/ブラウザ機能を必要とする場合は、`OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` を設定してください。
    - `--disable-extensions` はデフォルトで有効で、拡張機能に依存するフローでは `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で無効化できます。
    - `--renderer-process-limit=2` は `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` によって制御され、`0` の場合は Chromium のデフォルトを維持します。

    別のランタイムプロファイルが必要な場合は、カスタムブラウザイメージを使用し、独自の entrypoint を提供してください。ローカル（非コンテナ）の Chromium プロファイルでは、`browser.extraArgs` を使用して追加の起動フラグを付加します。

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` はブロックされます。
    - `network: "container:<id>"` はデフォルトでブロックされます（namespace join による迂回リスク）。
    - 非常時の上書き: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker インストールとコンテナ化された Gateway はこちらです: [Docker](/ja-JP/install/docker)

Docker Gateway デプロイでは、`scripts/docker/setup.sh` でサンドボックス設定をブートストラップできます。そのパスを有効にするには、`OPENCLAW_SANDBOX=1`（または `true`/`yes`/`on`）を設定します。`OPENCLAW_DOCKER_SOCKET` でソケットの場所を上書きできます。完全なセットアップと環境変数リファレンス: [Docker](/ja-JP/install/docker#agent-sandbox)。

## setupCommand（一度限りのコンテナセットアップ）

`setupCommand` は、サンドボックスコンテナが作成された後に**一度だけ**実行されます（毎回の実行時ではありません）。コンテナ内で `sh -lc` を介して実行されます。

パス:

- グローバル: `agents.defaults.sandbox.docker.setupCommand`
- エージェントごと: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - デフォルトの `docker.network` は `"none"`（送信なし）のため、パッケージインストールは失敗します。
    - `docker.network: "container:<id>"` には `dangerouslyAllowContainerNamespaceJoin: true` が必要で、非常時専用です。
    - `readOnlyRoot: true` は書き込みを防ぎます。`readOnlyRoot: false` を設定するか、カスタムイメージに組み込んでください。
    - パッケージインストールでは `user` は root である必要があります（`user` を省略するか、`user: "0:0"` を設定します）。
    - サンドボックス exec はホストの `process.env` を継承しません。Skill の API キーには `agents.defaults.sandbox.docker.env`（またはカスタムイメージ）を使用してください。

  </Accordion>
</AccordionGroup>

## ツールポリシーとエスケープハッチ

ツールの許可/拒否ポリシーは、サンドボックスルールの前に引き続き適用されます。ツールがグローバルまたはエージェントごとに拒否されている場合、サンドボックス化しても復活しません。

`tools.elevated` は、サンドボックス外で `exec` を実行する明示的なエスケープハッチです（デフォルトでは `gateway`、exec ターゲットが `node` の場合は `node`）。`/exec` ディレクティブは承認された送信者にのみ適用され、セッションごとに永続化されます。`exec` を強制的に無効化するには、ツールポリシーの deny を使用します（[サンドボックス vs ツールポリシー vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照）。

デバッグ:

- 有効なサンドボックスモード、ツールポリシー、修正用設定キーを調べるには、`openclaw sandbox explain` を使用します。
- 「なぜこれはブロックされるのか？」という考え方については、[サンドボックス vs ツールポリシー vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

ロックダウンした状態を保ってください。

## マルチエージェントの上書き

各エージェントはサンドボックスとツールを上書きできます: `agents.list[].sandbox` と `agents.list[].tools`（さらにサンドボックスツールポリシー用の `agents.list[].tools.sandbox.tools`）。優先順位については、[マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

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

- [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) — エージェントごとのオーバーライドと優先順位
- [OpenShell](/ja-JP/gateway/openshell) — 管理対象サンドボックスバックエンドのセットアップ、ワークスペースモード、設定リファレンス
- [サンドボックス設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- [サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) — 「なぜこれがブロックされるのか?」のデバッグ
- [セキュリティ](/ja-JP/gateway/security)
