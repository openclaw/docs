---
read_when:
    - 同梱された Codex app-server ハーネスを使用したい
    - Codex ハーネス設定例が必要です
    - Codex のみのデプロイでは、OpenClaw にフォールバックせずに失敗するようにしたい
summary: バンドルされた Codex app-server ハーネスを通じて OpenClaw の埋め込み agent ターンを実行します
title: Codex ハーネス
x-i18n:
    generated_at: "2026-07-04T10:27:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1cf51f87f1ccaab2611926ea6bdba73f53de9a88b44da2395eb5f4c147da188
    source_path: plugins/codex-harness.md
    workflow: 16
---

バンドルされた `codex` Plugin により、OpenClaw は組み込みの OpenClaw ハーネスではなく
Codex app-server を通じて、埋め込み OpenAI エージェントターンを実行できます。

低レベルのエージェントセッションを Codex に所有させたい場合は、Codex ハーネスを使用します:
ネイティブスレッド再開、ネイティブツール継続、ネイティブ Compaction、および
app-server 実行です。OpenClaw は引き続き、チャットチャネル、セッションファイル、モデル
選択、OpenClaw 動的ツール、承認、メディア配信、および表示される
トランスクリプトミラーを所有します。

通常のセットアップでは、`openai/gpt-5.5` などの正規 OpenAI モデル参照を使用します。
レガシー Codex GPT 参照は設定しないでください。OpenAI エージェント認証順序は
`auth.order.openai` の下に置きます。古いレガシー Codex 認証プロファイル ID と
レガシー Codex 認証順序エントリは、`openclaw doctor --fix` によって修復される
レガシー状態です。

OpenClaw サンドボックスが有効でない場合、OpenClaw は Codex ネイティブコードモードを
有効にして Codex app-server スレッドを開始しつつ、code-mode-only はデフォルトで
オフのままにします。これにより、Codex ネイティブワークスペースとコード機能を
利用可能に保ちながら、OpenClaw 動的ツールは app-server `item/tool/call` ブリッジを
通じて継続します。有効な OpenClaw サンドボックス化と制限付きツールポリシーは、
実験的なサンドボックス exec-server パスを明示的に有効化しない限り、ネイティブコードモードを
完全に無効にします。

この Codex ネイティブ機能は、[OpenClaw コードモード](/ja-JP/reference/code-mode) とは別です。
これは、異なる `exec` 入力形状を持つ汎用 OpenClaw 実行向けの、オプトイン QuickJS-WASI
ランタイムです。

より広いモデル/プロバイダー/ランタイムの分離については、
[エージェントランタイム](/ja-JP/concepts/agent-runtimes) から始めてください。短く言えば:
`openai/gpt-5.5` はモデル参照、`codex` はランタイムであり、Telegram、
Discord、Slack、または別のチャネルは通信面のままです。

## 要件

- バンドルされた `codex` Plugin が利用可能な OpenClaw。
- 設定で `plugins.allow` を使用している場合は、`codex` を含めます。
- Codex app-server `0.125.0` 以降。バンドルされた Plugin はデフォルトで互換性のある
  Codex app-server バイナリを管理するため、`PATH` 上のローカル `codex` コマンドは
  通常のハーネス起動に影響しません。
- `openclaw models auth login --provider openai`、エージェントの Codex ホーム内の
  app-server アカウント、または明示的な Codex API キー認証プロファイルを通じて
  Codex 認証を利用可能にしていること。

認証の優先順位、環境分離、カスタム app-server コマンド、モデル
検出、およびすべての設定フィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference) を参照してください。

## クイックスタート

OpenClaw で Codex を使いたいほとんどのユーザーが求めるのはこのパスです: 
ChatGPT/Codex サブスクリプションでサインインし、バンドルされた `codex` Plugin を有効にして、
正規の `openai/gpt-*` モデル参照を使用します。

Codex OAuth でサインインします:

```bash
openclaw models auth login --provider openai
```

バンドルされた `codex` Plugin を有効にし、OpenAI エージェントモデルを選択します:

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
セッションがある場合は、ランタイム変更をテストする前に `/new` または `/reset` を使用し、
次のターンが現在の設定からハーネスを解決するようにします。

## Codex Desktop および CLI とスレッドを共有する

デフォルトの `appServer.homeScope: "agent"` は、各 OpenClaw エージェントを
オペレーターのネイティブ Codex 状態から分離します。OpenClaw に、Codex Desktop と Codex CLI に
表示される同じネイティブスレッドを検査および管理させたい場合は、
ユーザー Codex ホームを明示的に有効化します:

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

ユーザーホームモードは、ローカル stdio トランスポートでのみ利用できます。設定されている場合は
`$CODEX_HOME` を使用し、それ以外の場合は `~/.codex` を使用します。これには、そのホームの
ネイティブ Codex 認証、設定、Plugin、スレッドストアが含まれます。OpenClaw は
この app-server に OpenClaw 認証プロファイルを注入しません。

オーナーのターンでは `codex_threads` ツールを利用できます。これはネイティブスレッドの
一覧表示、検索、読み取り、フォーク、名前変更、アーカイブ、復元を行えます。
OpenClaw でスレッドを継続したい場合は、エージェントにスレッドをフォークするよう依頼します。
フォークは現在の OpenClaw セッションに添付され、他のネイティブ Codex クライアントにも
引き続き表示されます。アーカイブには、そのスレッドが他の場所で閉じられていることの
明示的な確認が必要です。

同じスレッドを OpenClaw と別の Codex クライアントから同時に再開または書き込まないでください。
Codex は 1 つの app-server プロセス内のライブライターを調整しますが、独立した Desktop、CLI、
OpenClaw プロセス間では調整しません。フォークは別の継続を作成するため、安全な共存パスです。

## 設定

