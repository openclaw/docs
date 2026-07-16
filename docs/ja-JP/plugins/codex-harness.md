---
read_when:
    - 公式の Codex app-server ハーネスを使用する場合
    - Codex ハーネスの設定例が必要です
    - Codex のみのデプロイで、OpenClaw にフォールバックせず失敗するようにしたい場合
summary: 公式 Codex app-server ハーネスを通じて OpenClaw の組み込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-07-16T11:50:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f27d934036ca6952ec12bbda3d275d08701a38ac9c79df37fc6040f01b529cd
    source_path: plugins/codex-harness.md
    workflow: 16
---

公式の `codex` Plugin は、組み込みの OpenClaw ハーネスではなく Codex
app-server を通じて、埋め込みの OpenAI エージェントターンを実行します。Codex は、
低レベルのエージェントセッション、すなわちネイティブスレッドの再開、ネイティブツールの継続、
ネイティブ Compaction、app-server での実行を担います。OpenClaw は引き続き、チャット
チャンネル、セッションファイル、モデル選択、OpenClaw の動的ツール、承認、
メディア配信、表示されるトランスクリプトのミラーを担います。

`openai/gpt-5.6-sol` などの正規の OpenAI モデル参照を使用してください。レガシーな
Codex GPT 参照は設定せず、OpenAI エージェントの認証順序は `auth.order.openai` に設定してください。
レガシーな Codex 認証プロファイル ID とレガシーな Codex 認証順序エントリは、
`openclaw doctor --fix` によって修復されます。

