---
read_when:
    - Tlon/Urbit チャンネル機能の開発
summary: Tlon/Urbit のサポート状況、機能、および設定
title: Tlon
x-i18n:
    generated_at: "2026-07-11T22:02:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon は Urbit 上に構築された分散型メッセンジャーです。OpenClaw は Urbit ship に接続し、
DM とグループチャットのメッセージに応答します。グループでの返信にはデフォルトで @ メンションが必要で、
さらに認可ルールとオーナー承認フローが適用されます。

状態: バンドル済み Plugin。DM、グループメンション、スレッド、リッチテキスト、画像のアップロードとダウンロード、
およびオーナー承認システムに対応しています。リアクションと投票には対応していません。

## バンドル済み Plugin

現在の OpenClaw リリースには Tlon がバンドルされているため、パッケージ版ビルドでは個別にインストールする必要はありません。

Tlon を含まない古いビルドまたはカスタムインストールでは、npm からインストールします。

```bash
openclaw plugins install @openclaw/tlon
```

現在のリリースタグを追跡するには、バージョンなしのパッケージ名を使用します。バージョンを固定する
（`@openclaw/tlon@x.y.z`）のは、再現可能なインストールが必要な場合のみにしてください。

ローカルチェックアウトからインストールする場合:

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

詳細: [Plugin](/ja-JP/tools/plugin)

## セットアップ

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

または、設定を直接編集します。

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // 推奨: 自分の ship。常に認可される
    },
  },
}
```

設定を直接編集した後は Gateway を再起動します。その後、ボットに DM を送るか、グループ
チャンネルで @ メンションします。

## プライベート/LAN の ship

OpenClaw は SSRF 対策として、デフォルトでプライベート/内部ホスト名と IP 範囲をブロックします。ship が
プライベートネットワーク（localhost、LAN IP、内部ホスト名）上で動作している場合は、明示的に許可します。

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
    },
  },
}
```

`http://localhost:8080`、`http://192.168.x.x:8080`、
`http://my-ship.local:8080` などの接続先に適用されます。信頼できる ship URL に対してのみ有効にしてください。
そのアカウントの HTTP リクエストに対する SSRF 保護が無効になります。

<Note>
`channels.tlon.allowPrivateNetwork`（フラットキー）は廃止されています。`openclaw doctor --fix` により、
`channels.tlon.network.dangerouslyAllowPrivateNetwork` へ自動的に移行されます。
</Note>

## グループチャンネル

チャンネルを手動で固定するか、自動検出を有効にします。

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
      autoDiscoverChannels: true,
    },
  },
}
```

`autoDiscoverChannels` は設定されていない場合、デフォルトで `false` になります。セットアップウィザードでは
プロンプトのデフォルトが「はい」に設定され、`true` が明示的に書き込まれます。有効にすると、OpenClaw は起動時に
参加済みグループを scry し、グループへの招待が承認された際に新しいチャンネルを監視し、2 分ごとに再確認します。

## アクセス制御

DM 許可リスト（空の場合、送信者が `ownerShip` でない限り DM は許可されません）:

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

グループの認可は、チャンネルごとにデフォルトで `restricted` です。基準となる
`defaultAuthorizedShips` を設定し、チャンネル nest ごとに上書きします。

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

ボットがスレッド内で一度返信すると、以降は再度メンションしなくても、そのスレッドの後続メッセージに
応答し続けます。

## オーナーと承認システム

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

オーナー ship はあらゆる場所で認可されます。DM 招待とグループ招待は常に自動承認され、
チャンネルメッセージは常に認可を通過します。オーナーを `dmAllowlist`、
`defaultAuthorizedShips`、`groupInviteAllowlist` に追加する必要はありません。

`ownerShip` が設定されている場合、未認可のリクエストは単に破棄されるのではなく、保留中の
承認としてキューに入り、オーナーへ DM で通知されます。

- `dmAllowlist` に含まれない ship からの DM リクエスト
- 送信者が認可されていないチャンネルでのメンション
- `groupInviteAllowlist` に含まれない ship からのグループ招待（自動承認が無効な場合、または有効でも
  招待者が許可リストに含まれていない場合）

オーナーは DM で返信してリクエストを処理します。

| オーナーの返信               | 効果                                                     |
| ---------------------------- | -------------------------------------------------------- |
| `approve` / `deny` / `block` | 最新の保留中の承認を処理する                             |
| `approve <id>` / `deny <id>` | ID を指定して承認を処理する                              |
| `block`                      | ship をネイティブ機能でもブロックし、再接続できなくする |
| `unblock ~ship`              | ネイティブブロックを解除する                             |
| `blocked`                    | 現在ブロックされている ship を一覧表示する               |
| `pending`                    | 保留中の承認リクエストを一覧表示する                     |

`ownerShip` が設定されていない場合、未認可の DM とチャンネルメンションは破棄されてログに記録されるだけで、
承認プロンプトは表示されません。

## 自動承認設定

`dmAllowlist` にすでに含まれる ship からの DM 招待を自動承認します（このフラグに関係なく、
オーナーは常に自動承認されます）。

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

許可リストに基づいてグループ招待を自動承認します（安全側で拒否します。`autoAcceptGroupInvites: true` で
`groupInviteAllowlist` が空の場合、オーナー以外からの招待は一切承認されません）。

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

## Urbit 設定ストアによるホットリロード

上記の設定の大半（`dmAllowlist`、`groupInviteAllowlist`、`groupChannels`、
`defaultAuthorizedShips`、`autoDiscoverChannels`、`autoAcceptDmInvites`、
`autoAcceptGroupInvites`、`ownerShip`、`showModelSignature`）は、初回実行時に ship の
`%settings` エージェント（desk `moltbot`、bucket `tlon`）へミラーされ、その後はそこからリアルタイムで
読み込まれます。そのため、Landscape クライアントまたはバンドル済みスキルの設定コマンドから行った変更は、
Gateway を再起動しなくても適用されます。`channelRules` と保留中の承認も JSON としてそこに永続化されます。
設定ストアへ一度も書き込まれていない値については、ファイル設定が引き続き信頼できる唯一の情報源です。

## 配信先（CLI/Cron）

`openclaw message send` または Cron 配信で使用します。

- DM: `~sampel-palnet` または `dm/~sampel-palnet`
- グループ: `chat/~host-ship/channel` または `group:~host-ship/channel`

## バンドル済みスキル

この Plugin には、Urbit を直接操作するための CLI である
[`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill) がバンドルされており、
Plugin のインストール後に自動的に利用可能になります。

- **アクティビティ**: メンション、返信、未読
- **チャンネル**: 一覧表示、作成、名前変更
- **連絡先**: プロフィールの一覧表示、取得、更新
- **グループ**: 作成、参加、招待/リクエストフロー、ロール
- **フック**: チャンネルフックの管理
- **メッセージ**: 履歴、検索
- **DM**: 送信、リアクション、承認/拒否
- **投稿**: リアクション、削除
- **ノートブック**: 日記チャンネルへの投稿
- **設定**: 上記の設定ストアを通じた Plugin 設定のホットリロード

## 機能

| 機能                 | 状態                                                   |
| -------------------- | ------------------------------------------------------ |
| ダイレクトメッセージ | 対応                                                   |
| グループ/チャンネル  | 対応（デフォルトではメンションが必要）                 |
| スレッド             | 対応（一度参加すると返信を継続）                       |
| リッチテキスト       | Markdown を Tlon のネイティブ形式に変換                |
| 画像                 | 受信時にダウンロード、送信時にアップロード             |
| リアクション         | [バンドル済みスキル](#bundled-skill)経由でのみ利用可能 |
| 投票                 | 非対応                                                 |
| ネイティブコマンド   | デフォルトではオーナーのみ                             |

## トラブルシューティング

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

よくある問題:

- **DM が無視される**: 送信者が `dmAllowlist` に含まれておらず、承認フロー用の `ownerShip` も設定されていません。
- **グループメッセージが無視される**: チャンネルが検出または固定されていないか、送信者が認可されておらず、
  承認をキューに入れるための `ownerShip` も設定されていません。
- **接続エラー**: ship URL に到達できることを確認してください。ローカルの ship には
  `network.dangerouslyAllowPrivateNetwork` を設定します。
- **認証エラー**: ログインコードはローテーションされます。ship から現在のコードをコピーしてください。

## 設定リファレンス

完全な設定: [設定](/ja-JP/gateway/configuration)

| キー                                                   | 意味                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `channels.tlon.enabled`                                | チャンネルの起動を有効化/無効化する。                              |
| `channels.tlon.ship`                                   | ボットの Urbit ship 名（例: `~sampel-palnet`）。                    |
| `channels.tlon.url`                                    | ship URL（例: `https://sampel-palnet.tlon.network`）。              |
| `channels.tlon.code`                                   | ship のログインコード。                                            |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | localhost/LAN の ship URL を許可する（SSRF の明示的な許可）。       |
| `channels.tlon.ownerShip`                              | オーナー ship。常に認可され、承認リクエストを受信する。             |
| `channels.tlon.dmAllowlist`                            | DM を許可する ship（空の場合はオーナー以外なし）。                  |
| `channels.tlon.autoAcceptDmInvites`                    | `dmAllowlist` 内の ship からの DM を自動承認する。                  |
| `channels.tlon.autoAcceptGroupInvites`                 | `groupInviteAllowlist` 内の ship からのグループ招待を自動承認する。 |
| `channels.tlon.groupInviteAllowlist`                   | グループ招待が自動承認される ship。                                 |
| `channels.tlon.autoDiscoverChannels`                   | 参加済みグループチャンネルを自動検出する（デフォルト: `false`）。   |
| `channels.tlon.groupChannels`                          | 手動で固定したチャンネル nest。                                    |
| `channels.tlon.defaultAuthorizedShips`                 | すべてのチャンネルで認可される ship（ルール不一致時に使用）。       |
| `channels.tlon.authorization.channelRules`             | チャンネル nest ごとの認可モードと許可リスト。                      |
| `channels.tlon.showModelSignature`                     | 返信に `_[Generated by <model>]_` を追加する。                      |
| `channels.tlon.responsePrefix`                         | 送信する返信の先頭に付加する固定プレフィックス。                   |
| `channels.tlon.accounts.<id>`                          | 追加の名前付きアカウント（複数 ship 構成）。                        |

## 注記

- ボットがすでにそのスレッドへ参加している場合を除き、グループでの返信には @ メンション
  （例: `~your-bot-ship`）が必要です。
- スレッドへの返信はスレッド内に投稿されます。また、エージェントにはスレッドコンテキストの直近 10 件の
  メッセージが先頭に追加されます。
- リッチテキスト（太字、斜体、コード、見出し、リスト）は Tlon のネイティブ形式に変換されます。
- チャンネルの要約を求める受信メッセージ（例: 「このチャンネルを要約して」）を送信すると、
  通常の返信フローではなく、組み込みの履歴要約が実行されます。

## 関連項目

- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM の認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションによる制限
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
