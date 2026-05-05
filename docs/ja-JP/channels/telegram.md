---
read_when:
    - Telegram機能またはWebhookに取り組む
summary: Telegram ボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-05-05T04:49:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c75169335378482b80f1ceb669cefaa034ad3e589cf5f1d14c8252608ee46a
    source_path: channels/telegram.md
    workflow: 16
---

本番運用に対応した、grammY による bot DM とグループ対応です。既定モードはロングポーリングです。Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram の既定の DM ポリシーはペアリングです。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    複数チャンネルにまたがる診断と修復プレイブック。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャンネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFather で bot トークンを作成する">
    Telegram を開き、**@BotFather** とチャットします（ハンドルが正確に `@BotFather` であることを確認してください）。

    `/newbot` を実行し、プロンプトに従って、トークンを保存します。

  </Step>

  <Step title="トークンと DM ポリシーを設定する">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    env フォールバック: `TELEGRAM_BOT_TOKEN=...`（既定アカウントのみ）。
    Telegram は `openclaw channels login telegram` を使用しません。config/env でトークンを設定してから、gateway を起動してください。

  </Step>

  <Step title="gateway を起動し、最初の DM を承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは 1 時間後に期限切れになります。

  </Step>

  <Step title="bot をグループに追加する">
    bot をグループに追加してから、アクセスモデルに合わせて `channels.telegram.groups` と `groupPolicy` を設定します。
  </Step>
</Steps>

<Note>
トークンの解決順序はアカウントを考慮します。実際には config 値が env フォールバックより優先され、`TELEGRAM_BOT_TOKEN` は既定アカウントにのみ適用されます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループの可視性">
    Telegram bot は既定で **Privacy Mode** になっており、受信できるグループメッセージが制限されます。

    bot がすべてのグループメッセージを確認する必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする、または
    - bot をグループ管理者にする。

    プライバシーモードを切り替える場合は、Telegram が変更を適用するように、各グループで bot を削除してから再追加します。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram グループ設定で制御します。

    管理者 bot はすべてのグループメッセージを受信します。これは常時有効なグループ動作に役立ちます。

  </Accordion>

  <Accordion title="便利な BotFather 切り替え">

    - グループ追加を許可/拒否するには `/setjoingroups`
    - グループの可視性動作には `/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージのアクセスを制御します。

    - `pairing`（既定）
    - `allowlist`（`allowFrom` に少なくとも 1 つの sender ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `allowFrom: ["*"]` を指定した `dmPolicy: "open"` は、bot のユーザー名を見つけるか推測した任意の Telegram アカウントが bot にコマンドを送れるようにします。厳しく制限されたツールを持つ意図的に公開された bot にのみ使用してください。単一所有者の bot では、数値 user ID を指定した `allowlist` を使用してください。

    `channels.telegram.allowFrom` は数値の Telegram user ID を受け付けます。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    複数アカウント config では、制限的なトップレベルの `channels.telegram.allowFrom` は安全境界として扱われます。アカウントレベルの `allowFrom: ["*"]` エントリは、マージ後の有効なアカウント許可リストに明示的なワイルドカードが残っていない限り、そのアカウントを公開状態にはしません。
    空の `allowFrom` を指定した `dmPolicy: "allowlist"` はすべての DM をブロックし、config 検証で拒否されます。
    セットアップでは数値 user ID のみを求めます。
    アップグレード後に config に `@username` の許可リストエントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォート。Telegram bot トークンが必要です）。
    以前に pairing-store の許可リストファイルに依存していた場合、`openclaw doctor --fix` は allowlist フローでエントリを `channels.telegram.allowFrom` に復元できます（たとえば `dmPolicy: "allowlist"` に明示的な ID がまだない場合）。

    単一所有者の bot では、以前のペアリング承認に依存するのではなく、アクセスポリシーを config 内で永続化するために、明示的な数値 `allowFrom` ID を指定した `dmPolicy: "allowlist"` を推奨します。

    よくある混乱: DM ペアリング承認は「この sender はどこでも認可されている」という意味ではありません。
    ペアリングは DM アクセスを付与します。コマンド所有者がまだ存在しない場合、最初に承認されたペアリングは `commands.ownerAllowFrom` も設定し、所有者限定コマンドと exec 承認に明示的な操作者アカウントを持たせます。
    グループ sender の認可は、引き続き明示的な config 許可リストから得られます。
    「一度認可されれば DM とグループコマンドの両方が動作する」ようにしたい場合は、自分の数値 Telegram user ID を `channels.telegram.allowFrom` に入れてください。所有者限定コマンドについては、`commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### Telegram user ID を見つける

    より安全な方法（サードパーティ bot なし）:

    1. 自分の bot に DM する。
    2. `openclaw logs --follow` を実行する。
    3. `from.id` を読む。

    公式 Bot API メソッド:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティ方式（プライバシーは低め）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと許可リスト">
    2 つの制御が一緒に適用されます。

    1. **許可されるグループ**（`channels.telegram.groups`）
       - `groups` config なし:
         - `groupPolicy: "open"` の場合: 任意のグループが group-ID チェックを通過できます
         - `groupPolicy: "allowlist"`（既定）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされます
       - `groups` が設定済み: 許可リストとして機能します（明示的な ID または `"*"`）

    2. **グループで許可される sender**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（既定）
       - `disabled`

    `groupAllowFrom` はグループ sender フィルタリングに使用されます。設定されていない場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値の Telegram user ID にする必要があります（`telegram:` / `tg:` プレフィックスは正規化されます）。
    Telegram グループまたはスーパーグループの chat ID を `groupAllowFrom` に入れないでください。負の chat ID は `channels.telegram.groups` の下に置きます。
    数値でないエントリは sender 認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ sender auth は DM pairing-store 承認を継承しません。
    ペアリングは DM 専用のままです。グループでは、`groupAllowFrom` またはグループ単位/トピック単位の `allowFrom` を設定します。
    `groupAllowFrom` が未設定の場合、Telegram は pairing store ではなく config の `allowFrom` にフォールバックします。
    単一所有者 bot の実用的なパターン: 自分の user ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` の下で許可します。
    ランタイム上の注意: `channels.telegram` が完全に存在しない場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムは fail-closed の `groupPolicy="allowlist"` を既定にします。

    例: 1 つの特定グループで任意のメンバーを許可する:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    例: 1 つの特定グループ内で特定ユーザーのみを許可する:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      よくある間違い: `groupAllowFrom` は Telegram グループの許可リストではありません。

      - `-1001234567890` のような負の Telegram グループまたはスーパーグループ chat ID は `channels.telegram.groups` の下に置きます。
      - 許可されたグループ内で bot を起動できる人物を制限したい場合は、`8734062810` のような Telegram user ID を `groupAllowFrom` の下に置きます。
      - 許可されたグループの任意のメンバーが bot と会話できるようにしたい場合にのみ、`groupAllowFrom: ["*"]` を使用します。

    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信では既定でメンションが必要です。

    メンションは次から来ることがあります。

    - ネイティブの `@botusername` メンション、または
    - 次のメンションパターン:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンド切り替え:

    - `/activation always`
    - `/activation mention`

    これらはセッション状態のみを更新します。永続化には config を使用してください。

    永続 config の例:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    グループ chat ID を取得する:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` から `chat.id` を読む
    - または Bot API の `getUpdates` を調べる

  </Tab>
</Tabs>

## ランタイム動作

- Telegram は gateway プロセスによって所有されます。
- ルーティングは決定的です。Telegram inbound は Telegram に返信されます（モデルはチャンネルを選びません）。
- inbound メッセージは、返信メタデータとメディアプレースホルダーを含む共有チャンネルエンベロープに正規化されます。
- グループセッションはグループ ID で分離されます。フォーラムトピックでは、トピックを分離するために `:topic:<threadId>` が追加されます。
- DM メッセージには `message_thread_id` を含めることができます。OpenClaw は返信用に thread ID を保持しますが、既定では DM をフラットなセッションのままにします。DM トピックのセッション分離を意図的に行いたい場合は、`channels.telegram.dm.threadReplies: "inbound"`、`channels.telegram.direct.<chatId>.threadReplies: "inbound"`、`requireTopic: true`、または一致する topic config を設定してください。
- ロングポーリングは grammY runner を使用し、chat/thread ごとの順序制御を行います。runner sink 全体の並行数は `agents.defaults.maxConcurrent` を使用します。
- ロングポーリングは各 gateway プロセス内で保護され、1 つの bot トークンを同時に使用できるアクティブ poller は 1 つだけです。それでも `getUpdates` の 409 conflict が表示される場合は、別の OpenClaw gateway、スクリプト、または外部 poller が同じトークンを使用している可能性があります。
- ロングポーリング watchdog の再起動は、既定では完了した `getUpdates` liveness が 120 秒間ない場合にトリガーされます。長時間実行される作業中に、デプロイで誤った polling-stall 再起動がまだ発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒単位で、`30000` から `600000` まで許可されます。アカウント単位の上書きに対応しています。
- Telegram Bot API には既読通知のサポートがありません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は部分返信をリアルタイムにストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress` です（既定: `partial`）
    - `progress` は編集可能なステータス下書きを 1 つ保持し、最終配信までツール進行状況で更新します
    - `streaming.preview.toolProgress` は、ツール/進行状況の更新が同じ編集済みプレビューメッセージを再利用するかどうかを制御します（既定: プレビューストリーミングがアクティブな場合は `true`）
    - `streaming.preview.commandText` は、それらのツール進行状況行の中のコマンド/exec 詳細を制御します。`raw`（既定、リリース済み動作を保持）または `status`（ツールラベルのみ）
    - レガシーの `channels.telegram.streamMode` と boolean の `streaming` 値は検出されます。`openclaw doctor --fix` を実行して、それらを `channels.telegram.streaming.mode` に移行してください

    ツール進行状況のプレビュー更新は、ツール実行中に表示される短いステータス行です。たとえば、コマンド実行、ファイル読み取り、計画更新、パッチ概要などです。Telegram は `v2026.4.22` 以降のリリース済み OpenClaw 動作に合わせるため、既定でこれらを有効にしています。回答テキスト用の編集済みプレビューは保持しつつ、ツール進行状況行を非表示にするには、次を設定します。

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    ツール進行状況は表示したまま、コマンド/exec テキストを非表示にするには、次を設定します。

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    進行状況ドラフトモードでは、同じ command-text ポリシーを `streaming.progress` の下に置きます。

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    final のみの配信が必要な場合にだけ `streaming.mode: "off"` を使用します。Telegram のプレビュー編集は無効になり、汎用的なツール/進行状況の雑談は、単独のステータスメッセージとして送信される代わりに抑制されます。承認プロンプト、メディアペイロード、エラーは引き続き通常の final 配信を通ります。ツール進行状況のステータス行を隠しながら回答プレビュー編集だけを維持したい場合は、`streaming.preview.toolProgress: false` を使用します。

    <Note>
      Telegram の選択引用返信は例外です。`replyToMode` が `"first"`、`"all"`、または `"batched"` で、受信メッセージに選択された引用テキストが含まれる場合、OpenClaw は回答プレビューを編集する代わりに、Telegram ネイティブの引用返信パスで final の回答を送信するため、そのターンでは `streaming.preview.toolProgress` は短いステータス行を表示できません。選択された引用テキストがない現在メッセージへの返信では、引き続きプレビューストリーミングが維持されます。ツール進行状況の可視性がネイティブ引用返信より重要な場合は `replyToMode: "off"` を設定するか、トレードオフを承認するために `streaming.preview.toolProgress: false` を設定します。
    </Note>

    テキストのみの返信の場合:

    - 短い DM/グループ/トピックのプレビュー: OpenClaw は同じプレビューメッセージを維持し、プレビューが表示された後に表示可能な非プレビューメッセージが送信されていない限り、その場で final 編集を実行します
    - 複数の Telegram メッセージに分割される長いテキスト final は、可能な場合は既存のプレビューを最初の final チャンクとして再利用し、その後に残りのチャンクだけを送信します
    - 表示可能な非プレビュー出力が後続するプレビュー: OpenClaw は完了した返信を新しい final メッセージとして送信し、古いプレビューをクリーンアップするため、final の回答は中間出力の後に表示されます
    - 約 1 分より古いプレビュー: OpenClaw は完了した返信を新しい final メッセージとして送信してからプレビューをクリーンアップするため、Telegram の表示タイムスタンプはプレビュー作成時刻ではなく完了時刻を反映します

    複雑な返信（たとえばメディアペイロード）の場合、OpenClaw は通常の final 配信にフォールバックしてからプレビューメッセージをクリーンアップします。

    プレビューストリーミングはブロックストリーミングとは別です。Telegram でブロックストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

    Telegram のみの推論ストリーム:

    - `/reasoning stream` は生成中に推論をライブプレビューへ送信します
    - 推論プレビューは final 配信後に削除されます。推論を表示したままにする必要がある場合は `/reasoning on` を使用します
    - final の回答は推論テキストなしで送信されます

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    送信テキストは Telegram `parse_mode: "HTML"` を使用します。

    - Markdown 風のテキストは Telegram セーフな HTML にレンダリングされます。
    - 生のモデル HTML は、Telegram の解析失敗を減らすためにエスケープされます。
    - Telegram が解析済み HTML を拒否した場合、OpenClaw はプレーンテキストとして再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効化できます。

  </Accordion>

  <Accordion title="Native commands and custom commands">
    Telegram コマンドメニュー登録は起動時に `setMyCommands` で処理されます。

    ネイティブコマンドのデフォルト:

    - `commands.native: "auto"` は Telegram のネイティブコマンドを有効にします

    カスタムコマンドメニュー項目を追加します:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    ルール:

    - 名前は正規化されます（先頭の `/` を削除し、小文字化）
    - 有効なパターン: `a-z`、`0-9`、`_`、長さ `1..32`
    - カスタムコマンドはネイティブコマンドを上書きできません
    - 競合/重複はスキップされ、ログに記録されます

    注記:

    - カスタムコマンドはメニュー項目のみであり、動作を自動実装しません
    - plugin/skill コマンドは、Telegram メニューに表示されていなくても、入力された場合は引き続き動作できます

    ネイティブコマンドが無効な場合、組み込み項目は削除されます。カスタム/plugin コマンドは、設定されていれば引き続き登録される場合があります。

    一般的なセットアップ失敗:

    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、トリミング後も Telegram メニューがまだ上限を超えたことを意味します。plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効化してください。
    - 直接の Bot API curl コマンドは動作する一方で、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合、`channels.telegram.apiRoot` が完全な `/bot<TOKEN>` エンドポイントに設定されていた可能性があります。`apiRoot` は Bot API ルートのみでなければならず、`openclaw doctor --fix` は誤って末尾に付いた `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、Telegram が設定された bot token を拒否したことを意味します。`botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN` を現在の BotFather token で更新してください。OpenClaw はポーリング前に停止するため、これは Webhook クリーンアップ失敗として報告されません。
    - ネットワーク/fetch エラーを伴う `setMyCommands failed` は通常、`api.telegram.org` への送信 DNS/HTTPS がブロックされていることを意味します。

    ### デバイスペアリングコマンド（`device-pair` plugin）

    `device-pair` plugin がインストールされている場合:

    1. `/pair` はセットアップコードを生成します
    2. iOS アプリにコードを貼り付けます
    3. `/pair pending` は保留中のリクエスト（ロール/スコープを含む）を一覧表示します
    4. リクエストを承認します:
       - 明示的な承認には `/pair approve <requestId>`
       - 保留中のリクエストが 1 件だけの場合は `/pair approve`
       - 最新のものには `/pair approve latest`

    セットアップコードは短命のブートストラップトークンを保持します。組み込みのブートストラップ引き渡しは、プライマリノードトークンを `scopes: []` のままにします。引き渡された operator token はすべて、`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されます。ブートストラップスコープチェックにはロール接頭辞が付くため、その operator allowlist は operator リクエストだけを満たします。非 operator ロールには引き続き自身のロール接頭辞配下のスコープが必要です。

    デバイスが変更された認証詳細（たとえばロール/スコープ/公開鍵）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストは別の `requestId` を使用します。承認する前に `/pair pending` を再実行してください。

    詳細: [ペアリング](/ja-JP/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="Inline buttons">
    インラインキーボードのスコープを設定します:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    アカウントごとの上書き:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    スコープ:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist`（デフォルト）

    レガシーの `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` にマップされます。

    メッセージアクションの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    コールバッククリックはテキストとしてエージェントに渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    Telegram ツールアクションには次が含まれます:

    - `sendMessage`（`to`、`content`、任意の `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、任意の `iconColor`、`iconCustomEmojiId`）

    チャンネルメッセージアクションは扱いやすいエイリアス（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）を公開します。

    ゲート制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（デフォルト: 無効）

    注記: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    ランタイム送信はアクティブな設定/シークレットのスナップショット（起動/リロード）を使用するため、アクションパスは送信ごとにアドホックな SecretRef 再解決を実行しません。

    リアクション削除セマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram は生成された出力内で明示的な返信スレッドタグをサポートします:

    - `[[reply_to_current]]` はトリガー元メッセージに返信します
    - `[[reply_to:<id>]]` は特定の Telegram メッセージ ID に返信します

    `channels.telegram.replyToMode` は処理を制御します:

    - `off`（デフォルト）
    - `first`
    - `all`

    返信スレッドが有効で、元の Telegram テキストまたはキャプションが利用可能な場合、OpenClaw はネイティブ Telegram 引用抜粋を自動的に含めます。Telegram はネイティブ引用テキストを 1024 UTF-16 コード単位に制限するため、長いメッセージは先頭から引用され、Telegram が引用を拒否した場合は通常の返信にフォールバックします。

    注記: `off` は暗黙的な返信スレッドを無効化します。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    フォーラムスーパーグループ:

    - トピックセッションキーは `:topic:<threadId>` を追加します
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック（`threadId=1`）の特別扱い:

    - メッセージ送信は `message_thread_id` を省略します（Telegram は `sendMessage(...thread_id=1)` を拒否します）
    - 入力中アクションには引き続き `message_thread_id` が含まれます

    トピック継承: トピック項目は上書きされない限り、グループ設定（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）を継承します。
    `agentId` はトピック専用で、グループのデフォルトから継承しません。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック設定で `agentId` を設定することで別のエージェントへルーティングできます。これにより、各トピックは独自に分離されたワークスペース、メモリ、セッションを持ちます。例:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    各トピックは次の独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続 ACP トピックバインディング**: フォーラムトピックは、トップレベルの型付き ACP バインディング（`type: "acp"` と `match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾 ID を持つ `bindings[]`）を通じて ACP ハーネスセッションを固定できます。現在はグループ/スーパーグループ内のフォーラムトピックに限定されています。[ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

    **チャットからのスレッド束縛 ACP spawn**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しい ACP セッションに束縛します。フォローアップはそこへ直接ルーティングされます。OpenClaw は spawn 確認をトピック内に固定します。`channels.telegram.threadBindings.spawnSessions` が有効のままである必要があります（デフォルト: `true`）。

    Template コンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは、デフォルトではフラットセッション上で DM ルーティングと返信メタデータを維持します。`threadReplies: "inbound"`、`threadReplies: "always"`、`requireTopic: true`、または一致するトピック設定が構成されている場合にのみ、スレッド対応のセッションキーを使用します。アカウントのデフォルトにはトップレベルの `channels.telegram.dm.threadReplies` を使用し、1 つの DM には `direct.<chatId>.threadReplies` を使用します。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram はボイスメモと音声ファイルを区別します。

    - デフォルト: 音声ファイルの動作
    - エージェントの返信内のタグ `[[audio_as_voice]]` でボイスメモ送信を強制
    - 受信したボイスメモの文字起こしは、エージェントコンテキスト内で機械生成の
      信頼できないテキストとして枠付けされます。メンション検出は引き続き生の
      文字起こしを使用するため、メンションゲート付きボイスメッセージは動作し続けます。

    メッセージアクションの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### 動画メッセージ

    Telegram は動画ファイルと動画メモを区別します。

    メッセージアクションの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    動画メモはキャプションをサポートしません。指定されたメッセージテキストは別途送信されます。

    ### ステッカー

    受信ステッカーの処理:

    - 静的 WEBP: ダウンロードして処理されます（プレースホルダー `<media:sticker>`）
    - アニメーション TGS: スキップされます
    - 動画 WEBM: スキップされます

    ステッカーコンテキストフィールド:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ステッカーキャッシュファイル:

    - `~/.openclaw/telegram/sticker-cache.json`

    ステッカーは（可能な場合）一度説明され、繰り返しのビジョン呼び出しを減らすためにキャッシュされます。

    ステッカーアクションを有効化:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    ステッカー送信アクション:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    キャッシュ済みステッカーを検索:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="リアクション通知">
    Telegram のリアクションは `message_reaction` 更新（メッセージペイロードとは別）として届きます。

    有効な場合、OpenClaw は次のようなシステムイベントをキューに入れます:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注:

    - `own` はボット送信メッセージへのユーザーリアクションのみを意味します（送信メッセージキャッシュによるベストエフォート）。
    - リアクションイベントは引き続き Telegram のアクセス制御（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）に従います。許可されていない送信者は破棄されます。
    - Telegram はリアクション更新でスレッド ID を提供しません。
      - 非フォーラムグループはグループチャットセッションにルーティングされます
      - フォーラムグループは正確な元トピックではなく、グループの一般トピックセッション（`:topic:1`）にルーティングされます

    ポーリング/Webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認用の絵文字を送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェント ID の絵文字フォールバック（`agents.list[].identity.emoji`、それ以外は "👀"）

    注:

    - Telegram は Unicode 絵文字（例: "👀"）を想定します。
    - チャンネルまたはアカウントのリアクションを無効化するには `""` を使用します。

  </Accordion>

  <Accordion title="Telegram イベントとコマンドからの設定書き込み">
    チャンネル設定の書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegram によってトリガーされる書き込みには次が含まれます:

    - `channels.telegram.groups` を更新するグループ移行イベント（`migrate_to_chat_id`）
    - `/config set` と `/config unset`（コマンドの有効化が必要）

    無効化:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="ロングポーリングと Webhook">
    デフォルトはロングポーリングです。Webhook モードでは `channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。任意で `webhookPath`、`webhookHost`、`webhookPort`（デフォルトは `/telegram-webhook`、`127.0.0.1`、`8787`）も設定できます。

    ローカルリスナーは `127.0.0.1:8787` にバインドします。公開インバウンドには、ローカルポートの前にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定します。

    Webhook モードは、Telegram に `200` を返す前に、リクエストガード、Telegram シークレットトークン、JSON 本文を検証します。
    その後 OpenClaw は、ロングポーリングと同じチャット単位/トピック単位のボットレーンを通じて更新を非同期に処理するため、遅いエージェントターンが Telegram の配信 ACK を保持しません。

  </Accordion>

  <Accordion title="制限、リトライ、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信の Telegram メディアサイズを制限します。
    - `channels.telegram.mediaGroupFlushMs`（デフォルト 500）は、OpenClaw が Telegram のアルバム/メディアグループを 1 つの受信メッセージとしてディスパッチする前に、どれだけ長くバッファするかを制御します。アルバムの各部分が遅れて届く場合は増やし、アルバム返信のレイテンシを減らす場合は減らします。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定の場合は grammY のデフォルトが適用されます）。ボットクライアントは、設定値が 60 秒の送信テキスト/入力中リクエストガードを下回る場合にクランプし、OpenClaw のトランスポートガードとフォールバックが実行される前に grammY が表示される返信配信を中断しないようにします。ロングポーリングでは引き続き 45 秒の `getUpdates` リクエストガードを使用するため、アイドルポーリングが無期限に放棄されることはありません。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。ポーリング停止の誤検知による再起動の場合のみ、`30000` から `600000` の間で調整します。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト 50）を使用します。`0` で無効化します。
    - 返信/引用/転送の補足コンテキストは、現在は受信したまま渡されます。
    - Telegram の許可リストは主に、誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキストの編集境界ではありません。
    - DM 履歴の制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、回復可能な送信 API エラーに対して Telegram 送信ヘルパー（CLI/ツール/アクション）に適用されます。受信の最終返信配信でも、Telegram の接続前失敗に対して境界付きの安全送信リトライを使用しますが、表示メッセージを重複させる可能性がある、送信後の曖昧なネットワークエンベロープはリトライしません。

    CLI とメッセージツールの送信ターゲットには、数値のチャット ID、ユーザー名、またはフォーラムトピックターゲットを使用できます:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram の投票は `openclaw message poll` を使用し、フォーラムトピックをサポートします:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 専用の投票フラグ:

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - フォーラムトピック用の `--thread-id`（または `:topic:` ターゲットを使用）

    Telegram 送信は次もサポートします:

    - `channels.telegram.capabilities.inlineButtons` が許可している場合、インラインキーボード用の `buttons` ブロックを含む `--presentation`
    - ボットがそのチャットでピン留めできる場合に、ピン留め配信を要求する `--pin` または `--delivery '{"pin":true}'`
    - 送信画像と GIF を、圧縮写真やアニメーションメディアアップロードではなくドキュメントとして送信する `--force-document`

    アクションのゲート:

    - `channels.telegram.actions.sendMessage=false` は、投票を含む送信 Telegram メッセージを無効化します
    - `channels.telegram.actions.poll=false` は、通常の送信を有効なままにして Telegram 投票の作成を無効化します

  </Accordion>

  <Accordion title="Telegram での Exec 承認">
    Telegram は承認者 DM で exec 承認をサポートし、任意で元のチャットまたはトピックにプロンプトを投稿できます。承認者は数値の Telegram ユーザー ID である必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled`（少なくとも 1 人の承認者を解決できる場合に自動有効化）
    - `channels.telegram.execApprovals.approvers`（`commands.ownerAllowFrom` の数値オーナー ID にフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom`、`defaultTo` は、誰がボットと会話できるか、および通常の返信をどこに送るかを制御します。これらは誰かを exec 承認者にするものではありません。まだコマンドオーナーが存在しない場合、最初に承認された DM ペアリングが `commands.ownerAllowFrom` をブートストラップするため、1 オーナー構成でも `execApprovals.approvers` の下で ID を重複させずに動作します。

    チャンネル配信ではコマンドテキストがチャットに表示されます。信頼できるグループ/トピックでのみ `channel` または `both` を有効化してください。プロンプトがフォーラムトピックに届く場合、OpenClaw は承認プロンプトと後続処理のためにトピックを保持します。Exec 承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンでは、`channels.telegram.capabilities.inlineButtons` がターゲットサーフェス（`dm`、`group`、または `all`）を許可していることも必要です。`plugin:` で始まる承認 ID は Plugin 承認を通じて解決され、それ以外はまず exec 承認を通じて解決されます。

    [Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信の制御

エージェントが配信エラーまたはプロバイダーエラーに遭遇した場合、Telegram はエラーテキストで返信するか、それを抑制できます。この動作は 2 つの設定キーで制御します:

| キー                                | 値                | デフォルト | 説明                                                                                       |
| ----------------------------------- | ----------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` はチャットに親しみやすいエラーメッセージを送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | 同じチャットへのエラー返信間の最小時間です。障害中のエラースパムを防ぎます。               |

アカウント単位、グループ単位、トピック単位の上書きがサポートされます（他の Telegram 設定キーと同じ継承）。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="ボットがメンションなしのグループメッセージに応答しない">

    - `requireMention=false` の場合、Telegram のプライバシーモードは完全な可視性を許可する必要があります。
      - BotFather: `/setprivacy` -> Disable
      - その後、ボットをグループから削除して再追加します
    - 設定がメンションなしのグループメッセージを想定している場合、`openclaw channels status` が警告します。
    - `openclaw channels status --probe` は明示的な数値のグループ ID を確認できます。ワイルドカード `"*"` はメンバーシップをプローブできません。
    - 簡易セッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、グループを一覧に含める必要があります（または `"*"` を含めます）
    - グループ内のボットメンバーシップを確認します
    - スキップ理由についてログを確認します: `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが一部しか動作しない、またはまったく動作しない">

    - 送信者 ID を承認します（ペアリングおよび/または数値の `allowFrom`）
    - グループポリシーが `open` の場合でも、コマンド承認は引き続き適用されます
    - `BOT_COMMANDS_TOO_MUCH` による `setMyCommands failed` は、ネイティブメニューの項目が多すぎることを意味します。Plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効にしてください
    - `deleteMyCommands` / `setMyCommands` の起動時呼び出しと `sendChatAction` の入力中呼び出しは制限され、リクエストタイムアウト時には Telegram のトランスポートフォールバック経由で 1 回再試行します。永続的なネットワーク/フェッチエラーは通常、`api.telegram.org` への DNS/HTTPS 到達性の問題を示します

  </Accordion>

  <Accordion title="起動時に未承認トークンが報告される">

    - `getMe returned 401` は、設定されたボットトークンに対する Telegram 認証失敗です。
    - BotFather でボットトークンを再コピーまたは再生成し、既定アカウントの `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken`、または `TELEGRAM_BOT_TOKEN` を更新します。
    - 起動中の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「webhook が存在しない」と扱うと、同じ不正なトークンの失敗を後続の API 呼び出しまで先送りするだけです。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - Node 22+ とカスタム fetch/proxy の組み合わせでは、AbortSignal 型が一致しない場合に即時中断の動作を引き起こすことがあります。
    - 一部のホストは `api.telegram.org` を最初に IPv6 へ解決します。IPv6 の外向き通信が壊れていると、Telegram API の断続的な失敗が発生することがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw はこれらを回復可能なネットワークエラーとして再試行します。
    - ポーリング起動中、OpenClaw は grammY 用に成功した起動時の `getMe` プローブを再利用するため、ランナーは最初の `getUpdates` の前に 2 回目の `getMe` を必要としません。
    - ポーリング起動中に `deleteWebhook` が一時的なネットワークエラーで失敗した場合、OpenClaw は別のポーリング前の制御プレーン呼び出しを行わず、ロングポーリングへ進みます。まだアクティブな webhook は `getUpdates` の競合として表面化します。その後 OpenClaw は Telegram トランスポートを再構築し、webhook のクリーンアップを再試行します。
    - Telegram ソケットが短い固定周期で再利用される場合は、`channels.telegram.timeoutSeconds` が低すぎないか確認してください。ボットクライアントは、外向き通信および `getUpdates` リクエストガードより低い設定値をクランプしますが、古いリリースではこの値がそれらのガードより低いと、すべてのポーリングまたは返信が中断されることがありました。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw は既定で、完了したロングポールの生存確認が 120 秒間ない場合にポーリングを再起動し、Telegram トランスポートを再構築します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中のポーリングアカウントが起動猶予後に `getUpdates` を完了していない場合、実行中の webhook アカウントが起動猶予後に `setWebhook` を完了していない場合、または最後に成功したポーリングトランスポートアクティビティが古くなっている場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しは正常だが、ホストがポーリング停止の誤検知による再起動を報告する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。永続的な停止は通常、ホストと `api.telegram.org` の間の proxy、DNS、IPv6、または TLS 外向き通信の問題を示します。
    - Telegram は Bot API トランスポートについても、`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` とそれらの小文字バリアントを含む、プロセスの proxy 環境変数を尊重します。`NO_PROXY` / `no_proxy` は引き続き `api.telegram.org` をバイパスできます。
    - サービス環境向けに OpenClaw 管理 proxy が `OPENCLAW_PROXY_URL` で設定されており、標準の proxy 環境変数が存在しない場合、Telegram もその URL を Bot API トランスポートに使用します。
    - 直接の外向き通信/TLS が不安定な VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由でルーティングします。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ は既定で `autoSelectFamily=true` です（WSL2 を除く）。Telegram の DNS 結果順序は、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、次に `channels.telegram.network.dnsResultOrder`、次に `NODE_OPTIONS=--dns-result-order=ipv4first` などのプロセス既定値に従います。どれも適用されない場合、Node 22+ は `ipv4first` にフォールバックします。
    - ホストが WSL2 の場合、または IPv4 のみの動作のほうが明示的にうまく機能する場合は、ファミリー選択を強制します。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、Telegram メディアダウンロードでは既定で許可済みです。信頼済みの fake-IP または透過 proxy が、メディアダウンロード中に `api.telegram.org` を他のプライベート/内部/特殊用途アドレスへ書き換える場合は、Telegram のみのバイパスをオプトインできます。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインは、アカウントごとに
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
      でも利用できます。
    - proxy が Telegram メディアホストを `198.18.x.x` に解決する場合は、まず危険なフラグをオフのままにしてください。Telegram メディアは既定で RFC 2544 ベンチマーク範囲をすでに許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram
      メディアの SSRF 保護を弱めます。Clash、Mihomo、Surge の fake-IP ルーティングのように、RFC 2544 ベンチマーク範囲外のプライベートまたは特殊用途の応答を合成する、信頼済みのオペレーター管理 proxy 環境でのみ使用してください。通常の公共インターネット経由の Telegram アクセスではオフのままにしてください。
    </Warning>

    - 環境オーバーライド（一時的）:
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS 応答を検証します。

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

さらにヘルプ: [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主要リファレンス: [設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="重要度の高い Telegram フィールド">

- 起動/認証: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指す必要があります。シンボリックリンクは拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, トップレベルの `bindings[]`（`type: "acp"`）
- 実行承認: `execApprovals`, `accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`, `commands.nativeSkills`, `customCommands`
- スレッド/返信: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- ストリーミング: `streaming`（プレビュー）, `streaming.preview.toolProgress`, `blockStreaming`
- 書式/配信: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- カスタム API ルート: `apiRoot`（Bot API ルートのみ。`/bot<TOKEN>` は含めないでください）
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- アクション/機能: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`, `reactionLevel`
- エラー: `errorPolicy`, `errorCooldownMs`
- 書き込み/履歴: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
複数アカウントの優先順位: 2 つ以上のアカウント ID が設定されている場合は、既定ルーティングを明示するために `channels.telegram.defaultAccount` を設定します（または `channels.telegram.accounts.default` を含めます）。そうでない場合、OpenClaw は最初の正規化済みアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram ユーザーを Gateway とペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループとトピックの許可リストの動作。
  </Card>
  <Card title="チャネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントへルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと強化。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントにマッピングします。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断。
  </Card>
</CardGroup>
