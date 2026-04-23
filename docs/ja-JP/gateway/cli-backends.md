---
read_when:
    - API provider が失敗したときの信頼できるフォールバックが必要な場合
    - Codex CLI やその他のローカル AI CLI を実行していて、それらを再利用したい場合
    - CLI バックエンドの tool アクセス向け MCP loopback ブリッジを理解したい場合
summary: 'CLI バックエンド: 任意の MCP tool ブリッジを備えたローカル AI CLI フォールバック'
title: CLI バックエンド
x-i18n:
    generated_at: "2026-04-23T14:03:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475923b36e4580d3e4e57014ff2e6b89e9eb52c11b0a0ab1fc8241655b07836e
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI バックエンド（フォールバックランタイム）

OpenClaw は、API provider が停止している、レート制限されている、または一時的に不安定な場合に、**ローカル AI CLI** を **テキスト専用フォールバック** として実行できます。これは意図的に保守的な設計です:

- **OpenClaw tools は直接注入されません** が、`bundleMcp: true` を持つバックエンドは
  loopback MCP ブリッジ経由で gateway tools を受け取れます。
- 対応する CLI 向けの **JSONL ストリーミング**。
- **セッションをサポート** しているため、追加入力でも一貫性が保たれます。
- CLI が画像 path を受け付ける場合、**画像も引き渡せます**。

これはメイン経路というより **セーフティネット** として設計されています。外部 API に依存せず、
「とにかく動く」テキスト応答が欲しいときに使ってください。

ACP セッション制御、バックグラウンドタスク、
thread/conversation バインディング、永続的な外部 coding セッションを備えた完全な harness runtime が必要なら、
代わりに [ACP Agents](/ja-JP/tools/acp-agents) を使用してください。CLI バックエンドは ACP ではありません。

## 初心者向けクイックスタート

設定なしでも Codex CLI を使用できます（バンドルされた OpenAI plugin が
デフォルトのバックエンドを登録します）:

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

gateway が launchd/systemd 配下で動作していて PATH が最小限の場合は、
コマンド path だけを追加してください:

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

これだけです。CLI 自体に必要なものを除いて、キーも追加の認証設定も不要です。

バンドルされた CLI バックエンドを gateway host 上の**主要メッセージ provider** として使う場合、
OpenClaw は、設定が model ref や
`agents.defaults.cliBackends` の下でそのバックエンドを明示的に参照していれば、
所有している bundled plugin を自動的に読み込むようになりました。

## フォールバックとして使う

CLI バックエンドをフォールバック一覧に追加すると、主要モデルが失敗したときだけ実行されます:

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

- `agents.defaults.models`（許可リスト）を使う場合は、CLI バックエンドのモデルもそこに含める必要があります。
- 主要 provider が失敗した場合（認証、レート制限、タイムアウト）、OpenClaw は
  次に CLI バックエンドを試します。

## 設定の概要

すべての CLI バックエンドは以下に配置されます:

```
agents.defaults.cliBackends
```

各エントリは **provider id**（例: `codex-cli`, `my-cli`）をキーにします。
provider id は model ref の左側になります:

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

1. provider 接頭辞（`codex-cli/...`）に基づいて **バックエンドを選択** します。
2. 同じ OpenClaw prompt + workspace コンテキストを使って **system prompt を構築** します。
3. 履歴の一貫性を保つため、CLI が対応していれば session id 付きで **CLI を実行** します。
   バンドルされた `claude-cli` バックエンドは、OpenClaw セッションごとに
   Claude stdio process を維持し、追加入力を stream-json stdin 経由で送ります。
4. 出力（JSON またはプレーンテキスト）を **解析** し、最終テキストを返します。
5. バックエンドごとに session id を **永続化** し、追加入力で同じ CLI セッションを再利用します。

<Note>
バンドルされた Anthropic `claude-cli` バックエンドは再びサポートされています。Anthropic のスタッフから、
OpenClaw スタイルの Claude CLI 利用は再び許可されると伝えられたため、Anthropic が新しいポリシーを公開しない限り、
OpenClaw はこの統合における `claude -p` 使用を許可済みとして扱います。
</Note>

バンドルされた OpenAI `codex-cli` バックエンドは、OpenClaw の system prompt を
Codex の `model_instructions_file` 設定上書き（`-c
model_instructions_file="..."`）経由で渡します。Codex には Claude スタイルの
`--append-system-prompt` フラグがないため、OpenClaw は新しい Codex CLI セッションごとに
組み立てた prompt を一時ファイルへ書き出します。

バンドルされた Anthropic `claude-cli` バックエンドは、OpenClaw の Skills スナップショットを
2 つの方法で受け取ります。ひとつは追加された system prompt 内のコンパクトな OpenClaw Skills カタログ、
もうひとつは `--plugin-dir` で渡される一時的な Claude Code plugin です。
その plugin には、その agent/session に適格な Skills だけが含まれているため、Claude Code のネイティブな Skill
resolver には、OpenClaw が prompt 内で通知するのと同じフィルタ済みセットが見えます。
Skill の env/API key 上書きは、実行時に引き続き OpenClaw が子プロセス環境へ適用します。

## セッション

- CLI がセッションをサポートしている場合は、`sessionArg`（例: `--session-id`）または
  `sessionArgs`（複数のフラグに `{sessionId}` を挿入する必要がある場合のプレースホルダー）を設定します。
- CLI が異なるフラグを使う **resume サブコマンド** を持つ場合は、
  `resumeArgs`（resume 時に `args` を置き換える）と、必要に応じて
  `resumeOutput`（JSON ではない resume 用）を設定します。
- `sessionMode`:
  - `always`: 常に session id を送信します（保存済みがなければ新しい UUID）。
  - `existing`: 以前に保存された session id がある場合のみ送信します。
  - `none`: session id を送信しません。
- `claude-cli` はデフォルトで `liveSession: "claude-stdio"`、`output: "jsonl"`、
  `input: "stdin"` を使うため、アクティブな間は追加入力でも生きている Claude process を再利用します。
  現在は warm stdio がデフォルトであり、transport フィールドを省略したカスタム設定でも同様です。
  Gateway が再起動したり、アイドル中の process が終了した場合は、
  OpenClaw は保存済み Claude session id から再開します。保存済み session
  id は、再開前に読み取り可能な既存 project transcript に対して検証されるため、
  幽霊のようなバインディングは `--resume` 配下で黙って新しい Claude CLI セッションを始める代わりに
  `reason=transcript-missing` でクリアされます。
- 保存された CLI セッションは provider 所有の継続性です。暗黙の日次セッション
  リセットでは切断されません。`/reset` と明示的な `session.reset` ポリシーでは切断されます。

シリアライズに関する注意:

- `serialize: true` は同じレーンの実行順序を維持します。
- ほとんどの CLI は 1 つの provider レーンでシリアライズされます。
- OpenClaw は、選択された auth identity が変わると、保存済み CLI セッションの再利用を破棄します。
  これには、auth profile id の変更、静的 API key、静的 token、
  または CLI が公開している場合は OAuth account identity の変更が含まれます。OAuth access
  token と refresh token のローテーションでは、保存済み CLI セッションは切断されません。
  CLI が安定した OAuth account id を公開していない場合、OpenClaw はその CLI 側に resume 権限の強制を委ねます。

## 画像（パススルー）

CLI が画像 path を受け付ける場合は、`imageArg` を設定します:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw は base64 画像を一時ファイルへ書き出します。`imageArg` が設定されていれば、
それらの path が CLI 引数として渡されます。`imageArg` がない場合、OpenClaw は
ファイル path を prompt に追記します（path injection）。これは、単なる path からローカルファイルを自動読み込みする
CLI には十分です。

## 入力 / 出力

- `output: "json"`（デフォルト）は JSON の解析を試み、text + session id を抽出します。
- Gemini CLI の JSON 出力では、`usage` がないか空の場合、
  OpenClaw は返信テキストを `response` から、使用量を `stats` から読み取ります。
- `output: "jsonl"` は JSONL ストリーム（たとえば Codex CLI `--json`）を解析し、最終 agent メッセージと
  存在する session 識別子を抽出します。
- `output: "text"` は stdout を最終応答として扱います。

入力モード:

- `input: "arg"`（デフォルト）は prompt を最後の CLI 引数として渡します。
- `input: "stdin"` は prompt を stdin 経由で送ります。
- prompt が非常に長く、`maxPromptArgChars` が設定されている場合は stdin が使われます。

## デフォルト（plugin 所有）

バンドルされた OpenAI plugin は `codex-cli` 用のデフォルトも登録します:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

バンドルされた Google plugin は `google-gemini-cli` 用のデフォルトも登録します:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件: ローカルの Gemini CLI がインストールされ、`PATH` 上で
`gemini` として利用可能である必要があります（`brew install gemini-cli` または
`npm install -g @google/gemini-cli`）。

Gemini CLI JSON に関する注意:

- 返信テキストは JSON の `response` フィールドから読み取られます。
- `usage` が存在しないか空の場合、使用量は `stats` にフォールバックします。
- `stats.cached` は OpenClaw の `cacheRead` に正規化されます。
- `stats.input` がない場合、OpenClaw は入力トークンを
  `stats.input_tokens - stats.cached` から導出します。

必要な場合にのみ上書きしてください（よくあるのは絶対 `command` path です）。

## Plugin 所有のデフォルト

CLI バックエンドのデフォルトは、現在は plugin サーフェスの一部です:

- Plugins は `api.registerCliBackend(...)` でそれらを登録します。
- バックエンドの `id` が model ref における provider 接頭辞になります。
- `agents.defaults.cliBackends.<id>` 内のユーザー設定は、引き続き plugin デフォルトを上書きします。
- バックエンド固有の設定クリーンアップは、任意の
  `normalizeConfig` hook を通じて引き続き plugin 側が管理します。

小さな prompt/message 互換 shim が必要な plugin は、provider や CLI バックエンドを置き換えずに、
双方向のテキスト変換を宣言できます:

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

`input` は CLI に渡す system prompt と user prompt を書き換えます。`output`
は、OpenClaw が独自の control marker や channel 配信を処理する前に、
ストリーミングされる assistant delta と解析済み最終テキストを書き換えます。

Claude Code の stream-json 互換 JSONL を出力する CLI では、
そのバックエンド設定に `jsonlDialect: "claude-stream-json"` を設定してください。

## Bundle MCP オーバーレイ

CLI バックエンドは **OpenClaw tool call を直接受け取りません** が、バックエンドは
`bundleMcp: true` で生成される MCP 設定オーバーレイに opt in できます。

現在の bundled の動作:

- `claude-cli`: 生成された strict MCP config file
- `codex-cli`: `mcp_servers` 用のインライン設定上書き
- `google-gemini-cli`: 生成された Gemini システム設定ファイル

bundle MCP が有効な場合、OpenClaw は次を行います:

- gateway tools を CLI process に公開する loopback HTTP MCP server を起動する
- セッションごとの token（`OPENCLAW_MCP_TOKEN`）でブリッジを認証する
- tool アクセスを現在の session、account、channel コンテキストに限定する
- 現在の workspace で有効な bundle-MCP server を読み込む
- それらを既存のバックエンド MCP config/settings 形状とマージする
- 所有 extension の統合モードを使って起動設定を書き換える

有効な MCP server がない場合でも、バックエンドが bundle MCP に opt in していれば、
OpenClaw は strict config を注入するため、バックグラウンド実行は分離されたままです。

## 制限

- **OpenClaw tool call の直接呼び出しはありません。** OpenClaw は CLI バックエンドプロトコルに
  tool call を直接注入しません。バックエンドが gateway tools を認識するのは、
  `bundleMcp: true` に opt in した場合のみです。
- **ストリーミングはバックエンド依存です。** JSONL をストリーミングするバックエンドもあれば、
  終了までバッファするものもあります。
- **構造化出力** は CLI の JSON 形式に依存します。
- **Codex CLI セッション** はテキスト出力経由で resume されるため（JSONL ではない）、
  初回の `--json` 実行より構造化が弱くなります。それでも OpenClaw セッション自体は通常どおり動作します。

## トラブルシューティング

- **CLI が見つからない**: `command` にフル path を設定してください。
- **model 名が間違っている**: `modelAliases` を使って `provider/model` → CLI model にマップしてください。
- **セッション継続性がない**: `sessionArg` が設定されていて、`sessionMode` が
  `none` でないことを確認してください（現在 Codex CLI は JSON 出力では resume できません）。
- **画像が無視される**: `imageArg` を設定し（CLI が file path をサポートすることも確認してください）。
