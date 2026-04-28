---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'OpenClawのsandboxingの仕組み: mode、scope、workspace access、image'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-26T11:31:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83930d5533832f2ece5fd069c15670f8a73c5801c829ca85c249a4582d36ff29
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClawは、影響範囲を減らすために**sandbox backend内でtoolを実行**できます。これは**任意**機能で、設定（`agents.defaults.sandbox` または `agents.list[].sandbox`）で制御されます。sandboxingがoffの場合、toolはhost上で実行されます。Gatewayはhost上に残り、tool実行は有効時に分離されたsandbox内で行われます。

<Note>
これは完全なセキュリティ境界ではありませんが、modelがまずいことをした場合でも、filesystemやprocessへのアクセスを実質的に制限します。
</Note>

## 何がsandbox化されるか

- tool実行（`exec`, `read`, `write`, `edit`, `apply_patch`, `process` など）。
- 任意のsandbox化browser（`agents.defaults.sandbox.browser`）。

<AccordionGroup>
  <Accordion title="sandbox化browserの詳細">
    - デフォルトでは、browser toolが必要とするとsandbox browserが自動起動し（CDPに到達可能であることを保証）、使用されます。`agents.defaults.sandbox.browser.autoStart` と `agents.defaults.sandbox.browser.autoStartTimeoutMs` で設定します。
    - デフォルトでは、sandbox browser containerはグローバル `bridge` networkではなく、専用のDocker network（`openclaw-sandbox-browser`）を使用します。`agents.defaults.sandbox.browser.network` で設定します。
    - 任意の `agents.defaults.sandbox.browser.cdpSourceRange` により、CIDR allowlist（例: `172.21.0.1/32`）でcontainer edgeのCDP ingressを制限できます。
    - noVNC observer accessはデフォルトでpassword保護されています。OpenClawは短命token URLを発行し、ローカルbootstrap pageを提供して、URL fragment内のpassword付きでnoVNCを開きます（query/header logには残りません）。
    - `agents.defaults.sandbox.browser.allowHostControl` により、sandbox化sessionが明示的にhost browserを対象にできます。
    - 任意のallowlistにより、`target: "custom"` を制限できます: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`。

  </Accordion>
</AccordionGroup>

sandbox化されないもの:

- Gateway process自体。
- 明示的にsandbox外実行を許可されたtool（例: `tools.elevated`）。
  - **elevated execはsandboxingをバイパスし、設定済みescape pathを使います（デフォルトは `gateway`、exec targetが `node` の場合は `node`）。**
  - sandboxingがoffの場合、`tools.elevated` は実行を変更しません（すでにhost上で実行されているため）。[Elevated Mode](/ja-JP/tools/elevated)を参照してください。

## mode

`agents.defaults.sandbox.mode` は、**いつ**sandboxingを使うかを制御します。

<Tabs>
  <Tab title="off">
    sandboxingなし。
  </Tab>
  <Tab title="non-main">
    **non-main** sessionのみsandbox化します（通常chatをhost上で動かしたい場合のデフォルト）。

    `"non-main"` はagent idではなく `session.mainKey`（デフォルト `"main"`）に基づきます。group/channel sessionは独自のkeyを使うため、non-mainと見なされsandbox化されます。

  </Tab>
  <Tab title="all">
    すべてのsessionをsandbox内で実行します。
  </Tab>
</Tabs>

## scope

`agents.defaults.sandbox.scope` は、**いくつのcontainer**を作成するかを制御します。

- `"agent"`（デフォルト）: agentごとに1つのcontainer。
- `"session"`: sessionごとに1つのcontainer。
- `"shared"`: すべてのsandbox化sessionで1つのcontainerを共有。

## backend

`agents.defaults.sandbox.backend` は、**どのruntime**がsandboxを提供するかを制御します。

- `"docker"`（sandboxing有効時のデフォルト）: ローカルDockerベースのsandbox runtime。
- `"ssh"`: 汎用SSHベースのremote sandbox runtime。
- `"openshell"`: OpenShellベースのsandbox runtime。

SSH固有の設定は `agents.defaults.sandbox.ssh` 配下にあります。OpenShell固有の設定は `plugins.entries.openshell.config` 配下にあります。

### backendの選び方

|                     | Docker | SSH | OpenShell |
| ------------------- | ------ | --- | --------- |
| **実行場所** | ローカルcontainer | SSHアクセス可能な任意のhost | OpenShell管理sandbox |
| **セットアップ** | `scripts/sandbox-setup.sh` | SSH key + target host | OpenShell Plugin有効化 |
| **workspace model** | bind-mountまたはcopy | remote-canonical（最初に一度seed） | `mirror` または `remote` |
| **network制御** | `docker.network`（デフォルト: none） | remote host依存 | OpenShell依存 |
| **browser sandbox** | 対応 | 非対応 | まだ非対応 |
| **bind mount** | `docker.binds` | N/A | N/A |
| **最適用途** | ローカル開発、完全分離 | remote machineへのoffload | 任意の双方向sync付き管理remote sandbox |

### Docker backend

sandboxingはデフォルトでoffです。sandboxingを有効にしてbackendを選択しない場合、OpenClawはDocker backendを使用します。これはDocker daemon socket（`/var/run/docker.sock`）経由で、toolとsandbox browserをローカル実行します。sandbox containerの分離はDocker namespaceによって決まります。

<Warning>
**Docker-out-of-Docker（DooD）制約**

OpenClaw Gateway自体をDocker containerとしてデプロイする場合、hostのDocker socketを使って兄弟sandbox containerをオーケストレーションします（DooD）。これには特有のpath mapping制約があります。

- **configにはhost pathが必要**: `openclaw.json` の `workspace` 設定には、Gateway container内部のpathではなく、**Hostの絶対path**（例: `/home/user/.openclaw/workspaces`）を必ず含める必要があります。OpenClawがDocker daemonにsandbox生成を依頼すると、daemonはGateway namespaceではなくHost OS namespaceを基準にpathを評価するためです。
- **FS bridge parity（同一volume map）**: OpenClaw Gatewayネイティブprocessも、`workspace` directoryにheartbeatとbridge fileを書き込みます。Gatewayはcontainer化環境内からまったく同じ文字列（host path）を評価するため、Gatewayデプロイメントには、host namespaceをネイティブに結びつける同一のvolume map（`-v /home/user/.openclaw:/home/user/.openclaw`）が必要です。

絶対host parityなしに内部pathだけをmappingすると、その完全修飾path文字列がネイティブには存在しないため、OpenClawはcontainer環境内でheartbeatを書こうとしてネイティブに `EACCES` permission errorを投げます。
</Warning>

### SSH backend

OpenClawに任意のSSHアクセス可能machine上で `exec`、file tool、media readをsandbox化させたい場合は `backend: "ssh"` を使います。

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
          // またはローカルfileの代わりに SecretRef / inline content を使用:
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
    - OpenClawは、scopeごとのremote rootを `sandbox.ssh.workspaceRoot` 配下に作成します。
    - 作成または再作成後の初回利用時に、ローカルworkspaceからそのremote workspaceへ一度だけseedします。
    - その後、`exec`、`read`、`write`、`edit`、`apply_patch`、prompt media read、受信media stagingは、SSH経由でそのremote workspaceに対して直接実行されます。
    - OpenClawはremote変更をローカルworkspaceへ自動syncしません。

  </Accordion>
  <Accordion title="認証material">
    - `identityFile`, `certificateFile`, `knownHostsFile`: 既存のローカルfileを使い、OpenSSH config経由で渡します。
    - `identityData`, `certificateData`, `knownHostsData`: inline文字列またはSecretRefを使います。OpenClawは通常のsecret runtime snapshot経由でこれらを解決し、`0600` でtemp fileに書き出し、SSH session終了時に削除します。
    - 同じ項目に対して `*File` と `*Data` の両方が設定されている場合、そのSSH sessionでは `*Data` が優先されます。

  </Accordion>
  <Accordion title="remote-canonicalの影響">
    これは**remote-canonical** modelです。最初のseed後は、remote SSH workspaceが実際のsandbox stateになります。

    - seed後にOpenClaw外部で行ったhostローカル編集は、sandboxを再作成するまでremote側に反映されません。
    - `openclaw sandbox recreate` はscopeごとのremote rootを削除し、次回利用時にローカルから再seedします。
    - browser sandboxingはSSH backendではサポートされません。
    - `sandbox.docker.*` 設定はSSH backendには適用されません。

  </Accordion>
</AccordionGroup>

### OpenShell backend

OpenClawにOpenShell管理のremote環境内でtoolをsandbox化させたい場合は `backend: "openshell"` を使います。完全なセットアップガイド、設定リファレンス、workspace mode比較については、専用の[OpenShell page](/ja-JP/gateway/openshell)を参照してください。

OpenShellは、汎用SSH backendと同じ中核SSH transportおよびremote filesystem bridgeを再利用し、そこにOpenShell固有のlifecycle（`sandbox create/get/delete`, `sandbox ssh-config`）と、任意の `mirror` workspace modeを追加します。

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

- `mirror`（デフォルト）: ローカルworkspaceがcanonicalのままです。OpenClawはexec前にローカルfileをOpenShellへsyncし、exec後にremote workspaceをsyncして戻します。
- `remote`: sandbox作成後はOpenShell workspaceがcanonicalです。OpenClawはremote workspaceをローカルworkspaceから一度seedし、その後は変更を戻さずに、file toolとexecがremote sandboxに対して直接実行されます。

<AccordionGroup>
  <Accordion title="remote transportの詳細">
    - OpenClawは、`openshell sandbox ssh-config <name>` を通じて、sandbox固有のSSH configをOpenShellに要求します。
    - CoreはそのSSH configをtemp fileに書き込み、SSH sessionを開き、`backend: "ssh"` と同じremote filesystem bridgeを再利用します。
    - `mirror` modeではlifecycleのみが異なります。exec前にlocalからremoteへsyncし、exec後にsyncして戻します。

  </Accordion>
  <Accordion title="現在のOpenShell制限">
    - sandbox browserはまだサポートされていません
    - `sandbox.docker.binds` はOpenShell backendではサポートされません
    - `sandbox.docker.*` 配下のDocker固有runtime knobは、引き続きDocker backendにのみ適用されます

  </Accordion>
</AccordionGroup>

#### Workspace mode

OpenShellには2つのworkspace modelがあります。実運用で最も重要なのはこの部分です。

<Tabs>
  <Tab title="mirror（local canonical）">
    **ローカルworkspaceをcanonicalのままにしたい**場合は、`plugins.entries.openshell.config.mode: "mirror"` を使います。

    動作:

    - `exec` の前に、OpenClawはローカルworkspaceをOpenShell sandboxへsyncします。
    - `exec` の後に、OpenClawはremote workspaceをローカルworkspaceへsyncして戻します。
    - file toolもsandbox bridge経由で動作しますが、turnの間ではローカルworkspaceがソースオブトゥルースのままです。

    次のような場合に使います。

    - OpenClaw外部でローカルにfileを編集し、その変更をsandboxへ自動的に反映させたい
    - OpenShell sandboxをできる限りDocker backendに近く振る舞わせたい
    - 各exec turn後にhost workspaceへsandboxの書き込みを反映したい

    トレードオフ: execの前後に追加のsyncコストがかかります。

  </Tab>
  <Tab title="remote（OpenShell canonical）">
    **OpenShell workspaceをcanonicalにしたい**場合は、`plugins.entries.openshell.config.mode: "remote"` を使います。

    動作:

    - sandboxが最初に作成されるとき、OpenClawはローカルworkspaceからremote workspaceへ一度だけseedします。
    - その後、`exec`、`read`、`write`、`edit`、`apply_patch` はremote OpenShell workspaceに対して直接動作します。
    - OpenClawは、exec後にremote変更をローカルworkspaceへ**同期しません**。
    - prompt時のmedia readは引き続き機能します。fileおよびmedia toolが、ローカルhost pathを前提とせずsandbox bridge経由で読み取るためです。
    - transportは、`openshell sandbox ssh-config` が返したOpenShell sandboxへのSSHです。

    重要な影響:

    - seed後にhost上でOpenClawの外からfileを編集しても、remote sandboxはその変更を自動的には**認識しません**。
    - sandboxが再作成されると、remote workspaceは再びローカルworkspaceからseedされます。
    - `scope: "agent"` または `scope: "shared"` の場合、そのremote workspaceは同じscope内で共有されます。

    次のような場合に使います。

    - sandboxを主にremote OpenShell側で運用したい
    - turnごとのsyncオーバーヘッドを減らしたい
    - hostローカル編集によってremote sandbox stateが暗黙に上書きされるのを避けたい

  </Tab>
</Tabs>

sandboxを一時的な実行環境と考えるなら `mirror` を選んでください。sandboxを実際のworkspaceと考えるなら `remote` を選んでください。

#### OpenShell lifecycle

OpenShell sandboxは、通常のsandbox lifecycleを通じて引き続き管理されます。

- `openclaw sandbox list` はDocker runtimeだけでなくOpenShell runtimeも表示します
- `openclaw sandbox recreate` は現在のruntimeを削除し、次回使用時にOpenClawに再作成させます
- pruneロジックもbackend対応です

`remote` modeでは、recreateが特に重要です。

- recreateは、そのscopeのcanonical remote workspaceを削除します
- 次回使用時に、ローカルworkspaceから新しいremote workspaceがseedされます

`mirror` modeでは、ローカルworkspaceがいずれにせよcanonicalのままであるため、recreateは主にremote実行環境のリセットです。

## workspace access

`agents.defaults.sandbox.workspaceAccess` は、**sandboxが何を見られるか**を制御します。

<Tabs>
  <Tab title="none (default)">
    toolは `~/.openclaw/sandboxes` 配下のsandbox workspaceを見ます。
  </Tab>
  <Tab title="ro">
    agent workspaceを `/agent` にread-onlyでmountします（`write` / `edit` / `apply_patch` を無効化）。
  </Tab>
  <Tab title="rw">
    agent workspaceを `/workspace` にread/writeでmountします。
  </Tab>
</Tabs>

OpenShell backendでは:

- `mirror` modeは、exec turnの間で引き続きローカルworkspaceをcanonical sourceとして使います
- `remote` modeは、最初のseed後にremote OpenShell workspaceをcanonical sourceとして使います
- `workspaceAccess: "ro"` と `"none"` は、引き続き同じように書き込み動作を制限します

受信mediaは、アクティブなsandbox workspace（`media/inbound/*`）にコピーされます。

<Note>
**Skills注記:** `read` toolはsandbox root基準です。`workspaceAccess: "none"` の場合、OpenClawは対象となるSkillsをsandbox workspace（`.../skills`）へmirrorし、読み取れるようにします。`"rw"` の場合、workspace Skillsは `/workspace/skills` から読み取れます。
</Note>

## custom bind mount

`agents.defaults.sandbox.docker.binds` は、追加のhost directoryをcontainerにmountします。形式は `host:container:mode`（例: `"/home/user/source:/source:rw"`）です。

グローバルbindとagentごとのbindは**マージ**されます（置換ではありません）。`scope: "shared"` では、agentごとのbindは無視されます。

`agents.defaults.sandbox.browser.binds` は、追加のhost directoryを**sandbox browser** containerのみにmountします。

- 設定されている場合（`[]` を含む）、browser containerでは `agents.defaults.sandbox.docker.binds` を置き換えます。
- 省略された場合、browser containerは `agents.defaults.sandbox.docker.binds` にフォールバックします（後方互換）。

例（read-only source + 追加のdata directory）:

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
**bindのセキュリティ**

- bindはsandbox filesystemをバイパスします。設定したmode（`:ro` または `:rw`）でhost pathを露出させます。
- OpenClawは危険なbind sourceをブロックします（例: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`、およびそれらを露出させる親mount）。
- OpenClawは `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh` のような一般的なhome directory credential rootもブロックします。
- bind validationは単なる文字列一致ではありません。OpenClawはsource pathを正規化し、その後もっとも深い既存ancestorを通じて再解決してから、ブロック対象pathと許可rootを再チェックします。
- つまり、最終leafがまだ存在しない場合でも、symlink親経由のescapeはfail closedになります。例: `run-link` がそこを指している場合、`/workspace/run-link/new-file` は引き続き `/var/run/...` として解決されます。
- 許可されたsource rootも同様にcanonical化されるため、symlink解決前はallowlist内に見えるpathでも、`outside allowed roots` として拒否されます。
- 機密mount（secret、SSH key、service credential）は、絶対に必要でない限り `:ro` にすべきです。
- workspaceへのread accessしか必要ないなら、`workspaceAccess: "ro"` と組み合わせてください。bind mode自体は独立しています。
- bindがtool policyおよびelevated execとどう相互作用するかについては、[Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)を参照してください。

</Warning>

## imageとセットアップ

デフォルトDocker image: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="デフォルトimageをビルドする">
    ```bash
    scripts/sandbox-setup.sh
    ```

    デフォルトimageには**Nodeは含まれません**。SkillにNode（または他のruntime）が必要な場合は、custom imageを焼くか、`sandbox.docker.setupCommand` でインストールしてください（network egress + writable root + root userが必要）。

  </Step>
  <Step title="任意: common imageをビルドする">
    より実用的なsandbox imageが必要な場合（たとえば `curl`, `jq`, `nodejs`, `python3`, `git` などの一般的なtoolを含む）:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    その後、`agents.defaults.sandbox.docker.image` を `openclaw-sandbox-common:bookworm-slim` に設定します。

  </Step>
  <Step title="任意: sandbox browser imageをビルドする">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

デフォルトでは、Docker sandbox containerは**networkなし**で実行されます。`agents.defaults.sandbox.docker.network` で上書きしてください。

<AccordionGroup>
  <Accordion title="sandbox browserのChromiumデフォルト">
    同梱sandbox browser imageは、container化ワークロード向けの保守的なChromium起動デフォルトも適用します。現在のcontainerデフォルトには次が含まれます。

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
    - `noSandbox` が有効な場合は `--no-sandbox`
    - 3つのgraphics hardening flag（`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`）は任意で、containerにGPU supportがない場合に有用です。workloadでWebGLやその他の3D / browser機能が必要なら、`OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` を設定してください。
    - `--disable-extensions` はデフォルトで有効で、extension依存フローでは `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で無効化できます。
    - `--renderer-process-limit=2` は `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で制御され、`0` ではChromiumデフォルトのままになります。

    別のruntime profileが必要なら、custom browser imageを使い、独自のentrypointを提供してください。ローカル（非container）Chromium profileでは、追加の起動flagを付けるために `browser.extraArgs` を使ってください。

  </Accordion>
  <Accordion title="networkセキュリティデフォルト">
    - `network: "host"` はブロックされます。
    - `network: "container:<id>"` はデフォルトでブロックされます（namespace joinバイパスの危険）。
    - 緊急時override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker installとcontainer化gatewayについては、こちらを参照してください: [Docker](/ja-JP/install/docker)

Docker gateway deploymentでは、`scripts/docker/setup.sh` がsandbox configをbootstrapできます。この経路を有効にするには `OPENCLAW_SANDBOX=1`（または `true` / `yes` / `on`）を設定してください。socket locationは `OPENCLAW_DOCKER_SOCKET` で上書きできます。完全なセットアップとenvリファレンス: [Docker](/ja-JP/install/docker#agent-sandbox)

## setupCommand（1回だけのcontainerセットアップ）

`setupCommand` はsandbox container作成後に**1回だけ**実行されます（毎回のrunではありません）。container内で `sh -lc` 経由で実行されます。

path:

- グローバル: `agents.defaults.sandbox.docker.setupCommand`
- agentごと: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="よくある落とし穴">
    - デフォルトの `docker.network` は `"none"`（egressなし）なので、package installは失敗します。
    - `docker.network: "container:<id>"` には `dangerouslyAllowContainerNamespaceJoin: true` が必要で、緊急時専用です。
    - `readOnlyRoot: true` は書き込みを防ぎます。`readOnlyRoot: false` を設定するか、custom imageを焼いてください。
    - package installには `user` がrootである必要があります（`user` を省略するか、`user: "0:0"` を設定）。
    - sandbox execはhostの `process.env` を継承しません。SkillのAPI keyには `agents.defaults.sandbox.docker.env`（またはcustom image）を使ってください。

  </Accordion>
</AccordionGroup>

## tool policyとescape hatch

tool allow / deny policyは、sandbox ruleより前に引き続き適用されます。toolがグローバルまたはagentごとにdenyされている場合、sandboxingを有効にしても復活しません。

`tools.elevated` は、sandbox外で `exec` を実行する明示的なescape hatchです（デフォルトは `gateway`、exec targetが `node` の場合は `node`）。`/exec` directiveは認可された送信者にのみ適用され、sessionごとに永続化されます。`exec` を完全に無効化したい場合は、tool policy denyを使用してください（[Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)を参照）。

デバッグ:

- 実効sandbox mode、tool policy、fix-it config keyを確認するには `openclaw sandbox explain` を使ってください。
- 「なぜブロックされるのか」の考え方については、[Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)を参照してください。

厳格にロックダウンしてください。

## マルチagent override

各agentはsandbox + toolを上書きできます: `agents.list[].sandbox` と `agents.list[].tools`（さらにsandbox tool policy用の `agents.list[].tools.sandbox.tools`）。優先順位については [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

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

- [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) — agentごとのoverrideと優先順位
- [OpenShell](/ja-JP/gateway/openshell) — 管理sandbox backendのセットアップ、workspace mode、設定リファレンス
- [Sandbox configuration](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) — 「なぜブロックされるのか」のデバッグ
- [Security](/ja-JP/gateway/security)
