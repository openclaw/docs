---
read_when:
    - Microsoft Teams チャネル機能の開発
summary: Microsoft Teams ボットのサポート状況、機能、設定
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-12T14:18:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c01ef9ac8892c19b42e0f03e427f9e87be9868b8901879d93d1762d1533aab70
    source_path: channels/msteams.md
    workflow: 16
---

ステータス: テキストと DM の添付ファイルがサポートされています。チャネル/グループでのファイル送信には `sharePointSiteId` と Graph の権限が必要です（[グループチャットでのファイル送信](#sending-files-in-group-chats)を参照）。投票は Adaptive Cards 経由で送信されます。メッセージアクションでは、ファイルを先に送信するための明示的な `upload-file` が公開されています。

## バンドル済み Plugin

現在の OpenClaw リリースでは、Microsoft Teams はバンドル済み Plugin として同梱されています。通常のパッケージビルドでは、個別のインストールは不要です。

古いビルド、またはバンドル済み Teams を除外したカスタムインストールでは、npm パッケージを直接インストールします。

```bash
openclaw plugins install @openclaw/msteams
```

現在の公式リリースタグに追従するには、バージョンを付けずにパッケージを指定します。再現可能なインストールが必要な場合にのみ、正確なバージョンを固定してください。

ローカルチェックアウト（git リポジトリから実行）:

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

詳細: [Plugin](/ja-JP/tools/plugin)

## クイックセットアップ

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) は、ボット登録、マニフェスト作成、資格情報生成を 1 つのコマンドで処理します。

**1. インストールしてログインする**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # ログイン済みであることを確認し、テナント情報を表示する
```

<Note>
Teams CLI は現在プレビュー版です。コマンドとフラグはリリース間で変更される可能性があります。
</Note>

**2. トンネルを開始する**（Teams は localhost に接続できません）

必要に応じて devtunnel CLI をインストールして認証します（[はじめにガイド](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)）。

```bash
# 1 回限りのセットアップ（セッション間で URL を維持）:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 開発セッションごと:
devtunnel host my-openclaw-bot
# エンドポイント: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
Teams は devtunnels で認証できないため、`--allow-anonymous` が必要です。受信する各ボットリクエストは、引き続き Teams SDK によって検証されます。
</Note>

代替手段: `ngrok http 3978` または `tailscale funnel 3978`（URL はセッションごとに変わる場合があります）。

**3. アプリを作成する**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

これにより、Entra ID（Azure AD）アプリケーションが作成され、クライアントシークレットが生成され、Teams アプリマニフェスト（アイコンを含む）がビルドおよびアップロードされ、Teams 管理のボットが登録されます（Azure サブスクリプションは不要です）。出力には `CLIENT_ID`、`CLIENT_SECRET`、`TENANT_ID`、および **Teams App ID** が含まれ、アプリを Teams に直接インストールするオプションも提示されます。

**4. OpenClaw を設定する**。出力された資格情報を使用します。

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

**5. Teams にアプリをインストールする**

`teams app create` を実行すると、アプリをインストールするよう求められます。「Install in Teams」を選択します。後でインストールリンクを取得するには、次を実行します。

```bash
teams app get <teamsAppId> --install-link
```

**6. すべてが動作することを確認する**

```bash
teams app doctor <teamsAppId>
```

ボット登録、AAD アプリ設定、マニフェストの有効性、SSO セットアップ全体の診断を実行します。

本番環境では、クライアントシークレットの代わりに[フェデレーション認証](#federated-authentication-certificate-plus-managed-identity)（証明書またはマネージド ID）の使用を検討してください。

<Note>
グループチャットはデフォルトでブロックされます（`channels.msteams.groupPolicy: "allowlist"`）。グループへの返信を許可するには、`channels.msteams.groupAllowFrom` を設定するか、`groupPolicy: "open"` を使用して任意のメンバーを許可します（メンションは必要です）。
</Note>

## 目標

- Teams の DM、グループチャット、またはチャネルを通じて OpenClaw と会話する。
- ルーティングを決定的に保つ。返信は常に、メッセージが届いたチャネルに返されます。
- デフォルトで安全なチャネル動作にする（別途設定しない限りメンションが必要）。

## 設定の書き込み

デフォルトでは、Microsoft Teams は `/config set|unset` によって開始された設定更新を書き込めます（`commands.config: true` が必要です）。

無効にするには、次のように設定します。

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## アクセス制御（DM とグループ）

**DM アクセス**

- デフォルト: `channels.msteams.dmPolicy = "pairing"`。不明な送信者は、承認されるまで無視されます。
- `channels.msteams.allowFrom` には、安定した AAD オブジェクト ID、または `accessGroup:core-team` のような静的な送信者アクセスグループを使用してください。
- 許可リストでは UPN/表示名の照合に依存しないでください。これらは変更される可能性があります。OpenClaw はデフォルトで名前の直接照合を無効にしています。有効にするには `channels.msteams.dangerouslyAllowNameMatching: true` を設定します。
- 資格情報で許可されている場合、ウィザードは Microsoft Graph を介して名前を ID に解決できます。

**グループアクセス**

- デフォルト: `channels.msteams.groupPolicy = "allowlist"`（`groupAllowFrom` を追加しない限りブロック）。`channels.msteams.groupPolicy` が未設定の場合、`channels.defaults.groupPolicy` で共有デフォルトを上書きできます。
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
- 変更可能な表示名ではなく、Teams リンクから取得した安定した Teams 会話 ID をキーとして使用します（[チームとチャネルの ID](#team-and-channel-ids-common-gotcha)を参照）。
- `groupPolicy="allowlist"` で teams 許可リストが存在する場合、列挙されたチーム/チャネルのみが受け入れられます（メンションが必要です）。
- 設定ウィザードは `Team/Channel` エントリを受け入れ、保存します。
- 起動時、OpenClaw はチーム/チャネルおよびユーザー許可リストの名前を ID に解決し（Graph の権限で許可されている場合）、その対応関係をログに記録します。解決できない名前は入力されたまま保持されますが、`channels.msteams.dangerouslyAllowNameMatching: true` が設定されていない限り、ルーティングでは無視されます。

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
<summary><strong>手動セットアップ（Teams CLI を使用しない場合）</strong></summary>

### 仕組み

1. Microsoft Teams Plugin が利用可能であることを確認します（現在のリリースではバンドル済み）。
2. **Azure Bot**（App ID、シークレット、テナント ID）を作成します。
3. ボットを参照し、以下の RSC 権限を含む **Teams アプリパッケージ**をビルドします。
4. Teams アプリをチームにアップロード/インストールします（DM の場合は personal スコープ）。
5. `~/.openclaw/openclaw.json`（または環境変数）で `msteams` を設定し、Gateway を起動します。
6. Gateway はデフォルトで `/api/messages` の Bot Framework Webhook トラフィックを待ち受けます。

### ステップ 1: Azure Bot を作成する

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) に移動します。
2. **Basics** タブに入力します。

   | フィールド           | 値                                                       |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | ボット名（例: `openclaw-msteams`。一意である必要があります） |
   | **Subscription**   | Azure サブスクリプションを選択                           |
   | **Resource group** | 新規作成するか、既存のものを使用                         |
   | **Pricing tier**   | 開発/テストには **Free**                                 |
   | **Type of App**    | **Single Tenant**（推奨。以下の注記を参照）              |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
新しいマルチテナントボットの作成は 2025-07-31 以降非推奨となりました。新しいボットには **Single Tenant** を使用してください。
</Warning>

3. **Review + create**、続いて **Create** をクリックします（約 1～2 分）。

### ステップ 2: 資格情報を取得する

1. Azure Bot リソース → **Configuration** → **Microsoft App ID**（`appId`）をコピーします。
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → **Value**（`appPassword`）をコピーします。
3. **Overview** → **Directory (tenant) ID**（`tenantId`）をコピーします。

### ステップ 3: メッセージングエンドポイントを設定する

1. Azure Bot → **Configuration**。
2. **Messaging endpoint** を設定します。
   - 本番環境: `https://your-domain.com/api/messages`
   - ローカル開発: トンネルを使用します（[ローカル開発](#local-development-tunneling)を参照）

### ステップ 4: Teams チャネルを有効にする

1. Azure Bot → **Channels**。
2. **Microsoft Teams** → Configure → Save をクリックします。
3. 利用規約に同意します。

### ステップ 5: Teams アプリマニフェストをビルドする

- `botId = <App ID>` を指定した `bot` エントリを含めます。
- スコープ: `personal`、`team`、`groupChat`。
- `supportsFiles: true`（personal スコープでのファイル処理に必要）。
- RSC 権限を追加します（[RSC 権限](#current-teams-rsc-permissions-manifest)を参照）。
- アイコン `outline.png`（32x32）と `color.png`（192x192）を作成します。
- `manifest.json`、`outline.png`、`color.png` をまとめて Zip 圧縮します。

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

Plugin が利用可能で、`msteams` 設定に資格情報が含まれている場合、Teams チャネルは自動的に起動します。

</details>

## フェデレーション認証（証明書とマネージド ID）

本番環境では、OpenClaw はクライアントシークレットの代替として、`channels.msteams.authType: "federated"` による**フェデレーション認証**をサポートしています。方法は 2 つあります。

### オプション A: 証明書ベースの認証

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

Azure インフラストラクチャ（AKS、App Service、Azure VM）でパスワードレス認証を行うには、Azure Managed Identity を使用します。

**仕組み:**

1. ボットの Pod/VM にマネージド ID（システム割り当てまたはユーザー割り当て）があります。
2. フェデレーション ID 資格情報が、マネージド ID と Entra ID のアプリ登録を関連付けます。
3. 実行時に OpenClaw は `@azure/identity` を使用して Azure IMDS エンドポイントからトークンを取得します。
4. ボット認証のため、そのトークンが Teams SDK に渡されます。

**前提条件:**

- マネージド ID が有効な Azure インフラストラクチャ（AKS ワークロード ID、App Service、VM）。
- Entra ID のアプリ登録にフェデレーション ID 資格情報が作成されていること。
- Pod/VM から IMDS（`169.254.169.254:80`）へのネットワークアクセス。

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

**設定（ユーザー割り当てマネージド ID）:** 上記のブロックに `managedIdentityClientId: "<MI_CLIENT_ID>"` を追加します。

**環境変数:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>`（ユーザー割り当ての場合のみ）

### AKS Workload Identity のセットアップ

ワークロード ID を使用する AKS デプロイの場合:

1. AKS クラスターで**ワークロード ID を有効にします**。
2. Entra ID アプリ登録に**フェデレーション ID 資格情報を作成します**:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. アプリのクライアント ID を使用して **Kubernetes サービスアカウントにアノテーションを付けます**:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. ワークロード ID を注入するために**ポッドにラベルを付けます**:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. IMDS（`169.254.169.254`）への**ネットワークアクセスを許可します**。NetworkPolicy を使用している場合は、ポート 80 の `169.254.169.254/32` に対するエグレスルールを追加します。

### 認証タイプの比較

| 方式                     | 設定                                           | 長所                               | 短所                                       |
| ------------------------ | ---------------------------------------------- | ---------------------------------- | ------------------------------------------ |
| **クライアントシークレット** | `appPassword`                                  | セットアップが簡単                 | シークレットのローテーションが必要で、安全性が低い |
| **証明書**               | `authType: "federated"` + `certificatePath`    | ネットワーク上で共有シークレット不要 | 証明書管理のオーバーヘッド                 |
| **マネージド ID**        | `authType: "federated"` + `useManagedIdentity` | パスワード不要で、管理するシークレットも不要 | Azure インフラストラクチャが必要      |

`certificateThumbprint` は `certificatePath` とともに設定できますが、現在は認証パスで読み取られません。将来の互換性のためにのみ受け付けられます。

**デフォルト:** `authType` が未設定の場合、OpenClaw はクライアントシークレット認証（`appPassword`）を使用します。既存の設定は変更せずに引き続き動作します。

## ローカル開発（トンネリング）

Teams は `localhost` に到達できません。セッション間で URL が変わらないように、永続的な開発用トンネルを使用します:

```bash
# 1 回限りのセットアップ:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# 各開発セッション:
devtunnel host my-openclaw-bot
```

代替手段: `ngrok http 3978` または `tailscale funnel 3978`（URL はセッションごとに変わる場合があります）。

トンネル URL が変わった場合は、エンドポイントを更新します:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## ボットのテスト

**診断を実行します:**

```bash
teams app doctor <teamsAppId>
```

ボット登録、AAD アプリ、マニフェスト、SSO 設定を一度に確認します。

**テストメッセージを送信します:**

1. Teams アプリをインストールします（`teams app get <id> --install-link` から取得したインストールリンクを使用）。
2. Teams でボットを見つけ、DM を送信します。
3. Gateway ログで受信アクティビティを確認します。

## 環境変数

これらの認証関連の設定キーは、`openclaw.json` の代わりに環境変数で設定できます（`groupPolicy` や `historyLimit` など、その他の設定キーは設定ファイルでのみ指定できます）:

| 環境変数                             | 設定キー                  | 備考                                  |
| ------------------------------------ | ------------------------- | ------------------------------------- |
| `MSTEAMS_APP_ID`                     | `appId`                   |                                       |
| `MSTEAMS_APP_PASSWORD`               | `appPassword`             |                                       |
| `MSTEAMS_TENANT_ID`                  | `tenantId`                |                                       |
| `MSTEAMS_AUTH_TYPE`                  | `authType`                | `"secret"` または `"federated"`       |
| `MSTEAMS_CERTIFICATE_PATH`           | `certificatePath`         | フェデレーション + 証明書             |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`     | `certificateThumbprint`   | 受け付けられるが、認証には不要        |
| `MSTEAMS_USE_MANAGED_IDENTITY`       | `useManagedIdentity`      | フェデレーション + マネージド ID      |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | ユーザー割り当てマネージド ID のみ    |

## メンバー情報アクション

OpenClaw は Microsoft Teams 向けに Graph を利用する `member-info` アクションを公開しており、エージェントや自動化処理が、設定済みの会話について検証済みのメンバー一覧の詳細を解決できます。

要件:

- `ChannelSettings.Read.Group` および `TeamMember.Read.Group` RSC アクセス許可（推奨マニフェストにすでに含まれています）。

このアクションは Graph 資格情報が設定されている場合に常に利用でき、個別の `channels.msteams.actions.memberInfo` トグルはありません。
標準チャネルの検索では、一致するチームメンバー一覧の ID、表示名、メールアドレス、ロールが返されます。
現在の DM またはグループチャットでは、このアクションは信頼済み送信者の安定したユーザー ID を返せます。
プライベート/共有チャネル、および現在のチャット以外のメンバー検索には、追加のメンバー一覧アクセス許可が必要であり、
デフォルトのアクセス許可ベースラインでは拒否されます。

## 履歴コンテキスト

- `channels.msteams.historyLimit` は、プロンプトに含める直近のチャネル/グループメッセージ数を制御します。`messages.groupChat.historyLimit` にフォールバックし、その後デフォルトの 50 が使用されます。無効にするには `0` を設定します。
- 取得したスレッド履歴は送信者の許可リスト（`allowFrom` / `groupAllowFrom`）でフィルタリングされるため、スレッドコンテキストの初期化には許可された送信者からのメッセージのみが含まれます。
- 引用された添付ファイルのコンテキスト（返信自体の添付ファイル内にある Skype Reply スキーマの HTML から解析）は、フィルタリングされずに渡されます。現在、送信者許可リストのフィルターが適用されるのはスレッド履歴の初期化のみです。
- DM 履歴は `channels.msteams.dmHistoryLimit`（ユーザーターン数）で制限できます。ユーザーごとの上書き: `channels.msteams.dms["<user_id>"].historyLimit`。

## 現在の Teams RSC アクセス許可（マニフェスト）

以下は、Teams アプリのマニフェストにある**既存の resourceSpecific アクセス許可**です。これらは、アプリがインストールされているチーム/チャット内でのみ適用されます。

**チャネル向け（チームスコープ）:**

- `ChannelMessage.Read.Group` (Application) - @メンションなしですべてのチャネルメッセージを受信
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**グループチャット向け:**

- `ChatMessage.Read.Chat` (Application) - @メンションなしですべてのグループチャットメッセージを受信

Teams CLI を使用して RSC アクセス許可を追加します:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Teams マニフェストの例（編集済み）

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

- `bots[].botId` は Azure Bot App ID と一致する**必要があります**。
- `webApplicationInfo.id` は Azure Bot App ID と一致する**必要があります**。
- `bots[].scopes` には、使用する予定のサーフェス（`personal`、`team`、`groupChat`）を含める必要があります。
- 個人スコープでファイルを処理するには、`bots[].supportsFiles: true` が必要です。
- `authorization.permissions.resourceSpecific` には、チャネル通信向けのチャネル読み取り/送信を含める必要があります。

### 既存アプリの更新

```bash
# マニフェストをダウンロード、編集、再アップロード
teams app manifest download <teamsAppId> manifest.json
# manifest.json をローカルで編集...
teams app manifest upload manifest.json <teamsAppId>
# 内容が変更されている場合、バージョンは自動的に引き上げられる
```

更新後、各チームにアプリを再インストールし、キャッシュされたアプリのメタデータを消去するために、**Teams を完全に終了して再起動します**（ウィンドウを閉じるだけでは不十分です）。

<details>
<summary>マニフェストの手動更新（CLI を使用しない場合）</summary>

1. `manifest.json` を新しい設定で更新します。
2. **`version` フィールドを増やします**（例: `1.0.0` → `1.1.0`）。
3. マニフェストをアイコン（`manifest.json`、`outline.png`、`color.png`）とともに**再度 zip 圧縮します**。
4. 新しい zip をアップロードします:
   - **Teams Admin Center:** Teams apps → Manage apps → find your app → Upload new version.
   - **サイドロード:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## 機能: RSC のみと Graph の比較

### **Teams RSC のみ**の場合（アプリはインストール済み、Graph API アクセス許可なし）

動作するもの:

- チャネルメッセージの**テキスト**コンテンツの読み取り。
- チャネルメッセージの**テキスト**コンテンツの送信。
- **個人（DM）**の添付ファイルの受信。

動作しないもの:

- チャネル/グループの**画像またはファイルの内容**（ペイロードには HTML スタブのみが含まれます）。
- SharePoint/OneDrive に保存された添付ファイルのダウンロード。
- ライブ Webhook イベントを超えたメッセージ履歴の読み取り。

### **Teams RSC + Microsoft Graph Application アクセス許可**の場合

追加される機能:

- ホストされたコンテンツ（メッセージに貼り付けられた画像）のダウンロード。
- SharePoint/OneDrive に保存された添付ファイルのダウンロード。
- Graph を介したチャネル/チャットのメッセージ履歴の読み取り。

### RSC と Graph API の比較

| 機能                     | RSC アクセス許可       | Graph API                              |
| ------------------------ | ---------------------- | -------------------------------------- |
| **リアルタイムメッセージ** | はい（Webhook 経由）   | いいえ（ポーリングのみ）               |
| **過去のメッセージ**     | いいえ                 | はい（履歴を照会可能）                 |
| **セットアップの複雑さ** | アプリマニフェストのみ | 管理者の同意 + トークンフローが必要    |
| **オフラインでの動作**   | いいえ（実行中である必要あり） | はい（いつでも照会可能）          |

**要点:** RSC はリアルタイムのリスニング用で、Graph API は履歴へのアクセス用です。オフライン中に見逃したメッセージを取得するには、`ChannelMessage.Read.All` を付与した Graph API が必要です（管理者の同意が必要）。

## Graph を有効にしたメディア + 履歴

使用する Teams のスコープとデータに必要な Microsoft Graph Application アクセス許可のみを有効にします:

1. Entra ID (Azure AD) **App Registration** → Graph **Application permissions**を追加:
   - チャネルの添付ファイルとチャネル履歴用の `ChannelMessage.Read.All`。
   - グループチャットの添付ファイルとグループチャット履歴用の `Chat.Read.All`。
   - SharePoint/OneDrive ストレージから添付ファイルのバイト列をダウンロードする必要がある場合は `Files.Read.All`。履歴のみを使用するセットアップでは不要です。
2. テナントに対して**管理者の同意を付与します**。
3. Teams アプリの**マニフェストバージョン**を引き上げて再アップロードし、**Teams にアプリを再インストールします**。
4. キャッシュされたアプリのメタデータを消去するために、**Teams を完全に終了して再起動します**。

### チャネル/グループファイルの復旧（`graphMediaFallback`）

Teams は、ボットに送信される HTML アクティビティからファイルマーカーを削除することがあります。その場合、Bot Framework アクティビティは通常の HTML メッセージと区別できず、完全な添付ファイル参照はメッセージの Graph コピーにのみ存在します。

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

これはチャネルとグループチャットにのみ適用されます。HTML アクティビティから直接ダウンロード可能なメディアが得られなかった場合、通常のメッセージやメンションのみのメッセージを含め、Graph メッセージ検索が 1 回追加されます。既存のインストールで追加の Graph トラフィックや権限エラーが自動的に発生しないよう、デフォルトは `false` です。

**ユーザーメンション：** 会話にすでに参加しているユーザーへの @メンションは、そのまま使用できます。**現在の会話に参加していない**ユーザーを動的に検索してメンションするには、`User.Read.All`（Application）権限を追加し、管理者の同意を付与します。

## 既知の制限事項

### Webhook のタイムアウト

Teams は HTTP Webhook 経由でメッセージを配信します。OpenClaw は、その Webhook リスナーに固定の HTTP サーバータイムアウトを適用します。非アクティブ状態は 30 秒、リクエスト全体は 30 秒、ヘッダー受信は 15 秒です。オプションの受信メディアとコンテキスト拡充には共有の 10 秒の割り当てがありますが、Teams SDK は Webhook レスポンスを返す前にエージェントターンが完了するまで待機します。ターン全体が Teams の再試行時間枠を超えると、次の事象が発生することがあります。

- Teams がメッセージを再試行する（重複が発生する）。
- 返信が失われる。

返信はエージェントが応答するとプロアクティブに送信されますが、エージェントの実行が遅い場合、Teams 側で再試行や重複が発生する可能性があります。

### Teams クラウドとサービス URL のサポート

この SDK ベースの Teams パスは、Microsoft Teams パブリッククラウドで実環境検証されています。

受信返信では、受信した Teams SDK のターンコンテキストを使用します。コンテキスト外のプロアクティブ操作（送信、編集、削除、カード、投票、ファイル同意メッセージ、キューに入れられた長時間実行の返信）では、保存された会話参照の `serviceUrl` を使用します。パブリッククラウドでは、デフォルトで Teams SDK のパブリッククラウド環境を使用し、パブリック Teams Connector ホスト `https://smba.trafficmanager.net/` 上の保存済み参照を許可します。

デフォルトはパブリッククラウドです。通常のパブリッククラウドボットでは、`channels.msteams.cloud` または `channels.msteams.serviceUrl` を設定する必要はありません。

パブリック以外の Teams クラウドでは、Microsoft が対応するプロアクティブ境界を公開している場合、`cloud` とその境界を設定します。

- `channels.msteams.cloud` は、認証、JWT 検証、トークンサービス、Graph スコープに使用する Teams SDK クラウドプリセットを選択します。
- `channels.msteams.serviceUrl` は、プロアクティブな送信、編集、削除、カード、投票、ファイル同意メッセージ、キューに入れられた長時間実行の返信を行う前に、保存された会話参照を検証するために使用する Bot Connector エンドポイント境界を選択します。USGov および DoD SDK クラウドでは必須です。China/21Vianet では、OpenClaw は SDK の `China` プリセットを使用し、Azure China Bot Framework チャネルホスト上の保存済みまたは設定済みサービス URL のみを受け入れます。

Microsoft は、Teams のプロアクティブメッセージングドキュメントの[会話の作成](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation)セクションで、グローバルなプロアクティブ Bot Connector エンドポイントを公開しています。利用可能な場合は受信アクティビティの `serviceUrl` を使用し、それ以外の場合は以下の Microsoft の表を使用します。

| Teams 環境 | OpenClaw の設定                                             | プロアクティブ `serviceUrl`                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Public            | cloud/serviceUrl の設定は不要                           | `https://smba.trafficmanager.net/teams`            |
| GCC               | `serviceUrl` を設定。個別の Teams SDK クラウドプリセットは存在しない | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | 受信アクティビティの `serviceUrl` を使用する           |

Microsoft が個別のプロアクティブサービス URL を文書化している一方で、Teams SDK が個別の GCC クラウドプリセットを公開していない GCC の例：

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

`channels.msteams.serviceUrl` は、サポートされている Microsoft Teams Bot Connector ホストに制限されます。サービス URL が設定されている場合、OpenClaw はプロアクティブな送信、編集、削除、カード、投票、またはキューに入れられた長時間実行の返信を実行する前に、保存された会話の `serviceUrl` が同じホストを使用していることを確認します。デフォルトのパブリッククラウド設定では、保存された会話がパブリック Teams Connector ホスト外を指している場合、OpenClaw は安全側に倒して処理を拒否します。保存された会話参照を最新にするため、クラウドまたはサービス URL の設定を変更した後、その会話から新しいメッセージを受信してください。

China/21Vianet には、Microsoft の Teams プロアクティブエンドポイント表に個別のグローバルプロアクティブ `smba` URL がありません。Teams SDK が Azure China の認証、トークン、JWT エンドポイントを使用するように、`cloud: "China"` を設定します。その後のプロアクティブ送信には、Azure China Bot Framework チャネル境界（`*.botframework.azure.cn`）上にある、受信した China Teams アクティビティから保存された会話参照、または明示的に設定されたサービス URL が必要です。OpenClaw が Graph リクエストを Azure China Graph エンドポイント経由でルーティングするようになるまで、`cloud: "China"` では Graph ベースの Teams ヘルパーは無効になります。

### 書式設定

Teams の Markdown は Slack や Discord より制限されています。

- 基本的な書式設定を使用できます：**太字**、_斜体_、`code`、リンク。
- 複雑な Markdown（表、ネストしたリスト）は正しくレンダリングされない場合があります。
- 投票とセマンティックプレゼンテーション送信では Adaptive Card がサポートされています（以下を参照）。

## 設定

主要な設定（共有チャネルパターンについては [/gateway/configuration](/ja-JP/gateway/configuration) を参照）：

- `channels.msteams.enabled`：チャネルを有効化または無効化します。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：ボットの認証情報。
- `channels.msteams.cloud`：Teams SDK クラウド環境（`Public`、`USGov`、`USGovDoD`、または `China`。デフォルトは `Public`）。USGov/DoD SDK クラウドでは `serviceUrl` とともに設定します。China では SDK プリセットと保存された Azure China Bot Framework の会話参照を使用し、Azure China Graph ルーティングが提供されるまで Graph ベースのヘルパーは無効になります。
- `channels.msteams.serviceUrl`：SDK のプロアクティブ操作に使用する Bot Connector サービス URL 境界。パブリッククラウドでは SDK のデフォルトを使用します。GCC（`https://smba.infra.gcc.teams.microsoft.com/teams`）、GCC High、または DoD では設定します。保存された会話参照が 21Vianet 運営の Teams から取得された場合、China では Azure China Bot Framework チャネルホストを受け入れます。
- `channels.msteams.webhook.port`（デフォルト `3978`）。
- `channels.msteams.webhook.path`（デフォルト `/api/messages`）。
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（デフォルト `pairing`）。
- `channels.msteams.allowFrom`：DM 許可リスト（AAD オブジェクト ID を推奨）。Graph にアクセスできる場合、ウィザードはセットアップ中に名前を ID に解決します。
- `channels.msteams.dangerouslyAllowNameMatching`：変更可能な UPN/表示名の照合と、チーム名/チャネル名による直接ルーティングを再び有効にするための緊急時トグル。
- `channels.msteams.textChunkLimit`：送信テキストのチャンクサイズ（文字数、デフォルト `4000`。より大きな値を設定しても上限は `4000`）。
- `channels.msteams.streaming.chunkMode`：長さによるチャンク分割の前に空行（段落境界）で分割するには、`length`（デフォルト）または `newline` を指定します。
- `channels.msteams.mediaAllowHosts`：受信添付ファイルホストの許可リスト（デフォルトは Microsoft/Teams ドメイン：Graph、SharePoint/OneDrive、Teams CDN、Bot Framework、Azure Media Services）。
- `channels.msteams.mediaAuthAllowHosts`：メディア再試行時に Authorization ヘッダーを付加するホストの許可リスト（デフォルトは Graph + Bot Framework ホスト）。
- `channels.msteams.graphMediaFallback`：チャネル/グループの HTML でファイルマーカーが省略されている場合に、Graph メッセージ検索を有効にします（デフォルト `false`。[チャネル/グループのファイル復旧](#channelgroup-file-recovery-graphmediafallback)を参照）。
- `channels.msteams.mediaMaxMb`：チャネルごとのメディアサイズ上限のオーバーライド（MB 単位）。未設定の場合は `agents.defaults.mediaMaxMb` にフォールバックします。
- `channels.msteams.requireMention`：チャネル/グループで @メンションを必須にします（デフォルト `true`）。
- `channels.msteams.replyStyle`：`thread | top-level`（[返信スタイル](#reply-style-threads-vs-posts)を参照）。
- `channels.msteams.teams.<teamId>.replyStyle`：チームごとのオーバーライド。
- `channels.msteams.teams.<teamId>.requireMention`：チームごとのオーバーライド。
- `channels.msteams.teams.<teamId>.tools`：チャネルのオーバーライドがない場合に使用される、チームごとのデフォルトツールポリシーオーバーライド（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.toolsBySender`：チームごと、送信者ごとのデフォルトツールポリシーオーバーライド（`"*"` ワイルドカードをサポート）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：チャネルごとのオーバーライド。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：チャネルごとのオーバーライド。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：チャネルごとのツールポリシーオーバーライド（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：チャネルごと、送信者ごとのツールポリシーオーバーライド（`"*"` ワイルドカードをサポート）。
- `toolsBySender` のキーには、明示的なプレフィックス `channel:`、`id:`、`e164:`、`username:`、`name:` を使用してください（プレフィックスのない従来のキーは引き続き `id:` のみにマッピングされます）。
- `channels.msteams.authType`：認証タイプ - `"secret"`（デフォルト）または `"federated"`。
- `channels.msteams.certificatePath`：PEM 証明書ファイルへのパス（フェデレーション + 証明書認証）。
- `channels.msteams.certificateThumbprint`：証明書のサムプリント。指定できますが、認証には必須ではありません。
- `channels.msteams.useManagedIdentity`：マネージド ID 認証を有効にします（フェデレーションモード）。
- `channels.msteams.managedIdentityClientId`：ユーザー割り当てマネージド ID のクライアント ID。
- `channels.msteams.sharePointSiteId`：グループチャット/チャネルでのファイルアップロード用 SharePoint サイト ID（[グループチャットでのファイル送信](#sending-files-in-group-chats)を参照）。
- `channels.msteams.welcomeCard`、`channels.msteams.groupWelcomeCard`、`channels.msteams.promptStarters`：最初の DM/グループ連絡時に表示されるウェルカム Adaptive Card と、推奨プロンプトボタン。
- `channels.msteams.responsePrefix`：送信返信の先頭に付加するテキスト。
- `channels.msteams.feedbackEnabled`（デフォルト `true`）、`channels.msteams.feedbackReflection`（デフォルト `true`）、`channels.msteams.feedbackReflectionCooldownMs`：返信に対する高評価/低評価フィードバックと、否定的フィードバック後の振り返りフォローアップ。
- `channels.msteams.sso`、`channels.msteams.delegatedAuth`：SSO ベースのフローに使用する Bot Framework OAuth 接続と委任 Graph スコープ。`sso.enabled: true` には `sso.connectionName` が必要です。

## ルーティングとセッション

- セッションキーは標準のエージェント形式に従います（[/concepts/session](/ja-JP/concepts/session)を参照）。
  - ダイレクトメッセージはメインセッションを共有します（`agent:<agentId>:<mainKey>`）。
  - チャネル/グループメッセージは会話 ID を使用します。
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 返信スタイル：スレッドと投稿

Teams には、同じ基盤データモデル上に 2 種類のチャネル UI スタイルがあります。

| スタイル                 | 説明                                                     | 推奨される `replyStyle` |
| ------------------------ | -------------------------------------------------------- | ----------------------- |
| **投稿**（従来型）       | メッセージはカードとして表示され、その下に返信スレッドが続く | `thread`（デフォルト）  |
| **スレッド**（Slack 型） | メッセージは Slack のように直線的に流れる                | `top-level`             |

**問題:** Teams API では、チャンネルがどの UI スタイルを使用しているか確認できません。誤った `replyStyle` を使用すると、次のようになります。

- スレッド型チャンネルで `thread` → 返信が不自然にネストして表示されます。
- 投稿型チャンネルで `top-level` → 返信がスレッド内ではなく、個別のトップレベル投稿として表示されます。

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

### 解決の優先順位

ボットがチャンネルに返信を送信するとき、`replyStyle` は最も具体的なオーバーライドからデフォルトへ向かって解決されます。最初の `undefined` ではない値が使用されます。

1. **チャンネル単位** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **チーム単位** - `channels.msteams.teams.<teamId>.replyStyle`
3. **グローバル** - `channels.msteams.replyStyle`
4. **暗黙のデフォルト** - `requireMention` から導出:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

明示的な `replyStyle` を指定せずにグローバルで `requireMention: false` を設定すると、受信メッセージがスレッドへの返信であっても、投稿型チャンネルでメンションがトップレベル投稿として表示されます。予期しない動作を避けるには、グローバル、チーム、またはチャンネルのレベルで `replyStyle: "thread"` を固定してください。

保存済みのチャンネル会話へのプロアクティブ送信（キューに入れられたツール呼び出しへの返信、長時間実行されるエージェント）にも、同じチーム／チャンネル解決が適用されます。グループチャットおよび個人（DM）の会話では、`replyStyle` に関係なく、プロアクティブ送信は常に `top-level` に解決されます。

### スレッドコンテキストの保持

`replyStyle: "thread"` が有効で、チャンネルスレッド内からボットが @メンションされた場合、OpenClaw は元のスレッドルートを送信先の会話参照（`19:...@thread.tacv2;messageid=<root>`）に再付加し、返信が同じスレッド内に表示されるようにします。これは、ライブ（ターン内）送信と、Bot Framework のターンコンテキストが期限切れになった後に行われるプロアクティブ送信（長時間実行されるエージェント、`mcp__openclaw__message` を介したキュー内のツール呼び出しへの返信など）の両方に適用されます。

スレッドルートは、会話参照に保存された `threadId` から取得されます。`threadId` が導入される前に保存された古い参照では、`activityId`（最後に会話を初期化した受信アクティビティ）にフォールバックするため、既存のデプロイは再初期化せずに引き続き動作します。

`replyStyle: "top-level"` が有効な場合、チャンネルスレッドへの受信メッセージには、意図的に新しいトップレベル投稿として返信します。スレッドサフィックスは付加されません。これはスレッド型チャンネルでは正しい動作です。スレッド返信を想定していた場所にトップレベル投稿が表示される場合、そのチャンネルの `replyStyle` が正しく設定されていません。

## 添付ファイルと画像

**現在の制限事項:**

- **DM:** 画像とファイル添付は、Teams ボットファイル API を介して動作します。
- **チャンネル／グループ:** 添付ファイルは M365 ストレージ（SharePoint／OneDrive）に保存されます。Webhook ペイロードには HTML スタブのみが含まれ、実際のファイルバイトは含まれません。チャンネルの添付ファイルをダウンロードするには、**Graph API 権限が必要です**。
- ファイルを明示的に先行送信するには、`media`／`filePath`／`path` とともに `action=upload-file` を使用します。省略可能な `message` は付随するテキスト／コメントになり、`filename`（または `title`）はアップロード名を上書きします。

Graph 権限がない場合、画像を含むチャンネルメッセージはテキストのみで届きます（ボットは画像コンテンツにアクセスできません）。
デフォルトでは、OpenClaw は Microsoft／Teams のホスト名からのみメディアをダウンロードします。`channels.msteams.mediaAllowHosts` で上書きできます（任意のホストを許可するには `["*"]` を使用）。
認証ヘッダーは、`channels.msteams.mediaAuthAllowHosts` に含まれるホストにのみ付加されます（デフォルトは Graph + Bot Framework ホスト）。このリストは厳密に保ってください（マルチテナントのサフィックスは避けてください）。

## グループチャットでのファイル送信

ボットは、組み込みの FileConsentCard フローを使用して DM でファイルを送信できます。**グループチャット／チャンネルでファイルを送信する**には、追加設定が必要です。

| コンテキスト             | ファイルの送信方法                               | 必要な設定                                      |
| ------------------------ | ------------------------------------------------ | ----------------------------------------------- |
| **DM**                   | FileConsentCard → ユーザーが承認 → ボットがアップロード | そのまま動作                                    |
| **グループチャット／チャンネル** | SharePoint にアップロード → ネイティブファイルカード | `sharePointSiteId` + Graph 権限が必要            |
| **画像（すべてのコンテキスト）** | Base64 エンコードされたインライン                | そのまま動作                                    |

### グループチャットで SharePoint が必要な理由

ボットはアプリケーション ID を使用しますが、Microsoft Graph の `/me` リソースには[サインイン済みのユーザーが必要です](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0)。グループチャット／チャンネルでファイルを送信するために、ボットはファイルを **SharePoint サイト**にアップロードし、共有リンクを作成します。

### 設定

1. Entra ID (Azure AD) → App Registration で **Graph API 権限を追加**します。
   - `Sites.ReadWrite.All` (Application) - SharePoint にファイルをアップロードします。
   - `Chat.Read.All` (Application) - 省略可能。ユーザーごとの共有リンクを有効にします。
2. テナントに対して**管理者の同意を付与**します。
3. **SharePoint サイト ID を取得します。**

   ```bash
   # Graph Explorer または有効なトークンを使用した curl 経由:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 例: "contoso.sharepoint.com/sites/BotFiles" にあるサイトの場合
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # レスポンスに次が含まれます: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw を設定します。**

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

### 共有動作

| 権限                                    | 共有動作                                                     |
| --------------------------------------- | ------------------------------------------------------------ |
| `Sites.ReadWrite.All` のみ              | 組織全体の共有リンク（組織内のすべてのユーザーがアクセス可能） |
| `Sites.ReadWrite.All` + `Chat.Read.All` | ユーザーごとの共有リンク（チャットメンバーのみアクセス可能）   |

チャット参加者のみがファイルにアクセスできるため、ユーザーごとの共有の方が安全です。`Chat.Read.All` がない場合、ボットは組織全体の共有にフォールバックします。

### フォールバック動作

| シナリオ                                              | 結果                                                   |
| ----------------------------------------------------- | ------------------------------------------------------ |
| グループチャット + ファイル + `sharePointSiteId` 設定済み | SharePoint にアップロードし、ネイティブファイルカードを送信 |
| グループチャット + ファイル + `sharePointSiteId` なし | 対処可能な設定エラーで失敗                             |
| 個人チャット + ファイル                               | FileConsentCard フロー（SharePoint なしで動作）        |
| 任意のコンテキスト + 画像                             | Base64 エンコードされたインライン（SharePoint なしで動作） |

### ファイルの保存場所

アップロードされたファイルは、設定した SharePoint サイトのデフォルトドキュメントライブラリ内にある `/OpenClawShared/` フォルダーに保存されます。

## 投票（Adaptive Cards）

OpenClaw は Teams の投票を Adaptive Cards として送信します（Teams にネイティブの投票 API はありません）。

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`。
- 投票は Gateway によって、`state/openclaw.sqlite` 内の OpenClaw Plugin 状態 SQLite に記録されます。
- 既存の `msteams-polls.json` ファイルは、実行中の Plugin ではなく `openclaw doctor --fix` によってインポートされます。
- 投票を記録するには、Gateway がオンラインのままである必要があります。
- 投票結果の概要は自動投稿されず、投票結果用の CLI もまだありません。

## プレゼンテーションカード

`message` ツール、CLI、または通常の返信配信を使用して、セマンティックなプレゼンテーションペイロードを Teams のユーザーまたは会話に送信します。OpenClaw は、汎用プレゼンテーション契約から Teams Adaptive Cards としてレンダリングします。

`presentation` パラメーターはセマンティックブロックを受け入れます。`presentation` を指定した場合、メッセージテキストは省略可能です。ボタンは Adaptive Card の送信アクションまたは URL アクションとしてレンダリングされます。選択メニューは Teams レンダラーでネイティブ対応していないため、OpenClaw は配信前に読みやすいテキストへダウングレードします。

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

ターゲット形式の詳細については、以下の[ターゲット形式](#target-formats)を参照してください。

## ターゲット形式

MSTeams のターゲットでは、ユーザーと会話を区別するためにプレフィックスを使用します。

| ターゲット種別       | 形式                             | 例                                                                                                     |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| ユーザー（ID 指定）  | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                            |
| ユーザー（名前指定） | `user:<display-name>`            | `user:John Smith`（Graph API が必要）                                                                  |
| グループ／チャンネル | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`                                                               |
| グループ／チャンネル（未加工） | `<conversation-id>`      | `19:abc123...@thread.tacv2`、`19:...@unq.gbl.spaces`、またはプレフィックスなしの `a:`／`8:orgid:`／`29:` Bot Framework ID |

**CLI の例:**

```bash
# ID でユーザーに送信
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "こんにちは"

# 表示名でユーザーに送信（Graph API 検索を実行）
openclaw message send --channel msteams --target "user:John Smith" --message "こんにちは"

# グループチャットまたはチャンネルに送信
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
`user:` プレフィックスがない場合、名前はデフォルトでグループまたはチームとして解決されます。表示名でユーザーを指定する場合は、必ず `user:` を使用してください。
</Note>

## プロアクティブメッセージング

- OpenClaw はユーザーが操作した時点で会話参照を保存するため、プロアクティブメッセージはユーザーが操作した**後にのみ**送信できます。
- `dmPolicy` と許可リストによる制御については、[/gateway/configuration](/ja-JP/gateway/configuration)を参照してください。

## チーム ID とチャンネル ID（よくある落とし穴）

Teams URL の `groupId` クエリパラメータは、設定に使用するチーム ID では**ありません**。代わりに、URL パスから ID を抽出してください。

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

- チームキー = `/team/` の後のパスセグメント（URL デコード済み。例: `19:Bk4j...@thread.tacv2`。古いテナントでは `@thread.skype` と表示される場合がありますが、これも有効です）。
- チャネルキー = `/channel/` の後のパスセグメント（URL デコード済み）。
- OpenClaw のルーティングでは `groupId` クエリパラメータを**無視**してください。これは Microsoft Entra グループ ID であり、受信する Teams アクティビティで使用される Bot Framework 会話 ID ではありません。

## プライベートチャネル

ボットのプライベートチャネル対応には制限があります。

| 機能                         | 標準チャネル | プライベートチャネル       |
| ---------------------------- | ------------ | -------------------------- |
| ボットのインストール         | はい         | 制限あり                   |
| リアルタイムメッセージ（Webhook） | はい         | 動作しない場合がある       |
| RSC 権限                     | はい         | 異なる動作をする場合がある |
| @メンション                  | はい         | ボットにアクセス可能な場合 |
| Graph API 履歴               | はい         | はい（権限が必要）         |

**プライベートチャネルが動作しない場合の回避策:**

1. ボットとのやり取りには標準チャネルを使用します。
2. DM を使用します。ユーザーはいつでもボットに直接メッセージを送信できます。
3. 履歴へのアクセスには Graph API を使用します（`ChannelMessage.Read.All` が必要です）。

## トラブルシューティング

### よくある問題

- **チャネルに画像が表示されない:** Graph 権限または管理者の同意が不足しています。Teams アプリを再インストールし、Teams を完全に終了してから再度開いてください。
- **チャネルで応答がない:** デフォルトではメンションが必要です。`channels.msteams.requireMention=false` を設定するか、チームまたはチャネルごとに設定してください。
- **バージョンの不一致（Teams に古いマニフェストが引き続き表示される）:** アプリを削除して再度追加し、Teams を完全に終了して更新してください。
- **Webhook から 401 Unauthorized が返される:** Azure JWT なしで手動テストした場合は想定される結果です。エンドポイントには到達可能ですが、認証に失敗したことを示します。正しくテストするには Azure Web Chat を使用してください。

### マニフェストのアップロードエラー

- **「Icon file cannot be empty」:** マニフェストが参照するアイコンファイルのサイズが 0 バイトです。有効な PNG アイコン（`outline.png` は 32x32、`color.png` は 192x192）を作成してください。
- **「webApplicationInfo.Id already in use」:** アプリが別のチームまたはチャットにまだインストールされています。先にそのアプリを見つけてアンインストールするか、反映されるまで 5-10 分待ってください。
- **アップロード時の「Something went wrong」:** 代わりに [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) からアップロードし、ブラウザーの DevTools（F12）→ Network タブを開いて、実際のエラーが記載されたレスポンス本文を確認してください。
- **サイドロードに失敗する:** 「Upload a custom app」ではなく「Upload an app to your org's app catalog」を試してください。これにより、サイドロードの制限を回避できる場合がよくあります。

### RSC 権限が機能しない

1. `webApplicationInfo.id` がボットの App ID と完全に一致していることを確認します。
2. アプリを再アップロードし、チームまたはチャットに再インストールします。
3. 組織の管理者が RSC 権限をブロックしていないか確認します。
4. 適切なスコープを使用していることを確認します。チームには `ChannelMessage.Read.Group`、グループチャットには `ChatMessage.Read.Chat` を使用します。

## 参考資料

- [Azure Bot の作成](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot のセットアップガイド
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams アプリの作成と管理
- [Teams アプリのマニフェストスキーマ](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [RSC を使用したチャネルメッセージの受信](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC 権限リファレンス](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams ボットのファイル処理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（チャネル／グループには Graph が必要）
- [プロアクティブメッセージング](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - ボット管理用の Teams CLI

## 関連項目

- [チャネルの概要](/ja-JP/channels) - サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) - DM の認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションによる制御
- [チャネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと強化策
