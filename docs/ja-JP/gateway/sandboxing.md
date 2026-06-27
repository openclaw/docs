---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClaw のサンドボックス化の仕組み: モード、スコープ、ワークスペースアクセス、画像'
title: サンドボックス化
x-i18n:
    generated_at: "2026-06-27T11:34:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw は、影響範囲を抑えるために **サンドボックスバックエンド内でツール**を実行できます。これは**任意**であり、設定（`agents.defaults.sandbox` または `agents.list[].sandbox`）によって制御されます。サンドボックス化がオフの場合、ツールはホスト上で実行されます。Gateway はホスト上に残り、有効化されている場合はツール実行が隔離されたサンドボックス内で行われます。

<Note>
これは完全なセキュリティ境界ではありませんが、モデルが不適切な動作をした場合のファイルシステムとプロセスへのアクセスを実質的に制限します。
</Note>

## サンドボックス化されるもの

- ツール実行（`exec`、`read`、`write`、`edit`、`apply_patch`、`process` など）。
- 任意のサンドボックス化されたブラウザ（`agents.defaults.sandbox.browser`）。

<AccordionGroup>
  <Accordion title="サンドボックス化されたブラウザの詳細">
    - デフォルトでは、ブラウザツールが必要としたときにサンドボックスブラウザが自動起動します（CDP に到達可能であることを保証します）。`agents.defaults.sandbox.browser.autoStart` と `agents.defaults.sandbox.browser.autoStartTimeoutMs` で設定します。
    - デフォルトでは、サンドボックスブラウザコンテナはグローバルな `bridge` ネットワークではなく、専用の Docker ネットワーク（`openclaw-sandbox-browser`）を使用します。`agents.defaults.sandbox.browser.network` で設定します。
    - 任意の `agents.defaults.sandbox.browser.cdpSourceRange` は、CIDR 許可リスト（例: `172.21.0.1/32`）によってコンテナ端の CDP 受信を制限します。
    - noVNC オブザーバーアクセスはデフォルトでパスワード保護されています。OpenClaw は短命のトークン URL を発行し、それがローカルのブートストラップページを提供して、URL フラグメント（クエリやヘッダーログではありません）内のパスワードで noVNC を開きます。
    - `agents.defaults.sandbox.browser.allowHostControl` により、サンドボックス化されたセッションがホストブラウザを明示的に対象にできます。
    - 任意の許可リストが `target: "custom"` をゲートします: `allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

  </Accordion>
</AccordionGroup>

サンドボックス化されないもの:

- Gateway プロセス自体。
- サンドボックス外での実行が明示的に許可されたツール（例: `tools.elevated`）。
  - **昇格された exec はサンドボックス化をバイパスし、設定された脱出パス（デフォルトは `gateway`、exec 対象が `node` の場合は `node`）を使用します。**
  - サンドボックス化がオフの場合、`tools.elevated` は実行を変更しません（すでにホスト上です）。[Elevated Mode](/ja-JP/tools/elevated) を参照してください。

## モード

`agents.defaults.sandbox.mode` は、サンドボックス化を**いつ**使用するかを制御します。

<Tabs>
  <Tab title="off">
    サンドボックス化なし。
  </Tab>
  <Tab title="non-main">
    **non-main** セッションのみをサンドボックス化します（通常のチャットをホスト上で実行したい場合のデフォルト）。

    `"non-main"` はエージェント ID ではなく、`session.mainKey`（デフォルトは `"main"`）に基づきます。グループ/チャンネルセッションは独自のキーを使用するため、non-main と見なされ、サンドボックス化されます。

  </Tab>
  <Tab title="all">
    すべてのセッションがサンドボックス内で実行されます。
  </Tab>
</Tabs>

## スコープ

`agents.defaults.sandbox.scope` は、作成される**コンテナ数**を制御します。

- `"agent"`（デフォルト）: エージェントごとに 1 つのコンテナ。
- `"session"`: セッションごとに 1 つのコンテナ。
- `"shared"`: すべてのサンドボックス化されたセッションで共有される 1 つのコンテナ。

## バックエンド

`agents.defaults.sandbox.backend` は、サンドボックスを提供する**ランタイム**を制御します。

- `"docker"`（サンドボックス化が有効な場合のデフォルト）: ローカルの Docker ベースのサンドボックスランタイム。
- `"ssh"`: 汎用の SSH ベースのリモートサンドボックスランタイム。
- `"openshell"`: OpenShell ベースのサンドボックスランタイム。

SSH 固有の設定は `agents.defaults.sandbox.ssh` 配下にあります。OpenShell 固有の設定は `plugins.entries.openshell.config` 配下にあります。

### バックエンドの選択

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **実行場所**        | ローカルコンテナ                 | SSH でアクセス可能な任意のホスト | OpenShell 管理のサンドボックス                     |
| **セットアップ**    | `scripts/sandbox-setup.sh`       | SSH キー + 対象ホスト          | OpenShell Plugin が有効                             |
| **ワークスペースモデル** | バインドマウントまたはコピー | リモート正準（初回のみシード） | `mirror` または `remote`                            |
| **ネットワーク制御** | `docker.network`（デフォルト: なし） | リモートホストに依存       | OpenShell に依存                                    |
| **ブラウザサンドボックス** | 対応                       | 非対応                         | まだ非対応                                          |
| **バインドマウント** | `docker.binds`                  | N/A                            | N/A                                                 |
| **最適な用途**      | ローカル開発、完全な隔離         | リモートマシンへのオフロード   | 任意の双方向同期を備えた管理リモートサンドボックス |

### Docker バックエンド

サンドボックス化はデフォルトでオフです。サンドボックス化を有効にしてバックエンドを選択しない場合、OpenClaw は Docker バックエンドを使用します。Docker デーモンソケット（`/var/run/docker.sock`）経由で、ツールとサンドボックスブラウザをローカルで実行します。サンドボックスコンテナの隔離は Docker 名前空間によって決まります。

ホスト GPU を Docker サンドボックスに公開するには、`agents.defaults.sandbox.docker.gpus` またはエージェント単位の `agents.list[].sandbox.docker.gpus` オーバーライドを設定します。この値は、たとえば `"all"` や `"device=GPU-uuid"` のように、Docker の `--gpus` フラグに別個の引数として渡され、NVIDIA Container Toolkit などの互換性のあるホストランタイムが必要です。

<Warning>
**Docker-out-of-Docker (DooD) の制約**

OpenClaw Gateway 自体を Docker コンテナとしてデプロイする場合、ホストの Docker ソケット（DooD）を使用して兄弟サンドボックスコンテナをオーケストレーションします。これにより、特定のパスマッピング制約が生じます。

- **設定にはホストパスが必要**: `openclaw.json` の `workspace` 設定には、内部 Gateway コンテナパスではなく、**ホストの絶対パス**（例: `/home/user/.openclaw/workspaces`）を含める必要があります。OpenClaw が Docker デーモンにサンドボックスの生成を依頼すると、デーモンは Gateway 名前空間ではなくホスト OS 名前空間を基準にパスを評価します。
- **FS ブリッジの同等性（同一のボリュームマップ）**: OpenClaw Gateway のネイティブプロセスも `workspace` ディレクトリに Heartbeat とブリッジファイルを書き込みます。Gateway は自身のコンテナ化された環境内からまったく同じ文字列（ホストパス）を評価するため、Gateway のデプロイには、ホスト名前空間をネイティブにリンクする同一のボリュームマップ（`-v /home/user/.openclaw:/home/user/.openclaw`）を含める必要があります。
- **Codex コードモード**: OpenClaw サンドボックスがアクティブな場合、そのターンでは OpenClaw は Codex アプリサーバーのネイティブ Code Mode、ユーザー MCP サーバー、アプリバックの Plugin 実行を無効にします。これは、それらのネイティブサーフェスが OpenClaw サンドボックスバックエンドではなく、Gateway ホストのアプリサーバープロセスから実行されるためです。通常の exec/process ツールが利用可能な場合、シェルアクセスは `sandbox_exec` や `sandbox_process` などの OpenClaw サンドボックスバックツールを通じて公開されます。ホストの Docker ソケットをエージェントサンドボックスコンテナやカスタム Codex サンドボックスにマウントしないでください。

Ubuntu/AppArmor ホストでは、OpenClaw サンドボックス化がアクティブでない状態でネイティブ Codex `workspace-write` を意図的に実行し、サービスユーザーに非特権ユーザー名前空間の作成が許可されていない場合、Codex `workspace-write` はシェル起動前に失敗することがあります。Docker サンドボックスの送信が無効（`network: "none"`、デフォルト）になっている場合、Codex には非特権ネットワーク名前空間も必要です。一般的な症状は `bwrap: setting up uid map: Permission denied` と `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` です。`openclaw doctor` を実行してください。Codex bwrap 名前空間プローブの失敗が報告された場合は、OpenClaw サービスプロセスに必要な名前空間を付与する AppArmor プロファイルを優先してください。`kernel.apparmor_restrict_unprivileged_userns=0` はホスト全体に影響するフォールバックであり、セキュリティ上のトレードオフがあります。そのホストの姿勢として許容できる場合にのみ使用してください。

絶対ホストパスの同等性なしに内部でパスをマッピングすると、完全修飾パス文字列がネイティブには存在しないため、OpenClaw はコンテナ環境内で Heartbeat を書き込もうとして、ネイティブに `EACCES` 権限エラーをスローします。
</Warning>

### SSH バックエンド

OpenClaw に任意の SSH アクセス可能なマシン上で `exec`、ファイルツール、メディア読み取りをサンドボックス化させたい場合は、`backend: "ssh"` を使用します。

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
    - OpenClaw は `sandbox.ssh.workspaceRoot` 配下にスコープごとのリモートルートを作成します。
    - 作成または再作成後の初回使用時に、OpenClaw はローカルワークスペースからそのリモートワークスペースを一度シードします。
    - その後、`exec`、`read`、`write`、`edit`、`apply_patch`、プロンプトメディア読み取り、受信メディアのステージングは、SSH 経由でリモートワークスペースに対して直接実行されます。
    - OpenClaw はリモートの変更をローカルワークスペースへ自動的には同期しません。

  </Accordion>
  <Accordion title="認証マテリアル">
    - `identityFile`、`certificateFile`、`knownHostsFile`: 既存のローカルファイルを使用し、OpenSSH 設定を通じて渡します。
    - `identityData`、`certificateData`、`knownHostsData`: インライン文字列または SecretRefs を使用します。OpenClaw は通常のシークレットランタイムスナップショットを通じてそれらを解決し、`0600` の一時ファイルに書き込み、SSH セッション終了時に削除します。
    - 同じ項目に対して `*File` と `*Data` の両方が設定されている場合、その SSH セッションでは `*Data` が優先されます。

  </Accordion>
  <Accordion title="リモート正準の影響">
    これは**リモート正準**モデルです。初期シード後、リモート SSH ワークスペースが実際のサンドボックス状態になります。

    - シード手順の後に OpenClaw の外部で行われたホストローカル編集は、サンドボックスを再作成するまでリモートには表示されません。
    - `openclaw sandbox recreate` はスコープごとのリモートルートを削除し、次回使用時にローカルから再度シードします。
    - SSH バックエンドではブラウザサンドボックス化は対応していません。
    - `sandbox.docker.*` 設定は SSH バックエンドには適用されません。

  </Accordion>
</AccordionGroup>

### OpenShell バックエンド

OpenClaw に OpenShell 管理のリモート環境でツールをサンドボックス化させたい場合は、`backend: "openshell"` を使用します。完全なセットアップガイド、設定リファレンス、ワークスペースモードの比較については、専用の [OpenShell ページ](/ja-JP/gateway/openshell) を参照してください。

OpenShell は、汎用 SSH バックエンドと同じ中核 SSH トランスポートおよびリモートファイルシステムブリッジを再利用し、OpenShell 固有のライフサイクル（`sandbox create/get/delete`、`sandbox ssh-config`）と任意の `mirror` ワークスペースモードを追加します。

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

- `mirror`（デフォルト）: ローカルワークスペースが正準のままです。OpenClaw は exec 前にローカルファイルを OpenShell に同期し、exec 後にリモートワークスペースを同期し戻します。
- `remote`: サンドボックス作成後は OpenShell ワークスペースが正準です。OpenClaw はローカルワークスペースからリモートワークスペースを一度シードし、その後ファイルツールと exec は変更を同期し戻すことなく、リモートサンドボックスに対して直接実行されます。

<AccordionGroup>
  <Accordion title="リモートトランスポートの詳細">
    - OpenClaw は `openshell sandbox ssh-config <name>` を使って、サンドボックス固有の SSH 設定を OpenShell に要求します。
    - コアはその SSH 設定を一時ファイルに書き込み、SSH セッションを開き、`backend: "ssh"` で使われるものと同じリモートファイルシステムブリッジを再利用します。
    - `mirror` モードではライフサイクルだけが異なります。exec 前にローカルをリモートへ同期し、exec 後に同期し直します。

  </Accordion>
  <Accordion title="現在の OpenShell の制限">
    - サンドボックスブラウザーはまだサポートされていません
    - `sandbox.docker.binds` は OpenShell バックエンドではサポートされていません
    - `sandbox.docker.*` 配下の Docker 固有のランタイムノブは、引き続き Docker バックエンドにのみ適用されます

  </Accordion>
</AccordionGroup>

#### ワークスペースモード

OpenShell には 2 つのワークスペースモデルがあります。実際にはここが最も重要です。

<Tabs>
  <Tab title="mirror (ローカル正準)">
    **ローカルワークスペースを正準のままにしたい**場合は、`plugins.entries.openshell.config.mode: "mirror"` を使います。

    動作:

    - `exec` の前に、OpenClaw はローカルワークスペースを OpenShell サンドボックスへ同期します。
    - `exec` の後に、OpenClaw はリモートワークスペースをローカルワークスペースへ同期し直します。
    - ファイルツールは引き続きサンドボックスブリッジ経由で動作しますが、ターン間ではローカルワークスペースが信頼できる情報源のままです。

    次の場合に使います:

    - OpenClaw の外でローカルファイルを編集し、その変更をサンドボックスへ自動的に反映したい
    - OpenShell サンドボックスをできるだけ Docker バックエンドと同じように動作させたい
    - 各 exec ターンの後に、ホストワークスペースへサンドボックスの書き込みを反映したい

    トレードオフ: exec の前後に追加の同期コストがかかります。

  </Tab>
  <Tab title="remote (OpenShell 正準)">
    **OpenShell ワークスペースを正準にしたい**場合は、`plugins.entries.openshell.config.mode: "remote"` を使います。

    動作:

    - サンドボックスが最初に作成されるとき、OpenClaw はローカルワークスペースからリモートワークスペースへ一度だけシードします。
    - その後、`exec`、`read`、`write`、`edit`、`apply_patch` はリモート OpenShell ワークスペースに対して直接動作します。
    - OpenClaw は exec 後にリモートの変更をローカルワークスペースへ同期しません。
    - プロンプト時のメディア読み取りは引き続き機能します。ファイルツールとメディアツールは、ローカルホストパスを仮定するのではなく、サンドボックスブリッジ経由で読み取るためです。
    - トランスポートは、`openshell sandbox ssh-config` が返す OpenShell サンドボックスへの SSH です。

    重要な結果:

    - シード手順の後に OpenClaw の外でホスト上のファイルを編集しても、リモートサンドボックスはその変更を自動的には認識しません。
    - サンドボックスが再作成されると、ローカルワークスペースからリモートワークスペースが再びシードされます。
    - `scope: "agent"` または `scope: "shared"` では、そのリモートワークスペースは同じスコープで共有されます。

    次の場合に使います:

    - サンドボックスを主にリモート OpenShell 側で保持したい
    - ターンごとの同期オーバーヘッドを下げたい
    - ホストローカルの編集でリモートサンドボックス状態が暗黙に上書きされることを避けたい

  </Tab>
</Tabs>

サンドボックスを一時的な実行環境と考える場合は `mirror` を選びます。サンドボックスを実際のワークスペースと考える場合は `remote` を選びます。

#### OpenShell ライフサイクル

OpenShell サンドボックスは、引き続き通常のサンドボックスライフサイクルで管理されます:

- `openclaw sandbox list` は OpenShell ランタイムと Docker ランタイムの両方を表示します
- `openclaw sandbox recreate` は現在のランタイムを削除し、次回使用時に OpenClaw が再作成できるようにします
- prune ロジックもバックエンドを認識します

`remote` モードでは、recreate が特に重要です:

- recreate はそのスコープの正準リモートワークスペースを削除します
- 次回使用時に、ローカルワークスペースから新しいリモートワークスペースをシードします

`mirror` モードでは、ローカルワークスペースはいずれにせよ正準のままなので、recreate は主にリモート実行環境をリセットします。

## ワークスペースアクセス

`agents.defaults.sandbox.workspaceAccess` は、**サンドボックスが何を見られるか**を制御します:

<Tabs>
  <Tab title="none (デフォルト)">
    ツールは `~/.openclaw/sandboxes` 配下のサンドボックスワークスペースを参照します。
  </Tab>
  <Tab title="ro">
    エージェントワークスペースを読み取り専用で `/agent` にマウントします（`write`/`edit`/`apply_patch` を無効化します）。
  </Tab>
  <Tab title="rw">
    エージェントワークスペースを読み書き可能で `/workspace` にマウントします。
  </Tab>
</Tabs>

OpenShell バックエンドでは:

- `mirror` モードは、exec ターン間の正準ソースとして引き続きローカルワークスペースを使います
- `remote` モードは、初期シード後の正準ソースとしてリモート OpenShell ワークスペースを使います
- `workspaceAccess: "ro"` と `"none"` は、書き込み動作を同じように制限します

受信メディアは、アクティブなサンドボックスワークスペース（`media/inbound/*`）へコピーされます。

<Note>
**Skills 注記:** `read` ツールはサンドボックスルート基準です。`workspaceAccess: "none"` では、OpenClaw は対象の Skills をサンドボックスワークスペース（`.../skills`）へミラーして、読み取れるようにします。`"rw"` では、ワークスペース Skills は `/workspace/skills` から読み取り可能で、対象のマネージド、バンドル済み、または Plugin の Skills は、生成された読み取り専用パス `/workspace/.openclaw/sandbox-skills/skills` に具現化されます。
</Note>

## カスタムバインドマウント

`agents.defaults.sandbox.docker.binds` は追加のホストディレクトリをコンテナへマウントします。形式: `host:container:mode`（例: `"/home/user/source:/source:rw"`）。

グローバルバインドとエージェントごとのバインドは**マージ**されます（置き換えられません）。`scope: "shared"` では、エージェントごとのバインドは無視されます。

`agents.defaults.sandbox.browser.binds` は追加のホストディレクトリを**サンドボックスブラウザー**コンテナにのみマウントします。

- 設定されている場合（`[]` を含む）、ブラウザーコンテナでは `agents.defaults.sandbox.docker.binds` を置き換えます。
- 省略されている場合、ブラウザーコンテナは `agents.defaults.sandbox.docker.binds` にフォールバックします（後方互換）。

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
**バインドのセキュリティ**

- バインドはサンドボックスファイルシステムをバイパスします。設定したモード（`:ro` または `:rw`）でホストパスを公開します。
- OpenClaw は危険なバインドソースをブロックします（例: `docker.sock`、`/etc`、`/proc`、`/sys`、`/dev`、およびそれらを公開する親マウント）。
- OpenClaw は、`~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm`、`~/.ssh` など、一般的なホームディレクトリの認証情報ルートもブロックします。
- バインド検証は単なる文字列照合ではありません。OpenClaw はソースパスを正規化し、ブロックされたパスと許可されたルートを再確認する前に、存在する最深の祖先を通じて再度解決します。
- つまり、最終リーフがまだ存在しない場合でも、シンボリックリンク親による脱出は fail closed になります。例: `run-link` がそこを指している場合、`/workspace/run-link/new-file` は引き続き `/var/run/...` として解決されます。
- 許可されたソースルートも同じ方法で正規化されるため、シンボリックリンク解決前に allowlist 内に見えるだけのパスは、引き続き `outside allowed roots` として拒否されます。
- 機密マウント（シークレット、SSH 鍵、サービス認証情報）は、絶対に必要でない限り `:ro` にするべきです。
- ワークスペースへの読み取りアクセスだけが必要な場合は、`workspaceAccess: "ro"` と組み合わせます。バインドモードは独立したままです。
- バインドがツールポリシーや昇格 exec とどう相互作用するかについては、[サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

</Warning>

## イメージとセットアップ

デフォルトの Docker イメージ: `openclaw-sandbox:bookworm-slim`

<Note>
**ソースチェックアウト vs npm install**

`scripts/sandbox-setup.sh`、`scripts/sandbox-common-setup.sh`、`scripts/sandbox-browser-setup.sh` ヘルパースクリプトは、[ソースチェックアウト](https://github.com/openclaw/openclaw)から実行している場合にのみ利用できます。npm パッケージには含まれていません。

`npm install -g openclaw` で OpenClaw をインストールした場合は、代わりに以下に示すインラインの `docker build` コマンドを使ってください。
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

    デフォルトイメージには **Node は含まれていません**。Skill が Node（または他のランタイム）を必要とする場合は、カスタムイメージに焼き込むか、`sandbox.docker.setupCommand` でインストールしてください（ネットワーク egress + 書き込み可能なルート + root ユーザーが必要です）。

    `openclaw-sandbox:bookworm-slim` が見つからない場合でも、OpenClaw は通常の `debian:bookworm-slim` に暗黙に置き換えません。デフォルトイメージを対象にするサンドボックス実行は、ビルドするまでビルド手順を示して即座に失敗します。これは、バンドルされたイメージがサンドボックスの書き込み/編集ヘルパー用に `python3` を含むためです。

  </Step>
  <Step title="任意: common イメージをビルドする">
    一般的なツール（例: `curl`、`jq`、Node 24、pnpm、`python3`、`git`）を含む、より機能的なサンドボックスイメージの場合:

    ソースチェックアウトから:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    npm インストールからは、まずデフォルトイメージをビルドし（上記参照）、その後リポジトリの [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) を使って、その上に common イメージをビルドします。

    次に、`agents.defaults.sandbox.docker.image` を `openclaw-sandbox-common:bookworm-slim` に設定します。

  </Step>
  <Step title="任意: サンドボックスブラウザーイメージをビルドする">
    ソースチェックアウトから:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    npm インストールからは、リポジトリの [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) を使ってビルドします。

  </Step>
</Steps>

デフォルトでは、Docker サンドボックスコンテナは**ネットワークなし**で実行されます。`agents.defaults.sandbox.docker.network` で上書きします。

<AccordionGroup>
  <Accordion title="サンドボックスブラウザーの Chromium デフォルト">
    バンドルされたサンドボックスブラウザーイメージは、コンテナ化されたワークロード向けに保守的な Chromium 起動デフォルトも適用します。現在のコンテナデフォルトには次が含まれます:

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
    - 3 つのグラフィックス強化フラグ（`--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu`）は任意で、コンテナに GPU サポートがない場合に有用です。ワークロードが WebGL やその他の 3D/ブラウザー機能を必要とする場合は、`OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` を設定してください。
    - `--disable-extensions` はデフォルトで有効で、拡張機能に依存するフローでは `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で無効にできます。
    - `--renderer-process-limit=2` は `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で制御され、`0` は Chromium のデフォルトを保持します。

    別のランタイムプロファイルが必要な場合は、カスタムブラウザーイメージを使い、独自のエントリーポイントを提供してください。ローカル（非コンテナ）の Chromium プロファイルでは、`browser.extraArgs` を使って追加の起動フラグを付加します。

  </Accordion>
  <Accordion title="ネットワークセキュリティのデフォルト">
    - `network: "host"` はブロックされます。
    - `network: "container:<id>"` はデフォルトでブロックされます（namespace join のバイパスリスク）。
    - 緊急時の上書き: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker のインストールとコンテナ化された Gateway はこちらにあります: [Docker](/ja-JP/install/docker)

Docker Gateway デプロイでは、`scripts/docker/setup.sh` でサンドボックス設定をブートストラップできます。そのパスを有効にするには、`OPENCLAW_SANDBOX=1`（または `true`/`yes`/`on`）を設定します。ソケットの場所は `OPENCLAW_DOCKER_SOCKET` で上書きできます。完全なセットアップと環境変数リファレンス: [Docker](/ja-JP/install/docker#agent-sandbox)。

## setupCommand（一度だけのコンテナセットアップ）

`setupCommand` は、サンドボックスコンテナが作成された後に **一度だけ** 実行されます（毎回の実行時ではありません）。コンテナ内で `sh -lc` 経由で実行されます。

パス:

- グローバル: `agents.defaults.sandbox.docker.setupCommand`
- エージェントごと: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="よくある落とし穴">
    - デフォルトの `docker.network` は `"none"`（外向き通信なし）なので、パッケージのインストールは失敗します。
    - `docker.network: "container:<id>"` には `dangerouslyAllowContainerNamespaceJoin: true` が必要で、緊急時専用です。
    - `readOnlyRoot: true` は書き込みを防ぎます。`readOnlyRoot: false` を設定するか、カスタムイメージを作成してください。
    - パッケージのインストールには `user` が root である必要があります（`user` を省略するか、`user: "0:0"` を設定します）。
    - サンドボックスの exec はホストの `process.env` を継承**しません**。Skill API キーには `agents.defaults.sandbox.docker.env`（またはカスタムイメージ）を使用してください。
    - `agents.defaults.sandbox.docker.env` の値は、明示的な Docker コンテナ環境変数として渡されます。Docker デーモンへアクセスできる人は、`docker inspect` などの Docker メタデータコマンドでそれらを確認できます。そのメタデータ露出を許容できない場合は、カスタムイメージ、マウントされたシークレットファイル、または別のシークレット配信パスを使用してください。

  </Accordion>
</AccordionGroup>

## ツールポリシーとエスケープハッチ

ツールの許可/拒否ポリシーは、サンドボックスルールより前に引き続き適用されます。ツールがグローバルまたはエージェントごとに拒否されている場合、サンドボックス化によってそれが再び使えるようになることはありません。

`tools.elevated` は、サンドボックス外で `exec` を実行する明示的なエスケープハッチです（デフォルトは `gateway`、exec ターゲットが `node` の場合は `node`）。`/exec` ディレクティブは承認済み送信者にのみ適用され、セッションごとに永続化されます。`exec` を強制的に無効化するには、ツールポリシーの deny を使用してください（[サンドボックス vs ツールポリシー vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照）。

デバッグ:

- 有効なサンドボックスモード、ツールポリシー、修正用の設定キーを調べるには、`openclaw sandbox explain` を使用します。
- 「なぜこれはブロックされているのか？」という考え方については、[サンドボックス vs ツールポリシー vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

ロックダウンされた状態を維持してください。

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

- [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) — エージェントごとの上書きと優先順位
- [OpenShell](/ja-JP/gateway/openshell) — 管理されたサンドボックスバックエンドのセットアップ、ワークスペースモード、設定リファレンス
- [サンドボックス設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- [サンドボックス vs ツールポリシー vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) — 「なぜこれはブロックされているのか？」のデバッグ
- [セキュリティ](/ja-JP/gateway/security)
