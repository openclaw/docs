---
read_when:
    - バンドルされた Codex app-server ハーネスを使用したい
    - Codex ハーネス設定例が必要です
    - Codex のみのデプロイでは、OpenClaw にフォールバックするのではなく失敗させたい
summary: バンドルされた Codex app-server ハーネスを通じて OpenClaw の組み込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-06-27T12:12:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfa04f53d01aad16dd6ea499ea1c04b1050c80ed12326db6fb4fa88c9c40a68c
    source_path: plugins/codex-harness.md
    workflow: 16
---

バンドルされた `codex` Plugin により、OpenClaw は組み込みの OpenClaw ハーネスではなく
Codex app-server 経由で、埋め込み OpenAI エージェントターンを実行できます。

低レベルのエージェントセッションを Codex に所有させたい場合は、Codex ハーネスを使用してください:
ネイティブのスレッド再開、ネイティブのツール継続、ネイティブの Compaction、
app-server 実行です。OpenClaw は引き続き、チャットチャネル、セッションファイル、モデル
選択、OpenClaw 動的ツール、承認、メディア配信、可視の
トランスクリプトミラーを所有します。

通常のセットアップでは、`openai/gpt-5.5` などの正規 OpenAI モデル参照を使用します。
レガシー Codex GPT 参照は設定しないでください。OpenAI エージェント認証順序は
`auth.order.openai` の下に置きます。古いレガシー Codex 認証プロファイル ID と
レガシー Codex 認証順序エントリは、
`openclaw doctor --fix` によって修復されるレガシー状態です。

OpenClaw サンドボックスがアクティブでない場合、OpenClaw は Codex のネイティブコードモードを有効にして
Codex app-server スレッドを開始し、code-mode-only はデフォルトでオフのままにします。
これにより、Codex のネイティブワークスペースとコード機能を利用可能にしたまま、
OpenClaw 動的ツールは app-server の `item/tool/call` ブリッジ経由で継続します。
アクティブな OpenClaw サンドボックス化と制限付きツールポリシーでは、
実験的なサンドボックス exec-server パスにオプトインしない限り、ネイティブコードモードは
完全に無効になります。

この Codex ネイティブ機能は
[OpenClaw コードモード](/ja-JP/reference/code-mode)とは別のものです。これは、異なる `exec` 入力形状を持つ
汎用 OpenClaw 実行向けの、オプトインの QuickJS-WASI
ランタイムです。

より広いモデル/プロバイダー/ランタイムの分離については、
[エージェントランタイム](/ja-JP/concepts/agent-runtimes)から始めてください。短く言うと:
`openai/gpt-5.5` はモデル参照、`codex` はランタイムであり、Telegram、
Discord、Slack、または別のチャネルはコミュニケーション面のままです。

## 要件

- バンドルされた `codex` Plugin が利用可能な OpenClaw。
- 設定で `plugins.allow` を使用している場合は、`codex` を含めます。
- Codex app-server `0.125.0` 以降。バンドルされた Plugin はデフォルトで互換性のある
  Codex app-server バイナリを管理するため、`PATH` 上のローカル `codex` コマンドは
  通常のハーネス起動に影響しません。
- `openclaw models auth login --provider openai`、エージェントの Codex ホーム内の
  app-server アカウント、または明示的な Codex API キー認証プロファイルを通じて
  Codex 認証を利用できること。

認証の優先順位、環境分離、カスタム app-server コマンド、モデル
検出、すべての設定フィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## クイックスタート

OpenClaw で Codex を使いたいほとんどのユーザーは、このパスを求めています: 
ChatGPT/Codex サブスクリプションでサインインし、バンドルされた `codex` Plugin を有効にし、
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

Plugin 設定を変更した後は Gateway を再起動してください。既存のチャットにすでに
セッションがある場合は、ランタイム変更をテストする前に `/new` または `/reset` を使用し、
次のターンが現在の設定からハーネスを解決するようにします。

## 設定

クイックスタート設定は、実用最小限の Codex ハーネス設定です。Codex
ハーネスオプションは OpenClaw 設定で設定し、CLI は Codex 認証にのみ使用します:

| 必要なこと                               | 設定                                                                             | 場所                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| ハーネスを有効にする                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw 設定                      |
| allowlist された Plugin インストールを維持する | `plugins.allow` に `codex` を含める                                               | OpenClaw 設定                      |
| OpenAI エージェントターンを Codex 経由でルーティングする | `agents.defaults.model` または `agents.list[].model` を `openai/gpt-*` にする     | OpenClaw エージェント設定          |
| ChatGPT/Codex OAuth でサインインする     | `openclaw models auth login --provider openai`                                   | CLI 認証プロファイル               |
| Codex 実行用に API キーバックアップを追加する | サブスクリプション認証の後に `auth.order.openai` で列挙された `openai:*` API キープロファイル | CLI 認証プロファイル + OpenClaw 設定 |
| Codex が利用できない場合にフェイルクローズする | プロバイダーまたはモデルの `agentRuntime.id: "codex"`                            | OpenClaw モデル/プロバイダー設定   |
| 直接 OpenAI API トラフィックを使用する   | 通常の OpenAI 認証を伴うプロバイダーまたはモデルの `agentRuntime.id: "openclaw"` | OpenClaw モデル/プロバイダー設定   |
| app-server の動作を調整する              | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin 設定                  |
| ネイティブ Codex Plugin アプリを有効にする | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex Plugin 設定                  |
| Codex Computer Use を有効にする          | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin 設定                  |

Codex バックエンドの OpenAI エージェントターンには `openai/gpt-*` モデル参照を使用します。
サブスクリプション優先/API キーバックアップの順序には
`auth.order.openai` を推奨します。既存のレガシー Codex 認証プロファイル ID と
レガシー Codex 認証順序は doctor 専用のレガシー状態です。新しいレガシー Codex GPT 参照は
書き込まないでください。

Codex バックエンドのエージェントでは、`compaction.model` または `compaction.provider` を設定しないでください。
Codex はネイティブの app-server スレッド状態を通じて圧縮するため、OpenClaw は実行時に
それらのローカル要約器オーバーライドを無視し、エージェントが Codex を使用している場合は
`openclaw doctor --fix` がそれらを削除します。

Lossless は、Codex ターン周辺のアセンブリ、取り込み、メンテナンスのためのコンテキストエンジンとして
引き続きサポートされます。`agents.defaults.compaction.provider` ではなく、
`plugins.slots.contextEngine: "lossless-claw"` と
`plugins.entries.lossless-claw.config.summaryModel` を通じて設定してください。
Codex がアクティブなランタイムの場合、`openclaw doctor --fix` は古い
`compaction.provider: "lossless-claw"` 形状を Lossless コンテキストエンジンスロットへ
移行しますが、ネイティブ Codex は引き続き Compaction を所有します。

ネイティブ Codex app-server ハーネスは、事前プロンプトアセンブリを必要とする
コンテキストエンジンをサポートします。`codex-cli` を含む汎用 CLI バックエンドは、
そのホスト機能を提供しません。

Codex バックエンドのエージェントでは、`/compact` はバインドされたスレッド上でネイティブ Codex app-server Compaction を開始します。
OpenClaw は完了を待たず、OpenClaw タイムアウトを課さず、共有 app-server を再起動せず、
コンテキストエンジンや公開 OpenAI 要約器へフォールバックしません。ネイティブ Codex スレッドバインディングが欠落している、または
古い場合、このコマンドはフェイルクローズし、オペレーターが Compaction バックエンドを
静かに切り替えるのではなく、実際のランタイム境界を確認できるようにします。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

その形状では、どちらのプロファイルも `openai/gpt-*` エージェントターンで Codex 経由のままです。
API キーは認証フォールバックにすぎず、OpenClaw や
プレーンな OpenAI Responses へ切り替える要求ではありません。

このページの残りでは、ユーザーが選ぶ必要のある一般的なバリエーションを扱います:
デプロイ形状、フェイルクローズルーティング、ガーディアン承認ポリシー、ネイティブ Codex
Plugin、Computer Use です。完全なオプション一覧、デフォルト、列挙値、検出、
環境分離、タイムアウト、app-server トランスポートフィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## Codex ランタイムを検証する

Codex を想定しているチャットで `/status` を使用します。Codex バックエンドの OpenAI エージェント
ターンでは次のように表示されます:

```text
Runtime: OpenAI Codex
```

次に Codex app-server 状態を確認します:

```text
/codex status
/codex models
```

