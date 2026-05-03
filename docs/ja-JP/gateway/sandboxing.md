---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClaw のサンドボックス化の仕組み: モード、スコープ、ワークスペースアクセス、画像'
title: サンドボックス化
x-i18n:
    generated_at: "2026-05-03T21:33:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: e887d07ed84d582bb605c75f841499b6bed42cfc94d60690aba33c2f351b272b
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw は、影響範囲を抑えるために **サンドボックスバックエンド内でツール**を実行できます。これは**任意**で、設定（`agents.defaults.sandbox` または `agents.list[].sandbox`）によって制御されます。サンドボックス化がオフの場合、ツールはホスト上で実行されます。Gateway はホスト上に留まり、ツール実行は有効時に隔離されたサンドボックス内で実行されます。

<Note>
これは完全なセキュリティ境界ではありませんが、モデルが不適切な動作をした場合のファイルシステムとプロセスへのアクセスを実質的に制限します。
</Note>

## サンドボックス化されるもの

- ツール実行（`exec`, `read`, `write`, `edit`, `apply_patch`, `process` など）。
- 任意のサンドボックス化ブラウザー（`agents.defaults.sandbox.browser`）。

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - デフォルトでは、ブラウザーツールが必要とするときにサンドボックスブラウザーが自動起動します（CDP に到達可能であることを保証します）。`agents.defaults.sandbox.browser.autoStart` と `agents.defaults.sandbox.browser.autoStartTimeoutMs` で設定します。
    - デフォルトでは、サンドボックスブラウザーコンテナはグローバルな `bridge` ネットワークではなく、専用の Docker ネットワーク（`openclaw-sandbox-browser`）を使用します。`agents.defaults.sandbox.browser.network` で設定します。
    - 任意の `agents.defaults.sandbox.browser.cdpSourceRange` は、CIDR 許可リスト（例: `172.21.0.1/32`）でコンテナ境界の CDP 受信を制限します。
    - noVNC の監視アクセスはデフォルトでパスワード保護されています。OpenClaw は短命のトークン URL を発行し、ローカルのブートストラップページを提供して、パスワードを URL フラグメント（クエリ/ヘッダーログではありません）に入れて noVNC を開きます。
    - `agents.defaults.sandbox.browser.allowHostControl` により、サンドボックス化されたセッションがホストブラウザーを明示的に対象にできます。
    - 任意の許可リストが `target: "custom"` を制御します: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`。

  </Accordion>
</AccordionGroup>

サンドボックス化されないもの:

- Gateway プロセス自体。
- サンドボックス外での実行が明示的に許可された任意のツール（例: `tools.elevated`）。
  - **Elevated exec はサンドボックス化を迂回し、設定されたエスケープパス（デフォルトは `gateway`、exec 対象が `node` の場合は `node`）を使用します。**
  - サンドボックス化がオフの場合、`tools.elevated` は実行を変更しません（すでにホスト上です）。[Elevated Mode](/ja-JP/tools/elevated) を参照してください。

## モード

`agents.defaults.sandbox.mode` は、サンドボックス化を**いつ**使用するかを制御します:

<Tabs>
  <Tab title="off">
    サンドボックス化しません。
  </Tab>
  <Tab title="non-main">
    **非メイン**セッションのみをサンドボックス化します（通常のチャットをホスト上で行いたい場合のデフォルト）。

    `"non-main"` はエージェント ID ではなく `session.mainKey`（デフォルトは `"main"`）に基づきます。グループ/チャンネルセッションは独自のキーを使うため、非メインとして扱われ、サンドボックス化されます。

  </Tab>
  <Tab title="all">
    すべてのセッションがサンドボックス内で実行されます。
  </Tab>
</Tabs>

## スコープ

`agents.defaults.sandbox.scope` は、作成される**コンテナ数**を制御します:

- `"agent"`（デフォルト）: エージェントごとに 1 つのコンテナ。
- `"session"`: セッションごとに 1 つのコンテナ。
- `"shared"`: すべてのサンドボックス化されたセッションで 1 つのコンテナを共有。

## バックエンド

`agents.defaults.sandbox.backend` は、サンドボックスを提供する**ランタイム**を制御します:

- `"docker"`（サンドボックス化が有効な場合のデフォルト）: ローカルの Docker バックエンドのサンドボックスランタイム。
- `"ssh"`: 汎用 SSH バックエンドのリモートサンドボックスランタイム。
- `"openshell"`: OpenShell バックエンドのサンドボックスランタイム。

SSH 固有の設定は `agents.defaults.sandbox.ssh` 配下にあります。OpenShell 固有の設定は `plugins.entries.openshell.config` 配下にあります。

### バックエンドの選択

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **実行場所**   | ローカルコンテナ                  | SSH でアクセス可能な任意のホスト        | OpenShell 管理のサンドボックス                           |
| **セットアップ**           | `scripts/sandbox-setup.sh`       | SSH キー + 対象ホスト          | OpenShell Plugin が有効                            |
| **ワークスペースモデル** | バインドマウントまたはコピー               | リモート正準（一度シード）   | `mirror` または `remote`                                |
| **ネットワーク制御** | `docker.network`（デフォルト: なし） | リモートホストに依存         | OpenShell に依存                                |
| **ブラウザーサンドボックス** | 対応                        | 非対応                  | まだ非対応                                   |
| **バインドマウント**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **最適な用途**        | ローカル開発、完全な隔離        | リモートマシンへのオフロード | 任意の双方向同期を備えた管理型リモートサンドボックス |

### Docker バックエンド

サンドボックス化はデフォルトでオフです。サンドボックス化を有効にし、バックエンドを選択しない場合、OpenClaw は Docker バックエンドを使用します。Docker デーモンソケット（`/var/run/docker.sock`）経由で、ツールとサンドボックスブラウザーをローカルで実行します。サンドボックスコンテナの隔離は Docker 名前空間によって決まります。

ホスト GPU を Docker サンドボックスに公開するには、`agents.defaults.sandbox.docker.gpus` またはエージェントごとの `agents.list[].sandbox.docker.gpus` オーバーライドを設定します。この値は Docker の `--gpus` フラグに個別の引数として渡されます。たとえば `"all"` や `"device=GPU-uuid"` であり、NVIDIA Container Toolkit などの互換性のあるホストランタイムが必要です。

<Warning>
**Docker-out-of-Docker (DooD) の制約**

OpenClaw Gateway 自体を Docker コンテナとしてデプロイする場合、ホストの Docker ソケット（DooD）を使って兄弟サンドボックスコンテナをオーケストレーションします。これには特定のパスマッピング制約があります:

- **設定にはホストパスが必要**: `openclaw.json` の `workspace` 設定には、内部 Gateway コンテナパスではなく、**ホストの絶対パス**（例: `/home/user/.openclaw/workspaces`）を含める必要があります。OpenClaw が Docker デーモンにサンドボックスの生成を要求すると、デーモンは Gateway 名前空間ではなくホスト OS 名前空間を基準にパスを評価します。
- **FS ブリッジの同等性（同一のボリュームマップ）**: OpenClaw Gateway のネイティブプロセスも、`workspace` ディレクトリに Heartbeat とブリッジファイルを書き込みます。Gateway は自身のコンテナ化環境内からまったく同じ文字列（ホストパス）を評価するため、Gateway デプロイにはホスト名前空間をネイティブに結び付ける同一のボリュームマップ（`-v /home/user/.openclaw:/home/user/.openclaw`）を含める必要があります。

絶対ホストパスの同等性なしに内部的にパスをマップすると、完全修飾パス文字列がネイティブには存在しないため、OpenClaw はコンテナ環境内で Heartbeat の書き込みを試みて、ネイティブに `EACCES` 権限エラーをスローします。
</Warning>

### SSH バックエンド

任意の SSH でアクセス可能なマシン上で、OpenClaw に `exec`、ファイルツール、メディア読み取りをサンドボックス化させたい場合は `backend: "ssh"` を使用します。

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
    - OpenClaw は `sandbox.ssh.workspaceRoot` 配下にスコープごとのリモートルートを作成します。
    - 作成または再作成後の初回使用時に、OpenClaw はローカルワークスペースからそのリモートワークスペースへ一度シードします。
    - その後、`exec`、`read`、`write`、`edit`、`apply_patch`、プロンプトメディア読み取り、受信メディアのステージングは、SSH 経由でリモートワークスペースに直接対して実行されます。
    - OpenClaw はリモートの変更をローカルワークスペースへ自動的には同期しません。

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`、`certificateFile`、`knownHostsFile`: 既存のローカルファイルを使用し、OpenSSH 設定経由で渡します。
    - `identityData`、`certificateData`、`knownHostsData`: インライン文字列または SecretRefs を使用します。OpenClaw は通常のシークレットランタイムスナップショットを通じてそれらを解決し、`0600` の一時ファイルへ書き込み、SSH セッション終了時に削除します。
    - 同じ項目に `*File` と `*Data` の両方が設定されている場合、その SSH セッションでは `*Data` が優先されます。

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    これは**リモート正準**モデルです。初期シード後、リモート SSH ワークスペースが実際のサンドボックス状態になります。

    - シード手順の後に OpenClaw の外で行われたホストローカルの編集は、サンドボックスを再作成するまでリモートには表示されません。
    - `openclaw sandbox recreate` はスコープごとのリモートルートを削除し、次回使用時にローカルから再度シードします。
    - SSH バックエンドではブラウザーサンドボックス化はサポートされていません。
    - `sandbox.docker.*` 設定は SSH バックエンドには適用されません。

  </Accordion>
