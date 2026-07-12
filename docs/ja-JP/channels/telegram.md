---
read_when:
    - Telegram の機能または Webhook に取り組む場合
summary: Telegram botのサポート状況、機能、および設定
title: Telegram
x-i18n:
    generated_at: "2026-07-12T14:19:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8aa81fb0a1bc2953305591f5b616e5caebfee24c5fab04737c5e2eaa02be4559
    source_path: channels/telegram.md
    workflow: 16
---

grammY を介して、ボットの DM とグループで本番運用できます。デフォルトのトランスポートはロングポーリングで、Webhook モードは任意です。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Telegram のデフォルトの DM ポリシーはペアリングです。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復手順。
  </Card>
  <Card title="Gateway の設定" icon="settings" href="/ja-JP/gateway/configuration">
    チャネル設定の完全なパターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFather でボットトークンを作成する">
    どちらの手順でも、最後に OpenClaw へ貼り付けるトークンが得られます。いずれかを選択してください。

    - **チャット手順**: Telegram を開き、**@BotFather** とチャットし（ハンドルが正確に `@BotFather` であることを確認）、`/newbot` を実行して、指示に従い、トークンを保存します。
    - **Web 手順**: [BotFather の Web アプリ](https://t.me/BotFather?startapp)を開きます。これは [web.telegram.org](https://web.telegram.org) を含むすべての Telegram クライアントで動作します。UI でボットを作成し、そのトークンをコピーします。

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
    Telegram では `openclaw channels login telegram` を使用**しません**。設定または環境変数にトークンを設定してから、Gateway を起動してください。

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
    ボットをグループに追加してから、グループアクセスに必要な次の 2 つの ID を取得します。

    - `allowFrom` / `groupAllowFrom` に使用する、自分の Telegram ユーザー ID
    - `channels.telegram.groups` 配下のキーとして使用する、Telegram グループチャット ID

    グループチャット ID は、`openclaw logs --follow`、転送されたメッセージから ID を取得するボット、または Bot API の `getUpdates` から取得します。グループを許可した後は、`/whoami@<bot_username>` でユーザー ID とグループ ID を確認できます。

    `-100` で始まる負のスーパーグループ ID はグループチャット ID です。`groupAllowFrom` ではなく、`channels.telegram.groups` 配下に指定します。

  </Step>
</Steps>

<Note>
トークンの解決ではアカウントが考慮されます。優先順位は `tokenFile`、`botToken`、環境変数の順で、設定は常に `TELEGRAM_BOT_TOKEN` より優先されます（これはデフォルトアカウントでのみ解決されます）。正常に起動した後、OpenClaw はボットの ID 情報を最大 24 時間キャッシュするため、再起動時には追加の `getMe` 呼び出しが省略されます。トークンを変更または削除すると、このキャッシュは消去されます。
</Note>

## Telegram 側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループでの可視性">
    Telegram ボットではデフォルトで **Privacy Mode** が有効になっており、受信できるグループメッセージが制限されます。

    すべてのグループメッセージを受信するには、次のいずれかを行います。

    - `/setprivacy` でプライバシーモードを無効にする
    - ボットをグループ管理者にする

    プライバシーモードを切り替えた後、Telegram が変更を適用するように、各グループからボットを削除して再度追加してください。

  </Accordion>

  <Accordion title="グループ権限">
    管理者ステータスは Telegram のグループ設定で制御します。管理者ボットはすべてのグループメッセージを受信するため、常時稼働するグループ動作に役立ちます。
  </Accordion>

  <Accordion title="便利な BotFather の切り替え項目">

    - `/setjoingroups` — グループへの追加を許可または拒否
    - `/setprivacy` — グループでの可視性の動作

    チャットコマンドより UI を使用したい場合は、同じ設定を [BotFather の Web アプリ](https://t.me/BotFather?startapp)でも利用できます。

  </Accordion>
</AccordionGroup>

## ダッシュボード Mini App

ボットとの DM で `/dashboard` を実行すると、Telegram 内で OpenClaw ダッシュボードが開きます。

要件:

- 公開される HTTPS Mini App URL には、`gateway.tailscale.mode: "serve"` または `"funnel"` が必要です。
- 数値形式の Telegram ユーザー ID が、選択したアカウントで有効な `allowFrom`、または `commands.ownerAllowFrom` に含まれている必要があります。
- DM を使用してください。グループでは、`/dashboard` は `open this in a DM with the bot` と返信し、ボタンを送信しません。
- Docker インストール: Serve/Funnel モードでは、Gateway が `tailscaled` の隣で local loopback にバインドする必要がありますが、ポートを公開するブリッジネットワークではこれを満たせません。Gateway コンテナを `network_mode: host` で実行し、ホストの `tailscaled` ソケット（`/var/run/tailscale`）と `tailscale` CLI をコンテナにマウントしてください。

Mini App は Tailscale 専用の v1 パスであり、Telegram Web iframe はサポートしていません。

## アクセス制御とアクティベーション

### グループでのボット ID

グループとフォーラムトピックでは、設定されたボットハンドル（例: `@my_bot`）を明示的にメンションすると、エージェントのペルソナ名が Telegram ユーザー名と異なっていても、選択した OpenClaw エージェント宛てになります。無関係なトラフィックにはグループの沈黙ポリシーが引き続き適用されますが、ボットハンドル自体が「他の誰か」と見なされることはありません。

<Tabs>
  <Tab title="DM ポリシー">
    `channels.telegram.dmPolicy` はダイレクトメッセージへのアクセスを制御します。

    - `pairing`（デフォルト）
    - `allowlist`（`allowFrom` に少なくとも 1 つの送信者 ID が必要）
    - `open`（`allowFrom` に `"*"` を含める必要がある）
    - `disabled`

    `dmPolicy: "open"` と `allowFrom: ["*"]` を設定すると、ボットのユーザー名を見つけた、または推測した任意の Telegram アカウントがボットにコマンドを実行させられます。ツールを厳しく制限した、意図的に公開するボットにのみ使用してください。所有者が 1 人のボットでは、数値形式のユーザー ID を指定した `allowlist` を使用してください。

    `channels.telegram.allowFrom` は数値形式の Telegram ユーザー ID を受け付けます。`telegram:` / `tg:` プレフィックスも受け付けられ、正規化されます。
    マルチアカウント設定では、制限的なトップレベルの `channels.telegram.allowFrom` が安全境界になります。アカウントレベルの `allowFrom: ["*"]` を設定しても、マージ後の有効な許可リストに明示的なワイルドカードが引き続き含まれていない限り、そのアカウントは公開されません。
    `allowFrom` が空の `dmPolicy: "allowlist"` はすべての DM をブロックするため、設定検証で拒否されます。
    セットアップでは数値形式のユーザー ID のみを求められます。以前のセットアップで設定に `@username` の許可リストエントリがある場合は、`openclaw doctor --fix` を実行して数値 ID に解決してください（ベストエフォート。Telegram ボットトークンが必要です）。
    以前にペアリングストアの許可リストファイルに依存していた場合、`openclaw doctor --fix` は、許可リスト方式のためにエントリを `channels.telegram.allowFrom` へ復元できます（たとえば、`dmPolicy: "allowlist"` に明示的な ID がまだない場合）。

    所有者が 1 人のボットでは、以前のペアリング承認に依存するよりも、明示的な数値形式の `allowFrom` ID を指定した `dmPolicy: "allowlist"` を推奨します。

    よくある混同: DM のペアリング承認は、「この送信者がどこでも認可される」という意味ではありません。ペアリングで付与されるのは DM アクセスのみです。コマンド所有者がまだ存在しない場合、最初に承認されたペアリングによって `commands.ownerAllowFrom` も設定され、所有者専用コマンドと exec 承認に明示的なオペレーターアカウントが指定されます。グループ送信者の認可は、引き続き設定内の明示的な許可リストによって決まります。
    1 つの ID で DM とグループコマンドの両方に認可されるには、数値形式の Telegram ユーザー ID を `channels.telegram.allowFrom` に指定し、所有者専用コマンドについては `commands.ownerAllowFrom` に `telegram:<your user id>` が含まれていることを確認してください。

    ### Telegram ユーザー ID を確認する

    より安全な方法（サードパーティ製ボット不要）: ボットに DM を送り、`openclaw logs --follow` を実行して、`from.id` を確認します。

    公式 Bot API を使用する方法:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    サードパーティを使用する方法（プライバシーは低下）: `@userinfobot` または `@getidsbot`。

  </Tab>

  <Tab title="グループポリシーと許可リスト">
    次の 2 つの制御が同時に適用されます。

    1. **許可するグループ**（`channels.telegram.groups`）
       - `groups` 設定なし、`groupPolicy: "open"`: すべてのグループがグループ ID チェックを通過
       - `groups` 設定なし、`groupPolicy: "allowlist"`（デフォルト）: `groups` エントリ（または `"*"`）を追加するまで、すべてのグループをブロック
       - `groups` を設定済み: 許可リストとして機能（明示的な ID または `"*"`）

    2. **グループ内で許可する送信者**（`channels.telegram.groupPolicy`）
       - `open` / `allowlist`（デフォルト）/ `disabled`

    `groupAllowFrom` はグループの送信者をフィルタリングします。未設定の場合、Telegram は `allowFrom` にフォールバックします（ペアリングストアではありません。`2026.2.25` 以降、グループ送信者の認証は DM のペアリングストアでの承認を継承しません。これは安全境界です）。
    `groupAllowFrom` のエントリには数値形式の Telegram ユーザー ID を指定する必要があります（`telegram:` / `tg:` プレフィックスは正規化されます）。数値でないエントリは無視されます。グループまたはスーパーグループのチャット ID はここに指定しないでください。負のチャット ID は `channels.telegram.groups` 配下に指定します。
    所有者が 1 人のボットでの実用的なパターン: `channels.telegram.allowFrom` に自分のユーザー ID を設定し、`groupAllowFrom` は未設定のままにして、対象グループを `channels.telegram.groups` 配下で許可します。
    設定に `channels.telegram` がまったく存在しない場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムはフェイルクローズの `groupPolicy="allowlist"` をデフォルトとします。

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

    グループから `@<bot_username> ping` を送信してテストします。`requireMention: true` の間は、通常のグループメッセージではボットは起動しません。

    特定の 1 グループ内の全メンバーを許可する:

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

    特定の 1 グループ内で特定のユーザーのみを許可する:

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

      - 負の Telegram グループ／スーパーグループチャット ID（`-1001234567890`）は、`channels.telegram.groups` 配下に指定します。
      - Telegram ユーザー ID（`8734062810`）は、許可されたグループ内でボットを起動できるユーザーを制限するために `groupAllowFrom` に指定します。
      - 許可されたグループの任意のメンバーがボットと会話できるようにする場合にのみ、`groupAllowFrom: ["*"]` を使用します。

    </Warning>

  </Tab>

  <Tab title="メンションの動作">
    グループでの返信には、デフォルトでメンションが必要です。メンションは次のいずれかで指定できます。

    - ネイティブの `@botusername` メンション
    - `agents.list[].groupChat.mentionPatterns` または `messages.groupChat.mentionPatterns` のメンションパターン

    セッションレベルの切り替え（状態のみで永続化されません）: `/activation always`、`/activation mention`。永続化するには設定を使用します。

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

    グループ履歴のコンテキストは常に有効で、`historyLimit` によって制限されます。グループ履歴ウィンドウを無効にするには、`channels.telegram.historyLimit: 0` を設定します。`openclaw doctor --fix` は廃止された `includeGroupHistoryContext` キーを削除します。

    グループチャット ID の取得方法: グループメッセージを `@userinfobot` / `@getidsbot` に転送する、`openclaw logs --follow` で `chat.id` を確認する、Bot API の `getUpdates` を調べる、または（グループを許可した後に）`/whoami@<bot_username>` を実行します。

  </Tab>
</Tabs>

## ランタイムの動作

- Telegram は Gateway プロセス内で動作します。
- ルーティングは決定的です。Telegram から受信したメッセージへの返信は Telegram に返されます（モデルはチャンネルを選択しません）。
- 受信メッセージは、返信メタデータ、メディアプレースホルダー、および Gateway が観測した返信に対して永続化された返信チェーンコンテキストを含む共有チャンネルエンベロープに正規化されます。
- グループセッションはグループ ID ごとに分離されます。フォーラムトピックには `:topic:<threadId>` が付加されます。
- DM メッセージには `message_thread_id` を含めることができ、OpenClaw は返信時にもこれを維持します。DM トピックセッションが分割されるのは、Telegram の `getMe` がボットについて `has_topics_enabled: true` を返す場合のみです。それ以外の場合、DM はフラットなセッションのままです。
- ロングポーリングには、チャット単位・スレッド単位の順序制御を備えた grammY runner を使用します。runner の sink 同時実行数には `agents.defaults.maxConcurrent` を使用します。
- 複数アカウントの起動時には、同時実行される `getMe` プローブ数を制限し、大規模なボット群ですべてのアカウントのプローブが一斉に実行されるのを防ぎます。
- 各 Gateway プロセスはロングポーリングを保護し、1 つのボットトークンを同時に使用できるアクティブな poller を 1 つだけに制限します。`getUpdates` の 409 競合が継続する場合、同じトークンを使用している別の OpenClaw Gateway、スクリプト、または外部 poller が存在します。
- ポーリング watchdog は、完了した `getUpdates` による生存確認が 120 秒間ない場合、デフォルトで再起動します。デプロイ環境で長時間実行される処理中にポーリング停止の誤検知による再起動が発生する場合に限り、`channels.telegram.pollingStallThresholdMs`（30000-600000、アカウント単位の上書きに対応）を引き上げてください。
- Telegram Bot API は既読通知をサポートしていません（`sendReadReceipts` は適用されません）。

<Note>
  `channels.telegram.dm.threadReplies` と `channels.telegram.direct.<chatId>.threadReplies` は削除されました。設定にこれらのキーがまだ残っている場合は、アップグレード後に `openclaw doctor --fix` を実行してください。DM トピックのルーティングは、BotFather のスレッドモードで制御される Telegram の `getMe.has_topics_enabled` に従うようになりました。トピックが有効なボットでは、Telegram が `message_thread_id` を送信した場合にスレッド単位の DM セッションを使用し、それ以外の DM はフラットなセッションのままです。
</Note>

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブストリームプレビュー（メッセージ編集）">
    OpenClaw は、ダイレクトチャット、グループ、トピックで部分的な返信をリアルタイムにストリーミングします。まずプレビューメッセージを送信し、`editMessageText` を繰り返し実行して、その場で最終状態にします。

    - `channels.telegram.streaming` は `off | partial | block | progress` です（デフォルト: `partial`）
    - 短い初期回答のプレビューはデバウンスされ、実行がまだアクティブであれば、上限付きの遅延後に具体化されます
    - `progress` はツール進捗用に編集可能なステータス下書きを 1 つ維持し、ツール進捗より先に回答処理が始まった場合は安定したステータスラベルを表示し、完了時に消去して、最終回答を通常のメッセージとして送信します
    - `streaming.preview.toolProgress` は、ツール／進捗の更新で同じ編集済みプレビューメッセージを再利用するかどうかを制御します（プレビューストリーミングが有効な場合のデフォルト: `true`）
    - `streaming.preview.commandText` は、それらの行に含めるコマンド／実行の詳細を制御します。`raw`（デフォルト）または `status`（ツールラベルのみ）です
    - `streaming.progress.commentary`（デフォルト: `false`）を有効にすると、一時的な進捗下書きにアシスタントの解説／前置きテキストが含まれます
    - 旧形式の `channels.telegram.streamMode`、真偽値の `streaming`、廃止されたネイティブ下書きプレビューキーは検出されます。移行するには `openclaw doctor --fix` を実行してください

    ツール進捗行とは、ツールの実行中に表示される短いステータス更新です（コマンド実行、ファイル読み取り、計画の更新、パッチの要約、app-server モードでの Codex の前置き／解説）。Telegram ではデフォルトで有効です（`v2026.4.22` 以降のリリース済み動作と一致します）。

    回答プレビューの編集を維持しつつ、ツール進捗行を非表示にするには、次のようにします。

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

    ツール進捗を表示したまま、コマンド／実行テキストを非表示にするには、次のようにします。

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

    `progress` モードでは、最終回答をそのメッセージに編集して組み込まずにツール進捗を表示します。コマンドテキストのポリシーは `streaming.progress` の下に配置します。

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

    `streaming.mode: "off"` は、プレビュー編集を無効にし、一般的なツール／進捗メッセージを個別のステータスメッセージとして送信せず抑制します。承認プロンプト、メディア、エラーは引き続き通常の最終配信経路で送られます。`streaming.preview.toolProgress: false` は、回答プレビューの編集のみを維持します。

    <Note>
      選択された引用への返信は例外です。`replyToMode` が `first`、`all`、または `batched` で、受信メッセージに選択された引用テキストが含まれる場合、OpenClaw は回答プレビューを編集する代わりに、Telegram のネイティブ引用返信経路で最終回答を送信します。そのため、そのターンでは `streaming.preview.toolProgress` でステータス行を表示できません。選択された引用テキストを含まない現在のメッセージへの返信は、引き続きストリーミングされます。ネイティブ引用返信よりもツール進捗の可視性が重要な場合は `replyToMode: "off"` を設定し、このトレードオフを受け入れる場合は `streaming.preview.toolProgress: false` を設定してください。
    </Note>

    テキストのみの返信の場合、短いプレビューはその場で最終編集されます。複数のメッセージに分割される長い最終回答では、プレビューを最初のチャンクとして再利用し、残りの部分だけを送信します。progress モードの最終回答ではステータス下書きを消去し、通常の最終配信を使用します。完了が確認される前に最終編集が失敗した場合、OpenClaw は通常の最終配信にフォールバックし、古いプレビューをクリーンアップします。複雑な返信（メディアペイロード）の場合、OpenClaw は常に通常の最終配信にフォールバックし、プレビューをクリーンアップします。

    プレビューストリーミングとブロックストリーミングは同時に使用できません。ブロックストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためプレビューストリームをスキップします。

    推論: `/reasoning stream` は生成中に推論をライブプレビューへストリーミングし、最終配信後に推論プレビューを削除します（表示したままにするには `/reasoning on` を使用します）。最終回答は推論テキストなしで送信されます。

  </Accordion>

  <Accordion title="リッチメッセージの書式設定">
    送信テキストはデフォルトで標準の Telegram HTML メッセージを使用し、現在の各クライアントで読み取れます。太字、斜体、リンク、コード、スポイラー、引用に対応しますが、Bot API 10.1 のリッチ専用ブロック（ネイティブテーブル、詳細、リッチメディア、数式）は使用しません。

    Bot API 10.1 のリッチメッセージを有効にするには、次のようにします。

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    有効にすると、このボット／アカウントでリッチメッセージが利用可能であることがエージェントに通知されます。Markdown テキストは OpenClaw の Markdown IR を介して Telegram のリッチ HTML としてレンダリングされます。明示的なリッチ HTML ペイロードでは、Bot API 10.1 がサポートするタグ（見出し、テーブル、詳細、リッチメディア、数式）が維持されます。メディアキャプションでは引き続き Telegram HTML キャプションが使用されます（リッチメッセージはキャプションを置き換えず、キャプションの上限は 1024 文字です）。

    これにより、モデルのテキストが Telegram のリッチ Markdown 記号から分離されるため、`$400-600K` のような金額が数式として解析されません。長いリッチテキストは Telegram の制限に合わせて自動的に分割されます。20 列の上限を超えるテーブルはコードブロックにフォールバックします。

    デフォルトはオフです。これはクライアント互換性のためであり、現在の一部の Desktop、Web、Android、およびサードパーティ製クライアントでは、受理されたリッチメッセージが未対応としてレンダリングされます。ボットで使用するすべてのクライアントがレンダリングできる場合を除き、オフのままにしてください。`/status` では、現在のセッションでリッチメッセージがオンかオフかを確認できます。

    リンクプレビューはデフォルトで有効です。`channels.telegram.linkPreview: false` は、リッチテキストのエンティティ自動検出を無効にします。

  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram のコマンドメニューは、起動時に `setMyCommands` で登録されます。`commands.native: "auto"` は Telegram のネイティブコマンドを有効にします。

    カスタムコマンドのメニュー項目を追加するには、次のようにします。

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

    ルール: 名前は正規化されます（先頭の `/` を削除し、小文字化）。有効なパターンは `a-z`、`0-9`、`_`、長さは 1-32 です。カスタムコマンドでネイティブコマンドを上書きすることはできません。競合／重複はスキップされ、ログに記録されます。

    カスタムコマンドはメニュー項目にすぎず、動作を自動実装するものではありません。Plugin／skill コマンドは Telegram メニューに表示されていなくても、入力すれば引き続き動作できます。ネイティブコマンドが無効な場合、組み込みコマンドは削除されます。カスタム／Plugin コマンドは、設定されていれば引き続き登録される場合があります。

    一般的なセットアップ失敗:

    - トリム後の再試行でも `BOT_COMMANDS_TOO_MUCH` を伴って `setMyCommands failed` となる場合、メニューがまだ上限を超えています。Plugin／skill／カスタムコマンドを減らすか、`channels.telegram.commands.native` を無効にしてください。
    - Bot API への直接の curl コマンドは動作する一方、`deleteWebhook`、`deleteMyCommands`、または `setMyCommands` が `404: Not Found` で失敗する場合、通常は `channels.telegram.apiRoot` に完全な `/bot<TOKEN>` エンドポイントが設定されています。`apiRoot` には Bot API のルートのみを指定する必要があります。`openclaw doctor --fix` は、誤って末尾に付けられた `/bot<TOKEN>` を削除します。
    - `getMe returned 401` は、Telegram が設定済みのボットトークンを拒否したことを意味します。`botToken`、`tokenFile`、または `TELEGRAM_BOT_TOKEN`（デフォルトアカウント）を現在の BotFather トークンで更新してください。OpenClaw はポーリング前に停止するため、これは Webhook のクリーンアップ失敗として報告されません。
    - ネットワーク／fetch エラーを伴う `setMyCommands failed` は通常、`api.telegram.org` への送信 DNS／HTTPS がブロックされていることを意味します。

    ### デバイスペアリングコマンド（`device-pair` Plugin）

    インストールされている場合:

    1. `/pair` でセットアップコードを生成します
    2. コードを iOS アプリに貼り付けます
    3. `/pair pending` で保留中のリクエスト（ロール／スコープを含む）を一覧表示します
    4. 承認: `/pair approve <requestId>`、`/pair approve`（保留中のリクエストが 1 件のみの場合）、または `/pair approve latest`

    デバイスが変更された認証情報（ロール、スコープ、公開鍵）で再試行すると、以前の保留中リクエストは新しい `requestId` を持つリクエストに置き換えられます。承認前に `/pair pending` を再実行してください。

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

    スコープ: `off`、`dm`、`group`、`all`、`allowlist`（デフォルト）。旧形式の `capabilities: ["inlineButtons"]` は `"all"` にマッピングされます。

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

    登録済みの Plugin インタラクティブハンドラーによって処理されなかったコールバッククリックは、`callback_data: <value>` というテキストとしてエージェントに渡されます。

  </Accordion>

  <Accordion title="エージェントと自動化向けの Telegram メッセージアクション">
    アクション:

    - `sendMessage`（`to`、`content`、任意の `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` または `caption`、任意の `presentation` インラインボタン。ボタンのみの編集では返信マークアップを更新）
    - `createForumTopic`（`chatId`、`name`、任意の `iconColor`、`iconCustomEmojiId`）

    使いやすいエイリアス: `send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`。

    制御設定: `channels.telegram.actions.sendMessage`、`deleteMessage`、`reactions`、`sticker`（デフォルト: 無効）。`edit`、`createForumTopic`、`editForumTopic` は専用の切り替え設定なしでデフォルトで有効です。
    ランタイムからの送信では、起動時または再読み込み時の有効な設定とシークレットのスナップショットを使用するため、アクションパスは送信ごとに `SecretRef` の値を再解決しません。

    リアクション削除のセマンティクス: [/tools/reactions](/ja-JP/tools/reactions)。

  </Accordion>

  <Accordion title="返信スレッドタグ">
    生成される出力内で返信スレッドを明示するタグ:

    - `[[reply_to_current]]` — トリガーとなったメッセージに返信
    - `[[reply_to:<id>]]` — 特定のメッセージ ID に返信

    `channels.telegram.replyToMode`: `off`（デフォルト）、`first`、`all`。

    返信スレッドが有効で、元のテキストまたはキャプションを利用できる場合、OpenClaw はネイティブ引用の抜粋を自動的に追加します。Telegram のネイティブ引用テキストの上限は 1024 UTF-16 コード単位です。長いメッセージは先頭から引用され、Telegram が引用を拒否した場合は通常の返信にフォールバックします。

    `off` で無効になるのは暗黙的な返信スレッドのみです。明示的な `[[reply_to_*]]` タグは引き続き適用されます。

  </Accordion>

  <Accordion title="フォーラムトピックとスレッドの動作">
    フォーラムスーパーグループ: トピックのセッションキーには `:topic:<threadId>` が追加されます。返信と入力中表示は対象のトピックスレッドに送られます。トピック設定のパスは `channels.telegram.groups.<chatId>.topics.<threadId>` です。

    一般トピック（`threadId=1`）は特殊なケースです。メッセージ送信では `message_thread_id` を省略します（Telegram は `sendMessage(...thread_id=1)` を「thread not found」で拒否します）が、入力中アクションには引き続き `message_thread_id` を含めます（入力中インジケーターを表示するために必要であることが実証されています）。

    トピックのエントリは、上書きされない限りグループ設定（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）を継承します。`agentId` はトピック専用であり、グループのデフォルトから継承されません。`topics."*"` は、そのグループ内のすべてのトピックに対するデフォルトを設定します。完全一致するトピック ID は引き続き `"*"` より優先されます。

    **トピックごとのエージェントルーティング**: 各トピックは、トピック設定の `agentId` を介して異なるエージェントにルーティングでき、それぞれ独自のワークスペース、メモリ、セッションを持たせられます。

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

    これにより、各トピックには独自のセッションキーが割り当てられます。例: `agent:zu:telegram:group:-1001234567890:topic:3`。

    **永続的な ACP トピックバインディング**: フォーラムトピックでは、トップレベルの型付きバインディング（`type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`、および `-1001234567890:topic:42` のようなトピック修飾 ID を持つ `bindings[]`）を介して ACP ハーネスセッションを固定できます。現在はグループおよびスーパーグループ内のフォーラムトピックに限定されています。[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

    **チャットからのスレッドバインド ACP 起動**: `/acp spawn <agent> --thread here|auto` は現在のトピックを新しい ACP セッションにバインドします。以降のメッセージはそこへ直接ルーティングされ、OpenClaw は起動確認をトピック内に固定します。`channels.telegram.threadBindings.spawnSessions` が必要です（デフォルト: `true`）。

    テンプレートコンテキストでは `MessageThreadId` と `IsForum` を利用できます。`message_thread_id` を持つ DM チャットでは返信メタデータを保持しますが、Telegram の `getMe` が `has_topics_enabled: true` を返す場合にのみ、スレッド対応のセッションキーを使用します。
    廃止された `dm.threadReplies` および `direct.*.threadReplies` の上書き設定は削除されました。BotFather のスレッドモードが唯一の信頼できる情報源です。古い設定キーを削除するには `openclaw doctor --fix` を実行してください。

  </Accordion>

  <Accordion title="音声、動画、ステッカー">
    ### 音声メッセージ

    Telegram はボイスノートと音声ファイルを区別します。デフォルトは音声ファイルとしての動作です。エージェントの返信に `[[audio_as_voice]]` タグを付けると、ボイスノートとして強制的に送信されます。受信したボイスノートの文字起こしは、エージェントコンテキスト内で機械生成された信頼できないテキストとして扱われますが、メンション検出では引き続き未加工の文字起こしを使用するため、メンションを必須とするボイスメッセージも引き続き機能します。

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

    ### 位置情報と会場

    1 つの独立した `location` オブジェクトとともに、既存の `send` アクションを使用します。座標を指定するとネイティブのピンが送信され、`name` と `address` の両方を追加するとネイティブの会場カードが送信されます。位置情報の送信をメッセージテキストやメディアと組み合わせることはできません。

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

    受信時: 静的 WEBP はダウンロードされて処理されます（プレースホルダー `<media:sticker>`）。アニメーション TGS と動画 WEBM はスキップされます。

    ステッカーのコンテキストフィールド: `Sticker.emoji`、`Sticker.setName`、`Sticker.fileId`、`Sticker.fileUniqueId`、`Sticker.cachedDescription`。説明は、ビジョン呼び出しの繰り返しを減らすため、OpenClaw SQLite Plugin状態にキャッシュされます。

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
    Telegramのリアクションは、メッセージペイロードとは別の`message_reaction`更新として届きます。有効にすると、OpenClawは`Telegram reaction added: 👍 by Alice (@alice) on msg 42`のようなシステムイベントをキューに追加します。

    - `channels.telegram.reactionNotifications`: `off | own | all`（デフォルト: `own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（デフォルト: `minimal`）

    `own`は、ボットが送信したメッセージに対するユーザーのリアクションのみを意味します（送信済みメッセージのキャッシュによるベストエフォート）。リアクションイベントには引き続きTelegramのアクセス制御（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）が適用され、許可されていない送信者は破棄されます。

    Telegramはリアクション更新でスレッドIDを提供しません。フォーラムではないグループはグループチャットセッションにルーティングされ、フォーラムグループは正確な発生元トピックではなく、一般トピックセッション（`:topic:1`）にルーティングされます。

    ポーリング/Webhookの`allowed_updates`には、`message_reaction`が自動的に含まれます。

  </Accordion>

  <Accordion title="確認リアクション">
    `ackReaction`は、OpenClawが受信メッセージを処理している間に確認用の絵文字を送信します。`messages.ackReactionScope`は、それを送信する*タイミング*を決定します。

    **絵文字の解決順序:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - エージェントIDの絵文字へのフォールバック（`agents.list[].identity.emoji`、なければ「👀」）

    TelegramではUnicode絵文字（例:「👀」）が必要です。チャンネルまたはアカウントでリアクションを無効にするには`""`を使用します。

    **スコープ（`messages.ackReactionScope`、デフォルトは`"group-mentions"`。現在、TelegramアカウントまたはTelegramチャンネルによるオーバーライドはありません）:**

    `all`（DM + グループ。アンビエントルームイベントを含む）、`direct`（DMのみ）、`group-all`（アンビエントルームイベントを除くすべてのグループメッセージ。DMは対象外）、`group-mentions`（ボットがメンションされたグループ。**DMは対象外** — デフォルト）、`off` / `none`（無効）。

    <Note>
    デフォルトのスコープ（`group-mentions`）では、DMまたはアンビエントルームイベントに対して確認リアクションは送信されません。DMには`direct`または`all`を使用してください。アンビエントルームイベントに確認リアクションを送信するのは`all`のみです。この値はTelegramプロバイダーの起動時に読み込まれるため、変更を反映するにはGatewayの再起動が必要です。
    </Note>

  </Accordion>

  <Accordion title="Telegramイベントとコマンドからの設定書き込み">
    チャンネル設定の書き込みはデフォルトで有効です（`configWrites !== false`）。Telegramによってトリガーされる書き込みには、グループ移行イベント（`migrate_to_chat_id`、`channels.telegram.groups`を更新）と、`/config set` / `/config unset`（コマンドの有効化が必要）が含まれます。

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

  <Accordion title="ロングポーリングとWebhook">
    デフォルトはロングポーリングです。Webhookモードでは、`channels.telegram.webhookUrl`と`channels.telegram.webhookSecret`を設定します。オプションとして、`webhookPath`（デフォルトは`/telegram-webhook`）、`webhookHost`（デフォルトは`127.0.0.1`）、`webhookPort`（デフォルトは`8787`）、`webhookCertPath`（直接IPまたはドメインなしのセットアップ用の自己署名証明書PEM）を設定できます。

    ロングポーリングモードでは、OpenClawは更新のディスパッチに成功した後にのみ再起動ウォーターマークを永続化します。ハンドラーが失敗した場合、その更新を完了済みとしてマークせず、同じプロセス内で再試行可能な状態に保ちます。

    ローカルリスナーは、デフォルトで`127.0.0.1:8787`にバインドします。公開イングレスには、ローカルポートの前段にリバースプロキシを配置するか、意図的に`webhookHost: "0.0.0.0"`を設定します。

    Webhookモードでは、リクエストガード、Telegramのシークレットトークン、JSON本文を検証し、空の`200`を返す前に更新を永続イングレスキューへコミットします。永続的な受け入れに成功した場合は`x-openclaw-delivery-accepted: durable`が含まれます。ヘルス、ルーティング、認証、検証、ストレージエラーのレスポンスでは、このヘッダーは省略されます。リバースプロキシやホストコントローラーは、レスポンスのタイミングから受け入れを推測することなく、OpenClawによる受け入れと一般的な空の`200`を区別するために、このヘッダーを必須にできます。

    その後、OpenClawはロングポーリングと同じチャット単位/トピック単位のボットレーンを通じて更新を非同期に処理するため、エージェントの処理に時間がかかってもTelegramの配信ACKを保留しません。

  </Accordion>

  <Accordion title="制限、再試行、CLI ターゲット">
    - `channels.telegram.textChunkLimit` のデフォルトは 4000。`streaming.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    - `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信メディアのサイズを制限します。
    - `channels.telegram.mediaGroupFlushMs`（デフォルト 500、範囲 10-60000）は、OpenClaw がアルバム／メディアグループを 1 件の受信メッセージとしてディスパッチするまでにバッファリングする時間を制御します。アルバムの一部が遅れて届く場合は増やし、アルバムへの返信遅延を減らす場合は減らしてください。
    - `channels.telegram.timeoutSeconds` は API クライアントのタイムアウトを上書きします（未設定の場合は grammY のデフォルトが適用されます）。Bot クライアントは、設定値が 60 秒の送信テキスト／入力中リクエストガードを下回る場合、そのガード未満にならないよう制限します。これにより、OpenClaw のトランスポートガードとフォールバックが実行される前に、grammY がユーザーに表示される返信の配信を中止することを防ぎます。ロングポーリングでは引き続き 45 秒の `getUpdates` リクエストガードを使用し、アイドル状態のポーリングが無期限に放棄されないようにします。
    - `channels.telegram.pollingStallThresholdMs` のデフォルトは 120000 です。ポーリング停止の誤検知による再起動に対してのみ、30000 から 600000 の範囲で調整してください。
    - グループコンテキスト履歴では `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト 50）を使用します。`0` で無効になります。
    - Gateway が親メッセージを観測済みの場合、返信／引用／転送の補足コンテキストは、選択された 1 つの会話コンテキストウィンドウに正規化されます。観測済みメッセージのキャッシュは OpenClaw SQLite Plugin 状態に保存され、`openclaw doctor --fix` が従来のサイドカーファイルをインポートします。Telegram は更新ごとに浅い `reply_to_message` を 1 つしか含めないため、キャッシュより古いチェーンはそのペイロードの範囲に制限されます。
    - Telegram の許可リストは、主に誰がエージェントをトリガーできるかを制限するものであり、補足コンテキスト全体の秘匿化境界ではありません。
    - DM 履歴：`channels.telegram.dmHistoryLimit`、`channels.telegram.dms["<user_id>"].historyLimit`。
    - `channels.telegram.retry` は、回復可能な送信 API エラーに対する Telegram 送信ヘルパー（CLI／ツール／アクション）に適用されます。受信メッセージへの最終返信の配信では、接続前の失敗に対して回数制限付きの安全な送信再試行を使用しますが、表示されるメッセージが重複する可能性のある、送信後の曖昧なネットワークエンベロープは再試行しません。

    CLI およびメッセージツールの送信ターゲットには、数値チャット ID、ユーザー名、またはフォーラムトピックターゲットを指定できます。

```bash
openclaw message send --channel telegram --target 123456789 --message "こんにちは"
openclaw message send --channel telegram --target @name --message "こんにちは"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "トピックへのこんにちは"
```

    投票では `openclaw message poll` を使用し、フォーラムトピックにも対応しています。

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "リリースしますか？" --poll-option "はい" --poll-option "いいえ"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "時間を選択" --poll-option "午前10時" --poll-option "午後2時" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 専用の投票フラグ：`--poll-duration-seconds`（5-600）、`--poll-anonymous`、`--poll-public`、`--thread-id`（または `:topic:` ターゲット）。`--poll-option` は 2-12 回繰り返します（Telegram の選択肢上限）。

    Telegram 送信では、インラインキーボード用の `buttons` ブロックを含む `--presentation`（`channels.telegram.capabilities.inlineButtons` で許可されている場合）、Bot がそのチャットでピン留めできる場合にピン留め配信を要求する `--pin` または `--delivery '{"pin":true}'`、および送信画像、GIF、動画を圧縮画像／アニメーション／動画としてではなくドキュメントとして送信する `--force-document` もサポートしています。

    アクションの制限：`channels.telegram.actions.sendMessage=false` は投票を含むすべての送信メッセージを無効にします。`channels.telegram.actions.poll=false` は通常の送信を有効のままにして、投票の作成を無効にします。

  </Accordion>

  <Accordion title="Telegram での実行承認">
    Telegram は承認者の DM での実行承認をサポートし、必要に応じて元のチャットまたはトピックにプロンプトを投稿できます。承認者には数値の Telegram ユーザー ID を指定する必要があります。

    - `channels.telegram.execApprovals.enabled`（少なくとも 1 人の承認者を解決できる場合、`"auto"` で有効化）
    - `channels.telegram.execApprovals.approvers`（`commands.ownerAllowFrom` の数値オーナー ID にフォールバック）
    - `channels.telegram.execApprovals.target`：`dm`（デフォルト）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom`、`defaultTo` は、誰が Bot と会話できるか、および通常の返信をどこへ送信するかを制御します。これらを設定しても、誰かが実行承認者になるわけではありません。コマンドオーナーがまだ存在しない場合、最初に承認された DM ペアリングによって `commands.ownerAllowFrom` が初期設定されるため、オーナーが 1 人の構成では `execApprovals.approvers` に ID を重複して指定せずに動作します。

    チャンネル配信ではコマンドテキストがチャットに表示されます。`channel` または `both` は、信頼できるグループ／トピックでのみ有効にしてください。プロンプトがフォーラムトピックに届いた場合、OpenClaw は承認プロンプトとその後のやり取りでトピックを維持します。実行承認はデフォルトで 30 分後に期限切れになります。

    インライン承認ボタンを使用するには、`channels.telegram.capabilities.inlineButtons` で対象サーフェス（`dm`、`group`、または `all`）が許可されている必要もあります。`plugin:` で始まる承認 ID は Plugin 承認によって解決され、それ以外は最初に実行承認によって解決されます。

    [実行承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## エラー返信の制御

エージェントで配信エラーまたはプロバイダーエラーが発生した場合、エラーポリシーによってエラーメッセージを Telegram チャットに送信するかどうかが制御されます。

| キー                                | 値                         | デフォルト      | 説明                                                                                                                                                                                                 |
| ----------------------------------- | -------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`、`once`、`silent` | `always`        | `always` はすべてのエラーメッセージをチャットへ送信します。`once` はクールダウン期間ごとに一意のエラーメッセージを 1 回送信します（同一エラーの繰り返しを抑制します）。`silent` はエラーメッセージをチャットへ送信しません。 |
| `channels.telegram.errorCooldownMs` | 数値（ms）                 | `14400000`（4h） | `once` ポリシーのクールダウン期間です。エラーの送信後、この期間が経過するまで同じメッセージは抑制されます。障害発生中のエラースパムを防ぎます。                                                        |

アカウントごと、グループごと、トピックごとの上書きがサポートされています（他の Telegram 設定キーと同じ継承方式）。

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

    - `requireMention=false` の場合、Telegram のプライバシーモードで完全な表示を許可する必要があります。BotFather で `/setprivacy` -> Disable を選択し、その後 Bot をグループから削除して再追加してください。
    - 設定でメンションのないグループメッセージを想定している場合、`openclaw channels status` が警告します。
    - `openclaw channels status --probe` は、明示的な数値グループ ID を確認します。ワイルドカード `"*"` のメンバーシップはプローブできません。
    - 簡易セッションテスト：`/activation always`。

  </Accordion>

  <Accordion title="Bot がグループメッセージをまったく認識しない">

    - `channels.telegram.groups` が存在する場合、グループを一覧に含める必要があります（または `"*"` を含めます）。
    - Bot がグループのメンバーであることを確認してください。
    - スキップ理由について `openclaw logs --follow` を確認してください。

  </Accordion>

  <Accordion title="コマンドが一部しか動作しない、またはまったく動作しない">

    - 送信者のアイデンティティを許可してください（ペアリングおよび／または数値の `allowFrom`）。グループポリシーが `open` の場合でも、コマンドの認可は引き続き適用されます。
    - `BOT_COMMANDS_TOO_MUCH` を伴う `setMyCommands failed` は、ネイティブメニューの項目が多すぎることを意味します。Plugin／skill／カスタムコマンドを減らすか、ネイティブメニューを無効にしてください。
    - 起動時の `deleteMyCommands`／`setMyCommands` 呼び出し、および `sendChatAction` の入力中呼び出しには時間制限があり、リクエストタイムアウト時に Telegram のトランスポートフォールバックを通じて 1 回再試行されます。ネットワーク／fetch エラーが継続する場合、通常は `api.telegram.org` への DNS／HTTPS が到達不能です。

  </Accordion>

  <Accordion title="起動時に未認証トークンが報告される">

    - `getMe returned 401` は、設定された Bot トークンに対する Telegram の認証失敗です。BotFather でトークンを再コピーまたは再生成してから、`channels.telegram.botToken`、`tokenFile`、`accounts.<id>.botToken`、または `TELEGRAM_BOT_TOKEN`（デフォルトアカウント）を更新してください。
    - 起動時の `deleteWebhook 401 Unauthorized` も認証失敗です。これを「Webhook が存在しない」として扱っても、同じ不正なトークンによる失敗が後続の API 呼び出しまで延期されるだけです。

  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">

    - カスタム fetch／プロキシを使用する Node 22+ では、`AbortSignal` の型が一致しない場合、即時中止動作が発生する可能性があります。
    - 一部のホストでは `api.telegram.org` が最初に IPv6 に解決されます。IPv6 の外向き通信に問題があると、断続的な API エラーが発生します。
    - `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` を含むログは、回復可能なネットワークエラーとして再試行されます。
    - ポーリング起動時、OpenClaw は成功した起動時の `getMe` プローブを grammY に再利用するため、ランナーは最初の `getUpdates` の前に 2 回目の `getMe` を実行する必要がありません。
    - ポーリング起動時に一時的なネットワークエラーで `deleteWebhook` が失敗した場合、OpenClaw はポーリング前に別のコントロールプレーン呼び出しを行わず、ロングポーリングへ進みます。Webhook がまだ有効な場合は `getUpdates` の競合として表面化し、OpenClaw はトランスポートを再構築して Webhook のクリーンアップを再試行します。
    - Telegram ソケットが短い一定間隔で再作成される場合は、`channels.telegram.timeoutSeconds` が小さすぎないか確認してください。Bot クライアントは、送信および `getUpdates` のリクエストガードを下回る設定値をそのガード未満にならないよう制限しますが、古いリリースではこの値をガード未満に設定すると、すべてのポーリングまたは返信が中止される可能性がありました。
    - ログの `Polling stall detected` は、完了したロングポーリングの生存確認がデフォルトで 120 秒間ないため、OpenClaw がポーリングを再起動してトランスポートを再構築したことを意味します。
    - `openclaw channels status --probe` と `openclaw doctor` は、実行中のポーリングアカウントが起動猶予期間後も `getUpdates` を完了していない場合、実行中の Webhook アカウントが起動猶予期間後も `setWebhook` を完了していない場合、または最後に成功したポーリングトランスポートのアクティビティが古い場合に警告します。
    - 長時間実行される `getUpdates` 呼び出しが正常であるにもかかわらず、ホストでポーリング停止の誤検知による再起動が報告される場合にのみ、`channels.telegram.pollingStallThresholdMs` を増やしてください。停止が継続する場合、通常は `api.telegram.org` へのプロキシ、DNS、IPv6、または TLS の外向き通信に問題があります。
    - Telegram は Bot API トランスポートでプロセスのプロキシ環境変数を使用します：`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、およびそれぞれの小文字形式。`NO_PROXY`／`no_proxy` によって `api.telegram.org` が引き続きプロキシを迂回する場合があります。
    - サービス環境で `OPENCLAW_PROXY_URL` が設定され、標準のプロキシ環境変数が存在しない場合、Telegram はその URL を Bot API トランスポートにも使用します。
    - 直接の外向き通信／TLS が不安定な VPS ホストでは、Telegram API 呼び出しをプロキシ経由にしてください。

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ のデフォルトは `autoSelectFamily=true` です（WSL2 を除く）。Telegram の DNS 結果順序は、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`、プロセスのデフォルト（例：`NODE_OPTIONS=--dns-result-order=ipv4first`）の順で使用され、いずれも適用されない場合は Node 22+ で `ipv4first` にフォールバックします。
    - WSL2、または IPv4 のみの動作の方が安定する場合は、アドレスファミリーの選択を固定してください。

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 ベンチマーク範囲の応答（`198.18.0.0/15`）は、Telegram のメディアダウンロードではデフォルトですでに許可されています。信頼できる fake-IP または透過プロキシが、メディアダウンロード中に `api.telegram.org` を別のプライベート／内部／特殊用途アドレスへ書き換える場合は、Telegram 専用のバイパスを明示的に有効化します。

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同じ明示的な有効化は、アカウントごとに `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` でも設定できます。
    - プロキシが Telegram のメディアホストを `198.18.x.x` に解決する場合は、まず危険なフラグをオフのままにしてください。この範囲はデフォルトですでに許可されています。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` は、Telegram メディアの SSRF 保護を弱めます。RFC 2544 ベンチマーク範囲外のプライベートまたは特殊用途の応答を生成する、信頼できる運用者管理のプロキシ環境（Clash、Mihomo、Surge の fake-IP ルーティング）でのみ使用してください。通常の公開インターネット経由で Telegram にアクセスする場合は、オフのままにしてください。
    </Warning>

    - 一時的な環境変数による上書き：`OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`。
    - DNS 応答を検証します。

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

詳細なヘルプ：[チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。

## 設定リファレンス

主要リファレンス：[設定リファレンス - Telegram](/ja-JP/gateway/config-channels#telegram)。

<Accordion title="重要度の高い Telegram フィールド">

- 起動／認証：`enabled`、`botToken`、`tokenFile`（通常ファイルである必要があります。シンボリックリンクは拒否されます）、`accounts.*`
- アクセス制御：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、トップレベルの `bindings[]`（`type: "acp"`）
- トピックのデフォルト：`groups.<chatId>.topics."*"` は一致しないフォーラムトピックに適用され、正確なトピック ID がこれを上書きします
- exec 承認：`execApprovals`、`accounts.*.execApprovals`
- コマンド／メニュー：`commands.native`、`commands.nativeSkills`、`customCommands`
- スレッド／返信：`replyToMode`、`threadBindings`
- ストリーミング：`streaming`（モードは `off | partial | block | progress`）、`streaming.preview.toolProgress`
- 書式設定／配信：`textChunkLimit`、`streaming.chunkMode`、`richMessages`、`markdown.tables`（`off | bullets | code | block`）、`linkPreview`、`responsePrefix`
- メディア／ネットワーク：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- カスタム API ルート：`apiRoot`（Bot API ルートのみ。`/bot<TOKEN>` は含めないでください）、`trustedLocalFileRoots`（セルフホスト Bot API の絶対 `file_path` ルート）
- Webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`、`webhookPort`、`webhookCertPath`
- アクション／機能：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- リアクション：`reactionNotifications`、`reactionLevel`
- エラー：`errorPolicy`、`errorCooldownMs`、`silentErrorReplies`
- 書き込み／履歴：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
複数アカウントの優先順位：2 つ以上のアカウント ID を設定している場合は、デフォルトのルーティングを明示するために `channels.telegram.defaultAccount` を設定してください（または `channels.telegram.accounts.default` を含めてください）。それ以外の場合、OpenClaw は正規化された最初のアカウント ID にフォールバックし、`openclaw doctor` が警告します。名前付きアカウントは `channels.telegram.allowFrom` / `groupAllowFrom` を継承しますが、`accounts.default.*` の値は継承しません。
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
