---
doc-schema-version: 1
read_when:
    - Plugin のインストールまたは設定
    - Plugin の検出と読み込みルールを理解する
    - Codex/Claude 互換 Plugin バンドルを扱う
sidebarTitle: Getting Started
summary: OpenClaw Plugin のインストール、設定、管理
title: Plugin
x-i18n:
    generated_at: "2026-06-27T13:16:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

Plugin は、チャネル、モデルプロバイダー、エージェントハーネス、ツール、
Skills、音声、リアルタイム文字起こし、ボイス、メディア理解、生成、
Web フェッチ、Web 検索、その他のランタイム機能で OpenClaw を拡張します。

Plugin をインストールし、Gateway を再起動し、ランタイムがそれを読み込んだことを検証し、
一般的なセットアップ失敗を切り分ける場合は、このページを使用します。コマンドのみの
例については、[Plugin を管理する](/ja-JP/plugins/manage-plugins)を参照してください。バンドル済み、公式外部、
ソース専用 Plugin の完全な生成済みインベントリについては、
[Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。

## 要件

Plugin をインストールする前に、次を確認してください。

- `openclaw` CLI が利用可能な OpenClaw チェックアウトまたはインストール
- ClawHub、npm、git ホストなど、選択したソースへのネットワークアクセス
- その Plugin のセットアップドキュメントで指定されている、Plugin 固有の認証情報、設定キー、またはオペレーティングシステムのツール
- チャネルを提供する Gateway をリロードまたは再起動する権限

## クイックスタート

<Steps>
  <Step title="Plugin を探す">
    公開 Plugin パッケージを [ClawHub](/ja-JP/clawhub) で検索します。

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub はコミュニティ Plugin の主要な発見面です。ローンチ切り替え期間中は、
    通常の裸のパッケージ指定は、公式 Plugin id と一致しない限り npm からインストールされます。
    バンドル済み Plugin と一致する生の `@openclaw/*` パッケージ指定は、現在の OpenClaw ビルドのバンドルコピーを使用します。
    特定のソースが必要な場合は、明示的なプレフィックスを使用してください。

  </Step>

  <Step title="Plugin をインストールする">
    ```bash
    # ClawHub から。
    openclaw plugins install clawhub:<package>

    # npm から。
    openclaw plugins install npm:<package>

    # git から。
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # ローカル開発チェックアウトから。
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Plugin のインストールは、コードを実行するのと同じように扱ってください。再現可能な本番インストールが必要な場合は、
    ピン留めされたバージョンを優先してください。

  </Step>

  <Step title="設定して有効化する">
    Plugin 固有の設定を `plugins.entries.<id>.config` の下に構成します。
    Plugin がまだ有効化されていない場合は有効化します。

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    設定で制限的な `plugins.allow` リストを使用している場合、Plugin を読み込む前に、インストール済み Plugin
    id がそこに存在している必要があります。
    `openclaw plugins install` は、インストール済み id を既存の
    `plugins.allow` リストに追加し、同じ id を `plugins.deny` から削除するため、
    明示的にインストールしたものは再起動後に読み込めます。

  </Step>

  <Step title="Gateway をリロードさせる">
    Plugin コードのインストール、更新、アンインストールには Gateway の再起動が必要です。
    管理対象 Gateway が設定リロード有効の状態ですでに実行中の場合、OpenClaw は変更された Plugin インストールレコードを検出し、
    Gateway を自動的に再起動します。Gateway が管理対象でない、またはリロードが無効な場合は、
    自分で再起動してください。

    ```bash
    openclaw gateway restart
    ```

    有効化と無効化の操作は設定を更新し、コールドレジストリを更新します。
    ランタイム inspect は、ライブランタイム面の最も明確な検証経路であることに変わりありません。

  </Step>

  <Step title="ランタイム登録を検証する">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    登録済みツール、フック、サービス、Gateway メソッド、または Plugin 所有の CLI コマンドを証明する必要がある場合は、
    `--runtime` を使用します。通常の `inspect` は、コールドなマニフェストとレジストリのチェックです。

  </Step>
</Steps>

## 設定

### インストール元を選ぶ

| ソース      | 使用する場合                                                                       | 例                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | OpenClaw ネイティブの発見、スキャン、バージョンメタデータ、インストールヒントが必要な場合 | `openclaw plugins install clawhub:<package>`                   |
| npm         | 直接の npm レジストリまたは dist-tag ワークフローが必要な場合                             | `openclaw plugins install npm:<package>`                       |
| git         | リポジトリのブランチ、タグ、またはコミットが必要な場合                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ローカルパス  | 同じマシン上で Plugin を開発またはテストしている場合                     | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Claude 互換 marketplace Plugin をインストールする場合                      | `openclaw plugins install <plugin> --marketplace <source>`     |

裸のパッケージ指定には特別な互換性動作があります。裸の名前がバンドル済み Plugin id と一致する場合、
OpenClaw はそのバンドル済みソースを使用します。公式外部 Plugin id と一致する場合、
OpenClaw は公式パッケージカタログを使用します。その他の通常の裸のパッケージ指定は、
ローンチ切り替え期間中は npm 経由でインストールされます。バンドル済み Plugin と一致する生の
`@openclaw/*` パッケージ指定も、npm フォールバックの前にバンドルコピーへ解決されます。
イメージ所有のバンドルコピーではなく外部 npm パッケージを意図的に使用したい場合は、
`npm:@openclaw/<plugin>@<version>` を使用します。決定論的なソース選択が必要な場合は、
`clawhub:`、`npm:`、`git:`、または `npm-pack:` を使用してください。完全なコマンド契約については、
[`openclaw plugins`](/ja-JP/cli/plugins#install)を参照してください。

npm インストールでは、ピン留めされていないパッケージ指定と `@latest` は、この OpenClaw ビルドとの互換性を示す最新の安定パッケージを選択します。npm の
現在の latest リリースがより新しい `openclaw.compat.pluginApi` または
`openclaw.install.minHostVersion` を宣言している場合、OpenClaw は古い安定パッケージバージョンをスキャンし、
適合する最新のものをインストールします。正確なバージョンと `@beta` などの明示的なチャネルタグは、
選択されたパッケージに固定されたままとなり、互換性がない場合は失敗します。

### オペレーターインストールポリシー

Plugin のインストールまたは更新を進める前に、信頼済みのローカルポリシーコマンドを実行するには
`security.installPolicy` を設定します。ポリシーはメタデータとステージ済みソースパスを受け取り、
インストールを許可またはブロックできます。これは CLI と Gateway バックの Plugin インストール/更新パスを対象にします。Plugin の `before_install` フックは、
Plugin フックが読み込まれている OpenClaw プロセス内でのみ後から実行されるため、オペレーター所有のインストール判断には
`security.installPolicy` を使用してください。非推奨の
`--dangerously-force-unsafe-install` フラグは互換性のために受け付けられますが、
インストールポリシーや OpenClaw の組み込み Plugin 依存関係 denylist はバイパスしません。

Skills と
Plugin の両方で使用される共有 `security.installPolicy` exec スキーマについては、[Skills 設定](/ja-JP/tools/skills-config#operator-install-policy-securityinstallpolicy)
を参照してください。

### Plugin ポリシーを設定する

一般的な Plugin 設定の形は次のとおりです。

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

主なポリシールール:

- `plugins.enabled: false` はすべての Plugin を無効化し、Plugin の検出/読み込み作業をスキップします。
  これが有効な間、古い Plugin 参照は不活性です。古い id を削除したい場合は、
  doctor cleanup を実行する前に Plugin を再度有効化してください。
- `plugins.deny` は allow と Plugin ごとの有効化より優先されます。
- `plugins.allow` は排他的な allowlist です。allowlist の外にある Plugin 所有ツールは、
  `tools.allow` に `"*"` が含まれていても利用できません。
- `plugins.entries.<id>.enabled: false` は、その設定を保持したまま 1 つの Plugin を無効化します。
- `plugins.load.paths` は明示的なローカル Plugin ファイルまたはディレクトリを追加します。管理対象の
  `plugins install` ローカルパスは Plugin ディレクトリまたはアーカイブである必要があります。スタンドアロン Plugin ファイルには
  `plugins.load.paths` を使用してください。
- ワークスペース由来の Plugin はデフォルトで無効です。ローカルワークスペースコードを使用する前に、明示的に有効化するか
  allowlist に追加してください。
- バンドル済み Plugin は、設定で明示的に上書きされない限り、組み込みのデフォルトオン/デフォルトオフメタデータに従います。
- `plugins.slots.<slot>` は、メモリやコンテキストエンジンなどの排他的カテゴリに 1 つの Plugin を選択します。
  スロット選択は明示的なアクティベーションとして数えられるため、選択された Plugin をそのスロットに対して強制的に有効化します。
  そうでなければ opt-in になる場合でも読み込めます。`plugins.deny` と
  `plugins.entries.<id>.enabled: false` は引き続きブロックします。
- バンドル済み opt-in Plugin は、プロバイダー/モデル ref、チャネル設定、CLI バックエンド、エージェントハーネスランタイムなど、
  自身が所有する面のいずれかを設定が指定している場合、自動アクティブ化できます。
- OpenAI ファミリー Codex ルーティングは、プロバイダーとランタイム Plugin の境界を分離したままにします。
  レガシー Codex モデル ref は doctor によって修復されるレガシー設定であり、バンドル済みの
  `codex` Plugin は、正規の `openai/*` エージェント
  ref、明示的な `agentRuntime.id: "codex"`、およびレガシー `codex/*` ref の Codex app-server ランタイムを所有します。

`plugins.allow` が未設定で、非バンドル Plugin がワークスペースまたはグローバル Plugin ルートから自動検出される場合、
起動ログに
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
と表示されます。この警告には検出された Plugin id が含まれ、短いリストの場合は最小限の
`plugins.allow` スニペットも含まれます。信頼済み Plugin を `openclaw.json` にコピーする前に、一覧表示された Plugin
id を使って
[`openclaw plugins list --enabled --verbose`](/ja-JP/cli/plugins#list) または
[`openclaw plugins inspect <id>`](/ja-JP/cli/plugins#inspect) を実行してください。同じ信頼ピン留めの
ガイダンスは、診断が Plugin が
`without install/load-path provenance` で読み込まれたと示す場合にも適用されます。その Plugin id を inspect してから、
信頼済み id を `plugins.allow` にピン留めするか、信頼済みソースから再インストールして OpenClaw がインストール来歴を記録できるようにしてください。

設定検証で古い Plugin id、allowlist/ツールの不一致、またはレガシーなバンドル済み Plugin パスが報告された場合は、
`openclaw doctor` または `openclaw doctor --fix` を実行してください。

## Plugin 形式を理解する

OpenClaw は 2 つの Plugin 形式を認識します。

| 形式                 | 読み込み方法                                                                 | 使用する場合                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| ネイティブ OpenClaw Plugin | `openclaw.plugin.json` とプロセス内で読み込まれるランタイムモジュール               | OpenClaw 固有のランタイム機能をインストールまたは構築している場合  |
| 互換バンドル      | OpenClaw Plugin インベントリにマップされる Codex、Claude、または Cursor Plugin レイアウト | 互換性のある Skills、コマンド、フック、またはバンドルメタデータを再利用する場合 |

どちらの形式も、`openclaw plugins list`、`openclaw plugins inspect`、
`openclaw plugins enable`、`openclaw plugins disable` に表示されます。バンドル互換性の境界については
[Plugin バンドル](/ja-JP/plugins/bundles)を、ネイティブ Plugin の作成については
[Plugin の構築](/ja-JP/plugins/building-plugins)を参照してください。

## Plugin フック

Plugin はランタイムでフックを登録できますが、役割の異なる 2 つの API があります。

- ランタイムライフサイクルフックには、`api.on(...)` 経由の型付きフックを使用します。これは、
  ミドルウェア、ポリシー、メッセージ書き換え、プロンプト形成、ツール制御に推奨される面です。
- [フック](/ja-JP/automation/hooks) で説明されている内部フックシステムに参加したい場合にのみ、
  `api.registerHook(...)` を使用します。これは主に、大まかなコマンド/ライフサイクルの副作用と、
  既存の HOOK スタイル自動化との互換性のためのものです。

簡単なルール:

- ハンドラーに優先度、マージセマンティクス、またはブロック/キャンセル動作が必要な場合は、
  型付き Plugin フックを使用します。
- ハンドラーが `command:new`、`command:reset`、`message:sent`、
  または類似の大まかなイベントに反応するだけなら、`api.registerHook(...)` で問題ありません。

Plugin 管理の内部フックは、`openclaw hooks list` に
`plugin:<id>` として表示されます。`openclaw hooks` からそれらを有効化または無効化することはできません。
代わりに Plugin を有効化または無効化してください。

## アクティブな Gateway を検証する

`openclaw plugins list` と単純な `openclaw plugins inspect` は、コールドな設定、
マニフェスト、レジストリ状態を読み取ります。すでに実行中の Gateway が同じ Plugin コードを
インポートしていることは証明しません。

Plugin がインストール済みに見えるのに、ライブチャットのトラフィックで使われない場合:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

管理対象 Gateway は、Plugin ソースを変更する Plugin のインストール、更新、アンインストール後に
自動で再起動します。VPS またはコンテナインストールでは、手動再起動の対象が、ラッパーや
スーパーバイザーだけではなく、チャンネルにサービスを提供している実際の
`openclaw gateway run` 子プロセスであることを確認してください。

## トラブルシューティング

| 症状                                                        | 確認                                                                                                                                      | 修正                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin が `plugins list` に表示されるが、ランタイムフックが実行されない  | `openclaw plugins inspect <id> --runtime --json` を使い、`gateway status --deep --require-rpc` でアクティブな Gateway を確認する             | インストール、更新、設定、ソース変更後にライブ Gateway を再起動する                               |
| 重複したチャンネルまたはツール所有権の診断が表示される         | `openclaw plugins list --enabled --verbose` を実行し、疑わしい各 Plugin を `--runtime --json` で調べ、チャンネル/ツール所有権を比較する | 一方の所有者を無効化する、古いインストールを削除する、または意図的な置き換えにはマニフェストの `preferOver` を使う      |
| 設定で Plugin が見つからないと表示される                                | [Plugin インベントリ](/ja-JP/plugins/plugin-inventory) で、それがバンドル済み、公式外部、またはソース専用のどれかを確認する                           | 外部パッケージをインストールする、バンドル済み Plugin を有効化する、または古い設定を削除する                         |
| インストール中に設定が無効になる                               | 検証メッセージを読み、古い Plugin 状態を指している場合は `openclaw doctor --fix` を実行する                                           | Doctor は、そのエントリを無効化して無効なペイロードを削除することで、無効な Plugin 設定を隔離できます     |
| Plugin パスが疑わしい所有権または権限のためブロックされる | 設定エラーの前にある診断を調べる                                                                                             | ファイルシステムの所有権/権限を修正してから、`openclaw plugins registry --refresh` を実行する                    |
| `OPENCLAW_NIX_MODE=1` がライフサイクルコマンドをブロックする                | インストールが Nix によって管理されていることを確認する                                                                                                      | Plugin ミューテーターコマンドを使う代わりに、Nix ソース内で Plugin 選択を変更する                      |
| 依存関係のインポートがランタイムで失敗する                             | Plugin が npm/git/ClawHub 経由でインストールされたか、ローカルパスから読み込まれたかを確認する                                                 | `openclaw plugins update <id>` を実行する、ソースを再インストールする、またはローカル Plugin の依存関係を自分でインストールする |

古い Plugin 設定が、すでに検出できないチャンネル Plugin をまだ指定している場合、
Gateway 起動は、他のすべてのチャンネルをブロックする代わりに、その Plugin が裏付けるチャンネルをスキップします。
`openclaw doctor --fix` を実行して、古い Plugin とチャンネルのエントリを削除してください。
古い Plugin の証拠がない未知のチャンネルキーは引き続き検証に失敗するため、入力ミスは見えるままになります。

意図的なチャンネル置き換えでは、優先する Plugin は
`channelConfigs.<channel-id>.preferOver` で、レガシーまたは低優先度の
Plugin id を宣言する必要があります。両方の Plugin が明示的に有効化されている場合、OpenClaw はその要求を保持し、
1 つの所有者を黙って選ぶ代わりに、重複したチャンネルまたはツールの診断を報告します。

インストール済みパッケージが `requires compiled runtime output for
TypeScript entry ...` と報告する場合、そのパッケージは OpenClaw がランタイムで必要とする JavaScript ファイルなしで
公開されています。公開者がコンパイル済み JavaScript を出荷した後に更新または再インストールするか、
それまでは Plugin を無効化/アンインストールしてください。

### ブロックされた Plugin パス所有権

Plugin 診断に
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
と表示され、その後に設定検証で `plugin present but blocked` が続く場合、OpenClaw は
Plugin ファイルの所有者が、それを読み込んでいるプロセスとは異なる Unix ユーザーであることを検出しています。
Plugin 設定はそのままにして、ファイルシステムの所有権を修正するか、状態ディレクトリを所有する同じユーザーとして
OpenClaw を実行してください。

Docker インストールでは、公式イメージは `node` (uid `1000`) として実行されるため、
ホストでバインドマウントされた OpenClaw 設定ディレクトリとワークスペースディレクトリは通常、
uid `1000` に所有されている必要があります:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

意図的に OpenClaw を root として実行している場合は、代わりに管理対象 Plugin ルートを
root 所有権に修復してください:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

所有権を修正した後、`openclaw doctor --fix` または
`openclaw plugins registry --refresh` を再実行し、永続化された Plugin レジストリが
修復済みファイルと一致するようにしてください。

### 遅い Plugin ツール設定

エージェントターンがツールの準備中に停止しているように見える場合は、トレースログを有効化し、
Plugin ツールファクトリのタイミング行を確認してください:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

次を探してください:

```text
[trace:plugin-tools] factory timings ...
```

概要には、Plugin id、宣言されたツール名、結果の形、ツールが任意かどうかを含め、
合計ファクトリ時間と最も遅い Plugin ツールファクトリが一覧表示されます。
単一のファクトリが少なくとも 1s かかる場合、または Plugin ツールファクトリ準備の合計が少なくとも 5s かかる場合、
遅い行は警告に昇格されます。

OpenClaw は、同じ有効な要求コンテキストで繰り返し解決される成功した Plugin ツールファクトリ結果をキャッシュします。
キャッシュキーには、有効なランタイム設定、ワークスペース、エージェント/セッション id、サンドボックスポリシー、
ブラウザー設定、配信コンテキスト、要求者の ID、所有権状態が含まれるため、これらの信頼済みフィールドに依存する
ファクトリは、コンテキストが変わると再実行されます。タイミングが高いままの場合、その Plugin はツール定義を返す前に
高コストな処理を行っている可能性があります。

1 つの Plugin がタイミングを支配している場合は、そのランタイム登録を調べてください:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

その後、その Plugin を更新、再インストール、または無効化してください。Plugin 作者は、
高コストな依存関係の読み込みを、ツールファクトリ内で行うのではなく、ツール実行パスの背後へ移動する必要があります。

依存関係ルート、パッケージメタデータ検証、レジストリレコード、起動時の再読み込み動作、
レガシークリーンアップについては、[Plugin 依存関係解決](/ja-JP/plugins/dependency-resolution)を参照してください。

## 関連

- [Plugin を管理](/ja-JP/plugins/manage-plugins) - list、install、update、uninstall、publish のコマンド例
- [`openclaw plugins`](/ja-JP/cli/plugins) - 完全な CLI リファレンス
- [Plugin インベントリ](/ja-JP/plugins/plugin-inventory) - 生成されたバンドル済みおよび外部 Plugin 一覧
- [Plugin リファレンス](/ja-JP/plugins/reference) - 生成された Plugin ごとのリファレンスページ
- [コミュニティ Plugin](/ja-JP/plugins/community) - ClawHub 検出と docs PR ポリシー
- [Plugin 依存関係解決](/ja-JP/plugins/dependency-resolution) - インストールルート、レジストリレコード、ランタイム境界
- [Plugin の構築](/ja-JP/plugins/building-plugins) - ネイティブ Plugin 作成ガイド
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview) - ランタイム登録、フック、API フィールド
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストとパッケージメタデータ
