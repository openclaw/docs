---
read_when:
    - バンドルされている Codex アプリサーバーハーネスを使用したい場合
    - Codex ハーネス設定の例が必要です
    - Codex のみのデプロイで、PI にフォールバックするのではなく失敗させたい場合
summary: バンドルされた Codex app-server ハーネスを通じて OpenClaw の埋め込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-04-30T20:05:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 335ec60cbdb76579db833eccb5151ffc5bcd28b370ca2e99587abdb578eeee4f
    source_path: plugins/codex-harness.md
    workflow: 16
---

同梱の `codex` Plugin により、OpenClaw は組み込みの PI ハーネスではなく Codex app-server を通じて埋め込みエージェントターンを実行できます。

低レベルのエージェントセッション、つまりモデル検出、ネイティブスレッドの再開、ネイティブ Compaction、app-server 実行を Codex に所有させたい場合に使用します。OpenClaw は引き続き、チャットチャネル、セッションファイル、モデル選択、ツール、承認、メディア配信、表示されるトランスクリプトミラーを所有します。

全体像を把握したい場合は、[エージェントランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。短く言えば、`openai/gpt-5.5` はモデル参照、`codex` はランタイムであり、Telegram、Discord、Slack、または別のチャネルが通信サーフェスのままです。

## この Plugin が変更すること

同梱の `codex` Plugin は、複数の独立した機能を提供します。

| 機能                              | 使い方                                              | 何をするか                                                                    |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| ネイティブ組み込みランタイム      | `agentRuntime.id: "codex"`                          | Codex app-server を通じて OpenClaw の埋め込みエージェントターンを実行します。 |
| ネイティブチャット制御コマンド    | `/codex bind`, `/codex resume`, `/codex steer`, ... | メッセージング会話から Codex app-server スレッドをバインドおよび制御します。  |
| Codex app-server プロバイダー/カタログ | `codex` 内部、ハーネス経由で公開                   | ランタイムが app-server モデルを検出および検証できるようにします。            |
| Codex メディア理解パス            | `codex/*` 画像モデル互換パス                        | 対応する画像理解モデル向けに境界付きの Codex app-server ターンを実行します。 |
| ネイティブフックリレー            | Codex ネイティブイベント周辺の Plugin フック        | 対応する Codex ネイティブのツール/完了イベントを OpenClaw が監視/ブロックできるようにします。 |

この Plugin を有効にすると、これらの機能が利用可能になります。次のことは**行いません**。

- すべての OpenAI モデルで Codex を使い始める
- `openai-codex/*` モデル参照をネイティブランタイムに変換する
- ACP/acpx をデフォルトの Codex パスにする
- すでに PI ランタイムを記録した既存セッションをホットスイッチする
- OpenClaw のチャネル配信、セッションファイル、認証プロファイル保存、またはメッセージルーティングを置き換える

同じ Plugin は、ネイティブの `/codex` チャット制御コマンドサーフェスも所有します。Plugin が有効で、ユーザーがチャットから Codex スレッドのバインド、再開、ステアリング、停止、または調査を求めた場合、エージェントは ACP よりも `/codex ...` を優先するべきです。ユーザーが ACP/acpx を求めている場合、または ACP Codex アダプターをテストしている場合、ACP は明示的なフォールバックのままです。

ネイティブ Codex ターンでは、OpenClaw Plugin フックが公開互換レイヤーとして維持されます。これらはプロセス内の OpenClaw フックであり、Codex の `hooks.json` コマンドフックではありません。

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write`（ミラーされたトランスクリプトレコード用）
- Codex `Stop` リレーを通じた `before_agent_finalize`
- `agent_end`

Plugin は、ランタイム中立のツール結果ミドルウェアも登録でき、OpenClaw がツールを実行した後、結果が Codex に返される前に OpenClaw の動的ツール結果を書き換えられます。これは公開 `tool_result_persist` Plugin フックとは別のものです。このフックは、OpenClaw が所有するトランスクリプトのツール結果書き込みを変換します。

Plugin フックのセマンティクス自体については、[Plugin フック](/ja-JP/plugins/hooks) と [Plugin ガード動作](/ja-JP/tools/plugin) を参照してください。

ハーネスはデフォルトで無効です。新しい設定では、OpenAI モデル参照を `openai/gpt-*` として正規のまま維持し、ネイティブ app-server 実行が必要な場合は `agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex` を明示的に強制するべきです。レガシーの `codex/*` モデル参照は互換性のために引き続きハーネスを自動選択しますが、ランタイムに裏付けられたレガシープロバイダープレフィックスは通常のモデル/プロバイダー選択肢として表示されません。

`codex` Plugin が有効でも、プライマリモデルがまだ `openai-codex/*` の場合、`openclaw doctor` は経路を変更せずに警告します。これは意図的なものです。`openai-codex/*` は PI Codex OAuth/サブスクリプションパスのままであり、ネイティブ app-server 実行は明示的なランタイム選択のままです。

## ルートマップ

設定を変更する前に、この表を使用してください。

| 望ましい動作                                  | モデル参照                 | ランタイム設定                         | Plugin 要件                 | 期待されるステータスラベル     |
| --------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| 通常の OpenClaw ランナー経由の OpenAI API     | `openai/gpt-*`             | 省略、または `runtime: "pi"`           | OpenAI プロバイダー         | `Runtime: OpenClaw Pi Default` |
| PI 経由の Codex OAuth/サブスクリプション      | `openai-codex/gpt-*`       | 省略、または `runtime: "pi"`           | OpenAI Codex OAuth プロバイダー | `Runtime: OpenClaw Pi Default` |
| ネイティブ Codex app-server 組み込みターン    | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex` Plugin              | `Runtime: OpenAI Codex`        |
| 保守的な自動モードでの混在プロバイダー        | プロバイダー固有の参照     | `agentRuntime.id: "auto"`              | 任意の Plugin ランタイム    | 選択されたランタイムに依存     |
| 明示的な Codex ACP アダプターセッション       | ACP プロンプト/モデルに依存 | `sessions_spawn` with `runtime: "acp"` | 正常な `acpx` バックエンド  | ACP タスク/セッションステータス |

重要な分離は、プロバイダーとランタイムの違いです。

- `openai-codex/*` は「PI はどのプロバイダー/認証経路を使用するべきか？」に答えます
- `agentRuntime.id: "codex"` は「この埋め込みターンをどのループで実行するべきか？」に答えます
- `/codex ...` は「このチャットはどのネイティブ Codex 会話をバインドまたは制御するべきか？」に答えます
- ACP は「acpx はどの外部ハーネスプロセスを起動するべきか？」に答えます

## 適切なモデルプレフィックスを選ぶ

OpenAI ファミリーのルートはプレフィックス固有です。PI 経由の Codex OAuth が必要な場合は `openai-codex/*` を使用し、直接の OpenAI API アクセスが必要な場合、またはネイティブ Codex app-server ハーネスを強制する場合は `openai/*` を使用します。

| モデル参照                                    | ランタイムパス                             | 使用する場合                                                              |
| --------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI 配管経由の OpenAI プロバイダー | `OPENAI_API_KEY` による現在の直接 OpenAI Platform API アクセスが必要な場合。 |
| `openai-codex/gpt-5.5`                        | OpenClaw/PI 経由の OpenAI Codex OAuth      | デフォルトの PI ランナーで ChatGPT/Codex サブスクリプション認証が必要な場合。 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server ハーネス                  | 埋め込みエージェントターンでネイティブ Codex app-server 実行が必要な場合。 |

GPT-5.5 は現在 OpenClaw ではサブスクリプション/OAuth のみです。PI OAuth には `openai-codex/gpt-5.5` を使用し、Codex app-server ハーネスには `openai/gpt-5.5` を使用してください。OpenAI が公開 API で GPT-5.5 を有効にすると、`openai/gpt-5.5` の直接 API キーアクセスがサポートされます。

レガシーの `codex/gpt-*` 参照は、互換エイリアスとして引き続き受け入れられます。Doctor の互換移行は、レガシーのプライマリランタイム参照を正規モデル参照に書き換え、ランタイムポリシーを別に記録します。一方で、フォールバック専用のレガシー参照は、ランタイムがエージェントコンテナ全体に対して設定されるため変更されません。新しい PI Codex OAuth 設定では `openai-codex/gpt-*` を使用し、新しいネイティブ app-server ハーネス設定では `openai/gpt-*` と `agentRuntime.id: "codex"` を組み合わせて使用してください。

`agents.defaults.imageModel` も同じプレフィックス分離に従います。画像理解を OpenAI Codex OAuth プロバイダーパス経由で実行する必要がある場合は `openai-codex/gpt-*` を使用してください。画像理解を境界付きの Codex app-server ターン経由で実行する必要がある場合は `codex/gpt-*` を使用してください。Codex app-server モデルは画像入力サポートを公開している必要があります。テキスト専用の Codex モデルは、メディアターンが開始する前に失敗します。

現在のセッションで有効なハーネスを確認するには `/status` を使用してください。選択が予想外の場合は、`agents/harness` サブシステムのデバッグログを有効にし、Gateway の構造化された `agent harness selected` レコードを調べてください。これには、選択されたハーネス ID、選択理由、ランタイム/フォールバックポリシー、および `auto` モードでは各 Plugin 候補のサポート結果が含まれます。

### doctor 警告の意味

`openclaw doctor` は、次のすべてが真の場合に警告します。

- 同梱の `codex` Plugin が有効、または許可されている
- エージェントのプライマリモデルが `openai-codex/*`
- そのエージェントの有効なランタイムが `codex` ではない

この警告が存在するのは、ユーザーがしばしば「Codex Plugin が有効」であれば「ネイティブ Codex app-server ランタイム」も意味すると期待するためです。OpenClaw はその飛躍を行いません。この警告の意味は次のとおりです。

- PI 経由の ChatGPT/Codex OAuth を意図していた場合、**変更は不要です**。
- ネイティブ app-server 実行を意図していた場合は、モデルを `openai/<model>` に変更し、`agentRuntime.id: "codex"` を設定してください。
- セッションランタイムピンは固定されるため、ランタイム変更後も既存セッションには `/new` または `/reset` が必要です。

ハーネス選択はライブセッション制御ではありません。埋め込みターンが実行されると、OpenClaw は選択されたハーネス ID をそのセッションに記録し、同じセッション ID の後続ターンでもそれを使用し続けます。将来のセッションで別のハーネスを使いたい場合は、`agentRuntime` 設定または `OPENCLAW_AGENT_RUNTIME` を変更してください。既存の会話を PI と Codex の間で切り替える前には、`/new` または `/reset` を使用して新しいセッションを開始してください。これにより、1 つのトランスクリプトを互換性のない 2 つのネイティブセッションシステムで再生することを避けられます。

ハーネスピン導入前に作成されたレガシーセッションは、トランスクリプト履歴があると PI ピン済みとして扱われます。設定を変更した後、その会話を Codex に参加させるには `/new` または `/reset` を使用してください。

`/status` は有効なモデルランタイムを表示します。デフォルトの PI ハーネスは `Runtime: OpenClaw Pi Default` と表示され、Codex app-server ハーネスは `Runtime: OpenAI Codex` と表示されます。

## 要件

- 同梱の `codex` Plugin が利用可能な OpenClaw。
- Codex app-server `0.125.0` 以降。同梱 Plugin はデフォルトで互換性のある Codex app-server バイナリを管理するため、`PATH` 上のローカル `codex` コマンドは通常のハーネス起動に影響しません。
- app-server プロセス、または OpenClaw の Codex 認証ブリッジで利用可能な Codex 認証。ローカルの app-server 起動は、各エージェント用の OpenClaw 管理 Codex ホームと分離された子 `HOME` を使用するため、デフォルトでは個人の `~/.codex` アカウント、Skills、Plugin、設定、スレッド状態、またはネイティブ `$HOME/.agents/skills` を読み取りません。

Plugin は、古い、またはバージョンなしの app-server ハンドシェイクをブロックします。これにより、OpenClaw はテスト済みのプロトコルサーフェス上に維持されます。

ライブおよび Docker スモークテストでは、認証は通常 Codex CLI アカウント、または OpenClaw の `openai-codex` 認証プロファイルから取得されます。ローカル stdio app-server 起動では、アカウントが存在しない場合に `CODEX_API_KEY` / `OPENAI_API_KEY` にフォールバックすることもできます。

## 最小設定

`openai/gpt-5.5` を使用し、同梱 Plugin を有効にして、`codex` ハーネスを強制します。

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
      },
    },
  },
}
```

設定で `plugins.allow` を使用している場合は、そこにも `codex` を含めてください。

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

`agents.defaults.model` またはエージェントモデルを `codex/<model>` に設定するレガシー設定では、引き続き同梱の `codex` Plugin が自動的に有効になります。新しい設定では、上記の明示的な `agentRuntime` エントリと組み合わせて `openai/<model>` を使用することを推奨します。

## Codex を他のモデルと併用する

同じエージェントが Codex と非 Codex プロバイダーモデルの間を自由に切り替える必要がある場合は、`agentRuntime.id: "codex"` をグローバルに設定しないでください。強制されたランタイムは、そのエージェントまたはセッションのすべての埋め込みターンに適用されます。そのランタイムが強制されている状態で Anthropic モデルを選択すると、OpenClaw は引き続き Codex ハーネスを試行し、そのターンを PI 経由で黙ってルーティングするのではなく、クローズドに失敗します。

代わりに、次のいずれかの形を使用してください。

- `agentRuntime.id: "codex"` を設定した専用エージェントに Codex を置く。
- 通常の混在プロバイダー利用では、デフォルトエージェントを `agentRuntime.id: "auto"` と PI フォールバックのままにする。
- レガシーの `codex/*` 参照は互換性のためだけに使用する。新しい設定では、`openai/*` と明示的な Codex ランタイムポリシーを優先する。

たとえば、これはデフォルトエージェントを通常の自動選択のままにし、別の Codex エージェントを追加します。

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

- デフォルトの `main` エージェントは、通常のプロバイダーパスと PI 互換フォールバックを使用します。
- `codex` エージェントは Codex app-server ハーネスを使用します。
- `codex` エージェントで Codex が見つからない、またはサポートされていない場合、そのターンは PI を静かに使うのではなく失敗します。

## エージェントコマンドのルーティング

エージェントは「Codex」という単語だけではなく、意図に基づいてユーザーリクエストをルーティングする必要があります。

| ユーザーの依頼...                                         | エージェントが使用すべきもの...                              |
| -------------------------------------------------------- | ------------------------------------------------ |
| 「このチャットを Codex にバインドして」                                | `/codex bind`                                    |
| 「Codex スレッド `<id>` をここで再開して」                        | `/codex resume <id>`                             |
| 「Codex スレッドを表示して」                                     | `/codex threads`                                 |
| 「問題のある Codex 実行についてサポートレポートを提出して」              | `/diagnostics [note]`                            |
| 「この添付スレッドについてのみ Codex フィードバックを送信して」      | `/codex diagnostics [note]`                      |
| 「このエージェントのランタイムとして Codex を使用して」                | `agentRuntime.id` への設定変更               |
| 「通常の OpenClaw で自分の ChatGPT/Codex サブスクリプションを使って」 | `openai-codex/*` モデル参照                      |
| 「ACP/acpx 経由で Codex を実行して」                             | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「スレッド内で Claude Code/Gemini/OpenCode/Cursor を開始して」   | `/codex` やネイティブサブエージェントではなく ACP/acpx |

OpenClaw は、ACP が有効で、ディスパッチ可能で、読み込まれたランタイムバックエンドに支えられている場合にのみ、エージェントへ ACP spawn ガイダンスを提示します。ACP が利用できない場合、システムプロンプトと Plugin Skills はエージェントに ACP ルーティングを教えるべきではありません。

## Codex 専用デプロイ

すべての埋め込みエージェントターンが Codex を使用することを証明する必要がある場合は、Codex ハーネスを強制します。明示的な Plugin ランタイムはデフォルトで PI フォールバックなしになるため、`fallback: "none"` は任意ですが、ドキュメントとして有用なことがよくあります。

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

Codex が強制されている場合、OpenClaw は Codex Plugin が無効、app-server が古すぎる、または app-server を起動できない場合に早期に失敗します。ハーネス選択が見つからない場合に PI で処理させたいことを意図している場合にのみ、`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` を設定してください。

## エージェントごとの Codex

デフォルトエージェントは通常の自動選択を維持したまま、1 つのエージェントを Codex 専用にできます。

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

エージェントとモデルの切り替えには通常のセッションコマンドを使用します。`/new` は新しい OpenClaw セッションを作成し、Codex ハーネスは必要に応じてサイドカー app-server スレッドを作成または再開します。`/reset` はそのスレッドの OpenClaw セッションバインディングをクリアし、次のターンで現在の設定からハーネスを再解決できるようにします。

## モデル検出

デフォルトでは、Codex Plugin は利用可能なモデルを app-server に問い合わせます。検出に失敗するかタイムアウトした場合、次のバンドル済みフォールバックカタログを使用します。

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

起動時に Codex のプローブを避け、フォールバックカタログに固定したい場合は検出を無効にします。

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

## app-server の接続とポリシー

デフォルトでは、Plugin は OpenClaw の管理対象 Codex バイナリをローカルで次のように起動します。

```bash
codex app-server --listen stdio://
```

管理対象バイナリは、バンドル済み Plugin ランタイム依存関係として宣言され、残りの `codex` Plugin 依存関係とともにステージングされます。これにより、app-server のバージョンは、ローカルにインストールされている別の Codex CLI ではなく、バンドル済み Plugin に紐付けられます。別の実行可能ファイルを意図的に実行したい場合にのみ、`appServer.command` を設定してください。

デフォルトでは、OpenClaw はローカル Codex ハーネスセッションを YOLO モードで開始します。`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および `sandbox: "danger-full-access"` です。これは自律的な Heartbeat に使用される、信頼されたローカルオペレーターの姿勢です。Codex は、応答する人がいないネイティブ承認プロンプトで停止せずに、シェルとネットワークツールを使用できます。

Codex のガーディアンレビュー付き承認を有効にするには、`appServer.mode:
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

Guardian モードは Codex のネイティブ自動レビュー承認パスを使用します。Codex が sandbox を離れる、ワークスペース外に書き込む、またはネットワークアクセスなどの権限を追加するよう求める場合、Codex はその承認リクエストを人間のプロンプトではなくネイティブレビュアーへルーティングします。レビュアーは Codex のリスクフレームワークを適用し、特定のリクエストを承認または拒否します。YOLO モードより多くのガードレールが欲しいが、無人エージェントを進行させる必要がある場合は Guardian を使用してください。

`guardian` プリセットは、`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。個々のポリシーフィールドは引き続き `mode` を上書きするため、高度なデプロイではプリセットと明示的な選択を組み合わせることができます。古い `guardian_subagent` レビュアー値は互換エイリアスとして引き続き受け付けられますが、新しい設定では `auto_review` を使用する必要があります。

すでに実行中の app-server には、WebSocket トランスポートを使用します。

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

Stdio app-server の起動はデフォルトで OpenClaw のプロセス環境を継承しますが、OpenClaw は Codex app-server アカウントブリッジを所有し、`CODEX_HOME` と `HOME` の両方を、そのエージェントの OpenClaw 状態配下にあるエージェントごとのディレクトリに設定します。Codex 独自の skill ローダーは `$CODEX_HOME/skills` と `$HOME/.agents/skills` を読み取るため、ローカル app-server 起動では両方の値が分離されます。これにより、Codex ネイティブの Skills、Plugin、設定、アカウント、スレッド状態は、オペレーター個人の Codex CLI ホームから漏れ込むのではなく、OpenClaw エージェントにスコープされます。

OpenClaw Plugin と OpenClaw skill スナップショットは、引き続き OpenClaw 独自の Plugin レジストリと skill ローダーを通ります。個人の Codex CLI アセットは通りません。OpenClaw エージェントの一部にすべき有用な Codex CLI Skills や Plugin がある場合は、明示的に棚卸ししてください。

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex 移行プロバイダーは Skills を現在の OpenClaw エージェントワークスペースへコピーします。Codex ネイティブの Plugin、フック、設定ファイルは、コマンドを実行したり、MCP サーバーを公開したり、資格情報を含んだりする可能性があるため、自動的に有効化されるのではなく、手動レビュー用に報告またはアーカイブされます。

認証は次の順序で選択されます。

1. エージェント用の明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex ホーム内にある app-server の既存アカウント。
3. ローカル stdio app-server 起動のみで、app-server アカウントが存在せず OpenAI 認証が引き続き必要な場合、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、spawn される Codex 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーを埋め込みや直接の OpenAI モデルで利用可能にしたまま、ネイティブ Codex app-server ターンが誤って API 経由で課金されることを防ぎます。明示的な Codex API キープロファイルとローカル stdio 環境キーのフォールバックは、継承された子プロセス環境ではなく app-server ログインを使用します。WebSocket app-server 接続は Gateway 環境 API キーフォールバックを受け取りません。明示的な認証プロファイルまたはリモート app-server 独自のアカウントを使用してください。

デプロイで追加の環境分離が必要な場合は、それらの変数を `appServer.clearEnv` に追加します。

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

サポートされている `appServer` フィールド:

| フィールド          | デフォルト                               | 意味                                                                                                                                                                                                                                          |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` は Codex を起動します。`"websocket"` は `url` に接続します。                                                                                                                                                                        |
| `command`           | 管理対象の Codex バイナリ                | stdio トランスポート用の実行ファイル。管理対象バイナリを使う場合は未設定のままにします。明示的に上書きする場合にのみ設定してください。                                                                                                      |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio トランスポート用の引数。                                                                                                                                                                                                                |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                                                    |
| `authToken`         | 未設定                                   | WebSocket トランスポート用の Bearer トークン。                                                                                                                                                                                                |
| `headers`           | `{}`                                     | 追加の WebSocket ヘッダー。                                                                                                                                                                                                                   |
| `clearEnv`          | `[]`                                     | OpenClaw が継承環境を構築したあと、起動された stdio app-server プロセスから削除される追加の環境変数名。`CODEX_HOME` と `HOME` は、ローカル起動時の OpenClaw のエージェントごとの Codex 分離用に予約されています。 |
| `requestTimeoutMs`  | `60000`                                  | app-server コントロールプレーン呼び出しのタイムアウト。                                                                                                                                                                                       |
| `mode`              | `"yolo"`                                 | YOLO または guardian レビュー付き実行のプリセット。                                                                                                                                                                                          |
| `approvalPolicy`    | `"never"`                                | スレッドの開始、再開、ターンに送信されるネイティブ Codex 承認ポリシー。                                                                                                                                                                      |
| `sandbox`           | `"danger-full-access"`                   | スレッドの開始、再開に送信されるネイティブ Codex サンドボックスモード。                                                                                                                                                                      |
| `approvalsReviewer` | `"user"`                                 | Codex にネイティブ承認プロンプトをレビューさせるには `"auto_review"` を使います。`guardian_subagent` は従来のエイリアスとして残っています。                                                                                                  |
| `serviceTier`       | 未設定                                   | 任意の Codex app-server サービスティア: `"fast"`、`"flex"`、または `null`。無効な従来の値は無視されます。                                                                                                                                     |

OpenClaw が所有する動的ツール呼び出しは、`appServer.requestTimeoutMs` とは
独立して制限されます。各 Codex `item/tool/call` リクエストは、30 秒以内に
OpenClaw のレスポンスを受け取る必要があります。タイムアウト時、OpenClaw は対応している場合にツール
シグナルを中止し、失敗した動的ツールレスポンスを Codex に返すため、
セッションを `processing` のまま残す代わりにターンを続行できます。

OpenClaw が Codex のターンスコープ app-server リクエストに応答したあと、ハーネスは
Codex がネイティブターンを `turn/completed` で完了することも期待します。その
応答後に app-server が 60 秒間無応答になった場合、OpenClaw はベストエフォートで
Codex ターンに割り込み、診断タイムアウトを記録し、
OpenClaw セッションレーンを解放して、後続のチャットメッセージが古い
ネイティブターンの背後にキューされないようにします。

ローカルテストでは環境による上書きが引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` は、`appServer.command` が未設定の場合に
管理対象バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使うか、
一回限りのローカルテストでは `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使います。繰り返し可能なデプロイでは、
Codex ハーネス設定の他の部分と同じレビュー済みファイルに Plugin の動作を保持できるため、
設定を使うことが推奨されます。

## コンピューター使用

Computer Use は専用のセットアップガイドで扱います:
[Codex Computer Use](/ja-JP/plugins/codex-computer-use)。

短く言えば、OpenClaw はデスクトップ制御アプリをベンダー提供せず、デスクトップ操作も
自ら実行しません。OpenClaw は Codex app-server を準備し、
`computer-use` MCP サーバーが利用可能であることを検証してから、Codex モードのターン中に
ネイティブ MCP ツール呼び出しを Codex に処理させます。

Codex marketplace フロー外で TryCua ドライバーに直接アクセスするには、
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` で
`cua-driver mcp` を登録します。Codex が所有する Computer Use と直接 MCP 登録の違いについては、
[Codex Computer Use](/ja-JP/plugins/codex-computer-use) を参照してください。

最小設定:

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

セットアップはコマンド面から確認またはインストールできます。

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use は macOS 固有で、Codex MCP サーバーがアプリを制御できるようになる前に
ローカル OS 権限が必要になる場合があります。`computerUse.enabled` が true で MCP
サーバーが利用できない場合、Codex モードのターンは、ネイティブ Computer Use ツールなしで
黙って実行されるのではなく、スレッド開始前に失敗します。marketplace の選択肢、
リモートカタログの制限、ステータス理由、トラブルシューティングについては
[Codex Computer Use](/ja-JP/plugins/codex-computer-use) を参照してください。

`computerUse.autoInstall` が true の場合、Codex がまだローカル marketplace を検出していなければ、
OpenClaw は
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` から標準の
バンドル済み Codex Desktop marketplace を登録できます。ランタイムまたは Computer Use 設定を変更したあとは、
既存のセッションが古い PI または Codex スレッドバインディングを保持しないように、
`/new` または `/reset` を使います。

## 一般的なレシピ

デフォルトの stdio トランスポートを使うローカル Codex:

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

明示的なヘッダーを持つリモート app-server:

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

モデル切り替えは OpenClaw が制御したままです。OpenClaw セッションが
既存の Codex スレッドにアタッチされている場合、次のターンは現在選択されている
OpenAI モデル、プロバイダー、承認ポリシー、サンドボックス、サービスティアを
app-server に再送信します。`openai/gpt-5.5` から `openai/gpt-5.2` に切り替えると、
スレッドバインディングは保持されますが、新しく選択されたモデルで続行するよう Codex に要求します。

## Codex コマンド

バンドルされた Plugin は、`/codex` を承認済みスラッシュコマンドとして登録します。これは
汎用であり、OpenClaw テキストコマンドに対応する任意のチャンネルで動作します。

一般的な形式:

- `/codex status` は、ライブ app-server 接続性、モデル、アカウント、レート制限、MCP サーバー、Skills を表示します。
- `/codex models` は、ライブ Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex スレッドにアタッチします。
- `/codex compact` は、アタッチされたスレッドを compact するよう Codex app-server に依頼します。
- `/codex review` は、アタッチされたスレッドの Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、アタッチされたスレッドの Codex 診断フィードバックを送信する前に確認します。
- `/codex computer-use status` は、設定済みの Computer Use Plugin と MCP サーバーを確認します。
- `/codex computer-use install` は、設定済みの Computer Use Plugin をインストールし、MCP サーバーをリロードします。
- `/codex account` は、アカウントとレート制限のステータスを表示します。
- `/codex mcp` は、Codex app-server MCP サーバーのステータスを一覧表示します。
- `/codex skills` は、Codex app-server skills を一覧表示します。

### 一般的なデバッグワークフロー

Codex ベースのエージェントが Telegram、Discord、Slack、
または別のチャンネルで予想外の動作をした場合は、問題が発生した会話から開始します。

1. 見た内容を説明する `/diagnostics bad tool choice after image upload` または別の短いメモを実行します。
2. 診断リクエストを一度承認します。この承認によりローカル Gateway
   診断 zip が作成され、セッションが Codex ハーネスを使用しているため、
   関連する Codex フィードバックバンドルも OpenAI サーバーに送信されます。
3. 完了した診断返信をバグレポートまたはサポートスレッドにコピーします。
   そこには、ローカルバンドルパス、プライバシー概要、OpenClaw セッション ID、
   Codex スレッド ID、および各 Codex スレッドの `Inspect locally` 行が含まれます。
4. 自分で実行をデバッグしたい場合は、表示された `Inspect locally`
   コマンドをターミナルで実行します。これは `codex resume <thread-id>` のような形で、
   ネイティブ Codex スレッドを開くため、会話を調査したり、ローカルで続行したり、
   Codex が特定のツールや計画を選んだ理由を Codex に尋ねたりできます。

`/codex diagnostics [note]` は、OpenClaw Gateway 診断バンドル全体なしで、現在アタッチされているスレッドの Codex フィードバックアップロードだけを明示的に必要とする場合にのみ使用します。ほとんどのサポートレポートでは、`/diagnostics [note]` のほうが適切な開始点です。これは、ローカル Gateway の状態と Codex スレッド ID を 1 つの返信で結び付けるためです。完全なプライバシーモデルとグループチャットの動作については、[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

Core OpenClaw は、一般的な Gateway 診断コマンドとして、オーナー専用の `/diagnostics [note]` も公開しています。その承認プロンプトには機微データに関する前文が表示され、[診断エクスポート](/ja-JP/gateway/diagnostics)へのリンクがあり、毎回、明示的な exec 承認を通じて `openclaw gateway diagnostics export --json` を要求します。allow-all ルールで診断を承認しないでください。承認後、OpenClaw はローカルバンドルパスとマニフェスト概要を含む貼り付け可能なレポートを送信します。アクティブな OpenClaw セッションが Codex ハーネスを使用している場合、同じ承認により、関連する Codex フィードバックバンドルを OpenAI サーバーへ送信することも許可されます。承認プロンプトには Codex フィードバックが送信されることが記載されますが、承認前に Codex セッション ID やスレッド ID は表示されません。

グループチャットでオーナーが `/diagnostics` を呼び出した場合、OpenClaw は共有チャンネルをクリーンに保ちます。グループには短い通知だけが届き、診断の前文、承認プロンプト、Codex セッション/スレッド ID はプライベート承認ルートを通じてオーナーに送信されます。プライベートなオーナールートがない場合、OpenClaw はグループでの要求を拒否し、DM から実行するようオーナーに求めます。

承認された Codex アップロードは、Codex app-server の `feedback/upload` を呼び出し、一覧に含まれる各スレッドと、利用可能な場合は生成された Codex サブスレッドのログを含めるよう app-server に要求します。アップロードは Codex の通常のフィードバック経路を通じて OpenAI サーバーへ送信されます。その app-server で Codex フィードバックが無効になっている場合、コマンドは app-server エラーを返します。完了した診断返信には、送信されたスレッドについて、チャンネル、OpenClaw セッション ID、Codex スレッド ID、ローカルの `codex resume <thread-id>` コマンドが一覧表示されます。承認を拒否または無視した場合、OpenClaw はそれらの Codex ID を出力しません。このアップロードは、ローカル Gateway 診断エクスポートの代替ではありません。

`/codex resume` は、通常のターンでハーネスが使用するものと同じサイドカー束縛ファイルを書き込みます。次のメッセージで、OpenClaw はその Codex スレッドを再開し、現在選択されている OpenClaw モデルを app-server に渡し、拡張履歴を有効に保ちます。

### CLI から Codex スレッドを調査する

問題のある Codex 実行を理解する最速の方法は、多くの場合、ネイティブの Codex スレッドを直接開くことです。

```sh
codex resume <thread-id>
```

チャンネル会話でバグに気付き、問題のある Codex セッションを調査したい場合、ローカルで続行したい場合、または特定のツールや推論の選択をした理由を Codex に尋ねたい場合に使用します。通常、最も簡単な手順は、先に `/diagnostics [note]` を実行することです。承認後、完了したレポートには各 Codex スレッドが一覧表示され、たとえば `codex resume <thread-id>` のような `Inspect locally` コマンドが出力されます。そのコマンドをそのままターミナルにコピーできます。

現在のチャットについては `/codex binding` から、最近の Codex app-server スレッドについては `/codex threads [filter]` からスレッド ID を取得し、シェルで同じ `codex resume` コマンドを実行することもできます。

このコマンドサーフェスには Codex app-server `0.125.0` 以降が必要です。将来の app-server またはカスタム app-server がその JSON-RPC メソッドを公開していない場合、個々の制御メソッドは `unsupported by this Codex app-server` と報告されます。

## フック境界

Codex ハーネスには 3 つのフック層があります。

| 層                                    | オーナー                 | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin フック                | OpenClaw                 | PI と Codex ハーネス全体での製品/Plugin 互換性。                   |
| Codex app-server 拡張ミドルウェア     | OpenClaw バンドル Plugin | OpenClaw 動的ツール周辺のターンごとのアダプター動作。              |
| Codex ネイティブフック                | Codex                    | Codex 設定からの低レベル Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、OpenClaw Plugin の動作をルーティングするために、プロジェクトまたはグローバルの Codex `hooks.json` ファイルを使用しません。サポートされるネイティブツールと権限ブリッジについて、OpenClaw は `PreToolUse`、`PostToolUse`、`PermissionRequest`、`Stop` 用に、スレッドごとの Codex 設定を注入します。`SessionStart` や `UserPromptSubmit` などの他の Codex フックは Codex レベルの制御のままです。これらは v1 契約では OpenClaw Plugin フックとして公開されません。

OpenClaw 動的ツールでは、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、OpenClaw は自分が所有する Plugin とミドルウェアの動作をハーネスアダプター内で発火します。Codex ネイティブツールでは、Codex が正規のツールレコードを所有します。OpenClaw は選択されたイベントをミラーできますが、Codex が app-server またはネイティブフックコールバックを通じてその操作を公開しない限り、ネイティブ Codex スレッドを書き換えることはできません。

Compaction と LLM ライフサイクル投影は、ネイティブ Codex フックコマンドではなく、Codex app-server 通知と OpenClaw アダプター状態から得られます。OpenClaw の `before_compaction`、`after_compaction`、`llm_input`、`llm_output` イベントはアダプターレベルの観測であり、Codex の内部リクエストや Compaction ペイロードをバイト単位で取得したものではありません。

Codex ネイティブの `hook/started` および `hook/completed` app-server 通知は、軌跡とデバッグ用に `codex_app_server.hook` エージェントイベントとして投影されます。これらは OpenClaw Plugin フックを呼び出しません。

## V1 サポート契約

Codex モードは、下層のモデル呼び出しだけが異なる PI ではありません。Codex はネイティブモデルループのより多くを所有し、OpenClaw はその境界に合わせて Plugin とセッションのサーフェスを適応させます。

Codex runtime v1 でサポートされるもの:

| サーフェス                                    | サポート                                | 理由                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex 経由の OpenAI モデルループ              | サポート                                | Codex app-server が OpenAI ターン、ネイティブスレッド再開、ネイティブツール継続を所有します。                                                                                                        |
| OpenClaw チャンネルルーティングと配信         | サポート                                | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャンネルはモデル runtime の外側に残ります。                                                                                                  |
| OpenClaw 動的ツール                           | サポート                                | Codex は OpenClaw にこれらのツールの実行を依頼するため、OpenClaw は実行経路内に残ります。                                                                                                            |
| プロンプトとコンテキスト Plugin               | サポート                                | OpenClaw はプロンプトオーバーレイを構築し、スレッドの開始または再開前にコンテキストを Codex ターンへ投影します。                                                                                    |
| コンテキストエンジンライフサイクル            | サポート                                | Codex ターンでは、組み立て、取り込みまたはターン後メンテナンス、コンテキストエンジン Compaction 調整が実行されます。                                                                                |
| 動的ツールフック                              | サポート                                | `before_tool_call`、`after_tool_call`、ツール結果ミドルウェアは、OpenClaw 所有の動的ツールの周辺で実行されます。                                                                                     |
| ライフサイクルフック                          | アダプター観測としてサポート            | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は、正直な Codex モードペイロードで発火します。                                                                       |
| 最終回答修正ゲート                            | ネイティブフックリレーを通じてサポート  | Codex `Stop` は `before_agent_finalize` にリレーされます。`revise` は最終化前にもう 1 回のモデルパスを Codex に要求します。                                                                          |
| ネイティブシェル、パッチ、MCP のブロックまたは観測 | ネイティブフックリレーを通じてサポート  | Codex `PreToolUse` と `PostToolUse` は、Codex app-server `0.125.0` 以降での MCP ペイロードを含め、確定済みのネイティブツールサーフェスに対してリレーされます。ブロックはサポートされますが、引数の書き換えはサポートされません。 |
| ネイティブ権限ポリシー                        | ネイティブフックリレーを通じてサポート  | Codex `PermissionRequest` は、runtime が公開している場合、OpenClaw ポリシーを通じてルーティングできます。OpenClaw が決定を返さない場合、Codex は通常の guardian またはユーザー承認経路を通じて続行します。 |
| App-server 軌跡キャプチャ                     | サポート                                | OpenClaw は app-server に送信したリクエストと、受信した app-server 通知を記録します。                                                                                                                |

Codex runtime v1 でサポートされないもの:

| サーフェス                                             | V1 境界                                                                                                                                     | 将来のパス                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ネイティブツール引数の変更                       | Codex ネイティブのツール前フックはブロックできるが、OpenClaw は Codex ネイティブのツール引数を書き換えない。                                               | 置換用ツール入力には Codex のフック/スキーマサポートが必要。                            |
| 編集可能な Codex ネイティブのトランスクリプト履歴            | Codex が正規のネイティブスレッド履歴を所有する。OpenClaw はミラーを所有し、将来のコンテキストを投影できるが、サポートされていない内部状態を変更すべきではない。 | ネイティブスレッドの手術が必要な場合は、明示的な Codex app-server API を追加する。                    |
| Codex ネイティブツールレコード向けの `tool_result_persist` | そのフックは OpenClaw が所有するトランスクリプト書き込みを変換するものであり、Codex ネイティブのツールレコードを変換するものではない。                                                           | 変換済みレコードをミラーできる可能性はあるが、正規の書き換えには Codex のサポートが必要。              |
| リッチなネイティブ Compaction メタデータ                     | OpenClaw は Compaction の開始と完了を観測するが、安定した保持/破棄リスト、トークン差分、または要約ペイロードは受け取らない。            | よりリッチな Codex Compaction イベントが必要。                                                     |
| Compaction 介入                             | 現在の OpenClaw Compaction フックは Codex モードでは通知レベル。                                                                         | Plugin がネイティブ Compaction を拒否または書き換える必要がある場合は、Codex の Compaction 前後フックを追加する。 |
| バイト単位で同一のモデル API リクエストキャプチャ             | OpenClaw は app-server のリクエストと通知をキャプチャできるが、Codex コアは最終的な OpenAI API リクエストを内部で構築する。                      | Codex のモデルリクエストトレースイベントまたはデバッグ API が必要。                                   |

## ツール、メディア、Compaction

Codex ハーネスは、低レベルの組み込みエージェント実行器のみを変更する。

OpenClaw は引き続きツールリストを構築し、ハーネスから動的ツール結果を受け取る。テキスト、画像、動画、音楽、TTS、承認、メッセージングツールの出力は、通常の OpenClaw 配信パスを通り続ける。

ネイティブフックリレーは意図的に汎用的だが、v1 のサポート契約は OpenClaw がテストする Codex ネイティブのツールと権限のパスに限定される。Codex ランタイムでは、これに shell、patch、MCP の `PreToolUse`、`PostToolUse`、`PermissionRequest` ペイロードが含まれる。ランタイム契約で名前が示されるまでは、将来のすべての Codex フックイベントが OpenClaw Plugin サーフェスであると想定しないこと。

`PermissionRequest` について、OpenClaw はポリシーが判断した場合にのみ明示的な許可または拒否の決定を返す。決定なしの結果は許可ではない。Codex はそれをフック決定なしとして扱い、独自のガーディアンまたはユーザー承認パスへフォールスルーする。

Codex MCP ツール承認の elicitation は、Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` としてマークした場合、OpenClaw の Plugin 承認フローを通じてルーティングされる。Codex の `request_user_input` プロンプトは元のチャットへ送り返され、次にキューされたフォローアップメッセージは、追加コンテキストとしてステアリングされる代わりに、そのネイティブサーバーリクエストに回答する。他の MCP elicitation リクエストは引き続き fail closed する。

アクティブ実行キューステアリングは Codex app-server の `turn/steer` に対応する。デフォルトの `messages.queue.mode: "steer"` では、OpenClaw は設定された静音ウィンドウの間、キューされたチャットメッセージをまとめ、到着順に 1 つの `turn/steer` リクエストとして送信する。レガシーの `queue` モードは個別の `turn/steer` リクエストを送信する。Codex レビューと手動 Compaction ターンは同一ターンのステアリングを拒否する場合があり、その場合 OpenClaw は選択されたモードでフォールバックが許可されているときにフォローアップキューを使用する。[ステアリングキュー](/ja-JP/concepts/queue-steering)を参照。

選択したモデルが Codex ハーネスを使用する場合、ネイティブスレッド Compaction は Codex app-server に委任される。OpenClaw はチャンネル履歴、検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのためにトランスクリプトミラーを保持する。ミラーには、ユーザープロンプト、最終アシスタントテキスト、および app-server が出力する場合の軽量な Codex 推論または計画レコードが含まれる。現在、OpenClaw はネイティブ Compaction の開始と完了シグナルのみを記録する。Codex が Compaction 後に保持したエントリーについて、人間が読める Compaction 要約や監査可能なリストはまだ公開していない。

Codex が正規のネイティブスレッドを所有するため、`tool_result_persist` は現在、Codex ネイティブのツール結果レコードを書き換えない。これは OpenClaw が所有するセッショントランスクリプトのツール結果を OpenClaw が書き込む場合にのみ適用される。

メディア生成に PI は不要。画像、動画、音楽、PDF、TTS、メディア理解は、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts` など、対応するプロバイダー/モデル設定を引き続き使用する。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** 新しい設定では想定どおり。`agentRuntime.id: "codex"` を指定した `openai/gpt-*` モデル（またはレガシーの `codex/*` ref）を選択し、`plugins.entries.codex.enabled` を有効にし、`plugins.allow` が `codex` を除外していないか確認する。

**OpenClaw が Codex ではなく PI を使用する:** `agentRuntime.id: "auto"` は、Codex ハーネスが実行を要求しない場合、互換性バックエンドとして引き続き PI を使用できる。テスト中に Codex 選択を強制するには `agentRuntime.id: "codex"` を設定する。強制された Codex ランタイムは、`agentRuntime.fallback: "pi"` を明示的に設定しない限り、PI へフォールバックせず失敗するようになった。Codex app-server が選択されると、その失敗は追加のフォールバック設定なしで直接表面化する。

**app-server が拒否される:** app-server ハンドシェイクがバージョン `0.125.0` 以降を報告するように Codex をアップグレードする。同一バージョンのプレリリースや、`0.125.0-alpha.2` または `0.125.0+custom` のようなビルドサフィックス付きバージョンは拒否される。OpenClaw がテストする安定版のプロトコル下限が `0.125.0` だからである。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にする。

**WebSocket トランスポートが即座に失敗する:** `appServer.url`、`authToken`、およびリモート app-server が同じ Codex app-server プロトコルバージョンを話していることを確認する。

**Codex 以外のモデルが PI を使用する:** そのエージェントに対して `agentRuntime.id: "codex"` を強制した場合、またはレガシーの `codex/*` ref を選択した場合を除き、これは想定どおり。通常の `openai/gpt-*` とその他のプロバイダー ref は、`auto` モードでは通常のプロバイダーパスに留まる。`agentRuntime.id: "codex"` を強制する場合、そのエージェントのすべての組み込みターンは Codex がサポートする OpenAI モデルでなければならない。

**Computer Use はインストールされているがツールが実行されない:** 新しいセッションから `/codex computer-use status` を確認する。ツールが `Native hook relay unavailable` を報告する場合は `/new` または `/reset` を使用する。継続する場合は、古いネイティブフック登録をクリアするために Gateway を再起動する。`computer-use.list_apps` がタイムアウトする場合は、Codex Computer Use または Codex Desktop を再起動して再試行する。

## 関連

- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [ステータス](/ja-JP/cli/status)
- [Plugin フック](/ja-JP/plugins/hooks)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
