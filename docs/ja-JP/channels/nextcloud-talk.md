---
read_when:
    - Nextcloud Talk チャンネル機能に取り組む
summary: Nextcloud Talk のサポート状況、機能、設定
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-10T19:22:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4b3b2d074cc8d3c19223dbb0c306c6861717d0f35e638e3aab04b03647fd248
    source_path: channels/nextcloud-talk.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ステータス: 同梱Plugin（Webhook bot）。ダイレクトメッセージ、ルーム、リアクション、Markdownメッセージに対応しています。

## 同梱Plugin

Nextcloud Talkは現在のOpenClawリリースで同梱Pluginとして提供されるため、
通常のパッケージビルドでは個別のインストールは不要です。

古いビルドを使用している場合、またはNextcloud Talkを除外したカスタムインストールの場合は、
npmパッケージを直接インストールしてください。

CLIでインストール（npm registry）:

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

現在の公式リリースタグに追従するには、素のパッケージを使用します。再現可能なインストールが必要な場合にのみ、
正確なバージョンを固定してください。

ローカルチェックアウト（git repoから実行する場合）:

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ（初心者向け）

1. Nextcloud Talk Pluginが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースにはすでに同梱されています。
   - 古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
2. Nextcloudサーバーでbotを作成します。

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

3. 対象ルームの設定でbotを有効にします。
4. OpenClawを設定します。
   - Config: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - またはenv: `NEXTCLOUD_TALK_BOT_SECRET`（デフォルトアカウントのみ）

   CLIセットアップ:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   同等の明示フィールド:

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

5. Gatewayを再起動します（またはセットアップを完了します）。

最小構成:

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

- botはDMを開始できません。ユーザーが先にbotへメッセージを送る必要があります。
- Webhook URLはGatewayから到達可能である必要があります。プロキシの背後にある場合は`webhookPublicUrl`を設定してください。
- bot APIではメディアアップロードはサポートされません。メディアはURLとして送信されます。
- WebhookペイロードはDMとルームを区別しません。ルーム種別の検索を有効にするには`apiUser` + `apiPassword`を設定してください（設定しない場合、DMはルームとして扱われます）。

## アクセス制御（DM）

- デフォルト: `channels.nextcloud-talk.dmPolicy = "pairing"`。不明な送信者にはペアリングコードが返されます。
- 承認方法:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公開DM: `channels.nextcloud-talk.dmPolicy="open"`に加えて`channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom`はNextcloudユーザーIDのみに一致します。表示名は無視されます。

## ルーム（グループ）

- デフォルト: `channels.nextcloud-talk.groupPolicy = "allowlist"`（メンションゲート）。
- `channels.nextcloud-talk.rooms`でルームを許可リストに追加します。

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

- ルームを許可しない場合は、許可リストを空のままにするか、`channels.nextcloud-talk.groupPolicy="disabled"`を設定します。

## 機能

| 機能              | ステータス       |
| --------------- | ------------- |
| ダイレクトメッセージ | 対応            |
| ルーム            | 対応            |
| スレッド           | 非対応          |
| メディア           | URLのみ        |
| リアクション        | 対応            |
| ネイティブコマンド   | 非対応          |

## 設定リファレンス（Nextcloud Talk）

完全な設定: [設定](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.nextcloud-talk.enabled`: チャンネル起動を有効化または無効化します。
- `channels.nextcloud-talk.baseUrl`: NextcloudインスタンスURL。
- `channels.nextcloud-talk.botSecret`: bot共有シークレット。
- `channels.nextcloud-talk.botSecretFile`: 通常ファイルのシークレットパス。シンボリックリンクは拒否されます。
- `channels.nextcloud-talk.apiUser`: ルーム検索（DM検出）用のAPIユーザー。
- `channels.nextcloud-talk.apiPassword`: ルーム検索用のAPI/appパスワード。
- `channels.nextcloud-talk.apiPasswordFile`: APIパスワードファイルパス。
- `channels.nextcloud-talk.webhookPort`: Webhookリスナーポート（デフォルト: 8788）。
- `channels.nextcloud-talk.webhookHost`: Webhookホスト（デフォルト: 0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`: Webhookパス（デフォルト: /nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`: 外部から到達可能なWebhook URL。
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`: DM許可リスト（ユーザーID）。`open`には`"*"`が必要です。
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`: グループ許可リスト（ユーザーID）。
- `channels.nextcloud-talk.rooms`: ルームごとの設定と許可リスト。
- 静的な送信者アクセスグループは、`allowFrom`と`groupAllowFrom`から`accessGroup:<name>`で参照できます。
- `channels.nextcloud-talk.historyLimit`: グループ履歴の上限（0で無効）。
- `channels.nextcloud-talk.dmHistoryLimit`: DM履歴の上限（0で無効）。
- `channels.nextcloud-talk.dms`: DMごとの上書き（historyLimit）。
- `channels.nextcloud-talk.textChunkLimit`: 送信テキストチャンクサイズ（文字数）。
- `channels.nextcloud-talk.chunkMode`: 長さで分割する`length`（デフォルト）、または長さによるチャンク化の前に空行（段落境界）で分割する`newline`。
- `channels.nextcloud-talk.blockStreaming`: このチャンネルのブロックストリーミングを無効化します。
- `channels.nextcloud-talk.blockStreamingCoalesce`: ブロックストリーミングの結合調整。
- `channels.nextcloud-talk.mediaMaxMb`: 受信メディア上限（MB）。

## 関連

- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
