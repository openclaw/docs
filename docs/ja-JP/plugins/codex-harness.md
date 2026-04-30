---
read_when:
    - バンドルされている Codex アプリサーバー ハーネスを使用したい場合
    - Codex ハーネス設定の例が必要です
    - Codex のみのデプロイで、PI にフォールバックするのではなく失敗させたい
summary: バンドルされた Codex app-server ハーネスを通じて OpenClaw の埋め込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-04-30T05:24:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93abb72e9590aad265e5b6b8691dd16314178c4d255679b4e53da33b792a6e6b
    source_path: plugins/codex-harness.md
    workflow: 16
---

バンドルされた `codex` Plugin により、OpenClaw は組み込み PI ハーネスではなく
Codex アプリサーバーを通じて埋め込みエージェントターンを実行できます。

低レベルのエージェントセッションを Codex に任せたい場合に使用します。モデル
検出、ネイティブスレッド再開、ネイティブ Compaction、アプリサーバー実行です。
OpenClaw は引き続き、チャットチャネル、セッションファイル、モデル選択、ツール、
承認、メディア配信、表示されるトランスクリプトミラーを所有します。

全体像を把握したい場合は、
[エージェントランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。短く言うと、
`openai/gpt-5.5` はモデル参照、`codex` はランタイムで、Telegram、
Discord、Slack、または別のチャネルが通信面のままです。

## この Plugin が変更すること

バンドルされた `codex` Plugin は、いくつかの独立した機能を提供します。

| 機能                              | 使い方                                              | 動作                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| ネイティブ埋め込みランタイム      | `agentRuntime.id: "codex"`                          | OpenClaw の埋め込みエージェントターンを Codex アプリサーバー経由で実行します。 |
| ネイティブチャット制御コマンド    | `/codex bind`, `/codex resume`, `/codex steer`, ... | メッセージング会話から Codex アプリサーバースレッドをバインドおよび制御します。 |
| Codex アプリサーバープロバイダー/カタログ | `codex` 内部、ハーネス経由で公開                    | ランタイムがアプリサーバーモデルを検出および検証できるようにします。          |
| Codex メディア理解パス            | `codex/*` 画像モデル互換パス                        | サポート対象の画像理解モデル向けに、境界付きの Codex アプリサーバーターンを実行します。 |
| ネイティブフックリレー            | Codex ネイティブイベント周辺の Plugin フック        | OpenClaw がサポート対象の Codex ネイティブツール/終了イベントを監視/ブロックできるようにします。 |

Plugin を有効にすると、これらの機能が利用可能になります。これは次のことを**行いません**。

- すべての OpenAI モデルで Codex を使い始める
- `openai-codex/*` モデル参照をネイティブランタイムに変換する
- ACP/acpx をデフォルトの Codex パスにする
- すでに PI ランタイムを記録している既存セッションをホットスイッチする
- OpenClaw のチャネル配信、セッションファイル、認証プロファイル保存、または
  メッセージルーティングを置き換える

同じ Plugin は、ネイティブの `/codex` チャット制御コマンド面も所有します。
Plugin が有効で、ユーザーがチャットから Codex スレッドのバインド、再開、誘導、停止、または検査を求めた場合、
エージェントは ACP より `/codex ...` を優先するべきです。ACP は、ユーザーが ACP/acpx を求めた場合、または ACP
Codex アダプターをテストしている場合の明示的なフォールバックのままです。

ネイティブ Codex ターンは、OpenClaw Plugin フックを公開互換レイヤーとして維持します。
これらはプロセス内 OpenClaw フックであり、Codex `hooks.json` コマンドフックではありません。

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` ミラーされたトランスクリプトレコード用
- Codex `Stop` リレー経由の `before_agent_finalize`
- `agent_end`

Plugin は、OpenClaw がツールを実行した後、結果が Codex に返される前に
OpenClaw の動的ツール結果を書き換える、ランタイム中立のツール結果ミドルウェアも登録できます。
これは、OpenClaw が所有するトランスクリプトのツール結果書き込みを変換する公開
`tool_result_persist` Plugin フックとは別のものです。

Plugin フックのセマンティクス自体については、[Plugin フック](/ja-JP/plugins/hooks)
および [Plugin ガード動作](/ja-JP/tools/plugin) を参照してください。

ハーネスはデフォルトでオフです。新しい設定では、OpenAI モデル参照を
`openai/gpt-*` として正規化したままにし、ネイティブアプリサーバー実行が必要な場合は
`agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex` を明示的に強制するべきです。
レガシーの `codex/*` モデル参照は互換性のために引き続きハーネスを自動選択しますが、
ランタイムで裏付けられたレガシープロバイダープレフィックスは通常のモデル/プロバイダー選択肢として表示されません。

`codex` Plugin が有効でも、プライマリモデルがまだ
`openai-codex/*` の場合、`openclaw doctor` は経路を変更せずに警告します。これは意図的です。
`openai-codex/*` は PI Codex OAuth/サブスクリプションパスのままであり、
ネイティブアプリサーバー実行は明示的なランタイム選択のままです。

## ルートマップ

設定を変更する前に、この表を使用してください。

| 望ましい動作                                  | モデル参照                 | ランタイム設定                         | Plugin 要件                  | 期待されるステータスラベル     |
| --------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| 通常の OpenClaw ランナー経由の OpenAI API     | `openai/gpt-*`             | 省略または `runtime: "pi"`             | OpenAI プロバイダー         | `Runtime: OpenClaw Pi Default` |
| PI 経由の Codex OAuth/サブスクリプション      | `openai-codex/gpt-*`       | 省略または `runtime: "pi"`             | OpenAI Codex OAuth プロバイダー | `Runtime: OpenClaw Pi Default` |
| ネイティブ Codex アプリサーバー埋め込みターン | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex` Plugin              | `Runtime: OpenAI Codex`        |
| 保守的な自動モードでの混在プロバイダー        | プロバイダー固有の参照     | `agentRuntime.id: "auto"`              | 任意の Plugin ランタイム     | 選択されたランタイムに依存     |
| 明示的な Codex ACP アダプターセッション       | ACP プロンプト/モデル依存  | `sessions_spawn` と `runtime: "acp"`   | 正常な `acpx` バックエンド   | ACP タスク/セッションステータス |

重要な分離は、プロバイダーとランタイムの違いです。

- `openai-codex/*` は「PI はどのプロバイダー/認証経路を使うべきか?」に答えます
- `agentRuntime.id: "codex"` は「どのループがこの
  埋め込みターンを実行するべきか?」に答えます
- `/codex ...` は「このチャットはどのネイティブ Codex 会話をバインドまたは制御するべきか?」
  に答えます
- ACP は「acpx はどの外部ハーネスプロセスを起動するべきか?」に答えます

## 正しいモデルプレフィックスを選ぶ

OpenAI ファミリーのルートはプレフィックス固有です。PI 経由の Codex OAuth が必要な場合は `openai-codex/*` を使用し、
直接の OpenAI API アクセスが必要な場合、またはネイティブ Codex アプリサーバーハーネスを強制している場合は
`openai/*` を使用します。

| モデル参照                                    | ランタイムパス                             | 使用する場合                                                              |
| --------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI 配管経由の OpenAI プロバイダー | `OPENAI_API_KEY` で現在の直接 OpenAI Platform API アクセスを使いたい場合。 |
| `openai-codex/gpt-5.5`                        | OpenClaw/PI 経由の OpenAI Codex OAuth      | デフォルト PI ランナーで ChatGPT/Codex サブスクリプション認証を使いたい場合。 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex アプリサーバーハーネス               | 埋め込みエージェントターンでネイティブ Codex アプリサーバー実行を使いたい場合。 |

GPT-5.5 は現在 OpenClaw ではサブスクリプション/OAuth のみです。PI OAuth には
`openai-codex/gpt-5.5` を使用し、Codex アプリサーバーハーネスには `openai/gpt-5.5` を使用します。
OpenAI が GPT-5.5 を公開 API で有効にすると、`openai/gpt-5.5` の直接 API キーアクセスがサポートされます。

レガシーの `codex/gpt-*` 参照は互換エイリアスとして引き続き受け入れられます。Doctor
互換性移行は、レガシーのプライマリランタイム参照を正規モデル参照に書き換え、ランタイムポリシーを別に記録します。
一方、フォールバックのみのレガシー参照は、ランタイムがエージェントコンテナー全体に対して設定されるため変更されません。
新しい PI Codex OAuth 設定では `openai-codex/gpt-*` を使用するべきです。新しいネイティブ
アプリサーバーハーネス設定では `openai/gpt-*` に加えて
`agentRuntime.id: "codex"` を使用するべきです。

`agents.defaults.imageModel` も同じプレフィックス分離に従います。画像理解を OpenAI
Codex OAuth プロバイダーパス経由で実行するべき場合は `openai-codex/gpt-*` を使用します。画像理解を
境界付き Codex アプリサーバーターン経由で実行するべき場合は `codex/gpt-*` を使用します。Codex アプリサーバーモデルは
画像入力サポートを宣伝している必要があります。テキストのみの Codex モデルは、メディアターンの開始前に失敗します。

現在のセッションで有効なハーネスを確認するには `/status` を使用します。選択が予想外の場合は、
`agents/harness` サブシステムのデバッグログを有効にし、Gateway の構造化された `agent harness selected` レコードを調べます。
これには、選択されたハーネス ID、選択理由、ランタイム/フォールバックポリシー、および
`auto` モードでは各 Plugin 候補のサポート結果が含まれます。

### doctor 警告の意味

`openclaw doctor` は、次のすべてが真の場合に警告します。

- バンドルされた `codex` Plugin が有効または許可されている
- エージェントのプライマリモデルが `openai-codex/*`
- そのエージェントの有効なランタイムが `codex` ではない

この警告が存在するのは、ユーザーが「Codex Plugin が有効」を「ネイティブ Codex アプリサーバーランタイム」を意味すると期待しがちだからです。
OpenClaw はその飛躍を行いません。この警告の意味は次のとおりです。

- PI 経由の ChatGPT/Codex OAuth を意図していた場合、**変更は不要です**。
- ネイティブアプリサーバー実行を意図していた場合は、モデルを `openai/<model>` に変更し、
  `agentRuntime.id: "codex"` を設定します。
- ランタイム変更後も、既存セッションには `/new` または `/reset` が必要です。
  セッションランタイムピンは固定的だからです。

ハーネス選択はライブセッション制御ではありません。埋め込みターンが実行されると、
OpenClaw は選択されたハーネス ID をそのセッションに記録し、同じセッション ID の後続ターンでもそれを使い続けます。
将来のセッションで別のハーネスを使いたい場合は、`agentRuntime` 設定または
`OPENCLAW_AGENT_RUNTIME` を変更します。既存の会話を PI と Codex の間で切り替える前に、新しいセッションを開始するには
`/new` または `/reset` を使用します。これにより、1 つのトランスクリプトを互換性のない 2 つのネイティブセッションシステムで再生することを避けられます。

ハーネスピンが導入される前に作成されたレガシーセッションは、トランスクリプト履歴を持つと PI にピン留めされたものとして扱われます。
設定を変更した後、その会話を Codex にオプトインするには `/new` または `/reset` を使用します。

`/status` は有効なモデルランタイムを表示します。デフォルト PI ハーネスは
`Runtime: OpenClaw Pi Default` として表示され、Codex アプリサーバーハーネスは
`Runtime: OpenAI Codex` として表示されます。

## 要件

- バンドルされた `codex` Plugin が利用可能な OpenClaw。
- Codex アプリサーバー `0.125.0` 以降。バンドルされた Plugin はデフォルトで互換性のある
  Codex アプリサーバーバイナリを管理するため、`PATH` 上のローカル `codex` コマンドは
  通常のハーネス起動に影響しません。
- アプリサーバープロセスまたは OpenClaw の Codex 認証ブリッジで利用可能な Codex 認証。

Plugin は、古いまたはバージョン未設定のアプリサーバーハンドシェイクをブロックします。これにより、
OpenClaw はテスト済みのプロトコル面に留まります。

ライブおよび Docker スモークテストでは、認証は通常 Codex CLI アカウントまたは OpenClaw
`openai-codex` 認証プロファイルから取得されます。ローカル stdio アプリサーバー起動では、
アカウントが存在しない場合に `CODEX_API_KEY` / `OPENAI_API_KEY` にフォールバックすることもできます。

## 最小設定

`openai/gpt-5.5` を使用し、バンドルされた Plugin を有効にし、`codex` ハーネスを強制します。

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

`agents.defaults.model` またはエージェントモデルを
`codex/<model>` に設定するレガシー設定でも、バンドルされた `codex` Plugin は引き続き自動で有効になります。
新しい設定では、上記の明示的な `agentRuntime` エントリに加えて `openai/<model>` を優先するべきです。

## 他のモデルと並べて Codex を追加する

同じエージェントが Codex と非 Codex プロバイダーモデルを自由に切り替えるべき場合は、`agentRuntime.id: "codex"` をグローバルに設定しないでください。
強制ランタイムは、そのエージェントまたはセッションのすべての埋め込みターンに適用されます。そのランタイムが強制されている状態で Anthropic モデルを選択した場合、
OpenClaw は引き続き Codex ハーネスを試し、そのターンを PI 経由で静かにルーティングするのではなく、クローズドに失敗します。

代わりに、次のいずれかの形を使用します。

- `agentRuntime.id: "codex"` を指定した専用エージェントに Codex を配置する。
- 通常の混在プロバイダー利用では、デフォルトエージェントを `agentRuntime.id: "auto"` と PI フォールバックのままにする。
- レガシーの `codex/*` 参照は互換性のためだけに使用する。新しい設定では、`openai/*` に加えて明示的な Codex ランタイムポリシーを優先する。

たとえば、これはデフォルトエージェントを通常の自動選択のままにし、
別の Codex エージェントを追加します。

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

- デフォルトの `main` エージェントは、通常のプロバイダーパスと PI 互換フォールバックを使用する。
- `codex` エージェントは Codex アプリサーバーハーネスを使用する。
- `codex` エージェントで Codex が見つからない、またはサポートされていない場合、静かに PI を使用するのではなく、そのターンは失敗する。

## エージェントコマンドのルーティング

エージェントは、「Codex」という単語だけでなく、意図に基づいてユーザーリクエストをルーティングする必要があります。

| ユーザーが求めること...                                   | エージェントが使用すべきもの...                     |
| -------------------------------------------------------- | ------------------------------------------------ |
| 「このチャットを Codex にバインドして」                    | `/codex bind`                                    |
| 「Codex スレッド `<id>` をここで再開して」                 | `/codex resume <id>`                             |
| 「Codex スレッドを表示して」                              | `/codex threads`                                 |
| 「不適切な Codex 実行のサポートレポートを提出して」        | `/diagnostics [note]`                            |
| 「この添付スレッドについてのみ Codex フィードバックを送って」 | `/codex diagnostics [note]`                      |
| 「このエージェントのランタイムとして Codex を使って」      | `agentRuntime.id` への設定変更                   |
| 「通常の OpenClaw で ChatGPT/Codex サブスクリプションを使って」 | `openai-codex/*` モデル参照                      |
| 「ACP/acpx 経由で Codex を実行して」                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「Claude Code/Gemini/OpenCode/Cursor をスレッドで開始して」 | ACP/acpx、`/codex` でもネイティブサブエージェントでもない |

OpenClaw は、ACP が有効で、ディスパッチ可能で、読み込まれたランタイムバックエンドに支えられている場合にのみ、ACP spawn ガイダンスをエージェントに提示します。ACP が利用できない場合、システムプロンプトと Plugin Skills は、ACP ルーティングについてエージェントに教えるべきではありません。

## Codex 専用デプロイ

すべての埋め込みエージェントターンで Codex が使われることを証明する必要がある場合は、Codex ハーネスを強制します。明示的な Plugin ランタイムはデフォルトで PI フォールバックなしになるため、`fallback: "none"` は任意ですが、ドキュメントとして役立つことがよくあります。

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

Codex が強制されている場合、Codex Plugin が無効、アプリサーバーが古すぎる、またはアプリサーバーを起動できないと、OpenClaw は早期に失敗します。欠落したハーネス選択を意図的に PI に処理させたい場合にのみ、`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` を設定してください。

## エージェントごとの Codex

デフォルトエージェントは通常の自動選択を維持しつつ、1 つのエージェントだけを Codex 専用にできます。

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

エージェントとモデルの切り替えには通常のセッションコマンドを使用します。`/new` は新しい OpenClaw セッションを作成し、Codex ハーネスは必要に応じてサイドカーアプリサーバースレッドを作成または再開します。`/reset` は、そのスレッドの OpenClaw セッションバインドを消去し、次のターンで現在の設定からハーネスを再解決できるようにします。

## モデル検出

デフォルトでは、Codex Plugin は利用可能なモデルをアプリサーバーに問い合わせます。検出が失敗するかタイムアウトした場合、次のバンドル済みフォールバックカタログを使用します。

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

## アプリサーバー接続とポリシー

デフォルトでは、Plugin は OpenClaw の管理対象 Codex バイナリをローカルで次のように起動します。

```bash
codex app-server --listen stdio://
```

管理対象バイナリはバンドル済み Plugin ランタイム依存関係として宣言され、残りの `codex` Plugin 依存関係とともにステージングされます。これにより、アプリサーバーのバージョンは、ローカルにたまたまインストールされている別の Codex CLI ではなく、バンドル済み Plugin に結び付けられます。別の実行ファイルを意図的に実行したい場合にのみ、`appServer.command` を設定してください。

デフォルトでは、OpenClaw はローカル Codex ハーネスセッションを YOLO モードで開始します。
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"` です。これは自律 Heartbeat に使用される信頼済みローカルオペレーターの姿勢です。Codex は、応答する人がいないネイティブ承認プロンプトで停止することなく、シェルとネットワークツールを使用できます。

Codex のガーディアンレビュー付き承認にオプトインするには、`appServer.mode:
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

Guardian モードは Codex のネイティブ自動レビュー承認パスを使用します。Codex がサンドボックスから出る、ワークスペース外へ書き込む、またはネットワークアクセスのような権限を追加することを求める場合、Codex はその承認リクエストを人間のプロンプトではなくネイティブレビュアーにルーティングします。レビュアーは Codex のリスクフレームワークを適用し、特定のリクエストを承認または拒否します。YOLO モードより多くのガードレールが必要だが、無人エージェントにも進捗が必要な場合に Guardian を使用します。

`guardian` プリセットは、`approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。
個別のポリシーフィールドは引き続き `mode` を上書きするため、高度なデプロイではプリセットと明示的な選択を混在できます。古い `guardian_subagent` レビュアー値は互換エイリアスとして引き続き受け入れられますが、新しい設定では `auto_review` を使用するべきです。

すでに実行中のアプリサーバーには、WebSocket トランスポートを使用します。

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

stdio アプリサーバー起動は、デフォルトで OpenClaw のプロセス環境を継承しますが、OpenClaw が Codex アプリサーバーのアカウントブリッジを所有します。認証は次の順序で選択されます。

1. エージェントの明示的な OpenClaw Codex 認証プロファイル。
2. ローカル Codex CLI ChatGPT サインインなど、アプリサーバーの既存アカウント。
3. ローカル stdio アプリサーバー起動のみで、アプリサーバーアカウントが存在せず、OpenAI 認証がまだ必要な場合、`CODEX_API_KEY`、次に `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、spawn された Codex 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーは埋め込みや直接の OpenAI モデルで利用可能なまま、ネイティブ Codex アプリサーバーターンが誤って API 経由で課金されることを防げます。明示的な Codex API キープロファイルとローカル stdio env-key フォールバックは、継承された子プロセス環境ではなくアプリサーバーログインを使用します。WebSocket アプリサーバー接続は Gateway 環境の API キーフォールバックを受け取りません。明示的な認証プロファイル、またはリモートアプリサーバー自身のアカウントを使用してください。

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

`appServer.clearEnv` は、spawn された Codex アプリサーバー子プロセスにのみ影響します。

サポートされる `appServer` フィールド:

| フィールド          | デフォルト                               | 意味                                                                                                                                |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` は Codex を起動し、`"websocket"` は `url` に接続します。                                                                   |
| `command`           | 管理対象の Codex バイナリ                | stdio トランスポート用の実行ファイル。管理対象バイナリを使う場合は未設定のままにし、明示的に上書きする場合にのみ設定します。       |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio トランスポート用の引数。                                                                                                      |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                          |
| `authToken`         | 未設定                                   | WebSocket トランスポート用の Bearer token。                                                                                         |
| `headers`           | `{}`                                     | 追加の WebSocket ヘッダー。                                                                                                         |
| `clearEnv`          | `[]`                                     | OpenClaw が継承環境を構築した後、生成された stdio app-server プロセスから削除される追加の環境変数名。                              |
| `requestTimeoutMs`  | `60000`                                  | app-server コントロールプレーン呼び出しのタイムアウト。                                                                             |
| `mode`              | `"yolo"`                                 | YOLO 実行または guardian レビュー付き実行のプリセット。                                                                             |
| `approvalPolicy`    | `"never"`                                | スレッドの開始、再開、ターンに送信されるネイティブ Codex 承認ポリシー。                                                            |
| `sandbox`           | `"danger-full-access"`                   | スレッドの開始、再開に送信されるネイティブ Codex サンドボックスモード。                                                            |
| `approvalsReviewer` | `"user"`                                 | Codex にネイティブ承認プロンプトをレビューさせるには `"auto_review"` を使用します。`guardian_subagent` は従来のエイリアスのままです。 |
| `serviceTier`       | 未設定                                   | 任意の Codex app-server サービス階層: `"fast"`、`"flex"`、または `null`。無効な従来値は無視されます。                               |

OpenClaw 所有の動的ツール呼び出しは、`appServer.requestTimeoutMs` とは独立して制限されます。各 Codex `item/tool/call` リクエストは、30 秒以内に OpenClaw の応答を受け取る必要があります。タイムアウト時、OpenClaw はサポートされている場合はツールシグナルを中止し、失敗した動的ツール応答を Codex に返すことで、セッションを `processing` のままにせずターンを続行できるようにします。

OpenClaw が Codex のターンスコープ app-server リクエストに応答した後、ハーネスは Codex がネイティブターンを `turn/completed` で完了することも想定します。その応答後に app-server が 60 秒間沈黙した場合、OpenClaw はベストエフォートで Codex ターンに割り込み、診断タイムアウトを記録し、OpenClaw セッションレーンを解放して、後続のチャットメッセージが古いネイティブターンの後ろでキューに入らないようにします。

環境上書きはローカルテストで引き続き使用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、`OPENCLAW_CODEX_APP_SERVER_BIN` は管理対象バイナリを迂回します。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに `plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、単発のローカルテストでは `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。反復可能なデプロイでは設定を使うことが推奨されます。これにより、Plugin の動作が Codex ハーネス設定の他の部分と同じレビュー済みファイルに保持されるためです。

## コンピューター使用

コンピューター使用については、専用の設定ガイドで説明しています。
[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use)。

要約すると、OpenClaw はデスクトップ制御アプリをベンダー化せず、デスクトップアクション自体も実行しません。Codex app-server を準備し、`computer-use` MCP サーバーが使用可能であることを確認してから、Codex モードのターン中にネイティブ MCP ツール呼び出しの処理を Codex に任せます。

Codex marketplace フローの外で TryCua ドライバーに直接アクセスするには、`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` で `cua-driver mcp` を登録します。Codex 所有のコンピューター使用と直接 MCP 登録の違いについては、[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use) を参照してください。

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

設定はコマンドサーフェスから確認またはインストールできます。

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

コンピューター使用は macOS 固有であり、Codex MCP サーバーがアプリを制御できるようになる前にローカル OS 権限が必要になる場合があります。`computerUse.enabled` が true で MCP サーバーが使用できない場合、Codex モードのターンは、ネイティブのコンピューター使用ツールなしで黙って実行されるのではなく、スレッドが開始される前に失敗します。marketplace の選択肢、リモートカタログの制限、ステータス理由、トラブルシューティングについては、[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use) を参照してください。

`computerUse.autoInstall` が true の場合、Codex がまだローカル marketplace を検出していなければ、OpenClaw は `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` から標準バンドルの Codex Desktop marketplace を登録できます。ランタイムまたはコンピューター使用の設定を変更した後は、既存セッションが古い PI または Codex スレッドバインディングを保持しないように、`/new` または `/reset` を使用してください。

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

モデル切り替えは OpenClaw が制御します。OpenClaw セッションが既存の Codex スレッドに接続されている場合、次のターンは現在選択されている OpenAI モデル、プロバイダー、承認ポリシー、サンドボックス、サービス階層を app-server に再送信します。`openai/gpt-5.5` から `openai/gpt-5.2` に切り替えてもスレッドバインディングは維持されますが、新しく選択されたモデルで続行するよう Codex に要求します。

## Codex コマンド

バンドルされた Plugin は、認可済みスラッシュコマンドとして `/codex` を登録します。これは汎用であり、OpenClaw テキストコマンドをサポートする任意のチャンネルで動作します。

一般的な形式:

- `/codex status` は、ライブ app-server 接続、モデル、アカウント、レート制限、MCP サーバー、Skills を表示します。
- `/codex models` は、ライブ Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex スレッドに接続します。
- `/codex compact` は、接続されたスレッドをコンパクト化するよう Codex app-server に要求します。
- `/codex review` は、接続されたスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、接続されたスレッドの Codex 診断フィードバックを送信する前に確認します。
- `/codex computer-use status` は、設定済みのコンピューター使用 Plugin と MCP サーバーを確認します。
- `/codex computer-use install` は、設定済みのコンピューター使用 Plugin をインストールし、MCP サーバーを再読み込みします。
- `/codex account` は、アカウントとレート制限のステータスを表示します。
- `/codex mcp` は、Codex app-server MCP サーバーのステータスを一覧表示します。
- `/codex skills` は、Codex app-server skills を一覧表示します。

### 一般的なデバッグワークフロー

Codex バックエンドのエージェントが Telegram、Discord、Slack、または別のチャンネルで予期しないことをした場合は、問題が発生した会話から始めます。

1. `/diagnostics bad tool choice after image upload`、または見た内容を説明する別の短いメモを実行します。
2. 診断リクエストを一度承認します。承認によりローカル Gateway 診断 zip が作成され、セッションが Codex ハーネスを使用しているため、関連する Codex フィードバックバンドルも OpenAI サーバーに送信されます。
3. 完了した診断返信をバグレポートまたはサポートスレッドにコピーします。これには、ローカルバンドルパス、プライバシー概要、OpenClaw セッション ID、Codex スレッド ID、および各 Codex スレッドの `Inspect locally` 行が含まれます。
4. 実行を自分でデバッグしたい場合は、表示された `Inspect locally` コマンドをターミナルで実行します。これは `codex resume <thread-id>` のような形で、ネイティブ Codex スレッドを開くため、会話を調査したり、ローカルで続行したり、特定のツールや計画を選んだ理由を Codex に尋ねたりできます。

現在接続されているスレッドについて、完全な OpenClaw Gateway 診断バンドルなしで Codex フィードバックアップロードのみを明示的に行いたい場合にだけ、`/codex diagnostics [note]` を使用してください。ほとんどのサポートレポートでは、ローカル Gateway 状態と Codex スレッド ID を 1 つの返信にまとめられるため、`/diagnostics [note]` がより良い開始点です。完全なプライバシーモデルとグループチャットでの動作については、[診断エクスポート](/ja-JP/gateway/diagnostics) を参照してください。

OpenClaw コアは、一般的な Gateway 診断コマンドとして、所有者専用の `/diagnostics [note]` も公開しています。その承認プロンプトには、機密データの前置き、[診断エクスポート](/ja-JP/gateway/diagnostics) へのリンクが表示され、毎回明示的な exec 承認を通じて `openclaw gateway diagnostics export --json` を要求します。allow-all ルールで診断を承認しないでください。承認後、OpenClaw はローカルバンドルパスとマニフェスト概要を含む貼り付け可能なレポートを送信します。アクティブな OpenClaw セッションが Codex ハーネスを使用している場合、その同じ承認により、関連する Codex フィードバックバンドルを OpenAI サーバーに送信することも認可されます。承認プロンプトには Codex フィードバックが送信されることが記載されますが、承認前には Codex セッション ID やスレッド ID は一覧表示されません。

`/diagnostics` がグループチャットで所有者によって呼び出された場合、OpenClaw は共有チャンネルをクリーンに保ちます。グループには短い通知のみが送られ、診断の前置き、承認プロンプト、Codex セッション/スレッド ID はプライベート承認ルート経由で所有者に送信されます。プライベート所有者ルートがない場合、OpenClaw はグループリクエストを拒否し、DM から実行するよう所有者に求めます。

承認された Codex アップロードは Codex app-server の `feedback/upload` を呼び出し、利用可能な場合は、リストされた各スレッドと生成された Codex サブスレッドのログを含めるよう app-server に要求します。アップロードは Codex の通常のフィードバック経路を通じて OpenAI サーバーへ送信されます。その app-server で Codex フィードバックが無効になっている場合、コマンドは app-server エラーを返します。完了した診断の返信には、送信されたスレッドについて、チャンネル、OpenClaw セッション ID、Codex スレッド ID、ローカルの `codex resume <thread-id>` コマンドが一覧表示されます。承認を拒否または無視した場合、OpenClaw はそれらの Codex ID を出力しません。このアップロードはローカルの Gateway 診断エクスポートを置き換えるものではありません。

`/codex resume` は、通常のターンでハーネスが使用するものと同じサイドカーのバインディングファイルを書き込みます。次のメッセージで、OpenClaw はその Codex スレッドを再開し、現在選択されている OpenClaw モデルを app-server に渡し、拡張履歴を有効なままにします。

### CLI から Codex スレッドを調べる

問題のある Codex 実行を理解する最速の方法は、ネイティブの Codex スレッドを直接開くことです。

```sh
codex resume <thread-id>
```

チャンネル会話でバグに気づき、問題の Codex セッションを調べる、ローカルで続行する、または特定のツールや推論の選択を行った理由を Codex に尋ねる場合に使用します。通常、最も簡単な方法は先に `/diagnostics [note]` を実行することです。承認後、完了したレポートには各 Codex スレッドが一覧表示され、たとえば `codex resume <thread-id>` のような `Inspect locally` コマンドが出力されます。そのコマンドをそのままターミナルにコピーできます。

現在のチャットについては `/codex binding` から、最近の Codex app-server スレッドについては `/codex threads [filter]` からスレッド ID を取得し、シェルで同じ `codex resume` コマンドを実行することもできます。

このコマンドサーフェスには Codex app-server `0.125.0` 以降が必要です。将来版またはカスタムの app-server がその JSON-RPC メソッドを公開していない場合、個々の制御メソッドは `unsupported by this Codex app-server` として報告されます。

## フック境界

Codex ハーネスには 3 つのフックレイヤーがあります。

| レイヤー                              | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin フック                 | OpenClaw                 | PI と Codex ハーネス間の製品/Plugin 互換性。                        |
| Codex app-server 拡張ミドルウェア | OpenClaw 同梱 Plugin | OpenClaw 動的ツール周辺のターンごとのアダプター動作。              |
| Codex ネイティブフック                    | Codex                    | Codex 設定からの低レベル Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、OpenClaw Plugin の動作をルーティングするためにプロジェクトまたはグローバルの Codex `hooks.json` ファイルを使用しません。サポートされるネイティブツールと権限ブリッジについては、OpenClaw は `PreToolUse`、`PostToolUse`、`PermissionRequest`、`Stop` 用のスレッド単位の Codex 設定を注入します。`SessionStart` や `UserPromptSubmit` など、その他の Codex フックは Codex レベルの制御のままです。これらは v1 コントラクトでは OpenClaw Plugin フックとして公開されません。

OpenClaw 動的ツールについては、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、OpenClaw はハーネスアダプター内で所有する Plugin とミドルウェアの動作を発火します。Codex ネイティブツールについては、Codex が正規のツールレコードを所有します。OpenClaw は選択されたイベントをミラーできますが、Codex が app-server またはネイティブフックコールバックを通じてその操作を公開しない限り、ネイティブ Codex スレッドを書き換えることはできません。

Compaction と LLM ライフサイクルの投影は、ネイティブ Codex フックコマンドではなく、Codex app-server 通知と OpenClaw アダプター状態から得られます。OpenClaw の `before_compaction`、`after_compaction`、`llm_input`、`llm_output` イベントはアダプターレベルの観測であり、Codex 内部のリクエストまたは Compaction ペイロードをバイト単位で取得したものではありません。

Codex ネイティブの `hook/started` と `hook/completed` app-server 通知は、軌跡とデバッグ用の `codex_app_server.hook` エージェントイベントとして投影されます。これらは OpenClaw Plugin フックを呼び出しません。

## V1 サポートコントラクト

Codex モードは、内部のモデル呼び出しだけを変更した PI ではありません。Codex はネイティブモデルループのより多くを所有し、OpenClaw はその境界に合わせて Plugin とセッションサーフェスを適応させます。

Codex ランタイム v1 でサポートされるもの:

| サーフェス                                      | サポート                                | 理由                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex 経由の OpenAI モデルループ               | サポート                                | Codex app-server が OpenAI ターン、ネイティブスレッドの再開、ネイティブツールの継続を所有します。                                                                                                     |
| OpenClaw チャンネルルーティングと配信         | サポート                                | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャンネルはモデルランタイムの外側に留まります。                                                                                              |
| OpenClaw 動的ツール                        | サポート                                | Codex が OpenClaw にこれらのツールの実行を依頼するため、OpenClaw は実行経路に留まります。                                                                                                             |
| プロンプトとコンテキストの Plugin                    | サポート                                | OpenClaw はスレッドの開始または再開前に、プロンプトオーバーレイを構築し、コンテキストを Codex ターンへ投影します。                                                                                  |
| コンテキストエンジンのライフサイクル                      | サポート                                | Codex ターンでは、組み立て、取り込みまたはターン後メンテナンス、コンテキストエンジンの Compaction 調整が実行されます。                                                                              |
| 動的ツールフック                            | サポート                                | `before_tool_call`、`after_tool_call`、およびツール結果ミドルウェアは、OpenClaw が所有する動的ツールの周辺で実行されます。                                                                            |
| ライフサイクルフック                              | アダプター観測としてサポート       | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は、Codex モードに忠実なペイロードで発火します。                                                                       |
| 最終回答の修正ゲート                    | ネイティブフックリレー経由でサポート | Codex `Stop` は `before_agent_finalize` に中継されます。`revise` は最終化前にもう 1 回モデルパスを行うよう Codex に要求します。                                                                        |
| ネイティブ shell、patch、MCP のブロックまたは観測 | ネイティブフックリレー経由でサポート | Codex `PreToolUse` と `PostToolUse` は、Codex app-server `0.125.0` 以降の MCP ペイロードを含む、コミット済みのネイティブツールサーフェスに中継されます。ブロックはサポートされますが、引数の書き換えはサポートされません。 |
| ネイティブ権限ポリシー                      | ネイティブフックリレー経由でサポート | Codex `PermissionRequest` は、ランタイムが公開する場合、OpenClaw ポリシーを通じてルーティングできます。OpenClaw が判断を返さない場合、Codex は通常のガーディアンまたはユーザー承認経路を続行します。     |
| App-server 軌跡キャプチャ                 | サポート                                | OpenClaw は app-server に送信したリクエストと、受信した app-server 通知を記録します。                                                                                                                |

Codex ランタイム v1 でサポートされないもの:

| サーフェス                                             | V1 境界                                                                                                                                     | 将来の経路                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ネイティブツール引数の変更                       | Codex ネイティブのプリツールフックはブロックできますが、OpenClaw は Codex ネイティブツールの引数を書き換えません。                                               | 置換ツール入力のための Codex フック/スキーマサポートが必要です。                            |
| 編集可能な Codex ネイティブのトランスクリプト履歴            | Codex が正規のネイティブスレッド履歴を所有します。OpenClaw はミラーを所有し、将来のコンテキストを投影できますが、サポートされていない内部状態を変更すべきではありません。 | ネイティブスレッドの手術が必要な場合は、明示的な Codex app-server API を追加します。                    |
| Codex ネイティブツールレコード用の `tool_result_persist` | そのフックは OpenClaw が所有するトランスクリプト書き込みを変換するものであり、Codex ネイティブツールレコードを変換するものではありません。                                                           | 変換済みレコードをミラーすることは可能ですが、正規の書き換えには Codex のサポートが必要です。              |
| リッチなネイティブ Compaction メタデータ                     | OpenClaw は Compaction の開始と完了を観測しますが、安定した保持/破棄リスト、トークン差分、または要約ペイロードを受け取りません。            | よりリッチな Codex Compaction イベントが必要です。                                                     |
| Compaction への介入                             | 現在の OpenClaw Compaction フックは Codex モードでは通知レベルです。                                                                         | Plugin がネイティブ Compaction を拒否または書き換える必要がある場合は、Codex の Compaction 前後フックを追加します。 |
| バイト単位のモデル API リクエストキャプチャ             | OpenClaw は app-server リクエストと通知をキャプチャできますが、Codex core が最終的な OpenAI API リクエストを内部で構築します。                      | Codex モデルリクエストトレースイベントまたはデバッグ API が必要です。                                   |

## ツール、メディア、Compaction

Codex ハーネスは低レベルの埋め込みエージェント実行器のみを変更します。

OpenClaw は引き続きツールリストを構築し、ハーネスから動的ツール結果を受け取ります。テキスト、画像、動画、音楽、TTS、承認、メッセージングツールの出力は、通常の OpenClaw 配信経路を引き続き通過します。

ネイティブフックリレーは意図的に汎用的ですが、v1 サポートコントラクトは OpenClaw がテストする Codex ネイティブツールおよび権限経路に限定されています。Codex ランタイムでは、これに shell、patch、MCP の `PreToolUse`、`PostToolUse`、`PermissionRequest` ペイロードが含まれます。ランタイムコントラクトが名前を挙げるまでは、将来のすべての Codex フックイベントが OpenClaw Plugin サーフェスであると想定しないでください。

`PermissionRequest` について、OpenClaw はポリシーが判断した場合にのみ、明示的な許可または拒否の判断を返します。判断なしの結果は許可ではありません。Codex はそれをフック判断なしとして扱い、独自のガーディアンまたはユーザー承認経路にフォールスルーします。

Codex MCP ツール承認の聞き取りは、Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` としてマークした場合、OpenClaw の Plugin 承認フローを通じてルーティングされます。Codex の `request_user_input` プロンプトは元のチャットに送信され、次にキューに入ったフォローアップメッセージは追加コンテキストとして誘導されるのではなく、そのネイティブサーバーリクエストへの回答になります。その他の MCP 聞き取りリクエストは引き続きフェイルクローズされます。

Active-run キューのステアリングは、Codex app-server の `turn/steer` に対応します。
デフォルトの `messages.queue.mode: "steer"` では、OpenClaw は設定された静音ウィンドウの間、キューに入ったチャットメッセージをまとめ、到着順に 1 つの `turn/steer` リクエストとして送信します。レガシーの `queue` モードでは、個別の `turn/steer` リクエストを送信します。Codex のレビューターンと手動 Compaction ターンでは、同一ターンのステアリングが拒否される場合があります。その場合、選択されたモードがフォールバックを許可していれば、OpenClaw はフォローアップキューを使用します。[ステアリングキュー](/ja-JP/concepts/queue-steering)を参照してください。

選択されたモデルが Codex ハーネスを使用する場合、ネイティブスレッドの Compaction は Codex app-server に委譲されます。OpenClaw は、チャンネル履歴、検索、`/new`、`/reset`、および将来のモデルまたはハーネスの切り替えのために、トランスクリプトのミラーを保持します。このミラーには、ユーザープロンプト、最終的なアシスタントテキスト、および app-server が出力した場合の軽量な Codex 推論またはプラン記録が含まれます。現時点では、OpenClaw はネイティブ Compaction の開始シグナルと完了シグナルのみを記録します。人間が読める Compaction サマリーや、Compaction 後に Codex が保持したエントリの監査可能な一覧は、まだ公開していません。

Codex が正規のネイティブスレッドを所有しているため、`tool_result_persist` は現在 Codex ネイティブのツール結果レコードを書き換えません。これは、OpenClaw が OpenClaw 所有のセッショントランスクリプトのツール結果を書き込む場合にのみ適用されます。

メディア生成に PI は不要です。画像、動画、音楽、PDF、TTS、およびメディア理解は、引き続き `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts` など、対応するプロバイダー/モデル設定を使用します。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** 新しい設定では想定どおりです。`agentRuntime.id: "codex"` を指定した `openai/gpt-*` モデル（またはレガシーの `codex/*` 参照）を選択し、`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく PI を使用する:** `agentRuntime.id: "auto"` では、実行を要求する Codex ハーネスがない場合、互換性バックエンドとして PI を引き続き使用できます。テスト中に Codex の選択を強制するには、`agentRuntime.id: "codex"` を設定してください。強制された Codex ランタイムは、`agentRuntime.fallback: "pi"` を明示的に設定しない限り、PI にフォールバックせず失敗するようになりました。Codex app-server が選択されると、その失敗は追加のフォールバック設定なしで直接表面化します。

**app-server が拒否される:** app-server ハンドシェイクがバージョン `0.125.0` 以降を報告するように Codex をアップグレードしてください。`0.125.0-alpha.2` や `0.125.0+custom` のような同一バージョンのプレリリースまたはビルドサフィックス付きバージョンは拒否されます。OpenClaw がテストするのは安定版 `0.125.0` のプロトコル下限だからです。

**モデル探索が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、探索を無効にしてください。

**WebSocket トランスポートがすぐに失敗する:** `appServer.url`、`authToken`、およびリモート app-server が同じ Codex app-server プロトコルバージョンを話すことを確認してください。

**非 Codex モデルが PI を使用する:** そのエージェントに対して `agentRuntime.id: "codex"` を強制した場合、またはレガシーの `codex/*` 参照を選択した場合を除き、これは想定どおりです。プレーンな `openai/gpt-*` やその他のプロバイダー参照は、`auto` モードでは通常のプロバイダーパスに留まります。`agentRuntime.id: "codex"` を強制した場合、そのエージェントのすべての埋め込みターンは Codex がサポートする OpenAI モデルである必要があります。

**Computer Use はインストールされているがツールが実行されない:** 新しいセッションから `/codex computer-use status` を確認してください。ツールが `Native hook relay unavailable` を報告する場合は、`/new` または `/reset` を使用してください。それでも続く場合は、Gateway を再起動して古いネイティブフック登録をクリアしてください。`computer-use.list_apps` がタイムアウトする場合は、Codex Computer Use または Codex Desktop を再起動してから再試行してください。

## 関連

- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [ステータス](/ja-JP/cli/status)
- [Plugin フック](/ja-JP/plugins/hooks)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
