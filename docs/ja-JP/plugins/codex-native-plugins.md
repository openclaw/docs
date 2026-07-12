---
read_when:
    - CodexモードのOpenClawエージェントでネイティブCodexプラグインを使用する場合
    - ソースからインストールされた、OpenAI が選定した Codex plugins を移行しています
    - 既存のワークスペースディレクトリにある Codex Plugin を設定しています
    - codexPlugins、アプリインベントリ、破壊的な操作、またはPluginアプリの診断に関するトラブルシューティングを行っている場合
summary: Codex モードの OpenClaw エージェント向けにネイティブ Codex Plugin を設定する
title: ネイティブ Codex プラグイン
x-i18n:
    generated_at: "2026-07-11T22:27:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

ネイティブ Codex Plugin 対応により、Codex モードの OpenClaw エージェントは、OpenClaw のターンを処理する同じ Codex スレッド内で、Codex app-server 独自のアプリおよび Plugin 機能を使用できます。Plugin 呼び出しはネイティブ Codex トランスクリプト内に保持され、Codex app-server がアプリを基盤とする MCP 実行を管理します。OpenClaw は Codex Plugin を合成された `codex_plugin_*` OpenClaw 動的ツールに変換しません。

基本の [Codex ハーネス](/ja-JP/plugins/codex-harness)が動作した後に、このページを使用してください。

## 要件

- エージェントランタイムはネイティブ Codex ハーネスでなければなりません。
- `plugins.entries.codex.enabled` が `true` である必要があります。
- `plugins.entries.codex.config.codexPlugins.enabled` が `true` である必要があります。
- 対象の Codex app-server から、想定されるマーケットプレイス、Plugin、およびアプリのインベントリを参照できる必要があります。
- 移行でサポートされるのは、移行元の Codex ホームでソースからインストール済みであることが確認された `openai-curated` Plugin のみです。
- 手動で構成する `workspace-directory` Plugin には、`plugin/list` が `marketplaceKinds` を受け付け、パスを含まないワークスペース概要に `remotePluginId` を含める Codex app-server が必要です。Plugin はすでにインストールされ、有効になっている必要があり、その Plugin が所有するアプリに `app/list` からアクセスできる必要があります。

`codexPlugins` は OpenClaw プロバイダーでの実行、ACP 会話バインディング、その他のハーネスには影響しません。これらの経路では、ネイティブの `apps` 構成を持つ Codex app-server スレッドが作成されないためです。

OpenAI 側の Codex アカウント、アプリの可用性、ワークスペースのアプリおよび Plugin 制御は、サインイン中の Codex アカウントに基づきます。OpenAI アカウントと管理モデルについては、[ChatGPT プランで Codex を使用する](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)を参照してください。

## クイックスタート

移行元の Codex ホームからの移行をプレビューします。

```bash
openclaw migrate codex --dry-run
```

`--verify-plugin-apps` を追加すると、移行時に移行元の `app/list` を呼び出し、ネイティブ有効化を計画する前に、所有するすべてのアプリが存在し、有効で、アクセス可能であることを要求します。

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

計画に問題がなければ、移行を適用します。

```bash
openclaw migrate apply codex --yes
```

移行では、対象となる Plugin の明示的な `codexPlugins` エントリを書き込み、選択した Plugin に対して Codex app-server の `plugin/install` を呼び出します。移行後の構成は次のようになります。

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

移行の対象は引き続き `openai-curated` に限定されます。既存の `workspace-directory` Plugin を使用するには、`plugin/list` が返すマーケットプレイス修飾済みの正確な `summary.id` を使用して、手動で追加します。たとえば、Codex が `example-plugin@workspace-directory` を返す場合は、表示名ではなく、その完全な値を構成します。

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

OpenClaw は `workspace-directory` Plugin に対して `plugin/install` を呼び出したり、認証を開始したりしません。OpenClaw ポリシーを追加または有効化する前に、Codex でインストール、有効化、認証を行ってください。レスポンスに正確なマーケットプレイス、Plugin ID、詳細 ID、またはアプリ準備状況の証拠が含まれていない場合、OpenClaw はアプリを非表示のままにします。Codex が明示的なワークスペース `plugin/list` リクエストを拒否した場合、OpenClaw は有効な各ワークスペース Plugin について `marketplace_missing` を報告し、独立して検出された curated Plugin は引き続き利用可能にします。

`codexPlugins` を変更すると、新しい Codex 会話には更新されたアプリセットが自動的に反映されます。現在の会話を更新するには、`/new` または `/reset` を実行します。Plugin の有効化または無効化を変更しても、Gateway の再起動は必要ありません。

## チャットから Plugin を管理する

`/codex plugins` を使用すると、Codex ハーネスを操作している同じチャットから、構成済みのネイティブ Codex Plugin を確認または変更できます。

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` は `/codex plugins list` のエイリアスです。この一覧には、`plugins.entries.codex.config.codexPlugins.plugins` に構成された各 Plugin のキー、オンまたはオフの状態、Codex Plugin 名、およびマーケットプレイスが表示されます。

`enable`/`disable` は `~/.openclaw/openclaw.json` にのみ書き込みます。`~/.codex/config.toml` を編集したり、新しい Codex Plugin をインストールしたりすることはありません。実行できるのは、所有者または `operator.admin` スコープを持つ Gateway クライアントのみです。

構成済みの Plugin を有効にすると、グローバルな `codexPlugins.enabled` スイッチも有効になります。移行で `auth_required` が返されたため curated Plugin が無効として書き込まれた場合は、OpenClaw で有効にする前に Codex でアプリを再認可してください。`workspace-directory` エントリの場合、ここで有効にしても OpenClaw ポリシーのみが変更されます。Plugin とアプリは、Codex ですでに有効になっている必要があります。

## ネイティブ Plugin のセットアップの仕組み

この統合では、3 つの状態を追跡します。

| 状態             | 意味                                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| インストール済み | Codex の対象 app-server ランタイムに Plugin バンドルが存在します。                                                                            |
| 有効             | Codex が Plugin を有効として報告し、OpenClaw の構成で Codex ハーネスのターンに対する使用が許可されています。                                  |
| アクセス可能     | Codex app-server により、Plugin のアプリエントリがアクティブなアカウントで利用でき、構成済みの Plugin ID に対応していることが確認されています。 |

`openai-curated` Plugin では、移行が永続的なインストールおよび適格性判定の手順になります。

- 計画中に、OpenClaw は移行元 Codex の `plugin/read` の詳細を読み取り、移行元 Codex app-server のアカウントが ChatGPT サブスクリプションアカウントであることを確認します。ChatGPT 以外のアカウント、またはアカウントのレスポンスがない場合、アプリを基盤とする Plugin は `codex_subscription_required` としてスキップされます。
- デフォルトでは、移行時に移行元の `app/list` 呼び出しはスキップされます。アカウント条件を満たしたアプリを基盤とする移行元 Plugin は、移行元アプリへのアクセス可能性を検証せずに計画され、アカウント検索の通信エラーが発生した場合は `codex_account_unavailable` としてスキップされます。
- `--verify-plugin-apps` を使用すると、移行時に移行元の `app/list` の新しいスナップショットを取得し、ネイティブ有効化を計画する前に、所有するすべてのアプリが存在し、有効で、アクセス可能であることを要求します。この場合、アカウント検索の通信エラーが発生しても即座にはスキップされず、移行元アプリのインベントリ条件による判定に移ります。

`workspace-directory` Plugin のセットアップは OpenClaw の外部で行われます。OpenClaw は、有効なワークスペースエントリが少なくとも 1 つ構成されている場合にのみ、そのマーケットプレイスを照会し、正確な `summary.id` で各 Plugin を解決し、既存の `plugin/read` 所有権チェックと `app/list` 準備状況チェックを再利用します。インストールされていない、無効、アクセス不能、または未認証の Plugin はアプリを公開しません。OpenClaw はインストールや認証を試みません。

ランタイムのアプリインベントリは、移行された curated Plugin と手動で構成されたワークスペース Plugin の両方に対する、対象セッションのアクセス可能性チェックです。Codex ハーネスのセッションセットアップでは、有効かつアクセス可能な Plugin アプリから制限的なスレッドアプリ構成を計算します。この構成はターンごとに再計算されないため、`/codex plugins enable`/`disable` が影響するのは新しい Codex 会話のみです。現在の会話に変更を反映するには、`/new` または `/reset` を使用します。

## V1 のサポート範囲

- 移行対象となるのは、移行元 Codex app-server のインベントリにすでにインストールされている `openai-curated` Plugin のみです。
- ランタイムでは、`plugin/list` が `marketplaceKinds` を実装し、パスを含まないワークスペース概要に対して `remotePluginId` を返す app-server ビルド上で、明示的な `workspace-directory` エントリもサポートされます。これらのエントリはマーケットプレイス修飾済みの正確な `summary.id` を使用し、すでにインストールされ、有効で、アプリにアクセス可能である必要があります。ワークスペース一覧リクエストが拒否された場合、既存の Plugin ごとの `marketplace_missing` 診断が生成されます。マーケットプレイス、Plugin、詳細、またはアプリの証拠が不足している場合、ワークスペースアプリは公開されません。デフォルトの一覧リクエストから得られる curated インベントリは引き続き使用できます。
- アプリを基盤とする移行元 Plugin は、移行時のサブスクリプション条件を満たす必要があります。`--verify-plugin-apps` は、移行元アプリのインベントリ条件を追加します。サブスクリプション条件を満たさないアカウント、および検証モードでアクセス不能、無効、不足している移行元アプリ、またはアプリインベントリ更新エラーがある場合、有効な構成エントリではなく、スキップされた手動対応項目として報告されます。読み取れない Plugin の詳細は、アプリインベントリ条件の判定前にスキップされます。
- 移行では、明示的な Plugin ID（`marketplaceName` および `pluginName`）を書き込みます。ローカルの `marketplacePath` キャッシュパスは書き込みません。
- `codexPlugins.enabled` が唯一のグローバル有効化スイッチです。任意のインストール権限を付与する `plugins["*"]` ワイルドカードや構成キーはありません。
- curated 以外のマーケットプレイス、キャッシュ済みの Plugin バンドル、フック、Codex 構成ファイルは、自動的には有効化されず、手動確認用として移行レポートに保持されます。ランタイムは手動で構成された `workspace-directory` エントリを受け付けますが、その他のマーケットプレイスは引き続きサポートされません。

## アプリインベントリと所有権

OpenClaw は app-server の `app/list` を通じて Codex のアプリインベントリを読み取り、メモリ内に 1 時間キャッシュし、古いエントリまたは不足しているエントリを非同期で更新します。キャッシュはプロセスローカルです。CLI または Gateway を再起動すると破棄され、OpenClaw は次回の `app/list` 読み取り時に再構築します。

移行とランタイムでは、別々のキャッシュキーを使用します。

- 移行元の移行検証では、移行元の Codex ホームと起動オプションを使用します。これは `--verify-plugin-apps` を指定した場合にのみ実行され、その計画実行に対して移行元の `app/list` を強制的に新規走査します。
- 対象ランタイムのセットアップでは、スレッドアプリ構成を構築するときに、対象エージェントの Codex app-server ID を使用します。curated Plugin の有効化では、その対象キャッシュキーを無効化し、`plugin/install` 後に強制更新します。`workspace-directory` のセットアップでは、この有効化経路は実行されません。

Plugin アプリが公開されるのは、安定した所有権により、OpenClaw がそのアプリを構成済みの Plugin に対応付けられる場合のみです。対応付けには、Plugin の詳細に含まれる正確なアプリ ID、既知の MCP サーバー名、または一意で安定したメタデータが使用されます。表示名だけに基づく所有権や曖昧な所有権は、次回のインベントリ更新で所有権が証明されるまで除外されます。

## 接続済みアカウントのアプリ

所有者が運用するエージェントでは、対応する Plugin パッケージを必要とせず、Codex アカウントにすでに接続されているすべてのアプリを使用するよう選択できます。

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

`allow_all_plugins: true` は、新しいネイティブ Codex スレッドの確立時に完全な `app/list` スナップショットを取得し、そのアカウントでアクセス可能とマークされたアプリのみを許可します。アプリをグローバルにインストール、認証、有効化することはありません。既存のスレッドでは永続化されたアプリセットが維持されます。新たに接続または取り消されたアプリを反映するには、`/new`、`/reset` を使用するか、Gateway を再起動します。

アカウントのアプリは、グローバルな `codexPlugins.allow_destructive_actions` の値を継承します。この値には `true`、`false`、`"auto"`、または `"ask"` を指定できます。アプリ ID が重複する場合、Plugin ごとの明示的なポリシーがグローバルポリシーを上書きします。インベントリの取得に失敗した場合、無制限のデフォルトへフォールバックせず、安全側に閉じます。

## スレッドアプリ構成

OpenClaw は Codex スレッドに制限的な `config.apps` パッチを注入します。
`_default` は無効化され、有効に設定されたプラグインが所有するアプリ、または
`allow_all_plugins` によって許可されたアクセス可能なアカウントアプリのみが有効になります。

各アプリの `destructive_enabled` は、有効なグローバルまたは
プラグイン単位の `allow_destructive_actions` ポリシーから決まります。`true`、`"auto"`、`"ask"` は
いずれも `destructive_enabled: true` を設定し、`false` は `false` を設定します。Codex は引き続き、
ネイティブのアプリツール注釈にある破壊的ツールのメタデータを適用します。
`_default` は `open_world_enabled: false` で無効化され、有効なプラグインアプリには
`open_world_enabled: true` が設定されます。OpenClaw はプラグイン単位のオープンワールドポリシーを
個別に設定する機能を公開せず、プラグイン単位の破壊的ツール名の拒否リストも管理しません。

許可されたアプリでは、ツール承認モードのデフォルトは自動であるため、非破壊的な
読み取りツールは同一スレッド内の承認プロンプトなしで実行されます。破壊的ツールは引き続き、
各アプリの `destructive_enabled` ポリシーによって制御されます。

## 破壊的アクションのポリシー

設定済みの Codex プラグインでは、破壊的なプラグインの確認要求はデフォルトで許可されますが、
安全でないスキーマや所有者が曖昧な場合は安全側に倒して拒否されます。

- グローバルの `allow_destructive_actions` のデフォルトは `true` です。
- プラグイン単位の `allow_destructive_actions` は、そのプラグインについて
  グローバルポリシーを上書きします。
- `false`: OpenClaw は決定論的な拒否応答を返します。
- `true`: OpenClaw は、真偽値の承認フィールドなど、承認応答にマッピングできる
  安全なスキーマのみを自動承認します。
- `"auto"`: OpenClaw は破壊的なプラグインアクションを Codex に公開し、その後、
  所有者が確認された MCP の承認確認要求を OpenClaw のプラグイン承認に変換してから、
  Codex の承認応答を返します。
- `"ask"`: OpenClaw は `"auto"` と同じ Codex の書き込み／破壊的操作のゲートを使用し、
  スレッド開始前に、そのアプリに対する Codex のツール単位の永続的な承認上書きを消去します。
  また、永続的な承認によって後続の書き込みアクションのプロンプトが抑制されないよう、
  1 回限りの承認または拒否のみを提示します。`"ask"` を使用する許可済みアプリごとに、
  OpenClaw はそのアプリに対して Codex の人間による承認レビュアーを選択し、
  Codex の承認確認要求が OpenClaw に送信されるようにします。その他のアプリと
  アプリ以外のスレッド承認では、設定済みのレビュアーとポリシーが維持されます。
- プラグイン識別情報の欠落、所有者の曖昧さ、ターン ID の欠落または不一致、
  あるいは安全でない確認要求スキーマがある場合、プロンプトを表示せず拒否します。

## トラブルシューティング

| コード                                            | 意味                                                                                                                                 | 修正方法                                                                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | 移行によってプラグインはインストールされましたが、そのアプリのいずれかに引き続き認証が必要です。再認可するまで、エントリは無効として書き込まれます。 | Codex でアプリを再認可してから、OpenClaw でプラグインを有効にします。                                                      |
| `app_inaccessible`, `app_disabled`, `app_missing` | `--verify-plugin-apps` の使用時、移行元の Codex アプリ一覧では、所有するすべてのアプリが存在し、有効で、アクセス可能であることを確認できませんでした。 | Codex でアプリを再認可または有効化してから、`--verify-plugin-apps` を指定して移行を再実行します。                           |
| `app_inventory_unavailable`                       | 移行元アプリの厳密な検証が要求されましたが、移行元の Codex アプリ一覧の更新に失敗しました。                                            | 移行元 Codex アプリサーバーへのアクセスを修正するか、より高速なアカウント制限付きプランを受け入れるため、`--verify-plugin-apps` なしで再試行します。 |
| `codex_subscription_required`                     | 移行元 Codex アプリサーバーのアカウントは、ChatGPT のサブスクリプションアカウントではありませんでした。                               | サブスクリプション認証を使用して Codex アプリにログインし、移行を再実行します。                                           |
| `codex_account_unavailable`                       | 移行元 Codex アプリサーバーのアカウントを読み取れませんでした。                                                                        | 移行元 Codex アプリサーバーの認証を修正するか、`--verify-plugin-apps` を指定して再実行し、移行元アプリ一覧で適格性を判定します。 |
| `marketplace_missing`, `plugin_missing`           | マーケットプレイスまたは指定されたプラグインを利用できません。明示的なワークスペースカタログ要求が拒否された可能性があり、ワークスペースアプリは安全側に倒して拒否されます。 | 以下で説明する互換性のあるアプリサーバー契約と正確な ID を確認します。                                                     |
| `plugin_detail_unavailable`                       | OpenClaw はプラグイン所有権の詳細を読み取れませんでした。                                                                              | 対象アプリサーバーの `plugin/list` および `plugin/read` 応答を調査します。                                                 |
| `plugin_disabled`                                 | Codex は、プラグインがインストール済みだが無効であると報告しています。                                                                 | 管理対象の有効化によって修復できる場合があります。再試行する前に、Codex でワークスペースプラグインを有効にします。          |
| `plugin_activation_failed`                        | プラグインの有効化が完了しませんでした。                                                                                               | 添付の診断情報を使用して、マーケットプレイス、認証、更新、またはワークスペース準備状態の失敗を判別します。                |
| `app_inventory_missing`, `app_inventory_stale`    | アプリの準備状態が、空または古いキャッシュから取得されました。                                                                         | OpenClaw は非同期更新を自動的に予約します。所有権と準備状態が判明するまで、プラグインアプリは除外されたままです。           |
| `app_ownership_ambiguous`                         | アプリ一覧では表示名のみが一致しました。                                                                                               | 後続の更新で所有権が確認されるまで、そのアプリは Codex スレッドで非表示のままです。                                        |

**ワークスペースプラグインがインストール済みだが表示されない場合:** ワークスペースの
`plugin/list` の結果で、設定された正確な ID がインストール済みかつ有効として報告されていることを確認し、
続いて `app/list` で、所有するすべてのアプリが同じ Codex アカウントからアクセス可能として報告されていることを
確認します。アカウントのアプリ一覧で現在そのアプリが無効と報告されていても、OpenClaw はアクセス可能なアプリを
スレッド用に有効化できます。Gateway がアプリ一覧をキャッシュした後にその状態を変更した場合は、
1 時間ごとのキャッシュ更新を待つか Gateway を再起動してから、`/new` または `/reset` を使用します。
OpenClaw はワークスペースプラグインの修復や認証を行いません。明示的なワークスペース一覧要求が拒否された場合、
有効な各ワークスペースエントリは `marketplace_missing` を報告します。無関係な管理対象エントリは、
デフォルトの一覧応答を使用して引き続き処理されます。

`plugin_detail_unavailable` の場合、パスを持たないワークスペース概要には
`remotePluginId` を含める必要があります。そのセレクター、または後続の `plugin/read` の結果が
利用できない場合、OpenClaw は所有するアプリを非表示のままにします。
`plugin_activation_failed` の場合、管理対象プラグインでは、マーケットプレイス、認証、または
インストール後の更新の失敗が報告されることがあります。ワークスペースプラグインがまだ有効でない場合、
このコードが報告されます。OpenClaw の外部でインストール、有効化、認証を行ってください。

**設定を変更したがエージェントからプラグインが見えない場合:** `/codex plugins
list` を実行して設定状態を確認してから、`/new` または `/reset` を実行します。既存の
Codex スレッドバインディングは、OpenClaw が新しいハーネスセッションを確立するか、
古いバインディングを置き換えるまで、開始時のアプリ設定を保持します。

**破壊的アクションが拒否される場合:** グローバルおよびプラグイン単位の
`allow_destructive_actions` の値を確認します。`true`、`"auto"`、`"ask"` の場合でも、
安全でない確認要求スキーマや曖昧なプラグイン識別情報は、引き続き安全側に倒して拒否されます。

## 関連項目

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#codex-harness-plugin-config)
- [移行 CLI](/ja-JP/cli/migrate)
