---
read_when:
    - 同梱の Codex app-server ハーネスを使用したい場合
    - Codex ハーネス設定例が必要です
    - Codex のみのデプロイでは、PI にフォールバックするのではなく失敗させたい
summary: OpenClaw の埋め込みエージェントターンを同梱の Codex app-server ハーネス経由で実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-05-03T21:36:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5187e54e2dc94e511c0243227f741d3486669f595c2b15cf239b1c03ea466c8
    source_path: plugins/codex-harness.md
    workflow: 16
---

バンドルされた `codex` Plugin により、OpenClaw は組み込みの PI ハーネスではなく
Codex app-server 経由で埋め込みエージェントターンを実行できます。

Codex に低レベルのエージェントセッションを所有させたい場合に使用します。対象は、モデル
検出、ネイティブスレッド再開、ネイティブ Compaction、app-server 実行です。
OpenClaw は引き続き、チャットチャンネル、セッションファイル、モデル選択、ツール、
承認、メディア配信、可視トランスクリプトミラーを所有します。

ソースチャットターンが Codex ハーネス経由で実行される場合、デプロイメントで
`messages.visibleReplies` が明示的に設定されていなければ、可視返信はデフォルトで
OpenClaw の `message` ツールになります。エージェントは Codex ターンを非公開で
完了できます。チャンネルに投稿されるのは `message(action="send")` を呼び出した場合だけです。
従来の自動配信パスで直接チャットの最終返信を維持するには、
`messages.visibleReplies: "automatic"` を設定します。

Codex Heartbeat ターンではデフォルトで `heartbeat_respond` ツールも取得するため、
エージェントは最終テキストにその制御フローをエンコードせずに、ウェイクを静かに保つか通知するかを記録できます。

Heartbeat 固有の主導性ガイダンスは、Heartbeat ターン自体で Codex コラボレーションモードの
開発者指示として送信されます。通常のチャットターンでは、通常のランタイムプロンプトに
Heartbeat の思想を持ち込まず、Codex Default モードを復元します。

状況を把握したい場合は、
[エージェントランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。短く言うと、
`openai/gpt-5.5` はモデル参照、`codex` はランタイムであり、Telegram、
Discord、Slack、または別のチャンネルは通信サーフェスのままです。

## クイック設定

「OpenClaw 内の Codex」を望むほとんどのユーザーが求めているのはこのルートです。つまり、
ChatGPT/Codex サブスクリプションでサインインし、その後ネイティブ
Codex app-server ランタイム経由で埋め込みエージェントターンを実行します。モデル参照は引き続き
`openai/gpt-*` として正規のままです。サブスクリプション認証は
`openai-codex/*` モデルプレフィックスではなく、Codex アカウント/プロファイルから取得されます。

まだの場合は、まず Codex OAuth でサインインします。

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

ネイティブ Codex ランタイムを意図している場合は、`openai-codex/gpt-*` を使用しないでください。そのプレフィックスは、
明示的な「PI 経由の Codex OAuth」ルートです。設定変更は新規または
リセット済みセッションに適用されます。既存セッションは記録済みのランタイムを保持します。

## この Plugin が変更すること

バンドルされた `codex` Plugin は、いくつかの個別機能を提供します。

| 機能                              | 使用方法                                            | 動作                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| ネイティブ埋め込みランタイム      | `agentRuntime.id: "codex"`                          | OpenClaw の埋め込みエージェントターンを Codex app-server 経由で実行します。  |
| ネイティブチャット制御コマンド    | `/codex bind`, `/codex resume`, `/codex steer`, ... | メッセージング会話から Codex app-server スレッドをバインドして制御します。    |
| Codex app-server プロバイダー/カタログ | `codex` 内部、ハーネス経由で公開                 | ランタイムが app-server モデルを検出および検証できるようにします。           |
| Codex メディア理解パス            | `codex/*` 画像モデル互換パス                        | 対応する画像理解モデルに対して、境界付き Codex app-server ターンを実行します。 |
| ネイティブフックリレー            | Codex ネイティブイベント周辺の Plugin フック        | OpenClaw が対応する Codex ネイティブツール/ファイナライズイベントを観測/ブロックできるようにします。 |

Plugin を有効化すると、これらの機能が利用可能になります。有効化しても、次のことは**行いません**。

- すべての OpenAI モデルで Codex の使用を開始する
- `openai-codex/*` モデル参照をネイティブランタイムに変換する
- ACP/acpx をデフォルトの Codex パスにする
- すでに PI ランタイムを記録済みの既存セッションをホットスイッチする
- OpenClaw のチャンネル配信、セッションファイル、認証プロファイル保存、または
  メッセージルーティングを置き換える

同じ Plugin は、ネイティブ `/codex` チャット制御コマンドサーフェスも所有します。
Plugin が有効で、ユーザーがチャットから Codex スレッドのバインド、再開、誘導、停止、または検査を求めた場合、
エージェントは ACP よりも `/codex ...` を優先する必要があります。ACP は、ユーザーが ACP/acpx を求めた場合、
または ACP Codex アダプターをテストしている場合の明示的なフォールバックのままです。

ネイティブ Codex ターンでは、公開互換レイヤーとして OpenClaw Plugin フックが保持されます。
これらはプロセス内 OpenClaw フックであり、Codex `hooks.json` コマンドフックではありません。

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` はミラーされたトランスクリプトレコード用
- Codex `Stop` リレー経由の `before_agent_finalize`
- `agent_end`

Plugin は、ランタイム非依存のツール結果ミドルウェアも登録でき、OpenClaw がツールを実行した後、
結果が Codex に返される前に OpenClaw の動的ツール結果を書き換えられます。これは公開
`tool_result_persist` Plugin フックとは別のものです。この公開フックは、OpenClaw 所有のトランスクリプト
ツール結果書き込みを変換します。

Plugin フックのセマンティクス自体については、[Plugin フック](/ja-JP/plugins/hooks)
と [Plugin ガード動作](/ja-JP/tools/plugin) を参照してください。

ハーネスはデフォルトでオフです。新しい設定では、OpenAI モデル参照を
`openai/gpt-*` として正規に保ち、ネイティブ app-server 実行を
必要とする場合に `agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex` を
明示的に強制する必要があります。従来の `codex/*` モデル参照は互換性のために引き続き
ハーネスを自動選択しますが、ランタイムで裏付けられた従来のプロバイダープレフィックスは、
通常のモデル/プロバイダー選択肢としては表示されません。

`codex` Plugin が有効でもプライマリモデルがまだ
`openai-codex/*` の場合、`openclaw doctor` はルートを変更するのではなく警告します。これは
意図的です。`openai-codex/*` は PI Codex OAuth/サブスクリプションパスのままであり、
ネイティブ app-server 実行は明示的なランタイム選択のままです。

## ルートマップ

設定を変更する前に、この表を使用してください。

| 望む動作                                             | モデル参照                 | ランタイム設定                         | 認証/プロファイルルート      | 期待されるステータスラベル     |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| ネイティブ Codex ランタイムを使う ChatGPT/Codex サブスクリプション | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth または Codex アカウント | `Runtime: OpenAI Codex`        |
| 通常の OpenClaw ランナー経由の OpenAI API            | `openai/gpt-*`             | 省略または `runtime: "pi"`             | OpenAI API キー              | `Runtime: OpenClaw Pi Default` |
| PI 経由の ChatGPT/Codex サブスクリプション           | `openai-codex/gpt-*`       | 省略または `runtime: "pi"`             | OpenAI Codex OAuth プロバイダー | `Runtime: OpenClaw Pi Default` |
| 保守的な自動モードを使う混在プロバイダー             | プロバイダー固有の参照     | `agentRuntime.id: "auto"`              | 選択されたプロバイダーごと   | 選択されたランタイムに依存     |
| 明示的な Codex ACP アダプターセッション              | ACP プロンプト/モデル依存  | `sessions_spawn` と `runtime: "acp"`   | ACP バックエンド認証         | ACP タスク/セッションステータス |

重要な分岐は、プロバイダーとランタイムです。

- `openai-codex/*` は「PI はどのプロバイダー/認証ルートを使うべきか」に答えます
- `agentRuntime.id: "codex"` は「どのループがこの
  埋め込みターンを実行すべきか」に答えます
- `/codex ...` は「このチャットはどのネイティブ Codex 会話をバインドまたは
  制御すべきか」に答えます
- ACP は「acpx はどの外部ハーネスプロセスを起動すべきか」に答えます

## 適切なモデルプレフィックスを選ぶ

OpenAI ファミリーのルートはプレフィックス固有です。一般的なサブスクリプションと
ネイティブ Codex ランタイムの組み合わせでは、`agentRuntime.id: "codex"` とともに `openai/*` を使用します。
PI 経由で Codex OAuth を意図的に使いたい場合にのみ、`openai-codex/*` を使用します。

| モデル参照                                    | ランタイムパス                             | 使用する場合                                                              |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI 配管経由の OpenAI プロバイダー | `OPENAI_API_KEY` で現在の直接 OpenAI Platform API アクセスを使いたい場合。 |
| `openai-codex/gpt-5.5`                        | OpenClaw/PI 経由の OpenAI Codex OAuth       | デフォルトの PI ランナーで ChatGPT/Codex サブスクリプション認証を使いたい場合。 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server ハーネス                   | ネイティブ Codex 実行で ChatGPT/Codex サブスクリプション認証を使いたい場合。 |

GPT-5.5 は、アカウントで公開されている場合、直接 OpenAI API キーと Codex サブスクリプションの両方のルートに表示されることがあります。
ネイティブ Codex ランタイムには Codex app-server
ハーネス付きの `openai/gpt-5.5`、PI OAuth には `openai-codex/gpt-5.5`、
直接 API キートラフィックには Codex ランタイムオーバーライドなしの
`openai/gpt-5.5` を使用します。

従来の `codex/gpt-*` 参照は、互換エイリアスとして引き続き受け入れられます。Doctor の
互換性移行は、従来のプライマリランタイム参照を正規モデル参照に書き換え、
ランタイムポリシーを別途記録します。一方、フォールバック専用の従来参照は、
ランタイムがエージェントコンテナ全体に対して設定されるため、変更されません。
新しい PI Codex OAuth 設定では `openai-codex/gpt-*` を使用し、新しいネイティブ
app-server ハーネス設定では `agentRuntime.id: "codex"` とともに
`openai/gpt-*` を使用してください。

`agents.defaults.imageModel` も同じプレフィックス分岐に従います。
画像理解を OpenAI Codex OAuth プロバイダーパス経由で実行する場合は
`openai-codex/gpt-*` を使用します。画像理解を境界付き Codex app-server ターン経由で実行する場合は
`codex/gpt-*` を使用します。Codex app-server モデルは
画像入力サポートを広告している必要があります。テキスト専用の Codex モデルは、メディアターンが
開始される前に失敗します。

現在のセッションで有効なハーネスを確認するには `/status` を使用します。選択が予想外の場合は、
`agents/harness` サブシステムのデバッグログを有効にし、Gateway の構造化された `agent harness selected` レコードを
調べてください。これには、選択されたハーネス ID、選択理由、ランタイム/フォールバックポリシー、および
`auto` モードでは各 Plugin 候補のサポート結果が含まれます。

### doctor 警告の意味

次のすべてが真の場合、`openclaw doctor` は警告します。

- バンドルされた `codex` Plugin が有効または許可されている
- エージェントのプライマリモデルが `openai-codex/*`
- そのエージェントの有効ランタイムが `codex` ではない

この警告が存在するのは、ユーザーがしばしば「Codex Plugin が有効」を
「ネイティブ Codex app-server ランタイム」を意味すると期待するためです。OpenClaw はその飛躍を行いません。警告の意味は次のとおりです。

- PI 経由の ChatGPT/Codex OAuth を意図している場合、**変更は不要です**。
- ネイティブ app-server 実行を意図している場合は、モデルを `openai/<model>` に変更し、
  `agentRuntime.id: "codex"` を設定します。
- セッションランタイムのピン留めは固定されるため、ランタイム変更後も既存セッションには
  `/new` または `/reset` が必要です。

ハーネス選択はライブセッション制御ではありません。埋め込みターンが実行されると、
OpenClaw は選択されたハーネス ID をそのセッションに記録し、同じセッション ID の
後続ターンでもそれを使い続けます。今後のセッションで別のハーネスを使いたい場合は
`agentRuntime` 設定または `OPENCLAW_AGENT_RUNTIME` を変更してください。
既存の会話を PI と Codex の間で切り替える前に、新しいセッションを開始するには
`/new` または `/reset` を使用します。これにより、1 つのトランスクリプトを
互換性のない 2 つのネイティブセッションシステムで再生することを避けられます。

ハーネス固定前に作成されたレガシーセッションは、トランスクリプト履歴があると PI 固定として扱われます。設定を変更した後、その会話を Codex に参加させるには `/new` または `/reset` を使用します。

`/status` は有効なモデルランタイムを表示します。デフォルトの PI ハーネスは `Runtime: OpenClaw Pi Default` として表示され、Codex app-server ハーネスは `Runtime: OpenAI Codex` として表示されます。

## 要件

- バンドルされた `codex` Plugin が利用可能な OpenClaw。
- Codex app-server `0.125.0` 以降。バンドルされた Plugin は、デフォルトで互換性のある Codex app-server バイナリを管理するため、`PATH` 上のローカル `codex` コマンドは通常のハーネス起動に影響しません。
- app-server プロセス、または OpenClaw の Codex 認証ブリッジで利用可能な Codex 認証。ローカル app-server 起動は、各エージェントに対して OpenClaw 管理の Codex ホームと分離された子 `HOME` を使用するため、デフォルトでは個人用の `~/.codex` アカウント、Skills、plugins、設定、スレッド状態、またはネイティブの `$HOME/.agents/skills` を読み取りません。

Plugin は、古い、またはバージョン未指定の app-server ハンドシェイクをブロックします。これにより、OpenClaw はテスト済みのプロトコルサーフェス上に保たれます。

ライブおよび Docker スモークテストでは、認証は通常 Codex CLI アカウント、または OpenClaw の `openai-codex` 認証プロファイルから取得されます。ローカル stdio app-server 起動では、アカウントが存在しない場合に `CODEX_API_KEY` / `OPENAI_API_KEY` にフォールバックすることもできます。

## ワークスペースのブートストラップファイル

Codex は、ネイティブのプロジェクトドキュメント検出を通じて `AGENTS.md` を自身で処理します。OpenClaw は合成 Codex プロジェクトドキュメントファイルを書き込まず、ペルソナファイルについて Codex のフォールバックファイル名にも依存しません。Codex のフォールバックは `AGENTS.md` が存在しない場合にのみ適用されるためです。

OpenClaw のワークスペース同等性のために、Codex ハーネスは他のブートストラップファイル（存在する場合は `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、および `MEMORY.md`）を解決し、`thread/start` と `thread/resume` で Codex 設定命令を通じて転送します。これにより、`AGENTS.md` を複製せずに、`SOUL.md` と関連するワークスペースのペルソナ/プロファイルコンテキストが見える状態に保たれます。

## 他のモデルと並べて Codex を追加する

同じエージェントが Codex と非 Codex プロバイダーモデルを自由に切り替える必要がある場合、`agentRuntime.id: "codex"` をグローバルに設定しないでください。強制されたランタイムは、そのエージェントまたはセッションのすべての埋め込みターンに適用されます。そのランタイムが強制されている間に Anthropic モデルを選択しても、OpenClaw は引き続き Codex ハーネスを試行し、そのターンを PI 経由で静かにルーティングする代わりにクローズドに失敗します。

代わりに、次のいずれかの形を使用します。

- `agentRuntime.id: "codex"` を持つ専用エージェントに Codex を置く。
- 通常の混在プロバイダー利用のために、デフォルトエージェントを `agentRuntime.id: "auto"` と PI フォールバックのままにする。
- レガシーの `codex/*` 参照は互換性のためにのみ使用する。新しい設定では、`openai/*` と明示的な Codex ランタイムポリシーを優先する。

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
- `codex` エージェントで Codex が見つからない、またはサポートされていない場合、PI を静かに使用する代わりにターンは失敗します。

## エージェントコマンドのルーティング

エージェントは「Codex」という単語だけではなく、意図によってユーザーリクエストをルーティングする必要があります。

| ユーザーが依頼する内容...                            | エージェントが使用すべきもの...                   |
| ------------------------------------------------------ | ------------------------------------------------ |
| 「このチャットを Codex にバインドして」                | `/codex bind`                                    |
| 「Codex スレッド `<id>` をここで再開して」             | `/codex resume <id>`                             |
| 「Codex スレッドを表示して」                           | `/codex threads`                                 |
| 「失敗した Codex 実行のサポートレポートを提出して」   | `/diagnostics [note]`                            |
| 「この添付スレッドについてだけ Codex フィードバックを送信して」 | `/codex diagnostics [note]`                      |
| 「Codex ランタイムで ChatGPT/Codex サブスクリプションを使って」 | `openai/*` と `agentRuntime.id: "codex"`         |
| 「PI 経由で ChatGPT/Codex サブスクリプションを使って」 | `openai-codex/*` モデル参照                      |
| 「ACP/acpx 経由で Codex を実行して」                   | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「スレッド内で Claude Code/Gemini/OpenCode/Cursor を開始して」 | ACP/acpx、`/codex` ではなくネイティブサブエージェントでもない |

OpenClaw は、ACP が有効で、ディスパッチ可能で、ロード済みランタイムバックエンドに支えられている場合にのみ、ACP スポーンのガイダンスをエージェントに広告します。ACP が利用できない場合、システムプロンプトと Plugin Skills は、ACP ルーティングについてエージェントに教えるべきではありません。

## Codex 専用デプロイ

すべての埋め込みエージェントターンが Codex を使用することを証明する必要がある場合、Codex ハーネスを強制します。明示的な Plugin ランタイムはクローズドに失敗し、PI 経由で静かに再試行されることはありません。

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

Codex が強制されている場合、Codex Plugin が無効である、app-server が古すぎる、または app-server を開始できないと、OpenClaw は早期に失敗します。

## エージェントごとの Codex

デフォルトエージェントが通常の自動選択を維持したまま、1 つのエージェントを Codex 専用にできます。

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

エージェントとモデルを切り替えるには、通常のセッションコマンドを使用します。`/new` は新しい OpenClaw セッションを作成し、Codex ハーネスは必要に応じてサイドカー app-server スレッドを作成または再開します。`/reset` はそのスレッドの OpenClaw セッションバインディングをクリアし、次のターンで現在の設定からハーネスを再度解決できるようにします。

## モデル検出

デフォルトでは、Codex Plugin は利用可能なモデルを app-server に問い合わせます。検出が失敗する、またはタイムアウトした場合、次のバンドル済みフォールバックカタログを使用します。

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

Codex のプローブを避け、フォールバックカタログに固定して起動したい場合は、検出を無効にします。

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

管理対象バイナリは `codex` Plugin パッケージに同梱されています。これにより、app-server のバージョンは、ローカルにたまたまインストールされている別の Codex CLI ではなく、バンドルされた Plugin に紐づけられます。別の実行ファイルを意図的に実行したい場合にのみ `appServer.command` を設定してください。

デフォルトでは、OpenClaw はローカル Codex ハーネスセッションを YOLO モードで開始します: `approvalPolicy: "never"`、`approvalsReviewer: "user"`、および `sandbox: "danger-full-access"`。これは自律 Heartbeat に使用される信頼済みローカルオペレーターの姿勢です。Codex は、回答する人がいないネイティブ承認プロンプトで停止せずに、シェルとネットワークツールを使用できます。

Codex のガーディアンレビュー付き承認にオプトインするには、`appServer.mode: "guardian"` を設定します。

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

Guardian モードは Codex のネイティブ自動レビュー承認パスを使用します。Codex がサンドボックスの外に出る、ワークスペース外に書き込む、またはネットワークアクセスなどの権限を追加するよう求めると、Codex はその承認リクエストを人間向けプロンプトではなくネイティブレビュアーにルーティングします。レビュアーは Codex のリスクフレームワークを適用し、特定のリクエストを承認または拒否します。YOLO モードより多くのガードレールが必要だが、無人エージェントにも進捗を出させる必要がある場合は Guardian を使用します。

`guardian` プリセットは、`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。個別のポリシーフィールドは引き続き `mode` をオーバーライドするため、高度なデプロイではプリセットと明示的な選択を混在させられます。古い `guardian_subagent` レビュアー値は互換エイリアスとして引き続き受け付けられますが、新しい設定では `auto_review` を使用するべきです。

すでに実行中の app-server には WebSocket トランスポートを使用します。

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

Stdio app-server 起動はデフォルトで OpenClaw のプロセス環境を継承しますが、OpenClaw は Codex app-server アカウントブリッジを所有し、`CODEX_HOME` と `HOME` の両方を、そのエージェントの OpenClaw 状態配下にあるエージェントごとのディレクトリに設定します。Codex 自身の skill ローダーは `$CODEX_HOME/skills` と `$HOME/.agents/skills` を読み取るため、ローカル app-server 起動では両方の値が分離されます。これにより、Codex ネイティブの Skills、plugins、設定、アカウント、スレッド状態は、オペレーター個人の Codex CLI ホームから漏れ込むのではなく、OpenClaw エージェントにスコープされます。

OpenClaw plugins と OpenClaw skill スナップショットは、引き続き OpenClaw 独自の Plugin レジストリと skill ローダーを通じて流れます。個人用 Codex CLI アセットは流れません。OpenClaw エージェントの一部にすべき有用な Codex CLI Skills または plugins がある場合は、明示的にインベントリします。

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex 移行プロバイダーは、Skills を現在の OpenClaw エージェントワークスペースにコピーします。Codex ネイティブの plugins、フック、設定ファイルは、コマンドを実行したり、MCP サーバーを公開したり、認証情報を含んだりする可能性があるため、自動的に有効化されるのではなく、手動レビュー用に報告またはアーカイブされます。

認証は次の順序で選択されます。

1. エージェント用の明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex ホームにある app-server の既存アカウント。
3. ローカル stdio app-server 起動の場合のみ、app-server アカウントが存在せず、OpenAI 認証がまだ必要なときは、`CODEX_API_KEY`、次に `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、スポーンされた Codex 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーを埋め込みや直接の OpenAI モデルで利用可能にしたまま、ネイティブ Codex app-server ターンが誤って API 経由で課金されるのを防ぎます。明示的な Codex API キープロファイルとローカル stdio 環境キーのフォールバックは、継承された子プロセス環境の代わりに app-server ログインを使用します。WebSocket app-server 接続は Gateway 環境 API キーフォールバックを受け取りません。明示的な認証プロファイル、またはリモート app-server 自身のアカウントを使用してください。

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

`appServer.clearEnv` は、生成された Codex app-server の子プロセスにのみ影響します。

Codex の動的ツールは、デフォルトで `native-first` プロファイルを使用します。このモードでは、
OpenClaw は Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません:
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、および
`update_plan`。メッセージング、セッション、メディア、
cron、ブラウザー、ノード、gateway、`heartbeat_respond`、`web_search` などの OpenClaw 統合ツールは
引き続き利用できます。

サポートされている最上位の Codex plugin フィールド:

| フィールド               | デフォルト       | 意味                                                                                      |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Codex app-server に OpenClaw の動的ツールセット全体を公開するには、`"openclaw-compat"` を使用します。 |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server のターンから除外する追加の OpenClaw 動的ツール名。                       |

サポートされている `appServer` フィールド:

| フィールド          | デフォルト                               | 意味                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` は Codex を生成し、`"websocket"` は `url` に接続します。                                                                                                                                                                             |
| `command`           | 管理対象の Codex バイナリ                | stdio transport の実行ファイル。管理対象バイナリを使用するには未設定のままにし、明示的に上書きする場合にのみ設定します。                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio transport の引数。                                                                                                                                                                                                       |
| `url`               | 未設定                                   | WebSocket app-server の URL。                                                                                                                                                                                                            |
| `authToken`         | 未設定                                   | WebSocket transport の Bearer トークン。                                                                                                                                                                                                |
| `headers`           | `{}`                                     | 追加の WebSocket ヘッダー。                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | OpenClaw が継承環境を構築した後に、生成された stdio app-server プロセスから削除される追加の環境変数名。`CODEX_HOME` と `HOME` は、ローカル起動時の OpenClaw のエージェント単位の Codex 分離用に予約されています。 |
| `requestTimeoutMs`  | `60000`                                  | app-server control-plane 呼び出しのタイムアウト。                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | YOLO または guardian レビュー済み実行のプリセット。                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | スレッドの開始、再開、ターンに送信されるネイティブ Codex 承認ポリシー。                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | スレッドの開始、再開に送信されるネイティブ Codex サンドボックスモード。                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Codex にネイティブ承認プロンプトをレビューさせるには、`"auto_review"` を使用します。`guardian_subagent` は従来のエイリアスとして残っています。                                                                                                                         |
| `serviceTier`       | 未設定                                   | 任意の Codex app-server サービス層: `"fast"`、`"flex"`、または `null`。無効な従来値は無視されます。                                                                                                                            |

OpenClaw 所有の動的ツール呼び出しは、`appServer.requestTimeoutMs` とは独立して
制限されます。各 Codex `item/tool/call` リクエストは、30 秒以内に
OpenClaw のレスポンスを受け取る必要があります。タイムアウト時、OpenClaw は対応している場合はツール
シグナルを中止し、失敗した動的ツールレスポンスを Codex に返します。これにより、
セッションを `processing` のまま残すのではなく、ターンを継続できます。

OpenClaw が Codex のターンスコープ app-server リクエストに応答した後、ハーネスは
Codex が `turn/completed` でネイティブターンを完了することも期待します。その
レスポンス後に app-server が 60 秒間無応答になった場合、OpenClaw はベストエフォートで
Codex ターンを中断し、診断タイムアウトを記録し、OpenClaw セッションレーンを解放して、
後続のチャットメッセージが古いネイティブターンの後ろにキューされないようにします。

ローカルテスト用の環境上書きは引き続き利用できます:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、`OPENCLAW_CODEX_APP_SERVER_BIN` は管理対象バイナリを
迂回します。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、
1 回限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。構成は
Codex ハーネス設定の残りと同じレビュー済みファイル内に plugin の動作を保持するため、
再現可能なデプロイでは構成が推奨されます。

## コンピューター使用

コンピューター使用については、専用の設定ガイドで説明しています:
[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use)。

要約すると、OpenClaw はデスクトップ制御アプリを vendoring せず、デスクトップ操作自体も
実行しません。Codex app-server を準備し、`computer-use` MCP サーバーが利用可能であることを
検証したうえで、Codex モードのターン中に Codex がネイティブ MCP ツール呼び出しを処理できるようにします。

Codex marketplace フロー外で TryCua ドライバーに直接アクセスするには、
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` で
`cua-driver mcp` を登録します。Codex 所有のコンピューター使用と直接 MCP 登録の違いについては、
[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use) を参照してください。

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

設定はコマンドサーフェスから確認またはインストールできます:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

コンピューター使用は macOS 固有であり、Codex MCP サーバーがアプリを制御できるようになる前に
ローカル OS 権限が必要な場合があります。`computerUse.enabled` が true で MCP
サーバーが利用できない場合、Codex モードのターンは、ネイティブのコンピューター使用ツールなしで
黙って実行されるのではなく、スレッド開始前に失敗します。marketplace の選択肢、
リモートカタログの制限、ステータス理由、トラブルシューティングについては、
[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use) を参照してください。

`computerUse.autoInstall` が true の場合、Codex がローカル marketplace をまだ検出していなければ、
OpenClaw は `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` から
標準のバンドル済み Codex Desktop marketplace を登録できます。ランタイムまたはコンピューター使用の
構成を変更した後は、既存セッションが古い PI または Codex スレッドバインディングを保持しないように、
`/new` または `/reset` を使用してください。

## 一般的なレシピ

デフォルトの stdio transport を使用するローカル Codex:

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

Guardian レビュー済み Codex 承認:

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

モデル切り替えは OpenClaw が制御します。OpenClaw セッションが既存の Codex スレッドに
アタッチされている場合、次のターンは現在選択されている OpenAI モデル、プロバイダー、
承認ポリシー、サンドボックス、サービス層を app-server に再送信します。
`openai/gpt-5.5` から `openai/gpt-5.2` に切り替えると、スレッドバインディングは維持されますが、
新しく選択されたモデルで続行するよう Codex に要求します。

## Codex コマンド

バンドル済み plugin は、承認済みスラッシュコマンドとして `/codex` を登録します。これは
汎用であり、OpenClaw テキストコマンドをサポートする任意のチャンネルで動作します。

一般的な形式:

- `/codex status` は、ライブ app-server 接続、モデル、アカウント、レート制限、MCP サーバー、skills を表示します。
- `/codex models` は、ライブ Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex スレッドにアタッチします。
- `/codex compact` は、アタッチされたスレッドを compact するよう Codex app-server に要求します。
- `/codex review` は、アタッチされたスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、アタッチされたスレッドについて Codex 診断フィードバックを送信する前に確認します。
- `/codex computer-use status` は、構成済みの Computer Use plugin と MCP サーバーを確認します。
- `/codex computer-use install` は、構成済みの Computer Use plugin をインストールし、MCP サーバーを再読み込みします。
- `/codex account` は、アカウントとレート制限の状態を表示します。
- `/codex mcp` は、Codex app-server MCP サーバーの状態を一覧表示します。
- `/codex skills` は、Codex app-server skills を一覧表示します。

### 一般的なデバッグワークフロー

Codex が支えるエージェントが Telegram、Discord、Slack、
または別のチャネルで予期しない動作をした場合は、問題が発生した会話から始めます。

1. `/diagnostics bad tool choice after image upload`、または見た内容を説明する別の短いメモを実行します。
2. 診断リクエストを一度承認します。この承認により、ローカルの Gateway
   診断 zip が作成され、セッションが Codex ハーネスを使用しているため、
   関連する Codex フィードバックバンドルも OpenAI サーバーへ送信されます。
3. 完了した診断返信をバグレポートまたはサポートスレッドにコピーします。
   そこには、ローカルバンドルパス、プライバシー概要、OpenClaw セッション ID、
   Codex スレッド ID、および各 Codex スレッドの `Inspect locally` 行が含まれます。
4. 自分で実行をデバッグしたい場合は、出力された `Inspect locally`
   コマンドをターミナルで実行します。これは `codex resume <thread-id>` のような形で、
   ネイティブ Codex スレッドを開くため、会話を調査したり、ローカルで続行したり、
   Codex が特定のツールまたは計画を選んだ理由を尋ねたりできます。

現在アタッチされているスレッドについて、完全な OpenClaw
Gateway 診断バンドルなしで Codex フィードバックアップロードだけを特に行いたい場合にのみ、
`/codex diagnostics [note]` を使用してください。ほとんどのサポートレポートでは、
`/diagnostics [note]` のほうが適切な開始点です。ローカル Gateway の状態と Codex
スレッド ID を 1 つの返信にまとめるためです。完全なプライバシーモデルとグループチャットでの動作については、
[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

Core OpenClaw も、一般的な Gateway 診断コマンドとして、所有者専用の `/diagnostics [note]` を公開しています。その承認プロンプトは機微データに関する前置きを表示し、[診断エクスポート](/ja-JP/gateway/diagnostics)へリンクし、毎回明示的な exec 承認を通じて `openclaw gateway diagnostics export --json` を要求します。allow-all ルールで診断を承認しないでください。承認後、OpenClaw はローカルバンドルパスとマニフェスト概要を含む、貼り付け可能なレポートを送信します。アクティブな OpenClaw セッションが Codex ハーネスを使用している場合、同じ承認によって、関連する Codex フィードバックバンドルを OpenAI サーバーに送信することも許可されます。承認プロンプトには Codex フィードバックが送信されることが示されますが、承認前に Codex セッション ID またはスレッド ID は一覧表示されません。

所有者がグループチャットで `/diagnostics` を呼び出した場合、OpenClaw は共有チャネルを簡潔に保ちます。グループには短い通知だけが届き、診断の前置き、承認プロンプト、Codex セッション/スレッド ID はプライベート承認ルートを通じて所有者に送信されます。プライベート所有者ルートがない場合、OpenClaw はグループリクエストを拒否し、DM から実行するよう所有者に求めます。

承認された Codex アップロードは Codex app-server `feedback/upload` を呼び出し、一覧にある各スレッドと、利用可能な場合は生成された Codex サブスレッドのログを含めるよう app-server に要求します。このアップロードは Codex の通常のフィードバック経路を通じて OpenAI サーバーへ送信されます。その app-server で Codex フィードバックが無効になっている場合、コマンドは app-server エラーを返します。完了した診断返信には、送信されたスレッドについて、チャネル、OpenClaw セッション ID、Codex スレッド ID、ローカルの `codex resume <thread-id>` コマンドが一覧表示されます。承認を拒否または無視した場合、OpenClaw はそれらの Codex ID を表示しません。このアップロードはローカル Gateway 診断エクスポートを置き換えるものではありません。

`/codex resume` は、ハーネスが通常のターンで使用するものと同じ sidecar バインディングファイルを書き込みます。次のメッセージで、OpenClaw はその Codex スレッドを再開し、現在選択されている OpenClaw モデルを app-server に渡し、拡張履歴を有効なままにします。

### CLI から Codex スレッドを調査する

問題のある Codex 実行を理解する最速の方法は、多くの場合、ネイティブ Codex
スレッドを直接開くことです。

```sh
codex resume <thread-id>
```

チャネル会話でバグに気づき、問題のある Codex セッションを調査したい、ローカルで続行したい、または Codex が特定のツールや推論を選んだ理由を尋ねたい場合に使用します。通常、最も簡単な手順は、まず `/diagnostics [note]` を実行することです。承認後、完了したレポートに各 Codex スレッドが一覧表示され、たとえば `codex resume <thread-id>` のような `Inspect locally` コマンドが出力されます。そのコマンドを直接ターミナルにコピーできます。

現在のチャットについては `/codex binding` から、最近の Codex app-server スレッドについては `/codex threads [filter]` からスレッド ID を取得し、その後シェルで同じ `codex resume` コマンドを実行することもできます。

このコマンドサーフェスには Codex app-server `0.125.0` 以降が必要です。将来版またはカスタム app-server がその JSON-RPC メソッドを公開していない場合、個々の制御メソッドは `unsupported by this Codex app-server` と報告されます。

## フック境界

Codex ハーネスには 3 つのフックレイヤーがあります。

| レイヤー                              | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw plugin フック                | OpenClaw                 | PI と Codex ハーネス全体での製品/plugin 互換性。                    |
| Codex app-server 拡張ミドルウェア     | OpenClaw bundled plugins | OpenClaw 動的ツール周辺のターンごとのアダプター動作。              |
| Codex ネイティブフック                | Codex                    | Codex config からの低レベルな Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、OpenClaw plugin の動作をルーティングするために、プロジェクトまたはグローバルの Codex `hooks.json` ファイルを使用しません。サポートされるネイティブツールと権限ブリッジについて、OpenClaw は `PreToolUse`、`PostToolUse`、`PermissionRequest`、`Stop` 用のスレッドごとの Codex config を注入します。`SessionStart` や `UserPromptSubmit` などの他の Codex フックは Codex レベルの制御のままであり、v1 コントラクトでは OpenClaw plugin フックとして公開されません。

OpenClaw 動的ツールでは、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、OpenClaw はハーネスアダプター内で自身が所有する plugin とミドルウェアの動作を発火します。Codex ネイティブツールでは、Codex が正準のツールレコードを所有します。OpenClaw は選択したイベントをミラーできますが、Codex が app-server またはネイティブフックコールバックを通じてその操作を公開しない限り、ネイティブ Codex スレッドを書き換えることはできません。

Compaction と LLM ライフサイクル投影は、ネイティブ Codex フックコマンドではなく、Codex app-server 通知と OpenClaw アダプター状態から得られます。OpenClaw の `before_compaction`、`after_compaction`、`llm_input`、`llm_output` イベントはアダプターレベルの観測であり、Codex の内部リクエストまたは Compaction ペイロードのバイト単位のキャプチャではありません。

Codex ネイティブの `hook/started` と `hook/completed` app-server 通知は、軌跡とデバッグのために `codex_app_server.hook` エージェントイベントとして投影されます。これらは OpenClaw plugin フックを呼び出しません。

## V1 サポートコントラクト

Codex モードは、内部のモデル呼び出しを変えただけの PI ではありません。Codex はネイティブモデルループのより多くを所有し、OpenClaw はその境界に合わせて plugin とセッションサーフェスを適応させます。

Codex runtime v1 でサポートされるもの:

| サーフェス                                    | サポート                                | 理由                                                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Codex を通じた OpenAI モデルループ            | サポート                                | Codex app-server が OpenAI ターン、ネイティブスレッド再開、ネイティブツール継続を所有します。                                                                                                         |
| OpenClaw チャネルルーティングと配信           | サポート                                | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャネルはモデル runtime の外側に留まります。                                                                                                   |
| OpenClaw 動的ツール                           | サポート                                | Codex がこれらのツールを実行するよう OpenClaw に要求するため、OpenClaw は実行経路内に留まります。                                                                                                     |
| プロンプトとコンテキスト plugins              | サポート                                | OpenClaw はプロンプトオーバーレイを構築し、スレッドの開始または再開前にコンテキストを Codex ターンへ投影します。                                                                                     |
| コンテキストエンジンライフサイクル            | サポート                                | Assemble、ingest またはターン後メンテナンス、およびコンテキストエンジン Compaction の調整が Codex ターンで実行されます。                                                                             |
| 動的ツールフック                              | サポート                                | `before_tool_call`、`after_tool_call`、およびツール結果ミドルウェアが、OpenClaw 所有の動的ツールの周辺で実行されます。                                                                                |
| ライフサイクルフック                          | アダプター観測としてサポート            | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は、正直な Codex モードペイロードで発火します。                                                                        |
| 最終回答改訂ゲート                            | ネイティブフックリレー経由でサポート    | Codex `Stop` は `before_agent_finalize` にリレーされます。`revise` は最終化前に Codex へもう 1 回のモデルパスを要求します。                                                                           |
| ネイティブ shell、patch、MCP のブロックまたは観測 | ネイティブフックリレー経由でサポート | Codex `PreToolUse` と `PostToolUse` は、Codex app-server `0.125.0` 以降の MCP ペイロードを含む、コミット済みネイティブツールサーフェスにリレーされます。ブロックはサポートされますが、引数の書き換えはサポートされません。 |
| ネイティブ権限ポリシー                        | ネイティブフックリレー経由でサポート    | runtime が公開している場合、Codex `PermissionRequest` は OpenClaw ポリシーを通じてルーティングできます。OpenClaw が判断を返さない場合、Codex は通常の guardian またはユーザー承認経路を続行します。 |
| App-server 軌跡キャプチャ                     | サポート                                | OpenClaw は app-server に送信したリクエストと、受信した app-server 通知を記録します。                                                                                                                 |

Codex runtime v1 でサポートされないもの:

| サーフェス                                             | V1 境界                                                                                                                                     | 今後の方向                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ネイティブツール引数の変更                       | Codex ネイティブのツール実行前 hook はブロックできますが、OpenClaw は Codex ネイティブのツール引数を書き換えません。                                               | 置換用ツール入力には Codex hook/schema サポートが必要です。                            |
| 編集可能な Codex ネイティブのトランスクリプト履歴            | Codex が正規のネイティブスレッド履歴を所有します。OpenClaw はミラーを所有し、将来のコンテキストを投影できますが、サポートされていない内部を変更すべきではありません。 | ネイティブスレッドの操作が必要な場合は、明示的な Codex app-server API を追加します。                    |
| Codex ネイティブツールレコードの `tool_result_persist` | その hook は OpenClaw が所有するトランスクリプト書き込みを変換するものであり、Codex ネイティブツールレコードを変換するものではありません。                                                           | 変換済みレコードをミラーすることはできますが、正規の書き換えには Codex サポートが必要です。              |
| リッチなネイティブ Compaction メタデータ                     | OpenClaw は Compaction の開始と完了を監視しますが、安定した保持/削除リスト、トークン差分、または要約ペイロードは受け取りません。            | よりリッチな Codex Compaction イベントが必要です。                                                     |
| Compaction への介入                             | 現在の OpenClaw Compaction hook は Codex モードでは通知レベルです。                                                                         | plugins がネイティブ Compaction を拒否または書き換える必要がある場合は、Codex の Compaction 前後 hook を追加します。 |
| バイト単位で一致するモデル API リクエストキャプチャ             | OpenClaw は app-server リクエストと通知をキャプチャできますが、Codex core が最終的な OpenAI API リクエストを内部で構築します。                      | Codex のモデルリクエスト追跡イベントまたはデバッグ API が必要です。                                   |

## ツール、メディア、Compaction

Codex ハーネスは、低レベルの組み込みエージェント実行器のみを変更します。

OpenClaw は引き続きツールリストを構築し、ハーネスから動的なツール結果を受け取ります。テキスト、画像、動画、音楽、TTS、承認、メッセージングツール出力は、通常の OpenClaw 配信パスを通り続けます。

ネイティブ hook リレーは意図的に汎用化されていますが、v1 のサポート契約は OpenClaw がテストする Codex ネイティブツールおよび権限パスに限定されます。Codex ランタイムでは、これには shell、patch、および MCP の `PreToolUse`、`PostToolUse`、`PermissionRequest` ペイロードが含まれます。ランタイム契約で名前が付けられるまでは、将来のすべての Codex hook イベントが OpenClaw Plugin サーフェスであると想定しないでください。

`PermissionRequest` では、OpenClaw はポリシーが判断した場合にのみ明示的な許可または拒否の決定を返します。決定なしの結果は許可ではありません。Codex はそれを hook 決定なしとして扱い、自身の guardian またはユーザー承認パスへフォールスルーします。

Codex MCP ツール承認 elicitation は、Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` としてマークした場合、OpenClaw の Plugin 承認フローを通じてルーティングされます。Codex `request_user_input` プロンプトは発信元のチャットに送り返され、次にキューに入っているフォローアップメッセージは、追加コンテキストとして誘導されるのではなく、そのネイティブサーバーリクエストへの回答になります。その他の MCP elicitation リクエストは引き続き fail closed します。

アクティブ実行キューの誘導は Codex app-server `turn/steer` に対応します。デフォルトの `messages.queue.mode: "steer"` では、OpenClaw は構成済みの静かな時間枠内にキューされたチャットメッセージをまとめ、到着順に 1 つの `turn/steer` リクエストとして送信します。従来の `queue` モードは個別の `turn/steer` リクエストを送信します。Codex レビューおよび手動 Compaction ターンは同一ターン誘導を拒否する場合があり、その場合 OpenClaw は選択されたモードでフォールバックが許可されていれば followup queue を使用します。[誘導キュー](/ja-JP/concepts/queue-steering)を参照してください。

選択されたモデルが Codex ハーネスを使用する場合、ネイティブスレッド Compaction は Codex app-server に委任されます。OpenClaw はチャンネル履歴、検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのためにトランスクリプトミラーを保持します。ミラーには、ユーザープロンプト、最終的なアシスタントテキスト、および app-server が発行する場合は軽量な Codex reasoning または plan レコードが含まれます。現時点では、OpenClaw はネイティブ Compaction の開始および完了シグナルのみを記録します。人間が読める Compaction 要約や、Compaction 後に Codex が保持したエントリの監査可能なリストはまだ公開していません。

Codex が正規のネイティブスレッドを所有しているため、`tool_result_persist` は現在 Codex ネイティブツール結果レコードを書き換えません。これは、OpenClaw が OpenClaw 所有のセッショントランスクリプトツール結果を書き込む場合にのみ適用されます。

メディア生成に PI は不要です。画像、動画、音楽、PDF、TTS、およびメディア理解は、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts` など、対応するプロバイダー/モデル設定を引き続き使用します。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** 新しい設定ではこれは想定どおりです。`agentRuntime.id: "codex"` を持つ `openai/gpt-*` モデル（または従来の `codex/*` ref）を選択し、`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく PI を使用する:** `agentRuntime.id: "auto"` は、Codex ハーネスが実行を要求しない場合、互換性バックエンドとして引き続き PI を使用できます。テスト中に Codex 選択を強制するには、`agentRuntime.id: "codex"` を設定します。強制された Codex ランタイムは PI にフォールバックせず失敗します。Codex app-server が選択されると、その失敗は直接表面化します。

**app-server が拒否される:** app-server ハンドシェイクがバージョン `0.125.0` 以降を報告するように Codex をアップグレードしてください。`0.125.0-alpha.2` や `0.125.0+custom` など、同一バージョンのプレリリースまたはビルドサフィックス付きバージョンは、OpenClaw がテストする安定版 `0.125.0` プロトコル下限が基準であるため拒否されます。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にしてください。

**WebSocket トランスポートが即座に失敗する:** `appServer.url`、`authToken`、およびリモート app-server が同じ Codex app-server プロトコルバージョンを話していることを確認してください。

**Codex 以外のモデルが PI を使用する:** そのエージェントに対して `agentRuntime.id: "codex"` を強制した場合、または従来の `codex/*` ref を選択した場合を除き、これは想定どおりです。プレーンな `openai/gpt-*` およびその他のプロバイダー ref は、`auto` モードでは通常のプロバイダーパスに残ります。`agentRuntime.id: "codex"` を強制する場合、そのエージェントのすべての組み込みターンは Codex 対応の OpenAI モデルである必要があります。

**Computer Use はインストールされているがツールが実行されない:** 新しいセッションから `/codex computer-use status` を確認してください。ツールが `Native hook relay unavailable` を報告する場合は `/new` または `/reset` を使用してください。継続する場合は、古いネイティブ hook 登録をクリアするために Gateway を再起動してください。`computer-use.list_apps` がタイムアウトする場合は、Codex Computer Use または Codex Desktop を再起動して再試行してください。

## 関連

- [エージェントハーネス plugins](/ja-JP/plugins/sdk-agent-harness)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [ステータス](/ja-JP/cli/status)
- [Plugin hook](/ja-JP/plugins/hooks)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
