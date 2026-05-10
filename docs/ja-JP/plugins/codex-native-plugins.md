---
read_when:
    - Codex モードの OpenClaw エージェントにネイティブ Codex plugins を使用させたい場合
    - ソースからインストールされた、OpenAI がキュレーションした Codex プラグインを移行しています
    - codexPlugins、アプリインベントリ、破壊的操作、またはPluginアプリ診断のトラブルシューティングを行っている
summary: Codex モードの OpenClaw エージェント向けに移行済みネイティブ Codex Plugin を設定する
title: ネイティブ Codex Plugin
x-i18n:
    generated_at: "2026-05-10T19:43:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b9116a479ffb68e3566f6113d9ec9d2a3c33df2dd27ff539f2f27110c7b9d9f
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

ネイティブ Codex Plugin サポートにより、Codex モードの OpenClaw エージェントは、OpenClaw のターンを処理する同じ Codex スレッド内で、Codex app-server 独自のアプリと Plugin 機能を使用できます。

OpenClaw は Codex Plugin を合成された `codex_plugin_*` OpenClaw 動的ツールへ変換しません。Plugin 呼び出しはネイティブ Codex トランスクリプト内に残り、アプリに裏付けられた MCP 実行は Codex app-server が所有します。

ベースの [Codex harness](/ja-JP/plugins/codex-harness) が動作した後に、このページを使用してください。

## 要件

- 選択された OpenClaw エージェントランタイムはネイティブ Codex harness である必要があります。
- `plugins.entries.codex.enabled` は true である必要があります。
- `plugins.entries.codex.config.codexPlugins.enabled` は true である必要があります。
- V1 は、移行がソース Codex ホームにソースインストール済みとして確認した `openai-curated` Plugin のみをサポートします。
- ターゲットの Codex app-server は、期待されるマーケットプレイス、Plugin、アプリのインベントリを参照できる必要があります。

`codexPlugins` は、PI 実行、通常の OpenAI プロバイダー実行、ACP 会話バインディング、その他の harness には効果がありません。これらのパスはネイティブ `apps` 設定を持つ Codex app-server スレッドを作成しないためです。

## クイックスタート

ソース Codex ホームからの移行をプレビューします。

```bash
openclaw migrate codex --dry-run
```

計画が正しそうな場合は、移行を適用します。

```bash
openclaw migrate apply codex --yes
```

移行は、対象 Plugin に対して明示的な `codexPlugins` エントリを書き込み、選択された Plugin について Codex app-server `plugin/install` を呼び出します。典型的な移行済み設定は次のようになります。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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

`codexPlugins` を変更した後は、将来の Codex harness セッションが更新されたアプリセットで開始されるように、`/new`、`/reset` を使用するか、Gateway を再起動してください。

## ネイティブ Plugin セットアップの仕組み

この統合には、3 つの別々の状態があります。

- インストール済み: Codex がターゲット app-server ランタイム内にローカル Plugin バンドルを持っています。
- 有効: OpenClaw 設定が、その Plugin を Codex harness ターンで利用可能にすることを許可しています。
- アクセス可能: Codex app-server が、その Plugin のアプリエントリがアクティブアカウントで利用可能であり、移行済み Plugin ID にマッピングできることを確認しています。

移行は、永続的なインストールおよび適格性のステップです。ランタイムアプリインベントリは、アクセス可能性の確認です。その後、Codex harness セッションセットアップが、有効かつアクセス可能な Plugin アプリに対して制限的なスレッドアプリ設定を計算します。

スレッドアプリ設定は、OpenClaw が Codex harness セッションを確立するか、古い Codex スレッドバインディングを置き換えるときに計算されます。ターンごとには再計算されません。

## V1 サポート境界

V1 は意図的に範囲を狭くしています。

- ソース Codex app-server インベントリにすでにインストールされていた `openai-curated` Plugin のみが、移行対象になります。
- 移行は `marketplaceName` と `pluginName` を持つ明示的な Plugin ID を書き込みます。ローカルの `marketplacePath` キャッシュパスは書き込みません。
- `codexPlugins.enabled` はグローバルな有効化スイッチです。
- `plugins["*"]` ワイルドカードはなく、任意のインストール権限を付与する設定キーもありません。
- サポートされていないマーケットプレイス、キャッシュされた Plugin バンドル、フック、Codex 設定ファイルは、手動レビュー用に移行レポートに保持されます。

## アプリインベントリと所有権

OpenClaw は app-server `app/list` を通じて Codex アプリインベントリを読み取り、1 時間キャッシュし、古いエントリや欠落したエントリを非同期で更新します。

Plugin アプリは、OpenClaw が安定した所有権を通じて移行済み Plugin にマッピングし直せる場合にのみ公開されます。

- Plugin 詳細からの正確なアプリ ID
- 既知の MCP サーバー名
- 一意で安定したメタデータ

表示名のみ、または曖昧な所有権は、次のインベントリ更新で所有権が証明されるまで除外されます。

## スレッドアプリ設定

OpenClaw は、Codex スレッドに対して制限的な `config.apps` パッチを注入します。`_default` は無効化され、有効な移行済み Plugin が所有するアプリのみが有効化されます。

OpenClaw は、有効なグローバルまたは Plugin ごとの `allow_destructive_actions` ポリシーからアプリレベルの `destructive_enabled` を設定し、Codex がネイティブアプリツール注釈から破壊的ツールメタデータを強制するようにします。`_default` アプリ設定は `open_world_enabled: false` で無効化されます。有効な Plugin アプリは `open_world_enabled: true` で出力されます。OpenClaw は個別の Plugin open-world ポリシーノブを公開せず、Plugin ごとの破壊的ツール名拒否リストも維持しません。

OpenClaw はこの同一スレッドパスに対話型のアプリ誘導 UI を持たないため、Plugin アプリのツール承認モードはデフォルトでプロンプト表示されます。

## 破壊的アクションポリシー

破壊的な Plugin 誘導は、デフォルトで安全側に失敗します。

- グローバルな `allow_destructive_actions` のデフォルトは `false` です。
- Plugin ごとの `allow_destructive_actions` は、その Plugin に対してグローバルポリシーを上書きします。
- ポリシーが `false` の場合、OpenClaw は決定論的な拒否を返します。
- ポリシーが `true` の場合、OpenClaw は、ブール値の承認フィールドなど、承認レスポンスにマッピングできる安全なスキーマのみを自動承認します。
- Plugin ID の欠落、曖昧な所有権、ターン ID の欠落、誤ったターン ID、または安全でない誘導スキーマは、プロンプトを表示せずに拒否されます。

## トラブルシューティング

**`auth_required`:** 移行によって Plugin はインストールされましたが、そのアプリのいずれかにまだ認証が必要です。再認可して有効化するまで、明示的な Plugin エントリは無効として書き込まれます。

**`marketplace_missing` または `plugin_missing`:** ターゲットの Codex app-server が、期待される `openai-curated` マーケットプレイスまたは Plugin を参照できません。ターゲットランタイムに対して移行を再実行するか、Codex app-server の Plugin ステータスを調査してください。

**`app_inventory_missing` または `app_inventory_stale`:** アプリ準備状態が空または古いキャッシュから取得されました。OpenClaw は非同期更新をスケジュールし、所有権と準備状態が判明するまで Plugin アプリを除外します。

**`app_ownership_ambiguous`:** アプリインベントリが表示名でのみ一致したため、そのアプリは Codex スレッドに公開されません。

**設定を変更したがエージェントが Plugin を認識できない:** `/new`、`/reset` を使用するか、Gateway を再起動してください。既存の Codex スレッドバインディングは、OpenClaw が新しい harness セッションを確立するか古いバインディングを置き換えるまで、開始時のアプリ設定を保持します。

**破壊的アクションが拒否される:** グローバルおよび Plugin ごとの `allow_destructive_actions` 値を確認してください。ポリシーが true の場合でも、安全でない誘導スキーマや曖昧な Plugin ID は安全側に失敗します。

## 関連

- [Codex harness](/ja-JP/plugins/codex-harness)
- [Codex harness リファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex harness ランタイム](/ja-JP/plugins/codex-harness-runtime)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#codex-harness-plugin-config)
- [移行 CLI](/ja-JP/cli/migrate)
