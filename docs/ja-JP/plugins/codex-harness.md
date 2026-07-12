---
read_when:
    - 公式の Codex app-server ハーネスを使用する場合
    - Codex ハーネスの設定例が必要です
    - OpenClaw にフォールバックせず、Codex のみのデプロイを失敗させたい場合
summary: 公式 Codex app-server ハーネスを介して OpenClaw の組み込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-07-12T14:43:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5f6705dad9fa3bbe45c2f4eaf079ecb861b7911142bda1301c4d64a1f21a8ec5
    source_path: plugins/codex-harness.md
    workflow: 16
---

公式の `codex` Plugin は、組み込みの OpenClaw ハーネスではなく Codex
app-server を介して、埋め込み OpenAI エージェントターンを実行します。Codex は、
ネイティブなスレッド再開、ネイティブなツール継続、
ネイティブな Compaction、app-server 実行という低レベルのエージェントセッションを管理します。OpenClaw は引き続き、チャット
チャネル、セッションファイル、モデル選択、OpenClaw 動的ツール、承認、
メディア配信、および表示されるトランスクリプトのミラーを管理します。

`openai/gpt-5.6-sol` のような正規の OpenAI モデル参照を使用してください。従来の
Codex GPT 参照は設定せず、OpenAI エージェントの認証順序を `auth.order.openai` に設定してください。
従来の Codex 認証プロファイル ID と従来の Codex 認証順序エントリは、
`openclaw doctor --fix` によって修復されます。

