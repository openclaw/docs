---
read_when:
    - バンドルされた Codex app-server ハーネスを使用したい場合
    - Codexハーネス設定例が必要です
    - Codex 専用のデプロイが PI にフォールバックせずに失敗するようにしたい場合
summary: 同梱の Codex app-server ハーネス経由で OpenClaw 埋め込みエージェントのターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-05-07T01:53:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 484f32d9b73632827ee0ce3963ddbead784196fb36ff089632d0f622f1cecdf7
    source_path: plugins/codex-harness.md
    workflow: 16
---

バンドルされた `codex` Plugin により、OpenClaw は組み込みの PI ハーネスではなく Codex app-server 経由で埋め込みエージェントターンを実行できます。

低レベルのエージェントセッションを Codex に所有させたい場合にこれを使います。対象には、モデル検出、ネイティブスレッド再開、ネイティブ compaction、app-server 実行が含まれます。OpenClaw は引き続きチャットチャネル、セッションファイル、モデル選択、ツール、承認、メディア配信、表示されるトランスクリプトミラーを所有します。

ソースチャットターンが Codex ハーネス経由で実行される場合、デプロイが `messages.visibleReplies` を明示的に設定していないと、表示される返信はデフォルトで OpenClaw の `message` ツールになります。エージェントは Codex ターンを非公開で終了することもできます。チャネルに投稿されるのは `message(action="send")` を呼び出したときだけです。ダイレクトチャットの最終返信を従来の自動配信経路に維持するには、`messages.visibleReplies: "automatic"` を設定します。

Codex heartbeat ターンには、デフォルトで `heartbeat_respond` ツールも渡されます。そのためエージェントは、最終テキストにその制御フローをエンコードせずに、ウェイクを静かなままにするか通知するかを記録できます。

Heartbeat 固有の主体性ガイダンスは、その heartbeat ターン自体に Codex コラボレーションモードの開発者指示として送信されます。通常のチャットターンでは、通常のランタイムプロンプトに heartbeat の考え方を持ち込むのではなく、Codex Default モードに戻します。

全体像を把握したい場合は、[エージェントランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。要約すると、`openai/gpt-5.5` がモデル参照、`codex` がランタイムであり、Telegram、Discord、Slack、または別のチャネルが通信サーフェスのままです。

## クイック設定

「OpenClaw の中で Codex」を使いたいほとんどのユーザーが求めているのは、この経路です。ChatGPT/Codex サブスクリプションでサインインし、その後ネイティブ Codex app-server ランタイム経由で埋め込みエージェントターンを実行します。モデル参照は引き続き `openai/gpt-*` として正規のままです。サブスクリプション認証は Codex アカウント/プロファイルから来るもので、`openai-codex/*` モデルプレフィックスから来るものではありません。

まだ実行していない場合は、まず Codex OAuth でサインインします。

```bash
openclaw models auth login --provider openai-codex
```

次に、バンドルされた `codex` Plugin を有効にし、Codex ランタイムを強制します。

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

設定で `openai-codex/gpt-*` を使用しないでください。このプレフィックスはレガシー経路であり、`openclaw doctor --fix` がプライマリモデル、フォールバック、heartbeat/subagent/compaction オーバーライド、フック、チャネルオーバーライド、古い永続化済みセッション経路ピン全体で `openai/gpt-*` に書き換えます。

## このPluginによる変更点

バンドルされた `codex` Plugin は、複数の独立した機能を提供します。

| 機能                              | 使用方法                                            | 動作内容                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| ネイティブ埋め込みランタイム      | `agentRuntime.id: "codex"`                          | OpenClaw の埋め込みエージェントターンを Codex app-server 経由で実行します。  |
| ネイティブチャット制御コマンド    | `/codex bind`, `/codex resume`, `/codex steer`, ... | メッセージング会話から Codex app-server スレッドをバインドおよび制御します。 |
| Codex app-server プロバイダー/カタログ | `codex` 内部、ハーネス経由で公開               | ランタイムが app-server モデルを検出し検証できるようにします。               |
| Codex メディア理解経路            | `codex/*` 画像モデル互換経路                       | 対応している画像理解モデル向けに、境界付けられた Codex app-server ターンを実行します。 |
| ネイティブフックリレー            | Codex ネイティブイベント周辺の Plugin フック        | OpenClaw が対応する Codex ネイティブのツール/ファイナライズイベントを観測/ブロックできるようにします。 |

Plugin を有効にすると、これらの機能が利用可能になります。ただし、次のことは**行いません**。

- すべての OpenAI モデルで Codex を使い始める
- Codex がインストール済み、有効、`codex` ハーネスを提供、かつ OAuth 準備済みであることを doctor が検証せずに、`openai-codex/*` モデル参照をネイティブランタイムへ変換する
- ACP/acpx をデフォルトの Codex 経路にする
- PI ランタイムをすでに記録している既存セッションをホットスイッチする
- OpenClaw のチャネル配信、セッションファイル、認証プロファイルストレージ、またはメッセージルーティングを置き換える

同じ Plugin は、ネイティブ `/codex` チャット制御コマンドサーフェスも所有します。Plugin が有効で、ユーザーがチャットから Codex スレッドのバインド、再開、操作、停止、または検査を求めた場合、エージェントは ACP よりも `/codex ...` を優先する必要があります。ACP は、ユーザーが ACP/acpx を求めている場合、または ACP Codex アダプターをテストしている場合の明示的なフォールバックのままです。

ネイティブ Codex ターンでは、OpenClaw Plugin フックを公開互換レイヤーとして維持します。これらはインプロセスの OpenClaw フックであり、Codex の `hooks.json` コマンドフックではありません。

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` ミラーされたトランスクリプトレコード用
- Codex `Stop` リレー経由の `before_agent_finalize`
- `agent_end`

Plugin は、ランタイム中立のツール結果ミドルウェアも登録でき、OpenClaw がツールを実行した後、結果が Codex に返される前に OpenClaw の動的ツール結果を書き換えられます。これは、OpenClaw が所有するトランスクリプトのツール結果書き込みを変換する公開 `tool_result_persist` Plugin フックとは別です。

Plugin フックのセマンティクス自体については、[Plugin フック](/ja-JP/plugins/hooks) と [Plugin ガード動作](/ja-JP/tools/plugin) を参照してください。

ハーネスはデフォルトでオフです。新しい設定では、OpenAI モデル参照を `openai/gpt-*` として正規のままにし、ネイティブ app-server 実行が必要な場合は `agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex` を明示的に強制する必要があります。レガシー `codex/*` モデル参照は互換性のために引き続きハーネスを自動選択しますが、ランタイムに裏付けられたレガシープロバイダープレフィックスは通常のモデル/プロバイダー選択肢として表示されません。

設定済みモデル経路がまだ `openai-codex/*` の場合、`openclaw doctor --fix` はそれを `openai/*` に書き換えます。一致するエージェント経路については、Codex Plugin がインストール済み、有効、`codex` ハーネスを提供、かつ利用可能な OAuth を持つ場合にのみ、エージェントランタイムを `codex` に設定します。それ以外の場合はランタイムを `pi` に設定します。

## 経路マップ

設定を変更する前に、この表を使用してください。

| 望む動作                                             | モデル参照                 | ランタイム設定                         | 認証/プロファイル経路       | 期待されるステータスラベル   |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| ネイティブ Codex ランタイムを使う ChatGPT/Codex サブスクリプション | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth または Codex アカウント | `Runtime: OpenAI Codex`        |
| 通常の OpenClaw ランナー経由の OpenAI API            | `openai/gpt-*`             | 省略または `runtime: "pi"`             | OpenAI API キー              | `Runtime: OpenClaw Pi Default` |
| doctor 修復が必要なレガシー設定                      | `openai-codex/gpt-*`       | `codex` または `pi` に修復             | 既存の設定済み認証           | `doctor --fix` 後に再確認      |
| 保守的な自動モードを使う混在プロバイダー             | プロバイダー固有の参照     | `agentRuntime.id: "auto"`              | 選択されたプロバイダーごと   | 選択されたランタイムによる     |
| 明示的な Codex ACP アダプターセッション              | ACP プロンプト/モデル依存  | `sessions_spawn` with `runtime: "acp"` | ACP バックエンド認証         | ACP タスク/セッションステータス |

重要な分岐は、プロバイダーとランタイムです。

- `openai-codex/*` は doctor が書き換えるレガシー経路です。
- `agentRuntime.id: "codex"` には Codex ハーネスが必要で、利用できない場合は閉じた状態で失敗します。
- `agentRuntime.id: "auto"` では、登録済みハーネスが一致するプロバイダー経路を要求できます。ただし、正規の OpenAI 参照は、そのプロバイダー/モデルの組み合わせをサポートするハーネスがない限り、引き続き PI 所有です。
- `/codex ...` は「このチャットはどのネイティブ Codex 会話にバインドまたは制御するべきか」に答えます。
- ACP は「acpx はどの外部ハーネスプロセスを起動するべきか」に答えます。

## 適切なモデルプレフィックスを選ぶ

OpenAI ファミリーの経路はプレフィックス固有です。一般的なサブスクリプションとネイティブ Codex ランタイムのセットアップでは、`agentRuntime.id: "codex"` とともに `openai/*` を使用します。`openai-codex/*` は doctor が書き換えるべきレガシー設定として扱ってください。

| モデル参照                                    | ランタイム経路                               | 使用する場合                                                              |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI 配管経由の OpenAI プロバイダー   | `OPENAI_API_KEY` を使って現在の直接 OpenAI Platform API アクセスが必要な場合。 |
| `openai-codex/gpt-5.5`                        | doctor によって修復されるレガシー経路        | 古い設定を使っている場合。書き換えるには `openclaw doctor --fix` を実行します。 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server ハーネス                    | ChatGPT/Codex サブスクリプション認証とネイティブ Codex 実行が必要な場合。 |

GPT-5.5 は、アカウントが公開している場合、直接 OpenAI API キー経路と Codex サブスクリプション経路の両方に現れることがあります。ネイティブ Codex ランタイムには Codex app-server ハーネスとともに `openai/gpt-5.5` を使用し、直接 API キートラフィックには Codex ランタイムオーバーライドなしで `openai/gpt-5.5` を使用します。

レガシー `codex/gpt-*` 参照は互換エイリアスとして引き続き受け付けられます。Doctor 互換移行は、レガシーランタイム参照を正規のモデル参照に書き換え、ランタイムポリシーを別に記録します。新しいネイティブ app-server ハーネス設定では、`openai/gpt-*` と `agentRuntime.id: "codex"` を使用する必要があります。

`agents.defaults.imageModel` も同じプレフィックス分岐に従います。通常の OpenAI 経路には `openai/gpt-*` を使用し、画像理解を境界付けられた Codex app-server ターン経由で実行する場合は `codex/gpt-*` を使用します。`openai-codex/gpt-*` は使用しないでください。doctor はそのレガシープレフィックスを `openai/gpt-*` に書き換えます。Codex app-server モデルは画像入力サポートを広告している必要があります。テキスト専用 Codex モデルは、メディアターンが開始する前に失敗します。

現在のセッションで有効なハーネスを確認するには `/status` を使用します。選択が予想外の場合は、`agents/harness` サブシステムのデバッグログを有効にし、gateway の構造化された `agent harness selected` レコードを調べます。そこには、選択されたハーネス ID、選択理由、ランタイム/フォールバックポリシー、および `auto` モードでは各 Plugin 候補のサポート結果が含まれます。

### doctor 警告の意味

設定済みモデル参照または永続化済みセッション経路状態がまだ `openai-codex/*` を使用している場合、`openclaw doctor` は警告します。`openclaw doctor --fix` はそれらの経路を次のように書き換えます。

- `openai/<model>`
- Codex がインストール済み、有効、`codex` ハーネスを提供、かつ利用可能な OAuth を持つ場合は `agentRuntime.id: "codex"`
- それ以外の場合は `agentRuntime.id: "pi"`

`codex` 経路はネイティブ Codex ハーネスを強制します。`pi` 経路は、レガシー経路のクリーンアップの副作用として Codex を有効化またはインストールするのではなく、エージェントをデフォルトの OpenClaw ランナー上に維持します。
Doctor は、検出されたエージェントセッションストア全体の古い永続化済みセッションピンも修復するため、古い会話が削除済み経路に固定されたままになりません。

ハーネス選択はライブセッションの制御ではありません。埋め込みターンが実行されると、OpenClaw はそのセッションに選択されたハーネス ID を記録し、同じセッション ID の後続ターンでもそれを使い続けます。今後のセッションで別のハーネスを使いたい場合は `agentRuntime` 設定または `OPENCLAW_AGENT_RUNTIME` を変更してください。既存の会話を PI と Codex の間で切り替える前に、新しいセッションを開始するには `/new` または `/reset` を使います。これにより、1 つのトランスクリプトを互換性のない 2 つのネイティブセッションシステムで再生することを避けられます。

ハーネス固定が導入される前に作成されたレガシーセッションは、トランスクリプト履歴を持つと PI 固定として扱われます。設定を変更した後、その会話を Codex に切り替えるには `/new` または `/reset` を使ってください。

`/status` は有効なモデルランタイムを表示します。デフォルトの PI ハーネスは `Runtime: OpenClaw Pi Default` として表示され、Codex app-server ハーネスは `Runtime: OpenAI Codex` として表示されます。

## 要件

- バンドルされた `codex` Plugin が利用可能な OpenClaw。
- Codex app-server `0.125.0` 以降。バンドルされた Plugin は、デフォルトで互換性のある Codex app-server バイナリを管理するため、`PATH` 上のローカル `codex` コマンドは通常のハーネス起動には影響しません。
- app-server プロセスまたは OpenClaw の Codex 認証ブリッジで Codex 認証が利用可能であること。ローカル app-server 起動では、各エージェントに OpenClaw 管理の Codex ホームと分離された子 `HOME` を使うため、デフォルトでは個人の `~/.codex` アカウント、Skills、プラグイン、設定、スレッド状態、ネイティブの `$HOME/.agents/skills` は読み取りません。

Plugin は、古いまたはバージョンなしの app-server ハンドシェイクをブロックします。これにより、OpenClaw はテスト済みのプロトコル面に保たれます。

ライブおよび Docker スモークテストでは、通常、認証は Codex CLI アカウントまたは OpenClaw の `openai-codex` 認証プロファイルから取得されます。ローカル stdio app-server 起動では、アカウントが存在しない場合に `CODEX_API_KEY` / `OPENAI_API_KEY` にフォールバックすることもできます。

## ワークスペースのブートストラップファイル

Codex はネイティブのプロジェクトドキュメント検出を通じて `AGENTS.md` 自体を処理します。OpenClaw は合成された Codex プロジェクトドキュメントファイルを書き込まず、ペルソナファイルのために Codex のフォールバックファイル名にも依存しません。Codex のフォールバックは `AGENTS.md` が存在しない場合にのみ適用されるためです。

OpenClaw のワークスペース互換性のために、Codex ハーネスは他のブートストラップファイル（存在する場合は `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）を解決し、`thread/start` と `thread/resume` の Codex 開発者指示として転送します。これにより、`AGENTS.md` を重複させずに、`SOUL.md` と関連するワークスペースのペルソナ/プロファイルコンテキストをネイティブの Codex 行動形成レーンで参照できるようにします。

## 他のモデルと並べて Codex を追加する

同じエージェントが Codex と非 Codex プロバイダーモデルを自由に切り替える必要がある場合、`agentRuntime.id: "codex"` をグローバルに設定しないでください。強制されたランタイムは、そのエージェントまたはセッションのすべての埋め込みターンに適用されます。そのランタイムが強制されている間に Anthropic モデルを選択した場合、OpenClaw は引き続き Codex ハーネスを試行し、そのターンを暗黙に PI 経由へルーティングするのではなく、クローズドに失敗します。

代わりに、次のいずれかの形を使ってください。

- `agentRuntime.id: "codex"` を持つ専用エージェントに Codex を配置する。
- デフォルトエージェントを `agentRuntime.id: "auto"` のままにし、通常の混在プロバイダー利用には PI フォールバックを使う。
- レガシーの `codex/*` 参照は互換性のためだけに使う。新しい設定では、`openai/*` と明示的な Codex ランタイムポリシーを優先する。

たとえば、これはデフォルトエージェントを通常の自動選択のままにし、別個の Codex エージェントを追加します。

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

この形では、次のようになります。

- デフォルトの `main` エージェントは通常のプロバイダーパスと PI 互換フォールバックを使う。
- `codex` エージェントは Codex app-server ハーネスを使う。
- `codex` エージェントで Codex が存在しない、またはサポートされていない場合、そのターンは静かに PI を使うのではなく失敗する。

## エージェントコマンドのルーティング

エージェントは、単語「Codex」だけではなく、意図によってユーザーリクエストをルーティングする必要があります。

| ユーザーが求めること... | エージェントが使うもの... |
| ------------------------------------------------------ | ------------------------------------------------ |
| 「このチャットを Codex にバインドして」 | `/codex bind` |
| 「Codex スレッド `<id>` をここで再開して」 | `/codex resume <id>` |
| 「Codex スレッドを表示して」 | `/codex threads` |
| 「問題のある Codex 実行についてサポートレポートを提出して」 | `/diagnostics [note]` |
| 「この添付スレッドについてだけ Codex フィードバックを送って」 | `/codex diagnostics [note]` |
| 「Codex ランタイムで自分の ChatGPT/Codex サブスクリプションを使って」 | `openai/*` と `agentRuntime.id: "codex"` |
| 「古い `openai-codex/*` 設定/セッション固定を修復して」 | `openclaw doctor --fix` |
| 「ACP/acpx 経由で Codex を実行して」 | ACP `sessions_spawn({ runtime: "acp", ... })` |
| 「Claude Code/Gemini/OpenCode/Cursor をスレッド内で開始して」 | ACP/acpx。`/codex` でもネイティブサブエージェントでもない |

OpenClaw は、ACP が有効で、ディスパッチ可能で、読み込まれたランタイムバックエンドに支えられている場合にのみ、ACP スポーンガイダンスをエージェントに通知します。ACP が利用できない場合、システムプロンプトと Plugin Skills は ACP ルーティングについてエージェントに教えるべきではありません。

## Codex 専用デプロイ

すべての埋め込みエージェントターンが Codex を使うことを証明する必要がある場合は、Codex ハーネスを強制します。明示的な Plugin ランタイムはクローズドに失敗し、PI 経由で暗黙に再試行されることはありません。

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
}
```

環境オーバーライド:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Codex が強制されている場合、Codex Plugin が無効、app-server が古すぎる、または app-server を起動できないと、OpenClaw は早期に失敗します。

## エージェントごとの Codex

デフォルトエージェントは通常の自動選択を維持しつつ、1 つのエージェントを Codex 専用にできます。

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
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

エージェントとモデルの切り替えには通常のセッションコマンドを使います。`/new` は新しい OpenClaw セッションを作成し、Codex ハーネスは必要に応じてサイドカー app-server スレッドを作成または再開します。`/reset` はそのスレッドの OpenClaw セッションバインドをクリアし、次のターンで現在の設定からハーネスを再度解決できるようにします。

## モデル検出

デフォルトでは、Codex Plugin は利用可能なモデルを app-server に問い合わせます。検出が失敗するかタイムアウトした場合、次のバンドル済みフォールバックカタログを使います。

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

`plugins.entries.codex.config.discovery` の下で検出を調整できます。

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

## App-server 接続とポリシー

デフォルトでは、Plugin は OpenClaw 管理の Codex バイナリをローカルで次のように起動します。

```bash
codex app-server --listen stdio://
```

管理対象バイナリは `codex` Plugin パッケージに同梱されています。これにより、app-server のバージョンは、ローカルにたまたまインストールされている別個の Codex CLI ではなく、バンドルされた Plugin に結び付けられます。別の実行ファイルを意図的に実行したい場合にのみ `appServer.command` を設定してください。

デフォルトでは、OpenClaw はローカル Codex ハーネスセッションを YOLO モードで開始します: `approvalPolicy: "never"`、`approvalsReviewer: "user"`、`sandbox: "danger-full-access"`。これは自律 Heartbeat に使われる信頼済みローカルオペレーター姿勢です。Codex は、応答できる人がいないネイティブ承認プロンプトで停止することなく、シェルとネットワークツールを使えます。

Codex のガーディアンレビュー承認を有効にするには、`appServer.mode:
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

Guardian モードは Codex のネイティブ自動レビュー承認パスを使います。Codex がサンドボックスを出る、ワークスペース外に書き込む、ネットワークアクセスなどの権限を追加する必要がある場合、Codex はその承認リクエストを人間向けプロンプトではなくネイティブレビュー担当にルーティングします。レビュー担当は Codex のリスクフレームワークを適用し、その特定のリクエストを承認または拒否します。YOLO モードより多くのガードレールが必要で、それでも無人エージェントを進める必要がある場合に Guardian を使ってください。

`guardian` プリセットは `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、`sandbox: "workspace-write"` に展開されます。個別のポリシーフィールドは引き続き `mode` を上書きするため、高度なデプロイではプリセットと明示的な選択を組み合わせられます。古い `guardian_subagent` レビュー担当値は互換エイリアスとして引き続き受け付けられますが、新しい設定では `auto_review` を使うべきです。

すでに実行中の app-server には、WebSocket トランスポートを使います。

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

Stdio app-server 起動はデフォルトで OpenClaw のプロセス環境を継承しますが、OpenClaw は Codex app-server アカウントブリッジを所有し、`CODEX_HOME` と `HOME` の両方を、そのエージェントの OpenClaw 状態配下にあるエージェントごとのディレクトリへ設定します。Codex 独自の Skill ローダーは `$CODEX_HOME/skills` と `$HOME/.agents/skills` を読むため、ローカル app-server 起動では両方の値が分離されます。これにより、Codex ネイティブの Skills、プラグイン、設定、アカウント、スレッド状態は、オペレーター個人の Codex CLI ホームから漏れ込むのではなく、OpenClaw エージェントにスコープされます。

OpenClaw プラグインと OpenClaw Skill スナップショットは、引き続き OpenClaw 独自の Plugin レジストリと Skill ローダーを通じて流れます。個人の Codex CLI アセットは流れません。OpenClaw エージェントの一部にすべき有用な Codex CLI Skills やプラグインがある場合は、明示的にインベントリしてください。

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex 移行プロバイダーは、Skills を現在の OpenClaw エージェントワークスペースにコピーします。Codex ネイティブのプラグイン、フック、設定ファイルは、コマンドを実行したり、MCP サーバーを公開したり、認証情報を保持したりする可能性があるため、自動的に有効化するのではなく、手動レビュー用に報告またはアーカイブされます。

認証は次の順序で選択されます。

1. エージェント用の明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex ホームにある app-server の既存アカウント。
3. ローカル stdio app-server 起動の場合のみ、app-server アカウントが存在せず OpenAI 認証がまだ必要なときに、`CODEX_API_KEY`、次に `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、生成された Codex 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーは埋め込みや直接の OpenAI モデルでは利用できる一方で、ネイティブ Codex app-server ターンが誤って API 経由で課金されることを防げます。
明示的な Codex API キープロファイルとローカル stdio 環境キーのフォールバックは、継承された子プロセス環境ではなく app-server ログインを使用します。WebSocket app-server 接続は Gateway 環境の API キーフォールバックを受け取りません。明示的な認証プロファイル、またはリモート app-server 自身のアカウントを使用してください。

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

`appServer.clearEnv` は、生成された Codex app-server 子プロセスにのみ影響します。

Codex 動的ツールのデフォルトは `native-first` プロファイルです。このモードでは、
OpenClaw は Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません。
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、および
`update_plan` です。メッセージング、セッション、メディア、
cron、ブラウザー、ノード、gateway、`heartbeat_respond`、`web_search` などの OpenClaw 統合ツールは引き続き利用できます。

サポートされるトップレベルの Codex plugin フィールド:

| フィールド                 | デフォルト     | 意味                                                                                         |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Codex app-server に OpenClaw 動的ツール一式を公開するには `"openclaw-compat"` を使用します。 |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server ターンから省略する追加の OpenClaw 動的ツール名。               |

サポートされる `appServer` フィールド:

| フィールド          | デフォルト                               | 意味                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` は Codex を生成します。`"websocket"` は `url` に接続します。                                                                                                                                                                             |
| `command`           | 管理対象の Codex バイナリ                    | stdio トランスポート用の実行可能ファイル。管理対象バイナリを使用する場合は未設定のままにし、明示的な上書きが必要な場合にのみ設定します。                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio トランスポート用の引数。                                                                                                                                                                                                       |
| `url`               | 未設定                                    | WebSocket app-server URL。                                                                                                                                                                                                            |
| `authToken`         | 未設定                                    | WebSocket トランスポート用の Bearer トークン。                                                                                                                                                                                                |
| `headers`           | `{}`                                     | 追加の WebSocket ヘッダー。                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | OpenClaw が継承環境を構築した後に、生成された stdio app-server プロセスから削除される追加の環境変数名。`CODEX_HOME` と `HOME` は、ローカル起動時の OpenClaw のエージェント単位の Codex 分離用に予約されています。 |
| `requestTimeoutMs`  | `60000`                                  | app-server 制御プレーン呼び出しのタイムアウト。                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | YOLO または guardian レビュー付き実行のプリセット。                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | スレッド開始/再開/ターンに送信されるネイティブ Codex 承認ポリシー。                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | スレッド開始/再開に送信されるネイティブ Codex サンドボックスモード。                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Codex にネイティブ承認プロンプトをレビューさせるには `"auto_review"` を使用します。`guardian_subagent` はレガシー別名として残ります。                                                                                                                         |
| `serviceTier`       | 未設定                                    | 任意の Codex app-server サービスティア: `"fast"`、`"flex"`、または `null`。無効なレガシー値は無視されます。                                                                                                                            |

OpenClaw 所有の動的ツール呼び出しは、`appServer.requestTimeoutMs` とは独立して制限されます。各 Codex `item/tool/call` リクエストは、30 秒以内に OpenClaw 応答を受け取る必要があります。タイムアウト時、OpenClaw はサポートされている場合はツールシグナルを中止し、失敗した動的ツール応答を Codex に返します。これにより、セッションを `processing` のまま残すのではなく、ターンを続行できます。

OpenClaw が Codex のターンスコープ app-server リクエストに応答した後、ハーネスは Codex がネイティブターンを `turn/completed` で完了することも期待します。その応答後に app-server が 60 秒間沈黙した場合、OpenClaw はベストエフォートで Codex ターンを中断し、診断タイムアウトを記録し、OpenClaw セッションレーンを解放します。これにより、後続のチャットメッセージが古いネイティブターンの後ろにキューイングされないようにします。

環境上書きはローカルテスト向けに引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` は、`appServer.command` が未設定の場合に管理対象バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、単発のローカルテストでは
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。反復可能なデプロイでは config が推奨されます。Codex ハーネス設定の他の部分と同じレビュー済みファイル内に plugin の動作を保持できるためです。

## コンピューター使用

コンピューター使用は専用のセットアップガイドで扱っています:
[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use)。

要約すると、OpenClaw はデスクトップ制御アプリを同梱せず、デスクトップアクション自体も実行しません。Codex app-server を準備し、
`computer-use` MCP サーバーが利用可能であることを確認したうえで、Codex モードのターン中は Codex にネイティブ MCP ツール呼び出しを処理させます。

Codex marketplace フロー外で TryCua ドライバーへ直接アクセスするには、
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` で
`cua-driver mcp` を登録します。Codex 所有のコンピューター使用と直接 MCP 登録の違いについては、[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use) を参照してください。

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

コンピューター使用は macOS 固有であり、Codex MCP サーバーがアプリを制御できるようになる前に、ローカル OS の権限が必要になる場合があります。`computerUse.enabled` が true で MCP サーバーが利用できない場合、Codex モードのターンは、ネイティブのコンピューター使用ツールなしで静かに実行されるのではなく、スレッド開始前に失敗します。marketplace の選択肢、リモートカタログの制限、ステータス理由、トラブルシューティングについては、[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use) を参照してください。

`computerUse.autoInstall` が true の場合、Codex がローカル marketplace をまだ検出していなければ、OpenClaw は
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` から標準の同梱 Codex Desktop marketplace を登録できます。ランタイムまたはコンピューター使用の config を変更した後は、既存セッションが古い PI または Codex スレッドバインディングを保持しないように、`/new` または `/reset` を使用してください。

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

Guardian レビュー付き Codex 承認:

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

モデル切り替えは引き続き OpenClaw が制御します。OpenClaw セッションが既存の Codex スレッドにアタッチされている場合、次のターンは現在選択されている
OpenAI モデル、プロバイダー、承認ポリシー、サンドボックス、サービスティアを app-server に再送信します。`openai/gpt-5.5` から `openai/gpt-5.2` に切り替えると、スレッドバインディングは維持しつつ、新しく選択されたモデルで続行するよう Codex に要求します。

## Codex コマンド

同梱 Plugin は、認可済みスラッシュコマンドとして `/codex` を登録します。これは汎用的で、OpenClaw テキストコマンドをサポートする任意のチャネルで動作します。

一般的な形式:

- `/codex status` は、ライブの app-server 接続、モデル、アカウント、レート制限、MCP サーバー、Skills を表示します。
- `/codex models` は、ライブの Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex スレッドに接続します。
- `/codex compact` は、接続中のスレッドを compact するよう Codex app-server に要求します。
- `/codex review` は、接続中のスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、接続中のスレッドについて Codex 診断フィードバックを送信する前に確認します。
- `/codex computer-use status` は、設定済みの Computer Use plugin と MCP サーバーを確認します。
- `/codex computer-use install` は、設定済みの Computer Use plugin をインストールし、MCP サーバーを再読み込みします。
- `/codex account` は、アカウントとレート制限の状態を表示します。
- `/codex mcp` は、Codex app-server MCP サーバーの状態を一覧表示します。
- `/codex skills` は、Codex app-server Skills を一覧表示します。

Codex が使用量制限の失敗を報告した場合、Codex が提供していれば、OpenClaw は次回の app-server リセット時刻を含めます。同じ会話で `/codex account` を使用して、現在のアカウントとレート制限ウィンドウを確認してください。

### 一般的なデバッグワークフロー

Codex で動作するエージェントが Telegram、Discord、Slack、または別のチャネルで予期しない動作をした場合は、問題が発生した会話から開始します。

1. `/diagnostics bad tool choice after image upload`、または見た内容を説明する別の短いメモを実行します。
2. 診断リクエストを一度承認します。承認によりローカル Gateway 診断 zip が作成され、セッションが Codex ハーネスを使用しているため、関連する Codex フィードバックバンドルも OpenAI サーバーに送信されます。
3. 完了した診断返信をバグレポートまたはサポートスレッドにコピーします。これには、ローカルバンドルパス、プライバシー概要、OpenClaw セッション ID、Codex スレッド ID、および各 Codex スレッドの `Inspect locally` 行が含まれます。
4. 実行を自分でデバッグしたい場合は、表示された `Inspect locally` コマンドをターミナルで実行します。これは `codex resume <thread-id>` のような形式で、ネイティブ Codex スレッドを開くため、会話を確認したり、ローカルで続行したり、特定のツールや計画を選択した理由を Codex に尋ねたりできます。

完全な OpenClaw Gateway 診断バンドルなしで、現在接続中のスレッドに対する Codex フィードバックアップロードだけが特に必要な場合にのみ、`/codex diagnostics [note]` を使用してください。ほとんどのサポートレポートでは、ローカル Gateway 状態と Codex スレッド ID を 1 つの返信にまとめられるため、`/diagnostics [note]` のほうが出発点として適しています。完全なプライバシーモデルとグループチャット動作については、[診断エクスポート](/ja-JP/gateway/diagnostics) を参照してください。

Core OpenClaw は、一般的な Gateway 診断コマンドとして、所有者専用の `/diagnostics [note]` も公開しています。その承認プロンプトには、機密データの前置き、[Diagnostics Export](/ja-JP/gateway/diagnostics) へのリンクが表示され、毎回明示的な exec 承認を通じて `openclaw gateway diagnostics export --json` を要求します。allow-all ルールで診断を承認しないでください。承認後、OpenClaw はローカルバンドルパスとマニフェスト概要を含む、貼り付け可能なレポートを送信します。アクティブな OpenClaw セッションが Codex ハーネスを使用している場合、その同じ承認により、関連する Codex フィードバックバンドルを OpenAI サーバーに送信することも許可されます。承認プロンプトには Codex フィードバックが送信されることが示されますが、承認前に Codex セッション ID やスレッド ID は一覧表示されません。

`/diagnostics` がグループチャットで所有者によって呼び出された場合、OpenClaw は共有チャネルをクリーンに保ちます。グループには短い通知だけが届き、診断の前置き、承認プロンプト、Codex セッション/スレッド ID はプライベート承認ルートを通じて所有者に送信されます。プライベートな所有者ルートがない場合、OpenClaw はグループリクエストを拒否し、DM から実行するよう所有者に求めます。

承認された Codex アップロードは、Codex app-server の `feedback/upload` を呼び出し、利用可能な場合は、一覧にある各スレッドと生成された Codex サブスレッドのログを含めるよう app-server に要求します。アップロードは Codex の通常のフィードバック経路を通じて OpenAI サーバーに送信されます。その app-server で Codex フィードバックが無効になっている場合、コマンドは app-server エラーを返します。完了した診断返信には、送信されたスレッドのチャネル、OpenClaw セッション ID、Codex スレッド ID、ローカルの `codex resume <thread-id>` コマンドが一覧表示されます。承認を拒否または無視した場合、OpenClaw はそれらの Codex ID を表示しません。このアップロードはローカル Gateway 診断エクスポートを置き換えるものではありません。

`/codex resume` は、ハーネスが通常のターンで使用するものと同じ sidecar バインディングファイルを書き込みます。次のメッセージで、OpenClaw はその Codex スレッドを再開し、現在選択されている OpenClaw モデルを app-server に渡し、拡張履歴を有効なままにします。

### CLI から Codex スレッドを確認する

不具合のある Codex 実行を理解する最速の方法は、多くの場合、ネイティブ Codex スレッドを直接開くことです。

```sh
codex resume <thread-id>
```

チャネル会話でバグに気づき、問題のある Codex セッションを確認したい、ローカルで続行したい、または特定のツールや推論の選択をした理由を Codex に尋ねたい場合に使用します。通常、最も簡単な方法は、まず `/diagnostics [note]` を実行することです。承認後、完了したレポートには各 Codex スレッドが一覧表示され、たとえば `codex resume <thread-id>` のような `Inspect locally` コマンドが出力されます。そのコマンドを直接ターミナルにコピーできます。

現在のチャットについては `/codex binding` から、最近の Codex app-server スレッドについては `/codex threads [filter]` からスレッド ID を取得し、同じ `codex resume` コマンドをシェルで実行することもできます。

このコマンドサーフェスには Codex app-server `0.125.0` 以降が必要です。将来版またはカスタム app-server がその JSON-RPC メソッドを公開していない場合、個々の制御メソッドは `unsupported by this Codex app-server` として報告されます。

## フック境界

Codex ハーネスには 3 つのフック層があります。

| 層                                    | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin フック                | OpenClaw                 | PI と Codex ハーネス全体にわたる製品/Plugin 互換性。                |
| Codex app-server 拡張ミドルウェア     | OpenClaw バンドル Plugin | OpenClaw 動的ツール周辺のターンごとのアダプター動作。              |
| Codex ネイティブフック                | Codex                    | Codex 設定からの低レベル Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、OpenClaw Plugin の動作をルーティングするために、プロジェクトまたはグローバルの Codex `hooks.json` ファイルを使用しません。サポートされているネイティブツールと権限ブリッジでは、OpenClaw は `PreToolUse`、`PostToolUse`、`PermissionRequest`、`Stop` に対するスレッド単位の Codex 設定を注入します。Codex app-server 承認が有効な場合（`approvalPolicy` が `"never"` ではない場合）、デフォルトで注入されるネイティブフック設定では `PermissionRequest` が省略されるため、Codex の app-server レビュアーと OpenClaw の承認ブリッジが、レビュー後の実際のエスカレーションを処理します。互換性リレーが必要な場合、オペレーターは引き続き `nativeHookRelay.events` に `permission_request` を明示的に追加できます。`SessionStart` や `UserPromptSubmit` などの他の Codex フックは Codex レベルの制御のままであり、v1 契約では OpenClaw Plugin フックとして公開されません。

OpenClaw 動的ツールでは、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、OpenClaw はハーネスアダプター内で、自身が所有する Plugin とミドルウェアの動作を発火します。Codex ネイティブツールでは、Codex が標準のツールレコードを所有します。OpenClaw は選択されたイベントをミラーできますが、Codex が app-server またはネイティブフックコールバックを通じてその操作を公開しない限り、ネイティブ Codex スレッドを書き換えることはできません。

Compaction と LLM ライフサイクル投影は、ネイティブ Codex フックコマンドではなく、Codex app-server 通知と OpenClaw アダプター状態から得られます。OpenClaw の `before_compaction`、`after_compaction`、`llm_input`、`llm_output` イベントはアダプターレベルの観測であり、Codex の内部リクエストまたは Compaction ペイロードのバイト単位のキャプチャではありません。

Codex ネイティブの `hook/started` および `hook/completed` app-server 通知は、軌跡とデバッグのために `codex_app_server.hook` エージェントイベントとして投影されます。これらは OpenClaw Plugin フックを呼び出しません。

## V1 サポート契約

Codex モードは、下層のモデル呼び出しだけが異なる PI ではありません。Codex はネイティブモデルループのより多くを所有し、OpenClaw はその境界に合わせて Plugin とセッションサーフェスを適応させます。

Codex runtime v1 でサポートされます:

| サーフェス                                       | サポート                                                                              | 理由                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex 経由の OpenAI モデルループ               | サポート済み                                                                            | Codex app-server が OpenAI ターン、ネイティブなスレッド再開、ネイティブなツール継続を所有します。                                                                                                                 |
| OpenClaw チャネルのルーティングと配信         | サポート済み                                                                            | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャネルはモデルランタイムの外側に留まります。                                                                                                           |
| OpenClaw 動的ツール                        | サポート済み                                                                            | Codex は OpenClaw にこれらのツールの実行を依頼するため、OpenClaw は実行パス内に留まります。                                                                                                                       |
| プロンプトとコンテキストの plugins                    | サポート済み                                                                            | OpenClaw はプロンプトオーバーレイを構築し、スレッドを開始または再開する前に Codex ターンへコンテキストを投影します。                                                                                           |
| コンテキストエンジンのライフサイクル                      | サポート済み                                                                            | Codex ターンでは、組み立て、取り込みまたはターン後の保守、コンテキストエンジンの Compaction 調整が実行されます。                                                                                                |
| 動的ツールフック                            | サポート済み                                                                            | `before_tool_call`、`after_tool_call`、およびツール結果ミドルウェアは、OpenClaw 所有の動的ツールの前後で実行されます。                                                                                                 |
| ライフサイクルフック                               | アダプター観測としてサポート済み                                                    | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は、正確な Codex モードのペイロードで発火します。                                                                                  |
| 最終回答の修正ゲート                    | ネイティブフックリレー経由でサポート済み                                              | Codex `Stop` は `before_agent_finalize` に中継され、`revise` は確定前にもう一度モデルパスを実行するよう Codex に依頼します。                                                                                       |
| ネイティブ shell、patch、MCP のブロックまたは観測 | ネイティブフックリレー経由でサポート済み                                              | Codex `PreToolUse` と `PostToolUse` は、Codex app-server `0.125.0` 以降の MCP ペイロードを含む、コミット済みのネイティブツールサーフェス向けに中継されます。ブロックはサポートされますが、引数の書き換えはサポートされません。      |
| ネイティブ権限ポリシー                      | Codex app-server の承認と互換性ネイティブフックリレー経由でサポート済み | Codex app-server の承認リクエストは、Codex レビュー後に OpenClaw 経由でルーティングされます。`PermissionRequest` ネイティブフックリレーは、Codex が guardian レビュー前にそれを発行するため、ネイティブ承認モードではオプトインです。 |
| App-server 軌跡キャプチャ                 | サポート済み                                                                            | OpenClaw は、app-server に送信したリクエストと、受信した app-server 通知を記録します。                                                                                                           |

Codex ランタイム v1 でサポートされないもの:

| サーフェス                                             | V1 境界                                                                                                                                     | 今後の方向性                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ネイティブツール引数の変更                       | Codex ネイティブ pre-tool フックはブロックできますが、OpenClaw は Codex ネイティブツールの引数を書き換えません。                                               | 置換ツール入力のための Codex フック/schema サポートが必要です。                            |
| 編集可能な Codex ネイティブ transcript 履歴            | Codex は正規のネイティブスレッド履歴を所有します。OpenClaw はミラーを所有し、将来のコンテキストを投影できますが、サポートされていない内部を変更すべきではありません。 | ネイティブスレッドの手術が必要な場合は、明示的な Codex app-server API を追加します。                    |
| Codex ネイティブツールレコード用の `tool_result_persist` | そのフックは、Codex ネイティブツールレコードではなく、OpenClaw 所有の transcript 書き込みを変換します。                                                           | 変換済みレコードをミラーすることは可能ですが、正規の書き換えには Codex サポートが必要です。              |
| リッチなネイティブ Compaction メタデータ                     | OpenClaw は Compaction の開始と完了を観測しますが、安定した保持/削除リスト、トークン差分、または要約ペイロードを受け取りません。            | よりリッチな Codex Compaction イベントが必要です。                                                     |
| Compaction 介入                             | 現在の OpenClaw Compaction フックは、Codex モードでは通知レベルです。                                                                         | plugins がネイティブ Compaction を拒否または書き換える必要がある場合は、Codex の pre/post Compaction フックを追加します。 |
| バイト単位で一致するモデル API リクエストキャプチャ             | OpenClaw は app-server のリクエストと通知をキャプチャできますが、Codex コアは最終的な OpenAI API リクエストを内部で構築します。                      | Codex のモデルリクエストトレースイベントまたはデバッグ API が必要です。                                   |

## ツール、メディア、Compaction

Codex ハーネスが変更するのは、低レベルの埋め込みエージェント実行機構のみです。

OpenClaw は引き続きツールリストを構築し、ハーネスから動的ツール結果を受け取ります。テキスト、画像、動画、音楽、TTS、承認、メッセージングツール出力は、通常の OpenClaw 配信パスを通り続けます。

ネイティブフックリレーは意図的に汎用的ですが、v1 のサポート契約は、OpenClaw がテストする Codex ネイティブツールおよび権限パスに限定されます。Codex ランタイムでは、shell、patch、MCP の `PreToolUse`、`PostToolUse`、`PermissionRequest` ペイロードが含まれます。ランタイム契約が名前を挙げるまでは、将来のすべての Codex フックイベントが OpenClaw Plugin サーフェスであると想定しないでください。

`PermissionRequest` について、OpenClaw はポリシーが判断した場合にのみ、明示的な許可または拒否の決定を返します。決定なしの結果は許可ではありません。Codex はそれをフック決定なしとして扱い、自身の guardian またはユーザー承認パスにフォールスルーします。Codex app-server の承認モードでは、デフォルトでこのネイティブフックは省略されます。この段落は、`permission_request` が `nativeHookRelay.events` に明示的に含まれる場合、または互換ランタイムがそれをインストールする場合に適用されます。
オペレーターが Codex ネイティブ権限リクエストで `allow-always` を選択すると、OpenClaw はその正確な provider/session/tool input/cwd フィンガープリントを、制限付きのセッション期間中記憶します。記憶された決定は、意図的に完全一致のみです。コマンド、引数、ツールペイロード、または cwd が変わると、新しい承認が作成されます。

Codex MCP ツール承認 elicitation は、Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` としてマークした場合、OpenClaw の Plugin 承認フローを通じてルーティングされます。Codex `request_user_input` プロンプトは元のチャットに送り返され、次にキューされたフォローアップメッセージは、追加コンテキストとして誘導されるのではなく、そのネイティブサーバーリクエストに回答します。その他の MCP elicitation リクエストは引き続き fail closed します。

アクティブ実行キューのステアリングは、Codex app-server `turn/steer` にマッピングされます。デフォルトの `messages.queue.mode: "steer"` では、OpenClaw は設定された quiet window の間キューされたチャットメッセージをバッチ処理し、到着順で 1 つの `turn/steer` リクエストとして送信します。レガシーの `queue` モードは、個別の `turn/steer` リクエストを送信します。Codex レビューと手動 Compaction ターンは、同一ターンのステアリングを拒否する場合があります。その場合、選択されたモードがフォールバックを許可していれば、OpenClaw はフォローアップキューを使用します。[ステアリングキュー](/ja-JP/concepts/queue-steering)を参照してください。

選択されたモデルが Codex ハーネスを使用する場合、ネイティブスレッドの Compaction は Codex app-server に委任されます。OpenClaw は、チャネル履歴、検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのために transcript ミラーを保持します。ミラーには、ユーザープロンプト、最終 assistant テキスト、および app-server が発行する場合は軽量な Codex 推論またはプランレコードが含まれます。現時点では、OpenClaw はネイティブ Compaction の開始および完了シグナルのみを記録します。人間が読める Compaction 要約や、Compaction 後に Codex が保持したエントリの監査可能なリストはまだ公開していません。

Codex が正規のネイティブスレッドを所有するため、`tool_result_persist` は現在 Codex ネイティブツール結果レコードを書き換えません。これは、OpenClaw が OpenClaw 所有のセッション transcript ツール結果を書き込む場合にのみ適用されます。

メディア生成に PI は必要ありません。画像、動画、音楽、PDF、TTS、およびメディア理解は、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts` などの対応する provider/model 設定を引き続き使用します。

## トラブルシューティング

**Codex が通常の `/model` provider として表示されない:** 新しい設定ではこれは想定どおりです。`agentRuntime.id: "codex"` を指定した `openai/gpt-*` モデル（またはレガシー `codex/*` ref）を選択し、`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex の代わりに PI を使用する:** `agentRuntime.id: "auto"` は、Codex ハーネスが実行を要求しない場合、互換性バックエンドとして引き続き PI を使用できます。テスト中に Codex 選択を強制するには、`agentRuntime.id: "codex"` を設定してください。強制された Codex ランタイムは、PI にフォールバックせずに失敗します。Codex app-server が選択されると、その失敗は直接表面化します。

**app-server が拒否される:** app-server ハンドシェイクがバージョン `0.125.0` 以降を報告するように Codex をアップグレードしてください。`0.125.0-alpha.2` や `0.125.0+custom` のような同一バージョンのプレリリースまたはビルドサフィックス付きバージョンは拒否されます。安定版 `0.125.0` プロトコル下限が OpenClaw のテスト対象だからです。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にしてください。

**WebSocket トランスポートがすぐに失敗する:** `appServer.url`、`authToken`、およびリモート app-server が同じ Codex app-server プロトコルバージョンを話していることを確認してください。

**非 Codex モデルが PI を使用する:** そのエージェントに対して `agentRuntime.id: "codex"` を強制しているか、レガシー `codex/*` ref を選択していない限り、これは想定どおりです。通常の `openai/gpt-*` およびその他の provider refs は、`auto` モードでは通常の provider パスに留まります。`agentRuntime.id: "codex"` を強制する場合、そのエージェントのすべての埋め込みターンは Codex 対応の OpenAI モデルである必要があります。

**Computer Use はインストールされていますが、ツールが実行されません:** 新しいセッションで
`/codex computer-use status` を確認してください。ツールが
`Native hook relay unavailable` を報告する場合は、`/new` または `/reset` を使用してください。解消しない場合は、古いネイティブフック登録をクリアするために
Gateway を再起動してください。`computer-use.list_apps`
がタイムアウトする場合は、Codex Computer Use または Codex Desktop を再起動して再試行してください。

## 関連

- [エージェントハーネスプラグイン](/ja-JP/plugins/sdk-agent-harness)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [ステータス](/ja-JP/cli/status)
- [Plugin フック](/ja-JP/plugins/hooks)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
