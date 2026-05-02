---
read_when:
    - Zalo の機能または Webhook に取り組む
summary: Zalo ボットのサポート状況、機能、設定
title: Zalo
x-i18n:
    generated_at: "2026-05-02T22:16:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6226af1217e1e8b03b485df99f6375872b487f7040c091f2bb2d85e18dec75d0
    source_path: channels/zalo.md
    workflow: 16
---

ステータス: 実験的。DM はサポートされています。下の[機能](#capabilities)セクションは、現在の Marketplace ボットの挙動を反映しています。

## バンドルされたPlugin

Zalo は現在の OpenClaw リリースではバンドルされたPluginとして提供されるため、通常のパッケージ化された
ビルドでは個別のインストールは不要です。

古いビルドを使っている場合、または Zalo を除外したカスタムインストールを使っている場合は、
npm パッケージを直接インストールしてください。

- CLI 経由でインストール: `openclaw plugins install @openclaw/zalo`
- 固定バージョン: `openclaw plugins install @openclaw/zalo@2026.5.2`
- またはソースチェックアウトから: `openclaw plugins install ./path/to/local/zalo-plugin`
- 詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ（初心者向け）

1. Zalo Plugin が利用可能であることを確認します。
   - 現在のパッケージ化された OpenClaw リリースにはすでにバンドルされています。
   - 古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
2. トークンを設定します:
   - Env: `ZALO_BOT_TOKEN=...`
   - または設定: `channels.zalo.accounts.default.botToken: "..."`。
3. Gateway を再起動します（またはセットアップを完了します）。
4. DM アクセスはデフォルトでペアリングです。初回接触時にペアリングコードを承認します。

最小設定:

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

Zalo はベトナム向けのメッセージングアプリです。その Bot API により、Gateway は 1:1 会話用のボットを実行できます。
Zalo への決定論的なルーティングを必要とするサポートや通知に適しています。

このページは、現在の OpenClaw の **Zalo Bot Creator / Marketplace ボット**の挙動を反映しています。
**Zalo Official Account (OA) ボット**は別の Zalo 製品サーフェスであり、挙動が異なる場合があります。

- Gateway が所有する Zalo Bot API チャネル。
- 決定論的ルーティング: 返信は Zalo に戻ります。モデルがチャネルを選ぶことはありません。
- DM はエージェントのメインセッションを共有します。
- 下の[機能](#capabilities)セクションは、現在の Marketplace ボットサポートを示します。

## セットアップ（最短手順）

### 1) ボットトークンを作成する（Zalo Bot Platform）

1. [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) に移動してサインインします。
2. 新しいボットを作成し、その設定を構成します。
3. 完全なボットトークン（通常は `numeric_id:secret`）をコピーします。Marketplace ボットでは、作成後のボットのウェルカムメッセージに、利用可能なランタイムトークンが表示される場合があります。

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

後でグループが利用可能な Zalo ボットサーフェスに移行する場合は、`groupPolicy` や `groupAllowFrom` などのグループ固有設定を明示的に追加できます。現在の Marketplace ボットの挙動については、[機能](#capabilities)を参照してください。

Env オプション: `ZALO_BOT_TOKEN=...`（デフォルトアカウントでのみ動作します）。

マルチアカウントサポート: アカウントごとのトークンと任意の `name` を指定して `channels.zalo.accounts` を使います。

3. Gateway を再起動します。Zalo はトークンが解決されると起動します（env または config）。
4. DM アクセスはデフォルトでペアリングです。ボットが最初に接触されたときにコードを承認します。

## 仕組み（挙動）

- 受信メッセージは、メディアプレースホルダー付きの共有チャネルエンベロープに正規化されます。
- 返信は常に同じ Zalo チャットにルーティングされます。
- デフォルトはロングポーリングです。`channels.zalo.webhookUrl` で webhook モードも利用できます。

## 制限

- 送信テキストは 2000 文字に分割されます（Zalo API の制限）。
- メディアのダウンロード/アップロードは `channels.zalo.mediaMaxMb`（デフォルト 5）で制限されます。
- 2000 文字制限によりストリーミングの有用性が低いため、ストリーミングはデフォルトでブロックされます。

## アクセス制御（DM）

### DM アクセス

- デフォルト: `channels.zalo.dmPolicy = "pairing"`。不明な送信者にはペアリングコードが送信されます。承認されるまでメッセージは無視されます（コードは 1 時間後に期限切れになります）。
- 承認方法:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- ペアリングはデフォルトのトークン交換です。詳細: [ペアリング](/ja-JP/channels/pairing)
- `channels.zalo.allowFrom` は数値ユーザー ID を受け付けます（ユーザー名検索は利用できません）。

## アクセス制御（グループ）

**Zalo Bot Creator / Marketplace ボット**では、ボットをグループに追加できなかったため、実際にはグループサポートは利用できませんでした。

つまり、以下のグループ関連設定キーはスキーマには存在しますが、Marketplace ボットでは使用できませんでした。

- `channels.zalo.groupPolicy` はグループ受信処理を制御します: `open | allowlist | disabled`。
- `channels.zalo.groupAllowFrom` は、グループ内でボットをトリガーできる送信者 ID を制限します。
- `groupAllowFrom` が未設定の場合、Zalo は送信者チェックで `allowFrom` にフォールバックします。
- ランタイム注記: `channels.zalo` が完全に欠落している場合でも、安全のためランタイムは `groupPolicy="allowlist"` にフォールバックします。

グループポリシー値（ボットサーフェスでグループアクセスが利用可能な場合）は次のとおりです。

- `groupPolicy: "disabled"` — すべてのグループメッセージをブロックします。
- `groupPolicy: "open"` — 任意のグループメンバーを許可します（メンションゲート付き）。
- `groupPolicy: "allowlist"` — フェイルクローズのデフォルトです。許可された送信者のみ受け入れます。

別の Zalo ボット製品サーフェスを使用していて、グループ挙動が動作することを確認済みの場合は、それが Marketplace ボットのフローと一致すると仮定せず、別途文書化してください。

## ロングポーリング vs webhook

- デフォルト: ロングポーリング（公開 URL は不要）。
- Webhook モード: `channels.zalo.webhookUrl` と `channels.zalo.webhookSecret` を設定します。
  - webhook シークレットは 8〜256 文字である必要があります。
  - Webhook URL は HTTPS を使用する必要があります。
  - Zalo は検証用に `X-Bot-Api-Secret-Token` ヘッダー付きでイベントを送信します。
  - Gateway HTTP は `channels.zalo.webhookPath` で webhook リクエストを処理します（デフォルトは webhook URL パス）。
  - リクエストは `Content-Type: application/json`（または `+json` メディアタイプ）を使用する必要があります。
  - 重複イベント（`event_name + message_id`）は短いリプレイウィンドウ内では無視されます。
  - バーストトラフィックはパス/ソースごとにレート制限され、HTTP 429 を返す場合があります。

**注:** Zalo API ドキュメントでは、getUpdates（ポーリング）と webhook は相互に排他的です。

## サポートされるメッセージタイプ

サポート状況の簡単なスナップショットについては、[機能](#capabilities)を参照してください。以下の注記は、挙動に追加の文脈が必要な箇所を詳述します。

- **テキストメッセージ**: 2000 文字分割付きで完全サポート。
- **テキスト内のプレーン URL**: 通常のテキスト入力と同様に動作します。
- **リンクプレビュー / リッチリンクカード**: [機能](#capabilities)の Marketplace ボットのステータスを参照してください。安定して返信をトリガーしませんでした。
- **画像メッセージ**: [機能](#capabilities)の Marketplace ボットのステータスを参照してください。受信画像処理は不安定でした（最終返信なしで入力中インジケーターのみ）。
- **ステッカー**: [機能](#capabilities)の Marketplace ボットのステータスを参照してください。
- **ボイスメモ / 音声ファイル / 動画 / 汎用ファイル添付**: [機能](#capabilities)の Marketplace ボットのステータスを参照してください。
- **未サポートタイプ**: ログに記録されます（例: 保護されたユーザーからのメッセージ）。

## 機能

この表は、OpenClaw における現在の **Zalo Bot Creator / Marketplace ボット**の挙動をまとめたものです。

| 機能                        | ステータス                              |
| --------------------------- | --------------------------------------- |
| ダイレクトメッセージ        | ✅ サポート済み                         |
| グループ                    | ❌ Marketplace ボットでは利用不可       |
| メディア（受信画像）        | ⚠️ 限定的 / 環境で検証してください      |
| メディア（送信画像）        | ⚠️ Marketplace ボットでは再テスト未実施 |
| テキスト内のプレーン URL    | ✅ サポート済み                         |
| リンクプレビュー            | ⚠️ Marketplace ボットでは不安定         |
| リアクション                | ❌ 未サポート                           |
| ステッカー                  | ⚠️ Marketplace ボットではエージェント返信なし |
| ボイスメモ / 音声 / 動画    | ⚠️ Marketplace ボットではエージェント返信なし |
| ファイル添付                | ⚠️ Marketplace ボットではエージェント返信なし |
| スレッド                    | ❌ 未サポート                           |
| 投票                        | ❌ 未サポート                           |
| ネイティブコマンド          | ❌ 未サポート                           |
| ストリーミング              | ⚠️ ブロック（2000 文字制限）            |

## 配信ターゲット（CLI/cron）

- chat id をターゲットとして使います。
- 例: `openclaw message send --channel zalo --target 123456789 --message "hi"`。

## トラブルシューティング

**ボットが応答しない:**

- トークンが有効であることを確認します: `openclaw channels status --probe`
- 送信者が承認済みであることを確認します（ペアリングまたは allowFrom）
- Gateway ログを確認します: `openclaw logs --follow`

**Webhook がイベントを受信しない:**

- webhook URL が HTTPS を使用していることを確認します
- シークレットトークンが 8〜256 文字であることを確認します
- Gateway HTTP エンドポイントが設定済みパスで到達可能であることを確認します
- getUpdates ポーリングが実行されていないことを確認します（両者は相互に排他的です）

## 設定リファレンス（Zalo）

完全な設定: [設定](/ja-JP/gateway/configuration)

フラットなトップレベルキー（`channels.zalo.botToken`、`channels.zalo.dmPolicy` など）は、レガシーな単一アカウントの省略記法です。新しい設定では `channels.zalo.accounts.<id>.*` を推奨します。両方の形式はスキーマに存在するため、ここでは引き続き文書化しています。

プロバイダーオプション:

- `channels.zalo.enabled`: チャネル起動を有効/無効にします。
- `channels.zalo.botToken`: Zalo Bot Platform からのボットトークン。
- `channels.zalo.tokenFile`: 通常ファイルパスからトークンを読み取ります。シンボリックリンクは拒否されます。
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.zalo.allowFrom`: DM 許可リスト（ユーザー ID）。`open` には `"*"` が必要です。ウィザードは数値 ID を尋ねます。
- `channels.zalo.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。設定には存在します。現在の Marketplace ボットの挙動については、[機能](#capabilities)と[アクセス制御（グループ）](#access-control-groups)を参照してください。
- `channels.zalo.groupAllowFrom`: グループ送信者の許可リスト（ユーザー ID）。未設定の場合は `allowFrom` にフォールバックします。
- `channels.zalo.mediaMaxMb`: 受信/送信メディア上限（MB、デフォルト 5）。
- `channels.zalo.webhookUrl`: webhook モードを有効にします（HTTPS 必須）。
- `channels.zalo.webhookSecret`: webhook シークレット（8〜256 文字）。
- `channels.zalo.webhookPath`: Gateway HTTP サーバー上の webhook パス。
- `channels.zalo.proxy`: API リクエスト用プロキシ URL。

マルチアカウントオプション:

- `channels.zalo.accounts.<id>.botToken`: アカウントごとのトークン。
- `channels.zalo.accounts.<id>.tokenFile`: アカウントごとの通常トークンファイル。シンボリックリンクは拒否されます。
- `channels.zalo.accounts.<id>.name`: 表示名。
- `channels.zalo.accounts.<id>.enabled`: アカウントを有効/無効にします。
- `channels.zalo.accounts.<id>.dmPolicy`: アカウントごとの DM ポリシー。
- `channels.zalo.accounts.<id>.allowFrom`: アカウントごとの許可リスト。
- `channels.zalo.accounts.<id>.groupPolicy`: アカウントごとのグループポリシー。設定には存在します。現在の Marketplace ボットの挙動については、[機能](#capabilities)と[アクセス制御（グループ）](#access-control-groups)を参照してください。
- `channels.zalo.accounts.<id>.groupAllowFrom`: アカウントごとのグループ送信者許可リスト。
- `channels.zalo.accounts.<id>.webhookUrl`: アカウントごとの webhook URL。
- `channels.zalo.accounts.<id>.webhookSecret`: アカウントごとの webhook シークレット。
- `channels.zalo.accounts.<id>.webhookPath`: アカウントごとの webhook パス。
- `channels.zalo.accounts.<id>.proxy`: アカウントごとのプロキシ URL。

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされるすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの挙動とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとハードニング
