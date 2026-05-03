---
read_when:
    - 同梱の Codex app-server ハーネスを使用したい場合
    - Codex ハーネス設定の例が必要です
    - Codex のみのデプロイで、PI にフォールバックするのではなく失敗させたい
summary: 同梱の Codex app-server ハーネス経由で OpenClaw の埋め込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-05-03T05:01:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83cb442bb2b87fdfe530619e8951bc8f4f5a7d3bfd68ca49eeb16bbdd8b189b4
    source_path: plugins/codex-harness.md
    workflow: 16
---

バンドル済みの `codex` plugin により、OpenClaw は組み込み PI ハーネスではなく Codex app-server を通じて埋め込み agent ターンを実行できます。

低レベルの agent セッションを Codex に所有させたい場合にこれを使用します。対象は、モデル検出、ネイティブなスレッド再開、ネイティブな compaction、app-server 実行です。OpenClaw は引き続き、チャットチャンネル、セッションファイル、モデル選択、ツール、承認、メディア配信、可視トランスクリプトのミラーを所有します。

ソースチャットターンが Codex ハーネスを通じて実行される場合、デプロイが `messages.visibleReplies` を明示的に設定していなければ、可視返信はデフォルトで OpenClaw の `message` ツールになります。agent は引き続き Codex ターンを非公開で完了できます。チャンネルに投稿されるのは、`message(action="send")` を呼び出した場合だけです。従来の自動配信パスでダイレクトチャットの最終返信を維持するには、`messages.visibleReplies: "automatic"` を設定します。

Codex heartbeat ターンもデフォルトで `heartbeat_respond` ツールを受け取るため、agent はその制御フローを最終テキストにエンコードせずに、wake を静かに保つか通知するかを記録できます。

状況を把握したい場合は、[Agent ランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。短く言えば、`openai/gpt-5.5` がモデル参照、`codex` がランタイムであり、Telegram、Discord、Slack、または別のチャンネルが通信サーフェスのままです。

## クイック設定

「OpenClaw 内の Codex」を求めるほとんどのユーザーには、このルートが適しています。ChatGPT/Codex サブスクリプションでサインインし、ネイティブ Codex app-server ランタイムを通じて埋め込み agent ターンを実行します。モデル参照は引き続き `openai/gpt-*` として正規のままです。サブスクリプション認証は Codex アカウント/プロファイルから取得され、`openai-codex/*` モデルプレフィックスからではありません。

まだ実行していない場合は、まず Codex OAuth でサインインします。

```bash
openclaw models auth login --provider openai-codex
```

次に、バンドル済みの `codex` plugin を有効にし、Codex ランタイムを強制します。

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

ネイティブ Codex ランタイムを意味する場合に `openai-codex/gpt-*` を使用しないでください。そのプレフィックスは、明示的な「PI 経由の Codex OAuth」ルートです。設定変更は新規またはリセットされたセッションに適用されます。既存のセッションは記録済みランタイムを保持します。

## この plugin が変更すること

バンドル済みの `codex` plugin は、複数の独立した機能を提供します。

| 機能                              | 使用方法                                            | 動作内容                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| ネイティブ埋め込みランタイム      | `agentRuntime.id: "codex"`                          | OpenClaw の埋め込み agent ターンを Codex app-server 経由で実行します。        |
| ネイティブチャット制御コマンド    | `/codex bind`, `/codex resume`, `/codex steer`, ... | メッセージング会話から Codex app-server スレッドをバインドし制御します。      |
| Codex app-server プロバイダー/カタログ | `codex` 内部、ハーネス経由で公開               | ランタイムが app-server モデルを検出および検証できるようにします。            |
| Codex メディア理解パス            | `codex/*` 画像モデル互換パス                       | 対応する画像理解モデル向けに、境界付き Codex app-server ターンを実行します。 |
| ネイティブ hook リレー            | Codex ネイティブイベント周辺の Plugin hooks        | OpenClaw が対応する Codex ネイティブツール/完了イベントを監視/ブロックできるようにします。 |

plugin を有効にすると、これらの機能が利用可能になります。ただし、次のことは**行いません**。

- すべての OpenAI モデルで Codex を使い始める
- `openai-codex/*` モデル参照をネイティブランタイムに変換する
- ACP/acpx をデフォルトの Codex パスにする
- すでに PI ランタイムを記録している既存セッションをホットスイッチする
- OpenClaw のチャンネル配信、セッションファイル、認証プロファイル保存、またはメッセージルーティングを置き換える

同じ plugin は、ネイティブな `/codex` チャット制御コマンドサーフェスも所有します。plugin が有効で、ユーザーがチャットから Codex スレッドをバインド、再開、steer、停止、または検査するよう求めている場合、agent は ACP よりも `/codex ...` を優先する必要があります。ACP は、ユーザーが ACP/acpx を求めている場合、または ACP Codex アダプターをテストしている場合の明示的なフォールバックのままです。

ネイティブ Codex ターンは、OpenClaw plugin hooks を公開互換レイヤーとして維持します。これらはプロセス内 OpenClaw hooks であり、Codex `hooks.json` コマンド hooks ではありません。

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` ミラーされたトランスクリプトレコード用
- Codex `Stop` リレー経由の `before_agent_finalize`
- `agent_end`

plugin は、ランタイム非依存のツール結果ミドルウェアを登録して、OpenClaw がツールを実行した後、結果が Codex に返される前に、OpenClaw 動的ツール結果を書き換えることもできます。これは、OpenClaw が所有するトランスクリプトのツール結果書き込みを変換する公開 `tool_result_persist` plugin hook とは別です。

plugin hook のセマンティクス自体については、[Plugin hooks](/ja-JP/plugins/hooks) と [Plugin guard behavior](/ja-JP/tools/plugin) を参照してください。

ハーネスはデフォルトでオフです。新しい設定では、OpenAI モデル参照を `openai/gpt-*` として正規に保ち、ネイティブ app-server 実行が必要な場合は `agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex` を明示的に強制する必要があります。従来の `codex/*` モデル参照は互換性のために引き続きハーネスを自動選択しますが、ランタイムに裏付けられた従来プロバイダープレフィックスは、通常のモデル/プロバイダー選択肢としては表示されません。

`codex` plugin が有効でもプライマリモデルがまだ `openai-codex/*` の場合、`openclaw doctor` はルートを変更するのではなく警告します。これは意図的です。`openai-codex/*` は引き続き PI Codex OAuth/サブスクリプションパスであり、ネイティブ app-server 実行は明示的なランタイム選択のままです。

## ルートマップ

設定を変更する前に、この表を使用してください。

| 望む動作                                             | モデル参照                 | ランタイム設定                         | 認証/プロファイルルート    | 期待されるステータスラベル   |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| ネイティブ Codex ランタイムでの ChatGPT/Codex サブスクリプション | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth または Codex アカウント | `Runtime: OpenAI Codex`        |
| 通常の OpenClaw ランナー経由の OpenAI API            | `openai/gpt-*`             | 省略、または `runtime: "pi"`           | OpenAI API キー              | `Runtime: OpenClaw Pi Default` |
| PI 経由の ChatGPT/Codex サブスクリプション           | `openai-codex/gpt-*`       | 省略、または `runtime: "pi"`           | OpenAI Codex OAuth プロバイダー | `Runtime: OpenClaw Pi Default` |
| 保守的な自動モードでの混在プロバイダー               | プロバイダー固有の参照     | `agentRuntime.id: "auto"`              | 選択されたプロバイダーごと  | 選択されたランタイムによる     |
| 明示的な Codex ACP アダプターセッション              | ACP プロンプト/モデル依存  | `runtime: "acp"` の `sessions_spawn`   | ACP バックエンド認証         | ACP タスク/セッションステータス |

重要な分岐は、プロバイダーとランタイムです。

- `openai-codex/*` は「PI がどのプロバイダー/認証ルートを使うべきか」に答えます
- `agentRuntime.id: "codex"` は「この埋め込みターンをどのループが実行すべきか」に答えます
- `/codex ...` は「このチャットをどのネイティブ Codex 会話にバインドまたは制御すべきか」に答えます
- ACP は「acpx がどの外部ハーネスプロセスを起動すべきか」に答えます

## 適切なモデルプレフィックスを選ぶ

OpenAI ファミリーのルートはプレフィックス固有です。一般的なサブスクリプション + ネイティブ Codex ランタイム構成では、`agentRuntime.id: "codex"` とともに `openai/*` を使用します。`openai-codex/*` は、PI 経由の Codex OAuth を意図的に使いたい場合にのみ使用します。

| モデル参照                                    | ランタイムパス                               | 使用する場合                                                              |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI 配管経由の OpenAI プロバイダー  | `OPENAI_API_KEY` で現在の直接 OpenAI Platform API アクセスを使いたい場合。 |
| `openai-codex/gpt-5.5`                        | OpenClaw/PI 経由の OpenAI Codex OAuth        | デフォルト PI ランナーで ChatGPT/Codex サブスクリプション認証を使いたい場合。 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server ハーネス                    | ネイティブ Codex 実行で ChatGPT/Codex サブスクリプション認証を使いたい場合。 |

GPT-5.5 は、アカウントで公開されている場合、直接 OpenAI API キー経路と Codex サブスクリプション経路の両方に現れることがあります。ネイティブ Codex ランタイムには Codex app-server ハーネス付きの `openai/gpt-5.5` を、PI OAuth には `openai-codex/gpt-5.5` を、直接 API キートラフィックには Codex ランタイムオーバーライドなしの `openai/gpt-5.5` を使用します。

従来の `codex/gpt-*` 参照は、互換エイリアスとして引き続き受け入れられます。Doctor 互換性マイグレーションは、従来のプライマリランタイム参照を正規モデル参照に書き換え、ランタイムポリシーを別に記録します。一方、フォールバック専用の従来参照は、ランタイムが agent コンテナ全体に対して設定されるため変更されません。新しい PI Codex OAuth 設定では `openai-codex/gpt-*` を使用してください。新しいネイティブ app-server ハーネス設定では、`openai/gpt-*` に `agentRuntime.id: "codex"` を加えて使用してください。

`agents.defaults.imageModel` も同じプレフィックス分岐に従います。画像理解を OpenAI Codex OAuth プロバイダーパス経由で実行する場合は、`openai-codex/gpt-*` を使用します。画像理解を境界付き Codex app-server ターン経由で実行する場合は、`codex/gpt-*` を使用します。Codex app-server モデルは画像入力サポートを広告している必要があります。テキスト専用の Codex モデルは、メディアターンが始まる前に失敗します。

現在のセッションに有効なハーネスを確認するには `/status` を使用します。選択が予想外の場合は、`agents/harness` サブシステムのデバッグログを有効にし、gateway の構造化された `agent harness selected` レコードを調べます。これには、選択されたハーネス ID、選択理由、ランタイム/フォールバックポリシー、そして `auto` モードでは各 plugin 候補のサポート結果が含まれます。

### doctor 警告の意味

`openclaw doctor` は、次のすべてが真の場合に警告します。

- バンドル済みの `codex` plugin が有効、または許可されている
- agent のプライマリモデルが `openai-codex/*`
- その agent の有効なランタイムが `codex` ではない

この警告が存在するのは、ユーザーが「Codex plugin が有効」を「ネイティブ Codex app-server ランタイム」と同義に期待することが多いためです。OpenClaw はその飛躍を行いません。この警告の意味は次のとおりです。

- PI 経由の ChatGPT/Codex OAuth を意図していた場合、**変更は不要です**。
- ネイティブ app-server 実行を意図していた場合は、モデルを `openai/<model>` に変更し、`agentRuntime.id: "codex"` を設定します。
- 既存セッションでは、ランタイム変更後も `/new` または `/reset` が必要です。セッションのランタイムピンは固定されるためです。

ハーネス選択はライブセッション制御ではありません。埋め込みターンが実行されると、OpenClaw は選択されたハーネス ID をそのセッションに記録し、同じセッション ID の後続ターンでもそれを使い続けます。将来のセッションで別のハーネスを使いたい場合は、`agentRuntime` 設定または `OPENCLAW_AGENT_RUNTIME` を変更します。既存の会話を PI と Codex の間で切り替える前に、新しいセッションを開始するには `/new` または `/reset` を使用します。これにより、1 つのトランスクリプトを互換性のない 2 つのネイティブセッションシステムでリプレイすることを避けられます。

ハーネスピンが導入される前に作成された従来セッションは、トランスクリプト履歴を持つと PI ピン済みとして扱われます。設定変更後にその会話を Codex に移行するには、`/new` または `/reset` を使用してください。

`/status` は有効なモデルランタイムを表示します。デフォルトの PI ハーネスは
`Runtime: OpenClaw Pi Default` と表示され、Codex アプリサーバーハーネスは
`Runtime: OpenAI Codex` と表示されます。

## 要件

- バンドルされた `codex` Plugin が利用可能な OpenClaw。
- Codex アプリサーバー `0.125.0` 以降。バンドルされた Plugin は、デフォルトで互換性のある
  Codex アプリサーバーバイナリを管理するため、`PATH` 上のローカル `codex` コマンドは
  通常のハーネス起動には影響しません。
- アプリサーバープロセス、または OpenClaw の Codex 認証ブリッジで利用可能な Codex 認証。
  ローカルのアプリサーバー起動では、各エージェントに OpenClaw 管理の Codex ホームと
  分離された子 `HOME` を使用するため、デフォルトでは個人用の
  `~/.codex` アカウント、Skills、Plugin、設定、スレッド状態、またはネイティブの
  `$HOME/.agents/skills` は読み取られません。

この Plugin は、古い、またはバージョンなしのアプリサーバーハンドシェイクをブロックします。これにより、
OpenClaw はテスト済みのプロトコル面に維持されます。

ライブおよび Docker スモークテストでは、認証は通常 Codex CLI アカウント、または OpenClaw の
`openai-codex` 認証プロファイルから取得されます。ローカル stdio アプリサーバー起動では、
アカウントが存在しない場合に `CODEX_API_KEY` / `OPENAI_API_KEY` にフォールバックすることもできます。

## ワークスペースのブートストラップファイル

Codex はネイティブのプロジェクトドキュメント検出を通じて `AGENTS.md` を自分で処理します。OpenClaw は
合成 Codex プロジェクトドキュメントファイルを書き込まず、ペルソナファイル向けの Codex フォールバック
ファイル名にも依存しません。Codex のフォールバックは `AGENTS.md` がない場合にのみ適用されるためです。

OpenClaw ワークスペースの同等性のため、Codex ハーネスは他のブートストラップファイル
（存在する場合は `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、
`BOOTSTRAP.md`、`MEMORY.md`）を解決し、`thread/start` と `thread/resume` の Codex
設定指示を通じて転送します。これにより、`AGENTS.md` を複製せずに `SOUL.md` と関連する
ワークスペースのペルソナ/プロファイル文脈を表示できます。

## 他のモデルと並べて Codex を追加する

同じエージェントが Codex と Codex 以外のプロバイダーモデルを自由に切り替える必要がある場合、
`agentRuntime.id: "codex"` をグローバルに設定しないでください。強制されたランタイムは、その
エージェントまたはセッションのすべての埋め込みターンに適用されます。そのランタイムが強制されている状態で
Anthropic モデルを選択すると、OpenClaw は引き続き Codex ハーネスを試行し、そのターンを
PI 経由に静かにルーティングするのではなく、クローズドに失敗します。

代わりに、次のいずれかの形を使用します。

- `agentRuntime.id: "codex"` を持つ専用エージェントに Codex を配置する。
- 通常の混在プロバイダー利用には、デフォルトエージェントを `agentRuntime.id: "auto"` と
  PI フォールバックのままにする。
- レガシーの `codex/*` 参照は互換性のためだけに使用する。新しい設定では、
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

- デフォルトの `main` エージェントは通常のプロバイダーパスと PI 互換性フォールバックを使用します。
- `codex` エージェントは Codex アプリサーバーハーネスを使用します。
- `codex` エージェントで Codex が見つからない、またはサポートされていない場合、そのターンは
  PI を静かに使用するのではなく失敗します。

## エージェントコマンドのルーティング

エージェントは、単に「Codex」という単語だけではなく、意図によってユーザー要求をルーティングする必要があります。

| ユーザーの要求...                                      | エージェントが使用すべきもの...                    |
| ------------------------------------------------------ | ------------------------------------------------ |
| 「このチャットを Codex にバインドする」                | `/codex bind`                                    |
| 「Codex スレッド `<id>` をここで再開する」             | `/codex resume <id>`                             |
| 「Codex スレッドを表示する」                           | `/codex threads`                                 |
| 「失敗した Codex 実行のサポートレポートを作成する」   | `/diagnostics [note]`                            |
| 「この添付スレッドについてのみ Codex フィードバックを送る」 | `/codex diagnostics [note]`                      |
| 「ChatGPT/Codex サブスクリプションを Codex ランタイムで使う」 | `openai/*` と `agentRuntime.id: "codex"`         |
| 「ChatGPT/Codex サブスクリプションを PI 経由で使う」  | `openai-codex/*` モデル参照                      |
| 「ACP/acpx 経由で Codex を実行する」                   | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「Claude Code/Gemini/OpenCode/Cursor をスレッド内で開始する」 | ACP/acpx。`/codex` ではなく、ネイティブサブエージェントでもありません |

OpenClaw は、ACP が有効で、ディスパッチ可能で、読み込まれたランタイムバックエンドに支えられている場合にのみ、
ACP スポーンガイダンスをエージェントに告知します。ACP が利用できない場合、システムプロンプトと Plugin Skills は
ACP ルーティングについてエージェントに教えるべきではありません。

## Codex のみのデプロイ

すべての埋め込みエージェントターンが Codex を使用することを証明する必要がある場合は、Codex ハーネスを強制します。
明示的な Plugin ランタイムはクローズドに失敗し、PI 経由で静かに再試行されることはありません。

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

Codex が強制されている場合、Codex Plugin が無効、アプリサーバーが古すぎる、または
アプリサーバーを開始できないと、OpenClaw は早期に失敗します。

## エージェントごとの Codex

デフォルトエージェントは通常の自動選択を維持しながら、1 つのエージェントだけを Codex 専用にできます。

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

エージェントとモデルを切り替えるには、通常のセッションコマンドを使用します。`/new` は新しい
OpenClaw セッションを作成し、Codex ハーネスは必要に応じてサイドカーのアプリサーバースレッドを作成または再開します。
`/reset` はそのスレッドの OpenClaw セッションバインドをクリアし、次のターンで現在の設定から
ハーネスを再度解決できるようにします。

## モデル検出

デフォルトでは、Codex Plugin は利用可能なモデルをアプリサーバーに問い合わせます。
検出に失敗するかタイムアウトした場合、次のバンドルされたフォールバックカタログを使用します。

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

`plugins.entries.codex.config.discovery` で検出を調整できます。

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

起動時に Codex へのプローブを避け、フォールバックカタログだけを使いたい場合は、検出を無効にします。

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

デフォルトでは、Plugin は OpenClaw 管理の Codex バイナリを次のようにローカルで起動します。

```bash
codex app-server --listen stdio://
```

管理バイナリは `codex` Plugin パッケージに同梱されています。これにより、アプリサーバーのバージョンは、
ローカルにたまたまインストールされている別の Codex CLI ではなく、バンドルされた Plugin に紐づきます。
別の実行ファイルを意図的に実行したい場合にのみ `appServer.command` を設定してください。

デフォルトでは、OpenClaw はローカルの Codex ハーネスセッションを YOLO モードで開始します:
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"`。これは自律的な Heartbeat で使用される信頼済みローカルオペレーターの姿勢です:
Codex は、回答する人がいないネイティブ承認プロンプトで停止せずに、シェルとネットワークツールを使用できます。

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

Guardian モードは、Codex のネイティブ自動レビュー承認パスを使用します。Codex がサンドボックスの外へ出る、
ワークスペース外に書き込む、またはネットワークアクセスなどの権限を追加する必要がある場合、
Codex はその承認要求を人間のプロンプトではなくネイティブレビュアーにルーティングします。レビュアーは
Codex のリスクフレームワークを適用し、特定の要求を承認または拒否します。YOLO モードより多くのガードレールが必要で、
それでも無人エージェントを進める必要がある場合は Guardian を使用してください。

`guardian` プリセットは、`approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。
個別のポリシーフィールドは引き続き `mode` を上書きするため、高度なデプロイでは
プリセットと明示的な選択を組み合わせることができます。古い `guardian_subagent` レビュアー値は
互換性エイリアスとして引き続き受け付けられますが、新しい設定では `auto_review` を使用してください。

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

stdio アプリサーバー起動は、デフォルトで OpenClaw のプロセス環境を継承しますが、
OpenClaw は Codex アプリサーバーアカウントブリッジを所有し、`CODEX_HOME` と `HOME` の両方を、
そのエージェントの OpenClaw 状態配下にあるエージェントごとのディレクトリに設定します。
Codex 自身の Skills ローダーは `$CODEX_HOME/skills` と `$HOME/.agents/skills` を読み取るため、
ローカルアプリサーバー起動では両方の値が分離されます。これにより、Codex ネイティブの Skills、Plugin、設定、
アカウント、スレッド状態が、オペレーター個人の Codex CLI ホームから漏れ込むのではなく、
OpenClaw エージェントにスコープされます。

OpenClaw Plugin と OpenClaw Skills スナップショットは、引き続き OpenClaw 独自の Plugin レジストリと
Skills ローダーを通じて流れます。個人用の Codex CLI アセットは流れません。OpenClaw エージェントの一部に
すべき有用な Codex CLI Skills や Plugin がある場合は、明示的に棚卸ししてください。

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex 移行プロバイダーは、Skills を現在の OpenClaw エージェントワークスペースにコピーします。
Codex ネイティブの Plugin、フック、設定ファイルは、自動的に有効化されるのではなく、
手動レビューのために報告またはアーカイブされます。これらはコマンドを実行したり、MCP サーバーを公開したり、
認証情報を含んだりする可能性があるためです。

認証は次の順序で選択されます。

1. エージェント用の明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex ホームにあるアプリサーバーの既存アカウント。
3. ローカル stdio アプリサーバー起動の場合のみ、アプリサーバーアカウントが存在せず、
   OpenAI 認証がまだ必要なとき、`CODEX_API_KEY`、次に `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、
生成される Codex 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。
これにより、Gateway レベルの API キーを埋め込みや直接の OpenAI モデルで利用可能に保ちながら、
ネイティブ Codex アプリサーバーのターンが誤って API 経由で課金されることを防ぎます。
明示的な Codex API キープロファイルとローカル stdio 環境キーのフォールバックは、
継承された子プロセス環境ではなくアプリサーバーログインを使用します。WebSocket アプリサーバー接続は
Gateway 環境の API キーフォールバックを受け取りません。明示的な認証プロファイル、またはリモート
アプリサーバー自身のアカウントを使用してください。

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

`appServer.clearEnv` は、生成された Codex アプリサーバー子プロセスにのみ影響します。

Codex の動的ツールは既定で `native-first` プロファイルを使用します。このモードでは、
OpenClaw は Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません:
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、および
`update_plan`。メッセージング、セッション、メディア、cron、ブラウザー、ノード、gateway、`heartbeat_respond`、`web_search` などの OpenClaw 連携ツールは引き続き利用できます。

サポートされる最上位の Codex plugin フィールド:

| フィールド                 | 既定値           | 意味                                                                                      |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Codex app-server に OpenClaw の動的ツール一式を公開するには `"openclaw-compat"` を使用します。 |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server のターンから除外する追加の OpenClaw 動的ツール名。                       |

サポートされる `appServer` フィールド:

| フィールド          | 既定値                                   | 意味                                                                                                                                                                                                                           |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` は Codex を起動します。`"websocket"` は `url` に接続します。                                                                                                                                                         |
| `command`           | 管理対象の Codex バイナリ                | stdio トランスポート用の実行ファイル。管理対象バイナリを使用する場合は未設定のままにし、明示的に上書きする場合のみ設定します。                                                                                               |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio トランスポート用の引数。                                                                                                                                                                                                 |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                                     |
| `authToken`         | 未設定                                   | WebSocket トランスポート用の Bearer トークン。                                                                                                                                                                                 |
| `headers`           | `{}`                                     | 追加の WebSocket ヘッダー。                                                                                                                                                                                                    |
| `clearEnv`          | `[]`                                     | OpenClaw が継承環境を構築した後、起動した stdio app-server プロセスから削除される追加の環境変数名。`CODEX_HOME` と `HOME` は、ローカル起動時の OpenClaw によるエージェント別 Codex 分離用に予約されています。 |
| `requestTimeoutMs`  | `60000`                                  | app-server コントロールプレーン呼び出しのタイムアウト。                                                                                                                                                                        |
| `mode`              | `"yolo"`                                 | YOLO または guardian レビュー付き実行のプリセット。                                                                                                                                                                           |
| `approvalPolicy`    | `"never"`                                | スレッドの開始/再開/ターンに送信されるネイティブ Codex 承認ポリシー。                                                                                                                                                         |
| `sandbox`           | `"danger-full-access"`                   | スレッドの開始/再開に送信されるネイティブ Codex サンドボックスモード。                                                                                                                                                         |
| `approvalsReviewer` | `"user"`                                 | Codex にネイティブ承認プロンプトをレビューさせるには `"auto_review"` を使用します。`guardian_subagent` は従来のエイリアスとして残っています。                                                                                 |
| `serviceTier`       | 未設定                                   | 任意の Codex app-server サービス階層: `"fast"`、`"flex"`、または `null`。無効な従来値は無視されます。                                                                                                                         |

OpenClaw 所有の動的ツール呼び出しは、`appServer.requestTimeoutMs` とは独立して制限されます。各 Codex `item/tool/call` リクエストは、30 秒以内に OpenClaw レスポンスを受け取る必要があります。タイムアウト時、OpenClaw はサポートされている場合はツールシグナルを中止し、失敗した動的ツールレスポンスを Codex に返します。これにより、セッションを `processing` のまま残す代わりにターンを続行できます。

OpenClaw が Codex のターンスコープ app-server リクエストに応答した後、ハーネスは Codex が `turn/completed` でネイティブターンを完了することも期待します。そのレスポンス後に app-server が 60 秒間沈黙した場合、OpenClaw はベストエフォートで Codex ターンを中断し、診断タイムアウトを記録して、古いネイティブターンの背後に後続のチャットメッセージがキューされないよう OpenClaw セッションレーンを解放します。

ローカルテスト用の環境上書きは引き続き利用できます:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、`OPENCLAW_CODEX_APP_SERVER_BIN` は管理対象バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに `plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、一回限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。設定は、Codex ハーネス設定の他の部分と同じレビュー済みファイル内に plugin の動作を保持するため、反復可能なデプロイでは推奨されます。

## コンピューター使用

コンピューター使用については、専用のセットアップガイドで説明しています:
[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use)。

短く言うと、OpenClaw はデスクトップ制御アプリをベンダー化せず、デスクトップアクションを自ら実行しません。Codex app-server を準備し、`computer-use` MCP サーバーが利用可能であることを検証してから、Codex モードのターン中に Codex がネイティブ MCP ツール呼び出しを処理できるようにします。

Codex マーケットプレイスフローの外で TryCua ドライバーに直接アクセスするには、`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` で `cua-driver mcp` を登録します。Codex 所有のコンピューター使用と直接 MCP 登録の違いについては、[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use)を参照してください。

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

セットアップはコマンドサーフェスから確認またはインストールできます:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

コンピューター使用は macOS 固有であり、Codex MCP サーバーがアプリを制御できるようになる前に、ローカル OS の権限が必要になる場合があります。`computerUse.enabled` が true で MCP サーバーを利用できない場合、Codex モードのターンは、ネイティブのコンピューター使用ツールなしで暗黙的に実行されるのではなく、スレッド開始前に失敗します。マーケットプレイスの選択肢、リモートカタログの制限、ステータス理由、トラブルシューティングについては、[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use)を参照してください。

`computerUse.autoInstall` が true の場合、Codex がまだローカルマーケットプレイスを検出していなければ、OpenClaw は `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` から標準の同梱 Codex Desktop マーケットプレイスを登録できます。ランタイムまたはコンピューター使用設定を変更した後は、既存セッションが古い PI または Codex スレッドバインディングを保持しないように、`/new` または `/reset` を使用してください。

## 一般的なレシピ

既定の stdio トランスポートを使用するローカル Codex:

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

モデル切り替えは OpenClaw が制御し続けます。OpenClaw セッションが既存の Codex スレッドにアタッチされている場合、次のターンは現在選択されている OpenAI モデル、プロバイダー、承認ポリシー、サンドボックス、サービス階層を app-server に再度送信します。`openai/gpt-5.5` から `openai/gpt-5.2` に切り替えても、スレッドバインディングは保持されますが、新しく選択されたモデルで続行するよう Codex に要求します。

## Codex コマンド

同梱 Plugin は、認可済みスラッシュコマンドとして `/codex` を登録します。これは汎用であり、OpenClaw テキストコマンドをサポートする任意のチャネルで動作します。

一般的な形式:

- `/codex status` は、ライブ app-server 接続性、モデル、アカウント、レート制限、MCP サーバー、skills を表示します。
- `/codex models` は、ライブ Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex スレッドにアタッチします。
- `/codex compact` は、アタッチされたスレッドを compact するよう Codex app-server に要求します。
- `/codex review` は、アタッチされたスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、アタッチされたスレッドの Codex 診断フィードバックを送信する前に確認します。
- `/codex computer-use status` は、設定済みのコンピューター使用 plugin と MCP サーバーを確認します。
- `/codex computer-use install` は、設定済みのコンピューター使用 plugin をインストールし、MCP サーバーを再読み込みします。
- `/codex account` は、アカウントとレート制限のステータスを表示します。
- `/codex mcp` は、Codex app-server MCP サーバーのステータスを一覧表示します。
- `/codex skills` は、Codex app-server skills を一覧表示します。

### 一般的なデバッグワークフロー

Codex ベースのエージェントが Telegram、Discord、Slack、または別のチャネルで予期しない動作をした場合は、問題が発生した会話から始めます:

1. `/diagnostics bad tool choice after image upload`、または見た内容を説明する別の短いメモを実行します。
2. 診断リクエストを一度承認します。承認によりローカル Gateway
   診断 zip が作成され、セッションが Codex ハーネスを使用しているため、
   関連する Codex フィードバックバンドルも OpenAI サーバーに送信されます。
3. 完了した診断返信をバグレポートまたはサポートスレッドにコピーします。
   そこには、ローカルバンドルパス、プライバシー概要、OpenClaw セッション ID、
   Codex スレッド ID、および各 Codex スレッドの `Inspect locally` 行が含まれます。
4. 実行を自分でデバッグしたい場合は、表示された `Inspect locally`
   コマンドをターミナルで実行します。これは `codex resume <thread-id>` のような形で、
   ネイティブ Codex スレッドを開き、会話を調べたり、ローカルで続行したり、
   特定のツールやプランを選んだ理由を Codex に尋ねたりできます。

完全な OpenClaw Gateway 診断バンドルなしで、現在接続されているスレッドの Codex
フィードバックアップロードだけを特に必要とする場合にのみ、`/codex diagnostics [note]`
を使用してください。ほとんどのサポートレポートでは、`/diagnostics [note]` のほうが
適切な開始点です。ローカル Gateway 状態と Codex スレッド ID を 1 つの返信にまとめて
関連付けるためです。完全なプライバシーモデルとグループチャットでの動作については、
[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

Core OpenClaw は、一般的な Gateway 診断コマンドとして、所有者専用の
`/diagnostics [note]` も公開しています。その承認プロンプトには機密データの
前置きが表示され、[診断エクスポート](/ja-JP/gateway/diagnostics)へのリンクがあり、
毎回明示的な exec 承認を通じて `openclaw gateway diagnostics export --json`
をリクエストします。allow-all ルールで診断を承認しないでください。承認後、
OpenClaw はローカルバンドルパスとマニフェスト概要を含む貼り付け可能なレポートを
送信します。アクティブな OpenClaw セッションが Codex ハーネスを使用している場合、
同じ承認により、関連する Codex フィードバックバンドルを OpenAI サーバーへ送信することも
許可されます。承認プロンプトには Codex フィードバックが送信されることが示されますが、
承認前に Codex セッション ID やスレッド ID は一覧表示されません。

`/diagnostics` がグループチャット内で所有者によって呼び出された場合、OpenClaw は
共有チャンネルを整理された状態に保ちます。グループには短い通知だけが送られ、
診断の前置き、承認プロンプト、Codex セッション/スレッド ID は、プライベート承認ルートを
通じて所有者に送信されます。プライベートな所有者ルートがない場合、OpenClaw は
グループリクエストを拒否し、DM から実行するよう所有者に求めます。

承認された Codex アップロードは Codex app-server の `feedback/upload` を呼び出し、
一覧にある各スレッドと、利用可能な場合は生成された Codex サブスレッドのログを含めるよう
app-server に依頼します。アップロードは Codex の通常のフィードバック経路を通じて
OpenAI サーバーへ送信されます。その app-server で Codex フィードバックが無効になっている場合、
コマンドは app-server エラーを返します。完了した診断返信には、送信されたスレッドの
チャンネル、OpenClaw セッション ID、Codex スレッド ID、ローカルの
`codex resume <thread-id>` コマンドが一覧表示されます。承認を拒否または無視した場合、
OpenClaw はそれらの Codex ID を出力しません。このアップロードは、ローカル Gateway
診断エクスポートを置き換えるものではありません。

`/codex resume` は、ハーネスが通常のターンに使用するものと同じサイドカー
バインディングファイルを書き込みます。次のメッセージで、OpenClaw はその Codex スレッドを
再開し、現在選択されている OpenClaw モデルを app-server に渡し、拡張履歴を有効のままにします。

### CLI から Codex スレッドを調べる

問題のある Codex 実行を理解する最も速い方法は、多くの場合、ネイティブ Codex
スレッドを直接開くことです。

```sh
codex resume <thread-id>
```

チャンネル会話でバグに気づき、問題のある Codex セッションを調べたい、ローカルで続行したい、
または特定のツールや推論の選択をした理由を Codex に尋ねたい場合に使用します。
通常、最も簡単な手順は、先に `/diagnostics [note]` を実行することです。
承認後、完了したレポートには各 Codex スレッドが一覧表示され、たとえば
`codex resume <thread-id>` のような `Inspect locally` コマンドが出力されます。
そのコマンドをそのままターミナルにコピーできます。

現在のチャットについては `/codex binding` から、最近の Codex app-server スレッドについては
`/codex threads [filter]` からスレッド ID を取得し、同じ `codex resume`
コマンドをシェルで実行することもできます。

このコマンドサーフェスには Codex app-server `0.125.0` 以降が必要です。将来の
app-server またはカスタム app-server がその JSON-RPC メソッドを公開していない場合、
個々の制御メソッドは `unsupported by this Codex app-server` と報告されます。

## フック境界

Codex ハーネスには 3 つのフックレイヤーがあります。

| レイヤー                              | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin フック                | OpenClaw                 | PI と Codex ハーネス全体での製品/Plugin 互換性。                   |
| Codex app-server 拡張ミドルウェア     | OpenClaw バンドル Plugin | OpenClaw 動的ツール周辺のターンごとのアダプター動作。              |
| Codex ネイティブフック                | Codex                    | Codex 設定からの低レベル Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、OpenClaw Plugin の動作をルーティングするために、プロジェクトまたはグローバルの
Codex `hooks.json` ファイルを使用しません。サポートされるネイティブツールと権限ブリッジについて、
OpenClaw は `PreToolUse`、`PostToolUse`、`PermissionRequest`、`Stop` の
スレッドごとの Codex 設定を注入します。`SessionStart` や `UserPromptSubmit` などの
他の Codex フックは Codex レベルの制御のままであり、v1 契約では OpenClaw Plugin
フックとして公開されません。

OpenClaw 動的ツールでは、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、
OpenClaw はハーネスアダプター内で自分が所有する Plugin とミドルウェアの動作を発火します。
Codex ネイティブツールでは、Codex が正規のツールレコードを所有します。OpenClaw は選択された
イベントをミラーできますが、Codex がその操作を app-server またはネイティブフックコールバックを
通じて公開していない限り、ネイティブ Codex スレッドを書き換えることはできません。

Compaction と LLM ライフサイクル投影は、ネイティブ Codex フックコマンドではなく、
Codex app-server 通知と OpenClaw アダプター状態から来ます。OpenClaw の
`before_compaction`、`after_compaction`、`llm_input`、`llm_output` イベントは
アダプターレベルの観測であり、Codex の内部リクエストや Compaction ペイロードを
バイト単位でそのまま捕捉したものではありません。

Codex ネイティブの `hook/started` と `hook/completed` app-server 通知は、
軌跡とデバッグ用に `codex_app_server.hook` エージェントイベントとして投影されます。
それらは OpenClaw Plugin フックを呼び出しません。

## V1 サポート契約

Codex モードは、内部のモデル呼び出しだけが異なる PI ではありません。Codex はネイティブ
モデルループのより多くを所有し、OpenClaw はその境界の周りで Plugin とセッションサーフェスを
適合させます。

Codex runtime v1 でサポートされるもの:

| サーフェス                                    | サポート                                | 理由                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex 経由の OpenAI モデルループ              | サポート済み                            | Codex app-server が OpenAI ターン、ネイティブスレッド再開、ネイティブツール継続を所有するため。                                                                                                      |
| OpenClaw チャンネルルーティングと配信         | サポート済み                            | Telegram、Discord、Slack、WhatsApp、iMessage、およびその他のチャンネルはモデル runtime の外側に留まるため。                                                                                          |
| OpenClaw 動的ツール                           | サポート済み                            | Codex が OpenClaw にこれらのツールの実行を求めるため、OpenClaw は実行経路内に留まるため。                                                                                                            |
| プロンプトとコンテキスト Plugin               | サポート済み                            | OpenClaw がスレッドを開始または再開する前にプロンプトオーバーレイを構築し、コンテキストを Codex ターンへ投影するため。                                                                               |
| コンテキストエンジンのライフサイクル          | サポート済み                            | Codex ターンでは、組み立て、取り込みまたはターン後メンテナンス、およびコンテキストエンジン Compaction 調整が実行されるため。                                                                         |
| 動的ツールフック                              | サポート済み                            | OpenClaw 所有の動的ツール周辺で、`before_tool_call`、`after_tool_call`、およびツール結果ミドルウェアが実行されるため。                                                                                |
| ライフサイクルフック                          | アダプター観測としてサポート済み        | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` が、正直な Codex モードペイロードで発火するため。                                                                       |
| 最終回答の修正ゲート                          | ネイティブフックリレーを通じてサポート済み | Codex `Stop` が `before_agent_finalize` にリレーされ、`revise` は確定前にもう 1 回のモデルパスを Codex に要求するため。                                                                                |
| ネイティブシェル、パッチ、MCP のブロックまたは観測 | ネイティブフックリレーを通じてサポート済み | Codex `PreToolUse` と `PostToolUse` は、Codex app-server `0.125.0` 以降の MCP ペイロードを含む、コミット済みネイティブツールサーフェスにリレーされます。ブロックはサポートされますが、引数の書き換えはサポートされません。 |
| ネイティブ権限ポリシー                        | ネイティブフックリレーを通じてサポート済み | runtime が公開している場合、Codex `PermissionRequest` は OpenClaw ポリシーを通じてルーティングできます。OpenClaw が判断を返さない場合、Codex は通常の guardian またはユーザー承認経路を通じて続行します。 |
| App-server 軌跡キャプチャ                     | サポート済み                            | OpenClaw は app-server に送信したリクエストと、受信した app-server 通知を記録するため。                                                                                                              |

Codex runtime v1 でサポートされないもの:

| 対象面                                             | V1 境界                                                                                                                                     | 今後の方針                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ネイティブツール引数の変更                       | Codex ネイティブのツール実行前フックはブロックできますが、OpenClaw は Codex ネイティブのツール引数を書き換えません。                                               | 置換用ツール入力に対する Codex フック/スキーマ対応が必要です。                            |
| 編集可能な Codex ネイティブのトランスクリプト履歴            | Codex が正規のネイティブスレッド履歴を所有します。OpenClaw はミラーを所有し、将来のコンテキストを投影できますが、未対応の内部構造を変更すべきではありません。 | ネイティブスレッドの外科的編集が必要な場合は、明示的な Codex app-server API を追加します。                    |
| Codex ネイティブツールレコード向けの `tool_result_persist` | そのフックは OpenClaw が所有するトランスクリプト書き込みを変換するものであり、Codex ネイティブのツールレコードを変換するものではありません。                                                           | 変換済みレコードをミラーすることは可能ですが、正規の書き換えには Codex の対応が必要です。              |
| リッチなネイティブ Compaction メタデータ                     | OpenClaw は Compaction の開始と完了を監視しますが、安定した保持/破棄リスト、トークン差分、要約ペイロードは受け取りません。            | よりリッチな Codex Compaction イベントが必要です。                                                     |
| Compaction への介入                             | 現在の OpenClaw Compaction フックは Codex モードでは通知レベルです。                                                                         | Plugin がネイティブ Compaction を拒否または書き換える必要がある場合は、Codex の Compaction 前/後フックを追加します。 |
| バイト単位で一致するモデル API リクエストのキャプチャ             | OpenClaw は app-server のリクエストと通知をキャプチャできますが、Codex コアが最終的な OpenAI API リクエストを内部で構築します。                      | Codex のモデルリクエスト追跡イベントまたはデバッグ API が必要です。                                   |

## ツール、メディア、Compaction

Codex ハーネスは、低レベルの組み込みエージェント実行器だけを変更します。

OpenClaw は引き続きツールリストを構築し、ハーネスから動的ツール結果を受け取ります。テキスト、画像、動画、音楽、TTS、承認、メッセージングツールの出力は、通常の OpenClaw 配信経路を通り続けます。

ネイティブフックリレーは意図的に汎用的ですが、v1 のサポート契約は OpenClaw がテストする Codex ネイティブのツールおよび権限経路に限定されます。Codex ランタイムでは、これには shell、patch、MCP の `PreToolUse`、`PostToolUse`、`PermissionRequest` ペイロードが含まれます。ランタイム契約で明示されるまで、将来のすべての Codex フックイベントを OpenClaw Plugin サーフェスだと仮定しないでください。

`PermissionRequest` について、OpenClaw はポリシーが判断した場合にのみ、明示的な許可または拒否の決定を返します。決定なしの結果は許可ではありません。Codex はそれをフックの決定なしとして扱い、独自のガーディアンまたはユーザー承認経路へフォールスルーします。

Codex MCP ツール承認の引き出しは、Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` とマークした場合、OpenClaw の Plugin 承認フローを通じてルーティングされます。Codex の `request_user_input` プロンプトは元のチャットへ返送され、次にキューされたフォローアップメッセージは追加コンテキストとして誘導されるのではなく、そのネイティブサーバーリクエストへの回答になります。その他の MCP 引き出しリクエストは引き続きフェイルクローズします。

アクティブ実行キューの誘導は、Codex app-server の `turn/steer` に対応します。デフォルトの `messages.queue.mode: "steer"` では、OpenClaw は設定された静穏ウィンドウ中にキューされたチャットメッセージをまとめ、到着順に 1 つの `turn/steer` リクエストとして送信します。従来の `queue` モードでは、個別の `turn/steer` リクエストを送信します。Codex のレビューターンと手動 Compaction ターンは同一ターンの誘導を拒否する場合があり、その場合 OpenClaw は選択されたモードでフォールバックが許可されていればフォローアップキューを使用します。[誘導キュー](/ja-JP/concepts/queue-steering)を参照してください。

選択されたモデルが Codex ハーネスを使用する場合、ネイティブスレッド Compaction は Codex app-server に委譲されます。OpenClaw はチャンネル履歴、検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのためにトランスクリプトミラーを保持します。ミラーには、ユーザープロンプト、最終的なアシスタントテキスト、および app-server が出力する場合は軽量な Codex 推論または計画レコードが含まれます。現時点では、OpenClaw はネイティブ Compaction の開始および完了シグナルだけを記録します。人間が読める Compaction 要約や、Compaction 後に Codex が保持したエントリの監査可能なリストはまだ公開していません。

Codex が正規のネイティブスレッドを所有するため、`tool_result_persist` は現在 Codex ネイティブのツール結果レコードを書き換えません。これは OpenClaw が OpenClaw 所有のセッショントランスクリプトツール結果を書き込む場合にのみ適用されます。

メディア生成に PI は不要です。画像、動画、音楽、PDF、TTS、メディア理解は、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts` など、対応するプロバイダー/モデル設定を引き続き使用します。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されません:** 新しい設定ではこれは想定どおりです。`agentRuntime.id: "codex"` を指定した `openai/gpt-*` モデル（または従来の `codex/*` 参照）を選択し、`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく PI を使用します:** `agentRuntime.id: "auto"` は、実行を要求する Codex ハーネスがない場合、互換性バックエンドとして引き続き PI を使用できます。テスト中に Codex 選択を強制するには、`agentRuntime.id: "codex"` を設定します。強制された Codex ランタイムは PI にフォールバックせず失敗します。Codex app-server が選択されると、その失敗は直接表面化します。

**app-server が拒否されます:** Codex をアップグレードして、app-server ハンドシェイクがバージョン `0.125.0` 以降を報告するようにしてください。同一バージョンのプレリリースや、`0.125.0-alpha.2` または `0.125.0+custom` のようなビルドサフィックス付きバージョンは、OpenClaw がテストする安定版 `0.125.0` プロトコル下限が基準であるため拒否されます。

**モデル検出が遅いです:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にしてください。

**WebSocket トランスポートが即座に失敗します:** `appServer.url`、`authToken`、およびリモート app-server が同じ Codex app-server プロトコルバージョンを話すことを確認してください。

**Codex 以外のモデルが PI を使用します:** そのエージェントに対して `agentRuntime.id: "codex"` を強制したか、従来の `codex/*` 参照を選択した場合を除き、これは想定どおりです。通常の `openai/gpt-*` やその他のプロバイダー参照は、`auto` モードでは通常のプロバイダー経路にとどまります。`agentRuntime.id: "codex"` を強制した場合、そのエージェントのすべての組み込みターンは Codex が対応する OpenAI モデルでなければなりません。

**Computer Use はインストールされていますが、ツールが実行されません:** 新しいセッションから `/codex computer-use status` を確認してください。ツールが `Native hook relay unavailable` を報告する場合は、`/new` または `/reset` を使用してください。それでも続く場合は、古いネイティブフック登録をクリアするために Gateway を再起動してください。`computer-use.list_apps` がタイムアウトする場合は、Codex Computer Use または Codex Desktop を再起動して再試行してください。

## 関連

- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [ステータス](/ja-JP/cli/status)
- [Plugin フック](/ja-JP/plugins/hooks)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
