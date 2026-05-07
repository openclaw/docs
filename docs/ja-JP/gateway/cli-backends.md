---
read_when:
    - API プロバイダーが失敗したときに信頼できるフォールバックが必要な場合
    - Codex CLIまたはその他のローカル AI CLIを実行していて、それらを再利用したい場合
    - CLI バックエンドのツールアクセス用 MCP ループバックブリッジを理解したい
summary: 'CLI バックエンド: 任意の MCP ツールブリッジを備えたローカル AI CLI 代替機能'
title: CLI バックエンド
x-i18n:
    generated_at: "2026-05-07T13:16:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c29a7f9b05d8d561c117d9c61dda61eded95441abb0355e8bd969d8a4a09a3b
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw は、API プロバイダーが停止している、レート制限されている、または一時的に不安定な場合に、**テキストのみのフォールバック**として **ローカル AI CLI** を実行できます。
これは意図的に保守的な設計です。

- **OpenClaw ツールは直接注入されません**が、`bundleMcp: true` のバックエンドは
  loopback MCP ブリッジ経由で Gateway ツールを受け取れます。
- 対応している CLI では **JSONL ストリーミング**。
- **セッションに対応しています**（そのため、後続ターンの一貫性が保たれます）。
- CLI が画像パスを受け付ける場合は、**画像をそのまま渡せます**。

これは主要な経路ではなく、**セーフティネット**として設計されています。外部 API に依存せず、
「常に動作する」テキスト応答が必要な場合に使用してください。

ACP セッション制御、バックグラウンドタスク、スレッド/会話のバインド、永続的な外部コーディングセッションを備えた完全なハーネスランタイムが必要な場合は、代わりに
[ACP Agents](/ja-JP/tools/acp-agents) を使用してください。CLI バックエンドは ACP ではありません。

<Tip>
  新しいバックエンド Plugin を構築していますか？
  [CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins) を使用してください。このページは、すでに登録済みのバックエンドを
  設定して運用するユーザー向けです。
</Tip>

## 初心者向けクイックスタート

Codex CLI は **設定なし**で使用できます（バンドルされた OpenAI Plugin が
デフォルトのバックエンドを登録します）。

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Gateway が launchd/systemd 配下で動作し、PATH が最小限の場合は、
コマンドパスだけを追加してください。

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

これで完了です。CLI 自体で必要なもの以外に、キーや追加の認証設定は不要です。

バンドルされた CLI バックエンドを Gateway ホスト上の
**主要メッセージプロバイダー**として使用する場合、OpenClaw は、設定がモデル参照または
`agents.defaults.cliBackends` 配下でそのバックエンドを明示的に参照しているときに、
所有元のバンドル Plugin を自動ロードするようになりました。

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

メモ:

- `agents.defaults.models`（許可リスト）を使用する場合は、CLI バックエンドモデルもそこに含める必要があります。
- 主要プロバイダーが失敗した場合（認証、レート制限、タイムアウト）、OpenClaw は
  次に CLI バックエンドを試行します。

## 設定の概要

すべての CLI バックエンドは次の配下にあります。

```
agents.defaults.cliBackends
```

