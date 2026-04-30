---
read_when:
    - Zalo の機能または Webhook に取り組む
summary: Zalo ボットのサポート状況、機能、および設定
title: Zalo
x-i18n:
    generated_at: "2026-04-30T05:02:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: e79a4a27accc7f460bd3ae9c01e8f5f80e21a285af5d89b94bb9c89244a4438f
    source_path: channels/zalo.md
    workflow: 16
---

Status: 実験的。DM はサポートされています。下の[機能](#capabilities)セクションは、現在の Marketplace-bot の挙動を反映しています。

## バンドル済み Plugin

Zalo は現在の OpenClaw リリースではバンドル済み Plugin として同梱されているため、通常のパッケージ化された
ビルドでは別途インストールする必要はありません。

古いビルド、または Zalo を除外したカスタムインストールを使用している場合は、公開されていれば
現在の npm パッケージをインストールしてください。

- CLI 経由でインストール: `openclaw plugins install @openclaw/zalo`
- またはソースチェックアウトから: `openclaw plugins install ./path/to/local/zalo-plugin`
- 詳細: [Plugins](/ja-JP/tools/plugin)

npm が OpenClaw 所有のパッケージを非推奨と報告する場合は、新しい npm パッケージが
公開されるまで、現在のパッケージ化された OpenClaw ビルド、またはローカルチェックアウトパスを使用してください。

## クイックセットアップ（初心者向け）

1. Zalo Plugin が利用可能であることを確認します。
   - 現在のパッケージ化された OpenClaw リリースには、すでに同梱されています。
   - 古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
2. トークンを設定します。
   - Env: `ZALO_BOT_TOKEN=...`
   - または config: `channels.zalo.accounts.default.botToken: "..."`。
3. gateway を再起動します（またはセットアップを完了します）。
4. DM アクセスはデフォルトでペアリングです。初回接触時にペアリングコードを承認します。

最小構成:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## 概要

Zalo はベトナム中心のメッセージングアプリです。その Bot API により、Gateway は 1:1 会話用のボットを実行できます。
Zalo へ確定的にルーティングして戻したいサポートや通知に適しています。

このページは、現在の OpenClaw における **Zalo Bot Creator / Marketplace bots** の挙動を反映しています。
**Zalo Official Account (OA) bots** は別の Zalo プロダクトサーフェスであり、挙動が異なる場合があります。

- Gateway が所有する Zalo Bot API チャンネル。
- 確定的ルーティング: 返信は Zalo に戻ります。モデルがチャンネルを選択することはありません。
- DM はエージェントのメインセッションを共有します。
- 下の[機能](#capabilities)セクションは、現在の Marketplace-bot サポートを示しています。

## セットアップ（高速パス）

### 1) ボットトークンを作成する（Zalo Bot Platform）

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) に移動してサインインします。
2. 新しいボットを作成し、その設定を構成します。
3. 完全なボットトークン（通常は `numeric_id:secret`）をコピーします。Marketplace bots では、使用可能なランタイムトークンが作成後のボットのウェルカムメッセージに表示される場合があります。

### 2) トークンを構成する（env または config）

例:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

後でグループが利用可能な Zalo ボットサーフェスへ移行する場合は、`groupPolicy` や `groupAllowFrom` などのグループ固有の config を明示的に追加できます。現在の Marketplace-bot の挙動については、[機能](#capabilities)を参照してください。

Env オプション: `ZALO_BOT_TOKEN=...`（デフォルトアカウントでのみ機能します）。

マルチアカウントサポート: アカウントごとのトークンと任意の `name` を指定して `channels.zalo.accounts` を使用します。

3. gateway を再起動します。Zalo はトークンが解決されると（env または config）開始します。
4. DM アクセスはデフォルトでペアリングです。ボットに初めて連絡したときにコードを承認します。

## 仕組み（挙動）

- 受信メッセージは、メディアプレースホルダー付きの共有チャンネルエンベロープに正規化されます。
- 返信は常に同じ Zalo チャットへルーティングされます。
- デフォルトはロングポーリングです。`channels.zalo.webhookUrl` による webhook モードも利用できます。

## 制限

- 送信テキストは 2000 文字ごとに分割されます（Zalo API 制限）。
- メディアのダウンロード/アップロードは `channels.zalo.mediaMaxMb`（デフォルト 5）で制限されます。
- 2000 文字制限によりストリーミングの有用性が低くなるため、ストリーミングはデフォルトでブロックされます。

## アクセス制御（DM）

### DM アクセス

- デフォルト: `channels.zalo.dmPolicy = "pairing"`。不明な送信者はペアリングコードを受け取ります。承認されるまでメッセージは無視されます（コードは 1 時間後に期限切れになります）。
- 次で承認します:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- ペアリングはデフォルトのトークン交換です。詳細: [ペアリング](/ja-JP/channels/pairing)
- `channels.zalo.allowFrom` は数値のユーザー ID を受け付けます（ユーザー名検索は利用できません）。

## アクセス制御（グループ）

**Zalo Bot Creator / Marketplace bots** では、ボットをグループにまったく追加できなかったため、グループサポートは実際には利用できませんでした。

つまり、以下のグループ関連 config キーはスキーマに存在しますが、Marketplace bots では使用できませんでした。

- `channels.zalo.groupPolicy` はグループ受信処理を制御します: `open | allowlist | disabled`。
- `channels.zalo.groupAllowFrom` は、グループ内でボットをトリガーできる送信者 ID を制限します。
- `groupAllowFrom` が未設定の場合、Zalo は送信者チェックに `allowFrom` をフォールバックとして使用します。
- ランタイム注記: `channels.zalo` が完全に欠落している場合でも、安全のためランタイムは `groupPolicy="allowlist"` にフォールバックします。

グループポリシー値（ボットサーフェスでグループアクセスが利用可能な場合）は次のとおりです。

- `groupPolicy: "disabled"` — すべてのグループメッセージをブロックします。
- `groupPolicy: "open"` — 任意のグループメンバーを許可します（メンションゲートあり）。
- `groupPolicy: "allowlist"` — フェイルクローズのデフォルト。許可された送信者のみ受け付けます。

別の Zalo ボットプロダクトサーフェスを使用していて、動作するグループ挙動を検証済みの場合は、それが Marketplace-bot フローと一致すると仮定するのではなく、別途文書化してください。

## ロングポーリングと webhook

- デフォルト: ロングポーリング（公開 URL は不要）。
- Webhook モード: `channels.zalo.webhookUrl` と `channels.zalo.webhookSecret` を設定します。
  - webhook secret は 8〜256 文字である必要があります。
  - Webhook URL は HTTPS を使用する必要があります。
  - Zalo は検証用に `X-Bot-Api-Secret-Token` ヘッダー付きでイベントを送信します。
  - Gateway HTTP は `channels.zalo.webhookPath` で webhook リクエストを処理します（デフォルトは webhook URL パス）。
  - リクエストは `Content-Type: application/json`（または `+json` メディアタイプ）を使用する必要があります。
  - 重複イベント（`event_name + message_id`）は短いリプレイウィンドウ中は無視されます。
  - バーストトラフィックはパス/ソースごとにレート制限され、HTTP 429 を返す場合があります。

**注:** Zalo API docs によると、getUpdates（ポーリング）と webhook は Zalo API ごとに相互排他的です。

## サポートされるメッセージタイプ

サポートの簡易スナップショットについては、[機能](#capabilities)を参照してください。以下の注記では、挙動に追加の文脈が必要な箇所を詳しく説明します。

- **テキストメッセージ**: 2000 文字分割を含むフルサポート。
- **テキスト内のプレーン URL**: 通常のテキスト入力と同様に動作します。
- **リンクプレビュー / リッチリンクカード**: [機能](#capabilities)の Marketplace-bot ステータスを参照してください。これらは返信を確実にはトリガーしませんでした。
- **画像メッセージ**: [機能](#capabilities)の Marketplace-bot ステータスを参照してください。受信画像の処理は不安定でした（最終返信なしの入力中インジケーター）。
- **ステッカー**: [機能](#capabilities)の Marketplace-bot ステータスを参照してください。
- **ボイスメモ / 音声ファイル / 動画 / 汎用ファイル添付**: [機能](#capabilities)の Marketplace-bot ステータスを参照してください。
- **サポートされないタイプ**: ログに記録されます（例: 保護されたユーザーからのメッセージ）。

## 機能

この表は、OpenClaw における現在の **Zalo Bot Creator / Marketplace bot** の挙動をまとめたものです。

| 機能                        | ステータス                                  |
| --------------------------- | --------------------------------------- |
| ダイレクトメッセージ        | ✅ サポート                            |
| グループ                    | ❌ Marketplace bots では利用不可   |
| メディア（受信画像）        | ⚠️ 制限あり / 環境で検証してください |
| メディア（送信画像）        | ⚠️ Marketplace bots では再テスト未実施   |
| テキスト内のプレーン URL    | ✅ サポート                            |
| リンクプレビュー            | ⚠️ Marketplace bots では不安定      |
| リアクション                | ❌ 未サポート                        |
| ステッカー                  | ⚠️ Marketplace bots ではエージェント返信なし  |
| ボイスメモ / 音声 / 動画    | ⚠️ Marketplace bots ではエージェント返信なし  |
| ファイル添付                | ⚠️ Marketplace bots ではエージェント返信なし  |
| スレッド                    | ❌ 未サポート                        |
| 投票                        | ❌ 未サポート                        |
| ネイティブコマンド          | ❌ 未サポート                        |
| ストリーミング              | ⚠️ ブロック（2000 文字制限）            |

## 配信先（CLI/cron）

- チャット ID をターゲットとして使用します。
- 例: `openclaw message send --channel zalo --target 123456789 --message "hi"`。

## トラブルシューティング

**ボットが応答しない:**

- トークンが有効であることを確認します: `openclaw channels status --probe`
- 送信者が承認されていることを確認します（pairing または allowFrom）
- gateway ログを確認します: `openclaw logs --follow`

**Webhook がイベントを受信しない:**

- webhook URL が HTTPS を使用していることを確認します
- secret token が 8〜256 文字であることを確認します
- gateway HTTP エンドポイントが構成されたパスで到達可能であることを確認します
- getUpdates ポーリングが実行されていないことを確認します（これらは相互排他的です）

## 設定リファレンス（Zalo）

完全な設定: [設定](/ja-JP/gateway/configuration)

フラットなトップレベルキー（`channels.zalo.botToken`、`channels.zalo.dmPolicy` など）は、レガシーな単一アカウントの省略記法です。新しい configs では `channels.zalo.accounts.<id>.*` を推奨します。どちらの形式もスキーマに存在するため、ここでは両方を文書化しています。

プロバイダーオプション:

- `channels.zalo.enabled`: チャンネル起動を有効/無効にします。
- `channels.zalo.botToken`: Zalo Bot Platform からのボットトークン。
- `channels.zalo.tokenFile`: 通常のファイルパスからトークンを読み取ります。シンボリックリンクは拒否されます。
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.zalo.allowFrom`: DM allowlist（ユーザー ID）。`open` には `"*"` が必要です。ウィザードは数値 ID を求めます。
- `channels.zalo.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。config に存在します。現在の Marketplace-bot の挙動については、[機能](#capabilities)と[アクセス制御（グループ）](#access-control-groups)を参照してください。
- `channels.zalo.groupAllowFrom`: グループ送信者 allowlist（ユーザー ID）。未設定の場合は `allowFrom` にフォールバックします。
- `channels.zalo.mediaMaxMb`: 受信/送信メディア上限（MB、デフォルト 5）。
- `channels.zalo.webhookUrl`: webhook モードを有効にします（HTTPS 必須）。
- `channels.zalo.webhookSecret`: webhook secret（8〜256 文字）。
- `channels.zalo.webhookPath`: gateway HTTP サーバー上の webhook パス。
- `channels.zalo.proxy`: API リクエスト用のプロキシ URL。

マルチアカウントオプション:

- `channels.zalo.accounts.<id>.botToken`: アカウントごとのトークン。
- `channels.zalo.accounts.<id>.tokenFile`: アカウントごとの通常のトークンファイル。シンボリックリンクは拒否されます。
- `channels.zalo.accounts.<id>.name`: 表示名。
- `channels.zalo.accounts.<id>.enabled`: アカウントを有効/無効にします。
- `channels.zalo.accounts.<id>.dmPolicy`: アカウントごとの DM ポリシー。
- `channels.zalo.accounts.<id>.allowFrom`: アカウントごとの allowlist。
- `channels.zalo.accounts.<id>.groupPolicy`: アカウントごとのグループポリシー。config に存在します。現在の Marketplace-bot の挙動については、[機能](#capabilities)と[アクセス制御（グループ）](#access-control-groups)を参照してください。
- `channels.zalo.accounts.<id>.groupAllowFrom`: アカウントごとのグループ送信者 allowlist。
- `channels.zalo.accounts.<id>.webhookUrl`: アカウントごとの webhook URL。
- `channels.zalo.accounts.<id>.webhookSecret`: アカウントごとの webhook secret。
- `channels.zalo.accounts.<id>.webhookPath`: アカウントごとの webhook パス。
- `channels.zalo.accounts.<id>.proxy`: アカウントごとのプロキシ URL。

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされるすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの挙動とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
