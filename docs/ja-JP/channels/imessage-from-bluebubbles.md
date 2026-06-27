---
read_when:
    - BlueBubbles から同梱の iMessage Plugin への移行計画
    - BlueBubbles の設定キーを iMessage 相当へ変換する
    - iMessage Plugin を有効にする前に imsg を検証する
summary: 古い BlueBubbles 設定を、ペアリング、許可リスト、グループバインディングを失わずに、バンドルされた iMessage Plugin へ移行します。
title: BlueBubbles から移行する
x-i18n:
    generated_at: "2026-06-27T10:35:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

バンドルされた `imessage` プラグインは、JSON-RPC 経由で [`steipete/imsg`](https://github.com/steipete/imsg) を操作することで、BlueBubbles と同じプライベート API サーフェス（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、グループ管理、添付ファイル）に到達できるようになりました。すでに `imsg` をインストールした Mac を実行している場合は、BlueBubbles サーバーを廃止し、プラグインから Messages.app に直接通信させることができます。

BlueBubbles サポートは削除されました。OpenClaw は `imsg` のみを通じて iMessage をサポートします。このガイドは、古い `channels.bluebubbles` 設定を `channels.imessage` に移行するためのものです。ほかにサポートされている移行パスはありません。

<Note>
短い発表と運用者向け要約については、[BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage)を参照してください。
</Note>

## 移行チェックリスト

古い BlueBubbles 設定をすでに把握していて、最短で安全なパスを取りたい場合は、このチェックリストを使用してください。

1. Messages.app を実行している Mac で `imsg` を直接検証します（`imsg chats`、`imsg history`、`imsg send`、`imsg rpc --help`）。
2. `channels.bluebubbles` から `channels.imessage` に動作キーをコピーします: `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`coalesceSameSenderDms`、`actions`。
3. 存在しなくなったトランスポートキーを削除します: `serverUrl`、`password`、Webhook URL、BlueBubbles サーバー設定。
4. Gateway が Messages Mac で実行されていない場合は、`channels.imessage.cliPath` を SSH ラッパーに設定し、リモート添付ファイル取得用に `remoteHost` を設定します。
5. Gateway を停止した状態で `channels.imessage` を有効にし、`openclaw channels status --probe --channel imessage` を実行します。
6. DM を 1 件、許可済みグループを 1 件、添付ファイルを有効にしている場合は添付ファイル、そしてエージェントに使用させる予定のすべてのプライベート API アクションをテストします。
7. iMessage パスの検証後に、BlueBubbles サーバーと古い `channels.bluebubbles` 設定を削除します。

## この移行が適している場合

- Messages.app にサインインしている同じ Mac（または SSH で到達できる Mac）ですでに `imsg` を実行している。
- 別の BlueBubbles サーバー、認証対象の REST エンドポイント、Webhook 配管をなくし、可動部分を 1 つ減らしたい。サーバー + クライアントアプリ + ヘルパーではなく、単一の CLI バイナリにしたい。
- プライベート API プローブが `available: true` を報告する、[サポート対象の macOS / `imsg` ビルド](/ja-JP/channels/imessage#requirements-and-permissions-macos)を使用している。

## imsg の役割

`imsg` は Messages 用のローカル macOS CLI です。OpenClaw は `imsg rpc` を子プロセスとして起動し、stdin/stdout 経由で JSON-RPC 通信します。HTTP サーバー、Webhook URL、バックグラウンドデーモン、launch agent、公開するポートはありません。

- 読み取りは、読み取り専用 SQLite ハンドルを使って `~/Library/Messages/chat.db` から行われます。
- ライブ受信メッセージは `imsg watch` / `watch.subscribe` から取得されます。これは `chat.db` のファイルシステムイベントを追跡し、ポーリングフォールバックを備えています。
- 送信は、通常のテキスト送信とファイル送信に Messages.app オートメーションを使用します。
- 高度なアクションでは、`imsg launch` を使用して `imsg` ヘルパーを Messages.app に注入します。これにより、開封確認、入力中インジケーター、リッチ送信、編集、送信取り消し、スレッド返信、タップバック、グループ管理が利用可能になります。
- Linux ビルドではコピーされた `chat.db` を検査できますが、送信、ライブ Mac データベースの監視、Messages.app の操作はできません。OpenClaw iMessage では、サインイン済み Mac 上で `imsg` を実行するか、その Mac への SSH ラッパー経由で実行してください。

## 開始前

1. Messages.app を実行している Mac に `imsg` をインストールします。

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

   `42` は `imsg chats` から取得した実際のチャット ID に置き換えてください。送信には Messages.app の Automation 権限が必要です。OpenClaw を SSH 経由で実行する場合は、OpenClaw が使用するのと同じ SSH ラッパーまたはユーザーコンテキストでこれらのコマンドを実行してください。読み取りやプローブは動作するのに、送信が AppleEvents `-1743` で失敗する場合は、Automation が `/usr/libexec/sshd-keygen-wrapper` に付与されているか確認してください。[SSH ラッパー送信が AppleEvents -1743 で失敗する](/ja-JP/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743)を参照してください。

3. 高度なアクションが必要な場合は、プライベート API ブリッジを有効にします。

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` には SIP の無効化が必要です。基本的な送信、履歴、監視は `imsg launch` なしで動作しますが、高度なアクションは動作しません。

4. 有効化された `channels.imessage` 設定を追加した後、OpenClaw 経由でブリッジを検証します。

   ```bash
   openclaw channels status --probe
   ```

   `imessage.privateApi.available: true` が望ましい状態です。`false` が報告される場合は、先にそれを修正してください。[機能検出](/ja-JP/channels/imessage#private-api-actions)を参照してください。`channels status --probe` は、設定済みかつ有効なアカウントのみをプローブします。

5. 設定のスナップショットを取ります。

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## 設定の変換

iMessage と BlueBubbles は、多くのチャンネルレベル設定を共有しています。変更されるキーのほとんどはトランスポート（REST サーバー対ローカル CLI）です。動作キー（`dmPolicy`、`groupPolicy`、`allowFrom` など）は同じ意味を維持します。

| BlueBubbles                                                | バンドル版 iMessage                          | 注記                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 同じ意味です。                                                                                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.serverUrl`                           | _(削除済み)_                               | REST サーバーはありません。Plugin が stdio 経由で `imsg rpc` を起動します。                                                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.password`                            | _(削除済み)_                               | Webhook 認証は不要です。                                                                                                                                                                                                                                                                                                                                                    |
| _(暗黙)_                                               | `channels.imessage.cliPath`               | `imsg` へのパス（デフォルトは `imsg`）。SSH にはラッパースクリプトを使います。                                                                                                                                                                                                                                                                                                                       |
| _(暗黙)_                                               | `channels.imessage.dbPath`                | 任意の Messages.app `chat.db` オーバーライド。省略すると自動検出されます。                                                                                                                                                                                                                                                                                                                |
| _(暗黙)_                                               | `channels.imessage.remoteHost`            | `host` または `user@host`。`cliPath` が SSH ラッパーで、SCP による添付ファイル取得を行いたい場合にのみ必要です。                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 同じ値（`pairing` / `allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | ペアリング承認はトークンではなくハンドル単位で引き継がれます。                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 同じ値（`allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 同じです。                                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **`groups: { "*": { ... } }` ワイルドカードエントリがある場合はそれも含めて、この内容をそのままコピーしてください。** グループごとの `requireMention`、`tools`、`toolsBySender` は引き継がれます。`groupPolicy: "allowlist"` で `groups` ブロックが空または欠落している場合、すべてのグループメッセージが黙って破棄されます。下の「グループレジストリの落とし穴」を参照してください。                                                                                       |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | デフォルトは `true` です。バンドル版Plugin では、これはプライベート API プローブが起動している場合にのみ発火します。                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 同じ形で、**同じくデフォルトでオフ**です。BlueBubbles で添付ファイルを流していた場合は、iMessage ブロックでこれを明示的に再設定する必要があります。暗黙には引き継がれず、設定するまで受信写真/メディアは「受信メッセージ」ログ行なしで黙って破棄されます。                                                                                                     |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | ローカルルート。同じワイルドカードルールです。                                                                                                                                                                                                                                                                                                                                                    |
| _(該当なし)_                                                    | `channels.imessage.remoteAttachmentRoots` | `remoteHost` が SCP 取得用に設定されている場合にのみ使われます。                                                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage でのデフォルトは 16 MB です（BlueBubbles のデフォルトは 8 MB でした）。低い上限を維持したい場合は明示的に設定してください。                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | どちらもデフォルトは 4000 です。                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 同じくオプトインです。DM のみです。グループチャットでは、どちらのチャンネルでもメッセージごとの即時ディスパッチが維持されます。明示的な `messages.inbound.byChannel.imessage` またはグローバルな `messages.inbound.debounceMs` なしで有効化すると、デフォルトの受信デバウンスが 7000 ms に広がります。[iMessage ドキュメント § 分割送信 DM の結合](/ja-JP/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition) を参照してください。 |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(該当なし)_                                   | iMessage はすでに `chat.db` から送信者の表示名を読み取ります。                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | アクションごとのトグル: `reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`。                                                                                                                                                                                                  |

マルチアカウント設定（`channels.bluebubbles.accounts.*`）は `channels.imessage.accounts.*` に 1 対 1 で変換されます。

## グループレジストリの落とし穴

バンドル版 iMessage Plugin は、**2 つ**の別々のグループ許可リストゲートを連続して実行します。グループメッセージがエージェントに届くには、両方を通過する必要があります。

1. **送信者 / チャットターゲット許可リスト**（`channels.imessage.groupAllowFrom`）— `isAllowedIMessageSender` によってチェックされます。受信メッセージを送信者ハンドル、`chat_guid`、`chat_identifier`、または `chat_id` で照合します。BlueBubbles と同じ形です。
2. **グループレジストリ**（`channels.imessage.groups`）— `inbound-processing.ts:199` の `resolveChannelGroupPolicy` によってチェックされます。`groupPolicy: "allowlist"` の場合、このゲートには次のいずれかが必要です。
   - `groups: { "*": { ... } }` ワイルドカードエントリ（`allowAll = true` を設定）、または
   - `groups` の下に明示的な `chat_id` ごとのエントリ。

ゲート 1 は通過してもゲート 2 が失敗した場合、メッセージは破棄されます。これがデフォルトのログレベルで黙って起きないように、Plugin は 2 つの `warn` レベルのシグナルを出力します。

- `groupPolicy: "allowlist"` が設定されているのに `channels.imessage.groups` が空（`"*"` ワイルドカードも `chat_id` ごとのエントリもない）の場合、アカウントごとに 1 回だけ起動時の `warn` が発火します。これはメッセージが届く前に発火します。
- 実行時に特定のグループが初めて破棄されたとき、`chat_id` ごとに 1 回だけ `warn` が発火し、chat_id と、それを許可するために `groups` に追加すべき正確なキーを示します。

DM は別のコードパスを通るため、引き続き動作します。

これは最も一般的な BlueBubbles → バンドル版 iMessage への移行失敗パターンです。運用者は `groupAllowFrom` と `groupPolicy` はコピーしますが、BlueBubbles の `groups: { "*": { "requireMention": true } }` が無関係なメンション設定に見えるため、`groups` ブロックを省略してしまいます。実際には、これはレジストリゲートに不可欠です。

`groupPolicy: "allowlist"` の後もグループメッセージを流し続けるための最小構成:

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

`*` 配下の `requireMention: true` は、メンションパターンが設定されていない場合は無害です。ランタイムは `canDetectMention = false` を設定し、`inbound-processing.ts:512` でメンションによるドロップを短絡します。メンションパターンが設定されている場合（`agents.list[].groupChat.mentionPatterns`）は、期待どおりに動作します。

Gateway ログに `imessage: dropping group message from chat_id=<id>`、または起動時の行 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` が出ている場合、ゲート 2 でドロップされています。`groups` ブロックを追加してください。

## 手順

1. 既存の BlueBubbles ブロックと並べて iMessage ブロックを追加します。Gateway がまだ BlueBubbles トラフィックをルーティングしている間は、無効のままにします。

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

2. **トラフィックが重要になる前に検査します** — Gateway を停止し、一時的に iMessage ブロックを有効化して、iMessage が CLI から正常と報告されることを確認します。

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` は、設定済みで有効なアカウントのみを検査します。両方のチャネルモニターを意図的に実行したい場合を除き、BlueBubbles と iMessage の両方を有効にした状態で Gateway を再起動しないでください。すぐに切り替えない場合は、Gateway を再起動する前に `channels.imessage.enabled` を `false` に戻してください。OpenClaw トラフィックを有効化する前に Mac を検証するには、[開始前](#before-you-start) の直接 `imsg` コマンドを使用してください。

3. **切り替えます。** 有効化した iMessage アカウントが正常と報告されたら、BlueBubbles 構成を削除し、iMessage を有効のままにします。

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Gateway を再起動します。受信 iMessage トラフィックは、バンドルされた Plugin を通って流れるようになります。

4. **DM を確認します。** エージェントにダイレクトメッセージを送信し、返信が届くことを確認します。

5. **グループは別に確認します。** DM とグループは異なるコードパスを通ります。DM の成功は、グループがルーティングされている証明にはなりません。ペアリング済みのグループチャットでエージェントにメッセージを送り、返信が届くことを確認します。グループが無反応になった場合（エージェントの返信なし、エラーなし）は、Gateway ログで `imessage: dropping group message from chat_id=<id>`、または起動時の `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` 行を確認します。どちらもデフォルトのログレベルで出力されます。どちらかが表示される場合、`groups` ブロックが欠落しているか空です。上記の「グループレジストリの落とし穴」を参照してください。

6. **アクション面を確認します** — ペアリング済み DM から、リアクション、編集、送信取り消し、返信、写真送信、さらに（グループで）グループ名の変更 / 参加者の追加または削除をエージェントに依頼します。各アクションは Messages.app にネイティブに反映される必要があります。いずれかで「iMessage `<action>` requires the imsg private API bridge」が発生する場合は、`imsg launch` を再実行し、`channels status --probe` を更新してください。

7. iMessage の DM、グループ、アクションが確認できたら、**BlueBubbles サーバーと構成を削除します**。OpenClaw は `channels.bluebubbles` を使用しません。

## アクション互換性の概要

| アクション                                            | 従来の BlueBubbles                    | バンドル版 iMessage                                                             |
| --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| テキスト送信 / SMS フォールバック                           | ✅                                  | ✅                                                                            |
| メディア送信（写真、動画、ファイル、音声）                         | ✅                                  | ✅                                                                            |
| スレッド返信（`reply_to_guid`）                         | ✅                                  | ✅（[#51892](https://github.com/openclaw/openclaw/issues/51892) を解決）       |
| Tapback（`react`）                                  | ✅                                  | ✅                                                                            |
| 編集 / 送信取り消し（macOS 13+ の受信者）                    | ✅                                  | ✅                                                                            |
| 画面エフェクト付き送信                                      | ✅                                  | ✅（[#9394](https://github.com/openclaw/openclaw/issues/9394) の一部を解決） |
| リッチテキストの太字 / 斜体 / 下線 / 取り消し線                 | ✅                                  | ✅（attributedBody による typed-run フォーマット）                                  |
| グループ名の変更 / グループアイコンの設定                         | ✅                                  | ✅                                                                            |
| 参加者の追加 / 削除、グループ退出                              | ✅                                  | ✅                                                                            |
| 開封確認と入力インジケーター                                    | ✅                                  | ✅（private API 検査でゲート）                                               |
| 同一送信者 DM の結合                                      | ✅                                  | ✅（DM のみ。`channels.imessage.coalesceSameSenderDms` でオプトイン）            |
| 再起動後の受信リカバリ                                      | ✅（Webhook リプレイ + 履歴取得） | ✅（自動: since_rowid による取りこぼしのリプレイ + 重複排除。ローカルではより広いウィンドウ） |

iMessage は、Gateway が停止している間に取りこぼしたメッセージを復旧します。起動時に `imsg watch.subscribe` の `since_rowid` を介して最後にディスパッチした rowid からリプレイし、GUID で重複排除します。一方で、古いバックログの年齢フェンスが Push フラッシュによる「バックログ爆弾」を抑止します。これは `imsg` RPC 接続上で実行されるため、リモート SSH `cliPath` セットアップでも動作します。ローカルセットアップでは `chat.db` を読み取れるため、より広い復旧ウィンドウが得られます。[ブリッジまたは Gateway 再起動後の受信リカバリ](/ja-JP/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart) を参照してください。

## ペアリング、セッション、ACP バインディング

- **ペアリング承認** はハンドル単位で引き継がれます。既知の送信者を再承認する必要はありません。`channels.imessage.allowFrom` は、BlueBubbles が使用していた同じ `+15555550123` / `user@example.com` 文字列を認識します。
- **セッション** はエージェント + チャットごとにスコープされます。DM はデフォルトの `session.dmScope=main` の下でエージェントのメインセッションに集約されます。グループセッションは `chat_id` ごとに分離されたままです。セッションキーは異なります（`agent:<id>:imessage:group:<chat_id>` と BlueBubbles の同等キー）。BlueBubbles セッションキー配下の古い会話履歴は、iMessage セッションには引き継がれません。
- `match.channel: "bluebubbles"` を参照している **ACP バインディング** は `"imessage"` に更新する必要があります。`match.peer.id` の形（`chat_id:`、`chat_guid:`、`chat_identifier:`、裸のハンドル）は同一です。

## ロールバックチャネルはありません

切り戻し先としてサポートされる BlueBubbles ランタイムはありません。iMessage の検証に失敗した場合は、`channels.imessage.enabled: false` を設定し、Gateway を再起動し、`imsg` のブロッカーを修正して、切り替えを再試行してください。

返信キャッシュは SQLite Plugin 状態にあります。`openclaw doctor --fix` は、古い `imessage/reply-cache.jsonl` サイドカーが存在する場合にインポートしてアーカイブします。

## 関連

- [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage) — 短い告知と運用者向け概要。
- [iMessage](/ja-JP/channels/imessage) — `imsg launch` セットアップと機能検出を含む、完全な iMessage チャネルリファレンス。
- `/channels/bluebubbles` — この移行ガイドにリダイレクトするレガシー URL。
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー。
- [チャネルルーティング](/ja-JP/channels/channel-routing) — Gateway が送信返信用のチャネルを選択する方法。
