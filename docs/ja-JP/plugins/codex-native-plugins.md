---
read_when:
    - Codex モードの OpenClaw エージェントでネイティブ Codex Plugin を使用したい場合
    - ソースからインストールされた openai-curated Codex Plugin を移行しています
    - codexPlugins、アプリインベントリ、破壊的アクション、またはPlugin アプリ診断のトラブルシューティングを行っている場合
summary: Codexモードの OpenClaw エージェント向けに、移行済みネイティブ Codex Plugin を設定する
title: ネイティブ Codex Plugin
x-i18n:
    generated_at: "2026-05-11T20:34:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64e8f552e65b3f1c1c62bc1ba1abfc1bf592d1bdc7fbbe2a484f3eb9955159f0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

ネイティブ Codex Plugin サポートにより、Codex モードの OpenClaw エージェントは、OpenClaw ターンを処理する同じ Codex スレッド内で Codex app-server 独自のアプリと Plugin 機能を使用できます。

OpenClaw は Codex plugins を合成 `codex_plugin_*` OpenClaw 動的ツールへ変換しません。Plugin 呼び出しはネイティブ Codex トランスクリプト内に残り、Codex app-server がアプリに基づく MCP 実行を所有します。

ベースの [Codex harness](/ja-JP/plugins/codex-harness) が動作してから、このページを使用してください。

## 要件

- 選択された OpenClaw エージェントランタイムはネイティブ Codex harness である必要があります。
- `plugins.entries.codex.enabled` は true である必要があります。
- `plugins.entries.codex.config.codexPlugins.enabled` は true である必要があります。
- V1 は、移行がソース Codex home にソースインストール済みとして観測した `openai-curated` plugins のみをサポートします。
- ターゲットの Codex app-server は、想定される marketplace、Plugin、アプリインベントリを参照できる必要があります。

`codexPlugins` は、PI 実行、通常の OpenAI provider 実行、ACP 会話バインディング、またはその他の harness には効果がありません。これらのパスはネイティブ `apps` 設定を持つ Codex app-server スレッドを作成しないためです。

## クイックスタート

ソース Codex home からの移行をプレビューします。

```bash
openclaw migrate codex --dry-run
```

プランが正しく見えたら移行を適用します。

```bash
openclaw migrate apply codex --yes
```

移行は、対象となる plugins に明示的な `codexPlugins` エントリを書き込み、選択された plugins に対して Codex app-server `plugin/install` を呼び出します。典型的な移行済み設定は次のようになります。

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

`codexPlugins` を変更した後は、以後の Codex harness セッションが更新されたアプリセットで開始されるように、`/new`、`/reset` を使用するか、Gateway を再起動してください。

## ネイティブ Plugin セットアップの仕組み

この統合には 3 つの独立した状態があります。

- インストール済み: Codex はターゲット app-server ランタイム内にローカル Plugin バンドルを持っています。
- 有効: OpenClaw 設定は、その Plugin を Codex harness ターンで利用可能にすることを許可しています。
- アクセス可能: Codex app-server は、Plugin のアプリエントリがアクティブアカウントで利用可能であり、移行済み Plugin ID にマッピングできることを確認しています。

移行は、永続的なインストールおよび対象判定ステップです。ランタイムアプリインベントリはアクセシビリティチェックです。その後、Codex harness セッションセットアップが、有効かつアクセス可能な Plugin アプリ用の制限的なスレッドアプリ設定を計算します。

スレッドアプリ設定は、OpenClaw が Codex harness セッションを確立するとき、または古くなった Codex スレッドバインディングを置き換えるときに計算されます。ターンごとには再計算されません。

## V1 サポート境界

V1 は意図的に狭くなっています。

- ソース Codex app-server インベントリにすでにインストールされていた `openai-curated` plugins のみが移行対象です。
- 移行は `marketplaceName` と `pluginName` を持つ明示的な Plugin ID を書き込みます。ローカル `marketplacePath` キャッシュパスは書き込みません。
- `codexPlugins.enabled` はグローバルな有効化スイッチです。
- `plugins["*"]` ワイルドカードはなく、任意のインストール権限を付与する設定キーもありません。
- サポート対象外の marketplaces、キャッシュされた Plugin バンドル、hooks、Codex 設定ファイルは、手動レビュー用に移行レポートに保持されます。

