---
doc-schema-version: 1
read_when:
    - Plugin のインストールまたは設定
    - Plugin の検出と読み込みルールを理解する
    - Codex/Claude 互換 Plugin バンドルの操作
sidebarTitle: Getting Started
summary: OpenClaw Plugin のインストール、設定、管理
title: Plugin
x-i18n:
    generated_at: "2026-07-16T12:10:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cd6b19616c14fbbfcec47beca02f206d7a8ca9500c530d06958a30a9e5488bde
    source_path: tools/plugin.md
    workflow: 16
---

Plugin は、チャンネル、モデルプロバイダー、エージェントハーネス、ツール、
Skills、音声、リアルタイム文字起こし、音声通話、メディア理解、生成、
ウェブ取得、ウェブ検索、その他のランタイム機能を OpenClaw に追加します。

このページでは、Plugin をインストールし、Gateway を再起動して、ランタイムに
読み込まれたことを確認し、一般的なセットアップ障害への対処方法を説明します。コマンドのみの例については、
[Plugin の管理](/ja-JP/plugins/manage-plugins)を参照してください。バンドル済み、公式外部、
およびソースのみの Plugin について生成された一覧は、
[Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。

## 要件

- an OpenClaw のチェックアウトまたはインストール環境で、`openclaw` CLI が利用可能であること
- 選択したソース（ClawHub、npm、または git ホスト）へのネットワークアクセス
- その Plugin のセットアップドキュメントに記載されている、Plugin 固有の認証情報、設定キー、または OS ツール
- チャンネルを提供する Gateway を再読み込みまたは再起動する権限

## クイックスタート

<Steps>
  <Step title="Plugin を探す">
    公開 Plugin パッケージを [ClawHub](/clawhub) で検索します。

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub は、コミュニティ Plugin を見つけるための主要な手段です。移行開始期間中は、
    通常のプレフィックスなしパッケージ指定は、公式 Plugin ID と一致しない限り、
    引き続き npm からインストールされます。バンドル済み Plugin と一致する生の `@openclaw/*`
    指定は、そのバンドル済みコピーに解決されます。特定のソースを明示的に使用する必要がある場合は、
    ソースプレフィックスを指定してください。

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
    インストールには、固定バージョンを推奨します。ClawHub パッケージと OpenClaw の
    バンドル済み／公式カタログは信頼済みソースです。新しい任意の npm、git、
    ローカルパス／アーカイブ、`npm-pack:`、またはマーケットプレイスソースを
    非対話型でインストールするには、ソースを確認して信頼した後に
    `--force` が必要です。

  </Step>

  <Step title="設定して有効化する">
    Plugin 固有の設定を `plugins.entries.<id>.config` 配下で行います。
    Plugin がまだ有効でない場合は有効化します。

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    `plugins.allow` が設定されている場合、Plugin を読み込むには、
    インストール済み Plugin ID がそのリストに含まれている必要があります。`openclaw plugins install` は、
    既存の `plugins.allow` リストにインストール済み ID を追加し、
    同じ ID を `plugins.deny` から削除するため、明示的にインストールした Plugin を
    再起動後に読み込めます。

  </Step>

  <Step title="Gateway を再読み込みさせる">
    Plugin コードをインストール、更新、またはアンインストールした場合は、Gateway の
    再起動が必要です。設定の再読み込みが有効な管理対象 Gateway は、Plugin の
    インストール記録の変更を検出し、自動的に再起動します。それ以外の場合は、
    手動で再起動してください。

    ```bash
    openclaw gateway restart
    ```

    有効化／無効化では、設定とコールドレジストリが更新されます。稼働中のランタイムサーフェスを確認するには、
    引き続きランタイム検査が最も明確な証拠となります。

  </Step>

  <Step title="ランタイム登録を確認する">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    登録済みのツール、フック、サービス、Gateway メソッド、または Plugin が所有する
    CLI コマンドを確認するには、`--runtime` を使用します。通常の `inspect` は、
    コールド状態のマニフェストおよびレジストリのみを確認します。

  </Step>
</Steps>

## 設定

### インストールソースを選択する

| ソース      | 使用する場合                                                                       | 例                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | OpenClaw ネイティブの検出、スキャン、バージョンメタデータ、インストールヒントが必要な場合 | `openclaw plugins install clawhub:<package>`                   |
| npm         | npm レジストリまたは dist-tag のワークフローを直接使用する必要がある場合                             | `openclaw plugins install npm:<package>`                       |
| git         | リポジトリのブランチ、タグ、またはコミットが必要な場合                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ローカルパス  | 同じマシン上で Plugin を開発またはテストしている場合                     | `openclaw plugins install --link ./my-plugin`                  |
| マーケットプレイス | Claude 互換のマーケットプレイス Plugin をインストールする場合                      | `openclaw plugins install <plugin> --marketplace <source>`     |

プレフィックスなしのパッケージ指定には、特別な互換動作があります。バンドル済み Plugin ID と
一致するプレフィックスなしの名前は、そのバンドル済みソースを使用します。公式外部 Plugin ID と一致する
プレフィックスなしの名前は、公式パッケージカタログを使用します。それ以外のプレフィックスなし指定は、
移行開始期間中は npm を通じてインストールされます。バンドル済み Plugin と一致する生の `@openclaw/*`
指定も、npm へのフォールバックより先にバンドル済みコピーに解決されます。バンドル済みコピーではなく
外部 npm パッケージを意図的にインストールするには、`npm:@openclaw/<plugin>@<version>` を使用します。
ソースを決定論的に選択するには、`clawhub:`、`npm:`、
`git:`、または `npm-pack:` を使用します。完全なコマンド契約については、
[`openclaw plugins`](/ja-JP/cli/plugins#install)を参照してください。

npm からのインストールでは、固定されていない指定と `@latest` は、この OpenClaw ビルドとの
互換性を示す最新の安定版パッケージを選択します。npm の現在の最新リリースが、このビルドでサポートするものより
新しい `openclaw.compat.pluginApi` または `openclaw.install.minHostVersion` を宣言している場合、
OpenClaw は過去の安定版を走査し、条件を満たす最新バージョンをインストールします。正確なバージョンと
`@beta` などの明示的なチャンネルタグは、選択したパッケージに固定されたままとなり、
互換性がない場合は失敗します。

### 運用者のインストールポリシー

Plugin のインストールまたは更新を進める前に、信頼済みのローカルポリシーコマンドを実行するよう
`security.installPolicy` を設定します。このポリシーには、メタデータとステージング済みソースパスが渡され、
インストールを許可またはブロックできます。CLI と Gateway 経由の両方のインストール／更新パスが対象です。
Plugin の `before_install` フックはそれより後に実行され、かつ Plugin フックが読み込まれている
OpenClaw プロセス内でのみ実行されるため、運用者が管理するインストール判断には、代わりに
`security.installPolicy` を使用してください。非推奨の `--dangerously-force-unsafe-install` フラグは
互換性のために受け付けられますが、何も行いません。インストールポリシーや OpenClaw 組み込みの
Plugin 依存関係拒否リストを回避するものではありません。

Skills と Plugin の両方で使用される共通の `security.installPolicy` 実行スキーマについては、
[Skills の設定](/ja-JP/tools/skills-config#operator-install-policy-securityinstallpolicy)を参照してください。

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

主なポリシールールは次のとおりです。

- `plugins.enabled: false` はすべての Plugin を無効にし、検出／読み込み処理を
  スキップします。この設定が有効な間、古い Plugin 参照は動作しないまま残ります。古い ID を
  削除する場合は、doctor によるクリーンアップを実行する前に Plugin を再度有効にしてください。
- `plugins.deny` は、許可リストと Plugin ごとの有効化設定より優先されます。
- `plugins.allow` は排他的な許可リストです。`tools.allow` に `"*"` が
  含まれていても、許可リスト外にある Plugin 所有のツールは利用できません。
- `plugins.entries.<id>.enabled: false` は設定を保持したまま、1 つの Plugin を無効にします。
- `plugins.load.paths` は、明示的なローカル Plugin ファイルまたはディレクトリを追加します。
  管理対象の `plugins install` ローカルパスは Plugin ディレクトリまたはアーカイブである必要があります。
  単独の Plugin ファイルには `plugins.load.paths` を使用してください。
- ワークスペース由来の Plugin はデフォルトで無効です。ローカルワークスペースのコードを
  使用する前に、明示的に有効化するか許可リストに追加してください。
- バンドル済み Plugin は、設定によって明示的に上書きされない限り、
  組み込みのデフォルト有効／デフォルト無効メタデータに従います。
- `plugins.slots.<slot>`（`memory` または `contextEngine`）は、
  排他的なカテゴリに対して 1 つの Plugin を選択します。スロットの選択は明示的な有効化として扱われ、
  通常ならオプトインが必要な場合でも、選択された Plugin をそのスロット用に強制的に有効化します。
  `plugins.deny` と `plugins.entries.<id>.enabled: false` によるブロックは引き続き有効です。
- バンドル済みのオプトイン Plugin は、プロバイダー／モデル参照、チャンネル設定、
  CLI バックエンド、エージェントハーネスランタイムなど、自身が所有するサーフェスのいずれかが
  設定で指定されると、自動的に有効化できます。
- OpenAI 系の Codex ルーティングでは、プロバイダーとランタイム Plugin の境界が
  分離されています。従来の Codex モデル参照は doctor が修復するレガシー設定であり、
  バンドル済みの `codex` Plugin は、正規の `openai/*` エージェント参照、
  明示的な `agentRuntime.id: "codex"`、および従来の `codex/*` 参照に対する
  Codex app-server ランタイムを所有します。

`plugins.allow` が未設定で、バンドルされていない Plugin がワークスペースまたはグローバルな
Plugin ルートから自動検出される場合、起動ログに
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
が、検出された Plugin ID とともに記録されます。リストが短い場合は、最小限の
`plugins.allow` スニペットも記録されます。信頼済み Plugin を `openclaw.json` にコピーする前に、
一覧にある Plugin ID に対して [`openclaw plugins list --enabled --verbose`](/ja-JP/cli/plugins#list)
または [`openclaw plugins inspect <id>`](/ja-JP/cli/plugins#inspect) を実行してください。
診断で Plugin が `without install/load-path provenance` を読み込んだと表示された場合も、同じように信頼を固定します。
その Plugin ID を検査し、`plugins.allow` に固定するか、信頼済みソースから再インストールして、
OpenClaw にインストール元を記録させてください。

設定検証で古い Plugin ID、許可リスト／ツールの不一致、または従来のバンドル済み Plugin パスが
報告された場合は、`openclaw doctor` または `openclaw doctor --fix` を実行してください。

## Plugin 形式を理解する

OpenClaw は、2 つの Plugin 形式を認識します。

| 形式                 | 読み込み方法                                                                 | 使用する場合                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| ネイティブ OpenClaw Plugin | `openclaw.plugin.json` と、プロセス内に読み込まれるランタイムモジュール               | OpenClaw 固有のランタイム機能をインストールまたは構築する場合  |
| 互換バンドル      | OpenClaw の Plugin インベントリにマッピングされる Codex、Claude、または Cursor の Plugin レイアウト | 互換性のある Skills、コマンド、フック、またはバンドルメタデータを再利用する場合 |

両方の形式が、`openclaw plugins list`、`openclaw plugins inspect`、
`openclaw plugins enable`、および `openclaw plugins disable` に表示されます。バンドルの互換性境界については
[Plugin バンドル](/ja-JP/plugins/bundles)を、ネイティブ Plugin の作成については
[Plugin の構築](/ja-JP/plugins/building-plugins)を参照してください。

## Plugin フック

Plugin は、2 つの異なる API を通じてランタイムにフックを登録できます。

- `api.on(...)` は、ランタイムのライフサイクルイベント用の型付きフックです。
  ミドルウェア、ポリシー、メッセージの書き換え、プロンプトの形成、ツール制御には、
  このサーフェスを推奨します。
- `api.registerHook(...)` は、[フック](/ja-JP/automation/hooks)で説明されている
  内部フックシステム用です。主に、大まかなコマンド／ライフサイクルの副作用と、
  既存の HOOK 形式の自動化との互換性に使用します。

簡単な判断基準として、ハンドラーに優先度、マージセマンティクス、または
ブロック／キャンセル動作が必要な場合は、型付きフックを使用します。`command:new`、
`command:reset`、`message:sent`、または同様の大まかなイベントに反応するだけの場合は、
`api.registerHook` で問題ありません。

Plugin が管理する内部フックは、`openclaw hooks list` に
`plugin:<id>` とともに表示されます。`openclaw hooks` を通じて
有効化または無効化することはできません。代わりに Plugin を有効化または無効化してください。

## アクティブな Gateway を確認する

`openclaw plugins list` と通常の `openclaw plugins inspect` は、コールド状態の設定、
マニフェスト、およびレジストリの状態を読み取ります。これらは、すでに実行中の
Gateway が同じプラグインコードをインポート済みであることを証明するものではありません。

プラグインがインストール済みと表示されるにもかかわらず、ライブチャットのトラフィックで使用されない場合:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

管理対象の Gateway は、プラグインのソースを変更するインストール、更新、および
アンインストールの後に自動的に再起動します。VPS またはコンテナへのインストールでは、
手動再起動の対象が、ラッパーやスーパーバイザーだけでなく、チャンネルを実際に
提供している `openclaw gateway run` 子プロセスであることを確認してください。

## トラブルシューティング

| 症状                                                        | 確認事項                                                                                                                                      | 修正方法                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| プラグインが `plugins list` に表示されるが、ランタイムフックが実行されない  | `openclaw plugins inspect <id> --runtime --json` を使用し、`gateway status --deep --require-rpc` でアクティブな Gateway を確認する             | インストール、更新、設定、またはソースの変更後に稼働中の Gateway を再起動する                               |
| チャンネルまたはツールの所有権が重複しているという診断が表示される         | `openclaw plugins list --enabled --verbose` を実行し、疑わしい各プラグインを `--runtime --json` で調査して、チャンネル/ツールの所有権を比較する | いずれかの所有者を無効化する、古いインストールを削除する、または意図的な置き換えにはマニフェストの `preferOver` を使用する      |
| 設定でプラグインが見つからないと表示される                                | [プラグイン一覧](/ja-JP/plugins/plugin-inventory)で、バンドル版、公式外部版、またはソース限定のどれであるかを確認する                           | 外部パッケージをインストールする、バンドルされたプラグインを有効化する、または古い設定を削除する                         |
| インストール中に設定が無効になる                               | 検証メッセージを読み、古いプラグイン状態を示している場合は `openclaw doctor --fix` を実行する                                             | Doctor は、エントリを無効化して無効なペイロードを削除することにより、無効なプラグイン設定を隔離できる     |
| 不審な所有権または権限のためにプラグインパスがブロックされる | 設定エラーの前に表示される診断を確認する                                                                                             | ファイルシステムの所有権/権限を修正してから、`openclaw plugins registry --refresh` を実行する                    |
| `OPENCLAW_NIX_MODE=1` がライフサイクルコマンドをブロックする                | インストールが Nix によって管理されていることを確認する                                                                                                      | プラグイン変更コマンドを使用せず、Nix ソース内でプラグインの選択を変更する                      |
| 実行時に依存関係のインポートが失敗する                             | プラグインが npm/git/ClawHub 経由でインストールされたか、ローカルパスから読み込まれたかを確認する                                                 | `openclaw plugins update <id>` を実行する、ソースを再インストールする、またはローカルプラグインの依存関係を自分でインストールする |

古いプラグイン設定に、検出できなくなったチャンネルプラグインが引き続き指定されている場合、
設定検証はそのチャンネルキーを致命的なエラーではなく警告に格下げします。これにより、
Gateway の起動時にも他のすべてのチャンネルを提供できます。古いプラグインおよび
チャンネルのエントリを削除するには、`openclaw doctor --fix` を実行してください。古い
プラグインである証拠がない不明なチャンネルキーは引き続き検証に失敗するため、
タイプミスを確認できます。

チャンネルを意図的に置き換える場合、優先するプラグインでは、従来または優先度の低い
プラグイン ID を指定した `channelConfigs.<channel-id>.preferOver` を宣言する必要があります。
両方のプラグインが明示的に有効化されている場合、OpenClaw はその要求を維持し、
所有者を暗黙に選択する代わりに、チャンネル/ツールの重複診断を報告します。

インストール済みパッケージから `requires compiled runtime output for
TypeScript entry ...` と報告された場合、そのパッケージは
OpenClaw の実行時に必要な JavaScript ファイルを含めずに公開されています。公開者が
コンパイル済み JavaScript をリリースした後に更新または再インストールするか、それまで
プラグインを無効化またはアンインストールしてください。

### ブロックされたプラグインパスの所有権

診断に
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
と表示され、その後の検証で `plugin present but blocked` と表示された場合、OpenClaw は、
プラグインを読み込むプロセスとは異なる Unix ユーザーが所有するプラグインファイルを
検出しています。プラグイン設定はそのまま維持してください。ファイルシステムの所有権を
修正するか、状態ディレクトリを所有するユーザーと同じユーザーとして OpenClaw を実行してください。

Docker インストールでは、公式イメージは `node`（uid `1000`）として実行されるため、
ホストからバインドマウントする OpenClaw の設定およびワークスペースディレクトリは通常、
uid `1000` が所有する必要があります。

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

OpenClaw を意図的に root として実行する場合は、代わりに管理対象プラグインのルートを
root 所有に修復してください。

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

所有権を修正した後、永続化されたプラグインレジストリが修復済みファイルと一致するよう、
`openclaw doctor --fix` または
`openclaw plugins registry --refresh` を再実行してください。

### プラグインツールのセットアップが遅い場合

ツールの準備中にエージェントのターンが停止しているように見える場合は、トレースログを
有効にし、プラグインツールファクトリのタイミング行を確認してください。

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

次を探します。

```text
[trace:plugin-tools] factory timings ...
```

概要には、ファクトリの合計所要時間と、最も遅いプラグインツールファクトリが一覧表示されます。
これには、プラグイン ID、宣言されたツール名、結果の形式、およびツールがオプションかどうかが
含まれます。単一のファクトリに少なくとも 1s かかる場合、またはプラグインツールファクトリの
準備全体に少なくとも 5s かかる場合、遅い行は警告に昇格されます。

OpenClaw は、同じ実効リクエストコンテキストで解決を繰り返す際に、成功したプラグインツール
ファクトリの結果をキャッシュします。キャッシュキーには、実効ランタイム設定、ワークスペースと
エージェント ID、サンドボックスポリシー、ブラウザ設定、配信コンテキスト、要求者のアイデンティティ、
および所有権の状態が含まれます。そのため、これらの信頼されたフィールドに依存するファクトリは、
コンテキストが変化すると再実行されます。所要時間が高いままの場合、プラグインはツール定義を
返す前に負荷の高い処理を行っている可能性があります。

1 つのプラグインが所要時間の大部分を占めている場合は、そのランタイム登録を調査します。

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

その後、そのプラグインを更新、再インストール、または無効化してください。プラグインの作成者は、
負荷の高い依存関係の読み込みをツールファクトリ内で行うのではなく、ツールの実行パスまで遅延させる
必要があります。

依存関係のルート、パッケージメタデータの検証、レジストリレコード、起動時の再読み込み動作、
および従来のデータのクリーンアップについては、
[プラグインの依存関係解決](/ja-JP/plugins/dependency-resolution)を参照してください。

## 関連項目

- [プラグインの管理](/ja-JP/plugins/manage-plugins) - 一覧表示、インストール、更新、アンインストール、公開のコマンド例
- [`openclaw plugins`](/ja-JP/cli/plugins) - CLI の完全なリファレンス
- [プラグイン一覧](/ja-JP/plugins/plugin-inventory) - 生成されたバンドル版および外部プラグインの一覧
- [プラグインリファレンス](/ja-JP/plugins/reference) - 生成されたプラグインごとのリファレンスページ
- [コミュニティプラグイン](/ja-JP/plugins/community) - ClawHub での検索とドキュメント PR ポリシー
- [プラグインの依存関係解決](/ja-JP/plugins/dependency-resolution) - インストールルート、レジストリレコード、およびランタイム境界
- [プラグインの構築](/ja-JP/plugins/building-plugins) - ネイティブプラグインの作成ガイド
- [プラグイン SDK の概要](/ja-JP/plugins/sdk-overview) - ランタイム登録、フック、および API フィールド
- [プラグインマニフェスト](/ja-JP/plugins/manifest) - マニフェストおよびパッケージメタデータ
