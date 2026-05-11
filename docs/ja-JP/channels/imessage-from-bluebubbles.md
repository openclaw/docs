---
read_when:
    - BlueBubbles からバンドルされた iMessage Plugin への移行を計画する
    - BlueBubbles の設定キーを iMessage の対応キーに変換する
    - iMessage Pluginを有効にする前に imsg を検証する
summary: ペアリング、許可リスト、グループバインディングを失うことなく、古い BlueBubbles 設定をバンドルされた iMessage Plugin に移行します。
title: BlueBubbles から移行する場合
x-i18n:
    generated_at: "2026-05-11T20:20:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

バンドルされた `imessage` plugin は、JSON-RPC 経由で [`steipete/imsg`](https://github.com/steipete/imsg) を駆動することで、BlueBubbles と同じ private API surface（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、グループ管理、添付ファイル）に到達できるようになりました。すでに `imsg` をインストールした Mac を運用している場合は、BlueBubbles サーバーを外し、plugin が Messages.app と直接通信するようにできます。

BlueBubbles サポートは削除されました。OpenClaw は `imsg` のみを通じて iMessage をサポートします。このガイドは、古い `channels.bluebubbles` config を `channels.imessage` に移行するためのものです。他にサポートされる移行パスはありません。

<Note>
短い告知と運用者向けの要約については、[BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage) を参照してください。
</Note>

## 移行チェックリスト

古い BlueBubbles config をすでに把握していて、最短で安全な手順を取りたい場合は、このチェックリストを使用してください。

1. Messages.app を実行している Mac 上で `imsg` を直接検証します（`imsg chats`、`imsg history`、`imsg send`、`imsg rpc --help`）。
2. `channels.bluebubbles` から `channels.imessage` に動作キーをコピーします: `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`coalesceSameSenderDms`、`actions`。
3. もう存在しない transport キーを削除します: `serverUrl`、`password`、webhook URL、BlueBubbles サーバー設定。
4. Gateway が Messages の Mac 上で実行されていない場合は、`channels.imessage.cliPath` を SSH ラッパーに設定し、リモート添付ファイル取得用に `remoteHost` を設定します。
5. Gateway を停止した状態で `channels.imessage` を有効化し、`openclaw channels status --probe --channel imessage` を実行します。
6. DM を 1 件、許可済みグループを 1 件、添付ファイルを有効にしている場合は添付ファイル、そしてエージェントに使用させる想定のすべての private API action をテストします。
7. iMessage パスを検証した後、BlueBubbles サーバーと古い `channels.bluebubbles` config を削除します。

## この移行が適している場合

- Messages.app にサインインしている同じ Mac（または SSH 経由で到達可能な Mac）で、すでに `imsg` を実行している。
- 可動部品を 1 つ減らしたい。別個の BlueBubbles サーバー、認証する REST endpoint、webhook 配線は不要です。サーバー + クライアント app + ヘルパーの代わりに、単一の CLI バイナリを使用します。
- private API probe が `available: true` を報告する、[サポートされている macOS / `imsg` build](/ja-JP/channels/imessage#requirements-and-permissions-macos) を使用している。

## imsg の機能

`imsg` は Messages 用のローカル macOS CLI です。OpenClaw は `imsg rpc` を子プロセスとして起動し、stdin/stdout 経由の JSON-RPC で通信します。HTTP サーバー、webhook URL、バックグラウンド daemon、launch agent、公開する port はありません。

- 読み取りは、読み取り専用 SQLite handle を使って `~/Library/Messages/chat.db` から行われます。
- ライブの受信メッセージは `imsg watch` / `watch.subscribe` から取得されます。これは polling fallback 付きで `chat.db` の filesystem event を追跡します。
- 送信は、通常のテキスト送信とファイル送信に Messages.app automation を使用します。
- 高度な action は `imsg launch` を使用して、Messages.app に `imsg` helper を注入します。これにより、開封確認、入力インジケーター、リッチ送信、編集、送信取り消し、スレッド返信、tapback、グループ管理が利用可能になります。
- Linux build ではコピーされた `chat.db` を調査できますが、送信、ライブ Mac database の監視、Messages.app の駆動はできません。OpenClaw iMessage では、サインイン済み Mac 上で、またはその Mac への SSH ラッパー経由で `imsg` を実行してください。

## 開始前に

1. Messages.app を実行している Mac に `imsg` をインストールします。

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   `imsg chats` が `unable to open database file`、空の出力、または `authorization denied` で失敗する場合は、`imsg` を起動する terminal、editor、Node process、Gateway service、または SSH parent process に Full Disk Access を付与し、その親プロセスを再度開いてください。

2. OpenClaw config を変更する前に、read、watch、send、RPC surface を検証します。

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   `42` は `imsg chats` から取得した実際の chat id に置き換えてください。送信には Messages.app の Automation 権限が必要です。OpenClaw を SSH 経由で実行する予定の場合は、OpenClaw が使用するものと同じ SSH ラッパーまたは user context でこれらのコマンドを実行してください。

3. 高度な action が必要な場合は、private API bridge を有効にします。

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` には SIP の無効化が必要です。基本的な送信、履歴、watch は `imsg launch` なしで動作しますが、高度な action は動作しません。

4. 有効化された `channels.imessage` config を追加した後、OpenClaw 経由で bridge を検証します。

   ```bash
   openclaw channels status --probe
   ```

   `imessage.privateApi.available: true` になっている必要があります。`false` が報告された場合は、まずそれを修正してください。[Capability detection](/ja-JP/channels/imessage#private-api-actions) を参照してください。`channels status --probe` は、設定済みで有効な account のみを probe します。

5. config のスナップショットを取得します。

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Config 変換

iMessage と BlueBubbles は、多くの channel-level config を共有しています。変更されるキーの大半は transport（REST サーバーとローカル CLI）です。動作キー（`dmPolicy`、`groupPolicy`、`allowFrom` など）は同じ意味を保ちます。

| BlueBubbles                                                | 同梱 iMessage                             | 注記                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 同じ意味です。                                                                                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.serverUrl`                           | _(削除済み)_                              | REST サーバーはありません。Plugin が stdio 経由で `imsg rpc` を起動します。                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.password`                            | _(削除済み)_                              | Webhook 認証は不要です。                                                                                                                                                                                                                                                                                                                                     |
| _(暗黙)_                                                   | `channels.imessage.cliPath`               | `imsg` へのパス（デフォルトは `imsg`）。SSH にはラッパースクリプトを使います。                                                                                                                                                                                                                                                                              |
| _(暗黙)_                                                   | `channels.imessage.dbPath`                | 任意の Messages.app `chat.db` オーバーライド。省略時は自動検出されます。                                                                                                                                                                                                                                                                                    |
| _(暗黙)_                                                   | `channels.imessage.remoteHost`            | `host` または `user@host`。`cliPath` が SSH ラッパーで、SCP による添付ファイル取得を使いたい場合にのみ必要です。                                                                                                                                                                                                                                            |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 同じ値（`pairing` / `allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | ペアリング承認はトークンではなくハンドルで引き継がれます。                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 同じ値（`allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 同じです。                                                                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **`groups: { "*": { ... } }` ワイルドカードエントリがある場合は、それも含めてそのままコピーしてください。** グループごとの `requireMention`、`tools`、`toolsBySender` は引き継がれます。`groupPolicy: "allowlist"` では、`groups` ブロックが空または欠落していると、すべてのグループメッセージが静かに破棄されます。下の「グループレジストリの落とし穴」を参照してください。 |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | デフォルトは `true` です。同梱 Plugin では、これはプライベート API プローブが起動している場合にのみ発火します。                                                                                                                                                                                                                                             |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 同じ形で、**同じくデフォルトはオフ**です。BlueBubbles で添付ファイルを流していた場合は、iMessage ブロックで明示的に再設定する必要があります。暗黙には引き継がれず、設定するまで受信写真やメディアは `Inbound message` ログ行なしで静かに破棄されます。                                                                                                  |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | ローカルルートです。同じワイルドカードルールです。                                                                                                                                                                                                                                                                                                          |
| _(N/A)_                                                    | `channels.imessage.remoteAttachmentRoots` | SCP 取得のために `remoteHost` が設定されている場合にのみ使われます。                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage でのデフォルトは 16 MB です（BlueBubbles のデフォルトは 8 MB でした）。低い上限を維持したい場合は明示的に設定してください。                                                                                                                                                                                                                        |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | どちらもデフォルトは 4000 です。                                                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 同じオプトインです。DM のみです。グループチャットはどちらのチャンネルでもメッセージごとの即時ディスパッチを維持します。明示的な `messages.inbound.byChannel.imessage` なしで有効化すると、デフォルトの受信デバウンスが 2500 ms に広がります。[iMessage ドキュメント § 分割送信 DM の結合](/ja-JP/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)を参照してください。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/A)_                                   | iMessage はすでに `chat.db` から送信者の表示名を読み取ります。                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | アクションごとの切り替え: `reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`。                                                                                                                                                                    |

マルチアカウント設定（`channels.bluebubbles.accounts.*`）は、`channels.imessage.accounts.*` に一対一で変換されます。

## グループレジストリの落とし穴

同梱 iMessage Plugin は、**2つの**別々のグループ allowlist ゲートを連続して実行します。グループメッセージがエージェントに到達するには、両方を通過する必要があります。

1. **送信者 / チャットターゲット allowlist**（`channels.imessage.groupAllowFrom`） — `isAllowedIMessageSender` によって確認されます。受信メッセージを送信者ハンドル、`chat_guid`、`chat_identifier`、または `chat_id` で照合します。BlueBubbles と同じ形です。
2. **グループレジストリ**（`channels.imessage.groups`） — `inbound-processing.ts:199` の `resolveChannelGroupPolicy` によって確認されます。`groupPolicy: "allowlist"` では、このゲートに次のいずれかが必要です。
   - `groups: { "*": { ... } }` ワイルドカードエントリ（`allowAll = true` を設定）、または
   - `groups` 配下の明示的な `chat_id` ごとのエントリ。

ゲート 1 を通過してもゲート 2 に失敗した場合、メッセージは破棄されます。Plugin は `warn` レベルのシグナルを2つ発するため、デフォルトログレベルではこれが無音ではなくなりました。

- `groupPolicy: "allowlist"` が設定されているのに `channels.imessage.groups` が空（`"*"` ワイルドカードなし、`chat_id` ごとのエントリなし）の場合、アカウントごとに起動時1回の `warn` が発火します。これはメッセージが到着する前に発火します。
- 特定のグループが実行時に初めて破棄されたとき、`chat_id` ごとに1回の `warn` が発火し、その chat_id と、それを許可するために `groups` に追加すべき正確なキーを示します。

DM は別のコードパスを使うため、引き続き動作します。

これは、BlueBubbles から同梱 iMessage への移行で最も一般的な失敗モードです。運用者は `groupAllowFrom` と `groupPolicy` をコピーしますが、`groups` ブロックを飛ばしてしまいます。BlueBubbles の `groups: { "*": { "requireMention": true } }` は無関係なメンション設定に見えるためです。実際には、これはレジストリゲートに不可欠です。

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

`requireMention: true` は、メンションパターンが設定されていない場合、`*` の下にあっても無害です。ランタイムは `canDetectMention = false` を設定し、`inbound-processing.ts:512` でメンションの破棄を短絡します。メンションパターン（`agents.list[].groupChat.mentionPatterns`）が設定されている場合は、期待どおりに動作します。

Gateway ログに `imessage: dropping group message from chat_id=<id>`、または起動時の行 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` が出る場合、ゲート2が破棄しています。`groups` ブロックを追加してください。

## 手順

1. 既存の BlueBubbles ブロックの横に iMessage ブロックを追加します。Gateway がまだ BlueBubbles トラフィックをルーティングしている間は無効のままにします。

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
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

2. **トラフィックが重要になる前にプローブします** — Gateway を停止し、一時的に iMessage ブロックを有効化して、CLI から iMessage が正常と報告されることを確認します。

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` は、設定済みで有効なアカウントのみをプローブします。両方のチャンネルモニターを意図的に実行したい場合を除き、BlueBubbles と iMessage の両方を有効にしたまま Gateway を再起動しないでください。すぐに切り替えない場合は、Gateway を再起動する前に `channels.imessage.enabled` を `false` に戻してください。OpenClaw トラフィックを有効にする前に Mac を検証するには、[始める前に](#before-you-start) の直接の `imsg` コマンドを使用してください。

3. **切り替えます。** 有効化した iMessage アカウントが正常と報告されたら、BlueBubbles 設定を削除し、iMessage を有効のままにします。

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Gateway を再起動します。受信 iMessage トラフィックは、バンドル済みPluginを通って流れるようになります。

4. **DM を検証します。** エージェントにダイレクトメッセージを送信し、返信が届くことを確認します。

5. **グループを別に検証します。** DM とグループは異なるコードパスを通ります。DM の成功は、グループがルーティングされている証明にはなりません。ペアリング済みグループチャットでエージェントにメッセージを送信し、返信が届くことを確認します。グループが沈黙する（エージェントの返信もエラーもない）場合は、Gateway ログに `imessage: dropping group message from chat_id=<id>`、または起動時の `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` 行がないか確認します。どちらもデフォルトのログレベルで出力されます。どちらかが表示される場合、`groups` ブロックが欠落しているか空です。上記の「Group registry footgun」を参照してください。

6. **アクション面を検証します** — ペアリング済みDMから、エージェントにリアクション、編集、送信取り消し、返信、写真送信、そして（グループ内で）グループ名の変更 / 参加者の追加または削除を依頼します。各アクションは Messages.app にネイティブに反映されるはずです。いずれかが「iMessage `<action>` requires the imsg private API bridge」を投げる場合は、`imsg launch` を再度実行し、`channels status --probe` を更新してください。

7. iMessage の DM、グループ、アクションが検証できたら、**BlueBubbles サーバーと設定を削除します**。OpenClaw は `channels.bluebubbles` を使用しません。

## アクションの同等性の一覧

| アクション                                                   | レガシー BlueBubbles                  | バンドル済み iMessage                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| テキスト送信 / SMS フォールバック                           | ✅                                  | ✅                                                                                                                      |
| メディア送信（写真、動画、ファイル、音声）                   | ✅                                  | ✅                                                                                                                      |
| スレッド返信（`reply_to_guid`）                              | ✅                                  | ✅（[#51892](https://github.com/openclaw/openclaw/issues/51892) をクローズ）                                             |
| Tapback（`react`）                                          | ✅                                  | ✅                                                                                                                      |
| 編集 / 送信取り消し（macOS 13+ の受信者）                    | ✅                                  | ✅                                                                                                                      |
| 画面エフェクト付き送信                                      | ✅                                  | ✅（[#9394](https://github.com/openclaw/openclaw/issues/9394) の一部をクローズ）                                         |
| リッチテキストの太字 / 斜体 / 下線 / 取り消し線              | ✅                                  | ✅（attributedBody による typed-run 書式設定）                                                                          |
| グループ名変更 / グループアイコン設定                       | ✅                                  | ✅                                                                                                                      |
| 参加者の追加 / 削除、グループから退出                       | ✅                                  | ✅                                                                                                                      |
| 開封確認と入力中インジケーター                              | ✅                                  | ✅（private API プローブでゲート）                                                                                      |
| 同一送信者 DM の結合                                        | ✅                                  | ✅（DM のみ。`channels.imessage.coalesceSameSenderDms` でオプトイン）                                                    |
| Gateway 停止中に受信した受信メッセージのキャッチアップ       | ✅（Webhook リプレイ + 履歴取得）    | ✅（`channels.imessage.catchup.enabled` でオプトイン。[#78649](https://github.com/openclaw/openclaw/issues/78649) をクローズ） |

iMessage キャッチアップは、バンドル済みPluginのオプトイン機能として利用できるようになりました。Gateway 起動時に `channels.imessage.catchup.enabled` が `true` の場合、Gateway は `imsg watch` と同じ JSON-RPC クライアントに対して `chats.list` + チャットごとの `messages.history` パスを1回実行し、見逃した各受信行をライブディスパッチ経路（allowlist、グループポリシー、デバウンサー、エコーキャッシュ）にリプレイし、アカウントごとのカーソルを永続化して、以降の起動で前回の続きから取得できるようにします。調整については [Gateway ダウンタイム後のキャッチアップ](/ja-JP/channels/imessage#catching-up-after-gateway-downtime) を参照してください。

## ペアリング、セッション、ACP バインディング

- **ペアリング承認** はハンドル単位で引き継がれます。既知の送信者を再承認する必要はありません。`channels.imessage.allowFrom` は、BlueBubbles が使用していたのと同じ `+15555550123` / `user@example.com` 文字列を認識します。
- **セッション** は、エージェント + チャットごとにスコープされます。DM はデフォルトの `session.dmScope=main` の下でエージェントのメインセッションに畳み込まれます。グループセッションは `chat_id` ごとに分離されたままです。セッションキーは異なります（`agent:<id>:imessage:group:<chat_id>` と BlueBubbles の同等キー）。BlueBubbles セッションキー配下の古い会話履歴は、iMessage セッションには引き継がれません。
- `match.channel: "bluebubbles"` を参照する **ACP バインディング** は `"imessage"` に更新する必要があります。`match.peer.id` の形（`chat_id:`、`chat_guid:`、`chat_identifier:`、裸のハンドル）は同一です。

## ロールバックチャンネルなし

切り戻し先としてサポートされる BlueBubbles ランタイムはありません。iMessage 検証に失敗した場合は、`channels.imessage.enabled: false` を設定し、Gateway を再起動して、`imsg` のブロッカーを修正し、切り替えを再試行してください。

返信キャッシュは `~/.openclaw/state/imessage/reply-cache.jsonl`（モード `0600`、親ディレクトリ `0700`）にあります。クリーンスレートにしたい場合は削除しても安全です。

## 関連

- [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage) — 短いお知らせと運用者向け概要。
- [iMessage](/ja-JP/channels/imessage) — `imsg launch` のセットアップと機能検出を含む、完全な iMessage チャンネルリファレンス。
- `/channels/bluebubbles` — この移行ガイドにリダイレクトするレガシー URL。
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー。
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — Gateway が送信返信のチャンネルを選択する方法。
