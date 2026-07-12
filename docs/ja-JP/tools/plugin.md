---
doc-schema-version: 1
read_when:
    - Plugin のインストールまたは設定
    - Plugin の検出と読み込みルールを理解する
    - Codex/Claude 互換 Plugin バンドルの操作
sidebarTitle: Getting Started
summary: OpenClaw Pluginのインストール、設定、管理
title: Plugin
x-i18n:
    generated_at: "2026-07-11T22:47:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

Plugin は、チャンネル、モデルプロバイダー、エージェントハーネス、ツール、
Skills、音声、リアルタイム文字起こし、音声機能、メディア理解、生成、
Web 取得、Web 検索、その他のランタイム機能を OpenClaw に追加します。

このページでは、Plugin のインストール、Gateway の再起動、ランタイムによる
読み込みの確認、および一般的なセットアップ失敗への対処方法を説明します。コマンドのみの例については、
[Plugin を管理する](/ja-JP/plugins/manage-plugins)を参照してください。バンドル版、公式外部版、
ソース専用 Plugin の生成済み一覧については、
[Plugin 一覧](/ja-JP/plugins/plugin-inventory)を参照してください。

## 要件

- `openclaw` CLI を利用できる OpenClaw のチェックアウトまたはインストール
- 選択したソース（ClawHub、npm、または git ホスト）へのネットワークアクセス
- その Plugin のセットアップドキュメントに記載されている、Plugin 固有の認証情報、
  設定キー、または OS ツール
- チャンネルを提供する Gateway を再読み込みまたは再起動する権限

## クイックスタート

<Steps>
  <Step title="Plugin を探す">
    公開 Plugin パッケージを [ClawHub](/clawhub) で検索します。

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub は、コミュニティ Plugin を探すための主要な場所です。リリース移行期間中は、
    通常のプレフィックスなしパッケージ指定は、公式 Plugin ID と一致しない限り、
    引き続き npm からインストールされます。バンドル Plugin と一致する未加工の
    `@openclaw/*` 指定は、そのバンドル版に解決されます。特定のソースを明示的に
    使用する必要がある場合は、ソースプレフィックスを指定してください。

  </Step>

  <Step title="Plugin をインストールする">
    ```bash
    # ClawHub から。
    openclaw plugins install clawhub:<package>

    # npm から。
    openclaw plugins install npm:<package>

    # git から。
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # ローカルの開発用チェックアウトから。
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Plugin のインストールは、コードの実行と同様に扱ってください。再現可能な本番環境への
    インストールには、固定されたバージョンを推奨します。

  </Step>

  <Step title="設定して有効にする">
    Plugin 固有の設定を `plugins.entries.<id>.config` 配下に構成します。
    まだ有効になっていない場合は、Plugin を有効にします。

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    `plugins.allow` が設定されている場合、Plugin を読み込むには、インストールされた
    Plugin ID がそのリストに含まれている必要があります。`openclaw plugins install` は、
    既存の `plugins.allow` リストにインストールした ID を追加し、
    同じ ID を `plugins.deny` から削除するため、明示的にインストールした Plugin は
    再起動後に読み込めます。

  </Step>

  <Step title="Gateway を再読み込みさせる">
    Plugin コードのインストール、更新、またはアンインストールには、Gateway の
    再起動が必要です。設定の再読み込みが有効な管理対象 Gateway は、
    Plugin のインストール記録の変更を検出して自動的に再起動します。それ以外の場合は、
    自分で再起動してください。

    ```bash
    openclaw gateway restart
    ```

    有効化または無効化を行うと、設定とコールドレジストリが更新されます。実行中のランタイムで
    利用可能な機能を確認するには、引き続きランタイム検査が最も明確な証拠になります。

  </Step>

  <Step title="ランタイム登録を確認する">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    登録済みのツール、フック、サービス、Gateway メソッド、または Plugin 所有の
    CLI コマンドを確認するには、`--runtime` を使用します。通常の `inspect` は、
    コールド状態のマニフェストとレジストリのみを確認します。

  </Step>
</Steps>

## 設定

### インストール元を選択する

| ソース      | 使用する場合                                                                       | 例                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | OpenClaw ネイティブの検索、スキャン、バージョンメタデータ、インストールヒントが必要な場合 | `openclaw plugins install clawhub:<package>`                   |
| npm         | npm レジストリまたは dist-tag のワークフローを直接使用する必要がある場合                             | `openclaw plugins install npm:<package>`                       |
| git         | リポジトリのブランチ、タグ、またはコミットが必要な場合                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ローカルパス  | 同じマシン上で Plugin を開発またはテストしている場合                     | `openclaw plugins install --link ./my-plugin`                  |
| マーケットプレイス | Claude 互換のマーケットプレイス Plugin をインストールする場合                      | `openclaw plugins install <plugin> --marketplace <source>`     |

プレフィックスなしパッケージ指定には、特別な互換動作があります。バンドル Plugin ID と
一致するプレフィックスなしの名前は、そのバンドルソースを使用します。公式外部 Plugin ID と
一致するプレフィックスなしの名前は、公式パッケージカタログを使用します。それ以外の
プレフィックスなし指定は、リリース移行期間中は npm 経由でインストールされます。バンドル Plugin と
一致する未加工の `@openclaw/*` 指定も、npm へのフォールバック前にバンドル版へ
解決されます。バンドル版ではなく外部 npm パッケージを意図的にインストールするには、
`npm:@openclaw/<plugin>@<version>` を使用します。ソースを確実に選択するには、`clawhub:`、
`npm:`、`git:`、または `npm-pack:` を使用します。完全なコマンド仕様については、
[`openclaw plugins`](/ja-JP/cli/plugins#install)を参照してください。

npm インストールでは、バージョンを固定しない指定と `@latest` は、この OpenClaw ビルドとの
互換性を示す最新の安定版パッケージを選択します。npm の現在の最新リリースが、
このビルドで対応しているものより新しい `openclaw.compat.pluginApi` または
`openclaw.install.minHostVersion` を宣言している場合、OpenClaw は以前の安定版を
調べ、適合する最新バージョンをインストールします。完全に指定されたバージョンと、
`@beta` のような明示的なチャンネルタグは、選択したパッケージに固定されたままとなり、
互換性がない場合は失敗します。

### オペレーターのインストールポリシー

Plugin のインストールまたは更新を続行する前に、信頼済みのローカルポリシーコマンドを
実行するよう `security.installPolicy` を構成します。ポリシーはメタデータと
ステージング済みソースパスを受け取り、インストールを許可またはブロックできます。
CLI と Gateway 経由の両方のインストールおよび更新経路に適用されます。Plugin の
`before_install` フックは後で実行され、Plugin フックが読み込まれている OpenClaw
プロセス内でのみ動作するため、オペレーターが管理するインストール判断には、代わりに
`security.installPolicy` を使用してください。非推奨の
`--dangerously-force-unsafe-install` フラグは互換性のために受け付けられますが、
何も行いません。インストールポリシーや OpenClaw 組み込みの Plugin 依存関係拒否リストを
回避するものではありません。

Skills と Plugin の両方で使用される共通の `security.installPolicy` 実行スキーマについては、
[Skills の設定](/ja-JP/tools/skills-config#operator-install-policy-securityinstallpolicy)
を参照してください。

### Plugin ポリシーを設定する

一般的な Plugin 設定の形式は次のとおりです。

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

主なポリシールール：

- `plugins.enabled: false` は、すべての Plugin を無効にし、検出および読み込み処理を
  スキップします。この設定が有効な間、古い Plugin 参照は動作しません。古い ID を
  削除したい場合は、doctor によるクリーンアップを実行する前に Plugin を再び有効にしてください。
- `plugins.deny` は、許可設定と Plugin ごとの有効化設定より優先されます。
- `plugins.allow` は排他的な許可リストです。許可リストに含まれない Plugin 所有の
  ツールは、`tools.allow` に `"*"` が含まれていても利用できません。
- `plugins.entries.<id>.enabled: false` は、設定を保持したまま 1 つの Plugin を
  無効にします。
- `plugins.load.paths` は、明示的なローカル Plugin ファイルまたはディレクトリを追加します。
  管理対象の `plugins install` で使用するローカルパスは、Plugin ディレクトリまたは
  アーカイブである必要があります。単独の Plugin ファイルには `plugins.load.paths` を使用します。
- ワークスペース由来の Plugin はデフォルトで無効です。ローカルのワークスペースコードを
  使用する前に、明示的に有効化するか許可リストに追加してください。
- バンドル Plugin は、設定で明示的に上書きされない限り、組み込みのデフォルト有効または
  デフォルト無効のメタデータに従います。
- `plugins.slots.<slot>`（`memory` または `contextEngine`）は、排他的なカテゴリに
  使用する Plugin を 1 つ選択します。スロットの選択は明示的な有効化とみなされ、
  通常はオプトインであっても、そのスロット用として選択された Plugin を強制的に
  有効にします。ただし、`plugins.deny` と `plugins.entries.<id>.enabled: false` は
  引き続きその Plugin をブロックします。
- バンドルされたオプトイン Plugin は、プロバイダーやモデルの参照、チャンネル設定、
  CLI バックエンド、エージェントハーネスのランタイムなど、その Plugin が所有する
  機能のいずれかを設定で指定すると、自動的に有効化されることがあります。
- OpenAI 系の Codex ルーティングでは、プロバイダーとランタイム Plugin の境界が
  分離されています。従来の Codex モデル参照は doctor が修復するレガシー設定であり、
  バンドル版 `codex` Plugin は、正規の `openai/*` エージェント参照、
  明示的な `agentRuntime.id: "codex"`、および従来の `codex/*` 参照に対する
  Codex app-server ランタイムを所有します。

`plugins.allow` が未設定で、バンドルされていない Plugin がワークスペースまたは
グローバル Plugin ルートから自動検出される場合、起動ログには検出された Plugin ID と、
リストが短い場合は最小限の `plugins.allow` スニペットとともに、
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
と表示されます。信頼済みの Plugin を `openclaw.json` にコピーする前に、表示された
Plugin ID に対して [`openclaw plugins list --enabled --verbose`](/ja-JP/cli/plugins#list)
または [`openclaw plugins inspect <id>`](/ja-JP/cli/plugins#inspect) を実行してください。
診断により Plugin が `without install/load-path provenance` で読み込まれたと
表示された場合にも、同じ信頼固定が適用されます。その Plugin ID を検査してから、
`plugins.allow` に固定するか、信頼できるソースから再インストールして、OpenClaw に
インストール元を記録させてください。

設定検証で古い Plugin ID、許可リストとツールの不一致、または従来のバンドル Plugin
パスが報告された場合は、`openclaw doctor` または `openclaw doctor --fix` を
実行してください。

## Plugin 形式を理解する

OpenClaw は 2 つの Plugin 形式を認識します。

| 形式                 | 読み込み方法                                                                 | 使用する場合                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| ネイティブ OpenClaw Plugin | `openclaw.plugin.json` とプロセス内で読み込まれるランタイムモジュール               | OpenClaw 固有のランタイム機能をインストールまたは構築する場合  |
| 互換バンドル      | OpenClaw の Plugin 一覧にマッピングされる Codex、Claude、または Cursor の Plugin レイアウト | 互換性のある Skills、コマンド、フック、またはバンドルメタデータを再利用する場合 |

どちらの形式も、`openclaw plugins list`、`openclaw plugins inspect`、
`openclaw plugins enable`、`openclaw plugins disable` に表示されます。
バンドルの互換性境界については [Plugin バンドル](/ja-JP/plugins/bundles)、
ネイティブ Plugin の作成については [Plugin の構築](/ja-JP/plugins/building-plugins)を
参照してください。

## Plugin フック

Plugin は、2 つの異なる API を通じて実行時にフックを登録できます。

- ランタイムライフサイクルイベント向けの `api.on(...)` 型付きフック。ミドルウェア、
  ポリシー、メッセージの書き換え、プロンプトの調整、ツール制御に推奨される
  インターフェースです。
- [フック](/ja-JP/automation/hooks)で説明されている内部フックシステム向けの
  `api.registerHook(...)`。これは主に、大まかなコマンドまたはライフサイクルの
  副作用、および既存の HOOK 形式の自動化との互換性に使用されます。

簡単な判断基準：ハンドラーに優先度、マージセマンティクス、またはブロックやキャンセルの
動作が必要な場合は、型付きフックを使用します。`command:new`、`command:reset`、
`message:sent`、または同様の大まかなイベントに反応するだけであれば、
`api.registerHook` で問題ありません。

Plugin が管理する内部フックは、`openclaw hooks list` に `plugin:<id>` として
表示されます。`openclaw hooks` から有効化または無効化することはできません。
代わりに Plugin を有効化または無効化してください。

## 有効な Gateway を確認する

`openclaw plugins list` と通常の `openclaw plugins inspect` は、コールド状態の
設定、マニフェスト、レジストリ状態を読み取ります。すでに実行中の Gateway が
同じ Plugin コードをインポートしていることを証明するものではありません。

Plugin がインストール済みとして表示されるのに、実際のチャットトラフィックで
使用されない場合は、次を実行します。

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

管理対象の Gateway は、Plugin のソースを変更するインストール、更新、アンインストール後に自動的に再起動します。VPS またはコンテナへのインストールでは、手動再起動の対象がラッパーやスーパーバイザーだけではなく、チャネルを提供する実際の `openclaw gateway run` 子プロセスであることを確認してください。

## トラブルシューティング

| 症状                                                        | 確認事項                                                                                                                                      | 修正方法                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin が `plugins list` に表示されるが、ランタイムフックが実行されない  | `openclaw plugins inspect <id> --runtime --json` を使用し、`gateway status --deep --require-rpc` でアクティブな Gateway を確認する             | インストール、更新、設定、またはソースの変更後に稼働中の Gateway を再起動する                               |
| チャネルまたはツールの所有権重複に関する診断が表示される         | `openclaw plugins list --enabled --verbose` を実行し、疑わしい各 Plugin を `--runtime --json` で調査して、チャネル／ツールの所有権を比較する | 一方の所有者を無効にする、古いインストールを削除する、または意図的な置き換えにはマニフェストの `preferOver` を使用する      |
| 設定で Plugin が見つからないと表示される                                | [Plugin インベントリ](/ja-JP/plugins/plugin-inventory)で、同梱、公式外部、ソース限定のいずれかを確認する                           | 外部パッケージをインストールする、同梱 Plugin を有効にする、または古い設定を削除する                         |
| インストール中に設定が無効になる                               | 検証メッセージを読み、古い Plugin の状態を示している場合は `openclaw doctor --fix` を実行する                                             | Doctor は、エントリを無効にして無効なペイロードを削除することで、無効な Plugin 設定を隔離できる     |
| 不審な所有権または権限のため Plugin のパスがブロックされる | 設定エラーの前に表示される診断を確認する                                                                                             | ファイルシステムの所有権／権限を修正し、`openclaw plugins registry --refresh` を実行する                    |
| `OPENCLAW_NIX_MODE=1` によりライフサイクルコマンドがブロックされる                | インストールが Nix で管理されていることを確認する                                                                                                      | Plugin 変更コマンドを使用せず、Nix ソース内で Plugin の選択を変更する                      |
| ランタイムで依存関係のインポートに失敗する                             | Plugin が npm/git/ClawHub 経由でインストールされたか、ローカルパスから読み込まれたかを確認する                                                 | `openclaw plugins update <id>` を実行する、ソースを再インストールする、またはローカル Plugin の依存関係を自身でインストールする |

古い Plugin 設定に、検出できなくなったチャネル Plugin がまだ指定されている場合、設定検証ではそのチャネルキーを致命的なエラーではなく警告に格下げするため、Gateway の起動後もその他すべてのチャネルを提供できます。古い Plugin とチャネルのエントリを削除するには、`openclaw doctor --fix` を実行してください。古い Plugin の証拠がない不明なチャネルキーは引き続き検証に失敗するため、入力ミスを見落としません。

意図的にチャネルを置き換える場合、優先する Plugin は、従来または優先度の低い Plugin の ID を指定した `channelConfigs.<channel-id>.preferOver` を宣言する必要があります。両方の Plugin が明示的に有効化されている場合、OpenClaw はその要求を維持し、所有者を暗黙に1つ選択する代わりに、チャネル／ツールの所有権重複に関する診断を報告します。

インストール済みパッケージで `requires compiled runtime output for TypeScript entry ...` と報告される場合、そのパッケージは OpenClaw がランタイムで必要とする JavaScript ファイルを含めずに公開されています。公開者がコンパイル済み JavaScript を提供した後に更新または再インストールするか、それまでは Plugin を無効化またはアンインストールしてください。

### ブロックされた Plugin パスの所有権

診断に
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
と表示され、その後の検証で `plugin present but blocked` と表示される場合、OpenClaw は Plugin ファイルの所有者である Unix ユーザーが、それらを読み込むプロセスのユーザーと異なることを検出しています。Plugin の設定はそのまま残し、ファイルシステムの所有権を修正するか、状態ディレクトリを所有するユーザーと同じユーザーで OpenClaw を実行してください。

Docker インストールでは、公式イメージは `node`（uid `1000`）として実行されるため、ホストからバインドマウントする OpenClaw の設定ディレクトリとワークスペースディレクトリは通常、uid `1000` が所有する必要があります。

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

意図的に OpenClaw を root として実行する場合は、代わりに管理対象の Plugin ルートを root 所有へ修正してください。

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

所有権を修正した後、永続化された Plugin レジストリが修正済みファイルと一致するように、`openclaw doctor --fix` または `openclaw plugins registry --refresh` を再実行してください。

### Plugin ツールのセットアップが遅い場合

ツールの準備中にエージェントのターンが停止しているように見える場合は、トレースログを有効にし、Plugin ツールファクトリーの所要時間を示す行を確認してください。

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

次の行を探します。

```text
[trace:plugin-tools] factory timings ...
```

概要には、ファクトリーの合計所要時間と、最も遅い Plugin ツールファクトリーが一覧表示されます。これには、Plugin ID、宣言されたツール名、結果の形式、ツールが任意かどうかが含まれます。単一のファクトリーに1秒以上かかる場合、または Plugin ツールファクトリーの準備全体に5秒以上かかる場合、遅延を示す行は警告に昇格します。

OpenClaw は、同じ実効リクエストコンテキストで解決を繰り返す場合、正常に得られた Plugin ツールファクトリーの結果をキャッシュします。キャッシュキーには、実効ランタイム設定、ワークスペースとエージェント ID、サンドボックスポリシー、ブラウザー設定、配信コンテキスト、要求者の ID、および所有権の状態が含まれるため、それらの信頼済みフィールドに依存するファクトリーは、コンテキストの変更時に再実行されます。所要時間が高いままの場合、Plugin がツール定義を返す前に負荷の高い処理を実行している可能性があります。

1つの Plugin が所要時間の大部分を占める場合は、そのランタイム登録を調査してください。

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

その後、その Plugin を更新、再インストール、または無効化してください。Plugin の作成者は、負荷の高い依存関係の読み込みをツールファクトリー内で行うのではなく、ツールの実行パスに移動する必要があります。

依存関係のルート、パッケージメタデータの検証、レジストリレコード、起動時の再読み込み動作、およびレガシー項目のクリーンアップについては、[Plugin の依存関係の解決](/ja-JP/plugins/dependency-resolution)を参照してください。

## 関連項目

- [Plugin の管理](/ja-JP/plugins/manage-plugins) - 一覧表示、インストール、更新、アンインストール、公開のコマンド例
- [`openclaw plugins`](/ja-JP/cli/plugins) - CLI の完全なリファレンス
- [Plugin インベントリ](/ja-JP/plugins/plugin-inventory) - 生成された同梱および外部 Plugin の一覧
- [Plugin リファレンス](/ja-JP/plugins/reference) - Plugin ごとに生成されたリファレンスページ
- [コミュニティ Plugin](/ja-JP/plugins/community) - ClawHub での検出とドキュメント PR ポリシー
- [Plugin の依存関係の解決](/ja-JP/plugins/dependency-resolution) - インストールルート、レジストリレコード、ランタイム境界
- [Plugin の構築](/ja-JP/plugins/building-plugins) - ネイティブ Plugin の作成ガイド
- [Plugin SDK の概要](/ja-JP/plugins/sdk-overview) - ランタイム登録、フック、API フィールド
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストとパッケージメタデータ
