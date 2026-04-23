---
read_when:
    - APIプロバイダーが失敗したときに、信頼できるフォールバックが必要です
    - Codex CLIやその他のローカルAI CLIを実行していて、それらを再利用したい場合
    - CLIバックエンドのツールアクセスのためのMCP loopbackブリッジを理解したい場合
summary: 'CLIバックエンド: オプションのMCPツールブリッジを備えたローカルAI CLIフォールバック'
title: CLIバックエンド
x-i18n:
    generated_at: "2026-04-23T15:00:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff7458d18b8a5b716930579241177917fd3edffcf7f6e211c7d570cf76519316
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLIバックエンド（フォールバックランタイム）

OpenClawは、APIプロバイダーがダウンしている、レート制限されている、または一時的に不安定なときに、**テキストのみのフォールバック**として**ローカルAI CLI**を実行できます。これは意図的に保守的な設計です。

- **OpenClawツールは直接注入されません**が、`bundleMcp: true` を持つバックエンドは、loopback MCPブリッジ経由でgatewayツールを受け取れます。
- 対応するCLI向けの**JSONLストリーミング**。
- **セッションをサポート**しているため、後続のターンでも一貫性が保たれます。
- CLIが画像パスを受け付ける場合は、**画像をそのまま渡せます**。

これは、主要な経路というより**セーフティネット**として設計されています。外部APIに依存せずに「常に動作する」テキスト応答が必要なときに使ってください。

ACPセッション制御、バックグラウンドタスク、スレッド/会話バインディング、永続的な外部コーディングセッションを備えた完全なハーネスランタイムが必要な場合は、代わりに [ACP Agents](/ja-JP/tools/acp-agents) を使ってください。CLIバックエンドはACPではありません。

## 初心者向けクイックスタート

Codex CLIは**設定なしで**使えます（同梱のOpenAI Pluginがデフォルトのバックエンドを登録します）。

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

gatewayがlaunchd/systemd配下で動作していてPATHが最小限の場合は、コマンドパスだけを追加してください。

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

これだけです。CLI自体に必要なもの以外に、キーや追加の認証設定は不要です。

gatewayホスト上で、同梱のCLIバックエンドを**主要メッセージプロバイダー**として使う場合、設定でそのバックエンドをモデル参照、または `agents.defaults.cliBackends` 配下で明示的に参照すると、OpenClawはその所有元の同梱Pluginを自動読み込みするようになりました。

## フォールバックとして使う

CLIバックエンドをフォールバックリストに追加すると、主要モデルが失敗したときだけ実行されます。

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

- `agents.defaults.models`（許可リスト）を使う場合は、CLIバックエンドのモデルもそこに含める必要があります。
- 主要プロバイダーが失敗した場合（認証、レート制限、タイムアウト）、OpenClawは次にCLIバックエンドを試します。

## 設定概要

すべてのCLIバックエンドは次の場所にあります。

```
agents.defaults.cliBackends
```

各エントリーは**provider id**（例: `codex-cli`, `my-cli`）でキー付けされます。  
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

1. providerプレフィックス（`codex-cli/...`）に基づいて**バックエンドを選択**します。
2. 同じOpenClawプロンプトとワークスペースコンテキストを使って**システムプロンプトを構築**します。
3. 履歴の一貫性を保つため、対応している場合はセッションid付きで**CLIを実行**します。  
   同梱の `claude-cli` バックエンドは、OpenClawセッションごとにClaude stdioプロセスを維持し、後続ターンをstream-json stdin経由で送信します。
4. **出力を解析**し（JSONまたはプレーンテキスト）、最終テキストを返します。
5. バックエンドごとに**セッションidを永続化**し、後続ターンで同じCLIセッションを再利用します。

<Note>
同梱のAnthropic `claude-cli` バックエンドが再びサポートされました。Anthropicのスタッフから、OpenClawスタイルのClaude CLI利用は再び許可されていると案内されたため、Anthropicが新しいポリシーを公開しない限り、OpenClawはこの連携における `claude -p` の使用を公認済みとして扱います。
</Note>

同梱のOpenAI `codex-cli` バックエンドは、Codexの `model_instructions_file` 設定オーバーライド（`-c model_instructions_file="..."`）を通して、OpenClawのシステムプロンプトを渡します。CodexはClaudeスタイルの `--append-system-prompt` フラグを公開していないため、OpenClawは新しいCodex CLIセッションごとに組み立てたプロンプトを一時ファイルに書き出します。

同梱のAnthropic `claude-cli` バックエンドは、OpenClawのSkillsスナップショットを2つの方法で受け取ります。1つは追加されたシステムプロンプト内のコンパクトなOpenClaw Skillsカタログ、もう1つは `--plugin-dir` で渡される一時的なClaude Code Pluginです。このPluginにはそのagent/セッションで利用資格のあるSkillsのみが含まれるため、Claude Codeネイティブのskill resolverは、OpenClawがそれ以外ならプロンプト内で通知するのと同じフィルタ済みセットを認識します。Skillのenv/APIキー上書きは、実行時にOpenClawから子プロセス環境へ引き続き適用されます。

OpenClawが同梱の `claude-cli` バックエンドを使う前に、Claude Code自体が同じホスト上ですでにログイン済みである必要があります。

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`claude` バイナリがすでに `PATH` 上にある場合を除き、`agents.defaults.cliBackends.claude-cli.command` を使ってください。

## セッション

- CLIがセッションをサポートする場合は、`sessionArg`（例: `--session-id`）または `sessionArgs`（複数のフラグにIDを挿入する必要がある場合のプレースホルダー `{sessionId}`）を設定します。
- CLIが異なるフラグを持つ**resumeサブコマンド**を使う場合は、`resumeArgs`（再開時に `args` を置き換えます）を設定し、必要に応じて `resumeOutput`（非JSONのresume用）も設定します。
- `sessionMode`:
  - `always`: 常にセッションidを送信します（保存済みがなければ新しいUUID）。
  - `existing`: 以前に保存されている場合のみセッションidを送信します。
  - `none`: セッションidを送信しません。
- `claude-cli` は、`liveSession: "claude-stdio"`、`output: "jsonl"`、`input: "stdin"` をデフォルトとし、アクティブな間は後続ターンがライブClaudeプロセスを再利用します。現在は、トランスポートフィールドを省略したカスタム設定も含め、ウォームなstdioがデフォルトです。Gatewayが再起動するか、アイドル状態のプロセスが終了した場合、OpenClawは保存されたClaudeセッションidから再開します。保存されたセッションidは再開前に既存の読み取り可能なプロジェクトトランスクリプトに対して検証されるため、実体のないバインディングは `--resume` で新しいClaude CLIセッションを黙って開始する代わりに、`reason=transcript-missing` でクリアされます。
- 保存されたCLIセッションはprovider所有の継続性です。暗黙の日次セッションリセットでは切断されませんが、`/reset` および明示的な `session.reset` ポリシーでは切断されます。

シリアライズに関する注意:

- `serialize: true` は同じレーンの実行順序を維持します。
- ほとんどのCLIは1つのproviderレーンでシリアライズされます。
- 選択された認証IDが変わった場合、OpenClawは保存済みCLIセッションの再利用を破棄します。これには、auth profile idの変更、静的APIキー、静的トークン、またはCLIが公開している場合のOAuthアカウントIDの変更が含まれます。OAuthのアクセストークンとリフレッシュトークンのローテーションでは、保存済みCLIセッションは切断されません。CLIが安定したOAuthアカウントIDを公開しない場合、OpenClawはそのCLIにresume権限の強制を任せます。

## 画像（パススルー）

CLIが画像パスを受け付ける場合は、`imageArg` を設定します。

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClawはbase64画像を一時ファイルに書き出します。`imageArg` が設定されている場合、それらのパスはCLI引数として渡されます。`imageArg` がない場合、OpenClawはファイルパスをプロンプトに追記します（パス注入）。これは、プレーンなパスからローカルファイルを自動読み込みするCLIには十分です。

## 入出力

- `output: "json"`（デフォルト）はJSONを解析し、テキストとセッションidの抽出を試みます。
- Gemini CLIのJSON出力では、`usage` が存在しないか空の場合、OpenClawは返信テキストを `response` から、使用量を `stats` から読み取ります。
- `output: "jsonl"` はJSONLストリーム（たとえばCodex CLIの `--json`）を解析し、存在する場合は最終agentメッセージとセッション識別子を抽出します。
- `output: "text"` はstdoutを最終応答として扱います。

入力モード:

- `input: "arg"`（デフォルト）は、プロンプトを最後のCLI引数として渡します。
- `input: "stdin"` は、プロンプトをstdin経由で送信します。
- プロンプトが非常に長く、`maxPromptArgChars` が設定されている場合は、stdinが使われます。

## デフォルト（Plugin所有）

同梱のOpenAI Pluginは、`codex-cli` 用のデフォルトも登録します。

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

同梱のGoogle Pluginは、`google-gemini-cli` 用のデフォルトも登録します。

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件: ローカルのGemini CLIがインストールされ、`PATH` 上で `gemini` として利用可能である必要があります（`brew install gemini-cli` または `npm install -g @google/gemini-cli`）。

Gemini CLI JSONに関する注意:

- 返信テキストはJSONの `response` フィールドから読み取られます。
- 使用量は、`usage` が存在しない場合または空の場合に `stats` にフォールバックします。
- `stats.cached` はOpenClawの `cacheRead` に正規化されます。
- `stats.input` が存在しない場合、OpenClawは `stats.input_tokens - stats.cached` から入力トークンを導出します。

必要な場合のみ上書きしてください（一般的なのは絶対 `command` パスです）。

## Plugin所有のデフォルト

CLIバックエンドのデフォルトは、現在ではPluginサーフェスの一部です。

- Pluginは `api.registerCliBackend(...)` でそれらを登録します。
- バックエンドの `id` はモデル参照のproviderプレフィックスになります。
- `agents.defaults.cliBackends.<id>` にあるユーザー設定は、引き続きPluginデフォルトを上書きします。
- バックエンド固有の設定クリーンアップは、オプションの `normalizeConfig` フックを通じて引き続きPlugin所有のままです。

小さなプロンプト/メッセージ互換性シムが必要なPluginは、providerやCLIバックエンドを置き換えずに双方向のテキスト変換を宣言できます。

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

`input` は、CLIに渡されるシステムプロンプトとユーザープロンプトを書き換えます。`output` は、OpenClawが自身の制御マーカー処理とチャネル配信を行う前に、ストリーミングされたassistant deltaと解析済みの最終テキストを書き換えます。

Claude Code stream-json互換のJSONLを出力するCLIでは、そのバックエンド設定に `jsonlDialect: "claude-stream-json"` を設定してください。

## Bundle MCPオーバーレイ

CLIバックエンドは**OpenClawツール呼び出しを直接受け取りません**が、バックエンドは `bundleMcp: true` で生成されるMCP設定オーバーレイにオプトインできます。

現在の同梱動作:

- `claude-cli`: 生成されたstrict MCP設定ファイル
- `codex-cli`: `mcp_servers` 用のインライン設定オーバーライド
- `google-gemini-cli`: 生成されたGeminiシステム設定ファイル

bundle MCPが有効な場合、OpenClawは次を行います。

- CLIプロセスにgatewayツールを公開するloopback HTTP MCPサーバーを起動する
- セッションごとのトークン（`OPENCLAW_MCP_TOKEN`）でブリッジを認証する
- ツールアクセスを現在のセッション、アカウント、チャネルコンテキストにスコープする
- 現在のワークスペースに対して有効なbundle-MCPサーバーを読み込む
- それらを既存のバックエンドMCP設定/設定形状とマージする
- 所有元extensionのバックエンド所有統合モードを使って起動設定を書き換える

MCPサーバーが1つも有効でない場合でも、バックエンドがbundle MCPにオプトインしていれば、バックグラウンド実行を分離した状態に保つために、OpenClawはstrict設定を引き続き注入します。

## 制限事項

- **OpenClawツール呼び出しの直接利用はできません。** OpenClawはCLIバックエンドプロトコルにツール呼び出しを注入しません。バックエンドが `bundleMcp: true` にオプトインした場合にのみ、gatewayツールを認識できます。
- **ストリーミングはバックエンド依存です。** JSONLをストリーミングするバックエンドもあれば、終了までバッファするバックエンドもあります。
- **構造化出力**はCLIのJSON形式に依存します。
- **Codex CLIセッション**はテキスト出力経由で再開されます（JSONLではありません）。そのため、最初の `--json` 実行より構造化が弱くなります。それでもOpenClawセッション自体は通常どおり動作します。

## トラブルシューティング

- **CLIが見つからない**: `command` にフルパスを設定してください。
- **モデル名が間違っている**: `modelAliases` を使って `provider/model` → CLIモデル をマッピングしてください。
- **セッションの継続性がない**: `sessionArg` が設定されていて、`sessionMode` が `none` ではないことを確認してください（Codex CLIは現在、JSON出力で再開できません）。
- **画像が無視される**: `imageArg` を設定し（あわせてCLIがファイルパスをサポートしていることを確認してください）。
