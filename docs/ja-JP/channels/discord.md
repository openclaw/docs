---
read_when:
    - Discord チャンネル機能の作業
summary: Discord ボットのセットアップ、設定キー、コンポーネント、音声、トラブルシューティング
title: Discord
x-i18n:
    generated_at: "2026-07-06T10:46:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd5ae9630eb7629548f79294488161747e21161a3fc73df2962a4edc3ad660c
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw は公式 Discord Gateway 経由のボットとして Discord に接続します。DM とギルドチャンネルに対応しています。

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

ボット付きの Discord アプリケーションを作成し、そのボットをサーバーに追加して、OpenClaw とペアリングします。可能であればプライベートサーバーを使用してください。必要なら、先に[作成します](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**自分用に作成 > 自分と友達用**）。

<Steps>
  <Step title="Discord アプリケーションとボットを作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) で **New Application** をクリックし、名前を付けます（例: 「OpenClaw」）。

    サイドバーで **Bot** を開き、**Username** をエージェント名に設定します。

  </Step>

  <Step title="特権インテントを有効にする">
    引き続き **Bot** ページで、**Privileged Gateway Intents** の下にある次の項目を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロール許可リスト、名前から ID への照合、チャンネル対象者アクセスグループに必要）
    - **Presence Intent**（任意。プレゼンス更新にのみ使用）

  </Step>

  <Step title="ボットトークンをコピーする">
    **Bot** ページで **Reset Token** をクリックし、トークンをコピーします。

    <Note>
    名前とは異なり、これは最初のトークンを生成します。「リセット」されるものはありません。
    </Note>

  </Step>

  <Step title="招待 URL を生成し、ボットをサーバーに追加する">
    サイドバーで **OAuth2** を開きます。**OAuth2 URL Generator** で、次のスコープを有効にします。

    - `bot`
    - `applications.commands`

    表示される **Bot Permissions** セクションで、少なくとも次を有効にします。

    **General Permissions**
      - チャンネルを見る

    **Text Permissions**
      - メッセージを送信
      - メッセージ履歴を読む
      - 埋め込みリンク
      - ファイルを添付
      - リアクションを追加（任意）

    これが通常のテキストチャンネルのベースラインです。ボットがスレッドに投稿する場合（スレッドを作成または継続するフォーラムやメディアチャンネルのワークフローを含む）は、**Send Messages in Threads** も有効にします。

    生成された URL をコピーし、ブラウザで開いてサーバーを選択し、**Continue** をクリックします。これでボットがサーバーに表示されるはずです。

  </Step>

  <Step title="開発者モードを有効にして ID を集める">
    Discord アプリで開発者モードを有効にし、ID をコピーできるようにします。

    1. **User Settings**（歯車アイコン）→ **Developer** → **Developer Mode** をオンに切り替える
       （モバイルでは **App Settings** → **Advanced**）
    2. **サーバーアイコン** を右クリック → **Copy Server ID**
    3. **自分のアバター** を右クリック → **Copy User ID**

    Server ID と User ID をボットトークンと一緒に保管してください。次に 3 つすべてが必要です。

  </Step>

  <Step title="サーバーメンバーからの DM を許可する">
    ペアリングを機能させるには、Discord がボットからあなたへの DM を許可している必要があります。**サーバーアイコン** を右クリック → **Privacy Settings** → **Direct Messages** をオンに切り替えます。

    OpenClaw で Discord DM を使う場合は、この設定をオンのままにしてください。ギルドチャンネルだけを使う場合は、ペアリング後に無効にできます。

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

    OpenClaw がすでにバックグラウンドサービスとして実行されている場合は、OpenClaw Mac アプリ経由、または `openclaw gateway run` プロセスを停止して再起動することで再起動します。
    管理対象サービスのインストールでは、`DISCORD_BOT_TOKEN` が設定されているシェルから `openclaw gateway install` を実行するか、変数を `~/.openclaw/.env` に保存して、再起動後にサービスが env SecretRef を解決できるようにします。
    ホストが Discord の起動時アプリケーション検索でブロックまたはレート制限される場合は、Developer Portal からアプリケーション/クライアント ID を設定して、起動時にその REST 呼び出しをスキップできるようにします。デフォルトアカウントの場合は `channels.discord.applicationId`、ボットごとの場合は `channels.discord.accounts.<accountId>.applicationId` です。

  </Step>

  <Step title="OpenClaw を設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼">
        既存のチャンネル（例: Telegram）で OpenClaw エージェントとチャットし、伝えます。Discord が最初のチャンネルの場合は、代わりに CLI / config タブを使います。

        > 「Discord ボットトークンはすでに config に設定しました。User ID `<user_id>` と Server ID `<server_id>` で Discord セットアップを完了してください。」
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

        スクリプトまたはリモートセットアップでは、同じ JSON5 ブロックを `openclaw config patch --file ./discord.patch.json5 --dry-run` で書き込み、その後 `--dry-run` なしで再実行します。平文の `token` 文字列も機能し、SecretRef 値は env/file/exec プロバイダーを通じて `channels.discord.token` でサポートされます。[シークレット管理](/ja-JP/gateway/secrets)を参照してください。

        複数の Discord ボットを使う場合は、各ボットトークンとアプリケーション ID をそのアカウントの下に保持します。トップレベルの `channels.discord.applicationId` はアカウントに継承されるため、すべてのアカウントが同じアプリケーション ID を使う場合にのみそこへ設定してください。

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
    Gateway が実行されたら、Discord でボットに DM します。ボットはペアリングコードを返信します。

    <Tabs>
      <Tab title="エージェントに依頼">
        既存のチャンネルでペアリングコードをエージェントに送信します。

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
トークン解決はアカウント対応です。Config のトークン値は env フォールバックより優先され、`DISCORD_BOT_TOKEN` はデフォルトアカウントにのみ使用されます。
有効な 2 つの Discord アカウントが同じボットトークンに解決される場合、OpenClaw はそのトークンに対して 1 つの Gateway モニターだけを開始します。config 由来のトークンは env フォールバックより優先されます。それ以外の場合は最初の有効アカウントが優先され、重複アカウントは理由 `duplicate bot token` で無効として報告されます。
高度なアウトバウンド呼び出し（メッセージツール/チャンネルアクション）では、呼び出しごとの明示的な `token` がその呼び出しに使用されます。これは送信および read/probe スタイルのアクション（read/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシー/再試行設定は、アクティブなランタイムスナップショットで選択されたアカウントから引き続き取得されます。
</Note>

## 推奨: ギルドワークスペースをセットアップする

DM が機能したら、サーバーを完全なワークスペースにできます。各チャンネルは独自のコンテキストを持つ独自のエージェントセッションになります。あなたとボットだけがいるプライベートサーバーに推奨します。

<Steps>
  <Step title="サーバーをギルド許可リストに追加する">
    これにより、DM だけでなく、サーバー上の任意のチャンネルでエージェントが応答できます。

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
    デフォルトでは、エージェントは @mention された場合にのみギルドチャンネルで応答します。プライベートサーバーでは、すべてのメッセージに応答させたい場合が多いでしょう。

    ギルドチャンネルでは、通常の返信はデフォルトで自動投稿されます。共有の常時オンの部屋では、`messages.groupChat.visibleReplies: "message_tool"` を有効にすると、エージェントは潜在し、チャンネル返信が有用だと判断した場合にのみ投稿できます。これは GPT 5.5 などの最新世代でツール信頼性の高いモデルと最も相性がよいです。アンビエントな部屋イベントは、ツールが送信しない限り静かなままです。完全な潜在モード config については、[アンビエントな部屋イベント](/ja-JP/channels/ambient-room-events)を参照してください。

    Discord に入力中表示が出て、ログにトークン使用量が表示されるのに投稿メッセージがない場合は、そのターンがアンビエントな部屋イベントとして設定されているか、メッセージツールの可視返信が有効になっているかを確認してください。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「このサーバーで @mention しなくてもエージェントが応答できるようにしてください」
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

        表示されるグループ/チャンネル返信にメッセージツール送信を必須にするには、`messages.groupChat.visibleReplies: "message_tool"` を設定します。

      </Tab>
    </Tabs>

  </Step>

  <Step title="ギルドチャンネルのメモリを計画する">
    長期メモリ（MEMORY.md）は DM セッションでのみ自動ロードされます。ギルドチャンネルではロードされません。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「Discord チャンネルで質問したとき、MEMORY.md から長期コンテキストが必要なら memory_search または memory_get を使ってください。」
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有するコンテキストには、安定した指示を `AGENTS.md` または `USER.md`（すべてのセッションに注入される）に置きます。長期的なメモは `MEMORY.md` に保持し、必要に応じてメモリツールでアクセスします。
      </Tab>
    </Tabs>

  </Step>
</Steps>

これでチャンネルを作成してチャットを始められます。エージェントはチャンネル名を認識し、各チャンネルは分離されたセッションになります。`#coding`、`#home`、`#research` など、ワークフローに合うものをセットアップしてください。

## ランタイムモデル

- Gateway が Discord 接続を所有します。
- 返信ルーティングは決定的です。Discord からのインバウンドには Discord へ返信します。
- Discord のギルド/チャンネルメタデータは、ユーザーに見える返信プレフィックスとしてではなく、信頼できないコンテキストとしてモデルプロンプトに追加されます。モデルがそのエンベロープをコピーして返した場合、OpenClaw はコピーされたメタデータをアウトバウンド返信と今後のリプレイコンテキストから取り除きます。
- デフォルトでは（`session.dmScope=main`）、直接チャットはエージェントのメインセッション（`agent:main:main`）を共有します。
- ギルドチャンネルは分離されたセッションキー（`agent:<agentId>:discord:channel:<channelId>`）です。
- グループ DM はデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブスラッシュコマンドは分離されたコマンドセッション（`agent:<agentId>:discord:slash:<userId>`）で実行されますが、ルーティングされた会話セッションへ `CommandTargetSessionKey` も引き続き渡します。
- Discord へのテキストのみの Cron/Heartbeat アナウンス配信は、最後のアシスタント可視回答にまとめられ、1 回送信されます。メディアおよび構造化コンポーネントペイロードは、エージェントが複数の配信可能ペイロードを出力した場合、複数メッセージのままになります。

## フォーラムチャンネル

Discord のフォーラムおよびメディアチャンネルはスレッド投稿のみを受け付けます。OpenClaw はそれらを作成する 2 つの方法に対応しています。

- フォーラムの親 (`channel:<forumId>`) にメッセージを送信すると、スレッドが自動作成されます。スレッドタイトルは、メッセージの最初の空でない行です（Discord の 100 文字のスレッド名上限まで切り詰められます）。
- スレッドを直接作成するには `openclaw message thread create` を使用します。フォーラムチャンネルでは `--message-id` を渡さないでください。

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

OpenClaw は、エージェントメッセージ向けに Discord コンポーネント v2 コンテナをサポートします。`components` ペイロード付きでメッセージツールを使用します。インタラクション結果は通常の受信メッセージとしてエージェントに戻され、既存の Discord `replyToMode` 設定に従います。

サポートされるブロック:

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- アクション行では最大 5 個のボタン、または単一の選択メニューを使用できます
- 選択タイプ: `string`、`user`、`role`、`mentionable`、`channel`

デフォルトでは、コンポーネントは 1 回だけ使用できます。ボタン、選択、フォームを期限切れになるまで複数回使用できるようにするには、`components.reusable=true` を設定します。

ボタンをクリックできるユーザーを制限するには、そのボタンに `allowedUsers` を設定します（Discord ユーザー ID、タグ、または `*`）。一致しないユーザーには一時的な拒否が返されます。

コンポーネントコールバックはデフォルトで 30 分後に期限切れになります。デフォルトアカウントのコールバックレジストリの有効期間を変更するには `channels.discord.agentComponents.ttlMs` を設定し、アカウントごとに変更するには `channels.discord.accounts.<accountId>.agentComponents.ttlMs` を設定します。値はミリ秒で、正の整数である必要があり、`86400000`（24 時間）が上限です。長い TTL は、ボタンを使用可能なままにする必要があるレビューや承認ワークフローに適していますが、古い Discord メッセージがまだアクションをトリガーできる時間枠も広げます。用途に合う最短の TTL を優先し、古いコールバックが予期しない動作になる場合はデフォルトのままにしてください。

`/model` と `/models` のスラッシュコマンドは、プロバイダー、モデル、互換性のあるランタイムのドロップダウンに送信ステップを加えた、インタラクティブなモデルピッカーを開きます。`/models add` は非推奨であり、チャットからモデルを登録する代わりに非推奨メッセージを返します。ピッカーの返信は一時的で、呼び出したユーザーだけが使用できます。Discord の選択メニューは 25 個のオプションに制限されているため、`openai` や `vllm` などの選択されたプロバイダーについてのみ動的に検出されたモデルをピッカーに表示したい場合は、`agents.defaults.models` に `provider/*` エントリを追加してください。

ファイル添付:

- `file` ブロックは添付参照 (`attachment://<filename>`) を指している必要があります
- 添付は `media`/`path`/`filePath`（単一ファイル）で指定します。複数ファイルには `media-gallery` を使用します
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

    - `pairing`（デフォルト）
    - `allowlist`（少なくとも 1 つの `allowFrom` 送信者が必要）
    - `open`（`channels.discord.allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    DM ポリシーが open でない場合、不明なユーザーはブロックされます（または `pairing` モードではペアリングを促されます）。

    複数アカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 1 つのアカウントでは、`allowFrom` がレガシーの `dm.allowFrom` より優先されます。
    - 名前付きアカウントは、自身の `allowFrom` とレガシーの `dm.allowFrom` が未設定の場合、`channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    レガシーの `channels.discord.dm.policy` と `channels.discord.dm.allowFrom` は互換性のために引き続き読み取られます。`openclaw doctor --fix` は、アクセスを変更せずに実行できる場合、それらを `dmPolicy` と `allowFrom` に移行します。

    配信用の DM ターゲット形式:

    - `user:<id>`
    - `<@id>` メンション

    通常、チャンネルデフォルトが有効な場合、裸の数値 ID はチャンネル ID として解決されますが、アカウントの有効な DM `allowFrom` に含まれる ID は、互換性のためにユーザー DM ターゲットとして扱われます。

  </Tab>

  <Tab title="Access groups">
    Discord DM とテキストコマンド認可では、`channels.discord.allowFrom` 内で動的な `accessGroup:<name>` エントリを使用できます。

    アクセスグループ名はメッセージチャンネル間で共有されます。メンバーを各チャンネルの通常の `allowFrom` 構文で表す静的グループには `type: "message.senders"` を使用し、Discord チャンネルの現在の `ViewChannel` オーディエンスでメンバーシップを動的に定義する場合は `type: "discord.channelAudience"` を使用します。共有アクセスグループの動作: [アクセスグループ](/ja-JP/channels/access-groups)。

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

    Discord テキストチャンネルには個別のメンバーリストがありません。`type: "discord.channelAudience"` は、DM 送信者が設定されたギルドのメンバーであり、ロールとチャンネルの上書きが適用された後、設定されたチャンネルに対して現在有効な `ViewChannel` 権限を持つ、という形でメンバーシップをモデル化します。

    例: `#maintainers` を見られるすべての人がボットに DM できるようにし、それ以外の全員には DM を閉じたままにします。

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

    チャンネルオーディエンスのアクセスグループを使用する場合は、Discord Developer Portal の **サーバーメンバーインテント** を有効にしてください。DM にはギルドメンバー状態が含まれないため、OpenClaw は認可時に Discord REST を通じてメンバーを解決します。

  </Tab>

  <Tab title="Guild policy">
    ギルドの処理は `channels.discord.groupPolicy` によって制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合の安全なベースラインは `allowlist` です。

    `allowlist` の動作:

    - ギルドは `channels.discord.guilds` と一致する必要があります（`id` 推奨、スラッグも使用可）
    - 任意の送信者許可リスト: `users`（安定した ID を推奨）と `roles`（ロール ID のみ）。どちらかが設定されている場合、送信者は `users` または `roles` に一致すると許可されます
    - 直接の名前/タグ照合はデフォルトで無効です。緊急互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
    - `users` では名前/タグがサポートされますが、ID の方が安全です。名前/タグのエントリが使われている場合、`openclaw security audit` が警告します
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

    レガシーのチャンネルごとの `allow` キーは、`openclaw doctor --fix` によって `enabled` に移行されます。

    `DISCORD_BOT_TOKEN` だけを設定し、`channels.discord` ブロックを作成しない場合、ランタイムフォールバックは `groupPolicy="allowlist"` です（ログに警告が出ます）。これは `channels.defaults.groupPolicy` が `open` であっても同じです。

  </Tab>

  <Tab title="Mentions and group DMs">
    ギルドメッセージはデフォルトでメンション必須です。

    メンション検出には以下が含まれます。

    - 明示的なボットメンション
    - 設定されたメンションパターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - サポートされる場合の暗黙的なボットへの返信動作

    送信 Discord メッセージを書く場合は、正規のメンション構文を使用してください。ユーザーには `<@USER_ID>`、チャンネルには `<#CHANNEL_ID>`、ロールには `<@&ROLE_ID>` を使用します。レガシーの `<@!USER_ID>` ニックネームメンション形式は使用しないでください。

    `requireMention` はギルド/チャンネルごとに設定されます（`channels.discord.guilds...`）。
    `ignoreOtherMentions` は、ボットではなく別のユーザー/ロールにメンションしているメッセージを任意で破棄します（@everyone/@here を除く）。

    グループ DM:

    - デフォルト: 無視されます（`dm.groupEnabled=false`）
    - `dm.groupChannels`（チャンネル ID またはスラッグ）による任意の許可リスト

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

`bindings[].match.roles` を使用して、Discord ギルドメンバーをロール ID によって別々のエージェントへルーティングします。ロールベースのバインディングはロール ID のみを受け付け、ピアまたは親ピアのバインディングの後、ギルドのみのバインディングの前に評価されます。バインディングが他の一致フィールド（例: `peer` + `guildId` + `roles`）も設定している場合、設定されたすべてのフィールドが一致する必要があります。

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

- `commands.native` の既定値は `"auto"` で、Discord では有効です。
- チャネルごとの上書き: `channels.discord.commands.native`。
- `commands.native=false` は、起動時の Discord スラッシュコマンド登録とクリーンアップをスキップします。以前に登録されたコマンドは、Discord アプリから削除するまで Discord に表示されたままになる場合があります。
- ネイティブコマンド認可は、通常のメッセージ処理と同じ Discord 許可リスト/ポリシーを使用します。
- 認可されていないユーザーにも、Discord UI ではコマンドが表示される場合があります。実行時には OpenClaw の認可が適用され、「認可されていません」と返信されます。
- 既定のスラッシュコマンド設定: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`)。

コマンドカタログと動作については、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

## 機能の詳細

<AccordionGroup>
  <Accordion title="返信タグとネイティブ返信">
    Discord はエージェント出力内の返信タグをサポートします。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` で制御します。

    - `off` (既定): 暗黙的な返信スレッド化なし。明示的な `[[reply_to_*]]` タグは引き続き尊重されます
    - `first`: ターン内の最初の送信 Discord メッセージに、暗黙的なネイティブ返信参照を付加します
    - `all`: すべての送信メッセージに付加します
    - `batched`: 受信イベントが複数メッセージのデバウンス済みバッチだった場合にのみ付加します。すべての単一メッセージターンではなく、主に曖昧な短時間の連続チャットにネイティブ返信を使いたい場合に便利です

    メッセージ ID はコンテキスト/履歴に公開されるため、エージェントは特定のメッセージを対象にできます。

  </Accordion>

  <Accordion title="リンクプレビュー">
    Discord は既定で URL にリッチリンク埋め込みを生成します。OpenClaw は既定で、送信 Discord メッセージ上のそれらの生成済み埋め込みを抑制するため、明示的に有効化しない限り、エージェントが送信した URL はプレーンリンクのままになります。

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    1 つのアカウントを上書きするには、`channels.discord.accounts.<id>.suppressEmbeds` を設定します。エージェントのメッセージツール送信でも、単一メッセージに対して `suppressEmbeds: false` を渡せます。明示的な Discord `embeds` ペイロードは、既定のリンクプレビュー設定では抑制されません。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClaw は一時メッセージを送信し、テキストが届くにつれて編集することで、下書き返信をストリーミングできます。`channels.discord.streaming.mode` は `off` | `partial` | `block` | `progress` を受け取ります (`streaming`/レガシー `streamMode` キーが設定されていない場合の既定)。`streamMode` はレガシーエイリアスです。永続化された設定を正規のネストされた `streaming` 形状に書き換えるには、`openclaw doctor --fix` を実行してください。

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
    - `partial` は、トークンが届くにつれて単一のプレビューメッセージを編集します。
    - `block` は下書きサイズのチャンクを送出します。サイズと区切り位置は `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`) で調整し、`textChunkLimit` にクランプされます。ブロックストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。
    - `progress` は編集可能なステータス下書きを 1 つ維持し、最終配信までツール進捗で更新します。共有スターターラベルは流れる行のため、十分な作業が表示されると他の行と同様にスクロールアウトします。
    - メディア、エラー、明示的返信の最終メッセージは、保留中のプレビュー編集をキャンセルします。
    - `streaming.preview.toolProgress` (既定 `true`) は、ツール/進捗更新がプレビューメッセージを再利用するかどうかを制御します。
    - ツール/進捗行は、利用可能な場合、コンパクトな絵文字 + タイトル + 詳細としてレンダリングされます。例: `🛠️ Bash: run tests` または `🔎 Web Search: for "query"`。
    - `streaming.progress.commentary` (既定 `false`) は、一時的な進捗下書き内でアシスタントのコメント/前置きテキストを有効化します。コメントは表示前にクリーンアップされ、一時的なままで、最終回答の配信は変更しません。
    - `streaming.progress.maxLineChars` は、行ごとの進捗プレビュー予算を制御します。文章は単語境界で短縮され、コマンドとパスの詳細は有用な接尾部を保持します。
    - `streaming.preview.commandText` / `streaming.progress.commandText` は、コンパクトな進捗行内のコマンド/実行詳細を制御します: `raw` (既定) または `status` (ツールラベルのみ)。

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

    プレビューストリーミングはテキスト専用です。メディア返信は通常配信にフォールバックします。

  </Accordion>

  <Accordion title="履歴、コンテキスト、スレッド動作">
    ギルド履歴コンテキスト:

    - `channels.discord.historyLimit` 既定 `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` は無効化します

    DM 履歴制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    スレッド動作:

    - Discord スレッドはチャネルセッションとしてルーティングされ、上書きされない限り親チャネル設定を継承します。
    - スレッドセッションは、親チャネルのセッションレベル `/model` 選択をモデル専用フォールバックとして継承します。スレッドローカルの `/model` 選択が優先され、トランスクリプト継承が有効でない限り親トランスクリプト履歴はコピーされません。
    - `channels.discord.thread.inheritParent` (既定 `false`) は、新しい自動スレッドを親トランスクリプトからシードするよう有効化します。アカウントごとの上書き: `channels.discord.accounts.<id>.thread.inheritParent`。
    - メッセージツールのリアクションは、`user:<id>` DM ターゲットを解決できます。
    - `guilds.<guild>.channels.<channel>.requireMention: false` は、返信段階のアクティベーションフォールバック中も保持されます。

    チャネルのトピックは**信頼されない**コンテキストとして注入されます。許可リストはエージェントをトリガーできるユーザーを制限するものであり、完全な補足コンテキスト編集境界ではありません。

  </Accordion>

  <Accordion title="サブエージェント用のスレッドバインドセッション">
    Discord はスレッドをセッションターゲットにバインドできるため、そのスレッド内の後続メッセージは同じセッション (サブエージェントセッションを含む) にルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在/新規スレッドをサブエージェント/セッションターゲットにバインドします
    - `/unfocus` 現在のスレッドバインドを削除します
    - `/agents` アクティブな実行とバインド状態を表示します
    - `/session idle <duration|off>` フォーカスされたバインドの非アクティブ時自動フォーカス解除を確認/更新します
    - `/session max-age <duration|off>` フォーカスされたバインドのハード最大有効期間を確認/更新します

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

    注:

    - `session.threadBindings.*` はグローバル既定値を設定します。`channels.discord.threadBindings.*` は Discord の動作を上書きします。
    - `spawnSessions` は、`sessions_spawn({ thread: true })` と ACP スレッド生成のスレッド自動作成/バインドを制御します。既定: `true`。
    - `defaultSpawnContext` は、スレッドバインド生成のネイティブサブエージェントコンテキストを制御します。既定: `"fork"`。
    - 非推奨の `spawnSubagentSessions`/`spawnAcpSessions` キーは、`openclaw doctor --fix` によって移行されます。
    - アカウントでスレッドバインドが無効な場合、`/focus` と関連するスレッドバインド操作は利用できません。

    [サブエージェント](/ja-JP/tools/subagents)、[ACP エージェント](/ja-JP/tools/acp-agents)、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

  </Accordion>

  <Accordion title="永続 ACP チャネルバインド">
    安定した「常時オン」の ACP ワークスペースでは、Discord 会話を対象とするトップレベルの型付き ACP バインドを設定します。

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

    注:

    - `/acp spawn codex --bind here` は現在のチャネルまたはスレッドをその場でバインドし、以後のメッセージを同じ ACP セッションに維持します。スレッドメッセージは親チャネルのバインドを継承します。
    - バインドされたチャネルまたはスレッドでは、`/new` と `/reset` は同じ ACP セッションをその場でリセットします。一時的なスレッドバインドは、アクティブな間ターゲット解決を上書きできます。
    - `spawnSessions` は、`--thread auto|here` による子スレッドの作成/バインドを制限します。

    バインド動作の詳細については、[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

  </Accordion>

  <Accordion title="リアクション通知">
    ギルドごとのリアクション通知モード (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (既定)
    - `all`
    - `allowlist` (`guilds.<id>.users` を使用)

    リアクションイベントはシステムイベントに変換され、ルーティングされた Discord セッションに添付されます。

  </Accordion>

  <Accordion title="Ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間、確認応答の絵文字を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェント ID 絵文字フォールバック (`agents.list[].identity.emoji`、なければ "👀")

    注:

    - Discord は Unicode 絵文字またはカスタム絵文字名を受け付けます。
    - チャネルまたはアカウントのリアクションを無効にするには、`""` を使用します。

    **スコープ (`messages.ackReactionScope`):**

    値: `"all"` (DM + グループ、アンビエントなルームイベントを含む)、`"direct"` (DM のみ)、`"group-all"` (アンビエントなルームイベントを除くすべてのグループメッセージ、DM なし)、`"group-mentions"` (bot がメンションされたグループ。**DM なし**、既定)、`"off"` / `"none"` (無効)。

    <Note>
    既定のスコープ (`"group-mentions"`) は、ダイレクトメッセージまたはアンビエントなルームイベントでは ack リアクションを発火しません。受信 Discord DM と静かなルームイベントで ack リアクションを得るには、`messages.ackReactionScope` を `"all"` に設定してください。
    </Note>

  </Accordion>

  <Accordion title="設定の書き込み">
    チャネル起点の設定書き込みは既定で有効です。これは `/config set|unset` フロー (コマンド機能が有効な場合) に影響します。

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
    `channels.discord.proxy` を使用して、Discord Gateway WebSocket トラフィックと起動時の REST ルックアップ (アプリケーション ID + 許可リスト解決) を HTTP(S) プロキシ経由でルーティングします。
    Discord Gateway WebSocket プロキシは明示的です。WebSocket 接続は、Gateway プロセスから環境のプロキシ環境変数を継承しません。`channels.discord.proxy` が設定されている場合、起動時の REST ルックアップはこのプロキシを使用します。

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

    - allowlist では `pk:<memberId>` を使用できる
    - メンバー表示名は、`channels.discord.dangerouslyAllowNameMatching: true` の場合にのみ name/slug で照合される
    - lookup は元のメッセージ ID で PluralKit API に問い合わせる
    - lookup に失敗した場合、プロキシされたメッセージは bot メッセージとして扱われ、`allowBots` で通過が許可されていない限り破棄される

  </Accordion>

  <Accordion title="送信メンションエイリアス">
    エージェントが既知の Discord ユーザーに対して決定的な送信メンションを必要とする場合は、`mentionAliases` を使用する。キーは先頭の `@` を含まないハンドル、値は Discord ユーザー ID。未知のハンドル、`@everyone`、`@here`、および Markdown コードスパン内のメンションは変更されない。

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
    プレゼンス更新は、ステータスまたはアクティビティフィールドを設定した場合、または自動プレゼンスを有効にした場合に適用される。

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

    アクティビティ（`activity` が設定されている場合、カスタムステータスがデフォルトのアクティビティタイプ）:

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

    アクティビティタイプの対応:

    - 0: プレイ中
    - 1: ストリーミング中（`activityUrl` が必要。`activityUrl` にはさらに `activityType: 1` が必要）
    - 2: リスニング中
    - 3: 視聴中
    - 4: カスタム（アクティビティテキストをステータス状態として使用。絵文字は任意）
    - 5: 競争中

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

    自動プレゼンスはランタイムの可用性を Discord ステータスにマップする: healthy => online、degraded または unknown => idle、exhausted または unavailable => dnd。デフォルト: `intervalMs` は 30000、`minUpdateIntervalMs` は 15000（`intervalMs` 以下である必要がある）。任意のテキスト上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（`{reason}` プレースホルダーに対応）

  </Accordion>

  <Accordion title="Discord での承認">
    Discord は DM でのボタンベースの承認処理に対応し、任意で承認プロンプトを元のチャンネルに投稿できる。

    設定パス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバック）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    Discord は、`enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` のいずれかから少なくとも 1 人の承認者を解決できる場合、ネイティブ exec 承認を自動的に有効にする。Discord は、チャンネルの `allowFrom`、レガシーの `dm.allowFrom`、またはダイレクトメッセージの `defaultTo` から exec 承認者を推論しない。Discord をネイティブ承認クライアントとして明示的に無効にするには、`enabled: false` を設定する。

    `/diagnostics` や `/export-trajectory` などの機密性の高いオーナー専用グループコマンドでは、OpenClaw は承認プロンプトと最終結果を非公開で送信する。呼び出したオーナーに Discord オーナールートがある場合は、まず Discord DM を試す。それ以外の場合は、Telegram など、`commands.ownerAllowFrom` で最初に利用可能なオーナールートにフォールバックする。

    `target` が `channel` または `both` の場合、承認プロンプトはチャンネル内に表示される。解決済みの承認者だけがボタンを使用でき、他のユーザーにはエフェメラルな拒否が返される。承認プロンプトにはコマンドテキストが含まれるため、チャンネル配信は信頼できるチャンネルでのみ有効にする。セッションキーからチャンネル ID を導出できない場合、OpenClaw は DM 配信にフォールバックする。

    Discord は他のチャットチャンネルで使用される共有承認ボタンをレンダリングする。ネイティブ Discord アダプターは主に、承認者への DM ルーティングとチャンネル fanout を追加する。これらのボタンが存在する場合、それらが主要な承認 UX になる。OpenClaw は、ツール結果がチャット承認を利用できないことを示す場合、または手動承認が唯一の経路である場合にのみ、手動の `/approve` コマンドを含めるべきである。Discord ネイティブ承認ランタイムがアクティブでない場合、OpenClaw はローカルの決定的な `/approve <id> <decision>` プロンプトを表示したままにする。ランタイムがアクティブでもネイティブカードをどのターゲットにも配信できない場合、OpenClaw は保留中の承認からの正確な `/approve` コマンドを含む同一チャットのフォールバック通知を送信する。

    Gateway 認証と承認解決は、共有 Gateway クライアント契約に従う（`plugin:` ID は `plugin.approval.resolve` 経由で解決され、その他の ID は `exec.approval.resolve` 経由で解決される）。承認はデフォルトで 30 分後に期限切れになる。

    [Exec approvals](/ja-JP/tools/exec-approvals) を参照。

  </Accordion>
</AccordionGroup>

## ツールとアクションゲート

Discord メッセージアクションは、メッセージング、チャンネル管理、モデレーション、プレゼンス、メタデータを対象とする。

主要な例:

- メッセージング: `sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- リアクション: `react`、`reactions`、`emojiList`
- モデレーション: `timeout`、`kick`、`ban`
- プレゼンス: `setPresence`

`event-create` アクションは、スケジュールされたイベントのカバー画像を設定するための任意の `image` パラメーター（URL またはローカルファイルパス）を受け付ける。

アクションゲートは `channels.discord.actions.*` 配下にある。

デフォルトのゲート動作:

| アクショングループ                                                                                                                                                       | デフォルト |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions、messages、threads、pins、polls、search、memberInfo、roleInfo、channelInfo、channels、voiceStatus、events、stickers、emojiUploads、stickerUploads、permissions | 有効       |
| roles                                                                                                                                                                    | 無効       |
| moderation                                                                                                                                                               | 無効       |
| presence                                                                                                                                                                 | 無効       |

## Components v2 UI

OpenClaw は exec 承認とクロスコンテキストマーカーに Discord components v2 を使用する。Discord メッセージアクションは、カスタム UI 用に `components` も受け付けることができる（高度な用途。discord ツールでコンポーネントペイロードを構築する必要がある）。一方でレガシーの `embeds` も引き続き利用できるが、推奨されない。

- `channels.discord.ui.components.accentColor` は、Discord コンポーネントコンテナーで使用されるアクセントカラー（16 進数）を設定する。アカウント別: `channels.discord.accounts.<id>.ui.components.accentColor`。
- `channels.discord.agentComponents.ttlMs` は、送信済み Discord コンポーネントコールバックの登録が保持される時間を制御する（デフォルト `1800000`、最大 `86400000`）。アカウント別: `channels.discord.accounts.<id>.agentComponents.ttlMs`。
- components v2 が存在する場合、`embeds` は無視される。
- プレーン URL プレビューはデフォルトで抑制される。単一の送信リンクを展開したい場合は、メッセージアクションで `suppressEmbeds: false` を設定する。

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

Discord には 2 つの異なる音声サーフェスがある。リアルタイムの **ボイスチャンネル**（継続的な会話）と **音声メッセージ添付ファイル**（波形プレビュー形式）である。Gateway は両方に対応している。

### ボイスチャンネル

セットアップチェックリスト:

1. Discord Developer Portal で Message Content Intent を有効にする。
2. ロール/ユーザー allowlist を使用する場合は Server Members Intent を有効にする。
3. `bot` と `applications.commands` スコープで bot を招待する。
4. 対象のボイスチャンネルで Connect、Speak、Send Messages、Read Message History を付与する。
5. ネイティブコマンド（`commands.native` または `channels.discord.commands.native`）を有効にする。
6. `channels.discord.voice` を設定する。

セッションを制御するには `/vc join|leave|status` を使用する。このコマンドはアカウントのデフォルトエージェントを使用し、他の Discord コマンドと同じ allowlist およびグループポリシールールに従う。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

参加前に bot の有効な権限を確認するには:

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

注記:

- Discord 音声はテキスト専用設定ではオプトインです。`channels.discord.voice.enabled=true` を設定するか、既存の `channels.discord.voice` ブロックを維持すると、`/vc` コマンド、音声ランタイム、`GuildVoiceStates` Gateway インテントが有効になります。`channels.discord.intents.voiceStates` でインテント購読を明示的に上書きできます。未設定のままにすると、有効な音声有効化状態に従います。
- `voice.mode` は会話パスを制御します。デフォルトは `agent-proxy` です。リアルタイム音声フロントエンドがターンのタイミング、割り込み、再生を扱い、実質的な作業を `openclaw_agent_consult` 経由でルーティング済みの OpenClaw エージェントに委任し、その結果をその話者からの入力済み Discord プロンプトのように扱います。`stt-tts` は従来のバッチ STT と TTS のフローを維持します。`bidi` はリアルタイムモデルが直接会話しつつ、OpenClaw の頭脳向けに `openclaw_agent_consult` を公開します。
- `voice.agentSession` は、どの OpenClaw 会話が音声ターンを受け取るかを制御します。未設定のままにすると音声チャンネル自身のセッションになります。または `{ mode: "target", target: "channel:<text-channel-id>" }` を設定すると、音声チャンネルを `#maintainers` など既存の Discord テキストチャンネルセッションのマイク/スピーカー拡張として動作させます。
- `voice.model` は、Discord 音声応答とリアルタイム consult に使う OpenClaw エージェントの頭脳を上書きします。未設定のままにすると、ルーティング済みエージェントモデルを継承します。これは `voice.realtime.model` とは別です。
- `voice.followUsers` により、ボットは選択したユーザーに合わせて Discord 音声に参加、移動、退出できます。[音声でユーザーをフォローする](#follow-users-in-voice)を参照してください。
- `agent-proxy` は音声を `discord-voice` 経由でルーティングします。これにより、話者と対象セッションに対する通常のオーナー/ツール認可は維持されますが、Discord 音声が再生を所有するため、エージェントの `tts` ツールは隠されます。デフォルトでは、`agent-proxy` はオーナー話者に対して consult にオーナー相当の完全なツールアクセスを与え（`voice.realtime.toolPolicy: "owner"`）、実質的な回答の前に OpenClaw エージェントへの consult を強く優先します（`voice.realtime.consultPolicy: "always"`）。そのデフォルトの `always` モードでは、リアルタイム層は consult 回答の前にフィラーを自動発話しません。発話をキャプチャして文字起こしし、その後ルーティング済みの OpenClaw 回答を発話します。Discord が最初の回答をまだ再生している間に複数の強制 consult 回答が完了した場合、後続の exact-speech 回答は文の途中で発話を置き換えるのではなく、再生がアイドルになるまでキューに入れられます。
- `stt-tts` モードでは、STT は `tools.media.audio` を使用します。`voice.model` は文字起こしに影響しません。
- リアルタイムモードでは、`voice.realtime.provider`、`voice.realtime.model`、`voice.realtime.speakerVoice` がリアルタイム音声セッションを設定します。OpenAI Realtime 2 と Codex の頭脳を使う場合は、`voice.realtime.model: "gpt-realtime-2"` と `voice.model: "openai/gpt-5.5"` を使用します。
- リアルタイム音声モードでは、デフォルトで小さな `IDENTITY.md`、`USER.md`、`SOUL.md` プロファイルファイルがリアルタイムプロバイダー指示に含まれるため、高速な直接ターンでも、ルーティング済み OpenClaw エージェントと同じアイデンティティ、ユーザーの根拠付け、ペルソナが維持されます。これをカスタマイズするには `voice.realtime.bootstrapContextFiles` をサブセットに設定し、無効化するには `[]` を設定します。サポートされるのはこれらのプロファイルファイルのみです。`AGENTS.md` は通常のエージェントコンテキストに残ります。注入されたプロファイルコンテキストは、ワークスペース作業、現在の事実、メモリ検索、ツールに裏付けられたアクションにおいて `openclaw_agent_consult` を置き換えるものではありません。
- OpenAI `agent-proxy` リアルタイムモードでは、`voice.realtime.requireWakeName: true` を設定すると、文字起こしがウェイク名で始まるか終わるまで Discord リアルタイム音声を無音のままにできます。設定するウェイク名は 1 語または 2 語でなければなりません。`voice.realtime.wakeNames` が未設定の場合、OpenClaw はルーティング済みエージェントの `name` と `OpenClaw` を使用し、フォールバックとしてエージェント ID と `OpenClaw` を使用します。ウェイク名ゲーティングは、リアルタイムプロバイダーの自動応答を無効化し、受け入れたターンを OpenClaw エージェント consult パス経由でルーティングし、最終文字起こしが届く前に部分文字起こしから先頭のウェイク名が認識された場合に短い音声確認を返します。
- OpenAI リアルタイムプロバイダーは、現在の Realtime 2 イベント名と、出力音声および文字起こしイベント向けの従来の Codex 互換エイリアスを受け入れるため、互換プロバイダースナップショットが変化してもアシスタント音声を落としません。
- `voice.realtime.bargeIn` は、Discord の話者開始イベントがアクティブなリアルタイム再生に割り込むかどうかを制御します。未設定の場合、リアルタイムプロバイダーの入力音声割り込み設定に従います。
- `voice.realtime.minBargeInAudioEndMs` は、OpenAI リアルタイム barge-in が音声を切り詰める前の最小アシスタント再生時間を制御します。デフォルト: `250`。エコーの少ない部屋では即時割り込みのために `0` を設定し、エコーの多いスピーカー構成では値を上げます。
- `voice.tts` は `stt-tts` 音声再生の場合のみ `messages.tts` を上書きします。リアルタイムモードでは代わりに `voice.realtime.speakerVoice` を使用します。Discord 再生で OpenAI 音声を使うには、`voice.tts.provider: "openai"` を設定し、`voice.tts.providers.openai.speakerVoice` 配下で Text-to-speech 音声を選択します。現在の OpenAI TTS モデルでは、`cedar` は男性的に聞こえる選択肢として適しています。
- チャンネルごとの Discord `systemPrompt` 上書きは、その音声チャンネルの音声文字起こしターンに適用されます。
- 音声文字起こしターンは、オーナー制限付きコマンドとチャンネルアクションのために、Discord `allowFrom`（または `dm.allowFrom`）からオーナーステータスを導出します。エージェントツールの可視性は、ルーティング済みセッションに設定されたツールポリシーに従います。
- `voice.autoJoin` に同じギルドのエントリが複数ある場合、OpenClaw はそのギルドで最後に設定されたチャンネルに参加します。
- `voice.allowedChannels` は任意の常駐許可リストです。未設定のままにすると、認可済みの任意の Discord 音声チャンネルへの `/vc join` を許可します。設定した場合、`/vc join`、起動時の自動参加、ボットの音声状態移動は、一覧の `{ guildId, channelId }` エントリに制限されます。空配列に設定すると、すべての Discord 音声参加を拒否します。Discord がボットを許可リスト外へ移動した場合、OpenClaw はそのチャンネルから退出し、利用可能なら設定済みの自動参加ターゲットに再参加します。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` の参加オプションへそのまま渡されます。アップストリームのデフォルトは `daveEncryption=true` と `decryptionFailureTolerance=24` です。
- OpenClaw は、Discord 音声受信とリアルタイム raw PCM 再生に、同梱の `libopus-wasm` コーデックを使用します。これは固定された libopus WebAssembly ビルドを同梱しており、ネイティブ opus アドオンを必要としません。
- `voice.connectTimeoutMs` は、`/vc join` と自動参加試行における最初の `@discordjs/voice` Ready 待機を制御します。デフォルト: `30000`。
- `voice.reconnectGraceMs` は、切断された音声セッションが再接続を開始するまで OpenClaw が待つ時間を制御します。デフォルト: `15000`。
- `stt-tts` モードでは、別のユーザーが話し始めただけでは音声再生は停止しません。フィードバックループを避けるため、OpenClaw は TTS の再生中に新しい音声キャプチャを無視します。次のターンでは再生完了後に話してください。リアルタイムモードでは、話者開始を barge-in シグナルとしてリアルタイムプロバイダーに転送します。
- リアルタイムモードでは、スピーカーから開いたマイクに入るエコーが barge-in のように見え、再生を中断することがあります。エコーの多い Discord ルームでは、`voice.realtime.providers.openai.interruptResponseOnInputAudio: false` を設定して、OpenAI が入力音声で自動割り込みしないようにします。Discord の話者開始イベントでアクティブ再生を割り込みたい場合は、さらに `voice.realtime.bargeIn: true` を追加します。OpenAI リアルタイムブリッジは、`voice.realtime.minBargeInAudioEndMs` より短い再生切り詰めをエコー/ノイズの可能性が高いものとして無視し、Discord 再生をクリアする代わりにスキップとしてログに記録します。
- `voice.captureSilenceGraceMs` は、Discord が話者停止を報告した後、OpenClaw が STT 用にその音声セグメントを確定するまで待つ時間を制御します。デフォルト: `2000`。Discord が通常の間を途切れ途切れの部分文字起こしに分割する場合は値を上げます。
- ElevenLabs が選択された TTS プロバイダーの場合、Discord 音声再生はストリーミング TTS を使用し、プロバイダー応答ストリームから開始します。ストリーミング非対応のプロバイダーは、合成済み一時ファイルのパスにフォールバックします。
- OpenClaw は受信復号失敗を監視し、短い時間枠で失敗が繰り返された場合に音声チャンネルを退出/再参加して自動復旧します。
- 更新後に受信ログで `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合は、依存関係レポートとログを収集してください。同梱の `@discordjs/voice` 系統には、discord.js PR #11449 のアップストリーム padding 修正が含まれており、これは discord.js issue #11419 をクローズしたものです。
- `The operation was aborted` 受信イベントは、OpenClaw がキャプチャ済み話者セグメントを確定するときに想定されるものです。これは詳細診断であり、警告ではありません。
- 詳細な Discord 音声ログには、受け入れた各話者セグメントについて、境界付きの 1 行 STT 文字起こしプレビューが含まれるため、デバッグ時に無制限の文字起こしテキストを出力することなく、ユーザー側とエージェント返信側の両方を確認できます。
- `agent-proxy` モードでは、強制 consult フォールバックは、`...` で終わるテキストや "and" のような末尾の接続語など、未完了の可能性が高い文字起こし断片に加えて、"be right back" や "bye" のような明らかにアクション不能な締めの言葉をスキップします。これにより古いキュー済み回答が防止された場合、ログには `forced agent consult skipped reason=...` と表示されます。

### 音声でユーザーをフォローする

Discord 音声ボットを、起動時に固定チャンネルへ参加させたり `/vc join` を待ったりする代わりに、1 人以上の既知の Discord ユーザーと同じ場所に留まらせたい場合は、`voice.followUsers` を使用します。

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

- `followUsers` は raw Discord ユーザー ID と `discord:<id>` 値を受け入れます。OpenClaw は音声状態イベントとの照合前に両方の形式を正規化します。
- `followUsers` が設定されている場合、`followUsersEnabled` はデフォルトで `true` になります。保存済みリストを維持しつつ自動音声フォローを停止するには、`false` に設定します。
- フォロー対象ユーザーが許可された音声チャンネルに参加すると、OpenClaw はそのチャンネルに参加します。ユーザーが移動すると、OpenClaw も一緒に移動します。アクティブなフォロー対象ユーザーが切断すると、OpenClaw は退出します。
- 同じギルドに複数のフォロー対象ユーザーがいて、アクティブなフォロー対象ユーザーが退出した場合、OpenClaw はギルドを退出する前に、追跡中の別のフォロー対象ユーザーのチャンネルへ移動します。複数のフォロー対象ユーザーが同時に移動した場合は、最後に観測された音声状態イベントが優先されます。
- `allowedChannels` は引き続き適用されます。許可されていないチャンネル内のフォロー対象ユーザーは無視され、フォロー所有セッションは別のフォロー対象ユーザーへ移動するか退出します。
- OpenClaw は起動時と境界付きの間隔で、見逃した音声状態イベントを照合します。照合は設定済みギルドをサンプリングし、1 回あたりの REST ルックアップ数に上限を設けるため、非常に大きな `followUsers` リストは収束に複数の間隔が必要になる場合があります。
- ユーザーをフォロー中に Discord または管理者がボットを移動した場合、OpenClaw は音声セッションを再構築し、移動先が許可されている場合はフォロー所有権を保持します。ボットが `allowedChannels` の外へ移動された場合、OpenClaw は退出し、存在する場合は設定済みターゲットに再参加します。
- DAVE 受信復旧は、復号失敗が繰り返された後に同じチャンネルを退出して再参加する場合があります。フォロー所有セッションはその復旧パスでもフォロー所有権を維持するため、その後フォロー対象ユーザーが切断した場合もチャンネルを退出します。

参加モードの選び方:

- 自分が音声にいるときにボットも自動的に音声にいるべき個人用またはオペレーター用の構成では、`followUsers` を使用します。
- 追跡対象ユーザーが音声にいない場合でも存在すべき固定ルームボットには、`autoJoin` を使用します。
- 1 回限りの参加や、自動的な音声参加が意外に感じられるルームでは、`/vc join` を使用します。

Discord 音声コーデック:

- 音声受信ログには `discord voice: opus decoder: libopus-wasm` と表示されます。
- リアルタイム再生では、raw 48 kHz ステレオ PCM を、同じ同梱 `libopus-wasm` パッケージで Opus にエンコードしてから、パケットを `@discordjs/voice` に渡します。
- ファイル再生とプロバイダーストリーム再生では、ffmpeg で raw 48 kHz ステレオ PCM にトランスコードし、その後 Discord に送信する Opus パケットストリームに `libopus-wasm` を使用します。

STT と TTS のパイプライン:

- Discord PCM キャプチャは WAV 一時ファイルに変換されます。
- `tools.media.audio` は STT を処理します。例: `openai/gpt-4o-mini-transcribe`。
- トランスクリプトは Discord の ingress とルーティングを通じて送信され、応答 LLM は、agent の `tts` ツールを隠して返却テキストを求める音声出力ポリシーで実行されます。最終的な TTS 再生は Discord voice が担うためです。
- `voice.model` が設定されている場合、この音声チャネルターンの応答 LLM のみを上書きします。
- `voice.tts` は `messages.tts` にマージされます。ストリーミング対応プロバイダーはプレイヤーへ直接供給し、それ以外の場合は生成された音声ファイルが参加中のチャネルで再生されます。

デフォルトの agent-proxy 音声チャネルセッション例:

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

`voice.agentSession` ブロックがない場合、各音声チャネルは独自にルーティングされた OpenClaw セッションを取得します。たとえば、`/vc join channel:234567890123456789` はその Discord 音声チャネルのセッションと会話します。リアルタイムモデルは音声フロントエンドにすぎません。実質的なリクエストは設定済みの OpenClaw agent に渡されます。リアルタイムモデルが consult ツールを呼び出さずに最終トランスクリプトを生成した場合でも、OpenClaw はフォールバックとして consult を強制するため、デフォルトでも agent と会話しているように動作します。

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

既存の Discord チャネルセッションの拡張としての音声:

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

`agent-proxy` モードでは、bot は設定された音声チャネルに参加しますが、OpenClaw agent のターンは対象チャネルの通常のルーティング済みセッションと agent を使用します。リアルタイム音声セッションは、返された結果を音声チャネルへ話して返します。supervisor agent は引き続き、ツールポリシーに従って通常のメッセージツールを使用できます。適切なアクションであれば、別の Discord メッセージを送信することも含まれます。

委任された OpenClaw run がアクティブな間、新しい Discord 音声トランスクリプトは、別の agent ターンを開始する前にライブ run 制御として扱われます。「status」、「cancel that」、「use the smaller fix」、「when you're done also check tests」などのフレーズは、アクティブなセッションに対するステータス、キャンセル、方針変更、またはフォローアップ入力として分類されます。ステータス、キャンセル、受け付けられた方針変更、フォローアップの結果は音声チャネルへ話して返されるため、呼び出し元は OpenClaw がリクエストを処理したかどうかを把握できます。

有用なターゲット形式:

- `target: "channel:123456789012345678"` は Discord テキストチャネルセッション経由でルーティングします。
- `target: "123456789012345678"` はチャネルターゲットとして扱われます。
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

モデルが開いたマイク経由で自分自身の Discord 再生音を聞いてしまうが、それでも発話で割り込みたい場合に使用します。OpenClaw は OpenAI が生の入力音声で自動割り込みしないようにしつつ、`bargeIn: true` により、次のキャプチャターンが OpenAI に届く前に、Discord の話者開始イベントとすでにアクティブな話者音声でアクティブなリアルタイム応答をキャンセルできます。`audioEndMs` が `minBargeInAudioEndMs` 未満の非常に早い barge-in シグナルは、エコーやノイズの可能性が高いものとして扱われ無視されるため、モデルが最初の再生フレームで途切れることはありません。

想定される音声ログ:

- 参加時: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- リアルタイム開始時: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 話者音声時: `discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`、および `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 古い発話のスキップ時: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` または `reason=non-actionable-closing ...`
- リアルタイム応答完了時: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 再生停止/リセット時: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- リアルタイム consult 時: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- agent の回答時: `discord voice: agent turn answer ...`
- 完全一致発話のキュー投入時: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`、続いて `discord voice: realtime exact speech dequeued reason=player-idle ...`
- barge-in 検出時: `discord voice: realtime barge-in detected source=speaker-start ...` または `discord voice: realtime barge-in detected source=active-speaker-audio ...`、続いて `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- リアルタイム割り込み時: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`、続いて `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` または `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 無視されたエコー/ノイズ時: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 無効化された barge-in 時: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- アイドル再生時: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

途切れる音声をデバッグするには、リアルタイム音声ログをタイムラインとして読みます。

1. `realtime audio playback started` は Discord がアシスタント音声の再生を開始したことを意味します。bridge はこの時点から、アシスタント出力チャンク、Discord PCM バイト、プロバイダーのリアルタイムバイト、および合成音声の長さのカウントを開始します。
2. `realtime speaker turn opened` は Discord 話者がアクティブになったことを示します。再生がすでにアクティブで `bargeIn` が有効な場合、これに続いて `barge-in detected source=speaker-start` が出ることがあります。
3. `realtime input audio started` は、その話者ターンで受信した最初の実際の音声フレームを示します。ここで `outputActive=true` またはゼロでない `outputAudioMs` がある場合、アシスタント再生がまだアクティブな間にマイクが入力を送信していることを意味します。
4. `barge-in detected source=active-speaker-audio` は、アシスタント再生がアクティブな間に OpenClaw がライブ話者音声を確認したことを意味します。これは、実際の割り込みと、有用な音声を伴わない Discord の話者開始イベントを区別するのに役立ちます。
5. `barge-in requested reason=...` は、OpenClaw がリアルタイムプロバイダーにアクティブな応答のキャンセルまたは切り詰めを依頼したことを意味します。`outputAudioMs`、`outputActive`、`playbackChunks` が含まれるため、割り込み前に実際に再生されたアシスタント音声の量を確認できます。
6. `realtime audio playback stopped reason=...` はローカル Discord 再生のリセット地点です。理由は誰が再生を停止したかを示します: `barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close`、または `session-close`。
7. `realtime speaker turn closed` はキャプチャされた入力ターンを要約します。`chunks=0` または `hasAudio=false` は、話者ターンは開いたものの使用可能な音声がリアルタイム bridge に到達しなかったことを意味します。`interruptedPlayback=true` は、その入力ターンがアシスタント出力と重なり、barge-in ロジックをトリガーしたことを意味します。

有用なフィールド:

- `outputAudioMs`: ログ行の前にリアルタイムプロバイダーが生成したアシスタント音声の長さ。
- `audioMs`: 再生停止前に OpenClaw がカウントしたアシスタント音声の長さ。
- `elapsedMs`: 再生ストリームまたは話者ターンを開いてから閉じるまでの実時間。
- `discordBytes`: Discord voice に送信、または Discord voice から受信した 48 kHz ステレオ PCM バイト。
- `realtimeBytes`: リアルタイムプロバイダーに送信、またはリアルタイムプロバイダーから受信したプロバイダー形式の PCM バイト。
- `playbackChunks`: アクティブな応答のために Discord へ転送されたアシスタント音声チャンク。
- `sinceLastAudioMs`: 最後にキャプチャされた話者音声フレームから話者ターン終了までの間隔。

一般的なパターン:

- `source=active-speaker-audio`、小さい `outputAudioMs`、同じユーザーが近くにある即時の途切れは、通常、スピーカーのエコーがマイクに入っていることを示します。`voice.realtime.minBargeInAudioEndMs` を上げる、スピーカー音量を下げる、ヘッドホンを使う、または `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` を設定してください。
- `source=speaker-start` に続いて `speaker turn closed ... hasAudio=false` がある場合、Discord は話者開始を報告したものの、音声が OpenClaw に到達しなかったことを意味します。これは一時的な Discord voice イベント、ノイズゲート動作、またはクライアントが一瞬マイクを有効にしたことが原因の場合があります。
- 近くに barge-in や `provider-clear-audio` がないのに `audio playback stopped reason=stream-close` がある場合、ローカル Discord 再生ストリームが予期せず終了したことを意味します。直前のプロバイダーおよび Discord プレイヤーログを確認してください。
- `capture ignored during playback (barge-in disabled)` は、アシスタント音声がアクティブな間、OpenClaw が意図的に入力を破棄したことを意味します。発話で再生を割り込みたい場合は `voice.realtime.bargeIn` を有効にしてください。
- `barge-in ignored ... outputActive=false` は、Discord またはプロバイダー VAD が発話を報告したものの、OpenClaw に割り込む対象のアクティブな再生がなかったことを意味します。これで音声が途切れることはありません。

認証情報はコンポーネントごとに解決されます: `voice.model` には LLM ルート認証、`tools.media.audio` には STT 認証、`messages.tts`/`voice.tts` には TTS 認証、`voice.realtime.providers` またはプロバイダーの通常の認証設定にはリアルタイムプロバイダー認証が使われます。

### 音声メッセージ

Discord 音声メッセージは波形プレビューを表示し、OGG/Opus 音声が必要です。OpenClaw は波形を自動生成しますが、検査と変換のために gateway ホスト上の `ffmpeg` と `ffprobe` が必要です。

- **ローカルファイルパス**を指定します (URL は拒否されます)。
- テキスト内容は省略します (Discord は同じペイロード内のテキスト + 音声メッセージを拒否します)。
- どの音声形式でも受け付けます。OpenClaw は必要に応じて OGG/Opus に変換します。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていない intent を使用した、または bot が guild メッセージを認識しない">

    - Message Content Intent を有効にする
    - ユーザー/メンバー解決に依存する場合は Server Members Intent を有効にする
    - intent を変更した後は gateway を再起動する

  </Accordion>

  <Accordion title="Guild メッセージが予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` の下にある guild 許可リストを確認する
    - guild の `channels` マップが存在する場合、一覧にあるチャンネルのみ許可される
    - `requireMention` の動作とメンションパターンを確認する

    有用な確認:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention が false なのにまだブロックされる">
    一般的な原因:

    - 一致する guild/channel 許可リストがない `groupPolicy="allowlist"`
    - `requireMention` が誤った場所に設定されている（`channels.discord.guilds` または channel エントリの下に置く必要がある）
    - 送信者が guild/channel の `users` 許可リストによってブロックされている

  </Accordion>

  <Accordion title="長時間実行される Discord ターンまたは重複返信">

    典型的なログ:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway キューの調整項目:

    - single-account: `channels.discord.eventQueue.listenerTimeout`
    - multi-account: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - これは Discord gateway リスナー作業のみを制御し、agent ターンの有効期間は制御しない

    Discord はキューに入った agent ターンに channel 所有の timeout を適用しない。Message listener は即座に引き渡し、キューに入った Discord 実行は、session/tool/runtime ライフサイクルが完了するか作業を中止するまで、セッションごとの順序を保持する。

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

  <Accordion title="Gateway metadata lookup timeout 警告">
    OpenClaw は接続前に Discord `/gateway/bot` metadata を取得する。一時的な失敗では Discord のデフォルト gateway URL にフォールバックし、ログではレート制限される。

    metadata timeout の調整項目:

    - single-account: `channels.discord.gatewayInfoTimeoutMs`
    - multi-account: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - config が未設定の場合の env fallback: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - default: `30000`（30 秒）、max: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout による再起動">
    OpenClaw は起動時と runtime 再接続後に Discord の gateway `READY` event を待機する。startup staggering を使用する multi-account セットアップでは、デフォルトより長い startup READY window が必要になる場合がある。

    READY timeout の調整項目:

    - startup single-account: `channels.discord.gatewayReadyTimeoutMs`
    - startup multi-account: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - config が未設定の場合の startup env fallback: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - startup default: `15000`（15 秒）、max: `120000`
    - runtime single-account: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multi-account: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - config が未設定の場合の runtime env fallback: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtime default: `30000`（30 秒）、max: `120000`

  </Accordion>

  <Accordion title="Permissions audit の不一致">
    `channels status --probe` の permission check は数値 channel ID に対してのみ機能する。

    slug キーを使用している場合、runtime matching は引き続き機能する可能性があるが、probe は権限を完全には検証できない。

  </Accordion>

  <Accordion title="DM と pairing の問題">

    - DM disabled: `channels.discord.dm.enabled=false`
    - DM policy disabled: `channels.discord.dmPolicy="disabled"`（legacy: `channels.discord.dm.policy`）
    - `pairing` mode で pairing approval を待機中

  </Accordion>

  <Accordion title="Bot to bot loops">
    デフォルトでは bot-authored message は無視される。

    `channels.discord.allowBots=true` を設定した場合は、loop behavior を避けるために厳格な mention と allowlist ルールを使用する。
    bot にメンションする bot message のみを受け付けるには、`channels.discord.allowBots="mentions"` を推奨する。

    OpenClaw には共有の [bot loop protection](/ja-JP/channels/bot-loop-protection) も同梱されている。`allowBots` により bot-authored message が dispatch に到達できる場合、Discord は inbound event を `(account, channel, bot pair)` facts にマップし、generic pair guard は設定された event budget を超えた後にその pair を抑制する。この guard は、以前は Discord rate limit で停止する必要があった runaway two-bot loop を防ぐ。single-bot deployment や、budget 内に収まる one-shot bot reply には影響しない。

    デフォルト設定（`allowBots` が設定されている場合に有効）:

    - `maxEventsPerWindow: 20` -- bot pair は sliding window 内で 20 messages を交換できる
    - `windowSeconds: 60` -- sliding window length
    - `cooldownSeconds: 60` -- budget が発動すると、どちらの方向の追加 bot-to-bot message も 1 分間破棄される

    共有デフォルトを `channels.defaults.botLoopProtection` の下で一度設定し、正当な workflow でさらに余裕が必要な場合は Discord を override する。優先順位は次のとおり:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - built-in defaults

    Discord は generic `maxEventsPerWindow`、`windowSeconds`、`cooldownSeconds` keys を使用する。

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

  <Accordion title="Voice STT が DecryptionFailed(...) でドロップする">

    - Discord voice receive recovery logic が存在するように、OpenClaw を最新に保つ（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（default）を確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（upstream default）から開始し、必要な場合のみ調整する
    - 次のログを監視する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - automatic rejoin 後も失敗が続く場合は、ログを収集し、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) の upstream DAVE receive history と比較する

  </Accordion>
</AccordionGroup>

## Configuration reference

Primary reference: [Configuration reference - Discord](/ja-JP/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- startup/auth: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`（global）, `configWrites`, `slashCommand.ephemeral`
- event queue: `eventQueue.listenerTimeout`（listener budget、default `120000`）, `eventQueue.maxQueueSize`（default `10000`）, `eventQueue.maxConcurrency`（default `50`）
- gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`（default `2000`）, `maxLinesPerMessage`（default `17`）
- streaming: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*`（legacy flat `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` keys は `openclaw doctor --fix` によって `streaming.*` に移行される）
- media/retry: `mediaMaxMb`（outbound Discord upload の上限、default `100`）, `retry`
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- UI: `ui.components.accentColor`
- features: `threadBindings`, top-level `bindings[]`（`type: "acp"`）, `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## 安全性と運用

- bot token は secret として扱う（supervised environment では `DISCORD_BOT_TOKEN` を推奨）。
- least-privilege Discord permissions を付与する。
- command deploy/state が stale の場合、gateway を再起動し、`openclaw channels status --probe` で再確認する。

## 関連

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    Discord user を gateway に pair する。
  </Card>
  <Card title="Groups" icon="users" href="/ja-JP/channels/groups">
    Group chat と allowlist behavior。
  </Card>
  <Card title="Channel routing" icon="route" href="/ja-JP/channels/channel-routing">
    inbound message を agent に route する。
  </Card>
  <Card title="Security" icon="shield" href="/ja-JP/gateway/security">
    Threat model と hardening。
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    guild と channel を agent にマップする。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ja-JP/tools/slash-commands">
    Native command behavior。
  </Card>
</CardGroup>
