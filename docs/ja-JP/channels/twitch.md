---
read_when:
    - OpenClaw 向け Twitch チャット連携の設定
sidebarTitle: Twitch
summary: Twitch チャットボットの構成とセットアップ
title: Twitch
x-i18n:
    generated_at: "2026-05-02T22:16:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d5f16d1369e2783bec6e0c7b2d7bee8aae86f2a424b77b9adf14850de0f20b
    source_path: channels/twitch.md
    workflow: 16
---

Twitch チャットを IRC 接続経由でサポートします。OpenClaw は Twitch ユーザー（bot アカウント）として接続し、チャンネル内のメッセージを受信および送信します。

## 同梱 Plugin

<Note>
Twitch は現在の OpenClaw リリースでは同梱 Plugin として提供されるため、通常のパッケージビルドでは別途インストールは不要です。
</Note>

Twitch を含まない古いビルドまたはカスタムインストールを使用している場合は、npm パッケージを直接インストールします。

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

現在の公式リリースタグに追従するには、素のパッケージを使用します。再現可能なインストールが必要な場合にのみ、厳密な
バージョンを固定してください。

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ（初心者向け）

<Steps>
  <Step title="Ensure plugin is available">
    現在のパッケージ版 OpenClaw リリースには、すでに同梱されています。古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
  </Step>
  <Step title="Create a Twitch bot account">
    bot 用の専用 Twitch アカウントを作成します（または既存のアカウントを使用します）。
  </Step>
  <Step title="Generate credentials">
    [Twitch Token Generator](https://twitchtokengenerator.com/) を使用します。

    - **Bot Token** を選択
    - スコープ `chat:read` と `chat:write` が選択されていることを確認
    - **Client ID** と **Access Token** をコピー

  </Step>
  <Step title="Find your Twitch user ID">
    [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) を使用して、ユーザー名を Twitch ユーザー ID に変換します。
  </Step>
  <Step title="Configure the token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...`（デフォルトアカウントのみ）
    - または config: `channels.twitch.accessToken`

    両方が設定されている場合は、config が優先されます（env フォールバックはデフォルトアカウントのみ）。

  </Step>
  <Step title="Start the gateway">
    設定済みチャンネルで Gateway を起動します。
  </Step>
</Steps>

<Warning>
認可されていないユーザーが bot をトリガーできないように、アクセス制御（`allowFrom` または `allowedRoles`）を追加してください。`requireMention` のデフォルトは `true` です。
</Warning>

最小構成:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## 概要

- Gateway が所有する Twitch チャンネルです。
- 決定的ルーティング: 返信は常に Twitch に戻されます。
- 各アカウントは、分離されたセッションキー `agent:<agentId>:twitch:<accountName>` に対応します。
- `username` は bot のアカウント（認証する側）で、`channel` は参加するチャットルームです。

## セットアップ（詳細）

### 認証情報を生成する

[Twitch Token Generator](https://twitchtokengenerator.com/) を使用します。

- **Bot Token** を選択
- スコープ `chat:read` と `chat:write` が選択されていることを確認
- **Client ID** と **Access Token** をコピー

<Note>
手動のアプリ登録は不要です。トークンは数時間後に期限切れになります。
</Note>

### bot を設定する

<Tabs>
  <Tab title="Env var (default account only)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      channels: {
        twitch: {
          enabled: true,
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
      },
    }
    ```
  </Tab>
</Tabs>

env と config の両方が設定されている場合は、config が優先されます。

### アクセス制御（推奨）

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

厳格な許可リストには `allowFrom` を推奨します。ロールベースのアクセスを使用したい場合は、代わりに `allowedRoles` を使用します。

**利用可能なロール:** `"moderator"`、`"owner"`、`"vip"`、`"subscriber"`、`"all"`。

<Note>
**なぜユーザー ID なのか?** ユーザー名は変更できるため、なりすましを許す可能性があります。ユーザー ID は永続的です。

Twitch ユーザー ID を確認する: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)（Twitch ユーザー名を ID に変換）
</Note>

## トークン更新（任意）

[Twitch Token Generator](https://twitchtokengenerator.com/) のトークンは自動更新できません。期限切れになったら再生成してください。

自動トークン更新を行うには、[Twitch Developer Console](https://dev.twitch.tv/console) で独自の Twitch アプリケーションを作成し、config に追加します。

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

bot は期限切れ前にトークンを自動更新し、更新イベントをログに記録します。

## マルチアカウントサポート

アカウントごとのトークンには `channels.twitch.accounts` を使用します。共有パターンについては [設定](/ja-JP/gateway/configuration) を参照してください。

例（1 つの bot アカウントを 2 つのチャンネルで使用）:

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
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
各アカウントには独自のトークンが必要です（チャンネルごとに 1 トークン）。
</Note>

## アクセス制御

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

    `allowFrom` は厳格な許可リストです。設定されている場合、それらのユーザー ID のみが許可されます。ロールベースのアクセスを使用したい場合は、`allowFrom` を未設定のままにして、代わりに `allowedRoles` を設定してください。

  </Tab>
  <Tab title="Disable @mention requirement">
    デフォルトでは、`requireMention` は `true` です。無効化してすべてのメッセージに応答するには、次のようにします。

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

## トラブルシューティング

まず、診断コマンドを実行します。

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot does not respond to messages">
    - **アクセス制御を確認:** ユーザー ID が `allowFrom` に含まれていることを確認するか、テストのために一時的に `allowFrom` を削除して `allowedRoles: ["all"]` を設定します。
    - **bot がチャンネル内にいることを確認:** bot は `channel` で指定されたチャンネルに参加している必要があります。

  </Accordion>
  <Accordion title="Token issues">
    「接続に失敗しました」または認証エラー:

    - `accessToken` が OAuth アクセストークン値であることを確認します（通常は `oauth:` プレフィックスで始まります）
    - トークンに `chat:read` と `chat:write` のスコープがあることを確認します
    - トークン更新を使用している場合は、`clientSecret` と `refreshToken` が設定されていることを確認します

  </Accordion>
  <Accordion title="Token refresh not working">
    更新イベントのログを確認します。

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    「token refresh disabled (no refresh token)」が表示される場合:

    - `clientSecret` が提供されていることを確認します
    - `refreshToken` が提供されていることを確認します

  </Accordion>
</AccordionGroup>

## Config

### アカウント設定

<ParamField path="username" type="string">
  bot ユーザー名。
</ParamField>
<ParamField path="accessToken" type="string">
  `chat:read` と `chat:write` を持つ OAuth アクセストークン。
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID（Token Generator または自分のアプリから）。
</ParamField>
<ParamField path="channel" type="string" required>
  参加するチャンネル。
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  このアカウントを有効化します。
</ParamField>
<ParamField path="clientSecret" type="string">
  任意: 自動トークン更新用。
</ParamField>
<ParamField path="refreshToken" type="string">
  任意: 自動トークン更新用。
</ParamField>
<ParamField path="expiresIn" type="number">
  トークンの有効期限（秒）。
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  トークン取得タイムスタンプ。
</ParamField>
<ParamField path="allowFrom" type="string[]">
  ユーザー ID 許可リスト。
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  ロールベースのアクセス制御。
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  @mention を必須にします。
</ParamField>

### プロバイダーオプション

- `channels.twitch.enabled` - チャンネル起動を有効化/無効化
- `channels.twitch.username` - bot ユーザー名（簡易シングルアカウント設定）
- `channels.twitch.accessToken` - OAuth アクセストークン（簡易シングルアカウント設定）
- `channels.twitch.clientId` - Twitch Client ID（簡易シングルアカウント設定）
- `channels.twitch.channel` - 参加するチャンネル（簡易シングルアカウント設定）
- `channels.twitch.accounts.<accountName>` - マルチアカウント設定（上記のすべてのアカウントフィールド）

完全な例:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## ツールアクション

エージェントは、次のアクションで `twitch` を呼び出せます。

- `send` - チャンネルにメッセージを送信

例:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## 安全性と運用

- **トークンをパスワードのように扱う** — トークンを git にコミットしないでください。
- **自動トークン更新を使用する** 長時間稼働する bot では有効です。
- **ユーザー名ではなくユーザー ID 許可リストを使用する** アクセス制御に使用します。
- **ログを監視する** トークン更新イベントと接続状態を確認します。
- **トークンのスコープを最小限にする** — `chat:read` と `chat:write` のみを要求します。
- **行き詰まった場合**: 他のプロセスがセッションを所有していないことを確認してから、Gateway を再起動します。

## 制限

- メッセージあたり **500 文字**（単語境界で自動分割）。
- Markdown は分割前に削除されます。
- レート制限なし（Twitch の組み込みレート制限を使用）。

## 関連

- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [チャンネル概要](/ja-JP/channels) — サポートされるすべてのチャンネル
- [グループ](/ja-JP/channels/groups) — グループチャットの動作と mention ゲート
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
