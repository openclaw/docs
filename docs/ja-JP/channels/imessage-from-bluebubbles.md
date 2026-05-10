---
read_when:
    - BlueBubbles から同梱の iMessage Plugin への移行計画
    - BlueBubbles の設定キーを iMessage の対応項目に変換する
    - iMessage Pluginを有効化する前に imsg を検証する
summary: 古い BlueBubbles 設定を、ペアリング、許可リスト、グループバインディングを失うことなく、同梱の iMessage Plugin へ移行します。
title: BlueBubbles からの移行
x-i18n:
    generated_at: "2026-05-10T19:21:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

同梱の `imessage` Plugin は、JSON-RPC 経由で [`steipete/imsg`](https://github.com/steipete/imsg) を駆動することで、BlueBubbles と同じ private API サーフェス（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、グループ管理、添付ファイル）に到達できるようになりました。`imsg` をインストール済みの Mac をすでに運用している場合は、BlueBubbles サーバーを外し、Plugin から Messages.app に直接通信させることができます。

BlueBubbles サポートは削除されました。OpenClaw は `imsg` のみを通じて iMessage をサポートします。このガイドは古い `channels.bluebubbles` 設定を `channels.imessage` に移行するためのものです。それ以外のサポート対象の移行パスはありません。

## この移行が適している場合

- Messages.app にサインイン済みの同じ Mac（または SSH で到達可能な Mac）で、すでに `imsg` を実行している。
- 可動部分を 1 つ減らしたい。別個の BlueBubbles サーバーも、認証する REST エンドポイントも、Webhook 配線も不要です。サーバー + クライアントアプリ + ヘルパーではなく、単一の CLI バイナリになります。
- private API プローブが `available: true` を報告する、[サポート対象の macOS / `imsg` ビルド](/ja-JP/channels/imessage#requirements-and-permissions-macos)を使用している。

## imsg の機能

`imsg` は Messages 用のローカル macOS CLI です。OpenClaw は `imsg rpc` を子プロセスとして起動し、stdin/stdout 経由で JSON-RPC を使って通信します。HTTP サーバー、Webhook URL、バックグラウンドデーモン、launch agent、公開するポートはありません。

- 読み取りは、読み取り専用 SQLite ハンドルを使用して `~/Library/Messages/chat.db` から行われます。
- ライブ受信メッセージは `imsg watch` / `watch.subscribe` から来ます。これはポーリングのフォールバック付きで `chat.db` のファイルシステムイベントを追跡します。
- 通常のテキスト送信とファイル送信には Messages.app の自動化を使用します。
- 高度なアクションでは、`imsg launch` を使って `imsg` ヘルパーを Messages.app に注入します。これにより、開封確認、入力インジケーター、リッチ送信、編集、送信取り消し、スレッド返信、タップバック、グループ管理が有効になります。
- Linux ビルドではコピーされた `chat.db` を検査できますが、送信、ライブ Mac データベースの監視、Messages.app の駆動はできません。OpenClaw iMessage では、サインイン済みの Mac 上で `imsg` を実行するか、その Mac への SSH ラッパー経由で実行してください。

## 始める前に

1. Messages.app を実行する Mac に `imsg` をインストールします。

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   `imsg chats` が `unable to open database file`、空の出力、または `authorization denied` で失敗する場合は、`imsg` を起動するターミナル、エディター、Node プロセス、Gateway サービス、または SSH 親プロセスにフルディスクアクセスを付与し、その親プロセスを再度開いてください。

2. OpenClaw 設定を変更する前に、読み取り、監視、送信、RPC サーフェスを検証します。

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42` は `imsg chats` から取得した実際のチャット ID に置き換えてください。送信には Messages.app の Automation 権限が必要です。OpenClaw を SSH 経由で実行する場合は、OpenClaw が使用するのと同じ SSH ラッパーまたはユーザーコンテキストでこれらのコマンドを実行してください。

3. 高度なアクションが必要な場合は、private API ブリッジを有効にします。

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` には SIP を無効にする必要があります。基本的な送信、履歴、監視は `imsg launch` なしで動作しますが、高度なアクションは動作しません。

4. OpenClaw 経由でブリッジを検証します。

   ```bash
   openclaw channels status --probe
   ```

   `imessage.privateApi.available: true` になっている必要があります。`false` と報告される場合は、まずそれを修正してください。[機能検出](/ja-JP/channels/imessage#private-api-actions)を参照してください。

5. 設定のスナップショットを作成します。

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## 設定の変換

iMessage と BlueBubbles は、多くのチャネルレベル設定を共有しています。変更されるキーのほとんどはトランスポート（REST サーバーかローカル CLI か）です。動作キー（`dmPolicy`、`groupPolicy`、`allowFrom` など）は同じ意味を保ちます。

| BlueBubbles                                                | 同梱 iMessage                            | 注記                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 意味は同じです。                                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.serverUrl`                           | _(削除済み)_                              | REST サーバーはありません — Plugin が stdio 経由で `imsg rpc` を起動します。                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.password`                            | _(削除済み)_                              | Webhook 認証は不要です。                                                                                                                                                                                                                                                                                                                     |
| _(暗黙)_                                                   | `channels.imessage.cliPath`               | `imsg` へのパス（デフォルトは `imsg`）。SSH にはラッパースクリプトを使用します。                                                                                                                                                                                                                                                             |
| _(暗黙)_                                                   | `channels.imessage.dbPath`                | 任意の Messages.app `chat.db` オーバーライド。省略時は自動検出されます。                                                                                                                                                                                                                                                                       |
| _(暗黙)_                                                   | `channels.imessage.remoteHost`            | `host` または `user@host` — `cliPath` が SSH ラッパーで、SCP による添付ファイル取得を使いたい場合にのみ必要です。                                                                                                                                                                                                                             |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 同じ値（`pairing` / `allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | ペアリング承認は token ではなく handle で引き継がれます。                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 同じ値（`allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 同じです。                                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **`groups: { "*": { ... } }` ワイルドカードエントリを含め、これをそのままコピーしてください。** グループごとの `requireMention`、`tools`、`toolsBySender` は引き継がれます。`groupPolicy: "allowlist"` では、`groups` ブロックが空または欠落していると、すべてのグループメッセージが黙って破棄されます — 下の「グループレジストリの落とし穴」を参照してください。 |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | デフォルトは `true`。同梱 Plugin では、これは private API プローブが稼働している場合にのみ実行されます。                                                                                                                                                                                                                                      |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 同じ形で、**同じくデフォルトはオフ**。BlueBubbles で添付ファイルを流していた場合は、iMessage ブロックでこれを明示的に再設定する必要があります — 暗黙には引き継がれず、設定するまで受信写真/メディアは `Inbound message` ログ行なしで黙って破棄されます。                                                                                 |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | ローカルルート。同じワイルドカードルールです。                                                                                                                                                                                                                                                                                                |
| _(該当なし)_                                               | `channels.imessage.remoteAttachmentRoots` | `remoteHost` が SCP 取得用に設定されている場合にのみ使用されます。                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage ではデフォルト 16 MB（BlueBubbles のデフォルトは 8 MB）。低い上限を維持したい場合は明示的に設定してください。                                                                                                                                                                                                                        |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | どちらもデフォルトは 4000 です。                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 同じオプトインです。DM のみ — グループチャットでは、どちらのチャンネルでもメッセージごとの即時ディスパッチを維持します。明示的な `messages.inbound.byChannel.imessage` なしで有効にした場合、デフォルトの受信デバウンスが 2500 ms に広がります。[iMessage ドキュメント § 分割送信 DM の結合](/ja-JP/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition) を参照してください。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(該当なし)_                              | iMessage はすでに `chat.db` から送信者の表示名を読み取ります。                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | アクションごとのトグル: `reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`。                                                                                                                                                      |

マルチアカウント設定（`channels.bluebubbles.accounts.*`）は、`channels.imessage.accounts.*` に一対一で変換されます。

## グループレジストリの落とし穴

同梱 iMessage Plugin は、**2 つ**の別々のグループ allowlist ゲートを連続して実行します。グループメッセージがエージェントに届くには、両方を通過する必要があります。

1. **送信者 / チャットターゲット allowlist**（`channels.imessage.groupAllowFrom`）— `isAllowedIMessageSender` によってチェックされます。受信メッセージを送信者 handle、`chat_guid`、`chat_identifier`、または `chat_id` で照合します。形は BlueBubbles と同じです。
2. **グループレジストリ**（`channels.imessage.groups`）— `inbound-processing.ts:199` の `resolveChannelGroupPolicy` によってチェックされます。`groupPolicy: "allowlist"` では、このゲートは次のいずれかを要求します:
   - `groups: { "*": { ... } }` ワイルドカードエントリ（`allowAll = true` を設定）、または
   - `groups` の下にある明示的な `chat_id` ごとのエントリ。

ゲート 1 が通過してもゲート 2 が失敗した場合、メッセージは破棄されます。Plugin は 2 つの `warn` レベルのシグナルを出すため、これはデフォルトのログレベルでも沈黙しなくなりました。

- `groupPolicy: "allowlist"` が設定されているが `channels.imessage.groups` が空（`"*"` ワイルドカードも `chat_id` ごとのエントリもない）の場合、アカウントごとに起動時に一度だけ出る `warn` — メッセージが届く前に発火します。
- 特定のグループが実行時に初めて破棄されたときに、`chat_id` ごとに一度だけ出る `warn`。chat_id と、それを許可するために `groups` に追加すべき正確なキーを示します。

DM は別のコードパスを取るため、引き続き動作します。

これは最も一般的な BlueBubbles → 同梱 iMessage 移行の失敗モードです。運用者は `groupAllowFrom` と `groupPolicy` はコピーしますが、`groups` ブロックを省略します。BlueBubbles の `groups: { "*": { "requireMention": true } }` が無関係なメンション設定に見えるためです。実際には、レジストリゲートにとって不可欠です。

`groupPolicy: "allowlist"` の後もグループメッセージを流し続けるための最小設定:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`*` の下にある `requireMention: true` は、メンションパターンが設定されていない場合は無害です。ランタイムは `canDetectMention = false` を設定し、`inbound-processing.ts:512` でメンションによるドロップを短絡します。メンションパターンが設定されている場合（`agents.list[].groupChat.mentionPatterns`）、期待どおりに動作します。

Gateway ログに `imessage: dropping group message from chat_id=<id>`、または起動時の行 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` が出る場合、ゲート 2 でドロップされています。`groups` ブロックを追加してください。

## 手順

1. 既存の BlueBubbles ブロックの横に iMessage ブロックを追加します。新しいパスが検証されるまでは、古いブロックはコピー元としてのみ残します。

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **ドライランのプローブ** — Gateway を起動し、iMessage が正常と報告されることを確認します。

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   `imessage.enabled` はまだ `false` のため、インバウンドの iMessage トラフィックはまだルーティングされません。ただし `--probe` はブリッジを実行するため、切り替え前に権限やインストールの問題を検出できます。

3. **切り替えます。** 1 回の設定編集で BlueBubbles 設定を削除し、iMessage を有効にします。

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Gateway を再起動します。インバウンドの iMessage トラフィックは、同梱 Plugin を通るようになります。

4. **DM を検証します。** エージェントにダイレクトメッセージを送信し、返信が届くことを確認します。

5. **グループを別途検証します。** DM とグループは異なるコードパスを通ります。DM の成功は、グループがルーティングされている証明にはなりません。ペアリング済みのグループチャットでエージェントにメッセージを送信し、返信が届くことを確認します。グループが無反応になる場合（エージェントの返信なし、エラーなし）、Gateway ログに `imessage: dropping group message from chat_id=<id>`、または起動時の `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` 行がないか確認します。どちらもデフォルトのログレベルで出力されます。どちらかが表示される場合、`groups` ブロックがないか空です。上記の「グループレジストリの落とし穴」を参照してください。

6. **アクションサーフェスを検証します** — ペアリング済み DM から、リアクション、編集、送信取り消し、返信、写真送信、（グループ内での）グループ名変更 / 参加者の追加または削除をエージェントに依頼します。各アクションは Messages.app にネイティブに反映される必要があります。いずれかが「iMessage `<action>` requires the imsg private API bridge」をスローする場合は、`imsg launch` を再度実行し、`channels status --probe` を更新してください。

7. iMessage の DM、グループ、アクションが検証されたら、**BlueBubbles サーバーと設定を削除します**。OpenClaw は `channels.bluebubbles` を使用しません。

## アクションの対応状況の概要

| アクション                                                   | 従来の BlueBubbles                   | 同梱 iMessage                                                                                                           |
| ------------------------------------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| テキスト送信 / SMS フォールバック                            | ✅                                   | ✅                                                                                                                      |
| メディア送信（写真、動画、ファイル、音声）                   | ✅                                   | ✅                                                                                                                      |
| スレッド返信（`reply_to_guid`）                              | ✅                                   | ✅（[#51892](https://github.com/openclaw/openclaw/issues/51892) をクローズ）                                             |
| Tapback（`react`）                                           | ✅                                   | ✅                                                                                                                      |
| 編集 / 送信取り消し（macOS 13+ の受信者）                    | ✅                                   | ✅                                                                                                                      |
| 画面エフェクト付き送信                                       | ✅                                   | ✅（[#9394](https://github.com/openclaw/openclaw/issues/9394) の一部をクローズ）                                         |
| リッチテキストの太字 / 斜体 / 下線 / 取り消し線              | ✅                                   | ✅（attributedBody による typed-run フォーマット）                                                                      |
| グループ名変更 / グループアイコン設定                        | ✅                                   | ✅                                                                                                                      |
| 参加者の追加 / 削除、グループ退出                            | ✅                                   | ✅                                                                                                                      |
| 開封確認と入力中インジケーター                               | ✅                                   | ✅（private API プローブで制御）                                                                                        |
| 同一送信者の DM 結合                                         | ✅                                   | ✅（DM のみ。`channels.imessage.coalesceSameSenderDms` でオプトイン）                                                   |
| Gateway 停止中に受信したインバウンドメッセージのキャッチアップ | ✅（webhook 再生 + 履歴取得）        | ✅（`channels.imessage.catchup.enabled` でオプトイン。[#78649](https://github.com/openclaw/openclaw/issues/78649) をクローズ） |

iMessage キャッチアップは、同梱 Plugin のオプトイン機能として利用できるようになりました。Gateway 起動時に `channels.imessage.catchup.enabled` が `true` の場合、Gateway は `imsg watch` と同じ JSON-RPC クライアントに対して `chats.list` と各チャットの `messages.history` パスを 1 回実行し、取りこぼした各インバウンド行をライブディスパッチパス（allowlist、グループポリシー、デバウンサー、エコーキャッシュ）で再生し、アカウントごとのカーソルを永続化します。そのため、以降の起動では中断した位置から再開します。調整については [Gateway ダウンタイム後のキャッチアップ](/ja-JP/channels/imessage#catching-up-after-gateway-downtime) を参照してください。

## ペアリング、セッション、ACP バインディング

- **ペアリング承認** はハンドルごとに引き継がれます。既知の送信者を再承認する必要はありません。`channels.imessage.allowFrom` は、BlueBubbles が使用していた同じ `+15555550123` / `user@example.com` 文字列を認識します。
- **セッション** はエージェント + チャットごとにスコープされます。DM はデフォルトの `session.dmScope=main` の下でエージェントのメインセッションにまとめられます。グループセッションは `chat_id` ごとに分離されます。セッションキーは異なります（`agent:<id>:imessage:group:<chat_id>` と BlueBubbles の同等のキー）。BlueBubbles セッションキーの下にある古い会話履歴は iMessage セッションに引き継がれません。
- `match.channel: "bluebubbles"` を参照する **ACP バインディング** は `"imessage"` に更新する必要があります。`match.peer.id` の形（`chat_id:`、`chat_guid:`、`chat_identifier:`、裸のハンドル）は同一です。

## ロールバック用チャンネルはありません

戻すためのサポート済み BlueBubbles ランタイムはありません。iMessage の検証が失敗する場合は、`channels.imessage.enabled: false` を設定し、Gateway を再起動し、`imsg` の阻害要因を修正してから、切り替えを再試行してください。

返信キャッシュは `~/.openclaw/state/imessage/reply-cache.jsonl`（モード `0600`、親ディレクトリ `0700`）にあります。クリーンスレートにしたい場合は削除しても安全です。

## 関連

- [iMessage](/ja-JP/channels/imessage) — `imsg launch` のセットアップと機能検出を含む、完全な iMessage チャンネルリファレンス。
- `/channels/bluebubbles` — この移行ガイドにリダイレクトする従来の URL。
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー。
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — Gateway がアウトバウンド返信のチャンネルを選択する方法。