プロバイダー／モデルのランタイムポリシーが未設定または `auto` の場合、`openai/*` プレフィックスだけで
このハーネスが選択されることはありません。OpenAI が Codex を暗黙的に選択できるのは、
正確な公式 HTTPS Platform Responses または ChatGPT Responses ルートで、かつ
明示的なリクエストオーバーライドがない場合に限られます。詳しくは
[OpenAI の暗黙的エージェントランタイム](/ja-JP/providers/openai#implicit-agent-runtime)を参照してください。
Platform と ChatGPT のどちらにルーティングされるかが判明する前に Codex が認証を管理する場合でも、OpenClaw は
すべての候補ルートが Codex 互換性を宣言することを要求します。ネイティブな
認証管理だけで、そのルート確認が省略されることはありません。

OpenClaw サンドボックスが有効でない場合、OpenClaw は Codex のネイティブコードモードを有効にして Codex app-server スレッドを
開始します（code-mode-only はデフォルトで無効のままです）。そのため、
ネイティブのワークスペース／コード機能を、app-server の `item/tool/call` ブリッジを介してルーティングされる OpenClaw
動的ツールと併用できます。有効な OpenClaw サンドボックスまたは制限付きツールポリシーがある場合は、
実験的なサンドボックス exec-server パスを明示的に有効にしない限り、ネイティブコードモードが
完全に無効になります。

デフォルトの `tools.exec.host: "auto"` で OpenClaw サンドボックスが有効でない場合、
Codex はペアリング済み Node 上でコマンドを実行するための `node_exec` ツールと `node_process` ツールも受け取ります。
ネイティブシェルは Codex app-server のホストとワークスペース上で動作し続けます
（デフォルトの stdio デプロイでは Gateway ローカル）。`node_exec` は名前または ID で Node を選択し、
OpenClaw の Node 承認ポリシーを引き続き適用します。

この Codex ネイティブ機能は、
汎用 OpenClaw 実行向けのオプトイン QuickJS-WASI ランタイムであり、
異なる `exec` 入力形式を使用する [OpenClaw コードモード](/ja-JP/reference/code-mode)とは別のものです。
モデル／プロバイダー／ランタイムのより広範な区分については、
[エージェントランタイム](/ja-JP/concepts/agent-runtimes)から確認してください。`openai/gpt-5.6-sol` はモデル
参照、`codex` はランタイム、Telegram、Discord、Slack、またはその他の
チャネルは通信サーフェスです。

## 要件

- 公式の `@openclaw/codex` Plugin がインストールされていること。設定で許可リストを使用している場合は、
  `plugins.allow` に `codex` を含めてください。
- Codex app-server `0.143.0` 以降。Plugin はデフォルトで互換性のある
  バイナリを管理するため、`PATH` 上の `codex` コマンドは通常の
  起動に影響しません。
- `openclaw models auth login --provider openai` による Codex 認証、
  エージェントの Codex ホームにすでに存在する app-server アカウント、または
  明示的な Codex API キー認証プロファイル。

認証の優先順位、環境の分離、カスタム app-server コマンド、
モデル検出、および全設定フィールドの一覧については、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## クイックスタート

公式 Plugin をインストールしてから、Codex OAuth でサインインします。

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

`codex` Plugin を有効にして、OpenAI エージェントモデルを選択します。

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
      model: "openai/gpt-5.6-sol",
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

Plugin 設定を変更した後は Gateway を再起動してください。チャットにすでに
セッションがある場合は、次のターンで現在の設定からハーネスが解決されるよう、
最初に `/new` または `/reset` を実行してください。

## Codex Desktop および CLI とスレッドを共有する

デフォルトの `appServer.homeScope: "agent"` は、各 OpenClaw エージェントを
オペレーターのネイティブ Codex 状態から分離します。所有者が Codex Desktop および Codex CLI に表示される
同じネイティブスレッドを検査および管理できるようにするには、
ユーザーの Codex ホームを明示的に有効にします。

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

ユーザーホームモードは、ローカルの管理対象 stdio プロセスまたは共有 Unix ソケット
トランスポートをサポートします。設定されている場合は `$CODEX_HOME`、それ以外の場合は `~/.codex` を使用し、
そのホームのネイティブ Codex 認証、設定、Plugin、スレッドストアも使用します。OpenClaw は
この app-server に OpenClaw 認証プロファイルを注入しません。

所有者のターンでは `codex_threads` ツールを使用できます。ネイティブスレッドの一覧表示、検索、読み取り、フォーク、名前変更、
アーカイブ、復元が可能です。OpenClaw で継続するにはスレッドをフォークしてください。
フォークは現在の OpenClaw セッションに接続され、他のネイティブ Codex クライアントからも
引き続き参照できます。アーカイブには、スレッドが他の場所で閉じられていることの明示的な
確認が必要です。監視も有効な場合、トランスクリプトフィールドと変更操作には、対応する
`supervision.allowRawTranscripts` または `supervision.allowWriteControls` のオプトインが必要です。

独立した管理対象 stdio App Server を介して同じスレッドを同時に再開または書き込みしないでください。
Codex は 1 つの App Server 内の同時書き込みを調整しますが、別々のプロセス間では
調整しません。通常のユーザーホーム stdio セッションでは、フォークが安全な共存方法です。

`appServer.homeScope: "user"` だけではフリートカタログは有効になりません。ネイティブセッションを
OpenClaw サイドバーに表示する場合は、`supervision.enabled: true` を使用してください。
監視は別の監視接続を使用します。明示的な `appServer` 接続設定がない場合、
通常のハーネスはエージェントスコープのままですが、この接続はデフォルトで管理対象の
ユーザーホーム stdio を使用します。明示的な `appServer` 設定は両方のパスで適用されます。通常のハーネスでも
ネイティブ状態を共有する場合は、上記のように `homeScope: "user"` を明示的に設定してください。

## Codex セッションを監視する

同じ `codex` Plugin で、Gateway コンピューターおよびオプトインしたペアリング済み Node から、
アーカイブされていない Codex セッションを一覧表示できます。保存済みまたはアイドル状態の Gateway ローカルセッションは、
永続化された範囲内のユーザーおよびアシスタント履歴をミラーする、モデル固定のチャットを作成できます。
そのプライベートバインディングは、ネイティブスナップショット、正規ブランチ、および後続ターンに監視接続を使用し、
通常の Codex セッションはエージェントスコープのままです。最初の正規開始では、
Codex がスナップショットのフォークに対して返すモデルとプロバイダーをそのまま使用します。
以降の再開では、選択は Codex のネイティブ設定に委ねられ、外側の OpenClaw モデルおよびフォールバックチェーンによって
置き換えられることはありません。保存済みおよびアイドル状態の行は、他に実行主体がないことを明示的に
確認した後にアーカイブできます。アクティブなソースからはブランチを作成できず、アーカイブもできませんが、既存の
監視対象チャットは引き続き開けます。ペアリング済み Node のセッションはメタデータ専用のままです。

セットアップ、ブランチルール、ペアリング済み Node の制限、メタデータ公開、およびトラブルシューティングについては、
[Codex セッションを監視する](/plugins/codex-supervision)を参照してください。

## 設定

| 目的                                                | 設定                                                                                              | 場所                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| ハーネスを有効にする                                  | `plugins.entries.codex.enabled: true`                                                            | OpenClaw 設定                    |
| アーカイブされていない Codex セッションを表示する                    | `plugins.entries.codex.config.supervision.enabled: true`                                         | Codex Plugin 設定                |
| 許可リストに登録された Plugin のインストールを維持する                  | `plugins.allow` に `codex` を含める                                                               | OpenClaw 設定                    |
| 対象となる OpenAI ターンで Codex の暗黙的使用を許可する | 正確な公式 HTTPS Responses／ChatGPT ルート、明示的なリクエストオーバーライドなし、ランタイム未設定／`auto` | OpenAI プロバイダー／モデル設定       |
| ChatGPT／Codex OAuth でサインインする                    | `openclaw models auth login --provider openai`                                                   | CLI 認証プロファイル                   |
| Codex 実行用の API キーバックアップを追加する                   | サブスクリプション認証の後に `auth.order.openai` に記載された `openai:*` API キープロファイル                 | CLI 認証プロファイル + OpenClaw 設定 |
| Codex が利用できない場合にフェイルクローズする               | プロバイダーまたはモデルの `agentRuntime.id: "codex"`                                                     | OpenClaw モデル／プロバイダー設定     |
| OpenAI API トラフィックを直接使用する                       | 通常の OpenAI 認証を使用した、プロバイダーまたはモデルの `agentRuntime.id: "openclaw"`                          | OpenClaw モデル／プロバイダー設定     |
| app-server の動作を調整する                            | `plugins.entries.codex.config.appServer.*`                                                       | Codex Plugin 設定                |
| ネイティブ Codex Plugin アプリを有効にする                     | `plugins.entries.codex.config.codexPlugins.*`                                                    | Codex Plugin 設定                |
| Codex Computer Use を有効にする                           | `plugins.entries.codex.config.computerUse.*`                                                     | Codex Plugin 設定                |

サブスクリプション優先／API キーバックアップの順序には、`auth.order.openai` を使用することを推奨します。
既存の従来の Codex 認証プロファイル ID と従来の Codex 認証順序は、
doctor 専用のレガシー状態です。新しい従来の Codex GPT 参照は記述しないでください。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Codex 互換の有効ルートでは、上記の両方のプロファイルが同じ Codex 実行の
候補として残ります。プロファイルの順序は認証情報を選択するものであり、ランタイムを選択するものではありません。
認証順序を変更しても、カスタム、Completions、HTTP、または
リクエストオーバーライドされたルートが Codex 互換になることはありません。

### Compaction

Codex を使用するエージェントには `compaction.model` または `compaction.provider` を
設定しないでください。Codex はネイティブ app-server スレッド状態を介して Compaction を行うため、
OpenClaw は実行時にこれらのローカル要約モデルのオーバーライドを無視し、
エージェントが Codex を使用している場合、`openclaw doctor --fix` がそれらを削除します。

Lossless は、Codex ターン前後のアセンブリ、取り込み、メンテナンス用のコンテキストエンジンとして引き続きサポートされます。
設定には `agents.defaults.compaction.provider` ではなく、
`plugins.slots.contextEngine: "lossless-claw"` と
`plugins.entries.lossless-claw.config.summaryModel` を使用します。Codex がアクティブなランタイムの場合、
`openclaw doctor --fix` は古い `compaction.provider: "lossless-claw"` 形式を
Lossless コンテキストエンジンスロットへ移行しますが、Compaction は引き続きネイティブ Codex が
管理します。ネイティブ app-server ハーネスは、プロンプト前のアセンブリを必要とするコンテキストエンジンを
サポートしますが、`codex-cli` を含む汎用 CLI バックエンドは、
そのホスト機能を提供しません。

Codex を使用するエージェントでは、`/compact` がバインド済みスレッド上でネイティブ Codex app-server の
Compaction を開始します。OpenClaw は完了を待機せず、
OpenClaw のタイムアウトを課さず、共有 app-server を再起動せず、
コンテキストエンジンまたは公開 OpenAI 要約モデルへフォールバックしません。ネイティブ Codex スレッドの
バインディングが欠落しているか古い場合、Compaction バックエンドを暗黙的に
切り替えるのではなく、コマンドはフェイルクローズします。

このページの残りでは、デプロイ形式、フェイルクローズルーティング、ガーディアン
承認ポリシー、ネイティブ Codex Plugin、および Computer Use について説明します。すべてのオプション
一覧、デフォルト、列挙値、検出、環境の分離、タイムアウト、および
app-server トランスポートフィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## Codex ランタイムを確認する

Codex を使用するチャットで `/status` を実行します。Codex を使用する OpenAI
エージェントターンでは、次のように表示されます。

```text
Runtime: OpenAI Codex
```

次に、Codex app-server の状態を確認します。

```text
/codex status
/codex models
```

`/codex status` は、app-server の接続状態、アカウント、レート制限、MCP
サーバー、および Skills を報告します。`/codex models` は、ハーネスとアカウントで利用できる
Codex app-server のライブカタログを一覧表示します。`/status` の結果が予想外の場合は、
[トラブルシューティング](#troubleshooting)を参照してください。

## ルーティングとモデルの選択

プロバイダー参照とランタイムポリシーは分けて扱ってください。

- 標準の OpenAI モデルを選択するには `openai/gpt-*` を使用します。プレフィックスだけで
  Codex が選択されることはありません。
- ランタイムが未設定または `auto` の場合、作成者によるリクエストのオーバーライドがない、
  公式の HTTPS Platform Responses または ChatGPT Responses への完全一致ルートだけが、
  Codex を暗黙的に選択できます。
- 設定では従来の Codex GPT 参照を使用しないでください。`openclaw doctor --fix` を実行して、
  従来の参照と古いセッションルートの固定設定を修復してください。
- `agentRuntime.id: "codex"` は、互換性のあるルートで Codex をフェイルクローズ要件にします。
  互換性のない実効ルートを互換性のあるものにするわけではありません。
- `agentRuntime.id: "openclaw"` は、意図している場合にプロバイダーまたはモデルで
  組み込みの OpenClaw ランタイムを使用するよう指定します。
- `/codex ...` は、チャットからネイティブ Codex app-server の会話を制御します。
- ACP/acpx は、独立した外部ハーネス経路です。ユーザーが ACP/acpx または外部ハーネスアダプターを
  要求した場合にのみ使用してください。

| ユーザーの意図                                             | 使用するもの                                                                                          |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 現在のチャットを接続する                                   | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| 既存の Codex スレッドを再開する                            | `/codex resume <thread-id>`                                                                           |
| Codex スレッドを一覧表示または絞り込む                     | `/codex threads [filter]`                                                                             |
| ネイティブ Codex plugins を一覧表示する                    | `/codex plugins list`                                                                                 |
| 設定済みのネイティブ Codex plugin を有効または無効にする   | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| 保存済み Codex CLI セッションをペア Node のターンとして再開する | `/codex sessions --host <node> [filter]`、次に `/codex resume <session-id> --host <node> --bind here` |
| コンピューター間の未アーカイブ Codex セッションを表示する  | Codex 監視を有効にして **Codex Sessions** を開く                                                      |
| 接続されたスレッドのモデル、高速モード、または権限を変更する | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| アクティブなターンを停止または誘導する                     | `/codex stop`, `/codex steer <text>`                                                                  |
| 現在の接続を解除する                                       | `/codex detach`（別名 `/codex unbind`）                                                               |
| Codex フィードバックのみを送信する                         | `/codex diagnostics [note]`                                                                           |
| ACP/acpx タスクを開始する                                  | `/codex` ではなく ACP/acpx セッションコマンド                                                        |

| ユースケース                                    | 設定                                                                                                        | 確認方法                                  | 注記                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------- |
| ネイティブ Codex ランタイムを使用できる OpenAI ルート | 作成者によるリクエストのオーバーライドがない、完全一致する公式 HTTPS Responses/ChatGPT ルートと、有効な `codex` plugin | `/status` に `Runtime: OpenAI Codex` と表示される | ランタイムが未設定または `auto` の場合の暗黙的な経路 |
| Codex が利用できない場合にフェイルクローズする  | プロバイダーまたはモデルの `agentRuntime.id: "codex"`                                                       | 組み込みへのフォールバックではなくターンが失敗する | Codex 専用デプロイメントに使用                 |
| OpenClaw 経由の OpenAI API キーによる直接通信   | プロバイダーまたはモデルの `agentRuntime.id: "openclaw"` と通常の OpenAI 認証                               | `/status` に OpenClaw ランタイムが表示される | OpenClaw の使用を意図している場合のみ使用      |
| 従来の設定                                      | 従来の Codex GPT 参照                                                                                       | `openclaw doctor --fix` が書き換える      | 新しい設定をこの方法で記述しないでください     |
| ACP/acpx Codex アダプター                       | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | ACP タスク／セッションの状態              | ネイティブ Codex ハーネスとは別                |

`agents.defaults.imageModel` も同じプレフィックス分割に従います。通常の OpenAI ルートには
`openai/gpt-*` を使用し、画像理解を範囲が限定された Codex app-server のターン経由で
実行する場合にのみ `codex/gpt-*` を使用してください。Doctor は従来の
Codex GPT 参照を `openai/gpt-*` に書き換えます。

## デプロイメントパターン

### 基本的な Codex デプロイメント

Codex を暗黙的に選択できる実効的な公式 HTTPS ルートを持つ OpenAI モデルには、
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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

### 混合プロバイダーデプロイメント

Claude を既定のエージェントとして維持し、名前付きの Codex エージェントを追加します。

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
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

`main` エージェントは通常のプロバイダー経路を使用します。`codex` エージェントは、
実効的な OpenAI ルートに互換性が維持されている場合に Codex app-server を使用します。
これをフェイルクローズ要件にする場合は、モデルスコープの
`agentRuntime.id: "codex"` を明示的に追加してください。

### フェイルクローズ Codex デプロイメント

バンドルされた plugin が利用可能な場合、条件を満たす完全一致の公式 HTTPS OpenAI ルートは
Codex に解決できます。明示的に記述されたフェイルクローズルールには、
ランタイムポリシーを追加します。

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
      model: "openai/gpt-5.6-sol",
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

Codex が強制されている場合、実効ルートが Codex 互換として宣言されていない、
plugin が無効、app-server が古すぎる、または app-server を起動できないと、
OpenClaw は早期に失敗します。

## App-server ポリシー

既定では、plugin は OpenClaw が管理する Codex バイナリを stdio トランスポートで
ローカルに起動します。別の実行可能ファイルを意図的に実行する場合にのみ
`appServer.command` を設定してください。WebSocket トランスポートは、
app-server がすでに別の場所で実行されている場合にのみ使用します。

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

ローカル stdio app-server セッションの既定値は、信頼されたローカルオペレーター向けの
構成です。具体的には、`approvalPolicy: "never"`、`approvalsReviewer: "user"`、
および `sandbox: "danger-full-access"` です。ローカルの Codex 要件がこの暗黙的な
YOLO 構成を許可しない場合、OpenClaw は代わりに許可されたガーディアン権限を選択します。
セッションで OpenClaw sandbox が有効な場合、OpenClaw は Codex ホスト側の
sandbox に依存するのではなく、そのターンで Codex ネイティブ Code Mode、
ユーザー MCP サーバー、およびアプリ連携 plugin の実行を無効にします。
代わりに、通常の exec/process ツールが利用可能な場合、シェルアクセスは
`sandbox_exec` や `sandbox_process` など、OpenClaw sandbox によって保護された
動的ツールを経由します。

sandbox の制約緩和や追加権限を使用する前に、Codex ネイティブの自動レビューには
正規化された OpenClaw exec モードを使用してください。

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

Codex app-server セッションでは、`tools.exec.mode: "auto"` は Codex
Guardian がレビューする承認に対応します。ローカル要件でこれらの値が許可される場合、
通常は `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、
および `sandbox: "workspace-write"` になります。`tools.exec.mode: "auto"` では、
OpenClaw は従来の安全でない Codex の `approvalPolicy: "never"` または
`sandbox: "danger-full-access"` のオーバーライドを維持しません。
意図的に承認なしの Codex 構成を使用するには、`tools.exec.mode: "full"` を使用してください。
従来の `plugins.entries.codex.config.appServer.mode: "guardian"` プリセットも
引き続き動作しますが、`tools.exec.mode: "auto"` が正規化された OpenClaw の設定面です。

ホストの exec 承認および ACPX 権限とのモードレベルの比較については、
[権限モード](/ja-JP/tools/permission-modes)を参照してください。すべての app-server フィールド、
認証順序、環境分離、およびタイムアウト動作については、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## コマンドと診断

`codex` plugin は、OpenClaw テキストコマンドをサポートするすべてのチャンネルで、
`/codex` をスラッシュコマンドとして登録します。

ネイティブ実行と制御には、所有者または `operator.admin` Gateway クライアントが必要です。
これには、スレッドの接続または再開、ターンの送信または停止、モデル、高速モード、
または権限状態の変更、圧縮またはレビュー、接続の解除が含まれます。
その他の認可済み送信者は、読み取り専用の状態、ヘルプ、アカウント、モデル、スレッド、
MCP サーバー、Skills、および接続確認コマンドを引き続き使用できます。

一般的な形式は次のとおりです。

- `/codex status` は app-server の接続状態、モデル、アカウント、レート制限、
  MCP サーバー、および Skills を確認します。
- `/codex models` は、稼働中の Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex app-server スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の
  Codex スレッドに接続します。
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  は、現在のチャットを接続します。
- `/codex detach`（または `/codex unbind`）は、現在の接続を解除します。
- `/codex binding` は、現在の接続を説明します。
- `/codex stop` はアクティブなターンを停止し、`/codex steer <text>` はそのターンを誘導します。
- `/codex model <model>`、`/codex fast [on|off|status]`、および
  `/codex permissions [default|yolo|status]` は、会話ごとの状態を変更します。
- `/codex compact` は、接続されたスレッドを圧縮するよう Codex app-server に要求します。
- `/codex review` は、接続されたスレッドに対する Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、接続されたスレッドの Codex フィードバックを
  送信する前に確認を求めます。
- `/codex account` は、アカウントとレート制限の状態を表示します。
- `/codex mcp` は、Codex app-server の MCP サーバーの状態を一覧表示します。
- `/codex skills` は、Codex app-server の Skills を一覧表示します。
- `/codex plugins list`、`/codex plugins enable <name>`、および
  `/codex plugins disable <name>` は、設定済みのネイティブ Codex plugins を管理します。
- `/codex computer-use [status|install]` は、Codex Computer Use を管理します。
- `/codex help` は、コマンドツリー全体を一覧表示します。

ほとんどのサポート報告では、バグが発生した会話で
`/diagnostics [note]` を実行することから始めます。これにより、1 件の Gateway 診断
レポートが作成され、Codex ハーネスセッションの場合は、関連する Codex フィードバック
バンドルを送信するための承認が求められます。プライバシーモデルとグループ
チャットでの動作については、[診断のエクスポート](/ja-JP/gateway/diagnostics)を参照してください。
完全な Gateway 診断バンドルを含めず、現在アタッチされているスレッドの Codex
フィードバックのみをアップロードしたい場合に限り、`/codex diagnostics [note]` を使用します。

### Codex スレッドをローカルで調査する

問題のある Codex 実行を調査する最も速い方法は、多くの場合、ネイティブの
Codex スレッドを直接開くことです。

```bash
codex resume <thread-id>
```

完了した `/diagnostics` の返信、`/codex binding`、または
`/codex threads [filter]` からスレッド ID を取得します。

アップロードの仕組みとランタイムレベルの診断境界については、
[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#codex-feedback-upload)を参照してください。

### 認証順序

デフォルトのエージェント単位のホームでは、認証は次の順序で選択されます。

1. エージェント用に順序付けられた OpenAI 認証プロファイル。可能であれば
   `auth.order.openai` で指定します。古いレガシー Codex 認証プロファイル ID と
   レガシー Codex 認証順序を移行するには、`openclaw doctor --fix` を実行します。
2. そのエージェントの Codex ホームにある app-server の既存アカウント。
3. ローカルの stdio app-server 起動時に限り、app-server アカウントが存在せず、
   OpenAI 認証が引き続き必要な場合は、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、
起動する Codex 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` を
削除します。これにより、Gateway レベルの API キーを埋め込みや OpenAI
モデルの直接利用に使用可能なまま維持しつつ、ネイティブ Codex app-server の
ターンが誤って API 経由で課金されることを防ぎます。明示的な Codex API キー
プロファイルとローカル stdio の環境変数キーへのフォールバックでは、継承された
子プロセス環境ではなく app-server ログインを使用します。WebSocket app-server
接続には Gateway の環境変数 API キーフォールバックは渡されません。明示的な
認証プロファイルまたはリモート app-server 独自のアカウントを使用してください。

サブスクリプションプロファイルが Codex の使用制限に達した場合、Codex が
リセット時刻を報告すると OpenClaw はその時刻を記録し、同じ Codex 実行に対して
順序上の次の認証プロファイルを試します。リセット時刻を過ぎると、選択された
`openai/gpt-*` モデルや Codex ランタイムを変更することなく、サブスクリプション
プロファイルが再び使用可能になります。

ネイティブ Codex plugins が設定されている場合、OpenClaw は Plugin が所有する
アプリを Codex スレッドに公開する前に、接続された app-server を通じてそれらの
plugins をインストールまたは更新します。`app/list` は引き続きアプリ ID、
アクセス可能性、メタデータの信頼できる情報源ですが、スレッド単位の有効化判断は
OpenClaw が担います。ポリシーによって一覧内のアクセス可能なアプリが許可されている場合、
`app/list` が現在そのアプリを無効と報告していても、OpenClaw は
`thread/start.config.apps[appId].enabled = true` を送信します。この経路では、
不明な ID のアプリを勝手にインストールすることはありません。OpenClaw は
`plugin/install` を使用してマーケットプレイスの plugins のみを有効化し、その後
インベントリを更新します。

### 環境の分離

ローカルの stdio app-server 起動時、OpenClaw は `CODEX_HOME` をエージェント単位の
ディレクトリに設定します。これにより、Codex の設定、認証・アカウントファイル、
Plugin のキャッシュ・データ、およびネイティブスレッドの状態が、デフォルトでは
オペレーター個人の `~/.codex` を読み書きしません。OpenClaw は通常のプロセスの
`HOME` を維持します。Codex が実行するサブプロセスは引き続きユーザーホームの設定や
トークンを見つけられ、Codex は共有の `$HOME/.agents/skills` と
`$HOME/.agents/plugins/marketplace.json` のエントリを検出することがあります。
`appServer.homeScope: "user"` を指定すると、OpenClaw は代わりにネイティブの
ユーザー Codex ホームとその既存アカウントを使用し、OpenClaw の認証プロファイルを
注入しません。

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
OpenClaw はローカル起動の正規化中に、このリストから `CODEX_HOME` と `HOME` を
削除します。`CODEX_HOME` は選択されたエージェントまたはユーザースコープを指した
ままになり、`HOME` はサブプロセスが通常のユーザーホームの状態を使用できるよう
継承されたままになります。

### 動的ツールとウェブ検索

Codex の動的ツールは、デフォルトで `searchable` 読み込みを使用します。OpenClaw は、
Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません。
`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、`update_plan`、
`tool_call`、`tool_describe`、`tool_search`、`tool_search_code` が該当します。
メッセージング、メディア、cron、ブラウザー、Node、Gateway、
`heartbeat_respond` など、残りのほとんどの OpenClaw 統合ツールは、
`openclaw` 名前空間の Codex ツール検索を通じて利用でき、初期モデルコンテキストを
小さく保ちます。

OpenClaw の `computer` ツールなど、`catalogMode: "direct-only"` と指定されたツールは、
代わりに `openclaw_direct` 名前空間を使用します。Codex はその名前空間を
`DirectModelOnly` として扱うため、それらのツールはネストされた Code Mode の
`tools.*` 呼び出しを経由せず、通常スレッドとコードモード専用スレッドの両方で、
モデルから直接参照可能な状態を維持します。

検索が有効で、管理対象プロバイダーが選択されていない場合、ウェブ検索では
デフォルトで Codex のホスト型 `web_search` ツールを使用します。ネイティブの
ホスト型検索と OpenClaw の管理対象 `web_search` 動的ツールは相互排他的であり、
管理対象検索がネイティブのドメイン制限を回避できないようになっています。
ホスト型検索が利用できない場合、明示的に無効化されている場合、または選択された
管理対象プロバイダーに置き換えられている場合、OpenClaw は管理対象ツールを使用します。
本番の app-server トラフィックはユーザー定義の `web` 名前空間を拒否するため、
OpenClaw は Codex のスタンドアロン `web.run` 拡張を無効のままにします。
`tools.web.search.enabled: false` は両方の経路を無効にします。ツールが無効な
LLM 専用実行でも同様です。Codex は `"cached"` を優先設定として扱い、制限のない
app-server ターンでは、ライブの外部アクセスとして解決します。ネイティブの
`allowedDomains` が設定されている場合、許可リストを回避できないように、自動的な
管理対象フォールバックはフェイルクローズします。永続的で実効的な検索ポリシーの
変更があると、次のターンの前にバインドされた Codex スレッドがローテーションされます。
ターン単位の一時的な制限では、一時的な制限付きスレッドを使用し、後で再開できるよう
既存のバインディングを維持します。

`sessions_yield` とメッセージツール専用のソース返信は、ターン制御の契約であるため、
直接公開されたままです。Codex ネイティブの `spawn_agent` が Codex の主要な
サブエージェント機能であり続けるよう、`sessions_spawn` は検索可能なままです。
一方、明示的な OpenClaw または ACP の委任も、`openclaw` 動的ツール名前空間を通じて
引き続き利用できます。Heartbeat のコラボレーション指示では、ツールがまだ読み込まれて
いない場合、Heartbeat ターンを終了する前に `heartbeat_respond` を検索するよう
Codex に指示します。

遅延動的ツールを検索できないカスタム Codex app-server に接続する場合、または
完全なツールペイロードをデバッグする場合に限り、
`codexDynamicToolsLoading: "direct"` を設定します。

### 設定フィールド

サポートされているトップレベルの Codex Plugin フィールド：

| フィールド                 | デフォルト     | 意味                                                                                              |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw の動的ツールを Codex の初期ツールコンテキストに直接配置するには、`"direct"` を使用します。 |
| `codexDynamicToolsExclude` | `[]`           | Codex app-server のターンから除外する追加の OpenClaw 動的ツール名。                               |
| `codexPlugins`             | 無効           | 移行されたソースインストール済みの厳選 plugins に対する、ネイティブ Codex Plugin・アプリのサポート。 |
| `supervision`              | 無効           | アーカイブされていないネイティブセッションのカタログ、ローカルブランチの継続、およびエージェントツールポリシー。 |

サポートされている `appServer` フィールド：

| フィールド                                    | デフォルト                                             | 意味                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` は Codex を起動します。明示的な `"unix"` はローカル制御ソケットに接続し、`"websocket"` は `url` に接続します。                                                                                                                                                                                                                                                                          |
| `homeScope`                                   | `"agent"`                                              | `"agent"` は通常のハーネス状態を OpenClaw エージェントごとに分離します。`"user"` は明示的なオプトインで、ネイティブの `$CODEX_HOME` または `~/.codex` を共有し、ネイティブ認証を使用して、所有者専用のスレッド管理を有効にします。ユーザースコープはローカル stdio または Unix トランスポートをサポートします。別個の監視接続では、未設定値は stdio または Unix の場合は `"user"`、WebSocket の場合は `"agent"` として解決されます。 |
| `command`                                     | 管理対象の Codex バイナリ                              | stdio トランスポート用の実行可能ファイルです。管理対象バイナリを使用するには未設定のままにし、明示的に上書きする場合にのみ設定してください。                                                                                                                                                                                                                                                     |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポート用の引数です。                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | 未設定                                                 | WebSocket App Server URL または `unix://` URL です。明示的に空の Unix パスを指定すると、標準のユーザーホーム制御ソケットが選択されます。                                                                                                                                                                                                                                                        |
| `authToken`                                   | 未設定                                                 | WebSocket トランスポート用の Bearer トークンです。リテラル文字列、または `${CODEX_APP_SERVER_TOKEN}` などの SecretInput を受け付けます。                                                                                                                                                                                                                                                        |
| `headers`                                     | `{}`                                                   | 追加の WebSocket ヘッダーです。ヘッダー値には、リテラル文字列または SecretInput 値（例: `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`）を指定できます。                                                                                                                                                                                                                         |
| `clearEnv`                                    | `[]`                                                   | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除する追加の環境変数名です。ローカル起動では、OpenClaw は選択された `CODEX_HOME` と継承された `HOME` を維持します。                                                                                                                                                                                                     |
| `codeModeOnly`                                | `false`                                                | Codex のコードモード専用ツールサーフェスをオプトインで有効にします。通常の OpenClaw 動的ツールは、ネストされた `tools.*` 呼び出しを通じて引き続き利用できます。`openclaw_direct` ツールは、モデルから直接可視のままです。                                                                                                                                                                           |
| `remoteWorkspaceRoot`                         | 未設定                                                 | リモート Codex app-server のワークスペースルートです。設定すると、OpenClaw は解決済みの OpenClaw ワークスペースからローカルワークスペースルートを推定し、このリモートルート配下で現在の cwd のサフィックスを維持して、最終的な app-server の cwd のみを Codex に送信します。cwd が解決済みの OpenClaw ワークスペースルート外にある場合、OpenClaw は Gateway ローカルのパスをリモート app-server に送信せず、フェイルクローズします。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server コントロールプレーン呼び出しのタイムアウトです。                                                                                                                                                                                                                                                                                                                                   |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex がターンを受け入れた後、またはターンスコープの app-server リクエスト後に、OpenClaw が `turn/completed` を待機する間の無通信時間枠です。                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw が `turn/completed` を待機している間に、ツールへの引き渡し、ネイティブツールの完了、ツール後の未加工アシスタント進捗、未加工推論の完了、または推論の進捗の後に使用される、完了アイドルおよび進捗ガードです。ツール後の統合処理が、最終アシスタント解放の時間枠よりも長く正当に無通信状態となる可能性がある、信頼済みまたは高負荷のワークロードに使用してください。                                 |
| `mode`                                        | ローカル Codex の要件で YOLO が許可されない場合を除き `"yolo"` | YOLO またはガーディアンレビュー済み実行のプリセットです。`danger-full-access`、`never` 承認、または `user` レビュアーのいずれかが欠けているローカル stdio 要件では、暗黙のデフォルトがガーディアンになります。                                                                                                                                                                                     |
| `approvalPolicy`                              | `"never"` または許可されたガーディアン承認ポリシー    | スレッドの開始、再開、ターンに送信されるネイティブ Codex 承認ポリシーです。ガーディアンのデフォルトでは、許可されている場合は `"on-request"` が優先されます。                                                                                                                                                                                                                                     |
| `sandbox`                                     | `"danger-full-access"` または許可されたガーディアンサンドボックス | スレッドの開始および再開に送信されるネイティブ Codex サンドボックスモードです。ガーディアンのデフォルトでは、許可されている場合は `"workspace-write"`、それ以外は `"read-only"` が優先されます。OpenClaw サンドボックスが有効な場合、`danger-full-access` ターンでは、OpenClaw サンドボックスのエグレス設定から導出されたネットワークアクセスを備えた Codex `workspace-write` が使用されます。          |
| `approvalsReviewer`                           | `"user"` または許可されたガーディアンレビュアー       | 許可されている場合に Codex がネイティブ承認プロンプトをレビューするには `"auto_review"` を使用し、それ以外の場合は `guardian_subagent` または `user` を使用します。`guardian_subagent` は引き続きレガシーエイリアスです。                                                                                                                                                                         |
| `serviceTier`                                 | 未設定                                                 | オプションの Codex app-server サービス階層です。`"priority"` は高速モードのルーティングを有効にし、`"flex"` はフレックス処理を要求し、`null` はオーバーライドを解除します。レガシーの `"fast"` は `"priority"` として受け付けられます。                                                                                                                                                               |
| `networkProxy`                                | 無効                                                   | app-server コマンド用の Codex 権限プロファイルネットワークをオプトインで有効にします。OpenClaw は、`sandbox` を送信する代わりに、選択された `permissions.<profile>.network` 設定を定義し、`default_permissions` でそれを選択します。                                                                                                                                                                  |
| `experimental.sandboxExecServer`              | `false`                                                | サポート対象の Codex app-server に OpenClaw サンドボックスを基盤とする Codex 環境を登録し、ネイティブ Codex 実行を有効な OpenClaw サンドボックス内で実行できるようにする、プレビュー版のオプトインです。                                                                                                                                                                                           |

`appServer.networkProxy` は Codex サンドボックスの
契約を変更するため、明示的な設定です。有効にすると、OpenClaw は生成された
権限プロファイルが Codex 管理のネットワークを開始できるように、Codex スレッド設定で
`features.network_proxy.enabled` と `default_permissions` も設定します。デフォルトでは、OpenClaw は
プロファイル本体から衝突耐性のある `openclaw-network-<fingerprint>` プロファイル
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

通常の app-server ランタイムが `danger-full-access` になる場合でも、
`networkProxy` を有効にすると、生成される権限プロファイルにはワークスペース形式の
ファイルシステムアクセスが使用されます。Codex が管理するネットワーク強制は
サンドボックス化されたネットワークであるため、フルアクセスのプロファイルでは
外向きトラフィックを保護できません。ドメインエントリでは `allow` または `deny` を使用し、
Unix ソケットエントリでは Codex の `allow` または `none` の値を使用します。

### 動的ツール呼び出しのタイムアウト

OpenClaw が所有する動的ツール呼び出しには、
`appServer.requestTimeoutMs` とは独立した上限があります。Codex の
`item/tool/call` リクエストでは、デフォルトで 90 秒の OpenClaw
ウォッチドッグが使用されます。呼び出しごとの正の `timeoutMs`
引数により、そのツールに固有の時間枠を延長または短縮できますが、上限は 600000 ms です。
`image_generate` ツールでは、ツール呼び出し自体にタイムアウトが指定されていない場合は
`agents.defaults.imageGenerationModel.timeoutMs` を使用し、それ以外の場合の
画像生成のデフォルトは 120 秒です。メディア理解の `image` ツールでは
`tools.media.image.timeoutSeconds`、またはメディア用のデフォルトである 60 秒を使用します。
画像理解の場合、このタイムアウトはリクエスト自体に適用され、それ以前の準備作業によって
短縮されることはありません。タイムアウト時には、OpenClaw はサポートされている場合に
ツールのシグナルを中止し、失敗した動的ツール応答を Codex に返します。これにより、
セッションを `processing` のまま残さずにターンを続行できます。このウォッチドッグは
動的 `item/tool/call` の外側の時間枠です。プロバイダー固有のリクエストタイムアウトは
その呼び出しの内側で実行され、それぞれ固有のタイムアウトセマンティクスを維持します。

Codex がターンを受け入れた後、および OpenClaw がターン固有の
app-server リクエストに応答した後、ハーネスは Codex が現在のターンを進行させ、
最終的に `turn/completed` でネイティブターンを完了することを期待します。
app-server が `appServer.turnCompletionIdleTimeoutMs` の間、何も通知しない場合、
OpenClaw はベストエフォートで Codex のターンを中断し、診断用タイムアウトを記録して、
OpenClaw セッションレーンを解放します。これにより、後続のチャットメッセージが
停滞したネイティブターンの後ろにキューイングされることを防ぎます。同じターンに対する
ほとんどの非終端通知は、Codex によってターンがまだ稼働中であることが確認されるため、
この短いウォッチドッグを解除します。

ツールへの引き継ぎには、より長いツール後アイドル時間枠が使用されます。対象となるのは、
OpenClaw が `item/tool/call` 応答を返した後、`commandExecution` などの
ネイティブツール項目が完了した後、生の `custom_tool_call_output`
完了後、およびツール後の生のアシスタント進行、生の推論完了、または推論進行の後です。
このガードは、設定されている場合は
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` を使用し、それ以外の場合は
デフォルトで 5 分です。この同じ時間枠は、Codex が次の現在ターンイベントを発行する前の
無通知の合成ウィンドウに対する進行ウォッチドッグも延長します。レート制限の更新などの
グローバル app-server 通知では、ターンのアイドル進行はリセットされません。
推論完了、commentary の `agentMessage` 完了、およびツール前の生の推論または
アシスタント進行の後には、自動的な最終応答が続く可能性があるため、
セッションレーンを即座に解放するのではなく、進行後応答ガードが使用されます。

最終かつ commentary ではない完了済みの `agentMessage` 項目と、ツール前の生の
アシスタント完了のみが、アシスタント出力による解放を作動させます。その後、
Codex が `turn/completed` を送信せずに何も通知しなくなった場合、OpenClaw は
ベストエフォートでネイティブターンを中断し、セッションレーンを解放します。
別のターン監視がこの解放競合に勝った場合でも、ネイティブリクエスト、項目、または
動的ツール完了がアクティブでなく、アシスタント出力による解放が引き続き最新の完了項目に
属しており、それ以降の項目完了がない場合、OpenClaw は完了済みの最終アシスタント項目を
受け入れます。これにより、ターンを再実行せずに、完了したツール作業後の最終回答を
保持できます。部分的なアシスタント差分、古い以前の応答、および空の後続完了は
対象になりません。

再実行しても安全な stdio app-server の障害には、アシスタント、ツール、
アクティブ項目、または副作用の証拠がないターン完了アイドルタイムアウトも含まれ、
新しい app-server 試行で 1 回再試行されます。安全でないタイムアウトの場合も、
停止した app-server クライアントを廃止し、OpenClaw セッションレーンを解放します。
また、自動的に再実行する代わりに、古いネイティブスレッドのバインディングをクリアします。
完了監視のタイムアウトでは、Codex 固有のタイムアウトテキストが表示されます。
再実行しても安全な場合は応答が不完全な可能性があることを示し、安全でない場合は
再試行前に現在の状態を確認するようユーザーに伝えます。公開されるタイムアウト診断には、
最後の app-server 通知メソッド、生のアシスタント応答項目の id/type/role、
アクティブなリクエスト数と項目数、作動中の監視状態などの構造化フィールドが含まれます。
最後の通知が生のアシスタント応答項目の場合は、長さに上限を設けたアシスタントテキストの
プレビューも含まれます。生のプロンプトやツールの内容は含まれません。

### ローカルテスト用の環境変数オーバーライド

- `appServer.command` が未設定の場合、
  `OPENCLAW_CODEX_APP_SERVER_BIN` は管理対象バイナリを迂回します。
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、
一度限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。
再現可能なデプロイでは設定を推奨します。これにより、Plugin の動作を Codex ハーネス設定の
残りの部分と同じレビュー済みファイルに保持できるためです。

## ネイティブ Codex Plugin

ネイティブ Codex Plugin のサポートでは、OpenClaw ハーネスのターンと同じ
Codex スレッドで、Codex app-server 独自のアプリおよび Plugin 機能を使用します。
OpenClaw は Codex Plugin を合成された `codex_plugin_*` OpenClaw
動的ツールには変換しません。

`codexPlugins` は、ネイティブ Codex ハーネスを選択するセッションにのみ影響します。
組み込みハーネスの実行、通常の OpenAI プロバイダーの実行、ACP
会話バインディング、その他のハーネスには影響しません。

移行後の最小構成:

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

スレッドのアプリ構成は、OpenClaw が Codex ハーネスセッションを確立するとき、
または古い Codex スレッドのバインディングを置き換えるときに計算されます。
ターンごとに再計算されるわけではありません。`codexPlugins` を変更した後は、
`/new`、`/reset` を使用するか、Gateway を再起動して、今後の Codex
ハーネスセッションが更新されたアプリセットで開始されるようにしてください。

移行対象の判定、アプリインベントリ、破壊的アクションのポリシー、情報要求、
ネイティブ Plugin の診断については、
[ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)を参照してください。

OpenAI 側のアプリおよび Plugin へのアクセスは、サインインしている Codex
アカウントによって制御されます。また、Business および Enterprise/Edu
ワークスペースでは、ワークスペースのアプリ制御によっても制御されます。OpenAI の
アカウントとワークスペース制御の概要については、
[ChatGPT プランで Codex を使用する](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
を参照してください。

## Computer Use

Computer Use には独自のセットアップガイドがあります:
[Codex Computer Use](/ja-JP/plugins/codex-computer-use)。

要約すると、OpenClaw はデスクトップ制御アプリを同梱せず、デスクトップアクション自体も
実行しません。OpenClaw は Codex app-server を準備し、`computer-use` MCP
サーバーが利用可能であることを確認した後、Codex モードのターン中のネイティブ MCP
ツール呼び出しを Codex に委ねます。

## ランタイム境界

Codex ハーネスが変更するのは、低レベルの組み込みエージェント実行器のみです。

- OpenClaw の動的ツールはサポートされています。Codex は OpenClaw に
  それらのツールの実行を要求するため、OpenClaw は実行経路に残ります。
- Codex ネイティブのシェル、パッチ、MCP、およびネイティブアプリツールは
  Codex が所有します。OpenClaw は、サポートされているリレーを通じて選択された
  ネイティブイベントを監視またはブロックできますが、ネイティブツールの引数は書き換えません。
- ネイティブ Compaction は Codex が所有します。OpenClaw は、チャンネル履歴、
  検索、`/new`、`/reset`、および将来のモデルまたはハーネスの切り替えのために
  トランスクリプトのミラーを保持しますが、Codex の Compaction を OpenClaw または
  コンテキストエンジンの要約機能に置き換えることはありません。
- メディア生成、メディア理解、TTS、承認、およびメッセージングツールの出力は、
  引き続き対応する OpenClaw プロバイダー/モデル設定を介して処理されます。
- `tool_result_persist` は、OpenClaw が所有するトランスクリプトのツール結果に適用され、
  Codex ネイティブのツール結果レコードには適用されません。

フックレイヤー、サポートされる V1 サーフェス、ネイティブ権限の処理、キューの制御、
Codex フィードバックのアップロード機構、および Compaction の詳細については、
[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)を参照してください。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** 新しい設定では
想定どおりです。`openai/gpt-*` モデルを選択し、
`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が
`codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく組み込みハーネスを使用する:** 有効なルートが
公式の HTTPS Platform Responses または ChatGPT Responses の完全一致ルートであり、
作成済みのリクエストオーバーライドがなく、Codex Plugin がインストールされ有効であることを
確認してください。`openai/gpt-*` プレフィックスだけでは不十分です。
テスト中に厳密に証明するには、プロバイダーまたはモデルの
`agentRuntime.id: "codex"` を設定してください。Codex を強制した場合、ルートまたは
ハーネスに互換性がなければ、フォールバックせずに失敗します。

**OpenAI Codex ランタイムが API キー経路にフォールバックする:** モデル、
ランタイム、選択されたプロバイダー、および障害を示す、秘匿化済みの Gateway 抜粋を
収集してください。影響を受ける共同作業者に、OpenClaw ホスト上で次の読み取り専用コマンドを
実行するよう依頼してください:

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

有用な抜粋には通常、`openai/gpt-5.6-sol` または `openai/gpt-5.6-luna`、
`Runtime: OpenAI Codex`、`agentRuntime.id` または `harnessRuntime`、
`candidateProvider: "openai"`、および `401`、`Incorrect API key`、または
`No API key` の結果が含まれます。修正後の実行では、単純な OpenAI API キー障害ではなく、
OpenAI OAuth 経路が表示される必要があります。

**レガシー Codex モデル参照の設定が残っている:** `openclaw doctor --fix` を実行してください。
Doctor はレガシーモデル参照を `openai/*` に書き換え、古いセッションおよび
エージェント全体のランタイム固定を削除し、既存の認証プロファイルのオーバーライドを保持します。

**app-server が拒否される:** Codex app-server `0.143.0` 以降を使用してください。
OpenClaw は安定版の `0.143.0` プロトコルを最低要件としてテストするため、
`0.143.0-alpha.2` や `0.143.0+custom` など、同じバージョンのプレリリース版または
ビルド接尾辞付きバージョンは拒否されます。

**`/codex status` が接続できない:** `codex` Plugin が有効であること、
許可リストが設定されている場合は `plugins.allow` に含まれていること、およびカスタムの
`appServer.command`、`url`、`authToken`、またはヘッダーが有効であることを確認してください。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を小さくするか、
検出を無効にしてください。
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference#model-discovery)を参照してください。

**WebSocket トランスポートが即座に失敗する:** `appServer.url`、`authToken`、
ヘッダー、およびリモート app-server が同じ Codex app-server プロトコルバージョンを
使用していることを確認してください。

**ネイティブのシェルまたはパッチツールが `Native hook relay
unavailable` によりブロックされる:** Codex スレッドが、OpenClaw に登録されていない
ネイティブフックリレー ID を引き続き使用しようとしています。これはネイティブ Codex フックの
転送に関する問題であり、ACP バックエンド、プロバイダー、GitHub、シェルコマンドの
障害ではありません。影響を受けているチャットで `/new` または `/reset` を使用して新しいセッションを開始し、
無害なコマンドを再試行してください。一度は成功しても、次のネイティブツール
呼び出しが再び失敗する場合、`/new` は一時的な回避策としてのみ扱ってください。Codex app-server または
OpenClaw Gateway を再起動した後、プロンプトを新しいセッションにコピーすることで、
古いスレッドが破棄され、ネイティブフックの登録が再作成されます。

**Codex 以外のモデルが組み込みハーネスを使用する:** プロバイダーまたは
モデルランタイムポリシーによって別のハーネスにルーティングされない限り、これは想定される動作です。通常の OpenAI 以外の
プロバイダー参照は、`auto` モードでも通常のプロバイダーパスを使用します。

**Computer Use はインストール済みだがツールが実行されない:** 新しいセッションから
`/codex computer-use status` を確認してください。ツールが
`Native hook relay unavailable` を報告する場合は、前述のネイティブフックリレーの復旧手順を使用してください。
[Codex Computer Use](/ja-JP/plugins/codex-computer-use#troubleshooting) を参照してください。

## 関連項目

- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [Codex の監視](/plugins/codex-supervision)
- [ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)
- [Codex Computer Use](/ja-JP/plugins/codex-computer-use)
- [エージェントランタイム](/ja-JP/concepts/agent-runtimes)
- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [OpenAI Codex ヘルプ](https://help.openai.com/en/collections/14937394-codex)
- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [Plugin フック](/ja-JP/plugins/hooks)
- [診断のエクスポート](/ja-JP/gateway/diagnostics)
- [ステータス](/ja-JP/cli/status)
- [テスト](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
