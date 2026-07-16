---
read_when:
    - API プロバイダーに障害が発生した場合に備えて、信頼性の高いフォールバックが必要である
    - ローカルのAI CLIを実行していて、それらを再利用したい場合
    - CLI バックエンドのツールアクセスに使用する MCP local loopback ブリッジについて理解する必要がある
summary: CLIバックエンド：オプションのMCPツールブリッジを備えたローカルAI CLIフォールバック
title: CLI バックエンド
x-i18n:
    generated_at: "2026-07-16T11:36:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ffeb19e582819f511212326da83381ba2c52e9f5743263f1ef9e0dc0fbbaf08e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw は、API プロバイダーが停止している、レート制限されている、または正常に動作していない場合に、テキスト専用のフォールバックとしてローカル AI CLI を実行できます。これは意図的に保守的な設計です。

- OpenClaw ツールは直接注入されませんが、`bundleMcp: true` を備えたバックエンドは、local loopback MCP ブリッジを介して Gateway ツールを受信できます。
- 対応する CLI では JSONL ストリーミングを使用します。
- セッションに対応しているため、後続のターンでも一貫性が維持されます。
- CLI が画像パスを受け付ける場合、画像も渡されます。

これはプライマリ経路ではなく、「常に動作する」テキスト応答のセーフティネットとして使用してください。ACP セッション制御、バックグラウンドタスク、スレッド／会話のバインディング、永続的な外部コーディングセッションを備えた完全なハーネスランタイムには、代わりに [ACP エージェント](/ja-JP/tools/acp-agents)を使用してください。CLI バックエンドは ACP ではありません。

<Tip>
  新しいバックエンド Plugin を構築する場合は、[CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins)を参照してください。このページでは、登録済みバックエンドの設定と運用について説明します。
</Tip>

## クイックスタート

同梱の Anthropic Plugin は、デフォルトの `claude-cli` バックエンドを登録するため、Claude Code がインストールされ、ログイン済みであれば、追加設定なしで動作します。

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

明示的なエージェントリストが設定されていない場合、`main` がデフォルトのエージェント ID です。それ以外の場合は、自身のエージェント ID に置き換えてください。

Gateway が最小限の `PATH` を使用する launchd/systemd 環境で実行される場合は、バイナリを明示的に指定します。

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

Gateway ホストで、同梱の CLI バックエンドをプライマリメッセージプロバイダーとして使用する場合、設定内のモデル参照または `agents.defaults.cliBackends` 配下でそのバックエンドを参照すると、OpenClaw は所有元の同梱 Plugin を自動的に読み込みます。

## フォールバックとして使用する

CLI バックエンドをフォールバックリストに追加すると、プライマリモデルが失敗した場合にのみ実行されます。

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

`agents.defaults.models` を許可リストとして使用する場合は、CLI バックエンドモデルも含めてください。プライマリプロバイダーが失敗すると（認証、レート制限、タイムアウトなど）、OpenClaw は次に CLI バックエンドを試行します。

## 設定

すべての CLI バックエンドは `agents.defaults.cliBackends` 配下に配置され、プロバイダー ID（例：`claude-cli`、`my-cli`）をキーとして使用します。プロバイダー ID はモデル参照の左側になります：`<provider>/<model>`。

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
          // 専用のプロンプトファイルフラグ：
          // systemPromptFileArg: "--system-file",
          // 代わりに Codex 形式の設定上書きフラグ：
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // このバックエンドが、Compaction 前の制限された生の OpenClaw
          // トランスクリプト履歴から無効化されたセッションを再シードできる場合にのみ有効化します。
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
2. 同じ OpenClaw プロンプトとワークスペースコンテキストを使用して、システムプロンプトを構築します。
3. 履歴の一貫性を維持するため、対応している場合はセッション ID を指定して CLI を実行します。同梱の `claude-cli` バックエンドは、OpenClaw セッションごとに Claude の標準入出力プロセスを維持し、stream-json 標準入力を介して後続のターンを送信します。
4. 出力（JSON またはプレーンテキスト）を解析し、最終テキストを返します。
5. 後続の処理で同じ CLI セッションを再利用できるように、バックエンドごとにセッション ID を永続化します。

