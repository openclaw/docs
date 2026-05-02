---
read_when:
    - Nextcloud Talk チャネル機能に取り組む
summary: Nextcloud Talk のサポート状況、機能、および設定
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-02T22:16:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4956586ae8622118dcf136f4279c6ed1c2895fd4bb4576a7f5799de600a95740
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

ステータス: バンドル済みPlugin（Webhook ボット）。ダイレクトメッセージ、ルーム、リアクション、Markdown メッセージに対応しています。

## バンドル済みPlugin

Nextcloud Talk は現在の OpenClaw リリースにバンドル済みPluginとして同梱されているため、
通常のパッケージ版ビルドでは別途インストールは不要です。

古いビルドを使用している場合、または Nextcloud Talk を除外したカスタムインストールの場合は、
npm パッケージを直接インストールします。

CLI 経由でインストール（npm レジストリ）:

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

現在の公式リリースタグに追従するには、裸のパッケージを使用します。再現可能な
インストールが必要な場合のみ、正確なバージョンに固定してください。

ローカルチェックアウト（git リポジトリから実行する場合）:

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ（初心者向け）

1. Nextcloud Talk Plugin が利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースにはすでに同梱されています。
   - 古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
2. Nextcloud サーバーでボットを作成します。

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. 対象ルームの設定でボットを有効化します。
4. OpenClaw を設定します。
   - 設定: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - または env: `NEXTCLOUD_TALK_BOT_SECRET`（デフォルトアカウントのみ）

   CLI セットアップ:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   同等の明示的なフィールド:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   ファイルベースのシークレット:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Gateway を再起動します（またはセットアップを完了します）。

最小設定:

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

## 注記

- ボットは DM を開始できません。ユーザーが先にボットへメッセージを送信する必要があります。
- Webhook URL は Gateway から到達可能である必要があります。プロキシの背後にある場合は `webhookPublicUrl` を設定してください。
- メディアアップロードはボット API ではサポートされていません。メディアは URL として送信されます。
- Webhook ペイロードでは DM とルームを区別できません。ルーム種別の検索を有効にするには `apiUser` + `apiPassword` を設定してください（設定しない場合、DM はルームとして扱われます）。

## アクセス制御（DM）

- デフォルト: `channels.nextcloud-talk.dmPolicy = "pairing"`。不明な送信者にはペアリングコードが送られます。
- 承認方法:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公開 DM: `channels.nextcloud-talk.dmPolicy="open"` に加えて `channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom` は Nextcloud ユーザー ID のみに一致します。表示名は無視されます。

## ルーム（グループ）

- デフォルト: `channels.nextcloud-talk.groupPolicy = "allowlist"`（メンションゲート）。
- `channels.nextcloud-talk.rooms` でルームを許可リストに追加します。

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

- ルームを許可しない場合は、許可リストを空のままにするか、`channels.nextcloud-talk.groupPolicy="disabled"` を設定します。

## 機能

| 機能            | ステータス       |
| --------------- | ------------- |
| ダイレクトメッセージ | 対応          |
| ルーム           | 対応          |
| スレッド          | 未対応        |
| メディア          | URL のみ      |
| リアクション       | 対応          |
| ネイティブコマンド  | 未対応        |

## 設定リファレンス（Nextcloud Talk）

完全な設定: [設定](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.nextcloud-talk.enabled`: チャンネル起動を有効化または無効化します。
- `channels.nextcloud-talk.baseUrl`: Nextcloud インスタンスの URL。
- `channels.nextcloud-talk.botSecret`: ボット共有シークレット。
- `channels.nextcloud-talk.botSecretFile`: 通常ファイルのシークレットパス。シンボリックリンクは拒否されます。
- `channels.nextcloud-talk.apiUser`: ルーム検索（DM 検出）用の API ユーザー。
- `channels.nextcloud-talk.apiPassword`: ルーム検索用の API/app パスワード。
- `channels.nextcloud-talk.apiPasswordFile`: API パスワードファイルのパス。
- `channels.nextcloud-talk.webhookPort`: Webhook リスナーポート（デフォルト: 8788）。
- `channels.nextcloud-talk.webhookHost`: Webhook ホスト（デフォルト: 0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`: Webhook パス（デフォルト: /nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`: 外部から到達可能な Webhook URL。
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`: DM 許可リスト（ユーザー ID）。`open` には `"*"` が必要です。
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`: グループ許可リスト（ユーザー ID）。
- `channels.nextcloud-talk.rooms`: ルームごとの設定と許可リスト。
- `channels.nextcloud-talk.historyLimit`: グループ履歴制限（0 で無効化）。
- `channels.nextcloud-talk.dmHistoryLimit`: DM 履歴制限（0 で無効化）。
- `channels.nextcloud-talk.dms`: DM ごとのオーバーライド（historyLimit）。
- `channels.nextcloud-talk.textChunkLimit`: 送信テキストのチャンクサイズ（文字数）。
- `channels.nextcloud-talk.chunkMode`: 長さでチャンク分割する前に空行（段落境界）で分割するには、`length`（デフォルト）または `newline`。
- `channels.nextcloud-talk.blockStreaming`: このチャンネルのブロックストリーミングを無効化します。
- `channels.nextcloud-talk.blockStreamingCoalesce`: ブロックストリーミングの結合チューニング。
- `channels.nextcloud-talk.mediaMaxMb`: 受信メディアの上限（MB）。

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
