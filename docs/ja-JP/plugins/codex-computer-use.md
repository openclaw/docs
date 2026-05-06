---
read_when:
    - CodexモードのOpenClawエージェントにCodex Computer Useを使用させたい
    - Codex Computer Use、PeekabooBridge、cua-driver MCP の直接利用のどれにするかを決めています
    - Codex Computer Use と直接の cua-driver MCP セットアップのどちらにするかを決めています
    - バンドルされた Codex Plugin 用に computerUse を設定しています
    - /codex computer-use status または install のトラブルシューティングを行っています
summary: CodexモードのOpenClawエージェント向けにCodex Computer Useをセットアップする
title: Codex コンピューター操作
x-i18n:
    generated_at: "2026-05-06T05:13:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d23cd0646336e61c77357f769bc1d7ab47a401bcc484f4d16130b942db9f1f4
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use は、ローカルデスクトップ制御のための Codex ネイティブ MCP Plugin です。OpenClaw
はデスクトップアプリをベンダー提供せず、デスクトップ操作自体を実行せず、
Codex の権限をバイパスしません。バンドルされた `codex` Plugin は Codex app-server の準備だけを行います。
つまり、Codex Plugin サポートを有効化し、設定済みの Codex
Computer Use Plugin を見つけるかインストールし、`computer-use` MCP サーバーが利用可能か確認してから、
Codex モードのターン中のネイティブ MCP ツール呼び出しを Codex に所有させます。

