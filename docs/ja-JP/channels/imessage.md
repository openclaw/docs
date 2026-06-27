---
read_when:
    - iMessage サポートの設定
    - iMessage の送受信のデバッグ
summary: imsg（stdio 経由の JSON-RPC）によるネイティブ iMessage 対応。返信、Tapback、エフェクト、添付ファイル、グループ管理のためのプライベート API アクションを備えています。ホスト要件が合う場合、新しい OpenClaw iMessage セットアップに推奨されます。
title: iMessage
x-i18n:
    generated_at: "2026-06-27T10:35:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
OpenClaw iMessage デプロイでは、サインイン済みの macOS Messages ホストで `imsg` を使用します。Gateway が Linux または Windows で動作している場合は、Mac 上で `imsg` を実行する SSH ラッパーを `channels.imessage.cliPath` に指定します。

**インバウンド復旧は自動です。** ブリッジまたは Gateway の再起動後、iMessage は停止中に見逃したメッセージを再生し、Push 復旧後に Apple がフラッシュする可能性がある古い「backlog bomb」を抑制します。重複排除により、同じものが二度ディスパッチされることはありません。有効化するための設定はありません — [ブリッジまたは Gateway 再起動後のインバウンド復旧](#inbound-recovery-after-a-bridge-or-gateway-restart)を参照してください。
</Note>

<Warning>
BlueBubbles サポートは削除されました。`channels.bluebubbles` 設定を `channels.imessage` に移行してください。OpenClaw は `imsg` のみを通じて iMessage をサポートします。短いお知らせは [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage)から、完全な移行表は [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles)から始めてください。
</Warning>

状態: ネイティブ外部 CLI 統合。Gateway は `imsg rpc` を起動し、stdio 上の JSON-RPC で通信します（別個のデーモン/ポートはありません）。高度なアクションには `imsg launch` と、private API probe の成功が必要です。

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    返信、tapback、エフェクト、添付ファイル、グループ管理。
  </Card>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    iMessage DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gateway が Messages Mac 上で動作していない場合は、SSH ラッパーを使用します。
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

        ペアリングリクエストは 1 時間後に期限切れになります。
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw が必要とするのは stdio 互換の `cliPath` だけなので、リモート Mac に SSH して `imsg` を実行するラッパースクリプトを `cliPath` に指定できます。

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    添付ファイルが有効な場合の推奨設定:

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
    `remoteHost` は `host` または `user@host` でなければなりません（スペースや SSH オプションは不可）。
    OpenClaw は SCP に厳格なホストキー確認を使用するため、リレーホストキーはすでに `~/.ssh/known_hosts` に存在している必要があります。
    添付ファイルパスは許可されたルート（`attachmentRoots` / `remoteAttachmentRoots`）に対して検証されます。

<Warning>
`imsg` の前に置く `cliPath` ラッパーや SSH プロキシは、長時間稼働する JSON-RPC に対して透過的な stdio パイプのように振る舞わなければなりません。OpenClaw はチャンネルの存続中、ラッパーの stdin/stdout を通じて小さな改行区切りの JSON-RPC メッセージを交換します。

- 各 stdin チャンク/行を **バイトが利用可能になり次第** 転送します — EOF を待たないでください。
- 各 stdout チャンク/行を逆方向へ速やかに転送します。
- 改行を保持します。
- 小さなフレームを飢餓状態にする可能性がある固定サイズのブロッキング読み取り（`read(4096)`、`cat | buffer`、デフォルトのシェル `read`）を避けます。
- stderr を JSON-RPC stdout ストリームから分離したままにします。

大きなブロックが埋まるまで stdin をバッファリングするラッパーは、`imsg rpc` 自体が正常でも、iMessage 障害のように見える症状 — `imsg rpc timeout (chats.list)` やチャンネルの繰り返し再起動 — を発生させます。上記の `ssh -T host imsg "$@"` は、`rpc` や `--db` など OpenClaw の `cliPath` 引数を転送するため安全です。`ssh host imsg | grep -v '^DEBUG'` のようなパイプラインは安全ではありません — 行バッファリングされるツールでもフレームを保持する可能性があります。どうしてもフィルタする必要がある場合は、すべての段階で `stdbuf -oL -eL` を使用してください。
</Warning>

  </Tab>
</Tabs>

## 要件と権限（macOS）

- `imsg` を実行する Mac で Messages にサインインしている必要があります。
- OpenClaw/`imsg` を実行するプロセスコンテキストには、フルディスクアクセスが必要です（Messages DB アクセス）。
- Messages.app を通じてメッセージを送信するには、オートメーション権限が必要です。
- 高度なアクション（リアクション / 編集 / 送信取り消し / スレッド返信 / エフェクト / グループ操作）には、System Integrity Protection を無効にする必要があります — 下記の [imsg private API の有効化](#enabling-the-imsg-private-api)を参照してください。基本的なテキストとメディアの送受信は、これなしで動作します。

<Tip>
権限はプロセスコンテキストごとに付与されます。Gateway をヘッドレス（LaunchAgent/SSH）で実行する場合は、同じコンテキストで一度だけ対話型コマンドを実行してプロンプトを発生させます。

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH wrapper sends fail with AppleEvents -1743">
  リモート SSH セットアップでは、チャットの読み取り、`channels status --probe` の通過、インバウンドメッセージの処理はできても、アウトバウンド送信が AppleEvents 認可エラーで失敗し続けることがあります。

```text
Not authorized to send Apple events to Messages. (-1743)
```

サインイン済み Mac ユーザーの TCC データベース、または System Settings > Privacy & Security > Automation を確認してください。Automation エントリが `imsg` またはローカルシェルプロセスではなく `/usr/libexec/sshd-keygen-wrapper` に記録されている場合、macOS はその SSH サーバー側クライアントに対して、使用可能な Messages トグルを表示しないことがあります。

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

その状態では、Messages Automation を必要とするプロセスコンテキストが UI で許可できるアプリではなく SSH ラッパーであるため、`tccutil reset AppleEvents` を繰り返したり、同じ SSH ラッパー経由で `imsg send` を再実行したりしても失敗し続ける可能性があります。

代わりに、サポートされている `imsg` プロセスコンテキストのいずれかを使用してください。

- Gateway、または少なくとも `imsg` ブリッジを、ログイン済み Messages ユーザーのローカルセッションで実行します。
- 同じセッションからフルディスクアクセスとオートメーションを付与した後、そのユーザーの LaunchAgent で Gateway を起動します。
- 2 ユーザー SSH トポロジを維持する場合は、チャンネルを有効化する前に、実際のアウトバウンド `imsg send` が正確なラッパー経由で成功することを確認してください。Automation を付与できない場合は、送信を SSH ラッパーに頼るのではなく、単一ユーザーの `imsg` セットアップへ再構成してください。

</Accordion>

## imsg private API の有効化

`imsg` は 2 つの運用モードで提供されます。

- **基本モード**（デフォルト、SIP 変更不要）: `send` によるアウトバウンドのテキストとメディア、インバウンドの watch/history、チャットリスト。新規の `brew install steipete/tap/imsg` と上記の標準 macOS 権限で最初から利用できるものです。
- **Private API モード**: `imsg` はヘルパー dylib を `Messages.app` に注入し、内部の `IMCore` 関数を呼び出します。これにより、`react`、`edit`、`unsend`、`reply`（スレッド）、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup` に加えて、入力インジケーターと既読通知が有効になります。

このチャンネルページで説明している高度なアクション面に到達するには、Private API モードが必要です。`imsg` README は要件について明示しています。

> `read`、`typing`、`launch`、ブリッジ支援のリッチ送信、メッセージ変更、チャット管理などの高度な機能はオプトインです。SIP を無効にし、ヘルパー dylib を `Messages.app` に注入する必要があります。SIP が有効な場合、`imsg launch` は注入を拒否します。

ヘルパー注入の手法では、Messages の private API に到達するために `imsg` 独自の dylib を使用します。OpenClaw iMessage パスには、サードパーティサーバーや BlueBubbles ランタイムはありません。

<Warning>
**SIP を無効化することは実際のセキュリティ上のトレードオフです。** SIP は変更されたシステムコードの実行に対する macOS の中核的な保護の 1 つです。システム全体でオフにすると、追加の攻撃対象領域と副作用が生じます。特に、**Apple Silicon Mac で SIP を無効化すると、Mac に iOS アプリをインストールして実行する機能も無効になります**。

これをデフォルトではなく、意図的な運用上の選択として扱ってください。脅威モデルが SIP オフを許容できない場合、バンドルされた iMessage は基本モードに制限されます — テキストとメディアの送受信のみで、リアクション / 編集 / 送信取り消し / エフェクト / グループ操作はありません。
</Warning>

### セットアップ

1. Messages.app を実行する Mac に **`imsg` をインストール（またはアップグレード）** します。

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` の出力は `bridge_version`、`rpc_methods`、メソッドごとの `selectors` を報告するため、開始前に現在のビルドが何をサポートしているかを確認できます。

2. **System Integrity Protection と、（最近の macOS では）Library Validation を無効化します。** Apple 署名済みの `Messages.app` に Apple 製ではないヘルパー dylib を注入するには、SIP をオフにし、**かつ** library validation を緩和する必要があります。Recovery Mode での SIP 手順は macOS バージョンによって異なります。
   - **macOS 10.13-10.15（Sierra-Catalina）:** Terminal から Library Validation を無効化し、Recovery Mode で再起動して `csrutil disable` を実行し、再起動します。
   - **macOS 11+（Big Sur 以降）、Intel:** Recovery Mode（または Internet Recovery）、`csrutil disable`、再起動。
   - **macOS 11+、Apple Silicon:** 電源ボタンの起動シーケンスで Recovery に入ります。最近の macOS バージョンでは Continue をクリックするときに **Left Shift** キーを押し、その後 `csrutil disable` を実行します。仮想マシン構成では別のフローに従うため、先に VM スナップショットを取得してください。

   **macOS 11 以降では、通常 `csrutil disable` だけでは不十分です。** Apple は `Messages.app` をプラットフォームバイナリとして扱い、library validation を引き続き強制します。そのため、adhoc 署名のヘルパーは SIP オフでも拒否されます（`Library Validation failed: ... platform binary, but mapped file is not`）。SIP を無効化した後、library validation も無効化して再起動します。

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26（Tahoe）、26.5.1 で検証済み:** SIP オフ **に加えて** 上記の `DisableLibraryValidation` コマンドを実行すれば、26.0 から 26.5.x までヘルパーを注入するのに十分です。**boot-args は不要です。** plist が決定的な要因であり、Tahoe で注入が失敗するときに最もよく抜けている手順です。
   - **plist あり:** `imsg launch` が注入し、`imsg status` は `advanced_features: true` を報告します。
   - **plist なし（SIP オフでも）:** `imsg launch` は `Failed to launch: Timeout waiting for Messages.app to initialize` で失敗します。AMFI がロード時に adhoc ヘルパーを拒否するため、ブリッジは準備完了にならず、起動がタイムアウトします。このタイムアウトは Tahoe で多くの人が遭遇する症状であり、修正は上記の plist であって、それ以上に過激なものではありません。

   これは macOS 26.5.1（Apple Silicon）での制御された前後比較により確認されました。plist がある場合、dylib は `Messages.app` にマップされ、ブリッジは起動します。plist を削除して再起動すると、`imsg launch` は上記のタイムアウト失敗を発生させ、dylib はマップされません。

   `imsg launch` の注入や特定の `selectors` が macOS アップグレード後に false を返し始めた場合、通常はこのゲートが原因です。SIP 手順自体が失敗したと判断する前に、SIP とライブラリ検証の状態を確認してください。これらの設定が正しく、ブリッジがまだ注入できない場合は、追加のシステム全体のセキュリティ制御を弱めるのではなく、`imsg status --json` と `imsg launch` の出力を収集して `imsg` プロジェクトに報告してください。

   `imsg launch` を実行する前に、Apple の Mac 向け Recovery モードフローに従って SIP を無効化します。

3. **ヘルパーを注入する。** SIP が無効で Messages.app にサインイン済みの状態で、次を実行します。

   ```bash
   imsg launch
   ```

   SIP がまだ有効な場合、`imsg launch` は注入を拒否するため、これは手順 2 が反映されたことの確認にもなります。

4. **OpenClaw からブリッジを検証する:**

   ```bash
   openclaw channels status --probe
   ```

   iMessage の項目は `works` を報告し、`imsg status --json | jq '.selectors'` は `retractMessagePart: true` と、macOS ビルドが公開する編集 / 入力中 / 既読セレクターを表示するはずです。`actions.ts` の OpenClaw Plugin のメソッド単位ゲートは、基盤となるセレクターが `true` のアクションだけを公開するため、エージェントのツール一覧に表示されるアクションサーフェスは、このホスト上でブリッジが実際に実行できる内容を反映します。

`openclaw channels status --probe` がチャネルを `works` と報告しているのに、特定のアクションがディスパッチ時に "iMessage `<action>` requires the imsg private API bridge" をスローする場合は、`imsg launch` を再実行してください。ヘルパーは外れることがあり（Messages.app の再起動、OS 更新など）、キャッシュされた `available: true` ステータスは、次のプローブが更新されるまでアクションを公開し続けます。

### SIP を無効化できない場合

脅威モデル上、SIP 無効化を許容できない場合:

- `imsg` は基本モードにフォールバックします。テキスト + メディア + 受信のみです。
- OpenClaw Plugin は引き続きテキスト/メディア送信と受信監視を公開しますが、`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、グループ操作はアクションサーフェスから隠します（メソッド単位の機能ゲートに従います）。
- プライマリデバイスでは SIP を有効にしたまま、iMessage ワークロード用に SIP をオフにした別の非 Apple Silicon Mac（または専用 bot Mac）を実行できます。下の [専用 bot macOS ユーザー（別の iMessage ID）](#deployment-patterns) を参照してください。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.imessage.dmPolicy` はダイレクトメッセージを制御します。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    許可リストフィールド: `channels.imessage.allowFrom`。

    許可リストエントリは送信者を識別する必要があります。ハンドルまたは静的な送信者アクセスグループ（`accessGroup:<name>`）です。`chat_id:*`、`chat_guid:*`、`chat_identifier:*` などのチャットターゲットには `channels.imessage.groupAllowFrom` を使用し、数値の `chat_id` レジストリキーには `channels.imessage.groups` を使用します。

  </Tab>

  <Tab title="グループポリシー + メンション">
    `channels.imessage.groupPolicy` はグループ処理を制御します。

    - `allowlist`（構成済みの場合のデフォルト）
    - `open`
    - `disabled`

    グループ送信者許可リスト: `channels.imessage.groupAllowFrom`。

    `groupAllowFrom` エントリは静的な送信者アクセスグループ（`accessGroup:<name>`）も参照できます。

    ランタイムフォールバック: `groupAllowFrom` が未設定の場合、iMessage のグループ送信者チェックは `allowFrom` を使用します。DM とグループの許可を分ける必要がある場合は `groupAllowFrom` を設定してください。
    ランタイムメモ: `channels.imessage` が完全に欠落している場合、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに出力します（`channels.defaults.groupPolicy` が設定されていても同様です）。

    <Warning>
    グループルーティングには、連続して実行される **2 つ** の許可リストゲートがあり、両方を通過する必要があります。

    1. **送信者 / チャットターゲット許可リスト**（`channels.imessage.groupAllowFrom`）— ハンドル、`chat_guid`、`chat_identifier`、または `chat_id`。
    2. **グループレジストリ**（`channels.imessage.groups`）— `groupPolicy: "allowlist"` の場合、このゲートには `groups: { "*": { ... } }` ワイルドカードエントリ（`allowAll = true` を設定）または `groups` 配下の明示的な `chat_id` ごとのエントリが必要です。

    ゲート 2 に何もない場合、すべてのグループメッセージはドロップされます。Plugin はデフォルトのログレベルで 2 つの `warn` レベル信号を出力します。

    - 起動時にアカウントごとに 1 回: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - 実行時に `chat_id` ごとに 1 回: `imessage: dropping group message from chat_id=<id> ...`

    DM は別のコードパスを通るため、引き続き動作します。

    `groupPolicy: "allowlist"` でグループを流し続けるための最小構成:

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

    これらの `warn` 行が gateway ログに表示される場合、ゲート 2 がドロップしています。`groups` ブロックを追加してください。
    </Warning>

    グループのメンションゲート:

    - iMessage にはネイティブのメンションメタデータがありません
    - メンション検出は regex パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）を使用します
    - パターンが構成されていない場合、メンションゲートは強制できません

    認可済み送信者からの制御コマンドは、グループ内のメンションゲートをバイパスできます。

    グループごとの `systemPrompt`:

    `channels.imessage.groups.*` 配下の各エントリは、任意の `systemPrompt` 文字列を受け付けます。この値は、そのグループ内のメッセージを処理するすべてのターンで、エージェントのシステムプロンプトに注入されます。解決は `channels.whatsapp.groups` で使われるグループごとのプロンプト解決を反映します。

    1. **グループ固有のシステムプロンプト**（`groups["<chat_id>"].systemPrompt`）: 特定のグループエントリがマップ内に存在し、**かつ** その `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列（`""`）の場合、ワイルドカードは抑制され、そのグループにはシステムプロンプトが適用されません。
    2. **グループワイルドカードのシステムプロンプト**（`groups["*"].systemPrompt`）: 特定のグループエントリがマップ内にまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

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

  <Tab title="セッションと決定的な返信">
    - DM はダイレクトルーティングを使用します。グループはグループルーティングを使用します。
    - デフォルトの `session.dmScope=main` では、iMessage DM はエージェントのメインセッションに集約されます。
    - グループセッションは分離されます（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 返信は元のチャネル/ターゲットメタデータを使用して iMessage にルーティングされます。

    グループに近いスレッド動作:

    一部の複数参加者 iMessage スレッドは `is_group=false` で届くことがあります。
    その `chat_id` が `channels.imessage.groups` 配下で明示的に構成されている場合、OpenClaw はそれをグループトラフィックとして扱います（グループゲート + グループセッション分離）。

  </Tab>
</Tabs>

## ACP 会話バインディング

レガシー iMessage チャットも ACP セッションにバインドできます。

高速なオペレーターフロー:

- DM または許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 同じ iMessage 会話内の以後のメッセージは、生成された ACP セッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

構成済みの永続バインディングは、`type: "acp"` と `match.channel: "imessage"` を持つトップレベルの `bindings[]` エントリを通じてサポートされます。

`match.peer.id` には次を使用できます。

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

共有 ACP バインディング動作については、[ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用 bot macOS ユーザー（別の iMessage ID）">
    bot トラフィックを個人の Messages プロファイルから分離するため、専用の Apple ID と macOS ユーザーを使用します。

    一般的なフロー:

    1. 専用 macOS ユーザーを作成/サインインします。
    2. そのユーザーで bot Apple ID を使って Messages にサインインします。
    3. そのユーザーに `imsg` をインストールします。
    4. OpenClaw がそのユーザーコンテキストで `imsg` を実行できるように SSH ラッパーを作成します。
    5. `channels.imessage.accounts.<id>.cliPath` と `.dbPath` をそのユーザープロファイルに向けます。

    初回実行では、その bot ユーザーセッション内で GUI 承認（Automation + Full Disk Access）が必要になる場合があります。

  </Accordion>

  <Accordion title="Tailscale 経由のリモート Mac（例）">
    一般的なトポロジー:

    - gateway は Linux/VM 上で実行されます
    - iMessage + `imsg` は tailnet 内の Mac 上で実行されます
    - `cliPath` ラッパーは SSH を使用して `imsg` を実行します
    - `remoteHost` は SCP 添付ファイル取得を有効にします

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

    SSH と SCP の両方が非対話になるように SSH キーを使用してください。
    最初にホストキーが信頼済みであることを確認し（たとえば `ssh bot@mac-mini.tailnet-1234.ts.net`）、`known_hosts` が設定されるようにしてください。

  </Accordion>

  <Accordion title="マルチアカウントパターン">
    iMessage は `channels.imessage.accounts` 配下のアカウントごとの構成をサポートします。

    各アカウントは、`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルルート許可リストなどのフィールドをオーバーライドできます。

  </Accordion>

  <Accordion title="ダイレクトメッセージ履歴">
    `channels.imessage.dmHistoryLimit` を設定すると、新しいダイレクトメッセージセッションに、その会話の最近のデコード済み `imsg` 履歴をシードします。送信者ごとのオーバーライドには `channels.imessage.dms["<sender>"].historyLimit` を使用します。送信者の履歴を無効化するには `0` を含めます。

    iMessage DM 履歴は `imsg` からオンデマンドで取得されます。`dmHistoryLimit` を未設定のままにするとグローバルな DM 履歴シードは無効になりますが、正の値を持つ送信者ごとの `channels.imessage.dms["<sender>"].historyLimit` は、その送信者については引き続きシードを有効にします。

  </Accordion>
</AccordionGroup>

## メディア、チャンク化、配信ターゲット

<AccordionGroup>
  <Accordion title="添付ファイルとメディア">
    - インバウンド添付ファイルの取り込みは**デフォルトでオフ**です — 写真、ボイスメモ、動画、その他の添付ファイルをエージェントへ転送するには `channels.imessage.includeAttachments: true` を設定します。無効のままだと、添付ファイルのみの iMessage はエージェントに届く前に破棄され、`Inbound message` ログ行がまったく出ない場合があります。
    - `remoteHost` が設定されている場合、リモート添付ファイルのパスは SCP 経由で取得できます
    - 添付ファイルのパスは許可されたルートと一致する必要があります:
      - `channels.imessage.attachmentRoots` (ローカル)
      - `channels.imessage.remoteAttachmentRoots` (リモート SCP モード)
      - デフォルトのルートパターン: `/Users/*/Library/Messages/Attachments`
    - SCP は厳格なホストキー確認 (`StrictHostKeyChecking=yes`) を使用します
    - アウトバウンドメディアのサイズは `channels.imessage.mediaMaxMb` を使用します (デフォルト 16 MB)

  </Accordion>

  <Accordion title="アウトバウンドのチャンク分割">
    - テキストチャンク上限: `channels.imessage.textChunkLimit` (デフォルト 4000)
    - チャンクモード: `channels.imessage.chunkMode`
      - `length` (デフォルト)
      - `newline` (段落優先の分割)

  </Accordion>

  <Accordion title="アドレス指定形式">
    推奨される明示的なターゲット:

    - `chat_id:123` (安定したルーティングに推奨)
    - `chat_guid:...`
    - `chat_identifier:...`

    ハンドルターゲットもサポートされています:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Private API アクション

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
  <Accordion title="利用可能なアクション">
    - **react**: iMessage のタップバックを追加/削除します (`messageId`, `emoji`, `remove`)。サポートされるタップバックは love、like、dislike、laugh、emphasize、question に対応します。
    - **reply**: 既存メッセージへのスレッド返信を送信します (`messageId`, `text` または `message`、および `chatGuid`、`chatId`、`chatIdentifier`、または `to`)。
    - **sendWithEffect**: iMessage エフェクト付きでテキストを送信します (`text` または `message`、`effect` または `effectId`)。
    - **edit**: サポートされる macOS/Private API バージョンで、送信済みメッセージを編集します (`messageId`, `text` または `newText`)。
    - **unsend**: サポートされる macOS/Private API バージョンで、送信済みメッセージを取り消します (`messageId`)。
    - **upload-file**: メディア/ファイルを送信します (`buffer` は base64、または hydrated 済みの `media`/`path`/`filePath`、`filename`、任意の `asVoice`)。レガシーエイリアス: `sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**: 現在のターゲットがグループ会話の場合に、グループチャットを管理します。

  </Accordion>

  <Accordion title="メッセージ ID">
    インバウンド iMessage コンテキストには、利用可能な場合、短い `MessageSid` 値と完全なメッセージ GUID の両方が含まれます。短い ID は、最近の SQLite ベースの返信キャッシュにスコープされ、使用前に現在のチャットと照合されます。短い ID が期限切れか別のチャットに属する場合は、完全な `MessageSidFull` で再試行してください。

  </Accordion>

  <Accordion title="機能検出">
    OpenClaw は、キャッシュされたプローブステータスでブリッジが利用不可と示された場合にのみ、Private API アクションを非表示にします。ステータスが不明な場合、アクションは表示されたままになり、ディスパッチ時に遅延プローブが行われるため、別途手動でステータスを更新しなくても、`imsg launch` 後の最初のアクションが成功できます。

  </Accordion>

  <Accordion title="開封確認と入力中表示">
    Private API ブリッジが起動している場合、受け付けられたインバウンドチャットは既読としてマークされ、ダイレクトチャットではターンが受理されるとすぐに、エージェントがコンテキストを準備して生成している間、入力中バブルが表示されます。既読マークを無効にするには:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    メソッドごとの機能一覧より前の古い `imsg` ビルドでは、入力中表示/既読が静かにゲートされます。OpenClaw は、欠落した開封確認の原因を追跡できるように、再起動ごとに 1 回だけ警告をログに出します。

  </Accordion>

  <Accordion title="インバウンドタップバック">
    OpenClaw は iMessage タップバックを購読し、受け付けられたリアクションを通常のメッセージテキストではなくシステムイベントとしてルーティングするため、ユーザーのタップバックが通常の返信ループをトリガーすることはありません。

    通知モードは `channels.imessage.reactionNotifications` で制御されます:

    - `"own"` (デフォルト): ユーザーがボット作成メッセージに反応した場合のみ通知します。
    - `"all"`: 承認済み送信者からのすべてのインバウンドタップバックを通知します。
    - `"off"`: インバウンドタップバックを無視します。

    アカウント単位のオーバーライドには `channels.imessage.accounts.<id>.reactionNotifications` を使用します。

  </Accordion>

  <Accordion title="承認リアクション (👍 / 👎)">
    `approvals.exec.enabled` または `approvals.plugin.enabled` が true で、リクエストが iMessage にルーティングされる場合、gateway は承認プロンプトをネイティブに配信し、タップバックで解決できます:

    - `👍` (Like タップバック) → `allow-once`
    - `👎` (Dislike タップバック) → `deny`
    - `allow-always` は手動フォールバックのままです: 通常の返信として `/approve <id> allow-always` を送信します。

    リアクション処理では、リアクションしたユーザーのハンドルが明示的な承認者である必要があります。承認者リストは `channels.imessage.allowFrom` (または `channels.imessage.accounts.<id>.allowFrom`) から読み取られます。ユーザーの電話番号を E.164 形式で追加するか、Apple ID メールを追加してください。ワイルドカードエントリ `"*"` は尊重されますが、任意の送信者に承認を許可します。リアクションショートカットは意図的に `reactionNotifications`、`dmPolicy`、`groupAllowFrom` をバイパスします。承認の解決で重要な唯一のゲートは、明示的承認者の許可リストだからです。

    **このリリースでの動作変更:** `channels.imessage.allowFrom` が空でない場合、`/approve <id> <decision>` テキストコマンドは、より広い DM 許可リストではなく、その承認者リストに対して認可されるようになりました。DM 許可リストでは許可されているが `allowFrom` に含まれていない送信者は、明示的な拒否を受け取ります。以前の動作を維持するには、`/approve` (およびリアクション) で承認できるべきすべてのオペレーターを `allowFrom` に追加してください。`allowFrom` が空の場合は、レガシーの「同一チャットフォールバック」が有効なままで、`/approve` は引き続き DM 許可リストで許可されたすべてのユーザーを認可します。

    オペレーター向けの注意:
    - リアクションのバインディングは、メモリ内 (承認期限に一致する TTL 付き) と gateway の永続キー付きストアの両方に保存されるため、gateway の再起動直後に届いたタップバックでも承認を解決できます。
    - クロスデバイスの `is_from_me=true` タップバック (ペアリングされた Apple デバイス上でのオペレーター自身のリアクション) は、ボットが自己承認できないように意図的に無視されます。
    - レガシーのテキスト形式タップバック (非常に古い Apple クライアントからの `Liked "…"` プレーンテキスト) は、メッセージ GUID を含まないため承認を解決できません。リアクションの解決には、現在の macOS / iOS クライアントが発行する構造化タップバックメタデータが必要です。

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

## 分割送信された DM の結合 (1 回の作成内のコマンド + URL)

ユーザーがコマンドと URL を一緒に入力すると、たとえば `Dump https://example.com/article` のような場合、Apple の Messages アプリは送信を**2 つの別個の `chat.db` 行**に分割します:

1. テキストメッセージ (`"Dump"`)。
2. OG プレビュー画像が添付された URL プレビューバルーン (`"https://..."`)。

ほとんどの環境では、この 2 行は約 0.8-2.0 秒の間隔で OpenClaw に到着します。結合しない場合、エージェントはターン 1 でコマンドだけを受け取り、返信し (多くの場合「URL を送ってください」)、ターン 2 で初めて URL を見ます。その時点では、コマンドのコンテキストはすでに失われています。これは Apple の送信パイプラインによるものであり、OpenClaw や `imsg` が導入しているものではありません。

`channels.imessage.coalesceSameSenderDms` は、DM に対して、同じ送信者から連続して届く行のバッファリングをオプトインします。`imsg` がソース行の 1 つで構造的な URL プレビューマーカー `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` を公開している場合、OpenClaw はその実際の分割送信だけをマージし、その他のバッファ済み行は別々のターンとして保持します。バルーンメタデータをまったく出力しない古い `imsg` ビルドでは、OpenClaw は分割送信と個別送信を判別できないため、バケットのマージにフォールバックします。これにより、メタデータ以前の動作が維持され、`Dump <url>` の分割送信が 2 ターンに退行することを避けます。グループチャットは、複数ユーザーのターン構造を保つため、引き続きメッセージ単位でディスパッチされます。

<Tabs>
  <Tab title="有効にするタイミング">
    次の場合に有効化します:

    - 1 つのメッセージ内に `command + payload` があることを期待するスキル (dump、paste、save、queue など) を提供している。
    - ユーザーがコマンドと一緒に URL を貼り付ける。
    - 追加される DM ターン遅延を許容できる (下記参照)。

    次の場合は無効のままにします:

    - 1 語の DM トリガーで最小のコマンド遅延が必要。
    - すべてのフローが、後続ペイロードのない単発コマンドである。

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

    フラグがオンで、明示的な `messages.inbound.byChannel.imessage` またはグローバルな `messages.inbound.debounceMs` がない場合、デバウンスウィンドウは **7000 ms** まで広がります (レガシーデフォルトは 0 ms — デバウンスなし)。Apple の URL プレビュー分割送信の間隔は、Messages.app がプレビュー行を発行する間に数秒まで伸びる場合があるため、より広いウィンドウが必要です。

    ウィンドウを自分で調整するには:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="トレードオフ">
    - **正確なマージには現在の `imsg` ペイロードメタデータが必要です。** URL 行に `balloon_bundle_id` が含まれる場合、その実際の分割送信だけがマージされ、その他のバッファ済み行は別々に保たれます。バルーンメタデータを公開しない古い `imsg` ビルドでは、OpenClaw はバッファ済みバケットのマージにフォールバックするため、`Dump <url>` の分割送信が 2 ターンに退行しません (暫定的な後方互換性で、`imsg` が上流で分割送信を結合するようになったら削除されます)。
    - **DM メッセージに遅延が追加されます。** フラグがオンの場合、すべての DM (単体の制御コマンドや単一テキストのフォローアップを含む) は、URL プレビュー行が来る可能性に備えて、ディスパッチ前に最大でデバウンスウィンドウ分だけ待機します。グループチャットメッセージは即時ディスパッチを維持します。
    - **マージされた出力には上限があります。** マージされたテキストは、明示的な `…[truncated]` マーカー付きで 4000 文字に制限されます。添付ファイルは 20 件まで、ソースエントリは 10 件までです (それを超える場合は最初と最新を保持)。すべてのソース GUID は、下流テレメトリ用に `coalescedMessageGuids` で追跡されます。
    - **DM のみ。** グループチャットはメッセージ単位のディスパッチにフォールスルーするため、複数人が入力しているときもボットの応答性が保たれます。
    - **オプトイン、チャネル単位。** 他のチャネル (Telegram、WhatsApp、Slack、…) には影響しません。`channels.bluebubbles.coalesceSameSenderDms` を設定しているレガシー BlueBubbles 設定は、その値を `channels.imessage.coalesceSameSenderDms` に移行してください。

  </Tab>
</Tabs>

### シナリオとエージェントが見る内容

「Flag on」列は、`balloon_bundle_id` を出力する `imsg` ビルドでの動作を示します。バルーンメタデータをまったく出力しない古い `imsg` ビルドでは、下で「2 ターン」/「N ターン」と記された行は、代わりにレガシーなマージ（1 ターン）へフォールバックします。OpenClaw は分割送信と個別送信を構造的に判別できないため、メタデータ導入前のマージを維持します。ビルドがバルーンメタデータを出力すると、正確な分離が有効になります。

| ユーザーの入力                                                      | `chat.db` の生成内容                  | フラグオフ（デフォルト）                      | フラグオン + ウィンドウ（imsg がバルーンメタデータを出力）                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`（1 回の送信）                              | 約 1 秒間隔の 2 行                   | 2 つのエージェントターン：「Dump」のみ、その後 URL | 1 ターン：マージされたテキスト `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption`（添付 + テキスト）                | URL バルーンメタデータなしの 2 行 | 2 ターン                               | メタデータが観測された後は 2 ターン。古い/ラッチ前のメタデータなしセッションでは 1 つのマージ済みターン       |
| `/status`（単独コマンド）                                     | 1 行                               | 即時ディスパッチ                        | **ウィンドウまで待機し、その後ディスパッチ**                                                                |
| URL のみ貼り付け                                                   | 1 行                               | 即時ディスパッチ                        | ウィンドウまで待機し、その後ディスパッチ                                                                    |
| テキスト + URL を意図的に 2 つの別メッセージとして数分間隔で送信 | ウィンドウ外の 2 行               | 2 ターン                               | 2 ターン（その間にウィンドウが期限切れになる）                                                             |
| 高速な大量送信（ウィンドウ内に 10 件超の小さな DM）                          | URL バルーンメタデータなしの N 行 | N ターン                                 | メタデータが観測された後は N ターン。古い/ラッチ前のメタデータなしセッションでは境界付きの 1 つのマージ済みターン |
| グループチャットで 2 人が入力                                  | M 人の送信者からの N 行               | M+ ターン（送信者バケットごとに 1 つ）        | M+ ターン — グループチャットは結合されません                                                            |

## ブリッジまたは Gateway 再起動後の受信リカバリー

iMessage は Gateway 停止中に取り逃したメッセージをリカバリーし、同時に Push リカバリー後に Apple がフラッシュすることがある古い「バックログ爆弾」を抑制します。デフォルト動作は常に有効で、受信重複排除の上に構築されています。

- **リプレイ重複排除。** ディスパッチされたすべての受信メッセージは、Apple GUID によって永続 Plugin 状態（`imessage.inbound-dedupe`）に記録され、取り込み時にクレームされ、処理後にコミットされます（一時的な失敗時にはリリースされるため再試行できます）。すでに処理済みのものは、2 回ディスパッチされる代わりに破棄されます。これにより、メッセージごとの帳簿管理なしにリカバリーを積極的にリプレイできます。
- **停止時間リカバリー。** 起動時にモニターは最後にディスパッチした `chat.db` rowid（永続化されたアカウントごとのカーソル）を記憶し、それを `since_rowid` として `imsg watch.subscribe` に渡します。そのため imsg は Gateway 停止中に到着した行をリプレイし、その後ライブを追尾します。リプレイは直近の行と約 2 時間以内のメッセージに制限され、重複排除により処理済みのものは破棄されます。
- **古いバックログの経過時間フェンス。** 起動境界より上の行は本当にライブです。送信日時が到着より約 15 分以上古いものは Push フラッシュのバックログとして抑制されます。リプレイされた行（境界以下）は代わりに広いリカバリーウィンドウを使うため、最近取り逃したメッセージは配信され、古い履歴は配信されません。

リカバリーはローカルとリモートの `cliPath` セットアップの両方で機能します。`since_rowid` リプレイは同じ `imsg` RPC 接続上で実行されるためです。違いはウィンドウです。Gateway が `chat.db` を読める場合（ローカル）、起動時の rowid 境界を固定し、リプレイ範囲を制限し、数時間以内に取り逃したメッセージを配信します。リモート SSH `cliPath` 経由ではデータベースを読めないため、リプレイは制限されず、すべての行にライブ経過時間フェンスが使われます。最近取り逃したメッセージは引き続きリカバリーされ、古いバックログも抑制されますが、より狭いライブウィンドウになります。より広いリカバリーウィンドウを使うには、Messages Mac 上で Gateway を実行してください。

### オペレーターに見えるシグナル

抑制されたバックログはデフォルトレベルでログに記録され、黙って破棄されることはありません（`recovery` フラグはどのウィンドウが適用されたかを示します）。

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### マイグレーション

`channels.imessage.catchup.*` は非推奨です。停止時間リカバリーは現在自動で行われ、新規セットアップでは設定不要です。`catchup.enabled: true` を含む既存設定は、リカバリーリプレイウィンドウの互換プロファイルとして引き続き尊重されます。無効な catchup ブロック（`enabled: false` または `enabled: true` なし）は廃止されます。`openclaw doctor --fix` がそれらを削除します。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="imsg が見つからない、または RPC が未対応">
    バイナリと RPC 対応を検証します。

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    probe が RPC 未対応を報告する場合は、`imsg` を更新してください。プライベート API アクションを利用できない場合は、ログイン中の macOS ユーザーセッションで `imsg launch` を実行し、再度 probe してください。Gateway が macOS 上で実行されていない場合は、デフォルトのローカル `imsg` パスではなく、上記の SSH 経由のリモート Mac セットアップを使用してください。

  </Accordion>

  <Accordion title="Messages は送信されるが、受信 iMessage が届かない">
    まずメッセージがローカル Mac に到達したかを証明します。`chat.db` が変化しない場合、`imsg status --json` が正常なブリッジを報告していても、OpenClaw はメッセージを受信できません。

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    電話から送信したメッセージで新しい行が作成されない場合は、OpenClaw 設定を変更する前に macOS Messages と Apple Push レイヤーを修復してください。多くの場合、1 回限りのサービス更新で十分です。

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    OpenClaw セッションをデバッグする前に、電話から新しい iMessage を送信し、新しい `chat.db` 行または `imsg watch` イベントを確認してください。これを定期的なブリッジ再起動ループとして実行しないでください。作業中に `imsg launch` と Gateway 再起動を繰り返すと、配信が中断され、進行中のチャネル実行が取り残される可能性があります。

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
    - `channels.imessage.groups` allowlist 動作
    - メンションパターン設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="リモート添付ファイルが失敗する">
    次を確認します。

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway ホストからの SSH/SCP キー認証
    - Gateway ホスト上の `~/.ssh/known_hosts` にホストキーが存在すること
    - Messages を実行している Mac 上でリモートパスを読み取れること

  </Accordion>

  <Accordion title="macOS 権限プロンプトを見逃した">
    同じユーザー/セッションコンテキストの対話型 GUI ターミナルで再実行し、プロンプトを承認します。

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw/`imsg` を実行するプロセスコンテキストに、フルディスクアクセス + オートメーションが許可されていることを確認します。

  </Accordion>
</AccordionGroup>

## 設定リファレンスの参照先

- [設定リファレンス - iMessage](/ja-JP/gateway/config-channels#imessage)
- [Gateway 設定](/ja-JP/gateway/configuration)
- [ペアリング](/ja-JP/channels/pairing)

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage) — 告知とマイグレーション概要
- [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) — 設定変換表と段階的な切り替え手順
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャット動作とメンションゲーティング
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとハードニング
