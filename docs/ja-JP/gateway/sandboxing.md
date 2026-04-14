---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: OpenClaw のサンドボックス化の仕組み：モード、スコープ、ワークスペースアクセス、画像
title: サンドボックス化
x-i18n:
    generated_at: "2026-04-14T02:08:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2573d0d7462f63a68eb1750e5432211522ff5b42989a17379d3e188468bbce52
    source_path: gateway/sandboxing.md
    workflow: 15
---

# サンドボックス化

OpenClaw は、影響範囲を小さくするために**サンドボックスバックエンド内でツールを実行**できます。
これは**任意**であり、設定（`agents.defaults.sandbox` または
`agents.list[].sandbox`）によって制御されます。サンドボックス化がオフの場合、ツールはホスト上で実行されます。
Gateway はホスト上に残り、ツール実行は有効時に
分離されたサンドボックス内で実行されます。

これは完璧なセキュリティ境界ではありませんが、モデルが何かまずいことをした場合でも、
ファイルシステムやプロセスへのアクセスを大幅に制限します。

## サンドボックス化されるもの

- ツール実行（`exec`, `read`, `write`, `edit`, `apply_patch`, `process` など）。
- 任意のサンドボックス化されたブラウザ（`agents.defaults.sandbox.browser`）。
  - デフォルトでは、ブラウザツールが必要としたときにサンドボックスブラウザが自動起動し（CDP に到達できることを保証）、使用可能になります。
    `agents.defaults.sandbox.browser.autoStart` と `agents.defaults.sandbox.browser.autoStartTimeoutMs` で設定します。
  - デフォルトでは、サンドボックスブラウザコンテナはグローバルな `bridge` ネットワークではなく、専用の Docker ネットワーク（`openclaw-sandbox-browser`）を使います。
    `agents.defaults.sandbox.browser.network` で設定します。
  - 任意の `agents.defaults.sandbox.browser.cdpSourceRange` は、CIDR 許可リスト（たとえば `172.21.0.1/32`）でコンテナ境界の CDP 受信元を制限します。
  - noVNC のオブザーバーアクセスはデフォルトでパスワード保護されます。OpenClaw は短時間だけ有効なトークン URL を出力し、ローカルのブートストラップページを提供して、URL フラグメント内のパスワード付きで noVNC を開きます（クエリやヘッダーログには残りません）。
  - `agents.defaults.sandbox.browser.allowHostControl` を使うと、サンドボックス化されたセッションが明示的にホストブラウザを対象にできます。
  - 任意の許可リストで `target: "custom"` を制御できます: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`。

サンドボックス化されないもの:

- Gateway プロセス自体。
- 明示的にサンドボックス外での実行が許可されたツール（例: `tools.elevated`）。
  - **Elevated exec はサンドボックス化をバイパスし、設定されたエスケープパス（デフォルトでは `gateway`、exec ターゲットが `node` の場合は `node`）を使います。**
  - サンドボックス化がオフの場合、`tools.elevated` は実行を変更しません（すでにホスト上で実行されています）。[Elevated Mode](/ja-JP/tools/elevated) を参照してください。

## モード

`agents.defaults.sandbox.mode` は、**いつ**サンドボックス化を使うかを制御します:

- `"off"`: サンドボックス化なし。
- `"non-main"`: **非メイン**セッションのみサンドボックス化します（通常のチャットはホスト上で実行したい場合のデフォルト）。
- `"all"`: すべてのセッションをサンドボックス内で実行します。
  注意: `"non-main"` は agent id ではなく `session.mainKey`（デフォルトは `"main"`）に基づきます。
  グループ/チャネルセッションは独自のキーを使うため、非メインとして扱われ、サンドボックス化されます。

## スコープ

`agents.defaults.sandbox.scope` は、作成される**コンテナ数**を制御します:

- `"agent"`（デフォルト）: agent ごとに 1 つのコンテナ。
- `"session"`: セッションごとに 1 つのコンテナ。
- `"shared"`: サンドボックス化されたすべてのセッションで 1 つのコンテナを共有。

## バックエンド

`agents.defaults.sandbox.backend` は、どのランタイムがサンドボックスを提供するかを制御します:

- `"docker"`（デフォルト）: ローカルの Docker ベースのサンドボックスランタイム。
- `"ssh"`: 汎用の SSH ベースのリモートサンドボックスランタイム。
- `"openshell"`: OpenShell ベースのサンドボックスランタイム。

SSH 固有の設定は `agents.defaults.sandbox.ssh` 配下にあります。
OpenShell 固有の設定は `plugins.entries.openshell.config` 配下にあります。

### バックエンドの選び方

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **実行場所**        | ローカルコンテナ                 | SSH でアクセス可能な任意のホスト | OpenShell 管理のサンドボックス                      |
| **セットアップ**    | `scripts/sandbox-setup.sh`       | SSH キー + 対象ホスト          | OpenShell Plugin を有効化                           |
| **ワークスペースモデル** | バインドマウントまたはコピー     | リモート正本（1 回シード）     | `mirror` または `remote`                            |
| **ネットワーク制御** | `docker.network`（デフォルト: なし） | リモートホストに依存           | OpenShell に依存                                    |
| **ブラウザサンドボックス** | 対応                           | 非対応                         | まだ非対応                                          |
| **バインドマウント** | `docker.binds`                   | 該当なし                       | 該当なし                                            |
| **最適な用途**      | ローカル開発、完全分離           | リモートマシンへのオフロード   | 双方向同期オプション付きの管理されたリモートサンドボックス |

### Docker バックエンド

Docker バックエンドはデフォルトのランタイムで、Docker デーモンソケット（`/var/run/docker.sock`）を介して、ツールとサンドボックスブラウザをローカルで実行します。サンドボックスコンテナの分離は Docker 名前空間によって決まります。

**Docker-out-of-Docker（DooD）の制約**:
OpenClaw Gateway 自体を Docker コンテナとしてデプロイすると、ホストの Docker ソケットを使って兄弟サンドボックスコンテナをオーケストレーションします（DooD）。これにより、特有のパスマッピング制約が発生します:

- **設定にはホストパスが必要**: `openclaw.json` の `workspace` 設定には、Gateway コンテナ内のパスではなく、**ホストの絶対パス**（例: `/home/user/.openclaw/workspaces`）を必ず指定する必要があります。OpenClaw が Docker デーモンにサンドボックス生成を依頼すると、デーモンは Gateway 名前空間ではなくホスト OS 名前空間を基準にパスを評価します。
- **FS ブリッジの整合性（同一のボリュームマップ）**: OpenClaw Gateway のネイティブプロセスも `workspace` ディレクトリに heartbeat とブリッジファイルを書き込みます。Gateway は自身のコンテナ化された環境内からもまったく同じ文字列（ホストパス）を評価するため、Gateway のデプロイには、ホスト名前空間をネイティブに結び付ける同一のボリュームマップ（`-v /home/user/.openclaw:/home/user/.openclaw`）を含める必要があります。

絶対ホストパスと一致しない内部マッピングを使うと、完全修飾パス文字列がネイティブには存在しないため、OpenClaw はコンテナ環境内で heartbeat を書き込もうとして `EACCES` の権限エラーをネイティブに投げます。

### SSH バックエンド

任意の SSH アクセス可能なマシン上で OpenClaw に `exec`、ファイルツール、メディア読み取りを
サンドボックス化させたい場合は、`backend: "ssh"` を使います。

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
          // または、ローカルファイルの代わりに SecretRef / インライン内容を使います:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

仕組み:

- OpenClaw は `sandbox.ssh.workspaceRoot` 配下に、スコープごとのリモートルートを作成します。
- 作成または再作成後の初回使用時に、OpenClaw はローカルワークスペースからそのリモートワークスペースへ一度だけシードします。
- その後は、`exec`、`read`、`write`、`edit`、`apply_patch`、プロンプトメディアの読み取り、および受信メディアのステージングが、SSH 経由でそのリモートワークスペースに対して直接実行されます。
- OpenClaw はリモートの変更をローカルワークスペースへ自動同期しません。

認証情報:

- `identityFile`, `certificateFile`, `knownHostsFile`: 既存のローカルファイルを使い、OpenSSH 設定を通じて渡します。
- `identityData`, `certificateData`, `knownHostsData`: インライン文字列または SecretRef を使います。OpenClaw は通常の secrets ランタイムスナップショットを通じてそれらを解決し、`0600` 権限の一時ファイルに書き込み、SSH セッション終了時に削除します。
- 同じ項目に対して `*File` と `*Data` の両方が設定されている場合、その SSH セッションでは `*Data` が優先されます。

これは**リモート正本**モデルです。初回シード後は、リモート SSH ワークスペースが実際のサンドボックス状態になります。

重要な影響:

- シード後に OpenClaw 外部で行ったホストローカルの編集は、サンドボックスを再作成するまでリモートには反映されません。
- `openclaw sandbox recreate` はスコープごとのリモートルートを削除し、次回使用時にローカルから再度シードします。
- ブラウザサンドボックス化は SSH バックエンドではサポートされていません。
- `sandbox.docker.*` 設定は SSH バックエンドには適用されません。

### OpenShell バックエンド

OpenShell 管理のリモート環境で OpenClaw にツールをサンドボックス化させたい場合は、
`backend: "openshell"` を使います。完全なセットアップガイド、設定
リファレンス、ワークスペースモードの比較については、専用の
[OpenShell page](/ja-JP/gateway/openshell) を参照してください。

OpenShell は、汎用 SSH バックエンドと同じコア SSH トランスポートおよびリモートファイルシステムブリッジを再利用し、
これに OpenShell 固有のライフサイクル
（`sandbox create/get/delete`, `sandbox ssh-config`）と、任意の `mirror`
ワークスペースモードを追加します。

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

- `mirror`（デフォルト）: ローカルワークスペースが正本のまま維持されます。OpenClaw は exec の前にローカルファイルを OpenShell に同期し、exec の後にリモートワークスペースを同期して戻します。
- `remote`: サンドボックス作成後は OpenShell ワークスペースが正本になります。OpenClaw はローカルワークスペースからリモートワークスペースへ一度だけシードし、その後はファイルツールと exec が変更を戻さずにリモートサンドボックスに対して直接実行されます。

リモートトランスポートの詳細:

- OpenClaw は `openshell sandbox ssh-config <name>` を使って、サンドボックス固有の SSH 設定を OpenShell に要求します。
- コアはその SSH 設定を一時ファイルに書き込み、SSH セッションを開き、`backend: "ssh"` で使われるのと同じリモートファイルシステムブリッジを再利用します。
- `mirror` モードではライフサイクルだけが異なります。exec の前にローカルからリモートへ同期し、その後で同期して戻します。

現在の OpenShell の制限:

- サンドボックスブラウザはまだサポートされていません
- `sandbox.docker.binds` は OpenShell バックエンドではサポートされていません
- `sandbox.docker.*` 配下の Docker 固有ランタイム設定は、引き続き Docker バックエンドにのみ適用されます

#### ワークスペースモード

OpenShell には 2 つのワークスペースモデルがあります。実際にはここが最も重要な部分です。

##### `mirror`

**ローカルワークスペースを正本のまま維持**したい場合は、`plugins.entries.openshell.config.mode: "mirror"` を使います。

動作:

- `exec` の前に、OpenClaw はローカルワークスペースを OpenShell サンドボックスへ同期します。
- `exec` の後に、OpenClaw はリモートワークスペースをローカルワークスペースへ同期して戻します。
- ファイルツールは引き続きサンドボックスブリッジ経由で動作しますが、ターン間ではローカルワークスペースが正本のままです。

このモードが適している場合:

- OpenClaw の外でローカルにファイルを編集し、その変更を自動的にサンドボックスへ反映したい
- OpenShell サンドボックスの動作をできるだけ Docker バックエンドに近づけたい
- 各 exec ターンの後に、ホストワークスペースへサンドボックスの書き込み内容を反映したい

トレードオフ:

- exec の前後で追加の同期コストが発生します

##### `remote`

**OpenShell ワークスペースを正本**にしたい場合は、`plugins.entries.openshell.config.mode: "remote"` を使います。

動作:

- サンドボックスが最初に作成されるとき、OpenClaw はローカルワークスペースからリモートワークスペースへ一度だけシードします。
- その後、`exec`、`read`、`write`、`edit`、`apply_patch` はリモート OpenShell ワークスペースに対して直接実行されます。
- OpenClaw は exec の後にリモートの変更をローカルワークスペースへ同期しません。
- プロンプト時のメディア読み取りは引き続き機能します。これは、ファイルツールとメディアツールがローカルホストパスを前提にせず、サンドボックスブリッジ経由で読み取るためです。
- トランスポートは `openshell sandbox ssh-config` が返す OpenShell サンドボックスへの SSH です。

重要な影響:

- シード後に OpenClaw の外でホスト上のファイルを編集しても、リモートサンドボックスはそれらの変更を**自動では**認識しません。
- サンドボックスが再作成されると、リモートワークスペースは再びローカルワークスペースからシードされます。
- `scope: "agent"` または `scope: "shared"` では、そのリモートワークスペースは同じスコープ内で共有されます。

このモードが適している場合:

- サンドボックスを主にリモート OpenShell 側で維持したい
- ターンごとの同期オーバーヘッドを低くしたい
- ホスト上のローカル編集でリモートサンドボックス状態が暗黙に上書きされるのを避けたい

サンドボックスを一時的な実行環境として考えるなら `mirror` を選んでください。
サンドボックスを実際のワークスペースとして考えるなら `remote` を選んでください。

#### OpenShell ライフサイクル

OpenShell サンドボックスも、通常のサンドボックスライフサイクルを通じて管理されます:

- `openclaw sandbox list` は Docker ランタイムだけでなく OpenShell ランタイムも表示します
- `openclaw sandbox recreate` は現在のランタイムを削除し、次回使用時に OpenClaw が再作成できるようにします
- prune ロジックもバックエンド対応です

`remote` モードでは、recreate が特に重要です:

- recreate はそのスコープの正本リモートワークスペースを削除します
- 次回使用時に、ローカルワークスペースから新しいリモートワークスペースがシードされます

`mirror` モードでは、ローカルワークスペースがいずれにせよ正本のままなので、
recreate は主にリモート実行環境をリセットします。

## ワークスペースアクセス

`agents.defaults.sandbox.workspaceAccess` は、**サンドボックスが何を見られるか**を制御します:

- `"none"`（デフォルト）: ツールは `~/.openclaw/sandboxes` 配下のサンドボックスワークスペースを見ます。
- `"ro"`: agent ワークスペースを `/agent` に読み取り専用でマウントします（`write`/`edit`/`apply_patch` を無効化）。
- `"rw"`: agent ワークスペースを `/workspace` に読み書き可能でマウントします。

OpenShell バックエンドでは:

- `mirror` モードでは、exec ターン間でローカルワークスペースが引き続き正本として使われます
- `remote` モードでは、初回シード後にリモート OpenShell ワークスペースが正本として使われます
- `workspaceAccess: "ro"` と `"none"` は、引き続き同じ方法で書き込み動作を制限します

受信メディアはアクティブなサンドボックスワークスペース（`media/inbound/*`）にコピーされます。
Skills に関する注意: `read` ツールはサンドボックスルート基準です。`workspaceAccess: "none"` の場合、
OpenClaw は対象となる Skills をサンドボックスワークスペース（`.../skills`）へミラーし、
読み取れるようにします。`"rw"` では、ワークスペースの Skills は
`/workspace/skills` から読み取れます。

## カスタムバインドマウント

`agents.defaults.sandbox.docker.binds` は、追加のホストディレクトリをコンテナにマウントします。
形式: `host:container:mode`（例: `"/home/user/source:/source:rw"`）。

グローバルおよび agent ごとの bind は**マージ**されます（置き換えではありません）。`scope: "shared"` では、agent ごとの bind は無視されます。

`agents.defaults.sandbox.browser.binds` は、追加のホストディレクトリを**サンドボックスブラウザ**コンテナにのみマウントします。

- 設定されている場合（`[]` を含む）、ブラウザコンテナでは `agents.defaults.sandbox.docker.binds` を置き換えます。
- 省略された場合、ブラウザコンテナは `agents.defaults.sandbox.docker.binds` にフォールバックします（後方互換）。

例（読み取り専用のソース + 追加のデータディレクトリ）:

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

セキュリティ上の注意:

- bind はサンドボックスのファイルシステムをバイパスします。設定したモード（`:ro` または `:rw`）でホストパスを公開します。
- OpenClaw は危険な bind ソース（例: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`、およびそれらを公開してしまう親マウント）をブロックします。
- OpenClaw は `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh` など、ホームディレクトリ配下の一般的な認証情報ルートもブロックします。
- bind の検証は単なる文字列一致ではありません。OpenClaw はソースパスを正規化し、その後で最も深い既存の祖先を通じて再解決してから、ブロックされたパスと許可ルートを再確認します。
- つまり、最終的なリーフがまだ存在しない場合でも、シンボリックリンク親を使ったエスケープはクローズドで失敗します。例: `run-link` がそこを指している場合、`/workspace/run-link/new-file` は依然として `/var/run/...` として解決されます。
- 許可されたソースルートも同じ方法で正規化されるため、シンボリックリンク解決前には許可リスト内に見えるだけのパスでも、`outside allowed roots` として拒否されます。
- 機密性の高いマウント（secrets、SSH キー、サービス認証情報）は、絶対に必要な場合を除き `:ro` にしてください。
- ワークスペースへの読み取りアクセスだけが必要なら、`workspaceAccess: "ro"` と組み合わせてください。bind モードは独立したままです。
- bind がツールポリシーおよび elevated exec とどう相互作用するかは、[Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

## 画像 + セットアップ

デフォルトの Docker image: `openclaw-sandbox:bookworm-slim`

一度だけビルドします:

```bash
scripts/sandbox-setup.sh
```

注意: デフォルト image には Node が含まれていません。Skill で Node（または
他のランタイム）が必要な場合は、カスタム image を組み込むか、
`sandbox.docker.setupCommand` でインストールしてください（ネットワーク外向き通信 + 書き込み可能なルート +
root ユーザーが必要です）。

`curl`, `jq`, `nodejs`, `python3`, `git` などの一般的なツールを含む、
より機能的なサンドボックス image が必要な場合は、次をビルドします:

```bash
scripts/sandbox-common-setup.sh
```

その後、`agents.defaults.sandbox.docker.image` を
`openclaw-sandbox-common:bookworm-slim` に設定します。

サンドボックス化されたブラウザ image:

```bash
scripts/sandbox-browser-setup.sh
```

デフォルトでは、Docker サンドボックスコンテナは**ネットワークなし**で実行されます。
`agents.defaults.sandbox.docker.network` で上書きできます。

同梱のサンドボックスブラウザ image では、コンテナ化ワークロード向けに保守的な Chromium 起動デフォルトも適用されます。
現在のコンテナデフォルトには以下が含まれます:

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
- `noSandbox` が有効な場合は `--no-sandbox` と `--disable-setuid-sandbox`。
- 3 つのグラフィックスハードニングフラグ（`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`）は任意であり、
  コンテナに GPU サポートがない場合に有用です。ワークロードで WebGL やその他の 3D/ブラウザ機能が必要な場合は、
  `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` を設定してください。
- `--disable-extensions` はデフォルトで有効で、拡張機能依存のフローでは
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で無効にできます。
- `--renderer-process-limit=2` は
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で制御され、`0` の場合は Chromium のデフォルトを維持します。

別のランタイムプロファイルが必要な場合は、カスタムブラウザ image を使い、
独自の entrypoint を指定してください。ローカル（非コンテナ）Chromium プロファイルでは、
`browser.extraArgs` を使って追加の起動フラグを付加します。

セキュリティデフォルト:

- `network: "host"` はブロックされます。
- `network: "container:<id>"` はデフォルトでブロックされます（名前空間結合によるバイパスのリスク）。
- 緊急時の上書き: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

Docker インストールとコンテナ化 Gateway の詳細はこちらです:
[Docker](/ja-JP/install/docker)

Docker Gateway デプロイでは、`scripts/docker/setup.sh` でサンドボックス設定をブートストラップできます。
この経路を有効にするには `OPENCLAW_SANDBOX=1`（または `true`/`yes`/`on`）を設定します。
ソケット位置は `OPENCLAW_DOCKER_SOCKET` で上書きできます。完全なセットアップと env
リファレンス: [Docker](/ja-JP/install/docker#agent-sandbox)

## setupCommand（1 回限りのコンテナセットアップ）

`setupCommand` は、サンドボックスコンテナ作成後に**1 回だけ**実行されます（毎回の実行ではありません）。
コンテナ内で `sh -lc` により実行されます。

パス:

- グローバル: `agents.defaults.sandbox.docker.setupCommand`
- agent ごと: `agents.list[].sandbox.docker.setupCommand`

よくある落とし穴:

- デフォルトの `docker.network` は `"none"`（外向き通信なし）なので、パッケージインストールは失敗します。
- `docker.network: "container:<id>"` には `dangerouslyAllowContainerNamespaceJoin: true` が必要で、緊急時専用です。
- `readOnlyRoot: true` は書き込みを防ぎます。`readOnlyRoot: false` にするか、カスタム image を組み込んでください。
- パッケージインストールには `user` が root である必要があります（`user` を省略するか、`user: "0:0"` を設定）。
- サンドボックス exec はホストの `process.env` を継承しません。Skill の API キーには
  `agents.defaults.sandbox.docker.env`（またはカスタム image）を使ってください。

## ツールポリシー + エスケープハッチ

ツールの許可/拒否ポリシーは、サンドボックスルールより前に引き続き適用されます。ツールが
グローバルまたは agent ごとに拒否されている場合、サンドボックス化しても再び使えるようにはなりません。

`tools.elevated` は、サンドボックス外で `exec` を実行する明示的なエスケープハッチです（デフォルトでは `gateway`、exec ターゲットが `node` の場合は `node`）。
`/exec` ディレクティブは認可された送信者にのみ適用され、セッションごとに保持されます。`exec` を完全に無効化したい場合は、
ツールポリシーの deny を使ってください（[Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照）。

デバッグ:

- `openclaw sandbox explain` を使うと、有効なサンドボックスモード、ツールポリシー、および修正用設定キーを確認できます。
- 「なぜこれがブロックされているのか？」を理解するための考え方は、[Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。
  厳格にロックダウンした状態を維持してください。

## マルチエージェントのオーバーライド

各 agent は sandbox + tools をオーバーライドできます:
`agents.list[].sandbox` と `agents.list[].tools`（およびサンドボックスツールポリシー用の `agents.list[].tools.sandbox.tools`）。
優先順位については [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

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

## 関連ドキュメント

- [OpenShell](/ja-JP/gateway/openshell) -- 管理されたサンドボックスバックエンドのセットアップ、ワークスペースモード、設定リファレンス
- [Sandbox Configuration](/ja-JP/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) -- 「なぜこれがブロックされているのか？」のデバッグ
- [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) -- agent ごとのオーバーライドと優先順位
- [Security](/ja-JP/gateway/security)