各エントリは **プロバイダー ID**（例: `codex-cli`、`my-cli`）をキーにします。
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
          serialize: true,
        },
      },
    },
  },
}
```

## 仕組み

1. プロバイダー接頭辞（`codex-cli/...`）に基づいて**バックエンドを選択します**。
2. 同じ OpenClaw プロンプト + ワークスペースコンテキストを使って**システムプロンプトを構築します**。
3. セッション ID（対応している場合）を使って **CLI を実行し**、履歴の一貫性を保ちます。
   バンドルされた `claude-cli` バックエンドは、OpenClaw セッションごとに Claude stdio プロセスを維持し、
   後続ターンを stream-json stdin 経由で送信します。
4. **出力を解析し**（JSON またはプレーンテキスト）、最終テキストを返します。
5. バックエンドごとに**セッション ID を永続化**し、後続ターンで同じ CLI セッションを再利用します。

<Note>
バンドルされた Anthropic `claude-cli` バックエンドは再び対応しています。Anthropic スタッフから、
OpenClaw スタイルの Claude CLI 利用が再び許可されたと伝えられたため、Anthropic が新しいポリシーを公開しない限り、
OpenClaw はこの統合における `claude -p` の利用を認可済みとして扱います。
</Note>

バンドルされた OpenAI `codex-cli` バックエンドは、OpenClaw のシステムプロンプトを
Codex の `model_instructions_file` 設定オーバーライド（`-c
model_instructions_file="..."`）経由で渡します。Codex は Claude スタイルの
`--append-system-prompt` フラグを公開していないため、OpenClaw は新しい Codex CLI セッションごとに
組み立て済みプロンプトを一時ファイルへ書き込みます。

バンドルされた Anthropic `claude-cli` バックエンドは、OpenClaw Skills スナップショットを
2 つの方法で受け取ります。追加されたシステムプロンプト内のコンパクトな OpenClaw Skills カタログと、
`--plugin-dir` で渡される一時的な Claude Code Plugin です。この Plugin には
そのエージェント/セッションで対象となる Skills だけが含まれるため、Claude Code のネイティブなスキル解決機構は、
OpenClaw が通常プロンプトで提示するものと同じフィルタ済みセットを認識します。Skill の env/API キーオーバーライドは、
実行時の子プロセス環境へ OpenClaw によって引き続き適用されます。

Claude CLI には独自の非対話型権限モードもあります。OpenClaw は Claude 固有の設定を追加する代わりに、
それを既存の exec ポリシーへマッピングします。有効な要求 exec ポリシーが YOLO（`tools.exec.security: "full"` かつ
`tools.exec.ask: "off"`）の場合、OpenClaw は `--permission-mode bypassPermissions` を追加します。
エージェント単位の `agents.list[].tools.exec` 設定は、そのエージェントについてグローバルな `tools.exec` を上書きします。
別の Claude モードを強制するには、`agents.defaults.cliBackends.claude-cli.args` と対応する `resumeArgs` の下に、
`--permission-mode default` や `--permission-mode acceptEdits` などの明示的な生バックエンド引数を設定してください。

バンドルされた Anthropic `claude-cli` バックエンドは、OpenClaw の `/think` レベルも、
off 以外のレベルについて Claude Code のネイティブな `--effort` フラグへマッピングします。`minimal` と
`low` は `low` に、`adaptive` と `medium` は `medium` に、`high`、
`xhigh`、`max` はそのままマッピングされます。他の CLI バックエンドでは、生成される CLI に `/think` が影響する前に、
所有元 Plugin が同等の argv マッパーを宣言する必要があります。

OpenClaw がバンドルされた `claude-cli` バックエンドを使用する前に、Claude Code 自体が
同じホスト上でログイン済みである必要があります。

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`claude` バイナリがまだ `PATH` 上にない場合にのみ、`agents.defaults.cliBackends.claude-cli.command` を使用してください。

## セッション

- CLI がセッションに対応している場合は、ID を複数のフラグへ挿入する必要があるときに、
  `sessionArg`（例: `--session-id`）または
  `sessionArgs`（プレースホルダー `{sessionId}`）を設定します。
- CLI が異なるフラグの **resume サブコマンド**を使用する場合は、
  `resumeArgs`（再開時に `args` を置き換える）と、必要に応じて `resumeOutput`
  （非 JSON の resume 用）を設定します。
- `sessionMode`:
  - `always`: 常にセッション ID を送信します（保存済みがない場合は新しい UUID）。
  - `existing`: 以前に保存されたセッション ID がある場合にのみ送信します。
  - `none`: セッション ID を送信しません。
- `claude-cli` はデフォルトで `liveSession: "claude-stdio"`、`output: "jsonl"`、
  `input: "stdin"` を使用するため、後続ターンはアクティブな間、ライブ Claude プロセスを再利用します。
  現在は、transport フィールドを省略したカスタム設定を含め、ウォーム stdio がデフォルトです。
  Gateway が再起動するかアイドルプロセスが終了した場合、OpenClaw は保存済み Claude セッション ID から再開します。
  保存済みセッション ID は、再開前に既存の読み取り可能なプロジェクトトランスクリプトに対して検証されるため、
  幻のバインドは `--resume` 配下で新しい Claude CLI セッションを黙って開始する代わりに、
  `reason=transcript-missing` でクリアされます。
- Claude ライブセッションは、境界付きの JSONL 出力ガードを維持します。デフォルトでは、
  1 ターンあたり最大 8 MiB および 20,000 行の生 JSONL が許可されます。ツールを多用する Claude ターンでは、
  バックエンドごとに
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  と `maxTurnLines` で上限を引き上げられます。OpenClaw はこれらの設定を 64 MiB と 100,000
  行にクランプします。
- 保存済み CLI セッションは、プロバイダーが所有する継続性です。暗黙の日次セッションリセットでは切断されません。
  `/reset` と明示的な `session.reset` ポリシーでは引き続き切断されます。

シリアライズに関するメモ:

- `serialize: true` は同じレーンの実行順序を保ちます。
- ほとんどの CLI は 1 つのプロバイダーレーンでシリアライズします。
- OpenClaw は、選択された認証 ID が変わった場合、保存済み CLI セッションの再利用を破棄します。
  これには、認証プロファイル ID、静的 API キー、静的トークン、または CLI が公開している場合の OAuth
  アカウント ID の変更が含まれます。OAuth アクセストークンとリフレッシュトークンのローテーションでは、
  保存済み CLI セッションは切断されません。CLI が安定した OAuth アカウント ID を公開しない場合、
  OpenClaw はその CLI に resume 権限の強制を任せます。

## claude-cli セッションからのフォールバック前置き

`claude-cli` の試行が
[`agents.defaults.model.fallbacks`](/ja-JP/concepts/model-failover) 内の非 CLI 候補へフェイルオーバーする場合、OpenClaw は
`~/.claude/projects/` にある Claude Code のローカル JSONL トランスクリプトから収集したコンテキスト前置きで
次の試行を初期化します。このシードがないと、OpenClaw 自身のセッショントランスクリプトは `claude-cli` 実行では空のため、
フォールバックプロバイダーはコールドスタートになります。

- 前置きは最新の `/compact` サマリーまたは `compact_boundary`
  マーカーを優先し、その後、文字数予算内で直近の境界後ターンを追加します。境界前のターンは、
  サマリーがすでにそれらを表しているため削除されます。
- ツールブロックは、プロンプト予算を正直に保つために、コンパクトな `(tool call: name)` と
  `(tool result: …)` ヒントへ統合されます。サマリーが上限を超えた場合は
  `(truncated)` とラベル付けされます。
- 同一プロバイダーの `claude-cli` から `claude-cli` へのフォールバックは、Claude 自身の
  `--resume` に依存し、前置きをスキップします。
- シードは既存の Claude セッションファイルパス検証を再利用するため、
  任意のパスは読み取れません。

## 画像（パススルー）

CLI が画像パスを受け付ける場合は、`imageArg` を設定します。

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw は base64 画像を一時ファイルに書き込みます。`imageArg` が設定されている場合、
それらのパスは CLI 引数として渡されます。`imageArg` がない場合、OpenClaw は
ファイルパスをプロンプトに追加します（パス注入）。これは、プレーンなパスからローカルファイルを自動ロードする CLI には十分です。

## 入力 / 出力

- `output: "json"`（デフォルト）は JSON の解析を試み、テキスト + セッション ID を抽出します。
- Gemini CLI の JSON 出力では、`usage` がない、または空の場合、OpenClaw は `response` から応答テキストを、
  `stats` から使用量を読み取ります。
- `output: "jsonl"` は JSONL ストリーム（例: Codex CLI `--json`）を解析し、最終エージェントメッセージと、
  存在する場合はセッション識別子を抽出します。
- `output: "text"` は stdout を最終応答として扱います。

入力モード:

- `input: "arg"`（デフォルト）は、プロンプトを最後の CLI 引数として渡します。
- `input: "stdin"` は、プロンプトを stdin 経由で送信します。
- プロンプトが非常に長く、`maxPromptArgChars` が設定されている場合は、stdin が使用されます。

## デフォルト（Plugin 所有）

バンドルされた OpenAI Plugin は、`codex-cli` のデフォルトも登録します。

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

前提条件: ローカルの Gemini CLI がインストール済みで、`PATH` 上の
`gemini` として利用可能である必要があります (`brew install gemini-cli` または
`npm install -g @google/gemini-cli`)。

Gemini CLI JSON に関する注記:

- 返信テキストは JSON の `response` フィールドから読み取られます。
- `usage` が存在しない、または空の場合、使用量は `stats` にフォールバックします。
- `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
- `stats.input` がない場合、OpenClaw は
  `stats.input_tokens - stats.cached` から入力トークンを導出します。

必要な場合のみ上書きしてください (一般的な例: 絶対 `command` パス)。

## Plugin 所有のデフォルト

CLI バックエンドのデフォルトは、現在 Plugin サーフェスの一部です:

- Plugin は `api.registerCliBackend(...)` でそれらを登録します。
- バックエンドの `id` はモデル参照内のプロバイダー接頭辞になります。
- `agents.defaults.cliBackends.<id>` のユーザー設定は引き続き Plugin のデフォルトを上書きします。
- バックエンド固有の設定クリーンアップは、任意の
  `normalizeConfig` フックを通じて Plugin 所有のままです。

小さなプロンプト/メッセージ互換性シムが必要な Plugin は、プロバイダーや CLI バックエンドを置き換えずに、双方向のテキスト変換を宣言できます:

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
は、OpenClaw が独自の制御マーカーとチャネル配信を処理する前に、ストリーミングされたアシスタント差分と解析済みの最終テキストを書き換えます。

Claude Code stream-json 互換の JSONL を出力する CLI では、そのバックエンドの設定に
`jsonlDialect: "claude-stream-json"` を設定します。

## バンドル MCP オーバーレイ

CLI バックエンドは OpenClaw ツール呼び出しを直接受け取りませんが、バックエンドは
`bundleMcp: true` で生成済み MCP 設定オーバーレイにオプトインできます。

現在のバンドル動作:

- `claude-cli`: 生成された厳密な MCP 設定ファイル
- `codex-cli`: `mcp_servers` のインライン設定上書き。生成された
  OpenClaw ループバックサーバーには Codex のサーバーごとのツール承認モードが付与されるため、
  MCP 呼び出しがローカル承認プロンプトで停止することはありません
- `google-gemini-cli`: 生成された Gemini システム設定ファイル

バンドル MCP が有効な場合、OpenClaw は次を行います:

- Gateway ツールを CLI プロセスに公開するループバック HTTP MCP サーバーを起動する
- セッションごとのトークン (`OPENCLAW_MCP_TOKEN`) でブリッジを認証する
- ツールアクセスを現在のセッション、アカウント、チャネルコンテキストにスコープする
- 現在のワークスペースで有効なバンドル MCP サーバーを読み込む
- 既存のバックエンド MCP 設定/設定形状とマージする
- 所有元拡張機能のバックエンド所有の統合モードを使用して起動設定を書き換える

MCP サーバーが有効でない場合でも、バックエンドがバンドル MCP にオプトインしていると、バックグラウンド実行が分離されたままになるよう OpenClaw は厳密な設定を挿入します。

セッションスコープのバンドル MCP ランタイムは、セッション内で再利用するためにキャッシュされ、その後
`mcp.sessionIdleTtlMs` ミリ秒のアイドル時間後に回収されます (デフォルトは 10
分、無効にするには `0` を設定)。認証プローブ、スラッグ生成、Active Memory リコールなどのワンショット埋め込み実行は、実行終了時にクリーンアップを要求するため、stdio
子プロセスと Streamable HTTP/SSE ストリームが実行後も残ることはありません。

## 制限事項

- **OpenClaw ツール呼び出しを直接行わない。** OpenClaw は CLI バックエンドプロトコルにツール呼び出しを挿入しません。バックエンドは
  `bundleMcp: true` にオプトインした場合にのみ Gateway ツールを認識します。
- **ストリーミングはバックエンド固有です。** JSONL をストリーミングするバックエンドもあれば、終了までバッファリングするバックエンドもあります。
- **構造化出力** は CLI の JSON 形式に依存します。
- **Codex CLI セッション** はテキスト出力 (JSONL なし) 経由で再開されるため、初回の `--json` 実行より構造化の度合いが低くなります。OpenClaw セッションは引き続き通常どおり動作します。

## トラブルシューティング

- **CLI が見つからない**: `command` をフルパスに設定します。
- **モデル名が誤っている**: `modelAliases` を使用して `provider/model` → CLI モデルにマッピングします。
- **セッションの継続性がない**: `sessionArg` が設定され、`sessionMode` が
  `none` でないことを確認します (Codex CLI は現在 JSON 出力で再開できません)。
- **画像が無視される**: `imageArg` を設定します (また、CLI がファイルパスをサポートしていることを確認します)。

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [ローカルモデル](/ja-JP/gateway/local-models)
