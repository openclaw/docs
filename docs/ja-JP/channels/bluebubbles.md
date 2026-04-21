---
read_when:
    - BlueBubblesチャネルのセットアップ
    - Webhookペアリングのトラブルシューティング
    - macOSでのiMessageの設定
summary: BlueBubbles macOSサーバー経由のiMessage（REST送受信、入力中表示、リアクション、ペアリング、高度なアクション）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-21T13:35:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30ce50ae8a17140b42fa410647c367e0eefdffb1646b1ff92d8e1af63f2e1155
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

ステータス: HTTP経由でBlueBubbles macOSサーバーと通信するバンドル済みPlugin。レガシーのimsgチャネルと比べてAPIがより豊富でセットアップも簡単なため、**iMessage連携にはこちらを推奨**します。

## バンドル済みPlugin

現在のOpenClawリリースにはBlueBubblesが同梱されているため、通常のパッケージ版ビルドでは別途 `openclaw plugins install` を実行する必要はありません。

## 概要

- BlueBubblesヘルパーアプリ（[bluebubbles.app](https://bluebubbles.app)）を通じてmacOS上で動作します。
- 推奨/テスト済み: macOS Sequoia (15)。macOS Tahoe (26)でも動作しますが、現時点では編集が壊れており、グループアイコンの更新は成功と表示されても同期されない場合があります。
- OpenClawはREST API（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）を通じて通信します。
- 受信メッセージはWebhook経由で到着し、返信送信、入力中表示、既読通知、TapbackはREST呼び出しで行われます。
- 添付ファイルとステッカーは受信メディアとして取り込まれ、可能な場合はエージェントにも渡されます。
- ペアリング/許可リストは他のチャネルと同じように動作します（`/channels/pairing` など）。`channels.bluebubbles.allowFrom` + ペアリングコードを使用します。
- リアクションはSlack/Telegramと同様にシステムイベントとして扱われるため、エージェントは返信前にそれらに「言及」できます。
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

4. BlueBubblesのWebhookをゲートウェイに向けます（例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
5. ゲートウェイを起動します。Webhookハンドラーが登録され、ペアリングが開始されます。

セキュリティに関する注意:

- 必ずWebhookパスワードを設定してください。
- Webhook認証は常に必須です。OpenClawは、BlueBubblesのWebhookリクエストに `channels.bluebubbles.password` と一致するpassword/guid（たとえば `?password=<password>` または `x-password`）が含まれていない限り、loopback/proxy構成に関係なく拒否します。
- パスワード認証は、Webhook本文全体の読み取り/解析より前に検証されます。

## Messages.appを生かしておく（VM / ヘッドレス環境）

一部のmacOS VM / 常時稼働環境では、Messages.appが「アイドル」状態になり（アプリを開いたり前面に出したりするまで受信イベントが止まる）、問題になることがあります。簡単な回避策として、AppleScript + LaunchAgentを使って**5分ごとにMessagesをつつく**方法があります。

### 1) AppleScriptを保存する

次の場所に保存します:

- `~/Scripts/poke-messages.scpt`

スクリプト例（非対話型。フォーカスを奪いません）:

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

次の場所に保存します:

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
- 初回実行時にmacOSの**Automation**プロンプト（`osascript` → Messages）が表示されることがあります。LaunchAgentを実行する同じユーザーセッションで承認してください。

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

ウィザードで求められる項目:

- **Server URL**（必須）: BlueBubblesサーバーのアドレス（例: `http://192.168.1.100:1234`）
- **Password**（必須）: BlueBubbles Server設定のAPIパスワード
- **Webhook path**（任意）: デフォルトは `/bluebubbles-webhook`
- **DM policy**: pairing、allowlist、open、またはdisabled
- **Allow list**: 電話番号、メールアドレス、またはチャット対象

CLIからBlueBubblesを追加することもできます:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## アクセス制御（DM + グループ）

DM:

- デフォルト: `channels.bluebubbles.dmPolicy = "pairing"`。
- 未知の送信者にはペアリングコードが返され、承認されるまではメッセージは無視されます（コードの有効期限は1時間）。
- 承認方法:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- ペアリングがデフォルトのトークン交換方式です。詳細: [Pairing](/ja-JP/channels/pairing)

グループ:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（デフォルト: `allowlist`）。
- `channels.bluebubbles.groupAllowFrom` は、`allowlist` が設定されているときにグループ内で誰がトリガーできるかを制御します。

### 連絡先名の補完（macOS、任意）

BlueBubblesのグループWebhookには、生の参加者アドレスしか含まれないことがよくあります。`GroupMembers` コンテキストに代わりにローカルの連絡先名を表示したい場合は、macOS上でローカルContacts補完を有効にできます:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` で参照を有効にします。デフォルトは `false`。
- 参照は、グループアクセス、コマンド認可、メンションゲートを通過した後にのみ実行されます。
- 名前のない電話参加者のみが補完されます。
- ローカル一致が見つからない場合は、生の電話番号がフォールバックとしてそのまま使われます。

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### メンションゲート（グループ）

BlueBubblesは、iMessage/WhatsAppの動作に合わせて、グループチャットでのメンションゲートをサポートします:

- `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）を使ってメンションを検出します。
- グループで `requireMention` が有効な場合、エージェントはメンションされたときだけ応答します。
- 認可された送信者からの制御コマンドはメンションゲートをバイパスします。

グループごとの設定:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // すべてのグループのデフォルト
        "iMessage;-;chat123": { requireMention: false }, // 特定のグループ用の上書き
      },
    },
  },
}
```

### コマンドゲート

- 制御コマンド（例: `/config`、`/model`）には認可が必要です。
- コマンド認可の判定には `allowFrom` と `groupAllowFrom` を使用します。
- 認可された送信者は、グループ内でメンションしなくても制御コマンドを実行できます。

### グループごとのシステムプロンプト

`channels.bluebubbles.groups.*` 以下の各エントリーは、任意の `systemPrompt` 文字列を受け付けます。この値は、そのグループ内のメッセージを処理するすべてのターンでエージェントのシステムプロンプトに注入されるため、エージェントのプロンプトを編集せずに、グループごとのペルソナや振る舞いルールを設定できます:

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

キーは、BlueBubblesがそのグループに対して報告する `chatGuid` / `chatIdentifier` / 数値の `chatId` のいずれかに一致し、`"*"` ワイルドカードのエントリーを使うと、完全一致がないすべてのグループに対するデフォルトを提供できます（`requireMention` やグループごとのツールポリシーと同じパターンです）。完全一致は常にワイルドカードより優先されます。DMではこのフィールドは無視されます。代わりに、エージェントレベルまたはアカウントレベルのプロンプトカスタマイズを使ってください。

#### 実例: スレッド返信とTapbackリアクション（Private API）

BlueBubbles Private APIを有効にすると、受信メッセージには短いメッセージID（例: `[[reply_to:5]]`）が付いて届き、エージェントは `action=reply` を呼び出して特定のメッセージにスレッド返信したり、`action=react` を呼び出してTapbackを付けたりできます。グループごとの `systemPrompt` は、エージェントに正しいツールを選ばせる確実な方法です:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "このグループで返信するときは、必ずコンテキスト内の",
            "[[reply_to:N]] messageIdを使って action=reply を呼び出し、",
            "トリガーしたメッセージの下に返信をスレッドしてください。",
            "新しい関連付けられていないメッセージを送信してはいけません。",
            "",
            "短い確認応答（「了解」「わかった」「対応する」など）には、",
            "テキスト返信を送る代わりに、適切なTapback絵文字",
            "(❤️, 👍, 😂, ‼️, ❓) で action=react を使ってください。",
          ].join(" "),
        },
      },
    },
  },
}
```

