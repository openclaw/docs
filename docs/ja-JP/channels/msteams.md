---
read_when:
    - Microsoft Teams チャネル機能に取り組んでいる場合
summary: Microsoft Teams ボットサポートのステータス、機能、設定
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-24T04:46:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba01e831382d31a3787b94d1c882d911c91c0f43d2aff84fd4ac5041423a08ac
    source_path: channels/msteams.md
    workflow: 15
---

テキストと DM 添付ファイルはサポートされています。チャンネルおよびグループでのファイル送信には `sharePointSiteId` と Graph 権限が必要です（[グループチャットでのファイル送信](#sending-files-in-group-chats) を参照）。投票は Adaptive Cards で送信されます。メッセージアクションでは、ファイル優先の送信のために明示的な `upload-file` が提供されます。

## バンドル済み Plugin

Microsoft Teams は現在の OpenClaw リリースではバンドル済み Plugin として提供されるため、通常のパッケージビルドでは
別途インストールは不要です。

古いビルドまたはバンドル済み Teams を含まないカスタムインストールを使用している場合は、
手動でインストールしてください。

```bash
openclaw plugins install @openclaw/msteams
```

ローカルチェックアウト（git リポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ（初心者向け）

1. Microsoft Teams Plugin が利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースには、すでにこれがバンドルされています。
   - 古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
2. **Azure Bot** を作成します（App ID + クライアントシークレット + テナント ID）。
3. それらの認証情報で OpenClaw を設定します。
4. 公開 URL またはトンネル経由で `/api/messages`（デフォルトはポート 3978）を公開します。
5. Teams アプリパッケージをインストールし、Gateway を起動します。

最小構成（クライアントシークレット）:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

本番デプロイでは、クライアントシークレットの代わりに [federated authentication](#federated-authentication)（証明書またはマネージド ID）の使用を検討してください。

注: グループチャットはデフォルトでブロックされます（`channels.msteams.groupPolicy: "allowlist"`）。グループ返信を許可するには、`channels.msteams.groupAllowFrom` を設定してください（または `groupPolicy: "open"` を使用して、任意のメンバーを許可できます。デフォルトではメンションゲートありです）。

## 設定の書き込み

デフォルトでは、Microsoft Teams では `/config set|unset` によってトリガーされる設定更新の書き込みが許可されています（`commands.config: true` が必要です）。

無効にするには、次を設定します。

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## アクセス制御（DM + グループ）

**DM アクセス**

- デフォルト: `channels.msteams.dmPolicy = "pairing"`。未知の送信者は承認されるまで無視されます。
- `channels.msteams.allowFrom` には安定した AAD オブジェクト ID を使用する必要があります。
- UPN や表示名の一致を許可リストに頼らないでください。これらは変更される可能性があります。OpenClaw はデフォルトで直接の名前一致を無効にしています。明示的に有効化するには `channels.msteams.dangerouslyAllowNameMatching: true` を設定してください。
- ウィザードは、認証情報に権限がある場合、Microsoft Graph を介して名前を ID に解決できます。

**グループアクセス**

- デフォルト: `channels.msteams.groupPolicy = "allowlist"`（`groupAllowFrom` を追加しない限りブロックされます）。未設定時のデフォルトを上書きするには `channels.defaults.groupPolicy` を使用します。
- `channels.msteams.groupAllowFrom` は、グループチャット/チャンネルでどの送信者がトリガーできるかを制御します（`channels.msteams.allowFrom` にフォールバックします）。
- `groupPolicy: "open"` を設定すると、任意のメンバーを許可します（デフォルトでは引き続きメンションゲートあり）。
- **チャンネルを一切許可しない** 場合は、`channels.msteams.groupPolicy: "disabled"` を設定します。

例:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + チャンネル許可リスト**

- `channels.msteams.teams` の下に Teams とチャンネルを列挙することで、グループ/チャンネル返信のスコープを制限します。
- キーには、安定した Team ID とチャンネル会話 ID を使用する必要があります。
- `groupPolicy="allowlist"` で Teams の許可リストが存在する場合、列挙された Teams/チャンネルのみが受け入れられます（メンションゲートあり）。
- 設定ウィザードは `Team/Channel` エントリを受け付け、それらを保存します。
- 起動時に、OpenClaw は Team/チャンネルおよびユーザー許可リスト名を ID に解決し（Graph 権限が許す場合）、
  その対応をログに記録します。解決できなかった Team/チャンネル名は入力どおり保持されますが、デフォルトではルーティングで無視されます。`channels.msteams.dangerouslyAllowNameMatching: true` が有効な場合を除きます。

例:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## Azure Bot のセットアップ

OpenClaw を設定する前に、Azure Bot リソースを作成し、その認証情報を取得してください。

<Steps>
  <Step title="Azure Bot を作成する">
    [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) に移動し、**Basics** タブに入力します。

    | Field              | Value                                                    |
    | ------------------ | -------------------------------------------------------- |
    | **Bot handle**     | ボット名。例: `openclaw-msteams`（一意である必要があります） |
    | **Subscription**   | 使用する Azure サブスクリプション |
    | **Resource group** | 新規作成または既存のものを使用 |
    | **Pricing tier**   | 開発/テスト用は **Free** |
    | **Type of App**    | **Single Tenant**（推奨） |
    | **Creation type**  | **Create new Microsoft App ID** |

    <Note>
    新しいマルチテナント Bot は 2025-07-31 以降非推奨になりました。新しい Bot では **Single Tenant** を使用してください。
    </Note>

    **Review + create** → **Create** をクリックします（約 1〜2 分待ちます）。

  </Step>

  <Step title="認証情報を取得する">
    Azure Bot リソース → **Configuration** から:

    - **Microsoft App ID** をコピー → `appId`
    - **Manage Password** → **Certificates & secrets** → **New client secret** → 値をコピー → `appPassword`
    - **Overview** → **Directory (tenant) ID** → `tenantId`

  </Step>

  <Step title="メッセージングエンドポイントを設定する">
    Azure Bot → **Configuration** → **Messaging endpoint** を設定します。

    - 本番: `https://your-domain.com/api/messages`
    - ローカル開発: トンネルを使用します（[ローカル開発](#local-development-tunneling) を参照）

  </Step>

  <Step title="Teams チャンネルを有効にする">
    Azure Bot → **Channels** → **Microsoft Teams** をクリック → Configure → Save。利用規約に同意してください。
  </Step>
</Steps>

## フェデレーテッド認証

> 2026.3.24 で追加

本番デプロイ向けに、OpenClaw はクライアントシークレットより安全な代替手段として **federated authentication** をサポートしています。使用できる方法は 2 つあります。

### オプション A: 証明書ベース認証

Entra ID のアプリ登録に登録された PEM 証明書を使用します。

**セットアップ:**

1. 証明書を生成または取得します（秘密鍵を含む PEM 形式）。
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** で公開証明書をアップロードします。

**設定:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**環境変数:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### オプション B: Azure Managed Identity

パスワードレス認証のために Azure Managed Identity を使用します。これは、マネージド ID が利用可能な Azure インフラストラクチャ（AKS、App Service、Azure VM）上のデプロイに最適です。

**仕組み:**

1. ボットの pod/VM にマネージド ID が付与されています（システム割り当てまたはユーザー割り当て）。
2. **federated identity credential** が、そのマネージド ID を Entra ID アプリ登録に関連付けます。
3. 実行時に、OpenClaw は `@azure/identity` を使用して Azure IMDS エンドポイント（`169.254.169.254`）からトークンを取得します。
4. そのトークンが Teams SDK に渡され、ボット認証に使用されます。

**前提条件:**

- マネージド ID が有効な Azure インフラストラクチャ（AKS workload identity、App Service、VM）
- Entra ID アプリ登録上に作成された federated identity credential
- pod/VM から IMDS（`169.254.169.254:80`）へのネットワークアクセス

**設定（システム割り当て Managed Identity）:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**設定（ユーザー割り当て Managed Identity）:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**環境変数:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（ユーザー割り当ての場合のみ）

### AKS workload identity のセットアップ

workload identity を使用する AKS デプロイの場合:

1. AKS クラスターで **workload identity** を有効にします。
2. Entra ID アプリ登録に **federated identity credential** を作成します。

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Kubernetes service account** にアプリのクライアント ID をアノテーションします。

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **pod** に workload identity 注入用のラベルを付けます。

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS（`169.254.169.254`）への **ネットワークアクセス** を確保します。NetworkPolicy を使用している場合は、`169.254.169.254/32` のポート 80 へのトラフィックを許可する egress ルールを追加してください。

### 認証方式の比較

| Method               | Config                                         | Pros                               | Cons                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | セットアップが簡単 | シークレットのローテーションが必要、セキュリティが低い |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | ネットワーク上で共有シークレット不要 | 証明書管理のオーバーヘッド |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | パスワードレス、管理するシークレット不要 | Azure インフラストラクチャが必要 |

**デフォルト動作:** `authType` が設定されていない場合、OpenClaw はクライアントシークレット認証をデフォルトで使用します。既存の設定は変更なしで引き続き動作します。

## ローカル開発（トンネリング）

Teams は `localhost` に到達できません。ローカル開発ではトンネルを使用します。

**オプション A: ngrok**

```bash
ngrok http 3978
# https URL をコピーします。例: https://abc123.ngrok.io
# messaging endpoint を次に設定します: https://abc123.ngrok.io/api/messages
```

**オプション B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Tailscale funnel URL を messaging endpoint として使用します
```

## Teams Developer Portal（代替手段）

manifest ZIP を手動で作成する代わりに、[Teams Developer Portal](https://dev.teams.microsoft.com/apps) を使用できます。

1. **+ New app** をクリックします
2. 基本情報（名前、説明、開発者情報）を入力します
3. **App features** → **Bot** に進みます
4. **Enter a bot ID manually** を選択し、Azure Bot App ID を貼り付けます
5. スコープにチェックを入れます: **Personal**、**Team**、**Group Chat**
6. **Distribute** → **Download app package** をクリックします
7. Teams で: **Apps** → **Manage your apps** → **Upload a custom app** → ZIP を選択します

これは JSON manifest を手で編集するより簡単なことがよくあります。

## ボットのテスト

**オプション A: Azure Web Chat（まず Webhook を検証）**

1. Azure Portal → 対象の Azure Bot リソース → **Test in Web Chat**
2. メッセージを送信します。応答が表示されるはずです
3. これにより、Teams セットアップ前に Webhook エンドポイントが動作していることを確認できます

**オプション B: Teams（アプリインストール後）**

1. Teams アプリをインストールします（サイドロードまたは組織カタログ）
2. Teams でボットを見つけて DM を送信します
3. 受信アクティビティについて Gateway ログを確認します

<Accordion title="環境変数による上書き">

ボット/認証設定キーはいずれも環境変数で設定できます。

- `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE`（`"secret"` または `"federated"`）
- `MSTEAMS_CERTIFICATE_PATH`, `MSTEAMS_CERTIFICATE_THUMBPRINT`（federated + 証明書）
- `MSTEAMS_USE_MANAGED_IDENTITY`, `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（federated + managed identity。クライアント ID はユーザー割り当ての場合のみ）

</Accordion>

## メンバー情報アクション

OpenClaw は Microsoft Teams 向けに Graph を利用した `member-info` アクションを提供しており、エージェントや自動化が Microsoft Graph からチャンネルメンバーの詳細（表示名、メール、役割）を直接解決できます。

要件:

- `Member.Read.Group` RSC 権限（推奨 manifest にすでに含まれています）
- チーム横断の検索の場合: 管理者同意付きの `User.Read.All` Graph Application 権限

このアクションは `channels.msteams.actions.memberInfo` によって制御されます（デフォルト: Graph 認証情報が利用可能な場合に有効）。

## 履歴コンテキスト

- `channels.msteams.historyLimit` は、プロンプトに包み込む最近のチャンネル/グループメッセージの数を制御します。
- `messages.groupChat.historyLimit` にフォールバックします。無効にするには `0` を設定します（デフォルト 50）。
- 取得されたスレッド履歴は送信者許可リスト（`allowFrom` / `groupAllowFrom`）でフィルタリングされるため、スレッドコンテキストのシードには許可された送信者からのメッセージのみが含まれます。
- 引用された添付ファイルのコンテキスト（Teams の返信 HTML から導出される `ReplyTo*`）は、現在は受信したまま渡されます。
- つまり、許可リストは誰がエージェントをトリガーできるかを制御し、現時点では特定の補助的なコンテキスト経路だけがフィルタリングされます。
- DM 履歴は `channels.msteams.dmHistoryLimit`（ユーザーターン）で制限できます。ユーザーごとの上書き: `channels.msteams.dms["<user_id>"].historyLimit`。

## 現在の Teams RSC 権限

以下は、Teams アプリ manifest にある**既存の resourceSpecific 権限**です。これらはアプリがインストールされている team/chat 内でのみ適用されます。

**チャンネル向け（team スコープ）:**

- `ChannelMessage.Read.Group` (Application) - @mention なしですべてのチャンネルメッセージを受信
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**グループチャット向け:**

- `ChatMessage.Read.Chat` (Application) - @mention なしですべてのグループチャットメッセージを受信

## Teams manifest の例

必須フィールドを含む最小限で有効な例です。ID と URL は置き換えてください。

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### manifest の注意点（必須フィールド）

- `bots[].botId` は Azure Bot App ID と一致している**必要があります**。
- `webApplicationInfo.id` は Azure Bot App ID と一致している**必要があります**。
- `bots[].scopes` には使用予定のサーフェス（`personal`、`team`、`groupChat`）を含める必要があります。
- `bots[].supportsFiles: true` は personal スコープでのファイル処理に必要です。
- `authorization.permissions.resourceSpecific` には、チャンネルトラフィックが必要な場合、チャンネルの読み取り/送信を含める必要があります。

### 既存アプリの更新

すでにインストール済みの Teams アプリを更新するには（たとえば RSC 権限を追加する場合）:

1. `manifest.json` を新しい設定で更新します
2. **`version` フィールドを増やします**（例: `1.0.0` → `1.1.0`）
3. アイコンと一緒に manifest を**再 zip 化**します（`manifest.json`、`outline.png`、`color.png`）
4. 新しい zip をアップロードします:
   - **オプション A（Teams Admin Center）:** Teams Admin Center → Teams apps → Manage apps → 対象アプリを見つける → Upload new version
   - **オプション B（サイドロード）:** Teams → Apps → Manage your apps → Upload a custom app
5. **team チャンネル向け:** 新しい権限を有効にするには、各 team にアプリを再インストールします
6. キャッシュされたアプリメタデータを消去するため、**Teams を完全に終了して再起動**します（ウィンドウを閉じるだけでは不十分です）

## 機能: RSC のみ vs Graph

### Teams RSC のみ（Graph API 権限なし）

動作するもの:

- チャンネルメッセージの**テキスト**内容の読み取り
- チャンネルメッセージの**テキスト**内容の送信
- **personal（DM）** のファイル添付の受信

動作しないもの:

- チャンネル/グループの**画像やファイル内容**（ペイロードには HTML スタブのみが含まれます）
- SharePoint/OneDrive に保存された添付ファイルのダウンロード
- メッセージ履歴の読み取り（ライブ Webhook イベントを超えるもの）

### Teams RSC + Microsoft Graph application permissions

追加されるもの:

- ホストされたコンテンツ（メッセージに貼り付けられた画像）のダウンロード
- SharePoint/OneDrive に保存されたファイル添付のダウンロード
- Graph 経由でのチャンネル/チャットメッセージ履歴の読み取り

### RSC と Graph API

| Capability              | RSC Permissions      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **リアルタイムメッセージ**  | はい（Webhook 経由）    | いいえ（ポーリングのみ） |
| **履歴メッセージ** | いいえ | はい（履歴を照会可能） |
| **セットアップの複雑さ**    | アプリ manifest のみ    | 管理者同意 + トークンフローが必要 |
| **オフラインで動作**       | いいえ（実行中である必要あり） | はい（いつでも照会可能） |

**要点:** RSC はリアルタイムのリスニング向けで、Graph API は履歴アクセス向けです。オフライン中に見逃したメッセージを追いかけるには、`ChannelMessage.Read.All` を持つ Graph API が必要です（管理者同意が必要）。

## Graph 対応メディア + 履歴（チャンネルで必須）

**チャンネル** で画像/ファイルが必要な場合、または **メッセージ履歴** を取得したい場合は、Microsoft Graph 権限を有効にして管理者同意を付与する必要があります。

1. Entra ID（Azure AD）の **App Registration** で、Microsoft Graph の **Application permissions** を追加します:
   - `ChannelMessage.Read.All`（チャンネル添付 + 履歴）
   - `Chat.Read.All` または `ChatMessage.Read.All`（グループチャット）
2. テナントに対して**管理者同意**を付与します。
3. Teams アプリの **manifest version** を増やして再アップロードし、**Teams にアプリを再インストール**します。
4. キャッシュされたアプリメタデータを消去するため、**Teams を完全に終了して再起動**します。

**ユーザーメンション向けの追加権限:** ユーザーの @mention は、会話内のユーザーについてはそのままで動作します。ただし、**現在の会話にいない** ユーザーを動的に検索してメンションしたい場合は、`User.Read.All`（Application）権限を追加し、管理者同意を付与してください。

## 既知の制限

### Webhook タイムアウト

Teams は HTTP Webhook 経由でメッセージを配信します。処理に時間がかかりすぎる場合（たとえば LLM の応答が遅い場合）、次のような事象が起こることがあります。

- Gateway タイムアウト
- Teams によるメッセージの再試行（重複の原因）
- 返信の欠落

OpenClaw はこれに対処するため、すばやく応答を返して能動的に返信を送信しますが、非常に遅い応答では問題が残ることがあります。

### 書式設定

Teams の markdown は Slack や Discord より制限があります。

- 基本的な書式は動作します: **太字**、_斜体_、`code`、リンク
- 複雑な markdown（テーブル、ネストされたリスト）は正しくレンダリングされない場合があります
- 投票や意味的なプレゼンテーション送信には Adaptive Cards がサポートされています（以下を参照）

## 設定

グループ化された設定（共有チャネルパターンについては `/gateway/configuration` を参照）。

<AccordionGroup>
  <Accordion title="コアと Webhook">
    - `channels.msteams.enabled`
    - `channels.msteams.appId`, `appPassword`, `tenantId`: ボット認証情報
    - `channels.msteams.webhook.port`（デフォルト `3978`）
    - `channels.msteams.webhook.path`（デフォルト `/api/messages`）
  </Accordion>

  <Accordion title="認証">
    - `authType`: `"secret"`（デフォルト）または `"federated"`
    - `certificatePath`, `certificateThumbprint`: federated + 証明書認証（thumbprint は任意）
    - `useManagedIdentity`, `managedIdentityClientId`: federated + managed identity 認証
  </Accordion>

  <Accordion title="アクセス制御">
    - `dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）
    - `allowFrom`: DM 許可リスト。AAD オブジェクト ID を推奨。Graph アクセスが利用可能な場合、ウィザードが名前を解決します
    - `dangerouslyAllowNameMatching`: 可変な UPN/表示名および team/channel 名ルーティングのための非常手段
    - `requireMention`: チャンネル/グループで @mention を必須にする（デフォルト `true`）
  </Accordion>

  <Accordion title="Team およびチャンネルごとの上書き">
    これらはすべてトップレベルのデフォルトを上書きします。

    - `teams.<teamId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.tools`, `.toolsBySender`: team ごとのツールポリシーのデフォルト
    - `teams.<teamId>.channels.<conversationId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.channels.<conversationId>.tools`, `.toolsBySender`

    `toolsBySender` のキーは `id:`、`e164:`、`username:`、`name:` プレフィックスを受け付けます（プレフィックスなしのキーは `id:` に対応）。`"*"` はワイルドカードです。

  </Accordion>

  <Accordion title="配信、メディア、アクション">
    - `textChunkLimit`: 送信テキストのチャンクサイズ
    - `chunkMode`: `length`（デフォルト）または `newline`（長さベースの前に段落境界で分割）
    - `mediaAllowHosts`: 受信添付ファイルのホスト許可リスト（デフォルトは Microsoft/Teams ドメイン）
    - `mediaAuthAllowHosts`: 再試行時に Authorization ヘッダーを受け取れるホスト（デフォルトは Graph + Bot Framework）
    - `replyStyle`: `thread | top-level`（[Reply style](#reply-style-threads-vs-posts) を参照）
    - `actions.memberInfo`: Graph 対応の member info アクションを切り替えます（デフォルトでは Graph 利用可能時にオン）
    - `sharePointSiteId`: グループチャット/チャンネルでのファイルアップロードに必要です（[グループチャットでのファイル送信](#sending-files-in-group-chats) を参照）
  </Accordion>
</AccordionGroup>

## ルーティングとセッション

- セッションキーは標準のエージェント形式に従います（[/concepts/session](/ja-JP/concepts/session) を参照）:
  - ダイレクトメッセージはメインセッションを共有します（`agent:<agentId>:<mainKey>`）。
  - チャンネル/グループメッセージは会話 ID を使用します:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Reply style: スレッド vs 投稿

Teams は最近、同じ基盤データモデル上で 2 つのチャンネル UI スタイルを導入しました。

| Style                    | Description                                               | 推奨 `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts**（クラシック）      | メッセージはカードとして表示され、その下にスレッド返信が付きます | `thread`（デフォルト） |
| **Threads**（Slack 風） | メッセージが直線的に流れ、より Slack に近い表示になります | `top-level` |

**問題:** Teams API は、そのチャンネルがどの UI スタイルを使っているかを公開していません。誤った `replyStyle` を使うと:

- Threads スタイルのチャンネルで `thread` → 返信が不自然にネストされて表示されます
- Posts スタイルのチャンネルで `top-level` → 返信がスレッド内ではなく別個のトップレベル投稿として表示されます

**解決策:** チャンネルの設定方法に応じて、チャンネルごとに `replyStyle` を設定します。

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## 添付ファイルと画像

**現在の制限:**

- **DM:** 画像とファイル添付は Teams ボットのファイル API を通じて動作します。
- **チャンネル/グループ:** 添付ファイルは M365 ストレージ（SharePoint/OneDrive）上に存在します。Webhook ペイロードには実際のファイルバイトではなく HTML スタブだけが含まれます。**チャンネル添付をダウンロードするには Graph API 権限が必要です。**
- 明示的にファイル優先で送信する場合は、`media` / `filePath` / `path` とともに `action=upload-file` を使用します。任意の `message` は付随するテキスト/コメントとなり、`filename` はアップロード名を上書きします。

Graph 権限がない場合、画像を含むチャンネルメッセージはテキストのみとして受信されます（画像コンテンツにはボットからアクセスできません）。
デフォルトでは、OpenClaw は Microsoft/Teams のホスト名からのみメディアをダウンロードします。`channels.msteams.mediaAllowHosts` で上書きできます（任意のホストを許可するには `["*"]` を使用）。
Authorization ヘッダーは、`channels.msteams.mediaAuthAllowHosts` に含まれるホストに対してのみ付与されます（デフォルトは Graph + Bot Framework ホスト）。このリストは厳格に保ってください（マルチテナントのサフィックスは避けてください）。

## グループチャットでのファイル送信

ボットは FileConsentCard フロー（組み込み）を使って DM でファイルを送信できます。しかし、**グループチャット/チャンネルでのファイル送信** には追加のセットアップが必要です。

| Context                  | ファイルの送信方法                           | 必要なセットアップ                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                  | FileConsentCard → ユーザーが承認 → ボットがアップロード | そのままで動作                            |
| **グループチャット/チャンネル** | SharePoint にアップロード → 共有リンク            | `sharePointSiteId` + Graph 権限が必要 |
| **画像（任意のコンテキスト）** | Base64 エンコードのインライン                        | そのままで動作                            |

### グループチャットで SharePoint が必要な理由

ボットには個人用 OneDrive ドライブがありません（`/me/drive` Graph API エンドポイントは application identity では動作しません）。グループチャット/チャンネルでファイルを送信するには、ボットは **SharePoint サイト** にアップロードし、共有リンクを作成します。

### セットアップ

1. Entra ID（Azure AD）→ App Registration で **Graph API 権限** を追加します:
   - `Sites.ReadWrite.All` (Application) - SharePoint にファイルをアップロード
   - `Chat.Read.All` (Application) - 任意。ユーザーごとの共有リンクを有効化

2. テナントに対して**管理者同意**を付与します。

3. **SharePoint site ID を取得します:**

   ```bash
   # Graph Explorer または有効なトークン付き curl 経由:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 例: "contoso.sharepoint.com/sites/BotFiles" にあるサイトの場合
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # レスポンスには "id": "contoso.sharepoint.com,guid1,guid2" が含まれます
   ```

4. **OpenClaw を設定します:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### 共有動作

| Permission                              | 共有動作                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` のみ              | 組織全体共有リンク（組織内の誰でもアクセス可能） |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ユーザーごとの共有リンク（チャットメンバーのみアクセス可能）      |

ユーザーごとの共有のほうが、チャット参加者だけがファイルにアクセスできるため、より安全です。`Chat.Read.All` 権限がない場合、ボットは組織全体共有にフォールバックします。

### フォールバック動作

| Scenario                                          | 結果                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| グループチャット + ファイル + `sharePointSiteId` 設定済み | SharePoint にアップロードし、共有リンクを送信            |
| グループチャット + ファイル + `sharePointSiteId` なし         | OneDrive アップロードを試行（失敗する場合あり）、テキストのみ送信 |
| 個人チャット + ファイル                              | FileConsentCard フロー（SharePoint なしで動作）    |
| 任意のコンテキスト + 画像                               | Base64 エンコードのインライン（SharePoint なしで動作）   |

### ファイル保存場所

アップロードされたファイルは、設定された SharePoint サイトの既定ドキュメントライブラリ内の `/OpenClawShared/` フォルダに保存されます。

## 投票（Adaptive Cards）

OpenClaw は Teams の投票を Adaptive Cards として送信します（ネイティブの Teams 投票 API はありません）。

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票は Gateway によって `~/.openclaw/msteams-polls.json` に記録されます。
- 投票を記録するには Gateway がオンラインのままである必要があります。
- 投票はまだ結果サマリーを自動投稿しません（必要に応じてストアファイルを確認してください）。

## プレゼンテーションカード

`message` ツールまたは CLI を使って、意味的なプレゼンテーションペイロードを Teams ユーザーまたは会話に送信します。OpenClaw は汎用プレゼンテーション契約からそれらを Teams Adaptive Cards としてレンダリングします。

`presentation` パラメータは意味ブロックを受け付けます。`presentation` が指定されている場合、メッセージテキストは任意です。

**エージェントツール:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

ターゲット形式の詳細は、以下の [Target formats](#target-formats) を参照してください。

## ターゲット形式

MSTeams のターゲットでは、ユーザーと会話を区別するためにプレフィックスを使用します。

| Target type         | Format                           | Example                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| ユーザー（ID 指定）        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| ユーザー（名前指定）      | `user:<display-name>`            | `user:John Smith`（Graph API が必要）              |
| グループ/チャンネル       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| グループ/チャンネル（生） | `<conversation-id>`              | `19:abc123...@thread.tacv2`（`@thread` を含む場合） |

**CLI の例:**

```bash
# ユーザーに ID で送信
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# 表示名でユーザーに送信（Graph API 検索をトリガー）
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# グループチャットまたはチャンネルに送信
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# 会話にプレゼンテーションカードを送信
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**エージェントツールの例:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

注: `user:` プレフィックスがない場合、名前はデフォルトでグループ/team 解決になります。表示名で人を指定する場合は、必ず `user:` を使用してください。

## プロアクティブメッセージ

- プロアクティブメッセージは、会話参照をその時点で保存するため、ユーザーがやり取りした**後でのみ**可能です。
- `dmPolicy` と許可リストのゲートについては `/gateway/configuration` を参照してください。

## Team とチャンネル ID

Teams URL の `groupId` クエリパラメータは、設定で使用する team ID **ではありません**。代わりに URL パスから ID を抽出してください。

**Team URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID（これを URL デコード）
```

**チャンネル URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      チャンネル ID（これを URL デコード）
```

**設定用:**

- Team ID = `/team/` の後のパスセグメント（URL デコード済み。例: `19:Bk4j...@thread.tacv2`）
- チャンネル ID = `/channel/` の後のパスセグメント（URL デコード済み）
- `groupId` クエリパラメータは**無視**してください

## プライベートチャンネル

ボットはプライベートチャンネルでのサポートが限定的です。

| Feature                      | Standard Channels | Private Channels       |
| ---------------------------- | ----------------- | ---------------------- |
| ボットのインストール             | はい               | 制限あり                |
| リアルタイムメッセージ（Webhook） | はい               | 動作しない場合あり           |
| RSC 権限              | はい               | 挙動が異なる場合あり |
| @mentions                    | はい               | ボットがアクセス可能なら可   |
| Graph API 履歴            | はい               | はい（権限があれば） |

**プライベートチャンネルで動作しない場合の回避策:**

1. ボットとのやり取りには標準チャンネルを使用する
2. DM を使用する - ユーザーはいつでもボットに直接メッセージできます
3. 履歴アクセスには Graph API を使用する（`ChannelMessage.Read.All` が必要）

## トラブルシューティング

### よくある問題

- **チャンネルで画像が表示されない:** Graph 権限または管理者同意が不足しています。Teams アプリを再インストールし、Teams を完全終了して再起動してください。
- **チャンネルで応答がない:** デフォルトではメンションが必要です。`channels.msteams.requireMention=false` を設定するか、team/チャンネルごとに設定してください。
- **バージョン不一致（Teams に古い manifest が表示される）:** アプリを削除して再追加し、Teams を完全終了して再起動して更新してください。
- **Webhook から 401 Unauthorized:** Azure JWT なしで手動テストした場合は想定内です。これはエンドポイントに到達できたが認証に失敗したことを意味します。正しくテストするには Azure Web Chat を使用してください。

### manifest アップロードエラー

- **"Icon file cannot be empty":** manifest が参照しているアイコンファイルが 0 バイトです。有効な PNG アイコン（`outline.png` は 32x32、`color.png` は 192x192）を作成してください。
- **"webApplicationInfo.Id already in use":** アプリが別の team/chat にまだインストールされています。先に見つけてアンインストールするか、反映まで 5〜10 分待ってください。
- **アップロード時に "Something went wrong":** 代わりに [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 経由でアップロードし、ブラウザ DevTools（F12）→ Network タブを開いて、実際のエラー内容をレスポンスボディで確認してください。
- **サイドロードに失敗する:** 「Upload a custom app」ではなく「Upload an app to your org's app catalog」を試してください。こちらのほうがサイドロード制限を回避できることがよくあります。

### RSC 権限が動作しない

1. `webApplicationInfo.id` がボットの App ID と完全一致していることを確認します
2. アプリを再アップロードし、team/chat に再インストールします
3. 組織の管理者が RSC 権限をブロックしていないか確認します
4. 正しいスコープを使用していることを確認します: teams には `ChannelMessage.Read.Group`、グループチャットには `ChatMessage.Read.Chat`

## 参考資料

- [Azure Bot を作成する](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot のセットアップガイド
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams アプリの作成/管理
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC を使ってチャンネルメッセージを受信する](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams ボットのファイル処理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（チャンネル/グループには Graph が必要）
- [プロアクティブメッセージ](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## 関連

<CardGroup cols={2}>
  <Card title="チャンネル概要" icon="list" href="/ja-JP/channels">
    サポートされているすべてのチャンネル。
  </Card>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    DM 認証とペアリングフロー。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループチャットの動作とメンションゲーティング。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    メッセージのセッションルーティング。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    アクセスモデルとハードニング。
  </Card>
</CardGroup>
