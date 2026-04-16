---
read_when:
    - APIプロバイダーが失敗したときに、信頼できるフォールバックが必要です
    - Codex CLIや他のローカルAI CLIを実行していて、それらを再利用したいと考えています
    - CLIバックエンドのツールアクセス向けMCPループバックブリッジを理解したいと考えています
summary: 'CLIバックエンド: オプションのMCPツールブリッジを備えたローカルAI CLIフォールバック'
title: CLIバックエンド
x-i18n:
    generated_at: "2026-04-16T19:31:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 381273532a8622bc4628000a6fb999712b12af08faade2b5f2b7ac4cc7d23efe
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLIバックエンド（フォールバックランタイム）

OpenClawは、APIプロバイダーが停止している、レート制限されている、または一時的に不安定な場合に、**テキスト専用のフォールバック**として**ローカルAI CLI**を実行できます。これは意図的に保守的な設計です。

- **OpenClawツールは直接注入されません**が、`bundleMcp: true` を持つバックエンドはループバックMCPブリッジ経由でGatewayツールを受け取れます。
- 対応するCLI向けの**JSONLストリーミング**。
- **セッションに対応**しています（そのため後続ターンの一貫性が保たれます）。
- CLIが画像パスを受け付ける場合は、**画像をそのまま渡せます**。

これは主要経路ではなく、**セーフティネット**として設計されています。外部APIに依存せず「常に動作する」テキスト応答が必要なときに使ってください。

ACPのセッション制御、バックグラウンドタスク、スレッド/会話バインディング、永続的な外部コーディングセッションを備えた完全なハーネスランタイムが必要な場合は、代わりに[ACP Agents](/ja-JP/tools/acp-agents)を使用してください。CLIバックエンドはACPではありません。

## 初心者向けクイックスタート

Codex CLIは**設定なしで**使用できます（バンドルされたOpenAI Pluginがデフォルトのバックエンドを登録します）。

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Gatewayがlaunchd/systemd配下で実行されていてPATHが最小限の場合は、コマンドパスだけを追加してください。

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

これで完了です。CLI自体に必要なもの以外に、キーや追加の認証設定は不要です。

Gatewayホスト上で、バンドルされたCLIバックエンドを**主要なメッセージプロバイダー**として使う場合、設定でそのバックエンドをモデル参照または `agents.defaults.cliBackends` の下で明示的に参照すると、OpenClawはその所有元のバンドルPluginを自動で読み込みます。

## フォールバックとして使う

CLIバックエンドをフォールバック一覧に追加すると、主要モデルが失敗したときだけ実行されます。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

注意:

- `agents.defaults.models`（許可リスト）を使う場合は、そこにCLIバックエンドのモデルも含める必要があります。
- 主要プロバイダーが失敗した場合（認証、レート制限、タイムアウト）、OpenClawは次にCLIバックエンドを試します。

## 設定概要

すべてのCLIバックエンドは次の場所にあります。

```
agents.defaults.cliBackends
```

各エントリは**provider id**（例: `codex-cli`, `my-cli`）をキーにします。  
provider idはモデル参照の左側になります。

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
          // CodexスタイルのCLIでは、代わりにプロンプトファイルを指定できます:
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

1. provider prefix（`codex-cli/...`）に基づいて**バックエンドを選択**します。
2. 同じOpenClawプロンプトとワークスペースコンテキストを使って**システムプロンプトを構築**します。
3. 履歴の一貫性を保つため、対応していればセッションid付きで**CLIを実行**します。
4. **出力を解析**し（JSONまたはプレーンテキスト）、最終的なテキストを返します。
5. **バックエンドごとにセッションidを保存**し、後続のやり取りで同じCLIセッションを再利用します。

<Note>
バンドルされたAnthropic `claude-cli` バックエンドが再びサポートされています。Anthropicのスタッフから、OpenClawスタイルのClaude CLI利用は再び許可されていると伝えられたため、Anthropicが新しいポリシーを公開しない限り、OpenClawはこの統合における `claude -p` の利用を公認されたものとして扱います。
</Note>

バンドルされたOpenAI `codex-cli` バックエンドは、Codexの `model_instructions_file` 設定オーバーライド（`-c
model_instructions_file="..."`）を通してOpenClawのシステムプロンプトを渡します。CodexにはClaudeスタイルの `--append-system-prompt` フラグがないため、OpenClawはCodex CLIの新しい各セッションごとに組み立てたプロンプトを一時ファイルへ書き出します。

バンドルされたAnthropic `claude-cli` バックエンドは、OpenClawのSkillsスナップショットを2つの方法で受け取ります。1つは追加されるシステムプロンプト内のコンパクトなOpenClaw Skillsカタログ、もう1つは `--plugin-dir` で渡される一時的なClaude Code pluginです。このpluginにはそのagent/sessionに適格なSkillsだけが含まれるため、Claude Codeネイティブのskill resolverは、OpenClawがプロンプト内で通知する場合と同じフィルタ済みセットを認識します。Skillのenv/API keyオーバーライドは、実行時の子プロセス環境に対して引き続きOpenClawが適用します。

## セッション

- CLIがセッションに対応している場合は、`sessionArg`（例: `--session-id`）または `sessionArgs`（プレースホルダー `{sessionId}`）を設定してください。IDを複数のフラグに挿入する必要がある場合に使います。
- CLIが異なるフラグを使う**resumeサブコマンド**を使用する場合は、`resumeArgs` を設定します（再開時は `args` を置き換えます）。必要に応じて `resumeOutput` も設定してください（非JSONのresume向け）。
- `sessionMode`:
  - `always`: 常にセッションidを送信します（保存済みがなければ新しいUUID）。
  - `existing`: 以前に保存されたセッションidがある場合のみ送信します。
  - `none`: セッションidを送信しません。

シリアライズに関する注意:

- `serialize: true` は同じレーン内の実行順を維持します。
- ほとんどのCLIは1つのprovider laneで直列化されます。
- OpenClawは、再ログイン、トークンローテーション、認証プロファイル資格情報の変更を含め、バックエンドの認証状態が変わると、保存済みCLIセッションの再利用を破棄します。

## 画像（パススルー）

CLIが画像パスを受け付ける場合は、`imageArg` を設定します。

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClawはbase64画像を一時ファイルへ書き出します。`imageArg` が設定されていれば、それらのパスがCLI引数として渡されます。`imageArg` がない場合、OpenClawはファイルパスをプロンプトに追記します（path injection）。これは、プレーンなパスからローカルファイルを自動読み込みするCLIには十分です。

## 入力 / 出力

- `output: "json"`（デフォルト）はJSONを解析し、テキストとセッションidを抽出しようとします。
- Gemini CLIのJSON出力では、`usage` がないか空の場合、OpenClawは応答テキストを `response` から、使用量を `stats` から読み取ります。
- `output: "jsonl"` はJSONLストリーム（たとえばCodex CLI `--json`）を解析し、存在する場合は最終agent messageとセッション識別子を抽出します。
- `output: "text"` はstdoutを最終応答として扱います。

入力モード:

- `input: "arg"`（デフォルト）は、プロンプトを最後のCLI引数として渡します。
- `input: "stdin"` は、プロンプトをstdin経由で送ります。
- プロンプトが非常に長く、`maxPromptArgChars` が設定されている場合は、stdinが使われます。

## デフォルト（Plugin所有）

バンドルされたOpenAI Pluginは `codex-cli` のデフォルトも登録します。

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

バンドルされたGoogle Pluginは `google-gemini-cli` のデフォルトも登録します。

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件: ローカルGemini CLIがインストールされており、`PATH` 上で `gemini` として利用可能である必要があります（`brew install gemini-cli` または
`npm install -g @google/gemini-cli`）。

Gemini CLIのJSONに関する注意:

- 応答テキストはJSONの `response` フィールドから読み取られます。
- 使用量は、`usage` が存在しないか空の場合に `stats` にフォールバックします。
- `stats.cached` はOpenClawの `cacheRead` に正規化されます。
- `stats.input` がない場合、OpenClawは `stats.input_tokens - stats.cached` から入力トークン数を導出します。

必要な場合のみオーバーライドしてください（一般的なのは絶対 `command` パスです）。

## Plugin所有のデフォルト

CLIバックエンドのデフォルトは、現在ではPluginサーフェスの一部です。

- Pluginは `api.registerCliBackend(...)` でそれらを登録します。
- バックエンドの `id` はモデル参照のprovider prefixになります。
- `agents.defaults.cliBackends.<id>` にあるユーザー設定は、引き続きPluginデフォルトを上書きします。
- バックエンド固有の設定クリーンアップは、オプションの `normalizeConfig` フックを通じて引き続きPlugin所有です。

小さなプロンプト/メッセージ互換シムが必要なPluginは、providerやCLIバックエンドを置き換えることなく、双方向のテキスト変換を宣言できます。

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

`input` はCLIに渡されるシステムプロンプトとユーザープロンプトを書き換えます。`output` は、OpenClawが独自の制御マーカー処理とチャネル配信を行う前に、ストリーミングされたassistant deltaと解析済み最終テキストを書き換えます。

Claude Code stream-json互換のJSONLを出力するCLIでは、そのバックエンド設定で `jsonlDialect: "claude-stream-json"` を設定してください。

## Bundle MCPオーバーレイ

CLIバックエンドは**OpenClawツール呼び出しを直接受け取りません**が、バックエンドは `bundleMcp: true` で生成されたMCP設定オーバーレイにオプトインできます。

現在のバンドル動作:

- `claude-cli`: 生成されたstrict MCP設定ファイル
- `codex-cli`: `mcp_servers` のインライン設定オーバーライド
- `google-gemini-cli`: 生成されたGemini system settingsファイル

bundle MCPが有効な場合、OpenClawは次のことを行います。

- CLIプロセスにGatewayツールを公開するループバックHTTP MCPサーバーを起動する
- セッションごとのトークン（`OPENCLAW_MCP_TOKEN`）でブリッジを認証する
- ツールアクセスを現在のセッション、アカウント、チャネルコンテキストにスコープする
- 現在のワークスペースで有効なbundle-MCPサーバーを読み込む
- それらを既存のバックエンドMCP設定/設定形状とマージする
- 所有元extensionのバックエンド所有統合モードを使って起動設定を書き換える

MCPサーバーが有効でない場合でも、バックエンドがbundle MCPにオプトインしていれば、バックグラウンド実行を隔離した状態に保つため、OpenClawはstrict設定を注入します。

## 制限事項

- **直接のOpenClawツール呼び出しはありません。** OpenClawはツール呼び出しをCLIバックエンドプロトコルへ直接注入しません。バックエンドがGatewayツールを認識するのは、`bundleMcp: true` にオプトインした場合だけです。
- **ストリーミングはバックエンド依存です。** JSONLをストリーミングするバックエンドもあれば、終了までバッファするものもあります。
- **構造化出力**はCLIのJSON形式に依存します。
- **Codex CLIセッション**はテキスト出力経由で再開されます（JSONLではありません）。そのため、初回の `--json` 実行より構造化が弱くなります。OpenClawセッション自体は通常どおり機能します。

## トラブルシューティング

- **CLIが見つからない**: `command` をフルパスに設定してください。
- **モデル名が間違っている**: `modelAliases` を使って `provider/model` → CLIモデルにマッピングしてください。
- **セッションの継続性がない**: `sessionArg` が設定され、`sessionMode` が `none` ではないことを確認してください（Codex CLIは現在JSON出力で再開できません）。
- **画像が無視される**: `imageArg` を設定し（CLIがファイルパスに対応していることも確認してください）。
