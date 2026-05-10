---
read_when:
    - 同梱の Codex app-server ハーネスを使用したい場合
    - Codex ハーネスの設定例が必要です
    - Codex専用デプロイで、PI にフォールバックするのではなく失敗させたい
summary: 同梱の Codex app-server ハーネス経由で OpenClaw の埋め込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-05-10T19:42:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: a43e58bb97b5216318f8e5a58adb670930d57595f5cc4e85eccb65a9d0d33281
    source_path: plugins/codex-harness.md
    workflow: 16
---

同梱の `codex` Plugin により、OpenClaw は組み込み PI ハーネスではなく
Codex アプリサーバーを通じて、埋め込み OpenAI エージェントターンを実行できます。

低レベルのエージェントセッションを Codex に所有させたい場合は、Codex ハーネスを使用します:
ネイティブなスレッド再開、ネイティブなツール継続、ネイティブな Compaction、
アプリサーバー実行です。OpenClaw は引き続き、チャットチャネル、セッションファイル、モデル選択、
OpenClaw 動的ツール、承認、メディア配信、表示されるトランスクリプトミラーを所有します。

通常のセットアップでは、`openai/gpt-5.5` のような正規の OpenAI モデル参照を使用します。
`openai-codex/gpt-*` モデル参照を設定しないでください。`openai-codex` は Codex OAuth または
Codex API キープロファイル向けの認証プロファイルプロバイダーであり、新しいエージェント設定の
モデルプロバイダープレフィックスではありません。

より広いモデル/プロバイダー/ランタイムの分離については、
[エージェントランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。要点は次のとおりです:
`openai/gpt-5.5` はモデル参照、`codex` はランタイムであり、Telegram、
Discord、Slack、または別のチャネルは通信サーフェスのままです。

## 要件

- 同梱の `codex` Plugin が利用可能な OpenClaw。
- 設定で `plugins.allow` を使用している場合は、`codex` を含めます。
- Codex アプリサーバー `0.125.0` 以降。同梱 Plugin は既定で互換性のある
  Codex アプリサーバーバイナリを管理するため、`PATH` 上のローカル `codex` コマンドは
  通常のハーネス起動に影響しません。
- `openclaw models auth login --provider openai-codex`、エージェントの Codex ホーム内の
  アプリサーバーアカウント、または明示的な Codex API キー認証プロファイルを通じて
  Codex 認証が利用可能であること。

認証の優先順位、環境分離、カスタムアプリサーバーコマンド、モデル検出、
すべての設定フィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference) を参照してください。

## クイックスタート

OpenClaw で Codex を使いたいほとんどのユーザーには、このパスが適しています:
ChatGPT/Codex サブスクリプションでサインインし、同梱の `codex` Plugin を有効化し、
正規の `openai/gpt-*` モデル参照を使用します。

Codex OAuth でサインインします:

```bash
openclaw models auth login --provider openai-codex
```

