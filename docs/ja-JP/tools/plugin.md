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
    generated_at: "2026-07-05T11:52:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

Plugin は OpenClaw に、チャネル、モデルプロバイダー、エージェントハーネス、ツール、
Skills、音声、リアルタイム文字起こし、ボイス、メディア理解、生成、
Web フェッチ、Web 検索、その他のランタイム機能を追加します。

このページでは、Plugin をインストールし、Gateway を再起動し、ランタイムが
それを読み込んだことを確認し、一般的なセットアップ失敗に対処する方法を説明します。コマンドのみの例は
[Plugin を管理](/ja-JP/plugins/manage-plugins)を参照してください。バンドル済み、公式外部、
ソース専用 Plugin の生成済みインベントリについては、
[Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。

## 要件

- `openclaw` CLI が利用可能な OpenClaw チェックアウトまたはインストール
- 選択したソース（ClawHub、npm、または git ホスト）へのネットワークアクセス
- その Plugin のセットアップドキュメントで指定されている、Plugin 固有の認証情報、
  設定キー、または OS ツール
- チャネルにサービスを提供する Gateway をリロードまたは再起動する権限

## クイックスタート

<Steps>
  <Step title="Find the plugin">
    公開 Plugin パッケージを [ClawHub](/clawhub) で検索します。

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub は、コミュニティ Plugin の主要な検出サーフェスです。ローンチ切り替え中は、
    通常の裸のパッケージ仕様は、公式 Plugin id に一致しない限り npm からインストールされます。
    バンドル済み Plugin に一致する生の `@openclaw/*` 仕様は、そのバンドル済みコピーに解決されます。
    特定のソースを明示的に使う必要がある場合は、明示的なソースプレフィックスを使用してください。

  </Step>

  <Step title="Install the plugin">
    ```bash
    # From ClawHub.
    openclaw plugins install clawhub:<package>

    # From npm.
    openclaw plugins install npm:<package>

    # From git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # From a local development checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Plugin のインストールはコードを実行するものとして扱ってください。
    再現可能な本番インストールには、固定バージョンを優先してください。

  </Step>

  <Step title="Configure and enable it">
    Plugin 固有の設定を `plugins.entries.<id>.config` の下に構成します。
    Plugin がまだ有効化されていない場合は有効化します。

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    `plugins.allow` が設定されている場合、Plugin を読み込む前に、インストール済み Plugin id が
    そのリストに含まれている必要があります。`openclaw plugins install` は、既存の
    `plugins.allow` リストにインストール済み id を追加し、同じ id を `plugins.deny` から削除します。
    これにより、明示的にインストールした Plugin は再起動後に読み込めます。

  </Step>

  <Step title="Let the Gateway reload">
    Plugin コードのインストール、更新、アンインストールには Gateway の再起動が必要です。
    設定リロードが有効な管理対象 Gateway は、変更された Plugin インストールレコードを検出し、
    自動的に再起動します。それ以外の場合は、自分で再起動してください。

    ```bash
    openclaw gateway restart
    ```

    更新設定とコールドレジストリを有効化または無効化します。ライブランタイムサーフェスの
    最も明確な証拠は、引き続きランタイム inspect です。

  </Step>

  <Step title="Verify runtime registration">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    `--runtime` を使用して、登録済みツール、フック、サービス、Gateway メソッド、
    または Plugin 所有の CLI コマンドを証明します。通常の `inspect` は、
    コールドマニフェストとレジストリの確認にすぎません。

  </Step>
</Steps>

## 設定

### インストールソースを選択する

| ソース      | 使用する場合                                                                       | 例                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | OpenClaw ネイティブの検出、スキャン、バージョンメタデータ、インストールヒントが必要な場合 | `openclaw plugins install clawhub:<package>`                   |
| npm         | npm レジストリまたは dist-tag ワークフローを直接使う必要がある場合                             | `openclaw plugins install npm:<package>`                       |
| git         | リポジトリからブランチ、タグ、またはコミットが必要な場合                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ローカルパス  | 同じマシンで Plugin を開発またはテストしている場合                     | `openclaw plugins install --link ./my-plugin`                  |
| マーケットプレイス | Claude 互換マーケットプレイス Plugin をインストールする場合                      | `openclaw plugins install <plugin> --marketplace <source>`     |

裸のパッケージ仕様には特別な互換動作があります。バンドル済み Plugin id に一致する裸の名前は
そのバンドル済みソースを使用します。公式外部 Plugin id に一致する裸の名前は公式パッケージカタログを使用します。
それ以外の裸の仕様は、ローンチ切り替え中は npm 経由でインストールされます。バンドル済み Plugin に一致する
生の `@openclaw/*` 仕様も、npm フォールバックの前にバンドル済みコピーへ解決されます。
バンドル済みコピーではなく外部 npm パッケージを意図的にインストールするには、
`npm:@openclaw/<plugin>@<version>` を使用してください。決定的なソース選択には
`clawhub:`、`npm:`、`git:`、または `npm-pack:` を使用してください。完全なコマンド契約については
[`openclaw plugins`](/ja-JP/cli/plugins#install)を参照してください。

npm インストールでは、固定されていない仕様と `@latest` は、この OpenClaw ビルドとの互換性を
宣言している最新の安定パッケージを選択します。npm の現在の latest リリースが、このビルドでサポートされるものより新しい
`openclaw.compat.pluginApi` または `openclaw.install.minHostVersion` を宣言している場合、
OpenClaw は古い安定バージョンをスキャンし、適合する最新のものをインストールします。
正確なバージョンと `@beta` のような明示的なチャネルタグは、選択されたパッケージに固定されたままとなり、
互換性がない場合は失敗します。

### オペレーターインストールポリシー

Plugin のインストールまたは更新を進める前に、信頼済みローカルポリシーコマンドを実行するには
`security.installPolicy` を構成します。ポリシーはメタデータとステージ済みソースパスを受け取り、
インストールを許可またはブロックできます。これは CLI と Gateway バックのインストール/更新パスの両方を対象にします。
Plugin の `before_install` フックは後で実行され、Plugin フックが読み込まれた OpenClaw プロセス内でのみ実行されるため、
オペレーター所有のインストール判断には代わりに `security.installPolicy` を使用してください。
非推奨の `--dangerously-force-unsafe-install` フラグは互換性のために受け付けられますが、no-op です。
インストールポリシーや OpenClaw 組み込みの Plugin 依存関係 denylist をバイパスしません。

Skills と Plugin の両方で使用される共有 `security.installPolicy` exec スキーマについては、
[Skills 設定](/ja-JP/tools/skills-config#operator-install-policy-securityinstallpolicy)を参照してください。

### Plugin ポリシーを構成する

共通の Plugin 設定形状は次のとおりです。

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

主要なポリシールール:

- `plugins.enabled: false` はすべての Plugin を無効化し、検出/読み込み作業をスキップします。
  これが有効な間、古い Plugin 参照は不活性のままです。古い id を削除したい場合は、
  doctor cleanup を実行する前に Plugin を再有効化してください。
- `plugins.deny` は allow と Plugin ごとの有効化より優先されます。
- `plugins.allow` は排他的な allowlist です。allowlist 外の Plugin 所有ツールは、
  `tools.allow` に `"*"` が含まれていても利用できません。
- `plugins.entries.<id>.enabled: false` は、設定を保持したまま 1 つの Plugin を無効化します。
- `plugins.load.paths` は明示的なローカル Plugin ファイルまたはディレクトリを追加します。
  管理対象の `plugins install` ローカルパスは Plugin ディレクトリまたはアーカイブである必要があります。
  スタンドアロン Plugin ファイルには `plugins.load.paths` を使用してください。
- ワークスペース由来の Plugin はデフォルトで無効です。ローカルワークスペースコードを使用する前に、
  明示的に有効化するか allowlist に追加してください。
- バンドル済み Plugin は、設定で明示的に上書きされない限り、
  組み込みの default-on/default-off メタデータに従います。
- `plugins.slots.<slot>`（`memory` または `contextEngine`）は、排他的カテゴリに対して 1 つの Plugin を選択します。
  スロット選択は明示的なアクティベーションとして数えられ、その Plugin が本来 opt-in であっても、
  選択されたスロット用に強制的に有効化します。`plugins.deny` と
  `plugins.entries.<id>.enabled: false` は引き続きそれをブロックします。
- バンドル済み opt-in Plugin は、設定がその所有サーフェスのいずれかを指定した場合に自動アクティベートできます。
  たとえば、provider/model ref、チャネル設定、CLI バックエンド、またはエージェントハーネスランタイムです。
- OpenAI ファミリーの Codex ルーティングは、プロバイダーとランタイム Plugin の境界を分離したままにします。
  レガシー Codex model ref は doctor が修復するレガシー設定であり、バンドル済み `codex` Plugin は、
  正規の `openai/*` agent ref、明示的な `agentRuntime.id: "codex"`、および
  レガシー `codex/*` ref 用の Codex app-server ランタイムを所有します。

`plugins.allow` が未設定で、非バンドル Plugin がワークスペースまたはグローバル Plugin ルートから自動検出される場合、
起動ログに、検出された Plugin id と、短いリストの場合は最小限の `plugins.allow` スニペットとともに
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
が表示されます。信頼済み Plugin を `openclaw.json` にコピーする前に、列挙された Plugin id に対して
[`openclaw plugins list --enabled --verbose`](/ja-JP/cli/plugins#list) または
[`openclaw plugins inspect <id>`](/ja-JP/cli/plugins#inspect) を実行してください。
診断が Plugin が `without install/load-path provenance` で読み込まれたと示す場合にも、
同じ信頼ピン留めが適用されます。その Plugin id を inspect してから、`plugins.allow` にピン留めするか、
信頼済みソースから再インストールして OpenClaw がインストール provenance を記録できるようにしてください。

設定検証が古い Plugin id、allowlist/tool の不一致、またはレガシーのバンドル済み Plugin パスを報告する場合は、
`openclaw doctor` または `openclaw doctor --fix` を実行してください。

## Plugin 形式を理解する

OpenClaw は 2 つの Plugin 形式を認識します。

| 形式                 | 読み込み方法                                                                 | 使用する場合                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| ネイティブ OpenClaw Plugin | `openclaw.plugin.json` と、プロセス内で読み込まれるランタイムモジュール               | OpenClaw 固有のランタイム機能をインストールまたは構築している場合  |
| 互換バンドル      | Codex、Claude、または Cursor の Plugin レイアウトを OpenClaw Plugin インベントリにマッピング | 互換性のある Skills、コマンド、フック、またはバンドルメタデータを再利用する場合 |

どちらの形式も `openclaw plugins list`、`openclaw plugins inspect`、
`openclaw plugins enable`、`openclaw plugins disable` に表示されます。
バンドル互換性の境界については [Plugin バンドル](/ja-JP/plugins/bundles) を、
ネイティブ Plugin の作成については [Plugin の構築](/ja-JP/plugins/building-plugins) を参照してください。

## Plugin フック

Plugin は 2 つの異なる API を通じてランタイムでフックを登録できます。

- ランタイムライフサイクルイベント用の `api.on(...)` 型付きフック。これは、
  ミドルウェア、ポリシー、メッセージ書き換え、プロンプト整形、ツール制御に推奨されるサーフェスです。
- [フック](/ja-JP/automation/hooks)で説明されている内部フックシステム用の `api.registerHook(...)`。
  これは主に、大まかなコマンド/ライフサイクルの副作用と、既存の HOOK スタイル自動化との互換性のためのものです。

簡単なルール: ハンドラーが優先度、マージセマンティクス、またはブロック/キャンセル動作を必要とする場合は、
型付きフックを使用します。単に `command:new`、`command:reset`、`message:sent`、
または同様の大まかなイベントに反応するだけなら、`api.registerHook` で問題ありません。

Plugin 管理の内部フックは、`openclaw hooks list` に `plugin:<id>` として表示されます。
`openclaw hooks` ではそれらを有効化または無効化できません。代わりに Plugin を有効化または無効化してください。

## アクティブな Gateway を確認する

`openclaw plugins list` と通常の `openclaw plugins inspect` は、コールド設定、
マニフェスト、レジストリ状態を読み取ります。すでに実行中の Gateway が同じ Plugin コードを
インポートしていることは証明しません。

Plugin がインストール済みに見えるのに、ライブチャットトラフィックで使用されない場合:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Managed Gateways は、plugin のインストール、更新、アンインストールによって plugin ソースが変更された後に自動で再起動します。VPS またはコンテナのインストールでは、手動再起動の対象が、ラッパーやスーパーバイザーだけではなく、チャネルを提供している実際の `openclaw gateway run` 子プロセスであることを確認してください。

## トラブルシューティング

| 症状 | 確認 | 修正 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin が `plugins list` に表示されるが runtime hooks が実行されない | `openclaw plugins inspect <id> --runtime --json` を使用し、`gateway status --deep --require-rpc` でアクティブな Gateway を確認する | インストール、更新、config、またはソース変更後に稼働中の Gateway を再起動する |
| 重複するチャネルまたはツール所有権の診断が表示される | `openclaw plugins list --enabled --verbose` を実行し、疑わしい各 plugin を `--runtime --json` で調べ、チャネル/ツールの所有権を比較する | 片方の所有者を無効化する、古いインストールを削除する、または意図的な置き換えには manifest `preferOver` を使用する |
| config が plugin 不足を示している | [Plugin inventory](/ja-JP/plugins/plugin-inventory) で、bundled、公式 external、または source-only のどれかを確認する | external package をインストールする、bundled plugin を有効化する、または古い config を削除する |
| インストール中に config が無効になる | 検証メッセージを読み、古い plugin 状態を指している場合は `openclaw doctor --fix` を実行する | Doctor は、エントリを無効化して無効なペイロードを削除することで、無効な plugin config を隔離できる |
| plugin パスが不審な所有権または権限でブロックされる | config エラーの前にある診断を確認する | ファイルシステムの所有権/権限を修正してから、`openclaw plugins registry --refresh` を実行する |
| `OPENCLAW_NIX_MODE=1` がライフサイクルコマンドをブロックする | インストールが Nix によって管理されていることを確認する | plugin mutator コマンドを使用する代わりに、Nix ソースで plugin 選択を変更する |
| 依存関係の import が実行時に失敗する | plugin が npm/git/ClawHub 経由でインストールされたか、local path から読み込まれたかを確認する | `openclaw plugins update <id>` を実行する、ソースを再インストールする、または local plugin の依存関係を自分でインストールする |

古い plugin config が、すでに検出できなくなったチャネル plugin をまだ指している場合、config 検証はそのチャネルキーをハードエラーではなく警告に降格するため、Gateway 起動は他のすべてのチャネルを引き続き提供できます。古い plugin とチャネルのエントリを削除するには `openclaw doctor --fix` を実行してください。古い plugin の証拠がない不明なチャネルキーは引き続き検証に失敗するため、入力ミスは見える状態のままになります。

意図的なチャネル置き換えでは、優先する plugin は `channelConfigs.<channel-id>.preferOver` に legacy または低優先度の plugin id を宣言する必要があります。両方の plugin が明示的に有効化されている場合、OpenClaw はその要求を保持し、所有者を暗黙に一方へ選ぶのではなく、重複するチャネル/ツール診断を報告します。

インストール済み package が `requires compiled runtime output for TypeScript entry ...` と報告する場合、その package は OpenClaw が実行時に必要とする JavaScript ファイルなしで公開されています。公開者がコンパイル済み JavaScript を出荷した後に更新または再インストールするか、それまで plugin を無効化/アンインストールしてください。

### ブロックされた plugin パス所有権

診断で
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
と表示され、その後の検証で `plugin present but blocked` と続く場合、OpenClaw は、それを読み込むプロセスとは異なる Unix ユーザーが所有する plugin ファイルを検出しています。plugin config はそのままにしてください。ファイルシステムの所有権を修正するか、state ディレクトリを所有している同じユーザーとして OpenClaw を実行してください。

Docker インストールでは、公式イメージは `node` (uid `1000`) として実行されるため、ホストに bind mount された OpenClaw config と workspace ディレクトリは通常 uid `1000` が所有している必要があります。

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

意図的に OpenClaw を root として実行している場合は、managed plugin ルートを root 所有権に修復してください。

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

所有権を修正した後、永続化された plugin registry が修復済みファイルと一致するように、`openclaw doctor --fix` または
`openclaw plugins registry --refresh` を再実行してください。

### 遅い plugin ツールセットアップ

agent ターンがツール準備中に停止しているように見える場合は、trace ログを有効化し、plugin tool factory のタイミング行を確認してください。

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

次を探してください。

```text
[trace:plugin-tools] factory timings ...
```

サマリーには、合計 factory 時間と最も遅い plugin tool factories が一覧表示され、plugin id、宣言された tool 名、結果の形、tool が optional かどうかが含まれます。単一の factory が 1 秒以上かかる場合、または plugin tool factory prep の合計が 5 秒以上かかる場合、遅い行は warnings に昇格されます。

OpenClaw は、同じ effective request context で繰り返し解決する場合、成功した plugin tool factory の結果をキャッシュします。キャッシュキーには、effective runtime config、workspace と agent id、sandbox policy、browser settings、delivery context、requester identity、ownership state が含まれるため、これらの trusted fields に依存する factories は context が変わると再実行されます。タイミングが高いままの場合、その plugin は tool definitions を返す前に高コストな処理を行っている可能性があります。

1 つの plugin がタイミングの大半を占める場合は、その runtime registrations を調べてください。

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

その後、その plugin を更新、再インストール、または無効化してください。Plugin authors は、tool factory の内部で行うのではなく、高コストな dependency loading を tool execution path の後ろに移す必要があります。

依存関係ルート、package metadata validation、registry records、startup reload behavior、legacy cleanup については、[Plugin dependency resolution](/ja-JP/plugins/dependency-resolution) を参照してください。

## 関連

- [Manage plugins](/ja-JP/plugins/manage-plugins) - list、install、update、uninstall、publish のコマンド例
- [`openclaw plugins`](/ja-JP/cli/plugins) - 完全な CLI リファレンス
- [Plugin inventory](/ja-JP/plugins/plugin-inventory) - 生成された bundled および external plugin 一覧
- [Plugin reference](/ja-JP/plugins/reference) - 生成された plugin ごとのリファレンスページ
- [Community plugins](/ja-JP/plugins/community) - ClawHub discovery と docs PR policy
- [Plugin dependency resolution](/ja-JP/plugins/dependency-resolution) - install roots、registry records、runtime boundaries
- [Building plugins](/ja-JP/plugins/building-plugins) - native plugin authoring guide
- [Plugin SDK overview](/ja-JP/plugins/sdk-overview) - runtime registration、hooks、API fields
- [Plugin manifest](/ja-JP/plugins/manifest) - manifest と package metadata
