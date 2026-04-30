---
read_when:
    - OpenClaw の Twitch チャット連携の設定
sidebarTitle: Twitch
summary: Twitch チャットボットの設定とセットアップ
title: Twitch
x-i18n:
    generated_at: "2026-04-30T05:01:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 897079687a243c9c2ce2be63167e59f4413bbd89735fb79f03928547023bd787
    source_path: channels/twitch.md
    workflow: 16
---

IRC 接続による Twitch チャット対応。OpenClaw は Twitch ユーザー（bot アカウント）として接続し、チャンネル内のメッセージを受信および送信します。

## 同梱 Plugin

<Note>
Twitch は現在の OpenClaw リリースでは同梱 Plugin として提供されているため、通常のパッケージ版ビルドでは別途インストールは不要です。
</Note>

Twitch が除外された古いビルドまたはカスタムインストールを使用している場合は、公開されている現行の npm パッケージをインストールします。

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

npm が OpenClaw 所有のパッケージを非推奨として報告する場合は、新しい npm パッケージが公開されるまで、現在のパッケージ版 OpenClaw ビルドまたはローカルチェックアウトパスを使用してください。

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ（初心者向け）

<Steps>
  <Step title="Plugin が利用可能であることを確認する">
    現在のパッケージ版 OpenClaw リリースにはすでに同梱されています。古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
  </Step>
  <Step title="Twitch bot アカウントを作成する">
    bot 専用の Twitch アカウントを作成します（または既存のアカウントを使用します）。
  </Step>
  <Step title="認証情報を生成する">
    [Twitch Token Generator](https://twitchtokengenerator.com/) を使用します。

    - **Bot Token** を選択
    - スコープ `chat:read` と `chat:write` が選択されていることを確認
    - **Client ID** と **Access Token** をコピー

  </Step>
  <Step title="Twitch ユーザー ID を見つける">
    [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) を使用して、ユーザー名を Twitch ユーザー ID に変換します。
  </Step>
  <Step title="トークンを設定する">
    - 環境変数: `OPENCLAW_TWITCH_ACCESS_TOKEN=...`（デフォルトアカウントのみ）
    - または設定: `channels.twitch.accessToken`

    両方が設定されている場合、設定が優先されます（環境変数のフォールバックはデフォルトアカウントのみ）。

  </Step>
  <Step title="Gateway を起動する">
    設定済みのチャンネルで Gateway を起動します。
  </Step>
</Steps>

<Warning>
認可されていないユーザーが bot をトリガーしないよう、アクセス制御（`allowFrom` または `allowedRoles`）を追加してください。`requireMention` のデフォルトは `true` です。
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

- Gateway が所有する Twitch チャンネル。
- 決定的なルーティング: 返信は常に Twitch に戻ります。
- 各アカウントは、分離されたセッションキー `agent:<agentId>:twitch:<accountName>` に対応します。
- `username` は bot のアカウント（認証するユーザー）で、`channel` は参加するチャットルームです。

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
  <Tab title="環境変数（デフォルトアカウントのみ）">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="設定">
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

環境変数と設定の両方が設定されている場合、設定が優先されます。

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

厳格な許可リストには `allowFrom` を優先してください。ロールベースのアクセスを使いたい場合は、代わりに `allowedRoles` を使用します。

**利用可能なロール:** `"moderator"`、`"owner"`、`"vip"`、`"subscriber"`、`"all"`。

<Note>
**なぜユーザー ID なのか？** ユーザー名は変更できるため、なりすましを許す可能性があります。ユーザー ID は永続的です。

Twitch ユーザー ID を見つける: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)（Twitch ユーザー名を ID に変換）
</Note>

## トークン更新（任意）

[Twitch Token Generator](https://twitchtokengenerator.com/) からのトークンは自動更新できません。期限切れになったら再生成してください。

自動トークン更新を行うには、[Twitch Developer Console](https://dev.twitch.tv/console) で独自の Twitch アプリケーションを作成し、設定に追加します。

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

bot は期限切れ前に自動的にトークンを更新し、更新イベントをログに記録します。

## マルチアカウント対応

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
各アカウントには独自のトークンが必要です（チャンネルごとに 1 つのトークン）。
</Note>

## アクセス制御

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

    `allowFrom` は厳格な許可リストです。設定されている場合、そのユーザー ID のみが許可されます。ロールベースのアクセスを使いたい場合は、`allowFrom` を未設定のままにし、代わりに `allowedRoles` を設定します。

  </Tab>
  <Tab title="@メンション要件を無効化">
    デフォルトでは、`requireMention` は `true` です。無効化してすべてのメッセージに応答するには:

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

まず診断コマンドを実行します。

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="bot がメッセージに応答しない">
    - **アクセス制御を確認する:** ユーザー ID が `allowFrom` に含まれていることを確認するか、テストのために一時的に `allowFrom` を削除して `allowedRoles: ["all"]` を設定します。
    - **bot がチャンネルにいることを確認する:** bot は `channel` で指定されたチャンネルに参加している必要があります。

  </Accordion>
  <Accordion title="トークンの問題">
    「接続に失敗しました」または認証エラー:

    - `accessToken` が OAuth アクセストークン値であることを確認します（通常は `oauth:` プレフィックスで始まります）
    - トークンに `chat:read` と `chat:write` スコープがあることを確認します
    - トークン更新を使用している場合は、`clientSecret` と `refreshToken` が設定されていることを確認します

  </Accordion>
  <Accordion title="トークン更新が機能しない">
    更新イベントのログを確認します。

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    「token refresh disabled (no refresh token)」が表示される場合:

    - `clientSecret` が指定されていることを確認します
    - `refreshToken` が指定されていることを確認します

  </Accordion>
</AccordionGroup>

## 設定

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
  @メンションを必須にします。
</ParamField>

### プロバイダーオプション

- `channels.twitch.enabled` - チャンネル起動を有効化/無効化
- `channels.twitch.username` - bot ユーザー名（簡略化された単一アカウント設定）
- `channels.twitch.accessToken` - OAuth アクセストークン（簡略化された単一アカウント設定）
- `channels.twitch.clientId` - Twitch Client ID（簡略化された単一アカウント設定）
- `channels.twitch.channel` - 参加するチャンネル（簡略化された単一アカウント設定）
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

エージェントは、アクションとして `twitch` を呼び出せます。

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

- **トークンはパスワードのように扱う** — トークンを git にコミットしないでください。
- 長時間稼働する bot には **自動トークン更新を使用する**。
- アクセス制御には、ユーザー名ではなく **ユーザー ID 許可リストを使用する**。
- トークン更新イベントと接続ステータスについて **ログを監視する**。
- **トークンのスコープは最小限にする** — `chat:read` と `chat:write` のみを要求してください。
- **詰まった場合**: 他のプロセスがセッションを所有していないことを確認した後、Gateway を再起動してください。

## 制限

- メッセージあたり **500 文字**（単語境界で自動分割）。
- Markdown は分割前に取り除かれます。
- レート制限なし（Twitch の組み込みレート制限を使用）。

## 関連

- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
