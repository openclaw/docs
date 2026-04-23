---
read_when:
    - Microsoft Teams チャンネル機能に取り組んでいる場合
summary: Microsoft Teams bot のサポート状況、機能、設定
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-23T13:58:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1f093cbb9aed7d7f7348ec796b00f05ef66c601b5345214a08986940020d28e
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> 「ここに入る者は一切の希望を捨てよ。」

ステータス: テキスト + DM 添付ファイルをサポートしています。チャンネル/グループでのファイル送信には `sharePointSiteId` + Graph 権限が必要です（[グループチャットでのファイル送信](#sending-files-in-group-chats) を参照）。投票は Adaptive Cards 経由で送信されます。メッセージアクションでは、ファイル優先の送信向けに明示的な `upload-file` が提供されます。

## バンドルされた plugin

Microsoft Teams は現在の OpenClaw リリースではバンドルされた plugin として提供されているため、
通常のパッケージ版ビルドでは別途インストールは不要です。

古いビルドや、バンドルされた Teams を含まないカスタムインストールを使用している場合は、
手動でインストールしてください:

```bash
openclaw plugins install @openclaw/msteams
```

ローカルチェックアウト（git リポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ（初級者向け）

1. Microsoft Teams plugin が利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースには、すでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. **Azure Bot**（App ID + client secret + tenant ID）を作成します。
3. それらの認証情報で OpenClaw を設定します。
4. 公開 URL またはトンネル経由で `/api/messages`（デフォルトはポート 3978）を公開します。
5. Teams アプリパッケージをインストールし、Gateway を起動します。

最小設定（client secret）:

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

本番環境では、client secret の代わりに、より安全な選択肢として [federated authentication](#federated-authentication-certificate--managed-identity)（証明書または managed identity）の使用を検討してください。

注意: グループチャットはデフォルトでブロックされます（`channels.msteams.groupPolicy: "allowlist"`）。グループ返信を許可するには、`channels.msteams.groupAllowFrom` を設定してください（または `groupPolicy: "open"` を使用すると任意のメンバーを許可できますが、デフォルトではメンションゲーティングされます）。

## 目的

- Teams の DM、グループチャット、またはチャンネル経由で OpenClaw と会話する。
- ルーティングを決定的に保つ: 返信は常に受信したチャンネルに戻る。
- 安全なチャンネル動作をデフォルトにする（設定しない限りメンション必須）。

## 設定の書き込み

デフォルトでは、Microsoft Teams は `/config set|unset` によってトリガーされた設定更新の書き込みを許可されています（`commands.config: true` が必要です）。

無効にするには、以下を設定します:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## アクセス制御（DM + グループ）

**DM アクセス**

- デフォルト: `channels.msteams.dmPolicy = "pairing"`。未知の送信者は承認されるまで無視されます。
- `channels.msteams.allowFrom` には、安定した AAD オブジェクト ID を使用してください。
- UPN/表示名は変更可能です。直接一致はデフォルトで無効であり、`channels.msteams.dangerouslyAllowNameMatching: true` でのみ有効になります。
- ウィザードは、認証情報で許可されている場合、Microsoft Graph 経由で名前を ID に解決できます。

**グループアクセス**

- デフォルト: `channels.msteams.groupPolicy = "allowlist"`（`groupAllowFrom` を追加しない限りブロックされます）。未設定時のデフォルトを上書きするには `channels.defaults.groupPolicy` を使用します。
- `channels.msteams.groupAllowFrom` は、グループチャット/チャンネルでどの送信者がトリガーできるかを制御します（`channels.msteams.allowFrom` にフォールバックします）。
- `groupPolicy: "open"` を設定すると任意のメンバーを許可できます（デフォルトでは引き続きメンションゲーティングされます）。
- **チャンネルを一切許可しない** には、`channels.msteams.groupPolicy: "disabled"` を設定します。

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

- `channels.msteams.teams` の下に teams と channels を列挙して、グループ/チャンネル返信のスコープを制限します。
- キーには、安定した team ID と channel conversation ID を使用してください。
- `groupPolicy="allowlist"` で teams の許可リストが存在する場合、列挙された teams/channels のみが受け付けられます（メンションゲーティングされます）。
- configure ウィザードは `Team/Channel` エントリを受け付け、自動的に保存します。
- 起動時に、OpenClaw は team/channel とユーザー許可リスト名を ID に解決し（Graph 権限で許可されている場合）、
  マッピングをログに記録します。未解決の team/channel 名は入力されたまま保持されますが、`channels.msteams.dangerouslyAllowNameMatching: true` を有効にしない限り、デフォルトではルーティングで無視されます。

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

## 仕組み

1. Microsoft Teams plugin が利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースには、すでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. **Azure Bot**（App ID + secret + tenant ID）を作成します。
3. bot を参照し、以下の RSC 権限を含む **Teams アプリパッケージ** を作成します。
4. Teams アプリを team にアップロード/インストールします（または DM 用の個人スコープ）。
5. `~/.openclaw/openclaw.json`（または環境変数）で `msteams` を設定し、Gateway を起動します。
6. Gateway はデフォルトで `/api/messages` 上の Bot Framework Webhook トラフィックを待ち受けます。

## Azure Bot セットアップ（前提条件）

OpenClaw を設定する前に、Azure Bot リソースを作成する必要があります。

### ステップ 1: Azure Bot を作成する

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) にアクセスします
2. **Basics** タブに入力します:

   | フィールド | 値 |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle** | bot 名。例: `openclaw-msteams`（一意である必要があります） |
   | **Subscription** | Azure サブスクリプションを選択 |
   | **Resource group** | 新規作成または既存のものを使用 |
   | **Pricing tier** | 開発/テストには **Free** |
   | **Type of App** | **Single Tenant**（推奨 - 以下の注記を参照） |
   | **Creation type** | **Create new Microsoft App ID** |

> **非推奨のお知らせ:** 新しい multi-tenant bot の作成は 2025-07-31 以降非推奨になりました。新しい bot には **Single Tenant** を使用してください。

3. **Review + create** → **Create** をクリックします（約 1〜2 分待機）

### ステップ 2: 認証情報を取得する

1. Azure Bot リソース → **Configuration** に移動します
2. **Microsoft App ID** をコピーします → これが `appId` です
3. **Manage Password** をクリックします → App Registration に移動します
4. **Certificates & secrets** → **New client secret** の順に進み、**Value** をコピーします → これが `appPassword` です
5. **Overview** に移動し、**Directory (tenant) ID** をコピーします → これが `tenantId` です

### ステップ 3: Messaging Endpoint を設定する

1. Azure Bot → **Configuration**
2. **Messaging endpoint** を Webhook URL に設定します:
   - 本番環境: `https://your-domain.com/api/messages`
   - ローカル開発: トンネルを使用します（下記の [Local Development](#local-development-tunneling) を参照）

### ステップ 4: Teams チャンネルを有効にする

1. Azure Bot → **Channels**
2. **Microsoft Teams** → Configure → Save をクリックします
3. 利用規約に同意します

<a id="federated-authentication-certificate--managed-identity"></a>

## Federated Authentication（証明書 + Managed Identity）

> 2026.3.24 で追加

本番デプロイメント向けに、OpenClaw は client secret のより安全な代替として **federated authentication** をサポートしています。利用可能な方法は 2 つあります。

### オプション A: 証明書ベース認証

Entra ID のアプリ登録に登録された PEM 証明書を使用します。

**セットアップ:**

1. 証明書を生成または取得します（秘密鍵を含む PEM 形式）。
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → 公開証明書をアップロードします。

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

パスワード不要の認証に Azure Managed Identity を使用します。これは、managed identity が利用可能な Azure インフラストラクチャ（AKS、App Service、Azure VM）上のデプロイメントに最適です。

**仕組み:**

1. bot の pod/VM に managed identity（システム割り当てまたはユーザー割り当て）が設定されています。
2. **federated identity credential** が、その managed identity を Entra ID のアプリ登録にリンクします。
3. 実行時に、OpenClaw は `@azure/identity` を使用して Azure IMDS endpoint（`169.254.169.254`）からトークンを取得します。
4. そのトークンが bot 認証のため Teams SDK に渡されます。

**前提条件:**

- managed identity が有効な Azure インフラストラクチャ（AKS workload identity、App Service、VM）
- Entra ID のアプリ登録上に作成された federated identity credential
- pod/VM から IMDS（`169.254.169.254:80`）へのネットワークアクセス

**設定（システム割り当て managed identity）:**

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

**設定（ユーザー割り当て managed identity）:**

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

### AKS Workload Identity セットアップ

workload identity を使用する AKS デプロイメントの場合:

1. AKS クラスターで **workload identity** を有効にします。
2. Entra ID のアプリ登録に **federated identity credential** を作成します:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. Kubernetes の service account に app client ID を **annotate** します:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. workload identity 注入のために pod に **label** を付けます:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS（`169.254.169.254`）への **ネットワークアクセス** を確保します — NetworkPolicy を使用している場合は、ポート 80 の `169.254.169.254/32` へのトラフィックを許可する egress ルールを追加してください。

### 認証タイプ比較

| 方法 | 設定 | 長所 | 短所 |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret** | `appPassword` | セットアップが簡単 | secret のローテーションが必要、セキュリティは低め |
| **Certificate** | `authType: "federated"` + `certificatePath` | ネットワーク上で共有 secret を使わない | 証明書管理のオーバーヘッド |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | パスワード不要、管理すべき secret がない | Azure インフラストラクチャが必要 |

**デフォルト動作:** `authType` が設定されていない場合、OpenClaw は client secret 認証をデフォルトで使用します。既存の設定は変更なしで引き続き動作します。

## ローカル開発（トンネリング）

Teams は `localhost` に到達できません。ローカル開発ではトンネルを使用してください。

**オプション A: ngrok**

```bash
ngrok http 3978
# https URL をコピーします。例: https://abc123.ngrok.io
# messaging endpoint を次に設定します: https://abc123.ngrok.io/api/messages
```

**オプション B: Tailscale Funnel**

```bash
tailscale funnel 3978
# messaging endpoint として Tailscale funnel URL を使用します
```

## Teams Developer Portal（代替手段）

manifest ZIP を手動で作成する代わりに、[Teams Developer Portal](https://dev.teams.microsoft.com/apps) を使用できます:

1. **+ New app** をクリックします
2. 基本情報（名前、説明、開発者情報）を入力します
3. **App features** → **Bot** に進みます
4. **Enter a bot ID manually** を選択し、Azure Bot の App ID を貼り付けます
5. スコープをチェックします: **Personal**、**Team**、**Group Chat**
6. **Distribute** → **Download app package** をクリックします
7. Teams で **Apps** → **Manage your apps** → **Upload a custom app** → ZIP を選択します

これは JSON manifest を手で編集するより簡単なことが多いです。

## bot のテスト

**オプション A: Azure Web Chat（まず Webhook を検証）**

1. Azure Portal → 対象の Azure Bot リソース → **Test in Web Chat**
2. メッセージを送信します。応答が表示されるはずです
3. これにより、Teams のセットアップ前に Webhook endpoint が機能していることを確認できます

**オプション B: Teams（アプリのインストール後）**

1. Teams アプリをインストールします（サイドロードまたは組織カタログ）
2. Teams で bot を見つけて DM を送信します
3. 受信アクティビティについて Gateway のログを確認します

## セットアップ（最小のテキスト専用）

1. **Microsoft Teams plugin が利用可能であることを確認する**
   - 現在のパッケージ版 OpenClaw リリースには、すでにバンドルされています。
   - 古い/カスタムインストールでは手動追加できます:
     - npm から: `openclaw plugins install @openclaw/msteams`
     - ローカルチェックアウトから: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **bot 登録**
   - Azure Bot を作成し（上記参照）、以下を控えます:
     - App ID
     - Client secret（App password）
     - Tenant ID（single-tenant）

3. **Teams アプリ manifest**
   - `botId = <App ID>` を持つ `bot` エントリを含めます。
   - スコープ: `personal`、`team`、`groupChat`。
   - `supportsFiles: true`（個人スコープでのファイル処理に必須）。
   - RSC 権限（以下）を追加します。
   - アイコンを作成します: `outline.png`（32x32）と `color.png`（192x192）。
   - 3 つのファイルをまとめて zip 化します: `manifest.json`、`outline.png`、`color.png`。

4. **OpenClaw を設定する**

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

   設定キーの代わりに環境変数を使用することもできます:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE`（任意: `"secret"` または `"federated"`）
   - `MSTEAMS_CERTIFICATE_PATH`（federated + certificate）
   - `MSTEAMS_CERTIFICATE_THUMBPRINT`（任意、認証には必須ではありません）
   - `MSTEAMS_USE_MANAGED_IDENTITY`（federated + managed identity）
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（ユーザー割り当て MI のみ）

5. **bot endpoint**
   - Azure Bot Messaging Endpoint を以下に設定します:
     - `https://<host>:3978/api/messages`（または選択した path/port）。

6. **Gateway を実行する**
   - バンドル済みまたは手動インストールした plugin が利用可能で、認証情報付きの `msteams` 設定が存在すれば、Teams チャンネルは自動的に開始します。

## member info アクション

OpenClaw は Microsoft Teams 向けに Graph を利用する `member-info` アクションを提供しており、agent や automation が Microsoft Graph から直接チャンネルメンバーの詳細（表示名、メール、ロール）を解決できます。

要件:

- `Member.Read.Group` RSC 権限（推奨 manifest にすでに含まれています）
- チームをまたぐ検索用: 管理者同意付きの `User.Read.All` Graph Application 権限

このアクションは `channels.msteams.actions.memberInfo` で制御されます（デフォルト: Graph 認証情報が利用可能な場合に有効）。

## 履歴コンテキスト

- `channels.msteams.historyLimit` は、プロンプトに含める最近のチャンネル/グループメッセージ数を制御します。
- `messages.groupChat.historyLimit` にフォールバックします。`0` に設定すると無効化されます（デフォルトは 50）。
- 取得されたスレッド履歴は送信者許可リスト（`allowFrom` / `groupAllowFrom`）でフィルタされるため、スレッドコンテキストのシーディングには許可された送信者からのメッセージのみが含まれます。
- 引用された添付ファイルのコンテキスト（Teams の返信 HTML に由来する `ReplyTo*`）は、現在は受信したまま渡されます。
- つまり、許可リストは誰が agent をトリガーできるかを制御します。現在フィルタされるのは、特定の補助的なコンテキスト経路のみです。
- DM 履歴は `channels.msteams.dmHistoryLimit`（ユーザーターン）で制限できます。ユーザーごとの上書き: `channels.msteams.dms["<user_id>"].historyLimit`。

## 現在の Teams RSC 権限（Manifest）

これらは Teams アプリ manifest にある **既存の resourceSpecific permissions** です。これらはアプリがインストールされている team/chat 内でのみ適用されます。

**チャンネル向け（team スコープ）:**

- `ChannelMessage.Read.Group`（Application）- @mention なしですべてのチャンネルメッセージを受信
- `ChannelMessage.Send.Group`（Application）
- `Member.Read.Group`（Application）
- `Owner.Read.Group`（Application）
- `ChannelSettings.Read.Group`（Application）
- `TeamMember.Read.Group`（Application）
- `TeamSettings.Read.Group`（Application）

**グループチャット向け:**

- `ChatMessage.Read.Chat`（Application）- @mention なしですべてのグループチャットメッセージを受信

## Teams Manifest の例（機密情報除去済み）

必要なフィールドを含む最小限で有効な例です。ID と URL を置き換えてください。

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

### Manifest の注意点（必須フィールド）

- `bots[].botId` は Azure Bot App ID と**必ず**一致していなければなりません。
- `webApplicationInfo.id` は Azure Bot App ID と**必ず**一致していなければなりません。
- `bots[].scopes` には使用予定のサーフェス（`personal`、`team`、`groupChat`）を含める必要があります。
- `bots[].supportsFiles: true` は個人スコープでのファイル処理に必須です。
- `authorization.permissions.resourceSpecific` には、チャンネルトラフィックが必要な場合、チャンネルの読み取り/送信を含める必要があります。

### 既存アプリの更新

すでにインストール済みの Teams アプリを更新するには（たとえば RSC 権限を追加する場合）:

1. `manifest.json` を新しい設定で更新します
2. **`version` フィールドを増やします**（例: `1.0.0` → `1.1.0`）
3. アイコン付きで manifest を**再度 zip 化**します（`manifest.json`、`outline.png`、`color.png`）
4. 新しい zip をアップロードします:
   - **オプション A（Teams Admin Center）:** Teams Admin Center → Teams apps → Manage apps → 対象アプリを探す → Upload new version
   - **オプション B（サイドロード）:** Teams → Apps → Manage your apps → Upload a custom app
5. **team チャンネル向け:** 新しい権限を有効にするには、各 team にアプリを再インストールします
6. キャッシュされたアプリメタデータをクリアするため、Teams を**完全に終了して再起動**します（ウィンドウを閉じるだけでは不十分です）

## 機能: RSC のみ vs Graph

### **Teams RSC のみ** の場合（アプリはインストール済み、Graph API 権限なし）

動作するもの:

- チャンネルメッセージの**テキスト**内容の読み取り。
- チャンネルメッセージの**テキスト**内容の送信。
- **個人用（DM）** ファイル添付の受信。

動作しないもの:

- チャンネル/グループの**画像またはファイル内容**（ペイロードには HTML スタブのみが含まれます）。
- SharePoint/OneDrive に保存された添付ファイルのダウンロード。
- メッセージ履歴の読み取り（ライブ Webhook event を超えるもの）。

### **Teams RSC + Microsoft Graph Application permissions** の場合

追加されるもの:

- ホストされたコンテンツ（メッセージに貼り付けられた画像）のダウンロード。
- SharePoint/OneDrive に保存されたファイル添付のダウンロード。
- Graph 経由でのチャンネル/チャットメッセージ履歴の読み取り。

### RSC vs Graph API

| 機能 | RSC 権限 | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **リアルタイムメッセージ** | はい（Webhook 経由） | いいえ（ポーリングのみ） |
| **履歴メッセージ** | いいえ | はい（履歴を問い合わせ可能） |
| **セットアップの複雑さ** | アプリ manifest のみ | 管理者同意 + トークンフローが必要 |
| **オフラインで動作** | いいえ（実行中である必要あり） | はい（いつでも問い合わせ可能） |

**要点:** RSC はリアルタイム監視用であり、Graph API は履歴アクセス用です。オフライン中に見逃したメッセージに追いつくには、`ChannelMessage.Read.All` を持つ Graph API（管理者同意が必要）が必要です。

## Graph 対応メディア + 履歴（チャンネルでは必須）

**チャンネル** 内で画像/ファイルが必要な場合、または **メッセージ履歴** を取得したい場合は、Microsoft Graph 権限を有効にして管理者同意を与える必要があります。

1. Entra ID（Azure AD）の **App Registration** で、Microsoft Graph の **Application permissions** を追加します:
   - `ChannelMessage.Read.All`（チャンネル添付 + 履歴）
   - `Chat.Read.All` または `ChatMessage.Read.All`（グループチャット）
2. tenant に対して**管理者同意**を付与します。
3. Teams アプリの **manifest version** を上げて再アップロードし、**Teams でアプリを再インストール**します。
4. キャッシュされたアプリメタデータをクリアするため、**Teams を完全に終了して再起動**します。

**ユーザーメンションの追加権限:** ユーザーの @mention は、会話内のユーザーに対してはそのまま動作します。ただし、現在の会話に**含まれていない**ユーザーを動的に検索してメンションしたい場合は、`User.Read.All`（Application）権限を追加し、管理者同意を付与してください。

## 既知の制限

### Webhook タイムアウト

Teams は HTTP Webhook 経由でメッセージを配信します。処理に時間がかかりすぎる場合（たとえば LLM の応答が遅い場合）、次の問題が起こることがあります:

- Gateway タイムアウト
- Teams がメッセージを再試行する（重複の原因）
- 返信が破棄される

OpenClaw は、すばやく応答を返してから能動的に返信を送ることでこれに対処しますが、非常に遅い応答では問題が残る場合があります。

### フォーマット

Teams の markdown は Slack や Discord より制限があります:

- 基本的な書式は動作します: **太字**、_斜体_、`code`、リンク
- 複雑な markdown（表、ネストしたリスト）は正しくレンダリングされない場合があります
- Adaptive Cards は投票やセマンティックなプレゼンテーション送信でサポートされています（以下を参照）

## 設定

主な設定（共通のチャンネルパターンは `/gateway/configuration` を参照）:

- `channels.msteams.enabled`: チャンネルを有効/無効にします。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`: bot の認証情報。
- `channels.msteams.webhook.port`（デフォルト `3978`）
- `channels.msteams.webhook.path`（デフォルト `/api/messages`）
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）
- `channels.msteams.allowFrom`: DM 許可リスト（AAD オブジェクト ID 推奨）。Graph アクセスが利用可能な場合、ウィザードはセットアップ中に名前を ID に解決します。
- `channels.msteams.dangerouslyAllowNameMatching`: 可変な UPN/表示名の一致と、team/channel 名による直接ルーティングを再有効化する緊急用トグル。
- `channels.msteams.textChunkLimit`: 送信テキストのチャンクサイズ。
- `channels.msteams.chunkMode`: `length`（デフォルト）または `newline`。長さベースの分割前に空行（段落境界）で分割します。
- `channels.msteams.mediaAllowHosts`: 受信添付ファイル host の許可リスト（デフォルトは Microsoft/Teams ドメイン）。
- `channels.msteams.mediaAuthAllowHosts`: メディア再試行時に Authorization ヘッダーを付与する host の許可リスト（デフォルトは Graph + Bot Framework host）。
- `channels.msteams.requireMention`: チャンネル/グループで @mention を必須にします（デフォルト true）。
- `channels.msteams.replyStyle`: `thread | top-level`（[返信スタイル](#reply-style-threads-vs-posts) を参照）。
- `channels.msteams.teams.<teamId>.replyStyle`: team ごとの上書き。
- `channels.msteams.teams.<teamId>.requireMention`: team ごとの上書き。
- `channels.msteams.teams.<teamId>.tools`: チャンネル上書きがない場合に使用される、team ごとのデフォルト tool ポリシー上書き（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.toolsBySender`: team ごとの送信者別デフォルト tool ポリシー上書き（`"*"` ワイルドカード対応）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: チャンネルごとの上書き。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: チャンネルごとの上書き。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: チャンネルごとの tool ポリシー上書き（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: チャンネルごとの送信者別 tool ポリシー上書き（`"*"` ワイルドカード対応）。
- `toolsBySender` のキーには明示的な接頭辞を使用してください:
  `id:`、`e164:`、`username:`、`name:`（従来の接頭辞なしキーも引き続き `id:` にのみマップされます）。
- `channels.msteams.actions.memberInfo`: Graph を利用する member info アクションを有効または無効にします（デフォルト: Graph 認証情報が利用可能な場合に有効）。
- `channels.msteams.authType`: 認証タイプ — `"secret"`（デフォルト）または `"federated"`。
- `channels.msteams.certificatePath`: PEM 証明書ファイルへの path（federated + certificate 認証）。
- `channels.msteams.certificateThumbprint`: 証明書の thumbprint（任意、認証には必須ではありません）。
- `channels.msteams.useManagedIdentity`: managed identity 認証を有効にします（federated モード）。
- `channels.msteams.managedIdentityClientId`: ユーザー割り当て managed identity の client ID。
- `channels.msteams.sharePointSiteId`: グループチャット/チャンネルでのファイルアップロード用 SharePoint site ID（[グループチャットでのファイル送信](#sending-files-in-group-chats) を参照）。

## ルーティングとセッション

- セッションキーは標準の agent 形式に従います（[/concepts/session](/ja-JP/concepts/session) を参照）:
  - ダイレクトメッセージはメインセッションを共有します（`agent:<agentId>:<mainKey>`）。
  - チャンネル/グループメッセージは conversation id を使用します:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 返信スタイル: Threads と Posts

Teams は最近、同じ基盤データモデル上で 2 つのチャンネル UI スタイルを導入しました:

| スタイル | 説明 | 推奨 `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts**（従来型） | メッセージはカードとして表示され、その下にスレッド返信が付きます | `thread`（デフォルト） |
| **Threads**（Slack ライク） | メッセージはより Slack のように直線的に流れます | `top-level` |

**問題:** Teams API は、チャンネルがどの UI スタイルを使っているかを公開していません。誤った `replyStyle` を使うと次のようになります:

- Threads スタイルのチャンネルで `thread` → 返信が不自然にネストされて表示される
- Posts スタイルのチャンネルで `top-level` → 返信がスレッド内ではなく別のトップレベル投稿として表示される

**解決策:** チャンネルの設定に応じて、チャンネルごとに `replyStyle` を設定してください:

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

- **DM:** 画像とファイル添付は Teams bot のファイル API 経由で動作します。
- **チャンネル/グループ:** 添付ファイルは M365 ストレージ（SharePoint/OneDrive）に保存されます。Webhook ペイロードには実際のファイル bytes ではなく、HTML スタブのみが含まれます。チャンネル添付をダウンロードするには **Graph API 権限が必要** です。
- 明示的にファイル優先で送信する場合は、`media` / `filePath` / `path` とともに `action=upload-file` を使用します。任意の `message` は添付のテキスト/コメントになり、`filename` はアップロード名を上書きします。

Graph 権限がない場合、画像付きのチャンネルメッセージはテキストのみとして受信されます（画像内容には bot からアクセスできません）。
デフォルトでは、OpenClaw は Microsoft/Teams の host 名からのみメディアをダウンロードします。`channels.msteams.mediaAllowHosts` で上書きしてください（任意の host を許可するには `["*"]` を使用）。
Authorization ヘッダーは `channels.msteams.mediaAuthAllowHosts` に含まれる host にのみ付与されます（デフォルトは Graph + Bot Framework host）。このリストは厳密に保ってください（multi-tenant 接尾辞は避けてください）。

## グループチャットでのファイル送信

bot は FileConsentCard フロー（組み込み）を使って DM でファイルを送信できます。しかし、**グループチャット/チャンネルでのファイル送信** には追加のセットアップが必要です:

| コンテキスト | ファイルの送信方法 | 必要なセットアップ |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM** | FileConsentCard → ユーザーが承認 → bot がアップロード | そのままで動作 |
| **グループチャット/チャンネル** | SharePoint にアップロード → リンクを共有 | `sharePointSiteId` + Graph 権限が必要 |
| **画像（任意のコンテキスト）** | Base64 エンコードのインライン | そのままで動作 |

### グループチャットで SharePoint が必要な理由

bot には個人用 OneDrive ドライブがありません（`/me/drive` Graph API endpoint は application identity では動作しません）。グループチャット/チャンネルでファイルを送信するには、bot は **SharePoint site** にアップロードし、共有リンクを作成します。

### セットアップ

1. Entra ID（Azure AD）→ App Registration で **Graph API permissions** を追加します:
   - `Sites.ReadWrite.All`（Application）- SharePoint へのファイルアップロード
   - `Chat.Read.All`（Application）- 任意、ユーザーごとの共有リンクを有効化

2. tenant に対して**管理者同意**を付与します。

3. **SharePoint site ID を取得します:**

   ```bash
   # Graph Explorer または有効な token を使った curl 経由:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 例: "contoso.sharepoint.com/sites/BotFiles" にある site の場合
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # 応答には次が含まれます: "id": "contoso.sharepoint.com,guid1,guid2"
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

| 権限 | 共有動作 |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` のみ | 組織全体共有リンク（組織内の誰でもアクセス可能） |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ユーザーごとの共有リンク（チャットメンバーのみアクセス可能） |

ユーザーごとの共有の方が、チャット参加者のみがファイルにアクセスできるため、より安全です。`Chat.Read.All` 権限がない場合、bot は組織全体共有にフォールバックします。

### フォールバック動作

| シナリオ | 結果 |
| ------------------------------------------------- | -------------------------------------------------- |
| グループチャット + ファイル + `sharePointSiteId` 設定済み | SharePoint にアップロードし、共有リンクを送信 |
| グループチャット + ファイル + `sharePointSiteId` なし | OneDrive へのアップロードを試行（失敗する可能性あり）、テキストのみ送信 |
| 個人チャット + ファイル | FileConsentCard フロー（SharePoint なしで動作） |
| 任意のコンテキスト + 画像 | Base64 エンコードのインライン（SharePoint なしで動作） |

### ファイルの保存場所

アップロードされたファイルは、設定された SharePoint site のデフォルトドキュメントライブラリ内の `/OpenClawShared/` フォルダーに保存されます。

## Polls（Adaptive Cards）

OpenClaw は Teams の poll を Adaptive Cards として送信します（Teams にネイティブの poll API はありません）。

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票は Gateway により `~/.openclaw/msteams-polls.json` に記録されます。
- 投票を記録するには Gateway がオンラインのままである必要があります。
- poll はまだ結果サマリーを自動投稿しません（必要に応じて保存ファイルを確認してください）。

## Presentation Cards

`message` tool または CLI を使用して、セマンティックなプレゼンテーションペイロードを Teams ユーザーまたは conversation に送信します。OpenClaw は汎用プレゼンテーション契約からそれらを Teams Adaptive Cards としてレンダリングします。

`presentation` パラメーターはセマンティックブロックを受け取ります。`presentation` が指定されている場合、メッセージテキストは任意です。

**Agent tool:**

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

target 形式の詳細は、以下の [ターゲット形式](#target-formats) を参照してください。

## ターゲット形式

MSTeams の target では、ユーザーと conversation を区別するために接頭辞を使用します:

| ターゲットタイプ | 形式 | 例 |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| ユーザー（ID 指定） | `user:<aad-object-id>` | `user:40a1a0ed-4ff2-4164-a219-55518990c197` |
| ユーザー（名前指定） | `user:<display-name>` | `user:John Smith`（Graph API が必要） |
| グループ/チャンネル | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2` |
| グループ/チャンネル（raw） | `<conversation-id>` | `19:abc123...@thread.tacv2`（`@thread` を含む場合） |

**CLI の例:**

```bash
# ID でユーザーに送信
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# 表示名でユーザーに送信（Graph API lookup をトリガー）
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# グループチャットまたはチャンネルに送信
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# conversation に presentation card を送信
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Agent tool の例:**

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

注意: `user:` 接頭辞がない場合、名前はデフォルトでグループ/team 解決として扱われます。表示名で人を指定する場合は、必ず `user:` を使用してください。

## Proactive messaging

- Proactive message は、ユーザーが一度やり取りした**後でのみ**可能です。その時点で conversation reference を保存するためです。
- `dmPolicy` と許可リストによる制御については `/gateway/configuration` を参照してください。

## Team ID と Channel ID（よくある落とし穴）

Teams URL の `groupId` クエリパラメーターは、設定で使う team ID **ではありません**。代わりに URL path から ID を取り出してください:

**Team URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID（これを URL デコードする）
```

**Channel URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID（これを URL デコードする）
```

**設定では:**

- Team ID = `/team/` の後の path セグメント（URL デコード後。例: `19:Bk4j...@thread.tacv2`）
- Channel ID = `/channel/` の後の path セグメント（URL デコード後）
- `groupId` クエリパラメーターは**無視**してください

## プライベートチャンネル

bot はプライベートチャンネルでのサポートが限定的です:

| 機能 | 標準チャンネル | プライベートチャンネル |
| ---------------------------- | ----------------- | ---------------------- |
| bot のインストール | はい | 制限あり |
| リアルタイムメッセージ（Webhook） | はい | 動作しない場合あり |
| RSC 権限 | はい | 挙動が異なる場合あり |
| @mentions | はい | bot にアクセスできる場合 |
| Graph API 履歴 | はい | はい（権限がある場合） |

**プライベートチャンネルで動作しない場合の回避策:**

1. bot とのやり取りには標準チャンネルを使う
2. DM を使う - ユーザーは常に bot に直接メッセージできます
3. 履歴アクセスには Graph API を使う（`ChannelMessage.Read.All` が必要）

## トラブルシューティング

### よくある問題

- **チャンネルで画像が表示されない:** Graph 権限または管理者同意が不足しています。Teams アプリを再インストールし、Teams を完全に終了して再起動してください。
- **チャンネルで応答がない:** デフォルトでは mention が必要です。`channels.msteams.requireMention=false` を設定するか、team/channel ごとに設定してください。
- **バージョン不一致（Teams に古い manifest が表示され続ける）:** アプリを削除して再追加し、Teams を完全に終了して更新してください。
- **Webhook から 401 Unauthorized:** Azure JWT なしで手動テストした場合は想定内です。endpoint には到達しているが認証に失敗したことを意味します。正しくテストするには Azure Web Chat を使用してください。

### Manifest のアップロードエラー

- **「Icon file cannot be empty」:** manifest が 0 バイトのアイコンファイルを参照しています。有効な PNG アイコン（`outline.png` は 32x32、`color.png` は 192x192）を作成してください。
- **「webApplicationInfo.Id already in use」:** アプリが別の team/chat にまだインストールされています。先に見つけてアンインストールするか、反映まで 5〜10 分待ってください。
- **アップロード時の「Something went wrong」:** 代わりに [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) 経由でアップロードし、ブラウザ DevTools（F12）→ Network タブを開いて、実際のエラー内容を response body で確認してください。
- **サイドロードに失敗する:** 「Upload a custom app」の代わりに「Upload an app to your org's app catalog」を試してください。こちらの方がサイドロード制限を回避できることがよくあります。

### RSC 権限が動作しない

1. `webApplicationInfo.id` が bot の App ID と完全に一致していることを確認してください
2. アプリを再アップロードし、team/chat に再インストールしてください
3. 組織の管理者が RSC 権限をブロックしていないか確認してください
4. 正しいスコープを使っていることを確認してください: teams には `ChannelMessage.Read.Group`、グループチャットには `ChatMessage.Read.Chat`

## 参考資料

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot セットアップガイド
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams アプリの作成/管理
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（チャンネル/グループには Graph が必要）
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとハードニング
