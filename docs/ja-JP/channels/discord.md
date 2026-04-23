---
read_when:
    - Discord チャンネル機能に対応中
summary: Discord bot のサポート状況、機能、設定
title: Discord
x-i18n:
    generated_at: "2026-04-23T13:57:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1160a0b221bc3251722a81c00c65ee7c2001efce345248727f1f3c8580a0e953
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

ステータス: 公式の Discord gateway 経由で DM と guild channels に対応済みです。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord の DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブなコマンド動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

新しい application を bot 付きで作成し、その bot をサーバーに追加して、OpenClaw とペアリングする必要があります。bot は自分専用のプライベートサーバーに追加することをおすすめします。まだ持っていない場合は、先に[作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends** を選択）。

<Steps>
  <Step title="Discord application と bot を作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) に移動し、**New Application** をクリックします。名前は「OpenClaw」のようなものにしてください。

    サイドバーで **Bot** をクリックします。**Username** には、OpenClaw agent に付けている名前を設定します。

  </Step>

  <Step title="特権 intents を有効にする">
    引き続き **Bot** ページで、下にスクロールして **Privileged Gateway Intents** を見つけ、以下を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。role allowlist と name-to-ID matching に必須）
    - **Presence Intent**（任意。presence updates が必要な場合のみ）

  </Step>

  <Step title="bot token をコピーする">
    **Bot** ページの上部に戻り、**Reset Token** をクリックします。

    <Note>
    名前に反して、これは最初の token を生成する操作であり、「reset」されるものはありません。
    </Note>

    token をコピーして保存してください。これは **Bot Token** で、すぐ後で必要になります。

  </Step>

  <Step title="招待 URL を生成して bot をサーバーに追加する">
    サイドバーで **OAuth2** をクリックします。bot をサーバーに追加するため、適切な権限を持つ招待 URL を生成します。

    下にスクロールして **OAuth2 URL Generator** を見つけ、以下を有効にします。

    - `bot`
    - `applications.commands`

    その下に **Bot Permissions** セクションが表示されます。少なくとも以下を有効にしてください。

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（任意）

    これは通常の text channels 用の基本セットです。forum や media channel のワークフローで thread を作成または継続する場合を含め、Discord threads へ投稿する予定があるなら、**Send Messages in Threads** も有効にしてください。
    下部に生成された URL をコピーし、ブラウザに貼り付けて、サーバーを選択し、**Continue** をクリックして接続します。これで Discord サーバー内に bot が表示されるはずです。

  </Step>

  <Step title="Developer Mode を有効にして ID を収集する">
    Discord app に戻り、内部 ID をコピーできるように Developer Mode を有効にする必要があります。

    1. **User Settings**（アバター横の歯車アイコン）→ **Advanced** → **Developer Mode** をオンにする
    2. サイドバーの **server icon** を右クリック → **Copy Server ID**
    3. 自分の **avatar** を右クリック → **Copy User ID**

    **Server ID** と **User ID** を Bot Token と一緒に保存してください。次のステップでこの 3 つすべてを OpenClaw に渡します。

  </Step>

  <Step title="サーバーメンバーからの DM を許可する">
    ペアリングを機能させるには、Discord で bot があなたに DM を送れる必要があります。**server icon** を右クリック → **Privacy Settings** → **Direct Messages** をオンにします。

    これにより、サーバーメンバー（bot を含む）があなたに DM を送れるようになります。OpenClaw で Discord DM を使いたい場合は、この設定を有効のままにしてください。guild channels だけを使う予定なら、ペアリング後に DM を無効にしてもかまいません。

  </Step>

  <Step title="bot token を安全に設定する（チャットに送信しないでください）">
    Discord bot token はシークレットです（パスワードのようなものです）。agent にメッセージを送る前に、OpenClaw を実行しているマシンで設定してください。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    OpenClaw がすでにバックグラウンドサービスとして動作している場合は、OpenClaw Mac app から再起動するか、`openclaw gateway run` プロセスを停止して再起動してください。

  </Step>

  <Step title="OpenClaw を設定してペアリングする">

    <Tabs>
      <Tab title="agent に依頼する">
        既存の任意のチャンネル（例: Telegram）で OpenClaw agent とチャットして伝えてください。Discord が最初のチャンネルである場合は、代わりに CLI / config タブを使用してください。

        > 「Discord bot token はすでに config に設定しました。User ID `<user_id>` と Server ID `<server_id>` で Discord セットアップを完了してください。」
      </Tab>
      <Tab title="CLI / config">
        ファイルベースの config を使いたい場合は、以下を設定します。

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

        デフォルト account の env fallback:

```bash
DISCORD_BOT_TOKEN=...
```

        平文の `token` 値にも対応しています。`channels.discord.token` では env/file/exec providers 全体で SecretRef 値もサポートされます。詳しくは [Secrets Management](/ja-JP/gateway/secrets) を参照してください。

      </Tab>
    </Tabs>

  </Step>

  <Step title="最初の DM ペアリングを承認する">
    gateway が実行中になるまで待ってから、Discord で bot に DM を送ってください。bot はペアリングコードを返します。

    <Tabs>
      <Tab title="agent に依頼する">
        ペアリングコードを既存のチャンネルで agent に送ってください。

        > 「この Discord pairing code を承認してください: `<CODE>`」
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    ペアリングコードの有効期限は 1 時間です。

    これで Discord の DM 経由で agent とチャットできるようになるはずです。

  </Step>
</Steps>

<Note>
token 解決は account-aware です。config の token 値は env fallback より優先されます。`DISCORD_BOT_TOKEN` はデフォルト account でのみ使用されます。
高度な outbound calls（message tool/channel actions）では、呼び出しごとの明示的な `token` がその呼び出しに使用されます。これは send と read/probe 系の actions（たとえば read/search/fetch/thread/pins/permissions）に適用されます。account policy/retry settings は引き続き、アクティブ runtime snapshot で選択された account から取得されます。
</Note>

## 推奨: guild workspace をセットアップする

DM が動作したら、Discord サーバーを完全な workspace としてセットアップできます。各チャンネルが独自のコンテキストを持つ独立した agent session になります。これは、自分と bot だけのプライベートサーバーにおすすめです。

<Steps>
  <Step title="サーバーを guild allowlist に追加する">
    これにより、agent は DM だけでなく、サーバー上の任意のチャンネルで応答できるようになります。

    <Tabs>
      <Tab title="agent に依頼する">
        > 「私の Discord Server ID `<server_id>` を guild allowlist に追加してください」
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
    デフォルトでは、agent は guild channels では @mention された場合にのみ応答します。プライベートサーバーでは、おそらくすべてのメッセージに応答させたいでしょう。

    <Tabs>
      <Tab title="agent に依頼する">
        > 「このサーバーでは、@mentioned しなくても agent が応答できるようにしてください」
      </Tab>
      <Tab title="Config">
        guild config の `requireMention: false` を設定します。

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

  <Step title="guild channels での memory を計画する">
    デフォルトでは、長期 memory（MEMORY.md）は DM sessions でのみ読み込まれます。guild channels では MEMORY.md は自動読み込みされません。

    <Tabs>
      <Tab title="agent に依頼する">
        > 「Discord channels で質問するとき、MEMORY.md の長期コンテキストが必要なら memory_search または memory_get を使ってください。」
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有コンテキストが必要な場合は、安定した指示を `AGENTS.md` または `USER.md` に書いてください（これらはすべての session に注入されます）。長期メモは `MEMORY.md` に保持し、必要に応じて memory tools でアクセスしてください。
      </Tab>
    </Tabs>

  </Step>
</Steps>

では、Discord サーバーにいくつかチャンネルを作成してチャットを始めてください。agent はチャンネル名を見ることができ、各チャンネルは独立した isolated session を持ちます。つまり、`#coding`、`#home`、`#research` など、ワークフローに合ったものを設定できます。

## ランタイムモデル

- Gateway が Discord 接続を管理します。
- 返信ルーティングは決定的です。Discord からの入力への返信は Discord に返ります。
- デフォルトでは（`session.dmScope=main`）、direct chats は agent main session（`agent:main:main`）を共有します。
- Guild channels は独立した session keys（`agent:<agentId>:discord:channel:<channelId>`）です。
- Group DMs はデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブのスラッシュコマンドは独立した command sessions（`agent:<agentId>:discord:slash:<userId>`）で実行されますが、ルーティング先会話 session への `CommandTargetSessionKey` は引き続き保持されます。

## Forum channels

Discord の forum と media channels は thread 投稿のみを受け付けます。OpenClaw はそれらを作成する 2 つの方法をサポートしています。

- forum 親 (`channel:<forumId>`) にメッセージを送信して thread を自動作成する。thread title にはメッセージの最初の空でない行が使われます。
- `openclaw message thread create` を使って thread を直接作成する。forum channels では `--message-id` を渡さないでください。

例: forum 親に送信して thread を作成する

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

例: forum thread を明示的に作成する

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

forum 親は Discord components を受け付けません。components が必要な場合は、thread 自体（`channel:<threadId>`）に送信してください。

## Interactive components

OpenClaw は agent messages 向けに Discord components v2 containers をサポートしています。`components` payload を指定して message tool を使用してください。interaction results は通常の入力メッセージとして agent にルーティングされ、既存の Discord `replyToMode` 設定に従います。

サポートされる blocks:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Action rows では最大 5 個の buttons または 1 つの select menu を使用可能
- Select types: `string`, `user`, `role`, `mentionable`, `channel`

デフォルトでは、components は 1 回限りです。buttons、selects、forms を有効期限まで複数回使えるようにするには、`components.reusable=true` を設定してください。

誰が button をクリックできるか制限するには、その button に `allowedUsers` を設定します（Discord user IDs、tags、または `*`）。設定されている場合、一致しないユーザーには ephemeral denial が返されます。

`/model` と `/models` のスラッシュコマンドでは、provider と model の dropdowns に Submit ステップを加えた interactive model picker が開きます。`commands.modelsWrite=false` でない限り、`/models add` ではチャットから新しい provider/model entry を追加することもでき、新しく追加された models は gateway を再起動しなくても表示されます。picker reply は ephemeral で、実行したユーザーだけが使用できます。

ファイル添付:

- `file` blocks は attachment 参照（`attachment://<filename>`）を指している必要があります
- 添付は `media`/`path`/`filePath`（単一ファイル）で指定します。複数ファイルには `media-gallery` を使用してください
- アップロード名を attachment 参照に合わせたい場合は `filename` を使って上書きします

Modal forms:

- 最大 5 フィールドまでの `components.modal` を追加
- フィールド型: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw は trigger button を自動的に追加します

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
    `channels.discord.dmPolicy` は DM アクセスを制御します（旧: `channels.discord.dm.policy`）。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.discord.allowFrom` に `"*"` を含める必要があります。旧: `channels.discord.dm.allowFrom`）
    - `disabled`

    DM ポリシーが open でない場合、未知のユーザーはブロックされます（`pairing` モードではペアリングを促されます）。

    複数 account の優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` account にのみ適用されます。
    - 名前付き account は、自身の `allowFrom` が未設定の場合に `channels.discord.allowFrom` を継承します。
    - 名前付き account は `channels.discord.accounts.default.allowFrom` を継承しません。

    配信時の DM target 形式:

    - `user:<id>`
    - `<@id>` mention

    kind が明示された user/channel target が指定されていない限り、数値 ID 単体は曖昧なため拒否されます。

  </Tab>

  <Tab title="Guild ポリシー">
    guild の処理は `channels.discord.groupPolicy` によって制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合の安全なベースラインは `allowlist` です。

    `allowlist` の動作:

    - guild は `channels.discord.guilds` に一致する必要があります（`id` 推奨、slug も可）
    - 任意の送信者 allowlist: `users`（安定した ID 推奨）と `roles`（role ID のみ）。どちらかが設定されている場合、送信者は `users` または `roles` のいずれかに一致すれば許可されます
    - 直接の name/tag matching はデフォルトで無効です。破壊回避用の互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
    - `users` には names/tags も使えますが、ID のほうが安全です。name/tag entries が使われていると `openclaw security audit` が警告します
    - guild に `channels` が設定されている場合、一覧にない channels は拒否されます
    - guild に `channels` ブロックがない場合、その allowlist 済み guild 内のすべての channels が許可されます

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

    `DISCORD_BOT_TOKEN` だけを設定し、`channels.discord` ブロックを作成しない場合、たとえ `channels.defaults.groupPolicy` が `open` でも、ランタイム fallback は `groupPolicy="allowlist"` になります（ログに警告が出ます）。

  </Tab>

  <Tab title="Mention と group DMs">
    guild messages はデフォルトで mention 制限があります。

    mention の検出対象:

    - bot への明示的な mention
    - 設定済みの mention patterns（`agents.list[].groupChat.mentionPatterns`、fallback は `messages.groupChat.mentionPatterns`）
    - サポートされるケースでの暗黙的な reply-to-bot 動作

    `requireMention` は guild/channel ごとに設定します（`channels.discord.guilds...`）。
    `ignoreOtherMentions` は、別の user/role には言及しているが bot には言及していないメッセージを任意で破棄します（@everyone/@here を除く）。

    Group DMs:

    - デフォルト: 無視されます（`dm.groupEnabled=false`）
    - 任意の allowlist: `dm.groupChannels`（channel IDs または slugs）

  </Tab>
</Tabs>

### ロールベースの agent ルーティング

`bindings[].match.roles` を使うと、Discord guild members を role ID ごとに異なる agent にルーティングできます。ロールベースの bindings は role IDs のみを受け付け、peer または parent-peer bindings の後、guild-only bindings の前に評価されます。binding に他の match fields（たとえば `peer` + `guildId` + `roles`）も設定されている場合は、設定されたすべての fields が一致する必要があります。

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

## Developer Portal のセットアップ

<AccordionGroup>
  <Accordion title="app と bot を作成する">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. bot token をコピー

  </Accordion>

  <Accordion title="特権 intents">
    **Bot -> Privileged Gateway Intents** で、以下を有効にします。

    - Message Content Intent
    - Server Members Intent（推奨）

    Presence intent は任意で、presence updates を受け取りたい場合にのみ必要です。bot presence（`setPresence`）の設定には、members 向けの presence updates を有効にする必要はありません。

  </Accordion>

  <Accordion title="OAuth scopes と基本権限">
    OAuth URL generator:

    - scopes: `bot`, `applications.commands`

    一般的な基本権限:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（任意）

    これは通常の text channels 用の基本セットです。forum や media channel のワークフローで thread を作成または継続する場合を含め、Discord threads へ投稿する予定があるなら、**Send Messages in Threads** も有効にしてください。
    明示的に必要でない限り、`Administrator` は避けてください。

  </Accordion>

  <Accordion title="ID をコピーする">
    Discord Developer Mode を有効にしてから、以下をコピーします。

    - server ID
    - channel ID
    - user ID

    OpenClaw config では、信頼性の高い監査と probe のために数値 ID を優先してください。

  </Accordion>
</AccordionGroup>

## ネイティブコマンドとコマンド認証

- `commands.native` のデフォルトは `"auto"` で、Discord では有効です。
- チャンネルごとの上書き: `channels.discord.commands.native`
- `commands.native=false` は、以前登録された Discord ネイティブコマンドを明示的にクリアします。
- ネイティブコマンド認証は、通常のメッセージ処理と同じ Discord allowlists/policies を使用します。
- 権限のないユーザーにも Discord UI 上では commands が表示されることがありますが、実行時には引き続き OpenClaw auth が適用され、「not authorized」が返されます。

コマンドカタログと動作については、[Slash commands](/ja-JP/tools/slash-commands) を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能の詳細

<AccordionGroup>
  <Accordion title="返信タグとネイティブ返信">
    Discord は agent output 内の返信タグをサポートします。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    これは `channels.discord.replyToMode` で制御されます。

    - `off`（デフォルト）
    - `first`
    - `all`
    - `batched`

    注: `off` は暗黙の返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。
    `first` は、そのターンの最初の outbound Discord message に暗黙のネイティブ返信参照を常に付加します。
    `batched` は、入力ターンが複数メッセージのデバウンス済みバッチだった場合にのみ、Discord の暗黙のネイティブ返信参照を付加します。これは、すべての単一メッセージターンではなく、主に曖昧でバースト的なチャットに対してネイティブ返信を使いたい場合に便利です。

    Message IDs は context/history に表示されるため、agents は特定の messages を対象にできます。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClaw は、一時メッセージを送信し、テキストの到着に応じて編集することで draft replies をストリーミングできます。`channels.discord.streaming` には `off`（デフォルト）| `partial` | `block` | `progress` を指定します。Discord では `progress` は `partial` にマップされます。`streamMode` は旧エイリアスで、自動移行されます。

    デフォルトが `off` のままなのは、複数の bots や gateways が 1 つの account を共有している場合、Discord のプレビュー編集がすぐに rate limits に達するためです。

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

    - `partial` は、token の到着に合わせて単一の preview message を編集します。
    - `block` は draft サイズの chunks を出力します（サイズと分割点の調整には `draftChunk` を使います。`textChunkLimit` に制限されます）。
    - media、error、explicit-reply finals は、保留中の preview edits をキャンセルします。
    - `streaming.preview.toolProgress`（デフォルト `true`）は、tool/progress updates が preview message を再利用するかどうかを制御します。

    Preview streaming はテキスト専用です。media replies は通常の配信に fallback します。`block` streaming が明示的に有効な場合、OpenClaw は二重ストリーミングを避けるため preview stream をスキップします。

  </Accordion>

  <Accordion title="履歴、コンテキスト、thread の動作">
    guild history context:

    - `channels.discord.historyLimit` のデフォルトは `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` で無効

    DM history controls:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread の動作:

    - Discord threads は channel sessions としてルーティングされ、上書きされていない限り親 channel config を継承します。
    - `channels.discord.thread.inheritParent`（デフォルト `false`）を有効にすると、新しい auto-threads が親 transcript から seed されます。account ごとの上書きは `channels.discord.accounts.<id>.thread.inheritParent` にあります。
    - Message-tool reactions は `user:<id>` DM targets を解決できます。
    - `guilds.<guild>.channels.<channel>.requireMention: false` は reply-stage activation fallback 中も保持されます。

    Channel topics は **untrusted** context として注入されます。allowlists は agent を誰がトリガーできるかを制御しますが、完全な supplemental-context のレダクション境界ではありません。

  </Accordion>

  <Accordion title="subagents 向けの thread-bound sessions">
    Discord では、thread を session target にバインドできるため、その thread 内の後続メッセージは同じ session（subagent sessions を含む）にルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在または新規の thread を subagent/session target にバインド
    - `/unfocus` 現在の thread binding を削除
    - `/agents` アクティブな runs と binding 状態を表示
    - `/session idle <duration|off>` focused bindings の非アクティブ時 auto-unfocus を確認/更新
    - `/session max-age <duration|off>` focused bindings のハード最大期限を確認/更新

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
    - `sessions_spawn({ thread: true })` に対して thread を自動作成・自動バインドするには、`spawnSubagentSessions` を true にする必要があります。
    - ACP（`/acp spawn ... --thread ...` または `sessions_spawn({ runtime: "acp", thread: true })`）に対して thread を自動作成・自動バインドするには、`spawnAcpSessions` を true にする必要があります。
    - account で thread bindings が無効な場合、`/focus` と関連する thread binding 操作は利用できません。

    [Sub-agents](/ja-JP/tools/subagents)、[ACP Agents](/ja-JP/tools/acp-agents)、[Configuration Reference](/ja-JP/gateway/configuration-reference) を参照してください。

  </Accordion>

  <Accordion title="永続的な ACP channel bindings">
    安定した「常時稼働」の ACP workspace には、Discord conversations を対象とするトップレベルの型付き ACP bindings を設定します。

    Config path:

    - `bindings[]` に `type: "acp"` と `match.channel: "discord"` を設定

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

    - `/acp spawn codex --bind here` は現在の channel または thread をその場でバインドし、以後のメッセージを同じ ACP session に維持します。thread messages は親 channel binding を継承します。
    - バインド済みの channel または thread では、`/new` と `/reset` は同じ ACP session をその場でリセットします。一時的な thread bindings は、有効な間は target 解決を上書きできます。
    - `spawnAcpSessions` が必要なのは、OpenClaw が `--thread auto|here` によって子 thread を作成・バインドする必要がある場合のみです。

    binding 動作の詳細は [ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

  </Accordion>

  <Accordion title="Reaction 通知">
    guild ごとの Reaction 通知モード:

    - `off`
    - `own`（デフォルト）
    - `all`
    - `allowlist`（`guilds.<id>.users` を使用）

    Reaction events は system events に変換され、ルーティング先の Discord session に添付されます。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` は、OpenClaw が入力メッセージを処理している間に確認用 emoji を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent identity emoji fallback（`agents.list[].identity.emoji`、なければ "👀"）

    注:

    - Discord は unicode emoji または custom emoji names を受け付けます。
    - channel または account で reaction を無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="Config 書き込み">
    channel 起点の config 書き込みはデフォルトで有効です。

    これは `/config set|unset` フローに影響します（command features が有効な場合）。

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

  <Accordion title="Gateway proxy">
    `channels.discord.proxy` を使うと、Discord gateway WebSocket トラフィックと起動時の REST lookup（application ID + allowlist resolution）を HTTP(S) proxy 経由でルーティングできます。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    account ごとの上書き:

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
    proxied messages を system member identity にマッピングするために、PluralKit resolution を有効にします。

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    注:

    - allowlists では `pk:<memberId>` を使用できます
    - member display names は、`channels.discord.dangerouslyAllowNameMatching: true` の場合に限り name/slug のみでマッチします
    - lookup は元の message ID を使用し、time-window の制約があります
    - lookup に失敗した場合、proxied messages は bot messages として扱われ、`allowBots=true` でない限り破棄されます

  </Accordion>

  <Accordion title="Presence 設定">
    Presence updates は、status または activity field を設定したとき、または auto presence を有効にしたときに適用されます。

    status のみの例:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Activity の例（custom status がデフォルトの activity type です）:

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

    Streaming の例:

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

    Activity type の対応:

    - 0: Playing
    - 1: Streaming（`activityUrl` が必要）
    - 2: Listening
    - 3: Watching
    - 4: Custom（activity text を status state として使用。emoji は任意）
    - 5: Competing

    Auto presence の例（runtime health signal）:

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

    Auto presence は runtime の可用性を Discord status にマッピングします: healthy => online、degraded または unknown => idle、exhausted または unavailable => dnd。任意の text 上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（`{reason}` placeholder をサポート）

  </Accordion>

  <Accordion title="Discord での approvals">
    Discord は DM での button ベース approval handling をサポートし、任意で元の channel に approval prompts を投稿することもできます。

    Config path:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（任意。可能であれば `commands.ownerAllowFrom` にフォールバック）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord は、`enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` から少なくとも 1 人の approver を解決できる場合、ネイティブ exec approvals を自動有効化します。Discord は channel `allowFrom`、旧 `dm.allowFrom`、または direct-message `defaultTo` から exec approvers を推定しません。ネイティブ approval client としての Discord を明示的に無効にするには `enabled: false` を設定してください。

    `target` が `channel` または `both` の場合、approval prompt はその channel に表示されます。解決された approvers のみが buttons を使用でき、それ以外の users には ephemeral denial が返されます。approval prompts には command text が含まれるため、channel 配信は信頼できる channels でのみ有効にしてください。session key から channel ID を導出できない場合、OpenClaw は DM 配信にフォールバックします。

    Discord は他の chat channels で使われる共有 approval buttons もレンダリングします。ネイティブ Discord adapter は主に approver DM routing と channel fanout を追加します。
    それらの buttons が存在する場合、それが主要な approval UX になります。OpenClaw は、tool result が chat approvals を利用できないと示す場合、または手動 approval だけが唯一の手段である場合にのみ、手動の `/approve` command を含めるべきです。

    Gateway auth と approval resolution は共有 Gateway client contract に従います（`plugin:` IDs は `plugin.approval.resolve` で解決され、それ以外の IDs は `exec.approval.resolve` で解決されます）。approvals のデフォルト有効期限は 30 分です。

    [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>
</AccordionGroup>

## Tools と action gates

Discord message actions には、messaging、channel admin、moderation、presence、metadata actions が含まれます。

主要な例:

- messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reactions: `react`, `reactions`, `emojiList`
- moderation: `timeout`, `kick`, `ban`
- presence: `setPresence`

`event-create` action は、scheduled event のカバー画像を設定するための任意の `image` パラメータ（URL またはローカルファイルパス）を受け付けます。

Action gates は `channels.discord.actions.*` の下にあります。

デフォルトの gate 動作:

| Action group                                                                                                                                                             | デフォルト |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled  |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## Components v2 UI

OpenClaw は exec approvals と cross-context markers に Discord components v2 を使用します。Discord message actions も custom UI 用に `components` を受け付けられます（高度な機能。discord tool による component payload の構築が必要です）。一方、旧来の `embeds` も引き続き利用可能ですが、推奨されません。

- `channels.discord.ui.components.accentColor` は、Discord component containers で使用されるアクセントカラーを設定します（16 進数）。
- account ごとの設定は `channels.discord.accounts.<id>.ui.components.accentColor` です。
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

## Voice

Discord には 2 つの異なる voice surface があります: リアルタイムの **voice channels**（継続的な会話）と、**voice message attachments**（波形プレビュー形式）です。gateway は両方をサポートします。

### Voice channels

要件:

- ネイティブ commands（`commands.native` または `channels.discord.commands.native`）を有効にする
- `channels.discord.voice` を設定する
- bot に対象の voice channel で Connect + Speak 権限が必要

`/vc join|leave|status` を使って sessions を制御します。この command は account のデフォルト agent を使用し、他の Discord commands と同じ allowlist および group policy ルールに従います。

Auto-join の例:

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

- `voice.tts` は voice playback に限って `messages.tts` を上書きします。
- Voice transcript turns は Discord `allowFrom`（または `dm.allowFrom`）から owner status を導出します。owner でない speaker は owner-only tools（たとえば `gateway` や `cron`）にアクセスできません。
- Voice はデフォルトで有効です。無効にするには `channels.discord.voice.enabled=false` を設定してください。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` の join options にそのまま渡されます。
- 未設定の場合、`@discordjs/voice` のデフォルトは `daveEncryption=true` と `decryptionFailureTolerance=24` です。
- OpenClaw は受信時の復号失敗も監視し、短時間に繰り返し失敗した場合は voice channel から離脱して再参加することで自動復旧します。
- 受信ログに `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合、これは [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) で追跡されている上流の `@discordjs/voice` 受信バグの可能性があります。

### Voice messages

Discord voice messages は波形プレビューを表示し、OGG/Opus 音声が必要です。OpenClaw は波形を自動生成しますが、検査と変換のために gateway host 上で `ffmpeg` と `ffprobe` が必要です。

- **ローカルファイルパス** を指定してください（URL は拒否されます）。
- テキスト content は省略してください（Discord は同じ payload 内でのテキスト + voice message を拒否します）。
- 任意の音声形式を受け付けます。必要に応じて OpenClaw が OGG/Opus に変換します。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていない intents を使用した、または bot が guild messages を見られない">

    - Message Content Intent を有効にする
    - user/member resolution に依存している場合は Server Members Intent を有効にする
    - intents を変更した後は gateway を再起動する

  </Accordion>

  <Accordion title="Guild messages が予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` の guild allowlist を確認する
    - guild の `channels` map が存在する場合、一覧にある channels のみ許可される
    - `requireMention` の動作と mention patterns を確認する

    役立つ確認コマンド:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention が false なのにまだブロックされる">
    よくある原因:

    - 一致する guild/channel allowlist がない `groupPolicy="allowlist"`
    - `requireMention` が誤った場所に設定されている（`channels.discord.guilds` または channel entry の下である必要があります）
    - 送信者が guild/channel の `users` allowlist によってブロックされている

  </Accordion>

  <Accordion title="長時間実行される handlers がタイムアウトする、または返信が重複する">

    典型的なログ:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Listener budget の設定項目:

    - single-account: `channels.discord.eventQueue.listenerTimeout`
    - multi-account: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker run timeout の設定項目:

    - single-account: `channels.discord.inboundWorker.runTimeoutMs`
    - multi-account: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
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

    `eventQueue.listenerTimeout` は listener のセットアップが遅い場合に使用し、`inboundWorker.runTimeoutMs` はキューに入った agent turns に対して別個の安全弁が必要な場合にのみ使用してください。

  </Accordion>

  <Accordion title="Permissions audit の不一致">
    `channels status --probe` の permission checks は数値の channel IDs でのみ機能します。

    slug keys を使用している場合でもランタイムでの matching は機能することがありますが、probe では permissions を完全には検証できません。

  </Accordion>

  <Accordion title="DM とペアリングの問題">

    - DM 無効: `channels.discord.dm.enabled=false`
    - DM policy 無効: `channels.discord.dmPolicy="disabled"`（旧: `channels.discord.dm.policy`）
    - `pairing` モードでペアリング承認待ち

  </Accordion>

  <Accordion title="Bot 同士のループ">
    デフォルトでは bot が作成した messages は無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるため、厳格な mention と allowlist ルールを使用してください。
    bot に mention した bot messages のみを受け付けるには、`channels.discord.allowBots="mentions"` を推奨します。

  </Accordion>

  <Accordion title="Voice STT が DecryptionFailed(...) で途切れる">

    - Discord voice receive recovery logic が含まれるよう、OpenClaw を最新に保つ（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）を確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（上流のデフォルト）から始め、必要な場合のみ調整する
    - 次のログを監視する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動 rejoin 後も失敗が続く場合は、ログを収集して [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と比較する

  </Accordion>
</AccordionGroup>

## Configuration reference の参照先

主要な参照先:

- [Configuration reference - Discord](/ja-JP/gateway/configuration-reference#discord)

重要度の高い Discord fields:

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout`（listener budget）, `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming`（旧エイリアス: `streamMode`）, `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb`, `retry`
  - `mediaMaxMb` は outbound Discord uploads を制限します（デフォルト: `100MB`）
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`, トップレベルの `bindings[]`（`type: "acp"`）, `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## 安全性と運用

- bot token はシークレットとして扱ってください（監視付き環境では `DISCORD_BOT_TOKEN` を推奨）。
- 最小権限の Discord permissions を付与してください。
- command deploy/state が古い場合は、gateway を再起動し、`openclaw channels status --probe` で再確認してください。

## 関連

- [Pairing](/ja-JP/channels/pairing)
- [Groups](/ja-JP/channels/groups)
- [Channel routing](/ja-JP/channels/channel-routing)
- [Security](/ja-JP/gateway/security)
- [Multi-agent routing](/ja-JP/concepts/multi-agent)
- [Troubleshooting](/ja-JP/channels/troubleshooting)
- [Slash commands](/ja-JP/tools/slash-commands)
