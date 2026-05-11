---
read_when:
    - Telegram の機能または Webhook に取り組む
summary: Telegram ボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-05-11T20:21:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f14e59b18e3727b13598d2a5f83ba3ca4267c27c1bd295d36ad20c64707791a
    source_path: channels/telegram.md
    workflow: 16
---

本番環境で bot の DM とグループに grammY 経由で対応します。デフォルトのモードはロングポーリングです。Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルト DM ポリシーはペアリングです。
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

    Env フォールバック: `TELEGRAM_BOT_TOKEN=...`（デフォルトアカウントのみ）。
    Telegram は `openclaw channels login telegram` を使用しません。config/env でトークンを設定してから、gateway を起動してください。

  </Step>

  <Step title="gateway を起動して最初の DM を承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは 1 時間後に期限切れになります。

  </Step>

  <Step title="bot をグループに追加する">
    bot をグループに追加してから、グループアクセスに必要な 2 つの ID を取得します。

    - `allowFrom` / `groupAllowFrom` で使用する Telegram ユーザー ID
    - `channels.telegram.groups` の下のキーとして使用する Telegram グループチャット ID

    初回セットアップでは、`openclaw logs --follow`、転送 ID bot、または Bot API `getUpdates` からグループチャット ID を取得します。グループが許可された後は、`/whoami@<bot_username>` でユーザー ID とグループ ID を確認できます。

    `-100` で始まる負の Telegram スーパーグループ ID はグループチャット ID です。これらは `groupAllowFrom` ではなく、`channels.telegram.groups` の下に置いてください。

  </Step>
</Steps>

<Note>
トークン解決順序はアカウント対応です。実際には、config の値が env フォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループ可視性">
    Telegram bot はデフォルトで **プライバシーモード** になっており、グループ内で受信するメッセージが制限されます。

    bot がすべてのグループメッセージを見る必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする、または
    - bot をグループ管理者にする。

    プライバシーモードを切り替える場合は、Telegram が変更を適用するように、各グループで bot を削除して再追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram グループ設定で制御されます。

    管理者 bot はすべてのグループメッセージを受信するため、常時有効なグループ動作に便利です。

  </Accordion>

  <Accordion title="便利な BotFather 切り替え">

    - グループ追加を許可/拒否するには `/setjoingroups`
    - グループ可視性の動作には `/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御とアクティベーション

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要あり）
    - `disabled`

    `allowFrom: ["*"]` を伴う `dmPolicy: "open"` は、bot ユーザー名を見つけた、または推測した任意の Telegram アカウントが bot にコマンドを送れるようにします。厳しく制限されたツールを持つ意図的に公開された bot にのみ使用してください。所有者 1 人の bot では、数値ユーザー ID を指定した `allowlist` を使用するべきです。

    `channels.telegram.allowFrom` は数値の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    複数アカウント設定では、制限的なトップレベルの `channels.telegram.allowFrom` は安全境界として扱われます。アカウントレベルの `allowFrom: ["*"]` エントリは、マージ後の有効なアカウント allowlist に明示的なワイルドカードがまだ含まれていない限り、そのアカウントを公開状態にしません。
    空の `allowFrom` を伴う `dmPolicy: "allowlist"` はすべての DM をブロックし、config 検証で拒否されます。
    セットアップでは数値ユーザー ID のみを求めます。
    アップグレード後に config に `@username` allowlist エントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォート。Telegram bot トークンが必要です）。
    以前にペアリングストアの allowlist ファイルに依存していた場合、`openclaw doctor --fix` は allowlist フロー内でエントリを `channels.telegram.allowFrom` に復旧できます（たとえば `dmPolicy: "allowlist"` にまだ明示的な ID がない場合）。

    所有者 1 人の bot では、以前のペアリング承認に依存する代わりに、明示的な数値 `allowFrom` ID を指定した `dmPolicy: "allowlist"` を優先し、アクセスポリシーを config 内で永続化してください。

    よくある混乱: DM ペアリングの承認は「この送信者がどこでも認可されている」ことを意味しません。
    ペアリングは DM アクセスを付与します。コマンド所有者がまだ存在しない場合、最初に承認されたペアリングは `commands.ownerAllowFrom` も設定し、所有者専用コマンドと exec 承認に明示的なオペレーターアカウントを持たせます。
    グループ送信者の認可は、引き続き明示的な config allowlist から来ます。
    「一度認可されれば DM とグループコマンドの両方が機能する」ようにしたい場合は、数値の Telegram ユーザー ID を `channels.telegram.allowFrom` に入れてください。所有者専用コマンドについては、`commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### Telegram ユーザー ID を見つける

    より安全な方法（サードパーティ bot なし）:

    1. bot に DM します。
    2. `openclaw logs --follow` を実行します。
    3. `from.id` を読み取ります。

    公式 Bot API の方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシーは低め）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと allowlist">
    2 つの制御が一緒に適用されます。

    1. **許可されるグループ**（`channels.telegram.groups`）
       - `groups` config なし:
         - `groupPolicy: "open"` の場合: 任意のグループがグループ ID チェックを通過できます
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`) を追加するまでグループはブロックされます
       - `groups` が設定されている場合: allowlist として動作します（明示的な ID または `"*"`）

    2. **グループ内で許可される送信者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者フィルタリングに使用されます。設定されていない場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値の Telegram ユーザー ID にしてください（`telegram:` / `tg:` プレフィックスは正規化されます）。
    Telegram グループまたはスーパーグループのチャット ID を `groupAllowFrom` に入れないでください。負のチャット ID は `channels.telegram.groups` の下に属します。
    数値でないエントリは送信者認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認証は DM ペアリングストア承認を継承しません。
    ペアリングは DM 専用のままです。グループでは、`groupAllowFrom` またはグループ別/トピック別の `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram はペアリングストアではなく config の `allowFrom` にフォールバックします。
    所有者 1 人の bot の実用パターン: 自分のユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` の下で許可します。
    ランタイム注記: `channels.telegram` が完全に欠落している場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムは fail-closed の `groupPolicy="allowlist"` をデフォルトにします。

    所有者専用グループセットアップ:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    グループから `@<bot_username> ping` でテストします。`requireMention: true` の間、通常のグループメッセージでは bot は起動しません。

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

    例: 1 つの特定グループ内の特定ユーザーだけを許可する:

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
      よくある間違い: `groupAllowFrom` は Telegram グループ allowlist ではありません。

      - `-1001234567890` のような負の Telegram グループまたはスーパーグループチャット ID は `channels.telegram.groups` の下に置いてください。
      - 許可されたグループ内で bot を起動できる人を制限したい場合は、`8734062810` のような Telegram ユーザー ID を `groupAllowFrom` の下に置いてください。
      - 許可されたグループの任意のメンバーが bot と会話できるようにしたい場合にのみ `groupAllowFrom: ["*"]` を使用してください。

    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信はデフォルトでメンションを必要とします。

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

    グループチャット ID の取得:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` から `chat.id` を読み取る
    - または Bot API `getUpdates` を確認する
    - グループが許可された後、ネイティブコマンドが有効なら `/whoami@<bot_username>` を実行する

  </Tab>
</Tabs>

## ランタイム動作

- Telegram は gateway プロセスによって所有されます。
- ルーティングは決定的です。Telegram の受信は Telegram に返信されます（モデルはチャネルを選びません）。
- 受信メッセージは、返信メタデータ、メディアプレースホルダー、gateway が観測した Telegram 返信の永続化された返信チェーンコンテキストを持つ共有チャネルエンベロープに正規化されます。
- グループセッションはグループ ID で分離されます。フォーラムトピックは `:topic:<threadId>` を追加してトピックを分離します。
- DM メッセージは `message_thread_id` を持つことができます。OpenClaw は返信用にスレッド ID を保持しますが、デフォルトでは DM をフラットなセッションに保ちます。DM トピックのセッション分離を意図的に行いたい場合は、`channels.telegram.dm.threadReplies: "inbound"`、`channels.telegram.direct.<chatId>.threadReplies: "inbound"`、`requireTopic: true`、または一致するトピック config を設定してください。
- ロングポーリングは per-chat/per-thread シーケンス制御を備えた grammY runner を使用します。全体の runner sink 同時実行数には `agents.defaults.maxConcurrent` が使用されます。
- ロングポーリングは各 gateway プロセス内で保護されているため、1 つの bot トークンを同時に使用できるアクティブな poller は 1 つだけです。それでも `getUpdates` 409 競合が表示される場合、別の OpenClaw gateway、script、または外部 poller が同じトークンを使用している可能性があります。
- ロングポーリングの watchdog 再起動は、デフォルトでは完了した `getUpdates` liveness が 120 秒間ない場合にトリガーされます。長時間実行される作業中にデプロイ環境で誤った polling-stall 再起動がまだ発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒で、`30000` から `600000` まで許可されます。アカウント別の上書きもサポートされています。
- Telegram Bot API は既読通知をサポートしていません（`sendReadReceipts` は適用されません）。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は部分返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress` です (デフォルト: `partial`)
    - `progress` はツール進行状況用に編集可能なステータス下書きを1つ保持し、完了時にそれをクリアして、最終回答を通常のメッセージとして送信します
    - `streaming.preview.toolProgress` は、ツール/進行状況の更新で、同じ編集済みプレビューメッセージを再利用するかどうかを制御します (デフォルト: プレビューストリーミングが有効な場合は `true`)
    - `streaming.preview.commandText` は、それらのツール進行状況行内のコマンド/実行の詳細を制御します: `raw` (デフォルト、リリース済みの挙動を保持) または `status` (ツールラベルのみ)
    - 旧来の `channels.telegram.streamMode` と真偽値の `streaming` 値は検出されます。それらを `channels.telegram.streaming.mode` に移行するには `openclaw doctor --fix` を実行してください

    ツール進行状況のプレビュー更新は、ツールの実行中に表示される短いステータス行です。たとえば、コマンド実行、ファイル読み取り、計画の更新、パッチ要約などです。Telegram では、`v2026.4.22` 以降のリリース済み OpenClaw の挙動に合わせるため、これらはデフォルトで有効です。回答テキスト用の編集済みプレビューは保持しつつ、ツール進行状況行を非表示にするには、次のように設定します:

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

    ツール進行状況は表示したまま、コマンド/実行テキストを非表示にするには、次のように設定します:

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

    同じメッセージに最終回答を編集して入れずに、ツール進行状況を表示したい場合は `progress` モードを使用します。コマンドテキストポリシーは `streaming.progress` の下に置きます:

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

    `streaming.mode: "off"` は、最終結果のみを配信したい場合にだけ使用します。Telegram のプレビュー編集は無効になり、汎用的なツール/進行状況のやり取りは、単独のステータスメッセージとして送信される代わりに抑制されます。承認プロンプト、メディアペイロード、エラーは引き続き通常の最終配信経路を通ります。ツール進行状況のステータス行を非表示にしつつ回答プレビュー編集だけを保持したい場合は、`streaming.preview.toolProgress: false` を使用します。

    <Note>
      Telegram の選択引用返信は例外です。`replyToMode` が `"first"`、`"all"`、または `"batched"` で、受信メッセージに選択された引用テキストが含まれる場合、OpenClaw は回答プレビューを編集する代わりに、Telegram のネイティブ引用返信経路で最終回答を送信するため、`streaming.preview.toolProgress` はそのターンの短いステータス行を表示できません。選択引用テキストのない現在メッセージへの返信では、引き続きプレビューストリーミングが維持されます。ネイティブ引用返信よりツール進行状況の可視性が重要な場合は `replyToMode: "off"` を設定するか、トレードオフを受け入れるために `streaming.preview.toolProgress: false` を設定してください。
    </Note>

    テキストのみの返信の場合:

    - 短い DM/グループ/トピックプレビューでは、OpenClaw は同じプレビューメッセージを保持し、最終編集をその場で実行します
    - 複数の Telegram メッセージに分割される長いテキストの最終結果では、可能な場合は既存のプレビューを最初の最終チャンクとして再利用し、その後で残りのチャンクのみを送信します
    - progress モードの最終結果では、ステータス下書きをクリアし、その下書きを回答に編集する代わりに通常の最終配信を使用します
    - 完了済みテキストが確認される前に最終編集が失敗した場合、OpenClaw は通常の最終配信を使用し、古いプレビューをクリーンアップします

    複雑な返信 (たとえばメディアペイロード) の場合、OpenClaw は通常の最終配信にフォールバックし、その後でプレビューメッセージをクリーンアップします。

    プレビューストリーミングはブロックストリーミングとは別です。Telegram でブロックストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

    Telegram 専用の推論ストリーム:

    - `/reasoning stream` は生成中に推論をライブプレビューへ送信します
    - 推論プレビューは最終配信後に削除されます。推論を表示したままにする必要がある場合は `/reasoning on` を使用します
    - 最終回答は推論テキストなしで送信されます

  </Accordion>

  <Accordion title="書式設定と HTML フォールバック">
    送信テキストは Telegram の `parse_mode: "HTML"` を使用します。

    - Markdown 風のテキストは Telegram で安全な HTML にレンダリングされます。
    - 生のモデル HTML は、Telegram の解析失敗を減らすためにエスケープされます。
    - Telegram が解析済み HTML を拒否した場合、OpenClaw はプレーンテキストとして再試行します。

    リンクプレビューはデフォルトで有効で、`channels.telegram.linkPreview: false` で無効にできます。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram コマンドメニュー登録は、起動時に `setMyCommands` で処理されます。

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

    - 名前は正規化されます (先頭の `/` を削除し、小文字化)
    - 有効なパターン: `a-z`、`0-9`、`_`、長さ `1..32`
    - カスタムコマンドはネイティブコマンドを上書きできません
    - 競合/重複はスキップされ、ログに記録されます

    注記:

    - カスタムコマンドはメニュー項目のみです。挙動は自動実装されません
    - Plugin/Skill コマンドは、Telegram メニューに表示されていなくても入力された場合は引き続き動作できます

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。カスタム/Plugin コマンドは、設定されていれば引き続き登録される場合があります。

    よくあるセットアップ失敗:

    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、トリミング後も Telegram メニューがまだ上限を超えていたことを意味します。Plugin/Skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - 直接の Bot API curl コマンドは動作するのに、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合、`channels.telegram.apiRoot` が完全な `/bot<TOKEN>` エンドポイントに設定されていた可能性があります。`apiRoot` は Bot API ルートのみである必要があり、`openclaw doctor --fix` は誤って末尾に付いた `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、Telegram が設定済みのボットトークンを拒否したことを意味します。現在の BotFather トークンで `botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN` を更新してください。OpenClaw はポーリング前に停止するため、これは Webhook クリーンアップ失敗としては報告されません。
    - ネットワーク/fetch エラーを伴う `setMyCommands failed` は通常、`api.telegram.org` への送信 DNS/HTTPS がブロックされていることを意味します。

    ### デバイスペアリングコマンド (`device-pair` Plugin)

    `device-pair` Plugin がインストールされている場合:

    1. `/pair` がセットアップコードを生成します
    2. iOS アプリにコードを貼り付けます
    3. `/pair pending` が保留中のリクエストを一覧表示します (ロール/スコープを含む)
    4. リクエストを承認します:
       - 明示的に承認するには `/pair approve <requestId>`
       - 保留中のリクエストが1つだけの場合は `/pair approve`
       - 最新のものには `/pair approve latest`

    セットアップコードは短命のブートストラップトークンを保持します。組み込みのブートストラップ引き渡しでは、プライマリノードトークンは `scopes: []` のまま維持されます。引き渡されたオペレータートークンは、`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` に制限されます。ブートストラップのスコープチェックにはロールプレフィックスが付くため、そのオペレーター許可リストはオペレーターリクエストのみを満たします。非オペレーターロールには、引き続き自身のロールプレフィックス配下のスコープが必要です。

    デバイスが変更された認証詳細 (たとえばロール/スコープ/公開鍵) で再試行した場合、前の保留中リクエストは置き換えられ、新しいリクエストでは別の `requestId` が使用されます。承認前に `/pair pending` を再実行してください。

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
    - `allowlist` (デフォルト)

    旧来の `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` にマップされます。

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

  <Accordion title="エージェントと自動化向けの Telegram メッセージアクション">
    Telegram ツールアクションには次が含まれます:

    - `sendMessage` (`to`、`content`、任意の `mediaUrl`、`replyToMessageId`、`messageThreadId`)
    - `react` (`chatId`、`messageId`、`emoji`)
    - `deleteMessage` (`chatId`、`messageId`)
    - `editMessage` (`chatId`、`messageId`、`content`)
    - `createForumTopic` (`chatId`、`name`、任意の `iconColor`、`iconCustomEmojiId`)

    チャンネルメッセージアクションは、扱いやすいエイリアス (`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`) を公開します。

    ゲーティング制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (デフォルト: 無効)

    注記: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    ランタイム送信はアクティブな設定/シークレットのスナップショット (起動/リロード時) を使用するため、アクション経路は送信ごとにアドホックな SecretRef 再解決を実行しません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッド化タグ">
    Telegram は生成出力内の明示的な返信スレッド化タグをサポートします:

    - `[[reply_to_current]]` はトリガー元メッセージに返信します
    - `[[reply_to:<id>]]` は特定の Telegram メッセージ ID に返信します

    `channels.telegram.replyToMode` は処理を制御します:

    - `off` (デフォルト)
    - `first`
    - `all`

    返信スレッド化が有効で、元の Telegram テキストまたはキャプションが利用可能な場合、OpenClaw はネイティブ Telegram 引用抜粋を自動的に含めます。Telegram はネイティブ引用テキストを 1024 UTF-16 コード単位に制限しているため、より長いメッセージは先頭から引用され、Telegram が引用を拒否した場合はプレーンな返信にフォールバックします。

    注記: `off` は暗黙的な返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッドの挙動">
    フォーラムスーパーグループ:

    - トピックセッションキーは `:topic:<threadId>` を追加します
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック (`threadId=1`) の特別扱い:

    - メッセージ送信では `message_thread_id` を省略します (Telegram は `sendMessage(...thread_id=1)` を拒否します)
    - 入力中アクションには引き続き `message_thread_id` が含まれます

    トピックの継承: トピック項目は、上書きされない限りグループ設定 (`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`) を継承します。
    `agentId` はトピック専用で、グループのデフォルトから継承されません。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック設定で `agentId` を設定することで別のエージェントへルーティングできます。これにより、各トピックは独自の分離されたワークスペース、メモリ、セッションを持ちます。例:

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

    各トピックにはそれぞれ独自のセッションキーがあります: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続的な ACP トピックバインディング**: フォーラムトピックは、トップレベルの型付き ACP バインディング（`type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾 ID を持つ `bindings[]`）を通じて ACP ハーネスセッションを固定できます。現在はグループ/スーパーグループ内のフォーラムトピックにスコープされています。[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

    **チャットからのスレッドバインド ACP 起動**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しい ACP セッションにバインドします。以降のやり取りはそこへ直接ルーティングされます。OpenClaw は起動確認をトピック内に固定します。`channels.telegram.threadBindings.spawnSessions` が有効なままである必要があります（デフォルト: `true`）。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは、デフォルトでは DM ルーティングと返信メタデータをフラットセッション上に保持します。`threadReplies: "inbound"`、`threadReplies: "always"`、`requireTopic: true`、または一致するトピック設定で構成されている場合にのみ、スレッド対応セッションキーを使用します。アカウントのデフォルトにはトップレベルの `channels.telegram.dm.threadReplies` を使用し、1 つの DM には `direct.<chatId>.threadReplies` を使用します。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram はボイスメモと音声ファイルを区別します。

    - デフォルト: 音声ファイルの動作
    - エージェント返信内のタグ `[[audio_as_voice]]` でボイスメモ送信を強制
    - 受信ボイスメモの文字起こしは、エージェントコンテキスト内で機械生成の信頼できないテキストとして枠付けされます。メンション検出は引き続き生の文字起こしを使用するため、メンション制御された音声メッセージは引き続き機能します。

    メッセージアクション例:

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

    メッセージアクション例:

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
    Telegram のリアクションは `message_reaction` 更新として届きます（メッセージペイロードとは別です）。

    有効な場合、OpenClaw は次のようなシステムイベントをキューに入れます:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注記:

    - `own` は、ボットが送信したメッセージへのユーザーリアクションのみを意味します（送信済みメッセージキャッシュによるベストエフォート）。
    - リアクションイベントは引き続き Telegram のアクセス制御（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）に従います。未承認の送信者は破棄されます。
    - Telegram はリアクション更新でスレッド ID を提供しません。
      - 非フォーラムグループはグループチャットセッションへルーティングされます
      - フォーラムグループは、正確な発生元トピックではなく、グループの一般トピックセッション（`:topic:1`）へルーティングされます

    ポーリング/Webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認絵文字を送信します。

    解決順序:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェント ID 絵文字のフォールバック（`agents.list[].identity.emoji`、なければ "👀"）

    注記:

    - Telegram は Unicode 絵文字を期待します（例: "👀"）。
    - チャネルまたはアカウントのリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="Telegram イベントとコマンドからの設定書き込み">
    チャネル設定の書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegram がトリガーする書き込みには次が含まれます:

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

    ロングポーリングモードでは、OpenClaw は更新のディスパッチが成功した後にのみ再起動ウォーターマークを永続化します。ハンドラーが失敗した場合、その更新は同じプロセス内で再試行可能なままで、再起動時の重複排除のために完了として書き込まれません。

    ローカルリスナーは `127.0.0.1:8787` にバインドします。公開入口には、ローカルポートの前にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定します。

    Webhook モードは、Telegram に `200` を返す前に、リクエストガード、Telegram シークレットトークン、JSON ボディを検証します。
    その後 OpenClaw は、ロングポーリングで使われるものと同じチャット単位/トピック単位のボットレーンを通じて更新を非同期に処理するため、遅いエージェントターンが Telegram の配信 ACK を保持することはありません。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信の Telegram メディアサイズを制限します。
    - `channels.telegram.mediaGroupFlushMs`（デフォルト 500）は、OpenClaw が Telegram のアルバム/メディアグループを 1 つの受信メッセージとしてディスパッチする前にバッファする時間を制御します。アルバムの各部分が遅れて届く場合は増やし、アルバム返信のレイテンシを減らすには減らします。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定の場合は grammY のデフォルトが適用されます）。ボットクライアントは、設定値を 60 秒の送信テキスト/入力中リクエストガード未満にクランプし、OpenClaw のトランスポートガードとフォールバックが実行される前に grammY が目に見える返信配信を中止しないようにします。ロングポーリングは引き続き 45 秒の `getUpdates` リクエストガードを使用するため、アイドル状態のポーリングが無期限に放棄されることはありません。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。誤検知によるポーリング停止再起動の場合にのみ、`30000` から `600000` の間で調整します。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト 50）を使用します。`0` で無効になります。
    - 返信/引用/転送の補足コンテキストは、Gateway が親メッセージを観測している場合、選択された 1 つの会話コンテキストウィンドウに正規化されます。観測済みメッセージキャッシュはセッションストアの横に永続化されます。Telegram は更新に浅い `reply_to_message` を 1 つだけ含めるため、キャッシュより古いチェーンは Telegram の現在の更新ペイロードに制限されます。
    - Telegram の許可リストは主に、誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキストの秘匿境界ではありません。
    - DM 履歴コントロール:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、回復可能な送信 API エラーに対して Telegram 送信ヘルパー（CLI/ツール/アクション）に適用されます。受信の最終返信配信も、Telegram の接続前失敗に対して境界付きの安全送信再試行を使用しますが、目に見えるメッセージを重複させる可能性がある送信後の曖昧なネットワークエンベロープは再試行しません。

    CLI とメッセージツールの送信ターゲットには、数値のチャット ID、ユーザー名、またはフォーラムトピックターゲットを使用できます:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram ポーリングは `openclaw message poll` を使用し、フォーラムトピックをサポートします:

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

    Telegram 送信は次もサポートします:

    - `channels.telegram.capabilities.inlineButtons` が許可している場合、インラインキーボード用の `buttons` ブロックを持つ `--presentation`
    - ボットがそのチャットで固定できる場合に固定配信を要求する `--pin` または `--delivery '{"pin":true}'`
    - 送信画像、GIF、動画を、圧縮された写真、アニメーションメディア、動画アップロードではなくドキュメントとして送信する `--force-document`

    アクション制御:

    - `channels.telegram.actions.sendMessage=false` は、ポーリングを含む送信 Telegram メッセージを無効にします
    - `channels.telegram.actions.poll=false` は、通常の送信を有効なままにして Telegram ポーリング作成を無効にします

  </Accordion>

  <Accordion title="Telegram での exec 承認">
    Telegram は承認者 DM で exec 承認をサポートし、任意で発生元チャットまたはトピックにプロンプトを投稿できます。承認者は数値の Telegram ユーザー ID である必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled`（少なくとも 1 人の承認者を解決できる場合に自動有効化）
    - `channels.telegram.execApprovals.approvers`（`commands.ownerAllowFrom` の数値オーナー ID にフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト） | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom`、`defaultTo` は、誰がボットと会話できるか、および通常の返信をどこへ送信するかを制御します。これらは誰かを exec 承認者にするものではありません。まだコマンドオーナーが存在しない場合、最初に承認された DM ペアリングが `commands.ownerAllowFrom` をブートストラップするため、1 人オーナーのセットアップは `execApprovals.approvers` の下に ID を重複させなくても機能します。

    チャネル配信はチャット内にコマンドテキストを表示します。信頼できるグループ/トピックでのみ `channel` または `both` を有効にしてください。プロンプトがフォーラムトピックに届く場合、OpenClaw は承認プロンプトと後続の応答のためにトピックを保持します。exec 承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンも、`channels.telegram.capabilities.inlineButtons` が対象サーフェス（`dm`、`group`、または `all`）を許可している必要があります。`plugin:` で始まる承認 ID は Plugin 承認を通じて解決され、それ以外はまず exec 承認を通じて解決されます。

    [Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信の制御

エージェントが配信エラーまたはプロバイダーエラーに遭遇した場合、Telegram はエラーテキストで返信することも、それを抑制することもできます。この動作は 2 つの設定キーで制御します。

| キー                                | 値                | デフォルト | 説明                                                                                          |
| ----------------------------------- | ----------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` はチャットにわかりやすいエラーメッセージを送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | 同じチャットへのエラー返信の最小間隔です。障害中のエラースパムを防ぎます。                  |

アカウント単位、グループ単位、トピック単位のオーバーライドに対応しています（他の Telegram 設定キーと同じ継承です）。

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
      - その後、Bot をグループから削除して再追加します
    - 設定がメンションなしのグループメッセージを想定している場合、`openclaw channels status` が警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認できます。ワイルドカード `"*"` はメンバーシッププローブできません。
    - 簡易セッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="Bot がグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、グループを一覧に含める必要があります（または `"*"` を含めます）
    - グループでの Bot メンバーシップを確認します
    - スキップ理由についてログを確認します: `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが部分的にしか動作しない、またはまったく動作しない">

    - 送信者 ID を認可します（ペアリングおよび/または数値の `allowFrom`）
    - グループポリシーが `open` の場合でも、コマンド認可は引き続き適用されます
    - `BOT_COMMANDS_TOO_MUCH` による `setMyCommands failed` は、ネイティブメニューのエントリが多すぎることを意味します。plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効にします
    - 起動時の `deleteMyCommands` / `setMyCommands` 呼び出しと `sendChatAction` の入力中表示呼び出しは制限付きで、リクエストタイムアウト時に Telegram のトランスポートフォールバック経由で 1 回再試行します。永続的なネットワーク/フェッチエラーは、通常 `api.telegram.org` への DNS/HTTPS 到達性の問題を示します

  </Accordion>

  <Accordion title="起動時に未認可トークンが報告される">

    - `getMe returned 401` は、設定済み Bot トークンに対する Telegram 認証失敗です。
    - BotFather で Bot トークンを再コピーまたは再生成し、デフォルトアカウントの `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken`、または `TELEGRAM_BOT_TOKEN` を更新します。
    - 起動中の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「Webhook が存在しない」と扱うと、同じ不正トークンによる失敗を後続の API 呼び出しまで先送りするだけです。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - Node 22+ とカスタム fetch/proxy の組み合わせでは、AbortSignal 型が一致しない場合に即時 abort 動作が発生することがあります。
    - 一部のホストは `api.telegram.org` を IPv6 に先に解決します。IPv6 外向き通信が壊れていると、Telegram API 障害が断続的に発生することがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw はこれらを回復可能なネットワークエラーとして再試行するようになっています。
    - ポーリング起動中、OpenClaw は成功した起動時の `getMe` プローブを grammY に再利用するため、ランナーは最初の `getUpdates` の前に 2 回目の `getMe` を必要としません。
    - ポーリング起動中に一時的なネットワークエラーで `deleteWebhook` が失敗した場合、OpenClaw は追加のポーリング前制御プレーン呼び出しを行わずにロングポーリングへ進みます。まだアクティブな Webhook は `getUpdates` の競合として表面化します。その場合、OpenClaw は Telegram トランスポートを再構築し、Webhook クリーンアップを再試行します。
    - Telegram ソケットが短い固定周期で再利用される場合、低い `channels.telegram.timeoutSeconds` がないか確認してください。Bot クライアントは、外向きおよび `getUpdates` リクエストガードより低い設定値をクランプしますが、古いリリースではこれがそれらのガード未満に設定されていると、すべてのポーリングまたは返信が abort されることがありました。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw はデフォルトで、完了したロングポール liveness が 120 秒間ないとポーリングを再起動し、Telegram トランスポートを再構築します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中のポーリングアカウントが起動猶予後に `getUpdates` を完了していない場合、実行中の Webhook アカウントが起動猶予後に `setWebhook` を完了していない場合、または最後に成功したポーリングトランスポートアクティビティが古い場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しが正常なのに、ホストが誤ってポーリング停止再起動を報告する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。永続的な停止は通常、ホストと `api.telegram.org` の間のプロキシ、DNS、IPv6、または TLS 外向き通信の問題を示します。
    - Telegram は Bot API トランスポートに対して、`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` とそれらの小文字バリアントを含むプロセスプロキシ環境変数も尊重します。`NO_PROXY` / `no_proxy` は引き続き `api.telegram.org` をバイパスできます。
    - サービス環境で OpenClaw 管理プロキシが `OPENCLAW_PROXY_URL` により設定されており、標準プロキシ環境変数が存在しない場合、Telegram もその URL を Bot API トランスポートに使用します。
    - 直接の外向き通信/TLS が不安定な VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由でルーティングします。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ はデフォルトで `autoSelectFamily=true` です（WSL2 を除く）。Telegram DNS 結果の順序は `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、次に `channels.telegram.network.dnsResultOrder`、次に `NODE_OPTIONS=--dns-result-order=ipv4first` などのプロセスデフォルトに従います。どれも適用されない場合、Node 22+ は `ipv4first` にフォールバックします。
    - ホストが WSL2 の場合、または IPv4 のみの動作のほうが明示的にうまく機能する場合は、ファミリー選択を強制します。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の回答（`198.18.0.0/15`）は、Telegram メディアダウンロードではデフォルトですでに許可されています。信頼できる fake-IP または透過プロキシが、メディアダウンロード中に `api.telegram.org` を他のプライベート/内部/特殊用途アドレスへ書き換える場合は、Telegram のみのバイパスにオプトインできます。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインは、アカウント単位で
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
      でも利用できます。
    - プロキシが Telegram メディアホストを `198.18.x.x` に解決する場合は、まず危険なフラグをオフのままにしてください。Telegram メディアは RFC 2544 ベンチマーク範囲をデフォルトで許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram
      メディアの SSRF 保護を弱めます。Clash、Mihomo、Surge の fake-IP ルーティングのように、RFC 2544 ベンチマーク範囲外のプライベートまたは特殊用途の回答を合成する、信頼済みのオペレーター管理プロキシ環境にのみ使用してください。通常の公開インターネット経由の Telegram アクセスではオフのままにしてください。
    </Warning>

    - 環境オーバーライド（一時的）:
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS 回答を検証します。

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

詳細ヘルプ: [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主要リファレンス: [設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="重要度の高い Telegram フィールド">

- 起動/認証: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指す必要があります。シンボリックリンクは拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, トップレベルの `bindings[]` (`type: "acp"`)
- 実行承認: `execApprovals`, `accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`, `commands.nativeSkills`, `customCommands`
- スレッド/返信: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- ストリーミング: `streaming`（プレビュー）, `streaming.preview.toolProgress`, `blockStreaming`
- フォーマット/配信: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- カスタム API ルート: `apiRoot`（Bot API ルートのみ。`/bot<TOKEN>` を含めないでください）
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- アクション/機能: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`, `reactionLevel`
- エラー: `errorPolicy`, `errorCooldownMs`
- 書き込み/履歴: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
複数アカウントの優先順位: 2 つ以上のアカウント ID が設定されている場合、デフォルトルーティングを明示するために `channels.telegram.defaultAccount` を設定してください（または `channels.telegram.accounts.default` を含めてください）。そうしない場合、OpenClaw は最初の正規化済みアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループとトピックの許可リスト動作。
  </Card>
  <Card title="チャネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと堅牢化。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントにマッピングします。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断。
  </Card>
</CardGroup>
