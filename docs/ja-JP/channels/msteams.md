---
read_when:
    - Microsoft Teams チャネル機能に取り組む
summary: Microsoft Teams ボットのサポート状況、機能、構成
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-05T11:04:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 00ce5e18ce45700233e62fff3d9dc8f013a0eacd103d9ca6f2c6256643121ca7
    source_path: channels/msteams.md
    workflow: 16
---

Status: テキスト + DM 添付ファイルはサポートされています。チャネル/グループでのファイル送信には `sharePointSiteId` + Graph 権限が必要です（[グループチャットでのファイル送信](#sending-files-in-group-chats)を参照）。投票は Adaptive Cards 経由で送信されます。メッセージアクションは、ファイル優先送信用に明示的な `upload-file` を公開します。

## バンドル済み Plugin

Microsoft Teams は現在の OpenClaw リリースではバンドル済み Plugin として提供されます。通常のパッケージビルドでは別途インストールは不要です。

古いビルド、またはバンドル済み Teams を除外したカスタムインストールでは、npm パッケージを直接インストールします。

```bash
openclaw plugins install @openclaw/msteams
```

現在の公式リリースタグに追従するには、素のパッケージを使用します。再現可能なインストールが必要な場合にのみ、正確なバージョンを固定してください。

ローカルチェックアウト（git リポジトリから実行する場合）:

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) は、ボット登録、マニフェスト作成、認証情報生成を 1 つのコマンドで処理します。

**1. インストールしてログインする**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI は現在プレビュー版です。コマンドとフラグはリリース間で変更される可能性があります。
</Note>

**2. トンネルを開始する**（Teams は localhost に到達できません）

必要に応じて devtunnel CLI をインストールして認証します（[はじめにガイド](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
Teams は devtunnels で認証できないため、`--allow-anonymous` が必要です。受信する各ボットリクエストは引き続き Teams SDK によって検証されます。
</Note>

代替手段: `ngrok http 3978` または `tailscale funnel 3978`（URL はセッションごとに変わる場合があります）。

**3. アプリを作成する**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

これにより、Entra ID（Azure AD）アプリケーションが作成され、クライアントシークレットが生成され、Teams アプリマニフェスト（アイコン付き）がビルドおよびアップロードされ、Teams 管理のボットが登録されます（Azure サブスクリプションは不要）。出力には `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID`、および **Teams App ID** が含まれます。また、Teams にアプリを直接インストールすることも提案されます。

**4. OpenClaw を構成する** 出力の認証情報を使用します。

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

`teams app create` はアプリをインストールするよう促します。「Install in Teams」を選択します。後でインストールリンクを取得するには:

```bash
teams app get <teamsAppId> --install-link
```

**6. すべてが動作することを確認する**

```bash
teams app doctor <teamsAppId>
```

ボット登録、AAD アプリ構成、マニフェストの妥当性、SSO セットアップにわたって診断を実行します。

本番環境では、クライアントシークレットの代わりに [フェデレーション認証](#federated-authentication-certificate-plus-managed-identity)（証明書またはマネージド ID）を検討してください。

<Note>
グループチャットはデフォルトでブロックされています（`channels.msteams.groupPolicy: "allowlist"`）。グループ返信を許可するには `channels.msteams.groupAllowFrom` を設定するか、任意のメンバーを許可する（メンション必須の）`groupPolicy: "open"` を使用します。
</Note>

## 目標

- Teams DM、グループチャット、またはチャネル経由で OpenClaw と会話する。
- ルーティングを決定的に保つ: 返信は常に到着したチャネルに戻ります。
- 安全なチャネル動作をデフォルトにする（別途構成されていない限りメンション必須）。

## 構成の書き込み

デフォルトでは、Microsoft Teams は `/config set|unset` によってトリガーされる構成更新を書き込めます（`commands.config: true` が必要）。

無効化するには:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## アクセス制御（DM + グループ）

**DM アクセス**

- デフォルト: `channels.msteams.dmPolicy = "pairing"`。未知の送信者は承認されるまで無視されます。
- `channels.msteams.allowFrom` には、安定した AAD オブジェクト ID または `accessGroup:core-team` のような静的送信者アクセスグループを使用してください。
- allowlist には UPN/表示名の一致に依存しないでください。それらは変更される可能性があります。OpenClaw はデフォルトで直接の名前一致を無効にしています。`channels.msteams.dangerouslyAllowNameMatching: true` でオプトインします。
- ウィザードは、認証情報で許可されている場合に Microsoft Graph 経由で名前を ID に解決できます。

**グループアクセス**

- デフォルト: `channels.msteams.groupPolicy = "allowlist"`（`groupAllowFrom` を追加しない限りブロック）。`channels.msteams.groupPolicy` が未設定の場合、`channels.defaults.groupPolicy` は共有デフォルトを上書きできます。
- `channels.msteams.groupAllowFrom` は、グループチャット/チャネルでトリガーできる送信者または静的送信者アクセスグループを制御します（`channels.msteams.allowFrom` にフォールバックします）。
- 任意のメンバーを許可するには `groupPolicy: "open"` を設定します（デフォルトでは引き続きメンション必須）。
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

**チーム + チャネル allowlist**

- `channels.msteams.teams` 配下にチームとチャネルを列挙して、グループ/チャネル返信のスコープを制限します。
- キーには、変更可能な表示名ではなく、Teams リンクの安定した Teams 会話 ID を使用してください（[チームとチャネル ID](#team-and-channel-ids-common-gotcha)を参照）。
- `groupPolicy="allowlist"` で teams allowlist が存在する場合、列挙されたチーム/チャネルのみが受け入れられます（メンション必須）。
- 構成ウィザードは `Team/Channel` エントリを受け取り、保存します。
- 起動時に、OpenClaw は（Graph 権限で許可されている場合）チーム/チャネルおよびユーザー allowlist 名を ID に解決し、マッピングをログに記録します。未解決の名前は入力されたまま保持されますが、`channels.msteams.dangerouslyAllowNameMatching: true` が設定されていない限りルーティングでは無視されます。

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

### 仕組み

1. Microsoft Teams Plugin が利用可能であることを確認します（現在のリリースではバンドル済み）。
2. **Azure Bot**（App ID + シークレット + テナント ID）を作成します。
3. ボットを参照する **Teams アプリパッケージ** を、以下の RSC 権限を含めてビルドします。
4. Teams アプリをチーム（または DM 用の個人スコープ）にアップロード/インストールします。
5. `~/.openclaw/openclaw.json`（または環境変数）で `msteams` を構成し、Gateway を起動します。
6. Gateway はデフォルトで `/api/messages` 上の Bot Framework Webhook トラフィックを待ち受けます。

### ステップ 1: Azure Bot を作成する

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) に移動します。
2. **Basics** タブに入力します。

   | フィールド | 値 |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle** | ボット名。例: `openclaw-msteams`（一意である必要があります） |
   | **Subscription** | Azure サブスクリプションを選択 |
   | **Resource group** | 新規作成または既存のものを使用 |
   | **Pricing tier** | 開発/テスト用は **Free** |
   | **Type of App** | **Single Tenant**（推奨。下記の注記を参照） |
   | **Creation type** | **Create new Microsoft App ID** |

<Warning>
新しいマルチテナントボットの作成は 2025-07-31 以降非推奨になりました。新しいボットには **Single Tenant** を使用してください。
</Warning>

3. **Review + create** をクリックし、次に **Create** をクリックします（約 1-2 分）。

### ステップ 2: 認証情報を取得する

1. Azure Bot リソース → **Configuration** → **Microsoft App ID**（`appId`）をコピーします。
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → **Value**（`appPassword`）をコピーします。
3. **Overview** → **Directory (tenant) ID**（`tenantId`）をコピーします。

### ステップ 3: メッセージングエンドポイントを構成する

1. Azure Bot → **Configuration**。
2. **Messaging endpoint** を設定します。
   - 本番: `https://your-domain.com/api/messages`
   - ローカル開発: トンネルを使用します（[ローカル開発](#local-development-tunneling)を参照）

### ステップ 4: Teams チャネルを有効化する

1. Azure Bot → **Channels**。
2. **Microsoft Teams** → Configure → Save をクリックします。
3. 利用規約に同意します。

### ステップ 5: Teams アプリマニフェストをビルドする

- `botId = <App ID>` の `bot` エントリを含めます。
- スコープ: `personal`、`team`、`groupChat`。
- `supportsFiles: true`（個人スコープのファイル処理に必要）。
- RSC 権限を追加します（[RSC 権限](#current-teams-rsc-permissions-manifest)を参照）。
- アイコンを作成します: `outline.png`（32x32）と `color.png`（192x192）。
- `manifest.json`、`outline.png`、`color.png` をまとめて Zip 化します。

### ステップ 6: OpenClaw を構成する

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

### ステップ 7: Gateway を実行する

Plugin が利用可能で、`msteams` 構成に認証情報がある場合、Teams チャネルは自動的に開始されます。

</details>

## フェデレーション認証（証明書とマネージド ID）

本番環境では、OpenClaw は `channels.msteams.authType: "federated"` を通じて、クライアントシークレットの代替として **フェデレーション認証** をサポートします。2 つの方法があります。

### オプション A: 証明書ベースの認証

Entra ID アプリ登録に登録された PEM 証明書を使用します。

**セットアップ:**

1. 証明書を生成または取得します（秘密鍵付き PEM 形式）。
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

### オプション B: Azure Managed Identity

Azure インフラストラクチャ（AKS、App Service、Azure VM）上でパスワードレス認証に Azure Managed Identity を使用します。

**仕組み:**

1. ボットのポッド/VM にマネージド ID（システム割り当てまたはユーザー割り当て）があります。
2. フェデレーション ID 認証情報が、マネージド ID を Entra ID アプリ登録にリンクします。
3. 実行時に、OpenClaw は Azure IMDS エンドポイントからトークンを取得するために `@azure/identity` を使用します。
4. トークンはボット認証のために Teams SDK に渡されます。

**前提条件:**

- マネージド ID が有効な Azure インフラストラクチャ（AKS ワークロード ID、App Service、VM）。
- Entra ID アプリ登録上に作成されたフェデレーション ID 認証情報。
- ポッド/VM から IMDS（`169.254.169.254:80`）へのネットワークアクセス。

**構成（システム割り当てマネージド ID）:**

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

**構成（ユーザー割り当てマネージド ID）:** 上記のブロックに `managedIdentityClientId: "<MI_CLIENT_ID>"` を追加します。

**環境変数:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（ユーザー割り当てのみ）

### AKS Workload Identity セットアップ

AKS デプロイでワークロード ID を使用する場合:

1. AKS クラスターで **ワークロード ID を有効化**します。
2. Entra ID アプリ登録で **フェデレーション ID 資格情報を作成**します:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. アプリのクライアント ID で **Kubernetes サービスアカウントにアノテーションを付けます**:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. ワークロード ID 注入用に **ポッドにラベルを付けます**:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS (`169.254.169.254`) への **ネットワークアクセスを許可**します: NetworkPolicy を使用している場合は、ポート 80 の `169.254.169.254/32` に対する egress ルールを追加します。

### 認証タイプの比較

| 方法                 | 設定                                           | 利点                               | 欠点                                               |
| -------------------- | ---------------------------------------------- | ---------------------------------- | -------------------------------------------------- |
| **クライアントシークレット** | `appPassword`                                  | セットアップが簡単                 | シークレットのローテーションが必要で、安全性が低い |
| **証明書**           | `authType: "federated"` + `certificatePath`    | ネットワーク上で共有シークレットなし | 証明書管理のオーバーヘッド                         |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | パスワードレスで、管理するシークレットなし | Azure インフラストラクチャが必要                   |

`certificateThumbprint` は `certificatePath` と併せて設定できますが、現在の認証パスでは読み取られません。前方互換性のためにのみ受け入れられます。

**デフォルト:** `authType` が未設定の場合、OpenClaw はクライアントシークレット認証 (`appPassword`) を使用します。既存の設定は変更なしで引き続き動作します。

## ローカル開発 (トンネリング)

Teams は `localhost` に到達できません。セッションをまたいで URL が安定するように、永続的な開発トンネルを使用します:

```bash
# 1 回限りのセットアップ:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 各開発セッション:
devtunnel host my-openclaw-bot
```

代替手段: `ngrok http 3978` または `tailscale funnel 3978` (URL はセッションごとに変わる場合があります)。

トンネル URL が変わった場合は、エンドポイントを更新します:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## ボットのテスト

**診断を実行:**

```bash
teams app doctor <teamsAppId>
```

ボット登録、AAD アプリ、マニフェスト、SSO 設定を 1 回で確認します。

**テストメッセージを送信:**

1. Teams アプリをインストールします (`teams app get <id> --install-link` からのインストールリンク)。
2. Teams でボットを見つけて DM を送信します。
3. 受信アクティビティについて Gateway ログを確認します。

## 環境変数

これらの認証関連設定キーは、`openclaw.json` の代わりに環境変数で設定できます (その他の設定キー、たとえば `groupPolicy` や `historyLimit` は設定ファイル専用です):

| 環境変数                             | 設定キー                  | 注記                                |
| ------------------------------------ | ------------------------- | ----------------------------------- |
| `MSTEAMS_APP_ID`                     | `appId`                   |                                     |
| `MSTEAMS_APP_PASSWORD`               | `appPassword`             |                                     |
| `MSTEAMS_TENANT_ID`                  | `tenantId`                |                                     |
| `MSTEAMS_AUTH_TYPE`                  | `authType`                | `"secret"` または `"federated"`     |
| `MSTEAMS_CERTIFICATE_PATH`           | `certificatePath`         | フェデレーション + 証明書           |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`     | `certificateThumbprint`   | 受け入れられるが、認証には不要      |
| `MSTEAMS_USE_MANAGED_IDENTITY`       | `useManagedIdentity`      | フェデレーション + Managed Identity |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | ユーザー割り当て Managed Identity のみ |

## メンバー情報アクション

OpenClaw は Microsoft Teams 向けに、Graph に裏付けられた `member-info` メッセージアクションを公開しています。これにより、エージェントと自動化は Microsoft Graph から直接、チャネルメンバーの詳細 (表示名、メール、役職、UPN、オフィス所在地) を解決できます。

要件:

- `Member.Read.Group` RSC 権限 (推奨マニフェストにすでに含まれています)。
- チーム横断の検索の場合: 管理者同意付きの `User.Read.All` Graph アプリケーション権限。

このアクションは Graph 資格情報が設定されている場合に常に実行されます。設定されていない場合は Graph 認証エラーで失敗します。個別の `channels.msteams.actions.memberInfo` トグルはありません。

## 履歴コンテキスト

- `channels.msteams.historyLimit` は、最近のチャネル/グループメッセージをいくつプロンプトに包めるかを制御します。`messages.groupChat.historyLimit` にフォールバックし、その後デフォルトは 50 になります。無効化するには `0` を設定します。
- 取得したスレッド履歴は送信者許可リスト (`allowFrom` / `groupAllowFrom`) によってフィルタリングされるため、スレッドコンテキストのシードには許可された送信者からのメッセージのみが含まれます。
- 引用された添付ファイルコンテキスト (返信自身の添付ファイル内にある Skype Reply-schema HTML から解析) はフィルタリングされずに渡されます。現在、送信者許可リストフィルターが適用されるのはスレッド履歴のシードのみです。
- DM 履歴は `channels.msteams.dmHistoryLimit` (ユーザーターン) で制限できます。ユーザーごとの上書き: `channels.msteams.dms["<user_id>"].historyLimit`。

## 現在の Teams RSC 権限 (マニフェスト)

これらは Teams アプリマニフェスト内の **既存の resourceSpecific 権限** です。アプリがインストールされているチーム/チャット内にのみ適用されます。

**チャネル向け (チームスコープ):**

- `ChannelMessage.Read.Group` (Application) - @mention なしですべてのチャネルメッセージを受信
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**グループチャット向け:**

- `ChatMessage.Read.Chat` (Application) - @mention なしですべてのグループチャットメッセージを受信

Teams CLI で RSC 権限を追加します:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams マニフェスト例 (編集済み)

必要なフィールドを含む最小限の有効な例です。ID と URL を置き換えてください。

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

### マニフェストの注意点 (必須フィールド)

- `bots[].botId` は Azure Bot App ID と一致している**必要があります**。
- `webApplicationInfo.id` は Azure Bot App ID と一致している**必要があります**。
- `bots[].scopes` には、使用予定のサーフェス (`personal`, `team`, `groupChat`) を含める必要があります。
- `bots[].supportsFiles: true` は personal スコープでのファイル処理に必要です。
- `authorization.permissions.resourceSpecific` には、チャネル通信のためのチャネル読み取り/送信を含める必要があります。

### 既存アプリの更新

```bash
# マニフェストをダウンロード、編集し、再アップロードします
teams app manifest download <teamsAppId> manifest.json
# manifest.json をローカルで編集...
teams app manifest upload manifest.json <teamsAppId>
# 内容が変更された場合、バージョンは自動的に上がります
```

更新後、各チームでアプリを再インストールし、キャッシュされたアプリメタデータを消去するために **Teams を完全に終了して再起動**してください (ウィンドウを閉じるだけではありません)。

<details>
<summary>手動マニフェスト更新 (CLI なし)</summary>

1. 新しい設定で `manifest.json` を更新します。
2. **`version` フィールドを増やします** (例: `1.0.0` → `1.1.0`)。
3. アイコン (`manifest.json`, `outline.png`, `color.png`) と一緒にマニフェストを **再 zip 化**します。
4. 新しい zip をアップロードします:
   - **Teams Admin Center:** Teams アプリ → アプリを管理 → アプリを見つける → 新しいバージョンをアップロード。
   - **サイドロード:** Teams → アプリ → アプリを管理 → カスタムアプリをアップロード。

</details>

## 機能: RSC のみ vs Graph

### **Teams RSC のみ**の場合 (アプリはインストール済み、Graph API 権限なし)

動作するもの:

- チャネルメッセージの**テキスト**内容を読み取る。
- チャネルメッセージの**テキスト**内容を送信する。
- **personal (DM)** ファイル添付を受信する。

動作しないもの:

- チャネル/グループの**画像またはファイル内容** (ペイロードには HTML スタブのみが含まれます)。
- SharePoint/OneDrive に保存された添付ファイルのダウンロード。
- ライブ Webhook イベントを超えたメッセージ履歴の読み取り。

### **Teams RSC + Microsoft Graph アプリケーション権限**の場合

追加されるもの:

- ホストされたコンテンツ (メッセージに貼り付けられた画像) のダウンロード。
- SharePoint/OneDrive に保存されたファイル添付のダウンロード。
- Graph 経由でのチャネル/チャットメッセージ履歴の読み取り。

### RSC vs Graph API

| 機能                    | RSC 権限             | Graph API                          |
| ----------------------- | -------------------- | ---------------------------------- |
| **リアルタイムメッセージ** | はい (Webhook 経由)  | いいえ (ポーリングのみ)            |
| **履歴メッセージ**       | いいえ               | はい (履歴をクエリ可能)            |
| **セットアップの複雑さ** | アプリマニフェストのみ | 管理者同意 + トークンフローが必要  |
| **オフラインで動作**     | いいえ (実行中である必要あり) | はい (いつでもクエリ可能)          |

**要点:** RSC はリアルタイムのリスニング用です。Graph API は履歴アクセス用です。オフライン中に見逃したメッセージを取得するには、`ChannelMessage.Read.All` を持つ Graph API が必要です (管理者同意が必要)。

## Graph 対応のメディア + 履歴 (チャネルに必要)

**チャネル**内の画像/ファイル、または**メッセージ履歴**を取得するには、Microsoft Graph 権限を有効にして管理者同意を付与します:

1. Entra ID (Azure AD) **アプリ登録** → Graph **アプリケーション権限**を追加:
   - `ChannelMessage.Read.All` (チャネル添付ファイル + 履歴)
   - `Chat.Read.All` または `ChatMessage.Read.All` (グループチャット)
2. テナントに対して**管理者同意を付与**します。
3. Teams アプリの**マニフェストバージョン**を上げ、再アップロードし、**Teams でアプリを再インストール**します。
4. キャッシュされたアプリメタデータを消去するために、**Teams を完全に終了して再起動**します。

**ユーザーメンション:** @mentions は、すでに会話に参加しているユーザーにはそのまま動作します。**現在の会話にいない**ユーザーを動的に検索してメンションするには、`User.Read.All` (Application) 権限を追加して管理者同意を付与します。

## 既知の制限

### Webhook タイムアウト

Teams は HTTP Webhook 経由でメッセージを配信します。OpenClaw はその Webhook リスナーに固定の HTTP サーバータイムアウトを適用します: 30 秒の非アクティブ、30 秒の合計リクエスト、ヘッダー受信まで 15 秒。エージェント処理がクライアント自身の再試行ウィンドウより長くかかる場合、次のような状態が見られることがあります:

- Teams がメッセージを再試行する（重複が発生する）。
- 返信が失われる。

OpenClaw は Webhook にすばやく ack し（エージェント処理が完了する前）、エージェントが応答したら返信を能動的に送信しますが、非常に遅いエージェント実行では、Teams 側で再試行や重複が表面化することがあります。

### Teams クラウドとサービス URL のサポート

この SDK ベースの Teams パスは、Microsoft Teams パブリッククラウドでライブ検証済みです。

受信返信は、受信した Teams SDK のターンコンテキストを使用します。コンテキスト外のプロアクティブ操作（送信、編集、削除、カード、投票、ファイル同意メッセージ、キューに入った長時間実行返信）は、保存された会話参照の `serviceUrl` を使用します。パブリッククラウドは既定で Teams SDK のパブリッククラウド環境を使用し、パブリック Teams Connector ホスト上の保存済み参照を許可します: `https://smba.trafficmanager.net/`。

パブリッククラウドが既定です。通常のパブリッククラウドボットでは、`channels.msteams.cloud` や `channels.msteams.serviceUrl` を設定する必要はありません。

非パブリック Teams クラウドでは、Microsoft が公開している場合に `cloud` と対応するプロアクティブ境界を設定します。

- `channels.msteams.cloud` は、認証、JWT 検証、トークンサービス、Graph スコープ用の Teams SDK クラウドプリセットを選択します。
- `channels.msteams.serviceUrl` は、プロアクティブな送信、編集、削除、カード、投票、ファイル同意メッセージ、キューに入った長時間実行返信の前に、保存済み会話参照を検証するために使用される Bot Connector エンドポイント境界を選択します。USGov と DoD SDK クラウドでは必須です。China/21Vianet では、OpenClaw は SDK の `China` プリセットを使用し、Azure China Bot Framework チャネルホスト上の保存済みまたは設定済みサービス URL のみを受け入れます。

Microsoft は Teams プロアクティブメッセージングドキュメントの [Create the conversation](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) セクションで、グローバルなプロアクティブ Bot Connector エンドポイントを公開しています。利用可能な場合は受信アクティビティの `serviceUrl` を使用し、それ以外の場合は下の Microsoft の表を使用してください。

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

`channels.msteams.serviceUrl` は、サポートされている Microsoft Teams Bot Connector ホストに制限されます。サービス URL が設定されている場合、OpenClaw はプロアクティブな送信、編集、削除、カード、投票、またはキューに入った長時間実行返信を実行する前に、保存済み会話の `serviceUrl` が同じホストを使用していることを確認します。既定のパブリッククラウド設定では、保存済み会話がパブリック Teams Connector ホストの外部を指している場合、OpenClaw はフェイルクローズします。クラウドまたはサービス URL 設定を変更した後は、保存済み会話参照を最新にするため、その会話から新しいメッセージを受信してください。

China/21Vianet には、Microsoft の Teams プロアクティブエンドポイント表に個別のグローバルプロアクティブ `smba` URL がありません。`cloud: "China"` を設定して、Teams SDK が Azure China の認証、トークン、JWT エンドポイントを使用するようにします。その後のプロアクティブ送信では、受信した China Teams アクティビティからの保存済み会話参照、または明示的に設定されたサービス URL が Azure China Bot Framework チャネル境界（`*.botframework.azure.cn`）上に必要です。Graph ベースの Teams ヘルパーは、OpenClaw が Graph リクエストを Azure China Graph エンドポイント経由にルーティングするまで、`cloud: "China"` では無効です。

### 書式設定

Teams markdown は Slack や Discord より制限されています。

- 基本的な書式は機能します: **bold**、_italic_、`code`、リンク。
- 複雑な markdown（テーブル、ネストしたリスト）は正しくレンダリングされない場合があります。
- Adaptive Cards は、投票とセマンティックなプレゼンテーション送信でサポートされています（下記参照）。

## 設定

主要な設定（共有チャネルパターンについては [/gateway/configuration](/ja-JP/gateway/configuration) を参照）:

- `channels.msteams.enabled`: チャネルを有効化または無効化します。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`: ボット認証情報。
- `channels.msteams.cloud`: Teams SDK クラウド環境（`Public`、`USGov`、`USGovDoD`、または `China`。既定は `Public`）。USGov/DoD SDK クラウドでは `serviceUrl` とともに設定します。China は SDK プリセットと保存済み Azure China Bot Framework 会話参照を使用し、Azure China Graph ルーティングが出荷されるまで Graph ベースのヘルパーは無効です。
- `channels.msteams.serviceUrl`: SDK プロアクティブ操作用の Bot Connector サービス URL 境界。パブリッククラウドは SDK の既定値を使用します。GCC（`https://smba.infra.gcc.teams.microsoft.com/teams`）、GCC High、または DoD では設定します。China は、保存済み会話参照が 21Vianet によって運用される Teams から来ている場合、Azure China Bot Framework チャネルホストを受け入れます。
- `channels.msteams.webhook.port`（既定 `3978`）。
- `channels.msteams.webhook.path`（既定 `/api/messages`）。
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled`（既定 `pairing`）。
- `channels.msteams.allowFrom`: DM 許可リスト（AAD オブジェクト ID を推奨）。Graph アクセスが利用可能な場合、ウィザードはセットアップ中に名前を ID に解決します。
- `channels.msteams.dangerouslyAllowNameMatching`: 変更可能な UPN/表示名マッチングと、直接のチーム/チャネル名ルーティングを再有効化するための緊急用トグル。
- `channels.msteams.textChunkLimit`: 送信テキストのチャンクサイズ（文字数、既定 `4000`。より高い値が設定されても `4000` でハードキャップ）。
- `channels.msteams.chunkMode`: 長さによるチャンク化の前に空行（段落境界）で分割する `length`（既定）または `newline`。
- `channels.msteams.mediaAllowHosts`: 受信添付ファイルホストの許可リスト（既定は Microsoft/Teams ドメイン: Graph、SharePoint/OneDrive、Teams CDN、Bot Framework、Azure Media Services）。
- `channels.msteams.mediaAuthAllowHosts`: メディア再試行時に Authorization ヘッダーを付与するための許可リスト（既定は Graph + Bot Framework ホスト）。
- `channels.msteams.mediaMaxMb`: チャネルごとのメディアサイズ上限の MB 単位オーバーライド。未設定時は `agents.defaults.mediaMaxMb` にフォールバックします。
- `channels.msteams.requireMention`: チャネル/グループで @メンションを必須にします（既定 `true`）。
- `channels.msteams.replyStyle`: `thread | top-level`（[返信スタイル](#reply-style-threads-vs-posts) を参照）。
- `channels.msteams.teams.<teamId>.replyStyle`: チームごとのオーバーライド。
- `channels.msteams.teams.<teamId>.requireMention`: チームごとのオーバーライド。
- `channels.msteams.teams.<teamId>.tools`: チャネルオーバーライドがない場合に使用される、チームごとの既定ツールポリシーオーバーライド（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.toolsBySender`: チームごと、送信者ごとの既定ツールポリシーオーバーライド（`"*"` ワイルドカードをサポート）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: チャネルごとのオーバーライド。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: チャネルごとのオーバーライド。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: チャネルごとのツールポリシーオーバーライド（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: チャネルごと、送信者ごとのツールポリシーオーバーライド（`"*"` ワイルドカードをサポート）。
- `toolsBySender` キーには明示的なプレフィックスを使用してください: `channel:`、`id:`、`e164:`、`username:`、`name:`（従来のプレフィックスなしキーは引き続き `id:` のみにマップされます）。
- `channels.msteams.authType`: 認証タイプ - `"secret"`（既定）または `"federated"`。
- `channels.msteams.certificatePath`: PEM 証明書ファイルへのパス（フェデレーション + 証明書認証）。
- `channels.msteams.certificateThumbprint`: 証明書サムプリント。受け入れられますが、認証には必須ではありません。
- `channels.msteams.useManagedIdentity`: マネージド ID 認証を有効化します（フェデレーションモード）。
- `channels.msteams.managedIdentityClientId`: ユーザー割り当てマネージド ID のクライアント ID。
- `channels.msteams.sharePointSiteId`: グループチャット/チャネルでのファイルアップロード用 SharePoint サイト ID（[グループチャットでファイルを送信する](#sending-files-in-group-chats) を参照）。
- `channels.msteams.welcomeCard`、`channels.msteams.groupWelcomeCard`、`channels.msteams.promptStarters`: 初回 DM/グループ接触時に表示されるようこそ Adaptive Card と、その推奨プロンプトボタン。
- `channels.msteams.responsePrefix`: 送信返信の先頭に付加されるテキスト。
- `channels.msteams.feedbackEnabled`（既定 `true`）、`channels.msteams.feedbackReflection`（既定 `true`）、`channels.msteams.feedbackReflectionCooldownMs`: 返信に対する賛成/反対フィードバックと、否定的フィードバックのリフレクションフォローアップ。
- `channels.msteams.sso`、`channels.msteams.delegatedAuth`: SSO ベースのフロー用の Bot Framework OAuth 接続と委任 Graph スコープ。`sso.enabled: true` には `sso.connectionName` が必要です。

## ルーティングとセッション

- セッションキーは標準のエージェント形式に従います（[/concepts/session](/ja-JP/concepts/session) を参照）:
  - ダイレクトメッセージはメインセッションを共有します（`agent:<agentId>:<mainKey>`）。
  - チャネル/グループメッセージは会話 ID を使用します:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 返信スタイル: スレッドと投稿

Teams には、同じ基盤データモデル上に 2 つのチャネル UI スタイルがあります。

| スタイル                    | 説明                                               | 推奨 `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **投稿**（クラシック）      | メッセージはカードとして表示され、その下にスレッド返信が表示されます | `thread`（既定）       |
| **スレッド**（Slack 風） | メッセージは Slack に近く、直線的に流れます                   | `top-level`              |

**問題:** Teams API は、チャネルがどちらの UI スタイルを使用しているかを公開していません。誤った `replyStyle` を使用すると:

- Threads スタイルのチャネルで `thread` → 返信が不自然にネストされて表示されます。
- Posts スタイルのチャネルで `top-level` → 返信がスレッド内ではなく、個別のトップレベル投稿として表示されます。

**解決策:** チャネルの設定方法に基づいて、チャネルごとに `replyStyle` を設定します。

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

ボットがチャネルに返信を送信するとき、`replyStyle` は最も具体的なオーバーライドから既定値へ向かって解決されます。最初の非 `undefined` 値が採用されます。

1. **チャネルごと** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **チームごと** - `channels.msteams.teams.<teamId>.replyStyle`
3. **グローバル** - `channels.msteams.replyStyle`
4. **暗黙の既定値** - `requireMention` から派生:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

グローバルに `requireMention: false` を設定し、明示的な `replyStyle` を指定していない場合、Posts スタイルのチャネルでのメンションは、受信がスレッド返信だった場合でもトップレベル投稿として表示されます。意図しない動作を避けるには、グローバル、チーム、またはチャネルレベルで `replyStyle: "thread"` を固定してください。

保存済みチャネル会話へのプロアクティブ送信（キューされたツール呼び出し返信、長時間実行エージェント）でも、同じチーム/チャネル解決が適用されます。グループチャットと個人（DM）会話は、`replyStyle` に関係なく、プロアクティブ送信では常に `top-level` に解決されます。

### スレッドコンテキストの保持

`replyStyle: "thread"` が有効で、ボットがチャネルスレッド内から @メンションされた場合、OpenClaw は元のスレッドルートを送信先の会話参照（`19:...@thread.tacv2;messageid=<root>`）に再付与し、返信が同じスレッド内に届くようにします。これは、ライブ（ターン内）送信と、Bot Framework のターンコンテキストが期限切れになった後のプロアクティブ送信（例: 長時間実行エージェント、`mcp__openclaw__message` 経由のキューされたツール呼び出し返信）の両方に適用されます。

スレッドルートは、会話参照に保存された `threadId` から取得されます。`threadId` より前の古い保存済み参照は `activityId`（その会話を最後に初期化した受信アクティビティ）にフォールバックするため、既存のデプロイは再初期化なしで引き続き動作します。

`replyStyle: "top-level"` が有効な場合、チャネルスレッドからの受信には意図的に新しいトップレベル投稿として回答します。スレッドサフィックスは付与されません。これは Threads スタイルのチャネルでは正しい動作です。スレッド返信を期待していたのにトップレベル投稿になる場合、そのチャネルの `replyStyle` 設定が誤っています。

## 添付ファイルと画像

**現在の制限:**

- **DM:** 画像とファイル添付は Teams ボットファイル API 経由で動作します。
- **チャネル/グループ:** 添付ファイルは M365 ストレージ（SharePoint/OneDrive）に保存されます。Webhook ペイロードには HTML スタブのみが含まれ、実際のファイルバイトは含まれません。チャネル添付ファイルをダウンロードするには **Graph API 権限が必要** です。
- 明示的なファイル優先送信では、`media` / `filePath` / `path` とともに `action=upload-file` を使用します。任意の `message` は付随するテキスト/コメントになり、`filename`（または `title`）はアップロード名を上書きします。

Graph 権限がない場合、画像を含むチャネルメッセージはテキストのみとして届きます（画像コンテンツにはボットからアクセスできません）。
デフォルトでは、OpenClaw は Microsoft/Teams ホスト名からのみメディアをダウンロードします。`channels.msteams.mediaAllowHosts` で上書きできます（任意のホストを許可するには `["*"]` を使用します）。
認可ヘッダーは、`channels.msteams.mediaAuthAllowHosts` 内のホストにのみ付与されます（デフォルトは Graph + Bot Framework ホスト）。このリストは厳格に保ってください（マルチテナントのサフィックスは避けてください）。

## グループチャットでファイルを送信する

ボットは組み込みの FileConsentCard フローを使用して DM でファイルを送信できます。**グループチャット/チャネルでファイルを送信する** には追加のセットアップが必要です。

| コンテキスト             | ファイルの送信方法                              | 必要なセットアップ                              |
| ------------------------ | ----------------------------------------------- | ----------------------------------------------- |
| **DM**                   | FileConsentCard → ユーザーが承認 → ボットがアップロード | そのまま動作                                    |
| **グループチャット/チャネル** | SharePoint にアップロード → 共有リンク           | `sharePointSiteId` + Graph 権限が必要           |
| **画像（任意のコンテキスト）** | Base64 エンコードのインライン                  | そのまま動作                                    |

### グループチャットに SharePoint が必要な理由

ボットには個人用 OneDrive ドライブがありません（`/me/drive` はアプリケーション ID では動作しません）。グループチャット/チャネルでファイルを送信するには、ボットが **SharePoint サイト** にアップロードし、共有リンクを作成します。

### セットアップ

1. Entra ID（Azure AD）→ アプリ登録で **Graph API 権限を追加** します:
   - `Sites.ReadWrite.All`（アプリケーション）- SharePoint にファイルをアップロードします。
   - `Chat.Read.All`（アプリケーション）- 任意。ユーザー単位の共有リンクを有効にします。
2. テナントの **管理者同意を付与** します。
3. **SharePoint サイト ID を取得** します:

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw を設定** します:

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
| `Sites.ReadWrite.All` のみ              | 組織全体の共有リンク（組織内の誰でもアクセス可能）        |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ユーザー単位の共有リンク（チャットメンバーのみアクセス可能） |

ユーザー単位の共有は、チャット参加者だけがファイルにアクセスできるため、より安全です。`Chat.Read.All` がない場合、ボットは組織全体の共有にフォールバックします。

### フォールバック動作

| シナリオ                                          | 結果                                               |
| ------------------------------------------------- | -------------------------------------------------- |
| グループチャット + ファイル + `sharePointSiteId` 設定済み | SharePoint にアップロードし、共有リンクを送信      |
| グループチャット + ファイル + `sharePointSiteId` なし     | OneDrive アップロードを試行（失敗する場合あり）、テキストのみ送信 |
| 個人チャット + ファイル                           | FileConsentCard フロー（SharePoint なしで動作）    |
| 任意のコンテキスト + 画像                         | Base64 エンコードのインライン（SharePoint なしで動作） |

### ファイルの保存場所

アップロードされたファイルは、設定された SharePoint サイトの既定のドキュメントライブラリ内の `/OpenClawShared/` フォルダーに保存されます。

## 投票（Adaptive Cards）

OpenClaw は Teams の投票を Adaptive Cards として送信します（ネイティブの Teams 投票 API はありません）。

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`。
- 投票は Gateway によって、`state/openclaw.sqlite` の OpenClaw plugin-state SQLite に記録されます。
- 既存の `msteams-polls.json` ファイルは、実行中の Plugin ではなく `openclaw doctor --fix` によってインポートされます。
- 投票を記録するには Gateway がオンラインのままである必要があります。
- 投票は結果サマリーを自動投稿せず、poll-results CLI もまだありません。

## プレゼンテーションカード

`message` ツール、CLI、または通常の返信配信を使用して、セマンティックなプレゼンテーションペイロードを Teams ユーザーまたは会話に送信します。OpenClaw は汎用プレゼンテーション契約から Teams Adaptive Cards としてレンダリングします。

`presentation` パラメーターはセマンティックブロックを受け付けます。`presentation` が指定されている場合、メッセージテキストは任意です。ボタンは Adaptive Card の送信アクションまたは URL アクションとしてレンダリングされます。選択メニューは Teams レンダラーではネイティブではないため、OpenClaw は配信前に読みやすいテキストへダウングレードします。

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

ターゲット形式の詳細は、下の [ターゲット形式](#target-formats) を参照してください。

## ターゲット形式

MSTeams ターゲットは、ユーザーと会話を区別するためにプレフィックスを使用します:

| ターゲットタイプ       | 形式                             | 例                                                                                                     |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| ユーザー（ID 指定）  | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                            |
| ユーザー（名前指定） | `user:<display-name>`            | `user:John Smith`（Graph API が必要）                                                                 |
| グループ/チャネル    | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`                                                               |
| グループ/チャネル（未加工） | `<conversation-id>`              | `19:abc123...@thread.tacv2`、`19:...@unq.gbl.spaces`、またはベアの `a:`/`8:orgid:`/`29:` Bot Framework id |

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

<Note>
`user:` プレフィックスがない場合、名前はデフォルトでグループまたはチーム解決になります。表示名で人物をターゲットにする場合は、常に `user:` を使用してください。
</Note>

## プロアクティブメッセージング

- プロアクティブメッセージは、ユーザーが操作した **後** にのみ可能です。その時点で OpenClaw が会話参照を保存するためです。
- `dmPolicy` と許可リストゲートについては、[/gateway/configuration](/ja-JP/gateway/configuration) を参照してください。

## チーム ID とチャネル ID（よくある落とし穴）

Teams URL の `groupId` クエリパラメーターは、設定で使用するチーム ID では **ありません**。代わりに URL パスから ID を抽出してください:

**チーム URL:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**チャネル URL:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**設定では:**

- チームキー = `/team/` の後のパスセグメント（URL デコード済み、例: `19:Bk4j...@thread.tacv2`。古いテナントでは `@thread.skype` が表示される場合があり、これも有効です）。
- チャネルキー = `/channel/` の後のパスセグメント（URL デコード済み）。
- OpenClaw ルーティングでは `groupId` クエリパラメーターを **無視** します。これは Microsoft Entra グループ ID であり、受信 Teams アクティビティで使用される Bot Framework 会話 ID ではありません。

## プライベートチャネル

ボットはプライベートチャネルで限定的にサポートされます:

| 機能                         | 標準チャネル | プライベートチャネル       |
| ---------------------------- | ------------ | -------------------------- |
| ボットインストール           | はい         | 限定的                     |
| リアルタイムメッセージ（Webhook） | はい         | 動作しない場合あり         |
| RSC 権限                     | はい         | 異なる動作をする場合あり   |
| @メンション                  | はい         | ボットにアクセス可能な場合 |
| Graph API 履歴               | はい         | はい（権限あり）           |

**プライベートチャネルが動作しない場合の回避策:**

1. ボットとのやり取りには標準チャネルを使用します。
2. DMを使用します。ユーザーはいつでもボットに直接メッセージを送信できます。
3. 履歴アクセスには Graph API を使用します（`ChannelMessage.Read.All` が必要）。

## トラブルシューティング

### よくある問題

- **チャネルで画像が表示されない:** Graph 権限または管理者の同意がありません。Teams アプリを再インストールし、Teams を完全に終了して再度開いてください。
- **チャネルで応答がない:** 既定ではメンションが必要です。`channels.msteams.requireMention=false` を設定するか、チーム/チャネルごとに構成してください。
- **バージョンの不一致（Teams に古いマニフェストがまだ表示される）:** アプリを削除して再追加し、Teams を完全に終了して更新してください。
- **Webhook からの 401 Unauthorized:** Azure JWT なしで手動テストする場合は想定される動作です。エンドポイントには到達できますが、認証に失敗したことを意味します。正しくテストするには Azure Web Chat を使用してください。

### マニフェストのアップロードエラー

- **「Icon file cannot be empty」:** マニフェストが参照しているアイコンファイルが 0 バイトです。有効な PNG アイコン（`outline.png` は 32x32、`color.png` は 192x192）を作成してください。
- **「webApplicationInfo.Id already in use」:** アプリがまだ別のチーム/チャットにインストールされています。まず見つけてアンインストールするか、反映されるまで 5〜10 分待ってください。
- **アップロード時の「Something went wrong」:** 代わりに [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) からアップロードし、ブラウザーの DevTools（F12）→ Network タブを開いて、実際のエラーをレスポンス本文で確認してください。
- **サイドロードに失敗する:** 「Upload a custom app」ではなく「Upload an app to your org's app catalog」を試してください。これによりサイドロード制限を回避できることがよくあります。

### RSC 権限が機能しない

1. `webApplicationInfo.id` がボットの App ID と完全に一致していることを確認します。
2. アプリを再アップロードし、チーム/チャットに再インストールします。
3. 組織の管理者が RSC 権限をブロックしていないか確認します。
4. 適切なスコープを使用していることを確認します。チームには `ChannelMessage.Read.Group`、グループチャットには `ChatMessage.Read.Chat` を使用します。

## 参考資料

- [Azure Bot を作成](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot セットアップガイド
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams アプリの作成/管理
- [Teams アプリ マニフェスト スキーマ](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC でチャネルメッセージを受信](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 権限リファレンス](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams ボットのファイル処理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（チャネル/グループには Graph が必要）
- [プロアクティブ メッセージング](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - ボット管理用 Teams CLI

## 関連

- [チャネル概要](/ja-JP/channels) - サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと強化
