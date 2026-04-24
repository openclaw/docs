---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'OpenClawのsandboxingの仕組み: mode、scope、workspace access、images'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-24T04:59:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07be63b71a458a17020f33a24d60e6d8d7007d4eaea686a21acabf4815c3f653
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClawは、影響範囲を減らすために**sandboxバックエンド内でツールを実行**できます。
これは**任意機能**で、設定（`agents.defaults.sandbox` または
`agents.list[].sandbox`）で制御されます。sandboxingがoffの場合、ツールはホスト上で実行されます。
Gateway自体はホスト上に留まり、ツール実行だけが有効時に分離されたsandbox内で動きます。

これは完璧なセキュリティ境界ではありませんが、modelがまずい動作をしたときに
filesystemとprocessへのアクセスを大きく制限します。

## 何がsandbox化されるか

- ツール実行（`exec`, `read`, `write`, `edit`, `apply_patch`, `process` など）。
- 任意のsandboxed browser（`agents.defaults.sandbox.browser`）。
  - デフォルトでは、browserツールが必要とするとsandbox browserは自動起動します（CDP到達性を確保）。
    `agents.defaults.sandbox.browser.autoStart` と `agents.defaults.sandbox.browser.autoStartTimeoutMs` で設定します。
  - デフォルトでは、sandbox browserコンテナはグローバル `bridge` ネットワークではなく、専用のDockerネットワーク（`openclaw-sandbox-browser`）を使います。
    `agents.defaults.sandbox.browser.network` で設定します。
  - 任意の `agents.defaults.sandbox.browser.cdpSourceRange` は、コンテナ境界のCDP ingressをCIDR allowlistで制限します（例: `172.21.0.1/32`）。
  - noVNC observer accessはデフォルトでパスワード保護されます。OpenClawは短命なtoken URLを出力し、ローカルbootstrapページを提供し、query/headerログではなくURL fragment内のパスワード付きでnoVNCを開きます。
  - `agents.defaults.sandbox.browser.allowHostControl` を使うと、sandbox化されたセッションがホストbrowserを明示的に対象にできます。
  - 任意のallowlistにより `target: "custom"` を制御できます: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`。

sandbox化されないもの:

- Gateway process自体。
- 明示的にsandbox外実行が許可されたツール（例: `tools.elevated`）。
  - **elevated execはsandboxingをバイパスし、設定されたescape path（デフォルトは `gateway`、exec targetが `node` の場合は `node`）を使います。**
  - sandboxingがoffなら、`tools.elevated` は実行を変えません（すでにホスト上）。[Elevated Mode](/ja-JP/tools/elevated) を参照してください。

## モード

`agents.defaults.sandbox.mode` は、**いつ** sandboxingを使うかを制御します:

- `"off"`: sandboxingなし。
- `"non-main"`: **non-main** セッションだけsandbox化（通常チャットをホスト上で動かしたい場合のデフォルト）。
- `"all"`: すべてのセッションをsandbox内で実行。
  注: `"non-main"` はagent idではなく `session.mainKey`（デフォルト `"main"`）に基づきます。
  グループ/チャンネルセッションは独自キーを使うため、non-mainと見なされsandbox化されます。

## スコープ

`agents.defaults.sandbox.scope` は、**いくつのコンテナ**を作るかを制御します:

- `"agent"`（デフォルト）: agentごとに1コンテナ。
- `"session"`: セッションごとに1コンテナ。
- `"shared"`: すべてのsandbox化セッションで1コンテナを共有。

## バックエンド

`agents.defaults.sandbox.backend` は、どのランタイムがsandboxを提供するかを制御します:

- `"docker"`（sandboxing有効時のデフォルト）: ローカルDockerバックドsandboxランタイム。
- `"ssh"`: 汎用SSHバックドのリモートsandboxランタイム。
- `"openshell"`: OpenShellバックドsandboxランタイム。

SSH固有設定は `agents.defaults.sandbox.ssh` の下にあります。
OpenShell固有設定は `plugins.entries.openshell.config` の下にあります。

### バックエンドの選び方

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **実行場所**        | ローカルコンテナ                 | SSHでアクセス可能な任意のホスト | OpenShell管理sandbox                                |
| **セットアップ**    | `scripts/sandbox-setup.sh`       | SSH key + 対象ホスト           | OpenShell pluginを有効化                            |
| **Workspaceモデル** | Bind-mountまたはcopy             | remote-canonical（1回seed）    | `mirror` または `remote`                            |
| **ネットワーク制御**| `docker.network`（デフォルト: none） | リモートホスト依存         | OpenShell依存                                       |
| **Browser sandbox** | サポートあり                     | 非対応                         | まだ非対応                                          |
| **Bind mount**      | `docker.binds`                   | N/A                            | N/A                                                 |
| **最適用途**        | ローカル開発、完全分離           | リモートマシンへのオフロード   | 任意の双方向sync付き管理リモートsandbox             |

### Dockerバックエンド

sandboxingはデフォルトでoffです。sandboxingを有効にしてバックエンドを選ばない場合、
OpenClawはDockerバックエンドを使います。ツールとsandbox browserは、
Docker daemon socket（`/var/run/docker.sock`）経由でローカル実行されます。sandbox containerの
分離はDocker namespaceによって決まります。

**Docker-out-of-Docker（DooD）制約**:
OpenClaw Gateway自体をDockerコンテナとしてデプロイすると、ホストのDocker socketを使って兄弟sandboxコンテナをオーケストレーションします（DooD）。この構成には特有のパスマッピング制約があります。

- **configにはホストパスが必要**: `openclaw.json` の `workspace` 設定には、Gatewayコンテナ内部パスではなく、**ホストの絶対パス**（例: `/home/user/.openclaw/workspaces`）を指定する必要があります。OpenClawがDocker daemonにsandbox起動を依頼すると、daemonはパスをGateway namespaceではなくホストOS namespace基準で評価するためです。
- **FS bridge parity（同一volume map）**: OpenClaw Gatewayネイティブprocessも、`workspace` ディレクトリへheartbeatとbridgeファイルを書き込みます。Gateway自身もコンテナ環境内から同じ文字列（ホストパス）を評価するため、Gatewayデプロイにはホストnamespaceをネイティブに結び付ける同一のvolume map（`-v /home/user/.openclaw:/home/user/.openclaw`）が必要です。

内部だけでパスをマッピングし、絶対ホストパスとの整合がない場合、完全修飾パス文字列がネイティブに存在しないため、OpenClawはコンテナ環境内でheartbeatを書き込もうとして `EACCES` 権限エラーをネイティブに投げます。

### SSHバックエンド

任意のSSHアクセス可能マシン上で `exec`、file tool、media readをsandbox化したい場合は、`backend: "ssh"` を使ってください。

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
          // または、ローカルファイルの代わりにSecretRef / インライン内容を使用:
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

- OpenClawは `sandbox.ssh.workspaceRoot` の下に、scopeごとのremote rootを作成します。
- 作成後または再作成後の初回利用時に、OpenClawはローカルworkspaceからそのremote workspaceを一度だけseedします。
- その後、`exec`, `read`, `write`, `edit`, `apply_patch`, prompt media read, inbound media staging は、SSH経由で直接remote workspaceに対して実行されます。
- OpenClawは、remoteでの変更を自動ではローカルworkspaceへsyncしません。

認証素材:

- `identityFile`, `certificateFile`, `knownHostsFile`: 既存のローカルファイルを使い、OpenSSH config経由で渡します。
- `identityData`, `certificateData`, `knownHostsData`: インライン文字列またはSecretRefを使います。OpenClawは通常のsecrets runtime snapshot経由で解決し、`0600` で一時ファイルへ書き出し、SSHセッション終了時に削除します。
- 同じ項目で `*File` と `*Data` の両方が設定されている場合、そのSSHセッションでは `*Data` が優先されます。

これは**remote-canonical** モデルです。初回seed後は、remote SSH workspaceが本当のsandbox stateになります。

重要な結果:

- seed後にOpenClaw外で行ったホストローカル編集は、sandboxを再作成するまでremoteでは見えません。
- `openclaw sandbox recreate` はscopeごとのremote rootを削除し、次回利用時にローカルから再seedします。
- browser sandboxingはSSHバックエンドではサポートされません。
- `sandbox.docker.*` 設定はSSHバックエンドには適用されません。

### OpenShellバックエンド

OpenShell管理のリモート環境でツールをsandbox化したい場合は、`backend: "openshell"` を使ってください。完全なセットアップガイド、設定リファレンス、workspace mode比較は、専用の
[OpenShell page](/ja-JP/gateway/openshell) を参照してください。

OpenShellは、汎用SSHバックエンドと同じコアSSH transportとremote filesystem bridgeを再利用し、
OpenShell固有のライフサイクル
（`sandbox create/get/delete`, `sandbox ssh-config`）と、任意の `mirror`
workspace modeを追加します。

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

OpenShell mode:

- `mirror`（デフォルト）: ローカルworkspaceがcanonicalのままです。OpenClawはexec前にローカルファイルをOpenShellへsyncし、exec後にremote workspaceをsyncし戻します。
- `remote`: sandbox作成後はOpenShell workspaceがcanonicalです。OpenClawはremote workspaceをローカルworkspaceから一度だけseedし、その後file toolとexecは変更を戻さずに直接remote sandboxへ対して実行されます。

remote transport詳細:

- OpenClawはOpenShellに `openshell sandbox ssh-config <name>` を要求してsandbox固有SSH configを取得します。
- コアはそのSSH configを一時ファイルへ書き出し、SSHセッションを開き、`backend: "ssh"` で使われるのと同じremote filesystem bridgeを再利用します。
- `mirror` modeではライフサイクルだけが異なります。exec前にローカルからremoteへsyncし、exec後にsyncし戻します。

現在のOpenShell制限:

- sandbox browserはまだサポートされていません
- `sandbox.docker.binds` はOpenShellバックエンドではサポートされません
- `sandbox.docker.*` 下のDocker固有ランタイムノブは引き続きDockerバックエンドにのみ適用されます

#### Workspace mode

OpenShellには2つのworkspaceモデルがあります。実運用で最も重要なのはこの部分です。

##### `mirror`

**ローカルworkspaceをcanonicalのままにしたい**場合は、`plugins.entries.openshell.config.mode: "mirror"` を使ってください。

動作:

- `exec` の前に、OpenClawはローカルworkspaceをOpenShell sandboxへsyncします。
- `exec` の後に、OpenClawはremote workspaceをローカルworkspaceへsyncし戻します。
- file toolは引き続きsandbox bridge経由で動作しますが、turn間ではローカルworkspaceが信頼できる情報源のままです。

このモードを使う場面:

- OpenClaw外でローカルファイルを編集し、その変更を自動的にsandboxへ反映したい
- OpenShell sandboxを、できるだけDockerバックエンドに近い挙動にしたい
- 各exec turn後に、ホストworkspaceへsandbox書き込みを反映したい

トレードオフ:

- execの前後で追加のsyncコストがかかる

##### `remote`

**OpenShell workspaceをcanonicalにしたい**場合は、`plugins.entries.openshell.config.mode: "remote"` を使ってください。

動作:

- sandboxが最初に作成されるとき、OpenClawはローカルworkspaceからremote workspaceへ一度だけseedします。
- その後、`exec`, `read`, `write`, `edit`, `apply_patch` は直接remote OpenShell workspaceに対して動作します。
- OpenClawはexec後にremote変更をローカルworkspaceへ**syncし戻しません**。
- prompt時のmedia readは、fileとmedia toolがローカルホストパス前提ではなくsandbox bridge経由で読むため、引き続き動作します。
- transportは、`openshell sandbox ssh-config` が返すOpenShell sandboxへのSSHです。

重要な結果:

- seed後にOpenClaw外でホスト上のファイルを編集しても、remote sandboxはその変更を**自動では**見ません。
- sandboxが再作成されると、remote workspaceは再びローカルworkspaceからseedされます。
- `scope: "agent"` または `scope: "shared"` では、そのremote workspaceは同じscope内で共有されます。

このモードを使う場面:

- sandboxを主にリモートOpenShell側で維持したい
- turnごとのsyncオーバーヘッドを減らしたい
- ホストローカル編集でremote sandbox stateを黙って上書きしたくない

sandboxを一時的な実行環境と考えるなら `mirror` を選んでください。
sandboxを本当のworkspaceと考えるなら `remote` を選んでください。

#### OpenShellライフサイクル

OpenShell sandboxも通常のsandboxライフサイクルで管理されます:

- `openclaw sandbox list` はDockerランタイムだけでなくOpenShellランタイムも表示します
- `openclaw sandbox recreate` は現在のランタイムを削除し、次回利用時にOpenClawが再作成できるようにします
- pruneロジックもbackend-awareです

`remote` modeでは、recreateが特に重要です:

- recreateはそのscopeのcanonical remote workspaceを削除します
- 次回利用時に、ローカルworkspaceから新しいremote workspaceをseedします

`mirror` modeでは、ローカルworkspaceがどうせcanonicalのままなので、
recreateは主にremote実行環境をリセットします。

## Workspace access

`agents.defaults.sandbox.workspaceAccess` は、**sandboxが何を見られるか**を制御します:

- `"none"`（デフォルト）: ツールは `~/.openclaw/sandboxes` 配下のsandbox workspaceを見ます。
- `"ro"`: agent workspaceを `/agent` に読み取り専用でmountします（`write`/`edit`/`apply_patch` は無効化）。
- `"rw"`: agent workspaceを `/workspace` に読み書き可能でmountします。

OpenShellバックエンドでは:

- `mirror` modeは、exec turn間では引き続きローカルworkspaceをcanonical sourceとして使います
- `remote` modeは、初回seed後はremote OpenShell workspaceをcanonical sourceとして使います
- `workspaceAccess: "ro"` と `"none"` は、同様に書き込み動作を制限します

受信mediaは、アクティブなsandbox workspace（`media/inbound/*`）へコピーされます。
Skillsに関する注記: `read` ツールはsandbox root基準です。`workspaceAccess: "none"` の場合、
OpenClawは適格なSkillsをsandbox workspace（`.../skills`）へmirrorし、
読めるようにします。`"rw"` の場合、workspace Skillsは
`/workspace/skills` から読めます。

## カスタムbind mount

`agents.defaults.sandbox.docker.binds` は、追加のホストディレクトリをコンテナへmountします。
形式: `host:container:mode`（例: `"/home/user/source:/source:rw"`）。

グローバルbindとagentごとのbindは**マージ**されます（置き換えではありません）。`scope: "shared"` では、agentごとのbindは無視されます。

`agents.defaults.sandbox.browser.binds` は、追加のホストディレクトリを**sandbox browser** コンテナのみにmountします。

- これが設定されている場合（`[]` を含む）、browserコンテナでは `agents.defaults.sandbox.docker.binds` を置き換えます。
- 省略された場合、browserコンテナは `agents.defaults.sandbox.docker.binds` にフォールバックします（後方互換）。

例（読み取り専用source + 追加data directory）:

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

セキュリティに関する注記:

- bindはsandbox filesystemをバイパスします。設定したmode（`:ro` または `:rw`）でホストパスを公開します。
- OpenClawは危険なbind source（例: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`、およびそれらを露出させる親mount）をブロックします。
- OpenClawは `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh` のような一般的なhome-directory credential rootもブロックします。
- bind検証は単なる文字列照合ではありません。OpenClawはsource pathを正規化し、さらにもっとも深い既存ancestor経由でもう一度解決してから、blocked pathとallowed rootを再チェックします。
- つまり、最終leafがまだ存在しなくても、symlink親を使った脱出はフェイルクローズします。例: `/workspace/run-link/new-file` は、`run-link` がそこを指していれば依然として `/var/run/...` に解決されます。
- 許可されたsource rootも同じ方法で正規化されるため、symlink解決前にはallowlist内に見えるだけのパスも `outside allowed roots` として拒否されます。
- 機密mount（secrets, SSH key, service credential）は、絶対必要な場合を除いて `:ro` にしてください。
- workspaceのread accessだけが必要なら `workspaceAccess: "ro"` と組み合わせてください。bind modeとは独立です。
- bindがtool policyやelevated execとどう相互作用するかは [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

## 画像 + セットアップ

デフォルトDocker image: `openclaw-sandbox:bookworm-slim`

一度ビルドしてください:

```bash
scripts/sandbox-setup.sh
```

注: デフォルトimageには**Nodeが含まれていません**。SkillにNode（または
他のランタイム）が必要なら、custom imageを焼くか、
`sandbox.docker.setupCommand` でインストールしてください（network egress + 書き込み可能root +
root userが必要）。

`curl`, `jq`, `nodejs`, `python3`, `git` のような一般的ツールを含む、
より機能的なsandbox imageが欲しい場合は、次をビルドしてください:

```bash
scripts/sandbox-common-setup.sh
```

その後、`agents.defaults.sandbox.docker.image` を
`openclaw-sandbox-common:bookworm-slim` に設定します。

sandboxed browser image:

```bash
scripts/sandbox-browser-setup.sh
```

デフォルトでは、Docker sandbox containerは**ネットワークなし**で動作します。
overrideするには `agents.defaults.sandbox.docker.network` を使います。

同梱のsandbox browser imageも、コンテナ化ワークロード向けに保守的なChromium起動デフォルトを適用します。
現在のコンテナデフォルトには次が含まれます:

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
- `noSandbox` が有効な場合の `--no-sandbox` と `--disable-setuid-sandbox`
- 3つのgraphics hardeningフラグ（`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`）は任意で、
  コンテナにGPUサポートがない場合に有用です。WebGLやその他の3D/browser機能が必要な場合は
  `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  を設定してください。
- `--disable-extensions` はデフォルトで有効で、extension依存フロー向けには
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で無効化できます。
- `--renderer-process-limit=2` は
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で制御され、`0` はChromiumデフォルトを維持します。

異なるランタイムプロファイルが必要なら、custom browser imageを使って
独自entrypointを提供してください。ローカル（非コンテナ）Chromiumプロファイルでは、
追加の起動フラグを追記するために `browser.extraArgs` を使ってください。

セキュリティデフォルト:

- `network: "host"` はブロックされます。
- `network: "container:<id>"` はデフォルトでブロックされます（namespace joinバイパスのリスク）。
- 緊急用override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

Dockerインストールとコンテナ化gatewayについてはここ:
[Docker](/ja-JP/install/docker)

Docker gatewayデプロイでは、`scripts/docker/setup.sh` がsandbox configをbootstrapできます。
このパスを有効にするには `OPENCLAW_SANDBOX=1`（または `true`/`yes`/`on`）を設定してください。
socket locationは `OPENCLAW_DOCKER_SOCKET` でoverrideできます。完全なセットアップとenv
リファレンス: [Docker](/ja-JP/install/docker#agent-sandbox)。

## setupCommand（1回限りのコンテナセットアップ）

`setupCommand` はsandbox container作成後に**一度だけ**実行されます（毎回ではありません）。
コンテナ内で `sh -lc` 経由で実行されます。

パス:

- グローバル: `agents.defaults.sandbox.docker.setupCommand`
- agentごと: `agents.list[].sandbox.docker.setupCommand`

よくある落とし穴:

- デフォルトの `docker.network` は `"none"`（egressなし）なので、パッケージインストールは失敗します。
- `docker.network: "container:<id>"` には `dangerouslyAllowContainerNamespaceJoin: true` が必要で、緊急用専用です。
- `readOnlyRoot: true` は書き込みを防ぎます。`readOnlyRoot: false` にするかcustom imageを焼いてください。
- パッケージインストールには `user` がrootである必要があります（`user` を省略するか `user: "0:0"` に設定）。
- sandbox execはホストの `process.env` を継承しません。SkillのAPI keyには
  `agents.defaults.sandbox.docker.env`（またはcustom image）を使ってください。

## ツールポリシー + escape hatch

ツールallow/denyポリシーは、sandboxルールより前に適用されます。ツールがグローバルまたはagentごとに拒否されている場合、
sandboxingしても復活しません。

`tools.elevated` は、sandbox外で `exec` を実行する明示的なescape hatchです（デフォルトは `gateway`、exec targetが `node` の場合は `node`）。
`/exec` directiveは認可されたsenderにのみ適用され、セッション単位で永続化されます。`exec` を厳密に無効化するには、
ツールポリシーdenyを使ってください（[Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照）。

デバッグ:

- `openclaw sandbox explain` を使うと、実効sandbox mode、tool policy、修正用config keyを確認できます。
- 「なぜこれはブロックされたのか?」という考え方については [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。
  厳格に保ってください。

## マルチagent override

各agentはsandbox + toolsをoverrideできます:
`agents.list[].sandbox` と `agents.list[].tools`（さらにsandbox tool policy用の `agents.list[].tools.sandbox.tools`）。
優先順位については [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

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

## 関連ドキュメント

- [OpenShell](/ja-JP/gateway/openshell) -- 管理されたsandbox backendのセットアップ、workspace mode、設定リファレンス
- [Sandbox Configuration](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) -- 「なぜこれはブロックされたのか?」のデバッグ
- [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) -- agentごとのoverrideと優先順位
- [Security](/ja-JP/gateway/security)
