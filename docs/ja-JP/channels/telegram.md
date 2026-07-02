---
read_when:
    - Telegram 機能または Webhook に取り組む
summary: Telegram bot のサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-07-02T17:33:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b9fc8030adf0525b8b0680fc9ca344cd2c1ba2164b2a4acdb805c7076603bea
    source_path: channels/telegram.md
    workflow: 16
---

grammY により、ボットの DM とグループで本番運用可能です。デフォルトのモードはロングポーリングです。Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルト DM ポリシーはペアリングです。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復手順です。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/ja-JP/gateway/configuration">
    チャンネル設定パターンと例の完全な一覧です。
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

    環境変数のフォールバック: `TELEGRAM_BOT_TOKEN=...`（デフォルトアカウントのみ）。
    Telegram は `openclaw channels login telegram` を使用しません。設定または環境変数でトークンを構成してから、Gateway を起動します。

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
    ボットをグループに追加し、グループアクセスに必要な両方の ID を取得します。

    - `allowFrom` / `groupAllowFrom` で使う Telegram ユーザー ID
    - `channels.telegram.groups` 配下のキーとして使う Telegram グループチャット ID

    初回セットアップでは、`openclaw logs --follow`、転送 ID ボット、または Bot API `getUpdates` からグループチャット ID を取得します。グループが許可された後は、`/whoami@<bot_username>` でユーザー ID とグループ ID を確認できます。

    `-100` で始まる負の Telegram スーパーグループ ID はグループチャット ID です。`groupAllowFrom` ではなく、`channels.telegram.groups` 配下に配置してください。

  </Step>
</Steps>

<Note>
トークンの解決順序はアカウントを考慮します。実際には、設定値が環境変数のフォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
起動に成功すると、OpenClaw は状態ディレクトリにボット ID を最大 24 時間キャッシュするため、再起動時に追加の Telegram `getMe` 呼び出しを回避できます。トークンを変更または削除すると、そのキャッシュはクリアされます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループの可視性">
    Telegram ボットはデフォルトで**プライバシーモード**になっており、グループ内で受信できるメッセージが制限されます。

    ボットがすべてのグループメッセージを見る必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする
    - ボットをグループ管理者にする

    プライバシーモードを切り替える場合は、各グループでボットを削除してから再追加し、Telegram に変更を適用させます。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram のグループ設定で制御されます。

    管理者ボットはすべてのグループメッセージを受信するため、常時稼働のグループ動作に役立ちます。

  </Accordion>

  <Accordion title="便利な BotFather 切り替え">

    - グループ追加を許可または拒否する `/setjoingroups`
    - グループの可視性の動作を設定する `/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御とアクティベーション

### グループ内のボット ID

Telegram グループとフォーラムトピックでは、設定済みのボットハンドル（例: `@my_bot`）への明示的なメンションは、エージェントのペルソナ名が Telegram ユーザー名と異なる場合でも、選択された OpenClaw エージェント宛てとして扱われます。関係のないグループトラフィックには引き続きグループ沈黙ポリシーが適用されますが、ボットハンドル自体は「他の誰か」とは見なされません。

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要あり）
    - `disabled`

    `dmPolicy: "open"` と `allowFrom: ["*"]` を組み合わせると、ボットのユーザー名を見つけた、または推測した任意の Telegram アカウントがボットにコマンドを送れます。厳しく制限されたツールを持つ、意図的に公開するボットにのみ使用してください。単一オーナーのボットでは、数値ユーザー ID を指定した `allowlist` を使用してください。

    `channels.telegram.allowFrom` は数値の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    複数アカウント設定では、制限的なトップレベルの `channels.telegram.allowFrom` は安全境界として扱われます。アカウントレベルの `allowFrom: ["*"]` エントリは、マージ後の有効なアカウント許可リストに明示的なワイルドカードが残っていない限り、そのアカウントを公開状態にはしません。
    空の `allowFrom` を伴う `dmPolicy: "allowlist"` はすべての DM をブロックし、設定検証で拒否されます。
    セットアップでは数値ユーザー ID のみを求めます。
    アップグレード後の設定に `@username` の許可リストエントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォート。Telegram ボットトークンが必要です）。
    以前にペアリングストアの許可リストファイルに依存していた場合、`openclaw doctor --fix` は許可リストフローでエントリを `channels.telegram.allowFrom` に復元できます（たとえば、`dmPolicy: "allowlist"` にまだ明示的な ID がない場合）。

    単一オーナーのボットでは、以前のペアリング承認に依存する代わりに、明示的な数値 `allowFrom` ID を指定した `dmPolicy: "allowlist"` を優先し、アクセスポリシーを設定内で永続化してください。

    よくある混乱: DM ペアリング承認は「この送信者はあらゆる場所で認可されている」という意味ではありません。
    ペアリングは DM アクセスを付与します。コマンドオーナーがまだ存在しない場合、最初に承認されたペアリングは `commands.ownerAllowFrom` も設定し、オーナー専用コマンドと実行承認に明示的なオペレーターアカウントを持たせます。
    グループ送信者の認可は、引き続き明示的な設定許可リストから取得されます。
    「一度認可されれば DM とグループコマンドの両方が動作する」ようにしたい場合は、数値の Telegram ユーザー ID を `channels.telegram.allowFrom` に入れてください。オーナー専用コマンドについては、`commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### Telegram ユーザー ID を見つける

    より安全な方法（サードパーティボットなし）:

    1. 自分のボットに DM します。
    2. `openclaw logs --follow` を実行します。
    3. `from.id` を読み取ります。

    公式 Bot API の方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシー面では低下）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと許可リスト">
    2 つの制御が一緒に適用されます。

    1. **許可されるグループ**（`channels.telegram.groups`）
       - `groups` 設定なし:
         - `groupPolicy: "open"` の場合: どのグループでもグループ ID チェックを通過できる
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされる
       - `groups` が設定済み: 許可リストとして機能する（明示的な ID または `"*"`）

    2. **グループ内で許可される送信者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者フィルタリングに使用されます。設定されていない場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値の Telegram ユーザー ID にする必要があります（`telegram:` / `tg:` プレフィックスは正規化されます）。
    Telegram グループまたはスーパーグループのチャット ID を `groupAllowFrom` に入れないでください。負のチャット ID は `channels.telegram.groups` 配下に置きます。
    数値でないエントリは送信者認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認証は DM ペアリングストアの承認を継承**しません**。
    ペアリングは DM 専用のままです。グループでは、`groupAllowFrom` またはグループ単位/トピック単位の `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram はペアリングストアではなく、設定の `allowFrom` にフォールバックします。
    単一オーナーのボットでの実用的なパターン: 自分のユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` 配下で許可します。
    ランタイム注記: `channels.telegram` が完全に欠落している場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムは fail-closed の `groupPolicy="allowlist"` をデフォルトにします。

    オーナー専用グループセットアップ:

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

    グループから `@<bot_username> ping` でテストします。`requireMention: true` の間は、通常のグループメッセージではボットはトリガーされません。

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

    例: 1 つの特定グループ内の特定ユーザーのみを許可する:

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

      - `-1001234567890` のような負の Telegram グループまたはスーパーグループチャット ID は `channels.telegram.groups` 配下に置きます。
      - 許可されたグループ内でボットをトリガーできるユーザーを制限したい場合は、`8734062810` のような Telegram ユーザー ID を `groupAllowFrom` 配下に置きます。
      - 許可されたグループの任意のメンバーがボットと会話できるようにしたい場合にのみ、`groupAllowFrom: ["*"]` を使用します。

    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信はデフォルトでメンションが必要です。

    メンションは次から取得できます。

    - ネイティブの `@botusername` メンション
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

    グループ履歴コンテキストはグループでは常に有効で、
    `historyLimit` によって制限されます。Telegram グループ履歴ウィンドウを無効にするには
    `channels.telegram.historyLimit: 0` を設定します。廃止された `includeGroupHistoryContext`
    キーは `openclaw doctor --fix` によって削除されます。

    グループチャット ID の取得方法:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` から `chat.id` を読み取る
    - または Bot API `getUpdates` を確認する
    - グループが許可された後、ネイティブコマンドが有効な場合は `/whoami@<bot_username>` を実行する

  </Tab>
</Tabs>

## ランタイム動作

- Telegram は Gateway プロセスが所有します。
- ルーティングは決定的です。Telegram のインバウンドは Telegram に返信されます（モデルはチャネルを選択しません）。
- インバウンドメッセージは、返信メタデータ、メディアプレースホルダー、Gateway が観測した Telegram 返信用の永続化された返信チェーンコンテキストを含む共有チャネルエンベロープに正規化されます。
- グループセッションはグループ ID ごとに分離されます。フォーラムトピックは、トピックを分離するために `:topic:<threadId>` を追加します。
- DM メッセージは `message_thread_id` を持つことがあります。OpenClaw は返信用にそれを保持します。DM トピックセッションは、Telegram `getMe` がボットに対して `has_topics_enabled: true` を報告した場合にのみ分割されます。それ以外の場合、DM はフラットなセッションのままです。
- ロングポーリングは grammY runner を使用し、チャットごと/スレッドごとの順序制御を行います。全体の runner sink concurrency は `agents.defaults.maxConcurrent` を使用します。
- マルチアカウント起動では、同時実行される Telegram `getMe` プローブを制限し、大規模なボット群がすべてのアカウントプローブを一度に展開しないようにします。
- ロングポーリングは各 Gateway プロセス内で保護されているため、同時にボットトークンを使用できるアクティブな poller は 1 つだけです。それでも `getUpdates` 409 競合が表示される場合は、別の OpenClaw Gateway、スクリプト、または外部 poller が同じトークンを使用している可能性があります。
- ロングポーリング watchdog の再起動は、デフォルトで完了した `getUpdates` liveness が 120 秒間ない場合にトリガーされます。長時間実行される作業中にデプロイで誤った polling-stall 再起動がまだ発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒単位で、`30000` から `600000` まで許可されます。アカウントごとのオーバーライドもサポートされています。
- Telegram Bot API は既読確認をサポートしていません（`sendReadReceipts` は適用されません）。

<Note>
  `channels.telegram.dm.threadReplies` と `channels.telegram.direct.<chatId>.threadReplies` は削除されました。アップグレード後も設定にこれらのキーが残っている場合は、`openclaw doctor --fix` を実行してください。DM トピックルーティングは、BotFather のスレッドモードによって制御される Telegram `getMe.has_topics_enabled` のボット機能に従うようになりました。トピック有効ボットは、Telegram が `message_thread_id` を送信した場合にスレッドスコープの DM セッションを使用します。それ以外の DM はフラットなセッションのままです。
</Note>

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は部分返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress` です（デフォルト: `partial`）
    - 短い初期回答プレビューはデバウンスされ、その後、実行がまだアクティブな場合は制限付き遅延の後に実体化されます
    - `progress` はツール進行状況用に編集可能なステータスドラフトを 1 つ保持し、ツール進行状況より前に回答アクティビティが到着した場合は安定したステータスラベルを表示し、完了時にそれをクリアし、最終回答を通常のメッセージとして送信します
    - `streaming.preview.toolProgress` は、ツール/進行状況の更新が同じ編集済みプレビューメッセージを再利用するかどうかを制御します（デフォルト: プレビューストリーミングがアクティブな場合は `true`）
    - `streaming.preview.commandText` は、それらのツール進行状況行内のコマンド/実行詳細を制御します: `raw`（デフォルト、リリース済みの動作を保持）または `status`（ツールラベルのみ）
    - `streaming.progress.commentary`（デフォルト: `false`）は、一時的な進行状況ドラフト内のアシスタント commentary/preamble テキストを有効にします
    - レガシーの `channels.telegram.streamMode`、boolean の `streaming` 値、廃止されたネイティブドラフトプレビューキーは検出されます。現在のストリーミング設定へ移行するには `openclaw doctor --fix` を実行してください

    ツール進行状況プレビュー更新は、ツール実行中に表示される短いステータス行です。たとえば、コマンド実行、ファイル読み取り、計画更新、パッチ概要、または Codex app-server モードでの Codex preamble/commentary テキストです。Telegram は、`v2026.4.22` 以降のリリース済み OpenClaw 動作に合わせるため、これらをデフォルトで有効にしています。

    回答テキスト用の編集済みプレビューを保持しつつ、ツール進行状況行を非表示にするには、次のように設定します。

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

    ツール進行状況を表示したまま、コマンド/実行テキストを非表示にするには、次のように設定します。

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

    最終回答を同じメッセージに編集して入れずに、表示可能なツール進行状況が必要な場合は `progress` モードを使用します。コマンドテキストポリシーは `streaming.progress` の下に置きます。

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

    `streaming.mode: "off"` は、最終のみの配信が必要な場合にのみ使用してください。Telegram のプレビュー編集は無効になり、汎用のツール/進行状況チャッターはスタンドアロンのステータスメッセージとして送信される代わりに抑制されます。承認プロンプト、メディアペイロード、エラーは引き続き通常の最終配信を通じてルーティングされます。ツール進行状況ステータス行を非表示にしつつ回答プレビュー編集だけを保持したい場合は、`streaming.preview.toolProgress: false` を使用してください。

    <Note>
      Telegram の選択引用返信は例外です。`replyToMode` が `"first"`、`"all"`、または `"batched"` で、インバウンドメッセージに選択された引用テキストが含まれる場合、OpenClaw は回答プレビューを編集する代わりに Telegram のネイティブ引用返信パスを通じて最終回答を送信するため、`streaming.preview.toolProgress` はそのターンの短いステータス行を表示できません。選択引用テキストのない現在メッセージへの返信は、引き続きプレビューストリーミングを維持します。ネイティブ引用返信よりもツール進行状況の可視性が重要な場合は `replyToMode: "off"` を設定するか、トレードオフを受け入れるために `streaming.preview.toolProgress: false` を設定してください。
    </Note>

    テキストのみの返信の場合:

    - 短い DM/グループ/トピックのプレビュー: OpenClaw は同じプレビューメッセージを保持し、最終編集をその場で実行します
    - 複数の Telegram メッセージに分割される長い最終テキストは、可能な場合は既存のプレビューを最初の最終チャンクとして再利用し、その後、残りのチャンクだけを送信します
    - progress モードの最終結果は、ステータスドラフトをクリアし、ドラフトを回答に編集する代わりに通常の最終配信を使用します
    - 完了したテキストが確認される前に最終編集が失敗した場合、OpenClaw は通常の最終配信を使用し、古いプレビューをクリーンアップします

    複雑な返信（たとえばメディアペイロード）の場合、OpenClaw は通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューストリーミングはブロックストリーミングとは別です。Telegram でブロックストリーミングが明示的に有効になっている場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

    reasoning ストリームの動作:

    - `/reasoning stream` は、サポートされているチャネルの reasoning プレビューパスを使用します。Telegram では、生成中に reasoning をライブプレビューへストリーミングします
    - reasoning プレビューは最終配信後に削除されます。reasoning を表示したままにする必要がある場合は `/reasoning on` を使用してください
    - 最終回答は reasoning テキストなしで送信されます

  </Accordion>

  <Accordion title="リッチメッセージ形式">
    アウトバウンドテキストはデフォルトで標準の Telegram HTML メッセージを使用するため、現在の Telegram クライアント全体で返信の読みやすさが保たれます。この互換モードは通常の太字、斜体、リンク、コード、スポイラー、引用をサポートしますが、ネイティブテーブル、details、リッチメディア、数式などの Bot API 10.1 リッチ専用ブロックはサポートしません。

    Bot API 10.1 リッチメッセージを有効にするには、`channels.telegram.richMessages: true` を設定します。

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    有効な場合:

    - エージェントには、このボット/アカウントで Telegram リッチメッセージが利用可能であることが伝えられます。
    - Markdown テキストは OpenClaw の Markdown IR を通じてレンダリングされ、Telegram リッチ HTML として送信されます。
    - 明示的なリッチ HTML ペイロードは、見出し、テーブル、details、リッチメディア、数式など、サポートされている Bot API 10.1 タグを保持します。
    - リッチメッセージはキャプションを置き換えないため、メディアキャプションは引き続き Telegram HTML キャプションを使用します。

    これにより、モデルテキストを Telegram Rich Markdown の記号から遠ざけられるため、`$400-600K` のような通貨が数式として解析されません。長いリッチテキストは、Telegram のリッチテキストおよびリッチブロック制限に合わせて自動的に分割されます。Telegram の列制限を超えるテーブルはコードブロックとして送信されます。

    デフォルト: クライアント互換性のためオフです。リッチメッセージには互換性のある Telegram クライアントが必要です。現在の Desktop、Web、Android、およびサードパーティクライアントの一部では、受理されたリッチメッセージが非対応として表示されます。ボットで使用するすべてのクライアントがそれらをレンダリングできる場合を除き、このオプションは無効のままにしてください。`/status` は、現在の Telegram セッションでリッチメッセージがオンかオフかを表示します。

    リンクプレビューはデフォルトで有効です。`channels.telegram.linkPreview: false` は、リッチテキストの自動エンティティ検出をスキップします。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram コマンドメニュー登録は、起動時に `setMyCommands` で処理されます。

    ネイティブコマンドのデフォルト:

    - `commands.native: "auto"` は Telegram のネイティブコマンドを有効にします

    カスタムコマンドメニューエントリを追加します。

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

    - カスタムコマンドはメニューエントリのみです。動作は自動実装されません
    - Plugin/skill コマンドは、Telegram メニューに表示されていない場合でも、入力すれば引き続き動作することがあります

    ネイティブコマンドが無効な場合、組み込みは削除されます。設定されていれば、カスタム/Plugin コマンドは引き続き登録されることがあります。

    よくあるセットアップ失敗:

    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、トリミング後も Telegram メニューがまだあふれていることを意味します。Plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - 直接の Bot API curl コマンドは動作するのに、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合、`channels.telegram.apiRoot` が完全な `/bot<TOKEN>` エンドポイントに設定されている可能性があります。`apiRoot` は Bot API ルートのみである必要があり、`openclaw doctor --fix` は誤って末尾に付いた `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、Telegram が設定済みのボットトークンを拒否したことを意味します。`botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN` を現在の BotFather トークンで更新してください。OpenClaw はポーリング前に停止するため、これは Webhook クリーンアップ失敗としては報告されません。
    - ネットワーク/fetch エラーを伴う `setMyCommands failed` は通常、`api.telegram.org` へのアウトバウンド DNS/HTTPS がブロックされていることを意味します。

    ### デバイスペアリングコマンド（`device-pair` Plugin）

    `device-pair` Plugin がインストールされている場合:

    1. `/pair` がセットアップコードを生成します
    2. iOS アプリにコードを貼り付けます
    3. `/pair pending` が保留中のリクエスト（role/scopes を含む）を一覧表示します
    4. リクエストを承認します:
       - 明示的な承認には `/pair approve <requestId>`
       - 保留中のリクエストが 1 つだけの場合は `/pair approve`
       - 最新のものには `/pair approve latest`

    セットアップコードは短命のブートストラップトークンを含みます。組み込みのセットアップコードブートストラップは node 専用です。最初の接続で保留中の node リクエストが作成され、承認後に Gateway は `scopes: []` を持つ永続的な node トークンを返します。引き継がれたオペレータートークンは返しません。オペレーターアクセスには、別途承認されたオペレーターペアリングまたはトークンフローが必要です。

    デバイスが変更された認証詳細（たとえば role/scopes/public key）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストは別の `requestId` を使用します。承認前に `/pair pending` を再実行してください。

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

    アカウントごとのオーバーライド:

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

    Mini App ボタンの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Telegram の `web_app` ボタンは、ユーザーと bot の間のプライベートチャットでのみ機能します。

    登録済み Plugin のインタラクティブハンドラーによって処理されないコールバッククリックは、テキストとしてエージェントに渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="エージェントと自動化向けの Telegram メッセージアクション">
    Telegram ツールアクションには以下が含まれます。

    - `sendMessage` (`to`, `content`, 任意の `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` または `caption`, 任意の `presentation` インラインボタン; ボタンのみの編集は返信マークアップを更新します)
    - `createForumTopic` (`chatId`, `name`, 任意の `iconColor`, `iconCustomEmojiId`)

    チャネルメッセージアクションは、使いやすいエイリアス (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`) を公開します。

    ゲート制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (デフォルト: 無効)

    注: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    ランタイム送信はアクティブな設定/シークレットスナップショット (起動/リロード) を使用するため、アクションパスは送信ごとにアドホックな SecretRef の再解決を行いません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッド化タグ">
    Telegram は生成された出力で明示的な返信スレッド化タグをサポートします。

    - `[[reply_to_current]]` はトリガー元のメッセージに返信します
    - `[[reply_to:<id>]]` は特定の Telegram メッセージ ID に返信します

    `channels.telegram.replyToMode` は処理を制御します。

    - `off` (デフォルト)
    - `first`
    - `all`

    返信スレッド化が有効で、元の Telegram テキストまたはキャプションが利用可能な場合、OpenClaw はネイティブ Telegram 引用抜粋を自動的に含めます。Telegram はネイティブ引用テキストを 1024 UTF-16 コード単位に制限するため、長いメッセージは先頭から引用され、Telegram が引用を拒否した場合は通常の返信にフォールバックします。

    注: `off` は暗黙的な返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッドの動作">
    フォーラムスーパーグループ:

    - トピックセッションキーは `:topic:<threadId>` を追加します
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック (`threadId=1`) の特殊ケース:

    - メッセージ送信では `message_thread_id` を省略します (Telegram は `sendMessage(...thread_id=1)` を拒否します)
    - 入力中アクションには引き続き `message_thread_id` が含まれます

    トピック継承: トピックエントリは、オーバーライドされない限りグループ設定を継承します (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)。
    `agentId` はトピック専用で、グループデフォルトからは継承しません。
    `topics."*"` はそのグループ内のすべてのトピックのデフォルトを設定します。正確なトピック ID は引き続き `"*"` より優先されます。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック設定で `agentId` を設定することで別のエージェントにルーティングできます。これにより、各トピックは独立したワークスペース、メモリ、セッションを持ちます。例:

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

    各トピックは次のように独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続 ACP トピックバインディング**: フォーラムトピックは、トップレベルの型付き ACP バインディング (`bindings[]`、`type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾 ID) を通じて ACP ハーネスセッションを固定できます。現在はグループ/スーパーグループ内のフォーラムトピックにスコープされています。[ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

    **チャットからのスレッドバインド ACP spawn**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しい ACP セッションにバインドします。後続のやり取りはそこに直接ルーティングされます。OpenClaw は spawn 確認をトピック内にピン留めします。`channels.telegram.threadBindings.spawnSessions` が有効のままである必要があります (デフォルト: `true`)。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは返信メタデータを保持します。Telegram `getMe` が bot に対して `has_topics_enabled: true` を報告する場合にのみ、スレッド対応セッションキーを使用します。
    以前の `dm.threadReplies` と `direct.*.threadReplies` のオーバーライドは意図的に廃止されています。BotFather のスレッドモードを単一の信頼できる情報源として使用し、`openclaw doctor --fix` を実行して古い設定キーを削除してください。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram はボイスメモと音声ファイルを区別します。

    - デフォルト: 音声ファイルの動作
    - エージェントの返信でタグ `[[audio_as_voice]]` を指定すると、ボイスメモとして強制送信します
    - 受信したボイスメモの文字起こしは、エージェントコンテキスト内で機械生成の信頼されないテキストとしてフレーミングされます。メンション検出では引き続き生の文字起こしを使用するため、メンションゲート付きの音声メッセージは動作し続けます。

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

    Telegram は動画ファイルと動画ノートを区別します。

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

    動画ノートはキャプションに対応していません。指定されたメッセージテキストは別送信されます。

    ### ステッカー

    受信ステッカーの処理:

    - static WEBP: ダウンロードして処理されます（プレースホルダー `<media:sticker>`）
    - animated TGS: スキップされます
    - video WEBM: スキップされます

    ステッカーコンテキストフィールド:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ステッカーの説明は、繰り返しのビジョン呼び出しを減らすために OpenClaw SQLite Plugin 状態にキャッシュされます。

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

    有効な場合、OpenClaw は次のようなシステムイベントをキューに入れます。

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注記:

    - `own` は、ボットが送信したメッセージへのユーザーリアクションのみを意味します（送信済みメッセージキャッシュによるベストエフォート）。
    - リアクションイベントは Telegram のアクセス制御（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）を引き続き尊重します。許可されていない送信者は破棄されます。
    - Telegram はリアクション更新でスレッド ID を提供しません。
      - 非フォーラムグループはグループチャットセッションへルーティングされます
      - フォーラムグループは、正確な発生元トピックではなく、グループの一般トピックセッション（`:topic:1`）へルーティングされます

    ポーリング/Webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認用の絵文字を送信します。`ackReactionScope` はその絵文字が実際に送信される*タイミング*を決定します。

    **絵文字（`ackReaction`）の解決順序:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェント ID の絵文字フォールバック（`agents.list[].identity.emoji`、なければ "👀"）

    注記:

    - Telegram は Unicode 絵文字（例: "👀"）を期待します。
    - チャンネルまたはアカウントのリアクションを無効にするには `""` を使用します。

    **スコープ（`messages.ackReactionScope`）:**

    Telegram プロバイダーは `messages.ackReactionScope`（デフォルト `"group-mentions"`）からスコープを読み取ります。現時点では Telegram アカウント単位または Telegram チャンネル単位のオーバーライドはありません。

    値: `"all"`（DM + グループ）、`"direct"`（DM のみ）、`"group-all"`（すべてのグループメッセージ、DM なし）、`"group-mentions"`（ボットがメンションされたグループ。**DM なし** — これがデフォルト）、`"off"` / `"none"`（無効）。

    <Note>
    デフォルトスコープ（`"group-mentions"`）では、ダイレクトメッセージで ack リアクションは発火しません。受信 Telegram DM で ack リアクションを得るには、`messages.ackReactionScope` を `"direct"` または `"all"` に設定してください。この値は Telegram プロバイダー起動時に読み取られるため、変更を有効にするには Gateway の再起動が必要です。
    </Note>

  </Accordion>

  <Accordion title="Telegram イベントとコマンドからの設定書き込み">
    チャンネル設定の書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegram によってトリガーされる書き込みには次が含まれます。

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

    ロングポーリングモードでは、OpenClaw は更新が正常にディスパッチされた後にのみ再起動ウォーターマークを永続化します。ハンドラーが失敗した場合、その更新は同じプロセスで再試行可能なままとなり、再起動時の重複排除で完了済みとして書き込まれません。

    ローカルリスナーは `127.0.0.1:8787` にバインドします。公開入口には、ローカルポートの前にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定します。

    Webhook モードでは、Telegram に `200` を返す前に、リクエストガード、Telegram シークレットトークン、JSON 本文を検証します。
    その後 OpenClaw は、ロングポーリングで使われるものと同じチャット単位/トピック単位のボットレーンを通じて更新を非同期に処理するため、遅いエージェントターンが Telegram の配信 ACK を保持することはありません。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信 Telegram メディアのサイズ上限を設定します。
    - `channels.telegram.mediaGroupFlushMs`（デフォルト 500）は、Telegram のアルバム/メディアグループを OpenClaw が 1 つの受信メッセージとしてディスパッチする前に、どれだけバッファするかを制御します。アルバムの一部が遅れて届く場合は増やし、アルバム返信のレイテンシを下げたい場合は減らします。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定の場合は grammY のデフォルトが適用されます）。Bot クライアントは、設定値が 60 秒の送信テキスト/入力中リクエストガードを下回る場合にクランプし、OpenClaw のトランスポートガードとフォールバックが実行される前に grammY が可視の返信配信を中断しないようにします。ロングポーリングでは引き続き 45 秒の `getUpdates` リクエストガードを使用するため、アイドル中のポーリングが無期限に放棄されることはありません。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。誤検知によるポーリング停止再起動の場合のみ、`30000` から `600000` の範囲で調整してください。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト 50）を使用します。`0` で無効化します。
    - 返信/引用/転送の補足コンテキストは、Gateway が親メッセージを観測済みの場合、選択された 1 つの会話コンテキストウィンドウに正規化されます。観測済みメッセージのキャッシュは OpenClaw SQLite Plugin 状態に保存され、`openclaw doctor --fix` が従来のサイドカーをインポートします。Telegram は更新内に浅い `reply_to_message` を 1 つだけ含めるため、キャッシュより古いチェーンは Telegram の現在の更新ペイロードに制限されます。
    - Telegram の許可リストは主に、誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキストの秘匿境界ではありません。
    - DM 履歴の制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、復旧可能な送信 API エラーに対して Telegram 送信ヘルパー（CLI/ツール/アクション）に適用されます。受信の最終返信配信でも、Telegram の接続前失敗に対して境界付きの安全な送信再試行を使用しますが、可視メッセージを重複させる可能性がある送信後の曖昧なネットワークエンベロープは再試行しません。

    CLI とメッセージツールの送信ターゲットには、数値チャット ID、ユーザー名、またはフォーラムトピックターゲットを指定できます。

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
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

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - フォーラムトピック用の `--thread-id`（または `:topic:` ターゲットを使用）

    Telegram 送信は次もサポートします。

    - `channels.telegram.capabilities.inlineButtons` が許可する場合、インラインキーボード用の `buttons` ブロック付き `--presentation`
    - Bot がそのチャットでピン留めできる場合に、ピン留め配信をリクエストする `--pin` または `--delivery '{"pin":true}'`
    - 送信画像、GIF、動画を圧縮写真、アニメーションメディア、動画アップロードではなくドキュメントとして送信する `--force-document`

    アクションゲーティング:

    - `channels.telegram.actions.sendMessage=false` は、投票を含む Telegram 送信メッセージを無効化します
    - `channels.telegram.actions.poll=false` は、通常の送信を有効のまま Telegram 投票の作成を無効化します

  </Accordion>

  <Accordion title="Telegram での exec 承認">
    Telegram は承認者 DM で exec 承認をサポートし、必要に応じて元のチャットまたはトピックにプロンプトを投稿できます。承認者は数値の Telegram ユーザー ID である必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled`（少なくとも 1 人の承認者を解決できる場合に自動有効化）
    - `channels.telegram.execApprovals.approvers`（`commands.ownerAllowFrom` の数値オーナー ID にフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト）| `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom`、`defaultTo` は、誰が Bot と会話できるか、および通常の返信をどこに送信するかを制御します。これらは誰かを exec 承認者にするものではありません。コマンドオーナーがまだ存在しない場合、最初に承認された DM ペアリングが `commands.ownerAllowFrom` をブートストラップするため、1 オーナー構成でも `execApprovals.approvers` の下に ID を重複させずに動作します。

    チャンネル配信ではコマンドテキストがチャットに表示されます。信頼できるグループ/トピックでのみ `channel` または `both` を有効にしてください。プロンプトがフォーラムトピックに届く場合、OpenClaw は承認プロンプトと後続メッセージのためにトピックを保持します。exec 承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンも、`channels.telegram.capabilities.inlineButtons` が対象サーフェス（`dm`、`group`、または `all`）を許可している必要があります。`plugin:` で始まる承認 ID は Plugin 承認を通じて解決され、それ以外はまず exec 承認を通じて解決されます。

    [exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信の制御

エージェントが配信エラーまたはプロバイダーエラーに遭遇した場合、エラーポリシーはエラーメッセージを Telegram チャットに送信するかどうかを制御します。

| キー                                | 値                         | デフォルト      | 説明                                                                                                                                                                                                 |
| ----------------------------------- | -------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — すべてのエラーメッセージをチャットに送信します。`once` — クールダウンウィンドウごとに一意のエラーメッセージを 1 回だけ送信します（同一エラーの繰り返しを抑制）。`silent` — エラーメッセージをチャットに送信しません。 |
| `channels.telegram.errorCooldownMs` | 数値 (ms)                  | `14400000` (4h) | `once` ポリシーのクールダウンウィンドウ。エラーが送信された後、同じエラーメッセージはこの間隔が経過するまで抑制されます。障害中のエラースパムを防ぎます。                                      |

アカウント単位、グループ単位、トピック単位の上書きがサポートされています（他の Telegram 設定キーと同じ継承です）。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
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
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認できます。ワイルドカード `"*"` はメンバーシップをプローブできません。
    - 簡易セッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="Bot がグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、グループをリストする必要があります（または `"*"` を含めます）
    - グループ内の Bot メンバーシップを確認します
    - ログを確認します: スキップ理由は `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが部分的にしか動作しない、またはまったく動作しない">

    - 送信者 ID を認可します（ペアリングおよび/または数値の `allowFrom`）
    - グループポリシーが `open` の場合でも、コマンド認可は引き続き適用されます
    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、ネイティブメニューの項目が多すぎることを意味します。Plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効化してください
    - `deleteMyCommands` / `setMyCommands` の起動時呼び出しと `sendChatAction` の入力中呼び出しは境界付きで、リクエストタイムアウト時に Telegram のトランスポートフォールバックを通じて 1 回再試行されます。永続的なネットワーク/フェッチエラーは通常、`api.telegram.org` への DNS/HTTPS 到達性の問題を示します

  </Accordion>

  <Accordion title="起動時に未認可トークンが報告される">

    - `getMe returned 401` は、設定された Bot トークンに対する Telegram 認証失敗です。
    - BotFather で Bot トークンを再コピーまたは再生成し、デフォルトアカウントの `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken`、または `TELEGRAM_BOT_TOKEN` を更新します。
    - 起動中の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「Webhook が存在しない」と扱うと、同じ不正なトークンの失敗を後続の API 呼び出しまで先送りするだけです。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - Node 22+ とカスタム fetch/proxy は、AbortSignal 型が一致しない場合に即時中断動作を引き起こすことがあります。
    - 一部のホストは `api.telegram.org` を最初に IPv6 に解決します。壊れた IPv6 送信経路は、断続的な Telegram API 障害を引き起こすことがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw はこれらを復旧可能なネットワークエラーとして再試行するようになりました。
    - ポーリング起動中、OpenClaw は成功した起動時の `getMe` プローブを grammY に再利用するため、ランナーは最初の `getUpdates` の前に 2 回目の `getMe` を必要としません。
    - ポーリング起動中に `deleteWebhook` が一時的なネットワークエラーで失敗した場合、OpenClaw は別のポーリング前コントロールプレーン呼び出しを行わずにロングポーリングへ進みます。Webhook がまだアクティブな場合は `getUpdates` の競合として表面化します。その後、OpenClaw は Telegram トランスポートを再構築し、Webhook クリーンアップを再試行します。
    - Telegram ソケットが短い固定間隔で再利用される場合は、低い `channels.telegram.timeoutSeconds` を確認してください。Bot クライアントは設定値を送信および `getUpdates` リクエストガードより下でクランプしますが、古いリリースではこの値がそれらのガードを下回ると、すべてのポーリングまたは返信を中断する可能性がありました。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw はデフォルトで、完了したロングポーリングの生存性が 120 秒間ないとポーリングを再起動し、Telegram トランスポートを再構築します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中のポーリングアカウントが起動猶予後に `getUpdates` を完了していない場合、実行中の Webhook アカウントが起動猶予後に `setWebhook` を完了していない場合、または最後に成功したポーリングトランスポート活動が古くなっている場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しが正常なのに、ホストが誤ったポーリング停止再起動を報告する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。永続的な停止は通常、ホストと `api.telegram.org` の間のプロキシ、DNS、IPv6、または TLS 送信経路の問題を示します。
    - Telegram は Bot API トランスポートについて、`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` とそれらの小文字バリアントを含むプロセスプロキシ環境変数も尊重します。`NO_PROXY` / `no_proxy` は引き続き `api.telegram.org` をバイパスできます。
    - サービス環境向けに `OPENCLAW_PROXY_URL` を通じて OpenClaw 管理プロキシが設定されており、標準のプロキシ環境変数が存在しない場合、Telegram も Bot API トランスポートにその URL を使用します。
    - 直接の送信経路/TLS が不安定な VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由にルーティングします。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ は既定で `autoSelectFamily=true` です（WSL2 を除く）。Telegram DNS の結果順序は `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、次に `channels.telegram.network.dnsResultOrder`、次に `NODE_OPTIONS=--dns-result-order=ipv4first` などのプロセス既定値に従います。どれも適用されない場合、Node 22+ は `ipv4first` にフォールバックします。
    - ホストが WSL2 の場合、または IPv4 のみの動作のほうが明示的に適している場合は、ファミリー選択を強制します。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、既定で Telegram メディアダウンロードに対してすでに許可されています。信頼できる fake-IP または透過プロキシが、メディアダウンロード中に `api.telegram.org` を別のプライベート、内部、特殊用途アドレスへ書き換える場合は、Telegram 専用のバイパスにオプトインできます。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインは、アカウントごとに
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
      でも利用できます。
    - プロキシが Telegram メディアホストを `198.18.x.x` に解決する場合は、まず危険なフラグをオフのままにしてください。Telegram メディアは既定で RFC 2544 ベンチマーク範囲をすでに許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram
      メディアの SSRF 保護を弱めます。Clash、Mihomo、Surge の fake-IP
      ルーティングのように、RFC 2544 ベンチマーク範囲外のプライベートまたは特殊用途の応答を合成する、信頼できるオペレーター管理のプロキシ環境でのみ使用してください。通常のパブリックインターネット経由の Telegram アクセスではオフのままにしてください。
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

## 構成リファレンス

主要リファレンス: [構成リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="High-signal Telegram fields">

- 起動/認証: `enabled`, `botToken`, `tokenFile`, `accounts.*`（`tokenFile` は通常ファイルを指す必要があります。シンボリックリンクは拒否されます）
- アクセス制御: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, トップレベルの `bindings[]`（`type: "acp"`）
- トピック既定値: `groups.<chatId>.topics."*"` は一致しないフォーラムトピックに適用されます。正確なトピック ID がこれを上書きします
- 実行承認: `execApprovals`, `accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`, `commands.nativeSkills`, `customCommands`
- スレッド/返信: `replyToMode`
- ストリーミング: `streaming`（プレビュー）, `streaming.preview.toolProgress`, `blockStreaming`
- 書式/配信: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- カスタム API ルート: `apiRoot`（Bot API ルートのみ。`/bot<TOKEN>` は含めないでください）
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- アクション/機能: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`, `reactionLevel`
- エラー: `errorPolicy`, `errorCooldownMs`
- 書き込み/履歴: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
複数アカウントの優先順位: 2 つ以上のアカウント ID が構成されている場合は、既定のルーティングを明示するために `channels.telegram.defaultAccount` を設定してください（または `channels.telegram.accounts.default` を含めてください）。そうしない場合、OpenClaw は最初に正規化されたアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    Telegram ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="Groups" icon="users" href="/ja-JP/channels/groups">
    グループとトピックの許可リスト動作。
  </Card>
  <Card title="Channel routing" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="Security" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと堅牢化。
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントにマッピングします。
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断。
  </Card>
</CardGroup>
