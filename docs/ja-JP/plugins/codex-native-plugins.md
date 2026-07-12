---
read_when:
    - Codex モードの OpenClaw エージェントでネイティブ Codex Plugin を使用したい場合
    - ソースからインストールした OpenAI 厳選の Codex plugins を移行しています
    - 既存のワークスペースディレクトリにある Codex Plugin を設定しています
    - codexPlugins、アプリインベントリ、破壊的アクション、またはPluginアプリの診断に関するトラブルシューティングを行う場合
summary: Codex モードの OpenClaw エージェント向けにネイティブ Codex Plugin を設定する
title: ネイティブ Codex Plugin
x-i18n:
    generated_at: "2026-07-12T14:37:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

ネイティブ Codex Plugin サポートにより、Codex モードの OpenClaw エージェントは、OpenClaw のターンを処理する同じ Codex スレッド内で、Codex app-server 独自のアプリおよび Plugin 機能を使用できます。Plugin 呼び出しはネイティブ Codex トランスクリプト内に保持され、アプリを基盤とする MCP の実行は Codex app-server が担当します。OpenClaw は Codex Plugin を合成された `codex_plugin_*` OpenClaw 動的ツールへ変換しません。

基本の [Codex ハーネス](/ja-JP/plugins/codex-harness)が動作してから、このページを使用してください。

## 要件

- エージェントランタイムはネイティブ Codex ハーネスでなければなりません。
- `plugins.entries.codex.enabled` は `true` でなければなりません。
- `plugins.entries.codex.config.codexPlugins.enabled` は `true` でなければなりません。
- 対象の Codex app-server から、想定されるマーケットプレイス、Plugin、およびアプリのインベントリを参照できる必要があります。
- 移行でサポートされるのは、移行元の Codex ホームでソースからインストール済みとして検出された `openai-curated` Plugin のみです。
- 手動で設定した `workspace-directory` Plugin には、`plugin/list` が `marketplaceKinds` を受け入れ、パスのないワークスペースサマリーに `remotePluginId` を含める Codex app-server が必要です。Plugin はすでにインストールされ、有効になっている必要があり、その Plugin が所有するアプリには `app/list` からアクセスできなければなりません。

`codexPlugins` は、OpenClaw プロバイダーの実行、ACP 会話バインディング、その他のハーネスには影響しません。これらの経路では、ネイティブの `apps` 設定を持つ Codex app-server スレッドが作成されないためです。

OpenAI 側の Codex アカウント、アプリの利用可否、およびワークスペースのアプリ／Plugin 制御は、サインイン中の Codex アカウントから取得されます。OpenAI アカウントと管理モデルについては、[ChatGPT プランで Codex を使用する](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)を参照してください。

## クイックスタート

移行元の Codex ホームからの移行をプレビューします。

```bash
openclaw migrate codex --dry-run
```

`--verify-plugin-apps` を追加すると、移行時に移行元の `app/list` が呼び出され、ネイティブでの有効化を計画する前に、所有されているすべてのアプリが存在し、有効で、アクセス可能であることが要求されます。

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

計画に問題がなければ、移行を適用します。

```bash
openclaw migrate apply codex --yes
```

移行では、対象となる Plugin の明示的な `codexPlugins` エントリが書き込まれ、選択された Plugin に対して Codex app-server の `plugin/install` が呼び出されます。移行後の設定は次のようになります。

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

移行の対象は引き続き `openai-curated` のみに限定されます。既存の `workspace-directory` Plugin を使用するには、`plugin/list` が返すマーケットプレイス修飾済みの正確な `summary.id` を使用して手動で追加します。たとえば、Codex が `example-plugin@workspace-directory` を返した場合は、表示名ではなく、その完全な値を設定します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            plugins: {
              "example-plugin": {
                enabled: true,
                marketplaceName: "workspace-directory",
                pluginName: "example-plugin@workspace-directory",
              },
            },
          },
        },
      },
    },
  },
}
```

OpenClaw は `workspace-directory` Plugin に対して `plugin/install` を呼び出したり、認証を開始したりしません。OpenClaw ポリシーを追加または有効化する前に、Codex でその Plugin をインストールし、有効化して、認証してください。レスポンスに正確なマーケットプレイス、Plugin ID、詳細 ID、またはアプリ準備完了の証拠が含まれない場合、OpenClaw はアプリを非表示のままにします。Codex が明示的なワークスペースの `plugin/list` リクエストを拒否した場合、OpenClaw は有効な各ワークスペース Plugin について `marketplace_missing` を報告し、独立して検出された curated Plugin は引き続き利用可能にします。

`codexPlugins` を変更すると、新しい Codex 会話では更新されたアプリセットが自動的に反映されます。現在の会話を更新するには、`/new` または `/reset` を実行します。Plugin の有効化／無効化の変更に Gateway の再起動は必要ありません。

## チャットから Plugin を管理する

`/codex plugins` を使用すると、Codex ハーネスを操作している同じチャットから、設定済みのネイティブ Codex Plugin を確認または変更できます。

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` は `/codex plugins list` のエイリアスです。リストには、`plugins.entries.codex.config.codexPlugins.plugins` に設定された各 Plugin のキー、オン／オフ状態、Codex Plugin 名、およびマーケットプレイスが表示されます。

`enable`／`disable` は `~/.openclaw/openclaw.json` にのみ書き込みます。`~/.codex/config.toml` を編集したり、新しい Codex Plugin をインストールしたりすることはありません。これらを実行できるのは、所有者または `operator.admin` スコープを持つ Gateway クライアントのみです。

設定済みの Plugin を有効にすると、グローバルな `codexPlugins.enabled` スイッチもオンになります。移行で `auth_required` が返されたため curated Plugin が無効として書き込まれた場合は、OpenClaw で有効にする前に Codex でアプリを再認証してください。`workspace-directory` エントリの場合、ここで有効化しても変更されるのは OpenClaw ポリシーのみです。Plugin とアプリは Codex ですでに有効になっている必要があります。

## ネイティブ Plugin のセットアップの仕組み

この統合では、3 つの状態を追跡します。

| 状態         | 意味                                                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| インストール済み | Codex の対象 app-server ランタイムに Plugin バンドルが存在します。                                                                                       |
| 有効         | Codex が Plugin を有効と報告しており、OpenClaw 設定で Codex ハーネスのターンに対してその使用が許可されています。                                             |
| アクセス可能   | Codex app-server により、Plugin のアプリエントリがアクティブなアカウントで利用でき、設定済みの Plugin ID に対応していることが確認されています。                 |

`openai-curated` Plugin の場合、移行が永続的なインストール／適格性確認の手順となります。

- 計画中に、OpenClaw は移行元 Codex の `plugin/read` 詳細を読み取り、移行元 Codex app-server のアカウントが ChatGPT サブスクリプションアカウントであることを確認します。ChatGPT 以外のアカウントまたはアカウントレスポンスがない場合、アプリを基盤とする Plugin は `codex_subscription_required` としてスキップされます。
- デフォルトでは、移行は移行元の `app/list` 呼び出しをスキップします。アカウントゲートを通過した、アプリを基盤とする移行元 Plugin は、移行元アプリへのアクセス可能性を検証せずに計画され、アカウント検索の通信エラーが発生した場合は `codex_account_unavailable` としてスキップされます。
- `--verify-plugin-apps` を使用すると、移行は移行元の新しい `app/list` スナップショットを取得し、ネイティブでの有効化を計画する前に、所有されているすべてのアプリが存在し、有効で、アクセス可能であることを要求します。この場合、アカウント検索の通信エラーが発生しても即座にはスキップされず、移行元のアプリインベントリゲートによる判定へ進みます。

`workspace-directory` Plugin のセットアップは OpenClaw の外部で行います。OpenClaw は、有効なワークスペースエントリが少なくとも 1 つ設定されている場合にのみ、そのマーケットプレイスへ問い合わせ、正確な `summary.id` で各 Plugin を解決し、既存の `plugin/read` 所有権チェックと `app/list` 準備完了チェックを再利用します。未インストール、無効、アクセス不能、または未認証の Plugin からはアプリが公開されません。OpenClaw はインストールも認証も試行しません。

ランタイムのアプリインベントリは、移行済みの curated Plugin と手動設定されたワークスペース Plugin の両方に対する、対象セッションのアクセス可能性チェックです。Codex ハーネスのセッションセットアップでは、有効かつアクセス可能な Plugin アプリから制限的なスレッドアプリ設定が算出されます。この設定はターンごとには再計算されないため、`/codex plugins enable`／`disable` が影響するのは新しい Codex 会話のみです。現在の会話に変更を反映するには、`/new` または `/reset` を使用します。

## V1 のサポート範囲

- 移行対象となるのは、移行元 Codex app-server のインベントリにすでにインストールされている `openai-curated` Plugin のみです。
- ランタイムでは、`plugin/list` が `marketplaceKinds` を実装し、パスのないワークスペースサマリーに対して `remotePluginId` を返す app-server ビルド上で、明示的な `workspace-directory` エントリもサポートされます。これらのエントリでは、マーケットプレイス修飾済みの正確な `summary.id` を使用する必要があり、すでにインストールされ、有効で、アプリにアクセス可能でなければなりません。ワークスペースのリストリクエストが拒否されると、既存の Plugin ごとの `marketplace_missing` 診断が生成されます。マーケットプレイス、Plugin、詳細、またはアプリの証拠が欠けている場合、ワークスペースアプリは公開されません。デフォルトのリストリクエストから取得された curated インベントリは引き続き使用できます。
- アプリを基盤とする移行元 Plugin は、移行時のサブスクリプションゲートを通過する必要があります。`--verify-plugin-apps` は移行元のアプリインベントリゲートを追加します。サブスクリプションゲートで除外されたアカウント、および検証モードでアクセス不能／無効／欠落している移行元アプリやアプリインベントリ更新の失敗は、有効な設定エントリではなく、スキップされた手動対応項目として報告されます。読み取れない Plugin の詳細は、アプリインベントリゲートより前にスキップされます。
- 移行では、明示的な Plugin ID（`marketplaceName` および `pluginName`）が書き込まれます。ローカルの `marketplacePath` キャッシュパスは書き込まれません。
- `codexPlugins.enabled` が唯一のグローバル有効化スイッチです。任意のインストール権限を付与する `plugins["*"]` ワイルドカードや設定キーはありません。
- curated 以外のマーケットプレイス、キャッシュ済み Plugin バンドル、フック、および Codex 設定ファイルは、手動確認用として移行レポートに保持され、自動的には有効化されません。ランタイムは手動設定された `workspace-directory` エントリを受け入れますが、その他のマーケットプレイスは引き続きサポートされません。

## アプリインベントリと所有権

OpenClaw は app-server の `app/list` を通じて Codex のアプリインベントリを読み取り、それをメモリ内に 1 時間キャッシュし、古いエントリや欠落したエントリを非同期で更新します。このキャッシュはプロセスローカルです。CLI または Gateway を再起動すると破棄され、OpenClaw は次回の `app/list` 読み取り時に再構築します。

移行とランタイムでは、別々のキャッシュキーを使用します。

- 移行元の移行検証では、移行元 Codex ホームと起動オプションを使用します。これは `--verify-plugin-apps` を指定した場合にのみ実行され、その計画実行のために移行元の `app/list` を強制的に新規走査します。
- 対象ランタイムのセットアップでは、スレッドアプリ設定を構築するときに、対象エージェントの Codex app-server ID を使用します。curated Plugin の有効化では、その対象キャッシュキーを無効化し、`plugin/install` の後に強制更新します。`workspace-directory` のセットアップでは、この有効化経路は実行されません。

Plugin アプリは、安定した所有権を通じて OpenClaw が設定済みの Plugin に対応付けられる場合にのみ公開されます。具体的には、Plugin 詳細に含まれる正確なアプリ ID、既知の MCP サーバー名、または一意で安定したメタデータを使用します。表示名のみ、または所有権が曖昧な場合は、次回のインベントリ更新で所有権が証明されるまで除外されます。

## 接続済みアカウントのアプリ

所有者が運用するエージェントは、一致する Plugin パッケージを必要とせず、Codex アカウントにすでに接続されているすべてのアプリを使用するよう設定できます。

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

`allow_all_plugins: true` は、新しいネイティブ Codex スレッドが確立されたときに完全な `app/list` スナップショットを取得し、そのアカウントでアクセス可能とマークされたアプリのみを許可します。アプリをグローバルにインストール、認証、または有効化することはありません。既存のスレッドでは、永続化済みのアプリセットが維持されます。新たに接続または取り消されたアプリを反映するには、`/new`、`/reset`、または Gateway の再起動を使用します。

アカウントアプリは、グローバルな `codexPlugins.allow_destructive_actions` の値を継承します。この値には `true`、`false`、`"auto"`、または `"ask"` を指定できます。明示的な Plugin ごとのポリシーは、重複するアプリ ID についてグローバルポリシーを上書きします。インベントリ取得に失敗した場合、無制限のデフォルトへフォールバックせず、閉じた状態で失敗します。

## スレッドアプリ設定

OpenClaw は Codex スレッドに制限的な `config.apps` パッチを挿入します。
`_default` は無効化され、有効化済みで構成済みの Plugin が所有するアプリ、または
`allow_all_plugins` によって許可されたアクセス可能なアカウントアプリのみが有効化されます。

各アプリの `destructive_enabled` は、有効なグローバルまたは
Plugin ごとの `allow_destructive_actions` ポリシーから決まります。`true`、`"auto"`、`"ask"` は
すべて `destructive_enabled: true` を設定し、`false` は `false` を設定します。Codex は引き続き、
ネイティブのアプリツール注釈に含まれる破壊的ツールのメタデータを適用します。
`_default` は `open_world_enabled: false` で無効化され、有効な Plugin アプリには
`open_world_enabled: true` が設定されます。OpenClaw は、Plugin レベルで独立した
オープンワールドポリシー設定を公開せず、Plugin ごとの
破壊的ツール名の拒否リストも維持しません。

許可されたアプリでは、ツール承認モードのデフォルトは自動であるため、非破壊的な
読み取りツールは同一スレッド内の承認プロンプトなしで実行されます。破壊的ツールは引き続き、
各アプリの `destructive_enabled` ポリシーによって制御されます。

## 破壊的アクションのポリシー

構成済みの Codex Plugin では、破壊的な Plugin 要請はデフォルトで許可されますが、
安全でないスキーマや所有者が曖昧な場合はフェイルクローズします。

- グローバルの `allow_destructive_actions` のデフォルトは `true` です。
- Plugin ごとの `allow_destructive_actions` は、その Plugin に対するグローバルポリシーを
  上書きします。
- `false`: OpenClaw は決定論的な拒否応答を返します。
- `true`: OpenClaw は、ブール値の承認フィールドなど、承認応答にマッピングできる
  安全なスキーマのみを自動承認します。
- `"auto"`: OpenClaw は破壊的な Plugin アクションを Codex に公開し、その後、
  所有権が証明された MCP 承認要請を OpenClaw の Plugin 承認に変換してから、
  Codex の承認応答を返します。
- `"ask"`: OpenClaw は `"auto"` と同じ Codex の書き込み／破壊的操作のゲートを使用し、
  スレッド開始前にそのアプリに対する Codex の永続的なツール別承認オーバーライドを消去し、
  1 回限りの承認または拒否のみを提示します。これにより、永続的な承認によって
  以後の書き込みアクションのプロンプトが抑制されることを防ぎます。`"ask"` を使用する
  許可済みアプリごとに、OpenClaw はそのアプリ用として Codex の人間による承認
  レビュアーを選択し、Codex が承認要請を OpenClaw に送信するようにします。
  その他のアプリとアプリ以外のスレッド承認では、構成済みのレビュアーとポリシーが
  維持されます。
- Plugin ID がない、所有権が曖昧、ターン ID がないか一致しない、または
  要請スキーマが安全でない場合は、プロンプトを表示せず拒否します。

## トラブルシューティング

| コード                                            | 意味                                                                                                                                 | 修正                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | 移行によって Plugin はインストールされましたが、そのアプリのいずれかで認証がまだ必要です。再認証するまで、そのエントリは無効として書き込まれます。 | Codex でアプリを再認証してから、OpenClaw で Plugin を有効にします。                                                     |
| `app_inaccessible`, `app_disabled`, `app_missing` | `--verify-plugin-apps` を使用した際、移行元の Codex アプリインベントリで、所有するすべてのアプリが存在し、有効で、アクセス可能であることを確認できませんでした。 | Codex でアプリを再認証または有効化してから、`--verify-plugin-apps` を指定して移行を再実行します。                       |
| `app_inventory_unavailable`                       | 移行元アプリの厳密な検証が要求されましたが、移行元の Codex アプリインベントリの更新に失敗しました。                                    | 移行元 Codex アプリサーバーへのアクセスを修正するか、`--verify-plugin-apps` なしで再試行し、より高速なアカウント制御プランを受け入れます。 |
| `codex_subscription_required`                     | 移行元の Codex アプリサーバーアカウントが ChatGPT サブスクリプションアカウントではありませんでした。                                  | サブスクリプション認証を使用して Codex アプリにログインし、移行を再実行します。                                       |
| `codex_account_unavailable`                       | 移行元の Codex アプリサーバーアカウントを読み取れませんでした。                                                                      | 移行元 Codex アプリサーバーの認証を修正するか、`--verify-plugin-apps` を指定して再実行し、移行元アプリインベントリによって適格性を判定します。 |
| `marketplace_missing`, `plugin_missing`           | マーケットプレイスまたは指定した Plugin を利用できません。明示的なワークスペースカタログ要求が拒否された可能性があり、ワークスペースアプリはフェイルクローズします。 | 以下に記載されている互換性のあるアプリサーバー契約と正確な ID を確認します。                                           |
| `plugin_detail_unavailable`                       | OpenClaw は Plugin の所有権詳細を読み取れませんでした。                                                                               | 対象アプリサーバーの `plugin/list` および `plugin/read` 応答を調査します。                                             |
| `plugin_disabled`                                 | Codex は Plugin がインストール済みだが無効であると報告しています。                                                                   | キュレーション済みの有効化処理で修復できる場合があります。再試行する前に、Codex でワークスペース Plugin を有効にします。 |
| `plugin_activation_failed`                        | Plugin の有効化が完了しませんでした。                                                                                                | 添付された診断情報を使用して、マーケットプレイス、認証、更新、またはワークスペース準備状態の失敗を区別します。         |
| `app_inventory_missing`, `app_inventory_stale`    | アプリの準備状態が、空または古いキャッシュから取得されました。                                                                       | OpenClaw は非同期更新を自動的にスケジュールします。所有権と準備状態が判明するまで、Plugin アプリは除外されたままです。 |
| `app_ownership_ambiguous`                         | アプリインベントリでは表示名のみが一致しました。                                                                                     | 後続の更新で所有権が証明されるまで、そのアプリは Codex スレッドに表示されません。                                     |

**ワークスペース Plugin はインストール済みだが表示されない場合:** ワークスペースの
`plugin/list` の結果で、構成済みの正確な ID がインストール済みかつ有効として報告されていることを確認し、
続いて `app/list` で、所有するすべてのアプリが同じ Codex
アカウントからアクセス可能として報告されていることを確認します。アカウントインベントリで
そのアプリが現在無効と報告されている場合でも、OpenClaw はアクセス可能なアプリを
スレッドで有効にできます。Gateway がアプリインベントリをキャッシュした後にその状態を変更した場合は、
1 時間のキャッシュ更新を待つか Gateway を再起動してから、
`/new` または `/reset` を使用します。OpenClaw はワークスペース Plugin の修復や認証を行いません。
明示的なワークスペース一覧要求が拒否された場合、有効な各ワークスペースエントリは
`marketplace_missing` を報告します。関係のないキュレーション済みエントリは、
デフォルトの一覧応答から引き続き処理されます。

`plugin_detail_unavailable` の場合、パスのないワークスペース概要には
`remotePluginId` が含まれている必要があります。そのセレクターまたは後続の
`plugin/read` の結果を利用できない場合、OpenClaw は所有アプリを非表示のままにします。
`plugin_activation_failed` の場合、キュレーション済み Plugin はマーケットプレイス、認証、または
インストール後の更新の失敗を報告することがあります。ワークスペース Plugin がこのコードを報告するのは、
まだアクティブでない場合です。OpenClaw の外部でインストール、有効化、認証を行ってください。

**構成を変更したがエージェントに Plugin が表示されない場合:** `/codex plugins
list` を実行して構成状態を確認し、続いて `/new` または `/reset` を使用します。既存の
Codex スレッドバインディングは、OpenClaw が新しいハーネスセッションを確立するか、
古いバインディングを置き換えるまで、開始時のアプリ構成を保持します。

**破壊的アクションが拒否される場合:** グローバルおよび Plugin ごとの
`allow_destructive_actions` の値を確認します。`true`、`"auto"`、`"ask"` の場合でも、
安全でない要請スキーマや曖昧な Plugin ID は引き続きフェイルクローズします。

## 関連項目

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [構成リファレンス](/ja-JP/gateway/configuration-reference#codex-harness-plugin-config)
- [移行 CLI](/ja-JP/cli/migrate)
