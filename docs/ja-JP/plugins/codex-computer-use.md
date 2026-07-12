---
read_when:
    - Codex モードの OpenClaw エージェントで Codex Computer Use を使用する場合
    - Codex Computer Use、PeekabooBridge、直接の cua-driver MCP のどれを使用するかを決定します
    - バンドルされている Codex Plugin 用に computerUse を設定しています
    - /codex のコンピューター操作のステータスまたはインストールに関するトラブルシューティングを行っています
summary: Codex モードの OpenClaw エージェント向けに Codex Computer Use をセットアップする
title: Codex コンピューター操作
x-i18n:
    generated_at: "2026-07-12T14:42:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use は、ローカルデスクトップ制御用の Codex ネイティブ MCP Plugin です。OpenClaw
はデスクトップアプリを同梱せず、デスクトップ操作自体を実行せず、
Codex の権限を回避しません。同梱の `codex` Plugin は Codex app-server の準備のみを行います。
Codex Plugin サポートを有効にし、設定された Computer Use
Plugin を検出またはインストールし、`computer-use` MCP サーバーが利用可能であることを確認してから、
Codex モードのターン中のネイティブ MCP ツール呼び出しを
Codex に委ねます。

OpenClaw がすでにネイティブ Codex ハーネスを使用している場合は、このページを参照してください。
ランタイム自体のセットアップについては、[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。

これは、OpenClaw 組み込みの [Node バックエンド型コンピューターツール](/ja-JP/nodes/computer-use)とは異なります。同じエージェント契約で、エージェントが Gateway 上または別の Node 上のどちらで実行されてもペアリング済み Mac を制御する必要がある場合は、組み込みツールを使用してください。Codex app-server がローカル MCP のインストール、権限、ネイティブツール呼び出しを管理する必要がある場合は、Codex Computer Use を使用してください。

## OpenClaw.app と Peekaboo

OpenClaw.app の Peekaboo 統合は Codex Computer Use とは別のものです。
macOS アプリは PeekabooBridge ソケットをホストでき、`peekaboo` CLI は
Peekaboo 独自の自動化ツール用に、アプリのローカルのアクセシビリティおよび画面収録の許可を
再利用できます。このブリッジは Codex Computer Use のインストールやプロキシを行わず、
Codex Computer Use も PeekabooBridge ソケットを介して呼び出しません。

OpenClaw.app を Peekaboo CLI 自動化のための
権限対応ホストとして使用する場合は、[Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo)を使用してください。
Codex モードの OpenClaw エージェントが、ターン開始前に Codex ネイティブの
`computer-use` MCP Plugin を利用できるようにする場合は、このページを使用してください。

## iOS アプリ

iOS アプリは Codex Computer Use とは別のものです。Codex の
`computer-use` MCP サーバーをインストールまたはプロキシせず、デスクトップ制御のバックエンドでもありません。
代わりに、iOS アプリは OpenClaw Node として接続し、`canvas.*`、`camera.*`、`screen.*`、
`location.*`、`talk.*` などの Node コマンドを通じてモバイル機能を公開します。

Gateway 経由でエージェントに iPhone Node を操作させる場合は、[iOS](/ja-JP/platforms/ios)を使用してください。
Codex モードのエージェントが Codex ネイティブの Computer Use Plugin を通じて
ローカル macOS デスクトップを制御する必要がある場合は、このページを使用してください。

## cua-driver MCP の直接利用

デスクトップ制御を公開する方法は Codex Computer Use だけではありません。
OpenClaw が管理するランタイムから TryCua のドライバーを直接呼び出す場合は、
Codex 固有のマーケットプレイスフローではなく、OpenClaw の MCP レジストリを通じてアップストリームの
`cua-driver mcp` サーバーを使用してください。

`cua-driver` をインストールした後、OpenClaw コマンドを出力させるには、次を実行します。

```bash
cua-driver mcp-config --client openclaw
```

または、stdio サーバーを直接登録します。

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

この方法では、ドライバーのスキーマや構造化された MCP レスポンスを含む、
アップストリームの MCP ツールサーフェスがそのまま維持されます。CUA ドライバーを通常の OpenClaw MCP サーバーとして
利用する場合に使用してください。Codex モードのターン内で Codex app-server が Plugin のインストール、
MCP の再読み込み、ネイティブツール呼び出しを管理する必要がある場合は、
このページの Codex Computer Use セットアップを使用してください。

CUA のドライバーは macOS 専用であり、アクセシビリティや画面収録など、
アプリが要求するローカル macOS 権限が引き続き必要です。OpenClaw は
`cua-driver` のインストール、それらの権限の付与、アップストリームドライバーの
安全モデルの回避を行いません。

## クイックセットアップ

Codex モードのターンでスレッド開始前に Computer Use を利用可能にする必要がある場合は、
`plugins.entries.codex.config.computerUse` を設定します。`autoInstall: true` は
Computer Use を有効化対象に含め、ターン前に OpenClaw がインストールまたは再有効化できるようにします。

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

この設定では、OpenClaw は Codex モードの各ターン前に Codex app-server を確認します。
Computer Use が存在しなくても、Codex app-server がインストール可能なマーケットプレイスをすでに検出している場合、
OpenClaw は Codex app-server に Plugin のインストールまたは再有効化と、
MCP サーバーの再読み込みを要求します。macOS では、一致するマーケットプレイスが登録されておらず、
標準のデスクトップアプリバンドルが存在する場合、OpenClaw は
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled` にある
同梱 Codex マーケットプレイスの登録も試みます。従来のスタンドアロンインストール向けのフォールバックとして、
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` も維持されます。
セットアップ後も MCP サーバーを利用可能にできない場合、スレッド開始前にターンが失敗します。

既存の Codex スレッドがすでに開始されている場合、Computer Use の設定を変更した後は、
テスト前に対象チャットで `/new` または `/reset` を使用してください。

macOS では、Computer Use の管理対象起動は
`/Applications/ChatGPT.app/Contents/Resources/codex` にあるデスクトップアプリのバイナリを優先し、
従来のスタンドアロンインストールでは
`/Applications/Codex.app/Contents/Resources/codex` にフォールバックします。
これは、独自のクライアントを起動する単発の Computer Use ステータスおよび
インストールコマンドにも適用されます。これにより、デスクトップ制御はローカル macOS 権限を所有する
アプリバンドルの管理下に維持されます。デスクトップアプリがインストールされていない場合、
OpenClaw は Plugin と一緒にインストールされた管理対象 Codex バイナリにフォールバックします。
デフォルトの分離されたエージェントホームを使用する通常の管理対象 Codex ターンでは、
古いデスクトップアプリが現在のモデルサポートを覆い隠さないよう、その固定パッケージを最初に優先します。
ユーザースコープのホームはネイティブ Computer Use 状態を読み込めるため、
引き続きデスクトップを優先します。有効な Codex 設定で Computer Use が有効になっている
分離されたエージェントホームも、デスクトップを優先します。明示的な
`appServer.command` 設定または `OPENCLAW_CODEX_APP_SERVER_BIN` は、
引き続きこの管理対象の選択を上書きします。

OpenClaw は、1 つの実行中 Gateway 内でネイティブ Codex 設定の読み取りと
Computer Use のインストールを直列化します。別の Codex プロセスや別の Gateway は、
この排他制御の対象ではありません。Gateway の外部でネイティブ Codex Plugin 設定を変更した後は、
新しい選択に依存する前に Gateway を再起動し、新しいチャットを開始してください。

## コマンド

`codex` Plugin のコマンドサーフェスが利用できる任意のチャット画面から、
`/codex computer-use` コマンドを使用します。これらは OpenClaw のチャット／ランタイムコマンドであり、
`openclaw codex ...` CLI サブコマンドではありません。

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` はデフォルトアクションであり、読み取り専用です。マーケットプレイスソースの追加、
Plugin のインストール、Codex Plugin サポートの有効化は行いません。Computer Use を有効化対象に含める設定がない場合、
単発のインストールコマンドを実行した後でも、`status` は無効と報告することがあります。

`install` は Codex app-server の Plugin サポートを有効にし、必要に応じて
設定済みのマーケットプレイスソースを追加し、Codex app-server を通じて設定済み Plugin を
インストールまたは再有効化し、MCP サーバーを再読み込みして、MCP サーバーがツールを公開していることを検証します。
インストールは信頼されたホストリソースを変更するため、`install` を実行できるのは
オーナーまたは `operator.admin` Gateway クライアントのみです。その他の認可済み送信者は、
上書き指定を含め、読み取り専用の `status` コマンドを引き続き使用できます。

以前のリリースでは、単発の `--plugin`、`--server`、`--mcp-server`
識別子上書きを受け付けていました。代わりに `computerUse.pluginName` と
`computerUse.mcpServerName` を永続的に設定してください。従来の識別子フラグが使用された場合、
コマンドは永続化すべき正確な設定を示し、移行ガイダンス内で要求されたアクションと
サポート対象のマーケットプレイスフラグを繰り返し提示します。

## マーケットプレイスの選択肢

OpenClaw は Codex 自体が公開するものと同じ app-server API を使用します。
マーケットプレイスフィールドでは、Codex が `computer-use` を検索する場所を選択します。

| フィールド           | 使用する場合                                                        | インストールサポート                                     |
| -------------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| マーケットプレイスフィールドなし | Codex app-server に既知のマーケットプレイスを使用させる場合。 | はい。app-server がローカルマーケットプレイスを返す場合。 |
| `marketplaceSource`  | app-server が追加できる Codex マーケットプレイスソースがある場合。 | はい。明示的な `/codex computer-use install` で使用可能。 |
| `marketplacePath`    | ホスト上のローカルマーケットプレイスファイルパスがすでに分かっている場合。 | はい。明示的なインストールとターン開始時の自動インストールで使用可能。 |
| `marketplaceName`    | 登録済みのマーケットプレイスを名前で選択する場合。 | 選択したマーケットプレイスにローカルパスがある場合のみ可。 |

新しい Codex ホームでは、公式マーケットプレイスを初期登録するまで少し時間がかかることがあります。
インストール中、OpenClaw は最大 `marketplaceDiscoveryTimeoutMs` ミリ秒
（デフォルトは 60 秒）にわたって `plugin/list` をポーリングします。

複数の既知のマーケットプレイスに Computer Use が含まれている場合、OpenClaw は
`openai-bundled`、`openai-curated`、`local` の順に優先します。
不明で曖昧な一致は安全側に倒して失敗し、`marketplaceName` または
`marketplacePath` の設定を求めます。

## 同梱 macOS マーケットプレイス

現在の ChatGPT デスクトップビルドでは、Computer Use は次の場所に同梱されています。
従来のスタンドアロン Codex デスクトップビルドでは、`Codex.app` 配下の同じレイアウトを使用します。

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

`computerUse.autoInstall` が true で、`computer-use` を含むマーケットプレイスが
登録されていない場合、OpenClaw は存在する最初の標準同梱マーケットプレイスルートの追加を試みます。

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Codex を使用してシェルから明示的に登録することもできます。

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

標準以外の Codex アプリパスを使用する場合は、`/codex computer-use install
--source <marketplace-root>` を一度実行するか、`computerUse.marketplacePath` に
ローカルマーケットプレイスファイルのパスを設定してください。同梱マーケットプレイスのルートではなく、
マーケットプレイス JSON ファイルのパスがある場合にのみ `--marketplace-path` を使用してください。

### 共有 Plugin キャッシュ

デフォルトの `pluginCacheMode: "independent"` では、各 Codex ホームとその
Plugin キャッシュは管理されません。`pluginCacheMode: "shared"` を設定すると、
app-server の起動前に、同梱の Computer Use Plugin がアクティブな Codex ホームの
検出可能な Plugin キャッシュにコピーされます。共有モードでは、実行中の Codex クライアントが
バージョン付き Plugin ディレクトリを引き続き参照できるため、古いキャッシュ済みバージョンが保持されます。
置換コピーに失敗した場合も、アクティブなキャッシュが保持されます。明示的な
`marketplaceName` または `marketplacePath` の設定は、この整合処理を無効にし、
OpenClaw がその選択を上書きしないようにします。

## リモートカタログの制限

Codex app-server はリモート専用カタログエントリを一覧表示および読み取りできますが、
現在はリモートの `plugin/install` をサポートしていません。そのため、`marketplaceName` では
ステータス確認用にリモート専用マーケットプレイスを選択できますが、インストールと再有効化には
引き続き `marketplaceSource` または `marketplacePath` によるローカルマーケットプレイスが必要です。

ステータスで Plugin がリモート Codex マーケットプレイスから利用可能だが
リモートインストールはサポートされていないと表示された場合は、ローカルソースまたはパスを指定して
インストールを実行します。

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 設定リファレンス

| フィールド                    | デフォルト     | 意味                                                                                       |
| ----------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `enabled`                     | 推論           | Computer Use を必須にします。別の Computer Use フィールドが設定されている場合、デフォルトは true です。 |
| `autoInstall`                 | false          | ターン開始時に、検出済みのマーケットプレイスからインストールまたは再有効化します。         |
| `marketplaceDiscoveryTimeoutMs` | 60000        | Codex app-server のマーケットプレイス検出をインストールが待機する時間です。                 |
| `liveTestTimeoutMs`           | 60000          | 一時的な準備確認スレッドとそのクリーンアップリクエストのタイムアウトです。                 |
| `toolCallTimeoutMs`           | 60000          | Computer Use の `list_apps` 準備確認ツール呼び出しのタイムアウトです。                     |
| `healthCheckEnabled`          | false          | 所有元の app-server クライアントがアクティブな間、定期的な準備確認プローブを実行します。    |
| `healthCheckIntervalMinutes`  | 60             | プローブの実行間隔です。指定可能な値は 30、60、120、または 240 分です。                    |
| `pluginCacheMode`             | `independent`  | バンドルされたデスクトップ Plugin から Codex ホームのキャッシュを更新するには `shared` を使用します。 |
| `strictReadiness`             | false          | ライブプローブが失敗した場合、警告付きで続行せず起動を停止します。                         |
| `autoRepair`                  | false          | 古いスコープ付き Computer Use MCP 子プロセスを終了し、失敗したプローブを 1 回再試行します。 |
| `marketplaceSource`           | 未設定         | Codex app-server の `marketplace/add` に渡すソース文字列です。                             |
| `marketplacePath`             | 未設定         | Plugin を含むローカル Codex マーケットプレイスのファイルパスです。                         |
| `marketplaceName`             | 未設定         | 選択する登録済み Codex マーケットプレイス名です。                                         |
| `pluginName`                  | `computer-use` | Codex マーケットプレイスの Plugin 名です。                                                 |
| `mcpServerName`               | `computer-use` | インストール済み Plugin が公開する MCP サーバー名です。                                    |

ターン開始時の自動インストールは、設定された `marketplaceSource`
の値を意図的に拒否します。新しいソースの追加は明示的なセットアップ操作であるため、
最初に `/codex computer-use install --source <marketplace-source>` を 1 回実行し、その後は
`autoInstall` により、検出済みのローカルマーケットプレイスから再有効化できるようにします。
設定された `marketplacePath` はホスト上にすでに存在するローカルパスであるため、
ターン開始時の自動インストールで使用できます。

各フィールドでは、対応する設定キーが未設定の場合に確認される
環境変数による上書きも使用できます。

| フィールド                    | 環境変数                                                       |
| ----------------------------- | -------------------------------------------------------------- |
| `enabled`                     | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                 | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `liveTestTimeoutMs`           | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`             |
| `toolCallTimeoutMs`           | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`             |
| `healthCheckEnabled`          | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`             |
| `healthCheckIntervalMinutes`  | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`    |
| `pluginCacheMode`             | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                |
| `strictReadiness`             | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                 |
| `autoRepair`                  | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                      |
| `marketplaceSource`           | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                  | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`               | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## OpenClaw が確認する項目

OpenClaw は内部で安定したセットアップ理由を報告し、
チャット向けにユーザー表示用のステータスを整形します。

| 理由                         | 意味                                                   | 次の手順                                         |
| ---------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| `disabled`                   | `computerUse.enabled` が false に解決されました。      | `enabled` または別の Computer Use フィールドを設定します。 |
| `marketplace_missing`        | 一致するマーケットプレイスがありません。               | ソース、パス、またはマーケットプレイス名を設定します。 |
| `plugin_not_installed`       | マーケットプレイスは存在しますが、Plugin がインストールされていません。 | インストールを実行するか、`autoInstall` を有効にします。 |
| `plugin_disabled`            | Plugin はインストール済みですが、Codex 設定で無効になっています。 | インストールを実行して再有効化します。           |
| `remote_install_unsupported` | 選択したマーケットプレイスはリモート専用です。         | `marketplaceSource` または `marketplacePath` を使用します。 |
| `mcp_missing`                | Plugin は有効ですが、MCP サーバーを利用できません。    | Codex Computer Use と OS の権限を確認します。    |
| `ready`                      | Plugin と MCP ツールを利用できます。                   | Codex モードのターンを開始します。               |
| `check_failed`               | ステータス確認中に Codex app-server リクエストが失敗しました。 | app-server の接続とログを確認します。            |
| `auto_install_blocked`       | ターン開始時のセットアップには新しいソースの追加が必要です。 | 最初に明示的なインストールを実行します。         |

チャット出力には、Plugin の状態、MCP サーバーの状態、マーケットプレイス、
利用可能な場合はツール、および失敗したセットアップ手順に対応する具体的なメッセージが含まれます。

## macOS の権限

Computer Use は macOS 専用です。Codex が所有する MCP サーバーがアプリを検査または操作するには、
ローカル OS の権限が必要になる場合があります。OpenClaw が Computer Use は
インストール済みだが MCP サーバーを利用できないと報告する場合は、まず Codex 側の
Computer Use セットアップを確認してください。

- Codex app-server が、デスクトップ操作を行うホストと同じホスト上で実行されています。
- Computer Use Plugin が Codex 設定で有効になっています。
- `computer-use` MCP サーバーが Codex app-server の MCP ステータスに表示されます。
- macOS でデスクトップ操作アプリに必要な権限が付与されています。
- 現在のホストセッションから、操作対象のデスクトップにアクセスできます。

`computerUse.enabled` が true の場合、OpenClaw は意図的にフェイルクローズします。
Codex モードのターンは、設定で必須とされたネイティブデスクトップツールなしで
暗黙的に続行してはなりません。

## トラブルシューティング

**ステータスに未インストールと表示される。** `/codex computer-use install` を実行します。
マーケットプレイスが検出されない場合は、`--source` または `--marketplace-path` を渡します。

**ステータスにインストール済みだが無効と表示される。** `/codex computer-use install` を
もう一度実行します。Codex app-server のインストール処理により、Plugin 設定が有効な状態で書き戻されます。

**ステータスにリモートインストールはサポートされていないと表示される。** ローカルのマーケットプレイス
ソースまたはパスを使用します。リモート専用のカタログエントリは確認できますが、
現在の app-server API ではインストールできません。

**ステータスに MCP サーバーを利用できないと表示される。** MCP
サーバーを再読み込みするため、インストールを 1 回再実行します。それでも利用できない場合は、
Codex Computer Use アプリ、Codex app-server の MCP ステータス、または macOS の権限を修正します。

**ステータスまたはプローブが `computer-use.list_apps` でタイムアウトする。** Plugin と
MCP サーバーは存在しますが、ローカルの Computer Use ブリッジが応答しませんでした。
Codex Computer Use を終了または再起動し、必要に応じて Codex Desktop を再起動してから、
新しい OpenClaw セッションで再試行します。ホストが以前、古い管理対象 Codex app-server 経由で
Computer Use を実行していた場合は、デスクトップにバンドルされたマーケットプレイスから
インストール済み Plugin を更新してください（スタンドアロンの Codex デスクトップを
インストールしている場合は `Codex.app` のパスを使用します）。

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Computer Use ツールに `Native hook relay unavailable` と表示される。**
Codex ネイティブのツールフックが、ローカルブリッジまたは Gateway フォールバックを介して、
アクティブな OpenClaw リレーに到達できませんでした。`/new` または `/reset` を使用して
新しい OpenClaw セッションを開始します。一度は動作しても、その後のツール呼び出しで再び失敗する場合、
`/new` は現在の試行をクリアしているだけです。古いスレッドとフック登録を破棄するため、
Codex app-server または OpenClaw Gateway を再起動してから、新しいセッションで再試行します。

**ターン開始時の自動インストールがソースを拒否する。** これは意図した動作です。
最初に明示的な `/codex computer-use install --source
<marketplace-source>` でソースを追加すると、以降のターン開始時の自動インストールで、
検出済みのローカルマーケットプレイスを使用できるようになります。

## 関連項目

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo)
- [iOS アプリ](/ja-JP/platforms/ios)
