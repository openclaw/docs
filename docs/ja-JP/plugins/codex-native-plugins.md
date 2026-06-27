---
read_when:
    - Codex モードの OpenClaw エージェントでネイティブ Codex Plugin を使用したい
    - openai がキュレーションしたソースインストール済み Codex plugins を移行しています
    - codexPlugins、アプリインベントリ、破壊的操作、または Plugin アプリ診断のトラブルシューティングをしています
summary: CodexモードのOpenClawエージェント向けに移行済みネイティブCodex Pluginを構成する
title: ネイティブ Codex Plugin
x-i18n:
    generated_at: "2026-06-27T12:14:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d8eb7ca7c10db5220c49426f5e9db5992ee751d48b2ac8c89e93773fc87776
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

ネイティブ Codex Plugin サポートにより、Codex モードの OpenClaw エージェントは、OpenClaw ターンを処理する同じ Codex スレッド内で、Codex
app-server 独自のアプリと Plugin 機能を使用できます。

OpenClaw は Codex Plugin を合成 `codex_plugin_*`
OpenClaw 動的ツールに変換しません。Plugin 呼び出しはネイティブ Codex トランスクリプト内に残り、
Codex app-server がアプリに裏付けられた MCP 実行を所有します。

ベースの [Codex ハーネス](/ja-JP/plugins/codex-harness) が動作してから、このページを使用してください。

## 要件

- 選択した OpenClaw エージェントランタイムはネイティブ Codex ハーネスである必要があります。
- `plugins.entries.codex.enabled` は true である必要があります。
- `plugins.entries.codex.config.codexPlugins.enabled` は true である必要があります。
- V1 は、移行がソース Codex ホームでソースインストール済みとして確認した
  `openai-curated` Plugin のみをサポートします。
- ターゲットの Codex app-server は、想定されるマーケットプレイス、
  Plugin、アプリインベントリを参照できる必要があります。

`codexPlugins` は、OpenClaw 実行、通常の OpenAI provider 実行、ACP
会話バインディング、またはその他のハーネスには影響しません。これらの経路ではネイティブ `apps` config を持つ
Codex app-server スレッドを作成しないためです。

OpenAI 側の Codex アクセス、アプリの可用性、ワークスペースのアプリ/Plugin 制御は、サインイン済みの Codex アカウントに由来します。OpenAI アカウントと管理モデルについては、[ChatGPT プランで Codex を使用する](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)を参照してください。

## クイックスタート

ソース Codex ホームからの移行をプレビューします。

```bash
openclaw migrate codex --dry-run
```

ネイティブ Plugin の有効化を計画する前に、移行でソースアプリのアクセス可能性を確認したい場合は、厳密なソースアプリ検証を使用します。

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

計画が正しそうであれば移行を適用します。

```bash
openclaw migrate apply codex --yes
```

移行は、対象となる Plugin に明示的な `codexPlugins` エントリを書き込み、選択した Plugin に対して
Codex app-server `plugin/install` を呼び出します。典型的な移行済み
config は次のようになります。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

`codexPlugins` を変更すると、新しい Codex 会話は更新されたアプリセットを自動的に取り込みます。現在の会話を更新するには `/new` または `/reset` を使用します。
Plugin の有効化または無効化の変更に Gateway の再起動は不要です。

## チャットから Plugin を管理

Codex ハーネスを操作している同じチャットから、設定済みのネイティブ Codex
Plugin を確認または変更したい場合は、`/codex plugins` を使用します。

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` は `/codex plugins list` のエイリアスです。リスト出力には、
`plugins.entries.codex.config.codexPlugins.plugins` から、設定済みの Plugin キー、オン/オフ状態、Codex Plugin 名、マーケットプレイスが表示されます。

`enable` と `disable` は `~/.openclaw/openclaw.json` の OpenClaw config にのみ書き込みます。`~/.codex/config.toml` を編集したり、新しい Codex Plugin をインストールしたりはしません。Plugin の状態を変更できるのは、所有者または
`operator.admin` スコープを持つ Gateway クライアントのみです。

設定済み Plugin を有効化すると、グローバルな
`codexPlugins.enabled` スイッチもオンになります。移行が `auth_required` を返したために Plugin が無効として書き込まれていた場合は、OpenClaw で有効化する前に Codex でアプリを再認可してください。

## ネイティブ Plugin セットアップの仕組み

この統合には 3 つの別々の状態があります。

- インストール済み: Codex はターゲット app-server ランタイムにローカル Plugin バンドルを持っています。
- 有効: OpenClaw config は、その Plugin を Codex ハーネスのターンで利用可能にすることを許可しています。
- アクセス可能: Codex app-server は、Plugin のアプリエントリがアクティブなアカウントで利用可能であり、移行済み Plugin ID にマッピングできることを確認しています。

移行は、永続的なインストール/適格性確認のステップです。計画中、OpenClaw はソース Codex の `plugin/read` 詳細を読み取り、ソース Codex
app-server アカウント応答が ChatGPT サブスクリプションアカウントであることを確認します。ChatGPT ではない、またはアカウント応答がない場合、アプリに裏付けられた Plugin は
`codex_subscription_required` としてスキップされます。デフォルトでは、移行はソース
`app/list` を呼び出しません。アカウントゲートを通過したアプリに裏付けられたソース Plugin は、ソースアプリのアクセス可能性検証なしで計画され、アカウント検索のトランスポート失敗は
`codex_account_unavailable` としてスキップされます。`--verify-plugin-apps` を指定すると、移行は新しいソース `app/list` スナップショットを取得し、ネイティブ有効化を計画する前に、所有されているすべてのアプリが存在し、有効で、アクセス可能であることを要求します。そのモードでは、アカウント検索のトランスポート失敗はソース
アプリインベントリゲートにフォールスルーします。ランタイムアプリインベントリは、移行後のターゲットセッションのアクセス可能性チェックです。その後、Codex ハーネスのセッションセットアップは、有効でアクセス可能な Plugin アプリ用の制限的なスレッドアプリ config を計算します。

スレッドアプリ config は、OpenClaw が Codex ハーネスセッションを確立するか、古くなった Codex スレッドバインディングを置き換えるときに計算されます。ターンごとには再計算されないため、
`/codex plugins enable` と `/codex plugins disable` は新しい Codex
会話に影響します。現在の会話に更新されたアプリセットを取り込ませたい場合は、`/new` または `/reset` を使用します。

## V1 サポート境界

V1 は意図的に狭くしています。

- ソース Codex app-server インベントリにすでにインストールされていた `openai-curated` Plugin のみが移行対象です。
- アプリに裏付けられたソース Plugin は、移行時のサブスクリプションゲートを通過する必要があります。
  `--verify-plugin-apps` はソースアプリインベントリゲートを追加します。サブスクリプションでゲートされたアカウント、および検証モードではアクセス不能、無効、欠落しているソースアプリやソースアプリインベントリ更新失敗は、有効な config エントリではなく、スキップされた手動項目として報告されます。読み取れない Plugin 詳細は、ソースアプリインベントリゲートの前にスキップされます。
- 移行は `marketplaceName` と
  `pluginName` を持つ明示的な Plugin ID を書き込みます。ローカル `marketplacePath` キャッシュパスは書き込みません。
- `codexPlugins.enabled` はグローバルな有効化スイッチです。
- `plugins["*"]` ワイルドカードはなく、任意のインストール権限を付与する config キーもありません。
- サポートされないマーケットプレイス、キャッシュ済み Plugin バンドル、フック、Codex config ファイルは、手動レビュー用に移行レポートに保持されます。

## アプリインベントリと所有権

OpenClaw は app-server `app/list` を通じて Codex アプリインベントリを読み取り、1 時間キャッシュし、古いエントリまたは欠落したエントリを非同期で更新します。キャッシュはメモリ内のみです。CLI または Gateway を再起動すると破棄され、OpenClaw は次の `app/list` 読み取りから再構築します。

移行とランタイムは別々のキャッシュキーを使用します。

- ソース移行検証は、ソース Codex ホームとソース app-server
  開始オプションを使用します。これは `--verify-plugin-apps` が設定されている場合にのみ実行され、その計画実行のために新しいソース `app/list` 走査を強制します。
- ターゲットランタイムセットアップは、Codex スレッドアプリ config を構築するときに、ターゲットエージェントの Codex app-server ID を使用します。Plugin 有効化はそのターゲットキャッシュキーを無効化し、`plugin/install` 後に強制更新します。

Plugin アプリは、OpenClaw が安定した所有権を通じて移行済み
Plugin にマッピングできる場合にのみ公開されます。

- Plugin 詳細の正確なアプリ id
- 既知の MCP サーバー名
- 一意で安定したメタデータ

表示名のみ、または曖昧な所有権は、次のインベントリ更新で所有権が証明されるまで除外されます。

## スレッドアプリ config

OpenClaw は Codex スレッドに制限的な `config.apps` パッチを注入します。
`_default` は無効化され、有効な移行済み Plugin が所有するアプリのみが有効化されます。

OpenClaw は、有効なグローバルまたは Plugin ごとの `allow_destructive_actions` ポリシーからアプリレベルの `destructive_enabled` を設定し、Codex がネイティブアプリツール注釈から破壊的ツールメタデータを適用できるようにします。`true`、
`"auto"`、`"always"` は `destructive_enabled: true` を設定し、`false` は false に設定します。`_default` アプリ config は `open_world_enabled: false` で無効化されます。
有効な Plugin アプリは `open_world_enabled: true` で出力されます。OpenClaw は個別の Plugin オープンワールドポリシーノブを公開せず、Plugin ごとの破壊的ツール名の拒否リストも維持しません。

Plugin アプリのツール承認モードはデフォルトで自動であるため、非破壊的な読み取りツールは同一スレッドの承認 UI なしで実行できます。破壊的ツールは引き続き、各アプリの `destructive_enabled` ポリシーによって制御されます。

## 破壊的アクションポリシー

移行済み Codex Plugin では、破壊的な Plugin elicitation はデフォルトで許可されますが、安全でないスキーマと曖昧な所有権は引き続き fail closed になります。

- グローバルな `allow_destructive_actions` はデフォルトで `true` です。
- Plugin ごとの `allow_destructive_actions` は、その Plugin のグローバルポリシーを上書きします。
- ポリシーが `false` の場合、OpenClaw は決定的な拒否を返します。
- ポリシーが `true` の場合、OpenClaw は、boolean approve フィールドなど、承認応答にマッピングできる安全なスキーマのみを自動承認します。
- ポリシーが `"auto"` の場合、OpenClaw は破壊的な Plugin アクションを
  Codex に公開しますが、所有権が証明された MCP 承認 elicitation を OpenClaw
  Plugin 承認に変換してから Codex 承認応答を返します。
- ポリシーが `"always"` の場合、OpenClaw は `"auto"` と同じ Codex 書き込み/破壊的ゲートを使用し、スレッド開始前にそのアプリの永続的な Codex ツールごとの承認上書きをクリアし、永続的な承認が後続の書き込みアクションプロンプトを抑制できないように、1 回限りの承認または拒否のみを提示します。
- Plugin ID の欠落、曖昧な所有権、ターン id の欠落、誤ったターン
  id、または安全でない elicitation スキーマは、プロンプトを出す代わりに拒否します。

## トラブルシューティング

**`auth_required`:** 移行は Plugin をインストールしましたが、そのアプリの 1 つがまだ認証を必要としています。再認可して有効化するまで、明示的な Plugin エントリは無効として書き込まれます。

**`app_inaccessible`, `app_disabled`, または `app_missing`:**
`--verify-plugin-apps` が設定されている間に、ソース Codex アプリインベントリが、所有されているすべてのアプリを存在、有効、アクセス可能として示さなかったため、移行は Plugin をインストールしませんでした。Codex でアプリを再認可または有効化してから、
`--verify-plugin-apps` を付けて移行を再実行してください。

**`app_inventory_unavailable`:** 厳密なソースアプリ検証が要求され、ソース Codex アプリインベントリ更新が失敗したため、移行は Plugin をインストールしませんでした。ソース Codex app-server アクセスを修正するか、より高速なアカウントゲート計画を受け入れる場合は
`--verify-plugin-apps` なしで再試行してください。

**`codex_subscription_required`:** ソース Codex app-server アカウントが
ChatGPT サブスクリプションアカウントでログインしていなかったため、移行はアプリに裏付けられた
Plugin をインストールしませんでした。サブスクリプション認証で Codex アプリにログインしてから、移行を再実行してください。

**`codex_account_unavailable`:** ソース Codex app-server アカウントを読み取れなかったため、移行はアプリに裏付けられた Plugin をインストールしませんでした。ソース Codex
app-server 認証を修正するか、アカウント検索が失敗したときにソースアプリインベントリで適格性を判断したい場合は `--verify-plugin-apps` を付けて再実行してください。

**`marketplace_missing` または `plugin_missing`:** ターゲット Codex app-server が、想定される `openai-curated` マーケットプレイスまたは Plugin を参照できません。ターゲットランタイムに対して移行を再実行するか、Codex app-server の Plugin 状態を確認してください。

**`app_inventory_missing` または `app_inventory_stale`:** アプリ準備状態は空または古いキャッシュから取得されました。OpenClaw は非同期更新をスケジュールし、所有権と準備状態が判明するまで Plugin アプリを除外します。

**`app_ownership_ambiguous`:** アプリインベントリは表示名だけで一致したため、そのアプリは Codex スレッドに公開されません。

**Config は変更されたがエージェントが Plugin を参照できない:** `/codex plugins
list` を使用して設定状態を確認し、その後 `/new` または `/reset` を使用します。既存の
Codex スレッドバインディングは、OpenClaw が新しいハーネスセッションを確立するか古くなったバインディングを置き換えるまで、開始時のアプリ config を保持します。

**破壊的アクションが拒否される:** グローバルおよび Plugin ごとの
`allow_destructive_actions` 値を確認してください。ポリシーが true、`"auto"`、または
`"always"` であっても、安全でない elicitation スキーマや曖昧な Plugin ID は引き続き
フェイルクローズします。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [構成リファレンス](/ja-JP/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI の移行](/ja-JP/cli/migrate)
