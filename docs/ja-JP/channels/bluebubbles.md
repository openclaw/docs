---
read_when:
    - BlueBubblesチャンネルのセットアップ
    - Webhookペアリングのトラブルシューティング
    - macOSでのiMessageの設定
summary: BlueBubbles macOSサーバー経由のiMessage（REST送受信、入力中表示、リアクション、ペアリング、高度なアクション）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T04:43:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3d8d617fc86ca1b191ff4dd2ae26b464e4d3f456a79c67b484a3a76d75de0d2
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles（macOS REST）

ステータス: HTTP経由でBlueBubbles macOSサーバーと通信するバンドル済みPlugin。従来のimsgチャンネルと比べてAPIがより高機能でセットアップも簡単なため、**iMessage連携には推奨**です。

## バンドル済みPlugin

現在のOpenClawリリースにはBlueBubblesがバンドルされているため、通常のパッケージ版ビルドでは別途 `openclaw plugins install` を行う必要はありません。

## 概要

- BlueBubblesヘルパーアプリ（[bluebubbles.app](https://bluebubbles.app)）を介してmacOS上で動作します。
- 推奨/テスト済み: macOS Sequoia（15）。macOS Tahoe（26）でも動作しますが、現在Tahoeでは編集が壊れており、グループアイコン更新は成功と表示されても同期されない場合があります。
- OpenClawはそのREST API（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）を通じて通信します。
- 受信メッセージはWebhook経由で届きます。送信返信、入力中表示、既読通知、tapbackはREST呼び出しです。
- 添付ファイルとステッカーは受信メディアとして取り込まれ、可能な場合はagentに渡されます。
- ペアリング/許可リストは他のチャンネルと同じように動作します（`/channels/pairing` など）。`channels.bluebubbles.allowFrom` とペアリングコードを使用します。
- リアクションはSlack/Telegramと同様にシステムイベントとして表現されるため、agentは返信前にそれらに「言及」できます。
- 高度な機能: 編集、送信取り消し、返信スレッド、メッセージエフェクト、グループ管理。

## クイックスタート

1. MacにBlueBubblesサーバーをインストールします（[bluebubbles.app/install](https://bluebubbles.app/install) の手順に従ってください）。
2. BlueBubblesの設定でWeb APIを有効にし、パスワードを設定します。
3. `openclaw onboard` を実行してBlueBubblesを選択するか、手動で設定します:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. BlueBubblesのWebhookをgatewayに向けます（例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
5. gatewayを起動します。Webhookハンドラーが登録され、ペアリングが開始されます。

セキュリティに関する注意:

- 必ずWebhookパスワードを設定してください。
- Webhook認証は常に必須です。OpenClawは、BlueBubblesのWebhookリクエストに `channels.bluebubbles.password` と一致する password/guid が含まれていない限り（たとえば `?password=<password>` や `x-password`）、loopback/proxyの構成に関係なく拒否します。
- パスワード認証は、Webhook本文全体を読み取り/解析する前にチェックされます。

## Messages.appを生かしておく（VM / ヘッドレス構成）

一部のmacOS VM / 常時稼働構成では、Messages.appが「アイドル」状態になり（アプリを開く/前面化するまで受信イベントが止まる）、問題になることがあります。簡単な回避策として、AppleScript + LaunchAgentを使って**5分ごとにMessagesをつつく**方法があります。

### 1) AppleScriptを保存する

以下の場所に保存します:

- `~/Scripts/poke-messages.scpt`

スクリプト例（非対話式。フォーカスを奪いません）:

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) LaunchAgentをインストールする

以下の場所に保存します:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

注意:

- これは**300秒ごと**および**ログイン時**に実行されます。
- 初回実行時にmacOSの**Automation**プロンプト（`osascript` → Messages）が表示される場合があります。LaunchAgentを実行する同じユーザーセッションで許可してください。

読み込むには:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## オンボーディング

BlueBubblesは対話式オンボーディングで利用できます:

```
openclaw onboard
```

ウィザードでは次の入力を求められます:

- **Server URL**（必須）: BlueBubblesサーバーのアドレス（例: `http://192.168.1.100:1234`）
- **Password**（必須）: BlueBubbles Server設定のAPIパスワード
- **Webhook path**（任意）: デフォルトは `/bluebubbles-webhook`
- **DM policy**: pairing、allowlist、open、または disabled
- **Allow list**: 電話番号、メールアドレス、またはチャットターゲット

CLIからBlueBubblesを追加することもできます:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## アクセス制御（DM + グループ）

DM:

- デフォルト: `channels.bluebubbles.dmPolicy = "pairing"`。
- 未知の送信者にはペアリングコードが返され、承認されるまでメッセージは無視されます（コードの有効期限は1時間）。
- 承認方法:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- ペアリングがデフォルトのトークン交換です。詳細: [ペアリング](/ja-JP/channels/pairing)

グループ:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（デフォルト: `allowlist`）。
- `channels.bluebubbles.groupAllowFrom` は、`allowlist` が設定されているときにグループ内で誰がトリガーできるかを制御します。

### 連絡先名の補完（macOS、任意）

BlueBubblesのグループWebhookには、生の参加者アドレスしか含まれないことがよくあります。`GroupMembers` コンテキストにその代わりローカルの連絡先名を表示したい場合は、macOSでローカルContacts補完を有効にできます:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` で参照を有効にします。デフォルト: `false`。
- 参照は、グループアクセス、コマンド認可、mentionゲーティングによってメッセージ通過が許可された後にのみ実行されます。
- 名前のない電話番号参加者のみが補完されます。
- ローカル一致が見つからない場合は、生の電話番号がフォールバックとして残ります。

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### mentionゲーティング（グループ）

BlueBubblesはグループチャットのmentionゲーティングをサポートしており、iMessage/WhatsAppの動作に一致します:

- `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）を使ってmentionを検出します。
- グループで `requireMention` が有効な場合、agentはmentionされたときのみ応答します。
- 認可された送信者からの制御コマンドはmentionゲーティングをバイパスします。

グループごとの設定:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // すべてのグループのデフォルト
        "iMessage;-;chat123": { requireMention: false }, // 特定のグループに対する上書き
      },
    },
  },
}
```

### コマンドゲーティング

- 制御コマンド（例: `/config`、`/model`）には認可が必要です。
- コマンド認可の判定には `allowFrom` と `groupAllowFrom` を使用します。
- 認可された送信者は、グループ内でmentionしなくても制御コマンドを実行できます。

### グループごとのシステムプロンプト

`channels.bluebubbles.groups.*` 配下の各エントリーでは、任意の `systemPrompt` 文字列を受け付けます。この値は、そのグループ内のメッセージを処理するすべてのターンでagentのシステムプロンプトに注入されるため、agentプロンプトを編集せずにグループごとの人格や振る舞いルールを設定できます:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "応答は3文以内にしてください。グループのカジュアルなトーンに合わせてください。",
        },
      },
    },
  },
}
```

キーは、BlueBubblesがそのグループについて報告する `chatGuid` / `chatIdentifier` / 数値の `chatId` のいずれかに一致します。また、`"*"` のワイルドカードエントリーを使うと、正確一致がないすべてのグループに対するデフォルトを設定できます（`requireMention` やグループごとのツールポリシーと同じパターンです）。常に正確一致がワイルドカードより優先されます。DMではこのフィールドは無視されます。代わりにagentレベルまたはアカウントレベルのプロンプトカスタマイズを使用してください。

#### 実例: スレッド返信とtapbackリアクション（Private API）

BlueBubbles Private APIを有効にすると、受信メッセージには短いメッセージID（たとえば `[[reply_to:5]]`）が含まれて届き、agentは `action=reply` を呼び出して特定のメッセージへのスレッド返信を行ったり、`action=react` を呼び出してtapbackを付けたりできます。グループごとの `systemPrompt` は、agentが適切なツールを選ぶよう維持するための信頼できる方法です:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "このグループで返信するときは、必ずコンテキスト内の",
            "[[reply_to:N]] messageIdを指定してaction=replyを呼び出し、",
            "応答がトリガーとなったメッセージの下にスレッドされるようにしてください。",
            "関連付けられていない新しいメッセージは絶対に送信しないでください。",
            "",
            "短い確認応答（'ok'、'got it'、'on it'）には、",
            "テキスト返信を送る代わりに、適切なtapback絵文字",
            "（❤️、👍、😂、‼️、❓）を指定したaction=reactを使用してください。",
          ].join(" "),
        },
      },
    },
  },
}
```

tapbackリアクションとスレッド返信はどちらもBlueBubbles Private APIが必要です。基礎となる仕組みについては [高度なアクション](#advanced-actions) と [Message IDs](#message-ids-short-vs-full) を参照してください。

## ACP会話バインディング

BlueBubblesチャットは、トランスポート層を変更せずに永続的なACPワークスペースへ変換できます。

高速なオペレーターフロー:

- DMまたは許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 以後、その同じBlueBubbles会話内のメッセージは、生成されたACPセッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済みACPセッションをその場でリセットします。
- `/acp close` はACPセッションを閉じて、バインディングを削除します。

設定済みの永続バインディングも、トップレベルの `bindings[]` エントリーで `type: "acp"` と `match.channel: "bluebubbles"` を使ってサポートされています。

`match.peer.id` には、サポートされている任意のBlueBubblesターゲット形式を使用できます:

- `+15555550123` や `user@example.com` のような正規化されたDMハンドル
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

安定したグループバインディングには、`chat_id:*` または `chat_identifier:*` を推奨します。

例:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

ACPバインディングの共通動作については [ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

## 入力中表示 + 既読通知

- **入力中表示**: 応答生成の前と最中に自動送信されます。
- **既読通知**: `channels.bluebubbles.sendReadReceipts` で制御されます（デフォルト: `true`）。
- **入力中表示**: OpenClawは入力開始イベントを送信します。BlueBubblesは送信時またはタイムアウト時に自動で入力中状態を解除します（`DELETE` による手動停止は信頼できません）。

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // 既読通知を無効化
    },
  },
}
```

