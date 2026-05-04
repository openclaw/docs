---
read_when:
    - Google Chat のチャンネル機能に取り組む
summary: Google Chat アプリのサポート状況、機能、設定
title: Google Chat
x-i18n:
    generated_at: "2026-05-04T02:21:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: afa2ca4d9673396aa24a55ca5855a34ad26a4640c3a1f6928dbf7246e403cb04
    source_path: channels/googlechat.md
    workflow: 16
---

ステータス: Google Chat API webhooks (HTTP のみ) 経由で DM + スペースに対応するダウンロード可能な Plugin。

## インストール

チャネルを設定する前に Google Chat をインストールします。

```bash
openclaw plugins install @openclaw/googlechat
```

ローカルチェックアウト (git リポジトリから実行する場合):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## クイックセットアップ (初心者向け)

1. Google Cloud プロジェクトを作成し、**Google Chat API** を有効にします。
   - 移動先: [Google Chat API 認証情報](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - API がまだ有効になっていない場合は有効にします。
2. **Service Account** を作成します。
   - **Create Credentials** > **Service Account** を押します。
   - 任意の名前を付けます (例: `openclaw-chat`)。
   - 権限は空のままにします (**Continue** を押します)。
   - アクセス権を持つプリンシパルは空のままにします (**Done** を押します)。
3. **JSON Key** を作成してダウンロードします。
   - サービスアカウントの一覧で、作成したばかりのアカウントをクリックします。
   - **Keys** タブに移動します。
   - **Add Key** > **Create new key** をクリックします。
   - **JSON** を選択し、**Create** を押します。
4. ダウンロードした JSON ファイルを Gateway ホストに保存します (例: `~/.openclaw/googlechat-service-account.json`)。
5. [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) で Google Chat アプリを作成します。
   - **Application info** を入力します。
     - **App name**: (例: `OpenClaw`)
     - **Avatar URL**: (例: `https://openclaw.ai/logo.png`)
     - **Description**: (例: `Personal AI Assistant`)
   - **Interactive features** を有効にします。
   - **Functionality** で、**Join spaces and group conversations** にチェックを入れます。
   - **Connection settings** で、**HTTP endpoint URL** を選択します。
   - **Triggers** で、**Use a common HTTP endpoint URL for all triggers** を選択し、Gateway の公開 URL に `/googlechat` を付けたものを設定します。
     - _ヒント: `openclaw status` を実行して Gateway の公開 URL を確認します。_
   - **Visibility** で、**Make this Chat app available to specific people and groups in `<Your Domain>`** にチェックを入れます。
   - テキストボックスにメールアドレス (例: `user@example.com`) を入力します。
   - 下部の **Save** をクリックします。
6. **アプリのステータスを有効化します**。
   - 保存後、**ページを更新**します。
   - **App status** セクションを探します (通常、保存後はページの上部または下部付近にあります)。
   - ステータスを **Live - available to users** に変更します。
   - もう一度 **Save** をクリックします。
7. サービスアカウントのパス + Webhook audience を指定して OpenClaw を設定します。
   - 環境変数: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - または設定: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`。
8. Webhook audience type + value を設定します (Chat アプリ設定と一致させます)。
9. Gateway を起動します。Google Chat が Webhook パスに POST します。

## Google Chat に追加

Gateway が実行中で、メールアドレスが公開範囲リストに追加されている場合:

1. [Google Chat](https://chat.google.com/) に移動します。
2. **Direct Messages** の横にある **+** (プラス) アイコンをクリックします。
3. 検索バー (通常、人を追加する場所) に、Google Cloud Console で設定した **App name** を入力します。
   - **注**: これは非公開アプリのため、ボットは "Marketplace" の閲覧リストには表示されません。名前で検索する必要があります。
4. 結果からボットを選択します。
5. **Add** または **Chat** をクリックして 1:1 の会話を開始します。
6. "Hello" を送信してアシスタントをトリガーします。

## 公開 URL (Webhook のみ)

Google Chat webhooks には公開 HTTPS エンドポイントが必要です。セキュリティのため、インターネットに公開するのは **`/googlechat` パスのみ**にしてください。OpenClaw ダッシュボードやその他の機密エンドポイントはプライベートネットワークに保持します。

### オプション A: Tailscale Funnel (推奨)

プライベートダッシュボードには Tailscale Serve を使用し、公開 Webhook パスには Funnel を使用します。これにより `/` はプライベートのまま、`/googlechat` のみを公開できます。

1. **Gateway がバインドされているアドレスを確認します。**

   ```bash
   ss -tlnp | grep 18789
   ```

   IP アドレスを確認します (例: `127.0.0.1`、`0.0.0.0`、または `100.x.x.x` のような Tailscale IP)。

2. **ダッシュボードを tailnet のみに公開します (ポート 8443)。**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Webhook パスのみを公開します。**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Funnel アクセス用にノードを認可します。**
   プロンプトが表示された場合は、出力に表示された認可 URL にアクセスして、このノードの Funnel を tailnet ポリシーで有効にします。

5. **設定を確認します。**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

公開 Webhook URL は次のようになります。
`https://<node-name>.<tailnet>.ts.net/googlechat`

プライベートダッシュボードは tailnet 専用のままです。
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat アプリ設定では、公開 URL (`:8443` なし) を使用します。

> 注: この設定は再起動後も保持されます。後で削除するには、`tailscale funnel reset` と `tailscale serve reset` を実行します。

### オプション B: リバースプロキシ (Caddy)

Caddy のようなリバースプロキシを使用する場合は、特定のパスのみをプロキシします。

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

この設定では、`your-domain.com/` へのリクエストは無視されるか 404 として返され、`your-domain.com/googlechat` は安全に OpenClaw へルーティングされます。

### オプション C: Cloudflare Tunnel

トンネルの ingress ルールを、Webhook パスのみをルーティングするように設定します。

- **パス**: `/googlechat` -> `http://localhost:18789/googlechat`
- **デフォルトルール**: HTTP 404 (Not Found)

## 仕組み

1. Google Chat は Gateway に Webhook POST を送信します。各リクエストには `Authorization: Bearer <token>` ヘッダーが含まれます。
   - OpenClaw は、ヘッダーが存在する場合、Webhook 本文全体を読み取り/解析する前に bearer auth を検証します。
   - 本文に `authorizationEventObject.systemIdToken` を含む Google Workspace Add-on リクエストは、より厳格な事前認証本文予算でサポートされます。
2. OpenClaw は、設定された `audienceType` + `audience` に対してトークンを検証します。
   - `audienceType: "app-url"` → audience は HTTPS Webhook URL です。
   - `audienceType: "project-number"` → audience は Cloud プロジェクト番号です。
3. メッセージはスペースごとにルーティングされます。
   - DM はセッションキー `agent:<agentId>:googlechat:direct:<spaceId>` を使用します。
   - スペースはセッションキー `agent:<agentId>:googlechat:group:<spaceId>` を使用します。
4. DM アクセスはデフォルトでペアリングです。不明な送信者にはペアリングコードが届きます。次で承認します。
   - `openclaw pairing approve googlechat <code>`
5. グループスペースでは、デフォルトで @メンションが必要です。メンション検出にアプリのユーザー名が必要な場合は `botUser` を使用します。

## ターゲット

配信と許可リストには、これらの識別子を使用します。

- ダイレクトメッセージ: `users/<userId>` (推奨)。
- 生のメール `name@example.com` は変更可能であり、`channels.googlechat.dangerouslyAllowNameMatching: true` の場合にのみ直接許可リスト照合に使用されます。
- 非推奨: `users/<email>` はメール許可リストではなく、ユーザー ID として扱われます。
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

- サービスアカウント認証情報は、`serviceAccount` (JSON 文字列) でインライン渡しすることもできます。
- `serviceAccountRef` もサポートされています (env/file SecretRef)。`channels.googlechat.accounts.<id>.serviceAccountRef` 配下のアカウント別 ref も含みます。
- `webhookPath` が設定されていない場合、デフォルトの Webhook パスは `/googlechat` です。
- `dangerouslyAllowNameMatching` は、許可リスト向けに変更可能なメールプリンシパル照合を再有効化します (緊急時互換モード)。
- リアクションは、`actions.reactions` が有効な場合に `reactions` ツールと `channels action` で利用できます。
- メッセージアクションは、テキスト用の `send` と、明示的な添付送信用の `upload-file` を公開します。`upload-file` は `media` / `filePath` / `path` に加え、任意の `message`、`filename`、スレッドターゲットを受け付けます。
- `typingIndicator` は `none`、`message` (デフォルト)、`reaction` をサポートします (`reaction` にはユーザー OAuth が必要です)。
- 添付ファイルは Chat API 経由でダウンロードされ、メディアパイプラインに保存されます (サイズは `mediaMaxMb` で上限設定)。

シークレット参照の詳細: [シークレット管理](/ja-JP/gateway/secrets)。

## トラブルシューティング

### 405 Method Not Allowed

Google Cloud Logs Explorer に次のようなエラーが表示される場合:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

これは Webhook ハンドラーが登録されていないことを意味します。一般的な原因:

1. **チャネルが設定されていない**: 設定に `channels.googlechat` セクションがありません。次で確認します。

   ```bash
   openclaw config get channels.googlechat
   ```

   "Config path not found" が返る場合は、設定を追加します ([設定の要点](#config-highlights) を参照)。

2. **Plugin が有効化されていない**: Plugin のステータスを確認します。

   ```bash
   openclaw plugins list | grep googlechat
   ```

   "disabled" と表示される場合は、設定に `plugins.entries.googlechat.enabled: true` を追加します。

3. **Gateway が再起動されていない**: 設定を追加した後、Gateway を再起動します。

   ```bash
   openclaw gateway restart
   ```

チャネルが実行中であることを確認します。

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### その他の問題

- 認証エラーや audience 設定の欠落を確認するには、`openclaw channels status --probe` を確認します。
- メッセージが届かない場合は、Chat アプリの Webhook URL + イベントサブスクリプションを確認します。
- メンションゲートにより返信がブロックされる場合は、`botUser` をアプリのユーザーリソース名に設定し、`requireMention` を確認します。
- テストメッセージを送信しながら `openclaw logs --follow` を使用して、リクエストが Gateway に到達しているか確認します。

関連ドキュメント:

- [Gateway 設定](/ja-JP/gateway/configuration)
- [セキュリティ](/ja-JP/gateway/security)
- [リアクション](/ja-JP/tools/reactions)

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