プロバイダー／モデルのランタイムポリシーが未設定または `auto` の場合、`openai/*` プレフィックスだけで
このハーネスが選択されることはありません。OpenAI が Codex を暗黙的に選択できるのは、
リクエストで明示的なオーバーライドがなく、公式の HTTPS Platform Responses または ChatGPT Responses ルートに
完全一致する場合のみです。[OpenAI の暗黙的なエージェントランタイム](/ja-JP/providers/openai#implicit-agent-runtime)
を参照してください。Platform と ChatGPT のどちらへルーティングされるかが判明する前に Codex が認証を担う場合でも、OpenClaw は
すべての候補ルートで Codex 互換性が宣言されていることを要求します。ネイティブの
認証所有権だけで、このルート検査が回避されることはありません。

OpenClaw サンドボックスが有効でない場合、OpenClaw は Codex のネイティブコードモードを
有効にして Codex app-server スレッドを開始します（code-mode-only はデフォルトで無効のままです）。これにより、
ネイティブのワークスペース／コード機能を、app-server の `item/tool/call` ブリッジ経由でルーティングされる OpenClaw の
動的ツールと併用できます。有効な OpenClaw サンドボックスまたは制限付きツールポリシーがある場合、
実験的なサンドボックス exec-server パスを明示的に有効にしない限り、ネイティブコードモードは完全に無効になります。

デフォルトの `tools.exec.host: "auto"` を使用し、有効な OpenClaw サンドボックスがない場合、
Codex にはペアリング済み Node 上でコマンドを実行するための `node_exec` および `node_process` ツールも提供されます。
ネイティブシェルは Codex app-server のホストとワークスペース上に留まります
（デフォルトの stdio デプロイでは Gateway ローカル）。`node_exec` は名前または ID で Node を選択し、
OpenClaw の Node 承認ポリシーを引き続き適用します。有限のランタイム許可リストによってネイティブコードモードが無効になり、
ターンに実行環境が残らない場合、OpenClaw は代わりに、ポリシーでフィルタリングされた `exec` および `process`
ツールを、サンドボックスを介さない直接実行用として利用可能なまま維持します。

この Codex ネイティブ機能は、汎用 OpenClaw 実行向けのオプトイン式 QuickJS-WASI ランタイムである
[OpenClaw コードモード](/ja-JP/reference/code-mode)とは別のもので、`exec` の入力形式も異なります。
モデル／プロバイダー／ランタイムのより広範な区分については、
[エージェントランタイム](/ja-JP/concepts/agent-runtimes)から確認してください。`openai/gpt-5.6-sol` はモデル
参照、`codex` はランタイム、Telegram、Discord、Slack、その他の
チャンネルはコミュニケーション面です。

## 要件

- 公式の `@openclaw/codex` Plugin がインストールされていること。設定で許可リストを使用している場合は、
  `plugins.allow` に `codex` を含めてください。
- Codex app-server `0.143.0` 以降。デフォルトでは Plugin が互換性のある
  バイナリを管理するため、`PATH` 上の `codex` コマンドは通常の
  起動に影響しません。
- `openclaw models auth login --provider openai`、エージェントの Codex ホームにすでに存在する
  app-server アカウント、または明示的な Codex API キー認証プロファイルによる Codex 認証。

認証の優先順位、環境の分離、カスタム app-server コマンド、
モデル検出、設定フィールドの完全な一覧については、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## クイックスタート

公式 Plugin をインストールし、Codex OAuth でサインインします。

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

`codex` Plugin を有効にし、OpenAI エージェントモデルを選択します。

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

設定で `plugins.allow` を使用している場合は、`codex` も追加します。

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

Plugin の設定を変更した後は Gateway を再起動してください。チャットにすでに
セッションがある場合は、次のターンで現在の設定からハーネスを解決できるよう、先に `/new` または `/reset` を
実行してください。

## Codex Desktop および CLI とスレッドを共有する

デフォルトの `appServer.homeScope: "agent"` では、各 OpenClaw エージェントが
オペレーターのネイティブ Codex 状態から分離されます。所有者が Codex Desktop と Codex CLI に表示されるものと
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
そのホームのネイティブ Codex 認証、設定、Plugin、スレッドストアも対象に含まれます。OpenClaw は
この app-server に OpenClaw 認証プロファイルを注入しません。

所有者のターンでは `codex_threads` ツールを利用でき、ネイティブスレッドの一覧表示、検索、読み取り、フォーク、名前変更、
アーカイブ、復元が可能です。OpenClaw で続行するにはスレッドをフォークします。フォークは現在の OpenClaw セッションに接続され、
他のネイティブ Codex クライアントからも引き続き表示されます。アーカイブするには、
そのスレッドがほかの場所で閉じられていることを明示的に確認する必要があります。監督機能も
有効になっている場合、トランスクリプトのフィールドと変更操作には、対応する
`supervision.allowRawTranscripts` または `supervision.allowWriteControls` のオプトインが必要です。

独立した管理対象 stdio App Server を介して、同じスレッドを同時に再開または書き込みしないでください。
Codex は単一の App Server 内ではアクティブな書き込み元を調整しますが、
別々のプロセス間では調整しません。通常のユーザーホーム stdio セッションでは、
フォークが安全に共存するための手段です。

`appServer.homeScope: "user"` だけではフリートカタログを制御しません。Plugin が有効な間は
ネイティブセッション検出が有効になります。Codex を無効にせずに OpenClaw サイドバーから
削除するには、`sessionCatalog.enabled: false` を設定してください。カタログは別個の監督接続を使用します。
`appServer` の接続設定を明示しない場合、通常のハーネスはエージェントスコープのまま、
その接続はデフォルトで管理対象のユーザーホーム stdio を使用します。明示的な
`appServer` の設定は両方のパスで適用されます。通常のハーネスでもネイティブ状態を共有する必要がある場合は、
前述のように `homeScope: "user"` を明示的に設定してください。

## Codex セッションを監督する

同じ `codex` Plugin で、Gateway コンピューターおよびオプトインしたペアリング済み Node 上の
アーカイブされていない Codex セッションを一覧表示できます。保存済みまたはアイドル状態の Gateway ローカルセッションから、
永続化された範囲内のユーザーとアシスタントの履歴をミラーする、モデル固定のチャットを作成できます。
その非公開バインディングは、ネイティブスナップショット、正規ブランチ、以後のターンに監督接続を使用し、
通常の Codex セッションは引き続きエージェントスコープのままです。最初の正規開始では、
Codex がスナップショットのフォークに対して返したモデルとプロバイダーを正確に使用します。
以後の再開では、選択を Codex のネイティブ設定に委ねます。外側の OpenClaw モデルとフォールバックチェーンが
それを置き換えることはありません。保存済みおよびアイドル状態の行は、他の実行元が存在しないことを明示的に
確認した後でアーカイブできます。アクティブなソースではブランチを作成したりアーカイブしたりできませんが、
既存の監督対象チャットは引き続き開けます。ペアリング済み Node のセッションはメタデータのみです。

設定、ブランチルール、ペアリング済み Node の制限、メタデータ公開、トラブルシューティングについては、
[Codex セッションを監督する](/ja-JP/plugins/codex-supervision)を参照してください。

## 設定

| 目的                                                | 設定                                                                                              | 設定場所                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| ハーネスを有効にする                                  | `plugins.entries.codex.enabled: true`                                                            | OpenClaw 設定                    |
| ネイティブ Codex セッション検出を非表示にする                 | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Codex Plugin 設定                |
| 許可リスト対象の Plugin インストールを維持する                  | `plugins.allow` に `codex` を含める                                                               | OpenClaw 設定                    |
| 対象となる OpenAI ターンで Codex の暗黙的な使用を許可する | 公式 HTTPS Responses/ChatGPT ルートに完全一致、リクエストでの明示的なオーバーライドなし、ランタイムは未設定／`auto` | OpenAI プロバイダー／モデル設定       |
| ChatGPT/Codex OAuth でサインインする                    | `openclaw models auth login --provider openai`                                                   | CLI 認証プロファイル                   |
| Codex 実行用の API キーバックアップを追加する                   | `auth.order.openai` でサブスクリプション認証の後に一覧指定された `openai:*` API キープロファイル                 | CLI 認証プロファイル＋OpenClaw 設定 |
| Codex が利用できない場合にフェイルクローズする               | プロバイダーまたはモデルの `agentRuntime.id: "codex"`                                                     | OpenClaw モデル／プロバイダー設定     |
| OpenAI API トラフィックを直接使用する                       | 通常の OpenAI 認証を使用したプロバイダーまたはモデルの `agentRuntime.id: "openclaw"`                          | OpenClaw モデル／プロバイダー設定     |
| app-server の動作を調整する                            | `plugins.entries.codex.config.appServer.*`                                                       | Codex Plugin 設定                |
| ネイティブ Codex Plugin アプリを有効にする                     | `plugins.entries.codex.config.codexPlugins.*`                                                    | Codex Plugin 設定                |
| Codex Computer Use を有効にする                           | `plugins.entries.codex.config.computerUse.*`                                                     | Codex Plugin 設定                |

サブスクリプション優先／API キーバックアップの順序には、`auth.order.openai` を使用することを推奨します。
既存のレガシーな Codex 認証プロファイル ID とレガシーな Codex 認証順序は、
doctor 専用のレガシー状態です。新しいレガシー Codex GPT 参照は記述しないでください。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Codex 互換の実効ルートでは、上記の両方のプロファイルが同じ Codex 実行の
候補として残ります。プロファイルの順序が選択するのは認証情報であり、ランタイムではありません。
認証順序を変更しても、カスタム、Completions、HTTP、または
リクエストでオーバーライドされたルートが Codex 互換になることはありません。

### Compaction

Codex がバックエンドのエージェントには、`compaction.model` または `compaction.provider` を
設定しないでください。Codex はネイティブの app-server スレッド状態を通じて Compaction を行うため、
OpenClaw は実行時にこれらのローカル要約機能のオーバーライドを無視し、
エージェントが Codex を使用する場合は `openclaw doctor --fix` がそれらを削除します。

Lossless は、Codex ターンを取り巻く組み立て、取り込み、メンテナンス用のコンテキストエンジンとして
引き続きサポートされます。設定には
`agents.defaults.compaction.provider` ではなく、
`plugins.slots.contextEngine: "lossless-claw"` および
`plugins.entries.lossless-claw.config.summaryModel` を使用します。Codex がアクティブなランタイムの場合、
`openclaw doctor --fix` は古い `compaction.provider: "lossless-claw"` 形式を
Lossless コンテキストエンジンのスロットへ移行しますが、Compaction は引き続きネイティブ Codex が
担います。ネイティブ app-server ハーネスは、プロンプト前の組み立てを必要とするコンテキストエンジンを
サポートします。`codex-cli` を含む汎用 CLI バックエンドは、
このホスト機能を提供しません。

Codex がバックエンドのエージェントでは、`/compact` によって、バインドされたスレッド上で
ネイティブ Codex app-server の Compaction が開始されます。OpenClaw は完了を待たず、
OpenClaw のタイムアウトを課さず、共有 app-server を再起動せず、
コンテキストエンジンや公開 OpenAI 要約機能へフォールバックしません。ネイティブ Codex スレッドの
バインディングが欠落しているか古くなっている場合、Compaction バックエンドを暗黙的に
切り替えるのではなく、コマンドはフェイルクローズします。

このページの残りでは、デプロイ形態、フェイルクローズルーティング、ガーディアン
承認ポリシー、ネイティブ Codex Plugin、Computer Use について説明します。オプションの
完全な一覧、デフォルト値、列挙値、検出、環境の分離、タイムアウト、
app-server トランスポートフィールドについては、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## Codex ランタイムを確認する

Codex を使用する予定のチャットで `/status` を使用します。Codex を基盤とする OpenAI
エージェントのターンには、次のように表示されます。

```text
ランタイム: OpenAI Codex
```

次に、Codex app-server の状態を確認します。

```text
/codex status
/codex models
```

`/codex status` は、app-server の接続状態、アカウント、レート制限、MCP
サーバー、Skills を報告します。`/codex models` は、ハーネスとアカウントで使用可能な
Codex app-server のライブカタログを一覧表示します。`/status` が予想外の場合は、
[トラブルシューティング](#troubleshooting)を参照してください。

## ルーティングとモデルの選択

プロバイダー参照とランタイムポリシーは分離してください。

- 正規の OpenAI モデルを選択するには `openai/gpt-*` を使用します。プレフィックスだけで
  Codex が選択されることはありません。
- ランタイムが未設定または `auto` の場合、作成者によるリクエストのオーバーライドがない、
  公式の完全一致する HTTPS Platform Responses または ChatGPT Responses ルートのみが、
  暗黙的に Codex を選択できます。
- 設定ではレガシー Codex GPT 参照を使用しないでください。`openclaw doctor --fix` を実行して、
  レガシー参照と古いセッションルートの固定を修復します。
- `agentRuntime.id: "codex"` は、互換性のあるルートに対して Codex をフェイルクローズ要件にします。
  互換性のない実効ルートを互換性のあるものにするわけではありません。
- `agentRuntime.id: "openclaw"` は、意図的に使用する場合にプロバイダーまたはモデルを組み込みの
  OpenClaw ランタイムへオプトインします。
- `/codex ...` は、チャットからネイティブ Codex app-server の会話を制御します。
- ACP/acpx は別の外部ハーネス経路です。ユーザーが ACP/acpx または外部ハーネスアダプターを
  求めている場合にのみ使用してください。

| ユーザーの意図                                             | 使用                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 現在のチャットをアタッチする                               | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| 既存の Codex スレッドを再開する                            | `/codex resume <thread-id>`                                                                           |
| Codex スレッドを一覧表示または絞り込む                     | `/codex threads [filter]`                                                                             |
| ネイティブ Codex Plugin を一覧表示する                     | `/codex plugins list`                                                                                 |
| 設定済みのネイティブ Codex Plugin を有効化または無効化する | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| 保存済み Codex CLI セッションをペア Node のターンとして再開する | `/codex sessions --host <node> [filter]`、続いて `/codex resume <session-id> --host <node> --bind here` |
| コンピューター間でアーカイブされていない Codex セッションを表示する | Codex の監視を有効にして **Codex Sessions** を開く                                                  |
| バインドされたスレッドのモデル、高速モード、権限を変更する | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| アクティブなターンを停止または誘導する                     | `/codex stop`, `/codex steer <text>`                                                                  |
| 現在のバインドを解除する                                   | `/codex detach`（エイリアス `/codex unbind`）                                                               |
| Codex のフィードバックのみを送信する                       | `/codex diagnostics [note]`                                                                           |
| ACP/acpx タスクを開始する                                  | `/codex` ではなく ACP/acpx セッションコマンド                                                               |

| ユースケース                                    | 設定                                                                                                        | 確認                                      | 注記                                             |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------ |
| ネイティブ Codex ランタイムに適格な OpenAI ルート | 作成者によるリクエストのオーバーライドがない、公式の完全一致する HTTPS Responses/ChatGPT ルートと、有効な `codex` Plugin | `/status` に `Runtime: OpenAI Codex` が表示される | ランタイムが未設定/`auto` の場合の暗黙的な経路 |
| Codex が使用できない場合にフェイルクローズする | プロバイダーまたはモデルの `agentRuntime.id: "codex"`                                                                | 組み込みへのフォールバックではなくターンが失敗する | Codex 専用のデプロイに使用                       |
| OpenClaw 経由の直接的な OpenAI API キートラフィック | プロバイダーまたはモデルの `agentRuntime.id: "openclaw"` と通常の OpenAI 認証                                      | `/status` に OpenClaw ランタイムが表示される        | OpenClaw の使用が意図的な場合にのみ使用          |
| レガシー設定                                    | レガシー Codex GPT 参照                                                                                     | `openclaw doctor --fix` が書き換える     | この方法で新しい設定を書かない                   |
| ACP/acpx Codex アダプター                       | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | ACP タスク/セッションの状態               | ネイティブ Codex ハーネスとは別                  |

`agents.defaults.imageModel` も同じプレフィックス分割に従います。通常の OpenAI ルートには
`openai/gpt-*` を使用し、画像理解を制限付きの Codex app-server ターンで
実行する必要がある場合にのみ `codex/gpt-*` を使用してください。Doctor はレガシー
Codex GPT 参照を `openai/gpt-*` に書き換えます。

## デプロイパターン

### 基本的な Codex デプロイ

実効的な公式 HTTPS ルートで Codex を暗黙的に選択できる OpenAI モデルには、
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

### 混合プロバイダーのデプロイ

Claude をデフォルトのエージェントとして維持し、名前付き Codex エージェントを追加します。

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
実効的な OpenAI ルートが互換性を維持している場合に Codex app-server を使用します。これを
フェイルクローズ要件にする必要がある場合は、モデルスコープの明示的な
`agentRuntime.id: "codex"` を追加してください。

### フェイルクローズ Codex デプロイ

適格な公式の完全一致する HTTPS OpenAI ルートでは、バンドルされた Plugin が利用可能な場合に
Codex へ解決できます。明示されたフェイルクローズ規則には、
ランタイムポリシーを明示的に追加します。

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

Codex を強制すると、実効ルートが Codex 互換として宣言されていない場合、Plugin が無効な場合、
app-server が古すぎる場合、または app-server を起動できない場合に、OpenClaw は早期に失敗します。

## App-server ポリシー

デフォルトでは、Plugin は OpenClaw が管理する Codex バイナリを stdio トランスポートで
ローカルに起動します。別の実行可能ファイルを意図的に実行する場合にのみ
`appServer.command` を設定してください。app-server が別の場所ですでに実行されている場合にのみ、
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

ローカルの stdio app-server セッションでは、デフォルトで信頼されたローカルオペレーター向けの
態勢である `approvalPolicy: "never"`、`approvalsReviewer: "user"`、
`sandbox: "danger-full-access"` が使用されます。ローカルの Codex 要件でこの暗黙的な
YOLO 態勢が許可されない場合、OpenClaw は代わりに許可された Guardian 権限を選択します。
セッションで OpenClaw サンドボックスが有効な場合、OpenClaw は Codex のホスト側サンドボックスに
依存するのではなく、そのターンについて Codex ネイティブ Code Mode、ユーザー MCP サーバー、
アプリを基盤とする Plugin の実行を無効にします。通常の exec/process ツールが利用可能な場合、
シェルアクセスは代わりに `sandbox_exec` や `sandbox_process` などの
OpenClaw サンドボックスを基盤とする動的ツールを介して行われます。

サンドボックスの回避や追加権限を使用する前に、Codex ネイティブの自動レビューには
正規化された OpenClaw exec モードを使用します。

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
Guardian がレビューする承認に対応します。ローカル要件でそれらの値が許可される場合、通常は
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、
`sandbox: "workspace-write"` です。`tools.exec.mode: "auto"` では、
OpenClaw はレガシーで安全でない Codex の `approvalPolicy: "never"` または
`sandbox: "danger-full-access"` のオーバーライドを維持しません。意図的に承認なしの
Codex 態勢を使用する場合は `tools.exec.mode: "full"` を使用してください。レガシーの
`plugins.entries.codex.config.appServer.mode: "guardian"` プリセットも引き続き
機能しますが、`tools.exec.mode: "auto"` が正規化された OpenClaw のサーフェスです。

ホストの exec 承認および ACPX 権限とのモードレベルの比較については、
[権限モード](/ja-JP/tools/permission-modes)を参照してください。すべての app-server フィールド、
認証順序、環境の分離、タイムアウトの動作については、
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を参照してください。

## コマンドと診断

`codex` Plugin は、OpenClaw テキストコマンドをサポートするすべてのチャンネルで、
`/codex` をスラッシュコマンドとして登録します。

ネイティブの実行と制御には、所有者または `operator.admin`
Gateway クライアントが必要です。これには、スレッドのバインドまたは再開、ターンの送信または停止、
モデル、高速モード、権限状態の変更、Compaction またはレビュー、バインドの解除が含まれます。
その他の認可済み送信者は、状態、ヘルプ、アカウント、モデル、スレッド、MCP サーバー、Skills、
バインドを検査する読み取り専用コマンドを引き続き使用できます。

一般的な形式:

- `/codex status` は、app-server の接続状態、モデル、アカウント、レート制限、
  MCP サーバー、Skills を確認します。
- `/codex models` は、Codex app-server のライブモデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex app-server スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の
  Codex スレッドにアタッチします。
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  は現在のチャットをアタッチします。
- `/codex detach`（または `/codex unbind`）は、現在のバインドを解除します。
- `/codex binding` は、現在のバインドを説明します。
- `/codex stop` はアクティブなターンを停止し、`/codex steer <text>` はそれを誘導します。
- `/codex model <model>`、`/codex fast [on|off|status]`、
  `/codex permissions [default|yolo|status]` は、会話ごとの状態を変更します。
- `/codex compact` は、アタッチされたスレッドを Compaction するよう Codex app-server に要求します。
- `/codex review` は、アタッチされたスレッドに対して Codex ネイティブレビューを開始します。
- `/codex diagnostics [note]` は、アタッチされたスレッドについて
  Codex フィードバックを送信する前に確認を求めます。
- `/codex account` は、アカウントとレート制限の状態を表示します。
- `/codex mcp` は、Codex app-server の MCP サーバーの状態を一覧表示します。
- `/codex skills` は、Codex app-server の Skills を一覧表示します。
- `/codex plugins list`、`/codex plugins enable <name>`、
  `/codex plugins disable <name>` は、設定済みのネイティブ Codex Plugin を管理します。
- `/codex computer-use [status|install]` は、Codex Computer Use を管理します。
- `/codex help` は、完全なコマンドツリーを一覧表示します。

ほとんどのサポート報告では、バグが発生した会話内で `/diagnostics [note]` を実行することから始めます。これにより、Gateway 診断レポートが 1 件作成され、Codex ハーネスセッションの場合は、関連する Codex フィードバックバンドルを送信するための承認が求められます。プライバシーモデルとグループチャットでの動作については、[診断のエクスポート](/ja-JP/gateway/diagnostics)を参照してください。完全な Gateway 診断バンドルを含めず、現在接続されているスレッドの Codex フィードバックのみをアップロードしたい場合に限り、`/codex diagnostics [note]` を使用してください。

### Codex スレッドをローカルで調査する

問題のある Codex 実行を調査する最も速い方法は、多くの場合、ネイティブ Codex スレッドを直接開くことです。

```bash
codex resume <thread-id>
```

スレッド ID は、完了した `/diagnostics` の応答、`/codex binding`、または `/codex threads [filter]` から取得します。

アップロードの仕組みとランタイムレベルの診断境界については、[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#codex-feedback-upload)を参照してください。

### 認証順序

デフォルトのエージェントごとのホームでは、次の順序で認証が選択されます。

1. エージェント用に順序付けられた OpenAI 認証プロファイル。可能であれば
   `auth.order.openai` 配下に配置します。古いレガシー Codex 認証プロファイル ID とレガシー Codex 認証順序を移行するには、`openclaw doctor --fix` を実行します。
2. そのエージェントの Codex ホームにある app-server の既存アカウント。
3. ローカル stdio app-server の起動時に限り、app-server アカウントが存在せず、OpenAI 認証が引き続き必要な場合は、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT サブスクリプション形式の Codex 認証プロファイルを検出すると、生成された Codex 子プロセスから `CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway レベルの API キーを埋め込みや OpenAI モデルの直接利用に使用できる状態を保ちながら、ネイティブ Codex app-server のターンが誤って API 経由で課金されることを防ぎます。明示的な Codex API キープロファイルおよびローカル stdio の環境変数キーへのフォールバックでは、継承された子プロセスの環境変数ではなく、app-server ログインを使用します。WebSocket app-server 接続には Gateway の環境変数 API キーフォールバックは渡されません。明示的な認証プロファイルまたはリモート app-server 自体のアカウントを使用してください。

サブスクリプションプロファイルが Codex の使用制限に達した場合、Codex からリセット時刻が報告されれば OpenClaw はその時刻を記録し、同じ Codex 実行に対して次に順序付けられた認証プロファイルを試します。リセット時刻を過ぎると、選択された `openai/gpt-*` モデルや Codex ランタイムを変更することなく、そのサブスクリプションプロファイルが再び使用可能になります。

ネイティブ Codex プラグインが設定されている場合、OpenClaw は、プラグインが所有するアプリを Codex スレッドに公開する前に、接続された app-server を通じてそれらのプラグインをインストールまたは更新します。`app/list` は引き続きアプリ ID、アクセシビリティ、メタデータの信頼できる情報源ですが、スレッドごとの有効化判断は OpenClaw が担います。ポリシーで一覧内のアクセス可能なアプリが許可されている場合、`app/list` が現在そのアプリを無効と報告していても、OpenClaw は `thread/start.config.apps[appId].enabled = true` を送信します。この経路では、不明な ID のアプリを新たにインストールすることはありません。OpenClaw は `plugin/install` を持つマーケットプレイスプラグインのみを有効化し、その後インベントリを更新します。

### 環境の分離

ローカル stdio app-server の起動では、OpenClaw は `CODEX_HOME` をエージェントごとのディレクトリに設定します。これにより、Codex の設定、認証・アカウントファイル、プラグインのキャッシュ・データ、ネイティブスレッドの状態が、デフォルトではオペレーター個人の `~/.codex` を読み書きしないようにします。OpenClaw は通常のプロセスの `HOME` を保持します。Codex 実行のサブプロセスは引き続きユーザーホームの設定とトークンを検出でき、Codex は共有の `$HOME/.agents/skills` および
`$HOME/.agents/plugins/marketplace.json` エントリを検出する場合があります。`appServer.homeScope: "user"` を使用すると、OpenClaw は代わりにネイティブユーザーの Codex ホームとその既存アカウントを使用し、OpenClaw 認証プロファイルを挿入しません。

デプロイメントで追加の環境分離が必要な場合は、それらの変数を `appServer.clearEnv` に追加します。

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

`appServer.clearEnv` が影響するのは、生成された Codex app-server 子プロセスのみです。OpenClaw はローカル起動の正規化中に、このリストから `CODEX_HOME` と `HOME` を削除します。`CODEX_HOME` は選択されたエージェントまたはユーザーのスコープを指し続け、`HOME` は継承されたままになるため、サブプロセスは通常のユーザーホーム状態を使用できます。

### 動的ツールと Web 検索

Codex の動的ツールは、デフォルトで `searchable` 読み込みを使用します。OpenClaw は通常、Codex ネイティブのワークスペース操作と重複する動的ツールを公開しません。対象は `read`、`write`、`edit`、`apply_patch`、`exec`、`process`、`update_plan`、
`tool_call`、`tool_describe`、`tool_search`、および `tool_search_code` です。メッセージング、メディア、cron、ブラウザー、Node、Gateway、`heartbeat_respond` など、残りの OpenClaw 統合ツールのほとんどは、`openclaw` 名前空間配下の Codex ツール検索から利用できるため、初期モデルコンテキストを小さく保てます。制限付きターンのシェルフォールバックは、有限の許可リストによってネイティブ Code Mode が無効化される場合の `exec` と `process` に対する例外です。ランタイム許可リストと `codexDynamicToolsExclude` は引き続き適用されます。

OpenClaw の `computer` ツールを含む、`catalogMode: "direct-only"` とマークされたツールは、代わりに `openclaw_direct` 名前空間を使用します。Codex はその名前空間を `DirectModelOnly` として扱うため、これらのツールはネストされた Code Mode の `tools.*` 呼び出しを経由せず、通常のスレッドおよび Code Mode 専用スレッドでモデルから直接認識可能な状態を維持します。

検索が有効で、管理対象プロバイダーが選択されていない場合、Web 検索はデフォルトで Codex のホスト型 `web_search` ツールを使用します。ネイティブのホスト型検索と OpenClaw の管理対象 `web_search` 動的ツールは相互排他的であり、管理対象検索がネイティブのドメイン制限を回避できないようにします。ホスト型検索が利用できない場合、明示的に無効化されている場合、または選択された管理対象プロバイダーに置き換えられている場合、OpenClaw は管理対象ツールを使用します。本番環境の app-server トラフィックはユーザー定義の `web` 名前空間を拒否するため、OpenClaw は Codex のスタンドアロン `web.run` 拡張機能を無効のままにします。`tools.web.search.enabled: false` は両方の経路を無効化し、ツールが無効な LLM 専用実行でも同様です。Codex は `"cached"` を優先設定として扱い、制限のない app-server ターンでは実際の外部アクセスとして解決します。ネイティブの `allowedDomains` が設定されている場合、許可リストを回避できないように、自動的な管理対象フォールバックはフェイルクローズします。永続的な有効検索ポリシーの変更では、次のターンの前にバインドされた Codex スレッドをローテーションします。一時的なターンごとの制限では、一時的な制限付きスレッドを使用し、後で再開できるように既存のバインドを保持します。

`sessions_yield` とメッセージツール専用のソース応答は、ターン制御の契約であるため、直接公開されたままです。`sessions_spawn` は検索可能なまま維持されるため、Codex ネイティブの `spawn_agent` が主要な Codex サブエージェントサーフェスであり続けます。一方、明示的な OpenClaw または ACP の委任も、`openclaw` 動的ツール名前空間を通じて引き続き利用できます。Heartbeat のコラボレーション指示は、ツールがまだ読み込まれていない場合、Heartbeat ターンを終了する前に `heartbeat_respond` を検索するよう Codex に指示します。

遅延された動的ツールを検索できないカスタム Codex app-server に接続する場合、または完全なツールペイロードをデバッグする場合に限り、`codexDynamicToolsLoading: "direct"` を設定してください。

### 設定フィールド

サポートされる Codex プラグインのトップレベルフィールド：

| フィールド                      | デフォルト        | 意味                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw の動的ツールを初期 Codex ツールコンテキストに直接配置するには、`"direct"` を使用します。 |
| `codexDynamicToolsExclude` | `[]`           | Codex app-server ターンから除外する追加の OpenClaw 動的ツール名。              |
| `codexPlugins`             | 無効       | 移行された、ソースからインストールされた厳選プラグイン向けのネイティブ Codex プラグイン／アプリサポート。           |
| `sessionCatalog`           | 有効        | この Gateway および対象となるペアリング済み Node 上のネイティブ Codex セッションをサイドバーで検出。   |
| `supervision`              | 無効       | エージェント向けのネイティブセッショントランスクリプトおよび書き込み制御ポリシー。                         |

サポートされる `appServer` フィールド：

| フィールド                                         | デフォルト                                                | 意味                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` は Codex を起動します。明示的な `"unix"` はローカル制御ソケットに接続し、`"websocket"` は `url` に接続します。                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` は通常のハーネス状態を OpenClaw エージェントごとに分離します。`"user"` は、ネイティブの `$CODEX_HOME` または `~/.codex` を共有し、ネイティブ認証を使用して、所有者限定のスレッド管理を有効にする明示的なオプトインです。ユーザースコープはローカル stdio または Unix トランスポートをサポートします。個別の監視接続では、未設定の値は stdio または Unix の場合は `"user"`、WebSocket の場合は `"agent"` に解決されます。     |
| `command`                                     | 管理対象の Codex バイナリ                                   | stdio トランスポート用の実行ファイルです。管理対象のバイナリを使用するには未設定のままにし、明示的に上書きする場合にのみ設定します。                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポート用の引数です。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未設定                                                  | WebSocket App Server URL または `unix://` URL です。明示的に空の Unix パスを指定すると、標準のユーザーホーム制御ソケットが選択されます。                                                                                                                                                                                                                                                                          |
| `authToken`                                   | 未設定                                                  | WebSocket トランスポート用の Bearer トークンです。リテラル文字列、または `${CODEX_APP_SERVER_TOKEN}` などの SecretInput を受け付けます。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 追加の WebSocket ヘッダーです。ヘッダー値には、リテラル文字列または SecretInput 値（例: `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`）を指定できます。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除する追加の環境変数名です。ローカル起動では、OpenClaw は選択された `CODEX_HOME` と継承された `HOME` を維持します。                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Codex のコードモード専用ツールサーフェスを有効にします。通常の OpenClaw 動的ツールは、ネストされた `tools.*` 呼び出しを通じて引き続き利用できます。`openclaw_direct` ツールは引き続きモデルから直接参照できます。                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未設定                                                  | リモート Codex app-server のワークスペースルートです。設定すると、OpenClaw は解決済みの OpenClaw ワークスペースからローカルワークスペースルートを推測し、このリモートルート配下で現在の cwd のサフィックスを維持して、最終的な app-server の cwd のみを Codex に送信します。cwd が解決済みの OpenClaw ワークスペースルート外にある場合、OpenClaw は Gateway ローカルのパスをリモート app-server に送信せず、フェイルクローズします。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server のコントロールプレーン呼び出しのタイムアウトです。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex がターンを受け入れた後、またはターンスコープの app-server リクエスト後に、OpenClaw が `turn/completed` を待機する静穏期間です。                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw が `turn/completed` を待機している間、ツールの引き渡し、ネイティブツールの完了、ツール実行後の生のアシスタント進捗、生の推論完了、または推論進捗の後に使用される、完了アイドルおよび進捗ガードです。ツール実行後の統合処理が、最終的なアシスタント解放予算よりも正当に長く無音状態になる可能性がある、信頼済みまたは高負荷のワークロードに使用します。                                |
| `mode`                                        | ローカル Codex の要件で YOLO が許可されない場合を除き `"yolo"` | YOLO または guardian レビュー付き実行のプリセットです。`danger-full-access`、`never` 承認、または `user` レビュアーが省略されているローカル stdio の要件では、暗黙のデフォルトが guardian になります。                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` または許可された guardian 承認ポリシー       | スレッドの開始、再開、ターンに送信されるネイティブ Codex 承認ポリシーです。guardian のデフォルトでは、許可されている場合に `"on-request"` が優先されます。                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` または許可された guardian サンドボックス  | スレッドの開始または再開時に送信されるネイティブ Codex サンドボックスモードです。guardian のデフォルトでは、許可されている場合は `"workspace-write"`、それ以外の場合は `"read-only"` が優先されます。OpenClaw サンドボックスが有効な場合、`danger-full-access` ターンでは OpenClaw サンドボックスのエグレス設定から派生したネットワークアクセスを持つ Codex `workspace-write` が使用されます。                                                                                     |
| `approvalsReviewer`                           | `"user"` または許可された guardian レビュアー               | 許可されている場合に Codex がネイティブ承認プロンプトをレビューできるようにするには `"auto_review"` を使用し、それ以外の場合は `guardian_subagent` または `user` を使用します。`guardian_subagent` は従来のエイリアスとして残されています。                                                                                                                                                                                                                              |
| `serviceTier`                                 | 未設定                                                  | オプションの Codex app-server サービス階層です。`"priority"` は高速モードのルーティングを有効にし、`"flex"` は flex 処理を要求し、`null` は上書きを解除します。従来の `"fast"` は `"priority"` として受け付けられます。                                                                                                                                                                                                 |
| `networkProxy`                                | 無効                                               | app-server コマンドで Codex 権限プロファイルネットワークを有効にします。OpenClaw は、`sandbox` を送信する代わりに、選択された `permissions.<profile>.network` 設定を定義し、`default_permissions` で選択します。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | サポート対象の Codex app-server に OpenClaw サンドボックスを基盤とする Codex 環境を登録し、ネイティブ Codex 実行をアクティブな OpenClaw サンドボックス内で実行できるようにするプレビュー版のオプトインです。                                                                                                                                                                                                            |

`appServer.networkProxy` は Codex サンドボックスの
契約を変更するため、明示的に指定します。有効にすると、OpenClaw は生成された
権限プロファイルが Codex 管理対象ネットワークを開始できるように、Codex スレッド設定に
`features.network_proxy.enabled` と `default_permissions` も設定します。デフォルトでは、OpenClaw は
プロファイル本体から衝突耐性のある `openclaw-network-<fingerprint>` プロファイル
名を生成します。安定したローカル名が必要な場合にのみ `profileName` を使用します。

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

通常の app-server ランタイムが `danger-full-access` になる場合、`networkProxy` を有効にすると、生成される権限プロファイルでワークスペース形式のファイルシステムアクセスが使用されます。Codex が管理するネットワーク適用はサンドボックス化されたネットワークであるため、フルアクセスプロファイルでは送信トラフィックを保護できません。ドメインエントリには `allow` または `deny` を使用し、Unix ソケットエントリには Codex の `allow` または `none` の値を使用します。

### 動的ツール呼び出しのタイムアウト

OpenClaw が所有する動的ツール呼び出しは、`appServer.requestTimeoutMs` とは独立して制限されます。Codex の `item/tool/call` リクエストでは、デフォルトで OpenClaw の 90 秒のウォッチドッグが使用されます。呼び出しごとの正の `timeoutMs` 引数により、そのツール固有の時間枠を延長または短縮でき、上限は 600000 ms です。`image_generate` ツールは、ツール呼び出しが独自のタイムアウトを指定しない場合は `agents.defaults.imageGenerationModel.timeoutMs` を使用し、それ以外の場合は画像生成のデフォルトである 120 秒を使用します。メディア理解の `image` ツールは、`tools.media.image.timeoutSeconds` またはメディアのデフォルトである 60 秒を使用します。画像理解では、このタイムアウトはリクエスト自体に適用され、それ以前の準備作業によって短縮されません。タイムアウト時、OpenClaw はサポートされている場合にツールシグナルを中断し、失敗した動的ツール応答を Codex に返します。これにより、セッションを `processing` のまま残さずにターンを続行できます。このウォッチドッグは、動的な外側の `item/tool/call` 時間枠です。プロバイダー固有のリクエストタイムアウトはその呼び出し内で実行され、それぞれ独自のタイムアウトセマンティクスを維持します。

Codex がターンを受け入れた後、および OpenClaw がターン単位の app-server リクエストに応答した後、ハーネスは Codex が現在のターンを進行させ、最終的に `turn/completed` でネイティブターンを完了することを期待します。app-server が `appServer.turnCompletionIdleTimeoutMs` の間応答しない場合、OpenClaw はベストエフォートで Codex ターンを中断し、診断用タイムアウトを記録して OpenClaw セッションレーンを解放します。これにより、後続のチャットメッセージが古いネイティブターンの後ろでキューに入ることを防ぎます。同じターンのほとんどの非終端通知では、Codex によってターンがまだ動作中であることが示されるため、この短いウォッチドッグが解除されます。

ツールの引き継ぎには、より長いツール後アイドル時間枠が使用されます。対象となるのは、OpenClaw が `item/tool/call` 応答を返した後、`commandExecution` などのネイティブツール項目が完了した後、生の `custom_tool_call_output` 完了後、およびツール後の生のアシスタント進行、生の推論完了、または推論進行の後です。このガードは、設定されている場合は `appServer.postToolRawAssistantCompletionIdleTimeoutMs` を使用し、それ以外の場合はデフォルトで 5 分です。同じ時間枠により、Codex が次の現在ターンイベントを発行する前の無音の合成期間についても進行ウォッチドッグが延長されます。レート制限の更新など、グローバルな app-server 通知はターンのアイドル進行をリセットしません。推論完了、commentary の `agentMessage` 完了、ツール前の生の推論、またはアシスタント進行の後には自動的な最終応答が続く可能性があるため、セッションレーンをただちに解放するのではなく、進行後応答ガードが使用されます。

最終または非 commentary の完了済み `agentMessage` 項目と、ツール前の生のアシスタント完了のみが、アシスタント出力解放を作動させます。その後 Codex が `turn/completed` なしで応答しなくなった場合、OpenClaw はベストエフォートでネイティブターンを中断し、セッションレーンを解放します。別のターン監視がこの解放競合に勝った場合でも、ネイティブリクエスト、項目、または動的ツール完了がアクティブでなくなり、アシスタント出力解放が最新の完了項目に引き続き属し、それ以降の項目完了がない場合、OpenClaw は完了済みの最終アシスタント項目を受け入れます。これにより、ターンを再実行せずに、完了したツール作業後の最終回答を保持できます。部分的なアシスタント差分、古い以前の応答、および後から発生した空の完了は対象になりません。

アシスタント、ツール、アクティブ項目、または副作用の証拠がないターン完了アイドルタイムアウトを含む、再実行しても安全な stdio app-server 障害は、新しい app-server 試行で 1 回再試行されます。安全でないタイムアウトでは、停止した app-server クライアントが引き続き終了され、OpenClaw セッションレーンが解放されます。また、自動的に再実行する代わりに、古いネイティブスレッドのバインディングも消去されます。完了監視のタイムアウトでは、Codex 固有のタイムアウトテキストが表示されます。再実行しても安全な場合は応答が不完全な可能性があることを示し、安全でない場合は再試行前に現在の状態を確認するようユーザーに伝えます。公開タイムアウト診断には、最後の app-server 通知メソッド、生のアシスタント応答項目の ID、タイプ、ロール、アクティブなリクエストと項目の数、作動中の監視状態などの構造化フィールドが含まれます。最後の通知が生のアシスタント応答項目である場合は、長さを制限したアシスタントテキストのプレビューも含まれます。生のプロンプトやツールの内容は含まれません。

### ローカルテスト用環境変数オーバーライド

- `OPENCLAW_CODEX_APP_SERVER_BIN` は、`appServer.command` が未設定の場合に管理対象バイナリを迂回します。
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに `plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、1 回限りのローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。反復可能なデプロイでは設定が推奨されます。これにより、Plugin の動作を Codex ハーネス設定の残りの部分と同じレビュー済みファイル内に保持できるためです。

## ネイティブ Codex Plugin

ネイティブ Codex Plugin のサポートでは、OpenClaw ハーネスターンと同じ Codex スレッド内で、Codex app-server 自体のアプリおよび Plugin 機能を使用します。OpenClaw は Codex Plugin を合成 `codex_plugin_*` OpenClaw 動的ツールへ変換しません。

`codexPlugins` は、ネイティブ Codex ハーネスを選択するセッションにのみ影響します。組み込みハーネスの実行、通常の OpenAI プロバイダーの実行、ACP 会話バインディング、またはその他のハーネスには影響しません。

移行後の最小設定:

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

スレッドのアプリ設定は、OpenClaw が Codex ハーネスセッションを確立するとき、または古い Codex スレッドバインディングを置き換えるときに計算されます。ターンごとには再計算されません。`codexPlugins` を変更した後は、`/new`、`/reset` を使用するか、Gateway を再起動して、以後の Codex ハーネスセッションが更新されたアプリセットで開始されるようにしてください。

移行対象の条件、アプリインベントリ、破壊的アクションポリシー、情報要求、およびネイティブ Plugin 診断については、[ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)を参照してください。

OpenAI 側のアプリおよび Plugin へのアクセスは、サインイン中の Codex アカウントによって制御されます。Business および Enterprise/Edu ワークスペースでは、ワークスペースのアプリ制御によっても制御されます。OpenAI のアカウントおよびワークスペース制御の概要については、[ChatGPT プランで Codex を使用する](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)を参照してください。

## コンピューター操作

コンピューター操作には独自のセットアップガイドがあります:
[Codex コンピューター操作](/ja-JP/plugins/codex-computer-use)。

要約すると、OpenClaw はデスクトップ制御アプリを同梱せず、デスクトップアクション自体も実行しません。OpenClaw は Codex app-server を準備し、`computer-use` MCP サーバーが利用可能であることを確認してから、Codex モードのターン中のネイティブ MCP ツール呼び出しを Codex に委ねます。

## ランタイム境界

Codex ハーネスが変更するのは、低レベルの組み込みエージェント実行機構のみです。

- OpenClaw 動的ツールはサポートされています。Codex は OpenClaw にこれらのツールの実行を要求するため、OpenClaw は引き続き実行経路に残ります。
- Codex ネイティブのシェル、パッチ、MCP、およびネイティブアプリツールは Codex が所有します。OpenClaw はサポート対象のリレーを通じて、選択されたネイティブイベントを監視またはブロックできますが、ネイティブツールの引数は書き換えません。
- Codex はネイティブ Compaction を所有します。OpenClaw は、チャネル履歴、検索、`/new`、`/reset`、および将来のモデルやハーネスの切り替えのためにトランスクリプトのミラーを保持しますが、Codex Compaction を OpenClaw またはコンテキストエンジンの要約機構で置き換えることはありません。
- メディア生成、メディア理解、TTS、承認、およびメッセージングツールの出力は、引き続き対応する OpenClaw のプロバイダーまたはモデル設定を通じて処理されます。
- `tool_result_persist` は、Codex ネイティブのツール結果レコードではなく、OpenClaw が所有するトランスクリプトのツール結果に適用されます。

フックレイヤー、サポート対象の V1 サーフェス、ネイティブ権限処理、キュー制御、Codex フィードバックのアップロード機構、および Compaction の詳細については、[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)を参照してください。

## トラブルシューティング

**Codex が通常の `/model` プロバイダーとして表示されない:** 新しい設定では想定どおりです。`openai/gpt-*` モデルを選択し、`plugins.entries.codex.enabled` を有効にして、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく組み込みハーネスを使用する:** 有効なルートが公式の完全一致 HTTPS Platform Responses または ChatGPT Responses ルートであり、作成者によるリクエストオーバーライドがなく、Codex Plugin がインストールされ有効になっていることを確認してください。`openai/gpt-*` プレフィックスだけでは不十分です。テスト中に厳密な証明が必要な場合は、プロバイダーまたはモデルの `agentRuntime.id: "codex"` を設定してください。Codex を強制すると、ルートまたはハーネスに互換性がない場合にフォールバックせず失敗します。

**OpenAI Codex ランタイムが API キー経路にフォールバックする:** モデル、ランタイム、選択されたプロバイダー、および障害を示す、機密情報を除去した Gateway の抜粋を収集してください。影響を受ける共同作業者に、OpenClaw ホストで次の読み取り専用コマンドを実行するよう依頼してください:

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

有用な抜粋には通常、`openai/gpt-5.6-sol` または `openai/gpt-5.6-luna`、`Runtime: OpenAI Codex`、`agentRuntime.id` または `harnessRuntime`、`candidateProvider: "openai"`、および `401`、`Incorrect API key`、または `No API key` の結果が含まれます。修正後の実行では、単純な OpenAI API キー障害ではなく、OpenAI OAuth 経路が表示される必要があります。

**従来の Codex モデル参照設定が残っている:** `openclaw doctor --fix` を実行してください。Doctor は従来のモデル参照を `openai/*` に書き換え、古いセッションおよびエージェント全体のランタイム固定を削除し、既存の認証プロファイルのオーバーライドを保持します。

**app-server が拒否される:** Codex app-server `0.143.0` 以降を使用してください。`0.143.0-alpha.2` や `0.143.0+custom` などの同一バージョンのプレリリース版またはビルドサフィックス付きバージョンは、OpenClaw が安定版 `0.143.0` プロトコルを最低要件として検証するため拒否されます。

**`/codex status` に接続できない:** `codex` Plugin
が有効であること、許可リストが設定されている場合は
`plugins.allow` にその Plugin が含まれていること、カスタムの `appServer.command`、`url`、`authToken`、または
ヘッダーが有効であることを確認してください。

**モデル検出が遅い:** 
`plugins.entries.codex.config.discovery.timeoutMs` の値を下げるか、検出を無効にしてください。
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference#model-discovery)を参照してください。

**WebSocket トランスポートが即座に失敗する:** `appServer.url`、
`authToken`、ヘッダーを確認し、リモート app-server が同じ Codex
app-server プロトコルバージョンを使用していることを確認してください。

**ネイティブシェルまたはパッチツールが `Native hook relay
unavailable` によりブロックされる:** Codex スレッドが、OpenClaw に登録されなくなったネイティブフックリレー
ID を引き続き使用しようとしています。これはネイティブ Codex フックの
トランスポート問題であり、ACP バックエンド、プロバイダー、GitHub、シェルコマンドの
障害ではありません。影響を受けたチャットで `/new` または `/reset` を使用して新しいセッションを開始し、
無害なコマンドを再試行してください。一度は成功しても次のネイティブツール
呼び出しが再び失敗する場合、`/new` は一時的な回避策としてのみ扱ってください。Codex app-server または
OpenClaw Gateway を再起動した後、プロンプトを新しいセッションにコピーして、
古いスレッドを破棄し、ネイティブフックの登録を
再作成してください。

**Codex ツール呼び出しによって短命なフックプロセスが多すぎるほど作成される:** 
`plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`
を設定し、Gateway を再起動してください。これにより、OpenClaw のループ検出とそのポリシーなしマーカーに使用される Codex `PreToolUse` サブプロセス
のみが無効になります。必須の
`before_tool_call` および信頼済みツールのポリシーリレーは引き続き有効です。

**Codex 以外のモデルが組み込みハーネスを使用する:** プロバイダーまたは
モデルのランタイムポリシーによって別のハーネスにルーティングされない限り、想定される動作です。通常の OpenAI 以外の
プロバイダー参照は、`auto` モードでも通常のプロバイダーパスを使用します。

**Computer Use はインストールされているがツールが実行されない:** 新しいセッションから
`/codex computer-use status` を確認してください。ツールが
`Native hook relay unavailable` を報告する場合は、前述のネイティブフックリレーの復旧手順を使用してください。
[Codex Computer Use](/ja-JP/plugins/codex-computer-use#troubleshooting)を参照してください。

## 関連項目

- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [Codex の監視](/ja-JP/plugins/codex-supervision)
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
