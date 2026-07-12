---
read_when:
    - Nextcloud Talk チャンネル機能の開発
summary: Nextcloud Talk のサポート状況、機能、設定
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-11T21:57:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk は、Talk Webhook ボットを通じて OpenClaw をセルフホスト型 Nextcloud インスタンスに接続する、ダウンロード可能なチャンネル Plugin（`@openclaw/nextcloud-talk`）です。ダイレクトメッセージ、ルーム、リアクション、Markdown メッセージに対応しています。メディアは URL として送信されます。

## インストール

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

現在の公式リリースタグに追従するには、バージョンなしのパッケージ指定を使用します。再現可能なインストールが必要な場合のみ、正確なバージョンを固定してください。

ローカルチェックアウトからインストールする場合（開発ワークフロー）：

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

インストール後に Gateway を再起動します。詳細：[Plugin](/ja-JP/tools/plugin)

## クイックセットアップ（初心者向け）

1. Plugin をインストールします（上記参照）。
2. Nextcloud サーバーでボットを作成します：

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   `--feature response` は残してください。これがないと、送信返信が 401 で失敗します。既存のボットを修復するには、`./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1` を実行します。

3. 対象ルームの設定でボットを有効にします。
4. OpenClaw を設定します：
   - 設定：`channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - または環境変数：`NEXTCLOUD_TALK_BOT_SECRET`（デフォルトアカウントのみ）

   CLI セットアップ（`--url`/`--token` は明示的なフィールドのエイリアスです。`nc-talk` と `nc` はチャンネルのエイリアスとして使用できます）：

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   同等の明示的なフィールド：

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   ファイルに保存されたシークレット：

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Gateway を再起動します（またはセットアップを完了します）。

最小構成：

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## 注意事項

- ボットからダイレクトメッセージを開始することはできません。ユーザーが先にボットへメッセージを送信する必要があります。
- Webhook URL は Nextcloud サーバーから到達可能でなければなりません。Gateway がプロキシの背後にある場合は、`webhookPublicUrl` を設定してください。Webhook リクエストはボットのシークレットを使用して HMAC-SHA256 で署名されます。無効な署名は拒否され、レート制限の対象になります。
- ボット API はメディアのアップロードに対応していません。送信メディアは `Attachment: <url>` という行として追加されます。
- Webhook ペイロードでは、ダイレクトメッセージとルームを区別できません。ルーム種別の照会を有効にするには、`apiUser` + `apiPassword` を設定してください（約 5 分間キャッシュされます）。これらを設定しない場合、すべての会話がルームとして扱われます。
- 送信リクエストは SSRF ガードを経由します。信頼できるプライベート／内部ネットワーク上の Nextcloud ホストについては、`channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true` を設定して明示的に許可します。
- `apiUser`/`apiPassword` と `webhookPublicUrl` が設定されている場合、`openclaw channels status` はボットをプローブし、`response` 機能がない場合に警告します。

## アクセス制御（ダイレクトメッセージ）

- デフォルト：`channels.nextcloud-talk.dmPolicy = "pairing"`。不明な送信者にはペアリングコードが発行されます。
- 次のコマンドで承認します：
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公開ダイレクトメッセージ：`channels.nextcloud-talk.dmPolicy="open"` と `channels.nextcloud-talk.allowFrom=["*"]` を設定します。
- `allowFrom` は Nextcloud ユーザー ID のみと照合されます（小文字に変換）。表示名は無視されます。

## ルーム（グループ）

- デフォルト：`channels.nextcloud-talk.groupPolicy = "allowlist"`（メンション必須）。
- `channels.nextcloud-talk.rooms` でルームを許可リストに追加します。キーにはルームトークンを使用し、`"*"` はワイルドカードのデフォルトを設定します：

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- ルームごとのキー：`requireMention`（デフォルトは true）、`enabled`（false にするとルームを無効化）、`allowFrom`（ルームごとの送信者許可リスト）、`tools`（ツールの許可／拒否の上書き）、`skills`（読み込む Skills を制限）、`systemPrompt`。
- すべてのルームを許可しない場合は、許可リストを空のままにするか、`channels.nextcloud-talk.groupPolicy="disabled"` を設定します。

## 機能

| 機能                   | 状態       |
| ---------------------- | ---------- |
| ダイレクトメッセージ   | 対応       |
| ルーム                 | 対応       |
| スレッド               | 非対応     |
| メディア               | URL のみ   |
| リアクション           | 対応       |
| ネイティブコマンド     | 非対応     |

## 設定リファレンス（Nextcloud Talk）

完全な設定：[設定](/ja-JP/gateway/configuration)

プロバイダーオプション：

- `channels.nextcloud-talk.enabled`：チャンネルの起動を有効化／無効化します。
- `channels.nextcloud-talk.baseUrl`：Nextcloud インスタンスの URL。
- `channels.nextcloud-talk.botSecret`：ボットの共有シークレット（文字列またはシークレット参照）。
- `channels.nextcloud-talk.botSecretFile`：通常ファイルのシークレットパス。シンボリックリンクは拒否されます。
- `channels.nextcloud-talk.apiUser`：ルーム照会（ダイレクトメッセージの検出）とステータスプローブに使用する API ユーザー。
- `channels.nextcloud-talk.apiPassword`：ルーム照会に使用する API／アプリパスワード。
- `channels.nextcloud-talk.apiPasswordFile`：API パスワードファイルのパス。
- `channels.nextcloud-talk.webhookPort`：Webhook リスナーのポート（デフォルト：8788）。
- `channels.nextcloud-talk.webhookHost`：Webhook ホスト（デフォルト：0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`：Webhook パス（デフォルト：/nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`：外部から到達可能な Webhook URL。
- `channels.nextcloud-talk.dmPolicy`：`pairing | allowlist | open | disabled`（デフォルト：pairing）。`open` には `allowFrom=["*"]` が必要です。
- `channels.nextcloud-talk.allowFrom`：ダイレクトメッセージの許可リスト（ユーザー ID）。
- `channels.nextcloud-talk.groupPolicy`：`allowlist | open | disabled`（デフォルト：allowlist）。
- `channels.nextcloud-talk.groupAllowFrom`：ルーム送信者の許可リスト（ユーザー ID）。未設定の場合は `allowFrom` にフォールバックします。
- `channels.nextcloud-talk.rooms`：ルームごとの設定と許可リスト（上記参照）。
- 静的な送信者アクセスグループは、`accessGroup:<name>` を使用して `allowFrom` および `groupAllowFrom` から参照できます。
- `channels.nextcloud-talk.historyLimit`：グループ履歴の上限（0 で無効）。
- `channels.nextcloud-talk.dmHistoryLimit`：ダイレクトメッセージ履歴の上限（0 で無効）。
- `channels.nextcloud-talk.dms`：ユーザー ID をキーとするダイレクトメッセージごとの上書き設定（`historyLimit`）。
- `channels.nextcloud-talk.textChunkLimit`：送信テキストのチャンクサイズ（文字数、デフォルト：4000）。
- `channels.nextcloud-talk.chunkMode`：長さによる分割の前に空行（段落境界）で分割するには、`length`（デフォルト）または `newline` を指定します。
- `channels.nextcloud-talk.blockStreaming`：このチャンネルのブロックストリーミングを無効にします。
- `channels.nextcloud-talk.blockStreamingCoalesce`：ブロックストリーミングの結合調整。
- `channels.nextcloud-talk.responsePrefix`：送信返信の接頭辞。
- `channels.nextcloud-talk.markdown.tables`：Markdown テーブルのレンダリングモード（`off | bullets | code | block`）。
- `channels.nextcloud-talk.mediaMaxMb`：受信メディアの上限（MB）。
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`：SSRF ガードを通過してプライベート／内部 Nextcloud ホストへの接続を許可します。
- `channels.nextcloud-talk.accounts.<id>`：アカウントごとの上書き設定（同じキー）。`defaultAccount` でデフォルトを選択します。環境変数 `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` はデフォルトアカウントにのみ適用されます。

## 関連項目

- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — ダイレクトメッセージの認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションによる制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
