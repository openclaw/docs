---
read_when:
    - バンドルされた Codex app-server ハーネスを使用したい場合
    - Codexハーネスの設定例が必要です
    - Codex のみのデプロイでは、OpenClaw にフォールバックせず失敗するようにしたい
summary: 同梱された Codex app-server ハーネスを通じて OpenClaw 組み込みエージェントのターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-07-05T11:31:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbb6c08e7f44a0f149158f10640d3be0241892d633b8877641579b8693e1fc8d
    source_path: plugins/codex-harness.md
    workflow: 16
---

バンドルされた `codex` Plugin は、組み込みの OpenClaw ハーネスではなく Codex app-server を通じて、埋め込み OpenAI エージェントターンを実行します。Codex は低レベルのエージェントセッションを所有します。ネイティブスレッドの再開、ネイティブツールの継続、ネイティブ Compaction、app-server 実行です。OpenClaw は引き続き、チャットチャネル、セッションファイル、モデル選択、OpenClaw 動的ツール、承認、メディア配信、表示されるトランスクリプトミラーを所有します。

`openai/gpt-5.5` などの正規の OpenAI モデル参照を使用します。レガシー Codex GPT 参照は設定しないでください。OpenAI エージェント認証の順序は `auth.order.openai` に置きます。レガシー Codex 認証プロファイル ID とレガシー Codex 認証順序エントリは、`openclaw doctor --fix` によって修復されます。

OpenClaw サンドボックスがアクティブでない場合、OpenClaw は Codex ネイティブコードモードを有効にして Codex app-server スレッドを開始します（code-mode-only はデフォルトではオフのままです）。そのため、app-server の `item/tool/call` ブリッジを通じてルーティングされる OpenClaw 動的ツールと並んで、ネイティブのワークスペース/コード機能を引き続き利用できます。アクティブな OpenClaw サンドボックスまたは制限付きツールポリシーは、実験的なサンドボックス exec-server パスを明示的に選択しない限り、ネイティブコードモードを完全に無効にします。

