---
read_when:
    - Discordチャネル機能に取り組む
summary: Discord bot のセットアップ、構成キー、コンポーネント、音声、トラブルシューティング
title: Discord
x-i18n:
    generated_at: "2026-07-05T11:01:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7fcde8d8dfc79f0e5e4336d62a7bbb7ea2c9cde94e3671d53630b1daee4f75e
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw は公式 Discord gateway 経由でボットとして Discord に接続します。DM とギルドチャンネルに対応しています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

ボット付きの Discord アプリケーションを作成し、そのボットをサーバーに追加して、OpenClaw とペアリングします。可能ならプライベートサーバーを使ってください。必要であれば、まず [作成します](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends**）。

<Steps>
  <Step title="Discord アプリケーションとボットを作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) で **New Application** をクリックし、名前を付けます（例: 「OpenClaw」）。

    サイドバーで **Bot** を開き、**Username** をエージェント名に設定します。

  </Step>

  <Step title="特権インテントを有効にする">
    引き続き **Bot** ページで、**Privileged Gateway Intents** の下にある以下を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロール許可リスト、名前から ID への照合、チャンネル対象者アクセスグループに必要）
    - **Presence Intent**（任意。プレゼンス更新のみに使用）

  </Step>

  <Step title="ボットトークンをコピーする">
    **Bot** ページで **Reset Token** をクリックし、トークンをコピーします。

    <Note>
    この名前ですが、これは最初のトークンを生成するものです。「reset」されるものはありません。
    </Note>

  </Step>

  <Step title="招待 URL を生成し、ボットをサーバーに追加する">
    サイドバーで **OAuth2** を開きます。**OAuth2 URL Generator** で、以下のスコープを有効にします。

    - `bot`
    - `applications.commands`

    表示される **Bot Permissions** セクションで、少なくとも以下を有効にします。

    **General Permissions**
      - チャンネルを見る

    **Text Permissions**
      - メッセージを送信
      - メッセージ履歴を読む
      - リンクを埋め込む
      - ファイルを添付
      - リアクションを追加（任意）

    これが通常のテキストチャンネルのベースラインです。フォーラムやメディアチャンネルのワークフローでスレッドを作成または継続する場合を含め、ボットがスレッドに投稿するなら、**Send Messages in Threads** も有効にします。

    生成された URL をコピーしてブラウザーで開き、サーバーを選択して **Continue** をクリックします。これでボットがサーバーに表示されるはずです。

  </Step>

  <Step title="Developer Mode を有効にして ID を収集する">
    Discord アプリで Developer Mode を有効にし、ID をコピーできるようにします。

    1. **User Settings**（歯車アイコン）→ **Developer** → **Developer Mode** をオンにする
       （モバイルの場合: **App Settings** → **Advanced**）
    2. **サーバーアイコン**を右クリック → **Copy Server ID**
    3. **自分のアバター**を右クリック → **Copy User ID**

    Server ID と User ID をボットトークンと一緒に保管してください。次にこの 3 つすべてが必要です。

  </Step>

  <Step title="サーバーメンバーからの DM を許可する">
    ペアリングを機能させるには、Discord がボットからあなたへの DM を許可する必要があります。**サーバーアイコン**を右クリック → **Privacy Settings** → **Direct Messages** をオンにします。

    OpenClaw で Discord DM を使う場合は、これをオンのままにしてください。ギルドチャンネルだけを使う場合は、ペアリング後に無効化できます。

  </Step>

  <Step title="ボットトークンを安全に設定する（チャットで送信しない）">
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

    OpenClaw がすでにバックグラウンドサービスとして実行されている場合は、OpenClaw Mac アプリから、または `openclaw gateway run` プロセスを停止して再起動することで再起動します。
    管理対象サービスとしてインストールしている場合は、`DISCORD_BOT_TOKEN` が設定されたシェルから `openclaw gateway install` を実行するか、変数を `~/.openclaw/.env` に保存して、再起動後にサービスが env SecretRef を解決できるようにします。
    ホストが Discord の起動時アプリケーション検索によってブロックまたはレート制限される場合は、Developer Portal のアプリケーション/クライアント ID を設定して、起動時にその REST 呼び出しをスキップできるようにします。デフォルトアカウントの場合は `channels.discord.applicationId`、ボットごとの場合は `channels.discord.accounts.<accountId>.applicationId` です。

  </Step>

  <Step title="OpenClaw を設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼">
        既存のチャンネル（例: Telegram）で OpenClaw エージェントとチャットし、伝えます。Discord が最初のチャンネルである場合は、代わりに CLI / config タブを使ってください。

        > 「Discord ボットトークンはすでに config に設定しました。User ID `<user_id>` と Server ID `<server_id>` を使って Discord セットアップを完了してください。」
      </Tab>
      <Tab title="CLI / config">
        ファイルベースの config:

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

        デフォルトアカウント用の env フォールバック:

```bash
DISCORD_BOT_TOKEN=...
```

        スクリプト化されたセットアップまたはリモートセットアップでは、同じ JSON5 ブロックを `openclaw config patch --file ./discord.patch.json5 --dry-run` で書き込み、その後 `--dry-run` なしで再実行します。平文の `token` 文字列も動作し、SecretRef 値は env/file/exec プロバイダー全体で `channels.discord.token` に対応しています。[Secrets Management](/ja-JP/gateway/secrets) を参照してください。

        複数の Discord ボットを使う場合は、各ボットトークンとアプリケーション ID をそのアカウント配下に保持します。トップレベルの `channels.discord.applicationId` はアカウントに継承されるため、すべてのアカウントが同じアプリケーション ID を使う場合にのみ、そこに設定します。

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
    gateway が実行されたら、Discord でボットに DM します。ボットはペアリングコードを返信します。

    <Tabs>
      <Tab title="エージェントに依頼">
        既存のチャンネルでエージェントにペアリングコードを送信します。

        > 「この Discord ペアリングコードを承認してください: `<CODE>`」
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    ペアリングコードは 1 時間後に期限切れになります。承認後、Discord DM でエージェントとチャットします。

  </Step>
</Steps>

<Note>
トークン解決はアカウントを認識します。Config のトークン値は env フォールバックより優先され、`DISCORD_BOT_TOKEN` はデフォルトアカウントにのみ使用されます。
有効な Discord アカウント 2 つが同じボットトークンに解決される場合、OpenClaw はそのトークンに対して gateway モニターを 1 つだけ起動します。config 由来のトークンは env フォールバックより優先されます。それ以外の場合は最初の有効なアカウントが優先され、重複アカウントは理由 `duplicate bot token` 付きで無効として報告されます。
高度なアウトバウンド呼び出し（メッセージツール/チャンネルアクション）では、呼び出しごとの明示的な `token` がその呼び出しに使われます。これは送信および読み取り/プローブ形式のアクション（read/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシー/リトライ設定は引き続き、アクティブなランタイムスナップショットで選択されたアカウントから取得されます。
</Note>

## 推奨: ギルドワークスペースを設定する

DM が動作したら、サーバーを完全なワークスペースにして、各チャンネルが独自のコンテキストを持つ独自のエージェントセッションを持てるようにできます。自分とボットだけがいるプライベートサーバーに推奨します。

<Steps>
  <Step title="サーバーをギルド許可リストに追加する">
    これにより、エージェントは DM だけでなく、サーバー上の任意のチャンネルで応答できるようになります。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「Discord Server ID `<server_id>` をギルド許可リストに追加してください」
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

  <Step title="@mention なしの応答を許可する">
    デフォルトでは、エージェントは @mentioned された場合にのみギルドチャンネルで応答します。プライベートサーバーでは、おそらくすべてのメッセージに応答させたいはずです。

    ギルドチャンネルでは、通常の返信はデフォルトで自動投稿されます。共有の常時稼働ルームでは、`messages.groupChat.visibleReplies: "message_tool"` を選択すると、エージェントは待機し、チャンネル返信が有用だと判断した場合にのみ投稿できます。これは GPT 5.5 のような最新世代のツール信頼性が高いモデルで最も効果的です。周囲のルームイベントは、ツールが送信しない限り静かなままです。完全な待機モード config については、[Ambient room events](/ja-JP/channels/ambient-room-events) を参照してください。

    Discord に入力中表示が出てログにトークン使用量が表示されるのに投稿メッセージがない場合は、そのターンが周囲のルームイベントとして設定されていたか、message-tool visible replies が選択されていたかを確認してください。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「@mentioned されなくても、このサーバーでエージェントが応答できるようにしてください」
      </Tab>
      <Tab title="Config">
        ギルド config で `requireMention: false` を設定します。

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

        表示されるグループ/チャンネル返信に message-tool 送信を要求するには、`messages.groupChat.visibleReplies: "message_tool"` を設定します。

      </Tab>
    </Tabs>

  </Step>

  <Step title="ギルドチャンネルのメモリを計画する">
    長期メモリ（MEMORY.md）は DM セッションでのみ自動読み込みされ、ギルドチャンネルでは読み込まれません。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「Discord チャンネルで質問したとき、MEMORY.md から長期コンテキストが必要なら memory_search または memory_get を使ってください。」
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有するコンテキストには、安定した指示を `AGENTS.md` または `USER.md`（すべてのセッションに挿入）に置きます。長期ノートは `MEMORY.md` に保持し、必要に応じてメモリツールでアクセスします。
      </Tab>
    </Tabs>

  </Step>
</Steps>

あとはチャンネルを作成してチャットを始めます。エージェントはチャンネル名を認識し、各チャンネルは分離されたセッションになります。`#coding`、`#home`、`#research`、またはワークフローに合う任意のチャンネルを設定してください。

## ランタイムモデル

- Gateway が Discord 接続を所有します。
- 返信ルーティングは決定的です。Discord からの受信には Discord へ返信します。
- Discord ギルド/チャンネルメタデータは、ユーザーに表示される返信プレフィックスとしてではなく、信頼されないコンテキストとしてモデルプロンプトに追加されます。モデルがそのエンベロープをコピーして返した場合、OpenClaw はアウトバウンド返信と今後のリプレイコンテキストから、コピーされたメタデータを取り除きます。
- デフォルトでは（`session.dmScope=main`）、直接チャットはエージェントのメインセッション（`agent:main:main`）を共有します。
- ギルドチャンネルは分離されたセッションキー（`agent:<agentId>:discord:channel:<channelId>`）です。
- グループ DM はデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブスラッシュコマンドは分離されたコマンドセッション（`agent:<agentId>:discord:slash:<userId>`）で実行されますが、ルーティング先の会話セッションへの `CommandTargetSessionKey` は引き続き保持します。
- Discord へのテキストのみの Cron/Heartbeat 通知配信は、最後のアシスタント表示回答に集約され、1 回送信されます。メディアおよび構造化コンポーネントのペイロードは、エージェントが複数の配信可能ペイロードを出力した場合、複数メッセージのままです。

## フォーラムチャンネル

Discord のフォーラムチャンネルとメディアチャンネルはスレッド投稿のみを受け付けます。OpenClaw はこれらを作成する方法を 2 つサポートしています。

- フォーラムの親 (`channel:<forumId>`) にメッセージを送信すると、スレッドが自動作成されます。スレッドタイトルはメッセージの最初の空でない行です (Discord の 100 文字のスレッド名制限に合わせて切り詰められます)。
- スレッドを直接作成するには `openclaw message thread create` を使用します。フォーラムチャンネルでは `--message-id` を渡さないでください。

スレッドを作成するためにフォーラムの親へ送信します。

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

OpenClaw はエージェントメッセージ向けに Discord components v2 コンテナをサポートします。`components` ペイロードでメッセージツールを使用します。インタラクション結果は通常の受信メッセージとしてエージェントへ戻され、既存の Discord `replyToMode` 設定に従います。

サポートされるブロック:

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- アクション行では最大 5 個のボタン、または単一の選択メニューを使用できます
- 選択タイプ: `string`、`user`、`role`、`mentionable`、`channel`

デフォルトでは、コンポーネントは 1 回だけ使用できます。ボタン、選択、フォームを期限切れになるまで複数回使用できるようにするには、`components.reusable=true` を設定します。

ボタンをクリックできるユーザーを制限するには、そのボタンに `allowedUsers` を設定します (Discord ユーザー ID、タグ、または `*`)。一致しないユーザーにはエフェメラルな拒否メッセージが届きます。

コンポーネントコールバックはデフォルトで 30 分後に期限切れになります。デフォルトアカウントのコールバックレジストリ有効期間を変更するには `channels.discord.agentComponents.ttlMs` を設定し、アカウントごとに変更するには `channels.discord.accounts.<accountId>.agentComponents.ttlMs` を設定します。値はミリ秒で、正の整数である必要があり、`86400000` (24 時間) が上限です。長い TTL は、ボタンを使用可能な状態に保つ必要があるレビュー/承認ワークフローに適していますが、古い Discord メッセージがまだアクションをトリガーできる時間も延びます。要件を満たす最短の TTL を優先し、古いコールバックが予期しない結果になる場合はデフォルトのままにしてください。

`/model` と `/models` スラッシュコマンドは、プロバイダー、モデル、互換性のあるランタイムのドロップダウンと Submit ステップを備えたインタラクティブなモデルピッカーを開きます。`/models add` は非推奨で、チャットからモデルを登録する代わりに非推奨メッセージを返します。ピッカーの返信はエフェメラルで、呼び出したユーザーだけが使用できます。Discord の選択メニューは 25 個のオプションに制限されているため、ピッカーに `openai` や `vllm` など選択したプロバイダーの動的に検出されたモデルだけを表示させたい場合は、`agents.defaults.models` に `provider/*` エントリを追加してください。

ファイル添付:

- `file` ブロックは添付参照 (`attachment://<filename>`) を指している必要があります
- `media`/`path`/`filePath` (単一ファイル) で添付を提供します。複数ファイルには `media-gallery` を使用します
- アップロード名を添付参照と一致させる必要がある場合は、`filename` を使用して上書きします

モーダルフォーム:

- 最大 5 個のフィールドを持つ `components.modal` を追加します
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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` は DM アクセスを制御します。`channels.discord.allowFrom` は正規の DM 許可リストです。

    - `pairing` (デフォルト)
    - `allowlist` (少なくとも 1 つの `allowFrom` 送信者が必要)
    - `open` (`channels.discord.allowFrom` に `"*"` を含める必要があります)
    - `disabled`

    DM ポリシーがオープンでない場合、不明なユーザーはブロックされます (または `pairing` モードではペアリングを促されます)。

    複数アカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 1 つのアカウントでは、`allowFrom` がレガシー `dm.allowFrom` より優先されます。
    - 名前付きアカウントは、自身の `allowFrom` とレガシー `dm.allowFrom` が未設定の場合に `channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    レガシー `channels.discord.dm.policy` と `channels.discord.dm.allowFrom` は互換性のため引き続き読み取られます。アクセスを変更せずに実行できる場合、`openclaw doctor --fix` はそれらを `dmPolicy` と `allowFrom` に移行します。

    配信用の DM ターゲット形式:

    - `user:<id>`
    - `<@id>` メンション

    通常、チャンネルのデフォルトが有効な場合、裸の数値 ID はチャンネル ID として解決されますが、アカウントの有効な DM `allowFrom` に列挙された ID は、互換性のためユーザー DM ターゲットとして扱われます。

  </Tab>

  <Tab title="Access groups">
    Discord DM とテキストコマンド認可では、`channels.discord.allowFrom` 内の動的な `accessGroup:<name>` エントリを使用できます。

    アクセスグループ名はメッセージチャンネル間で共有されます。メンバーが各チャンネルの通常の `allowFrom` 構文で表現される静的グループには `type: "message.senders"` を使用し、Discord チャンネルの現在の `ViewChannel` オーディエンスでメンバーシップを動的に定義する必要がある場合は `type: "discord.channelAudience"` を使用します。共有アクセスグループの動作: [アクセスグループ](/ja-JP/channels/access-groups)。

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

    Discord テキストチャンネルには個別のメンバーリストがありません。`type: "discord.channelAudience"` はメンバーシップを次のようにモデル化します。DM 送信者が設定済みギルドのメンバーであり、ロールとチャンネルの上書きが適用された後、設定済みチャンネルに対する有効な `ViewChannel` 権限を現在持っていること。

    例: `#maintainers` を閲覧できるすべての人に bot への DM を許可し、それ以外の全員には DM を閉じたままにします。

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

    ルックアップは失敗時に閉じます。Discord が `Missing Access` を返す、メンバールックアップが失敗する、またはチャンネルが別のギルドに属している場合、DM 送信者は未認可として扱われます。

    チャンネルオーディエンスアクセスグループを使用する場合は、Discord Developer Portal の **Server Members Intent** を有効にしてください。DM にはギルドメンバー状態が含まれないため、OpenClaw は認可時に Discord REST を通じてメンバーを解決します。

  </Tab>

  <Tab title="Guild policy">
    ギルド処理は `channels.discord.groupPolicy` によって制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合の安全なベースラインは `allowlist` です。

    `allowlist` の動作:

    - ギルドは `channels.discord.guilds` と一致する必要があります (`id` 推奨、スラッグも可)
    - 任意の送信者許可リスト: `users` (安定した ID を推奨) と `roles` (ロール ID のみ)。どちらかが設定されている場合、送信者は `users` または `roles` に一致すると許可されます
    - 直接の名前/タグ一致はデフォルトで無効です。非常時の互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
    - `users` では名前/タグがサポートされますが、ID の方が安全です。名前/タグエントリが使用されている場合、`openclaw security audit` が警告します
    - ギルドに `channels` が設定されている場合、一覧にないチャンネルは拒否されます
    - ギルドに `channels` ブロックがない場合、その許可リスト済みギルド内のすべてのチャンネルが許可されます

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

    レガシーのチャンネル単位の `allow` キーは、`openclaw doctor --fix` によって `enabled` に移行されます。

    `DISCORD_BOT_TOKEN` のみを設定し、`channels.discord` ブロックを作成しない場合、ランタイムフォールバックは `groupPolicy="allowlist"` になります (ログに警告が出ます)。これは `channels.defaults.groupPolicy` が `open` であっても同じです。

  </Tab>

  <Tab title="Mentions and group DMs">
    ギルドメッセージはデフォルトでメンション制御されます。

    メンション検出には次が含まれます。

    - 明示的な bot メンション
    - 設定済みメンションパターン (`agents.list[].groupChat.mentionPatterns`、フォールバック `messages.groupChat.mentionPatterns`)
    - サポートされるケースでの暗黙的な bot への返信動作

    送信 Discord メッセージを書く場合は、正規のメンション構文を使用してください。ユーザーには `<@USER_ID>`、チャンネルには `<#CHANNEL_ID>`、ロールには `<@&ROLE_ID>` です。レガシーの `<@!USER_ID>` ニックネームメンション形式は使用しないでください。

    `requireMention` はギルド/チャンネルごとに設定されます (`channels.discord.guilds...`)。
    `ignoreOtherMentions` は任意で、bot ではなく別のユーザー/ロールをメンションするメッセージを破棄します (@everyone/@here は除く)。

    グループ DM:

    - デフォルト: 無視されます (`dm.groupEnabled=false`)
    - `dm.groupChannels` による任意の許可リスト (チャンネル ID またはスラッグ)

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

Discord ギルドメンバーをロール ID によって別のエージェントへルーティングするには、`bindings[].match.roles` を使用します。ロールベースのバインディングはロール ID のみを受け付け、ピアまたは親ピアのバインディングの後、ギルドのみのバインディングの前に評価されます。バインディングが他の一致フィールドも設定している場合 (たとえば `peer` + `guildId` + `roles`)、設定済みのすべてのフィールドが一致する必要があります。

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
- チャネル別の上書き: `channels.discord.commands.native`。
- `commands.native=false` は、起動時の Discord スラッシュコマンド登録とクリーンアップをスキップします。以前に登録されたコマンドは、Discord アプリから削除するまで Discord に表示されたままになることがあります。
- ネイティブコマンド認証は、通常のメッセージ処理と同じ Discord 許可リスト/ポリシーを使用します。
- 権限のないユーザーにも、Discord UI でコマンドが表示される場合があります。実行時には OpenClaw 認証が適用され、「not authorized」と返信されます。
- デフォルトのスラッシュコマンド設定: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`)。

コマンドカタログと動作については、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

## 機能の詳細

<AccordionGroup>
  <Accordion title="返信タグとネイティブ返信">
    Discord はエージェント出力内の返信タグに対応しています。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` で制御します。

    - `off` (デフォルト): 暗黙的な返信スレッド化は行いません。明示的な `[[reply_to_*]]` タグは引き続き尊重されます
    - `first`: ターン内の最初の送信 Discord メッセージに、暗黙的なネイティブ返信参照を付与します
    - `all`: すべての送信メッセージに付与します
    - `batched`: 受信イベントが複数メッセージのデバウンス済みバッチだった場合のみ付与します。すべての単一メッセージターンではなく、主に曖昧な短時間の連続チャットでネイティブ返信を使いたい場合に便利です

    メッセージ ID はコンテキスト/履歴に提示されるため、エージェントは特定のメッセージを対象にできます。

  </Accordion>

  <Accordion title="リンクプレビュー">
    Discord はデフォルトで URL のリッチリンク埋め込みを生成します。OpenClaw はデフォルトで送信 Discord メッセージ上の生成済み埋め込みを抑制するため、オプトインしない限り、エージェントが送信した URL はプレーンリンクのままになります。

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    1 つのアカウントを上書きするには、`channels.discord.accounts.<id>.suppressEmbeds` を設定します。エージェントのメッセージツール送信でも、単一メッセージに対して `suppressEmbeds: false` を渡せます。明示的な Discord `embeds` ペイロードは、デフォルトのリンクプレビュー設定では抑制されません。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClaw は、一時メッセージを送信し、テキストが到着するたびに編集することで、返信の下書きをストリーミングできます。`channels.discord.streaming.mode` は `off` | `partial` | `block` | `progress` を取ります。`streaming`/レガシー `streamMode` キーが設定されていない場合のデフォルトは `progress` です。`streamMode` はレガシーエイリアスです。永続化済み設定を正規のネストされた `streaming` 形状に書き換えるには、`openclaw doctor --fix` を実行してください。

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

    - `off` は Discord プレビュー編集を無効にします。
    - `partial` は、トークンが到着するたびに単一のプレビューメッセージを編集します。
    - `block` は下書きサイズのチャンクを出力します。`streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`) でサイズと区切り位置を調整でき、`textChunkLimit` にクランプされます。ブロックストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためプレビューストリームをスキップします。
    - `progress` は、編集可能なステータス下書きを 1 つ維持し、最終配信までツール進捗で更新します。共有スターターラベルはローリング行のため、十分な作業が表示されると他の行と同じようにスクロールアウトします。
    - メディア、エラー、明示的な返信の最終メッセージは、保留中のプレビュー編集をキャンセルします。
    - `streaming.preview.toolProgress` (デフォルト `true`) は、ツール/進捗更新でプレビューメッセージを再利用するかどうかを制御します。
    - ツール/進捗行は、利用可能な場合、コンパクトな絵文字 + タイトル + 詳細として描画されます。例: `🛠️ Bash: run tests` または `🔎 Web Search: for "query"`。
    - `streaming.progress.commentary` (デフォルト `false`) は、一時的な進捗下書き内のアシスタントの解説/前置きテキストにオプトインします。解説は表示前にクリーンアップされ、一時的なままで、最終回答の配信は変更しません。
    - `streaming.progress.maxLineChars` は、行ごとの進捗プレビューバジェットを制御します。文章は単語境界で短縮され、コマンドとパスの詳細は有用な接尾部分を保持します。
    - `streaming.preview.commandText` / `streaming.progress.commandText` は、コンパクトな進捗行内のコマンド/実行詳細を制御します: `raw` (デフォルト) または `status` (ツールラベルのみ)。

    コンパクトな進捗行を維持しつつ、生のコマンド/実行テキストを非表示にします。

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

    プレビューストリーミングはテキストのみです。メディア返信は通常配信にフォールバックします。

  </Accordion>

  <Accordion title="履歴、コンテキスト、スレッド動作">
    ギルド履歴コンテキスト:

    - `channels.discord.historyLimit` デフォルト `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` は無効化します

    DM 履歴制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    スレッド動作:

    - Discord スレッドはチャネルセッションとしてルーティングされ、上書きされない限り親チャネル設定を継承します。
    - スレッドセッションは、親チャネルのセッションレベル `/model` 選択をモデル専用フォールバックとして継承します。スレッドローカルの `/model` 選択が優先され、トランスクリプト継承が有効でない限り、親トランスクリプト履歴はコピーされません。
    - `channels.discord.thread.inheritParent` (デフォルト `false`) は、新しい自動スレッドを親トランスクリプトからシードするようにオプトインします。アカウント別の上書き: `channels.discord.accounts.<id>.thread.inheritParent`。
    - メッセージツールのリアクションは、`user:<id>` DM ターゲットを解決できます。
    - `guilds.<guild>.channels.<channel>.requireMention: false` は、返信段階のアクティベーションフォールバック中も保持されます。

    チャネルのトピックは**信頼されない**コンテキストとして注入されます。許可リストは誰がエージェントをトリガーできるかを制限するものであり、完全な補足コンテキストの秘匿化境界ではありません。

  </Accordion>

  <Accordion title="サブエージェント向けのスレッド固定セッション">
    Discord は、スレッドをセッションターゲットにバインドできるため、そのスレッド内の後続メッセージは同じセッション (サブエージェントセッションを含む) にルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在/新しいスレッドをサブエージェント/セッションターゲットにバインドします
    - `/unfocus` 現在のスレッドバインディングを削除します
    - `/agents` アクティブな実行とバインディング状態を表示します
    - `/session idle <duration|off>` フォーカス済みバインディングの非アクティブ時自動フォーカス解除を確認/更新します
    - `/session max-age <duration|off>` フォーカス済みバインディングの厳格な最大有効期間を確認/更新します

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

    - `session.threadBindings.*` はグローバルデフォルトを設定します。`channels.discord.threadBindings.*` は Discord の動作を上書きします。
    - `spawnSessions` は、`sessions_spawn({ thread: true })` と ACP スレッド生成に対するスレッドの自動作成/バインドを制御します。デフォルト: `true`。
    - `defaultSpawnContext` は、スレッド固定生成のネイティブサブエージェントコンテキストを制御します。デフォルト: `"fork"`。
    - 非推奨の `spawnSubagentSessions`/`spawnAcpSessions` キーは、`openclaw doctor --fix` によって移行されます。
    - アカウントでスレッドバインディングが無効な場合、`/focus` と関連するスレッドバインディング操作は利用できません。

    [サブエージェント](/ja-JP/tools/subagents)、[ACP エージェント](/ja-JP/tools/acp-agents)、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

  </Accordion>

  <Accordion title="永続 ACP チャネルバインディング">
    安定した「常時稼働」ACP ワークスペースでは、Discord 会話を対象とするトップレベルの型付き ACP バインディングを設定します。

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

    - `/acp spawn codex --bind here` は、現在のチャネルまたはスレッドをその場でバインドし、以後のメッセージを同じ ACP セッションに維持します。スレッドメッセージは親チャネルのバインディングを継承します。
    - バインド済みチャネルまたはスレッドでは、`/new` と `/reset` は同じ ACP セッションをその場でリセットします。一時的なスレッドバインディングは、有効な間ターゲット解決を上書きできます。
    - `spawnSessions` は、`--thread auto|here` による子スレッドの作成/バインディングを制御します。

    バインディング動作の詳細については、[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

  </Accordion>

  <Accordion title="リアクション通知">
    ギルド別のリアクション通知モード (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (デフォルト)
    - `all`
    - `allowlist` (`guilds.<id>.users` を使用)

    リアクションイベントはシステムイベントに変換され、ルーティングされた Discord セッションに添付されます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認用絵文字を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェント ID 絵文字フォールバック (`agents.list[].identity.emoji`、なければ "👀")

    注記:

    - Discord は Unicode 絵文字またはカスタム絵文字名を受け付けます。
    - チャネルまたはアカウントでリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="設定書き込み">
    チャネル起点の設定書き込みはデフォルトで有効です。これは `/config set|unset` フローに影響します (コマンド機能が有効な場合)。

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
    `channels.discord.proxy` を使って、Discord Gateway WebSocket トラフィックと起動時の REST 参照 (アプリケーション ID + 許可リスト解決) を HTTP(S) プロキシ経由でルーティングします。
    Discord Gateway WebSocket プロキシは明示的です。WebSocket 接続は Gateway プロセスの周囲のプロキシ環境変数を継承しません。`channels.discord.proxy` が設定されている場合、起動時の REST 参照はこのプロキシを使用します。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    アカウント別の上書き:

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

  <Accordion title="PluralKit 対応">
    プロキシされたメッセージをシステムメンバー ID にマッピングするには、PluralKit 解決を有効にします。

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

    注記:

    - 許可リストでは `pk:<memberId>` を使用できます
    - メンバー表示名は、`channels.discord.dangerouslyAllowNameMatching: true` の場合のみ、名前/slug で照合されます
    - 参照は元のメッセージ ID で PluralKit API に問い合わせます
    - 参照に失敗した場合、プロキシされたメッセージは bot メッセージとして扱われ、`allowBots` が通過を許可しない限り破棄されます

  </Accordion>

  <Accordion title="送信メンションエイリアス">
    エージェントが既知の Discord ユーザーに対して決定的な送信メンションを必要とする場合は、`mentionAliases` を使用します。キーは先頭の `@` を除いたハンドルで、値は Discord ユーザー ID です。不明なハンドル、`@everyone`、`@here`、および Markdown コードスパン内のメンションは変更されません。

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

  <Accordion title="プレゼンス設定">
    ステータスまたはアクティビティフィールドを設定した場合、または自動プレゼンスを有効にした場合に、プレゼンス更新が適用されます。

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

    アクティビティ（`activity` が設定されている場合、カスタムステータスがデフォルトのアクティビティタイプです）:

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

    アクティビティタイプの対応表:

    - 0: プレイ中
    - 1: ストリーミング（`activityUrl` が必要です。`activityUrl` にはさらに `activityType: 1` が必要です）
    - 2: 聞いています
    - 3: 視聴中
    - 4: カスタム（アクティビティテキストをステータス状態として使用します。絵文字は任意です）
    - 5: 競技中

    自動プレゼンス（ランタイム健全性シグナル）:

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

    自動プレゼンスはランタイムの可用性を Discord ステータスに対応付けます: healthy => online、degraded または unknown => idle、exhausted または unavailable => dnd。デフォルト: `intervalMs` 30000、`minUpdateIntervalMs` 15000（`intervalMs` 以下である必要があります）。任意のテキスト上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（`{reason}` プレースホルダーをサポート）

  </Accordion>

  <Accordion title="Discord での承認">
    Discord は DM でのボタンベースの承認処理をサポートし、必要に応じて元のチャンネルに承認プロンプトを投稿できます。

    設定パス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバックします）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    Discord は、`enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` から少なくとも 1 人の承認者を解決できる場合、ネイティブ exec 承認を自動的に有効化します。Discord はチャンネルの `allowFrom`、レガシーの `dm.allowFrom`、またはダイレクトメッセージの `defaultTo` から exec 承認者を推測しません。Discord をネイティブ承認クライアントとして明示的に無効化するには、`enabled: false` を設定します。

    `/diagnostics` や `/export-trajectory` など、機密性の高い所有者専用グループコマンドでは、OpenClaw は承認プロンプトと最終結果を非公開で送信します。呼び出し元の所有者に Discord 所有者ルートがある場合は、まず Discord DM を試します。それ以外の場合は、Telegram など、`commands.ownerAllowFrom` から最初に利用可能な所有者ルートにフォールバックします。

    `target` が `channel` または `both` の場合、承認プロンプトはチャンネルに表示されます。解決済みの承認者だけがボタンを使用できます。他のユーザーには一時的な拒否が返されます。承認プロンプトにはコマンドテキストが含まれるため、チャンネル配信は信頼済みチャンネルでのみ有効にしてください。セッションキーからチャンネル ID を導出できない場合、OpenClaw は DM 配信にフォールバックします。

    Discord は他のチャットチャンネルで使用される共有承認ボタンをレンダリングします。ネイティブ Discord アダプターは主に、承認者への DM ルーティングとチャンネルへのファンアウトを追加します。これらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、ツール結果がチャット承認を利用できないと示す場合、または手動承認が唯一の経路である場合にのみ、手動の `/approve` コマンドを含めるべきです。Discord ネイティブ承認ランタイムがアクティブでない場合、OpenClaw はローカルの決定的な `/approve <id> <decision>` プロンプトを表示したままにします。ランタイムがアクティブでもネイティブカードをどのターゲットにも配信できない場合、OpenClaw は保留中の承認から正確な `/approve` コマンドを含む同一チャットのフォールバック通知を送信します。

    Gateway 認証と承認解決は、共有 Gateway クライアント契約に従います（`plugin:` ID は `plugin.approval.resolve` 経由で解決され、その他の ID は `exec.approval.resolve` 経由で解決されます）。承認はデフォルトで 30 分後に期限切れになります。

    [Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## ツールとアクションゲート

Discord メッセージアクションは、メッセージング、チャンネル管理、モデレーション、プレゼンス、メタデータを対象にします。

コアの例:

- メッセージング: `sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- リアクション: `react`、`reactions`、`emojiList`
- モデレーション: `timeout`、`kick`、`ban`
- プレゼンス: `setPresence`

`event-create` アクションは、スケジュール済みイベントのカバー画像を設定するために、任意の `image` パラメーター（URL またはローカルファイルパス）を受け付けます。

アクションゲートは `channels.discord.actions.*` の下にあります。

デフォルトのゲート動作:

| アクショングループ                                                                                                                                                       | デフォルト |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 有効       |
| roles                                                                                                                                                                    | 無効       |
| moderation                                                                                                                                                               | 無効       |
| presence                                                                                                                                                                 | 無効       |

## Components v2 UI

OpenClaw は exec 承認とクロスコンテキストマーカーに Discord components v2 を使用します。Discord メッセージアクションは、カスタム UI 用に `components` も受け付けられます（高度な用途。discord ツール経由でコンポーネントペイロードを構築する必要があります）。一方、レガシーの `embeds` も引き続き利用できますが、推奨されません。

- `channels.discord.ui.components.accentColor` は、Discord コンポーネントコンテナーで使用されるアクセントカラー（16 進数）を設定します。アカウントごと: `channels.discord.accounts.<id>.ui.components.accentColor`。
- `channels.discord.agentComponents.ttlMs` は、送信済み Discord コンポーネントコールバックを登録したままにする時間を制御します（デフォルト `1800000`、最大 `86400000`）。アカウントごと: `channels.discord.accounts.<id>.agentComponents.ttlMs`。
- components v2 が存在する場合、`embeds` は無視されます。
- プレーン URL プレビューはデフォルトで抑制されます。単一の送信リンクを展開する必要がある場合は、メッセージアクションで `suppressEmbeds: false` を設定します。

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

Discord には 2 つの異なる音声サーフェスがあります。リアルタイムの**音声チャンネル**（継続的な会話）と、**音声メッセージ添付ファイル**（波形プレビュー形式）です。Gateway は両方をサポートします。

### 音声チャンネル

セットアップチェックリスト:

1. Discord Developer Portal で Message Content Intent を有効にします。
2. ロール/ユーザー許可リストを使用する場合は、Server Members Intent を有効にします。
3. `bot` と `applications.commands` スコープでボットを招待します。
4. 対象の音声チャンネルで Connect、Speak、Send Messages、Read Message History を付与します。
5. ネイティブコマンド（`commands.native` または `channels.discord.commands.native`）を有効にします。
6. `channels.discord.voice` を設定します。

セッションを制御するには `/vc join|leave|status` を使用します。このコマンドはアカウントのデフォルトエージェントを使用し、他の Discord コマンドと同じ許可リストおよびグループポリシールールに従います。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

参加前にボットの実効権限を確認するには:

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
        model: "openai/gpt-5.5",
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
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

メモ:

- Discord 音声はテキスト専用設定ではオプトインです。`channels.discord.voice.enabled=true` を設定するか、既存の `channels.discord.voice` ブロックを維持すると、`/vc` コマンド、音声ランタイム、`GuildVoiceStates` Gateway インテントが有効になります。`channels.discord.intents.voiceStates` でインテント購読を明示的に上書きできます。未設定のままにすると、有効な音声の有効化状態に従います。
- `voice.mode` は会話パスを制御します。デフォルトは `agent-proxy` です。リアルタイム音声フロントエンドがターンのタイミング、割り込み、再生を処理し、実質的な作業を `openclaw_agent_consult` 経由でルーティングされた OpenClaw エージェントに委任し、その結果をその発話者からの入力済み Discord プロンプトのように扱います。`stt-tts` は従来のバッチ STT と TTS のフローを維持します。`bidi` では、リアルタイムモデルが直接会話しつつ、OpenClaw の頭脳として `openclaw_agent_consult` を公開します。
- `voice.agentSession` は、どの OpenClaw 会話が音声ターンを受け取るかを制御します。音声チャンネル自身のセッションを使う場合は未設定のままにするか、`{ mode: "target", target: "channel:<text-channel-id>" }` を設定して、音声チャンネルを `#maintainers` など既存の Discord テキストチャンネルセッションのマイク/スピーカー拡張として動作させます。
- `voice.model` は Discord 音声応答とリアルタイム相談で使う OpenClaw エージェントの頭脳を上書きします。未設定のままにすると、ルーティングされたエージェントモデルを継承します。これは `voice.realtime.model` とは別です。
- `voice.followUsers` を使うと、ボットが選択したユーザーと一緒に Discord 音声へ参加、移動、退出できます。[音声でユーザーを追従する](#follow-users-in-voice) を参照してください。
- `agent-proxy` は発話を `discord-voice` 経由でルーティングします。これは発話者と対象セッションに対する通常の所有者/ツール認可を保持しますが、Discord 音声が再生を所有するため、エージェントの `tts` ツールは隠します。デフォルトでは、`agent-proxy` は所有者の発話者に対して、相談に所有者相当の完全なツールアクセスを付与し（`voice.realtime.toolPolicy: "owner"`）、実質的な回答の前に OpenClaw エージェントへ相談することを強く優先します（`voice.realtime.consultPolicy: "always"`）。このデフォルトの `always` モードでは、リアルタイム層は相談回答の前に自動でつなぎの発話をしません。発話をキャプチャして文字起こしし、その後ルーティングされた OpenClaw の回答を発話します。複数の強制相談回答が、Discord が最初の回答をまだ再生している間に完了した場合、後続の厳密な発話回答は文の途中で発話を置き換えるのではなく、再生がアイドルになるまでキューに入ります。
- `stt-tts` モードでは、STT は `tools.media.audio` を使います。`voice.model` は文字起こしに影響しません。
- リアルタイムモードでは、`voice.realtime.provider`、`voice.realtime.model`、`voice.realtime.speakerVoice` がリアルタイム音声セッションを設定します。OpenAI Realtime 2 と Codex の頭脳を使う場合は、`voice.realtime.model: "gpt-realtime-2"` と `voice.model: "openai/gpt-5.5"` を使います。
- リアルタイム音声モードでは、デフォルトで小さな `IDENTITY.md`、`USER.md`、`SOUL.md` プロファイルファイルをリアルタイムプロバイダーの指示に含めます。これにより、高速な直接ターンでも、ルーティングされた OpenClaw エージェントと同じアイデンティティ、ユーザー基盤、ペルソナを維持します。これをカスタマイズするには `voice.realtime.bootstrapContextFiles` をサブセットに設定し、無効化するには `[]` を設定します。サポートされるのはこれらのプロファイルファイルだけです。`AGENTS.md` は通常のエージェントコンテキストに残ります。注入されたプロファイルコンテキストは、ワークスペース作業、現在の事実、メモリ検索、ツールに支えられたアクションにおいて `openclaw_agent_consult` を置き換えるものではありません。
- OpenAI `agent-proxy` リアルタイムモードでは、`voice.realtime.requireWakeName: true` を設定すると、文字起こしがウェイク名で始まるか終わるまで Discord リアルタイム音声を無音に保ちます。設定するウェイク名は 1 語または 2 語でなければなりません。`voice.realtime.wakeNames` が未設定の場合、OpenClaw はルーティングされたエージェントの `name` と `OpenClaw` を使い、フォールバックとしてエージェント ID と `OpenClaw` を使います。ウェイク名ゲートはリアルタイムプロバイダーの自動応答を無効化し、受け入れられたターンを OpenClaw エージェント相談パスにルーティングし、最終文字起こしが到着する前に部分文字起こしから先頭のウェイク名が認識された場合は短い音声確認を返します。
- OpenAI リアルタイムプロバイダーは、現在の Realtime 2 イベント名と、出力音声および文字起こしイベント向けのレガシーな Codex 互換エイリアスを受け付けます。そのため、互換プロバイダースナップショットがずれてもアシスタント音声は失われません。
- `voice.realtime.bargeIn` は、Discord の発話者開始イベントがアクティブなリアルタイム再生を割り込むかどうかを制御します。未設定の場合、リアルタイムプロバイダーの入力音声割り込み設定に従います。
- `voice.realtime.minBargeInAudioEndMs` は、OpenAI リアルタイムの割り込みが音声を切り詰める前に必要な最小アシスタント再生時間を制御します。デフォルト: `250`。エコーの少ない部屋では即時割り込みのために `0` を設定し、エコーが多いスピーカー構成では値を上げます。
- `voice.tts` は `stt-tts` 音声再生のみに対して `messages.tts` を上書きします。リアルタイムモードでは代わりに `voice.realtime.speakerVoice` を使います。Discord 再生で OpenAI 音声を使うには、`voice.tts.provider: "openai"` を設定し、`voice.tts.providers.openai.speakerVoice` でテキスト読み上げ音声を選択します。現在の OpenAI TTS モデルでは、`cedar` は男性的に聞こえる良い選択です。
- チャンネル単位の Discord `systemPrompt` 上書きは、その音声チャンネルの音声文字起こしターンに適用されます。
- 音声文字起こしターンは、所有者ゲート付きコマンドとチャンネルアクションに対する所有者ステータスを Discord `allowFrom`（または `dm.allowFrom`）から派生します。エージェントのツール可視性は、ルーティングされたセッションに設定されたツールポリシーに従います。
- `voice.autoJoin` に同じギルド向けの複数のエントリがある場合、OpenClaw はそのギルドで最後に設定されたチャンネルに参加します。
- `voice.allowedChannels` は任意の常駐許可リストです。未設定のままにすると、認可済みの任意の Discord 音声チャンネルに `/vc join` できます。設定すると、`/vc join`、起動時の自動参加、ボットの音声状態移動は、列挙された `{ guildId, channelId }` エントリに制限されます。空配列に設定すると、すべての Discord 音声参加を拒否します。Discord がボットを許可リスト外へ移動した場合、OpenClaw はそのチャンネルから退出し、利用可能な設定済み自動参加ターゲットがあれば再参加します。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` の参加オプションへそのまま渡されます。上流のデフォルトは `daveEncryption=true` と `decryptionFailureTolerance=24` です。
- OpenClaw は Discord 音声受信とリアルタイム生 PCM 再生に、同梱の `libopus-wasm` コーデックを使います。ピン留めされた libopus WebAssembly ビルドを同梱しており、ネイティブの opus アドオンは不要です。
- `voice.connectTimeoutMs` は、`/vc join` と自動参加試行に対する初回 `@discordjs/voice` Ready 待機を制御します。デフォルト: `30000`。
- `voice.reconnectGraceMs` は、切断された音声セッションが再接続を開始するまでに OpenClaw が待機する時間を制御し、その後破棄します。デフォルト: `15000`。
- `stt-tts` モードでは、別のユーザーが話し始めただけでは音声再生は停止しません。フィードバックループを避けるため、OpenClaw は TTS の再生中は新しい音声キャプチャを無視します。次のターンでは再生が終わってから話してください。リアルタイムモードは発話者開始を割り込み信号としてリアルタイムプロバイダーに転送します。
- リアルタイムモードでは、スピーカーからオープンマイクへ入るエコーが割り込みのように見え、再生を中断することがあります。エコーが多い Discord ルームでは、`voice.realtime.providers.openai.interruptResponseOnInputAudio: false` を設定して、OpenAI が入力音声で自動割り込みしないようにします。Discord の発話者開始イベントでアクティブな再生を割り込みたい場合は、`voice.realtime.bargeIn: true` を追加します。OpenAI リアルタイムブリッジは、`voice.realtime.minBargeInAudioEndMs` より短い再生切り詰めをエコー/ノイズの可能性が高いものとして無視し、Discord 再生をクリアするのではなくスキップとしてログに記録します。
- `voice.captureSilenceGraceMs` は、Discord が発話者の停止を報告した後、OpenClaw がその音声セグメントを STT 用に確定するまでの待機時間を制御します。デフォルト: `2000`。Discord が通常のポーズを途切れ途切れの部分文字起こしに分割する場合は値を上げます。
- ElevenLabs が選択された TTS プロバイダーの場合、Discord 音声再生はストリーミング TTS を使い、プロバイダーの応答ストリームから開始します。ストリーミングをサポートしないプロバイダーは、合成された一時ファイルのパスにフォールバックします。
- OpenClaw は受信復号失敗を監視し、短い時間枠で失敗が繰り返された場合、音声チャンネルを退出して再参加することで自動復旧します。
- 更新後に受信ログで `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合は、依存関係レポートとログを収集してください。同梱の `@discordjs/voice` ラインには、discord.js PR #11449 からの上流パディング修正が含まれており、これは discord.js issue #11419 をクローズしたものです。
- `The operation was aborted` 受信イベントは、OpenClaw がキャプチャ済み発話者セグメントを確定するときに想定されるものです。これは詳細診断であり、警告ではありません。
- 詳細な Discord 音声ログには、受け入れられた各発話者セグメントについて境界付きの 1 行 STT 文字起こしプレビューが含まれます。そのため、無制限の文字起こしテキストをダンプせずに、ユーザー側とエージェント返信側の両方をデバッグで確認できます。
- `agent-proxy` モードでは、強制相談フォールバックは、`...` で終わるテキストや "and" のような末尾の接続語など、未完了の可能性が高い文字起こし断片に加え、"be right back" や "bye" のような明らかにアクション不能な締めくくりをスキップします。これにより古いキュー済み回答が防がれた場合、ログには `forced agent consult skipped reason=...` が表示されます。

### 音声でユーザーを追従する

起動時に固定チャンネルへ参加したり `/vc join` を待ったりする代わりに、Discord 音声ボットを 1 人以上の既知の Discord ユーザーと一緒に留まらせたい場合は、`voice.followUsers` を使います。

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

- `followUsers` は生の Discord ユーザー ID と `discord:<id>` 値を受け付けます。OpenClaw は音声状態イベントと照合する前に、両方の形式を正規化します。
- `followUsers` が設定されている場合、`followUsersEnabled` のデフォルトは `true` です。保存済みリストは維持しつつ自動音声追従を停止するには、`false` に設定します。
- 追従対象ユーザーが許可された音声チャンネルに参加すると、OpenClaw はそのチャンネルに参加します。ユーザーが移動すると、OpenClaw も一緒に移動します。アクティブな追従対象ユーザーが切断すると、OpenClaw は退出します。
- 同じギルドに複数の追従対象ユーザーがいて、アクティブな追従対象ユーザーが退出した場合、OpenClaw はギルドから退出する前に、別の追跡中の追従対象ユーザーのチャンネルへ移動します。複数の追従対象ユーザーが同時に移動した場合は、最後に観測された音声状態イベントが優先されます。
- `allowedChannels` は引き続き適用されます。許可されていないチャンネルにいる追従対象ユーザーは無視され、追従所有のセッションは別の追従対象ユーザーへ移動するか退出します。
- OpenClaw は起動時と境界付きの間隔で、取りこぼした音声状態イベントを照合します。照合は設定済みギルドをサンプリングし、実行ごとの REST 参照数を制限します。そのため、非常に大きな `followUsers` リストは収束に複数の間隔が必要になる場合があります。
- ユーザーを追従している間に Discord または管理者がボットを移動した場合、OpenClaw は音声セッションを再構築し、移動先が許可されていれば追従所有権を保持します。ボットが `allowedChannels` 外へ移動された場合、OpenClaw は退出し、設定済みターゲットが存在する場合は再参加します。
- DAVE 受信復旧では、復号失敗が繰り返された後に同じチャンネルを退出して再参加することがあります。追従所有のセッションはその復旧パスでも追従所有権を維持するため、後で追従対象ユーザーが切断すると引き続きチャンネルから退出します。

参加モードの選択:

- 自分が音声にいるときにボットも自動的に音声へ入ってほしい個人用またはオペレーター用の構成では、`followUsers` を使います。
- 追跡対象ユーザーが音声にいなくても存在しているべき固定ルームボットでは、`autoJoin` を使います。
- 一度限りの参加や、自動的な音声常駐が意外に感じられる部屋では、`/vc join` を使います。

Discord 音声コーデック:

- 音声受信ログには `discord voice: opus decoder: libopus-wasm` が表示されます。
- リアルタイム再生は、生の 48 kHz ステレオ PCM を同じ同梱 `libopus-wasm` パッケージで Opus にエンコードしてから、パケットを `@discordjs/voice` に渡します。
- ファイルおよびプロバイダーストリームの再生は、ffmpeg で生の 48 kHz ステレオ PCM にトランスコードし、その後 Discord へ送信する Opus パケットストリームに `libopus-wasm` を使います。

STT と TTS のパイプライン:

- Discord PCM キャプチャは WAV 一時ファイルに変換されます。
- `tools.media.audio` は STT を処理します。例: `openai/gpt-4o-mini-transcribe`。
- 文字起こしは Discord の流入とルーティングを通じて送信され、応答 LLM はエージェントの `tts` ツールを隠して返却テキストを求める音声出力ポリシーで実行されます。これは Discord 音声が最終的な TTS 再生を所有するためです。
- `voice.model` が設定されている場合、この音声チャンネルターンの応答 LLM だけを上書きします。
- `voice.tts` は `messages.tts` にマージされます。ストリーミング対応プロバイダーはプレーヤーへ直接供給し、それ以外の場合は生成された音声ファイルが参加中のチャンネルで再生されます。

デフォルトの agent-proxy 音声チャンネルセッション例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

`voice.agentSession` ブロックがない場合、各音声チャンネルは独自にルーティングされた OpenClaw セッションを取得します。たとえば、`/vc join channel:234567890123456789` はその Discord 音声チャンネルのセッションと会話します。リアルタイムモデルは音声フロントエンドにすぎません。実質的なリクエストは設定済みの OpenClaw エージェントに渡されます。リアルタイムモデルが consult ツールを呼び出さずに最終文字起こしを生成した場合、OpenClaw はフォールバックとして consult を強制するため、デフォルトでもエージェントと会話しているように動作します。

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

リアルタイム双方向の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

既存の Discord チャンネルセッションの拡張としての音声:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

`agent-proxy` モードでは、ボットは設定済みの音声チャンネルに参加しますが、OpenClaw エージェントターンはターゲットチャンネルの通常のルーティング済みセッションとエージェントを使用します。リアルタイム音声セッションは、返された結果を音声チャンネルへ話し返します。スーパーバイザーエージェントは、ツールポリシーに従って通常のメッセージツールを引き続き使用できます。適切なアクションであれば、別の Discord メッセージを送信することも含まれます。

委譲された OpenClaw 実行がアクティブな間、新しい Discord 音声文字起こしは、別のエージェントターンを開始する前にライブ実行制御として扱われます。「status」「cancel that」「use the smaller fix」「when you're done also check tests」などのフレーズは、アクティブなセッションへのステータス、キャンセル、方向付け、またはフォローアップ入力として分類されます。ステータス、キャンセル、受け入れられた方向付け、フォローアップの結果は音声チャンネルへ話し返されるため、呼び出し元は OpenClaw がリクエストを処理したかどうかを把握できます。

有用なターゲット形式:

- `target: "channel:123456789012345678"` は Discord テキストチャンネルセッション経由でルーティングします。
- `target: "123456789012345678"` はチャンネルターゲットとして扱われます。
- `target: "dm:123456789012345678"` または `target: "user:123456789012345678"` はそのダイレクトメッセージセッション経由でルーティングします。

エコーが多い OpenAI Realtime の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
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

モデルが開いたマイクを通じて自分自身の Discord 再生を聞いてしまうものの、発話による割り込みは有効にしたい場合に使用します。OpenClaw は OpenAI が生の入力音声で自動割り込みしないようにしつつ、`bargeIn: true` により、次にキャプチャされたターンが OpenAI に届く前に Discord の話者開始イベントとすでにアクティブな話者音声でアクティブなリアルタイム応答をキャンセルできます。`audioEndMs` が `minBargeInAudioEndMs` を下回る非常に早い割り込みシグナルは、エコーまたはノイズの可能性が高いものとして扱われ、モデルが最初の再生フレームで途切れないように無視されます。

想定される音声ログ:

- 参加時: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- リアルタイム開始時: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 話者音声時: `discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`、および `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 古い発話をスキップした時: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` または `reason=non-actionable-closing ...`
- リアルタイム応答完了時: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 再生停止/リセット時: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- リアルタイム consult 時: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- エージェント回答時: `discord voice: agent turn answer ...`
- 正確な発話のキュー投入時: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`、続いて `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 割り込み検出時: `discord voice: realtime barge-in detected source=speaker-start ...` または `discord voice: realtime barge-in detected source=active-speaker-audio ...`、続いて `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- リアルタイム割り込み時: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`、続いて `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` または `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- エコー/ノイズの無視時: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 割り込み無効時: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- アイドル再生時: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

途切れる音声をデバッグするには、リアルタイム音声ログをタイムラインとして読みます。

1. `realtime audio playback started` は Discord がアシスタント音声の再生を開始したことを意味します。この時点から、ブリッジはアシスタント出力チャンク、Discord PCM バイト、プロバイダーのリアルタイムバイト、および合成音声の長さを数え始めます。
2. `realtime speaker turn opened` は Discord 話者がアクティブになったことを示します。再生がすでにアクティブで `bargeIn` が有効な場合、これに続いて `barge-in detected source=speaker-start` が出ることがあります。
3. `realtime input audio started` は、その話者ターンで最初の実際の音声フレームを受信したことを示します。ここで `outputActive=true` またはゼロでない `outputAudioMs` がある場合、アシスタント再生がまだアクティブな間にマイクが入力を送信していることを意味します。
4. `barge-in detected source=active-speaker-audio` は、アシスタント再生がアクティブな間に OpenClaw がライブ話者音声を検出したことを意味します。これは、実際の割り込みと、有用な音声を伴わない Discord の話者開始イベントを区別するのに役立ちます。
5. `barge-in requested reason=...` は、OpenClaw がリアルタイムプロバイダーにアクティブな応答のキャンセルまたは切り詰めを要求したことを意味します。`outputAudioMs`、`outputActive`、`playbackChunks` が含まれるため、割り込み前に実際にどれだけのアシスタント音声が再生されていたかを確認できます。
6. `realtime audio playback stopped reason=...` はローカル Discord 再生のリセット地点です。理由は、誰が再生を停止したかを示します: `barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close`、または `session-close`。
7. `realtime speaker turn closed` はキャプチャされた入力ターンを要約します。`chunks=0` または `hasAudio=false` は、話者ターンは開いたものの、使用可能な音声がリアルタイムブリッジに到達しなかったことを意味します。`interruptedPlayback=true` は、その入力ターンがアシスタント出力と重なり、割り込みロジックをトリガーしたことを意味します。

有用なフィールド:

- `outputAudioMs`: ログ行の前にリアルタイムプロバイダーが生成したアシスタント音声の長さ。
- `audioMs`: 再生停止前に OpenClaw が数えたアシスタント音声の長さ。
- `elapsedMs`: 再生ストリームまたは話者ターンの開始から終了までの実時間。
- `discordBytes`: Discord 音声へ送信、または Discord 音声から受信した 48 kHz ステレオ PCM バイト。
- `realtimeBytes`: リアルタイムプロバイダーへ送信、またはリアルタイムプロバイダーから受信したプロバイダー形式の PCM バイト。
- `playbackChunks`: アクティブな応答のために Discord へ転送されたアシスタント音声チャンク。
- `sinceLastAudioMs`: 最後にキャプチャされた話者音声フレームから話者ターン終了までの間隔。

一般的なパターン:

- `source=active-speaker-audio`、小さい `outputAudioMs`、近くに同じユーザーがある即時の途切れは、通常、スピーカーのエコーがマイクに入っていることを示します。`voice.realtime.minBargeInAudioEndMs` を上げる、スピーカー音量を下げる、ヘッドフォンを使う、または `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` を設定してください。
- `source=speaker-start` に続いて `speaker turn closed ... hasAudio=false` がある場合、Discord は話者開始を報告したものの、音声が OpenClaw に到達しなかったことを意味します。これは一時的な Discord 音声イベント、ノイズゲートの挙動、またはクライアントが短時間だけマイクを有効にしたことが原因の場合があります。
- 近くに割り込みまたは `provider-clear-audio` がないのに `audio playback stopped reason=stream-close` がある場合、ローカル Discord 再生ストリームが予期せず終了したことを意味します。直前のプロバイダーと Discord プレーヤーのログを確認してください。
- `capture ignored during playback (barge-in disabled)` は、アシスタント音声がアクティブな間に OpenClaw が意図的に入力を破棄したことを意味します。発話で再生を割り込みたい場合は `voice.realtime.bargeIn` を有効にしてください。
- `barge-in ignored ... outputActive=false` は、Discord またはプロバイダー VAD が発話を報告したものの、OpenClaw には割り込むべきアクティブな再生がなかったことを意味します。これで音声が途切れることはありません。

認証情報はコンポーネントごとに解決されます: `voice.model` の LLM ルート認証、`tools.media.audio` の STT 認証、`messages.tts`/`voice.tts` の TTS 認証、そして `voice.realtime.providers` またはプロバイダーの通常の認証設定のリアルタイムプロバイダー認証です。

### 音声メッセージ

Discord 音声メッセージは波形プレビューを表示し、OGG/Opus 音声を必要とします。OpenClaw は波形を自動生成しますが、検査と変換のために Gateway ホスト上の `ffmpeg` と `ffprobe` が必要です。

- **ローカルファイルパス**を指定します（URL は拒否されます）。
- テキスト内容は省略します（Discord は同じペイロード内のテキスト + 音声メッセージを拒否します）。
- 任意の音声形式を使用できます。OpenClaw は必要に応じて OGG/Opus に変換します。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていない intents を使用した、またはボットがギルドメッセージを見られない">

    - Message Content Intent を有効にする
    - ユーザー/メンバー解決に依存する場合は Server Members Intent を有効にする
    - インテント変更後にゲートウェイを再起動する

  </Accordion>

  <Accordion title="ギルドメッセージが予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` 配下のギルド許可リストを確認する
    - ギルドの `channels` マップが存在する場合、記載されたチャンネルのみ許可される
    - `requireMention` の動作とメンションパターンを確認する

    役立つ確認:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention が false でもブロックされる">
    よくある原因:

    - 一致するギルド/チャンネル許可リストがない `groupPolicy="allowlist"`
    - `requireMention` が誤った場所に設定されている（`channels.discord.guilds` またはチャンネルエントリ配下である必要がある）
    - 送信者がギルド/チャンネルの `users` 許可リストでブロックされている

  </Accordion>

  <Accordion title="長時間実行される Discord ターンまたは重複返信">

    典型的なログ:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord ゲートウェイキューの調整項目:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - 複数アカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - これは Discord ゲートウェイリスナーの処理のみを制御し、エージェントターンの存続時間は制御しない

    Discord は、キューに入ったエージェントターンにチャンネル所有のタイムアウトを適用しません。メッセージリスナーは即座に引き渡し、キューに入った Discord 実行は、セッション/ツール/ランタイムのライフサイクルが完了するか処理を中止するまで、セッションごとの順序を保持します。

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

  <Accordion title="Gateway メタデータ参照タイムアウト警告">
    OpenClaw は接続前に Discord `/gateway/bot` メタデータを取得します。一時的な失敗時は Discord のデフォルト Gateway URL にフォールバックし、ログではレート制限されます。

    メタデータタイムアウトの調整項目:

    - 単一アカウント: `channels.discord.gatewayInfoTimeoutMs`
    - 複数アカウント: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - config が未設定の場合の env フォールバック: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - デフォルト: `30000`（30 秒）、最大: `120000`

  </Accordion>

  <Accordion title="Gateway READY タイムアウト再起動">
    OpenClaw は、起動時およびランタイム再接続後に Discord の Gateway `READY` イベントを待機します。起動の段階化を使う複数アカウント構成では、デフォルトより長い起動時 READY ウィンドウが必要になる場合があります。

    READY タイムアウトの調整項目:

    - 起動時の単一アカウント: `channels.discord.gatewayReadyTimeoutMs`
    - 起動時の複数アカウント: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - config が未設定の場合の起動時 env フォールバック: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 起動時デフォルト: `15000`（15 秒）、最大: `120000`
    - ランタイムの単一アカウント: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - ランタイムの複数アカウント: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - config が未設定の場合のランタイム env フォールバック: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ランタイムデフォルト: `30000`（30 秒）、最大: `120000`

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` の権限チェックは、数値のチャンネル ID に対してのみ機能します。

    スラッグキーを使用している場合、ランタイムのマッチングは引き続き機能することがありますが、probe は権限を完全には検証できません。

  </Accordion>

  <Accordion title="DM とペアリングの問題">

    - DM 無効: `channels.discord.dm.enabled=false`
    - DM ポリシー無効: `channels.discord.dmPolicy="disabled"`（レガシー: `channels.discord.dm.policy`）
    - `pairing` モードでペアリング承認待ち

  </Accordion>

  <Accordion title="ボット間ループ">
    デフォルトでは、ボットが作成したメッセージは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるために厳密なメンションと許可リストのルールを使用してください。
    ボットにメンションするボットメッセージのみを受け入れるには、`channels.discord.allowBots="mentions"` を推奨します。

    OpenClaw には共有の [ボットループ保護](/ja-JP/channels/bot-loop-protection) も同梱されています。`allowBots` によってボット作成メッセージがディスパッチに到達できる場合、Discord は受信イベントを `(account, channel, bot pair)` の事実にマッピングし、汎用ペアガードは設定済みイベント予算を超えた後にそのペアを抑止します。このガードは、以前は Discord のレート制限で止める必要があった制御不能な 2 ボットループを防ぎます。単一ボットのデプロイや、予算内に収まる単発のボット返信には影響しません。

    デフォルト設定（`allowBots` が設定されている場合に有効）:

    - `maxEventsPerWindow: 20` -- ボットペアはスライディングウィンドウ内で 20 件のメッセージを交換できる
    - `windowSeconds: 60` -- スライディングウィンドウの長さ
    - `cooldownSeconds: 60` -- 予算に達すると、どちらの方向の追加のボット間メッセージも 1 分間破棄される

    共有デフォルトは `channels.defaults.botLoopProtection` 配下で一度設定し、正当なワークフローで余裕がさらに必要な場合に Discord を上書きします。優先順位は次のとおりです。

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - 組み込みデフォルト

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

  <Accordion title="DecryptionFailed(...) による音声 STT のドロップ">

    - Discord 音声受信の回復ロジックが存在するように、OpenClaw を最新に保つ（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）を確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（上流デフォルト）から始め、必要な場合のみ調整する
    - 次のログを監視する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集し、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) の上流 DAVE 受信履歴と比較する

  </Accordion>
</AccordionGroup>

## 設定リファレンス

主要リファレンス: [設定リファレンス - Discord](/ja-JP/gateway/config-channels#discord)。

<Accordion title="重要度の高い Discord フィールド">

- 起動/認証: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- ポリシー: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- コマンド: `commands.native`, `commands.useAccessGroups`（グローバル）, `configWrites`, `slashCommand.ephemeral`
- イベントキュー: `eventQueue.listenerTimeout`（リスナー予算、デフォルト `120000`）, `eventQueue.maxQueueSize`（デフォルト `10000`）, `eventQueue.maxConcurrency`（デフォルト `50`）
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- 返信/履歴: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 配信: `textChunkLimit`（デフォルト `2000`）, `maxLinesPerMessage`（デフォルト `17`）
- ストリーミング: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*`（レガシーのフラットな `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` キーは `openclaw doctor --fix` によって `streaming.*` に移行される）
- メディア/リトライ: `mediaMaxMb`（送信 Discord アップロードを制限、デフォルト `100`）, `retry`
- アクション: `actions.*`
- プレゼンス: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- UI: `ui.components.accentColor`
- 機能: `threadBindings`, トップレベル `bindings[]`（`type: "acp"`）, `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## 安全性と運用

- ボットトークンはシークレットとして扱う（監督環境では `DISCORD_BOT_TOKEN` を推奨）。
- Discord 権限は最小権限で付与する。
- コマンドのデプロイ/状態が古い場合は、ゲートウェイを再起動し、`openclaw channels status --probe` で再確認する。

## 関連

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord ユーザーをゲートウェイにペアリングします。
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
    ギルドとチャンネルをエージェントにマッピングします。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作。
  </Card>
</CardGroup>
