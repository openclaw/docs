---
read_when:
    - Discord チャンネル機能の開発
summary: Discord bot のセットアップ、設定キー、コンポーネント、音声、トラブルシューティング
title: Discord
x-i18n:
    generated_at: "2026-07-12T14:17:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw は公式の Discord gateway を介してボットとして Discord に接続します。DM とギルドチャンネルに対応しています。

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

ボットを含む Discord アプリケーションを作成し、ボットをサーバーに追加して、OpenClaw とペアリングします。可能であればプライベートサーバーを使用してください。必要な場合は、まず[サーバーを作成](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)します（**Create My Own > For me and my friends**）。

<Steps>
  <Step title="Discord アプリケーションとボットを作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) で **New Application** をクリックし、名前を付けます（例:「OpenClaw」）。

    サイドバーの **Bot** を開き、**Username** をエージェントの名前に設定します。

  </Step>

  <Step title="特権インテントを有効にする">
    引き続き **Bot** ページの **Privileged Gateway Intents** で、以下を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロールの許可リスト、名前から ID への照合、チャンネルオーディエンスのアクセスグループに必要）
    - **Presence Intent**（任意。プレゼンス更新にのみ使用）

  </Step>

  <Step title="ボットトークンをコピーする">
    **Bot** ページで **Reset Token** をクリックし、トークンをコピーします。

    <Note>
    この名称とは異なり、これは最初のトークンを生成する操作であり、何かが「リセット」されるわけではありません。
    </Note>

  </Step>

  <Step title="招待 URL を生成してボットをサーバーに追加する">
    サイドバーで **OAuth2** を開きます。**OAuth2 URL Generator** で、次のスコープを有効にします。

    - `bot`
    - `applications.commands`

    表示される **Bot Permissions** セクションで、少なくとも以下を有効にします。

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（任意）

    これが通常のテキストチャンネルに必要な基本設定です。フォーラムやメディアチャンネルでスレッドを作成または継続するワークフローを含め、ボットがスレッドに投稿する場合は、**Send Messages in Threads** も有効にします。

    生成された URL をコピーしてブラウザーで開き、サーバーを選択して **Continue** をクリックします。これでボットがサーバーに表示されます。

  </Step>

  <Step title="Developer Mode を有効にして ID を取得する">
    ID をコピーできるように、Discord アプリで Developer Mode を有効にします。

    1. **User Settings**（歯車アイコン）→ **Developer** → **Developer Mode** をオン
       *（モバイルの場合: **App Settings** → **Advanced**）*
    2. **サーバーアイコン**を右クリック → **Copy Server ID**
    3. **自分のアバター**を右クリック → **Copy User ID**

    Server ID と User ID をボットトークンとともに保管してください。次の手順では、この 3 つがすべて必要です。

  </Step>

  <Step title="サーバーメンバーからの DM を許可する">
    ペアリングを機能させるには、Discord でボットからあなたへの DM が許可されている必要があります。**サーバーアイコン**を右クリック → **Privacy Settings** → **Direct Messages** をオンにします。

    OpenClaw で Discord の DM を使用する場合は、オンのままにしてください。ギルドチャンネルのみを使用する場合は、ペアリング後に無効にできます。

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
    管理対象サービスとしてインストールしている場合は、`DISCORD_BOT_TOKEN` が設定されているシェルから `openclaw gateway install` を実行するか、再起動後にサービスが環境変数の SecretRef を解決できるよう、変数を `~/.openclaw/.env` に保存します。
    ホストが Discord の起動時アプリケーション検索によってブロックまたはレート制限されている場合は、起動時にその REST 呼び出しを省略できるよう、Developer Portal のアプリケーション／クライアント ID を設定します。デフォルトアカウントでは `channels.discord.applicationId`、ボットごとでは `channels.discord.accounts.<accountId>.applicationId` を使用します。

  </Step>

  <Step title="OpenClaw を設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼">
        既存のチャンネル（Telegram など）で OpenClaw エージェントとチャットし、設定を依頼します。Discord が最初のチャンネルである場合は、代わりに CLI / 設定タブを使用してください。

        > 「Discord ボットトークンは設定済みです。User ID `<user_id>` と Server ID `<server_id>` を使用して Discord のセットアップを完了してください。」
      </Tab>
      <Tab title="CLI / 設定">
        ファイルベースの設定:

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

        デフォルトアカウント用の環境変数フォールバック:

```bash
DISCORD_BOT_TOKEN=...
```

        スクリプトまたはリモートでセットアップする場合は、同じ JSON5 ブロックをファイルに書き込み、`openclaw config patch --file ./discord.patch.json5 --dry-run` を実行してから、`--dry-run` なしでもう一度実行します。プレーンテキストの `token` 文字列も使用でき、`channels.discord.token` では env/file/exec プロバイダーの SecretRef 値もサポートされます。[シークレット管理](/ja-JP/gateway/secrets)を参照してください。

        複数の Discord ボットを使用する場合は、各ボットのトークンとアプリケーション ID をそれぞれのアカウント内に設定します。トップレベルの `channels.discord.applicationId` は各アカウントに継承されるため、すべてのアカウントで同じアプリケーション ID を使用する場合にのみ設定してください。

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
    gateway が実行されたら、Discord でボットに DM を送信します。ボットからペアリングコードが返信されます。

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

    ペアリングコードは 1 時間後に期限切れになります。承認後、Discord の DM でエージェントとチャットできます。

  </Step>
</Steps>

<Note>
トークンの解決ではアカウントが考慮されます。設定内のトークン値が環境変数フォールバックより優先され、`DISCORD_BOT_TOKEN` はデフォルトアカウントにのみ使用されます。
有効な 2 つの Discord アカウントが同じボットトークンに解決される場合、OpenClaw はそのトークンに対して 1 つの gateway モニターのみを起動します。設定由来のトークンが環境変数フォールバックより優先され、それ以外の場合は最初に有効なアカウントが優先されます。重複するアカウントは、理由 `duplicate bot token` とともに無効として報告されます。
高度な送信呼び出し（メッセージツール／チャンネルアクション）では、呼び出しごとに明示された `token` がその呼び出しに使用されます。これは送信および読み取り／プローブ形式のアクション（read/search/fetch/thread/pins/permissions）に適用されます。アカウントポリシー／再試行設定は、引き続きアクティブなランタイムスナップショットで選択されたアカウントから取得されます。
</Note>

## 推奨: ギルドワークスペースをセットアップする

DM が機能するようになったら、サーバーを完全なワークスペースとして使用できます。各チャンネルには、独自のコンテキストを持つ個別のエージェントセッションが割り当てられます。自分とボットだけがいるプライベートサーバーに推奨されます。

<Steps>
  <Step title="サーバーをギルドの許可リストに追加する">
    これにより、エージェントは DM だけでなく、サーバー内の任意のチャンネルで応答できます。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「Discord Server ID `<server_id>` をギルドの許可リストに追加してください」
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
    デフォルトでは、エージェントはギルドチャンネルで @メンションされた場合にのみ応答します。プライベートサーバーでは、すべてのメッセージに応答させたい場合が多いでしょう。

    ギルドチャンネルでは、通常の返信はデフォルトで自動的に投稿されます。常時稼働の共有ルームでは、`messages.groupChat.visibleReplies: "message_tool"` を明示的に設定すると、エージェントは待機し、チャンネルへの返信が有用だと判断した場合にのみ投稿できます。これは GPT-5.6 Sol のような、最新世代でツールの信頼性が高いモデルで最も効果的です。ツールが送信しない限り、アンビエントルームイベントは投稿されません。待機モードの完全な設定については、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を参照してください。

    Discord に入力中と表示され、ログにトークン使用量が記録されているにもかかわらずメッセージが投稿されない場合は、そのターンがアンビエントルームイベントとして設定されていないか、メッセージツールによる可視返信が有効になっていないか確認してください。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「このサーバーで @メンションされなくてもエージェントが応答できるようにしてください」
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

        表示されるグループ／チャンネル返信でメッセージツールからの送信を必須にするには、`messages.groupChat.visibleReplies: "message_tool"` を設定します。

      </Tab>
    </Tabs>

  </Step>

  <Step title="ギルドチャンネルでのメモリ利用を計画する">
    長期メモリ（MEMORY.md）は DM セッションでのみ自動読み込みされ、ギルドチャンネルでは読み込まれません。

    <Tabs>
      <Tab title="エージェントに依頼">
        > 「Discord チャンネルで質問したとき、MEMORY.md の長期コンテキストが必要な場合は memory_search または memory_get を使用してください。」
      </Tab>
      <Tab title="手動">
        すべてのチャンネルで共有するコンテキストについては、安定した指示を `AGENTS.md` または `USER.md`（すべてのセッションに挿入されます）に記述します。長期的なメモは `MEMORY.md` に保存し、必要に応じてメモリツールでアクセスします。
      </Tab>
    </Tabs>

  </Step>
</Steps>

これでチャンネルを作成してチャットを開始できます。エージェントはチャンネル名を認識し、各チャンネルは独立したセッションになります。ワークフローに合わせて `#coding`、`#home`、`#research` などを設定してください。

## ランタイムモデル

- Gateway が Discord 接続を所有します。
- 返信のルーティングは決定的です。Discord から受信したメッセージへの返信は Discord に返されます。
- Discord のギルド／チャンネルメタデータは、ユーザーに表示される返信の接頭辞ではなく、信頼されていないコンテキストとしてモデルプロンプトに追加されます。モデルがそのエンベロープを返信にコピーした場合、OpenClaw は送信返信および今後のリプレイコンテキストから、コピーされたメタデータを削除します。
- デフォルト（`session.dmScope=main`）では、ダイレクトチャットはエージェントのメインセッション（`agent:main:main`）を共有します。
- ギルドチャンネルでは、独立したセッションキー（`agent:<agentId>:discord:channel:<channelId>`）が使用されます。
- グループ DM はデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブのスラッシュコマンドは独立したコマンドセッション（`agent:<agentId>:discord:slash:<userId>`）で実行されますが、ルーティング先の会話セッションへの `CommandTargetSessionKey` は引き続き保持されます。
- Discord へのテキストのみの Cron／Heartbeat 通知配信は、アシスタントに表示される最終回答にまとめられ、1 回だけ送信されます。メディアおよび構造化コンポーネントのペイロードは、エージェントが配信可能なペイロードを複数出力した場合、引き続き複数のメッセージとして送信されます。

## フォーラムチャンネル

Discord のフォーラムチャンネルとメディアチャンネルは、スレッド投稿のみを受け付けます。OpenClaw では、次の 2 つの方法で作成できます。

- フォーラムの親（`channel:<forumId>`）にメッセージを送信すると、スレッドが自動作成されます。スレッドタイトルには、メッセージ内の最初の空でない行が使用されます（Discord のスレッド名の上限である 100 文字に切り詰められます）。
- スレッドを直接作成するには、`openclaw message thread create` を使用します。フォーラムチャンネルでは `--message-id` を渡さないでください。

フォーラムの親に送信してスレッドを作成します。

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "トピックのタイトル\n投稿本文"
```

フォーラムスレッドを明示的に作成します。

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "トピックのタイトル" --message "投稿本文"
```

フォーラムの親は Discord コンポーネントを受け付けません。コンポーネントが必要な場合は、スレッド自体（`channel:<threadId>`）に送信してください。

## インタラクティブコンポーネント

OpenClaw は、エージェントメッセージ用の Discord components v2 コンテナをサポートしています。`components` ペイロードを指定してメッセージツールを使用します。インタラクション結果は通常の受信メッセージとしてエージェントにルーティングされ、既存の Discord `replyToMode` 設定に従います。

サポートされるブロック：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- アクション行には、最大 5 個のボタンまたは 1 個の選択メニューを配置できます
- 選択タイプ：`string`、`user`、`role`、`mentionable`、`channel`

デフォルトでは、コンポーネントは一度だけ使用できます。ボタン、選択メニュー、フォームを期限切れになるまで複数回使用できるようにするには、`components.reusable=true` を設定します。

ボタンをクリックできるユーザーを制限するには、そのボタンに `allowedUsers`（Discord ユーザー ID、タグ、または `*`）を設定します。一致しないユーザーには、一時的な拒否メッセージが表示されます。

コンポーネントのコールバックは、デフォルトで 30 分後に期限切れになります。デフォルトアカウントのコールバックレジストリの有効期間を変更するには `channels.discord.agentComponents.ttlMs` を設定し、アカウントごとに変更するには `channels.discord.accounts.<accountId>.agentComponents.ttlMs` を設定します。値の単位はミリ秒で、正の整数である必要があり、上限は `86400000`（24 時間）です。長い TTL は、ボタンを使用可能な状態に保つ必要があるレビュー／承認ワークフローに適していますが、古い Discord メッセージから引き続きアクションを実行できる期間も長くなります。要件を満たす最短の TTL を使用し、古いコールバックが予期しない動作を引き起こす場合はデフォルトのままにしてください。

`/model` および `/models` スラッシュコマンドを実行すると、プロバイダー、モデル、互換性のあるランタイムのドロップダウンと Submit ステップを備えたインタラクティブなモデルピッカーが開きます。`/models add` は非推奨であり、チャットからモデルを登録する代わりに非推奨メッセージを返します。ピッカーの応答は一時的で、呼び出したユーザーのみが使用できます。Discord の選択メニューは 25 個のオプションに制限されているため、`openai` や `vllm` など、選択したプロバイダーについてのみ動的に検出されたモデルをピッカーに表示する場合は、`provider/*` エントリを `agents.defaults.models` に追加してください。

ファイル添付：

- `file` ブロックは添付ファイル参照（`attachment://<filename>`）を指す必要があります
- 添付ファイルは `media`／`path`／`filePath`（単一ファイル）で指定します。複数のファイルには `media-gallery` を使用します
- アップロード名を添付ファイル参照と一致させる必要がある場合は、`filename` を使用して上書きします

モーダルフォーム：

- 最大 5 個のフィールドを持つ `components.modal` を追加します
- フィールドタイプ：`text`、`checkbox`、`radio`、`select`、`role-select`、`user-select`
- OpenClaw はトリガーボタンを自動的に追加します

例：

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
        { type: "text", label: "申請者" },
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
  <Tab title="DM ポリシー">
    `channels.discord.dmPolicy` は DM アクセスを制御します。`channels.discord.allowFrom` は正規の DM 許可リストです。

    - `pairing`（デフォルト）
    - `allowlist`（少なくとも 1 人の `allowFrom` 送信者が必要）
    - `open`（`channels.discord.allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    DM ポリシーが open でない場合、不明なユーザーはブロックされます（または `pairing` モードではペアリングを求められます）。

    複数アカウントでの優先順位：

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 1 つのアカウントでは、`allowFrom` がレガシーな `dm.allowFrom` より優先されます。
    - 名前付きアカウントでは、独自の `allowFrom` とレガシーな `dm.allowFrom` が未設定の場合、`channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    レガシーな `channels.discord.dm.policy` および `channels.discord.dm.allowFrom` は、互換性のために引き続き読み込まれます。アクセスを変更せずに実行できる場合、`openclaw doctor --fix` はこれらを `dmPolicy` および `allowFrom` に移行します。

    配信用の DM ターゲット形式：

    - `user:<id>`
    - `<@id>` メンション

    通常、チャンネルのデフォルトが有効な場合、数字のみの ID はチャンネル ID として解決されます。ただし、アカウントの有効な DM `allowFrom` に記載されている ID は、互換性のためにユーザー DM ターゲットとして扱われます。

  </Tab>

  <Tab title="アクセスグループ">
    Discord の DM およびテキストコマンドの認可では、`channels.discord.allowFrom` 内の動的な `accessGroup:<name>` エントリを使用できます。

    アクセスグループ名はメッセージチャンネル間で共有されます。メンバーを各チャンネルの通常の `allowFrom` 構文で表す静的グループには `type: "message.senders"` を使用し、Discord チャンネルの現在の `ViewChannel` 対象者によってメンバーシップを動的に定義する場合は `type: "discord.channelAudience"` を使用します。共有アクセスグループの動作：[アクセスグループ](/ja-JP/channels/access-groups)。

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

    Discord のテキストチャンネルには、個別のメンバーリストがありません。`type: "discord.channelAudience"` はメンバーシップを次のようにモデル化します。DM 送信者が設定されたギルドのメンバーであり、ロールおよびチャンネルの上書きを適用した後、設定されたチャンネルに対して現在有効な `ViewChannel` 権限を持っていることです。

    例：`#maintainers` を閲覧できるすべてのユーザーにボットへの DM を許可し、それ以外の全員に対しては DM を閉じたままにします。

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

    検索に失敗した場合は、アクセスが拒否されます。Discord が `Missing Access` を返した場合、メンバー検索に失敗した場合、またはチャンネルが別のギルドに属している場合、DM 送信者は認可されていないものとして扱われます。

    チャンネル対象者アクセスグループを使用する場合は、Discord Developer Portal の **Server Members Intent** を有効にしてください。DM にはギルドメンバーの状態が含まれないため、OpenClaw は認可時に Discord REST を介してメンバーを解決します。

  </Tab>

  <Tab title="ギルドポリシー">
    ギルドの処理は `channels.discord.groupPolicy` で制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合、安全なベースラインは `allowlist` です。

    `allowlist` の動作：

    - ギルドは `channels.discord.guilds` と一致する必要があります（`id` を推奨、スラッグも使用可能）
    - オプションの送信者許可リスト：`users`（安定した ID を推奨）および `roles`（ロール ID のみ）。いずれかが設定されている場合、送信者が `users` または `roles` のどちらかに一致すれば許可されます
    - 名前／タグの直接照合はデフォルトで無効です。緊急時の互換モードとしてのみ、`channels.discord.dangerouslyAllowNameMatching: true` を有効にしてください
    - `users` では名前／タグもサポートされますが、ID の方が安全です。名前／タグのエントリが使用されている場合、`openclaw security audit` が警告します
    - ギルドに `channels` が設定されている場合、リストにないチャンネルは拒否されます
    - ギルドに `channels` ブロックがない場合、その許可リスト登録済みギルド内のすべてのチャンネルが許可されます

    例：

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

    レガシーなチャンネル単位の `allow` キーは、`openclaw doctor --fix` によって `enabled` に移行されます。

    `DISCORD_BOT_TOKEN` のみを設定し、`channels.discord` ブロックを作成しない場合、`channels.defaults.groupPolicy` が `open` であっても、ランタイムのフォールバックは `groupPolicy="allowlist"` になります（ログに警告が記録されます）。

  </Tab>

  <Tab title="メンションとグループ DM">
    ギルドメッセージは、デフォルトでメンションが必要です。

    メンションの検出対象：

    - 明示的なボットへのメンション
    - 設定されたメンションパターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - サポートされている場合の暗黙的なボットへの返信動作

    Discord の送信メッセージを記述する場合は、正規のメンション構文を使用してください。ユーザーには `<@USER_ID>`、チャンネルには `<#CHANNEL_ID>`、ロールには `<@&ROLE_ID>` を使用します。レガシーな `<@!USER_ID>` ニックネームメンション形式は使用しないでください。

    `requireMention` はギルド／チャンネルごとに設定します（`channels.discord.guilds...`）。
    `ignoreOtherMentions` を使用すると、別のユーザー／ロールにはメンションしているものの、ボットにはメンションしていないメッセージを任意で破棄できます（@everyone／@here を除く）。

    グループ DM：

    - デフォルト：無視されます（`dm.groupEnabled=false`）
    - `dm.groupChannels`（チャンネル ID またはスラッグ）によるオプションの許可リスト

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

`bindings[].match.roles` を使用して、Discord ギルドのメンバーをロール ID に基づいて異なるエージェントへルーティングします。ロールベースのバインディングはロール ID のみを受け入れ、ピアまたは親ピアのバインディングの後、ギルドのみのバインディングの前に評価されます。バインディングに他の一致フィールド（たとえば `peer` + `guildId` + `roles`）も設定されている場合、設定されたすべてのフィールドが一致する必要があります。

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
  - チャンネルごとのオーバーライド: `channels.discord.commands.native`。
  - `commands.native=false` にすると、起動時の Discord スラッシュコマンドの登録とクリーンアップがスキップされます。以前に登録されたコマンドは、Discord アプリから削除するまで Discord に表示され続ける場合があります。
  - ネイティブコマンドの認証には、通常のメッセージ処理と同じ Discord の許可リストおよびポリシーが使用されます。
  - 権限のないユーザーにも Discord UI 上でコマンドが表示される場合がありますが、実行時には OpenClaw の認証が適用され、「認証されていません」と応答します。
  - スラッシュコマンドのデフォルト設定: `ephemeral: true`（`channels.discord.slashCommand.ephemeral`）。

  コマンドの一覧と動作については、[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

  ## 機能の詳細

  <AccordionGroup>
  <Accordion title="返信タグとネイティブ返信">
    Discord は、エージェント出力内の返信タグをサポートします。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` で制御します。

    - `off`（デフォルト）: 暗黙的な返信スレッド化は行いません。明示的な `[[reply_to_*]]` タグは引き続き適用されます
    - `first`: そのターンで最初に送信する Discord メッセージに、暗黙的なネイティブ返信参照を付加します
    - `all`: 送信するすべてのメッセージに付加します
    - `batched`: 受信イベントが、デバウンスによって複数のメッセージをまとめたバッチだった場合にのみ付加します。すべての単一メッセージのターンではなく、主に曖昧で短時間に連続するチャットにネイティブ返信を使用したい場合に便利です

    メッセージ ID はコンテキストおよび履歴に含まれるため、エージェントは特定のメッセージを指定できます。

  </Accordion>

  <Accordion title="リンクプレビュー">
    Discord はデフォルトで URL のリッチリンク埋め込みを生成します。OpenClaw はデフォルトで、送信する Discord メッセージ上の自動生成された埋め込みを抑制するため、オプトインしない限り、エージェントが送信した URL は通常のリンクとして表示されます。

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    1 つのアカウントで上書きするには、`channels.discord.accounts.<id>.suppressEmbeds` を設定します。エージェントのメッセージツールから送信する際に `suppressEmbeds: false` を渡して、単一のメッセージに適用することもできます。明示的な Discord `embeds` ペイロードは、デフォルトのリンクプレビュー設定では抑制されません。

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw は、一時メッセージを送信し、テキストの到着に合わせて編集することで、返信の下書きをストリーミングできます。`channels.discord.streaming.mode` には `off` | `partial` | `block` | `progress` を指定できます（`streaming`/レガシーの `streamMode` キーが設定されていない場合のデフォルト）。`streamMode` はレガシーエイリアスです。永続化された設定を正規のネストされた `streaming` 形式に書き換えるには、`openclaw doctor --fix` を実行してください。

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
    - `partial` は、トークンの到着に合わせて単一のプレビューメッセージを編集します。
    - `block` は下書きサイズのチャンクを送信します。サイズと区切り位置は `streaming.preview.chunk`（`minChars`、`maxChars`、`breakPreference`）で調整でき、`textChunkLimit` が上限となります。ブロックストリーミングが明示的に有効な場合、OpenClaw は二重ストリーミングを避けるため、プレビューストリームをスキップします。
    - `progress` は編集可能なステータス下書きを 1 つ保持し、最終配信までツールの進行状況で更新します。共有の開始ラベルは流れていく 1 行であるため、十分な作業内容が表示されると、ほかの内容と同様にスクロールして見えなくなります。
    - メディア、エラー、および明示的な返信の最終メッセージは、保留中のプレビュー編集をキャンセルします。
    - `streaming.preview.toolProgress`（デフォルトは `true`）は、ツールや進行状況の更新でプレビューメッセージを再利用するかどうかを制御します。
    - ツールや進行状況の行は、利用可能な場合、コンパクトな絵文字 + タイトル + 詳細として表示されます。たとえば、`🛠️ Bash: run tests` や `🔎 Web Search: for "query"` です。
    - `streaming.progress.commentary`（デフォルトは `false`）を有効にすると、一時的な進行状況の下書きにアシスタントの解説や前置きテキストが含まれます。解説は表示前に整形され、一時的なまま保持され、最終回答の配信には影響しません。
    - `streaming.progress.maxLineChars` は、進行状況プレビューの 1 行あたりの文字数上限を制御します。文章は単語の境界で短縮され、コマンドやパスの詳細では有用な末尾部分が保持されます。
    - `streaming.preview.commandText` / `streaming.progress.commandText` は、コンパクトな進行状況行に表示するコマンドや実行の詳細を制御します。`raw`（デフォルト）または `status`（ツールラベルのみ）を指定できます。

    生のコマンド/実行テキストを非表示にしつつ、コンパクトな進行状況行を維持します。

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

    プレビューストリーミングはテキスト専用です。メディア返信は通常の配信にフォールバックします。

  </Accordion>

  <Accordion title="履歴、コンテキスト、スレッドの動作">
    ギルド履歴コンテキスト:

    - `channels.discord.historyLimit` のデフォルトは `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` で無効化

    DM 履歴の制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    スレッドの動作:

    - Discord スレッドはチャンネルセッションとしてルーティングされ、上書きされない限り親チャンネルの設定を継承します。
    - スレッドセッションは親チャンネルのセッションレベルの `/model` 選択をモデル専用のフォールバックとして継承します。スレッドローカルの `/model` 選択が優先され、トランスクリプト継承が有効でない限り、親のトランスクリプト履歴はコピーされません。
    - `channels.discord.thread.inheritParent`（デフォルトは `false`）を使用すると、新しい自動スレッドに親トランスクリプトから初期データを設定できます。アカウント単位の上書き: `channels.discord.accounts.<id>.thread.inheritParent`。
    - メッセージツールのリアクションは、`user:<id>` の DM ターゲットを解決できます。
    - 返信段階の有効化フォールバック中も、`guilds.<guild>.channels.<channel>.requireMention: false` は保持されます。

    チャンネルトピックは **信頼されていない** コンテキストとして注入されます。許可リストはエージェントをトリガーできるユーザーを制限しますが、補足コンテキスト全体の秘匿化境界ではありません。

  </Accordion>

  <Accordion title="サブエージェント用のスレッド紐付けセッション">
    Discord では、スレッドをセッションターゲットに紐付けることで、そのスレッド内の後続メッセージを同じセッション（サブエージェントセッションを含む）へ引き続きルーティングできます。

    コマンド:

    - `/focus <target>` 現在または新しいスレッドをサブエージェント/セッションターゲットに紐付ける
    - `/unfocus` 現在のスレッドの紐付けを解除する
    - `/agents` アクティブな実行と紐付け状態を表示する
    - `/session idle <duration|off>` フォーカス中の紐付けに対する非アクティブ時の自動フォーカス解除を確認/更新する
    - `/session max-age <duration|off>` フォーカス中の紐付けに対する最大有効期間を確認/更新する

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

    - `session.threadBindings.*` はグローバルなデフォルトを設定します。`channels.discord.threadBindings.*` は Discord の動作を上書きします。
    - `spawnSessions` は、`sessions_spawn({ thread: true })` および ACP スレッド生成時のスレッド自動作成・バインドを制御します。デフォルト: `true`。
    - `defaultSpawnContext` は、スレッドにバインドされた生成でのネイティブサブエージェントのコンテキストを制御します。デフォルト: `"fork"`。
    - 非推奨の `spawnSubagentSessions`/`spawnAcpSessions` キーは、`openclaw doctor --fix` によって移行されます。
    - アカウントでスレッドバインドが無効になっている場合、`/focus` および関連するスレッドバインド操作は利用できません。

    [サブエージェント](/ja-JP/tools/subagents)、[ACP エージェント](/ja-JP/tools/acp-agents)、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

  </Accordion>

  <Accordion title="永続的な ACP チャンネルバインド">
    安定した「常時稼働」の ACP ワークスペースには、Discord の会話を対象とするトップレベルの型付き ACP バインドを設定します。

    設定パス: `type: "acp"` および `match.channel: "discord"` を持つ `bindings[]`。

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

    - `/acp spawn codex --bind here` は、現在のチャンネルまたはスレッドをその場でバインドし、以降のメッセージを同じ ACP セッションで処理し続けます。スレッドメッセージは親チャンネルのバインドを継承します。
    - バインドされたチャンネルまたはスレッドでは、`/new` と `/reset` は同じ ACP セッションをその場でリセットします。一時的なスレッドバインドが有効な間は、対象の解決を上書きできます。
    - `spawnSessions` は、`--thread auto|here` による子スレッドの作成・バインドを制限します。

    バインド動作の詳細については、[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

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
    - エージェント ID の絵文字へのフォールバック（`agents.list[].identity.emoji`、なければ「👀」）

    注記:

    - Discord では Unicode 絵文字またはカスタム絵文字名を使用できます。
    - チャンネルまたはアカウントでリアクションを無効にするには、`""` を使用します。

    **スコープ（`messages.ackReactionScope`）:**

    値: `"all"`（DM + グループ。常時受信するルームイベントを含む）、`"direct"`（DM のみ）、`"group-all"`（常時受信するルームイベントを除くすべてのグループメッセージ。DM なし）、`"group-mentions"`（ボットがメンションされたグループ。**DM なし**、デフォルト）、`"off"` / `"none"`（無効）。

    <Note>
    デフォルトのスコープ（`"group-mentions"`）では、ダイレクトメッセージや常時受信するルームイベントで確認リアクションは実行されません。受信した Discord DM および発言のないルームイベントで確認リアクションを得るには、`messages.ackReactionScope` を `"all"` に設定します。
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
    `channels.discord.proxy` を使用して、Discord Gateway の WebSocket トラフィックおよび起動時の REST ルックアップ（アプリケーション ID + 許可リストの解決）を HTTP(S) プロキシ経由でルーティングします。
    Discord Gateway の WebSocket プロキシは明示的に設定します。WebSocket 接続は Gateway プロセスの環境にあるプロキシ環境変数を継承しません。`channels.discord.proxy` が設定されている場合、起動時の REST ルックアップはこのプロキシを使用します。

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
    PluralKit の解決を有効にして、プロキシされたメッセージをシステムメンバーの ID にマッピングします。

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 任意。非公開システムでは必要
      },
    },
  },
}
```

    注:

    - 許可リストでは `pk:<memberId>` を使用できます
    - メンバーの表示名は、`channels.discord.dangerouslyAllowNameMatching: true` の場合にのみ名前またはスラッグで照合されます
    - 検索では、元のメッセージ ID を使用して PluralKit API に問い合わせます
    - 検索に失敗した場合、プロキシされたメッセージはボットメッセージとして扱われ、`allowBots` で許可されていない限り破棄されます

  </Accordion>

  <Accordion title="送信メンションのエイリアス">
    既知の Discord ユーザーに対してエージェントが決定的な送信メンションを必要とする場合は、`mentionAliases` を使用します。キーは先頭の `@` を除いたハンドル、値は Discord ユーザー ID です。不明なハンドル、`@everyone`、`@here`、および Markdown コードスパン内のメンションは変更されません。

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
    ステータスまたはアクティビティフィールドを設定した場合、あるいは自動プレゼンスを有効にした場合に、プレゼンスの更新が適用されます。

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
      activity: "集中時間",
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
      activity: "ライブコーディング",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    アクティビティタイプの対応表:

    - 0: プレイ中
    - 1: 配信中（`activityUrl` が必要。さらに `activityUrl` には `activityType: 1` が必要）
    - 2: 再生中
    - 3: 視聴中
    - 4: カスタム（アクティビティテキストをステータス状態として使用。絵文字は任意）
    - 5: 競争中

    自動プレゼンス（ランタイムの正常性シグナル）:

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "トークンを使い切りました",
      },
    },
  },
}
```

    自動プレゼンスは、ランタイムの可用性を Discord ステータスに対応付けます。正常 => オンライン、機能低下または不明 => 退席中、枯渇または利用不可 => 取り込み中。デフォルト: `intervalMs` は 30000、`minUpdateIntervalMs` は 15000（`intervalMs` 以下である必要があります）。任意のテキスト上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（`{reason}` プレースホルダーをサポート）

  </Accordion>

  <Accordion title="Discord での承認">
    Discord は DM でのボタンベースの承認処理をサポートし、必要に応じて承認プロンプトを元のチャンネルにも投稿できます。

    設定パス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバック）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    `enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `commands.ownerAllowFrom` から少なくとも 1 人の承認者を解決できる場合、Discord はネイティブの実行承認を自動的に有効化します。Discord は、チャンネルの `allowFrom`、レガシーな `dm.allowFrom`、またはダイレクトメッセージの `defaultTo` から実行承認者を推測しません。ネイティブ承認クライアントとしての Discord を明示的に無効化するには、`enabled: false` を設定します。

    `/diagnostics` や `/export-trajectory` など、機密性の高い所有者専用グループコマンドの場合、OpenClaw は承認プロンプトと最終結果を非公開で送信します。呼び出した所有者に Discord の所有者ルートがある場合は、最初に Discord DM を試みます。それ以外の場合は、Telegram など、`commands.ownerAllowFrom` から利用可能な最初の所有者ルートにフォールバックします。

    `target` が `channel` または `both` の場合、承認プロンプトはチャンネルに表示されます。解決済みの承認者だけがボタンを使用でき、その他のユーザーには一時的な拒否メッセージが表示されます。承認プロンプトにはコマンドテキストが含まれるため、チャンネルへの配信は信頼できるチャンネルでのみ有効にしてください。セッションキーからチャンネル ID を導出できない場合、OpenClaw は DM 配信にフォールバックします。

    Discord は、他のチャットチャンネルでも使用される共有承認ボタンをレンダリングします。ネイティブ Discord アダプターが主に追加するのは、承認者への DM ルーティングとチャンネルへのファンアウトです。これらのボタンが存在する場合、それらが主要な承認 UX になります。OpenClaw が手動の `/approve` コマンドを含めるのは、ツール結果でチャット承認が利用できないと示された場合、または手動承認が唯一の経路である場合に限ります。Discord のネイティブ承認ランタイムがアクティブでない場合、OpenClaw はローカルで決定的な `/approve <id> <decision>` プロンプトを表示したままにします。ランタイムがアクティブでも、ネイティブカードをどの宛先にも配信できない場合、OpenClaw は保留中の承認に含まれる正確な `/approve` コマンドとともに、同じチャットへフォールバック通知を送信します。

    Gateway の認証と承認の解決は、共有 Gateway クライアント契約に従います（`plugin:` ID は `plugin.approval.resolve`、その他の ID は `exec.approval.resolve` で解決）。承認はデフォルトで 30 分後に期限切れになります。

    [実行承認](/ja-JP/tools/exec-approvals)を参照してください。

  </Accordion>
</AccordionGroup>

## ツールとアクションゲート

Discord のメッセージアクションには、メッセージング、チャンネル管理、モデレーション、プレゼンス、メタデータが含まれます。

主な例:

- メッセージング: `sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- リアクション: `react`、`reactions`、`emojiList`
- モデレーション: `timeout`、`kick`、`ban`
- プレゼンス: `setPresence`

`event-create` アクションは、スケジュール済みイベントのカバー画像を設定するための任意の `image` パラメーター（URL またはローカルファイルパス）を受け付けます。

アクションゲートは `channels.discord.actions.*` 配下にあります。

デフォルトのゲート動作:

| アクショングループ                                                                                                                                                             | デフォルト |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 有効       |
| roles                                                                                                                                                                    | 無効       |
| moderation                                                                                                                                                               | 無効       |
| presence                                                                                                                                                                 | 無効       |

## Components v2 UI

OpenClaw は、実行承認とコンテキスト間マーカーに Discord components v2 を使用します。Discord メッセージアクションは、カスタム UI 用の `components` も受け付けます（高度な機能。discord ツールを使用してコンポーネントペイロードを構築する必要があります）。レガシーな `embeds` も引き続き利用できますが、推奨されません。

- `channels.discord.ui.components.accentColor` は、Discord コンポーネントコンテナで使用するアクセントカラー（16 進数）を設定します。アカウントごと: `channels.discord.accounts.<id>.ui.components.accentColor`。
- `channels.discord.agentComponents.ttlMs` は、送信済み Discord コンポーネントのコールバックを登録したままにする期間を制御します（デフォルト `1800000`、最大 `86400000`）。アカウントごと: `channels.discord.accounts.<id>.agentComponents.ttlMs`。
- components v2 が存在する場合、`embeds` は無視されます。
- 通常の URL プレビューはデフォルトで抑制されます。単一の送信リンクを展開する場合は、メッセージアクションに `suppressEmbeds: false` を設定します。

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

Discord には 2 つの異なる音声サーフェスがあります。リアルタイムの**ボイスチャンネル**（継続的な会話）と、**ボイスメッセージの添付ファイル**（波形プレビュー形式）です。Gateway は両方をサポートします。

### ボイスチャンネル

セットアップチェックリスト:

1. Discord Developer Portal で Message Content Intent を有効にします。
2. ロールまたはユーザーの許可リストを使用する場合は、Server Members Intent を有効にします。
3. `bot` および `applications.commands` スコープでボットを招待します。
4. 対象のボイスチャンネルで Connect、Speak、Send Messages、Read Message History を付与します。
5. ネイティブコマンド（`commands.native` または `channels.discord.commands.native`）を有効にします。
6. `channels.discord.voice` を設定します。

セッションを制御するには `/vc join|leave|status` を使用します。このコマンドはアカウントのデフォルトエージェントを使用し、他の Discord コマンドと同じ許可リストおよびグループポリシーのルールに従います。

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

注:

- Discord 音声は、テキスト専用設定ではオプトインです。`channels.discord.voice.enabled=true` を設定する（または既存の `channels.discord.voice` ブロックを維持する）と、`/vc` コマンド、音声ランタイム、`GuildVoiceStates` Gateway インテントが有効になります。`channels.discord.intents.voiceStates` でインテントのサブスクリプションを明示的に上書きできます。設定しない場合は、実際の音声有効化状態に従います。
- `voice.mode` は会話経路を制御します。デフォルトは `agent-proxy` です。リアルタイム音声フロントエンドがターンのタイミング、中断、再生を処理し、実質的な処理を `openclaw_agent_consult` 経由でルーティング先の OpenClaw エージェントに委任し、その結果を発話者が入力した Discord プロンプトと同様に扱います。`stt-tts` は従来のバッチ STT と TTS のフローを維持します。`bidi` では、OpenClaw の頭脳用に `openclaw_agent_consult` を公開しながら、リアルタイムモデルが直接会話できます。
- `voice.agentSession` は、音声ターンを受け取る OpenClaw の会話を制御します。音声チャンネル独自のセッションを使用する場合は設定せず、音声チャンネルを `#maintainers` などの既存の Discord テキストチャンネルセッションのマイク／スピーカー拡張として機能させる場合は、`{ mode: "target", target: "channel:<text-channel-id>" }` を設定します。
- `voice.model` は、Discord 音声応答とリアルタイムコンサルトに使用する OpenClaw エージェントの頭脳を上書きします。ルーティング先エージェントのモデルを継承する場合は設定しません。これは `voice.realtime.model` とは別です。
- `voice.followUsers` を使用すると、選択したユーザーに合わせてボットが Discord 音声に参加、移動、退出できます。[音声でユーザーを追跡する](#follow-users-in-voice)を参照してください。
- `agent-proxy` は音声を `discord-voice` 経由でルーティングします。これにより、発話者と対象セッションに対する通常の所有者／ツール認可を維持しながら、Discord 音声が再生を担うため、エージェントの `tts` ツールは非表示になります。デフォルトでは、`agent-proxy` は所有者である発話者からのコンサルトに所有者相当の完全なツールアクセスを付与し（`voice.realtime.toolPolicy: "owner"`）、実質的な回答の前に OpenClaw エージェントへコンサルトすることを強く優先します（`voice.realtime.consultPolicy: "always"`）。このデフォルトの `always` モードでは、リアルタイム層はコンサルト回答の前に自動でつなぎの発話を行いません。音声を取得して文字起こしした後、ルーティング先の OpenClaw の回答を発話します。Discord が最初の回答を再生している間に複数の強制コンサルト回答が完了した場合、後続の完全発話回答は文の途中で音声を置き換えず、再生がアイドル状態になるまでキューに格納されます。
- `stt-tts` モードでは、STT は `tools.media.audio` を使用します。`voice.model` は文字起こしに影響しません。
- リアルタイムモードでは、`voice.realtime.provider`、`voice.realtime.model`、`voice.realtime.speakerVoice` がリアルタイム音声セッションを設定します。OpenAI Realtime 2.1 と Codex の頭脳を組み合わせる場合は、`voice.realtime.model: "gpt-realtime-2.1"` と `voice.model: "openai/gpt-5.6-sol"` を使用します。
- リアルタイム音声モードでは、デフォルトで小さな `IDENTITY.md`、`USER.md`、`SOUL.md` プロファイルファイルがリアルタイムプロバイダーの指示に含まれるため、高速な直接ターンでも、ルーティング先の OpenClaw エージェントと同じアイデンティティ、ユーザー情報に基づく応答、ペルソナが維持されます。これをカスタマイズするには `voice.realtime.bootstrapContextFiles` にサブセットを設定し、無効にするには `[]` を設定します。サポートされるのはこれらのプロファイルファイルのみです。`AGENTS.md` は通常のエージェントコンテキストに残ります。挿入されたプロファイルコンテキストは、ワークスペースでの作業、最新情報、メモリ検索、ツールを利用するアクションにおける `openclaw_agent_consult` の代わりにはなりません。
- OpenAI の `agent-proxy` リアルタイムモードでは、`voice.realtime.requireWakeName: true` を設定すると、文字起こしの先頭または末尾にウェイクネームが含まれるまで Discord リアルタイム音声を無言に保てます。設定するウェイクネームは 1 語または 2 語である必要があります。`voice.realtime.wakeNames` が設定されていない場合、OpenClaw はルーティング先エージェントの `name` と `OpenClaw` を使用し、フォールバックとしてエージェント ID と `OpenClaw` を使用します。ウェイクネームによるゲーティングは、リアルタイムプロバイダーの自動応答を無効にし、受け付けたターンを OpenClaw エージェントのコンサルト経路にルーティングします。また、最終的な文字起こしが到着する前に部分的な文字起こしから先頭のウェイクネームが認識されると、短い音声確認を返します。
- OpenAI リアルタイムプロバイダーは、出力音声イベントと文字起こしイベントについて、現在の Realtime 2 イベント名と従来の Codex 互換エイリアスを受け付けます。そのため、互換性のあるプロバイダーのスナップショットに差異が生じても、アシスタント音声が欠落しません。
- `voice.realtime.bargeIn` は、Discord の発話者開始イベントで、再生中のリアルタイム音声を中断するかどうかを制御します。設定されていない場合は、リアルタイムプロバイダーの入力音声中断設定に従います。
- `voice.realtime.minBargeInAudioEndMs` は、OpenAI リアルタイムの割り込みで音声を切り詰めるまでに必要な、アシスタント再生の最小継続時間を制御します。デフォルト：`250`。エコーの少ない部屋で即座に中断するには `0` を設定し、エコーの多いスピーカー環境では値を大きくします。
- `voice.tts` は、`stt-tts` 音声再生の場合にのみ `messages.tts` を上書きします。リアルタイムモードでは代わりに `voice.realtime.speakerVoice` を使用します。Discord 再生で OpenAI の音声を使用するには、`voice.tts.provider: "openai"` を設定し、`voice.tts.providers.openai.speakerVoice` で Text-to-speech 音声を選択します。現在の OpenAI TTS モデルでは、`cedar` は男性的な響きの適切な選択肢です。
- チャンネルごとの Discord `systemPrompt` の上書きは、その音声チャンネルの音声文字起こしターンに適用されます。
- 音声文字起こしターンは、所有者限定コマンドとチャンネルアクションの所有者ステータスを Discord の `allowFrom`（または `dm.allowFrom`）から導出します。エージェントツールの可視性は、ルーティング先セッションに設定されたツールポリシーに従います。
- `voice.autoJoin` に同じギルドのエントリが複数ある場合、OpenClaw はそのギルドについて最後に設定されたチャンネルに参加します。
- `voice.allowedChannels` は、省略可能な常駐許可リストです。設定しない場合、`/vc join` で認可済みの任意の Discord 音声チャンネルに参加できます。設定した場合、`/vc join`、起動時の自動参加、ボットの音声状態による移動は、一覧に含まれる `{ guildId, channelId }` エントリに制限されます。空の配列に設定すると、Discord 音声への参加をすべて拒否します。Discord がボットを許可リスト外に移動した場合、OpenClaw はそのチャンネルから退出し、設定済みの自動参加先があればそこへ再参加します。
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は、`@discordjs/voice` の参加オプションにそのまま渡されます。アップストリームのデフォルトは `daveEncryption=true` と `decryptionFailureTolerance=24` です。
- OpenClaw は、Discord 音声受信とリアルタイムの生 PCM 再生に、同梱の `libopus-wasm` コーデックを使用します。固定バージョンの libopus WebAssembly ビルドが同梱されており、ネイティブの opus アドオンは不要です。
- `voice.connectTimeoutMs` は、`/vc join` と自動参加試行での最初の `@discordjs/voice` Ready 待機時間を制御します。デフォルト：`30000`。
- `voice.reconnectGraceMs` は、切断された音声セッションが再接続を開始するまで、OpenClaw が破棄せずに待機する時間を制御します。デフォルト：`15000`。
- `stt-tts` モードでは、別のユーザーが話し始めただけでは音声再生は停止しません。フィードバックループを避けるため、OpenClaw は TTS の再生中、新しい音声取得を無視します。次のターンでは、再生が完了してから話してください。リアルタイムモードでは、発話者の開始を割り込みシグナルとしてリアルタイムプロバイダーに転送します。
- リアルタイムモードでは、スピーカーから開いたマイクに入るエコーが割り込みとみなされ、再生が中断されることがあります。エコーの多い Discord ルームでは、`voice.realtime.providers.openai.interruptResponseOnInputAudio: false` を設定し、入力音声による OpenAI の自動中断を防ぎます。それでも Discord の発話者開始イベントで再生中の音声を中断する場合は、`voice.realtime.bargeIn: true` を追加します。OpenAI リアルタイムブリッジは、`voice.realtime.minBargeInAudioEndMs` より短い再生切り詰めをエコー／ノイズの可能性が高いものとして無視し、Discord の再生をクリアせず、スキップとしてログに記録します。
- `voice.captureSilenceGraceMs` は、Discord が発話者の停止を報告してから、その音声セグメントを STT 用に確定するまで OpenClaw が待機する時間を制御します。デフォルト：`2000`。Discord が通常の間を細切れの部分文字起こしに分割する場合は、この値を大きくします。
- ElevenLabs が選択中の TTS プロバイダーである場合、Discord 音声再生はストリーミング TTS を使用し、プロバイダーの応答ストリームから再生を開始します。ストリーミングをサポートしないプロバイダーは、合成された一時ファイル経路にフォールバックします。
- OpenClaw は受信時の復号失敗を監視し、短時間に失敗が繰り返された場合は、音声チャンネルから退出して再参加することで自動復旧します。
- 更新後、受信ログに `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し表示される場合は、依存関係レポートとログを収集してください。同梱される `@discordjs/voice` 系列には、discord.js issue #11419 を解決した discord.js PR #11449 のアップストリームのパディング修正が含まれています。
- `The operation was aborted` 受信イベントは、OpenClaw が取得済みの発話者セグメントを確定するときに発生する想定内のものです。これは詳細診断であり、警告ではありません。
- Discord 音声の詳細ログには、受け付けた各発話者セグメントについて、長さを制限した 1 行の STT 文字起こしプレビューが含まれます。これにより、文字起こしテキストを無制限に出力せずに、デバッグ時にユーザー側とエージェント応答側の両方を確認できます。
- `agent-proxy` モードでは、強制コンサルトのフォールバックは、末尾が `...` のテキストや「and」のような接続語で終わるテキストなど、未完了である可能性が高い文字起こし断片に加えて、「be right back」や「bye」のような明らかにアクション不要な締めの発話をスキップします。これにより古いキュー済み回答を防いだ場合、ログに `forced agent consult skipped reason=...` と表示されます。

### 音声でユーザーを追跡する

起動時に固定チャンネルへ参加したり、`/vc join` を待ったりする代わりに、Discord 音声ボットを既知の 1 人以上の Discord ユーザーと同じ場所に常駐させる場合は、`voice.followUsers` を使用します。

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

動作：

- `followUsers` は、生の Discord ユーザー ID と `discord:<id>` 値を受け付けます。OpenClaw は音声状態イベントと照合する前に、両方の形式を正規化します。
- `followUsers` が設定されている場合、`followUsersEnabled` のデフォルトは `true` です。保存済みリストを維持したまま音声の自動追跡を停止するには、`false` に設定します。
- 追跡対象ユーザーが許可済みの音声チャンネルに参加すると、OpenClaw もそのチャンネルに参加します。ユーザーが移動すると、OpenClaw も一緒に移動します。現在追跡中のユーザーが切断すると、OpenClaw は退出します。
- 複数の追跡対象ユーザーが同じギルドにいて、現在追跡中のユーザーが退出した場合、OpenClaw はギルドから退出する前に、別の追跡対象ユーザーのチャンネルへ移動します。複数の追跡対象ユーザーが同時に移動した場合は、最後に観測された音声状態イベントが優先されます。
- `allowedChannels` は引き続き適用されます。許可されていないチャンネルにいる追跡対象ユーザーは無視され、追跡によって所有されるセッションは別の追跡対象ユーザーへ移動するか、退出します。
- OpenClaw は、起動時および制限された間隔で、取りこぼした音声状態イベントを整合させます。整合処理は設定済みギルドをサンプリングし、1 回の実行あたりの REST 検索数に上限を設けます。そのため、非常に大きな `followUsers` リストでは、収束に複数の間隔が必要になる場合があります。
- ユーザーを追跡中に Discord または管理者がボットを移動した場合、移動先が許可されていれば、OpenClaw は音声セッションを再構築し、追跡の所有状態を維持します。ボットが `allowedChannels` の外へ移動された場合、OpenClaw は退出し、設定済みの対象があればそこへ再参加します。
- DAVE の受信復旧では、復号失敗が繰り返された後に同じチャンネルから退出して再参加することがあります。追跡によって所有されるセッションでは、この復旧経路を通して追跡の所有状態が維持されるため、その後に追跡対象ユーザーが切断した場合もチャンネルから退出します。

参加モードの選択：

- 自分が音声にいるときにボットも自動的に音声に参加する、個人またはオペレーター向けの設定には `followUsers` を使用します。
- 追跡対象ユーザーが音声にいない場合でも常駐する必要がある固定ルームのボットには、`autoJoin` を使用します。
- 一度限りの参加や、自動的な音声常駐が意外に思われるルームには、`/vc join` を使用します。

Discord 音声コーデック：

- 音声受信ログには `discord voice: opus decoder: libopus-wasm` と表示されます。
- リアルタイム再生では、パケットを `@discordjs/voice` に渡す前に、同じ同梱の `libopus-wasm` パッケージを使用して、生の 48 kHz ステレオ PCM を Opus にエンコードします。
- ファイルおよびプロバイダーストリームの再生では、ffmpeg を使用して生の 48 kHz ステレオ PCM にトランスコードし、その後、Discord に送信する Opus パケットストリームに `libopus-wasm` を使用します。

STT と TTS のパイプライン：

- Discord の PCM キャプチャは一時 WAV ファイルに変換されます。
- `tools.media.audio` が STT を処理します（例: `openai/gpt-4o-mini-transcribe`）。
- トランスクリプトは Discord の受信処理とルーティングを通じて送信されます。その際、応答 LLM は、エージェントの `tts` ツールを非表示にし、テキストを返すよう求める音声出力ポリシーで実行されます。最終的な TTS 再生は Discord 音声が担当するためです。
- `voice.model` を設定すると、この音声チャンネルのターンに限り、応答 LLM のみが上書きされます。
- `voice.tts` は `messages.tts` にマージされます。ストリーミング対応プロバイダーはプレーヤーに直接供給し、それ以外の場合は生成された音声ファイルが参加中のチャンネルで再生されます。

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

`voice.agentSession` ブロックがない場合、各音声チャンネルにはそれぞれ独自にルーティングされた OpenClaw セッションが割り当てられます。たとえば、`/vc join channel:234567890123456789` は、その Discord 音声チャンネル用のセッションと対話します。リアルタイムモデルは音声フロントエンドにすぎず、実質的なリクエストは設定された OpenClaw エージェントに渡されます。リアルタイムモデルが consult ツールを呼び出さずに最終トランスクリプトを生成した場合、OpenClaw はフォールバックとして consult を強制し、デフォルトでもエージェントと話しているように動作させます。

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

`agent-proxy` モードでは、ボットは設定された音声チャンネルに参加しますが、OpenClaw エージェントのターンでは、対象チャンネルの通常のルーティング済みセッションとエージェントが使用されます。リアルタイム音声セッションは、返された結果を音声チャンネルで読み上げます。スーパーバイザーエージェントは引き続き、そのツールポリシーに従って通常のメッセージツールを使用できます。適切なアクションであれば、別個の Discord メッセージを送信することも可能です。

委任された OpenClaw の実行中は、別のエージェントターンを開始する前に、新しい Discord 音声トランスクリプトが実行中の処理に対するライブ制御として扱われます。「status」、「cancel that」、「use the smaller fix」、「when you're done also check tests」などのフレーズは、アクティブなセッションに対するステータス、キャンセル、方向修正、フォローアップ入力として分類されます。ステータス、キャンセル、受け付けられた方向修正、フォローアップの結果は音声チャンネルで読み上げられるため、呼び出し元は OpenClaw がリクエストを処理したかどうかを確認できます。

使用可能な対象形式:

- `target: "channel:123456789012345678"` は Discord テキストチャンネルのセッションを経由してルーティングします。
- `target: "123456789012345678"` はチャンネル対象として扱われます。
- `target: "dm:123456789012345678"` または `target: "user:123456789012345678"` は、そのダイレクトメッセージセッションを経由してルーティングします。

エコーが多い環境での OpenAI Realtime の例:

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

オープンマイクを通じてモデルが自身の Discord 再生音を拾う環境でも、発話によって割り込みたい場合に使用します。OpenClaw は、生の入力音声による OpenAI の自動割り込みを防ぎます。一方で、`bargeIn: true` により、Discord の話者開始イベントと、すでにアクティブな話者の音声によって、次にキャプチャされたターンが OpenAI に到達する前に、アクティブなリアルタイム応答をキャンセルできます。`audioEndMs` が `minBargeInAudioEndMs` 未満の非常に早い割り込みシグナルは、エコーやノイズの可能性が高いものとして無視されるため、モデルが最初の再生フレームで途切れることはありません。

想定される音声ログ:

- 参加時: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- リアルタイム開始時: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 話者音声の受信時: `discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`、および `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 古くなった発話をスキップしたとき: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` または `reason=non-actionable-closing ...`
- リアルタイム応答の完了時: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 再生の停止またはリセット時: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- リアルタイム consult 時: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- エージェントの回答時: `discord voice: agent turn answer ...`
- 正確な発話をキューに追加したとき: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`、続いて `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 割り込み検出時: `discord voice: realtime barge-in detected source=speaker-start ...` または `discord voice: realtime barge-in detected source=active-speaker-audio ...`、続いて `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- リアルタイム割り込み時: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`、続いて `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` または `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- エコーやノイズを無視したとき: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 割り込みが無効なとき: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 再生がアイドル状態のとき: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

音声の途切れをデバッグするには、リアルタイム音声ログを時系列として確認します:

1. `realtime audio playback started` は、Discord がアシスタント音声の再生を開始したことを意味します。この時点から、ブリッジはアシスタントの出力チャンク数、Discord PCM バイト数、プロバイダーのリアルタイムバイト数、合成音声の長さをカウントし始めます。
2. `realtime speaker turn opened` は、Discord の話者がアクティブになったことを示します。再生がすでにアクティブで `bargeIn` が有効な場合、その後に `barge-in detected source=speaker-start` が続くことがあります。
3. `realtime input audio started` は、その話者ターンで最初の実音声フレームを受信したことを示します。ここで `outputActive=true` またはゼロ以外の `outputAudioMs` が記録されている場合、アシスタントの再生中にマイクが入力を送信しています。
4. `barge-in detected source=active-speaker-audio` は、アシスタントの再生中に OpenClaw がライブの話者音声を検出したことを意味します。これは、実際の割り込みと、有用な音声を伴わない Discord の話者開始イベントを区別するのに役立ちます。
5. `barge-in requested reason=...` は、OpenClaw がリアルタイムプロバイダーに対し、アクティブな応答のキャンセルまたは切り詰めを要求したことを意味します。`outputAudioMs`、`outputActive`、`playbackChunks` が含まれているため、割り込み前にアシスタント音声が実際にどの程度再生されていたかを確認できます。
6. `realtime audio playback stopped reason=...` は、ローカルの Discord 再生がリセットされた時点を示します。理由から、再生を停止した主体が分かります: `barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close`、または `session-close`。
7. `realtime speaker turn closed` は、キャプチャされた入力ターンを要約します。`chunks=0` または `hasAudio=false` は、話者ターンは開始されたものの、使用可能な音声がリアルタイムブリッジに到達しなかったことを意味します。`interruptedPlayback=true` は、その入力ターンがアシスタント出力と重なり、割り込みロジックが作動したことを意味します。

有用なフィールド:

- `outputAudioMs`: そのログ行までにリアルタイムプロバイダーが生成したアシスタント音声の長さ。
- `audioMs`: 再生が停止するまでに OpenClaw がカウントしたアシスタント音声の長さ。
- `elapsedMs`: 再生ストリームまたは話者ターンの開始から終了までの実時間。
- `discordBytes`: Discord 音声に送信、または Discord 音声から受信した 48 kHz ステレオ PCM のバイト数。
- `realtimeBytes`: リアルタイムプロバイダーに送信、またはリアルタイムプロバイダーから受信したプロバイダー形式の PCM バイト数。
- `playbackChunks`: アクティブな応答について Discord に転送されたアシスタント音声チャンク数。
- `sinceLastAudioMs`: 最後にキャプチャされた話者音声フレームから話者ターンの終了までの間隔。

一般的なパターン:

- `source=active-speaker-audio`、小さい `outputAudioMs`、および同じユーザーが近くにいる状況で即座に途切れる場合、通常はスピーカーのエコーがマイクに入っていることを示します。`voice.realtime.minBargeInAudioEndMs` を引き上げる、スピーカー音量を下げる、ヘッドフォンを使用する、または `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` を設定してください。
- `source=speaker-start` の後に `speaker turn closed ... hasAudio=false` が続く場合、Discord は話者の開始を報告しましたが、音声は OpenClaw に到達していません。これは、一時的な Discord 音声イベント、ノイズゲートの動作、またはクライアントが一瞬だけマイクを有効にしたことが原因である可能性があります。
- 近くに割り込みや `provider-clear-audio` がない状態で `audio playback stopped reason=stream-close` が記録されている場合、ローカルの Discord 再生ストリームが予期せず終了しています。直前のプロバイダーおよび Discord プレーヤーのログを確認してください。
- `capture ignored during playback (barge-in disabled)` は、アシスタント音声の再生中に OpenClaw が意図的に入力を破棄したことを意味します。発話によって再生を中断したい場合は、`voice.realtime.bargeIn` を有効にしてください。
- `barge-in ignored ... outputActive=false` は、Discord またはプロバイダーの VAD が発話を報告したものの、OpenClaw に割り込み対象のアクティブな再生がなかったことを意味します。これによって音声が途切れることはありません。

認証情報はコンポーネントごとに解決されます。`voice.model` には LLM ルート認証、`tools.media.audio` には STT 認証、`messages.tts`/`voice.tts` には TTS 認証、`voice.realtime.providers` またはプロバイダーの通常の認証設定にはリアルタイムプロバイダー認証が使用されます。

### 音声メッセージ

Discord の音声メッセージには波形プレビューが表示され、OGG/Opus 音声が必要です。OpenClaw は波形を自動生成しますが、検査と変換を行うには Gateway ホスト上に `ffmpeg` と `ffprobe` が必要です。

- **ローカルファイルパス**を指定します（URL は拒否されます）。
- テキストコンテンツは省略します（Discord は同じペイロード内のテキストと音声メッセージの併用を拒否します）。
- どの音声形式でも使用できます。OpenClaw が必要に応じて OGG/Opus に変換します。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていないインテントが使用された、またはボットにギルドメッセージが表示されない">

    - Message Content Intent を有効にする
    - ユーザーまたはメンバーの解決に依存する場合は Server Members Intent を有効にする
    - Intent を変更した後は Gateway を再起動する

  </Accordion>

  <Accordion title="ギルドメッセージが予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` 配下のギルド許可リストを確認する
    - ギルドに `channels` マップが存在する場合、一覧に含まれるチャンネルのみが許可される
    - `requireMention` の動作とメンションパターンを確認する

    有用な確認コマンド:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="メンション必須が false でもブロックされる">
    一般的な原因:

    - 一致するギルドまたはチャンネルの許可リストがない状態で `groupPolicy="allowlist"` が設定されている
    - `requireMention` が誤った場所に設定されている（`channels.discord.guilds` またはチャンネルエントリの配下に置く必要がある）
    - 送信者がギルドまたはチャンネルの `users` 許可リストによってブロックされている

  </Accordion>

  <Accordion title="長時間実行される Discord ターンまたは重複返信">

    典型的なログ:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway キューの調整項目:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - 複数アカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - これは Discord Gateway リスナーの処理のみを制御し、エージェントターンの存続時間は制御しない

    Discord は、キューに入ったエージェントターンにチャンネル固有のタイムアウトを適用しません。メッセージリスナーは即座に処理を引き渡し、キューに入った Discord の実行は、セッション、ツール、またはランタイムのライフサイクルが処理を完了または中止するまで、セッション単位の順序を維持します。

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
    OpenClaw は接続前に Discord の `/gateway/bot` メタデータを取得します。一時的な障害が発生した場合は Discord のデフォルト Gateway URL にフォールバックし、ログ出力はレート制限されます。

    メタデータのタイムアウト調整項目:

    - 単一アカウント: `channels.discord.gatewayInfoTimeoutMs`
    - 複数アカウント: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 設定が未指定の場合の環境変数フォールバック: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - デフォルト: `30000`（30 秒）、最大: `120000`

  </Accordion>

  <Accordion title="Gateway READY タイムアウトによる再起動">
    OpenClaw は起動時およびランタイムの再接続後に、Discord Gateway の `READY` イベントを待機します。起動を段階的にずらす複数アカウント構成では、デフォルトより長い起動時 READY 待機時間が必要になる場合があります。

    READY タイムアウトの調整項目:

    - 起動時の単一アカウント: `channels.discord.gatewayReadyTimeoutMs`
    - 起動時の複数アカウント: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 設定が未指定の場合の起動時環境変数フォールバック: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 起動時のデフォルト: `15000`（15 秒）、最大: `120000`
    - ランタイムの単一アカウント: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - ランタイムの複数アカウント: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 設定が未指定の場合のランタイム環境変数フォールバック: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - ランタイムのデフォルト: `30000`（30 秒）、最大: `120000`

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` の権限確認は、数値のチャンネル ID でのみ機能します。

    スラッグキーを使用している場合、ランタイムでの照合は引き続き機能する可能性がありますが、プローブでは権限を完全に検証できません。

  </Accordion>

  <Accordion title="DM とペアリングの問題">

    - DM が無効: `channels.discord.dm.enabled=false`
    - DM ポリシーが無効: `channels.discord.dmPolicy="disabled"`（旧形式: `channels.discord.dm.policy`）
    - `pairing` モードでペアリングの承認待ち

  </Accordion>

  <Accordion title="Bot 間のループ">
    デフォルトでは、Bot が作成したメッセージは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、ループ動作を防ぐために厳格なメンションルールと許可リストルールを使用してください。
    Bot へのメンションを含む Bot メッセージのみを受け入れるには、`channels.discord.allowBots="mentions"` を推奨します。

    OpenClaw には、共通の [Bot ループ保護](/ja-JP/channels/bot-loop-protection) も含まれています。`allowBots` によって Bot が作成したメッセージがディスパッチに到達する場合、Discord は受信イベントを `(account, channel, bot pair)` の情報にマッピングし、汎用のペアガードは設定されたイベント上限を超えたペアを抑制します。このガードにより、以前は Discord のレート制限で停止する必要があった制御不能な 2 Bot 間ループを防止します。単一 Bot のデプロイや、上限内に収まる単発の Bot 返信には影響しません。

    デフォルト設定（`allowBots` が設定されている場合に有効）:

    - `maxEventsPerWindow: 20` -- Bot ペアはスライディングウィンドウ内で 20 件のメッセージを交換できる
    - `windowSeconds: 60` -- スライディングウィンドウの長さ
    - `cooldownSeconds: 60` -- 上限に達すると、どちらの方向でも追加の Bot 間メッセージは 1 分間すべて破棄される

    共通のデフォルトは `channels.defaults.botLoopProtection` 配下で一度設定し、正当なワークフローでより大きな余裕が必要な場合は Discord 側で上書きします。優先順位は次のとおりです:

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
      // 任意の Discord 全体の上書き。アカウントブロックは個別の
      // フィールドを上書きし、省略されたフィールドをここから継承します。
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha は、他の Bot が自身にメンションした場合にのみそれらを受信します。
          allowBots: "mentions",
        },
        bravo: {
          // Bravo は、Bot が作成したすべての Discord メッセージを受信します。
          allowBots: true,
          mentionAliases: {
            // 設定されたユーザー ID を使用して、Bravo が Alpha の Discord メンションを書き込めるようにします。
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // ペアを抑制する前に、1 分あたり最大 5 件のメッセージを許可します。
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

  <Accordion title="DecryptionFailed(...) による音声 STT の途切れ">

    - Discord 音声受信の復旧ロジックを利用できるよう、OpenClaw を最新に保つ（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）であることを確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（アップストリームのデフォルト）から開始し、必要な場合のみ調整する
    - 次のログを監視する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も障害が続く場合は、ログを収集し、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) および [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) にあるアップストリームの DAVE 受信履歴と比較する

  </Accordion>
</AccordionGroup>

## 設定リファレンス

主要リファレンス: [設定リファレンス - Discord](/ja-JP/gateway/config-channels#discord)。

<Accordion title="重要度の高い Discord フィールド">

- 起動/認証: `enabled`、`token`、`applicationId`、`accounts.*`、`allowBots`
- ポリシー: `groupPolicy`、`dmPolicy`、`allowFrom`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- コマンド: `commands.native`、`commands.useAccessGroups`（グローバル）、`configWrites`、`slashCommand.ephemeral`
- イベントキュー: `eventQueue.listenerTimeout`（リスナー上限、デフォルト `120000`）、`eventQueue.maxQueueSize`（デフォルト `10000`）、`eventQueue.maxConcurrency`（デフォルト `50`）
- Gateway: `proxy`、`gatewayInfoTimeoutMs`、`gatewayReadyTimeoutMs`、`gatewayRuntimeReadyTimeoutMs`
- 返信/履歴: `replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 配信: `textChunkLimit`（デフォルト `2000`）、`maxLinesPerMessage`（デフォルト `17`）
- ストリーミング: `streaming.mode`、`streaming.chunkMode`、`streaming.preview.*`、`streaming.progress.*`、`streaming.block.*`（旧形式のフラットな `streamMode`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`、`chunkMode` キーは、`openclaw doctor --fix` により `streaming.*` へ移行される）
- メディア/再試行: `mediaMaxMb`（Discord への送信アップロードを制限、デフォルト `100`）、`retry`
- アクション: `actions.*`
- プレゼンス: `activity`、`status`、`activityType`、`activityUrl`、`autoPresence.*`
- UI: `ui.components.accentColor`
- 機能: `threadBindings`、トップレベルの `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents.enabled`、`agentComponents.ttlMs`、`heartbeat`、`responsePrefix`

</Accordion>

## セキュリティと運用

- Bot トークンはシークレットとして扱う（管理された環境では `DISCORD_BOT_TOKEN` を推奨）。
- Discord の権限は最小権限で付与する。
- コマンドのデプロイまたは状態が古い場合は Gateway を再起動し、`openclaw channels status --probe` で再確認する。

## 関連項目

<CardGroup cols={2}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Discord ユーザーを Gateway とペアリングします。
  </Card>
  <Card title="グループ" icon="users" href="/ja-JP/channels/groups">
    グループチャットと許可リストの動作。
  </Card>
  <Card title="チャンネルルーティング" icon="route" href="/ja-JP/channels/channel-routing">
    受信メッセージをエージェントへルーティングします。
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
