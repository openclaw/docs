---
read_when:
    - Telegram 機能または Webhook に取り組む
summary: Telegram ボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-07-03T13:15:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 202d6eaaf9348203855659d30616368995bce9269082e60dfed67c8d444abf18
    source_path: channels/telegram.md
    workflow: 16
---

grammY により、ボットの DM とグループで本番利用可能です。ロングポーリングがデフォルトモードです。Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルト DM ポリシーはペアリングです。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復プレイブック。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/ja-JP/gateway/configuration">
    完全なチャネル設定パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="Create the bot token in BotFather">
    Telegram を開き、**@BotFather** とチャットします（ハンドルが正確に `@BotFather` であることを確認してください）。

    `/newbot` を実行し、プロンプトに従ってトークンを保存します。

  </Step>

  <Step title="Configure token and DM policy">

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

    環境変数フォールバック: `TELEGRAM_BOT_TOKEN=...`（デフォルトアカウントのみ）。
    Telegram は `openclaw channels login telegram` を使用しません。config/env でトークンを設定してから、gateway を起動してください。

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは 1 時間後に期限切れになります。

  </Step>

  <Step title="Add the bot to a group">
    ボットをグループに追加し、グループアクセスに必要な両方の ID を取得します。

    - `allowFrom` / `groupAllowFrom` で使用する Telegram ユーザー ID
    - `channels.telegram.groups` の下のキーとして使用する Telegram グループチャット ID

    初回セットアップでは、`openclaw logs --follow`、転送 ID ボット、または Bot API `getUpdates` からグループチャット ID を取得します。グループが許可された後は、`/whoami@<bot_username>` でユーザー ID とグループ ID を確認できます。

    `-100` で始まる負の Telegram スーパーグループ ID はグループチャット ID です。`groupAllowFrom` ではなく、`channels.telegram.groups` の下に配置してください。

  </Step>
</Steps>

<Note>
トークンの解決順序はアカウント対応です。実際には、config 値が env フォールバックより優先され、`TELEGRAM_BOT_TOKEN` はデフォルトアカウントにのみ適用されます。
起動に成功すると、OpenClaw は最大 24 時間、状態ディレクトリにボット ID をキャッシュするため、再起動時に追加の Telegram `getMe` 呼び出しを回避できます。トークンを変更または削除すると、そのキャッシュはクリアされます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Telegram ボットはデフォルトで **Privacy Mode** になっており、受信できるグループメッセージが制限されます。

    ボットがすべてのグループメッセージを見る必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする
    - ボットをグループ管理者にする

    プライバシーモードを切り替える場合は、Telegram が変更を適用するように、各グループでボットを削除してから再追加してください。

  </Accordion>

  <Accordion title="Group permissions">
    管理者ステータスは Telegram グループ設定で制御されます。

    管理者ボットはすべてのグループメッセージを受信するため、常時オンのグループ動作に便利です。

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - グループ追加を許可/拒否するには `/setjoingroups`
    - グループ可視性の動作には `/setprivacy`

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

### グループボット ID

Telegram グループとフォーラムトピックでは、設定されたボットハンドル（例: `@my_bot`）への明示的なメンションは、エージェントのペルソナ名が Telegram ユーザー名と異なる場合でも、選択された OpenClaw エージェントへの呼びかけとして扱われます。グループのサイレンスポリシーは無関係なグループトラフィックには引き続き適用されますが、ボットハンドル自体は「他の誰か」とは見なされません。

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要あり）
    - `disabled`

    `dmPolicy: "open"` と `allowFrom: ["*"]` を組み合わせると、ボットのユーザー名を見つけるか推測した任意の Telegram アカウントがボットにコマンドを送れるようになります。厳しく制限されたツールを持つ、意図的に公開されたボットでのみ使用してください。所有者が 1 人のボットでは、数値ユーザー ID を指定した `allowlist` を使用してください。

    `channels.telegram.allowFrom` は数値の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    マルチアカウント config では、制限的なトップレベルの `channels.telegram.allowFrom` は安全境界として扱われます。アカウントレベルの `allowFrom: ["*"]` エントリがあっても、マージ後の有効なアカウント allowlist に明示的なワイルドカードが残っていない限り、そのアカウントは公開されません。
    `dmPolicy: "allowlist"` で `allowFrom` が空の場合、すべての DM がブロックされ、config 検証で拒否されます。
    セットアップでは数値ユーザー ID のみを求めます。
    アップグレード後、config に `@username` の allowlist エントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォート。Telegram ボットトークンが必要です）。
    以前にペアリングストアの allowlist ファイルに依存していた場合、`openclaw doctor --fix` は allowlist フロー内でエントリを `channels.telegram.allowFrom` に復元できます（たとえば `dmPolicy: "allowlist"` に明示的な ID がまだない場合）。

    所有者が 1 人のボットでは、以前のペアリング承認に依存する代わりに、明示的な数値 `allowFrom` ID を指定した `dmPolicy: "allowlist"` を優先し、アクセスポリシーを config 内で永続化してください。

    よくある混同: DM ペアリング承認は「この送信者がどこでも認可されている」ことを意味しません。
    ペアリングは DM アクセスを付与します。コマンド所有者がまだ存在しない場合、最初に承認されたペアリングは `commands.ownerAllowFrom` も設定し、所有者限定コマンドと exec 承認に明示的なオペレーターアカウントを持たせます。
    グループ送信者の認可は、引き続き明示的な config allowlist に由来します。
    「一度認可されれば DM とグループコマンドの両方が動作する」ようにしたい場合は、数値の Telegram ユーザー ID を `channels.telegram.allowFrom` に入れてください。所有者限定コマンドについては、`commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### Telegram ユーザー ID を見つける

    より安全な方法（サードパーティボットなし）:

    1. ボットに DM します。
    2. `openclaw logs --follow` を実行します。
    3. `from.id` を読み取ります。

    公式 Bot API メソッド:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシーは低め）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="Group policy and allowlists">
    2 つの制御が同時に適用されます。

    1. **許可されるグループ**（`channels.telegram.groups`）
       - `groups` config なし:
         - `groupPolicy: "open"` の場合: 任意のグループがグループ ID チェックを通過できます
         - `groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされます
       - `groups` 設定済み: allowlist として機能します（明示的な ID または `"*"`）

    2. **グループ内で許可される送信者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（デフォルト）
       - `disabled`

    `groupAllowFrom` はグループ送信者フィルタリングに使用されます。設定されていない場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値の Telegram ユーザー ID にする必要があります（`telegram:` / `tg:` プレフィックスは正規化されます）。
    Telegram グループまたはスーパーグループのチャット ID を `groupAllowFrom` に入れないでください。負のチャット ID は `channels.telegram.groups` の下に属します。
    数値でないエントリは送信者認可では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認証は DM ペアリングストア承認を継承しません。
    ペアリングは DM 専用のままです。グループでは、`groupAllowFrom` またはグループ単位/トピック単位の `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram はペアリングストアではなく config の `allowFrom` にフォールバックします。
    所有者が 1 人のボットでの実用的なパターン: ユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` の下で許可します。
    ランタイムメモ: `channels.telegram` が完全に存在しない場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムは fail-closed の `groupPolicy="allowlist"` をデフォルトにします。

    所有者限定のグループセットアップ:

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

    グループから `@<bot_username> ping` でテストします。`requireMention: true` の間は、通常のグループメッセージではボットは起動しません。

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
      よくある間違い: `groupAllowFrom` は Telegram グループ allowlist ではありません。

      - `-1001234567890` のような負の Telegram グループまたはスーパーグループのチャット ID は `channels.telegram.groups` の下に配置してください。
      - 許可済みグループ内のどの人がボットを起動できるかを制限したい場合は、`8734062810` のような Telegram ユーザー ID を `groupAllowFrom` の下に配置してください。
      - 許可済みグループの任意のメンバーがボットと会話できるようにしたい場合にのみ、`groupAllowFrom: ["*"]` を使用してください。

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    グループ返信はデフォルトでメンションを必要とします。

    メンションは次から来る可能性があります。

    - ネイティブの `@botusername` メンション
    - または次のメンションパターン:
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

    グループ履歴コンテキストはグループでは常に有効で、
    `historyLimit` によって制限されます。Telegram グループ履歴ウィンドウを無効にするには、
    `channels.telegram.historyLimit: 0` を設定します。廃止された `includeGroupHistoryContext`
    キーは `openclaw doctor --fix` によって削除されます。

    グループチャット ID を取得する:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` から `chat.id` を読み取る
    - または Bot API `getUpdates` を調べる
    - グループが許可された後、ネイティブコマンドが有効なら `/whoami@<bot_username>` を実行する

  </Tab>
</Tabs>

## ランタイム動作

- Telegram は Gateway プロセスが所有します。
- ルーティングは決定的です。Telegram の受信メッセージへの返信は Telegram に返されます（モデルはチャネルを選びません）。
- 受信メッセージは、返信メタデータ、メディアプレースホルダー、Gateway が観測した Telegram 返信の永続化された返信チェーンコンテキストを含む共有チャネルエンベロープに正規化されます。
- グループセッションはグループ ID で分離されます。フォーラムトピックでは、トピックを分離するために `:topic:<threadId>` が追加されます。
- DM メッセージには `message_thread_id` を含められます。OpenClaw は返信用にそれを保持します。DM トピックセッションは、Telegram `getMe` がボットについて `has_topics_enabled: true` を返した場合にのみ分割されます。それ以外の DM はフラットなセッションのままです。
- ロングポーリングは、チャット単位/スレッド単位の順序付けを備えた grammY runner を使用します。runner sink 全体の並行処理数は `agents.defaults.maxConcurrent` を使用します。
- 複数アカウント起動では、同時実行される Telegram `getMe` プローブに上限を設け、大規模なボット群で全アカウントのプローブが一度に広がらないようにします。
- ロングポーリングは各 Gateway プロセス内でガードされるため、一度に 1 つのアクティブなポーラーだけがボットトークンを使用できます。それでも `getUpdates` の 409 競合が表示される場合は、別の OpenClaw Gateway、スクリプト、または外部ポーラーが同じトークンを使用している可能性があります。
- デフォルトでは、完了した `getUpdates` の生存確認が 120 秒間ない場合、ロングポーリングの watchdog 再起動がトリガーされます。長時間実行される作業中に、デプロイで誤った polling-stall 再起動がまだ発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値の単位はミリ秒で、`30000` から `600000` まで許可されます。アカウント単位のオーバーライドもサポートされています。
- Telegram Bot API には既読通知のサポートがありません（`sendReadReceipts` は適用されません）。

<Note>
  `channels.telegram.dm.threadReplies` と `channels.telegram.direct.<chatId>.threadReplies` は削除されました。設定にこれらのキーがまだある場合は、アップグレード後に `openclaw doctor --fix` を実行してください。DM トピックルーティングは、Telegram `getMe.has_topics_enabled` から取得されるボット機能に従うようになりました。これは BotFather のスレッドモードで制御されます。トピック有効のボットは、Telegram が `message_thread_id` を送信したときにスレッドスコープの DM セッションを使用します。それ以外の DM はフラットなセッションのままです。
</Note>

## 機能リファレンス

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw は部分的な返信をリアルタイムでストリーミングできます。

    - ダイレクトチャット: プレビューメッセージ + `editMessageText`
    - グループ/トピック: プレビューメッセージ + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress` です（デフォルト: `partial`）
    - 短い初期回答プレビューはデバウンスされ、実行がまだアクティブな場合は制限された遅延後に実体化されます
    - `progress` はツール進行状況用に編集可能なステータス下書きを 1 つ保持し、ツール進行状況より前に回答アクティビティが届いた場合は安定したステータスラベルを表示し、完了時にそれをクリアし、最終回答を通常のメッセージとして送信します
    - `streaming.preview.toolProgress` は、ツール/進行状況の更新で同じ編集済みプレビューメッセージを再利用するかどうかを制御します（デフォルト: プレビューストリーミングがアクティブな場合は `true`）
    - `streaming.preview.commandText` は、これらのツール進行状況行内のコマンド/実行詳細を制御します: `raw`（デフォルト、リリース済み動作を保持）または `status`（ツールラベルのみ）
    - `streaming.progress.commentary`（デフォルト: `false`）は、一時的な進行状況下書き内のアシスタントの commentary/前置きテキストを有効にします
    - レガシーの `channels.telegram.streamMode`、ブール値の `streaming` 値、廃止されたネイティブ下書きプレビューキーは検出されます。現在のストリーミング設定へ移行するには `openclaw doctor --fix` を実行してください

    ツール進行状況プレビューの更新は、ツールの実行中に表示される短いステータス行です。たとえば、コマンド実行、ファイル読み取り、計画更新、パッチ要約、または Codex app-server モードでの Codex の前置き/commentary テキストです。Telegram では、`v2026.4.22` 以降のリリース済み OpenClaw 動作と一致させるため、これらはデフォルトで有効です。

    回答テキスト用の編集済みプレビューを維持しつつ、ツール進行状況行を非表示にするには、次のように設定します。

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

    最終回答を同じメッセージへ編集せずに、表示可能なツール進行状況が必要な場合は、`progress` モードを使用します。コマンドテキストポリシーは `streaming.progress` の下に置きます。

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

    最終版のみの配信が必要な場合にだけ `streaming.mode: "off"` を使用してください。Telegram のプレビュー編集は無効になり、汎用のツール/進行状況の雑多な出力は、独立したステータスメッセージとして送信される代わりに抑制されます。承認プロンプト、メディアペイロード、エラーは引き続き通常の最終配信を通じてルーティングされます。ツール進行状況ステータス行を非表示にしつつ、回答プレビュー編集だけを維持したい場合は `streaming.preview.toolProgress: false` を使用してください。

    <Note>
      Telegram の選択引用返信は例外です。`replyToMode` が `"first"`、`"all"`、または `"batched"` で、受信メッセージに選択された引用テキストが含まれる場合、OpenClaw は回答プレビューを編集する代わりに、Telegram のネイティブ引用返信パスを通じて最終回答を送信します。そのため、そのターンでは `streaming.preview.toolProgress` で短いステータス行を表示できません。選択引用テキストのない現在メッセージへの返信では、引き続きプレビューストリーミングが維持されます。ツール進行状況の可視性がネイティブ引用返信より重要な場合は `replyToMode: "off"` を設定するか、`streaming.preview.toolProgress: false` を設定してトレードオフを明示してください。
    </Note>

    テキストのみの返信の場合:

    - 短い DM/グループ/トピックのプレビューでは、OpenClaw は同じプレビューメッセージを保持し、その場で最終編集を行います
    - 複数の Telegram メッセージに分割される長い最終テキストでは、可能な場合は既存のプレビューを最初の最終チャンクとして再利用し、その後は残りのチャンクのみを送信します
    - progress モードの最終版では、ステータス下書きをクリアし、下書きを回答へ編集する代わりに通常の最終配信を使用します
    - 完了したテキストが確認される前に最終編集が失敗した場合、OpenClaw は通常の最終配信を使用し、古いプレビューをクリーンアップします

    複雑な返信（たとえばメディアペイロード）の場合、OpenClaw は通常の最終配信にフォールバックし、その後プレビューメッセージをクリーンアップします。

    プレビューストリーミングはブロックストリーミングとは別です。Telegram でブロックストリーミングが明示的に有効化されている場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

    推論ストリームの動作:

    - `/reasoning stream` はサポートされているチャネルの推論プレビューパスを使用します。Telegram では、生成中に推論をライブプレビューへストリーミングします
    - 推論プレビューは最終配信後に削除されます。推論を表示したままにする必要がある場合は `/reasoning on` を使用してください
    - 最終回答は推論テキストなしで送信されます

  </Accordion>

  <Accordion title="Rich message formatting">
    送信テキストはデフォルトで標準の Telegram HTML メッセージを使用するため、現在の Telegram クライアント全体で返信を読みやすく保てます。この互換モードは通常の太字、斜体、リンク、コード、スポイラー、引用をサポートしますが、ネイティブテーブル、details、リッチメディア、数式などの Bot API 10.1 の rich-only ブロックはサポートしません。

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

    有効にした場合:

    - エージェントには、このボット/アカウントで Telegram リッチメッセージが利用可能であることが通知されます。
    - Markdown テキストは OpenClaw の Markdown IR を通じてレンダリングされ、Telegram リッチ HTML として送信されます。
    - 明示的なリッチ HTML ペイロードでは、見出し、テーブル、details、リッチメディア、数式など、サポートされている Bot API 10.1 タグが保持されます。
    - リッチメッセージはキャプションを置き換えないため、メディアキャプションは引き続き Telegram HTML キャプションを使用します。

    これにより、モデルテキストを Telegram Rich Markdown の記号から離せるため、`$400-600K` のような通貨が数式として解析されません。長いリッチテキストは、Telegram のリッチテキストおよびリッチブロックの制限に合わせて自動的に分割されます。Telegram の列数制限を超えるテーブルはコードブロックとして送信されます。

    デフォルト: クライアント互換性のためオフ。リッチメッセージには互換性のある Telegram クライアントが必要です。一部の現在の Desktop、Web、Android、およびサードパーティークライアントでは、受け入れられたリッチメッセージが未サポートとして表示されます。ボットで使用されるすべてのクライアントがそれらをレンダリングできる場合を除き、このオプションは無効のままにしてください。`/status` は、現在の Telegram セッションでリッチメッセージがオンかオフかを表示します。

    リンクプレビューはデフォルトで有効です。`channels.telegram.linkPreview: false` は、リッチテキストの自動エンティティ検出をスキップします。

  </Accordion>

  <Accordion title="Native commands and custom commands">
    Telegram コマンドメニュー登録は、起動時に `setMyCommands` で処理されます。

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

    - カスタムコマンドはメニュー項目のみです。動作は自動実装されません
    - Plugin/skill コマンドは、Telegram メニューに表示されていなくても、入力された場合は引き続き動作できます

    ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。設定されていれば、カスタム/Plugin コマンドは引き続き登録される場合があります。

    よくあるセットアップ失敗:

    - `setMyCommands failed` と `BOT_COMMANDS_TOO_MUCH` は、トリミング後も Telegram メニューがまだあふれていることを意味します。Plugin/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - 直接の Bot API curl コマンドは動作するのに、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合は、`channels.telegram.apiRoot` が完全な `/bot<TOKEN>` エンドポイントに設定されている可能性があります。`apiRoot` は Bot API ルートのみである必要があり、`openclaw doctor --fix` は誤って末尾に付いた `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、Telegram が設定済みのボットトークンを拒否したことを意味します。`botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN` を現在の BotFather トークンで更新してください。OpenClaw はポーリング前に停止するため、これは Webhook クリーンアップ失敗としては報告されません。
    - `setMyCommands failed` とネットワーク/fetch エラーは、通常 `api.telegram.org` への送信 DNS/HTTPS がブロックされていることを意味します。

    ### デバイスペアリングコマンド（`device-pair` Plugin）

    `device-pair` Plugin がインストールされている場合:

    1. `/pair` がセットアップコードを生成します
    2. iOS アプリにコードを貼り付けます
    3. `/pair pending` が保留中のリクエストを一覧表示します（role/scopes を含む）
    4. リクエストを承認します。
       - 明示的な承認には `/pair approve <requestId>`
       - 保留中のリクエストが 1 件だけの場合は `/pair approve`
       - 最新のものには `/pair approve latest`

    セットアップコードには短寿命のブートストラップトークンが含まれます。組み込みのセットアップコードブートストラップは、信頼済みモバイルオンボーディング用に、`scopes: []` を持つ永続的なノードトークンと、制限付きのオペレーター引き渡しトークンを返します。そのオペレータートークンはセットアップ時のネイティブ設定を読み取れますが、ペアリング変更スコープや `operator.admin` は付与しません。

    デバイスが変更された認証詳細（たとえば role/scopes/public key）で再試行した場合、以前の保留中リクエストは置き換えられ、新しいリクエストでは別の `requestId` が使用されます。承認する前に `/pair pending` を再実行してください。

    詳細: [ペアリング](/ja-JP/channels/pairing#pair-via-telegram-recommended-for-ios).

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
    - `allowlist` (デフォルト)

    レガシーの `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` にマッピングされます。

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

    登録済み Plugin のインタラクティブハンドラーが処理しないコールバッククリックは、
    テキストとしてエージェントに渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="エージェントと自動化向けの Telegram メッセージアクション">
    Telegram ツールアクションには以下が含まれます。

    - `sendMessage` (`to`, `content`, 任意の `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` または `caption`, 任意の `presentation` インラインボタン。ボタンのみの編集は返信マークアップを更新します)
    - `createForumTopic` (`chatId`, `name`, 任意の `iconColor`, `iconCustomEmojiId`)

    チャンネルメッセージアクションは、使いやすいエイリアス (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`) を公開します。

    ゲート制御:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (デフォルト: 無効)

    注: `edit` と `topic-create` は現在デフォルトで有効であり、個別の `channels.telegram.actions.*` トグルはありません。
    ランタイム送信はアクティブな設定/シークレットのスナップショット (起動/リロード) を使用するため、アクションパスは送信ごとにアドホックな SecretRef の再解決を行いません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッド化タグ">
    Telegram は、生成された出力内の明示的な返信スレッド化タグをサポートします。

    - `[[reply_to_current]]` はトリガー元メッセージに返信します
    - `[[reply_to:<id>]]` は特定の Telegram メッセージ ID に返信します

    `channels.telegram.replyToMode` は処理を制御します。

    - `off` (デフォルト)
    - `first`
    - `all`

    返信スレッド化が有効で、元の Telegram テキストまたはキャプションが利用可能な場合、OpenClaw はネイティブの Telegram 引用抜粋を自動的に含めます。Telegram はネイティブ引用テキストを 1024 UTF-16 コード単位に制限するため、長いメッセージは先頭から引用され、Telegram が引用を拒否した場合はプレーンな返信にフォールバックします。

    注: `off` は暗黙的な返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッド動作">
    フォーラムスーパーグループ:

    - トピックセッションキーは `:topic:<threadId>` を追加します
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック (`threadId=1`) の特殊ケース:

    - メッセージ送信では `message_thread_id` を省略します (Telegram は `sendMessage(...thread_id=1)` を拒否します)
    - 入力中アクションには引き続き `message_thread_id` が含まれます

    トピック継承: トピックエントリは、上書きされない限りグループ設定を継承します (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)。
    `agentId` はトピック専用で、グループのデフォルトからは継承されません。
    `topics."*"` は、そのグループ内のすべてのトピックのデフォルトを設定します。正確なトピック ID は引き続き `"*"` より優先されます。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック設定で `agentId` を設定することで別のエージェントにルーティングできます。これにより、各トピックは独自に分離されたワークスペース、メモリ、セッションを持ちます。例:

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

    その後、各トピックには独自のセッションキーがあります: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続 ACP トピックバインディング**: フォーラムトピックは、トップレベルの型付き ACP バインディング (`type: "acp"` と `match.channel: "telegram"`, `peer.kind: "group"`, および `-1001234567890:topic:42` のようなトピック修飾 ID を含む `bindings[]`) を通じて ACP ハーネスセッションを固定できます。現在はグループ/スーパーグループ内のフォーラムトピックにスコープされています。[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

    **チャットからのスレッド束縛 ACP spawn**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しい ACP セッションにバインドします。後続のやり取りはそこへ直接ルーティングされます。OpenClaw は spawn 確認をトピック内に固定します。`channels.telegram.threadBindings.spawnSessions` が有効のままである必要があります (デフォルト: `true`)。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは返信メタデータを保持します。Telegram `getMe` が bot について `has_topics_enabled: true` を報告する場合にのみ、スレッド対応セッションキーを使用します。
    以前の `dm.threadReplies` と `direct.*.threadReplies` の上書きは意図的に廃止されています。BotFather のスレッド化モードを単一の信頼できる情報源として使用し、`openclaw doctor --fix` を実行して古い設定キーを削除してください。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram はボイスノートと音声ファイルを区別します。

    - デフォルト: 音声ファイルの動作
    - エージェント返信内のタグ `[[audio_as_voice]]` はボイスノート送信を強制します
    - 受信したボイスノートの文字起こしは、エージェントコンテキスト内で機械生成の
      信頼されないテキストとしてフレーム化されます。メンション検出は引き続き生の
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

    動画ノートはキャプションをサポートしません。指定されたメッセージテキストは別個に送信されます。

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

    ステッカーの説明は、反復的な vision 呼び出しを減らすために OpenClaw SQLite Plugin 状態にキャッシュされます。

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

  <Accordion title="Reaction notifications">
    Telegram のリアクションは、メッセージペイロードとは別の `message_reaction` 更新として届きます。

    有効な場合、OpenClaw は次のようなシステムイベントをキューに入れます:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注:

    - `own` は bot が送信したメッセージに対するユーザーリアクションのみを意味します（送信済みメッセージキャッシュによるベストエフォート）。
    - リアクションイベントは引き続き Telegram のアクセス制御（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）に従います。許可されていない送信者は破棄されます。
    - Telegram はリアクション更新でスレッド ID を提供しません。
      - 非フォーラムグループはグループチャットセッションにルーティングされます
      - フォーラムグループは、正確な発信元トピックではなく、グループの一般トピックセッション（`:topic:1`）にルーティングされます

    ポーリング/Webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認応答 emoji を送信します。`ackReactionScope` は、その emoji が実際に送信される*タイミング*を決定します。

    **Emoji（`ackReaction`）の解決順序:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェント ID の emoji フォールバック（`agents.list[].identity.emoji`、なければ "👀"）

    注:

    - Telegram は Unicode emoji（例えば "👀"）を想定します。
    - チャンネルまたはアカウントのリアクションを無効化するには `""` を使用します。

    **スコープ（`messages.ackReactionScope`）:**

    Telegram プロバイダーは `messages.ackReactionScope`（デフォルト `"group-mentions"`）からスコープを読み取ります。現在、Telegram アカウント単位または Telegram チャンネル単位のオーバーライドはありません。

    値: `"all"`（DM + グループ）、`"direct"`（DM のみ）、`"group-all"`（すべてのグループメッセージ、DM なし）、`"group-mentions"`（bot がメンションされたグループ。**DM なし** — これがデフォルト）、`"off"` / `"none"`（無効）。

    <Note>
    デフォルトスコープ（`"group-mentions"`）では、ダイレクトメッセージで ack リアクションは発火しません。受信 Telegram DM で ack リアクションを得るには、`messages.ackReactionScope` を `"direct"` または `"all"` に設定します。この値は Telegram プロバイダーの起動時に読み取られるため、変更を有効にするには Gateway の再起動が必要です。
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    チャンネル設定の書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegram からトリガーされる書き込みには次が含まれます:

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
    デフォルトはロングポーリングです。Webhook モードでは `channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。任意で `webhookPath`、`webhookHost`、`webhookPort`（デフォルトは `/telegram-webhook`、`127.0.0.1`、`8787`）も設定できます。

    ロングポーリングモードでは、OpenClaw は更新のディスパッチが成功した後にのみ再起動ウォーターマークを永続化します。ハンドラーが失敗した場合、その更新は同じプロセス内で再試行可能なままであり、再起動時の重複排除のために完了済みとして書き込まれません。

    ローカルリスナーは `127.0.0.1:8787` にバインドします。公開 ingress には、ローカルポートの前段にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定します。

    Webhook モードは、Telegram に `200` を返す前にリクエストガード、Telegram シークレットトークン、JSON 本文を検証します。
    その後 OpenClaw は、ロングポーリングで使用されるものと同じチャット単位/トピック単位の bot レーンを通じて更新を非同期に処理するため、遅いエージェントターンが Telegram の配信 ACK を保持することはありません。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信の Telegram メディアサイズを制限します。
    - `channels.telegram.mediaGroupFlushMs`（デフォルト 500）は、Telegram のアルバム/メディアグループを OpenClaw が 1 つの受信メッセージとしてディスパッチする前にバッファする時間を制御します。アルバムの一部が遅れて到着する場合は増やし、アルバム返信のレイテンシを下げるには減らしてください。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定の場合は grammY のデフォルトが適用されます）。Bot クライアントは、設定値が 60 秒の送信テキスト/入力中リクエストガードを下回る場合にクランプし、OpenClaw のトランスポートガードとフォールバックが実行される前に grammY が表示される返信配信を中止しないようにします。ロングポーリングでは引き続き 45 秒の `getUpdates` リクエストガードを使用し、アイドル状態のポーリングが無期限に放棄されないようにします。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。誤検知によるポーリング停止再起動の場合に限り、`30000` から `600000` の間で調整してください。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト 50）を使用します。`0` で無効化します。
    - 返信/引用/転送の補足コンテキストは、Gateway が親メッセージを観測している場合、選択された 1 つの会話コンテキストウィンドウに正規化されます。観測済みメッセージキャッシュは OpenClaw SQLite Plugin 状態に保存され、`openclaw doctor --fix` はレガシーサイドカーをインポートします。Telegram は更新に浅い `reply_to_message` を 1 つだけ含めるため、キャッシュより古いチェーンは Telegram の現在の更新ペイロードに制限されます。
    - Telegram の許可リストは主に、誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキストの秘匿境界ではありません。
    - DM 履歴コントロール:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、回復可能な送信 API エラーに対して Telegram 送信ヘルパー（CLI/ツール/アクション）に適用されます。受信最終返信の配信も、Telegram の接続前失敗に対して境界付きの安全送信再試行を使用しますが、表示メッセージを重複させる可能性がある曖昧な送信後ネットワークエンベロープは再試行しません。

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

    Telegram 専用ポーリングフラグ:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - フォーラムトピック用の `--thread-id`（または `:topic:` ターゲットを使用）

    Telegram 送信は次もサポートします。

    - `channels.telegram.capabilities.inlineButtons` が許可している場合、インラインキーボード用の `buttons` ブロックを含む `--presentation`
    - Bot がそのチャットでピン留めできる場合にピン留め配信をリクエストする `--pin` または `--delivery '{"pin":true}'`
    - 送信画像、GIF、動画を、圧縮写真、アニメーションメディア、動画アップロードではなくドキュメントとして送信する `--force-document`

    アクション制御:

    - `channels.telegram.actions.sendMessage=false` は、ポーリングを含む送信 Telegram メッセージを無効にします
    - `channels.telegram.actions.poll=false` は、通常の送信を有効のままにして Telegram ポーリング作成を無効にします

  </Accordion>

  <Accordion title="Telegram での exec 承認">
    Telegram は承認者 DM で exec 承認をサポートし、任意で発信元のチャットまたはトピックにプロンプトを投稿できます。承認者は数値の Telegram ユーザー ID である必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled`（少なくとも 1 人の承認者を解決できる場合に自動有効化）
    - `channels.telegram.execApprovals.approvers`（`commands.ownerAllowFrom` の数値オーナー ID にフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト） | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom`、`defaultTo` は、誰が Bot と会話できるか、および通常の返信をどこへ送るかを制御します。これらは誰かを exec 承認者にするものではありません。まだコマンドオーナーが存在しない場合、最初に承認された DM ペアリングが `commands.ownerAllowFrom` をブートストラップするため、1 オーナー構成でも `execApprovals.approvers` に ID を重複して指定せずに動作します。

    チャンネル配信ではチャットにコマンドテキストが表示されます。信頼されたグループ/トピックでのみ `channel` または `both` を有効にしてください。プロンプトがフォーラムトピックに届いた場合、OpenClaw は承認プロンプトとフォローアップのためにそのトピックを保持します。exec 承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンでは、対象サーフェス（`dm`、`group`、または `all`）を許可するために `channels.telegram.capabilities.inlineButtons` も必要です。`plugin:` が付いた承認 ID は Plugin 承認を通じて解決され、それ以外はまず exec 承認を通じて解決されます。

    [Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信コントロール

エージェントが配信エラーまたはプロバイダーエラーに遭遇した場合、エラーポリシーはエラーメッセージを Telegram チャットへ送信するかどうかを制御します。

| キー                                | 値                         | デフォルト      | 説明                                                                                                                                                                                                      |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — すべてのエラーメッセージをチャットへ送信します。`once` — クールダウンウィンドウごとに各一意のエラーメッセージを 1 回だけ送信します（同一エラーの繰り返しを抑制）。`silent` — エラーメッセージをチャットへ送信しません。 |
| `channels.telegram.errorCooldownMs` | 数値 (ms)                  | `14400000` (4時間) | `once` ポリシーのクールダウンウィンドウです。エラーが送信された後、この間隔が経過するまで同じエラーメッセージは抑制されます。障害中のエラースパムを防ぎます。                                         |

アカウントごと、グループごと、トピックごとの上書きがサポートされています（他の Telegram 設定キーと同じ継承）。

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
      - BotFather: `/setprivacy` -> 無効化
      - その後、Bot をグループから削除して再追加します
    - 設定がメンションなしのグループメッセージを想定している場合、`openclaw channels status` が警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認できます。ワイルドカード `"*"` はメンバーシップ調査できません。
    - 簡易セッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="Bot がグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、グループを列挙する必要があります（または `"*"` を含めます）
    - グループ内の Bot メンバーシップを確認します
    - スキップ理由についてログを確認します: `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが部分的にしか動作しない、またはまったく動作しない">

    - 送信者 ID を承認します（ペアリングおよび/または数値 `allowFrom`）
    - グループポリシーが `open` の場合でも、コマンド承認は引き続き適用されます
    - `setMyCommands failed` と `BOT_COMMANDS_TOO_MUCH` が表示される場合、ネイティブメニューの項目が多すぎます。Plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効にしてください
    - 起動時の `deleteMyCommands` / `setMyCommands` 呼び出しと `sendChatAction` 入力中呼び出しは境界付きで、リクエストタイムアウト時には Telegram のトランスポートフォールバックを通じて 1 回再試行されます。永続的なネットワーク/フェッチエラーは通常、`api.telegram.org` への DNS/HTTPS 到達性の問題を示します

  </Accordion>

  <Accordion title="起動時に未承認トークンが報告される">

    - `getMe returned 401` は、設定された Bot トークンに対する Telegram 認証失敗です。
    - BotFather で Bot トークンを再コピーまたは再生成し、デフォルトアカウントの `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken`、または `TELEGRAM_BOT_TOKEN` を更新します。
    - 起動中の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「Webhook が存在しない」と扱うと、同じ不正トークン失敗を後続の API 呼び出しまで先送りするだけです。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - Node 22+ とカスタム fetch/proxy の組み合わせでは、AbortSignal 型が一致しない場合に即時中止動作を引き起こすことがあります。
    - 一部のホストは `api.telegram.org` を最初に IPv6 へ解決します。IPv6 の送信経路が壊れていると、Telegram API が断続的に失敗することがあります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw はこれらを回復可能なネットワークエラーとして再試行するようになりました。
    - ポーリング起動中、OpenClaw は成功した起動時の `getMe` 調査を grammY に再利用するため、ランナーは最初の `getUpdates` の前に 2 回目の `getMe` を必要としません。
    - ポーリング起動中に一時的なネットワークエラーで `deleteWebhook` が失敗した場合、OpenClaw は別のポーリング前コントロールプレーン呼び出しを行わずにロングポーリングへ進みます。Webhook がまだアクティブな場合は `getUpdates` の競合として表面化し、その後 OpenClaw は Telegram トランスポートを再構築して Webhook クリーンアップを再試行します。
    - Telegram ソケットが短い固定周期でリサイクルされる場合は、低い `channels.telegram.timeoutSeconds` が設定されていないか確認してください。Bot クライアントは設定値を送信および `getUpdates` リクエストガード未満にクランプしますが、古いリリースではこの値がそれらのガード未満に設定されていると、すべてのポーリングまたは返信が中止される可能性がありました。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw はデフォルトで 120 秒間、完了したロングポーリングの生存確認がないと、ポーリングを再起動して Telegram トランスポートを再構築します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中のポーリングアカウントが起動猶予後に `getUpdates` を完了していない場合、実行中の Webhook アカウントが起動猶予後に `setWebhook` を完了していない場合、または最後に成功したポーリングトランスポートアクティビティが古い場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しが正常でも、ホストが誤ったポーリング停止再起動を報告する場合に限り、`channels.telegram.pollingStallThresholdMs` を増やしてください。永続的な停止は通常、ホストと `api.telegram.org` の間の proxy、DNS、IPv6、または TLS 送信経路の問題を示します。
    - Telegram は Bot API トランスポートについて、`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` とその小文字バリアントを含むプロセス proxy env も尊重します。`NO_PROXY` / `no_proxy` は引き続き `api.telegram.org` をバイパスできます。
    - OpenClaw 管理プロキシがサービス環境向けに `OPENCLAW_PROXY_URL` で設定されており、標準の proxy env が存在しない場合、Telegram も Bot API トランスポートにその URL を使用します。
    - 直接の送信経路/TLS が不安定な VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由でルーティングします。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ は `autoSelectFamily=true` がデフォルトです（WSL2 を除く）。Telegram の DNS 結果順序は、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、次に `channels.telegram.network.dnsResultOrder`、次に `NODE_OPTIONS=--dns-result-order=ipv4first` などのプロセス既定値に従います。いずれも適用されない場合、Node 22+ は `ipv4first` にフォールバックします。
    - ホストが WSL2 の場合、または IPv4 のみの動作のほうが明示的に適している場合は、ファミリー選択を強制します。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、Telegram メディアダウンロードではデフォルトで許可されています。信頼済みの fake-IP または
      透過プロキシが、メディアダウンロード中に `api.telegram.org` を他の
      プライベート/内部/特殊用途アドレスへ書き換える場合は、Telegram 専用のバイパスを
      オプトインできます。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインは、アカウントごとに
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` でも利用できます。
    - プロキシが Telegram メディアホストを `198.18.x.x` に解決する場合は、まず
      危険なフラグをオフのままにしてください。Telegram メディアは、RFC 2544
      ベンチマーク範囲をデフォルトで既に許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram
      メディアの SSRF 保護を弱めます。Clash、Mihomo、Surge の fake-IP ルーティングなど、信頼済みのオペレーター管理プロキシ環境で、RFC 2544 ベンチマーク
      範囲外のプライベートまたは特殊用途の応答を合成する場合にのみ使用してください。通常の公開インターネット経由の Telegram アクセスではオフのままにしてください。
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

詳細ヘルプ: [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主要リファレンス: [設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="重要度の高い Telegram フィールド">

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
マルチアカウントの優先順位: 2 つ以上のアカウント ID が設定されている場合は、既定のルーティングを明示するために `channels.telegram.defaultAccount` を設定してください（または `channels.telegram.accounts.default` を含めてください）。そうしない場合、OpenClaw は最初に正規化されたアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
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
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと堅牢化。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントにマッピングします。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断。
  </Card>
</CardGroup>
