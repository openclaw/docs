---
read_when:
    - 同梱の Codex app-server ハーネスを使用したい場合
    - Codex ハーネスの設定例が必要です
    - Codex専用デプロイを、PI にフォールバックするのではなく失敗させたい場合
summary: OpenClaw の埋め込みエージェントのターンを、同梱の Codex app-server ハーネス経由で実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-05-06T09:08:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: a35ab08c1a7327437aadb6c2517bd962071bbb25982718d4c0b043680163ab70
    source_path: plugins/codex-harness.md
    workflow: 16
---

バンドルされた `codex` plugin により、OpenClaw は組み込みの PI ハーネスではなく
Codex app-server 経由で埋め込みエージェントターンを実行できます。

低レベルのエージェントセッションを Codex に所有させたい場合に使用します: モデル
検出、ネイティブスレッド再開、ネイティブ Compaction、app-server 実行です。
OpenClaw は引き続きチャットチャネル、セッションファイル、モデル選択、ツール、
承認、メディア配信、表示されるトランスクリプトミラーを所有します。

ソースチャットターンが Codex ハーネス経由で実行される場合、デプロイメントで
`messages.visibleReplies` が明示的に設定されていなければ、表示される返信は既定で
OpenClaw の `message` ツールになります。エージェントは引き続き Codex ターンを非公開で
完了できます。チャネルに投稿されるのは `message(action="send")` を呼び出した場合だけです。
`messages.visibleReplies: "automatic"` を設定すると、ダイレクトチャットの最終返信を
従来の自動配信パスに維持できます。

Codex heartbeat ターンには既定で `heartbeat_respond` ツールも付与されるため、エージェントは
最終テキストにその制御フローを埋め込まずに、ウェイクを静かに保つべきか通知すべきかを記録できます。

Heartbeat 固有の主体性ガイダンスは、その heartbeat ターン自体で Codex コラボレーションモードの
developer instruction として送信されます。通常のチャットターンでは、通常のランタイムプロンプトに
heartbeat の考え方を持ち込まず、Codex Default モードを復元します。

全体像を把握したい場合は、
[エージェントランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。要約すると、
`openai/gpt-5.5` はモデル参照、`codex` はランタイムであり、Telegram、
Discord、Slack、または別のチャネルが通信サーフェスのままです。

## クイック設定

「Codex in OpenClaw」を使いたいほとんどのユーザーが求めているのはこのルートです:
ChatGPT/Codex サブスクリプションでサインインし、ネイティブ
Codex app-server ランタイム経由で埋め込みエージェントターンを実行します。モデル参照は
引き続き `openai/gpt-*` として正規のままです。サブスクリプション認証は
`openai-codex/*` モデルプレフィックスからではなく、Codex アカウント/プロファイルから取得されます。

まだ済んでいない場合は、まず Codex OAuth でサインインします:

```bash
openclaw models auth login --provider openai-codex
```

次に、バンドルされた `codex` plugin を有効にし、Codex ランタイムを強制します:

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

設定で `plugins.allow` を使用している場合は、そこにも `codex` を含めます:

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

設定で `openai-codex/gpt-*` を使用しないでください。このプレフィックスは従来のルートであり、
`openclaw doctor --fix` がプライマリモデル、フォールバック、heartbeat/subagent/compaction オーバーライド、フック、チャネルオーバーライド、
および古い永続化済みセッションルートピン全体にわたって `openai/gpt-*` に書き換えます。

## この plugin が変更すること

バンドルされた `codex` plugin は、複数の個別の機能を提供します:

| 機能                              | 使い方                                              | 何をするか                                                                    |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| ネイティブ埋め込みランタイム       | `agentRuntime.id: "codex"`                          | OpenClaw の埋め込みエージェントターンを Codex app-server 経由で実行します。                  |
| ネイティブチャット制御コマンド     | `/codex bind`, `/codex resume`, `/codex steer`, ... | メッセージング会話から Codex app-server スレッドをバインドおよび制御します。    |
| Codex app-server プロバイダー/カタログ | `codex` 内部、ハーネス経由で公開                    | ランタイムが app-server モデルを検出および検証できるようにします。                     |
| Codex メディア理解パス             | `codex/*` 画像モデル互換パス                        | サポートされる画像理解モデルに対して、境界付きの Codex app-server ターンを実行します。 |
| ネイティブフックリレー             | Codex ネイティブイベント周辺の Plugin フック         | OpenClaw がサポートされる Codex ネイティブのツール/完了イベントを監視/ブロックできるようにします。  |

plugin を有効にすると、これらの機能が利用可能になります。ただし、次のことは行いません:

- すべての OpenAI モデルで Codex を使い始める
- `openai-codex/*` モデル参照を、doctor が Codex のインストール、有効化、`codex` ハーネスの提供、
  および OAuth 準備完了を検証せずにネイティブランタイムへ変換する
- ACP/acpx を既定の Codex パスにする
- すでに PI ランタイムを記録している既存セッションをホットスイッチする
- OpenClaw のチャネル配信、セッションファイル、認証プロファイルストレージ、または
  メッセージルーティングを置き換える

同じ plugin は、ネイティブ `/codex` チャット制御コマンドサーフェスも所有します。
plugin が有効で、ユーザーがチャットから Codex スレッドをバインド、再開、誘導、停止、または調査するよう求めた場合、
エージェントは ACP よりも `/codex ...` を優先するべきです。ACP は、ユーザーが ACP/acpx を求めた場合、
または ACP Codex アダプターをテストしている場合の明示的なフォールバックのままです。

ネイティブ Codex ターンは、OpenClaw plugin フックを公開互換レイヤーとして維持します。
これらはプロセス内の OpenClaw フックであり、Codex `hooks.json` コマンドフックではありません:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` for mirrored transcript records
- `before_agent_finalize` through Codex `Stop` relay
- `agent_end`

Plugins は、ランタイム中立のツール結果ミドルウェアを登録して、OpenClaw がツールを実行した後、
結果が Codex に返される前に、OpenClaw の動的ツール結果を書き換えることもできます。これは、OpenClaw が所有するトランスクリプトの
ツール結果書き込みを変換する公開 `tool_result_persist` plugin フックとは別のものです。

plugin フックのセマンティクス自体については、[Plugin フック](/ja-JP/plugins/hooks)
および [Plugin ガード動作](/ja-JP/tools/plugin) を参照してください。

ハーネスは既定でオフです。新しい設定では、OpenAI モデル参照を
`openai/gpt-*` として正規に保ち、ネイティブ app-server 実行が必要な場合は
`agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex` を明示的に強制するべきです。
従来の `codex/*` モデル参照は互換性のために引き続きハーネスを自動選択しますが、
ランタイムで裏付けられた従来プロバイダープレフィックスは通常のモデル/プロバイダー選択肢として表示されません。

設定済みモデルルートがまだ `openai-codex/*` の場合、`openclaw doctor --fix`
はそれを `openai/*` に書き換えます。一致するエージェントルートについては、Codex plugin がインストールされ、有効で、
`codex` ハーネスを提供し、利用可能な OAuth を持つ場合にのみ、エージェントランタイムを
`codex` に設定します。それ以外の場合はランタイムを `pi` に設定します。

## ルートマップ

設定を変更する前に、この表を使用してください:

| 望ましい動作                                      | モデル参照                 | ランタイム設定                         | 認証/プロファイルルート     | 期待されるステータスラベル       |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| ネイティブ Codex ランタイムを使う ChatGPT/Codex サブスクリプション | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth または Codex アカウント | `Runtime: OpenAI Codex`        |
| 通常の OpenClaw runner 経由の OpenAI API             | `openai/gpt-*`             | 省略または `runtime: "pi"`             | OpenAI API キー               | `Runtime: OpenClaw Pi Default` |
| doctor 修復が必要な従来設定                          | `openai-codex/gpt-*`       | `codex` または `pi` に修復             | 既存の設定済み認証           | `doctor --fix` 後に再確認       |
| 保守的な auto モードの混在プロバイダー                | プロバイダー固有の参照     | `agentRuntime.id: "auto"`              | 選択されたプロバイダーごと    | 選択されたランタイムによる       |
| 明示的な Codex ACP アダプターセッション              | ACP プロンプト/モデルに依存 | `sessions_spawn` with `runtime: "acp"` | ACP バックエンド認証         | ACP タスク/セッションステータス  |

重要な分割は、プロバイダーとランタイムです:

- `openai-codex/*` は doctor が書き換える従来のルートです。
- `agentRuntime.id: "codex"` は Codex ハーネスを必要とし、利用できない場合はフェイルクローズします。
- `agentRuntime.id: "auto"` は、登録されたハーネスが一致するプロバイダールートを要求できるようにしますが、
  正規の OpenAI 参照は、そのプロバイダー/モデルのペアをサポートするハーネスがない限り、引き続き PI 所有です。
- `/codex ...` は「このチャットはどのネイティブ Codex 会話にバインドまたは制御するべきか?」に答えます。
- ACP は「acpx はどの外部ハーネスプロセスを起動するべきか?」に答えます。

## 適切なモデルプレフィックスを選ぶ

OpenAI ファミリーのルートはプレフィックス固有です。一般的なサブスクリプション + ネイティブ Codex ランタイムのセットアップでは、
`agentRuntime.id: "codex"` とともに `openai/*` を使用します。
`openai-codex/*` は、doctor が書き換えるべき従来設定として扱います:

| モデル参照                                    | ランタイムパス                               | 使用する場合                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI 配管経由の OpenAI プロバイダー | `OPENAI_API_KEY` による現在の直接 OpenAI Platform API アクセスが必要な場合。 |
| `openai-codex/gpt-5.5`                        | doctor により修復される従来ルート            | 古い設定を使用している場合。`openclaw doctor --fix` を実行して書き換えます。         |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server ハーネス                    | ChatGPT/Codex サブスクリプション認証とネイティブ Codex 実行が必要な場合。     |

アカウントで公開されている場合、GPT-5.5 は直接 OpenAI API キーと Codex サブスクリプションルートの両方に表示されることがあります。
ネイティブ Codex ランタイムには Codex app-server ハーネスとともに `openai/gpt-5.5` を使用し、
直接 API キートラフィックには Codex ランタイムオーバーライドなしで `openai/gpt-5.5` を使用します。

従来の `codex/gpt-*` 参照は、互換エイリアスとして引き続き受け入れられます。Doctor 互換性移行は、
従来のランタイム参照を正規のモデル参照に書き換え、ランタイムポリシーを別に記録します。
新しいネイティブ app-server ハーネス設定では、`agentRuntime.id: "codex"` とともに
`openai/gpt-*` を使用するべきです。

`agents.defaults.imageModel` も同じプレフィックス分割に従います。通常の OpenAI ルートには
`openai/gpt-*` を使用し、画像理解を境界付きの Codex app-server ターン経由で実行する必要がある場合は
`codex/gpt-*` を使用します。`openai-codex/gpt-*` は使用しないでください。doctor がその従来プレフィックスを
`openai/gpt-*` に書き換えます。Codex app-server モデルは画像入力サポートを公示している必要があります。
テキスト専用の Codex モデルは、メディアターンが開始される前に失敗します。

現在のセッションで有効なハーネスを確認するには `/status` を使用します。選択が予想外の場合は、
`agents/harness` サブシステムのデバッグログを有効にし、gateway の構造化された `agent harness selected` レコードを調査します。
これには、選択されたハーネス ID、選択理由、ランタイム/フォールバックポリシー、および
`auto` モードでは各 plugin 候補のサポート結果が含まれます。

### doctor 警告の意味

`openclaw doctor` は、設定済みモデル参照または永続化済みセッションルート状態がまだ
`openai-codex/*` を使用している場合に警告します。`openclaw doctor --fix` はそれらのルートを
次のように書き換えます:

- `openai/<model>`
- Codex がインストールされ、有効で、`codex` ハーネスを提供し、利用可能な OAuth を持つ場合は
  `agentRuntime.id: "codex"`
- それ以外の場合は `agentRuntime.id: "pi"`

`codex` ルートはネイティブ Codex ハーネスを強制します。`pi` ルートは、
従来ルートのクリーンアップの副作用として Codex を有効化またはインストールするのではなく、
エージェントを既定の OpenClaw runner に維持します。
Doctor は、検出されたエージェントセッションストア全体で古い永続化済みセッションピンも修復するため、
古い会話が削除済みルートに固定されたままになりません。

ハーネス選択はライブセッション制御ではありません。埋め込みターンが実行されると、
OpenClaw は選択されたハーネス ID をそのセッションに記録し、同じセッション ID の
後続ターンでもそれを使い続けます。今後のセッションで別のハーネスを使いたい場合は
`agentRuntime` 設定または `OPENCLAW_AGENT_RUNTIME` を変更してください。既存の
会話を PI と Codex の間で切り替える前に、新しいセッションを開始するには
`/new` または `/reset` を使います。これにより、1 つのトランスクリプトを互換性のない
2 つのネイティブセッションシステムで再生することを避けられます。

ハーネスのピン留め前に作成されたレガシーセッションは、トランスクリプト履歴があると
PI にピン留めされたものとして扱われます。設定を変更した後にその会話を Codex に
オプトインするには、`/new` または `/reset` を使います。

`/status` は有効なモデルランタイムを表示します。デフォルトの PI ハーネスは
`Runtime: OpenClaw Pi Default` と表示され、Codex app-server ハーネスは
`Runtime: OpenAI Codex` と表示されます。

## 要件

- バンドルされた `codex` Plugin が利用可能な OpenClaw。
- Codex app-server `0.125.0` 以降。バンドルされた Plugin は既定で互換性のある
  Codex app-server バイナリを管理するため、`PATH` 上のローカル `codex` コマンドは
  通常のハーネス起動に影響しません。
- app-server プロセスまたは OpenClaw の Codex 認証ブリッジで Codex 認証が利用可能であること。
  ローカル app-server 起動では、各エージェントに対して OpenClaw が管理する Codex ホームと
  分離された子 `HOME` を使用するため、既定では個人の `~/.codex` アカウント、Skills、
  plugins、設定、スレッド状態、またはネイティブの `$HOME/.agents/skills` を読み取りません。

Plugin は、古い、またはバージョンなしの app-server ハンドシェイクをブロックします。
これにより、OpenClaw はテスト済みのプロトコル面に留まります。

ライブおよび Docker スモークテストでは、認証は通常 Codex CLI アカウント、または
OpenClaw の `openai-codex` 認証プロファイルから取得されます。ローカル stdio app-server 起動では、
アカウントが存在しない場合に `CODEX_API_KEY` / `OPENAI_API_KEY` にフォールバックすることもできます。

## ワークスペースブートストラップファイル

Codex はネイティブのプロジェクトドキュメント検出を通じて `AGENTS.md` を自分で処理します。
OpenClaw は合成 Codex プロジェクトドキュメントファイルを書き込まず、ペルソナファイルのために
Codex フォールバックファイル名にも依存しません。Codex のフォールバックは
`AGENTS.md` が存在しない場合にのみ適用されるためです。

OpenClaw ワークスペースの同等性のため、Codex ハーネスは他のブートストラップファイル
（存在する場合は `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、
`BOOTSTRAP.md`、および `MEMORY.md`）を解決し、`thread/start` と `thread/resume` で
Codex 開発者指示として転送します。これにより、`AGENTS.md` を複製せずに、
`SOUL.md` と関連するワークスペースペルソナ/プロファイルコンテキストを
ネイティブ Codex の動作形成レーンで可視化できます。

## 他のモデルと並べて Codex を追加する

同じエージェントが Codex と Codex 以外のプロバイダーモデルを自由に切り替える必要がある場合は、
`agentRuntime.id: "codex"` をグローバルに設定しないでください。強制ランタイムは、
そのエージェントまたはセッションのすべての埋め込みターンに適用されます。そのランタイムが
強制されている状態で Anthropic モデルを選択した場合でも、OpenClaw は Codex ハーネスを試行し、
そのターンを PI 経由で黙ってルーティングするのではなくフェイルクローズします。

代わりに、次のいずれかの形を使います。

- `agentRuntime.id: "codex"` を設定した専用エージェントに Codex を置く。
- 通常の混在プロバイダー利用では、デフォルトエージェントを `agentRuntime.id: "auto"` と PI フォールバックのままにする。
- レガシー `codex/*` 参照は互換性のためだけに使う。新しい設定では、
  `openai/*` と明示的な Codex ランタイムポリシーを優先してください。

たとえば、次の設定はデフォルトエージェントを通常の自動選択のままにし、
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

- デフォルトの `main` エージェントは通常のプロバイダーパスと PI 互換フォールバックを使います。
- `codex` エージェントは Codex app-server ハーネスを使います。
- `codex` エージェントで Codex が存在しない、またはサポートされていない場合、
  PI を静かに使うのではなくターンが失敗します。

## エージェントコマンドのルーティング

エージェントは、「Codex」という単語だけではなく、意図に基づいてユーザーリクエストをルーティングする必要があります。

| ユーザーの依頼...                                       | エージェントが使うべきもの...                              |
| ------------------------------------------------------ | ------------------------------------------------ |
| 「このチャットを Codex にバインドして」                              | `/codex bind`                                    |
| 「Codex スレッド `<id>` をここで再開して」                      | `/codex resume <id>`                             |
| 「Codex スレッドを表示して」                                   | `/codex threads`                                 |
| 「不正な Codex 実行のサポートレポートを提出して」            | `/diagnostics [note]`                            |
| 「この添付スレッドについてだけ Codex フィードバックを送って」    | `/codex diagnostics [note]`                      |
| 「ChatGPT/Codex サブスクリプションを Codex ランタイムで使って」 | `openai/*` と `agentRuntime.id: "codex"`       |
| 「古い `openai-codex/*` 設定/セッションのピン留めを修復して」      | `openclaw doctor --fix`                          |
| 「ACP/acpx 経由で Codex を実行して」                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「スレッドで Claude Code/Gemini/OpenCode/Cursor を開始して」 | ACP/acpx、`/codex` ではなく、ネイティブサブエージェントでもない |

OpenClaw は、ACP が有効で、ディスパッチ可能で、読み込まれたランタイムバックエンドに支えられている場合にのみ、
エージェントへ ACP スポーンガイダンスを提示します。ACP が利用できない場合、システムプロンプトと
Plugin Skills は、ACP ルーティングについてエージェントに教えるべきではありません。

## Codex のみのデプロイ

すべての埋め込みエージェントターンが Codex を使うことを証明する必要がある場合は、Codex ハーネスを強制します。
明示的な Plugin ランタイムはフェイルクローズし、PI 経由で黙って再試行されることはありません。

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

Codex が強制されている場合、Codex Plugin が無効、app-server が古すぎる、または
app-server を開始できないと、OpenClaw は早期に失敗します。

## エージェントごとの Codex

デフォルトエージェントは通常の自動選択を維持したまま、1 つのエージェントだけを Codex 専用にできます。

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

エージェントとモデルを切り替えるには通常のセッションコマンドを使います。`/new` は新しい
OpenClaw セッションを作成し、Codex ハーネスは必要に応じてサイドカー app-server スレッドを作成または再開します。
`/reset` はそのスレッドの OpenClaw セッションバインドをクリアし、次のターンで現在の設定から
ハーネスを再解決できるようにします。

## モデル検出

既定では、Codex Plugin は利用可能なモデルを app-server に問い合わせます。検出に失敗した場合や
タイムアウトした場合は、次のバンドルフォールバックカタログを使います。

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

## App-server 接続とポリシー

既定では、Plugin は OpenClaw が管理する Codex バイナリをローカルで次のように開始します。

```bash
codex app-server --listen stdio://
```

管理対象バイナリは `codex` Plugin パッケージに同梱されています。これにより、app-server バージョンは、
ローカルに別途インストールされている Codex CLI ではなく、バンドルされた Plugin に結び付けられます。
別の実行ファイルを意図的に実行したい場合にのみ `appServer.command` を設定してください。

既定では、OpenClaw はローカル Codex ハーネスセッションを YOLO モードで開始します。
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"` です。これは自律 Heartbeat に使われる信頼済みローカルオペレーターの姿勢です。
Codex は、回答する人が周囲にいないネイティブ承認プロンプトで停止せずに、シェルとネットワークツールを使えます。

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

ガーディアンモードは Codex のネイティブ自動レビュー承認パスを使います。Codex が
サンドボックスを離れる、ワークスペース外に書き込む、またはネットワークアクセスのような権限を追加しようとした場合、
Codex はその承認リクエストを人間のプロンプトではなくネイティブレビュアーへルーティングします。
レビュアーは Codex のリスクフレームワークを適用し、特定のリクエストを承認または拒否します。
YOLO モードより多くのガードレールが必要だが、無人エージェントにも進捗を出させる必要がある場合は
ガーディアンを使います。

`guardian` プリセットは `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。
個別のポリシーフィールドは引き続き `mode` を上書きするため、高度なデプロイではプリセットと明示的な選択を
組み合わせられます。古い `guardian_subagent` レビュアー値も互換エイリアスとして引き続き受け付けられますが、
新しい設定では `auto_review` を使うべきです。

すでに実行中の app-server には WebSocket トランスポートを使います。

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

stdio app-server 起動は既定で OpenClaw のプロセス環境を継承しますが、OpenClaw は
Codex app-server アカウントブリッジを所有し、`CODEX_HOME` と `HOME` の両方を、
そのエージェントの OpenClaw 状態配下にあるエージェントごとのディレクトリに設定します。
Codex 自身の skill ローダーは `$CODEX_HOME/skills` と `$HOME/.agents/skills` を読み取るため、
ローカル app-server 起動では両方の値が分離されます。これにより、Codex ネイティブの Skills、
plugins、設定、アカウント、およびスレッド状態は、オペレーターの個人 Codex CLI ホームから漏れ込むのではなく、
OpenClaw エージェントにスコープされます。

OpenClaw plugins と OpenClaw skill スナップショットは、引き続き OpenClaw 自身の
Plugin レジストリと skill ローダーを通じて流れます。個人の Codex CLI アセットは流れません。
OpenClaw エージェントの一部にすべき有用な Codex CLI Skills または plugins がある場合は、
明示的に棚卸ししてください。

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex 移行プロバイダーは Skills を現在の OpenClaw エージェントワークスペースにコピーします。
Codex ネイティブ plugins、フック、および設定ファイルは、自動的に有効化されるのではなく、
手動レビュー用に報告またはアーカイブされます。これらはコマンドを実行したり、MCP サーバーを公開したり、
認証情報を持ち運んだりできるためです。

認証は次の順序で選択されます。

1. エージェントの明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex ホームにある app-server の既存アカウント。
3. ローカル stdio app-server 起動の場合に限り、app-server アカウントが存在せず OpenAI 認証が
   まだ必要な場合は `CODEX_API_KEY`、次に `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション型の Codex 認証プロファイルを検出すると、起動された Codex 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーは embeddings や直接の OpenAI モデルで利用できるまま、ネイティブ Codex app-server ターンが誤って API 経由で課金されないようにします。
明示的な Codex API キープロファイルと local stdio env-key フォールバックは、継承された子プロセス env ではなく app-server
ログインを使用します。WebSocket app-server 接続は Gateway env API キーフォールバックを受け取りません。明示的な認証プロファイル、またはリモート app-server 自身のアカウントを使用してください。

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

`appServer.clearEnv` は、起動された Codex app-server 子プロセスにのみ影響します。

Codex 動的ツールのデフォルトは `native-first` プロファイルです。このモードでは、
OpenClaw は Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません: `read`、`write`、`edit`、`apply_patch`、`exec`、`process`、および
`update_plan`。メッセージング、セッション、メディア、
Cron、ブラウザー、ノード、Gateway、`heartbeat_respond`、`web_search` などの OpenClaw 統合ツールは引き続き利用できます。

サポートされるトップレベルの Codex Plugin フィールド:

| フィールド                 | デフォルト     | 意味                                                                                       |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Codex app-server に OpenClaw 動的ツールセット全体を公開するには `"openclaw-compat"` を使用します。 |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server ターンから除外する追加の OpenClaw 動的ツール名。               |

サポートされる `appServer` フィールド:

| フィールド          | デフォルト                               | 意味                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` は Codex を起動し、`"websocket"` は `url` に接続します。                                                                                                                                                                             |
| `command`           | 管理対象の Codex バイナリ                     | stdio トランスポート用の実行ファイル。管理対象バイナリを使用する場合は未設定のままにします。明示的な上書きの場合にのみ設定してください。                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio トランスポート用の引数。                                                                                                                                                                                                       |
| `url`               | 未設定                                    | WebSocket app-server URL。                                                                                                                                                                                                            |
| `authToken`         | 未設定                                    | WebSocket トランスポート用の Bearer トークン。                                                                                                                                                                                                |
| `headers`           | `{}`                                     | 追加の WebSocket ヘッダー。                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除される追加の環境変数名。`CODEX_HOME` と `HOME` は、ローカル起動時の OpenClaw のエージェントごとの Codex 分離用に予約されています。 |
| `requestTimeoutMs`  | `60000`                                  | app-server control-plane 呼び出しのタイムアウト。                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | YOLO または guardian レビュー付き実行のプリセット。                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | スレッドの開始/再開/ターンに送信されるネイティブ Codex 承認ポリシー。                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | スレッドの開始/再開に送信されるネイティブ Codex サンドボックスモード。                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Codex にネイティブ承認プロンプトをレビューさせるには `"auto_review"` を使用します。`guardian_subagent` は従来のエイリアスとして残っています。                                                                                                                         |
| `serviceTier`       | 未設定                                    | 任意の Codex app-server サービスティア: `"fast"`、`"flex"`、または `null`。無効な従来値は無視されます。                                                                                                                            |

OpenClaw 所有の動的ツール呼び出しは、`appServer.requestTimeoutMs` とは独立して制限されます。各 Codex `item/tool/call` リクエストは、30 秒以内に OpenClaw 応答を受け取る必要があります。タイムアウト時、OpenClaw はサポートされる場合にツールシグナルを中止し、失敗した動的ツール応答を Codex に返します。これにより、セッションを `processing` のままにせず、ターンを続行できます。

OpenClaw が Codex のターンスコープ app-server リクエストに応答した後、ハーネスは Codex がネイティブターンを `turn/completed` で完了することも期待します。その応答後に app-server が 60 秒間沈黙した場合、OpenClaw はベストエフォートで Codex ターンを中断し、診断タイムアウトを記録し、OpenClaw セッションレーンを解放します。これにより、後続のチャットメッセージが古いネイティブターンの後ろにキューイングされません。

ローカルテスト用の環境上書きは引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` は、`appServer.command` が未設定の場合に管理対象バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、単発のローカルテストには
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。再現可能なデプロイでは設定の使用を推奨します。Codex ハーネス設定の残りと同じレビュー済みファイル内に Plugin の動作を保持できるためです。

## コンピューター操作

コンピューター操作は専用のセットアップガイドで説明しています:
[Codex コンピューター操作](/ja-JP/plugins/codex-computer-use)。

要約すると、OpenClaw はデスクトップ制御アプリを vendoring せず、デスクトップアクション自体も実行しません。OpenClaw は Codex app-server を準備し、
`computer-use` MCP サーバーが利用可能であることを検証してから、Codex モードのターン中に Codex がネイティブ
MCP ツール呼び出しを処理できるようにします。

Codex marketplace フロー外で TryCua ドライバーに直接アクセスするには、
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` で
`cua-driver mcp` を登録します。Codex 所有のコンピューター操作と直接 MCP 登録の違いについては、[Codex コンピューター操作](/ja-JP/plugins/codex-computer-use)を参照してください。

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

コンピューター操作は macOS 固有であり、Codex MCP サーバーがアプリを制御できるようになる前にローカル OS 権限が必要になる場合があります。`computerUse.enabled` が true で MCP サーバーが利用できない場合、Codex モードのターンは、ネイティブのコンピューター操作ツールなしで黙って実行されるのではなく、スレッド開始前に失敗します。marketplace の選択肢、リモートカタログの制限、ステータス理由、トラブルシューティングについては、
[Codex コンピューター操作](/ja-JP/plugins/codex-computer-use)を参照してください。

`computerUse.autoInstall` が true の場合、Codex がまだローカル marketplace を検出していなければ、OpenClaw は
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` から標準のバンドル Codex Desktop marketplace を登録できます。ランタイムまたはコンピューター操作設定を変更した後は、既存のセッションが古い PI または Codex スレッドバインディングを保持しないように、`/new` または `/reset` を使用してください。

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

モデル切り替えは OpenClaw 制御のままです。OpenClaw セッションが既存の Codex スレッドに接続されている場合、次のターンでは現在選択されている
OpenAI モデル、プロバイダー、承認ポリシー、サンドボックス、サービスティアを再度 app-server に送信します。`openai/gpt-5.5` から `openai/gpt-5.2` へ切り替えると、スレッドバインディングは維持されますが、新しく選択されたモデルで続行するよう Codex に要求します。

## Codex コマンド

バンドル Plugin は、認可済みスラッシュコマンドとして `/codex` を登録します。これは汎用であり、OpenClaw テキストコマンドをサポートする任意のチャネルで動作します。

一般的な形式:

- `/codex status` は、ライブ app-server 接続、モデル、アカウント、レート制限、MCP サーバー、skills を表示します。
- `/codex models` は、ライブ Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex スレッドに接続します。
- `/codex compact` は、接続中のスレッドを compact するよう Codex app-server に要求します。
- `/codex review` は、接続中のスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、接続中のスレッドについて Codex 診断フィードバックを送信する前に確認します。
- `/codex computer-use status` は、設定済みの Computer Use plugin と MCP サーバーを確認します。
- `/codex computer-use install` は、設定済みの Computer Use plugin をインストールし、MCP サーバーを再読み込みします。
- `/codex account` は、アカウントとレート制限の状態を表示します。
- `/codex mcp` は、Codex app-server MCP サーバーの状態を一覧表示します。
- `/codex skills` は、Codex app-server skills を一覧表示します。

Codex が使用量制限の失敗を報告した場合、Codex が提供していれば OpenClaw は次の
app-server リセット時刻を含めます。同じ会話で `/codex account` を使用して、
現在のアカウントとレート制限ウィンドウを確認してください。

### 一般的なデバッグワークフロー

Codex ベースのエージェントが Telegram、Discord、Slack、
または別のチャネルで予期しない動作をした場合は、問題が発生した会話から始めます。

1. `/diagnostics bad tool choice after image upload`、または見た内容を説明する別の短いメモを実行します。
2. 診断リクエストを 1 回承認します。この承認により、ローカル Gateway
   診断 zip が作成され、セッションが Codex ハーネスを使用しているため、
   関連する Codex フィードバックバンドルも OpenAI サーバーへ送信されます。
3. 完了した診断返信をバグレポートまたはサポートスレッドにコピーします。
   そこには、ローカルバンドルのパス、プライバシー概要、OpenClaw セッション ID、
   Codex スレッド ID、各 Codex スレッドの `Inspect locally` 行が含まれます。
4. 実行を自分でデバッグしたい場合は、出力された `Inspect locally`
   コマンドをターミナルで実行します。これは `codex resume <thread-id>` のような形式で、
   ネイティブ Codex スレッドを開くため、会話を調査したり、ローカルで続行したり、
   Codex が特定のツールやプランを選んだ理由を Codex に尋ねたりできます。

現在接続中のスレッドについて、完全な OpenClaw
Gateway 診断バンドルなしで Codex フィードバックアップロードだけを特に行いたい場合にのみ、
`/codex diagnostics [note]` を使用してください。ほとんどのサポート報告では、
`/diagnostics [note]` のほうが出発点として適しています。これは、ローカル Gateway の状態と Codex
スレッド ID を 1 つの返信で結び付けるためです。完全なプライバシーモデルとグループチャットでの動作については、
[診断エクスポート](/ja-JP/gateway/diagnostics) を参照してください。

OpenClaw コアは、一般的な
Gateway 診断コマンドとして、所有者専用の `/diagnostics [note]` も公開しています。その承認プロンプトは機微データに関する前置きを表示し、
[診断エクスポート](/ja-JP/gateway/diagnostics) にリンクし、毎回明示的な exec 承認を通じて
`openclaw gateway diagnostics export --json` を要求します。allow-all ルールで診断を承認しないでください。承認後、
OpenClaw はローカルバンドルのパスとマニフェスト概要を含む貼り付け可能なレポートを送信します。アクティブな OpenClaw セッションが Codex ハーネスを使用している場合、
同じ承認により、関連する Codex フィードバックバンドルを OpenAI サーバーへ送信することも許可されます。承認プロンプトは Codex フィードバックが送信されることを示しますが、
承認前に Codex セッション ID やスレッド ID は一覧表示しません。

グループチャットで所有者が `/diagnostics` を呼び出した場合、OpenClaw は共有チャネルを整理された状態に保ちます。
グループが受け取るのは短い通知のみで、診断の前置き、承認プロンプト、Codex セッション/スレッド ID は、
プライベート承認ルートを通じて所有者に送信されます。プライベートな所有者ルートがない場合、
OpenClaw はグループリクエストを拒否し、DM から実行するよう所有者に求めます。

承認済みの Codex アップロードは Codex app-server の `feedback/upload` を呼び出し、
利用可能な場合は、列挙された各スレッドと生成された Codex サブスレッドのログを含めるよう
app-server に要求します。アップロードは Codex の通常のフィードバック経路を通じて OpenAI
サーバーへ送信されます。その app-server で Codex フィードバックが無効になっている場合、コマンドは
app-server エラーを返します。完了した診断返信には、送信されたスレッドのチャネル、
OpenClaw セッション ID、Codex スレッド ID、ローカル `codex resume <thread-id>`
コマンドが一覧表示されます。承認を拒否または無視した場合、OpenClaw はそれらの Codex ID を出力しません。このアップロードはローカル
Gateway 診断エクスポートを置き換えるものではありません。

`/codex resume` は、通常のターンでハーネスが使用するものと同じサイドカーのバインディングファイルを書き込みます。
次のメッセージで、OpenClaw はその Codex スレッドを再開し、
現在選択されている OpenClaw モデルを app-server に渡し、拡張履歴を有効なままにします。

### CLI から Codex スレッドを調査する

問題のある Codex 実行を理解する最速の方法は、多くの場合、ネイティブ Codex
スレッドを直接開くことです。

```sh
codex resume <thread-id>
```

チャネル会話でバグに気づき、問題のある Codex セッションを調査したい場合、
ローカルで続行したい場合、または Codex が特定のツールや推論を選んだ理由を尋ねたい場合に使用します。通常、最も簡単な手順は
最初に `/diagnostics [note]` を実行することです。承認後、完了したレポートに各 Codex スレッドが一覧表示され、
`Inspect locally` コマンド、たとえば `codex resume <thread-id>` が出力されます。そのコマンドをターミナルに直接コピーできます。

現在のチャットについては `/codex binding` から、最近の Codex app-server スレッドについては
`/codex threads [filter]` からスレッド ID を取得し、シェルで同じ
`codex resume` コマンドを実行することもできます。

コマンド面には Codex app-server `0.125.0` 以降が必要です。将来の app-server やカスタム app-server がその JSON-RPC メソッドを公開していない場合、個別の制御メソッドは
`unsupported by this Codex app-server` と報告されます。

## フックの境界

Codex ハーネスには 3 つのフック層があります。

| 層                                    | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw plugin フック                | OpenClaw                 | PI と Codex ハーネス間の製品/plugin 互換性。                        |
| Codex app-server 拡張ミドルウェア     | OpenClaw バンドル plugin | OpenClaw 動的ツールの周辺におけるターンごとのアダプター動作。       |
| Codex ネイティブフック                | Codex                    | Codex 設定からの低レベルな Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、OpenClaw plugin の動作をルーティングするために、プロジェクトまたはグローバルの Codex `hooks.json` ファイルを使用しません。サポートされているネイティブツールと権限ブリッジについて、
OpenClaw は `PreToolUse`、`PostToolUse`、
`PermissionRequest`、`Stop` 用のスレッド単位の Codex 設定を注入します。`SessionStart` や
`UserPromptSubmit` などの他の Codex フックは Codex レベルの制御のままです。これらは v1 契約では
OpenClaw plugin フックとして公開されません。

OpenClaw 動的ツールでは、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、
OpenClaw はハーネスアダプター内で、自身が所有する plugin とミドルウェアの動作を発火します。
Codex ネイティブツールでは、Codex が正規のツールレコードを所有します。
OpenClaw は選択したイベントをミラーできますが、Codex が app-server またはネイティブフックコールバックを通じてその操作を公開しない限り、ネイティブ Codex
スレッドを書き換えることはできません。

Compaction と LLM ライフサイクルの投影は、ネイティブ Codex フックコマンドではなく、Codex app-server
通知と OpenClaw アダプター状態から得られます。
OpenClaw の `before_compaction`、`after_compaction`、`llm_input`、`llm_output`
イベントはアダプターレベルの観測であり、Codex の内部リクエストや Compaction ペイロードをバイト単位で取得したものではありません。

Codex ネイティブの `hook/started` と `hook/completed` app-server 通知は、
軌跡とデバッグのために `codex_app_server.hook` エージェントイベントとして投影されます。
これらは OpenClaw plugin フックを呼び出しません。

## V1 サポート契約

Codex モードは、内部のモデル呼び出しだけを変えた PI ではありません。Codex はネイティブモデルループのより多くを所有し、
OpenClaw はその境界の周辺で plugin とセッション面を適応させます。

Codex ランタイム v1 でサポートされるもの:

| 面                                            | サポート                                | 理由                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex 経由の OpenAI モデルループ              | サポート                                | Codex app-server が OpenAI ターン、ネイティブスレッド再開、ネイティブツール継続を所有します。                                                                                                        |
| OpenClaw チャネルルーティングと配信           | サポート                                | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャネルはモデルランタイムの外側に留まります。                                                                                                |
| OpenClaw 動的ツール                           | サポート                                | Codex が OpenClaw にこれらのツールを実行するよう要求するため、OpenClaw は実行経路に留まります。                                                                                                      |
| プロンプトとコンテキスト plugin               | サポート                                | OpenClaw はスレッドの開始または再開前にプロンプトオーバーレイを構築し、コンテキストを Codex ターンに投影します。                                                                                    |
| コンテキストエンジンのライフサイクル          | サポート                                | Codex ターンに対して、組み立て、取り込みまたはターン後のメンテナンス、コンテキストエンジンの Compaction 調整が実行されます。                                                                        |
| 動的ツールフック                              | サポート                                | `before_tool_call`、`after_tool_call`、ツール結果ミドルウェアは、OpenClaw 所有の動的ツールの周辺で実行されます。                                                                                    |
| ライフサイクルフック                          | アダプター観測としてサポート            | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は、正直な Codex モードのペイロードで発火します。                                                                    |
| 最終回答の改訂ゲート                          | ネイティブフックリレー経由でサポート    | Codex `Stop` は `before_agent_finalize` にリレーされます。`revise` は最終化前にもう 1 回モデルパスを行うよう Codex に要求します。                                                                    |
| ネイティブ shell、patch、MCP のブロックまたは観測 | ネイティブフックリレー経由でサポート | Codex `PreToolUse` と `PostToolUse` は、Codex app-server `0.125.0` 以降の MCP ペイロードを含む、確定済みのネイティブツール面にリレーされます。ブロックはサポートされますが、引数の書き換えはサポートされません。 |
| ネイティブ権限ポリシー                        | ネイティブフックリレー経由でサポート    | Codex `PermissionRequest` は、ランタイムが公開している場合、OpenClaw ポリシーを通じてルーティングできます。OpenClaw が判断を返さない場合、Codex は通常のガーディアンまたはユーザー承認経路を続行します。 |
| App-server 軌跡キャプチャ                     | サポート                                | OpenClaw は app-server に送信したリクエストと、受信した app-server 通知を記録します。                                                                                                               |

Codex ランタイム v1 でサポートされないもの:

| サーフェス                                             | V1 境界                                                                                                                                     | 将来のパス                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ネイティブツール引数の変更                       | Codex ネイティブのツール前 hooks はブロックできますが、OpenClaw は Codex ネイティブのツール引数を書き換えません。                                               | 置換用ツール入力には Codex の hook/schema サポートが必要です。                            |
| 編集可能な Codex ネイティブ transcript 履歴            | Codex は正規のネイティブスレッド履歴を所有します。OpenClaw はミラーを所有し、将来のコンテキストを投影できますが、サポートされていない内部状態を変更すべきではありません。 | ネイティブスレッドの手術が必要な場合は、明示的な Codex app-server API を追加します。                    |
| Codex ネイティブツールレコード用の `tool_result_persist` | その hook は OpenClaw が所有する transcript 書き込みを変換するものであり、Codex ネイティブツールレコードを変換するものではありません。                                                           | 変換済みレコードをミラーすることはできますが、正規の書き換えには Codex サポートが必要です。              |
| リッチなネイティブ compaction メタデータ                     | OpenClaw は compaction の開始と完了を監視しますが、安定した保持/破棄リスト、トークン差分、または要約ペイロードは受け取りません。            | よりリッチな Codex compaction イベントが必要です。                                                     |
| Compaction 介入                             | 現在の OpenClaw compaction hooks は Codex モードでは通知レベルです。                                                                         | plugins がネイティブ compaction を拒否または書き換える必要がある場合は、Codex の compaction 前後 hooks を追加します。 |
| バイト単位で一致するモデル API リクエストのキャプチャ             | OpenClaw は app-server リクエストと通知をキャプチャできますが、Codex core は最終的な OpenAI API リクエストを内部で構築します。                      | Codex の model-request トレースイベントまたは debug API が必要です。                                   |

## ツール、メディア、compaction

Codex harness は低レベルの組み込み agent executor のみを変更します。

OpenClaw は引き続きツールリストを構築し、harness から動的ツール結果を受け取ります。テキスト、画像、動画、音楽、TTS、承認、messaging-tool 出力は、通常の OpenClaw 配信パスを通り続けます。

ネイティブ hook relay は意図的に汎用的ですが、v1 サポート契約は OpenClaw がテストする Codex ネイティブツールおよび権限パスに限定されます。Codex runtime では、shell、patch、MCP `PreToolUse`、`PostToolUse`、`PermissionRequest` ペイロードが含まれます。runtime 契約で名前が付くまでは、将来のすべての Codex hook イベントが OpenClaw plugin サーフェスであると仮定しないでください。

`PermissionRequest` では、OpenClaw はポリシーが決定した場合にのみ明示的な許可または拒否の判断を返します。判断なしの結果は許可ではありません。Codex はそれを hook 判断なしとして扱い、自身のガーディアンまたはユーザー承認パスにフォールスルーします。

Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` とマークした場合、Codex MCP ツール承認 elicitation は OpenClaw の plugin 承認フローにルーティングされます。Codex `request_user_input` プロンプトは送信元チャットへ返され、次にキューされたフォローアップメッセージは追加コンテキストとして誘導されるのではなく、そのネイティブサーバーリクエストへの回答になります。その他の MCP elicitation リクエストは引き続き fail closed になります。

アクティブ実行キューの誘導は Codex app-server `turn/steer` にマップされます。デフォルトの `messages.queue.mode: "steer"` では、OpenClaw は構成された静かな時間内にキューされたチャットメッセージをまとめ、到着順に 1 つの `turn/steer` リクエストとして送信します。従来の `queue` モードでは、個別の `turn/steer` リクエストを送信します。Codex のレビューおよび手動 compaction ターンでは同一ターンの誘導が拒否される場合があり、その場合 OpenClaw は選択されたモードでフォールバックが許可されていれば followup queue を使用します。[Steering queue](/ja-JP/concepts/queue-steering) を参照してください。

選択されたモデルが Codex harness を使用する場合、ネイティブスレッド compaction は Codex app-server に委譲されます。OpenClaw はチャネル履歴、検索、`/new`、`/reset`、および将来のモデルまたは harness 切り替えのために transcript ミラーを保持します。ミラーには、ユーザープロンプト、最終的な assistant テキスト、および app-server が発行する場合の軽量な Codex reasoning または plan レコードが含まれます。現時点では、OpenClaw はネイティブ compaction の開始および完了シグナルのみを記録します。人間が読める compaction 要約や、compaction 後に Codex が保持したエントリの監査可能なリストはまだ公開していません。

Codex は正規のネイティブスレッドを所有しているため、`tool_result_persist` は現在 Codex ネイティブツール結果レコードを書き換えません。OpenClaw が OpenClaw 所有のセッション transcript ツール結果を書き込む場合にのみ適用されます。

メディア生成に PI は不要です。画像、動画、音楽、PDF、TTS、メディア理解は、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts` などの対応する provider/model 設定を引き続き使用します。

## トラブルシューティング

**Codex が通常の `/model` provider として表示されない:** 新しい config では想定される動作です。`agentRuntime.id: "codex"` を指定した `openai/gpt-*` モデル（または従来の `codex/*` ref）を選択し、`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく PI を使用する:** `agentRuntime.id: "auto"` では、Codex harness が実行を要求しない場合に互換性 backend として PI を引き続き使用できます。テスト中に Codex の選択を強制するには、`agentRuntime.id: "codex"` を設定します。強制された Codex runtime は PI にフォールバックせず失敗します。Codex app-server が選択されると、その失敗は直接表面化します。

**app-server が拒否される:** app-server handshake がバージョン `0.125.0` 以降を報告するように Codex をアップグレードしてください。同一バージョンの prerelease や、`0.125.0-alpha.2` または `0.125.0+custom` のような build suffix 付きバージョンは拒否されます。これは、安定版 `0.125.0` の protocol floor が OpenClaw のテスト対象だからです。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にしてください。

**WebSocket transport がすぐ失敗する:** `appServer.url`、`authToken`、およびリモート app-server が同じ Codex app-server protocol version を話していることを確認してください。

**非 Codex モデルが PI を使用する:** その agent に対して `agentRuntime.id: "codex"` を強制した場合、または従来の `codex/*` ref を選択した場合を除き、これは想定される動作です。通常の `openai/gpt-*` やその他の provider ref は、`auto` モードでは通常の provider パスに留まります。`agentRuntime.id: "codex"` を強制する場合、その agent のすべての組み込みターンは Codex がサポートする OpenAI モデルである必要があります。

**Computer Use がインストールされているがツールが実行されない:** 新しいセッションから `/codex computer-use status` を確認してください。ツールが `Native hook relay unavailable` を報告する場合は、`/new` または `/reset` を使用してください。それでも続く場合は、gateway を再起動して古いネイティブ hook 登録をクリアしてください。`computer-use.list_apps` がタイムアウトする場合は、Codex Computer Use または Codex Desktop を再起動して再試行してください。

## 関連

- [Agent harness plugins](/ja-JP/plugins/sdk-agent-harness)
- [Agent runtimes](/ja-JP/concepts/agent-runtimes)
- [Model providers](/ja-JP/concepts/model-providers)
- [OpenAI provider](/ja-JP/providers/openai)
- [Status](/ja-JP/cli/status)
- [Plugin hooks](/ja-JP/plugins/hooks)
- [Configuration reference](/ja-JP/gateway/configuration-reference)
- [Testing](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