## アプリインベントリと所有権

OpenClaw は app-server `app/list` を通じて Codex アプリインベントリを読み取り、1 時間キャッシュし、古いエントリや欠落したエントリを非同期に更新します。

Plugin アプリは、OpenClaw が安定した所有権を通じて移行済み Plugin にマッピングし直せる場合にのみ公開されます。

- Plugin 詳細からの正確なアプリ id
- 既知の MCP サーバー名
- 一意で安定したメタデータ

表示名のみ、またはあいまいな所有権は、次回のインベントリ更新で所有権が証明されるまで除外されます。

## スレッドアプリ設定

OpenClaw は Codex スレッドに制限的な `config.apps` パッチを注入します。`_default` は無効化され、有効な移行済み plugins が所有するアプリのみが有効化されます。

OpenClaw は、有効なグローバルまたは Plugin ごとの `allow_destructive_actions` ポリシーからアプリレベルの `destructive_enabled` を設定し、Codex がネイティブアプリツールアノテーションから破壊的ツールメタデータを適用できるようにします。`_default` アプリ設定は `open_world_enabled: false` で無効化されます。有効な Plugin アプリは `open_world_enabled: true` で出力されます。OpenClaw は別個の Plugin open-world ポリシーノブを公開せず、Plugin ごとの破壊的ツール名拒否リストも保持しません。

ツール承認モードは、Plugin アプリではデフォルトで自動です。そのため、非破壊的な読み取りツールは同一スレッドの承認 UI なしで実行できます。破壊的ツールは引き続き各アプリの `destructive_enabled` ポリシーによって制御されます。

## 破壊的アクションポリシー

破壊的な Plugin elicitation はデフォルトでフェイルクローズします。

- グローバル `allow_destructive_actions` のデフォルトは `false` です。
- Plugin ごとの `allow_destructive_actions` は、その Plugin に対してグローバルポリシーを上書きします。
- ポリシーが `false` の場合、OpenClaw は決定的な拒否を返します。
- ポリシーが `true` の場合、OpenClaw は、boolean approve フィールドなど、承認レスポンスにマッピングできる安全なスキーマのみを自動承認します。
- Plugin ID の欠落、あいまいな所有権、ターン id の欠落、誤ったターン id、または安全でない elicitation スキーマは、プロンプトせずに拒否します。

## トラブルシューティング

**`auth_required`:** 移行により Plugin はインストールされましたが、そのアプリの 1 つがまだ認証を必要としています。再認証して有効化するまで、明示的な Plugin エントリは disabled として書き込まれます。

**`marketplace_missing` または `plugin_missing`:** ターゲット Codex app-server が、想定される `openai-curated` marketplace または Plugin を参照できません。ターゲットランタイムに対して移行を再実行するか、Codex app-server の Plugin ステータスを調べてください。

**`app_inventory_missing` または `app_inventory_stale`:** アプリの準備状況が空または古いキャッシュから得られました。OpenClaw は非同期更新をスケジュールし、所有権と準備状況が判明するまで Plugin アプリを除外します。

**`app_ownership_ambiguous`:** アプリインベントリは表示名のみで一致したため、そのアプリは Codex スレッドに公開されません。

**設定を変更したがエージェントが Plugin を認識できない:** `/new`、`/reset` を使用するか、Gateway を再起動してください。既存の Codex スレッドバインディングは、OpenClaw が新しい harness セッションを確立するか、古くなったバインディングを置き換えるまで、開始時のアプリ設定を保持します。

**破壊的アクションが拒否される:** グローバルおよび Plugin ごとの `allow_destructive_actions` 値を確認してください。ポリシーが true の場合でも、安全でない elicitation スキーマやあいまいな Plugin ID は引き続きフェイルクローズします。

## 関連

- [Codex harness](/ja-JP/plugins/codex-harness)
- [Codex harness リファレンス](/ja-JP/plugins/codex-harness-reference)
- [Codex harness ランタイム](/ja-JP/plugins/codex-harness-runtime)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/ja-JP/cli/migrate)
