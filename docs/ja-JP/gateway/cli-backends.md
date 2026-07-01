---
read_when:
    - API プロバイダーが失敗したときの信頼できるフォールバックが必要である
    - ローカルの AI CLI を実行していて、それらを再利用したい
    - MCP ループバックブリッジによる CLI バックエンドのツールアクセスを理解したい
summary: 'CLI バックエンド: 任意の MCP ツールブリッジを備えたローカル AI CLI フォールバック'
title: CLIバックエンド
x-i18n:
    generated_at: "2026-07-01T02:58:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2296c5e429f3acbc8375892e4539c397c09b973a8d15e21729b51985952dff29
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw は、API プロバイダーが停止している、レート制限されている、または一時的に誤動作している場合の**テキストのみのフォールバック**として、**ローカル AI CLI**を実行できます。
これは意図的に保守的な設計です。

- **OpenClaw ツールは直接注入されません**が、`bundleMcp: true` のバックエンドは
  local loopback MCP ブリッジ経由で Gateway ツールを受け取れます。
- 対応する CLI 向けの **JSONL ストリーミング**。
- **セッションに対応**しています（後続ターンの一貫性が保たれます）。
- CLI が画像パスを受け付ける場合は、**画像をそのまま渡せます**。

これは主要経路ではなく、**セーフティネット**として設計されています。外部 API に依存せず、
「常に動作する」テキスト応答が必要な場合に使います。

ACP セッション制御、バックグラウンドタスク、スレッド/会話のバインディング、
永続的な外部コーディングセッションを備えた完全なハーネスランタイムが必要な場合は、
代わりに [ACP Agents](/ja-JP/tools/acp-agents) を使用してください。CLI バックエンドは ACP ではありません。

<Tip>
  新しいバックエンド Plugin を構築していますか？
  [CLI backend plugins](/ja-JP/plugins/cli-backend-plugins) を使用してください。このページは、
  すでに登録済みのバックエンドを設定および運用するユーザー向けです。
</Tip>

## 初心者向けクイックスタート

Claude Code CLI は**設定なし**で使用できます（バンドルされた Anthropic Plugin が
デフォルトバックエンドを登録します）。

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

明示的なエージェントリストが設定されていない場合、`main` はデフォルトのエージェント ID です。
複数のエージェントを使う場合は、実行したいエージェント ID に置き換えてください。

Gateway が launchd/systemd の下で実行され、PATH が最小限の場合は、コマンドパスだけを追加します。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

これで完了です。CLI 自体以外に、キーや追加の認証設定は不要です。

バンドルされた CLI バックエンドを Gateway ホスト上の**主要メッセージプロバイダー**として使う場合、
OpenClaw は、設定がモデル参照または `agents.defaults.cliBackends` でそのバックエンドを
明示的に参照していると、所有元のバンドル Plugin を自動読み込みするようになりました。

## フォールバックとして使う

CLI バックエンドをフォールバックリストに追加すると、主要モデルが失敗した場合にのみ実行されます。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

注記:

- `agents.defaults.models`（許可リスト）を使う場合は、CLI バックエンドモデルもそこに含める必要があります。
- 主要プロバイダーが失敗した場合（認証、レート制限、タイムアウト）、OpenClaw は
  次に CLI バックエンドを試します。

## 設定の概要

すべての CLI バックエンドは次の配下にあります。

```
agents.defaults.cliBackends
```

各エントリーは**プロバイダー ID**（例: `claude-cli`, `my-cli`）でキー付けされます。
プロバイダー ID はモデル参照の左側になります。

```
<provider>/<model>
```

### 設定例

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## 仕組み

1. プロバイダープレフィックス（`claude-cli/...`）に基づいて**バックエンドを選択**します。
2. 同じ OpenClaw プロンプト + ワークスペースコンテキストを使って**システムプロンプトを構築**します。
3. 履歴の一貫性が保たれるように、（対応している場合は）セッション ID 付きで **CLI を実行**します。
   バンドルされた `claude-cli` バックエンドは、OpenClaw セッションごとに Claude stdio プロセスを維持し、
   後続ターンを stream-json stdin 経由で送信します。
4. **出力を解析**（JSON またはプレーンテキスト）し、最終テキストを返します。
5. バックエンドごとに**セッション ID を永続化**し、後続ターンで同じ CLI セッションを再利用します。

<Note>
バンドルされた Anthropic の `claude-cli` バックエンドは再びサポートされています。Anthropic スタッフから、
OpenClaw 方式の Claude CLI 利用は再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、
OpenClaw はこの連携における `claude -p` の利用を認可済みとして扱います。
</Note>

バンドルされた Anthropic の `claude-cli` バックエンドは、OpenClaw Skills について Claude Code のネイティブ Skills
リゾルバーを優先します。現在の Skills スナップショットに、実体化されたパスを持つ選択済み skill が少なくとも 1 つ含まれる場合、
OpenClaw は一時的な Claude Code Plugin を `--plugin-dir` 付きで渡し、重複する OpenClaw Skills カタログを
追記されるシステムプロンプトから省略します。スナップショットに実体化された Plugin skill がない場合、OpenClaw は
フォールバックとしてプロンプトカタログを維持します。Skill の環境/API キー上書きは、実行時に OpenClaw によって
子プロセス環境へ引き続き適用されます。

Claude CLI には独自の非対話権限モードもあります。OpenClaw は、Claude 固有のポリシー設定を追加するのではなく、
それを既存の exec ポリシーにマップします。OpenClaw 管理の Claude ライブセッションでは、有効な OpenClaw exec ポリシーが
権威となります。YOLO（`tools.exec.security: "full"` と `tools.exec.ask: "off"`）では Claude が
`--permission-mode bypassPermissions` で起動され、制限的な有効 exec ポリシーでは Claude が
`--permission-mode default` で起動されます。エージェントごとの `agents.list[].tools.exec` 設定は、
そのエージェントについてグローバルな `tools.exec` を上書きします。生の Claude バックエンド引数に
`--permission-mode` が含まれていても、ライブ Claude 起動ではそのフラグが有効な OpenClaw exec ポリシーに合わせて正規化されます。

バンドルされた Anthropic の `claude-cli` バックエンドは、OpenClaw の `/think` レベルも、off 以外のレベルについて
Claude Code のネイティブ `--effort` フラグにマップします。`minimal` と `low` は `low` に、`adaptive` と
`medium` は `medium` にマップされ、`high`、`xhigh`、`max` は直接マップされます。他の CLI バックエンドでは、
`/think` が起動される CLI に影響できるようになる前に、所有元 Plugin が同等の argv マッパーを宣言する必要があります。

