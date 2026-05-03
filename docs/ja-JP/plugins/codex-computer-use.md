---
read_when:
    - Codex モードの OpenClaw エージェントで Codex Computer Use を使用したい
    - Codex Computer Use、PeekabooBridge、直接の cua-driver MCP のどれを選ぶかを判断している
    - Codex Computer Use と直接の cua-driver MCP セットアップのどちらにするかを決める
    - 同梱の Codex Plugin 用に computerUse を設定しています
    - /codex computer-use status または install のトラブルシューティングを行っている
summary: Codex モードの OpenClaw エージェント向けに Codex Computer Use を設定する
title: Codex コンピューター操作
x-i18n:
    generated_at: "2026-05-03T05:00:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use は、ローカルデスクトップ制御用の Codex ネイティブ MCP Plugin です。OpenClaw
はデスクトップアプリをベンダリングせず、デスクトップ操作を自ら実行せず、
Codex の権限をバイパスしません。バンドルされた `codex` Plugin は Codex app-server の準備だけを行います。
Codex の Plugin サポートを有効にし、設定済みの Codex
Computer Use Plugin を検索またはインストールし、`computer-use` MCP サーバーが利用可能であることを確認してから、
Codex モードのターン中のネイティブ MCP ツール呼び出しは Codex に所有させます。

OpenClaw がすでにネイティブ Codex ハーネスを使用している場合は、このページを使用してください。
ランタイム設定自体については、[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。

## OpenClaw.app と Peekaboo

OpenClaw.app の Peekaboo 統合は Codex Computer Use とは別です。macOS
アプリは PeekabooBridge ソケットをホストできるため、`peekaboo` CLI は Peekaboo 独自の
自動化ツール向けに、アプリのローカルのアクセシビリティと画面収録の許可を再利用できます。
このブリッジは Codex Computer Use をインストールまたはプロキシせず、
Codex Computer Use が PeekabooBridge ソケット経由で呼び出すこともありません。

OpenClaw.app を Peekaboo CLI 自動化の権限認識ホストとして使いたい場合は
[Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo)を使用してください。Codex モードの
OpenClaw エージェントが、ターン開始前に Codex のネイティブ `computer-use` MCP Plugin を
利用可能にしておく必要がある場合は、このページを使用してください。

## iOS アプリ

iOS アプリは Codex Computer Use とは別です。Codex の `computer-use` MCP サーバーを
インストールまたはプロキシせず、デスクトップ制御バックエンドでもありません。
代わりに、iOS アプリは OpenClaw ノードとして接続し、`canvas.*`、`camera.*`、`screen.*`、
`location.*`、`talk.*` などのノードコマンドを通じてモバイル機能を公開します。

Gateway を通じてエージェントに iPhone ノードを操作させたい場合は
[iOS](/ja-JP/platforms/ios)を使用してください。Codex モードのエージェントが Codex のネイティブ
Computer Use Plugin を通じてローカル macOS デスクトップを制御する必要がある場合は、このページを使用してください。

## 直接の cua-driver MCP

Codex Computer Use はデスクトップ制御を公開する唯一の方法ではありません。OpenClaw 管理の
ランタイムから TryCua のドライバーを直接呼び出したい場合は、Codex 固有のマーケットプレイスフローではなく、
OpenClaw の MCP レジストリを通じてアップストリームの `cua-driver mcp` サーバーを使用してください。

`cua-driver` をインストールした後、OpenClaw コマンドを出力させます。

```bash
cua-driver mcp-config --client openclaw
```

または、stdio サーバーを自分で登録します。

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

この経路では、ドライバースキーマや構造化 MCP レスポンスを含む、アップストリームの MCP
ツールサーフェスがそのまま維持されます。CUA ドライバーを通常の OpenClaw MCP サーバーとして
利用可能にしたい場合に使用してください。Codex app-server に Plugin のインストール、MCP リロード、
Codex モードのターン内でのネイティブツール呼び出しを所有させたい場合は、このページの
Codex Computer Use 設定を使用してください。

CUA のドライバーは macOS 固有であり、アクセシビリティや画面収録など、アプリが要求する
ローカル macOS 権限が引き続き必要です。OpenClaw は `cua-driver` をインストールしたり、
それらの権限を付与したり、アップストリームドライバーの安全モデルをバイパスしたりしません。

## クイック設定

Codex モードのターンでスレッド開始前に Computer Use を利用可能にしておく必要がある場合は、
`plugins.entries.codex.config.computerUse` を設定します。

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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

この設定では、OpenClaw は各 Codex モードのターン前に Codex app-server を確認します。
Computer Use が見つからない一方で、Codex app-server がインストール可能なマーケットプレイスを
すでに検出している場合、OpenClaw は Codex app-server に Plugin のインストールまたは再有効化と
MCP サーバーのリロードを依頼します。macOS では、一致するマーケットプレイスが登録されておらず、
標準の Codex アプリバンドルが存在する場合、OpenClaw は失敗する前に
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` から
バンドルされた Codex マーケットプレイスを登録することも試みます。それでも設定で MCP サーバーを
利用可能にできない場合、ターンはスレッド開始前に失敗します。

既存のセッションは、ランタイムと Codex スレッドのバインディングを保持します。
`agentRuntime` または Computer Use の設定を変更した後は、テストする前に対象のチャットで
`/new` または `/reset` を使用してください。

## コマンド

`codex` Plugin のコマンドサーフェスが利用可能な任意のチャットサーフェスから
`/codex computer-use` コマンドを使用します。これらは OpenClaw のチャット/ランタイムコマンドであり、
`openclaw codex ...` CLI サブコマンドではありません。

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` は読み取り専用です。マーケットプレイスソースの追加、Plugin のインストール、
Codex Plugin サポートの有効化は行いません。

`install` は Codex app-server の Plugin サポートを有効化し、任意で設定済みの
マーケットプレイスソースを追加し、Codex app-server 経由で設定済み Plugin をインストールまたは
再有効化し、MCP サーバーをリロードし、MCP サーバーがツールを公開していることを検証します。

## マーケットプレイスの選択肢

OpenClaw は Codex 自身が公開するものと同じ app-server API を使用します。
マーケットプレイスフィールドは、Codex が `computer-use` をどこで見つけるべきかを選択します。

| フィールド           | 使用する場合                                                    | インストールサポート                                 |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| マーケットプレイスフィールドなし | Codex app-server に、すでに把握しているマーケットプレイスを使用させたい。 | app-server がローカルマーケットプレイスを返す場合は可。 |
| `marketplaceSource`  | Codex app-server が追加できる Codex マーケットプレイスソースがある。 | 明示的な `/codex computer-use install` で可。 |
| `marketplacePath`    | ホスト上のローカルマーケットプレイスファイルパスをすでに知っている。 | 明示的なインストールとターン開始時の自動インストールで可。 |
| `marketplaceName`    | すでに登録されているマーケットプレイスを名前で 1 つ選択したい。 | 選択したマーケットプレイスにローカルパスがある場合のみ可。 |

新しい Codex ホームでは、公式マーケットプレイスをシードするまでに短い時間が必要な場合があります。
インストール中、OpenClaw は `marketplaceDiscoveryTimeoutMs` ミリ秒まで `plugin/list` をポーリングします。
デフォルトは 60 秒です。

既知の複数のマーケットプレイスに Computer Use が含まれている場合、OpenClaw は
`openai-bundled`、次に `openai-curated`、次に `local` を優先します。未知のあいまいな一致は
安全側に倒して失敗し、`marketplaceName` または `marketplacePath` の設定を求めます。

## バンドルされた macOS マーケットプレイス

最近の Codex デスクトップビルドは、Computer Use をここにバンドルしています。

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

`computerUse.autoInstall` が true で、`computer-use` を含むマーケットプレイスが登録されていない場合、
OpenClaw は標準のバンドル済みマーケットプレイスルートを自動的に追加しようとします。

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Codex を使ってシェルから明示的に登録することもできます。

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

標準以外の Codex アプリパスを使用している場合は、`computerUse.marketplacePath` を
ローカルマーケットプレイスファイルパスに設定するか、`/codex computer-use install --source
<marketplace-source>` を一度実行してください。

## リモートカタログの制限

Codex app-server はリモート専用カタログエントリの一覧表示と読み取りはできますが、現在は
リモートの `plugin/install` をサポートしていません。つまり、`marketplaceName` はステータス確認用に
リモート専用マーケットプレイスを選択できますが、インストールと再有効化には引き続き
`marketplaceSource` または `marketplacePath` によるローカルマーケットプレイスが必要です。

ステータスが、Plugin はリモート Codex マーケットプレイスで利用可能だがリモートインストールは
サポートされていないと示す場合は、ローカルソースまたはパスを指定して install を実行してください。

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 設定リファレンス

| フィールド                      | デフォルト     | 意味                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | 推論           | Computer Use を必須にします。別の Computer Use フィールドが設定されている場合、デフォルトは true です。 |
| `autoInstall`                   | false          | ターン開始時に、すでに検出済みのマーケットプレイスからインストールまたは再有効化します。 |
| `marketplaceDiscoveryTimeoutMs` | 60000          | インストールが Codex app-server のマーケットプレイス検出を待つ時間。 |
| `marketplaceSource`             | 未設定         | Codex app-server の `marketplace/add` に渡されるソース文字列。 |
| `marketplacePath`               | 未設定         | Plugin を含むローカル Codex マーケットプレイスファイルパス。 |
| `marketplaceName`               | 未設定         | 選択する登録済み Codex マーケットプレイス名。 |
| `pluginName`                    | `computer-use` | Codex マーケットプレイスの Plugin 名。 |
| `mcpServerName`                 | `computer-use` | インストール済み Plugin によって公開される MCP サーバー名。 |

ターン開始時の自動インストールは、設定済みの `marketplaceSource` 値を意図的に拒否します。
新しいソースの追加は明示的な設定操作であるため、`/codex computer-use install --source <marketplace-source>` を
一度使用し、その後は `autoInstall` に、検出済みのローカルマーケットプレイスからの将来の再有効化を任せてください。
`marketplacePath` はホスト上のローカルパスであることがすでに分かっているため、ターン開始時の
自動インストールで設定済みの `marketplacePath` を使用できます。

## OpenClaw が確認する内容

OpenClaw は内部的に安定した設定理由を報告し、ユーザー向けのステータスをチャット用に整形します。

| 理由                         | 意味                                                   | 次の手順                                      |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` が false に解決されました。      | `enabled` または別の Computer Use フィールドを設定します。 |
| `marketplace_missing`        | 一致するマーケットプレイスが利用できませんでした。     | ソース、パス、またはマーケットプレイス名を設定します。 |
| `plugin_not_installed`       | マーケットプレイスは存在しますが、Plugin がインストールされていません。 | install を実行するか、`autoInstall` を有効化します。 |
| `plugin_disabled`            | Plugin はインストールされていますが、Codex 設定で無効化されています。 | install を実行して再有効化します。 |
| `remote_install_unsupported` | 選択されたマーケットプレイスはリモート専用です。       | `marketplaceSource` または `marketplacePath` を使用します。 |
| `mcp_missing`                | Plugin は有効ですが、MCP サーバーが利用できません。    | Codex Computer Use と OS 権限を確認します。 |
| `ready`                      | Plugin と MCP ツールが利用可能です。                   | Codex モードのターンを開始します。 |
| `check_failed`               | ステータス確認中に Codex app-server リクエストが失敗しました。 | app-server の接続性とログを確認します。 |
| `auto_install_blocked`       | ターン開始時の設定に新しいソースの追加が必要です。     | まず明示的な install を実行します。 |

チャット出力には、Plugin の状態、MCP サーバーの状態、マーケットプレイス、利用可能な場合はツール、
失敗した設定ステップに関する具体的なメッセージが含まれます。

## macOS 権限

Computer Use は macOS 固有です。Codex が所有する MCP サーバーは、アプリを検査または制御する前に
ローカル OS 権限が必要になる場合があります。OpenClaw が Computer Use はインストール済みだが
MCP サーバーが利用できないと示す場合は、まず Codex 側の Computer Use 設定を確認してください:

- Codex app-server は、デスクトップ制御を行う同じホストで実行されている。
- Computer Use Plugin が Codex 設定で有効になっている。
- `computer-use` MCP サーバーが Codex app-server の MCP ステータスに表示されている。
- macOS がデスクトップ制御アプリに必要な権限を付与している。
- 現在のホストセッションが、制御対象のデスクトップにアクセスできる。

OpenClaw は、`computerUse.enabled` が true の場合に意図的にフェイルクローズします。Codex モードのターンは、設定で要求されたネイティブデスクトップツールなしに暗黙的に進行すべきではありません。

## トラブルシューティング

**ステータスに未インストールと表示される場合。** `/codex computer-use install` を実行します。マーケットプレイスが検出されない場合は、`--source` または `--marketplace-path` を渡します。

**ステータスにインストール済みだが無効と表示される場合。** `/codex computer-use install` をもう一度実行します。Codex app-server のインストールは Plugin 設定を有効状態に戻して書き込みます。

**ステータスにリモートインストールはサポートされていないと表示される場合。** ローカルのマーケットプレイスソースまたはパスを使用します。リモート専用のカタログエントリは確認できますが、現在の app-server API ではインストールできません。

**ステータスに MCP サーバーが利用できないと表示される場合。** MCP サーバーを再読み込みするため、インストールを一度再実行します。それでも利用できない場合は、Codex Computer Use アプリ、Codex app-server MCP ステータス、または macOS の権限を修正します。

**ステータスまたはプローブが `computer-use.list_apps` でタイムアウトする場合。** Plugin と MCP サーバーは存在していますが、ローカルの Computer Use ブリッジが応答しませんでした。Codex Computer Use を終了または再起動し、必要に応じて Codex Desktop を再起動してから、新しい OpenClaw セッションで再試行します。

**Computer Use ツールが `Native hook relay unavailable` と表示する場合。** Codex ネイティブのツールフックが、ローカルブリッジまたは Gateway フォールバック経由でアクティブな OpenClaw リレーに到達できませんでした。`/new` または `/reset` で新しい OpenClaw セッションを開始します。発生し続ける場合は、古い app-server スレッドとフック登録が破棄されるように Gateway を再起動してから、再試行します。

**ターン開始時の自動インストールがソースを拒否する場合。** これは意図した動作です。まず明示的に `/codex computer-use install --source <marketplace-source>` でソースを追加すると、以降のターン開始時の自動インストールは検出済みのローカルマーケットプレイスを使用できます。
