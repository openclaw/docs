---
read_when:
    - Telegram機能またはWebhookに取り組む
summary: Telegram bot のサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-07-05T11:06:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5610b1cb8404da02ce1983ca05ff1b8dbd2e13b25eebc2a8bbc09e29d621151a
    source_path: channels/telegram.md
    workflow: 16
---

grammY により、ボットの DM とグループで本番運用可能です。デフォルトのトランスポートはロングポーリングで、Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルト DM ポリシーはペアリングです。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブックです。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/ja-JP/gateway/configuration">
    チャンネル設定の完全なパターンと例です。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="Create the bot token in BotFather">
    Telegram を開き、**@BotFather** とチャットし（ハンドルが正確に `@BotFather` であることを確認）、`/newbot` を実行して、プロンプトに従い、トークンを保存します。
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

    Env フォールバック: `TELEGRAM_BOT_TOKEN`（デフォルトアカウントのみ。名前付きアカウントは `botToken` または `tokenFile` を使用する必要があります）。
    Telegram は `openclaw channels login telegram` を使用**しません**。config/env にトークンを設定してから、gateway を起動します。

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
    ボットをグループに追加し、グループアクセスに必要な 2 つの ID を取得します。

    - `allowFrom` / `groupAllowFrom` 用の Telegram ユーザー ID
    - `channels.telegram.groups` 配下のキーとして使う Telegram グループチャット ID

    グループチャット ID は、`openclaw logs --follow`、転送 ID ボット、または Bot API `getUpdates` から取得します。グループが許可された後、`/whoami@<bot_username>` でユーザー ID とグループ ID を確認できます。

    `-100` で始まる負のスーパーグループ ID はグループチャット ID です。これらは `groupAllowFrom` ではなく `channels.telegram.groups` 配下に置きます。

  </Step>
</Steps>

<Note>
トークン解決はアカウント対応です。`tokenFile` が `botToken` より優先され、`botToken` が env より優先されます。また config は常に `TELEGRAM_BOT_TOKEN` より優先されます（これはデフォルトアカウントでのみ解決されます）。起動に成功すると、OpenClaw はボット ID を最大 24 時間キャッシュするため、再起動時に余分な `getMe` 呼び出しをスキップできます。トークンを変更または削除すると、そのキャッシュはクリアされます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Telegram ボットはデフォルトで **Privacy Mode** になっており、グループ内で受信できるメッセージが制限されます。

    すべてのグループメッセージを見るには、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする
    - ボットをグループ管理者にする

    プライバシーモードを切り替えた後、Telegram に変更を適用させるため、各グループでボットを削除して再追加します。

  </Accordion>

  <Accordion title="Group permissions">
    管理者ステータスは Telegram グループ設定で制御されます。管理者ボットはすべてのグループメッセージを受信するため、常時有効なグループ動作に役立ちます。
  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` — グループ追加を許可/拒否する
    - `/setprivacy` — グループ可視性の動作

  </Accordion>
</AccordionGroup>

## アクセス制御と有効化

### グループボット ID

グループとフォーラムトピックでは、設定済みボットハンドル（例: `@my_bot`）への明示的なメンションが、選択された OpenClaw エージェントに宛てられます。これは、エージェントのペルソナ名が Telegram ユーザー名と異なる場合でも同じです。無関係なトラフィックにはグループの沈黙ポリシーが引き続き適用されますが、ボットハンドル自体が「別の誰か」になることはありません。

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` はダイレクトメッセージアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    `dmPolicy: "open"` と `allowFrom: ["*"]` を組み合わせると、ボットのユーザー名を見つけた、または推測した任意の Telegram アカウントがボットにコマンドを送れるようになります。厳しく制限されたツールを持つ、意図的に公開されたボットにのみ使用してください。単一オーナーのボットでは、数値ユーザー ID を指定した `allowlist` を使用するべきです。

    `channels.telegram.allowFrom` は数値の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` プレフィックスは受け付けられ、正規化されます。
    マルチアカウント config では、制限的なトップレベルの `channels.telegram.allowFrom` が安全境界になります。アカウントレベルの `allowFrom: ["*"]` は、マージ後の有効な許可リストに明示的なワイルドカードがまだ含まれていない限り、そのアカウントを公開しません。
    `dmPolicy: "allowlist"` で `allowFrom` が空の場合、すべての DM がブロックされ、config 検証で拒否されます。
    セットアップでは数値ユーザー ID のみを求めます。古いセットアップからの `@username` 許可リストエントリが config にある場合は、`openclaw doctor --fix` を実行して数値 ID に解決します（ベストエフォート。Telegram ボットトークンが必要です）。
    以前にペアリングストアの許可リストファイルに依存していた場合、`openclaw doctor --fix` は許可リストフロー用にエントリを `channels.telegram.allowFrom` に復旧できます（例: `dmPolicy: "allowlist"` に明示的な ID がまだない場合）。

    単一オーナーのボットでは、以前のペアリング承認に依存するよりも、明示的な数値 `allowFrom` ID を指定した `dmPolicy: "allowlist"` を推奨します。

    よくある混同: DM ペアリング承認は「この送信者はどこでも認可されている」という意味ではありません。ペアリングが付与するのは DM アクセスだけです。コマンドオーナーがまだ存在しない場合、最初に承認されたペアリングは `commands.ownerAllowFrom` も設定し、オーナー専用コマンドと exec 承認に明示的なオペレーターアカウントを与えます。グループ送信者の認可は、引き続き明示的な config 許可リストから来ます。
    1 つの ID で DM とグループコマンドの両方に認可されるには、数値の Telegram ユーザー ID を `channels.telegram.allowFrom` に入れ、オーナー専用コマンドについては `commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認します。

    ### Telegram ユーザー ID を見つける

    より安全（サードパーティボットなし）: 自分のボットに DM し、`openclaw logs --follow` を実行して、`from.id` を読みます。

    公式 Bot API メソッド:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティ（プライバシーは低め）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="Group policy and allowlists">
    2 つの制御が一緒に適用されます。

    1. **どのグループを許可するか**（`channels.telegram.groups`）
       - `groups` config なし、`groupPolicy: "open"`: 任意のグループがグループ ID チェックを通過します
       - `groups` config なし、`groupPolicy: "allowlist"`（デフォルト）: `groups` エントリ（または `"*"`）を追加するまで、すべてのグループがブロックされます
       - `groups` 設定済み: 許可リストとして動作します（明示的な ID または `"*"`）

    2. **グループ内でどの送信者を許可するか**（`channels.telegram.groupPolicy`）
       - `open` / `allowlist`（デフォルト）/ `disabled`

    `groupAllowFrom` はグループ送信者をフィルターします。未設定の場合、Telegram は `allowFrom` にフォールバックします（ペアリングストアではありません。グループ送信者認証は DM ペアリングストアの承認を継承しない、`2026.2.25` 以降の安全境界です）。
    `groupAllowFrom` エントリは数値の Telegram ユーザー ID にする必要があります（`telegram:` / `tg:` プレフィックスは正規化されます）。数値でないエントリは無視されます。ここにグループまたはスーパーグループのチャット ID を入れないでください。負のチャット ID は `channels.telegram.groups` 配下に属します。
    単一オーナーのボットでの実用的なパターン: 自分のユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにし、対象グループを `channels.telegram.groups` 配下で許可します。
    config に `channels.telegram` が完全に存在しない場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、runtime は fail-closed の `groupPolicy="allowlist"` をデフォルトにします。

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

    グループから `@<bot_username> ping` でテストします。`requireMention: true` の間、通常のグループメッセージはボットをトリガーしません。

    1 つの特定グループで任意のメンバーを許可する:

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

    1 つの特定グループ内で特定のユーザーのみを許可する:

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
      よくある間違い: `groupAllowFrom` はグループ許可リストではありません。

      - 負の Telegram グループ/スーパーグループチャット ID（`-1001234567890`）は `channels.telegram.groups` 配下に置きます。
      - Telegram ユーザー ID（`8734062810`）は、許可されたグループ内のどの人がボットをトリガーできるかを制限するために `groupAllowFrom` 配下に置きます。
      - `groupAllowFrom: ["*"]` は、許可されたグループの任意のメンバーがボットに話しかけられるようにする場合にのみ使用します。

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    グループ返信ではデフォルトでメンションが必要です。メンションは次から発生します。

    - ネイティブの `@botusername` メンション
    - `agents.list[].groupChat.mentionPatterns` または `messages.groupChat.mentionPatterns` のメンションパターン

    セッションレベルの切り替え（state のみ、永続化なし）: `/activation always`、`/activation mention`。永続化には config を使用します。

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

    グループ履歴コンテキストは常に有効で、`historyLimit` によって制限されます。グループ履歴ウィンドウを無効にするには `channels.telegram.historyLimit: 0` を設定します。`openclaw doctor --fix` は廃止された `includeGroupHistoryContext` キーを削除します。

    グループチャット ID の取得: グループメッセージを `@userinfobot` / `@getidsbot` に転送する、`openclaw logs --follow` から `chat.id` を読む、Bot API `getUpdates` を確認する、または（グループが許可された後に）`/whoami@<bot_username>` を実行します。

  </Tab>
</Tabs>

## Runtime の動作

- Telegram は gateway プロセス内で実行されます。
- ルーティングは決定的です。Telegram からの inbound は Telegram に返信されます（モデルがチャンネルを選ぶことはありません）。
- Inbound メッセージは、返信メタデータ、メディアプレースホルダー、gateway が観測した返信の永続化済み返信チェーンコンテキストを含む共有チャンネルエンベロープに正規化されます。
- グループセッションはグループ ID ごとに分離されます。フォーラムトピックでは `:topic:<threadId>` が追加されます。
- DM メッセージは `message_thread_id` を持つことができます。OpenClaw は返信用にそれを保持します。DM トピックセッションは、Telegram `getMe` がボットについて `has_topics_enabled: true` を報告した場合にのみ分割されます。それ以外の DM はフラットなセッションのままです。
- ロングポーリングは、チャットごと/スレッドごとのシーケンス制御を伴う grammY runner を使用します。Runner sink の並行性は `agents.defaults.maxConcurrent` を使用します。
- マルチアカウント起動では、同時 `getMe` プローブを制限し、大規模なボット群がすべてのアカウントプローブを一度に展開しないようにします。
- 各 gateway プロセスはロングポーリングを保護し、1 つのボットトークンを同時に使用できるアクティブな poller が 1 つだけになるようにします。永続的な `getUpdates` 409 競合は、同じトークンを使用している別の OpenClaw gateway、スクリプト、または外部 poller を示します。
- polling watchdog は、デフォルトで完了した `getUpdates` liveness が 120 秒間ないと再起動します。長時間実行される作業中に誤った polling-stall 再起動が発生するデプロイメントでのみ、`channels.telegram.pollingStallThresholdMs`（30000-600000、アカウントごとの上書きに対応）を引き上げてください。
- Telegram Bot API には既読通知サポートがありません（`sendReadReceipts` は適用されません）。

<Note>
  `channels.telegram.dm.threadReplies` と `channels.telegram.direct.<chatId>.threadReplies` は削除されました。アップグレード後も config にそれらのキーがある場合は、`openclaw doctor --fix` を実行してください。DM トピックルーティングは現在、Telegram `getMe.has_topics_enabled`（BotFather のスレッドモードで制御）に従います。トピック有効化済みボットは、Telegram が `message_thread_id` を送信した場合にスレッドスコープの DM セッションを使用します。それ以外の DM はフラットなセッションのままです。
</Note>

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は、ダイレクトチャット、グループ、トピックで部分返信をリアルタイムにストリーミングします。プレビューメッセージを送信し、その後 `editMessageText` を繰り返し呼び出して、その場で確定します。

    - `channels.telegram.streaming` は `off | partial | block | progress` です（デフォルト: `partial`）
    - 短い初期回答プレビューはデバウンスされ、実行がまだアクティブな場合は、上限付きの遅延後に実体化されます
    - `progress` はツール進行状況用に編集可能なステータス下書きを 1 つ保持し、ツール進行状況より先に回答アクティビティが届いた場合は安定したステータスラベルを表示し、完了時にそれをクリアして、最終回答を通常のメッセージとして送信します
    - `streaming.preview.toolProgress` は、ツール/進行状況の更新で同じ編集済みプレビューメッセージを再利用するかどうかを制御します（デフォルト: プレビューストリーミングがアクティブな場合は `true`）
    - `streaming.preview.commandText` は、それらの行内のコマンド/実行詳細を制御します: `raw`（デフォルト）または `status`（ツールラベルのみ）
    - `streaming.progress.commentary`（デフォルト: `false`）は、一時的な進行状況下書きでアシスタントのコメンタリー/前置きテキストを有効にします
    - レガシーの `channels.telegram.streamMode`、ブール値の `streaming` 値、廃止されたネイティブ下書きプレビューキーは検出されます。移行するには `openclaw doctor --fix` を実行してください

    ツール進行状況の行は、ツール実行中に表示される短いステータス更新です（コマンド実行、ファイル読み取り、計画更新、パッチ要約、app-server モードでの Codex の前置き/コメンタリー）。Telegram では、これらはデフォルトでオンのままです（`v2026.4.22`+ からのリリース済み動作と一致）。

    回答プレビュー編集を維持しつつ、ツール進行状況の行を非表示にする:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    ツール進行状況は表示したまま、コマンド/実行テキストを非表示にする:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    `progress` モードは、そのメッセージに最終回答を編集して入れずにツール進行状況を表示します。コマンドテキストポリシーは `streaming.progress` の下に置きます:

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

    `streaming.mode: "off"` は、プレビュー編集を無効化し、汎用的なツール/進行状況の雑多な通知を単独のステータスメッセージとして送信せずに抑制します。承認プロンプト、メディア、エラーは引き続き通常の最終配信を通ります。`streaming.preview.toolProgress: false` は回答プレビュー編集のみを維持します。

    <Note>
      選択引用返信は例外です。`replyToMode` が `first`、`all`、または `batched` で、受信メッセージに選択された引用テキストがある場合、OpenClaw は回答プレビューを編集する代わりに Telegram のネイティブ引用返信パスで最終回答を送信するため、そのターンでは `streaming.preview.toolProgress` でステータス行を表示できません。選択引用テキストのない現在メッセージへの返信は引き続きストリーミングされます。ツール進行状況の可視性がネイティブ引用返信より重要な場合は `replyToMode: "off"` を設定するか、そのトレードオフを受け入れる場合は `streaming.preview.toolProgress: false` を設定してください。
    </Note>

    テキストのみの返信の場合: 短いプレビューはその場で最終編集されます。複数メッセージに分割される長い最終回答では、プレビューを最初のチャンクとして再利用し、残りだけを送信します。progress モードの最終回答はステータス下書きをクリアし、通常の最終配信を使います。完了が確認される前に最終編集が失敗した場合、OpenClaw は通常の最終配信にフォールバックし、古いプレビューをクリーンアップします。複雑な返信（メディアペイロード）の場合、OpenClaw は常に通常の最終配信にフォールバックし、プレビューをクリーンアップします。

    プレビューストリーミングとブロックストリーミングは相互排他的です。ブロックストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

    推論: `/reasoning stream` は生成中に推論をライブプレビューへストリーミングし、最終配信後に推論プレビューを削除します（表示したままにするには `/reasoning on` を使用）。最終回答は推論テキストなしで送信されます。

  </Accordion>

  <Accordion title="リッチメッセージ書式">
    送信テキストはデフォルトで標準の Telegram HTML メッセージを使用し、現在のクライアント全体で読みやすく表示されます: 太字、斜体、リンク、コード、スポイラー、引用です。Bot API 10.1 のリッチ専用ブロック（ネイティブテーブル、details、リッチメディア、数式）ではありません。

    Bot API 10.1 リッチメッセージを有効にする:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    有効時: エージェントには、このボット/アカウントでリッチメッセージが利用可能であることが伝えられます。Markdown テキストは OpenClaw の Markdown IR を通じて Telegram リッチ HTML としてレンダリングされます。明示的なリッチ HTML ペイロードは、対応する Bot API 10.1 タグ（見出し、テーブル、details、リッチメディア、数式）を保持します。メディアキャプションは引き続き Telegram HTML キャプションを使用します（リッチメッセージはキャプションを置き換えず、キャプションは 1024 文字が上限です）。

    これにより、モデルテキストを Telegram のリッチ Markdown 記号から遠ざけるため、`$400-600K` のような通貨が数式として解析されません。長いリッチテキストは Telegram の制限に合わせて自動的に分割されます。20 列の制限を超えるテーブルはコードブロックにフォールバックします。

    デフォルト: オフ。クライアント互換性のためです。一部の現在の Desktop、Web、Android、およびサードパーティクライアントでは、受理されたリッチメッセージが未対応として表示されます。ボットで使用するすべてのクライアントがそれらをレンダリングできる場合を除き、オフのままにしてください。`/status` は現在のセッションでリッチメッセージがオンかオフかを表示します。

    リンクプレビューはデフォルトでオンです。`channels.telegram.linkPreview: false` は、リッチテキストの自動エンティティ検出を無効にします。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram のコマンドメニューは起動時に `setMyCommands` で登録されます。`commands.native: "auto"` は Telegram のネイティブコマンドを有効にします。

    カスタムコマンドメニュー項目を追加する:

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

    ルール: 名前は正規化されます（先頭の `/` を取り除き、小文字化）。有効なパターンは `a-z`、`0-9`、`_`、長さ 1-32 です。カスタムコマンドはネイティブコマンドを上書きできません。競合/重複はスキップされ、ログに記録されます。

    カスタムコマンドはメニュー項目のみです。動作を自動実装しません。Plugin/skill コマンドは、Telegram メニューに表示されていなくても、入力されれば引き続き動作できます。ネイティブコマンドが無効な場合、組み込みは削除されます。カスタム/プラグインコマンドは、設定されていれば引き続き登録される場合があります。

    よくあるセットアップ失敗:

    - トリム再試行後に `setMyCommands failed` と `BOT_COMMANDS_TOO_MUCH` が出る場合、メニューがまだあふれていることを意味します。プラグイン/skill/カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - Bot API の直接 curl コマンドは動作するのに、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合、通常は `channels.telegram.apiRoot` が完全な `/bot<TOKEN>` エンドポイントに設定されていたことを意味します。`apiRoot` は Bot API ルートのみでなければなりません。`openclaw doctor --fix` は誤って末尾に付いた `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、Telegram が設定済みボットトークンを拒否したことを意味します。`botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN`（デフォルトアカウント）を現在の BotFather トークンで更新してください。OpenClaw はポーリング前に停止するため、これは Webhook クリーンアップ失敗として報告されません。
    - ネットワーク/fetch エラーで `setMyCommands failed` が出る場合、通常は `api.telegram.org` へのアウトバウンド DNS/HTTPS がブロックされていることを意味します。

    ### デバイスペアリングコマンド（`device-pair` プラグイン）

    インストールされている場合:

    1. `/pair` はセットアップコードを生成します
    2. iOS アプリにコードを貼り付けます
    3. `/pair pending` は保留中のリクエスト（role/scopes を含む）を一覧表示します
    4. 承認: `/pair approve <requestId>`、`/pair approve`（保留中リクエストが 1 つだけの場合）、または `/pair approve latest`

    デバイスが変更された認証詳細（role、scopes、公開鍵）で再試行すると、以前の保留中リクエストは新しい `requestId` で置き換えられます。承認前に `/pair pending` を再実行してください。

    詳細: [ペアリング](/ja-JP/channels/pairing#pair-via-telegram)。

  </Accordion>

  <Accordion title="インラインボタン">
    インラインキーボードのスコープを設定する:

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

    スコープ: `off`、`dm`、`group`、`all`、`allowlist`（デフォルト）。レガシーの `capabilities: ["inlineButtons"]` は `"all"` にマップされます。

    メッセージアクション例:

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

    Mini App ボタン例:

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

    `web_app` ボタンは、ユーザーとボット間のプライベートチャットでのみ動作します。

    登録済みプラグインのインタラクティブハンドラーに要求されなかったコールバッククリックは、テキストとしてエージェントに渡されます: `callback_data: <value>`。

  </Accordion>

  <Accordion title="エージェントと自動化のための Telegram メッセージアクション">
    アクション:

    - `sendMessage`（`to`、`content`、任意の `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` または `caption`、任意の `presentation` インラインボタン。ボタンのみの編集は返信マークアップを更新します）
    - `createForumTopic`（`chatId`、`name`、任意の `iconColor`、`iconCustomEmojiId`）

    使いやすいエイリアス: `send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`。

    ゲーティング: `channels.telegram.actions.sendMessage`、`deleteMessage`、`reactions`、`sticker`（デフォルト: 無効）。`edit`、`createForumTopic`、および `editForumTopic` は専用トグルなしでデフォルト有効です。
    ランタイム送信は起動/リロード時点のアクティブな設定/シークレットスナップショットを使用するため、アクションパスは送信ごとに `SecretRef` 値を再解決しません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)。

  </Accordion>

  <Accordion title="返信スレッドタグ">
    生成出力内の明示的な返信スレッドタグ:

    - `[[reply_to_current]]` — トリガー元メッセージに返信します
    - `[[reply_to:<id>]]` — 特定のメッセージ ID に返信します

    `channels.telegram.replyToMode`: `off`（デフォルト）、`first`、`all`。

    返信スレッドが有効で、元のテキスト/キャプションが利用可能な場合、OpenClaw はネイティブ引用抜粋を自動的に追加します。Telegram はネイティブ引用テキストを 1024 UTF-16 コード単位に制限します。より長いメッセージは先頭から引用され、Telegram が引用を拒否した場合はプレーンな返信にフォールバックします。

    `off` は暗黙的な返信スレッドのみを無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッド動作">
    フォーラムスーパーグループ: トピックセッションキーは `:topic:<threadId>` を追加します。返信と入力中表示はトピックスレッドを対象にします。トピック設定パスは `channels.telegram.groups.<chatId>.topics.<threadId>` です。

    一般トピック (`threadId=1`) は特殊ケースです。メッセージ送信では `message_thread_id` を省略します (Telegram は `sendMessage(...thread_id=1)` を「thread not found」で拒否します) が、入力中アクションには引き続き `message_thread_id` を含めます (入力インジケーターを表示するために経験的に必要です)。

    トピックエントリは、上書きされない限りグループ設定を継承します (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)。`agentId` はトピック専用で、グループのデフォルトからは継承されません。`topics."*"` はそのグループ内のすべてのトピックのデフォルトを設定しますが、正確なトピック ID は引き続き `"*"` より優先されます。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック設定の `agentId` を介して別々のエージェントにルーティングでき、それぞれ独自のワークスペース、メモリ、セッションを持てます。

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic -> main agent
                "3": { agentId: "zu" },        // Dev topic -> zu agent
                "5": { agentId: "coder" }      // Code review -> coder agent
              }
            }
          }
        }
      }
    }
    ```

    その後、各トピックには独自のセッションキーがあります。例: `agent:zu:telegram:group:-1001234567890:topic:3`。

    **永続的な ACP トピックバインディング**: フォーラムトピックは、トップレベルの型付きバインディング (`bindings[]`、`type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾 ID) を通じて ACP ハーネスセッションをピン留めできます。現在はグループ/スーパーグループ内のフォーラムトピックにスコープされています。[ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

    **チャットからのスレッド紐付け ACP spawn**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しい ACP セッションにバインドします。後続メッセージはそこへ直接ルーティングされ、OpenClaw は spawn 確認をトピック内にピン留めします。`channels.telegram.threadBindings.spawnSessions` が必要です (デフォルト: `true`)。

    テンプレートコンテキストは `MessageThreadId` と `IsForum` を公開します。`message_thread_id` を持つ DM チャットは返信メタデータを保持しますが、Telegram `getMe` が `has_topics_enabled: true` を報告する場合にのみ、スレッド対応のセッションキーを使用します。
    廃止された `dm.threadReplies` と `direct.*.threadReplies` の上書きは削除されました。BotFather のスレッドモードが単一の信頼できる情報源です。古い設定キーを削除するには `openclaw doctor --fix` を実行してください。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram はボイスメモと音声ファイルを区別します。デフォルト: 音声ファイルの動作です。エージェント返信内で `[[audio_as_voice]]` をタグ付けすると、ボイスメモ送信を強制できます。受信したボイスメモの文字起こしは、エージェントコンテキスト内で機械生成の信頼されないテキストとして扱われますが、メンション検出は引き続き生の文字起こしを使用するため、メンション制限付きボイスメッセージは動作し続けます。

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

    Telegram は動画ファイルとビデオノートを区別します。ビデオノートはキャプションをサポートしません。指定されたメッセージテキストは別送信されます。

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### ステッカー

    受信: 静的 WEBP はダウンロードされ処理されます (プレースホルダー `<media:sticker>`)。アニメーション TGS と動画 WEBM はスキップされます。

    ステッカーコンテキストフィールド: `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`。説明は、繰り返しの vision 呼び出しを減らすため、OpenClaw SQLite Plugin 状態にキャッシュされます。

    ステッカーアクションを有効化します。

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

    送信:

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
    Telegram のリアクションは、メッセージペイロードとは別の `message_reaction` 更新として届きます。有効な場合、OpenClaw は `Telegram reaction added: 👍 by Alice (@alice) on msg 42` のようなシステムイベントをキューに入れます。

    - `channels.telegram.reactionNotifications`: `off | own | all` (デフォルト: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (デフォルト: `minimal`)

    `own` は、ボットが送信したメッセージに対するユーザーリアクションのみを意味します (送信済みメッセージキャッシュを使ったベストエフォート)。リアクションイベントは引き続き Telegram アクセス制御 (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) に従い、未許可の送信者は破棄されます。

    Telegram はリアクション更新でスレッド ID を提供しません。非フォーラムグループはグループチャットセッションへルーティングされます。フォーラムグループは正確な発生元トピックではなく、一般トピックセッション (`:topic:1`) へルーティングされます。

    ポーリング/Webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認絵文字を送信します。`messages.ackReactionScope` はそれが *いつ* 送信されるかを決定します。

    **絵文字の解決順序:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェント ID 絵文字フォールバック (`agents.list[].identity.emoji`、なければ "👀")

    Telegram は Unicode 絵文字 (例: "👀") を期待します。チャネルまたはアカウントのリアクションを無効化するには `""` を使用してください。

    **スコープ (`messages.ackReactionScope`、デフォルト `"group-mentions"`。現在、Telegram アカウントまたは Telegram チャネルの上書きはありません):**

    `all` (DM + グループ)、`direct` (DM のみ)、`group-all` (すべてのグループメッセージ、DM なし)、`group-mentions` (ボットがメンションされたグループ。**DM なし** — デフォルト)、`off` / `none` (無効)。

    <Note>
    デフォルトスコープ (`group-mentions`) は DM で ack リアクションを発火しません。その用途には `messages.ackReactionScope` を `direct` または `all` に設定してください。この値は Telegram プロバイダー起動時に読み込まれるため、変更を反映するには gateway の再起動が必要です。
    </Note>

  </Accordion>

  <Accordion title="Telegram イベントとコマンドからの設定書き込み">
    チャネル設定の書き込みはデフォルトで有効です (`configWrites !== false`)。Telegram をトリガーとする書き込みには、グループ移行イベント (`migrate_to_chat_id`、`channels.telegram.groups` を更新) と `/config set` / `/config unset` (コマンドの有効化が必要) が含まれます。

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
    デフォルトはロングポーリングです。Webhook モードでは、`channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。任意で `webhookPath` (デフォルト `/telegram-webhook`)、`webhookHost` (デフォルト `127.0.0.1`)、`webhookPort` (デフォルト `8787`)、`webhookCertPath` (直接 IP またはドメインなし構成用の自己署名証明書 PEM) を設定できます。

    ロングポーリングモードでは、OpenClaw は更新のディスパッチが成功した後にのみ再起動ウォーターマークを永続化します。失敗したハンドラーは、その更新を完了済みとしてマークする代わりに、同じプロセス内で再試行可能なままにします。

    ローカルリスナーはデフォルトで `127.0.0.1:8787` にバインドします。公開インバウンドには、ローカルポートの前段にリバースプロキシを置くか、意図的に `webhookHost: "0.0.0.0"` を設定してください。

    Webhook モードは、`200` を返す前にリクエストガード、Telegram シークレットトークン、JSON 本文を検証します。その後 OpenClaw は、ロングポーリングで使われるものと同じチャットごと/トピックごとのボットレーンを通じて更新を非同期処理するため、遅いエージェントターンが Telegram の配信 ACK を保持しません。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。`chunkMode="newline"` は長さで分割する前に段落境界 (空行) を優先します。
    - `channels.telegram.mediaMaxMb` (デフォルト 100) は受信および送信メディアサイズを制限します。
    - `channels.telegram.mediaGroupFlushMs` (デフォルト 500、範囲 10-60000) は、OpenClaw がアルバム/メディアグループを 1 つの受信メッセージとしてディスパッチする前にバッファリングする時間を制御します。アルバムの一部が遅れて届く場合は増やし、アルバム返信のレイテンシを下げるには減らしてください。
    - `channels.telegram.timeoutSeconds` は API クライアントのタイムアウトを上書きします (未設定の場合は grammY のデフォルトが適用されます)。ボットクライアントは、設定値を 60 秒の送信テキスト/入力中リクエストガード未満にクランプするため、OpenClaw のトランスポートガードとフォールバックが実行される前に grammY が可視返信の配信を中断しません。ロングポーリングは引き続き 45 秒の `getUpdates` リクエストガードを使用するため、アイドルポーリングが無期限に放置されることはありません。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは 120000 です。誤検知のポーリング停止再起動に対してのみ、30000 から 600000 の間で調整してください。
    - グループコンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit` (デフォルト 50) を使用します。`0` で無効化します。
    - 返信/引用/転送の補足コンテキストは、gateway が親メッセージを観測している場合、選択された 1 つの会話コンテキストウィンドウへ正規化されます。観測済みメッセージキャッシュは OpenClaw SQLite Plugin 状態にあり、`openclaw doctor --fix` はレガシーサイドカーをインポートします。Telegram は更新ごとに浅い `reply_to_message` を 1 つだけ含めるため、キャッシュより古いチェーンはそのペイロードに制限されます。
    - Telegram allowlist は主に、誰がエージェントをトリガーできるかを制御するものであり、完全な補足コンテキスト編集境界ではありません。
    - DM 履歴: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`。
    - `channels.telegram.retry` は、回復可能な送信 API エラーに対する Telegram 送信ヘルパー (CLI/ツール/アクション) に適用されます。受信メッセージへの最終返信配信は、接続前の失敗に対して境界付きの安全送信再試行を使用しますが、可視メッセージを重複させる可能性のある、送信後の曖昧なネットワークエンベロープは再試行しません。

    CLI とメッセージツールの送信ターゲットは、数値チャット ID、ユーザー名、またはフォーラムトピックターゲットを受け付けます。

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Poll は `openclaw message poll` を使用し、フォーラムトピックをサポートします。

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 専用の poll フラグ: `--poll-duration-seconds` (5-600)、`--poll-anonymous`、`--poll-public`、`--thread-id` (または `:topic:` ターゲット)。`--poll-option` は 2-12 回繰り返します (Telegram のオプション上限)。

    Telegram 送信は、インラインキーボード用の `buttons` ブロックを含む `--presentation` (`channels.telegram.capabilities.inlineButtons` が許可する場合)、ボットがそのチャットでピン留めできる場合にピン留め配信をリクエストする `--pin` または `--delivery '{"pin":true}'`、送信画像、GIF、動画を圧縮/アニメーション/動画アップロードではなくドキュメントとして送信する `--force-document` もサポートします。

    アクションゲート: `channels.telegram.actions.sendMessage=false` は poll を含むすべての送信メッセージを無効化します。`channels.telegram.actions.poll=false` は通常の送信を有効のままにしつつ、poll 作成を無効化します。

  </Accordion>

  <Accordion title="Telegram での exec 承認">
    Telegram は承認者 DM で exec 承認をサポートし、任意で発生元チャットまたはトピックにプロンプトを投稿できます。承認者は数値の Telegram ユーザー ID である必要があります。

    - `channels.telegram.execApprovals.enabled` (`"auto"` は少なくとも 1 人の承認者を解決できる場合に有効化)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` から数値の所有者 ID にフォールバック)
    - `channels.telegram.execApprovals.target`: `dm` (デフォルト) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom`、`defaultTo` は、誰がボットと話せるか、通常の返信をどこに送るかを制御します。誰かを exec 承認者にするものではありません。コマンド所有者がまだ存在しない場合、最初に承認された DM ペアリングが `commands.ownerAllowFrom` をブートストラップするため、1 人所有者のセットアップでは `execApprovals.approvers` 配下に ID を重複して指定しなくても動作します。

    チャンネル配信ではコマンドテキストがチャットに表示されます。信頼済みのグループ/トピックでのみ `channel` または `both` を有効にしてください。プロンプトがフォーラムトピックに届いた場合、OpenClaw は承認プロンプトとフォローアップ用にそのトピックを保持します。exec 承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンでは、対象サーフェス（`dm`、`group`、または `all`）を許可するために `channels.telegram.capabilities.inlineButtons` も必要です。`plugin:` で始まる承認 ID は Plugin 承認を通じて解決され、それ以外はまず exec 承認を通じて解決されます。

    [exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信の制御

エージェントが配信エラーまたはプロバイダーエラーに遭遇した場合、エラーポリシーはエラーメッセージを Telegram チャットへ届けるかどうかを制御します。

| キー                                | 値                         | デフォルト      | 説明                                                                                                                                                                                                     |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` はすべてのエラーメッセージをチャットに送信します。`once` はクールダウン期間ごとに一意のエラーメッセージを 1 回だけ送信します（同一エラーの繰り返しを抑制します）。`silent` はエラーメッセージをチャットに送信しません。 |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | `once` ポリシーのクールダウン期間です。エラーが送信された後、同じメッセージはこの間隔が経過するまで抑制されます。障害中のエラースパムを防ぎます。                                                          |

アカウント単位、グループ単位、トピック単位のオーバーライドがサポートされています（他の Telegram 設定キーと同じ継承）。

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
  <Accordion title="メンションなしのグループメッセージにボットが応答しない">

    - `requireMention=false` の場合、Telegram プライバシーモードで完全な可視性を許可する必要があります。BotFather の `/setprivacy` -> Disable を実行し、その後ボットをグループから削除して再追加してください。
    - 設定がメンションなしのグループメッセージを想定している場合、`openclaw channels status` が警告します。
    - `openclaw channels status --probe` は明示的な数値グループ ID を確認します。ワイルドカード `"*"` はメンバーシッププローブできません。
    - 簡易セッションテスト: `/activation always`。

  </Accordion>

  <Accordion title="ボットがグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、そのグループが一覧に含まれている必要があります（または `"*"` を含めます）。
    - グループ内のボットメンバーシップを確認してください。
    - スキップ理由について `openclaw logs --follow` を確認してください。

  </Accordion>

  <Accordion title="コマンドが部分的にしか動作しない、またはまったく動作しない">

    - 送信者 ID を承認してください（ペアリングまたは数値の `allowFrom`、あるいはその両方）。グループポリシーが `open` の場合でも、コマンド認可は引き続き適用されます。
    - `BOT_COMMANDS_TOO_MUCH` による `setMyCommands failed` は、ネイティブメニューの項目が多すぎることを意味します。Plugin/skill/カスタムコマンドを減らすか、ネイティブメニューを無効にしてください。
    - 起動時の `deleteMyCommands` / `setMyCommands` 呼び出しと、入力中を示す `sendChatAction` 呼び出しは、リクエストタイムアウト時に制限付きで Telegram のトランスポートフォールバックを通じて 1 回再試行されます。永続的なネットワーク/フェッチエラーは通常、`api.telegram.org` への DNS/HTTPS が到達不能であることを意味します。

  </Accordion>

  <Accordion title="起動時に未認可トークンが報告される">

    - `getMe returned 401` は、設定されたボットトークンに対する Telegram 認証失敗です。BotFather でトークンを再コピーまたは再生成し、`channels.telegram.botToken`、`tokenFile`、`accounts.<id>.botToken`、または `TELEGRAM_BOT_TOKEN`（デフォルトアカウント）を更新してください。
    - 起動中の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「Webhook が存在しない」と扱っても、同じ不正なトークンによる失敗を後続の API 呼び出しへ先送りするだけです。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - カスタム fetch/proxy を使う Node 22+ では、`AbortSignal` 型が一致しない場合に即時 abort の挙動を引き起こすことがあります。
    - 一部のホストは `api.telegram.org` を IPv6 優先で解決します。壊れた IPv6 egress は断続的な API 失敗を引き起こします。
    - `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` を含むログは、復旧可能なネットワークエラーとして再試行されます。
    - ポーリング起動中、OpenClaw は成功した起動時の `getMe` プローブを grammY 用に再利用するため、ランナーは最初の `getUpdates` の前に 2 回目の `getMe` を必要としません。
    - ポーリング起動中に一時的なネットワークエラーで `deleteWebhook` が失敗した場合、OpenClaw は別のポーリング前コントロールプレーン呼び出しを行わず、ロングポーリングへ進みます。Webhook がまだ有効な場合は `getUpdates` の競合として表面化し、OpenClaw はトランスポートを再構築して Webhook クリーンアップを再試行します。
    - Telegram ソケットが短い固定周期で再生成される場合は、低い `channels.telegram.timeoutSeconds` を確認してください。ボットクライアントは送信リクエストガードと `getUpdates` リクエストガードを下回る設定値をクランプしますが、古いリリースではこの値がそれらのガードを下回ると、すべてのポーリングまたは返信が abort されることがありました。
    - ログ内の `Polling stall detected` は、デフォルトで完了したロングポールの liveness が 120 秒間ない場合に、OpenClaw がポーリングを再起動しトランスポートを再構築することを意味します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中のポーリングアカウントが起動猶予後に `getUpdates` を完了していない場合、実行中の Webhook アカウントが起動猶予後に `setWebhook` を完了していない場合、または最後に成功したポーリングトランスポート活動が古い場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しが正常でもホストが誤ったポーリング停止再起動を報告する場合にのみ、`channels.telegram.pollingStallThresholdMs` を引き上げてください。永続的な停止は通常、`api.telegram.org` への proxy、DNS、IPv6、または TLS egress の問題を示します。
    - Telegram は Bot API トランスポートでプロセスの proxy env を尊重します: `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、および小文字のバリアント。`NO_PROXY` / `no_proxy` は引き続き `api.telegram.org` をバイパスできます。
    - サービス環境で `OPENCLAW_PROXY_URL` が設定されており、標準の proxy env が存在しない場合、Telegram は Bot API トランスポートにもその URL を使用します。
    - 直接 egress/TLS が不安定な VPS ホストでは、Telegram API 呼び出しをプロキシ経由にしてください。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ はデフォルトで `autoSelectFamily=true` です（WSL2 を除く）。Telegram DNS 結果の順序は、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、次に `channels.telegram.network.dnsResultOrder`、次にプロセスのデフォルト（例: `NODE_OPTIONS=--dns-result-order=ipv4first`）を尊重し、どれも適用されない場合は Node 22+ で `ipv4first` にフォールバックします。
    - WSL2 の場合、または IPv4 のみの挙動の方が適している場合は、ファミリー選択を強制してください。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、Telegram メディアダウンロードでデフォルトですでに許可されています。信頼済みの fake-IP または透過プロキシが、メディアダウンロード中に `api.telegram.org` を別の private/internal/special-use アドレスへ書き換える場合は、Telegram 専用バイパスに明示的にオプトインしてください。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じオプトインは、`channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` でアカウントごとにも利用できます。
    - プロキシが Telegram メディアホストを `198.18.x.x` に解決する場合は、まず危険なフラグをオフのままにしてください。この範囲はデフォルトですでに許可されています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram メディアの SSRF 保護を弱めます。RFC 2544 ベンチマーク範囲外の private または special-use 応答を合成する、信頼済みのオペレーター管理プロキシ環境（Clash、Mihomo、Surge fake-IP ルーティング）でのみ使用してください。通常の公開インターネット経由の Telegram アクセスではオフのままにしてください。
    </Warning>

    - 一時的な環境オーバーライド: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`。
    - DNS 応答を検証します。

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

さらにヘルプ: [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主要リファレンス: [設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="シグナルの高い Telegram フィールド">

- 起動/認証: `enabled`、`botToken`、`tokenFile`（通常ファイルである必要があります。シンボリックリンクは拒否されます）、`accounts.*`
- アクセス制御: `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、トップレベルの `bindings[]`（`type: "acp"`）
- トピックのデフォルト: `groups.<chatId>.topics."*"` は一致しないフォーラムトピックに適用されます。正確なトピック ID はこれをオーバーライドします
- exec 承認: `execApprovals`、`accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`、`commands.nativeSkills`、`customCommands`
- スレッド/返信: `replyToMode`、`threadBindings`
- ストリーミング: `streaming`（モード `off | partial | block | progress`）、`streaming.preview.toolProgress`
- フォーマット/配信: `textChunkLimit`、`chunkMode`、`richMessages`、`markdown.tables`（`off | bullets | code | block`）、`linkPreview`、`responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- カスタム API ルート: `apiRoot`（Bot API ルートのみ。`/bot<TOKEN>` を含めないでください）、`trustedLocalFileRoots`（セルフホスト Bot API の絶対 `file_path` ルート）
- Webhook: `webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`、`webhookPort`、`webhookCertPath`
- アクション/機能: `capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- リアクション: `reactionNotifications`、`reactionLevel`
- エラー: `errorPolicy`、`errorCooldownMs`、`silentErrorReplies`
- 書き込み/履歴: `configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
マルチアカウントの優先順位: 2 つ以上のアカウント ID が設定されている場合は、デフォルトルーティングを明示するために `channels.telegram.defaultAccount` を設定してください（または `channels.telegram.accounts.default` を含めてください）。そうしない場合、OpenClaw は最初に正規化されたアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram ユーザーを Gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループとトピックの許可リスト挙動。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと強化。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    グループとトピックをエージェントにマップします。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断。
  </Card>
</CardGroup>