OpenClaw がすでにネイティブ Codex ハーネスを使っている場合は、このページを使用してください。
ランタイム設定自体については、[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。

## OpenClaw.app と Peekaboo

OpenClaw.app の Peekaboo 統合は、Codex Computer Use とは別のものです。
macOS アプリは PeekabooBridge ソケットをホストできるため、`peekaboo` CLI は
Peekaboo 独自の自動化ツールのために、アプリのローカル Accessibility と Screen Recording の許可を再利用できます。
このブリッジは Codex Computer Use をインストールしたりプロキシしたりせず、
Codex Computer Use は PeekabooBridge ソケット経由で呼び出しません。

OpenClaw.app を Peekaboo CLI 自動化のための権限対応ホストにしたい場合は、
[Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo)を使用してください。
Codex モードの OpenClaw エージェントが、ターン開始前に Codex のネイティブ `computer-use` MCP Plugin を利用可能にしておく必要がある場合は、このページを使用してください。

## iOS アプリ

iOS アプリは Codex Computer Use とは別のものです。Codex `computer-use` MCP サーバーをインストールしたりプロキシしたりせず、デスクトップ制御バックエンドでもありません。
代わりに、iOS アプリは OpenClaw ノードとして接続し、`canvas.*`、`camera.*`、`screen.*`、
`location.*`、`talk.*` などのノードコマンドを通じてモバイル機能を公開します。

エージェントに Gateway 経由で iPhone ノードを操作させたい場合は [iOS](/ja-JP/platforms/ios) を使用してください。
Codex モードのエージェントが Codex のネイティブ Computer Use Plugin を通じてローカル macOS デスクトップを制御する必要がある場合は、このページを使用してください。

## 直接 cua-driver MCP

Codex Computer Use だけがデスクトップ制御を公開する方法ではありません。
OpenClaw 管理のランタイムから TryCua のドライバーを直接呼び出したい場合は、
Codex 固有のマーケットプレイスフローではなく、OpenClaw の MCP レジストリを通じて上流の
`cua-driver mcp` サーバーを使用してください。

`cua-driver` をインストールした後、OpenClaw コマンドを問い合わせます。

```bash
cua-driver mcp-config --client openclaw
```

または、stdio サーバーを自分で登録します。

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

この経路では、ドライバースキーマや構造化 MCP レスポンスを含め、上流の MCP ツールサーフェスをそのまま保てます。
CUA ドライバーを通常の OpenClaw MCP サーバーとして利用可能にしたい場合に使用してください。
Codex app-server に Plugin のインストール、MCP の再読み込み、Codex モードのターン内でのネイティブツール呼び出しを所有させたい場合は、このページの Codex Computer Use 設定を使用してください。

CUA のドライバーは macOS 固有であり、Accessibility や Screen Recording など、そのアプリが求めるローカル macOS 権限が引き続き必要です。
OpenClaw は `cua-driver` をインストールせず、それらの権限を付与せず、上流ドライバーの安全モデルをバイパスしません。

## クイックセットアップ

Codex モードのターンで、スレッド開始前に Computer Use を利用可能にしておく必要がある場合は、`plugins.entries.codex.config.computerUse` を設定します。

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
Computer Use が見つからないものの、Codex app-server がインストール可能なマーケットプレイスをすでに検出している場合、OpenClaw は Codex app-server に Plugin のインストールまたは再有効化と MCP サーバーの再読み込みを依頼します。
macOS では、一致するマーケットプレイスが登録されておらず、標準の Codex アプリバンドルが存在する場合、OpenClaw は失敗する前に
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` からバンドルされた Codex マーケットプレイスの登録も試みます。
それでも設定によって MCP サーバーを利用可能にできない場合、ターンはスレッド開始前に失敗します。

既存のセッションは、ランタイムと Codex スレッドのバインディングを維持します。
`agentRuntime` または Computer Use 設定を変更した後は、テスト前に対象のチャットで `/new` または `/reset` を使用してください。

## コマンド

`codex` Plugin コマンドサーフェスが利用可能な任意のチャットサーフェスから、`/codex computer-use` コマンドを使用します。
これらは OpenClaw のチャット/ランタイムコマンドであり、`openclaw codex ...` CLI サブコマンドではありません。

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` は読み取り専用です。マーケットプレイスソースの追加、Plugin のインストール、Codex Plugin サポートの有効化は行いません。

`install` は Codex app-server の Plugin サポートを有効化し、必要に応じて設定済みのマーケットプレイスソースを追加し、Codex app-server 経由で設定済み Plugin をインストールまたは再有効化し、MCP サーバーを再読み込みし、MCP サーバーがツールを公開していることを確認します。

## マーケットプレイスの選択肢

OpenClaw は Codex 自体が公開するものと同じ app-server API を使用します。
マーケットプレイスフィールドでは、Codex が `computer-use` をどこで見つけるべきかを選びます。

| フィールド                | 使用する場合                                                        | インストールサポート                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| マーケットプレイスフィールドなし | Codex app-server に、すでに認識しているマーケットプレイスを使わせたい場合。 | app-server がローカルマーケットプレイスを返す場合は、はい。        |
| `marketplaceSource`  | Codex app-server が追加できる Codex マーケットプレイスソースがある場合。         | 明示的な `/codex computer-use install` では、はい。         |
| `marketplacePath`    | ホスト上のローカルマーケットプレイスファイルパスをすでに知っている場合。   | 明示的なインストールとターン開始時の自動インストールでは、はい。   |
| `marketplaceName`    | すでに登録済みのマーケットプレイスを名前で 1 つ選択したい場合。  | 選択したマーケットプレイスにローカルパスがある場合のみ、はい。 |

新しい Codex ホームでは、公式マーケットプレイスのシードに少し時間が必要な場合があります。
インストール中、OpenClaw は最大 `marketplaceDiscoveryTimeoutMs` ミリ秒まで `plugin/list` をポーリングします。
デフォルトは 60 秒です。

複数の既知のマーケットプレイスに Computer Use が含まれている場合、OpenClaw は
`openai-bundled`、次に `openai-curated`、次に `local` を優先します。
不明で曖昧な一致はフェイルクローズし、`marketplaceName` または `marketplacePath` の設定を求めます。

## バンドルされた macOS マーケットプレイス

最近の Codex デスクトップビルドは、Computer Use をここにバンドルしています。

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

標準以外の Codex アプリパスを使用している場合は、`computerUse.marketplacePath` をローカルマーケットプレイスファイルパスに設定するか、`/codex computer-use install --source
<marketplace-source>` を一度実行してください。

## リモートカタログの制限

Codex app-server はリモート専用カタログエントリの一覧表示と読み取りができますが、現在はリモートの `plugin/install` をサポートしていません。
つまり、`marketplaceName` はステータス確認用にリモート専用マーケットプレイスを選択できますが、インストールと再有効化には引き続き `marketplaceSource` または `marketplacePath` によるローカルマーケットプレイスが必要です。

ステータスで、Plugin がリモート Codex マーケットプレイスで利用可能だがリモートインストールがサポートされていないと表示される場合は、ローカルソースまたはパスを指定して install を実行します。

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 設定リファレンス

| フィールド                           | デフォルト        | 意味                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | 推論       | Computer Use を必須にします。別の Computer Use フィールドが設定されている場合、デフォルトは true です。 |
| `autoInstall`                   | false          | ターン開始時に、すでに検出済みのマーケットプレイスからインストールまたは再有効化します。       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | インストールが Codex app-server のマーケットプレイス検出を待つ時間。             |
| `marketplaceSource`             | 未設定          | Codex app-server `marketplace/add` に渡されるソース文字列。                    |
| `marketplacePath`               | 未設定          | Plugin を含むローカル Codex マーケットプレイスファイルパス。                       |
| `marketplaceName`               | 未設定          | 選択する登録済み Codex マーケットプレイス名。                                   |
| `pluginName`                    | `computer-use` | Codex マーケットプレイス Plugin 名。                                                 |
| `mcpServerName`                 | `computer-use` | インストール済み Plugin によって公開される MCP サーバー名。                               |

ターン開始時の自動インストールは、設定済みの `marketplaceSource` 値を意図的に拒否します。
新しいソースの追加は明示的なセットアップ操作であるため、`/codex computer-use install --source <marketplace-source>` を一度使用し、その後は `autoInstall` に、検出済みローカルマーケットプレイスからの今後の再有効化を処理させてください。
ターン開始時の自動インストールでは、設定済みの `marketplacePath` を使用できます。これはホスト上のローカルパスがすでに指定されているためです。

## OpenClaw が確認すること

OpenClaw は内部的に安定したセットアップ理由を報告し、チャット向けにユーザー表示用ステータスを整形します。

| 理由                       | 意味                                                | 次の手順                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` が false に解決されました。               | `enabled` または別の Computer Use フィールドを設定します。  |
| `marketplace_missing`        | 一致するマーケットプレイスが利用できませんでした。                 | ソース、パス、またはマーケットプレイス名を設定します。  |
| `plugin_not_installed`       | マーケットプレイスは存在しますが、Plugin がインストールされていません。   | install を実行するか、`autoInstall` を有効化します。          |
| `plugin_disabled`            | Plugin はインストールされていますが、Codex 設定で無効化されています。      | install を実行して再有効化します。                  |
| `remote_install_unsupported` | 選択したマーケットプレイスがリモート専用です。                   | `marketplaceSource` または `marketplacePath` を使用します。 |
| `mcp_missing`                | Plugin は有効ですが、MCP サーバーが利用できません。  | Codex Computer Use と OS 権限を確認します。  |
| `ready`                      | Plugin と MCP ツールが利用可能です。                    | Codex モードのターンを開始します。                    |
| `check_failed`               | ステータス確認中に Codex app-server リクエストが失敗しました。 | app-server の接続性とログを確認します。       |
| `auto_install_blocked`       | ターン開始時のセットアップには新しいソースの追加が必要です。       | 先に明示的な install を実行します。                   |

チャット出力には、Plugin 状態、MCP サーバー状態、マーケットプレイス、利用可能な場合のツール、失敗しているセットアップ手順に固有のメッセージが含まれます。

## macOS 権限

Computer Use は macOS 固有です。Codex が所有する MCP サーバーは、アプリを検査または制御する前にローカル OS 権限が必要になる場合があります。
OpenClaw が Computer Use はインストール済みだが MCP サーバーは利用できないと表示する場合は、まず Codex 側の Computer Use 設定を確認してください。

- Codex app-server は、デスクトップ制御を行う同じホストで実行されている。
- Computer Use Plugin は Codex 設定で有効化されている。
- `computer-use` MCP サーバーが Codex app-server の MCP ステータスに表示されている。
- macOS がデスクトップ制御アプリに必要な権限を付与している。
- 現在のホストセッションが、制御対象のデスクトップにアクセスできる。

OpenClaw は `computerUse.enabled` が true の場合、意図的にフェイルクローズする。Codex モードのターンは、設定で要求されたネイティブのデスクトップツールなしに暗黙的に続行すべきではない。

## トラブルシューティング

**ステータスに未インストールと表示される。** `/codex computer-use install` を実行する。マーケットプレイスが検出されない場合は、`--source` または `--marketplace-path` を渡す。

**ステータスにインストール済みだが無効と表示される。** `/codex computer-use install` を再度実行する。Codex app-server のインストールは、Plugin 設定を有効状態に戻して書き込む。

**ステータスにリモートインストールはサポートされていないと表示される。** ローカルのマーケットプレイスソースまたはパスを使用する。リモートのみのカタログエントリは検査できるが、現在の app-server API 経由ではインストールできない。

**ステータスに MCP サーバーが利用不可と表示される。** MCP サーバーを再読み込みするため、インストールを一度再実行する。それでも利用不可のままの場合は、Codex Computer Use アプリ、Codex app-server の MCP ステータス、または macOS 権限を修正する。

**ステータスまたはプローブが `computer-use.list_apps` でタイムアウトする。** Plugin と MCP サーバーは存在するが、ローカルの Computer Use ブリッジが応答しなかった。Codex Computer Use を終了または再起動し、必要に応じて Codex Desktop を再起動してから、新しい OpenClaw セッションで再試行する。

**Computer Use ツールに `Native hook relay unavailable` と表示される。** Codex ネイティブのツールフックが、ローカルブリッジまたは Gateway フォールバック経由でアクティブな OpenClaw リレーに到達できなかった。`/new` または `/reset` で新しい OpenClaw セッションを開始する。発生し続ける場合は、Gateway を再起動して古い app-server スレッドとフック登録を破棄してから、再試行する。

**ターン開始時の自動インストールがソースを拒否する。** これは意図された動作。まず明示的に `/codex computer-use install --source <marketplace-source>` でソースを追加すると、以後のターン開始時の自動インストールで、検出されたローカルマーケットプレイスを使用できる。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo)
- [iOS アプリ](/ja-JP/platforms/ios)
