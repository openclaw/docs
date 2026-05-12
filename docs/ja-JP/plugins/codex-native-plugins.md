---
read_when:
    - Codex モードの OpenClaw エージェントでネイティブの Codex プラグインを使用したい
    - ソースからインストールされた OpenAI curated Codex Plugin を移行しています
    - codexPlugins、アプリインベントリ、破壊的アクション、またはPluginアプリ診断のトラブルシューティングをしている
summary: Codex モードの OpenClaw エージェント向けに、移行済みネイティブ Codex Plugin を構成する
title: ネイティブ Codex プラグイン
x-i18n:
    generated_at: "2026-05-12T23:30:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddec40cd5f9a74b43d55f327cdcd7088e024392fbafc7f1aa5bd9b136d3ecc13
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

ネイティブ Codex プラグインサポートにより、Codex モードの OpenClaw エージェントは、OpenClaw ターンを処理する同じ Codex スレッド内で Codex
app-server 自身のアプリとプラグイン機能を使用できます。

OpenClaw は、Codex プラグインを合成 `codex_plugin_*`
OpenClaw 動的ツールに変換しません。プラグイン呼び出しはネイティブ Codex トランスクリプト内に残り、
Codex app-server がアプリに裏付けられた MCP 実行を所有します。

ベースの [Codex ハーネス](/ja-JP/plugins/codex-harness) が動作してから、このページを使用してください。

## 要件

- 選択した OpenClaw エージェントランタイムは、ネイティブ Codex ハーネスである必要があります。
- `plugins.entries.codex.enabled` は true である必要があります。
- `plugins.entries.codex.config.codexPlugins.enabled` は true である必要があります。
- V1 は、移行時に移行元 Codex home にソースインストール済みとして観測された
  `openai-curated` プラグインのみをサポートします。
- 移行先 Codex app-server は、想定されるマーケットプレイス、
  プラグイン、アプリインベントリを参照できる必要があります。

`codexPlugins` は PI 実行、通常の OpenAI プロバイダー実行、ACP
会話バインディング、またはその他のハーネスには影響しません。これらのパスは、ネイティブ `apps` 設定を持つ
Codex app-server スレッドを作成しないためです。

## クイックスタート

移行元 Codex home から移行をプレビューします。

```bash
openclaw migrate codex --dry-run
```

ネイティブプラグイン有効化を計画する前に、移行で移行元アプリのアクセシビリティを確認したい場合は、厳格な移行元アプリ検証を使用します。

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

計画が正しく見えたら、移行を適用します。

```bash
openclaw migrate apply codex --yes
```

移行は、対象プラグインの明示的な `codexPlugins` エントリを書き込み、選択したプラグインに対して
Codex app-server `plugin/install` を呼び出します。典型的な移行後の設定は次のようになります。

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

`codexPlugins` を変更した後は、今後の Codex ハーネスセッションが更新されたアプリセットで開始されるように、`/new`、`/reset` を使用するか、gateway を再起動してください。

## ネイティブプラグイン設定の仕組み

この統合には 3 つの独立した状態があります。

- インストール済み: Codex は移行先 app-server ランタイムにローカルプラグインバンドルを持っています。
- 有効: OpenClaw 設定は、そのプラグインを Codex
  ハーネスターンで利用可能にできます。
- アクセス可能: Codex app-server は、そのプラグインのアプリエントリがアクティブなアカウントで利用可能であり、移行されたプラグイン ID にマッピングできることを確認しています。

移行は、永続的なインストールおよび適格性ステップです。計画時に、OpenClaw は移行元 Codex
`plugin/read` の詳細を読み取り、移行元 Codex
app-server アカウントレスポンスが ChatGPT サブスクリプションアカウントであることを確認します。ChatGPT 以外、またはアカウントレスポンスがない場合、アプリ基盤のプラグインは
`codex_subscription_required` でスキップされます。デフォルトでは、移行は移行元の
`app/list` を呼び出しません。アカウントゲートを通過したアプリ基盤の移行元プラグインは、移行元アプリのアクセシビリティ検証なしで計画され、アカウント検索のトランスポート失敗は
`codex_account_unavailable` でスキップされます。`--verify-plugin-apps` を指定すると、移行は新しい移行元 `app/list` スナップショットを取得し、ネイティブ有効化を計画する前に、所有されているすべてのアプリが存在し、有効で、アクセス可能であることを要求します。このモードでは、アカウント検索のトランスポート失敗は移行元アプリインベントリゲートにフォールスルーします。ランタイムアプリインベントリは、移行後の移行先セッションのアクセシビリティチェックです。その後、Codex ハーネスセッション設定は、有効かつアクセス可能なプラグインアプリに対して制限的なスレッドアプリ設定を計算します。

スレッドアプリ設定は、OpenClaw が Codex ハーネスセッションを確立するか、古くなった Codex スレッドバインディングを置き換えるときに計算されます。ターンごとに再計算されるわけではありません。

## V1 サポート境界

V1 は意図的に狭い範囲に限定されています。

- 移行元 Codex
  app-server インベントリにすでにインストールされていた `openai-curated` プラグインのみが、移行対象です。
- アプリ基盤の移行元プラグインは、移行時のサブスクリプションゲートを通過する必要があります。
  `--verify-plugin-apps` は移行元アプリインベントリゲートを追加します。サブスクリプションゲートで制限されたアカウント、および検証モードでは、アクセス不能、無効、欠落している移行元アプリ、または移行元アプリインベントリ更新の失敗は、有効な設定エントリではなく、スキップされた手動項目として報告されます。読み取れないプラグイン詳細は、移行元アプリインベントリゲートの前にスキップされます。
- 移行は、`marketplaceName` と
  `pluginName` を持つ明示的なプラグイン ID を書き込みます。ローカルの `marketplacePath` キャッシュパスは書き込みません。
- `codexPlugins.enabled` はグローバルな有効化スイッチです。
- `plugins["*"]` ワイルドカードはなく、任意のインストール権限を付与する設定キーもありません。
- サポートされていないマーケットプレイス、キャッシュされたプラグインバンドル、フック、Codex 設定ファイルは、手動レビュー用に移行レポートに保持されます。

## アプリインベントリと所有権

OpenClaw は app-server `app/list` を通じて Codex アプリインベントリを読み取り、1 時間キャッシュし、古いエントリや欠落したエントリを非同期で更新します。キャッシュはメモリ内のみです。CLI または gateway を再起動すると破棄され、OpenClaw は次の `app/list` 読み取りから再構築します。

移行とランタイムは別々のキャッシュキーを使用します。

- 移行元の移行検証は、移行元 Codex home と移行元 app-server 起動オプションを使用します。これは `--verify-plugin-apps` が設定されている場合にのみ実行され、その計画実行で新しい移行元 `app/list` 走査を強制します。
- 移行先ランタイム設定は、Codex スレッドアプリ設定を構築するときに、対象エージェントの Codex app-server ID を使用します。プラグイン有効化はその移行先キャッシュキーを無効化し、その後 `plugin/install` の後に強制更新します。

プラグインアプリは、OpenClaw が安定した所有権を通じて移行済みプラグインにマッピングできる場合にのみ公開されます。

- プラグイン詳細からの正確なアプリ ID
- 既知の MCP サーバー名
- 一意で安定したメタデータ

表示名のみ、またはあいまいな所有権は、次のインベントリ更新で所有権が証明されるまで除外されます。

## スレッドアプリ設定

OpenClaw は、Codex スレッドに制限的な `config.apps` パッチを注入します。
`_default` は無効化され、有効な移行済みプラグインが所有するアプリのみが有効化されます。

OpenClaw は、実効的なグローバルまたはプラグインごとの `allow_destructive_actions` ポリシーからアプリレベルの `destructive_enabled` を設定し、Codex がネイティブアプリツールのアノテーションから破壊的ツールメタデータを強制するようにします。`_default`
アプリ設定は `open_world_enabled: false` で無効化されます。有効なプラグインアプリは
`open_world_enabled: true` で出力されます。OpenClaw は個別のプラグイン open-world ポリシーノブを公開せず、プラグインごとの破壊的ツール名の拒否リストも維持しません。

ツール承認モードは、プラグインアプリではデフォルトで自動です。そのため、非破壊的な読み取りツールは同一スレッド内の承認 UI なしで実行できます。破壊的ツールは、引き続き各アプリの `destructive_enabled` ポリシーによって制御されます。

## 破壊的操作ポリシー

移行済み Codex プラグインでは、破壊的なプラグイン elicitation はデフォルトで許可されますが、安全でないスキーマやあいまいな所有権は引き続き fail closed になります。

- グローバル `allow_destructive_actions` のデフォルトは `true` です。
- プラグインごとの `allow_destructive_actions` は、そのプラグインに対してグローバルポリシーを上書きします。
- ポリシーが `false` の場合、OpenClaw は決定論的な拒否を返します。
- ポリシーが `true` の場合、OpenClaw は、ブール型の approve フィールドなど、承認レスポンスにマッピングできる安全なスキーマのみを自動承認します。
- プラグイン ID の欠落、あいまいな所有権、turn id の欠落、誤った turn
  id、または安全でない elicitation スキーマは、プロンプトを表示せずに拒否されます。

## トラブルシューティング

**`auth_required`:** 移行はプラグインをインストールしましたが、そのアプリの 1 つはまだ認証が必要です。再認可して有効化するまで、明示的なプラグインエントリは無効として書き込まれます。

**`app_inaccessible`、`app_disabled`、または `app_missing`:**
`--verify-plugin-apps` が設定されている間、移行元 Codex アプリインベントリで所有されているすべてのアプリが存在し、有効で、アクセス可能であることが示されなかったため、移行はプラグインをインストールしませんでした。Codex でアプリを再認可または有効化してから、`--verify-plugin-apps` 付きで移行を再実行してください。

**`app_inventory_unavailable`:** 厳格な移行元アプリ検証が要求され、移行元 Codex アプリインベントリの更新に失敗したため、移行はプラグインをインストールしませんでした。移行元 Codex app-server アクセスを修正するか、より高速なアカウントゲート付き計画を受け入れる場合は `--verify-plugin-apps` なしで再試行してください。

**`codex_subscription_required`:** 移行元 Codex app-server アカウントが ChatGPT サブスクリプションアカウントでログインしていなかったため、移行はアプリ基盤のプラグインをインストールしませんでした。サブスクリプション認証で Codex アプリにログインし、移行を再実行してください。

**`codex_account_unavailable`:** 移行元 Codex app-server アカウントを読み取れなかったため、移行はアプリ基盤のプラグインをインストールしませんでした。移行元 Codex
app-server 認証を修正するか、アカウント検索が失敗したときに移行元アプリインベントリで適格性を判断したい場合は、`--verify-plugin-apps` 付きで再実行してください。

**`marketplace_missing` または `plugin_missing`:** 移行先 Codex app-server は、想定される `openai-curated` マーケットプレイスまたはプラグインを参照できません。移行先ランタイムに対して移行を再実行するか、Codex app-server プラグインステータスを確認してください。

**`app_inventory_missing` または `app_inventory_stale`:** アプリの準備状態が空または古いキャッシュから取得されました。OpenClaw は非同期更新をスケジュールし、所有権と準備状態が判明するまでプラグインアプリを除外します。

**`app_ownership_ambiguous`:** アプリインベントリが表示名でしか一致しなかったため、アプリは Codex スレッドに公開されません。

**設定を変更したがエージェントがプラグインを認識できない:** `/new`、`/reset` を使用するか、gateway を再起動してください。既存の Codex スレッドバインディングは、OpenClaw が新しいハーネスセッションを確立するか、古くなったバインディングを置き換えるまで、開始時のアプリ設定を保持します。

**破壊的操作が拒否される:** グローバルおよびプラグインごとの
`allow_destructive_actions` 値を確認してください。ポリシーが true であっても、安全でない elicitation スキーマやあいまいなプラグイン ID は引き続き fail closed になります。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/ja-JP/cli/migrate)
