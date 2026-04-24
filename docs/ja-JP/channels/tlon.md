---
read_when:
    - Tlon/Urbit チャネル機能の利用方法
summary: Tlon/Urbit のサポート状況、機能、設定
title: Tlon
x-i18n:
    generated_at: "2026-04-24T04:48:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ff92473a958a4cba355351a686431748ea801b1c640cc5873e8bdac8f37a53f
    source_path: channels/tlon.md
    workflow: 15
---

Tlon は Urbit 上に構築された分散型メッセンジャーです。OpenClaw はあなたの Urbit ship に接続し、
DM とグループチャットメッセージに応答できます。グループ返信はデフォルトで @ メンションを必要とし、
さらに許可リストで制限できます。

ステータス: 同梱 Plugin。DM、グループメンション、スレッド返信、リッチテキスト整形、
画像アップロードをサポートしています。リアクションとポーリングはまだサポートされていません。

## 同梱 Plugin

Tlon は現在の OpenClaw リリースでは同梱 Plugin として提供されるため、通常のパッケージ済み
ビルドでは別途インストールは不要です。

古いビルド、または Tlon を除外したカスタムインストールを使っている場合は、手動で
インストールしてください。

CLI 経由でインストールするには（npm レジストリ）:

```bash
openclaw plugins install @openclaw/tlon
```

ローカルチェックアウト（git リポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## セットアップ

1. Tlon Plugin が利用可能であることを確認します。
   - 現在のパッケージ済み OpenClaw リリースには、すでに同梱されています。
   - 古い/カスタムインストールでは、上記コマンドで手動追加できます。
2. あなたの ship URL とログインコードを集めます。
3. `channels.tlon` を設定します。
4. Gateway を再起動します。
5. ボットに DM を送るか、グループチャネルでメンションします。

最小構成（単一アカウント）:

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // 推奨: あなたの ship。常に許可されます
    },
  },
}
```

## プライベート/LAN ship

デフォルトでは、OpenClaw は SSRF 保護のためにプライベート/内部ホスト名と IP 範囲をブロックします。
ship がプライベートネットワーク（localhost、LAN IP、または内部ホスト名）上で動作している場合、
明示的にオプトインする必要があります。

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

これは次のような URL に適用されます。

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ ローカルネットワークを信頼している場合にのみ有効にしてください。この設定は、
あなたの ship URL へのリクエストに対する SSRF 保護を無効にします。

## グループチャネル

自動検出はデフォルトで有効です。チャネルを手動で固定することもできます。

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

自動検出を無効にするには:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## アクセス制御

DM 許可リスト（空 = DM は許可されません。承認フローには `ownerShip` を使用）:

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

グループ認可（デフォルトで制限あり）:

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## オーナーと承認システム

認可されていないユーザーが対話しようとしたときに承認リクエストを受け取るために、オーナー ship を設定します。

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

オーナー ship は**あらゆる場所で自動的に認可されます**。DM 招待は自動承認され、
チャネルメッセージは常に許可されます。オーナーを `dmAllowlist` や
`defaultAuthorizedShips` に追加する必要はありません。

設定すると、オーナーは次の場合に DM 通知を受け取ります。

- 許可リストにない ship からの DM リクエスト
- 認可のないチャネルでのメンション
- グループ招待リクエスト

## 自動承認設定

DM 招待を自動承認する（`dmAllowlist` 内の ship 用）:

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

グループ招待を自動承認する:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## 配信ターゲット（CLI/Cron）

`openclaw message send` または Cron 配信では次を使用します。

- DM: `~sampel-palnet` または `dm/~sampel-palnet`
- グループ: `chat/~host-ship/channel` または `group:~host-ship/channel`

## 同梱 Skill

Tlon Plugin には、Tlon 操作への CLI アクセスを提供する同梱 Skill（[`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)）が含まれています。

- **Contacts**: プロフィールの取得/更新、連絡先一覧
- **Channels**: 一覧、作成、メッセージ投稿、履歴取得
- **Groups**: 一覧、作成、メンバー管理
- **DMs**: メッセージ送信、メッセージへのリアクション
- **Reactions**: 投稿と DM への絵文字リアクションの追加/削除
- **Settings**: スラッシュコマンドによる Plugin 権限管理

この Skill は、Plugin がインストールされると自動的に利用可能になります。

## 機能

| 機能            | ステータス                                |
| --------------- | ----------------------------------------- |
| ダイレクトメッセージ | ✅ サポート済み                           |
| グループ/チャネル | ✅ サポート済み（デフォルトでメンション制限） |
| スレッド        | ✅ サポート済み（スレッド内で自動返信）   |
| リッチテキスト  | ✅ Markdown を Tlon 形式に変換            |
| 画像            | ✅ Tlon ストレージにアップロード          |
| Reactions       | ✅ [同梱 Skill](#同梱-skill) 経由         |
| ポーリング      | ❌ まだサポートされていません             |
| ネイティブコマンド | ✅ サポート済み（デフォルトでオーナー限定） |

## トラブルシューティング

まずこの手順を実行してください。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

よくある障害:

- **DM が無視される**: 送信者が `dmAllowlist` に含まれておらず、承認フロー用の `ownerShip` も設定されていません。
- **グループメッセージが無視される**: チャネルが検出されていないか、送信者が認可されていません。
- **接続エラー**: ship URL に到達可能か確認してください。ローカル ship の場合は `allowPrivateNetwork` を有効にしてください。
- **認証エラー**: ログインコードが現在有効か確認してください（コードはローテーションされます）。

## 設定リファレンス

完全な設定: [Configuration](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.tlon.enabled`: チャネル起動の有効/無効。
- `channels.tlon.ship`: ボットの Urbit ship 名（例: `~sampel-palnet`）。
- `channels.tlon.url`: ship URL（例: `https://sampel-palnet.tlon.network`）。
- `channels.tlon.code`: ship ログインコード。
- `channels.tlon.allowPrivateNetwork`: localhost/LAN URL を許可する（SSRF バイパス）。
- `channels.tlon.ownerShip`: 承認システム用のオーナー ship（常に認可される）。
- `channels.tlon.dmAllowlist`: DM を許可する ship（空 = なし）。
- `channels.tlon.autoAcceptDmInvites`: 許可リスト済み ship からの DM を自動承認。
- `channels.tlon.autoAcceptGroupInvites`: すべてのグループ招待を自動承認。
- `channels.tlon.autoDiscoverChannels`: グループチャネルを自動検出（デフォルト: true）。
- `channels.tlon.groupChannels`: 手動で固定したチャネル nest。
- `channels.tlon.defaultAuthorizedShips`: すべてのチャネルで認可される ship。
- `channels.tlon.authorization.channelRules`: チャネルごとの認可ルール。
- `channels.tlon.showModelSignature`: メッセージにモデル名を付加する。

## 注意

- グループ返信には応答するためのメンション（例: `~your-bot-ship`）が必要です。
- スレッド返信: 受信メッセージがスレッド内にある場合、OpenClaw はそのスレッド内で返信します。
- リッチテキスト: Markdown 整形（太字、斜体、コード、見出し、リスト）は Tlon のネイティブ形式に変換されます。
- 画像: URL は Tlon ストレージにアップロードされ、画像ブロックとして埋め込まれます。

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとハードニング
