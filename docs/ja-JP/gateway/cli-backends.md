---
read_when:
    - API プロバイダーが失敗したときに信頼できるフォールバックが必要な場合
    - ローカル AI CLI を実行していて、それらを再利用したい
    - CLIバックエンドツールアクセス用のMCP loopbackブリッジを理解したい
summary: 'CLI バックエンド: オプションの MCP ツールブリッジ付きローカル AI CLI フォールバック'
title: CLI バックエンド
x-i18n:
    generated_at: "2026-07-05T11:19:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3fb55bcb6e6e5aeb1176dea1ce81df394940841f324b5c93ce8a807b134945
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw は、API プロバイダーが停止中、レート制限中、または誤動作している場合に、テキスト専用のフォールバックとしてローカル AI CLI を実行できます。これは意図的に保守的です。

- OpenClaw ツールは直接注入されませんが、`bundleMcp: true` のバックエンドは loopback MCP ブリッジを通じて Gateway ツールを受け取れます。
- 対応する CLI 向けの JSONL ストリーミング。
- セッションに対応しているため、後続ターンの一貫性が保たれます。
- CLI が画像パスを受け付ける場合、画像はそのまま渡されます。

これは主経路ではなく、「常に動作する」テキスト応答のセーフティネットとして使ってください。ACP セッション制御、バックグラウンドタスク、スレッド/会話のバインディング、永続的な外部コーディングセッションを備えた完全なハーネスランタイムには、代わりに [ACP エージェント](/ja-JP/tools/acp-agents) を使ってください。CLI バックエンドは ACP ではありません。

<Tip>
  新しいバックエンド Plugin を構築していますか？[CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins) を参照してください。このページでは、すでに登録済みのバックエンドの設定と運用を扱います。
</Tip>

## クイックスタート

バンドルされた Anthropic Plugin はデフォルトの `claude-cli` バックエンドを登録するため、Claude Code がインストール済みでログイン済みであれば、追加設定なしで動作します。

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

明示的なエージェントリストが設定されていない場合、`main` はデフォルトのエージェント ID です。それ以外の場合は、自分のエージェント ID に置き換えてください。

Gateway が最小限の `PATH` で launchd/systemd の下で動作している場合は、バイナリを明示的に指定します。

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

Gateway ホスト上でバンドル済み CLI バックエンドを主メッセージプロバイダーとして使う場合、設定がモデル参照内または `agents.defaults.cliBackends` の下でそのバックエンドを参照していると、OpenClaw は所有元のバンドル済み Plugin を自動読み込みします。

## フォールバックとして使う

CLI バックエンドをフォールバックリストに追加すると、主モデルが失敗した場合にのみ実行されます。

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

`agents.defaults.models` を許可リストとして使う場合は、CLI バックエンドモデルもそこに含めてください。主プロバイダーが失敗した場合（認証、レート制限、タイムアウト）、OpenClaw は次に CLI バックエンドを試します。

## 設定

すべての CLI バックエンドは `agents.defaults.cliBackends` の下にあり、プロバイダー ID（例: `claude-cli`, `my-cli`）をキーにします。プロバイダー ID はモデル参照の左側になります: `<provider>/<model>`。

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
          // Dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style config-override flag instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed invalidated sessions from
          // bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## 仕組み

1. プロバイダープレフィックス（`claude-cli/...`）でバックエンドを選択します。
2. 同じ OpenClaw プロンプトとワークスペースコンテキストを使ってシステムプロンプトを構築します。
3. セッション ID（対応している場合）を指定して CLI を実行し、履歴の一貫性を保ちます。バンドル済みの `claude-cli` バックエンドは、OpenClaw セッションごとに Claude stdio プロセスを生かし続け、後続ターンを stream-json stdin 経由で送信します。
4. 出力（JSON またはプレーンテキスト）を解析し、最終テキストを返します。
5. バックエンドごとにセッション ID を永続化し、後続ターンが同じ CLI セッションを再利用できるようにします。

### Claude CLI の詳細

バンドル済みの `claude-cli` バックエンドは、Claude Code のネイティブ Skills リゾルバーを優先します。現在の Skills スナップショットに、実体化されたパスを持つ選択済み Skills が少なくとも 1 つある場合、OpenClaw は `--plugin-dir` 経由で一時的な Claude Code Plugin を渡し、追加されるシステムプロンプトから重複する OpenClaw Skills カタログを省略します。実体化された Plugin Skills がない場合、OpenClaw はフォールバックとしてプロンプトカタログを保持します。Skills の env/API キー上書きは、その実行の子プロセス環境にも引き続き適用されます。

Claude CLI には独自の非対話型権限モードがあります。OpenClaw は Claude 固有の設定を追加する代わりに、それを既存の exec ポリシーにマップします。OpenClaw 管理の Claude ライブセッションでは、有効な exec ポリシーが authoritative です。YOLO（`tools.exec.security: "full"` と `tools.exec.ask: "off"`）では Claude を `--permission-mode bypassPermissions` で起動し、制限的なポリシーでは `--permission-mode default` で起動します。エージェント単位の `agents.list[].tools.exec` 設定は、そのエージェントのグローバルな `tools.exec` を上書きします。生のバックエンド引数に `--permission-mode` が含まれていても、Claude のライブ起動ではそのフラグを有効なポリシーに一致するよう正規化します。

このバックエンドは OpenClaw の `/think` レベルも Claude Code のネイティブな `--effort` フラグにマップします。`minimal`/`low` -> `low`、`adaptive`/`medium` -> `medium` となり、`high`/`xhigh`/`max` はそのまま渡されます。他の CLI バックエンドで `/think` が生成される CLI に影響するには、所有元 Plugin が同等の argv マッパーを宣言する必要があります。

OpenClaw が `claude-cli` を使う前に、同じホスト上で Claude Code 自体がログイン済みである必要があります。

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker インストールでは、ホスト上だけでなく、永続化されたコンテナホーム内に Claude Code がインストール済みでログイン済みである必要があります。[Docker の Claude CLI バックエンド](/ja-JP/install/docker#claude-cli-backend-in-docker) を参照してください。

`claude` バイナリがまだ `PATH` 上にない場合にのみ、`agents.defaults.cliBackends.claude-cli.command` を設定してください。

## セッション

- CLI がセッションに対応している場合は、`sessionArg`（例: `--session-id`）を設定します。ID を複数のフラグに入れる必要がある場合は、`sessionArgs`（プレースホルダー `{sessionId}`）を設定します。
- CLI が異なるフラグの resume サブコマンドを使う場合は、`resumeArgs`（再開時に `args` を置き換える）を設定し、必要に応じて非 JSON 再開用に `resumeOutput` を設定します。
- `sessionMode`:
  - `always`: 常にセッション ID を送信します（保存済みがなければ新しい UUID）。
  - `existing`: 以前に保存されたセッション ID がある場合のみ送信します。
  - `none`: セッション ID を送信しません。
- `claude-cli` はデフォルトで `liveSession: "claude-stdio"`、`output: "jsonl"`、`input: "stdin"` になるため、トランスポートフィールドを省略したカスタム設定を含め、アクティブな間は後続ターンがライブ Claude プロセスを再利用します。Gateway が再起動した場合、またはアイドルプロセスが終了した場合、OpenClaw は保存済みの Claude セッション ID から再開します。保存済みセッション ID は、再開前に読み取り可能なプロジェクトトランスクリプトに照合して検証されます。トランスクリプトがない場合は、`--resume` の下で暗黙に新規セッションを開始するのではなく、バインディングをクリアします（`reason=transcript-missing` としてログ記録）。
- Claude ライブセッションは、デフォルトでターンごとに 8 MiB と 20,000 行の生 JSONL 出力ガードを維持します。バックエンドごとに `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` と `maxTurnLines` で引き上げられます。OpenClaw はこれらの設定を 64 MiB と 100,000 行にクランプします。
- 保存済み CLI セッションは、プロバイダー所有の継続性です。暗黙の日次セッションリセットでは切断されません。`/reset` と明示的な `session.reset` ポリシーでは引き続き切断されます。
- 新しい CLI セッションは通常、OpenClaw の Compaction サマリーと Compaction 後の末尾だけから再シードします。Compaction 前に無効化された短いセッションを復旧するには、バックエンドが `reseedFromRawTranscriptWhenUncompacted: true` でオプトインできます。生トランスクリプトの再シードは、CLI トランスクリプトの欠落、孤立した tool-use 末尾、メッセージポリシー/システムプロンプト/cwd/MCP の変更、またはセッション期限切れリトライなど、安全な無効化に限定され、範囲も制限されます。認証プロファイルまたは認証情報 epoch の変更では、生トランスクリプト履歴は決して再シードされません。

シリアライズ: `serialize: true` は同一レーンの実行順序を保ちます（ほとんどの CLI は 1 つのプロバイダーレーン上でシリアライズします）。OpenClaw は、選択された認証 ID が変わった場合にも保存済み CLI セッションの再利用を破棄します。これには、認証プロファイル ID、静的 API キー、静的トークン、または CLI が公開している場合の OAuth アカウント ID の変更が含まれます。OAuth アクセス/リフレッシュトークンのローテーションだけではセッションは切断されません。CLI に安定した OAuth アカウント ID がない場合、OpenClaw はその CLI 自身に再開権限の適用を任せます。

## claude-cli セッションからのフォールバック前置き

`claude-cli` の試行が [`agents.defaults.model.fallbacks`](/ja-JP/concepts/model-failover) 内の非 CLI 候補にフェイルオーバーした場合、OpenClaw は Claude Code のローカル JSONL トランスクリプト（`~/.claude/projects/` 配下、ワークスペースごとにキー付け）から収集したコンテキスト前置きで次の試行をシードします。このシードがないと、`claude-cli` 実行では OpenClaw 自身のセッショントランスクリプトが空のため、フォールバックプロバイダーはコールドスタートします。

- 前置きは最新の `/compact` サマリーまたは `compact_boundary` マーカーを優先し、その後、文字数予算まで境界後の最新ターンを追加します。境界前のターンは、すでにサマリーで表現されているため破棄されます。
- ツールブロックは、プロンプト予算を正直に保つため、コンパクトな `(tool call: name)` と `(tool result: …)` ヒントに統合されます。大きすぎるサマリーは切り詰められ、`(truncated)` とラベル付けされます。
- 同一プロバイダーの `claude-cli` から `claude-cli` へのフォールバックは、Claude 自身の `--resume` に依存し、前置きをスキップします。
- このシードは既存の Claude セッションファイルパス検証を再利用するため、任意のパスを読み取ることはできません。

## 画像

CLI が画像パスを受け付ける場合は、`imageArg` を設定します。

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw は base64 画像を一時ファイルに書き込みます。`imageArg` が設定されている場合、それらのパスは CLI 引数として渡されます。設定されていない場合、OpenClaw はファイルパスをプロンプトに追加します（パス注入）。これは、プレーンなパスからローカルファイルを自動読み込みする CLI で機能します。

## 入力と出力

- `output: "text"`（デフォルト）は stdout を最終応答として扱います。
- `output: "json"` は JSON の解析を試み、テキストとセッション ID を抽出します。
- `output: "jsonl"` は JSONL ストリームを解析し、最終エージェントメッセージと、存在する場合はセッション識別子を抽出します。
- Gemini CLI の JSON 出力では、`usage` がないか空の場合、OpenClaw は返信テキストを `response` から、使用量を `stats` から読み取ります。バンドル済み Gemini CLI のデフォルトは `stream-json` を使います。古い `--output-format json` 上書きは引き続き JSON パーサーを使います。

入力モード:

- `input: "arg"`（デフォルト）はプロンプトを最後の CLI 引数として渡します。
- `input: "stdin"` は stdin 経由でプロンプトを送信します。
- プロンプトが非常に長く、`maxPromptArgChars` が設定されている場合は、代わりに stdin が使われます。

## Plugin 所有のデフォルト

CLI バックエンドのデフォルトは Plugin サーフェスの一部です。

- Plugin は `api.registerCliBackend(...)` でそれらを登録します。
- バックエンドの `id` はモデル参照内のプロバイダープレフィックスになります。
- `agents.defaults.cliBackends.<id>` のユーザー設定は、引き続き Plugin デフォルトを上書きします。
- バックエンド固有の設定クリーンアップは、任意の `normalizeConfig` フックを通じて Plugin 所有のままです。

Anthropic は `claude-cli` を所有し、Google は `google-gemini-cli` を所有します。OpenAI Codex エージェント実行は、`openai/*` を通じて Codex app-server ハーネスを使います。OpenClaw はバンドル済みの `codex-cli` バックエンドを登録しなくなりました。

バンドル済み Anthropic Plugin は `claude-cli` 向けに次を登録します。

| Key                   | Value                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArg`          | `--session-id`                                                                                                                                                                                                |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

バンドルされた Google Plugin は `google-gemini-cli` 用に登録されます。

| Key                       | Value                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | 同じ、`--resume {sessionId}` を付加                                                   |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

前提条件: ローカルの Gemini CLI がインストール済みで、`PATH` 上に `gemini` として存在している必要があります（`brew install gemini-cli` または `npm install -g @google/gemini-cli`）。

Gemini CLI 出力に関する注記:

- デフォルトの `stream-json` パーサーは、アシスタントの `message` イベント、ツールイベント、最終 `result` の使用量、致命的な Gemini エラーイベントを読み取ります。
- Gemini の引数を `--output-format json` に上書きした場合、OpenClaw はそのバックエンドを `output: "json"` に正規化し、JSON の `response` フィールドから返信テキストを読み取ります。
- `usage` が存在しないか空の場合、使用量は `stats` にフォールバックします。`stats.cached` は OpenClaw の `cacheRead` に正規化され、`stats.input` が欠落している場合、入力トークンは `stats.input_tokens - stats.cached` から導出されます。

必要な場合にのみデフォルトを上書きしてください（最も一般的なのは絶対 `command` パスです）。

## テキスト変換オーバーレイ

小さなプロンプト/メッセージ互換シムが必要な Plugin は、プロバイダーや CLI バックエンドを置き換えずに双方向テキスト変換を宣言できます。

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` は、CLI に渡されるシステムプロンプトとユーザープロンプトを書き換えます。`output` は、OpenClaw が独自の制御マーカーとチャネル配信を処理する前に、ストリーミングされたアシスタントテキストと解析済みの最終テキストを書き換えます。プロバイダーに基づくモデル呼び出しでは、ストリーム修復後かつツール実行前に、構造化ツール呼び出し引数内の文字列値も復元します。生のプロバイダー JSON フラグメントは変更されません。コンシューマーは、構造化された partial、end、または result ペイロードを使用する必要があります。

プロバイダー固有の JSONL イベントを発行する CLI では、そのバックエンドの設定で `jsonlDialect` を設定してください。Claude Code 互換ストリームには `claude-stream-json`、Gemini CLI の `stream-json` イベントには `gemini-stream-json` を使用します。

## ネイティブ Compaction の所有権

一部の CLI バックエンドは独自のトランスクリプトを圧縮するエージェントを実行するため、OpenClaw はそれらに対して保護用サマライザーを実行してはいけません。そうするとバックエンド自身の Compaction と競合し、ターンがハード失敗する可能性があります。

`claude-cli` にはハーネスエンドポイントがないため（Claude Code は内部で圧縮します）、`ownsNativeCompaction: true` を宣言し、OpenClaw の Compaction パスはセッションエントリを変更せずに返します。Codex などのネイティブハーネスセッションは、引き続きハーネスの Compaction エンドポイントにルーティングされます。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

`ownsNativeCompaction` は、実際に Compaction を所有するバックエンドにのみ宣言してください。そのバックエンドは、コンテキストウィンドウ付近で自身のトランスクリプトを確実に制限し、再開可能なセッション（例: `--resume` / `--session-id`）を永続化する必要があります。そうでない場合、遅延されたセッションが予算を超えたままになる可能性があります。

## バンドル MCP オーバーレイ

CLI バックエンドは OpenClaw ツール呼び出しを直接受け取りませんが、バックエンドは `bundleMcp: true` で生成済み MCP 設定オーバーレイにオプトインできます。現在のバンドル動作:

- `claude-cli`: 生成された厳格な MCP 設定ファイル。
- `google-gemini-cli`: 生成された Gemini システム設定ファイル。

バンドル MCP が有効な場合、OpenClaw は次を行います。

- CLI プロセスに Gateway ツールを公開する loopback HTTP MCP サーバーを起動し、セッションごとのトークン（`OPENCLAW_MCP_TOKEN`）で認証します。
- ツールアクセスを現在のセッション、アカウント、チャネルコンテキストにスコープします。
- 現在のワークスペースで有効なバンドル MCP サーバーを読み込み、既存のバックエンド MCP 設定/設定形状とマージします。
- 所有 Plugin からのバックエンド所有の統合モードを使って起動設定を書き換えます。

MCP サーバーが有効になっていない場合でも、バックエンドがバンドル MCP にオプトインしていれば、OpenClaw は厳格な設定を注入するため、バックグラウンド実行は分離されたままになります。

セッションスコープのバンドル MCP ランタイムは、セッション内で再利用するためにキャッシュされ、その後 `mcp.sessionIdleTtlMs` ミリ秒のアイドル時間後に回収されます（デフォルトは 10 分。無効にするには `0` を設定）。認証プローブ、slug 生成、Active Memory recall などのワンショット埋め込み実行は、stdio 子プロセスや Streamable HTTP/SSE ストリームが実行より長く残らないよう、実行終了時にクリーンアップを要求します。

## 再シード履歴上限

新しい CLI セッションが以前の OpenClaw トランスクリプトからシードされる場合（たとえば `session_expired` リトライ後）、レンダリングされる `<conversation_history>` ブロックは、再シードプロンプトの肥大化を防ぐために上限が設定されます。デフォルトは 12,288 文字（約 3,000 トークン）です。

Claude CLI バックエンドは、代わりに解決済みの Claude コンテキストウィンドウに応じてこの上限をスケールします。より大きなコンテキストウィンドウでは、固定の上限まで、より大きな以前の履歴スライスを取得します。他の CLI バックエンドは保守的なデフォルトを維持します。この上限は、再シードプロンプトの以前の履歴ブロックにのみ適用されます。ライブセッションの出力制限は、`reliability.outputLimits` の下で別途調整されます（[セッション](#sessions)を参照）。

## 制限事項

- OpenClaw ツール呼び出しを直接使用できません: OpenClaw は CLI バックエンドプロトコルにツール呼び出しを注入しません。バックエンドが Gateway ツールを参照できるのは、`bundleMcp: true` にオプトインした場合のみです。
- ストリーミングはバックエンド固有です: 一部のバックエンドは JSONL をストリーミングし、他は終了までバッファリングします。
- 構造化出力は CLI 自身の JSON 形式に依存します。

## トラブルシューティング

| 症状                  | 修正方法                                                          |
| --------------------- | ----------------------------------------------------------------- |
| CLI が見つからない    | `command` をフルパスに設定します。                               |
| モデル名が違う        | `modelAliases` を使用して `provider/model` を CLI のモデル ID にマップします。 |
| セッション継続性がない | `sessionArg` が設定され、`sessionMode` が `none` でないことを確認します。 |
| 画像が無視される      | `imageArg` を設定し、CLI がファイルパスをサポートしていることを確認します。 |

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [ローカルモデル](/ja-JP/gateway/local-models)
