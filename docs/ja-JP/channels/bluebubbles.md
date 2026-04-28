---
read_when:
    - BlueBubblesチャンネルの設定
    - Webhookペアリングのトラブルシューティング
    - macOSでのiMessageの設定
sidebarTitle: BlueBubbles
summary: BlueBubbles macOSサーバー経由のiMessage（REST送受信、入力中表示、リアクション、ペアリング、高度なアクション）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-26T11:23:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a9eef02110f9e40f60c0bbd413c7ad7e33c377a7cf9ca2ae43aa170100ff77
    source_path: channels/bluebubbles.md
    workflow: 15
---

ステータス: HTTP経由でBlueBubbles macOSサーバーと通信する同梱Plugin。レガシーのimsgチャンネルと比べてAPIがより豊富で設定も簡単なため、**iMessage連携に推奨**されています。

<Note>
現在のOpenClawリリースにはBlueBubblesが同梱されているため、通常のパッケージ版ビルドでは別途 `openclaw plugins install` の手順は不要です。
</Note>

## 概要

- BlueBubblesヘルパーアプリ（[bluebubbles.app](https://bluebubbles.app)）を使ってmacOS上で動作します。
- 推奨/テスト済み: macOS Sequoia (15)。macOS Tahoe (26)でも動作しますが、現時点ではTahoeで編集機能は壊れており、グループアイコンの更新は成功と表示されても同期されない場合があります。
- OpenClawはREST API（`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`）を通じてこれと通信します。
- 受信メッセージはWebhook経由で届きます。送信返信、入力中インジケーター、開封確認、tapbackはREST呼び出しです。
- 添付ファイルとステッカーは受信メディアとして取り込まれ、可能な場合はエージェントにも渡されます。
- MP3またはCAF音声を合成する自動TTS返信は、通常のファイル添付ではなくiMessageのボイスメモバブルとして配信されます。
- ペアリング/許可リストは他のチャンネルと同じように動作します（`/channels/pairing` など）。`channels.bluebubbles.allowFrom` とペアリングコードを使用します。
- リアクションは、Slack/Telegramと同様にシステムイベントとして表現されるため、エージェントは返信前にそれらを「メンション」できます。
- 高度な機能: 編集、送信取り消し、返信スレッド、メッセージエフェクト、グループ管理。

## クイックスタート

<Steps>
  <Step title="BlueBubblesをインストール">
    MacにBlueBubblesサーバーをインストールします（[bluebubbles.app/install](https://bluebubbles.app/install) の手順に従ってください）。
  </Step>
  <Step title="Web APIを有効化">
    BlueBubblesの設定でWeb APIを有効にし、パスワードを設定します。
  </Step>
  <Step title="OpenClawを設定">
    `openclaw onboard` を実行してBlueBubblesを選択するか、手動で設定します:

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
  <Step title="WebhookをGatewayに向ける">
    BlueBubblesのWebhookをGatewayに向けます（例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
  </Step>
  <Step title="Gatewayを起動">
    Gatewayを起動します。Webhookハンドラーが登録され、ペアリングが開始されます。
  </Step>
</Steps>

<Warning>
**セキュリティ**

- 必ずWebhookパスワードを設定してください。
- Webhook認証は常に必須です。OpenClawは、loopback/proxyの構成にかかわらず、`channels.bluebubbles.password` に一致するpassword/guid（たとえば `?password=<password>` または `x-password`）が含まれていない限り、BlueBubblesのWebhookリクエストを拒否します。
- パスワード認証は、Webhook本文全体を読み取り/解析する前に確認されます。

</Warning>

## Messages.appを生かしておく（VM / ヘッドレス構成）

一部のmacOS VM / 常時稼働構成では、Messages.appが「アイドル」状態になり（アプリを開くか前面に出すまで受信イベントが止まる）、問題が起きることがあります。簡単な回避策は、AppleScript + LaunchAgentを使って**5分ごとにMessagesを軽く刺激する**ことです。

<Steps>
  <Step title="AppleScriptを保存">
    これを `~/Scripts/poke-messages.scpt` として保存します:

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
  <Step title="LaunchAgentをインストール">
    これを `~/Library/LaunchAgents/com.user.poke-messages.plist` として保存します:

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

    これは**300秒ごと**と**ログイン時**に実行されます。初回実行時にはmacOSの**Automation**プロンプト（`osascript` → Messages）が表示される場合があります。LaunchAgentを実行する同じユーザーセッションで許可してください。

  </Step>
  <Step title="読み込む">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## オンボーディング

BlueBubblesは対話型オンボーディングで利用できます:

```
openclaw onboard
```

ウィザードでは以下を求められます:

<ParamField path="Server URL" type="string" required>
  BlueBubblesサーバーのアドレス（例: `http://192.168.1.100:1234`）。
</ParamField>
<ParamField path="Password" type="string" required>
  BlueBubblesサーバー設定のAPIパスワード。
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Webhookエンドポイントのパス。
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open`, または `disabled`。
</ParamField>
<ParamField path="Allow list" type="string[]">
  電話番号、メールアドレス、またはチャットターゲット。
</ParamField>

CLIからBlueBubblesを追加することもできます:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## アクセス制御（DM + グループ）

<Tabs>
  <Tab title="DM">
    - デフォルト: `channels.bluebubbles.dmPolicy = "pairing"`。
    - 未知の送信者にはペアリングコードが送られます。承認されるまでメッセージは無視されます（コードの有効期限は1時間です）。
    - 承認方法:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - ペアリングがデフォルトのトークン交換です。詳細: [Pairing](/ja-JP/channels/pairing)

  </Tab>
  <Tab title="グループ">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（デフォルト: `allowlist`）。
    - `channels.bluebubbles.groupAllowFrom` は、`allowlist` が設定されているときに、グループ内で誰がトリガーできるかを制御します。

  </Tab>
</Tabs>

### 連絡先名の補完（macOS、任意）

BlueBubblesのグループWebhookには、生の参加者アドレスしか含まれないことがよくあります。代わりに `GroupMembers` コンテキストにローカルの連絡先名を表示したい場合は、macOSでローカルContacts補完を有効にできます:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` で検索を有効化します。デフォルト: `false`。
- 検索は、グループアクセス、コマンド認可、メンションゲーティングによってそのメッセージが許可された後にのみ実行されます。
- 名前のない電話参加者のみが補完されます。
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

### メンションゲーティング（グループ）

BlueBubblesはグループチャットのメンションゲーティングをサポートしており、iMessage/WhatsAppと同じ動作になります:

- メンションの検出には `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）を使用します。
- グループで `requireMention` が有効な場合、エージェントはメンションされたときだけ応答します。
- 認可された送信者からの制御コマンドはメンションゲーティングをバイパスします。

グループごとの設定:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // すべてのグループのデフォルト
        "iMessage;-;chat123": { requireMention: false }, // 特定グループの上書き
      },
    },
  },
}
```

### コマンドゲーティング

- 制御コマンド（例: `/config`, `/model`）には認可が必要です。
- コマンド認可の判定には `allowFrom` と `groupAllowFrom` を使用します。
- 認可された送信者は、グループ内でメンションがなくても制御コマンドを実行できます。

### グループごとのシステムプロンプト

`channels.bluebubbles.groups.*` 配下の各エントリーでは、任意の `systemPrompt` 文字列を受け付けます。この値は、そのグループ内のメッセージを処理する各ターンでエージェントのシステムプロンプトに注入されるため、エージェントのプロンプトを編集せずに、グループごとの人格や振る舞いのルールを設定できます:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "応答は3文以内にしてください。グループのカジュアルな口調に合わせてください。",
        },
      },
    },
  },
}
```

このキーは、BlueBubblesがそのグループに対して `chatGuid` / `chatIdentifier` / 数値の `chatId` として報告するものに一致します。また `"*"` ワイルドカードエントリーを使うと、完全一致しないすべてのグループに対するデフォルトを設定できます（`requireMention` やグループごとのツールポリシーと同じパターンです）。完全一致は常にワイルドカードより優先されます。DMではこのフィールドは無視されます。代わりに、エージェントレベルまたはアカウントレベルのプロンプトカスタマイズを使用してください。

#### 実例: スレッド返信とtapbackリアクション（Private API）

BlueBubbles Private APIを有効にすると、受信メッセージには短いメッセージID（たとえば `[[reply_to:5]]`）が付いて届き、エージェントは `action=reply` を呼び出して特定のメッセージにスレッド返信したり、`action=react` を呼び出してtapbackを付けたりできます。グループごとの `systemPrompt` は、エージェントに適切なツールを選ばせるための信頼できる方法です:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "このグループで返信するときは、必ずコンテキスト内の",
            "[[reply_to:N]] messageId を使って action=reply を呼び出し、",
            "応答がトリガーとなったメッセージの下にスレッドされるようにしてください。新しい未リンクのメッセージは送信しないでください。",
            "",
            "短い確認応答（「ok」「了解」「対応します」）には、",
            "テキスト返信を送る代わりに、適切なtapback絵文字（❤️, 👍, 😂, ‼️, ❓）で",
            "action=react を使用してください。",
          ].join(" "),
        },
      },
    },
  },
}
```

