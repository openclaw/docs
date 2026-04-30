---
read_when:
    - Codex モードの OpenClaw エージェントに Codex Computer Use を使用させたい場合
    - Codex Computer Use、PeekabooBridge、直接の cua-driver MCP のどれを使うかを決める場合
    - Codex Computer Use と直接の cua-driver MCP セットアップのどちらを選ぶかを決めています
    - 同梱の Codex Plugin 用に computerUse を設定しています
    - /codex computer-use status または install のトラブルシューティングをしています
summary: CodexモードのOpenClawエージェント向けにCodex Computer Useをセットアップする
title: Codex コンピューター操作
x-i18n:
    generated_at: "2026-04-30T05:24:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e3551b9005cdc8084d159c107f9b5039a4b4624847b8cc6e5bcb620510fd54f
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use は、ローカルデスクトップ制御用の Codex ネイティブ MCP Plugin です。OpenClaw
はデスクトップアプリを同梱せず、デスクトップ操作を自分で実行せず、
Codex の権限を迂回しません。同梱の `codex` Plugin は Codex app-server の準備のみを行います。
Codex Plugin サポートを有効にし、設定済みの Codex
Computer Use Plugin を検出またはインストールし、`computer-use` MCP サーバーが利用可能であることを確認してから、
Codex モードのターン中のネイティブ MCP ツール呼び出しを Codex に任せます。

OpenClaw がすでにネイティブ Codex ハーネスを使用している場合に、このページを使用してください。
ランタイム設定自体については、[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。

## OpenClaw.app と Peekaboo

OpenClaw.app の Peekaboo 連携は Codex Computer Use とは別です。
macOS アプリは PeekabooBridge ソケットをホストできるため、`peekaboo` CLI は
Peekaboo 独自の自動化ツール向けに、アプリのローカルのアクセシビリティ権限と画面収録権限を再利用できます。
このブリッジは Codex Computer Use をインストールまたはプロキシせず、
Codex Computer Use は PeekabooBridge ソケット経由で呼び出しません。

OpenClaw.app を Peekaboo CLI 自動化の権限認識ホストにしたい場合は、
[Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo)を使用してください。
Codex モードの OpenClaw エージェントで、ターン開始前に Codex のネイティブ `computer-use` MCP Plugin を利用可能にする場合は、このページを使用してください。

## iOS アプリ

iOS アプリは Codex Computer Use とは別です。Codex `computer-use` MCP サーバーをインストールまたはプロキシせず、デスクトップ制御バックエンドでもありません。
代わりに、iOS アプリは OpenClaw ノードとして接続し、`canvas.*`、`camera.*`、`screen.*`、
`location.*`、`talk.*` などのノードコマンドを通じてモバイル機能を公開します。

エージェントに Gateway 経由で iPhone ノードを操作させたい場合は
[iOS](/ja-JP/platforms/ios)を使用してください。Codex モードのエージェントが、Codex のネイティブ Computer Use Plugin を通じてローカルの macOS デスクトップを制御する必要がある場合は、このページを使用してください。

## 直接の cua-driver MCP

Codex Computer Use は、デスクトップ制御を公開する唯一の方法ではありません。
OpenClaw 管理のランタイムから TryCua のドライバーを直接呼び出したい場合は、
Codex 固有のマーケットプレイスフローではなく、OpenClaw の MCP レジストリ経由でアップストリームの
`cua-driver mcp` サーバーを使用してください。

`cua-driver` をインストールした後、OpenClaw コマンドを問い合わせます。

```bash
cua-driver mcp-config --client openclaw
```

または、stdio サーバーを自分で登録します。

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

この経路では、ドライバースキーマや構造化された MCP 応答を含め、アップストリームの MCP ツールサーフェスがそのまま保たれます。
CUA ドライバーを通常の OpenClaw MCP サーバーとして利用可能にしたい場合に使用してください。
Codex app-server に、Codex モードのターン内で Plugin のインストール、MCP の再読み込み、ネイティブツール呼び出しを所有させる必要がある場合は、このページの Codex Computer Use 設定を使用してください。

CUA のドライバーは macOS 固有であり、アクセシビリティや画面収録など、そのアプリが要求するローカル macOS 権限が引き続き必要です。
OpenClaw は `cua-driver` をインストールせず、それらの権限を付与せず、アップストリームドライバーの安全モデルを迂回しません。

## クイック設定

Codex モードのターンでスレッド開始前に Computer Use を利用可能にする必要がある場合は、`plugins.entries.codex.config.computerUse` を設定します。

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
        fallback: "none",
      },
    },
  },
}
```

この設定では、OpenClaw は各 Codex モードのターン前に Codex app-server を確認します。
Computer Use が存在しないものの、Codex app-server がインストール可能なマーケットプレイスをすでに検出している場合、OpenClaw は Codex app-server に Plugin のインストールまたは再有効化と MCP サーバーの再読み込みを依頼します。
macOS では、一致するマーケットプレイスが登録されておらず、標準の Codex アプリバンドルが存在する場合、OpenClaw は失敗する前に
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` から同梱の Codex マーケットプレイスの登録も試みます。
それでも設定で MCP サーバーを利用可能にできない場合、ターンはスレッド開始前に失敗します。

