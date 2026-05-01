---
read_when:
    - 同梱の Codex app-server ハーネスを使用したい場合
    - Codex ハーネス設定例が必要です
    - Codex のみのデプロイでは、PI にフォールバックするのではなく失敗するようにしたい
summary: 同梱の Codex app-server ハーネスを介して OpenClaw の組み込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-05-01T05:02:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740e8fa9e6f4a737dfd250fe26b85865a7f7e40839b41e879e9224a45cbe8d72
    source_path: plugins/codex-harness.md
    workflow: 16
---

バンドルされた `codex` Plugin により、OpenClaw は組み込み PI ハーネスの代わりに Codex app-server を通じて埋め込みエージェントターンを実行できます。

低レベルのエージェントセッションを Codex に所有させたい場合に使います。モデル検出、ネイティブスレッドの再開、ネイティブ Compaction、app-server 実行が対象です。OpenClaw は引き続き、チャットチャネル、セッションファイル、モデル選択、ツール、承認、メディア配信、表示されるトランスクリプトのミラーを所有します。

方向性を把握したい場合は、[エージェントランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。短く言うと、`openai/gpt-5.5` がモデル参照、`codex` がランタイムであり、Telegram、Discord、Slack、または別のチャネルが通信面のままです。

## クイック設定

GPT エージェントターンに Codex ハーネスを使うには、モデル参照を `openai/gpt-*` として正規のままにし、バンドルされた `codex` Plugin を有効にして、`agentRuntime.id: "codex"` を設定します。

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

設定で `plugins.allow` を使っている場合は、そこにも `codex` を含めてください。

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

このパスでは `openai-codex/gpt-*` を使わないでください。ランタイムを別途強制しない限り、これは通常の PI ランナーを通じた Codex OAuth を選択します。設定変更は新規またはリセットされたセッションに適用されます。既存セッションは記録済みのランタイムを保持します。

## この Plugin が変更する内容

バンドルされた `codex` Plugin は、複数の独立した機能を提供します。

| 機能                              | 使い方                                              | 内容                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| ネイティブ埋め込みランタイム      | `agentRuntime.id: "codex"`                          | OpenClaw の埋め込みエージェントターンを Codex app-server 経由で実行します。  |
| ネイティブチャット制御コマンド    | `/codex bind`, `/codex resume`, `/codex steer`, ... | メッセージング会話から Codex app-server スレッドをバインドして制御します。    |
| Codex app-server プロバイダー/カタログ | `codex` 内部、ハーネス経由で公開                    | ランタイムが app-server モデルを検出して検証できるようにします。             |
| Codex メディア理解パス            | `codex/*` 画像モデル互換パス                        | 対応する画像理解モデル向けに、境界付き Codex app-server ターンを実行します。 |
| ネイティブフックリレー            | Codex ネイティブイベント周辺の Plugin フック        | OpenClaw が対応する Codex ネイティブのツール/終了イベントを観測またはブロックできるようにします。 |

Plugin を有効にすると、これらの機能が利用可能になります。これは次のことを**しません**。

- すべての OpenAI モデルで Codex を使い始める
- `openai-codex/*` モデル参照をネイティブランタイムに変換する
- ACP/acpx をデフォルトの Codex パスにする
- すでに PI ランタイムを記録した既存セッションをホットスイッチする
- OpenClaw のチャネル配信、セッションファイル、認証プロファイル保存、メッセージルーティングを置き換える

同じ Plugin は、ネイティブな `/codex` チャット制御コマンド面も所有します。Plugin が有効で、ユーザーがチャットから Codex スレッドのバインド、再開、誘導、停止、または検査を求めた場合、エージェントは ACP よりも `/codex ...` を優先するべきです。ユーザーが ACP/acpx を求めた場合、または ACP Codex アダプターをテストしている場合、ACP は明示的なフォールバックのままです。

ネイティブ Codex ターンは、公開互換レイヤーとして OpenClaw Plugin フックを保持します。これらはインプロセスの OpenClaw フックであり、Codex `hooks.json` コマンドフックではありません。

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write`（ミラーされたトランスクリプトレコード用）
- Codex `Stop` リレーを通じた `before_agent_finalize`
- `agent_end`

Plugin は、ランタイム非依存のツール結果ミドルウェアも登録できます。これは、OpenClaw がツールを実行した後、結果が Codex に返される前に、OpenClaw の動的ツール結果を書き換えるためのものです。これは、OpenClaw が所有するトランスクリプトのツール結果書き込みを変換する公開 `tool_result_persist` Plugin フックとは別です。

Plugin フック自体のセマンティクスについては、[Plugin フック](/ja-JP/plugins/hooks) と [Plugin ガード動作](/ja-JP/tools/plugin) を参照してください。

ハーネスはデフォルトで無効です。新しい設定では、OpenAI モデル参照を `openai/gpt-*` として正規のままにし、ネイティブ app-server 実行が必要な場合に `agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex` を明示的に強制するべきです。互換性のため、レガシー `codex/*` モデル参照は引き続きハーネスを自動選択しますが、ランタイムに支えられたレガシープロバイダープレフィックスは通常のモデル/プロバイダー選択肢としては表示されません。

`codex` Plugin が有効でも、プライマリモデルがまだ `openai-codex/*` の場合、`openclaw doctor` はルートを変更せずに警告します。これは意図的です。`openai-codex/*` は PI Codex OAuth/サブスクリプションパスのままであり、ネイティブ app-server 実行は明示的なランタイム選択のままです。

## ルートマップ

設定を変更する前にこの表を使ってください。

| 望ましい動作                                | モデル参照                 | ランタイム設定                         | Plugin 要件                  | 期待されるステータスラベル    |
| ------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| 通常の OpenClaw ランナー経由の OpenAI API   | `openai/gpt-*`             | 省略、または `runtime: "pi"`           | OpenAI プロバイダー          | `Runtime: OpenClaw Pi Default` |
| PI 経由の Codex OAuth/サブスクリプション    | `openai-codex/gpt-*`       | 省略、または `runtime: "pi"`           | OpenAI Codex OAuth プロバイダー | `Runtime: OpenClaw Pi Default` |
| ネイティブ Codex app-server 埋め込みターン   | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex` Plugin               | `Runtime: OpenAI Codex`        |
| 保守的な自動モードでの混在プロバイダー      | プロバイダー固有の参照     | `agentRuntime.id: "auto"`              | 任意の Plugin ランタイム     | 選択されたランタイムに依存     |
| 明示的な Codex ACP アダプターセッション     | ACP プロンプト/モデルに依存 | `runtime: "acp"` 付きの `sessions_spawn` | 正常な `acpx` バックエンド   | ACP タスク/セッションステータス |

重要な分岐は、プロバイダーとランタイムの違いです。

- `openai-codex/*` は「PI はどのプロバイダー/認証ルートを使うべきか？」に答えます
- `agentRuntime.id: "codex"` は「この埋め込みターンをどのループで実行するべきか？」に答えます
- `/codex ...` は「このチャットはどのネイティブ Codex 会話にバインドまたは制御するべきか？」に答えます
- ACP は「acpx はどの外部ハーネスプロセスを起動するべきか？」に答えます

## 適切なモデルプレフィックスを選ぶ

OpenAI 系ルートはプレフィックス固有です。PI 経由で Codex OAuth を使いたい場合は `openai-codex/*` を使い、直接 OpenAI API アクセスが必要な場合、またはネイティブ Codex app-server ハーネスを強制している場合は `openai/*` を使います。

| モデル参照                                    | ランタイムパス                               | 使う場合                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI 配管経由の OpenAI プロバイダー   | `OPENAI_API_KEY` による現在の直接 OpenAI Platform API アクセスが必要な場合。 |
| `openai-codex/gpt-5.5`                        | OpenClaw/PI 経由の OpenAI Codex OAuth        | デフォルトの PI ランナーで ChatGPT/Codex サブスクリプション認証を使いたい場合。 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server ハーネス                    | 埋め込みエージェントターンにネイティブ Codex app-server 実行が必要な場合。 |

GPT-5.5 は現在、OpenClaw ではサブスクリプション/OAuth のみです。PI OAuth には `openai-codex/gpt-5.5` を使うか、Codex app-server ハーネスとともに `openai/gpt-5.5` を使ってください。OpenAI が公開 API で GPT-5.5 を有効にすると、`openai/gpt-5.5` への直接 API キーアクセスがサポートされます。

レガシー `codex/gpt-*` 参照は互換エイリアスとして引き続き受け付けられます。doctor 互換性移行は、レガシーのプライマリランタイム参照を正規モデル参照に書き換え、ランタイムポリシーを別途記録します。一方、フォールバック専用のレガシー参照は、ランタイムがエージェントコンテナ全体に対して設定されるため、変更されません。新しい PI Codex OAuth 設定では `openai-codex/gpt-*` を使うべきです。新しいネイティブ app-server ハーネス設定では、`openai/gpt-*` に加えて `agentRuntime.id: "codex"` を使うべきです。

`agents.defaults.imageModel` も同じプレフィックス分岐に従います。画像理解を OpenAI Codex OAuth プロバイダーパス経由で実行する場合は `openai-codex/gpt-*` を使います。画像理解を境界付き Codex app-server ターン経由で実行する場合は `codex/gpt-*` を使います。Codex app-server モデルは画像入力対応を広告している必要があります。テキスト専用 Codex モデルは、メディアターンが始まる前に失敗します。

現在のセッションで有効なハーネスを確認するには `/status` を使います。選択が予想外の場合は、`agents/harness` サブシステムのデバッグログを有効にし、Gateway の構造化された `agent harness selected` レコードを確認してください。これには、選択されたハーネス ID、選択理由、ランタイム/フォールバックポリシー、および `auto` モードでは各 Plugin 候補のサポート結果が含まれます。

### doctor 警告の意味

`openclaw doctor` は、次のすべてが真の場合に警告します。

- バンドルされた `codex` Plugin が有効または許可されている
- エージェントのプライマリモデルが `openai-codex/*` である
- そのエージェントの有効ランタイムが `codex` ではない

この警告が存在するのは、ユーザーが「Codex Plugin 有効」は「ネイティブ Codex app-server ランタイム」を意味すると期待しがちだからです。OpenClaw はその飛躍を行いません。この警告の意味は次のとおりです。

- PI 経由の ChatGPT/Codex OAuth を意図していた場合、**変更は不要です**。
- ネイティブ app-server 実行を意図していた場合は、モデルを `openai/<model>` に変更し、`agentRuntime.id: "codex"` を設定してください。
- ランタイム変更後も、既存セッションには `/new` または `/reset` が必要です。セッションランタイムのピン留めは固定的だからです。

ハーネス選択はライブセッション制御ではありません。埋め込みターンが実行されると、OpenClaw は選択されたハーネス ID をそのセッションに記録し、同じセッション ID 内の後続ターンでも使い続けます。将来のセッションで別のハーネスを使いたい場合は、`agentRuntime` 設定または `OPENCLAW_AGENT_RUNTIME` を変更してください。既存の会話を PI と Codex の間で切り替える前に、`/new` または `/reset` を使って新しいセッションを開始してください。これにより、1 つのトランスクリプトを互換性のない 2 つのネイティブセッションシステムに通すことを避けられます。

ハーネスのピン留め以前に作成されたレガシーセッションは、トランスクリプト履歴がある時点で PI にピン留めされたものとして扱われます。設定変更後にその会話を Codex に移行するには、`/new` または `/reset` を使ってください。

`/status` は有効なモデルランタイムを表示します。デフォルトの PI ハーネスは `Runtime: OpenClaw Pi Default` と表示され、Codex app-server ハーネスは `Runtime: OpenAI Codex` と表示されます。

## 要件

- バンドルされた `codex` Plugin が利用可能な OpenClaw。
- Codex app-server `0.125.0` 以降。バンドルされた Plugin はデフォルトで互換性のある Codex app-server バイナリを管理するため、`PATH` 上のローカル `codex` コマンドは通常のハーネス起動に影響しません。
- app-server プロセス、または OpenClaw の Codex 認証ブリッジから Codex 認証を利用できること。ローカル app-server 起動では、各エージェントごとに OpenClaw 管理の Codex ホームと分離された子 `HOME` を使うため、デフォルトでは個人の `~/.codex` アカウント、Skills、Plugin、設定、スレッド状態、またはネイティブ `$HOME/.agents/skills` を読み取りません。

Plugin は、古いまたはバージョン未指定の app-server ハンドシェイクをブロックします。これにより、OpenClaw はテスト済みのプロトコル面に留まります。

ライブおよび Docker スモークテストでは、認証は通常 Codex CLI アカウント、または OpenClaw の `openai-codex` 認証プロファイルから取得されます。ローカル stdio app-server 起動では、アカウントが存在しない場合に `CODEX_API_KEY` / `OPENAI_API_KEY` にフォールバックすることもできます。

## Codex を他のモデルと並べて追加する

同じエージェントが Codex と Codex 以外のプロバイダーモデルを自由に切り替える必要がある場合は、`agentRuntime.id: "codex"` をグローバルに設定しないでください。強制されたランタイムは、そのエージェントまたはセッションのすべての埋め込みターンに適用されます。そのランタイムが強制されている状態で Anthropic モデルを選択すると、OpenClaw はそれでも Codex ハーネスを試行し、そのターンを黙って PI 経由にルーティングするのではなく、失敗として閉じます。

代わりに、次のいずれかの形を使用してください。

- Codex を `agentRuntime.id: "codex"` の専用エージェントに配置します。
- 通常の混在プロバイダー利用では、デフォルトエージェントを `agentRuntime.id: "auto"` と PI フォールバックのままにします。
- レガシーの `codex/*` 参照は互換性のためだけに使用します。新しい設定では、`openai/*` に加えて明示的な Codex ランタイムポリシーを優先してください。

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
- `codex` エージェントで Codex が存在しないかサポートされていない場合、そのターンは静かに PI を使用するのではなく失敗します。

## エージェントコマンドのルーティング

エージェントは、単語「Codex」だけではなく、意図に基づいてユーザーリクエストをルーティングする必要があります。

| ユーザーの依頼...                                        | エージェントが使用すべきもの...                 |
| -------------------------------------------------------- | ------------------------------------------------ |
| 「このチャットを Codex にバインドして」                  | `/codex bind`                                    |
| 「Codex スレッド `<id>` をここで再開して」               | `/codex resume <id>`                             |
| 「Codex スレッドを表示して」                             | `/codex threads`                                 |
| 「問題のある Codex 実行のサポートレポートを提出して」   | `/diagnostics [note]`                            |
| 「この添付スレッドについてだけ Codex フィードバックを送信して」 | `/codex diagnostics [note]`                      |
| 「このエージェントのランタイムに Codex を使用して」      | `agentRuntime.id` への設定変更                   |
| 「通常の OpenClaw で自分の ChatGPT/Codex サブスクリプションを使用して」 | `openai-codex/*` モデル参照                      |
| 「ACP/acpx 経由で Codex を実行して」                     | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「Claude Code/Gemini/OpenCode/Cursor をスレッドで開始して」 | ACP/acpx。`/codex` でもネイティブサブエージェントでもありません |

OpenClaw は、ACP が有効で、ディスパッチ可能で、読み込まれたランタイムバックエンドに支えられている場合にのみ、ACP 生成ガイダンスをエージェントに提示します。ACP が利用できない場合、システムプロンプトと Plugin Skills は、ACP ルーティングについてエージェントに教えるべきではありません。

## Codex 専用デプロイ

すべての埋め込みエージェントターンが Codex を使用することを証明する必要がある場合は、Codex ハーネスを強制します。明示的な Plugin ランタイムはデフォルトで PI フォールバックなしになるため、`fallback: "none"` は任意ですが、ドキュメントとして役立つことがよくあります。

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

Codex が強制されている場合、Codex Plugin が無効、app-server が古すぎる、または app-server を起動できないと、OpenClaw は早期に失敗します。ハーネス選択ができない場合に PI に処理させたい意図がある場合にのみ、`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` を設定してください。

## エージェントごとの Codex

デフォルトエージェントは通常の自動選択を維持しながら、1 つのエージェントだけを Codex 専用にできます。

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

エージェントとモデルを切り替えるには、通常のセッションコマンドを使用します。`/new` は新しい OpenClaw セッションを作成し、Codex ハーネスは必要に応じてサイドカーの app-server スレッドを作成または再開します。`/reset` はそのスレッドの OpenClaw セッションバインドをクリアし、次のターンで現在の設定からハーネスを再解決できるようにします。

## モデル検出

デフォルトでは、Codex Plugin は利用可能なモデルを app-server に問い合わせます。検出が失敗するかタイムアウトした場合、次のバンドル済みフォールバックカタログを使用します。

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

起動時に Codex へのプローブを避け、フォールバックカタログに固定したい場合は、検出を無効にします。

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

## app-server 接続とポリシー

デフォルトでは、Plugin は OpenClaw の管理対象 Codex バイナリをローカルで次のように起動します。

```bash
codex app-server --listen stdio://
```

管理対象バイナリは、バンドル済み Plugin ランタイム依存関係として宣言され、残りの `codex` Plugin 依存関係とともにステージングされます。これにより、app-server のバージョンは、ローカルにたまたまインストールされている別の Codex CLI ではなく、バンドル済み Plugin に結び付けられます。別の実行ファイルを意図的に実行したい場合にのみ、`appServer.command` を設定してください。

デフォルトでは、OpenClaw はローカルの Codex ハーネスセッションを YOLO モードで開始します。`approvalPolicy: "never"`、`approvalsReviewer: "user"`、`sandbox: "danger-full-access"` です。これは自律 Heartbeat に使用される信頼済みローカルオペレーターの姿勢です。Codex は、応答する人がいないネイティブ承認プロンプトで停止せずに、シェルとネットワークツールを使用できます。

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

Guardian モードは、Codex のネイティブな自動レビュー承認パスを使用します。Codex がサンドボックスを離れる、ワークスペース外に書き込む、またはネットワークアクセスなどの権限を追加するよう求める場合、Codex はその承認リクエストを人間のプロンプトではなくネイティブレビュー担当にルーティングします。レビュー担当は Codex のリスクフレームワークを適用し、特定のリクエストを承認または拒否します。YOLO モードより多くのガードレールが必要だが、無人エージェントにも進捗が必要な場合は Guardian を使用してください。

`guardian` プリセットは、`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、`sandbox: "workspace-write"` に展開されます。個別のポリシーフィールドは引き続き `mode` を上書きするため、高度なデプロイではプリセットと明示的な選択を混在できます。以前の `guardian_subagent` レビュー担当値は互換エイリアスとして引き続き受け入れられますが、新しい設定では `auto_review` を使用してください。

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

Stdio app-server の起動は、デフォルトで OpenClaw のプロセス環境を継承しますが、OpenClaw は Codex app-server アカウントブリッジを所有し、`CODEX_HOME` と `HOME` の両方を、そのエージェントの OpenClaw 状態配下にあるエージェントごとのディレクトリに設定します。Codex 独自の Skills ローダーは `$CODEX_HOME/skills` と `$HOME/.agents/skills` を読み取るため、ローカル app-server 起動では両方の値が分離されます。これにより、Codex ネイティブの Skills、plugins、設定、アカウント、スレッド状態は、オペレーター個人の Codex CLI ホームから漏れ込むのではなく、OpenClaw エージェントにスコープされます。

OpenClaw plugins と OpenClaw Skills スナップショットは、引き続き OpenClaw 独自の Plugin レジストリと Skills ローダーを通じて流れます。個人の Codex CLI アセットは流れません。OpenClaw エージェントの一部にすべき有用な Codex CLI Skills または plugins がある場合は、明示的にインベントリしてください。

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex 移行プロバイダーは、Skills を現在の OpenClaw エージェントワークスペースにコピーします。Codex ネイティブ plugins、フック、設定ファイルは、コマンドを実行したり、MCP サーバーを公開したり、資格情報を保持したりする可能性があるため、自動的に有効化されるのではなく、手動レビュー用に報告またはアーカイブされます。

認証は次の順序で選択されます。

1. そのエージェントの明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex ホームにある app-server の既存アカウント。
3. ローカル stdio app-server 起動の場合のみ、app-server アカウントが存在せず、OpenAI 認証がまだ必要な場合は、`CODEX_API_KEY`、次に `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、生成される Codex 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーは埋め込みや直接の OpenAI モデルに利用可能なまま、ネイティブ Codex app-server ターンが誤って API 経由で課金されることを防ぎます。明示的な Codex API キープロファイルとローカル stdio 環境キーのフォールバックは、継承された子プロセス環境ではなく app-server ログインを使用します。WebSocket app-server 接続は Gateway 環境 API キーフォールバックを受け取りません。明示的な認証プロファイルまたはリモート app-server 独自のアカウントを使用してください。

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

`appServer.clearEnv` は、生成された Codex app-server 子プロセスにのみ影響します。

サポートされる `appServer` フィールド:

| フィールド          | デフォルト                             | 意味                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` は Codex を起動し、`"websocket"` は `url` に接続します。                                                                                                                                                                   |
| `command`           | 管理対象の Codex バイナリ               | stdio トランスポート用の実行ファイルです。管理対象バイナリを使う場合は未設定のままにし、明示的に上書きする場合にのみ設定します。                                                                                                  |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio トランスポート用の引数です。                                                                                                                                                                                                  |
| `url`               | 未設定                                   | WebSocket app-server URL です。                                                                                                                                                                                                     |
| `authToken`         | 未設定                                   | WebSocket トランスポート用の Bearer トークンです。                                                                                                                                                                                  |
| `headers`           | `{}`                                     | 追加の WebSocket ヘッダーです。                                                                                                                                                                                                     |
| `clearEnv`          | `[]`                                     | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除される追加の環境変数名です。`CODEX_HOME` と `HOME` は、ローカル起動時の OpenClaw のエージェントごとの Codex 分離用に予約されています。 |
| `requestTimeoutMs`  | `60000`                                  | app-server コントロールプレーン呼び出しのタイムアウトです。                                                                                                                                                                         |
| `mode`              | `"yolo"`                                 | YOLO または guardian レビュー付き実行のプリセットです。                                                                                                                                                                             |
| `approvalPolicy`    | `"never"`                                | thread start/resume/turn に送信されるネイティブ Codex 承認ポリシーです。                                                                                                                                                            |
| `sandbox`           | `"danger-full-access"`                   | thread start/resume に送信されるネイティブ Codex サンドボックスモードです。                                                                                                                                                         |
| `approvalsReviewer` | `"user"`                                 | Codex にネイティブ承認プロンプトをレビューさせるには `"auto_review"` を使います。`guardian_subagent` は従来のエイリアスのままです。                                                                                                |
| `serviceTier`       | 未設定                                   | 任意の Codex app-server サービスティアです: `"fast"`、`"flex"`、または `null`。無効な従来値は無視されます。                                                                                                                        |

OpenClaw 所有の動的ツール呼び出しは、`appServer.requestTimeoutMs` とは独立して制限されます。各 Codex `item/tool/call` リクエストは、30 秒以内に OpenClaw の応答を受け取る必要があります。タイムアウト時、OpenClaw はサポートされている場合はツールシグナルを中止し、失敗した動的ツール応答を Codex に返すため、セッションを `processing` のまま残す代わりにターンを継続できます。

OpenClaw が Codex のターンスコープ app-server リクエストに応答した後、ハーネスは Codex がネイティブターンを `turn/completed` で終了することも期待します。その応答後に app-server が 60 秒間沈黙した場合、OpenClaw はベストエフォートで Codex ターンを中断し、診断タイムアウトを記録し、OpenClaw セッションレーンを解放して、後続のチャットメッセージが古いネイティブターンの後ろにキューされないようにします。

ローカルテストでは環境オーバーライドを引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` は、`appServer.command` が未設定の場合に管理対象バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに `plugins.entries.codex.config.appServer.mode: "guardian"` を使うか、1 回限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使ってください。再現可能なデプロイでは、Plugin の動作が Codex ハーネス設定の残り部分と同じレビュー対象ファイルに保たれるため、設定を使うことを推奨します。

## コンピューター使用

コンピューター使用は専用のセットアップガイドで説明しています:
[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use)。

要約すると、OpenClaw はデスクトップ制御アプリをベンダー化せず、デスクトップ操作自体も実行しません。Codex app-server を準備し、`computer-use` MCP サーバーが利用可能であることを確認してから、Codex モードのターン中に Codex がネイティブ MCP ツール呼び出しを処理できるようにします。

Codex マーケットプレイスフローの外で TryCua ドライバーへ直接アクセスするには、`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` で `cua-driver mcp` を登録します。Codex 所有のコンピューター使用と直接 MCP 登録の違いについては、[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use)を参照してください。

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

セットアップはコマンドサーフェスから確認またはインストールできます。

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

コンピューター使用は macOS 固有であり、Codex MCP サーバーがアプリを制御できるようになる前に、ローカル OS 権限が必要になる場合があります。`computerUse.enabled` が true で MCP サーバーが利用できない場合、Codex モードのターンは、ネイティブのコンピューター使用ツールなしで密かに実行されるのではなく、スレッド開始前に失敗します。マーケットプレイスの選択肢、リモートカタログの制限、ステータス理由、トラブルシューティングについては、[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use)を参照してください。

`computerUse.autoInstall` が true の場合、Codex がまだローカルマーケットプレイスを検出していなければ、OpenClaw は `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` から標準のバンドル版 Codex Desktop マーケットプレイスを登録できます。ランタイムまたはコンピューター使用設定を変更した後は、既存セッションが古い PI または Codex スレッドバインディングを保持しないように、`/new` または `/reset` を使ってください。

## よく使うレシピ

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

Codex のみのハーネス検証:

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

明示的なヘッダーを使うリモート app-server:

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

モデル切り替えは OpenClaw 側で制御されます。OpenClaw セッションが既存の Codex スレッドにアタッチされている場合、次のターンで現在選択されている OpenAI モデル、プロバイダー、承認ポリシー、サンドボックス、サービスティアが再度 app-server に送信されます。`openai/gpt-5.5` から `openai/gpt-5.2` に切り替えると、スレッドバインディングは維持されますが、新しく選択されたモデルで続行するよう Codex に要求します。

## Codex コマンド

バンドルされた Plugin は、認可済みスラッシュコマンドとして `/codex` を登録します。これは汎用であり、OpenClaw テキストコマンドをサポートする任意のチャンネルで動作します。

一般的な形式:

- `/codex status` は、ライブ app-server 接続、モデル、アカウント、レート制限、MCP サーバー、Skills を表示します。
- `/codex models` は、ライブ Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex スレッドにアタッチします。
- `/codex compact` は、アタッチされたスレッドをコンパクト化するよう Codex app-server に要求します。
- `/codex review` は、アタッチされたスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、アタッチされたスレッドの Codex 診断フィードバックを送信する前に確認します。
- `/codex computer-use status` は、設定済みのコンピューター使用 Plugin と MCP サーバーを確認します。
- `/codex computer-use install` は、設定済みのコンピューター使用 Plugin をインストールし、MCP サーバーを再読み込みします。
- `/codex account` は、アカウントとレート制限のステータスを表示します。
- `/codex mcp` は、Codex app-server MCP サーバーのステータスを一覧表示します。
- `/codex skills` は、Codex app-server の Skills を一覧表示します。

### 一般的なデバッグワークフロー

Codex バックエンドのエージェントが Telegram、Discord、Slack、または別のチャンネルで予期しない動作をした場合は、問題が発生した会話から始めます。

1. `/diagnostics bad tool choice after image upload`、または見た内容を説明する別の短いメモを実行します。
2. 診断リクエストを一度承認します。この承認により、ローカル Gateway 診断 zip が作成され、セッションが Codex ハーネスを使用しているため、関連する Codex フィードバックバンドルも OpenAI サーバーに送信されます。
3. 完了した診断返信をバグレポートまたはサポートスレッドにコピーします。これには、ローカルバンドルパス、プライバシー概要、OpenClaw セッション ID、Codex スレッド ID、および各 Codex スレッドの `Inspect locally` 行が含まれます。
4. 実行を自分でデバッグしたい場合は、表示された `Inspect locally` コマンドをターミナルで実行します。これは `codex resume <thread-id>` のような形式で、ネイティブ Codex スレッドを開くため、会話を調査したり、ローカルで続行したり、特定のツールや計画を選んだ理由を Codex に尋ねたりできます。

`/codex diagnostics [note]` は、完全な OpenClaw Gateway 診断バンドルではなく、現在添付されているスレッドの Codex フィードバックアップロードだけが特に必要な場合にのみ使用します。ほとんどのサポート報告では、`/diagnostics [note]` の方が出発点として適しています。これは、ローカル Gateway の状態と Codex スレッド ID を 1 つの返信で結び付けるためです。完全なプライバシーモデルとグループチャットでの動作については、[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

Core OpenClaw は、一般的な Gateway 診断コマンドとして、所有者専用の `/diagnostics [note]` も公開しています。その承認プロンプトには、機密データに関する前置きが表示され、[診断エクスポート](/ja-JP/gateway/diagnostics)へのリンクが示され、毎回明示的な exec 承認を通じて `openclaw gateway diagnostics export --json` を要求します。allow-all ルールで診断を承認しないでください。承認後、OpenClaw はローカルバンドルのパスとマニフェストの概要を含む、貼り付け可能なレポートを送信します。アクティブな OpenClaw セッションが Codex ハーネスを使用している場合、その同じ承認により、関連する Codex フィードバックバンドルを OpenAI サーバーへ送信することも許可されます。承認プロンプトには Codex フィードバックが送信されることが示されますが、承認前に Codex セッション ID やスレッド ID は列挙されません。

グループチャットで所有者が `/diagnostics` を呼び出した場合、OpenClaw は共有チャンネルをクリーンに保ちます。グループには短い通知だけが届き、診断の前置き、承認プロンプト、Codex セッション ID/スレッド ID は、非公開の承認ルートを通じて所有者に送信されます。非公開の所有者ルートがない場合、OpenClaw はグループからの要求を拒否し、所有者に DM から実行するよう求めます。

承認された Codex アップロードは Codex app-server の `feedback/upload` を呼び出し、利用可能な場合は、列挙された各スレッドと生成された Codex サブスレッドのログを含めるよう app-server に要求します。アップロードは Codex の通常のフィードバック経路を通じて OpenAI サーバーへ送信されます。その app-server で Codex フィードバックが無効になっている場合、コマンドは app-server エラーを返します。完了した診断返信には、送信されたスレッドについて、チャンネル、OpenClaw セッション ID、Codex スレッド ID、およびローカルの `codex resume <thread-id>` コマンドが列挙されます。承認を拒否または無視した場合、OpenClaw はそれらの Codex ID を出力しません。このアップロードは、ローカル Gateway 診断エクスポートを置き換えるものではありません。

`/codex resume` は、ハーネスが通常のターンで使用するものと同じサイドカーのバインディングファイルを書き込みます。次のメッセージで、OpenClaw はその Codex スレッドを再開し、現在選択されている OpenClaw モデルを app-server に渡し、拡張履歴を有効なままにします。

### CLI から Codex スレッドを調査する

問題のある Codex 実行を理解する最速の方法は、多くの場合、ネイティブの Codex スレッドを直接開くことです。

```sh
codex resume <thread-id>
```

チャンネルの会話でバグに気付き、問題のある Codex セッションを調査したり、ローカルで続行したり、特定のツールまたは推論の選択をした理由を Codex に尋ねたりしたい場合に、これを使用します。通常、最も簡単な手順は、まず `/diagnostics [note]` を実行することです。承認後、完了したレポートには各 Codex スレッドが列挙され、たとえば `codex resume <thread-id>` のような `Inspect locally` コマンドが出力されます。そのコマンドを直接ターミナルにコピーできます。

現在のチャットについては `/codex binding` から、最近の Codex app-server スレッドについては `/codex threads [filter]` からスレッド ID を取得し、同じ `codex resume` コマンドをシェルで実行することもできます。

このコマンドサーフェスには Codex app-server `0.125.0` 以降が必要です。将来の app-server またはカスタム app-server がその JSON-RPC メソッドを公開していない場合、個々の制御メソッドは `unsupported by this Codex app-server` として報告されます。

## フック境界

Codex ハーネスには 3 つのフック層があります。

| レイヤー                              | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin フック                | OpenClaw                 | PI と Codex ハーネス全体での製品/Plugin 互換性。                    |
| Codex app-server 拡張ミドルウェア     | OpenClaw 同梱 Plugin     | OpenClaw 動的ツール周辺のターンごとのアダプター動作。               |
| Codex ネイティブフック                | Codex                    | Codex 設定からの低レベル Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、OpenClaw Plugin の動作をルーティングするために、プロジェクトまたはグローバルの Codex `hooks.json` ファイルを使用しません。サポートされているネイティブツールと権限ブリッジについて、OpenClaw は `PreToolUse`、`PostToolUse`、`PermissionRequest`、`Stop` 用のスレッドごとの Codex 設定を注入します。`SessionStart` や `UserPromptSubmit` などの他の Codex フックは Codex レベルの制御のままであり、v1 コントラクトでは OpenClaw Plugin フックとして公開されません。

OpenClaw 動的ツールの場合、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、OpenClaw はハーネスアダプター内で、自身が所有する Plugin とミドルウェアの動作を発火します。Codex ネイティブツールの場合、Codex が正規のツールレコードを所有します。OpenClaw は選択されたイベントをミラーできますが、Codex が app-server またはネイティブフックコールバックを通じてその操作を公開しない限り、ネイティブ Codex スレッドを書き換えることはできません。

Compaction と LLM ライフサイクルの投影は、ネイティブ Codex フックコマンドではなく、Codex app-server 通知と OpenClaw アダプター状態から来ます。OpenClaw の `before_compaction`、`after_compaction`、`llm_input`、`llm_output` イベントはアダプターレベルの観測であり、Codex の内部リクエストや Compaction ペイロードをバイト単位で取得したものではありません。

Codex ネイティブの `hook/started` および `hook/completed` app-server 通知は、軌跡とデバッグのために `codex_app_server.hook` エージェントイベントとして投影されます。これらは OpenClaw Plugin フックを呼び出しません。

## V1 サポートコントラクト

Codex モードは、内部のモデル呼び出しを変えた PI ではありません。Codex はネイティブモデルループのより多くを所有し、OpenClaw はその境界に合わせて Plugin とセッションのサーフェスを適応させます。

Codex ランタイム v1 でサポートされるもの:

| サーフェス                                      | サポート                                | 理由                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex を通じた OpenAI モデルループ            | サポート                                | Codex app-server が OpenAI ターン、ネイティブスレッド再開、ネイティブツール継続を所有するため。                                                                                                      |
| OpenClaw チャンネルルーティングと配信         | サポート                                | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャンネルはモデルランタイムの外側に留まるため。                                                                                              |
| OpenClaw 動的ツール                           | サポート                                | Codex が OpenClaw にこれらのツールの実行を要求するため、OpenClaw は実行経路に留まるため。                                                                                                            |
| プロンプトとコンテキスト Plugin               | サポート                                | OpenClaw が、スレッドを開始または再開する前に、プロンプトオーバーレイを構築し、コンテキストを Codex ターンへ投影するため。                                                                          |
| コンテキストエンジンのライフサイクル          | サポート                                | Codex ターンに対して、組み立て、取り込みまたはターン後メンテナンス、コンテキストエンジンの Compaction 調整が実行されるため。                                                                         |
| 動的ツールフック                              | サポート                                | `before_tool_call`、`after_tool_call`、およびツール結果ミドルウェアが、OpenClaw 所有の動的ツールの周辺で実行されるため。                                                                             |
| ライフサイクルフック                          | アダプター観測としてサポート            | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は、正確な Codex モードペイロードで発火するため。                                                                      |
| 最終回答の修正ゲート                          | ネイティブフックリレーを通じてサポート  | Codex `Stop` は `before_agent_finalize` にリレーされ、`revise` は最終化前にもう 1 回のモデルパスを Codex に要求するため。                                                                            |
| ネイティブ shell、patch、MCP のブロックまたは観測 | ネイティブフックリレーを通じてサポート  | Codex `PreToolUse` と `PostToolUse` は、Codex app-server `0.125.0` 以降の MCP ペイロードを含む、コミット済みのネイティブツールサーフェスに対してリレーされるため。ブロックはサポートされますが、引数の書き換えはサポートされません。 |
| ネイティブ権限ポリシー                        | ネイティブフックリレーを通じてサポート  | ランタイムが公開している場合、Codex `PermissionRequest` は OpenClaw ポリシーを通じてルーティングできます。OpenClaw が決定を返さない場合、Codex は通常の guardian またはユーザー承認経路を通じて続行します。 |
| App-server 軌跡キャプチャ                     | サポート                                | OpenClaw は app-server に送信したリクエストと、受信した app-server 通知を記録するため。                                                                                                              |

Codex ランタイム v1 でサポートされないもの:

| サーフェス                                          | V1 境界                                                                                                                                         | 今後のパス                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ネイティブツール引数の変更                         | Codex のネイティブなツール実行前フックはブロックできますが、OpenClaw は Codex ネイティブツール引数を書き換えません。                           | 置換後のツール入力には、Codex のフック/スキーマサポートが必要です。                       |
| 編集可能な Codex ネイティブ transcript 履歴         | Codex は正規のネイティブスレッド履歴を所有します。OpenClaw はミラーを所有し、将来のコンテキストを投影できますが、未サポートの内部状態を変更すべきではありません。 | ネイティブスレッドの直接編集が必要な場合は、明示的な Codex app-server API を追加します。 |
| Codex ネイティブツールレコード用の `tool_result_persist` | そのフックは OpenClaw が所有する transcript 書き込みを変換するもので、Codex ネイティブツールレコードは変換しません。                           | 変換済みレコードをミラーすることはできますが、正規の書き換えには Codex のサポートが必要です。 |
| リッチなネイティブ Compaction メタデータ           | OpenClaw は Compaction の開始と完了を監視しますが、安定した保持/破棄リスト、トークン差分、要約ペイロードは受け取りません。                    | よりリッチな Codex Compaction イベントが必要です。                                        |
| Compaction 介入                                     | 現在の OpenClaw Compaction フックは、Codex モードでは通知レベルです。                                                                           | Plugin がネイティブ Compaction の拒否や書き換えを必要とする場合は、Codex の Compaction 前後フックを追加します。 |
| バイト単位で一致するモデル API リクエストの捕捉    | OpenClaw は app-server のリクエストと通知を捕捉できますが、Codex core は最終的な OpenAI API リクエストを内部で構築します。                     | Codex のモデルリクエスト追跡イベントまたはデバッグ API が必要です。                       |

## ツール、メディア、Compaction

Codex ハーネスが変更するのは、低レベルの組み込みエージェント実行器だけです。

OpenClaw は引き続きツールリストを構築し、ハーネスから動的ツール結果を受け取ります。テキスト、画像、動画、音楽、TTS、承認、メッセージングツール出力は、通常の OpenClaw 配信パスを通り続けます。

ネイティブフックリレーは意図的に汎用的ですが、v1 のサポート契約は OpenClaw がテストする Codex ネイティブのツールおよび権限パスに限定されます。Codex ランタイムでは、それに shell、patch、MCP の `PreToolUse`、`PostToolUse`、`PermissionRequest` ペイロードが含まれます。ランタイム契約が名前を挙げるまでは、将来のすべての Codex フックイベントが OpenClaw Plugin サーフェスであると仮定しないでください。

`PermissionRequest` では、OpenClaw はポリシーが判断した場合にのみ、明示的な許可または拒否の決定を返します。決定なしの結果は許可ではありません。Codex はそれをフック判断なしとして扱い、自身のガーディアンまたはユーザー承認パスにフォールスルーします。

Codex MCP ツール承認の要求は、Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` としてマークした場合、OpenClaw の Plugin 承認フローを通してルーティングされます。Codex の `request_user_input` プロンプトは発信元チャットに送り返され、次にキューに入ったフォローアップメッセージは、追加コンテキストとして誘導されるのではなく、そのネイティブサーバーリクエストに回答します。その他の MCP 要求リクエストは引き続き安全側に失敗します。

アクティブ実行キューの誘導は、Codex app-server の `turn/steer` に対応します。デフォルトの `messages.queue.mode: "steer"` では、OpenClaw は設定済みの静穏ウィンドウ中にキュー化されたチャットメッセージをまとめ、到着順に 1 つの `turn/steer` リクエストとして送信します。レガシーの `queue` モードでは、個別の `turn/steer` リクエストを送信します。Codex のレビューターンと手動 Compaction ターンは同一ターンの誘導を拒否することがあり、その場合、選択されたモードでフォールバックが許可されていれば OpenClaw はフォローアップキューを使用します。[誘導キュー](/ja-JP/concepts/queue-steering)を参照してください。

選択されたモデルが Codex ハーネスを使用する場合、ネイティブスレッド Compaction は Codex app-server に委任されます。OpenClaw はチャンネル履歴、検索、`/new`、`/reset`、将来のモデルまたはハーネス切り替えのために transcript ミラーを保持します。このミラーには、ユーザープロンプト、最終アシスタントテキスト、app-server が発行した場合の軽量な Codex 推論または計画レコードが含まれます。現時点では、OpenClaw はネイティブ Compaction の開始および完了シグナルのみを記録します。人間が読める Compaction 要約や、Compaction 後に Codex が保持したエントリの監査可能なリストはまだ公開していません。

Codex が正規のネイティブスレッドを所有するため、`tool_result_persist` は現在 Codex ネイティブツール結果レコードを書き換えません。これは OpenClaw が所有するセッション transcript のツール結果を OpenClaw が書き込む場合にのみ適用されます。

メディア生成に PI は必要ありません。画像、動画、音楽、PDF、TTS、メディア理解は、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts` などの対応するプロバイダー/モデル設定を引き続き使用します。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** 新しい設定では想定どおりです。`agentRuntime.id: "codex"` を指定した `openai/gpt-*` モデル（またはレガシーの `codex/*` 参照）を選択し、`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく PI を使用する:** `agentRuntime.id: "auto"` は、どの Codex ハーネスも実行を引き受けない場合、互換性バックエンドとして引き続き PI を使用できます。テスト中に Codex の選択を強制するには、`agentRuntime.id: "codex"` を設定します。強制された Codex ランタイムは、`agentRuntime.fallback: "pi"` を明示的に設定しない限り、PI にフォールバックせず失敗するようになりました。Codex app-server が選択されると、その失敗は追加のフォールバック設定なしで直接表面化します。

**app-server が拒否される:** Codex をアップグレードして、app-server ハンドシェイクがバージョン `0.125.0` 以降を報告するようにしてください。`0.125.0-alpha.2` や `0.125.0+custom` などの同一バージョンのプレリリースやビルドサフィックス付きバージョンは、安定版 `0.125.0` のプロトコル下限が OpenClaw のテスト対象であるため拒否されます。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にしてください。

**WebSocket トランスポートが即座に失敗する:** `appServer.url`、`authToken`、リモート app-server が同じ Codex app-server プロトコルバージョンを話していることを確認してください。

**非 Codex モデルが PI を使用する:** そのエージェントに `agentRuntime.id: "codex"` を強制しているか、レガシーの `codex/*` 参照を選択している場合を除き、これは想定どおりです。通常の `openai/gpt-*` とその他のプロバイダー参照は、`auto` モードでは通常のプロバイダーパスに留まります。`agentRuntime.id: "codex"` を強制する場合、そのエージェントのすべての組み込みターンは Codex 対応の OpenAI モデルである必要があります。

**Computer Use はインストールされているがツールが実行されない:** 新しいセッションから `/codex computer-use status` を確認してください。ツールが `Native hook relay unavailable` を報告する場合は、`/new` または `/reset` を使用してください。それでも続く場合は、Gateway を再起動して古いネイティブフック登録をクリアしてください。`computer-use.list_apps` がタイムアウトする場合は、Codex Computer Use または Codex Desktop を再起動して再試行してください。

## 関連

- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [ステータス](/ja-JP/cli/status)
- [Plugin フック](/ja-JP/plugins/hooks)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