`/codex status` は app-server 接続、アカウント、レート制限、MCP
サーバー、Skills を報告します。`/codex models` は、ハーネスとアカウント用の
ライブ Codex app-server カタログを一覧表示します。`/status` が予想外の場合は、
[トラブルシューティング](#troubleshooting)を参照してください。

## ルーティングとモデル選択

プロバイダー参照とランタイムポリシーは分けてください:

- Codex 経由の OpenAI エージェントターンには `openai/gpt-*` を使用します。
- 設定でレガシー Codex GPT 参照を使用しないでください。`openclaw doctor --fix` を実行して
  レガシー参照と古いセッションルートピンを修復します。
- `agentRuntime.id: "codex"` は通常の OpenAI 自動モードでは任意ですが、
  Codex が利用できない場合にデプロイをフェイルクローズさせたいときに便利です。
- `agentRuntime.id: "openclaw"` は、それが意図的な場合に、プロバイダーまたはモデルを OpenClaw
  埋め込みランタイムへオプトインします。
- `/codex ...` はチャットからネイティブ Codex app-server 会話を制御します。
- ACP/acpx は別の外部ハーネスパスです。ユーザーが ACP/acpx または外部ハーネスアダプターを求めた場合にのみ使用します。

一般的なコマンドルーティング:

| ユーザーの意図                                      | 使用するもの                                                                                          |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 現在のチャットをアタッチする                         | `/codex bind [--cwd <path>]`                                                                          |
| 既存の Codex スレッドを再開する                       | `/codex resume <thread-id>`                                                                           |
| Codex スレッドを一覧表示またはフィルターする          | `/codex threads [filter]`                                                                             |
| ネイティブ Codex Plugin を一覧表示する                | `/codex plugins list`                                                                                 |
| 設定済みのネイティブ Codex Plugin を有効または無効にする | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| ペアリングされたノード上の既存 Codex CLI セッションをアタッチする | `/codex sessions --host <node> [filter]`, then `/codex resume <session-id> --host <node> --bind here` |
| Codex フィードバックのみを送信する                    | `/codex diagnostics [note]`                                                                           |
| ACP/acpx タスクを開始する                             | ACP/acpx セッションコマンド。`/codex` ではありません                                                  |

| ユースケース                                             | 設定                                                              | 検証                                  | 注記                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| ネイティブ Codex ランタイムを使う ChatGPT/Codex サブスクリプション | 有効化済みの `codex` plugin と `openai/gpt-*`                             | `/status` に `Runtime: OpenAI Codex` が表示される | 推奨パス                      |
| Codex を利用できない場合にフェイルクローズする                  | Provider またはモデル `agentRuntime.id: "codex"`                           | 埋め込みフォールバックではなくターンが失敗する | Codex 専用デプロイで使用        |
| OpenClaw 経由で OpenAI API キーのトラフィックを直接送る       | Provider またはモデル `agentRuntime.id: "openclaw"` と通常の OpenAI 認証 | `/status` に OpenClaw ランタイムが表示される        | OpenClaw が意図した経路の場合のみ使用 |
| レガシー設定                                        | レガシー Codex GPT 参照                                                  | `openclaw doctor --fix` が書き換える     | この方法で新しい設定を書かない      |
| ACP/acpx Codex アダプター                               | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP タスク/セッションの状態                 | ネイティブ Codex ハーネスとは別    |

`agents.defaults.imageModel` も同じプレフィックス分割に従います。通常の OpenAI 経路には `openai/gpt-*`
を使用し、画像理解を境界付けられた Codex アプリサーバーターン経由で実行する必要がある場合のみ
`codex/gpt-*` を使用します。レガシー Codex GPT 参照は使用しないでください。doctor はそのレガシープレフィックスを `openai/gpt-*` に書き換えます。

## デプロイパターン

### 基本的な Codex デプロイ

すべての OpenAI エージェントターンで既定で Codex を使う必要がある場合は、クイックスタート設定を使用します。

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

### 混在 Provider デプロイ

この形は Claude を既定のエージェントのままにし、名前付きの Codex エージェントを追加します。

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

この設定では、`main` エージェントは通常の Provider パスを使用し、`codex` エージェントは Codex アプリサーバーを使用します。

### フェイルクローズ Codex デプロイ

OpenAI エージェントターンでは、バンドルされた plugin が利用可能な場合、`openai/gpt-*` はすでに Codex に解決されます。明文化されたフェイルクローズルールが必要な場合は、明示的なランタイムポリシーを追加します。

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

Codex が強制されている場合、Codex plugin が無効、アプリサーバーが古すぎる、またはアプリサーバーを起動できないと、OpenClaw は早期に失敗します。

## アプリサーバーポリシー

既定では、plugin は OpenClaw が管理する Codex バイナリを stdio トランスポートでローカル起動します。別の実行ファイルを意図的に実行したい場合のみ `appServer.command` を設定します。アプリサーバーがすでに別の場所で実行されている場合のみ WebSocket トランスポートを使用します。

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

ローカル stdio アプリサーバーセッションは、信頼されたローカルオペレーターの姿勢を既定にします:
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"` です。ローカル Codex 要件でこの暗黙の YOLO 姿勢が許可されない場合、OpenClaw は代わりに許可された Guardian 権限を選択します。
セッションで OpenClaw サンドボックスが有効な場合、OpenClaw は Codex ホスト側のサンドボックスに依存する代わりに、そのターンについて Codex ネイティブ Code Mode、ユーザー MCP サーバー、アプリ支援 plugin 実行を無効にします。通常の exec/process ツールが利用可能な場合、シェルアクセスは `sandbox_exec` や
`sandbox_process` などの OpenClaw サンドボックス支援の動的ツール経由で公開されます。

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
Guardian レビュー済み承認にマップします。通常、ローカル要件でこれらの値が許可される場合は
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および
`sandbox: "workspace-write"` になります。
`tools.exec.mode: "auto"` では、OpenClaw はレガシーの安全でない Codex
`approvalPolicy: "never"` または `sandbox: "danger-full-access"` オーバーライドを保持しません。意図的な承認なし Codex 姿勢には
`tools.exec.mode: "full"` を使用します。レガシーの `plugins.entries.codex.config.appServer.mode: "guardian"` プリセットは引き続き機能しますが、`tools.exec.mode: "auto"` が正規化された OpenClaw サーフェスです。

ホスト exec 承認および ACPX 権限とのモードレベルの比較については、[権限モード](/ja-JP/tools/permission-modes)を参照してください。

すべてのアプリサーバーフィールド、認証順序、環境分離、検出、タイムアウト動作については、[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## コマンドと診断

バンドルされた plugin は、OpenClaw テキストコマンドをサポートする任意のチャンネルで、`/codex` をスラッシュコマンドとして登録します。

一般的な形式:

- `/codex status` は、アプリサーバー接続、モデル、アカウント、レート制限、MCP サーバー、Skills を確認します。
- `/codex models` は、稼働中の Codex アプリサーバーモデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex アプリサーバースレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex スレッドにアタッチします。
- `/codex compact` は、アタッチされたスレッドを compact するよう Codex アプリサーバーに依頼します。
- `/codex review` は、アタッチされたスレッドの Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、アタッチされたスレッドの Codex フィードバックを送信する前に確認します。
- `/codex account` は、アカウントとレート制限の状態を表示します。
- `/codex mcp` は、Codex アプリサーバー MCP サーバーの状態を一覧表示します。
- `/codex skills` は、Codex アプリサーバー Skills を一覧表示します。

ほとんどのサポート報告では、バグが発生した会話で `/diagnostics [note]` から始めます。これは 1 つの Gateway 診断レポートを作成し、Codex ハーネスセッションでは、関連する Codex フィードバックバンドルを送信する承認を求めます。プライバシーモデルとグループチャットの動作については、[診断エクスポート](/ja-JP/gateway/diagnostics)を参照してください。

完全な Gateway 診断バンドルなしで、現在アタッチされているスレッドの Codex フィードバックアップロードを特に必要とする場合のみ、`/codex diagnostics [note]` を使用します。

### Codex スレッドをローカルで調べる

問題のある Codex 実行を調べる最速の方法は、多くの場合、ネイティブ Codex スレッドを直接開くことです。

```bash
codex resume <thread-id>
```

完了した `/diagnostics` の返信、`/codex binding`、または
`/codex threads [filter]` からスレッド ID を取得します。

アップロードの仕組みとランタイムレベルの診断境界については、
[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#codex-feedback-upload)を参照してください。

認証は次の順序で選択されます。

1. エージェントの順序付き OpenAI 認証プロファイル。できれば
   `auth.order.openai` 配下に置きます。古いレガシー Codex 認証プロファイル ID とレガシー Codex 認証順序を移行するには、`openclaw doctor --fix` を実行します。
2. そのエージェントの Codex ホームにあるアプリサーバーの既存アカウント。
3. ローカル stdio アプリサーバー起動の場合のみ、アプリサーバーアカウントが存在せず、OpenAI 認証がまだ必要な場合に、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを見つけると、生成される Codex 子プロセスから
`CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーを embeddings や直接の OpenAI モデルで利用可能なままにしつつ、ネイティブ Codex アプリサーバーターンが誤って API 経由で課金されないようにします。
明示的な Codex API キープロファイルとローカル stdio env キーフォールバックは、継承された子プロセス env ではなくアプリサーバーログインを使用します。WebSocket アプリサーバー接続は Gateway env API キーフォールバックを受け取りません。明示的な認証プロファイル、またはリモートアプリサーバー自身のアカウントを使用してください。
ネイティブ Codex plugins が設定されている場合、OpenClaw は plugin 所有のアプリを Codex スレッドに公開する前に、接続されたアプリサーバー経由でそれらの plugins をインストールまたは更新します。`app/list` はアプリ ID、アクセシビリティ、メタデータの信頼できる情報源のままですが、OpenClaw はスレッドごとの有効化判断を所有します。ポリシーが一覧表示されたアクセス可能なアプリを許可する場合、`app/list` が現在そのアプリを無効として報告していても、OpenClaw は
`thread/start.config.apps[appId].enabled = true` を送信します。このパスは未知の ID に対するアプリインストールを作り出しません。OpenClaw は marketplace plugins を `plugin/install` でアクティブ化してから、インベントリを更新するだけです。

サブスクリプションプロファイルが Codex 使用制限に達した場合、Codex がリセット時刻を報告していれば OpenClaw はそれを記録し、同じ Codex 実行について次の順序付き認証プロファイルを試します。リセット時刻を過ぎると、選択された `openai/gpt-*` モデルや Codex ランタイムを変更しなくても、サブスクリプションプロファイルは再び利用可能になります。

ローカル stdio アプリサーバー起動では、OpenClaw は `CODEX_HOME` をエージェントごとのディレクトリに設定します。これにより、Codex 設定、認証/アカウントファイル、plugin キャッシュ/データ、ネイティブスレッド状態は、既定ではオペレーター個人の `~/.codex` を読み書きしません。OpenClaw は通常のプロセス `HOME` を保持します。Codex が実行するサブプロセスは引き続きユーザーホームの設定とトークンを見つけることができ、Codex は共有された
`$HOME/.agents/skills` と `$HOME/.agents/plugins/marketplace.json` エントリを検出する場合があります。

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

`appServer.clearEnv` は、生成される Codex アプリサーバー子プロセスにのみ影響します。
OpenClaw はローカル起動の正規化中に、このリストから `CODEX_HOME` と `HOME` を削除します。`CODEX_HOME` はエージェントごとのままになり、`HOME` はサブプロセスが通常のユーザーホーム状態を使用できるよう継承されたままになります。

Codex の動的ツールは、デフォルトで `searchable` 読み込みになります。OpenClaw は、Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません: `read`、`write`、
`edit`、`apply_patch`、`exec`、`process`、`update_plan`。メッセージング、メディア、Cron、ブラウザー、ノード、
Gateway、`heartbeat_respond` など、残りのほとんどの
OpenClaw 統合ツールは、`openclaw` 名前空間の Codex ツール検索から利用でき、初期モデルコンテキストを小さく保ちます。Web 検索は、検索が有効で管理プロバイダーが選択されていない場合、デフォルトで Codex のホスト型 `web_search` ツールを使用します。ネイティブのホスト型検索と OpenClaw の管理対象
`web_search` 動的ツールは相互に排他的なため、管理対象検索がネイティブのドメイン制限を回避することはできません。ホスト型検索を利用できない、明示的に無効化されている、または選択された管理プロバイダーに置き換えられている場合、OpenClaw は管理対象ツールを使用します。
OpenClaw は Codex のスタンドアロン `web.run` 拡張を無効のままにします。本番アプリサーバーのトラフィックでは、そのユーザー定義の `web` 名前空間が拒否されるためです。
`tools.web.search.enabled: false` は両方の経路を無効化します。ツールが無効化された
LLM のみの実行でも同様です。Codex は `"cached"` を設定の希望として扱い、制限のないアプリサーバーターンではライブの外部アクセスに解決します。ネイティブの `allowedDomains` が設定されている場合、自動の管理対象フォールバックはフェイルクローズし、許可リストを回避できないようにします。永続的な有効検索ポリシーの変更では、次のターンの前にバインドされた Codex
スレッドをローテーションします。一時的なターン単位の制限では、一時的な制限付きスレッドを使用し、後で再開できるように既存のバインディングを保持します。
`sessions_yield` とメッセージツールのみのソース返信は、それらがターン制御契約であるため直接のままです。`sessions_spawn` は検索可能なままにし、Codex のネイティブ `spawn_agent` が主要な Codex サブエージェント面であり続けるようにします。一方で、明示的な
OpenClaw または ACP の委任は、引き続き `openclaw` 動的ツール名前空間から利用できます。Heartbeat コラボレーション指示では、ツールがまだ読み込まれていない場合、Heartbeat ターンを終了する前に
`heartbeat_respond` を検索するよう Codex に伝えます。

遅延された動的ツールを検索できないカスタム Codex
アプリサーバーに接続する場合、または完全なツールペイロードをデバッグする場合にのみ、`codexDynamicToolsLoading: "direct"` を設定してください。

サポートされるトップレベルの Codex Plugin フィールド:

| フィールド                 | デフォルト   | 意味                                                                                     |
| -------------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw 動的ツールを初期 Codex ツールコンテキストに直接入れるには `"direct"` を使用します。 |
| `codexDynamicToolsExclude` | `[]`         | Codex アプリサーバーターンから除外する追加の OpenClaw 動的ツール名。                    |
| `codexPlugins`             | 無効         | 移行済みのソースインストール済みキュレート Plugin 向けの、ネイティブ Codex Plugin/アプリサポート。 |

サポートされる `appServer` フィールド:

| フィールド                                    | デフォルト                                             | 意味                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` は Codex を起動し、`"websocket"` は `url` に接続します。                                                                                                                                                                                                                                                                                                                               |
| `command`                                     | 管理対象の Codex バイナリ                              | stdio トランスポート用の実行可能ファイル。管理対象のバイナリを使う場合は未設定のままにし、明示的に上書きする場合のみ設定します。                                                                                                                                                                                                                                                              |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポート用の引数。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                      |
| `authToken`                                   | 未設定                                                 | WebSocket トランスポート用の Bearer トークン。リテラル文字列、または `${CODEX_APP_SERVER_TOKEN}` のような SecretInput を受け付けます。                                                                                                                                                                                                                                                          |
| `headers`                                     | `{}`                                                   | 追加の WebSocket ヘッダー。ヘッダー値には、たとえば `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"` のように、リテラル文字列または SecretInput 値を指定できます。                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除される追加の環境変数名。OpenClaw はローカル起動のために、エージェントごとの `CODEX_HOME` と継承された `HOME` を保持します。                                                                                                                                                                                       |
| `codeModeOnly`                                | `false`                                                | Codex のコードモード専用ツールサーフェスにオプトインします。OpenClaw の動的ツールは引き続き Codex に登録されるため、ネストされた `tools.*` 呼び出しは app-server の `item/tool/call` ブリッジ経由で返ります。                                                                                                                                                                                 |
| `remoteWorkspaceRoot`                         | 未設定                                                 | リモート Codex app-server のワークスペースルート。設定すると、OpenClaw は解決済みの OpenClaw ワークスペースからローカルワークスペースルートを推論し、このリモートルート配下で現在の cwd サフィックスを保持し、最終的な app-server cwd だけを Codex に送信します。cwd が解決済みの OpenClaw ワークスペースルート外にある場合、OpenClaw は Gateway ローカルのパスをリモート app-server に送信せず、安全側に失敗します。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server コントロールプレーン呼び出しのタイムアウト。                                                                                                                                                                                                                                                                                                                                         |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex がターンを受け入れた後、またはターンスコープの app-server リクエスト後に、OpenClaw が `turn/completed` を待機する間の静かな時間枠。                                                                                                                                                                                                                                                       |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw が `turn/completed` を待機する間に、ツール引き渡し、ネイティブツール完了、ツール後の未加工アシスタント進行状況、未加工推論完了、または推論進行状況の後で使われる、完了アイドルと進行状況のガード。ツール後の合成が最終アシスタント送出予算より正当に長く静かな状態を維持しうる、信頼済みまたは重いワークロードに使用します。                              |
| `mode`                                        | ローカル Codex 要件が YOLO を許可しない場合を除き `"yolo"` | YOLO または guardian レビュー付き実行のプリセット。`danger-full-access`、`never` 承認、または `user` レビュアーを省略するローカル stdio 要件では、暗黙のデフォルトが guardian になります。                                                                                                                                                                                                     |
| `approvalPolicy`                              | `"never"` または許可された guardian 承認ポリシー       | スレッドの開始、再開、ターンに送信されるネイティブ Codex 承認ポリシー。guardian のデフォルトは、許可されている場合 `"on-request"` を優先します。                                                                                                                                                                                                                                               |
| `sandbox`                                     | `"danger-full-access"` または許可された guardian サンドボックス | スレッドの開始、再開に送信されるネイティブ Codex サンドボックスモード。guardian のデフォルトは、許可されている場合 `"workspace-write"` を優先し、それ以外の場合は `"read-only"` を優先します。OpenClaw サンドボックスが有効な場合、`danger-full-access` ターンは OpenClaw サンドボックスの egress 設定から派生したネットワークアクセスを伴う Codex `workspace-write` を使用します。 |
| `approvalsReviewer`                           | `"user"` または許可された guardian レビュアー          | 許可されている場合は `"auto_review"` を使って Codex にネイティブ承認プロンプトをレビューさせ、それ以外の場合は `guardian_subagent` または `user` を使用します。`guardian_subagent` はレガシーエイリアスとして残っています。                                                                                                                                                                  |
| `serviceTier`                                 | 未設定                                                 | 任意の Codex app-server サービス階層。`"priority"` は fast-mode ルーティングを有効にし、`"flex"` は flex 処理を要求し、`null` は上書きをクリアします。レガシーの `"fast"` は `"priority"` として受け入れられます。                                                                                                                                                                             |
| `networkProxy`                                | 無効                                                   | app-server コマンド用の Codex 権限プロファイルネットワーキングにオプトインします。OpenClaw は `sandbox` を送信する代わりに、選択された `permissions.<profile>.network` 設定を定義し、`default_permissions` でそれを選択します。                                                                                                                                                               |
| `experimental.sandboxExecServer`              | `false`                                                | ネイティブ Codex 実行を有効な OpenClaw サンドボックス内で実行できるように、OpenClaw サンドボックスで裏付けられた Codex 環境を Codex app-server 0.132.0 以降に登録するプレビュー用オプトイン。                                                                                                                                                                                                 |

`appServer.networkProxy` は Codex サンドボックス契約を変更するため明示的です。
有効にすると、OpenClaw は Codex スレッド設定に `features.network_proxy.enabled` と
`default_permissions` も設定し、生成された権限プロファイルが Codex 管理ネットワーキングを
開始できるようにします。デフォルトでは、OpenClaw はプロファイル本文から衝突に強い
`openclaw-network-<fingerprint>` プロファイル名を生成します。安定したローカル名が必要な場合のみ
`profileName` を使用してください。

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

通常の app-server ランタイムが `danger-full-access` になる場合でも、
`networkProxy` を有効にすると、生成された権限プロファイルにはワークスペース形式の
ファイルシステムアクセスが使用されます。Codex 管理ネットワーク強制はサンドボックス化されたネットワーキングであるため、
フルアクセスプロファイルでは送信トラフィックを保護できません。
ドメインエントリは `allow` または `deny` を使用し、Unix ソケットエントリは Codex の
`allow` または `none` 値を使用します。

OpenClaw が所有する動的ツール呼び出しは、
`appServer.requestTimeoutMs` とは独立して制限されます。Codex の `item/tool/call` リクエストは、デフォルトで 90 秒の
OpenClaw ウォッチドッグを使用します。呼び出しごとの正の `timeoutMs` 引数は、その特定のツール予算を延長または短縮します。`image_generate` ツールは、ツール呼び出しが独自のタイムアウトを提供しない場合は
`agents.defaults.imageGenerationModel.timeoutMs` を使用し、それ以外の場合は 120 秒の画像生成デフォルトを使用します。
メディア理解の `image` ツールは、
`tools.media.image.timeoutSeconds` または 60 秒のメディアデフォルトを使用します。画像理解では、このタイムアウトはリクエスト自体に適用され、事前の準備作業によって短縮されません。動的ツール予算は
600000 ms に上限設定されます。タイムアウト時、OpenClaw はサポートされている場合にツールシグナルを中止し、失敗した動的ツールレスポンスを Codex に返すため、セッションを `processing` のままにせずターンを続行できます。
このウォッチドッグは外側の動的 `item/tool/call` 予算です。プロバイダー固有のリクエストタイムアウトはその呼び出し内で実行され、独自のタイムアウトセマンティクスを維持します。

Codex がターンを受け入れた後、および OpenClaw がターンスコープの
app-server リクエストに応答した後、ハーネスは Codex が現在のターンで進捗し、最終的に `turn/completed` でネイティブターンを終了することを期待します。app-server が
`appServer.turnCompletionIdleTimeoutMs` の間沈黙すると、OpenClaw はベストエフォートで Codex ターンを割り込み、診断タイムアウトを記録し、OpenClaw セッションレーンを解放して、後続のチャットメッセージが古いネイティブターンの後ろでキューに入らないようにします。同じターンのほとんどの非終端通知は、Codex がターンがまだ生きていることを証明しているため、その短いウォッチドッグを解除します。ツール引き渡しでは、より長いツール後アイドル予算を使用します。OpenClaw が `item/tool/call`
レスポンスを返した後、`commandExecution` などのネイティブツール項目が完了した後、生の
`custom_tool_call_output` 完了後、およびツール後の生アシスタント進捗、生 reasoning 完了、または reasoning 進捗後です。このガードは、設定されている場合は
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` を使用し、それ以外の場合はデフォルトで 5 分になります。同じツール後予算は、Codex が次の現在ターンイベントを発行する前の無音合成ウィンドウの進捗ウォッチドッグも延長します。レート制限更新などのグローバル app-server 通知は、ターンアイドル進捗をリセットしません。reasoning 完了、commentary
`agentMessage` 完了、およびツール前の生 reasoning またはアシスタント進捗の後には自動最終返信が続く可能性があるため、セッションレーンを即座に解放する代わりに、進捗後返信ガードを使用します。最終/非 commentary の完了済み `agentMessage` 項目と、ツール前の生アシスタント完了だけがアシスタント出力解放を準備します。その後 Codex が `turn/completed` なしで沈黙した場合、OpenClaw はベストエフォートでネイティブターンを割り込み、セッションレーンを解放します。アシスタント、ツール、アクティブ項目、または副作用の証拠がないターン完了アイドルタイムアウトを含む、リプレイ安全な stdio app-server 障害は、新しい app-server 試行で 1 回再試行されます。安全でないタイムアウトでも、停止した app-server クライアントを廃止し、OpenClaw セッションレーンを解放します。また、自動的にリプレイする代わりに、古いネイティブスレッドバインディングをクリアします。完了監視タイムアウトは Codex 固有のタイムアウト文言を表示します。リプレイ安全なケースではレスポンスが不完全な可能性があると伝え、安全でないケースでは再試行前に現在の状態を確認するようユーザーに伝えます。公開タイムアウト診断には、最後の app-server 通知メソッド、生アシスタントレスポンス項目の id/type/role、アクティブなリクエスト/項目数、準備済みウォッチ状態などの構造化フィールドが含まれます。最後の通知が生アシスタントレスポンス項目である場合、境界付きのアシスタントテキストプレビューも含まれます。生プロンプトやツール内容は含まれません。

ローカルテスト用の環境オーバーライドは引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` は、
`appServer.command` が未設定の場合に管理対象バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、単発のローカルテストには
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。反復可能なデプロイでは、Codex ハーネス設定の残りと同じレビュー済みファイルに Plugin の挙動を保持できるため、設定が推奨されます。

## ネイティブ Codex plugins

ネイティブ Codex plugin サポートは、OpenClaw ハーネスターンと同じ Codex スレッド内で、Codex app-server 独自のアプリおよび plugin 機能を使用します。OpenClaw は Codex plugins を合成 `codex_plugin_*` OpenClaw 動的ツールに変換しません。

`codexPlugins` は、ネイティブ Codex ハーネスを選択するセッションにのみ影響します。組み込みハーネス実行、通常の OpenAI プロバイダー実行、ACP 会話バインディング、その他のハーネスには影響しません。

最小の移行済み設定:

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

スレッドアプリ設定は、OpenClaw が Codex ハーネスセッションを確立するか、古い Codex スレッドバインディングを置き換えるときに計算されます。ターンごとには再計算されません。
`codexPlugins` を変更した後は、今後の Codex ハーネスセッションが更新されたアプリセットで開始されるように、`/new`、`/reset` を使用するか、Gateway を再起動してください。

移行適格性、アプリインベントリ、破壊的アクションポリシー、引き出し、ネイティブ plugin 診断については、
[ネイティブ Codex plugins](/ja-JP/plugins/codex-native-plugins) を参照してください。

OpenAI 側のアプリおよび plugin アクセスは、サインインしている Codex アカウントによって制御され、Business および Enterprise/Edu ワークスペースではワークスペースアプリ制御によっても制御されます。OpenAI のアカウントおよびワークスペース制御の概要については、
[ChatGPT プランで Codex を使用する](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
を参照してください。

## コンピューター操作

コンピューター操作は独自のセットアップガイドで説明されています:
[Codex コンピューター操作](/ja-JP/plugins/codex-computer-use)。

要約すると、OpenClaw はデスクトップ制御アプリをベンダリングせず、デスクトップアクション自体も実行しません。Codex app-server を準備し、
`computer-use` MCP サーバーが利用可能であることを検証し、その後 Codex モードのターン中に Codex がネイティブ MCP ツール呼び出しを所有できるようにします。

## ランタイム境界

Codex ハーネスが変更するのは、低レベルの埋め込みエージェント実行器だけです。

- OpenClaw 動的ツールはサポートされています。Codex は OpenClaw にそれらのツールの実行を依頼するため、OpenClaw は実行経路に残ります。
- Codex ネイティブのシェル、パッチ、MCP、ネイティブアプリツールは Codex が所有します。
  OpenClaw はサポートされているリレーを通じて選択されたネイティブイベントを観察またはブロックできますが、ネイティブツール引数を書き換えません。
- Codex はネイティブ Compaction を所有します。OpenClaw はチャンネル履歴、検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのためにトランスクリプトミラーを保持しますが、Codex compaction を OpenClaw または context-engine の要約器で置き換えることはありません。
- メディア生成、メディア理解、TTS、承認、メッセージングツール出力は、対応する OpenClaw プロバイダー/モデル設定を通じて継続します。
- `tool_result_persist` は OpenClaw が所有するトランスクリプトツール結果に適用され、Codex ネイティブツール結果レコードには適用されません。

フック層、サポートされる V1 サーフェス、ネイティブ権限処理、キュー誘導、Codex フィードバックアップロードの仕組み、compaction の詳細については、
[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime) を参照してください。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** 新しい設定では想定どおりです。`openai/gpt-*` モデルを選択し、
`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が
`codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく組み込みハーネスを使用する:** モデル参照が公式 OpenAI プロバイダー上の
`openai/gpt-*` であり、Codex Plugin がインストールされ、有効化されていることを確認してください。テスト中に厳密な証明が必要な場合は、プロバイダーまたはモデルの `agentRuntime.id: "codex"` を設定してください。強制された Codex ランタイムは、OpenClaw にフォールバックせず失敗します。

**OpenAI Codex ランタイムが API キーパスにフォールバックする:** モデル、ランタイム、選択されたプロバイダー、障害を示す、編集済みの
gateway 抜粋を収集してください。影響を受ける共同作業者に、OpenClaw ホストでこの読み取り専用コマンドを実行するよう依頼してください。

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
`No API key` の結果が含まれます。修正後の実行では、単なる OpenAI API キー失敗ではなく、OpenAI OAuth パスが表示されるはずです。

**レガシー Codex モデル参照設定が残っている:** `openclaw doctor --fix` を実行してください。
Doctor はレガシーモデル参照を `openai/*` に書き換え、古いセッションおよびエージェント全体のランタイム固定を削除し、既存の認証プロファイルオーバーライドを保持します。

**app-server が拒否される:** Codex app-server `0.125.0` 以降を使用してください。
`0.125.0-alpha.2` や `0.125.0+custom` などの同一バージョンのプレリリースまたはビルドサフィックス付きバージョンは、OpenClaw が安定版 `0.125.0` プロトコル下限をテストするため拒否されます。

**`/codex status` が接続できない:** バンドルされた `codex` Plugin が有効であること、許可リストが設定されている場合は `plugins.allow` にそれが含まれていること、およびカスタム `appServer.command`、`url`、`authToken`、またはヘッダーが有効であることを確認してください。

**モデル検出が遅い:** 
`plugins.entries.codex.config.discovery.timeoutMs` を下げるか、検出を無効化してください。[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference#model-discovery) を参照してください。

**WebSocket トランスポートが即座に失敗する:** `appServer.url`、`authToken`、ヘッダー、およびリモート app-server が同じ Codex app-server プロトコルバージョンを話すことを確認してください。

**ネイティブシェルまたはパッチツールが `Native hook relay unavailable` でブロックされる:**
Codex スレッドが、OpenClaw に登録されなくなったネイティブフックリレー id をまだ使用しようとしています。これはネイティブ Codex フックトランスポートの問題であり、ACP バックエンド、プロバイダー、GitHub、またはシェルコマンドの障害ではありません。影響を受けるチャットで `/new` または `/reset` を使って新しいセッションを開始し、その後無害なコマンドを再試行してください。一度は機能するが次のネイティブツール呼び出しで再び失敗する場合は、`/new` を一時的な回避策としてのみ扱ってください。Codex app-server または OpenClaw Gateway を再起動して古いスレッドを破棄し、ネイティブフック登録が再作成された後、プロンプトを新しいセッションにコピーしてください。

**非 Codex モデルが組み込みハーネスを使用する:** プロバイダーまたはモデルのランタイムポリシーが別のハーネスにルーティングしない限り、これは想定どおりです。通常の非 OpenAI プロバイダー参照は、`auto` モードでは通常のプロバイダーパスに留まります。

**Computer Use はインストールされているがツールが実行されない:** 新しいセッションから
`/codex computer-use status` を確認します。ツールが
`Native hook relay unavailable` を報告する場合は、上記のネイティブフックリレー復旧を使用します。詳しくは
[Codex Computer Use](/ja-JP/plugins/codex-computer-use#troubleshooting) を参照してください。

## 関連

- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)
- [Codex Computer Use](/ja-JP/plugins/codex-computer-use)
- [Agent ランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [OpenAI Codex ヘルプ](https://help.openai.com/en/collections/14937394-codex)
- [Agent ハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [Plugin フック](/ja-JP/plugins/hooks)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
- [ステータス](/ja-JP/cli/status)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