この Codex ネイティブ機能は、汎用 OpenClaw 実行向けのオプトイン QuickJS-WASI ランタイムであり、異なる `exec` 入力形状を持つ [OpenClaw コードモード](/ja-JP/reference/code-mode) とは別のものです。より広いモデル/プロバイダー/ランタイムの分離については、[エージェントランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。`openai/gpt-5.5` はモデル参照、`codex` はランタイム、Telegram、Discord、Slack、または別のチャネルは通信サーフェスです。

## 要件

- バンドルされた `codex` Plugin が利用可能な OpenClaw。設定で許可リストを使用している場合は、`plugins.allow` に `codex` を含めます。
- Codex app-server `0.125.0` 以降。Plugin はデフォルトで互換性のあるバイナリを管理するため、`PATH` 上の `codex` コマンドは通常の起動には影響しません。
- `openclaw models auth login --provider openai` による Codex 認証、エージェントの Codex ホームにすでに存在する app-server アカウント、または明示的な Codex API キー認証プロファイル。

認証の優先順位、環境分離、カスタム app-server コマンド、モデル検出、および完全な設定フィールド一覧については、[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference) を参照してください。

## クイックスタート

Codex OAuth でサインインします。

```bash
openclaw models auth login --provider openai
```

バンドルされた `codex` Plugin を有効にし、OpenAI エージェントモデルを選択します。

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

設定で `plugins.allow` を使用している場合は、そこにも `codex` を追加します。

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

Plugin 設定を変更した後は Gateway を再起動します。チャットにすでにセッションがある場合は、次のターンが現在の設定からハーネスを解決するように、先に `/new` または `/reset` を実行します。

## Codex Desktop および CLI とスレッドを共有する

デフォルトの `appServer.homeScope: "agent"` は、各 OpenClaw エージェントをオペレーターのネイティブ Codex 状態から分離します。所有者が Codex Desktop と Codex CLI に表示される同じネイティブスレッドを調べて管理できるようにするには、ユーザー Codex ホームを明示的に選択します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

ユーザーホームモードにはローカル stdio トランスポートが必要です。設定されている場合は `$CODEX_HOME` を使用し、それ以外の場合は `~/.codex` を使用します。これには、そのホームのネイティブ Codex 認証、設定、Plugin、スレッドストアが含まれます。OpenClaw はこの app-server に OpenClaw 認証プロファイルを注入しません。

所有者ターンでは `codex_threads` ツールが使えるようになります。ネイティブスレッドの一覧表示、検索、読み取り、フォーク、名前変更、アーカイブ、復元ができます。スレッドをフォークして OpenClaw で継続します。フォークは現在の OpenClaw セッションにアタッチされ、他のネイティブ Codex クライアントにも表示されたままになります。アーカイブには、そのスレッドが他の場所で閉じられていることの明示的な確認が必要です。

OpenClaw と別の Codex クライアントから同じスレッドを同時に再開または書き込みしないでください。Codex は 1 つの app-server プロセス内のライブ書き込みを調整しますが、独立した Desktop、CLI、OpenClaw プロセス間では調整しません。フォークが安全な共存パスです。

## 設定

| 必要なこと | 設定 | 場所 |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| ハーネスを有効にする | `plugins.entries.codex.enabled: true` | OpenClaw 設定 |
| 許可リスト付きの Plugin インストールを維持する | `plugins.allow` に `codex` を含める | OpenClaw 設定 |
| OpenAI エージェントターンを Codex 経由でルーティングする | `agents.defaults.model` または `agents.list[].model` を `openai/gpt-*` にする | OpenClaw エージェント設定 |
| ChatGPT/Codex OAuth でサインインする | `openclaw models auth login --provider openai` | CLI 認証プロファイル |
| Codex 実行の API キーバックアップを追加する | サブスクリプション認証の後に `auth.order.openai` に列挙された `openai:*` API キープロファイル | CLI 認証プロファイル + OpenClaw 設定 |
| Codex が利用できない場合にフェイルクローズする | プロバイダーまたはモデルの `agentRuntime.id: "codex"` | OpenClaw モデル/プロバイダー設定 |
| 直接の OpenAI API トラフィックを使用する | 通常の OpenAI 認証で、プロバイダーまたはモデルの `agentRuntime.id: "openclaw"` | OpenClaw モデル/プロバイダー設定 |
| app-server の動作を調整する | `plugins.entries.codex.config.appServer.*` | Codex Plugin 設定 |
| ネイティブ Codex Plugin アプリを有効にする | `plugins.entries.codex.config.codexPlugins.*` | Codex Plugin 設定 |
| Codex Computer Use を有効にする | `plugins.entries.codex.config.computerUse.*` | Codex Plugin 設定 |

サブスクリプション優先/API キーバックアップの順序には、`auth.order.openai` を優先します。既存のレガシー Codex 認証プロファイル ID とレガシー Codex 認証順序は doctor 専用のレガシー状態です。新しいレガシー Codex GPT 参照を書き込まないでください。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

上記の両方のプロファイルは、`openai/gpt-*` エージェントターンでは引き続き Codex 経由で実行されます。API キーは認証フォールバックにすぎず、OpenClaw または通常の OpenAI Responses に切り替える要求ではありません。

### Compaction

Codex バックのエージェントでは、`compaction.model` または `compaction.provider` を設定しないでください。Codex はネイティブ app-server スレッド状態を通じて Compaction を行うため、OpenClaw はランタイム時にこれらのローカル要約器オーバーライドを無視し、エージェントが Codex を使用している場合は `openclaw doctor --fix` がそれらを削除します。

Lossless は、Codex ターン周辺のアセンブリ、取り込み、メンテナンスのためのコンテキストエンジンとして引き続きサポートされます。設定は `agents.defaults.compaction.provider` ではなく、`plugins.slots.contextEngine: "lossless-claw"` と `plugins.entries.lossless-claw.config.summaryModel` を通じて行います。Codex がアクティブなランタイムである場合、`openclaw doctor --fix` は古い `compaction.provider: "lossless-claw"` 形状を Lossless コンテキストエンジンスロットへ移行しますが、ネイティブ Codex が引き続き Compaction を所有します。ネイティブ app-server ハーネスは、プロンプト前アセンブリを必要とするコンテキストエンジンをサポートします。`codex-cli` を含む汎用 CLI バックエンドは、そのホスト機能を提供しません。

Codex バックのエージェントでは、`/compact` はバインドされたスレッドでネイティブ Codex app-server Compaction を開始します。OpenClaw は完了を待たず、OpenClaw タイムアウトを課さず、共有 app-server を再起動せず、コンテキストエンジンや公開 OpenAI 要約器へフォールバックしません。ネイティブ Codex スレッドバインディングが欠落しているか古い場合、コマンドは Compaction バックエンドを黙って切り替えるのではなく、フェイルクローズします。

このページの残りでは、デプロイメント形状、フェイルクローズルーティング、ガーディアン承認ポリシー、ネイティブ Codex Plugin、Computer Use について説明します。完全なオプション一覧、デフォルト、列挙値、検出、環境分離、タイムアウト、app-server トランスポートフィールドについては、[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference) を参照してください。

## Codex ランタイムを検証する

Codex を期待しているチャットで `/status` を使用します。Codex バックの OpenAI エージェントターンでは次のように表示されます。

```text
Runtime: OpenAI Codex
```

次に Codex app-server の状態を確認します。

```text
/codex status
/codex models
```

`/codex status` は app-server 接続、アカウント、レート制限、MCP サーバー、Skills を報告します。`/codex models` は、ハーネスとアカウントのライブ Codex app-server カタログを一覧表示します。`/status` が予想外の場合は、[トラブルシューティング](#troubleshooting) を参照してください。

## ルーティングとモデル選択

プロバイダー参照とランタイムポリシーは分けておきます。

- Codex 経由の OpenAI エージェントターンには `openai/gpt-*` を使用します。
- 設定でレガシー Codex GPT 参照を使用しないでください。レガシー参照と古いセッションルートピンを修復するには `openclaw doctor --fix` を実行します。
- `agentRuntime.id: "codex"` は通常の OpenAI 自動モードでは任意ですが、Codex が利用できない場合にデプロイメントをフェイルクローズする必要があるときに便利です。
- `agentRuntime.id: "openclaw"` は、それが意図した動作である場合に、プロバイダーまたはモデルを組み込み OpenClaw ランタイムへオプトインします。
- `/codex ...` は、チャットからネイティブ Codex app-server 会話を制御します。
- ACP/acpx は別の外部ハーネスパスです。ユーザーが ACP/acpx または外部ハーネスアダプターを求めている場合にのみ使用してください。

| ユーザーの意図 | 使用するもの |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 現在のチャットをアタッチする | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]` |
| 既存の Codex スレッドを再開する | `/codex resume <thread-id>` |
| Codex スレッドを一覧表示またはフィルタリングする | `/codex threads [filter]` |
| ネイティブ Codex Plugin を一覧表示する | `/codex plugins list` |
| 設定済みネイティブ Codex Plugin を有効または無効にする | `/codex plugins enable <name>`, `/codex plugins disable <name>` |
| ペアリング済みノード上の既存の Codex CLI セッションをアタッチする | `/codex sessions --host <node> [filter]`, then `/codex resume <session-id> --host <node> --bind here` |
| バインドされたスレッドのモデル、fast-mode、または権限を変更する | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| アクティブなターンを停止または誘導する | `/codex stop`, `/codex steer <text>` |
| 現在のバインディングをデタッチする | `/codex detach`（エイリアス `/codex unbind`） |
| Codex フィードバックのみを送信する | `/codex diagnostics [note]` |
| ACP/acpx タスクを開始する | ACP/acpx セッションコマンド。`/codex` ではありません |

| ユースケース                                         | 設定                                                                   | 検証                                    | 注記                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| ネイティブ Codex ランタイム付き ChatGPT/Codex サブスクリプション | `openai/gpt-*` に加えて有効化済みの `codex` plugin                     | `/status` に `Runtime: OpenAI Codex` が表示される | 推奨パス                              |
| Codex が利用できない場合にフェイルクローズする       | プロバイダーまたはモデルの `agentRuntime.id: "codex"`                  | 埋め込みフォールバックではなくターンが失敗する | Codex 専用デプロイで使用             |
| OpenClaw 経由で直接 OpenAI API キーのトラフィックを流す | プロバイダーまたはモデルの `agentRuntime.id: "openclaw"` と通常の OpenAI 認証 | `/status` に OpenClaw ランタイムが表示される | OpenClaw を意図している場合のみ使用  |
| レガシー設定                                        | レガシー Codex GPT 参照                                                | `openclaw doctor --fix` がそれを書き換える | 新しい設定をこの方法で書かない       |
| ACP/acpx Codex アダプター                            | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP タスク/セッションのステータス       | ネイティブ Codex ハーネスとは別      |

`agents.defaults.imageModel` は同じプレフィックス分割に従います。通常の OpenAI ルートには `openai/gpt-*`
を使用し、画像理解を境界付けられた Codex アプリサーバーのターン経由で実行する必要がある場合のみ
`codex/gpt-*` を使用します。Doctor はレガシー Codex GPT 参照を `openai/gpt-*` に書き換えます。

## デプロイパターン

### 基本的な Codex デプロイ

すべての OpenAI エージェントターンでデフォルトとして Codex を使用する必要がある場合は、
クイックスタート設定を使用します。

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

### 混在プロバイダーのデプロイ

Claude をデフォルトエージェントのままにし、名前付き Codex エージェントを追加します。

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

`main` エージェントは通常のプロバイダーパスを使用し、`codex` エージェントは Codex
アプリサーバーを使用します。

### フェイルクローズ Codex デプロイ

バンドル Plugin が利用可能な場合、`openai/gpt-*` はすでに Codex に解決されます。
明示的なランタイムポリシーを追加して、記述されたフェイルクローズルールにします。

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

Codex が強制されている場合、Codex plugin が無効、アプリサーバーが古すぎる、または
アプリサーバーを起動できないと、OpenClaw は早期に失敗します。

## アプリサーバーポリシー

デフォルトでは、Plugin は OpenClaw 管理の Codex バイナリをローカルで
stdio トランスポートにより起動します。意図的に別の実行ファイルを実行する場合のみ
`appServer.command` を設定します。アプリサーバーがすでに別の場所で実行されている場合のみ、
WebSocket トランスポートを使用します。

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

ローカル stdio アプリサーバーセッションは、信頼されたローカルオペレーターの姿勢をデフォルトとします:
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"`。ローカル Codex の要件でその暗黙の YOLO 姿勢が許可されない場合、
OpenClaw は代わりに許可された guardian 権限を選択します。セッションで OpenClaw サンドボックスが
有効な場合、OpenClaw は Codex ホスト側のサンドボックスに依存せず、そのターンでは
Codex ネイティブ Code Mode、ユーザー MCP サーバー、アプリ支援 Plugin 実行を無効にします。
代わりにシェルアクセスは、通常の exec/process ツールが利用可能な場合、`sandbox_exec` や
`sandbox_process` などの OpenClaw サンドボックス支援の動的ツールを経由します。

サンドボックスのエスケープや追加権限の前に、Codex ネイティブ自動レビューには正規化された
OpenClaw exec モードを使用します。

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

Codex アプリサーバーセッションでは、`tools.exec.mode: "auto"` は Codex
Guardian レビュー済み承認にマッピングされます。通常、ローカル要件でそれらの値が許可される場合は
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および
`sandbox: "workspace-write"` です。`tools.exec.mode: "auto"` では、
OpenClaw はレガシーの安全でない Codex `approvalPolicy: "never"` または
`sandbox: "danger-full-access"` のオーバーライドを保持しません。意図的な承認なし Codex 姿勢には
`tools.exec.mode: "full"` を使用します。レガシーの
`plugins.entries.codex.config.appServer.mode: "guardian"` プリセットは引き続き機能しますが、
`tools.exec.mode: "auto"` が正規化された OpenClaw サーフェスです。

ホスト exec 承認および ACPX 権限とのモードレベルの比較については、
[権限モード](/ja-JP/tools/permission-modes) を参照してください。すべてのアプリサーバーフィールド、認証順序、
環境分離、タイムアウト動作については、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference) を参照してください。

