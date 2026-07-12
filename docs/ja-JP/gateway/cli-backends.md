---
read_when:
    - APIプロバイダーに障害が発生した場合に、信頼できるフォールバックが必要な場合
    - ローカルの AI CLI を実行していて、それらを再利用したい場合
    - CLI バックエンドのツールアクセス用 MCP ループバックブリッジについて理解したい場合
summary: CLI バックエンド：オプションの MCP ツールブリッジを備えたローカル AI CLI フォールバック
title: CLI バックエンド
x-i18n:
    generated_at: "2026-07-12T14:27:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw は、API プロバイダーが停止している、レート制限されている、または正常に動作していない場合に、テキスト専用のフォールバックとしてローカル AI CLI を実行できます。この機能は意図的に保守的に設計されています。

- OpenClaw ツールは直接注入されませんが、`bundleMcp: true` のバックエンドは、loopback MCP ブリッジを介して Gateway ツールを受け取れます。
- 対応する CLI では JSONL ストリーミングを使用できます。
- セッションに対応しているため、後続のターンでも一貫性が維持されます。
- CLI が画像パスを受け付ける場合、画像はそのまま渡されます。

これは主要な経路ではなく、「常に動作する」テキスト応答のためのセーフティネットとして使用してください。ACP セッション制御、バックグラウンドタスク、スレッド／会話のバインド、永続的な外部コーディングセッションを備えた完全なハーネスランタイムには、代わりに [ACP エージェント](/ja-JP/tools/acp-agents)を使用してください。CLI バックエンドは ACP ではありません。

<Tip>
  新しいバックエンド Plugin を構築していますか？[CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins)を参照してください。このページでは、登録済みバックエンドの設定と運用について説明します。
</Tip>

## クイックスタート

同梱の Anthropic Plugin はデフォルトの `claude-cli` バックエンドを登録するため、Claude Code がインストールされ、ログイン済みであれば、追加設定なしで動作します。

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

明示的なエージェントリストが設定されていない場合、`main` がデフォルトのエージェント ID です。それ以外の場合は、独自のエージェント ID に置き換えてください。

Gateway が最小限の `PATH` を使用して launchd/systemd の配下で実行される場合は、バイナリを明示的に指定します。

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

Gateway ホストで、同梱 CLI バックエンドを主要なメッセージプロバイダーとして使用する場合、設定がモデル参照または `agents.defaults.cliBackends` 配下でそのバックエンドを参照していれば、OpenClaw は所有元の同梱 Plugin を自動的に読み込みます。

## フォールバックとしての使用

主要モデルが失敗した場合にのみ実行されるように、CLI バックエンドをフォールバックリストに追加します。

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

`agents.defaults.models` を許可リストとして使用する場合は、CLI バックエンドのモデルもそこに含めてください。主要プロバイダーが失敗すると（認証、レート制限、タイムアウト）、OpenClaw は次に CLI バックエンドを試行します。

## 設定

すべての CLI バックエンドは、プロバイダー ID（例: `claude-cli`、`my-cli`）をキーとして `agents.defaults.cliBackends` 配下に配置されます。プロバイダー ID はモデル参照の左側、つまり `<provider>/<model>` になります。

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
          // 専用のプロンプトファイルフラグ:
          // systemPromptFileArg: "--system-file",
          // 代わりに Codex 形式の設定オーバーライドフラグ:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // このバックエンドが、Compaction 前の範囲制限された未加工の
          // OpenClaw トランスクリプト履歴から無効化済みセッションを再シードできる場合にのみ有効にします。
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## 動作の仕組み

1. プロバイダープレフィックス（`claude-cli/...`）に基づいてバックエンドを選択します。
2. 同じ OpenClaw プロンプトとワークスペースコンテキストを使用してシステムプロンプトを構築します。
3. 履歴の一貫性を維持するため、セッション ID（対応している場合）を指定して CLI を実行します。同梱の `claude-cli` バックエンドは、OpenClaw セッションごとに Claude の標準入出力プロセスを維持し、後続のターンを stream-json 標準入力で送信します。
4. 出力（JSON またはプレーンテキスト）を解析し、最終テキストを返します。
5. バックエンドごとにセッション ID を永続化し、後続のターンで同じ CLI セッションを再利用します。

### Claude CLI の詳細

同梱の `claude-cli` バックエンドは、Claude Code のネイティブ Skills リゾルバーを優先します。現在の Skills スナップショットに、実体化されたパスを持つ選択済み Skills が少なくとも 1 つある場合、OpenClaw は一時的な Claude Code Plugin を `--plugin-dir` 経由で渡し、追加されるシステムプロンプトから重複する OpenClaw Skills カタログを省略します。実体化された Plugin Skills がない場合、OpenClaw はフォールバックとしてプロンプトカタログを維持します。Skills の環境変数／API キーのオーバーライドは、実行時の子プロセス環境にも引き続き適用されます。

Claude CLI には独自の非対話型権限モードがあります。OpenClaw は Claude 固有の設定を追加する代わりに、これを既存の実行ポリシーに対応付けます。OpenClaw が管理する Claude ライブセッションでは、有効な実行ポリシーが決定権を持ちます。YOLO（`tools.exec.security: "full"` かつ `tools.exec.ask: "off"`）では Claude を `--permission-mode bypassPermissions` で起動し、制限的なポリシーでは `--permission-mode default` で起動します。エージェント単位の `agents.list[].tools.exec` 設定は、そのエージェントについてグローバルな `tools.exec` をオーバーライドします。未加工のバックエンド引数に `--permission-mode` を含めることはできますが、Claude のライブ起動時には、そのフラグが有効なポリシーに一致するよう正規化されます。

このバックエンドは、OpenClaw の `/think` レベルを Claude Code ネイティブの `--effort` フラグにも対応付けます。`minimal`/`low` -> `low`、`medium` -> `medium` となり、`high`/`xhigh`/`max` はそのまま渡されます。`adaptive` は設定済みの `--effort` フラグを削除し、代替値を指定しません。そのため、Claude Code は独自の環境、設定、モデルのデフォルト値から有効な effort を決定します。他の CLI バックエンドで `/think` が起動される CLI に影響するには、所有元の Plugin が同等の argv マッパーを宣言する必要があります。

OpenClaw が `claude-cli` を使用する前に、同じホスト上で Claude Code 自体にログインしておく必要があります。

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker インストールでは、ホスト上だけでなく、永続化されたコンテナのホーム内にも Claude Code をインストールしてログインする必要があります。[Docker での Claude CLI バックエンド](/ja-JP/install/docker#claude-cli-backend-in-docker)を参照してください。

`claude` バイナリがまだ `PATH` にない場合にのみ、`agents.defaults.cliBackends.claude-cli.command` を設定してください。

## セッション

- CLI がセッションに対応している場合は `sessionArg`（例: `--session-id`）を設定します。ID を複数のフラグに配置する必要がある場合は、`sessionArgs`（プレースホルダー `{sessionId}`）を設定します。
- CLI が異なるフラグを持つ再開サブコマンドを使用する場合は、`resumeArgs`（再開時に `args` を置き換える）を設定し、JSON 以外の再開出力には必要に応じて `resumeOutput` を設定します。
- `sessionMode`:
  - `always`: 常にセッション ID を送信します（保存済みのものがなければ新しい UUID）。
  - `existing`: 以前に保存されたセッション ID がある場合にのみ送信します。
  - `none`: セッション ID を送信しません。
- `claude-cli` のデフォルトは `liveSession: "claude-stdio"`、`output: "jsonl"`、`input: "stdin"` です。そのため、トランスポートフィールドを省略したカスタム設定を含め、ライブ Claude プロセスがアクティブな間は、後続のターンでそのプロセスを再利用します。Gateway が再起動するか、アイドル中のプロセスが終了した場合、OpenClaw は保存済みの Claude セッション ID から再開します。保存済みのセッション ID は、再開前に読み取り可能なプロジェクトトランスクリプトと照合されます。トランスクリプトがない場合は、`--resume` 配下で暗黙的に新しいセッションを開始するのではなく、バインドを解除します（`reason=transcript-missing` としてログに記録）。
- Claude ライブセッションでは、範囲制限された JSONL 出力ガードが維持されます。デフォルトでは、ターンごとに 8 MiB および 20,000 行の未加工 JSONL です。バックエンドごとに `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` と `maxTurnLines` を使用して上限を引き上げられます。OpenClaw はこれらの設定を 64 MiB および 100,000 行に制限します。
- 保存済みの CLI セッションは、プロバイダーが所有する継続性です。暗黙的な日次セッションリセットでは切断されませんが、`/reset` と明示的な `session.reset` ポリシーでは切断されます。
- 新しい CLI セッションは通常、OpenClaw の Compaction 要約と Compaction 後の末尾部分からのみ再シードされます。Compaction 前に無効化された短いセッションを復旧するため、バックエンドは `reseedFromRawTranscriptWhenUncompacted: true` でオプトインできます。未加工トランスクリプトの再シードは範囲制限されたままで、CLI トランスクリプトの欠落、孤立したツール使用の末尾、メッセージポリシー／システムプロンプト／cwd／MCP の変更、セッション期限切れによる再試行など、安全な無効化に限定されます。認証プロファイルまたは認証情報エポックの変更では、未加工トランスクリプト履歴を再シードしません。

直列化: `serialize: true` は、同じレーンの実行順序を維持します（ほとんどの CLI は 1 つのプロバイダーレーン上で直列化されます）。OpenClaw は、選択された認証アイデンティティが変更された場合にも、保存済み CLI セッションの再利用を停止します。これには、認証プロファイル ID、静的 API キー、静的トークン、または CLI が公開している場合の OAuth アカウントアイデンティティの変更が含まれます。OAuth アクセストークン／リフレッシュトークンのローテーションだけでは、セッションは切断されません。CLI に安定した OAuth アカウント ID がない場合、OpenClaw はその CLI 自体に再開権限の適用を委ねます。

## claude-cli セッションからのフォールバック前置き

`claude-cli` の試行が [`agents.defaults.model.fallbacks`](/ja-JP/concepts/model-failover) 内の CLI 以外の候補にフェイルオーバーすると、OpenClaw は Claude Code のローカル JSONL トランスクリプト（`~/.claude/projects/` 配下で、ワークスペースごとにキー設定）から取得したコンテキスト前置きを次の試行にシードします。このシードがない場合、`claude-cli` の実行では OpenClaw 自身のセッショントランスクリプトが空であるため、フォールバックプロバイダーはコンテキストなしで開始します。

- 前置きは最新の `/compact` 要約または `compact_boundary` マーカーを優先し、その後、文字数予算の範囲内で境界後の最新ターンを追加します。境界前のターンは、要約にすでに反映されているため破棄されます。
- プロンプト予算を正確に保つため、ツールブロックは簡潔な `(tool call: name)` および `(tool result: …)` のヒントに統合されます。大きすぎる要約は切り詰められ、`(truncated)` とラベル付けされます。
- 同一プロバイダーの `claude-cli` から `claude-cli` へのフォールバックは、Claude 独自の `--resume` に依存し、前置きを省略します。
- シードは既存の Claude セッションファイルパス検証を再利用するため、任意のパスを読み取ることはできません。

## 画像

CLI が画像パスを受け付ける場合は、`imageArg` を設定します。

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw は base64 画像を一時ファイルに書き込みます。`imageArg` が設定されている場合、それらのパスは CLI 引数として渡されます。設定されていない場合、OpenClaw はファイルパスをプロンプトに追加します（パス注入）。これは、プレーンなパスからローカルファイルを自動的に読み込む CLI で機能します。

## 入力と出力

- `output: "text"`（デフォルト）は、標準出力を最終応答として扱います。
- `output: "json"` は、JSON の解析を試み、テキストとセッション ID を抽出します。
- `output: "jsonl"` は、JSONL ストリームを解析し、最終的なエージェントメッセージと、存在する場合はセッション識別子を抽出します。
- Gemini CLI の JSON 出力では、`usage` がないか空の場合、OpenClaw は `response` から応答テキストを、`stats` から使用量を読み取ります。同梱の Gemini CLI のデフォルトは `stream-json` を使用します。古い `--output-format json` オーバーライドでは、引き続き JSON パーサーを使用します。

入力モード:

- `input: "arg"`（デフォルト）は、プロンプトを最後の CLI 引数として渡します。
- `input: "stdin"` は、標準入力経由でプロンプトを送信します。
- プロンプトが非常に長く、`maxPromptArgChars` が設定されている場合は、代わりに標準入力が使用されます。

## Plugin 所有のデフォルト

CLI バックエンドのデフォルトは Plugin サーフェスの一部です。

- Plugin は `api.registerCliBackend(...)` を使用して登録します。
- バックエンドの `id` は、モデル参照内のプロバイダープレフィックスになります。
- `agents.defaults.cliBackends.<id>` のユーザー設定は、引き続き Plugin のデフォルトをオーバーライドします。
- バックエンド固有の設定クリーンアップは、オプションの `normalizeConfig` フックを通じて Plugin が所有します。

Anthropic は `claude-cli` を所有し、Google は `google-gemini-cli` を所有します。OpenAI Codex エージェントの実行は、`openai/*` 経由で Codex app-server ハーネスを使用します。OpenClaw は同梱の `codex-cli` バックエンドを登録しなくなりました。

同梱の Anthropic Plugin は、`claude-cli` に対して以下を登録します。

| キー                  | 値                                                                                                                                                                                                            |
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

同梱の Google Plugin は `google-gemini-cli` 用に登録されます。

| キー                      | 値                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | 同じですが、`--resume {sessionId}` が追加されます                                      |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

前提条件: ローカルの Gemini CLI がインストールされ、`gemini` として `PATH` に含まれている必要があります（`brew install gemini-cli` または `npm install -g @google/gemini-cli`）。

Gemini CLI の出力に関する注意事項:

- デフォルトの `stream-json` パーサーは、アシスタントの `message` イベント、ツールイベント、最終的な `result` の使用量、および致命的な Gemini エラーイベントを読み取ります。
- Gemini の引数を `--output-format json` にオーバーライドすると、OpenClaw はそのバックエンドを `output: "json"` に正規化し、JSON の `response` フィールドから応答テキストを読み取ります。
- `usage` が存在しないか空の場合、使用量は `stats` にフォールバックします。`stats.cached` は OpenClaw の `cacheRead` に正規化され、`stats.input` がない場合、入力トークン数は `stats.input_tokens - stats.cached` から算出されます。

必要な場合にのみデフォルトをオーバーライドしてください（最も一般的なのは `command` の絶対パスです）。

## テキスト変換オーバーレイ

小規模なプロンプトやメッセージの互換性シムを必要とする Plugin は、プロバイダーや CLI バックエンドを置き換えることなく、双方向のテキスト変換を宣言できます。

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` は、CLI に渡されるシステムプロンプトとユーザープロンプトを書き換えます。`output` は、OpenClaw が独自の制御マーカーとチャネル配信を処理する前に、ストリーミングされたアシスタントテキストと解析済みの最終テキストを書き換えます。プロバイダー経由のモデル呼び出しでは、ストリーム修復後、ツール実行前に、構造化されたツール呼び出し引数内の文字列値も復元します。プロバイダーの生の JSON フラグメントは変更されません。コンシューマーは、構造化された部分、終了、または結果のペイロードを使用してください。

プロバイダー固有の JSONL イベントを出力する CLI では、そのバックエンドの設定に `jsonlDialect` を設定します。Claude Code 互換ストリームには `claude-stream-json`、Gemini CLI の `stream-json` イベントには `gemini-stream-json` を使用します。

## ネイティブ Compaction の所有権

一部の CLI バックエンドは、独自のトランスクリプトを Compaction するエージェントを実行するため、OpenClaw はそれらに対してセーフガード用の要約処理を実行してはなりません。実行すると、バックエンド独自の Compaction と競合し、ターンが完全に失敗する可能性があります。

`claude-cli` にはハーネスエンドポイントがなく（Claude Code が内部で Compaction します）、そのため `ownsNativeCompaction: true` を宣言し、OpenClaw の Compaction パスはセッションエントリを変更せずに返します。一方、Codex などのネイティブハーネスセッションは、引き続き各ハーネスの Compaction エンドポイントにルーティングされます。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

`ownsNativeCompaction` は、Compaction を本当に所有するバックエンドに対してのみ宣言してください。そのバックエンドは、コンテキストウィンドウ付近で独自のトランスクリプトを確実に制限し、再開可能なセッション（例: `--resume` / `--session-id`）を永続化する必要があります。そうでない場合、延期されたセッションが予算超過のままになる可能性があります。

## バンドル MCP オーバーレイ

CLI バックエンドは OpenClaw のツール呼び出しを直接受け取りませんが、バックエンドは `bundleMcp: true` により、生成された MCP 設定オーバーレイをオプトインできます。現在の同梱動作:

- `claude-cli`: 厳格な MCP 設定ファイルを生成します。
- `google-gemini-cli`: Gemini のシステム設定ファイルを生成します。

バンドル MCP が有効な場合、OpenClaw は次を行います。

- Gateway ツールを CLI プロセスに公開する loopback HTTP MCP サーバーを起動します。このサーバーは、現在の実行試行中のみ有効な実行ごとのコンテキスト権限（`OPENCLAW_MCP_TOKEN`）で認証されます。
- 子プロセスのヘッダーを信頼するのではなく、ツールアクセスを Gateway が選択したセッション、アカウント、およびチャネルのコンテキストにバインドします。
- 現在のワークスペースで有効なバンドル MCP サーバーを読み込み、既存のバックエンド MCP 設定の形式とマージします。
- 所有する Plugin が定めたバックエンド固有の統合モードを使用して、起動設定を書き換えます。

MCP サーバーが有効になっていない場合でも、バックエンドがバンドル MCP をオプトインしていれば、OpenClaw は厳格な設定を挿入し、バックグラウンド実行の分離を維持します。

セッションスコープの同梱 MCP ランタイムは、セッション内で再利用するためにキャッシュされ、その後、アイドル時間が `mcp.sessionIdleTtlMs` ミリ秒に達すると終了されます（デフォルトは 10 分。無効にするには `0` を設定）。認証プローブ、スラッグ生成、Active Memory の呼び出しなどの単発の組み込み実行では、実行終了時にクリーンアップを要求し、stdio 子プロセスと Streamable HTTP/SSE ストリームが実行後も存続しないようにします。

## 履歴再シードの上限

新しい CLI セッションが以前の OpenClaw トランスクリプトからシードされる場合（たとえば、`session_expired` の再試行後）、再シード用プロンプトが過大にならないよう、レンダリングされる `<conversation_history>` ブロックに上限が設定されます。デフォルトは 12,288 文字（約 3,000 トークン）です。

Claude CLI バックエンドでは、代わりに解決済みの Claude コンテキストウィンドウに応じてこの上限を拡大します。コンテキストウィンドウが大きいほど、固定上限まで以前の履歴スライスが大きくなります。他の CLI バックエンドでは保守的なデフォルトが維持されます。この上限は、再シード用プロンプトの以前の履歴ブロックのみを制御します。ライブセッションの出力上限は、`reliability.outputLimits` で別途調整されます（[セッション](#sessions)を参照）。

## 制限事項

- OpenClaw ツールの直接呼び出しはありません。OpenClaw は CLI バックエンドプロトコルにツール呼び出しを注入しません。バックエンドが Gateway ツールを認識できるのは、`bundleMcp: true` をオプトインした場合のみです。
- ストリーミングはバックエンド固有です。一部のバックエンドは JSONL をストリーミングし、他のバックエンドは終了までバッファリングします。
- 構造化出力は CLI 独自の JSON 形式に依存します。

## トラブルシューティング

| 症状                  | 修正方法                                                                  |
| --------------------- | ------------------------------------------------------------------------- |
| CLI が見つからない    | `command` に完全なパスを設定します。                                      |
| モデル名が誤っている  | `modelAliases` を使用して `provider/model` を CLI のモデル ID にマッピングします。 |
| セッションが継続しない | `sessionArg` が設定され、`sessionMode` が `none` でないことを確認します。  |
| 画像が無視される      | `imageArg` を設定し、CLI がファイルパスをサポートしていることを確認します。 |

## 関連項目

- [Gateway ランブック](/ja-JP/gateway)
- [ローカルモデル](/ja-JP/gateway/local-models)
