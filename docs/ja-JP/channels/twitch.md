---
read_when:
    - OpenClaw 用の Twitch チャット連携を設定する
sidebarTitle: Twitch
summary: Twitch チャットボットの設定とセットアップ
title: Twitch
x-i18n:
    generated_at: "2026-04-26T11:24:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d5f4bbad04e04cccc82fc1e2b1057acae3bf7b7684a8e7a4b1f54101731974a
    source_path: channels/twitch.md
    workflow: 15
---

IRC 接続による Twitch チャット対応。OpenClaw は Twitch ユーザー（ボットアカウント）として接続し、チャネル内のメッセージを受信・送信します。

## バンドル済み Plugin

<Note>
現在の OpenClaw リリースでは、Twitch はバンドル済み Plugin として提供されているため、通常のパッケージ済みビルドでは別途インストールは不要です。
</Note>

古いビルドまたは Twitch を除外したカスタムインストールを使用している場合は、手動でインストールしてください。

<Tabs>
  <Tab title="npm registry">
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

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ（初学者向け）

<Steps>
  <Step title="Plugin が利用可能であることを確認">
    現在のパッケージ版 OpenClaw リリースには、すでにバンドルされています。古い/カスタムインストールでは、上記のコマンドで手動追加できます。
  </Step>
  <Step title="Twitch ボットアカウントを作成">
    ボット用に専用の Twitch アカウントを作成するか、既存のアカウントを使用します。
  </Step>
  <Step title="認証情報を生成">
    [Twitch Token Generator](https://twitchtokengenerator.com/) を使用します。

    - **Bot Token** を選択
    - `chat:read` と `chat:write` のスコープが選択されていることを確認
    - **Client ID** と **Access Token** をコピー

  </Step>
  <Step title="Twitch user ID を調べる">
    [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) を使用して、ユーザー名を Twitch user ID に変換します。
  </Step>
  <Step title="token を設定">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...`（デフォルトアカウントのみ）
    - または config: `channels.twitch.accessToken`

    両方が設定されている場合は config が優先されます（env フォールバックはデフォルトアカウントのみ）。

  </Step>
  <Step title="Gateway を起動">
    設定済みチャネルで Gateway を起動します。
  </Step>
</Steps>

<Warning>
未承認ユーザーによるボット起動を防ぐため、アクセス制御（`allowFrom` または `allowedRoles`）を追加してください。`requireMention` のデフォルトは `true` です。
</Warning>

最小構成:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // ボットの Twitch アカウント
      accessToken: "oauth:abc123...", // OAuth Access Token（または OPENCLAW_TWITCH_ACCESS_TOKEN env var を使用）
      clientId: "xyz789...", // Token Generator の Client ID
      channel: "vevisk", // 参加する Twitch チャネルのチャット（必須）
      allowFrom: ["123456789"], // （推奨）あなたの Twitch user ID のみ - https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/ で取得
    },
  },
}
```

## これは何か

- Gateway が所有する Twitch チャネルです。
- 決定的なルーティング: 返信は常に Twitch に戻されます。
- 各アカウントは分離されたセッションキー `agent:<agentId>:twitch:<accountName>` にマップされます。
- `username` はボットのアカウント（認証する主体）、`channel` は参加するチャットルームです。

## セットアップ（詳細）

### 認証情報を生成

[Twitch Token Generator](https://twitchtokengenerator.com/) を使用します。

- **Bot Token** を選択
- `chat:read` と `chat:write` のスコープが選択されていることを確認
- **Client ID** と **Access Token** をコピー

<Note>
手動のアプリ登録は不要です。token は数時間後に期限切れになります。
</Note>

### ボットを設定

<Tabs>
  <Tab title="Env var（デフォルトアカウントのみ）">
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
      allowFrom: ["123456789"], // （推奨）あなたの Twitch user ID のみ
    },
  },
}
```

厳密な allowlist には `allowFrom` を推奨します。ロールベースのアクセスにしたい場合は、代わりに `allowedRoles` を使用してください。

**利用可能なロール:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`。

<Note>
**なぜ user ID なのか？** ユーザー名は変更できるため、なりすましが可能になります。user ID は永続的です。

あなたの Twitch user ID の確認先: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)（Twitch username を ID に変換）
</Note>

## token の更新（任意）

[Twitch Token Generator](https://twitchtokengenerator.com/) で生成した token は自動更新できません。期限切れになったら再生成してください。

自動 token 更新を使うには、[Twitch Developer Console](https://dev.twitch.tv/console) で独自の Twitch application を作成し、config に追加します。

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

ボットは期限切れ前に自動的に token を更新し、更新イベントをログに記録します。

## マルチアカウント対応

アカウントごとの token を使って `channels.twitch.accounts` を使用します。共通パターンについては [Configuration](/ja-JP/gateway/configuration) を参照してください。

例（1 つのボットアカウントを 2 つのチャネルで使用）:

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
各アカウントには固有の token が必要です（チャネルごとに 1 つの token）。
</Note>

## アクセス制御

<Tabs>
  <Tab title="User ID allowlist（最も安全）">
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

    `allowFrom` は厳密な allowlist です。設定されている場合は、それらの user ID のみが許可されます。ロールベースのアクセスにしたい場合は、`allowFrom` を未設定のままにして、代わりに `allowedRoles` を設定してください。

  </Tab>
  <Tab title="@mention 要件を無効化">
    デフォルトでは `requireMention` は `true` です。無効化してすべてのメッセージに応答するには、次のようにします。

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
  <Accordion title="ボットがメッセージに応答しない">
    - **アクセス制御を確認:** あなたの user ID が `allowFrom` に含まれていることを確認するか、テストのために一時的に `allowFrom` を削除して `allowedRoles: ["all"]` を設定してください。
    - **ボットがチャネルに参加していることを確認:** ボットは `channel` で指定したチャネルに参加している必要があります。

  </Accordion>
  <Accordion title="token の問題">
    「Failed to connect」または認証エラーの場合:

    - `accessToken` が OAuth access token の値であることを確認してください（通常は `oauth:` 接頭辞で始まります）
    - token に `chat:read` と `chat:write` のスコープがあることを確認してください
    - token 更新を使用している場合は、`clientSecret` と `refreshToken` が設定されていることを確認してください

  </Accordion>
  <Accordion title="token 更新が動作しない">
    更新イベントのログを確認してください。

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    「token refresh disabled (no refresh token)」と表示される場合:

    - `clientSecret` が提供されていることを確認してください
    - `refreshToken` が提供されていることを確認してください

  </Accordion>
</AccordionGroup>

## Config

### アカウント設定

<ParamField path="username" type="string">
  ボットのユーザー名。
</ParamField>
<ParamField path="accessToken" type="string">
  `chat:read` と `chat:write` を持つ OAuth access token。
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID（Token Generator または独自アプリのもの）。
</ParamField>
<ParamField path="channel" type="string" required>
  参加するチャネル。
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  このアカウントを有効化します。
</ParamField>
<ParamField path="clientSecret" type="string">
  任意: 自動 token 更新用。
</ParamField>
<ParamField path="refreshToken" type="string">
  任意: 自動 token 更新用。
</ParamField>
<ParamField path="expiresIn" type="number">
  token の有効期限（秒）。
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  token の取得タイムスタンプ。
</ParamField>
<ParamField path="allowFrom" type="string[]">
  User ID allowlist。
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  ロールベースのアクセス制御。
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  @mention を必須にします。
</ParamField>

### プロバイダーオプション

- `channels.twitch.enabled` - チャネル起動の有効/無効
- `channels.twitch.username` - ボットのユーザー名（簡易単一アカウント設定）
- `channels.twitch.accessToken` - OAuth access token（簡易単一アカウント設定）
- `channels.twitch.clientId` - Twitch Client ID（簡易単一アカウント設定）
- `channels.twitch.channel` - 参加するチャネル（簡易単一アカウント設定）
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

エージェントは次の action で `twitch` を呼び出せます。

- `send` - チャネルにメッセージを送信

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

- **token はパスワードのように扱う** — token を git にコミットしないでください。
- **長時間稼働するボットには自動 token 更新を使う**
- **アクセス制御にはユーザー名ではなく user ID allowlist を使う**
- **token 更新イベントと接続状態をログで監視する**
- **token のスコープは最小限にする** — `chat:read` と `chat:write` のみを要求してください。
- **行き詰まった場合**: セッションを他のプロセスが所有していないことを確認してから Gateway を再起動してください。

## 制限

- メッセージごとに **500 文字** まで（単語境界で自動分割）。
- 分割前に Markdown は削除されます。
- レート制限なし（Twitch 組み込みのレート制限を使用）。

## 関連

- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Channels Overview](/ja-JP/channels) — 対応チャネル一覧
- [Groups](/ja-JP/channels/groups) — グループチャットの挙動と mention ゲーティング
- [Pairing](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
