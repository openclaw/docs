---
read_when:
    - CodexモードのOpenClawエージェントでCodex Computer Useを使いたい
    - Codex Computer Use、PeekabooBridge、直接の cua-driver MCP のいずれかを選択しています
    - Codex Computer Use と直接の cua-driver MCP セットアップのどちらにするかを判断しています
    - バンドルされた Codex Plugin の computerUse を設定しています
    - /codex computer-use のステータスまたはインストールをトラブルシューティングしている
summary: Codex モードの OpenClaw エージェント向けに Codex Computer Use をセットアップする
title: Codex コンピューター使用
x-i18n:
    generated_at: "2026-07-05T11:31:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ce6ef3a14f359b64855fee933425f40fc9f34e94572b68c7dee605ac896983f
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use は、ローカルデスクトップ制御用の Codex ネイティブ MCP plugin です。OpenClaw はデスクトップアプリをベンダー化せず、デスクトップ操作を自分で実行せず、Codex の権限をバイパスしません。同梱の `codex` plugin は Codex app-server を準備するだけです。Codex plugin サポートを有効化し、設定済みの Computer Use plugin を見つけるかインストールし、`computer-use` MCP サーバーが利用可能であることを確認してから、Codex モードのターン中のネイティブ MCP ツール呼び出しは Codex に所有させます。

OpenClaw がすでにネイティブ Codex ハーネスを使用している場合は、このページを使用してください。ランタイムセットアップ自体については、[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。

## OpenClaw.app と Peekaboo

OpenClaw.app の Peekaboo 連携は Codex Computer Use とは別です。macOS アプリは PeekabooBridge ソケットをホストできるため、`peekaboo` CLI は Peekaboo 独自の自動化ツール向けに、アプリのローカルのアクセシビリティと画面収録の許可を再利用できます。このブリッジは Codex Computer Use をインストールまたはプロキシせず、Codex Computer Use は PeekabooBridge ソケット経由で呼び出しません。

OpenClaw.app を Peekaboo CLI 自動化の権限認識ホストにしたい場合は、[Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo)を使用してください。Codex モードの OpenClaw agent が、ターン開始前に Codex のネイティブ `computer-use` MCP plugin を利用できるようにする場合は、このページを使用してください。

## iOS アプリ

iOS アプリは Codex Computer Use とは別です。Codex `computer-use` MCP サーバーをインストールまたはプロキシせず、デスクトップ制御バックエンドでもありません。代わりに、iOS アプリは OpenClaw ノードとして接続し、`canvas.*`、`camera.*`、`screen.*`、`location.*`、`talk.*` などのノードコマンドを通じてモバイル機能を公開します。

agent に gateway 経由で iPhone ノードを操作させたい場合は、[iOS](/ja-JP/platforms/ios)を使用してください。Codex モードの agent が、Codex のネイティブ Computer Use plugin を通じてローカル macOS デスクトップを制御する必要がある場合は、このページを使用してください。

## 直接の cua-driver MCP

Codex Computer Use だけがデスクトップ制御を公開する方法ではありません。OpenClaw 管理のランタイムから TryCua のドライバーを直接呼び出したい場合は、Codex 固有のマーケットプレイスフローではなく、OpenClaw の MCP レジストリを通じてアップストリームの `cua-driver mcp` サーバーを使用してください。

`cua-driver` をインストールした後、OpenClaw コマンドを問い合わせます。

```bash
cua-driver mcp-config --client openclaw
```

または stdio サーバーを直接登録します。

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

このパスでは、ドライバースキーマと構造化 MCP レスポンスを含め、アップストリームの MCP ツールサーフェスがそのまま維持されます。CUA ドライバーを通常の OpenClaw MCP サーバーとして利用したい場合に使用してください。Codex app-server が Codex モードのターン内で plugin インストール、MCP リロード、ネイティブツール呼び出しを所有する必要がある場合は、このページの Codex Computer Use セットアップを使用してください。

CUA のドライバーは macOS 固有であり、アクセシビリティや画面収録など、アプリが求めるローカル macOS 権限が引き続き必要です。OpenClaw は `cua-driver` をインストールせず、それらの権限を付与せず、アップストリームドライバーの安全モデルをバイパスしません。

## クイックセットアップ

Codex モードのターンで、スレッド開始前に Computer Use を利用できる必要がある場合は、`plugins.entries.codex.config.computerUse` を設定します。`autoInstall: true` は Computer Use を有効にし、ターン前に OpenClaw がインストールまたは再有効化できるようにします。

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
    },
  },
}
```

この設定では、OpenClaw は各 Codex モードのターン前に Codex app-server を確認します。Computer Use が見つからないものの、Codex app-server がインストール可能なマーケットプレイスをすでに検出している場合、OpenClaw は Codex app-server に plugin のインストールまたは再有効化と MCP サーバーのリロードを依頼します。macOS では、一致するマーケットプレイスが登録されておらず、標準の Codex アプリバンドルが存在する場合、OpenClaw は失敗する前に `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` から同梱の Codex マーケットプレイスを登録することも試みます。それでもセットアップで MCP サーバーを利用可能にできない場合、ターンはスレッド開始前に失敗します。

Computer Use 設定を変更した後、既存の Codex スレッドがすでに開始している場合は、テスト前に影響を受けるチャットで `/new` または `/reset` を使用してください。

macOS の管理 stdio 起動では、存在する場合、OpenClaw は `/Applications/Codex.app/Contents/Resources/codex` にある署名済みデスクトップ Codex アプリバンドルを優先します。これにより、Computer Use はローカルデスクトップ制御権限を所有するアプリバンドルの下に維持されます。デスクトップアプリがインストールされていない場合、OpenClaw は plugin の隣にインストールされた管理 Codex バイナリへフォールバックします。インストール済みデスクトップアプリがサポートされていない app-server バージョンで初期化された場合、OpenClaw は古いデスクトップアプリが plugin ローカルのフォールバックを隠してしまうのを許さず、その子プロセスを閉じて次の管理バイナリ候補を再試行します。明示的な `appServer.command` 設定または `OPENCLAW_CODEX_APP_SERVER_BIN` は、引き続きこの管理選択を上書きします。

## コマンド

`codex` plugin コマンドサーフェスが利用可能な任意のチャットサーフェスから、`/codex computer-use` コマンドを使用します。これらは OpenClaw のチャット/ランタイムコマンドであり、`openclaw codex ...` CLI サブコマンドではありません。

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` はデフォルトアクションで、読み取り専用です。マーケットプレイスソースの追加、plugin のインストール、Codex plugin サポートの有効化は行いません。Computer Use を有効にする設定がない場合、1 回限りの install コマンドを実行した後でも、`status` は無効と報告することがあります。

`install` は Codex app-server plugin サポートを有効化し、必要に応じて設定済みマーケットプレイスソースを追加し、Codex app-server 経由で設定済み plugin をインストールまたは再有効化し、MCP サーバーをリロードし、MCP サーバーがツールを公開していることを検証します。インストールは信頼済みホストリソースを変更するため、`install` を実行できるのは owner または `operator.admin` Gateway クライアントだけです。他の認可済み送信者は、オーバーライド付きの場合も含め、読み取り専用の `status` コマンドを引き続き使用できます。

## マーケットプレイスの選択肢

OpenClaw は Codex 自体が公開するものと同じ app-server API を使用します。マーケットプレイスフィールドは、Codex が `computer-use` をどこで見つけるべきかを選択します。

| フィールド                | 使用する場合                                                        | インストールサポート                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| マーケットプレイスフィールドなし | Codex app-server に既知のマーケットプレイスを使用させたい場合。 | はい。app-server がローカルマーケットプレイスを返す場合。        |
| `marketplaceSource`  | Codex app-server が追加できる Codex マーケットプレイスソースがある場合。         | はい。明示的な `/codex computer-use install` に対して。         |
| `marketplacePath`    | ホスト上のローカルマーケットプレイスファイルパスをすでに知っている場合。   | はい。明示的なインストールとターン開始時の自動インストールに対して。   |
| `marketplaceName`    | 登録済みマーケットプレイスを名前で 1 つ選択したい場合。  | 選択したマーケットプレイスにローカルパスがある場合のみ、はい。 |

新しい Codex ホームでは、公式マーケットプレイスをシードするまでに少し時間が必要な場合があります。インストール中、OpenClaw は最大 `marketplaceDiscoveryTimeoutMs` ミリ秒（デフォルト 60 秒）まで `plugin/list` をポーリングします。

複数の既知のマーケットプレイスに Computer Use が含まれる場合、OpenClaw は `openai-bundled`、次に `openai-curated`、次に `local` を優先します。不明で曖昧な一致はフェイルクローズし、`marketplaceName` または `marketplacePath` の設定を求めます。

## 同梱 macOS マーケットプレイス

最近の Codex デスクトップビルドは、Computer Use をここに同梱しています。

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

`computerUse.autoInstall` が true で、`computer-use` を含むマーケットプレイスが登録されていない場合、OpenClaw は標準の同梱マーケットプレイスルートを自動的に追加しようとします。

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Codex を使ってシェルから明示的に登録することもできます。

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

標準ではない Codex アプリパスを使用する場合は、`/codex computer-use install
--source <marketplace-root>` を一度実行するか、`computerUse.marketplacePath` をローカルマーケットプレイスファイルパスに設定してください。`--marketplace-path` は、同梱マーケットプレイスルートではなく、マーケットプレイス JSON ファイルパスがある場合にのみ使用してください。

## リモートカタログの制限

Codex app-server はリモート専用カタログエントリを一覧表示して読み取ることはできますが、現在リモート `plugin/install` はサポートしていません。つまり、`marketplaceName` はステータス確認用にリモート専用マーケットプレイスを選択できますが、インストールと再有効化には引き続き `marketplaceSource` または `marketplacePath` 経由のローカルマーケットプレイスが必要です。

ステータスで、plugin がリモート Codex マーケットプレイスで利用可能だがリモートインストールがサポートされていないと表示される場合は、ローカルソースまたはパスを指定して install を実行してください。

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 設定リファレンス

| フィールド                           | デフォルト        | 意味                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | 推論       | Computer Use を必須にします。別の Computer Use フィールドが設定されている場合、デフォルトは true です。 |
| `autoInstall`                   | false          | ターン開始時に、すでに検出済みのマーケットプレイスからインストールまたは再有効化します。       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Codex app-server のマーケットプレイス検出を install が待つ時間。             |
| `marketplaceSource`             | 未設定          | Codex app-server `marketplace/add` に渡されるソース文字列。                    |
| `marketplacePath`               | 未設定          | plugin を含むローカル Codex マーケットプレイスファイルパス。                       |
| `marketplaceName`               | 未設定          | 選択する登録済み Codex マーケットプレイス名。                                   |
| `pluginName`                    | `computer-use` | Codex マーケットプレイス plugin 名。                                                 |
| `mcpServerName`                 | `computer-use` | インストール済み plugin によって公開される MCP サーバー名。                               |

ターン開始時の自動インストールは、設定済みの `marketplaceSource` 値を意図的に拒否します。新しいソースの追加は明示的なセットアップ操作であるため、`/codex computer-use install --source <marketplace-source>` を一度使用してから、以後の再有効化は検出済みローカルマーケットプレイスから `autoInstall` に処理させてください。ターン開始時の自動インストールは、設定済みの `marketplacePath` を使用できます。これはホスト上のローカルパスだからです。

各フィールドは、対応する設定キーが未設定の場合に確認される環境変数オーバーライドも受け付けます。

| フィールド                           | 環境変数                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## OpenClaw が確認する内容

OpenClaw は内部で安定したセットアップ理由を報告し、チャット向けのユーザー表示ステータスを整形します。

