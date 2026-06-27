---
read_when:
    - APIプロバイダーが失敗したときに信頼できるフォールバックが必要な場合
    - ローカルのAI CLIを実行していて、それらを再利用したい
    - CLIバックエンドツールアクセス用のMCP loopbackブリッジを理解したい
summary: 'CLI バックエンド: オプションの MCP ツールブリッジを備えたローカル AI CLI フォールバック'
title: CLI バックエンド
x-i18n:
    generated_at: "2026-06-27T11:21:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw は、API プロバイダーが停止中、レート制限中、または一時的に不安定なときに、**テキスト専用フォールバック**として**ローカル AI CLI**を実行できます。これは意図的に保守的な設計です。

- **OpenClaw ツールは直接注入されません**が、`bundleMcp: true` のバックエンドは
  loopback MCP ブリッジ経由で Gateway ツールを受け取れます。
- 対応している CLI 向けの **JSONL ストリーミング**。
- **セッションに対応**しています（後続ターンの一貫性が保たれます）。
- CLI が画像パスを受け付ける場合、**画像をそのまま渡せます**。

これは主要経路ではなく、**安全網**として設計されています。外部 API に依存せず、
「常に動く」テキスト応答が必要な場合に使ってください。

ACP セッション制御、バックグラウンドタスク、スレッド/会話の紐づけ、永続的な外部コーディングセッションを備えた完全なハーネスランタイムが必要な場合は、代わりに
[ACP Agents](/ja-JP/tools/acp-agents) を使ってください。CLI バックエンドは ACP ではありません。

<Tip>
  新しいバックエンド Plugin を構築していますか？
  [CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins) を使ってください。このページは、すでに登録済みのバックエンドを設定および運用するユーザー向けです。
</Tip>

## 初心者向けクイックスタート

Claude Code CLI は **設定なし**で使えます（バンドルされた Anthropic Plugin が
デフォルトバックエンドを登録します）。

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

明示的なエージェントリストが設定されていない場合、`main` はデフォルトのエージェント ID です。
複数のエージェントを使う場合は、実行したいエージェント ID に置き換えてください。

Gateway が launchd/systemd 配下で動作し、PATH が最小限の場合は、コマンドパスだけを追加します。

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

バンドルされた CLI バックエンドを Gateway ホスト上の**主要メッセージプロバイダー**として使う場合、設定がモデル参照内または
`agents.defaults.cliBackends` 配下でそのバックエンドを明示的に参照していれば、OpenClaw は所有元のバンドル Plugin を自動ロードします。

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

注意:

- `agents.defaults.models`（許可リスト）を使う場合は、CLI バックエンドモデルもそこに含める必要があります。
- 主要プロバイダーが失敗した場合（認証、レート制限、タイムアウト）、OpenClaw は次に CLI バックエンドを試します。

## 設定の概要

すべての CLI バックエンドは次の配下にあります。

```
agents.defaults.cliBackends
```

各エントリは **プロバイダー ID**（例: `claude-cli`, `my-cli`）をキーにします。
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

1. プロバイダー接頭辞（`claude-cli/...`）に基づいて**バックエンドを選択**します。
2. 同じ OpenClaw プロンプト + ワークスペースコンテキストを使って**システムプロンプトを構築**します。
3. 履歴の一貫性が保たれるよう、対応している場合はセッション ID 付きで **CLI を実行**します。
   バンドルされた `claude-cli` バックエンドは、OpenClaw セッションごとに Claude stdio プロセスを維持し、
   stream-json stdin 経由で後続ターンを送信します。
4. **出力を解析**（JSON またはプレーンテキスト）し、最終テキストを返します。
5. バックエンドごとに**セッション ID を永続化**するため、後続ターンは同じ CLI セッションを再利用します。

<Note>
バンドルされた Anthropic `claude-cli` バックエンドは再びサポートされています。Anthropic スタッフから、OpenClaw 形式の Claude CLI 利用は再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの連携における `claude -p` の利用を認可されたものとして扱います。
</Note>

バンドルされた Anthropic `claude-cli` バックエンドは、OpenClaw skills について Claude Code ネイティブの skill リゾルバーを優先します。現在の skills スナップショットに、具体化されたパスを持つ選択済み skill が少なくとも 1 つ含まれる場合、OpenClaw は `--plugin-dir` 付きの一時 Claude Code plugin を渡し、追加されるシステムプロンプトから重複する OpenClaw skills カタログを省略します。スナップショットに具体化された plugin skill がない場合、OpenClaw はフォールバックとしてプロンプトカタログを保持します。Skill の env/API キーオーバーライドは、実行時の子プロセス環境に OpenClaw によって引き続き適用されます。

Claude CLI には独自の非対話型権限モードもあります。OpenClaw は Claude 固有のポリシー設定を追加するのではなく、それを既存の exec ポリシーにマッピングします。
OpenClaw 管理の Claude ライブセッションでは、有効な OpenClaw exec ポリシーが権威を持ちます。YOLO（`tools.exec.security: "full"` と
`tools.exec.ask: "off"`）は Claude を `--permission-mode bypassPermissions` で起動し、制限的な有効 exec ポリシーでは Claude を `--permission-mode default` で起動します。エージェントごとの
`agents.list[].tools.exec` 設定は、そのエージェントに対してグローバルな `tools.exec` を上書きします。生の Claude バックエンド引数には引き続き `--permission-mode` を含められますが、ライブ Claude 起動ではそのフラグが有効な OpenClaw exec ポリシーに合わせて正規化されます。

バンドルされた Anthropic `claude-cli` バックエンドは、OpenClaw の `/think` レベルも、オフ以外のレベルについて Claude Code ネイティブの `--effort` フラグにマッピングします。`minimal` と
`low` は `low` に、`adaptive` と `medium` は `medium` に、`high`、
`xhigh`、`max` は直接マッピングされます。他の CLI バックエンドでは、`/think` が起動される CLI に影響できるようになる前に、所有元 Plugin が同等の argv マッパーを宣言する必要があります。

OpenClaw がバンドルされた `claude-cli` バックエンドを使用できるようになる前に、Claude Code 自体が同じホスト上でログイン済みである必要があります。

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker インストールでは、Claude Code がホスト上だけでなく、永続化されたコンテナホーム内にインストールされ、ログイン済みである必要があります。
[Docker 内の Claude CLI バックエンド](/ja-JP/install/docker#claude-cli-backend-in-docker)を参照してください。

`agents.defaults.cliBackends.claude-cli.command` は、`claude` バイナリがまだ `PATH` 上にない場合にのみ使ってください。

## セッション

- CLI がセッションに対応している場合は、ID を複数のフラグに挿入する必要があるときに、`sessionArg`（例: `--session-id`）または
  `sessionArgs`（プレースホルダー `{sessionId}`）を設定します。
- CLI が異なるフラグを持つ **resume サブコマンド**を使う場合は、
  `resumeArgs`（再開時に `args` を置き換えます）と、必要に応じて `resumeOutput`
  （非 JSON 再開用）を設定します。
- `sessionMode`:
  - `always`: 常にセッション ID を送信します（保存済みがなければ新しい UUID）。
  - `existing`: 以前に保存されたセッション ID がある場合のみ送信します。
  - `none`: セッション ID を送信しません。
- `claude-cli` はデフォルトで `liveSession: "claude-stdio"`、`output: "jsonl"`、
  `input: "stdin"` を使うため、アクティブな間は後続ターンがライブ Claude プロセスを再利用します。トランスポートフィールドを省略するカスタム設定も含め、温かい stdio が現在のデフォルトです。Gateway が再起動するか、アイドルプロセスが終了した場合、OpenClaw は保存された Claude セッション ID から再開します。保存されたセッション ID は、再開前に既存の読み取り可能なプロジェクトトランスクリプトと照合されるため、幻のバインディングは `--resume` 配下で新しい Claude CLI セッションを黙って開始するのではなく、`reason=transcript-missing` でクリアされます。
- Claude ライブセッションは、境界付きの JSONL 出力ガードを維持します。デフォルトでは、ターンあたり最大 8 MiB と 20,000 行の生 JSONL が許可されます。ツールの多い Claude ターンでは、バックエンドごとに
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  と `maxTurnLines` で引き上げられます。OpenClaw はこれらの設定を 64 MiB と 100,000 行にクランプします。
- 保存済み CLI セッションは、プロバイダー所有の継続性です。暗黙の日次セッションリセットでは切断されませんが、`/reset` と明示的な `session.reset` ポリシーでは切断されます。
- 新しい CLI セッションは通常、OpenClaw の Compaction サマリーと Compaction 後の末尾からのみ再シードします。Compaction 前に無効化された短いセッションを復旧するために、バックエンドは
  `reseedFromRawTranscriptWhenUncompacted: true` でオプトインできます。OpenClaw は引き続き生トランスクリプトの再シードを境界付きにし、CLI トランスクリプトの欠落、システムプロンプト/MCP 変更、セッション期限切れリトライなどの安全な無効化に限定します。認証プロファイルや認証情報エポックの変更では、生トランスクリプト履歴を再シードすることはありません。

シリアライズに関する注意:

- `serialize: true` は同じレーンの実行順序を維持します。
- ほとんどの CLI は 1 つのプロバイダーレーンでシリアライズします。
- OpenClaw は、選択された認証 ID が変更された場合、保存済み CLI セッションの再利用を取りやめます。これには、認証プロファイル ID、静的 API キー、静的トークン、または CLI が公開している場合の OAuth アカウント ID の変更が含まれます。OAuth アクセストークンとリフレッシュトークンのローテーションでは、保存済み CLI セッションは切断されません。CLI が安定した OAuth アカウント ID を公開しない場合、OpenClaw はその CLI に再開権限の強制を任せます。

## claude-cli セッションからのフォールバックプレリュード

`claude-cli` の試行が失敗して、[`agents.defaults.model.fallbacks`](/ja-JP/concepts/model-failover) 内の非 CLI 候補にフェイルオーバーする場合、OpenClaw は `~/.claude/projects/` にある Claude Code のローカル JSONL トランスクリプトから収集したコンテキストプレリュードで次の試行をシードします。このシードがないと、OpenClaw 自身のセッショントランスクリプトは `claude-cli` 実行では空のため、フォールバックプロバイダーはコールドスタートします。

- プレリュードは最新の `/compact` サマリーまたは `compact_boundary`
  マーカーを優先し、その後、文字数予算まで境界後の直近ターンを追加します。境界前のターンは、すでにサマリーがそれらを表しているため破棄されます。
- ツールブロックは、プロンプト予算を正直に保つため、コンパクトな `(tool call: name)` と
  `(tool result: …)` のヒントにまとめられます。サマリーがあふれる場合は
  `(truncated)` とラベル付けされます。
- 同一プロバイダーの `claude-cli` から `claude-cli` へのフォールバックは、Claude 自身の
  `--resume` に依存し、プレリュードをスキップします。
- シードは既存の Claude セッションファイルパス検証を再利用するため、任意のパスは読み取れません。

## 画像（パススルー）

CLI が画像パスを受け付ける場合は、`imageArg` を設定します。

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw は base64 画像を一時ファイルに書き込みます。`imageArg` が設定されている場合、それらのパスは CLI 引数として渡されます。`imageArg` がない場合、OpenClaw はファイルパスをプロンプトに追加します（パス注入）。これは、プレーンなパスからローカルファイルを自動読み込みする CLI には十分です。

## 入力 / 出力

- `output: "json"`（デフォルト）は JSON の解析を試み、テキスト + セッション ID を抽出します。
- Gemini CLI JSON 出力では、`usage` が欠落または空の場合、OpenClaw は応答テキストを `response` から、使用量を
  `stats` から読み取ります。バンドルされた Gemini CLI のデフォルトは
  `stream-json` を使いますが、古い `--output-format json` オーバーライドは引き続き JSON パーサーを使います。
- `output: "jsonl"` は JSONL ストリームを解析し、存在する場合は最終エージェントメッセージとセッション識別子を抽出します。
- `output: "text"` は stdout を最終応答として扱います。

入力モード:

- `input: "arg"` (デフォルト) はプロンプトを最後の CLI 引数として渡します。
- `input: "stdin"` は stdin 経由でプロンプトを送信します。
- プロンプトが非常に長く、`maxPromptArgChars` が設定されている場合は、stdin が使われます。

## デフォルト (プラグイン所有)

バンドルされた CLI バックエンドのデフォルトは、それを所有するプラグイン側にあります。たとえば、
Anthropic は `claude-cli` を所有し、Google は `google-gemini-cli` を所有します。OpenAI Codex
agent 実行は `openai/*` 経由で Codex app-server ハーネスを使います。OpenClaw は
バンドルされた `codex-cli` バックエンドを登録しなくなりました。

バンドルされた Anthropic プラグインは `claude-cli` のデフォルトを登録します。

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

バンドルされた Google プラグインも `google-gemini-cli` のデフォルトを登録します。

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
`gemini` として利用できる必要があります (`brew install gemini-cli` または
`npm install -g @google/gemini-cli`)。

Gemini CLI 出力に関する注意:

- デフォルトの `stream-json` パーサーは、assistant の `message` イベント、ツールイベント、
  最終 `result` の使用量、および致命的な Gemini エラーイベントを読み取ります。
- Gemini の引数を `--output-format json` に上書きした場合、OpenClaw はその
  バックエンドを `output: "json"` に正規化し直し、JSON の `response`
  フィールドから返信テキストを読み取ります。
- `usage` が存在しない、または空の場合、使用量は `stats` にフォールバックします。
- `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
- `stats.input` がない場合、OpenClaw は
  `stats.input_tokens - stats.cached` から入力トークンを導出します。

必要な場合のみ上書きしてください (一般的なのは絶対 `command` パス)。

## プラグイン所有のデフォルト

CLI バックエンドのデフォルトは、現在はプラグインサーフェスの一部です。

- プラグインは `api.registerCliBackend(...)` で登録します。
- バックエンドの `id` はモデル参照内のプロバイダープレフィックスになります。
- `agents.defaults.cliBackends.<id>` 内のユーザー設定は、引き続きプラグインのデフォルトを上書きします。
- バックエンド固有の設定クリーンアップは、任意の
  `normalizeConfig` フックを通じてプラグイン所有のままです。

ごく小さなプロンプト/メッセージ互換性 shim が必要なプラグインは、
プロバイダーや CLI バックエンドを置き換えずに双方向テキスト変換を宣言できます。

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
は OpenClaw が独自の制御マーカーとチャンネル配信を処理する前に、ストリームされた assistant デルタと解析済みの最終テキストを書き換えます。

プロバイダー固有の JSONL イベントを出力する CLI では、そのバックエンド設定に `jsonlDialect` を設定します。対応している dialect は、Claude
Code 互換ストリーム向けの `claude-stream-json` と、Gemini CLI `stream-json`
イベント向けの `gemini-stream-json` です。

## ネイティブ Compaction の所有権

一部の CLI バックエンドは **独自の** トランスクリプトを Compaction する agent を実行するため、OpenClaw は
それらに対して安全策の要約処理を実行してはいけません。実行するとバックエンド自身の
Compaction と競合し、ターンがハード失敗する可能性があります。

`claude-cli` にはハーネスエンドポイントがありません。Claude Code は内部で Compaction するため、
`ownsNativeCompaction: true` を宣言し、OpenClaw は Compaction パスから no-op を返します。
Codex などのネイティブハーネスセッションは、代わりにハーネスの Compaction エンドポイントへルーティングされ続けます。

バックエンドが Compaction を所有するため、claude-cli セッションで OpenClaw の安全策が発火しないようにする目的だけで
`contextTokens: 1_000_000` を設定するという古い暫定策は **不要になりました**。この opt-out がそれを置き換えます。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

`ownsNativeCompaction` は、本当に Compaction を所有するバックエンドに対してのみ宣言してください。そのバックエンドは、コンテキストウィンドウに近づくにつれて自身のトランスクリプトを確実に制限し、再開可能なセッション (例: `--resume` / `--session-id`) を永続化する必要があります。そうでないと、延期されたセッションが予算超過のままになる可能性があります。一致する `agentHarnessId` セッションは引き続きハーネスエンドポイントへルーティングされます。

## バンドル MCP オーバーレイ

CLI バックエンドは OpenClaw ツール呼び出しを直接受け取りませんが、バックエンドは
`bundleMcp: true` によって生成 MCP 設定オーバーレイに opt in できます。

現在のバンドル動作:

- `claude-cli`: 生成された strict MCP 設定ファイル
- `google-gemini-cli`: 生成された Gemini システム設定ファイル

bundle MCP が有効な場合、OpenClaw は次を行います。

- Gateway ツールを CLI プロセスへ公開する loopback HTTP MCP サーバーを起動する
- セッションごとのトークン (`OPENCLAW_MCP_TOKEN`) でブリッジを認証する
- ツールアクセスを現在のセッション、アカウント、チャンネルコンテキストにスコープする
- 現在のワークスペースで有効な bundle-MCP サーバーを読み込む
- 既存のバックエンド MCP 設定/設定形状があればそれとマージする
- 所有する拡張機能からのバックエンド所有の統合モードを使って起動設定を書き換える

MCP サーバーが有効になっていない場合でも、バックエンドが bundle MCP に opt in しているときは、OpenClaw は strict 設定を注入して、バックグラウンド実行が分離されたままになるようにします。

セッションスコープのバンドル MCP ランタイムは、セッション内で再利用するためにキャッシュされ、その後
`mcp.sessionIdleTtlMs` ミリ秒のアイドル時間後に破棄されます (デフォルトは 10
分、無効にするには `0` を設定)。auth probe、
slug 生成、Active Memory recall などの one-shot 埋め込み実行は、stdio
子プロセスと Streamable HTTP/SSE ストリームが実行後も残らないよう、実行終了時にクリーンアップを要求します。

## 再シード履歴の上限

新しい CLI セッションが以前の OpenClaw トランスクリプトからシードされる場合 (たとえば
`session_expired` のリトライ後)、レンダリングされる
`<conversation_history>` ブロックは、再シードプロンプトが膨張しないように上限が設定されます。デフォルトは `12288` 文字 (約 3000 トークン) です。

Claude CLI バックエンドは、解決された
Claude コンテキスト階層から導出される、より大きな上限を自動的に使います。標準の 200K トークンの Claude 実行ではより大きなトランスクリプト
スライスを保持し、1M トークンの Claude 実行ではさらに大きなスライスを保持します。一方、他の CLI
バックエンドは保守的なデフォルトを維持します。

- この上限は、再シードプロンプトの過去履歴ブロックだけを制御します。ライブセッションの
  出力制限は `reliability.outputLimits` の下で別途調整されます
  ([セッション](#sessions) を参照)。

## 制限事項

- **OpenClaw ツール呼び出しは直接ありません。** OpenClaw は
  CLI バックエンドプロトコルにツール呼び出しを注入しません。バックエンドは
  `bundleMcp: true` に opt in している場合にのみ Gateway ツールを認識します。
- **ストリーミングはバックエンド固有です。** JSONL をストリームするバックエンドもあれば、
  終了までバッファするバックエンドもあります。
- **構造化出力** は CLI の JSON 形式に依存します。

## トラブルシューティング

- **CLI が見つからない**: `command` をフルパスに設定します。
- **モデル名が誤っている**: `provider/model` → CLI モデルをマッピングするには `modelAliases` を使います。
- **セッション継続性がない**: `sessionArg` が設定され、`sessionMode` が
  `none` でないことを確認します。
- **画像が無視される**: `imageArg` を設定します (CLI がファイルパスをサポートしていることも確認します)。

## 関連

- [Gateway runbook](/ja-JP/gateway)
- [ローカルモデル](/ja-JP/gateway/local-models)
