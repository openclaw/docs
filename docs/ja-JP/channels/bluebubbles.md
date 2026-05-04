---
read_when:
    - BlueBubbles チャネルの設定
    - Webhook ペアリングのトラブルシューティング
    - macOS で iMessage を設定する
sidebarTitle: BlueBubbles
summary: BlueBubbles macOS サーバー経由の iMessage（REST による送受信、入力中表示、リアクション、ペアリング、高度なアクション）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-04T02:21:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78a054da0c7c32b161997acd05914896259dd1a050e736a4c9e438a452ab6a51
    source_path: channels/bluebubbles.md
    workflow: 16
---

ステータス: HTTP 経由で BlueBubbles macOS サーバーと通信するバンドル済み Plugin。従来の imsg チャンネルと比べて API が充実しており設定も簡単なため、**iMessage 統合に推奨**されます。

<Note>
現在の OpenClaw リリースには BlueBubbles がバンドルされているため、通常のパッケージ版ビルドでは別途 `openclaw plugins install` 手順は不要です。
</Note>

## 概要

- BlueBubbles ヘルパーアプリ（[bluebubbles.app](https://bluebubbles.app)）を介して macOS 上で動作します。
- 推奨/テスト済み: macOS Sequoia (15)。macOS Tahoe (26) でも動作しますが、Tahoe では現在編集が壊れており、グループアイコンの更新は成功と報告されても同期されない場合があります。
- OpenClaw は REST API（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）を通じて通信します。
- 受信メッセージは Webhook 経由で届きます。送信返信、入力中インジケーター、既読通知、tapback は REST 呼び出しです。
- 添付ファイルとステッカーは受信メディアとして取り込まれます（可能な場合はエージェントにも公開されます）。
- MP3 または CAF 音声を合成する自動 TTS 返信は、通常のファイル添付ではなく iMessage のボイスメモバブルとして配信されます。
- ペアリング/許可リストは他のチャンネル（`/channels/pairing` など）と同じように動作し、`channels.bluebubbles.allowFrom` + ペアリングコードを使用します。
- リアクションは Slack/Telegram と同様にシステムイベントとして公開されるため、エージェントは返信前にそれらに「言及」できます。
- 高度な機能: 編集、送信取り消し、返信スレッド、メッセージエフェクト、グループ管理。

## クイックスタート

<Steps>
  <Step title="Install BlueBubbles">
    Mac に BlueBubbles サーバーをインストールします（[bluebubbles.app/install](https://bluebubbles.app/install) の手順に従ってください）。
  </Step>
  <Step title="Enable the web API">
    BlueBubbles 設定で Web API を有効にし、パスワードを設定します。
  </Step>
  <Step title="Configure OpenClaw">
    `openclaw onboard` を実行して BlueBubbles を選択するか、手動で設定します。

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

  </Step>
  <Step title="Point webhooks at the gateway">
    BlueBubbles Webhook を Gateway に向けます（例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
  </Step>
  <Step title="Start the gateway">
    Gateway を起動します。Webhook ハンドラーが登録され、ペアリングが開始されます。
  </Step>
</Steps>

<Warning>
**セキュリティ**

- 必ず Webhook パスワードを設定してください。
- Webhook 認証は常に必須です。OpenClaw は、local loopback/プロキシのトポロジに関係なく、`channels.bluebubbles.password` と一致する password/guid（例: `?password=<password>` または `x-password`）が含まれていない BlueBubbles Webhook リクエストを拒否します。
- パスワード認証は、Webhook 本文全体を読み取り/解析する前にチェックされます。

</Warning>

## Messages.app を生存させる（VM / ヘッドレス構成）

一部の macOS VM / 常時稼働構成では、Messages.app が「アイドル」状態になることがあります（アプリを開く/前面に出すまで受信イベントが停止します）。簡単な回避策は、AppleScript + LaunchAgent を使って **5 分ごとに Messages を刺激する**ことです。

<Steps>
  <Step title="Save the AppleScript">
    これを `~/Scripts/poke-messages.scpt` として保存します。

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

  </Step>
  <Step title="Install a LaunchAgent">
    これを `~/Library/LaunchAgents/com.user.poke-messages.plist` として保存します。

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

    これは **300 秒ごと**、および**ログイン時**に実行されます。初回実行時に macOS の **Automation** プロンプト（`osascript` → Messages）が表示される場合があります。LaunchAgent を実行する同じユーザーセッションで承認してください。

  </Step>
  <Step title="Load it">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## オンボーディング

BlueBubbles は対話型オンボーディングで利用できます。

```
openclaw onboard
```

ウィザードでは次の入力を求められます。

<ParamField path="Server URL" type="string" required>
  BlueBubbles サーバーのアドレス（例: `http://192.168.1.100:1234`）。
</ParamField>
<ParamField path="Password" type="string" required>
  BlueBubbles Server 設定の API パスワード。
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Webhook エンドポイントパス。
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`、`allowlist`、`open`、または `disabled`。
</ParamField>
<ParamField path="Allow list" type="string[]">
  電話番号、メールアドレス、またはチャットターゲット。
</ParamField>

CLI 経由で BlueBubbles を追加することもできます。

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## アクセス制御（DM + グループ）

<Tabs>
  <Tab title="DMs">
    - デフォルト: `channels.bluebubbles.dmPolicy = "pairing"`。
    - 不明な送信者にはペアリングコードが送信されます。承認されるまでメッセージは無視されます（コードは 1 時間後に期限切れになります）。
    - 承認方法:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - ペアリングはデフォルトのトークン交換です。詳細: [ペアリング](/ja-JP/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（デフォルト: `allowlist`）。
    - `channels.bluebubbles.groupAllowFrom` は、`allowlist` が設定されている場合にグループ内で誰がトリガーできるかを制御します。

  </Tab>
</Tabs>

### 連絡先名の補完（macOS、任意）

BlueBubbles のグループ Webhook には、多くの場合、生の参加者アドレスしか含まれません。`GroupMembers` コンテキストに代わりにローカルの連絡先名を表示したい場合は、macOS 上でローカルの連絡先補完を有効化できます。

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` で検索を有効にします。デフォルト: `false`。
- 検索は、グループアクセス、コマンド認可、メンションゲートによってメッセージの通過が許可された後にのみ実行されます。
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

### メンションゲート（グループ）

BlueBubbles は、iMessage/WhatsApp の挙動に合わせたグループチャットのメンションゲートをサポートします。

- メンション検出には `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）を使用します。
- グループで `requireMention` が有効な場合、エージェントはメンションされたときだけ応答します。
- 認可済み送信者からの制御コマンドはメンションゲートを迂回します。

グループごとの設定:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### コマンドゲート

- 制御コマンド（例: `/config`、`/model`）には認可が必要です。
- コマンド認可の判定には `allowFrom` と `groupAllowFrom` を使用します。
- 認可済み送信者は、グループ内でメンションしなくても制御コマンドを実行できます。

### グループごとのシステムプロンプト

`channels.bluebubbles.groups.*` 配下の各エントリは任意の `systemPrompt` 文字列を受け付けます。この値は、そのグループのメッセージを処理する各ターンでエージェントのシステムプロンプトに注入されるため、エージェントプロンプトを編集せずに、グループごとのペルソナや動作ルールを設定できます。

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

キーは、BlueBubbles がグループについて報告する `chatGuid` / `chatIdentifier` / 数値 `chatId` のいずれかと一致します。また `"*"` ワイルドカードエントリは、完全一致がないすべてのグループにデフォルトを提供します（`requireMention` およびグループごとのツールポリシーと同じパターンです）。完全一致は常にワイルドカードより優先されます。DM はこのフィールドを無視します。代わりにエージェントレベルまたはアカウントレベルのプロンプトカスタマイズを使用してください。

#### 実例: スレッド返信と tapback リアクション（Private API）

BlueBubbles Private API を有効にすると、受信メッセージには短いメッセージ ID（例: `[[reply_to:5]]`）が付き、エージェントは `action=reply` を呼び出して特定メッセージにスレッド返信したり、`action=react` を呼び出して tapback を付けたりできます。グループごとの `systemPrompt` は、エージェントに適切なツールを選ばせるための信頼性の高い方法です。

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
        },
      },
    },
  },
}
```

tapback リアクションとスレッド返信はいずれも BlueBubbles Private API が必要です。基盤となる仕組みについては、[高度なアクション](#advanced-actions) と [メッセージ ID](#message-ids-short-vs-full) を参照してください。

## ACP 会話バインディング

BlueBubbles チャットは、トランスポート層を変更せずに永続的な ACP ワークスペースに変換できます。

高速なオペレーターフロー:

- DM または許可済みグループチャット内で `/acp spawn codex --bind here` を実行します。
- 同じ BlueBubbles 会話内の以後のメッセージは、生成された ACP セッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

設定済みの永続バインディングは、`type: "acp"` と `match.channel: "bluebubbles"` を持つトップレベルの `bindings[]` エントリでもサポートされます。

`match.peer.id` には、サポートされている任意の BlueBubbles ターゲット形式を使用できます。

- `+15555550123` や `user@example.com` などの正規化された DM ハンドル
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

共有 ACP バインディングの挙動については、[ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

## 入力中 + 既読通知

- **入力中インジケーター**: 応答生成前および応答生成中に自動送信されます。
- **既読通知**: `channels.bluebubbles.sendReadReceipts` で制御されます（デフォルト: `true`）。
- **入力中インジケーター**: OpenClaw は入力開始イベントを送信します。BlueBubbles は送信時またはタイムアウト時に入力中状態を自動的にクリアします（DELETE による手動停止は信頼できません）。

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## 高度なアクション

BlueBubbles は、設定で有効化されている場合、高度なメッセージアクションをサポートします。

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="利用可能なアクション">
    - **react**: Tapback リアクションを追加または削除します（`messageId`、`emoji`、`remove`）。iMessage のネイティブ Tapback セットは `love`、`like`、`dislike`、`laugh`、`emphasize`、`question` です。エージェントがそのセット外の絵文字（例: `👀`）を選んだ場合、リアクションツールは `love` にフォールバックするため、リクエスト全体を失敗させる代わりに Tapback は引き続き表示されます。設定済みの ack リアクションは引き続き厳密に検証され、不明な値ではエラーになります。
    - **edit**: 送信済みメッセージを編集します（`messageId`、`text`）。
    - **unsend**: メッセージの送信を取り消します（`messageId`）。
    - **reply**: 特定のメッセージに返信します（`messageId`、`text`、`to`）。
    - **sendWithEffect**: iMessage エフェクト付きで送信します（`text`、`to`、`effectId`）。
    - **renameGroup**: グループチャットの名前を変更します（`chatGuid`、`displayName`）。
    - **setGroupIcon**: グループチャットのアイコン/写真を設定します（`chatGuid`、`media`）— macOS 26 Tahoe では不安定です（API が成功を返しても、アイコンが同期されない場合があります）。
    - **addParticipant**: グループに誰かを追加します（`chatGuid`、`address`）。
    - **removeParticipant**: グループから誰かを削除します（`chatGuid`、`address`）。
    - **leaveGroup**: グループチャットから退出します（`chatGuid`）。
    - **upload-file**: メディア/ファイルを送信します（`to`、`buffer`、`filename`、`asVoice`）。
      - ボイスメモ: iMessage の音声メッセージとして送信するには、**MP3** または **CAF** 音声で `asVoice: true` を設定します。BlueBubbles はボイスメモ送信時に MP3 → CAF に変換します。
    - レガシーエイリアス: `sendAttachment` は引き続き動作しますが、`upload-file` が正規のアクション名です。

  </Accordion>
</AccordionGroup>

### メッセージ ID（短縮と完全）

OpenClaw はトークンを節約するために、_短縮_ メッセージ ID（例: `1`、`2`）を表示する場合があります。

- `MessageSid` / `ReplyToId` には短縮 ID を指定できます。
- `MessageSidFull` / `ReplyToIdFull` にはプロバイダーの完全 ID が含まれます。
- 短縮 ID はメモリ内にあります。再起動またはキャッシュ退避で期限切れになることがあります。
- アクションは短縮または完全な `messageId` を受け付けますが、短縮 ID が利用できなくなっている場合はエラーになります。

耐久性のある自動化や保存には完全 ID を使用してください。

- テンプレート: `{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- コンテキスト: 受信ペイロード内の `MessageSidFull` / `ReplyToIdFull`

テンプレート変数については [設定](/ja-JP/gateway/configuration) を参照してください。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 分割送信 DM の統合（1 回の入力内のコマンド + URL）

ユーザーが iMessage でコマンドと URL を一緒に入力した場合（例: `Dump https://example.com/article`）、Apple は送信を**2 つの別々の Webhook 配信**に分割します。

1. テキストメッセージ（`"Dump"`）。
2. URL プレビュー吹き出し（`"https://..."`）。OG プレビュー画像が添付されます。

ほとんどのセットアップでは、2 つの Webhook は約 0.8〜2.0 秒差で OpenClaw に到着します。統合しない場合、エージェントは 1 ターン目でコマンドだけを受け取り、返信し（多くの場合「URL を送って」）、2 ターン目でようやく URL を見ることになります。その時点では、コマンドのコンテキストはすでに失われています。

`channels.bluebubbles.coalesceSameSenderDms` は、連続する同一送信者の Webhook を 1 つのエージェントターンにマージするよう DM をオプトインします。グループチャットは引き続きメッセージごとにキー付けされるため、複数ユーザーのターン構造は保持されます。

<Tabs>
  <Tab title="有効化する場合">
    次の場合に有効化します。

    - 1 つのメッセージ内に `command + payload` を期待する Skills（dump、paste、save、queue など）を提供している。
    - ユーザーが URL、画像、または長いコンテンツをコマンドと一緒に貼り付ける。
    - 追加される DM ターン遅延を許容できる（下記参照）。

    次の場合は無効のままにします。

    - 単語 1 つの DM トリガーで最小のコマンド遅延が必要。
    - すべてのフローがペイロード追従のない 1 回限りのコマンド。

  </Tab>
  <Tab title="有効化">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    フラグがオンで、明示的な `messages.inbound.byChannel.bluebubbles` がない場合、デバウンスウィンドウは **2500 ms** に広がります（非統合時のデフォルトは 500 ms）。この広いウィンドウが必要です。Apple の分割送信間隔 0.8〜2.0 秒は、より短いデフォルトには収まりません。

    ウィンドウを自分で調整するには:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="トレードオフ">
    - **DM 制御コマンドの遅延が追加されます。** フラグがオンの場合、DM 制御コマンドメッセージ（`Dump`、`Save` など）は、ペイロード Webhook が来る可能性があるため、ディスパッチ前に最大でデバウンスウィンドウまで待機するようになります。グループチャットのコマンドは即時ディスパッチのままです。
    - **マージされた出力には上限があります** — マージされたテキストは明示的な `…[truncated]` マーカー付きで 4000 文字まで、添付は 20 件まで、ソースエントリは 10 件までです（それを超える場合は最初と最新が保持されます）。各ソースの `messageId` は引き続き受信重複排除に到達するため、後から MessagePoller が個別イベントを再生しても重複として認識されます。
    - **チャンネルごとのオプトインです。** 他のチャンネル（Telegram、WhatsApp、Slack、…）には影響しません。

  </Tab>
</Tabs>

### シナリオとエージェントが見る内容

| ユーザーの入力                                                      | Apple の配信            | フラグオフ（デフォルト）                      | フラグオン + 2500 ms ウィンドウ                                                |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（1 回の送信）                              | 約 1 秒差の 2 Webhook     | 2 つのエージェントターン: "Dump" のみ、その後 URL | 1 ターン: マージされたテキスト `Dump https://example.com`                        |
| `Save this 📎image.jpg caption`（添付 + テキスト）                | 2 Webhook                | 2 ターン                               | 1 ターン: テキスト + 画像                                                  |
| `/status`（単独コマンド）                                     | 1 Webhook                 | 即時ディスパッチ                        | **最大でウィンドウまで待機してからディスパッチ**                                    |
| URL のみを貼り付け                                                   | 1 Webhook                 | 即時ディスパッチ                        | 即時ディスパッチ（バケット内に 1 エントリのみ）                             |
| テキスト + URL を意図的に別々のメッセージとして数分差で送信 | ウィンドウ外の 2 Webhook | 2 ターン                               | 2 ターン（間でウィンドウが期限切れ）                                 |
| 短時間の大量送信（ウィンドウ内で 10 件超の小さい DM）                          | N Webhook                | N ターン                                 | 1 ターン、上限付き出力（最初 + 最新、テキスト/添付上限を適用） |

### 分割送信統合のトラブルシューティング

フラグがオンでも分割送信が 2 ターンとして届く場合は、各レイヤーを確認してください。

<AccordionGroup>
  <Accordion title="設定が実際に読み込まれている">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    その後 `openclaw gateway restart` を実行します。このフラグは debouncer-registry 作成時に読み込まれます。

  </Accordion>
  <Accordion title="デバウンスウィンドウがセットアップに対して十分広い">
    `~/Library/Logs/bluebubbles-server/main.log` にある BlueBubbles サーバーログを確認します。

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    `"Dump"` のようなテキストディスパッチと、その後に続く `"https://..."; Attachments:` ディスパッチの間隔を測定します。その間隔を十分にカバーできるように `messages.inbound.byChannel.bluebubbles` を増やします。

  </Accordion>
  <Accordion title="セッション JSONL タイムスタンプ ≠ Webhook 到着">
    セッションイベントのタイムスタンプ（`~/.openclaw/agents/<id>/sessions/*.jsonl`）は、Gateway がメッセージをエージェントへ渡した時刻を反映します。Webhook が到着した時刻では**ありません**。`[Queued messages while agent was busy]` とタグ付けされたキュー済みの 2 番目のメッセージは、2 番目の Webhook が到着した時点で 1 ターン目がまだ実行中だったことを意味します。統合バケットはすでにフラッシュ済みでした。セッションログではなく BB サーバーログに合わせてウィンドウを調整してください。
  </Accordion>
  <Accordion title="メモリ圧迫により返信ディスパッチが遅い">
    小さめのマシン（8 GB）では、エージェントターンに時間がかかり、返信完了前に統合バケットがフラッシュされ、URL がキュー済みの 2 番目のターンとして入ることがあります。`memory_pressure` と `ps -o rss -p $(pgrep openclaw-gateway)` を確認してください。Gateway が約 500 MB RSS を超えていてコンプレッサーがアクティブな場合は、他の重いプロセスを閉じるか、より大きなホストに変更してください。
  </Accordion>
  <Accordion title="返信引用送信は別の経路">
    ユーザーが既存の URL 吹き出しへの**返信**として `Dump` をタップした場合（iMessage では Dump の吹き出しに「1 Reply」バッジが表示されます）、URL は 2 番目の Webhook ではなく `replyToBody` にあります。統合は適用されません。これはデバウンサーの関心事ではなく、Skill/プロンプトの関心事です。
  </Accordion>
</AccordionGroup>

## ブロックストリーミング

応答を単一メッセージとして送信するか、ブロックでストリーミングするかを制御します。

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## メディア + 制限

- 受信添付ファイルはダウンロードされ、メディアキャッシュに保存されます。
- 受信および送信メディアには `channels.bluebubbles.mediaMaxMb` によるメディア上限があります（デフォルト: 8 MB）。
- 送信テキストは `channels.bluebubbles.textChunkLimit` に分割されます（デフォルト: 4000 文字）。

## 設定リファレンス

完全な設定: [設定](/ja-JP/gateway/configuration)

<AccordionGroup>
  <Accordion title="接続と Webhook">
    - `channels.bluebubbles.enabled`: チャンネルを有効/無効にします。
    - `channels.bluebubbles.serverUrl`: BlueBubbles REST API ベース URL。
    - `channels.bluebubbles.password`: API パスワード。
    - `channels.bluebubbles.webhookPath`: Webhook エンドポイントパス（デフォルト: `/bluebubbles-webhook`）。

  </Accordion>
  <Accordion title="アクセスポリシー">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。
    - `channels.bluebubbles.allowFrom`: DM 許可リスト（ハンドル、メール、E.164 番号、`chat_id:*`、`chat_guid:*`）。
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled`（デフォルト: `allowlist`）。
    - `channels.bluebubbles.groupAllowFrom`: グループ送信者許可リスト。
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS では、ゲート通過後にローカルの連絡先から名前のないグループ参加者を任意で補完します。デフォルト: `false`。
    - `channels.bluebubbles.groups`: グループごとの設定（`requireMention` など）。

  </Accordion>
  <Accordion title="配信とチャンク分割">
    - `channels.bluebubbles.sendReadReceipts`: 開封確認を送信します (デフォルト: `true`)。
    - `channels.bluebubbles.blockStreaming`: ブロックストリーミングを有効にします (デフォルト: `false`; ストリーミング返信に必要)。
    - `channels.bluebubbles.textChunkLimit`: 送信チャンクサイズを文字数で指定します (デフォルト: 4000)。
    - `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` 経由の送信テキスト送信に対するリクエストごとのタイムアウトをミリ秒で指定します (デフォルト: 30000)。macOS 26 環境で、Private API による iMessage 送信が iMessage フレームワーク内で 60 秒以上停止する場合は、例えば `45000` や `60000` に引き上げてください。プローブ、チャット検索、リアクション、編集、ヘルスチェックは現在、より短いデフォルトの 10 秒を維持しています。リアクションと編集への対象拡大はフォローアップとして計画されています。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
    - `channels.bluebubbles.chunkMode`: `length` (デフォルト) は `textChunkLimit` を超えた場合にのみ分割します。`newline` は長さによるチャンク分割の前に空行 (段落境界) で分割します。

  </Accordion>
  <Accordion title="メディアと履歴">
    - `channels.bluebubbles.mediaMaxMb`: 受信/送信メディアの上限を MB で指定します (デフォルト: 8)。
    - `channels.bluebubbles.mediaLocalRoots`: 送信用ローカルメディアパスとして許可する絶対ローカルディレクトリの明示的な許可リストです。これが設定されていない限り、ローカルパス送信はデフォルトで拒否されます。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
    - `channels.bluebubbles.coalesceSameSenderDms`: 同じ送信者から連続して届く DM Webhook を 1 つのエージェントターンにまとめ、Apple のテキスト+URL 分割送信が 1 件のメッセージとして届くようにします (デフォルト: `false`)。シナリオ、ウィンドウ調整、トレードオフについては [分割送信 DM の結合](#coalescing-split-send-dms-command--url-in-one-composition) を参照してください。明示的な `messages.inbound.byChannel.bluebubbles` なしで有効化すると、デフォルトの受信デバウンスウィンドウが 500 ms から 2500 ms に広がります。
    - `channels.bluebubbles.historyLimit`: コンテキスト用のグループメッセージ最大数です (0 で無効化)。
    - `channels.bluebubbles.dmHistoryLimit`: DM 履歴の上限です。
    - `channels.bluebubbles.replyContextApiFallback`: 受信返信に `replyToBody`/`replyToSender` がなく、メモリ内の返信コンテキストキャッシュもミスした場合に、ベストエフォートのフォールバックとして BlueBubbles HTTP API から元メッセージを取得します (デフォルト: `false`)。1 つの BlueBubbles アカウントを共有する複数インスタンスのデプロイ、プロセス再起動後、または長寿命の TTL/LRU キャッシュ退避後に有用です。この取得は、他のすべての BlueBubbles クライアントリクエストと同じポリシーで SSRF から保護され、例外を投げず、キャッシュを埋めるため後続の返信でコストをならせます。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`。チャンネルレベルの設定は、このフラグを省略したアカウントに伝播します。

  </Accordion>
  <Accordion title="アクションとアカウント">
    - `channels.bluebubbles.actions`: 特定のアクションを有効化/無効化します。
    - `channels.bluebubbles.accounts`: 複数アカウント設定です。

  </Accordion>
</AccordionGroup>

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns` (または `messages.groupChat.mentionPatterns`)。
- `messages.responsePrefix`。

## アドレス指定 / 配信先

安定したルーティングには `chat_guid` を優先してください:

- `chat_guid:iMessage;-;+15555550123` (グループに推奨)
- `chat_id:123`
- `chat_identifier:...`
- 直接ハンドル: `+15555550123`, `user@example.com`
  - 直接ハンドルに既存の DM チャットがない場合、OpenClaw は `POST /api/v1/chat/new` で作成します。これには BlueBubbles Private API が有効である必要があります。

### iMessage と SMS のルーティング

同じハンドルに、Mac 上で iMessage チャットと SMS チャットの両方がある場合 (例えば iMessage に登録済みの電話番号が、緑の吹き出しのフォールバックも受信している場合)、OpenClaw は iMessage チャットを優先し、黙って SMS にダウングレードすることはありません。SMS チャットを強制するには、明示的な `sms:` ターゲットプレフィックスを使用してください (例: `sms:+15555550123`)。一致する iMessage チャットがないハンドルは、BlueBubbles が報告する任意のチャット経由で送信されます。

## セキュリティ

- Webhook リクエストは、`guid`/`password` クエリパラメータまたはヘッダーを `channels.bluebubbles.password` と比較して認証されます。
- API パスワードと Webhook エンドポイントは秘密にしてください (認証情報と同様に扱ってください)。
- BlueBubbles Webhook 認証に localhost バイパスはありません。Webhook トラフィックをプロキシする場合は、リクエストのエンドツーエンドで BlueBubbles パスワードを保持してください。ここでは `gateway.trustedProxies` は `channels.bluebubbles.password` の代わりにはなりません。[Gateway セキュリティ](/ja-JP/gateway/security#reverse-proxy-configuration) を参照してください。
- BlueBubbles サーバーを LAN 外に公開する場合は、HTTPS とファイアウォールルールを有効にしてください。

## トラブルシューティング

- 入力中/既読イベントが動作しなくなった場合は、BlueBubbles Webhook ログを確認し、Gateway パスが `channels.bluebubbles.webhookPath` と一致していることを確認してください。
- ペアリングコードは 1 時間後に期限切れになります。`openclaw pairing list bluebubbles` と `openclaw pairing approve bluebubbles <code>` を使用してください。
- リアクションには BlueBubbles private API (`POST /api/v1/message/react`) が必要です。サーバーバージョンがそれを公開していることを確認してください。
- 編集/送信取り消しには macOS 13+ と互換性のある BlueBubbles サーバーバージョンが必要です。macOS 26 (Tahoe) では、private API の変更により編集は現在壊れています。
- グループアイコンの更新は macOS 26 (Tahoe) で不安定になることがあります。API が成功を返しても、新しいアイコンが同期されない場合があります。
- OpenClaw は、BlueBubbles サーバーの macOS バージョンに基づいて、既知の壊れているアクションを自動的に非表示にします。macOS 26 (Tahoe) で編集がまだ表示される場合は、`channels.bluebubbles.actions.edit=false` で手動で無効化してください。
- `coalesceSameSenderDms` が有効でも分割送信 (例: `Dump` + URL) が 2 つのターンとして届く場合は、[分割送信結合のトラブルシューティング](#split-send-coalescing-troubleshooting) チェックリストを参照してください。一般的な原因は、デバウンスウィンドウが短すぎる、セッションログのタイムスタンプを Webhook 到着時刻と誤読している、または返信引用送信 (`replyToBody` を使用し、2 つ目の Webhook ではない) です。
- ステータス/ヘルス情報: `openclaw status --all` または `openclaw status --deep`。

一般的なチャンネルワークフローのリファレンスについては、[チャンネル](/ja-JP/channels) と [Plugins](/ja-JP/tools/plugin) ガイドを参照してください。

## 関連

- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [チャンネル概要](/ja-JP/channels) — 対応するすべてのチャンネル
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
