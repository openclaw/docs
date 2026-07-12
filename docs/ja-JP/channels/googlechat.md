---
read_when:
    - Google Chat チャンネル機能の開発
summary: Google Chat アプリのサポート状況、機能、設定
title: Google Chat
x-i18n:
    generated_at: "2026-07-11T21:56:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat は公式の `@openclaw/googlechat` Plugin として動作します。Google Chat API の Webhook を介して DM とスペースに対応します（HTTP エンドポイントのみ、Pub/Sub は使用しません）。

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
   - 移動先: [Google Chat API の認証情報](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - API がまだ有効になっていない場合は、有効にします。
2. **サービス アカウント**を作成します。
   - **Create Credentials** > **Service Account** を押します。
   - 任意の名前を付けます（例: `openclaw-chat`）。
   - 権限とプリンシパルは空欄のままにします（**Continue**、続いて **Done**）。
3. **JSON キー**を作成してダウンロードします。
   - 新しいサービス アカウントをクリックし、**Keys** タブ > **Add Key** > **Create new key** > **JSON** > **Create** の順に選択します。
4. ダウンロードした JSON ファイルを Gateway ホストに保存します（例: `~/.openclaw/googlechat-service-account.json`）。
5. [Google Cloud Console の Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat)で Google Chat アプリを作成します。
   - **Application info**（アプリ名、アバター URL、説明）を入力します。
   - **Interactive features** を有効にします。
   - **Functionality** で **Join spaces and group conversations** をオンにします。
   - **Connection settings** で **HTTP endpoint URL** を選択します。
   - **Triggers** で **Use a common HTTP endpoint URL for all triggers** を選択し、公開 Gateway URL の末尾に `/googlechat` を付けた値を設定します（[公開 URL](#public-url-webhook-only)を参照）。
   - **Visibility** で **Make this Chat app available to specific people and groups in `<Your Domain>`** をオンにし、自分のメールアドレスを入力します。
   - **Save** をクリックします。
6. アプリのステータスを有効にします。ページを更新して **App status** を見つけ、**Live - available to users** に設定して、もう一度 **Save** をクリックします。
7. サービス アカウントと Webhook のオーディエンスを使用して OpenClaw を設定します（Chat アプリの設定と一致させる必要があります）。
   - 環境変数: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`（デフォルトアカウントのみ）、または
   - 設定: [設定の要点](#config-highlights)を参照してください。`openclaw channels add --channel googlechat` では、`--audience-type`、`--audience`、`--webhook-path`、`--webhook-url` も指定できます。
8. Gateway を起動します。Google Chat は Webhook パス（デフォルトは `/googlechat`）へ POST します。

## Google Chat への追加

Gateway が実行中で、自分のメールアドレスが表示対象リストに登録されている場合:

1. [Google Chat](https://chat.google.com/)を開きます。
2. **Direct Messages** の横にある **+**（プラス）アイコンをクリックします。
3. Google Cloud Console で設定した**アプリ名**を検索します。
   - 非公開アプリのため、ボットは Marketplace の閲覧リストには表示されません。名前で検索してください。
4. ボットを選択し、**Add** または **Chat** をクリックして、メッセージを送信します。

## 公開 URL（Webhook のみ）

Google Chat の Webhook には、公開 HTTPS エンドポイントが必要です。セキュリティのため、インターネットには **`/googlechat` パスのみ**を公開し、OpenClaw ダッシュボードとその他のエンドポイントは非公開のままにしてください。

### オプション A: Tailscale Funnel（推奨）

非公開ダッシュボードには Tailscale Serve、公開 Webhook パスには Funnel を使用します。

1. Gateway がバインドされているアドレスを確認します。

   ```bash
   ss -tlnp | grep 18789
   ```

   IP を控えます（例: `127.0.0.1`、`0.0.0.0`、または Tailscale の `100.x.x.x` アドレス）。

2. ダッシュボードを tailnet のみに公開します（ポート 8443）。

   ```bash
   # localhost（127.0.0.1 または 0.0.0.0）にバインドされている場合:
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Tailscale IP のみにバインドされている場合:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Webhook パスのみを公開します。

   ```bash
   # localhost（127.0.0.1 または 0.0.0.0）にバインドされている場合:
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Tailscale IP のみにバインドされている場合:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. プロンプトが表示された場合は、出力に表示された認可 URL にアクセスし、この Node で Funnel を有効にします。

5. 確認します。

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

公開 Webhook URL は `https://<node-name>.<tailnet>.ts.net/googlechat` です。ダッシュボードは `https://<node-name>.<tailnet>.ts.net:8443/` で tailnet のみに公開されたままです。Google Chat アプリの設定には、公開 URL（`:8443` なし）を使用します。

> 注: この設定は再起動後も保持されます。後で削除するには、`tailscale funnel reset` と `tailscale serve reset` を実行します。

### オプション B: リバースプロキシ（Caddy）

Webhook パスのみをプロキシします。

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

`your-domain.com/` へのリクエストは無視されるか 404 になり、`your-domain.com/googlechat` は OpenClaw にルーティングされます。

### オプション C: Cloudflare Tunnel

Webhook パスのみをルーティングするように、トンネルの受信ルールを設定します。

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default rule**: HTTP 404（見つかりません）

## 動作の仕組み

1. Google Chat は Gateway の Webhook パスへ JSON を POST します（POST のみ、JSON コンテンツタイプ必須、IP ごとのレート制限あり）。
2. OpenClaw はディスパッチ前にすべてのリクエストを認証します。
   - Chat アプリのイベントには `Authorization: Bearer <token>` が含まれます。完全な本文を解析する前にトークンが検証されます。
   - Google Workspace アドオンのイベントでは、本文の `authorizationEventObject.systemIdToken` にトークンが含まれます。検証前に、より厳しい事前認証制限（16 KB、3 秒）の下で読み取られます。
3. トークンは `audienceType` + `audience` と照合されます。
   - `audienceType: "app-url"` → オーディエンスは HTTPS Webhook URL です。
   - `audienceType: "project-number"` → オーディエンスは Cloud プロジェクト番号です。
   - `app-url` を使用するアドオントークンでは、さらに `appPrincipal` をアプリの数値 OAuth 2.0 クライアント ID（21 桁、メールアドレスではない）に設定する必要があります。設定されていない場合は、警告がログに記録され、検証に失敗します。
4. メッセージはスペースごとにルーティングされます。
   - スペースでは、スペースごとのセッション `agent:<agentId>:googlechat:group:<spaceId>` が使用され、返信はメッセージスレッドに送信されます。
   - デフォルトでは、DM はエージェントのメインセッションにまとめられます。相手ごとの DM セッションを使用するには、`session.dmScope` を設定します（[セッション](/ja-JP/concepts/session)を参照）。
5. DM アクセスはデフォルトでペアリング方式です。不明な送信者にはペアリングコードが送られます。次のコマンドで承認します。
   - `openclaw pairing approve googlechat <code>`
6. グループスペースでは、デフォルトで @メンションが必要です。メンションは、アプリを対象とする Chat の `USER_MENTION` アノテーションから検出されます。検出にアプリのユーザーリソース名が必要な場合は、`botUser`（例: `users/1234567890`）を設定します。
7. Google Chat から exec または Plugin の承認が開始され、安定した `users/<id>` 承認者が設定されている場合、OpenClaw は元のスペースまたはスレッドにネイティブ承認カード（`cardsV2`）を投稿します。カードのボタンには不透明なコールバックトークンが含まれます。手動の `/approve <id> <decision>` プロンプトは、ネイティブ配信を利用できない場合にのみ表示されます。

## ターゲット

配信と許可リストには、次の識別子を使用します。

- ダイレクトメッセージ: `users/<userId>`（推奨）。
- スペース: `spaces/<spaceId>`。
- 生のメールアドレス `name@example.com` は変更可能であり、`channels.googlechat.dangerouslyAllowNameMatching: true` の場合に限り、許可リストの照合に使用されます。
- 非推奨: `users/<email>` はメールアドレスの許可リストエントリではなく、ユーザー ID として扱われます。
- 接頭辞 `googlechat:`、`google-chat:`、`gchat:` は受け入れられ、取り除かれます。

## 設定の要点

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // または serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // アドオン検証専用。数値の OAuth クライアント ID
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // 任意。メンション検出に役立つ
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
          systemPrompt: "短い回答のみ。",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

注:

- サービス アカウントの認証情報: `serviceAccountFile`（パス）、`serviceAccount`（インライン JSON 文字列またはオブジェクト）、または `serviceAccountRef`（環境変数/ファイルの SecretRef）を使用します。環境変数 `GOOGLE_CHAT_SERVICE_ACCOUNT`（インライン JSON）と `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`（パス）は、デフォルトアカウントにのみ適用されます。マルチアカウント構成では、アカウントごとの `serviceAccountRef` を含む同じキーを `channels.googlechat.accounts.<id>` で使用します。
- `webhookPath` が未設定の場合、デフォルトの Webhook パスは `/googlechat` です。代わりに `webhookUrl` でパスを指定することもできます。
- グループキーには、安定したスペース ID（`spaces/<spaceId>`）を使用する必要があります。表示名のキーは非推奨であり、その旨がログに記録されます。
- `dangerouslyAllowNameMatching` は、許可リストで変更可能なメールプリンシパルの照合を再び有効にします（緊急時用の互換モード）。doctor はメールアドレスのエントリについて警告します。
- Google Chat のリアクションアクションは公開されていません。この Plugin はサービス アカウント認証を使用しますが、Google Chat のリアクションエンドポイントにはユーザー認証が必要です。既存の `actions.reactions` 設定は互換性のために受け入れられますが、効果はありません。
- ネイティブ承認カードでは、リアクションイベントではなく、Google Chat の `cardsV2` ボタンクリックを使用します。承認者は `dm.allowFrom` または `defaultTo` から取得され、安定した数値の `users/<id>` 値である必要があります。
- メッセージアクションでは、テキストの `send` のみを公開します。Google Chat への添付ファイルのアップロードにはユーザー認証が必要ですが、この Plugin はサービス アカウント認証を使用するため、送信ファイルのアップロードは公開されていません。
- `typingIndicator`: `message`（デフォルト）は `_<Bot> is typing..._` プレースホルダーを投稿し、最初の返信内容に編集します。`none` は無効にします。`reaction` にはユーザー OAuth が必要であり、現在はサービス アカウント認証下で、エラーをログに記録して `message` にフォールバックします。
- 受信した添付ファイル（メッセージごとに最初の添付ファイル）は、Chat API を介してメディアパイプラインにダウンロードされ、`mediaMaxMb`（デフォルト 20）で上限が設定されます。
- ボットが作成したメッセージはデフォルトで無視されます。`allowBots: true` の場合、受け入れられたボットメッセージには共通の[ボットループ保護](/ja-JP/channels/bot-loop-protection)が適用されます。`channels.defaults.botLoopProtection` を設定してから、`channels.googlechat.botLoopProtection` または `channels.googlechat.groups.<space>.botLoopProtection` で上書きします。

シークレット参照の詳細: [シークレット管理](/ja-JP/gateway/secrets)。

## トラブルシューティング

### 405 メソッドが許可されていません

Google Cloud Logs Explorer に次のようなエラーが表示される場合:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Webhook ハンドラーが登録されていません。一般的な原因は次のとおりです。

1. **チャンネルが設定されていない**: `channels.googlechat` セクションがありません。次のコマンドで確認します。

   ```bash
   openclaw config get channels.googlechat
   ```

   「Config path not found」が返された場合は、設定を追加します（[設定の要点](#config-highlights)を参照）。

2. **Plugin が有効になっていない**: Plugin の状態を確認します。

   ```bash
   openclaw plugins list | grep googlechat
   ```

   「disabled」と表示される場合は、設定に `plugins.entries.googlechat.enabled: true` を追加します。

3. 設定変更後に **Gateway が再起動されていない**:

   ```bash
   openclaw gateway restart
   ```

チャンネルが実行中であることを確認します。

```bash
openclaw channels status
# 次のように表示されるはずです: Google Chat default: enabled, configured, ...
```

### その他の問題

- `openclaw channels status --probe` は、認証エラーと不足しているオーディエンス設定を表示します（`audience` と `audienceType` は両方とも必須です）。
- メッセージが届かない場合は、Chat アプリの Webhook URL とトリガー設定を確認します。
- メンション制限によって返信がブロックされる場合は、`botUser` をアプリのユーザーリソース名に設定し、`requireMention` を確認します。
- テストメッセージの送信中に `openclaw logs --follow` を実行すると、リクエストが Gateway に到達しているかどうかを確認できます。

## 関連項目

- [チャンネルの概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Gateway の設定](/ja-JP/gateway/configuration)
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションによる制御
- [ペアリング](/ja-JP/channels/pairing) — DM の認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
