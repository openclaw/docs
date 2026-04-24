---
read_when:
    - APIプロバイダーが失敗したときの信頼できるフォールバックが必要な場合
    - Codex CLIやその他のローカルAI CLIを実行していて、それらを再利用したい場合
    - CLIバックエンドのツールアクセス向けMCPループバックブリッジを理解したい場合
summary: 'CLIバックエンド: 任意のMCPツールブリッジ付きローカルAI CLIフォールバック'
title: CLIバックエンド
x-i18n:
    generated_at: "2026-04-24T04:56:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36ea909118e173d397a21bb4ee2c33be0965be4bf57649efef038caeead3ab
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLIバックエンド（フォールバックランタイム）

OpenClawは、APIプロバイダーが停止中、レート制限中、または一時的に不安定なときに、**ローカルAI CLI** を**テキスト専用フォールバック**として実行できます。これは意図的に保守的な設計です。

- **OpenClawツールは直接注入されません**。ただし `bundleMcp: true` を持つバックエンドは、loopback MCPブリッジ経由でgatewayツールを受け取れます。
- これに対応するCLI向けの**JSONL Streaming**
- **セッション対応**（後続turnの整合性を維持）
- CLIが画像パスを受け付ける場合は**画像も受け渡し可能**

これは主経路というより**セーフティネット**として設計されています。
外部APIに依存せず、「とにかく動く」テキスト応答がほしいときに使ってください。

ACPセッション制御、バックグラウンドタスク、
スレッド/会話バインディング、永続的な外部コーディングセッションを持つ完全なハーネスランタイムが必要なら、
代わりに [ACP Agents](/ja-JP/tools/acp-agents) を使ってください。CLIバックエンドはACPではありません。

## 初心者向けクイックスタート

Codex CLIは**設定なしで**使えます（同梱のOpenAI pluginが
デフォルトバックエンドを登録します）:

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Gatewayがlaunchd/systemd配下で動作し、PATHが最小限の場合は、
コマンドパスだけ追加してください:

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

これだけです。CLI自体に必要なもの以外、キーや追加auth設定は不要です。

Gatewayホスト上で同梱CLIバックエンドを**主メッセージプロバイダー**として使う場合、
OpenClawはそのバックエンドをconfig内のモデルrefまたは
`agents.defaults.cliBackends` で明示的に参照すると、
所有する同梱pluginを自動読み込みするようになりました。

## フォールバックとして使う

CLIバックエンドをフォールバックリストに追加すると、primaryモデルが失敗したときだけ実行されます:

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

注:

- `agents.defaults.models`（許可リスト）を使う場合は、CLIバックエンドのモデルもそこに含める必要があります。
- primaryプロバイダーが失敗した場合（auth、レート制限、タイムアウト）、OpenClawは
  次にCLIバックエンドを試します。

## 設定概要

すべてのCLIバックエンドは次の下にあります:

```
agents.defaults.cliBackends
```

各エントリは**プロバイダーid**（例: `codex-cli`、`my-cli`）でキー付けされます。
プロバイダーidはモデルrefの左側になります:

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
          // CodexスタイルのCLIでは、代わりにprompt fileを指定できます:
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

1. プロバイダーprefix（`codex-cli/...`）に基づいて**バックエンドを選択**します。
2. 同じOpenClaw prompt + workspaceコンテキストを使って**システムプロンプトを構築**します。
3. 対応していればセッションid付きで**CLIを実行**し、履歴の整合性を保ちます。
   同梱の `claude-cli` バックエンドは、OpenClawセッションごとにClaude stdio processを維持し、
   後続turnをstream-json stdin経由で送信します。
4. **出力を解析**し（JSONまたはプレーンテキスト）、最終テキストを返します。
5. バックエンドごとに**セッションidを永続化**し、後続turnで同じCLIセッションを再利用します。

<Note>
同梱のAnthropic `claude-cli` バックエンドは再びサポートされています。Anthropicスタッフから
OpenClawスタイルのClaude CLI利用は再び許可されていると伝えられたため、
Anthropicが新しいポリシーを公開しない限り、OpenClawは
この統合における `claude -p` 利用を認可済みとして扱います。
</Note>

同梱のOpenAI `codex-cli` バックエンドは、OpenClawのシステムプロンプトを
Codexの `model_instructions_file` config override（`-c
model_instructions_file="..."`）経由で渡します。CodexはClaudeスタイルの
`--append-system-prompt` フラグを公開していないため、OpenClawは新しいCodex CLIセッションごとに
組み立てたpromptを一時ファイルへ書き出します。

同梱のAnthropic `claude-cli` バックエンドは、OpenClawのSkillsスナップショットを
2つの方法で受け取ります。追記されるシステムプロンプト内のコンパクトなOpenClaw Skillsカタログと、
`--plugin-dir` で渡される一時的なClaude Code pluginです。
このpluginにはそのagent/セッションで適格なSkillsだけが含まれるため、Claude Codeのネイティブskill resolverは、
OpenClawが本来プロンプト内で通知するのと同じフィルター済みセットを見ます。
skillのenv/APIキーoverrideは、実行時の子プロセス環境に対して引き続きOpenClawが適用します。

Claude CLIには独自の非対話permission modeもあります。OpenClawはClaude固有設定を増やす代わりに、
これを既存のexecポリシーへマッピングします。実効的に要求されたexecポリシーがYOLO
（`tools.exec.security: "full"` かつ
`tools.exec.ask: "off"`）の場合、OpenClawは `--permission-mode bypassPermissions` を追加します。
agentごとの `agents.list[].tools.exec` 設定は、そのagentについてグローバルな `tools.exec` を上書きします。
異なるClaude modeを強制したい場合は、
`agents.defaults.cliBackends.claude-cli.args` および対応する `resumeArgs` の下に
`--permission-mode default` や `--permission-mode acceptEdits` のような明示的なraw backend argsを設定してください。

OpenClawが同梱の `claude-cli` バックエンドを使うには、その前にClaude Code自体が
同じホスト上ですでにログイン済みである必要があります:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`claude` バイナリがすでに `PATH` 上にある場合を除き、
`agents.defaults.cliBackends.claude-cli.command` を使ってください。

## セッション

- CLIがセッションに対応している場合は、`sessionArg`（例: `--session-id`）または
  `sessionArgs`（プレースホルダー `{sessionId}`）を設定します。これはIDを複数フラグに
  挿入する必要がある場合に使います。
- CLIが**resumeサブコマンド**を使い、フラグが異なる場合は、
  `resumeArgs` を設定します（resume時は `args` を置き換えます）。必要に応じて
  `resumeOutput`（非JSON resume用）も設定できます。
- `sessionMode`:
  - `always`: 常にセッションidを送る（保存済みがなければ新しいUUID）。
  - `existing`: 以前に保存されている場合のみセッションidを送る。
  - `none`: セッションidを一切送らない。
- `claude-cli` はデフォルトで `liveSession: "claude-stdio"`、`output: "jsonl"`、
  `input: "stdin"` を使うため、後続turnはアクティブな間、
  live Claude processを再利用します。warm stdioが現在のデフォルトで、
  transport fieldを省略したカスタム設定でも同様です。Gatewayが再起動したり、
  idle processが終了したりすると、OpenClawは保存済みClaude session idからresumeします。保存済みsession
  idは、resume前に既存の読み取り可能なproject transcriptに対して検証されるため、
  幽霊バインディングは `--resume` の下で黙って新しいClaude CLIセッションを始める代わりに
  `reason=transcript-missing` でクリアされます。
- 保存済みCLIセッションは、プロバイダー所有の継続性です。
  暗黙のデイリーセッションリセットでは切れませんが、`/reset` と明示的な
  `session.reset` ポリシーでは切れます。

シリアライズに関する注記:

- `serialize: true` は同一laneの実行順序を維持します。
- ほとんどのCLIは1つのprovider lane上でシリアライズされます。
- OpenClawは、選択されたauth identityが変わると、保存済みCLIセッション再利用を破棄します。
  これには、変更されたauth profile id、静的APIキー、静的token、またはCLIが公開する場合のOAuth
  account identityが含まれます。OAuth access tokenとrefresh tokenの
  ローテーションでは保存済みCLIセッションは切れません。CLIが安定したOAuth account idを公開しない場合、
  OpenClawはそのCLI側にresume permission強制を委ねます。

## 画像（パススルー）

CLIが画像パスを受け付ける場合は、`imageArg` を設定します:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClawはbase64画像を一時ファイルへ書き出します。`imageArg` が設定されていれば、
それらのパスはCLI引数として渡されます。`imageArg` がない場合、OpenClawは
ファイルパスをプロンプトへ追記します（path injection）。これは、プレーンなパスから
ローカルファイルを自動ロードするCLIには十分です。

## 入力 / 出力

- `output: "json"`（デフォルト）はJSON解析を試み、テキスト + session idを抽出します。
- Gemini CLI JSON出力では、OpenClawは返信テキストを `response` から読み取り、
  `usage` が存在しないか空の場合は `stats` からusageを読み取ります。
- `output: "jsonl"` はJSONL stream（例: Codex CLI `--json`）を解析し、存在すれば最終agent messageと
  session identifierを抽出します。
- `output: "text"` はstdoutを最終応答として扱います。

入力モード:

- `input: "arg"`（デフォルト）はプロンプトを最後のCLI引数として渡します。
- `input: "stdin"` はプロンプトをstdin経由で送ります。
- プロンプトが非常に長く、`maxPromptArgChars` が設定されている場合は、stdinが使われます。

## デフォルト（Pluginが所有）

同梱のOpenAI pluginは `codex-cli` 用のデフォルトも登録します:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

同梱のGoogle pluginも `google-gemini-cli` 用のデフォルトを登録します:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件: ローカルのGemini CLIがインストール済みで、
`PATH` 上の `gemini` として利用可能である必要があります（`brew install gemini-cli` または
`npm install -g @google/gemini-cli`）。

Gemini CLI JSONに関する注記:

- 返信テキストはJSONの `response` フィールドから読み取られます。
- `usage` が存在しないか空の場合、usageは `stats` にフォールバックします。
- `stats.cached` はOpenClawの `cacheRead` に正規化されます。
- `stats.input` が存在しない場合、OpenClawは入力tokenを
  `stats.input_tokens - stats.cached` から導出します。

必要な場合にのみoverrideしてください（よくあるのは絶対 `command` パス）。

## Pluginが所有するデフォルト

CLIバックエンドのデフォルトは現在pluginサーフェスの一部です:

- Pluginは `api.registerCliBackend(...)` でそれらを登録します。
- バックエンドの `id` はモデルref内のprovider prefixになります。
- `agents.defaults.cliBackends.<id>` 内のユーザーconfigは、引き続きpluginデフォルトを上書きします。
- バックエンド固有のconfigクリーンアップは、任意の
  `normalizeConfig` hookを通じて引き続きplugin側が所有します。

小さなprompt/message互換shimが必要なPluginは、providerやCLIバックエンドを置き換えずに、
双方向テキスト変換を宣言できます:

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

`input` はCLIへ渡すシステムプロンプトとユーザープロンプトを書き換えます。`output`
は、OpenClawが自身のcontrol marker処理とチャンネル配信を行う前に、
Streamingされたassistant deltaと解析済み最終テキストを書き換えます。

Claude Codeのstream-json互換JSONLを出力するCLIでは、
そのバックエンド設定に `jsonlDialect: "claude-stream-json"` を設定してください。

## バンドルMCPオーバーレイ

CLIバックエンドは**OpenClawツール呼び出しを直接受け取りません**が、バックエンドは
`bundleMcp: true` で生成されるMCP configオーバーレイにオプトインできます。

現在の同梱動作:

- `claude-cli`: 生成された厳格なMCP configファイル
- `codex-cli`: `mcp_servers` 向けのインラインconfig override。生成された
  OpenClaw loopbackサーバーには、Codexのサーバーごとのtool approval modeが設定されるため、
  MCP呼び出しがローカル承認プロンプトで停止しません
- `google-gemini-cli`: 生成されたGemini system settingsファイル

bundle MCPが有効な場合、OpenClawは次を行います:

- gatewayツールをCLI processに公開するloopback HTTP MCPサーバーを起動する
- セッションごとのtoken（`OPENCLAW_MCP_TOKEN`）でブリッジを認証する
- ツールアクセスを現在のセッション、アカウント、チャンネルコンテキストにスコープする
- 現在のworkspaceで有効なbundle-MCPサーバーを読み込む
- それらを既存のbackend MCP config/settings形状とマージする
- 所有extensionのbackend所有integration modeを使って起動configを書き換える

有効なMCPサーバーが1つもない場合でも、バックグラウンド実行を分離したままにするため、
backendがbundle MCPにオプトインしていれば、OpenClawは引き続き厳格なconfigを注入します。

## 制限

- **直接のOpenClawツール呼び出しはありません。** OpenClawはCLIバックエンドプロトコルへ
  ツール呼び出しを直接注入しません。バックエンドがgatewayツールを見るのは、
  `bundleMcp: true` にオプトインした場合だけです。
- **Streamingはバックエンド依存です。** JSONLをStreamingするバックエンドもあれば、
  終了までバッファリングするものもあります。
- **構造化出力** はCLIのJSON形式に依存します。
- **Codex CLIセッション** はテキスト出力経由でresumeします（JSONLではない）ため、
  初回の `--json` 実行より構造化が弱くなります。それでもOpenClawセッション自体は通常どおり機能します。

## トラブルシューティング

- **CLIが見つからない**: `command` にフルパスを設定してください。
- **モデル名が違う**: `modelAliases` を使って `provider/model` → CLI model にマッピングしてください。
- **セッション継続性がない**: `sessionArg` が設定され、`sessionMode` が
  `none` でないことを確認してください（Codex CLIは現在JSON出力でresumeできません）。
- **画像が無視される**: `imageArg` を設定してください（そしてCLIがファイルパスをサポートしていることを確認してください）。

## 関連

- [Gateway runbook](/ja-JP/gateway)
- [Local models](/ja-JP/gateway/local-models)
