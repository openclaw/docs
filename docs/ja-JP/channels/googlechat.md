---
read_when:
    - Google Chat チャンネル機能に取り組む
summary: Google Chat アプリのサポート状況、機能、設定
title: Google Chat
x-i18n:
    generated_at: "2026-07-05T11:01:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb0a6298652a8bac48f5e7249884f8387bc72f9c849a9b39e73aff008b848780
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat は公式の `@openclaw/googlechat` Plugin として動作します。Google Chat API Webhook 経由の DM とスペースに対応します（HTTP エンドポイントのみ、Pub/Sub なし）。

## インストール

```bash
openclaw plugins install @openclaw/googlechat
```

ローカルチェックアウト（git リポジトリから実行する場合）:

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## クイックセットアップ（初心者向け）

1. Google Cloud プロジェクトを作成し、**Google Chat API** を有効にします。
   - 移動先: [Google Chat API 認証情報](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - API がまだ有効でない場合は有効にします。
2. **サービスアカウント**を作成します:
   - **認証情報を作成** > **サービスアカウント**を押します。
   - 任意の名前を付けます（例: `openclaw-chat`）。
   - 権限とプリンシパルは空のままにします（**続行**、次に **完了**）。
3. **JSON キー**を作成してダウンロードします:
   - 新しいサービスアカウント > **キー**タブ > **キーを追加** > **新しいキーを作成** > **JSON** > **作成**をクリックします。
4. ダウンロードした JSON ファイルを Gateway ホストに保存します（例: `~/.openclaw/googlechat-service-account.json`）。
5. [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) で Google Chat アプリを作成します:
   - **アプリケーション情報**（アプリ名、アバター URL、説明）を入力します。
   - **インタラクティブ機能**を有効にします。
   - **機能**で、**スペースとグループ会話に参加する**にチェックを入れます。
   - **接続設定**で、**HTTP エンドポイント URL**を選択します。
   - **トリガー**で、**すべてのトリガーに共通の HTTP エンドポイント URL を使用する**を選択し、公開 Gateway URL の後に `/googlechat` を付けたものに設定します（[公開 URL](#public-url-webhook-only) を参照）。
   - **公開設定**で、**この Chat アプリを `<Your Domain>` 内の特定のユーザーとグループに公開する**にチェックを入れ、メールアドレスを入力します。
   - **保存**をクリックします。
6. アプリのステータスを有効にします: ページを更新し、**アプリのステータス**を見つけ、**ライブ - ユーザーが利用可能**に設定し、もう一度**保存**します。
7. サービスアカウントと Webhook オーディエンス（Chat アプリ設定と一致している必要があります）で OpenClaw を設定します:
   - 環境変数: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`（デフォルトアカウントのみ）、または
   - 設定: [設定の要点](#config-highlights) を参照してください。`openclaw channels add --channel googlechat` は `--audience-type`、`--audience`、`--webhook-path`、`--webhook-url` も受け付けます。
8. Gateway を起動します。Google Chat は Webhook パス（デフォルト `/googlechat`）に POST します。

## Google Chat に追加

Gateway が実行中で、自分のメールアドレスが公開設定リストに含まれている場合:

1. [Google Chat](https://chat.google.com/) に移動します。
2. **ダイレクト メッセージ**の横にある **+**（プラス）アイコンをクリックします。
3. Google Cloud Console で設定した**アプリ名**を検索します。
   - 非公開アプリであるため、ボットは Marketplace の参照リストには表示されません。名前で検索してください。
4. ボットを選択し、**追加**または**チャット**をクリックして、メッセージを送信します。

## 公開 URL（Webhook のみ）

Google Chat Webhook には公開 HTTPS エンドポイントが必要です。セキュリティのため、インターネットには**`/googlechat` パスのみ**を公開し、OpenClaw ダッシュボードやその他のエンドポイントは非公開のままにしてください。

### オプション A: Tailscale Funnel（推奨）

非公開ダッシュボードには Tailscale Serve を、公開 Webhook パスには Funnel を使用します。

1. Gateway がバインドされているアドレスを確認します:

   ```bash
   ss -tlnp | grep 18789
   ```

   IP をメモします（例: `127.0.0.1`、`0.0.0.0`、または Tailscale の `100.x.x.x` アドレス）。

2. ダッシュボードを tailnet のみに公開します（ポート 8443）:

   ```bash
   # localhost (127.0.0.1 または 0.0.0.0) にバインドされている場合:
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Tailscale IP のみにバインドされている場合:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Webhook パスのみを公開します:

   ```bash
   # localhost (127.0.0.1 または 0.0.0.0) にバインドされている場合:
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Tailscale IP のみにバインドされている場合:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. プロンプトが表示された場合は、出力に表示された認可 URL にアクセスして、このノードで Funnel を有効にします。

5. 確認します:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

公開 Webhook URL は `https://<node-name>.<tailnet>.ts.net/googlechat` です。ダッシュボードは `https://<node-name>.<tailnet>.ts.net:8443/` で tailnet のみのままです。Google Chat アプリ設定では公開 URL（`:8443` なし）を使用します。

> 注: この設定は再起動後も保持されます。後で削除するには `tailscale funnel reset` と `tailscale serve reset` を使用します。

### オプション B: リバースプロキシ（Caddy）

Webhook パスのみをプロキシします:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

`your-domain.com/` へのリクエストは無視されるか 404 になり、`your-domain.com/googlechat` は OpenClaw にルーティングされます。

### オプション C: Cloudflare Tunnel

Webhook パスのみをルーティングするようにトンネルの ingress ルールを設定します:

- **パス**: `/googlechat` -> `http://localhost:18789/googlechat`
- **デフォルトルール**: HTTP 404（Not Found）

## 仕組み

1. Google Chat は Gateway Webhook パスに JSON を POST します（POST のみ、JSON content type が必須、IP ごとのレート制限あり）。
2. OpenClaw はディスパッチ前にすべてのリクエストを認証します:
   - Chat アプリイベントは `Authorization: Bearer <token>` を保持します。完全な本文が解析される前にトークンが検証されます。
   - Google Workspace アドオンイベントは本文内（`authorizationEventObject.systemIdToken`）にトークンを保持し、検証前により厳しい事前認証予算（16 KB、3 秒）の下で読み取られます。
3. トークンは `audienceType` + `audience` に対してチェックされます:
   - `audienceType: "app-url"` → オーディエンスは HTTPS Webhook URL です。
   - `audienceType: "project-number"` → オーディエンスは Cloud プロジェクト番号です。
   - `app-url` 下のアドオントークンでは、さらに `appPrincipal` をアプリの数値 OAuth 2.0 クライアント ID（21 桁、メールではありません）に設定する必要があります。設定されていない場合、検証はログ警告付きで失敗します。
4. メッセージはスペースごとにルーティングされます:
   - スペースはスペースごとのセッション `agent:<agentId>:googlechat:group:<spaceId>` を取得します。返信はメッセージスレッドに送られます。
   - DM はデフォルトでエージェントのメインセッションに統合されます。ピアごとの DM セッションには `session.dmScope` を設定します（[セッション](/ja-JP/concepts/session) を参照）。
5. DM アクセスはデフォルトでペアリングです。不明な送信者にはペアリングコードが送信されます。次で承認します:
   - `openclaw pairing approve googlechat <code>`
6. グループスペースではデフォルトで @メンションが必要です。メンションはアプリを対象とする Chat `USER_MENTION` アノテーションから検出されます。検出にアプリのユーザーリソース名が必要な場合は `botUser`（例: `users/1234567890`）を設定します。
7. Google Chat から exec または Plugin 承認が開始され、安定した `users/<id>` 承認者が設定されている場合、OpenClaw は発生元のスペースまたはスレッドにネイティブ承認カード（`cardsV2`）を投稿します。カードボタンは不透明なコールバックトークンを持ちます。ネイティブ配信を利用できない場合にのみ、手動の `/approve <id> <decision>` プロンプトが表示されます。

## ターゲット

配信と許可リストには、次の識別子を使用します:

- ダイレクトメッセージ: `users/<userId>`（推奨）。
- スペース: `spaces/<spaceId>`。
- 生のメール `name@example.com` は可変であり、`channels.googlechat.dangerouslyAllowNameMatching: true` の場合にのみ許可リスト照合に使用されます。
- 非推奨: `users/<email>` はメール許可リストエントリではなく、ユーザー ID として扱われます。
- プレフィックス `googlechat:`、`google-chat:`、`gchat:` は受け付けられ、取り除かれます。

## 設定の要点

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // add-on verification only; numeric OAuth client ID
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

注:

- サービスアカウント認証情報: `serviceAccountFile`（パス）、`serviceAccount`（インライン JSON 文字列またはオブジェクト）、または `serviceAccountRef`（env/file SecretRef）。環境変数 `GOOGLE_CHAT_SERVICE_ACCOUNT`（インライン JSON）と `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`（パス）はデフォルトアカウントにのみ適用されます。複数アカウント設定では、アカウントごとの `serviceAccountRef` を含め、同じキーで `channels.googlechat.accounts.<id>` を使用します。
- デフォルトの Webhook パスは、`webhookPath` が未設定の場合 `/googlechat` です。`webhookUrl` は代わりにパスを提供できます。
- グループキーは安定したスペース ID（`spaces/<spaceId>`）である必要があります。表示名キーは非推奨であり、その旨がログに記録されます。
- `dangerouslyAllowNameMatching` は、許可リストに対する可変メールプリンシパル照合を再度有効にします（緊急互換モード）。doctor はメールエントリについて警告します。
- リアクションはデフォルトで有効で、`reactions` ツールと `channels action` を通じて公開されます。無効にするには `actions.reactions: false` を使用します。
- ネイティブ承認カードは、リアクションイベントではなく Google Chat `cardsV2` ボタンクリックを使用します。承認者は `dm.allowFrom` または `defaultTo` から取得され、安定した数値の `users/<id>` 値である必要があります。
- メッセージアクションは、テキスト用の `send` と、明示的な添付送信用の `upload-file` を公開します。`upload-file` は `media` / `filePath` / `path` に加え、任意の `message`、`filename`、スレッドターゲット（`threadId` / `replyTo`）を受け付けます。
- `typingIndicator`: `message`（デフォルト）は `_<Bot> is typing..._` プレースホルダーを投稿し、最初の返信に編集します。`none` は無効化します。`reaction` はユーザー OAuth が必要で、現在はサービスアカウント認証ではログエラー付きで `message` にフォールバックします。
- 受信添付（メッセージごとの最初の添付）は Chat API 経由でメディアパイプラインにダウンロードされ、`mediaMaxMb`（デフォルト 20）で上限設定されます。
- ボット作成メッセージはデフォルトで無視されます。`allowBots: true` の場合、受け付けられたボットメッセージは共有の[ボットループ保護](/ja-JP/channels/bot-loop-protection)を使用します。`channels.defaults.botLoopProtection` を設定し、次に `channels.googlechat.botLoopProtection` または `channels.googlechat.groups.<space>.botLoopProtection` で上書きします。

Secrets 参照の詳細: [Secrets 管理](/ja-JP/gateway/secrets)。

## トラブルシューティング

### 405 Method Not Allowed

Google Cloud Logs Explorer に次のようなエラーが表示される場合:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Webhook ハンドラーが登録されていません。一般的な原因:

1. **チャンネルが設定されていない**: `channels.googlechat` セクションがありません。次で確認します:

   ```bash
   openclaw config get channels.googlechat
   ```

   "Config path not found" が返る場合は、設定を追加します（[設定の要点](#config-highlights) を参照）。

2. **Plugin が有効でない**: Plugin のステータスを確認します:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   "disabled" が表示される場合は、設定に `plugins.entries.googlechat.enabled: true` を追加します。

3. 設定変更後に **Gateway が再起動されていない**:

   ```bash
   openclaw gateway restart
   ```

チャンネルが実行中であることを確認します:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### その他の問題

- `openclaw channels status --probe` は認証エラーと不足しているオーディエンス設定を表示します（`audience` と `audienceType` はどちらも必須です）。
- メッセージが届かない場合は、Chat アプリの Webhook URL とトリガー設定を確認します。
- メンションゲーティングが返信をブロックする場合は、`botUser` をアプリのユーザーリソース名に設定し、`requireMention` を確認します。
- テストメッセージの送信中に `openclaw logs --follow` を実行すると、リクエストが Gateway に到達しているかどうかが表示されます。

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Gateway 設定](/ja-JP/gateway/configuration)
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションによるゲート制御
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [リアクション](/ja-JP/tools/reactions)
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
