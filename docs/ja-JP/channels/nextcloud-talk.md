---
read_when:
    - Nextcloud Talk チャンネル機能に取り組む
summary: Nextcloud Talk のサポート状況、機能、設定
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-30T04:59:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcbe8a65adfddc95d2b4944af88f9982e23a1676752efec2bbf40cfc4dd846d2
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

ステータス: バンドルされたPlugin (Webhookボット)。ダイレクトメッセージ、ルーム、リアクション、マークダウンメッセージに対応しています。

## バンドルされたPlugin

Nextcloud Talkは現在のOpenClawリリースにバンドルされたPluginとして同梱されるため、
通常のパッケージ版ビルドでは個別のインストールは不要です。

古いビルドを使用している場合、またはNextcloud Talkを除外したカスタムインストールの場合は、
公開されていれば現在のnpmパッケージをインストールしてください。

CLIでインストール (npmレジストリ、現在のパッケージが存在する場合):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

npmがOpenClaw所有のパッケージを非推奨として報告する場合は、より新しいnpmパッケージが
公開されるまで、現在のパッケージ版OpenClawビルドまたはローカルチェックアウトパスを使用してください。

ローカルチェックアウト (gitリポジトリから実行する場合):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

詳細: [Plugin](/ja-JP/tools/plugin)

## クイックセットアップ (初心者向け)

1. Nextcloud Talk Pluginが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースにはすでにバンドルされています。
   - 古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
2. Nextcloudサーバーでボットを作成します:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. 対象ルーム設定でボットを有効にします。
4. OpenClawを設定します:
   - 設定: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - または環境変数: `NEXTCLOUD_TALK_BOT_SECRET` (デフォルトアカウントのみ)

   CLIセットアップ:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   同等の明示的フィールド:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   ファイルに保存されたシークレット:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Gatewayを再起動します (またはセットアップを完了します)。

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

## 注意事項

- ボットはDMを開始できません。ユーザーが最初にボットへメッセージを送信する必要があります。
- Webhook URLはGatewayから到達可能である必要があります。プロキシ背後の場合は`webhookPublicUrl`を設定してください。
- メディアアップロードはボットAPIで対応していません。メディアはURLとして送信されます。
- WebhookペイロードはDMとルームを区別しません。ルーム種別の検索を有効にするには`apiUser` + `apiPassword`を設定してください (設定しない場合、DMはルームとして扱われます)。

## アクセス制御 (DM)

- デフォルト: `channels.nextcloud-talk.dmPolicy = "pairing"`。不明な送信者にはペアリングコードが返されます。
- 承認方法:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公開DM: `channels.nextcloud-talk.dmPolicy="open"`に加えて`channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom`はNextcloudユーザーIDのみに一致します。表示名は無視されます。

## ルーム (グループ)

- デフォルト: `channels.nextcloud-talk.groupPolicy = "allowlist"` (メンション必須)。
- `channels.nextcloud-talk.rooms`でルームを許可リストに追加します:

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

| 機能                 | ステータス |
| -------------------- | ---------- |
| ダイレクトメッセージ | 対応       |
| ルーム               | 対応       |
| スレッド             | 非対応     |
| メディア             | URLのみ    |
| リアクション         | 対応       |
| ネイティブコマンド   | 非対応     |

## 設定リファレンス (Nextcloud Talk)

完全な設定: [設定](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.nextcloud-talk.enabled`: チャンネル起動を有効化/無効化します。
- `channels.nextcloud-talk.baseUrl`: NextcloudインスタンスURL。
- `channels.nextcloud-talk.botSecret`: ボット共有シークレット。
- `channels.nextcloud-talk.botSecretFile`: 通常ファイルのシークレットパス。シンボリックリンクは拒否されます。
- `channels.nextcloud-talk.apiUser`: ルーム検索 (DM検出) 用のAPIユーザー。
- `channels.nextcloud-talk.apiPassword`: ルーム検索用のAPI/アプリパスワード。
- `channels.nextcloud-talk.apiPasswordFile`: APIパスワードファイルのパス。
- `channels.nextcloud-talk.webhookPort`: Webhookリスナーポート (デフォルト: 8788)。
- `channels.nextcloud-talk.webhookHost`: Webhookホスト (デフォルト: 0.0.0.0)。
- `channels.nextcloud-talk.webhookPath`: Webhookパス (デフォルト: /nextcloud-talk-webhook)。
- `channels.nextcloud-talk.webhookPublicUrl`: 外部から到達可能なWebhook URL。
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`: DM許可リスト (ユーザーID)。`open`には`"*"`が必要です。
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`: グループ許可リスト (ユーザーID)。
- `channels.nextcloud-talk.rooms`: ルームごとの設定と許可リスト。
- `channels.nextcloud-talk.historyLimit`: グループ履歴の上限 (0で無効)。
- `channels.nextcloud-talk.dmHistoryLimit`: DM履歴の上限 (0で無効)。
- `channels.nextcloud-talk.dms`: DMごとの上書き設定 (historyLimit)。
- `channels.nextcloud-talk.textChunkLimit`: 送信テキストのチャンクサイズ (文字数)。
- `channels.nextcloud-talk.chunkMode`: 長さでチャンク化する前に空行 (段落境界) で分割するには`length` (デフォルト) または`newline`。
- `channels.nextcloud-talk.blockStreaming`: このチャンネルのブロックストリーミングを無効にします。
- `channels.nextcloud-talk.blockStreamingCoalesce`: ブロックストリーミングの結合調整。
- `channels.nextcloud-talk.mediaMaxMb`: 受信メディア上限 (MB)。

## 関連

- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
