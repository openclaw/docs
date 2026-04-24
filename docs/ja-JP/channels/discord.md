---
read_when:
    - Discordチャンネル機能の作業中
summary: Discordボットのサポート状況、機能、設定
title: Discord
x-i18n:
    generated_at: "2026-04-24T04:45:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce73e0e6995702f3b2453b2e5ab4e55b02190e64fdf5805f53b4002be63140a2
    source_path: channels/discord.md
    workflow: 15
---

公式のDiscord gateway を介して、DM と guild チャンネルの両方に対応しています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    DiscordのDMはデフォルトでペアリングモードです。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

新しいアプリケーションを作成してボットを追加し、そのボットをサーバーに追加して OpenClaw とペアリングする必要があります。ボットは自分専用のプライベートサーバーに追加することをおすすめします。まだサーバーがない場合は、先に[作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends** を選択）。

<Steps>
  <Step title="Discordアプリケーションとボットを作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) に移動し、**New Application** をクリックします。「OpenClaw」のような名前を付けます。

    サイドバーの **Bot** をクリックします。**Username** は OpenClaw エージェントの呼び名に設定します。

  </Step>

  <Step title="特権インテントを有効にする">
    引き続き **Bot** ページで、**Privileged Gateway Intents** までスクロールし、次を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロール許可リストと名前からIDへの照合に必須）
    - **Presence Intent**（任意。プレゼンス更新が必要な場合のみ）

  </Step>

  <Step title="ボットトークンをコピーする">
    **Bot** ページの上部に戻り、**Reset Token** をクリックします。

    <Note>
    名前に反して、これは最初のトークンを生成するだけで、何かが「リセット」されるわけではありません。
    </Note>

    トークンをコピーして保存します。これは **Bot Token** であり、すぐ次の手順で必要になります。

  </Step>

  <Step title="招待URLを生成してボットをサーバーに追加する">
    サイドバーの **OAuth2** をクリックします。サーバーにボットを追加するために、適切な権限を持つ招待URLを生成します。

    **OAuth2 URL Generator** までスクロールし、次を有効にします。

    - `bot`
    - `applications.commands`

    下に **Bot Permissions** セクションが表示されます。少なくとも次を有効にしてください。

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（任意）

    これは通常のテキストチャンネル向けの基本セットです。Discordスレッドに投稿する予定がある場合、フォーラムやメディアチャンネルでスレッドを作成または継続するワークフローを含め、**Send Messages in Threads** も有効にしてください。
    下部で生成されたURLをコピーしてブラウザに貼り付け、サーバーを選択して **Continue** をクリックして接続します。これで Discord サーバーにボットが表示されるはずです。

  </Step>

  <Step title="Developer Modeを有効にしてIDを取得する">
    Discordアプリに戻り、内部IDをコピーできるように Developer Mode を有効にする必要があります。

    1. **User Settings**（アバター横の歯車アイコン）→ **Advanced** → **Developer Mode** をオンにする
    2. サイドバーの **server icon** を右クリック → **Copy Server ID**
    3. 自分の **avatar** を右クリック → **Copy User ID**

    **Server ID** と **User ID** を Bot Token と一緒に保存してください。次の手順で、この3つすべてを OpenClaw に渡します。

  </Step>

  <Step title="サーバーメンバーからのDMを許可する">
    ペアリングを機能させるには、DiscordでボットがあなたにDMを送れるようにする必要があります。**server icon** を右クリック → **Privacy Settings** → **Direct Messages** をオンにします。

    これにより、サーバーメンバー（ボットを含む）があなたにDMを送信できるようになります。OpenClaw で Discord DM を使いたい場合は、これを有効にしたままにしてください。guild チャンネルだけを使う予定なら、ペアリング後にDMを無効にしてもかまいません。

  </Step>

  <Step title="ボットトークンを安全に設定する（チャットで送信しないこと）">
    Discordのボットトークンはシークレットです（パスワードのようなもの）。エージェントにメッセージを送る前に、OpenClaw を実行しているマシン上で設定してください。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    OpenClaw がすでにバックグラウンドサービスとして動作している場合は、OpenClaw Mac アプリから再起動するか、`openclaw gateway run` プロセスを停止して再起動してください。

  </Step>

  <Step title="OpenClawを設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼する">
        既存の任意のチャンネル（例: Telegram）で OpenClaw エージェントとチャットし、次のように伝えます。Discord が最初のチャンネルである場合は、代わりに CLI / config タブを使用してください。

        > 「Discordのボットトークンはすでに config に設定しました。User ID `<user_id>` と Server ID `<server_id>` で Discord セットアップを完了してください。」
      </Tab>
      <Tab title="CLI / config">
        ファイルベースの config を使いたい場合は、次のように設定します。

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

        デフォルトアカウント向けの env フォールバック:

```bash
DISCORD_BOT_TOKEN=...
```

        プレーンテキストの `token` 値もサポートされています。`channels.discord.token` では、env/file/exec プロバイダー全体で SecretRef 値もサポートされています。詳細は [Secrets Management](/ja-JP/gateway/secrets) を参照してください。

      </Tab>
    </Tabs>

  </Step>

  <Step title="最初のDMペアリングを承認する">
    gateway が動作するまで待ってから、DiscordでボットにDMを送ってください。ボットはペアリングコードを返します。

    <Tabs>
      <Tab title="エージェントに依頼する">
        既存のチャンネルで、そのペアリングコードをエージェントに送信します。

        > 「このDiscordペアリングコードを承認してください: `<CODE>`」
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    ペアリングコードの有効期限は1時間です。

    これで Discord のDM経由でエージェントとチャットできるようになります。

  </Step>
</Steps>

<Note>
トークン解決はアカウント対応です。config のトークン値は env フォールバックより優先されます。`DISCORD_BOT_TOKEN` はデフォルトアカウントにのみ使用されます。
高度な送信呼び出し（message tool/channel actions）では、明示的な呼び出しごとの `token` がその呼び出しに使われます。これは送信と read/probe 系アクション（たとえば read/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシーや再試行設定は、アクティブなランタイムスナップショットで選択されたアカウントから引き続き取得されます。
</Note>

## 推奨: guild ワークスペースを設定する

DMが動作したら、Discordサーバーを完全なワークスペースとして設定できます。そこでは各チャンネルが、それぞれ独自のコンテキストを持つ専用のエージェントセッションになります。これは、あなたとボットだけのプライベートサーバーにおすすめです。

<Steps>
  <Step title="サーバーをguild許可リストに追加する">
    これにより、エージェントはDMだけでなく、サーバー上の任意のチャンネルで応答できるようになります。

    <Tabs>
      <Tab title="エージェントに依頼する">
        > 「私のDiscord Server ID `<server_id>` を guild 許可リストに追加してください」
      </Tab>
      <Tab title="Config">

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

  <Step title="@mention なしでの応答を許可する">
    デフォルトでは、エージェントは guild チャンネル内で @mention された場合にのみ応答します。プライベートサーバーでは、すべてのメッセージに応答するようにしたい場合が多いでしょう。

    <Tabs>
      <Tab title="エージェントに依頼する">
        > 「このサーバーでは、私のエージェントが @mention されなくても応答できるようにしてください」
      </Tab>
      <Tab title="Config">
        guild config で `requireMention: false` を設定します。

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

      </Tab>
    </Tabs>

  </Step>

  <Step title="guild チャンネルでのメモリ運用を計画する">
    デフォルトでは、長期メモリ（MEMORY.md）はDMセッションでのみ読み込まれます。guild チャンネルでは MEMORY.md は自動読み込みされません。

    <Tabs>
      <Tab title="エージェントに依頼する">
        > 「Discordチャンネルで質問したとき、MEMORY.md の長期コンテキストが必要なら memory_search または memory_get を使ってください。」
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有コンテキストが必要な場合は、安定した指示を `AGENTS.md` または `USER.md` に置いてください（これらは毎セッション注入されます）。長期メモは `MEMORY.md` に保持し、必要に応じて memory tools でアクセスしてください。
      </Tab>
    </Tabs>

  </Step>
</Steps>

ここまでできたら、Discordサーバーにいくつかチャンネルを作成して会話を始めてください。エージェントはチャンネル名を認識でき、各チャンネルは独立した専用セッションになります。つまり、`#coding`、`#home`、`#research` など、ワークフローに合った構成にできます。

## ランタイムモデル

- Gateway が Discord 接続を管理します。
- 返信ルーティングは決定的です。Discordからの受信返信は Discord に返ります。
- デフォルトでは（`session.dmScope=main`）、ダイレクトチャットはエージェントのメインセッション（`agent:main:main`）を共有します。
- guild チャンネルは分離されたセッションキーです（`agent:<agentId>:discord:channel:<channelId>`）。
- グループDMはデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブスラッシュコマンドは分離されたコマンドセッション（`agent:<agentId>:discord:slash:<userId>`）で実行されますが、ルーティングされた会話セッションには `CommandTargetSessionKey` も保持されます。

## フォーラムチャンネル

Discordのフォーラムチャンネルとメディアチャンネルは、スレッド投稿のみ受け付けます。OpenClaw はそれらを作成する2つの方法をサポートしています。

- フォーラム親 (`channel:<forumId>`) にメッセージを送信して、スレッドを自動作成する。スレッドタイトルには、メッセージの最初の空でない行が使われます。
- `openclaw message thread create` を使ってスレッドを直接作成する。フォーラムチャンネルでは `--message-id` を渡さないでください。

例: フォーラム親に送信してスレッドを作成する

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

例: フォーラムスレッドを明示的に作成する

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

フォーラム親は Discord components を受け付けません。components が必要な場合は、スレッド自体 (`channel:<threadId>`) に送信してください。

## インタラクティブcomponents

OpenClaw は、エージェントメッセージ向けに Discord components v2 containers をサポートしています。`components` ペイロードを指定して message tool を使用してください。インタラクション結果は通常の受信メッセージとしてエージェントにルーティングされ、既存の Discord `replyToMode` 設定に従います。

サポートされるブロック:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- アクション行には最大5個のボタン、または1つのセレクトメニューを配置可能
- セレクト型: `string`, `user`, `role`, `mentionable`, `channel`

デフォルトでは、components は単回使用です。ボタン、セレクト、フォームを有効期限まで複数回使えるようにするには、`components.reusable=true` を設定してください。

誰がボタンをクリックできるかを制限するには、そのボタンに `allowedUsers` を設定します（Discord user ID、タグ、または `*`）。設定されている場合、一致しないユーザーには ephemeral な拒否メッセージが返されます。

`/model` および `/models` スラッシュコマンドは、プロバイダーとモデルのドロップダウン、および Submit ステップを備えたインタラクティブなモデルピッカーを開きます。`commands.modelsWrite=false` でない限り、`/models add` はチャットから新しいプロバイダー/モデル項目を追加することもサポートし、新しく追加されたモデルは gateway の再起動なしで表示されます。ピッカーの返信は ephemeral で、実行したユーザーだけが使用できます。

ファイル添付:

- `file` ブロックは添付参照 (`attachment://<filename>`) を指している必要があります
- 添付は `media`/`path`/`filePath`（単一ファイル）で指定します。複数ファイルには `media-gallery` を使用してください
- アップロード名を添付参照に合わせたい場合は `filename` を使って上書きします

モーダルフォーム:

- 最大 5 フィールドまでの `components.modal` を追加
- フィールド型: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw はトリガーボタンを自動で追加します

例:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "任意のフォールバックテキスト",
  components: {
    reusable: true,
    text: "パスを選択",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "承認",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "却下", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "オプションを選択",
          options: [
            { label: "オプション A", value: "a" },
            { label: "オプション B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "詳細",
      triggerLabel: "フォームを開く",
      fields: [
        { type: "text", label: "依頼者" },
        {
          type: "select",
          label: "優先度",
          options: [
            { label: "低", value: "low" },
            { label: "高", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## アクセス制御とルーティング

<Tabs>
  <Tab title="DMポリシー">
    `channels.discord.dmPolicy` は DM アクセスを制御します（旧式: `channels.discord.dm.policy`）。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.discord.allowFrom` に `"*"` が含まれている必要があります。旧式: `channels.discord.dm.allowFrom`）
    - `disabled`

    DM ポリシーが open でない場合、未知のユーザーはブロックされます（`pairing` モードではペアリングを促されます）。

    マルチアカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合に `channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    配信時の DM ターゲット形式:

    - `user:<id>`
    - `<@id>` mention

    生の数値 ID は曖昧であり、明示的な user/channel ターゲット種別が指定されていない限り拒否されます。

  </Tab>

  <Tab title="Guildポリシー">
    guild の処理は `channels.discord.groupPolicy` で制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合の安全なベースラインは `allowlist` です。

    `allowlist` の動作:

    - guild は `channels.discord.guilds` と一致する必要があります（`id` 推奨、slug も可）
    - 任意の送信者許可リスト: `users`（安定した ID を推奨）と `roles`（ロール ID のみ）。どちらかが設定されている場合、送信者は `users` または `roles` のどちらかに一致すれば許可されます
    - 直接の名前/タグ照合はデフォルトで無効です。`channels.discord.dangerouslyAllowNameMatching: true` は緊急時の互換モードとしてのみ有効にしてください
    - `users` では名前/タグもサポートされますが、ID の方が安全です。名前/タグのエントリーが使われている場合、`openclaw security audit` は警告を出します
    - guild に `channels` が設定されている場合、一覧にないチャンネルは拒否されます
    - guild に `channels` ブロックがない場合、その許可リスト済み guild 内のすべてのチャンネルが許可されます

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
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    `DISCORD_BOT_TOKEN` だけを設定し、`channels.discord` ブロックを作成しない場合、`channels.defaults.groupPolicy` が `open` であっても、ランタイムフォールバックは `groupPolicy="allowlist"` になります（ログに警告が出ます）。

  </Tab>

  <Tab title="mention とグループDM">
    guild メッセージはデフォルトで mention によるゲートがあります。

    mention 検出には次が含まれます。

    - 明示的なボット mention
    - 設定された mention パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - サポートされるケースでの暗黙の reply-to-bot 動作

    `requireMention` は guild/channel ごとに設定されます（`channels.discord.guilds...`）。
    `ignoreOtherMentions` は、別のユーザー/ロールには mention しているがボットには mention していないメッセージを任意で破棄します（@everyone/@here は除く）。

    グループDM:

    - デフォルト: 無視される（`dm.groupEnabled=false`）
    - 任意の許可リスト: `dm.groupChannels`（チャンネル ID または slug）

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

`bindings[].match.roles` を使用すると、Discord guild メンバーをロール ID ごとに異なるエージェントへルーティングできます。ロールベースの binding はロール ID のみを受け付け、peer または parent-peer binding の後、guild-only binding の前に評価されます。binding に他の match フィールド（たとえば `peer` + `guildId` + `roles`）も設定されている場合、設定されたすべてのフィールドが一致する必要があります。

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

## ネイティブコマンドとコマンド認可

- `commands.native` のデフォルトは `"auto"` で、Discord では有効です。
- チャンネルごとの上書き: `channels.discord.commands.native`
- `commands.native=false` は、以前登録された Discord ネイティブコマンドを明示的に解除します。
- ネイティブコマンド認可は、通常のメッセージ処理と同じ Discord 許可リスト/ポリシーを使用します。
- 認可されていないユーザーにもコマンドが Discord UI に表示されることがありますが、実行時には OpenClaw の認可が引き続き適用され、「not authorized」が返されます。

コマンドカタログと動作については [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能の詳細

<AccordionGroup>
  <Accordion title="返信タグとネイティブ返信">
    Discord はエージェント出力内の返信タグをサポートしています。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    これは `channels.discord.replyToMode` で制御されます。

    - `off`（デフォルト）
    - `first`
    - `all`
    - `batched`

    注: `off` は暗黙の返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き有効です。
    `first` は、そのターンの最初の送信 Discord メッセージに常に暗黙のネイティブ返信参照を付加します。
    `batched` は、受信ターンが複数メッセージのデバウンス済みバッチだった場合にのみ、Discord の暗黙のネイティブ返信参照を付加します。これは、ネイティブ返信を単発メッセージのターンすべてではなく、主に曖昧なバースト的チャットに対して使いたい場合に便利です。

    メッセージ ID はコンテキスト/履歴内で提供されるため、エージェントは特定のメッセージをターゲットにできます。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClaw は、一時メッセージを送信し、テキストが届くたびにそれを編集することで、下書き返信をストリーミングできます。`channels.discord.streaming` には `off`（デフォルト） | `partial` | `block` | `progress` を指定します。`progress` は Discord では `partial` にマップされます。`streamMode` は旧式の別名であり、自動移行されます。

    複数のボットまたは gateway が同じアカウントを共有していると、Discord のプレビュー編集はすぐにレート制限に達するため、デフォルトは `off` のままです。

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` は、トークン到着に合わせて単一のプレビューメッセージを編集します。
    - `block` は、下書きサイズのチャンクを出力します（サイズと区切り位置は `draftChunk` で調整し、`textChunkLimit` に収まるよう制限されます）。
    - メディア、エラー、明示的返信の最終メッセージは、保留中のプレビュー編集をキャンセルします。
    - `streaming.preview.toolProgress`（デフォルト `true`）は、tool/progress 更新でプレビューメッセージを再利用するかを制御します。

    プレビューストリーミングはテキスト専用です。メディア返信は通常配信にフォールバックします。`block` ストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためプレビューストリームをスキップします。

  </Accordion>

  <Accordion title="履歴、コンテキスト、スレッド動作">
    guild 履歴コンテキスト:

    - `channels.discord.historyLimit` のデフォルトは `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    DM 履歴の制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    スレッド動作:

    - Discord スレッドはチャンネルセッションとしてルーティングされ、上書きがない限り親チャンネル設定を継承します。
    - `channels.discord.thread.inheritParent`（デフォルト `false`）は、新しい自動スレッドで親トランスクリプトからの初期化を有効にします。アカウントごとの上書きは `channels.discord.accounts.<id>.thread.inheritParent` にあります。
    - message-tool のリアクションは `user:<id>` の DM ターゲットを解決できます。
    - `guilds.<guild>.channels.<channel>.requireMention: false` は、返信段階のアクティベーションフォールバック中も保持されます。

    チャンネルトピックは**信頼されていない**コンテキストとして注入されます。許可リストは誰がエージェントをトリガーできるかを制御しますが、完全な補助コンテキストの秘匿境界ではありません。

  </Accordion>

  <Accordion title="subagent 用のスレッド紐付けセッション">
    Discord では、スレッドをセッションターゲットに紐付けることで、そのスレッド内の後続メッセージを同じセッション（subagent セッションを含む）へルーティングし続けることができます。

    コマンド:

    - `/focus <target>` 現在または新規のスレッドを subagent/セッションターゲットに紐付ける
    - `/unfocus` 現在のスレッド紐付けを解除する
    - `/agents` アクティブな実行と紐付け状態を表示する
    - `/session idle <duration|off>` フォーカス済み binding の非アクティブ時自動 unfocus を確認/更新する
    - `/session max-age <duration|off>` フォーカス済み binding のハード最大有効期間を確認/更新する

    Config:

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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    注:

    - `session.threadBindings.*` はグローバルデフォルトを設定します。
    - `channels.discord.threadBindings.*` は Discord の動作を上書きします。
    - `sessions_spawn({ thread: true })` に対してスレッドを自動作成/紐付けするには `spawnSubagentSessions` を true にする必要があります。
    - ACP（`/acp spawn ... --thread ...` または `sessions_spawn({ runtime: "acp", thread: true })`）に対してスレッドを自動作成/紐付けするには `spawnAcpSessions` を true にする必要があります。
    - アカウントでスレッド binding が無効な場合、`/focus` と関連するスレッド binding 操作は利用できません。

    [Sub-agents](/ja-JP/tools/subagents)、[ACP Agents](/ja-JP/tools/acp-agents)、および [Configuration Reference](/ja-JP/gateway/configuration-reference) を参照してください。

  </Accordion>

  <Accordion title="永続的なACPチャンネルbinding">
    安定した「常時稼働」ACPワークスペースには、Discord 会話を対象とするトップレベルの型付き ACP binding を設定します。

    Config パス:

    - `type: "acp"` と `match.channel: "discord"` を持つ `bindings[]`

    例:

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

    注:

    - `/acp spawn codex --bind here` は現在のチャンネルまたはスレッドをその場で紐付けし、以後のメッセージを同じ ACP セッションに維持します。スレッドメッセージは親チャンネルの binding を継承します。
    - binding 済みのチャンネルまたはスレッドでは、`/new` と `/reset` は同じ ACP セッションをその場でリセットします。一時的なスレッド binding は、有効な間はターゲット解決を上書きできます。
    - `spawnAcpSessions` は、OpenClaw が `--thread auto|here` を使って子スレッドを作成/紐付けする必要がある場合にのみ必要です。

    binding 動作の詳細については [ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

  </Accordion>

  <Accordion title="リアクション通知">
    guild ごとのリアクション通知モード:

    - `off`
    - `own`（デフォルト）
    - `all`
    - `allowlist`（`guilds.<id>.users` を使用）

    リアクションイベントはシステムイベントに変換され、ルーティングされた Discord セッションに付加されます。

  </Accordion>

  <Accordion title="確認リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間、確認用の絵文字を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェント identity の絵文字フォールバック（`agents.list[].identity.emoji`、なければ `"👀"`）

    注:

    - Discord は Unicode 絵文字またはカスタム絵文字名を受け付けます。
    - チャンネルまたはアカウントでリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="Config 書き込み">
    チャンネル起点の config 書き込みはデフォルトで有効です。

    これは `/config set|unset` フローに影響します（コマンド機能が有効な場合）。

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
    `channels.discord.proxy` を使うと、Discord gateway の WebSocket トラフィックと起動時の REST 参照（application ID + allowlist 解決）を HTTP(S) プロキシ経由でルーティングできます。

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

  <Accordion title="PluralKit サポート">
    PluralKit 解決を有効にして、プロキシされたメッセージをシステムメンバー identity にマッピングします。

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 任意。プライベートシステムに必要
      },
    },
  },
}
```

    注:

    - 許可リストでは `pk:<memberId>` を使用できます
    - メンバー表示名は、`channels.discord.dangerouslyAllowNameMatching: true` の場合にのみ名前/slug で照合されます
    - 参照には元のメッセージ ID が使われ、時間ウィンドウ制約があります
    - 参照に失敗した場合、プロキシされたメッセージはボットメッセージとして扱われ、`allowBots=true` でない限り破棄されます

  </Accordion>

  <Accordion title="プレゼンス設定">
    ステータスまたはアクティビティフィールドを設定したとき、または自動プレゼンスを有効にしたときに、プレゼンス更新が適用されます。

    ステータスのみの例:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    アクティビティの例（カスタムステータスがデフォルトのアクティビティ種別）:

```json5
{
  channels: {
    discord: {
      activity: "集中時間",
      activityType: 4,
    },
  },
}
```

    ストリーミングの例:

```json5
{
  channels: {
    discord: {
      activity: "ライブコーディング",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    アクティビティ種別マップ:

    - 0: Playing
    - 1: Streaming（`activityUrl` が必要）
    - 2: Listening
    - 3: Watching
    - 4: Custom（アクティビティテキストをステータス状態として使用。絵文字は任意）
    - 5: Competing

    自動プレゼンスの例（ランタイムヘルスシグナル）:

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "トークン枯渇",
      },
    },
  },
}
```

    自動プレゼンスは、ランタイム可用性を Discord ステータスにマッピングします: healthy => online、degraded または unknown => idle、exhausted または unavailable => dnd。任意のテキスト上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（`{reason}` プレースホルダーをサポート）

  </Accordion>

  <Accordion title="Discord での承認">
    Discord は DM でのボタンベース承認処理をサポートし、必要に応じて元のチャンネルに承認プロンプトを投稿することもできます。

    Config パス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（任意。可能なら `commands.ownerAllowFrom` にフォールバック）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    `enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` のいずれかから少なくとも 1 人の approver を解決できる場合、Discord はネイティブ exec 承認を自動有効化します。Discord は、チャンネルの `allowFrom`、旧式の `dm.allowFrom`、またはダイレクトメッセージの `defaultTo` から exec approver を推論しません。ネイティブ承認クライアントとしての Discord を明示的に無効にするには `enabled: false` を設定してください。

    `target` が `channel` または `both` の場合、承認プロンプトはチャンネル内に表示されます。解決済みの approver のみがボタンを使用でき、それ以外のユーザーには ephemeral な拒否メッセージが返されます。承認プロンプトにはコマンドテキストが含まれるため、チャンネル配信は信頼できるチャンネルでのみ有効にしてください。セッションキーからチャンネル ID を導出できない場合、OpenClaw は DM 配信にフォールバックします。

    Discord は、他のチャットチャンネルで使用される共有承認ボタンもレンダリングします。ネイティブ Discord アダプターは主に approver DM ルーティングとチャンネル fanout を追加します。
    それらのボタンが存在する場合、それが主要な承認 UX になります。OpenClaw は、tool 結果でチャット承認が利用できないと示された場合、または手動承認が唯一の手段である場合にのみ、手動の `/approve` コマンドを含めるべきです。

    Gateway 認証と承認解決は共有 Gateway クライアント契約に従います（`plugin:` ID は `plugin.approval.resolve` 経由で解決され、それ以外の ID は `exec.approval.resolve` 経由で解決されます）。承認の有効期限はデフォルトで 30 分です。

    [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>
</AccordionGroup>

## Tools と action gates

Discord メッセージ action には、メッセージング、チャンネル管理、モデレーション、プレゼンス、メタデータ action が含まれます。

コア例:

- メッセージング: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- リアクション: `react`, `reactions`, `emojiList`
- モデレーション: `timeout`, `kick`, `ban`
- プレゼンス: `setPresence`

`event-create` action は、スケジュールイベントのカバー画像を設定するための任意の `image` パラメーター（URL またはローカルファイルパス）を受け付けます。

action gate は `channels.discord.actions.*` 配下にあります。

デフォルトの gate 動作:

| Action group                                                                                                                                                             | デフォルト |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 有効       |
| roles                                                                                                                                                                    | 無効       |
| moderation                                                                                                                                                               | 無効       |
| presence                                                                                                                                                                 | 無効       |

## Components v2 UI

OpenClaw は、exec 承認と cross-context マーカーのために Discord components v2 を使用します。Discord メッセージ action はカスタム UI 用の `components` も受け付けられます（高度な用途。discord tool でコンポーネントペイロードを構築する必要があります）。一方、旧式の `embeds` も引き続き利用できますが、推奨されません。

- `channels.discord.ui.components.accentColor` は、Discord component container で使われるアクセントカラー（16進）を設定します。
- アカウントごとの設定は `channels.discord.accounts.<id>.ui.components.accentColor` です。
- components v2 が存在する場合、`embeds` は無視されます。

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

Discord には 2 つの異なる音声サーフェスがあります。リアルタイムの**音声チャンネル**（継続的な会話）と、**音声メッセージ添付**（波形プレビュー形式）です。gateway は両方をサポートします。

### 音声チャンネル

要件:

- ネイティブコマンド（`commands.native` または `channels.discord.commands.native`）を有効にする
- `channels.discord.voice` を設定する
- ボットには対象の音声チャンネルで Connect + Speak 権限が必要

セッション制御には `/vc join|leave|status` を使用します。このコマンドはアカウントのデフォルトエージェントを使い、他の Discord コマンドと同じ許可リストおよび group policy ルールに従います。

自動参加の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

注:

- `voice.tts` は音声再生専用で `messages.tts` を上書きします。
- 音声トランスクリプトターンは、Discord `allowFrom`（または `dm.allowFrom`）から owner ステータスを導出します。owner でない話者は owner 専用 tool（たとえば `gateway` や `cron`）にアクセスできません。
- 音声はデフォルトで有効です。無効にするには `channels.discord.voice.enabled=false` を設定します。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` の参加オプションにそのまま渡されます。
- `@discordjs/voice` のデフォルトは、未設定の場合 `daveEncryption=true` および `decryptionFailureTolerance=24` です。
- OpenClaw は受信復号失敗も監視し、短時間に失敗が繰り返された場合は音声チャンネルから退出/再参加して自動回復します。
- 受信ログに `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合、これは [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) で追跡されている上流の `@discordjs/voice` 受信バグである可能性があります。

### 音声メッセージ

Discord の音声メッセージは波形プレビューを表示し、OGG/Opus 音声を必要とします。OpenClaw は波形を自動生成しますが、検査と変換のために gateway ホスト上に `ffmpeg` と `ffprobe` が必要です。

- **ローカルファイルパス**を指定してください（URL は拒否されます）。
- テキストコンテンツは省略してください（Discord は同じペイロード内のテキスト + 音声メッセージを拒否します）。
- 任意の音声形式を使用できます。必要に応じて OpenClaw が OGG/Opus に変換します。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていないインテントを使用した、またはボットが guild メッセージを認識しない">

    - Message Content Intent を有効にする
    - ユーザー/メンバー解決に依存する場合は Server Members Intent を有効にする
    - インテント変更後に gateway を再起動する

  </Accordion>

  <Accordion title="guild メッセージが予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` 配下の guild 許可リストを確認する
    - guild に `channels` マップが存在する場合、一覧にあるチャンネルのみが許可される
    - `requireMention` の動作と mention パターンを確認する

    便利な確認コマンド:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="requireMention が false なのにまだブロックされる">
    よくある原因:

    - 一致する guild/channel 許可リストがない状態での `groupPolicy="allowlist"`
    - 誤った場所に `requireMention` を設定している（`channels.discord.guilds` またはチャンネルエントリー配下である必要があります）
    - 送信者が guild/channel の `users` 許可リストでブロックされている

  </Accordion>

  <Accordion title="長時間実行ハンドラーがタイムアウトする、または返信が重複する">

    典型的なログ:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    リスナー予算のノブ:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - マルチアカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    worker 実行タイムアウトのノブ:

    - 単一アカウント: `channels.discord.inboundWorker.runTimeoutMs`
    - マルチアカウント: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - デフォルト: `1800000`（30 分）。無効にするには `0` を設定

    推奨ベースライン:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    遅いリスナー初期化には `eventQueue.listenerTimeout` を使い、キューされたエージェントターンに別の安全弁を設けたい場合にのみ `inboundWorker.runTimeoutMs` を使用してください。

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` の権限チェックは、数値のチャンネル ID でのみ機能します。

    slug キーを使用している場合、ランタイムでの一致は機能することがありますが、probe では権限を完全に検証できません。

  </Accordion>

  <Accordion title="DM とペアリングの問題">

    - DM が無効: `channels.discord.dm.enabled=false`
    - DM ポリシーが無効: `channels.discord.dmPolicy="disabled"`（旧式: `channels.discord.dm.policy`）
    - `pairing` モードでペアリング承認待ち

  </Accordion>

  <Accordion title="ボット間ループ">
    デフォルトでは、ボット作成メッセージは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるために厳格な mention と許可リストのルールを使ってください。
    ボットを mention したボットメッセージのみ受け付けるには、`channels.discord.allowBots="mentions"` を推奨します。

  </Accordion>

  <Accordion title="DecryptionFailed(...) による音声 STT のドロップ">

    - Discord 音声受信の回復ロジックが含まれるよう、OpenClaw を最新に保つ（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）を確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（上流デフォルト）から始め、必要な場合のみ調整する
    - 次のログを監視する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集し、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と比較してください

  </Accordion>
</AccordionGroup>

## 設定リファレンス

主なリファレンス: [Configuration reference - Discord](/ja-JP/gateway/config-channels#discord)。

<Accordion title="重要度の高い Discord フィールド">

- 起動/認証: `enabled`, `token`, `accounts.*`, `allowBots`
- ポリシー: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- コマンド: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- イベントキュー: `eventQueue.listenerTimeout`（リスナー予算）、`eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- 返信/履歴: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- ストリーミング: `streaming`（旧式の別名: `streamMode`）、`streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- メディア/再試行: `mediaMaxMb`（Discord への送信アップロード上限、デフォルト `100MB`）、`retry`
- action: `actions.*`
- プレゼンス: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- 機能: `threadBindings`, トップレベル `bindings[]`（`type: "acp"`）、`pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## 安全性と運用

- ボットトークンはシークレットとして扱ってください（監視付き環境では `DISCORD_BOT_TOKEN` を推奨）。
- Discord 権限は最小権限にしてください。
- コマンドのデプロイ/状態が古い場合は、gateway を再起動し、`openclaw channels status --probe` で再確認してください。

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord ユーザーを gateway とペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループチャットと許可リストの動作。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントへルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルとハードニング。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    guild とチャンネルをエージェントにマッピングします。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作。
  </Card>
</CardGroup>
