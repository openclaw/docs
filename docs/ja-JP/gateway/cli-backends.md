---
read_when:
    - API プロバイダーが失敗した場合に、信頼できるフォールバックが必要
    - Codex CLI やその他のローカル AI CLI を実行していて、それらを再利用したい場合
    - CLI バックエンドツールアクセス用の MCP ループバックブリッジを理解したい
summary: 'CLI バックエンド: オプションの MCP ツールブリッジ付きローカル AI CLI フォールバック'
title: CLI バックエンド
x-i18n:
    generated_at: "2026-05-10T19:33:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6fbbca3bc7e9c0b87147b91d419c03ea0b112494fa54c1ac041e80e76c7b186
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw は、API プロバイダーが停止している、レート制限されている、または一時的に不安定な場合に、**テキスト専用フォールバック**として **ローカル AI CLI** を実行できます。これは意図的に保守的な設計です。

- **OpenClaw ツールは直接注入されません**が、`bundleMcp: true`
  を持つバックエンドは、loopback MCP ブリッジ経由で Gateway ツールを受け取れます。
- 対応する CLI 向けの **JSONL ストリーミング**。
- **セッションに対応**しています（そのため後続ターンの一貫性が保たれます）。
- CLI が画像パスを受け付ける場合、**画像をそのまま渡せます**。

これは主経路ではなく、**セーフティネット**として設計されています。外部 API に依存せずに「常に動く」テキスト応答が必要な場合に使用してください。

ACP セッション制御、バックグラウンドタスク、スレッド/会話のバインディング、永続的な外部コーディングセッションを備えた完全なハーネスランタイムが必要な場合は、代わりに
[ACP エージェント](/ja-JP/tools/acp-agents)を使用してください。CLI バックエンドは ACP ではありません。

<Tip>
  新しいバックエンド Plugin を構築していますか？
  [CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins)を使用してください。このページは、すでに登録済みのバックエンドを設定および運用するユーザー向けです。
</Tip>

## 初心者向けクイックスタート

Codex CLI は **設定なし**で使用できます（同梱の OpenAI Plugin がデフォルトバックエンドを登録します）。

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Gateway が launchd/systemd 配下で実行されていて PATH が最小限の場合は、コマンドパスだけを追加します。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

これで完了です。CLI 自体に必要なもの以外、キーや追加の認証設定は不要です。

同梱の CLI バックエンドを Gateway ホスト上の**主要メッセージプロバイダー**として使用する場合、設定がモデル参照内または
`agents.defaults.cliBackends`
配下でそのバックエンドを明示的に参照していれば、OpenClaw は所有元の同梱 Plugin を自動で読み込むようになりました。

## フォールバックとして使用する

CLI バックエンドをフォールバックリストに追加すると、主要モデルが失敗した場合にのみ実行されます。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

注記:

- `agents.defaults.models`（許可リスト）を使用している場合は、そこにも CLI バックエンドモデルを含める必要があります。
- 主要プロバイダーが失敗した場合（認証、レート制限、タイムアウト）、OpenClaw は次に CLI バックエンドを試します。

## 設定概要

すべての CLI バックエンドは次の配下にあります。

```
agents.defaults.cliBackends
```

各エントリは **プロバイダー ID**（例: `codex-cli`, `my-cli`）をキーにします。
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
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
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

1. プロバイダープレフィックス（`codex-cli/...`）に基づいて**バックエンドを選択**します。
2. 同じ OpenClaw プロンプト + ワークスペースコンテキストを使用して、**システムプロンプトを構築**します。
3. 履歴の一貫性を保つため、対応している場合はセッション ID 付きで **CLI を実行**します。
   同梱の `claude-cli` バックエンドは OpenClaw セッションごとに Claude stdio プロセスを維持し、後続ターンを stream-json stdin 経由で送信します。
4. **出力を解析**（JSON またはプレーンテキスト）し、最終テキストを返します。
5. 後続ターンで同じ CLI セッションを再利用できるように、バックエンドごとに**セッション ID を永続化**します。

<Note>
同梱の Anthropic `claude-cli` バックエンドは再びサポートされています。Anthropic スタッフから OpenClaw 形式の Claude CLI 使用が再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの統合における `claude -p` の使用を認可済みとして扱います。
</Note>

同梱の OpenAI `codex-cli` バックエンドは、Codex の `model_instructions_file` 設定オーバーライド（`-c
model_instructions_file="..."`）を通じて OpenClaw のシステムプロンプトを渡します。Codex は Claude 形式の
`--append-system-prompt` フラグを公開していないため、OpenClaw は新しい Codex CLI セッションごとに、組み立てたプロンプトを一時ファイルへ書き込みます。

同梱の Anthropic `claude-cli` バックエンドは、OpenClaw の Skills スナップショットを 2 つの方法で受け取ります。追加されたシステムプロンプト内のコンパクトな OpenClaw Skills カタログと、
`--plugin-dir` で渡される一時的な Claude Code Plugin です。この Plugin には、そのエージェント/セッションで対象となる Skills のみが含まれるため、Claude Code のネイティブ Skill リゾルバーは、OpenClaw が通常プロンプトで通知するのと同じフィルター済みセットを認識します。Skill の env/API キーオーバーライドは、実行時に OpenClaw によって子プロセス環境へ引き続き適用されます。

Claude CLI には独自の非対話型権限モードもあります。OpenClaw は Claude 固有の設定を追加するのではなく、これを既存の exec ポリシーへマップします。有効な要求 exec ポリシーが YOLO（`tools.exec.security: "full"` と
`tools.exec.ask: "off"`）の場合、OpenClaw は `--permission-mode bypassPermissions` を追加します。
エージェントごとの `agents.list[].tools.exec` 設定は、そのエージェントについてグローバルな `tools.exec` を上書きします。別の Claude モードを強制するには、`agents.defaults.cliBackends.claude-cli.args` と対応する `resumeArgs` 配下に、`--permission-mode default` や `--permission-mode acceptEdits` などの明示的な raw バックエンド引数を設定します。

同梱の Anthropic `claude-cli` バックエンドは、OpenClaw の `/think` レベルも、off 以外のレベルについて Claude Code のネイティブ `--effort` フラグへマップします。`minimal` と
`low` は `low` に、`adaptive` と `medium` は `medium` にマップされ、`high`、
`xhigh`、`max` は直接マップされます。他の CLI バックエンドでは、`/think` が起動される CLI に影響できるようになる前に、所有元 Plugin が同等の argv マッパーを宣言する必要があります。

OpenClaw が同梱の `claude-cli` バックエンドを使用する前に、Claude Code 自体が同じホスト上でログイン済みである必要があります。

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`claude` バイナリがまだ `PATH` 上にない場合にのみ、`agents.defaults.cliBackends.claude-cli.command` を使用してください。

## セッション

- CLI がセッションに対応している場合、ID を複数のフラグへ挿入する必要があるときは `sessionArg`（例: `--session-id`）または
  `sessionArgs`（プレースホルダー `{sessionId}`）を設定します。
- CLI が異なるフラグを持つ **resume サブコマンド**を使用する場合は、
  `resumeArgs`（再開時に `args` を置き換える）と、必要に応じて `resumeOutput`
  （非 JSON 再開向け）を設定します。
- `sessionMode`:
  - `always`: 常にセッション ID を送信します（保存済みのものがなければ新しい UUID）。
  - `existing`: 以前に保存されたセッション ID がある場合のみ送信します。
  - `none`: セッション ID を送信しません。
- `claude-cli` はデフォルトで `liveSession: "claude-stdio"`、`output: "jsonl"`、
  `input: "stdin"` になっているため、アクティブな間は後続ターンでライブ Claude プロセスを再利用します。transport フィールドを省略したカスタム設定も含め、現在は warm stdio がデフォルトです。Gateway が再起動するか、アイドルプロセスが終了した場合、OpenClaw は保存済みの Claude セッション ID から再開します。保存済みセッション ID は、再開前に既存の読み取り可能なプロジェクトトランスクリプトに照らして検証されるため、実体のないバインディングは `--resume` の下で黙って新しい Claude CLI セッションを開始するのではなく、`reason=transcript-missing` でクリアされます。
- Claude ライブセッションは境界付き JSONL 出力ガードを維持します。デフォルトでは 1 ターンあたり最大 8 MiB および 20,000 raw JSONL 行が許可されます。ツールが多い Claude ターンでは、バックエンドごとに
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  と `maxTurnLines` で引き上げられます。OpenClaw はこれらの設定を 64 MiB と 100,000 行にクランプします。
- 保存済み CLI セッションは、プロバイダー所有の継続性です。暗黙の日次セッションリセットでは切断されません。`/reset` と明示的な `session.reset` ポリシーでは引き続き切断されます。
- 新しい CLI セッションは通常、OpenClaw の Compaction 要約と Compaction 後の末尾のみから再シードします。Compaction 前に無効化された短いセッションを復旧するため、バックエンドは
  `reseedFromRawTranscriptWhenUncompacted: true` でオプトインできます。OpenClaw はそれでも raw トランスクリプト再シードを境界付きに保ち、CLI トランスクリプトの欠落、システムプロンプト/MCP の変更、セッション期限切れリトライなど、安全な無効化に限定します。認証プロファイルや認証情報エポックの変更では、raw トランスクリプト履歴は再シードされません。

シリアライズに関する注記:

- `serialize: true` は同一レーンの実行順序を維持します。
- ほとんどの CLI は 1 つのプロバイダーレーンでシリアライズされます。
- OpenClaw は、選択された認証 ID が変わった場合、保存済み CLI セッションの再利用を破棄します。これには、認証プロファイル ID、静的 API キー、静的トークン、または CLI が公開している場合の OAuth アカウント ID の変更が含まれます。OAuth アクセストークンおよびリフレッシュトークンのローテーションでは、保存済み CLI セッションは切断されません。CLI が安定した OAuth アカウント ID を公開しない場合、OpenClaw はその CLI に再開権限の強制を任せます。

## claude-cli セッションからのフォールバック前置き

`claude-cli` の試行が [`agents.defaults.model.fallbacks`](/ja-JP/concepts/model-failover) 内の非 CLI 候補へフォールオーバーすると、OpenClaw は `~/.claude/projects/` にある Claude Code のローカル JSONL トランスクリプトから採取したコンテキスト前置きを次の試行へシードします。このシードがない場合、OpenClaw 自身のセッショントランスクリプトは `claude-cli` 実行では空であるため、フォールバックプロバイダーはコールドスタートします。

- 前置きは最新の `/compact` 要約または `compact_boundary`
  マーカーを優先し、その後、境界後の直近ターンを文字数予算まで追加します。境界前のターンは、その要約がすでにそれらを表しているため破棄されます。
- ツールブロックは、プロンプト予算を正直に保つため、コンパクトな `(tool call: name)` と
  `(tool result: …)` ヒントへ統合されます。要約があふれた場合は
  `(truncated)` とラベル付けされます。
- 同一プロバイダーの `claude-cli` から `claude-cli` へのフォールバックは、Claude 自身の
  `--resume` に依存し、前置きをスキップします。
- このシードは既存の Claude セッションファイルパス検証を再利用するため、任意のパスは読み取れません。

## 画像（パススルー）

CLI が画像パスを受け付ける場合は、`imageArg` を設定します。

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw は base64 画像を一時ファイルへ書き込みます。`imageArg` が設定されている場合、それらのパスは CLI 引数として渡されます。`imageArg` がない場合、OpenClaw はファイルパスをプロンプトに追加します（パス注入）。これは、プレーンなパスからローカルファイルを自動読み込みする CLI には十分です。

## 入力 / 出力

- `output: "json"`（デフォルト）は JSON の解析を試み、テキスト + セッション ID を抽出します。
- Gemini CLI の JSON 出力では、`usage` が欠落または空の場合、OpenClaw は `response` から返信テキストを、`stats` から使用量を読み取ります。
- `output: "jsonl"` は JSONL ストリーム（例: Codex CLI `--json`）を解析し、最終エージェントメッセージと、存在する場合はセッション ID を抽出します。
- `output: "text"` は stdout を最終応答として扱います。

入力モード:

- `input: "arg"`（デフォルト）は、プロンプトを最後の CLI 引数として渡します。
- `input: "stdin"` は、stdin 経由でプロンプトを送信します。
- プロンプトが非常に長く、`maxPromptArgChars` が設定されている場合は、stdin が使用されます。

## デフォルト（Plugin 所有）

同梱の OpenAI Plugin は、`codex-cli` のデフォルトも登録します。

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

バンドルされた Google Plugin は、`google-gemini-cli` のデフォルトも登録します。

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件: ローカルの Gemini CLI がインストール済みで、`PATH` 上で
`gemini` として利用できる必要があります（`brew install gemini-cli` または
`npm install -g @google/gemini-cli`）。

Gemini CLI JSON の注意事項:

- 返信テキストは JSON の `response` フィールドから読み取られます。
- `usage` が存在しない、または空の場合、使用量は `stats` にフォールバックします。
- `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
- `stats.input` がない場合、OpenClaw は
  `stats.input_tokens - stats.cached` から入力トークンを導出します。

必要な場合のみ上書きしてください（一般的な例: 絶対 `command` パス）。

## Plugin 所有のデフォルト

CLI バックエンドのデフォルトは、現在 Plugin サーフェスの一部です。

- Plugin は `api.registerCliBackend(...)` でそれらを登録します。
- バックエンドの `id` はモデル参照内のプロバイダープレフィックスになります。
- `agents.defaults.cliBackends.<id>` のユーザー設定は、引き続き Plugin のデフォルトを上書きします。
- バックエンド固有の設定クリーンアップは、任意の
  `normalizeConfig` フックを通じて Plugin 所有のままです。

ごく小さなプロンプト/メッセージ互換性シムが必要な Plugin は、プロバイダーや CLI バックエンドを置き換えずに、双方向のテキスト変換を宣言できます。

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

`input` は、CLI に渡されるシステムプロンプトとユーザープロンプトを書き換えます。`output`
は、OpenClaw が自身の制御マーカーとチャネル配信を処理する前に、ストリーミングされたアシスタントのデルタと解析済みの最終テキストを書き換えます。

Claude Code stream-json 互換の JSONL を出力する CLI では、そのバックエンド設定に
`jsonlDialect: "claude-stream-json"` を設定してください。

## バンドル MCP オーバーレイ

CLI バックエンドは OpenClaw ツール呼び出しを直接受け取りませんが、バックエンドは
`bundleMcp: true` で生成済み MCP 設定オーバーレイにオプトインできます。

現在のバンドル済み動作:

- `claude-cli`: 生成済みの厳格な MCP 設定ファイル
- `codex-cli`: `mcp_servers` のインライン設定上書き。生成済みの
  OpenClaw ループバックサーバーは、Codex のサーバー単位ツール承認モードでマークされるため、
  MCP 呼び出しがローカル承認プロンプトで停止することはありません
- `google-gemini-cli`: 生成済みの Gemini システム設定ファイル

バンドル MCP が有効な場合、OpenClaw は次を行います。

- Gateway ツールを CLI プロセスに公開するループバック HTTP MCP サーバーを起動します
- セッションごとのトークン（`OPENCLAW_MCP_TOKEN`）でブリッジを認証します
- ツールアクセスを現在のセッション、アカウント、チャネルコンテキストにスコープします
- 現在のワークスペースで有効な bundle-MCP サーバーを読み込みます
- それらを既存のバックエンド MCP 設定/設定形状とマージします
- 所有元拡張機能のバックエンド所有の統合モードを使用して起動設定を書き換えます

MCP サーバーが有効になっていない場合でも、バックエンドがバンドル MCP にオプトインしていれば、
OpenClaw は厳格な設定を注入し、バックグラウンド実行が分離された状態を保ちます。

セッションスコープのバンドル MCP ランタイムはセッション内で再利用するためにキャッシュされ、その後
`mcp.sessionIdleTtlMs` ミリ秒のアイドル時間後に回収されます（デフォルトは 10
分、無効にするには `0` を設定）。認証プローブ、スラッグ生成、Active Memory リコール要求などのワンショット埋め込み実行は、実行終了時にクリーンアップされるため、stdio
子プロセスや Streamable HTTP/SSE ストリームが実行後も残ることはありません。

## 制限事項

- **OpenClaw ツール呼び出しの直接利用はありません。** OpenClaw は
  CLI バックエンドプロトコルにツール呼び出しを注入しません。バックエンドは
  `bundleMcp: true` にオプトインした場合にのみ Gateway ツールを認識します。
- **ストリーミングはバックエンド固有です。** 一部のバックエンドは JSONL をストリーミングし、他は終了までバッファリングします。
- **構造化出力** は CLI の JSON 形式に依存します。
- **Codex CLI セッション** はテキスト出力で再開されます（JSONL ではありません）。これは初回の `--json` 実行より構造化度が低くなります。OpenClaw セッションは引き続き通常どおり動作します。

## トラブルシューティング

- **CLI が見つからない**: `command` をフルパスに設定してください。
- **モデル名が間違っている**: `provider/model` → CLI モデルのマッピングには `modelAliases` を使用してください。
- **セッション継続性がない**: `sessionArg` が設定されており、`sessionMode` が
  `none` でないことを確認してください（Codex CLI は現在、JSON 出力で再開できません）。
- **画像が無視される**: `imageArg` を設定してください（また、CLI がファイルパスをサポートしていることを確認してください）。

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [ローカルモデル](/ja-JP/gateway/local-models)