### Claude CLI 固有の仕様

同梱の `claude-cli` バックエンドは、Claude Code のネイティブ Skill リゾルバーを優先します。現在の Skills スナップショットに、実体化されたパスを持つ選択済み Skill が少なくとも 1 つある場合、OpenClaw は `--plugin-dir` を介して一時的な Claude Code Plugin を渡し、追加されるシステムプロンプトから重複する OpenClaw Skills カタログを除外します。実体化された Plugin Skill がない場合、OpenClaw はフォールバックとしてプロンプトカタログを維持します。Skill の環境変数／API キーの上書きは、引き続き実行時の子プロセス環境に適用されます。

Claude CLI には独自の非対話型権限モードがあります。OpenClaw は Claude 固有の設定を追加するのではなく、それを既存の実行ポリシーに対応付けます。OpenClaw が管理する Claude ライブセッションでは、有効な実行ポリシーが優先されます。YOLO（`tools.exec.security: "full"` および `tools.exec.ask: "off"`）では通常、`--permission-mode bypassPermissions` を指定して Claude を起動し、制限的なポリシーでは `--permission-mode default` を指定して起動します。Claude Code は root でのバイパスモードを拒否するため、root で実行される Gateway でも `default` を使用しますが、OpenClaw は設定された実行ポリシーに基づいて Claude の標準入出力ツール制御リクエストに引き続き応答します。エージェント単位の `agents.list[].tools.exec` 設定は、そのエージェントについてグローバルな `tools.exec` より優先されます。生のバックエンド引数に `--permission-mode` が含まれていても、Claude のライブ起動時には、有効なポリシーとホスト制限に一致するようにそのフラグが正規化されます。

このバックエンドは、OpenClaw の `/think` レベルも Claude Code ネイティブの `--effort` フラグに対応付けます。`minimal`/`low` -> `low`、`medium` -> `medium` となり、`high`/`xhigh`/`max` はそのまま渡されます。これにより、サブスクリプションを利用する Claude CLI 経路と API キー経路で、対応する Fable 5 の effort レベルが同一に保たれます。`adaptive` は設定済みの `--effort` フラグを削除し、代替値を指定しないため、Claude Code は自身の環境、設定、モデルのデフォルトから有効な effort を解決します。その他の CLI バックエンドでは、所有元の Plugin が同等の argv マッパーを宣言しない限り、`/think` は起動される CLI に影響しません。

OpenClaw が `claude-cli` を使用するには、事前に同じホスト上で Claude Code 自体にログインしておく必要があります。

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker インストールでは、ホストだけでなく、永続化されたコンテナのホーム内にも Claude Code をインストールしてログインする必要があります。[Docker 内の Claude CLI バックエンド](/ja-JP/install/docker#claude-cli-backend-in-docker)を参照してください。

`claude` バイナリが `PATH` にまだ存在しない場合にのみ、`agents.defaults.cliBackends.claude-cli.command` を設定してください。

## セッション

- CLI がセッションに対応している場合は `sessionArg`（例：`--session-id`）を設定します。ID を複数のフラグに配置する必要がある場合は、`sessionArgs`（プレースホルダー `{sessionId}`）を設定します。
- CLI が異なるフラグを持つ再開サブコマンドを使用する場合は、`resumeArgs`（再開時に `args` を置き換えます）を設定し、JSON 以外の再開には必要に応じて `resumeOutput` を設定します。
- `sessionMode`：
  - `always`：常にセッション ID を送信します（保存済みのものがなければ新しい UUID）。
  - `existing`：以前に保存されたセッション ID がある場合のみ送信します。
  - `none`：セッション ID を送信しません。
- `claude-cli` のデフォルトは `liveSession: "claude-stdio"`、`output: "jsonl"`、`input: "stdin"` です。そのため、トランスポートフィールドを省略したカスタム設定を含め、ライブ Claude プロセスが稼働中であれば、後続ターンで再利用されます。Gateway が再起動するか、アイドル状態のプロセスが終了した場合、OpenClaw は保存された Claude セッション ID から再開します。再開前に、保存されたセッション ID に対応する読み取り可能なプロジェクトトランスクリプトが検証されます。トランスクリプトがない場合、`--resume` の下で新しいセッションを暗黙に開始するのではなく、バインディングを解除します（`reason=transcript-missing` として記録）。
- Claude ライブセッションでは、制限付きの JSONL 出力ガードが維持されます。デフォルトではターンごとに 8 MiB および 20,000 行の生 JSONL です。バックエンドごとに `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` と `maxTurnLines` で上限を引き上げられますが、OpenClaw はそれぞれ 64 MiB と 100,000 行に制限します。
- 保存された CLI セッションは、プロバイダーが所有する継続性です。暗黙の日次セッションリセットでは切断されませんが、`/reset` および明示的な `session.reset` ポリシーでは切断されます。
- 新しい CLI セッションは通常、OpenClaw の Compaction サマリーと Compaction 後の末尾部分からのみ再シードされます。Compaction 前に無効化された短いセッションを復元するため、バックエンドは `reseedFromRawTranscriptWhenUncompacted: true` でオプトインできます。生のトランスクリプトによる再シードは制限付きで、安全な無効化に限定されます。これには、CLI トランスクリプトの欠落、孤立したツール使用の末尾、メッセージポリシー／システムプロンプト／cwd／MCP の変更、またはセッション期限切れによる再試行が含まれます。認証プロファイルまたは認証情報エポックの変更では、生のトランスクリプト履歴を再シードしません。

直列化：`serialize: true` は同一レーンの実行順序を維持します（ほとんどの CLI は 1 つのプロバイダーレーン上で直列化されます）。また OpenClaw は、選択された認証アイデンティティが変更された場合、保存済み CLI セッションの再利用を中止します。これには、認証プロファイル ID、静的 API キー、静的トークン、または CLI が公開している場合の OAuth アカウントアイデンティティの変更が含まれます。OAuth アクセストークン／リフレッシュトークンのローテーションだけではセッションは切断されません。CLI に安定した OAuth アカウント ID がない場合、OpenClaw はその CLI 自身に再開権限の適用を委ねます。

## claude-cli セッションからのフォールバック前置き

`claude-cli` の試行が [`agents.defaults.model.fallbacks`](/ja-JP/concepts/model-failover) 内の CLI 以外の候補にフェイルオーバーすると、OpenClaw は Claude Code のローカル JSONL トランスクリプト（`~/.claude/projects/` 配下にあり、ワークスペースごとにキー設定）から取得したコンテキスト前置きを次の試行に与えます。このシードがない場合、`claude-cli` 実行では OpenClaw 自身のセッショントランスクリプトが空であるため、フォールバックプロバイダーはコンテキストなしで開始します。

- 前置きでは、最新の `/compact` サマリーまたは `compact_boundary` マーカーを優先し、その後に文字数制限まで境界後の最新ターンを追加します。境界前のターンはサマリーにすでに含まれているため、破棄されます。
- プロンプトの使用量を正確に保つため、ツールブロックは簡潔な `(tool call: name)` および `(tool result: …)` ヒントに統合されます。サイズ超過のサマリーは切り詰められ、`(truncated)` というラベルが付けられます。
- 同一プロバイダー内の `claude-cli` から `claude-cli` へのフォールバックは、Claude 自身の `--resume` に依存し、前置きを省略します。
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
- `output: "json"` は JSON の解析を試み、テキストとセッション ID を抽出します。
- `output: "jsonl"` は JSONL ストリームを解析し、最終的なエージェントメッセージと、存在する場合はセッション識別子を抽出します。
- Gemini CLI の JSON 出力では、`usage` が存在しないか空の場合、OpenClaw は応答テキストを `response` から、使用量を `stats` から読み取ります。同梱の Gemini CLI のデフォルトは `stream-json` を使用します。古い `--output-format json` の上書きでは、引き続き JSON パーサーが使用されます。

入力モード：

- `input: "arg"`（デフォルト）は、プロンプトを最後の CLI 引数として渡します。
- `input: "stdin"`は、プロンプトを stdin 経由で送信します。
- プロンプトが非常に長く、`maxPromptArgChars`が設定されている場合は、代わりに stdin が使用されます。

## Plugin が所有するデフォルト

CLI バックエンドのデフォルトは Plugin サーフェスの一部です。

- Plugin は、`api.registerCliBackend(...)`を使用して登録します。
- バックエンドの`id`が、モデル参照のプロバイダープレフィックスになります。
- `agents.defaults.cliBackends.<id>`内のユーザー設定は、引き続き Plugin のデフォルトを上書きします。
- バックエンド固有の設定クリーンアップは、オプションの`normalizeConfig`フックを通じて Plugin が所有します。

Anthropic は`claude-cli`を所有し、Google は`google-gemini-cli`を所有します。OpenAI Codex エージェントの実行では、`openai/*`を通じて Codex app-server ハーネスを使用します。OpenClaw は、バンドルされた`codex-cli`バックエンドを登録しなくなりました。

バンドルされた Anthropic Plugin は、`claude-cli`に対して次を登録します。

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

バンドルされた Google Plugin は、`google-gemini-cli`に対して次を登録します。

| キー                       | 値                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | 同じ（`--resume {sessionId}`を使用）                                                      |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

前提条件: ローカルの Gemini CLI がインストールされ、`gemini`（`brew install gemini-cli`または`npm install -g @google/gemini-cli`）として`PATH`上に存在する必要があります。

Gemini CLI の出力に関する注意事項:

- デフォルトの`stream-json`パーサーは、アシスタントの`message`イベント、ツールイベント、最終的な`result`使用量、および致命的な Gemini エラーイベントを読み取ります。
- Gemini の引数を`--output-format json`に上書きすると、OpenClaw はそのバックエンドを`output: "json"`に正規化し直し、JSON の`response`フィールドから応答テキストを読み取ります。
- `usage`が存在しないか空の場合、使用量は`stats`にフォールバックします。`stats.cached`は OpenClaw の`cacheRead`に正規化され、`stats.input`がない場合、入力トークンは`stats.input_tokens - stats.cached`から算出されます。

必要な場合にのみデフォルトを上書きしてください（最も一般的なのは、`command`の絶対パスです）。

## テキスト変換オーバーレイ

小規模なプロンプトやメッセージの互換性シムを必要とする Plugin は、プロバイダーや CLI バックエンドを置き換えることなく、双方向のテキスト変換を宣言できます。

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input`は、CLI に渡されるシステムプロンプトとユーザープロンプトを書き換えます。`output`は、OpenClaw が独自の制御マーカーとチャネル配信を処理する前に、ストリーミングされたアシスタントテキストと解析済みの最終テキストを書き換えます。プロバイダーを使用するモデル呼び出しでは、ストリーム修復後かつツール実行前に、構造化されたツール呼び出し引数内の文字列値も復元します。生のプロバイダー JSON フラグメントは変更されません。コンシューマーは、構造化された部分、終了、または結果ペイロードを使用する必要があります。

プロバイダー固有の JSONL イベントを出力する CLI では、そのバックエンドの設定に`jsonlDialect`を設定します。Claude Code 互換ストリームには`claude-stream-json`、Gemini CLI の`stream-json`イベントには`gemini-stream-json`を使用します。

## ネイティブ Compaction の所有権

一部の CLI バックエンドでは、エージェントが自身のトランスクリプトを Compaction するため、OpenClaw はそれらに対して保護用の要約処理を実行してはなりません。実行すると、バックエンド独自の Compaction と競合し、ターンが完全に失敗する可能性があります。

`claude-cli`にはハーネスエンドポイントがなく（Claude Code が内部で Compaction します）、そのため`ownsNativeCompaction: true`を宣言し、OpenClaw の Compaction パスはセッションエントリを変更せずに返します。OpenClaw は、実行の有効なコンテキスト予算を Claude Code の文書化された[`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars)経由で渡し、ネイティブの自動 Compaction を設定済みの Anthropic `contextTokens`制限に合わせます。一方、Codex のようなネイティブハーネスセッションは、引き続きハーネスの Compaction エンドポイントにルーティングされます。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

`ownsNativeCompaction`は、Compaction を実際に所有するバックエンドに対してのみ宣言してください。そのバックエンドは、コンテキストウィンドウ付近で自身のトランスクリプトを確実に制限し、再開可能なセッション（例: `--resume` / `--session-id`）を永続化する必要があります。そうでない場合、延期されたセッションが予算超過のままになる可能性があります。

## バンドル MCP オーバーレイ

CLI バックエンドは OpenClaw のツール呼び出しを直接受け取りませんが、バックエンドは`bundleMcp: true`を使用して、生成された MCP 設定オーバーレイをオプトインできます。現在のバンドル動作:

- `claude-cli`: 生成された厳格な MCP 設定ファイル。
- `google-gemini-cli`: 生成された Gemini システム設定ファイル。

バンドル MCP が有効な場合、OpenClaw は次を行います。

- Gateway ツールを CLI プロセスに公開する loopback HTTP MCP サーバーを起動します。このサーバーは、現在の実行試行中のみ有効な実行ごとのコンテキスト許可（`OPENCLAW_MCP_TOKEN`）で認証されます。
- 子プロセスのヘッダーを信頼するのではなく、ツールアクセスを Gateway が選択したセッション、アカウント、およびチャネルのコンテキストにバインドします。
- 現在のワークスペースで有効になっているバンドル MCP サーバーを読み込み、既存のバックエンド MCP 設定またはシステム設定の形式とマージします。
- 所有する Plugin のバックエンド固有の統合モードを使用して、起動設定を書き換えます。

