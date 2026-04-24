---
read_when:
    - OpenClaw用のTwitchチャット連携をセットアップする
summary: Twitchチャットボットの設定とセットアップ
title: Twitch
x-i18n:
    generated_at: "2026-04-24T04:48:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82b9176deec21344a7cd22f8818277f94bc564d06c4422b149d0fc163ee92d5f
    source_path: channels/twitch.md
    workflow: 15
---

IRC接続によるTwitchチャットのサポート。OpenClawは、チャンネル内でメッセージを受信・送信するために、Twitchユーザー（botアカウント）として接続します。

## 同梱Plugin

Twitchは現在のOpenClawリリースでは同梱Pluginとして提供されるため、通常の
パッケージ版ビルドでは別途インストールは不要です。

古いビルドやTwitchを含まないカスタムインストールを使っている場合は、
手動でインストールしてください。

CLI経由でインストール（npmレジストリ）:

```bash
openclaw plugins install @openclaw/twitch
```

ローカルチェックアウト（gitリポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ（初心者向け）

1. Twitch Pluginが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースにはすでに同梱されています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. bot用の専用Twitchアカウントを作成します（または既存のアカウントを使います）。
3. 認証情報を生成します: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - **Bot Token** を選択します
   - `chat:read` と `chat:write` のscopeが選択されていることを確認します
   - **Client ID** と **Access Token** をコピーします
4. TwitchユーザーIDを確認します: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. tokenを設定します。
   - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...`（デフォルトアカウントのみ）
   - または config: `channels.twitch.accessToken`
   - 両方が設定されている場合は、configが優先されます（envフォールバックはデフォルトアカウントのみ）。
6. Gatewayを起動します。

**⚠️ 重要:** 許可されていないユーザーがbotをトリガーできないように、アクセス制御（`allowFrom` または `allowedRoles`）を追加してください。`requireMention` のデフォルトは `true` です。

最小設定:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // BotのTwitchアカウント
      accessToken: "oauth:abc123...", // OAuth Access Token（または OPENCLAW_TWITCH_ACCESS_TOKEN 環境変数を使用）
      clientId: "xyz789...", // Token GeneratorのClient ID
      channel: "vevisk", // 参加するTwitchチャンネルのチャット（必須）
      allowFrom: ["123456789"], // （推奨）自分のTwitchユーザーIDのみにする - https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/ で取得
    },
  },
}
```

## これは何か

- Gatewayが所有するTwitchチャンネルです。
- 決定的なルーティング: 返信は常にTwitchに戻ります。
- 各アカウントは、分離されたセッションキー `agent:<agentId>:twitch:<accountName>` にマッピングされます。
- `username` はbotのアカウント（認証する側）、`channel` は参加するチャットルームです。

## セットアップ（詳細）

### 認証情報の生成

[Twitch Token Generator](https://twitchtokengenerator.com/) を使用します。

- **Bot Token** を選択します
- `chat:read` と `chat:write` のscopeが選択されていることを確認します
- **Client ID** と **Access Token** をコピーします

手動でのアプリ登録は不要です。tokenは数時間後に期限切れになります。

### botの設定

**環境変数（デフォルトアカウントのみ）:**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**またはconfig:**

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

envとconfigの両方が設定されている場合は、configが優先されます。

### アクセス制御（推奨）

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // （推奨）自分のTwitchユーザーIDのみ
    },
  },
}
```

厳格な許可リストには `allowFrom` を推奨します。ロールベースのアクセスにしたい場合は、代わりに `allowedRoles` を使ってください。

**利用可能なロール:** `"moderator"`、`"owner"`、`"vip"`、`"subscriber"`、`"all"`。

**なぜユーザーIDか?** ユーザー名は変更できるため、なりすましを許す可能性があります。ユーザーIDは永続的です。

TwitchユーザーIDの確認先: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)（Twitchユーザー名をIDに変換）

## token更新（任意）

[Twitch Token Generator](https://twitchtokengenerator.com/) のtokenは自動更新できません。期限切れになったら再生成してください。

自動token更新が必要な場合は、[Twitch Developer Console](https://dev.twitch.tv/console) で自分のTwitchアプリケーションを作成し、configに追加します。

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

botは期限切れ前に自動でtokenを更新し、更新イベントをログに記録します。

## マルチアカウント対応

アカウントごとのtokenには `channels.twitch.accounts` を使用します。共通パターンは [`gateway/configuration`](/ja-JP/gateway/configuration) を参照してください。

例（1つのbotアカウントを2つのチャンネルで使用）:

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

**注:** 各アカウントには独自のtokenが必要です（チャンネルごとに1つのtoken）。

## アクセス制御

### ロールベース制限

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

### ユーザーIDによる許可リスト（最も安全）

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

### ロールベースアクセス（代替）

`allowFrom` は厳格な許可リストです。設定されている場合、それらのユーザーIDだけが許可されます。
ロールベースアクセスにしたい場合は、`allowFrom` を未設定にして、代わりに `allowedRoles` を設定してください。

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### @mention必須を無効化

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

## トラブルシューティング

まず、診断コマンドを実行します。

```bash
openclaw doctor
openclaw channels status --probe
```

### botがメッセージに応答しない

**アクセス制御を確認:** 自分のユーザーIDが `allowFrom` に入っていることを確認するか、
一時的に `allowFrom` を外して `allowedRoles: ["all"]` を設定してテストしてください。

**botがチャンネルに参加していることを確認:** botは `channel` で指定したチャンネルに参加している必要があります。

### tokenの問題

**「Failed to connect」または認証エラー:**

- `accessToken` がOAuth access token値であることを確認してください（通常は `oauth:` プレフィックスで始まります）
- tokenに `chat:read` と `chat:write` のscopeがあることを確認してください
- token更新を使っている場合は、`clientSecret` と `refreshToken` が設定されていることを確認してください

### token更新が動作しない

**更新イベントをログで確認:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

「token refresh disabled (no refresh token)」と表示される場合:

- `clientSecret` が提供されていることを確認してください
- `refreshToken` が提供されていることを確認してください

## 設定

**アカウント設定:**

- `username` - botユーザー名
- `accessToken` - `chat:read` と `chat:write` を持つOAuth access token
- `clientId` - Twitch Client ID（Token Generatorまたは自分のアプリから取得）
- `channel` - 参加するチャンネル（必須）
- `enabled` - このアカウントを有効化（デフォルト: `true`）
- `clientSecret` - 任意: 自動token更新用
- `refreshToken` - 任意: 自動token更新用
- `expiresIn` - tokenの有効期限（秒）
- `obtainmentTimestamp` - token取得タイムスタンプ
- `allowFrom` - ユーザーID許可リスト
- `allowedRoles` - ロールベースアクセス制御（`"moderator" | "owner" | "vip" | "subscriber" | "all"`）
- `requireMention` - @mentionを必須にする（デフォルト: `true`）

**プロバイダーオプション:**

- `channels.twitch.enabled` - チャンネル起動の有効/無効
- `channels.twitch.username` - botユーザー名（簡易単一アカウント設定）
- `channels.twitch.accessToken` - OAuth access token（簡易単一アカウント設定）
- `channels.twitch.clientId` - Twitch Client ID（簡易単一アカウント設定）
- `channels.twitch.channel` - 参加するチャンネル（簡易単一アカウント設定）
- `channels.twitch.accounts.<accountName>` - マルチアカウント設定（上記の全アカウントフィールド）

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

エージェントは次のactionで `twitch` を呼び出せます。

- `send` - チャンネルにメッセージを送信する

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

- **tokenはパスワード同様に扱う** - tokenをgitにコミットしないでください
- **長時間動作するbotには自動token更新を使用する**
- **アクセス制御にはユーザー名ではなくユーザーID許可リストを使う**
- **token更新イベントと接続状態をログで監視する**
- **tokenのscopeは最小限にする** - `chat:read` と `chat:write` のみ要求してください
- **行き詰まったら**: 他のプロセスがセッションを所有していないことを確認してからGatewayを再起動してください

## 制限

- 1メッセージあたり**500文字**（単語境界で自動分割）
- Markdownは分割前に削除されます
- レート制限なし（Twitch組み込みのレート制限を使用）

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャンネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
