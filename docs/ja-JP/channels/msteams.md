---
read_when:
    - Microsoft Teams チャンネル機能に取り組む
summary: Microsoft Teams bot のサポート状況、機能、設定
title: Microsoft Teams
x-i18n:
    generated_at: "2026-06-27T10:39:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cad5dc92b3a70e85412cbf34c926d7211dce7534c31387744e6f085bcfe23f08
    source_path: channels/msteams.md
    workflow: 16
---

ステータス: テキスト + DM 添付ファイルはサポートされています。チャネル/グループでのファイル送信には `sharePointSiteId` + Graph 権限が必要です（[グループ チャットでファイルを送信する](#sending-files-in-group-chats) を参照）。投票は Adaptive Cards 経由で送信されます。メッセージ アクションは、ファイル優先送信用に明示的な `upload-file` を公開します。

## バンドルPlugin

Microsoft Teams は現在の OpenClaw リリースではバンドルPluginとして提供されるため、通常のパッケージ版ビルドでは別途インストールは不要です。

古いビルドを使用している場合、またはバンドルされた Teams を除外したカスタム インストールを使用している場合は、npm パッケージを直接インストールします。

```bash
openclaw plugins install @openclaw/msteams
```

現在の公式リリース タグに追従するには、素のパッケージを使用してください。再現可能なインストールが必要な場合にのみ、正確なバージョンを固定します。

ローカル チェックアウト（git リポジトリから実行する場合）:

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳細: [Plugin](/ja-JP/tools/plugin)

## クイックセットアップ

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) は、bot 登録、マニフェスト作成、認証情報生成を単一のコマンドで処理します。

**1. インストールしてログインする**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI は現在プレビュー版です。コマンドやフラグはリリース間で変更される可能性があります。
</Note>

**2. トンネルを開始する**（Teams は localhost に到達できません）

まだインストールと認証を済ませていない場合は、devtunnel CLI をインストールして認証します（[はじめにガイド](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
Teams は devtunnels で認証できないため、`--allow-anonymous` が必要です。受信する各 bot リクエストは、それでも Teams SDK によって自動的に検証されます。
</Note>

代替手段: `ngrok http 3978` または `tailscale funnel 3978`（ただし、これらはセッションごとに URL が変わる場合があります）。

**3. アプリを作成する**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

この単一のコマンドは次を行います。

- Entra ID（Azure AD）アプリケーションを作成する
- クライアント シークレットを生成する
- Teams アプリ マニフェスト（アイコン付き）をビルドしてアップロードする
- bot を登録する（デフォルトでは Teams 管理 - Azure サブスクリプションは不要）

出力には `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID`、および **Teams App ID** が表示されます。次の手順のために控えてください。また、Teams にアプリを直接インストールすることも提案されます。

**4. OpenClaw を設定する** 出力された認証情報を使用します。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

または、環境変数を直接使用します: `MSTEAMS_APP_ID`、`MSTEAMS_APP_PASSWORD`、`MSTEAMS_TENANT_ID`。

**5. Teams にアプリをインストールする**

`teams app create` はアプリのインストールを促します - 「Install in Teams」を選択してください。スキップした場合は、後でリンクを取得できます。

```bash
teams app get <teamsAppId> --install-link
```

**6. すべてが動作することを確認する**

```bash
teams app doctor <teamsAppId>
```

これは、bot 登録、AAD アプリ設定、マニフェストの妥当性、SSO 設定全体の診断を実行します。

本番環境デプロイでは、クライアント シークレットの代わりに [フェデレーション認証](/ja-JP/channels/msteams#federated-authentication-certificate-plus-managed-identity)（証明書またはマネージド ID）の使用を検討してください。

<Note>
グループ チャットはデフォルトでブロックされます（`channels.msteams.groupPolicy: "allowlist"`）。グループ返信を許可するには、`channels.msteams.groupAllowFrom` を設定するか、`groupPolicy: "open"` を使用して任意のメンバーを許可します（メンション必須）。
</Note>

## 目標

- Teams の DM、グループ チャット、またはチャネル経由で OpenClaw と会話する。
- ルーティングを決定的に保つ: 返信は常に到着したチャネルに戻る。
- 安全なチャネル動作をデフォルトにする（別途設定しない限りメンションが必要）。

## 設定の書き込み

デフォルトでは、Microsoft Teams は `/config set|unset` によってトリガーされる設定更新の書き込みを許可されています（`commands.config: true` が必要）。

無効にするには:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## アクセス制御（DM + グループ）

**DM アクセス**

- デフォルト: `channels.msteams.dmPolicy = "pairing"`。不明な送信者は承認されるまで無視されます。
- `channels.msteams.allowFrom` には、安定した AAD オブジェクト ID、または `accessGroup:core-team` のような静的な送信者アクセス グループを使用してください。
- 許可リストに UPN/表示名マッチングを使用しないでください - 変更される可能性があります。OpenClaw はデフォルトで直接的な名前マッチングを無効にしています。使用する場合は `channels.msteams.dangerouslyAllowNameMatching: true` で明示的に有効にします。
- 認証情報で許可されている場合、ウィザードは Microsoft Graph 経由で名前を ID に解決できます。

**グループ アクセス**

- デフォルト: `channels.msteams.groupPolicy = "allowlist"`（`groupAllowFrom` を追加しない限りブロック）。未設定時のデフォルトを上書きするには `channels.defaults.groupPolicy` を使用します。
- `channels.msteams.groupAllowFrom` は、グループ チャット/チャネルでトリガーできる送信者または静的な送信者アクセス グループを制御します（`channels.msteams.allowFrom` にフォールバックします）。
- 任意のメンバーを許可するには `groupPolicy: "open"` を設定します（それでもデフォルトではメンション必須）。
- **チャネルを一切許可しない** 場合は、`channels.msteams.groupPolicy: "disabled"` を設定します。

例:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Teams + チャネル許可リスト**

- `channels.msteams.teams` の下にチームとチャネルを列挙して、グループ/チャネル返信のスコープを設定します。
- キーには、変更可能な表示名ではなく、Teams リンクから取得した安定した Teams 会話 ID を使用してください。
- `groupPolicy="allowlist"` かつ teams 許可リストが存在する場合、列挙されたチーム/チャネルのみが受け入れられます（メンション必須）。
- 設定ウィザードは `Team/Channel` エントリを受け取り、保存します。
- 起動時に、OpenClaw はチーム/チャネルおよびユーザー許可リストの名前を ID に解決し（Graph 権限が許可する場合）、
  そのマッピングをログに記録します。解決されなかったチーム/チャネル名は入力どおり保持されますが、`channels.msteams.dangerouslyAllowNameMatching: true` が有効でない限り、デフォルトではルーティングで無視されます。

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

<details>
<summary><strong>手動セットアップ（Teams CLI なし）</strong></summary>

Teams CLI を使用できない場合は、Azure Portal から手動で bot をセットアップできます。

### 仕組み

1. Microsoft Teams Plugin が利用可能であることを確認します（現在のリリースではバンドル済み）。
2. **Azure Bot**（App ID + シークレット + テナント ID）を作成します。
3. bot を参照し、下記の RSC 権限を含む **Teams アプリ パッケージ** をビルドします。
4. Teams アプリをチーム（または DM 用の個人スコープ）にアップロード/インストールします。
5. `~/.openclaw/openclaw.json`（または環境変数）で `msteams` を設定し、Gateway を起動します。
6. Gateway はデフォルトで `/api/messages` 上の Bot Framework Webhook トラフィックを待ち受けます。

### 手順 1: Azure Bot を作成する

1. [Azure Bot を作成](https://portal.azure.com/#create/Microsoft.AzureBot) に移動します
2. **Basics** タブに入力します。

   | フィールド              | 値                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | bot 名、例: `openclaw-msteams`（一意である必要があります） |
   | **Subscription**   | Azure サブスクリプションを選択                           |
   | **Resource group** | 新規作成するか既存のものを使用                               |
   | **Pricing tier**   | 開発/テストでは **Free**                                 |
   | **Type of App**    | **Single Tenant**（推奨 - 下記の注記を参照）         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
新しいマルチテナント bot の作成は 2025-07-31 以降非推奨になりました。新しい bot には **Single Tenant** を使用してください。
</Warning>

3. **Review + create** → **Create** をクリックします（約 1-2 分待ちます）

### 手順 2: 認証情報を取得する

1. Azure Bot リソース → **Configuration** に移動します
2. **Microsoft App ID** をコピーします → これが `appId` です
3. **Manage Password** をクリックします → App Registration に移動します
4. **Certificates & secrets** → **New client secret** の下で **Value** をコピーします → これが `appPassword` です
5. **Overview** に移動します → **Directory (tenant) ID** をコピーします → これが `tenantId` です

### 手順 3: メッセージング エンドポイントを設定する

1. Azure Bot → **Configuration**
2. **Messaging endpoint** を Webhook URL に設定します。
   - 本番環境: `https://your-domain.com/api/messages`
   - ローカル開発: トンネルを使用します（下記の [ローカル開発](#local-development-tunneling) を参照）

### 手順 4: Teams チャネルを有効にする

1. Azure Bot → **Channels**
2. **Microsoft Teams** → Configure → Save をクリックします
3. 利用規約に同意します

### 手順 5: Teams アプリ マニフェストをビルドする

- `botId = <App ID>` の `bot` エントリを含めます。
- スコープ: `personal`、`team`、`groupChat`。
- `supportsFiles: true`（個人スコープのファイル処理に必要）。
- RSC 権限を追加します（[RSC 権限](#current-teams-rsc-permissions-manifest) を参照）。
- アイコンを作成します: `outline.png`（32x32）と `color.png`（192x192）。
- 3 つのファイルすべてをまとめて zip します: `manifest.json`、`outline.png`、`color.png`。

### 手順 6: OpenClaw を設定する

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

環境変数: `MSTEAMS_APP_ID`、`MSTEAMS_APP_PASSWORD`、`MSTEAMS_TENANT_ID`。

### 手順 7: Gateway を実行する

Teams チャネルは、Plugin が利用可能で、認証情報を含む `msteams` 設定が存在する場合に自動的に開始されます。

</details>

## フェデレーション認証（証明書 + マネージド ID）

> 2026.4.11 で追加

本番環境デプロイでは、OpenClaw はクライアント シークレットより安全な代替手段として **フェデレーション認証** をサポートしています。2 つの方法を利用できます。

### オプション A: 証明書ベースの認証

Entra ID アプリ登録に登録された PEM 証明書を使用します。

**セットアップ:**

1. 証明書（秘密鍵付き PEM 形式）を生成または取得します。
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

パスワードレス認証に Azure Managed Identity を使用します。これは、マネージド ID を利用できる Azure インフラストラクチャ（AKS、App Service、Azure VM）上のデプロイに最適です。

**仕組み:**

1. bot の pod/VM にはマネージド ID（システム割り当てまたはユーザー割り当て）があります。
2. **フェデレーション ID 認証情報** が、マネージド ID を Entra ID アプリ登録にリンクします。
3. 実行時に、OpenClaw は `@azure/identity` を使用して Azure IMDS エンドポイント（`169.254.169.254`）からトークンを取得します。
4. トークンは bot 認証のために Teams SDK に渡されます。

**前提条件:**

- マネージド ID が有効な Azure インフラストラクチャ（AKS ワークロード ID、App Service、VM）
- Entra ID アプリ登録に作成されたフェデレーション ID 認証情報
- pod/VM から IMDS（`169.254.169.254:80`）へのネットワーク アクセス

**設定（システム割り当てマネージド ID）:**

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

**設定（ユーザー割り当てマネージド ID）:**

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

### AKS Workload Identity のセットアップ

workload identity を使用する AKS デプロイの場合:

1. AKS クラスターで **workload identity を有効化**します。
2. Entra ID アプリ登録で **フェデレーション ID 資格情報を作成**します。

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. アプリのクライアント ID で **Kubernetes サービスアカウントに注釈を付け**ます。

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. workload identity 注入のために **Pod にラベルを付け**ます。

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS（`169.254.169.254`）への **ネットワークアクセスを確保**します。NetworkPolicy を使用している場合は、ポート 80 で `169.254.169.254/32` へのトラフィックを許可する egress ルールを追加します。

### 認証タイプの比較

| 方法                 | 設定                                           | 利点                               | 欠点                                       |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------------ |
| **クライアントシークレット** | `appPassword`                                  | セットアップが簡単                 | シークレットのローテーションが必要で、安全性が低い |
| **証明書**           | `authType: "federated"` + `certificatePath`    | ネットワーク経由の共有シークレットなし | 証明書管理の負担                           |
| **マネージド ID**    | `authType: "federated"` + `useManagedIdentity` | パスワードレスで、管理するシークレットなし | Azure インフラストラクチャが必要            |

**既定の動作:** `authType` が設定されていない場合、OpenClaw は既定でクライアントシークレット認証を使用します。既存の設定は変更なしで引き続き動作します。

## ローカル開発（トンネリング）

Teams は `localhost` に到達できません。セッションをまたいでも URL が変わらないように、永続的な開発トンネルを使用します。

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

代替手段: `ngrok http 3978` または `tailscale funnel 3978`（URL はセッションごとに変わる場合があります）。

トンネル URL が変わった場合は、エンドポイントを更新します。

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Bot のテスト

**診断を実行:**

```bash
teams app doctor <teamsAppId>
```

Bot 登録、AAD アプリ、マニフェスト、SSO 設定を一度にチェックします。

**テストメッセージを送信:**

1. Teams アプリをインストールします（`teams app get <id> --install-link` のインストールリンクを使用）
2. Teams で Bot を見つけて DM を送信します
3. 受信アクティビティが Gateway ログにあることを確認します

## 環境変数

すべての設定キーは、代わりに環境変数で設定できます。

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE`（任意: `"secret"` または `"federated"`）
- `MSTEAMS_CERTIFICATE_PATH`（federated + certificate）
- `MSTEAMS_CERTIFICATE_THUMBPRINT`（任意、認証には不要）
- `MSTEAMS_USE_MANAGED_IDENTITY`（federated + managed identity）
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（ユーザー割り当て MI のみ）

## メンバー情報アクション

OpenClaw は Microsoft Teams 向けに Graph ベースの `member-info` アクションを公開しており、エージェントと自動化はチャネルメンバーの詳細（表示名、メール、ロール）を Microsoft Graph から直接解決できます。

要件:

- `Member.Read.Group` RSC 権限（推奨マニフェストにすでに含まれています）
- チーム横断のルックアップの場合: 管理者同意付きの `User.Read.All` Graph Application 権限

このアクションは `channels.msteams.actions.memberInfo` によってゲートされます（既定: Graph 資格情報が利用可能な場合に有効）。

## 履歴コンテキスト

- `channels.msteams.historyLimit` は、最近のチャネル/グループメッセージをいくつプロンプトにラップするかを制御します。
- `messages.groupChat.historyLimit` にフォールバックします。無効化するには `0` を設定します（既定は 50）。
- 取得されたスレッド履歴は送信者許可リスト（`allowFrom` / `groupAllowFrom`）でフィルターされるため、スレッドコンテキストのシードには許可された送信者からのメッセージのみが含まれます。
- 引用添付ファイルコンテキスト（Teams 返信 HTML から派生した `ReplyTo*`）は、現在は受信したまま渡されます。
- つまり、許可リストは誰がエージェントをトリガーできるかをゲートします。現時点でフィルターされるのは特定の補足コンテキストパスのみです。
- DM 履歴は `channels.msteams.dmHistoryLimit`（ユーザーターン）で制限できます。ユーザーごとのオーバーライド: `channels.msteams.dms["<user_id>"].historyLimit`。

## 現在の Teams RSC 権限（マニフェスト）

これらは、Teams アプリマニフェストにある **既存の resourceSpecific 権限**です。アプリがインストールされているチーム/チャット内でのみ適用されます。

**チャネル用（チームスコープ）:**

- `ChannelMessage.Read.Group`（Application）- @mention なしですべてのチャネルメッセージを受信
- `ChannelMessage.Send.Group`（Application）
- `Member.Read.Group`（Application）
- `Owner.Read.Group`（Application）
- `ChannelSettings.Read.Group`（Application）
- `TeamMember.Read.Group`（Application）
- `TeamSettings.Read.Group`（Application）

**グループチャット用:**

- `ChatMessage.Read.Chat`（Application）- @mention なしですべてのグループチャットメッセージを受信

Teams CLI で RSC 権限を追加するには:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams マニフェストの例（編集済み）

必要なフィールドを含む、最小限の有効な例です。ID と URL を置き換えてください。

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

### マニフェストの注意点（必須フィールド）

- `bots[].botId` は Azure Bot App ID と一致している**必要があります**。
- `webApplicationInfo.id` は Azure Bot App ID と一致している**必要があります**。
- `bots[].scopes` には、使用予定のサーフェス（`personal`、`team`、`groupChat`）を含める必要があります。
- 個人スコープでファイルを扱うには `bots[].supportsFiles: true` が必要です。
- チャネルのトラフィックが必要な場合、`authorization.permissions.resourceSpecific` にはチャネルの読み取り/送信を含める必要があります。

### 既存アプリの更新

すでにインストール済みの Teams アプリを更新するには（例: RSC 権限を追加する場合）:

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

更新後、新しい権限を有効にするには各チームでアプリを再インストールし、キャッシュされたアプリメタデータをクリアするために **Teams を完全に終了して再起動**します（ウィンドウを閉じるだけではありません）。

<details>
<summary>手動でのマニフェスト更新（CLI なし）</summary>

1. 新しい設定で `manifest.json` を更新します
2. **`version` フィールドを増分**します（例: `1.0.0` → `1.1.0`）
3. アイコン（`manifest.json`、`outline.png`、`color.png`）とともにマニフェストを **再 zip 化**します
4. 新しい zip をアップロードします。
   - **Teams 管理センター:** Teams アプリ → アプリを管理 → アプリを探す → 新しいバージョンをアップロード
   - **サイドロード:** Teams で → アプリ → アプリを管理 → カスタムアプリをアップロード

</details>

## 機能: RSC のみ vs Graph

### **Teams RSC のみ**の場合（アプリはインストール済み、Graph API 権限なし）

動作するもの:

- チャネルメッセージの**テキスト**コンテンツを読む。
- チャネルメッセージの**テキスト**コンテンツを送信する。
- **個人（DM）** のファイル添付を受信する。

動作しないもの:

- チャネル/グループの**画像またはファイル内容**（ペイロードには HTML スタブのみが含まれます）。
- SharePoint/OneDrive に保存された添付ファイルのダウンロード。
- メッセージ履歴の読み取り（ライブ Webhook イベントを超えるもの）。

### **Teams RSC + Microsoft Graph Application 権限**の場合

追加されるもの:

- ホストされたコンテンツ（メッセージに貼り付けられた画像）のダウンロード。
- SharePoint/OneDrive に保存されたファイル添付のダウンロード。
- Graph 経由でのチャネル/チャットメッセージ履歴の読み取り。

### RSC vs Graph API

| 機能                   | RSC 権限             | Graph API                           |
| ---------------------- | -------------------- | ----------------------------------- |
| **リアルタイムメッセージ** | はい（Webhook 経由） | いいえ（ポーリングのみ）            |
| **履歴メッセージ**     | いいえ               | はい（履歴をクエリ可能）            |
| **セットアップの複雑さ** | アプリマニフェストのみ | 管理者同意 + トークンフローが必要   |
| **オフラインで動作**   | いいえ（実行中である必要あり） | はい（いつでもクエリ可能）          |

**要点:** RSC はリアルタイムリスニング用で、Graph API は履歴アクセス用です。オフライン中に見逃したメッセージを取得するには、`ChannelMessage.Read.All` を持つ Graph API が必要です（管理者同意が必要）。

## Graph 有効のメディア + 履歴（チャネルでは必須）

**チャネル**で画像/ファイルが必要な場合、または**メッセージ履歴**を取得したい場合は、Microsoft Graph 権限を有効化し、管理者同意を付与する必要があります。

1. Entra ID（Azure AD）の **アプリ登録**で、Microsoft Graph **Application 権限**を追加します。
   - `ChannelMessage.Read.All`（チャネル添付 + 履歴）
   - `Chat.Read.All` または `ChatMessage.Read.All`（グループチャット）
2. テナントに **管理者同意を付与**します。
3. Teams アプリの **マニフェストバージョン**を上げ、再アップロードし、**Teams にアプリを再インストール**します。
4. キャッシュされたアプリメタデータをクリアするために **Teams を完全に終了して再起動**します。

**ユーザーメンション用の追加権限:** User @mentions は会話内のユーザーに対してはそのまま動作します。ただし、**現在の会話にいない**ユーザーを動的に検索してメンションしたい場合は、`User.Read.All`（Application）権限を追加し、管理者同意を付与します。

## 既知の制限

### Webhook タイムアウト

Teams は HTTP Webhook 経由でメッセージを配信します。処理に時間がかかりすぎる場合（例: LLM の応答が遅い場合）、次のような事象が発生することがあります。

- Gateway タイムアウト
- Teams がメッセージを再試行する（重複の原因になる）
- 返信のドロップ

OpenClaw はこれを、すばやく戻って能動的に返信を送ることで処理しますが、非常に遅い応答ではまだ問題が発生する場合があります。

### Teams クラウドとサービス URL のサポート

この SDK ベースの Teams パスは、Microsoft Teams パブリッククラウドでライブ検証されています。

受信返信は、受信した Teams SDK ターンコンテキストを使用します。コンテキスト外のプロアクティブ操作（送信、編集、削除、カード、投票、ファイル同意メッセージ、キューに入った長時間実行返信）は、保存された会話参照の `serviceUrl` を使用します。パブリッククラウドでは、既定で Teams SDK のパブリッククラウド環境を使用し、パブリック Teams Connector ホスト上の保存済み参照を許可します: `https://smba.trafficmanager.net/`。

パブリッククラウドが既定です。通常のパブリッククラウド Bot では、`channels.msteams.cloud` や `channels.msteams.serviceUrl` を設定する必要はありません。

非パブリック Teams クラウドでは、Microsoft が公開している場合に `cloud` と対応するプロアクティブ境界を設定します。

- `channels.msteams.cloud` は、認証、JWT 検証、トークンサービス、Graph スコープに使用する Teams SDK クラウドプリセットを選択します。
- `channels.msteams.serviceUrl` は、プロアクティブな送信、編集、削除、カード、投票、ファイル同意メッセージ、キューに入った長時間実行返信の前に保存済み会話参照を検証するために使用される Bot Connector エンドポイント境界を選択します。USGov および DoD SDK クラウドでは必須です。China/21Vianet では、OpenClaw は SDK の `China` プリセットを使用し、Azure China Bot Framework チャネルホスト上の保存済みまたは設定済みサービス URL のみを受け入れます。

Microsoft は、Teams プロアクティブメッセージングドキュメントの [会話を作成する](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) セクションで、グローバルなプロアクティブ Bot Connector エンドポイントを公開しています。利用可能な場合は受信アクティビティの `serviceUrl` を使用してください。グローバルなプロアクティブエンドポイントが必要な場合は、Microsoft の表を使用してください。

| Teams 環境 | OpenClaw 設定                                             | プロアクティブ `serviceUrl`                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Public            | cloud/serviceUrl 設定は不要                           | `https://smba.trafficmanager.net/teams`            |
| GCC               | `serviceUrl` を設定。個別の Teams SDK クラウドプリセットは存在しない | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | 受信アクティビティの `serviceUrl` を使用           |

GCC の例。Microsoft は個別のプロアクティブサービス URL を文書化していますが、Teams SDK は個別の GCC クラウドプリセットを公開していません。

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

GCC High の例:

```json
{
  "channels": {
    "msteams": {
      "cloud": "USGov",
      "serviceUrl": "https://smba.infra.gov.teams.microsoft.us/teams"
    }
  }
}
```

`channels.msteams.serviceUrl` は、サポートされている Microsoft Teams Bot Connector ホストに制限されています。サービス URL が設定されている場合、OpenClaw はプロアクティブな送信、編集、削除、カード、投票、またはキューに入った長時間実行返信を実行する前に、保存済み会話の `serviceUrl` が同じホストを使用していることを確認します。既定のパブリッククラウド設定では、保存済み会話がパブリック Teams Connector ホストの外部を指している場合、OpenClaw はフェイルクローズします。cloud/service URL 設定を変更した後は、会話から新しいメッセージを受信して、保存済み会話参照を最新にしてください。

China/21Vianet には、Microsoft の Teams プロアクティブエンドポイント表に個別のグローバルプロアクティブ `smba` URL がありません。Teams SDK が Azure China の認証、トークン、JWT エンドポイントを使用するように `cloud: "China"` を設定してください。プロアクティブ送信には、受信した China Teams アクティビティからの保存済み会話参照、または明示的に設定されたサービス URL が、Azure China Bot Framework チャネル境界（`*.botframework.azure.cn`）上に必要です。Graph ベースの Teams ヘルパーは、OpenClaw が Graph リクエストを Azure China Graph エンドポイント経由でルーティングするまで、現在 `cloud: "China"` では無効化されています。

### 書式設定

Teams markdown は Slack や Discord よりも制限があります。

- 基本的な書式設定は動作します: **太字**、_斜体_、`code`、リンク
- 複雑な markdown（テーブル、ネストしたリスト）は正しくレンダリングされない場合があります
- Adaptive Cards は、投票とセマンティックなプレゼンテーション送信でサポートされています（下記参照）

## 設定

主要な設定（共有チャネルパターンについては `/gateway/configuration` を参照）:

- `channels.msteams.enabled`: チャネルを有効化/無効化します。
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: Bot 資格情報。
- `channels.msteams.cloud`: Teams SDK クラウド環境（`Public`、`USGov`、`USGovDoD`、または `China`。既定は `Public`）。USGov/DoD SDK クラウドでは、これを `serviceUrl` と一緒に設定します。China は SDK プリセットと保存済み Azure China Bot Framework 会話参照を使用し、Azure China Graph ルーティングが実装されるまで Graph ベースのヘルパーは無効化されます。
- `channels.msteams.serviceUrl`: SDK プロアクティブ操作用の Bot Connector サービス URL 境界。パブリッククラウドは SDK の既定値を使用します。GCC（`https://smba.infra.gcc.teams.microsoft.com/teams`）、GCC High、または DoD ではこれを設定します。China は、保存済み会話参照が 21Vianet が運用する Teams から来ている場合、Azure China Bot Framework チャネルホストを受け入れます。
- `channels.msteams.webhook.port`（既定 `3978`）
- `channels.msteams.webhook.path`（既定 `/api/messages`）
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled`（既定: pairing）
- `channels.msteams.allowFrom`: DM 許可リスト（AAD オブジェクト ID を推奨）。Graph アクセスが利用可能な場合、ウィザードはセットアップ中に名前を ID に解決します。
- `channels.msteams.dangerouslyAllowNameMatching`: 可変の UPN/表示名マッチングと直接のチーム/チャネル名ルーティングを再有効化するための緊急用トグル。
- `channels.msteams.textChunkLimit`: 送信テキストチャンクサイズ。
- `channels.msteams.chunkMode`: 長さによるチャンク化の前に空行（段落境界）で分割するには、`length`（既定）または `newline`。
- `channels.msteams.mediaAllowHosts`: 受信添付ファイルホストの許可リスト（既定は Microsoft/Teams ドメイン）。
- `channels.msteams.mediaAuthAllowHosts`: メディア再試行時に Authorization ヘッダーを付与するための許可リスト（既定は Graph + Bot Framework ホスト）。
- `channels.msteams.requireMention`: チャネル/グループで @mention を必須にします（既定 true）。
- `channels.msteams.replyStyle`: `thread | top-level`（[返信スタイル](#reply-style-threads-vs-posts) を参照）。
- `channels.msteams.teams.<teamId>.replyStyle`: チーム単位の上書き。
- `channels.msteams.teams.<teamId>.requireMention`: チーム単位の上書き。
- `channels.msteams.teams.<teamId>.tools`: チャネル上書きがない場合に使用される、チーム単位の既定ツールポリシー上書き（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.toolsBySender`: チーム単位、送信者単位の既定ツールポリシー上書き（`"*"` ワイルドカード対応）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: チャネル単位の上書き。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: チャネル単位の上書き。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: チャネル単位のツールポリシー上書き（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: チャネル単位、送信者単位のツールポリシー上書き（`"*"` ワイルドカード対応）。
- `toolsBySender` キーには明示的なプレフィックスを使用してください:
  `channel:`, `id:`, `e164:`, `username:`, `name:`（レガシーのプレフィックスなしキーは、現在も `id:` のみにマップされます）。
- `channels.msteams.actions.memberInfo`: Graph ベースのメンバー情報アクションを有効化または無効化します（既定: Graph 資格情報が利用可能な場合は有効）。
- `channels.msteams.authType`: 認証タイプ - `"secret"`（既定）または `"federated"`。
- `channels.msteams.certificatePath`: PEM 証明書ファイルへのパス（フェデレーション + 証明書認証）。
- `channels.msteams.certificateThumbprint`: 証明書サムプリント（省略可能、認証には不要）。
- `channels.msteams.useManagedIdentity`: マネージド ID 認証を有効化します（フェデレーションモード）。
- `channels.msteams.managedIdentityClientId`: ユーザー割り当てマネージド ID のクライアント ID。
- `channels.msteams.sharePointSiteId`: グループチャット/チャネルでのファイルアップロード用 SharePoint サイト ID（[グループチャットでファイルを送信する](#sending-files-in-group-chats) を参照）。

## ルーティングとセッション

- セッションキーは標準エージェント形式に従います（[/concepts/session](/ja-JP/concepts/session) を参照）:
  - ダイレクトメッセージはメインセッションを共有します（`agent:<agentId>:<mainKey>`）。
  - チャネル/グループメッセージは会話 ID を使用します:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 返信スタイル: スレッド vs 投稿

Teams は最近、同じ基盤データモデル上に 2 つのチャネル UI スタイルを導入しました。

| スタイル                    | 説明                                               | 推奨 `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **投稿**（クラシック）      | メッセージはカードとして表示され、その下にスレッド返信が付く | `thread`（既定）       |
| **スレッド**（Slack 風） | メッセージは Slack に近い形で線形に流れる                   | `top-level`              |

**問題:** Teams API は、チャネルがどの UI スタイルを使用しているかを公開しません。誤った `replyStyle` を使用すると、次のようになります。

- スレッドスタイルのチャネルで `thread` → 返信が不自然にネストされて表示される
- 投稿スタイルのチャネルで `top-level` → 返信がスレッド内ではなく、別のトップレベル投稿として表示される

**解決策:** チャネルの設定方法に基づいて、チャネル単位で `replyStyle` を設定します。

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

### 解決の優先順位

Bot がチャネルに返信を送るとき、`replyStyle` は最も具体的な上書きから既定値に向かって解決されます。最初の非 `undefined` 値が採用されます。

1. **チャネル単位** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **チーム単位** — `channels.msteams.teams.<teamId>.replyStyle`
3. **グローバル** — `channels.msteams.replyStyle`
4. **暗黙の既定値** — `requireMention` から派生:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

明示的な `replyStyle` なしでグローバルに `requireMention: false` を設定すると、受信がスレッド返信だった場合でも、投稿スタイルのチャネルでのメンションはトップレベル投稿として表示されます。予期しない挙動を避けるため、グローバル、チーム、またはチャネルレベルで `replyStyle: "thread"` を固定してください。

### スレッドコンテキストの保持

`replyStyle: "thread"` が有効で、Bot がチャネルスレッド内から @mentioned された場合、OpenClaw は元のスレッドルートを送信用会話参照（`19:…@thread.tacv2;messageid=<root>`）に再付与し、返信が同じスレッド内に届くようにします。これは、ライブ（ターン内）送信と、Bot Framework ターンコンテキストの期限切れ後に行われるプロアクティブ送信（例: 長時間実行エージェント、`mcp__openclaw__message` 経由のキューに入ったツール呼び出し返信）の両方に当てはまります。

スレッドルートは、会話参照に保存された `threadId` から取得されます。`threadId` より前の古い保存済み参照は `activityId`（最後に会話をシードした受信アクティビティ）にフォールバックするため、既存のデプロイは再シードなしで動作し続けます。

`replyStyle: "top-level"` が有効な場合、チャネルスレッドの受信メッセージには意図的に新しいトップレベル投稿として応答します。スレッド接尾辞は付与されません。これは Threads形式のチャネルでは正しい動作です。スレッド返信を期待していた場所にトップレベル投稿が表示される場合、そのチャネルの `replyStyle` が正しく設定されていません。

## 添付ファイルと画像

**現在の制限:**

- **DM:** 画像とファイル添付は Teams ボットのファイル API 経由で動作します。
- **チャネル/グループ:** 添付ファイルは M365 ストレージ (SharePoint/OneDrive) にあります。Webhook ペイロードには HTML スタブのみが含まれ、実際のファイルバイトは含まれません。チャネル添付ファイルをダウンロードするには **Graph API 権限が必要**です。
- 明示的なファイル優先送信では、`media` / `filePath` / `path` とともに `action=upload-file` を使用します。任意の `message` は付随するテキスト/コメントになり、`filename` はアップロード名を上書きします。

Graph 権限がない場合、画像付きのチャネルメッセージはテキストのみとして受信されます (画像コンテンツにはボットからアクセスできません)。
デフォルトでは、OpenClaw は Microsoft/Teams ホスト名からのみメディアをダウンロードします。`channels.msteams.mediaAllowHosts` で上書きします (任意のホストを許可するには `["*"]` を使用します)。
Authorization ヘッダーは `channels.msteams.mediaAuthAllowHosts` 内のホストにのみ付与されます (デフォルトは Graph + Bot Framework ホスト)。このリストは厳格に保ってください (マルチテナント接尾辞は避けてください)。

## グループチャットでファイルを送信する

ボットは FileConsentCard フロー (組み込み) を使用して DM でファイルを送信できます。ただし、**グループチャット/チャネルでファイルを送信する**には追加のセットアップが必要です。

| コンテキスト             | ファイルの送信方法                                 | 必要なセットアップ                                  |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                   | FileConsentCard → ユーザーが承認 → ボットがアップロード | そのまま動作します                                |
| **グループチャット/チャネル** | SharePoint にアップロード → 共有リンク              | `sharePointSiteId` + Graph 権限が必要             |
| **画像 (任意のコンテキスト)** | Base64 エンコードされたインライン                  | そのまま動作します                                |

### グループチャットで SharePoint が必要な理由

ボットには個人用 OneDrive ドライブがありません (`/me/drive` Graph API エンドポイントはアプリケーション ID では動作しません)。グループチャット/チャネルでファイルを送信するには、ボットが **SharePoint サイト**にアップロードし、共有リンクを作成します。

### セットアップ

1. Entra ID (Azure AD) → App Registration で **Graph API 権限を追加**します:
   - `Sites.ReadWrite.All` (Application) - SharePoint にファイルをアップロード
   - `Chat.Read.All` (Application) - 任意、ユーザーごとの共有リンクを有効化

2. テナントに対して **管理者の同意を付与**します。

3. **SharePoint サイト ID を取得します:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
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

### 共有の動作

| 権限                                    | 共有の動作                                                |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` のみ              | 組織全体の共有リンク (組織内の誰でもアクセス可能)          |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ユーザーごとの共有リンク (チャットメンバーのみアクセス可能) |

ユーザーごとの共有は、チャット参加者だけがファイルにアクセスできるため、より安全です。`Chat.Read.All` 権限がない場合、ボットは組織全体の共有にフォールバックします。

### フォールバック動作

| シナリオ                                           | 結果                                               |
| ------------------------------------------------- | -------------------------------------------------- |
| グループチャット + ファイル + `sharePointSiteId` 設定済み | SharePoint にアップロードし、共有リンクを送信       |
| グループチャット + ファイル + `sharePointSiteId` なし     | OneDrive アップロードを試行 (失敗する場合あり)、テキストのみ送信 |
| 個人チャット + ファイル                              | FileConsentCard フロー (SharePoint なしで動作)      |
| 任意のコンテキスト + 画像                            | Base64 エンコードされたインライン (SharePoint なしで動作) |

### ファイルの保存場所

アップロードされたファイルは、設定された SharePoint サイトの既定のドキュメントライブラリ内の `/OpenClawShared/` フォルダーに保存されます。

## 投票 (Adaptive Cards)

OpenClaw は Teams の投票を Adaptive Cards として送信します (ネイティブの Teams 投票 API はありません)。

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票は Gateway により、`state/openclaw.sqlite` 配下の OpenClaw Plugin 状態 SQLite に記録されます。
- 既存の `msteams-polls.json` ファイルは、実行中の Plugin ではなく `openclaw doctor --fix` によってインポートされます。
- 投票を記録するには Gateway がオンラインのままである必要があります。
- 投票はまだ結果サマリーを自動投稿せず、サポートされている投票結果 CLI もまだありません。

## プレゼンテーションカード

`message` ツール、CLI、または通常の返信配信を使用して、セマンティックなプレゼンテーションペイロードを Teams ユーザーまたは会話に送信します。OpenClaw は汎用プレゼンテーション契約から Teams Adaptive Cards としてレンダリングします。

`presentation` パラメーターはセマンティックブロックを受け取ります。`presentation` が指定されている場合、メッセージテキストは任意です。ボタンは Adaptive Card の送信アクションまたは URL アクションとしてレンダリングされます。選択メニューは Teams レンダラーではまだネイティブではないため、OpenClaw は配信前に読みやすいテキストへダウングレードします。

**Agent ツール:**

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

ターゲット形式の詳細については、下の [ターゲット形式](#target-formats) を参照してください。

## ターゲット形式

MSTeams ターゲットは、ユーザーと会話を区別するためにプレフィックスを使用します。

| ターゲット種別       | 形式                             | 例                                                  |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| ユーザー (ID 指定)   | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| ユーザー (名前指定)  | `user:<display-name>`            | `user:John Smith` (Graph API が必要)                 |
| グループ/チャネル    | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| グループ/チャネル (raw) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (`@thread` を含む場合) |

**CLI の例:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Agent ツールの例:**

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

<Note>
`user:` プレフィックスがない場合、名前はデフォルトでグループまたはチーム解決になります。表示名で人をターゲットにする場合は、常に `user:` を使用してください。
</Note>

## プロアクティブメッセージング

- プロアクティブメッセージは、会話参照をその時点で保存するため、ユーザーが操作した**後**にのみ可能です。
- `dmPolicy` と許可リストゲートについては `/gateway/configuration` を参照してください。

## チーム ID とチャネル ID (よくある落とし穴)

Teams URL の `groupId` クエリパラメーターは、設定で使用するチーム ID **ではありません**。代わりに URL パスから ID を抽出してください。

**チーム URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**チャネル URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**設定用:**

- チームキー = `/team/` の後のパスセグメント (URL デコード済み、例: `19:Bk4j...@thread.tacv2`; 古いテナントでは `@thread.skype` が表示される場合があり、これも有効です)
- チャネルキー = `/channel/` の後のパスセグメント (URL デコード済み)
- OpenClaw ルーティングでは `groupId` クエリパラメーターを**無視**します。これは Microsoft Entra グループ ID であり、受信 Teams アクティビティで使用される Bot Framework 会話 ID ではありません。

## プライベートチャネル

ボットはプライベートチャネルでのサポートが限定されています。

| 機能                         | 標準チャネル | プライベートチャネル     |
| ---------------------------- | ------------ | ---------------------- |
| ボットのインストール          | はい         | 限定的                 |
| リアルタイムメッセージ (Webhook) | はい         | 動作しない場合があります |
| RSC 権限                     | はい         | 異なる動作をする場合があります |
| @メンション                   | はい         | ボットにアクセスできる場合 |
| Graph API 履歴               | はい         | はい (権限あり)         |

**プライベートチャネルが動作しない場合の回避策:**

1. ボットとのやり取りには標準チャネルを使用する
2. DM を使用する - ユーザーは常にボットへ直接メッセージを送信できます
3. 履歴アクセスには Graph API を使用する (`ChannelMessage.Read.All` が必要)

## トラブルシューティング

### よくある問題

- **チャネルで画像が表示されない:** Graph 権限または管理者同意がありません。Teams アプリを再インストールし、Teams を完全に終了して再度開いてください。
- **チャネルで応答がない:** デフォルトではメンションが必要です。`channels.msteams.requireMention=false` を設定するか、チーム/チャネルごとに設定してください。
- **バージョン不一致 (Teams がまだ古いマニフェストを表示する):** アプリを削除して再追加し、Teams を完全に終了して更新してください。
- **Webhook から 401 Unauthorized:** Azure JWT なしで手動テストした場合は想定どおりです。エンドポイントに到達可能だが認証に失敗したことを意味します。正しくテストするには Azure Web Chat を使用してください。

### マニフェストアップロードエラー

- **「Icon file cannot be empty」:** マニフェストが参照しているアイコンファイルが 0 バイトです。有効な PNG アイコン (`outline.png` は 32x32、`color.png` は 192x192) を作成してください。
- **「webApplicationInfo.Id already in use」:** アプリがまだ別のチーム/チャットにインストールされています。先に見つけてアンインストールするか、反映まで 5-10 分待ってください。
- **アップロード時の「Something went wrong」:** 代わりに [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) からアップロードし、ブラウザーの DevTools (F12) → Network タブを開いて、実際のエラーについてレスポンス本文を確認してください。
- **サイドロードに失敗する:** 「Upload a custom app」ではなく「Upload an app to your org's app catalog」を試してください。これによりサイドロード制限を回避できることがよくあります。

### RSC 権限が動作しない

1. `webApplicationInfo.id` がボットの App ID と完全に一致することを確認する
2. アプリを再アップロードし、チーム/チャットに再インストールする
3. 組織管理者が RSC 権限をブロックしていないか確認する
4. 正しいスコープを使用していることを確認する: チームには `ChannelMessage.Read.Group`、グループチャットには `ChatMessage.Read.Chat`

## 参考資料

- [Azure Bot を作成する](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot セットアップガイド
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams アプリの作成/管理
- [Teams アプリマニフェストスキーマ](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC でチャネルメッセージを受信する](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 権限リファレンス](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams ボットのファイル処理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (チャネル/グループには Graph が必要)
- [プロアクティブメッセージング](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - ボット管理用 Teams CLI

## 関連

- [チャネル概要](/ja-JP/channels) - サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化