MCP サーバーが有効になっていない場合でも、バックエンドがバンドル MCP をオプトインしていれば、OpenClaw は厳格な設定を挿入し、バックグラウンド実行の分離を維持します。

セッションスコープのバンドル MCP ランタイムは、セッション内で再利用するためにキャッシュされ、`mcp.sessionIdleTtlMs`ミリ秒のアイドル時間後に破棄されます（デフォルトは 10 分。無効にするには`0`を設定します）。認証プローブ、スラッグ生成、Active Memory の想起などの単発の埋め込み実行では、実行終了時にクリーンアップを要求するため、stdio 子プロセスと Streamable HTTP/SSE ストリームが実行後も残ることはありません。

## 再シード履歴の上限

新しい CLI セッションが以前の OpenClaw トランスクリプトからシードされる場合（たとえば、`session_expired`の再試行後）、再シードプロンプトが過大になるのを防ぐため、レンダリングされる`<conversation_history>`ブロックに上限が適用されます。デフォルトは 12,288 文字（約 3,000 トークン）です。

Claude CLI バックエンドでは、代わりに解決済みの Claude コンテキストウィンドウに応じてこの上限が調整されます。コンテキストウィンドウが大きいほど以前の履歴の範囲も大きくなり、固定された上限まで拡大します。その他の CLI バックエンドでは、保守的なデフォルトが維持されます。この上限は、再シードプロンプトの以前の履歴ブロックのみを制御します。ライブセッションの出力制限は、`reliability.outputLimits`で個別に調整されます（[セッション](#sessions)を参照）。

## 制限事項

- OpenClaw ツールを直接呼び出すことはできません。OpenClaw は、CLI バックエンドプロトコルにツール呼び出しを挿入しません。バックエンドが Gateway ツールを認識できるのは、`bundleMcp: true`をオプトインした場合のみです。
- ストリーミングはバックエンド固有です。一部のバックエンドは JSONL をストリーミングし、その他は終了までバッファリングします。
- 構造化出力は、CLI 独自の JSON 形式に依存します。

## トラブルシューティング

| 症状               | 修正方法                                                               |
| --------------------- | ----------------------------------------------------------------- |
| CLI が見つからない         | `command`をフルパスに設定します。                                     |
| モデル名が正しくない      | `modelAliases`を使用して、`provider/model`を CLI のモデル ID にマッピングします。 |
| セッションが継続されない | `sessionArg`が設定され、`sessionMode`が`none`ではないことを確認します。       |
| 画像が無視される        | `imageArg`を設定し、CLI がファイルパスをサポートしていることを確認します。            |

## 関連項目

- [Gateway 運用ガイド](/ja-JP/gateway)
- [ローカルモデル](/ja-JP/gateway/local-models)
