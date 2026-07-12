---
read_when:
    - APIプロバイダーで障害が発生した場合に、信頼性の高いフォールバックが必要であること
    - ローカルの AI CLI を実行しており、それらを再利用したい場合
    - CLI バックエンドのツールアクセス向け MCP ループバックブリッジについて理解したい場合
summary: CLI バックエンド：オプションの MCP ツールブリッジを備えたローカル AI CLI フォールバック
title: CLI バックエンド
x-i18n:
    generated_at: "2026-07-11T22:13:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw は、API プロバイダーが停止している、レート制限されている、または正常に動作していない場合に、テキスト専用のフォールバックとしてローカル AI CLI を実行できます。これは意図的に保守的な設計です。

- OpenClaw のツールは直接注入されませんが、`bundleMcp: true` のバックエンドは、ループバック MCP ブリッジを介して Gateway ツールを受け取れます。
- 対応する CLI では JSONL ストリーミングを使用します。
- セッションに対応しているため、後続ターンの一貫性が維持されます。
- CLI が画像パスを受け付ける場合、画像も渡されます。

これは主要な経路ではなく、「常に動作する」テキスト応答のための安全策として使用してください。ACP セッション制御、バックグラウンドタスク、スレッドや会話への関連付け、永続的な外部コーディングセッションを備えた完全なハーネスランタイムが必要な場合は、代わりに [ACP エージェント](/ja-JP/tools/acp-agents)を使用してください。CLI バックエンドは ACP ではありません。

<Tip>
  新しいバックエンド Plugin を構築する場合は、[CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins)を参照してください。このページでは、登録済みバックエンドの設定と運用について説明します。
</Tip>

## クイックスタート

同梱の Anthropic Plugin はデフォルトの `claude-cli` バックエンドを登録するため、Claude Code がインストールされ、ログイン済みであれば、追加の設定なしで動作します。

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

明示的なエージェント一覧が設定されていない場合、`main` がデフォルトのエージェント ID です。それ以外の場合は、自分のエージェント ID に置き換えてください。

Gateway が最小限の `PATH` を使用する launchd/systemd 環境で実行されている場合は、バイナリを明示的に指定してください。

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

Gateway ホストで、同梱の CLI バックエンドを主要なメッセージプロバイダーとして使用する場合、設定のモデル参照または `agents.defaults.cliBackends` でそのバックエンドが参照されていれば、OpenClaw は所有元の同梱 Plugin を自動的に読み込みます。

## フォールバックとして使用する

主要モデルが失敗した場合にのみ実行されるよう、CLI バックエンドをフォールバック一覧に追加します。

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

`agents.defaults.models` を許可リストとして使用している場合は、CLI バックエンドのモデルもそこに含めてください。主要プロバイダーが失敗すると（認証、レート制限、タイムアウトなど）、OpenClaw は次に CLI バックエンドを試します。

## 設定

すべての CLI バックエンドは、プロバイダー ID（例: `claude-cli`、`my-cli`）をキーとして `agents.defaults.cliBackends` に配置します。プロバイダー ID はモデル参照の左側、つまり `<provider>/<model>` になります。

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
          // システムプロンプト専用のファイルフラグ:
          // systemPromptFileArg: "--system-file",
          // 代わりに Codex 形式の設定上書きフラグを使用:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Compaction 前の制限付き OpenClaw 生トランスクリプト履歴から、
          // 無効化されたセッションをこのバックエンドで再シードしてよい場合にのみ有効化します。
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## 動作の仕組み

1. プロバイダー接頭辞（`claude-cli/...`）によってバックエンドを選択します。
2. 同じ OpenClaw プロンプトとワークスペースコンテキストを使用して、システムプロンプトを構築します。
3. 履歴の一貫性を維持するため、対応している場合はセッション ID を指定して CLI を実行します。同梱の `claude-cli` バックエンドは、OpenClaw セッションごとに Claude の stdio プロセスを維持し、後続ターンを stream-json の標準入力経由で送信します。
4. 出力（JSON またはプレーンテキスト）を解析し、最終テキストを返します。
5. 後続ターンで同じ CLI セッションを再利用できるよう、バックエンドごとにセッション ID を永続化します。

### Claude CLI 固有の動作

同梱の `claude-cli` バックエンドは、Claude Code ネイティブのスキルリゾルバーを優先します。現在の Skills スナップショットに、実体化されたパスを持つ選択済みスキルが少なくとも 1 つある場合、OpenClaw は一時的な Claude Code Plugin を `--plugin-dir` で渡し、追加されるシステムプロンプトから重複する OpenClaw Skills カタログを省略します。実体化された Plugin スキルがない場合、OpenClaw はフォールバックとしてプロンプトカタログを維持します。スキルの環境変数/API キー上書きは、引き続き実行時の子プロセス環境に適用されます。

Claude CLI には独自の非対話型権限モードがあります。OpenClaw は Claude 固有の設定を追加する代わりに、これを既存の実行ポリシーに対応付けます。OpenClaw が管理する Claude ライブセッションでは、有効な実行ポリシーが優先されます。YOLO（`tools.exec.security: "full"` および `tools.exec.ask: "off"`）の場合は `--permission-mode bypassPermissions` を指定して Claude を起動し、制限的なポリシーの場合は `--permission-mode default` を指定して起動します。エージェント単位の `agents.list[].tools.exec` 設定は、そのエージェントについてグローバルな `tools.exec` を上書きします。バックエンドの生の引数に `--permission-mode` を含めることもできますが、Claude のライブ起動時には、有効なポリシーと一致するようそのフラグが正規化されます。

このバックエンドは、OpenClaw の `/think` レベルを Claude Code ネイティブの `--effort` フラグにも対応付けます。`minimal`/`low` -> `low`、`medium` -> `medium` となり、`high`/`xhigh`/`max` はそのまま渡されます。`adaptive` は設定済みの `--effort` フラグを削除し、代替値を指定しないため、Claude Code は独自の環境、設定、モデルのデフォルト値から有効な effort を決定します。他の CLI バックエンドで `/think` を起動される CLI に反映するには、所有元の Plugin が同等の argv マッパーを宣言する必要があります。

OpenClaw が `claude-cli` を使用する前に、同じホスト上で Claude Code 自体にログインしておく必要があります。

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker インストールでは、ホスト上だけでなく、永続化されたコンテナのホーム内にも Claude Code をインストールしてログインする必要があります。[Docker での Claude CLI バックエンド](/ja-JP/install/docker#claude-cli-backend-in-docker)を参照してください。

`claude` バイナリがすでに `PATH` 上にない場合にのみ、`agents.defaults.cliBackends.claude-cli.command` を設定してください。

## セッション

- CLI がセッションに対応している場合は、`sessionArg`（例: `--session-id`）を設定します。ID を複数のフラグに入れる必要がある場合は、`sessionArgs`（プレースホルダー `{sessionId}`）を設定します。
- CLI が異なるフラグを持つ再開サブコマンドを使用する場合は、`resumeArgs`（再開時に `args` を置き換える）を設定し、JSON 以外の再開出力には必要に応じて `resumeOutput` を設定します。
- `sessionMode`:
  - `always`: 常にセッション ID を送信します（保存済みの ID がなければ新しい UUID）。
  - `existing`: 以前に保存されたセッション ID がある場合にのみ送信します。
  - `none`: セッション ID を送信しません。
- `claude-cli` のデフォルトは `liveSession: "claude-stdio"`、`output: "jsonl"`、`input: "stdin"` です。そのため、転送フィールドを省略したカスタム設定でも、ライブ Claude プロセスが動作中であれば、後続ターンでそのプロセスを再利用します。Gateway が再起動した場合やアイドル状態のプロセスが終了した場合、OpenClaw は保存済みの Claude セッション ID から再開します。保存済みセッション ID は、再開前に読み取り可能なプロジェクトトランスクリプトと照合されます。トランスクリプトがない場合は、`--resume` で暗黙的に新しいセッションを開始せず、関連付けを解除します（`reason=transcript-missing` としてログに記録されます）。
- Claude ライブセッションでは、JSONL 出力に制限付きの保護機構が適用されます。デフォルトでは、ターンごとに 8 MiB および生の JSONL 20,000 行です。バックエンドごとに `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` と `maxTurnLines` で上限を引き上げられます。OpenClaw はこれらの設定を 64 MiB および 100,000 行以下に制限します。
- 保存済み CLI セッションの継続性はプロバイダーが所有します。暗黙の日次セッションリセットでは切断されませんが、`/reset` と明示的な `session.reset` ポリシーでは引き続き切断されます。
- 新しい CLI セッションは通常、OpenClaw の Compaction 要約と Compaction 後の末尾部分からのみ再シードされます。Compaction 前に無効化された短いセッションを復元するため、バックエンドは `reseedFromRawTranscriptWhenUncompacted: true` を指定して有効化できます。生のトランスクリプトによる再シードは制限付きで、CLI トランスクリプトの欠落、孤立したツール使用の末尾、メッセージポリシー/システムプロンプト/cwd/MCP の変更、セッション期限切れ後の再試行など、安全な無効化に限定されます。認証プロファイルまたは認証情報エポックの変更時には、生のトランスクリプト履歴を再シードしません。

直列化: `serialize: true` を指定すると、同じレーンの実行順序が維持されます（ほとんどの CLI は 1 つのプロバイダーレーン上で直列化されます）。また OpenClaw は、選択された認証 ID が変更された場合、保存済み CLI セッションを再利用しません。これには、認証プロファイル ID、固定 API キー、固定トークン、または CLI が公開している場合の OAuth アカウント ID の変更が含まれます。OAuth アクセストークンや更新トークンのローテーションだけでは、セッションは切断されません。CLI に安定した OAuth アカウント ID がない場合、OpenClaw はその CLI 自身に再開権限の適用を委ねます。

## claude-cli セッションからのフォールバック用前置き

`claude-cli` の試行が失敗し、[`agents.defaults.model.fallbacks`](/ja-JP/concepts/model-failover) 内の CLI 以外の候補へフェイルオーバーする場合、OpenClaw は Claude Code のローカル JSONL トランスクリプト（ワークスペースごとにキー付けされた `~/.claude/projects/` 配下）から取得したコンテキスト前置きを次の試行に渡します。このシードがなければ、`claude-cli` の実行では OpenClaw 自身のセッショントランスクリプトが空であるため、フォールバックプロバイダーはコンテキストなしで開始します。

- 前置きでは、最新の `/compact` 要約または `compact_boundary` マーカーを優先し、その後に文字数上限まで、境界後の最新ターンを追加します。境界前のターンは要約にすでに含まれているため、破棄されます。
- プロンプトの上限を正確に保つため、ツールブロックは簡潔な `(tool call: name)` と `(tool result: …)` のヒントにまとめられます。大きすぎる要約は切り詰められ、`(truncated)` とラベル付けされます。
- 同じプロバイダー内の `claude-cli` から `claude-cli` へのフォールバックは、Claude 自身の `--resume` を使用し、前置きを省略します。
- シードでは既存の Claude セッションファイルパス検証を再利用するため、任意のパスを読み取ることはできません。

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
- `output: "jsonl"` は JSONL ストリームを解析し、最終的なエージェントメッセージと、存在する場合はセッション識別子を抽出します。
- Gemini CLI の JSON 出力では、`usage` が存在しないか空の場合、OpenClaw は `response` から応答テキストを、`stats` から使用量を読み取ります。同梱の Gemini CLI のデフォルトでは `stream-json` を使用します。以前の `--output-format json` 上書きでは、引き続き JSON パーサーが使用されます。

入力モード:

- `input: "arg"`（デフォルト）は、プロンプトを最後の CLI 引数として渡します。
- `input: "stdin"` は、プロンプトを標準入力経由で送信します。
- プロンプトが非常に長く、`maxPromptArgChars` が設定されている場合は、代わりに標準入力が使用されます。

## Plugin 所有のデフォルト

CLI バックエンドのデフォルトは Plugin サーフェスの一部です。

- Plugin は `api.registerCliBackend(...)` を使用して登録します。
- バックエンドの `id` は、モデル参照内のプロバイダー接頭辞になります。
- `agents.defaults.cliBackends.<id>` 内のユーザー設定は、引き続き Plugin のデフォルトを上書きします。
- バックエンド固有の設定クリーンアップは、オプションの `normalizeConfig` フックを通じて Plugin が所有します。

Anthropic は `claude-cli` を、Google は `google-gemini-cli` を所有します。OpenAI Codex エージェントの実行は、`openai/*` を通じて Codex アプリサーバーハーネスを使用します。OpenClaw は、同梱の `codex-cli` バックエンドを登録しなくなりました。

同梱の Anthropic Plugin は、`claude-cli` に対して次を登録します。

| キー                   | 値                                                                                                                                                                                                         |
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

同梱の Google Plugin は `google-gemini-cli` 用として登録されます。

| キー                       | 値                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | 同じ。ただし `--resume {sessionId}` を追加                                                      |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

前提条件: ローカルに Gemini CLI がインストールされ、`gemini` として `PATH` に含まれている必要があります（`brew install gemini-cli` または `npm install -g @google/gemini-cli`）。

Gemini CLI の出力に関する注意事項:

- デフォルトの `stream-json` パーサーは、アシスタントの `message` イベント、ツールイベント、最終的な `result` の使用量、および致命的な Gemini エラーイベントを読み取ります。
- Gemini の引数を `--output-format json` に上書きすると、OpenClaw はそのバックエンドを `output: "json"` に正規化し、JSON の `response` フィールドから応答テキストを読み取ります。
- `usage` が存在しないか空の場合、使用量は `stats` にフォールバックします。`stats.cached` は OpenClaw の `cacheRead` に正規化され、`stats.input` がない場合、入力トークン数は `stats.input_tokens - stats.cached` から算出されます。

必要な場合にのみデフォルトを上書きしてください（最も一般的なのは `command` の絶対パスです）。

## テキスト変換オーバーレイ

小規模なプロンプトやメッセージの互換性シムを必要とする Plugin は、プロバイダーや CLI バックエンドを置き換えることなく、双方向のテキスト変換を宣言できます。

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` は、CLI に渡されるシステムプロンプトとユーザープロンプトを書き換えます。`output` は、OpenClaw が独自の制御マーカーを処理してチャンネルに配信する前に、ストリーミングされたアシスタントテキストと解析済みの最終テキストを書き換えます。プロバイダーを使用するモデル呼び出しでは、ストリームの修復後かつツール実行前に、構造化されたツール呼び出し引数内の文字列値も復元します。プロバイダーの生の JSON フラグメントは変更されません。利用側は、構造化された部分、終了、または結果ペイロードを使用してください。

プロバイダー固有の JSONL イベントを出力する CLI では、そのバックエンドの設定に `jsonlDialect` を設定してください。Claude Code 互換ストリームには `claude-stream-json`、Gemini CLI の `stream-json` イベントには `gemini-stream-json` を使用します。

## ネイティブ Compaction の所有権

一部の CLI バックエンドは、自身のトランスクリプトを Compaction するエージェントを実行します。そのため、OpenClaw はそれらに対して安全策の要約処理を実行してはなりません。実行すると、バックエンド自身の Compaction と競合し、ターンが完全に失敗する可能性があります。

`claude-cli` にはハーネスのエンドポイントがありません（Claude Code が内部で Compaction します）。そのため、`ownsNativeCompaction: true` を宣言し、OpenClaw の Compaction パスはセッションエントリを変更せずに返します。一方、Codex などのネイティブハーネスセッションは、引き続きハーネスの Compaction エンドポイントにルーティングされます。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

`ownsNativeCompaction` は、Compaction を実際に所有するバックエンドにのみ宣言してください。そのバックエンドは、コンテキストウィンドウ付近で自身のトランスクリプトを確実に制限し、再開可能なセッション（例: `--resume` / `--session-id`）を永続化する必要があります。そうでなければ、延期されたセッションが予算超過のままになる可能性があります。

## 同梱 MCP オーバーレイ

CLI バックエンドは OpenClaw のツール呼び出しを直接受け取りませんが、`bundleMcp: true` を指定すると、生成された MCP 設定オーバーレイを使用できます。現在の同梱動作は次のとおりです。

- `claude-cli`: 生成された厳格な MCP 設定ファイル。
- `google-gemini-cli`: 生成された Gemini システム設定ファイル。

同梱 MCP が有効な場合、OpenClaw は次の処理を行います。

- Gateway ツールを CLI プロセスに公開するループバック HTTP MCP サーバーを起動します。このサーバーは、現在の実行試行中のみ有効な実行ごとのコンテキスト権限（`OPENCLAW_MCP_TOKEN`）で認証されます。
- 子プロセスのヘッダーを信頼する代わりに、Gateway が選択したセッション、アカウント、およびチャンネルのコンテキストにツールアクセスを結び付けます。
- 現在のワークスペースで有効になっている同梱 MCP サーバーを読み込み、既存のバックエンド MCP 設定または設定値の形式と統合します。
- 所有する Plugin が定めるバックエンド固有の統合モードを使用して、起動設定を書き換えます。

MCP サーバーが有効になっていない場合でも、バックエンドが同梱 MCP を有効にしていれば、OpenClaw は厳格な設定を挿入し、バックグラウンド実行を分離した状態に保ちます。

セッションスコープの同梱 MCP ランタイムは、セッション内で再利用できるようキャッシュされ、アイドル状態が `mcp.sessionIdleTtlMs` ミリ秒続くと終了されます（デフォルトは10分、無効にするには `0` を設定）。認証プローブ、スラッグ生成、Active Memory の呼び戻しなどの単発の埋め込み実行では、実行終了時にクリーンアップを要求するため、stdio 子プロセスやストリーミング可能な HTTP/SSE ストリームが実行後も存続することはありません。

## 履歴再シードの上限

新しい CLI セッションを以前の OpenClaw トランスクリプトからシードする場合（たとえば、`session_expired` の再試行後）、再シード用プロンプトが過度に増大しないよう、レンダリングされる `<conversation_history>` ブロックに上限が設定されます。デフォルトは12,288文字（約3,000トークン）です。

Claude CLI バックエンドでは、代わりに解決済みの Claude コンテキストウィンドウに応じてこの上限が調整されます。コンテキストウィンドウが大きいほど、固定された最大値まで、以前の履歴からより大きな範囲が使用されます。その他の CLI バックエンドでは、保守的なデフォルトが維持されます。この上限が適用されるのは、再シード用プロンプトの以前の履歴ブロックのみです。ライブセッションの出力上限は、`reliability.outputLimits` で個別に調整されます（[セッション](#sessions)を参照）。

## 制限事項

- OpenClaw ツールを直接呼び出すことはできません。OpenClaw は、CLI バックエンドプロトコルにツール呼び出しを挿入しません。バックエンドが Gateway ツールを認識できるのは、`bundleMcp: true` を有効にした場合のみです。
- ストリーミングはバックエンド固有です。一部のバックエンドは JSONL をストリーミングし、その他は終了までバッファリングします。
- 構造化出力は、CLI 自身の JSON 形式に依存します。

## トラブルシューティング

| 症状               | 解決方法                                                               |
| --------------------- | ----------------------------------------------------------------- |
| CLI が見つからない         | `command` に完全なパスを設定します。                                     |
| モデル名が正しくない      | `modelAliases` を使用して、`provider/model` を CLI のモデル ID にマッピングします。 |
| セッションが継続されない | `sessionArg` が設定され、`sessionMode` が `none` ではないことを確認します。       |
| 画像が無視される        | `imageArg` を設定し、CLI がファイルパスをサポートしていることを確認します。            |

## 関連項目

- [Gateway 運用手順書](/ja-JP/gateway)
- [ローカルモデル](/ja-JP/gateway/local-models)
