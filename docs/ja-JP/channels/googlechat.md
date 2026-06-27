---
read_when:
    - Google Chat チャネル機能に取り組む
summary: Google Chat アプリのサポート状況、機能、設定
title: Google Chat
x-i18n:
    generated_at: "2026-06-27T10:33:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d506f6e92bfb73940254ca906c7581f24ac49d3f498fcae213eae71c4449442
    source_path: channels/googlechat.md
    workflow: 16
---

ステータス: Google Chat API Webhook 経由の DM + スペース用のダウンロード可能な Plugin (HTTP のみ)。

## インストール

チャンネルを設定する前に Google Chat をインストールします。

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
   - API がまだ有効でない場合は有効にします。
2. **サービス アカウント**を作成します。
   - **認証情報を作成** > **サービス アカウント**を押します。
   - 任意の名前を付けます (例: `openclaw-chat`)。
   - 権限は空欄のままにします (**続行**を押します)。
   - アクセス権を持つプリンシパルは空欄のままにします (**完了**を押します)。
3. **JSON キー**を作成してダウンロードします。
   - サービス アカウントの一覧で、作成したばかりのアカウントをクリックします。
   - **キー**タブに移動します。
   - **キーを追加** > **新しいキーを作成**をクリックします。
   - **JSON** を選択して **作成**を押します。
4. ダウンロードした JSON ファイルを Gateway ホストに保存します (例: `~/.openclaw/googlechat-service-account.json`)。
5. [Google Cloud Console Chat 設定](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat)で Google Chat アプリを作成します。
   - **アプリケーション情報**を入力します。
     - **アプリ名**: (例: `OpenClaw`)
     - **アバター URL**: (例: `https://openclaw.ai/logo.png`)
     - **説明**: (例: `Personal AI Assistant`)
   - **インタラクティブ機能**を有効にします。
   - **機能**で、**スペースとグループ会話に参加**にチェックを入れます。
   - **接続設定**で、**HTTP エンドポイント URL**を選択します。
   - **トリガー**で、**すべてのトリガーに共通の HTTP エンドポイント URL を使用**を選択し、Gateway の公開 URL に `/googlechat` を付けたものを設定します。
     - _ヒント: Gateway の公開 URL を確認するには `openclaw status` を実行します。_
   - **公開設定**で、**この Chat アプリを `<Your Domain>` 内の特定のユーザーとグループに公開する**にチェックを入れます。
   - テキストボックスにメールアドレス (例: `user@example.com`) を入力します。
   - 下部の **保存**をクリックします。
6. **アプリのステータスを有効にします**。
   - 保存後、**ページを更新**します。
   - **アプリのステータス**セクションを探します (通常、保存後に上部または下部付近にあります)。
   - ステータスを **ライブ - ユーザーが利用可能**に変更します。
   - もう一度 **保存**をクリックします。
7. サービス アカウントのパス + Webhook audience で OpenClaw を設定します。
   - 環境変数: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - または config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`。
8. Webhook audience の種類 + 値を設定します (Chat アプリの設定と一致させます)。
9. Gateway を起動します。Google Chat は Webhook パスに POST します。

## Google Chat に追加

Gateway が実行中で、メールアドレスが公開設定リストに追加されたら:

1. [Google Chat](https://chat.google.com/) に移動します。
2. **ダイレクト メッセージ**の横にある **+** (プラス) アイコンをクリックします。
3. 検索バー (通常ユーザーを追加する場所) に、Google Cloud Console で設定した**アプリ名**を入力します。
   - **注**: 非公開アプリのため、ボットは「Marketplace」の参照リストには_表示されません_。名前で検索する必要があります。
4. 結果からボットを選択します。
5. **追加**または **チャット**をクリックして 1:1 会話を開始します。
6. アシスタントを起動するために「こんにちは」を送信します。

## 公開 URL (Webhook のみ)

Google Chat Webhook には公開 HTTPS エンドポイントが必要です。セキュリティのため、インターネットには **`/googlechat` パスのみを公開**します。OpenClaw ダッシュボードやその他の機密エンドポイントはプライベートネットワーク上に保持してください。

### オプション A: Tailscale Funnel (推奨)

プライベートダッシュボードには Tailscale Serve を、公開 Webhook パスには Funnel を使用します。これにより `/` はプライベートのまま、`/googlechat` のみを公開できます。

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

3. **Webhook パスのみを公開します。**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Funnel アクセス用にノードを承認します。**
   プロンプトが表示された場合は、出力に表示される承認 URL にアクセスし、tailnet ポリシーでこのノードの Funnel を有効にします。

5. **設定を確認します。**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

公開 Webhook URL は次のようになります。
`https://<node-name>.<tailnet>.ts.net/googlechat`

プライベートダッシュボードは tailnet のみのままです。
`https://<node-name>.<tailnet>.ts.net:8443/`

Google Chat アプリ設定では公開 URL (`:8443` なし) を使用します。

> 注: この設定は再起動後も保持されます。後で削除するには、`tailscale funnel reset` と `tailscale serve reset` を実行します。

### オプション B: リバースプロキシ (Caddy)

Caddy のようなリバースプロキシを使用する場合は、特定のパスのみをプロキシします。

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

この設定では、`your-domain.com/` へのリクエストは無視されるか 404 を返し、`your-domain.com/googlechat` は安全に OpenClaw へルーティングされます。

### オプション C: Cloudflare Tunnel

Webhook パスのみをルーティングするように Tunnel の ingress ルールを設定します。

- **パス**: `/googlechat` -> `http://localhost:18789/googlechat`
- **デフォルトルール**: HTTP 404 (Not Found)

## 仕組み

1. Google Chat は Webhook POST を Gateway に送信します。各リクエストには `Authorization: Bearer <token>` ヘッダーが含まれます。
   - OpenClaw は、ヘッダーが存在する場合、Webhook 本文全体を読み取り/解析する前に bearer 認証を検証します。
   - 本文に `authorizationEventObject.systemIdToken` を含む Google Workspace Add-on リクエストは、より厳格な事前認証本文バジェットでサポートされます。
2. OpenClaw は、設定された `audienceType` + `audience` に対してトークンを検証します。
   - `audienceType: "app-url"` → audience は HTTPS Webhook URL です。
   - `audienceType: "project-number"` → audience は Cloud プロジェクト番号です。
3. メッセージはスペース別にルーティングされます。
   - DM はセッションキー `agent:<agentId>:googlechat:direct:<spaceId>` を使用します。
   - スペースはセッションキー `agent:<agentId>:googlechat:group:<spaceId>` を使用します。
4. DM アクセスはデフォルトでペアリングです。不明な送信者にはペアリングコードが送られます。次で承認します。
   - `openclaw pairing approve googlechat <code>`
5. グループスペースではデフォルトで @メンションが必要です。メンション検出にアプリのユーザー名が必要な場合は `botUser` を使用します。
6. exec または Plugin 承認リクエストが Google Chat から開始され、安定した `users/<id>` 承認者が設定されている場合、OpenClaw は発信元スペースまたはスレッドにネイティブの Google Chat 承認カードを投稿します。カードボタンは不透明なコールバックトークンを使用し、ネイティブ承認配信が利用できない場合にのみ手動の `/approve <id> <decision>` プロンプトが表示されます。

## ターゲット

配信と許可リストには次の識別子を使用します。

- ダイレクトメッセージ: `users/<userId>` (推奨)。
- 生のメールアドレス `name@example.com` は変更可能であり、`channels.googlechat.dangerouslyAllowNameMatching: true` の場合にのみダイレクト許可リスト照合に使用されます。
- 非推奨: `users/<email>` はメール許可リストではなくユーザー ID として扱われます。
- スペース: `spaces/<spaceId>`。

## Config の要点

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

- サービス アカウント認証情報は `serviceAccount` (JSON 文字列) でインライン渡しすることもできます。
- `serviceAccountRef` もサポートされています (env/file SecretRef)。`channels.googlechat.accounts.<id>.serviceAccountRef` 配下のアカウント別 refs も含みます。
- `webhookPath` が設定されていない場合、デフォルトの Webhook パスは `/googlechat` です。
- `dangerouslyAllowNameMatching` は、許可リスト用に変更可能なメールプリンシパル照合を再度有効にします (緊急互換モード)。
- `actions.reactions` が有効な場合、リアクションは `reactions` ツールと `channels action` で利用できます。
- ネイティブ承認カードは、リアクションイベントではなく Google Chat `cardsV2` ボタンクリックを使用します。承認者は `dm.allowFrom` または `defaultTo` から取得され、安定した数値の `users/<id>` 値である必要があります。
- メッセージアクションは、テキスト用に `send`、明示的な添付ファイル送信用に `upload-file` を公開します。`upload-file` は `media` / `filePath` / `path` に加え、任意の `message`、`filename`、スレッドターゲットを受け付けます。
- `typingIndicator` は `message` (デフォルト)、`none`、`reaction` をサポートします (`reaction` にはユーザー OAuth が必要です)。
- 添付ファイルは Chat API 経由でダウンロードされ、メディアパイプラインに保存されます (サイズは `mediaMaxMb` で上限設定)。
- ボットが作成した Google Chat メッセージはデフォルトで無視されます。意図的に `allowBots: true` を設定した場合、受け入れられたボット作成メッセージは共有の[ボットループ保護](/ja-JP/channels/bot-loop-protection)を使用します。`channels.defaults.botLoopProtection` を設定し、あるスペースに異なるバジェットが必要な場合は `channels.googlechat.botLoopProtection` または `channels.googlechat.groups.<space>.botLoopProtection` で上書きします。

シークレット参照の詳細: [シークレット管理](/ja-JP/gateway/secrets)。

## トラブルシューティング

### 405 Method Not Allowed

Google Cloud Logs Explorer に次のようなエラーが表示される場合:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

これは Webhook ハンドラーが登録されていないことを意味します。一般的な原因:

1. **チャンネルが設定されていない**: config に `channels.googlechat` セクションがありません。次で確認します。

   ```bash
   openclaw config get channels.googlechat
   ```

   「Config path not found」が返る場合は、設定を追加します ([Config の要点](#config-highlights)を参照)。

2. **Plugin が有効化されていない**: Plugin のステータスを確認します。

   ```bash
   openclaw plugins list | grep googlechat
   ```

   「disabled」と表示される場合は、config に `plugins.entries.googlechat.enabled: true` を追加します。

3. **Gateway が再起動されていない**: config を追加した後、Gateway を再起動します。

   ```bash
   openclaw gateway restart
   ```

チャンネルが実行中であることを確認します。

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### その他の問題

- 認証エラーや audience config の不足を確認するには `openclaw channels status --probe` を確認します。
- メッセージが届かない場合は、Chat アプリの Webhook URL + イベントサブスクリプションを確認します。
- メンションゲートにより返信がブロックされる場合は、`botUser` をアプリのユーザーリソース名に設定し、`requireMention` を確認します。
- Gateway にリクエストが到達しているか確認するには、テストメッセージを送信しながら `openclaw logs --follow` を使用します。

関連ドキュメント:

- [Gateway 設定](/ja-JP/gateway/configuration)
- [セキュリティ](/ja-JP/gateway/security)
- [リアクション](/ja-JP/tools/reactions)

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