## コマンドと診断

バンドル Plugin は、OpenClaw テキストコマンドをサポートする任意のチャンネルで、
スラッシュコマンドとして `/codex` を登録します。

ネイティブ実行と制御には、owner または `operator.admin` Gateway クライアントが必要です:
スレッドのバインドまたは再開、ターンの送信または停止、モデル、fast-mode、権限状態の変更、
Compaction またはレビュー、バインディングの解除。その他の認可済み送信者は、読み取り専用のステータス、
ヘルプ、アカウント、モデル、スレッド、MCP サーバー、skill、バインディング検査コマンドを保持します。

一般的な形式:

- `/codex status` はアプリサーバー接続、モデル、アカウント、レート制限、MCP サーバー、skills を確認します。
- `/codex models` はライブ Codex アプリサーバーモデルを一覧表示します。
- `/codex threads [filter]` は最近の Codex アプリサーバースレッドを一覧表示します。
- `/codex resume <thread-id>` は現在の OpenClaw セッションを既存の Codex スレッドにアタッチします。
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  は現在のチャットをアタッチします。
- `/codex detach` (または `/codex unbind`) は現在のバインディングを解除します。
- `/codex binding` は現在のバインディングを説明します。
- `/codex stop` はアクティブなターンを停止します。`/codex steer <text>` はそれを誘導します。
- `/codex model <model>`、`/codex fast [on|off|status]`、および
  `/codex permissions [default|yolo|status]` は会話ごとの状態を変更します。
