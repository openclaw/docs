---
read_when:
    - Codex モードの OpenClaw エージェントで Codex Computer Use を使用したい
    - Codex Computer Use、PeekabooBridge、直接の cua-driver MCP のどれを選ぶかを判断しています
    - Codex Computer Use と直接の cua-driver MCP セットアップのどちらにするかを判断しています
    - バンドルされた Codex plugin の computerUse を設定しています
    - /codex computer-use status または install のトラブルシューティングを行っている
summary: CodexモードのOpenClawエージェント向けにCodex Computer Useを設定する
title: Codex コンピューター操作
x-i18n:
    generated_at: "2026-05-10T19:42:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e1637ad13a96324aebbf97fb179b8c846b27541e917fd56e586c75e79eea7bb
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use は、ローカルデスクトップ制御用の Codex ネイティブ MCP Plugin です。OpenClaw はデスクトップアプリをベンダー提供せず、デスクトップ操作を自分で実行せず、Codex の権限を回避しません。バンドルされた `codex` plugin は Codex app-server だけを準備します。Codex plugin サポートを有効にし、設定された Codex Computer Use plugin を検索またはインストールし、`computer-use` MCP サーバーが利用可能であることを確認してから、Codex モードのターン中は Codex にネイティブ MCP ツール呼び出しを所有させます。

OpenClaw がすでにネイティブ Codex ハーネスを使用している場合は、このページを使用してください。ランタイムのセットアップ自体については、[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。

## OpenClaw.app と Peekaboo

OpenClaw.app の Peekaboo 連携は Codex Computer Use とは別です。macOS アプリは PeekabooBridge ソケットをホストできるため、`peekaboo` CLI は Peekaboo 独自の自動化ツール用に、アプリのローカルのアクセシビリティと画面収録の許可を再利用できます。このブリッジは Codex Computer Use をインストールまたはプロキシせず、Codex Computer Use も PeekabooBridge ソケット経由で呼び出しません。

OpenClaw.app を Peekaboo CLI 自動化の権限対応ホストにしたい場合は、[Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo)を使用してください。Codex モードの OpenClaw エージェントが、ターン開始前に Codex のネイティブ `computer-use` MCP plugin を利用できるようにしたい場合は、このページを使用してください。

## iOS アプリ

iOS アプリは Codex Computer Use とは別です。Codex `computer-use` MCP サーバーをインストールまたはプロキシせず、デスクトップ制御バックエンドでもありません。代わりに、iOS アプリは OpenClaw ノードとして接続し、`canvas.*`、`camera.*`、`screen.*`、`location.*`、`talk.*` などのノードコマンドを通じてモバイル機能を公開します。

エージェントに Gateway 経由で iPhone ノードを操作させたい場合は、[iOS](/ja-JP/platforms/ios)を使用してください。Codex モードのエージェントに、Codex のネイティブ Computer Use plugin を通じてローカルの macOS デスクトップを制御させたい場合は、このページを使用してください。

## 直接の cua-driver MCP

Codex Computer Use は、デスクトップ制御を公開する唯一の方法ではありません。OpenClaw が管理するランタイムから TryCua のドライバーを直接呼び出したい場合は、Codex 固有のマーケットプレイスフローではなく、OpenClaw の MCP レジストリを通じて upstream の `cua-driver mcp` サーバーを使用してください。

`cua-driver` をインストールした後、OpenClaw コマンドを出力させます。

```bash
cua-driver mcp-config --client openclaw
```

または、自分で stdio サーバーを登録します。

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

この経路では、ドライバースキーマと構造化された MCP レスポンスを含め、upstream の MCP ツールサーフェスをそのまま保ちます。CUA ドライバーを通常の OpenClaw MCP サーバーとして利用したい場合に使用してください。Codex app-server に plugin のインストール、MCP の再読み込み、Codex モードのターン内でのネイティブツール呼び出しを所有させたい場合は、このページの Codex Computer Use セットアップを使用してください。

CUA のドライバーは macOS 固有であり、アクセシビリティや画面収録など、アプリが要求するローカル macOS 権限が引き続き必要です。OpenClaw は `cua-driver` をインストールせず、これらの権限を付与せず、upstream ドライバーの安全性モデルを回避しません。

## クイックセットアップ

Codex モードのターンで、スレッド開始前に Computer Use を利用可能にする必要がある場合は、`plugins.entries.codex.config.computerUse` を設定します。

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

この設定では、OpenClaw は各 Codex モードのターン前に Codex app-server を確認します。Computer Use がない一方で、Codex app-server がインストール可能なマーケットプレイスをすでに検出している場合、OpenClaw は Codex app-server に plugin のインストールまたは再有効化と MCP サーバーの再読み込みを依頼します。macOS では、一致するマーケットプレイスが登録されておらず、標準の Codex アプリバンドルが存在する場合、OpenClaw は失敗する前に `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` からバンドルされた Codex マーケットプレイスの登録も試みます。それでもセットアップで MCP サーバーを利用可能にできない場合、ターンはスレッド開始前に失敗します。

Computer Use の設定を変更した後、既存の Codex スレッドがすでに開始されている場合は、テスト前に対象チャットで `/new` または `/reset` を使用してください。

## コマンド

`codex` plugin コマンドサーフェスが利用可能な任意のチャットサーフェスから、`/codex computer-use` コマンドを使用します。これらは OpenClaw のチャット/ランタイムコマンドであり、`openclaw codex ...` CLI サブコマンドではありません。

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` は読み取り専用です。マーケットプレイスソースの追加、plugin のインストール、Codex plugin サポートの有効化は行いません。

`install` は Codex app-server plugin サポートを有効にし、必要に応じて設定されたマーケットプレイスソースを追加し、Codex app-server を通じて設定された plugin をインストールまたは再有効化し、MCP サーバーを再読み込みし、MCP サーバーがツールを公開していることを検証します。

## マーケットプレイスの選択

OpenClaw は、Codex 自体が公開するものと同じ app-server API を使用します。マーケットプレイスフィールドは、Codex が `computer-use` をどこで見つけるべきかを選択します。

| フィールド | 使用する場合 | インストールサポート |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| マーケットプレイスフィールドなし | Codex app-server に、すでに認識しているマーケットプレイスを使用させたい。 | はい。app-server がローカルマーケットプレイスを返す場合。 |
| `marketplaceSource` | Codex app-server が追加できる Codex マーケットプレイスソースがある。 | はい。明示的な `/codex computer-use install` の場合。 |
| `marketplacePath` | ホスト上のローカルマーケットプレイスファイルパスをすでに知っている。 | はい。明示的なインストールとターン開始時の自動インストールの場合。 |
| `marketplaceName` | 登録済みマーケットプレイスの 1 つを名前で選択したい。 | 選択したマーケットプレイスにローカルパスがある場合のみ、はい。 |

新しい Codex ホームでは、公式マーケットプレイスをシードするまで短い時間が必要な場合があります。インストール中、OpenClaw は最大 `marketplaceDiscoveryTimeoutMs` ミリ秒まで `plugin/list` をポーリングします。デフォルトは 60 秒です。

複数の既知のマーケットプレイスに Computer Use が含まれる場合、OpenClaw は `openai-bundled`、次に `openai-curated`、次に `local` を優先します。不明な曖昧一致はフェイルクローズし、`marketplaceName` または `marketplacePath` の設定を求めます。

## バンドルされた macOS マーケットプレイス

最近の Codex デスクトップビルドは Computer Use をここにバンドルしています。

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

標準ではない Codex アプリパスを使用している場合は、`computerUse.marketplacePath` にローカルマーケットプレイスファイルパスを設定するか、`/codex computer-use install --source
<marketplace-source>` を一度実行してください。

## リモートカタログの制限

Codex app-server はリモート専用カタログエントリを一覧表示して読み取ることができますが、現在はリモートの `plugin/install` をサポートしていません。つまり、`marketplaceName` はステータス確認用にリモート専用マーケットプレイスを選択できますが、インストールと再有効化には引き続き `marketplaceSource` または `marketplacePath` 経由のローカルマーケットプレイスが必要です。

ステータスで、plugin がリモート Codex マーケットプレイスで利用可能だがリモートインストールは未対応であると表示される場合は、ローカルソースまたはパスを指定して install を実行してください。

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 設定リファレンス

| フィールド | デフォルト | 意味 |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled` | 推論 | Computer Use を必須にする。別の Computer Use フィールドが設定されている場合、デフォルトは true。 |
| `autoInstall` | false | ターン開始時に、すでに検出されたマーケットプレイスからインストールまたは再有効化する。 |
| `marketplaceDiscoveryTimeoutMs` | 60000 | インストールが Codex app-server のマーケットプレイス検出を待つ時間。 |
| `marketplaceSource` | 未設定 | Codex app-server `marketplace/add` に渡すソース文字列。 |
| `marketplacePath` | 未設定 | plugin を含むローカル Codex マーケットプレイスファイルパス。 |
| `marketplaceName` | 未設定 | 選択する登録済み Codex マーケットプレイス名。 |
| `pluginName` | `computer-use` | Codex マーケットプレイス plugin 名。 |
| `mcpServerName` | `computer-use` | インストール済み plugin が公開する MCP サーバー名。 |

ターン開始時の自動インストールは、設定された `marketplaceSource` 値を意図的に拒否します。新しいソースの追加は明示的なセットアップ操作であるため、`/codex computer-use install --source <marketplace-source>` を一度使用してから、今後の再有効化は検出済みのローカルマーケットプレイスから `autoInstall` に処理させてください。ターン開始時の自動インストールは、ホスト上のローカルパスとしてすでに存在するため、設定された `marketplacePath` を使用できます。

## OpenClaw が確認する内容

OpenClaw は内部的に安定したセットアップ理由を報告し、チャット向けにユーザー表示用のステータスを整形します。

| 理由 | 意味 | 次の手順 |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled` | `computerUse.enabled` が false に解決された。 | `enabled` または別の Computer Use フィールドを設定する。 |
| `marketplace_missing` | 一致するマーケットプレイスが利用できなかった。 | ソース、パス、またはマーケットプレイス名を設定する。 |
| `plugin_not_installed` | マーケットプレイスは存在するが、plugin がインストールされていない。 | install を実行するか、`autoInstall` を有効にする。 |
| `plugin_disabled` | plugin はインストールされているが、Codex 設定で無効化されている。 | install を実行して再有効化する。 |
| `remote_install_unsupported` | 選択されたマーケットプレイスはリモート専用。 | `marketplaceSource` または `marketplacePath` を使用する。 |
| `mcp_missing` | plugin は有効だが、MCP サーバーが利用できない。 | Codex Computer Use と OS 権限を確認する。 |
| `ready` | plugin と MCP ツールが利用可能。 | Codex モードのターンを開始する。 |
| `check_failed` | ステータス確認中に Codex app-server リクエストが失敗した。 | app-server の接続性とログを確認する。 |
| `auto_install_blocked` | ターン開始時のセットアップで新しいソースの追加が必要になる。 | 先に明示的な install を実行する。 |

チャット出力には、plugin の状態、MCP サーバーの状態、マーケットプレイス、利用可能な場合はツール、失敗したセットアップ手順に固有のメッセージが含まれます。

## macOS 権限

Computer Use は macOS 固有です。Codex が所有する MCP サーバーは、アプリを検査または制御する前にローカル OS 権限が必要になる場合があります。OpenClaw が Computer Use はインストール済みだが MCP サーバーを利用できないと表示する場合は、まず Codex 側の Computer Use セットアップを確認してください:

- Codex app-server は、デスクトップ制御を実行する同じホストで実行されている。
- Computer Use Plugin が Codex 設定で有効になっている。
- `computer-use` MCP サーバーが Codex app-server の MCP ステータスに表示されている。
- macOS がデスクトップ制御アプリに必要な権限を付与している。
- 現在のホストセッションが、制御対象のデスクトップにアクセスできる。

`computerUse.enabled` が true の場合、OpenClaw は意図的に失敗して閉じる。Codex モードのターンは、設定で要求されたネイティブデスクトップツールなしに、暗黙に続行すべきではない。

## トラブルシューティング

**ステータスに未インストールと表示される。** `/codex computer-use install` を実行する。マーケットプレイスが検出されない場合は、`--source` または `--marketplace-path` を渡す。

**ステータスにインストール済みだが無効と表示される。** `/codex computer-use install` をもう一度実行する。Codex app-server のインストールは、Plugin 設定を有効に戻して書き込む。

**ステータスにリモートインストールはサポートされていないと表示される。** ローカルのマーケットプレイスソースまたはパスを使用する。リモート専用のカタログエントリは確認できるが、現在の app-server API ではインストールできない。

**ステータスに MCP サーバーが利用不可と表示される。** MCP サーバーを再読み込みするため、インストールを一度再実行する。それでも利用不可のままの場合は、Codex Computer Use アプリ、Codex app-server の MCP ステータス、または macOS の権限を修正する。

**ステータスまたはプローブが `computer-use.list_apps` でタイムアウトする。** Plugin と MCP サーバーは存在しているが、ローカルの Computer Use ブリッジが応答していない。Codex Computer Use を終了または再起動し、必要であれば Codex Desktop を再起動してから、新しい OpenClaw セッションでもう一度試す。

**Computer Use ツールに `Native hook relay unavailable` と表示される。** Codex ネイティブのツールフックが、ローカルブリッジまたは Gateway フォールバック経由で、アクティブな OpenClaw リレーに到達できなかった。`/new` または `/reset` で新しい OpenClaw セッションを開始する。発生し続ける場合は、古い app-server スレッドとフック登録が破棄されるように Gateway を再起動してから、もう一度試す。

**ターン開始時の自動インストールがソースを拒否する。** これは意図された動作である。まず明示的に `/codex computer-use install --source <marketplace-source>` でソースを追加する。以後のターン開始時の自動インストールでは、検出されたローカルマーケットプレイスを使用できる。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo)
- [iOS アプリ](/ja-JP/platforms/ios)
