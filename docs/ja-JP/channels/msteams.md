---
read_when:
    - Microsoft Teams チャンネル機能に取り組む
summary: Microsoft Teams ボットのサポート状況、機能、設定
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-11T20:21:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7bf8cd0ae6c6053f51794e6bc03bb6d927d640256272f3afb04f3b0ec99eb43
    source_path: channels/msteams.md
    workflow: 16
---

ステータス: テキスト + DM 添付ファイルはサポートされています。チャネル/グループでのファイル送信には `sharePointSiteId` + Graph 権限が必要です（[グループチャットでのファイル送信](#sending-files-in-group-chats)を参照）。投票は Adaptive Cards 経由で送信されます。メッセージアクションは、ファイル優先送信用に明示的な `upload-file` を公開します。

## 同梱 Plugin

Microsoft Teams は現在の OpenClaw リリースでは同梱 Plugin として提供されるため、通常のパッケージ化されたビルドでは別途インストールは不要です。

古いビルドを使っている場合、または同梱 Teams を除外したカスタムインストールの場合は、npm パッケージを直接インストールします。

```bash
openclaw plugins install @openclaw/msteams
```

現在の公式リリースタグに追従するには、裸のパッケージを使用します。再現可能なインストールが必要な場合にのみ、正確なバージョンを固定してください。

ローカルチェックアウト（git リポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) は、bot 登録、マニフェスト作成、認証情報生成を 1 つのコマンドで処理します。

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

