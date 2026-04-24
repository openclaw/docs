---
read_when:
    - Skillsの追加または変更
    - skillのgatingや読み込みルールの変更
summary: 'Skills: managedとworkspace、gatingルール、config/env配線'
title: Skills
x-i18n:
    generated_at: "2026-04-24T05:26:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c7db23e1eb818d62283376cb33353882a9cb30e4476c5775218137da2ba82d9
    source_path: tools/skills.md
    workflow: 15
---

OpenClawは、toolの使い方をagentに教えるために、**[AgentSkills](https://agentskills.io)互換** のskill folderを使います。各skillは、YAML frontmatterとinstructionsを含む `SKILL.md` を持つdirectoryです。OpenClawは **bundled skills** と任意のローカルoverrideを読み込み、環境、config、binaryの存在に基づいて読み込み時にfilterします。

## 場所と優先順位

OpenClawは次のsourceからSkillsを読み込みます:

1. **追加skill folder**: `skills.load.extraDirs` で設定
2. **Bundled skills**: install（npm packageまたはOpenClaw.app）に同梱
3. **Managed/local skills**: `~/.openclaw/skills`
4. **Personal agent skills**: `~/.agents/skills`
5. **Project agent skills**: `<workspace>/.agents/skills`
6. **Workspace skills**: `<workspace>/skills`

skill名が衝突した場合の優先順位は次のとおりです:

`<workspace>/skills`（最高）→ `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled skills → `skills.load.extraDirs`（最低）

## agentごとのSkillsと共有Skills

**マルチagent** 構成では、各agentが独自のworkspaceを持ちます。つまり:

- **agentごとのSkills** は、そのagent専用の `<workspace>/skills` に置かれます。
- **Project agent skills** は `<workspace>/.agents/skills` に置かれ、
  通常のworkspace `skills/` folderより先にそのworkspaceへ適用されます。
- **Personal agent skills** は `~/.agents/skills` に置かれ、
  そのマシン上のworkspace全体に適用されます。
- **共有Skills** は `~/.openclaw/skills`（managed/local）に置かれ、
  同じマシン上の**すべてのagent** に見えます。
- **共有folder** も、複数agentで使う共通skills packが欲しい場合は、`skills.load.extraDirs` 経由で追加できます（最低優先順位）。

同じskill名が複数箇所に存在する場合は、通常の優先順位が
適用されます: workspaceが勝ち、次にproject agent skills、次にpersonal agent skills、
次にmanaged/local、次にbundled、最後にextra dirです。

## agent skill allowlist

skillの**場所** とskillの**可視性** は別の制御です。

- 場所/優先順位は、同名skillのどのcopyが勝つかを決めます。
- agent allowlistは、見えているskillのうち、そのagentが実際に使えるものを決めます。

共有baselineには `agents.defaults.skills` を使い、agentごとのoverrideには
`agents.list[].skills` を使ってください:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // github, weatherを継承
      { id: "docs", skills: ["docs-search"] }, // defaultsを置換
      { id: "locked-down", skills: [] }, // Skillsなし
    ],
  },
}
```

ルール:

- デフォルトでskill無制限にするには `agents.defaults.skills` を省略する。
- `agents.defaults.skills` を継承するには `agents.list[].skills` を省略する。
- Skillsなしにするには `agents.list[].skills: []` を設定する。
- 空でない `agents.list[].skills` listは、そのagentの最終集合であり、
  defaultsとはmergeされない。

OpenClawは、有効なagent skill setを、prompt build、skill
slash-command discovery、sandbox sync、skill snapshot全体に適用します。

## Plugin + Skills

Pluginは、`openclaw.plugin.json` に `skills` directoryを列挙することで
独自Skillsを同梱できます（pathはplugin rootからの相対）。plugin skillは、そのPluginが有効なときに読み込まれます。現在、これらのdirectoryは
`skills.load.extraDirs` と同じ低優先順位pathへmergeされるため、同名のbundled、
managed、agent、またはworkspace skillがそれらをoverrideします。
これらは、pluginのconfig
entry上の `metadata.openclaw.requires.config` でgatingできます。discovery/configについては [Plugins](/ja-JP/tools/plugin)、それらのskillが教える
toolサーフェスについては [Tools](/ja-JP/tools) を参照してください。

## Skill Workshop

任意の実験的PluginであるSkill Workshopは、agent作業中に観測された再利用可能手順から、workspace
Skillsを作成または更新できます。これはデフォルトで無効で、明示的に
`plugins.entries.skill-workshop` で有効化する必要があります。

Skill Workshopは `<workspace>/skills` にのみ書き込み、生成内容をscanし、
保留中approvalまたは自動safe writeをサポートし、安全でない
proposalは隔離し、書き込み成功後にskill snapshotを更新するため、Gateway再起動なしで新しい
Skillsを利用可能にできます。

「次回はGIF attributionを確認する」のような修正や、
media QA checklistのような苦労して得たworkflowを、永続的な手順instructionにしたい場合に使ってください。最初は保留中approvalから始め、proposalを確認したうえで、信頼できるworkspaceにのみ自動書き込みを使ってください。完全ガイド:
[Skill Workshop Plugin](/ja-JP/plugins/skill-workshop)。

## ClawHub（install + sync）

ClawHubはOpenClawの公開skills registryです。閲覧先:
[https://clawhub.ai](https://clawhub.ai)。skillの発見/インストール/更新にはネイティブ `openclaw skills`
commandを使い、公開/sync workflowが必要な場合は別の `clawhub` CLIを使ってください。
完全ガイド: [ClawHub](/ja-JP/tools/clawhub)。

一般的なflow:

- workspaceにskillをインストールする:
  - `openclaw skills install <skill-slug>`
- インストール済みSkillsをすべて更新する:
  - `openclaw skills update --all`
- Sync（scan + 更新を公開）:
  - `clawhub sync --all`

ネイティブ `openclaw skills install` は、アクティブworkspaceの `skills/`
directoryにインストールします。別の `clawhub` CLIも、現在の
working directory配下の `./skills` にインストールします（または設定済みOpenClaw workspaceにフォールバックします）。
OpenClawは、次のsessionでそれを `<workspace>/skills` として取り込みます。

## セキュリティに関する注記

- サードパーティskillは**信頼されていないcode** として扱ってください。有効化前に読んでください。
- 信頼できないinputや危険なtoolにはsandbox化されたrunを優先してください。[Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。
- workspaceおよびextra-dirのskill discoveryは、resolved realpathが設定済みroot内に留まるskill rootと `SKILL.md` fileだけを受け付けます。
- Gateway-backedなskill dependency install（`skills.install`、onboarding、Skills settings UI）は、installer metadataを実行する前に組み込みdangerous-code scannerを実行します。`critical` なfindingsは、callerが明示的にdangerous overrideを設定しない限り、デフォルトでブロックされます。suspiciousなfindingsは引き続き警告のみです。
- `openclaw skills install <slug>` は別です。これはClawHub skill folderをworkspaceへダウンロードするもので、上記のinstaller-metadata pathは使いません。
- `skills.entries.*.env` と `skills.entries.*.apiKey` は、そのagent turnの**host** processへsecretを注入します
  （sandboxではありません）。promptやlogにsecretを入れないでください。
- より広いthreat modelとchecklistについては、[Security](/ja-JP/gateway/security) を参照してください。

## 形式（AgentSkills + Pi互換）

`SKILL.md` には少なくとも次が必要です:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

注記:

- layout/intentにはAgentSkills specに従います。
- embedded agentが使うparserは、**単一行** のfrontmatter keyのみをサポートします。
- `metadata` は **単一行のJSON object** である必要があります。
- skill folder pathを参照するには、instruction内で `{baseDir}` を使ってください。
- 任意のfrontmatter key:
  - `homepage` — macOS Skills UIで「Website」として表示されるURL（`metadata.openclaw.homepage` 経由でもサポート）。
  - `user-invocable` — `true|false`（デフォルト: `true`）。`true` のとき、skillはuser slash commandとして公開されます。
  - `disable-model-invocation` — `true|false`（デフォルト: `false`）。`true` のとき、skillはmodel promptから除外されます（user invocation経由では引き続き利用可能）。
  - `command-dispatch` — `tool`（任意）。`tool` に設定すると、slash commandはmodelをバイパスし、toolへ直接dispatchします。
  - `command-tool` — `command-dispatch: tool` が設定されているときに呼び出すtool名。
  - `command-arg-mode` — `raw`（デフォルト）。tool dispatchでは、生のargs stringをtoolへ転送します（core parsingなし）。

    toolは次のparamsで呼び出されます:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating（読み込み時filter）

OpenClawは、`metadata`（単一行JSON）を使って**読み込み時にskillをfilter** します:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

`metadata.openclaw` 配下のfield:

- `always: true` — 常にそのskillを含める（他のgateをスキップ）。
- `emoji` — macOS Skills UIで使われる任意emoji。
- `homepage` — macOS Skills UIで「Website」として表示される任意URL。
- `os` — 任意のplatform list（`darwin`, `linux`, `win32`）。設定されている場合、そのskillはそれらのOSでのみ対象になります。
- `requires.bins` — list。各項目が `PATH` 上に存在しなければならない。
- `requires.anyBins` — list。少なくとも1つが `PATH` 上に存在しなければならない。
- `requires.env` — list。env varが存在する**か**、configで提供されていなければならない。
- `requires.config` — truthyでなければならない `openclaw.json` pathのlist。
- `primaryEnv` — `skills.entries.<name>.apiKey` に関連付けられるenv var名。
- `install` — macOS Skills UIで使われるinstaller specの任意array（brew/node/go/uv/download）。

sandboxingについての注記:

- `requires.bins` は、skill読み込み時に**host** 上で確認されます。
- agentがsandbox化されている場合、そのbinaryは**container内にも**存在しなければなりません。
  `agents.defaults.sandbox.docker.setupCommand`（またはcustom image）でインストールしてください。
  `setupCommand` はcontainer作成後に1回だけ実行されます。
  package installには、network egress、書き込み可能なroot FS、およびsandbox内のroot userも必要です。
  例: `summarize` skill（`skills/summarize/SKILL.md`）は、そこで実行するにはsandbox container内に `summarize` CLI
  が必要です。

installer例:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

注記:

- 複数のinstallerが列挙されている場合、gatewayは**1つ** のpreferred optionを選びます（brewが使えればbrew、そうでなければnode）。
- すべてのinstallerが `download` の場合、OpenClawは利用可能なartifactを見られるよう、各entryを列挙します。
- installer specには、platformごとにoptionをfilterするための `os: ["darwin"|"linux"|"win32"]` を含められます。
- Node installは `openclaw.json` 内の `skills.install.nodeManager` に従います（デフォルト: npm。option: npm/pnpm/yarn/bun）。
  これは **skill install** にのみ影響します。Gateway runtimeは引き続きNodeであるべきです
  （WhatsApp/TelegramではBunは推奨されません）。
- Gateway-backedなinstaller選択は、node-onlyではなくpreference主導です:
  install specがkindを混在させている場合、OpenClawは
  `skills.install.preferBrew` が有効で `brew` が存在すればHomebrewを優先し、次に `uv`、次に
  設定済みnode manager、その後に `go` や `download` などのfallbackを試します。
- すべてのinstall specが `download` の場合、OpenClawは1つのpreferred installerへまとめず、
  すべてのdownload optionを表示します。
- Go install: `go` がなく `brew` が使える場合、gatewayはまずHomebrew経由でGoをインストールし、可能なら `GOBIN` をHomebrewの `bin` に設定します。
- Download install: `url`（必須）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（デフォルト: archive検出時はauto）、`stripComponents`, `targetDir`（デフォルト: `~/.openclaw/tools/<skillKey>`）。

`metadata.openclaw` が存在しない場合、そのskillは常に対象になります（configで無効化されている、またはbundled skillについて `skills.allowBundled` にブロックされている場合を除く）。

## Config override（`~/.openclaw/openclaw.json`）

bundled/managed skillはtoggleしたりenv値を供給したりできます:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // またはplaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

注記: skill名にhyphenが含まれる場合は、keyをquoteしてください（JSON5ではquoted keyを許可しています）。

OpenClaw自体の中でstockの画像生成/編集を使いたい場合は、bundled
skillではなく、`agents.defaults.imageGenerationModel` と一緒にcore
`image_generate` toolを使ってください。ここでのskill例は、customまたはサードパーティworkflow向けです。

ネイティブ画像解析には、`agents.defaults.imageModel` と一緒に `image` toolを使ってください。
ネイティブ画像生成/編集には、
`agents.defaults.imageGenerationModel` と一緒に `image_generate` を使ってください。`openai/*`, `google/*`,
`fal/*`、またはその他のprovider固有image modelを選ぶ場合は、そのproviderのauth/API
keyも追加してください。

config keyは、デフォルトでは **skill名** に一致します。skillが
`metadata.openclaw.skillKey` を定義している場合は、`skills.entries` 配下でそのkeyを使ってください。

ルール:

- `enabled: false` は、bundled/installedであってもそのskillを無効にする。
- `env`: process内にその変数がまだ設定されていない**場合のみ** 注入される。
- `apiKey`: `metadata.openclaw.primaryEnv` を宣言するskill向けの便利機能。
  plaintext stringまたはSecretRef object（`{ source, provider, id }`）をサポートする。
- `config`: customなskillごとのfield向けの任意bag。custom keyはここに置く必要がある。
- `allowBundled`: **bundled** skill専用の任意allowlist。設定されている場合、
  list内のbundled skillだけが対象になる（managed/workspace skillは影響を受けない）。

## 環境注入（agent runごと）

agent runが始まると、OpenClawは:

1. skill metadataを読む。
2. 任意の `skills.entries.<key>.env` または `skills.entries.<key>.apiKey` を
   `process.env` に適用する。
3. **対象の** skillを使ってsystem promptを組み立てる。
4. run終了後に元の環境を復元する。

これは**agent runにスコープされており**、グローバルshell environmentではありません。

同梱の `claude-cli` backendでは、OpenClawは同じ
対象snapshotを一時的なClaude Code pluginとしてmaterializeし、
`--plugin-dir` 付きで渡します。これによりClaude Codeはネイティブskill resolverを使えますが、同時に
OpenClawが優先順位、agentごとのallowlist、gating、および
`skills.entries.*` のenv/API key注入を引き続き管理します。他のCLI backendはprompt
catalogのみを使います。

## Session snapshot（パフォーマンス）

OpenClawは、**session開始時に** 対象skillをsnapshotし、同じsession内の後続turnではそのlistを再利用します。skillやconfigへの変更は、次の新しいsessionで有効になります。

skills watcherが有効な場合、または新しく対象となるremote nodeが現れた場合（後述）、Skillsはsession途中でも更新されることがあります。これは**hot reload** と考えてください。更新されたlistは次のagent turnで取り込まれます。

そのsessionの有効なagent skill allowlistが変わると、OpenClawは
visible skillが現在の
agentと揃うようsnapshotを更新します。

## リモートmacOS Node（Linux gateway）

GatewayがLinux上で動作していて、**macOS node** が接続されており、かつ **`system.run` が許可されている** 場合（Exec approval securityが `deny` に設定されていない）、OpenClawは、そのnode上に必要なbinaryが存在するなら、macOS専用skillを対象として扱えます。agentは、それらのskillを `host=node` 付きの `exec` toolで実行すべきです。

これは、nodeが自身のcommand supportを報告し、`system.run` 経由のbin probeが可能であることに依存します。後でmacOS nodeがofflineになっても、skillはvisibleのままです。nodeが再接続するまではinvocationが失敗する場合があります。

## Skills watcher（自動更新）

デフォルトでは、OpenClawはskill folderを監視し、`SKILL.md` fileが変わるとskills snapshotを更新します。これは `skills.load` で設定します:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Tokenへの影響（Skills list）

skillが対象になると、OpenClawは利用可能なskillのcompactなXML listをsystem promptに注入します（`pi-coding-agent` 内の `formatSkillsForPrompt` 経由）。コストは決定的です:

- **Base overhead（1つ以上のskillがある場合のみ）:** 195文字。
- **skillごと:** 97文字 + XML escapeされた `<name>`, `<description>`, `<location>` の各値の長さ。

式（文字数）:

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

注記:

- XML escapingは `& < > " '` をentity（`&amp;`, `&lt;` など）へ展開するため、長さが増えます。
- token数はmodel tokenizerによって異なります。OpenAIスタイルの大まかな見積もりでは約4文字/tokenなので、**97文字 ≈ 24 token** / skillに、実際のfield長が加算されます。

## Managed skillsのライフサイクル

OpenClawは、install
（npm packageまたはOpenClaw.app）の一部として、baselineのskill setを **bundled skills** として同梱します。`~/.openclaw/skills` はローカル
override向けに存在します（たとえば、bundled
copyを変更せずにskillをpinning/patchingする場合など）。workspace skillはユーザー所有であり、名前衝突時には両方をoverrideします。

## Configリファレンス

完全な設定schemaについては [Skills config](/ja-JP/tools/skills-config) を参照してください。

## もっとSkillsを探していますか？

[https://clawhub.ai](https://clawhub.ai) を参照してください。

---

## 関連

- [Creating Skills](/ja-JP/tools/creating-skills) — custom skillの構築
- [Skills Config](/ja-JP/tools/skills-config) — skill設定リファレンス
- [Slash Commands](/ja-JP/tools/slash-commands) — 利用可能なすべてのslash command
- [Plugins](/ja-JP/tools/plugin) — Plugin system概要
