---
read_when:
    - Telegram の機能または Webhook に取り組む
summary: Telegram ボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-05-04T07:02:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ef1b019a6a0e261b33972b5edffaedd29310b1333d112bade2e79e9d56887c6
    source_path: channels/telegram.md
    workflow: 16
---

grammY 経由のボット DM とグループで本番環境対応です。ロングポーリングが既定のモードです。Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram の既定の DM ポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復プレイブックです。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例です。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFather でボットトークンを作成する">
    Telegram を開いて **@BotFather** とチャットします（ハンドルが正確に `@BotFather` であることを確認してください）。

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

    環境変数フォールバック: `TELEGRAM_BOT_TOKEN=...`（既定アカウントのみ）。
    Telegram は `openclaw channels login telegram` を使用しません。設定/env でトークンを構成してから、Gateway を起動してください。

  </Step>

  <Step title="Gateway を起動し、最初の DM を承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは 1 時間後に期限切れになります。

  </Step>

  <Step title="ボットをグループに追加する">
    ボットをグループに追加してから、アクセスモデルに合わせて `channels.telegram.groups` と `groupPolicy` を設定します。
  </Step>
</Steps>

<Note>
トークン解決順序はアカウントを考慮します。実際には、設定値が環境変数フォールバックより優先され、`TELEGRAM_BOT_TOKEN` は既定アカウントにのみ適用されます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループの可視性">
    Telegram ボットは既定で **プライバシーモード** になっており、受信するグループメッセージが制限されます。

    ボットがすべてのグループメッセージを確認する必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする、または
    - ボットをグループ管理者にする。

    プライバシーモードを切り替えるときは、Telegram が変更を適用するように、各グループでボットを削除してから再追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram のグループ設定で制御されます。

    管理者ボットはすべてのグループメッセージを受信します。これは、常時有効なグループ動作に役立ちます。

  </Accordion>

  <Accordion title="役立つ BotFather の切り替え設定">

    - グループ追加を許可/拒否するには `/setjoingroups`
    - グループ可視性の動作には `/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御とアクティベーション

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing`（既定）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `dmPolicy: "open"` と `allowFrom: ["*"]` を組み合わせると、ボットユーザー名を見つけた、または推測した任意の Telegram アカウントがボットにコマンドを送信できます。厳しく制限されたツールを持つ意図的に公開されたボットにのみ使用してください。単一所有者のボットでは、数値ユーザー ID を指定した `allowlist` を使用するべきです。

    `channels.telegram.allowFrom` は数値の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    マルチアカウント設定では、制限的なトップレベルの `channels.telegram.allowFrom` は安全境界として扱われます。アカウントレベルの `allowFrom: ["*"]` エントリは、マージ後の有効なアカウント許可リストに明示的なワイルドカードがまだ含まれていない限り、そのアカウントを公開状態にはしません。
    空の `allowFrom` を持つ `dmPolicy: "allowlist"` はすべての DM をブロックし、設定検証で拒否されます。
    セットアップでは数値ユーザー ID のみを求めます。
    アップグレード後、設定に `@username` の許可リストエントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォート。Telegram ボットトークンが必要です）。
    以前にペアリングストアの許可リストファイルに依存していた場合、`openclaw doctor --fix` は許可リストフロー内でエントリを `channels.telegram.allowFrom` に復元できます（たとえば、`dmPolicy: "allowlist"` に明示的な ID がまだない場合）。

    単一所有者のボットでは、以前のペアリング承認に依存する代わりに、明示的な数値 `allowFrom` ID を指定した `dmPolicy: "allowlist"` を推奨します。これにより、アクセスポリシーを設定内で永続化できます。

    よくある混同: DM のペアリング承認は「この送信者がどこでも認可されている」という意味ではありません。
    ペアリングは DM アクセスを付与します。コマンド所有者がまだ存在しない場合、最初に承認されたペアリングは `commands.ownerAllowFrom` も設定し、所有者専用コマンドと exec 承認に明示的なオペレーターアカウントを持たせます。
    グループ送信者の認可は、引き続き明示的な設定許可リストから行われます。
    「一度認可されれば、DM とグループコマンドの両方が機能する」ようにしたい場合は、数値の Telegram ユーザー ID を `channels.telegram.allowFrom` に入れてください。所有者専用コマンドでは、`commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### Telegram ユーザー ID の確認

    より安全な方法（サードパーティボットなし）:

    1. 自分のボットに DM します。
    2. `openclaw logs --follow` を実行します。
    3. `from.id` を読み取ります。

    公式 Bot API の方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシーは低め）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと許可リスト">
    2 つの制御が一緒に適用されます。

    1. **許可されるグループ**（`channels.telegram.groups`）
       - `groups` 設定なし:
         - `groupPolicy: "open"` の場合: 任意のグループがグループ ID チェックを通過できます
         - `groupPolicy: "allowlist"`（既定）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされます
       - `groups` が設定されている場合: 許可リストとして動作します（明示的な ID または `"*"`）

    2. **グループ内で許可される送信者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（既定）
       - `disabled`

    `groupAllowFrom` はグループ送信者のフィルタリングに使用されます。設定されていない場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値の Telegram ユーザー ID である必要があります（`telegram:` / `tg:` プレフィックスは正規化されます）。
    Telegram グループまたはスーパーグループのチャット ID を `groupAllowFrom` に入れないでください。負のチャット ID は `channels.telegram.groups` に属します。
    数値でないエントリは送信者認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者の認可は DM ペアリングストア承認を継承しません。
    ペアリングは DM 専用のままです。グループでは、`groupAllowFrom` またはグループごと/トピックごとの `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram はペアリングストアではなく、設定の `allowFrom` にフォールバックします。
    単一所有者のボットでの実用的なパターン: 自分のユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` で許可します。
    ランタイムメモ: `channels.telegram` が完全に存在しない場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムはフェイルクローズの `groupPolicy="allowlist"` を既定にします。

    例: 特定の 1 つのグループ内の任意のメンバーを許可する:

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

    例: 特定の 1 つのグループ内で特定のユーザーだけを許可する:

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

      - `-1001234567890` のような負の Telegram グループまたはスーパーグループのチャット ID は `channels.telegram.groups` に入れます。
      - 許可されたグループ内でボットをトリガーできる人を制限したい場合は、`8734062810` のような Telegram ユーザー ID を `groupAllowFrom` に入れます。
      - 許可されたグループの任意のメンバーがボットと会話できるようにしたい場合にのみ、`groupAllowFrom: ["*"]` を使用します。

    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信には既定でメンションが必要です。

    メンションは次のいずれかです。

    - ネイティブの `@botusername` メンション、または
    - 次のメンションパターン:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンド切り替え:

    - `/activation always`
    - `/activation mention`

    これらはセッション状態のみを更新します。永続化には設定を使用してください。

    永続設定の例:

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

    グループチャット ID の取得:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` から `chat.id` を読み取る
    - または Bot API の `getUpdates` を確認する

  </Tab>
</Tabs>

## ランタイム動作

- Telegram は Gateway プロセスが管理します。
- ルーティングは決定論的です。Telegram からの受信は Telegram に返信されます（モデルはチャネルを選びません）。
- 受信メッセージは、返信メタデータとメディアプレースホルダーを持つ共有チャネルエンベロープに正規化されます。
- グループセッションはグループ ID によって分離されます。フォーラムトピックでは、トピックを分離するために `:topic:<threadId>` が追加されます。
- DM メッセージには `message_thread_id` を含めることができます。OpenClaw は返信用にスレッド ID を保持しますが、既定では DM をフラットなセッションのままにします。DM トピックのセッション分離を意図的に有効にしたい場合は、`channels.telegram.dm.threadReplies: "inbound"`、`channels.telegram.direct.<chatId>.threadReplies: "inbound"`、`requireTopic: true`、または一致するトピック設定を構成します。
- ロングポーリングは、チャットごと/スレッドごとの順序付けを行う grammY runner を使用します。ランナーシンク全体の同時実行数は `agents.defaults.maxConcurrent` を使用します。
- ロングポーリングは各 Gateway プロセス内でガードされるため、一度に 1 つのアクティブなポーラーだけがボットトークンを使用できます。それでも `getUpdates` の 409 競合が表示される場合は、別の OpenClaw Gateway、スクリプト、または外部ポーラーが同じトークンを使用している可能性があります。
- ロングポーリングのウォッチドッグ再起動は、既定では完了した `getUpdates` のライブネスが 120 秒間ない場合にトリガーされます。デプロイで長時間実行される作業中に誤ったポーリング停止再起動がまだ発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒単位で、`30000` から `600000` まで許可されます。アカウントごとの上書きがサポートされています。
- Telegram Bot API には既読通知サポートがありません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は部分的な返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` が `off | partial | block | progress` であること（既定: `partial`）
    - `progress` は編集可能なステータス下書きを 1 つ保持し、最終配信までツール進捗で更新します
    - `streaming.preview.toolProgress` は、ツール/進捗更新が同じ編集済みプレビューメッセージを再利用するかどうかを制御します（既定: プレビューストリーミングが有効な場合は `true`）
    - `streaming.preview.commandText` は、それらのツール進捗行内のコマンド/exec 詳細を制御します: `raw`（既定、リリース済みの動作を保持）または `status`（ツールラベルのみ）
    - 旧式の `channels.telegram.streamMode` と真偽値の `streaming` 値は検出されます。`openclaw doctor --fix` を実行して `channels.telegram.streaming.mode` に移行してください

    ツール進捗プレビュー更新は、ツール実行中に表示される短いステータス行です。たとえば、コマンド実行、ファイル読み取り、計画更新、パッチ要約などです。Telegram では、`v2026.4.22` 以降でリリースされた OpenClaw の動作に合わせるため、これらが既定で有効です。回答テキスト用の編集済みプレビューは維持しつつ、ツール進捗行を非表示にするには、次を設定します。

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

    ツール進捗は表示したまま、コマンド/exec テキストを非表示にするには、次を設定します。

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

    進行状況ドラフトモードでは、同じコマンドテキストポリシーを `streaming.progress` の下に置きます。

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

    最終結果のみの配信が必要な場合にだけ `streaming.mode: "off"` を使用します。Telegram のプレビュー編集は無効になり、汎用的なツールや進行状況の雑談は、独立したステータスメッセージとして送信される代わりに抑制されます。承認プロンプト、メディアペイロード、エラーは引き続き通常の最終配信経路を通ります。回答プレビュー編集だけを維持し、ツール進行状況のステータス行を隠したい場合は `streaming.preview.toolProgress: false` を使用します。

    <Note>
      Telegram の選択引用返信は例外です。`replyToMode` が `"first"`、`"all"`、または `"batched"` で、受信メッセージに選択された引用テキストが含まれている場合、OpenClaw は回答プレビューを編集する代わりに、Telegram のネイティブな引用返信経路で最終回答を送信します。そのため、そのターンでは `streaming.preview.toolProgress` で短いステータス行を表示できません。選択引用テキストのない現在メッセージへの返信では、引き続きプレビューストリーミングが維持されます。ツール進行状況の可視性がネイティブ引用返信より重要な場合は `replyToMode: "off"` を設定するか、トレードオフを明示的に受け入れるために `streaming.preview.toolProgress: false` を設定します。
    </Note>

    テキストのみの返信の場合:

    - 短いDM/グループ/トピックのプレビュー: プレビューが表示された後に可視の非プレビューメッセージが送信されていない限り、OpenClaw は同じプレビューメッセージを保持し、その場で最終編集を行います
    - プレビューの後に可視の非プレビュー出力が続く場合: OpenClaw は完了した返信を新しい最終メッセージとして送信し、古いプレビューをクリーンアップするため、最終回答は中間出力の後に表示されます
    - 約1分より古いプレビュー: OpenClaw は完了した返信を新しい最終メッセージとして送信してからプレビューをクリーンアップするため、Telegram の可視タイムスタンプはプレビュー作成時刻ではなく完了時刻を反映します

    複雑な返信（たとえばメディアペイロード）の場合、OpenClaw は通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューストリーミングはブロックストリーミングとは別です。Telegram でブロックストリーミングが明示的に有効化されている場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

    Telegram 専用の推論ストリーム:

    - `/reasoning stream` は生成中に推論をライブプレビューへ送信します
    - 推論プレビューは最終配信後に削除されます。推論を表示したままにする必要がある場合は `/reasoning on` を使用します
    - 最終回答は推論テキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定とHTMLフォールバック">
    送信テキストは Telegram `parse_mode: "HTML"` を使用します。

    - Markdown 風のテキストは Telegram で安全なHTMLにレンダリングされます。
    - 生のモデルHTMLは、Telegram の解析失敗を減らすためにエスケープされます。
    - Telegram が解析済みHTMLを拒否した場合、OpenClaw はプレーンテキストで再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効化できます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram コマンドメニュー登録は起動時に `setMyCommands` で処理されます。

    ネイティブコマンドのデフォルト:

    - `commands.native: "auto"` は Telegram のネイティブコマンドを有効にします

    カスタムコマンドメニュー項目を追加します。

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
    - 競合/重複はスキップされ、ログに記録されます

    注記:

    - カスタムコマンドはメニュー項目のみです。動作を自動実装しません
    - plugin/skill コマンドは、Telegram メニューに表示されていなくても、入力された場合は引き続き動作できます

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。設定されていれば、カスタム/plugin コマンドは引き続き登録される場合があります。

    一般的なセットアップ失敗:

    - `setMyCommands failed` と `BOT_COMMANDS_TOO_MUCH` が表示される場合、トリミング後も Telegram メニューがまだ上限を超えていることを意味します。plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効化してください。
    - 直接の Bot API curl コマンドは動作するのに、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合、`channels.telegram.apiRoot` が完全な `/bot<TOKEN>` エンドポイントに設定されている可能性があります。`apiRoot` は Bot API ルートだけである必要があり、`openclaw doctor --fix` は誤って末尾に付いた `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、Telegram が設定済みのボットトークンを拒否したことを意味します。`botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN` を現在の BotFather トークンで更新してください。OpenClaw はポーリング前に停止するため、これは Webhook クリーンアップ失敗としては報告されません。
    - `setMyCommands failed` とネットワーク/fetch エラーが表示される場合、通常は `api.telegram.org` への送信DNS/HTTPSがブロックされていることを意味します。

    ### デバイスペアリングコマンド（`device-pair` plugin）

    `device-pair` plugin がインストールされている場合:

    1. `/pair` はセットアップコードを生成します
    2. iOS アプリにコードを貼り付けます
    3. `/pair pending` は保留中のリクエスト（ロール/スコープを含む）を一覧表示します
    4. リクエストを承認します:
       - 明示的な承認には `/pair approve <requestId>`
       - 保留中のリクエストが1件だけの場合は `/pair approve`
       - 最新のものには `/pair approve latest`

    セットアップコードには短命のブートストラップトークンが含まれます。組み込みのブートストラップ引き渡しでは、プライマリノードトークンは `scopes: []` に保たれます。引き渡されたオペレータートークンは `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されます。ブートストラップスコープチェックはロール接頭辞付きのため、そのオペレーター許可リストはオペレーターリクエストのみを満たします。非オペレーターロールには、引き続きそれぞれのロール接頭辞配下のスコープが必要です。

    デバイスが変更された認証詳細（たとえばロール/スコープ/公開鍵）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストでは別の `requestId` が使用されます。承認前に `/pair pending` を再実行してください。

    詳細: [ペアリング](/ja-JP/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="インラインボタン">
    インラインキーボードのスコープを設定します。

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

    コールバックのクリックはテキストとしてエージェントに渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="エージェントと自動化向けの Telegram メッセージアクション">
    Telegram ツールアクションには次が含まれます。

    - `sendMessage`（`to`、`content`、任意の `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、任意の `iconColor`、`iconCustomEmojiId`）

    チャンネルメッセージアクションは使いやすいエイリアス（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）を公開します。

    ゲート制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（デフォルト: 無効）

    注記: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    ランタイム送信はアクティブな設定/シークレットのスナップショット（起動/リロード）を使用するため、アクションパスは送信ごとにアドホックな SecretRef 再解決を行いません。

    リアクション削除セマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッド化タグ">
    Telegram は、生成された出力内の明示的な返信スレッド化タグをサポートします。

    - `[[reply_to_current]]` はトリガー元メッセージに返信します
    - `[[reply_to:<id>]]` は特定の Telegram メッセージIDに返信します

    `channels.telegram.replyToMode` は処理を制御します。

    - `off`（デフォルト）
    - `first`
    - `all`

    返信スレッド化が有効で、元の Telegram テキストまたはキャプションが利用可能な場合、OpenClaw はネイティブ Telegram 引用抜粋を自動的に含めます。Telegram はネイティブ引用テキストを1024 UTF-16コードユニットに制限するため、より長いメッセージは先頭から引用され、Telegram が引用を拒否した場合はプレーンな返信にフォールバックします。

    注記: `off` は暗黙的な返信スレッド化を無効化します。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッドの動作">
    フォーラムスーパーグループ:

    - トピックセッションキーは `:topic:<threadId>` を追加します
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック（`threadId=1`）の特例:

    - メッセージ送信では `message_thread_id` を省略します（Telegram は `sendMessage(...thread_id=1)` を拒否します）
    - 入力中アクションには引き続き `message_thread_id` が含まれます

    トピックの継承: トピック項目は、上書きされない限りグループ設定（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）を継承します。
    `agentId` はトピック専用で、グループデフォルトから継承されません。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック設定で `agentId` を設定することで別のエージェントへルーティングできます。これにより、各トピックは独自の分離されたワークスペース、メモリ、セッションを持てます。例:

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

    その後、各トピックは独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続的な ACP トピックバインディング**: フォーラムトピックは、トップレベルの型付き ACP バインディング（`type: "acp"` と `match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾IDを持つ `bindings[]`）を通じて ACP ハーネスセッションを固定できます。現在はグループ/スーパーグループ内のフォーラムトピックにスコープされています。[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

    **チャットからのスレッドバインド ACP spawn**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しい ACP セッションにバインドします。以後のやり取りはそこへ直接ルーティングされます。OpenClaw は spawn 確認をトピック内に固定します。`channels.telegram.threadBindings.spawnSessions` が有効のままである必要があります（デフォルト: `true`）。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは、デフォルトでフラットセッション上の DM ルーティングと返信メタデータを維持します。`threadReplies: "inbound"`、`threadReplies: "always"`、`requireTopic: true`、または一致するトピック設定が構成されている場合にのみ、スレッド対応のセッションキーを使用します。アカウントのデフォルトにはトップレベルの `channels.telegram.dm.threadReplies` を、1 つの DM には `direct.<chatId>.threadReplies` を使用します。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram は音声メモと音声ファイルを区別します。

    - デフォルト: 音声ファイルの動作
    - エージェント返信内のタグ `[[audio_as_voice]]` で音声メモ送信を強制
    - 受信した音声メモの文字起こしは、エージェントコンテキスト内で機械生成の
      信頼できないテキストとしてフレーム化されます。メンション検出は引き続き生の
      文字起こしを使用するため、メンションで制御された音声メッセージは動作し続けます。

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

    動画メモはキャプションをサポートしません。指定されたメッセージテキストは別送されます。

    ### ステッカー

    受信ステッカーの処理:

    - 静的 WEBP: ダウンロードして処理（プレースホルダー `<media:sticker>`）
    - アニメーション TGS: スキップ
    - 動画 WEBM: スキップ

    ステッカーコンテキストフィールド:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ステッカーキャッシュファイル:

    - `~/.openclaw/telegram/sticker-cache.json`

    ステッカーは（可能な場合）一度だけ説明され、繰り返しのビジョン呼び出しを減らすためにキャッシュされます。

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
    Telegram のリアクションは `message_reaction` 更新として届きます（メッセージペイロードとは別です）。

    有効化すると、OpenClaw は次のようなシステムイベントをキューに入れます。

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注記:

    - `own` はボットが送信したメッセージへのユーザーリアクションのみを意味します（送信メッセージキャッシュによるベストエフォート）。
    - リアクションイベントは引き続き Telegram のアクセス制御（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）を尊重します。許可されていない送信者は破棄されます。
    - Telegram はリアクション更新でスレッド ID を提供しません。
      - 非フォーラムグループはグループチャットセッションへルーティング
      - フォーラムグループは、正確な発生元トピックではなく、グループの一般トピックセッション（`:topic:1`）へルーティング

    ポーリング/Webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="ACK リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認用の絵文字を送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェント ID の絵文字フォールバック（`agents.list[].identity.emoji`、なければ "👀"）

    注記:

    - Telegram は Unicode 絵文字（例: "👀"）を想定しています。
    - チャンネルまたはアカウントでリアクションを無効化するには `""` を使用します。

  </Accordion>

  <Accordion title="Telegram イベントとコマンドからの設定書き込み">
    チャンネル設定の書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegram によってトリガーされる書き込みには次が含まれます。

    - `channels.telegram.groups` を更新するためのグループ移行イベント（`migrate_to_chat_id`）
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

    ローカルリスナーは `127.0.0.1:8787` にバインドします。公開入口には、ローカルポートの前段にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定します。

    Webhook モードは、Telegram に `200` を返す前に、リクエストガード、Telegram シークレットトークン、JSON 本文を検証します。
    その後 OpenClaw は、ロングポーリングで使われるものと同じチャット単位/トピック単位のボットレーンを通じて更新を非同期に処理するため、遅いエージェントターンが Telegram の配信 ACK を保持しません。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信 Telegram メディアのサイズ上限を設定します。
    - `channels.telegram.mediaGroupFlushMs`（デフォルト 500）は、OpenClaw が Telegram のアルバム/メディアグループを 1 つの受信メッセージとしてディスパッチする前に、どれだけバッファするかを制御します。アルバムの一部が遅れて届く場合は増やし、アルバム返信のレイテンシを下げるには減らします。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定の場合は grammY のデフォルトが適用されます）。ボットクライアントは、構成値が 60 秒の送信テキスト/タイピングリクエストガードを下回る場合にクランプするため、OpenClaw のトランスポートガードとフォールバックが実行される前に grammY が表示される返信配信を中止しません。ロングポーリングでは、アイドルポーリングが無期限に放棄されないように、引き続き 45 秒の `getUpdates` リクエストガードを使用します。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。ポーリング停止の誤検知による再起動の場合のみ、`30000` から `600000` の間で調整してください。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト 50）を使用します。`0` で無効化します。
    - 返信/引用/転送の補足コンテキストは、現時点では受信したまま渡されます。
    - Telegram の許可リストは主に、完全な補足コンテキストの秘匿境界ではなく、誰がエージェントをトリガーできるかを制御します。
    - DM 履歴制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、回復可能な送信 API エラーに対する Telegram 送信ヘルパー（CLI/ツール/アクション）に適用されます。受信した最終返信の配信も、Telegram の接続前失敗に対して制限付きの安全な送信再試行を使用しますが、表示メッセージを重複させる可能性のある送信後の曖昧なネットワークエンベロープは再試行しません。

    CLI 送信ターゲットには数値チャット ID またはユーザー名を指定できます。

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram ポーリングは `openclaw message poll` を使用し、フォーラムトピックをサポートします。

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 専用ポーリングフラグ:

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - フォーラムトピック用の `--thread-id`（または `:topic:` ターゲットを使用）

    Telegram 送信は次もサポートします。

    - `channels.telegram.capabilities.inlineButtons` が許可する場合、インラインキーボード用の `buttons` ブロックを含む `--presentation`
    - ボットがそのチャットでピン留めできる場合に、ピン留め配信を要求する `--pin` または `--delivery '{"pin":true}'`
    - 送信画像と GIF を、圧縮写真またはアニメーションメディアアップロードではなくドキュメントとして送信する `--force-document`

    アクション制御:

    - `channels.telegram.actions.sendMessage=false` は、ポーリングを含む送信 Telegram メッセージを無効化します
    - `channels.telegram.actions.poll=false` は、通常の送信を有効のまま、Telegram ポーリング作成を無効化します

  </Accordion>

  <Accordion title="Telegram での exec 承認">
    Telegram は承認者 DM で exec 承認をサポートし、任意で発生元のチャットまたはトピックにもプロンプトを投稿できます。承認者は数値の Telegram ユーザー ID である必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled`（少なくとも 1 人の承認者を解決できる場合に自動有効化）
    - `channels.telegram.execApprovals.approvers`（`commands.ownerAllowFrom` の数値オーナー ID にフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト） | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom`、`defaultTo` は、誰がボットと会話できるか、および通常の返信をどこへ送るかを制御します。誰かを exec 承認者にするものではありません。コマンドオーナーがまだ存在しない場合、最初に承認された DM ペアリングが `commands.ownerAllowFrom` をブートストラップするため、1 オーナー構成でも `execApprovals.approvers` に ID を重複して設定せずに動作します。

    チャンネル配信ではチャット内にコマンドテキストが表示されます。`channel` または `both` は信頼できるグループ/トピックでのみ有効化してください。プロンプトがフォーラムトピックに届いた場合、OpenClaw は承認プロンプトとフォローアップのトピックを保持します。exec 承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンも、`channels.telegram.capabilities.inlineButtons` が対象サーフェス（`dm`、`group`、または `all`）を許可している必要があります。`plugin:` 接頭辞付きの承認 ID は Plugin 承認を通じて解決され、それ以外はまず exec 承認を通じて解決されます。

    [Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信制御

エージェントが配信エラーまたはプロバイダーエラーに遭遇した場合、Telegram はエラーテキストで返信するか、それを抑制できます。この動作は 2 つの設定キーで制御します。

| キー                                | 値                | デフォルト | 説明                                                                                     |
| ----------------------------------- | ----------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` はチャットに親しみやすいエラーメッセージを送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | 同じチャットへのエラー返信間の最小時間。障害中のエラースパムを防ぎます。                 |

アカウント単位、グループ単位、トピック単位の上書きがサポートされています（他の Telegram 設定キーと同じ継承）。

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
  <Accordion title="メンションなしのグループメッセージにボットが応答しない">

    - `requireMention=false` の場合、Telegram プライバシーモードは完全な可視性を許可する必要があります。
      - BotFather: `/setprivacy` -> Disable
      - その後、ボットをグループから削除して再追加
    - 設定がメンションなしのグループメッセージを想定している場合、`openclaw channels status` が警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認できます。ワイルドカード `"*"` はメンバーシッププローブできません。
    - 簡易セッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく見ていない">

    - `channels.telegram.groups` が存在する場合、group は列挙されている必要があります（または `"*"` を含めます）
    - group 内の bot メンバーシップを確認します
    - スキップ理由についてログを確認します: `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが部分的に動作する、またはまったく動作しない">

    - 送信者 ID を認可します（ペアリングまたは数値の `allowFrom`）
    - group ポリシーが `open` の場合でも、コマンド認可は適用されます
    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、ネイティブメニューの項目が多すぎることを意味します。Plugin/スキル/カスタムコマンドを減らすか、ネイティブメニューを無効にしてください
    - 起動時の `deleteMyCommands` / `setMyCommands` 呼び出しと、入力中を示す `sendChatAction` 呼び出しは、範囲が制限され、リクエストのタイムアウト時には Telegram のトランスポートフォールバック経由で 1 回再試行されます。永続的なネットワーク/フェッチエラーは通常、`api.telegram.org` への DNS/HTTPS 到達性の問題を示します

  </Accordion>

  <Accordion title="起動時に未認可のトークンが報告される">

    - `getMe returned 401` は、設定済み bot トークンに対する Telegram 認証失敗です。
    - BotFather で bot トークンを再コピーまたは再生成し、デフォルトアカウントの `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken`、または `TELEGRAM_BOT_TOKEN` を更新します。
    - 起動中の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「webhook は存在しない」と扱うと、同じ不正なトークンによる失敗を後続の API 呼び出しまで先送りするだけです。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定さ">

    - Node 22+ とカスタム fetch/proxy の組み合わせでは、AbortSignal 型が一致しない場合に即時 abort 動作が発生することがあります。
    - 一部のホストは `api.telegram.org` を IPv6 優先で解決します。壊れた IPv6 外向き通信により、Telegram API が断続的に失敗することがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw はこれらを回復可能なネットワークエラーとして再試行するようになっています。
    - ポーリング起動中、OpenClaw は成功した起動時の `getMe` プローブを grammY に再利用するため、runner は最初の `getUpdates` の前に 2 回目の `getMe` を必要としません。
    - ポーリング起動中に `deleteWebhook` が一時的なネットワークエラーで失敗した場合、OpenClaw は別の事前ポーリング control-plane 呼び出しを行わずに long polling へ進みます。webhook がまだ有効な場合は `getUpdates` の競合として表面化し、その後 OpenClaw は Telegram トランスポートを再構築して webhook クリーンアップを再試行します。
    - Telegram ソケットが短い固定間隔でリサイクルされる場合は、`channels.telegram.timeoutSeconds` が低くないか確認してください。bot クライアントは、外向き通信と `getUpdates` リクエストのガード値を下回る設定値をクランプしますが、古いリリースではこの値がそれらのガード値を下回っていると、すべてのポーリングまたは返信が abort されることがありました。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw はデフォルトで、完了した long-poll liveness が 120 秒ないとポーリングを再起動し、Telegram トランスポートを再構築します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中のポーリングアカウントが起動猶予後に `getUpdates` を完了していない場合、実行中の webhook アカウントが起動猶予後に `setWebhook` を完了していない場合、または最後に成功したポーリングトランスポート活動が古い場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しが正常にもかかわらず、ホストがポーリング停止の誤検知による再起動を報告する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。永続的な停止は通常、ホストと `api.telegram.org` 間の proxy、DNS、IPv6、または TLS 外向き通信の問題を示します。
    - Telegram は Bot API トランスポートについて、`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` とそれらの小文字バリアントを含むプロセスの proxy 環境変数も尊重します。`NO_PROXY` / `no_proxy` は引き続き `api.telegram.org` をバイパスできます。
    - サービス環境で OpenClaw 管理 proxy が `OPENCLAW_PROXY_URL` によって設定され、標準の proxy 環境変数が存在しない場合、Telegram は Bot API トランスポートにもその URL を使用します。
    - 直接の外向き通信/TLS が不安定な VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由でルーティングします:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ はデフォルトで `autoSelectFamily=true` です（WSL2 を除く）。Telegram DNS 結果の順序は、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、次に `channels.telegram.network.dnsResultOrder`、次に `NODE_OPTIONS=--dns-result-order=ipv4first` などのプロセスデフォルトに従います。いずれも適用されない場合、Node 22+ は `ipv4first` にフォールバックします。
    - ホストが WSL2 の場合、または IPv4 のみの動作の方が明示的にうまく機能する場合は、family 選択を強制します:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、デフォルトで Telegram メディアダウンロードについてすでに許可されています。信頼済みの fake-IP または透過 proxy が、メディアダウンロード中に `api.telegram.org` をその他の private/internal/special-use アドレスへ書き換える場合は、Telegram 専用のバイパスを有効にできます:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じ opt-in はアカウントごとに
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
      でも利用できます。
    - proxy が Telegram メディアホストを `198.18.x.x` に解決する場合は、まず
      危険なフラグをオフのままにしてください。Telegram メディアはデフォルトで
      RFC 2544 ベンチマーク範囲をすでに許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram
      メディアの SSRF 保護を弱めます。Clash、Mihomo、Surge の fake-IP ルーティングのように、RFC 2544 ベンチマーク範囲外の private または special-use 応答を合成する、信頼済みのオペレーター管理 proxy
      環境でのみ使用してください。通常の public internet Telegram アクセスではオフのままにしてください。
    </Warning>

    - 環境オーバーライド（一時的）:
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS 応答を検証します:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

詳細ヘルプ: [Channel トラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主要リファレンス: [設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="重要度の高い Telegram フィールド">

- 起動/認証: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指している必要があります。シンボリックリンクは拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, トップレベルの `bindings[]`（`type: "acp"`）
- exec 承認: `execApprovals`, `accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`, `commands.nativeSkills`, `customCommands`
- スレッド/返信: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- ストリーミング: `streaming`（プレビュー）, `streaming.preview.toolProgress`, `blockStreaming`
- フォーマット/配信: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- カスタム API ルート: `apiRoot`（Bot API ルートのみ。`/bot<TOKEN>` は含めないでください）
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- アクション/機能: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`, `reactionLevel`
- エラー: `errorPolicy`, `errorCooldownMs`
- 書き込み/履歴: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
マルチアカウントの優先順位: 2 つ以上のアカウント ID が設定されている場合、デフォルトルーティングを明示するために `channels.telegram.defaultAccount` を設定します（または `channels.telegram.accounts.default` を含めます）。それ以外の場合、OpenClaw は最初に正規化されたアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="Groups" icon="users" href="/ja-JP/channels/groups">
    group と topic の allowlist 動作。
  </Card>
  <Card title="Channel ルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージを agents にルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと強化。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    group と topic を agents にマッピングします。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    Channel 横断の診断。
  </Card>
</CardGroup>
