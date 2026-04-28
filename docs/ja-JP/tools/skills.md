---
read_when:
    - Skills を追加または変更する
    - Skills の gating、allowlist、または読み込みルールを変更する
    - Skills の優先順位と snapshot 動作を理解する
sidebarTitle: Skills
summary: 'Skills: managed と workspace、gating ルール、agent allowlist、設定の配線'
title: Skills
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:42:28Z"
  model: gpt-5.4
  provider: openai
  source_hash: 19fd880e88051db9d4d9090a64123a2dc5a16a6211fa46879ddecaa86f25149c
  source_path: tools/skills.md
  workflow: 15
---

OpenClaw は、tool の使い方を agent に教えるために **[AgentSkills](https://agentskills.io) 互換**の skill
folder を使います。各 skill は、YAML frontmatter と手順を含む `SKILL.md` を持つ
directory です。OpenClaw はバンドルされた skill と任意の local override を読み込み、
環境、config、binary の有無に基づいて読み込み時にフィルタリングします。

## 場所と優先順位

OpenClaw は次のソースから skill を読み込みます。**優先順位が高い順**です。

| #   | ソース                | Path                             |
| --- | --------------------- | -------------------------------- |
| 1   | workspace skill      | `<workspace>/skills`             |
| 2   | project agent skill  | `<workspace>/.agents/skills`     |
| 3   | personal agent skill | `~/.agents/skills`               |
| 4   | managed/local skill  | `~/.openclaw/skills`             |
| 5   | bundled skill        | install に同梱                   |
| 6   | extra skill folder   | `skills.load.extraDirs` (config) |

skill 名が衝突した場合は、最も優先順位の高いソースが勝ちます。

## agent ごとの skill と共有 skill

**multi-agent** 構成では、各 agent は独自の workspace を持ちます。

| Scope                | Path                                        | 見える対象                  |
| -------------------- | ------------------------------------------- | --------------------------- |
| agent ごと            | `<workspace>/skills`                        | その agent のみ             |
| project-agent        | `<workspace>/.agents/skills`                | その workspace の agent のみ |
| personal-agent       | `~/.agents/skills`                          | そのマシン上の全 agent  |
| 共有 managed/local | `~/.openclaw/skills`                        | そのマシン上の全 agent  |
| 共有 extra dir    | `skills.load.extraDirs`（最も低優先） | そのマシン上の全 agent  |

複数の場所に同じ名前がある場合 → 最も優先順位の高いソースが勝ちます。workspace は
project-agent より優先され、project-agent は personal-agent より優先され、personal-agent は managed/local より優先され、managed/local は bundled より優先され、
bundled は extra dir より優先されます。

## agent の skill allowlist

skill の **場所** と skill の **可視性** は別の制御です。
場所/優先順位は同名 skill のどのコピーが勝つかを決め、agent の
allowlist は agent が実際に使える skill を決めます。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // github, weather を継承
      { id: "docs", skills: ["docs-search"] }, // defaults を置き換える
      { id: "locked-down", skills: [] }, // skill なし
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="allowlist ルール">
    - デフォルトで skill を無制限にするには `agents.defaults.skills` を省略します。
    - `agents.defaults.skills` を継承するには `agents.list[].skills` を省略します。
    - skill を使わせないには `agents.list[].skills: []` を設定します。
    - 空でない `agents.list[].skills` の一覧は、その
      agent に対する **最終的な** 集合であり、defaults とはマージされません。
    - 有効な allowlist は、prompt 構築、skill
      slash-command 検出、sandbox sync、skill snapshot 全体に適用されます。
  </Accordion>
</AccordionGroup>

## Plugin と Skills

Plugin は、`openclaw.plugin.json` に
`skills` directory（plugin ルートからの相対 path）を列挙することで、独自の skill を同梱できます。plugin skill は
plugin が有効なときに読み込まれます。これは、tool 固有の
操作ガイドを置くのに適した場所です。tool description には長すぎるが、
plugin がインストールされていれば常に利用可能であるべき内容です。たとえば browser
plugin は、多段階の browser 制御用に `browser-automation` skill を同梱しています。

plugin skill directory は、
`skills.load.extraDirs` と同じ低優先順位 path にマージされるため、同名の bundled、managed、agent、または
workspace skill がそれらを上書きします。plugin の config entry 上の
`metadata.openclaw.requires.config` により、それらを gating できます。

discovery/config については [Plugins](/ja-JP/tools/plugin) を、
それらの skill が教える tool サーフェスについては [Tools](/ja-JP/tools) を参照してください。

## Skill Workshop

任意の実験的 plugin である **Skill Workshop** は、agent の作業中に観測された再利用可能な手順から、
workspace skill を作成または更新できます。
これはデフォルトで無効であり、
`plugins.entries.skill-workshop` で明示的に有効化する必要があります。

Skill Workshop は `<workspace>/skills` にのみ書き込み、
生成された内容をスキャンし、保留中承認または安全な自動書き込みをサポートし、
安全でない提案を隔離し、書き込み成功後に skill snapshot を更新するため、
新しい skill を Gateway 再起動なしで利用可能にします。

_「次回は GIF の帰属を確認する」_ のような修正や、
media QA チェックリストのような苦労して得た workflow に使ってください。まずは保留中承認から始め、
自動書き込みは、提案内容を確認したうえで信頼できる workspace でのみ使ってください。完全なガイド:
[Skill Workshop plugin](/ja-JP/plugins/skill-workshop)。

## ClawHub（install と sync）

[ClawHub](https://clawhub.ai) は OpenClaw の公開 skill registry です。
discover/install/update にはネイティブの `openclaw skills` command を使い、
publish/sync workflow には別の
`clawhub` CLI を使います。完全なガイド:
[ClawHub](/ja-JP/tools/clawhub)。

| Action                             | Command                                |
| ---------------------------------- | -------------------------------------- |
| workspace に skill を install する | `openclaw skills install <skill-slug>` |
| install 済み skill をすべて更新する        | `openclaw skills update --all`         |
| sync（スキャン + 更新を publish）      | `clawhub sync --all`                   |

ネイティブの `openclaw skills install` は、アクティブな workspace の
`skills/` directory に install します。別の `clawhub` CLI も、
現在の作業 directory の `./skills` に install します（または設定済みの OpenClaw workspace にフォールバックします）。OpenClaw は次の session でこれを
`<workspace>/skills` として読み取ります。

## セキュリティ

<Warning>
サードパーティの skill は **信頼できないコード** として扱ってください。有効化する前に読んでください。
信頼できない入力やリスクの高い tool には sandbox 実行を優先してください。
agent 側の制御については [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。
</Warning>

- workspace と extra-dir の skill discovery は、解決後の realpath が設定された root 内に留まる skill root と `SKILL.md` file だけを受け付けます。
- Gateway を使う skill 依存 install（`skills.install`、オンボーディング、Skills settings UI）は、installer metadata を実行する前に、組み込みの dangerous-code scanner を実行します。`critical` な検出結果は、呼び出し側が明示的に dangerous override を設定しない限りデフォルトでブロックされます。疑わしい検出結果は警告のみです。
- `openclaw skills install <slug>` はこれとは異なり、ClawHub の skill folder を workspace にダウンロードするだけで、上記の installer-metadata path は使用しません。
- `skills.entries.*.env` と `skills.entries.*.apiKey` は、その agent turn の **host** process に secret を注入します（sandbox ではありません）。secret を prompt や log に含めないでください。

より広い脅威モデルとチェックリストについては [Security](/ja-JP/gateway/security) を参照してください。

## SKILL.md 形式

`SKILL.md` には最低限、次が必要です。

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw は layout/intent について AgentSkills spec に従います。組み込み
agent が使う parser は **単一行** の frontmatter key のみをサポートします。
`metadata` は **単一行の JSON object** にする必要があります。skill folder path を参照するには、
手順内で `{baseDir}` を使ってください。

### 任意の frontmatter key

<ParamField path="homepage" type="string">
  macOS Skills UI で 「Website」 として表示される URL。`metadata.openclaw.homepage` でもサポートされます。
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  `true` の場合、その skill は user slash command として公開されます。
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` の場合、その skill は model prompt から除外されます（user invocation では引き続き利用可能）。
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  `tool` に設定すると、slash command は model をバイパスし、直接 tool に dispatch されます。
</ParamField>
<ParamField path="command-tool" type="string">
  `command-dispatch: tool` が設定されている場合に呼び出す tool 名。
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  tool dispatch では、生の args 文字列を tool に転送します（core では解析しません）。tool は `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` で呼び出されます。
</ParamField>

## gating（読み込み時フィルター）

OpenClaw は、`metadata`（単一行 JSON）を使って読み込み時に skill をフィルタリングします。

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

`metadata.openclaw` 配下の field:

<ParamField path="always" type="boolean">
  `true` の場合、常にその skill を含めます（他の gate をスキップ）。
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI で使われる任意の emoji。
</ParamField>
<ParamField path="homepage" type="string">
  macOS Skills UI で 「Website」 として表示される任意の URL。
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  任意の platform 一覧。設定されている場合、その OS 上でのみ skill が有効候補になります。
</ParamField>
<ParamField path="requires.bins" type="string[]">
  それぞれが `PATH` 上に存在する必要があります。
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  少なくとも 1 つが `PATH` 上に存在する必要があります。
</ParamField>
<ParamField path="requires.env" type="string[]">
  env var が存在するか、config で提供されている必要があります。
</ParamField>
<ParamField path="requires.config" type="string[]">
  truthy でなければならない `openclaw.json` path の一覧。
</ParamField>
<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` に関連付けられる env var 名。
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI で使われる任意の installer spec（brew/node/go/uv/download）。
</ParamField>

`metadata.openclaw` が存在しない場合、その skill は常に対象になります（config で
無効化されている場合や、bundled skill で `skills.allowBundled` によってブロックされる場合を除く）。

<Note>
従来の `metadata.clawdbot` block も、
`metadata.openclaw` が存在しない場合は引き続き受け付けられるため、古くから install されている skill でも
依存 gate や installer hint が維持されます。新規または更新する skill では
`metadata.openclaw` を使ってください。
</Note>

### sandbox に関する注意

- `requires.bins` は、skill 読み込み時に **host** 上でチェックされます。
- agent が sandbox 化されている場合、その binary は **container 内にも**
  存在する必要があります。`agents.defaults.sandbox.docker.setupCommand`（または custom image）で install してください。`setupCommand` は container 作成後に 1 回だけ実行されます。package install には、network egress、書き込み可能な root FS、sandbox 内の root user も必要です。
- 例: `summarize` skill（`skills/summarize/SKILL.md`）は、sandbox container 内で実行するには `summarize` CLI が必要です。

### installer spec

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
              "label": "Gemini CLI を install する (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="installer 選択ルール">
    - 複数の installer が列挙されている場合、gateway は優先される 1 つの option を選びます（利用可能なら brew、そうでなければ node）。
    - すべての installer が `download` の場合、OpenClaw は利用可能な artifact が見えるように各 entry を一覧表示します。
    - installer spec には `os: ["darwin"|"linux"|"win32"]` を含めて、platform ごとに option をフィルタリングできます。
    - Node install は `openclaw.json` の `skills.install.nodeManager` に従います（デフォルト: npm、選択肢: npm/pnpm/yarn/bun）。これは skill install にのみ影響します。Gateway runtime は引き続き Node であるべきで、Bun は WhatsApp/Telegram には推奨されません。
    - Gateway を使う installer 選択は優先度ベースです。install spec に複数の kind が混在する場合、OpenClaw は `skills.install.preferBrew` が有効で `brew` が存在するときは Homebrew を優先し、次に `uv`、その次に設定された node manager、その後に `go` や `download` などの他のフォールバックを優先します。
    - すべての install spec が `download` の場合、OpenClaw は 1 つの優先 installer にまとめず、すべての download option を表示します。

  </Accordion>
  <Accordion title="installer ごとの詳細">
    - **Go install:** `go` がなく `brew` が使える場合、gateway はまず Homebrew で Go を install し、可能なら `GOBIN` を Homebrew の `bin` に設定します。
    - **download install:** `url`（必須）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（デフォルト: archive が検出されたら自動）、`stripComponents`、`targetDir`（デフォルト: `~/.openclaw/tools/<skillKey>`）。

  </Accordion>
</AccordionGroup>

## config override

バンドル skill と managed skill は、
`~/.openclaw/openclaw.json` の `skills.entries` 配下で有効/無効を切り替えたり、env 値を与えたりできます。

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // または平文文字列
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

<ParamField path="enabled" type="boolean">
  `false` の場合、その skill はバンドルまたは install 済みでも無効になります。
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` を宣言する skill 向けの簡易指定です。平文または SecretRef をサポートします。
</ParamField>
<ParamField path="env" type="Record<string, string>">
  その変数が process にまだ設定されていない場合にのみ注入されます。
</ParamField>
<ParamField path="config" type="object">
  skill ごとのカスタム field 用の任意の bag。カスタム key はここに置く必要があります。
</ParamField>
<ParamField path="allowBundled" type="string[]">
  **bundled** skill のみを対象にした任意の allowlist。設定されている場合、一覧内の bundled skill だけが対象になります（managed/workspace skill には影響しません）。
</ParamField>

skill 名にハイフンが含まれる場合は、key を引用符で囲ってください（JSON5 では
引用符付き key が使えます）。config key はデフォルトで **skill 名** に一致します。
skill が `metadata.openclaw.skillKey` を定義している場合は、
`skills.entries` 配下ではその key を使ってください。

<Note>
OpenClaw 内で標準の画像生成/編集を行う場合は、バンドル skill ではなく、
`agents.defaults.imageGenerationModel` とともに core の
`image_generate` tool を使ってください。ここでの skill 例は custom または third-party
workflow 用です。ネイティブ画像解析には
`agents.defaults.imageModel` とともに `image` tool を使ってください。`openai/*`、`google/*`、
`fal/*`、または他の provider 固有の画像 model を選ぶ場合は、その provider の
auth/API key も追加してください。
</Note>

## 環境変数の注入

agent 実行が開始されると、OpenClaw は次を行います。

1. skill metadata を読み取る。
2. `skills.entries.<key>.env` と `skills.entries.<key>.apiKey` を `process.env` に適用する。
3. **有効な** skill を使って system prompt を構築する。
4. 実行終了後に元の environment を復元する。

環境変数の注入は **その agent 実行にだけ適用** されるものであり、
グローバルな shell environment ではありません。

バンドルされた `claude-cli` backend では、OpenClaw は同じ
有効 snapshot を一時的な Claude Code plugin として具体化し、
`--plugin-dir` で渡します。これにより Claude Code はネイティブの skill resolver を使えますが、
優先順位、agent ごとの allowlist、gating、`skills.entries.*` の env/API key 注入は引き続き OpenClaw が管理します。他の CLI backend では
prompt catalog のみを使います。

## snapshot と更新

OpenClaw は session 開始時に有効な skill を **snapshot**
し、同じ session の後続 turn ではその一覧を再利用します。skill や config の変更は、
次の新しい session で反映されます。

skill が session の途中で更新されるのは、次の 2 つの場合です。

- skills watcher が有効なとき
- 新しく有効な remote node が現れたとき

これは **hot reload** と考えてください。更新された一覧は次の
agent turn で反映されます。その session に対する有効な agent skill allowlist が変わると、
OpenClaw は snapshot を更新し、表示される skill が現在の agent に合った状態に保たれるようにします。

### Skills watcher

デフォルトでは、OpenClaw は skill folder を監視し、`SKILL.md` file が変更されると
skills snapshot を更新します。`skills.load` 配下で設定します。

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

### remote macOS node（Linux gateway）

Gateway が Linux 上で動作していても、**macOS node** が接続され、
`system.run` が許可されている場合（Exec approvals のセキュリティが `deny` に設定されていない）、
OpenClaw は、その node 上に必要な binary が存在するなら、macOS 専用 skill を有効として扱えます。
agent はそれらの skill を `host=node` を指定した `exec` tool で実行する必要があります。

これは、node が command サポートを報告し、
`system.which` または `system.run` による bin probe を行えることに依存します。offline の node は
remote 専用 skill を可視にしません。接続中の node が bin probe に応答しなくなった場合、
OpenClaw はキャッシュされた bin match をクリアするため、agent は現在実行できない
skill を見なくなります。

## token への影響

skill が有効な場合、OpenClaw は利用可能な
skill のコンパクトな XML 一覧を system prompt に注入します（
`pi-coding-agent` の `formatSkillsForPrompt` を介して）。コストは決定的です。

- **基本オーバーヘッド**（skill が 1 つ以上ある場合のみ）: 195 文字。
- **skill ごと:** 97 文字 + XML エスケープされた `<name>`、`<description>`、`<location>` の値の長さ。

式（文字数）:

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML エスケープでは `& < > " '` がエンティティ（`&amp;`, `&lt;` など）に展開されるため、
長さが増えます。token 数は model tokenizer によって異なります。大まかな
OpenAI 風の見積もりでは約 4 文字/token なので、**97 文字 ≈ 24 token** が skill ごとに追加され、
それに実際の field 長が加わります。

## managed skill のライフサイクル

OpenClaw は install
（npm package または OpenClaw.app）に baseline の skill 一式を **bundled skill** として同梱します。`~/.openclaw/skills` は
local override 用です。たとえば、バンドル版を変更せずに skill を pin したり patch したりする用途です。workspace skill はユーザー所有であり、名前が衝突した場合はその両方を上書きします。

## もっと Skills を探したいですか？

[https://clawhub.ai](https://clawhub.ai) を見てください。完全な設定
schema: [Skills config](/ja-JP/tools/skills-config)。

## 関連情報

- [ClawHub](/ja-JP/tools/clawhub) — 公開 skill registry
- [Skills の作成](/ja-JP/tools/creating-skills) — custom skill の作成
- [Plugins](/ja-JP/tools/plugin) — plugin システム概要
- [Skill Workshop plugin](/ja-JP/plugins/skill-workshop) — agent の作業から skill を生成
- [Skills config](/ja-JP/tools/skills-config) — skill 設定リファレンス
- [Slash commands](/ja-JP/tools/slash-commands) — 利用可能なすべての slash command
