---
read_when:
    - バンドルされた Codex app-server ハーネスを使用したい場合
    - Codex ハーネス設定の例が必要です
    - Codex のみのデプロイを、PI にフォールバックするのではなく失敗させたい
summary: 同梱の Codex app-server ハーネスを介して OpenClaw の埋め込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-05-07T13:23:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9bc5e78b1c6737dad7037ef77cfa9f16d480f02671363591509696d232e2d52e
    source_path: plugins/codex-harness.md
    workflow: 16
---

バンドルされた `codex` Plugin により、OpenClaw は組み込みの PI ハーネスではなく Codex app-server を通じて埋め込み agent ターンを実行できます。

低レベルの agent セッションを Codex に所有させたい場合に使用します。これには、モデル検出、ネイティブスレッド再開、ネイティブ Compaction、app-server 実行が含まれます。OpenClaw は引き続き、チャットチャンネル、セッションファイル、モデル選択、ツール、承認、メディア配信、表示されるトランスクリプトミラーを所有します。

ソースチャットターンが Codex ハーネス経由で実行される場合、デプロイが `messages.visibleReplies` を明示的に設定していなければ、表示される返信はデフォルトで OpenClaw の `message` ツールになります。agent は Codex ターンを非公開で完了することもできます。チャンネルへ投稿するのは `message(action="send")` を呼び出したときだけです。直接チャットの最終返信を従来の自動配信パスのままにするには、`messages.visibleReplies: "automatic"` を設定します。

Codex Heartbeat ターンにはデフォルトで `heartbeat_respond` ツールも付与されるため、agent は最終テキストにその制御フローをエンコードせずに、その起床を静かに維持するか通知するかを記録できます。

Heartbeat 固有の自発性ガイダンスは、その Heartbeat ターン自体で Codex のコラボレーションモード開発者指示として送信されます。通常のチャットターンでは、通常のランタイムプロンプトに Heartbeat の思想を持ち込まず、Codex Default モードに戻します。

全体像を把握しようとしている場合は、[Agent ランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。短く言うと、`openai/gpt-5.5` はモデル参照、`codex` はランタイムであり、Telegram、Discord、Slack、または別のチャンネルがコミュニケーション面として残ります。

## クイック設定

「OpenClaw 内で Codex」を使いたいほとんどのユーザーが求めるのはこの経路です。ChatGPT/Codex サブスクリプションでサインインし、ネイティブ Codex app-server ランタイムを通じて埋め込み agent ターンを実行します。モデル参照は引き続き `openai/gpt-*` として正規のままです。サブスクリプション認証は `openai-codex/*` モデルプレフィックスからではなく、Codex アカウント/プロファイルから取得されます。

まだ行っていない場合は、まず Codex OAuth でサインインします。

```bash
openclaw models auth login --provider openai-codex
```

次に、バンドルされた `codex` Plugin を有効化し、Codex ランタイムを強制します。

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

設定で `openai-codex/gpt-*` を使用しないでください。このプレフィックスはレガシー経路であり、`openclaw doctor --fix` によって、主要モデル、フォールバック、Heartbeat/subagent/Compaction オーバーライド、フック、チャンネルオーバーライド、古い永続化セッション経路ピン全体にわたって `openai/gpt-*` に書き換えられます。

## この Plugin が変更すること

バンドルされた `codex` Plugin は、複数の独立した機能を提供します。

| 機能                              | 使用方法                                            | 内容                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| ネイティブ埋め込みランタイム      | `agentRuntime.id: "codex"`                          | OpenClaw の埋め込み agent ターンを Codex app-server 経由で実行します。        |
| ネイティブチャット制御コマンド    | `/codex bind`, `/codex resume`, `/codex steer`, ... | メッセージング会話から Codex app-server スレッドをバインドおよび制御します。  |
| Codex app-server プロバイダー/カタログ | `codex` 内部、ハーネス経由で公開               | ランタイムが app-server モデルを検出および検証できるようにします。            |
| Codex メディア理解パス            | `codex/*` 画像モデル互換パス                       | 対応する画像理解モデルに対して、境界付けられた Codex app-server ターンを実行します。 |
| ネイティブフックリレー            | Codex ネイティブイベント周辺の Plugin フック       | OpenClaw が対応する Codex ネイティブのツール/終了イベントを観測またはブロックできるようにします。 |

Plugin を有効にすると、これらの機能が利用可能になります。ただし、次のことは**行いません**。

- 画像、埋め込み、音声、realtime などの直接 OpenAI API キー面を置き換える
- `openclaw doctor --fix` なしで `openai-codex/*` モデル参照を変換する
- ACP/acpx をデフォルトの Codex パスにする
- すでに PI ランタイムを記録済みの既存セッションをホットスイッチする
- OpenClaw のチャンネル配信、セッションファイル、認証プロファイル保存、メッセージルーティングを置き換える

同じ Plugin は、ネイティブ `/codex` チャット制御コマンド面も所有します。Plugin が有効で、ユーザーがチャットから Codex スレッドのバインド、再開、誘導、停止、または検査を求めている場合、agents は ACP よりも `/codex ...` を優先する必要があります。ACP は、ユーザーが ACP/acpx を求めている場合、または ACP Codex アダプターをテストしている場合の明示的なフォールバックのままです。

ネイティブ Codex ターンは、OpenClaw Plugin フックを公開互換レイヤーとして維持します。これらはプロセス内 OpenClaw フックであり、Codex `hooks.json` コマンドフックではありません。

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` はミラーされたトランスクリプトレコード用
- Codex `Stop` リレー経由の `before_agent_finalize`
- `agent_end`

Plugins は、OpenClaw がツールを実行した後、結果が Codex に返される前に OpenClaw 動的ツール結果を書き換える、ランタイム非依存のツール結果ミドルウェアも登録できます。これは、OpenClaw 所有のトランスクリプトツール結果書き込みを変換する公開 `tool_result_persist` Plugin フックとは別です。

Plugin フックのセマンティクス自体については、[Plugin フック](/ja-JP/plugins/hooks) と [Plugin ガード動作](/ja-JP/tools/plugin) を参照してください。

OpenAI agent モデル参照は、デフォルトでハーネスを使用します。新しい設定では、OpenAI モデル参照を `openai/gpt-*` として正規のままにしてください。`agentRuntime.id: "codex"` は引き続き有効ですが、OpenAI agent ターンには不要になりました。レガシー `codex/*` モデル参照は互換性のために引き続きハーネスを自動選択しますが、ランタイムで支えられるレガシープロバイダープレフィックスは、通常のモデル/プロバイダー選択肢としては表示されません。

設定済みモデル経路がまだ `openai-codex/*` の場合、`openclaw doctor --fix` はそれを `openai/*` に書き換えます。一致する agent 経路については、agent ランタイムを `codex` に設定し、既存の `openai-codex` 認証プロファイルオーバーライドを保持します。

## 経路マップ

設定を変更する前に、この表を使用してください。

| 望ましい動作                                         | モデル参照                 | ランタイム設定                         | 認証/プロファイル経路        | 期待されるステータスラベル |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | -------------------------- |
| ネイティブ Codex ランタイムでの ChatGPT/Codex サブスクリプション | `openai/gpt-*`             | 省略または `agentRuntime.id: "codex"`  | Codex OAuth または Codex アカウント | `Runtime: OpenAI Codex`    |
| agent モデル向け OpenAI API キー認証                 | `openai/gpt-*`             | 省略または `agentRuntime.id: "codex"`  | `openai-codex` API キープロファイル | `Runtime: OpenAI Codex`    |
| doctor 修復が必要なレガシー設定                      | `openai-codex/gpt-*`       | `codex` に修復                         | 既存の設定済み認証           | `doctor --fix` 後に再確認  |
| 保守的な auto モードでの混在プロバイダー             | プロバイダー固有の参照     | `agentRuntime.id: "auto"`              | 選択プロバイダーごと         | 選択ランタイムによる       |
| 明示的な Codex ACP アダプターセッション              | ACP プロンプト/モデル依存  | `runtime: "acp"` を指定した `sessions_spawn` | ACP バックエンド認証         | ACP タスク/セッションステータス |

重要な分離は、プロバイダーとランタイムです。

- `openai-codex/*` は doctor が書き換えるレガシー経路です。
- `agentRuntime.id: "codex"` は Codex ハーネスを要求し、利用できない場合は閉じて失敗します。
- `agentRuntime.id: "auto"` は、登録済みハーネスが一致するプロバイダー経路を要求できるようにします。OpenAI agent 参照は PI ではなく Codex に解決されます。
- `/codex ...` は「このチャットはどのネイティブ Codex 会話にバインドまたは制御すべきか」に答えます。
- ACP は「acpx はどの外部ハーネスプロセスを起動すべきか」に答えます。

## 適切なモデルプレフィックスを選ぶ

OpenAI ファミリーの経路はプレフィックス固有です。一般的なサブスクリプションとネイティブ Codex ランタイムの構成では、`openai/*` を使用します。
`openai-codex/*` は doctor が書き換えるべきレガシー設定として扱ってください。

| モデル参照                                        | ランタイムパス                         | 使用する場合                                                       |
| ------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| `openai/gpt-5.4`                                  | agent ターン向け Codex app-server ハーネス | OpenAI agent モデルを Codex 経由で使いたい場合。                   |
| `openai-codex/gpt-5.5`                            | doctor によって修復されるレガシー経路  | 古い設定を使用している場合。`openclaw doctor --fix` を実行して書き換えます。 |
| `openai/gpt-5.5` + `openai-codex` API キープロファイル | Codex app-server ハーネス              | OpenAI agent モデルで API キー認証を使いたい場合。                 |

アカウントで公開されている場合、GPT-5.5 は直接 OpenAI API キー経路と Codex サブスクリプション経路の両方に現れることがあります。ネイティブ Codex ランタイムには Codex app-server ハーネス付きで `openai/gpt-5.5` を使用し、直接 API キートラフィックには Codex ランタイムオーバーライドなしで `openai/gpt-5.5` を使用します。

レガシー `codex/gpt-*` 参照は、互換エイリアスとして引き続き受け入れられます。doctor 互換性移行は、レガシーランタイム参照を正規のモデル参照に書き換え、ランタイムポリシーを別に記録します。新しいネイティブ app-server ハーネス設定では、`openai/gpt-*` と `agentRuntime.id: "codex"` を使用してください。

`agents.defaults.imageModel` も同じプレフィックス分離に従います。通常の OpenAI 経路には `openai/gpt-*` を使用し、画像理解を境界付けられた Codex app-server ターン経由で実行する場合は `codex/gpt-*` を使用します。`openai-codex/gpt-*` は使用しないでください。doctor はそのレガシープレフィックスを `openai/gpt-*` に書き換えます。Codex app-server モデルは画像入力対応を広告している必要があります。テキスト専用の Codex モデルは、メディアターンが開始される前に失敗します。

現在のセッションで有効なハーネスを確認するには `/status` を使用します。選択が意外な場合は、`agents/harness` サブシステムのデバッグログを有効化し、Gateway の構造化された `agent harness selected` レコードを調べてください。これには、選択されたハーネス ID、選択理由、ランタイム/フォールバックポリシー、および `auto` モードでは各 Plugin 候補の対応結果が含まれます。

### doctor 警告の意味

`openclaw doctor` は、設定済みモデル参照または永続化されたセッション経路状態がまだ `openai-codex/*` を使用している場合に警告します。`openclaw doctor --fix` はそれらの経路を次のように書き換えます。

- `openai/<model>`
- `agentRuntime.id: "codex"`

`codex` 経路はネイティブ Codex ハーネスを強制します。OpenAI agent モデルターンでは PI ランタイム設定は許可されません。
doctor は、検出された agent セッションストア全体の古い永続化セッションピンも修復するため、古い会話が削除済み経路に固定されたままにはなりません。

ハーネス選択はライブセッション制御ではありません。埋め込みターンが実行されると、OpenClaw は選択されたハーネス ID をそのセッションに記録し、同じセッション ID の後続ターンでも使い続けます。将来のセッションで別のハーネスを使いたい場合は、`agentRuntime` 設定または `OPENCLAW_AGENT_RUNTIME` を変更してください。既存の会話を PI と Codex の間で切り替える前に、新しいセッションを開始するには `/new` または `/reset` を使用します。これにより、1 つのトランスクリプトを互換性のない 2 つのネイティブセッションシステムで再生することを避けられます。

ハーネスピン導入前に作成されたレガシーセッションは、トランスクリプト履歴があると PI ピン済みとして扱われます。設定変更後にその会話を Codex に移行するには、`/new` または `/reset` を使用します。

`/status` は有効なモデルランタイムを表示します。デフォルトの PI ハーネスは `Runtime: OpenClaw Pi Default` と表示され、Codex app-server ハーネスは `Runtime: OpenAI Codex` と表示されます。

## 要件

- バンドルされた `codex` plugin が利用可能な OpenClaw。
- Codex app-server `0.125.0` 以降。バンドルされた plugin は既定で互換性のある
  Codex app-server バイナリを管理するため、`PATH` 上のローカル `codex` コマンドは
  通常のハーネス起動に影響しません。
- app-server プロセス、または OpenClaw の Codex 認証ブリッジで Codex 認証が利用可能であること。
  ローカル app-server 起動では、各 agent に OpenClaw 管理の Codex ホームと
  分離された子 `HOME` を使用するため、既定では個人の
  `~/.codex` アカウント、skills、plugins、config、thread 状態、またはネイティブの
  `$HOME/.agents/skills` は読み取りません。

この plugin は、古い app-server またはバージョンなしの app-server ハンドシェイクをブロックします。これにより、
OpenClaw はテスト済みのプロトコルサーフェスに維持されます。

ライブおよび Docker smoke tests では、認証は通常 Codex CLI アカウントまたは
OpenClaw `openai-codex` 認証プロファイルから取得されます。ローカル stdio app-server 起動では、
アカウントが存在しない場合に `CODEX_API_KEY` / `OPENAI_API_KEY` にフォールバックすることもできます。

## ワークスペースブートストラップファイル

Codex は、ネイティブのプロジェクトドキュメント検出を通じて `AGENTS.md` を自分で処理します。OpenClaw は、
合成 Codex プロジェクトドキュメントファイルを書き込まず、ペルソナファイルに対して Codex のフォールバック
ファイル名にも依存しません。Codex のフォールバックは `AGENTS.md` がない場合にのみ適用されるためです。

OpenClaw ワークスペースの同等性のために、Codex ハーネスはその他のブートストラップ
ファイル（存在する場合は `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、
`BOOTSTRAP.md`、および `MEMORY.md`）を解決し、`thread/start` と `thread/resume` の Codex
developer instructions を通じて転送します。これにより、`AGENTS.md` を複製せずに、
`SOUL.md` と関連するワークスペースのペルソナ/プロファイルコンテキストが、ネイティブな
Codex の挙動形成レーンで見える状態になります。

## 他のモデルと一緒に Codex を追加する

同じ agent が Codex と非 Codex provider モデルを自由に切り替える必要がある場合は、
`agentRuntime.id: "codex"` をグローバルに設定しないでください。強制 runtime は、その agent または session の
すべての埋め込み turn に適用されます。その runtime が強制されている間に Anthropic モデルを選択した場合、
OpenClaw は引き続き Codex ハーネスを試行し、その turn を PI 経由で密かにルーティングするのではなく、
クローズドに失敗します。

代わりに、次のいずれかの形を使用してください。

- `agentRuntime.id: "codex"` を設定した専用 agent に Codex を置く。
- 通常の混在 provider 利用では、既定 agent を `agentRuntime.id: "auto"` と PI fallback のままにする。
- 互換性のためにのみ、レガシーの `codex/*` refs を使用する。新しい config では、
  `openai/*` と明示的な Codex runtime ポリシーを優先してください。

たとえば、これは既定 agent を通常の自動選択のままにし、別の Codex agent を追加します。

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

この形では次のようになります。

- 既定の `main` agent は通常の provider パスと PI 互換 fallback を使用します。
- `codex` agent は Codex app-server ハーネスを使用します。
- `codex` agent で Codex がない、またはサポートされていない場合、turn は
  静かに PI を使用するのではなく失敗します。

## Agent コマンドルーティング

Agents は、単語「Codex」だけでなく、意図によって user requests をルーティングする必要があります。

| ユーザーの要求...                                       | Agent が使用すべきもの...                              |
| ------------------------------------------------------ | ------------------------------------------------ |
| 「このチャットを Codex にバインドして」                              | `/codex bind`                                    |
| 「ここで Codex thread `<id>` を再開して」                      | `/codex resume <id>`                             |
| 「Codex threads を表示して」                                   | `/codex threads`                                 |
| 「問題のある Codex 実行のサポートレポートを提出して」            | `/diagnostics [note]`                            |
| 「この添付 thread についてのみ Codex feedback を送信して」    | `/codex diagnostics [note]`                      |
| 「Codex runtime で自分の ChatGPT/Codex サブスクリプションを使って」 | `openai/*`                                       |
| 「古い `openai-codex/*` config/session pins を修復して」      | `openclaw doctor --fix`                          |
| 「ACP/acpx 経由で Codex を実行して」                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「Claude Code/Gemini/OpenCode/Cursor を thread で開始して」 | ACP/acpx、`/codex` ではなく、ネイティブ sub-agents でもない |

OpenClaw は、ACP が有効で、dispatch 可能で、読み込まれた runtime backend に支えられている場合にのみ、
agent に ACP spawn ガイダンスを告知します。ACP が利用できない場合、
system prompt と plugin skills は agent に ACP ルーティングを教えるべきではありません。

## Codex 専用デプロイ

すべての埋め込み agent turn が Codex を使用することを証明する必要がある場合は、Codex ハーネスを強制してください。
明示的な plugin runtimes はクローズドに失敗し、PI 経由で密かに再試行されることはありません。

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

環境変数による上書き:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Codex が強制されている場合、Codex plugin が無効、app-server が古すぎる、または
app-server を起動できないと、OpenClaw は早期に失敗します。

## Agent ごとの Codex

既定 agent は通常の自動選択を維持しつつ、1つの agent だけを Codex 専用にできます。

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

通常の session コマンドを使用して agents と models を切り替えてください。`/new` は新しい
OpenClaw session を作成し、Codex ハーネスは必要に応じて sidecar app-server
thread を作成または再開します。`/reset` はその thread の OpenClaw session binding をクリアし、
次の turn で現在の config からハーネスを再度解決できるようにします。

## Model discovery

既定では、Codex plugin は利用可能な models を app-server に問い合わせます。
discovery が失敗するかタイムアウトした場合、次の bundled fallback catalog を使用します。

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

`plugins.entries.codex.config.discovery` で discovery を調整できます。

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

Codex の probing を避け、fallback catalog に固定したい場合は、起動時の discovery を無効にします。

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

既定では、plugin は OpenClaw 管理の Codex バイナリをローカルで次のように起動します。

```bash
codex app-server --listen stdio://
```

管理対象バイナリは `codex` plugin package に同梱されています。これにより、app-server バージョンは、
ローカルにたまたまインストールされている別の Codex CLI ではなく、バンドルされた plugin に紐づきます。
別の実行可能ファイルを意図的に実行したい場合にのみ、`appServer.command` を設定してください。

既定では、OpenClaw はローカル Codex ハーネス sessions を YOLO mode で開始します。
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"` です。これは autonomous heartbeats に使用される信頼済みローカル operator posture です。
Codex は、誰も応答できない native approval prompts で停止することなく、
shell と network tools を使用できます。

Codex guardian-reviewed approvals を有効にするには、`appServer.mode:
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

Guardian mode は Codex のネイティブ auto-review approval path を使用します。Codex が
sandbox から出る、workspace の外に書き込む、network access などの権限を追加するよう要求した場合、
Codex はその approval request を human prompt ではなく native reviewer にルーティングします。
reviewer は Codex の risk framework を適用し、具体的な request を承認または拒否します。
YOLO mode より多くの guardrails が必要だが、無人 agents には進捗が必要な場合に Guardian を使用してください。

`guardian` preset は `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。
個別の policy fields は引き続き `mode` を上書きするため、高度なデプロイでは
preset と明示的な選択を混在できます。古い `guardian_subagent` reviewer value は
互換性 alias として引き続き受け付けられますが、新しい configs では
`auto_review` を使用してください。

既に実行中の app-server には、WebSocket transport を使用します。

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

Stdio app-server 起動は既定で OpenClaw の process environment を継承しますが、
OpenClaw は Codex app-server account bridge を所有し、`CODEX_HOME` と `HOME` の両方を、
その agent の OpenClaw state 配下にある agent ごとのディレクトリに設定します。
Codex 自身の skill loader は `$CODEX_HOME/skills` と
`$HOME/.agents/skills` を読むため、ローカル app-server 起動では両方の値が分離されます。
これにより、Codex-native skills、plugins、config、accounts、thread state は、
operator の個人 Codex CLI home から漏れ込むのではなく、OpenClaw agent にスコープされます。

OpenClaw plugins と OpenClaw skill snapshots は引き続き OpenClaw 独自の
plugin registry と skill loader を通じて流れます。個人の Codex CLI assets は流れません。
OpenClaw agent の一部にすべき有用な Codex CLI skills または plugins がある場合は、
明示的に inventory してください。

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration provider は、skills を現在の OpenClaw agent workspace にコピーします。
Codex native plugins、hooks、config files は、自動的に有効化されるのではなく、手動レビューのために報告またはアーカイブされます。
これらはコマンドを実行したり、MCP servers を公開したり、credentials を含んだりする可能性があるためです。

Auth は次の順序で選択されます。

1. agent の明示的な OpenClaw Codex auth profile。
2. その agent の Codex home にある app-server の既存アカウント。
3. ローカル stdio app-server 起動の場合のみ、app-server account が存在せず、OpenAI auth が
   まだ必要なとき、`CODEX_API_KEY`、次に `OPENAI_API_KEY`。

OpenClaw が ChatGPT subscription-style Codex auth profile を検出すると、
spawn された Codex child process から `CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。
これにより、Gateway-level API keys は embeddings または直接の OpenAI models に利用可能なまま、
native Codex app-server turns が誤って API 課金されることを防ぎます。
明示的な Codex API-key profiles とローカル stdio env-key fallback は、継承された child-process env ではなく、
app-server login を使用します。WebSocket app-server connections は Gateway env API-key fallback を受け取りません。
明示的な auth profile、または remote app-server 自身の account を使用してください。

デプロイに追加の environment isolation が必要な場合は、それらの variables を
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

`appServer.clearEnv` は spawn された Codex app-server child process にのみ影響します。

Codex 動的ツールのデフォルトは `native-first` プロファイルです。このモードでは、
OpenClaw は Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません:
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、および
`update_plan`。メッセージング、セッション、メディア、
cron、ブラウザー、ノード、gateway、`heartbeat_respond`、`web_search` などの OpenClaw 統合ツールは引き続き
利用できます。

サポートされるトップレベルの Codex plugin フィールド:

| フィールド                 | デフォルト     | 意味                                                                                      |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Codex app-server に完全な OpenClaw 動的ツールセットを公開するには `"openclaw-compat"` を使用します。 |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server ターンから省略する追加の OpenClaw 動的ツール名。                         |

サポートされる `appServer` フィールド:

| フィールド                    | デフォルト                               | 意味                                                                                                                                                                                                                              |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                   | `"stdio"`                                | `"stdio"` は Codex を起動します。`"websocket"` は `url` に接続します。                                                                                                                                                              |
| `command`                     | 管理対象の Codex バイナリ                | stdio トランスポートの実行ファイル。管理対象バイナリを使用する場合は未設定のままにします。明示的な上書きの場合にのみ設定してください。                                                                                         |
| `args`                        | `["app-server", "--listen", "stdio://"]` | stdio トランスポートの引数。                                                                                                                                                                                                       |
| `url`                         | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                                          |
| `authToken`                   | 未設定                                   | WebSocket トランスポートの Bearer トークン。                                                                                                                                                                                        |
| `headers`                     | `{}`                                     | 追加の WebSocket ヘッダー。                                                                                                                                                                                                         |
| `clearEnv`                    | `[]`                                     | OpenClaw が継承環境を構築した後に、起動された stdio app-server プロセスから削除される追加の環境変数名。`CODEX_HOME` と `HOME` は、ローカル起動時の OpenClaw のエージェント単位の Codex 分離用に予約されています。 |
| `requestTimeoutMs`            | `60000`                                  | app-server control-plane 呼び出しのタイムアウト。                                                                                                                                                                                   |
| `turnCompletionIdleTimeoutMs` | `60000`                                  | ターンスコープの Codex app-server リクエスト後、OpenClaw が `turn/completed` を待機する静穏時間。ツール後の低速な合成フェーズやステータスのみの合成フェーズでは、この値を上げてください。                                      |
| `mode`                        | `"yolo"`                                 | YOLO または guardian レビュー付き実行のプリセット。                                                                                                                                                                                 |
| `approvalPolicy`              | `"never"`                                | thread start/resume/turn に送信されるネイティブ Codex 承認ポリシー。                                                                                                                                                                |
| `sandbox`                     | `"danger-full-access"`                   | thread start/resume に送信されるネイティブ Codex sandbox モード。                                                                                                                                                                   |
| `approvalsReviewer`           | `"user"`                                 | Codex にネイティブ承認プロンプトをレビューさせるには `"auto_review"` を使用します。`guardian_subagent` は従来のエイリアスとして残っています。                                                                                     |
| `serviceTier`                 | 未設定                                   | 任意の Codex app-server サービス階層: `"fast"`、`"flex"`、または `null`。無効な従来値は無視されます。                                                                                                                               |

OpenClaw 所有の動的ツール呼び出しは、`appServer.requestTimeoutMs` とは独立して
制限されます。各 Codex `item/tool/call` リクエストは、30 秒以内に
OpenClaw の応答を受け取る必要があります。タイムアウト時、OpenClaw はサポートされている場合はツール
シグナルを中止し、失敗した動的ツール応答を Codex に返します。これにより、
セッションを `processing` のままにする代わりに、ターンを続行できます。

OpenClaw が Codex のターンスコープの app-server リクエストに応答した後、ハーネスは
Codex がネイティブターンを `turn/completed` で完了することも期待します。その
応答後に app-server が `appServer.turnCompletionIdleTimeoutMs` の間静かになった場合、
OpenClaw は best-effort で Codex ターンを中断し、診断
タイムアウトを記録し、OpenClaw セッションレーンを解放します。これにより、後続のチャットメッセージが
古いネイティブターンの後ろにキューイングされません。同じターンに対する非終端通知、
`rawResponseItem/completed` を含む通知は、Codex がターンがまだ生存していることを証明したため、
この短いウォッチドッグを解除します。より長い終端ウォッチドッグは、
本当に停止したターンを引き続き保護します。タイムアウト診断には、最後の
app-server 通知メソッドと、raw assistant response item の場合は
item type、role、id、および制限付きの assistant text プレビューが含まれます。

ローカルテスト用の環境上書きは引き続き利用できます:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、`OPENCLAW_CODEX_APP_SERVER_BIN` は管理対象バイナリを
バイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、
一回限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。Config は
plugin の挙動を Codex ハーネス設定の残りと同じレビュー済みファイルに保持するため、
再現可能なデプロイでは推奨されます。

## Computer Use

Computer Use は独自のセットアップガイドで説明されています:
[Codex Computer Use](/ja-JP/plugins/codex-computer-use)。

短く言うと、OpenClaw はデスクトップ制御アプリをベンダー化せず、デスクトップアクション自体も実行しません。
Codex app-server を準備し、`computer-use` MCP サーバーが利用可能であることを検証し、
Codex モードのターン中は Codex にネイティブ MCP ツール呼び出しを処理させます。

Codex marketplace フロー外で TryCua ドライバーへ直接アクセスするには、
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
ローカル OS 権限が必要な場合があります。`computerUse.enabled` が true で MCP
サーバーが利用できない場合、Codex モードのターンは、ネイティブ Computer Use ツールなしで
静かに実行されるのではなく、スレッド開始前に失敗します。marketplace の選択肢、
リモートカタログの制限、ステータス理由、トラブルシューティングについては、
[Codex Computer Use](/ja-JP/plugins/codex-computer-use) を参照してください。

`computerUse.autoInstall` が true の場合、Codex がローカル marketplace をまだ検出していなければ、
OpenClaw は
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` から
標準の bundled Codex Desktop marketplace を登録できます。ランタイムまたは Computer Use config を変更した後は、
既存セッションが古い PI または Codex スレッドバインディングを保持しないように、
`/new` または `/reset` を使用してください。

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

モデル切り替えは OpenClaw 制御のままです。OpenClaw セッションが既存の Codex スレッドに接続されている場合、
次のターンは、現在選択されている
OpenAI モデル、プロバイダー、承認ポリシー、sandbox、およびサービス階層を
app-server に再送信します。`openai/gpt-5.5` から `openai/gpt-5.2` へ切り替えても
スレッドバインディングは保持されますが、新しく選択されたモデルで続行するよう Codex に要求します。

## Codex コマンド

bundled plugin は `/codex` を承認済みスラッシュコマンドとして登録します。これは
汎用で、OpenClaw テキストコマンドをサポートする任意のチャネルで機能します。

一般的な形式:

- `/codex status` は、ライブの app-server 接続状態、モデル、アカウント、レート制限、MCP サーバー、Skills を表示します。
- `/codex models` は、ライブの Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex スレッドに接続します。
- `/codex compact` は、接続されたスレッドを compact するよう Codex app-server に要求します。
- `/codex review` は、接続されたスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、接続されたスレッドについて Codex 診断フィードバックを送信する前に確認します。
- `/codex computer-use status` は、設定済みの Computer Use Plugin と MCP サーバーを確認します。
- `/codex computer-use install` は、設定済みの Computer Use Plugin をインストールし、MCP サーバーを再読み込みします。
- `/codex account` は、アカウントとレート制限の状態を表示します。
- `/codex mcp` は、Codex app-server MCP サーバーの状態を一覧表示します。
- `/codex skills` は、Codex app-server Skills を一覧表示します。

Codex が使用制限の失敗を報告した場合、Codex が提供していれば、OpenClaw は次回の
app-server リセット時刻を含めます。同じ会話で `/codex account` を使用して、
現在のアカウントとレート制限ウィンドウを確認してください。

### 一般的なデバッグワークフロー

Codex を利用するエージェントが Telegram、Discord、Slack、
または別のチャネルで想定外の動作をした場合は、問題が発生した会話から始めます。

1. `/diagnostics bad tool choice after image upload`、または確認した内容を説明する別の短いメモを実行します。
2. 診断リクエストを一度承認します。この承認により、ローカル Gateway
   診断 zip が作成されます。また、そのセッションは Codex ハーネスを使用しているため、
   関連する Codex フィードバックバンドルも OpenAI サーバーへ送信されます。
3. 完了した診断返信をバグ報告またはサポートスレッドにコピーします。
   そこには、ローカルバンドルパス、プライバシー概要、OpenClaw セッション ID、
   Codex スレッド ID、および各 Codex スレッドの `Inspect locally` 行が含まれます。
4. 自分で実行をデバッグしたい場合は、表示された `Inspect locally`
   コマンドをターミナルで実行します。これは `codex resume <thread-id>` のような形式で、
   ネイティブ Codex スレッドを開くため、会話を調査したり、ローカルで続行したり、
   Codex に特定のツールや計画を選んだ理由を尋ねたりできます。

完全な OpenClaw Gateway 診断バンドルなしで、現在接続されているスレッドの Codex
フィードバックアップロードだけを特に行いたい場合にのみ、`/codex diagnostics [note]` を使用してください。
ほとんどのサポート報告では、ローカル Gateway 状態と Codex
スレッド ID を 1 つの返信に結び付けるため、`/diagnostics [note]` が
よりよい出発点です。完全なプライバシーモデルとグループチャットでの動作については、[診断エクスポート](/ja-JP/gateway/diagnostics)
を参照してください。

コア OpenClaw も、一般的な Gateway 診断コマンドとして、オーナー専用の `/diagnostics [note]` を公開しています。
その承認プロンプトは、機密データに関する前置き、[診断エクスポート](/ja-JP/gateway/diagnostics) へのリンクを表示し、
毎回、明示的な exec 承認を通じて `openclaw gateway diagnostics export --json` を要求します。
allow-all ルールで診断を承認しないでください。承認後、OpenClaw はローカルバンドルパスとマニフェスト概要を含む、
貼り付け可能なレポートを送信します。アクティブな OpenClaw セッションが Codex ハーネスを使用している場合、
同じ承認により、関連する Codex フィードバックバンドルを OpenAI サーバーへ送信することも許可されます。
承認プロンプトには Codex フィードバックが送信されることが示されますが、
承認前に Codex セッション ID やスレッド ID は表示されません。

オーナーがグループチャットで `/diagnostics` を呼び出した場合、OpenClaw は
共有チャネルをクリーンに保ちます。グループには短い通知のみが届き、
診断の前置き、承認プロンプト、Codex セッション/スレッド ID は
プライベート承認ルートを通じてオーナーに送信されます。プライベートなオーナールートがない場合、
OpenClaw はグループリクエストを拒否し、DM から実行するようオーナーに依頼します。

承認された Codex アップロードは、Codex app-server の `feedback/upload` を呼び出し、
利用可能な場合は、一覧にある各スレッドと生成された Codex サブスレッドのログを含めるよう
app-server に要求します。アップロードは Codex の通常のフィードバック経路を通じて OpenAI
サーバーへ送信されます。その app-server で Codex フィードバックが無効になっている場合、
コマンドは app-server エラーを返します。完了した診断返信には、送信されたスレッドについて、
チャネル、OpenClaw セッション ID、Codex スレッド ID、ローカルの `codex resume <thread-id>`
コマンドが一覧表示されます。承認を拒否または無視した場合、OpenClaw はそれらの Codex ID を表示しません。
このアップロードは、ローカル Gateway 診断エクスポートを置き換えるものではありません。

`/codex resume` は、通常のターンでハーネスが使用するものと同じサイドカーのバインディングファイルを書き込みます。
次のメッセージで、OpenClaw はその Codex スレッドを再開し、
現在選択されている OpenClaw モデルを app-server に渡し、拡張履歴を有効のままにします。

### CLI から Codex スレッドを調査する

問題のある Codex 実行を理解する最速の方法は、多くの場合、ネイティブ Codex
スレッドを直接開くことです。

```sh
codex resume <thread-id>
```

チャネル会話でバグに気づき、問題のある Codex セッションを調査したい、
ローカルで続行したい、または Codex に特定のツールや推論の選択をした理由を尋ねたい場合に使用します。
通常、最も簡単な手順は、先に `/diagnostics [note]` を実行することです。承認後、
完了したレポートには各 Codex スレッドが一覧表示され、たとえば
`codex resume <thread-id>` のような `Inspect locally` コマンドが出力されます。
そのコマンドをそのままターミナルにコピーできます。

現在のチャットについては `/codex binding` から、最近の Codex app-server スレッドについては
`/codex threads [filter]` からスレッド ID を取得し、その後シェルで同じ
`codex resume` コマンドを実行することもできます。

このコマンドサーフェスには、Codex app-server `0.125.0` 以降が必要です。将来版またはカスタムの
app-server がその JSON-RPC メソッドを公開していない場合、個々の制御メソッドは
`unsupported by this Codex app-server` と報告されます。

## フック境界

Codex ハーネスには 3 つのフック層があります。

| 層                                    | オーナー                 | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin フック                | OpenClaw                 | PI と Codex ハーネス間のプロダクト/Plugin 互換性。                  |
| Codex app-server 拡張ミドルウェア     | OpenClaw バンドル Plugin | OpenClaw 動的ツール周辺のターンごとのアダプター動作。              |
| Codex ネイティブフック                | Codex                    | Codex 設定による低レベルの Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、OpenClaw Plugin の動作をルーティングするために、プロジェクトまたはグローバルの Codex `hooks.json`
ファイルを使用しません。サポートされているネイティブツールと権限ブリッジについて、
OpenClaw は `PreToolUse`、`PostToolUse`、`PermissionRequest`、`Stop` のスレッドごとの Codex 設定を注入します。
Codex app-server 承認が有効な場合（`approvalPolicy` が `"never"` ではない場合）、
デフォルトで注入されるネイティブフック設定は `PermissionRequest` を省略し、
Codex の app-server レビュアーと OpenClaw の承認ブリッジがレビュー後の実際のエスカレーションを処理します。
互換性リレーが必要な場合、オペレーターは引き続き `nativeHookRelay.events` に
`permission_request` を明示的に追加できます。`SessionStart` や `UserPromptSubmit` などの他の Codex フックは
Codex レベルの制御のままです。これらは v1 契約では OpenClaw Plugin フックとして公開されません。

OpenClaw 動的ツールについては、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、
OpenClaw はハーネスアダプター内で自身が所有する Plugin とミドルウェアの動作を発火します。
Codex ネイティブツールについては、Codex が正規のツールレコードを所有します。
OpenClaw は選択されたイベントをミラーできますが、Codex が app-server またはネイティブフックコールバックを通じて
その操作を公開しない限り、ネイティブ Codex スレッドを書き換えることはできません。

Compaction と LLM ライフサイクルの投影は、ネイティブ Codex フックコマンドではなく、Codex app-server
通知と OpenClaw アダプター状態から来ます。OpenClaw の `before_compaction`、`after_compaction`、`llm_input`、
`llm_output` イベントはアダプターレベルの観測であり、Codex の内部リクエストや Compaction
ペイロードのバイト単位のキャプチャではありません。

Codex ネイティブの `hook/started` および `hook/completed` app-server 通知は、
軌跡とデバッグのために `codex_app_server.hook` エージェントイベントとして投影されます。
これらは OpenClaw Plugin フックを呼び出しません。

## V1 サポート契約

Codex モードは、内部で別のモデル呼び出しを行う PI ではありません。Codex は
ネイティブモデルループのより多くを所有し、OpenClaw はその境界に合わせて Plugin とセッションのサーフェスを適応させます。

Codex ランタイム v1 でサポートされるもの:

| サーフェス | サポート | 理由 |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex 経由の OpenAI モデルループ | サポート対象 | Codex app-server が OpenAI ターン、ネイティブスレッド再開、ネイティブツール継続を所有するため。 |
| OpenClaw チャネルのルーティングと配信 | サポート対象 | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャネルはモデルランタイムの外側に留まるため。 |
| OpenClaw 動的ツール | サポート対象 | Codex は OpenClaw にこれらのツールの実行を依頼するため、OpenClaw は実行パスに留まる。 |
| プロンプトとコンテキストの Plugin | サポート対象 | OpenClaw は、スレッドの開始または再開前にプロンプトオーバーレイを構築し、コンテキストを Codex ターンに投影する。 |
| コンテキストエンジンのライフサイクル | サポート対象 | Codex ターンでは、組み立て、取り込みまたはターン後のメンテナンス、コンテキストエンジンの Compaction 調整が実行される。 |
| 動的ツールフック | サポート対象 | `before_tool_call`、`after_tool_call`、ツール結果ミドルウェアは、OpenClaw が所有する動的ツールの周囲で実行される。 |
| ライフサイクルフック | アダプター観測としてサポート対象 | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は、正直な Codex モードのペイロードで発火する。 |
| 最終回答の改訂ゲート | ネイティブフックリレー経由でサポート対象 | Codex `Stop` は `before_agent_finalize` にリレーされる。`revise` は、確定前にもう 1 回モデルパスを行うよう Codex に依頼する。 |
| ネイティブシェル、パッチ、MCP のブロックまたは観測 | ネイティブフックリレー経由でサポート対象 | Codex `PreToolUse` と `PostToolUse` は、Codex app-server `0.125.0` 以降の MCP ペイロードを含む、コミット済みのネイティブツールサーフェス用にリレーされる。ブロックはサポートされるが、引数の書き換えはサポートされない。 |
| ネイティブ権限ポリシー | Codex app-server 承認と互換ネイティブフックリレー経由でサポート対象 | Codex app-server の承認リクエストは、Codex レビュー後に OpenClaw 経由でルーティングされる。`PermissionRequest` ネイティブフックリレーは、Codex がガーディアンレビュー前にそれを発行するため、ネイティブ承認モードではオプトインである。 |
| App-server 軌跡キャプチャ | サポート対象 | OpenClaw は、app-server に送信したリクエストと、受信した app-server 通知を記録する。 |

Codex ランタイム v1 でサポートされないもの:

| サーフェス | V1 の境界 | 今後のパス |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ネイティブツール引数の変更 | Codex ネイティブのツール前フックはブロックできるが、OpenClaw は Codex ネイティブのツール引数を書き換えない。 | 置換ツール入力のための Codex フック/スキーマサポートが必要。 |
| 編集可能な Codex ネイティブのトランスクリプト履歴 | Codex が正規のネイティブスレッド履歴を所有する。OpenClaw はミラーを所有し、将来のコンテキストを投影できるが、サポートされない内部構造を変更すべきではない。 | ネイティブスレッドの手術が必要な場合は、明示的な Codex app-server API を追加する。 |
| Codex ネイティブツールレコード用の `tool_result_persist` | そのフックは、Codex ネイティブのツールレコードではなく、OpenClaw が所有するトランスクリプト書き込みを変換する。 | 変換済みレコードをミラーできる可能性はあるが、正規の書き換えには Codex サポートが必要。 |
| リッチなネイティブ Compaction メタデータ | OpenClaw は Compaction の開始と完了を観測するが、安定した保持/削除リスト、トークン差分、要約ペイロードを受信しない。 | よりリッチな Codex Compaction イベントが必要。 |
| Compaction 介入 | 現在の OpenClaw Compaction フックは、Codex モードでは通知レベルである。 | Plugin がネイティブ Compaction を拒否または書き換える必要がある場合は、Codex の Compaction 前/後フックを追加する。 |
| バイト単位で一致するモデル API リクエストのキャプチャ | OpenClaw は app-server のリクエストと通知をキャプチャできるが、Codex コアは最終的な OpenAI API リクエストを内部で構築する。 | Codex のモデルリクエスト追跡イベントまたはデバッグ API が必要。 |

## ツール、メディア、Compaction

Codex ハーネスが変更するのは、低レベルの埋め込みエージェント実行器のみである。

OpenClaw は引き続きツールリストを構築し、ハーネスから動的ツール結果を受け取る。テキスト、画像、動画、音楽、TTS、承認、メッセージングツールの出力は、通常の OpenClaw 配信パスを継続する。

ネイティブフックリレーは意図的に汎用だが、v1 のサポート契約は OpenClaw がテストする Codex ネイティブのツールと権限パスに限定される。Codex ランタイムでは、これにシェル、パッチ、MCP の `PreToolUse`、`PostToolUse`、`PermissionRequest` ペイロードが含まれる。ランタイム契約で名前が挙がるまでは、将来のすべての Codex フックイベントが OpenClaw Plugin サーフェスであると想定しないこと。

`PermissionRequest` について、OpenClaw はポリシーが判断した場合にのみ、明示的な許可または拒否の決定を返す。決定なしの結果は許可ではない。Codex はそれをフック決定なしとして扱い、自身のガーディアンまたはユーザー承認パスにフォールスルーする。Codex app-server の承認モードでは、デフォルトでこのネイティブフックは省略される。この段落は、`nativeHookRelay.events` に `permission_request` が明示的に含まれる場合、または互換ランタイムがそれをインストールする場合に適用される。オペレーターが Codex ネイティブ権限リクエストに対して `allow-always` を選択すると、OpenClaw はその正確なプロバイダー/セッション/ツール入力/cwd フィンガープリントを、制限付きのセッションウィンドウで記憶する。記憶された決定は意図的に完全一致のみである。コマンド、引数、ツールペイロード、cwd が変わると、新しい承認が作成される。

Codex MCP ツール承認の要求は、Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` としてマークした場合、OpenClaw の Plugin 承認フローを通じてルーティングされる。Codex `request_user_input` プロンプトは元のチャットに送り返され、次にキューに入ったフォローアップメッセージは、追加コンテキストとして誘導されるのではなく、そのネイティブサーバーリクエストへの回答になる。その他の MCP 要求リクエストは引き続きクローズドに失敗する。

アクティブ実行キューの誘導は Codex app-server `turn/steer` に対応付けられる。デフォルトの `messages.queue.mode: "steer"` では、OpenClaw は設定された静かなウィンドウの間、キュー済みチャットメッセージをバッチ化し、到着順に 1 つの `turn/steer` リクエストとして送信する。レガシーの `queue` モードは、個別の `turn/steer` リクエストを送信する。Codex レビューと手動 Compaction ターンは同一ターンの誘導を拒否する場合があり、その場合 OpenClaw は、選択されたモードがフォールバックを許可していればフォローアップキューを使用する。[誘導キュー](/ja-JP/concepts/queue-steering)を参照。

選択されたモデルが Codex ハーネスを使用する場合、ネイティブスレッド Compaction は Codex app-server に委譲される。OpenClaw は、チャネル履歴、検索、`/new`、`/reset`、将来のモデルまたはハーネス切り替えのために、トランスクリプトミラーを保持する。ミラーには、ユーザープロンプト、最終アシスタントテキスト、app-server が発行する場合は軽量な Codex 推論または計画レコードが含まれる。現在、OpenClaw はネイティブ Compaction の開始と完了シグナルのみを記録する。人間が読める Compaction 要約や、Compaction 後に Codex がどのエントリを保持したかを監査できるリストはまだ公開していない。

Codex が正規のネイティブスレッドを所有しているため、`tool_result_persist` は現在、Codex ネイティブのツール結果レコードを書き換えない。これは、OpenClaw が OpenClaw 所有のセッショントランスクリプトツール結果を書き込む場合にのみ適用される。

メディア生成に PI は不要である。画像、動画、音楽、PDF、TTS、メディア理解は、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts` など、対応するプロバイダー/モデル設定を引き続き使用する。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** 新しい設定では想定どおりである。`agentRuntime.id: "codex"`（またはレガシーの `codex/*` 参照）で `openai/gpt-*` モデルを選択し、`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が `codex` を除外していないか確認する。

**OpenClaw が Codex の代わりに PI を使用する:** `agentRuntime.id: "auto"` は、Codex ハーネスが実行を要求しない場合、互換バックエンドとして PI を引き続き使用できる。テスト中に Codex 選択を強制するには、`agentRuntime.id: "codex"` を設定する。強制された Codex ランタイムは、PI にフォールバックせずに失敗する。Codex app-server が選択されると、その失敗は直接表面化する。

**app-server が拒否される:** app-server ハンドシェイクがバージョン `0.125.0` 以降を報告するよう Codex をアップグレードする。同一バージョンのプレリリースや、`0.125.0-alpha.2` または `0.125.0+custom` のようなビルドサフィックス付きバージョンは拒否される。安定版 `0.125.0` のプロトコル下限が OpenClaw のテスト対象であるため。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にする。

**WebSocket トランスポートが即座に失敗する:** `appServer.url`、`authToken`、リモート app-server が同じ Codex app-server プロトコルバージョンを話していることを確認する。

**非 Codex モデルが PI を使用する:** そのエージェントで `agentRuntime.id: "codex"` を強制したか、レガシーの `codex/*` 参照を選択した場合を除き、これは想定どおりである。プレーンな `openai/gpt-*` やその他のプロバイダー参照は、`auto` モードでは通常のプロバイダーパスに留まる。`agentRuntime.id: "codex"` を強制した場合、そのエージェントのすべての埋め込みターンは Codex がサポートする OpenAI モデルでなければならない。

**Computer Use はインストールされているがツールが実行されない:** 新しいセッションから
`/codex computer-use status` を確認します。ツールが
`Native hook relay unavailable` を報告する場合は `/new` または `/reset` を使用します。それでも続く場合は、
Gateway を再起動して古いネイティブフック登録をクリアします。`computer-use.list_apps`
がタイムアウトする場合は、Codex Computer Use または Codex Desktop を再起動して再試行します。

## 関連

- [Agent ハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [Agent ランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [ステータス](/ja-JP/cli/status)
- [Plugin フック](/ja-JP/plugins/hooks)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
