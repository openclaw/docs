---
read_when:
    - Codex モードの OpenClaw エージェントにネイティブ Codex プラグインを使用させたい
    - ソースからインストールされた openai-curated Codex plugins を移行しています
    - codexPlugins、アプリインベントリ、破壊的アクション、または Plugin アプリ診断のトラブルシューティングを行っている
summary: Codexモードの OpenClaw エージェント向けに移行済みのネイティブ Codex Plugin を設定する
title: ネイティブ Codex Plugin
x-i18n:
    generated_at: "2026-07-05T11:37:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd3e810380b99bb3fffd07eeeeb7bb41583951d4acc4ee28b30c74d27f854148
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

ネイティブ Codex プラグインサポートにより、Codex モードの OpenClaw エージェントは、OpenClaw ターンを処理する同じ Codex スレッド内で、Codex
app-server 自身のアプリとプラグイン機能を使用できます。プラグイン呼び出しはネイティブ Codex トランスクリプト内に留まり、
Codex app-server がアプリに裏付けられた MCP 実行を所有します。OpenClaw は Codex プラグインを合成的な `codex_plugin_*` OpenClaw 動的ツールに変換しません。

ベースの [Codex ハーネス](/ja-JP/plugins/codex-harness) が動作した後に、このページを使用してください。

## 要件

- エージェントランタイムはネイティブ Codex ハーネスである必要があります。
- `plugins.entries.codex.enabled` は `true` です。
- `plugins.entries.codex.config.codexPlugins.enabled` は `true` です。
- 対象の Codex app-server は、想定されるマーケットプレイス、プラグイン、アプリのインベントリを確認できる必要があります。
- V1 は、移行でソース Codex ホームにソースインストール済みとして検出された `openai-curated` プラグインのみをサポートします。

`codexPlugins` は OpenClaw プロバイダー実行、ACP 会話バインディング、その他のハーネスには影響しません。これらのパスは、ネイティブ `apps` 設定を持つ Codex app-server スレッドを作成しないためです。

OpenAI 側の Codex アカウント、アプリの可用性、ワークスペースのアプリ/プラグイン制御は、サインイン済みの Codex アカウントに由来します。OpenAI アカウントと管理モデルについては、[ChatGPT プランで Codex を使用する](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)を参照してください。

## クイックスタート

ソース Codex ホームからの移行をプレビューします。

```bash
openclaw migrate codex --dry-run
```

移行でソース `app/list` を呼び出し、ネイティブ有効化を計画する前に、所有するすべてのアプリが存在し、有効で、アクセス可能であることを要求するには、`--verify-plugin-apps` を追加します。

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

計画が適切に見えたら移行を適用します。

```bash
openclaw migrate apply codex --yes
```

移行は、対象プラグインの明示的な `codexPlugins` エントリを書き込み、選択したプラグインに対して Codex app-server `plugin/install` を呼び出します。移行済み設定は次のようになります。

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

`codexPlugins` の変更後、新しい Codex 会話は更新されたアプリセットを自動的に取得します。現在の会話を更新するには `/new` または `/reset` を実行します。プラグインの有効化/無効化の変更に Gateway の再起動は不要です。

## チャットからプラグインを管理する

`/codex plugins` は、Codex ハーネスを操作している同じチャットから、設定済みのネイティブ Codex プラグインを検査または変更します。

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` は `/codex plugins list` のエイリアスです。一覧には、`plugins.entries.codex.config.codexPlugins.plugins` から、設定済み各プラグインのキー、オン/オフ状態、Codex プラグイン名、マーケットプレイスが表示されます。

`enable`/`disable` は `~/.openclaw/openclaw.json` にのみ書き込みます。`~/.codex/config.toml` を編集したり、新しい Codex プラグインをインストールしたりすることはありません。実行できるのは所有者、または `operator.admin` スコープを持つ Gateway クライアントのみです。

設定済みプラグインを有効にすると、グローバルな `codexPlugins.enabled` スイッチもオンになります。移行が `auth_required` を返したためにプラグインが無効として書き込まれていた場合は、OpenClaw で有効にする前に Codex でアプリを再認可してください。

## ネイティブプラグイン設定の仕組み

この統合は 3 つの状態を追跡します。

| 状態 | 意味 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| インストール済み | Codex が対象 app-server ランタイム内にローカルプラグインバンドルを持っています。 |
| 有効 | OpenClaw 設定が Codex ハーネスターンでそのプラグインを許可しています。 |
| アクセス可能 | Codex app-server が、プラグインのアプリエントリがアクティブなアカウントで利用可能であり、移行済みプラグイン ID に対応していることを確認しています。 |

移行は、永続的なインストール/適格性ステップです。

- 計画中、OpenClaw はソース Codex `plugin/read` の詳細を読み取り、ソース Codex app-server アカウントが ChatGPT サブスクリプションアカウントであることを確認します。非 ChatGPT アカウント、またはアカウント応答がない場合、アプリに裏付けられたプラグインは `codex_subscription_required` でスキップされます。
- デフォルトでは、移行はソース `app/list` 呼び出しをスキップします。アカウントゲートを通過したアプリに裏付けられたソースプラグインは、ソースアプリのアクセシビリティ検証なしで計画され、アカウント検索のトランスポート失敗は `codex_account_unavailable` でスキップされます。
- `--verify-plugin-apps` を指定すると、移行は新しいソース `app/list` スナップショットを取得し、ネイティブ有効化を計画する前に、所有するすべてのアプリが存在し、有効で、アクセス可能であることを要求します。その場合、アカウント検索のトランスポート失敗は即座にスキップされるのではなく、ソースアプリインベントリゲートへフォールスルーします。

ランタイムアプリインベントリは、移行後に実行される対象セッションのアクセシビリティチェックです。Codex ハーネスのセッション設定は、有効かつアクセス可能なプラグインアプリから制限的なスレッドアプリ設定を計算します。これはターンごとには再計算されないため、`/codex plugins enable`/`disable` は新しい Codex 会話にのみ影響します。現在の会話で変更を取得するには `/new` または `/reset` を使用してください。

## V1 サポート境界

- ソース Codex app-server インベントリにすでにインストールされている `openai-curated` プラグインのみが移行対象です。
- アプリに裏付けられたソースプラグインは、移行時のサブスクリプションゲートを通過する必要があります。`--verify-plugin-apps` はソースアプリインベントリゲートを追加します。サブスクリプションゲートで制限されたアカウント、および検証モードでアクセス不能/無効/欠落しているソースアプリやアプリインベントリ更新失敗は、有効な設定エントリではなく、スキップされた手動項目として報告されます。読み取れないプラグイン詳細は、アプリインベントリゲートの前にスキップされます。
- 移行は明示的なプラグイン ID（`marketplaceName` と `pluginName`）を書き込みます。ローカルの `marketplacePath` キャッシュパスは書き込みません。
- `codexPlugins.enabled` が唯一のグローバル有効化スイッチです。任意のインストール権限を付与する `plugins["*"]` ワイルドカードや設定キーはありません。
- サポート対象外のマーケットプレイス、キャッシュ済みプラグインバンドル、フック、Codex 設定ファイルは、手動レビュー用に移行レポートに保持され、自動的には有効化されません。

## アプリインベントリと所有権

OpenClaw は app-server `app/list` を通じて Codex アプリインベントリを読み取り、1 時間メモリにキャッシュし、古いエントリや欠落エントリを非同期に更新します。キャッシュはプロセスローカルです。CLI または Gateway を再起動すると破棄され、OpenClaw は次回の `app/list` 読み取りから再構築します。

移行とランタイムは別々のキャッシュキーを使用します。

- ソース移行検証は、ソース Codex ホームと開始オプションを使用します。これは `--verify-plugin-apps` が指定された場合にのみ実行され、その計画実行で新しいソース `app/list` 走査を強制します。
- 対象ランタイム設定は、スレッドアプリ設定を構築するときに対象エージェントの Codex app-server ID を使用します。プラグイン有効化はその対象キャッシュキーを無効化し、`plugin/install` 後に強制更新します。

プラグインアプリは、OpenClaw が安定した所有権を通じて移行済みプラグインへ対応付けられる場合にのみ公開されます。つまり、プラグイン詳細からの正確なアプリ ID、既知の MCP サーバー名、または一意で安定したメタデータです。表示名のみ、または曖昧な所有権は、次のインベントリ更新で所有権が証明されるまで除外されます。

## スレッドアプリ設定

OpenClaw は Codex スレッドに制限的な `config.apps` パッチを注入します。`_default` は無効化され、有効な移行済みプラグインが所有するアプリのみが有効化されます。

各アプリの `destructive_enabled` は、有効なグローバルまたはプラグイン単位の `allow_destructive_actions` ポリシーに由来します。`true`、`"auto"`、`"ask"` はすべて `destructive_enabled: true` を設定し、`false` は `false` を設定します。Codex は引き続き、ネイティブアプリツール注釈から破壊的ツールメタデータを適用します。`_default` は `open_world_enabled: false` で無効化され、有効なプラグインアプリには `open_world_enabled: true` が設定されます。OpenClaw は、プラグインレベルの個別のオープンワールドポリシーノブを公開せず、プラグイン単位の破壊的ツール名拒否リストも維持しません。

ツール承認モードはプラグインアプリではデフォルトで自動のため、非破壊的な読み取りツールは同一スレッド承認プロンプトなしで実行されます。破壊的ツールは各アプリの `destructive_enabled` ポリシーで引き続き制御されます。

## 破壊的アクションポリシー

移行済み Codex プラグインでは、破壊的プラグイン elicitation はデフォルトで許可されます。一方、安全でないスキーマと曖昧な所有権はフェイルクローズします。

- グローバルな `allow_destructive_actions` のデフォルトは `true` です。
- プラグイン単位の `allow_destructive_actions` は、そのプラグインのグローバルポリシーを上書きします。
- `false`: OpenClaw は決定的な拒否を返します。
- `true`: OpenClaw は、ブール値の承認フィールドなど、承認応答に対応付けられる安全なスキーマのみを自動承認します。
- `"auto"`: OpenClaw は破壊的なプラグインアクションを Codex に公開し、その後、所有権が証明された MCP 承認 elicitation を OpenClaw プラグイン承認に変換してから Codex 承認応答を返します。
- `"ask"`: OpenClaw は `"auto"` と同じ Codex 書き込み/破壊的ゲートを使用し、スレッド開始前にそのアプリの永続的な Codex ツール単位承認オーバーライドをクリアし、永続的な承認が後続の書き込みアクションプロンプトを抑制できないように、1 回限りの承認または拒否のみを提供します。`"ask"` を使用する許可済みアプリごとに、OpenClaw はそのアプリ用の Codex の人間承認レビュアーを選択し、Codex が承認 elicitation を OpenClaw に送信するようにします。他のアプリと非アプリスレッド承認は、設定済みのレビュアーとポリシーを維持します。
- プラグイン ID の欠落、曖昧な所有権、欠落または不一致のターン ID、安全でない elicitation スキーマは、プロンプトを表示する代わりに拒否されます。

## トラブルシューティング

| コード                                              | 意味                                                                                                                              | 修正                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | 移行により Plugin はインストールされましたが、そのアプリの 1 つにはまだ認証が必要です。再認可するまで、このエントリは無効として書き込まれます。 | Codex でアプリを再認可してから、OpenClaw で Plugin を有効化します。                                                      |
| `app_inaccessible`, `app_disabled`, `app_missing` | `--verify-plugin-apps` を使用した場合、ソース Codex アプリインベントリでは、所有されているすべてのアプリが存在し、有効で、アクセス可能であることを確認できませんでした。         | Codex でアプリを再認可または有効化してから、`--verify-plugin-apps` を付けて移行を再実行します。                              |
| `app_inventory_unavailable`                       | 厳密なソースアプリ検証が要求されましたが、ソース Codex アプリインベントリの更新に失敗しました。                                      | ソース Codex アプリサーバーへのアクセスを修正するか、`--verify-plugin-apps` なしで再試行し、より高速なアカウント制限付きプランを受け入れます。   |
| `codex_subscription_required`                     | ソース Codex アプリサーバーアカウントが ChatGPT サブスクリプションアカウントではありませんでした。                                                          | サブスクリプション認証で Codex アプリにログインしてから、移行を再実行します。                                                  |
| `codex_account_unavailable`                       | ソース Codex アプリサーバーアカウントを読み取れませんでした。                                                                               | ソース Codex アプリサーバー認証を修正するか、`--verify-plugin-apps` を付けて再実行し、ソースアプリインベントリに適格性を判定させます。 |
| `marketplace_missing`, `plugin_missing`           | ターゲット Codex アプリサーバーから、想定される `openai-curated` マーケットプレイスまたは Plugin が見えません。                                          | ターゲットランタイムに対して移行を再実行するか、Codex アプリサーバーの Plugin 状態を調査します。                                 |
| `app_inventory_missing`, `app_inventory_stale`    | アプリの準備状態は空または古いキャッシュに由来します。                                                                                     | OpenClaw は非同期更新を自動的にスケジュールします。所有権と準備状態が判明するまで、Plugin アプリは除外されたままです。  |
| `app_ownership_ambiguous`                         | アプリインベントリは表示名でのみ一致しました。                                                                                          | 後続の更新で所有権が証明されるまで、そのアプリは Codex スレッドから非表示のままです。                                     |

**設定を変更したがエージェントから Plugin が見えない場合:** `/codex plugins
list` を実行して設定済み状態を確認してから、`/new` または `/reset` を実行します。既存の
Codex スレッドバインディングは、OpenClaw が新しいハーネスセッションを確立するか、古いバインディングを置き換えるまで、開始時のアプリ設定を保持します。

**破壊的操作が拒否される場合:** グローバルおよび Plugin ごとの
`allow_destructive_actions` 値を確認します。`true`、`"auto"`、`"ask"` であっても、
安全でない引き出しスキーマや曖昧な Plugin ID はフェイルクローズします。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#codex-harness-plugin-config)
- [移行 CLI](/ja-JP/cli/migrate)