- `/codex compact` は Codex アプリサーバーに、アタッチ済みスレッドの Compaction を依頼します。
- `/codex review` はアタッチ済みスレッドの Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、アタッチ済みスレッドの Codex フィードバックを送信する前に確認します。
- `/codex account` はアカウントとレート制限のステータスを表示します。
- `/codex mcp` は Codex アプリサーバー MCP サーバーのステータスを一覧表示します。
- `/codex skills` は Codex アプリサーバー skills を一覧表示します。
- `/codex plugins list`、`/codex plugins enable <name>`、および
  `/codex plugins disable <name>` は設定済みのネイティブ Codex plugins を管理します。
- `/codex computer-use [status|install]` は Codex Computer Use を管理します。
- `/codex help` は完全なコマンドツリーを一覧表示します。

ほとんどのサポート報告では、バグが発生した会話で `/diagnostics [note]` から開始します。
これは 1 件の Gateway 診断レポートを作成し、Codex ハーネスセッションの場合は、
関連する Codex フィードバックバンドルを送信する承認を求めます。プライバシーモデルとグループチャットの動作については、
[診断エクスポート](/ja-JP/gateway/diagnostics) を参照してください。完全な Gateway 診断バンドルなしで、
現在アタッチされているスレッドの Codex フィードバックアップロードだけを明示的に行いたい場合のみ、
`/codex diagnostics [note]` を使用します。

### Codex スレッドをローカルで検査する

問題のある Codex 実行を検査する最速の方法は、多くの場合、ネイティブ Codex スレッドを直接開くことです。

```bash
codex resume <thread-id>
```

完了した `/diagnostics` の返信、`/codex binding`、または `/codex threads [filter]` から
スレッド ID を取得します。

