---
read_when:
    - Codex モードの OpenClaw エージェントでネイティブ Codex プラグインを使用したい
    - ソースからインストールされた、OpenAI がキュレーションした Codex Plugin を移行しています
    - codexPlugins、アプリインベントリ、破壊的アクション、またはPluginアプリ診断のトラブルシューティングを行っている
summary: Codex モードの OpenClaw エージェント向けに移行済みネイティブ Codex Plugin を設定する
title: ネイティブ Codex プラグイン
x-i18n:
    generated_at: "2026-07-06T21:50:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5155cef2ed71ce6f9d8a4a38b98abc36cb72383ec60e1978fb145dfc32cf322
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

ネイティブ Codex Plugin サポートにより、Codex モードの OpenClaw エージェントは、OpenClaw ターンを処理する同じ Codex スレッド内で、Codex app-server 独自のアプリおよび Plugin 機能を使用できます。Plugin 呼び出しはネイティブ Codex transcript 内に残ります。アプリ支援の MCP 実行は Codex app-server が所有します。OpenClaw は Codex Plugin を合成 `codex_plugin_*` OpenClaw 動的ツールへ変換しません。

ベースの [Codex harness](/ja-JP/plugins/codex-harness) が動作した後に、このページを使用してください。

## 要件

- エージェントランタイムはネイティブ Codex harness である必要があります。
- `plugins.entries.codex.enabled` が `true` であること。
- `plugins.entries.codex.config.codexPlugins.enabled` が `true` であること。
- 対象の Codex app-server から、期待される marketplace、Plugin、アプリ inventory が見えること。
- V1 は、migration がソース Codex home で source-installed として観測した `openai-curated` Plugin のみをサポートします。

`codexPlugins` は OpenClaw-provider 実行、ACP conversation binding、その他の harness には効果がありません。これらの経路ではネイティブ `apps` config を持つ Codex app-server スレッドが作成されないためです。

OpenAI 側の Codex アカウント、アプリの可用性、workspace のアプリ/Plugin 制御は、サインイン中の Codex アカウントから取得されます。OpenAI アカウントと管理モデルについては、[ChatGPT プランで Codex を使用する](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) を参照してください。

## クイックスタート

ソース Codex home から migration をプレビューします。

```bash
openclaw migrate codex --dry-run
```

`--verify-plugin-apps` を追加すると、migration がソース `app/list` を呼び出し、ネイティブ有効化を計画する前に、所有されているすべてのアプリが存在し、有効で、アクセス可能であることを要求します。

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

計画が適切に見えたら migration を適用します。

```bash
openclaw migrate apply codex --yes
```

Migration は、対象 Plugin に対して明示的な `codexPlugins` エントリを書き込み、選択された Plugin に対して Codex app-server `plugin/install` を呼び出します。移行後の config は次のようになります。

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

`codexPlugins` の変更後、新しい Codex conversation は更新されたアプリセットを自動的に取得します。現在の conversation を更新するには `/new` または `/reset` を実行します。Plugin の有効化/無効化の変更に Gateway の再起動は不要です。

## チャットから Plugin を管理する

`/codex plugins` は、Codex harness を操作している同じチャットから、設定済みのネイティブ Codex Plugin を検査または変更します。

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` は `/codex plugins list` のエイリアスです。一覧には、`plugins.entries.codex.config.codexPlugins.plugins` にある各設定済み Plugin のキー、オン/オフ状態、Codex Plugin 名、marketplace が表示されます。

`enable`/`disable` は `~/.openclaw/openclaw.json` にのみ書き込みます。`~/.codex/config.toml` を編集したり、新しい Codex Plugin をインストールしたりすることはありません。実行できるのは owner、または `operator.admin` scope を持つ Gateway クライアントのみです。

設定済み Plugin を有効にすると、グローバルな `codexPlugins.enabled` スイッチもオンになります。migration が `auth_required` を返したため Plugin が無効として書き込まれていた場合は、OpenClaw で有効にする前に Codex でアプリを再認可してください。

## ネイティブ Plugin セットアップの仕組み

この integration は 3 つの状態を追跡します。

| 状態      | 意味                                                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| インストール済み  | Codex が対象 app-server ランタイム内にローカル Plugin bundle を持っています。                                                              |
| 有効    | OpenClaw config が Codex harness ターンでその Plugin を許可しています。                                                                       |
| アクセス可能 | Codex app-server が、その Plugin のアプリエントリがアクティブなアカウントで利用可能であり、移行済み Plugin identity に対応していることを確認します。 |

Migration は永続的なインストール/適格性ステップです。

- 計画中、OpenClaw はソース Codex `plugin/read` の詳細を読み取り、ソース Codex app-server アカウントが ChatGPT subscription アカウントであることを確認します。ChatGPT ではないアカウント、またはアカウント応答がない場合、アプリ支援 Plugin は `codex_subscription_required` でスキップされます。
- デフォルトでは、migration はソース `app/list` 呼び出しをスキップします。アカウントゲートを通過したアプリ支援ソース Plugin は、ソースアプリのアクセシビリティ検証なしで計画され、アカウント検索の transport 失敗は `codex_account_unavailable` でスキップされます。
- `--verify-plugin-apps` を指定すると、migration は新しいソース `app/list` snapshot を取得し、ネイティブ有効化を計画する前に、所有されているすべてのアプリが存在し、有効で、アクセス可能であることを要求します。この場合、アカウント検索の transport 失敗は即時スキップではなく、ソースアプリ inventory ゲートへフォールスルーします。

ランタイムアプリ inventory は、migration 後に実行される対象セッションのアクセシビリティチェックです。Codex harness のセッションセットアップは、有効かつアクセス可能な Plugin アプリから制限的なスレッドアプリ config を計算します。これはターンごとには再計算されないため、`/codex plugins enable`/`disable` は新しい Codex conversation にのみ影響します。現在の conversation に変更を反映するには `/new` または `/reset` を使用してください。

## V1 サポート境界

- ソース Codex app-server inventory にすでにインストールされている `openai-curated` Plugin のみが migration 対象です。
- アプリ支援ソース Plugin は、migration 時の subscription ゲートを通過する必要があります。`--verify-plugin-apps` はソースアプリ inventory ゲートを追加します。Subscription ゲート対象のアカウント、および検証モードでアクセス不可/無効/欠落しているソースアプリやアプリ inventory refresh 失敗は、有効な config エントリではなく、スキップされた手動 item として報告されます。読み取り不能な Plugin 詳細は、アプリ inventory ゲートの前にスキップされます。
- Migration は明示的な Plugin identity（`marketplaceName` と `pluginName`）を書き込みます。ローカル `marketplacePath` cache path は書き込みません。
- `codexPlugins.enabled` は唯一のグローバル有効化スイッチです。任意のインストール権限を付与する `plugins["*"]` wildcard や config key はありません。
- サポート外の marketplace、cached Plugin bundle、hook、Codex config ファイルは、手動 review 用に migration report に保持され、自動的には有効化されません。

## アプリ inventory と ownership

OpenClaw は app-server `app/list` を通じて Codex アプリ inventory を読み取り、1 時間メモリ内にキャッシュし、古いエントリや欠落したエントリを非同期に refresh します。この cache は process-local です。CLI または Gateway を再起動すると破棄され、OpenClaw は次回の `app/list` 読み取りから再構築します。

Migration とランタイムは別々の cache key を使用します。

- ソース migration 検証は、ソース Codex home と start option を使用します。これは `--verify-plugin-apps` を指定した場合にのみ実行され、その計画実行のために新しいソース `app/list` traversal を強制します。
- 対象ランタイムセットアップは、スレッドアプリ config を構築するときに、対象エージェントの Codex app-server identity を使用します。Plugin 有効化はその対象 cache key を invalidation し、その後 `plugin/install` の後で強制 refresh します。

Plugin アプリは、OpenClaw が安定した ownership を通じて移行済み Plugin に対応付けできる場合にのみ公開されます。つまり、Plugin 詳細からの完全一致する app id、既知の MCP server name、または一意で安定した metadata です。表示名のみ、または曖昧な ownership は、次の inventory refresh で ownership が証明されるまで除外されます。

## 接続済みアカウントアプリ

Owner が運用するエージェントは、一致する Plugin package を要求せずに、Codex アカウントにすでに接続されているすべてのアプリへ opt in できます。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
          },
        },
      },
    },
  },
}
```

`allow_all_plugins: true` は、新しいネイティブ Codex スレッドが確立されるときに完全な `app/list` snapshot を取得し、そのアカウントでアクセス可能とマークされているアプリのみを認めます。アプリをグローバルにインストール、認証、または有効化することはありません。既存のスレッドは永続化されたアプリセットを保持します。新しく接続または取り消されたアプリを反映するには、`/new`、`/reset`、または Gateway の再起動を使用してください。

アカウントアプリはグローバルな `codexPlugins.allow_destructive_actions` 値を継承します。この値は `true`、`false`、`"auto"`、または `"ask"` を受け付けます。明示的な Plugin ごとの policy は、重複する app id についてグローバル policy を上書きします。Inventory 失敗時は、制限のないデフォルトへフォールバックせず fail closed します。

## スレッドアプリ config

OpenClaw は Codex スレッドに制限的な `config.apps` patch を注入します。`_default` は無効化され、有効な移行済み Plugin が所有するアプリ、または `allow_all_plugins` によって認められたアクセス可能なアカウントアプリのみが有効化されます。

各アプリの `destructive_enabled` は、有効なグローバルまたは Plugin ごとの `allow_destructive_actions` policy から取得されます。`true`、`"auto"`、`"ask"` はすべて `destructive_enabled: true` を設定し、`false` は `false` を設定します。Codex は引き続き、ネイティブアプリツール annotation から destructive tool metadata を強制します。`_default` は `open_world_enabled: false` で無効化されます。有効な Plugin アプリには `open_world_enabled: true` が設定されます。OpenClaw は別個の Plugin レベル open-world policy knob を公開せず、Plugin ごとの destructive tool-name deny list も維持しません。

Tool approval mode は、認められたアプリに対してデフォルトで自動になるため、非破壊の read tool は同一スレッドの approval prompt なしで実行されます。Destructive tool は、各アプリの `destructive_enabled` policy によって引き続き制御されます。

## 破壊的操作 policy

移行済み Codex Plugin では destructive Plugin elicitation はデフォルトで許可されますが、安全でない schema と曖昧な ownership は fail closed します。

- グローバル `allow_destructive_actions` のデフォルトは `true` です。
- Plugin ごとの `allow_destructive_actions` は、その Plugin についてグローバル policy を上書きします。
- `false`: OpenClaw は決定的な decline を返します。
- `true`: OpenClaw は、boolean approve field など、approval response に対応付けできる安全な schema のみを自動承認します。
- `"auto"`: OpenClaw は destructive Plugin action を Codex に公開し、その後 ownership が証明された MCP approval elicitation を OpenClaw Plugin approval に変換してから Codex approval response を返します。
- `"ask"`: OpenClaw は `"auto"` と同じ Codex write/destructive gating を使用し、スレッド開始前にそのアプリの永続的な Codex per-tool approval override をクリアし、durable approval が後続の write-action prompt を抑制できないように、1 回限りの approval または denial のみを提供します。`"ask"` を使用する認められた各アプリについて、OpenClaw はそのアプリの Codex human approvals reviewer を選択し、Codex が approval elicitation を OpenClaw に送信するようにします。その他のアプリと非アプリのスレッド approval は、設定済み reviewer と policy を維持します。
- Plugin identity の欠落、曖昧な ownership、turn id の欠落または不一致、または安全でない elicitation schema は、prompt ではなく decline します。

## トラブルシューティング

| コード                                            | 意味                                                                                                                                 | 修正                                                                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | 移行により Plugin はインストールされましたが、そのアプリの 1 つでまだ認証が必要です。再認可するまで、項目は無効として書き込まれます。 | Codex でアプリを再認可し、その後 OpenClaw で Plugin を有効にします。                                                   |
| `app_inaccessible`, `app_disabled`, `app_missing` | `--verify-plugin-apps` を指定した場合、ソース Codex アプリインベントリで、所有アプリがすべて存在し、有効で、アクセス可能とは示されませんでした。 | Codex でアプリを再認可または有効化し、その後 `--verify-plugin-apps` を指定して移行を再実行します。                     |
| `app_inventory_unavailable`                       | 厳密なソースアプリ検証が要求されましたが、ソース Codex アプリインベントリの更新に失敗しました。                                     | ソース Codex アプリサーバーへのアクセスを修正するか、`--verify-plugin-apps` なしで再試行して、より高速なアカウントゲート付きプランを受け入れます。 |
| `codex_subscription_required`                     | ソース Codex アプリサーバーのアカウントが ChatGPT サブスクリプションアカウントではありませんでした。                                 | サブスクリプション認証で Codex アプリにログインし、その後移行を再実行します。                                           |
| `codex_account_unavailable`                       | ソース Codex アプリサーバーのアカウントを読み取れませんでした。                                                                       | ソース Codex アプリサーバー認証を修正するか、`--verify-plugin-apps` を指定して再実行し、ソースアプリインベントリに適格性を判断させます。 |
| `marketplace_missing`, `plugin_missing`           | ターゲット Codex アプリサーバーから、想定される `openai-curated` マーケットプレイスまたは Plugin が見えません。                       | ターゲットランタイムに対して移行を再実行するか、Codex アプリサーバーの Plugin 状態を調査します。                       |
| `app_inventory_missing`, `app_inventory_stale`    | アプリの準備状態が、空または古いキャッシュから取得されました。                                                                       | OpenClaw は非同期更新を自動的にスケジュールします。Plugin アプリは、所有権と準備状態が判明するまで除外されたままです。 |
| `app_ownership_ambiguous`                         | アプリインベントリは表示名だけで一致しました。                                                                                       | 後の更新で所有権が証明されるまで、そのアプリは Codex スレッドから非表示のままです。                                   |

**設定を変更したが、エージェントから Plugin が見えない場合:** `/codex plugins
list` を実行して設定済みの状態を確認し、その後 `/new` または `/reset` を実行します。既存の
Codex スレッドバインディングは、OpenClaw が新しいハーネスセッションを確立するか、古いバインディングを置き換えるまで、開始時のアプリ設定を保持します。

**破壊的操作が拒否される場合:** グローバルおよび Plugin ごとの
`allow_destructive_actions` 値を確認します。`true`、`"auto"`、または `"ask"` であっても、
安全でない elicitation スキーマやあいまいな Plugin ID はフェイルクローズします。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#codex-harness-plugin-config)
- [移行 CLI](/ja-JP/cli/migrate)
