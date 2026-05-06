---
read_when:
    - 同梱の Codex app-server ハーネスを使用したい場合
    - Codex ハーネスの設定例が必要です
    - Codex 専用のデプロイで、PI にフォールバックせずに失敗するようにしたい場合
summary: 同梱の Codex app-server ハーネスを通じて OpenClaw 埋め込みエージェントのターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-05-06T05:13:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 353812c804c896eccc3415a108e8b9c4628adb8c98bba8978bfc6c3dc57587b5
    source_path: plugins/codex-harness.md
    workflow: 16
---

バンドルされた `codex` Plugin により、OpenClaw は組み込みの PI ハーネスではなく
Codex app-server を通じて埋め込みエージェントターンを実行できます。

低レベルのエージェントセッションを Codex に所有させたい場合に使用します。モデル
検出、ネイティブなスレッド再開、ネイティブ Compaction、app-server 実行などです。
OpenClaw は引き続き、チャットチャンネル、セッションファイル、モデル選択、ツール、
承認、メディア配信、表示されるトランスクリプトミラーを所有します。

ソースチャットターンが Codex ハーネスを通じて実行される場合、デプロイメントで
`messages.visibleReplies` が明示的に設定されていなければ、表示される返信はデフォルトで
OpenClaw の `message` ツールになります。エージェントは Codex ターンを非公開で完了できます。
チャンネルに投稿するのは、`message(action="send")` を呼び出した場合だけです。
従来の自動配信パスでダイレクトチャットの最終返信を維持するには、
`messages.visibleReplies: "automatic"` を設定します。

Codex の Heartbeat ターンでも、デフォルトで `heartbeat_respond` ツールが提供されるため、
エージェントは最終テキストに制御フローを埋め込まずに、ウェイクを静かに保つか通知するかを
記録できます。

Heartbeat 固有の主体性ガイダンスは、その Heartbeat ターン自体に Codex コラボレーションモードの
開発者指示として送信されます。通常のチャットターンでは、通常のランタイムプロンプトに
Heartbeat の思想を持ち込むのではなく、Codex Default モードに戻ります。

状況を把握したい場合は、
[エージェントランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。短く言えば、
`openai/gpt-5.5` はモデル参照、`codex` はランタイムであり、Telegram、
Discord、Slack、または別のチャンネルが通信サーフェスのままです。

## クイック設定

「OpenClaw の中で Codex」を使いたいほとんどのユーザーが望むのはこのルートです。
ChatGPT/Codex サブスクリプションでサインインし、その後、ネイティブ
Codex app-server ランタイムを通じて埋め込みエージェントターンを実行します。
モデル参照は引き続き `openai/gpt-*` として正規のままです。サブスクリプション認証は
`openai-codex/*` モデルプレフィックスではなく、Codex アカウント/プロファイルから取得されます。

まだ行っていない場合は、まず Codex OAuth でサインインします。

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

設定で `openai-codex/gpt-*` を使用しないでください。そのプレフィックスはレガシールートであり、
`openclaw doctor --fix` によって、プライマリモデル、フォールバック、Heartbeat/サブエージェント/
Compaction オーバーライド、フック、チャンネルオーバーライド、および古い永続化セッションルートピン全体で
`openai/gpt-*` に書き換えられます。

## この Plugin が変更すること

バンドルされた `codex` Plugin は、複数の独立した機能を提供します。

| 機能                              | 使い方                                              | 動作                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| ネイティブ埋め込みランタイム      | `agentRuntime.id: "codex"`                          | OpenClaw の埋め込みエージェントターンを Codex app-server 経由で実行します。  |
| ネイティブチャット制御コマンド    | `/codex bind`, `/codex resume`, `/codex steer`, ... | メッセージング会話から Codex app-server スレッドをバインドして制御します。   |
| Codex app-server プロバイダー/カタログ | `codex` 内部、ハーネス経由で公開                   | ランタイムが app-server モデルを検出して検証できるようにします。             |
| Codex メディア理解パス            | `codex/*` 画像モデル互換パス                        | サポートされる画像理解モデル向けに、境界付けられた Codex app-server ターンを実行します。 |
| ネイティブフックリレー            | Codex ネイティブイベントを囲む Plugin フック        | OpenClaw がサポート対象の Codex ネイティブツール/最終化イベントを監視/ブロックできるようにします。 |

Plugin を有効にすると、これらの機能が利用可能になります。ただし、次のことは行いません。

- すべての OpenAI モデルで Codex を使用し始める
- Codex がインストール済み、有効、`codex` ハーネスを提供している、かつ OAuth 準備済みであることを
  doctor が検証せずに、`openai-codex/*` モデル参照をネイティブランタイムに変換する
- ACP/acpx をデフォルトの Codex パスにする
- すでに PI ランタイムを記録している既存セッションをホットスイッチする
- OpenClaw のチャンネル配信、セッションファイル、認証プロファイルストレージ、または
  メッセージルーティングを置き換える

同じ Plugin は、ネイティブな `/codex` チャット制御コマンドサーフェスも所有します。
Plugin が有効で、ユーザーがチャットから Codex スレッドのバインド、再開、ステア、停止、または検査を
求めた場合、エージェントは ACP ではなく `/codex ...` を優先するべきです。ACP は、
ユーザーが ACP/acpx を求めた場合、または ACP Codex アダプターをテストしている場合の明示的な
フォールバックのままです。

ネイティブ Codex ターンは、OpenClaw Plugin フックを公開互換レイヤーとして維持します。
これらはプロセス内の OpenClaw フックであり、Codex `hooks.json` コマンドフックではありません。

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write`（ミラーされたトランスクリプトレコード用）
- Codex `Stop` リレー経由の `before_agent_finalize`
- `agent_end`

Plugin は、ランタイム中立のツール結果ミドルウェアを登録して、OpenClaw がツールを実行した後、
結果が Codex に返される前に OpenClaw の動的ツール結果を書き換えることもできます。これは、
OpenClaw が所有するトランスクリプトのツール結果書き込みを変換する公開
`tool_result_persist` Plugin フックとは別のものです。

Plugin フックのセマンティクス自体については、[Plugin フック](/ja-JP/plugins/hooks) と
[Plugin ガードの動作](/ja-JP/tools/plugin) を参照してください。

ハーネスはデフォルトでオフです。新しい設定では、OpenAI モデル参照を
`openai/gpt-*` として正規に保ち、ネイティブ app-server 実行が必要な場合に
`agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex` を明示的に強制するべきです。
レガシーの `codex/*` モデル参照は互換性のため引き続きハーネスを自動選択しますが、
ランタイムに裏付けられたレガシープロバイダープレフィックスは、通常のモデル/プロバイダー選択肢としては表示されません。

設定されたモデルルートがまだ `openai-codex/*` の場合、`openclaw doctor --fix` はそれを
`openai/*` に書き換えます。一致するエージェントルートについては、Codex Plugin がインストール済み、
有効、`codex` ハーネスを提供している、かつ使用可能な OAuth がある場合にのみ、エージェントランタイムを
`codex` に設定します。それ以外の場合はランタイムを `pi` に設定します。

## ルートマップ

設定を変更する前に、この表を使用してください。

| 目的の動作                                             | モデル参照                 | ランタイム設定                         | 認証/プロファイルルート       | 期待されるステータスラベル     |
| ------------------------------------------------------ | -------------------------- | -------------------------------------- | ----------------------------- | ------------------------------ |
| ネイティブ Codex ランタイム付き ChatGPT/Codex サブスクリプション | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth または Codex アカウント | `Runtime: OpenAI Codex`        |
| 通常の OpenClaw ランナー経由の OpenAI API              | `openai/gpt-*`             | 省略、または `runtime: "pi"`           | OpenAI API キー               | `Runtime: OpenClaw Pi Default` |
| doctor 修復が必要なレガシー設定                        | `openai-codex/gpt-*`       | `codex` または `pi` に修復             | 既存の設定済み認証            | `doctor --fix` 後に再確認      |
| 保守的な auto モードでの混在プロバイダー               | プロバイダー固有の参照     | `agentRuntime.id: "auto"`              | 選択されたプロバイダーごと    | 選択されたランタイムによる     |
| 明示的な Codex ACP アダプターセッション                | ACP プロンプト/モデル依存  | `runtime: "acp"` 付き `sessions_spawn` | ACP バックエンド認証          | ACP タスク/セッションステータス |

重要な分岐は、プロバイダーとランタイムの違いです。

- `openai-codex/*` は doctor が書き換えるレガシールートです。
- `agentRuntime.id: "codex"` は Codex ハーネスを要求し、利用できない場合はフェイルクローズします。
- `agentRuntime.id: "auto"` は、登録済みハーネスが一致するプロバイダールートを要求できるようにしますが、
  正規の OpenAI 参照は、ハーネスがそのプロバイダー/モデルの組み合わせをサポートしない限り、引き続き PI が所有します。
- `/codex ...` は「このチャットはどのネイティブ Codex 会話にバインドまたは制御するべきか」に答えます。
- ACP は「acpx はどの外部ハーネスプロセスを起動するべきか」に答えます。

## 適切なモデルプレフィックスを選ぶ

OpenAI ファミリーのルートはプレフィックス固有です。一般的なサブスクリプションとネイティブ
Codex ランタイムのセットアップでは、`agentRuntime.id: "codex"` とともに `openai/*` を使用します。
`openai-codex/*` は doctor が書き換えるべきレガシー設定として扱ってください。

| モデル参照                                    | ランタイムパス                             | 使用する場合                                                                |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI 配管経由の OpenAI プロバイダー | `OPENAI_API_KEY` を使って現在の直接 OpenAI Platform API アクセスを使いたい場合。 |
| `openai-codex/gpt-5.5`                        | doctor によって修復されるレガシールート    | 古い設定を使用している場合。`openclaw doctor --fix` を実行して書き換えます。 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server ハーネス                   | ChatGPT/Codex サブスクリプション認証とネイティブ Codex 実行を使いたい場合。 |

GPT-5.5 は、アカウントで公開されている場合、直接 OpenAI API キールートと Codex サブスクリプションルートの
両方に現れることがあります。ネイティブ Codex ランタイムには、Codex app-server ハーネスとともに
`openai/gpt-5.5` を使用します。直接 API キートラフィックには、Codex ランタイムオーバーライドなしで
`openai/gpt-5.5` を使用します。

レガシーの `codex/gpt-*` 参照は、互換エイリアスとして引き続き受け入れられます。doctor の互換性移行は、
レガシーランタイム参照を正規モデル参照に書き換え、ランタイムポリシーを別に記録します。
新しいネイティブ app-server ハーネス設定では、`openai/gpt-*` と `agentRuntime.id: "codex"` を使用するべきです。

`agents.defaults.imageModel` も同じプレフィックス分岐に従います。通常の OpenAI ルートには
`openai/gpt-*` を使用し、画像理解を境界付けられた Codex app-server ターン経由で実行する場合は
`codex/gpt-*` を使用します。`openai-codex/gpt-*` は使用しないでください。doctor はそのレガシープレフィックスを
`openai/gpt-*` に書き換えます。Codex app-server モデルは画像入力サポートを広告している必要があります。
テキスト専用の Codex モデルは、メディアターンが開始する前に失敗します。

現在のセッションの有効なハーネスを確認するには `/status` を使用します。選択が予想外の場合は、
`agents/harness` サブシステムのデバッグログを有効にし、Gateway の構造化された
`agent harness selected` レコードを調べます。そこには、選択されたハーネス ID、選択理由、
ランタイム/フォールバックポリシー、および `auto` モードでは各 Plugin 候補のサポート結果が含まれます。

### doctor 警告の意味

設定されたモデル参照や永続化されたセッションルート状態がまだ `openai-codex/*` を使用している場合、
`openclaw doctor` は警告します。`openclaw doctor --fix` はそれらのルートを次のように書き換えます。

- `openai/<model>`
- Codex がインストール済み、有効、`codex` ハーネスを提供しており、使用可能な OAuth がある場合は
  `agentRuntime.id: "codex"`
- それ以外の場合は `agentRuntime.id: "pi"`

`codex` ルートはネイティブ Codex ハーネスを強制します。`pi` ルートは、
レガシールートのクリーンアップの副作用として Codex を有効化またはインストールするのではなく、
エージェントをデフォルトの OpenClaw ランナーに留めます。
doctor は、検出されたエージェントセッションストア全体で古い永続化セッションピンも修復するため、
古い会話が削除されたルートに固定されたままになることはありません。

ハーネス選択はライブセッション制御ではありません。埋め込みターンが実行されると、
OpenClaw は選択されたハーネス id をそのセッションに記録し、同じセッション id の
後続ターンでもそれを使い続けます。将来のセッションで別のハーネスを使いたい場合は
`agentRuntime` 設定または `OPENCLAW_AGENT_RUNTIME` を変更してください。既存の
会話を PI と Codex の間で切り替える前に、新しいセッションを開始するには `/new`
または `/reset` を使います。これにより、1つのトランスクリプトを互換性のない
2つのネイティブセッションシステムで再生することを避けられます。

ハーネス pin が導入される前に作成されたレガシーセッションは、トランスクリプト履歴を
持つと PI に pin されたものとして扱われます。設定を変更した後、その会話を Codex に
オプトインするには `/new` または `/reset` を使ってください。

`/status` は有効なモデルランタイムを表示します。デフォルトの PI ハーネスは
`Runtime: OpenClaw Pi Default` と表示され、Codex app-server ハーネスは
`Runtime: OpenAI Codex` と表示されます。

## 要件

- 同梱の `codex` Plugin が利用可能な OpenClaw。
- Codex app-server `0.125.0` 以降。同梱 Plugin はデフォルトで互換性のある
  Codex app-server バイナリを管理するため、`PATH` 上のローカル `codex` コマンドは
  通常のハーネス起動には影響しません。
- app-server プロセス、または OpenClaw の Codex 認証ブリッジで Codex 認証が
  利用可能であること。ローカルの app-server 起動では、各エージェントごとに
  OpenClaw が管理する Codex ホームと分離された子 `HOME` を使用するため、
  デフォルトでは個人の `~/.codex` アカウント、Skills、Plugin、設定、スレッド状態、
  またはネイティブの `$HOME/.agents/skills` は読み取りません。

この Plugin は、古い、またはバージョン不明の app-server ハンドシェイクをブロックします。
これにより、OpenClaw はテスト済みのプロトコルサーフェス上に保たれます。

ライブテストと Docker スモークテストでは、認証は通常 Codex CLI アカウントまたは
OpenClaw の `openai-codex` 認証プロファイルから取得されます。ローカルの stdio
app-server 起動では、アカウントが存在しない場合に `CODEX_API_KEY` /
`OPENAI_API_KEY` へフォールバックすることもできます。

## ワークスペースブートストラップファイル

Codex はネイティブのプロジェクトドキュメント検出を通じて `AGENTS.md` 自体を扱います。
OpenClaw は合成された Codex プロジェクトドキュメントファイルを書き込まず、ペルソナファイル用の
Codex フォールバックファイル名にも依存しません。Codex のフォールバックは
`AGENTS.md` が存在しない場合にのみ適用されるためです。

OpenClaw ワークスペースの同等性のために、Codex ハーネスは他のブートストラップファイル
（存在する場合の `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、
`BOOTSTRAP.md`、および `MEMORY.md`）を解決し、`thread/start` と `thread/resume` の
Codex 設定 instructions を通じて転送します。これにより、`AGENTS.md` を複製せずに
`SOUL.md` と関連するワークスペースのペルソナ/プロファイルコンテキストを表示できます。

## Codex を他のモデルと併用する

同じエージェントが Codex と非 Codex プロバイダーモデルの間を自由に切り替える必要がある場合、
`agentRuntime.id: "codex"` をグローバルに設定しないでください。強制されたランタイムは、
そのエージェントまたはセッションのすべての埋め込みターンに適用されます。そのランタイムが
強制されている状態で Anthropic モデルを選択すると、OpenClaw はそれでも Codex ハーネスを
試行し、そのターンを PI 経由で暗黙にルーティングするのではなく、クローズドに失敗します。

代わりに、次のいずれかの形を使ってください。

- `agentRuntime.id: "codex"` を持つ専用エージェントに Codex を置く。
- 通常の混在プロバイダー利用では、デフォルトエージェントを `agentRuntime.id: "auto"` と
  PI フォールバックのままにする。
- レガシーの `codex/*` 参照は互換性のためだけに使う。新しい設定では、
  `openai/*` と明示的な Codex ランタイムポリシーを優先する。

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
- `codex` エージェントで Codex が存在しない、またはサポートされていない場合、そのターンは
  PI を静かに使うのではなく失敗します。

## エージェントコマンドのルーティング

エージェントは「Codex」という単語だけではなく、意図に基づいてユーザーリクエストをルーティングする必要があります。

| ユーザーの依頼内容                                       | エージェントが使うべきもの                              |
| ------------------------------------------------------ | ------------------------------------------------ |
| 「このチャットを Codex にバインド」                              | `/codex bind`                                    |
| 「Codex スレッド `<id>` をここで再開」                      | `/codex resume <id>`                             |
| 「Codex スレッドを表示」                                   | `/codex threads`                                 |
| 「問題のある Codex 実行についてサポートレポートを提出」            | `/diagnostics [note]`                            |
| 「この添付スレッドについてだけ Codex フィードバックを送信」    | `/codex diagnostics [note]`                      |
| 「ChatGPT/Codex サブスクリプションを Codex ランタイムで使う」 | `openai/*` に加えて `agentRuntime.id: "codex"`       |
| 「古い `openai-codex/*` 設定/セッション pin を修復」      | `openclaw doctor --fix`                          |
| 「ACP/acpx 経由で Codex を実行」                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「スレッドで Claude Code/Gemini/OpenCode/Cursor を開始」 | ACP/acpx、`/codex` ではなく、ネイティブサブエージェントでもない |

OpenClaw は、ACP が有効で、ディスパッチ可能で、ロード済みランタイムバックエンドによって
裏付けられている場合にのみ、ACP spawn ガイダンスをエージェントへ提示します。ACP が利用できない場合、
システムプロンプトと Plugin Skills はエージェントに ACP ルーティングを教えるべきではありません。

## Codex 専用デプロイ

すべての埋め込みエージェントターンが Codex を使うことを証明する必要がある場合は、
Codex ハーネスを強制します。明示的な Plugin ランタイムはクローズドに失敗し、
PI 経由で暗黙に再試行されることはありません。

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

環境による上書き:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Codex が強制されている場合、Codex Plugin が無効、app-server が古すぎる、または
app-server を起動できない場合に OpenClaw は早期に失敗します。

## エージェントごとの Codex

デフォルトエージェントを通常の自動選択のままにしながら、1つのエージェントだけを Codex 専用にできます。

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
OpenClaw セッションを作成し、Codex ハーネスは必要に応じてサイドカー app-server
スレッドを作成または再開します。`/reset` はそのスレッドに対する OpenClaw セッションの
バインドをクリアし、次のターンで現在の設定からハーネスを再解決できるようにします。

## モデル検出

デフォルトでは、Codex Plugin は app-server に利用可能なモデルを問い合わせます。
検出に失敗するかタイムアウトした場合、次の同梱フォールバックカタログを使います。

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

起動時に Codex のプローブを避け、フォールバックカタログだけを使いたい場合は検出を無効にします。

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

デフォルトでは、Plugin は OpenClaw が管理する Codex バイナリをローカルで次のように起動します。

```bash
codex app-server --listen stdio://
```

管理対象バイナリは `codex` Plugin パッケージに同梱されています。これにより、
app-server のバージョンはローカルにたまたまインストールされている別の Codex CLI ではなく、
同梱 Plugin に紐づきます。意図的に別の実行ファイルを実行したい場合にのみ
`appServer.command` を設定してください。

デフォルトでは、OpenClaw はローカルの Codex ハーネスセッションを YOLO モードで開始します。
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"` です。これは自律 Heartbeat に使われる信頼済みローカル
オペレーター姿勢です。Codex は、応答する人がいないネイティブ承認プロンプトで停止せずに、
シェルとネットワークツールを使えます。

Codex の guardian レビュー付き承認にオプトインするには、`appServer.mode:
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

Guardian モードは Codex のネイティブ自動レビュー承認パスを使います。Codex がサンドボックスを
抜ける、ワークスペース外へ書き込む、またはネットワークアクセスなどの権限を追加する必要がある場合、
Codex はその承認リクエストを人間のプロンプトではなくネイティブレビュアーへルーティングします。
レビュアーは Codex のリスクフレームワークを適用し、その特定のリクエストを承認または拒否します。
YOLO モードより多くのガードレールが必要だが、無人エージェントにも進捗を出させる必要がある場合に
Guardian を使ってください。

`guardian` プリセットは `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。
個別のポリシーフィールドは引き続き `mode` を上書きするため、高度なデプロイでは
プリセットと明示的な選択を組み合わせられます。古い `guardian_subagent` レビュアー値は
互換エイリアスとして引き続き受け入れられますが、新しい設定では `auto_review` を使うべきです。

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

stdio app-server 起動はデフォルトで OpenClaw のプロセス環境を継承しますが、
OpenClaw は Codex app-server アカウントブリッジを所有し、`CODEX_HOME` と `HOME` の両方を、
そのエージェントの OpenClaw 状態配下にあるエージェントごとのディレクトリへ設定します。
Codex 自身の skill ローダーは `$CODEX_HOME/skills` と `$HOME/.agents/skills` を読むため、
ローカル app-server 起動では両方の値が分離されます。これにより、Codex ネイティブの Skills、
Plugin、設定、アカウント、スレッド状態がオペレーター個人の Codex CLI ホームから漏れ込むのではなく、
OpenClaw エージェントにスコープされます。

OpenClaw Plugin と OpenClaw Skills スナップショットは、引き続き OpenClaw 独自の
Plugin レジストリと skill ローダーを通じて流れます。個人の Codex CLI アセットは流れません。
OpenClaw エージェントの一部にすべき有用な Codex CLI Skills または Plugin がある場合は、
明示的に棚卸ししてください。

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex 移行プロバイダーは Skills を現在の OpenClaw エージェントワークスペースにコピーします。
Codex ネイティブの Plugin、フック、設定ファイルは自動的に有効化されるのではなく、
手動レビュー用に報告またはアーカイブされます。これらはコマンドを実行したり、MCP サーバーを公開したり、
認証情報を含んだりする可能性があるためです。

認証は次の順序で選択されます。

1. エージェント用の明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex ホーム内にある app-server の既存アカウント。
3. ローカルの stdio app-server 起動の場合に限り、app-server アカウントが存在せず OpenAI 認証が
   まだ必要な場合は、`CODEX_API_KEY`、その後 `OPENAI_API_KEY`。

OpenClaw は、ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、生成された Codex 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、
Gateway レベルの API キーを embeddings や直接の OpenAI モデルで利用できるままにしつつ、
ネイティブ Codex app-server ターンが誤って API 経由で課金されることを防ぎます。
明示的な Codex API キープロファイルと、ローカル stdio env キーフォールバックは、継承された子プロセス環境ではなく app-server
ログインを使用します。WebSocket app-server 接続は
Gateway env API キーフォールバックを受け取りません。明示的な認証プロファイル、または
リモート app-server 自身のアカウントを使用してください。

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
OpenClaw は Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません:
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、および
`update_plan`。messaging、sessions、media、
cron、browser、nodes、gateway、`heartbeat_respond`、`web_search` などの
OpenClaw 統合ツールは引き続き利用できます。

サポートされるトップレベルの Codex Plugin フィールド:

| フィールド                 | デフォルト     | 意味                                                                                      |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Codex app-server に OpenClaw 動的ツールセット全体を公開するには `"openclaw-compat"` を使用します。 |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server ターンから省略する追加の OpenClaw 動的ツール名。                         |

サポートされる `appServer` フィールド:

| フィールド          | デフォルト                              | 意味                                                                                                                                                                                                                     |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` は Codex を生成します。`"websocket"` は `url` に接続します。                                                                                                                                                   |
| `command`           | 管理対象の Codex バイナリ               | stdio トランスポート用の実行ファイル。管理対象バイナリを使用する場合は未設定のままにし、明示的に上書きする場合にのみ設定します。                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio トランスポート用の引数。                                                                                                                                                                                          |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                               |
| `authToken`         | 未設定                                   | WebSocket トランスポート用の Bearer トークン。                                                                                                                                                                          |
| `headers`           | `{}`                                     | 追加の WebSocket ヘッダー。                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | OpenClaw が継承環境を構築した後に、生成された stdio app-server プロセスから削除される追加の環境変数名。`CODEX_HOME` と `HOME` は、ローカル起動時の OpenClaw のエージェント単位の Codex 分離用に予約されています。 |
| `requestTimeoutMs`  | `60000`                                  | app-server control-plane 呼び出しのタイムアウト。                                                                                                                                                                       |
| `mode`              | `"yolo"`                                 | YOLO または guardian レビュー付き実行のプリセット。                                                                                                                                                                     |
| `approvalPolicy`    | `"never"`                                | スレッド開始/再開/ターンに送信されるネイティブ Codex 承認ポリシー。                                                                                                                                                    |
| `sandbox`           | `"danger-full-access"`                   | スレッド開始/再開に送信されるネイティブ Codex サンドボックスモード。                                                                                                                                                    |
| `approvalsReviewer` | `"user"`                                 | Codex にネイティブ承認プロンプトをレビューさせるには `"auto_review"` を使用します。`guardian_subagent` はレガシーエイリアスのままです。                                                                                 |
| `serviceTier`       | 未設定                                   | 任意の Codex app-server サービス階層: `"fast"`、`"flex"`、または `null`。無効なレガシー値は無視されます。                                                                                                                |

OpenClaw 所有の動的ツール呼び出しは、
`appServer.requestTimeoutMs` とは独立して制限されます。各 Codex `item/tool/call` リクエストは、
30 秒以内に OpenClaw 応答を受け取る必要があります。タイムアウト時には、OpenClaw はサポートされる場合にツール
シグナルを中止し、Codex に失敗した動的ツール応答を返します。これにより、
セッションを `processing` のまま残すのではなく、ターンを継続できます。

OpenClaw が Codex ターンスコープの app-server リクエストに応答した後、ハーネスは
Codex が `turn/completed` でネイティブターンを完了することも期待します。その応答後に
app-server が 60 秒間沈黙した場合、OpenClaw はベストエフォートで
Codex ターンを割り込み、診断タイムアウトを記録し、OpenClaw セッションレーンを解放します。これにより、後続のチャットメッセージが古い
ネイティブターンの背後でキューに入れられないようにします。

ローカルテスト用の環境上書きは引き続き利用できます:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、
`OPENCLAW_CODEX_APP_SERVER_BIN` は管理対象バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、
一回限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。繰り返し可能なデプロイでは、
Codex ハーネス設定の残りと同じレビュー済みファイル内に Plugin の動作を保持できるため、設定の使用が推奨されます。

## コンピューター操作

コンピューター操作については、専用のセットアップガイドで説明しています:
[Codex コンピューター操作](/ja-JP/plugins/codex-computer-use)。

要約すると、OpenClaw はデスクトップ制御アプリを vendoring せず、デスクトップ操作を自ら実行しません。Codex app-server を準備し、
`computer-use` MCP サーバーが利用可能であることを検証したうえで、Codex モードのターン中に
Codex がネイティブ MCP ツール呼び出しを処理できるようにします。

Codex marketplace フロー外で TryCua ドライバーに直接アクセスするには、
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` で
`cua-driver mcp` を登録します。
Codex 所有のコンピューター操作と直接 MCP 登録の違いについては、
[Codex コンピューター操作](/ja-JP/plugins/codex-computer-use) を参照してください。

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

コンピューター操作は macOS 固有であり、Codex MCP サーバーがアプリを制御できるようになる前に、
ローカル OS の権限が必要になる場合があります。`computerUse.enabled` が true で MCP
サーバーが利用できない場合、Codex モードのターンは、ネイティブのコンピューター操作ツールなしで黙って実行されるのではなく、
スレッド開始前に失敗します。marketplace の選択肢、リモートカタログの制限、ステータス理由、トラブルシューティングについては、
[Codex コンピューター操作](/ja-JP/plugins/codex-computer-use) を参照してください。

`computerUse.autoInstall` が true の場合、Codex がまだローカル marketplace を検出していなければ、OpenClaw は
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` から標準のバンドル済み Codex Desktop marketplace を登録できます。ランタイムまたはコンピューター操作の設定を変更した後は、
既存のセッションが古い PI または Codex スレッドのバインディングを保持しないように、`/new` または `/reset` を使用してください。

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

モデル切り替えは OpenClaw が制御し続けます。OpenClaw セッションが既存の Codex スレッドにアタッチされている場合、
次のターンでは現在選択されている
OpenAI モデル、provider、承認ポリシー、サンドボックス、サービス階層が再び
app-server に送信されます。`openai/gpt-5.5` から `openai/gpt-5.2` へ切り替えると、
スレッドのバインディングは維持されますが、Codex には新しく選択されたモデルで続行するよう要求されます。

## Codex コマンド

バンドル済み Plugin は、`/codex` を承認済みスラッシュコマンドとして登録します。これは
汎用であり、OpenClaw テキストコマンドをサポートする任意のチャンネルで動作します。

一般的な形式:

- `/codex status` は、ライブのアプリサーバー接続、モデル、アカウント、レート制限、MCP サーバー、Skills を表示します。
- `/codex models` は、ライブの Codex アプリサーバーモデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex スレッドにアタッチします。
- `/codex compact` は、アタッチされたスレッドをコンパクト化するよう Codex アプリサーバーに要求します。
- `/codex review` は、アタッチされたスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、アタッチされたスレッドの Codex 診断フィードバックを送信する前に確認を求めます。
- `/codex computer-use status` は、設定済みの Computer Use Plugin と MCP サーバーを確認します。
- `/codex computer-use install` は、設定済みの Computer Use Plugin をインストールし、MCP サーバーを再読み込みします。
- `/codex account` は、アカウントとレート制限の状態を表示します。
- `/codex mcp` は、Codex アプリサーバーの MCP サーバー状態を一覧表示します。
- `/codex skills` は、Codex アプリサーバーの Skills を一覧表示します。

Codex が使用量制限エラーを報告した場合、Codex が次回の
アプリサーバーリセット時刻を提供していれば、OpenClaw はそれを含めます。同じ
会話で `/codex account` を使い、現在のアカウントとレート制限ウィンドウを確認します。

### 一般的なデバッグワークフロー

Codex に支えられたエージェントが Telegram、Discord、Slack、
または別のチャンネルで予期しないことをした場合は、問題が発生した会話から始めます。

1. `/diagnostics bad tool choice after image upload`、または見た内容を説明する別の短いメモを実行します。
2. 診断リクエストを一度承認します。この承認により、ローカル Gateway
   診断 zip が作成されます。また、セッションが Codex ハーネスを使っているため、
   関連する Codex フィードバックバンドルも OpenAI サーバーへ送信されます。
3. 完了した診断返信をバグレポートまたはサポートスレッドにコピーします。
   そこには、ローカルバンドルパス、プライバシー概要、OpenClaw セッション ID、
   Codex スレッド ID、各 Codex スレッドの `Inspect locally` 行が含まれます。
4. 自分で実行をデバッグしたい場合は、出力された `Inspect locally`
   コマンドをターミナルで実行します。これは `codex resume <thread-id>` のような形式で、
   ネイティブ Codex スレッドを開き、会話を確認したり、ローカルで続行したり、
   Codex が特定のツールや計画を選んだ理由を尋ねたりできます。

完全な OpenClaw Gateway 診断バンドルなしで、現在アタッチされているスレッドの Codex
フィードバックアップロードだけが明確に必要な場合にのみ、`/codex diagnostics [note]` を使います。
ほとんどのサポートレポートでは、ローカル Gateway 状態と Codex
スレッド ID を 1 つの返信にまとめるため、`/diagnostics [note]` の方が出発点として適しています。
完全なプライバシーモデルとグループチャットでの動作については、[診断エクスポート](/ja-JP/gateway/diagnostics) を参照してください。

コア OpenClaw は、一般的な Gateway 診断コマンドとして、所有者専用の `/diagnostics [note]` も公開しています。
その承認プロンプトは機微データに関する前置きを表示し、[診断エクスポート](/ja-JP/gateway/diagnostics) にリンクし、
毎回明示的な実行承認を通じて `openclaw gateway diagnostics export --json` を要求します。
allow-all ルールで診断を承認しないでください。承認後、OpenClaw はローカルバンドルパスとマニフェスト概要を含む、
貼り付け可能なレポートを送信します。アクティブな OpenClaw セッションが Codex ハーネスを使っている場合、
同じ承認によって、関連する Codex フィードバックバンドルを OpenAI サーバーへ送信することも許可されます。
承認プロンプトには Codex フィードバックが送信されることが表示されますが、
承認前に Codex セッション ID やスレッド ID は一覧表示されません。

所有者がグループチャットで `/diagnostics` を呼び出した場合、OpenClaw は
共有チャンネルを整理された状態に保ちます。グループには短い通知だけが送られ、
診断の前置き、承認プロンプト、Codex セッション/スレッド ID は、
非公開の承認経路を通じて所有者に送信されます。非公開の所有者経路がない場合、
OpenClaw はグループからのリクエストを拒否し、DM から実行するよう所有者に求めます。

承認された Codex アップロードは、Codex アプリサーバーの `feedback/upload` を呼び出し、
利用可能な場合は、一覧にある各スレッドと生成された Codex サブスレッドのログを含めるよう
アプリサーバーに要求します。アップロードは Codex の通常のフィードバック経路を通じて OpenAI
サーバーへ送られます。そのアプリサーバーで Codex フィードバックが無効になっている場合、
コマンドはアプリサーバーエラーを返します。完了した診断返信には、送信されたスレッドの
チャンネル、OpenClaw セッション ID、Codex スレッド ID、ローカルの `codex resume <thread-id>`
コマンドが一覧表示されます。承認を拒否または無視した場合、OpenClaw はそれらの Codex ID を出力しません。
このアップロードは、ローカル Gateway 診断エクスポートを置き換えるものではありません。

`/codex resume` は、ハーネスが通常のターンで使うものと同じサイドカー結合ファイルを書き込みます。
次のメッセージで、OpenClaw はその Codex スレッドを再開し、現在選択されている OpenClaw
モデルをアプリサーバーに渡し、拡張履歴を有効に保ちます。

### CLI から Codex スレッドを確認する

問題のある Codex 実行を理解する最速の方法は、多くの場合、ネイティブ Codex
スレッドを直接開くことです。

```sh
codex resume <thread-id>
```

チャンネル会話でバグに気づき、問題の Codex セッションを確認したり、
ローカルで続行したり、Codex が特定のツールや推論を選んだ理由を尋ねたりしたい場合に使います。
通常、最も簡単な手順は、先に `/diagnostics [note]` を実行することです。承認後、
完了したレポートには各 Codex スレッドが一覧表示され、`Inspect locally` コマンド、
たとえば `codex resume <thread-id>` が出力されます。そのコマンドをそのままターミナルにコピーできます。

現在のチャットについては `/codex binding` から、最近の Codex アプリサーバースレッドについては
`/codex threads [filter]` からスレッド ID を取得し、その後シェルで同じ `codex resume`
コマンドを実行することもできます。

このコマンドサーフェスには Codex アプリサーバー `0.125.0` 以降が必要です。
将来版またはカスタムのアプリサーバーがその JSON-RPC メソッドを公開していない場合、
個別の制御メソッドは `unsupported by this Codex app-server` と報告されます。

## フック境界

Codex ハーネスには 3 つのフック層があります。

| 層                                    | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin フック                | OpenClaw                 | PI と Codex ハーネス全体での製品/Plugin 互換性。                    |
| Codex アプリサーバー拡張ミドルウェア | OpenClaw バンドル済みPlugin | OpenClaw 動的ツール周辺のターンごとのアダプター動作。              |
| Codex ネイティブフック                | Codex                    | Codex 設定からの低レベル Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、OpenClaw Plugin の動作をルーティングするために、プロジェクトまたはグローバルの Codex
`hooks.json` ファイルを使いません。サポート対象のネイティブツールと権限ブリッジについて、
OpenClaw は `PreToolUse`、`PostToolUse`、
`PermissionRequest`、`Stop` 向けのスレッドごとの Codex 設定を注入します。
`SessionStart` や `UserPromptSubmit` などのその他の Codex フックは Codex レベルの制御のままであり、
v1 契約では OpenClaw Plugin フックとして公開されません。

OpenClaw 動的ツールでは、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、
OpenClaw はハーネスアダプター内で、自身が所有する Plugin とミドルウェアの動作を発火します。
Codex ネイティブツールでは、Codex が正規のツール記録を所有します。
OpenClaw は選択されたイベントをミラーできますが、Codex がアプリサーバーまたはネイティブフックコールバックを通じて
その操作を公開しない限り、ネイティブ Codex スレッドを書き換えることはできません。

Compaction と LLM ライフサイクルの射影は、ネイティブ Codex フックコマンドではなく、
Codex アプリサーバー通知と OpenClaw アダプター状態から来ます。
OpenClaw の `before_compaction`、`after_compaction`、`llm_input`、
`llm_output` イベントはアダプターレベルの観測であり、Codex の内部リクエストや
Compaction ペイロードをバイト単位でキャプチャしたものではありません。

Codex ネイティブの `hook/started` と `hook/completed` アプリサーバー通知は、
軌跡とデバッグのために `codex_app_server.hook` エージェントイベントとして射影されます。
これらは OpenClaw Plugin フックを呼び出しません。

## V1 サポート契約

Codex モードは、下層のモデル呼び出しだけを変えた PI ではありません。Codex は
ネイティブモデルループのより多くを所有し、OpenClaw はその境界に合わせて
Plugin とセッションのサーフェスを適応させます。

Codex ランタイム v1 でサポートされるもの:

| サーフェス                                    | サポート                                | 理由                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex 経由の OpenAI モデルループ              | サポート対象                            | Codex アプリサーバーが OpenAI ターン、ネイティブスレッド再開、ネイティブツール継続を所有します。                                                                                                      |
| OpenClaw チャンネルルーティングと配信         | サポート対象                            | Telegram、Discord、Slack、WhatsApp、iMessage、およびその他のチャンネルはモデルランタイムの外側に留まります。                                                                                         |
| OpenClaw 動的ツール                           | サポート対象                            | Codex はこれらのツールを実行するよう OpenClaw に要求するため、OpenClaw は実行経路内に留まります。                                                                                                     |
| プロンプトとコンテキスト Plugin               | サポート対象                            | OpenClaw はスレッドを開始または再開する前に、プロンプトオーバーレイを構築し、コンテキストを Codex ターンへ射影します。                                                                               |
| コンテキストエンジンのライフサイクル          | サポート対象                            | Codex ターンに対して、組み立て、取り込みまたはターン後メンテナンス、コンテキストエンジンの Compaction 調整が実行されます。                                                                          |
| 動的ツールフック                              | サポート対象                            | `before_tool_call`、`after_tool_call`、およびツール結果ミドルウェアは、OpenClaw が所有する動的ツールの周辺で実行されます。                                                                            |
| ライフサイクルフック                          | アダプター観測としてサポート対象        | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は、正直な Codex モードペイロードで発火します。                                                                       |
| 最終回答リビジョンゲート                      | ネイティブフックリレー経由でサポート対象 | Codex `Stop` は `before_agent_finalize` にリレーされ、`revise` は最終化前にもう 1 回モデルパスを行うよう Codex に要求します。                                                                          |
| ネイティブ shell、patch、MCP のブロックまたは観測 | ネイティブフックリレー経由でサポート対象 | Codex `PreToolUse` と `PostToolUse` は、Codex アプリサーバー `0.125.0` 以降の MCP ペイロードを含む、コミット済みネイティブツールサーフェスについてリレーされます。ブロックはサポートされますが、引数の書き換えはサポートされません。 |
| ネイティブ権限ポリシー                        | ネイティブフックリレー経由でサポート対象 | Codex `PermissionRequest` は、ランタイムが公開している場合、OpenClaw ポリシーを通じてルーティングできます。OpenClaw が判断を返さない場合、Codex は通常の guardian またはユーザー承認経路を通じて続行します。 |
| アプリサーバー軌跡キャプチャ                  | サポート対象                            | OpenClaw は、アプリサーバーへ送信したリクエストと、受信したアプリサーバー通知を記録します。                                                                                                         |

Codex ランタイム v1 でサポートされないもの:

| サーフェス                                             | V1 境界                                                                                                                                     | 将来の道筋                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ネイティブツール引数の変更                       | Codex ネイティブのツール実行前フックはブロックできますが、OpenClaw は Codex ネイティブのツール引数を書き換えません。                                               | 置換用ツール入力には Codex のフック/スキーマサポートが必要です。                            |
| 編集可能な Codex ネイティブのトランスクリプト履歴            | Codex は正規のネイティブスレッド履歴を所有します。OpenClaw はミラーを所有し、将来のコンテキストを投影できますが、サポートされていない内部を変更すべきではありません。 | ネイティブスレッドの外科的変更が必要な場合は、明示的な Codex app-server API を追加します。                    |
| Codex ネイティブツールレコード用の `tool_result_persist` | そのフックは、Codex ネイティブのツールレコードではなく、OpenClaw が所有するトランスクリプト書き込みを変換します。                                                           | 変換済みレコードをミラーできる可能性はありますが、正規の書き換えには Codex のサポートが必要です。              |
| リッチなネイティブ Compaction メタデータ                     | OpenClaw は Compaction の開始と完了を監視しますが、安定した保持/破棄リスト、トークン差分、または要約ペイロードは受け取りません。            | よりリッチな Codex Compaction イベントが必要です。                                                     |
| Compaction への介入                             | 現在の OpenClaw Compaction フックは、Codex モードでは通知レベルです。                                                                         | plugins がネイティブ Compaction を拒否または書き換える必要がある場合は、Codex の Compaction 前後フックを追加します。 |
| バイト単位で一致するモデル API リクエストのキャプチャ             | OpenClaw は app-server のリクエストと通知をキャプチャできますが、Codex コアは最終的な OpenAI API リクエストを内部で構築します。                      | Codex のモデルリクエストトレースイベントまたはデバッグ API が必要です。                                   |

## ツール、メディア、Compaction

Codex ハーネスが変更するのは、低レベルの埋め込みエージェント実行器だけです。

OpenClaw は引き続きツールリストを構築し、ハーネスから動的なツール結果を受け取ります。テキスト、画像、動画、音楽、TTS、承認、メッセージングツール出力は、通常の OpenClaw 配信経路を通り続けます。

ネイティブフックリレーは意図的に汎用化されていますが、v1 のサポート契約は、OpenClaw がテストする Codex ネイティブのツールおよび権限パスに限定されます。Codex ランタイムでは、これには shell、patch、および MCP の `PreToolUse`、`PostToolUse`、`PermissionRequest` ペイロードが含まれます。ランタイム契約で名前が示されるまでは、将来のすべての Codex フックイベントが OpenClaw plugin サーフェスであると仮定しないでください。

`PermissionRequest` について、OpenClaw はポリシーが判断した場合にのみ明示的な許可または拒否の決定を返します。判断なしの結果は許可ではありません。Codex はそれをフック判断なしとして扱い、自身のガーディアンまたはユーザー承認パスへフォールスルーします。

Codex MCP ツール承認の elicitation は、Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` としてマークした場合、OpenClaw の plugin 承認フローを通じてルーティングされます。Codex の `request_user_input` プロンプトは送信元チャットへ送り返され、次にキューに入ったフォローアップメッセージは追加コンテキストとして誘導されるのではなく、そのネイティブサーバーリクエストへの回答になります。その他の MCP elicitation リクエストは引き続きフェイルクローズします。

アクティブ実行キューの誘導は Codex app-server の `turn/steer` にマッピングされます。デフォルトの `messages.queue.mode: "steer"` では、OpenClaw は設定された静穏ウィンドウ内のキュー済みチャットメッセージをまとめ、到着順に 1 つの `turn/steer` リクエストとして送信します。レガシーの `queue` モードは個別の `turn/steer` リクエストを送信します。Codex のレビューターンおよび手動 Compaction ターンは同一ターンの誘導を拒否する場合があり、その場合、選択されたモードがフォールバックを許可していれば OpenClaw はフォローアップキューを使用します。[誘導キュー](/ja-JP/concepts/queue-steering)を参照してください。

選択されたモデルが Codex ハーネスを使用する場合、ネイティブスレッド Compaction は Codex app-server に委任されます。OpenClaw は、チャンネル履歴、検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのためにトランスクリプトミラーを保持します。このミラーには、ユーザープロンプト、最終的なアシスタントテキスト、および app-server が出力した場合の軽量な Codex reasoning または計画レコードが含まれます。現時点で、OpenClaw はネイティブ Compaction の開始および完了シグナルのみを記録します。人間が読める Compaction 要約や、Compaction 後に Codex が保持したエントリの監査可能なリストはまだ公開していません。

Codex が正規のネイティブスレッドを所有するため、`tool_result_persist` は現在、Codex ネイティブのツール結果レコードを書き換えません。これは OpenClaw が所有するセッショントランスクリプトのツール結果を OpenClaw が書き込む場合にのみ適用されます。

メディア生成に PI は不要です。画像、動画、音楽、PDF、TTS、およびメディア理解は、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts` など、対応するプロバイダー/モデル設定を引き続き使用します。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されません:** 新しい設定では想定どおりです。`agentRuntime.id: "codex"` を指定して `openai/gpt-*` モデルを選択するか、レガシーの `codex/*` ref を使用し、`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく PI を使用します:** `agentRuntime.id: "auto"` は、Codex ハーネスが実行を要求しない場合、互換性バックエンドとして引き続き PI を使用できます。テスト中に Codex の選択を強制するには、`agentRuntime.id: "codex"` を設定します。強制された Codex ランタイムは、PI へフォールバックするのではなく失敗します。Codex app-server が選択されると、その失敗は直接表面化します。

**app-server が拒否されます:** Codex をアップグレードして、app-server ハンドシェイクがバージョン `0.125.0` 以降を報告するようにしてください。同一バージョンのプレリリースまたは `0.125.0-alpha.2` や `0.125.0+custom` のようなビルド接尾辞付きバージョンは、安定版 `0.125.0` のプロトコル下限が OpenClaw のテスト対象であるため拒否されます。

**モデル検出が遅いです:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にしてください。

**WebSocket トランスポートが即座に失敗します:** `appServer.url`、`authToken`、およびリモート app-server が同じ Codex app-server プロトコルバージョンを話すことを確認してください。

**Codex 以外のモデルが PI を使用します:** そのエージェントに対して `agentRuntime.id: "codex"` を強制した場合、またはレガシーの `codex/*` ref を選択した場合を除き、これは想定どおりです。プレーンな `openai/gpt-*` やその他のプロバイダー ref は、`auto` モードでは通常のプロバイダーパスに残ります。`agentRuntime.id: "codex"` を強制する場合、そのエージェントのすべての埋め込みターンは Codex がサポートする OpenAI モデルである必要があります。

**Computer Use はインストールされていますがツールが実行されません:** 新しいセッションから `/codex computer-use status` を確認してください。ツールが `Native hook relay unavailable` を報告する場合は、`/new` または `/reset` を使用してください。継続する場合は、Gateway を再起動して古いネイティブフック登録をクリアしてください。`computer-use.list_apps` がタイムアウトする場合は、Codex Computer Use または Codex Desktop を再起動して再試行してください。

## 関連

- [エージェントハーネス plugins](/ja-JP/plugins/sdk-agent-harness)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [ステータス](/ja-JP/cli/status)
- [Plugin フック](/ja-JP/plugins/hooks)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
