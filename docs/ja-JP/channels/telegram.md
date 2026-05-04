---
read_when:
    - Telegram 機能または Webhook に取り組む
summary: Telegram ボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-05-04T09:36:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5711d53cf908a14024bc5a94f7d590bb4bcb6963a1d78049d7782871f4eae932
    source_path: channels/telegram.md
    workflow: 16
---

本番対応済みで、grammY 経由のボット DM とグループに対応します。デフォルトのモードはロングポーリングです。Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルト DM ポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFather でボットトークンを作成する">
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

    env フォールバック: `TELEGRAM_BOT_TOKEN=...`（デフォルトアカウントのみ）。
    Telegram は `openclaw channels login telegram` を使用しません。config/env でトークンを設定してから Gateway を起動してください。

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
トークン解決順序はアカウントを考慮します。実際には、config 値が env フォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループ表示">
    Telegram ボットはデフォルトで **プライバシーモード**になっており、受信できるグループメッセージが制限されます。

    ボットがすべてのグループメッセージを見る必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする、または
    - ボットをグループ管理者にする。

    プライバシーモードを切り替えるときは、Telegram が変更を適用できるように、各グループでボットを削除してから再追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram グループ設定で制御されます。

    管理者ボットはすべてのグループメッセージを受信します。これは、常時オンのグループ動作に便利です。

  </Accordion>

  <Accordion title="便利な BotFather トグル">

    - グループ追加を許可/拒否するには `/setjoingroups`
    - グループ表示動作には `/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `dmPolicy: "open"` と `allowFrom: ["*"]` を組み合わせると、ボットのユーザー名を見つけるか推測した任意の Telegram アカウントがボットにコマンドを送れるようになります。意図的に公開するボットで、ツールを厳しく制限している場合にのみ使用してください。単一オーナーのボットでは、数値ユーザー ID を指定した `allowlist` を使用してください。

    `channels.telegram.allowFrom` は数値の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    複数アカウント設定では、制限的なトップレベルの `channels.telegram.allowFrom` は安全境界として扱われます。アカウントレベルの `allowFrom: ["*"]` エントリは、マージ後の有効なアカウント許可リストに明示的なワイルドカードがまだ含まれていない限り、そのアカウントを公開状態にはしません。
    `dmPolicy: "allowlist"` で `allowFrom` が空の場合はすべての DM がブロックされ、config 検証で拒否されます。
    セットアップでは数値ユーザー ID のみを求めます。
    アップグレード後、config に `@username` の許可リストエントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォート。Telegram ボットトークンが必要です）。
    以前ペアリングストアの許可リストファイルに依存していた場合、`openclaw doctor --fix` は allowlist フローでエントリを `channels.telegram.allowFrom` に復元できます（たとえば `dmPolicy: "allowlist"` にまだ明示的な ID がない場合）。

    単一オーナーのボットでは、以前のペアリング承認に依存せず、アクセスポリシーを config 内で永続化するために、明示的な数値 `allowFrom` ID を指定した `dmPolicy: "allowlist"` を推奨します。

    よくある混乱: DM ペアリング承認は「この送信者がどこでも認可される」という意味ではありません。
    ペアリングは DM アクセスを付与します。コマンドオーナーがまだ存在しない場合、最初に承認されたペアリングは `commands.ownerAllowFrom` も設定し、オーナー限定コマンドと exec 承認に明示的なオペレーターアカウントを持たせます。
    グループ送信者の認可は、引き続き明示的な config 許可リストから行われます。
    「一度認可されれば DM とグループコマンドの両方が動作する」ようにしたい場合は、数値の Telegram ユーザー ID を `channels.telegram.allowFrom` に入れてください。オーナー限定コマンドでは、`commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### Telegram ユーザー ID を見つける

    より安全な方法（サードパーティボットなし）:

    1. 自分のボットに DM を送ります。
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
       - `groups` config がない場合:
         - `groupPolicy: "open"` の場合: 任意のグループがグループ ID チェックを通過できます
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされます
       - `groups` が設定されている場合: 許可リストとして動作します（明示的な ID または `"*"`）

    2. **グループ内で許可される送信者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者フィルタリングに使用されます。設定されていない場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値の Telegram ユーザー ID にしてください（`telegram:` / `tg:` プレフィックスは正規化されます）。
    Telegram グループまたはスーパーグループのチャット ID を `groupAllowFrom` に入れないでください。負のチャット ID は `channels.telegram.groups` の下に置きます。
    数値でないエントリは送信者認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認証は DM ペアリングストア承認を継承しません。
    ペアリングは DM 専用のままです。グループでは、`groupAllowFrom` またはグループ別/トピック別の `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram はペアリングストアではなく config の `allowFrom` にフォールバックします。
    単一オーナーのボットでの実用的なパターン: 自分のユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` の下で許可します。
    ランタイム上の注意: `channels.telegram` が完全に存在しない場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムはフェイルクローズの `groupPolicy="allowlist"` にデフォルト設定されます。

    例: 1 つの特定グループ内の任意のメンバーを許可する:

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

      - `-1001234567890` のような負の Telegram グループまたはスーパーグループのチャット ID は `channels.telegram.groups` の下に置きます。
      - 許可済みグループ内でどの人がボットをトリガーできるかを制限したい場合は、`8734062810` のような Telegram ユーザー ID を `groupAllowFrom` の下に置きます。
      - 許可済みグループの任意のメンバーがボットに話しかけられるようにしたい場合にのみ、`groupAllowFrom: ["*"]` を使用します。

    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信はデフォルトでメンションを必要とします。

    メンションは次から来ることがあります。

    - ネイティブの `@botusername` メンション、または
    - 次のメンションパターン:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    セッションレベルのコマンドトグル:

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

    グループチャット ID の取得:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` から `chat.id` を読み取る
    - または Bot API の `getUpdates` を調べる

  </Tab>
</Tabs>

## ランタイム動作

- Telegram は Gateway プロセスによって所有されます。
- ルーティングは決定的です。Telegram の受信は Telegram に返信されます（モデルがチャネルを選択することはありません）。
- 受信メッセージは、返信メタデータとメディアプレースホルダーを含む共有チャネルエンベロープに正規化されます。
- グループセッションはグループ ID で分離されます。フォーラムトピックでは、トピックを分離したままにするために `:topic:<threadId>` が追加されます。
- DM メッセージには `message_thread_id` を含めることができます。OpenClaw は返信用にスレッド ID を保持しますが、デフォルトでは DM をフラットなセッションのままにします。意図的に DM トピックのセッション分離を行いたい場合は、`channels.telegram.dm.threadReplies: "inbound"`、`channels.telegram.direct.<chatId>.threadReplies: "inbound"`、`requireTopic: true`、または一致するトピック config を設定してください。
- ロングポーリングは、チャット別/スレッド別のシーケンス処理を備えた grammY runner を使用します。runner sink 全体の同時実行数は `agents.defaults.maxConcurrent` を使用します。
- ロングポーリングは各 Gateway プロセス内で保護されるため、一度に 1 つのアクティブなポーラーだけがボットトークンを使用できます。それでも `getUpdates` の 409 競合が表示される場合は、別の OpenClaw Gateway、スクリプト、または外部ポーラーが同じトークンを使用している可能性があります。
- ロングポーリングのウォッチドッグ再起動は、デフォルトで完了済みの `getUpdates` ライブネスが 120 秒間ない場合にトリガーされます。長時間実行される作業中に、デプロイで誤ったポーリング停止再起動がまだ発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒単位で、`30000` から `600000` まで許可されます。アカウント別の上書きもサポートされています。
- Telegram Bot API には既読確認のサポートはありません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は部分返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress`（デフォルト: `partial`）
    - `progress` は編集可能なステータス下書きを 1 つ保持し、最終配信までツールの進捗で更新します
    - `streaming.preview.toolProgress` は、ツール/進捗更新が同じ編集済みプレビューメッセージを再利用するかどうかを制御します（プレビューストリーミングがアクティブな場合のデフォルト: `true`）
    - `streaming.preview.commandText` は、それらのツール進捗行内のコマンド/exec 詳細を制御します: `raw`（デフォルト、リリース済みの動作を保持）または `status`（ツールラベルのみ）
    - 従来の `channels.telegram.streamMode` とブール値の `streaming` 値は検出されます。`openclaw doctor --fix` を実行して `channels.telegram.streaming.mode` に移行してください

    ツール進捗プレビュー更新とは、コマンド実行、ファイル読み取り、計画更新、パッチ要約など、ツールの実行中に表示される短いステータス行です。Telegram では、`v2026.4.22` 以降のリリース済み OpenClaw 動作に合わせるため、これらはデフォルトで有効です。回答テキスト用の編集済みプレビューは維持しつつ、ツール進捗行を非表示にするには、次を設定します。

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

    ツール進捗を表示したままコマンド/exec テキストを非表示にするには、次を設定します。

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

    進行状況ドラフトモードでは、同じコマンドテキストポリシーを `streaming.progress` の下に配置します。

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

    最終配信のみが必要な場合にだけ `streaming.mode: "off"` を使用します。Telegram プレビュー編集は無効になり、汎用的なツール/進行状況の雑談は、独立したステータスメッセージとして送信される代わりに抑制されます。承認プロンプト、メディアペイロード、エラーは、引き続き通常の最終配信を通じてルーティングされます。ツール進行状況のステータス行を非表示にしつつ、回答プレビュー編集だけを維持したい場合は `streaming.preview.toolProgress: false` を使用します。

    <Note>
      Telegram の選択引用返信は例外です。`replyToMode` が `"first"`、`"all"`、または `"batched"` で、受信メッセージに選択された引用テキストが含まれる場合、OpenClaw は回答プレビューを編集する代わりに Telegram のネイティブ引用返信経路で最終回答を送信するため、そのターンでは `streaming.preview.toolProgress` は短いステータス行を表示できません。選択された引用テキストのない現在メッセージへの返信では、引き続きプレビューストリーミングが維持されます。ネイティブ引用返信よりもツール進行状況の可視性を重視する場合は `replyToMode: "off"` を設定するか、このトレードオフを受け入れるために `streaming.preview.toolProgress: false` を設定します。
    </Note>

    テキストのみの返信の場合:

    - 短い DM/グループ/トピックのプレビュー: OpenClaw は同じプレビューメッセージを維持し、プレビュー表示後に表示可能な非プレビューメッセージが送信されていない限り、その場で最終編集を行います
    - プレビューの後に表示可能な非プレビュー出力が続く場合: OpenClaw は完了した返信を新しい最終メッセージとして送信し、古いプレビューをクリーンアップするため、最終回答は中間出力の後に表示されます
    - 約 1 分より古いプレビュー: OpenClaw は完了した返信を新しい最終メッセージとして送信してからプレビューをクリーンアップするため、Telegram の表示タイムスタンプはプレビュー作成時刻ではなく完了時刻を反映します

    複雑な返信（たとえばメディアペイロード）の場合、OpenClaw は通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューストリーミングはブロックストリーミングとは別です。Telegram でブロックストリーミングが明示的に有効化されている場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

    Telegram のみの推論ストリーム:

    - `/reasoning stream` は生成中に推論をライブプレビューへ送信します
    - 推論プレビューは最終配信後に削除されます。推論を表示したままにする必要がある場合は `/reasoning on` を使用します
    - 最終回答は推論テキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定と HTML フォールバック">
    送信テキストは Telegram `parse_mode: "HTML"` を使用します。

    - Markdown 風のテキストは Telegram で安全な HTML にレンダリングされます。
    - 生のモデル HTML は、Telegram の解析失敗を減らすためにエスケープされます。
    - Telegram が解析済み HTML を拒否した場合、OpenClaw はプレーンテキストで再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効にできます。

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

    - 名前は正規化されます（先頭の `/` を削除し、小文字化）
    - 有効なパターン: `a-z`、`0-9`、`_`、長さ `1..32`
    - カスタムコマンドはネイティブコマンドを上書きできません
    - 競合/重複はスキップされ、ログに記録されます

    注記:

    - カスタムコマンドはメニュー項目のみです。動作を自動実装しません
    - Plugin/skill コマンドは、Telegram メニューに表示されていない場合でも、入力すれば引き続き動作できます

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。カスタム/Plugin コマンドは、設定されていれば引き続き登録される場合があります。

    よくあるセットアップ失敗:

    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、トリミング後も Telegram メニューがまだ上限を超えていることを意味します。Plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - 直接の Bot API curl コマンドは動作するのに、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合、`channels.telegram.apiRoot` が完全な `/bot<TOKEN>` エンドポイントに設定されている可能性があります。`apiRoot` は Bot API ルートのみである必要があり、`openclaw doctor --fix` は誤って付いた末尾の `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、Telegram が設定済みボットトークンを拒否したことを意味します。現在の BotFather トークンで `botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN` を更新してください。OpenClaw はポーリング前に停止するため、これは Webhook クリーンアップ失敗として報告されません。
    - ネットワーク/fetch エラーを伴う `setMyCommands failed` は、通常 `api.telegram.org` への送信 DNS/HTTPS がブロックされていることを意味します。

    ### デバイスペアリングコマンド（`device-pair` Plugin）

    `device-pair` Plugin がインストールされている場合:

    1. `/pair` がセットアップコードを生成します
    2. iOS アプリにコードを貼り付けます
    3. `/pair pending` は保留中のリクエスト（ロール/スコープを含む）を一覧表示します
    4. リクエストを承認します:
       - 明示的に承認する場合は `/pair approve <requestId>`
       - 保留中のリクエストが 1 件だけの場合は `/pair approve`
       - 最新のものには `/pair approve latest`

    セットアップコードには短命のブートストラップトークンが含まれます。組み込みのブートストラップ引き渡しは、プライマリノードトークンを `scopes: []` のまま維持します。引き渡されたオペレータートークンは、`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されたままです。ブートストラップスコープチェックにはロールの接頭辞が付くため、そのオペレーター許可リストはオペレーターリクエストのみを満たします。非オペレーターロールでは、引き続き自身のロール接頭辞の下にスコープが必要です。

    デバイスが変更された認証詳細（たとえばロール/スコープ/公開鍵）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストは別の `requestId` を使用します。承認前に `/pair pending` を再実行してください。

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

    チャンネルメッセージアクションは扱いやすいエイリアス（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）を公開します。

    ゲート制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（デフォルト: 無効）

    注記: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    ランタイム送信はアクティブな設定/シークレットのスナップショット（起動/リロード）を使用するため、アクション経路は送信ごとにアドホックな SecretRef 再解決を行いません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッド化タグ">
    Telegram は生成出力内の明示的な返信スレッド化タグをサポートします。

    - `[[reply_to_current]]` はトリガーしたメッセージに返信します
    - `[[reply_to:<id>]]` は特定の Telegram メッセージ ID に返信します

    `channels.telegram.replyToMode` は処理を制御します。

    - `off`（デフォルト）
    - `first`
    - `all`

    返信スレッド化が有効で、元の Telegram テキストまたはキャプションが利用可能な場合、OpenClaw はネイティブ Telegram 引用抜粋を自動的に含めます。Telegram はネイティブ引用テキストを 1024 UTF-16 コード単位に制限しているため、より長いメッセージは先頭から引用され、Telegram が引用を拒否した場合はプレーン返信にフォールバックします。

    注記: `off` は暗黙の返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッド動作">
    フォーラムスーパーグループ:

    - トピックセッションキーは `:topic:<threadId>` を追加します
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック（`threadId=1`）の特殊ケース:

    - メッセージ送信では `message_thread_id` を省略します（Telegram は `sendMessage(...thread_id=1)` を拒否します）
    - 入力中アクションには引き続き `message_thread_id` が含まれます

    トピック継承: トピック項目は、上書きされない限りグループ設定（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）を継承します。
    `agentId` はトピック専用で、グループのデフォルトから継承されません。

    **トピックごとのエージェントルーティング**: トピック設定で `agentId` を設定すると、各トピックを別のエージェントにルーティングできます。これにより、各トピックは独自の分離されたワークスペース、メモリ、セッションを持ちます。例:

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

    各トピックは次のような独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続的な ACP トピックバインディング**: フォーラムトピックは、トップレベルの型付き ACP バインディング（`type: "acp"` と `match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾 ID を持つ `bindings[]`）を通じて ACP ハーネスセッションをピン留めできます。現在はグループ/スーパーグループ内のフォーラムトピックにスコープされています。[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

    **チャットからのスレッド紐づけ ACP スポーン**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しい ACP セッションにバインドします。後続のやり取りはそこへ直接ルーティングされます。OpenClaw はスポーン確認をトピック内にピン留めします。`channels.telegram.threadBindings.spawnSessions` が有効なままである必要があります（デフォルト: `true`）。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは、デフォルトではフラットなセッションで DM ルーティングと返信メタデータを保持します。`threadReplies: "inbound"`、`threadReplies: "always"`、`requireTopic: true`、または一致するトピック設定で構成されている場合にのみ、スレッド対応のセッションキーを使用します。アカウントのデフォルトにはトップレベルの `channels.telegram.dm.threadReplies` を使用し、1 つの DM には `direct.<chatId>.threadReplies` を使用します。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram はボイスメモと音声ファイルを区別します。

    - デフォルト: 音声ファイルの動作
    - エージェントの返信にタグ `[[audio_as_voice]]` を付けると、ボイスメモ送信を強制します
    - 受信したボイスメモの文字起こしは、エージェントコンテキスト内で機械生成の
      信頼できないテキストとして扱われます。メンション検出は引き続き生の
      文字起こしを使用するため、メンション制限付きの音声メッセージは動作し続けます。

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

    ビデオメモはキャプションに対応していません。指定されたメッセージテキストは別途送信されます。

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

    キャッシュされたステッカーを検索する:

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

    有効にすると、OpenClaw は次のようなシステムイベントをキューに入れます:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注記:

    - `own` は、bot が送信したメッセージへのユーザーリアクションのみを意味します（送信済みメッセージキャッシュによるベストエフォート）。
    - リアクションイベントにも Telegram アクセス制御（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）が適用されます。許可されていない送信者は破棄されます。
    - Telegram はリアクション更新でスレッド ID を提供しません。
      - 非フォーラムグループはグループチャットセッションにルーティングされます
      - フォーラムグループは、正確な発生元トピックではなく、グループの一般トピックセッション（`:topic:1`）にルーティングされます

    ポーリング/Webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認用 emoji を送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェント ID emoji フォールバック（`agents.list[].identity.emoji`、なければ "👀"）

    注記:

    - Telegram は Unicode emoji（例: "👀"）を想定します。
    - チャンネルまたはアカウントのリアクションを無効にするには `""` を使用します。

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
    デフォルトはロングポーリングです。Webhook モードでは `channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。任意で `webhookPath`、`webhookHost`、`webhookPort`（デフォルトは `/telegram-webhook`、`127.0.0.1`、`8787`）を設定できます。

    ローカルリスナーは `127.0.0.1:8787` にバインドします。公開 ingress には、ローカルポートの前段にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定してください。

    Webhook モードは、Telegram に `200` を返す前に、リクエストガード、Telegram シークレットトークン、JSON 本文を検証します。
    その後 OpenClaw は、ロングポーリングで使用するものと同じチャット単位/トピック単位の bot レーンを通じて更新を非同期に処理するため、遅いエージェントターンが Telegram の配信 ACK を保持することはありません。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信 Telegram メディアサイズを制限します。
    - `channels.telegram.mediaGroupFlushMs`（デフォルト 500）は、OpenClaw が Telegram のアルバム/メディアグループを 1 つの受信メッセージとしてディスパッチする前に、どれだけ長くバッファするかを制御します。アルバムの一部が遅れて届く場合は増やし、アルバム返信のレイテンシを減らすには減らしてください。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定の場合は grammY のデフォルトが適用されます）。bot クライアントは、OpenClaw のトランスポートガードとフォールバックが実行される前に grammY が目に見える返信配信を中止しないよう、60 秒の送信テキスト/タイピングリクエストガード未満の構成値をクランプします。ロングポーリングでは引き続き 45 秒の `getUpdates` リクエストガードを使用するため、アイドルポーリングが無期限に放棄されることはありません。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。誤検知によるポーリング停止再起動の場合にのみ、`30000` から `600000` の間で調整してください。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト 50）を使用します。`0` で無効化します。
    - 返信/引用/転送の補足コンテキストは、現在は受信したまま渡されます。
    - Telegram 許可リストは主に、誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキスト秘匿境界ではありません。
    - DM 履歴制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、回復可能な送信 API エラーに対して Telegram 送信ヘルパー（CLI/ツール/アクション）に適用されます。受信の最終返信配信にも、Telegram の接続前失敗に対して上限付きの safe-send 再試行が使用されますが、目に見えるメッセージが重複する可能性がある、送信後の曖昧なネットワークエンベロープは再試行しません。

    CLI とメッセージツールの送信ターゲットには、数値チャット ID、ユーザー名、またはフォーラムトピックターゲットを使用できます:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram ポーリングは `openclaw message poll` を使用し、フォーラムトピックに対応しています:

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

    Telegram 送信は次にも対応しています:

    - `channels.telegram.capabilities.inlineButtons` が許可する場合、インラインキーボード用の `buttons` ブロックを含む `--presentation`
    - bot がそのチャットでピン留めできる場合、ピン留め配信を要求する `--pin` または `--delivery '{"pin":true}'`
    - 送信画像と GIF を、圧縮写真またはアニメーションメディアアップロードではなくドキュメントとして送信する `--force-document`

    アクション制御:

    - `channels.telegram.actions.sendMessage=false` は、ポーリングを含む送信 Telegram メッセージを無効にします
    - `channels.telegram.actions.poll=false` は、通常の送信を有効なままにして Telegram ポーリング作成を無効にします

  </Accordion>

  <Accordion title="Telegram での exec 承認">
    Telegram は承認者 DM で exec 承認をサポートし、任意で発生元のチャットまたはトピックにプロンプトを投稿できます。承認者は数値の Telegram ユーザー ID である必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled`（少なくとも 1 人の承認者を解決できる場合に自動で有効化）
    - `channels.telegram.execApprovals.approvers`（`commands.ownerAllowFrom` の数値オーナー ID にフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom`、`defaultTo` は、誰が bot と会話できるか、通常の返信をどこに送るかを制御します。これらは誰かを exec 承認者にするものではありません。コマンドオーナーがまだ存在しない場合、最初に承認された DM ペアリングが `commands.ownerAllowFrom` をブートストラップするため、1 オーナー構成でも `execApprovals.approvers` に ID を重複して指定せずに動作します。

    チャンネル配信ではコマンドテキストがチャットに表示されます。信頼できるグループ/トピックでのみ `channel` または `both` を有効にしてください。プロンプトがフォーラムトピックに届いた場合、OpenClaw は承認プロンプトとフォローアップにそのトピックを保持します。exec 承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンでは、ターゲットサーフェス（`dm`、`group`、または `all`）を許可する `channels.telegram.capabilities.inlineButtons` も必要です。`plugin:` で始まる承認 ID は Plugin 承認を通じて解決されます。それ以外はまず exec 承認を通じて解決されます。

    [Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信制御

エージェントで配信エラーまたはプロバイダーエラーが発生した場合、Telegram はエラーテキストで返信するか、それを抑制できます。この動作は 2 つの設定キーで制御します:

| キー                                 | 値                | デフォルト | 説明                                                                                                      |
| ----------------------------------- | ----------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` はチャットに親しみやすいエラーメッセージを送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | 同じチャットへのエラー返信間の最小時間です。障害中のエラースパムを防ぎます。                            |

アカウント単位、グループ単位、トピック単位の上書きに対応しています（他の Telegram 設定キーと同じ継承）。

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
  <Accordion title="メンションのないグループメッセージに bot が応答しない">

    - `requireMention=false` の場合、Telegram のプライバシーモードで完全な表示を許可する必要があります。
      - BotFather: `/setprivacy` -> Disable
      - その後、グループからボットを削除して再追加します
    - 設定がメンションなしのグループメッセージを想定している場合、`openclaw channels status` が警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認できます。ワイルドカード `"*"` はメンバーシップをプローブできません。
    - クイックセッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、グループは一覧に含まれている必要があります（または `"*"` を含めます）
    - グループ内のボットメンバーシップを確認します
    - スキップ理由についてログを確認します: `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが部分的に動作する、またはまったく動作しない">

    - 送信者 ID を認可します（ペアリングおよび/または数値の `allowFrom`）
    - グループポリシーが `open` の場合でも、コマンド認可は引き続き適用されます
    - `setMyCommands failed` と `BOT_COMMANDS_TOO_MUCH` は、ネイティブメニューの項目が多すぎることを意味します。plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効にします
    - 起動時の `deleteMyCommands` / `setMyCommands` 呼び出しと `sendChatAction` の入力中呼び出しは制限付きで、リクエストタイムアウト時には Telegram のトランスポートフォールバックを通じて 1 回再試行します。永続的なネットワーク/取得エラーは通常、`api.telegram.org` への DNS/HTTPS 到達性の問題を示します

  </Accordion>

  <Accordion title="起動時に未認可トークンが報告される">

    - `getMe returned 401` は、設定されたボットトークンに対する Telegram 認証失敗です。
    - BotFather でボットトークンを再コピーまたは再生成し、デフォルトアカウント用の `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken`、または `TELEGRAM_BOT_TOKEN` を更新します。
    - 起動中の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「webhook が存在しない」と扱うと、同じ不正なトークンによる失敗を後続の API 呼び出しに先送りするだけです。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - Node 22+ とカスタム fetch/proxy は、AbortSignal 型が一致しない場合に即時中断動作を引き起こすことがあります。
    - 一部のホストは `api.telegram.org` を IPv6 に先に解決します。IPv6 の外向き通信が壊れていると、Telegram API の断続的な失敗が発生する可能性があります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw は現在これらを回復可能なネットワークエラーとして再試行します。
    - ポーリング起動中、OpenClaw は成功した起動時の `getMe` プローブを grammY に再利用するため、runner は最初の `getUpdates` の前に 2 回目の `getMe` を必要としません。
    - ポーリング起動中に一時的なネットワークエラーで `deleteWebhook` が失敗した場合、OpenClaw は別のポーリング前コントロールプレーン呼び出しを行わずにロングポーリングへ進みます。まだ有効な webhook は `getUpdates` の競合として表面化します。その後、OpenClaw は Telegram トランスポートを再構築し、webhook クリーンアップを再試行します。
    - Telegram ソケットが短い固定間隔で再利用される場合は、低い `channels.telegram.timeoutSeconds` が設定されていないか確認してください。ボットクライアントは、外向きおよび `getUpdates` リクエストガードより低い設定値をクランプしますが、古いリリースではこの値がそれらのガードより低いと、すべてのポーリングまたは返信が中断されることがありました。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw はデフォルトで、完了したロングポール生存確認が 120 秒ないとポーリングを再起動し、Telegram トランスポートを再構築します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中のポーリングアカウントが起動猶予後に `getUpdates` を完了していない場合、実行中の webhook アカウントが起動猶予後に `setWebhook` を完了していない場合、または最後に成功したポーリングトランスポートアクティビティが古い場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しは正常だが、ホストが誤ったポーリング停止再起動を報告する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。永続的な停止は通常、ホストと `api.telegram.org` の間の proxy、DNS、IPv6、または TLS 外向き通信の問題を示します。
    - Telegram は Bot API トランスポートについて、`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` とそれらの小文字バリアントを含む、プロセス proxy 環境変数も尊重します。`NO_PROXY` / `no_proxy` は引き続き `api.telegram.org` をバイパスできます。
    - サービス環境で OpenClaw 管理 proxy が `OPENCLAW_PROXY_URL` を通じて設定され、標準 proxy 環境変数が存在しない場合、Telegram もその URL を Bot API トランスポートに使用します。
    - 直接の外向き通信/TLS が不安定な VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由でルーティングします。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ はデフォルトで `autoSelectFamily=true` です（WSL2 を除く）。Telegram DNS 結果順は、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、次に `channels.telegram.network.dnsResultOrder`、次に `NODE_OPTIONS=--dns-result-order=ipv4first` などのプロセスデフォルトを尊重します。いずれも適用されない場合、Node 22+ は `ipv4first` にフォールバックします。
    - ホストが WSL2 の場合、または IPv4 のみの動作のほうが明示的に良好な場合は、ファミリー選択を強制します。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、デフォルトですでに Telegram メディアダウンロードに許可されています。信頼済みの fake-IP または透過 proxy が、メディアダウンロード中に `api.telegram.org` を他の private/internal/special-use アドレスへ書き換える場合は、Telegram のみのバイパスにオプトインできます。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインはアカウントごとに
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
      でも利用できます。
    - proxy が Telegram メディアホストを `198.18.x.x` に解決する場合は、まず危険なフラグをオフのままにしてください。Telegram メディアはデフォルトですでに RFC 2544 ベンチマーク範囲を許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram
      メディアの SSRF 保護を弱めます。Clash、Mihomo、Surge の fake-IP ルーティングのように、RFC 2544 ベンチマーク範囲外の private または special-use 応答を合成する、信頼済みでオペレーター管理の proxy 環境でのみ使用してください。通常の公開インターネット経由の Telegram アクセスではオフのままにしてください。
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

詳細なヘルプ: [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主要リファレンス: [設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="高シグナルな Telegram フィールド">

- 起動/認証: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指す必要があります。シンボリックリンクは拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, トップレベルの `bindings[]`（`type: "acp"`）
- exec 承認: `execApprovals`, `accounts.*.execApprovals`
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
マルチアカウントの優先順位: 2 つ以上のアカウント ID が設定されている場合、`channels.telegram.defaultAccount` を設定する（または `channels.telegram.accounts.default` を含める）ことで、デフォルトルーティングを明示します。そうしない場合、OpenClaw は最初に正規化されたアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループとトピックの許可リスト動作。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
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