Tapbackリアクションとスレッド返信はどちらもBlueBubbles Private APIが必要です。基本的な仕組みについては、[高度なアクション](#advanced-actions) と [メッセージID](#message-ids-short-vs-full) を参照してください。

## ACP会話バインディング

BlueBubblesチャットは、トランスポート層を変更せずに永続的なACPワークスペースにできます。

高速なオペレーターフロー:

- DMまたは許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 以後、その同じBlueBubbles会話内のメッセージは、生成されたACPセッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済みACPセッションをその場でリセットします。
- `/acp close` はACPセッションを閉じ、バインディングを削除します。

設定済みの永続バインディングも、トップレベルの `bindings[]` エントリーで `type: "acp"` および `match.channel: "bluebubbles"` を指定することでサポートされます。

`match.peer.id` には、サポートされている任意のBlueBubblesターゲット形式を使用できます:

- `+15555550123` や `user@example.com` のような正規化済みDMハンドル
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

共有のACPバインディング動作については、[ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

## 入力中表示 + 既読通知

- **入力中表示**: 応答生成の前および途中で自動送信されます。
- **既読通知**: `channels.bluebubbles.sendReadReceipts` で制御されます（デフォルト: `true`）。
- **入力中表示**: OpenClawは入力開始イベントを送信します。BlueBubblesは送信時またはタイムアウト時に自動で入力中表示を解除します（DELETEによる手動停止は信頼できません）。

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
        edit: true, // 送信済みメッセージを編集（macOS 13+、macOS 26 Tahoeでは破損）
        unsend: true, // メッセージの送信取り消し（macOS 13+）
        reply: true, // メッセージGUIDによるスレッド返信
        sendWithEffect: true, // メッセージエフェクト（slam、loud など）
        renameGroup: true, // グループチャット名を変更
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

- **react**: Tapbackリアクションを追加/削除（`messageId`, `emoji`, `remove`）
- **edit**: 送信済みメッセージを編集（`messageId`, `text`）
- **unsend**: メッセージを送信取り消し（`messageId`）
- **reply**: 特定のメッセージに返信（`messageId`, `text`, `to`）
- **sendWithEffect**: iMessageエフェクト付きで送信（`text`, `to`, `effectId`）
- **renameGroup**: グループチャット名を変更（`chatGuid`, `displayName`）
- **setGroupIcon**: グループチャットのアイコン/写真を設定（`chatGuid`, `media`）— macOS 26 Tahoeでは不安定です（APIは成功を返してもアイコンが同期されないことがあります）。
- **addParticipant**: グループに参加者を追加（`chatGuid`, `address`）
- **removeParticipant**: グループから参加者を削除（`chatGuid`, `address`）
- **leaveGroup**: グループチャットから退出（`chatGuid`）
- **upload-file**: メディア/ファイルを送信（`to`, `buffer`, `filename`, `asVoice`）
  - ボイスメモ: **MP3** または **CAF** 音声で `asVoice: true` を設定すると、iMessageの音声メッセージとして送信されます。BlueBubblesはボイスメモ送信時にMP3 → CAFへ変換します。
- レガシーエイリアス: `sendAttachment` も引き続き動作しますが、正式なアクション名は `upload-file` です。

### メッセージID（短縮版と完全版）

OpenClawはトークン節約のために、_短縮_ メッセージID（例: `1`, `2`）を表示する場合があります。

- `MessageSid` / `ReplyToId` は短縮IDの場合があります。
- `MessageSidFull` / `ReplyToIdFull` にはプロバイダーの完全IDが入ります。
- 短縮IDはメモリ内のみです。再起動やキャッシュ削除で失効することがあります。
- アクションは短縮または完全な `messageId` を受け付けますが、短縮IDがすでに使えない場合はエラーになります。

永続的な自動化や保存には完全IDを使ってください:

- テンプレート: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- コンテキスト: 受信ペイロード内の `MessageSidFull` / `ReplyToIdFull`

テンプレート変数については [Configuration](/ja-JP/gateway/configuration) を参照してください。

## 分割送信されたDMの結合（1回の入力内のコマンド + URL）

ユーザーがiMessageでコマンドとURLを一緒に入力した場合 — たとえば `Dump https://example.com/article` — Appleは送信を**2つの別々のWebhook配信**に分割します:

1. テキストメッセージ（`"Dump"`）。
2. URLプレビューバルーン（`"https://..."`）と、添付ファイルとしてのOGプレビュー画像。

この2つのWebhookは、多くの環境でOpenClawに約0.8〜2.0秒差で到着します。結合しない場合、エージェントは1ターン目でコマンドだけを受け取り、返信し（しばしば「URLを送ってください」になります）、URLを2ターン目で初めて見ることになります — その時点ではコマンドの文脈はすでに失われています。

`channels.bluebubbles.coalesceSameSenderDms` は、同じ送信者から連続して届いたWebhookを1つのエージェントターンにまとめるようDMで有効化します。グループチャットでは、複数ユーザーのターン構造を保つため、引き続きメッセージごとに処理されます。

### 有効にするべき場合

次の場合に有効化してください:

- 1つのメッセージ内で `command + payload` を想定するSkillsを提供している（dump、paste、save、queue など）。
- ユーザーがコマンドと一緒にURL、画像、長文コンテンツを貼り付ける。
- DMターンのレイテンシ増加を許容できる（下記参照）。

次の場合は無効のままにしてください:

- 単語1つのDMトリガーで最小レイテンシが必要。
- すべてのフローが、後続ペイロードを伴わないワンショットコマンドである。

### 有効化

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // オプトイン（デフォルト: false）
    },
  },
}
```

このフラグがオンで、`messages.inbound.byChannel.bluebubbles` が明示されていない場合、デバウンスウィンドウは **2500 ms** に広がります（非結合時のデフォルトは500 msです）。この広いウィンドウが必要です — Appleの0.8〜2.0秒の分割送信間隔は、より狭いデフォルトには収まりません。

ウィンドウを自分で調整するには:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 msで多くの環境に対応します。Macが遅い場合や
        // メモリ圧迫下にある場合は4000 msまで上げてください
        // （その場合、観測される間隔が2秒を超えて伸びることがあります）。
        bluebubbles: 2500,
      },
    },
  },
}
```

### トレードオフ

- **DM制御コマンドのレイテンシ増加。** このフラグがオンだと、DMの制御コマンドメッセージ（`Dump`、`Save` など）は、ペイロードWebhookが続く可能性に備えて、ディスパッチ前にデバウンスウィンドウ分だけ待機します。グループチャットのコマンドは引き続き即時ディスパッチです。
- **結合後の出力には上限があります** — 結合テキストは4000文字で明示的な `…[truncated]` マーカー付き、添付ファイルは20件まで、ソースエントリーは10件までです（それを超える場合は先頭+最新を保持）。各ソース `messageId` は引き続き受信重複排除に渡されるため、後でMessagePollerが個別イベントを再生しても重複として認識されます。
- **チャネル単位のオプトインです。** 他のチャネル（Telegram、WhatsApp、Slack、…）には影響しません。

### シナリオと、エージェントに見えるもの

| ユーザーの入力                                                      | Appleの配信             | フラグオフ（デフォルト）                | フラグオン + 2500 msウィンドウ                                           |
| ------------------------------------------------------------------- | ----------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com`（1回で送信）                             | 約1秒差で2 webhook      | 2つのエージェントターン: `Dump` のみ、その後URL | 1ターン: 結合テキスト `Dump https://example.com`                         |
| `Save this 📎image.jpg caption`（添付ファイル + テキスト）          | 2 webhook               | 2ターン                                 | 1ターン: テキスト + 画像                                                 |
| `/status`（単独コマンド）                                           | 1 webhook               | 即時ディスパッチ                        | **ウィンドウ分待機してからディスパッチ**                                 |
| URLのみを貼り付け                                                   | 1 webhook               | 即時ディスパッチ                        | 即時ディスパッチ（バケット内に1件しかない）                              |
| テキスト + URLを、意図的に数分空けた別メッセージとして送信         | ウィンドウ外で2 webhook | 2ターン                                 | 2ターン（その間にウィンドウが期限切れ）                                  |
| 短時間に大量送信（ウィンドウ内で10件超の小さなDM）                 | N webhook               | Nターン                                 | 1ターン、上限制御された出力（先頭 + 最新、テキスト/添付ファイル上限適用） |

### 分割送信結合のトラブルシューティング

フラグをオンにしても分割送信が2ターンで届く場合は、各レイヤーを確認してください:

1. **設定が実際に読み込まれているか。**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   その後 `openclaw gateway restart` を実行してください — このフラグはdebouncer-registry生成時に読み込まれます。

2. **デバウンスウィンドウが環境に対して十分広いか。** `~/Library/Logs/bluebubbles-server/main.log` にあるBlueBubblesサーバーログを確認してください:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   `"Dump"` のようなテキスト送信と、その後に続く `"https://..."; Attachments:` 送信の間隔を測定してください。その間隔を十分にカバーできるように `messages.inbound.byChannel.bluebubbles` を引き上げてください。

3. **セッションJSONLのタイムスタンプ ≠ webhook到着時刻。** セッションイベントのタイムスタンプ（`~/.openclaw/agents/<id>/sessions/*.jsonl`）は、Webhookの到着時刻ではなく、ゲートウェイがメッセージをエージェントに渡した時刻を反映します。`[Queued messages while agent was busy]` と付いたキュー済みの2件目メッセージは、2件目Webhookが来た時点で1ターン目がまだ実行中だったことを意味します — つまり、その前に結合バケットはすでにflushされています。ウィンドウ調整はセッションログではなくBBサーバーログを基準にしてください。

4. **メモリ圧迫で返信ディスパッチが遅くなっている。** 小さいマシン（8 GB）では、エージェントターンに時間がかかりすぎて、返信完了前に結合バケットがflushされ、URLがキュー済みの2ターン目として届くことがあります。`memory_pressure` と `ps -o rss -p $(pgrep openclaw-gateway)` を確認してください。ゲートウェイが約500 MB RSSを超えていてコンプレッサーが動作している場合は、他の重いプロセスを閉じるか、より大きいホストに切り替えてください。

5. **返信引用送信は別経路です。** ユーザーが既存のURLバルーンに対する**返信**として `Dump` をタップした場合（iMessageではDumpバブルに「1 Reply」バッジが表示されます）、URLは2件目のWebhookではなく `replyToBody` に入ります。結合は適用されません — これはdebouncerの問題ではなく、Skill/プロンプト側の問題です。

## ブロックストリーミング

応答を単一メッセージとして送るか、ブロック単位でストリーミングするかを制御します:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // ブロックストリーミングを有効化（デフォルトではオフ）
    },
  },
}
```

## メディア + 制限

- 受信添付ファイルはダウンロードされ、メディアキャッシュに保存されます。
- 受信/送信メディアの上限は `channels.bluebubbles.mediaMaxMb` で制御されます（デフォルト: 8 MB）。
- 送信テキストは `channels.bluebubbles.textChunkLimit` で分割されます（デフォルト: 4000文字）。

## 設定リファレンス

完全な設定: [Configuration](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.bluebubbles.enabled`: チャネルを有効/無効にします。
- `channels.bluebubbles.serverUrl`: BlueBubbles REST APIのベースURL。
- `channels.bluebubbles.password`: APIパスワード。
- `channels.bluebubbles.webhookPath`: Webhookエンドポイントのパス（デフォルト: `/bluebubbles-webhook`）。
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。
- `channels.bluebubbles.allowFrom`: DM許可リスト（ハンドル、メールアドレス、E.164番号、`chat_id:*`、`chat_guid:*`）。
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled`（デフォルト: `allowlist`）。
- `channels.bluebubbles.groupAllowFrom`: グループ送信者の許可リスト。
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS上で、ゲート通過後に名前のないグループ参加者をローカルContactsから任意で補完します。デフォルト: `false`。
- `channels.bluebubbles.groups`: グループごとの設定（`requireMention` など）。
- `channels.bluebubbles.sendReadReceipts`: 既読通知を送信します（デフォルト: `true`）。
- `channels.bluebubbles.blockStreaming`: ブロックストリーミングを有効にします（デフォルト: `false`。ストリーミング返信に必要）。
- `channels.bluebubbles.textChunkLimit`: 送信チャンクの文字数上限（デフォルト: 4000）。
- `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` 経由の送信テキストリクエストごとのタイムアウト（ミリ秒、デフォルト: 30000）。macOS 26環境でPrivate APIのiMessage送信がiMessageフレームワーク内で60秒以上停止する場合は、`45000` や `60000` に引き上げてください。現在のところ、プローブ、チャット検索、リアクション、編集、ヘルスチェックは短い10秒デフォルトのままです。リアクションや編集への適用拡大は今後のフォローアップとして予定されています。アカウント単位の上書き: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
- `channels.bluebubbles.chunkMode`: `length`（デフォルト）は `textChunkLimit` を超えた場合のみ分割します。`newline` は長さによる分割の前に空行（段落境界）で分割します。
- `channels.bluebubbles.mediaMaxMb`: 受信/送信メディアの上限サイズ（MB、デフォルト: 8）。
- `channels.bluebubbles.mediaLocalRoots`: 送信するローカルメディアパスとして許可される絶対ローカルディレクトリの明示的な許可リスト。これを設定しない限り、ローカルパス送信はデフォルトで拒否されます。アカウント単位の上書き: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
- `channels.bluebubbles.coalesceSameSenderDms`: 同じ送信者から連続するDM Webhookを1つのエージェントターンにまとめ、Appleのテキスト+URL分割送信を1つのメッセージとして受け取れるようにします（デフォルト: `false`）。シナリオ、ウィンドウ調整、トレードオフについては [分割送信されたDMの結合](#coalescing-split-send-dms-command--url-in-one-composition) を参照してください。有効化され、かつ `messages.inbound.byChannel.bluebubbles` が明示されていない場合、デフォルトの受信デバウンスウィンドウは500 msから2500 msに広がります。
- `channels.bluebubbles.historyLimit`: コンテキスト用のグループメッセージ最大数（0で無効）。
- `channels.bluebubbles.dmHistoryLimit`: DM履歴の上限。
- `channels.bluebubbles.actions`: 個別アクションの有効/無効を切り替えます。
- `channels.bluebubbles.accounts`: マルチアカウント設定。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`.

## アドレス指定 / 配信ターゲット

安定したルーティングには `chat_guid` を推奨します:

- `chat_guid:iMessage;-;+15555550123`（グループ向け推奨）
- `chat_id:123`
- `chat_identifier:...`
- 直接ハンドル: `+15555550123`, `user@example.com`
  - 直接ハンドルに既存のDMチャットがない場合、OpenClawは `POST /api/v1/chat/new` を通じて作成します。これにはBlueBubbles Private APIを有効にする必要があります。

## セキュリティ

- Webhookリクエストは、クエリパラメータまたはヘッダーの `guid`/`password` を `channels.bluebubbles.password` と比較して認証されます。
- APIパスワードとWebhookエンドポイントは秘密にしてください（認証情報として扱ってください）。
- BlueBubblesのWebhook認証にはlocalhostバイパスはありません。Webhookトラフィックをプロキシする場合でも、リクエストのエンドツーエンドでBlueBubblesパスワードを保持してください。ここでは `gateway.trustedProxies` は `channels.bluebubbles.password` の代わりにはなりません。[Gateway security](/ja-JP/gateway/security#reverse-proxy-configuration) を参照してください。
- BlueBubblesサーバーをLAN外に公開する場合は、HTTPSとファイアウォールルールを有効にしてください。

## トラブルシューティング

- 入力中/既読イベントが動かなくなった場合は、BlueBubblesのWebhookログを確認し、ゲートウェイパスが `channels.bluebubbles.webhookPath` と一致していることを確認してください。
- ペアリングコードの有効期限は1時間です。`openclaw pairing list bluebubbles` と `openclaw pairing approve bluebubbles <code>` を使用してください。
- リアクションにはBlueBubbles Private API（`POST /api/v1/message/react`）が必要です。サーバーバージョンで公開されていることを確認してください。
- 編集/送信取り消しにはmacOS 13+と、互換性のあるBlueBubblesサーバーバージョンが必要です。macOS 26（Tahoe）では、Private APIの変更により編集は現在壊れています。
- グループアイコン更新はmacOS 26（Tahoe）では不安定な場合があります。APIは成功を返しても、新しいアイコンが同期されないことがあります。
- OpenClawは、BlueBubblesサーバーのmacOSバージョンに基づいて、既知の不具合があるアクションを自動的に非表示にします。macOS 26（Tahoe）でまだ編集が表示される場合は、`channels.bluebubbles.actions.edit=false` で手動で無効にしてください。
- `coalesceSameSenderDms` を有効にしても分割送信（例: `Dump` + URL）がまだ2ターンで届く場合: [分割送信結合のトラブルシューティング](#split-send-coalescing-troubleshooting) のチェックリストを参照してください — よくある原因は、狭すぎるデバウンスウィンドウ、セッションログのタイムスタンプをWebhook到着時刻と誤認していること、または返信引用送信（2件目のWebhookではなく `replyToBody` を使います）です。
- ステータス/ヘルス情報については、`openclaw status --all` または `openclaw status --deep` を使用してください。

一般的なチャネルワークフローの参考として、[Channels](/ja-JP/channels) と [Plugins](/ja-JP/tools/plugin) ガイドを参照してください。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの挙動とメンションゲート
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
