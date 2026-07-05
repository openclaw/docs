---
read_when:
    - Nextcloud Talk チャンネル機能の作業中
summary: Nextcloud Talk のサポート状況、機能、設定
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-05T11:03:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk は、Talk webhook bot を通じて OpenClaw をセルフホストの Nextcloud インスタンスに接続する、ダウンロード可能なチャネル Plugin (`@openclaw/nextcloud-talk`) です。ダイレクトメッセージ、ルーム、リアクション、markdown メッセージに対応しています。メディアは URL として送信されます。

## インストール

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

ベアパッケージ指定を使用すると、現在の公式リリースタグに追従します。再現可能なインストールが必要な場合にのみ、正確なバージョンに固定してください。

ローカルチェックアウトから（開発ワークフロー）:

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

インストール後に gateway を再起動してください。詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ（初心者向け）

1. Plugin をインストールします（上記）。
2. Nextcloud サーバーで bot を作成します。

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   `--feature response` は保持してください。これがないと、外向きの返信が 401 で失敗します。既存の bot は `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1` で修復します。

3. 対象ルームの設定で bot を有効化します。
4. OpenClaw を設定します。
   - 設定: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - または env: `NEXTCLOUD_TALK_BOT_SECRET`（デフォルトアカウントのみ）

   CLI セットアップ（`--url`/`--token` は明示フィールドのエイリアスです。`nc-talk` と `nc` はチャネルエイリアスとして機能します）:

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

5. gateway を再起動します（またはセットアップを完了します）。

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

- bot は DM を開始できません。ユーザーが最初に bot にメッセージを送る必要があります。
- webhook URL は Nextcloud サーバーから到達可能である必要があります。gateway がプロキシの背後にある場合は `webhookPublicUrl` を設定してください。webhook リクエストは bot secret で HMAC-SHA256 署名されます。無効な署名は拒否され、レート制限されます。
- bot API はメディアアップロードに対応していません。外向きメディアは `Attachment: <url>` 行として追加されます。
- webhook ペイロードは DM とルームを区別しません。ルーム種別のルックアップ（約 5 分キャッシュ）を有効にするには `apiUser` + `apiPassword` を設定してください。設定しない場合、すべての会話はルームとして扱われます。
- 外向きリクエストは SSRF ガードを通過します。信頼済みのプライベート/内部ネットワーク上の Nextcloud ホストについては、`channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true` で明示的に許可します。
- `apiUser`/`apiPassword` と `webhookPublicUrl` が設定されている場合、`openclaw channels status` は bot を検査し、`response` 機能がないと警告します。

## アクセス制御（DM）

- デフォルト: `channels.nextcloud-talk.dmPolicy = "pairing"`。不明な送信者にはペアリングコードが提示されます。
- 承認方法:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- パブリック DM: `channels.nextcloud-talk.dmPolicy="open"` と `channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom` は Nextcloud ユーザー ID のみ（小文字化）に一致します。表示名は無視されます。

## ルーム（グループ）

- デフォルト: `channels.nextcloud-talk.groupPolicy = "allowlist"`（メンションゲート）。
- `channels.nextcloud-talk.rooms` でルームを許可リスト化します。キーはルームトークンです。`"*"` はワイルドカードのデフォルトを設定します。

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

- ルームごとのキー: `requireMention`（デフォルト true）、`enabled`（false でルームを無効化）、`allowFrom`（ルームごとの送信者許可リスト）、`tools`（ツールの許可/拒否オーバーライド）、`skills`（読み込む skills を制限）、`systemPrompt`。
- ルームを許可しないには、許可リストを空のままにするか、`channels.nextcloud-talk.groupPolicy="disabled"` を設定します。

## 機能

| 機能 | 状態 |
| --------------- | ------------- |
| ダイレクトメッセージ | 対応 |
| ルーム | 対応 |
| スレッド | 非対応 |
| メディア | URL のみ |
| リアクション | 対応 |
| ネイティブコマンド | 非対応 |

## 設定リファレンス（Nextcloud Talk）

完全な設定: [設定](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.nextcloud-talk.enabled`: チャネル起動を有効/無効にします。
- `channels.nextcloud-talk.baseUrl`: Nextcloud インスタンス URL。
- `channels.nextcloud-talk.botSecret`: bot 共有シークレット（文字列またはシークレット参照）。
- `channels.nextcloud-talk.botSecretFile`: 通常ファイルのシークレットパス。シンボリックリンクは拒否されます。
- `channels.nextcloud-talk.apiUser`: ルームルックアップ（DM 検出）とステータス検査用の API ユーザー。
- `channels.nextcloud-talk.apiPassword`: ルームルックアップ用の API/アプリパスワード。
- `channels.nextcloud-talk.apiPasswordFile`: API パスワードファイルパス。
- `channels.nextcloud-talk.webhookPort`: webhook リスナーポート（デフォルト: 8788）。
- `channels.nextcloud-talk.webhookHost`: webhook ホスト（デフォルト: 0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`: webhook パス（デフォルト: /nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`: 外部から到達可能な webhook URL。
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。`open` には `allowFrom=["*"]` が必要です。
- `channels.nextcloud-talk.allowFrom`: DM 許可リスト（ユーザー ID）。
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`（デフォルト: allowlist）。
- `channels.nextcloud-talk.groupAllowFrom`: ルーム送信者許可リスト（ユーザー ID）。未設定の場合は `allowFrom` にフォールバックします。
- `channels.nextcloud-talk.rooms`: ルームごとの設定と許可リスト（上記参照）。
- 静的な送信者アクセスグループは、`allowFrom` と `groupAllowFrom` から `accessGroup:<name>` で参照できます。
- `channels.nextcloud-talk.historyLimit`: グループ履歴上限（0 で無効化）。
- `channels.nextcloud-talk.dmHistoryLimit`: DM 履歴上限（0 で無効化）。
- `channels.nextcloud-talk.dms`: ユーザー ID をキーにした DM ごとのオーバーライド（`historyLimit`）。
- `channels.nextcloud-talk.textChunkLimit`: 外向きテキストチャンクの文字数サイズ（デフォルト: 4000）。
- `channels.nextcloud-talk.chunkMode`: 長さで分割する `length`（デフォルト）、または長さによるチャンク化の前に空行（段落境界）で分割する `newline`。
- `channels.nextcloud-talk.blockStreaming`: このチャネルのブロックストリーミングを無効にします。
- `channels.nextcloud-talk.blockStreamingCoalesce`: ブロックストリーミングの結合調整。
- `channels.nextcloud-talk.responsePrefix`: 外向き返信プレフィックス。
- `channels.nextcloud-talk.markdown.tables`: markdown テーブルのレンダリングモード（`off | bullets | code | block`）。
- `channels.nextcloud-talk.mediaMaxMb`: 受信メディア上限（MB）。
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: SSRF ガードを越えて、プライベート/内部 Nextcloud ホストを許可します。
- `channels.nextcloud-talk.accounts.<id>`: アカウントごとのオーバーライド（同じキー）。`defaultAccount` がデフォルトを選択します。Env vars `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` はデフォルトアカウントにのみ適用されます。

## 関連

- [チャネル概要](/ja-JP/channels) — 対応するすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
