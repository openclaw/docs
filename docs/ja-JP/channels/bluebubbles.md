---
read_when:
    - BlueBubbles チャンネルの設定
    - Webhook ペアリングのトラブルシューティング
    - macOSでiMessageを設定する
sidebarTitle: BlueBubbles
summary: BlueBubbles macOS サーバー経由のレガシー iMessage サポート（REST の送受信、入力中表示、リアクション、ペアリング、高度なアクション）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-07T01:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: e32b35242c7e751b49dcd8d839bc291c80cb4d88c0b4ce6f65635b7ef2ed97c3
    source_path: channels/bluebubbles.md
    workflow: 16
---

ステータス: BlueBubbles macOS サーバーと HTTP 経由で通信するバンドル済みレガシー Plugin。既存の BlueBubbles セットアップは引き続き動作しますが、新しい OpenClaw iMessage デプロイでは、ホストの要件に合う場合はネイティブの [iMessage](/ja-JP/channels/imessage) Plugin を優先してください。

<Warning>
BlueBubbles は新しい OpenClaw セットアップでは非推奨です。

アップストリームの BlueBubbles エコシステムは現在も活動していますが、OpenClaw は BlueBubbles macOS サーバー API に依存しています。2026年5月6日時点で、公式の [`bluebubbles-server`](https://github.com/BlueBubblesApp/bluebubbles-server) 開発ブランチの最終変更は [2026年1月22日](https://github.com/BlueBubblesApp/bluebubbles-server/commit/88a4921bbd5a8111f1e9582b83715cf877171037)で、最新のサーバーリリース（[`v1.9.9`](https://github.com/BlueBubblesApp/bluebubbles-server/releases/tag/v1.9.9)）は2025年5月16日に公開されました。クライアントアプリとヘルパーリポジトリにはより新しい活動があるため、これは放棄の主張ではありません。この非推奨化は、ネイティブの `imsg` パスが統合をローカルの stdio 契約上に保つ場合に、外部 HTTP サーバー、webhooks、Private API 互換性面への OpenClaw の依存を減らすためのものです。
</Warning>

<Note>
現在の OpenClaw リリースには BlueBubbles がバンドルされているため、通常のパッケージビルドでは別途 `openclaw plugins install` 手順は不要です。
</Note>

## 概要

- BlueBubbles ヘルパーアプリ（[bluebubbles.app](https://bluebubbles.app)）を介して macOS 上で動作します。
- BlueBubbles チャネル ID、webhook 状態、グループターゲット、cron 配信、またはワークスペースルーティングにすでに依存しているインストール向けのレガシーフォールバックです。
- 推奨/テスト済み: macOS Sequoia (15)。macOS Tahoe (26) でも動作します。Tahoe では現在編集が壊れており、グループアイコンの更新は成功と報告されても同期されない場合があります。
- OpenClaw は REST API（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）を通じて通信します。
- 受信メッセージは webhooks 経由で届きます。送信返信、入力インジケーター、既読通知、tapback は REST 呼び出しです。
- 添付ファイルとステッカーは受信メディアとして取り込まれます（可能な場合はエージェントにも提示されます）。
- MP3 または CAF 音声を合成する自動 TTS 返信は、通常のファイル添付ではなく iMessage のボイスメモバブルとして配信されます。
- ペアリング/許可リストは、`channels.bluebubbles.allowFrom` + ペアリングコードを使い、他のチャネル（`/channels/pairing` など）と同じ方法で動作します。
- リアクションは Slack/Telegram と同様にシステムイベントとして提示されるため、エージェントは返信前にそれらに「メンション」できます。
- 高度な機能: 編集、送信取り消し、返信スレッド、メッセージエフェクト、グループ管理。

## クイックスタート

<Steps>
  <Step title="BlueBubbles をインストール">
    Mac に BlueBubbles サーバーをインストールします（[bluebubbles.app/install](https://bluebubbles.app/install) の手順に従ってください）。
  </Step>
  <Step title="Web API を有効化">
    BlueBubbles 設定で Web API を有効にし、パスワードを設定します。
  </Step>
  <Step title="OpenClaw を設定">
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
  <Step title="webhooks を Gateway に向ける">
    BlueBubbles webhooks を Gateway に向けます（例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
  </Step>
  <Step title="Gateway を起動">
    Gateway を起動します。webhook ハンドラーを登録し、ペアリングを開始します。
  </Step>
</Steps>

<Warning>
**セキュリティ**

- 常に webhook パスワードを設定してください。
- Webhook 認証は常に必須です。OpenClaw は、local loopback/プロキシトポロジーにかかわらず、`channels.bluebubbles.password` と一致する password/guid（たとえば `?password=<password>` または `x-password`）を含まない BlueBubbles webhook リクエストを拒否します。
- パスワード認証は、webhook 本文全体を読み取り/解析する前に確認されます。

</Warning>

## Messages.app を稼働状態に保つ（VM / ヘッドレスセットアップ）

一部の macOS VM / 常時稼働セットアップでは、Messages.app が「アイドル」状態になることがあります（アプリを開く/前面に出すまで受信イベントが停止します）。簡単な回避策は、AppleScript + LaunchAgent を使って **5分ごとに Messages を刺激する** ことです。

<Steps>
  <Step title="AppleScript を保存">
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
  <Step title="LaunchAgent をインストール">
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

    これは **300秒ごと** および **ログイン時** に実行されます。初回実行時に macOS の **Automation** プロンプト（`osascript` → Messages）が表示される場合があります。LaunchAgent を実行する同じユーザーセッションで承認してください。

  </Step>
  <Step title="読み込む">
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

ウィザードは次の項目を求めます。

<ParamField path="サーバー URL" type="string" required>
  BlueBubbles サーバーのアドレス（例: `http://192.168.1.100:1234`）。
</ParamField>
<ParamField path="パスワード" type="string" required>
  BlueBubbles Server 設定の API パスワード。
</ParamField>
<ParamField path="Webhook パス" type="string" default="/bluebubbles-webhook">
  Webhook エンドポイントのパス。
</ParamField>
<ParamField path="DM ポリシー" type="string">
  `pairing`、`allowlist`、`open`、または `disabled`。
</ParamField>
<ParamField path="許可リスト" type="string[]">
  電話番号、メールアドレス、またはチャットターゲット。
</ParamField>

CLI から BlueBubbles を追加することもできます。

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## アクセス制御（DM + グループ）

<Tabs>
  <Tab title="DM">
    - デフォルト: `channels.bluebubbles.dmPolicy = "pairing"`。
    - 不明な送信者にはペアリングコードが送られます。承認されるまでメッセージは無視されます（コードは1時間後に期限切れになります）。
    - 次で承認します。
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - ペアリングはデフォルトのトークン交換です。詳細: [ペアリング](/ja-JP/channels/pairing)

  </Tab>
  <Tab title="グループ">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（デフォルト: `allowlist`）。
    - `channels.bluebubbles.groupAllowFrom` は、`allowlist` が設定されている場合にグループ内で誰がトリガーできるかを制御します。

  </Tab>
</Tabs>

### 連絡先名の補完（macOS、任意）

BlueBubbles のグループ webhooks には、多くの場合、生の参加者アドレスだけが含まれます。代わりに `GroupMembers` コンテキストにローカル連絡先名を表示したい場合は、macOS 上のローカル連絡先補完を有効にできます。

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` でルックアップを有効にします。デフォルト: `false`。
- ルックアップは、グループアクセス、コマンド認可、メンションゲートがメッセージの通過を許可した後にのみ実行されます。
- 名前のない電話参加者のみ補完されます。
- ローカル一致が見つからない場合、生の電話番号がフォールバックとして残ります。

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

BlueBubbles は、iMessage/WhatsApp の動作に合わせてグループチャットのメンションゲートをサポートします。

- `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）を使ってメンションを検出します。
- グループで `requireMention` が有効な場合、エージェントはメンションされたときだけ応答します。
- 認可済み送信者からの制御コマンドは、メンションゲートをバイパスします。

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
- `allowFrom` と `groupAllowFrom` を使ってコマンド認可を判定します。
- 認可済み送信者は、グループでメンションしなくても制御コマンドを実行できます。

### グループごとのシステムプロンプト

`channels.bluebubbles.groups.*` 配下の各エントリは、任意の `systemPrompt` 文字列を受け付けます。この値は、そのグループ内のメッセージを処理するすべてのターンでエージェントのシステムプロンプトに注入されるため、エージェントプロンプトを編集せずにグループごとのペルソナや動作ルールを設定できます。

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

キーは、BlueBubbles がグループに対して報告する `chatGuid` / `chatIdentifier` / 数値 `chatId` のいずれかと一致します。また、`"*"` ワイルドカードエントリは、完全一致がないすべてのグループにデフォルトを提供します（`requireMention` とグループごとのツールポリシーで使われるものと同じパターンです）。完全一致は常にワイルドカードより優先されます。DM はこのフィールドを無視します。代わりにエージェントレベルまたはアカウントレベルのプロンプトカスタマイズを使用してください。

#### 実例: スレッド返信と tapback リアクション（Private API）

BlueBubbles Private API が有効な場合、受信メッセージには短いメッセージ ID（例: `[[reply_to:5]]`）が付与され、エージェントは `action=reply` を呼び出して特定のメッセージにスレッド返信したり、`action=react` で tapback を付けたりできます。グループごとの `systemPrompt` は、エージェントに適切なツールを選ばせ続ける信頼性の高い方法です。

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

Tapback リアクションとスレッド返信はいずれも BlueBubbles Private API が必要です。基礎となる仕組みについては、[高度なアクション](#advanced-actions) と [メッセージ ID](#message-ids-short-vs-full) を参照してください。

## ACP 会話バインディング

BlueBubbles チャットは、トランスポート層を変更せずに永続的な ACP ワークスペースへ変換できます。

高速なオペレーターフロー:

- DM または許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 以後、その同じ BlueBubbles 会話内のメッセージは、生成された ACP セッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

設定済みの永続バインディングも、`type: "acp"` と `match.channel: "bluebubbles"` を持つトップレベルの `bindings[]` エントリを通じてサポートされます。

`match.peer.id` には、サポートされている任意の BlueBubbles ターゲット形式を使用できます。

- 正規化された DM ハンドル（`+15555550123` や `user@example.com` など）
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

安定したグループバインディングには、`chat_id:*` または `chat_identifier:*` を優先してください。

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

共有 ACP バインディングの動作については、[ACPエージェント](/ja-JP/tools/acp-agents)を参照してください。

## 入力中 + 既読通知

- **入力インジケーター**: 応答生成の前および生成中に自動送信されます。
- **既読通知**: `channels.bluebubbles.sendReadReceipts` で制御します（デフォルト: `true`）。
- **入力インジケーター**: OpenClaw は入力開始イベントを送信します。BlueBubbles は送信時またはタイムアウト時に入力中状態を自動的に解除します（DELETE による手動停止は信頼できません）。

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

BlueBubbles は、設定で有効化されている場合に高度なメッセージアクションをサポートします。

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
  <Accordion title="Available actions">
    - **react**: tapback リアクションを追加または削除します（`messageId`、`emoji`、`remove`）。iMessage のネイティブ tapback セットは `love`、`like`、`dislike`、`laugh`、`emphasize`、`question` です。エージェントがそのセット外の絵文字（例: `👀`）を選んだ場合、リアクションツールは `love` にフォールバックするため、リクエスト全体を失敗させるのではなく tapback は引き続き表示されます。設定済みの ack リアクションは引き続き厳密に検証され、不明な値ではエラーになります。
    - **edit**: 送信済みメッセージを編集します（`messageId`、`text`）。
    - **unsend**: メッセージの送信を取り消します（`messageId`）。
    - **reply**: 特定のメッセージに返信します（`messageId`、`text`、`to`）。
    - **sendWithEffect**: iMessage エフェクト付きで送信します（`text`、`to`、`effectId`）。
    - **renameGroup**: グループチャット名を変更します（`chatGuid`、`displayName`）。
    - **setGroupIcon**: グループチャットのアイコンまたは写真を設定します（`chatGuid`、`media`）- macOS 26 Tahoe では不安定です（API が成功を返してもアイコンが同期されない場合があります）。
    - **addParticipant**: グループに誰かを追加します（`chatGuid`、`address`）。
    - **removeParticipant**: グループから誰かを削除します（`chatGuid`、`address`）。
    - **leaveGroup**: グループチャットから退出します（`chatGuid`）。
    - **upload-file**: メディアまたはファイルを送信します（`to`、`buffer`、`filename`、`asVoice`）。
      - ボイスメモ: iMessage の音声メッセージとして送信するには、**MP3** または **CAF** 音声で `asVoice: true` を設定します。BlueBubbles はボイスメモ送信時に MP3 → CAF に変換します。
    - レガシーエイリアス: `sendAttachment` は引き続き動作しますが、正規のアクション名は `upload-file` です。

  </Accordion>
</AccordionGroup>

### メッセージ ID（短縮形式と完全形式）

OpenClaw は、トークンを節約するために_短い_メッセージ ID（例: `1`、`2`）を表示する場合があります。

- `MessageSid` / `ReplyToId` には短い ID を指定できます。
- `MessageSidFull` / `ReplyToIdFull` にはプロバイダーの完全な ID が含まれます。
- 短い ID はメモリ内にあります。再起動またはキャッシュ削除で期限切れになる場合があります。
- アクションは短縮または完全な `messageId` を受け付けますが、短い ID が利用できなくなっている場合はエラーになります。

永続的な自動化と保存には完全な ID を使用してください。

- テンプレート: `{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- コンテキスト: 受信ペイロード内の `MessageSidFull` / `ReplyToIdFull`

テンプレート変数については、[設定](/ja-JP/gateway/configuration)を参照してください。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 分割送信 DM の結合（1 回の入力にコマンド + URL）

ユーザーが iMessage でコマンドと URL を一緒に入力した場合（例: `Dump https://example.com/article`）、Apple は送信を**2 つの別個の Webhook 配信**に分割します。

1. テキストメッセージ（`"Dump"`）。
2. OG プレビュー画像を添付した URL プレビューバルーン（`"https://..."`）。

ほとんどの環境では、2 つの Webhook は OpenClaw に約 0.8〜2.0 秒間隔で到着します。結合しない場合、エージェントは 1 ターン目でコマンドだけを受け取り、返信し（多くの場合「URL を送ってください」）、2 ターン目で初めて URL を見ます。この時点ではコマンドのコンテキストはすでに失われています。

`channels.bluebubbles.coalesceSameSenderDms` は、DM で連続する同一送信者の Webhook を 1 回のエージェントターンに統合するようにします。グループチャットはメッセージごとのキーを引き続き使用するため、複数ユーザーのターン構造は保持されます。

<Tabs>
  <Tab title="When to enable">
    次の場合に有効化してください。

    - 1 つのメッセージに `command + payload` が含まれることを期待する Skills（dump、paste、save、queue など）を提供している。
    - ユーザーが URL、画像、長いコンテンツをコマンドと一緒に貼り付ける。
    - 追加される DM ターンのレイテンシを許容できる（下記参照）。

    次の場合は無効のままにしてください。

    - 1 語の DM トリガーで最小のコマンドレイテンシが必要。
    - すべてのフローが、後続のペイロードを伴わない単発コマンドである。

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    フラグがオンで、明示的な `messages.inbound.byChannel.bluebubbles` がない場合、デバウンスウィンドウは **2500 ms** に広がります（結合しない場合のデフォルトは 500 ms）。Apple の分割送信の間隔は 0.8〜2.0 秒で、より短いデフォルトには収まらないため、広いウィンドウが必要です。

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
  <Tab title="Trade-offs">
    - **DM 制御コマンドのレイテンシが増加します。** フラグがオンの場合、DM 制御コマンドメッセージ（`Dump`、`Save` など）は、ペイロード Webhook が来る可能性に備えて、ディスパッチ前に最大でデバウンスウィンドウ分待機するようになります。グループチャットのコマンドは即時ディスパッチのままです。
    - **統合された出力には上限があります** - 統合テキストは明示的な `…[truncated]` マーカー付きで 4000 文字まで、添付ファイルは 20 個まで、ソースエントリは 10 個までです（それを超える分は最初と最新が保持されます）。各ソースの `messageId` は引き続き受信重複排除に到達するため、後で MessagePoller が個別イベントをリプレイしても重複として認識されます。
    - **オプトインで、チャンネルごとです。** 他のチャンネル（Telegram、WhatsApp、Slack、…）には影響しません。

  </Tab>
</Tabs>

### シナリオとエージェントに見える内容

| ユーザーの入力内容                                                 | Apple の配信内容          | フラグオフ（デフォルト）                | フラグオン + 2500 ms ウィンドウ                                      |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（1 回の送信）                            | 約 1 秒間隔の 2 Webhook   | 2 つのエージェントターン: "Dump" のみ、その後 URL | 1 ターン: 統合テキスト `Dump https://example.com`                       |
| `Save this 📎image.jpg caption`（添付ファイル + テキスト）          | 2 Webhook                 | 2 ターン                                | 1 ターン: テキスト + 画像                                               |
| `/status`（単独コマンド）                                          | 1 Webhook                 | 即時ディスパッチ                        | **ウィンドウまで待機してからディスパッチ**                              |
| URL のみを貼り付け                                                 | 1 Webhook                 | 即時ディスパッチ                        | 即時ディスパッチ（バケット内のエントリが 1 つのみ）                     |
| テキスト + URL を意図的に別々のメッセージとして数分空けて送信      | ウィンドウ外の 2 Webhook  | 2 ターン                                | 2 ターン（その間にウィンドウが期限切れ）                                |
| 急速な連投（ウィンドウ内に 10 件超の小さな DM）                    | N Webhook                 | N ターン                                | 1 ターン、上限付き出力（最初 + 最新、テキスト/添付ファイル上限を適用） |

### 分割送信の結合に関するトラブルシューティング

フラグがオンでも分割送信がまだ 2 ターンとして到着する場合は、各レイヤーを確認してください。

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    その後 `openclaw gateway restart` を実行してください。このフラグは debouncer-registry の作成時に読み取られます。

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    `~/Library/Logs/bluebubbles-server/main.log` にある BlueBubbles サーバーログを確認します。

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    `"Dump"` のようなテキストディスパッチと、その後に続く `"https://..."; Attachments:` ディスパッチの間隔を測定してください。その間隔を十分にカバーするように `messages.inbound.byChannel.bluebubbles` を引き上げます。

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    セッションイベントのタイムスタンプ（`~/.openclaw/agents/<id>/sessions/*.jsonl`）は、Gateway がメッセージをエージェントに渡した時刻を示し、Webhook が到着した時刻では**ありません**。`[Queued messages while agent was busy]` とタグ付けされた 2 件目のキュー内メッセージは、2 件目の Webhook が到着した時点で 1 ターン目がまだ実行中だったことを意味します。つまり、結合バケットはすでにフラッシュ済みでした。セッションログではなく、BB サーバーログを基準にウィンドウを調整してください。
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    小さめのマシン（8 GB）では、エージェントターンに十分な時間がかかり、返信完了前に結合バケットがフラッシュされて、URL がキュー内の 2 ターン目として到着する場合があります。`memory_pressure` と `ps -o rss -p $(pgrep openclaw-gateway)` を確認してください。Gateway が約 500 MB RSS を超えていて compressor が有効な場合は、他の重いプロセスを閉じるか、より大きなホストに増強してください。
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    ユーザーが既存の URL バルーンへの**返信**として `Dump` をタップした場合（iMessage では Dump バブルに「1 Reply」バッジが表示されます）、URL は 2 件目の Webhook ではなく `replyToBody` に存在します。結合は適用されません。これは debouncer の問題ではなく、Skill またはプロンプトの問題です。
  </Accordion>
</AccordionGroup>

## ブロックストリーミング

応答を 1 つのメッセージとして送信するか、ブロック単位でストリーミングするかを制御します。

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## メディア + 上限

- 受信した添付ファイルはダウンロードされ、メディアキャッシュに保存されます。
- 受信および送信メディアのメディア上限は `channels.bluebubbles.mediaMaxMb` で指定します（デフォルト: 8 MB）。
- 送信テキストは `channels.bluebubbles.textChunkLimit` に従って分割されます（デフォルト: 4000 文字）。

## 設定リファレンス

完全な設定: [設定](/ja-JP/gateway/configuration)

<AccordionGroup>
  <Accordion title="接続と Webhook">
    - `channels.bluebubbles.enabled`: チャンネルを有効化/無効化します。
    - `channels.bluebubbles.serverUrl`: BlueBubbles REST API のベース URL。
    - `channels.bluebubbles.password`: API パスワード。
    - `channels.bluebubbles.webhookPath`: Webhook エンドポイントパス (デフォルト: `/bluebubbles-webhook`)。

  </Accordion>
  <Accordion title="アクセスポリシー">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (デフォルト: `pairing`)。
    - `channels.bluebubbles.allowFrom`: DM 許可リスト (ハンドル、メール、E.164 番号、`chat_id:*`、`chat_guid:*`)。
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (デフォルト: `allowlist`)。
    - `channels.bluebubbles.groupAllowFrom`: グループ送信者の許可リスト。
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS では、ゲートを通過した後に、名前のないグループ参加者をローカルの連絡先から任意で補完します。デフォルト: `false`。
    - `channels.bluebubbles.groups`: グループごとの設定 (`requireMention` など)。

  </Accordion>
  <Accordion title="配信とチャンク化">
    - `channels.bluebubbles.sendReadReceipts`: 既読通知を送信します (デフォルト: `true`)。
    - `channels.bluebubbles.blockStreaming`: ブロックストリーミングを有効にします (デフォルト: `false`; ストリーミング返信に必要)。
    - `channels.bluebubbles.textChunkLimit`: 送信チャンクサイズを文字数で指定します (デフォルト: 4000)。
    - `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` 経由の送信テキスト送信について、リクエストごとのタイムアウトをミリ秒で指定します (デフォルト: 30000)。Private API の iMessage 送信が iMessage フレームワーク内で 60 秒以上停止することがある macOS 26 環境では、たとえば `45000` または `60000` に引き上げてください。プローブ、チャット検索、リアクション、編集、ヘルスチェックは現在、より短い 10 秒のデフォルトを維持します。リアクションと編集への対象拡大はフォローアップとして計画されています。アカウントごとのオーバーライド: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
    - `channels.bluebubbles.chunkMode`: `length` (デフォルト) は `textChunkLimit` を超える場合にのみ分割します。`newline` は長さによるチャンク化の前に空行 (段落境界) で分割します。

  </Accordion>
  <Accordion title="メディアと履歴">
    - `channels.bluebubbles.mediaMaxMb`: 受信/送信メディアの上限を MB で指定します (デフォルト: 8)。
    - `channels.bluebubbles.mediaLocalRoots`: 送信用のローカルメディアパスとして許可する絶対ローカルディレクトリの明示的な許可リスト。これが設定されていない限り、ローカルパス送信はデフォルトで拒否されます。アカウントごとのオーバーライド: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
    - `channels.bluebubbles.coalesceSameSenderDms`: 同じ送信者から連続する DM Webhook を 1 つのエージェントターンに統合し、Apple のテキスト+URL 分割送信を単一メッセージとして受信できるようにします (デフォルト: `false`)。シナリオ、ウィンドウ調整、トレードオフについては、[分割送信 DM の統合](#coalescing-split-send-dms-command--url-in-one-composition) を参照してください。明示的な `messages.inbound.byChannel.bluebubbles` なしで有効にした場合、デフォルトの受信デバウンスウィンドウを 500 ms から 2500 ms に広げます。
    - `channels.bluebubbles.historyLimit`: コンテキスト用の最大グループメッセージ数 (0 で無効化)。
    - `channels.bluebubbles.dmHistoryLimit`: DM 履歴の上限。
    - `channels.bluebubbles.replyContextApiFallback`: 受信返信に `replyToBody`/`replyToSender` がなく、メモリ内の返信コンテキストキャッシュもミスした場合、ベストエフォートのフォールバックとして BlueBubbles HTTP API から元のメッセージを取得します (デフォルト: `false`)。1 つの BlueBubbles アカウントを共有する複数インスタンスのデプロイ、プロセス再起動後、または長期間有効な TTL/LRU キャッシュの退避後に便利です。この取得は、他のすべての BlueBubbles クライアントリクエストと同じポリシーで SSRF ガードされ、例外をスローせず、キャッシュに投入されるため、後続の返信でコストがならされます。アカウントごとのオーバーライド: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`。チャンネルレベルの設定は、このフラグを省略したアカウントに伝播します。

  </Accordion>
  <Accordion title="アクションとアカウント">
    - `channels.bluebubbles.actions`: 特定のアクションを有効化/無効化します。
    - `channels.bluebubbles.accounts`: マルチアカウント設定。

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
- 直接ハンドル: `+15555550123`、`user@example.com`
  - 直接ハンドルに既存の DM チャットがない場合、OpenClaw は `POST /api/v1/chat/new` 経由で作成します。これには BlueBubbles Private API が有効である必要があります。

### iMessage と SMS のルーティング

同じハンドルに Mac 上で iMessage チャットと SMS チャットの両方がある場合 (たとえば、iMessage に登録済みだが、緑色の吹き出しのフォールバックも受信したことがある電話番号)、OpenClaw は iMessage チャットを優先し、暗黙に SMS へダウングレードすることはありません。SMS チャットを強制するには、明示的な `sms:` ターゲットプレフィックスを使用してください (例: `sms:+15555550123`)。一致する iMessage チャットがないハンドルは、BlueBubbles が報告する任意のチャットを通じて送信されます。

## セキュリティ

- Webhook リクエストは、`guid`/`password` クエリパラメーターまたはヘッダーを `channels.bluebubbles.password` と比較して認証されます。
- API パスワードと Webhook エンドポイントは秘密にしてください (資格情報として扱ってください)。
- BlueBubbles Webhook 認証に localhost バイパスはありません。Webhook トラフィックをプロキシする場合は、リクエストのエンドツーエンドで BlueBubbles パスワードを保持してください。ここでは `gateway.trustedProxies` は `channels.bluebubbles.password` の代わりにはなりません。[Gateway セキュリティ](/ja-JP/gateway/security#reverse-proxy-configuration)を参照してください。
- LAN の外部に公開する場合は、BlueBubbles サーバーで HTTPS とファイアウォールルールを有効にしてください。

## トラブルシューティング

- タイピング/既読イベントが動作しなくなった場合は、BlueBubbles Webhook ログを確認し、Gateway パスが `channels.bluebubbles.webhookPath` と一致することを検証してください。
- ペアリングコードは 1 時間後に期限切れになります。`openclaw pairing list bluebubbles` と `openclaw pairing approve bluebubbles <code>` を使用してください。
- リアクションには BlueBubbles private API (`POST /api/v1/message/react`) が必要です。サーバーバージョンがそれを公開していることを確認してください。
- 編集/送信取り消しには macOS 13+ と互換性のある BlueBubbles サーバーバージョンが必要です。macOS 26 (Tahoe) では、private API の変更により編集は現在壊れています。
- グループアイコンの更新は macOS 26 (Tahoe) で不安定な場合があります。API が成功を返しても、新しいアイコンが同期されないことがあります。
- OpenClaw は、BlueBubbles サーバーの macOS バージョンに基づいて、既知の壊れているアクションを自動的に非表示にします。macOS 26 (Tahoe) で編集がまだ表示される場合は、`channels.bluebubbles.actions.edit=false` で手動で無効化してください。
- `coalesceSameSenderDms` が有効でも分割送信 (例: `Dump` + URL) がまだ 2 つのターンとして届く場合は、[分割送信統合のトラブルシューティング](#split-send-coalescing-troubleshooting) チェックリストを参照してください - 一般的な原因は、デバウンスウィンドウが短すぎる、セッションログのタイムスタンプを Webhook 到着時刻と誤読している、または返信引用送信 (`replyToBody` を使用し、2 つ目の Webhook ではない) です。
- ステータス/ヘルス情報: `openclaw status --all` または `openclaw status --deep`。

一般的なチャンネルワークフローのリファレンスについては、[チャンネル](/ja-JP/channels) と [Plugins](/ja-JP/tools/plugin) ガイドを参照してください。

## 関連

- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [チャンネル概要](/ja-JP/channels) - サポートされているすべてのチャンネル
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションゲート
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと強化
