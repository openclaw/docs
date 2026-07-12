---
read_when:
    - Discord チャンネル機能の開発
summary: Discord ボットのセットアップ、設定キー、コンポーネント、音声、トラブルシューティング
title: Discord
x-i18n:
    generated_at: "2026-07-11T22:00:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw は、公式の Discord gateway を介してボットとして Discord に接続します。DM とギルドチャンネルに対応しています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord の DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

ボットを含む Discord アプリケーションを作成し、ボットをサーバーに追加して、OpenClaw とペアリングします。可能であればプライベートサーバーを使用してください。必要な場合は、先に[サーバーを作成](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)します（**Create My Own > For me and my friends**）。

<Steps>
  <Step title="Discord アプリケーションとボットを作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) で **New Application** をクリックし、名前を付けます（例：「OpenClaw」）。

    サイドバーで **Bot** を開き、**Username** をエージェントの名前に設定します。

  </Step>

  <Step title="特権インテントを有効にする">
    引き続き **Bot** ページの **Privileged Gateway Intents** で、次を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロール許可リスト、名前から ID への照合、チャンネル対象者アクセスグループに必須）
    - **Presence Intent**（任意。プレゼンス更新にのみ使用）

  </Step>

  <Step title="ボットトークンをコピーする">
    **Bot** ページで **Reset Token** をクリックし、トークンをコピーします。

    <Note>
    この名前に反して、ここでは最初のトークンが生成されます。何かが「リセット」されるわけではありません。
    </Note>

  </Step>

  <Step title="招待 URL を生成してボットをサーバーに追加する">
    サイドバーで **OAuth2** を開きます。**OAuth2 URL Generator** で、次のスコープを有効にします。

    - `bot`
    - `applications.commands`

    表示される **Bot Permissions** セクションで、少なくとも次を有効にします。

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（任意）

    これは通常のテキストチャンネルに必要な基本設定です。フォーラムやメディアチャンネルでスレッドを作成または継続するワークフローなど、ボットがスレッドに投稿する場合は、**Send Messages in Threads** も有効にします。

    生成された URL をコピーしてブラウザで開き、サーバーを選択して **Continue** をクリックします。これでボットがサーバーに表示されます。

  </Step>

  <Step title="Developer Mode を有効にして ID を収集する">
    ID をコピーできるように、Discord アプリで Developer Mode を有効にします。

    1. **User Settings**（歯車アイコン）→ **Developer** → **Developer Mode** をオン
       *（モバイルでは **App Settings** → **Advanced**）*
    2. **サーバーアイコン**を右クリック → **Copy Server ID**
    3. **自分のアバター**を右クリック → **Copy User ID**

    Server ID と User ID をボットトークンと一緒に保管してください。次の手順では、この 3 つがすべて必要です。

  </Step>

  <Step title="サーバーメンバーからの DM を許可する">
    ペアリングを機能させるには、Discord でボットから自分への DM を許可する必要があります。**サーバーアイコン**を右クリック → **Privacy Settings** → **Direct Messages** をオンにします。

    OpenClaw で Discord の DM を使用する場合は、この設定をオンのままにします。ギルドチャンネルのみを使用する場合は、ペアリング後に無効にできます。

  </Step>

  <Step title="ボットトークンを安全に設定する（チャットでは送信しない）">
    ボットトークンはシークレットです。エージェントにメッセージを送る前に、OpenClaw を実行しているマシンで設定します。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    OpenClaw がすでにバックグラウンドサービスとして実行されている場合は、OpenClaw Mac アプリを使用するか、`openclaw gateway run` プロセスを停止して再起動します。
    管理対象サービスとしてインストールしている場合は、`DISCORD_BOT_TOKEN` が設定されたシェルから `openclaw gateway install` を実行するか、変数を `~/.openclaw/.env` に保存し、再起動後にサービスが環境変数の SecretRef を解決できるようにします。
    ホストが Discord の起動時アプリケーション検索によってブロックまたはレート制限される場合は、起動時にその REST 呼び出しを省略できるよう、Developer Portal のアプリケーション／クライアント ID を設定します。デフォルトアカウントでは `channels.discord.applicationId`、ボットごとでは `channels.discord.accounts.<accountId>.applicationId` を使用します。

  </Step>

  <Step title="OpenClaw を設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼">
        既存のチャンネル（Telegram など）で OpenClaw エージェントとチャットし、次のように伝えます。Discord が最初のチャンネルの場合は、代わりに CLI／設定タブを使用します。

        > 「Discord ボットトークンは設定済みです。User ID `<user_id>` と Server ID `<server_id>` を使用して Discord のセットアップを完了してください。」
      </Tab>
      <Tab title="CLI／設定">
        ファイルベースの設定：

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        デフォルトアカウント用の環境変数フォールバック：

```bash
DISCORD_BOT_TOKEN=...
```

        スクリプトまたはリモートでセットアップする場合は、同じ JSON5 ブロックをファイルに書き込み、`openclaw config patch --file ./discord.patch.json5 --dry-run` を実行してから、`--dry-run` なしでもう一度実行します。プレーンテキストの `token` 文字列も使用でき、`channels.discord.token` では env/file/exec プロバイダーの SecretRef 値にも対応しています。[シークレット管理](/ja-JP/gateway/secrets)を参照してください。

        複数の Discord ボットを使用する場合は、各ボットのトークンとアプリケーション ID をそれぞれのアカウント配下に保持します。最上位の `channels.discord.applicationId` は各アカウントに継承されるため、すべてのアカウントが同じアプリケーション ID を使用する場合にのみ、そこへ設定してください。

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="最初の DM ペアリングを承認する">
    gateway が起動したら、Discord でボットに DM を送ります。ボットからペアリングコードが返信されます。

    <Tabs>
      <Tab title="エージェントに依頼">
        既存のチャンネルでエージェントにペアリングコードを送信します。

        > 「この Discord ペアリングコードを承認してください：`<CODE>`」
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    ペアリングコードは 1 時間後に期限切れになります。承認後は、Discord の DM でエージェントとチャットできます。

  </Step>
</Steps>

<Note>
トークンの解決はアカウントを考慮して行われます。設定内のトークン値が環境変数のフォールバックより優先され、`DISCORD_BOT_TOKEN` はデフォルトアカウントにのみ使用されます。
有効な 2 つの Discord アカウントが同じボットトークンに解決された場合、OpenClaw はそのトークンに対して gateway モニターを 1 つだけ起動します。設定由来のトークンが環境変数のフォールバックより優先されます。それ以外の場合は、最初の有効なアカウントが優先され、重複するアカウントは理由 `duplicate bot token` とともに無効として報告されます。
高度な送信呼び出し（メッセージツール／チャンネルアクション）では、呼び出しごとに明示した `token` がその呼び出しに使用されます。これは、送信アクションと読み取り／プローブ形式のアクション（read/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシーと再試行設定は、引き続きアクティブなランタイムスナップショットで選択されたアカウントから取得されます。
</Note>

## 推奨：ギルドワークスペースをセットアップする

DM が機能したら、サーバーを完全なワークスペースにできます。各チャンネルには、それぞれ独自のコンテキストを持つエージェントセッションが割り当てられます。自分とボットだけが参加するプライベートサーバーに推奨します。

<Steps>
  <Step title="サーバーをギルド許可リストに追加する">
    これにより、エージェントは DM だけでなく、サーバー上の任意のチャンネルで応答できるようになります。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「Discord Server ID `<server_id>` をギルド許可リストに追加してください」
      </Tab>
      <Tab title="設定">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="@メンションなしの応答を許可する">
    デフォルトでは、エージェントはギルドチャンネルで @メンションされた場合にのみ応答します。プライベートサーバーでは、すべてのメッセージに応答させることが一般的です。

    ギルドチャンネルでは、通常の返信はデフォルトで自動的に投稿されます。常時稼働する共有ルームでは、`messages.groupChat.visibleReplies: "message_tool"` を明示的に有効にすると、エージェントは待機し、チャンネルへの返信が有用だと判断した場合にのみ投稿できます。これは GPT-5.6 Sol のような、最新世代でツールの信頼性が高いモデルを使用すると最も効果的です。ツールが送信しない限り、アンビエントルームイベントは通知されません。待機モードの完全な設定については、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を参照してください。

    Discord に入力中と表示され、ログにトークン使用量が記録されているにもかかわらずメッセージが投稿されない場合は、そのターンがアンビエントルームイベントとして設定されていたか、メッセージツールによる表示返信が有効になっていたかを確認してください。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「このサーバーで、@メンションされなくてもエージェントが応答できるようにしてください」
      </Tab>
      <Tab title="設定">
        ギルド設定で `requireMention: false` を設定します。

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

        表示されるグループ／チャンネル返信でメッセージツールによる送信を必須にするには、`messages.groupChat.visibleReplies: "message_tool"` を設定します。

      </Tab>
    </Tabs>

  </Step>

  <Step title="ギルドチャンネルでのメモリ利用を計画する">
    長期メモリ（MEMORY.md）は DM セッションでのみ自動的に読み込まれます。ギルドチャンネルでは読み込まれません。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「Discord チャンネルで質問したとき、MEMORY.md の長期コンテキストが必要な場合は memory_search または memory_get を使用してください。」
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有するコンテキストについては、安定した指示を `AGENTS.md` または `USER.md` に記述します（各セッションに注入されます）。長期的なメモは `MEMORY.md` に保存し、必要に応じてメモリツールでアクセスします。
      </Tab>
    </Tabs>

  </Step>
</Steps>

これでチャンネルを作成してチャットを開始できます。エージェントはチャンネル名を認識し、各チャンネルは分離されたセッションになります。ワークフローに合わせて `#coding`、`#home`、`#research` などをセットアップしてください。

## ランタイムモデル

- Gateway が Discord 接続を管理します。
- 返信のルーティングは決定的です。Discord から受信したメッセージへの返信は Discord に返されます。
- Discord のギルド／チャンネルメタデータは、ユーザーに表示される返信プレフィックスではなく、信頼できないコンテキストとしてモデルプロンプトに追加されます。モデルがそのエンベロープを返信にコピーした場合、OpenClaw は送信返信と今後の再生コンテキストから、コピーされたメタデータを削除します。
- デフォルト（`session.dmScope=main`）では、ダイレクトチャットはエージェントのメインセッション（`agent:main:main`）を共有します。
- ギルドチャンネルには分離されたセッションキー（`agent:<agentId>:discord:channel:<channelId>`）が割り当てられます。
- グループ DM はデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブのスラッシュコマンドは分離されたコマンドセッション（`agent:<agentId>:discord:slash:<userId>`）で実行されますが、ルーティング先の会話セッションへの `CommandTargetSessionKey` は引き続き保持されます。
- Discord へのテキストのみの Cron／Heartbeat 通知配信は、アシスタントに表示される最終回答にまとめられ、1 回だけ送信されます。エージェントが配信可能な複数のペイロードを出力した場合、メディアおよび構造化コンポーネントのペイロードは複数メッセージのまま維持されます。

## フォーラムチャンネル

Discord のフォーラムチャンネルとメディアチャンネルでは、スレッド投稿のみ受け付けられます。OpenClaw では、次の 2 つの方法でスレッド投稿を作成できます。

- フォーラムの親 (`channel:<forumId>`) にメッセージを送信すると、スレッドが自動作成されます。スレッドのタイトルには、メッセージの最初の空でない行が使用されます（Discord のスレッド名の上限である100文字に切り詰められます）。
- スレッドを直接作成するには、`openclaw message thread create` を使用します。フォーラムチャンネルでは `--message-id` を渡さないでください。

フォーラムの親に送信してスレッドを作成します。

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

フォーラムスレッドを明示的に作成します。

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

フォーラムの親は Discord コンポーネントを受け付けません。コンポーネントが必要な場合は、スレッド自体 (`channel:<threadId>`) に送信してください。

## インタラクティブコンポーネント

OpenClaw は、エージェントメッセージ用に Discord コンポーネント v2 コンテナをサポートしています。`components` ペイロードを指定してメッセージツールを使用します。インタラクションの結果は通常の受信メッセージとしてエージェントにルーティングされ、既存の Discord `replyToMode` 設定に従います。

サポートされているブロック:

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- アクション行には、最大5個のボタンまたは単一の選択メニューを配置できます
- 選択タイプ: `string`、`user`、`role`、`mentionable`、`channel`

デフォルトでは、コンポーネントは1回だけ使用できます。ボタン、選択項目、フォームを期限切れまで複数回使用できるようにするには、`components.reusable=true` を設定します。

ボタンをクリックできるユーザーを制限するには、そのボタンに `allowedUsers`（Discord ユーザー ID、タグ、または `*`）を設定します。一致しないユーザーには、本人だけに見える拒否メッセージが表示されます。

コンポーネントのコールバックは、デフォルトで30分後に期限切れになります。デフォルトアカウントのコールバックレジストリの有効期間を変更するには `channels.discord.agentComponents.ttlMs` を設定し、アカウントごとに変更するには `channels.discord.accounts.<accountId>.agentComponents.ttlMs` を設定します。値の単位はミリ秒で、正の整数である必要があり、上限は `86400000`（24時間）です。長い TTL は、ボタンを継続して使用可能にする必要があるレビューや承認のワークフローに適していますが、古い Discord メッセージから引き続きアクションを実行できる期間も長くなります。要件を満たす最短の TTL を選び、古いコールバックが意外な動作につながる場合はデフォルトのままにしてください。

`/model` および `/models` スラッシュコマンドは、プロバイダー、モデル、互換性のあるランタイムのドロップダウンと Submit ステップを備えたインタラクティブなモデル選択画面を開きます。`/models add` は非推奨であり、チャットからモデルを登録する代わりに非推奨メッセージを返します。選択画面の応答は本人だけに表示され、呼び出したユーザーのみが使用できます。Discord の選択メニューは25個の選択肢に制限されているため、`openai` や `vllm` など、選択したプロバイダーについてのみ動的に検出されたモデルを選択画面に表示する場合は、`agents.defaults.models` に `provider/*` エントリを追加します。

ファイル添付:

- `file` ブロックは添付ファイル参照 (`attachment://<filename>`) を指す必要があります
- 添付ファイルは `media`/`path`/`filePath`（単一ファイル）で指定します。複数ファイルには `media-gallery` を使用します
- アップロード名を添付ファイル参照と一致させる必要がある場合は、`filename` を使用して上書きします

モーダルフォーム:

- 最大5個のフィールドを持つ `components.modal` を追加します
- フィールドタイプ: `text`、`checkbox`、`radio`、`select`、`role-select`、`user-select`
- OpenClaw はトリガーボタンを自動的に追加します

例:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.discord.dmPolicy` は DM へのアクセスを制御します。`channels.discord.allowFrom` は正規の DM 許可リストです。

    - `pairing`（デフォルト）
    - `allowlist`（少なくとも1つの `allowFrom` 送信者が必要）
    - `open`（`channels.discord.allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    DM ポリシーが `open` でない場合、不明なユーザーはブロックされます（または `pairing` モードではペアリングを求められます）。

    複数アカウントでの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 1つのアカウントでは、`allowFrom` が従来の `dm.allowFrom` より優先されます。
    - 名前付きアカウントでは、独自の `allowFrom` と従来の `dm.allowFrom` が未設定の場合、`channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    従来の `channels.discord.dm.policy` と `channels.discord.dm.allowFrom` は、互換性のため引き続き読み込まれます。アクセスを変更せずに移行できる場合、`openclaw doctor --fix` によって `dmPolicy` と `allowFrom` に移行されます。

    配信用の DM ターゲット形式:

    - `user:<id>`
    - `<@id>` メンション

    チャンネルのデフォルトが有効な場合、通常、修飾されていない数値 ID はチャンネル ID として解決されます。ただし、アカウントの有効な DM `allowFrom` に記載されている ID は、互換性のためユーザー DM ターゲットとして扱われます。

  </Tab>

  <Tab title="アクセスグループ">
    Discord DM とテキストコマンドの認可では、`channels.discord.allowFrom` 内の動的な `accessGroup:<name>` エントリを使用できます。

    アクセスグループ名はメッセージチャンネル間で共有されます。メンバーを各チャンネルの通常の `allowFrom` 構文で表す静的グループには `type: "message.senders"` を使用し、Discord チャンネルの現在の `ViewChannel` 対象者に基づいて動的にメンバーを定義する場合は `type: "discord.channelAudience"` を使用します。共有アクセスグループの動作: [アクセスグループ](/ja-JP/channels/access-groups)。

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Discord テキストチャンネルには、独立したメンバーリストはありません。`type: "discord.channelAudience"` では、メンバーシップを次のようにモデル化します。DM 送信者が設定されたギルドのメンバーであり、ロールとチャンネルの上書きが適用された後、設定されたチャンネルに対する有効な `ViewChannel` 権限を現在持っていることです。

    例: `#maintainers` を閲覧できるすべてのユーザーがボットに DM を送信できるようにし、それ以外の全員に対して DM を閉じたままにします。

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    動的エントリと静的エントリを混在させることができます。

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    参照に失敗した場合はアクセスが拒否されます。Discord が `Missing Access` を返した場合、メンバーの参照に失敗した場合、またはチャンネルが別のギルドに属している場合、DM 送信者は未認可として扱われます。

    チャンネル対象者アクセスグループを使用する場合は、Discord Developer Portal の **Server Members Intent** を有効にしてください。DM にはギルドメンバーの状態が含まれないため、OpenClaw は認可時に Discord REST を介してメンバーを解決します。

  </Tab>

  <Tab title="ギルドポリシー">
    ギルドの処理は `channels.discord.groupPolicy` で制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合、安全な基準値は `allowlist` です。

    `allowlist` の動作:

    - ギルドは `channels.discord.guilds` と一致する必要があります（`id` を推奨、スラッグも使用可能）
    - 任意の送信者許可リスト: `users`（安定した ID を推奨）および `roles`（ロール ID のみ）。いずれかが設定されている場合、送信者が `users` または `roles` のどちらかに一致すれば許可されます
    - 名前やタグの直接照合はデフォルトで無効です。緊急時の互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
    - `users` では名前やタグもサポートされますが、ID の方が安全です。名前やタグのエントリが使用されている場合、`openclaw security audit` は警告を表示します
    - ギルドに `channels` が設定されている場合、リストにないチャンネルは拒否されます
    - ギルドに `channels` ブロックがない場合、許可リストに登録されたそのギルド内のすべてのチャンネルが許可されます

    例:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    従来のチャンネル単位の `allow` キーは、`openclaw doctor --fix` によって `enabled` に移行されます。

    `DISCORD_BOT_TOKEN` のみを設定し、`channels.discord` ブロックを作成しない場合、`channels.defaults.groupPolicy` が `open` であっても、ランタイムのフォールバックは `groupPolicy="allowlist"` になります（ログに警告が表示されます）。

  </Tab>

  <Tab title="メンションとグループ DM">
    ギルドメッセージは、デフォルトでメンションが必要です。

    メンション検出には以下が含まれます。

    - ボットへの明示的なメンション
    - 設定されたメンションパターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - サポートされている場合の、ボットへの返信による暗黙的な動作

    Discord の送信メッセージを記述する場合は、正規のメンション構文を使用してください。ユーザーには `<@USER_ID>`、チャンネルには `<#CHANNEL_ID>`、ロールには `<@&ROLE_ID>` を使用します。従来の `<@!USER_ID>` ニックネームメンション形式は使用しないでください。

    `requireMention` はギルドまたはチャンネルごとに設定します（`channels.discord.guilds...`）。
    `ignoreOtherMentions` を設定すると、ボットではなく別のユーザーまたはロールをメンションするメッセージを任意で破棄できます（@everyone/@here を除く）。

    グループ DM:

    - デフォルト: 無視されます（`dm.groupEnabled=false`）
    - `dm.groupChannels`（チャンネル ID またはスラッグ）による任意の許可リスト

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

