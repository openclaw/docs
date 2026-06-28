---
read_when:
    - Discord チャンネル機能に取り組む
summary: Discord bot のサポート状況、機能、設定
title: Discord
x-i18n:
    generated_at: "2026-06-28T20:41:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91bda14cfdd7bf5045413d97c56936ea7150b396e0e7ecd4ac300e1a811377cb
    source_path: channels/discord.md
    workflow: 16
---

Discord 公式 Gateway 経由の DM とギルドチャンネルに対応しています。

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

bot を含む新しいアプリケーションを作成し、その bot をサーバーに追加して、OpenClaw とペアリングする必要があります。bot は自分のプライベートサーバーに追加することをおすすめします。まだサーバーがない場合は、[先に作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends** を選択）。

<Steps>
  <Step title="Discord アプリケーションと bot を作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) に移動し、**New Application** をクリックします。名前は "OpenClaw" のようなものにします。

    サイドバーで **Bot** をクリックします。**Username** には OpenClaw エージェントに付けたい名前を設定します。

  </Step>

  <Step title="特権インテントを有効にする">
    引き続き **Bot** ページで、**Privileged Gateway Intents** まで下にスクロールして、次を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロール許可リストと名前から ID への照合に必要）
    - **Presence Intent**（任意。プレゼンス更新が必要な場合のみ）

  </Step>

  <Step title="bot トークンをコピーする">
    **Bot** ページの上部に戻り、**Reset Token** をクリックします。

    <Note>
    名前に反して、これは最初のトークンを生成します。「リセット」されるものはありません。
    </Note>

    トークンをコピーしてどこかに保存します。これが **Bot Token** で、この後すぐに必要になります。

  </Step>

  <Step title="招待 URL を生成し、bot をサーバーに追加する">
    サイドバーで **OAuth2** をクリックします。bot をサーバーに追加するための適切な権限を持つ招待 URL を生成します。

    **OAuth2 URL Generator** まで下にスクロールし、次を有効にします。

    - `bot`
    - `applications.commands`

    下に **Bot Permissions** セクションが表示されます。少なくとも次を有効にします。

    **一般権限**
      - チャンネルを表示
    **テキスト権限**
      - メッセージを送信
      - メッセージ履歴を読む
      - リンクを埋め込む
      - ファイルを添付
      - リアクションを追加（任意）

    これは通常のテキストチャンネル向けの基本セットです。フォーラムやメディアチャンネルのワークフローでスレッドを作成または継続する場合を含め、Discord スレッドに投稿する予定がある場合は、**Send Messages in Threads** も有効にします。
    下部に生成された URL をコピーしてブラウザに貼り付け、サーバーを選択して **Continue** をクリックして接続します。これで Discord サーバーに bot が表示されるはずです。

  </Step>

  <Step title="開発者モードを有効にして ID を収集する">
    Discord アプリに戻り、内部 ID をコピーできるように開発者モードを有効にする必要があります。

    1. **User Settings**（アバターの横の歯車アイコン）をクリック → サイドバーの **Developer** までスクロール → **Developer Mode** をオンにする

        *（注: Discord モバイルアプリでは、開発者モードは **App Settings** → **Advanced** の下にあります）*

    2. サイドバーの **サーバーアイコン** を右クリック → **Copy Server ID**
    3. **自分のアバター** を右クリック → **Copy User ID**

    **Server ID** と **User ID** を Bot Token と一緒に保存します。次のステップで 3 つすべてを OpenClaw に送ります。

  </Step>

  <Step title="サーバーメンバーからの DM を許可する">
    ペアリングを機能させるには、Discord で bot があなたに DM できるようにする必要があります。**サーバーアイコン** を右クリック → **Privacy Settings** → **Direct Messages** をオンにします。

    これにより、サーバーメンバー（bot を含む）があなたに DM を送信できます。OpenClaw で Discord DM を使いたい場合は、この設定を有効のままにしてください。ギルドチャンネルのみを使う予定なら、ペアリング後に DM を無効にできます。

  </Step>

  <Step title="bot トークンを安全に設定する（チャットでは送信しない）">
    Discord bot トークンは秘密情報（パスワードのようなもの）です。エージェントにメッセージを送る前に、OpenClaw を実行しているマシンで設定します。

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

    OpenClaw がすでにバックグラウンドサービスとして実行中の場合は、OpenClaw Mac アプリから、または `openclaw gateway run` プロセスを停止して再起動することで再起動します。
    マネージドサービスのインストールでは、`DISCORD_BOT_TOKEN` が存在するシェルから `openclaw gateway install` を実行するか、変数を `~/.openclaw/.env` に保存して、再起動後にサービスが env SecretRef を解決できるようにします。
    ホストが Discord の起動時アプリケーション検索でブロックまたはレート制限される場合は、Developer Portal から Discord アプリケーション/クライアント ID を設定し、起動時にその REST 呼び出しをスキップできるようにします。デフォルトアカウントには `channels.discord.applicationId` を使い、複数の Discord bot を実行する場合は `channels.discord.accounts.<accountId>.applicationId` を使います。

  </Step>

  <Step title="OpenClaw を設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼">
        既存の任意のチャンネル（例: Telegram）で OpenClaw エージェントとチャットして伝えます。Discord が最初のチャンネルの場合は、代わりに CLI / 設定タブを使います。

        > "Discord bot トークンはすでに設定に入れました。User ID `<user_id>` と Server ID `<server_id>` で Discord セットアップを完了してください。"
      </Tab>
      <Tab title="CLI / 設定">
        ファイルベースの設定を使いたい場合は、次を設定します。

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

        デフォルトアカウント向けの環境変数フォールバック:

```bash
DISCORD_BOT_TOKEN=...
```

        スクリプト化されたセットアップやリモートセットアップでは、同じ JSON5 ブロックを `openclaw config patch --file ./discord.patch.json5 --dry-run` で書き込み、その後 `--dry-run` なしで再実行します。平文の `token` 値がサポートされています。SecretRef 値も、env/file/exec プロバイダー全体で `channels.discord.token` に対応しています。[Secrets Management](/ja-JP/gateway/secrets) を参照してください。

        複数の Discord bot では、各 bot トークンとアプリケーション ID をそのアカウントの下に保持します。トップレベルの `channels.discord.applicationId` はアカウントに継承されるため、すべてのアカウントで同じアプリケーション ID を使う場合にのみ、そこで設定してください。

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
    Gateway が実行されるまで待ってから、Discord で bot に DM します。bot はペアリングコードを返信します。

    <Tabs>
      <Tab title="エージェントに依頼">
        既存のチャンネルでペアリングコードをエージェントに送信します。

        > "この Discord ペアリングコードを承認してください: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    ペアリングコードは 1 時間後に期限切れになります。

    これで、Discord の DM 経由でエージェントとチャットできるはずです。

  </Step>
</Steps>

<Note>
トークン解決はアカウントを認識します。設定のトークン値は環境変数フォールバックより優先されます。`DISCORD_BOT_TOKEN` はデフォルトアカウントにのみ使用されます。
有効な 2 つの Discord アカウントが同じ bot トークンに解決される場合、OpenClaw はそのトークンに対して 1 つの Gateway モニターのみを起動します。設定由来のトークンはデフォルトの環境変数フォールバックより優先されます。それ以外の場合は、最初の有効なアカウントが優先され、重複アカウントは無効として報告されます。
高度なアウトバウンド呼び出し（メッセージツール/チャンネルアクション）では、呼び出しごとの明示的な `token` がその呼び出しに使用されます。これは送信アクションと読み取り/プローブ系アクション（例: read/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシー/再試行設定は、引き続きアクティブなランタイムスナップショットで選択されたアカウントから取得されます。
</Note>

## 推奨: ギルドワークスペースを設定する

DM が動作したら、Discord サーバーをフルワークスペースとして設定できます。各チャンネルは、独自のコンテキストを持つ独自のエージェントセッションを取得します。これは、自分と bot だけがいるプライベートサーバーにおすすめです。

<Steps>
  <Step title="サーバーをギルド許可リストに追加する">
    これにより、DM だけでなく、サーバー上の任意のチャンネルでエージェントが応答できるようになります。

    <Tabs>
      <Tab title="エージェントに依頼">
        > "Discord Server ID `<server_id>` をギルド許可リストに追加してください"
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

  <Step title="@mention なしの応答を許可する">
    デフォルトでは、エージェントはギルドチャンネルで @mention された場合にのみ応答します。プライベートサーバーでは、すべてのメッセージに応答させたいことが多いでしょう。

    ギルドチャンネルでは、通常の返信はデフォルトで自動投稿されます。共有の常時オンの部屋では、エージェントが待機し、チャンネル返信が有用だと判断したときにのみ投稿できるように、`messages.groupChat.visibleReplies: "message_tool"` を選択します。これは GPT 5.5 のような最新世代のツール信頼性の高いモデルで最もよく機能します。アンビエントな部屋イベントは、ツールが送信しない限り静かなままです。完全な待機モード設定については、[アンビエントな部屋イベント](/ja-JP/channels/ambient-room-events) を参照してください。

    Discord で入力中表示が出ており、ログにトークン使用量が表示されるのにメッセージが投稿されない場合は、そのターンがアンビエントな部屋イベントとして設定されているか、メッセージツールによる可視返信を選択しているかを確認してください。

    <Tabs>
      <Tab title="エージェントに依頼">
        > "このサーバーで @mention されなくてもエージェントが応答できるようにしてください"
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

        表示されるグループ/チャンネル返信にメッセージツール送信を必須にするには、`messages.groupChat.visibleReplies: "message_tool"` を設定します。

      </Tab>
    </Tabs>

  </Step>

  <Step title="ギルドチャンネルのメモリを計画する">
    デフォルトでは、長期メモリ（MEMORY.md）は DM セッションでのみ読み込まれます。ギルドチャンネルでは MEMORY.md は自動読み込みされません。

    <Tabs>
      <Tab title="エージェントに依頼">
        > "Discord チャンネルで質問するとき、MEMORY.md から長期コンテキストが必要なら memory_search または memory_get を使ってください。"
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有コンテキストが必要な場合は、安定した指示を `AGENTS.md` または `USER.md` に入れます（これらはすべてのセッションに注入されます）。長期的なメモは `MEMORY.md` に保持し、必要に応じてメモリツールでアクセスします。
      </Tab>
    </Tabs>

  </Step>
</Steps>

次に、Discord サーバーにいくつかチャンネルを作成してチャットを始めます。エージェントはチャンネル名を確認でき、各チャンネルには独立したセッションが割り当てられます。そのため、`#coding`、`#home`、`#research` など、ワークフローに合うものを設定できます。

## ランタイムモデル

- Gateway が Discord 接続を所有します。
- 返信ルーティングは決定的です。Discord の受信返信は Discord に返されます。
- Discord のギルド/チャンネルメタデータは、ユーザーに表示される返信プレフィックスではなく、信頼されない
  コンテキストとしてモデルプロンプトに追加されます。モデルがそのエンベロープを
  コピーして返した場合、OpenClaw は送信返信と
  以後のリプレイコンテキストから、コピーされたメタデータを取り除きます。
- 既定では (`session.dmScope=main`)、ダイレクトチャットはエージェントのメインセッション (`agent:main:main`) を共有します。
- ギルドチャンネルは分離されたセッションキーです (`agent:<agentId>:discord:channel:<channelId>`)。
- グループ DM は既定で無視されます (`channels.discord.dm.groupEnabled=false`)。
- ネイティブのスラッシュコマンドは分離されたコマンドセッション (`agent:<agentId>:discord:slash:<userId>`) で実行されますが、ルーティング先の会話セッションへ `CommandTargetSessionKey` を引き続き保持します。
- Discord へのテキストのみの Cron/Heartbeat アナウンス配信では、最終的な
  アシスタントに見える回答を 1 回だけ使用します。メディアおよび構造化コンポーネントペイロードは、
  エージェントが複数の配信可能ペイロードを出力する場合、複数メッセージのままです。

## フォーラムチャンネル

Discord のフォーラムチャンネルとメディアチャンネルはスレッド投稿のみを受け付けます。OpenClaw は、それらを作成する 2 つの方法をサポートします。

- フォーラムの親 (`channel:<forumId>`) にメッセージを送信して、スレッドを自動作成します。スレッドタイトルには、メッセージの最初の空でない行が使用されます。
- `openclaw message thread create` を使用してスレッドを直接作成します。フォーラムチャンネルには `--message-id` を渡さないでください。

例: フォーラムの親に送信してスレッドを作成する

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

例: フォーラムスレッドを明示的に作成する

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

フォーラムの親は Discord コンポーネントを受け付けません。コンポーネントが必要な場合は、スレッド自体 (`channel:<threadId>`) に送信してください。

## インタラクティブコンポーネント

OpenClaw はエージェントメッセージ向けに Discord components v2 コンテナーをサポートします。`components` ペイロード付きで message ツールを使用します。インタラクション結果は通常の受信メッセージとしてエージェントにルーティングされ、既存の Discord `replyToMode` 設定に従います。

サポートされるブロック:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- アクション行では最大 5 個のボタン、または 1 つの選択メニューを使用できます
- 選択タイプ: `string`, `user`, `role`, `mentionable`, `channel`

既定では、コンポーネントは 1 回のみ使用できます。ボタン、選択、フォームを期限切れになるまで複数回使用できるようにするには、`components.reusable=true` を設定します。

ボタンをクリックできるユーザーを制限するには、そのボタンに `allowedUsers` を設定します (Discord ユーザー ID、タグ、または `*`)。設定されている場合、一致しないユーザーにはエフェメラルな拒否が返されます。

コンポーネントコールバックは既定で 30 分後に期限切れになります。既定の Discord アカウントのコールバックレジストリ存続期間を変更するには `channels.discord.agentComponents.ttlMs` を設定し、マルチアカウント設定で 1 つのアカウントを上書きするには `channels.discord.accounts.<accountId>.agentComponents.ttlMs` を設定します。値はミリ秒で、正の整数である必要があり、`86400000` (24 時間) が上限です。長い TTL は、ボタンを使用可能なままにする必要があるレビューや承認ワークフローに便利ですが、古い Discord メッセージが引き続きアクションをトリガーできる期間も延びます。ワークフローに合う最短の TTL を優先し、古いコールバックが意外に感じられる場合は既定値のままにしてください。

`/model` および `/models` スラッシュコマンドは、プロバイダー、モデル、互換性のあるランタイムのドロップダウンと送信ステップを備えたインタラクティブなモデルピッカーを開きます。`/models add` は非推奨になり、チャットからモデルを登録する代わりに非推奨メッセージを返します。ピッカーの返信はエフェメラルで、呼び出したユーザーだけが使用できます。Discord の選択メニューは 25 個のオプションに制限されているため、`openai` や `vllm` などの選択したプロバイダーについてのみ動的に検出されたモデルをピッカーに表示したい場合は、`agents.defaults.models` に `provider/*` エントリを追加してください。

ファイル添付:

- `file` ブロックは添付参照 (`attachment://<filename>`) を指している必要があります
- 添付は `media`/`path`/`filePath` (単一ファイル) で指定します。複数ファイルには `media-gallery` を使用します
- アップロード名を添付参照と一致させる必要がある場合は、`filename` を使用して上書きします

モーダルフォーム:

- 最大 5 個のフィールドを持つ `components.modal` を追加します
- フィールドタイプ: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
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

    - `pairing` (既定)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` に `"*"` を含める必要があります)
    - `disabled`

    DM ポリシーが open でない場合、不明なユーザーはブロックされます (または `pairing` モードではペアリングを求められます)。

    マルチアカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 1 つのアカウントでは、`allowFrom` が従来の `dm.allowFrom` より優先されます。
    - 名前付きアカウントは、自身の `allowFrom` と従来の `dm.allowFrom` が未設定の場合、`channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    従来の `channels.discord.dm.policy` と `channels.discord.dm.allowFrom` は互換性のために引き続き読み取られます。`openclaw doctor --fix` は、アクセスを変更せずに実行できる場合、それらを `dmPolicy` と `allowFrom` に移行します。

    配信用の DM ターゲット形式:

    - `user:<id>`
    - `<@id>` メンション

    bare numeric ID は通常、チャンネル既定値が有効な場合にチャンネル ID として解決されますが、アカウントの有効な DM `allowFrom` に列挙されている ID は、互換性のためにユーザー DM ターゲットとして扱われます。

  </Tab>

  <Tab title="Access groups">
    Discord DM とテキストコマンド認可では、`channels.discord.allowFrom` の動的な `accessGroup:<name>` エントリを使用できます。

    アクセスグループ名はメッセージチャンネル間で共有されます。メンバーが各チャンネルの通常の `allowFrom` 構文で表現される静的グループには `type: "message.senders"` を使用し、Discord チャンネルの現在の `ViewChannel` オーディエンスでメンバーシップを動的に定義する場合は `type: "discord.channelAudience"` を使用します。共有アクセスグループの動作はここに記載されています: [アクセスグループ](/ja-JP/channels/access-groups)。

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

    Discord テキストチャンネルには個別のメンバーリストがありません。`type: "discord.channelAudience"` はメンバーシップを次のようにモデル化します。DM 送信者は設定されたギルドのメンバーであり、ロールとチャンネルの上書きが適用された後、設定されたチャンネルに対する有効な `ViewChannel` 権限を現在持っています。

    例: 他の全員には DM を閉じたまま、`#maintainers` を閲覧できるすべての人に bot への DM を許可する。

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

    ルックアップは失敗時に閉じます。Discord が `Missing Access` を返す、メンバールックアップに失敗する、またはチャンネルが別のギルドに属している場合、DM 送信者は未認可として扱われます。

    チャンネルオーディエンスアクセスグループを使用する場合は、bot に対して Discord Developer Portal の **Server Members Intent** を有効にしてください。DM にはギルドメンバー状態が含まれないため、OpenClaw は認可時に Discord REST を通じてメンバーを解決します。

  </Tab>

  <Tab title="Guild policy">
    ギルド処理は `channels.discord.groupPolicy` によって制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合の安全なベースラインは `allowlist` です。

    `allowlist` の動作:

    - ギルドは `channels.discord.guilds` と一致する必要があります (`id` が推奨、スラッグも可)
    - 任意の送信者許可リスト: `users` (安定した ID を推奨) および `roles` (ロール ID のみ)。どちらかが設定されている場合、送信者は `users` または `roles` に一致すると許可されます
    - 直接の名前/タグ一致は既定で無効です。break-glass 互換モードとしてのみ `channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
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
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    `DISCORD_BOT_TOKEN` のみを設定し、`channels.discord` ブロックを作成しない場合、ランタイムフォールバックは `groupPolicy="allowlist"` (ログに警告あり) になります。これは `channels.defaults.groupPolicy` が `open` であっても同様です。

  </Tab>

  <Tab title="Mentions and group DMs">
    ギルドメッセージは既定でメンションゲートされます。

    メンション検出には次が含まれます。

    - 明示的な bot メンション
    - 設定されたメンションパターン (`agents.list[].groupChat.mentionPatterns`、フォールバック `messages.groupChat.mentionPatterns`)
    - サポートされるケースでの暗黙的な bot への返信動作

    送信 Discord メッセージを書く場合は、正規のメンション構文を使用します。ユーザーには `<@USER_ID>`、チャンネルには `<#CHANNEL_ID>`、ロールには `<@&ROLE_ID>` です。従来の `<@!USER_ID>` ニックネームメンション形式は使用しないでください。

    `requireMention` はギルド/チャンネル単位で設定されます (`channels.discord.guilds...`)。
    `ignoreOtherMentions` は、別のユーザー/ロールにはメンションしているが bot にはメンションしていないメッセージを任意でドロップします (@everyone/@here は除く)。

    グループ DM:

    - 既定: 無視されます (`dm.groupEnabled=false`)
    - 任意の許可リストは `dm.groupChannels` (チャンネル ID またはスラッグ) で指定します

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

`bindings[].match.roles` を使用して、Discord ギルドメンバーをロール ID によって別々のエージェントへルーティングします。ロールベースのバインディングはロール ID のみを受け付け、ピアまたは親ピアのバインディングの後、ギルドのみのバインディングの前に評価されます。バインディングが他の match フィールドも設定している場合（たとえば `peer` + `guildId` + `roles`）、設定されたすべてのフィールドが一致する必要があります。

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
- チャンネル単位の上書き: `channels.discord.commands.native`。
- `commands.native=false` にすると、起動中の Discord スラッシュコマンド登録とクリーンアップをスキップします。以前に登録されたコマンドは、Discord アプリから削除するまで Discord 上に表示され続ける場合があります。
- ネイティブコマンド認証は、通常のメッセージ処理と同じ Discord 許可リスト/ポリシーを使用します。
- 権限のないユーザーにも Discord UI ではコマンドが表示される場合があります。実行時には引き続き OpenClaw の認証が強制され、「権限がありません」が返されます。

コマンドカタログと動作については、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能の詳細

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord はエージェント出力内の返信タグをサポートします。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` で制御されます。

    - `off`（デフォルト）
    - `first`
    - `all`
    - `batched`

    注: `off` は暗黙的な返信スレッド化を無効にします。明示的な `[[reply_to_*]]` タグは引き続き尊重されます。
    `first` は、ターン内の最初の送信 Discord メッセージに暗黙的なネイティブ返信参照を常に付与します。
    `batched` は、受信イベントが複数メッセージのデバウンス済みバッチだった場合にのみ、
    Discord の暗黙的なネイティブ返信参照を付与します。これは、すべての
    単一メッセージのターンではなく、主に曖昧で短時間に集中するチャットに対してネイティブ返信を使いたい場合に便利です。

    メッセージ ID はコンテキスト/履歴に公開されるため、エージェントは特定のメッセージを対象にできます。

  </Accordion>

  <Accordion title="Link previews">
    Discord はデフォルトで URL のリッチリンク埋め込みを生成します。OpenClaw はデフォルトで送信 Discord メッセージ上のそれらの生成済み埋め込みを抑制するため、オプトインしない限り、エージェントが送信した URL はプレーンリンクのままになります。

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    1 つのアカウントを上書きするには `channels.discord.accounts.<id>.suppressEmbeds` を設定します。エージェントの message-tool 送信でも、単一メッセージに対して `suppressEmbeds: false` を渡せます。明示的な Discord `embeds` ペイロードは、デフォルトのリンクプレビュー設定では抑制されません。

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw は、一時メッセージを送信し、テキストが届くたびに編集することで、下書き返信をストリーミングできます。`channels.discord.streaming` は `off` | `partial` | `block` | `progress`（デフォルト）を取ります。`progress` は編集可能なステータス下書きを 1 つ保持し、最終配信までツール進行状況で更新します。共有の開始ラベルは流れる行なので、十分な作業が表示されると他の行と同じようにスクロールして消えていきます。`streamMode` はレガシーのランタイムエイリアスです。永続化された設定を正規キーへ書き換えるには `openclaw doctor --fix` を実行してください。

    Discord プレビュー編集を無効にするには、`channels.discord.streaming.mode` を `off` に設定します。Discord ブロックストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

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

    - `partial` はトークンが到着するたびに単一のプレビューメッセージを編集します。
    - `block` は下書きサイズのチャンクを出力します（サイズと区切り位置の調整には `draftChunk` を使用し、`textChunkLimit` にクランプされます）。
    - メディア、エラー、明示的な返信の最終結果は、保留中のプレビュー編集をキャンセルします。
    - `streaming.preview.toolProgress`（デフォルト `true`）は、ツール/進行状況の更新でプレビューメッセージを再利用するかどうかを制御します。
    - ツール/進行状況の行は、利用可能な場合、コンパクトな絵文字 + タイトル + 詳細として表示されます。たとえば `🛠️ Bash: run tests` や `🔎 Web Search: for "query"` です。
    - `streaming.progress.commentary`（デフォルト `false`）は、一時的な進行状況下書き内のアシスタントの commentary/前置きテキストを有効にします。commentary は表示前にクリーンアップされ、一時的なままで、最終回答の配信は変更しません。
    - `streaming.progress.maxLineChars` は、行ごとの進行状況プレビュー予算を制御します。文章は単語境界で短縮され、コマンドとパスの詳細は有用な接尾部を保持します。
    - `streaming.preview.commandText` / `streaming.progress.commandText` は、コンパクトな進行状況行のコマンド/exec 詳細を制御します: `raw`（デフォルト）または `status`（ツールラベルのみ）。

    コンパクトな進行状況行を維持しながら、生のコマンド/exec テキストを非表示にする:

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

    プレビューストリーミングはテキストのみです。メディア返信は通常の配信にフォールバックします。`block` ストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるためにプレビューストリームをスキップします。

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    ギルド履歴コンテキスト:

    - `channels.discord.historyLimit` のデフォルトは `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    DM 履歴制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    スレッド動作:

    - Discord スレッドはチャンネルセッションとしてルーティングされ、上書きされない限り親チャンネル設定を継承します。
    - スレッドセッションは、親チャンネルのセッションレベルの `/model` 選択をモデルのみのフォールバックとして継承します。スレッドローカルの `/model` 選択が引き続き優先され、トランスクリプト継承が有効でない限り親トランスクリプト履歴はコピーされません。
    - `channels.discord.thread.inheritParent`（デフォルト `false`）は、新しい自動スレッドを親トランスクリプトでシードするようにします。アカウント単位の上書きは `channels.discord.accounts.<id>.thread.inheritParent` 配下にあります。
    - Message-tool のリアクションは `user:<id>` DM ターゲットを解決できます。
    - `guilds.<guild>.channels.<channel>.requireMention: false` は、返信段階のアクティベーションフォールバック中に保持されます。

    チャンネルトピックは**信頼されていない**コンテキストとして注入されます。許可リストは誰がエージェントをトリガーできるかを制限するものであり、完全な補助コンテキストの墨消し境界ではありません。

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord はスレッドをセッションターゲットにバインドできるため、そのスレッド内の後続メッセージは同じセッション（サブエージェントセッションを含む）へルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在/新規スレッドをサブエージェント/セッションターゲットにバインドする
    - `/unfocus` 現在のスレッドバインディングを削除する
    - `/agents` アクティブな実行とバインディング状態を表示する
    - `/session idle <duration|off>` フォーカスされたバインディングの非アクティブ時自動 unfocus を確認/更新する
    - `/session max-age <duration|off>` フォーカスされたバインディングのハード最大期間を確認/更新する

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

    - `session.threadBindings.*` はグローバルデフォルトを設定します。
    - `channels.discord.threadBindings.*` は Discord の動作を上書きします。
    - `spawnSessions` は `sessions_spawn({ thread: true })` と ACP スレッド spawn に対するスレッドの自動作成/バインドを制御します。デフォルト: `true`。
    - `defaultSpawnContext` は、スレッドバインドされた spawn のネイティブサブエージェントコンテキストを制御します。デフォルト: `"fork"`。
    - 非推奨の `spawnSubagentSessions`/`spawnAcpSessions` キーは `openclaw doctor --fix` によって移行されます。
    - アカウントでスレッドバインディングが無効な場合、`/focus` と関連するスレッドバインディング操作は利用できません。

    [サブエージェント](/ja-JP/tools/subagents)、[ACP エージェント](/ja-JP/tools/acp-agents)、および[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    安定した「常時オン」の ACP ワークスペースでは、Discord 会話を対象にしたトップレベルの型付き ACP バインディングを設定します。

    設定パス:

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

    - `/acp spawn codex --bind here` は現在のチャンネルまたはスレッドをその場でバインドし、以後のメッセージを同じ ACP セッション上に維持します。スレッドメッセージは親チャンネルのバインディングを継承します。
    - バインドされたチャンネルまたはスレッドでは、`/new` と `/reset` は同じ ACP セッションをその場でリセットします。一時的なスレッドバインディングは、アクティブな間ターゲット解決を上書きできます。
    - `spawnSessions` は `--thread auto|here` 経由の子スレッド作成/バインディングを制御します。

    バインディング動作の詳細については、[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

  </Accordion>

  <Accordion title="Reaction notifications">
    ギルド単位のリアクション通知モード:

    - `off`
    - `own`（デフォルト）
    - `all`
    - `allowlist`（`guilds.<id>.users` を使用）

    リアクションイベントはシステムイベントに変換され、ルーティングされた Discord セッションに添付されます。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に確認応答の絵文字を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェント ID 絵文字フォールバック（`agents.list[].identity.emoji`、なければ "👀"）

    注:

    - Discord は Unicode 絵文字またはカスタム絵文字名を受け付けます。
    - チャンネルまたはアカウントでリアクションを無効にするには `""` を使用します。

  </Accordion>

  <Accordion title="Config writes">
    チャンネルから開始される設定書き込みはデフォルトで有効です。

    これは（コマンド機能が有効な場合の）`/config set|unset` フローに影響します。

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
    `channels.discord.proxy` を使用して、Discord Gateway WebSocket トラフィックと起動時の REST ルックアップ（アプリケーション ID + 許可リスト解決）を HTTP(S) プロキシ経由でルーティングします。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    アカウント単位の上書き:

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

  <Accordion title="PluralKit support">
    PluralKit 解決を有効にして、プロキシされたメッセージをシステムメンバー ID にマッピングします:

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

    - allowlist では `pk:<memberId>` を使用できます
    - メンバーの表示名は、`channels.discord.dangerouslyAllowNameMatching: true` の場合にのみ name/slug で照合されます
    - 検索では元のメッセージ ID が使用され、時間枠によって制限されます
    - 検索に失敗した場合、プロキシされたメッセージは bot メッセージとして扱われ、`allowBots=true` でない限り破棄されます

  </Accordion>

  <Accordion title="送信メンションエイリアス">
    既知の Discord ユーザーに対してエージェントが決定的な送信メンションを必要とする場合は、`mentionAliases` を使用します。キーは先頭の `@` を除いた handle です。値は Discord ユーザー ID です。不明な handle、`@everyone`、`@here`、および Markdown のコード span 内のメンションは変更されません。

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
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
    プレゼンス更新は、status または activity フィールドを設定した場合、または自動プレゼンスを有効にした場合に適用されます。

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

    activity の例（カスタム status がデフォルトの activity type です）:

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

    streaming の例:

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

    activity type の対応表:

    - 0: プレイ中
    - 1: 配信中（`activityUrl` が必要）
    - 2: 聴取中
    - 3: 視聴中
    - 4: カスタム（activity テキストを status state として使用します。emoji は任意です）
    - 5: 競技中

    自動プレゼンスの例（ランタイム健全性シグナル）:

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

    自動プレゼンスは、ランタイムの可用性を Discord status に対応付けます: healthy => online、degraded または unknown => idle、exhausted または unavailable => dnd。任意のテキスト上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（`{reason}` プレースホルダーをサポート）

  </Accordion>

  <Accordion title="Discord での承認">
    Discord は DM でのボタンベースの承認処理をサポートし、任意で元のチャンネルに承認プロンプトを投稿できます。

    設定パス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバックします）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    Discord は、`enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` から少なくとも 1 人の承認者を解決できる場合、native exec approval を自動で有効にします。Discord は、チャンネルの `allowFrom`、レガシーの `dm.allowFrom`、または direct-message の `defaultTo` から exec approver を推測しません。native approval client として Discord を明示的に無効にするには、`enabled: false` を設定します。

    `/diagnostics` や `/export-trajectory` など、機密性の高い owner-only のグループコマンドでは、OpenClaw は承認プロンプトと最終結果を非公開で送信します。呼び出した owner に Discord owner route がある場合、まず Discord DM を試します。利用できない場合は、Telegram など、`commands.ownerAllowFrom` から最初に利用可能な owner route にフォールバックします。

    `target` が `channel` または `both` の場合、承認プロンプトはチャンネルに表示されます。解決済みの承認者だけがボタンを使用できます。他のユーザーには ephemeral な拒否が返されます。承認プロンプトにはコマンドテキストが含まれるため、信頼できるチャンネルでのみチャンネル配信を有効にしてください。チャンネル ID をセッションキーから導出できない場合、OpenClaw は DM 配信にフォールバックします。

    Discord は、他のチャットチャンネルで使用される共有承認ボタンもレンダリングします。native Discord アダプターは主に、承認者への DM ルーティングとチャンネルへのファンアウトを追加します。
    これらのボタンが存在する場合、それらが主要な承認 UX です。OpenClaw は、
    ツール結果がチャット承認を利用できないと示す場合、または手動承認が唯一の経路である場合にのみ、
    手動の `/approve` コマンドを含めるべきです。
    Discord の native approval runtime がアクティブでない場合、OpenClaw は
    ローカルで決定的な `/approve <id> <decision>` プロンプトを表示し続けます。
    ランタイムがアクティブでも native card をどのターゲットにも配信できない場合、
    OpenClaw は保留中の承認から正確な `/approve` コマンドを含む同一チャットのフォールバック通知を送信します。

    Gateway 認証と承認解決は、共有 Gateway client contract に従います（`plugin:` ID は `plugin.approval.resolve` 経由で解決され、その他の ID は `exec.approval.resolve` 経由で解決されます）。承認はデフォルトで 30 分後に期限切れになります。

    [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

  </Accordion>
</AccordionGroup>

## ツールとアクションゲート

Discord メッセージアクションには、メッセージング、チャンネル管理、モデレーション、プレゼンス、メタデータアクションが含まれます。

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

OpenClaw は exec approval と cross-context marker に Discord components v2 を使用します。Discord メッセージアクションは、カスタム UI 用の `components` も受け付けることができます（高度な用途。discord tool 経由で component payload を構築する必要があります）。一方で、レガシーの `embeds` は引き続き利用可能ですが、推奨されません。

- `channels.discord.ui.components.accentColor` は、Discord component container で使用されるアクセントカラー（hex）を設定します。
- アカウントごとに設定するには、`channels.discord.accounts.<id>.ui.components.accentColor` を使用します。
- `channels.discord.agentComponents.ttlMs` は、送信済み Discord component callback が登録されたままになる時間を制御します（デフォルト `1800000`、最大 `86400000`）。アカウントごとに設定するには、`channels.discord.accounts.<id>.agentComponents.ttlMs` を使用します。
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

Discord には 2 つの異なる音声サーフェスがあります。リアルタイムの **voice channel**（継続的な会話）と **voice message attachment**（波形プレビュー形式）です。Gateway はその両方をサポートします。

### voice channel

セットアップチェックリスト:

1. Discord Developer Portal で Message Content Intent を有効にします。
2. role/user allowlist を使用する場合は、Server Members Intent を有効にします。
3. `bot` と `applications.commands` scope で bot を招待します。
4. 対象の voice channel で Connect、Speak、Send Messages、Read Message History を付与します。
5. native command（`commands.native` または `channels.discord.commands.native`）を有効にします。
6. `channels.discord.voice` を設定します。

セッションを制御するには `/vc join|leave|status` を使用します。このコマンドはアカウントのデフォルトエージェントを使用し、他の Discord コマンドと同じ allowlist およびグループポリシールールに従います。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

参加前に bot の実効権限を確認するには、次を実行します。

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

- `voice.tts` は `stt-tts` の音声再生でのみ `messages.tts` を上書きします。リアルタイムモードでは `voice.realtime.speakerVoice` を使用します。
- `voice.mode` は会話パスを制御します。デフォルトは `agent-proxy` です。リアルタイム音声フロントエンドがターンのタイミング、中断、再生を処理し、実質的な作業を `openclaw_agent_consult` 経由でルーティングされた OpenClaw エージェントに委任し、その結果をその話者からの入力済み Discord プロンプトのように扱います。`stt-tts` は従来のバッチ STT と TTS のフローを維持します。`bidi` では、リアルタイムモデルが直接会話しつつ、OpenClaw の頭脳向けに `openclaw_agent_consult` を公開します。
- `voice.agentSession` は、どの OpenClaw 会話が音声ターンを受け取るかを制御します。音声チャンネル自身のセッションを使う場合は未設定のままにするか、`{ mode: "target", target: "channel:<text-channel-id>" }` を設定して、その音声チャンネルを `#maintainers` など既存の Discord テキストチャンネルセッションのマイク/スピーカー拡張として動作させます。
- `voice.model` は、Discord 音声応答とリアルタイム相談で使う OpenClaw エージェントの頭脳を上書きします。ルーティングされたエージェントモデルを継承する場合は未設定のままにします。これは `voice.realtime.model` とは別です。
- `voice.followUsers` により、bot は選択したユーザーと一緒に Discord 音声へ参加、移動、退出できます。動作ルールと例については [音声でユーザーをフォローする](#follow-users-in-voice) を参照してください。
- `agent-proxy` は発話を `discord-voice` 経由でルーティングします。これにより、話者と対象セッションに対する通常のオーナー/ツール認可を保持しますが、Discord 音声が再生を所有するため、エージェントの `tts` ツールは非表示になります。デフォルトでは、`agent-proxy` はオーナー話者に対して相談にオーナー相当の完全なツールアクセスを付与し（`voice.realtime.toolPolicy: "owner"`）、実質的な回答の前に OpenClaw エージェントへ相談することを強く優先します（`voice.realtime.consultPolicy: "always"`）。このデフォルトの `always` モードでは、リアルタイム層は相談回答の前に自動でつなぎの発話をしません。発話をキャプチャして文字起こしし、その後ルーティングされた OpenClaw の回答を読み上げます。Discord が最初の回答をまだ再生している間に複数の強制相談回答が完了した場合、後続の完全発話回答は文の途中で発話を置き換えるのではなく、再生がアイドルになるまでキューに入ります。
- `stt-tts` モードでは、STT は `tools.media.audio` を使用します。`voice.model` は文字起こしに影響しません。
- リアルタイムモードでは、`voice.realtime.provider`、`voice.realtime.model`、`voice.realtime.speakerVoice` がリアルタイム音声セッションを設定します。OpenAI Realtime 2 と Codex の頭脳を併用するには、`voice.realtime.model: "gpt-realtime-2"` と `voice.model: "openai/gpt-5.5"` を使用します。
- リアルタイム音声モードでは、デフォルトで小さな `IDENTITY.md`、`USER.md`、`SOUL.md` プロファイルファイルがリアルタイムプロバイダー指示に含まれるため、高速な直接ターンでも、ルーティングされた OpenClaw エージェントと同じアイデンティティ、ユーザーの基盤情報、ペルソナを維持できます。これをカスタマイズするには `voice.realtime.bootstrapContextFiles` をサブセットに設定し、無効にするには `[]` を設定します。サポートされるリアルタイムブートストラップファイルはこれらのプロファイルファイルに限られます。`AGENTS.md` は通常のエージェントコンテキストに残ります。注入されたプロファイルコンテキストは、ワークスペース作業、現在の事実、メモリ検索、ツールに支えられたアクションに対する `openclaw_agent_consult` を置き換えるものではありません。
- OpenAI `agent-proxy` リアルタイムモードでは、`voice.realtime.requireWakeName: true` を設定すると、文字起こしがウェイク名で始まるか終わるまで Discord リアルタイム音声を無音に保てます。設定するウェイク名は 1 語または 2 語である必要があります。`voice.realtime.wakeNames` が未設定の場合、OpenClaw はルーティングされたエージェントの `name` に `OpenClaw` を加えたものを使用し、フォールバックとしてエージェント ID に `OpenClaw` を加えたものを使用します。ウェイク名ゲートはリアルタイムプロバイダーの自動応答を無効にし、受け入れられたターンを OpenClaw エージェント相談パス経由でルーティングし、最終文字起こしが届く前に部分文字起こしから先頭のウェイク名が認識された場合は短い音声確認を返します。
- OpenAI リアルタイムプロバイダーは、現在の Realtime 2 イベント名と、出力音声および文字起こしイベント向けのレガシーな Codex 互換エイリアスを受け入れるため、互換プロバイダースナップショットがずれてもアシスタント音声を落とさずに済みます。
- `voice.realtime.bargeIn` は、Discord の話者開始イベントがアクティブなリアルタイム再生を中断するかどうかを制御します。未設定の場合、リアルタイムプロバイダーの入力音声中断設定に従います。
- `voice.realtime.minBargeInAudioEndMs` は、OpenAI リアルタイムの割り込みが音声を切り詰める前に必要な最小アシスタント再生時間を制御します。デフォルト: `250`。反響の少ない部屋で即時中断するには `0` を設定し、反響の多いスピーカー環境では値を上げます。
- Discord 再生で OpenAI 音声を使うには、`voice.tts.provider: "openai"` を設定し、`voice.tts.providers.openai.speakerVoice` で Text-to-speech 音声を選択します。現在の OpenAI TTS モデルでは、`cedar` は男性的に聞こえる良い選択肢です。
- チャンネルごとの Discord `systemPrompt` 上書きは、その音声チャンネルの音声文字起こしターンに適用されます。
- 音声文字起こしターンは、オーナー制限付きコマンドとチャンネルアクションに対するオーナーステータスを Discord `allowFrom`（または `dm.allowFrom`）から導出します。エージェントのツール可視性は、ルーティングされたセッションに設定されたツールポリシーに従います。
- Discord 音声はテキスト専用設定ではオプトインです。`/vc` コマンド、音声ランタイム、`GuildVoiceStates` Gateway intent を有効にするには、`channels.discord.voice.enabled=true` を設定します（または既存の `channels.discord.voice` ブロックを維持します）。
- `channels.discord.intents.voiceStates` で、音声状態 intent サブスクリプションを明示的に上書きできます。intent を有効な音声有効化状態に従わせる場合は未設定のままにします。
- `voice.autoJoin` に同じギルドのエントリが複数ある場合、OpenClaw はそのギルドで最後に設定されたチャンネルに参加します。
- `voice.allowedChannels` は任意の常駐許可リストです。未設定のままにすると、認可された任意の Discord 音声チャンネルへの `/vc join` を許可します。設定されている場合、`/vc join`、起動時の自動参加、bot の音声状態移動は、一覧にある `{ guildId, channelId }` エントリに制限されます。空配列に設定すると、すべての Discord 音声参加を拒否します。Discord が bot を許可リスト外へ移動した場合、OpenClaw はそのチャンネルから退出し、利用可能な場合は設定済みの自動参加対象へ再参加します。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` の参加オプションへそのまま渡されます。
- 未設定の場合、`@discordjs/voice` のデフォルトは `daveEncryption=true` と `decryptionFailureTolerance=24` です。
- OpenClaw は Discord 音声受信とリアルタイム生 PCM 再生に、バンドルされた `libopus-wasm` コーデックを使用します。固定された libopus WebAssembly ビルドを同梱しており、ネイティブ opus アドオンは不要です。
- `voice.connectTimeoutMs` は、`/vc join` と自動参加試行における初期 `@discordjs/voice` Ready 待機を制御します。デフォルト: `30000`。
- `voice.reconnectGraceMs` は、切断された音声セッションが破棄される前に再接続を開始するのを OpenClaw が待つ時間を制御します。デフォルト: `15000`。
- `stt-tts` モードでは、別のユーザーが話し始めただけでは音声再生は停止しません。フィードバックループを避けるため、OpenClaw は TTS の再生中は新しい音声キャプチャを無視します。次のターンでは、再生が終わってから話してください。リアルタイムモードでは、話者開始を割り込みシグナルとしてリアルタイムプロバイダーへ転送します。
- リアルタイムモードでは、スピーカーから開いたマイクに入るエコーが割り込みのように見え、再生を中断することがあります。エコーの多い Discord ルームでは、入力音声で OpenAI が自動中断しないように `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` を設定します。それでも Discord の話者開始イベントでアクティブな再生を中断したい場合は、`voice.realtime.bargeIn: true` を追加します。OpenAI リアルタイムブリッジは、`voice.realtime.minBargeInAudioEndMs` より短い再生切り詰めをエコー/ノイズの可能性が高いものとして無視し、Discord 再生をクリアする代わりにスキップとしてログに記録します。
- `voice.captureSilenceGraceMs` は、Discord が話者の停止を報告してから、OpenClaw がその音声セグメントを STT 用に確定するまで待つ時間を制御します。デフォルト: `2000`。Discord が通常の間を細切れの部分文字起こしに分割する場合は、この値を上げます。
- ElevenLabs が選択された TTS プロバイダーの場合、Discord 音声再生はストリーミング TTS を使用し、プロバイダー応答ストリームから開始します。ストリーミングに対応していないプロバイダーは、合成済み一時ファイルのパスへフォールバックします。
- OpenClaw は受信復号失敗も監視し、短い時間枠で失敗が繰り返された場合は音声チャンネルから退出/再参加して自動回復します。
- 更新後に受信ログで `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合は、依存関係レポートとログを収集してください。バンドルされた `@discordjs/voice` 系列には、discord.js PR #11449 の上流パディング修正が含まれており、これは discord.js issue #11419 を解決したものです。
- OpenClaw がキャプチャした話者セグメントを確定するとき、`The operation was aborted` 受信イベントは想定内です。これは詳細診断であり、警告ではありません。
- 詳細な Discord 音声ログには、受け入れられた各話者セグメントについて、境界付きの 1 行 STT 文字起こしプレビューが含まれます。そのため、無制限の文字起こしテキストをダンプせずに、ユーザー側とエージェント応答側の両方をデバッグで確認できます。
- `agent-proxy` モードでは、強制相談フォールバックは、`...` で終わるテキストや `and` のような末尾の接続語など、未完了の可能性が高い文字起こし断片に加え、「すぐ戻る」や「さようなら」のような明らかにアクション不要な締めくくりをスキップします。これにより古いキュー済み回答が防止される場合、ログには `forced agent consult skipped reason=...` と表示されます。

### 音声でユーザーをフォローする

起動時に固定チャンネルへ参加したり `/vc join` を待ったりする代わりに、Discord 音声 bot を 1 人以上の既知の Discord ユーザーと一緒に留まらせたい場合は、`voice.followUsers` を使用します。

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

- `followUsers` は生の Discord ユーザー ID と `discord:<id>` 値を受け入れます。OpenClaw は音声状態イベントと照合する前に、両方の形式を正規化します。
- `followUsers` が設定されている場合、`followUsersEnabled` のデフォルトは `true` です。保存済みリストは保持しつつ自動音声フォローを停止するには、`false` に設定します。
- フォロー対象ユーザーが許可された音声チャンネルに参加すると、OpenClaw はそのチャンネルに参加します。ユーザーが移動すると、OpenClaw も一緒に移動します。アクティブなフォロー対象ユーザーが切断すると、OpenClaw は退出します。
- 同じギルドに複数のフォロー対象ユーザーがいて、アクティブなフォロー対象ユーザーが退出した場合、OpenClaw はギルドから退出する前に、追跡中の別のフォロー対象ユーザーのチャンネルへ移動します。複数のフォロー対象ユーザーが同時に移動した場合は、最後に観測された音声状態イベントが優先されます。
- `allowedChannels` は引き続き適用されます。許可されていないチャンネルにいるフォロー対象ユーザーは無視され、フォロー所有のセッションは別のフォロー対象ユーザーへ移動するか退出します。
- OpenClaw は、起動時および境界付き間隔で、取りこぼした音声状態イベントを調整します。調整では設定済みギルドをサンプリングし、1 回の実行あたりの REST 参照数に上限を設けるため、非常に大きな `followUsers` リストでは収束に複数の間隔が必要になることがあります。
- Discord または管理者が、ユーザーをフォロー中の bot を移動した場合、OpenClaw は音声セッションを再構築し、移動先が許可されていればフォロー所有権を保持します。bot が `allowedChannels` の外へ移動された場合、OpenClaw は退出し、設定済み対象が存在する場合はそこへ再参加します。
- DAVE 受信回復では、復号失敗が繰り返された後に同じチャンネルを退出して再参加する場合があります。フォロー所有のセッションは、その回復パスを通じてフォロー所有権を保持するため、後でフォロー対象ユーザーが切断した場合もチャンネルから退出します。

参加モードを選択します:

- 自分が音声にいるときに bot も自動的に音声にいるべき個人用またはオペレーター用のセットアップでは、`followUsers` を使用します。
- 追跡対象ユーザーが音声にいない場合でも存在すべき固定ルーム bot では、`autoJoin` を使用します。
- 1 回限りの参加や、自動音声プレゼンスが意外に感じられる部屋では、`/vc join` を使用します。

Discord 音声コーデック:

- 音声受信ログには `discord voice: opus decoder: libopus-wasm` が表示されます。
- リアルタイム再生は、パケットを `@discordjs/voice` に渡す前に、同じバンドル済みの `libopus-wasm` パッケージで生の 48 kHz ステレオ PCM を Opus にエンコードします。
- ファイルおよびプロバイダーストリーム再生は、ffmpeg で生の 48 kHz ステレオ PCM にトランスコードし、その後 Discord に送信される Opus パケットストリームに `libopus-wasm` を使用します。

STT と TTS のパイプライン:

- Discord PCM キャプチャは一時 WAV ファイルに変換されます。
- `tools.media.audio` が STT を処理します。例: `openai/gpt-4o-mini-transcribe`。
- トランスクリプトは Discord の ingress とルーティングを通して送信されます。一方で、応答 LLM は agent `tts` ツールを隠し、返却テキストを求める音声出力ポリシーで実行されます。これは Discord voice が最終的な TTS 再生を所有するためです。
- `voice.model` が設定されている場合、この音声チャネルターンの応答 LLM だけを上書きします。
- `voice.tts` は `messages.tts` にマージされます。ストリーミング対応プロバイダーはプレイヤーへ直接入力し、それ以外の場合は生成された音声ファイルが参加中のチャネルで再生されます。

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

`voice.agentSession` ブロックがない場合、各音声チャネルはそれぞれ独自にルーティングされた OpenClaw セッションを取得します。たとえば、`/vc join channel:234567890123456789` はその Discord 音声チャネル用のセッションと会話します。リアルタイムモデルは音声フロントエンドにすぎません。実質的なリクエストは設定済みの OpenClaw agent に渡されます。リアルタイムモデルが consult ツールを呼び出さずに最終トランスクリプトを生成した場合、OpenClaw はフォールバックとして consult を強制するため、デフォルトでも agent と会話しているように動作します。

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

リアルタイム bidi の例:

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

`agent-proxy` モードでは、ボットは設定済みの音声チャネルに参加しますが、OpenClaw agent のターンはターゲットチャネルの通常のルーティング済みセッションと agent を使用します。リアルタイム音声セッションは、返された結果を音声チャネルに話し返します。supervisor agent は、ツールポリシーに従って通常のメッセージツールを引き続き使用できます。適切なアクションであれば、別の Discord メッセージを送信することも含まれます。

委任された OpenClaw 実行がアクティブな間、新しい Discord 音声トランスクリプトは、別の agent ターンを開始する前にライブ実行制御として扱われます。「status」、「cancel that」、「use the smaller fix」、「when you're done also check tests」などのフレーズは、アクティブなセッションに対するステータス、キャンセル、ステアリング、またはフォローアップ入力として分類されます。ステータス、キャンセル、受け入れられたステアリング、フォローアップの結果は音声チャネルに話し返されるため、呼び出し元は OpenClaw がリクエストを処理したかどうかを把握できます。

有用なターゲット形式:

- `target: "channel:123456789012345678"` は Discord テキストチャネルセッション経由でルーティングします。
- `target: "123456789012345678"` はチャネルターゲットとして扱われます。
- `target: "dm:123456789012345678"` または `target: "user:123456789012345678"` は、そのダイレクトメッセージセッション経由でルーティングします。

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

モデルが開いたマイク越しに自身の Discord 再生音を聞いてしまうが、発話による割り込みは引き続き行いたい場合にこれを使用します。OpenClaw は生の入力音声による OpenAI の自動割り込みを防ぎます。一方で、`bargeIn: true` により、次のキャプチャ済みターンが OpenAI に到達する前に、Discord の話者開始イベントとすでにアクティブな話者音声がアクティブなリアルタイム応答をキャンセルできます。`audioEndMs` が `minBargeInAudioEndMs` 未満の非常に早い barge-in シグナルは、エコーまたはノイズの可能性が高いものとして扱われ、無視されます。そのため、モデルが最初の再生フレームで途切れることはありません。

想定される音声ログ:

- 参加時: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- リアルタイム開始時: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 話者音声時: `discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`、および `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 古い発話がスキップされた時: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` または `reason=non-actionable-closing ...`
- リアルタイム応答完了時: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 再生停止/リセット時: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- リアルタイム consult 時: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- agent 回答時: `discord voice: agent turn answer ...`
- 正確な発話がキューに入った時: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`、続いて `discord voice: realtime exact speech dequeued reason=player-idle ...`
- barge-in 検出時: `discord voice: realtime barge-in detected source=speaker-start ...` または `discord voice: realtime barge-in detected source=active-speaker-audio ...`、続いて `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- リアルタイム割り込み時: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`、続いて `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` または `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- エコー/ノイズが無視された時: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- barge-in が無効な場合: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- アイドル再生時: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

途切れる音声をデバッグするには、リアルタイム音声ログをタイムラインとして読みます。

1. `realtime audio playback started` は、Discord がアシスタント音声の再生を開始したことを意味します。bridge はこの時点から、アシスタント出力チャンク、Discord PCM バイト、プロバイダーのリアルタイムバイト、および合成音声の長さのカウントを開始します。
2. `realtime speaker turn opened` は、Discord の話者がアクティブになったことを示します。再生がすでにアクティブで、`bargeIn` が有効な場合、この後に `barge-in detected source=speaker-start` が続くことがあります。
3. `realtime input audio started` は、その話者ターンで最初の実際の音声フレームを受信したことを示します。ここで `outputActive=true` またはゼロでない `outputAudioMs` がある場合、アシスタント再生がまだアクティブな間にマイクが入力を送信していることを意味します。
4. `barge-in detected source=active-speaker-audio` は、アシスタント再生がアクティブな間に OpenClaw がライブの話者音声を確認したことを意味します。これは、実際の割り込みと、有用な音声を伴わない Discord の話者開始イベントを区別するのに役立ちます。
5. `barge-in requested reason=...` は、OpenClaw がリアルタイムプロバイダーにアクティブな応答のキャンセルまたは切り詰めを要求したことを意味します。`outputAudioMs`、`outputActive`、`playbackChunks` が含まれるため、割り込み前にアシスタント音声が実際にどれだけ再生されていたかを確認できます。
6. `realtime audio playback stopped reason=...` は、ローカル Discord 再生のリセットポイントです。理由は誰が再生を停止したかを示します: `barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close`、または `session-close`。
7. `realtime speaker turn closed` は、キャプチャされた入力ターンを要約します。`chunks=0` または `hasAudio=false` は、話者ターンは開かれたものの、使用可能な音声がリアルタイム bridge に到達しなかったことを意味します。`interruptedPlayback=true` は、その入力ターンがアシスタント出力と重なり、barge-in ロジックをトリガーしたことを意味します。

有用なフィールド:

- `outputAudioMs`: ログ行の前にリアルタイムプロバイダーが生成したアシスタント音声の長さ。
- `audioMs`: 再生停止前に OpenClaw がカウントしたアシスタント音声の長さ。
- `elapsedMs`: 再生ストリームまたは話者ターンの開始から終了までの実時間。
- `discordBytes`: Discord voice に送信、または Discord voice から受信した 48 kHz ステレオ PCM バイト。
- `realtimeBytes`: リアルタイムプロバイダーに送信、またはリアルタイムプロバイダーから受信したプロバイダー形式の PCM バイト。
- `playbackChunks`: アクティブな応答のために Discord に転送されたアシスタント音声チャンク。
- `sinceLastAudioMs`: 最後にキャプチャされた話者音声フレームから話者ターン終了までの間隔。

一般的なパターン:

- `source=active-speaker-audio`、小さい `outputAudioMs`、および近くに同じユーザーがいる状態で即座に途切れる場合、通常はスピーカーのエコーがマイクに入っていることを示します。`voice.realtime.minBargeInAudioEndMs` を上げる、スピーカー音量を下げる、ヘッドフォンを使う、または `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` を設定します。
- `source=speaker-start` の後に `speaker turn closed ... hasAudio=false` が続く場合、Discord が話者開始を報告したものの、音声が OpenClaw に到達しなかったことを意味します。これは一時的な Discord voice イベント、ノイズゲート動作、またはクライアントが一瞬マイクを有効にしたことが原因になり得ます。
- 近くに barge-in や `provider-clear-audio` がないのに `audio playback stopped reason=stream-close` が出る場合、ローカル Discord 再生ストリームが予期せず終了したことを意味します。直前のプロバイダーと Discord プレイヤーのログを確認してください。
- `capture ignored during playback (barge-in disabled)` は、アシスタント音声がアクティブな間、OpenClaw が意図的に入力を破棄したことを意味します。発話で再生を割り込みたい場合は、`voice.realtime.bargeIn` を有効にします。
- `barge-in ignored ... outputActive=false` は、Discord またはプロバイダーの VAD が発話を報告したものの、OpenClaw には割り込むべきアクティブな再生がなかったことを意味します。これで音声が途切れることはありません。

認証情報はコンポーネントごとに解決されます。`voice.model` には LLM ルート認証、`tools.media.audio` には STT 認証、`messages.tts`/`voice.tts` には TTS 認証、`voice.realtime.providers` またはプロバイダーの通常の認証設定にはリアルタイムプロバイダー認証が使用されます。

### 音声メッセージ

Discord 音声メッセージは波形プレビューを表示し、OGG/Opus 音声を必要とします。OpenClaw は波形を自動生成しますが、検査と変換のために gateway ホスト上の `ffmpeg` と `ffprobe` が必要です。

- **ローカルファイルパス**を指定します（URL は拒否されます）。
- テキスト内容は省略します（Discord は同じペイロード内のテキスト + ボイスメッセージを拒否します）。
- 任意の音声形式を使用できます。OpenClaw は必要に応じて OGG/Opus に変換します。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていない intent を使用した、または bot が guild メッセージを認識しない">

    - Message Content Intent を有効にする
    - ユーザー/メンバー解決に依存する場合は Server Members Intent を有効にする
    - intent の変更後に gateway を再起動する

  </Accordion>

  <Accordion title="Guild メッセージが予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` の下にある guild allowlist を確認する
    - guild の `channels` マップが存在する場合、一覧にあるチャンネルのみが許可される
    - `requireMention` の動作とメンションパターンを確認する

    便利な確認:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention が false なのにまだブロックされる">
    よくある原因:

    - 一致する guild/channel allowlist がない `groupPolicy="allowlist"`
    - `requireMention` が間違った場所に設定されている（`channels.discord.guilds` または channel エントリの下にある必要がある）
    - 送信者が guild/channel の `users` allowlist によってブロックされている

  </Accordion>

  <Accordion title="長時間実行される Discord ターンまたは重複返信">

    典型的なログ:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway キューの調整項目:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - 複数アカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - これは Discord gateway リスナー作業のみを制御し、エージェントターンの寿命は制御しない

    Discord は、キュー内のエージェントターンにチャンネル所有のタイムアウトを適用しません。メッセージリスナーはすぐに引き渡し、キュー内の Discord 実行は、session/tool/runtime ライフサイクルが作業を完了または中止するまで、セッションごとの順序を保持します。

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

  <Accordion title="Gateway メタデータ検索タイムアウト警告">
    OpenClaw は接続前に Discord `/gateway/bot` メタデータを取得します。一時的な失敗では Discord のデフォルト gateway URL にフォールバックし、ログ出力はレート制限されます。

    メタデータタイムアウトの調整項目:

    - 単一アカウント: `channels.discord.gatewayInfoTimeoutMs`
    - 複数アカウント: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - config が未設定の場合の env フォールバック: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - デフォルト: `30000`（30 秒）、最大: `120000`

  </Accordion>

  <Accordion title="Gateway READY タイムアウトによる再起動">
    OpenClaw は起動時と runtime 再接続後に Discord の gateway `READY` イベントを待機します。起動の段階的開始を行う複数アカウント構成では、デフォルトより長い起動時 READY ウィンドウが必要になる場合があります。

    READY タイムアウトの調整項目:

    - 起動時の単一アカウント: `channels.discord.gatewayReadyTimeoutMs`
    - 起動時の複数アカウント: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - config が未設定の場合の起動時 env フォールバック: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 起動時デフォルト: `15000`（15 秒）、最大: `120000`
    - runtime の単一アカウント: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime の複数アカウント: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - config が未設定の場合の runtime env フォールバック: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtime デフォルト: `30000`（30 秒）、最大: `120000`

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` の権限確認は数値のチャンネル ID に対してのみ機能します。

    slug キーを使用している場合、runtime の照合は引き続き機能することがありますが、probe は権限を完全には検証できません。

  </Accordion>

  <Accordion title="DM と pairing の問題">

    - DM が無効: `channels.discord.dm.enabled=false`
    - DM ポリシーが無効: `channels.discord.dmPolicy="disabled"`（レガシー: `channels.discord.dm.policy`）
    - `pairing` モードで pairing 承認待ち

  </Accordion>

  <Accordion title="Bot から bot へのループ">
    デフォルトでは bot が作成したメッセージは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を避けるために厳格なメンションと allowlist ルールを使用してください。
    bot にメンションする bot メッセージのみを受け入れるには、`channels.discord.allowBots="mentions"` を推奨します。

    OpenClaw には共有の [bot ループ保護](/ja-JP/channels/bot-loop-protection) も同梱されています。`allowBots` によって bot が作成したメッセージが dispatch に到達するたびに、Discord は受信イベントを `(account, channel, bot pair)` facts にマップし、generic pair guard は、設定されたイベント予算を超えた後にその pair を抑制します。この guard は、以前は Discord のレート制限で止める必要があった制御不能な 2 bot ループを防ぎます。単一 bot デプロイや、予算内に収まる単発の bot 返信には影響しません。

    デフォルト設定（`allowBots` が設定されている場合に有効）:

    - `maxEventsPerWindow: 20` -- bot pair は sliding window 内で 20 件のメッセージを交換できる
    - `windowSeconds: 60` -- sliding window の長さ
    - `cooldownSeconds: 60` -- 予算に達すると、どちらの方向でも追加の bot-to-bot メッセージは 1 分間すべて破棄される

    共有デフォルトを `channels.defaults.botLoopProtection` の下で一度設定し、正当なワークフローで余裕がさらに必要な場合に Discord をオーバーライドします。優先順位は次のとおりです。

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - 組み込みデフォルト

    Discord は generic な `maxEventsPerWindow`、`windowSeconds`、`cooldownSeconds` キーを使用します。

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
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
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

  <Accordion title="DecryptionFailed(...) による Voice STT の欠落">

    - Discord voice 受信リカバリロジックが存在するように、OpenClaw を最新に保つ（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）を確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（upstream デフォルト）から開始し、必要な場合のみ調整する
    - 次のログを確認する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集し、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) の upstream DAVE 受信履歴と比較する

  </Accordion>
</AccordionGroup>

## 設定リファレンス

主なリファレンス: [設定リファレンス - Discord](/ja-JP/gateway/config-channels#discord)。

<Accordion title="重要度の高い Discord フィールド">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout`（リスナー予算）, `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming`（レガシーエイリアス: `streamMode`）, `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb`（送信 Discord アップロードの上限、デフォルト `100MB`）, `retry`
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`, トップレベル `bindings[]`（`type: "acp"`）, `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## 安全性と運用

- bot token は secret として扱う（管理された環境では `DISCORD_BOT_TOKEN` を推奨）。
- Discord 権限は最小権限を付与する。
- command deploy/state が古い場合は、gateway を再起動し、`openclaw channels status --probe` で再確認する。

## 関連

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    Discord ユーザーを gateway にペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループチャットと allowlist の動作。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントにルーティングします。
  </Card>
  <Card title="セキュリティ" icon="shield" href="/ja-JP/gateway/security">
    脅威モデルと強化。
  </Card>
  <Card title="マルチエージェントルーティング" icon="sitemap" href="/ja-JP/concepts/multi-agent">
    Guild とチャンネルをエージェントにマップします。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作。
  </Card>
</CardGroup>
