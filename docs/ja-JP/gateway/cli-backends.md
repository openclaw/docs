---
read_when:
    - API プロバイダーに障害が発生したときに、信頼できるフォールバックが必要な場合
    - Codex CLI またはその他のローカル AI CLI を実行していて、それらを再利用したい場合
    - CLI バックエンドツールアクセス用の MCP ループバックブリッジについて理解したい
summary: 'CLI バックエンド: オプションの MCP ツールブリッジを備えたローカル AI CLI フォールバック'
title: CLI バックエンド
x-i18n:
    generated_at: "2026-04-30T05:11:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 438862ed127a823dcdedc4aacb77b2facb13caa08f7986ef8402833777b6574e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw は、API プロバイダーが停止している、レート制限されている、または一時的に不安定な場合に、**テキストのみのフォールバック**として**ローカル AI CLI**を実行できます。これは意図的に保守的な設計です。

- **OpenClaw ツールは直接注入されません**が、`bundleMcp: true` のバックエンドは loopback MCP ブリッジ経由で Gateway ツールを受け取れます。
- 対応する CLI 向けの **JSONL ストリーミング**。
- **セッションに対応**しています（後続ターンの一貫性が保たれます）。
- CLI が画像パスを受け付ける場合、**画像をそのまま渡せます**。

これは主要経路ではなく、**セーフティネット**として設計されています。外部 API に依存せずに「常に動く」テキスト応答が必要な場合に使ってください。

ACP セッション制御、バックグラウンドタスク、スレッド/会話バインディング、永続的な外部コーディングセッションを備えた完全なハーネスランタイムが必要な場合は、代わりに [ACP Agents](/ja-JP/tools/acp-agents) を使用してください。CLI バックエンドは ACP ではありません。

## 初心者向けクイックスタート

Codex CLI は **設定なし**で使用できます（同梱の OpenAI Plugin がデフォルトバックエンドを登録します）。

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Gateway が launchd/systemd 配下で動作し、PATH が最小限の場合は、コマンドパスだけを追加します。

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

これで完了です。CLI 自体以外に、キーや追加の認証設定は不要です。

同梱 CLI バックエンドを Gateway ホスト上の**主要メッセージプロバイダー**として使用する場合、OpenClaw は、設定でそのバックエンドをモデル参照または `agents.defaults.cliBackends` の下で明示的に参照していれば、所有元の同梱 Plugin を自動ロードするようになりました。

## フォールバックとして使う

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

メモ:

- `agents.defaults.models`（許可リスト）を使用する場合は、そこにも CLI バックエンドモデルを含める必要があります。
- 主要プロバイダーが失敗した場合（認証、レート制限、タイムアウト）、OpenClaw は次に CLI バックエンドを試します。

## 設定の概要

すべての CLI バックエンドは次の下に置かれます。

```
agents.defaults.cliBackends
```

各エントリは **プロバイダー ID**（例: `codex-cli`, `my-cli`）でキー付けされます。
プロバイダー ID は、モデル参照の左側になります。

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
          serialize: true,
        },
      },
    },
  },
}
```

## 仕組み

1. プロバイダープレフィックス（`codex-cli/...`）に基づいて**バックエンドを選択**します。
2. 同じ OpenClaw プロンプトとワークスペースコンテキストを使用して、**システムプロンプトを構築**します。
3. 履歴の一貫性が保たれるように、（対応している場合）セッション ID 付きで **CLI を実行**します。
   同梱の `claude-cli` バックエンドは、OpenClaw セッションごとに Claude stdio プロセスを生存させ、後続ターンを stream-json stdin 経由で送信します。
4. **出力を解析**し（JSON またはプレーンテキスト）、最終テキストを返します。
5. バックエンドごとに**セッション ID を永続化**するため、後続ターンは同じ CLI セッションを再利用します。

<Note>
同梱の Anthropic `claude-cli` バックエンドは再び対応されています。Anthropic スタッフから OpenClaw スタイルの Claude CLI 使用は再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの統合における `claude -p` の使用を認可済みとして扱います。
</Note>

同梱の OpenAI `codex-cli` バックエンドは、Codex の `model_instructions_file` 設定上書き（`-c
model_instructions_file="..."`）を通じて OpenClaw のシステムプロンプトを渡します。Codex は Claude スタイルの `--append-system-prompt` フラグを公開していないため、OpenClaw は新しい Codex CLI セッションごとに、組み立てたプロンプトを一時ファイルへ書き込みます。

同梱の Anthropic `claude-cli` バックエンドは、OpenClaw Skills スナップショットを 2 つの方法で受け取ります。追加されたシステムプロンプト内のコンパクトな OpenClaw Skills カタログと、`--plugin-dir` で渡される一時 Claude Code Plugin です。この Plugin には、そのエージェント/セッションに適格な Skills だけが含まれるため、Claude Code のネイティブスキルリゾルバーは、OpenClaw が通常プロンプト内で宣伝するのと同じフィルター済みセットを認識します。Skill の env/API キー上書きは、実行時に OpenClaw によって引き続き子プロセス環境へ適用されます。

Claude CLI には独自の非対話型権限モードもあります。OpenClaw は Claude 固有の設定を追加する代わりに、これを既存の exec ポリシーへマッピングします。有効な要求 exec ポリシーが YOLO（`tools.exec.security: "full"` かつ `tools.exec.ask: "off"`）の場合、OpenClaw は `--permission-mode bypassPermissions` を追加します。エージェントごとの `agents.list[].tools.exec` 設定は、そのエージェントについてグローバルな `tools.exec` を上書きします。別の Claude モードを強制するには、`agents.defaults.cliBackends.claude-cli.args` と対応する `resumeArgs` の下で、`--permission-mode default` や `--permission-mode acceptEdits` などの明示的な生バックエンド引数を設定します。

OpenClaw が同梱の `claude-cli` バックエンドを使用する前に、Claude Code 自体が同じホスト上ですでにログイン済みである必要があります。

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`agents.defaults.cliBackends.claude-cli.command` は、`claude` バイナリがまだ `PATH` 上にない場合にのみ使用してください。

## セッション

- CLI がセッションに対応している場合、ID を複数のフラグへ挿入する必要があるときは、`sessionArg`（例: `--session-id`）または `sessionArgs`（プレースホルダー `{sessionId}`）を設定します。
- CLI が異なるフラグを持つ**再開サブコマンド**を使用する場合は、`resumeArgs`（再開時に `args` を置き換えます）と、必要に応じて `resumeOutput`（非 JSON の再開用）を設定します。
- `sessionMode`:
  - `always`: 常にセッション ID を送信します（保存済みがなければ新しい UUID）。
  - `existing`: 以前に保存されたセッション ID がある場合のみ送信します。
  - `none`: セッション ID を送信しません。
- `claude-cli` はデフォルトで `liveSession: "claude-stdio"`、`output: "jsonl"`、`input: "stdin"` になっているため、アクティブな間は後続ターンがライブの Claude プロセスを再利用します。トランスポートフィールドを省略したカスタム設定を含め、warm stdio が現在のデフォルトです。Gateway が再起動した場合、またはアイドルプロセスが終了した場合、OpenClaw は保存済みの Claude セッション ID から再開します。保存済みセッション ID は、再開前に既存の読み取り可能なプロジェクトトランスクリプトと照合されるため、実体のないバインディングは `--resume` 配下で黙って新しい Claude CLI セッションを開始する代わりに、`reason=transcript-missing` でクリアされます。
- 保存済み CLI セッションはプロバイダー所有の継続性です。暗黙の日次セッションリセットでは切断されません。`/reset` と明示的な `session.reset` ポリシーでは引き続き切断されます。

シリアライズに関するメモ:

- `serialize: true` は同一レーンの実行順序を維持します。
- ほとんどの CLI は 1 つのプロバイダーレーン上でシリアライズします。
- OpenClaw は、選択された認証 ID が変わった場合、保存済み CLI セッションの再利用を破棄します。これには、認証プロファイル ID、静的 API キー、静的トークン、または CLI が公開している場合の OAuth アカウント ID の変更が含まれます。OAuth アクセス/リフレッシュトークンのローテーションでは、保存済み CLI セッションは切断されません。CLI が安定した OAuth アカウント ID を公開していない場合、OpenClaw はその CLI に再開権限の強制を委ねます。

## claude-cli セッションからのフォールバックプレリュード

`claude-cli` の試行が [`agents.defaults.model.fallbacks`](/ja-JP/concepts/model-failover) 内の非 CLI 候補へフェイルオーバーする場合、OpenClaw は `~/.claude/projects/` にある Claude Code のローカル JSONL トランスクリプトから収集したコンテキストプレリュードを次の試行へシードします。このシードがないと、OpenClaw 自身のセッショントランスクリプトは `claude-cli` 実行では空のため、フォールバックプロバイダーはコールドスタートになります。

- プレリュードは最新の `/compact` サマリーまたは `compact_boundary` マーカーを優先し、その後、文字数予算まで直近の境界後ターンを追加します。境界前ターンは、サマリーがすでにそれらを表しているため破棄されます。
- ツールブロックは、プロンプト予算を正確に保つために、コンパクトな `(tool call: name)` と `(tool result: …)` のヒントへ統合されます。サマリーが上限を超える場合は `(truncated)` とラベル付けされます。
- 同一プロバイダーの `claude-cli` から `claude-cli` へのフォールバックは、Claude 自身の `--resume` に依存し、プレリュードをスキップします。
- このシードは既存の Claude セッションファイルパス検証を再利用するため、任意のパスは読み取れません。

## 画像（パススルー）

CLI が画像パスを受け付ける場合は、`imageArg` を設定します。

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw は base64 画像を一時ファイルへ書き込みます。`imageArg` が設定されている場合、それらのパスは CLI 引数として渡されます。`imageArg` がない場合、OpenClaw はファイルパスをプロンプトへ追加します（パス注入）。これは、プレーンなパスからローカルファイルを自動ロードする CLI には十分です。

## 入力 / 出力

- `output: "json"`（デフォルト）は JSON を解析し、テキストとセッション ID の抽出を試みます。
- Gemini CLI JSON 出力では、`usage` がないか空の場合、OpenClaw は応答テキストを `response` から、使用量を `stats` から読み取ります。
- `output: "jsonl"` は JSONL ストリーム（例: Codex CLI `--json`）を解析し、最終エージェントメッセージと、存在する場合はセッション識別子を抽出します。
- `output: "text"` は stdout を最終応答として扱います。

入力モード:

- `input: "arg"`（デフォルト）は、プロンプトを最後の CLI 引数として渡します。
- `input: "stdin"` は、stdin 経由でプロンプトを送信します。
- プロンプトが非常に長く `maxPromptArgChars` が設定されている場合、stdin が使用されます。

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

同梱の Google Plugin は、`google-gemini-cli` のデフォルトも登録します。

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件: ローカルの Gemini CLI がインストール済みで、`PATH` 上で `gemini` として利用可能である必要があります（`brew install gemini-cli` または `npm install -g @google/gemini-cli`）。

Gemini CLI JSON に関するメモ:

- 応答テキストは JSON の `response` フィールドから読み取られます。
- `usage` がないか空の場合、使用量は `stats` にフォールバックします。
- `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
- `stats.input` がない場合、OpenClaw は `stats.input_tokens - stats.cached` から入力トークンを導出します。

必要な場合にのみ上書きしてください（一般的な例: 絶対 `command` パス）。

## Plugin 所有のデフォルト

CLI バックエンドのデフォルトは、現在 Plugin サーフェスの一部です。

- Plugin は `api.registerCliBackend(...)` でそれらを登録します。
- バックエンドの `id` はモデル参照内のプロバイダープレフィックスになります。
- `agents.defaults.cliBackends.<id>` 内のユーザー設定は、引き続き Plugin デフォルトを上書きします。
- バックエンド固有の設定クリーンアップは、任意の `normalizeConfig` フックを通じて Plugin 所有のままです。

小さなプロンプト/メッセージ互換性 shim が必要な Plugin は、
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
は、OpenClaw が独自の制御マーカーとチャネル配信を処理する前に、
ストリーミングされたアシスタント差分と解析済みの最終テキストを書き換えます。

Claude Code stream-json 互換 JSONL を出力する CLI では、そのバックエンドの設定で
`jsonlDialect: "claude-stream-json"` を設定します。

## MCP オーバーレイのバンドル

CLI バックエンドは OpenClaw のツール呼び出しを直接受け取りませんが、バックエンドは
`bundleMcp: true` によって生成済み MCP 設定オーバーレイを有効にできます。

現在のバンドル動作:

- `claude-cli`: 生成された厳格な MCP 設定ファイル
- `codex-cli`: `mcp_servers` のインライン設定上書き。生成された
  OpenClaw loopback サーバーには、Codex のサーバー単位ツール承認モードが付与されるため、
  MCP 呼び出しがローカル承認プロンプトで停止することはありません
- `google-gemini-cli`: 生成された Gemini システム設定ファイル

バンドル MCP が有効な場合、OpenClaw は次を行います。

- Gateway ツールを CLI プロセスに公開する loopback HTTP MCP サーバーを起動する
- セッションごとのトークン (`OPENCLAW_MCP_TOKEN`) でブリッジを認証する
- ツールアクセスを現在のセッション、アカウント、チャネルコンテキストにスコープする
- 現在のワークスペースで有効な bundle-MCP サーバーを読み込む
- 既存のバックエンド MCP 設定/設定形状とマージする
- 所有元 Plugin のバックエンド所有統合モードを使って起動設定を書き換える

MCP サーバーが有効でない場合でも、バックエンドがバンドル MCP を有効にしていれば、
バックグラウンド実行が分離されたままになるよう、OpenClaw は厳格な設定を注入します。

セッションスコープのバンドル MCP ランタイムは、セッション内で再利用できるようキャッシュされ、
その後 `mcp.sessionIdleTtlMs` ミリ秒のアイドル時間後に回収されます (デフォルトは 10
分。無効にするには `0` を設定)。認証プローブ、slug 生成、active-memory recall などの
ワンショット埋め込み実行は、実行終了時にクリーンアップを要求するため、stdio
子プロセスや Streamable HTTP/SSE ストリームが実行後も残り続けることはありません。

## 制限事項

- **OpenClaw ツール呼び出しは直接できません。** OpenClaw は CLI バックエンドプロトコルに
  ツール呼び出しを注入しません。バックエンドが Gateway ツールを認識するのは、
  `bundleMcp: true` を有効にした場合のみです。
- **ストリーミングはバックエンド固有です。** JSONL をストリーミングするバックエンドもあれば、
  終了までバッファリングするバックエンドもあります。
- **構造化出力**は CLI の JSON 形式に依存します。
- **Codex CLI セッション**はテキスト出力で再開します (JSONL ではありません)。これは初回の
  `--json` 実行よりも構造化されていません。OpenClaw セッションは通常どおり動作します。

## トラブルシューティング

- **CLI が見つからない**: `command` をフルパスに設定します。
- **モデル名が間違っている**: `modelAliases` を使って `provider/model` → CLI モデルにマッピングします。
- **セッション継続性がない**: `sessionArg` が設定され、`sessionMode` が
  `none` ではないことを確認します (Codex CLI は現在 JSON 出力で再開できません)。
- **画像が無視される**: `imageArg` を設定します (また、CLI がファイルパスをサポートしていることを確認します)。

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [ローカルモデル](/ja-JP/gateway/local-models)
