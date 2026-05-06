---
read_when:
    - Google Chatチャネル機能に取り組む
summary: Google Chat アプリのサポート状況、機能、設定
title: Google Chat
x-i18n:
    generated_at: "2026-05-06T09:02:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b6ac581578df0fccfb560057e4b30ec359a368cb671519a153e1c727d7b920c
    source_path: channels/googlechat.md
    workflow: 16
---

ステータス: Google Chat API Webhook 経由の DM + スペース向けにダウンロード可能な Plugin (HTTP のみ)。

## インストール

チャンネルを設定する前に Google Chat をインストールします。

```bash
openclaw plugins install @openclaw/googlechat
```

ローカルチェックアウト (git リポジトリから実行している場合):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## クイック設定 (初心者向け)

1. Google Cloud プロジェクトを作成し、**Google Chat API** を有効にします。
   - 移動先: [Google Chat API 認証情報](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - API がまだ有効でない場合は有効にします。
2. **Service Account** を作成します。
   - **Create Credentials** > **Service Account** を押します。
   - 任意の名前を付けます (例: `openclaw-chat`)。
   - 権限は空のままにします (**Continue** を押します)。
   - アクセス権を持つプリンシパルも空のままにします (**Done** を押します)。
3. **JSON Key** を作成してダウンロードします。
   - サービス アカウントの一覧で、先ほど作成したものをクリックします。
   - **Keys** タブに移動します。
   - **Add Key** > **Create new key** をクリックします。
   - **JSON** を選択し、**Create** を押します。
4. ダウンロードした JSON ファイルを Gateway ホストに保存します (例: `~/.openclaw/googlechat-service-account.json`)。
5. [Google Cloud Console の Chat 設定](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) で Google Chat アプリを作成します。
   - **Application info** を入力します。
     - **App name**: (例: `OpenClaw`)
     - **Avatar URL**: (例: `https://openclaw.ai/logo.png`)
     - **Description**: (例: `Personal AI Assistant`)
   - **Interactive features** を有効にします。
   - **Functionality** で **Join spaces and group conversations** にチェックを入れます。
   - **Connection settings** で **HTTP endpoint URL** を選択します。
   - **Triggers** で **Use a common HTTP endpoint URL for all triggers** を選択し、Gateway の公開 URL に `/googlechat` を付けた値を設定します。
     - _ヒント: Gateway の公開 URL を確認するには `openclaw status` を実行します。_
   - **Visibility** で **Make this Chat app available to specific people and groups in `<Your Domain>`** にチェックを入れます。
   - テキストボックスにメールアドレス (例: `user@example.com`) を入力します。
   - 下部の **Save** をクリックします。
6. **アプリのステータスを有効化**します。
   - 保存後、**ページを更新**します。
   - **App status** セクションを探します (通常、保存後に上部または下部付近にあります)。
   - ステータスを **Live - available to users** に変更します。
   - もう一度 **Save** をクリックします。
7. サービス アカウントのパス + Webhook オーディエンスで OpenClaw を設定します。
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - または設定: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`。
8. Webhook のオーディエンスタイプ + 値を設定します (Chat アプリの設定と一致させます)。
9. Gateway を起動します。Google Chat は Webhook パスに POST します。

## Google Chat に追加する

Gateway が実行中で、メールアドレスが公開範囲リストに追加されている場合:

1. [Google Chat](https://chat.google.com/) に移動します。
2. **Direct Messages** の横にある **+** (プラス) アイコンをクリックします。
3. 検索バー (通常はユーザーを追加する場所) に、Google Cloud Console で設定した **App name** を入力します。
   - **注**: これは非公開アプリのため、ボットは「Marketplace」の参照リストには表示されません。名前で検索する必要があります。
4. 結果からボットを選択します。
5. **Add** または **Chat** をクリックして 1:1 の会話を開始します。
6. アシスタントを起動するには「Hello」を送信します。

## 公開 URL (Webhook のみ)

Google Chat Webhook には公開 HTTPS エンドポイントが必要です。セキュリティのため、インターネットには **`/googlechat` パスだけを公開**してください。OpenClaw ダッシュボードやその他の機密エンドポイントはプライベートネットワーク上に保ちます。

### オプション A: Tailscale Funnel (推奨)

プライベートダッシュボードには Tailscale Serve を使用し、公開 Webhook パスには Funnel を使用します。これにより `/` はプライベートのまま、`/googlechat` だけが公開されます。

1. **Gateway がどのアドレスにバインドされているか確認します。**

   ```bash
   ss -tlnp | grep 18789
   ```

   IP アドレスをメモします (例: `127.0.0.1`、`0.0.0.0`、または `100.x.x.x` のような Tailscale IP)。

2. **ダッシュボードを tailnet のみに公開します (ポート 8443)。**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Webhook パスだけを公開します。**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **ノードに Funnel アクセスを許可します。**
   求められた場合は、出力に表示された認可 URL にアクセスして、このノードの Funnel を tailnet ポリシーで有効にします。

5. **設定を確認します。**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

公開 Webhook URL は次のようになります。
`https://<node-name>.<tailnet>.ts.net/googlechat`

プライベートダッシュボードは tailnet 限定のままです。
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat アプリ設定では公開 URL (`:8443` なし) を使用します。

> 注: この設定は再起動後も保持されます。後で削除するには、`tailscale funnel reset` と `tailscale serve reset` を実行します。

### オプション B: リバースプロキシ (Caddy)

Caddy のようなリバースプロキシを使う場合は、特定のパスだけをプロキシします。

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

この設定では、`your-domain.com/` へのリクエストは無視されるか 404 として返され、`your-domain.com/googlechat` は安全に OpenClaw へルーティングされます。

### オプション C: Cloudflare Tunnel

Webhook パスだけをルーティングするようにトンネルの ingress ルールを設定します。

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## 仕組み

1. Google Chat は Webhook POST を Gateway に送信します。各リクエストには `Authorization: Bearer <token>` ヘッダーが含まれます。
   - ヘッダーが存在する場合、OpenClaw は Webhook 本文全体を読み取り/解析する前に bearer 認証を検証します。
   - 本文に `authorizationEventObject.systemIdToken` を含む Google Workspace Add-on リクエストは、より厳格な事前認証本文予算を通じてサポートされます。
2. OpenClaw は設定された `audienceType` + `audience` に対してトークンを検証します。
   - `audienceType: "app-url"` → オーディエンスは HTTPS Webhook URL です。
   - `audienceType: "project-number"` → オーディエンスは Cloud プロジェクト番号です。
3. メッセージはスペースごとにルーティングされます。
   - DM はセッションキー `agent:<agentId>:googlechat:direct:<spaceId>` を使用します。
   - スペースはセッションキー `agent:<agentId>:googlechat:group:<spaceId>` を使用します。
4. DM アクセスはデフォルトでペアリングです。不明な送信者はペアリングコードを受け取り、次で承認します。
   - `openclaw pairing approve googlechat <code>`
5. グループスペースではデフォルトで @メンションが必要です。メンション検出でアプリのユーザー名が必要な場合は `botUser` を使用します。

## ターゲット

配信と許可リストには次の識別子を使用します。

- ダイレクトメッセージ: `users/<userId>` (推奨)。
- 生のメールアドレス `name@example.com` は変更可能であり、`channels.googlechat.dangerouslyAllowNameMatching: true` の場合にのみ直接許可リスト照合に使用されます。
- 非推奨: `users/<email>` はメール許可リストではなくユーザー ID として扱われます。
- スペース: `spaces/<spaceId>`。

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
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
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

- サービス アカウントの認証情報は `serviceAccount` (JSON 文字列) でインライン渡しすることもできます。
- `serviceAccountRef` もサポートされます (env/file SecretRef)。`channels.googlechat.accounts.<id>.serviceAccountRef` 配下のアカウントごとの参照も含みます。
- `webhookPath` が設定されていない場合、デフォルトの Webhook パスは `/googlechat` です。
- `dangerouslyAllowNameMatching` は、許可リスト用の変更可能なメールプリンシパル照合を再度有効にします (緊急互換モード)。
- `actions.reactions` が有効な場合、リアクションは `reactions` ツールと `channels action` から利用できます。
- メッセージアクションは、テキスト用の `send` と、明示的な添付ファイル送信用の `upload-file` を公開します。`upload-file` は `media` / `filePath` / `path` に加え、任意の `message`、`filename`、スレッドターゲットを受け付けます。
- `typingIndicator` は `none`、`message` (デフォルト)、`reaction` をサポートします (`reaction` にはユーザー OAuth が必要です)。
- 添付ファイルは Chat API 経由でダウンロードされ、メディアパイプラインに保存されます (サイズは `mediaMaxMb` で上限設定)。

Secrets 参照の詳細: [Secrets 管理](/ja-JP/gateway/secrets)。

## トラブルシューティング

### 405 Method Not Allowed

Google Cloud Logs Explorer に次のようなエラーが表示される場合:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

これは Webhook ハンドラーが登録されていないことを意味します。一般的な原因:

1. **チャンネルが設定されていない**: 設定に `channels.googlechat` セクションがありません。次で確認します。

   ```bash
   openclaw config get channels.googlechat
   ```

   "Config path not found" が返る場合は、設定を追加します ([設定の要点](#config-highlights) を参照)。

2. **Plugin が有効ではない**: Plugin のステータスを確認します。

   ```bash
   openclaw plugins list | grep googlechat
   ```

   "disabled" と表示される場合は、設定に `plugins.entries.googlechat.enabled: true` を追加します。

3. **Gateway が再起動されていない**: 設定を追加した後、Gateway を再起動します。

   ```bash
   openclaw gateway restart
   ```

チャンネルが実行中であることを確認します。

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### その他の問題

- 認証エラーやオーディエンス設定不足を確認するには `openclaw channels status --probe` を確認します。
- メッセージが届かない場合は、Chat アプリの Webhook URL + イベントサブスクリプションを確認します。
- メンションゲートが返信をブロックする場合は、`botUser` をアプリのユーザーリソース名に設定し、`requireMention` を確認します。
- テストメッセージを送信しながら `openclaw logs --follow` を使用して、リクエストが Gateway に到達しているか確認します。

関連ドキュメント:

- [Gateway 設定](/ja-JP/gateway/configuration)
- [セキュリティ](/ja-JP/gateway/security)
- [リアクション](/ja-JP/tools/reactions)

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
