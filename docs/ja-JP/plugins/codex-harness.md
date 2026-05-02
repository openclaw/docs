---
read_when:
    - バンドルされた Codex app-server ハーネスを使用したい場合
    - Codex ハーネス設定例が必要です
    - Codex のみのデプロイで、PI にフォールバックするのではなく失敗させたい場合
summary: 同梱の Codex app-server ハーネスを通じて OpenClaw の埋め込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-05-02T23:39:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ffa0cbb28422b2ed8d7c0eef6ee0222072c523d170b4b33597bb37bd3fa9700
    source_path: plugins/codex-harness.md
    workflow: 16
---

バンドルされた `codex` Plugin により、OpenClaw は組み込みの PI ハーネスではなく
Codex app-server を通じて埋め込みエージェントターンを実行できます。

低レベルのエージェントセッションを Codex に所有させたい場合に使用します。具体的には、モデル検出、ネイティブなスレッド再開、ネイティブな Compaction、app-server 実行です。
OpenClaw は引き続き、チャットチャネル、セッションファイル、モデル選択、ツール、承認、メディア配信、表示されるトランスクリプトのミラーを所有します。

ソースチャットターンが Codex ハーネスを通じて実行される場合、デプロイが
`messages.visibleReplies` を明示的に構成していなければ、表示される返信はデフォルトで
OpenClaw の `message` ツールになります。エージェントは Codex ターンを非公開で完了できます。
チャネルに投稿するのは `message(action="send")` を呼び出した場合だけです。
直接チャットの最終返信を従来の自動配信経路に維持するには、
`messages.visibleReplies: "automatic"` を設定します。

Codex Heartbeat ターンにはデフォルトで `heartbeat_respond` ツールも提供されるため、
エージェントは最終テキストにその制御フローをエンコードせずに、ウェイクを静かに保つか通知するかを記録できます。

状況を把握しようとしている場合は、
[エージェントランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。短く言うと、
`openai/gpt-5.5` はモデル参照、`codex` はランタイムであり、Telegram、
Discord、Slack、または別のチャネルは通信面のままです。

## クイック構成

「OpenClaw の Codex」を使いたいほとんどのユーザーが求めているのはこの経路です。ChatGPT/Codex サブスクリプションでサインインし、ネイティブ
Codex app-server ランタイムを通じて埋め込みエージェントターンを実行します。モデル参照は引き続き
`openai/gpt-*` として正規のままです。サブスクリプション認証は
`openai-codex/*` モデル接頭辞ではなく、Codex アカウント/プロファイルから取得されます。

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
        fallback: "none",
      },
    },
  },
}
```

構成で `plugins.allow` を使用している場合は、そこにも `codex` を含めます。

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

ネイティブ Codex ランタイムを意味する場合に `openai-codex/gpt-*` を使用しないでください。この接頭辞は、明示的な「PI 経由の Codex OAuth」経路です。構成変更は新規またはリセットされたセッションに適用されます。既存のセッションは記録済みのランタイムを保持します。

## この Plugin が変更すること

バンドルされた `codex` Plugin は、複数の独立した機能を提供します。

| 機能                              | 使用方法                                             | 実行内容                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| ネイティブ埋め込みランタイム      | `agentRuntime.id: "codex"`                          | Codex app-server を通じて OpenClaw の埋め込みエージェントターンを実行します。 |
| ネイティブチャット制御コマンド    | `/codex bind`, `/codex resume`, `/codex steer`, ... | メッセージング会話から Codex app-server スレッドをバインドおよび制御します。  |
| Codex app-server プロバイダー/カタログ | `codex` 内部、ハーネスを通じて公開                  | ランタイムが app-server モデルを検出および検証できるようにします。            |
| Codex メディア理解経路            | `codex/*` 画像モデル互換経路                        | サポート対象の画像理解モデルに対して、境界付けられた Codex app-server ターンを実行します。 |
| ネイティブフックリレー            | Codex ネイティブイベント周辺の Plugin フック        | OpenClaw がサポート対象の Codex ネイティブツール/ファイナライズイベントを監視/ブロックできるようにします。 |

Plugin を有効にすると、これらの機能が利用可能になります。ただし、次のことは**行いません**。

- すべての OpenAI モデルで Codex を使い始める
- `openai-codex/*` モデル参照をネイティブランタイムに変換する
- ACP/acpx をデフォルトの Codex 経路にする
- すでに PI ランタイムを記録している既存セッションをホットスイッチする
- OpenClaw のチャネル配信、セッションファイル、認証プロファイルストレージ、または
  メッセージルーティングを置き換える

同じ Plugin は、ネイティブな `/codex` チャット制御コマンド面も所有します。
Plugin が有効で、ユーザーがチャットから Codex スレッドのバインド、再開、誘導、停止、または検査を求めている場合、エージェントは ACP より `/codex ...` を優先する必要があります。ACP は、ユーザーが ACP/acpx を求めた場合、または ACP
Codex アダプターをテストしている場合の明示的なフォールバックのままです。

ネイティブ Codex ターンは、OpenClaw Plugin フックを公開互換レイヤーとして維持します。
これらはプロセス内の OpenClaw フックであり、Codex `hooks.json` コマンドフックではありません。

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` ミラーされたトランスクリプトレコード用
- Codex `Stop` リレーを通じた `before_agent_finalize`
- `agent_end`

Plugin は、ランタイム中立のツール結果ミドルウェアを登録して、OpenClaw がツールを実行した後、結果が Codex に返される前に OpenClaw の動的ツール結果を書き換えることもできます。これは、OpenClaw 所有のトランスクリプトツール結果書き込みを変換する公開
`tool_result_persist` Plugin フックとは別のものです。

Plugin フックのセマンティクス自体については、[Plugin フック](/ja-JP/plugins/hooks)
および [Plugin ガード動作](/ja-JP/tools/plugin) を参照してください。

ハーネスはデフォルトでオフです。新しい構成では、OpenAI モデル参照を
`openai/gpt-*` として正規に保ち、ネイティブ app-server 実行を必要とする場合は
`agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex` を明示的に強制する必要があります。従来の `codex/*` モデル参照は互換性のために引き続きハーネスを自動選択しますが、ランタイムに裏付けられた従来のプロバイダー接頭辞は通常のモデル/プロバイダー選択肢として表示されません。

`codex` Plugin が有効でも、プライマリモデルがまだ
`openai-codex/*` の場合、`openclaw doctor` は経路を変更せずに警告します。
これは意図的です。`openai-codex/*` は PI Codex OAuth/サブスクリプション経路のままであり、ネイティブ app-server 実行は明示的なランタイム選択のままです。

## 経路マップ

構成を変更する前に、この表を使用してください。

| 望ましい動作                                           | モデル参照                 | ランタイム構成                         | 認証/プロファイル経路       | 期待されるステータスラベル   |
| ------------------------------------------------------ | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| ネイティブ Codex ランタイムで ChatGPT/Codex サブスクリプション | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth または Codex アカウント | `Runtime: OpenAI Codex`        |
| 通常の OpenClaw ランナー経由の OpenAI API              | `openai/gpt-*`             | 省略または `runtime: "pi"`             | OpenAI API キー              | `Runtime: OpenClaw Pi Default` |
| PI 経由の ChatGPT/Codex サブスクリプション             | `openai-codex/gpt-*`       | 省略または `runtime: "pi"`             | OpenAI Codex OAuth プロバイダー | `Runtime: OpenClaw Pi Default` |
| 保守的な自動モードを伴う混在プロバイダー               | プロバイダー固有の参照     | `agentRuntime.id: "auto"`              | 選択されたプロバイダーごと   | 選択されたランタイムに依存     |
| 明示的な Codex ACP アダプターセッション                | ACP プロンプト/モデル依存  | `sessions_spawn` with `runtime: "acp"` | ACP バックエンド認証         | ACP タスク/セッションステータス |

重要な分離は、プロバイダーとランタイムの違いです。

- `openai-codex/*` は「PI がどのプロバイダー/認証経路を使うべきか」に答えます
- `agentRuntime.id: "codex"` は「この埋め込みターンをどのループが実行すべきか」に答えます
- `/codex ...` は「このチャットがどのネイティブ Codex 会話をバインドまたは制御すべきか」に答えます
- ACP は「acpx がどの外部ハーネスプロセスを起動すべきか」に答えます

## 正しいモデル接頭辞を選ぶ

OpenAI ファミリーの経路は接頭辞固有です。一般的なサブスクリプションとネイティブ
Codex ランタイムのセットアップでは、`agentRuntime.id: "codex"` とともに
`openai/*` を使用します。PI 経由の Codex OAuth を意図的に必要とする場合にのみ
`openai-codex/*` を使用してください。

| モデル参照                                    | ランタイム経路                               | 使用する場合                                                                |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI 配管経由の OpenAI プロバイダー   | `OPENAI_API_KEY` による現在の直接 OpenAI Platform API アクセスが必要な場合。 |
| `openai-codex/gpt-5.5`                        | OpenClaw/PI 経由の OpenAI Codex OAuth        | デフォルトの PI ランナーで ChatGPT/Codex サブスクリプション認証を使いたい場合。 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server ハーネス                    | ネイティブ Codex 実行で ChatGPT/Codex サブスクリプション認証を使いたい場合。 |

GPT-5.5 は、アカウントが公開している場合、直接の OpenAI API キー経路と Codex サブスクリプション経路の両方に現れることがあります。ネイティブ Codex ランタイムには Codex app-server ハーネスとともに `openai/gpt-5.5` を使用し、PI OAuth には
`openai-codex/gpt-5.5` を使用し、直接 API キートラフィックには Codex ランタイム上書きなしで `openai/gpt-5.5` を使用します。

従来の `codex/gpt-*` 参照は互換エイリアスとして引き続き受け入れられます。Doctor の互換性移行は、従来のプライマリランタイム参照を正規のモデル参照に書き換え、ランタイムポリシーを別に記録します。一方で、フォールバック専用の従来参照は、ランタイムがエージェントコンテナ全体に対して構成されるため変更されません。新しい PI Codex OAuth 構成では `openai-codex/gpt-*` を使用する必要があります。新しいネイティブ
app-server ハーネス構成では、`agentRuntime.id: "codex"` とともに
`openai/gpt-*` を使用する必要があります。

`agents.defaults.imageModel` も同じ接頭辞分割に従います。画像理解を OpenAI
Codex OAuth プロバイダー経路で実行する必要がある場合は `openai-codex/gpt-*` を使用します。画像理解を境界付けられた Codex app-server ターンで実行する必要がある場合は
`codex/gpt-*` を使用します。Codex app-server モデルは画像入力サポートを宣伝している必要があります。テキスト専用の Codex モデルは、メディアターンが開始する前に失敗します。

現在のセッションで有効なハーネスを確認するには `/status` を使用します。選択が予想外の場合は、`agents/harness` サブシステムのデバッグログを有効にし、Gateway の構造化された `agent harness selected` レコードを確認します。そこには、選択されたハーネス ID、選択理由、ランタイム/フォールバックポリシー、および
`auto` モードでは各 Plugin 候補のサポート結果が含まれます。

### doctor 警告の意味

`openclaw doctor` は、次のすべてが真の場合に警告します。

- バンドルされた `codex` Plugin が有効または許可されている
- エージェントのプライマリモデルが `openai-codex/*` である
- そのエージェントの有効なランタイムが `codex` ではない

この警告は、ユーザーが「Codex Plugin が有効」であることを「ネイティブ Codex app-server ランタイム」を意味すると期待することが多いため存在します。OpenClaw はその飛躍を行いません。この警告の意味は次のとおりです。

- PI 経由の ChatGPT/Codex OAuth を意図していた場合は、**変更は不要です**。
- ネイティブ app-server 実行を意図していた場合は、モデルを `openai/<model>` に変更し、
  `agentRuntime.id: "codex"` を設定します。
- ランタイム変更後も既存セッションには `/new` または `/reset` が必要です。
  セッションのランタイムピンは固定されるためです。

ハーネス選択はライブセッション制御ではありません。埋め込みターンが実行されると、OpenClaw は選択されたハーネス ID をそのセッションに記録し、同じセッション ID の後続ターンでもそれを使い続けます。今後のセッションで別のハーネスを使用したい場合は、`agentRuntime` 構成または
`OPENCLAW_AGENT_RUNTIME` を変更します。既存の会話を PI と Codex の間で切り替える前に、新しいセッションを開始するには `/new` または `/reset` を使用します。これにより、1 つのトランスクリプトを互換性のない 2 つのネイティブセッションシステムで再生することを避けられます。

ハーネスピンが導入される前に作成された従来のセッションは、トランスクリプト履歴がある場合、PI にピン留めされたものとして扱われます。構成変更後にその会話を Codex に移行するには、`/new` または `/reset` を使用してください。

`/status` は有効なモデルランタイムを表示します。デフォルトの PI ハーネスは
`Runtime: OpenClaw Pi Default` と表示され、Codex アプリサーバーハーネスは
`Runtime: OpenAI Codex` と表示されます。

## 要件

- バンドルされた `codex` Plugin が利用可能な OpenClaw。
- Codex アプリサーバー `0.125.0` 以降。バンドルされた Plugin は、デフォルトで互換性のある
  Codex アプリサーバーバイナリを管理するため、`PATH` 上のローカル `codex` コマンドは
  通常のハーネス起動に影響しません。
- アプリサーバープロセス、または OpenClaw の Codex 認証ブリッジで Codex 認証が
  利用可能であること。ローカルのアプリサーバー起動では、各
  エージェントに OpenClaw 管理の Codex home と分離された子 `HOME` を使用するため、
  デフォルトでは個人用の `~/.codex` アカウント、Skills、plugins、設定、スレッド状態、
  またはネイティブの `$HOME/.agents/skills` は読み取りません。

この Plugin は、古い、またはバージョンなしのアプリサーバーハンドシェイクをブロックします。これにより、
OpenClaw はテスト済みのプロトコルサーフェス上に維持されます。

ライブおよび Docker スモークテストでは、認証は通常 Codex CLI アカウントまたは
OpenClaw `openai-codex` 認証プロファイルから取得されます。ローカルの stdio アプリサーバー起動では、
アカウントが存在しない場合に `CODEX_API_KEY` / `OPENAI_API_KEY` にフォールバックすることもできます。

## ワークスペースブートストラップファイル

Codex はネイティブのプロジェクトドキュメント検出を通じて `AGENTS.md` 自体を処理します。OpenClaw は
合成 Codex プロジェクトドキュメントファイルを書き込まず、ペルソナファイル用の Codex フォールバック
ファイル名にも依存しません。Codex フォールバックは `AGENTS.md` がない場合にのみ適用されるためです。

OpenClaw ワークスペースの同等性のため、Codex ハーネスはその他のブートストラップ
ファイル（存在する場合は `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、
`BOOTSTRAP.md`、および `MEMORY.md`）を解決し、`thread/start` と `thread/resume` で
Codex 設定指示として転送します。これにより、`AGENTS.md` を重複させずに、
`SOUL.md` と関連するワークスペースのペルソナ/プロファイルコンテキストを可視化できます。

## Codex を他のモデルと併用する

同じエージェントが Codex と非 Codex プロバイダーモデルを自由に切り替える必要がある場合は、
`agentRuntime.id: "codex"` をグローバルに設定しないでください。強制ランタイムは、そのエージェントまたはセッションの
すべての埋め込みターンに適用されます。そのランタイムが強制されている状態で Anthropic モデルを選択した場合、
OpenClaw はそれでも Codex ハーネスを試行し、そのターンを PI 経由で黙ってルーティングするのではなく
失敗して閉じます。

代わりに、次のいずれかの形を使用してください。

- Codex を `agentRuntime.id: "codex"` を持つ専用エージェントに配置する。
- デフォルトエージェントは `agentRuntime.id: "auto"` と PI フォールバックのままにし、通常の混在
  プロバイダー利用に対応する。
- レガシーの `codex/*` 参照は互換性のためにのみ使用する。新しい設定では
  `openai/*` と明示的な Codex ランタイムポリシーを優先してください。

たとえば、次の設定ではデフォルトエージェントを通常の自動選択のままにし、
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

- デフォルトの `main` エージェントは通常のプロバイダーパスと PI 互換フォールバックを使用します。
- `codex` エージェントは Codex アプリサーバーハーネスを使用します。
- `codex` エージェントで Codex が存在しない、またはサポートされていない場合、そのターンは
  PI を静かに使用するのではなく失敗します。

## エージェントコマンドのルーティング

エージェントは「Codex」という語だけでなく、意図に基づいてユーザーリクエストをルーティングする必要があります。

| ユーザーが求めること...                                | エージェントが使用すべきもの...                    |
| ------------------------------------------------------ | ------------------------------------------------ |
| 「このチャットを Codex にバインドして」                 | `/codex bind`                                    |
| 「Codex スレッド `<id>` をここで再開して」              | `/codex resume <id>`                             |
| 「Codex スレッドを表示して」                           | `/codex threads`                                 |
| 「不正な Codex 実行についてサポートレポートを提出して」 | `/diagnostics [note]`                            |
| 「この添付スレッドについてのみ Codex フィードバックを送って」 | `/codex diagnostics [note]`                      |
| 「ChatGPT/Codex サブスクリプションを Codex ランタイムで使って」 | `openai/*` plus `agentRuntime.id: "codex"`       |
| 「ChatGPT/Codex サブスクリプションを PI 経由で使って」  | `openai-codex/*` model refs                      |
| 「ACP/acpx 経由で Codex を実行して」                    | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「Claude Code/Gemini/OpenCode/Cursor をスレッドで開始して」 | ACP/acpx, not `/codex` and not native sub-agents |

OpenClaw は、ACP が有効で、ディスパッチ可能で、読み込まれたランタイムバックエンドに支えられている場合にのみ、
ACP スポーンガイダンスをエージェントに提示します。ACP が利用できない場合、システムプロンプトと Plugin Skills は
エージェントに ACP ルーティングについて教えるべきではありません。

## Codex 専用デプロイ

すべての埋め込みエージェントターンが Codex を使用することを証明する必要がある場合は、Codex ハーネスを強制します。
明示的な Plugin ランタイムはデフォルトで PI フォールバックなしになるため、
`fallback: "none"` は任意ですが、ドキュメントとして有用なことがよくあります。

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

Codex が強制されている場合、Codex Plugin が無効、アプリサーバーが古すぎる、または
アプリサーバーを開始できないと、OpenClaw は早期に失敗します。ハーネス選択が欠落している場合に
意図的に PI に処理させたいときだけ、`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` を設定してください。

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

通常のセッションコマンドを使用して、エージェントとモデルを切り替えます。`/new` は新しい
OpenClaw セッションを作成し、Codex ハーネスは必要に応じてサイドカーアプリサーバー
スレッドを作成または再開します。`/reset` はそのスレッドの OpenClaw セッションバインドをクリアし、
次のターンで現在の設定から再びハーネスを解決できるようにします。

## モデル検出

デフォルトでは、Codex Plugin はアプリサーバーに利用可能なモデルを問い合わせます。検出が失敗またはタイムアウトした場合、
次のバンドルされたフォールバックカタログを使用します。

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

起動時に Codex のプローブを避け、フォールバックカタログに固定したい場合は、検出を無効化します。

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

デフォルトでは、この Plugin は OpenClaw の管理する Codex バイナリを次の形でローカル起動します。

```bash
codex app-server --listen stdio://
```

管理対象バイナリは `codex` Plugin パッケージとともに配布されます。これにより、アプリサーバーバージョンは、
ローカルにたまたまインストールされている別の Codex CLI ではなく、バンドルされた Plugin に結び付けられます。
別の実行可能ファイルを意図的に実行したい場合にのみ、`appServer.command` を設定してください。

デフォルトでは、OpenClaw はローカル Codex ハーネスセッションを YOLO モードで開始します。
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"` です。これは自律 Heartbeat で使われる、信頼されたローカルオペレーターの姿勢です。
Codex は、回答する人がいないネイティブ承認プロンプトで停止せずに、シェルとネットワークツールを使用できます。

Codex のガーディアンレビュー承認にオプトインするには、`appServer.mode:
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

ガーディアンモードでは、Codex のネイティブ自動レビュー承認パスを使用します。Codex が
サンドボックスから出る、ワークスペース外へ書き込む、またはネットワークアクセスのような権限を追加するよう求めると、
Codex はその承認リクエストを人間のプロンプトではなくネイティブレビュアーへルーティングします。
レビュアーは Codex のリスクフレームワークを適用し、特定のリクエストを承認または拒否します。
YOLO モードより多くのガードレールが必要だが、無人エージェントの進行も必要な場合は Guardian を使用してください。

`guardian` プリセットは `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。
個々のポリシーフィールドは引き続き `mode` を上書きするため、高度なデプロイでは
プリセットと明示的な選択を組み合わせることができます。古い `guardian_subagent` レビュアー値は
互換エイリアスとして引き続き受け付けられますが、新しい設定では
`auto_review` を使用してください。

すでに実行中のアプリサーバーには WebSocket トランスポートを使用します。

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

Stdio アプリサーバー起動は、デフォルトで OpenClaw のプロセス環境を継承しますが、
OpenClaw は Codex アプリサーバーアカウントブリッジを所有し、`CODEX_HOME` と `HOME` の両方を
そのエージェントの OpenClaw 状態配下にあるエージェントごとのディレクトリに設定します。
Codex 独自の skill ローダーは `$CODEX_HOME/skills` と `$HOME/.agents/skills` を読み取るため、
ローカルのアプリサーバー起動では両方の値が分離されます。これにより、Codex ネイティブの Skills、plugins、
設定、アカウント、スレッド状態が、オペレーター個人の Codex CLI home から漏れ込むのではなく、
OpenClaw エージェントにスコープされます。

OpenClaw plugins と OpenClaw skill スナップショットは、引き続き OpenClaw 独自の
Plugin レジストリと skill ローダーを通って流れます。個人用 Codex CLI アセットは流れません。OpenClaw エージェントの
一部にすべき有用な Codex CLI Skills や plugins がある場合は、明示的に棚卸ししてください。

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex 移行プロバイダーは、Skills を現在の OpenClaw エージェントワークスペースにコピーします。
Codex ネイティブの plugins、フック、設定ファイルは、自動的に有効化されるのではなく、
手動レビュー用に報告またはアーカイブされます。これらはコマンドを実行したり、MCP サーバーを公開したり、
認証情報を保持したりする可能性があるためです。

認証は次の順序で選択されます。

1. エージェントの明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex home にあるアプリサーバーの既存アカウント。
3. ローカルの stdio アプリサーバー起動でのみ、アプリサーバーアカウントが存在せず OpenAI 認証が
   まだ必要な場合に、`CODEX_API_KEY`、次に `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、
生成された Codex 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、
Gateway レベルの API キーを embeddings や直接 OpenAI モデルで利用可能にしたまま、
ネイティブ Codex アプリサーバーターンが誤って API 経由で課金されるのを防ぎます。
明示的な Codex API キープロファイルとローカル stdio 環境キーのフォールバックは、継承された
子プロセス環境ではなく、アプリサーバーログインを使用します。WebSocket アプリサーバー接続は
Gateway 環境 API キーフォールバックを受け取りません。明示的な認証プロファイルまたは
リモートアプリサーバー自身のアカウントを使用してください。

デプロイで追加の環境分離が必要な場合は、それらの変数を
`appServer.clearEnv` に追加してください。

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

Codex の動的ツールはデフォルトで `native-first` プロファイルを使用します。このモードでは、
OpenClaw は Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません:
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、および
`update_plan`。メッセージング、セッション、メディア、cron、ブラウザー、ノード、gateway、
`heartbeat_respond`、`web_search` などの OpenClaw 統合ツールは引き続き
利用できます。

サポートされるトップレベルの Codex plugin フィールド:

| フィールド                 | デフォルト       | 意味                                                                                      |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Codex app-server に OpenClaw の完全な動的ツールセットを公開するには `"openclaw-compat"` を使用します。 |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server ターンから省略する追加の OpenClaw 動的ツール名。                         |

サポートされる `appServer` フィールド:

| フィールド          | デフォルト                               | 意味                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` は Codex を生成し、`"websocket"` は `url` に接続します。                                                                                                                                                                    |
| `command`           | 管理対象の Codex バイナリ                | stdio トランスポート用の実行可能ファイル。管理対象のバイナリを使用するには未設定のままにし、明示的なオーバーライドの場合にのみ設定してください。                                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio トランスポート用の引数。                                                                                                                                                                                                      |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                                           |
| `authToken`         | 未設定                                   | WebSocket トランスポート用の Bearer トークン。                                                                                                                                                                                       |
| `headers`           | `{}`                                     | 追加の WebSocket ヘッダー。                                                                                                                                                                                                         |
| `clearEnv`          | `[]`                                     | OpenClaw が継承環境を構築した後に、生成された stdio app-server プロセスから削除される追加の環境変数名。`CODEX_HOME` と `HOME` は、ローカル起動時の OpenClaw のエージェントごとの Codex 分離用に予約されています。 |
| `requestTimeoutMs`  | `60000`                                  | app-server コントロールプレーン呼び出しのタイムアウト。                                                                                                                                                                             |
| `mode`              | `"yolo"`                                 | YOLO または guardian レビュー付き実行のプリセット。                                                                                                                                                                                 |
| `approvalPolicy`    | `"never"`                                | スレッドの開始、再開、ターンに送信されるネイティブ Codex 承認ポリシー。                                                                                                                                                            |
| `sandbox`           | `"danger-full-access"`                   | スレッドの開始、再開に送信されるネイティブ Codex サンドボックスモード。                                                                                                                                                            |
| `approvalsReviewer` | `"user"`                                 | Codex にネイティブ承認プロンプトをレビューさせるには `"auto_review"` を使用します。`guardian_subagent` は引き続きレガシーエイリアスです。                                                                                           |
| `serviceTier`       | 未設定                                   | 任意の Codex app-server サービス層: `"fast"`、`"flex"`、または `null`。無効なレガシー値は無視されます。                                                                                                                             |

OpenClaw 所有の動的ツール呼び出しは、`appServer.requestTimeoutMs` とは
独立して制限されます。各 Codex `item/tool/call` リクエストは、
30 秒以内に OpenClaw レスポンスを受け取る必要があります。タイムアウト時には、
OpenClaw はサポートされている場合にツールシグナルを中断し、失敗した動的ツールレスポンスを
Codex に返します。これにより、セッションが `processing` のまま残るのではなく、
ターンを継続できます。

OpenClaw が Codex のターンスコープの app-server リクエストに応答した後、
ハーネスは Codex がネイティブターンを `turn/completed` で完了することも期待します。
その応答後 60 秒間 app-server が沈黙した場合、OpenClaw はベストエフォートで
Codex ターンに割り込み、診断タイムアウトを記録し、OpenClaw セッションレーンを解放します。
これにより、後続のチャットメッセージが古くなったネイティブターンの後ろでキューに残らなくなります。

ローカルテスト用の環境オーバーライドは引き続き利用できます:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、`OPENCLAW_CODEX_APP_SERVER_BIN` は
管理対象のバイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、
一回限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。
繰り返し可能なデプロイでは、Codex ハーネス設定の残りと同じレビュー済みファイルに
plugin の挙動を保持できるため、設定が推奨されます。

## コンピューター使用

コンピューター使用については、専用のセットアップガイドで説明しています:
[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use)。

要約すると、OpenClaw はデスクトップ制御アプリを vendoring せず、
デスクトップ操作自体も実行しません。Codex app-server を準備し、
`computer-use` MCP サーバーが利用可能であることを検証してから、
Codex モードのターン中に Codex がネイティブ MCP ツール呼び出しを処理できるようにします。

Codex marketplace フロー外で TryCua ドライバーに直接アクセスするには、
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` で
`cua-driver mcp` を登録してください。Codex 所有のコンピューター使用と
直接 MCP 登録の違いについては、[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use) を参照してください。

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

セットアップはコマンド画面から確認またはインストールできます。

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

コンピューター操作は macOS 固有であり、Codex MCP サーバーがアプリを制御できるようになる前に、ローカル OS の権限が必要になる場合があります。`computerUse.enabled` が true で MCP サーバーが利用できない場合、Codex モードのターンは、ネイティブのコンピューター操作ツールなしで密かに実行されるのではなく、スレッドが開始される前に失敗します。マーケットプレイスの選択肢、リモートカタログの制限、ステータス理由、トラブルシューティングについては、[Codex コンピューター操作](/ja-JP/plugins/codex-computer-use) を参照してください。

`computerUse.autoInstall` が true の場合、Codex がまだローカルマーケットプレイスを検出していなければ、OpenClaw は `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` から標準のバンドル済み Codex Desktop マーケットプレイスを登録できます。ランタイムまたはコンピューター操作の設定を変更した後は、既存のセッションが古い PI または Codex スレッドのバインディングを保持しないように、`/new` または `/reset` を使用してください。

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

モデル切り替えは OpenClaw の制御下に留まります。OpenClaw セッションが既存の Codex スレッドに接続されている場合、次のターンでは現在選択されている OpenAI モデル、プロバイダー、承認ポリシー、サンドボックス、サービス階層が再び app-server に送信されます。`openai/gpt-5.5` から `openai/gpt-5.2` へ切り替えても、スレッドのバインディングは保持されますが、新しく選択されたモデルで続行するよう Codex に要求します。

## Codex コマンド

バンドル済み Plugin は、`/codex` を認可済みスラッシュコマンドとして登録します。これは汎用であり、OpenClaw テキストコマンドをサポートする任意のチャネルで動作します。

一般的な形式:

- `/codex status` は、ライブ app-server 接続、モデル、アカウント、レート制限、MCP サーバー、スキルを表示します。
- `/codex models` は、ライブ Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex スレッドに接続します。
- `/codex compact` は、接続されたスレッドを compact するよう Codex app-server に要求します。
- `/codex review` は、接続されたスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、接続されたスレッドの Codex 診断フィードバックを送信する前に確認します。
- `/codex computer-use status` は、設定済みの Computer Use Plugin と MCP サーバーを確認します。
- `/codex computer-use install` は、設定済みの Computer Use Plugin をインストールし、MCP サーバーを再読み込みします。
- `/codex account` は、アカウントとレート制限の状態を表示します。
- `/codex mcp` は、Codex app-server MCP サーバーの状態を一覧表示します。
- `/codex skills` は、Codex app-server スキルを一覧表示します。

### 一般的なデバッグワークフロー

Codex に支えられたエージェントが Telegram、Discord、Slack、
または別のチャネルで予期しない動作をした場合は、問題が発生した会話から始めます。

1. `/diagnostics bad tool choice after image upload` または見た内容を説明する別の短いメモを実行します。
2. 診断リクエストを一度承認します。この承認により、ローカル Gateway 診断 zip が作成され、セッションが Codex ハーネスを使用しているため、関連する Codex フィードバックバンドルも OpenAI サーバーに送信されます。
3. 完了した診断返信をバグレポートまたはサポートスレッドにコピーします。これには、ローカルバンドルパス、プライバシー概要、OpenClaw セッション ID、Codex スレッド ID、および各 Codex スレッドの `Inspect locally` 行が含まれます。
4. 実行を自分でデバッグしたい場合は、出力された `Inspect locally` コマンドをターミナルで実行します。これは `codex resume <thread-id>` のような形式で、ネイティブ Codex スレッドを開くため、会話を調査したり、ローカルで継続したり、Codex が特定のツールや計画を選んだ理由を尋ねたりできます。

現在接続されているスレッドについて、完全な OpenClaw Gateway 診断バンドルなしで Codex フィードバックアップロードだけを特に必要とする場合にのみ、`/codex diagnostics [note]` を使用します。ほとんどのサポートレポートでは、`/diagnostics [note]` の方が適した出発点です。ローカル Gateway の状態と Codex スレッド ID を 1 つの返信で結び付けるためです。完全なプライバシーモデルとグループチャットでの動作については、[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

コア OpenClaw も、一般的な Gateway 診断コマンドとしてオーナー専用の `/diagnostics [note]` を公開しています。その承認プロンプトは機密データの前置きを表示し、[診断エクスポート](/ja-JP/gateway/diagnostics)にリンクし、毎回明示的な exec 承認を通じて `openclaw gateway diagnostics export --json` を要求します。allow-all ルールで診断を承認しないでください。承認後、OpenClaw はローカルバンドルパスとマニフェスト概要を含む貼り付け可能なレポートを送信します。アクティブな OpenClaw セッションが Codex ハーネスを使用している場合、その同じ承認により、関連する Codex フィードバックバンドルを OpenAI サーバーへ送信することも許可されます。承認プロンプトは Codex フィードバックが送信されることを伝えますが、承認前に Codex セッション ID やスレッド ID は一覧表示しません。

グループチャットでオーナーが `/diagnostics` を呼び出した場合、OpenClaw は共有チャネルをきれいに保ちます。グループには短い通知だけが届き、診断の前置き、承認プロンプト、Codex セッション/スレッド ID はプライベート承認ルート経由でオーナーに送信されます。プライベートなオーナールートがない場合、OpenClaw はグループリクエストを拒否し、DM から実行するようオーナーに求めます。

承認された Codex アップロードは Codex app-server の `feedback/upload` を呼び出し、利用可能な場合は一覧表示された各スレッドと生成された Codex サブスレッドのログを含めるよう app-server に要求します。アップロードは Codex の通常のフィードバック経路を通じて OpenAI サーバーへ送信されます。その app-server で Codex フィードバックが無効化されている場合、コマンドは app-server エラーを返します。完了した診断返信には、送信されたスレッドのチャネル、OpenClaw セッション ID、Codex スレッド ID、ローカルの `codex resume <thread-id>` コマンドが一覧表示されます。承認を拒否または無視した場合、OpenClaw はそれらの Codex ID を出力しません。このアップロードはローカル Gateway 診断エクスポートの代替ではありません。

`/codex resume` は、ハーネスが通常のターンで使用するものと同じサイドカー束縛ファイルを書き込みます。次のメッセージで、OpenClaw はその Codex スレッドを再開し、現在選択されている OpenClaw モデルを app-server に渡し、拡張履歴を有効なままにします。

### CLI から Codex スレッドを調査する

問題のある Codex 実行を理解する最速の方法は、多くの場合、ネイティブ Codex スレッドを直接開くことです。

```sh
codex resume <thread-id>
```

チャネル会話でバグに気づき、問題のある Codex セッションを調査したり、ローカルで継続したり、特定のツールや推論の選択をした理由を Codex に尋ねたりしたい場合に使用します。通常、最も簡単な流れは最初に `/diagnostics [note]` を実行することです。承認後、完了したレポートには各 Codex スレッドが一覧表示され、たとえば `codex resume <thread-id>` のような `Inspect locally` コマンドが出力されます。そのコマンドを直接ターミナルにコピーできます。

現在のチャットでは `/codex binding` から、最近の Codex app-server スレッドでは `/codex threads [filter]` からスレッド ID を取得し、同じ `codex resume` コマンドをシェルで実行することもできます。

コマンド面には Codex app-server `0.125.0` 以降が必要です。将来の app-server またはカスタム app-server がその JSON-RPC メソッドを公開していない場合、個々の制御メソッドは `unsupported by this Codex app-server` として報告されます。

## フック境界

Codex ハーネスには 3 つのフック層があります。

| 層                                    | オーナー                 | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin フック                | OpenClaw                 | PI と Codex ハーネス全体での製品/Plugin 互換性。                   |
| Codex app-server 拡張ミドルウェア     | OpenClaw バンドル Plugin | OpenClaw 動的ツール周辺のターンごとのアダプター動作。              |
| Codex ネイティブフック                | Codex                    | Codex 設定からの低レベルの Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、OpenClaw Plugin の動作をルーティングするために、プロジェクトまたはグローバルの Codex `hooks.json` ファイルを使用しません。サポートされているネイティブツールと権限ブリッジでは、OpenClaw は `PreToolUse`、`PostToolUse`、`PermissionRequest`、`Stop` 用にスレッドごとの Codex 設定を注入します。`SessionStart` や `UserPromptSubmit` などのその他の Codex フックは Codex レベルの制御のままであり、v1 契約では OpenClaw Plugin フックとして公開されません。

OpenClaw 動的ツールでは、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、OpenClaw はハーネスアダプター内で自分が所有する Plugin とミドルウェアの動作を発火します。Codex ネイティブツールでは、Codex が正規のツールレコードを所有します。OpenClaw は選択されたイベントをミラーできますが、Codex が app-server またはネイティブフックコールバックを通じてその操作を公開しない限り、ネイティブ Codex スレッドを書き換えることはできません。

Compaction と LLM ライフサイクル投影は、ネイティブ Codex フックコマンドではなく、Codex app-server 通知と OpenClaw アダプター状態に由来します。OpenClaw の `before_compaction`、`after_compaction`、`llm_input`、`llm_output` イベントはアダプターレベルの観測であり、Codex の内部リクエストや Compaction ペイロードをバイト単位で捕捉したものではありません。

Codex ネイティブの `hook/started` および `hook/completed` app-server 通知は、軌跡とデバッグのために `codex_app_server.hook` エージェントイベントとして投影されます。これらは OpenClaw Plugin フックを呼び出しません。

## V1 サポート契約

Codex モードは、下層のモデル呼び出しだけが異なる PI ではありません。Codex はネイティブモデルループのより多くを所有し、OpenClaw はその境界に合わせて Plugin とセッションの面を適応させます。

Codex runtime v1 でサポートされます。

| 面                                            | サポート                                | 理由                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex 経由の OpenAI モデルループ              | サポート                                | Codex app-server が OpenAI ターン、ネイティブスレッド再開、ネイティブツール継続を所有します。                                                                                                        |
| OpenClaw チャネルルーティングと配信           | サポート                                | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャネルはモデル runtime の外側に留まります。                                                                                                  |
| OpenClaw 動的ツール                           | サポート                                | Codex が OpenClaw にこれらのツールの実行を要求するため、OpenClaw は実行経路に留まります。                                                                                                           |
| プロンプトとコンテキスト Plugin               | サポート                                | OpenClaw はプロンプトオーバーレイを構築し、スレッドの開始または再開前にコンテキストを Codex ターンへ投影します。                                                                                     |
| コンテキストエンジンのライフサイクル          | サポート                                | Codex ターンでは、組み立て、取り込みまたはターン後の保守、およびコンテキストエンジン Compaction 協調が実行されます。                                                                                 |
| 動的ツールフック                              | サポート                                | `before_tool_call`、`after_tool_call`、およびツール結果ミドルウェアは、OpenClaw が所有する動的ツールの周辺で実行されます。                                                                            |
| ライフサイクルフック                          | アダプター観測としてサポート            | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は、正直な Codex モードのペイロードで発火します。                                                                      |
| 最終回答の修正ゲート                          | ネイティブフックリレー経由でサポート    | Codex `Stop` は `before_agent_finalize` にリレーされます。`revise` は、最終化前にもう 1 回モデルパスを行うよう Codex に要求します。                                                                   |
| ネイティブ shell、patch、MCP のブロックまたは観測 | ネイティブフックリレー経由でサポート | Codex `PreToolUse` と `PostToolUse` は、Codex app-server `0.125.0` 以降での MCP ペイロードを含む、確定済みのネイティブツール面についてリレーされます。ブロックはサポートされますが、引数の書き換えはサポートされません。 |
| ネイティブ権限ポリシー                        | ネイティブフックリレー経由でサポート    | Codex `PermissionRequest` は、runtime が公開している場合に OpenClaw ポリシー経由でルーティングできます。OpenClaw が判断を返さない場合、Codex は通常の guardian またはユーザー承認経路を続行します。 |
| App-server 軌跡キャプチャ                     | サポート                                | OpenClaw は、app-server に送信したリクエストと受信した app-server 通知を記録します。                                                                                                                 |

Codex runtime v1 ではサポートされません。

| サーフェス                                             | V1 の境界                                                                                                                                     | 今後の方針                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ネイティブツール引数の変更                       | Codex のネイティブなツール実行前フックはブロックできますが、OpenClaw は Codex ネイティブのツール引数を書き換えません。                                               | 置換用ツール入力に対する Codex フック/スキーマ対応が必要です。                            |
| 編集可能な Codex ネイティブのトランスクリプト履歴            | Codex が正規のネイティブスレッド履歴を所有します。OpenClaw はミラーを所有し、将来のコンテキストを投影できますが、サポートされていない内部状態を変更するべきではありません。 | ネイティブスレッドの手術が必要な場合は、明示的な Codex app-server API を追加します。                    |
| Codex ネイティブツールレコード向けの `tool_result_persist` | そのフックは OpenClaw が所有するトランスクリプト書き込みを変換するもので、Codex ネイティブのツールレコードは変換しません。                                                           | 変換済みレコードのミラーは可能ですが、正規の書き換えには Codex の対応が必要です。              |
| リッチなネイティブ Compaction メタデータ                     | OpenClaw は Compaction の開始と完了を監視しますが、安定した保持/削除リスト、トークン差分、またはサマリーペイロードは受け取りません。            | よりリッチな Codex Compaction イベントが必要です。                                                     |
| Compaction 介入                             | 現在の OpenClaw Compaction フックは Codex モードでは通知レベルです。                                                                         | Plugin がネイティブ Compaction を拒否または書き換える必要がある場合は、Codex の Compaction 前後フックを追加します。 |
| バイト単位で一致するモデル API リクエストのキャプチャ             | OpenClaw は app-server のリクエストと通知をキャプチャできますが、Codex コアは最終的な OpenAI API リクエストを内部で構築します。                      | Codex のモデルリクエスト追跡イベントまたはデバッグ API が必要です。                                   |

## ツール、メディア、Compaction

Codex ハーネスは低レベルの埋め込みエージェント実行器だけを変更します。

OpenClaw は引き続きツールリストを構築し、ハーネスから動的なツール結果を受け取ります。テキスト、画像、動画、音楽、TTS、承認、メッセージングツール出力は、通常の OpenClaw 配信パスを通り続けます。

ネイティブフックリレーは意図的に汎用化されていますが、v1 のサポート契約は OpenClaw がテストする Codex ネイティブのツールおよび権限パスに限定されます。Codex ランタイムでは、これには shell、patch、MCP の `PreToolUse`、`PostToolUse`、`PermissionRequest` ペイロードが含まれます。ランタイム契約で名前が付けられるまでは、将来のすべての Codex フックイベントを OpenClaw Plugin サーフェスだと想定しないでください。

`PermissionRequest` について、OpenClaw はポリシーが判断した場合にのみ、明示的な許可または拒否の判断を返します。判断なしの結果は許可ではありません。Codex はそれをフック判断なしとして扱い、自身の guardian またはユーザー承認パスへフォールスルーします。

Codex MCP ツール承認の elicitation は、Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` とマークした場合に OpenClaw の Plugin 承認フローを通してルーティングされます。Codex の `request_user_input` プロンプトは元のチャットへ送り返され、次にキューに入ったフォローアップメッセージが、追加コンテキストとして誘導される代わりにそのネイティブサーバーリクエストへ回答します。その他の MCP elicitation リクエストは引き続き失敗して閉じます。

アクティブ実行キューのステアリングは Codex app-server の `turn/steer` に対応します。デフォルトの `messages.queue.mode: "steer"` では、OpenClaw は設定された静穏時間の間キュー内のチャットメッセージをまとめ、到着順に 1 つの `turn/steer` リクエストとして送信します。レガシーの `queue` モードでは個別の `turn/steer` リクエストを送信します。Codex のレビューターンおよび手動 Compaction ターンでは同一ターンのステアリングが拒否される場合があり、その場合 OpenClaw は選択されたモードでフォールバックが許可されていれば followup queue を使用します。[ステアリングキュー](/ja-JP/concepts/queue-steering)を参照してください。

選択されたモデルが Codex ハーネスを使用する場合、ネイティブスレッドの Compaction は Codex app-server に委譲されます。OpenClaw はチャネル履歴、検索、`/new`、`/reset`、将来のモデルまたはハーネス切り替えのためにトランスクリプトミラーを保持します。ミラーには、ユーザープロンプト、最終アシスタントテキスト、および app-server が出力した場合の軽量な Codex reasoning またはプランレコードが含まれます。現時点では、OpenClaw はネイティブ Compaction の開始および完了シグナルだけを記録します。人間が読める Compaction サマリーや、Compaction 後に Codex が保持したエントリの監査可能なリストはまだ公開していません。

Codex が正規のネイティブスレッドを所有するため、`tool_result_persist` は現在 Codex ネイティブのツール結果レコードを書き換えません。これは OpenClaw が OpenClaw 所有のセッショントランスクリプトのツール結果を書き込む場合にのみ適用されます。

メディア生成に PI は不要です。画像、動画、音楽、PDF、TTS、メディア理解は引き続き、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts` などの対応するプロバイダー/モデル設定を使用します。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** これは新しい設定では想定どおりです。`agentRuntime.id: "codex"` を指定した `openai/gpt-*` モデル（またはレガシーの `codex/*` 参照）を選択し、`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex の代わりに PI を使用する:** `agentRuntime.id: "auto"` は、実行を要求する Codex ハーネスがない場合、互換性バックエンドとして引き続き PI を使用できます。テスト中に Codex の選択を強制するには、`agentRuntime.id: "codex"` を設定してください。強制された Codex ランタイムは、`agentRuntime.fallback: "pi"` を明示的に設定しない限り、PI へフォールバックせず失敗するようになりました。Codex app-server が選択されると、その失敗は追加のフォールバック設定なしで直接表面化します。

**app-server が拒否される:** app-server ハンドシェイクがバージョン `0.125.0` 以降を報告するように Codex をアップグレードしてください。同一バージョンのプレリリースや、`0.125.0-alpha.2` または `0.125.0+custom` のようなビルド接尾辞付きバージョンは、安定版 `0.125.0` プロトコル下限が OpenClaw のテスト対象であるため拒否されます。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にしてください。

**WebSocket トランスポートが即座に失敗する:** `appServer.url`、`authToken`、およびリモート app-server が同じ Codex app-server プロトコルバージョンを話していることを確認してください。

**Codex 以外のモデルが PI を使用する:** そのエージェントに対して `agentRuntime.id: "codex"` を強制した場合、またはレガシーの `codex/*` 参照を選択した場合を除き、これは想定どおりです。プレーンな `openai/gpt-*` およびその他のプロバイダー参照は、`auto` モードでは通常のプロバイダーパスに留まります。`agentRuntime.id: "codex"` を強制する場合、そのエージェントのすべての埋め込みターンは Codex がサポートする OpenAI モデルである必要があります。

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
