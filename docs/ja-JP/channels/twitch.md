---
read_when:
    - OpenClaw の Twitch チャット連携を設定する
sidebarTitle: Twitch
summary: 'Twitch チャットボット: インストール、認証情報、アクセス制御、トークン更新'
title: Twitch
x-i18n:
    generated_at: "2026-07-05T11:06:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

Twurple クライアント経由で Twitch のチャット (IRC) インターフェイス上の Twitch チャットをサポートします。OpenClaw は Twitch bot アカウントとしてサインインし、設定済みアカウントごとに 1 つのチャンネルに参加して、そのチャンネルで返信します。

## インストール

Twitch は公式 plugin として提供されます。core インストールには含まれません。

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

`plugins install` は plugin を登録して有効化します。`openclaw onboard` または `openclaw channels add` の実行中に Twitch を選ぶと、必要に応じてインストールされます。現在のリリースに追従するには素のパッケージ名を使い、再現可能なインストールが必要な場合のみ正確なバージョンに固定してください。OpenClaw 2026.4.10 以降が必要です。

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ

<Steps>
  <Step title="Install the plugin">
    上記の [インストール](#install) を参照してください。
  </Step>
  <Step title="Create a Twitch bot account">
    bot 専用の Twitch アカウントを作成します (または既存のアカウントを使用します)。
  </Step>
  <Step title="Generate credentials">
    [Twitch Token Generator](https://twitchtokengenerator.com/) を使います:

    - **Bot Token** を選択
    - スコープ `chat:read` と `chat:write` が選択されていることを確認
    - **Client ID** と **Access Token** をコピー

  </Step>
  <Step title="Find your Twitch user ID">
    [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) を使って、ユーザー名を Twitch ユーザー ID に変換します。
  </Step>
  <Step title="Configure the token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (デフォルトアカウントのみ)
    - または config: `channels.twitch.accessToken`

    両方が設定されている場合、config が優先されます (env var はデフォルトアカウント用のフォールバックにすぎません)。

  </Step>
  <Step title="Start the gateway">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
未承認ユーザーが bot をトリガーできないように、アクセス制御 (`allowFrom` または `allowedRoles`) を追加してください。`requireMention` のデフォルトは `true` です。
</Warning>

最小 config:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account (authenticates)
      accessToken: "oauth:abc123...", // OAuth access token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "yourchannel", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

## 概要

- Gateway が所有する Twitch チャンネル。
- 決定論的ルーティング: 返信は常に、メッセージが来た Twitch チャンネルへ戻ります。
- 参加した各チャンネルは、分離されたグループセッションキー `agent:<agentId>:twitch:group:<channel>` にマップされます。
- `username` は bot のアカウント (認証する主体)、`channel` は参加するチャットルームです。1 つのアカウントエントリは正確に 1 つのチャンネルに参加します。
- token は `oauth:` プレフィックスの有無にかかわらず動作します。OpenClaw はどちらの形式も正規化します (セットアップウィザードは `oauth:` 形式を想定します)。

## token 更新 (任意)

[Twitch Token Generator](https://twitchtokengenerator.com/) からの token は OpenClaw では更新できません - 期限切れになったら再生成してください (有効期間は数時間で、アプリ登録は不要です)。

自動更新には、[Twitch Developer Console](https://dev.twitch.tv/console) で独自のアプリを作成し、次を追加します:

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

両方が設定されている場合、plugin は期限切れ前に token を更新し、各更新をログに記録する更新対応の認証プロバイダーを使用します。`refreshToken` がない場合は `token refresh disabled (no refresh token)` をログに記録します。`clientSecret` がない場合は、静的な (更新しない) token にフォールバックします。

## マルチアカウントサポート

アカウントごとの認証情報には `channels.twitch.accounts` を使用します。共有パターンについては [設定](/ja-JP/gateway/configuration) を参照してください。

例 (1 つの bot アカウントを 2 つのチャンネルで使う場合):

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
すべてのアカウントエントリには個別の `accessToken` が必要です (env var が対象にするのはデフォルトアカウントのみです)。1 つのアカウントは正確に 1 つのチャンネルに参加するため、2 つのチャンネルに参加するには 2 つのアカウントが必要です。`channels.twitch.defaultAccount` は、どのアカウントをデフォルトにするかを選択します。
</Note>

## アクセス制御

`allowFrom` は Twitch ユーザー ID の厳格な許可リストです。設定されている場合、`allowedRoles` は無視されます。ロールベースのアクセスを使うには、`allowFrom` を未設定のままにしてください。

**利用可能なロール:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`。

<Tabs>
  <Tab title="User ID allowlist (most secure)">
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
  <Tab title="Role-based">
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
  <Tab title="Disable @mention requirement">
    デフォルトでは、`requireMention` は `true` です。許可されたすべてのメッセージに応答するには:

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
**なぜユーザー ID なのか?** ユーザー名は変更できるため、なりすましを許してしまう可能性があります。ユーザー ID は永続的です。

自分の ID は [username to ID converter](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) で確認できます。
</Note>

## トラブルシューティング

まず、診断コマンドを実行します:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot does not respond to messages">
    - **アクセス制御を確認:** 自分のユーザー ID が `allowFrom` に含まれていることを確認するか、テストのために一時的に `allowFrom` を削除して `allowedRoles: ["all"]` を設定します。
    - **メンションゲートを確認:** `requireMention: true` (デフォルト) の場合、メッセージは bot のユーザー名を @mention する必要があります。
    - **bot がチャンネルにいることを確認:** bot は `channel` で指定されたチャンネルにのみ参加します。

  </Accordion>
  <Accordion title="Token issues">
    "Failed to connect" または認証エラー:

    - `accessToken` が OAuth access token の値であることを確認します (`oauth:` プレフィックスは任意です)
    - token に `chat:read` と `chat:write` スコープがあることを確認します
    - token 更新を使っている場合は、`clientSecret` と `refreshToken` が設定されていることを確認します

  </Accordion>
  <Accordion title="Token refresh not working">
    更新イベントのログを確認します:

    ```text
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    `token refresh disabled (no refresh token)` が表示される場合:

    - `clientSecret` が指定されていることを確認します
    - `refreshToken` が指定されていることを確認します

  </Accordion>
</AccordionGroup>

## Config

### アカウント config

<ParamField path="username" type="string" required>
  Bot ユーザー名 (認証するアカウント)。
</ParamField>
<ParamField path="accessToken" type="string" required>
  `chat:read` と `chat:write` を持つ OAuth access token (デフォルトアカウントでは config または env)。
</ParamField>
<ParamField path="clientId" type="string" required>
  Twitch Client ID (Token Generator または自分のアプリから)。schema 上は任意ですが、接続には必須です。
</ParamField>
<ParamField path="channel" type="string" required>
  参加するチャンネル。
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  このアカウントを有効化します。
</ParamField>
<ParamField path="clientSecret" type="string">
  任意: token の自動更新用。
</ParamField>
<ParamField path="refreshToken" type="string">
  任意: token の自動更新用。
</ParamField>
<ParamField path="expiresIn" type="number">
  token の有効期限 (秒単位、更新追跡用)。
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  token が取得された時刻のタイムスタンプ (更新追跡用)。
</ParamField>
<ParamField path="allowFrom" type="string[]">
  ユーザー ID 許可リスト。設定されている場合、ロールは無視されます。
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  ロールベースのアクセス制御。
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  bot をトリガーするには @mention を必須にします。
</ParamField>
<ParamField path="responsePrefix" type="string">
  このアカウントの送信応答 prefix override。
</ParamField>

### プロバイダーオプション

- `channels.twitch.enabled` - チャンネル起動を有効化/無効化
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - 簡略化された単一アカウント config (暗黙の `default` アカウント。`accounts.default` より優先)
- `channels.twitch.accounts.<accountName>` - マルチアカウント config (上記の全アカウントフィールド)
- `channels.twitch.defaultAccount` - どのアカウント名をデフォルトにするか
- `channels.twitch.markdown.tables` - Markdown テーブルのレンダリングモード (`off` | `bullets` | `code` | `block`)

完全な例:

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

agent は message tool の `send` action を通じて Twitch メッセージを送信できます:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` は任意で、デフォルトではアカウントに設定された `channel` になります。

## 安全性と運用

- **token はパスワードと同じように扱う** - token を git にコミットしないでください。
- 長時間稼働する bot には **token の自動更新を使う**。
- アクセス制御にはユーザー名ではなく **ユーザー ID 許可リストを使う**。
- token 更新イベントと接続状態について **ログを監視する**。
- **token のスコープは最小限にする** - `chat:read` と `chat:write` のみを要求してください。
- **行き詰まった場合**: 他のプロセスがセッションを所有していないことを確認してから Gateway を再起動します。

## 制限

- メッセージあたり **500 文字**。より長い返信は単語境界で分割されます。
- 送信前に Markdown は取り除かれます (Twitch チャットはプレーンテキストです。改行はスペースになります)。
- OpenClaw は独自のレート制限を追加しません。Twurple チャットクライアントが Twitch のレート制限を処理します。

## 関連

- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [チャンネル概要](/ja-JP/channels) — サポートされるすべてのチャンネル
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
