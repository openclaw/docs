---
read_when:
    - OpenClaw の Twitch チャット連携の設定
sidebarTitle: Twitch
summary: Twitchチャットボット：インストール、認証情報、アクセス制御、トークンの更新
title: Twitch
x-i18n:
    generated_at: "2026-07-11T22:03:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

Twitch のチャット（IRC）インターフェースを Twurple クライアント経由で利用する Twitch チャット対応です。OpenClaw は Twitch ボットアカウントとしてサインインし、設定されたアカウントごとに 1 つのチャンネルへ参加し、そのチャンネルで返信します。

## インストール

Twitch は公式 Plugin として提供され、コアインストールには含まれません。

<Tabs>
  <Tab title="npm レジストリ">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="ローカルチェックアウト">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

`plugins install` は Plugin を登録して有効にします。`openclaw onboard` または `openclaw channels add` で Twitch を選択すると、必要に応じてインストールされます。現在のリリースを追従するにはバージョンなしのパッケージ名を使用し、再現可能なインストールが必要な場合にのみ正確なバージョンを固定してください。OpenClaw 2026.4.10 以降が必要です。

詳細：[Plugin](/ja-JP/tools/plugin)

## クイックセットアップ

<Steps>
  <Step title="Plugin をインストールする">
    上記の[インストール](#install)を参照してください。
  </Step>
  <Step title="Twitch ボットアカウントを作成する">
    ボット専用の Twitch アカウントを作成します（既存のアカウントを使用することもできます）。
  </Step>
  <Step title="認証情報を生成する">
    [Twitch Token Generator](https://twitchtokengenerator.com/) を使用します。

    - **Bot Token** を選択する
    - スコープ `chat:read` と `chat:write` が選択されていることを確認する
    - **Client ID** と **Access Token** をコピーする

  </Step>
  <Step title="Twitch ユーザー ID を確認する">
    [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) を使用して、ユーザー名を Twitch ユーザー ID に変換します。
  </Step>
  <Step title="トークンを設定する">
    - 環境変数：`OPENCLAW_TWITCH_ACCESS_TOKEN=...`（デフォルトアカウントのみ）
    - または設定：`channels.twitch.accessToken`

    両方が設定されている場合は設定が優先されます（環境変数はデフォルトアカウントのフォールバックとしてのみ使用されます）。

  </Step>
  <Step title="Gateway を起動する">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
未承認のユーザーがボットを起動できないように、アクセス制御（`allowFrom` または `allowedRoles`）を追加してください。`requireMention` のデフォルトは `true` です。
</Warning>

最小設定：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // ボットの Twitch アカウント（認証に使用）
      accessToken: "oauth:abc123...", // OAuth アクセストークン（または OPENCLAW_TWITCH_ACCESS_TOKEN 環境変数を使用）
      clientId: "xyz789...", // Token Generator から取得したクライアント ID
      channel: "yourchannel", // 参加する Twitch チャンネルのチャット（必須）
      allowFrom: ["123456789"], // （推奨）自分の Twitch ユーザー ID のみ
    },
  },
}
```

## 概要

- Gateway が所有する Twitch チャンネルです。
- 決定的なルーティング：返信は常に、メッセージの送信元である Twitch チャンネルへ返されます。
- 参加した各チャンネルは、分離されたグループセッションキー `agent:<agentId>:twitch:group:<channel>` に対応します。
- `username` はボットのアカウント（認証するアカウント）、`channel` は参加するチャットルームです。各アカウントエントリは正確に 1 つのチャンネルへ参加します。
- トークンは `oauth:` プレフィックスの有無にかかわらず使用できます。OpenClaw はどちらの形式も正規化します（セットアップウィザードでは `oauth:` 形式を使用します）。

## トークンの更新（任意）

[Twitch Token Generator](https://twitchtokengenerator.com/) のトークンは OpenClaw では更新できません。期限が切れたら再生成してください（有効期間は数時間で、アプリの登録は不要です）。

自動更新を使用するには、[Twitch Developer Console](https://dev.twitch.tv/console) で独自のアプリを作成し、以下を追加します。

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

両方を設定すると、Plugin は期限切れ前にトークンを更新する認証プロバイダーを使用し、更新のたびにログを記録します。`refreshToken` がない場合は `token refresh disabled (no refresh token)` とログに記録され、`clientSecret` がない場合は静的な（更新されない）トークンへフォールバックします。

## 複数アカウント対応

アカウントごとの認証情報を含む `channels.twitch.accounts` を使用します。共通パターンについては[設定](/ja-JP/gateway/configuration)を参照してください。

例（2 つのチャンネルで 1 つのボットアカウントを使用）：

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "yourchannel",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

<Note>
各アカウントエントリには固有の `accessToken` が必要です（環境変数が対象とするのはデフォルトアカウントのみです）。1 つのアカウントは正確に 1 つのチャンネルへ参加するため、2 つのチャンネルへ参加するには 2 つのアカウントが必要です。`channels.twitch.defaultAccount` でデフォルトにするアカウントを選択します。
</Note>

## アクセス制御

`allowFrom` は Twitch ユーザー ID の厳格な許可リストです。これを設定すると `allowedRoles` は無視されます。代わりにロールベースのアクセスを使用する場合は、`allowFrom` を設定しないでください。

**利用可能なロール：** `"moderator"`、`"owner"`、`"vip"`、`"subscriber"`、`"all"`。

<Tabs>
  <Tab title="ユーザー ID 許可リスト（最も安全）">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowFrom: ["123456789", "987654321"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="ロールベース">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowedRoles: ["moderator", "vip"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="@メンション要件を無効にする">
    デフォルトでは `requireMention` は `true` です。許可されたすべてのメッセージに応答するには、次のように設定します。

    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              requireMention: false,
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

<Note>
**ユーザー ID を使用する理由：** ユーザー名は変更できるため、なりすましが可能になります。ユーザー ID は永続的です。

[ユーザー名から ID への変換ツール](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)で自分の ID を確認できます。
</Note>

## トラブルシューティング

最初に、診断コマンドを実行します。

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="ボットがメッセージに応答しない">
    - **アクセス制御を確認する：** 自分のユーザー ID が `allowFrom` に含まれていることを確認するか、テストのため一時的に `allowFrom` を削除して `allowedRoles: ["all"]` を設定します。
    - **メンションゲートを確認する：** `requireMention: true`（デフォルト）の場合、メッセージでボットのユーザー名を @メンションする必要があります。
    - **ボットがチャンネルに参加していることを確認する：** ボットは `channel` で指定されたチャンネルにのみ参加します。

  </Accordion>
  <Accordion title="トークンの問題">
    「接続に失敗しました」または認証エラーが発生する場合：

    - `accessToken` が OAuth アクセストークンの値であることを確認する（`oauth:` プレフィックスは任意）
    - トークンに `chat:read` と `chat:write` のスコープがあることを確認する
    - トークン更新を使用している場合は、`clientSecret` と `refreshToken` が設定されていることを確認する

  </Accordion>
  <Accordion title="トークン更新が機能しない">
    ログで更新イベントを確認します。

    ```text
    mybot に環境変数のトークンソースを使用
    ユーザー 123456 のアクセストークンを更新しました（14400 秒後に期限切れ）
    ```

    `token refresh disabled (no refresh token)` が表示される場合：

    - `clientSecret` が指定されていることを確認する
    - `refreshToken` が指定されていることを確認する

  </Accordion>
</AccordionGroup>

## 設定

### アカウント設定

<ParamField path="username" type="string" required>
  ボットのユーザー名（認証するアカウント）。
</ParamField>
<ParamField path="accessToken" type="string" required>
  `chat:read` と `chat:write` を持つ OAuth アクセストークン（デフォルトアカウントでは設定または環境変数）。
</ParamField>
<ParamField path="clientId" type="string" required>
  Twitch クライアント ID（Token Generator または独自のアプリから取得）。スキーマ上は任意ですが、接続には必須です。
</ParamField>
<ParamField path="channel" type="string" required>
  参加するチャンネル。
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  このアカウントを有効にします。
</ParamField>
<ParamField path="clientSecret" type="string">
  任意：トークンの自動更新に使用します。
</ParamField>
<ParamField path="refreshToken" type="string">
  任意：トークンの自動更新に使用します。
</ParamField>
<ParamField path="expiresIn" type="number">
  トークンの有効期限（秒単位、更新の追跡用）。
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  トークンを取得した時点のタイムスタンプ（更新の追跡用）。
</ParamField>
<ParamField path="allowFrom" type="string[]">
  ユーザー ID の許可リスト。設定するとロールは無視されます。
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  ロールベースのアクセス制御。
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  ボットを起動するために @メンションを必須にします。
</ParamField>
<ParamField path="responsePrefix" type="string">
  このアカウントの送信応答プレフィックスを上書きします。
</ParamField>

### プロバイダーオプション

- `channels.twitch.enabled` - チャンネルの起動を有効化または無効化
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - 簡略化された単一アカウント設定（暗黙の `default` アカウント。`accounts.default` より優先）
- `channels.twitch.accounts.<accountName>` - 複数アカウント設定（上記のすべてのアカウントフィールド）
- `channels.twitch.defaultAccount` - デフォルトにするアカウント名
- `channels.twitch.markdown.tables` - Markdown テーブルのレンダリングモード（`off` | `bullets` | `code` | `block`）

完全な例：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## ツールアクション

エージェントは、メッセージツールの `send` アクションを通じて Twitch メッセージを送信できます。

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` は任意で、デフォルトではアカウントに設定された `channel` が使用されます。

## 安全性と運用

- **トークンをパスワードと同様に扱う** - トークンを Git にコミットしないでください。
- 長時間稼働するボットでは**トークンの自動更新を使用する**。
- アクセス制御には、ユーザー名ではなく**ユーザー ID の許可リストを使用する**。
- トークン更新イベントと接続状態を確認するために**ログを監視する**。
- **トークンのスコープを最小限にする** - `chat:read` と `chat:write` のみを要求してください。
- **問題が解決しない場合**：ほかのプロセスがセッションを所有していないことを確認してから、Gateway を再起動します。

## 制限

- 1 メッセージあたり **500 文字**。長い返信は単語の境界で分割されます。
- 送信前に Markdown は除去されます（Twitch チャットはプレーンテキストで、改行はスペースになります）。
- OpenClaw 自体はレート制限を追加しません。Twurple チャットクライアントが Twitch のレート制限を処理します。

## 関連項目

- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化策
