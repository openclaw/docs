---
read_when:
    - 同梱の Codex アプリサーバーハーネスを使用したい場合
    - Codex ハーネス設定の例が必要です
    - Codex のみのデプロイでは、PI にフォールバックするのではなく失敗するようにしたい
summary: 同梱の Codex app-server ハーネスを通じて OpenClaw の埋め込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-05-05T01:48:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76302351e7e162e858dd6e3cffca84b3fd54497dd060104da9f90fe4c1a33f9b
    source_path: plugins/codex-harness.md
    workflow: 16
---

バンドルされた `codex` plugin により、OpenClaw は組み込みの PI ハーネスではなく
Codex アプリサーバー経由で埋め込みエージェントターンを実行できます。

低レベルのエージェントセッションを Codex に所有させたい場合に使用します。対象には、モデル
検出、ネイティブスレッドの再開、ネイティブ Compaction、アプリサーバー実行が含まれます。
OpenClaw は引き続きチャットチャネル、セッションファイル、モデル選択、ツール、
承認、メディア配信、表示されるトランスクリプトミラーを所有します。

ソースチャットターンが Codex ハーネス経由で実行される場合、デプロイで
`messages.visibleReplies` が明示的に設定されていなければ、表示される返信は既定で
OpenClaw の `message` ツールになります。エージェントは Codex ターンを非公開で完了できます。
チャネルに投稿するのは `message(action="send")` を呼び出したときだけです。
直接チャットの最終返信を従来の自動配信パスに維持するには、
`messages.visibleReplies: "automatic"` を設定します。

Codex Heartbeat ターンにも既定で `heartbeat_respond` ツールが付与されるため、
エージェントは最終テキストにその制御フローをエンコードせずに、ウェイクを静かに保つか通知するかを記録できます。

Heartbeat 固有の自発性ガイダンスは、その Heartbeat ターン自体で Codex のコラボレーションモード
developer 指示として送信されます。通常のチャットターンでは、通常の
ランタイムプロンプトに Heartbeat の思想を持ち越すのではなく、Codex Default モードに戻します。

状況を把握したい場合は、
[エージェントランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。短く言うと、
`openai/gpt-5.5` はモデル参照、`codex` はランタイムであり、Telegram、
Discord、Slack、または別のチャネルがコミュニケーション面として残ります。

## クイック設定

「OpenClaw 内の Codex」を求めるほとんどのユーザーには、この経路が適しています。つまり、
ChatGPT/Codex サブスクリプションでサインインし、ネイティブ
Codex アプリサーバーランタイム経由で埋め込みエージェントターンを実行します。モデル参照は引き続き
`openai/gpt-*` として正規のままです。サブスクリプション認証は Codex アカウント/プロファイルから取得され、
`openai-codex/*` モデル接頭辞からではありません。

まだ実行していない場合は、まず Codex OAuth でサインインします。

```bash
openclaw models auth login --provider openai-codex
```

次に、バンドルされた `codex` plugin を有効にし、Codex ランタイムを強制します。

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

ネイティブ Codex ランタイムを意図している場合、`openai-codex/gpt-*` は使用しないでください。この接頭辞は、
明示的な「PI 経由の Codex OAuth」経路です。設定変更は新規または
リセットされたセッションに適用されます。既存のセッションは記録済みのランタイムを保持します。

## この plugin が変更すること

バンドルされた `codex` plugin は、複数の個別機能を提供します。

| 機能                              | 使用方法                                            | 実行内容                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| ネイティブ埋め込みランタイム      | `agentRuntime.id: "codex"`                          | OpenClaw の埋め込みエージェントターンを Codex アプリサーバー経由で実行します。 |
| ネイティブチャット制御コマンド    | `/codex bind`, `/codex resume`, `/codex steer`, ... | メッセージング会話から Codex アプリサーバースレッドをバインドおよび制御します。 |
| Codex アプリサーバープロバイダー/カタログ | `codex` internals, surfaced through the harness     | ランタイムがアプリサーバーモデルを検出して検証できるようにします。            |
| Codex メディア理解パス            | `codex/*` image-model compatibility paths           | 対応する画像理解モデル向けに、境界付き Codex アプリサーバーターンを実行します。 |
| ネイティブフックリレー            | Plugin hooks around Codex-native events             | OpenClaw が対応する Codex ネイティブのツール/最終化イベントを監視またはブロックできるようにします。 |

plugin を有効にすると、これらの機能が利用可能になります。これは次のことを**行いません**。

- すべての OpenAI モデルで Codex を使い始める
- `openai-codex/*` モデル参照をネイティブランタイムに変換する
- ACP/acpx を既定の Codex パスにする
- すでに PI ランタイムを記録している既存セッションをホットスイッチする
- OpenClaw のチャネル配信、セッションファイル、認証プロファイルストレージ、または
  メッセージルーティングを置き換える

同じ plugin は、ネイティブ `/codex` チャット制御コマンド面も所有します。
plugin が有効で、ユーザーがチャットから Codex スレッドをバインド、再開、操作、停止、または調査するよう求めた場合、
エージェントは ACP より `/codex ...` を優先する必要があります。ACP は、ユーザーが ACP/acpx を求めた場合、または ACP
Codex アダプターをテストしている場合の明示的なフォールバックのままです。

ネイティブ Codex ターンは、OpenClaw plugin フックを公開互換レイヤーとして保持します。
これらはプロセス内 OpenClaw フックであり、Codex の `hooks.json` コマンドフックではありません。

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` はミラーされたトランスクリプトレコード向け
- Codex `Stop` リレー経由の `before_agent_finalize`
- `agent_end`

Plugins は、ランタイム非依存のツール結果ミドルウェアも登録できます。これは、
OpenClaw がツールを実行した後、結果が Codex に返される前に OpenClaw の動的ツール結果を書き換えるためのものです。
これは、OpenClaw 所有のトランスクリプト
ツール結果書き込みを変換する公開 `tool_result_persist` plugin フックとは別です。

plugin フックのセマンティクス自体については、[Plugin フック](/ja-JP/plugins/hooks)
および [Plugin ガード動作](/ja-JP/tools/plugin) を参照してください。

ハーネスは既定で無効です。新しい設定では OpenAI モデル参照を
`openai/gpt-*` として正規に保ち、ネイティブアプリサーバー実行を望む場合は
`agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex` を明示的に強制する必要があります。
従来の `codex/*` モデル参照は互換性のために引き続き自動でハーネスを選択しますが、
ランタイムに裏付けられた従来プロバイダー接頭辞は通常のモデル/プロバイダー選択肢として表示されません。

`codex` plugin が有効でも、プライマリモデルがまだ
`openai-codex/*` の場合、`openclaw doctor` は経路を変更せずに警告します。これは意図的です。
`openai-codex/*` は引き続き PI Codex OAuth/サブスクリプションパスであり、
ネイティブアプリサーバー実行は明示的なランタイム選択のままです。

## 経路マップ

設定を変更する前に、この表を使用してください。

| 望ましい動作                                           | モデル参照                 | ランタイム設定                         | 認証/プロファイル経路        | 期待されるステータスラベル     |
| ------------------------------------------------------ | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| ネイティブ Codex ランタイムでの ChatGPT/Codex サブスクリプション | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth または Codex アカウント | `Runtime: OpenAI Codex`        |
| 通常の OpenClaw ランナー経由の OpenAI API              | `openai/gpt-*`             | omitted or `runtime: "pi"`             | OpenAI API キー              | `Runtime: OpenClaw Pi Default` |
| PI 経由の ChatGPT/Codex サブスクリプション             | `openai-codex/gpt-*`       | omitted or `runtime: "pi"`             | OpenAI Codex OAuth provider  | `Runtime: OpenClaw Pi Default` |
| 保守的な自動モードでの混在プロバイダー                 | provider-specific refs     | `agentRuntime.id: "auto"`              | 選択されたプロバイダーごと   | 選択されたランタイムに依存     |
| 明示的な Codex ACP アダプターセッション                | ACP prompt/model dependent | `sessions_spawn` with `runtime: "acp"` | ACP バックエンド認証         | ACP タスク/セッションステータス |

重要な分岐は、プロバイダーとランタイムの違いです。

- `openai-codex/*` は「PI はどのプロバイダー/認証経路を使用するべきか」に答えます。
- `agentRuntime.id: "codex"` は「この埋め込みターンをどのループで実行するべきか」に答えます。
- `/codex ...` は「このチャットはどのネイティブ Codex 会話をバインドまたは制御するべきか」に答えます。
- ACP は「acpx はどの外部ハーネスプロセスを起動するべきか」に答えます。

## 適切なモデル接頭辞を選ぶ

OpenAI ファミリーの経路は接頭辞ごとに固有です。一般的なサブスクリプションと
ネイティブ Codex ランタイムのセットアップでは、`agentRuntime.id: "codex"` とともに `openai/*` を使用します。
`openai-codex/*` は、PI 経由の Codex OAuth を意図している場合にのみ使用します。

| モデル参照                                    | ランタイムパス                             | 使用する場合                                                               |
| --------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenClaw/PI plumbing 経由の OpenAI provider | `OPENAI_API_KEY` による現在の直接 OpenAI Platform API アクセスを使いたい場合。 |
| `openai-codex/gpt-5.5`                        | OpenClaw/PI 経由の OpenAI Codex OAuth      | 既定の PI ランナーで ChatGPT/Codex サブスクリプション認証を使いたい場合。  |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex アプリサーバーハーネス               | ネイティブ Codex 実行で ChatGPT/Codex サブスクリプション認証を使いたい場合。 |

GPT-5.5 は、アカウントで公開されている場合、直接 OpenAI API キー経路と Codex サブスクリプション経路の両方に表示されることがあります。
ネイティブ Codex ランタイムには Codex アプリサーバー
ハーネス付きの `openai/gpt-5.5` を、PI OAuth には `openai-codex/gpt-5.5` を、
直接 API キートラフィックには Codex ランタイム上書きなしの `openai/gpt-5.5` を使用します。

従来の `codex/gpt-*` 参照は、互換エイリアスとして引き続き受け入れられます。Doctor
互換性マイグレーションは、従来のプライマリランタイム参照を正規モデル
参照に書き換え、ランタイムポリシーを別に記録します。一方、フォールバック専用の従来参照は、
ランタイムがエージェントコンテナー全体に対して設定されるため、変更されません。
新しい PI Codex OAuth 設定では `openai-codex/gpt-*` を使用し、新しいネイティブ
アプリサーバーハーネス設定では `openai/gpt-*` に
`agentRuntime.id: "codex"` を組み合わせて使用します。

`agents.defaults.imageModel` も同じ接頭辞分岐に従います。画像理解を OpenAI
Codex OAuth プロバイダーパス経由で実行する必要がある場合は、
`openai-codex/gpt-*` を使用します。画像理解を境界付き Codex アプリサーバーターン経由で実行する必要がある場合は、
`codex/gpt-*` を使用します。Codex アプリサーバーモデルは
画像入力対応を広告している必要があります。テキスト専用 Codex モデルは、メディアターンが
開始する前に失敗します。

現在のセッションの有効なハーネスを確認するには `/status` を使用します。選択が予想外の場合は、
`agents/harness` サブシステムのデバッグログを有効にし、Gateway の構造化された
`agent harness selected` レコードを確認します。そこには、選択されたハーネス ID、選択理由、
ランタイム/フォールバックポリシー、および `auto` モードでは各 plugin 候補のサポート結果が含まれます。

### doctor 警告の意味

`openclaw doctor` は、以下がすべて true の場合に警告します。

- バンドルされた `codex` plugin が有効または許可されている
- エージェントのプライマリモデルが `openai-codex/*`
- そのエージェントの有効なランタイムが `codex` ではない

この警告が存在するのは、ユーザーがしばしば「Codex plugin 有効」は
「ネイティブ Codex アプリサーバーランタイム」を意味すると期待するためです。OpenClaw はその飛躍を行いません。
この警告の意味は次のとおりです。

- PI 経由の ChatGPT/Codex OAuth を意図していた場合、**変更は不要**です。
- ネイティブアプリサーバー実行を意図していた場合は、モデルを `openai/<model>` に変更し、
  `agentRuntime.id: "codex"` を設定します。
- ランタイム変更後も、既存セッションには `/new` または `/reset` が必要です。
  セッションのランタイムピンは固定されるためです。

ハーネス選択はライブセッション制御ではありません。埋め込みターンが実行されると、
OpenClaw は選択されたハーネス ID をそのセッションに記録し、同じセッション ID の後続ターンでもそれを使い続けます。
将来のセッションで別のハーネスを使いたい場合は、`agentRuntime` 設定または
`OPENCLAW_AGENT_RUNTIME` を変更します。既存の会話を PI と Codex の間で切り替える前に、
`/new` または `/reset` を使って新しいセッションを開始します。これにより、1 つのトランスクリプトを
互換性のない 2 つのネイティブセッションシステムで再生することを避けられます。

既存のセッションがハーネスのピン留め前に作成され、トランスクリプト履歴を持っている場合は、PI にピン留めされたものとして扱われます。設定変更後にその会話を Codex にオプトインするには、`/new` または `/reset` を使用します。

`/status` は有効なモデルランタイムを表示します。デフォルトの PI ハーネスは `Runtime: OpenClaw Pi Default` と表示され、Codex アプリサーバーハーネスは `Runtime: OpenAI Codex` と表示されます。

## 要件

- バンドルされた `codex` Plugin が利用可能な OpenClaw。
- Codex アプリサーバー `0.125.0` 以降。バンドルされた Plugin は、デフォルトで互換性のある Codex アプリサーバーバイナリを管理するため、`PATH` 上のローカル `codex` コマンドは通常のハーネス起動に影響しません。
- アプリサーバープロセスまたは OpenClaw の Codex 認証ブリッジで Codex 認証が利用可能であること。ローカルのアプリサーバー起動では、各エージェントに対して OpenClaw 管理の Codex ホームと分離された子 `HOME` を使用するため、デフォルトでは個人の `~/.codex` アカウント、Skills、Plugin、設定、スレッド状態、またはネイティブの `$HOME/.agents/skills` を読み取りません。

Plugin は、古い、またはバージョンなしのアプリサーバーハンドシェイクをブロックします。これにより、OpenClaw はテスト済みのプロトコルサーフェス上に維持されます。

ライブおよび Docker スモークテストでは、認証は通常、Codex CLI アカウントまたは OpenClaw の `openai-codex` 認証プロファイルから取得されます。ローカル stdio アプリサーバー起動では、アカウントが存在しない場合に `CODEX_API_KEY` / `OPENAI_API_KEY` にフォールバックすることもできます。

## ワークスペースブートストラップファイル

Codex は、ネイティブのプロジェクトドキュメント検出を通じて `AGENTS.md` 自体を処理します。OpenClaw は、Codex の合成プロジェクトドキュメントファイルを書き込まず、ペルソナファイル用の Codex フォールバックファイル名にも依存しません。Codex のフォールバックは `AGENTS.md` がない場合にのみ適用されるためです。

OpenClaw のワークスペース整合性のため、Codex ハーネスは他のブートストラップファイル（存在する場合は `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、および `MEMORY.md`）を解決し、`thread/start` と `thread/resume` で Codex 設定指示を通じて転送します。これにより、`AGENTS.md` を複製せずに、`SOUL.md` と関連するワークスペースのペルソナ/プロファイルコンテキストを可視化できます。

## Codex を他のモデルと併用する

同じエージェントが Codex と非 Codex プロバイダーモデルを自由に切り替える必要がある場合は、`agentRuntime.id: "codex"` をグローバルに設定しないでください。強制されたランタイムは、そのエージェントまたはセッションのすべての埋め込みターンに適用されます。そのランタイムが強制されている状態で Anthropic モデルを選択すると、OpenClaw はそれでも Codex ハーネスを試行し、そのターンを PI 経由で静かにルーティングするのではなく、クローズドに失敗します。

代わりに、次のいずれかの形を使用してください。

- `agentRuntime.id: "codex"` を指定した専用エージェントに Codex を置く。
- 通常の混在プロバイダー利用のために、デフォルトエージェントは `agentRuntime.id: "auto"` と PI フォールバックのままにする。
- 互換性のためだけに既存の `codex/*` 参照を使用する。新しい設定では、`openai/*` と明示的な Codex ランタイムポリシーを優先してください。

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

この形では次のようになります。

- デフォルトの `main` エージェントは通常のプロバイダーパスと PI 互換性フォールバックを使用します。
- `codex` エージェントは Codex アプリサーバーハーネスを使用します。
- `codex` エージェントで Codex が欠落している、またはサポートされていない場合、そのターンは PI を静かに使用するのではなく失敗します。

## エージェントコマンドルーティング

エージェントは、「Codex」という単語だけでなく、意図に基づいてユーザーリクエストをルーティングする必要があります。

| ユーザーの依頼内容...                                  | エージェントが使用すべきもの...                     |
| ------------------------------------------------------ | ------------------------------------------------ |
| 「このチャットを Codex にバインドする」                 | `/codex bind`                                    |
| 「Codex スレッド `<id>` をここで再開する」              | `/codex resume <id>`                             |
| 「Codex スレッドを表示する」                           | `/codex threads`                                 |
| 「問題のある Codex 実行のサポートレポートを提出する」   | `/diagnostics [note]`                            |
| 「この添付スレッドについてのみ Codex フィードバックを送信する」 | `/codex diagnostics [note]`                      |
| 「ChatGPT/Codex サブスクリプションを Codex ランタイムで使用する」 | `openai/*` に加えて `agentRuntime.id: "codex"`       |
| 「ChatGPT/Codex サブスクリプションを PI 経由で使用する」 | `openai-codex/*` モデル参照                      |
| 「ACP/acpx 経由で Codex を実行する」                    | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| 「スレッドで Claude Code/Gemini/OpenCode/Cursor を開始する」 | ACP/acpx。`/codex` でもネイティブサブエージェントでもない |

OpenClaw は、ACP が有効で、ディスパッチ可能で、読み込まれたランタイムバックエンドに支えられている場合にのみ、ACP スポーンガイダンスをエージェントに通知します。ACP が利用できない場合、システムプロンプトと Plugin Skills は ACP ルーティングについてエージェントに教えるべきではありません。

## Codex 専用デプロイ

すべての埋め込みエージェントターンが Codex を使用することを証明する必要がある場合は、Codex ハーネスを強制します。明示的な Plugin ランタイムはクローズドに失敗し、PI 経由で静かに再試行されることはありません。

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

Codex が強制されている場合、Codex Plugin が無効、アプリサーバーが古すぎる、またはアプリサーバーを起動できないとき、OpenClaw は早期に失敗します。

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

エージェントとモデルを切り替えるには、通常のセッションコマンドを使用します。`/new` は新しい OpenClaw セッションを作成し、Codex ハーネスは必要に応じてサイドカーアプリサーバースレッドを作成または再開します。`/reset` はそのスレッドの OpenClaw セッションバインディングをクリアし、次のターンで現在の設定からハーネスを再度解決できるようにします。

## モデル検出

デフォルトでは、Codex Plugin は利用可能なモデルをアプリサーバーに問い合わせます。検出が失敗またはタイムアウトした場合は、次のバンドル済みフォールバックカタログを使用します。

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

起動時に Codex のプローブを避け、フォールバックカタログに固定したい場合は、検出を無効にします。

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

デフォルトでは、Plugin は OpenClaw の管理下にある Codex バイナリをローカルで次のように起動します。

```bash
codex app-server --listen stdio://
```

管理対象バイナリは `codex` Plugin パッケージに同梱されています。これにより、アプリサーバーのバージョンは、ローカルにたまたまインストールされている別個の Codex CLI ではなく、バンドルされた Plugin に紐づきます。意図的に別の実行ファイルを実行したい場合にのみ、`appServer.command` を設定してください。

デフォルトでは、OpenClaw はローカル Codex ハーネスセッションを YOLO モードで開始します: `approvalPolicy: "never"`、`approvalsReviewer: "user"`、および `sandbox: "danger-full-access"`。これは自律 Heartbeat に使用される信頼済みローカルオペレーターの姿勢です。Codex は、誰も応答できないネイティブ承認プロンプトで停止することなく、シェルとネットワークツールを使用できます。

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

ガーディアンモードは Codex のネイティブ自動レビュー承認パスを使用します。Codex がサンドボックス外へ出る、ワークスペース外へ書き込む、またはネットワークアクセスのような権限を追加するよう要求した場合、Codex はその承認リクエストを人間のプロンプトではなくネイティブレビュアーへルーティングします。レビュアーは Codex のリスクフレームワークを適用し、その特定のリクエストを承認または拒否します。YOLO モードより多くのガードレールが必要だが、無人エージェントには進捗が必要な場合に Guardian を使用してください。

`guardian` プリセットは `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。個別のポリシーフィールドは引き続き `mode` を上書きするため、高度なデプロイではプリセットと明示的な選択を混在できます。古い `guardian_subagent` レビュアー値は互換性エイリアスとして引き続き受け付けられますが、新しい設定では `auto_review` を使用してください。

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

stdio アプリサーバー起動はデフォルトで OpenClaw のプロセス環境を継承しますが、OpenClaw は Codex アプリサーバーのアカウントブリッジを所有し、`CODEX_HOME` と `HOME` の両方を、そのエージェントの OpenClaw 状態配下にあるエージェントごとのディレクトリに設定します。Codex 自身のスキルローダーは `$CODEX_HOME/skills` と `$HOME/.agents/skills` を読み取るため、ローカルアプリサーバー起動では両方の値が分離されます。これにより、Codex ネイティブの Skills、Plugin、設定、アカウント、スレッド状態は、オペレーター個人の Codex CLI ホームから漏れ込むのではなく、OpenClaw エージェントにスコープされます。

OpenClaw Plugin と OpenClaw スキルスナップショットは、引き続き OpenClaw 自身の Plugin レジストリとスキルローダーを通じて流れます。個人の Codex CLI アセットは流れません。OpenClaw エージェントの一部にすべき有用な Codex CLI Skills または Plugin がある場合は、明示的に棚卸ししてください。

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex 移行プロバイダーは、Skills を現在の OpenClaw エージェントワークスペースにコピーします。Codex ネイティブの Plugin、フック、設定ファイルは、コマンドを実行したり、MCP サーバーを公開したり、認証情報を含んだりする可能性があるため、自動的に有効化されるのではなく、手動レビューのために報告またはアーカイブされます。

認証は次の順序で選択されます。

1. エージェント用の明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex ホーム内にあるアプリサーバーの既存アカウント。
3. ローカル stdio アプリサーバー起動の場合のみ、アプリサーバーアカウントが存在せず、OpenAI 認証がまだ必要なときは、`CODEX_API_KEY`、次に `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出した場合、生成される Codex 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーは埋め込みや直接の OpenAI モデルに使用できるまま、ネイティブ Codex アプリサーバーのターンが誤って API 経由で課金されることを防ぎます。明示的な Codex API キープロファイルとローカル stdio 環境キーのフォールバックは、継承された子プロセス環境ではなく、アプリサーバーログインを使用します。WebSocket アプリサーバー接続は Gateway 環境 API キーフォールバックを受け取りません。明示的な認証プロファイルまたはリモートアプリサーバー自身のアカウントを使用してください。

デプロイで追加の環境分離が必要な場合は、それらの変数を `appServer.clearEnv` に追加してください。

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
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、`update_plan`。メッセージング、セッション、メディア、
cron、ブラウザー、ノード、gateway、`heartbeat_respond`、`web_search` などの OpenClaw 連携ツールは引き続き
利用できます。

サポートされているトップレベルの Codex Plugin フィールド:

| フィールド                 | デフォルト     | 意味                                                                                               |
| -------------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Codex app-server に OpenClaw の動的ツールセット全体を公開するには `"openclaw-compat"` を使用します。 |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server のターンから省略する追加の OpenClaw 動的ツール名。                                  |

サポートされている `appServer` フィールド:

| フィールド          | デフォルト                               | 意味                                                                                                                                                                                                                                    |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` は Codex を生成し、`"websocket"` は `url` に接続します。                                                                                                                                                                        |
| `command`           | 管理対象の Codex バイナリ                | stdio トランスポート用の実行ファイル。管理対象バイナリを使用する場合は未設定のままにします。明示的に上書きする場合にのみ設定します。                                                                                                      |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio トランスポート用の引数。                                                                                                                                                                                                          |
| `url`               | 未設定                                   | WebSocket app-server URL。                                                                                                                                                                                                               |
| `authToken`         | 未設定                                   | WebSocket トランスポート用のBearerトークン。                                                                                                                                                                                            |
| `headers`           | `{}`                                     | 追加の WebSocket ヘッダー。                                                                                                                                                                                                              |
| `clearEnv`          | `[]`                                     | OpenClaw が継承環境を構築した後、生成された stdio app-server プロセスから削除される追加の環境変数名。`CODEX_HOME` と `HOME` は、ローカル起動時の OpenClaw のエージェント単位 Codex 分離用に予約されています。 |
| `requestTimeoutMs`  | `60000`                                  | app-server コントロールプレーン呼び出しのタイムアウト。                                                                                                                                                                                  |
| `mode`              | `"yolo"`                                 | YOLO または guardian レビュー付き実行のプリセット。                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | スレッドの開始、再開、ターンに送信されるネイティブ Codex 承認ポリシー。                                                                                                                                                                  |
| `sandbox`           | `"danger-full-access"`                   | スレッドの開始、再開に送信されるネイティブ Codex サンドボックスモード。                                                                                                                                                                  |
| `approvalsReviewer` | `"user"`                                 | Codex にネイティブ承認プロンプトをレビューさせるには `"auto_review"` を使用します。`guardian_subagent` はレガシーエイリアスのままです。                                                                                                  |
| `serviceTier`       | 未設定                                   | 任意の Codex app-server サービスティア: `"fast"`、`"flex"`、または `null`。無効なレガシー値は無視されます。                                                                                                                              |

OpenClaw 所有の動的ツール呼び出しは、`appServer.requestTimeoutMs` とは独立して制限されます。各 Codex `item/tool/call` リクエストは、
30 秒以内に OpenClaw 応答を受信する必要があります。タイムアウト時、OpenClaw はサポートされている場合はツールシグナルを中止し、
失敗した動的ツール応答を Codex に返すため、セッションを `processing` のまま残す代わりにターンを継続できます。

OpenClaw が Codex のターン範囲 app-server リクエストに応答した後、ハーネスは Codex が `turn/completed` でネイティブターンを完了することも期待します。その応答後に
app-server が 60 秒間沈黙した場合、OpenClaw はベストエフォートで Codex ターンに割り込み、診断タイムアウトを記録し、古いネイティブターンの背後に後続のチャットメッセージがキューされないように
OpenClaw セッションレーンを解放します。

ローカルテスト用の環境上書きは引き続き利用できます:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、`OPENCLAW_CODEX_APP_SERVER_BIN` は管理対象バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、単発のローカルテストには
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。繰り返し可能なデプロイには設定を推奨します。これは、Codex ハーネス設定の残りと同じレビュー済みファイル内に Plugin の動作を保持できるためです。

## コンピューター使用

コンピューター使用については、専用のセットアップガイドで説明しています:
[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use)。

要約すると、OpenClaw はデスクトップ制御アプリをベンダー化せず、デスクトップアクション自体も実行しません。Codex app-server を準備し、
`computer-use` MCP サーバーが利用可能であることを検証してから、Codex モードのターン中に Codex がネイティブ
MCP ツール呼び出しを処理できるようにします。

Codex marketplace フロー外で TryCua ドライバーに直接アクセスするには、
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` で
`cua-driver mcp` を登録します。Codex 所有のコンピューター使用と直接 MCP 登録の違いについては、
[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use) を参照してください。

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

コンピューター使用は macOS 固有であり、Codex MCP サーバーがアプリを制御できるようになる前に、ローカル OS 権限が必要になる場合があります。`computerUse.enabled` が true で MCP
サーバーが利用できない場合、Codex モードのターンは、ネイティブのコンピューター使用ツールなしで黙って実行されるのではなく、スレッド開始前に失敗します。marketplace の選択肢、
リモートカタログの制限、ステータス理由、トラブルシューティングについては、
[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use) を参照してください。

`computerUse.autoInstall` が true の場合、Codex がまだローカル marketplace を検出していなければ、OpenClaw は
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` から
標準のバンドル済み Codex Desktop marketplace を登録できます。ランタイムまたはコンピューター使用の設定を変更した後は、既存のセッションが古い
PI または Codex スレッドバインディングを保持しないように、`/new` または `/reset` を使用してください。

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

モデル切り替えは OpenClaw が制御し続けます。OpenClaw セッションが既存の Codex スレッドにアタッチされている場合、次のターンでは現在選択されている
OpenAI モデル、プロバイダー、承認ポリシー、サンドボックス、サービスティアを app-server に再度送信します。`openai/gpt-5.5` から `openai/gpt-5.2` に切り替えると、スレッドバインディングは保持されますが、新しく選択されたモデルで続行するよう Codex に要求します。

## Codex コマンド

バンドル済み Plugin は、承認済みスラッシュコマンドとして `/codex` を登録します。これは汎用であり、OpenClaw テキストコマンドをサポートする任意のチャネルで動作します。

よく使う形式:

- `/codex status` は、ライブのアプリサーバー接続、モデル、アカウント、レート制限、MCP サーバー、skills を表示します。
- `/codex models` は、ライブの Codex アプリサーバーモデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex スレッドにアタッチします。
- `/codex compact` は、アタッチされたスレッドを圧縮するよう Codex アプリサーバーに要求します。
- `/codex review` は、アタッチされたスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、アタッチされたスレッドの Codex 診断フィードバックを送信する前に確認します。
- `/codex computer-use status` は、設定済みの Computer Use plugin と MCP サーバーを確認します。
- `/codex computer-use install` は、設定済みの Computer Use plugin をインストールし、MCP サーバーを再読み込みします。
- `/codex account` は、アカウントとレート制限の状態を表示します。
- `/codex mcp` は、Codex アプリサーバーの MCP サーバー状態を一覧表示します。
- `/codex skills` は、Codex アプリサーバーの skills を一覧表示します。

Codex が使用量制限の失敗を報告した場合、Codex が提供していれば、OpenClaw は次の
アプリサーバーのリセット時刻を含めます。同じ会話で `/codex account` を使い、
現在のアカウントとレート制限ウィンドウを確認してください。

### 一般的なデバッグワークフロー

Codex バックエンドのエージェントが Telegram、Discord、Slack、
または別のチャネルで予期しない動作をした場合は、問題が発生した会話から始めます。

1. `/diagnostics bad tool choice after image upload`、または見た内容を説明する別の短いメモを実行します。
2. 診断リクエストを一度承認します。この承認によりローカル Gateway 診断 zip が作成され、セッションが Codex ハーネスを使用しているため、関連する Codex フィードバックバンドルも OpenAI サーバーに送信されます。
3. 完了した診断返信をバグレポートまたはサポートスレッドにコピーします。これには、ローカルバンドルパス、プライバシー概要、OpenClaw セッション ID、Codex スレッド ID、各 Codex スレッドの `Inspect locally` 行が含まれます。
4. 実行を自分でデバッグしたい場合は、表示された `Inspect locally` コマンドをターミナルで実行します。これは `codex resume <thread-id>` のような形で、ネイティブ Codex スレッドを開き、会話を調査したり、ローカルで続行したり、特定のツールや計画を選んだ理由を Codex に尋ねたりできます。

完全な OpenClaw Gateway 診断バンドルなしで、現在アタッチされているスレッドの Codex
フィードバックアップロードだけが特に必要な場合にのみ、`/codex diagnostics [note]` を使ってください。ほとんどのサポートレポートでは、`/diagnostics [note]` のほうが適した開始点です。ローカル Gateway の状態と Codex スレッド ID を 1 つの返信に結び付けるためです。完全なプライバシーモデルとグループチャットでの動作については、[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

コア OpenClaw は、一般的な Gateway 診断コマンドとして、所有者専用の `/diagnostics [note]` も公開しています。その承認プロンプトには、機密データの前置き、[診断エクスポート](/ja-JP/gateway/diagnostics)へのリンクが表示され、毎回明示的な exec 承認を通じて `openclaw gateway diagnostics export --json` を要求します。allow-all ルールで診断を承認しないでください。承認後、OpenClaw はローカルバンドルパスとマニフェスト概要を含む貼り付け可能なレポートを送信します。アクティブな OpenClaw セッションが Codex ハーネスを使用している場合、その同じ承認により、関連する Codex フィードバックバンドルを OpenAI サーバーへ送信することも許可されます。承認プロンプトには Codex フィードバックが送信されることが示されますが、承認前に Codex セッション ID やスレッド ID は表示されません。

所有者がグループチャットで `/diagnostics` を呼び出した場合、OpenClaw は共有チャネルを簡潔に保ちます。グループには短い通知だけが送られ、診断の前置き、承認プロンプト、Codex セッション/スレッド ID は、プライベート承認ルートを通じて所有者に送信されます。プライベートな所有者ルートがない場合、OpenClaw はグループリクエストを拒否し、DM から実行するよう所有者に求めます。

承認された Codex アップロードは、Codex アプリサーバーの `feedback/upload` を呼び出し、利用可能な場合は、一覧にある各スレッドと生成された Codex サブスレッドのログを含めるようアプリサーバーに要求します。アップロードは Codex の通常のフィードバック経路を通じて OpenAI サーバーに送信されます。そのアプリサーバーで Codex フィードバックが無効になっている場合、コマンドはアプリサーバーエラーを返します。完了した診断返信には、送信されたスレッドのチャネル、OpenClaw セッション ID、Codex スレッド ID、ローカルの `codex resume <thread-id>` コマンドが一覧表示されます。承認を拒否または無視した場合、OpenClaw はそれらの Codex ID を表示しません。このアップロードは、ローカル Gateway 診断エクスポートを置き換えるものではありません。

`/codex resume` は、ハーネスが通常のターンで使用するものと同じサイドカーのバインディングファイルを書き込みます。次のメッセージで、OpenClaw はその Codex スレッドを再開し、現在選択されている OpenClaw モデルをアプリサーバーに渡し、拡張履歴を有効なままにします。

### CLI から Codex スレッドを調査する

不適切な Codex 実行を理解する最速の方法は、多くの場合、ネイティブ Codex
スレッドを直接開くことです。

```sh
codex resume <thread-id>
```

チャネルの会話でバグに気付き、問題のある Codex セッションを調査したい場合、ローカルで続行したい場合、または特定のツールや推論の選択をした理由を Codex に尋ねたい場合に使います。通常、最も簡単な手順は、先に `/diagnostics [note]` を実行することです。承認後、完了したレポートには各 Codex スレッドが一覧表示され、たとえば `codex resume <thread-id>` のような `Inspect locally` コマンドが出力されます。そのコマンドをターミナルに直接コピーできます。

現在のチャットについては `/codex binding` から、最近の Codex アプリサーバースレッドについては `/codex threads [filter]` からスレッド ID を取得し、シェルで同じ `codex resume` コマンドを実行することもできます。

このコマンドサーフェスには Codex アプリサーバー `0.125.0` 以降が必要です。将来版またはカスタムのアプリサーバーがその JSON-RPC メソッドを公開していない場合、個々の制御メソッドは `unsupported by this Codex app-server` と報告されます。

## フック境界

Codex ハーネスには 3 つのフックレイヤーがあります。

| レイヤー                              | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw plugin フック                | OpenClaw                 | PI と Codex ハーネス全体でのプロダクト/plugin 互換性。              |
| Codex アプリサーバー拡張ミドルウェア | OpenClaw バンドル plugins | OpenClaw 動的ツール周辺のターンごとのアダプター動作。              |
| Codex ネイティブフック               | Codex                    | Codex 設定による低レベルの Codex ライフサイクルとネイティブツールポリシー。 |

OpenClaw は、OpenClaw plugin の動作をルーティングするために、プロジェクトまたはグローバルの Codex `hooks.json` ファイルを使用しません。サポートされているネイティブツールと権限ブリッジについて、OpenClaw は `PreToolUse`、`PostToolUse`、`PermissionRequest`、`Stop` 用のスレッドごとの Codex 設定を注入します。`SessionStart` や `UserPromptSubmit` などの他の Codex フックは Codex レベルの制御のままであり、v1 契約では OpenClaw plugin フックとして公開されません。

OpenClaw 動的ツールでは、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、OpenClaw はハーネスアダプター内で、自身が所有する plugin とミドルウェアの動作を発火します。Codex ネイティブツールでは、Codex が正規のツールレコードを所有します。OpenClaw は選択されたイベントをミラーできますが、Codex がアプリサーバーまたはネイティブフックコールバックを通じてその操作を公開しない限り、ネイティブ Codex スレッドを書き換えることはできません。

Compaction と LLM ライフサイクルの投影は、Codex アプリサーバー通知と OpenClaw アダプター状態に由来し、ネイティブ Codex フックコマンドには由来しません。OpenClaw の `before_compaction`、`after_compaction`、`llm_input`、`llm_output` イベントはアダプターレベルの観測であり、Codex 内部のリクエストまたは Compaction ペイロードをバイト単位でキャプチャしたものではありません。

Codex ネイティブの `hook/started` および `hook/completed` アプリサーバー通知は、軌跡とデバッグのために `codex_app_server.hook` エージェントイベントとして投影されます。これらは OpenClaw plugin フックを呼び出しません。

## V1 サポート契約

Codex モードは、内部のモデル呼び出しだけが異なる PI ではありません。Codex はネイティブモデルループのより多くを所有し、OpenClaw はその境界に合わせて plugin とセッションサーフェスを適応させます。

Codex ランタイム v1 でサポートされるもの:

| サーフェス                                  | サポート                                | 理由                                                                                                                                                                                                  |
| ------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex 経由の OpenAI モデルループ            | サポート                                | Codex アプリサーバーが OpenAI ターン、ネイティブスレッド再開、ネイティブツール継続を所有します。                                                                                                    |
| OpenClaw チャネルルーティングと配信         | サポート                                | Telegram、Discord、Slack、WhatsApp、iMessage、その他のチャネルはモデルランタイムの外側に留まります。                                                                                                 |
| OpenClaw 動的ツール                         | サポート                                | Codex が OpenClaw にこれらのツールの実行を求めるため、OpenClaw は実行経路に留まります。                                                                                                               |
| プロンプトとコンテキスト plugins            | サポート                                | OpenClaw は、スレッドを開始または再開する前に、プロンプトオーバーレイを構築し、コンテキストを Codex ターンに投影します。                                                                            |
| コンテキストエンジンのライフサイクル        | サポート                                | Codex ターンに対して、組み立て、取り込みまたはターン後の保守、コンテキストエンジンの Compaction 調整が実行されます。                                                                                |
| 動的ツールフック                            | サポート                                | `before_tool_call`、`after_tool_call`、ツール結果ミドルウェアは、OpenClaw が所有する動的ツールの周辺で実行されます。                                                                                 |
| ライフサイクルフック                        | アダプター観測としてサポート            | `llm_input`、`llm_output`、`agent_end`、`before_compaction`、`after_compaction` は、正確な Codex モードペイロードで発火します。                                                                        |
| 最終回答の改訂ゲート                        | ネイティブフックリレー経由でサポート    | Codex `Stop` は `before_agent_finalize` にリレーされます。`revise` は、最終化の前にもう一度モデルパスを実行するよう Codex に要求します。                                                              |
| ネイティブシェル、パッチ、MCP のブロックまたは観測 | ネイティブフックリレー経由でサポート    | Codex `PreToolUse` と `PostToolUse` は、Codex アプリサーバー `0.125.0` 以降の MCP ペイロードを含む、確定済みのネイティブツールサーフェスに対してリレーされます。ブロックはサポートされますが、引数の書き換えはサポートされません。 |
| ネイティブ権限ポリシー                      | ネイティブフックリレー経由でサポート    | ランタイムが公開している場合、Codex `PermissionRequest` は OpenClaw ポリシーを通じてルーティングできます。OpenClaw が判断を返さない場合、Codex は通常のガーディアンまたはユーザー承認経路を続行します。 |
| アプリサーバー軌跡キャプチャ                | サポート                                | OpenClaw は、アプリサーバーに送信したリクエストと、受信したアプリサーバー通知を記録します。                                                                                                          |

Codex ランタイム v1 でサポートされないもの:

| サーフェス                                             | V1 の境界                                                                                                                                     | 今後の方向性                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ネイティブツール引数の変更                       | Codex のネイティブ事前ツールフックはブロックできるが、OpenClaw は Codex ネイティブツール引数を書き換えない。                                               | 置換用ツール入力には Codex のフック/スキーマサポートが必要。                            |
| 編集可能な Codex ネイティブのトランスクリプト履歴            | Codex が正規のネイティブスレッド履歴を所有する。OpenClaw はミラーを所有し、将来のコンテキストを投影できるが、未サポートの内部を変更すべきではない。 | ネイティブスレッドの手術が必要な場合は、明示的な Codex app-server API を追加する。                    |
| Codex ネイティブツールレコード用の `tool_result_persist` | そのフックは OpenClaw が所有するトランスクリプト書き込みを変換するものであり、Codex ネイティブツールレコードを変換するものではない。                                                           | 変換済みレコードをミラーできる可能性はあるが、正規の書き換えには Codex のサポートが必要。              |
| リッチなネイティブ Compaction メタデータ                     | OpenClaw は Compaction の開始と完了を監視するが、安定した保持/破棄リスト、トークン差分、要約ペイロードは受け取らない。            | よりリッチな Codex Compaction イベントが必要。                                                     |
| Compaction への介入                             | 現在の OpenClaw Compaction フックは Codex モードでは通知レベル。                                                                         | Plugin がネイティブ Compaction を拒否または書き換える必要がある場合は、Codex の Compaction 前後フックを追加する。 |
| バイト単位で一致するモデル API リクエストのキャプチャ             | OpenClaw は app-server のリクエストと通知をキャプチャできるが、Codex コアは最終的な OpenAI API リクエストを内部で構築する。                      | Codex のモデルリクエスト追跡イベントまたはデバッグ API が必要。                                   |

## ツール、メディア、Compaction

Codex ハーネスが変更するのは、低レベルの組み込みエージェント実行器のみ。

OpenClaw は引き続きツールリストを構築し、ハーネスから動的ツール結果を受け取る。テキスト、画像、動画、音楽、TTS、承認、メッセージングツールの出力は、通常の OpenClaw 配信パスを引き続き通る。

ネイティブフックリレーは意図的に汎用化されているが、v1 のサポート契約は OpenClaw がテストする Codex ネイティブのツールおよび権限パスに限定される。Codex ランタイムでは、これに shell、patch、MCP の `PreToolUse`、`PostToolUse`、`PermissionRequest` ペイロードが含まれる。ランタイム契約で名前が付けられるまでは、将来のすべての Codex フックイベントが OpenClaw Plugin サーフェスであると想定しないこと。

`PermissionRequest` について、OpenClaw はポリシーが判断した場合にのみ明示的な許可または拒否の決定を返す。判断なしの結果は許可ではない。Codex はそれをフック判断なしとして扱い、自身のガーディアンまたはユーザー承認パスへフォールスルーする。

Codex MCP ツール承認の elicitation は、Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` としてマークした場合、OpenClaw の Plugin 承認フローを通じてルーティングされる。Codex の `request_user_input` プロンプトは発信元チャットへ送り返され、次にキューされたフォローアップメッセージは追加コンテキストとして誘導されるのではなく、そのネイティブサーバーリクエストへの回答になる。その他の MCP elicitation リクエストは引き続きフェイルクローズする。

アクティブ実行キューの誘導は Codex app-server の `turn/steer` に対応付けられる。デフォルトの `messages.queue.mode: "steer"` では、OpenClaw は設定された静穏時間枠内にキューされたチャットメッセージをまとめ、到着順に 1 つの `turn/steer` リクエストとして送信する。レガシーの `queue` モードは個別の `turn/steer` リクエストを送信する。Codex のレビューターンおよび手動 Compaction ターンは同一ターンの誘導を拒否することがあり、その場合 OpenClaw は選択されたモードがフォールバックを許可していれば followup キューを使用する。[誘導キュー](/ja-JP/concepts/queue-steering)を参照。

選択されたモデルが Codex ハーネスを使用する場合、ネイティブスレッド Compaction は Codex app-server に委任される。OpenClaw はチャネル履歴、検索、`/new`、`/reset`、将来のモデルまたはハーネス切り替えのためにトランスクリプトミラーを保持する。このミラーには、ユーザープロンプト、最終的なアシスタントテキスト、app-server が出力する場合の軽量な Codex 推論または計画レコードが含まれる。現時点で OpenClaw が記録するのは、ネイティブ Compaction の開始および完了シグナルのみ。人間が読める Compaction 要約や、Compaction 後に Codex が保持したエントリの監査可能な一覧はまだ公開していない。

Codex が正規のネイティブスレッドを所有するため、`tool_result_persist` は現在 Codex ネイティブツール結果レコードを書き換えない。これは OpenClaw が OpenClaw 所有のセッショントランスクリプトツール結果を書き込む場合にのみ適用される。

メディア生成に PI は不要。画像、動画、音楽、PDF、TTS、メディア理解は、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts` など、対応するプロバイダー/モデル設定を引き続き使用する。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** 新しい設定ではこれは想定どおり。`agentRuntime.id: "codex"` を指定した `openai/gpt-*` モデル（またはレガシーの `codex/*` 参照）を選択し、`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が `codex` を除外していないか確認する。

**OpenClaw が Codex ではなく PI を使用する:** `agentRuntime.id: "auto"` は、Codex ハーネスが実行を要求しない場合、互換性バックエンドとして引き続き PI を使用できる。テスト中に Codex 選択を強制するには `agentRuntime.id: "codex"` を設定する。強制された Codex ランタイムは、PI にフォールバックする代わりに失敗する。Codex app-server が選択されると、その失敗は直接表面化する。

**app-server が拒否される:** app-server ハンドシェイクがバージョン `0.125.0` 以降を報告するように Codex をアップグレードする。同一バージョンのプレリリースや、`0.125.0-alpha.2` または `0.125.0+custom` のようなビルドサフィックス付きバージョンは拒否される。これは安定版 `0.125.0` のプロトコル下限が OpenClaw のテスト対象だから。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にする。

**WebSocket トランスポートが即座に失敗する:** `appServer.url`、`authToken`、およびリモート app-server が同じ Codex app-server プロトコルバージョンを話すことを確認する。

**非 Codex モデルが PI を使用する:** そのエージェントに `agentRuntime.id: "codex"` を強制した場合、またはレガシーの `codex/*` 参照を選択した場合を除き、これは想定どおり。通常の `openai/gpt-*` およびその他のプロバイダー参照は、`auto` モードでは通常のプロバイダーパスにとどまる。`agentRuntime.id: "codex"` を強制する場合、そのエージェントのすべての組み込みターンは Codex 対応の OpenAI モデルでなければならない。

**Computer Use はインストールされているがツールが実行されない:** 新しいセッションから `/codex computer-use status` を確認する。ツールが `Native hook relay unavailable` を報告する場合は `/new` または `/reset` を使用する。それでも続く場合は、古いネイティブフック登録をクリアするために Gateway を再起動する。`computer-use.list_apps` がタイムアウトする場合は、Codex Computer Use または Codex Desktop を再起動して再試行する。

## 関連

- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [ステータス](/ja-JP/cli/status)
- [Plugin フック](/ja-JP/plugins/hooks)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