OpenClaw がバンドルされた `claude-cli` バックエンドを使用する前に、Claude Code 自体が同じホストですでに
ログイン済みである必要があります。

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker インストールでは、Claude Code はホスト上だけでなく、永続化されたコンテナホーム内にインストールされ、
ログイン済みである必要があります。
[Docker の Claude CLI backend](/ja-JP/install/docker#claude-cli-backend-in-docker) を参照してください。

`agents.defaults.cliBackends.claude-cli.command` は、`claude` バイナリがまだ `PATH` 上にない場合にのみ使用してください。

## セッション

- CLI がセッションに対応している場合は、ID を複数のフラグに挿入する必要があるときに、
  `sessionArg`（例: `--session-id`）または `sessionArgs`（プレースホルダー `{sessionId}`）を設定します。
- CLI が異なるフラグを持つ**再開サブコマンド**を使用する場合は、`resumeArgs`（再開時に `args` を置き換える）と、
  必要に応じて `resumeOutput`（非 JSON 再開用）を設定します。
- `sessionMode`:
  - `always`: 常にセッション ID を送信します（保存済みがなければ新しい UUID）。
  - `existing`: 以前に保存されたセッション ID がある場合のみ送信します。
  - `none`: セッション ID を送信しません。
- `claude-cli` はデフォルトで `liveSession: "claude-stdio"`、`output: "jsonl"`、
  `input: "stdin"` になっているため、アクティブな間は後続ターンがライブ Claude プロセスを再利用します。
  トランスポートフィールドを省略したカスタム設定を含め、warm stdio が現在のデフォルトです。Gateway が再起動するか
  アイドルプロセスが終了した場合、OpenClaw は保存済み Claude セッション ID から再開します。保存済みセッション ID は、
  再開前に既存の読み取り可能なプロジェクトトランスクリプトに照らして検証されるため、実体のないバインディングは
  `--resume` の下で新しい Claude CLI セッションを暗黙に開始するのではなく、`reason=transcript-missing` でクリアされます。
- Claude ライブセッションは、境界付き JSONL 出力ガードを維持します。デフォルトでは、1 ターンあたり最大
  8 MiB と 20,000 生 JSONL 行が許可されます。ツールが多い Claude ターンでは、バックエンドごとに
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  と `maxTurnLines` で引き上げられます。OpenClaw はこれらの設定を 64 MiB と 100,000 行に制限します。
- 保存済み CLI セッションは、プロバイダー所有の継続性です。暗黙の日次セッションリセットでは切断されません。
  `/reset` と明示的な `session.reset` ポリシーでは引き続き切断されます。
- 新しい CLI セッションは通常、OpenClaw の Compaction サマリーと Compaction 後の末尾からのみ再シードします。
  Compaction 前に無効化された短いセッションを復旧するために、バックエンドは
  `reseedFromRawTranscriptWhenUncompacted: true` でオプトインできます。OpenClaw はそれでも、生トランスクリプトの
  再シードを境界付きに保ち、CLI トランスクリプトの欠落、システムプロンプト/MCP 変更、session-expired 再試行などの
  安全な無効化に限定します。認証プロファイルまたは資格情報エポックの変更では、生トランスクリプト履歴を再シードしません。

シリアライズに関する注記:

- `serialize: true` は同じレーンの実行順序を維持します。
- ほとんどの CLI は 1 つのプロバイダーレーンでシリアライズします。
- OpenClaw は、選択された認証 ID が変わった場合、保存済み CLI セッションの再利用を破棄します。
  これには、認証プロファイル ID、静的 API キー、静的トークン、または CLI が公開する場合の OAuth アカウント ID の変更が含まれます。
  OAuth アクセストークンとリフレッシュトークンのローテーションでは、保存済み CLI セッションは切断されません。
  CLI が安定した OAuth アカウント ID を公開しない場合、OpenClaw はその CLI に再開権限の強制を任せます。

## claude-cli セッションからのフォールバック前置き

`claude-cli` の試行が [`agents.defaults.model.fallbacks`](/ja-JP/concepts/model-failover) 内の非 CLI 候補へフェイルオーバーする場合、
OpenClaw は `~/.claude/projects/` にある Claude Code のローカル JSONL トランスクリプトから収集したコンテキスト前置きで
次の試行をシードします。このシードがないと、OpenClaw 自身のセッショントランスクリプトは `claude-cli` 実行では空のため、
フォールバックプロバイダーはコールドスタートになります。

- 前置きは最新の `/compact` サマリーまたは `compact_boundary` マーカーを優先し、その後、文字数予算の範囲で
  境界後の直近ターンを追加します。境界前のターンは、サマリーがすでにそれらを表しているため破棄されます。
- ツールブロックは、プロンプト予算を正直に保つため、コンパクトな `(tool call: name)` と
  `(tool result: …)` のヒントにまとめられます。サマリーがあふれた場合は `(truncated)` とラベル付けされます。
- 同一プロバイダーの `claude-cli` から `claude-cli` へのフォールバックは、Claude 自身の `--resume` に依存し、
  前置きをスキップします。
- シードは既存の Claude セッションファイルパス検証を再利用するため、任意のパスは読み取れません。

## 画像（パススルー）

CLI が画像パスを受け付ける場合は、`imageArg` を設定します。

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw は base64 画像を一時ファイルに書き込みます。`imageArg` が設定されている場合、それらのパスは CLI 引数として渡されます。
`imageArg` がない場合、OpenClaw はファイルパスをプロンプトに追記します（パス注入）。これは、プレーンなパスからローカルファイルを
自動読み込みする CLI には十分です。

## 入力 / 出力

- `output: "json"`（デフォルト）は JSON の解析を試み、テキスト + セッション ID を抽出します。
- Gemini CLI JSON 出力では、`usage` が欠落または空の場合、OpenClaw は返信テキストを `response` から、
  使用量を `stats` から読み取ります。バンドルされた Gemini CLI のデフォルトは `stream-json` を使用しますが、
  古い `--output-format json` の上書きは引き続き JSON パーサーを使用します。
- `output: "jsonl"` は JSONL ストリームを解析し、最終的なエージェントメッセージと、存在する場合はセッション識別子を抽出します。
- `output: "text"` は stdout を最終応答として扱います。

入力モード:

- `input: "arg"` (デフォルト) は、プロンプトを最後の CLI 引数として渡します。
- `input: "stdin"` は、stdin 経由でプロンプトを送信します。
- プロンプトが非常に長く、`maxPromptArgChars` が設定されている場合は、stdin が使用されます。

## デフォルト (Plugin 所有)

バンドルされた CLI バックエンドのデフォルトは、それを所有する Plugin にあります。たとえば、
Anthropic は `claude-cli` を所有し、Google は `google-gemini-cli` を所有します。OpenAI Codex
agent 実行は `openai/*` 経由で Codex app-server harness を使用します。OpenClaw は
バンドルされた `codex-cli` バックエンドを登録しなくなりました。

バンドルされた Anthropic Plugin は `claude-cli` のデフォルトを登録します。

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

バンドルされた Google Plugin も `google-gemini-cli` のデフォルトを登録します。

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件: ローカルの Gemini CLI がインストールされ、`PATH` 上で
`gemini` として利用可能である必要があります (`brew install gemini-cli` または
`npm install -g @google/gemini-cli`)。

Gemini CLI 出力に関する注記:

- デフォルトの `stream-json` パーサーは、assistant の `message` イベント、tool イベント、
  最終 `result` usage、および致命的な Gemini error イベントを読み取ります。
- Gemini の引数を `--output-format json` に上書きした場合、OpenClaw はその
  バックエンドを `output: "json"` に戻して正規化し、JSON の `response`
  フィールドから返信テキストを読み取ります。
- `usage` が存在しない、または空の場合、usage は `stats` にフォールバックします。
- `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
- `stats.input` が欠落している場合、OpenClaw は
  `stats.input_tokens - stats.cached` から入力トークンを導出します。

必要な場合にのみ上書きしてください (一般的なのは絶対 `command` パス)。

## Plugin 所有のデフォルト

CLI バックエンドのデフォルトは、現在 Plugin サーフェスの一部です。

- Plugin は `api.registerCliBackend(...)` でそれらを登録します。
- バックエンドの `id` は、モデル参照内の provider プレフィックスになります。
- `agents.defaults.cliBackends.<id>` のユーザー設定は、引き続き Plugin デフォルトを上書きします。
- バックエンド固有の設定クリーンアップは、任意の
  `normalizeConfig` フックを通じて Plugin 所有のままです。

小さなプロンプト/メッセージ互換 shim が必要な Plugin は、
provider や CLI バックエンドを置き換えずに双方向テキスト変換を宣言できます。

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` は CLI に渡されるシステムプロンプトとユーザープロンプトを書き換えます。`output`
は、OpenClaw が自身の制御マーカーとチャネル配信を処理する前に、
ストリーミングされた assistant テキストとパース済みの最終テキストを書き換えます。provider-backed のモデル呼び出しでは、
`output` は、ストリーム修復後、tool 実行前に、構造化された tool-call 引数内の文字列値も復元します。生の provider JSON フラグメントは
変更されません。consumer は、構造化された partial、end、または result ペイロードを使用してください。

provider 固有の JSONL イベントを出力する CLI では、その
バックエンドの設定に `jsonlDialect` を設定します。サポートされる dialect は、Claude
Code 互換ストリーム用の `claude-stream-json` と、Gemini CLI `stream-json`
イベント用の `gemini-stream-json` です。

## ネイティブ Compaction の所有権

一部の CLI バックエンドは **自身の** transcript を圧縮する agent を実行するため、OpenClaw は
それらに対してセーフガード summarizer を実行してはいけません。そうするとバックエンド自身の
compaction と競合し、ターンが hard-fail する可能性があります。

`claude-cli` には harness エンドポイントがありません。Claude Code は内部で圧縮するため、
`ownsNativeCompaction: true` を宣言し、OpenClaw は compaction パスから no-op を返します。
Codex のようなネイティブ harness セッションは、代わりに harness compaction エンドポイントへルーティングを続けます。

バックエンドが compaction を所有するため、claude-cli セッションで OpenClaw のセーフガードが発火しないようにする目的だけで
`contextTokens: 1_000_000` を設定していた古い暫定策は **不要になりました**。この opt-out がそれを置き換えます。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

`ownsNativeCompaction` は、本当に自身の compaction を所有するバックエンドにのみ宣言してください。そのバックエンドは、
context window に近づいたときに自身の transcript を確実に制限し、再開可能なセッション
(例: `--resume` / `--session-id`) を永続化する必要があります。そうでない場合、延期されたセッションが
予算超過のまま残る可能性があります。一致する `agentHarnessId` セッションは引き続き harness エンドポイントへルーティングされます。

## バンドル MCP オーバーレイ

CLI バックエンドは OpenClaw tool call を直接受け取りませんが、バックエンドは
`bundleMcp: true` により生成された MCP 設定オーバーレイを opt-in できます。

現在のバンドル動作:

- `claude-cli`: 生成された strict MCP 設定ファイル
- `google-gemini-cli`: 生成された Gemini システム設定ファイル

bundle MCP が有効な場合、OpenClaw は次を行います。

- gateway tool を CLI プロセスに公開する loopback HTTP MCP server を生成します
- セッションごとの token (`OPENCLAW_MCP_TOKEN`) でブリッジを認証します
- tool アクセスを現在のセッション、アカウント、チャネル context にスコープします
- 現在の workspace で有効な bundle-MCP server を読み込みます
- 既存のバックエンド MCP config/settings shape とマージします
- 所有する extension のバックエンド所有 integration mode を使用して起動設定を書き換えます

MCP server が有効でない場合でも、バックエンドが bundle MCP に opt-in していれば、
OpenClaw は background 実行が分離されたままになるよう strict config を注入します。

セッションスコープのバンドル MCP runtime はセッション内で再利用するためにキャッシュされ、その後
`mcp.sessionIdleTtlMs` ミリ秒のアイドル時間後に回収されます (デフォルトは 10
分、無効にするには `0` を設定)。auth probe、
slug 生成、active-memory recall などの one-shot embedded 実行は、実行終了時にクリーンアップを要求するため、stdio
child や Streamable HTTP/SSE stream が実行より長く残りません。

## 履歴再シード上限

新しい CLI セッションが以前の OpenClaw transcript からシードされる場合 (たとえば
`session_expired` retry の後)、レンダリングされる
`<conversation_history>` ブロックには、reseed prompt が
肥大化しないよう上限が適用されます。デフォルトは `12288` 文字 (約 3000 token) です。

Claude CLI バックエンドは、解決された
Claude context tier から導出されたより大きな上限を自動的に使用します。標準の 200K-token Claude 実行ではより大きな transcript
slice を保持し、1M-token Claude 実行ではさらに大きな slice を保持します。一方、他の CLI
バックエンドは保守的なデフォルトを維持します。

- この上限は、reseed prompt の prior-history ブロックだけを管理します。live-session
  出力上限は `reliability.outputLimits` の下で別途調整されます
  ([Sessions](#sessions) を参照)。

## 制限事項

- **OpenClaw tool call を直接注入しません。** OpenClaw は
  CLI バックエンドプロトコルへ tool call を注入しません。バックエンドは
  `bundleMcp: true` に opt-in した場合にのみ gateway tool を認識します。
- **Streaming はバックエンド固有です。** 一部のバックエンドは JSONL を stream し、他のバックエンドは
  exit まで buffer します。
- **構造化出力** は CLI の JSON 形式に依存します。

## トラブルシューティング

- **CLI が見つからない**: `command` を完全なパスに設定します。
- **モデル名が間違っている**: `modelAliases` を使用して `provider/model` → CLI model にマッピングします。
- **セッション継続性がない**: `sessionArg` が設定され、`sessionMode` が
  `none` ではないことを確認します。
- **画像が無視される**: `imageArg` を設定します (そして CLI が file path をサポートしていることを確認します)。

## 関連

- [Gateway runbook](/ja-JP/gateway)
- [ローカルモデル](/ja-JP/gateway/local-models)