アップロードの仕組みとランタイムレベルの診断境界については、
[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#codex-feedback-upload) を参照してください。

### 認証順序

デフォルトのエージェントごとのホームでは、認証はこの順序で選択されます。

1. エージェント用の順序付き OpenAI 認証プロファイル。できれば
   `auth.order.openai` の下に配置します。古いレガシー Codex 認証プロファイル ID と
   レガシー Codex 認証順序を移行するには、`openclaw doctor --fix` を実行します。
2. そのエージェントの Codex ホームにあるアプリサーバーの既存アカウント。
3. ローカル stdio アプリサーバー起動の場合のみ、アプリサーバーアカウントが存在せず、OpenAI 認証が
   まだ必要なときに、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、
生成される Codex 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。
これにより、Gateway レベルの API キーは埋め込みや直接 OpenAI モデルで利用可能なままにしつつ、
ネイティブ Codex アプリサーバーのターンが誤って API 経由で課金されることを防ぎます。
明示的な Codex API キープロファイルとローカル stdio env-key フォールバックは、
継承された子プロセス env ではなく、アプリサーバーログインを使用します。WebSocket アプリサーバー接続は
Gateway env API-key フォールバックを受け取りません。明示的な認証プロファイルまたはリモート
アプリサーバー自身のアカウントを使用してください。

サブスクリプションプロファイルが Codex 使用量制限に達した場合、OpenClaw は Codex が報告したときに
リセット時刻を記録し、同じ Codex 実行に対して次の順序付き認証プロファイルを試します。
リセット時刻が過ぎると、選択された `openai/gpt-*` モデルや Codex ランタイムを変更せずに、
サブスクリプションプロファイルは再び適格になります。

ネイティブ Codex plugins が設定されている場合、OpenClaw は Plugin 所有のアプリを Codex スレッドに
公開する前に、接続されたアプリサーバー経由でそれらの plugins をインストールまたは更新します。
`app/list` はアプリ ID、アクセシビリティ、メタデータの信頼できる情報源であり続けますが、
スレッドごとの有効化判断は OpenClaw が所有します。ポリシーで一覧済みのアクセス可能なアプリが許可される場合、
`app/list` が現在そのアプリを無効として報告していても、OpenClaw は
`thread/start.config.apps[appId].enabled = true` を送信します。このパスは未知の ID に対する
アプリインストールを作り出しません。OpenClaw は `plugin/install` で marketplace plugins だけを有効化し、
その後インベントリを更新します。

### 環境分離

ローカル stdio アプリサーバー起動では、OpenClaw は `CODEX_HOME` をエージェントごとのディレクトリに
設定します。これにより、Codex 設定、認証/アカウントファイル、Plugin キャッシュ/データ、
ネイティブスレッド状態は、デフォルトでオペレーター個人の `~/.codex` を読み書きしません。
OpenClaw は通常のプロセス `HOME` を保持します。Codex 実行サブプロセスは引き続きユーザーホームの
設定とトークンを見つけることができ、Codex は共有の `$HOME/.agents/skills` と
`$HOME/.agents/plugins/marketplace.json` エントリを検出する場合があります。
`appServer.homeScope: "user"` の場合、OpenClaw は代わりにネイティブユーザーの Codex ホームと
その既存アカウントを使用し、OpenClaw 認証プロファイルを注入しません。

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

`appServer.clearEnv` は生成された Codex アプリサーバー子プロセスにのみ影響します。
OpenClaw はローカル起動の正規化中に、このリストから `CODEX_HOME` と `HOME` を削除します:
`CODEX_HOME` は選択されたエージェントまたはユーザースコープを指したままになり、`HOME` は
サブプロセスが通常のユーザーホーム状態を使用できるように継承されたままになります。

### 動的ツールと Web 検索

Codex の動的ツールは既定で `searchable` 読み込みになります。OpenClaw は
Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません:
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、`update_plan`、
`tool_call`、`tool_describe`、`tool_search`、`tool_search_code`。メッセージング、メディア、Cron、
ブラウザー、ノード、Gateway、`heartbeat_respond` など、残りのほとんどの
OpenClaw 統合ツールは、`openclaw` 名前空間の Codex ツール検索から利用でき、
初期モデルコンテキストを小さく保ちます。

検索が有効で、管理対象プロバイダーが選択されていない場合、Web 検索は既定で Codex のホスト型
`web_search` ツールを使用します。ネイティブのホスト型検索と
OpenClaw の管理対象 `web_search` 動的ツールは相互排他的であるため、
管理対象検索がネイティブのドメイン制限を迂回することはできません。ホスト型検索が利用できない、
明示的に無効化されている、または選択された管理対象プロバイダーに置き換えられている場合、
OpenClaw は管理対象ツールを使用します。OpenClaw は Codex のスタンドアロン
`web.run` 拡張を無効のままにします。本番 app-server トラフィックが、ユーザー定義の
`web` 名前空間を拒否するためです。`tools.web.search.enabled: false` は
両方のパスを無効化し、ツールが無効化された LLM のみの実行でも同様です。Codex は
`"cached"` を優先指定として扱い、制限のない app-server ターンではライブ外部アクセスに解決します。
ネイティブの `allowedDomains` が設定されている場合、自動の管理対象フォールバックはフェイルクローズし、
許可リストを迂回できないようにします。永続的な有効検索ポリシーの変更では、次のターンの前に
バインドされた Codex スレッドをローテーションします。一時的なターンごとの制限では、
一時的な制限付きスレッドを使用し、後で再開できるように既存のバインドを保持します。

`sessions_yield` とメッセージツールのみのソース返信は、ターン制御コントラクトであるため
直接のままです。`sessions_spawn` は検索可能なままなので、Codex ネイティブの
`spawn_agent` が主要な Codex サブエージェントサーフェスであり続けます。一方で、明示的な
OpenClaw または ACP 委任は引き続き `openclaw` 動的ツール名前空間から利用できます。
Heartbeat コラボレーション手順は、ツールがまだ読み込まれていない場合、Heartbeat ターンを終了する前に
`heartbeat_respond` を検索するよう Codex に指示します。

`codexDynamicToolsLoading: "direct"` は、遅延された動的ツールを検索できないカスタム
Codex app-server に接続する場合、または完全なツールペイロードをデバッグする場合にのみ設定します。

### 設定フィールド

サポートされているトップレベルの Codex Plugin フィールド:

| フィールド                 | 既定           | 意味                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | `"direct"` を使用すると、OpenClaw 動的ツールを初期 Codex ツールコンテキストに直接配置します。 |
| `codexDynamicToolsExclude` | `[]`           | Codex app-server ターンから省略する追加の OpenClaw 動的ツール名。                        |
| `codexPlugins`             | 無効           | 移行済みのソースからインストールされたキュレーション済み Plugin に対する、ネイティブ Codex Plugin/app サポート。 |

サポートされている `appServer` フィールド:

| フィールド                                         | デフォルト                                                | 意味                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` は Codex を起動し、`"websocket"` は `url` に接続します。                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` は Codex の状態を OpenClaw エージェントごとに分離します。`"user"` はネイティブの `$CODEX_HOME` または `~/.codex` を共有し、ネイティブ認証を使用し、所有者専用のスレッド管理を有効にします。ユーザースコープには stdio が必要です。                                                                                                                                                                                               |
| `command`                                     | 管理対象の Codex バイナリ                                   | stdio トランスポート用の実行可能ファイル。管理対象バイナリを使用する場合は未設定のままにし、明示的に上書きする場合にのみ設定します。                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポート用の引数。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                  | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | 未設定                                                  | WebSocket トランスポート用の Bearer トークン。リテラル文字列、または `${CODEX_APP_SERVER_TOKEN}` などの SecretInput を受け付けます。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 追加の WebSocket ヘッダー。ヘッダー値はリテラル文字列、または `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"` などの SecretInput 値を受け付けます。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除される追加の環境変数名。OpenClaw はローカル起動用に、選択された `CODEX_HOME` と継承された `HOME` を保持します。                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Codex のコードモード専用ツールサーフェスを有効にします。OpenClaw の動的ツールは引き続き Codex に登録されるため、ネストされた `tools.*` 呼び出しは app-server の `item/tool/call` ブリッジを通じて返されます。                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | 未設定                                                  | リモート Codex app-server のワークスペースルート。設定すると、OpenClaw は解決済みの OpenClaw ワークスペースからローカルワークスペースルートを推測し、このリモートルート配下で現在の cwd サフィックスを保持し、最終的な app-server cwd のみを Codex に送信します。cwd が解決済みの OpenClaw ワークスペースルートの外にある場合、OpenClaw は Gateway ローカルパスをリモート app-server に送信せず、失敗して閉じます。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server コントロールプレーン呼び出しのタイムアウト。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex がターンを受け入れた後、またはターンスコープの app-server リクエスト後に、OpenClaw が `turn/completed` を待機する間の静かな時間枠。                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw が `turn/completed` を待機する間、ツールへの引き渡し、ネイティブツール完了、ツール後の raw assistant 進捗、raw reasoning 完了、または reasoning 進捗の後に使用される完了アイドルおよび進捗ガード。ツール後の合成が最終 assistant リリース予算より長く正当に静かなままでいられる、信頼済みまたは重いワークロードに使用します。                                |
| `mode`                                        | ローカル Codex 要件で YOLO が許可されない場合を除き `"yolo"` | YOLO または guardian レビュー付き実行のプリセット。`danger-full-access`、`never` 承認、または `user` レビュアーを省略するローカル stdio 要件では、暗黙のデフォルトが guardian になります。                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` または許可された guardian 承認ポリシー       | スレッドの開始、再開、ターンに送信されるネイティブ Codex 承認ポリシー。guardian のデフォルトは、許可されている場合 `"on-request"` を優先します。                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` または許可された guardian サンドボックス  | スレッドの開始、再開に送信されるネイティブ Codex サンドボックスモード。guardian のデフォルトは、許可されている場合 `"workspace-write"` を優先し、それ以外の場合は `"read-only"` を優先します。OpenClaw サンドボックスが有効な場合、`danger-full-access` ターンは OpenClaw サンドボックスの egress 設定から派生したネットワークアクセス付きの Codex `workspace-write` を使用します。                                                                                     |
| `approvalsReviewer`                           | `"user"` または許可された guardian レビュアー               | 許可されている場合は `"auto_review"` を使用して Codex にネイティブ承認プロンプトをレビューさせ、それ以外の場合は `guardian_subagent` または `user` を使用します。`guardian_subagent` はレガシーエイリアスとして残ります。                                                                                                                                                                                                                              |
| `serviceTier`                                 | 未設定                                                  | 任意の Codex app-server サービスティア。`"priority"` は fast-mode ルーティングを有効にし、`"flex"` は flex 処理を要求し、`null` は上書きをクリアし、レガシーの `"fast"` は `"priority"` として受け入れられます。                                                                                                                                                                                                 |
| `networkProxy`                                | 無効                                                   | app-server コマンド用に Codex 権限プロファイルのネットワークを有効にします。OpenClaw は `sandbox` を送信する代わりに、選択された `permissions.<profile>.network` 設定を定義し、`default_permissions` でそれを選択します。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | OpenClaw サンドボックスでバックアップされた Codex 環境を Codex app-server 0.132.0 以降に登録するプレビューのオプトイン。これにより、ネイティブ Codex 実行をアクティブな OpenClaw サンドボックス内で実行できます。                                                                                                                                                                                                         |

`appServer.networkProxy` は Codex サンドボックス契約を変更するため明示的です。
有効にすると、OpenClaw は Codex スレッド設定で `features.network_proxy.enabled`
と `default_permissions` も設定し、生成された権限プロファイルが Codex 管理の
ネットワークを開始できるようにします。デフォルトでは、OpenClaw は
プロファイル本文から衝突耐性のある `openclaw-network-<fingerprint>` プロファイル
名を生成します。安定したローカル名が必要な場合にのみ `profileName` を使用してください。

```json5
{
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
}
```

通常のアプリサーバーランタイムが `danger-full-access` になる場合、`networkProxy` を有効にすると、生成される権限プロファイルにはワークスペース形式のファイルシステムアクセスが使用されます。Codex 管理のネットワーク強制はサンドボックス化されたネットワークであるため、フルアクセスプロファイルではアウトバウンドトラフィックを保護できません。ドメインエントリは `allow` または `deny` を使用します。Unix ソケットエントリは Codex の `allow` または `none` 値を使用します。

### 動的ツール呼び出しタイムアウト

OpenClaw 所有の動的ツール呼び出しは、`appServer.requestTimeoutMs` とは独立して制限されます。Codex の `item/tool/call` リクエストは、デフォルトで 90 秒の OpenClaw ウォッチドッグを使用します。呼び出しごとの正の `timeoutMs` 引数は、その特定のツール予算を延長または短縮し、上限は 600000 ms です。`image_generate` ツールは、ツール呼び出しが独自のタイムアウトを提供しない場合は `agents.defaults.imageGenerationModel.timeoutMs` を使用し、それ以外の場合は 120 秒の画像生成デフォルトを使用します。メディア理解の `image` ツールは、`tools.media.image.timeoutSeconds` または 60 秒のメディアデフォルトを使用します。画像理解では、このタイムアウトはリクエスト自体に適用され、以前の準備作業によって短縮されません。タイムアウト時、OpenClaw はサポートされている場合にツールシグナルを中止し、失敗した動的ツールレスポンスを Codex に返すため、セッションを `processing` のまま残すのではなくターンを継続できます。このウォッチドッグは外側の動的 `item/tool/call` 予算です。プロバイダー固有のリクエストタイムアウトはその呼び出し内で実行され、それぞれ独自のタイムアウトセマンティクスを維持します。

Codex がターンを受け入れた後、および OpenClaw がターンスコープのアプリサーバーリクエストに応答した後、ハーネスは Codex が現在ターンの進行を行い、最終的にネイティブターンを `turn/completed` で完了することを期待します。アプリサーバーが `appServer.turnCompletionIdleTimeoutMs` の間静かになると、OpenClaw はベストエフォートで Codex ターンに割り込み、診断タイムアウトを記録し、古いネイティブターンの背後に後続のチャットメッセージがキューされないように OpenClaw セッションレーンを解放します。同じターンのほとんどの非終端通知は、Codex がターンがまだ生きていることを証明したため、その短いウォッチドッグを解除します。

ツールのハンドオフでは、より長いツール後アイドル予算を使用します。OpenClaw が `item/tool/call` レスポンスを返した後、`commandExecution` などのネイティブツール項目が完了した後、生の `custom_tool_call_output` 完了後、およびツール後の生のアシスタント進行、生の推論完了、または推論進行後です。ガードは設定されている場合は `appServer.postToolRawAssistantCompletionIdleTimeoutMs` を使用し、それ以外の場合はデフォルトで 5 分です。同じ予算は、Codex が次の現在ターンイベントを出力する前のサイレント合成ウィンドウの進行ウォッチドッグも延長します。レート制限更新などのグローバルアプリサーバー通知は、ターンアイドル進行をリセットしません。推論完了、commentary `agentMessage` 完了、およびツール前の生の推論またはアシスタント進行には自動最終返信が続く場合があるため、セッションレーンを即座に解放する代わりにツール後進行返信ガードを使用します。

最終/非commentaryの完了済み `agentMessage` 項目とツール前の生のアシスタント完了のみが、アシスタント出力解放を設定します。その後 Codex が `turn/completed` なしで静かになると、OpenClaw はベストエフォートでネイティブターンに割り込み、セッションレーンを解放します。別のターン監視がその解放競争に勝った場合でも、ネイティブリクエスト、項目、または動的ツール完了がアクティブに残っておらず、アシスタント出力解放がまだ最新の完了済み項目に属し、後続の項目完了がない場合、OpenClaw は完了済みの最終アシスタント項目を受け入れます。これにより、ターンを再生せずに完了済みツール作業後の最終回答を保持できます。部分的なアシスタント差分、古い以前の返信、および空の後続完了は対象になりません。

アシスタント、ツール、アクティブ項目、または副作用の証拠がないターン完了アイドルタイムアウトを含む、再生安全な stdio アプリサーバー障害は、新しいアプリサーバー試行で 1 回再試行されます。安全でないタイムアウトでも、停止したアプリサーバークライアントを廃止し、OpenClaw セッションレーンを解放します。また、自動的に再生する代わりに古いネイティブスレッドバインディングをクリアします。完了監視タイムアウトでは Codex 固有のタイムアウトテキストが表示されます。再生安全なケースではレスポンスが不完全な可能性があると伝え、安全でないケースでは再試行前に現在の状態を確認するようユーザーに伝えます。公開タイムアウト診断には、最後のアプリサーバー通知メソッド、生のアシスタントレスポンス項目 id/type/role、アクティブなリクエスト/項目数、および設定済み監視状態などの構造化フィールドが含まれます。最後の通知が生のアシスタントレスポンス項目の場合、制限付きのアシスタントテキストプレビューも含まれます。生のプロンプトやツール内容は含まれません。

### ローカルテスト環境オーバーライド

- `OPENCLAW_CODEX_APP_SERVER_BIN` は、`appServer.command` が未設定の場合に管理対象バイナリをバイパスします。
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに `plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、単発のローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。再現可能なデプロイでは、Codex ハーネス設定の残りと同じレビュー済みファイルに Plugin の動作を保持できるため、設定が推奨されます。

## ネイティブ Codex Plugin

ネイティブ Codex Plugin サポートは、OpenClaw ハーネスターンと同じ Codex スレッド内で、Codex アプリサーバー自身のアプリおよび Plugin 機能を使用します。OpenClaw は Codex Plugin を合成 `codex_plugin_*` OpenClaw 動的ツールに変換しません。

`codexPlugins` は、ネイティブ Codex ハーネスを選択するセッションにのみ影響します。組み込みハーネス実行、通常の OpenAI プロバイダー実行、ACP 会話バインディング、またはその他のハーネスには影響しません。

最小移行済み設定:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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

スレッドアプリ設定は、OpenClaw が Codex ハーネスセッションを確立するとき、または古い Codex スレッドバインディングを置き換えるときに計算されます。ターンごとには再計算されません。`codexPlugins` を変更した後は、将来の Codex ハーネスセッションが更新済みのアプリセットで開始されるように、`/new`、`/reset` を使用するか、gateway を再起動してください。

移行対象条件、アプリインベントリ、破壊的操作ポリシー、引き出し、ネイティブ Plugin 診断については、[ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins) を参照してください。

OpenAI 側のアプリおよび Plugin アクセスは、サインイン中の Codex アカウントによって制御され、Business および Enterprise/Edu ワークスペースではワークスペースアプリコントロールによっても制御されます。OpenAI のアカウントおよびワークスペース制御の概要については、[ChatGPT プランで Codex を使用する](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) を参照してください。

## Computer Use

Computer Use には独自のセットアップガイドがあります:
[Codex Computer Use](/ja-JP/plugins/codex-computer-use)。

短く言うと、OpenClaw はデスクトップ制御アプリをベンダー提供せず、デスクトップ操作自体も実行しません。Codex アプリサーバーを準備し、`computer-use` MCP サーバーが利用可能であることを確認してから、Codex モードのターン中に Codex がネイティブ MCP ツール呼び出しを所有できるようにします。

## ランタイム境界

Codex ハーネスは、低レベルの組み込みエージェント実行器のみを変更します。

- OpenClaw 動的ツールはサポートされています。Codex は OpenClaw にそれらのツールの実行を依頼するため、OpenClaw は実行パスに残ります。
- Codex ネイティブのシェル、パッチ、MCP、およびネイティブアプリツールは Codex が所有します。OpenClaw はサポートされるリレーを通じて選択されたネイティブイベントを監視またはブロックできますが、ネイティブツール引数を書き換えることはありません。
- Codex はネイティブ Compaction を所有します。OpenClaw はチャネル履歴、検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのためにトランスクリプトミラーを保持しますが、Codex Compaction を OpenClaw またはコンテキストエンジンサマライザーで置き換えることはありません。
- メディア生成、メディア理解、TTS、承認、およびメッセージングツール出力は、対応する OpenClaw プロバイダー/モデル設定を引き続き経由します。
- `tool_result_persist` は、OpenClaw 所有のトランスクリプトツール結果に適用され、Codex ネイティブのツール結果レコードには適用されません。

フックレイヤー、サポートされる V1 サーフェス、ネイティブ権限処理、キュー制御、Codex フィードバックアップロードの仕組み、および Compaction の詳細については、[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime) を参照してください。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されません:** 新しい設定では想定どおりです。`openai/gpt-*` モデルを選択し、`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex の代わりに組み込みハーネスを使用します:** モデル参照が公式 OpenAI プロバイダー上の `openai/gpt-*` であり、Codex Plugin がインストールされ有効になっていることを確認してください。テスト中に厳密な証明が必要な場合は、プロバイダーまたはモデルの `agentRuntime.id: "codex"` を設定してください。強制 Codex ランタイムは OpenClaw にフォールバックする代わりに失敗します。

**OpenAI Codex ランタイムが API キーパスにフォールバックします:** モデル、ランタイム、選択されたプロバイダー、および失敗を示す、秘匿済みの gateway 抜粋を収集してください。影響を受ける共同作業者に、OpenClaw ホストでこの読み取り専用コマンドを実行するよう依頼してください。

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

有用な抜粋には通常、`openai/gpt-5.5` または `openai/gpt-5.4`、`Runtime: OpenAI Codex`、`agentRuntime.id` または `harnessRuntime`、`candidateProvider: "openai"`、および `401`、`Incorrect API key`、または `No API key` の結果が含まれます。修正済みの実行では、プレーンな OpenAI API キー失敗ではなく OpenAI OAuth パスが表示されるはずです。

**レガシー Codex モデル参照設定が残っています:** `openclaw doctor --fix` を実行してください。Doctor はレガシーモデル参照を `openai/*` に書き換え、古いセッションおよびエージェント全体のランタイム固定を削除し、既存の認証プロファイルオーバーライドを保持します。

**アプリサーバーが拒否されます:** Codex アプリサーバー `0.125.0` 以降を使用してください。同一バージョンのプレリリースや `0.125.0-alpha.2` または `0.125.0+custom` などのビルドサフィックス付きバージョンは、OpenClaw が安定版 `0.125.0` プロトコル下限をテストするため拒否されます。

**`/codex status` が接続できません:** バンドルされた `codex` Plugin が有効であること、許可リストが設定されている場合は `plugins.allow` に含まれていること、およびカスタム `appServer.command`、`url`、`authToken`、またはヘッダーが有効であることを確認してください。

**モデル検出が遅いです:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にしてください。[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference#model-discovery) を参照してください。

**WebSocket トランスポートが即座に失敗します:** `appServer.url`、`authToken`、ヘッダー、およびリモートアプリサーバーが同じ Codex アプリサーバープロトコルバージョンを話していることを確認してください。

**ネイティブシェルまたはパッチツールが `Native hook relay
unavailable` でブロックされる:** Codex スレッドが、OpenClaw に登録されなくなったネイティブフックリレー
id をまだ使おうとしています。これはネイティブ Codex フック
トランスポートの問題であり、ACP バックエンド、プロバイダー、GitHub、シェルコマンドの
失敗ではありません。影響を受けているチャットで `/new` または `/reset` を使って新しいセッションを開始し、
無害なコマンドを再試行してください。一度は動作しても次のネイティブツール
呼び出しで再び失敗する場合、`/new` は一時的な回避策としてのみ扱ってください。古いスレッドが破棄され、ネイティブフック登録が
再作成されるように、Codex アプリサーバーまたは
OpenClaw Gateway を再起動した後、プロンプトを新しいセッションにコピーしてください。

**Codex 以外のモデルが組み込みハーネスを使う:** プロバイダー
またはモデルランタイムポリシーが別のハーネスへルーティングしない限り、これは想定どおりです。通常の非 OpenAI
プロバイダー参照は、`auto` モードでは通常のプロバイダーパスのままです。

**Computer Use はインストールされているがツールが実行されない:** 新しいセッションから
`/codex computer-use status` を確認してください。ツールが
`Native hook relay unavailable` を報告する場合は、上記のネイティブフックリレー復旧手順を使ってください。
[Codex Computer Use](/ja-JP/plugins/codex-computer-use#troubleshooting) を参照してください。

## 関連

- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [ネイティブ Codex プラグイン](/ja-JP/plugins/codex-native-plugins)
- [Codex Computer Use](/ja-JP/plugins/codex-computer-use)
- [Agent ランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [OpenAI Codex ヘルプ](https://help.openai.com/en/collections/14937394-codex)
- [Agent ハーネスプラグイン](/ja-JP/plugins/sdk-agent-harness)
- [Plugin フック](/ja-JP/plugins/hooks)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [ステータス](/ja-JP/cli/status)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
