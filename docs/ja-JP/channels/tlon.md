---
read_when:
    - Tlon/Urbit チャネル機能に取り組む
summary: Tlon/Urbit のサポート状況、機能、設定
title: Tlon
x-i18n:
    generated_at: "2026-04-30T05:01:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: bec632f946796a0ea4bceb5ad26f1ff1825c4304bf7252e9d2fd4d3889d36b52
    source_path: channels/tlon.md
    workflow: 16
---

Tlon は Urbit 上に構築された分散型メッセンジャーです。OpenClaw はあなたの Urbit ship に接続し、
DM とグループチャットメッセージに応答できます。グループ返信には既定で @ メンションが必要で、
許可リストによってさらに制限できます。

ステータス: バンドル済みPlugin。DM、グループメンション、スレッド返信、リッチテキスト書式、
画像アップロードに対応しています。リアクションと投票にはまだ対応していません。

## バンドル済みPlugin

Tlon は現在の OpenClaw リリースにバンドル済みPluginとして同梱されているため、通常のパッケージ版
ビルドでは別途インストールする必要はありません。

古いビルドを使用している場合、または Tlon を除外したカスタムインストールの場合は、
公開されている場合に現在の npm パッケージをインストールしてください。

CLI でインストール (npm registry、現在のパッケージが存在する場合):

```bash
openclaw plugins install @openclaw/tlon
```

npm が OpenClaw 所有のパッケージを非推奨として報告する場合は、新しい npm パッケージが
公開されるまで、現在のパッケージ版 OpenClaw ビルドまたはローカルチェックアウトパスを使用してください。

ローカルチェックアウト (git repo から実行している場合):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## セットアップ

1. Tlon Plugin が利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースにはすでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. ship URL とログインコードを用意します。
3. `channels.tlon` を設定します。
4. Gateway を再起動します。
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

既定では、OpenClaw は SSRF 保護のためにプライベート/内部ホスト名と IP 範囲をブロックします。
ship がプライベートネットワーク (localhost、LAN IP、内部ホスト名) で実行されている場合は、
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

⚠️ ローカルネットワークを信頼している場合にのみ有効にしてください。この設定は、ship URL へのリクエストに対する
SSRF 保護を無効にします。

## グループチャンネル

自動検出は既定で有効です。チャンネルを手動で固定することもできます。

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

DM 許可リスト (空 = DM は許可されません。承認フローには `ownerShip` を使用):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

グループ認可 (既定で制限あり):

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

未認可ユーザーがやり取りしようとしたときに承認リクエストを受け取るオーナー ship を設定します。

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

オーナー ship は **どこでも自動的に認可されます** — DM 招待は自動承認され、
チャンネルメッセージは常に許可されます。オーナーを `dmAllowlist` または
`defaultAuthorizedShips` に追加する必要はありません。

設定されている場合、オーナーは次について DM 通知を受け取ります。

- 許可リストにない ship からの DM リクエスト
- 認可されていないチャンネルでのメンション
- グループ招待リクエスト

## 自動承認設定

DM 招待を自動承認 (dmAllowlist 内の ship の場合):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

グループ招待を自動承認:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## 配信先 (CLI/cron)

`openclaw message send` または cron 配信で使用します。

- DM: `~sampel-palnet` または `dm/~sampel-palnet`
- グループ: `chat/~host-ship/channel` または `group:~host-ship/channel`

## バンドル済みSkill

Tlon Plugin には、Tlon 操作への CLI アクセスを提供するバンドル済みSkill ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
が含まれています。

- **連絡先**: プロフィールの取得/更新、連絡先の一覧表示
- **チャンネル**: 一覧表示、作成、メッセージ投稿、履歴取得
- **グループ**: 一覧表示、作成、メンバー管理
- **DM**: メッセージ送信、メッセージへのリアクション
- **リアクション**: 投稿と DM への絵文字リアクションの追加/削除
- **設定**: slash command による Plugin 権限の管理

このSkillは、Plugin がインストールされると自動的に利用可能になります。

## 機能

| 機能            | ステータス                              |
| --------------- | --------------------------------------- |
| ダイレクトメッセージ | ✅ 対応済み                            |
| グループ/チャンネル | ✅ 対応済み (既定ではメンション制御) |
| スレッド        | ✅ 対応済み (スレッド内で自動返信)   |
| リッチテキスト  | ✅ Markdown を Tlon 形式に変換    |
| 画像            | ✅ Tlon storage にアップロード             |
| リアクション    | ✅ [バンドル済みSkill](#bundled-skill) 経由  |
| 投票            | ❌ まだ未対応                    |
| ネイティブコマンド | ✅ 対応済み (既定ではオーナーのみ)    |

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
- **グループメッセージが無視される**: チャンネルが検出されていない、または送信者が認可されていません。
- **接続エラー**: ship URL に到達できることを確認します。ローカル ship では `allowPrivateNetwork` を有効にします。
- **認証エラー**: ログインコードが現在のものであることを確認します (コードはローテーションされます)。

## 設定リファレンス

完全な設定: [Configuration](/ja-JP/gateway/configuration)

Provider オプション:

- `channels.tlon.enabled`: チャンネル起動を有効/無効にします。
- `channels.tlon.ship`: bot の Urbit ship 名 (例: `~sampel-palnet`)。
- `channels.tlon.url`: ship URL (例: `https://sampel-palnet.tlon.network`)。
- `channels.tlon.code`: ship ログインコード。
- `channels.tlon.allowPrivateNetwork`: localhost/LAN URL を許可します (SSRF バイパス)。
- `channels.tlon.ownerShip`: 承認システム用のオーナー ship (常に認可)。
- `channels.tlon.dmAllowlist`: DM を許可された ship (空 = なし)。
- `channels.tlon.autoAcceptDmInvites`: 許可リスト内の ship からの DM を自動承認します。
- `channels.tlon.autoAcceptGroupInvites`: すべてのグループ招待を自動承認します。
- `channels.tlon.autoDiscoverChannels`: グループチャンネルを自動検出します (既定: true)。
- `channels.tlon.groupChannels`: 手動で固定されたチャンネル nest。
- `channels.tlon.defaultAuthorizedShips`: すべてのチャンネルで認可された ship。
- `channels.tlon.authorization.channelRules`: チャンネルごとの認証ルール。
- `channels.tlon.showModelSignature`: メッセージにモデル名を追加します。

## 注記

- グループ返信には、応答するためのメンション (例: `~your-bot-ship`) が必要です。
- スレッド返信: 受信メッセージがスレッド内にある場合、OpenClaw はスレッド内で返信します。
- リッチテキスト: Markdown 書式 (太字、斜体、コード、ヘッダー、リスト) は Tlon のネイティブ形式に変換されます。
- 画像: URL は Tlon storage にアップロードされ、画像ブロックとして埋め込まれます。

## 関連

- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