Discord ギルドメンバーをロール ID に基づいて別のエージェントへルーティングするには、`bindings[].match.roles` を使用します。ロールベースのバインディングはロール ID のみを受け付け、ピアまたは親ピアのバインディングの後、ギルドのみのバインディングの前に評価されます。バインディングに他の一致フィールド（例: `peer` + `guildId` + `roles`）も設定されている場合、設定されたすべてのフィールドが一致する必要があります。

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## ネイティブコマンドとコマンド認証

- `commands.native` のデフォルトは `"auto"` で、Discord では有効です。
- チャンネルごとの上書き: `channels.discord.commands.native`。
- `commands.native=false` にすると、起動時の Discord スラッシュコマンドの登録とクリーンアップをスキップします。以前に登録されたコマンドは、Discord アプリから削除するまで Discord に表示され続ける場合があります。
- ネイティブコマンドの認可には、通常のメッセージ処理と同じ Discord の許可リストとポリシーが使用されます。
- 認可されていないユーザーにも Discord UI 上でコマンドが表示される場合がありますが、実行時には OpenClaw の認可が適用され、「認可されていません」と応答します。
- スラッシュコマンドのデフォルト設定: `ephemeral: true`（`channels.discord.slashCommand.ephemeral`）。

コマンド一覧と動作については、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

## 機能の詳細

<AccordionGroup>
  <Accordion title="返信タグとネイティブ返信">
    Discord はエージェント出力内の返信タグをサポートします。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` で制御します。

    - `off`（デフォルト）: 暗黙的な返信スレッド化を行いません。明示的な `[[reply_to_*]]` タグは引き続き適用されます
    - `first`: 暗黙的なネイティブ返信参照を、そのターンで最初に送信される Discord メッセージに付加します
    - `all`: 送信されるすべてのメッセージに付加します
    - `batched`: 受信イベントが、デバウンスによってまとめられた複数メッセージのバッチだった場合にのみ付加します。単一メッセージのすべてのターンではなく、主に判別しにくい突発的なチャットでネイティブ返信を使用したい場合に便利です

    メッセージ ID はコンテキストと履歴に含まれるため、エージェントは特定のメッセージを対象にできます。

  </Accordion>

  <Accordion title="リンクプレビュー">
    Discord はデフォルトで URL のリッチリンク埋め込みを生成します。OpenClaw は、送信する Discord メッセージで生成される埋め込みをデフォルトで抑制するため、明示的に有効化しない限り、エージェントが送信した URL は通常のリンクとして表示されます。

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    1 つのアカウントで上書きするには、`channels.discord.accounts.<id>.suppressEmbeds` を設定します。エージェントのメッセージツールによる送信でも、単一メッセージに対して `suppressEmbeds: false` を渡せます。明示的な Discord の `embeds` ペイロードは、デフォルトのリンクプレビュー設定では抑制されません。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClaw は、一時メッセージを送信し、テキストの到着に合わせて編集することで、返信の下書きをストリーミングできます。`channels.discord.streaming.mode` には `off` | `partial` | `block` | `progress` を指定できます（`streaming` または旧式の `streamMode` キーが設定されていない場合のデフォルトは `progress`）。`streamMode` は旧式のエイリアスです。`openclaw doctor --fix` を実行すると、保存済みの設定が正規のネストされた `streaming` 形式に書き換えられます。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `off` は Discord のプレビュー編集を無効にします。
    - `partial` は、トークンの到着に合わせて 1 件のプレビューメッセージを編集します。
    - `block` は下書きサイズのチャンクを出力します。サイズと区切り位置は `streaming.preview.chunk`（`minChars`、`maxChars`、`breakPreference`）で調整でき、`textChunkLimit` を上限とします。ブロックストリーミングを明示的に有効にすると、二重ストリーミングを避けるため、OpenClaw はプレビューストリームをスキップします。
    - `progress` は、編集可能なステータス下書きを 1 件維持し、最終配信までツールの進捗で更新します。共通の開始ラベルは流動する 1 行として扱われるため、十分な作業内容が表示されると、ほかの行と同様にスクロールして見えなくなります。
    - メディア、エラー、明示的な返信による最終出力では、保留中のプレビュー編集がキャンセルされます。
    - `streaming.preview.toolProgress`（デフォルトは `true`）は、ツールや進捗の更新でプレビューメッセージを再利用するかどうかを制御します。
    - ツールや進捗の行は、利用可能な場合、絵文字、タイトル、詳細を組み合わせたコンパクトな形式で表示されます。例: `🛠️ Bash: run tests` または `🔎 Web Search: for "query"`。
    - `streaming.progress.commentary`（デフォルトは `false`）を有効にすると、一時的な進捗下書きにアシスタントの解説や前置きテキストが含まれます。解説は表示前に整形され、一時的にのみ表示され、最終回答の配信には影響しません。
    - `streaming.progress.maxLineChars` は、進捗プレビューの 1 行あたりの文字数上限を制御します。文章は単語の境界で短縮されますが、コマンドとパスの詳細では有用な末尾部分が維持されます。
    - `streaming.preview.commandText` / `streaming.progress.commandText` は、コンパクトな進捗行に表示するコマンドや実行の詳細を制御します。`raw`（デフォルト）または `status`（ツールラベルのみ）を指定します。

    コンパクトな進捗行を維持したまま、生のコマンドや実行テキストを非表示にするには、次のように設定します。

    ```json
    {
      "channels": {
        "discord": {
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

    プレビューストリーミングはテキスト専用です。メディアを含む返信では通常の配信にフォールバックします。

  </Accordion>

  <Accordion title="履歴、コンテキスト、スレッドの動作">
    ギルド履歴のコンテキスト:

    - `channels.discord.historyLimit` のデフォルトは `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    DM 履歴の制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    スレッドの動作:

    - Discord スレッドはチャンネルセッションとしてルーティングされ、上書きされない限り親チャンネルの設定を継承します。
    - スレッドセッションは、親チャンネルのセッションレベルの `/model` 選択を、モデル専用のフォールバックとして継承します。スレッド内での `/model` 選択が優先され、トランスクリプトの継承が有効でない限り、親のトランスクリプト履歴はコピーされません。
    - `channels.discord.thread.inheritParent`（デフォルトは `false`）を有効にすると、新しい自動スレッドに親のトランスクリプトから初期データを設定します。アカウントごとの上書き: `channels.discord.accounts.<id>.thread.inheritParent`。
    - メッセージツールのリアクションでは、`user:<id>` 形式の DM 対象を解決できます。
    - 返信段階の有効化でフォールバックする際も、`guilds.<guild>.channels.<channel>.requireMention: false` は維持されます。

    チャンネルのトピックは**信頼できない**コンテキストとして挿入されます。許可リストはエージェントを起動できるユーザーを制限するものであり、補足コンテキスト全体を秘匿化する境界ではありません。

  </Accordion>

  <Accordion title="サブエージェント用のスレッド連携セッション">
    Discord はスレッドをセッション対象に関連付けられるため、そのスレッド内の後続メッセージを同じセッションへ継続的にルーティングできます。これにはサブエージェントのセッションも含まれます。

    コマンド:

    - `/focus <target>` 現在のスレッドまたは新しいスレッドを、サブエージェントまたはセッション対象に関連付けます
    - `/unfocus` 現在のスレッドの関連付けを解除します
    - `/agents` アクティブな実行と関連付け状態を表示します
    - `/session idle <duration|off>` フォーカスされた関連付けについて、非アクティブ時の自動フォーカス解除を確認または更新します
    - `/session max-age <duration|off>` フォーカスされた関連付けについて、最大有効期間を確認または更新します

    設定:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    注記:

    - `session.threadBindings.*` はグローバルなデフォルトを設定し、`channels.discord.threadBindings.*` は Discord の動作を上書きします。
    - `spawnSessions` は、`sessions_spawn({ thread: true })` と ACP スレッド生成でのスレッドの自動作成と関連付けを制御します。デフォルトは `true` です。
    - `defaultSpawnContext` は、スレッド連携で生成されるネイティブサブエージェントのコンテキストを制御します。デフォルトは `"fork"` です。
    - 非推奨の `spawnSubagentSessions` / `spawnAcpSessions` キーは、`openclaw doctor --fix` によって移行されます。
    - アカウントでスレッドの関連付けが無効になっている場合、`/focus` と関連するスレッド関連付け操作は利用できません。

    [サブエージェント](/ja-JP/tools/subagents)、[ACP エージェント](/ja-JP/tools/acp-agents)、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

  </Accordion>

  <Accordion title="永続的な ACP チャンネル関連付け">
    安定した「常時稼働」の ACP ワークスペースでは、Discord の会話を対象とするトップレベルの型付き ACP 関連付けを設定します。

    設定パス: `type: "acp"` と `match.channel: "discord"` を持つ `bindings[]`。

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    注記:

    - `/acp spawn codex --bind here` は現在のチャンネルまたはスレッドをその場で関連付け、以降のメッセージを同じ ACP セッションに維持します。スレッドのメッセージは親チャンネルの関連付けを継承します。
    - 関連付けられたチャンネルまたはスレッドでは、`/new` と `/reset` が同じ ACP セッションをその場でリセットします。一時的なスレッド関連付けが有効な間は、対象の解決を上書きできます。
    - `spawnSessions` は、`--thread auto|here` による子スレッドの作成と関連付けを制御します。

    関連付けの動作について詳しくは、[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

  </Accordion>

  <Accordion title="リアクション通知">
    ギルドごとのリアクション通知モード（`guilds.<id>.reactionNotifications`）:

    - `off`
    - `own`（デフォルト）
    - `all`
    - `allowlist`（`guilds.<id>.users` を使用）

    リアクションイベントはシステムイベントに変換され、ルーティング先の Discord セッションに添付されます。

  </Accordion>

  <Accordion title="確認リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間、確認用の絵文字を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェントのアイデンティティ絵文字へのフォールバック（`agents.list[].identity.emoji`、なければ「👀」）

    注記:

    - Discord は Unicode 絵文字またはカスタム絵文字名を受け付けます。
    - チャンネルまたはアカウントのリアクションを無効にするには、`""` を使用します。

    **範囲（`messages.ackReactionScope`）:**

    値: `"all"`（DM とグループ。周辺的なルームイベントを含む）、`"direct"`（DM のみ）、`"group-all"`（周辺的なルームイベントを除くすべてのグループメッセージ。DM は除外）、`"group-mentions"`（ボットがメンションされたグループ。**DM は除外**。デフォルト）、`"off"` / `"none"`（無効）。

    <Note>
    デフォルトの範囲（`"group-mentions"`）では、ダイレクトメッセージや周辺的なルームイベントに対して確認リアクションは送信されません。受信した Discord DM や発言の少ないルームイベントで確認リアクションを付けるには、`messages.ackReactionScope` を `"all"` に設定します。
    </Note>

  </Accordion>

  <Accordion title="設定の書き込み">
    チャンネルから開始される設定の書き込みは、デフォルトで有効です。これは、コマンド機能が有効な場合の `/config set|unset` フローに影響します。

    無効化:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway プロキシ">
    `channels.discord.proxy` を使用すると、Discord Gateway の WebSocket トラフィックと起動時の REST 検索（アプリケーション ID と許可リストの解決）を HTTP(S) プロキシ経由でルーティングできます。
    Discord Gateway の WebSocket プロキシは明示的に設定する必要があります。WebSocket 接続は、Gateway プロセスの環境に設定されたプロキシ環境変数を継承しません。`channels.discord.proxy` が設定されている場合、起動時の REST 検索ではこのプロキシが使用されます。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    アカウントごとの上書き:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="PluralKit のサポート">
    プロキシされたメッセージをシステムメンバーのアイデンティティに対応付けるには、PluralKit の解決を有効にします。

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 任意。非公開システムには必要
      },
    },
  },
}
```

    注記:

    - 許可リストでは `pk:<memberId>` を使用できます
    - メンバーの表示名は、`channels.discord.dangerouslyAllowNameMatching: true` の場合にのみ、名前またはスラッグで照合されます
    - 検索では、元のメッセージ ID を使用して PluralKit API に問い合わせます
    - 検索に失敗した場合、プロキシされたメッセージはボットメッセージとして扱われ、`allowBots` で許可されていない限り破棄されます

  </Accordion>

  <Accordion title="Outbound mention aliases">
    エージェントが既知の Discord ユーザーへの確定的な送信メンションを必要とする場合は、`mentionAliases` を使用します。キーは先頭の `@` を除いたハンドル、値は Discord ユーザー ID です。不明なハンドル、`@everyone`、`@here`、および Markdown のコードスパン内のメンションは変更されません。

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Presence configuration">
    ステータスまたはアクティビティのフィールドを設定した場合、あるいは自動プレゼンスを有効にした場合に、プレゼンスの更新が適用されます。

    ステータスのみ:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    アクティビティ（`activity` が設定されている場合、カスタムステータスが既定のアクティビティ種別です）:

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    ストリーミング:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    アクティビティ種別の対応表:

    - 0: プレイ中
    - 1: ストリーミング中（`activityUrl` が必要です。また、`activityUrl` を使用するには `activityType: 1` が必要です）
    - 2: 再生中
    - 3: 視聴中
    - 4: カスタム（アクティビティのテキストをステータス状態として使用します。絵文字は任意です）
    - 5: 参戦中

    自動プレゼンス（ランタイムの正常性シグナル）:

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    自動プレゼンスは、ランタイムの可用性を Discord のステータスに対応付けます。正常 => オンライン、機能低下または不明 => アイドル、枯渇または利用不可 => 取り込み中。既定値は `intervalMs` が 30000、`minUpdateIntervalMs` が 15000 です（`intervalMs` 以下である必要があります）。任意のテキスト上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（`{reason}` プレースホルダーをサポート）

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord は、DM でのボタンによる承認処理をサポートし、必要に応じて承認プロンプトを発信元のチャンネルに投稿できます。

    設定パス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバックします）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、既定値: `dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    `enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` から少なくとも 1 人の承認者を解決できる場合、Discord はネイティブの実行承認を自動的に有効化します。Discord は、チャンネルの `allowFrom`、従来の `dm.allowFrom`、またはダイレクトメッセージの `defaultTo` から実行承認者を推測しません。Discord をネイティブ承認クライアントとして明示的に無効化するには、`enabled: false` を設定します。

    `/diagnostics` や `/export-trajectory` など、機密性の高い所有者専用グループコマンドでは、OpenClaw は承認プロンプトと最終結果を非公開で送信します。呼び出した所有者に Discord の所有者ルートがある場合は、まず Discord DM を試します。それ以外の場合は、Telegram など、`commands.ownerAllowFrom` で利用可能な最初の所有者ルートにフォールバックします。

    `target` が `channel` または `both` の場合、承認プロンプトはチャンネルに表示されます。解決された承認者のみがボタンを使用でき、それ以外のユーザーには一時的な拒否メッセージが表示されます。承認プロンプトにはコマンドのテキストが含まれるため、チャンネルへの配信は信頼できるチャンネルでのみ有効にしてください。セッションキーからチャンネル ID を導出できない場合、OpenClaw は DM 配信にフォールバックします。

    Discord は、他のチャットチャンネルでも使用される共通の承認ボタンを表示します。ネイティブ Discord アダプターが主に追加するのは、承認者への DM ルーティングとチャンネルへのファンアウトです。これらのボタンが存在する場合、それが主要な承認操作になります。OpenClaw が手動の `/approve` コマンドを含めるのは、ツールの結果でチャット承認が利用できないと示された場合、または手動承認が唯一の経路である場合に限られます。Discord のネイティブ承認ランタイムが有効でない場合、OpenClaw はローカルの確定的な `/approve <id> <decision>` プロンプトを表示したままにします。ランタイムが有効でもネイティブカードをどの宛先にも配信できない場合、OpenClaw は保留中の承認に含まれる正確な `/approve` コマンドとともに、同じチャットへフォールバック通知を送信します。

    Gateway 認証と承認の解決は、共通の Gateway クライアント契約に従います（`plugin:` ID は `plugin.approval.resolve` で解決され、それ以外の ID は `exec.approval.resolve` で解決されます）。承認は既定で 30 分後に期限切れになります。

    [実行承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## ツールとアクションゲート

Discord のメッセージアクションは、メッセージング、チャンネル管理、モデレーション、プレゼンス、メタデータを対象とします。

主な例:

- メッセージング: `sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- リアクション: `react`、`reactions`、`emojiList`
- モデレーション: `timeout`、`kick`、`ban`
- プレゼンス: `setPresence`

`event-create` アクションは、スケジュールされたイベントのカバー画像を設定するための任意の `image` パラメーター（URL またはローカルファイルパス）を受け付けます。

アクションゲートは `channels.discord.actions.*` 配下にあります。

ゲートの既定動作:

| アクショングループ                                                                                                                                                             | 既定値  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 有効  |
| roles                                                                                                                                                                    | 無効 |
| moderation                                                                                                                                                               | 無効 |
| presence                                                                                                                                                                 | 無効 |

## コンポーネント v2 UI

OpenClaw は、実行承認とコンテキスト間マーカーに Discord コンポーネント v2 を使用します。Discord のメッセージアクションは、カスタム UI 用の `components` も受け付けます（高度な機能。discord ツールを使用してコンポーネントのペイロードを構築する必要があります）。従来の `embeds` も引き続き使用できますが、推奨されません。

- `channels.discord.ui.components.accentColor` は、Discord のコンポーネントコンテナーで使用されるアクセントカラー（16 進数）を設定します。アカウントごとの設定: `channels.discord.accounts.<id>.ui.components.accentColor`。
- `channels.discord.agentComponents.ttlMs` は、送信済み Discord コンポーネントのコールバックが登録されたままになる期間を制御します（既定値 `1800000`、最大値 `86400000`）。アカウントごとの設定: `channels.discord.accounts.<id>.agentComponents.ttlMs`。
- コンポーネント v2 が存在する場合、`embeds` は無視されます。
- プレーン URL のプレビューは既定で抑制されます。単一の送信リンクを展開する必要がある場合は、メッセージアクションに `suppressEmbeds: false` を設定します。

例:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## 音声

Discord には、リアルタイムの**ボイスチャンネル**（継続的な会話）と、**ボイスメッセージの添付ファイル**（波形プレビュー形式）という 2 つの異なる音声機能があります。Gateway は両方をサポートします。

### ボイスチャンネル

セットアップチェックリスト:

1. Discord Developer Portal で Message Content Intent を有効にします。
2. ロールまたはユーザーの許可リストを使用する場合は、Server Members Intent を有効にします。
3. `bot` および `applications.commands` スコープを指定してボットを招待します。
4. 対象のボイスチャンネルで Connect、Speak、Send Messages、Read Message History を許可します。
5. ネイティブコマンド（`commands.native` または `channels.discord.commands.native`）を有効にします。
6. `channels.discord.voice` を設定します。

セッションを制御するには `/vc join|leave|status` を使用します。このコマンドはアカウントの既定エージェントを使用し、他の Discord コマンドと同じ許可リストおよびグループポリシーのルールに従います。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

参加前にボットの実効権限を確認するには、次を実行します。

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

自動参加の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

注記:

- Discord音声はテキスト専用設定ではオプトインです。`channels.discord.voice.enabled=true` を設定（または既存の `channels.discord.voice` ブロックを維持）すると、`/vc` コマンド、音声ランタイム、`GuildVoiceStates` Gatewayインテントが有効になります。`channels.discord.intents.voiceStates` でインテントのサブスクリプションを明示的に上書きできます。未設定のままにすると、実際の音声有効化状態に従います。
- `voice.mode` は会話経路を制御します。デフォルトは `agent-proxy` です。リアルタイム音声フロントエンドがターンのタイミング、中断、再生を処理し、実質的な作業を `openclaw_agent_consult` を介してルーティング先のOpenClawエージェントに委任し、その結果をその話者が入力したDiscordプロンプトと同様に扱います。`stt-tts` は従来のバッチSTTとTTSを組み合わせたフローを維持します。`bidi` では、OpenClawの頭脳として `openclaw_agent_consult` を公開しながら、リアルタイムモデルが直接会話できます。
- `voice.agentSession` は、どのOpenClaw会話が音声ターンを受け取るかを制御します。音声チャンネル自身のセッションを使用する場合は未設定のままにします。または `{ mode: "target", target: "channel:<text-channel-id>" }` を設定すると、音声チャンネルを `#maintainers` などの既存Discordテキストチャンネルセッションのマイク／スピーカー拡張として機能させられます。
- `voice.model` は、Discord音声応答とリアルタイム相談で使用するOpenClawエージェントの頭脳を上書きします。ルーティング先エージェントのモデルを継承する場合は未設定のままにします。これは `voice.realtime.model` とは別です。
- `voice.followUsers` を使用すると、選択したユーザーに合わせてボットがDiscord音声へ参加、移動、退出できます。[音声でユーザーを追従する](#follow-users-in-voice)を参照してください。
- `agent-proxy` は音声を `discord-voice` 経由でルーティングします。これにより、話者と対象セッションに対する通常の所有者／ツール認可を維持しつつ、Discord音声が再生を担当するため、エージェントの `tts` ツールは非表示になります。デフォルトでは、`agent-proxy` は所有者である話者からの相談に、所有者と同等の完全なツールアクセスを付与し（`voice.realtime.toolPolicy: "owner"`）、実質的な回答の前にOpenClawエージェントへ相談することを強く優先します（`voice.realtime.consultPolicy: "always"`）。このデフォルトの `always` モードでは、リアルタイム層は相談回答の前に場つなぎの発話を自動再生しません。音声を取得して文字起こしし、その後ルーティング先OpenClawの回答を読み上げます。Discordが最初の回答を再生している間に、強制相談による回答が複数完了した場合、後続の逐語発話回答は文の途中で音声を置き換えず、再生がアイドル状態になるまでキューに入ります。
- `stt-tts` モードでは、STTは `tools.media.audio` を使用します。`voice.model` は文字起こしには影響しません。
- リアルタイムモードでは、`voice.realtime.provider`、`voice.realtime.model`、`voice.realtime.speakerVoice` がリアルタイム音声セッションを設定します。OpenAI Realtime 2.1とCodexの頭脳を組み合わせる場合は、`voice.realtime.model: "gpt-realtime-2.1"` と `voice.model: "openai/gpt-5.6-sol"` を使用します。
- リアルタイム音声モードでは、デフォルトで小さな `IDENTITY.md`、`USER.md`、`SOUL.md` プロファイルファイルをリアルタイムプロバイダーの指示に含めるため、高速な直接ターンでも、ルーティング先OpenClawエージェントと同じアイデンティティ、ユーザーに関する基礎情報、ペルソナが維持されます。これをカスタマイズするには `voice.realtime.bootstrapContextFiles` にサブセットを設定し、無効にするには `[]` を設定します。サポートされるのはこれらのプロファイルファイルのみです。`AGENTS.md` は通常のエージェントコンテキストに残ります。注入されたプロファイルコンテキストは、ワークスペース作業、最新情報、メモリ検索、ツールに裏付けられた操作において `openclaw_agent_consult` を置き換えるものではありません。
- OpenAIの `agent-proxy` リアルタイムモードでは、`voice.realtime.requireWakeName: true` を設定すると、文字起こしがウェイク名で始まるか終わるまで、Discordリアルタイム音声を無音に保てます。設定するウェイク名は1語または2語でなければなりません。`voice.realtime.wakeNames` が未設定の場合、OpenClawはルーティング先エージェントの `name` と `OpenClaw` を使用し、フォールバックとしてエージェントIDと `OpenClaw` を使用します。ウェイク名ゲーティングは、リアルタイムプロバイダーの自動応答を無効化し、受け付けたターンをOpenClawエージェントの相談経路にルーティングします。また、最終的な文字起こしが届く前に、部分的な文字起こしから先頭のウェイク名を認識すると、短い音声確認を返します。
- OpenAIリアルタイムプロバイダーは、出力音声および文字起こしイベントについて、現在のRealtime 2イベント名と従来のCodex互換エイリアスを受け付けます。そのため、互換性のあるプロバイダースナップショットに差異が生じても、アシスタント音声が失われません。
- `voice.realtime.bargeIn` は、Discordの話者開始イベントによって、再生中のリアルタイム音声を中断するかどうかを制御します。未設定の場合、リアルタイムプロバイダーの入力音声中断設定に従います。
- `voice.realtime.minBargeInAudioEndMs` は、OpenAIリアルタイムの割り込みによって音声が打ち切られるまでに必要な、アシスタント再生の最小継続時間を制御します。デフォルトは `250` です。エコーが少ない部屋で即時中断するには `0` を設定し、スピーカーのエコーが強い環境では値を増やします。
- `voice.tts` は、`stt-tts` の音声再生に限って `messages.tts` を上書きします。リアルタイムモードでは代わりに `voice.realtime.speakerVoice` を使用します。Discord再生でOpenAI音声を使用するには、`voice.tts.provider: "openai"` を設定し、`voice.tts.providers.openai.speakerVoice` でテキスト読み上げ音声を選択します。現在のOpenAI TTSモデルでは、`cedar` が男性的な声として適しています。
- チャンネルごとのDiscord `systemPrompt` 上書きは、その音声チャンネルの音声文字起こしターンにも適用されます。
- 音声文字起こしターンは、所有者限定コマンドとチャンネル操作に使用する所有者ステータスを、Discordの `allowFrom`（または `dm.allowFrom`）から取得します。エージェントツールの可視性は、ルーティング先セッションに設定されたツールポリシーに従います。
- `voice.autoJoin` に同じギルドのエントリが複数ある場合、OpenClawはそのギルドについて最後に設定されたチャンネルへ参加します。
- `voice.allowedChannels` は、滞在を許可する任意の許可リストです。未設定のままにすると、認可された任意のDiscord音声チャンネルに `/vc join` で参加できます。設定すると、`/vc join`、起動時の自動参加、ボットの音声状態移動は、列挙された `{ guildId, channelId }` エントリに制限されます。空の配列に設定すると、Discord音声への参加をすべて拒否します。Discordによってボットが許可リスト外へ移動された場合、OpenClawはそのチャンネルから退出し、設定済みの自動参加先があれば再参加します。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は、`@discordjs/voice` の参加オプションにそのまま渡されます。アップストリームのデフォルトは `daveEncryption=true` と `decryptionFailureTolerance=24` です。
- OpenClawは、Discord音声の受信とリアルタイム生PCM再生に、同梱の `libopus-wasm` コーデックを使用します。固定バージョンのlibopus WebAssemblyビルドが同梱されており、ネイティブopusアドオンは不要です。
- `voice.connectTimeoutMs` は、`/vc join` と自動参加の試行時に、最初の `@discordjs/voice` Readyを待つ時間を制御します。デフォルトは `30000` です。
- `voice.reconnectGraceMs` は、切断された音声セッションを破棄する前に、OpenClawが再接続の開始を待つ時間を制御します。デフォルトは `15000` です。
- `stt-tts` モードでは、別のユーザーが話し始めただけでは音声再生は停止しません。フィードバックループを避けるため、OpenClawはTTS再生中の新しい音声取得を無視します。次のターンでは、再生が終了してから話してください。リアルタイムモードでは、話者開始を割り込みシグナルとしてリアルタイムプロバイダーへ転送します。
- リアルタイムモードでは、スピーカーから開放状態のマイクへ入るエコーが割り込みと見なされ、再生が中断されることがあります。エコーが強いDiscordルームでは、`voice.realtime.providers.openai.interruptResponseOnInputAudio: false` を設定し、入力音声によるOpenAIの自動中断を防ぎます。Discordの話者開始イベントでは再生中の音声を引き続き中断したい場合、`voice.realtime.bargeIn: true` を追加します。OpenAIリアルタイムブリッジは、`voice.realtime.minBargeInAudioEndMs` より短い再生打ち切りをエコー／ノイズの可能性が高いものとして無視し、Discord再生をクリアせずにスキップとしてログに記録します。
- `voice.captureSilenceGraceMs` は、Discordが話者の発話停止を報告してから、その音声区間をSTT用に確定するまでOpenClawが待つ時間を制御します。デフォルトは `2000` です。Discordが通常の間を細切れの部分文字起こしに分割する場合は、値を増やしてください。
- ElevenLabsが選択されたTTSプロバイダーの場合、Discord音声再生はストリーミングTTSを使用し、プロバイダーの応答ストリームから再生を開始します。ストリーミングをサポートしないプロバイダーでは、合成済み一時ファイルを使用する経路にフォールバックします。
- OpenClawは受信時の復号失敗を監視し、短時間に繰り返し失敗した場合は、音声チャンネルから退出して再参加することで自動復旧します。
- 更新後、受信ログに `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合は、依存関係レポートとログを収集してください。同梱の `@discordjs/voice` 系列には、discord.jsのPR #11449に含まれるアップストリームのパディング修正が組み込まれており、この修正によってdiscord.jsのissue #11419はクローズされました。
- OpenClawが取得した話者区間を確定する際に発生する `The operation was aborted` 受信イベントは想定内です。これは詳細な診断情報であり、警告ではありません。
- Discord音声の詳細ログには、受け付けた話者区間ごとに、長さを制限した1行のSTT文字起こしプレビューが含まれます。これにより、無制限の文字起こしテキストを出力することなく、デバッグ時にユーザー側とエージェント応答側の両方を確認できます。
- `agent-proxy` モードでは、強制相談のフォールバックは、`...` で終わるテキストや「and」のような接続語で終わるテキストなど、未完了の可能性が高い文字起こし断片に加え、「be right back」や「bye」のような明らかに操作を必要としない締めの発話をスキップします。これにより古いキュー済み回答が防止された場合、ログには `forced agent consult skipped reason=...` と表示されます。

### 音声でユーザーを追従する

起動時に固定チャンネルへ参加したり、`/vc join` を待機したりする代わりに、Discord音声ボットを既知の1人以上のDiscordユーザーと同じ場所に滞在させたい場合は、`voice.followUsers` を使用します。

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

動作:

- `followUsers` は、生のDiscordユーザーIDと `discord:<id>` 値を受け付けます。OpenClawは音声状態イベントとの照合前に、両方の形式を正規化します。
- `followUsers` が設定されている場合、`followUsersEnabled` のデフォルトは `true` です。保存済みリストを維持しながら音声の自動追従を停止するには、`false` に設定します。
- 追従対象ユーザーが許可された音声チャンネルに参加すると、OpenClawもそのチャンネルに参加します。ユーザーが移動すると、OpenClawも一緒に移動します。現在追従中のユーザーが切断すると、OpenClawは退出します。
- 同じギルドに複数の追従対象ユーザーがいて、現在追従中のユーザーが退出した場合、OpenClawはギルドから退出する前に、追跡中の別の追従対象ユーザーのチャンネルへ移動します。複数の追従対象ユーザーが同時に移動した場合は、最後に観測された音声状態イベントが優先されます。
- `allowedChannels` は引き続き適用されます。許可されていないチャンネルにいる追従対象ユーザーは無視され、追従によって所有されているセッションは、別の追従対象ユーザーへ移動するか退出します。
- OpenClawは、起動時および上限が設定された間隔ごとに、見逃した音声状態イベントを整合させます。整合処理では設定済みギルドをサンプリングし、1回の実行あたりのREST検索数に上限を設けます。そのため、非常に大きな `followUsers` リストでは、収束に複数回の間隔が必要になる場合があります。
- ユーザーを追従中にDiscordまたは管理者がボットを移動した場合、移動先が許可されていれば、OpenClawは音声セッションを再構築し、追従所有権を維持します。ボットが `allowedChannels` の外へ移動された場合、OpenClawは退出し、設定済みの対象があれば再参加します。
- DAVE受信復旧では、復号失敗が繰り返された後、同じチャンネルから退出して再参加することがあります。追従によって所有されているセッションは、その復旧経路でも追従所有権を維持するため、その後に追従対象ユーザーが切断した場合もチャンネルから退出します。

参加モードの選択:

- 自分が音声に参加しているとき、ボットも自動的に音声へ参加させたい個人用または運用者向けの構成には、`followUsers` を使用します。
- 追跡対象ユーザーが音声にいない場合でも常駐させる固定ルームのボットには、`autoJoin` を使用します。
- 一度限りの参加や、自動的に音声へ常駐すると意外に感じられるルームには、`/vc join` を使用します。

Discord音声コーデック:

- 音声受信ログには `discord voice: opus decoder: libopus-wasm` と表示されます。
- リアルタイム再生では、生の48 kHzステレオPCMを同梱の同じ `libopus-wasm` パッケージでOpusにエンコードしてから、パケットを `@discordjs/voice` に渡します。
- ファイルおよびプロバイダーストリームの再生では、ffmpegを使用して生の48 kHzステレオPCMへトランスコードし、その後Discordへ送信するOpusパケットストリームに `libopus-wasm` を使用します。

STTとTTSのパイプライン:

- Discord の PCM キャプチャは一時 WAV ファイルに変換されます。
- `tools.media.audio` が STT を処理します（例: `openai/gpt-4o-mini-transcribe`）。
- トランスクリプトは Discord の受信処理とルーティングを経由して送信されます。その間、応答 LLM はエージェントの `tts` ツールを非表示にし、テキストを返すよう求める音声出力ポリシーで実行されます。これは、最終的な TTS 再生を Discord 音声が担当するためです。
- `voice.model` を設定すると、この音声チャンネルのターンに限り、応答 LLM のみが上書きされます。
- `voice.tts` は `messages.tts` に上書きマージされます。ストリーミング対応プロバイダーはプレイヤーへ直接データを送り、それ以外の場合は生成された音声ファイルが参加中のチャンネルで再生されます。

デフォルトのエージェントプロキシ音声チャンネルセッションの例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

`voice.agentSession` ブロックがない場合、各音声チャンネルに個別のルーティング済み OpenClaw セッションが割り当てられます。たとえば、`/vc join channel:234567890123456789` は、その Discord 音声チャンネルのセッションと対話します。リアルタイムモデルは音声フロントエンドにすぎず、実質的なリクエストは設定済みの OpenClaw エージェントへ渡されます。リアルタイムモデルがコンサルトツールを呼び出さずに最終トランスクリプトを生成した場合、OpenClaw はフォールバックとしてコンサルトを強制し、デフォルトの動作が引き続きエージェントとの対話として機能するようにします。

従来の STT と TTS の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

リアルタイム双方向通信の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

既存の Discord チャンネルセッションを拡張する音声の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

`agent-proxy` モードでは、ボットは設定された音声チャンネルに参加しますが、OpenClaw エージェントのターンでは、対象チャンネルの通常のルーティング済みセッションとエージェントが使用されます。リアルタイム音声セッションは、返された結果を音声チャンネルで読み上げます。スーパーバイザーエージェントは引き続き、そのツールポリシーに従って通常のメッセージツールを使用でき、適切な処理であれば別の Discord メッセージを送信することもできます。

委任された OpenClaw の実行中は、別のエージェントターンを開始する前に、新しい Discord 音声トランスクリプトが実行中の処理に対するリアルタイム制御として扱われます。「状況は」「それをキャンセル」「より小さい修正を使って」「終わったらテストも確認して」などのフレーズは、アクティブなセッションに対するステータス確認、キャンセル、方向修正、またはフォローアップ入力として分類されます。ステータス、キャンセル、受け入れられた方向修正、フォローアップの結果は音声チャンネルへ読み上げられるため、発信者は OpenClaw がリクエストを処理したかどうかを確認できます。

使用可能な対象形式:

- `target: "channel:123456789012345678"` は Discord テキストチャンネルのセッション経由でルーティングします。
- `target: "123456789012345678"` はチャンネル対象として扱われます。
- `target: "dm:123456789012345678"` または `target: "user:123456789012345678"` は、そのダイレクトメッセージセッション経由でルーティングします。

エコーが多い環境向けの OpenAI Realtime の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

モデルが開放されたマイクを通じて自身の Discord 再生音を拾うものの、発話による割り込みは引き続き許可したい場合に使用します。OpenClaw は入力された生の音声による OpenAI の自動割り込みを防ぎます。一方、`bargeIn: true` にすると、次にキャプチャされたターンが OpenAI に到達する前に、Discord の話者開始イベントと、すでにアクティブな話者の音声によって、進行中のリアルタイム応答をキャンセルできます。`audioEndMs` が `minBargeInAudioEndMs` 未満の非常に早い割り込み信号は、エコーまたはノイズの可能性が高いものとして無視されるため、モデルが最初の再生フレームで途切れることはありません。

想定される音声ログ:

- 参加時: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- リアルタイム開始時: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 話者の音声受信時: `discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`、および `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 古くなった発話をスキップしたとき: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` または `reason=non-actionable-closing ...`
- リアルタイム応答の完了時: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 再生の停止またはリセット時: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- リアルタイムコンサルト時: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- エージェントの回答時: `discord voice: agent turn answer ...`
- 指定どおりの発話をキューに追加したとき: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`、続いて `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 割り込みの検出時: `discord voice: realtime barge-in detected source=speaker-start ...` または `discord voice: realtime barge-in detected source=active-speaker-audio ...`、続いて `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- リアルタイム割り込み時: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`、続いて `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` または `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- エコーまたはノイズを無視したとき: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 割り込みが無効なとき: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 再生がアイドル状態のとき: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

音声が途中で途切れる問題をデバッグするには、リアルタイム音声ログを時系列として読み取ります。

1. `realtime audio playback started` は、Discord がアシスタント音声の再生を開始したことを示します。この時点から、ブリッジはアシスタント出力チャンク、Discord PCM バイト数、プロバイダーのリアルタイムバイト数、合成音声の再生時間をカウントし始めます。
2. `realtime speaker turn opened` は、Discord の話者がアクティブになったことを示します。再生がすでにアクティブで、`bargeIn` が有効な場合、その後に `barge-in detected source=speaker-start` が記録されることがあります。
3. `realtime input audio started` は、その話者ターンで最初の実際の音声フレームを受信したことを示します。ここで `outputActive=true` またはゼロ以外の `outputAudioMs` が記録されている場合、アシスタントの再生中にマイクが入力を送信しています。
4. `barge-in detected source=active-speaker-audio` は、アシスタントの再生中に OpenClaw が話者のリアルタイム音声を検出したことを示します。これは、実際の割り込みと、有効な音声を伴わない Discord の話者開始イベントを区別するのに役立ちます。
5. `barge-in requested reason=...` は、OpenClaw がリアルタイムプロバイダーに対し、進行中の応答のキャンセルまたは切り詰めを要求したことを示します。`outputAudioMs`、`outputActive`、`playbackChunks` が含まれるため、割り込み前に実際に再生されたアシスタント音声の量を確認できます。
6. `realtime audio playback stopped reason=...` は、Discord のローカル再生がリセットされた時点を示します。理由から、再生を停止した主体を確認できます。`barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close`、または `session-close` のいずれかです。
7. `realtime speaker turn closed` は、キャプチャされた入力ターンの要約です。`chunks=0` または `hasAudio=false` は、話者ターンは開始されたものの、使用可能な音声がリアルタイムブリッジに到達しなかったことを示します。`interruptedPlayback=true` は、その入力ターンがアシスタントの出力と重なり、割り込みロジックが作動したことを示します。

有用なフィールド:

- `outputAudioMs`: そのログ行までにリアルタイムプロバイダーが生成したアシスタント音声の再生時間。
- `audioMs`: 再生が停止するまでに OpenClaw がカウントしたアシスタント音声の再生時間。
- `elapsedMs`: 再生ストリームまたは話者ターンの開始から終了までの実時間。
- `discordBytes`: Discord 音声へ送信、または Discord 音声から受信した 48 kHz ステレオ PCM のバイト数。
- `realtimeBytes`: リアルタイムプロバイダーへ送信、またはリアルタイムプロバイダーから受信した、プロバイダー形式の PCM バイト数。
- `playbackChunks`: アクティブな応答について Discord へ転送されたアシスタント音声チャンク数。
- `sinceLastAudioMs`: 最後にキャプチャした話者音声フレームから話者ターン終了までの間隔。

一般的なパターン:

- `source=active-speaker-audio` と小さい `outputAudioMs` を伴う即時の途切れが発生し、同じユーザーが近くにいる場合、通常はスピーカーのエコーがマイクに入ったことを示します。`voice.realtime.minBargeInAudioEndMs` を増やす、スピーカー音量を下げる、ヘッドホンを使う、または `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` を設定してください。
- `source=speaker-start` の後に `speaker turn closed ... hasAudio=false` が続く場合、Discord は話者の開始を報告したものの、音声は OpenClaw に到達していません。これは一時的な Discord 音声イベント、ノイズゲートの動作、またはクライアントが一瞬だけマイクを有効にしたことが原因の場合があります。
- 近くに割り込みや `provider-clear-audio` がない状態で `audio playback stopped reason=stream-close` が記録されている場合、Discord のローカル再生ストリームが予期せず終了しています。直前のプロバイダーと Discord プレイヤーのログを確認してください。
- `capture ignored during playback (barge-in disabled)` は、アシスタント音声の再生中に OpenClaw が意図的に入力を破棄したことを示します。発話で再生を中断したい場合は、`voice.realtime.bargeIn` を有効にしてください。
- `barge-in ignored ... outputActive=false` は、Discord またはプロバイダーの VAD が発話を報告したものの、OpenClaw に中断対象となるアクティブな再生がなかったことを示します。これによって音声が途切れることはありません。

認証情報はコンポーネントごとに解決されます。`voice.model` には LLM ルート認証、`tools.media.audio` には STT 認証、`messages.tts`/`voice.tts` には TTS 認証、`voice.realtime.providers` またはプロバイダーの通常の認証設定にはリアルタイムプロバイダー認証が使用されます。

### 音声メッセージ

Discord の音声メッセージには波形プレビューが表示され、OGG/Opus 音声が必要です。OpenClaw は波形を自動生成しますが、検査と変換のために Gateway ホスト上の `ffmpeg` と `ffprobe` が必要です。

- **ローカルファイルパス**を指定してください（URL は拒否されます）。
- テキスト内容は省略してください（Discord は同じペイロード内のテキストと音声メッセージの併用を拒否します）。
- どの音声形式でも受け付けます。OpenClaw が必要に応じて OGG/Opus に変換します。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていないインテントを使用した、またはボットがギルドのメッセージを認識しない">

    - Message Content Intent を有効にする
    - ユーザーやメンバーの解決に依存する場合は Server Members Intent を有効にする
    - Intent を変更した後に Gateway を再起動する

  </Accordion>

  <Accordion title="ギルドメッセージが予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` 配下のギルド許可リストを確認する
    - ギルドに `channels` マップが存在する場合、一覧に含まれるチャンネルのみが許可される
    - `requireMention` の動作とメンションパターンを確認する

    役立つ確認コマンド:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="メンション必須が false でもブロックされる">
    一般的な原因:

    - `groupPolicy="allowlist"` だが、一致するギルドまたはチャンネルの許可リストがない
    - `requireMention` が誤った場所に設定されている（`channels.discord.guilds` またはチャンネルエントリの配下に置く必要がある）
    - 送信者がギルドまたはチャンネルの `users` 許可リストによってブロックされている

  </Accordion>

  <Accordion title="長時間実行される Discord ターンまたは重複する返信">

    典型的なログ:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway キューの調整項目:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - 複数アカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - これは Discord Gateway リスナーの処理のみを制御し、エージェントターンの存続時間は制御しない

    Discord は、キューに入ったエージェントターンにチャンネル固有のタイムアウトを適用しません。メッセージリスナーは即座に処理を引き渡し、キューに入った Discord の実行は、セッション、ツール、またはランタイムのライフサイクルが処理を完了または中止するまで、セッションごとの順序を維持します。

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway メタデータ検索のタイムアウト警告">
    OpenClaw は接続前に Discord の `/gateway/bot` メタデータを取得します。一時的な失敗時には Discord のデフォルト Gateway URL にフォールバックし、ログ出力にはレート制限が適用されます。

    メタデータタイムアウトの調整項目:

    - 単一アカウント: `channels.discord.gatewayInfoTimeoutMs`
    - 複数アカウント: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 設定が未指定の場合の環境変数フォールバック: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - デフォルト: `30000`（30 秒）、最大: `120000`

  </Accordion>

  <Accordion title="Gateway の READY タイムアウトによる再起動">
    OpenClaw は、起動時およびランタイムでの再接続後に Discord Gateway の `READY` イベントを待機します。起動時間をずらす複数アカウント構成では、デフォルトより長い起動時 READY 待機時間が必要になる場合があります。

    READY タイムアウトの調整項目:

    - 起動時の単一アカウント: `channels.discord.gatewayReadyTimeoutMs`
    - 起動時の複数アカウント: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 起動時に設定が未指定の場合の環境変数フォールバック: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 起動時のデフォルト: `15000`（15 秒）、最大: `120000`
    - ランタイムの単一アカウント: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - ランタイムの複数アカウント: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - ランタイムで設定が未指定の場合の環境変数フォールバック: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ランタイムのデフォルト: `30000`（30 秒）、最大: `120000`

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` の権限チェックは、数値のチャンネル ID に対してのみ機能します。

    スラッグキーを使用している場合、ランタイムでの照合は引き続き機能しますが、プローブでは権限を完全に検証できません。

  </Accordion>

  <Accordion title="DM とペアリングの問題">

    - DM が無効: `channels.discord.dm.enabled=false`
    - DM ポリシーが無効: `channels.discord.dmPolicy="disabled"`（旧形式: `channels.discord.dm.policy`）
    - `pairing` モードでペアリングの承認待ち

  </Accordion>

  <Accordion title="ボット間ループ">
    デフォルトでは、ボットが作成したメッセージは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるため、厳格なメンションと許可リストのルールを使用してください。
    ボット宛てのメンションを含むボットメッセージのみを受け入れるには、`channels.discord.allowBots="mentions"` を推奨します。

    OpenClaw には、共通の[ボットループ保護](/ja-JP/channels/bot-loop-protection)も同梱されています。`allowBots` によってボットが作成したメッセージがディスパッチに到達できる場合、Discord は受信イベントを `(account, channel, bot pair)` の情報にマッピングし、設定されたイベント上限を超えたペアを汎用ペアガードが抑止します。このガードは、以前は Discord のレート制限によって停止する必要があった、制御不能な 2 ボット間ループを防ぎます。単一ボット構成や、上限未満に収まる単発のボット返信には影響しません。

    デフォルト設定（`allowBots` が設定されている場合に有効）:

    - `maxEventsPerWindow: 20` -- ボットペアはスライディングウィンドウ内で 20 件のメッセージを交換できる
    - `windowSeconds: 60` -- スライディングウィンドウの長さ
    - `cooldownSeconds: 60` -- 上限に達すると、いずれの方向でも、それ以降のボット間メッセージはすべて 1 分間破棄される

    共通のデフォルトは `channels.defaults.botLoopProtection` 配下で一度設定し、正当なワークフローでより大きな余裕が必要な場合に Discord で上書きします。優先順位は次のとおりです。

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - 組み込みのデフォルト

    Discord は汎用の `maxEventsPerWindow`、`windowSeconds`、`cooldownSeconds` キーを使用します。

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha listens to other bots only when they mention it.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Bravo write an Alpha Discord mention with the configured user id.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="DecryptionFailed(...) により音声 STT が途切れる">

    - Discord 音声受信の復旧ロジックを利用できるよう、OpenClaw を最新に保つ（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）であることを確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（上流のデフォルト）から始め、必要な場合にのみ調整する
    - 次のログを監視する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集し、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) および [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) にある上流の DAVE 受信履歴と比較する

  </Accordion>
</AccordionGroup>

## 設定リファレンス

主要リファレンス: [設定リファレンス - Discord](/ja-JP/gateway/config-channels#discord)。

<Accordion title="重要度の高い Discord フィールド">

- 起動/認証: `enabled`、`token`、`applicationId`、`accounts.*`、`allowBots`
- ポリシー: `groupPolicy`、`dmPolicy`、`allowFrom`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- コマンド: `commands.native`、`commands.useAccessGroups`（グローバル）、`configWrites`、`slashCommand.ephemeral`
- イベントキュー: `eventQueue.listenerTimeout`（リスナーの処理上限、デフォルト `120000`）、`eventQueue.maxQueueSize`（デフォルト `10000`）、`eventQueue.maxConcurrency`（デフォルト `50`）
- Gateway: `proxy`、`gatewayInfoTimeoutMs`、`gatewayReadyTimeoutMs`、`gatewayRuntimeReadyTimeoutMs`
- 返信/履歴: `replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 配信: `textChunkLimit`（デフォルト `2000`）、`maxLinesPerMessage`（デフォルト `17`）
- ストリーミング: `streaming.mode`、`streaming.chunkMode`、`streaming.preview.*`、`streaming.progress.*`、`streaming.block.*`（旧形式のフラットな `streamMode`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`、`chunkMode` キーは、`openclaw doctor --fix` によって `streaming.*` に移行される）
- メディア/再試行: `mediaMaxMb`（Discord への送信アップロードを制限、デフォルト `100`）、`retry`
- アクション: `actions.*`
- プレゼンス: `activity`、`status`、`activityType`、`activityUrl`、`autoPresence.*`
- UI: `ui.components.accentColor`
- 機能: `threadBindings`、トップレベルの `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents.enabled`、`agentComponents.ttlMs`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全性と運用

- ボットトークンはシークレットとして扱う（管理環境では `DISCORD_BOT_TOKEN` を推奨）。
- Discord の権限は最小権限で付与する。
- コマンドのデプロイまたは状態が古い場合は、Gateway を再起動し、`openclaw channels status --probe` で再確認する。

## 関連項目

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord ユーザーを Gateway とペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループチャットと許可リストの動作。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと堅牢化。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    ギルドとチャンネルをエージェントに割り当てます。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作。
  </Card>
</CardGroup>