| 理由                         | 意味                                                   | 次の手順                                      |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` が false に解決されました。      | `enabled` または別の Computer Use フィールドを設定します。 |
| `marketplace_missing`        | 一致するマーケットプレイスが利用できませんでした。     | ソース、パス、またはマーケットプレイス名を設定します。 |
| `plugin_not_installed`       | マーケットプレイスは存在しますが、プラグインがインストールされていません。 | インストールを実行するか、`autoInstall` を有効にします。 |
| `plugin_disabled`            | プラグインはインストールされていますが、Codex 設定で無効になっています。 | インストールを実行して再度有効にします。      |
| `remote_install_unsupported` | 選択したマーケットプレイスはリモート専用です。         | `marketplaceSource` または `marketplacePath` を使用します。 |
| `mcp_missing`                | プラグインは有効ですが、MCP サーバーが利用できません。 | Codex Computer Use と OS 権限を確認します。   |
| `ready`                      | プラグインと MCP ツールが利用できます。                | Codex モードのターンを開始します。            |
| `check_failed`               | ステータス確認中に Codex app-server リクエストが失敗しました。 | app-server の接続性とログを確認します。       |
| `auto_install_blocked`       | ターン開始時のセットアップには新しいソースの追加が必要です。 | 先に明示的なインストールを実行します。        |

チャット出力には、プラグイン状態、MCP サーバー状態、マーケットプレイス、利用可能な場合のツール、失敗したセットアップ手順に固有のメッセージが含まれます。

## macOS 権限

Computer Use は macOS 固有です。Codex が所有する MCP サーバーは、アプリを検査または制御する前にローカル OS 権限を必要とする場合があります。OpenClaw が Computer Use はインストール済みだが MCP サーバーは利用できないと示す場合は、先に Codex 側の Computer Use セットアップを確認してください。

- Codex app-server が、デスクトップ制御を行う同じホストで実行されている。
- Computer Use プラグインが Codex 設定で有効になっている。
- `computer-use` MCP サーバーが Codex app-server の MCP ステータスに表示されている。
- macOS がデスクトップ制御アプリに必要な権限を付与している。
- 現在のホストセッションが、制御対象のデスクトップにアクセスできる。

OpenClaw は、`computerUse.enabled` が true の場合に意図的に失敗終了します。Codex モードのターンは、設定で要求されたネイティブデスクトップツールなしに暗黙的に進行すべきではありません。

## トラブルシューティング

**ステータスが未インストールと表示する。** `/codex computer-use install` を実行します。マーケットプレイスが検出されない場合は、`--source` または `--marketplace-path` を渡します。

**ステータスがインストール済みだが無効と表示する。** `/codex computer-use install` を再度実行します。Codex app-server のインストールは、プラグイン設定を有効状態に書き戻します。

**ステータスがリモートインストールはサポートされていないと表示する。** ローカルのマーケットプレイスソースまたはパスを使用します。リモート専用のカタログエントリは検査できますが、現在の app-server API ではインストールできません。

**ステータスが MCP サーバーを利用できないと表示する。** MCP サーバーを再読み込みするため、インストールを一度再実行します。それでも利用できない場合は、Codex Computer Use アプリ、Codex app-server の MCP ステータス、または macOS 権限を修正します。

**ステータスまたはプローブが `computer-use.list_apps` でタイムアウトする。** プラグインと MCP サーバーは存在しますが、ローカルの Computer Use ブリッジが応答しませんでした。Codex Computer Use を終了または再起動し、必要に応じて Codex Desktop を再起動してから、新しい OpenClaw セッションで再試行します。ホストが以前に古い管理対象 Codex app-server 経由で Computer Use を実行していた場合は、デスクトップに同梱されたマーケットプレイスからインストール済みプラグインを更新します。

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Computer Use ツールが `Native hook relay unavailable` と表示する。** Codex ネイティブツールフックが、ローカルブリッジまたは Gateway フォールバック経由でアクティブな OpenClaw リレーに到達できませんでした。`/new` または `/reset` で新しい OpenClaw セッションを開始します。一度は動作して、その後のツール呼び出しで再び失敗する場合、`/new` は現在の試行だけをクリアしています。古いスレッドとフック登録が破棄されるように Codex app-server または OpenClaw Gateway を再起動し、新しいセッションで再試行します。

**ターン開始時の自動インストールがソースを拒否する。** これは意図した動作です。先に明示的な `/codex computer-use install --source
<marketplace-source>` でソースを追加すると、以後のターン開始時の自動インストールで検出済みのローカルマーケットプレイスを使用できます。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo)
- [iOS アプリ](/ja-JP/platforms/ios)