クイックスタート設定は、最小限有効な Codex ハーネス設定です。Codex
ハーネスオプションは OpenClaw 設定で指定し、CLI は Codex 認証にのみ使用します:

| 必要なこと                                   | 設定                                                                              | 場所                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| ハーネスを有効にする                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw 設定                    |
| allowlist された Plugin インストールを維持する     | `plugins.allow` に `codex` を含める                                               | OpenClaw 設定                    |
| OpenAI エージェントターンを Codex 経由にルーティングする | `agents.defaults.model` または `agents.list[].model` を `openai/gpt-*` にする               | OpenClaw エージェント設定              |
| ChatGPT/Codex OAuth でサインインする       | `openclaw models auth login --provider openai`                                   | CLI 認証プロファイル                   |
| Codex 実行用の API キーバックアップを追加する      | `auth.order.openai` でサブスクリプション認証の後に `openai:*` API キープロファイルを列挙する | CLI 認証プロファイル + OpenClaw 設定 |
| Codex が利用できない場合に fail closed する  | プロバイダーまたはモデルの `agentRuntime.id: "codex"`                                     | OpenClaw モデル/プロバイダー設定     |
| 直接 OpenAI API トラフィックを使用する          | 通常の OpenAI 認証で、プロバイダーまたはモデルの `agentRuntime.id: "openclaw"`          | OpenClaw モデル/プロバイダー設定     |
| app-server の動作を調整する               | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin 設定                |
| ネイティブ Codex Plugin アプリを有効にする        | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex Plugin 設定                |
| Codex Computer Use を有効にする              | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin 設定                |

Codex バックエンドの OpenAI エージェントターンには `openai/gpt-*` モデル参照を使用します。
サブスクリプション優先/API キーバックアップの順序には `auth.order.openai` を推奨します。
既存のレガシー Codex 認証プロファイル ID とレガシー Codex 認証順序は doctor 専用の
レガシー状態です。新しいレガシー Codex GPT 参照は書き込まないでください。

Codex バックエンドのエージェントに `compaction.model` または `compaction.provider` を
設定しないでください。Codex はネイティブ app-server スレッド状態を通じて Compaction を
行うため、OpenClaw は実行時にそれらのローカル要約器オーバーライドを無視し、
エージェントが Codex を使用している場合は `openclaw doctor --fix` がそれらを削除します。

Lossless は、Codex ターンの周辺でのアセンブリ、取り込み、メンテナンス用の
コンテキストエンジンとして引き続きサポートされます。これは
`agents.defaults.compaction.provider` ではなく、
`plugins.slots.contextEngine: "lossless-claw"` と
`plugins.entries.lossless-claw.config.summaryModel` を通じて設定します。
Codex がアクティブなランタイムの場合、`openclaw doctor --fix` は古い
`compaction.provider: "lossless-claw"` 形状を Lossless コンテキストエンジンスロットに
移行しますが、ネイティブ Codex は引き続き Compaction を所有します。

ネイティブ Codex app-server ハーネスは、プロンプト前アセンブリを必要とする
コンテキストエンジンをサポートします。`codex-cli` を含む汎用 CLI バックエンドは、
そのホスト機能を提供しません。

Codex バックエンドのエージェントでは、`/compact` はバインドされたスレッドで
ネイティブ Codex app-server Compaction を開始します。OpenClaw は完了を待たず、
OpenClaw タイムアウトを課さず、共有 app-server を再起動せず、コンテキストエンジンや
公開 OpenAI 要約器へフォールバックしません。ネイティブ Codex スレッドバインディングが
欠落している、または古い場合、コマンドは fail closed し、オペレーターは Compaction
バックエンドが暗黙に切り替わるのではなく、実際のランタイム境界を確認できます。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

この形状では、どちらのプロファイルも `openai/gpt-*` エージェントターンでは引き続き
Codex を通じて実行されます。API キーは認証フォールバックにすぎず、OpenClaw または
通常の OpenAI Responses へ切り替える要求ではありません。

このページの残りでは、ユーザーが選択する必要がある一般的なバリエーションを扱います:
デプロイ形状、fail-closed ルーティング、guardian 承認ポリシー、ネイティブ Codex
Plugin、および Computer Use です。完全なオプション一覧、デフォルト、enum、検出、
環境分離、タイムアウト、app-server トランスポートフィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference) を参照してください。

## Codex ランタイムを確認する

Codex を期待するチャットで `/status` を使用します。Codex バックエンドの OpenAI エージェント
ターンでは次のように表示されます:

```text
Runtime: OpenAI Codex
```

次に Codex app-server 状態を確認します:

```text
/codex status
/codex models
```

`/codex status` は app-server の接続性、アカウント、レート制限、MCP
サーバー、Skills を報告します。`/codex models` は、ハーネスとアカウントの
ライブ Codex app-server カタログを一覧表示します。`/status` が予想外の場合は、
[トラブルシューティング](#troubleshooting) を参照してください。

## ルーティングとモデル選択

プロバイダー参照とランタイムポリシーを分離しておきます:

- Codex 経由の OpenAI エージェントターンには `openai/gpt-*` を使用します。
- 設定でレガシー Codex GPT 参照を使用しないでください。`openclaw doctor --fix` を実行して、
  レガシー参照と古いセッションルートピンを修復します。
- `agentRuntime.id: "codex"` は通常の OpenAI 自動モードでは任意ですが、
  Codex が利用できない場合にデプロイを fail closed したいときに便利です。
- `agentRuntime.id: "openclaw"` は、それが意図された場合にプロバイダーまたはモデルを
  OpenClaw 埋め込みランタイムへオプトインします。
- `/codex ...` はチャットからネイティブ Codex app-server 会話を制御します。
- ACP/acpx は別の外部ハーネスパスです。ユーザーが ACP/acpx または外部ハーネスアダプターを
  求めている場合にのみ使用します。

一般的なコマンドルーティング:

| ユーザーの意図                                           | 用途                                                                                                   |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 現在のチャットをアタッチ                               | `/codex bind [--cwd <path>]`                                                                          |
| 既存の Codex スレッドを再開                       | `/codex resume <thread-id>`                                                                           |
| Codex スレッドを一覧表示またはフィルター                          | `/codex threads [filter]`                                                                             |
| ネイティブ Codex Plugin を一覧表示                             | `/codex plugins list`                                                                                 |
| 設定済みのネイティブ Codex Plugin を有効化または無効化    | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| ペアリング済みノード上の既存 Codex CLI セッションをアタッチ | `/codex sessions --host <node> [filter]`, then `/codex resume <session-id> --host <node> --bind here` |
| Codex フィードバックのみを送信                              | `/codex diagnostics [note]`                                                                           |
| ACP/acpx タスクを開始                                | ACP/acpx セッションコマンド、`/codex` ではありません                                                               |

| ユースケース                                             | 設定                                                              | 確認                                  | 注記                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| ネイティブ Codex ランタイムを使う ChatGPT/Codex サブスクリプション | `openai/gpt-*` と、有効化された `codex` Plugin                             | `/status` に `Runtime: OpenAI Codex` と表示される | 推奨パス                      |
| Codex が利用できない場合にフェイルクローズ                  | プロバイダーまたはモデルの `agentRuntime.id: "codex"`                           | 埋め込みフォールバックではなくターンが失敗する | Codex 専用デプロイに使用        |
| OpenClaw 経由で OpenAI API キーのトラフィックを直接送る       | プロバイダーまたはモデルの `agentRuntime.id: "openclaw"` と通常の OpenAI 認証 | `/status` に OpenClaw ランタイムと表示される        | OpenClaw を意図している場合にのみ使用 |
| レガシー設定                                        | レガシー Codex GPT 参照                                                  | `openclaw doctor --fix` が書き換える     | この方法で新しい設定を書かない      |
| ACP/acpx Codex アダプター                               | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP タスク/セッションのステータス                 | ネイティブ Codex ハーネスとは別    |

`agents.defaults.imageModel` は同じプレフィックス分割に従います。通常の OpenAI ルートには
`openai/gpt-*` を使用し、画像理解を境界のある Codex アプリサーバーターン経由で実行する必要がある場合にのみ
`codex/gpt-*` を使用してください。
レガシー Codex GPT 参照は使用しないでください。doctor はそのレガシープレフィックスを `openai/gpt-*` に書き換えます。

## デプロイパターン

### 基本的な Codex デプロイ

すべての OpenAI エージェントターンでデフォルトで Codex を使用する場合は、クイックスタート設定を使用します。

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

### 混在プロバイダーデプロイ

この形では、Claude をデフォルトエージェントのままにし、名前付き Codex エージェントを追加します。

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

### フェイルクローズ Codex デプロイ

OpenAI エージェントターンでは、バンドルされた Plugin が利用可能な場合、`openai/gpt-*` はすでに Codex に解決されます。
明文化されたフェイルクローズルールが必要な場合は、明示的なランタイムポリシーを追加します。

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

Codex を強制すると、Codex Plugin が無効、アプリサーバーが古すぎる、またはアプリサーバーを起動できない場合に、OpenClaw は早期に失敗します。

## アプリサーバーポリシー

デフォルトでは、Plugin は OpenClaw が管理する Codex バイナリを stdio トランスポートでローカル起動します。
意図的に別の実行ファイルを実行したい場合にのみ `appServer.command` を設定してください。
WebSocket トランスポートは、アプリサーバーがすでに別の場所で実行されている場合にのみ使用します。

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

ローカル stdio アプリサーバーセッションは、信頼されたローカルオペレーターの姿勢をデフォルトにします。
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"` です。ローカル Codex 要件がその暗黙の無承認姿勢を許可しない場合、OpenClaw は代わりに許可されたガーディアン権限を選択します。
セッションで OpenClaw サンドボックスが有効な場合、OpenClaw は Codex ホスト側サンドボックスに依存するのではなく、そのターンについて Codex ネイティブ Code Mode、ユーザー MCP サーバー、アプリバックエンドの Plugin 実行を無効にします。
通常の exec/process ツールが利用可能な場合、シェルアクセスは `sandbox_exec` や
`sandbox_process` など、OpenClaw サンドボックスを基盤とする動的ツールを通じて公開されます。

サンドボックス脱出や追加権限の前に Codex ネイティブ自動レビューを使いたい場合は、正規化された OpenClaw exec モードを使用します。

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

Codex アプリサーバーセッションでは、OpenClaw は `tools.exec.mode: "auto"` を Codex
Guardian によるレビュー付き承認にマッピングします。通常は、ローカル要件がそれらの値を許可する場合、
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および
`sandbox: "workspace-write"` です。
`tools.exec.mode: "auto"` では、OpenClaw はレガシーの安全でない Codex
`approvalPolicy: "never"` または `sandbox: "danger-full-access"` の上書きを保持しません。意図的に承認なしの Codex 姿勢にする場合は
`tools.exec.mode: "full"` を使用してください。レガシーの `plugins.entries.codex.config.appServer.mode: "guardian"` プリセットは引き続き機能しますが、
`tools.exec.mode: "auto"` が正規化された OpenClaw サーフェスです。

ホスト exec 承認および ACPX 権限とのモードレベルの比較については、
[権限モード](/ja-JP/tools/permission-modes)を参照してください。

すべてのアプリサーバーフィールド、認証順序、環境分離、検出、タイムアウト動作については、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## コマンドと診断

バンドルされた Plugin は、OpenClaw テキストコマンドをサポートする任意のチャンネルで、スラッシュコマンドとして `/codex` を登録します。

ネイティブ実行と制御には、オーナーまたは `operator.admin` Gateway クライアントが必要です。
これには、スレッドのバインドまたは再開、ターンの送信または停止、モデル、ファストモード、権限状態の変更、Compaction またはレビュー、バインディングのデタッチが含まれます。
その他の承認済み送信者は、読み取り専用のステータス、ヘルプ、アカウント、モデル、スレッド、MCP サーバー、スキル、バインディング検査コマンドを保持します。

一般的な形式:

- `/codex status` はアプリサーバー接続、モデル、アカウント、レート制限、
  MCP サーバー、スキルを確認します。
- `/codex models` はライブ Codex アプリサーバーモデルを一覧表示します。
- `/codex threads [filter]` は最近の Codex アプリサーバースレッドを一覧表示します。
- `/codex resume <thread-id>` は現在の OpenClaw セッションを既存の Codex スレッドにアタッチします。
- `/codex compact` は Codex アプリサーバーに、アタッチされたスレッドの Compaction を依頼します。
- `/codex review` はアタッチされたスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、アタッチされたスレッドの Codex フィードバックを送信する前に確認します。
- `/codex account` はアカウントとレート制限のステータスを表示します。
- `/codex mcp` は Codex アプリサーバーの MCP サーバーステータスを一覧表示します。
- `/codex skills` は Codex アプリサーバーのスキルを一覧表示します。

ほとんどのサポート報告では、バグが発生した会話で `/diagnostics [note]` から始めます。
これにより 1 つの Gateway 診断レポートが作成され、Codex ハーネスセッションでは、関連する Codex フィードバックバンドルを送信する承認を求めます。
プライバシーモデルとグループチャットでの動作については、[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

現在アタッチされているスレッドについて、完全な Gateway 診断バンドルなしで Codex フィードバックのアップロードだけが必要な場合にのみ、`/codex diagnostics [note]` を使用してください。

### Codex スレッドをローカルで検査する

問題のある Codex 実行を検査する最速の方法は、多くの場合、ネイティブ Codex スレッドを直接開くことです。

```bash
codex resume <thread-id>
```

完了した `/diagnostics` の返信、`/codex binding`、または
`/codex threads [filter]` からスレッド ID を取得します。

アップロードの仕組みとランタイムレベルの診断境界については、
[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#codex-feedback-upload)を参照してください。

デフォルトのエージェント別ホームでは、認証は次の順序で選択されます。

1. エージェントの順序付き OpenAI 認証プロファイル。できれば
   `auth.order.openai` 配下に配置します。古いレガシー Codex 認証プロファイル ID とレガシー Codex 認証順序を移行するには、`openclaw doctor --fix` を実行します。
2. そのエージェントの Codex ホームにある、アプリサーバーの既存アカウント。
3. ローカル stdio アプリサーバー起動の場合のみ、アプリサーバーアカウントが存在せず、OpenAI 認証がまだ必要なときに、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、生成される Codex 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。
これにより、Gateway レベルの API キーを埋め込みや直接 OpenAI モデルに利用できる状態に保ちながら、ネイティブ Codex アプリサーバーターンが誤って API 経由で課金されることを防ぎます。
明示的な Codex API キープロファイルとローカル stdio 環境キーのフォールバックは、継承された子プロセス環境変数ではなく、アプリサーバーログインを使用します。
WebSocket アプリサーバー接続は、Gateway 環境の API キーフォールバックを受け取りません。明示的な認証プロファイルまたはリモートアプリサーバー自身のアカウントを使用してください。
ネイティブ Codex Plugin が設定されている場合、OpenClaw は Plugin 所有のアプリを Codex スレッドに公開する前に、接続されたアプリサーバー経由でそれらの Plugin をインストールまたは更新します。
`app/list` はアプリ ID、アクセシビリティ、メタデータの信頼できる情報源であり続けますが、OpenClaw はスレッドごとの有効化判断を所有します。ポリシーで一覧表示されたアクセス可能なアプリが許可される場合、`app/list` が現在そのアプリを無効と報告していても、OpenClaw は
`thread/start.config.apps[appId].enabled = true` を送信します。このパスは未知の ID に対してアプリインストールを作り出しません。OpenClaw は `plugin/install` で marketplace Plugin のみを有効化し、その後インベントリを更新します。

サブスクリプションプロファイルが Codex 使用量制限に達した場合、Codex がリセット時刻を報告すれば OpenClaw はそれを記録し、同じ Codex 実行について次の順序付き認証プロファイルを試します。
リセット時刻を過ぎると、選択された `openai/gpt-*` モデルや Codex ランタイムを変更せずに、そのサブスクリプションプロファイルは再び利用可能になります。

ローカルの stdio app-server 起動では、OpenClaw は `CODEX_HOME` をエージェントごとの
ディレクトリに設定するため、Codex の設定、認証/アカウントファイル、Plugin キャッシュ/データ、ネイティブの
スレッド状態は、デフォルトでオペレーター個人の `~/.codex` を読み書きしません。OpenClaw は通常のプロセス `HOME` を保持します。Codex が実行するサブプロセスは
ユーザーホームの設定とトークンを引き続き見つけることができ、Codex は共有の
`$HOME/.agents/skills` と `$HOME/.agents/plugins/marketplace.json` エントリを検出する場合があります。
`appServer.homeScope: "user"` では、OpenClaw は代わりにネイティブのユーザー Codex
ホームと既存のアカウントを使用し、OpenClaw 認証プロファイルを注入しません。

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
OpenClaw はローカル起動の正規化中に、このリストから `CODEX_HOME` と `HOME` を削除します。
`CODEX_HOME` は選択されたエージェントまたはユーザースコープを指したままになり、
`HOME` は継承されたままになるため、サブプロセスは通常のユーザーホーム状態を使用できます。

Codex 動的ツールはデフォルトで `searchable` ロードになります。OpenClaw は、
Codex ネイティブのワークスペース操作と重複する動的ツール、つまり `read`、`write`、
`edit`、`apply_patch`、`exec`、`process`、`update_plan` を公開しません。メッセージング、メディア、cron、ブラウザー、ノード、
Gateway、`heartbeat_respond` など、残りのほとんどの OpenClaw 統合ツールは、
`openclaw` 名前空間の下で Codex ツール検索を通じて利用でき、初期モデルコンテキストを小さく保ちます。検索が有効で、管理対象プロバイダーが選択されていない場合、Web 検索はデフォルトで Codex のホスト型 `web_search` ツールを使用します。ネイティブのホスト型検索と OpenClaw の管理対象
`web_search` 動的ツールは相互排他的であるため、管理対象検索がネイティブのドメイン制限をバイパスすることはできません。ホスト型検索が利用できない、明示的に無効化されている、または選択された管理対象プロバイダーに置き換えられている場合、OpenClaw は管理対象ツールを使用します。
OpenClaw は Codex のスタンドアロン `web.run` 拡張を無効のままにします。本番 app-server トラフィックが、そのユーザー定義の `web` 名前空間を拒否するためです。
`tools.web.search.enabled: false` は両方のパスを無効にし、ツール無効の
LLM のみの実行でも同様です。Codex は `"cached"` を優先設定として扱い、制限のない app-server ターンではライブ外部アクセスに解決します。ネイティブの `allowedDomains` が設定されている場合、自動管理対象フォールバックはフェイルクローズし、許可リストがバイパスされないようにします。永続的な有効検索ポリシーの変更では、次のターンの前にバインドされた Codex
スレッドをローテーションします。一時的なターンごとの制限では、一時的な制限付きスレッドを使用し、後で再開できるように既存のバインドを保持します。
`sessions_yield` とメッセージツールのみのソース返信は、それらがターン制御コントラクトであるため、直接のままです。`sessions_spawn` は searchable のままなので、Codex のネイティブ `spawn_agent` が主要な Codex サブエージェントサーフェスであり続けます。一方で、明示的な
OpenClaw または ACP の委譲は、引き続き `openclaw` 動的ツール名前空間から利用できます。Heartbeat コラボレーション指示は、ツールがまだロードされていない場合、Heartbeat ターンを終了する前に
`heartbeat_respond` を検索するよう Codex に伝えます。

`codexDynamicToolsLoading: "direct"` は、遅延された動的ツールを検索できないカスタム Codex
app-server に接続する場合、または完全なツールペイロードをデバッグする場合にのみ設定してください。

サポートされるトップレベルの Codex Plugin フィールド:

| フィールド                 | デフォルト     | 意味                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | `"direct"` を使用すると、OpenClaw 動的ツールを初期 Codex ツールコンテキストに直接配置します。 |
| `codexDynamicToolsExclude` | `[]`           | Codex app-server ターンから省略する追加の OpenClaw 動的ツール名。                         |
| `codexPlugins`             | 無効           | 移行済みのソースインストール型キュレーション済み Plugin 向けのネイティブ Codex Plugin/app サポート。 |

サポートされる `appServer` フィールド:

| フィールド                                    | デフォルト                                             | 意味                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` は Codex を起動します。`"websocket"` は `url` に接続します。                                                                                                                                                                                                                                                                                                                                                      |
| `homeScope`                                   | `"agent"`                                              | `"agent"` は OpenClaw agent ごとに Codex 状態を分離します。`"user"` はネイティブの `$CODEX_HOME` または `~/.codex` を共有し、ネイティブ認証を使い、所有者専用のスレッド管理を有効にします。ユーザースコープには stdio が必要です。                                                                                                                                                                                        |
| `command`                                     | 管理対象の Codex バイナリ                              | stdio トランスポート用の実行ファイルです。管理対象バイナリを使う場合は未設定のままにしてください。明示的に上書きする場合にのみ設定します。                                                                                                                                                                                                                                                                                 |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポート用の引数です。                                                                                                                                                                                                                                                                                                                                                                                         |
| `url`                                         | 未設定                                                 | WebSocket app-server URL です。                                                                                                                                                                                                                                                                                                                                                                                            |
| `authToken`                                   | 未設定                                                 | WebSocket トランスポート用の Bearer トークンです。リテラル文字列、または `${CODEX_APP_SERVER_TOKEN}` のような SecretInput を受け付けます。                                                                                                                                                                                                                                                                                  |
| `headers`                                     | `{}`                                                   | 追加の WebSocket ヘッダーです。ヘッダー値はリテラル文字列、または `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"` のような SecretInput 値を受け付けます。                                                                                                                                                                                                                                                  |
| `clearEnv`                                    | `[]`                                                   | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除する追加の環境変数名です。OpenClaw はローカル起動のために、選択された `CODEX_HOME` と継承された `HOME` を保持します。                                                                                                                                                                                                                         |
| `codeModeOnly`                                | `false`                                                | Codex のコードモード専用ツールサーフェスを有効にします。OpenClaw の動的ツールは Codex に登録されたままになるため、ネストされた `tools.*` 呼び出しは app-server の `item/tool/call` ブリッジを通じて返ります。                                                                                                                                                                                                               |
| `remoteWorkspaceRoot`                         | 未設定                                                 | リモート Codex app-server のワークスペースルートです。設定すると、OpenClaw は解決済みの OpenClaw ワークスペースからローカルワークスペースルートを推定し、このリモートルート配下で現在の cwd サフィックスを保持し、最終的な app-server cwd のみを Codex に送信します。cwd が解決済みの OpenClaw ワークスペースルート外にある場合、OpenClaw は Gateway ローカルパスをリモート app-server に送信せず、フェイルクローズします。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server コントロールプレーン呼び出しのタイムアウトです。                                                                                                                                                                                                                                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex がターンを受け付けた後、または OpenClaw が `turn/completed` を待機している間のターンスコープの app-server リクエスト後の静かな時間枠です。                                                                                                                                                                                                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw が `turn/completed` を待機している間に、ツールの引き渡し、ネイティブツール完了、ツール後の raw assistant 進行、raw reasoning 完了、または reasoning 進行の後に使われる、完了アイドルおよび進行ガードです。ツール後の統合が最終 assistant リリース予算より長く正当に静かなままでいられる、信頼済みまたは重いワークロードに使用します。                                                                            |
| `mode`                                        | ローカル Codex 要件が YOLO を許可しない場合を除き `"yolo"` | YOLO または guardian レビュー付き実行のプリセットです。`danger-full-access`、`never` approval、または `user` reviewer を省略するローカル stdio 要件では、暗黙のデフォルトは guardian になります。                                                                                                                                                                                                                             |
| `approvalPolicy`                              | `"never"` または許可された guardian approval policy    | スレッド開始/再開/ターンに送信されるネイティブ Codex approval policy です。guardian のデフォルトは、許可されている場合 `"on-request"` を優先します。                                                                                                                                                                                                                                                                          |
| `sandbox`                                     | `"danger-full-access"` または許可された guardian sandbox | スレッド開始/再開に送信されるネイティブ Codex sandbox mode です。guardian のデフォルトは、許可されている場合 `"workspace-write"` を優先し、それ以外の場合は `"read-only"` を優先します。OpenClaw sandbox が有効な場合、`danger-full-access` ターンは、OpenClaw sandbox の egress 設定から派生したネットワークアクセスを持つ Codex `workspace-write` を使います。                                                              |
| `approvalsReviewer`                           | `"user"` または許可された guardian reviewer            | 許可されている場合に Codex がネイティブ approval prompt をレビューするには `"auto_review"` を使います。それ以外の場合は `guardian_subagent` または `user` を使います。`guardian_subagent` はレガシーエイリアスのままです。                                                                                                                                                                                                     |
| `serviceTier`                                 | 未設定                                                 | 任意の Codex app-server service tier です。`"priority"` は fast-mode routing を有効にし、`"flex"` は flex processing を要求し、`null` は上書きをクリアし、レガシーの `"fast"` は `"priority"` として受け付けられます。                                                                                                                                                                                                        |
| `networkProxy`                                | 無効                                                   | app-server コマンド向けの Codex permissions-profile ネットワークを有効にします。OpenClaw は、`sandbox` を送信する代わりに、選択された `permissions.<profile>.network` 設定を定義し、`default_permissions` でそれを選択します。                                                                                                                                                                                                 |
| `experimental.sandboxExecServer`              | `false`                                                | ネイティブ Codex 実行をアクティブな OpenClaw sandbox 内で実行できるように、OpenClaw sandbox に裏付けられた Codex 環境を Codex app-server 0.132.0 以降に登録するプレビューのオプトインです。                                                                                                                                                                                                                                  |

`appServer.networkProxy` は、Codex sandbox の契約を変更するため明示的です。
有効にすると、OpenClaw は Codex スレッド設定で `features.network_proxy.enabled` と
`default_permissions` も設定し、生成された権限プロファイルが Codex 管理のネットワークを
開始できるようにします。デフォルトでは、OpenClaw はプロファイル本体から衝突耐性のある
`openclaw-network-<fingerprint>` プロファイル名を生成します。安定したローカル名が必要な場合にのみ
`profileName` を使ってください。

```js
export default {
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
};
```

通常のアプリサーバーランタイムが `danger-full-access` になる場合、
`networkProxy` を有効にすると、生成される権限プロファイルには
ワークスペース形式のファイルシステムアクセスが使用されます。Codex が管理するネットワーク強制はサンドボックス化されたネットワークであるため、
フルアクセスプロファイルでは送信トラフィックを保護できません。
ドメインエントリは `allow` または `deny` を使用し、Unix ソケットエントリは Codex の
`allow` または `none` 値を使用します。

OpenClaw 所有の動的ツール呼び出しは、
`appServer.requestTimeoutMs` とは独立して制限されます。Codex の `item/tool/call` リクエストは、デフォルトで 90 秒の
OpenClaw ウォッチドッグを使用します。呼び出しごとの正の `timeoutMs` 引数は、
その特定ツールの予算を延長または短縮します。`image_generate` ツールは、
ツール呼び出しが独自のタイムアウトを指定しない場合は
`agents.defaults.imageGenerationModel.timeoutMs` を使用し、それ以外の場合は 120 秒の画像生成デフォルトを使用します。
メディア理解の `image` ツールは
`tools.media.image.timeoutSeconds` または 60 秒のメディアデフォルトを使用します。画像理解では、
そのタイムアウトはリクエスト自体に適用され、先行する準備作業によって
短縮されません。動的ツール予算は
600000 ms で上限設定されます。タイムアウト時、OpenClaw はサポートされる場合にツールシグナルを中止し、
失敗した動的ツールレスポンスを Codex に返すため、セッションを `processing` のまま残さずにターンを継続できます。
このウォッチドッグは外側の動的 `item/tool/call` 予算です。プロバイダー固有の
リクエストタイムアウトはその呼び出しの内側で実行され、それぞれ独自のタイムアウトセマンティクスを維持します。

Codex がターンを受け入れた後、および OpenClaw がターンスコープの
アプリサーバーリクエストに応答した後、ハーネスは Codex が現在ターンの進行を行い、
最終的に `turn/completed` でネイティブターンを完了することを期待します。アプリサーバーが
`appServer.turnCompletionIdleTimeoutMs` の間静かになった場合、OpenClaw はベストエフォートで
Codex ターンを中断し、診断タイムアウトを記録し、古いネイティブターンの後ろに後続のチャットメッセージがキューされないように
OpenClaw セッションレーンを解放します。同じターンのほとんどの非終端通知は、
Codex がターンがまだ生きていることを証明したため、その短いウォッチドッグを解除します。ツール引き継ぎでは、
より長いツール後アイドル予算を使用します。OpenClaw が `item/tool/call`
レスポンスを返した後、`commandExecution` などのネイティブツールアイテムが完了した後、生の
`custom_tool_call_output` 完了の後、およびツール後の生アシスタント
進行、生推論完了、または推論進行の後です。このガードは
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` が設定されている場合はそれを使用し、
それ以外の場合はデフォルトで 5 分になります。同じツール後予算は、Codex が次の
現在ターンイベントを発行する前の無音合成ウィンドウに対する進行ウォッチドッグも延長します。レート制限更新などのグローバルなアプリサーバー通知は、
ターンアイドル進行をリセットしません。推論完了、コメンタリー
`agentMessage` 完了、およびツール前の生推論またはアシスタント進行の後には
自動の最終返信が続く可能性があるため、セッションレーンを即時解放する代わりに
進行後返信ガードを使用します。最終/非コメンタリーの完了済み `agentMessage` アイテムと、
ツール前の生アシスタント完了だけが、アシスタント出力解放を起動します。Codex がその後
`turn/completed` なしで静かになった場合、OpenClaw はベストエフォートでネイティブターンを中断し、
セッションレーンを解放します。別のターンウォッチがその解放競争に勝った場合でも、
ネイティブリクエスト、アイテム、または動的ツール完了がアクティブでなくなり、
アシスタント出力解放が依然として最新の完了済みアイテムに属し、その後のアイテム完了がない場合、
OpenClaw は完了済みの最終アシスタントアイテムを受け入れます。これにより、ターンを再生せずに
完了済みツール作業後の最終回答を保持できます。部分的なアシスタントデルタ、古い以前の
返信、および空の後続完了は対象になりません。再生安全な stdio
アプリサーバー失敗、
アシスタント、ツール、アクティブアイテム、または副作用の証拠がないターン完了アイドルタイムアウトを含む失敗は、
新しいアプリサーバー試行で 1 回再試行されます。安全でないタイムアウトは、それでも停止したアプリサーバークライアントを廃止し、
OpenClaw セッションレーンを解放します。また、自動再生する代わりに、
古いネイティブスレッドバインディングもクリアします。完了ウォッチのタイムアウトは Codex 固有のタイムアウト文面を表示します。
再生安全なケースではレスポンスが不完全な可能性があると伝え、安全でないケースでは
再試行前に現在の状態を確認するようユーザーに伝えます。公開タイムアウト診断には、
最後のアプリサーバー通知メソッド、生アシスタントレスポンスアイテムの id/type/role、
アクティブなリクエスト/アイテム数、起動中のウォッチ状態などの構造化フィールドが含まれます。最後の通知が生アシスタントレスポンスアイテムの場合は、
境界付きのアシスタントテキストプレビューも含まれます。生プロンプトや
ツール内容は含まれません。

環境オーバーライドはローカルテスト用に引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` は、
`appServer.command` が未設定の場合に管理対象バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、
1 回限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。反復可能なデプロイでは設定が推奨されます。これは、
Codex ハーネス設定の残りと同じレビュー済みファイル内に Plugin の挙動を保持するためです。

## ネイティブ Codex Plugin

ネイティブ Codex Plugin サポートは、OpenClaw ハーネスターンと同じ Codex スレッドで、
Codex アプリサーバー自身のアプリ機能と Plugin 機能を使用します。OpenClaw は
Codex Plugin を合成 `codex_plugin_*` OpenClaw
動的ツールに変換しません。

`codexPlugins` はネイティブ Codex ハーネスを選択するセッションにのみ影響します。組み込みハーネス実行、通常の OpenAI プロバイダー実行、ACP 会話
バインディング、またはその他のハーネスには影響しません。

最小限の移行済み設定:

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

スレッドアプリ設定は、OpenClaw が Codex ハーネスセッションを確立するか、
古い Codex スレッドバインディングを置き換えるときに計算されます。ターンごとには再計算されません。
`codexPlugins` の変更後は、将来の Codex ハーネスセッションが更新後のアプリセットで開始されるように、
`/new`、`/reset`、または Gateway の再起動を使用してください。

移行適格性、アプリインベントリ、破壊的アクションポリシー、
エリシテーション、ネイティブ Plugin 診断については、
[ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins) を参照してください。

OpenAI 側のアプリおよび Plugin アクセスは、サインインしている Codex アカウントと、
Business および Enterprise/Edu ワークスペースではワークスペースアプリ制御によって制御されます。OpenAI のアカウントおよびワークスペース制御の概要については、
[ChatGPT プランで Codex を使用する](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
を参照してください。

## コンピューター操作

コンピューター操作は専用のセットアップガイドで扱っています:
[Codex コンピューター操作](/ja-JP/plugins/codex-computer-use)。

短く言うと、OpenClaw はデスクトップ制御アプリをベンダー化せず、
デスクトップ操作を自身では実行しません。Codex アプリサーバーを準備し、
`computer-use` MCP サーバーが利用可能であることを検証し、その後は Codex モードのターン中に
ネイティブ MCP ツール呼び出しを Codex に所有させます。

## ランタイム境界

Codex ハーネスが変更するのは、低レベルの組み込みエージェント実行器のみです。

- OpenClaw 動的ツールはサポートされています。Codex は OpenClaw にそれらの
  ツールの実行を依頼するため、OpenClaw は実行パス内に残ります。
- Codex ネイティブのシェル、パッチ、MCP、およびネイティブアプリツールは Codex が所有します。
  OpenClaw はサポートされるリレーを通じて選択されたネイティブイベントを観測またはブロックできますが、
  ネイティブツール引数を書き換えません。
- Codex はネイティブ Compaction を所有します。OpenClaw はチャネル
  履歴、検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのためにトランスクリプトミラーを保持しますが、
  Codex Compaction を OpenClaw またはコンテキストエンジンの
  要約器で置き換えることはありません。
- メディア生成、メディア理解、TTS、承認、およびメッセージングツール
  出力は、対応する OpenClaw プロバイダー/モデル設定を通じて継続します。
- `tool_result_persist` は OpenClaw 所有のトランスクリプトツール結果に適用され、
  Codex ネイティブのツール結果レコードには適用されません。

フックレイヤー、サポートされる V1 サーフェス、ネイティブ権限処理、キュー
ステアリング、Codex フィードバックアップロードの仕組み、および Compaction の詳細については、
[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime) を参照してください。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** 新しい設定では想定どおりです。
`openai/gpt-*` モデルを選択し、
`plugins.entries.codex.enabled` を有効にし、`plugins.allow` が
`codex` を除外していないか確認してください。

**OpenClaw が Codex の代わりに組み込みハーネスを使用する:** モデル参照が公式 OpenAI プロバイダー上の
`openai/gpt-*` であり、Codex Plugin が
インストールされ有効化されていることを確認してください。テスト中に厳密な証明が必要な場合は、プロバイダーまたは
モデルの `agentRuntime.id: "codex"` を設定してください。強制された Codex ランタイムは、
OpenClaw にフォールバックする代わりに失敗します。

**OpenAI Codex ランタイムが API キーパスにフォールバックする:** モデル、ランタイム、選択されたプロバイダー、および失敗を示す、
秘匿済みの Gateway 抜粋を収集してください。
影響を受ける共同作業者に、OpenClaw ホストでこの読み取り専用コマンドを実行してもらってください。

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

有用な抜粋には通常、`openai/gpt-5.5` または `openai/gpt-5.4`、
`Runtime: OpenAI Codex`、`agentRuntime.id` または `harnessRuntime`、
`candidateProvider: "openai"`、および `401`、`Incorrect API key`、または
`No API key` の結果が含まれます。修正後の実行では、単純な OpenAI API キー失敗ではなく、
OpenAI OAuth パスが表示されるはずです。

**従来の Codex モデル参照設定が残っている:** `openclaw doctor --fix` を実行してください。
Doctor は従来のモデル参照を `openai/*` に書き換え、古いセッションおよび
エージェント全体のランタイム固定を削除し、既存の認証プロファイルオーバーライドを保持します。

**アプリサーバーが拒否される:** Codex アプリサーバー `0.125.0` 以降を使用してください。
同一バージョンのプレリリースや、`0.125.0-alpha.2` または `0.125.0+custom` のようなビルドサフィックス付きバージョンは、
OpenClaw が安定版 `0.125.0` プロトコル下限をテストするため拒否されます。

**`/codex status` が接続できない:** バンドルされた `codex` Plugin が
有効であること、許可リストが設定されている場合は `plugins.allow` にそれが含まれていること、
およびカスタムの `appServer.command`、`url`、`authToken`、またはヘッダーが有効であることを確認してください。

**モデル検出が遅い:** 
`plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効にしてください。詳しくは
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference#model-discovery) を参照してください。

**WebSocket トランスポートが即座に失敗する:** `appServer.url`、`authToken`、
ヘッダー、およびリモートアプリサーバーが同じ Codex アプリサーバー
プロトコルバージョンを話すことを確認してください。

**ネイティブシェルまたはパッチツールが `Native hook relay unavailable` でブロックされる場合:**
Codex スレッドは、OpenClaw がもう登録していないネイティブフックリレー ID をまだ使おうとしています。これはネイティブ Codex フックトランスポートの問題であり、ACP バックエンド、プロバイダー、GitHub、またはシェルコマンドの失敗ではありません。影響を受けているチャットで `/new` または `/reset` を使って新しいセッションを開始し、その後、無害なコマンドを再試行してください。それが一度は動作するものの、次のネイティブツール呼び出しが再び失敗する場合は、`/new` は一時的な回避策としてのみ扱ってください: Codex app-server または OpenClaw Gateway を再起動した後、新しいセッションにプロンプトをコピーして、古いスレッドを破棄し、ネイティブフック登録を再作成します。

**Codex 以外のモデルが組み込みハーネスを使う場合:** プロバイダーまたはモデルのランタイムポリシーが別のハーネスへルーティングしない限り、これは想定どおりです。通常の OpenAI 以外のプロバイダー参照は、`auto` モードでは通常のプロバイダーパスに留まります。

**Computer Use はインストールされているがツールが実行されない場合:** 新しいセッションから `/codex computer-use status` を確認してください。ツールが `Native hook relay unavailable` を報告する場合は、上記のネイティブフックリレーの復旧手順を使ってください。[Codex Computer Use](/ja-JP/plugins/codex-computer-use#troubleshooting) を参照してください。

## 関連

- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [ネイティブ Codex プラグイン](/ja-JP/plugins/codex-native-plugins)
- [Codex Computer Use](/ja-JP/plugins/codex-computer-use)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [OpenAI Codex ヘルプ](https://help.openai.com/en/collections/14937394-codex)
- [エージェントハーネスプラグイン](/ja-JP/plugins/sdk-agent-harness)
- [Plugin フック](/ja-JP/plugins/hooks)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [ステータス](/ja-JP/cli/status)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