tapbackリアクションとスレッド返信はどちらもBlueBubbles Private APIが必要です。基礎となる仕組みについては、[高度なアクション](#advanced-actions) と [Message IDs](#message-ids-short-vs-full) を参照してください。

## ACP会話バインディング

BlueBubblesチャットは、トランスポート層を変更せずに永続的なACPワークスペースへ変換できます。

素早いオペレーター手順:

- DMまたは許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 以後、同じBlueBubbles会話内のメッセージは、起動したACPセッションへルーティングされます。
- `/new` と `/reset` は、同じバインド済みACPセッションをその場でリセットします。
- `/acp close` はACPセッションを終了し、バインディングを削除します。

設定済みの永続バインディングも、トップレベルの `bindings[]` エントリーで `type: "acp"` と `match.channel: "bluebubbles"` を使ってサポートされます。

`match.peer.id` には、サポートされる任意のBlueBubblesターゲット形式を使用できます:

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

共有ACPバインディングの動作については、[ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

## 入力中表示 + 開封確認

- **入力中インジケーター**: 応答生成の前および生成中に自動送信されます。
- **開封確認**: `channels.bluebubbles.sendReadReceipts` で制御します（デフォルト: `true`）。
- **入力中インジケーター**: OpenClawは入力開始イベントを送信します。BlueBubblesは送信時またはタイムアウト時に自動で入力中状態を解除します（DELETEによる手動停止は信頼できません）。

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // 開封確認を無効化
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
        renameGroup: true, // グループチャット名の変更
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

<AccordionGroup>
  <Accordion title="利用可能なアクション">
    - **react**: tapbackリアクションを追加/削除します（`messageId`, `emoji`, `remove`）。iMessageネイティブのtapbackセットは `love`, `like`, `dislike`, `laugh`, `emphasize`, `question` です。エージェントがそのセット外の絵文字（たとえば `👀`）を選んだ場合、リアクションツールは `love` にフォールバックするため、リクエスト全体が失敗する代わりにtapbackは引き続き表示されます。設定済みの確認リアクションは引き続き厳密に検証され、未知の値ではエラーになります。
    - **edit**: 送信済みメッセージを編集します（`messageId`, `text`）。
    - **unsend**: メッセージの送信を取り消します（`messageId`）。
    - **reply**: 特定のメッセージに返信します（`messageId`, `text`, `to`）。
    - **sendWithEffect**: iMessageエフェクト付きで送信します（`text`, `to`, `effectId`）。
    - **renameGroup**: グループチャット名を変更します（`chatGuid`, `displayName`）。
    - **setGroupIcon**: グループチャットのアイコン/写真を設定します（`chatGuid`, `media`）— macOS 26 Tahoeでは不安定です（APIは成功を返してもアイコンが同期されない場合があります）。
    - **addParticipant**: グループに参加者を追加します（`chatGuid`, `address`）。
    - **removeParticipant**: グループから参加者を削除します（`chatGuid`, `address`）。
    - **leaveGroup**: グループチャットから退出します（`chatGuid`）。
    - **upload-file**: メディア/ファイルを送信します（`to`, `buffer`, `filename`, `asVoice`）。
      - ボイスメモ: **MP3** または **CAF** 音声に `asVoice: true` を設定すると、iMessageの音声メッセージとして送信できます。BlueBubblesはボイスメモ送信時にMP3 → CAFへ変換します。
    - レガシーエイリアス: `sendAttachment` も引き続き動作しますが、正式なアクション名は `upload-file` です。

  </Accordion>
</AccordionGroup>

### Message IDs（短縮版と完全版）

OpenClawは、トークン節約のために_短縮_メッセージID（例: `1`, `2`）を表示することがあります。

- `MessageSid` / `ReplyToId` には短縮IDが入る場合があります。
- `MessageSidFull` / `ReplyToIdFull` にはプロバイダーの完全IDが入ります。
- 短縮IDはインメモリです。再起動やキャッシュ削除で失効することがあります。
- アクションは短縮または完全な `messageId` を受け付けますが、短縮IDは利用できなくなっているとエラーになります。

永続的な自動化や保存には完全IDを使用してください:

- テンプレート: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- コンテキスト: 受信ペイロード内の `MessageSidFull` / `ReplyToIdFull`

テンプレート変数については [Configuration](/ja-JP/gateway/configuration) を参照してください。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 分割送信DMの結合（1回の入力内のコマンド + URL）

ユーザーがiMessageでコマンドとURLを一緒に入力した場合 — たとえば `Dump https://example.com/article` — Appleは送信を**2つの別々のWebhook配信**に分割します:

1. テキストメッセージ（`"Dump"`）。
2. OGプレビュー画像を添付したURLプレビューバルーン（`"https://..."`）。

多くの構成では、これら2つのWebhookは約0.8〜2.0秒差でOpenClawに到着します。結合しない場合、エージェントは1ターン目でコマンド単体を受け取り、返信し（多くの場合「URLを送ってください」）、2ターン目でようやくURLを見ます。この時点ではコマンド文脈はすでに失われています。

`channels.bluebubbles.coalesceSameSenderDms` は、同じ送信者から連続して届くWebhookを1つのエージェントターンにまとめるようDMをオプトインさせます。グループチャットは引き続きメッセージ単位でキー付けされるため、複数ユーザーのターン構造は保持されます。

<Tabs>
  <Tab title="有効にするタイミング">
    次の場合に有効にしてください:

    - 1つのメッセージ内で `command + payload` を想定するSkills（dump、paste、save、queue など）を提供している。
    - ユーザーがコマンドと一緒にURL、画像、長い内容を貼り付ける。
    - DMターンの追加レイテンシーを許容できる（下記参照）。

    次の場合は無効のままにしてください:

    - 単語1つのDMトリガーで最小のコマンドレイテンシーが必要。
    - すべてのフローが、後続payloadを伴わない単発コマンドである。

  </Tab>
  <Tab title="有効化">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // オプトイン（デフォルト: false）
        },
      },
    }
    ```

    このフラグがオンで、明示的な `messages.inbound.byChannel.bluebubbles` がない場合、デバウンスウィンドウは **2500 ms** に広がります（非結合時のデフォルトは500 ms）。この広いウィンドウが必要です — Appleの0.8〜2.0秒の分割送信ペースは、より短いデフォルトには収まりません。

    ウィンドウを自分で調整するには:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 msは多くの構成で機能します。Macが遅い場合
            // またはメモリ圧迫下にある場合は4000 msまで上げてください
            // （その場合、観測される間隔が2秒を超えて伸びることがあります）。
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="トレードオフ">
    - **DM制御コマンドのレイテンシーが増加します。** このフラグがオンの場合、DMの制御コマンドメッセージ（`Dump`、`Save` など）は、payloadのWebhookが続いて来る可能性があるため、ディスパッチ前に最大でデバウンスウィンドウ分待機します。グループチャットのコマンドは即時ディスパッチのままです。
    - **結合出力には上限があります** — 結合されたテキストは4000文字で打ち切られ、明示的な `…[truncated]` マーカーが付きます。添付ファイルは20件、ソースエントリーは10件で上限です（それを超える場合は最初と最新を保持）。各ソース `messageId` は引き続き受信重複排除に渡されるため、後から個別イベントがMessagePollerで再生されても重複として認識されます。
    - **チャンネル単位のオプトインです。** 他のチャンネル（Telegram、WhatsApp、Slack、…）には影響しません。

  </Tab>
</Tabs>

### シナリオとエージェントから見えるもの

| ユーザーの入力内容                                                 | Appleの配信内容          | フラグオフ（デフォルト）                | フラグオン + 2500 msウィンドウ                                            |
| ------------------------------------------------------------------ | ------------------------ | --------------------------------------- | ------------------------------------------------------------------------- |
| `Dump https://example.com`（1回で送信）                            | 約1秒差で2つのWebhook    | 2つのエージェントターン: 「Dump」のみ、その後URL | 1ターン: 結合されたテキスト `Dump https://example.com`                    |
| `Save this 📎image.jpg caption`（添付 + テキスト）                 | 2つのWebhook             | 2ターン                                 | 1ターン: テキスト + 画像                                                  |
| `/status`（単独コマンド）                                          | 1つのWebhook             | 即時ディスパッチ                        | **ウィンドウ時間まで待機してからディスパッチ**                            |
| URL単体の貼り付け                                                  | 1つのWebhook             | 即時ディスパッチ                        | 即時ディスパッチ（バケット内のエントリーが1件だけ）                       |
| テキスト + URLを意図的に数分空けて別メッセージとして送信           | ウィンドウ外で2つのWebhook | 2ターン                                 | 2ターン（その間にウィンドウが期限切れになる）                             |
| 高速な連投（ウィンドウ内で10件超の小さなDM）                       | N個のWebhook             | Nターン                                 | 1ターン、上限制限付き出力（先頭 + 最新、テキスト/添付上限を適用）         |

### 分割送信結合のトラブルシューティング

フラグがオンなのに分割送信がまだ2ターンで届く場合は、各レイヤーを確認してください:

<AccordionGroup>
  <Accordion title="設定が実際に読み込まれている">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    その後 `openclaw gateway restart` を実行してください — このフラグはdebouncer-registry作成時に読み込まれます。

  </Accordion>
  <Accordion title="デバウンスウィンドウがその構成に対して十分に広い">
    `~/Library/Logs/bluebubbles-server/main.log` のBlueBubblesサーバーログを確認してください:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    `"Dump"` スタイルのテキスト配信と、その後に続く `"https://..."; Attachments:` 配信との間隔を測定します。その間隔を十分にカバーできるように `messages.inbound.byChannel.bluebubbles` を引き上げてください。

  </Accordion>
  <Accordion title="セッションJSONLのタイムスタンプ ≠ Webhook到着時刻">
    セッションイベントのタイムスタンプ（`~/.openclaw/agents/<id>/sessions/*.jsonl`）は、Webhookが到着した時刻ではなく、Gatewayがメッセージをエージェントへ渡した時刻を反映します。2つ目のメッセージに `[Queued messages while agent was busy]` が付いている場合、2つ目のWebhookが到着したときに1ターン目がまだ実行中だったことを意味します — 結合バケットはすでにフラッシュ済みでした。ウィンドウ調整にはセッションログではなくBBサーバーログを使ってください。
  </Accordion>
  <Accordion title="メモリ圧迫で返信ディスパッチが遅くなっている">
    小さめのマシン（8 GB）では、エージェントターンが長引きすぎて、返信完了前に結合バケットがフラッシュされ、URLがキューされた2ターン目として到着することがあります。`memory_pressure` と `ps -o rss -p $(pgrep openclaw-gateway)` を確認してください。Gatewayが約500 MB RSSを超えていて圧縮処理が動作している場合は、他の重いプロセスを閉じるか、より大きなホストに移してください。
  </Accordion>
  <Accordion title="返信引用送信は別経路です">
    ユーザーが既存のURLバルーンへの**返信**として `Dump` をタップした場合（iMessageではDumpバブルに「1 Reply」バッジが表示されます）、URLは2つ目のWebhookではなく `replyToBody` に入ります。結合は適用されません — これはdebouncerの問題ではなく、skill/promptの関心事です。
  </Accordion>
</AccordionGroup>

## ブロックストリーミング

応答を単一メッセージとして送るか、ブロック単位でストリーミング送信するかを制御します:

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
- 受信/送信メディアの上限は `channels.bluebubbles.mediaMaxMb` で設定します（デフォルト: 8 MB）。
- 送信テキストは `channels.bluebubbles.textChunkLimit` でチャンク分割されます（デフォルト: 4000文字）。

## 設定リファレンス

完全な設定: [Configuration](/ja-JP/gateway/configuration)

<AccordionGroup>
  <Accordion title="接続とWebhook">
    - `channels.bluebubbles.enabled`: チャンネルの有効/無効。
    - `channels.bluebubbles.serverUrl`: BlueBubbles REST APIのベースURL。
    - `channels.bluebubbles.password`: APIパスワード。
    - `channels.bluebubbles.webhookPath`: Webhookエンドポイントのパス（デフォルト: `/bluebubbles-webhook`）。

  </Accordion>
  <Accordion title="アクセスポリシー">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。
    - `channels.bluebubbles.allowFrom`: DM許可リスト（handle、メール、E.164番号、`chat_id:*`、`chat_guid:*`）。
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled`（デフォルト: `allowlist`）。
    - `channels.bluebubbles.groupAllowFrom`: グループ送信者の許可リスト。
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS上で、ゲーティング通過後に名前のないグループ参加者をローカルContactsから任意で補完します。デフォルト: `false`。
    - `channels.bluebubbles.groups`: グループごとの設定（`requireMention` など）。

  </Accordion>
  <Accordion title="配信とチャンク分割">
    - `channels.bluebubbles.sendReadReceipts`: 開封確認を送信します（デフォルト: `true`）。
    - `channels.bluebubbles.blockStreaming`: ブロックストリーミングを有効化します（デフォルト: `false`。ストリーミング返信に必要）。
    - `channels.bluebubbles.textChunkLimit`: 送信チャンクサイズ（文字数、デフォルト: 4000）。
    - `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` 経由で送信テキストを送る際のリクエストごとのタイムアウト（ms、デフォルト: 30000）。macOS 26環境でPrivate APIのiMessage送信がiMessageフレームワーク内で60秒超停止することがある場合は、たとえば `45000` や `60000` に引き上げてください。現在、プローブ、チャット検索、リアクション、編集、ヘルスチェックは引き続き短い10秒デフォルトを使います。リアクションと編集まで対象を広げるのは今後のフォローアップで予定されています。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
    - `channels.bluebubbles.chunkMode`: `length`（デフォルト）は `textChunkLimit` を超えた場合のみ分割します。`newline` は長さによる分割の前に空行（段落境界）で分割します。

  </Accordion>
  <Accordion title="メディアと履歴">
    - `channels.bluebubbles.mediaMaxMb`: 受信/送信メディアの上限サイズ（MB、デフォルト: 8）。
    - `channels.bluebubbles.mediaLocalRoots`: 送信するローカルメディアパスとして許可される絶対ローカルディレクトリーの明示的な許可リスト。これが設定されていない限り、ローカルパス送信はデフォルトで拒否されます。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
    - `channels.bluebubbles.coalesceSameSenderDms`: 同じ送信者から連続するDM Webhookを1つのエージェントターンに結合し、Appleのテキスト+URL分割送信を1つのメッセージとして届かせます（デフォルト: `false`）。シナリオ、ウィンドウ調整、トレードオフについては [分割送信DMの結合](#coalescing-split-send-dms-command--url-in-one-composition) を参照してください。明示的な `messages.inbound.byChannel.bluebubbles` がない状態で有効化すると、デフォルトの受信デバウンスウィンドウは500 msから2500 msに広がります。
    - `channels.bluebubbles.historyLimit`: コンテキスト用のグループメッセージ最大数（0で無効）。
    - `channels.bluebubbles.dmHistoryLimit`: DM履歴上限。

  </Accordion>
  <Accordion title="アクションとアカウント">
    - `channels.bluebubbles.actions`: 個別アクションの有効/無効。
    - `channels.bluebubbles.accounts`: 複数アカウント設定。

  </Accordion>
</AccordionGroup>

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。

## アドレッシング / 配信ターゲット

安定したルーティングには `chat_guid` を推奨します:

- `chat_guid:iMessage;-;+15555550123`（グループでは推奨）
- `chat_id:123`
- `chat_identifier:...`
- 直接handle: `+15555550123`, `user@example.com`
  - 直接handleに既存のDMチャットがない場合、OpenClawは `POST /api/v1/chat/new` を使って新規作成します。これにはBlueBubbles Private APIを有効にしておく必要があります。

### iMessageとSMSのルーティング

同じhandleに対してMac上にiMessageチャットとSMSチャットの両方がある場合（たとえばiMessage登録済みの電話番号が、緑バブルのフォールバックも受信している場合）、OpenClawはiMessageチャットを優先し、黙ってSMSへダウングレードすることはありません。SMSチャットを強制したい場合は、明示的な `sms:` ターゲット接頭辞（例: `sms:+15555550123`）を使ってください。一致するiMessageチャットがないhandleは、BlueBubblesが報告するチャット経由で送信されます。

## セキュリティ

- Webhookリクエストは、`guid`/`password` のクエリパラメーターまたはヘッダーを `channels.bluebubbles.password` と比較して認証されます。
- APIパスワードとWebhookエンドポイントは秘密にしてください（認証情報として扱ってください）。
- BlueBubblesのWebhook認証にはlocalhostバイパスはありません。Webhookトラフィックをproxyする場合でも、BlueBubblesパスワードをリクエストのエンドツーエンドで保持してください。ここでは `gateway.trustedProxies` は `channels.bluebubbles.password` の代わりにはなりません。[Gateway security](/ja-JP/gateway/security#reverse-proxy-configuration) を参照してください。
- LAN外に公開する場合は、BlueBubblesサーバーでHTTPS + ファイアウォールルールを有効にしてください。

## トラブルシューティング

- 入力中/開封イベントが動かなくなった場合は、BlueBubblesのWebhookログを確認し、Gatewayパスが `channels.bluebubbles.webhookPath` と一致していることを確認してください。
- ペアリングコードの有効期限は1時間です。`openclaw pairing list bluebubbles` と `openclaw pairing approve bluebubbles <code>` を使用してください。
- リアクションにはBlueBubbles Private API（`POST /api/v1/message/react`）が必要です。サーバーバージョンでこれが公開されていることを確認してください。
- 編集/送信取り消しにはmacOS 13+ と互換性のあるBlueBubblesサーバーバージョンが必要です。macOS 26（Tahoe）では、Private APIの変更により編集は現在壊れています。
- グループアイコン更新はmacOS 26（Tahoe）では不安定なことがあります。APIは成功を返しても、新しいアイコンが同期されない場合があります。
- OpenClawは、BlueBubblesサーバーのmacOSバージョンに基づいて、既知の不具合があるアクションを自動的に非表示にします。macOS 26（Tahoe）で編集がまだ表示される場合は、`channels.bluebubbles.actions.edit=false` で手動無効化してください。
- `coalesceSameSenderDms` を有効にしているのに分割送信（例: `Dump` + URL）がまだ2ターンで届く場合は、[分割送信結合のトラブルシューティング](#split-send-coalescing-troubleshooting) のチェックリストを参照してください。よくある原因は、デバウンスウィンドウが狭すぎる、セッションログのタイムスタンプをWebhook到着時刻と誤読している、または返信引用送信（2つ目のWebhookではなく `replyToBody` を使う）です。
- ステータス/ヘルス情報については: `openclaw status --all` または `openclaw status --deep`。

一般的なチャンネルワークフローの参考として、[Channels](/ja-JP/channels) と [Plugins](/ja-JP/tools/plugin) ガイドを参照してください。

## 関連

- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャンネル
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
