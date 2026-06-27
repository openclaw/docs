---
read_when:
    - Telegram の機能または Webhook に取り組む
summary: Telegram bot のサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-06-27T10:42:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f05ee57f06fe3b1c42ca19204bf74685ca3f05b1f02b9a6e36a7986e298b7edc
    source_path: channels/telegram.md
    workflow: 16
---

本番運用に対応し、grammY 経由でボットのDMとグループを利用できます。既定のモードはロングポーリングです。Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram の既定のDMポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    複数チャネルの診断と修復プレイブック。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/ja-JP/gateway/configuration">
    チャネル設定パターンと例の全体。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFather でボットトークンを作成する">
    Telegram を開き、**@BotFather** とチャットします（ハンドルが正確に `@BotFather` であることを確認します）。

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

    env フォールバック: `TELEGRAM_BOT_TOKEN=...`（既定アカウントのみ）。
    Telegram は `openclaw channels login telegram` を使用**しません**。config/env にトークンを設定してから、gateway を起動します。

  </Step>

  <Step title="gateway を起動し、最初のDMを承認する">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    ペアリングコードは1時間後に期限切れになります。

  </Step>

  <Step title="ボットをグループに追加する">
    ボットをグループに追加し、グループアクセスに必要な両方のIDを取得します。

    - `allowFrom` / `groupAllowFrom` で使用する、あなたの Telegram ユーザーID
    - `channels.telegram.groups` のキーとして使用する、Telegram グループチャットID

    初回セットアップでは、`openclaw logs --follow`、転送IDボット、または Bot API `getUpdates` からグループチャットIDを取得します。グループが許可された後は、`/whoami@<bot_username>` でユーザーIDとグループIDを確認できます。

    `-100` で始まる負の Telegram スーパーグループIDはグループチャットIDです。`groupAllowFrom` ではなく、`channels.telegram.groups` の下に置いてください。

  </Step>
</Steps>

<Note>
トークン解決順序はアカウントを考慮します。実際には、config 値が env フォールバックより優先され、`TELEGRAM_BOT_TOKEN` は既定アカウントにのみ適用されます。
起動に成功すると、OpenClaw はボットIDを state ディレクトリに最大24時間キャッシュするため、再起動時に追加の Telegram `getMe` 呼び出しを回避できます。トークンを変更または削除すると、そのキャッシュはクリアされます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループの可視性">
    Telegram ボットは既定で**プライバシーモード**になっており、受信できるグループメッセージが制限されます。

    ボットがすべてのグループメッセージを確認する必要がある場合は、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする、または
    - ボットをグループ管理者にする。

    プライバシーモードを切り替えるときは、Telegram が変更を適用できるように、各グループでボットを削除してから再追加します。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram グループ設定で制御します。

    管理者ボットはすべてのグループメッセージを受信するため、常時有効なグループ動作に役立ちます。

  </Accordion>

  <Accordion title="便利な BotFather 切り替え">

    - `/setjoingroups` でグループ追加を許可/拒否
    - `/setprivacy` でグループ可視性の動作を設定

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

### グループボットID

Telegram グループとフォーラムトピックでは、設定済みボットハンドル（例: `@my_bot`）への明示的なメンションは、エージェントのペルソナ名が Telegram ユーザー名と異なる場合でも、選択された OpenClaw エージェントへの呼びかけとして扱われます。グループのサイレンスポリシーは無関係なグループトラフィックに引き続き適用されますが、ボットハンドル自体は「他の誰か」とは見なされません。

<Tabs>
  <Tab title="DMポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing`（既定）
    - `allowlist`（`allowFrom` に少なくとも1つの送信者IDが必要）
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `dmPolicy: "open"` と `allowFrom: ["*"]` を組み合わせると、ボットのユーザー名を見つけた、または推測した任意の Telegram アカウントがボットにコマンドを送信できます。ツールを厳しく制限した、意図的に公開するボットにのみ使用してください。所有者が1人のボットでは、数値ユーザーIDを指定した `allowlist` を使用してください。

    `channels.telegram.allowFrom` は数値の Telegram ユーザーIDを受け付けます。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    複数アカウント設定では、制限的なトップレベルの `channels.telegram.allowFrom` は安全境界として扱われます。アカウントレベルの `allowFrom: ["*"]` エントリがあっても、マージ後の有効なアカウント allowlist に明示的なワイルドカードが残っていない限り、そのアカウントは公開されません。
    空の `allowFrom` を持つ `dmPolicy: "allowlist"` はすべてのDMをブロックし、config 検証で拒否されます。
    セットアップでは数値ユーザーIDのみを求めます。
    アップグレード後の config に `@username` allowlist エントリが含まれている場合は、`openclaw doctor --fix` を実行して解決してください（ベストエフォート。Telegram ボットトークンが必要です）。
    以前にペアリングストアの allowlist ファイルに依存していた場合、`openclaw doctor --fix` は allowlist フローでエントリを `channels.telegram.allowFrom` に復元できます（たとえば `dmPolicy: "allowlist"` にまだ明示的なIDがない場合）。

    所有者が1人のボットでは、以前のペアリング承認に依存する代わりに、明示的な数値 `allowFrom` ID を指定した `dmPolicy: "allowlist"` を優先し、アクセスポリシーを config 内で永続化してください。

    よくある混乱: DMペアリング承認は「この送信者がどこでも承認されている」という意味ではありません。
    ペアリングはDMアクセスを付与します。コマンド所有者がまだ存在しない場合、最初に承認されたペアリングは `commands.ownerAllowFrom` も設定し、所有者専用コマンドと exec 承認に明示的なオペレーターアカウントを持たせます。
    グループ送信者の承認は、引き続き明示的な config allowlist から取得されます。
    「一度承認されればDMとグループコマンドの両方が動作する」状態にしたい場合は、数値の Telegram ユーザーIDを `channels.telegram.allowFrom` に入れてください。所有者専用コマンドについては、`commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### Telegram ユーザーIDを見つける

    より安全な方法（サードパーティボットなし）:

    1. ボットにDMします。
    2. `openclaw logs --follow` を実行します。
    3. `from.id` を読み取ります。

    公式 Bot API の方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティの方法（プライバシーは低め）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと allowlist">
    2つの制御が一緒に適用されます。

    1. **許可されるグループ**（`channels.telegram.groups`）
       - `groups` config なし:
         - `groupPolicy: "open"` の場合: 任意のグループがグループIDチェックを通過できます
         - `groupPolicy: "allowlist"`（既定）の場合: `groups` エントリ（または `"*"`）を追加するまでグループはブロックされます
       - `groups` が設定されている場合: allowlist として機能します（明示的なIDまたは `"*"`）

    2. **グループ内で許可される送信者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（既定）
       - `disabled`

    `groupAllowFrom` はグループ送信者フィルタリングに使用されます。設定されていない場合、Telegram は `allowFrom` にフォールバックします。
    `groupAllowFrom` エントリは数値の Telegram ユーザーIDである必要があります（`telegram:` / `tg:` プレフィックスは正規化されます）。
    Telegram グループまたはスーパーグループのチャットIDを `groupAllowFrom` に入れないでください。負のチャットIDは `channels.telegram.groups` の下に属します。
    数値でないエントリは送信者承認では無視されます。
    セキュリティ境界（`2026.2.25+`）: グループ送信者認証はDMペアリングストア承認を継承**しません**。
    ペアリングはDM専用のままです。グループでは、`groupAllowFrom` またはグループ/トピックごとの `allowFrom` を設定してください。
    `groupAllowFrom` が未設定の場合、Telegram はペアリングストアではなく config `allowFrom` にフォールバックします。
    所有者が1人のボットでの実用的なパターン: ユーザーIDを `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` で許可します。
    ランタイムメモ: `channels.telegram` が完全に欠落している場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムは fail-closed の `groupPolicy="allowlist"` を既定にします。

    所有者専用のグループセットアップ:

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

    グループから `@<bot_username> ping` でテストします。`requireMention: true` の間は、通常のグループメッセージはボットをトリガーしません。

    例: 1つの特定グループ内の任意のメンバーを許可する:

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
      よくある間違い: `groupAllowFrom` は Telegram グループの allowlist ではありません。

      - `-1001234567890` のような負の Telegram グループまたはスーパーグループチャットIDは、`channels.telegram.groups` の下に置いてください。
      - 許可済みグループ内のどの人がボットをトリガーできるかを制限したい場合は、`8734062810` のような Telegram ユーザーIDを `groupAllowFrom` の下に置いてください。
      - 許可済みグループの任意のメンバーがボットと会話できるようにしたい場合のみ、`groupAllowFrom: ["*"]` を使用してください。

    </Warning>

  </Tab>

  <Tab title="メンション動作">
    グループ返信は既定でメンションを必要とします。

    メンションは次の場所から来る場合があります。

    - ネイティブの `@botusername` メンション、または
    - 次に含まれるメンションパターン:
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

    グループ履歴コンテキストの既定は `mention-only` です。以前のグループメッセージは、
    ボットに宛てられた場合、ボットへの返信である場合、
    またはボット自身のメッセージである場合にのみ含まれます。信頼済みグループで最近のルーム履歴を
    含めるには `includeGroupHistoryContext: "recent"` を設定します。次のターンで
    以前の Telegram グループ履歴を送信しない場合は、
    `includeGroupHistoryContext: "none"` を設定します。

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    グループチャットIDの取得:

    - グループメッセージを `@userinfobot` / `@getidsbot` に転送する
    - または `openclaw logs --follow` から `chat.id` を読み取る
    - または Bot API `getUpdates` を調べる
    - グループが許可された後、ネイティブコマンドが有効なら `/whoami@<bot_username>` を実行する

  </Tab>
</Tabs>

## ランタイム動作

- Telegram は Gateway プロセスが所有します。
- ルーティングは決定的です。Telegram の受信返信は Telegram に返されます（モデルはチャネルを選びません）。
- 受信メッセージは、返信メタデータ、メディアプレースホルダー、Gateway が観測した Telegram 返信用の永続化された返信チェーンコンテキストを含む共有チャネルエンベロープに正規化されます。
- グループセッションはグループ ID ごとに分離されます。フォーラムトピックでは、トピックを分離するために `:topic:<threadId>` が追加されます。
- DM メッセージには `message_thread_id` を含められます。OpenClaw は返信用にそれを保持します。DM トピックセッションは、Telegram `getMe` が bot について `has_topics_enabled: true` を返す場合にのみ分割されます。それ以外の DM はフラットなセッションに残ります。
- ロングポーリングは grammY runner を使い、chat/thread ごとの順序制御を行います。runner sink 全体の並行数には `agents.defaults.maxConcurrent` を使います。
- 複数アカウントの起動では、並行する Telegram `getMe` プローブを制限し、大規模な bot 群が全アカウントのプローブを一度に展開しないようにします。
- ロングポーリングは各 Gateway プロセス内で保護されるため、一度に 1 つの有効な poller だけが bot token を使用できます。それでも `getUpdates` 409 conflict が表示される場合は、別の OpenClaw Gateway、script、または外部 poller が同じ token を使っている可能性があります。
- ロングポーリング watchdog の再起動は、デフォルトで 120 秒間 `getUpdates` の liveness 完了がない場合に発火します。長時間実行中の作業中に、デプロイで polling-stall restart の誤検知がまだ発生する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。値はミリ秒単位で、`30000` から `600000` まで許可されます。アカウントごとの上書きもサポートされています。
- Telegram Bot API には read-receipt サポートがありません（`sendReadReceipts` は適用されません）。

<Note>
  `channels.telegram.dm.threadReplies` と `channels.telegram.direct.<chatId>.threadReplies` は削除されました。config にまだこれらのキーがある場合は、アップグレード後に `openclaw doctor --fix` を実行してください。DM トピックルーティングは、Telegram `getMe.has_topics_enabled` から得られる bot capability に従うようになりました。これは BotFather の threaded mode によって制御されます。topics-enabled bots は Telegram が `message_thread_id` を送信したときに thread-scoped DM sessions を使い、それ以外の DM はフラットなセッションに残ります。
</Note>

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は部分返信をリアルタイムで stream できます。

    - direct chats: preview message + `editMessageText`
    - groups/topics: preview message + `editMessageText`

    要件:

    - `channels.telegram.streaming` は `off | partial | block | progress` です（デフォルト: `partial`）
    - 短い初期回答プレビューは debounce され、run がまだ active の場合は制限付き遅延後に実体化されます
    - `progress` は tool progress 用に編集可能な status draft を 1 つ保持し、tool progress より前に answer activity が届いた場合は安定した status label を表示し、完了時に消去し、最終回答を通常メッセージとして送信します
    - `streaming.preview.toolProgress` は、tool/progress updates が同じ edited preview message を再利用するかどうかを制御します（デフォルト: preview streaming が active の場合は `true`）
    - `streaming.preview.commandText` は、これらの tool-progress 行内の command/exec 詳細を制御します: `raw`（デフォルト、リリース済みの挙動を保持）または `status`（tool label のみ）
    - `streaming.progress.commentary`（デフォルト: `false`）は、一時的な progress draft 内の assistant commentary/preamble text を有効にします
    - 従来の `channels.telegram.streamMode`、boolean の `streaming` 値、廃止された native draft preview keys は検出されます。現在の streaming config に移行するには `openclaw doctor --fix` を実行してください

    Tool-progress preview updates は、tools の実行中に表示される短い status 行です。例として、command execution、file reads、planning updates、patch summaries、または Codex app-server mode の Codex preamble/commentary text があります。Telegram では、`v2026.4.22` 以降のリリース済み OpenClaw の挙動に合わせるため、これらはデフォルトで有効です。

    回答テキスト用の edited preview は保持しつつ tool-progress 行を非表示にするには、次のように設定します。

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

    tool-progress は表示したまま command/exec text を非表示にするには、次のように設定します。

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

    最終回答を同じメッセージに編集せず、可視の tool progress が必要な場合は `progress` mode を使います。command-text policy は `streaming.progress` の下に置きます。

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

    最終のみの配信が必要な場合にのみ `streaming.mode: "off"` を使ってください。Telegram preview edits は無効になり、generic tool/progress chatter は standalone status messages として送られる代わりに抑制されます。Approval prompts、media payloads、errors は通常の final delivery を通して引き続きルーティングされます。tool-progress status 行を非表示にしつつ answer preview edits だけを保持したい場合は、`streaming.preview.toolProgress: false` を使います。

    <Note>
      Telegram の selected quote replies は例外です。`replyToMode` が `"first"`、`"all"`、または `"batched"` で、受信メッセージに selected quote text が含まれる場合、OpenClaw は answer preview を編集する代わりに Telegram の native quote-reply path を通して最終回答を送信します。そのため、その turn では `streaming.preview.toolProgress` で短い status 行を表示できません。selected quote text のない current-message replies では、引き続き preview streaming が維持されます。tool-progress visibility が native quote replies より重要な場合は `replyToMode: "off"` を設定するか、トレードオフを受け入れるために `streaming.preview.toolProgress: false` を設定してください。
    </Note>

    テキストのみの返信の場合:

    - 短い DM/group/topic previews: OpenClaw は同じ preview message を保持し、最終編集をその場で実行します
    - 複数の Telegram messages に分割される長い text finals は、可能な場合は既存の preview を最初の final chunk として再利用し、その後は残りの chunks だけを送信します
    - progress-mode finals は status draft を消去し、draft を回答に編集する代わりに通常の final delivery を使います
    - completed text が確認される前に final edit が失敗した場合、OpenClaw は通常の final delivery を使い、stale preview をクリーンアップします

    複雑な返信（たとえば media payloads）の場合、OpenClaw は通常の final delivery にフォールバックし、その後 preview message をクリーンアップします。

    Preview streaming は block streaming とは別です。Telegram で block streaming が明示的に有効になっている場合、OpenClaw は二重 streaming を避けるため preview stream をスキップします。

    Reasoning stream の挙動:

    - `/reasoning stream` はサポートされるチャネルの reasoning-preview path を使います。Telegram では、生成中に reasoning を live preview へ stream します
    - reasoning preview は final delivery の後に削除されます。reasoning を表示したままにする必要がある場合は `/reasoning on` を使います
    - final answer は reasoning text なしで送信されます

  </Accordion>

  <Accordion title="リッチメッセージ形式">
    送信テキストはデフォルトで標準の Telegram HTML messages を使うため、現在の Telegram clients 全体で返信が読みやすく保たれます。この compatibility mode は通常の bold、italic、links、code、spoilers、quotes をサポートしますが、native tables、details、rich media、formulas などの Bot API 10.1 rich-only blocks はサポートしません。

    Bot API 10.1 rich messages を有効にするには、`channels.telegram.richMessages: true` を設定します。

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

    - agent には、この bot/account で Telegram rich messages が利用可能であることが伝えられます。
    - Markdown text は OpenClaw の Markdown IR を通してレンダリングされ、Telegram rich HTML として送信されます。
    - 明示的な rich HTML payloads は、headings、tables、details、rich media、formulas など、サポートされる Bot API 10.1 tags を保持します。
    - Media captions は引き続き Telegram HTML captions を使います。rich messages は captions を置き換えないためです。

    これにより model text は Telegram Rich Markdown sigils から離されるため、`$400-600K` のような通貨が math として解析されません。長い rich text は Telegram の rich text と rich block limits に合わせて自動的に分割されます。Telegram の column limit を超える tables は code blocks として送信されます。

    デフォルト: client compatibility のため off。Rich messages には互換性のある Telegram clients が必要です。一部の現在の Desktop、Web、Android、third-party clients は、受け入れられた rich messages を unsupported として表示します。bot と一緒に使うすべての client がそれらをレンダリングできる場合を除き、この option は無効のままにしてください。`/status` は現在の Telegram session で rich messages が on か off かを表示します。

    Link previews はデフォルトで有効です。`channels.telegram.linkPreview: false` は rich text の automatic entity detection をスキップします。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram command menu registration は起動時に `setMyCommands` で処理されます。

    Native command defaults:

    - `commands.native: "auto"` は Telegram の native commands を有効にします

    custom command menu entries を追加します。

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

    - names は正規化されます（先頭の `/` を取り除き、小文字化）
    - valid pattern: `a-z`, `0-9`, `_`, length `1..32`
    - custom commands は native commands を上書きできません
    - conflicts/duplicates はスキップされ、ログに記録されます

    注記:

    - custom commands は menu entries のみです。挙動を自動実装しません
    - plugin/skill commands は、Telegram menu に表示されていなくても、入力されれば引き続き動作できます

    native commands が無効な場合、built-ins は削除されます。設定されていれば、custom/plugin commands は引き続き登録される場合があります。

    よくある setup failures:

    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、trimming 後も Telegram menu がまだ overflow したことを意味します。plugin/skill/custom commands を減らすか、`channels.telegram.commands.native` を無効にしてください。
    - direct Bot API curl commands は動作するのに、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合、`channels.telegram.apiRoot` が完全な `/bot<TOKEN>` endpoint に設定されていた可能性があります。`apiRoot` は Bot API root のみである必要があり、`openclaw doctor --fix` は誤って付いた末尾の `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、Telegram が設定された bot token を拒否したことを意味します。`botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN` を現在の BotFather token に更新してください。OpenClaw は polling の前に停止するため、これは webhook cleanup failure として報告されません。
    - network/fetch errors を伴う `setMyCommands failed` は、通常 `api.telegram.org` への outbound DNS/HTTPS がブロックされていることを意味します。

    ### デバイスペアリングコマンド（`device-pair` plugin）

    `device-pair` plugin がインストールされている場合:

    1. `/pair` は setup code を生成します
    2. iOS app に code を貼り付けます
    3. `/pair pending` は pending requests（role/scopes を含む）を一覧表示します
    4. request を承認します:
       - 明示的な承認には `/pair approve <requestId>`
       - pending request が 1 件だけの場合は `/pair approve`
       - 最新のものには `/pair approve latest`

    setup code は短命の bootstrap token を持ちます。組み込み setup-code bootstrap は node-only です。最初の connect は pending node request を作成し、承認後に Gateway は `scopes: []` を持つ永続的な node token を返します。handed-off operator token は返しません。operator access には、別途承認済みの operator pairing または token flow が必要です。

    device が auth details（たとえば role/scopes/public key）を変更して retry した場合、以前の pending request は superseded され、新しい request は別の `requestId` を使います。承認前に `/pair pending` を再実行してください。

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

    Telegram の `web_app` ボタンは、ユーザーと bot の間の
    プライベートチャットでのみ動作します。

    コールバックのクリックは、テキストとしてエージェントに渡されます:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="エージェントと自動化向けの Telegram メッセージアクション">
    Telegram ツールアクションには次が含まれます。

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

    注: `edit` と `topic-create` は現在デフォルトで有効で、個別の `channels.telegram.actions.*` トグルはありません。
    ランタイム送信はアクティブな設定/シークレットのスナップショット (起動/再読み込み) を使用するため、アクションパスは送信ごとにアドホックな SecretRef 再解決を行いません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)

  </Accordion>

  <Accordion title="返信スレッドタグ">
    Telegram は、生成された出力内の明示的な返信スレッドタグをサポートします。

    - `[[reply_to_current]]` はトリガー元のメッセージに返信します
    - `[[reply_to:<id>]]` は特定の Telegram メッセージ ID に返信します

    `channels.telegram.replyToMode` は処理を制御します。

    - `off` (デフォルト)
    - `first`
    - `all`

    返信スレッドが有効で、元の Telegram テキストまたはキャプションが利用可能な場合、OpenClaw はネイティブの Telegram 引用抜粋を自動的に含めます。Telegram はネイティブ引用テキストを 1024 UTF-16 コード単位に制限するため、長いメッセージは先頭から引用され、Telegram が引用を拒否した場合は通常の返信にフォールバックします。

    注: `off` は暗黙的な返信スレッドを無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッド動作">
    フォーラムスーパーグループ:

    - トピックセッションキーは `:topic:<threadId>` を追加します
    - 返信と入力中表示はトピックスレッドを対象にします
    - トピック設定パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック (`threadId=1`) の特別扱い:

    - メッセージ送信では `message_thread_id` を省略します (Telegram は `sendMessage(...thread_id=1)` を拒否します)
    - 入力中アクションには引き続き `message_thread_id` が含まれます

    トピックの継承: トピックエントリは、上書きされない限りグループ設定 (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`) を継承します。
    `agentId` はトピック専用で、グループのデフォルトからは継承されません。
    `topics."*"` はそのグループ内のすべてのトピックのデフォルトを設定します。完全一致のトピック ID は引き続き `"*"` より優先されます。

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

    その後、各トピックは独自のセッションキーを持ちます: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続的な ACP トピックバインディング**: フォーラムトピックは、トップレベルの型付き ACP バインディング (`type: "acp"` と `match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾 ID を持つ `bindings[]`) を通じて ACP ハーネスセッションを固定できます。現在はグループ/スーパーグループ内のフォーラムトピックにスコープされています。[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

    **チャットからのスレッドバインド ACP 生成**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しい ACP セッションにバインドします。以後のやり取りはそこに直接ルーティングされます。OpenClaw は生成確認をトピック内に固定します。`channels.telegram.threadBindings.spawnSessions` が有効のままである必要があります (デフォルト: `true`)。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは返信メタデータを保持します。Telegram `getMe` が bot に対して `has_topics_enabled: true` を報告する場合にのみ、スレッド対応のセッションキーを使用します。
    以前の `dm.threadReplies` と `direct.*.threadReplies` の上書きは意図的に廃止されています。BotFather のスレッドモードを唯一の信頼できる情報源として使用し、`openclaw doctor --fix` を実行して古い設定キーを削除してください。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram はボイスノートと音声ファイルを区別します。

    - デフォルト: 音声ファイルの動作
    - エージェントの返信内のタグ `[[audio_as_voice]]` は、ボイスノート送信を強制します
    - 受信したボイスノートの文字起こしは、エージェントコンテキスト内で機械生成の
      信頼されないテキストとして扱われます。メンション検出は引き続き生の
      文字起こしを使用するため、メンションでゲートされた音声メッセージは動作し続けます。

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

    Telegramは動画ファイルとビデオノートを区別します。

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

    ### スタンプ

    受信スタンプの処理:

    - 静的 WEBP: ダウンロードして処理されます（プレースホルダー `<media:sticker>`）
    - アニメーション TGS: スキップされます
    - 動画 WEBM: スキップされます

    スタンプコンテキストのフィールド:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    スタンプの説明は、繰り返しのビジョン呼び出しを減らすために、OpenClaw SQLite Plugin状態にキャッシュされます。

    スタンプアクションを有効にする:

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

    スタンプ送信アクション:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    キャッシュされたスタンプを検索する:

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
    Telegramのリアクションは、メッセージペイロードとは別の`message_reaction`更新として届きます。

    有効な場合、OpenClawは次のようなシステムイベントをキューに入れます:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定:

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    注記:

    - `own`は、ボットが送信したメッセージに対するユーザーのリアクションのみを意味します（送信済みメッセージキャッシュによるベストエフォート）。
    - リアクションイベントにもTelegramのアクセス制御（`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`）が適用されます。許可されていない送信者はドロップされます。
    - Telegramはリアクション更新でスレッドIDを提供しません。
      - 非フォーラムグループはグループチャットセッションにルーティングされます
      - フォーラムグループは、正確な発信元トピックではなく、グループの一般トピックセッション（`:topic:1`）にルーティングされます

    ポーリング/Webhookの`allowed_updates`には、`message_reaction`が自動的に含まれます。

  </Accordion>

  <Accordion title="Ackリアクション">
    `ackReaction`は、OpenClawが受信メッセージを処理している間に確認応答の絵文字を送信します。`ackReactionScope`は、その絵文字が実際に送信される*タイミング*を決定します。

    **絵文字（`ackReaction`）の解決順序:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェントIDの絵文字フォールバック（`agents.list[].identity.emoji`、なければ「👀」）

    注記:

    - TelegramはUnicode絵文字を想定しています（たとえば「👀」）。
    - チャンネルまたはアカウントのリアクションを無効にするには、`""`を使用します。

    **スコープ（`messages.ackReactionScope`）:**

    Telegramプロバイダーは、`messages.ackReactionScope`からスコープを読み取ります（デフォルトは`"group-mentions"`）。現在、Telegramアカウント単位またはTelegramチャンネル単位のオーバーライドはありません。

    値: `"all"`（DM + グループ）、`"direct"`（DMのみ）、`"group-all"`（すべてのグループメッセージ、DMなし）、`"group-mentions"`（ボットがメンションされたグループ。**DMなし** — これがデフォルト）、`"off"` / `"none"`（無効）。

    <Note>
    デフォルトのスコープ（`"group-mentions"`）では、ダイレクトメッセージでAckリアクションは発火しません。受信したTelegram DMでAckリアクションを得るには、`messages.ackReactionScope`を`"direct"`または`"all"`に設定します。この値はTelegramプロバイダーの起動時に読み取られるため、変更を有効にするにはGatewayの再起動が必要です。
    </Note>

  </Accordion>

  <Accordion title="Telegramイベントとコマンドからの設定書き込み">
    チャンネル設定の書き込みはデフォルトで有効です（`configWrites !== false`）。

    Telegramをトリガーとする書き込みには次が含まれます:

    - `channels.telegram.groups`を更新するためのグループ移行イベント（`migrate_to_chat_id`）
    - `/config set`と`/config unset`（コマンドの有効化が必要）

    無効にする:

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

  <Accordion title="ロングポーリングとWebhook">
    デフォルトはロングポーリングです。Webhookモードでは、`channels.telegram.webhookUrl`と`channels.telegram.webhookSecret`を設定します。任意で`webhookPath`、`webhookHost`、`webhookPort`も設定できます（デフォルトは`/telegram-webhook`、`127.0.0.1`、`8787`）。

    ロングポーリングモードでは、OpenClawは更新のディスパッチが成功した後にのみ、再起動用のウォーターマークを永続化します。ハンドラーが失敗した場合、その更新は同じプロセス内で再試行可能なままとなり、再起動時の重複排除用に完了済みとして書き込まれません。

    ローカルリスナーは`127.0.0.1:8787`にバインドします。公開された入口には、ローカルポートの前段にリバースプロキシを置くか、意図的に`webhookHost: "0.0.0.0"`を設定してください。

    Webhookモードでは、Telegramに`200`を返す前に、リクエストガード、Telegramのシークレットトークン、JSON本文を検証します。
    その後、OpenClawはロングポーリングで使われるものと同じチャットごと/トピックごとのボットレーンを通じて更新を非同期に処理するため、遅いエージェントターンがTelegramの配信ACKを待たせることはありません。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    - `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信 Telegram メディアサイズの上限です。
    - `channels.telegram.mediaGroupFlushMs`（デフォルト 500）は、Telegram のアルバム/メディアグループを OpenClaw が 1 つの受信メッセージとしてディスパッチする前にバッファする時間を制御します。アルバムの一部が遅れて到着する場合は増やし、アルバム返信のレイテンシを下げる場合は減らします。
    - `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定の場合は grammY のデフォルトが適用されます）。ボットクライアントは、設定値が 60 秒の送信テキスト/入力中リクエストガードを下回る場合に値をクランプし、OpenClaw のトランスポートガードとフォールバックが実行される前に grammY が表示される返信配信を中止しないようにします。ロングポーリングでは引き続き 45 秒の `getUpdates` リクエストガードを使用するため、アイドル状態のポーリングが無期限に放棄されることはありません。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは `120000` です。誤検知によるポーリング停止再起動の場合のみ、`30000` から `600000` の間で調整します。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト 50）を使用します。`0` で無効化します。
    - 返信/引用/転送の補足コンテキストは、Gateway が親メッセージを観測している場合、選択された 1 つの会話コンテキストウィンドウに正規化されます。観測済みメッセージキャッシュは OpenClaw SQLite Plugin 状態にあり、`openclaw doctor --fix` はレガシーサイドカーをインポートします。Telegram は更新に浅い `reply_to_message` を 1 つだけ含めるため、キャッシュより古いチェーンは Telegram の現在の更新ペイロードに制限されます。
    - Telegram allowlist は主に、完全な補足コンテキストの編集境界ではなく、誰がエージェントをトリガーできるかを制御します。
    - DM 履歴の制御:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定は、回復可能な送信 API エラーに対して Telegram 送信ヘルパー（CLI/ツール/アクション）に適用されます。受信の最終返信配信も Telegram の接続前失敗に対して境界付きの安全な送信再試行を使用しますが、表示メッセージを重複させる可能性がある送信後の曖昧なネットワークエンベロープは再試行しません。

    CLI とメッセージツールの送信ターゲットには、数値チャット ID、ユーザー名、またはフォーラムトピックターゲットを使用できます。

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

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - フォーラムトピック用の `--thread-id`（または `:topic:` ターゲットを使用）

    Telegram 送信は次もサポートします。

    - `channels.telegram.capabilities.inlineButtons` が許可している場合、インラインキーボード用の `buttons` ブロックを含む `--presentation`
    - ボットがそのチャットでピン留めできる場合に、ピン留め配信を要求する `--pin` または `--delivery '{"pin":true}'`
    - 送信画像、GIF、動画を、圧縮された写真、アニメーションメディア、動画アップロードではなくドキュメントとして送信する `--force-document`

    アクション制御:

    - `channels.telegram.actions.sendMessage=false` は、ポーリングを含む送信 Telegram メッセージを無効化します
    - `channels.telegram.actions.poll=false` は、通常の送信を有効にしたまま Telegram ポーリング作成を無効化します

  </Accordion>

  <Accordion title="Telegram での exec 承認">
    Telegram は承認者 DM で exec 承認をサポートし、任意で元のチャットまたはトピックにプロンプトを投稿できます。承認者は数値の Telegram ユーザー ID である必要があります。

    設定パス:

    - `channels.telegram.execApprovals.enabled`（少なくとも 1 人の承認者を解決できる場合に自動有効化）
    - `channels.telegram.execApprovals.approvers`（`commands.ownerAllowFrom` の数値オーナー ID にフォールバック）
    - `channels.telegram.execApprovals.target`: `dm`（デフォルト）| `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom`、`defaultTo` は、誰がボットと会話できるか、および通常の返信をどこに送信するかを制御します。これらによって誰かが exec 承認者になるわけではありません。コマンドオーナーがまだ存在しない場合、最初に承認された DM ペアリングが `commands.ownerAllowFrom` をブートストラップするため、1 オーナー構成は `execApprovals.approvers` の下で ID を重複させなくても引き続き機能します。

    チャンネル配信ではチャットにコマンドテキストが表示されます。信頼できるグループ/トピックでのみ `channel` または `both` を有効にしてください。プロンプトがフォーラムトピックに届いた場合、OpenClaw は承認プロンプトとフォローアップのトピックを保持します。exec 承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンも、対象サーフェス（`dm`、`group`、または `all`）を許可する `channels.telegram.capabilities.inlineButtons` を必要とします。`plugin:` で始まる承認 ID は Plugin 承認を介して解決され、それ以外はまず exec 承認を介して解決されます。

    [exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信の制御

エージェントで配信またはプロバイダーエラーが発生した場合、Telegram はエラーテキストで返信するか、それを抑制できます。この動作は 2 つの設定キーで制御します。

| キー                                | 値                | デフォルト | 説明                                                                                         |
| ----------------------------------- | ----------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` はチャットにわかりやすいエラーメッセージを送信します。`silent` はエラー返信を完全に抑制します。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | 同じチャットへのエラー返信間の最小時間。障害時のエラースパムを防ぎます。                    |

アカウントごと、グループごと、トピックごとの上書きがサポートされています（他の Telegram 設定キーと同じ継承）。

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

    - `requireMention=false` の場合、Telegram プライバシーモードで完全な可視性を許可する必要があります。
      - BotFather: `/setprivacy` -> Disable
      - その後、ボットをグループから削除して再追加します
    - 設定がメンションなしのグループメッセージを想定している場合、`openclaw channels status` は警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認できます。ワイルドカード `"*"` はメンバーシップ調査できません。
    - 簡易セッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、グループを一覧に含める必要があります（または `"*"` を含めます）
    - グループ内のボットメンバーシップを確認します
    - スキップ理由についてログを確認します: `openclaw logs --follow`

  </Accordion>

  <Accordion title="コマンドが部分的にしか機能しない、またはまったく機能しない">

    - 送信者 ID を承認します（ペアリングおよび/または数値の `allowFrom`）
    - グループポリシーが `open` の場合でも、コマンド承認は引き続き適用されます
    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、ネイティブメニューのエントリが多すぎることを意味します。Plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効化します
    - `deleteMyCommands` / `setMyCommands` 起動呼び出しと `sendChatAction` 入力中呼び出しは境界付けられており、リクエストタイムアウト時に Telegram のトランスポートフォールバックを介して 1 回再試行されます。永続的なネットワーク/fetch エラーは通常、`api.telegram.org` への DNS/HTTPS 到達性の問題を示します

  </Accordion>

  <Accordion title="起動時に未承認トークンが報告される">

    - `getMe returned 401` は、設定されたボットトークンに対する Telegram 認証失敗です。
    - BotFather でボットトークンを再コピーまたは再生成し、その後デフォルトアカウント用の `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken`、または `TELEGRAM_BOT_TOKEN` を更新します。
    - 起動中の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「Webhook が存在しない」と扱うと、同じ不正なトークンによる失敗を後続の API 呼び出しまで先送りするだけです。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - Node 22+ とカスタム fetch/プロキシの組み合わせでは、AbortSignal 型が一致しない場合に即時中止動作が発生することがあります。
    - 一部のホストは `api.telegram.org` を最初に IPv6 に解決します。壊れた IPv6 送信は断続的な Telegram API 失敗を引き起こす可能性があります。
    - ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれる場合、OpenClaw はこれらを回復可能なネットワークエラーとして再試行するようになりました。
    - ポーリング起動中、OpenClaw は grammY 用に成功した起動時の `getMe` 調査を再利用するため、ランナーは最初の `getUpdates` の前に 2 回目の `getMe` を必要としません。
    - ポーリング起動中に一時的なネットワークエラーで `deleteWebhook` が失敗した場合、OpenClaw は別のポーリング前コントロールプレーン呼び出しを行わずにロングポーリングに進みます。まだアクティブな Webhook は `getUpdates` の競合として表面化します。その後、OpenClaw は Telegram トランスポートを再構築し、Webhook クリーンアップを再試行します。
    - Telegram ソケットが短い固定間隔で再利用される場合は、低い `channels.telegram.timeoutSeconds` がないか確認してください。ボットクライアントは設定値を送信および `getUpdates` リクエストガードより低くクランプしますが、古いリリースではこれがそれらのガードを下回る値に設定されていると、すべてのポーリングまたは返信が中止されることがありました。
    - ログに `Polling stall detected` が含まれる場合、OpenClaw はデフォルトで、完了したロングポーリングのライブネスが 120 秒間ないとポーリングを再起動し、Telegram トランスポートを再構築します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中のポーリングアカウントが起動猶予後に `getUpdates` を完了していない場合、実行中の Webhook アカウントが起動猶予後に `setWebhook` を完了していない場合、または最後に成功したポーリングトランスポートアクティビティが古くなっている場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しは正常だが、ホストがなお誤ったポーリング停止再起動を報告する場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。永続的な停止は通常、ホストと `api.telegram.org` の間のプロキシ、DNS、IPv6、または TLS 送信の問題を示します。
    - Telegram は Bot API トランスポートについて、`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、およびそれらの小文字バリアントを含むプロセスプロキシ環境変数も尊重します。`NO_PROXY` / `no_proxy` は引き続き `api.telegram.org` をバイパスできます。
    - OpenClaw 管理プロキシがサービス環境用に `OPENCLAW_PROXY_URL` で設定されており、標準プロキシ環境変数が存在しない場合、Telegram も Bot API トランスポートにその URL を使用します。
    - 直接送信/TLS が不安定な VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由でルーティングします。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ は（WSL2 を除き）デフォルトで `autoSelectFamily=true` です。Telegram DNS 結果の順序は、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、次に `channels.telegram.network.dnsResultOrder`、次に `NODE_OPTIONS=--dns-result-order=ipv4first` などのプロセスデフォルトに従います。いずれも適用されない場合、Node 22+ は `ipv4first` にフォールバックします。
    - ホストが WSL2 である場合、または IPv4 のみの動作のほうが明示的にうまく機能する場合は、ファミリー選択を強制します。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、既定で Telegram メディアダウンロードにすでに許可されています。信頼できる fake-IP または
      透過プロキシが、メディアダウンロード中に `api.telegram.org` を別の
      プライベート/内部/特殊用途アドレスへ書き換える場合は、Telegram 専用のバイパスにオプトインできます。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインは、アカウントごとに
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` でも利用できます。
    - プロキシが Telegram メディアホストを `198.18.x.x` に解決する場合は、まず
      危険なフラグをオフのままにしてください。Telegram メディアは既定で RFC 2544
      ベンチマーク範囲をすでに許可しています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram
      メディアの SSRF 保護を弱めます。Clash、Mihomo、Surge の fake-IP ルーティングのように、
      RFC 2544 ベンチマーク範囲外のプライベートまたは特殊用途の応答を合成する、
      信頼できる運用者管理のプロキシ環境でのみ使用してください。
      通常の公開インターネット経由の Telegram アクセスではオフのままにしてください。
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

- 起動/認証: `enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` は通常ファイルを指す必要があります。シンボリックリンクは拒否されます）
- アクセス制御: `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、トップレベルの `bindings[]`（`type: "acp"`）
- トピックの既定値: `groups.<chatId>.topics."*"` は一致しないフォーラムトピックに適用されます。正確なトピック ID がこれを上書きします
- 実行承認: `execApprovals`、`accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`、`commands.nativeSkills`、`customCommands`
- スレッド/返信: `replyToMode`
- ストリーミング: `streaming`（プレビュー）、`streaming.preview.toolProgress`、`blockStreaming`
- 書式設定/配信: `textChunkLimit`、`chunkMode`、`richMessages`、`linkPreview`、`responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- カスタム API ルート: `apiRoot`（Bot API ルートのみ。`/bot<TOKEN>` は含めないでください）
- Webhook: `webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- アクション/ケイパビリティ: `capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- リアクション: `reactionNotifications`、`reactionLevel`
- エラー: `errorPolicy`、`errorCooldownMs`
- 書き込み/履歴: `configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
複数アカウントの優先順位: 2 つ以上のアカウント ID が設定されている場合は、`channels.telegram.defaultAccount` を設定する（または `channels.telegram.accounts.default` を含める）ことで、既定のルーティングを明示してください。そうしない場合、OpenClaw は最初に正規化されたアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
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
    脅威モデルと堅牢化。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントに対応付けます。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断。
  </Card>
</CardGroup>
