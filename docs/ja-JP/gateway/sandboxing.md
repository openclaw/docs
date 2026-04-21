---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'OpenClaw のサンドボックス化の仕組み: モード、スコープ、ワークスペースアクセス、イメージ'
title: サンドボックス化
x-i18n:
    generated_at: "2026-04-21T04:45:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35405c103f37f7f7247462ed5bc54a4b0d2a19ca2a373cf10f7f231a62c2c7c4
    source_path: gateway/sandboxing.md
    workflow: 15
---

# サンドボックス化

OpenClaw は、影響範囲を減らすために **サンドボックスバックエンド内でツールを実行** できます。
これは **任意** であり、設定（`agents.defaults.sandbox` または
`agents.list[].sandbox`）で制御されます。サンドボックス化がオフの場合、ツールはホスト上で実行されます。
Gateway はホスト上に留まり、有効化されている場合はツール実行が分離されたサンドボックス内で行われます。

これは完全なセキュリティ境界ではありませんが、モデルがまずい動作をしたときに、
ファイルシステムやプロセスへのアクセスを実質的に制限します。

## サンドボックス化されるもの

- ツール実行（`exec`, `read`, `write`, `edit`, `apply_patch`, `process` など）。
- 任意のサンドボックス化された browser（`agents.defaults.sandbox.browser`）。
  - デフォルトでは、browser ツールが必要としたときに、サンドボックス browser は自動起動されます（CDP に到達可能であることを保証）。設定は `agents.defaults.sandbox.browser.autoStart` および `agents.defaults.sandbox.browser.autoStartTimeoutMs` を使用します。
  - デフォルトでは、サンドボックス browser コンテナは、グローバルな `bridge` ネットワークではなく専用の Docker ネットワーク（`openclaw-sandbox-browser`）を使用します。設定は `agents.defaults.sandbox.browser.network` を使用します。
  - 任意の `agents.defaults.sandbox.browser.cdpSourceRange` は、CIDR allowlist（たとえば `172.21.0.1/32`）でコンテナ境界の CDP ingress を制限します。
  - noVNC の observer アクセスはデフォルトでパスワード保護されます。OpenClaw は短命の token URL を出力し、ローカル bootstrap ページを提供して、URL フラグメント内のパスワードで noVNC を開きます（query/header のログには残りません）。
  - `agents.defaults.sandbox.browser.allowHostControl` により、サンドボックス化されたセッションが明示的にホスト browser を対象にできます。
  - 任意の allowlist により `target: "custom"` を制御できます: `allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

サンドボックス化されないもの:

- Gateway プロセス自体。
- 明示的にサンドボックス外での実行が許可されたツール（例: `tools.elevated`）。
  - **Elevated exec はサンドボックス化をバイパスし、設定された escape path（デフォルトは `gateway`、exec target が `node` の場合は `node`）を使用します。**
  - サンドボックス化がオフの場合、`tools.elevated` は実行を変更しません（すでにホスト上です）。[Elevated Mode](/ja-JP/tools/elevated) を参照してください。

## モード

`agents.defaults.sandbox.mode` は、**いつ** サンドボックス化を使うかを制御します。

- `"off"`: サンドボックス化しない。
- `"non-main"`: **非 main** セッションのみサンドボックス化する（通常のチャットをホスト上で動かしたい場合のデフォルト）。
- `"all"`: すべてのセッションをサンドボックス内で実行する。
  注: `"non-main"` は agent id ではなく `session.mainKey`（デフォルトは `"main"`）に基づきます。
  グループ／channel セッションは独自のキーを使うため、非 main とみなされ、サンドボックス化されます。

## スコープ

`agents.defaults.sandbox.scope` は、**いくつのコンテナ** を作成するかを制御します。

- `"agent"`（デフォルト）: agent ごとに 1 コンテナ。
- `"session"`: session ごとに 1 コンテナ。
- `"shared"`: すべてのサンドボックス化セッションで共有される 1 コンテナ。

## バックエンド

`agents.defaults.sandbox.backend` は、**どのランタイム** がサンドボックスを提供するかを制御します。

- `"docker"`（サンドボックス化有効時のデフォルト）: ローカル Docker ベースのサンドボックスランタイム。
- `"ssh"`: 汎用 SSH ベースのリモートサンドボックスランタイム。
- `"openshell"`: OpenShell ベースのサンドボックスランタイム。

SSH 固有の設定は `agents.defaults.sandbox.ssh` の下にあります。
OpenShell 固有の設定は `plugins.entries.openshell.config` の下にあります。

### バックエンドの選び方

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **実行場所**        | ローカルコンテナ                 | SSH で到達可能な任意のホスト   | OpenShell 管理のサンドボックス                      |
| **セットアップ**    | `scripts/sandbox-setup.sh`       | SSH キー + 対象ホスト          | OpenShell Plugin を有効化                           |
| **ワークスペースモデル** | bind mount または copy         | remote-canonical（初回のみ seed） | `mirror` または `remote`                         |
| **ネットワーク制御** | `docker.network`（デフォルト: none） | リモートホストに依存         | OpenShell に依存                                    |
| **browser sandbox** | サポートあり                    | 非サポート                     | まだ非サポート                                      |
| **bind mount**      | `docker.binds`                   | N/A                            | N/A                                                 |
| **最適用途**        | ローカル開発、完全な分離         | リモートマシンへのオフロード   | 管理されたリモートサンドボックスと任意の双方向同期 |

### Docker バックエンド

サンドボックス化はデフォルトでオフです。有効化してバックエンドを選ばない場合、
OpenClaw は Docker バックエンドを使用します。ツールとサンドボックス browser を
Docker デーモンソケット（`/var/run/docker.sock`）経由でローカル実行します。サンドボックスコンテナの
分離は Docker namespace によって決まります。

**Docker-out-of-Docker（DooD）の制約**:
OpenClaw Gateway 自体を Docker コンテナとしてデプロイすると、ホストの Docker ソケットを使って兄弟のサンドボックスコンテナをオーケストレーションします（DooD）。これには特有のパスマッピング制約があります。

- **設定にはホストパスが必要**: `openclaw.json` の `workspace` 設定には、Gateway コンテナ内部のパスではなく、**ホストの絶対パス**（例: `/home/user/.openclaw/workspaces`）を指定する必要があります。OpenClaw が Docker デーモンにサンドボックス生成を依頼すると、デーモンはパスを Gateway ではなくホスト OS の namespace 基準で評価します。
- **FS Bridge の整合性（同一の volume map）**: OpenClaw Gateway のネイティブプロセスも、`workspace` directory に heartbeat と bridge ファイルを書き込みます。Gateway は自身のコンテナ化環境内からもまったく同じ文字列（ホストパス）を評価するため、Gateway デプロイには、ホスト namespace をネイティブにリンクする同一の volume map（`-v /home/user/.openclaw:/home/user/.openclaw`）が必要です。

内部的にパスをマップしても、ホスト絶対パスとの整合性がなければ、完全修飾パス文字列がネイティブには存在しないため、OpenClaw はコンテナ環境内で heartbeat を書き込もうとしてネイティブに `EACCES` 権限エラーを投げます。

### SSH バックエンド

任意の SSH 到達可能マシン上で OpenClaw に `exec`、ファイルツール、メディア読み取りを
サンドボックス化させたい場合は `backend: "ssh"` を使用してください。

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

動作の仕組み:

- OpenClaw は `sandbox.ssh.workspaceRoot` の下に、scope ごとのリモート root を作成します。
- 作成または再作成後の最初の使用時に、OpenClaw はローカル workspace からそのリモート workspace へ一度だけ seed します。
- その後、`exec`、`read`、`write`、`edit`、`apply_patch`、prompt メディア読み取り、受信メディア staging は、SSH 経由でそのリモート workspace に対して直接実行されます。
- OpenClaw はリモート変更をローカル workspace に自動同期しません。

認証情報:

- `identityFile`、`certificateFile`、`knownHostsFile`: 既存のローカルファイルを使用し、OpenSSH 設定を通じて渡します。
- `identityData`、`certificateData`、`knownHostsData`: インライン文字列または SecretRef を使用します。OpenClaw は通常の secrets ランタイムスナップショットを通じてそれらを解決し、`0600` で temp file に書き込み、SSH セッション終了時に削除します。
- 同じ項目に対して `*File` と `*Data` の両方が設定されている場合、その SSH セッションでは `*Data` が優先されます。

これは **remote-canonical** モデルです。初回 seed 後は、リモート SSH workspace が実際のサンドボックス状態になります。

重要な結果:

- seed 後に OpenClaw の外で行ったホストローカル編集は、サンドボックスを再作成するまでリモートには反映されません。
- `openclaw sandbox recreate` は scope ごとのリモート root を削除し、次回使用時にローカルから再度 seed します。
- browser のサンドボックス化は SSH バックエンドではサポートされません。
- `sandbox.docker.*` 設定は SSH バックエンドには適用されません。

### OpenShell バックエンド

OpenClaw に OpenShell 管理のリモート環境でツールをサンドボックス化させたい場合は
`backend: "openshell"` を使用してください。完全なセットアップガイド、設定
リファレンス、workspace モード比較については、専用の
[OpenShell page](/ja-JP/gateway/openshell) を参照してください。

OpenShell は、汎用 SSH バックエンドと同じコア SSH トランスポートおよびリモート filesystem bridge を再利用し、
それに OpenShell 固有のライフサイクル
（`sandbox create/get/delete`, `sandbox ssh-config`）と任意の `mirror`
workspace モードを追加します。

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

- `mirror`（デフォルト）: ローカル workspace が canonical のままです。OpenClaw は exec 前にローカルファイルを OpenShell に同期し、exec 後にリモート workspace を同期して戻します。
- `remote`: サンドボックス作成後は OpenShell workspace が canonical になります。OpenClaw はローカル workspace からリモート workspace へ一度だけ seed し、その後はファイルツールと exec がリモートサンドボックスに対して直接実行され、変更は戻り同期されません。

リモートトランスポートの詳細:

- OpenClaw は OpenShell に対して `openshell sandbox ssh-config <name>` を通じてサンドボックス固有の SSH 設定を要求します。
- コアはその SSH 設定を temp file に書き込み、SSH セッションを開き、`backend: "ssh"` で使われるのと同じリモート filesystem bridge を再利用します。
- `mirror` モードではライフサイクルのみが異なります。exec 前にローカルからリモートへ同期し、その後で戻り同期します。

現在の OpenShell の制限:

- sandbox browser はまだサポートされていません
- `sandbox.docker.binds` は OpenShell バックエンドではサポートされていません
- `sandbox.docker.*` 配下の Docker 固有ランタイム設定は、引き続き Docker バックエンドにのみ適用されます

#### ワークスペースモード

OpenShell には 2 つの workspace モデルがあります。実際には、この部分が最も重要です。

##### `mirror`

**ローカル workspace を canonical のままにしたい** 場合は、`plugins.entries.openshell.config.mode: "mirror"` を使用します。

挙動:

- `exec` の前に、OpenClaw はローカル workspace を OpenShell サンドボックスへ同期します。
- `exec` の後に、OpenClaw はリモート workspace をローカル workspace へ同期して戻します。
- ファイルツールは引き続きサンドボックス bridge 経由で動作しますが、ターン間ではローカル workspace が source of truth のままです。

このモードを使う場面:

- OpenClaw の外でローカルにファイル編集し、その変更を自動的にサンドボックスへ反映したい
- OpenShell サンドボックスをできるだけ Docker バックエンドに近い挙動にしたい
- 各 exec ターン後に、ホスト workspace にサンドボックス書き込みを反映させたい

トレードオフ:

- exec の前後に追加の同期コストが発生します

##### `remote`

**OpenShell workspace を canonical にしたい** 場合は、`plugins.entries.openshell.config.mode: "remote"` を使用します。

挙動:

- サンドボックスが最初に作成されるとき、OpenClaw はローカル workspace からリモート workspace へ一度だけ seed します。
- その後は、`exec`、`read`、`write`、`edit`、`apply_patch` がリモート OpenShell workspace に対して直接実行されます。
- OpenClaw は exec 後にリモート変更をローカル workspace へ **同期しません**。
- prompt 時のメディア読み取りは引き続き動作します。これは、ファイルツールとメディアツールがローカルホストパスを前提にせず、サンドボックス bridge 経由で読み取るためです。
- トランスポートは、`openshell sandbox ssh-config` によって返される OpenShell サンドボックスへの SSH です。

重要な結果:

- seed ステップ後に OpenClaw の外でホスト上のファイルを編集しても、リモートサンドボックスはその変更を **自動では** 認識しません。
- サンドボックスが再作成されると、リモート workspace は再びローカル workspace から seed されます。
- `scope: "agent"` または `scope: "shared"` では、そのリモート workspace は同じスコープ内で共有されます。

このモードを使う場面:

- サンドボックスを主にリモート OpenShell 側で動かしたい
- ターンごとの同期オーバーヘッドを低くしたい
- ホストローカルの編集でリモートサンドボックス状態が気づかないうちに上書きされるのを避けたい

サンドボックスを一時的な実行環境と考えるなら `mirror` を選んでください。
サンドボックスを実際の workspace と考えるなら `remote` を選んでください。

#### OpenShell ライフサイクル

OpenShell サンドボックスも、通常のサンドボックスライフサイクルを通じて管理されます。

- `openclaw sandbox list` には Docker ランタイムだけでなく OpenShell ランタイムも表示されます
- `openclaw sandbox recreate` は現在のランタイムを削除し、次回使用時に OpenClaw が再作成できるようにします
- prune ロジックもバックエンドを認識します

`remote` モードでは、recreate は特に重要です。

- recreate はそのスコープの canonical なリモート workspace を削除します
- 次回使用時に、新しいリモート workspace がローカル workspace から seed されます

`mirror` モードでは、ローカル workspace がいずれにせよ canonical のままであるため、
recreate は主にリモート実行環境をリセットします。

## ワークスペースアクセス

`agents.defaults.sandbox.workspaceAccess` は、**サンドボックスが何を見られるか** を制御します。

- `"none"`（デフォルト）: ツールは `~/.openclaw/sandboxes` 配下のサンドボックス workspace を参照します。
- `"ro"`: agent workspace を `/agent` に読み取り専用でマウントします（`write`/`edit`/`apply_patch` を無効化）。
- `"rw"`: agent workspace を `/workspace` に読み書き可能でマウントします。

OpenShell バックエンドでは:

- `mirror` モードでは、exec ターン間で引き続きローカル workspace が canonical source として使われます
- `remote` モードでは、初回 seed の後はリモート OpenShell workspace が canonical source として使われます
- `workspaceAccess: "ro"` と `"none"` は、同様に書き込み動作を制限します

受信メディアは、アクティブなサンドボックス workspace（`media/inbound/*`）へコピーされます。
Skills に関する注記: `read` ツールはサンドボックス root 基準です。`workspaceAccess: "none"` の場合、
OpenClaw は対象となる Skills をサンドボックス workspace（`.../skills`）へミラーし、
読み取れるようにします。`"rw"` の場合、workspace の Skills は
`/workspace/skills` から読み取れます。

## カスタム bind mount

`agents.defaults.sandbox.docker.binds` は、追加のホスト directory をコンテナ内にマウントします。
形式: `host:container:mode`（例: `"/home/user/source:/source:rw"`）。

グローバルおよびエージェントごとの bind は **マージ** されます（置き換えではありません）。`scope: "shared"` では、エージェントごとの bind は無視されます。

`agents.defaults.sandbox.browser.binds` は、追加のホスト directory を **サンドボックス browser** コンテナ内にのみマウントします。

- 設定された場合（`[]` を含む）、browser コンテナでは `agents.defaults.sandbox.docker.binds` を置き換えます。
- 省略された場合、browser コンテナは `agents.defaults.sandbox.docker.binds` にフォールバックします（後方互換）。

例（読み取り専用 source + 追加の data directory）:

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

セキュリティ上の注記:

- bind はサンドボックス filesystem をバイパスします。設定したモード（`:ro` または `:rw`）でホストパスを露出します。
- OpenClaw は危険な bind source（例: `docker.sock`、`/etc`、`/proc`、`/sys`、`/dev`、およびそれらを露出してしまう親マウント）をブロックします。
- OpenClaw は `~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm`、`~/.ssh` のような一般的なホーム directory の credential root もブロックします。
- bind 検証は単なる文字列一致ではありません。OpenClaw は source path を正規化し、その後で存在する最も深い祖先を通じて再解決してから、ブロックされたパスと許可された root を再チェックします。
- これは、最終 leaf がまだ存在しない場合でも、symlink 親を使ったエスケープがフェイルクローズドのままになることを意味します。例: `run-link` がそこを指している場合、`/workspace/run-link/new-file` も引き続き `/var/run/...` として解決されます。
- 許可された source root も同様に canonical 化されるため、symlink 解決前には allowlist 内に見えるだけのパスも、`outside allowed roots` として拒否されます。
- 機密マウント（secrets、SSH キー、サービス credential）は、絶対に必要でない限り `:ro` にしてください。
- workspace への読み取りアクセスだけが必要な場合は `workspaceAccess: "ro"` と組み合わせてください。bind モードは独立したままです。
- bind がツールポリシーや elevated exec とどう相互作用するかは、[Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

## イメージ + セットアップ

デフォルトの Docker イメージ: `openclaw-sandbox:bookworm-slim`

一度だけビルドします:

```bash
scripts/sandbox-setup.sh
```

注: デフォルトイメージには **Node は含まれません**。Skill に Node（または
他のランタイム）が必要な場合は、カスタムイメージに組み込むか、
`sandbox.docker.setupCommand` でインストールしてください（network egress + 書き込み可能 root +
root user が必要）。

`curl`、`jq`、`nodejs`、`python3`、`git` のような一般的なツールを備えた、
より実用的なサンドボックスイメージが必要な場合は、以下をビルドしてください。

```bash
scripts/sandbox-common-setup.sh
```

その後、`agents.defaults.sandbox.docker.image` を
`openclaw-sandbox-common:bookworm-slim` に設定します。

サンドボックス化された browser イメージ:

```bash
scripts/sandbox-browser-setup.sh
```

デフォルトでは、Docker サンドボックスコンテナは **ネットワークなし** で実行されます。
上書きするには `agents.defaults.sandbox.docker.network` を使用してください。

同梱のサンドボックス browser イメージでは、コンテナ化されたワークロード向けに保守的な Chromium 起動デフォルトも適用されます。現在のコンテナデフォルトには以下が含まれます。

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
- 3 つの graphics hardening フラグ（`--disable-3d-apis`、
  `--disable-software-rasterizer`、`--disable-gpu`）は任意であり、
  コンテナに GPU サポートがない場合に有用です。workload に WebGL やその他の 3D/browser 機能が必要な場合は、`OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` を設定してください。
- `--disable-extensions` はデフォルトで有効であり、
  拡張機能依存のフローでは `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で無効化できます。
- `--renderer-process-limit=2` は
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で制御され、`0` にすると Chromium のデフォルトを維持します。

異なるランタイムプロファイルが必要な場合は、カスタム browser イメージを使用し、
独自の entrypoint を指定してください。ローカル（非コンテナ）Chromium プロファイルでは、
追加の起動フラグを付けるために `browser.extraArgs` を使用してください。

セキュリティデフォルト:

- `network: "host"` はブロックされます。
- `network: "container:<id>"` はデフォルトでブロックされます（namespace join バイパスのリスク）。
- ブレークグラス上書き: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

Docker インストールとコンテナ化された gateway については、こちらを参照してください:
[Docker](/ja-JP/install/docker)

Docker Gateway デプロイでは、`scripts/docker/setup.sh` でサンドボックス設定をブートストラップできます。
このパスを有効にするには `OPENCLAW_SANDBOX=1`（または `true`/`yes`/`on`）を設定してください。ソケット位置は
`OPENCLAW_DOCKER_SOCKET` で上書きできます。完全なセットアップと env
リファレンス: [Docker](/ja-JP/install/docker#agent-sandbox)

## setupCommand（1 回限りのコンテナセットアップ）

`setupCommand` は、サンドボックスコンテナ作成後に **一度だけ** 実行されます（毎回の run ではありません）。
コンテナ内で `sh -lc` により実行されます。

パス:

- グローバル: `agents.defaults.sandbox.docker.setupCommand`
- エージェントごと: `agents.list[].sandbox.docker.setupCommand`

よくある落とし穴:

- デフォルトの `docker.network` は `"none"`（egress なし）なので、パッケージインストールは失敗します。
- `docker.network: "container:<id>"` には `dangerouslyAllowContainerNamespaceJoin: true` が必要で、ブレークグラス専用です。
- `readOnlyRoot: true` は書き込みを防ぎます。`readOnlyRoot: false` にするか、カスタムイメージを組み込んでください。
- パッケージインストールには `user` が root である必要があります（`user` を省略するか、`user: "0:0"` を設定）。
- サンドボックス exec はホストの `process.env` を継承しません。Skill の API キーには
  `agents.defaults.sandbox.docker.env`（またはカスタムイメージ）を使用してください。

## ツールポリシー + エスケープハッチ

ツールの allow/deny ポリシーは、引き続きサンドボックスルールより前に適用されます。ツールが
グローバルまたはエージェントごとに deny されていれば、サンドボックス化しても復活しません。

`tools.elevated` は、`exec` をサンドボックス外で実行する明示的なエスケープハッチです（デフォルトは `gateway`、exec target が `node` の場合は `node`）。
`/exec` directive は認可された送信者にのみ適用され、セッション単位で保持されます。`exec` を完全に無効化するには、
ツールポリシーの deny を使用してください（[Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照）。

デバッグ:

- 有効なサンドボックスモード、ツールポリシー、修正用 config key を確認するには `openclaw sandbox explain` を使用してください。
- 「なぜこれがブロックされるのか？」という考え方については [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。
  厳しく制限した状態を維持してください。

## マルチエージェント上書き

各エージェントはサンドボックスとツールを上書きできます:
`agents.list[].sandbox` と `agents.list[].tools`（サンドボックスツールポリシー用の `agents.list[].tools.sandbox.tools` を含む）。
優先順位については [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

## 最小の有効化例

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

- [OpenShell](/ja-JP/gateway/openshell) -- 管理されたサンドボックスバックエンドのセットアップ、workspace モード、設定リファレンス
- [Sandbox Configuration](/ja-JP/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) -- 「なぜこれがブロックされるのか？」のデバッグ
- [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェントごとの上書きと優先順位
- [Security](/ja-JP/gateway/security)
