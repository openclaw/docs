---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClawのサンドボックス化の仕組み: モード、スコープ、ワークスペースアクセス、画像'
title: サンドボックス化
x-i18n:
    generated_at: "2026-05-11T20:30:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a90a68fdab1fdaef462bc6be589cb510d89c01138a0d43927e29d55bbb6e3ea
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw は、影響範囲を減らすために **サンドボックスバックエンド内でツール**を実行できます。これは**任意**であり、設定（`agents.defaults.sandbox` または `agents.list[].sandbox`）によって制御されます。サンドボックス化がオフの場合、ツールはホスト上で実行されます。Gateway はホスト上に残り、有効化されている場合はツール実行が分離されたサンドボックス内で実行されます。

<Note>
これは完全なセキュリティ境界ではありませんが、モデルが誤った動作をした場合でも、ファイルシステムとプロセスへのアクセスを実質的に制限します。
</Note>

## サンドボックス化されるもの

- ツール実行（`exec`、`read`、`write`、`edit`、`apply_patch`、`process` など）。
- 任意のサンドボックス化ブラウザー（`agents.defaults.sandbox.browser`）。

<AccordionGroup>
  <Accordion title="サンドボックス化ブラウザーの詳細">
    - デフォルトでは、ブラウザーツールが必要としたときに、サンドボックスブラウザーが自動起動します（CDP に到達可能であることを保証します）。`agents.defaults.sandbox.browser.autoStart` と `agents.defaults.sandbox.browser.autoStartTimeoutMs` で設定します。
    - デフォルトでは、サンドボックスブラウザーコンテナーはグローバルな `bridge` ネットワークではなく、専用の Docker ネットワーク（`openclaw-sandbox-browser`）を使用します。`agents.defaults.sandbox.browser.network` で設定します。
    - 任意の `agents.defaults.sandbox.browser.cdpSourceRange` は、CIDR 許可リスト（例: `172.21.0.1/32`）でコンテナー境界の CDP 受信を制限します。
    - noVNC の監視アクセスはデフォルトでパスワード保護されています。OpenClaw は短命のトークン URL を発行し、ローカルのブートストラップページを提供して、URL フラグメント（クエリやヘッダーログではありません）内のパスワードで noVNC を開きます。
    - `agents.defaults.sandbox.browser.allowHostControl` により、サンドボックス化されたセッションがホストブラウザーを明示的に対象にできます。
    - 任意の許可リストが `target: "custom"` を制御します: `allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

  </Accordion>
</AccordionGroup>

サンドボックス化されないもの:

- Gateway プロセス自体。
- サンドボックス外で実行することを明示的に許可されたツール（例: `tools.elevated`）。
  - **昇格された exec はサンドボックス化を迂回し、設定済みのエスケープパス（デフォルトは `gateway`、exec 対象が `node` の場合は `node`）を使用します。**
  - サンドボックス化がオフの場合、`tools.elevated` は実行を変更しません（すでにホスト上です）。[昇格モード](/ja-JP/tools/elevated)を参照してください。

## モード

`agents.defaults.sandbox.mode` は、サンドボックス化を**いつ**使用するかを制御します:

<Tabs>
  <Tab title="off">
    サンドボックス化なし。
  </Tab>
  <Tab title="non-main">
    **non-main** セッションのみをサンドボックス化します（通常のチャットをホスト上で実行したい場合のデフォルト）。

    `"non-main"` は agent id ではなく `session.mainKey`（デフォルトは `"main"`）に基づきます。グループ/チャネルセッションは独自のキーを使用するため、non-main と見なされ、サンドボックス化されます。

  </Tab>
  <Tab title="all">
    すべてのセッションがサンドボックス内で実行されます。
  </Tab>
</Tabs>

## スコープ

`agents.defaults.sandbox.scope` は、**作成されるコンテナー数**を制御します:

- `"agent"`（デフォルト）: agent ごとに 1 つのコンテナー。
- `"session"`: セッションごとに 1 つのコンテナー。
- `"shared"`: すべてのサンドボックス化セッションで共有される 1 つのコンテナー。

## バックエンド

`agents.defaults.sandbox.backend` は、**どのランタイム**がサンドボックスを提供するかを制御します:

- `"docker"`（サンドボックス化が有効な場合のデフォルト）: ローカルの Docker ベースのサンドボックスランタイム。
- `"ssh"`: 汎用 SSH ベースのリモートサンドボックスランタイム。
- `"openshell"`: OpenShell ベースのサンドボックスランタイム。

SSH 固有の設定は `agents.defaults.sandbox.ssh` 配下にあります。OpenShell 固有の設定は `plugins.entries.openshell.config` 配下にあります。

### バックエンドの選択

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **実行場所**        | ローカルコンテナー               | 任意の SSH アクセス可能ホスト  | OpenShell 管理のサンドボックス                      |
| **セットアップ**    | `scripts/sandbox-setup.sh`       | SSH キー + 対象ホスト          | OpenShell Plugin が有効                             |
| **ワークスペースモデル** | バインドマウントまたはコピー     | リモート正準（初回のみシード） | `mirror` または `remote`                            |
| **ネットワーク制御** | `docker.network`（デフォルト: なし） | リモートホストに依存           | OpenShell に依存                                    |
| **ブラウザーサンドボックス** | 対応済み                         | 非対応                         | まだ非対応                                          |
| **バインドマウント** | `docker.binds`                   | 該当なし                       | 該当なし                                            |
| **最適な用途**      | ローカル開発、完全な分離         | リモートマシンへのオフロード   | 任意の双方向同期を備えた管理リモートサンドボックス |

### Docker バックエンド

サンドボックス化はデフォルトでオフです。サンドボックス化を有効にしてバックエンドを選択しない場合、OpenClaw は Docker バックエンドを使用します。Docker デーモンソケット（`/var/run/docker.sock`）経由で、ツールとサンドボックスブラウザーをローカルに実行します。サンドボックスコンテナーの分離は Docker 名前空間によって決まります。

ホスト GPU を Docker サンドボックスに公開するには、`agents.defaults.sandbox.docker.gpus` または agent ごとの `agents.list[].sandbox.docker.gpus` オーバーライドを設定します。この値は Docker の `--gpus` フラグに別個の引数として渡されます。例として `"all"` または `"device=GPU-uuid"` があり、NVIDIA Container Toolkit などの互換性のあるホストランタイムが必要です。

<Warning>
**Docker-out-of-Docker (DooD) の制約**

OpenClaw Gateway 自体を Docker コンテナーとしてデプロイする場合、ホストの Docker ソケットを使用して兄弟サンドボックスコンテナーをオーケストレーションします（DooD）。これにより、特定のパスマッピング制約が発生します:

- **設定にはホストパスが必要**: `openclaw.json` の `workspace` 設定には、内部 Gateway コンテナーパスではなく、**ホストの絶対パス**（例: `/home/user/.openclaw/workspaces`）を含める必要があります。OpenClaw が Docker デーモンにサンドボックスの生成を要求するとき、デーモンは Gateway 名前空間ではなくホスト OS 名前空間を基準にパスを評価します。
- **FS ブリッジの同等性（同一ボリュームマップ）**: OpenClaw Gateway のネイティブプロセスも `workspace` ディレクトリに Heartbeat とブリッジファイルを書き込みます。Gateway はコンテナー化された自身の環境内からまったく同じ文字列（ホストパス）を評価するため、Gateway デプロイにはホスト名前空間をネイティブにリンクする同一のボリュームマップ（`-v /home/user/.openclaw:/home/user/.openclaw`）を含める必要があります。
- **Codex コードモード**: OpenClaw サンドボックスが有効な場合、Codex Plugin のデフォルトが `danger-full-access` であっても、OpenClaw は Codex app-server ターンを Codex の `workspace-write` サンドボックス化に制限します。ホストの Docker ソケットを agent サンドボックスコンテナーやカスタム Codex サンドボックスにマウントしないでください。

絶対ホストパスの同等性なしに内部的にパスをマッピングすると、完全修飾パス文字列がネイティブに存在しないため、OpenClaw はコンテナー環境内の Heartbeat へ書き込もうとして `EACCES` 権限エラーをネイティブにスローします。
</Warning>

### SSH バックエンド

任意の SSH アクセス可能マシン上で OpenClaw に `exec`、ファイルツール、メディア読み取りをサンドボックス化させたい場合は、`backend: "ssh"` を使用します。

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
    - OpenClaw はリモートの変更をローカルワークスペースへ自動的に同期しません。

  </Accordion>
  <Accordion title="認証マテリアル">
    - `identityFile`、`certificateFile`、`knownHostsFile`: 既存のローカルファイルを使用し、OpenSSH 設定経由で渡します。
    - `identityData`、`certificateData`、`knownHostsData`: インライン文字列または SecretRefs を使用します。OpenClaw は通常のシークレットランタイムスナップショット経由でそれらを解決し、`0600` で一時ファイルに書き込み、SSH セッション終了時に削除します。
    - 同じ項目に `*File` と `*Data` の両方が設定されている場合、その SSH セッションでは `*Data` が優先されます。

  </Accordion>
  <Accordion title="リモート正準の影響">
    これは**リモート正準**モデルです。初回シード後、リモート SSH ワークスペースが実際のサンドボックス状態になります。

    - シード手順後に OpenClaw 外で行われたホストローカルの編集は、サンドボックスを再作成するまでリモートには表示されません。
    - `openclaw sandbox recreate` はスコープごとのリモートルートを削除し、次回使用時にローカルから再度シードします。
    - SSH バックエンドではブラウザーサンドボックス化はサポートされていません。
    - `sandbox.docker.*` 設定は SSH バックエンドには適用されません。

  </Accordion>
</AccordionGroup>

### OpenShell バックエンド

OpenShell 管理のリモート環境で OpenClaw にツールをサンドボックス化させたい場合は、`backend: "openshell"` を使用します。完全なセットアップガイド、設定リファレンス、ワークスペースモードの比較については、専用の [OpenShell ページ](/ja-JP/gateway/openshell)を参照してください。

OpenShell は、汎用 SSH バックエンドと同じコア SSH トランスポートおよびリモートファイルシステムブリッジを再利用し、OpenShell 固有のライフサイクル（`sandbox create/get/delete`、`sandbox ssh-config`）と任意の `mirror` ワークスペースモードを追加します。

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

- `mirror`（デフォルト）: ローカルワークスペースが正準のままです。OpenClaw は exec の前にローカルファイルを OpenShell に同期し、exec の後にリモートワークスペースを同期して戻します。
- `remote`: サンドボックス作成後は OpenShell ワークスペースが正準です。OpenClaw はローカルワークスペースからリモートワークスペースを一度シードし、その後ファイルツールと exec は変更を同期して戻さずにリモートサンドボックスに対して直接実行されます。

<AccordionGroup>
  <Accordion title="リモートトランスポートの詳細">
    - OpenClaw は `openshell sandbox ssh-config <name>` を通じて、サンドボックス固有の SSH 設定を OpenShell に要求します。
    - コアはその SSH 設定を一時ファイルに書き込み、SSH セッションを開き、`backend: "ssh"` で使用されるものと同じリモートファイルシステムブリッジを再利用します。
    - `mirror` モードではライフサイクルのみが異なります。exec の前にローカルからリモートへ同期し、その後 exec の後に同期して戻します。

  </Accordion>
  <Accordion title="現在の OpenShell の制限">
    - サンドボックスブラウザーはまだサポートされていません
    - `sandbox.docker.binds` は OpenShell バックエンドではサポートされていません
    - `sandbox.docker.*` 配下の Docker 固有のランタイムノブは引き続き Docker バックエンドにのみ適用されます

  </Accordion>
</AccordionGroup>

#### ワークスペースモード

OpenShell には 2 つのワークスペースモデルがあります。実際にはここが最も重要な部分です。

<Tabs>
  <Tab title="mirror（ローカル正準）">
    **ローカルワークスペースを正準のままにしたい**場合は、`plugins.entries.openshell.config.mode: "mirror"` を使用します。

    動作:

    - `exec` の前に、OpenClaw はローカルワークスペースを OpenShell サンドボックスへ同期します。
    - `exec` の後に、OpenClaw はリモートワークスペースをローカルワークスペースへ同期し戻します。
    - ファイルツールは引き続きサンドボックスブリッジ経由で動作しますが、ターン間ではローカルワークスペースが信頼できる情報源のままです。

    次の場合に使用します。

    - OpenClaw の外側でローカルにファイルを編集し、その変更をサンドボックスに自動的に反映したい
    - OpenShell サンドボックスを Docker バックエンドにできるだけ近い形で動作させたい
    - 各 exec ターンの後に、ホストワークスペースへサンドボックスでの書き込みを反映したい

    トレードオフ: exec の前後で追加の同期コストが発生します。

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    **OpenShell ワークスペースを正規のワークスペースにする**場合は、`plugins.entries.openshell.config.mode: "remote"` を使用します。

    動作:

    - サンドボックスが最初に作成されるとき、OpenClaw はローカルワークスペースからリモートワークスペースへ一度だけシードします。
    - その後、`exec`、`read`、`write`、`edit`、`apply_patch` はリモート OpenShell ワークスペースに対して直接動作します。
    - OpenClaw は、exec 後にリモートの変更をローカルワークスペースへ同期し戻し**ません**。
    - プロンプト時のメディア読み取りは引き続き機能します。ファイルツールとメディアツールはローカルホストパスを前提にせず、サンドボックスブリッジ経由で読み取るためです。
    - トランスポートは、`openshell sandbox ssh-config` が返す OpenShell サンドボックスへの SSH です。

    重要な影響:

    - シード手順の後に OpenClaw の外側でホスト上のファイルを編集しても、リモートサンドボックスはその変更を自動的には認識し**ません**。
    - サンドボックスが再作成されると、リモートワークスペースはローカルワークスペースから再度シードされます。
    - `scope: "agent"` または `scope: "shared"` では、そのリモートワークスペースが同じスコープで共有されます。

    次の場合に使用します。

    - サンドボックスを主にリモート OpenShell 側で動作させるべき場合
    - ターンごとの同期オーバーヘッドを下げたい
    - ホストローカルの編集によってリモートサンドボックス状態が暗黙に上書きされることを避けたい

  </Tab>
</Tabs>

サンドボックスを一時的な実行環境と考える場合は `mirror` を選択します。サンドボックスを実際のワークスペースと考える場合は `remote` を選択します。

#### OpenShell ライフサイクル

OpenShell サンドボックスは、通常のサンドボックスライフサイクルを通じて引き続き管理されます。

- `openclaw sandbox list` は Docker ランタイムだけでなく OpenShell ランタイムも表示します
- `openclaw sandbox recreate` は現在のランタイムを削除し、次回使用時に OpenClaw が再作成できるようにします
- prune ロジックもバックエンドを認識します

`remote` モードでは、再作成が特に重要です。

- 再作成により、そのスコープの正規リモートワークスペースが削除されます
- 次回使用時に、ローカルワークスペースから新しいリモートワークスペースがシードされます

`mirror` モードでは、ローカルワークスペースがいずれにせよ正規のままなので、再作成は主にリモート実行環境をリセットします。

## ワークスペースアクセス

`agents.defaults.sandbox.workspaceAccess` は、**サンドボックスが何を参照できるか**を制御します。

<Tabs>
  <Tab title="none (default)">
    ツールは `~/.openclaw/sandboxes` 配下のサンドボックスワークスペースを参照します。
  </Tab>
  <Tab title="ro">
    エージェントワークスペースを読み取り専用で `/agent` にマウントします（`write`/`edit`/`apply_patch` を無効にします）。
  </Tab>
  <Tab title="rw">
    エージェントワークスペースを読み書き可能で `/workspace` にマウントします。
  </Tab>
</Tabs>

OpenShell バックエンドでは次のようになります。

- `mirror` モードでは、exec ターン間の正規ソースとして引き続きローカルワークスペースを使用します
- `remote` モードでは、初回シード後の正規ソースとしてリモート OpenShell ワークスペースを使用します
- `workspaceAccess: "ro"` と `"none"` は、引き続き同じ方法で書き込み動作を制限します

受信メディアはアクティブなサンドボックスワークスペース（`media/inbound/*`）へコピーされます。

<Note>
**Skills に関する注記:** `read` ツールはサンドボックスルート基準です。`workspaceAccess: "none"` では、OpenClaw は対象の Skills をサンドボックスワークスペース（`.../skills`）へミラーリングし、読み取り可能にします。`"rw"` では、ワークスペースの Skills は `/workspace/skills` から読み取れます。
</Note>

## カスタムバインドマウント

`agents.defaults.sandbox.docker.binds` は追加のホストディレクトリをコンテナへマウントします。形式: `host:container:mode`（例: `"/home/user/source:/source:rw"`）。

グローバルバインドとエージェントごとのバインドは**マージ**されます（置き換えられません）。`scope: "shared"` では、エージェントごとのバインドは無視されます。

`agents.defaults.sandbox.browser.binds` は追加のホストディレクトリを**サンドボックスブラウザ**コンテナにのみマウントします。

- 設定されている場合（`[]` を含む）、ブラウザコンテナでは `agents.defaults.sandbox.docker.binds` を置き換えます。
- 省略された場合、ブラウザコンテナは `agents.defaults.sandbox.docker.binds` にフォールバックします（後方互換）。

例（読み取り専用ソース + 追加データディレクトリ）:

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
- OpenClaw は危険なバインドソースをブロックします（例: `docker.sock`、`/etc`、`/proc`、`/sys`、`/dev`、およびそれらを公開してしまう親マウント）。
- OpenClaw は、`~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm`、`~/.ssh` など、一般的なホームディレクトリ内の認証情報ルートもブロックします。
- バインド検証は単なる文字列照合ではありません。OpenClaw はソースパスを正規化し、ブロック済みパスと許可済みルートを再チェックする前に、最も深い既存の祖先を通じて再度解決します。
- つまり、最終リーフがまだ存在しない場合でも、シンボリックリンク親による脱出は閉じた状態で失敗します。例: `run-link` がそこを指している場合、`/workspace/run-link/new-file` は引き続き `/var/run/...` として解決されます。
- 許可されたソースルートも同じ方法で正規化されるため、シンボリックリンク解決前には許可リスト内に見えるだけのパスも、`outside allowed roots` として拒否されます。
- 機密性の高いマウント（シークレット、SSH キー、サービス認証情報）は、絶対に必要でない限り `:ro` にするべきです。
- ワークスペースへの読み取りアクセスだけが必要な場合は、`workspaceAccess: "ro"` と組み合わせます。バインドモードは独立したままです。
- バインドがツールポリシーおよび昇格 exec とどのように相互作用するかについては、[サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

</Warning>

## イメージとセットアップ

デフォルト Docker イメージ: `openclaw-sandbox:bookworm-slim`

<Note>
**ソースチェックアウト vs npm インストール**

`scripts/sandbox-setup.sh`、`scripts/sandbox-common-setup.sh`、`scripts/sandbox-browser-setup.sh` ヘルパースクリプトは、[ソースチェックアウト](https://github.com/openclaw/openclaw) から実行している場合にのみ利用できます。npm パッケージには含まれていません。

`npm install -g openclaw` で OpenClaw をインストールした場合は、代わりに以下に示すインライン `docker build` コマンドを使用してください。
</Note>

<Steps>
  <Step title="Build the default image">
    ソースチェックアウトから:

    ```bash
    scripts/sandbox-setup.sh
    ```

    npm インストールから（ソースチェックアウト不要）:

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

    デフォルトイメージには Node は含まれていません。Skill が Node（または他のランタイム）を必要とする場合は、カスタムイメージに組み込むか、`sandbox.docker.setupCommand` でインストールします（ネットワーク送信 + 書き込み可能なルート + root ユーザーが必要）。

    `openclaw-sandbox:bookworm-slim` が存在しない場合、OpenClaw は通常の `debian:bookworm-slim` に暗黙に置き換えません。デフォルトイメージを対象にするサンドボックス実行は、ビルドするまでビルド手順を示して即座に失敗します。これは、同梱イメージがサンドボックスの書き込み/編集ヘルパー用に `python3` を含むためです。

  </Step>
  <Step title="Optional: build the common image">
    一般的なツール（例: `curl`、`jq`、`nodejs`、`python3`、`git`）を含む、より機能的なサンドボックスイメージが必要な場合:

    ソースチェックアウトから:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    npm インストールからの場合は、まずデフォルトイメージをビルドし（上記参照）、その後リポジトリの [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) を使用して、その上に common イメージをビルドします。

    その後、`agents.defaults.sandbox.docker.image` を `openclaw-sandbox-common:bookworm-slim` に設定します。

  </Step>
  <Step title="Optional: build the sandbox browser image">
    ソースチェックアウトから:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    npm インストールからの場合は、リポジトリの [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) を使用してビルドします。

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
    - 3 つのグラフィックス強化フラグ（`--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu`）は任意で、コンテナが GPU サポートを持たない場合に有用です。ワークロードで WebGL や他の 3D/ブラウザ機能が必要な場合は、`OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` を設定します。
    - `--disable-extensions` はデフォルトで有効であり、拡張機能に依存するフローでは `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で無効にできます。
    - `--renderer-process-limit=2` は `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` によって制御され、`0` は Chromium のデフォルトを維持します。

    別のランタイムプロファイルが必要な場合は、カスタムブラウザイメージを使用し、独自のエントリポイントを指定してください。ローカル（非コンテナ）Chromium プロファイルでは、`browser.extraArgs` を使用して追加の起動フラグを付加します。

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` はブロックされます。
    - `network: "container:<id>"` はデフォルトでブロックされます（名前空間参加による迂回リスク）。
    - 緊急回避の上書き: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker インストールとコンテナ化された Gateway についてはこちらを参照してください: [Docker](/ja-JP/install/docker)

Docker Gateway デプロイでは、`scripts/docker/setup.sh` がサンドボックス設定をブートストラップできます。その経路を有効にするには、`OPENCLAW_SANDBOX=1`（または `true`/`yes`/`on`）を設定します。ソケットの場所は `OPENCLAW_DOCKER_SOCKET` で上書きできます。完全なセットアップと環境変数リファレンス: [Docker](/ja-JP/install/docker#agent-sandbox)。

## setupCommand（一度限りのコンテナセットアップ）

`setupCommand` は、サンドボックスコンテナが作成された後に**一度だけ**実行されます（毎回の実行時ではありません）。コンテナ内で `sh -lc` 経由で実行されます。

パス:

- グローバル: `agents.defaults.sandbox.docker.setupCommand`
- エージェントごと: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="よくある落とし穴">
    - デフォルトの `docker.network` は `"none"` (外部通信なし) のため、パッケージのインストールは失敗します。
    - `docker.network: "container:<id>"` には `dangerouslyAllowContainerNamespaceJoin: true` が必要で、非常時のみ使用します。
    - `readOnlyRoot: true` は書き込みを防ぎます。`readOnlyRoot: false` を設定するか、カスタムイメージに組み込んでください。
    - パッケージのインストールには `user` が root である必要があります (`user` を省略するか、`user: "0:0"` を設定します)。
    - サンドボックスの exec はホストの `process.env` を継承**しません**。Skill の API キーには `agents.defaults.sandbox.docker.env` (またはカスタムイメージ) を使用してください。

  </Accordion>
</AccordionGroup>

## ツールポリシーと回避手段

ツールの許可/拒否ポリシーは、サンドボックスルールより前に引き続き適用されます。ツールがグローバルまたはエージェント単位で拒否されている場合、サンドボックス化しても再び使えるようにはなりません。

`tools.elevated` は、サンドボックス外で `exec` を実行する明示的な回避手段です (デフォルトは `gateway`、exec 対象が `node` の場合は `node`)。`/exec` ディレクティブは、認可された送信者にのみ適用され、セッションごとに永続化されます。`exec` を完全に無効化するには、ツールポリシーの deny を使用してください ([Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照)。

デバッグ:

- 有効なサンドボックスモード、ツールポリシー、修正用の設定キーを調べるには、`openclaw sandbox explain` を使用します。
- 「なぜこれがブロックされるのか？」という考え方については、[Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

厳格にロックダウンした状態を維持してください。

## マルチエージェントのオーバーライド

各エージェントは、サンドボックスとツールをオーバーライドできます: `agents.list[].sandbox` と `agents.list[].tools` (さらにサンドボックスツールポリシー用の `agents.list[].tools.sandbox.tools`)。優先順位については、[Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

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

- [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) — エージェントごとのオーバーライドと優先順位
- [OpenShell](/ja-JP/gateway/openshell) — 管理されたサンドボックスバックエンドのセットアップ、ワークスペースモード、設定リファレンス
- [サンドボックス設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) — 「なぜこれがブロックされるのか？」のデバッグ
- [セキュリティ](/ja-JP/gateway/security)