同梱の `codex` Plugin を有効化し、OpenAI エージェントモデルを選択します:

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
    },
  },
}
```

設定で `plugins.allow` を使用している場合は、そこにも `codex` を追加します:

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

Plugin 設定を変更した後は Gateway を再起動します。既存のチャットにすでに
セッションがある場合は、ランタイム変更をテストする前に `/new` または `/reset` を使い、
次のターンが現在の設定からハーネスを解決するようにします。

## 設定

クイックスタート設定は、Codex ハーネスの最小構成です。Codex ハーネスオプションは
OpenClaw 設定で指定し、CLI は Codex 認証にのみ使用します:

| 目的                                   | 設定する値                                                         | 場所                           |
| -------------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| ハーネスを有効化する                   | `plugins.entries.codex.enabled: true`                              | OpenClaw 設定                  |
| 許可リスト制の Plugin インストールを維持する | `plugins.allow` に `codex` を含める                                | OpenClaw 設定                  |
| OpenAI エージェントターンを Codex 経由にルーティングする | `agents.defaults.model` または `agents.list[].model` を `openai/gpt-*` にする | OpenClaw エージェント設定      |
| Codex OAuth でサインインする           | `openclaw models auth login --provider openai-codex`               | CLI 認証プロファイル           |
| Codex が利用できない場合にフェイルクローズする | プロバイダーまたはモデルの `agentRuntime.id: "codex"`              | OpenClaw モデル/プロバイダー設定 |
| 直接 OpenAI API トラフィックを使用する | 通常の OpenAI 認証とともに、プロバイダーまたはモデルの `agentRuntime.id: "pi"` | OpenClaw モデル/プロバイダー設定 |
| アプリサーバーの挙動を調整する         | `plugins.entries.codex.config.appServer.*`                         | Codex Plugin 設定              |
| ネイティブ Codex Plugin アプリを有効化する | `plugins.entries.codex.config.codexPlugins.*`                      | Codex Plugin 設定              |
| Codex Computer Use を有効化する        | `plugins.entries.codex.config.computerUse.*`                       | Codex Plugin 設定              |

Codex バックエンドの OpenAI エージェントターンには、`openai/gpt-*` モデル参照を使用します。
`openai-codex` は、Codex OAuth と Codex API キープロファイルの認証プロファイルプロバイダー名にすぎません。
新しい `openai-codex/gpt-*` モデル参照を書かないでください。

このページの残りでは、ユーザーが選択する必要のある一般的なバリエーションを扱います:
デプロイ形態、フェイルクローズルーティング、guardian 承認ポリシー、ネイティブ Codex
Plugin、Computer Use です。完全なオプション一覧、既定値、列挙値、検出、環境分離、
タイムアウト、アプリサーバートランスポートフィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference) を参照してください。

## Codex ランタイムを検証する

Codex を想定しているチャットで `/status` を使用します。Codex バックエンドの OpenAI エージェントターンでは
次のように表示されます:

```text
Runtime: OpenAI Codex
```

次に Codex アプリサーバーの状態を確認します:

```text
/codex status
/codex models
```

`/codex status` は、アプリサーバー接続、アカウント、レート制限、MCP サーバー、
Skills を報告します。`/codex models` は、ハーネスとアカウント向けのライブ Codex
アプリサーバーカタログを一覧表示します。`/status` が予期しない場合は、
[トラブルシューティング](#troubleshooting) を参照してください。

## ルーティングとモデル選択

プロバイダー参照とランタイムポリシーは分けて扱います:

- Codex 経由の OpenAI エージェントターンには `openai/gpt-*` を使用します。
- 設定で `openai-codex/gpt-*` を使用しないでください。`openclaw doctor --fix` を実行して、
  レガシー参照と古いセッションルートピンを修復します。
- `agentRuntime.id: "codex"` は通常の OpenAI 自動モードでは任意ですが、
  Codex が利用できない場合にデプロイをフェイルクローズさせたいときに便利です。
- `agentRuntime.id: "pi"` は、意図している場合にプロバイダーまたはモデルを直接 PI の挙動にします。
- `/codex ...` はチャットからネイティブ Codex アプリサーバー会話を制御します。
- ACP/acpx は独立した外部ハーネスパスです。ユーザーが ACP/acpx または外部ハーネスアダプターを
  求めている場合にのみ使用します。

一般的なコマンドルーティング:

| ユーザーの意図                 | 使用するもの                            |
| ------------------------------ | --------------------------------------- |
| 現在のチャットをアタッチする   | `/codex bind [--cwd <path>]`            |
| 既存の Codex スレッドを再開する | `/codex resume <thread-id>`             |
| Codex スレッドを一覧表示または絞り込む | `/codex threads [filter]`               |
| Codex フィードバックのみ送信する | `/codex diagnostics [note]`             |
| ACP/acpx タスクを開始する      | ACP/acpx セッションコマンド（`/codex` ではない） |

| ユースケース                                         | 設定                                                             | 検証                                    | 注記                               |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| ネイティブ Codex ランタイムで ChatGPT/Codex サブスクリプションを使う | `openai/gpt-*` と有効化された `codex` Plugin                     | `/status` に `Runtime: OpenAI Codex` が表示される | 推奨パス                           |
| Codex が利用できない場合にフェイルクローズする       | プロバイダーまたはモデルの `agentRuntime.id: "codex"`            | PI フォールバックではなくターンが失敗する | Codex 専用デプロイで使用           |
| PI 経由の直接 OpenAI API キートラフィック             | プロバイダーまたはモデルの `agentRuntime.id: "pi"` と通常の OpenAI 認証 | `/status` に PI ランタイムが表示される  | PI を意図している場合のみ使用      |
| レガシー設定                                         | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` がそれを書き換える | この方法で新しい設定を書かない     |
| ACP/acpx Codex アダプター                            | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP タスク/セッション状態               | ネイティブ Codex ハーネスとは別    |

`agents.defaults.imageModel` も同じプレフィックス分離に従います。通常の OpenAI ルートには
`openai/gpt-*` を使用し、画像理解を範囲を限定した Codex アプリサーバーターンで実行する必要がある場合にのみ
`codex/gpt-*` を使用します。`openai-codex/gpt-*` は使用しないでください。
`doctor` はそのレガシープレフィックスを `openai/gpt-*` に書き換えます。

## デプロイパターン

### 基本的な Codex デプロイ

すべての OpenAI エージェントターンで Codex を既定で使用する場合は、クイックスタート設定を使用します。

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
    },
  },
}
```

### 混合プロバイダーデプロイ

この形では Claude を既定のエージェントのままにし、名前付き Codex エージェントを追加します:

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
      model: "anthropic/claude-opus-4-6",
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
      },
    ],
  },
}
```

この設定では、`main` エージェントは通常のプロバイダーパスを使用し、
`codex` エージェントは Codex アプリサーバーを使用します。

### フェイルクローズの Codex デプロイ

OpenAI エージェントターンでは、同梱 Plugin が利用可能な場合、`openai/gpt-*` はすでに
Codex に解決されます。明文化されたフェイルクローズルールが必要な場合は、明示的なランタイムポリシーを追加します:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

Codex を強制すると、Codex Plugin が無効、アプリサーバーが古すぎる、
またはアプリサーバーを起動できない場合に、OpenClaw は早期に失敗します。

## アプリサーバーポリシー

既定では、Plugin は OpenClaw が管理する Codex バイナリを、stdio トランスポートでローカルに起動します。
`appServer.command` は、別の実行ファイルを実行したいことが明確な場合にのみ設定します。
アプリサーバーがすでに別の場所で稼働している場合にのみ WebSocket トランスポートを使用します:

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
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

ローカル stdio アプリサーバーセッションの既定値は、信頼済みローカルオペレーターの態勢です:
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"` です。ローカル Codex 要件がその暗黙の YOLO 態勢を許可しない場合、
OpenClaw は代わりに許可された guardian 権限を選択します。

sandbox エスケープや追加権限の前に Codex ネイティブ自動レビューを行いたい場合は、
guardian モードを使用します:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

guardian モードは Codex アプリサーバー承認に展開されます。ローカル要件がそれらの値を許可する場合、
通常は `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および
`sandbox: "workspace-write"` です。

すべてのアプリサーバーフィールド、認証順序、環境分離、検出、タイムアウト動作については、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference) を参照してください。

## コマンドと診断

同梱 Plugin は、OpenClaw テキストコマンドをサポートする任意のチャネルに `/codex` を
スラッシュコマンドとして登録します。

一般的な形式:

- `/codex status` は、app-server の接続性、モデル、アカウント、レート制限、MCP サーバー、Skills を確認します。
- `/codex models` は、稼働中の Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex app-server スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の
  Codex スレッドにアタッチします。
- `/codex compact` は、アタッチされたスレッドをコンパクト化するよう Codex app-server に依頼します。
- `/codex review` は、アタッチされたスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、アタッチされたスレッドについて
  Codex フィードバックを送信する前に確認します。
- `/codex account` は、アカウントとレート制限の状態を表示します。
- `/codex mcp` は、Codex app-server MCP サーバーの状態を一覧表示します。
- `/codex skills` は、Codex app-server の Skills を一覧表示します。

ほとんどのサポート報告では、バグが発生した会話内で `/diagnostics [note]`
から始めてください。これにより Gateway 診断レポートが 1 つ作成され、Codex
ハーネスセッションでは、関連する Codex フィードバックバンドルの送信承認を求めます。
プライバシーモデルとグループチャットの動作については、[診断エクスポート](/ja-JP/gateway/diagnostics)
を参照してください。

完全な Gateway 診断バンドルなしで、現在アタッチされているスレッドの Codex
フィードバックアップロードだけが特に必要な場合にのみ、`/codex diagnostics [note]`
を使用してください。

### Codex スレッドをローカルで調査する

問題のある Codex 実行を調査する最速の方法は、多くの場合、ネイティブの Codex
スレッドを直接開くことです。

```bash
codex resume <thread-id>
```

スレッド ID は、完了した `/diagnostics` の返信、`/codex binding`、または
`/codex threads [filter]` から取得します。

アップロードの仕組みとランタイムレベルの診断境界については、
[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#codex-feedback-upload)を参照してください。

認証は次の順序で選択されます。

1. エージェント用の明示的な OpenClaw Codex 認証プロファイル。
2. そのエージェントの Codex ホームにある app-server の既存アカウント。
3. ローカル stdio app-server 起動の場合のみ、app-server アカウントが存在せず、
   OpenAI 認証がまだ必要なときに、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、生成される Codex 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、
Gateway レベルの API キーは埋め込みや直接の OpenAI モデルには利用可能なまま、
ネイティブ Codex app-server ターンが誤って API 経由で課金されないようにします。
明示的な Codex API キープロファイルとローカル stdio 環境キーのフォールバックは、
継承された子プロセス環境変数ではなく app-server ログインを使用します。WebSocket app-server 接続は
Gateway 環境変数の API キーフォールバックを受け取りません。明示的な認証プロファイルか、
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

Codex 動的ツールの既定は `searchable` ロードです。OpenClaw は、
Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません。
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、`update_plan` が該当します。
メッセージング、セッション、メディア、Cron、ブラウザー、ノード、
Gateway、`heartbeat_respond`、`web_search` など、残りの OpenClaw
統合ツールは、`openclaw` 名前空間の Codex ツール検索から利用でき、
初期モデルコンテキストを小さく保ちます。
`sessions_yield` とメッセージツール専用ソース返信は、ターン制御コントラクトであるため直接のままです。
Heartbeat コラボレーション手順では、ツールがまだロードされていない場合、heartbeat ターンを終了する前に
`heartbeat_respond` を検索するよう Codex に指示します。

`codexDynamicToolsLoading: "direct"` は、遅延動的ツールを検索できないカスタム Codex
app-server に接続する場合、または完全なツールペイロードをデバッグする場合にのみ設定してください。

対応しているトップレベルの Codex Plugin フィールド:

| フィールド                 | 既定値         | 意味                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw 動的ツールを初期 Codex ツールコンテキストに直接入れるには `"direct"` を使用します。 |
| `codexDynamicToolsExclude` | `[]`           | Codex app-server ターンから省略する追加の OpenClaw 動的ツール名。                        |
| `codexPlugins`             | 無効           | 移行済みのソースインストール型キュレーション Plugin に対するネイティブ Codex Plugin/app 対応。 |

対応している `appServer` フィールド:

| フィールド                    | 既定値                                                 | 意味                                                                                                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` は Codex を生成し、`"websocket"` は `url` に接続します。                                                                                                                                                    |
| `command`                     | 管理対象の Codex バイナリ                              | stdio トランスポート用の実行ファイル。管理対象バイナリを使用する場合は未設定のままにし、明示的な上書きの場合にのみ設定します。                                                                                       |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポート用の引数。                                                                                                                                                                                        |
| `url`                         | 未設定                                                 | WebSocket app-server URL。                                                                                                                                                                                            |
| `authToken`                   | 未設定                                                 | WebSocket トランスポート用の Bearer トークン。                                                                                                                                                                        |
| `headers`                     | `{}`                                                   | 追加の WebSocket ヘッダー。                                                                                                                                                                                           |
| `clearEnv`                    | `[]`                                                   | OpenClaw が継承環境を構築した後に、生成された stdio app-server プロセスから削除される追加の環境変数名。`CODEX_HOME` と `HOME` は、ローカル起動時の OpenClaw によるエージェント単位の Codex 分離用に予約されています。 |
| `requestTimeoutMs`            | `60000`                                                | app-server 制御プレーン呼び出しのタイムアウト。                                                                                                                                                                       |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | OpenClaw が `turn/completed` を待機している間の、ターンスコープの Codex app-server リクエスト後の静かな時間枠。遅いツール後処理や状態のみの合成フェーズでは、この値を上げてください。                                  |
| `mode`                        | ローカル Codex 要件が YOLO を許可しない場合を除き `"yolo"` | YOLO または guardian レビュー付き実行のプリセット。`danger-full-access`、`never` 承認、または `user` レビュアーを省略するローカル stdio 要件では、暗黙の既定値は guardian になります。                                |
| `approvalPolicy`              | `"never"` または許可された guardian 承認ポリシー       | スレッド開始/再開/ターンに送信されるネイティブ Codex 承認ポリシー。guardian の既定値は、許可されている場合 `"on-request"` を優先します。                                                                                |
| `sandbox`                     | `"danger-full-access"` または許可された guardian サンドボックス | スレッド開始/再開に送信されるネイティブ Codex サンドボックスモード。guardian の既定値は、許可されている場合 `"workspace-write"` を優先し、それ以外の場合は `"read-only"` を優先します。                                 |
| `approvalsReviewer`           | `"user"` または許可された guardian レビュアー          | 許可されている場合に Codex がネイティブ承認プロンプトをレビューできるようにするには `"auto_review"` を使用し、それ以外の場合は `guardian_subagent` または `user` を使用します。`guardian_subagent` は従来の別名のままです。 |
| `serviceTier`                 | 未設定                                                 | 任意の Codex app-server サービスティア。`"priority"` は高速モードルーティングを有効にし、`"flex"` は flex 処理を要求し、`null` は上書きをクリアし、従来の `"fast"` は `"priority"` として受け入れられます。              |

