---
read_when:
    - CodexモードのOpenClawエージェントにネイティブのCodexプラグインを使用させる
    - ソースからインストールされた openai-curated Codex Plugin を移行しています
    - codexPlugins、アプリインベントリ、破壊的アクション、または Plugin アプリ診断のトラブルシューティングをしている
summary: 移行済みのネイティブ Codex Plugin を Codex モードの OpenClaw エージェント向けに構成する
title: ネイティブ Codex Plugin
x-i18n:
    generated_at: "2026-05-12T00:59:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4cc1c7b6a97c6eb27eb10a7b14261ecfd398eff58fbd26cc2979a31e6f6a6c4
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

ネイティブ Codex Plugin サポートにより、Codex モードの OpenClaw エージェントは、OpenClaw ターンを処理する同じ Codex スレッド内で、Codex app-server 独自のアプリと Plugin 機能を使用できます。

OpenClaw は Codex Plugin を合成 `codex_plugin_*` OpenClaw 動的ツールへ変換しません。Plugin 呼び出しはネイティブ Codex トランスクリプト内に残り、アプリに支えられた MCP 実行は Codex app-server が所有します。

ベースの [Codex ハーネス](/ja-JP/plugins/codex-harness) が動作してから、このページを使用してください。

## 要件

- 選択した OpenClaw エージェントランタイムはネイティブ Codex ハーネスである必要があります。
- `plugins.entries.codex.enabled` は true である必要があります。
- `plugins.entries.codex.config.codexPlugins.enabled` は true である必要があります。
- V1 は、移行がソース Codex ホームにソースインストール済みとして確認した `openai-curated` Plugin のみをサポートします。
- 対象の Codex app-server は、想定されるマーケットプレイス、Plugin、アプリインベントリを参照できる必要があります。

`codexPlugins` は、PI 実行、通常の OpenAI プロバイダー実行、ACP 会話バインディング、またはその他のハーネスには影響しません。これらのパスはネイティブ `apps` 設定を持つ Codex app-server スレッドを作成しないためです。

## クイックスタート

ソース Codex ホームから移行をプレビューします。

```bash
openclaw migrate codex --dry-run
```

計画が正しければ、移行を適用します。

```bash
openclaw migrate apply codex --yes
```

移行は、対象となる Plugin に明示的な `codexPlugins` エントリを書き込み、選択された Plugin に対して Codex app-server `plugin/install` を呼び出します。一般的な移行後の設定は次のようになります。

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

`codexPlugins` を変更した後は、今後の Codex ハーネスセッションが更新されたアプリセットで開始されるように、`/new`、`/reset` を使用するか、Gateway を再起動してください。

## ネイティブ Plugin セットアップの仕組み

この連携には 3 つの個別の状態があります。

- インストール済み: Codex が対象 app-server ランタイム内にローカル Plugin バンドルを持っています。
- 有効: OpenClaw 設定が、その Plugin を Codex ハーネスターンで利用可能にすることを許可しています。
- アクセス可能: Codex app-server が、その Plugin のアプリエントリがアクティブなアカウントで利用可能であり、移行された Plugin ID にマッピングできることを確認しています。

移行は、永続的なインストールと適格性のステップです。ランタイムアプリインベントリはアクセシビリティチェックです。その後、Codex ハーネスセッションのセットアップは、有効かつアクセス可能な Plugin アプリに対して制限的なスレッドアプリ設定を計算します。

スレッドアプリ設定は、OpenClaw が Codex ハーネスセッションを確立するとき、または古くなった Codex スレッドバインディングを置き換えるときに計算されます。毎ターン再計算されるわけではありません。

## V1 サポート範囲

V1 は意図的に限定されています。

- ソース Codex app-server インベントリにすでにインストールされていた `openai-curated` Plugin のみが移行対象です。
- 移行は `marketplaceName` と `pluginName` を持つ明示的な Plugin ID を書き込みます。ローカル `marketplacePath` キャッシュパスは書き込みません。
- `codexPlugins.enabled` はグローバルな有効化スイッチです。
- `plugins["*"]` ワイルドカードはなく、任意のインストール権限を付与する設定キーもありません。
- サポートされていないマーケットプレイス、キャッシュされた Plugin バンドル、フック、Codex 設定ファイルは、手動レビュー用に移行レポートに保持されます。

## アプリインベントリと所有権

OpenClaw は Codex アプリインベントリを app-server `app/list` 経由で読み取り、1 時間キャッシュし、古いエントリや欠落しているエントリを非同期で更新します。

Plugin アプリは、OpenClaw が安定した所有権を通じて、移行された Plugin にマッピングし直せる場合にのみ公開されます。

- Plugin 詳細からの正確なアプリ ID
- 既知の MCP サーバー名
- 一意で安定したメタデータ

表示名のみ、または曖昧な所有権は、次のインベントリ更新で所有権が証明されるまで除外されます。

## スレッドアプリ設定

OpenClaw は Codex スレッドに制限的な `config.apps` パッチを注入します。`_default` は無効化され、有効な移行済み Plugin が所有するアプリのみが有効化されます。

OpenClaw は、有効なグローバルまたは Plugin ごとの `allow_destructive_actions` ポリシーからアプリレベルの `destructive_enabled` を設定し、ネイティブアプリツール注釈から破壊的ツールのメタデータを Codex に強制させます。`_default` アプリ設定は `open_world_enabled: false` で無効化されます。有効化された Plugin アプリは `open_world_enabled: true` で出力されます。OpenClaw は個別の Plugin オープンワールドポリシーノブを公開せず、Plugin ごとの破壊的ツール名拒否リストも維持しません。

Plugin アプリでは、ツール承認モードはデフォルトで自動です。そのため、非破壊的な読み取りツールは同一スレッドの承認 UI なしで実行できます。破壊的ツールは引き続き各アプリの `destructive_enabled` ポリシーによって制御されます。

## 破壊的アクションポリシー

移行済み Codex Plugin では、破壊的な Plugin 要求はデフォルトで許可されます。一方で、安全でないスキーマや曖昧な所有権は引き続き失敗クローズになります。

- グローバル `allow_destructive_actions` のデフォルトは `true` です。
- Plugin ごとの `allow_destructive_actions` は、その Plugin についてグローバルポリシーを上書きします。
- ポリシーが `false` の場合、OpenClaw は決定的な拒否を返します。
- ポリシーが `true` の場合、OpenClaw は、ブールの承認フィールドなど、承認レスポンスにマッピングできる安全なスキーマのみを自動承認します。
- Plugin ID の欠落、曖昧な所有権、ターン ID の欠落、誤ったターン ID、または安全でない要求スキーマは、プロンプトを表示する代わりに拒否されます。

## トラブルシューティング

**`auth_required`:** 移行により Plugin はインストールされましたが、そのアプリの 1 つがまだ認証を必要としています。再認可して有効化するまで、明示的な Plugin エントリは無効として書き込まれます。

**`marketplace_missing` または `plugin_missing`:** 対象の Codex app-server が、想定される `openai-curated` マーケットプレイスまたは Plugin を参照できません。対象ランタイムに対して移行を再実行するか、Codex app-server の Plugin ステータスを調査してください。

**`app_inventory_missing` または `app_inventory_stale`:** アプリの準備状態が空または古いキャッシュから取得されました。OpenClaw は非同期更新をスケジュールし、所有権と準備状態が判明するまで Plugin アプリを除外します。

**`app_ownership_ambiguous`:** アプリインベントリが表示名でのみ一致したため、そのアプリは Codex スレッドに公開されません。

**設定を変更したがエージェントが Plugin を参照できない:** `/new`、`/reset` を使用するか、Gateway を再起動してください。既存の Codex スレッドバインディングは、OpenClaw が新しいハーネスセッションを確立するか、古くなったバインディングを置き換えるまで、開始時のアプリ設定を保持します。

**破壊的アクションが拒否される:** グローバルおよび Plugin ごとの `allow_destructive_actions` 値を確認してください。ポリシーが true の場合でも、安全でない要求スキーマや曖昧な Plugin ID は引き続き失敗クローズになります。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#codex-harness-plugin-config)
- [移行 CLI](/ja-JP/cli/migrate)
