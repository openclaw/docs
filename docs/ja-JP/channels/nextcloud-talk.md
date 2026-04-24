---
read_when:
    - Nextcloud Talk チャネル機能に取り組んでいる場合
summary: Nextcloud Talk のサポート状況、機能、および設定
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-24T04:46:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2eebd6cfd013d3a6e1cf03e2a2167d0657e688c5989f179bb0fec39f866586cb
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

ステータス: 同梱 Plugin（Webhook ボット）。ダイレクトメッセージ、ルーム、リアクション、Markdown メッセージをサポートしています。

## 同梱 Plugin

Nextcloud Talk は現在の OpenClaw リリースでは同梱 Plugin として提供されているため、
通常のパッケージ済みビルドでは別途インストールは不要です。

古いビルドまたは Nextcloud Talk を除外したカスタムインストールを使っている場合は、
手動でインストールしてください。

CLI 経由でインストール（npm レジストリ）:

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

ローカルチェックアウト（git リポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ（初級者向け）

1. Nextcloud Talk Plugin が利用可能であることを確認します。
   - 現在のパッケージ済み OpenClaw リリースにはすでに同梱されています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. Nextcloud サーバー上でボットを作成します:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. 対象ルームの設定でボットを有効にします。
4. OpenClaw を設定します:
   - 設定: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - または env: `NEXTCLOUD_TALK_BOT_SECRET`（デフォルトアカウントのみ）
5. Gateway を再起動します（またはセットアップを完了します）。

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

- ボットは DM を開始できません。ユーザーが先にボットへメッセージを送る必要があります。
- Webhook URL は Gateway から到達可能である必要があります。プロキシの背後にある場合は `webhookPublicUrl` を設定してください。
- ボット API はメディアアップロードをサポートしていません。メディアは URL として送信されます。
- Webhook ペイロードは DM とルームを区別しません。ルーム種別のルックアップを有効にするには `apiUser` + `apiPassword` を設定してください（そうしない場合、DM はルームとして扱われます）。

## アクセス制御（DM）

- デフォルト: `channels.nextcloud-talk.dmPolicy = "pairing"`。未知の送信者にはペアリングコードが渡されます。
- 承認方法:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公開 DM: `channels.nextcloud-talk.dmPolicy="open"` と `channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom` は Nextcloud ユーザー ID のみに一致します。表示名は無視されます。

## ルーム（グループ）

- デフォルト: `channels.nextcloud-talk.groupPolicy = "allowlist"`（メンションゲートあり）。
- `channels.nextcloud-talk.rooms` でルームを許可リストに追加します:

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

- ルームを一切許可しない場合は、許可リストを空のままにするか、`channels.nextcloud-talk.groupPolicy="disabled"` を設定してください。

## 機能

| 機能                 | ステータス     |
| -------------------- | -------------- |
| ダイレクトメッセージ | サポート済み   |
| ルーム               | サポート済み   |
| スレッド             | 未サポート     |
| メディア             | URL のみ       |
| リアクション         | サポート済み   |
| ネイティブコマンド   | 未サポート     |

## 設定リファレンス（Nextcloud Talk）

完全な設定: [Configuration](/ja-JP/gateway/configuration)

プロバイダオプション:

- `channels.nextcloud-talk.enabled`: チャネル起動の有効/無効。
- `channels.nextcloud-talk.baseUrl`: Nextcloud インスタンス URL。
- `channels.nextcloud-talk.botSecret`: ボット共有シークレット。
- `channels.nextcloud-talk.botSecretFile`: 通常ファイルのシークレットパス。シンボリックリンクは拒否されます。
- `channels.nextcloud-talk.apiUser`: ルームルックアップ用 API ユーザー（DM 検出）。
- `channels.nextcloud-talk.apiPassword`: ルームルックアップ用 API/アプリパスワード。
- `channels.nextcloud-talk.apiPasswordFile`: API パスワードファイルパス。
- `channels.nextcloud-talk.webhookPort`: Webhook リスナーポート（デフォルト: 8788）。
- `channels.nextcloud-talk.webhookHost`: Webhook ホスト（デフォルト: 0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`: Webhook パス（デフォルト: /nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`: 外部から到達可能な Webhook URL。
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`: DM 許可リスト（ユーザー ID）。`open` には `"*"` が必要です。
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`: グループ許可リスト（ユーザー ID）。
- `channels.nextcloud-talk.rooms`: ルームごとの設定と許可リスト。
- `channels.nextcloud-talk.historyLimit`: グループ履歴上限（0 で無効）。
- `channels.nextcloud-talk.dmHistoryLimit`: DM 履歴上限（0 で無効）。
- `channels.nextcloud-talk.dms`: DM ごとのオーバーライド（historyLimit）。
- `channels.nextcloud-talk.textChunkLimit`: 送信テキストのチャンクサイズ（文字数）。
- `channels.nextcloud-talk.chunkMode`: `length`（デフォルト）または `newline`。長さでのチャンク分割前に空行（段落境界）で分割します。
- `channels.nextcloud-talk.blockStreaming`: このチャネルのブロックストリーミングを無効にします。
- `channels.nextcloud-talk.blockStreamingCoalesce`: ブロックストリーミングの集約チューニング。
- `channels.nextcloud-talk.mediaMaxMb`: 受信メディア上限（MB）。

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとハードニング
