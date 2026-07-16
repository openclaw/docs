---
read_when:
    - Microsoft Teams チャネル機能の開発
summary: Microsoft Teams ボットのサポート状況、機能、設定
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-16T11:21:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb16cf89ed2ab7ae69389ac30e9cc32cc7d1bc2d3c6bccbd139d367380b7b32c
    source_path: channels/msteams.md
    workflow: 16
---

ステータス: テキストとDMの添付ファイルがサポートされています。チャネル/グループでのファイル送信には、`sharePointSiteId` とGraph権限が必要です（[グループチャットでのファイル送信](#sending-files-in-group-chats)を参照）。投票はAdaptive Cards経由で送信されます。メッセージアクションでは、ファイル優先送信用に明示的な `upload-file` が公開されています。

## バンドル済みPlugin

現在のOpenClawリリースでは、Microsoft Teamsはバンドル済みPluginとして提供されます。通常のパッケージビルドでは、個別にインストールする必要はありません。

古いビルド、またはバンドル済みTeamsを除外したカスタムインストールでは、npmパッケージを直接インストールします。

```bash
openclaw plugins install @openclaw/msteams
```

現在の公式リリースタグに追従するには、バージョンなしのパッケージを使用します。再現可能なインストールが必要な場合にのみ、正確なバージョンを固定してください。

ローカルチェックアウト（gitリポジトリから実行）:

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳細: [Plugin](/ja-JP/tools/plugin)

## クイックセットアップ

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli)では、1つのコマンドでボットの登録、マニフェストの作成、認証情報の生成を行えます。

**1. インストールしてログインする**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # ログイン済みであることを確認し、テナント情報を表示する
```

<Note>
Teams CLIは現在プレビュー版です。コマンドとフラグはリリース間で変更される可能性があります。
</Note>

**2. トンネルを開始する**（Teamsはlocalhostにアクセスできません）

必要に応じて、devtunnel CLIをインストールして認証します（[はじめにガイド](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# 1回限りのセットアップ（セッションをまたいでURLを維持）:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 各開発セッション:
devtunnel host my-openclaw-bot
# エンドポイント: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
Teamsはdevtunnelsで認証できないため、`--allow-anonymous` が必要です。受信する各ボットリクエストは、引き続きTeams SDKによって検証されます。
</Note>

代替手段: `ngrok http 3978` または `tailscale funnel 3978`（URLはセッションごとに変更される場合があります）。

**3. アプリを作成する**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

このコマンドは、Entra ID（Azure AD）アプリケーションを作成し、クライアントシークレットを生成し、（アイコンを含む）Teamsアプリマニフェストをビルドしてアップロードし、Teamsが管理するボットを登録します（Azureサブスクリプションは不要です）。出力には `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID`、および **Teams App ID** が含まれます。また、アプリをTeamsに直接インストールすることも提案されます。

**4. OpenClawを構成する**。出力された認証情報を使用します。

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

または、環境変数 `MSTEAMS_APP_ID`、`MSTEAMS_APP_PASSWORD`、`MSTEAMS_TENANT_ID` を直接使用します。

**5. アプリをTeamsにインストールする**

`teams app create` によりアプリのインストールを求められます。「Install in Teams」を選択します。後からインストールリンクを取得するには、次のコマンドを実行します。

```bash
teams app get <teamsAppId> --install-link
```

**6. すべてが動作することを確認する**

```bash
teams app doctor <teamsAppId>
```

ボット登録、AADアプリ構成、マニフェストの有効性、SSOセットアップを対象に診断を実行します。

本番環境では、クライアントシークレットの代わりに[フェデレーション認証](#federated-authentication-certificate-plus-managed-identity)（証明書またはマネージドID）の使用を検討してください。

<Note>
グループチャットはデフォルトでブロックされます（`channels.msteams.groupPolicy: "allowlist"`）。グループへの返信を許可するには `channels.msteams.groupAllowFrom` を設定するか、`groupPolicy: "open"` を使用して任意のメンバーを許可します（メンションは必要です）。
</Note>

## 目標

- TeamsのDM、グループチャット、またはチャネルを介してOpenClawと会話します。
- ルーティングを決定論的に保ちます。返信は常に、メッセージを受信したチャネルに返されます。
- デフォルトでは安全なチャネル動作を使用します（別途構成されていない限り、メンションが必要です）。

## 構成の書き込み

デフォルトでは、Microsoft Teamsは `/config set|unset` によってトリガーされた構成の更新を書き込めます（`commands.config: true` が必要です）。

無効にするには、次のように設定します。

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## アクセス制御（DMとグループ）

**DMアクセス**

- デフォルト: `channels.msteams.dmPolicy = "pairing"`。不明な送信者は、承認されるまで無視されます。
- `channels.msteams.allowFrom` には、安定したAADオブジェクトID、または `accessGroup:core-team` のような静的な送信者アクセスグループを使用してください。
- 許可リストでは、UPNや表示名の照合に依存しないでください。これらは変更される可能性があります。OpenClawでは、名前の直接照合がデフォルトで無効になっています。有効にするには `channels.msteams.dangerouslyAllowNameMatching: true` を設定します。
- 認証情報で許可されている場合、ウィザードはMicrosoft Graphを介して名前をIDに解決できます。

**グループアクセス**

- デフォルト: `channels.msteams.groupPolicy = "allowlist"`（`groupAllowFrom` を追加しない限りブロックされます）。`channels.msteams.groupPolicy` が未設定の場合、`channels.defaults.groupPolicy` で共有デフォルトを上書きできます。
- `channels.msteams.groupAllowFrom` は、グループチャット/チャネルでトリガーできる送信者または静的な送信者アクセスグループを制御します（`channels.msteams.allowFrom` にフォールバックします）。
- 任意のメンバーを許可するには `groupPolicy: "open"` を設定します（デフォルトでは引き続きメンションが必要です）。
- **すべての**チャネルをブロックするには、`channels.msteams.groupPolicy: "disabled"` を設定します。

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

**チームとチャネルの許可リスト**

- `channels.msteams.teams` の下にチームとチャネルを列挙して、グループ/チャネルへの返信範囲を限定します。
- 可変の表示名ではなく、Teamsリンクに含まれる安定したTeams会話IDをキーとして使用します（[チームIDとチャネルID](#team-and-channel-ids-common-gotcha)を参照）。
- `groupPolicy="allowlist"` でチーム許可リストが存在する場合、列挙されたチーム/チャネルのみが受け入れられます（メンションが必要です）。
- 構成ウィザードは `Team/Channel` のエントリを受け付け、自動的に保存します。
- 起動時にOpenClawは、Graph権限で許可されている場合、チーム/チャネルおよびユーザー許可リストの名前をIDに解決し、その対応関係をログに記録します。解決できない名前は入力されたまま保持されますが、`channels.msteams.dangerouslyAllowNameMatching: true` が設定されていない限り、ルーティングでは無視されます。

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
<summary><strong>手動セットアップ（Teams CLIを使用しない場合）</strong></summary>

### 仕組み

1. Microsoft Teams Pluginが利用可能であることを確認します（現在のリリースにはバンドルされています）。
2. **Azure Bot**（App ID、シークレット、テナントID）を作成します。
3. 以下のRSC権限を含み、ボットを参照する **Teamsアプリパッケージ** をビルドします。
4. Teamsアプリをチームにアップロード/インストールします（DMの場合は個人スコープ）。
5. `~/.openclaw/openclaw.json`（または環境変数）で `msteams` を構成し、Gatewayを起動します。
6. Gatewayはデフォルトで、`/api/messages` 上のBot Framework Webhookトラフィックをリッスンします。

### ステップ1: Azure Botを作成する

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)に移動します。
2. **Basics** タブに入力します。

   | フィールド              | 値                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | ボット名（例: `openclaw-msteams`、一意である必要があります） |
   | **Subscription**   | Azureサブスクリプションを選択                           |
   | **Resource group** | 新規作成するか既存のものを使用                               |
   | **Pricing tier**   | 開発/テストには **Free**                                 |
   | **Type of App**    | **Single Tenant**（推奨。以下の注記を参照）          |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
新しいマルチテナントボットの作成は、2025-07-31以降非推奨になりました。新しいボットには **Single Tenant** を使用してください。
</Warning>

3. **Review + create**、続いて **Create** をクリックします（約1〜2分）。

### ステップ2: 認証情報を取得する

1. Azure Botリソース → **Configuration** → **Microsoft App ID**（`appId`）をコピーします。
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → **Value**（`appPassword`）をコピーします。
3. **Overview** → **Directory (tenant) ID**（`tenantId`）をコピーします。

### ステップ3: メッセージングエンドポイントを構成する

1. Azure Bot → **Configuration**。
2. **Messaging endpoint** を設定します。
   - 本番環境: `https://your-domain.com/api/messages`
   - ローカル開発: トンネルを使用します（[ローカル開発](#local-development-tunneling)を参照）

### ステップ4: Teamsチャネルを有効にする

1. Azure Bot → **Channels**。
2. **Microsoft Teams** → Configure → Saveの順にクリックします。
3. 利用規約に同意します。

### ステップ5: Teamsアプリマニフェストをビルドする

- `botId = <App ID>` を含む `bot` エントリを追加します。
- スコープ: `personal`、`team`、`groupChat`。
- `supportsFiles: true`（個人スコープでのファイル処理に必要）。
- RSC権限を追加します（[RSC権限](#current-teams-rsc-permissions-manifest)を参照）。
- アイコンを作成します: `outline.png`（32x32）と `color.png`（192x192）。
- `manifest.json`、`outline.png`、`color.png` をまとめてZip圧縮します。

### ステップ6: OpenClawを構成する

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

### ステップ7: Gatewayを実行する

Pluginが利用可能で、`msteams` の構成に認証情報が含まれている場合、Teamsチャネルは自動的に起動します。

</details>

## フェデレーション認証（証明書とマネージドID）

本番環境向けに、OpenClawは `channels.msteams.authType: "federated"` を介して、クライアントシークレットの代替となる **フェデレーション認証** をサポートしています。2つの方法があります。

### オプションA: 証明書ベースの認証

Entra IDアプリ登録に登録されたPEM証明書を使用します。

**セットアップ:**

1. 証明書（秘密鍵を含むPEM形式）を生成または取得します。
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → 公開証明書をアップロードします。

**構成:**

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

### オプションB: Azure Managed Identity

Azureインフラストラクチャ（AKS、App Service、Azure VM）上で、パスワードレス認証にAzure Managed Identityを使用します。

**仕組み:**

1. ボットのPod/VMには、マネージドID（システム割り当てまたはユーザー割り当て）があります。
2. フェデレーションID資格情報によって、マネージドIDがEntra IDアプリ登録にリンクされます。
3. 実行時に、OpenClawは `@azure/identity` を使用してAzure IMDSエンドポイントからトークンを取得します。
4. トークンは、ボット認証のためTeams SDKに渡されます。

**前提条件:**

- マネージド ID が有効な Azure インフラストラクチャ（AKS ワークロード ID、App Service、VM）。
- Entra ID アプリ登録に作成されたフェデレーション ID 資格情報。
- ポッド/VM から IMDS（`169.254.169.254:80`）へのネットワークアクセス。

**設定（システム割り当てマネージド ID）：**

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

**設定（ユーザー割り当てマネージド ID）：** 上記のブロックに `managedIdentityClientId: "<MI_CLIENT_ID>"` を追加します。

**環境変数：**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（ユーザー割り当ての場合のみ）

### AKS ワークロード ID のセットアップ

ワークロード ID を使用する AKS デプロイの場合：

1. AKS クラスターで**ワークロード ID を有効化**します。
2. Entra ID アプリ登録に**フェデレーション ID 資格情報を作成**します：

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. アプリのクライアント ID で**Kubernetes サービスアカウントに注釈を付けます**：

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. ワークロード ID を挿入するために**ポッドにラベルを付けます**：

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS（`169.254.169.254`）への**ネットワークアクセスを許可**します。NetworkPolicy を使用する場合は、ポート 80 の `169.254.169.254/32` に対するエグレスルールを追加します。

### 認証タイプの比較

| 方式                   | 設定                                           | 長所                                   | 短所                                         |
| ---------------------- | ---------------------------------------------- | -------------------------------------- | -------------------------------------------- |
| **クライアントシークレット** | `appPassword`                                  | セットアップが簡単                     | シークレットのローテーションが必要で、安全性が低い |
| **証明書**             | `authType: "federated"` + `certificatePath`    | ネットワーク上で共有シークレットを使用しない | 証明書管理のオーバーヘッド                   |
| **マネージド ID**      | `authType: "federated"` + `useManagedIdentity` | パスワード不要で、管理するシークレットがない | Azure インフラストラクチャが必要             |

`certificateThumbprint` は `certificatePath` と併用して設定できますが、現在の認証パスでは読み取られません。前方互換性のためだけに受け入れられます。

**デフォルト：** `authType` が未設定の場合、OpenClaw はクライアントシークレット認証（`appPassword`）を使用します。既存の設定は変更せずに引き続き動作します。

## ローカル開発（トンネリング）

Teams は `localhost` にアクセスできません。セッション間で URL が変わらないように、永続的な開発トンネルを使用します：

```bash
# 初回のみのセットアップ：
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 各開発セッション：
devtunnel host my-openclaw-bot
```

代替手段：`ngrok http 3978` または `tailscale funnel 3978`（URL はセッションごとに変わる場合があります）。

トンネル URL が変わった場合は、エンドポイントを更新します：

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## ボットのテスト

**診断を実行：**

```bash
teams app doctor <teamsAppId>
```

ボット登録、AAD アプリ、マニフェスト、SSO 設定を一度に確認します。

**テストメッセージを送信：**

1. Teams アプリをインストールします（`teams app get <id> --install-link` からインストールリンクを取得）。
2. Teams でボットを見つけ、DM を送信します。
3. 受信アクティビティについて Gateway ログを確認します。

## 環境変数

これらの認証関連の設定キーは、`openclaw.json` の代わりに環境変数で設定できます（`groupPolicy` や `historyLimit` など、その他の設定キーは設定ファイルでのみ指定できます）：

| 環境変数                             | 設定キー                  | 備考                                      |
| ------------------------------------ | ------------------------- | ----------------------------------------- |
| `MSTEAMS_APP_ID`                     | `appId`                   |                                           |
| `MSTEAMS_APP_PASSWORD`               | `appPassword`             |                                           |
| `MSTEAMS_TENANT_ID`                  | `tenantId`                |                                           |
| `MSTEAMS_AUTH_TYPE`                  | `authType`                | `"secret"` または `"federated"`         |
| `MSTEAMS_CERTIFICATE_PATH`           | `certificatePath`         | フェデレーション + 証明書                 |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`     | `certificateThumbprint`   | 受け入れられるが、認証には不要            |
| `MSTEAMS_USE_MANAGED_IDENTITY`       | `useManagedIdentity`      | フェデレーション + マネージド ID           |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | ユーザー割り当てマネージド ID の場合のみ |

## メンバー情報アクション

OpenClaw は Microsoft Teams 向けに Graph を使用する `member-info` アクションを公開しており、エージェントと自動化処理が、設定済みの会話について検証済みのメンバー一覧の詳細を解決できます。

要件：

- `ChannelSettings.Read.Group` および `TeamMember.Read.Group` の RSC 権限（推奨マニフェストに含まれています）。

このアクションは Graph 資格情報が設定されていれば常に利用でき、個別の `channels.msteams.actions.memberInfo` トグルはありません。
標準チャネルの検索では、一致するチームメンバー一覧の ID、表示名、メールアドレス、ロールが返されます。
現在の DM またはグループチャットでは、このアクションは信頼された送信者の安定したユーザー ID を返すことができます。
プライベート/共有チャネルおよび現在のものではないチャットのメンバー検索には、追加のメンバー一覧権限が必要であり、
デフォルトの権限ベースラインでは拒否されます。

## 履歴コンテキスト

- `channels.msteams.historyLimit` は、プロンプトに含める最近のチャネル/グループメッセージ数を制御します。`messages.groupChat.historyLimit` にフォールバックし、その後デフォルトの 50 になります。無効にするには `0` を設定します。
- 取得されたスレッド履歴は送信者許可リスト（`allowFrom` / `groupAllowFrom`）でフィルタリングされるため、スレッドコンテキストの初期設定には許可された送信者からのメッセージのみが含まれます。
- 引用された添付ファイルのコンテキスト（返信自体の添付ファイル内にある Skype Reply スキーマの HTML から解析）はフィルタリングされずに渡されます。現在、送信者許可リストのフィルターが適用されるのはスレッド履歴の初期設定のみです。
- DM 履歴は `channels.msteams.dmHistoryLimit`（ユーザーターン数）で制限できます。ユーザーごとのオーバーライド：`channels.msteams.dms["<user_id>"].historyLimit`。

## 現在の Teams RSC 権限（マニフェスト）

以下は Teams アプリのマニフェストにある**既存の resourceSpecific 権限**です。アプリがインストールされているチーム/チャット内でのみ適用されます。

**チャネル用（チームスコープ）：**

- `ChannelMessage.Read.Group`（Application）- @メンションなしですべてのチャネルメッセージを受信
- `ChannelMessage.Send.Group`（Application）
- `Member.Read.Group`（Application）
- `Owner.Read.Group`（Application）
- `ChannelSettings.Read.Group`（Application）
- `TeamMember.Read.Group`（Application）
- `TeamSettings.Read.Group`（Application）

**グループチャット用：**

- `ChatMessage.Read.Chat`（Application）- @メンションなしですべてのグループチャットメッセージを受信

Teams CLI を使用して RSC 権限を追加します：

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams マニフェストの例（秘匿化済み）

必須フィールドを含む最小限の有効な例です。ID と URL を置き換えてください。

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

### マニフェストの注意事項（必須フィールド）

- `bots[].botId` は Azure Bot App ID と**一致する必要があります**。
- `webApplicationInfo.id` は Azure Bot App ID と**一致する必要があります**。
- `bots[].scopes` には、使用する予定のサーフェス（`personal`、`team`、`groupChat`）を含める必要があります。
- パーソナルスコープでのファイル処理には `bots[].supportsFiles: true` が必要です。
- `authorization.permissions.resourceSpecific` には、チャネル通信のためのチャネル読み取り/送信権限を含める必要があります。

### 既存アプリの更新

```bash
# マニフェストをダウンロード、編集、再アップロード
teams app manifest download <teamsAppId> manifest.json
# manifest.json をローカルで編集...
teams app manifest upload manifest.json <teamsAppId>
# 内容が変更された場合、バージョンは自動的に上がります
```

更新後、各チームにアプリを再インストールし、キャッシュされたアプリメタデータを消去するために、**Teams を完全に終了して再起動します**（ウィンドウを閉じるだけでは不十分です）。

<details>
<summary>マニフェストの手動更新（CLI を使用しない場合）</summary>

1. `manifest.json` を新しい設定で更新します。
2. **`version` フィールドの値を増やします**（例：`1.0.0` → `1.1.0`）。
3. マニフェストとアイコン（`manifest.json`、`outline.png`、`color.png`）を**再度 zip 圧縮**します。
4. 新しい zip をアップロードします：
   - **Teams Admin Center:** Teams apps → Manage apps → find your app → Upload new version。
   - **Sideload:** Teams → Apps → Manage your apps → Upload a custom app。

</details>

## 機能：RSC のみと Graph の比較

### **Teams RSC のみ**の場合（アプリはインストール済み、Graph API 権限なし）

動作する機能：

- チャネルメッセージの**テキスト**コンテンツを読み取る。
- チャネルメッセージの**テキスト**コンテンツを送信する。
- **パーソナル（DM）**の添付ファイルを受信する。

動作しない機能：

- チャネル/グループの**画像またはファイルの内容**（ペイロードには HTML スタブのみが含まれます）。
- SharePoint/OneDrive に保存された添付ファイルのダウンロード。
- ライブ Webhook イベントを超えるメッセージ履歴の読み取り。

### **Teams RSC + Microsoft Graph Application 権限**の場合

追加される機能：

- ホストされたコンテンツ（メッセージに貼り付けられた画像）のダウンロード。
- SharePoint/OneDrive に保存された添付ファイルのダウンロード。
- Graph 経由でのチャネル/チャットメッセージ履歴の読み取り。

### RSC と Graph API の比較

| 機能                       | RSC 権限                 | Graph API                                  |
| ----------------------- | -------------------- | ----------------------------------- |
| **リアルタイムメッセージ**       | はい（Webhook 経由）        | いいえ（ポーリングのみ）                         |
| **過去のメッセージ**           | いいえ                  | はい（履歴を照会可能）                          |
| **セットアップの複雑さ**         | アプリマニフェストのみ          | 管理者の同意とトークンフローが必要                    |
| **オフラインでの動作**          | いいえ（実行中である必要あり）     | はい（いつでも照会可能）                         |

**結論：** RSC はリアルタイムの監視用であり、Graph API は履歴へのアクセス用です。オフライン中に見逃したメッセージを取得するには、`ChannelMessage.Read.All` を使用する Graph API が必要です（管理者の同意が必要）。

## Graph を利用したメディアと履歴

使用する Teams のスコープとデータに必要な Microsoft Graph のアプリケーション権限のみを有効にします。

1. Entra ID (Azure AD) **App Registration** → Graph の **Application permissions** を追加：
   - チャンネルの添付ファイルとチャンネル履歴には `ChannelMessage.Read.All`。
   - グループチャットの添付ファイルとグループチャット履歴には `Chat.Read.All`。
   - 添付ファイルのバイトデータを SharePoint/OneDrive ストレージからダウンロードする必要がある場合は `Files.Read.All`。履歴のみを使用する構成では不要です。
2. テナントに対して **Grant admin consent** を実行します。
3. Teams アプリの **マニフェストバージョン**を上げ、再アップロードして、**Teams にアプリを再インストール**します。
4. キャッシュされたアプリのメタデータを消去するため、**Teams を完全に終了して再起動**します。

### チャンネル／グループのファイル復旧（`graphMediaFallback`）

Teams は、ボットに送信する HTML アクティビティからファイルマーカーを削除することがあります。その場合、Bot Framework のアクティビティは通常の HTML メッセージと区別できず、完全な添付ファイル参照は Graph 側のメッセージにのみ存在します。

上記の権限を付与した後、フォールバックを有効にします。

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

これはチャンネルとグループチャットにのみ適用されます。通常のメッセージやメンションのみのメッセージを含め、HTML アクティビティから直接ダウンロード可能なメディアが得られなかった場合、その都度 Graph メッセージの検索が 1 回追加されます。既存のインストール環境で Graph トラフィックや権限エラーが自動的に増えないよう、デフォルトは `false` です。

**ユーザーへのメンション：** すでに会話に参加しているユーザーへの @メンションは、そのまま使用できます。**現在の会話に参加していない**ユーザーを動的に検索してメンションするには、`User.Read.All`（Application）権限を追加し、管理者の同意を付与します。

## 既知の制限事項

### Webhook のタイムアウト

Teams は HTTP Webhook 経由でメッセージを配信します。OpenClaw はこの Webhook リスナーに固定の HTTP サーバータイムアウトを適用します。無通信 30 秒、リクエスト全体 30 秒、ヘッダー受信まで 15 秒です。オプションの受信メディアとコンテキスト拡充には合計 10 秒の予算がありますが、Teams SDK は Webhook の応答を返す前にエージェントのターンが完了するまで待機します。ターン全体が Teams の再試行時間枠を超えると、次の現象が発生することがあります。

- Teams がメッセージを再試行する（重複が発生する）。
- 返信が破棄される。

エージェントが応答すると返信はプロアクティブに送信されますが、エージェントの実行が遅い場合、Teams 側で再試行や重複が発生することがあります。

### Teams クラウドとサービス URL のサポート

この SDK ベースの Teams 経路は、Microsoft Teams パブリッククラウドでライブ検証されています。

受信返信では、着信した Teams SDK のターンコンテキストを使用します。コンテキスト外のプロアクティブ操作（送信、編集、削除、カード、投票、ファイル同意メッセージ、キューに入った長時間実行の返信）では、保存された会話参照 `serviceUrl` を使用します。パブリッククラウドはデフォルトで Teams SDK のパブリッククラウド環境を使用し、パブリック Teams Connector ホスト上の保存済み参照を許可します：`https://smba.trafficmanager.net/`。

パブリッククラウドがデフォルトです。通常のパブリッククラウドボットでは、`channels.msteams.cloud` または `channels.msteams.serviceUrl` を設定する必要はありません。

パブリック以外の Teams クラウドでは、`cloud` と、Microsoft が公開している場合は対応するプロアクティブ境界を設定します。

- `channels.msteams.cloud` は、認証、JWT 検証、トークンサービス、Graph スコープに使用する Teams SDK クラウドプリセットを選択します。
- `channels.msteams.serviceUrl` は、プロアクティブな送信、編集、削除、カード、投票、ファイル同意メッセージ、キューに入った長時間実行の返信の前に、保存済み会話参照を検証するために使用する Bot Connector エンドポイント境界を選択します。USGov および DoD SDK クラウドでは必須です。China/21Vianet では、OpenClaw は SDK の `China` プリセットを使用し、Azure China Bot Framework チャンネルホスト上の保存済みまたは設定済みサービス URL のみを受け入れます。

Microsoft は、Teams のプロアクティブメッセージングドキュメントの[会話を作成する](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation)セクションで、グローバルなプロアクティブ Bot Connector エンドポイントを公開しています。利用可能な場合は着信アクティビティの `serviceUrl` を使用し、それ以外の場合は以下の Microsoft の表を使用します。

| Teams 環境          | OpenClaw の設定                                             | プロアクティブ `serviceUrl`                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| パブリック            | クラウド／serviceUrl の設定は不要                           | `https://smba.trafficmanager.net/teams`            |
| GCC               | `serviceUrl` を設定。個別の Teams SDK クラウドプリセットは存在しない | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | 着信アクティビティの `serviceUrl` を使用           |

Microsoft が個別のプロアクティブサービス URL を文書化している一方で、Teams SDK には個別の GCC クラウドプリセットがない GCC の例：

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

GCC High の例：

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

`channels.msteams.serviceUrl` は、サポート対象の Microsoft Teams Bot Connector ホストに制限されています。サービス URL が設定されている場合、OpenClaw は、プロアクティブな送信、編集、削除、カード、投票、またはキューに入った長時間実行の返信を実行する前に、保存済み会話の `serviceUrl` が同じホストを使用していることを確認します。デフォルトのパブリッククラウド設定では、保存済み会話がパブリック Teams Connector ホストの外部を指している場合、OpenClaw は安全側に倒して処理を拒否します。保存済み会話参照を最新の状態にするため、クラウド／サービス URL の設定変更後に、その会話から新しいメッセージを受信してください。

Microsoft の Teams プロアクティブエンドポイント表には、China/21Vianet 用の個別のグローバルなプロアクティブ `smba` URL はありません。Teams SDK が Azure China の認証、トークン、JWT エンドポイントを使用するように、`cloud: "China"` を設定します。その後のプロアクティブ送信には、着信した China Teams アクティビティから保存された会話参照、または Azure China Bot Framework チャンネル境界（`*.botframework.azure.cn`）上で明示的に設定されたサービス URL が必要です。OpenClaw が Graph リクエストを Azure China Graph エンドポイント経由でルーティングするまでは、`cloud: "China"` で Graph ベースの Teams ヘルパーは無効になります。

### 書式設定

Teams の Markdown は Slack や Discord よりも制限されています。

- 基本的な書式設定（**太字**、_斜体_、`code`、リンク）は機能します。
- 複雑な Markdown（表、ネストされたリスト）は正しく表示されない場合があります。
- 投票およびセマンティックプレゼンテーションの送信では Adaptive Cards がサポートされています（後述）。

## 設定

主要な設定（チャンネル共通のパターンについては [/gateway/configuration](/ja-JP/gateway/configuration) を参照）：

- `channels.msteams.enabled`: チャネルを有効化/無効化します。
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: ボットの認証情報。
- `channels.msteams.cloud`: Teams SDK のクラウド環境（`Public`、`USGov`、`USGovDoD`、または `China`。デフォルトは `Public`）。USGov/DoD SDK クラウドでは `serviceUrl` で設定します。中国では SDK プリセットと保存済みの Azure China Bot Framework 会話参照を使用し、Azure China Graph のルーティングが提供されるまでは Graph ベースのヘルパーが無効になります。
- `channels.msteams.serviceUrl`: SDK のプロアクティブ操作に使用する Bot Connector サービス URL の境界。パブリッククラウドでは SDK のデフォルトを使用します。GCC（`https://smba.infra.gcc.teams.microsoft.com/teams`）、GCC High、または DoD では設定してください。保存済みの会話参照が 21Vianet 運営の Teams から取得されたものである場合、中国では Azure China Bot Framework のチャネルホストを使用できます。
- `channels.msteams.webhook.port`（デフォルトは `3978`）。
- `channels.msteams.webhook.path`（デフォルトは `/api/messages`）。
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルトは `pairing`）。
- `channels.msteams.allowFrom`: DM の許可リスト（AAD オブジェクト ID を推奨）。Graph にアクセスできる場合、ウィザードはセットアップ中に名前を ID に解決します。
- `channels.msteams.dangerouslyAllowNameMatching`: 変更可能な UPN/表示名の照合と、チーム名/チャネル名による直接ルーティングを再度有効にする緊急用トグル。
- `channels.msteams.textChunkLimit`: 送信テキストのチャンクサイズ（文字数。デフォルトは `4000`。より大きい値を設定しても、上限は常に `4000`）。
- `channels.msteams.streaming.chunkMode`: 長さによるチャンク分割の前に、`length`（デフォルト）または `newline` で空行（段落の境界）を基準に分割します。
- `channels.msteams.mediaAllowHosts`: 受信添付ファイルのホスト許可リスト（デフォルトは Microsoft/Teams ドメイン：Graph、SharePoint/OneDrive、Teams CDN、Bot Framework、Azure Media Services）。
- `channels.msteams.mediaAuthAllowHosts`: メディアの再試行時に Authorization ヘッダーを付加するホストの許可リスト（デフォルトは Graph および Bot Framework ホスト）。
- `channels.msteams.graphMediaFallback`: チャネル/グループの HTML にファイルマーカーがない場合に、Graph のメッセージ検索を有効にします（デフォルトは `false`。[チャネル/グループのファイル復旧](#channelgroup-file-recovery-graphmediafallback)を参照）。
- `channels.msteams.mediaMaxMb`: チャネルごとのメディアサイズ上限の上書き値（MB）。未設定の場合は `agents.defaults.mediaMaxMb` にフォールバックします。
- `channels.msteams.requireMention`: チャネル/グループで @メンションを必須にします（デフォルトは `true`）。
- `channels.msteams.replyStyle`: `thread | top-level`（[返信形式](#reply-style-threads-vs-posts)を参照）。
- `channels.msteams.teams.<teamId>.replyStyle`: チームごとの上書き。
- `channels.msteams.teams.<teamId>.requireMention`: チームごとの上書き。
- `channels.msteams.teams.<teamId>.tools`: チャネルの上書きがない場合に使用される、チームごとのデフォルトツールポリシー上書き（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.toolsBySender`: チームごと、送信者ごとのデフォルトツールポリシー上書き（ワイルドカード `"*"` をサポート）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: チャネルごとの上書き。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: チャネルごとの上書き。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: チャネルごとのツールポリシー上書き（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: チャネルごと、送信者ごとのツールポリシー上書き（ワイルドカード `"*"` をサポート）。
- `toolsBySender` のキーには明示的なプレフィックスを使用してください：`channel:`、`id:`、`e164:`、`username:`、`name:`（プレフィックスのない従来のキーは、引き続き `id:` のみにマッピングされます）。
- `channels.msteams.authType`: 認証タイプ — `"secret"`（デフォルト）または `"federated"`。
- `channels.msteams.certificatePath`: PEM 証明書ファイルへのパス（フェデレーション + 証明書認証）。
- `channels.msteams.certificateThumbprint`: 証明書の拇印。指定できますが、認証には必須ではありません。
- `channels.msteams.useManagedIdentity`: マネージド ID 認証を有効にします（フェデレーションモード）。
- `channels.msteams.managedIdentityClientId`: ユーザー割り当てマネージド ID のクライアント ID。
- `channels.msteams.sharePointSiteId`: グループチャット/チャネルでのファイルアップロードに使用する SharePoint サイト ID（[グループチャットでのファイル送信](#sending-files-in-group-chats)を参照）。
- `channels.msteams.welcomeCard`、`channels.msteams.groupWelcomeCard`、`channels.msteams.promptStarters`: 最初の DM/グループ連絡時に表示されるウェルカム Adaptive Card と、その推奨プロンプトボタン。
- `channels.msteams.responsePrefix`: 送信する返信の先頭に付加するテキスト。
- `channels.msteams.feedbackEnabled`（デフォルトは `true`）、`channels.msteams.feedbackReflection`（デフォルトは `true`）、`channels.msteams.feedbackReflectionCooldownMs`: 返信に対する高評価/低評価のフィードバックと、否定的なフィードバック後の振り返りフォローアップ。
- `channels.msteams.sso`、`channels.msteams.delegatedAuth`: SSO ベースのフローに使用する Bot Framework OAuth 接続と委任された Graph スコープ。`sso.enabled: true` には `sso.connectionName` が必要です。

## ルーティングとセッション

- セッションキーは標準のエージェント形式に従います（[/concepts/session](/ja-JP/concepts/session)を参照）。
  - ダイレクトメッセージはメインセッション（`agent:<agentId>:<mainKey>`）を共有します。
  - チャネル/グループメッセージでは会話 ID を使用します：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 返信形式：スレッドと投稿

Teams には、同じ基礎データモデル上に 2 種類のチャネル UI 形式があります：

| 形式                     | 説明                                                      | 推奨される `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts**（クラシック）  | メッセージがカードとして表示され、その下にスレッド形式の返信が表示されます | `thread`（デフォルト） |
| **Threads**（Slack 風）  | メッセージが Slack のように直線的に流れます               | `top-level`       |

**問題：** Teams API では、チャネルがどちらの UI 形式を使用しているか公開されません。誤った `replyStyle` を使用すると：

- Threads 形式のチャネルで `thread` を使用 → 返信が不自然にネストして表示されます。
- Posts 形式のチャネルで `top-level` を使用 → 返信がスレッド内ではなく、独立した最上位の投稿として表示されます。

**解決策：** チャネルの設定方法に応じて、チャネルごとに `replyStyle` を設定します：

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

ボットがチャネルに返信を送信するとき、`replyStyle` は最も具体的な上書きからデフォルトへ向かって解決されます。最初の `undefined` ではない値が採用されます：

1. **チャネルごと** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **チームごと** — `channels.msteams.teams.<teamId>.replyStyle`
3. **グローバル** — `channels.msteams.replyStyle`
4. **暗黙のデフォルト** — `requireMention` から導出：
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

明示的な `replyStyle` を指定せずに `requireMention: false` をグローバルに設定すると、受信メッセージがスレッド返信であっても、Posts 形式のチャネルでメンションが最上位の投稿として表示されます。予期しない動作を避けるには、グローバル、チーム、またはチャネルのレベルで `replyStyle: "thread"` を固定してください。

保存されたチャネル会話へのプロアクティブ送信（キューに入れられたツール呼び出しの返信、長時間実行エージェント）にも、同じチーム/チャネル解決が適用されます。グループチャットと個人（DM）の会話では、`replyStyle` に関係なく、プロアクティブ送信時は常に `top-level` に解決されます。

### スレッドコンテキストの保持

`replyStyle: "thread"` が有効で、ボットがチャネルスレッド内から @メンションされた場合、OpenClaw は元のスレッドルートを送信先の会話参照（`19:...@thread.tacv2;messageid=<root>`）に再付加し、返信が同じスレッド内に届くようにします。これは、ライブ（ターン内）送信と、Bot Framework のターンコンテキスト失効後に行われるプロアクティブ送信（例：長時間実行エージェント、`mcp__openclaw__message` を介したキュー内のツール呼び出し返信）の両方に適用されます。

スレッドルートは、会話参照に保存された `threadId` から取得されます。`threadId` より前の古い保存済み参照は `activityId`（会話のシードとなった最後の受信アクティビティ）にフォールバックするため、既存のデプロイは再シードなしで引き続き動作します。

`replyStyle: "top-level"` が有効な場合、チャネルスレッドへの受信メッセージには、意図的に新しい最上位の投稿として応答し、スレッドのサフィックスは付加されません。これは Threads 形式のチャネルでは正しい動作です。スレッド形式の返信を期待していた場所に最上位の投稿が表示される場合、そのチャネルの `replyStyle` が誤って設定されています。

## 添付ファイルと画像

**現在の制限事項：**

- **DM：** 画像とファイル添付は Teams ボットのファイル API を介して動作します。
- **チャネル/グループ：** 添付ファイルは M365 ストレージ（SharePoint/OneDrive）に保存されます。Webhook ペイロードに含まれるのは HTML スタブのみで、実際のファイルバイトではありません。チャネル添付ファイルをダウンロードするには、**Graph API の権限が必要です**。
- 明示的にファイルを先に送信する場合は、`media` / `filePath` / `path` とともに `action=upload-file` を使用します。任意の `message` は付随するテキスト/コメントとなり、`filename`（または `title`）でアップロード名を上書きします。

Graph の権限がない場合、画像を含むチャネルメッセージはテキストのみとして届きます（ボットは画像コンテンツにアクセスできません）。
デフォルトでは、OpenClaw は Microsoft/Teams のホスト名からのみメディアをダウンロードします。`channels.msteams.mediaAllowHosts` で上書きできます（すべてのホストを許可するには `["*"]` を使用します）。
Authorization ヘッダーは、`channels.msteams.mediaAuthAllowHosts` に含まれるホストにのみ付加されます（デフォルトは Graph および Bot Framework ホスト）。このリストは厳密に保ってください（マルチテナントのサフィックスは避けてください）。

## グループチャットでのファイル送信

ボットは組み込みの FileConsentCard フローを使用して DM でファイルを送信できます。**グループチャット/チャネルでのファイル送信**には追加のセットアップが必要です：

| コンテキスト           | ファイルの送信方法                             | 必要なセットアップ                              |
| ---------------------- | ---------------------------------------------- | ----------------------------------------------- |
| **DM**                 | FileConsentCard → ユーザーが承認 → ボットがアップロード | そのまま動作します                       |
| **グループチャット/チャネル** | SharePoint にアップロード → ネイティブファイルカード | `sharePointSiteId` + Graph の権限が必要 |
| **画像（すべてのコンテキスト）** | Base64 エンコードのインライン形式             | そのまま動作します                              |

### グループチャットに SharePoint が必要な理由

ボットはアプリケーション ID を使用しますが、Microsoft Graph の `/me` リソースは[サインイン済みユーザーを必要とします](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0)。グループチャット/チャネルでファイルを送信するため、ボットは **SharePoint サイト**にアップロードし、共有リンクを作成します。

### セットアップ

1. Entra ID (Azure AD) → App Registration で **Graph API の権限を追加**します：
   - `Sites.ReadWrite.All`（Application）— SharePoint にファイルをアップロードします。
   - `ChatMember.Read.All`（Application）— グループチャットでのファイル送信に使用する、テナント全体で最小権限のアクセス許可。`Chat.Read.All` も使用でき、グループチャット履歴が有効な場合はすでにこの操作をカバーしています。チャットごとの代替手段として、`ChatMember.Read.Chat` の[リソース固有の同意権限](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)を使用します。
2. テナントに対して **Grant admin consent** を実行します。
3. **SharePoint サイト ID を取得します：**

   ```bash
   # Graph Explorer または有効なトークンを使用した curl 経由:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 例: "contoso.sharepoint.com/sites/BotFiles" にあるサイトの場合
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # レスポンスには次が含まれます: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw を設定する:**

   ```json5
   {
     channels: {
       msteams: {
         // ... その他の設定 ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### 共有の動作

| コンテキストと権限                                                  | 共有の動作                                          |
| ----------------------------------------------------------------------- | --------------------------------------------------------- |
| チャネル + `Sites.ReadWrite.All`                                         | 組織全体の共有リンク（組織内の全員がアクセス可能） |
| グループチャット + `Sites.ReadWrite.All` + サポートされているチャットメンバー読み取り許可 | ユーザーごとの共有リンク（チャットメンバーのみアクセス可能）      |
| サポートされているチャットメンバー読み取り許可がないグループチャット                   | 送信をフェイルクローズする                                         |

ユーザーごとの共有ではチャット参加者のみがファイルにアクセスできるため、より安全です。OpenClaw ではグループチャットのメンバー検索が正常に完了する必要があります。タイムアウト、トランスポート障害、空の結果、Graph API による拒否が発生した場合、アクセス範囲を組織全体へ拡大するのではなく、送信を失敗させます。

### フォールバック動作

| シナリオ                                                         | 結果                                           |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| グループチャット + ファイル + SharePoint とメンバー権限を設定済み | SharePoint にアップロードし、ネイティブファイルカードを送信    |
| グループチャット + ファイル + SharePoint またはメンバー権限が不足     | 対処可能な設定エラーで失敗      |
| チャネル + ファイル + `sharePointSiteId` を設定済み                   | SharePoint にアップロードし、ネイティブファイルカードを送信    |
| 個人チャット + ファイル                                             | FileConsentCard フロー（SharePoint なしで動作）  |
| 任意のコンテキスト + 画像                                              | Base64 エンコードによるインライン送信（SharePoint なしで動作） |

### ファイルの保存場所

アップロードされたファイルは、設定された SharePoint サイトの既定のドキュメントライブラリ内にある `/OpenClawShared/` フォルダーに保存されます。

## 投票（Adaptive Cards）

OpenClaw は Teams の投票を Adaptive Cards として送信します（Teams にネイティブの投票 API はありません）。

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`。
- 投票は Gateway によって、`state/openclaw.sqlite` 配下の OpenClaw Plugin 状態 SQLite に記録されます。
- 既存の `msteams-polls.json` ファイルは、実行中の Plugin ではなく `openclaw doctor --fix` によってインポートされます。
- 投票を記録するには、Gateway がオンラインであり続ける必要があります。
- 投票結果の概要は自動投稿されず、投票結果用の CLI もまだありません。

## プレゼンテーションカード

`message` ツール、CLI、または通常の返信配信を使用して、セマンティックなプレゼンテーションペイロードを Teams のユーザーまたは会話に送信します。OpenClaw は、汎用プレゼンテーションコントラクトから Teams Adaptive Cards としてレンダリングします。

`presentation` パラメーターはセマンティックブロックを受け付けます。`presentation` が指定されている場合、メッセージテキストは省略できます。ボタンは Adaptive Card の送信アクションまたは URL アクションとしてレンダリングされます。Teams のレンダラーでは選択メニューがネイティブ対応されていないため、OpenClaw は配信前に読みやすいテキストへダウングレードします。

**エージェントツール:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "こんにちは",
    blocks: [{ type: "text", text: "こんにちは！" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"こんにちは","blocks":[{"type":"text","text":"こんにちは！"}]}'
```

ターゲット形式の詳細については、後述の[ターゲット形式](#target-formats)を参照してください。

## ターゲット形式

MSTeams のターゲットでは、ユーザーと会話を区別するためにプレフィックスを使用します。

| ターゲットの種類         | 形式                           | 例                                                                                                |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| ユーザー（ID 指定）        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                            |
| ユーザー（名前指定）      | `user:<display-name>`            | `user:John Smith`（Graph API が必要）                                                                 |
| グループ／チャネル       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`                                                               |
| グループ／チャネル（未加工） | `<conversation-id>`              | `19:abc123...@thread.tacv2`、`19:...@unq.gbl.spaces`、またはプレフィックスなしの `a:`/`8:orgid:`/`29:` Bot Framework ID |

**CLI の例:**

```bash
# ID を指定してユーザーに送信
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "こんにちは"

# 表示名を指定してユーザーに送信（Graph API 検索を実行）
openclaw message send --channel msteams --target "user:John Smith" --message "こんにちは"

# グループチャットまたはチャネルに送信
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "こんにちは"

# 会話にプレゼンテーションカードを送信
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"こんにちは","blocks":[{"type":"text","text":"こんにちは"}]}'
```

**エージェントツールの例:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "こんにちは！",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "こんにちは",
    blocks: [{ type: "text", text: "こんにちは" }],
  },
}
```

<Note>
`user:` プレフィックスがない場合、名前は既定でグループまたはチームとして解決されます。表示名で人物を指定する場合は、常に `user:` を使用してください。
</Note>

## プロアクティブメッセージング

- OpenClaw はその時点で会話参照を保存するため、プロアクティブメッセージはユーザーが操作した**後**にのみ送信できます。
- `dmPolicy` と許可リストによる制御については、[/gateway/configuration](/ja-JP/gateway/configuration)を参照してください。

## チーム ID とチャネル ID（よくある落とし穴）

Teams URL の `groupId` クエリパラメーターは、設定に使用するチーム ID では**ありません**。代わりに URL パスから ID を抽出してください。

**チーム URL:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    チーム会話 ID（URL デコードしてください）
```

**チャネル URL:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      チャネル ID（URL デコードしてください）
```

**設定では:**

- チームキー = `/team/` の後にあるパスセグメント（URL デコード済み。例: `19:Bk4j...@thread.tacv2`。古いテナントでは `@thread.skype` と表示される場合がありますが、これも有効です）。
- チャネルキー = `/channel/` の後にあるパスセグメント（URL デコード済み）。
- OpenClaw のルーティングでは、`groupId` クエリパラメーターを**無視**してください。これは Microsoft Entra のグループ ID であり、受信した Teams アクティビティで使用される Bot Framework の会話 ID ではありません。

## プライベートチャネル

プライベートチャネルでのボットのサポートには制限があります。

| 機能                      | 標準チャネル | プライベートチャネル       |
| ---------------------------- | ----------------- | ---------------------- |
| ボットのインストール             | 対応               | 制限あり                |
| リアルタイムメッセージ（Webhook） | 対応               | 動作しない場合がある           |
| RSC 権限              | 対応               | 動作が異なる場合がある |
| @メンション                    | 対応               | ボットにアクセスできる場合   |
| Graph API 履歴            | 対応               | 対応（権限が必要） |

**プライベートチャネルが動作しない場合の回避策:**

1. ボットとの対話には標準チャネルを使用します。
2. DM を使用します。ユーザーはいつでもボットへ直接メッセージを送信できます。
3. 履歴へのアクセスには Graph API を使用します（`ChannelMessage.Read.All` が必要）。

## トラブルシューティング

### よくある問題

- **チャネルに画像が表示されない:** Graph 権限または管理者の同意が不足しています。Teams アプリを再インストールし、Teams を完全に終了してから再度開いてください。
- **チャネルで応答がない:** 既定ではメンションが必要です。`channels.msteams.requireMention=false` を設定するか、チーム／チャネルごとに設定してください。
- **バージョンの不一致（Teams に古いマニフェストが引き続き表示される）:** アプリを削除して再追加し、Teams を完全に終了して更新してください。
- **Webhook から 401 Unauthorized が返される:** Azure JWT を使用せず手動テストした場合は想定される動作です。エンドポイントには到達できていますが、認証に失敗したことを示します。正しくテストするには Azure Web Chat を使用してください。

### マニフェストのアップロードエラー

- **"Icon file cannot be empty":** マニフェストが参照しているアイコンファイルのサイズが 0 バイトです。有効な PNG アイコン（`outline.png` は 32x32、`color.png` は 192x192）を作成してください。
- **"webApplicationInfo.Id already in use":** アプリが別のチーム／チャットにまだインストールされています。まず該当するアプリを見つけてアンインストールするか、反映されるまで 5-10 分待ってください。
- **アップロード時の "Something went wrong":** 代わりに [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) からアップロードし、ブラウザーの DevTools（F12）→ Network タブを開いて、実際のエラーが記載されたレスポンス本文を確認してください。
- **サイドロードに失敗する:** "Upload a custom app" ではなく "Upload an app to your org's app catalog" を試してください。多くの場合、これによりサイドロード制限を回避できます。

### RSC 権限が機能しない

1. `webApplicationInfo.id` がボットの App ID と完全に一致していることを確認してください。
2. アプリを再アップロードし、チーム／チャットに再インストールしてください。
3. 組織の管理者が RSC 権限をブロックしていないか確認してください。
4. 正しいスコープを使用していることを確認してください。チームには `ChannelMessage.Read.Group`、グループチャットには `ChatMessage.Read.Chat` を使用します。

## 参考資料

- [Azure Bot を作成する](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot のセットアップガイド
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams アプリの作成と管理
- [Teams アプリのマニフェストスキーマ](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC を使用してチャネルメッセージを受信する](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 権限リファレンス](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams ボットのファイル処理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（チャネル／グループでは Graph が必要）
- [プロアクティブメッセージング](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - ボット管理用 Teams CLI

## 関連項目

- [チャンネル概要](/ja-JP/channels) - サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションによる制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化
