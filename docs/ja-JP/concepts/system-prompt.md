---
read_when:
    - システムプロンプトのテキスト、ツール一覧、または時刻/Heartbeat セクションの編集
    - ワークスペースのブートストラップまたは Skills インジェクションの挙動を変更する
summary: OpenClaw のシステムプロンプトに含まれる内容とその組み立て方法
title: システムプロンプト
x-i18n:
    generated_at: "2026-05-03T21:31:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93533ac8090897a7b5fd82b80e542a4ad573670408314b3519c5e317d0408ade
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw は、すべての agent 実行に対してカスタム system prompt を構築します。この prompt は **OpenClaw 所有**であり、pi-coding-agent のデフォルト prompt は使用しません。

prompt は OpenClaw によって組み立てられ、各 agent 実行に注入されます。

プロバイダーPluginは、OpenClaw 所有の prompt 全体を置き換えずに、キャッシュを意識した prompt ガイダンスを提供できます。プロバイダーランタイムは次のことができます。

- 名前付き core セクションの小さな集合を置き換える（`interaction_style`、
  `tool_call_style`、`execution_bias`）
- prompt キャッシュ境界の上に **安定した prefix** を注入する
- prompt キャッシュ境界の下に **動的な suffix** を注入する

モデルファミリー固有のチューニングには、プロバイダー所有の提供内容を使用してください。通常のプロバイダー動作ではなく、互換性や本当にグローバルな prompt 変更のために、従来の
`before_prompt_build` prompt 変更を残してください。

OpenAI GPT-5 ファミリー overlay は core 実行ルールを小さく保ち、persona latching、簡潔な出力、tool discipline、parallel lookup、deliverable coverage、検証、不足している context、terminal-tool hygiene に関するモデル固有のガイダンスを追加します。

## 構造

prompt は意図的にコンパクトで、固定セクションを使用します。

- **Tooling**: 構造化 tool の信頼できる情報源に関するリマインダーと、ランタイムの tool 使用ガイダンス。
- **Execution Bias**: コンパクトな完遂ガイダンス: 実行可能なリクエストにはそのターン内で対応し、完了またはブロックされるまで継続し、弱い tool 結果から復旧し、可変状態を live で確認し、最終化前に検証する。
- **Safety**: 権力追求的な動作や監督の迂回を避けるための短いガードレールリマインダー。
- **Skills**（利用可能な場合）: 必要に応じて skill instructions を読み込む方法をモデルに伝える。
- **OpenClaw Self-Update**: `config.schema.lookup` で config を安全に調査し、`config.patch` で config にパッチを適用し、`config.apply` で config 全体を置き換え、明示的なユーザーリクエストがある場合にのみ `update.run` を実行する方法。owner-only の `gateway` tool も、保護された exec パスに正規化される従来の `tools.bash.*` エイリアスを含め、`tools.exec.ask` / `tools.exec.security` の書き換えを拒否する。
- **Workspace**: 作業ディレクトリ（`agents.defaults.workspace`）。
- **Documentation**: OpenClaw docs（repo または npm package）への local path と、それらを読むタイミング。
- **Workspace Files (injected)**: bootstrap ファイルが下に含まれていることを示す。
- **Sandbox**（有効な場合）: sandbox 化されたランタイム、sandbox paths、elevated exec が利用可能かどうかを示す。
- **Current Date & Time**: ユーザーの local time、timezone、time format。
- **Reply Tags**: サポートされるプロバイダー向けの任意の reply tag 構文。
- **Heartbeats**: default agent で Heartbeat が有効な場合の Heartbeat prompt と ack 動作。
- **Runtime**: host、OS、node、model、repo root（検出された場合）、thinking level（1行）。
- **Reasoning**: 現在の visibility level + /reasoning toggle hint。

OpenClaw は、**Project Context** を含む大きく安定した content を内部 prompt キャッシュ境界の上に保持します。Control UI embed guidance、**Messaging**、**Voice**、**Group Chat Context**、**Reactions**、**Heartbeats**、**Runtime** などの揮発性の channel/session セクションはその境界の下に追加されるため、prefix cache を持つ local backend は channel turn 間で安定した workspace prefix を再利用できます。同様に、受け入れられる schema がすでにそのランタイム詳細を保持している場合、tool descriptions は現在の channel 名の埋め込みを避けるべきです。

Tooling セクションには、長時間実行される作業向けのランタイムガイダンスも含まれます。

- 将来のフォローアップ（`check back later`、リマインダー、定期作業）には、`exec` sleep loop、`yieldMs` delay trick、または繰り返しの `process` polling ではなく Cron を使用する
- すぐに開始し、バックグラウンドで実行を継続する command にのみ `exec` / `process` を使用する
- 自動完了 wake が有効な場合は、command を一度だけ開始し、出力を発行するか失敗したときの push-based wake path に依存する
- 実行中の command を調査する必要がある場合は、logs、status、input、intervention に `process` を使用する
- task が大きい場合は `sessions_spawn` を優先する。sub-agent の完了は push-based で、requester に自動通知される
- 完了を待つためだけに `subagents list` / `sessions_list` を loop で poll しない

実験的な `update_plan` tool が有効な場合、Tooling は、非自明な複数 step の作業にのみそれを使用し、`in_progress` step を正確に 1 つに保ち、各 update 後に plan 全体を繰り返さないようモデルにも伝えます。

system prompt 内の Safety guardrails は助言です。モデルの動作を導きますが、ポリシーを強制しません。強制には tool policy、exec approval、sandboxing、channel allowlist を使用してください。operator は設計上これらを無効化できます。

ネイティブの approval card/button を持つ channel では、ランタイム prompt は agent に、まずそのネイティブ approval UI に依存するよう伝えます。tool result が chat approval が利用できない、または manual approval が唯一の path であると示す場合にのみ、manual
`/approve` command を含めるべきです。

## Prompt modes

OpenClaw は sub-agent 向けに、より小さな system prompt を render できます。ランタイムは各 run に対して `promptMode` を設定します（ユーザー向け config ではありません）。

- `full`（default）: 上記のすべてのセクションを含む。
- `minimal`: sub-agent に使用される。**Skills**、**Memory Recall**、**OpenClaw Self-Update**、**Model Aliases**、**User Identity**、**Reply Tags**、**Messaging**、**Silent Replies**、**Heartbeats** を省略する。Tooling、**Safety**、Workspace、Sandbox、Current Date & Time（既知の場合）、Runtime、注入された context は引き続き利用可能。
- `none`: base identity line のみを返す。

`promptMode=minimal` の場合、追加で注入された prompt は **Group Chat Context** ではなく **Subagent Context** とラベル付けされます。

channel auto-reply run では、直接/グループチャット context が解決済みの会話固有の `NO_REPLY` 動作をすでに含んでいる場合、OpenClaw は一般的な **Silent Replies** セクションを省略できます。これにより、グローバル system prompt と channel context の両方で token mechanics を繰り返すことを避けられます。

## Prompt snapshots

OpenClaw は、Codex ランタイムの happy path 向けに、コミット済みの prompt snapshot を
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 配下に保持します。これらは、選択された app-server thread/turn params と、Telegram direct、Discord group、heartbeat turn 向けの再構築された model-bound prompt layer stack を render します。その stack には、Codex の model catalog/cache shape から生成された pinned Codex `gpt-5.5` model prompt fixture、Codex happy-path permission developer text、OpenClaw developer instructions、OpenClaw が提供する場合の turn-scoped collaboration-mode instructions、user turn input、動的 tool specs への参照が含まれます。

pinned Codex model prompt fixture は
`pnpm prompt:snapshots:sync-codex-model` で更新します。デフォルトでは、script は Codex の runtime cache を `$CODEX_HOME/models_cache.json`、次に
`~/.codex/models_cache.json` で探し、その後にのみ maintainer Codex checkout の慣例である `~/code/codex/codex-rs/models-manager/models.json` にフォールバックします。これらの source がどれも存在しない場合、command はコミット済み fixture を変更せずに終了します。特定の `models_cache.json` または `models.json` file から更新するには `--catalog <path>` を渡します。

これらの snapshot は、まだ raw OpenAI request の byte-for-byte capture ではありません。Codex は、OpenClaw が thread と turn params を送信した後、Codex runtime 内で `AGENTS.md`、environment context、memories、app/plugin instructions、built-in Default collaboration-mode instructions など、runtime 所有の workspace context を追加できます。

`pnpm prompt:snapshots:gen` で再生成し、
`pnpm prompt:snapshots:check` で drift を検証します。CI は追加の boundary shard で drift check を実行するため、prompt 変更と snapshot update は同じ PR に紐づいたままになります。

## Workspace bootstrap injection

Bootstrap ファイルは trim され、**Project Context** の下に追加されるため、モデルは明示的な read なしで identity と profile context を確認できます。

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（brand-new workspace の場合のみ）
- 存在する場合は `MEMORY.md`

これらのファイルはすべて、ファイル固有の gate が適用されない限り、すべての turn で **context window に注入**されます。default agent で Heartbeat が無効な場合、または
`agents.defaults.heartbeat.includeSystemPromptSection` が false の場合、通常の run では `HEARTBEAT.md` は省略されます。注入されるファイルは簡潔に保ってください。特に `MEMORY.md` は時間とともに大きくなり、予期しない高い context 使用量と、より頻繁な compaction につながる可能性があります。

session がネイティブの Codex harness 上で実行される場合、Codex は独自の project-doc discovery を通じて `AGENTS.md` を読み込みます。OpenClaw は残りの bootstrap ファイルを引き続き解決し、それらを Codex config instructions として転送するため、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md` は、`AGENTS.md` を重複させることなく同じ workspace-context の役割を保持します。

<Note>
`memory/*.md` の daily ファイルは、通常の bootstrap Project Context の一部では**ありません**。通常の turn では `memory_search` と `memory_get` tool を通じて必要に応じてアクセスされるため、モデルが明示的にそれらを読むまで context window にはカウントされません。bare `/new` と `/reset` turn は例外です。ランタイムは、その最初の turn に対して、recent daily memory を one-shot startup-context block として prepend できます。
</Note>

大きなファイルは marker 付きで truncated されます。ファイルごとの最大サイズは
`agents.defaults.bootstrapMaxChars`（default: 12000）で制御されます。ファイル全体で注入される bootstrap content の合計は
`agents.defaults.bootstrapTotalMaxChars`（default: 60000）で上限が設定されます。存在しないファイルは短い missing-file marker を注入します。truncation が発生した場合、OpenClaw は Project Context に warning block を注入できます。これは
`agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`; default: `once`）で制御します。

Sub-agent session は `AGENTS.md` と `TOOLS.md` のみを注入します（他の bootstrap ファイルは、sub-agent context を小さく保つために filter されます）。

Internal hooks は `agent:bootstrap` を介してこの step を intercept し、注入される bootstrap ファイルを変更または置換できます（たとえば、`SOUL.md` を別の persona に差し替えるなど）。

agent をより generic でない響きにしたい場合は、
[SOUL.md Personality Guide](/ja-JP/concepts/soul) から始めてください。

注入される各ファイルがどれだけ寄与しているか（raw vs injected、truncation、さらに tool schema overhead）を調べるには、`/context list` または `/context detail` を使用します。詳しい内容は [Context](/ja-JP/concepts/context) を参照してください。

## 時刻処理

system prompt は、ユーザーの timezone が既知の場合、専用の **Current Date & Time** セクションを含みます。prompt cache を安定させるため、現在は **time zone** のみを含みます（動的な clock や time format は含みません）。

agent が現在時刻を必要とする場合は `session_status` を使用します。status card には timestamp line が含まれます。同じ tool は、session ごとの model override（`model=default` で解除）を任意で設定することもできます。

次で設定します。

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完全な動作の詳細は [Date & Time](/ja-JP/date-time) を参照してください。

## Skills

対象となる skill が存在する場合、OpenClaw はコンパクトな **available skills list**
（`formatSkillsForPrompt`）を注入し、各 skill の **file path** を含めます。prompt は、一覧にある場所（workspace、managed、または bundled）の SKILL.md を読み込むために `read` を使用するようモデルに指示します。対象となる skill がない場合、Skills セクションは省略されます。

Eligibility には、skill metadata gates、runtime environment/config checks、`agents.defaults.skills` または
`agents.list[].skills` が設定されている場合の effective agent skill allowlist が含まれます。

Plugin-bundled skills は、所有する Plugin が有効な場合にのみ eligible です。これにより、tool Plugin は、そのガイダンスをすべての tool description に直接埋め込まずに、より深い operation guide を公開できます。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

これにより、targeted skill usage を可能にしつつ、base prompt を小さく保てます。

skills list の budget は skills subsystem が所有します。

- Global default: `skills.limits.maxSkillsPromptChars`
- Per-agent override: `agents.list[].skillsLimits.maxSkillsPromptChars`

汎用の境界付きランタイム抜粋は、異なるサーフェスを使用します:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

この分割により、Skillsのサイズ指定を、`memory_get`、ライブツール結果、Compaction後の AGENTS.md 更新などのランタイム読み取り/注入サイズ指定と分離できます。

## ドキュメント

システムプロンプトには **ドキュメント** セクションが含まれます。ローカルドキュメントが利用可能な場合、ローカルの OpenClaw ドキュメントディレクトリ（Git チェックアウト内の `docs/`、またはバンドルされた npm パッケージのドキュメント）を指します。ローカルドキュメントが利用できない場合は、[https://docs.openclaw.ai](https://docs.openclaw.ai) にフォールバックします。

同じセクションには OpenClaw のソース場所も含まれます。Git チェックアウトではローカルのソースルートが公開されるため、エージェントはコードを直接調査できます。パッケージインストールには GitHub のソース URL が含まれ、ドキュメントが不完全または古い場合はそこでソースを確認するようエージェントに伝えます。プロンプトには、公開ドキュメントミラー、コミュニティ Discord、Skills発見用の ClawHub（[https://clawhub.ai](https://clawhub.ai)）についても記載されています。OpenClaw の動作、コマンド、設定、またはアーキテクチャについてはまずドキュメントを参照し、可能な場合は `openclaw status` を自分で実行するようモデルに伝えます（アクセス権がない場合のみユーザーに依頼します）。設定については特に、正確なフィールドレベルのドキュメントと制約を得るために `gateway` ツールアクション `config.schema.lookup` を参照し、その後、より広範なガイダンスとして `docs/gateway/configuration.md` と `docs/gateway/configuration-reference.md` を参照するようエージェントに指示します。

## 関連

- [エージェントランタイム](/ja-JP/concepts/agent)
- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
