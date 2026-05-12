---
read_when:
    - iMessage サポートの設定
    - iMessage の送受信のデバッグ
summary: imsg によるネイティブ iMessage サポート（stdio 経由の JSON-RPC）。返信、タップバック、エフェクト、添付ファイル、グループ管理のためのプライベート API アクションに対応します。ホスト要件に合う場合、新しい OpenClaw iMessage セットアップではこれを推奨します。
title: iMessage
x-i18n:
    generated_at: "2026-05-12T00:56:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b0c284a5105bf9c2863f46731fb61628e264ce35c316014f25f15907142430
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
OpenClaw iMessage デプロイでは、サインイン済みの macOS Messages ホスト上で `imsg` を使用します。Gateway が Linux または Windows で動作している場合は、Mac 上で `imsg` を実行する SSH ラッパーを `channels.imessage.cliPath` に指定します。

**Gateway 停止中のキャッチアップはオプトインです。** 有効化すると（`channels.imessage.catchup.enabled: true`）、Gateway はオフライン中（クラッシュ、再起動、Mac のスリープ）に `chat.db` に到着した受信メッセージを次回起動時に再生します。デフォルトでは無効です — [Gateway 停止後のキャッチアップ](#catching-up-after-gateway-downtime)を参照してください。[openclaw#78649](https://github.com/openclaw/openclaw/issues/78649) をクローズします。
</Note>

<Warning>
BlueBubbles サポートは削除されました。`channels.bluebubbles` 設定を `channels.imessage` に移行してください。OpenClaw は `imsg` のみを通じて iMessage をサポートします。短い告知は [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage)から、完全な移行表は [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles)から始めてください。
</Warning>

ステータス: ネイティブ外部 CLI 統合。Gateway は `imsg rpc` を起動し、stdio 上の JSON-RPC で通信します（別個のデーモン/ポートはありません）。高度なアクションには `imsg launch` とプライベート API プローブの成功が必要です。

<CardGroup cols={3}>
  <Card title="プライベート API アクション" icon="wand-sparkles" href="#private-api-actions">
    返信、タップバック、エフェクト、添付ファイル、グループ管理。
  </Card>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    iMessage DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="リモート Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gateway が Messages Mac 上で実行されていない場合は SSH ラッパーを使用します。
  </Card>
  <Card title="設定リファレンス" icon="settings" href="/ja-JP/gateway/config-channels#imessage">
    iMessage フィールドの完全なリファレンス。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="ローカル Mac（高速パス）">
    <Steps>
      <Step title="imsg をインストールして検証する">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="OpenClaw を設定する">

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

      <Step title="Gateway を起動する">

```bash
openclaw gateway
```

      </Step>

      <Step title="最初の DM ペアリングを承認する（デフォルトの dmPolicy）">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        ペアリングリクエストは 1 時間後に期限切れになります。
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH 経由のリモート Mac">
    OpenClaw が必要とするのは stdio 互換の `cliPath` だけなので、リモート Mac に SSH 接続して `imsg` を実行するラッパースクリプトを `cliPath` に指定できます。

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
    `remoteHost` は `host` または `user@host` である必要があります（スペースや SSH オプションは不可）。
    OpenClaw は SCP に厳密なホストキー確認を使用するため、リレーホストキーはすでに `~/.ssh/known_hosts` に存在している必要があります。
    添付ファイルパスは許可されたルート（`attachmentRoots` / `remoteAttachmentRoots`）に対して検証されます。

  </Tab>
</Tabs>

## 要件と権限（macOS）

- `imsg` を実行する Mac で Messages にサインインしている必要があります。
- OpenClaw/`imsg` を実行するプロセスコンテキストにはフルディスクアクセスが必要です（Messages DB アクセス）。
- Messages.app 経由でメッセージを送信するにはオートメーション権限が必要です。
- 高度なアクション（リアクション / 編集 / 送信取り消し / スレッド返信 / エフェクト / グループ操作）には、System Integrity Protection を無効にする必要があります — 下の [imsg プライベート API の有効化](#enabling-the-imsg-private-api)を参照してください。基本的なテキストとメディアの送受信は、それなしでも動作します。

<Tip>
権限はプロセスコンテキストごとに付与されます。Gateway がヘッドレス（LaunchAgent/SSH）で実行される場合は、同じコンテキストで一度だけ対話型コマンドを実行してプロンプトをトリガーします。

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## imsg プライベート API の有効化

`imsg` には 2 つの運用モードがあります。

- **基本モード**（デフォルト、SIP の変更は不要）: `send` による送信テキストとメディア、受信ウォッチ/履歴、チャット一覧。新規の `brew install steipete/tap/imsg` と上記の標準 macOS 権限で、最初から利用できる内容です。
- **プライベート API モード**: `imsg` はヘルパー dylib を `Messages.app` に注入し、内部の `IMCore` 関数を呼び出します。これにより、`react`、`edit`、`unsend`、`reply`（スレッド）、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup` に加えて、入力インジケーターと開封確認が使用可能になります。

このチャネルページで説明している高度なアクションサーフェスに到達するには、プライベート API モードが必要です。`imsg` README はこの要件を明示しています。

> `read`、`typing`、`launch`、ブリッジ支援のリッチ送信、メッセージ変更、チャット管理などの高度な機能はオプトインです。SIP を無効にし、ヘルパー dylib を `Messages.app` に注入する必要があります。SIP が有効な場合、`imsg launch` は注入を拒否します。

ヘルパー注入手法では、Messages のプライベート API に到達するために `imsg` 独自の dylib を使用します。OpenClaw iMessage パスにはサードパーティサーバーや BlueBubbles ランタイムはありません。

<Warning>
**SIP の無効化は実際のセキュリティ上のトレードオフです。** SIP は、変更されたシステムコードの実行に対する macOS の中核的な保護の 1 つです。システム全体でオフにすると、追加の攻撃面と副作用が生じます。特に、**Apple Silicon Mac で SIP を無効にすると、Mac に iOS アプリをインストールして実行する機能も無効になります**。

これはデフォルトではなく、意図的な運用上の選択として扱ってください。脅威モデルが SIP オフを許容できない場合、バンドルされた iMessage は基本モードに限定されます — テキストとメディアの送受信のみで、リアクション / 編集 / 送信取り消し / エフェクト / グループ操作はありません。
</Warning>

### セットアップ

1. Messages.app を実行する Mac に **`imsg` をインストール（またはアップグレード）** します。

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 出力は `bridge_version`、`rpc_methods`、メソッドごとの `selectors` を報告するため、開始前に現在のビルドが何をサポートしているか確認できます。

2. **System Integrity Protection を無効にします。** 基盤となる Apple の要件が OS とハードウェアに依存するため、これは macOS バージョン固有です。
   - **macOS 10.13–10.15（Sierra–Catalina）:** Terminal で Library Validation を無効化し、Recovery Mode に再起動して `csrutil disable` を実行し、再起動します。
   - **macOS 11+（Big Sur 以降）、Intel:** Recovery Mode（または Internet Recovery）で `csrutil disable` を実行し、再起動します。
   - **macOS 11+、Apple Silicon:** 電源ボタンの起動シーケンスで Recovery に入ります。最近の macOS バージョンでは Continue をクリックするときに **Left Shift** キーを押し続け、その後 `csrutil disable` を実行します。仮想マシンセットアップでは別のフローに従います — 先に VM スナップショットを取得してください。
   - **macOS 26 / Tahoe:** Library Validation ポリシーと `imagent` プライベートエンタイトルメントチェックはさらに厳格化されています。`imsg` は追随するために更新済みビルドが必要になる場合があります。macOS のメジャーアップグレード後に `imsg launch` 注入や特定の `selectors` が false を返し始めた場合は、SIP 手順が成功したと判断する前に `imsg` のリリースノートを確認してください。

   `imsg launch` を実行する前に、使用している Mac 向けの Apple の Recovery Mode フローに従って SIP を無効にしてください。

3. **ヘルパーを注入します。** SIP が無効で、Messages.app にサインインしている状態で:

   ```bash
   imsg launch
   ```

   SIP がまだ有効な場合、`imsg launch` は注入を拒否するため、これはステップ 2 が反映されたことの確認にもなります。

4. **OpenClaw からブリッジを検証します。**

   ```bash
   openclaw channels status --probe
   ```

   iMessage エントリは `works` を報告するはずです。また、`imsg status --json | jq '.selectors'` は `retractMessagePart: true` と、macOS ビルドが公開している編集 / 入力 / 既読セレクターを表示するはずです。`actions.ts` の OpenClaw Plugin のメソッドごとのゲートは、基盤となるセレクターが `true` のアクションだけを広告するため、エージェントのツール一覧に表示されるアクションサーフェスは、このホスト上でブリッジが実際に実行できる内容を反映します。

`openclaw channels status --probe` がチャネルを `works` と報告しているのに、特定のアクションがディスパッチ時に「iMessage `<action>` requires the imsg private API bridge」を投げる場合は、`imsg launch` を再実行してください — ヘルパーは外れることがあり（Messages.app の再起動、OS 更新など）、キャッシュされた `available: true` ステータスは次回のプローブ更新までアクションを広告し続けます。

### SIP を無効にできない場合

SIP 無効が脅威モデル上許容できない場合:

- `imsg` は基本モードにフォールバックします — テキスト + メディア + 受信のみです。
- OpenClaw Plugin は引き続きテキスト/メディア送信と受信監視を広告します。ただし、メソッドごとの機能ゲートに従い、アクションサーフェスから `react`、`edit`、`unsend`、`reply`、`sendWithEffect`、グループ操作を非表示にします。
- iMessage ワークロード用に、SIP をオフにした別の非 Apple Silicon Mac（または専用のボット Mac）を実行し、プライマリデバイスでは SIP を有効に保つことができます。下の [専用ボット macOS ユーザー（別の iMessage ID）](#deployment-patterns)を参照してください。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.imessage.dmPolicy` はダイレクトメッセージを制御します。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    許可リストフィールド: `channels.imessage.allowFrom`。

    許可リストエントリには、ハンドル、静的送信者アクセスグループ（`accessGroup:<name>`）、またはチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を指定できます。

  </Tab>

  <Tab title="グループポリシー + メンション">
    `channels.imessage.groupPolicy` はグループ処理を制御します。

    - `allowlist`（設定されている場合のデフォルト）
    - `open`
    - `disabled`

    グループ送信者許可リスト: `channels.imessage.groupAllowFrom`。

    `groupAllowFrom` エントリは、静的送信者アクセスグループ（`accessGroup:<name>`）も参照できます。

    ランタイムフォールバック: `groupAllowFrom` が未設定の場合、利用可能であれば iMessage グループ送信者チェックは `allowFrom` にフォールバックします。
    ランタイムノート: `channels.imessage` が完全に欠落している場合、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに記録します（`channels.defaults.groupPolicy` が設定されている場合でも）。

    <Warning>
    グループルーティングには、連続して実行される **2 つの** 許可リストゲートがあり、両方に通過する必要があります。

    1. **送信者 / チャットターゲット許可リスト**（`channels.imessage.groupAllowFrom`）— ハンドル、`chat_guid`、`chat_identifier`、または `chat_id`。
    2. **グループレジストリ**（`channels.imessage.groups`）— `groupPolicy: "allowlist"` では、このゲートは `groups: { "*": { ... } }` ワイルドカードエントリ（`allowAll = true` を設定）または `groups` 配下の明示的な `chat_id` ごとのエントリのいずれかを要求します。

    ゲート 2 に何もない場合、すべてのグループメッセージはドロップされます。Plugin はデフォルトのログレベルで 2 つの `warn` レベルシグナルを出力します。

    - 起動時にアカウントごとに 1 回: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - 実行時に `chat_id` ごとに 1 回: `imessage: dropping group message from chat_id=<id> ...`

    DM は別のコードパスを通るため、引き続き動作します。

    `groupPolicy: "allowlist"` の下でグループを流し続ける最小設定:

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

    `warn` 行が Gatewayログに表示される場合、ゲート2で破棄されています。`groups` ブロックを追加してください。
    </Warning>

    グループのメンションゲーティングについて触れる:

    - iMessage にはネイティブなメンションメタデータがありません
    - メンション検出は正規表現パターンを使用します (`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`)
    - パターンが設定されていない場合、メンションゲーティングは適用できません

    承認済み送信者からの制御コマンドは、グループ内のメンションゲーティングをバイパスできます。

    グループごとの `systemPrompt`:

    `channels.imessage.groups.*` 配下の各エントリは、任意の `systemPrompt` 文字列を受け付けます。この値は、そのグループ内のメッセージを処理するすべてのターンで、エージェントのシステムプロンプトに注入されます。解決方法は、`channels.whatsapp.groups` で使われるグループごとのプロンプト解決と同じです。

    1. **グループ固有のシステムプロンプト** (`groups["<chat_id>"].systemPrompt`): 特定のグループエントリがマップ内に存在し、かつその `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列 (`""`) の場合、ワイルドカードは抑制され、そのグループにはシステムプロンプトが適用されません。
    2. **グループワイルドカードのシステムプロンプト** (`groups["*"].systemPrompt`): 特定のグループエントリがマップにまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

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

    グループごとのプロンプトはグループメッセージにのみ適用されます。このチャネルのダイレクトメッセージには影響しません。

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM は直接ルーティングを使用し、グループはグループルーティングを使用します。
    - デフォルトの `session.dmScope=main` では、iMessage の DM はエージェントのメインセッションに統合されます。
    - グループセッションは分離されます (`agent:<agentId>:imessage:group:<chat_id>`)。
    - 返信は、送信元のチャネル/ターゲットメタデータを使って iMessage に戻されます。

    グループ風のスレッド動作:

    一部の複数参加者 iMessage スレッドは、`is_group=false` として届くことがあります。
    その `chat_id` が `channels.imessage.groups` 配下で明示的に設定されている場合、OpenClaw はそれをグループトラフィックとして扱います (グループゲーティング + グループセッション分離)。

  </Tab>
</Tabs>

## ACP 会話バインディング

レガシーの iMessage チャットも ACP セッションにバインドできます。

高速なオペレーターフロー:

- DM または許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 同じ iMessage 会話内の以後のメッセージは、生成された ACP セッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

設定済みの永続バインディングは、`type: "acp"` と `match.channel: "imessage"` を持つトップレベルの `bindings[]` エントリを通じてサポートされます。

`match.peer.id` には次を使用できます。

- 正規化された DM ハンドル。例: `+15555550123` または `user@example.com`
- `chat_id:<id>` (安定したグループバインディングに推奨)
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

共有の ACP バインディング動作については、[ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

## デプロイパターン

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    専用の Apple ID と macOS ユーザーを使用して、bot トラフィックを個人の Messages プロファイルから分離します。

    一般的なフロー:

    1. 専用の macOS ユーザーを作成/サインインします。
    2. そのユーザーで bot 用 Apple ID を使って Messages にサインインします。
    3. そのユーザーに `imsg` をインストールします。
    4. OpenClaw がそのユーザーコンテキストで `imsg` を実行できるように SSH ラッパーを作成します。
    5. `channels.imessage.accounts.<id>.cliPath` と `.dbPath` をそのユーザープロファイルに向けます。

    初回実行時には、その bot ユーザーセッションで GUI 承認 (Automation + Full Disk Access) が必要になる場合があります。

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    一般的なトポロジー:

    - Gateway は Linux/VM 上で実行されます
    - iMessage + `imsg` は tailnet 内の Mac 上で実行されます
    - `cliPath` ラッパーは SSH を使って `imsg` を実行します
    - `remoteHost` は SCP による添付ファイル取得を有効にします

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

    SSH と SCP の両方が非対話で動作するように SSH キーを使用します。
    先にホストキーを信頼済みにし (例: `ssh bot@mac-mini.tailnet-1234.ts.net`)、`known_hosts` が生成されるようにしてください。

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage は `channels.imessage.accounts` 配下のアカウントごとの設定をサポートします。

    各アカウントは、`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルルート許可リストなどのフィールドを上書きできます。

  </Accordion>
</AccordionGroup>

## メディア、チャンク化、配信ターゲット

<AccordionGroup>
  <Accordion title="Attachments and media">
    - 受信添付ファイルの取り込みは**デフォルトでオフ**です。写真、ボイスメモ、動画、その他の添付ファイルをエージェントに転送するには、`channels.imessage.includeAttachments: true` を設定します。無効の場合、添付ファイルのみの iMessage はエージェントに到達する前に破棄され、`Inbound message` ログ行がまったく出力されないことがあります。
    - `remoteHost` が設定されている場合、リモート添付ファイルパスは SCP 経由で取得できます
    - 添付ファイルパスは許可されたルートに一致する必要があります:
      - `channels.imessage.attachmentRoots` (ローカル)
      - `channels.imessage.remoteAttachmentRoots` (リモート SCP モード)
      - デフォルトのルートパターン: `/Users/*/Library/Messages/Attachments`
    - SCP は厳密なホストキー確認 (`StrictHostKeyChecking=yes`) を使用します
    - 送信メディアサイズは `channels.imessage.mediaMaxMb` を使用します (デフォルト 16 MB)

  </Accordion>

  <Accordion title="Outbound chunking">
    - テキストチャンク上限: `channels.imessage.textChunkLimit` (デフォルト 4000)
    - チャンクモード: `channels.imessage.chunkMode`
      - `length` (デフォルト)
      - `newline` (段落優先の分割)

  </Accordion>

  <Accordion title="Addressing formats">
    推奨される明示的ターゲット:

    - `chat_id:123` (安定したルーティングに推奨)
    - `chat_guid:...`
    - `chat_identifier:...`

    ハンドルターゲットもサポートされます:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## プライベート API アクション

`imsg launch` が実行中で、`openclaw channels status --probe` が `privateApi.available: true` を報告している場合、メッセージツールは通常のテキスト送信に加えて iMessage ネイティブのアクションを使用できます。

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
  <Accordion title="Available actions">
    - **react**: iMessage tapback を追加/削除します (`messageId`、`emoji`、`remove`)。サポートされる tapback は、love、like、dislike、laugh、emphasize、question に対応します。
    - **reply**: 既存メッセージへのスレッド返信を送信します (`messageId`、`text` または `message`、加えて `chatGuid`、`chatId`、`chatIdentifier`、または `to`)。
    - **sendWithEffect**: iMessage エフェクト付きでテキストを送信します (`text` または `message`、`effect` または `effectId`)。
    - **edit**: サポートされている macOS/プライベート API バージョンで、送信済みメッセージを編集します (`messageId`、`text` または `newText`)。
    - **unsend**: サポートされている macOS/プライベート API バージョンで、送信済みメッセージを取り消します (`messageId`)。
    - **upload-file**: メディア/ファイルを送信します (base64 の `buffer`、またはハイドレート済みの `media`/`path`/`filePath`、`filename`、任意の `asVoice`)。レガシーエイリアス: `sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**: 現在のターゲットがグループ会話の場合にグループチャットを管理します。

  </Accordion>

  <Accordion title="Message IDs">
    受信 iMessage コンテキストには、利用可能な場合、短い `MessageSid` 値と完全なメッセージ GUID の両方が含まれます。短い ID は最近のインメモリ返信キャッシュ内にスコープされ、使用前に現在のチャットと照合されます。短い ID が期限切れになっているか別のチャットに属している場合は、完全な `MessageSidFull` で再試行してください。

  </Accordion>

  <Accordion title="Capability detection">
    OpenClaw は、キャッシュ済みのプローブステータスがブリッジを利用不可と示している場合にのみ、プライベート API アクションを非表示にします。ステータスが不明な場合、アクションは表示されたままになり、ディスパッチ時に遅延プローブが行われるため、`imsg launch` 後に別途手動でステータス更新をしなくても最初のアクションが成功できます。

  </Accordion>

  <Accordion title="Read receipts and typing">
    プライベート API ブリッジが起動している場合、受け入れられた受信チャットはディスパッチ前に既読としてマークされ、エージェントが生成している間は送信者に入力中の吹き出しが表示されます。既読マークを無効にするには:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    メソッドごとの capability リストより古い `imsg` ビルドでは、入力中/既読が黙ってゲートされます。OpenClaw は再起動ごとに一度だけ警告をログに出し、既読が欠けている原因を特定できるようにします。

  </Accordion>

  <Accordion title="Inbound tapbacks">
    OpenClaw は iMessage tapback を購読し、受け入れられたリアクションを通常のメッセージテキストではなくシステムイベントとしてルーティングします。そのため、ユーザーの tapback が通常の返信ループをトリガーすることはありません。

    通知モードは `channels.imessage.reactionNotifications` で制御します:

    - `"own"` (デフォルト): ユーザーが bot 作成メッセージにリアクションした場合のみ通知します。
    - `"all"`: 承認済み送信者からのすべての受信 tapback を通知します。
    - `"off"`: 受信 tapback を無視します。

    アカウントごとの上書きには `channels.imessage.accounts.<id>.reactionNotifications` を使用します。

  </Accordion>
</AccordionGroup>

## 設定の書き込み

iMessage は、デフォルトでチャネル起点の設定書き込みを許可します (`commands.config: true` の場合の `/config set|unset`)。

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

## 分割送信された DM の結合 (1回の作成内のコマンド + URL)

ユーザーがコマンドと URL を一緒に入力した場合 (例: `Dump https://example.com/article`)、Apple の Messages アプリは送信を**2つの別々の `chat.db` 行**に分割します。

1. テキストメッセージ (`"Dump"`)。
2. OG プレビュー画像を添付ファイルとして含む URL プレビュー吹き出し (`"https://..."`)。

ほとんどのセットアップでは、この2つの行は約0.8-2.0秒の間隔で OpenClaw に届きます。結合しない場合、エージェントはターン1でコマンドのみを受け取り、(多くの場合「URL を送ってください」と) 返信し、ターン2で初めて URL を見ます。その時点ではコマンドのコンテキストはすでに失われています。これは Apple の送信パイプラインによるもので、OpenClaw や `imsg` が導入しているものではありません。

`channels.imessage.coalesceSameSenderDms` は、DM で同一送信者の連続行を 1 回のエージェントターンにマージすることを有効にします。グループチャットは、複数ユーザーのターン構造を保持するため、引き続きメッセージ単位でディスパッチされます。

<Tabs>
  <Tab title="有効にする場合">
    次の場合に有効にします。

    - 1 つのメッセージ内に `command + payload` を期待する Skills（dump、paste、save、queue など）を提供している。
    - ユーザーがコマンドと一緒に URL、画像、長いコンテンツを貼り付ける。
    - 追加される DM ターンのレイテンシを許容できる（下記参照）。

    次の場合は無効のままにします。

    - 1 語の DM トリガーに対して最小のコマンドレイテンシが必要。
    - すべてのフローがペイロードの後続送信を伴わない単発コマンドである。

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

    フラグがオンで、明示的な `messages.inbound.byChannel.imessage` がない場合、デバウンスウィンドウは **2500 ms** に広がります（従来のデフォルトは 0 ms — デバウンスなし）。Apple の分割送信の間隔は 0.8-2.0 s で、より短いデフォルトには収まらないため、広いウィンドウが必要です。

    ウィンドウを自分で調整するには:

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
    - **DM メッセージにレイテンシが追加されます。** フラグがオンの場合、すべての DM（単独の制御コマンドや単一テキストの後続送信を含む）は、ペイロード行が来る可能性に備えて、ディスパッチ前に最大でデバウンスウィンドウ分待機します。グループチャットのメッセージは即時ディスパッチを維持します。
    - **マージされた出力には上限があります。** マージされたテキストは、明示的な `…[truncated]` マーカー付きで 4000 文字に制限されます。添付ファイルは 20 件、ソースエントリは 10 件に制限されます（それを超える場合は最初と最新が保持されます）。すべてのソース GUID は、下流のテレメトリ用に `coalescedMessageGuids` で追跡されます。
    - **DM のみ。** グループチャットは、複数人が入力しているときにボットの応答性を保つため、メッセージ単位のディスパッチにフォールスルーします。
    - **チャンネル単位のオプトイン。** 他のチャンネル（Telegram、WhatsApp、Slack、…）には影響しません。`channels.bluebubbles.coalesceSameSenderDms` を設定している従来の BlueBubbles 設定は、その値を `channels.imessage.coalesceSameSenderDms` に移行してください。

  </Tab>
</Tabs>

### シナリオとエージェントに見える内容

| ユーザーが作成する内容                                             | `chat.db` が生成する内容 | フラグオフ（デフォルト）                 | フラグオン + 2500 ms ウィンドウ                                         |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（1 回送信）                              | 約 1 s 間隔の 2 行     | 2 回のエージェントターン: 「Dump」のみ、その後 URL | 1 回のターン: マージされたテキスト `Dump https://example.com`           |
| `Save this 📎image.jpg caption`（添付ファイル + テキスト）          | 2 行                  | 2 回のターン（マージ時に添付ファイルはドロップ） | 1 回のターン: テキスト + 画像が保持される                               |
| `/status`（単独コマンド）                                          | 1 行                  | 即時ディスパッチ                        | **最大でウィンドウ分待機してからディスパッチ**                         |
| URL のみを貼り付け                                                 | 1 行                  | 即時ディスパッチ                        | 即時ディスパッチ（バケット内のエントリが 1 つのみ）                    |
| テキスト + URL を意図的に別々の 2 メッセージとして数分空けて送信   | ウィンドウ外の 2 行   | 2 回のターン                            | 2 回のターン（その間にウィンドウが期限切れになる）                     |
| 短い DM の急速な大量送信（ウィンドウ内に 10 件超）                 | N 行                  | N 回のターン                            | 1 回のターン、上限付き出力（最初 + 最新、テキスト/添付ファイル上限を適用） |
| グループチャットで 2 人が入力                                      | M 人の送信者から N 行 | M+ 回のターン（送信者バケットごとに 1 回） | M+ 回のターン — グループチャットは結合されない                         |

## Gateway ダウンタイム後のキャッチアップ

Gateway がオフライン（クラッシュ、再起動、Mac のスリープ、マシン電源オフ）の場合、Gateway が復旧すると `imsg watch` は現在の `chat.db` 状態から再開します。デフォルトでは、その間に到着したものは一切見えません。キャッチアップは、次回起動時にそれらのメッセージを再生し、エージェントが受信トラフィックを黙って見逃さないようにします。

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

`monitorIMessageProvider` の起動ごとに 1 パス実行され、`imsg launch` ready → `watch.subscribe` → `performIMessageCatchup` → ライブディスパッチループの順に進みます。キャッチアップ自体は、`imsg watch` と同じ JSON-RPC クライアントに対して `chats.list` + チャットごとの `messages.history` を使用します。キャッチアップパス中に到着したものは通常どおりライブディスパッチを通過します。既存の受信重複排除キャッシュが、再生された行との重複を吸収します。

再生された各行はライブディスパッチパス（`evaluateIMessageInbound` + `dispatchInboundMessage`）を通るため、許可リスト、グループポリシー、デバウンサー、エコーキャッシュ、開封確認は、再生メッセージとライブメッセージで同じように動作します。

### カーソルとリトライのセマンティクス

キャッチアップは、アカウントごとのカーソルを `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` に保持します（OpenClaw 状態ディレクトリのデフォルトは `~/.openclaw` で、`OPENCLAW_STATE_DIR` で上書きできます）。

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- カーソルは、ディスパッチが成功するたびに進みます。行のディスパッチがスローした場合は保持され、次回起動時に保持されたカーソルから同じ行を再試行します。
- 同じ `guid` に対して `maxFailureRetries` 回連続でスローした後、キャッチアップは `warn` をログに出力し、問題のあるメッセージを越えてカーソルを強制的に進めるため、後続の起動で処理を進められます。
- すでに断念済みの guid は、後続の実行で見つかるとスキップされ（ディスパッチ試行なし）、実行サマリーの `skippedGivenUp` にカウントされます。

### オペレーターに見えるシグナル

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

`WARN ... capped to perRunLimit` 行は、1 回の起動でバックログ全体を排出できなかったことを意味します。ギャップがデフォルトの 50 行パスを頻繁に超える場合は、`perRunLimit`（最大 500）を増やしてください。

### オフのままにする場合

- Gateway がウォッチドッグの自動再起動付きで継続的に稼働しており、ギャップが常に数秒未満である場合 — デフォルトのオフで問題ありません。
- DM 量が少なく、見逃したメッセージがエージェントの動作を変えない場合 — 初回有効化時に `firstRunLookbackMinutes` の初期ウィンドウが意外な古いコンテキストをディスパッチすることがあります。

キャッチアップをオンにしたとき、カーソルがない最初の起動では `firstRunLookbackMinutes`（デフォルト 30 分）だけを遡り、`maxAgeMinutes` ウィンドウ全体は遡りません。これにより、有効化前の長い履歴を再生することを避けます。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="imsg が見つからない、または RPC が未サポート">
    バイナリと RPC サポートを検証します。

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    プローブで RPC 未サポートと報告される場合は、`imsg` を更新してください。プライベート API アクションが利用できない場合は、ログイン中の macOS ユーザーセッションで `imsg launch` を実行し、再度プローブしてください。Gateway が macOS 上で実行されていない場合は、デフォルトのローカル `imsg` パスではなく、上記の SSH 経由のリモート Mac セットアップを使用してください。

  </Accordion>

  <Accordion title="Gateway が macOS 上で実行されていない">
    デフォルトの `cliPath: "imsg"` は、Messages にサインインしている Mac 上で実行する必要があります。Linux または Windows では、`channels.imessage.cliPath` を、その Mac に SSH して `imsg "$@"` を実行するラッパースクリプトに設定してください。

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
    確認項目:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - ペアリング承認（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="グループメッセージが無視される">
    確認項目:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` の許可リスト動作
    - メンションパターン設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="リモート添付ファイルが失敗する">
    確認項目:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway ホストからの SSH/SCP キー認証
    - Gateway ホスト上の `~/.ssh/known_hosts` にホストキーが存在する
    - Messages を実行している Mac 上のリモートパスの読み取り可能性

  </Accordion>

  <Accordion title="macOS の権限プロンプトを見逃した">
    同じユーザー/セッションコンテキストの対話型 GUI ターミナルで再実行し、プロンプトを承認します。

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw/`imsg` を実行するプロセスコンテキストに対して、フルディスクアクセス + オートメーションが付与されていることを確認してください。

  </Accordion>
</AccordionGroup>

## 設定リファレンスの参照先

- [設定リファレンス - iMessage](/ja-JP/gateway/config-channels#imessage)
- [Gateway 設定](/ja-JP/gateway/configuration)
- [ペアリング](/ja-JP/channels/pairing)

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされるすべてのチャンネル
- [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage) — 告知と移行サマリー
- [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) — 設定変換表と段階的な切り替え
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
