---
read_when:
    - iMessage サポートの設定
    - iMessage の送受信のデバッグ
summary: imsg 経由（stdio 上の JSON-RPC）のネイティブ iMessage サポート。返信、タップバック、エフェクト、添付ファイル、グループ管理向けの private API アクションに対応します。ホスト要件を満たす場合、新しい OpenClaw iMessage セットアップに推奨されます。
title: iMessage
x-i18n:
    generated_at: "2026-05-13T02:51:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8125beab13c067e287f4cc041b65632989b8aaadce9b3719cc5e7312a0927aeb
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
OpenClaw iMessage デプロイでは、サインイン済みの macOS Messages ホスト上で `imsg` を使用します。Gateway が Linux または Windows で動作している場合は、Mac 上で `imsg` を実行する SSH ラッパーを `channels.imessage.cliPath` に指定します。

**Gateway 停止中のキャッチアップはオプトインです。** 有効にすると (`channels.imessage.catchup.enabled: true`)、gateway はオフライン中 (クラッシュ、再起動、Mac のスリープ) に `chat.db` に届いた受信メッセージを次回起動時に再生します。デフォルトでは無効です — [gateway 停止後のキャッチアップ](#catching-up-after-gateway-downtime)を参照してください。[openclaw#78649](https://github.com/openclaw/openclaw/issues/78649) をクローズします。
</Note>

<Warning>
BlueBubbles サポートは削除されました。`channels.bluebubbles` 設定を `channels.imessage` に移行してください。OpenClaw は `imsg` 経由の iMessage のみをサポートします。短い告知は [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage)から、完全な移行表は [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles)から始めてください。
</Warning>

ステータス: ネイティブ外部 CLI 統合。Gateway は `imsg rpc` を起動し、stdio 上の JSON-RPC で通信します (別個のデーモン/ポートはありません)。高度なアクションには `imsg launch` と、Private API プローブの成功が必要です。

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    返信、タップバック、エフェクト、添付ファイル、グループ管理。
  </Card>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    iMessage の DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gateway が Messages Mac 上で動作していない場合は SSH ラッパーを使用します。
  </Card>
  <Card title="Configuration reference" icon="settings" href="/ja-JP/gateway/config-channels#imessage">
    iMessage フィールドの完全なリファレンス。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        ペアリング要求は 1 時間後に期限切れになります。
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw が必要とするのは stdio 互換の `cliPath` だけなので、リモート Mac に SSH して `imsg` を実行するラッパースクリプトを `cliPath` に指定できます。

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    添付ファイルを有効にする場合の推奨設定:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost` が設定されていない場合、OpenClaw は SSH ラッパースクリプトを解析して自動検出を試みます。
    `remoteHost` は `host` または `user@host` である必要があります (スペースや SSH オプションは使用不可)。
    OpenClaw は SCP に厳密なホストキー確認を使用するため、リレーホストキーはすでに `~/.ssh/known_hosts` に存在している必要があります。
    添付ファイルパスは許可されたルート (`attachmentRoots` / `remoteAttachmentRoots`) に対して検証されます。

  </Tab>
</Tabs>

## 要件と権限 (macOS)

- `imsg` を実行する Mac で Messages にサインインしている必要があります。
- OpenClaw/`imsg` を実行するプロセスコンテキストにはフルディスクアクセスが必要です (Messages DB アクセス)。
- Messages.app 経由でメッセージを送信するにはオートメーション権限が必要です。
- 高度なアクション (リアクション / 編集 / 送信取消 / スレッド返信 / エフェクト / グループ操作) では、System Integrity Protection を無効にする必要があります — 下記の [imsg Private API の有効化](#enabling-the-imsg-private-api)を参照してください。基本的なテキストとメディアの送受信は、それなしで動作します。

<Tip>
権限はプロセスコンテキストごとに付与されます。gateway をヘッドレス (LaunchAgent/SSH) で実行する場合は、同じコンテキストで一度だけ対話的コマンドを実行してプロンプトを表示します。

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## imsg Private API の有効化

`imsg` は 2 つの運用モードで提供されます。

- **基本モード** (デフォルト、SIP の変更不要): `send` による送信テキストとメディア、受信ウォッチ/履歴、チャットリスト。新規の `brew install steipete/tap/imsg` と上記の標準 macOS 権限だけで、そのまま利用できるものです。
- **Private API モード**: `imsg` はヘルパー dylib を `Messages.app` に注入し、内部の `IMCore` 関数を呼び出します。これにより `react`、`edit`、`unsend`、`reply` (スレッド)、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup` に加えて、入力インジケーターと既読通知が利用可能になります。

このチャネルページで説明する高度なアクションサーフェスに到達するには、Private API モードが必要です。`imsg` README はこの要件を明示しています。

> `read`、`typing`、`launch`、ブリッジバックのリッチ送信、メッセージ変更、チャット管理などの高度な機能はオプトインです。SIP を無効にし、ヘルパー dylib を `Messages.app` に注入する必要があります。SIP が有効な場合、`imsg launch` は注入を拒否します。

ヘルパー注入の手法は、Messages の Private API に到達するために `imsg` 自身の dylib を使用します。OpenClaw iMessage パスには、サードパーティサーバーや BlueBubbles ランタイムはありません。

<Warning>
**SIP の無効化は実際のセキュリティ上のトレードオフです。** SIP は変更されたシステムコードの実行を防ぐ macOS の中核的な保護機能の 1 つです。システム全体で無効にすると、追加の攻撃面と副作用が生じます。特に、**Apple Silicon Mac で SIP を無効にすると、Mac に iOS アプリをインストールして実行する機能も無効になります**。

これはデフォルトではなく、意図的な運用上の選択として扱ってください。脅威モデルが SIP の無効化を許容できない場合、バンドルされた iMessage は基本モードに制限されます — テキストとメディアの送受信のみで、リアクション / 編集 / 送信取消 / エフェクト / グループ操作はありません。
</Warning>

### セットアップ

1. Messages.app を実行する Mac に **`imsg` をインストール (またはアップグレード) します**:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` の出力は `bridge_version`、`rpc_methods`、メソッドごとの `selectors` を報告するため、開始前に現在のビルドが何をサポートしているか確認できます。

2. **System Integrity Protection を無効にします。** 基礎となる Apple の要件が OS とハードウェアに依存するため、これは macOS バージョン固有です。
   - **macOS 10.13–10.15 (Sierra–Catalina):** Terminal で Library Validation を無効化し、Recovery Mode で再起動して `csrutil disable` を実行し、再起動します。
   - **macOS 11+ (Big Sur 以降)、Intel:** Recovery Mode (または Internet Recovery)、`csrutil disable`、再起動。
   - **macOS 11+、Apple Silicon:** 電源ボタンの起動シーケンスで Recovery に入ります。最近の macOS バージョンでは Continue をクリックするときに **Left Shift** キーを押したままにしてから、`csrutil disable` を実行します。仮想マシン設定では別のフローに従います — 先に VM スナップショットを取得してください。
   - **macOS 26 / Tahoe:** library-validation ポリシーと `imagent` Private Entitlement チェックがさらに厳格化されています。`imsg` は追従のために更新されたビルドが必要になる場合があります。macOS のメジャーアップグレード後に `imsg launch` 注入や特定の `selectors` が false を返し始めた場合は、SIP 手順が成功したと判断する前に `imsg` のリリースノートを確認してください。

   `imsg launch` を実行する前に、使用している Mac 向けの Apple の Recovery-mode フローに従って SIP を無効にします。

3. **ヘルパーを注入します。** SIP を無効にし、Messages.app にサインインした状態で:

   ```bash
   imsg launch
   ```

   SIP がまだ有効な場合、`imsg launch` は注入を拒否するため、これは手順 2 が有効になったことの確認も兼ねます。

4. **OpenClaw からブリッジを検証します:**

   ```bash
   openclaw channels status --probe
   ```

   iMessage エントリは `works` を報告し、`imsg status --json | jq '.selectors'` は `retractMessagePart: true` に加えて、macOS ビルドが公開する編集 / 入力 / 既読の各セレクターを表示するはずです。`actions.ts` の OpenClaw Plugin のメソッドごとのゲートは、基礎となるセレクターが `true` のアクションだけを広告するため、エージェントのツールリストに表示されるアクションサーフェスは、このホスト上でブリッジが実際に実行できる内容を反映します。

`openclaw channels status --probe` がチャネルを `works` と報告する一方で、特定のアクションがディスパッチ時に「iMessage `<action>` requires the imsg private API bridge」を投げる場合は、`imsg launch` を再実行してください — ヘルパーは外れることがあり (Messages.app の再起動、OS 更新など)、キャッシュされた `available: true` ステータスは次回のプローブ更新までアクションを広告し続けます。

### SIP を無効にできない場合

SIP 無効化が脅威モデル上許容できない場合:

- `imsg` は基本モードにフォールバックします — テキスト + メディア + 受信のみ。
- OpenClaw Plugin は引き続きテキスト/メディア送信と受信監視を広告しますが、アクションサーフェスから `react`、`edit`、`unsend`、`reply`、`sendWithEffect`、グループ操作を隠すだけです (メソッドごとの機能ゲートに従います)。
- iMessage ワークロード用に SIP をオフにした別の非 Apple Silicon Mac (または専用 Bot Mac) を実行し、主要デバイスでは SIP を有効のままにできます。下記の [専用 Bot macOS ユーザー (別の iMessage ID)](#deployment-patterns)を参照してください。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` はダイレクトメッセージを制御します。

    - `pairing` (デフォルト)
    - `allowlist`
    - `open` (`allowFrom` に `"*"` を含める必要があります)
    - `disabled`

    許可リストフィールド: `channels.imessage.allowFrom`。

    許可リストのエントリは送信者を識別する必要があります: ハンドルまたは静的送信者アクセスグループ (`accessGroup:<name>`)。`chat_id:*`、`chat_guid:*`、`chat_identifier:*` などのチャットターゲットには `channels.imessage.groupAllowFrom` を使用し、数値の `chat_id` レジストリキーには `channels.imessage.groups` を使用します。

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` はグループ処理を制御します。

    - `allowlist` (設定されている場合のデフォルト)
    - `open`
    - `disabled`

    グループ送信者許可リスト: `channels.imessage.groupAllowFrom`。

    `groupAllowFrom` エントリは静的送信者アクセスグループ (`accessGroup:<name>`) も参照できます。

    ランタイムフォールバック: `groupAllowFrom` が未設定の場合、iMessage のグループ送信者チェックは `allowFrom` を使用します。DM とグループの受け入れを分ける必要がある場合は `groupAllowFrom` を設定してください。
    ランタイムメモ: `channels.imessage` が完全に欠落している場合、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに出します (`channels.defaults.groupPolicy` が設定されていても同様です)。

    <Warning>
    グループルーティングには、連続して実行される **2 つ** の許可リストゲートがあり、両方に通過する必要があります。

    1. **送信者 / チャットターゲット許可リスト** (`channels.imessage.groupAllowFrom`) — ハンドル、`chat_guid`、`chat_identifier`、または `chat_id`。
    2. **グループレジストリ** (`channels.imessage.groups`) — `groupPolicy: "allowlist"` では、このゲートは `groups: { "*": { ... } }` ワイルドカードエントリ (`allowAll = true` を設定) か、`groups` 下の明示的な `chat_id` ごとのエントリのいずれかを必要とします。

    ゲート 2 に何もない場合、すべてのグループメッセージは破棄されます。Plugin はデフォルトのログレベルで 2 つの `warn` レベルのシグナルを出力します。

    - 起動時にアカウントごとに一度: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - ランタイム時に `chat_id` ごとに一度: `imessage: dropping group message from chat_id=<id> ...`

    DM は別のコードパスを取るため、引き続き動作します。

    `groupPolicy: "allowlist"` のもとでグループを流し続けるための最小設定:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    これらの `warn` 行が gateway ログに表示される場合、ゲート 2 がドロップしています — `groups` ブロックを追加してください。
    </Warning>

    グループのメンションゲート:

    - iMessage にはネイティブなメンションメタデータがない
    - メンション検出には正規表現パターンを使う（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - パターンが設定されていない場合、メンションゲートは適用できない

    認可済み送信者からの制御コマンドは、グループ内のメンションゲートをバイパスできます。

    グループごとの `systemPrompt`:

    `channels.imessage.groups.*` 配下の各エントリは、任意の `systemPrompt` 文字列を受け付けます。この値は、そのグループ内のメッセージを処理するすべてのターンでエージェントのシステムプロンプトに注入されます。解決方法は `channels.whatsapp.groups` で使われるグループごとのプロンプト解決と同じです。

    1. **グループ固有のシステムプロンプト**（`groups["<chat_id>"].systemPrompt`）: 特定グループのエントリがマップに存在し、かつその `systemPrompt` キーが定義されている場合に使われます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、そのグループにはシステムプロンプトが適用されません。
    2. **グループワイルドカードのシステムプロンプト**（`groups["*"].systemPrompt`）: 特定グループのエントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使われます。

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    グループごとのプロンプトはグループメッセージにのみ適用されます — このチャネルのダイレクトメッセージには影響しません。

  </Tab>

  <Tab title="セッションと決定的な返信">
    - DM はダイレクトルーティングを使います。グループはグループルーティングを使います。
    - 既定の `session.dmScope=main` では、iMessage の DM はエージェントのメインセッションに統合されます。
    - グループセッションは分離されます（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 返信は、送信元のチャネル/ターゲットメタデータを使って iMessage にルーティングされます。

    グループ風スレッドの挙動:

    一部の複数参加者 iMessage スレッドは `is_group=false` で到着することがあります。
    その `chat_id` が `channels.imessage.groups` 配下に明示的に設定されている場合、OpenClaw はそれをグループトラフィックとして扱います（グループゲート + グループセッション分離）。

  </Tab>
</Tabs>

## ACP 会話バインディング

レガシー iMessage チャットは ACP セッションにもバインドできます。

高速なオペレーターフロー:

- DM または許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 同じ iMessage 会話内の以後のメッセージは、生成された ACP セッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

設定済みの永続バインディングは、`type: "acp"` と `match.channel: "imessage"` を持つトップレベルの `bindings[]` エントリでサポートされます。

`match.peer.id` には次を使えます。

- `+15555550123` や `user@example.com` などの正規化済み DM ハンドル
- `chat_id:<id>`（安定したグループバインディングに推奨）
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

例:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

共有 ACP バインディングの挙動については、[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用 bot macOS ユーザー（別の iMessage ID）">
    専用の Apple ID と macOS ユーザーを使い、bot トラフィックを個人の Messages プロファイルから分離します。

    典型的なフロー:

    1. 専用の macOS ユーザーを作成/サインインします。
    2. そのユーザーで bot の Apple ID を使って Messages にサインインします。
    3. そのユーザーに `imsg` をインストールします。
    4. OpenClaw がそのユーザーコンテキストで `imsg` を実行できるように SSH ラッパーを作成します。
    5. `channels.imessage.accounts.<id>.cliPath` と `.dbPath` をそのユーザープロファイルに向けます。

    初回実行時は、その bot ユーザーセッションで GUI 承認（Automation + Full Disk Access）が必要になる場合があります。

  </Accordion>

  <Accordion title="Tailscale 経由のリモート Mac（例）">
    一般的なトポロジー:

    - gateway は Linux/VM で実行する
    - iMessage + `imsg` は tailnet 内の Mac で実行する
    - `cliPath` ラッパーは SSH を使って `imsg` を実行する
    - `remoteHost` は SCP 添付ファイル取得を有効にする

    例:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    SSH と SCP の両方が非対話になるように SSH キーを使います。
    先にホストキーが信頼済みであることを確認し（例: `ssh bot@mac-mini.tailnet-1234.ts.net`）、`known_hosts` が設定されるようにします。

  </Accordion>

  <Accordion title="マルチアカウントパターン">
    iMessage は `channels.imessage.accounts` 配下でアカウントごとの設定をサポートします。

    各アカウントは、`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルルートの許可リストなどのフィールドを上書きできます。

  </Accordion>
</AccordionGroup>

## メディア、チャンク化、配信ターゲット

<AccordionGroup>
  <Accordion title="添付ファイルとメディア">
    - 受信添付ファイルの取り込みは**既定でオフ**です — 写真、ボイスメモ、動画、その他の添付ファイルをエージェントに転送するには、`channels.imessage.includeAttachments: true` を設定します。無効な場合、添付ファイルのみの iMessage はエージェントに届く前にドロップされ、`Inbound message` ログ行がまったく出ないことがあります。
    - `remoteHost` が設定されている場合、リモート添付ファイルパスは SCP 経由で取得できます
    - 添付ファイルパスは許可されたルートに一致する必要があります。
      - `channels.imessage.attachmentRoots`（ローカル）
      - `channels.imessage.remoteAttachmentRoots`（リモート SCP モード）
      - 既定のルートパターン: `/Users/*/Library/Messages/Attachments`
    - SCP は厳格なホストキー検証を使います（`StrictHostKeyChecking=yes`）
    - 送信メディアサイズは `channels.imessage.mediaMaxMb` を使います（既定 16 MB）

  </Accordion>

  <Accordion title="送信チャンク化">
    - テキストチャンク上限: `channels.imessage.textChunkLimit`（既定 4000）
    - チャンクモード: `channels.imessage.chunkMode`
      - `length`（既定）
      - `newline`（段落優先の分割）

  </Accordion>

  <Accordion title="アドレス指定形式">
    推奨される明示的なターゲット:

    - `chat_id:123`（安定したルーティングに推奨）
    - `chat_guid:...`
    - `chat_identifier:...`

    ハンドルターゲットもサポートされます。

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## プライベート API アクション

`imsg launch` が実行中で、`openclaw channels status --probe` が `privateApi.available: true` を報告している場合、メッセージツールは通常のテキスト送信に加えて iMessage ネイティブアクションを使用できます。

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="利用可能なアクション">
    - **react**: iMessage tapback を追加/削除します（`messageId`、`emoji`、`remove`）。サポートされる tapback は love、like、dislike、laugh、emphasize、question にマップされます。
    - **reply**: 既存メッセージへのスレッド返信を送信します（`messageId`、`text` または `message`、加えて `chatGuid`、`chatId`、`chatIdentifier`、または `to`）。
    - **sendWithEffect**: iMessage エフェクト付きでテキストを送信します（`text` または `message`、`effect` または `effectId`）。
    - **edit**: サポートされる macOS/プライベート API バージョンで送信済みメッセージを編集します（`messageId`、`text` または `newText`）。
    - **unsend**: サポートされる macOS/プライベート API バージョンで送信済みメッセージを取り消します（`messageId`）。
    - **upload-file**: メディア/ファイルを送信します（base64 の `buffer`、またはハイドレート済みの `media`/`path`/`filePath`、`filename`、任意の `asVoice`）。レガシーエイリアス: `sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**: 現在のターゲットがグループ会話の場合にグループチャットを管理します。

  </Accordion>

  <Accordion title="メッセージ ID">
    受信 iMessage コンテキストには、利用可能な場合、短い `MessageSid` 値と完全なメッセージ GUID の両方が含まれます。短い ID は直近のインメモリ返信キャッシュにスコープされ、使用前に現在のチャットと照合されます。短い ID が期限切れになっている場合、または別のチャットに属している場合は、完全な `MessageSidFull` で再試行してください。

  </Accordion>

  <Accordion title="ケイパビリティ検出">
    OpenClaw は、キャッシュされたプローブステータスがブリッジを利用不可と示している場合にのみ、プライベート API アクションを非表示にします。ステータスが不明な場合、アクションは表示されたままになり、ディスパッチ時に遅延プローブを行うため、`imsg launch` 後に別途手動でステータス更新しなくても最初のアクションが成功できます。

  </Accordion>

  <Accordion title="既読通知と入力中表示">
    プライベート API ブリッジが稼働している場合、受理された受信チャットはディスパッチ前に既読としてマークされ、エージェントが生成している間は送信者に入力中の吹き出しが表示されます。既読マーキングを無効にするには次を使います。

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    メソッドごとのケイパビリティリストより古い `imsg` ビルドでは、入力中表示/既読が黙ってゲートされます。OpenClaw は再起動ごとに 1 回だけ警告をログに出すため、既読通知の欠落を特定できます。

  </Accordion>

  <Accordion title="受信 tapback">
    OpenClaw は iMessage tapback を購読し、受理されたリアクションを通常のメッセージテキストではなくシステムイベントとしてルーティングします。そのため、ユーザーの tapback が通常の返信ループをトリガーすることはありません。

    通知モードは `channels.imessage.reactionNotifications` で制御されます。

    - `"own"`（既定）: ユーザーが bot 作成メッセージにリアクションした場合のみ通知します。
    - `"all"`: 認可済み送信者からのすべての受信 tapback を通知します。
    - `"off"`: 受信 tapback を無視します。

    アカウントごとの上書きには `channels.imessage.accounts.<id>.reactionNotifications` を使います。

  </Accordion>
</AccordionGroup>

## 設定書き込み

iMessage は既定でチャネル起点の設定書き込みを許可します（`commands.config: true` の場合の `/config set|unset`）。

無効化:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 分割送信 DM の結合（1 つの作成内容内のコマンド + URL）

ユーザーがコマンドと URL を一緒に入力すると（例: `Dump https://example.com/article`）、Apple の Messages アプリは送信内容を**2 つの別々の `chat.db` 行**に分割します。

1. テキストメッセージ（`"Dump"`）。
2. OG プレビュー画像を添付ファイルとして含む URL プレビュー吹き出し（`"https://..."`）。

ほとんどの構成では、2つの行は約0.8〜2.0秒の間隔で OpenClaw に到着します。結合しない場合、エージェントは1ターン目でコマンドだけを受け取り、返信し（多くの場合「URLを送って」）、2ターン目で初めて URL を見ます。この時点では、コマンドのコンテキストはすでに失われています。これは Apple の送信パイプラインによるもので、OpenClaw や `imsg` が持ち込むものではありません。

`channels.imessage.coalesceSameSenderDms` は、DM で同じ送信者から連続して届く行を1つのエージェントターンにマージするようにします。グループチャットは、複数ユーザーのターン構造を保つため、引き続きメッセージ単位でディスパッチされます。

<Tabs>
  <Tab title="有効にする場合">
    次の場合に有効にします。

    - 1つのメッセージに `command + payload` が含まれることを期待する skills（dump、paste、save、queue など）を提供している。
    - ユーザーがコマンドと一緒に URL、画像、長いコンテンツを貼り付ける。
    - 追加される DM ターンのレイテンシーを許容できる（下記参照）。

    次の場合は無効のままにします。

    - 1語の DM トリガーで最小のコマンドレイテンシーが必要。
    - すべてのフローが、ペイロードの後続メッセージを伴わない単発コマンド。

  </Tab>
  <Tab title="有効化">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    このフラグをオンにし、明示的な `messages.inbound.byChannel.imessage` がない場合、デバウンスウィンドウは **2500 ms** に広がります（従来のデフォルトは 0 ms、つまりデバウンスなし）。Apple の分割送信の間隔である 0.8〜2.0 秒は、より短いデフォルトには収まらないため、この広いウィンドウが必要です。

    ウィンドウを自分で調整するには、次のようにします。

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="トレードオフ">
    - **DM メッセージにレイテンシーが追加されます。** フラグをオンにすると、ペイロード行が来る可能性に備えて、すべての DM（単独の制御コマンドや1つのテキストだけの後続メッセージを含む）がディスパッチ前に最大でデバウンスウィンドウ分待機します。グループチャットのメッセージは即時ディスパッチのままです。
    - **マージされた出力には上限があります。** マージされたテキストは、明示的な `…[truncated]` マーカー付きで 4000 文字までです。添付ファイルは20件まで、ソースエントリは10件までです（それを超える場合は最初と最新が保持されます）。下流のテレメトリ用に、すべてのソース GUID が `coalescedMessageGuids` で追跡されます。
    - **DM のみです。** グループチャットはメッセージ単位のディスパッチにフォールスルーするため、複数人が入力しているときもボットは応答性を保ちます。
    - **チャンネル単位のオプトインです。** 他のチャンネル（Telegram、WhatsApp、Slack など）には影響しません。`channels.bluebubbles.coalesceSameSenderDms` を設定している従来の BlueBubbles 設定は、その値を `channels.imessage.coalesceSameSenderDms` に移行してください。

  </Tab>
</Tabs>

### シナリオとエージェントが見る内容

| ユーザーの作成内容                                                 | `chat.db` が生成するもの | フラグオフ（デフォルト）                | フラグオン + 2500 ms ウィンドウ                                         |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（1回の送信）                            | 約1秒間隔の2行         | 2つのエージェントターン: 「Dump」だけ、その後 URL | 1ターン: マージされたテキスト `Dump https://example.com`                |
| `Save this 📎image.jpg caption`（添付ファイル + テキスト）          | 2行                   | 2ターン（マージ時に添付ファイルが落ちる） | 1ターン: テキスト + 画像が保持される                                    |
| `/status`（単独コマンド）                                          | 1行                   | 即時ディスパッチ                        | **最大でウィンドウ分待機してからディスパッチ**                         |
| URL だけを貼り付け                                                 | 1行                   | 即時ディスパッチ                        | 即時ディスパッチ（バケット内のエントリが1つだけ）                       |
| テキスト + URL を意図的に別々の2メッセージとして数分空けて送信      | ウィンドウ外の2行      | 2ターン                                 | 2ターン（その間にウィンドウが期限切れになる）                           |
| 高速な大量送信（ウィンドウ内に10件を超える小さな DM）              | N行                   | Nターン                                 | 1ターン、上限付き出力（最初 + 最新、テキスト/添付ファイル上限を適用）   |
| グループチャットで2人が入力                                        | M人の送信者からN行     | M+ターン（送信者バケットごとに1つ）     | M+ターン — グループチャットは結合されない                              |

## Gateway 停止後のキャッチアップ

Gateway がオフラインのとき（クラッシュ、再起動、Mac のスリープ、マシン停止）、`imsg watch` は Gateway が復帰すると現在の `chat.db` 状態から再開します。デフォルトでは、その間に到着したものは一切見られません。キャッチアップは、次回起動時にそれらのメッセージを再生し、エージェントが受信トラフィックを黙って見逃さないようにします。

キャッチアップは**デフォルトで無効**です。チャンネル単位で有効にします。

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### 実行方法

`monitorIMessageProvider` の起動ごとに1回実行され、`imsg launch` ready → `watch.subscribe` → `performIMessageCatchup` → ライブディスパッチループの順に進みます。キャッチアップ自体は、`imsg watch` と同じ JSON-RPC クライアントに対して `chats.list` + チャットごとの `messages.history` を使います。キャッチアップ処理中に到着したものは、通常どおりライブディスパッチを通ります。既存の受信重複排除キャッシュが、再生された行との重複を吸収します。

再生された各行はライブディスパッチパス（`evaluateIMessageInbound` + `dispatchInboundMessage`）に渡されるため、許可リスト、グループポリシー、デバウンサー、エコーキャッシュ、開封確認は、再生メッセージとライブメッセージで同じように動作します。

### カーソルとリトライのセマンティクス

キャッチアップは、アカウントごとのカーソルを `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` に保持します（OpenClaw の状態ディレクトリはデフォルトで `~/.openclaw`、`OPENCLAW_STATE_DIR` で上書き可能）。

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- カーソルはディスパッチが成功するたびに進み、行のディスパッチが例外を投げた場合は保持されます。次回起動時には、保持されたカーソルから同じ行をリトライします。
- 同じ `guid` に対して連続して `maxFailureRetries` 回例外が発生した後、キャッチアップは `warn` をログに出し、詰まったメッセージを越えてカーソルを強制的に進めます。これにより、以降の起動で処理を進められます。
- すでに諦めた GUID は、後続の実行では見つけ次第スキップされます（ディスパッチは試行しません）。実行サマリーでは `skippedGivenUp` にカウントされます。

### オペレーターに見えるシグナル

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

`WARN ... capped to perRunLimit` 行は、1回の起動でバックログ全体を処理しきれなかったことを意味します。ギャップが定期的にデフォルトの50行パスを超える場合は、`perRunLimit`（最大500）を上げてください。

### オフのままにする場合

- Gateway がウォッチドッグ自動再起動付きで継続稼働しており、ギャップが常に数秒未満である場合、デフォルトのオフで問題ありません。
- DM の量が少なく、見逃したメッセージがエージェントの動作を変えない場合。初回有効化時には、`firstRunLookbackMinutes` の初期ウィンドウにより、予想外の古いコンテキストがディスパッチされることがあります。

キャッチアップをオンにしたとき、カーソルがない初回起動では、`maxAgeMinutes` の全ウィンドウではなく `firstRunLookbackMinutes`（デフォルト30分）だけを遡ります。これにより、有効化前の長い履歴を再生することを避けます。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="imsg が見つからない、または RPC がサポートされていない">
    バイナリと RPC サポートを検証します。

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    probe が RPC 非対応を報告する場合は、`imsg` を更新してください。プライベート API アクションが利用できない場合は、ログイン中の macOS ユーザーセッションで `imsg launch` を実行し、もう一度 probe してください。Gateway が macOS 上で実行されていない場合は、デフォルトのローカル `imsg` パスではなく、上記の SSH 経由のリモート Mac 設定を使用してください。

  </Accordion>

  <Accordion title="Gateway が macOS 上で実行されていない">
    デフォルトの `cliPath: "imsg"` は、Messages にサインインしている Mac 上で実行する必要があります。Linux または Windows では、`channels.imessage.cliPath` を、その Mac に SSH して `imsg "$@"` を実行するラッパースクリプトに設定します。

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    その後、次を実行します。

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM が無視される">
    次を確認します。

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - ペアリング承認（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="グループメッセージが無視される">
    次を確認します。

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` の許可リスト動作
    - メンションパターン設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="リモート添付ファイルが失敗する">
    次を確認します。

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway ホストからの SSH/SCP 鍵認証
    - Gateway ホスト上の `~/.ssh/known_hosts` にホスト鍵が存在すること
    - Messages を実行している Mac 上でリモートパスを読み取れること

  </Accordion>

  <Accordion title="macOS の権限プロンプトを見逃した">
    同じユーザー/セッションコンテキストの対話型 GUI ターミナルで再実行し、プロンプトを承認します。

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw/`imsg` を実行するプロセスコンテキストに、フルディスクアクセス + オートメーションが付与されていることを確認します。

  </Accordion>
</AccordionGroup>

## 設定リファレンスへのポインター

- [設定リファレンス - iMessage](/ja-JP/gateway/config-channels#imessage)
- [Gateway 設定](/ja-JP/gateway/configuration)
- [ペアリング](/ja-JP/channels/pairing)

## 関連

- [チャンネルの概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage) — 告知と移行サマリー
- [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) — 設定の変換表と段階的な切り替え
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
