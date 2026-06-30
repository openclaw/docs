---
read_when:
    - Codex モードの OpenClaw エージェントに Codex Computer Use を使用させたい
    - Codex Computer Use、PeekabooBridge、直接の cua-driver MCP のどれを使うかを判断している
    - Codex Computer Use と直接の cua-driver MCP セットアップのどちらにするかを決めている
    - 同梱の Codex プラグイン用に computerUse を設定しています
    - /codex computer-use のステータスまたはインストールをトラブルシューティングしている
summary: CodexモードのOpenClawエージェント向けにCodex Computer Useを設定する
title: Codex コンピューター操作
x-i18n:
    generated_at: "2026-06-30T13:48:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use は、ローカルデスクトップ制御のための Codex ネイティブ MCP plugin です。OpenClaw
はデスクトップアプリを同梱せず、デスクトップアクションを自ら実行せず、
Codex の権限を迂回しません。同梱の `codex` plugin は Codex app-server を準備するだけです。
Codex plugin サポートを有効化し、構成済みの Codex
Computer Use plugin を見つけるかインストールし、`computer-use` MCP server が利用可能であることを確認してから、
Codex モードのターン中のネイティブ MCP ツール呼び出しは Codex に所有させます。

OpenClaw がすでにネイティブ Codex harness を使用している場合は、このページを使用してください。
ランタイム設定自体については、[Codex harness](/ja-JP/plugins/codex-harness) を参照してください。

## OpenClaw.app と Peekaboo

OpenClaw.app の Peekaboo 連携は Codex Computer Use とは別です。
macOS アプリは PeekabooBridge socket をホストできるため、`peekaboo` CLI は Peekaboo 独自の
自動化ツールのために、アプリのローカル Accessibility と Screen Recording の許可を再利用できます。
このブリッジは Codex Computer Use をインストールまたはプロキシせず、
Codex Computer Use も PeekabooBridge socket 経由で呼び出しません。

OpenClaw.app を Peekaboo CLI 自動化の権限認識ホストにしたい場合は
[Peekaboo bridge](/ja-JP/platforms/mac/peekaboo) を使用してください。Codex モードの
OpenClaw agent が、ターン開始前に Codex のネイティブ `computer-use` MCP plugin を利用可能にする必要がある場合は、このページを使用してください。

## iOS アプリ

iOS アプリは Codex Computer Use とは別です。Codex の `computer-use` MCP server を
インストールまたはプロキシせず、デスクトップ制御バックエンドでもありません。
代わりに、iOS アプリは OpenClaw node として接続し、`canvas.*`、`camera.*`、`screen.*`、
`location.*`、`talk.*` などの node コマンドを通じてモバイル機能を公開します。

agent に gateway 経由で iPhone node を操作させたい場合は [iOS](/ja-JP/platforms/ios) を使用してください。
Codex モードの agent が Codex のネイティブ Computer Use plugin を通じてローカル
macOS デスクトップを制御する必要がある場合は、このページを使用してください。

## 直接 cua-driver MCP

Codex Computer Use はデスクトップ制御を公開する唯一の方法ではありません。OpenClaw 管理の
ランタイムから TryCua の driver を直接呼び出したい場合は、Codex 固有の marketplace フローではなく、
OpenClaw の MCP registry 経由で upstream の `cua-driver mcp` server を使用してください。

`cua-driver` をインストールした後、OpenClaw コマンドを出力させるには次を実行します。

```bash
cua-driver mcp-config --client openclaw
```

または、stdio server を自分で登録します。

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

この経路では、driver schemas と構造化された MCP responses を含む upstream の MCP tool surface がそのまま維持されます。
CUA driver を通常の OpenClaw MCP server として利用可能にしたい場合に使用してください。
Codex app-server が plugin インストール、MCP reload、Codex モードのターン内での
ネイティブツール呼び出しを所有する必要がある場合は、このページの Codex Computer Use 設定を使用してください。

CUA の driver は macOS 固有であり、Accessibility や Screen Recording など、アプリが求める
ローカル macOS 権限が引き続き必要です。OpenClaw は `cua-driver` をインストールせず、
それらの権限を付与せず、upstream driver の安全モデルを迂回しません。

## クイック設定

Codex モードのターンで、スレッド開始前に Computer Use を利用可能にする必要がある場合は、
`plugins.entries.codex.config.computerUse` を設定します。`autoInstall: true` は
Computer Use を有効化し、ターン前に OpenClaw がそれをインストールまたは再有効化できるようにします。

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

この構成では、OpenClaw は各 Codex モードのターン前に Codex app-server を確認します。
Computer Use が存在しない一方で Codex app-server がインストール可能な marketplace をすでに検出している場合、
OpenClaw は Codex app-server に plugin のインストールまたは再有効化と MCP servers の reload を依頼します。
macOS では、一致する marketplace が登録されておらず、標準の Codex app bundle が存在する場合、
OpenClaw は失敗する前に
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` から
同梱 Codex marketplace の登録も試みます。それでも設定によって MCP server を利用可能にできない場合、
ターンはスレッド開始前に失敗します。

Computer Use config を変更した後、既存の Codex thread がすでに開始されている場合は、
テスト前に対象チャットで `/new` または `/reset` を使用してください。

macOS の管理 stdio startup では、OpenClaw は存在する場合、
`/Applications/Codex.app/Contents/Resources/codex` にある署名済みデスクトップ Codex app bundle を優先します。
これにより、Computer Use はローカルデスクトップ制御権限を所有する app bundle の下に保持されます。
デスクトップアプリがインストールされていない場合、OpenClaw は plugin の隣にインストールされた管理 Codex binary にフォールバックします。
インストール済みデスクトップアプリが未サポートの app-server version で初期化される場合、
OpenClaw は古いデスクトップアプリに plugin-local fallback を隠させるのではなく、その child を閉じて次の管理 binary candidate を再試行します。
明示的な `appServer.command` config または `OPENCLAW_CODEX_APP_SERVER_BIN` は、この管理選択を引き続き上書きします。

## コマンド

`codex` plugin command surface が利用可能な任意のチャットサーフェスから
`/codex computer-use` コマンドを使用します。これらは OpenClaw chat/runtime commands であり、
`openclaw codex ...` CLI subcommands ではありません。

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` は読み取り専用です。marketplace sources を追加したり、plugins をインストールしたり、
Codex plugin support を有効化したりしません。Computer Use を有効化する config がない場合、
一回限りの install command の後でも `status` は disabled と報告することがあります。

`install` は Codex app-server plugin support を有効化し、必要に応じて構成済みの
marketplace source を追加し、Codex app-server 経由で構成済み plugin をインストールまたは再有効化し、
MCP servers を reload し、MCP server が tools を公開していることを確認します。
インストールは信頼済みホストリソースを変更するため、`install` を実行できるのは owner または
`operator.admin` Gateway client だけです。他の認可済み送信者は、overrides を含め、
読み取り専用の `status` command を引き続き使用できます。

## Marketplace の選択肢

OpenClaw は Codex 自体が公開するものと同じ app-server API を使用します。
marketplace fields は Codex が `computer-use` をどこで見つけるべきかを選択します。

| フィールド             | 使用する場合                                                        | インストールサポート                                      |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| marketplace field なし | Codex app-server に既知の marketplaces を使用させたい場合。 | app-server が local marketplace を返す場合は可能。        |
| `marketplaceSource`  | Codex marketplace source を app-server に追加できる場合。         | 明示的な `/codex computer-use install` で可能。         |
| `marketplacePath`    | ホスト上の local marketplace file path がすでに分かっている場合。   | 明示的な install と turn-start auto-install で可能。   |
| `marketplaceName`    | 登録済み marketplace を名前で 1 つ選択したい場合。  | 選択した marketplace に local path がある場合のみ可能。 |

新しい Codex homes では、公式 marketplaces を seed するのに少し時間が必要な場合があります。
install 中、OpenClaw は最大 `marketplaceDiscoveryTimeoutMs` milliseconds まで
`plugin/list` を poll します。デフォルトは 60 seconds です。

複数の既知 marketplaces に Computer Use が含まれている場合、OpenClaw は
`openai-bundled`、次に `openai-curated`、次に `local` を優先します。不明で曖昧な一致は
フェイルクローズし、`marketplaceName` または `marketplacePath` の設定を求めます。

## 同梱 macOS marketplace

最近の Codex desktop builds は Computer Use をここに同梱しています。

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

`computerUse.autoInstall` が true で、`computer-use` を含む marketplace が登録されていない場合、
OpenClaw は標準の同梱 marketplace root を自動的に追加しようとします。

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Codex を使って shell から明示的に登録することもできます。

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

非標準の Codex app path を使用している場合は、`/codex computer-use install
--source <marketplace-root>` を一度実行するか、`computerUse.marketplacePath` を
local marketplace file path に設定してください。`--marketplace-path` は bundled marketplace root ではなく、
marketplace JSON file path がある場合にのみ使用してください。

## リモートカタログの制限

Codex app-server は remote-only catalog entries を一覧表示して読み取ることはできますが、
現在 remote `plugin/install` はサポートしていません。つまり、`marketplaceName` は
status checks 用に remote-only marketplace を選択できますが、install と re-enable には
`marketplaceSource` または `marketplacePath` 経由の local marketplace が引き続き必要です。

status が plugin は remote Codex marketplace で利用可能だが remote install は未サポートだと示す場合、
local source または path を指定して install を実行してください。

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 構成リファレンス

| フィールド                           | デフォルト        | 意味                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Computer Use を必須にします。別の Computer Use field が設定されている場合、デフォルトは true です。 |
| `autoInstall`                   | false          | ターン開始時に、すでに検出済みの marketplaces から install または re-enable します。       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | install が Codex app-server marketplace discovery を待つ時間。             |
| `marketplaceSource`             | unset          | Codex app-server `marketplace/add` に渡される source string。                    |
| `marketplacePath`               | unset          | plugin を含む local Codex marketplace file path。                       |
| `marketplaceName`               | unset          | 選択する registered Codex marketplace name。                                   |
| `pluginName`                    | `computer-use` | Codex marketplace plugin name。                                                 |
| `mcpServerName`                 | `computer-use` | インストール済み plugin によって公開される MCP server name。                               |

Turn-start auto-install は、構成済みの `marketplaceSource` values を意図的に拒否します。
新しい source の追加は明示的な setup operation であるため、
`/codex computer-use install --source <marketplace-source>` を一度使用し、その後は
`autoInstall` に検出済み local marketplaces からの今後の re-enable を処理させてください。
Turn-start auto-install は、構成済みの `marketplacePath` を使用できます。これはすでにホスト上の local path だからです。

## OpenClaw が確認する内容

OpenClaw は内部的に安定した setup reason を報告し、チャット向けの user-facing
status を整形します。

| 理由                         | 意味                                                   | 次の手順                                      |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` が false に解決されました。      | `enabled` または別の Computer Use フィールドを設定します。 |
| `marketplace_missing`        | 一致するマーケットプレイスが利用できませんでした。    | ソース、パス、またはマーケットプレイス名を設定します。 |
| `plugin_not_installed`       | マーケットプレイスは存在しますが、Plugin がインストールされていません。 | install を実行するか、`autoInstall` を有効にします。 |
| `plugin_disabled`            | Plugin はインストールされていますが、Codex 設定で無効になっています。 | install を実行して再度有効にします。         |
| `remote_install_unsupported` | 選択したマーケットプレイスはリモート専用です。        | `marketplaceSource` または `marketplacePath` を使用します。 |
| `mcp_missing`                | Plugin は有効ですが、MCP サーバーが利用できません。   | Codex Computer Use と OS 権限を確認します。  |
| `ready`                      | Plugin と MCP ツールが利用できます。                  | Codexモードのターンを開始します。            |
| `check_failed`               | ステータス確認中に Codex app-server リクエストが失敗しました。 | app-server の接続性とログを確認します。      |
| `auto_install_blocked`       | ターン開始時のセットアップで新しいソースの追加が必要になります。 | 先に明示的な install を実行します。          |

チャット出力には、Plugin の状態、MCP サーバーの状態、マーケットプレイス、利用可能な場合はツール、失敗したセットアップ手順に固有のメッセージが含まれます。

## macOS 権限

Computer Use は macOS 固有です。Codex が所有する MCP サーバーは、アプリを検査または制御する前にローカル OS 権限を必要とする場合があります。OpenClaw が Computer Use はインストール済みだが MCP サーバーを利用できないと示す場合は、まず Codex 側の Computer Use セットアップを確認してください。

- Codex app-server が、デスクトップ制御を行う同じホストで実行されている。
- Computer Use Plugin が Codex 設定で有効になっている。
- `computer-use` MCP サーバーが Codex app-server の MCP ステータスに表示されている。
- macOS がデスクトップ制御アプリに必要な権限を付与している。
- 現在のホストセッションが、制御対象のデスクトップにアクセスできる。

OpenClaw は、`computerUse.enabled` が true の場合、意図的にフェイルクローズします。Codexモードのターンは、設定で要求されたネイティブデスクトップツールなしに暗黙的に続行すべきではありません。

## トラブルシューティング

**ステータスが未インストールを示す。** `/codex computer-use install` を実行します。マーケットプレイスが検出されない場合は、`--source` または `--marketplace-path` を渡します。

**ステータスがインストール済みだが無効を示す。** `/codex computer-use install` をもう一度実行します。Codex app-server install は Plugin 設定を有効に戻して書き込みます。

**ステータスがリモートインストール非対応を示す。** ローカルのマーケットプレイスソースまたはパスを使用します。リモート専用カタログエントリは検査できますが、現在の app-server API ではインストールできません。

**ステータスが MCP サーバーを利用できないことを示す。** MCP サーバーを再読み込みするため、install を一度再実行します。それでも利用できない場合は、Codex Computer Use アプリ、Codex app-server MCP ステータス、または macOS 権限を修正します。

**ステータスまたはプローブが `computer-use.list_apps` でタイムアウトする。** Plugin と MCP サーバーは存在していますが、ローカルの Computer Use ブリッジが応答しませんでした。Codex Computer Use を終了または再起動し、必要に応じて Codex Desktop を再起動してから、新しい OpenClaw セッションで再試行します。ホストが以前、古い管理対象 Codex app-server 経由で Computer Use を実行していた場合は、デスクトップにバンドルされたマーケットプレイスからインストール済み Plugin を更新します。

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Computer Use ツールが `Native hook relay unavailable` と示す。** Codexネイティブのツールフックが、ローカルブリッジまたは Gateway フォールバック経由でアクティブな OpenClaw リレーに到達できませんでした。`/new` または `/reset` で新しい OpenClaw セッションを開始します。一度は動作して、その後のツール呼び出しで再び失敗する場合、`/new` は現在の試行だけをクリアしています。古いスレッドとフック登録が破棄されるように Codex app-server または OpenClaw Gateway を再起動し、その後で新しいセッションで再試行します。

**ターン開始時の自動インストールがソースを拒否する。** これは意図的です。まず明示的な `/codex computer-use install --source <marketplace-source>` でソースを追加します。その後、以降のターン開始時の自動インストールは、検出済みのローカルマーケットプレイスを使用できます。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Peekaboo ブリッジ](/ja-JP/platforms/mac/peekaboo)
- [iOS アプリ](/ja-JP/platforms/ios)