既存のセッションは、そのランタイムと Codex スレッドバインディングを保持します。
`agentRuntime` または Computer Use 設定を変更した後は、テスト前に影響を受けるチャットで `/new` または `/reset` を使用してください。

## コマンド

`codex` Plugin のコマンドサーフェスが利用可能な任意のチャットサーフェスから、`/codex computer-use` コマンドを使用します。
これらは OpenClaw のチャット/ランタイムコマンドであり、`openclaw codex ...` CLI サブコマンドではありません。

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` は読み取り専用です。マーケットプレイスソースの追加、Plugin のインストール、Codex Plugin サポートの有効化は行いません。

`install` は Codex app-server の Plugin サポートを有効にし、必要に応じて設定済みのマーケットプレイスソースを追加し、Codex app-server 経由で設定済み Plugin をインストールまたは再有効化し、MCP サーバーを再読み込みし、MCP サーバーがツールを公開していることを検証します。

## マーケットプレイスの選択肢

OpenClaw は Codex 自体が公開するものと同じ app-server API を使用します。
マーケットプレイスフィールドは、Codex が `computer-use` をどこで見つけるかを選択します。

| フィールド           | 使用する場合                                                    | インストールサポート                                   |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| マーケットプレイスフィールドなし | Codex app-server に、すでに認識しているマーケットプレイスを使用させたい。 | はい。app-server がローカルマーケットプレイスを返す場合。 |
| `marketplaceSource`  | Codex app-server が追加できる Codex マーケットプレイスソースがある。 | はい。明示的な `/codex computer-use install` の場合。 |
| `marketplacePath`    | ホスト上のローカルマーケットプレイスファイルパスをすでに把握している。 | はい。明示的なインストールとターン開始時の自動インストールの場合。 |
| `marketplaceName`    | 登録済みマーケットプレイスの 1 つを名前で選択したい。 | はい。ただし、選択したマーケットプレイスにローカルパスがある場合のみ。 |

新しい Codex ホームでは、公式マーケットプレイスをシードするまで短い時間が必要な場合があります。
インストール中、OpenClaw は最大 `marketplaceDiscoveryTimeoutMs` ミリ秒まで `plugin/list` をポーリングします。
デフォルトは 60 秒です。

複数の既知のマーケットプレイスに Computer Use が含まれている場合、OpenClaw は
`openai-bundled`、次に `openai-curated`、次に `local` を優先します。
不明で曖昧な一致は安全側で失敗し、`marketplaceName` または `marketplacePath` の設定を求めます。

## 同梱の macOS マーケットプレイス

最近の Codex デスクトップビルドは、ここに Computer Use を同梱しています。

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

標準以外の Codex アプリパスを使用している場合は、`computerUse.marketplacePath` をローカルマーケットプレイスファイルパスに設定するか、`/codex computer-use install --source
<marketplace-source>` を一度実行してください。

## リモートカタログの制限

Codex app-server はリモート専用カタログエントリの一覧表示と読み取りができますが、現時点ではリモートの `plugin/install` をサポートしていません。
つまり、`marketplaceName` はステータス確認用にリモート専用マーケットプレイスを選択できますが、インストールと再有効化には引き続き `marketplaceSource` または `marketplacePath` 経由のローカルマーケットプレイスが必要です。

ステータスで、Plugin がリモート Codex マーケットプレイスで利用可能だがリモートインストールはサポートされていないと表示される場合は、ローカルソースまたはパスを指定して install を実行してください。

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 設定リファレンス

| フィールド                    | デフォルト     | 意味                                                                            |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | 推論           | Computer Use を必須にします。別の Computer Use フィールドが設定されている場合、デフォルトで true になります。 |
| `autoInstall`                   | false          | ターン開始時に、すでに検出済みのマーケットプレイスからインストールまたは再有効化します。 |
| `marketplaceDiscoveryTimeoutMs` | 60000          | インストールが Codex app-server のマーケットプレイス検出を待つ時間。             |
| `marketplaceSource`             | 未設定         | Codex app-server `marketplace/add` に渡されるソース文字列。                    |
| `marketplacePath`               | 未設定         | Plugin を含むローカル Codex マーケットプレイスファイルパス。                   |
| `marketplaceName`               | 未設定         | 選択する登録済み Codex マーケットプレイス名。                                  |
| `pluginName`                    | `computer-use` | Codex マーケットプレイスの Plugin 名。                                         |
| `mcpServerName`                 | `computer-use` | インストール済み Plugin が公開する MCP サーバー名。                            |

ターン開始時の自動インストールは、設定済みの `marketplaceSource` 値を意図的に拒否します。
新しいソースの追加は明示的な設定操作であるため、`/codex computer-use install --source <marketplace-source>` を一度使用し、その後は `autoInstall` に検出済みローカルマーケットプレイスからの将来の再有効化を任せてください。
ターン開始時の自動インストールは設定済みの `marketplacePath` を使用できます。これはすでにホスト上のローカルパスだからです。

## OpenClaw が確認する内容

OpenClaw は内部的に安定した設定理由を報告し、ユーザー向けのステータスをチャット用に整形します。

| 理由                         | 意味                                                   | 次の手順                                      |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` が false に解決されました。      | `enabled` または別の Computer Use フィールドを設定します。 |
| `marketplace_missing`        | 一致するマーケットプレイスが利用できませんでした。     | ソース、パス、またはマーケットプレイス名を設定します。 |
| `plugin_not_installed`       | マーケットプレイスは存在しますが、Plugin がインストールされていません。 | install を実行するか、`autoInstall` を有効にします。 |
| `plugin_disabled`            | Plugin はインストールされていますが、Codex 設定で無効です。 | install を実行して再有効化します。           |
| `remote_install_unsupported` | 選択したマーケットプレイスはリモート専用です。         | `marketplaceSource` または `marketplacePath` を使用します。 |
| `mcp_missing`                | Plugin は有効ですが、MCP サーバーを利用できません。    | Codex Computer Use と OS 権限を確認します。  |
| `ready`                      | Plugin と MCP ツールが利用可能です。                   | Codex モードのターンを開始します。           |
| `check_failed`               | ステータス確認中に Codex app-server リクエストが失敗しました。 | app-server の接続性とログを確認します。      |
| `auto_install_blocked`       | ターン開始時の設定で新しいソースを追加する必要があります。 | 先に明示的なインストールを実行します。       |

チャット出力には、Plugin の状態、MCP サーバーの状態、マーケットプレイス、利用可能な場合はツール、失敗した設定ステップの具体的なメッセージが含まれます。

## macOS 権限

Computer Use は macOS 固有です。Codex が所有する MCP サーバーは、アプリを検査または制御する前にローカル OS 権限を必要とする場合があります。
OpenClaw が Computer Use はインストール済みだが MCP サーバーを利用できないと表示する場合は、まず Codex 側の Computer Use 設定を確認してください。

- Codex app-server は、デスクトップ制御を行う対象と同じホスト上で実行されている。
- Computer Use plugin は Codex config で有効化されている。
- `computer-use` MCP サーバーが Codex app-server の MCP status に表示されている。
- macOS は、デスクトップ制御アプリに必要な権限を付与している。
- 現在のホストセッションは、制御対象のデスクトップにアクセスできる。

OpenClaw は `computerUse.enabled` が true の場合、意図的に閉じた状態で失敗します。
Codex モードのターンは、config で必須とされたネイティブデスクトップツールなしで
黙って続行すべきではありません。

## トラブルシューティング

**Status says not installed.** `/codex computer-use install` を実行してください。
marketplace が検出されない場合は、`--source` または `--marketplace-path` を渡してください。

**Status says installed but disabled.** `/codex computer-use install` を再度実行してください。
Codex app-server のインストールにより、plugin config が有効な状態に書き戻されます。

**Status says remote install is unsupported.** ローカルの marketplace source または
path を使用してください。リモート専用の catalog entries は調査できますが、現在の
app-server API 経由ではインストールできません。

**Status says the MCP server is unavailable.** MCP servers が再読み込みされるように、
インストールを一度再実行してください。それでも利用できない場合は、Codex Computer Use アプリ、
Codex app-server MCP status、または macOS permissions を修正してください。

**Status or a probe times out on `computer-use.list_apps`.** plugin と MCP
server は存在しますが、ローカルの Computer Use bridge が応答しませんでした。
Codex Computer Use を終了または再起動し、必要であれば Codex Desktop を再起動してから、
新しい OpenClaw セッションで再試行してください。

**A Computer Use tool says `Native hook relay unavailable`.** Codex ネイティブの
tool hook は、ローカル bridge または Gateway fallback 経由でアクティブな OpenClaw relay に到達できませんでした。
`/new` または `/reset` で新しい OpenClaw セッションを開始してください。
問題が続く場合は、古い app-server threads と hook registrations が破棄されるように
gateway を再起動してから再試行してください。

**Turn-start auto-install refuses a source.** これは意図的です。まず明示的に
`/codex computer-use install --source <marketplace-source>` で source を追加してください。
その後、以降の turn-start auto-install は検出済みのローカル marketplace を使用できます。
