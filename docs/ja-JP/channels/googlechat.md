---
read_when:
    - Google Chatチャンネル機能に取り組む
summary: Google Chatアプリのサポート状況、機能、設定
title: Google Chat
x-i18n:
    generated_at: "2026-04-24T04:45:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc27c89fd563abab6214912687e0f15c80c7d3e652e9159bf8b43190b0886a
    source_path: channels/googlechat.md
    workflow: 15
---

ステータス: Google Chat API Webhook経由のDM + スペースに対応済み（HTTPのみ）。

## クイックセットアップ（初心者向け）

1. Google Cloudプロジェクトを作成し、**Google Chat API** を有効にします。
   - 移動先: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - APIがまだ有効でない場合は、有効化します。
2. **Service Account** を作成します。
   - **Create Credentials** > **Service Account** を押します。
   - 好きな名前を付けます（例: `openclaw-chat`）。
   - 権限は空のままにします（**Continue** を押す）。
   - アクセス権を持つプリンシパルも空のままにします（**Done** を押す）。
3. **JSON Key** を作成してダウンロードします。
   - Service Accountの一覧で、今作成したものをクリックします。
   - **Keys** タブに移動します。
   - **Add Key** > **Create new key** をクリックします。
   - **JSON** を選択して **Create** を押します。
4. ダウンロードしたJSONファイルをGatewayホストに保存します（例: `~/.openclaw/googlechat-service-account.json`）。
5. [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) でGoogle Chatアプリを作成します。
   - **Application info** を入力します。
     - **App name**: （例: `OpenClaw`）
     - **Avatar URL**: （例: `https://openclaw.ai/logo.png`）
     - **Description**: （例: `Personal AI Assistant`）
   - **Interactive features** を有効にします。
   - **Functionality** で **Join spaces and group conversations** をチェックします。
   - **Connection settings** で **HTTP endpoint URL** を選択します。
   - **Triggers** で **Use a common HTTP endpoint URL for all triggers** を選択し、Gatewayの公開URLの末尾に `/googlechat` を付けて設定します。
     - _ヒント: Gatewayの公開URLは `openclaw status` で確認できます。_
   - **Visibility** で **Make this Chat app available to specific people and groups in `<Your Domain>`** をチェックします。
   - テキストボックスに自分のメールアドレスを入力します（例: `user@example.com`）。
   - 一番下の **Save** をクリックします。
6. **アプリのステータスを有効化** します。
   - 保存後、**ページを再読み込み** します。
   - **App status** セクションを探します（通常は保存後に上部または下部に表示されます）。
   - ステータスを **Live - available to users** に変更します。
   - もう一度 **Save** をクリックします。
7. OpenClawでService Accountのパス + Webhook audienceを設定します。
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - または config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`。
8. Webhook audienceのタイプ + 値を設定します（Chatアプリ設定と一致させます）。
9. Gatewayを起動します。Google ChatがWebhookパスにPOSTします。

## Google Chatに追加

Gatewayが動作中で、あなたのメールアドレスが表示リストに追加されていれば、次の手順で追加できます。

1. [Google Chat](https://chat.google.com/) に移動します。
2. **Direct Messages** の横にある **+**（プラス）アイコンをクリックします。
3. 検索バー（通常は人を追加する場所）に、Google Cloud Consoleで設定した **App name** を入力します。
   - **注意**: このボットはプライベートアプリのため、「Marketplace」の一覧には表示されません。名前で検索する必要があります。
4. 検索結果からボットを選択します。
5. **Add** または **Chat** をクリックして1対1の会話を開始します。
6. 「Hello」を送信してアシスタントを起動します。

## 公開URL（Webhook専用）

Google Chat Webhookには公開されたHTTPSエンドポイントが必要です。セキュリティのため、**インターネットには `/googlechat` パスのみを公開してください**。OpenClawダッシュボードやその他の機密エンドポイントはプライベートネットワーク上に置いてください。

### オプションA: Tailscale Funnel（推奨）

プライベートダッシュボードにはTailscale Serveを使い、公開WebhookパスにはFunnelを使います。これにより `/` はプライベートのまま、`/googlechat` のみを公開できます。

1. **Gatewayがどのアドレスにバインドされているか確認します。**

   ```bash
   ss -tlnp | grep 18789
   ```

   IPアドレス（例: `127.0.0.1`、`0.0.0.0`、または `100.x.x.x` のようなTailscale IP）をメモします。

2. **ダッシュボードをtailnet内のみに公開します（ポート8443）。**

   ```bash
   # localhostにバインドされている場合（127.0.0.1 または 0.0.0.0）:
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Tailscale IPのみにバインドされている場合（例: 100.106.161.80）:
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Webhookパスだけを公開します。**

   ```bash
   # localhostにバインドされている場合（127.0.0.1 または 0.0.0.0）:
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Tailscale IPのみにバインドされている場合（例: 100.106.161.80）:
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **ノードにFunnelアクセスを認可します。**
   プロンプトが表示された場合は、出力に表示される認可URLにアクセスして、tailnetポリシー内でこのノードのFunnelを有効にします。

5. **設定を確認します。**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

公開Webhook URLは次のようになります。
`https://<node-name>.<tailnet>.ts.net/googlechat`

プライベートダッシュボードはtailnet内専用のままです。
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chatアプリ設定では公開URL（`:8443` なし）を使用してください。

> 注: この設定は再起動後も保持されます。後で削除するには、`tailscale funnel reset` と `tailscale serve reset` を実行してください。

### オプションB: リバースプロキシ（Caddy）

Caddyのようなリバースプロキシを使う場合は、特定のパスのみをプロキシしてください。

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

この設定では、`your-domain.com/` へのリクエストは無視されるか404を返し、`your-domain.com/googlechat` は安全にOpenClawへルーティングされます。

### オプションC: Cloudflare Tunnel

トンネルのingressルールを設定し、Webhookパスだけをルーティングします。

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## 仕組み

1. Google ChatがGatewayにWebhook POSTを送信します。各リクエストには `Authorization: Bearer <token>` ヘッダーが含まれます。
   - OpenClawは、ヘッダーが存在する場合、Webhook本文全体を読み取り/解析する前にbearer認証を検証します。
   - 本文内に `authorizationEventObject.systemIdToken` を含むGoogle Workspace Add-onリクエストは、より厳格な事前認証用本文上限を通じてサポートされます。
2. OpenClawは、設定された `audienceType` + `audience` に対してトークンを検証します。
   - `audienceType: "app-url"` → audienceはあなたのHTTPS Webhook URLです。
   - `audienceType: "project-number"` → audienceはCloudプロジェクト番号です。
3. メッセージはスペースごとにルーティングされます。
   - DMはセッションキー `agent:<agentId>:googlechat:direct:<spaceId>` を使用します。
   - スペースはセッションキー `agent:<agentId>:googlechat:group:<spaceId>` を使用します。
4. DMアクセスはデフォルトでペアリングです。未知の送信者にはペアリングコードが送られ、次で承認します。
   - `openclaw pairing approve googlechat <code>`
5. グループスペースではデフォルトで@メンションが必要です。メンション検出にアプリのユーザー名が必要な場合は `botUser` を使ってください。

## ターゲット

配信と許可リストには次の識別子を使用します。

- ダイレクトメッセージ: `users/<userId>`（推奨）。
- 生のメールアドレス `name@example.com` は可変であり、`channels.googlechat.dangerouslyAllowNameMatching: true` の場合にのみ、ダイレクトな許可リスト照合で使用されます。
- 非推奨: `users/<email>` はメール許可リストではなくユーザーIDとして扱われます。
- スペース: `spaces/<spaceId>`。

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
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // 任意; メンション検出に役立つ
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "短い回答のみ。",
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

- Service Account認証情報は `serviceAccount`（JSON文字列）としてインラインで渡すこともできます。
- `serviceAccountRef` もサポートされています（env/file SecretRef）。`channels.googlechat.accounts.<id>.serviceAccountRef` のアカウントごとの参照も含みます。
- `webhookPath` を設定しない場合、デフォルトのWebhookパスは `/googlechat` です。
- `dangerouslyAllowNameMatching` は、許可リスト用の可変メールプリンシパル照合を再有効化します（緊急用互換モード）。
- `actions.reactions` が有効な場合、リアクションは `reactions` ツールおよび `channels action` で利用できます。
- メッセージアクションでは、テキスト用の `send` と、明示的な添付ファイル送信用の `upload-file` を提供します。`upload-file` は `media` / `filePath` / `path` と、任意で `message`、`filename`、スレッド指定を受け取ります。
- `typingIndicator` は `none`、`message`（デフォルト）、`reaction` をサポートします（reactionにはユーザーOAuthが必要です）。
- 添付ファイルはChat API経由でダウンロードされ、メディアパイプラインに保存されます（サイズ上限は `mediaMaxMb`）。

Secrets参照の詳細: [Secrets Management](/ja-JP/gateway/secrets)。

## トラブルシューティング

### 405 Method Not Allowed

Google Cloud Logs Explorerに次のようなエラーが表示される場合:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

これはWebhookハンドラーが登録されていないことを意味します。よくある原因:

1. **チャンネルが設定されていない**: configに `channels.googlechat` セクションがありません。次で確認します。

   ```bash
   openclaw config get channels.googlechat
   ```

   「Config path not found」と返る場合は、設定を追加してください（[設定の要点](#config-highlights)を参照）。

2. **Pluginが有効でない**: Pluginの状態を確認します。

   ```bash
   openclaw plugins list | grep googlechat
   ```

   「disabled」と表示される場合は、configに `plugins.entries.googlechat.enabled: true` を追加してください。

3. **Gatewayが再起動されていない**: 設定追加後にGatewayを再起動します。

   ```bash
   openclaw gateway restart
   ```

チャンネルが動作していることを確認します。

```bash
openclaw channels status
# 表示例: Google Chat default: enabled, configured, ...
```

### その他の問題

- 認証エラーやaudience設定不足は `openclaw channels status --probe` で確認してください。
- メッセージが届かない場合は、ChatアプリのWebhook URLとイベントサブスクリプションを確認してください。
- メンション制御によって返信がブロックされる場合は、`botUser` をアプリのユーザーリソース名に設定し、`requireMention` を確認してください。
- テストメッセージ送信中に `openclaw logs --follow` を使うと、リクエストがGatewayに到達しているか確認できます。

関連ドキュメント:

- [Gateway configuration](/ja-JP/gateway/configuration)
- [Security](/ja-JP/gateway/security)
- [Reactions](/ja-JP/tools/reactions)

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャンネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
