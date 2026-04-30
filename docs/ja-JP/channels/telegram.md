---
read_when:
    - Telegram機能またはWebhookに取り組む
summary: Telegram ボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-04-30T05:00:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ffc0c1a6bb94fbab81ede0f08b0e3a165f06c599d4d06d4b9e70c8ba41121f7
    source_path: channels/telegram.md
    workflow: 16
---

grammYにより、ボットのDMとグループで本番運用可能です。デフォルトのモードはロングポーリングです。Webhookモードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    TelegramのデフォルトDMポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    複数チャネルにまたがる診断と修復手順集。
  </Card>
  <Card title="Gateway設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例。
  </Card>
</CardGroup>

## 簡単なセットアップ

<Steps>
  <Step title="BotFatherでボットトークンを作成する">
    Telegramを開き、**@BotFather** とチャットします（ハンドルが正確に `@BotFather` であることを確認してください）。

    `/newbot` を実行し、プロンプトに従って、トークンを保存します。

  </Step>

  <Step title="トークンとDMポリシーを設定する">

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

    envフォールバック: `TELEGRAM_BOT_TOKEN=...`（デフォルトアカウントのみ）。
    Telegramは `openclaw channels login telegram` を使用**しません**。config/envでトークンを設定してから、gatewayを起動してください。

  </Step>

  <Step title="gatewayを起動し、最初のDMを承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは1時間後に期限切れになります。

  </Step>

  <Step title="ボットをグループに追加する">
    ボットをグループに追加してから、アクセスモデルに合うように `channels.telegram.groups` と `groupPolicy` を設定します。
  </Step>
</Steps>

<Note>
トークンの解決順序はアカウントを考慮します。実際には、config値がenvフォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループの可視性">
    Telegramボットはデフォルトで**プライバシーモード**になっており、受信できるグループメッセージが制限されます。

    ボットがすべてのグループメッセージを確認する必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする、または
    - ボットをグループ管理者にする。

    プライバシーモードを切り替えるときは、Telegramが変更を適用できるよう、各グループでボットを削除してから再追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスはTelegramグループ設定で制御します。

    管理者ボットはすべてのグループメッセージを受信するため、常時稼働するグループ動作に便利です。

  </Accordion>

  <Accordion title="便利なBotFather切り替え">

    - グループ追加を許可/拒否するには `/setjoingroups`
    - グループの可視性動作には `/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

<Tabs>
  <Tab title="DMポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージのアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも1つの送信者IDが必要）
    - `open`（`allowFrom` に `"*"` を含める必要あり）
    - `disabled`

    `dmPolicy: "open"` と `allowFrom: ["*"]` を組み合わせると、ボットのユーザー名を見つけた、または推測した任意のTelegramアカウントがボットに命令できるようになります。意図的に公開するボットで、ツールを厳密に制限している場合にのみ使用してください。単一所有者のボットでは、数値ユーザーIDを指定した `allowlist` を使用してください。

    `channels.telegram.allowFrom` は数値のTelegramユーザーIDを受け付けます。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    複数アカウント構成では、制限的なトップレベルの `channels.telegram.allowFrom` は安全境界として扱われます。アカウントレベルの `allowFrom: ["*"]` エントリは、マージ後の有効なアカウント許可リストに明示的なワイルドカードがまだ含まれていない限り、そのアカウントを公開状態にはしません。
    空の `allowFrom` と組み合わせた `dmPolicy: "allowlist"` はすべてのDMをブロックし、設定検証で拒否されます。
    セットアップでは数値ユーザーIDのみを求めます。
    アップグレード後にconfigに `@username` 許可リストエントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォート。Telegramボットトークンが必要です）。
    以前にペアリングストアの許可リストファイルに依存していた場合、`openclaw doctor --fix` は許可リストフローでエントリを `channels.telegram.allowFrom` に復元できます（たとえば `dmPolicy: "allowlist"` に明示的なIDがまだない場合）。

    単一所有者のボットでは、明示的な数値 `allowFrom` IDを指定した `dmPolicy: "allowlist"` を推奨します。これにより、以前のペアリング承認に依存せず、アクセスポリシーをconfig内で永続化できます。

    よくある混同: DMペアリングの承認は「この送信者がどこでも認可されている」という意味ではありません。
    ペアリングはDMアクセスを付与します。コマンド所有者がまだ存在しない場合、最初に承認されたペアリングは `commands.ownerAllowFrom` も設定し、所有者専用コマンドとexec承認に明示的なオペレーターアカウントを与えます。
    グループ送信者の認可は、引き続き明示的なconfig許可リストから取得されます。
    「一度認可されればDMとグループコマンドの両方が機能する」状態にしたい場合は、数値のTelegramユーザーIDを `channels.telegram.allowFrom` に入れてください。所有者専用コマンドの場合は、`commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### TelegramユーザーIDを見つける

    より安全な方法（サードパーティボットなし）:

    1. 自分のボットにDMします。
    2. `openclaw logs --follow` を実行します。
    3. `from.id` を読み取ります。

    公式Bot APIの方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシーは低め）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと許可リスト">
    2つの制御が一緒に適用されます。

    1. **許可されるグループ**（`channels.telegram.groups`）
       - `groups` configがない場合:
         - `groupPolicy: "open"` の場合: 任意のグループがグループIDチェックを通過できます
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされます
       - `groups` が設定されている場合: 許可リストとして動作します（明示的なIDまたは `"*"`）

    2. **グループ内で許可される送信者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者のフィルタリングに使用されます。設定されていない場合、Telegramは `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値のTelegramユーザーIDにする必要があります（`telegram:` / `tg:` プレフィックスは正規化されます）。
    TelegramグループまたはスーパーグループのチャットIDを `groupAllowFrom` に入れないでください。負のチャットIDは `channels.telegram.groups` に属します。
    数値以外のエントリは送信者認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認証はDMペアリングストア承認を継承**しません**。
    ペアリングはDM専用のままです。グループでは、`groupAllowFrom` またはグループ別/トピック別の `allowFrom` を設定します。
    `groupAllowFrom` が未設定の場合、Telegramはペアリングストアではなく、configの `allowFrom` にフォールバックします。
    単一所有者ボットの実用的なパターン: ユーザーIDを `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` で許可します。
    ランタイム注記: `channels.telegram` が完全に欠落している場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムのデフォルトはfail-closedの `groupPolicy="allowlist"` です。

    例: 1つの特定グループで任意のメンバーを許可する:

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

    例: 1つの特定グループ内で特定ユーザーのみを許可する:

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
      よくある間違い: `groupAllowFrom` はTelegramグループの許可リストではありません。

      - `-1001234567890` のような負のTelegramグループまたはスーパーグループのチャットIDは `channels.telegram.groups` に入れてください。
      - 許可されたグループ内のどの人がボットをトリガーできるかを制限したい場合は、`8734062810` のようなTelegramユーザーIDを `groupAllowFrom` に入れてください。
      - 許可されたグループの任意のメンバーがボットと会話できるようにしたい場合にのみ、`groupAllowFrom: ["*"]` を使用してください。

    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信はデフォルトでメンションを必要とします。

    メンションは次から取得できます。

    - ネイティブの `@botusername` メンション、または
    - 次のメンションパターン:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンド切り替え:

    - `/activation always`
    - `/activation mention`

    これらはセッション状態のみを更新します。永続化にはconfigを使用してください。

    永続configの例:

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

    グループチャットIDを取得する方法:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` から `chat.id` を読み取る
    - またはBot APIの `getUpdates` を調べる

  </Tab>
</Tabs>

## ランタイム動作

- Telegramはgatewayプロセスが所有します。
- ルーティングは決定的です。Telegramの受信メッセージにはTelegramへ返信します（モデルはチャネルを選択しません）。
- 受信メッセージは、返信メタデータとメディアプレースホルダーを含む共有チャネルエンベロープに正規化されます。
- グループセッションはグループIDで分離されます。フォーラムトピックでは、トピックを分離するために `:topic:<threadId>` が追加されます。
- DMメッセージは `message_thread_id` を含めることができます。OpenClawはスレッド対応のセッションキーでそれらをルーティングし、返信用にスレッドIDを保持します。
- ロングポーリングは、チャット別/スレッド別のシーケンシングを伴うgrammY runnerを使用します。全体のrunner sink同時実行数は `agents.defaults.maxConcurrent` を使用します。
- ロングポーリングは各gatewayプロセス内で保護されるため、一度に1つのアクティブなポーラーだけがボットトークンを使用できます。それでも `getUpdates` の409競合が表示される場合は、別のOpenClaw gateway、スクリプト、または外部ポーラーが同じトークンを使用している可能性があります。
- ロングポーリングのwatchdog再起動は、デフォルトで完了した `getUpdates` のlivenessが120秒間ない場合にトリガーされます。デプロイで長時間実行中の作業中に誤ったポーリング停止再起動がまだ発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒単位で、`30000` から `600000` まで許可されます。アカウント別の上書きもサポートされています。
- Telegram Bot APIには既読確認のサポートがありません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClawは部分返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress` です（デフォルト: `partial`）
    - Telegramでは `progress` は `partial` にマッピングされます（複数チャネル命名との互換性）
    - `streaming.preview.toolProgress` は、ツール/進行状況の更新で同じ編集済みプレビューメッセージを再利用するかどうかを制御します（デフォルト: プレビューストリーミングが有効な場合は `true`）
    - レガシーの `channels.telegram.streamMode` と真偽値の `streaming` 値は検出されます。`openclaw doctor --fix` を実行して、それらを `channels.telegram.streaming.mode` に移行してください。

    ツール進行状況のプレビュー更新は、ツール実行中に表示される短い「Working...」行です。たとえば、コマンド実行、ファイル読み取り、計画更新、パッチ要約などです。Telegramでは、`v2026.4.22` 以降のリリース済みOpenClaw動作と一致させるため、これらはデフォルトで有効になっています。回答テキスト用の編集済みプレビューは維持し、ツール進行状況行を非表示にするには、次を設定します。

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

    最終結果のみを配信したい場合にのみ、`streaming.mode: "off"` を使用してください。Telegramのプレビュー編集は無効になり、汎用のツール/進行状況の雑談は、独立した「Working...」メッセージとして送信される代わりに抑制されます。承認プロンプト、メディアペイロード、エラーは引き続き通常の最終配信を通じてルーティングされます。ツール進行状況のステータス行を非表示にしつつ回答プレビュー編集だけを維持したい場合は、`streaming.preview.toolProgress: false` を使用してください。

    テキストのみの返信の場合:

    - 短い DM/グループ/トピックのプレビュー: OpenClaw は同じプレビューメッセージを保持し、その場で最終編集を行います
    - 約 1 分より古いプレビュー: OpenClaw は完了した返信を新しい最終メッセージとして送信してからプレビューをクリーンアップするため、Telegram の表示タイムスタンプはプレビュー作成時刻ではなく完了時刻を反映します

    複雑な返信（たとえばメディアペイロード）の場合、OpenClaw は通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューストリーミングはブロックストリーミングとは別です。Telegram でブロックストリーミングが明示的に有効になっている場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

    ネイティブのドラフト転送が利用できない、または拒否された場合、OpenClaw は自動的に `sendMessage` + `editMessageText` にフォールバックします。

    Telegram 専用の推論ストリーム:

    - `/reasoning stream` は生成中に推論をライブプレビューへ送信します
    - 最終回答は推論テキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定と HTML フォールバック">
    送信テキストは Telegram `parse_mode: "HTML"` を使用します。

    - Markdown 風のテキストは Telegram で安全な HTML にレンダリングされます。
    - 生のモデル HTML は、Telegram の解析失敗を減らすためにエスケープされます。
    - Telegram が解析済み HTML を拒否した場合、OpenClaw はプレーンテキストとして再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効にできます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
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

    - 名前は正規化されます（先頭の `/` を取り除き、小文字化）
    - 有効なパターン: `a-z`、`0-9`、`_`、長さ `1..32`
    - カスタムコマンドはネイティブコマンドを上書きできません
    - 競合や重複はスキップされ、ログに記録されます

    注記:

    - カスタムコマンドはメニュー項目のみです。動作は自動実装されません
    - Plugin/skill コマンドは、Telegram メニューに表示されていなくても入力時に引き続き動作できます

    ネイティブコマンドが無効な場合、組み込み項目は削除されます。設定されていれば、カスタム/Plugin コマンドは引き続き登録される場合があります。

    一般的なセットアップ失敗:

    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、トリミング後も Telegram メニューが上限を超えたことを意味します。Plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - 直接の Bot API curl コマンドは動作するのに、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合、`channels.telegram.apiRoot` が完全な `/bot<TOKEN>` エンドポイントに設定されていた可能性があります。`apiRoot` は Bot API ルートのみである必要があり、`openclaw doctor --fix` は誤って末尾に付いた `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、Telegram が設定済み bot トークンを拒否したことを意味します。`botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN` を現在の BotFather トークンで更新してください。OpenClaw はポーリング前に停止するため、これは Webhook クリーンアップ失敗としては報告されません。
    - ネットワーク/fetch エラーを伴う `setMyCommands failed` は通常、`api.telegram.org` への送信 DNS/HTTPS がブロックされていることを意味します。

    ### デバイスペアリングコマンド（`device-pair` Plugin）

    `device-pair` Plugin がインストールされている場合:

    1. `/pair` がセットアップコードを生成します
    2. iOS アプリにコードを貼り付けます
    3. `/pair pending` が保留中のリクエストを一覧表示します（ロール/スコープを含む）
    4. リクエストを承認します:
       - 明示的な承認には `/pair approve <requestId>`
       - 保留中のリクエストが 1 件だけの場合は `/pair approve`
       - 最新のものには `/pair approve latest`

    セットアップコードは短命のブートストラップトークンを保持します。組み込みのブートストラップ引き渡しはプライマリノードトークンを `scopes: []` に保ちます。引き渡されたオペレータートークンは `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されます。ブートストラップのスコープチェックにはロール接頭辞が付くため、そのオペレーター許可リストはオペレーターリクエストのみを満たします。非オペレーターロールには引き続き、それぞれのロール接頭辞配下のスコープが必要です。

    デバイスが変更された認証詳細（たとえばロール/スコープ/公開鍵）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストは別の `requestId` を使用します。承認前に `/pair pending` を再実行してください。

    詳細: [ペアリング](/ja-JP/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="インラインボタン">
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

    旧式の `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` にマップされます。

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

  <Accordion title="エージェントと自動化向け Telegram メッセージアクション">
    Telegram ツールアクションには以下が含まれます:

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
    ランタイム送信はアクティブな設定/シークレットのスナップショット（起動/リロード時）を使用するため、アクションパスは送信ごとにアドホックな SecretRef 再解決を行いません。

    リアクション削除セマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッドタグ">
    Telegram は生成出力内の明示的な返信スレッドタグをサポートします:

    - `[[reply_to_current]]` はトリガー元メッセージに返信します
    - `[[reply_to:<id>]]` は特定の Telegram メッセージ ID に返信します

    `channels.telegram.replyToMode` は処理を制御します:

    - `off`（デフォルト）
    - `first`
    - `all`

    返信スレッドが有効で、元の Telegram テキストまたはキャプションが利用可能な場合、OpenClaw はネイティブ Telegram 引用抜粋を自動的に含めます。Telegram はネイティブ引用テキストを 1024 UTF-16 コード単位に制限するため、長いメッセージは先頭から引用され、Telegram が引用を拒否した場合はプレーンな返信にフォールバックします。

    注記: `off` は暗黙的な返信スレッドを無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッドの動作">
    フォーラムスーパーグループ:

    - トピックセッションキーは `:topic:<threadId>` を追加します
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック（`threadId=1`）の特殊ケース:

    - メッセージ送信では `message_thread_id` を省略します（Telegram は `sendMessage(...thread_id=1)` を拒否します）
    - 入力中アクションには引き続き `message_thread_id` が含まれます

    トピック継承: トピックエントリは、上書きされない限りグループ設定（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）を継承します。
    `agentId` はトピック専用であり、グループのデフォルトから継承されません。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック設定で `agentId` を設定することで別のエージェントへルーティングできます。これにより、各トピックは独自に分離されたワークスペース、メモリ、セッションを持てます。例:

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

    各トピックはその後、独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続的な ACP トピックバインディング**: フォーラムトピックは、トップレベルの型付き ACP バインディング（`bindings[]`、`type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾 ID）を通じて ACP ハーネスセッションを固定できます。現在はグループ/スーパーグループ内のフォーラムトピックにスコープされています。[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

    **チャットからのスレッドバインド ACP 生成**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しい ACP セッションにバインドします。後続のやり取りはそこへ直接ルーティングされます。OpenClaw は生成確認をトピック内にピン留めします。`channels.telegram.threadBindings.spawnAcpSessions=true` が必要です。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは DM ルーティングを維持しつつ、スレッド対応のセッションキーを使用します。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram はボイスメモと音声ファイルを区別します。

    - デフォルト: 音声ファイルの動作
    - エージェント返信内のタグ `[[audio_as_voice]]` でボイスメモ送信を強制します
    - 受信したボイスメモの文字起こしは、エージェントコンテキスト内で機械生成の信頼できないテキストとして枠付けされます。メンション検出は引き続き生の文字起こしを使用するため、メンションでゲートされた音声メッセージは動作し続けます。

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

    Telegram は動画ファイルとビデオノートを区別します。

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

    ビデオノートはキャプションをサポートしません。指定されたメッセージテキストは別途送信されます。

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

    ステッカーは（可能な場合）一度だけ説明され、繰り返しのビジョン呼び出しを減らすためにキャッシュされます。

    ステッカーアクションを有効にします:

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

    キャッシュされたステッカーを検索します:

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
    Telegram リアクションは `message_reaction` 更新として届きます（メッセージペイロードとは別）。

    有効な場合、OpenClaw は次のようなシステムイベントをキューに入れます:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all` (デフォルト: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (デフォルト: `minimal`)

    注:

    - `own` は、ボットが送信したメッセージに対するユーザーのリアクションのみを意味します (送信済みメッセージキャッシュによるベストエフォート)。
    - リアクションイベントも Telegram のアクセス制御 (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) に従います。未許可の送信者は破棄されます。
    - Telegram はリアクション更新でスレッド ID を提供しません。
      - 非フォーラムグループはグループチャットセッションにルーティングされます
      - フォーラムグループは、正確な発生元トピックではなく、グループの一般トピックセッション (`:topic:1`) にルーティングされます

    ポーリング/Webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認用の絵文字を送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェント ID の絵文字フォールバック (`agents.list[].identity.emoji`、それ以外は "👀")

    注:

    - Telegram は Unicode 絵文字 (例: "👀") を想定しています。
    - チャネルまたはアカウントでリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="Telegram イベントとコマンドからの設定書き込み">
    チャネル設定の書き込みはデフォルトで有効です (`configWrites !== false`)。

    Telegram によってトリガーされる書き込みには次が含まれます。

    - `channels.telegram.groups` を更新するためのグループ移行イベント (`migrate_to_chat_id`)
    - `/config set` と `/config unset` (コマンドの有効化が必要)

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
    デフォルトはロングポーリングです。Webhook モードでは `channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。任意で `webhookPath`, `webhookHost`, `webhookPort` も設定できます (デフォルトは `/telegram-webhook`, `127.0.0.1`, `8787`)。

    ローカルリスナーは `127.0.0.1:8787` にバインドします。公開 ingress では、ローカルポートの前にリバースプロキシを置くか、意図して `webhookHost: "0.0.0.0"` を設定します。

    Webhook モードは、Telegram に `200` を返す前に、リクエストガード、Telegram シークレットトークン、JSON 本文を検証します。
    その後 OpenClaw は、ロングポーリングで使用されるものと同じチャットごと/トピックごとのボットレーンを通じて更新を非同期に処理するため、遅いエージェントターンが Telegram の配信 ACK を保持することはありません。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界 (空行) を優先します。
    - `channels.telegram.mediaMaxMb` (デフォルト 100) は、受信および送信 Telegram メディアサイズを制限します。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします (未設定の場合は grammY のデフォルトが適用されます)。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。ポーリング停止再起動の誤検知に対してのみ、`30000` から `600000` の間で調整してください。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit` (デフォルト 50) を使用します。`0` で無効化します。
    - 返信/引用/転送の補足コンテキストは現在、受信したまま渡されます。
    - Telegram の許可リストは主に、誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキストの墨消し境界ではありません。
    - DM 履歴制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、回復可能な送信 API エラーに対して Telegram 送信ヘルパー (CLI/ツール/アクション) に適用されます。受信の最終返信配信も、Telegram の接続前失敗に対して境界付きの安全送信再試行を使用しますが、表示されるメッセージが重複する可能性がある曖昧な送信後ネットワークエンベロープは再試行しません。

    CLI 送信ターゲットには、数値チャット ID またはユーザー名を指定できます。

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram の投票は `openclaw message poll` を使用し、フォーラムトピックをサポートします。

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 専用の投票フラグ:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - フォーラムトピック用の `--thread-id` (または `:topic:` ターゲットを使用)

    Telegram 送信は次もサポートします。

    - `channels.telegram.capabilities.inlineButtons` が許可する場合、インラインキーボード用の `buttons` ブロックを含む `--presentation`
    - そのチャットでボットがピン留めできる場合に、ピン留め配信を要求する `--pin` または `--delivery '{"pin":true}'`
    - 送信画像と GIF を、圧縮写真またはアニメーションメディアアップロードではなくドキュメントとして送信する `--force-document`

    アクションのゲート制御:

    - `channels.telegram.actions.sendMessage=false` は、投票を含む Telegram 送信メッセージを無効にします
    - `channels.telegram.actions.poll=false` は、通常の送信を有効にしたまま Telegram 投票の作成を無効にします

  </Accordion>

  <Accordion title="Telegram での exec 承認">
    Telegram は承認者 DM で exec 承認をサポートし、任意で発生元のチャットまたはトピックにプロンプトを投稿できます。承認者は数値の Telegram ユーザー ID である必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled` (少なくとも 1 人の承認者を解決できる場合に自動有効化)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` の数値オーナー ID にフォールバック)
    - `channels.telegram.execApprovals.target`: `dm` (デフォルト) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, `defaultTo` は、誰がボットと会話できるか、通常の返信をどこに送信するかを制御します。これらは誰かを exec 承認者にするものではありません。コマンドオーナーがまだ存在しない場合、最初に承認された DM ペアリングが `commands.ownerAllowFrom` をブートストラップするため、1 オーナー構成でも `execApprovals.approvers` の下で ID を重複させずに動作します。

    チャネル配信ではコマンドテキストがチャットに表示されます。信頼できるグループ/トピックでのみ `channel` または `both` を有効にしてください。プロンプトがフォーラムトピックに到達した場合、OpenClaw は承認プロンプトとフォローアップでそのトピックを保持します。exec 承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンには、`channels.telegram.capabilities.inlineButtons` がターゲットサーフェス (`dm`, `group`, `all`) を許可していることも必要です。`plugin:` で始まる承認 ID は Plugin 承認を通じて解決され、それ以外は最初に exec 承認を通じて解決されます。

    [Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信制御

エージェントで配信エラーまたはプロバイダーエラーが発生した場合、Telegram はエラーテキストで返信するか、それを抑制できます。この動作は 2 つの設定キーで制御します。

| キー                                 | 値            | デフォルト | 説明                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` はチャットに親しみやすいエラーメッセージを送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | 数値 (ms)       | `60000` | 同じチャットへのエラー返信の最小間隔。障害中のエラースパムを防ぎます。        |

アカウントごと、グループごと、トピックごとの上書きがサポートされています (他の Telegram 設定キーと同じ継承)。

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
  <Accordion title="メンションのないグループメッセージにボットが応答しない">

    - `requireMention=false` の場合、Telegram プライバシーモードは完全な可視性を許可する必要があります。
      - BotFather: `/setprivacy` -> 無効化
      - その後、ボットをグループから削除して再追加します
    - 設定がメンションなしのグループメッセージを想定している場合、`openclaw channels status` が警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認できます。ワイルドカード `"*"` はメンバーシッププローブできません。
    - 簡易セッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、グループがリストされている必要があります (または `"*"` を含める)
    - グループ内のボットメンバーシップを確認します
    - スキップ理由についてログを確認します: `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが部分的にしか動作しない、またはまったく動作しない">

    - 送信者 ID を認可します (ペアリングおよび/または数値の `allowFrom`)
    - グループポリシーが `open` の場合でも、コマンド認可は引き続き適用されます
    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、ネイティブメニューの項目が多すぎることを意味します。Plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効にしてください
    - `deleteMyCommands` / `setMyCommands` の起動時呼び出しは境界付きで、リクエストタイムアウト時に Telegram のトランスポートフォールバックを通じて 1 回再試行します。永続的なネットワーク/fetch エラーは通常、`api.telegram.org` への DNS/HTTPS 到達性の問題を示します

  </Accordion>

  <Accordion title="起動時に未認可トークンが報告される">

    - `getMe returned 401` は、設定されたボットトークンに対する Telegram 認証失敗です。
    - BotFather でボットトークンを再コピーまたは再生成し、デフォルトアカウントの `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, または `TELEGRAM_BOT_TOKEN` を更新します。
    - 起動時の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「Webhook が存在しない」として扱うと、同じ不正なトークンによる失敗を後続の API 呼び出しまで遅らせるだけです。
    - ポーリング起動中に一時的なネットワークエラーで `deleteWebhook` が失敗した場合、OpenClaw は `getWebhookInfo` を確認します。Telegram が空の Webhook URL を報告した場合、クリーンアップはすでに満たされているため、ポーリングは続行されます。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定さ">

    - Node 22+ + カスタム fetch/proxy は、AbortSignal 型が一致しない場合に即時中断動作を引き起こすことがあります。
    - 一部のホストは `api.telegram.org` を最初に IPv6 に解決します。IPv6 送信が壊れていると、Telegram API の断続的な失敗が発生することがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw はこれらを回復可能なネットワークエラーとして再試行するようになりました。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw は完了したロングポーリングの生存確認がデフォルトで 120 秒間ないと、ポーリングを再起動し、Telegram transport を再構築します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中のポーリングアカウントが起動猶予後に `getUpdates` を完了していない場合、実行中の webhook アカウントが起動猶予後に `setWebhook` を完了していない場合、または最後に成功したポーリング transport activity が古い場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しが正常であるにもかかわらず、ホストが誤ったポーリング停滞再起動を報告する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。永続的な停滞は通常、ホストと `api.telegram.org` の間の proxy、DNS、IPv6、または TLS 送信の問題を示します。
    - Telegram は Bot API transport に対して process proxy env も尊重します。これには `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` と、それらの小文字バリアントが含まれます。`NO_PROXY` / `no_proxy` は引き続き `api.telegram.org` をバイパスできます。
    - サービス環境で OpenClaw managed proxy が `OPENCLAW_PROXY_URL` を通じて構成され、標準 proxy env が存在しない場合、Telegram も Bot API transport にその URL を使用します。
    - 不安定な直接送信/TLS を持つ VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由でルーティングします。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ はデフォルトで `autoSelectFamily=true`（WSL2 を除く）および `dnsResultOrder=ipv4first` です。
    - ホストが WSL2 であるか、IPv4 のみの動作のほうが明示的に適している場合は、family selection を強制します。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 benchmark-range の応答（`198.18.0.0/15`）は、Telegram media downloads ではデフォルトですでに許可されています。信頼済みの fake-IP または
      transparent proxy が media downloads 中に `api.telegram.org` を別の
      private/internal/special-use アドレスへ書き換える場合は、Telegram のみのバイパスを
      opt in できます。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じ opt-in はアカウント単位でも
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` で利用できます。
    - proxy が Telegram media hosts を `198.18.x.x` に解決する場合は、まず
      dangerous flag をオフのままにしてください。Telegram media は RFC 2544
      benchmark range をデフォルトですでに許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram
      media SSRF 保護を弱めます。Clash、Mihomo、Surge の fake-IP ルーティングのように、RFC 2544 benchmark
      range 外の private または special-use 応答を合成する、信頼済みの operator-controlled proxy
      環境にのみ使用してください。通常の public internet Telegram アクセスではオフのままにしてください。
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

## 構成リファレンス

主要リファレンス: [構成リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="高シグナルな Telegram フィールド">

- 起動/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指す必要があります。symlink は拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, top-level `bindings[]` (`type: "acp"`)
- exec 承認: `execApprovals`, `accounts.*.execApprovals`
- コマンド/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- スレッド/replies: `replyToMode`
- ストリーミング: `streaming`（preview）, `streaming.preview.toolProgress`, `blockStreaming`
- フォーマット/配信: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/ネットワーク: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- カスタム API ルート: `apiRoot`（Bot API ルートのみ。`/bot<TOKEN>` は含めないでください）
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- アクション/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`, `reactionLevel`
- エラー: `errorPolicy`, `errorCooldownMs`
- 書き込み/history: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
マルチアカウントの優先順位: 2 つ以上のアカウント ID が構成されている場合は、デフォルトルーティングを明示するために `channels.telegram.defaultAccount` を設定する（または `channels.telegram.accounts.default` を含める）必要があります。そうしない場合、OpenClaw は最初の正規化されたアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram ユーザーを gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループとトピックの allowlist 動作。
  </Card>
  <Card title="チャネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと強化。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントにマッピングします。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    クロスチャネル診断。
  </Card>
</CardGroup>
