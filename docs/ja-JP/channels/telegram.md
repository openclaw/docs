---
read_when:
    - Telegram の機能または Webhook に取り組む場合
summary: Telegram ボットのサポート状況、機能、設定
title: Telegram
x-i18n:
    generated_at: "2026-07-16T11:23:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51c155afeb147b92a55f181be269ce13c4fd6b609a94d680cd7e091cd4a7c236
    source_path: channels/telegram.md
    workflow: 16
---

本番環境で利用可能な、grammY によるボットの DM とグループ対応です。デフォルトのトランスポートはロングポーリングで、Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルトの DM ポリシーはペアリングです。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復手順です。
  </Card>
  <Card title="Gateway の設定" icon="settings" href="/ja-JP/gateway/configuration">
    チャンネル設定の完全なパターンと例です。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFather でボットトークンを作成する">
    どちらの方法でも、最後に OpenClaw へ貼り付けるトークンが得られます。いずれかを選択してください。

    - **チャットでの手順**: Telegram を開き、**@BotFather** とチャットし（ハンドルが正確に `@BotFather` であることを確認）、`/newbot` を実行して、案内に従いトークンを保存します。
    - **Web での手順**: [BotFather の Web アプリ](https://t.me/BotFather?startapp)を開きます。これは [web.telegram.org](https://web.telegram.org) を含むすべての Telegram クライアントで動作します。UI でボットを作成し、そのトークンをコピーします。

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

    環境変数によるフォールバック: `TELEGRAM_BOT_TOKEN`（デフォルトアカウントのみ。名前付きアカウントでは `botToken` または `tokenFile` を使用する必要があります）。
    Telegram は `openclaw channels login telegram` を使用しません。設定または環境変数にトークンを設定してから、Gateway を起動してください。

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
    ボットをグループに追加し、グループアクセスに必要な次の 2 つの ID を取得します。

    - `allowFrom` / `groupAllowFrom` に使用する Telegram ユーザー ID
    - `channels.telegram.groups` 配下のキーとして使用する Telegram グループチャット ID

    グループチャット ID は、`openclaw logs --follow`、転送されたメッセージの ID を取得するボット、または Bot API の `getUpdates` から取得します。グループを許可した後は、`/whoami@<bot_username>` でユーザー ID とグループ ID を確認できます。

    `-100` で始まる負のスーパーグループ ID は、グループチャット ID です。`groupAllowFrom` ではなく `channels.telegram.groups` 配下に指定します。

  </Step>
</Steps>

<Note>
トークンの解決ではアカウントが考慮されます。優先順位は `tokenFile`、`botToken`、環境変数の順で、設定は常に `TELEGRAM_BOT_TOKEN` より優先されます（後者はデフォルトアカウントでのみ解決されます）。正常に起動した後、OpenClaw はボットの ID を最大 24 時間キャッシュするため、再起動時に追加の `getMe` 呼び出しを省略できます。トークンを変更または削除すると、このキャッシュはクリアされます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループでの可視性">
    Telegram ボットではデフォルトで **Privacy Mode** が有効になっており、受信できるグループメッセージが制限されます。

    すべてのグループメッセージを受信するには、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする
    - ボットをグループ管理者にする

    プライバシーモードを切り替えた後、Telegram に変更を適用させるため、各グループからボットを削除して再度追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram のグループ設定で制御します。管理者であるボットはすべてのグループメッセージを受信するため、常時稼働するグループ動作に役立ちます。
  </Accordion>

  <Accordion title="便利な BotFather の切り替え項目">

    - `/setjoingroups` — グループへの追加を許可または拒否
    - `/setprivacy` — グループでの可視性の動作

    チャットコマンドより UI を使用したい場合は、[BotFather の Web アプリ](https://t.me/BotFather?startapp)でも同じ設定を利用できます。

  </Accordion>
</AccordionGroup>

## ダッシュボード Mini App

ボットとの DM で `/dashboard` を実行すると、Telegram 内で OpenClaw ダッシュボードが開きます。

要件:

- 公開済み HTTPS Mini App URL 用の `gateway.tailscale.mode: "serve"` または `"funnel"`
- 数字形式の Telegram ユーザー ID が、選択したアカウントの有効な `allowFrom` または `commands.ownerAllowFrom` に含まれている必要があります。
- DM を使用してください。グループでは、`/dashboard` は `open this in a DM with the bot` と返信し、ボタンを送信しません。
- Docker インストール: Serve/Funnel モードでは、Gateway を `tailscaled` の隣のループバックにバインドする必要がありますが、ポートを公開するブリッジネットワークではこの要件を満たせません。Gateway コンテナを `network_mode: host` で実行し、ホストの `tailscaled` ソケット（`/var/run/tailscale`）と `tailscale` CLI をコンテナにマウントしてください。

Mini App は Tailscale 専用の v1 パスであり、Telegram Web の iframe はサポートしていません。

## アクセス制御とアクティベーション

### グループ内のボット ID

グループとフォーラムトピックでは、設定済みのボットハンドル（例: `@my_bot`）を明示的にメンションすると、エージェントのペルソナ名が Telegram ユーザー名と異なる場合でも、選択した OpenClaw エージェント宛てになります。無関係なトラフィックにはグループの無応答ポリシーが引き続き適用されますが、ボットハンドル自体が「別の誰か」と見なされることはありません。

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージへのアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` が含まれている必要があります）
    - `disabled`

    `allowFrom: ["*"]` を指定した `dmPolicy: "open"` では、ボットのユーザー名を見つけた、または推測した任意の Telegram アカウントがボットにコマンドを実行させられます。ツールを厳しく制限した意図的な公開ボットにのみ使用してください。所有者が 1 人のボットでは、数字形式のユーザー ID を指定した `allowlist` を使用してください。

    `channels.telegram.allowFrom` は数字形式の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` プレフィックスも受け付けられ、正規化されます。
    複数アカウントの設定では、制限的なトップレベルの `channels.telegram.allowFrom` が安全境界になります。マージ後の有効な許可リストに明示的なワイルドカードが引き続き含まれていない限り、アカウントレベルの `allowFrom: ["*"]` によってそのアカウントが公開されることはありません。
    `allowFrom` が空の `dmPolicy: "allowlist"` はすべての DM をブロックし、設定検証で拒否されます。
    セットアップでは数字形式のユーザー ID のみを求められます。古いセットアップによる `@username` 許可リストエントリが設定にある場合は、`openclaw doctor --fix` を実行して数字形式の ID に解決してください（ベストエフォートであり、Telegram ボットトークンが必要です）。
    以前にペアリングストアの許可リストファイルを使用していた場合、`openclaw doctor --fix` で許可リストフロー用のエントリを `channels.telegram.allowFrom` に復元できます（たとえば、`dmPolicy: "allowlist"` にまだ明示的な ID がない場合）。

    所有者が 1 人のボットでは、以前のペアリング承認に依存するよりも、数字形式の `allowFrom` ID を明示した `dmPolicy: "allowlist"` を推奨します。

    よくある誤解: DM のペアリング承認は、「この送信者がどこでも認可される」ことを意味しません。ペアリングで付与されるのは DM アクセスのみです。コマンド所有者がまだ存在しない場合、最初に承認されたペアリングでは `commands.ownerAllowFrom` も設定され、所有者専用コマンドと exec 承認に明示的なオペレーターアカウントが割り当てられます。グループ送信者の認可は、引き続き明示的な設定の許可リストによって決まります。
    1 つの ID で DM とグループコマンドの両方に認可されるには、数字形式の Telegram ユーザー ID を `channels.telegram.allowFrom` に指定し、所有者専用コマンドについては `commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### Telegram ユーザー ID を確認する

    より安全な方法（サードパーティ製ボット不要）: 自分のボットに DM を送り、`openclaw logs --follow` を実行して、`from.id` を確認します。

    公式 Bot API を使用する方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティを使用する方法（プライバシーは低下）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと許可リスト">
    次の 2 つの制御が同時に適用されます。

    1. **許可するグループ**（`channels.telegram.groups`）
       - `groups` の設定がなく、`groupPolicy: "open"` の場合: すべてのグループがグループ ID チェックを通過します
       - `groups` の設定がなく、`groupPolicy: "allowlist"`（デフォルト）の場合: `groups` エントリ（または `"*"`）を追加するまで、すべてのグループがブロックされます
       - `groups` が設定されている場合: 許可リストとして機能します（明示的な ID または `"*"`）

    2. **グループ内で許可する送信者**（`channels.telegram.groupPolicy`）
       - `open` / `allowlist`（デフォルト）/ `disabled`

    `groupAllowFrom` はグループの送信者をフィルタリングします。未設定の場合、Telegram は `allowFrom` にフォールバックします（ペアリングストアではありません。`2026.2.25` 以降、グループ送信者の認証が DM ペアリングストアの承認を継承することはなく、これはセキュリティ境界です）。
    `groupAllowFrom` のエントリには数字形式の Telegram ユーザー ID を使用してください（`telegram:` / `tg:` プレフィックスは正規化されます）。数字以外のエントリは無視されます。グループまたはスーパーグループのチャット ID をここに指定しないでください。負のチャット ID は `channels.telegram.groups` 配下に指定します。
    所有者が 1 人のボットでの実用的なパターン: ユーザー ID を `channels.telegram.allowFrom` に設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` 配下で許可します。
    `channels.telegram` が設定にまったく存在しない場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムはデフォルトでフェイルクローズの `groupPolicy="allowlist"` を使用します。

    所有者専用のグループ設定:

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

    グループから `@<bot_username> ping` を使用してテストします。`requireMention: true` の間、通常のグループメッセージではボットは起動しません。

    特定の 1 グループですべてのメンバーを許可する:

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

    特定の 1 グループ内で指定したユーザーのみを許可する:

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
      よくある間違い: `groupAllowFrom` はグループの許可リストではありません。

      - 負の Telegram グループ／スーパーグループチャット ID（`-1001234567890`）は `channels.telegram.groups` 配下に指定します。
      - Telegram ユーザー ID（`8734062810`）は `groupAllowFrom` 配下に指定し、許可されたグループ内でボットを起動できるユーザーを制限します。
      - 許可されたグループの任意のメンバーがボットと会話できるようにする場合にのみ、`groupAllowFrom: ["*"]` を使用します。

    </Warning>

  </Tab>

  <Tab title="メンションの動作">
    デフォルトでは、グループでの返信にはメンションが必要です。メンションとして認識されるものは次のとおりです。

    - ネイティブの `@botusername` メンション
    - `agents.list[].groupChat.mentionPatterns` または `messages.groupChat.mentionPatterns` 内のメンションパターン

    セッションレベルの切り替え（状態のみで、永続化されません）: `/activation always`、`/activation mention`。永続化するには設定を使用します。

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

    グループ履歴のコンテキストは常に有効で、`historyLimit` によって上限が設定されます。グループ履歴ウィンドウを無効にするには、`channels.telegram.historyLimit: 0` を設定します。`openclaw doctor --fix` は廃止された `includeGroupHistoryContext` キーを削除します。

    グループチャット ID の取得方法: グループメッセージを `@userinfobot` / `@getidsbot` に転送する、`openclaw logs --follow` の `chat.id` を確認する、Bot API の `getUpdates` を調べる、または（グループが許可された後に）`/whoami@<bot_username>` を実行します。

  </Tab>
</Tabs>

## ランタイムの動作

- Telegram は Gateway プロセス内で動作します。
- ルーティングは決定的です。Telegram から受信したメッセージへの返信は Telegram に返されます（モデルがチャネルを選択することはありません）。
- 受信メッセージは、返信メタデータ、メディアプレースホルダー、および Gateway が確認した返信について永続化された返信チェーンのコンテキストを含む、共有チャネルエンベロープに正規化されます。
- グループセッションはグループ ID ごとに分離されます。フォーラムトピックには `:topic:<threadId>` が付加されます。
- DM メッセージには `message_thread_id` を含めることができ、OpenClaw は返信用にこれを保持します。DM トピックセッションが分割されるのは、Telegram の `getMe` がボットについて `has_topics_enabled: true` を報告した場合のみです。それ以外の DM はフラットセッションのままです。
- ロングポーリングでは、チャットごと、スレッドごとの順序制御を備えた grammY runner を使用します。runner のシンク同時実行数には `agents.defaults.maxConcurrent` を使用します。
- 複数アカウントの起動時には、同時実行される `getMe` プローブ数を制限し、大規模なボット群ですべてのアカウントのプローブが一斉に実行されないようにします。
- 各 Gateway プロセスはロングポーリングを保護し、1 つのボットトークンを同時に使用できるアクティブなポーラーを 1 つだけに制限します。`getUpdates` の 409 競合が継続する場合は、同じトークンを使用している別の OpenClaw Gateway、スクリプト、または外部ポーラーが存在することを示します。
- ポーリングウォッチドッグは、デフォルトでは完了した `getUpdates` の生存確認がない状態が 120 秒続くと再起動します。長時間実行される処理中にポーリング停止の誤検知による再起動が発生するデプロイ環境でのみ、`channels.telegram.pollingStallThresholdMs`（30000-600000、アカウントごとのオーバーライドに対応）を引き上げてください。
- Telegram Bot API は既読通知に対応していません（`sendReadReceipts` は適用されません）。

<Note>
  `channels.telegram.dm.threadReplies` と `channels.telegram.direct.<chatId>.threadReplies` は削除されました。設定にこれらのキーが残っている場合は、アップグレード後に `openclaw doctor --fix` を実行してください。DM トピックのルーティングは、Telegram の `getMe.has_topics_enabled`（BotFather のスレッドモードで制御）に従うようになりました。トピックが有効なボットでは、Telegram が `message_thread_id` を送信した場合にスレッド単位の DM セッションを使用します。その他の DM はフラットセッションのままです。
</Note>

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は、ダイレクトチャット、グループ、トピックで部分的な返信をリアルタイムにストリーミングします。プレビューメッセージを送信した後、`editMessageText` を繰り返し実行し、その場で確定します。

    - `channels.telegram.streaming` は `off | partial | block | progress` です（デフォルト: `partial`）
    - 短い初期回答のプレビューはデバウンスされ、実行がまだアクティブな場合は、制限された遅延時間の後に実体化されます
    - `progress` はツールの進行状況用に編集可能なステータス下書きを 1 つ保持し、ツールの進行より先に回答のアクティビティが到着した場合は安定したステータスラベルを表示し、完了時にそれを消去して、最終回答を通常のメッセージとして送信します
    - `streaming.preview.toolProgress` は、ツールや進行状況の更新で同じ編集済みプレビューメッセージを再利用するかどうかを制御します（デフォルト: プレビューストリーミングが有効な場合は `true`）
    - `streaming.preview.commandText` は、これらの行に含めるコマンドや実行の詳細を制御します。`raw`（デフォルト）または `status`（ツールラベルのみ）
    - `streaming.progress.commentary`（デフォルト: `false`）を使用すると、一時的な進行状況の下書きにアシスタントの解説や前置きテキストを含めることができます
    - 従来の `channels.telegram.streamMode`、ブール値の `streaming`、および廃止されたネイティブ下書きプレビューキーは検出されます。移行するには `openclaw doctor --fix` を実行してください

    ツール進行状況行は、ツールの実行中に表示される短いステータス更新です（コマンド実行、ファイル読み取り、計画の更新、パッチの概要、app-server モードでの Codex の前置きや解説）。Telegram ではデフォルトで有効です（`v2026.4.22` 以降のリリース済み動作と一致します）。

    回答プレビューの編集を維持しながら、ツール進行状況行を非表示にするには、次のように設定します。

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

    ツール進行状況を表示したまま、コマンドや実行のテキストを非表示にするには、次のように設定します。

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

    `progress` モードでは、最終回答をそのメッセージ内で編集せずにツールの進行状況を表示します。コマンドテキストのポリシーは `streaming.progress` 配下に配置します。

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

    `streaming.mode: "off"` は、プレビュー編集を無効にし、一般的なツールや進行状況の通知を独立したステータスメッセージとして送信せず抑制します。承認プロンプト、メディア、エラーは引き続き通常の最終配信を通じてルーティングされます。`streaming.preview.toolProgress: false` は回答プレビューの編集のみを維持します。

    <Note>
      選択範囲を引用した返信は例外です。`replyToMode` が `first`、`all`、または `batched` であり、受信メッセージに選択された引用テキストが含まれる場合、OpenClaw は回答プレビューを編集する代わりに、Telegram のネイティブ引用返信経路を通じて最終回答を送信します。そのため、そのターンでは `streaming.preview.toolProgress` にステータス行を表示できません。選択された引用テキストを含まない現在のメッセージへの返信は、引き続きストリーミングされます。ネイティブ引用返信よりもツール進行状況の可視性を優先する場合は `replyToMode: "off"` を設定し、このトレードオフを許容する場合は `streaming.preview.toolProgress: false` を設定してください。
    </Note>

    テキストのみの返信では、短いプレビューはその場で最終編集されます。複数のメッセージに分割される長い最終回答では、プレビューを最初のチャンクとして再利用し、残りだけを送信します。進行状況モードの最終回答では、ステータス下書きを消去して通常の最終配信を使用します。完了が確認される前に最終編集が失敗した場合、OpenClaw は通常の最終配信にフォールバックし、古いプレビューをクリーンアップします。複雑な返信（メディアペイロード）の場合、OpenClaw は常に通常の最終配信にフォールバックし、プレビューをクリーンアップします。

    プレビューストリーミングとブロックストリーミングは相互排他的です。ブロックストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

    推論: `/reasoning stream` は生成中の推論をライブプレビューにストリーミングし、最終配信後に推論プレビューを削除します（表示したままにするには `/reasoning on` を使用します）。最終回答は推論テキストを含めずに送信されます。

  </Accordion>

  <Accordion title="リッチメッセージの書式設定">
    送信テキストでは、現在の各クライアントで読み取れる標準の Telegram HTML メッセージをデフォルトで使用します。太字、斜体、リンク、コード、スポイラー、引用に対応しますが、Bot API 10.2 のリッチ専用ブロック（ネイティブテーブル、詳細、リッチメディア、数式）は使用しません。

    Bot API 10.2 のリッチメッセージを有効にするには、次のように設定します。

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    有効にすると、エージェントにはこのボットやアカウントでリッチメッセージを使用できることが通知されます（対応する Markdown + HTML アイランドのオーサリング規約を含みます）。Markdown テキストは OpenClaw の Markdown IR を通じて、型指定された Bot API 10.2 リッチブロック（見出し、テーブル、詳細、チェックリスト、リッチメディア、数式、地図、コラージュ）としてレンダリングされます。メディアキャプションには引き続き Telegram HTML キャプションを使用します（リッチメッセージはキャプションを置き換えず、キャプションの上限は 1024 文字です）。

    これにより、モデルのテキストが Telegram のリッチ Markdown 記号から分離されるため、`$400-600K` のような通貨が数式として解析されません。長いリッチテキストは Telegram の制限に合わせて自動的に分割されます。20 列の上限を超えるテーブルはコードブロックにフォールバックします。

    デフォルトでは、クライアント互換性のため無効です。現在の一部の Desktop、Web、Android、およびサードパーティ製クライアントでは、受理されたリッチメッセージが未対応としてレンダリングされます。ボットで使用するすべてのクライアントがリッチメッセージをレンダリングできる場合を除き、無効のままにしてください。`/status` は、現在のセッションでリッチメッセージが有効か無効かを示します。

    リンクプレビューはデフォルトで有効です。`channels.telegram.linkPreview: false` は、リッチテキストのエンティティ自動検出を無効にします。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram のコマンドメニューは、起動時に `setMyCommands` を使用して登録されます。`commands.native: "auto"` は Telegram のネイティブコマンドを有効にします。

    カスタムコマンドのメニュー項目を追加するには、次のように設定します。

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git バックアップ" },
        { command: "generate", description: "画像を作成" },
      ],
    },
  },
}
```

    ルール: 名前は正規化されます（先頭の `/` を削除し、小文字に変換）。有効なパターンは `a-z`、`0-9`、`_`、長さは 1-32 です。カスタムコマンドはネイティブコマンドを上書きできません。競合や重複はスキップされ、ログに記録されます。

    カスタムコマンドはメニュー項目にすぎず、動作が自動的に実装されるわけではありません。Plugin や Skills のコマンドは、Telegram メニューに表示されていなくても、入力すれば引き続き機能します。ネイティブコマンドを無効にすると、組み込みコマンドは削除されます。カスタムコマンドや Plugin コマンドは、設定されていれば引き続き登録される場合があります。

    よくあるセットアップエラー:

    - トリムの再試行後に `setMyCommands failed` と `BOT_COMMANDS_TOO_MUCH` が表示される場合、メニューが依然として上限を超えています。Plugin、Skills、カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - Bot API に対する直接の curl コマンドは機能する一方で、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合、通常は `channels.telegram.apiRoot` に完全な `/bot<TOKEN>` エンドポイントが設定されています。`apiRoot` には Bot API のルートのみを指定する必要があります。`openclaw doctor --fix` は、誤って末尾に追加された `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、設定されたボットトークンが Telegram に拒否されたことを意味します。`botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN`（デフォルトアカウント）を現在の BotFather トークンで更新してください。OpenClaw はポーリング開始前に停止するため、Webhook のクリーンアップ失敗として報告されることはありません。
    - ネットワークやフェッチエラーを伴う `setMyCommands failed` は、通常、`api.telegram.org` への送信 DNS/HTTPS 通信がブロックされていることを意味します。

    ### デバイスペアリングコマンド（`device-pair` Plugin）

    インストールすると、次のコマンドを使用できます。

    1. `/pair` はセットアップコードを生成します
    2. コードを iOS アプリに貼り付けます
    3. `/pair pending` は保留中のリクエスト（ロールやスコープを含む）を一覧表示します
    4. 承認: `/pair approve <requestId>`、`/pair approve`（保留中のリクエストが 1 件のみの場合）、または `/pair approve latest`

    デバイスが変更された認証情報（ロール、スコープ、公開鍵）で再試行すると、以前の保留中リクエストは新しい `requestId` に置き換えられます。承認する前に `/pair pending` を再実行してください。

    詳細: [ペアリング](/ja-JP/channels/pairing#pair-via-telegram)。

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

    スコープ: `off`、`dm`、`group`、`all`、`allowlist`（デフォルト）。従来の `capabilities: ["inlineButtons"]` は `"all"` にマッピングされます。

    メッセージアクションの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "オプションを選択してください:",
  buttons: [
    [
      { text: "はい", callback_data: "yes" },
      { text: "いいえ", callback_data: "no" },
    ],
    [{ text: "キャンセル", callback_data: "cancel" }],
  ],
}
```

    Mini App ボタンの例:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "アプリを開く:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "起動", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    `web_app` ボタンは、ユーザーとボット間のプライベートチャットでのみ機能します。

    登録済み Plugin のインタラクティブハンドラーによって処理されなかったコールバッククリックは、テキストとしてエージェントに渡されます: `callback_data: <value>`。

  </Accordion>

  <Accordion title="エージェントと自動化向けの Telegram メッセージアクション">
    アクション:

    - `sendMessage`（`to`、`content`、任意の `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` または `caption`、任意の `presentation` インラインボタン。ボタンのみの編集では返信マークアップが更新されます）
    - `createForumTopic`（`chatId`、`name`、任意の `iconColor`、`iconCustomEmojiId`）

    使いやすいエイリアス: `send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`。

    ゲーティング: `channels.telegram.actions.sendMessage`、`deleteMessage`、`reactions`、`sticker`（デフォルト: 無効）。`edit`、`createForumTopic`、`editForumTopic` は専用の切り替えなしでデフォルトで有効です。
    ランタイム送信では、起動時または再読み込み時のアクティブな設定とシークレットのスナップショットを使用するため、アクションパスは送信のたびに `SecretRef` の値を再解決しません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)。

  </Accordion>

  <Accordion title="返信スレッドタグ">
    生成された出力内の明示的な返信スレッドタグ:

    - `[[reply_to_current]]` — トリガーとなったメッセージに返信します
    - `[[reply_to:<id>]]` — 特定のメッセージ ID に返信します

    `channels.telegram.replyToMode`: `off`（デフォルト）、`first`、`all`。

    返信スレッドが有効で、元のテキストまたはキャプションを利用できる場合、OpenClaw はネイティブの引用抜粋を自動的に追加します。Telegram のネイティブ引用テキストの上限は 1024 UTF-16 コード単位です。これを超えるメッセージは先頭から引用され、Telegram が引用を拒否した場合は通常の返信にフォールバックします。

    `off` は暗黙的な返信スレッドのみを無効にします。明示的な `[[reply_to_*]]` タグは引き続き使用されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッドの動作">
    フォーラムスーパーグループ: トピックのセッションキーには `:topic:<threadId>` が付加されます。返信と入力中表示はトピックスレッドを対象とし、トピックの設定パスは `channels.telegram.groups.<chatId>.topics.<threadId>` です。

    一般トピック（`threadId=1`）は特殊なケースです。メッセージ送信では `message_thread_id` を省略します（Telegram は `sendMessage(...thread_id=1)` を「thread not found」として拒否します）が、入力中アクションには引き続き `message_thread_id` を含めます（入力中インジケーターを表示するために必要であることが実証されています）。

    トピックエントリは、上書きされない限りグループ設定を継承します（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。`agentId` はトピック専用であり、グループのデフォルトから継承されません。`topics."*"` はそのグループ内のすべてのトピックにデフォルトを設定しますが、正確なトピック ID は引き続き `"*"` より優先されます。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック設定内の `agentId` を介して異なるエージェントにルーティングでき、それぞれ独自のワークスペース、メモリ、セッションを持たせることができます:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // 一般トピック -> main エージェント
                "3": { agentId: "zu" },        // 開発トピック -> zu エージェント
                "5": { agentId: "coder" }      // コードレビュー -> coder エージェント
              }
            }
          }
        }
      }
    }
    ```

    各トピックはそれぞれ独自のセッションキーを持ちます。例: `agent:zu:telegram:group:-1001234567890:topic:3`。

    **永続的な ACP トピックバインディング**: フォーラムトピックは、トップレベルの型付きバインディング（`bindings[]` と `type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾 ID）を通じて ACP ハーネスセッションを固定できます。現在はグループおよびスーパーグループ内のフォーラムトピックに限定されています。[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

    **チャットからのスレッドバインド ACP 起動**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しい ACP セッションにバインドします。後続メッセージはそこへ直接ルーティングされ、OpenClaw は起動確認をトピック内に固定します。`channels.telegram.threadBindings.spawnSessions`（デフォルト: `true`）が必要です。

    テンプレートコンテキストでは `MessageThreadId` と `IsForum` が公開されます。`message_thread_id` を持つ DM チャットは返信メタデータを保持しますが、Telegram の `getMe` が `has_topics_enabled: true` を報告する場合にのみ、スレッド対応のセッションキーを使用します。
    廃止された `dm.threadReplies` と `direct.*.threadReplies` の上書きは削除されました。BotFather のスレッドモードが唯一の信頼できる情報源です。古い設定キーを削除するには `openclaw doctor --fix` を実行してください。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram はボイスメモと音声ファイルを区別します。デフォルトは音声ファイルとしての動作です。ボイスメモとして強制送信するには、エージェントの返信に `[[audio_as_voice]]` タグを付けます。受信したボイスメモの文字起こしは、エージェントコンテキスト内で機械生成された信頼できないテキストとして扱われますが、メンション検出には引き続き生の文字起こしが使用されるため、メンションを条件とする音声メッセージは引き続き機能します。

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

    Telegram は動画ファイルとビデオノートを区別します。ビデオノートはキャプションをサポートしません。指定されたメッセージテキストは別途送信されます。

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### 位置情報と施設

    1 つの独立した `location` オブジェクトとともに、既存の `send` アクションを使用します。座標を指定するとネイティブのピンが送信され、`name` と `address` の両方を追加するとネイティブの施設カードが送信されます。位置情報の送信をメッセージテキストやメディアと組み合わせることはできません。

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "Eiffel Tower",
    address: "Champ de Mars, Paris",
  },
}
```

    ### ステッカー

    受信時: 静的な WEBP はダウンロードされ処理されます（プレースホルダー `<media:sticker>`）。アニメーション TGS と動画 WEBM はスキップされます。

    ステッカーのコンテキストフィールド: `Sticker.emoji`、`Sticker.setName`、`Sticker.fileId`、`Sticker.fileUniqueId`、`Sticker.cachedDescription`。説明は OpenClaw SQLite Plugin の状態にキャッシュされ、繰り返し行われるビジョン呼び出しを削減します。

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

    送信:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    キャッシュされたステッカーを検索:

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
    Telegram のリアクションは、メッセージペイロードとは別の `message_reaction` 更新として届きます。有効にすると、OpenClaw は `Telegram reaction added: 👍 by Alice (@alice) on msg 42` のようなシステムイベントをキューに入れます。

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    `own` は、ボットが送信したメッセージに対するユーザーのリアクションのみを意味します（送信済みメッセージのキャッシュを使用するベストエフォート方式）。リアクションイベントには引き続き Telegram のアクセス制御（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）が適用され、許可されていない送信者は破棄されます。

    Telegram はリアクション更新にスレッド ID を含めません。フォーラムではないグループはグループチャットセッションにルーティングされ、フォーラムグループは正確な発生元トピックではなく、一般トピックのセッション（`:topic:1`）にルーティングされます。

    ポーリング/Webhook の `allowed_updates` には `message_reaction` が自動的に含まれます。

  </Accordion>

  <Accordion title="確認リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間、確認用の絵文字を送信します。`messages.ackReactionScope` は、それを送信する*タイミング*を決定します。

    **絵文字の解決順序:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェント ID の絵文字へのフォールバック（`agents.list[].identity.emoji`、それ以外は「👀」）

    Telegram は Unicode 絵文字（例:「👀」）を想定しています。チャンネルまたはアカウントのリアクションを無効にするには `""` を使用します。

    **スコープ（`messages.ackReactionScope`、デフォルトは `"group-mentions"`。現在、Telegram アカウントまたは Telegram チャンネルごとの上書きはありません）:**

    `all`（DM + グループ。アンビエントルームイベントを含む）、`direct`（DM のみ）、`group-all`（アンビエントルームイベントを除くすべてのグループメッセージ。DM なし）、`group-mentions`（ボットがメンションされたグループ。**DM なし** — デフォルト）、`off` / `none`（無効）。

    <Note>
    デフォルトのスコープ（`group-mentions`）では、DM またはアンビエントルームイベントで確認リアクションは実行されません。DM には `direct` または `all` を使用します。アンビエントルームイベントを確認するのは `all` のみです。この値は Telegram プロバイダーの起動時に読み込まれるため、変更を反映するには Gateway の再起動が必要です。
    </Note>

  </Accordion>

  <Accordion title="Telegram のイベントとコマンドからの設定書き込み">
    チャンネル設定の書き込みはデフォルトで有効です（`configWrites !== false`）。Telegram をトリガーとする書き込みには、グループ移行イベント（`migrate_to_chat_id`、`channels.telegram.groups` を更新）と `/config set` / `/config unset`（コマンドの有効化が必要）が含まれます。

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
    デフォルトはロングポーリングです。Webhook モードでは `channels.telegram.webhookUrl` と `channels.telegram.webhookSecret` を設定します。任意で `webhookPath`（デフォルト `/telegram-webhook`）、`webhookHost`（デフォルト `127.0.0.1`）、`webhookPort`（デフォルト `8787`）、`webhookCertPath`（直接 IP またはドメインなしの構成向けの自己署名証明書 PEM）も設定できます。

    ロングポーリングモードでは、OpenClaw は更新が正常にディスパッチされた後にのみ再起動ウォーターマークを永続化します。ハンドラーが失敗した場合、その更新を完了済みとしてマークせず、同じプロセス内で再試行可能な状態に保ちます。

    ローカルリスナーはデフォルトで `127.0.0.1:8787` にバインドします。公開アクセスを受け入れるには、ローカルポートの前段にリバースプロキシを配置するか、意図的に `webhookHost: "0.0.0.0"` を設定します。

    Webhook モードでは、リクエストガード、Telegram のシークレットトークン、JSON ボディを検証し、空の `200` を返す前に更新を永続的な受信キューへコミットします。永続的な受け入れに成功した場合は `x-openclaw-delivery-accepted: durable` が含まれます。ヘルス、ルーティング、認証、検証、ストレージエラーのレスポンスでは、このヘッダーが省略されます。リバースプロキシとホストコントローラーはこのヘッダーを必須にすることで、レスポンス時間から受け入れを推測せずに、OpenClaw による受け入れと一般的な空の `200` を区別できます。

    その後、OpenClaw はロングポーリングと同じチャット単位/トピック単位のボットレーンを通じて更新を非同期に処理するため、時間のかかるエージェントターンによって Telegram の配信 ACK が保留されることはありません。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000 です。長さで分割する前に、`streaming.chunkMode="newline"` は段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信メディアのサイズを制限します。
    - `channels.telegram.mediaGroupFlushMs`（デフォルト 500、範囲 10-60000）は、OpenClaw がアルバムやメディアグループを 1 件の受信メッセージとしてディスパッチするまでにバッファリングする時間を制御します。アルバムの一部が遅れて到着する場合は増やし、アルバムへの返信レイテンシーを短縮する場合は減らします。
    - `channels.telegram.timeoutSeconds` は API クライアントのタイムアウトを上書きします（未設定の場合は grammY のデフォルトが適用されます）。Bot クライアントは、設定値が送信テキスト／入力中リクエストの 60 秒ガードを下回る場合、そのガード未満にならないよう調整します。これにより、OpenClaw のトランスポートガードとフォールバックが動作する前に、grammY が目に見える返信の配信を中止することを防ぎます。ロングポーリングでは引き続き 45 秒の `getUpdates` リクエストガードを使用するため、アイドル状態のポーリングが無期限に放棄されることはありません。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは 120000 です。ポーリング停止の誤検知による再起動が発生する場合に限り、30000 から 600000 の範囲で調整してください。
    - グループコンテキスト履歴には `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト 50）が使用されます。`0` を指定すると無効になります。
    - 返信／引用／転送の補足コンテキストは、Gateway が親メッセージを観測済みの場合、選択された 1 つの会話コンテキストウィンドウに正規化されます。観測済みメッセージのキャッシュは OpenClaw SQLite Plugin 状態に保存され、`openclaw doctor --fix` が従来のサイドカーファイルをインポートします。Telegram が各更新に含めるのは浅い `reply_to_message` 1 件のみであるため、キャッシュより古いチェーンはそのペイロードに制限されます。
    - Telegram の許可リストは主に、エージェントを起動できるユーザーを制限するものであり、補足コンテキスト全体の完全な秘匿化境界ではありません。
    - DM 履歴：`channels.telegram.dmHistoryLimit`、`channels.telegram.dms["<user_id>"].historyLimit`。
    - `channels.telegram.retry` は、回復可能な送信 API エラーに対して Telegram の送信ヘルパー（CLI／ツール／アクション）に適用されます。受信メッセージへの最終返信の配信では、接続前の失敗に対して上限付きの安全な送信再試行を行いますが、表示されるメッセージが重複する可能性のある、送信後の曖昧なネットワークエンベロープは再試行しません。

    CLI およびメッセージツールの送信ターゲットには、数値のチャット ID、ユーザー名、またはフォーラムトピックのターゲットを指定できます。

```bash
openclaw message send --channel telegram --target 123456789 --message "こんにちは"
openclaw message send --channel telegram --target @name --message "こんにちは"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "トピックへのこんにちは"
```

    投票では `openclaw message poll` を使用し、フォーラムトピックにも対応します。

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "リリースしますか？" --poll-option "はい" --poll-option "いいえ"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "時刻を選択" --poll-option "午前10時" --poll-option "午後2時" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 専用の投票フラグ：`--poll-duration-seconds`（5-600）、`--poll-anonymous`、`--poll-public`、`--thread-id`（または `:topic:` ターゲット）。`--poll-option` は 2-12 回繰り返します（Telegram の選択肢数上限）。

    Telegram の送信では、インラインキーボード用の `buttons` ブロックを含む `--presentation`（`channels.telegram.capabilities.inlineButtons` で許可されている場合）、Bot がそのチャットでピン留めできる場合にピン留め配信を要求する `--pin` または `--delivery '{"pin":true}'`、および画像、GIF、動画を圧縮画像／アニメーション／動画としてではなくドキュメントとして送信する `--force-document` にも対応します。

    アクション制御：`channels.telegram.actions.sendMessage=false` は投票を含むすべての送信メッセージを無効にします。`channels.telegram.actions.poll=false` は通常の送信を有効にしたまま、投票の作成を無効にします。

  </Accordion>

  <Accordion title="Telegram での実行承認">
    Telegram は承認者との DM で実行承認に対応し、必要に応じて元のチャットまたはトピックにもプロンプトを投稿できます。承認者には数値の Telegram ユーザー ID を指定する必要があります。

    - `channels.telegram.execApprovals.enabled`（少なくとも 1 人の承認者を解決できる場合、`"auto"` で有効化）
    - `channels.telegram.execApprovals.approvers`（`commands.ownerAllowFrom` の数値の所有者 ID にフォールバック）
    - `channels.telegram.execApprovals.target`：`dm`（デフォルト）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom`、`defaultTo` は、Bot と対話できるユーザーおよび通常の返信先を制御しますが、ユーザーを実行承認者にするものではありません。コマンド所有者がまだ存在しない場合、最初に承認された DM ペアリングによって `commands.ownerAllowFrom` が初期設定されるため、所有者が 1 人の構成では `execApprovals.approvers` に ID を重複して指定する必要がありません。

    チャネルへの配信では、コマンドテキストがチャットに表示されます。`channel` または `both` は、信頼できるグループ／トピックでのみ有効にしてください。プロンプトがフォーラムトピックに送られた場合、OpenClaw は承認プロンプトとその後のやり取りでトピックを維持します。実行承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンを使用するには、対象サーフェス（`dm`、`group`、または `all`）が `channels.telegram.capabilities.inlineButtons` で許可されている必要もあります。`plugin:` で始まる承認 ID は Plugin 承認によって解決され、それ以外は最初に実行承認によって解決されます。

    [実行承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信の制御

エージェントで配信エラーまたはプロバイダーエラーが発生した場合、エラーポリシーによってエラーメッセージを Telegram チャットに送信するかどうかが制御されます。

| キー                                 | 値                     | デフォルト         | 説明                                                                                                                                                                                              |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`、`once`、`silent` | `always`        | `always` はすべてのエラーメッセージをチャットに送信します。`once` は一意のエラーメッセージごとに、クールダウン期間中 1 回だけ送信します（同一エラーの繰り返しを抑制します）。`silent` はエラーメッセージをチャットに一切送信しません。 |
| `channels.telegram.errorCooldownMs` | 数値（ms）                | `14400000`（4h） | `once` ポリシーのクールダウン期間です。エラーの送信後、この期間が経過するまで同じメッセージは抑制されます。障害中のエラースパムを防ぎます。                                           |

アカウント単位、グループ単位、トピック単位の上書きに対応しています（他の Telegram 設定キーと同じ継承規則）。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // このグループではエラーを抑制
        },
      },
    },
  },
}
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="メンションのないグループメッセージに Bot が応答しない">

    - `requireMention=false` の場合、Telegram のプライバシーモードで完全な可視性を許可する必要があります。BotFather `/setprivacy` -> Disable を選択し、Bot をグループから削除して再度追加してください。
    - 設定でメンションのないグループメッセージを想定している場合、`openclaw channels status` が警告します。
    - `openclaw channels status --probe` は明示的な数値のグループ ID を確認します。ワイルドカード `"*"` ではメンバーシップをプローブできません。
    - 簡易セッションテスト：`/activation always`。

  </Accordion>

  <Accordion title="Bot がグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、グループを一覧に含める必要があります（または `"*"` を含めます）。
    - Bot がグループのメンバーであることを確認してください。
    - スキップ理由については `openclaw logs --follow` を確認してください。

  </Accordion>

  <Accordion title="コマンドが部分的にしか動作しない、またはまったく動作しない">

    - 送信者 ID を承認してください（ペアリングおよび／または数値の `allowFrom`）。グループポリシーが `open` の場合でも、コマンドの認可は引き続き適用されます。
    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、ネイティブメニューの項目が多すぎることを意味します。Plugin／Skills／カスタムコマンドを減らすか、ネイティブメニューを無効にしてください。
    - `deleteMyCommands`／`setMyCommands` の起動時呼び出しと `sendChatAction` の入力中呼び出しには上限が設定され、リクエストがタイムアウトした場合は Telegram のトランスポートフォールバックを介して 1 回再試行されます。ネットワーク／fetch エラーが継続する場合、通常は `api.telegram.org` への DNS／HTTPS 接続が不可能であることを意味します。

  </Accordion>

  <Accordion title="起動時に未認証トークンが報告される">

    - `getMe returned 401` は、設定された Bot トークンに対する Telegram の認証失敗です。BotFather でトークンを再コピーまたは再生成し、`channels.telegram.botToken`、`tokenFile`、`accounts.<id>.botToken`、または `TELEGRAM_BOT_TOKEN`（デフォルトアカウント）を更新してください。
    - 起動中の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「Webhook が存在しない」として扱っても、同じ無効なトークンによる失敗が後続の API 呼び出しまで先送りされるだけです。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - カスタム fetch／プロキシを使用する Node 22+ では、`AbortSignal` の型が一致しない場合、即時中止動作が発生することがあります。
    - 一部のホストでは `api.telegram.org` が最初に IPv6 に解決されます。IPv6 の外向き通信に問題があると、API 障害が断続的に発生します。
    - `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` を含むログは、回復可能なネットワークエラーとして再試行されます。
    - ポーリング起動中、OpenClaw は成功した起動時の `getMe` プローブを grammY 用に再利用するため、ランナーは最初の `getUpdates` の前に 2 回目の `getMe` を実行する必要がありません。
    - ポーリング起動中に一時的なネットワークエラーで `deleteWebhook` が失敗した場合、OpenClaw はポーリング前の制御プレーン呼び出しをもう一度行わず、そのままロングポーリングに移行します。Webhook がまだ有効な場合は `getUpdates` の競合として現れます。OpenClaw はトランスポートを再構築し、Webhook のクリーンアップを再試行します。
    - Telegram ソケットが短い固定間隔で再接続される場合は、低い `channels.telegram.timeoutSeconds` が設定されていないか確認してください。Bot クライアントは、送信および `getUpdates` リクエストガードを下回る設定値を調整しますが、古いリリースでは、それらのガードを下回る値を設定するとポーリングや返信が毎回中止されることがありました。
    - ログ内の `Polling stall detected` は、デフォルトでロングポーリングの稼働完了が 120 秒間確認されなかったため、OpenClaw がポーリングを再起動してトランスポートを再構築したことを意味します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中のポーリングアカウントが起動猶予期間後も `getUpdates` を完了していない場合、実行中の Webhook アカウントが起動猶予期間後も `setWebhook` を完了していない場合、または最後に成功したポーリングトランスポートのアクティビティが古い場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しが正常であるにもかかわらず、ホストでポーリング停止の誤検知による再起動が報告される場合に限り、`channels.telegram.pollingStallThresholdMs` を増やしてください。停止が継続する場合は通常、`api.telegram.org` へのプロキシ、DNS、IPv6、または TLS の外向き通信に問題があることを示します。
    - Telegram は Bot API トランスポートでプロセスのプロキシ環境変数（`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、および小文字のバリアント）を使用します。`NO_PROXY`／`no_proxy` では引き続き `api.telegram.org` を迂回できます。
    - サービス環境で `OPENCLAW_PROXY_URL` が設定され、標準のプロキシ環境変数が存在しない場合、Telegram は Bot API トランスポートにもその URL を使用します。
    - 直接の外向き通信／TLS が不安定な VPS ホストでは、Telegram API 呼び出しをプロキシ経由でルーティングしてください。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ ではデフォルトで `autoSelectFamily=true` が使用されます（WSL2 を除く）。Telegram の DNS 結果の順序では、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、次に `channels.telegram.network.dnsResultOrder`、その後にプロセスのデフォルト（例: `NODE_OPTIONS=--dns-result-order=ipv4first`）が優先され、いずれも該当しない場合は Node 22+ で `ipv4first` にフォールバックします。
    - WSL2 上、または IPv4 のみの動作の方が適している場合は、アドレスファミリーの選択を強制します。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、Telegram のメディアダウンロードでデフォルトですでに許可されています。信頼できる fake-IP または透過プロキシが、メディアのダウンロード中に `api.telegram.org` を別のプライベート、内部、または特殊用途アドレスへ書き換える場合は、Telegram 限定のバイパスを明示的に有効化します。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じ明示的な有効化は、アカウントごとに `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` でも設定できます。
    - プロキシが Telegram のメディアホストを `198.18.x.x` に解決する場合は、まず危険なフラグをオフのままにしてください。この範囲はデフォルトですでに許可されています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は Telegram メディアの SSRF 保護を弱めます。RFC 2544 ベンチマーク範囲外のプライベートまたは特殊用途の応答を生成する、信頼できる運用者管理下のプロキシ環境（Clash、Mihomo、Surge の fake-IP ルーティング）でのみ使用してください。通常の公開インターネット経由の Telegram アクセスではオフのままにしてください。
    </Warning>

    - 一時的な環境オーバーライド: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`。
    - DNS 応答を検証します。

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

詳細なヘルプ: [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主要なリファレンス: [設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="重要度の高い Telegram フィールド">

- 起動/認証: `enabled`、`botToken`、`tokenFile`（通常ファイルである必要があります。シンボリックリンクは拒否されます）、`accounts.*`
- アクセス制御: `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、トップレベルの `bindings[]`（`type: "acp"`）
- トピックのデフォルト: `groups.<chatId>.topics."*"` は一致しないフォーラムトピックに適用され、正確なトピック ID がこれを上書きします
- コマンド実行の承認: `execApprovals`、`accounts.*.execApprovals`
- コマンド/メニュー: `commands.native`、`commands.nativeSkills`、`customCommands`
- スレッド/返信: `replyToMode`、`threadBindings`
- ストリーミング: `streaming`（モード: `off | partial | block | progress`）、`streaming.preview.toolProgress`
- 書式設定/配信: `textChunkLimit`、`streaming.chunkMode`、`richMessages`、`markdown.tables`（`off | bullets | code | block`）、`linkPreview`、`responsePrefix`
- メディア/ネットワーク: `mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- カスタム API ルート: `apiRoot`（Bot API ルートのみ。`/bot<TOKEN>` は含めないでください）、`trustedLocalFileRoots`（セルフホスト Bot API の絶対 `file_path` ルート）
- Webhook: `webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`、`webhookPort`、`webhookCertPath`
- アクション/機能: `capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- リアクション: `reactionNotifications`、`reactionLevel`
- エラー: `errorPolicy`、`errorCooldownMs`、`silentErrorReplies`
- 書き込み/履歴: `configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
複数アカウントの優先順位: 2 つ以上のアカウント ID が設定されている場合は、デフォルトのルーティングを明示するために `channels.telegram.defaultAccount` を設定（または `channels.telegram.accounts.default` を含める）してください。そうしない場合、OpenClaw は正規化された最初のアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
</Note>

## 関連項目

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram ユーザーを Gateway とペアリングします。
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
    グループとトピックをエージェントに割り当てます。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断。
  </Card>
</CardGroup>
