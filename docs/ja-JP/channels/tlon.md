---
read_when:
    - Tlon/Urbit チャンネル機能の作業中
summary: Tlon/Urbit のサポート状況、機能、設定
title: Tlon
x-i18n:
    generated_at: "2026-05-02T22:16:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30915170786fc1ee8b84fb8be2ea42280262923064cfa9ca7107036096a13add
    source_path: channels/tlon.md
    workflow: 16
---

Tlon は Urbit 上に構築された分散型メッセンジャーです。OpenClaw はあなたの Urbit ship に接続し、
DM とグループチャットメッセージに応答できます。グループ返信にはデフォルトで @ メンションが必要で、
allowlist でさらに制限できます。

ステータス: バンドル済みPlugin。DM、グループメンション、スレッド返信、リッチテキスト書式、
画像アップロードがサポートされています。リアクションと投票はまだサポートされていません。

## バンドル済みPlugin

Tlon は現在の OpenClaw リリースではバンドル済みPluginとして同梱されるため、通常のパッケージ版
ビルドでは別途インストールは不要です。

古いビルド、または Tlon を除外したカスタムインストールを使っている場合は、現在の
npm パッケージをインストールします。

CLI でインストール (npm registry):

```bash
openclaw plugins install @openclaw/tlon
```

現在の公式リリースタグに追従するには、素のパッケージを使用してください。再現可能な
インストールが必要な場合にのみ正確なバージョンに固定します。

ローカルチェックアウト (git repo から実行する場合):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

詳細: [Plugin](/ja-JP/tools/plugin)

## セットアップ

1. Tlon Plugin が利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースにはすでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. ship URL とログインコードを用意します。
3. `channels.tlon` を設定します。
4. gateway を再起動します。
5. bot に DM するか、グループチャンネルでメンションします。

最小設定 (単一アカウント):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## プライベート/LAN ship

デフォルトでは、OpenClaw は SSRF 保護のためプライベート/内部ホスト名と IP 範囲をブロックします。
あなたの ship がプライベートネットワーク (localhost、LAN IP、または内部ホスト名) で動作している場合、
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
ship URL へのリクエストに対する SSRF 保護を無効にします。

## グループチャンネル

自動検出はデフォルトで有効です。チャンネルを手動で固定することもできます。

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

自動検出を無効化します。

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

DM allowlist (空 = DM は許可されません。承認フローには `ownerShip` を使用):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

グループ認可 (デフォルトでは制限あり):

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

未認可ユーザーが操作しようとしたときに承認リクエストを受け取る owner ship を設定します。

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

owner ship は **どこでも自動的に認可されます** — DM 招待は自動承認され、
チャンネルメッセージは常に許可されます。owner を `dmAllowlist` または
`defaultAuthorizedShips` に追加する必要はありません。

設定すると、owner は次について DM 通知を受け取ります。

- allowlist に含まれない ship からの DM リクエスト
- 認可のないチャンネルでのメンション
- グループ招待リクエスト

## 自動承認設定

DM 招待を自動承認します (`dmAllowlist` 内の ship 向け):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

グループ招待を自動承認します。

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## 配信先 (CLI/Cron)

`openclaw message send` または Cron 配信でこれらを使用します。

- DM: `~sampel-palnet` または `dm/~sampel-palnet`
- グループ: `chat/~host-ship/channel` または `group:~host-ship/channel`

## バンドル済みスキル

Tlon Plugin には、Tlon 操作への CLI アクセスを提供するバンドル済みスキル
([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
が含まれています。

- **連絡先**: プロフィールの取得/更新、連絡先一覧
- **チャンネル**: 一覧、作成、メッセージ投稿、履歴取得
- **グループ**: 一覧、作成、メンバー管理
- **DM**: メッセージ送信、メッセージへのリアクション
- **リアクション**: 投稿と DM への絵文字リアクションの追加/削除
- **設定**: スラッシュコマンドによるPlugin権限の管理

このスキルは、Plugin がインストールされると自動的に利用可能になります。

## 機能

| 機能         | ステータス                                  |
| --------------- | --------------------------------------- |
| ダイレクトメッセージ | ✅ サポートされています                            |
| グループ/チャンネル | ✅ サポートされています (デフォルトではメンション制御) |
| スレッド         | ✅ サポートされています (スレッド内で自動返信)   |
| リッチテキスト       | ✅ Markdown を Tlon 形式に変換します    |
| 画像          | ✅ Tlon ストレージにアップロードします             |
| リアクション       | ✅ [バンドル済みスキル](#bundled-skill) 経由  |
| 投票           | ❌ まだサポートされていません                    |
| ネイティブコマンド | ✅ サポートされています (デフォルトでは owner のみ)    |

## トラブルシューティング

まずこの手順を実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

よくある失敗:

- **DM が無視される**: 送信者が `dmAllowlist` に含まれておらず、承認フロー用の `ownerShip` も設定されていません。
- **グループメッセージが無視される**: チャンネルが検出されていないか、送信者が認可されていません。
- **接続エラー**: ship URL に到達可能か確認してください。ローカル ship では `allowPrivateNetwork` を有効にしてください。
- **認証エラー**: ログインコードが現在のものか確認してください (コードはローテーションされます)。

## 設定リファレンス

完全な設定: [設定](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.tlon.enabled`: チャンネル起動を有効/無効にします。
- `channels.tlon.ship`: bot の Urbit ship 名 (例: `~sampel-palnet`)。
- `channels.tlon.url`: ship URL (例: `https://sampel-palnet.tlon.network`)。
- `channels.tlon.code`: ship ログインコード。
- `channels.tlon.allowPrivateNetwork`: localhost/LAN URL を許可します (SSRF バイパス)。
- `channels.tlon.ownerShip`: 承認システム用の owner ship (常に認可)。
- `channels.tlon.dmAllowlist`: DM を許可された ship (空 = なし)。
- `channels.tlon.autoAcceptDmInvites`: allowlist に含まれる ship からの DM を自動承認します。
- `channels.tlon.autoAcceptGroupInvites`: すべてのグループ招待を自動承認します。
- `channels.tlon.autoDiscoverChannels`: グループチャンネルを自動検出します (デフォルト: true)。
- `channels.tlon.groupChannels`: 手動で固定したチャンネル nest。
- `channels.tlon.defaultAuthorizedShips`: すべてのチャンネルで認可される ship。
- `channels.tlon.authorization.channelRules`: チャンネルごとの認可ルール。
- `channels.tlon.showModelSignature`: メッセージにモデル名を追加します。

## 注記

- グループ返信では、応答するためにメンション (例: `~your-bot-ship`) が必要です。
- スレッド返信: 受信メッセージがスレッド内にある場合、OpenClaw はスレッド内で返信します。
- リッチテキスト: Markdown 書式 (太字、斜体、コード、ヘッダー、リスト) は Tlon のネイティブ形式に変換されます。
- 画像: URL は Tlon ストレージにアップロードされ、画像ブロックとして埋め込まれます。

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