OpenClaw 所有の動的ツール呼び出しは、`appServer.requestTimeoutMs` とは独立して制限されます。
Codex `item/tool/call` リクエストは、既定で 30 秒の OpenClaw ウォッチドッグを使用します。
正の呼び出し単位の `timeoutMs` 引数は、その特定ツールの予算を延長または短縮します。
`image_generate` ツールは、ツール呼び出しが独自のタイムアウトを指定していない場合、
`agents.defaults.imageGenerationModel.timeoutMs` も使用します。また、メディア理解の
`image` ツールは、`tools.media.image.timeoutSeconds` または 60 秒のメディア既定値を使用します。
動的ツール予算の上限は 600000 ms です。タイムアウト時、OpenClaw はサポートされている場合に
ツールシグナルを中止し、失敗した動的ツール応答を Codex に返します。これにより、セッションを
`processing` のまま残すのではなく、ターンを継続できます。

OpenClaw がターンスコープの Codex app-server リクエストに応答した後、ハーネスは
Codex がネイティブターンを `turn/completed` で終了することも期待します。その応答後に
app-server が `appServer.turnCompletionIdleTimeoutMs` の間静かなままの場合、OpenClaw はベストエフォートで
Codex ターンを中断し、診断タイムアウトを記録し、OpenClaw セッションレーンを解放します。これにより、
後続のチャットメッセージが古いネイティブターンの後ろにキューされなくなります。同じターンの非終端通知は、
`rawResponseItem/completed` を含め、その短いウォッチドッグを解除します。これは Codex がターンがまだ生きていることを証明したためです。
より長い終端ウォッチドッグは、本当に停止したターンを引き続き保護します。タイムアウト診断には、最後の
app-server 通知メソッドと、raw assistant 応答項目の場合は、項目タイプ、ロール、ID、制限付きの
assistant テキストプレビューが含まれます。

ローカルテストでは、環境変数による上書きが引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` は、`appServer.command` が未設定の場合に
管理対象バイナリを迂回します。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、1 回限りのローカルテストには
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。Config は、
Codex ハーネス設定の残りと同じレビュー済みファイル内に Plugin の動作を保持できるため、
再現可能なデプロイでは推奨されます。

## ネイティブ Codex Plugin

ネイティブ Codex Plugin サポートは、OpenClaw ハーネスのターンと同じ Codex スレッド内で、
Codex app-server 自身のアプリ機能と Plugin 機能を使用します。OpenClaw は
Codex Plugin を合成された `codex_plugin_*` OpenClaw 動的ツールには変換しません。

`codexPlugins` は、ネイティブ Codex ハーネスを選択したセッションにのみ影響します。PI 実行、
通常の OpenAI プロバイダー実行、ACP 会話バインディング、その他のハーネスには影響しません。

移行後の最小 Config:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

スレッドのアプリ Config は、OpenClaw が Codex ハーネスセッションを確立するとき、
または古い Codex スレッドバインディングを置き換えるときに計算されます。ターンごとには再計算されません。
`codexPlugins` を変更した後は、将来の Codex ハーネスセッションが更新されたアプリセットで開始されるように、
`/new`、`/reset` を使用するか、Gateway を再起動してください。

移行の適格性、アプリインベントリ、破壊的アクションポリシー、
引き出し、ネイティブ Plugin の診断については、
[ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins) を参照してください。

## コンピューター使用

コンピューター使用については、専用のセットアップガイドで説明しています:
[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use)。

要約すると、OpenClaw はデスクトップ制御アプリをベンダー化せず、
デスクトップアクションを自ら実行しません。Codex app-server を準備し、
`computer-use` MCP サーバーが利用可能であることを検証したうえで、
Codex モードのターン中はネイティブ MCP ツール呼び出しを Codex に所有させます。

## ランタイム境界

Codex ハーネスが変更するのは、低レベルの組み込みエージェント実行器のみです。

- OpenClaw 動的ツールはサポートされています。Codex は OpenClaw にそれらの
  ツールの実行を依頼するため、OpenClaw は実行経路に残ります。
- Codex ネイティブのシェル、パッチ、MCP、ネイティブアプリツールは Codex が所有します。
  OpenClaw は、サポートされているリレーを通じて選択されたネイティブイベントを観測またはブロックできますが、
  ネイティブツール引数を書き換えることはありません。
- Codex はネイティブ Compaction を所有します。OpenClaw は、チャンネル履歴、
  検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのために、
  トランスクリプトのミラーを保持します。
- メディア生成、メディア理解、TTS、承認、メッセージングツール出力は、
  対応する OpenClaw プロバイダー/モデル設定を通じて継続します。
- `tool_result_persist` は、OpenClaw が所有するトランスクリプトのツール結果に適用され、
  Codex ネイティブのツール結果レコードには適用されません。

フックレイヤー、サポートされる V1 サーフェス、ネイティブ権限処理、キュー誘導、
Codex フィードバックアップロードの仕組み、Compaction の詳細については、
[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime) を参照してください。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** 新しい Config では想定どおりです。
`openai/gpt-*` モデルを選択し、`plugins.entries.codex.enabled` を有効にして、
`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく PI を使用する:** モデル参照が公式 OpenAI プロバイダー上の
`openai/gpt-*` であり、Codex Plugin がインストールされ有効になっていることを確認してください。
テスト中に厳密な証明が必要な場合は、プロバイダーまたはモデルの `agentRuntime.id: "codex"` を設定してください。
強制された Codex ランタイムは、PI にフォールバックする代わりに失敗します。

**レガシー `openai-codex/*` Config が残っている:** `openclaw doctor --fix` を実行してください。
Doctor はレガシーモデル参照を `openai/*` に書き換え、古いセッションおよびエージェント全体のランタイムピンを削除し、
既存の auth-profile オーバーライドを保持します。

**app-server が拒否される:** Codex app-server `0.125.0` 以降を使用してください。
`0.125.0-alpha.2` や `0.125.0+custom` などの同一バージョンのプレリリースやビルドサフィックス付きバージョンは、
OpenClaw が安定版 `0.125.0` プロトコル下限を検査するため拒否されます。

**`/codex status` が接続できない:** バンドルされた `codex` Plugin が有効であること、
許可リストが設定されている場合は `plugins.allow` にそれが含まれていること、
およびカスタム `appServer.command`、`url`、`authToken`、またはヘッダーが有効であることを確認してください。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、
検出を無効にしてください。[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference#model-discovery) を参照してください。

**WebSocket トランスポートが即座に失敗する:** `appServer.url`、`authToken`、ヘッダー、
およびリモート app-server が同じ Codex app-server プロトコルバージョンを話すことを確認してください。

**非 Codex モデルが PI を使用する:** プロバイダーまたはモデルのランタイムポリシーが別のハーネスにルーティングしない限り、
これは想定どおりです。通常の非 OpenAI プロバイダー参照は、`auto` モードでは通常のプロバイダー経路に留まります。

**コンピューター使用はインストールされているがツールが実行されない:** 新しいセッションから
`/codex computer-use status` を確認してください。ツールが `Native hook relay unavailable` を報告する場合は、
`/new` または `/reset` を使用してください。それでも続く場合は、Gateway を再起動して古いネイティブフック登録をクリアしてください。
[Codex コンピューター使用](/ja-JP/plugins/codex-computer-use#troubleshooting) を参照してください。

## 関連

- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)
- [Codex コンピューター使用](/ja-JP/plugins/codex-computer-use)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [Plugin フック](/ja-JP/plugins/hooks)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [ステータス](/ja-JP/cli/status)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
