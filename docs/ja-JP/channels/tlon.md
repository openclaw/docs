---
read_when:
    - Tlon/Urbit チャネル機能に取り組む
summary: Tlon/Urbit のサポート状況、機能、設定
title: Tlon
x-i18n:
    generated_at: "2026-05-04T02:22:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1718044541b431ff2437508e7e6659c14206f4aa84ab8b207e0d791dea2a48c5
    source_path: channels/tlon.md
    workflow: 16
---

Tlon は Urbit 上に構築された分散型メッセンジャーです。OpenClaw はあなたの Urbit ship に接続し、
DM とグループチャットメッセージに応答できます。グループ返信ではデフォルトで @ メンションが必要で、
allowlist によってさらに制限できます。

ステータス: バンドル済み Plugin。DM、グループメンション、スレッド返信、リッチテキスト書式設定、
画像アップロードがサポートされています。リアクションと投票はまだサポートされていません。

## バンドル済み Plugin

Tlon は現在の OpenClaw リリースにバンドル済み Plugin として同梱されているため、通常のパッケージ済み
ビルドでは個別のインストールは不要です。

古いビルドを使用している場合や、Tlon を除外したカスタムインストールの場合は、
現在の npm パッケージをインストールしてください。

CLI 経由でインストール (npm registry):

```bash
openclaw plugins install @openclaw/tlon
```

現在の公式リリースタグに追従するには、bare パッケージを使用します。再現可能な
インストールが必要な場合にのみ、正確なバージョンを固定してください。

ローカル checkout (git repo から実行する場合):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## セットアップ

1. Tlon Plugin が利用可能であることを確認します。
   - 現在のパッケージ済み OpenClaw リリースにはすでにバンドルされています。
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

デフォルトでは、OpenClaw は SSRF 保護のためにプライベート/内部ホスト名と IP 範囲をブロックします。
ship がプライベートネットワーク (localhost、LAN IP、または内部ホスト名) で実行されている場合は、
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

⚠️ これはローカルネットワークを信頼している場合にのみ有効にしてください。この設定は、
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

自動検出を無効にします。

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

グループ認可 (デフォルトで制限):

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

## owner と承認システム

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

owner ship は **すべての場所で自動的に認可されます** — DM 招待は自動承認され、
チャンネルメッセージは常に許可されます。owner を `dmAllowlist` や
`defaultAuthorizedShips` に追加する必要はありません。

設定すると、owner は次の DM 通知を受け取ります。

- allowlist にない ship からの DM リクエスト
- 認可なしのチャンネルでのメンション
- グループ招待リクエスト

## 自動承認設定

DM 招待を自動承認します (`dmAllowlist` 内の ship の場合):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

信頼済み ship からのグループ招待を自動承認します。

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

`autoAcceptGroupInvites` は `groupInviteAllowlist` が空の場合、fail closed になります。
自動的に承認するグループ招待元の ship を allowlist に設定してください。

## 配信先 (CLI/cron)

`openclaw message send` または cron 配信でこれらを使用します。

- DM: `~sampel-palnet` または `dm/~sampel-palnet`
- グループ: `chat/~host-ship/channel` または `group:~host-ship/channel`

## バンドル済み skill

Tlon Plugin には、Tlon 操作への CLI アクセスを提供するバンドル済み skill ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
が含まれています。

- **連絡先**: プロフィールの取得/更新、連絡先一覧
- **チャンネル**: 一覧表示、作成、メッセージ投稿、履歴取得
- **グループ**: 一覧表示、作成、メンバー管理
- **DM**: メッセージ送信、メッセージへのリアクション
- **リアクション**: 投稿と DM に emoji リアクションを追加/削除
- **設定**: slash command 経由で Plugin 権限を管理

この skill は Plugin がインストールされると自動的に利用可能になります。

## 機能

| 機能                  | ステータス                                      |
| --------------------- | ----------------------------------------------- |
| ダイレクトメッセージ  | ✅ サポート済み                                 |
| グループ/チャンネル   | ✅ サポート済み (デフォルトでメンション必須)    |
| スレッド              | ✅ サポート済み (スレッド内で自動返信)          |
| リッチテキスト        | ✅ Markdown を Tlon 形式に変換                  |
| 画像                  | ✅ Tlon ストレージにアップロード                |
| リアクション          | ✅ [バンドル済み skill](#bundled-skill) 経由    |
| 投票                  | ❌ まだサポートされていません                  |
| ネイティブコマンド    | ✅ サポート済み (デフォルトで owner のみ)       |

## トラブルシューティング

まずこの手順を実行してください。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

よくある失敗:

- **DM が無視される**: 送信者が `dmAllowlist` に含まれておらず、承認フロー用の `ownerShip` も設定されていません。
- **グループメッセージが無視される**: チャンネルが検出されていないか、送信者が認可されていません。
- **接続エラー**: ship URL に到達できることを確認してください。ローカル ship には `allowPrivateNetwork` を有効にしてください。
- **認証エラー**: ログインコードが現在有効であることを確認してください (コードはローテーションされます)。

## 設定リファレンス

完全な設定: [設定](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.tlon.enabled`: チャンネル起動を有効/無効にします。
- `channels.tlon.ship`: bot の Urbit ship 名 (例: `~sampel-palnet`)。
- `channels.tlon.url`: ship URL (例: `https://sampel-palnet.tlon.network`)。
- `channels.tlon.code`: ship ログインコード。
- `channels.tlon.allowPrivateNetwork`: localhost/LAN URL を許可します (SSRF bypass)。
- `channels.tlon.ownerShip`: 承認システム用の owner ship (常に認可済み)。
- `channels.tlon.dmAllowlist`: DM を許可された ship (空 = なし)。
- `channels.tlon.autoAcceptDmInvites`: allowlist に含まれる ship からの DM を自動承認します。
- `channels.tlon.autoAcceptGroupInvites`: allowlist に含まれる ship からのグループ招待を自動承認します。
- `channels.tlon.groupInviteAllowlist`: グループ招待を自動承認できる ship。
- `channels.tlon.autoDiscoverChannels`: グループチャンネルを自動検出します (デフォルト: true)。
- `channels.tlon.groupChannels`: 手動で固定されたチャンネル nest。
- `channels.tlon.defaultAuthorizedShips`: すべてのチャンネルで認可される ship。
- `channels.tlon.authorization.channelRules`: チャンネルごとの認可ルール。
- `channels.tlon.showModelSignature`: メッセージにモデル名を追加します。

## 注記

- グループ返信では、応答するためにメンション (例: `~your-bot-ship`) が必要です。
- スレッド返信: 受信メッセージがスレッド内にある場合、OpenClaw はスレッド内で返信します。
- リッチテキスト: Markdown 書式 (太字、斜体、コード、見出し、リスト) は Tlon のネイティブ形式に変換されます。
- 画像: URL は Tlon ストレージにアップロードされ、画像ブロックとして埋め込まれます。

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