## 高度なアクション

BlueBubblesは、設定で有効にすると高度なメッセージアクションをサポートします:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback（デフォルト: true）
        edit: true, // 送信済みメッセージを編集（macOS 13+、macOS 26 Tahoeでは壊れています）
        unsend: true, // メッセージの送信取り消し（macOS 13+）
        reply: true, // メッセージGUIDによる返信スレッド
        sendWithEffect: true, // メッセージエフェクト（slam、loudなど）
        renameGroup: true, // グループチャットの名前変更
        setGroupIcon: true, // グループチャットのアイコン/写真を設定（macOS 26 Tahoeでは不安定）
        addParticipant: true, // グループに参加者を追加
        removeParticipant: true, // グループから参加者を削除
        leaveGroup: true, // グループチャットから退出
        sendAttachment: true, // 添付ファイル/メディアを送信
      },
    },
  },
}
```

利用可能なアクション:

- **react**: tapbackリアクションを追加/削除（`messageId`、`emoji`、`remove`）
- **edit**: 送信済みメッセージを編集（`messageId`、`text`）
- **unsend**: メッセージを送信取り消し（`messageId`）
- **reply**: 特定のメッセージに返信（`messageId`、`text`、`to`）
- **sendWithEffect**: iMessageエフェクト付きで送信（`text`、`to`、`effectId`）
- **renameGroup**: グループチャットの名前を変更（`chatGuid`、`displayName`）
- **setGroupIcon**: グループチャットのアイコン/写真を設定（`chatGuid`、`media`）— macOS 26 Tahoeでは不安定です（APIは成功を返しても、アイコンが同期されない場合があります）。
- **addParticipant**: グループに参加者を追加（`chatGuid`、`address`）
- **removeParticipant**: グループから参加者を削除（`chatGuid`、`address`）
- **leaveGroup**: グループチャットから退出（`chatGuid`）
- **upload-file**: メディア/ファイルを送信（`to`、`buffer`、`filename`、`asVoice`）
  - ボイスメモ: **MP3** または **CAF** 音声に `asVoice: true` を設定すると、iMessageのボイスメッセージとして送信できます。BlueBubblesはボイスメモ送信時にMP3 → CAFへ変換します。
- レガシーエイリアス: `sendAttachment` も引き続き使えますが、正式なアクション名は `upload-file` です。

### Message IDs（短縮版と完全版）

OpenClawはトークン節約のため、_短縮_ メッセージID（例: `1`、`2`）を表示することがあります。

- `MessageSid` / `ReplyToId` は短縮IDの場合があります。
- `MessageSidFull` / `ReplyToIdFull` にはプロバイダーの完全IDが入ります。
- 短縮IDはメモリ内のみです。再起動やキャッシュ削除で失効することがあります。
- アクションは短縮または完全な `messageId` を受け付けますが、短縮IDは利用できなくなるとエラーになります。

永続的な自動化や保存には完全IDを使ってください:

- テンプレート: `{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- コンテキスト: 受信payload内の `MessageSidFull` / `ReplyToIdFull`

テンプレート変数については [設定](/ja-JP/gateway/configuration) を参照してください。

## ブロックストリーミング

応答を単一メッセージで送るか、ブロック単位でストリーミングするかを制御します:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // ブロックストリーミングを有効化（デフォルトでは無効）
    },
  },
}
```

## メディア + 制限

- 受信添付ファイルはダウンロードされ、メディアキャッシュに保存されます。
- 受信/送信メディアの上限は `channels.bluebubbles.mediaMaxMb` で設定します（デフォルト: 8 MB）。
- 送信テキストは `channels.bluebubbles.textChunkLimit` に従って分割されます（デフォルト: 4000文字）。

## 設定リファレンス

完全な設定: [設定](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.bluebubbles.enabled`: チャンネルを有効/無効化します。
- `channels.bluebubbles.serverUrl`: BlueBubbles REST APIのベースURL。
- `channels.bluebubbles.password`: APIパスワード。
- `channels.bluebubbles.webhookPath`: Webhookエンドポイントのパス（デフォルト: `/bluebubbles-webhook`）。
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。
- `channels.bluebubbles.allowFrom`: DM許可リスト（ハンドル、メール、E.164番号、`chat_id:*`、`chat_guid:*`）。
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled`（デフォルト: `allowlist`）。
- `channels.bluebubbles.groupAllowFrom`: グループ送信者の許可リスト。
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOSで、ゲーティング通過後に名前のないグループ参加者をローカルContactsから任意で補完します。デフォルト: `false`。
- `channels.bluebubbles.groups`: グループごとの設定（`requireMention` など）。
- `channels.bluebubbles.sendReadReceipts`: 既読通知を送信します（デフォルト: `true`）。
- `channels.bluebubbles.blockStreaming`: ブロックストリーミングを有効化します（デフォルト: `false`。ストリーミング返信に必要）。
- `channels.bluebubbles.textChunkLimit`: 送信チャンクサイズ（文字数、デフォルト: 4000）。
- `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` 経由の送信テキスト送信に対するリクエストごとのタイムアウト（ミリ秒、デフォルト: 30000）。macOS 26環境でPrivate APIのiMessage送信がiMessageフレームワーク内で60秒以上停止する場合は引き上げてください。たとえば `45000` や `60000`。現在、プローブ、チャット参照、リアクション、編集、ヘルスチェックは短い10秒デフォルトのままです。リアクションと編集にも広げる対応は今後のフォローアップとして予定されています。アカウント単位の上書き: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
- `channels.bluebubbles.chunkMode`: `length`（デフォルト）は `textChunkLimit` を超えたときのみ分割します。`newline` は長さによる分割の前に空行（段落境界）で分割します。
- `channels.bluebubbles.mediaMaxMb`: 受信/送信メディア上限（MB、デフォルト: 8）。
- `channels.bluebubbles.mediaLocalRoots`: 送信ローカルメディアパスで許可される絶対ローカルディレクトリの明示的許可リスト。これを設定しない限り、ローカルパス送信はデフォルトで拒否されます。アカウント単位の上書き: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
- `channels.bluebubbles.historyLimit`: コンテキストに含めるグループメッセージの最大数（0で無効化）。
- `channels.bluebubbles.dmHistoryLimit`: DM履歴の上限。
- `channels.bluebubbles.actions`: 特定アクションの有効/無効。
- `channels.bluebubbles.accounts`: マルチアカウント設定。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`.

## アドレッシング / 配信ターゲット

安定したルーティングには `chat_guid` を推奨します:

- `chat_guid:iMessage;-;+15555550123`（グループ向け推奨）
- `chat_id:123`
- `chat_identifier:...`
- 直接ハンドル: `+15555550123`、`user@example.com`
  - 直接ハンドルに既存のDMチャットがない場合、OpenClawは `POST /api/v1/chat/new` によって作成します。これにはBlueBubbles Private APIが有効である必要があります。

## セキュリティ

- Webhookリクエストは、`guid`/`password` クエリパラメータまたはヘッダーを `channels.bluebubbles.password` と照合して認証されます。
- APIパスワードとWebhookエンドポイントは秘密にしてください（認証情報として扱ってください）。
- BlueBubblesのWebhook認証にはlocalhostバイパスはありません。Webhookトラフィックをproxyする場合でも、BlueBubblesのパスワードをエンドツーエンドでリクエストに保持してください。ここでは `gateway.trustedProxies` は `channels.bluebubbles.password` の代わりにはなりません。詳しくは [Gateway security](/ja-JP/gateway/security#reverse-proxy-configuration) を参照してください。
- LAN外に公開する場合は、BlueBubblesサーバーでHTTPS + ファイアウォールルールを有効にしてください。

## トラブルシューティング

- 入力中/既読イベントが動かなくなった場合は、BlueBubblesのWebhookログを確認し、gatewayパスが `channels.bluebubbles.webhookPath` と一致していることを確認してください。
- ペアリングコードは1時間で失効します。`openclaw pairing list bluebubbles` と `openclaw pairing approve bluebubbles <code>` を使用してください。
- リアクションにはBlueBubbles private API（`POST /api/v1/message/react`）が必要です。サーバーバージョンがこれを提供していることを確認してください。
- 編集/送信取り消しにはmacOS 13+ と互換性のあるBlueBubblesサーバーバージョンが必要です。macOS 26（Tahoe）では、private APIの変更により編集は現在壊れています。
- グループアイコン更新はmacOS 26（Tahoe）では不安定な場合があります: APIは成功を返しても、新しいアイコンが同期されないことがあります。
- OpenClawは、BlueBubblesサーバーのmacOSバージョンに基づいて既知の不具合があるアクションを自動的に非表示にします。macOS 26（Tahoe）でもeditが表示される場合は、`channels.bluebubbles.actions.edit=false` で手動無効化してください。
- ステータス/ヘルス情報: `openclaw status --all` または `openclaw status --deep`。

一般的なチャンネルワークフローの参考として、[チャンネル](/ja-JP/channels) と [Plugins](/ja-JP/tools/plugin) ガイドを参照してください。

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされるすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの挙動とmentionゲーティング
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
