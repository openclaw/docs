---
read_when:
    - 同梱の Codex app-server ハーネスを使用したい場合
    - Codex ハーネス設定の例が必要です
    - Codex のみのデプロイで、PI にフォールバックするのではなく失敗させたい
summary: OpenClaw の組み込みエージェントターンを、同梱の Codex app-server ハーネスを通じて実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-05-02T05:00:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 107f9fc0a3e8ad6a4790fc9eb68276c81d299236f11293014d2ab9bf6e235133
    source_path: plugins/codex-harness.md
    workflow: 16
---

同梱の `codex` Plugin により、OpenClaw は組み込み PI ハーネスの代わりに Codex アプリサーバーを通じて組み込みエージェントターンを実行できます。

低レベルのエージェントセッションを Codex に所有させたい場合に使用します。対象には、モデル検出、ネイティブスレッド再開、ネイティブ Compaction、アプリサーバー実行が含まれます。OpenClaw は引き続き、チャットチャネル、セッションファイル、モデル選択、ツール、承認、メディア配信、表示されるトランスクリプトミラーを所有します。

ソースチャットターンが Codex ハーネスを通じて実行される場合、デプロイが `messages.visibleReplies` を明示的に設定していなければ、表示される返信はデフォルトで OpenClaw の `message` ツールになります。エージェントは引き続き Codex ターンを非公開で完了できます。チャネルへ投稿するのは `message(action="send")` を呼び出したときだけです。直接チャットの最終返信を従来の自動配信経路に維持するには、`messages.visibleReplies: "automatic"` を設定します。

Codex Heartbeat ターンにもデフォルトで `heartbeat_respond` ツールが付与されるため、エージェントは最終テキストに制御フローをエンコードせずに、ウェイクを静かに保つべきか通知すべきかを記録できます。

全体像を把握したい場合は、[エージェントランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。短く言うと、`openai/gpt-5.5` はモデル参照、`codex` はランタイムであり、Telegram、Discord、Slack、または別のチャネルが通信サーフェスのままです。

## クイック設定

「OpenClaw 内の Codex」を求める多くのユーザーが必要とするのはこの経路です。ChatGPT/Codex サブスクリプションでサインインし、ネイティブ Codex アプリサーバーランタイムを通じて組み込みエージェントターンを実行します。モデル参照は引き続き `openai/gpt-*` として正規のままです。サブスクリプション認証は Codex アカウント/プロファイルから取得され、`openai-codex/*` モデル接頭辞からではありません。

まだ行っていない場合は、まず Codex OAuth でサインインします。

```bash
openclaw models auth login --provider openai-codex
```

次に、同梱の `codex` Plugin を有効にし、Codex ランタイムを強制します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

設定で `plugins.allow` を使用している場合は、そこにも `codex` を含めます。

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

ネイティブ Codex ランタイムを意味する場合に `openai-codex/gpt-*` を使用しないでください。その接頭辞は明示的な「PI 経由の Codex OAuth」経路です。設定変更は新規またはリセットされたセッションに適用されます。既存のセッションは記録済みのランタイムを維持します。

## この Plugin が変更すること

同梱の `codex` Plugin は、いくつかの独立した機能を提供します。

| 機能                        | 使用方法                                      | 動作                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| ネイティブ組み込みランタイム           | `agentRuntime.id: "codex"`                          | OpenClaw の組み込みエージェントターンを Codex アプリサーバー経由で実行します。                  |
| ネイティブチャット制御コマンド      | `/codex bind`, `/codex resume`, `/codex steer`, ... | メッセージング会話から Codex アプリサーバースレッドをバインドして制御します。    |
| Codex アプリサーバープロバイダー/カタログ | `codex` internals, surfaced through the harness     | ランタイムがアプリサーバーモデルを検出して検証できるようにします。                     |
| Codex メディア理解経路    | `codex/*` image-model compatibility paths           | 対応する画像理解モデル向けに、境界付き Codex アプリサーバーターンを実行します。 |
| ネイティブフックリレー                 | Plugin hooks around Codex-native events             | OpenClaw が対応する Codex ネイティブのツール/最終化イベントを観測またはブロックできるようにします。  |

Plugin を有効にすると、これらの機能が利用可能になります。次のことは**行いません**。

- すべての OpenAI モデルで Codex を使い始める
- `openai-codex/*` モデル参照をネイティブランタイムに変換する
- ACP/acpx をデフォルトの Codex 経路にする
- すでに PI ランタイムを記録している既存セッションをホットスイッチする
- OpenClaw のチャネル配信、セッションファイル、認証プロファイルストレージ、またはメッセージルーティングを置き換える

同じ Plugin は、ネイティブ `/codex` チャット制御コマンドサーフェスも所有します。Plugin が有効で、ユーザーがチャットから Codex スレッドのバインド、再開、誘導、停止、または検査を求めた場合、エージェントは ACP より `/codex ...` を優先する必要があります。ユーザーが ACP/acpx を求めた場合、または ACP Codex アダプターをテストしている場合、ACP は明示的なフォールバックのままです。

ネイティブ Codex ターンは、公開互換レイヤーとして OpenClaw Plugin フックを維持します。これらはプロセス内の OpenClaw フックであり、Codex `hooks.json` コマンドフックではありません。

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` for mirrored transcript records
- `before_agent_finalize` through Codex `Stop` relay
- `agent_end`

Plugin は、OpenClaw がツールを実行した後、結果が Codex に返される前に OpenClaw の動的ツール結果を書き換えるため、ランタイム中立のツール結果ミドルウェアを登録することもできます。これは、OpenClaw が所有するトランスクリプトのツール結果書き込みを変換する公開 `tool_result_persist` Plugin フックとは別のものです。

Plugin フックのセマンティクス自体については、[Plugin フック](/ja-JP/plugins/hooks) と [Plugin ガードの動作](/ja-JP/tools/plugin) を参照してください。

ハーネスはデフォルトでオフです。新しい設定では、OpenAI モデル参照を `openai/gpt-*` として正規に保ち、ネイティブアプリサーバー実行を必要とする場合は `agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex` を明示的に強制する必要があります。従来の `codex/*` モデル参照は互換性のため引き続きハーネスを自動選択しますが、ランタイムに裏付けられた従来のプロバイダー接頭辞は通常のモデル/プロバイダー選択肢として表示されません。

`codex` Plugin が有効でもプライマリモデルがまだ `openai-codex/*` の場合、`openclaw doctor` は経路を変更する代わりに警告します。これは意図的です。`openai-codex/*` は引き続き PI Codex OAuth/サブスクリプション経路であり、ネイティブアプリサーバー実行は明示的なランタイム選択のままです。

## 経路マップ

設定を変更する前にこの表を使用してください。

| 望ましい動作                                     | モデル参照                  | ランタイム設定                         | 認証/プロファイル経路           | 期待されるステータスラベル          |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| ネイティブ Codex ランタイムで ChatGPT/Codex サブスクリプション | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth または Codex アカウント | `Runtime: OpenAI Codex`        |
| 通常の OpenClaw ランナー経由の OpenAI API            | `openai/gpt-*`             | 省略または `runtime: "pi"`             | OpenAI API キー               | `Runtime: OpenClaw Pi Default` |
| PI 経由の ChatGPT/Codex サブスクリプション                | `openai-codex/gpt-*`       | 省略または `runtime: "pi"`             | OpenAI Codex OAuth プロバイダー  | `Runtime: OpenClaw Pi Default` |
| 保守的な自動モードでの混在プロバイダー          | プロバイダー固有の参照     | `agentRuntime.id: "auto"`              | 選択されたプロバイダーごと        | 選択されたランタイムによる    |
| 明示的な Codex ACP アダプターセッション                   | ACP プロンプト/モデル依存 | `sessions_spawn` with `runtime: "acp"` | ACP バックエンド認証             | ACP タスク/セッションステータス        |

重要な分岐はプロバイダーとランタイムです。

- `openai-codex/*` は「PI がどのプロバイダー/認証経路を使うべきか」に答えます。
- `agentRuntime.id: "codex"` は「どのループがこの組み込みターンを実行すべきか」に答えます。
- `/codex ...` は「このチャットがどのネイティブ Codex 会話をバインドまたは制御すべきか」に答えます。
- ACP は「acpx がどの外部ハーネスプロセスを起動すべきか」に答えます。

## 適切なモデル接頭辞を選ぶ

OpenAI ファミリーの経路は接頭辞ごとに異なります。一般的なサブスクリプションにネイティブ Codex ランタイムを組み合わせる設定では、`agentRuntime.id: "codex"` とともに `openai/*` を使用します。PI 経由の Codex OAuth を意図的に使いたい場合にのみ、`openai-codex/*` を使用してください。

| モデル参照                                     | ランタイム経路                                 | 使用する場合                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI 配管経由の OpenAI プロバイダー | `OPENAI_API_KEY` を使って現在の直接 OpenAI Platform API アクセスを使用したい場合。 |
| `openai-codex/gpt-5.5`                        | OpenClaw/PI 経由の OpenAI Codex OAuth       | デフォルトの PI ランナーで ChatGPT/Codex サブスクリプション認証を使用したい場合。      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex アプリサーバーハーネス                     | ネイティブ Codex 実行で ChatGPT/Codex サブスクリプション認証を使用したい場合。     |

アカウントで公開されている場合、GPT-5.5 は直接 OpenAI API キー経路と Codex サブスクリプション経路の両方に現れることがあります。ネイティブ Codex ランタイムには Codex アプリサーバーハーネス付きの `openai/gpt-5.5` を、PI OAuth には `openai-codex/gpt-5.5` を、直接 API キートラフィックには Codex ランタイム上書きなしの `openai/gpt-5.5` を使用します。

従来の `codex/gpt-*` 参照は互換エイリアスとして引き続き受け入れられます。Doctor 互換性移行は、従来のプライマリランタイム参照を正規のモデル参照に書き換え、ランタイムポリシーを別途記録します。一方、フォールバック専用の従来参照は、ランタイムがエージェントコンテナ全体に対して設定されるため、変更されません。新しい PI Codex OAuth 設定では `openai-codex/gpt-*` を使用してください。新しいネイティブアプリサーバーハーネス設定では、`agentRuntime.id: "codex"` と組み合わせて `openai/gpt-*` を使用してください。

`agents.defaults.imageModel` も同じ接頭辞の分岐に従います。画像理解を OpenAI Codex OAuth プロバイダー経路で実行する必要がある場合は `openai-codex/gpt-*` を使用します。画像理解を境界付き Codex アプリサーバーターンで実行する必要がある場合は `codex/gpt-*` を使用します。Codex アプリサーバーモデルは画像入力対応を通知している必要があります。テキスト専用の Codex モデルは、メディアターンが開始する前に失敗します。

現在のセッションで有効なハーネスを確認するには `/status` を使用します。選択が予想外の場合は、`agents/harness` サブシステムのデバッグログを有効にし、Gateway の構造化された `agent harness selected` レコードを調べます。そこには、選択されたハーネス ID、選択理由、ランタイム/フォールバックポリシー、そして `auto` モードでは各 Plugin 候補の対応結果が含まれます。

### doctor 警告の意味

`openclaw doctor` は、次のすべてが真の場合に警告します。

- 同梱の `codex` Plugin が有効または許可されている
- エージェントのプライマリモデルが `openai-codex/*` である
- そのエージェントの有効なランタイムが `codex` ではない

この警告が存在するのは、ユーザーが「Codex Plugin が有効」を「ネイティブ Codex アプリサーバーランタイム」と期待することが多いためです。OpenClaw はその飛躍を行いません。この警告の意味は次のとおりです。

- PI 経由の ChatGPT/Codex OAuth を意図している場合、**変更は不要**です。
- ネイティブアプリサーバー実行を意図している場合は、モデルを `openai/<model>` に変更し、`agentRuntime.id: "codex"` を設定します。
- セッションランタイムのピン留めは粘着的なため、ランタイム変更後も既存セッションには `/new` または `/reset` が必要です。

ハーネス選択はライブセッション制御ではありません。組み込みターンが実行されると、OpenClaw は選択されたハーネス ID をそのセッションに記録し、同じセッション ID 内の後続ターンでそれを使い続けます。将来のセッションで別のハーネスを使用したい場合は、`agentRuntime` 設定または `OPENCLAW_AGENT_RUNTIME` を変更してください。既存の会話を PI と Codex の間で切り替える前に、新しいセッションを開始するには `/new` または `/reset` を使用します。これにより、1 つのトランスクリプトを互換性のない 2 つのネイティブセッションシステムで再生することを避けられます。

ハーネスのピン留めが導入される前に作成された従来セッションは、トランスクリプト履歴を持つと PI にピン留めされたものとして扱われます。設定変更後にその会話を Codex に移行するには、`/new` または `/reset` を使用してください。

`/status` は有効なモデルランタイムを表示します。デフォルトの PI ハーネスは
`Runtime: OpenClaw Pi Default` と表示され、Codex app-server ハーネスは
`Runtime: OpenAI Codex` と表示されます。

## 要件

- バンドルされた `codex` plugin が利用可能な OpenClaw。
- Codex app-server `0.125.0` 以降。バンドルされた plugin はデフォルトで互換性のある
  Codex app-server バイナリを管理するため、`PATH` 上のローカル `codex` コマンドは
  通常のハーネス起動に影響しません。
- app-server プロセス、または OpenClaw の Codex 認証ブリッジで Codex 認証が利用可能であること。
  ローカル app-server 起動では、各 agent 用に OpenClaw 管理の Codex home と分離された子 `HOME` を使用するため、デフォルトでは個人の
  `~/.codex` アカウント、Skills、plugins、設定、スレッド状態、またはネイティブの
  `$HOME/.agents/skills` は読み取られません。

この plugin は、古い app-server ハンドシェイクやバージョンなしの app-server ハンドシェイクをブロックします。これにより、
OpenClaw はテスト済みのプロトコルサーフェス上に保たれます。

ライブおよび Docker スモークテストでは、認証は通常 Codex CLI アカウント、または
OpenClaw `openai-codex` 認証プロファイルから取得されます。ローカル stdio app-server 起動では、
アカウントが存在しない場合に `CODEX_API_KEY` / `OPENAI_API_KEY` へフォールバックすることもできます。

## Codex を他のモデルと併用する

同じ agent が Codex と Codex 以外のプロバイダーモデルを自由に切り替える必要がある場合、
`agentRuntime.id: "codex"` をグローバルに設定しないでください。強制されたランタイムは、その agent または session のすべての埋め込みターンに適用されます。そのランタイムが強制されている状態で Anthropic モデルを選択すると、
OpenClaw はそのターンを黙って PI 経由にルーティングするのではなく、引き続き Codex ハーネスを試行してフェイルクローズします。

代わりに、次のいずれかの形を使用してください。

- Codex を `agentRuntime.id: "codex"` を持つ専用 agent に置く。
- デフォルト agent は `agentRuntime.id: "auto"` と通常の混在プロバイダー利用向けの PI フォールバックのままにする。
- 従来の `codex/*` 参照は互換性のためだけに使用する。新しい設定では
  明示的な Codex ランタイムポリシーとともに `openai/*` を優先してください。

たとえば、これはデフォルト agent を通常の自動選択のままにし、
別の Codex agent を追加します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

この形では次のようになります。

- デフォルトの `main` agent は通常のプロバイダーパスと PI 互換性フォールバックを使用します。
- `codex` agent は Codex app-server ハーネスを使用します。
- `codex` agent で Codex が欠落している、またはサポートされていない場合、そのターンは
  静かに PI を使用するのではなく失敗します。

## Agent コマンドルーティング

Agents はユーザーリクエストを「Codex」という単語だけではなく、意図でルーティングする必要があります。

| ユーザーの要求...                                       | Agent が使用すべきもの...                              |
| ------------------------------------------------------ | ------------------------------------------------ |
| 「このチャットを Codex にバインドして」                              | `/codex bind`                                    |
| 「Codex スレッド `<id>` をここで再開して」                      | `/codex resume <id>`                             |
| 「Codex スレッドを表示して」                                   | `/codex threads`                                 |
| 「失敗した Codex 実行のサポートレポートを作成して」            | `/diagnostics [note]`                            |
| 「この添付スレッドについてだけ Codex フィードバックを送信して」    | `/codex diagnostics [note]`                      |
| 「ChatGPT/Codex サブスクリプションを Codex ランタイムで使って」 | `openai/*` と `agentRuntime.id: "codex"`       |
| 「ChatGPT/Codex サブスクリプションを PI 経由で使って」         | `openai-codex/*` モデル参照                      |
| 「ACP/acpx 経由で Codex を実行して」                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「Claude Code/Gemini/OpenCode/Cursor をスレッドで開始して」 | ACP/acpx。`/codex` でもネイティブ sub-agents でもない |

OpenClaw は、ACP が有効で、ディスパッチ可能で、ロード済みランタイムバックエンドに裏付けられている場合にのみ、
ACP spawn ガイダンスを agents に提示します。ACP が利用できない場合、
システムプロンプトと plugin skills は ACP ルーティングについて agent に教えるべきではありません。

## Codex のみのデプロイ

すべての埋め込み agent ターンが Codex を使用することを証明する必要がある場合は、
Codex ハーネスを強制します。明示的な plugin ランタイムはデフォルトで PI フォールバックなしになるため、
`fallback: "none"` は任意ですが、ドキュメントとして役立つことがよくあります。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

環境オーバーライド:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Codex が強制されている場合、Codex plugin が無効、app-server が古すぎる、または
app-server を起動できないと、OpenClaw は早期に失敗します。ハーネス選択が欠落した場合に
PI に処理させることを意図している場合にのみ、
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` を設定してください。

## Agent ごとの Codex

デフォルト agent は通常の自動選択を維持したまま、1 つの agent だけを Codex 専用にできます。

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

通常の session コマンドを使用して agents とモデルを切り替えます。`/new` は新しい
OpenClaw session を作成し、Codex ハーネスは必要に応じて sidecar app-server
スレッドを作成または再開します。`/reset` はそのスレッドの OpenClaw session バインディングをクリアし、
次のターンで現在の設定からハーネスを再解決できるようにします。

## モデル検出

デフォルトでは、Codex plugin は利用可能なモデルを app-server に問い合わせます。
検出に失敗するかタイムアウトした場合、次の bundled フォールバックカタログを使用します。

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

検出は `plugins.entries.codex.config.discovery` で調整できます。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

起動時に Codex のプローブを避け、フォールバックカタログに固定したい場合は、検出を無効にします。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## App-server 接続とポリシー

デフォルトでは、plugin は OpenClaw 管理の Codex バイナリをローカルで次のように起動します。

```bash
codex app-server --listen stdio://
```

管理対象バイナリは `codex` plugin パッケージに同梱されています。これにより、
app-server のバージョンは、ローカルにたまたまインストールされている別個の
Codex CLI ではなく、バンドルされた plugin に結び付けられます。別の実行ファイルを意図的に実行したい場合にのみ、
`appServer.command` を設定してください。

デフォルトでは、OpenClaw はローカル Codex ハーネス session を YOLO モードで開始します:
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"`。これは自律 Heartbeat に使用される信頼済みローカルオペレーター姿勢です。
Codex は、誰も応答できないネイティブ承認プロンプトで停止することなく、shell とネットワークツールを使用できます。

Codex の guardian-reviewed 承認を有効にするには、`appServer.mode:
"guardian"` を設定します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Guardian モードは Codex のネイティブ auto-review 承認パスを使用します。Codex が
サンドボックス外へ出る、workspace 外へ書き込む、またはネットワークアクセスのような権限を追加する承認を求めた場合、
Codex はその承認リクエストを人間のプロンプトではなくネイティブ reviewer にルーティングします。
reviewer は Codex のリスクフレームワークを適用し、特定のリクエストを承認または拒否します。
YOLO モードより多くのガードレールが必要だが、無人 agents の進行も必要な場合は Guardian を使用してください。

`guardian` プリセットは `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。
個別のポリシーフィールドは引き続き `mode` を上書きするため、高度なデプロイでは
プリセットと明示的な選択を組み合わせられます。古い `guardian_subagent` reviewer 値は
互換性エイリアスとして引き続き受け付けられますが、新しい設定では
`auto_review` を使用してください。

すでに実行中の app-server には、WebSocket transport を使用します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Stdio app-server 起動はデフォルトで OpenClaw のプロセス環境を継承しますが、
OpenClaw は Codex app-server アカウントブリッジを所有し、`CODEX_HOME` と `HOME` の両方を、その agent の OpenClaw 状態配下にある agent ごとのディレクトリに設定します。
Codex 自身の skill loader は `$CODEX_HOME/skills` と
`$HOME/.agents/skills` を読み取るため、ローカル app-server 起動では両方の値が分離されます。
これにより、Codex ネイティブの Skills、plugins、設定、アカウント、スレッド状態が、
オペレーター個人の Codex CLI home から漏れ込むのではなく、OpenClaw agent にスコープされます。

OpenClaw plugins と OpenClaw skill snapshots は引き続き OpenClaw 自身の
plugin registry と skill loader を通じて流れます。個人の Codex CLI アセットは流れません。
OpenClaw agent の一部にすべき有用な Codex CLI Skills や plugins がある場合は、
明示的に棚卸ししてください。

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration provider は Skills を現在の OpenClaw agent workspace にコピーします。
Codex ネイティブ plugins、hooks、設定ファイルは、自動的に有効化されるのではなく、手動レビューのために報告またはアーカイブされます。
これは、それらがコマンドを実行したり、MCP サーバーを公開したり、認証情報を保持したりできるためです。

認証は次の順序で選択されます。

1. agent 用の明示的な OpenClaw Codex 認証プロファイル。
2. その agent の Codex home にある app-server の既存アカウント。
3. ローカル stdio app-server 起動のみで、app-server アカウントが存在せず、OpenAI 認証が
   まだ必要な場合、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、spawn された Codex 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、
Gateway レベルの API キーを embeddings や直接の OpenAI モデルで利用可能に保ちつつ、
ネイティブ Codex app-server ターンが誤って API 経由で課金されないようにします。
明示的な Codex API-key プロファイルとローカル stdio env-key フォールバックは、
継承された子プロセス env ではなく app-server login を使用します。WebSocket app-server 接続は
Gateway env API-key フォールバックを受け取りません。明示的な認証プロファイル、または
remote app-server 自身のアカウントを使用してください。

デプロイで追加の環境分離が必要な場合は、それらの変数を
`appServer.clearEnv` に追加します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` は spawn された Codex app-server 子プロセスにのみ影響します。

Codex dynamic tools はデフォルトで `native-first` プロファイルになります。このモードでは、
OpenClaw は Codex ネイティブ workspace 操作と重複する dynamic tools を公開しません:
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、および
`update_plan`。messaging、sessions、media、
cron、browser、nodes、gateway、`heartbeat_respond`、`web_search` などの OpenClaw integration tools は引き続き利用可能です。

サポートされる最上位の Codex plugin フィールド:

| フィールド                 | デフォルト     | 意味                                                                                         |
| -------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Codex app-server に OpenClaw の完全な動的ツールセットを公開するには `"openclaw-compat"` を使用します。 |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server のターンから除外する追加の OpenClaw 動的ツール名。                         |

サポートされる `appServer` フィールド:

| フィールド          | デフォルト                             | 意味                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` は Codex を起動し、`"websocket"` は `url` に接続します。                                                                                                                                                                |
| `command`           | 管理対象の Codex バイナリ               | stdio トランスポート用の実行ファイル。管理対象バイナリを使用する場合は未設定のままにし、明示的に上書きする場合のみ設定します。                                                                                                 |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio トランスポート用の引数。                                                                                                                                                                                                   |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                                       |
| `authToken`         | 未設定                                   | WebSocket トランスポート用の Bearer トークン。                                                                                                                                                                                    |
| `headers`           | `{}`                                     | 追加の WebSocket ヘッダー。                                                                                                                                                                                                      |
| `clearEnv`          | `[]`                                     | OpenClaw が継承環境を構築した後に、起動された stdio app-server プロセスから削除される追加の環境変数名。`CODEX_HOME` と `HOME` は、ローカル起動時の OpenClaw のエージェント単位の Codex 分離用に予約されています。 |
| `requestTimeoutMs`  | `60000`                                  | app-server コントロールプレーン呼び出しのタイムアウト。                                                                                                                                                                         |
| `mode`              | `"yolo"`                                 | YOLO または guardian レビュー付き実行のプリセット。                                                                                                                                                                             |
| `approvalPolicy`    | `"never"`                                | スレッド開始、再開、ターンに送信されるネイティブ Codex 承認ポリシー。                                                                                                                                                           |
| `sandbox`           | `"danger-full-access"`                   | スレッド開始、再開に送信されるネイティブ Codex サンドボックスモード。                                                                                                                                                           |
| `approvalsReviewer` | `"user"`                                 | Codex にネイティブ承認プロンプトをレビューさせるには `"auto_review"` を使用します。`guardian_subagent` はレガシーエイリアスのままです。                                                                                         |
| `serviceTier`       | 未設定                                   | 任意の Codex app-server サービス階層: `"fast"`、`"flex"`、または `null`。無効なレガシー値は無視されます。                                                                                                                        |

OpenClaw 所有の動的ツール呼び出しは、`appServer.requestTimeoutMs` とは
独立して制限されます。各 Codex `item/tool/call` リクエストは、30 秒以内に
OpenClaw のレスポンスを受け取る必要があります。タイムアウト時、OpenClaw は
サポートされている場合はツールシグナルを中止し、失敗した動的ツールレスポンスを
Codex に返すため、セッションを `processing` のまま残さずに
ターンを続行できます。

OpenClaw が Codex のターンスコープ app-server リクエストに応答した後、
ハーネスは Codex がネイティブターンを `turn/completed` で完了することも期待します。
その応答後に app-server が 60 秒間静かになった場合、OpenClaw はベストエフォートで
Codex ターンに割り込み、診断タイムアウトを記録し、古いネイティブターンの背後に
後続のチャットメッセージがキューされないように OpenClaw セッションレーンを解放します。

ローカルテストでは環境変数による上書きが引き続き利用できます:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、`OPENCLAW_CODEX_APP_SERVER_BIN` は
管理対象バイナリを迂回します。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、
一回限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を
使用してください。反復可能なデプロイでは設定を使うことが推奨されます。これは、
Codex ハーネス設定の残りと同じレビュー済みファイル内に plugin の動作を保持するためです。

## コンピューター使用

Computer Use は専用のセットアップガイドで説明されています:
[Codex Computer Use](/ja-JP/plugins/codex-computer-use)。

要約すると、OpenClaw はデスクトップ制御アプリをベンダー化せず、
デスクトップアクション自体も実行しません。Codex app-server を準備し、
`computer-use` MCP サーバーが利用可能であることを検証してから、
Codex モードのターン中に Codex がネイティブ MCP ツール呼び出しを処理できるようにします。

Codex マーケットプレイスフローの外で TryCua ドライバーに直接アクセスするには、
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` で
`cua-driver mcp` を登録します。Codex 所有の Computer Use と直接 MCP 登録の違いについては、
[Codex Computer Use](/ja-JP/plugins/codex-computer-use) を参照してください。

最小構成:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

セットアップはコマンドサーフェスから確認またはインストールできます:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use は macOS 固有であり、Codex MCP サーバーがアプリを制御できるようになる前に
ローカル OS 権限が必要になる場合があります。`computerUse.enabled` が true で MCP
サーバーが利用できない場合、Codex モードのターンは、ネイティブの Computer Use ツールなしで
暗黙に実行されるのではなく、スレッドが開始する前に失敗します。マーケットプレイスの選択肢、
リモートカタログの制限、ステータス理由、トラブルシューティングについては、
[Codex Computer Use](/ja-JP/plugins/codex-computer-use) を参照してください。

`computerUse.autoInstall` が true の場合、Codex がまだローカルマーケットプレイスを
検出していなければ、OpenClaw は `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
から標準のバンドル済み Codex Desktop マーケットプレイスを登録できます。ランタイムまたは
Computer Use 設定を変更した後は、既存セッションが古い PI または Codex スレッドバインディングを
保持しないように、`/new` または `/reset` を使用してください。

## 一般的なレシピ

デフォルトの stdio トランスポートを使用するローカル Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Codex 専用ハーネス検証:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

guardian レビュー付き Codex 承認:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

明示的なヘッダーを使用するリモート app-server:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

モデル切り替えは OpenClaw の制御下にあります。OpenClaw セッションが既存の
Codex スレッドにアタッチされている場合、次のターンでは現在選択されている
OpenAI モデル、プロバイダー、承認ポリシー、サンドボックス、サービス階層が
app-server に再送信されます。`openai/gpt-5.5` から `openai/gpt-5.2` に切り替えても
スレッドバインディングは維持されますが、新しく選択されたモデルで続行するよう Codex に要求します。

## Codex コマンド

バンドル済み plugin は、`/codex` を承認済みスラッシュコマンドとして登録します。
これは汎用的で、OpenClaw テキストコマンドをサポートする任意のチャンネルで動作します。

一般的な形式:

- `/codex status` は、ライブ app-server 接続、モデル、アカウント、レート制限、MCP サーバー、Skills を表示します。
- `/codex models` は、ライブ Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex スレッドにアタッチします。
- `/codex compact` は、アタッチされたスレッドを compact するよう Codex app-server に要求します。
- `/codex review` は、アタッチされたスレッドの Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、アタッチされたスレッドの Codex 診断フィードバックを送信する前に確認します。
- `/codex computer-use status` は、設定された Computer Use plugin と MCP サーバーを確認します。
- `/codex computer-use install` は、設定された Computer Use plugin をインストールし、MCP サーバーを再読み込みします。
- `/codex account` は、アカウントとレート制限のステータスを表示します。
- `/codex mcp` は、Codex app-server MCP サーバーのステータスを一覧表示します。
- `/codex skills` は、Codex app-server skills を一覧表示します。

### 一般的なデバッグワークフロー

Codex バックエンドのエージェントが Telegram、Discord、Slack、
または別のチャンネルで予期しない動作をした場合は、問題が発生した会話から始めます:

1. `/diagnostics bad tool choice after image upload`、または見た内容を説明する別の短いメモを実行します。
2. 診断リクエストを一度承認します。承認によりローカルの Gateway
   診断 zip が作成されます。また、セッションが Codex ハーネスを使用しているため、
   関連する Codex フィードバックバンドルも OpenAI サーバーへ送信されます。
3. 完了した診断返信をバグレポートまたはサポートスレッドにコピーします。
   そこには、ローカルバンドルのパス、プライバシー概要、OpenClaw セッション ID、
   Codex スレッド ID、および各 Codex スレッドの `Inspect locally` 行が含まれます。
4. 実行を自分でデバッグしたい場合は、表示された `Inspect locally`
   コマンドをターミナルで実行します。これは `codex resume <thread-id>` のような形式で、
   ネイティブの Codex スレッドを開き、会話を確認したり、ローカルで継続したり、
   Codex が特定のツールや計画を選んだ理由を尋ねたりできます。

現在アタッチされているスレッドについて、完全な OpenClaw
Gateway 診断バンドルなしで Codex フィードバックアップロードだけを明示的に必要とする場合にのみ、
`/codex diagnostics [note]` を使用します。ほとんどのサポートレポートでは、`/diagnostics [note]` のほうが適切な開始点です。これはローカル Gateway の状態と Codex
スレッド ID を 1 つの返信に結び付けるためです。完全なプライバシーモデルとグループチャットでの挙動については、[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

Core OpenClaw は、一般的な Gateway 診断コマンドとして、所有者専用の `/diagnostics [note]` も公開しています。その承認プロンプトには機密データの前文が表示され、[診断エクスポート](/ja-JP/gateway/diagnostics)へのリンクが含まれ、毎回明示的な exec 承認を通じて
`openclaw gateway diagnostics export --json` を要求します。allow-all ルールで診断を承認しないでください。承認後、
OpenClaw はローカルバンドルのパスとマニフェスト概要を含む、貼り付け可能なレポートを送信します。アクティブな OpenClaw セッションが Codex ハーネスを使用している場合、
同じ承認により、関連する Codex フィードバックバンドルを OpenAI サーバーへ送信することも許可されます。承認プロンプトには Codex フィードバックが送信されることが表示されますが、
承認前に Codex セッション ID やスレッド ID は列挙されません。

`/diagnostics` がグループチャット内で所有者によって呼び出された場合、OpenClaw は共有チャンネルをクリーンに保ちます。グループには短い通知のみが送信され、
診断の前文、承認プロンプト、Codex セッション ID とスレッド ID は、非公開の承認ルートを通じて所有者に送信されます。非公開の所有者ルートがない場合、
OpenClaw はグループリクエストを拒否し、DM から実行するよう所有者に求めます。

承認された Codex アップロードは Codex app-server の `feedback/upload` を呼び出し、
一覧表示された各スレッドと、利用可能な場合は生成された Codex サブスレッドのログを含めるよう app-server に要求します。アップロードは Codex の通常のフィードバック経路を通じて OpenAI
サーバーへ送信されます。その app-server で Codex フィードバックが無効な場合、コマンドは app-server エラーを返します。完了した診断返信には、送信されたスレッドについて、
チャンネル、OpenClaw セッション ID、Codex スレッド ID、ローカルの `codex resume <thread-id>`
コマンドが列挙されます。承認を拒否または無視した場合、OpenClaw はそれらの Codex ID を表示しません。このアップロードは、ローカルの Gateway 診断エクスポートを置き換えるものではありません。

`/codex resume` は、ハーネスが通常のターンで使用するものと同じ sidecar バインディングファイルを書き込みます。次のメッセージで、OpenClaw はその Codex スレッドを再開し、
現在選択されている OpenClaw モデルを app-server に渡し、拡張履歴を有効に保ちます。

### CLI から Codex スレッドを確認する

問題のある Codex 実行を理解する最速の方法は、多くの場合、ネイティブの Codex
スレッドを直接開くことです。

```sh
codex resume <thread-id>
```

チャンネル会話でバグに気づき、問題のある Codex セッションを確認したい場合、ローカルで継続したい場合、または Codex が特定のツールや推論を選んだ理由を尋ねたい場合に使用します。通常、最も簡単な方法は、最初に
`/diagnostics [note]` を実行することです。承認後、完了したレポートには各 Codex スレッドが列挙され、`Inspect locally` コマンドが表示されます。たとえば
`codex resume <thread-id>` です。そのコマンドを直接ターミナルにコピーできます。

現在のチャットについては `/codex binding` から、最近の Codex app-server スレッドについては
`/codex threads [filter]` からスレッド ID を取得し、同じ `codex resume`
コマンドをシェルで実行することもできます。

このコマンドサーフェスには Codex app-server `0.125.0` 以降が必要です。将来版またはカスタム app-server がその JSON-RPC メソッドを公開していない場合、個々の制御メソッドは `unsupported by this Codex app-server` として報告されます。

## フック境界

Codex ハーネスには 3 つのフック層があります。

| 層                                    | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin フック                | OpenClaw                 | PI と Codex ハーネス全体でのプロダクト/Plugin 互換性。             |
| Codex app-server 拡張ミドルウェア     | OpenClaw バンドル Plugin | OpenClaw 動的ツールの周辺におけるターンごとのアダプター挙動。      |
| Codex ネイティブフック                | Codex                    | Codex 設定に基づく低レベルの Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、OpenClaw Plugin の挙動をルーティングするために、プロジェクトまたはグローバルの Codex `hooks.json` ファイルを使用しません。サポートされているネイティブツールと権限ブリッジについては、
OpenClaw は `PreToolUse`、`PostToolUse`、`PermissionRequest`、`Stop` 用のスレッドごとの Codex 設定を注入します。`SessionStart` や
`UserPromptSubmit` などの他の Codex フックは Codex レベルの制御のままであり、v1 契約では OpenClaw Plugin フックとして公開されません。

OpenClaw 動的ツールについては、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、OpenClaw はハーネスアダプター内で自分が所有する Plugin とミドルウェアの挙動を発火します。Codex ネイティブツールについては、Codex が正規のツールレコードを所有します。
OpenClaw は選択されたイベントをミラーできますが、Codex が app-server またはネイティブフックコールバックを通じてその操作を公開しない限り、ネイティブの Codex
スレッドを書き換えることはできません。

Compaction と LLM ライフサイクルの投影は、ネイティブの Codex フックコマンドではなく、Codex app-server
通知と OpenClaw アダプター状態から得られます。OpenClaw の `before_compaction`、`after_compaction`、`llm_input`、`llm_output`
イベントはアダプターレベルの観測であり、Codex の内部リクエストや Compaction ペイロードをバイト単位でそのまま取り込んだものではありません。

Codex ネイティブの `hook/started` および `hook/completed` app-server 通知は、軌跡とデバッグ用の
`codex_app_server.hook` エージェントイベントとして投影されます。これらは OpenClaw Plugin フックを呼び出しません。

## V1 サポート契約

Codex モードは、下層のモデル呼び出しだけが異なる PI ではありません。Codex はネイティブモデルループのより多くを所有し、OpenClaw はその境界に合わせて Plugin とセッションサーフェスを適応させます。

Codex ランタイム v1 でサポートされるもの:

| サーフェス                                    | サポート                                | 理由                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex を通じた OpenAI モデルループ            | サポートあり                            | Codex app-server が OpenAI ターン、ネイティブスレッド再開、ネイティブツール継続を所有します。                                                                                                        |
| OpenClaw チャンネルルーティングと配信         | サポートあり                            | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャンネルはモデルランタイムの外側に残ります。                                                                                                |
| OpenClaw 動的ツール                           | サポートあり                            | Codex が OpenClaw にこれらのツールの実行を要求するため、OpenClaw は実行経路内に残ります。                                                                                                            |
| プロンプトおよびコンテキスト Plugin           | サポートあり                            | OpenClaw はスレッドを開始または再開する前に、プロンプトオーバーレイを構築し、コンテキストを Codex ターンに投影します。                                                                              |
| コンテキストエンジンライフサイクル            | サポートあり                            | Assemble、ingest またはターン後メンテナンス、およびコンテキストエンジンの Compaction 調整が Codex ターンで実行されます。                                                                            |
| 動的ツールフック                              | サポートあり                            | `before_tool_call`、`after_tool_call`、およびツール結果ミドルウェアは、OpenClaw が所有する動的ツールの周辺で実行されます。                                                                           |
| ライフサイクルフック                          | アダプター観測としてサポートあり        | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は、正直な Codex モードのペイロードで発火します。                                                                     |
| 最終回答の改訂ゲート                          | ネイティブフックリレーを通じてサポートあり | Codex `Stop` は `before_agent_finalize` にリレーされます。`revise` は、最終化の前にもう 1 回モデルパスを実行するよう Codex に要求します。                                                            |
| ネイティブシェル、パッチ、MCP のブロックまたは観測 | ネイティブフックリレーを通じてサポートあり | Codex `PreToolUse` と `PostToolUse` は、Codex app-server `0.125.0` 以降での MCP ペイロードを含む、コミット済みのネイティブツールサーフェス向けにリレーされます。ブロックはサポートされますが、引数の書き換えはサポートされません。 |
| ネイティブ権限ポリシー                        | ネイティブフックリレーを通じてサポートあり | Codex `PermissionRequest` は、ランタイムが公開している場合、OpenClaw ポリシーを通じてルーティングできます。OpenClaw が判断を返さない場合、Codex は通常のガーディアンまたはユーザー承認経路を通じて継続します。 |
| App-server 軌跡キャプチャ                     | サポートあり                            | OpenClaw は app-server に送信したリクエストと、受信した app-server 通知を記録します。                                                                                                                |

Codex ランタイム v1 でサポートされないもの:

| Surface                                             | V1 の境界                                                                                                                                     | 将来のパス                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ネイティブツール引数の変更                       | Codex のネイティブな pre-tool フックはブロックできますが、OpenClaw は Codex ネイティブのツール引数を書き換えません。                                               | 置換後のツール入力には Codex のフック/スキーマ対応が必要です。                            |
| 編集可能な Codex ネイティブのトランスクリプト履歴            | Codex が正規のネイティブスレッド履歴を所有します。OpenClaw はミラーを所有し、将来のコンテキストを投影できますが、未サポートの内部構造を変更すべきではありません。 | ネイティブスレッドの外科的な変更が必要な場合は、明示的な Codex app-server API を追加します。                    |
| Codex ネイティブのツールレコード向け `tool_result_persist` | そのフックは OpenClaw が所有するトランスクリプト書き込みを変換するもので、Codex ネイティブのツールレコードではありません。                                                           | 変換済みレコードをミラーすることは可能ですが、正規の書き換えには Codex の対応が必要です。              |
| リッチなネイティブ Compaction メタデータ                     | OpenClaw は Compaction の開始と完了を監視しますが、安定した保持/破棄リスト、トークン差分、要約ペイロードは受け取りません。            | よりリッチな Codex Compaction イベントが必要です。                                                     |
| Compaction 介入                             | 現在の OpenClaw Compaction フックは、Codex モードでは通知レベルです。                                                                         | Plugin がネイティブ Compaction を拒否または書き換える必要がある場合は、Codex の Compaction 前後フックを追加します。 |
| バイト単位で一致するモデル API リクエストのキャプチャ             | OpenClaw は app-server のリクエストと通知をキャプチャできますが、Codex core は最終的な OpenAI API リクエストを内部で構築します。                      | Codex のモデルリクエスト追跡イベントまたはデバッグ API が必要です。                                   |

## ツール、メディア、Compaction

Codex ハーネスは、低レベルの埋め込みエージェント実行器のみを変更します。

OpenClaw は引き続きツールリストを構築し、ハーネスから動的なツール結果を受け取ります。テキスト、画像、動画、音楽、TTS、承認、メッセージングツールの出力は、通常の OpenClaw 配信パスを通り続けます。

ネイティブフックリレーは意図的に汎用的ですが、v1 のサポート契約は OpenClaw がテストする Codex ネイティブのツールと権限のパスに限定されます。Codex ランタイムでは、これには shell、patch、MCP の `PreToolUse`、`PostToolUse`、`PermissionRequest` ペイロードが含まれます。ランタイム契約が名前を挙げるまでは、将来のすべての Codex フックイベントが OpenClaw Plugin サーフェスだと想定しないでください。

`PermissionRequest` について、OpenClaw はポリシーが判断した場合にのみ明示的な許可または拒否の決定を返します。決定なしの結果は許可ではありません。Codex はそれをフック決定なしとして扱い、独自のガーディアンまたはユーザー承認パスにフォールスルーします。

Codex MCP ツール承認の elicitation は、Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` としてマークした場合、OpenClaw の Plugin 承認フローを通じてルーティングされます。Codex の `request_user_input` プロンプトは元のチャットへ送り返され、次にキューに入ったフォローアップメッセージは、追加コンテキストとして誘導されるのではなく、そのネイティブサーバーリクエストへの回答になります。その他の MCP elicitation リクエストは引き続き fail closed します。

アクティブ実行キューの誘導は Codex app-server の `turn/steer` に対応します。デフォルトの `messages.queue.mode: "steer"` では、OpenClaw は設定された静穏ウィンドウの間キュー内のチャットメッセージをまとめ、到着順に 1 つの `turn/steer` リクエストとして送信します。レガシーの `queue` モードは個別の `turn/steer` リクエストを送信します。Codex のレビューターンと手動 Compaction ターンでは同一ターンの誘導が拒否される場合があり、その場合 OpenClaw は、選択されたモードがフォールバックを許可していればフォローアップキューを使用します。[Steering queue](/ja-JP/concepts/queue-steering) を参照してください。

選択したモデルが Codex ハーネスを使用する場合、ネイティブスレッドの Compaction は Codex app-server に委譲されます。OpenClaw は、チャンネル履歴、検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのためにトランスクリプトミラーを保持します。ミラーには、ユーザープロンプト、最終的なアシスタントテキスト、および app-server が発行する場合は軽量な Codex 推論または計画レコードが含まれます。現時点で OpenClaw は、ネイティブ Compaction の開始と完了シグナルのみを記録します。人が読める Compaction 要約や、Compaction 後に Codex が保持したエントリの監査可能なリストは、まだ公開していません。

Codex が正規のネイティブスレッドを所有するため、`tool_result_persist` は現在 Codex ネイティブのツール結果レコードを書き換えません。これは、OpenClaw が OpenClaw 所有セッショントランスクリプトのツール結果を書き込む場合にのみ適用されます。

メディア生成には PI は不要です。画像、動画、音楽、PDF、TTS、メディア理解は、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts` など、対応するプロバイダー/モデル設定を引き続き使用します。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** 新しい設定では想定どおりです。`agentRuntime.id: "codex"` を持つ `openai/gpt-*` モデル（またはレガシーの `codex/*` 参照）を選択し、`plugins.entries.codex.enabled` を有効にし、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく PI を使用する:** `agentRuntime.id: "auto"` は、Codex ハーネスが実行を要求しない場合、互換性バックエンドとして PI を引き続き使用できます。テスト中に Codex の選択を強制するには `agentRuntime.id: "codex"` を設定してください。強制された Codex ランタイムは、`agentRuntime.fallback: "pi"` を明示的に設定しない限り、PI にフォールバックせずに失敗するようになりました。Codex app-server が選択されると、その失敗は追加のフォールバック設定なしで直接表面化します。

**app-server が拒否される:** app-server ハンドシェイクがバージョン `0.125.0` 以降を報告するように Codex をアップグレードしてください。`0.125.0-alpha.2` や `0.125.0+custom` のような同一バージョンのプレリリースまたはビルドサフィックス付きバージョンは拒否されます。これは、安定版 `0.125.0` のプロトコル下限を OpenClaw がテストしているためです。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にしてください。

**WebSocket トランスポートが即座に失敗する:** `appServer.url`、`authToken`、およびリモート app-server が同じ Codex app-server プロトコルバージョンを話していることを確認してください。

**Codex 以外のモデルが PI を使用する:** そのエージェントに対して `agentRuntime.id: "codex"` を強制したか、レガシーの `codex/*` 参照を選択した場合を除き、これは想定どおりです。プレーンな `openai/gpt-*` やその他のプロバイダー参照は、`auto` モードでは通常のプロバイダーパスに留まります。`agentRuntime.id: "codex"` を強制する場合、そのエージェントのすべての埋め込みターンは Codex 対応の OpenAI モデルである必要があります。

**Computer Use はインストールされているがツールが実行されない:** 新しいセッションから `/codex computer-use status` を確認してください。ツールが `Native hook relay unavailable` を報告する場合は、`/new` または `/reset` を使用してください。それでも続く場合は、gateway を再起動して古いネイティブフック登録をクリアしてください。`computer-use.list_apps` がタイムアウトする場合は、Codex Computer Use または Codex Desktop を再起動して再試行してください。

## 関連

- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [ステータス](/ja-JP/cli/status)
- [Plugin フック](/ja-JP/plugins/hooks)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
