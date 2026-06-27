---
read_when:
    - Codex モードの OpenClaw エージェントで Codex Computer Use を使用したい
    - Codex Computer Use、PeekabooBridge、直接の cua-driver MCP のどれを使うか判断している
    - Codex Computer Use と直接の cua-driver MCP セットアップのどちらにするかを決めている
    - バンドルされた Codex plugin の computerUse を設定しています
    - /codex computer-use のステータスまたはインストールのトラブルシューティング
summary: Codex モードの OpenClaw エージェント向けに Codex Computer Use を設定する
title: Codex コンピューター使用
x-i18n:
    generated_at: "2026-06-27T12:11:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use は、ローカルデスクトップ制御向けの Codex ネイティブ MCP プラグインです。OpenClaw はデスクトップアプリをベンダー化せず、デスクトップ操作を自ら実行せず、Codex 権限をバイパスしません。バンドルされた `codex` プラグインは Codex app-server を準備するだけです。つまり、Codex プラグインサポートを有効化し、設定済みの Codex Computer Use プラグインを検出またはインストールし、`computer-use` MCP サーバーが利用可能か確認してから、Codex モードのターン中のネイティブ MCP ツール呼び出しは Codex に任せます。

OpenClaw がすでにネイティブ Codex ハーネスを使用している場合にこのページを使用してください。ランタイムセットアップ自体については、[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。

## OpenClaw.app と Peekaboo

OpenClaw.app の Peekaboo 連携は Codex Computer Use とは別です。macOS アプリは PeekabooBridge ソケットをホストできるため、`peekaboo` CLI は Peekaboo 独自の自動化ツール向けに、アプリのローカルのアクセシビリティと画面収録の許可を再利用できます。このブリッジは Codex Computer Use をインストールしたりプロキシしたりせず、Codex Computer Use も PeekabooBridge ソケット経由で呼び出しません。

OpenClaw.app を Peekaboo CLI 自動化向けの権限認識ホストにしたい場合は、[Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo)を使用してください。Codex モードの OpenClaw エージェントで、ターン開始前に Codex ネイティブの `computer-use` MCP プラグインを利用可能にしておきたい場合は、このページを使用してください。

## iOS アプリ

iOS アプリは Codex Computer Use とは別です。Codex `computer-use` MCP サーバーをインストールしたりプロキシしたりせず、デスクトップ制御バックエンドでもありません。代わりに、iOS アプリは OpenClaw ノードとして接続し、`canvas.*`、`camera.*`、`screen.*`、`location.*`、`talk.*` などのノードコマンドを通じてモバイル機能を公開します。

エージェントに Gateway 経由で iPhone ノードを操作させたい場合は、[iOS](/ja-JP/platforms/ios)を使用してください。Codex モードのエージェントで、Codex ネイティブの Computer Use プラグインを通じてローカル macOS デスクトップを制御したい場合は、このページを使用してください。

## 直接 cua-driver MCP

デスクトップ制御を公開する方法は Codex Computer Use だけではありません。OpenClaw 管理ランタイムから TryCua のドライバーを直接呼び出したい場合は、Codex 固有のマーケットプレイスフローではなく、OpenClaw の MCP レジストリ経由でアップストリームの `cua-driver mcp` サーバーを使用してください。

`cua-driver` をインストールした後、OpenClaw コマンドを出力させます。

```bash
cua-driver mcp-config --client openclaw
```

または stdio サーバーを自分で登録します。

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

この経路では、ドライバースキーマと構造化 MCP レスポンスを含め、アップストリームの MCP ツールサーフェスがそのまま維持されます。CUA ドライバーを通常の OpenClaw MCP サーバーとして利用可能にしたい場合に使用してください。Codex app-server にプラグインのインストール、MCP リロード、Codex モードのターン内でのネイティブツール呼び出しを所有させたい場合は、このページの Codex Computer Use セットアップを使用してください。

CUA のドライバーは macOS 固有であり、アクセシビリティや画面収録など、アプリが求めるローカル macOS 権限が引き続き必要です。OpenClaw は `cua-driver` をインストールせず、それらの権限を付与せず、アップストリームドライバーの安全モデルをバイパスしません。

## クイックセットアップ

Codex モードのターンで、スレッド開始前に Computer Use を利用可能にする必要がある場合は、`plugins.entries.codex.config.computerUse` を設定します。`autoInstall: true` は Computer Use を有効化し、ターン前に OpenClaw がそれをインストールまたは再有効化できるようにします。

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

この設定では、OpenClaw は各 Codex モードのターン前に Codex app-server を確認します。Computer Use が存在しないものの、Codex app-server がインストール可能なマーケットプレイスをすでに検出している場合、OpenClaw は Codex app-server にプラグインのインストールまたは再有効化と MCP サーバーのリロードを依頼します。macOS では、一致するマーケットプレイスが登録されておらず、標準の Codex アプリバンドルが存在する場合、OpenClaw は失敗する前に `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` からバンドルされた Codex マーケットプレイスを登録しようとします。それでもセットアップで MCP サーバーを利用可能にできない場合、ターンはスレッド開始前に失敗します。

Computer Use 設定を変更した後、既存の Codex スレッドがすでに開始されている場合は、テスト前に対象チャットで `/new` または `/reset` を使用してください。

macOS の管理 stdio 起動では、OpenClaw は存在する場合、署名済みデスクトップ Codex アプリバンドルの `/Applications/Codex.app/Contents/Resources/codex` を優先します。これにより、Computer Use はローカルデスクトップ制御権限を所有するアプリバンドル配下に保たれます。デスクトップアプリがインストールされていない場合、OpenClaw はプラグインの隣にインストールされた管理 Codex バイナリへフォールバックします。インストール済みのデスクトップアプリが未対応の app-server バージョンで初期化された場合、OpenClaw は古いデスクトップアプリがプラグインローカルのフォールバックを隠してしまわないように、その子プロセスを閉じて次の管理バイナリ候補を再試行します。明示的な `appServer.command` 設定または `OPENCLAW_CODEX_APP_SERVER_BIN` は、この管理選択を引き続き上書きします。

## コマンド

`codex` プラグインのコマンドサーフェスが利用可能な任意のチャットサーフェスから、`/codex computer-use` コマンドを使用します。これらは OpenClaw のチャット/ランタイムコマンドであり、`openclaw codex ...` CLI サブコマンドではありません。

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` は読み取り専用です。マーケットプレイスソースを追加したり、プラグインをインストールしたり、Codex プラグインサポートを有効化したりしません。Computer Use を有効にする設定がない場合、1 回限りの install コマンド後でも、`status` は無効と報告することがあります。

`install` は Codex app-server プラグインサポートを有効化し、必要に応じて設定済みのマーケットプレイスソースを追加し、Codex app-server 経由で設定済みプラグインをインストールまたは再有効化し、MCP サーバーをリロードし、MCP サーバーがツールを公開していることを検証します。

## マーケットプレイスの選択

OpenClaw は Codex 自体が公開するものと同じ app-server API を使用します。マーケットプレイスフィールドは、Codex が `computer-use` をどこで探すべきかを選択します。

| フィールド | 使用する場合 | インストールサポート |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| マーケットプレイスフィールドなし | Codex app-server に、すでに認識しているマーケットプレイスを使わせたい場合。 | はい。app-server がローカルマーケットプレイスを返す場合。 |
| `marketplaceSource` | Codex app-server が追加できる Codex マーケットプレイスソースがある場合。 | はい。明示的な `/codex computer-use install` 向け。 |
| `marketplacePath` | ホスト上のローカルマーケットプレイスファイルパスをすでに知っている場合。 | はい。明示的なインストールとターン開始時の自動インストール向け。 |
| `marketplaceName` | すでに登録済みのマーケットプレイスを名前で 1 つ選択したい場合。 | はい。ただし選択したマーケットプレイスにローカルパスがある場合のみ。 |

新しい Codex ホームでは、公式マーケットプレイスをシードするまで少し時間が必要な場合があります。インストール中、OpenClaw は最大 `marketplaceDiscoveryTimeoutMs` ミリ秒まで `plugin/list` をポーリングします。デフォルトは 60 秒です。

既知の複数のマーケットプレイスに Computer Use が含まれている場合、OpenClaw は `openai-bundled`、次に `openai-curated`、次に `local` を優先します。不明な曖昧一致はフェイルクローズし、`marketplaceName` または `marketplacePath` の設定を求めます。

## バンドルされた macOS マーケットプレイス

最近の Codex デスクトップビルドでは、Computer Use はここにバンドルされています。

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

`computerUse.autoInstall` が true で、`computer-use` を含むマーケットプレイスが登録されていない場合、OpenClaw は標準のバンドル済みマーケットプレイスルートを自動的に追加しようとします。

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Codex を使ってシェルから明示的に登録することもできます。

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

非標準の Codex アプリパスを使用している場合は、`/codex computer-use install
--source <marketplace-root>` を一度実行するか、`computerUse.marketplacePath` をローカルマーケットプレイスファイルパスに設定してください。`--marketplace-path` は、バンドル済みマーケットプレイスルートではなく、マーケットプレイス JSON ファイルパスがある場合にのみ使用してください。

## リモートカタログの制限

Codex app-server はリモートのみのカタログエントリを一覧表示して読み取れますが、現在はリモート `plugin/install` をサポートしていません。つまり、`marketplaceName` はステータスチェック向けにリモートのみのマーケットプレイスを選択できますが、インストールと再有効化には引き続き `marketplaceSource` または `marketplacePath` によるローカルマーケットプレイスが必要です。

ステータスが、プラグインはリモート Codex マーケットプレイスで利用可能だがリモートインストールは未対応だと示す場合は、ローカルソースまたはパスで install を実行してください。

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 設定リファレンス

| フィールド | デフォルト | 意味 |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled` | inferred | Computer Use を要求します。他の Computer Use フィールドが設定されている場合、デフォルトは true です。 |
| `autoInstall` | false | ターン開始時に、すでに検出済みのマーケットプレイスからインストールまたは再有効化します。 |
| `marketplaceDiscoveryTimeoutMs` | 60000 | インストールが Codex app-server のマーケットプレイス検出を待つ時間。 |
| `marketplaceSource` | unset | Codex app-server `marketplace/add` に渡されるソース文字列。 |
| `marketplacePath` | unset | プラグインを含むローカル Codex マーケットプレイスファイルパス。 |
| `marketplaceName` | unset | 選択する登録済み Codex マーケットプレイス名。 |
| `pluginName` | `computer-use` | Codex マーケットプレイスプラグイン名。 |
| `mcpServerName` | `computer-use` | インストール済みプラグインによって公開される MCP サーバー名。 |

ターン開始時の自動インストールは、設定済みの `marketplaceSource` 値を意図的に拒否します。新しいソースの追加は明示的なセットアップ操作なので、`/codex computer-use install --source <marketplace-source>` を一度使用し、その後は `autoInstall` に検出済みローカルマーケットプレイスからの将来の再有効化を任せてください。ターン開始時の自動インストールは、設定済みの `marketplacePath` を使用できます。これはすでにホスト上のローカルパスだからです。

## OpenClaw が確認すること

OpenClaw は安定したセットアップ理由を内部で報告し、ユーザー向けステータスをチャット用に整形します。

| 理由                         | 意味                                                   | 次のステップ                                  |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` が false に解決されました。      | `enabled` または別のコンピューター操作フィールドを設定します。 |
| `marketplace_missing`        | 一致するマーケットプレイスが利用できませんでした。    | ソース、パス、またはマーケットプレイス名を設定します。 |
| `plugin_not_installed`       | マーケットプレイスは存在しますが、Plugin がインストールされていません。 | install を実行するか、`autoInstall` を有効にします。 |
| `plugin_disabled`            | Plugin はインストールされていますが、Codex config で無効になっています。 | install を実行して再度有効にします。          |
| `remote_install_unsupported` | 選択したマーケットプレイスはリモート専用です。        | `marketplaceSource` または `marketplacePath` を使用します。 |
| `mcp_missing`                | Plugin は有効ですが、MCP サーバーが利用できません。   | Codex コンピューター操作と OS 権限を確認します。 |
| `ready`                      | Plugin と MCP ツールが利用できます。                  | Codex モードのターンを開始します。            |
| `check_failed`               | ステータス確認中に Codex app-server リクエストが失敗しました。 | app-server の接続性とログを確認します。       |
| `auto_install_blocked`       | ターン開始時のセットアップで新しいソースを追加する必要があります。 | 先に明示的な install を実行します。           |

チャット出力には、Plugin の状態、MCP サーバーの状態、マーケットプレイス、利用可能な場合はツール、
および失敗したセットアップステップの具体的なメッセージが含まれます。

## macOS 権限

コンピューター操作は macOS 固有です。Codex 所有の MCP サーバーは、アプリを検査または制御する前に
ローカル OS 権限を必要とする場合があります。OpenClaw がコンピューター操作はインストール済みだが
MCP サーバーが利用できないと表示する場合は、まず Codex 側のコンピューター操作セットアップを確認してください。

- Codex app-server が、デスクトップ制御を行う必要がある同じホストで実行されている。
- コンピューター操作 Plugin が Codex config で有効になっている。
- `computer-use` MCP サーバーが Codex app-server MCP ステータスに表示されている。
- macOS がデスクトップ制御アプリに必要な権限を付与している。
- 現在のホストセッションが制御対象のデスクトップにアクセスできる。

`computerUse.enabled` が true の場合、OpenClaw は意図的に fail closed します。
Codex モードのターンは、config が要求したネイティブのデスクトップツールなしに黙って進むべきではありません。

## トラブルシューティング

**ステータスが未インストールと表示する。** `/codex computer-use install` を実行します。
マーケットプレイスが検出されない場合は、`--source` または `--marketplace-path` を渡します。

**ステータスがインストール済みだが無効と表示する。** `/codex computer-use install` を再度実行します。
Codex app-server の install は Plugin config を有効な状態に書き戻します。

**ステータスがリモートインストールはサポートされていないと表示する。** ローカルのマーケットプレイスソースまたは
パスを使用します。リモート専用のカタログ項目は検査できますが、現在の app-server API 経由ではインストールできません。

**ステータスが MCP サーバーは利用できないと表示する。** MCP サーバーを再読み込みするために、install を一度再実行します。
それでも利用できない場合は、Codex コンピューター操作アプリ、Codex app-server MCP ステータス、または macOS 権限を修正します。

**ステータスまたは probe が `computer-use.list_apps` でタイムアウトする。** Plugin と MCP
サーバーは存在しますが、ローカルのコンピューター操作ブリッジが応答しませんでした。Codex コンピューター操作を終了または
再起動し、必要に応じて Codex Desktop を再起動してから、新しい OpenClaw セッションで再試行します。ホストが以前に古い
管理対象 Codex app-server 経由でコンピューター操作を実行していた場合は、デスクトップにバンドルされた
マーケットプレイスからインストール済み Plugin を更新してください。

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**コンピューター操作ツールが `Native hook relay unavailable` と表示する。** Codex ネイティブの
ツールフックが、ローカルブリッジまたは Gateway フォールバック経由でアクティブな OpenClaw リレーに到達できませんでした。
`/new` または `/reset` で新しい OpenClaw セッションを開始します。一度動作してから後続のツール呼び出しで再び失敗する場合、
`/new` は現在の試行をクリアしているだけです。古いスレッドとフック登録が破棄されるように Codex app-server または
OpenClaw Gateway を再起動し、その後新しいセッションで再試行します。

**ターン開始時の auto-install がソースを拒否する。** これは意図された動作です。まず
明示的な `/codex computer-use install --source <marketplace-source>` でソースを追加してください。
そうすれば、以降のターン開始時の auto-install は検出済みのローカルマーケットプレイスを使用できます。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo)
- [iOS アプリ](/ja-JP/platforms/ios)
