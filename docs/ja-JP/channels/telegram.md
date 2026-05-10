---
read_when:
    - Telegramの機能またはWebhookに取り組む
summary: Telegram ボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-05-10T19:23:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87fc2994ced5e3c845b35f8c134ca04de317e83c3c2414de2dea4779a763f17e
    source_path: channels/telegram.md
    workflow: 16
---

grammY 経由のボット DM とグループで本番運用可能です。ロングポーリングがデフォルトモードで、Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルト DM ポリシーはペアリングです。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gateway 構成" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャンネル設定パターンと例。
  </Card>
</CardGroup>

## 簡単なセットアップ

<Steps>
  <Step title="BotFather でボットトークンを作成する">
    Telegram を開き、**@BotFather** とチャットします (ハンドルが正確に `@BotFather` であることを確認します)。

    `/newbot` を実行し、プロンプトに従ってトークンを保存します。

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

    環境変数フォールバック: `TELEGRAM_BOT_TOKEN=...` (デフォルトアカウントのみ)。
    Telegram は `openclaw channels login telegram` を使用**しません**。トークンは config/env で設定し、その後 Gateway を起動します。

  </Step>

  <Step title="Gateway を起動して最初の DM を承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは 1 時間後に期限切れになります。

  </Step>

  <Step title="ボットをグループに追加する">
    ボットをグループに追加し、アクセスモデルに合わせて `channels.telegram.groups` と `groupPolicy` を設定します。
  </Step>
</Steps>

<Note>
トークンの解決順序はアカウントを考慮します。実際には、config 値が環境変数フォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループ可視性">
    Telegram ボットはデフォルトで**プライバシーモード**になっており、受信できるグループメッセージが制限されます。

    ボットがすべてのグループメッセージを見る必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする、または
    - ボットをグループ管理者にする。

    プライバシーモードを切り替えるときは、Telegram が変更を適用するよう、各グループでボットを削除してから再追加します。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram グループ設定で制御されます。

    管理者ボットはすべてのグループメッセージを受信するため、常時稼働のグループ動作に便利です。

  </Accordion>

  <Accordion title="便利な BotFather 切り替え項目">

    - グループへの追加を許可/拒否する `/setjoingroups`
    - グループ可視性の挙動を設定する `/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing` (デフォルト)
    - `allowlist` (`allowFrom` に少なくとも 1 つの送信者 ID が必要)
    - `open` (`allowFrom` に `"*"` を含める必要があります)
    - `disabled`

    `allowFrom: ["*"]` を指定した `dmPolicy: "open"` は、ボットのユーザー名を見つけるか推測した任意の Telegram アカウントがボットにコマンドを送れるようにします。これは、ツールを厳しく制限した意図的な公開ボットにのみ使用してください。単一オーナーのボットでは、数値ユーザー ID を指定した `allowlist` を使用するべきです。

    `channels.telegram.allowFrom` は数値の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` プレフィックスも受け付けられ、正規化されます。
    複数アカウント設定では、最上位の制限的な `channels.telegram.allowFrom` は安全境界として扱われます。アカウントレベルの `allowFrom: ["*"]` エントリは、マージ後の実効アカウント許可リストに明示的なワイルドカードがまだ含まれていない限り、そのアカウントを公開状態にしません。
    空の `allowFrom` を指定した `dmPolicy: "allowlist"` はすべての DM をブロックし、設定検証で拒否されます。
    セットアップでは数値ユーザー ID のみが要求されます。
    アップグレード後の設定に `@username` 許可リストエントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください (ベストエフォート。Telegram ボットトークンが必要です)。
    以前にペアリングストアの許可リストファイルに依存していた場合、`openclaw doctor --fix` は許可リストフローでエントリを `channels.telegram.allowFrom` に復元できます (たとえば `dmPolicy: "allowlist"` にまだ明示的な ID がない場合)。

    単一オーナーのボットでは、以前のペアリング承認に依存する代わりに、明示的な数値 `allowFrom` ID を指定した `dmPolicy: "allowlist"` を推奨します。これにより、アクセスポリシーを設定内で永続化できます。

    よくある混乱: DM ペアリング承認は「この送信者がどこでも承認されている」という意味ではありません。
    ペアリングは DM アクセスを付与します。コマンドオーナーがまだ存在しない場合、最初に承認されたペアリングは `commands.ownerAllowFrom` も設定し、オーナー専用コマンドと exec 承認に明示的な操作者アカウントを持たせます。
    グループ送信者の認可は引き続き、明示的な設定の許可リストから得られます。
    「一度承認すれば、DM とグループコマンドの両方が動く」状態にしたい場合は、数値の Telegram ユーザー ID を `channels.telegram.allowFrom` に入れてください。オーナー専用コマンドについては、`commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### Telegram ユーザー ID の確認

    より安全 (サードパーティボットなし):

    1. 自分のボットに DM を送ります。
    2. `openclaw logs --follow` を実行します。
    3. `from.id` を読み取ります。

    公式 Bot API の方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法 (プライバシー面で劣る): `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと許可リスト">
    2 つの制御が組み合わせて適用されます。

    1. **どのグループを許可するか** (`channels.telegram.groups`)
       - `groups` 設定なし:
         - `groupPolicy: "open"` の場合: 任意のグループがグループ ID チェックを通過できます
         - `groupPolicy: "allowlist"` (デフォルト) の場合: `groups` エントリ (または `"*"`) を追加するまでグループはブロックされます
       - `groups` が設定されている場合: 許可リストとして動作します (明示的な ID または `"*"`)

    2. **グループ内でどの送信者を許可するか** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (デフォルト)
       - `disabled`

    `groupAllowFrom` はグループ送信者フィルタリングに使用されます。設定されていない場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値の Telegram ユーザー ID にしてください (`telegram:` / `tg:` プレフィックスは正規化されます)。
    Telegram グループまたはスーパーグループのチャット ID を `groupAllowFrom` に入れないでください。負のチャット ID は `channels.telegram.groups` 配下に属します。
    数値でないエントリは送信者認可では無視されます。
    セキュリティ境界 (`2026.2.25+`): グループ送信者認可は DM ペアリングストア承認を継承**しません**。
    ペアリングは DM 専用のままです。グループについては、`groupAllowFrom` またはグループ別/トピック別の `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram はペアリングストアではなく、設定の `allowFrom` にフォールバックします。
    単一オーナーのボット向けの実用的なパターン: ユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` 配下で許可します。
    ランタイムの注記: `channels.telegram` が完全に存在しない場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムはフェイルクローズの `groupPolicy="allowlist"` をデフォルトにします。

    例: 特定の 1 つのグループで任意のメンバーを許可する:

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

    例: 特定の 1 つのグループ内で特定のユーザーのみを許可する:

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

      - `-1001234567890` のような負の Telegram グループまたはスーパーグループのチャット ID は `channels.telegram.groups` 配下に入れます。
      - 許可されたグループ内でボットを起動できる人を制限したい場合は、`8734062810` のような Telegram ユーザー ID を `groupAllowFrom` 配下に入れます。
      - 許可されたグループの任意のメンバーがボットと話せるようにしたい場合にのみ、`groupAllowFrom: ["*"]` を使用します。

    </Warning>

  </Tab>

  <Tab title="メンションの挙動">
    グループでの返信にはデフォルトでメンションが必要です。

    メンションは次のものから取得できます。

    - ネイティブの `@botusername` メンション、または
    - 次のメンションパターン:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンド切り替え:

    - `/activation always`
    - `/activation mention`

    これらはセッション状態だけを更新します。永続化には設定を使用します。

    永続的な設定例:

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
    - または Bot API の `getUpdates` を調べる

  </Tab>
</Tabs>

## ランタイムの挙動

- Telegram は Gateway プロセスによって管理されます。
- ルーティングは決定的です。Telegram の受信は Telegram に返信されます (モデルはチャンネルを選びません)。
- 受信メッセージは、返信メタデータ、メディアプレースホルダー、Gateway が観測した Telegram 返信用の永続化された返信チェーンコンテキストを持つ共有チャンネルエンベロープに正規化されます。
- グループセッションはグループ ID ごとに分離されます。フォーラムトピックでは、トピックを分離するために `:topic:<threadId>` が追加されます。
- DM メッセージは `message_thread_id` を持つことがあります。OpenClaw は返信用にスレッド ID を保持しますが、デフォルトでは DM をフラットなセッションに保ちます。DM トピックのセッション分離を意図的に使用したい場合は、`channels.telegram.dm.threadReplies: "inbound"`、`channels.telegram.direct.<chatId>.threadReplies: "inbound"`、`requireTopic: true`、または一致するトピック設定を構成します。
- ロングポーリングは、チャットごと/スレッドごとの順序制御を持つ grammY runner を使用します。全体の runner sink 並行性には `agents.defaults.maxConcurrent` が使用されます。
- ロングポーリングは各 Gateway プロセス内でガードされているため、一度に 1 つのアクティブな poller だけがボットトークンを使用できます。それでも `getUpdates` の 409 競合が表示される場合は、別の OpenClaw Gateway、スクリプト、または外部 poller が同じトークンを使用している可能性があります。
- ロングポーリングのウォッチドッグ再起動は、デフォルトでは完了した `getUpdates` のライブネスが 120 秒間ない場合にトリガーされます。長時間実行の作業中にデプロイで誤ったポーリング停止再起動がまだ発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値の単位はミリ秒で、`30000` から `600000` まで許可されます。アカウントごとの上書きにも対応しています。
- Telegram Bot API には既読通知のサポートはありません (`sendReadReceipts` は適用されません)。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー (メッセージ編集)">
    OpenClaw は部分返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress` です (デフォルト: `partial`)
    - `progress` はツール進行状況用に編集可能なステータス下書きを 1 つ保持し、完了時にクリアして、最終回答を通常メッセージとして送信します
    - `streaming.preview.toolProgress` は、ツール/進行状況の更新が同じ編集済みプレビューメッセージを再利用するかどうかを制御します (デフォルト: プレビューストリーミングが有効な場合は `true`)
    - `streaming.preview.commandText` は、それらのツール進行状況行内のコマンド/exec 詳細を制御します: `raw` (デフォルト、リリース済みの挙動を保持) または `status` (ツールラベルのみ)
    - 旧式の `channels.telegram.streamMode` と真偽値の `streaming` 値は検出されます。`openclaw doctor --fix` を実行して `channels.telegram.streaming.mode` に移行してください

    ツール進行状況プレビュー更新は、ツール実行中に表示される短いステータス行です。たとえば、コマンド実行、ファイル読み取り、計画更新、パッチ要約などです。Telegram は、`v2026.4.22` 以降のリリース済み OpenClaw の挙動に合わせるため、これらをデフォルトで有効にしています。回答テキスト用の編集済みプレビューは維持しつつ、ツール進行状況行を非表示にするには、次を設定します:

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

    ツール進捗を表示したままコマンド/execテキストを非表示にするには、次を設定します。

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

    表示可能なツール進捗を、その同じメッセージ内の最終回答に編集して入れたくない場合は、`progress`モードを使用します。コマンドテキストポリシーは`streaming.progress`配下に置きます。

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

    `streaming.mode: "off"`は、最終結果のみを配信したい場合にだけ使用します。Telegramのプレビュー編集は無効になり、汎用的なツール/進捗の雑談はスタンドアロンのステータスメッセージとして送信されるのではなく抑制されます。承認プロンプト、メディアペイロード、エラーは引き続き通常の最終配信経路を通ります。回答プレビュー編集だけを維持し、ツール進捗のステータス行を非表示にしたい場合は、`streaming.preview.toolProgress: false`を使用します。

    <Note>
      Telegramの選択引用返信は例外です。`replyToMode`が`"first"`、`"all"`、または`"batched"`で、受信メッセージに選択された引用テキストが含まれる場合、OpenClawは回答プレビューを編集する代わりに、Telegramネイティブの引用返信経路で最終回答を送信します。そのため、そのターンでは`streaming.preview.toolProgress`で短いステータス行を表示できません。選択引用テキストのない現在メッセージへの返信では、引き続きプレビューストリーミングが維持されます。ネイティブ引用返信よりもツール進捗の可視性が重要な場合は`replyToMode: "off"`を設定するか、トレードオフを受け入れるために`streaming.preview.toolProgress: false`を設定します。
    </Note>

    テキストのみの返信の場合:

    - 短いDM/グループ/トピックのプレビューでは、OpenClawは同じプレビューメッセージを維持し、最終編集をその場で実行します
    - 複数のTelegramメッセージに分割される長いテキストの最終結果では、可能な場合、既存のプレビューを最初の最終チャンクとして再利用し、その後に残りのチャンクだけを送信します
    - 進捗モードの最終結果では、ステータス下書きを消去し、その下書きを回答に編集するのではなく通常の最終配信を使用します
    - 完了済みテキストが確認される前に最終編集が失敗した場合、OpenClawは通常の最終配信を使用し、古いプレビューをクリーンアップします

    複雑な返信（メディアペイロードなど）の場合、OpenClawは通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューストリーミングはブロックストリーミングとは別です。Telegramでブロックストリーミングが明示的に有効化されている場合、OpenClawは二重ストリーミングを避けるためにプレビューストリームをスキップします。

    Telegram専用の推論ストリーム:

    - `/reasoning stream`は生成中に推論をライブプレビューへ送信します
    - 推論プレビューは最終配信後に削除されます。推論を表示したままにする必要がある場合は`/reasoning on`を使用します
    - 最終回答は推論テキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定とHTMLフォールバック">
    送信テキストはTelegramの`parse_mode: "HTML"`を使用します。

    - Markdown風のテキストはTelegramで安全なHTMLにレンダリングされます。
    - 生のモデルHTMLは、Telegramの解析失敗を減らすためにエスケープされます。
    - Telegramが解析済みHTMLを拒否した場合、OpenClawはプレーンテキストとして再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false`で無効にできます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegramコマンドメニューの登録は、起動時に`setMyCommands`で処理されます。

    ネイティブコマンドのデフォルト:

    - `commands.native: "auto"`はTelegramのネイティブコマンドを有効にします

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

    - 名前は正規化されます（先頭の`/`を削除し、小文字化）
    - 有効なパターン: `a-z`、`0-9`、`_`、長さ`1..32`
    - カスタムコマンドはネイティブコマンドを上書きできません
    - 競合/重複はスキップされ、ログに記録されます

    注:

    - カスタムコマンドはメニュー項目のみです。動作を自動実装するものではありません
    - plugin/skillコマンドは、Telegramメニューに表示されていなくても、入力されれば引き続き動作できます

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。カスタム/pluginコマンドは、設定されていれば引き続き登録される場合があります。

    よくあるセットアップ失敗:

    - `BOT_COMMANDS_TOO_MUCH`を伴う`setMyCommands failed`は、トリミング後もTelegramメニューが上限を超えたことを意味します。plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native`を無効にしてください。
    - 直接のBot API curlコマンドは動作する一方で、`deleteWebhook`、`deleteMyCommands`、または`setMyCommands`が`404: Not Found`で失敗する場合、`channels.telegram.apiRoot`が完全な`/bot<TOKEN>`エンドポイントに設定されていた可能性があります。`apiRoot`はBot APIのルートのみでなければならず、`openclaw doctor --fix`は誤って付いた末尾の`/bot<TOKEN>`を削除します。
    - `getMe returned 401`は、Telegramが設定済みボットトークンを拒否したことを意味します。`botToken`、`tokenFile`、または`TELEGRAM_BOT_TOKEN`を現在のBotFatherトークンで更新してください。OpenClawはポーリング前に停止するため、これはWebhookクリーンアップ失敗として報告されません。
    - ネットワーク/fetchエラーを伴う`setMyCommands failed`は、通常`api.telegram.org`への送信DNS/HTTPSがブロックされていることを意味します。

    ### デバイスペアリングコマンド（`device-pair` plugin）

    `device-pair` pluginがインストールされている場合:

    1. `/pair`はセットアップコードを生成します
    2. iOSアプリにコードを貼り付けます
    3. `/pair pending`は保留中のリクエスト（ロール/スコープを含む）を一覧表示します
    4. リクエストを承認します:
       - 明示的な承認には`/pair approve <requestId>`
       - 保留中のリクエストが1件だけの場合は`/pair approve`
       - 最新のものには`/pair approve latest`

    セットアップコードには短命のブートストラップトークンが含まれます。組み込みのブートストラップ引き渡しでは、プライマリノードトークンは`scopes: []`のまま維持されます。引き渡されたoperatorトークンは、`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`に制限されます。ブートストラップのスコープチェックはロール接頭辞付きなので、そのoperator許可リストはoperatorリクエストのみを満たします。operator以外のロールでは、引き続き自身のロール接頭辞配下のスコープが必要です。

    デバイスが変更された認証詳細（ロール/スコープ/公開鍵など）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストは別の`requestId`を使用します。承認前に`/pair pending`を再実行してください。

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

    アカウント単位の上書き:

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

    レガシーの`capabilities: ["inlineButtons"]`は`inlineButtons: "all"`にマップされます。

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

  <Accordion title="エージェントと自動化向けのTelegramメッセージアクション">
    Telegramツールアクションには次が含まれます。

    - `sendMessage`（`to`、`content`、任意の`mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、任意の`iconColor`、`iconCustomEmojiId`）

    チャンネルメッセージアクションは使いやすいエイリアス（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）を公開します。

    ゲート制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（デフォルト: 無効）

    注: `edit`と`topic-create`は現在デフォルトで有効で、個別の`channels.telegram.actions.*`トグルはありません。
    実行時送信はアクティブな設定/シークレットのスナップショット（起動/リロード時）を使用するため、アクション経路は送信ごとにアドホックなSecretRef再解決を行いません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッドタグ">
    Telegramは生成された出力内の明示的な返信スレッドタグをサポートします。

    - `[[reply_to_current]]`はトリガー元のメッセージに返信します
    - `[[reply_to:<id>]]`は特定のTelegramメッセージIDに返信します

    `channels.telegram.replyToMode`は処理を制御します。

    - `off`（デフォルト）
    - `first`
    - `all`

    返信スレッドが有効で、元のTelegramテキストまたはキャプションが利用可能な場合、OpenClawはネイティブTelegram引用の抜粋を自動的に含めます。Telegramはネイティブ引用テキストを1024 UTF-16コード単位に制限しているため、長いメッセージは先頭から引用され、Telegramが引用を拒否した場合はプレーン返信にフォールバックします。

    注: `off`は暗黙的な返信スレッドを無効にします。明示的な`[[reply_to_*]]`タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッド動作">
    フォーラムスーパーグループ:

    - トピックセッションキーは`:topic:<threadId>`を追加します
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック（`threadId=1`）の特例:

    - メッセージ送信では`message_thread_id`を省略します（Telegramは`sendMessage(...thread_id=1)`を拒否します）
    - 入力中アクションには引き続き`message_thread_id`が含まれます

    トピック継承: トピック項目は、上書きされない限りグループ設定（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）を継承します。
    `agentId`はトピック専用で、グループのデフォルトから継承されません。

    **トピック単位のエージェントルーティング**: 各トピックは、トピック設定で`agentId`を設定することで別のエージェントにルーティングできます。これにより、各トピックは独自に分離されたワークスペース、メモリ、セッションを持ちます。例:

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

    **永続ACPトピックバインディング**: フォーラムトピックは、トップレベルの型付きACPバインディング（`type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`、および`-1001234567890:topic:42`のようなトピック修飾IDを持つ`bindings[]`）を通じてACPハーネスセッションを固定できます。現在はグループ/スーパーグループ内のフォーラムトピックにスコープされています。[ACPエージェント](/ja-JP/tools/acp-agents)を参照してください。

    **チャットからのスレッド紐付けACPスポーン**: `/acp spawn <agent> --thread here|auto`は現在のトピックを新しいACPセッションに紐付けます。以後のやり取りはそこへ直接ルーティングされます。OpenClawはスポーン確認をトピック内に固定します。`channels.telegram.threadBindings.spawnSessions`が有効のままである必要があります（デフォルト: `true`）。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは、デフォルトではフラットなセッションで DM ルーティングと返信メタデータを維持します。`threadReplies: "inbound"`、`threadReplies: "always"`、`requireTopic: true`、または一致するトピック設定で構成されている場合にのみ、スレッド対応のセッションキーを使用します。アカウントのデフォルトには最上位の `channels.telegram.dm.threadReplies` を使用し、1 つの DM には `direct.<chatId>.threadReplies` を使用します。

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### 音声メッセージ

    Telegram はボイスメモと音声ファイルを区別します。

    - デフォルト: 音声ファイルの動作
    - エージェントの返信にタグ `[[audio_as_voice]]` を入れると、ボイスメモ送信を強制します
    - 受信したボイスメモの文字起こしは、エージェントコンテキスト内で機械生成の信頼されないテキストとして扱われます。メンション検出は引き続き生の文字起こしを使用するため、メンションで制御されたボイスメッセージは機能し続けます。

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

    Telegram は動画ファイルとビデオメモを区別します。

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

    ビデオメモはキャプションをサポートしません。指定されたメッセージテキストは別途送信されます。

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

    ステッカーアクションを有効にする:

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

    キャッシュ済みステッカーを検索する:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaction notifications">
    Telegram のリアクションは `message_reaction` 更新として届きます（メッセージペイロードとは別です）。

    有効にすると、OpenClaw は次のようなシステムイベントをキューに入れます。

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注記:

    - `own` は、ボットが送信したメッセージへのユーザーリアクションのみを意味します（送信済みメッセージキャッシュによるベストエフォート）。
    - リアクションイベントも Telegram のアクセス制御（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）に従います。許可されていない送信者は破棄されます。
    - Telegram はリアクション更新でスレッド ID を提供しません。
      - 非フォーラムグループはグループチャットセッションへルーティングします
      - フォーラムグループは、正確な発生元トピックではなく、グループの一般トピックセッション（`:topic:1`）へルーティングします

    ポーリング/Webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認用絵文字を送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェント ID 絵文字のフォールバック（`agents.list[].identity.emoji`、なければ "👀"）

    注記:

    - Telegram は Unicode 絵文字（例: "👀"）を想定します。
    - チャンネルまたはアカウントのリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    チャンネル設定の書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegram をトリガーとする書き込みには次が含まれます。

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

  <Accordion title="Long polling vs webhook">
    デフォルトはロングポーリングです。Webhook モードでは `channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。任意で `webhookPath`、`webhookHost`、`webhookPort`（デフォルトは `/telegram-webhook`、`127.0.0.1`、`8787`）を設定できます。

    ロングポーリングモードでは、OpenClaw は更新のディスパッチが成功した後にのみ再起動用のウォーターマークを永続化します。ハンドラーが失敗した場合、その更新は同じプロセス内で再試行可能なままで、再起動時の重複排除のために完了として書き込まれません。

    ローカルリスナーは `127.0.0.1:8787` にバインドします。公開イングレスでは、ローカルポートの前にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定します。

    Webhook モードは、Telegram に `200` を返す前に、リクエストガード、Telegram シークレットトークン、JSON 本文を検証します。
    その後 OpenClaw は、ロングポーリングで使われるものと同じチャット別/トピック別のボットレーンを通じて更新を非同期に処理するため、遅いエージェントターンが Telegram の配信 ACK を保持しません。

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信 Telegram メディアサイズを制限します。
    - `channels.telegram.mediaGroupFlushMs`（デフォルト 500）は、OpenClaw が Telegram のアルバム/メディアグループを 1 つの受信メッセージとしてディスパッチする前にバッファする時間を制御します。アルバムの一部が遅れて届く場合は増やし、アルバム返信の遅延を減らすには減らします。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定の場合は grammY のデフォルトが適用されます）。ボットクライアントは、OpenClaw のトランスポートガードとフォールバックが実行される前に grammY が可視の返信配信を中止しないように、構成値を 60 秒の送信テキスト/入力中リクエストガード未満に制限します。ロングポーリングでは引き続き 45 秒の `getUpdates` リクエストガードを使用するため、アイドルポーリングが無期限に放置されることはありません。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。ポーリング停止の誤検知による再起動の場合にのみ、`30000` から `600000` の間で調整してください。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト 50）を使用します。`0` で無効になります。
    - 返信/引用/転送の補足コンテキストは、Gateway が親メッセージを観測している場合、選択された 1 つの会話コンテキストウィンドウに正規化されます。観測済みメッセージキャッシュはセッションストアの隣に永続化されます。Telegram は更新に浅い `reply_to_message` を 1 つだけ含めるため、キャッシュより古いチェーンは Telegram の現在の更新ペイロードに制限されます。
    - Telegram の許可リストは主に、エージェントをトリガーできるユーザーを制御するものであり、完全な補足コンテキストの墨消し境界ではありません。
    - DM 履歴コントロール:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、回復可能な送信 API エラーに対して Telegram 送信ヘルパー（CLI/ツール/アクション）に適用されます。受信メッセージへの最終返信配信でも、Telegram の接続前失敗に対して境界付きの安全な送信リトライを使用しますが、可視メッセージが重複する可能性のある、送信後の曖昧なネットワークエンベロープはリトライしません。

    CLI とメッセージツールの送信ターゲットには、数値チャット ID、ユーザー名、またはフォーラムトピックターゲットを指定できます。

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram ポーリングは `openclaw message poll` を使用し、フォーラムトピックをサポートします。

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 専用のポーリングフラグ:

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - フォーラムトピック用の `--thread-id`（または `:topic:` ターゲットを使用）

    Telegram 送信は次もサポートします。

    - `channels.telegram.capabilities.inlineButtons` が許可する場合、インラインキーボード用の `buttons` ブロックを含む `--presentation`
    - ボットがそのチャットでピン留めできる場合にピン留め配信を要求する `--pin` または `--delivery '{"pin":true}'`
    - 送信画像と GIF を、圧縮写真またはアニメーションメディアアップロードではなくドキュメントとして送信する `--force-document`

    アクション制御:

    - `channels.telegram.actions.sendMessage=false` は、ポーリングを含む送信 Telegram メッセージを無効にします
    - `channels.telegram.actions.poll=false` は、通常の送信は有効のまま、Telegram ポーリングの作成を無効にします

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram は承認者 DM で exec 承認をサポートし、任意で発生元のチャットまたはトピックにプロンプトを投稿できます。承認者は数値の Telegram ユーザー ID である必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled`（少なくとも 1 人の承認者を解決できる場合に自動有効化）
    - `channels.telegram.execApprovals.approvers`（`commands.ownerAllowFrom` の数値 owner ID にフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom`、`defaultTo` は、誰がボットと会話できるか、通常の返信をどこに送信するかを制御します。これらによって誰かが exec 承認者になるわけではありません。コマンド owner がまだ存在しない場合、最初に承認された DM ペアリングが `commands.ownerAllowFrom` をブートストラップするため、1 owner 構成でも `execApprovals.approvers` の下に ID を重複して書かずに機能します。

    チャンネル配信ではコマンドテキストがチャットに表示されます。信頼できるグループ/トピックでのみ `channel` または `both` を有効にしてください。プロンプトがフォーラムトピックに届いた場合、OpenClaw は承認プロンプトと後続メッセージのトピックを保持します。exec 承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンも、`channels.telegram.capabilities.inlineButtons` が対象サーフェス（`dm`、`group`、または `all`）を許可している必要があります。`plugin:` で始まる承認 ID は Plugin 承認を通じて解決され、それ以外はまず exec 承認を通じて解決されます。

    [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信コントロール

エージェントで配信エラーまたはプロバイダーエラーが発生した場合、Telegram はエラーテキストで返信するか、それを抑制できます。この動作は 2 つの設定キーで制御します。

| キー                                | 値                | デフォルト | 説明                                                                                                      |
| ----------------------------------- | ----------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` はチャットにわかりやすいエラーメッセージを送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | 同じチャットへのエラー返信の最小間隔。障害時のエラースパムを防ぎます。                                   |

アカウント別、グループ別、トピック別の上書きがサポートされています（他の Telegram 設定キーと同じ継承）。

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
  <Accordion title="Bot がメンションなしのグループメッセージに応答しない">

    - `requireMention=false` の場合、Telegram プライバシーモードで完全な可視性を許可する必要があります。
      - BotFather: `/setprivacy` -> Disable
      - その後、グループから bot を削除して再追加します
    - `openclaw channels status` は、設定がメンションなしのグループメッセージを想定している場合に警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認できます。ワイルドカード `"*"` はメンバーシップのプローブができません。
    - 簡易セッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="Bot がグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、グループを一覧に含める必要があります（または `"*"` を含めます）
    - グループ内の bot メンバーシップを確認します
    - スキップ理由についてログを確認します: `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが部分的にしか動作しない、またはまったく動作しない">

    - 送信者 ID を認可します（ペアリング、および/または数値の `allowFrom`）
    - グループポリシーが `open` の場合でも、コマンド認可は引き続き適用されます
    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、ネイティブメニューのエントリーが多すぎることを意味します。plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効にしてください
    - 起動時の `deleteMyCommands` / `setMyCommands` 呼び出しと、`sendChatAction` の入力中呼び出しは上限が設定されており、リクエストタイムアウト時には Telegram のトランスポートフォールバックを通じて 1 回再試行します。継続的なネットワーク/fetch エラーは通常、`api.telegram.org` への DNS/HTTPS 到達性の問題を示します

  </Accordion>

  <Accordion title="起動時に未認可トークンが報告される">

    - `getMe returned 401` は、設定された bot トークンに対する Telegram 認証失敗です。
    - BotFather で bot トークンを再コピーまたは再生成し、デフォルトアカウント用の `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken`、または `TELEGRAM_BOT_TOKEN` を更新します。
    - 起動時の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「webhook が存在しない」と扱うと、同じ不正なトークンの失敗を後続の API 呼び出しまで先送りするだけです。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - Node 22+ とカスタム fetch/proxy の組み合わせでは、AbortSignal 型が一致しない場合に即時 abort 動作が発生することがあります。
    - 一部のホストは `api.telegram.org` を IPv6 優先で解決します。IPv6 の外向き通信が壊れていると、Telegram API の断続的な失敗が発生することがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw はこれらを回復可能なネットワークエラーとして再試行するようになりました。
    - ポーリング起動中、OpenClaw は grammY 用に成功済みの起動時 `getMe` プローブを再利用するため、runner は最初の `getUpdates` の前に 2 回目の `getMe` を必要としません。
    - ポーリング起動中に一時的なネットワークエラーで `deleteWebhook` が失敗した場合、OpenClaw は別のポーリング前 control-plane 呼び出しを行わずに long polling へ進みます。まだ有効な webhook は `getUpdates` の競合として表面化します。その後、OpenClaw は Telegram トランスポートを再構築し、webhook クリーンアップを再試行します。
    - Telegram ソケットが短い固定周期で再利用される場合は、低い `channels.telegram.timeoutSeconds` を確認してください。bot クライアントは、外向きリクエストおよび `getUpdates` リクエストのガードより低い設定値をクランプしますが、古いリリースではこれがそれらのガードより低く設定された場合、すべての poll または reply が abort されることがありました。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw はデフォルトで 120 秒間、完了した long-poll liveness がないとポーリングを再起動し、Telegram トランスポートを再構築します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中のポーリングアカウントが起動猶予後に `getUpdates` を完了していない場合、実行中の webhook アカウントが起動猶予後に `setWebhook` を完了していない場合、または最後に成功したポーリングトランスポートアクティビティが古い場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しが正常なのに、ホストが誤ったポーリング停止再起動を報告する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。継続的な停止は通常、ホストと `api.telegram.org` の間の proxy、DNS、IPv6、または TLS 外向き通信の問題を示します。
    - Telegram は Bot API トランスポートについて、`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` とそれらの小文字バリアントを含むプロセス proxy env も尊重します。`NO_PROXY` / `no_proxy` は引き続き `api.telegram.org` をバイパスできます。
    - サービス環境で OpenClaw 管理 proxy が `OPENCLAW_PROXY_URL` を通じて設定されており、標準 proxy env が存在しない場合、Telegram もその URL を Bot API トランスポートに使用します。
    - 不安定な直接外向き通信/TLS を持つ VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由でルーティングします。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ はデフォルトで `autoSelectFamily=true` です（WSL2 を除く）。Telegram DNS 結果の順序は、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、次に `channels.telegram.network.dnsResultOrder`、次に `NODE_OPTIONS=--dns-result-order=ipv4first` などのプロセスデフォルトに従います。どれも適用されない場合、Node 22+ は `ipv4first` にフォールバックします。
    - ホストが WSL2 の場合、または IPv4 のみの動作のほうが明示的に安定する場合は、ファミリー選択を強制します。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、Telegram メディアダウンロードではデフォルトですでに許可されています。信頼済みの fake-IP または transparent proxy が、メディアダウンロード中に `api.telegram.org` を他の private/internal/special-use アドレスへ書き換える場合、Telegram 専用のバイパスにオプトインできます。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインは、アカウントごとの
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` でも利用できます。
    - proxy が Telegram メディアホストを `198.18.x.x` に解決する場合は、まず dangerous flag をオフのままにしてください。Telegram メディアは RFC 2544 ベンチマーク範囲をデフォルトですでに許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram
      メディア SSRF 保護を弱めます。Clash、Mihomo、Surge fake-IP routing など、
      RFC 2544 ベンチマーク範囲外の private または special-use 応答を
      合成する、信頼済みのオペレーター管理 proxy 環境でのみ使用してください。
      通常の公開インターネットの Telegram アクセスではオフのままにしてください。
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

さらにヘルプ: [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主なリファレンス: [設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="重要度の高い Telegram フィールド">

- 起動/認証: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指す必要があります。シンボリックリンクは拒否されます）
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
マルチアカウントの優先順位: 2 つ以上のアカウント ID が設定されている場合、デフォルトルーティングを明示するために `channels.telegram.defaultAccount` を設定します（または `channels.telegram.accounts.default` を含めます）。そうでない場合、OpenClaw は最初の正規化済みアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループとトピックの許可リストの動作。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントへルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと強化。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントにマッピングします。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断診断。
  </Card>
</CardGroup>