まだの場合は、devtunnel CLI をインストールして認証します（[はじめにガイド](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
Teams は devtunnels で認証できないため、`--allow-anonymous` が必要です。各受信 bot リクエストは、それでも Teams SDK によって自動的に検証されます。
</Note>

代替手段: `ngrok http 3978` または `tailscale funnel 3978`（ただし、これらはセッションごとに URL が変わる場合があります）。

**3. アプリを作成する**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

この 1 つのコマンドで次を実行します。

- Entra ID（Azure AD）アプリケーションを作成
- クライアントシークレットを生成
- Teams アプリマニフェスト（アイコン付き）をビルドしてアップロード
- bot を登録（デフォルトでは Teams 管理、Azure サブスクリプションは不要）

出力には `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID`、および **Teams App ID** が表示されます。以降の手順のために控えてください。また、Teams にアプリを直接インストールするかどうかも提示されます。

**4. 出力された認証情報を使って OpenClaw を設定する:**

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

`teams app create` ではアプリのインストールを求められます。「Install in Teams」を選択してください。スキップした場合は、後でリンクを取得できます。

```bash
teams app get <teamsAppId> --install-link
```

**6. すべてが動作することを確認する**

```bash
teams app doctor <teamsAppId>
```

これは、bot 登録、AAD アプリ設定、マニフェストの有効性、SSO 設定にわたって診断を実行します。

本番デプロイでは、クライアントシークレットの代わりに[フェデレーション認証](/ja-JP/channels/msteams#federated-authentication-certificate-plus-managed-identity)（証明書またはマネージド ID）の使用を検討してください。

<Note>
グループチャットはデフォルトでブロックされます（`channels.msteams.groupPolicy: "allowlist"`）。グループ返信を許可するには、`channels.msteams.groupAllowFrom` を設定するか、`groupPolicy: "open"` を使って任意のメンバーを許可します（メンションでゲートされます）。
</Note>

## 目標

- Teams DM、グループチャット、またはチャネル経由で OpenClaw と会話する。
- ルーティングを決定的に保つ: 返信は常に到着元のチャネルへ戻る。
- 安全なチャネル動作をデフォルトにする（別途設定しない限りメンションが必要）。

## 設定の書き込み

デフォルトでは、Microsoft Teams は `/config set|unset` によってトリガーされる設定更新の書き込みを許可されています（`commands.config: true` が必要）。

無効化するには:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## アクセス制御（DM + グループ）

**DM アクセス**

- デフォルト: `channels.msteams.dmPolicy = "pairing"`。不明な送信者は承認されるまで無視されます。
- `channels.msteams.allowFrom` には、安定した AAD オブジェクト ID、または `accessGroup:core-team` のような静的な送信者アクセスグループを使用してください。
- allowlist には UPN/表示名の一致に依存しないでください。これらは変更される可能性があります。OpenClaw はデフォルトで直接的な名前一致を無効にしています。明示的に有効化するには `channels.msteams.dangerouslyAllowNameMatching: true` を設定します。
- ウィザードは、認証情報で許可されている場合、Microsoft Graph 経由で名前を ID に解決できます。

**グループアクセス**

- デフォルト: `channels.msteams.groupPolicy = "allowlist"`（`groupAllowFrom` を追加しない限りブロック）。未設定時のデフォルトを上書きするには `channels.defaults.groupPolicy` を使用します。
- `channels.msteams.groupAllowFrom` は、グループチャット/チャネルでどの送信者または静的な送信者アクセスグループがトリガーできるかを制御します（`channels.msteams.allowFrom` にフォールバック）。
- 任意のメンバーを許可するには `groupPolicy: "open"` を設定します（デフォルトでは引き続きメンションでゲートされます）。
- **チャネルを一切許可しない**場合は、`channels.msteams.groupPolicy: "disabled"` を設定します。

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

**Teams + チャネル allowlist**

- `channels.msteams.teams` 配下にチームとチャネルを列挙して、グループ/チャネル返信のスコープを制限します。
- キーには、変更可能な表示名ではなく、Teams リンクから取得した安定した Teams 会話 ID を使用してください。
- `groupPolicy="allowlist"` で teams allowlist が存在する場合、列挙されたチーム/チャネルのみが受け入れられます（メンションでゲートされます）。
- 設定ウィザードは `Team/Channel` エントリを受け付け、代わりに保存します。
- 起動時に、OpenClaw は team/channel と user allowlist の名前を ID に解決し（Graph 権限で許可される場合）、そのマッピングをログに記録します。解決できなかった team/channel 名は入力どおり保持されますが、`channels.msteams.dangerouslyAllowNameMatching: true` が有効でない限り、デフォルトではルーティングでは無視されます。

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

Teams CLI を使用できない場合は、Azure Portal から bot を手動でセットアップできます。

### 仕組み

1. Microsoft Teams Plugin が利用可能であることを確認します（現在のリリースでは同梱）。
2. **Azure Bot**（App ID + シークレット + tenant ID）を作成します。
3. bot を参照し、以下の RSC 権限を含む **Teams アプリパッケージ**をビルドします。
4. Teams アプリをチーム（または DM 用の個人スコープ）にアップロード/インストールします。
5. `~/.openclaw/openclaw.json`（または環境変数）で `msteams` を設定し、gateway を起動します。
6. gateway はデフォルトで `/api/messages` 上の Bot Framework Webhook トラフィックを待ち受けます。

### ステップ 1: Azure Bot を作成する

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) に移動します
2. **Basics** タブに入力します。

   | フィールド              | 値                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | bot 名。例: `openclaw-msteams`（一意である必要があります） |
   | **Subscription**   | Azure サブスクリプションを選択                           |
   | **Resource group** | 新規作成するか既存のものを使用                               |
   | **Pricing tier**   | 開発/テスト用は **Free**                                 |
   | **Type of App**    | **Single Tenant**（推奨。下の注記を参照）         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
新しいマルチテナント bot の作成は 2025-07-31 以降非推奨になりました。新しい bot には **Single Tenant** を使用してください。
</Warning>

3. **Review + create** → **Create** をクリックします（約 1〜2 分待ちます）

### ステップ 2: 認証情報を取得する

1. Azure Bot リソース → **Configuration** に移動します
2. **Microsoft App ID** をコピーします → これが `appId` です
3. **Manage Password** をクリックします → App Registration に移動します
4. **Certificates & secrets** → **New client secret** → **Value** をコピーします → これが `appPassword` です
5. **Overview** に移動します → **Directory (tenant) ID** をコピーします → これが `tenantId` です

### ステップ 3: Messaging Endpoint を設定する

1. Azure Bot → **Configuration** で
2. **Messaging endpoint** を Webhook URL に設定します。
   - 本番: `https://your-domain.com/api/messages`
   - ローカル開発: トンネルを使用します（下の[ローカル開発](#local-development-tunneling)を参照）

### ステップ 4: Teams チャネルを有効化する

1. Azure Bot → **Channels** で
2. **Microsoft Teams** → Configure → Save をクリックします
3. 利用規約に同意します

### ステップ 5: Teams アプリマニフェストをビルドする

- `botId = <App ID>` の `bot` エントリを含めます。
- スコープ: `personal`、`team`、`groupChat`。
- `supportsFiles: true`（個人スコープのファイル処理に必要）。
- RSC 権限を追加します（[RSC Permissions](#current-teams-rsc-permissions-manifest)を参照）。
- アイコンを作成します: `outline.png`（32x32）と `color.png`（192x192）。
- 3 つのファイル `manifest.json`、`outline.png`、`color.png` をまとめて Zip 化します。

### ステップ 6: OpenClaw を設定する

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

Plugin が利用可能で、`msteams` 設定に認証情報が存在する場合、Teams チャネルは自動的に開始されます。

</details>

## フェデレーション認証（証明書とマネージド ID）

> 2026.4.11 で追加

本番デプロイ向けに、OpenClaw はクライアントシークレットより安全な代替手段として**フェデレーション認証**をサポートします。利用可能な方法は 2 つあります。

### オプション A: 証明書ベース認証

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

パスワードレス認証には Azure Managed Identity を使用します。これは、マネージド ID を利用できる Azure インフラストラクチャ（AKS、App Service、Azure VM）上のデプロイに最適です。

**仕組み:**

1. bot pod/VM にマネージド ID（システム割り当てまたはユーザー割り当て）があります。
2. **フェデレーション ID 認証情報**が、マネージド ID を Entra ID アプリ登録にリンクします。
3. 実行時に、OpenClaw は `@azure/identity` を使って Azure IMDS エンドポイント（`169.254.169.254`）からトークンを取得します。
4. トークンは bot 認証のために Teams SDK に渡されます。

**前提条件:**

- マネージド ID が有効な Azure インフラストラクチャ（AKS workload identity、App Service、VM）
- Entra ID アプリ登録上に作成されたフェデレーション ID 認証情報
- pod/VM から IMDS（`169.254.169.254:80`）へのネットワークアクセス

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

### AKS ワークロード ID のセットアップ

ワークロード ID を使用する AKS デプロイの場合:

1. AKS クラスターで**ワークロード ID を有効化**します。
2. Entra ID アプリ登録に**フェデレーション ID 資格情報を作成**します。

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. Kubernetes サービスアカウントにアプリクライアント ID の**アノテーションを付けます**。

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. ワークロード ID インジェクション用に Pod に**ラベルを付けます**。

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS（`169.254.169.254`）への**ネットワークアクセスを確保**します。NetworkPolicy を使用している場合は、ポート 80 で `169.254.169.254/32` へのトラフィックを許可する egress ルールを追加します。

### 認証タイプの比較

| 方法               | 設定                                         | メリット                               | デメリット                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **クライアントシークレット**    | `appPassword`                                  | セットアップが簡単                       | シークレットのローテーションが必要で、安全性が低い |
| **証明書**      | `authType: "federated"` + `certificatePath`    | ネットワーク経由で共有シークレットを扱わない      | 証明書管理のオーバーヘッド       |
| **マネージド ID** | `authType: "federated"` + `useManagedIdentity` | パスワードレスで、管理すべきシークレットがない | Azure インフラストラクチャが必要         |

**デフォルト動作:** `authType` が設定されていない場合、OpenClaw はデフォルトでクライアントシークレット認証を使用します。既存の設定は変更なしで引き続き動作します。

## ローカル開発（トンネリング）

Teams は `localhost` に到達できません。セッションをまたいで URL が同じままになるように、永続的な開発トンネルを使用します。

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

Bot 登録、AAD アプリ、マニフェスト、SSO 設定を 1 回で確認します。

**テストメッセージを送信:**

1. Teams アプリをインストールします（`teams app get <id> --install-link` のインストールリンクを使用）
2. Teams で Bot を見つけて DM を送信します
3. 受信アクティビティが Gateway ログに記録されていることを確認します

## 環境変数

すべての設定キーは、代わりに環境変数で設定できます。

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE`（任意: `"secret"` または `"federated"`）
- `MSTEAMS_CERTIFICATE_PATH`（フェデレーション + 証明書）
- `MSTEAMS_CERTIFICATE_THUMBPRINT`（任意、認証には不要）
- `MSTEAMS_USE_MANAGED_IDENTITY`（フェデレーション + マネージド ID）
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`（ユーザー割り当て MI のみ）

## メンバー情報アクション

OpenClaw は Microsoft Teams 向けに、Graph ベースの `member-info` アクションを公開します。これにより、エージェントや自動化は Microsoft Graph からチャンネルメンバーの詳細（表示名、メール、ロール）を直接解決できます。

要件:

- `Member.Read.Group` RSC 権限（推奨マニフェストにすでに含まれています）
- チームをまたぐ検索の場合: 管理者同意付きの `User.Read.All` Graph アプリケーション権限

このアクションは `channels.msteams.actions.memberInfo` で制御されます（デフォルト: Graph 資格情報が利用可能な場合は有効）。

## 履歴コンテキスト

- `channels.msteams.historyLimit` は、最近のチャンネル/グループメッセージをいくつプロンプトに含めるかを制御します。
- `messages.groupChat.historyLimit` にフォールバックします。無効化するには `0` を設定します（デフォルト 50）。
- 取得されたスレッド履歴は送信者許可リスト（`allowFrom` / `groupAllowFrom`）でフィルターされるため、スレッドコンテキストのシードには許可された送信者からのメッセージのみが含まれます。
- 引用添付ファイルコンテキスト（Teams 返信 HTML から派生した `ReplyTo*`）は、現在は受信したまま渡されます。
- つまり、許可リストは誰がエージェントをトリガーできるかを制御します。現時点でフィルターされるのは、特定の補足コンテキストパスのみです。
- DM 履歴は `channels.msteams.dmHistoryLimit`（ユーザーターン）で制限できます。ユーザーごとの上書き: `channels.msteams.dms["<user_id>"].historyLimit`。

## 現在の Teams RSC 権限（マニフェスト）

これらは Teams アプリマニフェスト内の**既存の resourceSpecific 権限**です。アプリがインストールされているチーム/チャット内でのみ適用されます。

**チャンネルの場合（チームスコープ）:**

- `ChannelMessage.Read.Group`（Application）- @mention なしですべてのチャンネルメッセージを受信
- `ChannelMessage.Send.Group`（Application）
- `Member.Read.Group`（Application）
- `Owner.Read.Group`（Application）
- `ChannelSettings.Read.Group`（Application）
- `TeamMember.Read.Group`（Application）
- `TeamSettings.Read.Group`（Application）

**グループチャットの場合:**

- `ChatMessage.Read.Chat`（Application）- @mention なしですべてのグループチャットメッセージを受信

Teams CLI 経由で RSC 権限を追加するには:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams マニフェスト例（編集済み）

必須フィールドを含む、最小限の有効な例です。ID と URL を置き換えてください。

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

- `bots[].botId` は Azure Bot App ID と**一致している必要があります**。
- `webApplicationInfo.id` は Azure Bot App ID と**一致している必要があります**。
- `bots[].scopes` には、使用予定のサーフェス（`personal`、`team`、`groupChat`）を含める必要があります。
- 個人スコープでファイル処理を行うには、`bots[].supportsFiles: true` が必要です。
- チャンネルトラフィックが必要な場合、`authorization.permissions.resourceSpecific` にはチャンネルの読み取り/送信を含める必要があります。

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
2. **`version` フィールドを増やします**（例: `1.0.0` → `1.1.0`）
3. アイコン（`manifest.json`、`outline.png`、`color.png`）とともにマニフェストを**再 zip 化**します
4. 新しい zip をアップロードします。
   - **Teams Admin Center:** Teams アプリ → アプリを管理 → アプリを探す → 新しいバージョンをアップロード
   - **サイドロード:** Teams 内 → アプリ → アプリを管理 → カスタムアプリをアップロード

</details>

## 機能: RSC のみ vs Graph

### **Teams RSC のみ**の場合（アプリはインストール済み、Graph API 権限なし）

動作するもの:

- チャンネルメッセージの**テキスト**コンテンツを読み取る。
- チャンネルメッセージの**テキスト**コンテンツを送信する。
- **個人（DM）**ファイル添付を受信する。

動作しないもの:

- チャンネル/グループの**画像またはファイル内容**（ペイロードには HTML スタブのみが含まれます）。
- SharePoint/OneDrive に保存された添付ファイルのダウンロード。
- メッセージ履歴の読み取り（ライブ Webhook イベントを超えるもの）。

### **Teams RSC + Microsoft Graph アプリケーション権限**の場合

追加されるもの:

- ホストされたコンテンツ（メッセージに貼り付けられた画像）のダウンロード。
- SharePoint/OneDrive に保存されたファイル添付のダウンロード。
- Graph 経由でのチャンネル/チャットメッセージ履歴の読み取り。

### RSC vs Graph API

| 機能              | RSC 権限      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **リアルタイムメッセージ**  | はい（Webhook 経由）    | いいえ（ポーリングのみ）                   |
| **履歴メッセージ** | いいえ                   | はい（履歴をクエリ可能）             |
| **セットアップの複雑さ**    | アプリマニフェストのみ    | 管理者同意 + トークンフローが必要 |
| **オフラインで動作**       | いいえ（実行中である必要があります） | はい（いつでもクエリ可能）                 |

**要点:** RSC はリアルタイムリスニング用です。Graph API は履歴アクセス用です。オフライン中に見逃したメッセージを取り込むには、`ChannelMessage.Read.All` を持つ Graph API が必要です（管理者同意が必要）。

## Graph 対応メディア + 履歴（チャンネルに必須）

**チャンネル**内の画像/ファイルが必要な場合、または**メッセージ履歴**を取得したい場合は、Microsoft Graph 権限を有効化し、管理者同意を付与する必要があります。

1. Entra ID（Azure AD）の **App Registration** で、Microsoft Graph **アプリケーション権限**を追加します。
   - `ChannelMessage.Read.All`（チャンネル添付ファイル + 履歴）
   - `Chat.Read.All` または `ChatMessage.Read.All`（グループチャット）
2. テナントに対して**管理者同意を付与**します。
3. Teams アプリの**マニフェストバージョン**を上げ、再アップロードして、**Teams でアプリを再インストール**します。
4. キャッシュされたアプリメタデータをクリアするために、**Teams を完全に終了して再起動**します。

**ユーザーメンションの追加権限:** ユーザー @mentions は、会話内のユーザーについてはそのまま動作します。ただし、**現在の会話にいない**ユーザーを動的に検索してメンションしたい場合は、`User.Read.All`（Application）権限を追加し、管理者同意を付与してください。

## 既知の制限

### Webhook タイムアウト

Teams は HTTP Webhook 経由でメッセージを配信します。処理に時間がかかりすぎる場合（例: 遅い LLM 応答）、次のような状況が発生することがあります。

- Gateway タイムアウト
- Teams がメッセージを再試行する（重複が発生）
- 返信のドロップ

OpenClaw は、すばやく戻って能動的に返信を送ることでこれに対応しますが、非常に遅い応答ではそれでも問題が起きる場合があります。

### 書式

Teams markdown は Slack や Discord より制限があります。

- 基本的な書式は機能します: **bold**, _italic_, `code`, リンク
- 複雑な markdown（テーブル、ネストされたリスト）は正しくレンダリングされない場合があります
- Adaptive Cards は、投票とセマンティックなプレゼンテーション送信でサポートされています（下記参照）

## 設定

主要な設定（共有チャネルパターンについては `/gateway/configuration` を参照）:

- `channels.msteams.enabled`: チャネルを有効化/無効化します。
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: bot 認証情報。
- `channels.msteams.webhook.port`（デフォルト `3978`）
- `channels.msteams.webhook.path`（デフォルト `/api/messages`）
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）
- `channels.msteams.allowFrom`: ダイレクトメッセージの許可リスト（AAD オブジェクト ID 推奨）。Graph アクセスが利用可能な場合、ウィザードはセットアップ中に名前を ID に解決します。
- `channels.msteams.dangerouslyAllowNameMatching`: 変更可能な UPN/表示名の照合と、チーム/チャネル名による直接ルーティングを再有効化するための緊急用トグル。
- `channels.msteams.textChunkLimit`: 送信テキストのチャンクサイズ。
- `channels.msteams.chunkMode`: 長さによるチャンク分割の前に空行（段落境界）で分割するには、`length`（デフォルト）または `newline`。
- `channels.msteams.mediaAllowHosts`: 受信添付ファイルホストの許可リスト（デフォルトは Microsoft/Teams ドメイン）。
- `channels.msteams.mediaAuthAllowHosts`: メディア再試行時に Authorization ヘッダーを付与するホストの許可リスト（デフォルトは Graph + Bot Framework ホスト）。
- `channels.msteams.requireMention`: チャネル/グループで @mention を必須にします（デフォルト true）。
- `channels.msteams.replyStyle`: `thread | top-level`（[返信スタイル](#reply-style-threads-vs-posts)を参照）。
- `channels.msteams.teams.<teamId>.replyStyle`: チーム単位のオーバーライド。
- `channels.msteams.teams.<teamId>.requireMention`: チーム単位のオーバーライド。
- `channels.msteams.teams.<teamId>.tools`: チャネルのオーバーライドがない場合に使われる、チーム単位のデフォルトのツールポリシーオーバーライド（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.toolsBySender`: 送信者ごとのチーム単位デフォルトのツールポリシーオーバーライド（`"*"` ワイルドカードをサポート）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: チャネル単位のオーバーライド。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: チャネル単位のオーバーライド。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: チャネル単位のツールポリシーオーバーライド（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: チャネル単位、送信者ごとのツールポリシーオーバーライド（`"*"` ワイルドカードをサポート）。
- `toolsBySender` キーには明示的なプレフィックスを使う必要があります:
  `channel:`, `id:`, `e164:`, `username:`, `name:`（従来のプレフィックスなしキーは現在も `id:` のみにマップされます）。
- `channels.msteams.actions.memberInfo`: Graph に基づくメンバー情報アクションを有効化または無効化します（デフォルト: Graph 認証情報が利用可能な場合は有効）。
- `channels.msteams.authType`: 認証タイプ - `"secret"`（デフォルト）または `"federated"`。
- `channels.msteams.certificatePath`: PEM 証明書ファイルへのパス（federated + certificate 認証）。
- `channels.msteams.certificateThumbprint`: 証明書のサムプリント（任意、認証には不要）。
- `channels.msteams.useManagedIdentity`: マネージド ID 認証を有効化します（federated モード）。
- `channels.msteams.managedIdentityClientId`: ユーザー割り当てマネージド ID のクライアント ID。
- `channels.msteams.sharePointSiteId`: グループチャット/チャネルでのファイルアップロード用 SharePoint サイト ID（[グループチャットでのファイル送信](#sending-files-in-group-chats)を参照）。

## ルーティングとセッション

- セッションキーは標準のエージェント形式に従います（[/concepts/session](/ja-JP/concepts/session) を参照）:
  - ダイレクトメッセージはメインセッションを共有します（`agent:<agentId>:<mainKey>`）。
  - チャネル/グループメッセージは会話 ID を使います:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 返信スタイル: スレッドと投稿

Teams は最近、同じ基盤データモデル上に 2 つのチャネル UI スタイルを導入しました。

| スタイル                    | 説明                                               | 推奨される `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **投稿**（クラシック）      | メッセージはカードとして表示され、その下にスレッド返信が付きます | `thread`（デフォルト）       |
| **スレッド**（Slack 風） | メッセージは Slack に近い形で直線的に流れます                   | `top-level`              |

**問題:** Teams API は、チャネルがどちらの UI スタイルを使っているかを公開していません。誤った `replyStyle` を使うと、次のようになります。

- Threads スタイルのチャネルで `thread` → 返信が不自然にネストされて表示されます
- Posts スタイルのチャネルで `top-level` → 返信がスレッド内ではなく、個別のトップレベル投稿として表示されます

**解決策:** チャネルの設定状況に基づいて、チャネル単位で `replyStyle` を設定します。

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

bot がチャネルに返信を送信するとき、`replyStyle` は最も具体的なオーバーライドからデフォルトへ向かって解決されます。最初の非 `undefined` 値が採用されます。

1. **チャネル単位** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **チーム単位** — `channels.msteams.teams.<teamId>.replyStyle`
3. **グローバル** — `channels.msteams.replyStyle`
4. **暗黙のデフォルト** — `requireMention` から導出:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

明示的な `replyStyle` なしでグローバルに `requireMention: false` を設定すると、受信がスレッド返信だった場合でも、Posts スタイルのチャネルでメンションがトップレベル投稿として表示されます。想定外の挙動を避けるには、グローバル、チーム、またはチャネルレベルで `replyStyle: "thread"` を固定してください。

### スレッドコンテキストの保持

`replyStyle: "thread"` が有効で、bot がチャネルスレッド内から @mentioned された場合、OpenClaw は元のスレッドルートを送信先の会話参照（`19:…@thread.tacv2;messageid=<root>`）に再付与し、返信が同じスレッド内に届くようにします。これは、ライブ（ターン内）送信と、Bot Framework のターンコンテキストが期限切れになった後に行われる能動的送信（例: 長時間実行されるエージェント、`mcp__openclaw__message` 経由のキュー済みツール呼び出し返信）の両方に当てはまります。

スレッドルートは、会話参照に保存された `threadId` から取得されます。`threadId` より前の古い保存済み参照では `activityId`（その会話を最後にシードした受信アクティビティ）がフォールバックとして使われるため、既存のデプロイは再シードなしで動作し続けます。

`replyStyle: "top-level"` が有効な場合、チャネルスレッドからの受信には意図的に新しいトップレベル投稿として応答します。スレッドサフィックスは付与されません。これは Threads スタイルのチャネルに対する正しい挙動です。スレッド返信を期待していた場所でトップレベル投稿が表示される場合、そのチャネルに対する `replyStyle` の設定が誤っています。

## 添付ファイルと画像

**現在の制限:**

- **ダイレクトメッセージ:** 画像とファイル添付は Teams bot ファイル API 経由で機能します。
- **チャネル/グループ:** 添付ファイルは M365 ストレージ（SharePoint/OneDrive）に保存されます。Webhook ペイロードには、実際のファイルバイトではなく HTML スタブのみが含まれます。チャネル添付ファイルをダウンロードするには **Graph API 権限が必要です**。
- 明示的なファイル優先送信では、`media` / `filePath` / `path` とともに `action=upload-file` を使います。任意の `message` は付随するテキスト/コメントになり、`filename` はアップロード名を上書きします。

Graph 権限がない場合、画像付きのチャネルメッセージはテキストのみとして受信されます（画像内容には bot からアクセスできません）。
デフォルトでは、OpenClaw は Microsoft/Teams ホスト名からのみメディアをダウンロードします。`channels.msteams.mediaAllowHosts` でオーバーライドします（任意のホストを許可するには `["*"]` を使います）。
Authorization ヘッダーは、`channels.msteams.mediaAuthAllowHosts` 内のホストにのみ付与されます（デフォルトは Graph + Bot Framework ホスト）。このリストは厳格に保ってください（マルチテナントサフィックスは避けてください）。

## グループチャットでのファイル送信

bot は FileConsentCard フロー（組み込み）を使って、ダイレクトメッセージでファイルを送信できます。ただし、**グループチャット/チャネルでファイルを送信する**には追加のセットアップが必要です。

| コンテキスト                  | ファイルの送信方法                           | 必要なセットアップ                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **ダイレクトメッセージ**                  | FileConsentCard → ユーザーが承認 → bot がアップロード | そのまま動作します                            |
| **グループチャット/チャネル** | SharePoint にアップロード → 共有リンク            | `sharePointSiteId` + Graph 権限が必要 |
| **画像（任意のコンテキスト）** | Base64 エンコードされたインライン                        | そのまま動作します                            |

### グループチャットに SharePoint が必要な理由

bot には個人用 OneDrive ドライブがありません（`/me/drive` Graph API エンドポイントはアプリケーション ID では機能しません）。グループチャット/チャネルでファイルを送信するには、bot が **SharePoint サイト**にアップロードして共有リンクを作成します。

### セットアップ

1. Entra ID（Azure AD）→ App Registration で **Graph API 権限を追加**します:
   - `Sites.ReadWrite.All`（Application）- SharePoint にファイルをアップロード
   - `Chat.Read.All`（Application）- 任意、ユーザー単位の共有リンクを有効化

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

### 共有の挙動

| 権限                              | 共有の挙動                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` のみ              | 組織全体の共有リンク（組織内の誰でもアクセス可能） |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ユーザー単位の共有リンク（チャットメンバーのみアクセス可能）      |

ユーザー単位の共有は、チャット参加者のみがファイルにアクセスできるため、より安全です。`Chat.Read.All` 権限がない場合、bot は組織全体の共有にフォールバックします。

### フォールバックの挙動

| シナリオ                                          | 結果                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| グループチャット + ファイル + `sharePointSiteId` 設定済み | SharePoint にアップロードし、共有リンクを送信            |
| グループチャット + ファイル + `sharePointSiteId` なし         | OneDrive アップロードを試行（失敗する場合あり）、テキストのみ送信 |
| 個人チャット + ファイル                              | FileConsentCard フロー（SharePoint なしで動作）    |
| 任意のコンテキスト + 画像                               | Base64 エンコードされたインライン（SharePoint なしで動作）   |

### ファイルの保存場所

アップロードされたファイルは、設定済み SharePoint サイトのデフォルトドキュメントライブラリ内の `/OpenClawShared/` フォルダーに保存されます。

## 投票（Adaptive Cards）

OpenClaw は Teams の投票を Adaptive Cards として送信します（ネイティブの Teams 投票 API はありません）。

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票は Gateway によって `~/.openclaw/msteams-polls.json` に記録されます。
- 投票を記録するには、Gateway がオンラインのままである必要があります。
- 投票はまだ結果サマリーを自動投稿しません（必要に応じてストアファイルを確認してください）。

## プレゼンテーションカード

`message` ツールまたは CLI を使用して、セマンティックなプレゼンテーションペイロードを Teams ユーザーまたは会話に送信します。OpenClaw は、汎用プレゼンテーション契約から Teams Adaptive Cards としてレンダリングします。

`presentation` パラメーターはセマンティックブロックを受け取ります。`presentation` が指定されている場合、メッセージテキストは任意です。

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

ターゲット形式の詳細については、下の[ターゲット形式](#target-formats)を参照してください。

## ターゲット形式

MSTeams のターゲットは、ユーザーと会話を区別するためにプレフィックスを使用します。

| ターゲット種別      | 形式                             | 例                                                  |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| ユーザー（ID）      | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| ユーザー（名前）    | `user:<display-name>`            | `user:John Smith`（Graph API が必要）               |
| グループ/チャンネル | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| グループ/チャンネル（raw） | `<conversation-id>`              | `19:abc123...@thread.tacv2`（`@thread` を含む場合） |

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
`user:` プレフィックスがない場合、名前はデフォルトでグループまたはチームの解決に使われます。表示名で人を指定する場合は、必ず `user:` を使用してください。
</Note>

## プロアクティブメッセージング

- プロアクティブメッセージは、ユーザーがやり取りした**後**でのみ可能です。その時点で会話参照を保存するためです。
- `dmPolicy` と許可リストのゲーティングについては、`/gateway/configuration` を参照してください。

## チーム ID とチャンネル ID（よくある落とし穴）

Teams URL の `groupId` クエリパラメーターは、設定で使用するチーム ID では**ありません**。代わりに URL パスから ID を抽出してください。

**チーム URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    チーム会話 ID（これを URL デコードする）
```

**チャンネル URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      チャンネル ID（これを URL デコードする）
```

**設定の場合:**

- チームキー = `/team/` の後のパスセグメント（URL デコード済み。例: `19:Bk4j...@thread.tacv2`。古いテナントでは `@thread.skype` が表示される場合があり、これも有効）
- チャンネルキー = `/channel/` の後のパスセグメント（URL デコード済み）
- OpenClaw ルーティングでは `groupId` クエリパラメーターを**無視**してください。これは Microsoft Entra グループ ID であり、受信する Teams アクティビティで使用される Bot Framework 会話 ID ではありません。

## プライベートチャンネル

ボットのプライベートチャンネル対応には制限があります。

| 機能                         | 標準チャンネル | プライベートチャンネル |
| ---------------------------- | -------------- | ---------------------- |
| ボットのインストール         | はい           | 制限あり               |
| リアルタイムメッセージ（webhook） | はい           | 動作しない場合あり     |
| RSC 権限                     | はい           | 動作が異なる場合あり   |
| @メンション                  | はい           | ボットにアクセス可能な場合 |
| Graph API 履歴               | はい           | はい（権限がある場合） |

**プライベートチャンネルが動作しない場合の回避策:**

1. ボットとのやり取りには標準チャンネルを使用する
2. DM を使用する - ユーザーはいつでもボットに直接メッセージを送信できる
3. 履歴アクセスには Graph API を使用する（`ChannelMessage.Read.All` が必要）

## トラブルシューティング

### よくある問題

- **チャンネルに画像が表示されない:** Graph 権限または管理者の同意がありません。Teams アプリを再インストールし、Teams を完全に終了してから再度開いてください。
- **チャンネルで応答がない:** デフォルトではメンションが必要です。`channels.msteams.requireMention=false` を設定するか、チーム/チャンネルごとに構成してください。
- **バージョン不一致（Teams に古いマニフェストが表示され続ける）:** アプリを削除して再追加し、更新するために Teams を完全に終了してください。
- **webhook からの 401 Unauthorized:** Azure JWT なしで手動テストする場合は想定どおりです。エンドポイントには到達できていますが、認証に失敗したことを意味します。正しくテストするには Azure Web Chat を使用してください。

### マニフェストのアップロードエラー

- **「Icon file cannot be empty」:** マニフェストが 0 バイトのアイコンファイルを参照しています。有効な PNG アイコンを作成してください（`outline.png` は 32x32、`color.png` は 192x192）。
- **「webApplicationInfo.Id already in use」:** アプリがまだ別のチーム/チャットにインストールされています。先に見つけてアンインストールするか、反映されるまで 5〜10 分待ってください。
- **アップロード時の「Something went wrong」:** 代わりに [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) からアップロードし、ブラウザーの DevTools（F12）→ Network タブを開いて、実際のエラーについてレスポンス本文を確認してください。
- **サイドロードに失敗する:** 「Upload a custom app」ではなく「Upload an app to your org's app catalog」を試してください。これにより、サイドロード制限を回避できることがよくあります。

### RSC 権限が動作しない

1. `webApplicationInfo.id` がボットの App ID と完全に一致していることを確認する
2. アプリを再アップロードし、チーム/チャットに再インストールする
3. 組織の管理者が RSC 権限をブロックしていないか確認する
4. 適切なスコープを使用していることを確認する: チームには `ChannelMessage.Read.Group`、グループチャットには `ChatMessage.Read.Chat`

## 参考資料

- [Azure Bot を作成](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot セットアップガイド
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams アプリの作成/管理
- [Teams アプリマニフェストスキーマ](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC でチャンネルメッセージを受信](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 権限リファレンス](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams ボットのファイル処理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（チャンネル/グループには Graph が必要）
- [プロアクティブメッセージング](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - ボット管理用 Teams CLI

## 関連

- [チャンネル概要](/ja-JP/channels) - サポートされるすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションゲーティング
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと強化
