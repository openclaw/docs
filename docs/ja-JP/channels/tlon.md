---
read_when:
    - Tlon/Urbit チャネル機能に取り組む
summary: Tlon/Urbit のサポート状況、機能、設定
title: Tlon
x-i18n:
    generated_at: "2026-07-05T11:06:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon は Urbit 上に構築された分散型メッセンジャーです。OpenClaw はあなたの Urbit ship に接続し、
DM とグループチャットメッセージに応答します。グループ返信はデフォルトで @ メンションが必要で、
その上に認可ルールと所有者承認フローが重ねられています。

ステータス: バンドル Plugin。DM、グループメンション、スレッド、リッチテキスト、画像のアップロード/ダウンロード、
所有者承認システムに対応しています。リアクションと投票には対応していません。

## バンドル Plugin

Tlon は現在の OpenClaw リリースにバンドルされています。パッケージ化されたビルドでは別途インストールは不要です。

古いビルド、またはこれを除外したカスタムインストールでは、npm からインストールします。

```bash
openclaw plugins install @openclaw/tlon
```

現在のリリースタグを追跡するには、裸のパッケージ名を使用します。バージョンを固定する（`@openclaw/tlon@x.y.z`）
のは、再現可能なインストールが必要な場合だけにしてください。

ローカルチェックアウトから:

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
      ownerShip: "~your-main-ship", // recommended: your ship, always authorized
    },
  },
}
```

設定を直接編集した後は Gateway を再起動してください。その後、ボットに DM するか、グループチャンネルで @ メンションします。

## プライベート/LAN ship

OpenClaw は SSRF 保護のため、デフォルトでプライベート/内部ホスト名と IP 範囲をブロックします。ship が
プライベートネットワーク（localhost、LAN IP、内部ホスト名）で動作している場合は、明示的にオプトインしてください。

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

`http://localhost:8080`、`http://192.168.x.x:8080`、`http://my-ship.local:8080` のようなターゲットに適用されます。
信頼できる ship URL に対してのみ有効にしてください。そのアカウントの HTTP リクエストについて SSRF 保護が無効になります。

<Note>
`channels.tlon.allowPrivateNetwork`（フラットキー）は廃止されています。`openclaw doctor --fix` がこれを
`channels.tlon.network.dangerouslyAllowPrivateNetwork` に自動的に移動します。
</Note>

## グループチャンネル

チャンネルを手動でピン留めするか、自動検出を有効にします。

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

`autoDiscoverChannels` は、設定で未指定の場合はデフォルトで `false` です。セットアップウィザードではプロンプトのデフォルトが
yes になり、`true` が明示的に書き込まれます。有効にすると、OpenClaw は起動時に参加済みグループを scry し、
グループ招待が承認されると新しいチャンネルを監視し、2 分ごとに再チェックします。

## アクセス制御

DM 許可リスト（空 = 送信者が `ownerShip` でない限り DM は許可されません）:

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

グループ認可はチャンネルごとにデフォルトで `restricted` です。ベースラインとして `defaultAuthorizedShips` を設定し、
チャンネル nest ごとに上書きします。

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

ボットが一度スレッド内で返信すると、そのスレッド内の以後のメッセージには、別のメンションを要求せずに応答し続けます。

## 所有者と承認システム

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

所有者 ship はどこでも認可されます。DM 招待は常に自動承認され、グループ招待も常に自動承認され、チャンネルメッセージも常に認可を通過します。
所有者は `dmAllowlist`、`defaultAuthorizedShips`、`groupInviteAllowlist` に含まれている必要はありません。

`ownerShip` が設定されている場合、未認可のリクエストは単に破棄されるのではなく、保留中の承認としてキューに入り、
所有者に DM されます。

- `dmAllowlist` に含まれていない ship からの DM リクエスト
- 送信者が認可に失敗したチャンネル内のメンション
- `groupInviteAllowlist` に含まれていない ship からのグループ招待（自動承認がオフの場合、またはオンでも
  招待者が許可リストに含まれていない場合）

所有者は DM で返信してリクエストに対処します。

| 所有者の返信                 | 効果                                                 |
| ---------------------------- | ---------------------------------------------------- |
| `approve` / `deny` / `block` | 最新の保留中承認に対処します                         |
| `approve <id>` / `deny <id>` | id で特定の承認に対処します                          |
| `block`                      | ship もネイティブにブロックし、再接続できないようにします |
| `unblock ~ship`              | ネイティブブロックを取り消します                     |
| `blocked`                    | 現在ブロックされている ship を一覧表示します         |
| `pending`                    | 保留中の承認リクエストを一覧表示します               |

`ownerShip` が設定されていない場合、未認可の DM とチャンネルメンションは単に破棄され、ログに記録されます。
承認プロンプトはありません。

## 自動承認設定

`dmAllowlist` にすでに含まれている ship からの DM 招待を自動承認します（所有者はこのフラグに関係なく常に自動承認されます）。

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

許可リストからのグループ招待を自動承認します（フェイルクローズ: `autoAcceptGroupInvites: true` で
`groupInviteAllowlist` が空の場合、所有者以外からの招待は承認されません）。

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

上記の設定のほとんど（`dmAllowlist`、`groupInviteAllowlist`、`groupChannels`、
`defaultAuthorizedShips`、`autoDiscoverChannels`、`autoAcceptDmInvites`、
`autoAcceptGroupInvites`、`ownerShip`、`showModelSignature`）は、初回実行時に ship の
`%settings` agent（desk `moltbot`、bucket `tlon`）へミラーされ、その後はそこからライブで読み込まれます。
そのため、Landscape クライアントまたはバンドル Skills の設定コマンドから行った変更は、Gateway の再起動なしで適用されます。
`channelRules` と保留中の承認も JSON としてそこに永続化されます。設定ストアに一度も書き込まれていない値については、
ファイル設定が信頼できる情報源のままです。

## 配信ターゲット（CLI/cron）

`openclaw message send` または cron 配信で使用します。

- DM: `~sampel-palnet` または `dm/~sampel-palnet`
- グループ: `chat/~host-ship/channel` または `group:~host-ship/channel`

## バンドル Skills

この Plugin は、直接 Urbit 操作を行う CLI である [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill) をバンドルしています。
Plugin がインストールされると自動的に利用できます。

- **アクティビティ**: メンション、返信、未読
- **チャンネル**: 一覧表示、作成、名前変更
- **連絡先**: プロファイルの一覧表示/取得/更新
- **グループ**: 作成、参加、招待/リクエストフロー、ロール
- **フック**: チャンネルフックの管理
- **メッセージ**: 履歴、検索
- **DM**: 送信、リアクション、承認/拒否
- **投稿**: リアクション、削除
- **Notebook**: diary チャンネルへの投稿
- **設定**: 上記の設定ストアを介した Plugin 設定のホットリロード

## 機能

| 機能            | ステータス                                      |
| --------------- | ----------------------------------------------- |
| ダイレクトメッセージ | 対応                                            |
| グループ/チャンネル | 対応（デフォルトでメンションゲートあり）       |
| スレッド        | 対応（一度参加すると返信し続けます）            |
| リッチテキスト  | Markdown を Tlon のネイティブ形式へ変換         |
| 画像            | 受信時にダウンロード、送信時にアップロード      |
| リアクション    | [バンドル Skills](#bundled-skill) 経由のみ      |
| 投票            | 非対応                                          |
| ネイティブコマンド | デフォルトで所有者のみ                         |

## トラブルシューティング

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

よくある失敗:

- **DM が無視される**: 送信者が `dmAllowlist` に含まれておらず、承認フロー用の `ownerShip` も設定されていません。
- **グループメッセージが無視される**: チャンネルが検出/ピン留めされていないか、送信者が認可に失敗しており、
  承認をキューに入れるための `ownerShip` がありません。
- **接続エラー**: ship URL に到達できることを確認してください。ローカル ship には
  `network.dangerouslyAllowPrivateNetwork` を設定します。
- **認証エラー**: ログインコードはローテーションされます。ship から現在のコードをコピーしてください。

## 設定リファレンス

完全な設定: [設定](/ja-JP/gateway/configuration)

| キー                                                   | 意味                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `channels.tlon.enabled`                                | チャンネル起動を有効/無効にします。                           |
| `channels.tlon.ship`                                   | ボットの Urbit ship 名（例: `~sampel-palnet`）。               |
| `channels.tlon.url`                                    | ship URL（例: `https://sampel-palnet.tlon.network`）。         |
| `channels.tlon.code`                                   | ship ログインコード。                                          |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | localhost/LAN の ship URL を許可します（SSRF オプトイン）。    |
| `channels.tlon.ownerShip`                              | 所有者 ship: 常に認可され、承認リクエストを受け取ります。      |
| `channels.tlon.dmAllowlist`                            | DM を許可された ship（空 = 所有者以外なし）。                  |
| `channels.tlon.autoAcceptDmInvites`                    | `dmAllowlist` 内の ship からの DM を自動承認します。           |
| `channels.tlon.autoAcceptGroupInvites`                 | `groupInviteAllowlist` からのグループ招待を自動承認します。    |
| `channels.tlon.groupInviteAllowlist`                   | グループ招待が自動承認される ship。                            |
| `channels.tlon.autoDiscoverChannels`                   | 参加済みグループチャンネルを自動検出します（デフォルト: `false`）。 |
| `channels.tlon.groupChannels`                          | 手動でピン留めされたチャンネル nest。                          |
| `channels.tlon.defaultAuthorizedShips`                 | すべてのチャンネルで認可される ship（どのルールにも一致しない場合に使用）。 |
| `channels.tlon.authorization.channelRules`             | チャンネル nest ごとの認可モード + 許可リスト。                |
| `channels.tlon.showModelSignature`                     | 返信に `_[Generated by <model>]_` を追加します。                |
| `channels.tlon.responsePrefix`                         | 送信返信の前に付ける静的プレフィックス。                       |
| `channels.tlon.accounts.<id>`                          | 追加の名前付きアカウント（複数 ship セットアップ）。           |

## 注記

- ボットがすでにそのスレッドに参加していない限り、グループ返信には @ メンション（例: `~your-bot-ship`）が必要です。
- スレッド返信はスレッド内に送信されます。ボットには、agent 用にスレッドコンテキストの直近 10 件のメッセージも前置されます。
- リッチテキスト（太字、斜体、コード、ヘッダー、リスト）は Tlon のネイティブ形式に変換されます。
- チャンネル要約を求める受信メッセージ（たとえば「このチャンネルを要約して」）を送信すると、
  通常の返信フローではなく組み込みの履歴要約がトリガーされます。

## 関連

- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