</AccordionGroup>

### OpenShell バックエンド

OpenShell 管理のリモート環境で OpenClaw にツールをサンドボックス化させたい場合は `backend: "openshell"` を使用します。完全なセットアップガイド、設定リファレンス、ワークスペースモードの比較については、専用の [OpenShell ページ](/ja-JP/gateway/openshell) を参照してください。

OpenShell は汎用 SSH バックエンドと同じコア SSH トランスポートおよびリモートファイルシステムブリッジを再利用し、OpenShell 固有のライフサイクル（`sandbox create/get/delete`, `sandbox ssh-config`）と任意の `mirror` ワークスペースモードを追加します。

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
- `remote`: サンドボックス作成後は OpenShell ワークスペースが正準になります。OpenClaw はローカルワークスペースからリモートワークスペースへ一度シードし、その後ファイルツールと exec は、変更を同期して戻すことなくリモートサンドボックスに直接対して実行されます。

<AccordionGroup>
  <Accordion title="Remote transport details">
    - OpenClaw は `openshell sandbox ssh-config <name>` 経由で、サンドボックス固有の SSH 設定を OpenShell に要求します。
    - コアはその SSH 設定を一時ファイルに書き込み、SSH セッションを開き、`backend: "ssh"` で使用されるものと同じリモートファイルシステムブリッジを再利用します。
    - `mirror` モードではライフサイクルのみが異なります。exec の前にローカルからリモートへ同期し、その後 exec の後に同期して戻します。

  </Accordion>
  <Accordion title="Current OpenShell limitations">
    - サンドボックスブラウザーはまだサポートされていません
    - OpenShell バックエンドでは `sandbox.docker.binds` はサポートされていません
    - `sandbox.docker.*` 配下の Docker 固有のランタイムノブは、引き続き Docker バックエンドにのみ適用されます

  </Accordion>
</AccordionGroup>

#### ワークスペースモード

OpenShell には 2 つのワークスペースモデルがあります。これは実務上もっとも重要な部分です。

<Tabs>
  <Tab title="mirror (local canonical)">
    **ローカルワークスペースを正準のままにしたい**場合は `plugins.entries.openshell.config.mode: "mirror"` を使用します。

    動作:

    - `exec` の前に、OpenClaw はローカルワークスペースを OpenShell サンドボックスへ同期します。
    - `exec` の後に、OpenClaw はリモートワークスペースをローカルワークスペースへ同期して戻します。
    - ファイルツールは引き続きサンドボックスブリッジを通じて動作しますが、ターン間ではローカルワークスペースが信頼できる情報源のままです。

    次の場合に使用します:

    - OpenClaw の外部でローカルにファイルを編集し、その変更をサンドボックスに自動的に反映したい
    - OpenShell サンドボックスを可能な限り Docker バックエンドに近い動作にしたい
    - 各 exec ターンの後に、ホストワークスペースへサンドボックスの書き込みを反映したい

    トレードオフ: exec の前後で追加の同期コストが発生します。

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    **OpenShell ワークスペースを正本にしたい**場合は、`plugins.entries.openshell.config.mode: "remote"` を使用します。

    動作:

    - サンドボックスが最初に作成されるとき、OpenClaw はローカルワークスペースからリモートワークスペースへ一度だけシードします。
    - その後、`exec`、`read`、`write`、`edit`、`apply_patch` はリモート OpenShell ワークスペースに対して直接動作します。
    - OpenClaw は exec 後にリモートの変更をローカルワークスペースへ同期しません。
    - プロンプト時のメディア読み取りは引き続き動作します。ファイルツールとメディアツールはローカルホストパスを仮定するのではなく、サンドボックスブリッジ経由で読み取るためです。
    - トランスポートは、`openshell sandbox ssh-config` によって返される OpenShell サンドボックスへの SSH です。

    重要な影響:

    - シード手順の後に OpenClaw の外部でホスト上のファイルを編集しても、リモートサンドボックスはそれらの変更を自動的には認識しません。
    - サンドボックスが再作成されると、リモートワークスペースはローカルワークスペースから再びシードされます。
    - `scope: "agent"` または `scope: "shared"` では、そのリモートワークスペースは同じスコープで共有されます。

    次の場合に使用します:

    - サンドボックスを主にリモート OpenShell 側で動かしたい
    - ターンごとの同期オーバーヘッドを下げたい
    - ホストローカルの編集によってリモートサンドボックス状態が暗黙に上書きされるのを避けたい

  </Tab>
</Tabs>

サンドボックスを一時的な実行環境と考える場合は `mirror` を選びます。サンドボックスを実際のワークスペースと考える場合は `remote` を選びます。

#### OpenShell ライフサイクル

OpenShell サンドボックスは、通常のサンドボックスライフサイクルを通じて引き続き管理されます:

- `openclaw sandbox list` は OpenShell ランタイムと Docker ランタイムの両方を表示します
- `openclaw sandbox recreate` は現在のランタイムを削除し、次回使用時に OpenClaw が再作成できるようにします
- prune ロジックもバックエンドを認識します

`remote` モードでは、再作成が特に重要です:

- 再作成は、そのスコープの正本であるリモートワークスペースを削除します
- 次回使用時に、ローカルワークスペースから新しいリモートワークスペースがシードされます

`mirror` モードでは、ローカルワークスペースがいずれにしても正本のままなので、再作成は主にリモート実行環境をリセットします。

## ワークスペースアクセス

`agents.defaults.sandbox.workspaceAccess` は、**サンドボックスが何を見られるか**を制御します:

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

OpenShell バックエンドでは:

- `mirror` モードは、exec ターン間の正本ソースとして引き続きローカルワークスペースを使用します
- `remote` モードは、初期シード後の正本ソースとしてリモート OpenShell ワークスペースを使用します
- `workspaceAccess: "ro"` と `"none"` は、同じ方法で書き込み動作を引き続き制限します

受信メディアは、アクティブなサンドボックスワークスペース（`media/inbound/*`）にコピーされます。

<Note>
**Skills に関する注記:** `read` ツールはサンドボックスルート基準です。`workspaceAccess: "none"` では、OpenClaw は対象の Skills をサンドボックスワークスペース（`.../skills`）にミラーするため、それらを読み取れます。`"rw"` では、ワークスペースの Skills は `/workspace/skills` から読み取れます。
</Note>

## カスタムバインドマウント

`agents.defaults.sandbox.docker.binds` は、追加のホストディレクトリをコンテナにマウントします。形式: `host:container:mode`（例: `"/home/user/source:/source:rw"`）。

グローバルバインドとエージェントごとのバインドは**マージ**されます（置き換えではありません）。`scope: "shared"` では、エージェントごとのバインドは無視されます。

`agents.defaults.sandbox.browser.binds` は、追加のホストディレクトリを**サンドボックスブラウザー**コンテナだけにマウントします。

- 設定されている場合（`[]` を含む）、ブラウザーコンテナについて `agents.defaults.sandbox.docker.binds` を置き換えます。
- 省略された場合、ブラウザーコンテナは `agents.defaults.sandbox.docker.binds` にフォールバックします（後方互換）。

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

- バインドはサンドボックスファイルシステムをバイパスします。設定したモード（`:ro` または `:rw`）でホストパスを公開します。
- OpenClaw は危険なバインド元をブロックします（例: `docker.sock`、`/etc`、`/proc`、`/sys`、`/dev`、およびそれらを公開する親マウント）。
- OpenClaw は、`~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm`、`~/.ssh` など、一般的なホームディレクトリ内の認証情報ルートもブロックします。
- バインド検証は単なる文字列照合ではありません。OpenClaw はソースパスを正規化し、ブロック対象パスと許可ルートを再チェックする前に、存在する最も深い祖先を通じて再度解決します。
- つまり、最終的なリーフがまだ存在しない場合でも、シンボリックリンク親による脱出は失敗として閉じられます。例: `run-link` がそこを指している場合、`/workspace/run-link/new-file` は引き続き `/var/run/...` として解決されます。
- 許可されたソースルートも同じ方法で正規化されるため、シンボリックリンク解決前にだけ許可リスト内に見えるパスも、`outside allowed roots` として拒否されます。
- 機密性の高いマウント（シークレット、SSH キー、サービス認証情報）は、絶対に必要でない限り `:ro` にする必要があります。
- ワークスペースへの読み取りアクセスだけが必要な場合は、`workspaceAccess: "ro"` と組み合わせます。バインドモードは独立したままです。
- バインドがツールポリシーおよび昇格 exec とどのように相互作用するかについては、[サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

</Warning>

## イメージとセットアップ

既定の Docker イメージ: `openclaw-sandbox:bookworm-slim`

<Note>
**ソースチェックアウト vs npm インストール**

`scripts/sandbox-setup.sh`、`scripts/sandbox-common-setup.sh`、`scripts/sandbox-browser-setup.sh` ヘルパースクリプトは、[ソースチェックアウト](https://github.com/openclaw/openclaw) から実行している場合にのみ利用できます。npm パッケージには含まれていません。

`npm install -g openclaw` で OpenClaw をインストールした場合は、代わりに以下に示すインラインの `docker build` コマンドを使用してください。
</Note>

<Steps>
  <Step title="Build the default image">
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

    既定のイメージには Node は含まれていません。Skill が Node（またはその他のランタイム）を必要とする場合は、カスタムイメージに組み込むか、`sandbox.docker.setupCommand` 経由でインストールします（ネットワーク送信 + 書き込み可能なルート + root ユーザーが必要）。

    `openclaw-sandbox:bookworm-slim` が見つからない場合でも、OpenClaw はプレーンな `debian:bookworm-slim` に暗黙に置き換えません。既定のイメージを対象にするサンドボックス実行は、そのイメージをビルドするまでビルド手順を表示して即座に失敗します。これは、同梱イメージがサンドボックスの write/edit ヘルパー用に `python3` を含んでいるためです。

  </Step>
  <Step title="Optional: build the common image">
    一般的なツール（たとえば `curl`、`jq`、`nodejs`、`python3`、`git`）を含む、より機能的なサンドボックスイメージを使う場合:

    ソースチェックアウトから:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    npm インストールからは、まず既定のイメージをビルドし（上記参照）、次にリポジトリの [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) を使って、その上に common イメージをビルドします。

    その後、`agents.defaults.sandbox.docker.image` を `openclaw-sandbox-common:bookworm-slim` に設定します。

  </Step>
  <Step title="Optional: build the sandbox browser image">
    ソースチェックアウトから:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    npm インストールからは、リポジトリの [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) を使用してビルドします。

  </Step>
</Steps>

既定では、Docker サンドボックスコンテナは**ネットワークなし**で実行されます。`agents.defaults.sandbox.docker.network` で上書きできます。

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    同梱のサンドボックスブラウザーイメージは、コンテナ化されたワークロード向けに保守的な Chromium 起動既定値も適用します。現在のコンテナ既定値には次が含まれます:

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
    - 3 つのグラフィックス強化フラグ（`--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu`）は任意で、コンテナに GPU サポートがない場合に有用です。ワークロードが WebGL またはその他の 3D/ブラウザー機能を必要とする場合は、`OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` を設定してください。
    - `--disable-extensions` は既定で有効で、拡張機能に依存するフローでは `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で無効化できます。
    - `--renderer-process-limit=2` は `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` によって制御され、`0` は Chromium の既定値を維持します。

    別のランタイムプロファイルが必要な場合は、カスタムブラウザーイメージを使用し、独自のエントリーポイントを指定します。ローカル（非コンテナ）の Chromium プロファイルでは、追加の起動フラグを付加するために `browser.extraArgs` を使用します。

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` はブロックされます。
    - `network: "container:<id>"` は既定でブロックされます（名前空間参加のバイパスリスク）。
    - 緊急時の上書き: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker インストールとコンテナ化された Gateway はこちらにあります: [Docker](/ja-JP/install/docker)

Docker Gateway デプロイでは、`scripts/docker/setup.sh` でサンドボックス設定をブートストラップできます。そのパスを有効にするには、`OPENCLAW_SANDBOX=1`（または `true`/`yes`/`on`）を設定します。`OPENCLAW_DOCKER_SOCKET` でソケットの場所を上書きできます。完全なセットアップと環境変数リファレンス: [Docker](/ja-JP/install/docker#agent-sandbox)。

## setupCommand（一度だけのコンテナセットアップ）

`setupCommand` は、サンドボックスコンテナの作成後に**一度だけ**実行されます（毎回の実行時ではありません）。コンテナ内で `sh -lc` 経由で実行されます。

パス:

- グローバル: `agents.defaults.sandbox.docker.setupCommand`
- エージェントごと: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="よくある落とし穴">
    - デフォルトの `docker.network` は `"none"`（外向き通信なし）なので、パッケージのインストールは失敗します。
    - `docker.network: "container:<id>"` には `dangerouslyAllowContainerNamespaceJoin: true` が必要で、緊急時専用です。
    - `readOnlyRoot: true` は書き込みを防ぎます。`readOnlyRoot: false` を設定するか、カスタムイメージを作成してください。
    - パッケージのインストールでは、`user` は root である必要があります（`user` を省略するか、`user: "0:0"` を設定します）。
    - サンドボックスの exec はホストの `process.env` を**継承しません**。Skill の API キーには `agents.defaults.sandbox.docker.env`（またはカスタムイメージ）を使用してください。

  </Accordion>
</AccordionGroup>

## ツールポリシーとエスケープハッチ

ツールの許可/拒否ポリシーは、サンドボックスルールより先に適用されます。ツールがグローバルまたは agent 単位で拒否されている場合、サンドボックス化してもそのツールは戻りません。

`tools.elevated` は、サンドボックス外で `exec` を実行する明示的なエスケープハッチです（デフォルトは `gateway`、exec ターゲットが `node` の場合は `node`）。`/exec` ディレクティブは承認済み送信者にのみ適用され、セッションごとに保持されます。`exec` を完全に無効化するには、ツールポリシーの拒否を使用してください（[サンドボックス vs ツールポリシー vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照）。

デバッグ:

- 有効なサンドボックスモード、ツールポリシー、修正用の設定キーを確認するには、`openclaw sandbox explain` を使用します。
- 「なぜこれがブロックされるのか？」の考え方については、[サンドボックス vs ツールポリシー vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

ロックダウンした状態を維持してください。

## マルチ agent のオーバーライド

各 agent はサンドボックスとツールをオーバーライドできます: `agents.list[].sandbox` と `agents.list[].tools`（さらにサンドボックスツールポリシー用の `agents.list[].tools.sandbox.tools`）。優先順位については、[マルチ Agent サンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

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

- [マルチ Agent サンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) — agent 単位のオーバーライドと優先順位
- [OpenShell](/ja-JP/gateway/openshell) — 管理対象サンドボックスバックエンドのセットアップ、ワークスペースモード、設定リファレンス
- [サンドボックス設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- [サンドボックス vs ツールポリシー vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) — 「なぜこれがブロックされるのか？」のデバッグ
- [セキュリティ](/ja-JP/gateway/security)
