---
read_when:
    - iMessage サポートの設定
    - iMessage の送受信をデバッグする
summary: imsg（stdio 経由の JSON-RPC）によるネイティブ iMessage サポート。返信、タップバック、エフェクト、投票、添付ファイル、グループ管理のためのプライベート API アクションに対応します。ホスト要件に合う場合、新しい OpenClaw iMessage セットアップで推奨されます。
title: iMessage
x-i18n:
    generated_at: "2026-07-05T17:39:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f4932ab612ce9ef8542e030962f64b828a633167654a0dfe09561aff543cc96
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
OpenClaw iMessage デプロイでは、サインイン済みの macOS Messages ホスト上で `imsg` を使用します。Gateway が Linux または Windows で動作している場合は、Mac 上で `imsg` を実行する SSH ラッパーを `channels.imessage.cliPath` に指定します。

**インバウンド復旧は自動です。** ブリッジまたは Gateway の再起動後、iMessage は停止中に取りこぼしたメッセージを再生し、Push 復旧後に Apple がフラッシュする可能性がある古い「backlog bomb」を抑制し、重複排除によって同じものが二度ディスパッチされないようにします。有効化する設定はありません。[ブリッジまたは Gateway 再起動後のインバウンド復旧](#inbound-recovery-after-a-bridge-or-gateway-restart)を参照してください。
</Note>

<Warning>
BlueBubbles サポートは削除されました。`channels.bluebubbles` 設定を `channels.imessage` に移行してください。OpenClaw は `imsg` 経由の iMessage のみをサポートします。短い告知は [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage)から、完全な移行表は [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles)から開始してください。
</Warning>

ステータス: ネイティブ外部 CLI 統合。Gateway は `imsg rpc` を起動し、stdio 経由で JSON-RPC をやり取りします。別個のデーモンやポートはありません。高度なアクションには `imsg launch` と、private API プローブの成功が必要です。

<CardGroup cols={3}>
  <Card title="Private API アクション" icon="wand-sparkles" href="#private-api-actions">
    返信、tapback、エフェクト、投票、添付ファイル、グループ管理。
  </Card>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    iMessage DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="SSH 経由のリモート Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gateway が Messages Mac 上で動作していない場合は SSH ラッパーを使用します。
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
    OpenClaw が必要とするのは stdio 互換の `cliPath` だけなので、リモート Mac に SSH して `imsg` を実行するラッパースクリプトを `cliPath` に指定できます。

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    添付ファイルを有効にしている場合の推奨設定:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: extra allowed attachment roots (merged with the default
      // /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost` が設定されていない場合、OpenClaw は SSH ラッパースクリプトを解析して自動検出を試みます。
    `remoteHost` は `host` または `user@host` である必要があります（スペースや SSH オプションは不可）。安全でない値は無視されます。
    OpenClaw は SCP に厳格なホストキー確認を使用するため、リレーホストキーはすでに `~/.ssh/known_hosts` に存在している必要があります。
    添付ファイルパスは許可されたルート（`attachmentRoots` / `remoteAttachmentRoots`）に対して検証されます。

<Warning>
`imsg` の前段に置く `cliPath` ラッパーまたは SSH プロキシは、長時間稼働する JSON-RPC に対して透過的な stdio パイプのように動作しなければなりません。OpenClaw は、そのチャネルの存続期間中、ラッパーの stdin/stdout 経由で小さな改行区切りの JSON-RPC メッセージを交換します。

- 各 stdin チャンク/行を**バイトが利用可能になり次第**転送します。EOF を待たないでください。
- 各 stdout チャンク/行を逆方向へ速やかに転送します。
- 改行を保持します。
- 小さなフレームを枯渇させる可能性がある固定サイズのブロッキング読み取り（`read(4096)`、`cat | buffer`、デフォルトのシェル `read`）は避けます。
- stderr を JSON-RPC stdout ストリームから分離します。

大きなブロックが埋まるまで stdin をバッファリングするラッパーは、`imsg rpc` 自体が正常でも、iMessage 障害のように見える症状、つまり `imsg rpc timeout (chats.list)` やチャネルの繰り返し再起動を引き起こします。上記の `ssh -T host imsg "$@"` は、`rpc` や `--db` などの OpenClaw の `cliPath` 引数を転送するため安全です。`ssh host imsg | grep -v '^DEBUG'` のようなパイプラインは安全ではありません。行バッファリングされたツールでもフレームを保持する可能性があります。フィルタリングが必要な場合は、すべての段階で `stdbuf -oL -eL` を使用してください。
</Warning>

  </Tab>
</Tabs>

## 要件と権限（macOS）

- `imsg` を実行する Mac で Messages にサインインしている必要があります。
- OpenClaw/`imsg` を実行するプロセスコンテキストには Full Disk Access が必要です（Messages DB アクセス）。
- Messages.app 経由でメッセージを送信するには Automation 権限が必要です。
- 高度なアクション（react / edit / unsend / スレッド返信 / エフェクト / 投票 / グループ操作）には System Integrity Protection を無効にする必要があります。[imsg private API の有効化](#enabling-the-imsg-private-api)を参照してください。基本的なテキストとメディアの送受信は、それなしで動作します。

<Tip>
権限はプロセスコンテキストごとに付与されます。Gateway をヘッドレス（LaunchAgent/SSH）で実行する場合は、プロンプトを表示するため、同じコンテキストで一度だけ対話的なコマンドを実行します。

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH ラッパーの送信が AppleEvents -1743 で失敗する">
  リモート SSH セットアップでは、チャットの読み取り、`channels status --probe` の通過、インバウンドメッセージの処理はできても、アウトバウンド送信が AppleEvents 認可エラーで失敗する場合があります。

```text
Not authorized to send Apple events to Messages. (-1743)
```

サインイン済みの Mac ユーザーの TCC データベース、または System Settings > Privacy & Security > Automation を確認してください。Automation エントリが `imsg` やローカルシェルプロセスではなく `/usr/libexec/sshd-keygen-wrapper` に記録されている場合、macOS はその SSH サーバー側クライアントに対して使用可能な Messages トグルを表示しないことがあります。

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

その状態では、`tccutil reset AppleEvents` を繰り返したり、同じ SSH ラッパー経由で `imsg send` を再実行したりしても失敗し続ける可能性があります。Messages Automation を必要とするプロセスコンテキストが、UI で許可できるアプリではなく SSH ラッパーだからです。

代わりに、サポートされている `imsg` プロセスコンテキストのいずれかを使用します。

- Gateway、または少なくとも `imsg` ブリッジを、ログイン済み Messages ユーザーのローカルセッションで実行します。
- 同じセッションから Full Disk Access と Automation を付与した後、そのユーザーの LaunchAgent で Gateway を起動します。
- 2 ユーザー SSH トポロジを維持する場合は、チャネルを有効にする前に、実際のアウトバウンド `imsg send` が正確なラッパー経由で成功することを確認します。Automation を付与できない場合は、送信を SSH ラッパーに依存するのではなく、単一ユーザーの `imsg` セットアップに再設定してください。

</Accordion>

## imsg private API の有効化

`imsg` は 2 つの運用モードで提供されます。

- **基本モード**（デフォルト、SIP 変更不要）: `send` によるアウトバウンドのテキストとメディア、インバウンドの監視/履歴、チャット一覧。これは、新しい `brew install steipete/tap/imsg` と上記の標準 macOS 権限だけで利用できるものです。
- **Private API モード**: `imsg` は helper dylib を `Messages.app` に注入し、内部 `IMCore` 関数を呼び出します。これにより、`react`、`edit`、`unsend`、`reply`（スレッド）、`sendWithEffect`、`poll` と `poll-vote`（ネイティブ Messages 投票）、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup` に加え、入力インジケーターと既読通知が利用可能になります。

このページの高度なアクションサーフェスには Private API モードが必要です。`imsg` README は、この要件を明示しています。

> `read`、`typing`、`launch`、ブリッジ支援のリッチ送信、メッセージ変更、チャット管理などの高度な機能はオプトインです。SIP を無効にし、helper dylib を `Messages.app` に注入する必要があります。SIP が有効な場合、`imsg launch` は注入を拒否します。

helper 注入の手法では、`imsg` 独自の dylib を使用して Messages private API に到達します。OpenClaw iMessage パスには、サードパーティサーバーや BlueBubbles ランタイムはありません。

<Warning>
**SIP を無効にすることは実際のセキュリティ上のトレードオフです。** SIP は変更されたシステムコードの実行に対する macOS の中核的な保護の 1 つです。システム全体で無効にすると、追加の攻撃面と副作用が発生します。特に、**Apple Silicon Mac で SIP を無効にすると、Mac に iOS アプリをインストールして実行する機能も無効になります**。

これはデフォルトではなく、意図的な運用上の選択として扱ってください。脅威モデルが SIP の無効化を許容できない場合、バンドルされた iMessage は基本モードに制限されます。つまり、テキストとメディアの送受信のみで、リアクション / edit / unsend / エフェクト / グループ操作はありません。
</Warning>

### セットアップ

1. Messages.app を実行する Mac に **`imsg` をインストール（またはアップグレード）** します。

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 出力は `bridge_version`、`rpc_methods`、およびメソッドごとの `selectors` を報告するため、開始前に現在のビルドが何をサポートしているかを確認できます。

2. **System Integrity Protection と、（現代の macOS では）Library Validation を無効にします。** Apple 署名済みの `Messages.app` に非 Apple の helper dylib を注入するには、SIP をオフにし、**かつ** library validation を緩和する必要があります。Recovery モードでの SIP 手順は macOS バージョンによって異なります。
   - **macOS 10.13-10.15（Sierra-Catalina）:** Terminal で Library Validation を無効化し、Recovery Mode へ再起動して `csrutil disable` を実行し、再起動します。
   - **macOS 11+（Big Sur 以降）、Intel:** Recovery Mode（または Internet Recovery）、`csrutil disable`、再起動。
   - **macOS 11+、Apple Silicon:** 電源ボタン起動シーケンスで Recovery に入ります。最近の macOS バージョンでは Continue をクリックするときに **Left Shift** キーを押し、その後 `csrutil disable` を実行します。仮想マシンのセットアップは別のフローに従うため、先に VM スナップショットを取得してください。

   **macOS 11 以降では、通常 `csrutil disable` だけでは不十分です。** Apple は `Messages.app` をプラットフォームバイナリとして library validation の対象にし続けるため、SIP がオフでも adhoc 署名された helper は拒否されます（`Library Validation failed: ... platform binary, but mapped file is not`）。SIP を無効にした後、library validation も無効にして再起動します。

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26（Tahoe）、26.5.1 で検証済み:** SIP オフ**に加えて**上記の `DisableLibraryValidation` コマンドを実行すれば、26.0 から 26.5.x まで helper を注入するには十分です。**boot-args は不要です。** plist が決定的な要因であり、Tahoe で注入が失敗する場合に最もよく不足している手順です。
   - **plist あり:** `imsg launch` が注入し、`imsg status` は `advanced_features: true` を報告します。
   - **plist なし（SIP がオフでも）:** `imsg launch` は `Failed to launch: Timeout waiting for Messages.app to initialize` で失敗します。AMFI が読み込み時に adhoc helper を拒否するため、ブリッジは準備完了にならず、起動がタイムアウトします。このタイムアウトは Tahoe で多くの人が遭遇する症状です。修正は上記の plist であり、より抜本的な対応ではありません。

   macOS アップグレード後に `imsg launch` の注入や特定の `selectors` が false を返し始めた場合、このゲートが通常の原因です。SIP と library-validation の状態を確認してから、SIP 手順自体が失敗したと判断してください。これらの設定が正しくてもブリッジがまだ注入できない場合は、追加のシステム全体のセキュリティ制御を弱めるのではなく、`imsg status --json` と `imsg launch` の出力を収集して `imsg` プロジェクトに報告してください。

3. **ヘルパーを注入します。** SIP を無効にし、Messages.app にサインインした状態で:

   ```bash
   imsg launch
   ```

   SIP がまだ有効な場合、`imsg launch` は注入を拒否するため、これは手順 2 が反映されたことの確認にもなります。

4. **OpenClaw からブリッジを検証します:**

   ```bash
   openclaw channels status --probe
   ```

   iMessage の項目は `works` を報告するはずです。また、`imsg status --json | jq '{rpc_methods, selectors}'` は、使用している macOS ビルドが公開している機能を表示するはずです。投票作成には `selectors.pollPayloadMessage` が必要です。投票には `selectors.pollVoteMessage` と `poll.vote` RPC メソッドの両方が必要です。OpenClaw Plugin は、キャッシュされたプローブでサポートされているアクションだけを公開します。一方、空のキャッシュは楽観的に扱われ、最初のディスパッチ時にプローブします。

`openclaw channels status --probe` がチャネルを `works` と報告しているのに、特定のアクションがディスパッチ時に「iMessage `<action>` requires the imsg private API bridge」を投げる場合は、`imsg launch` をもう一度実行してください。ヘルパーは外れることがあり (Messages.app の再起動、OS 更新など)、キャッシュされた `available: true` ステータスは次のプローブが更新されるまでアクションを公開し続けます。

### SIP を有効のままにする場合

SIP の無効化が脅威モデル上許容できない場合:

- `imsg` は基本モードにフォールバックします — テキスト + メディア + 受信のみ。
- OpenClaw Plugin は引き続きテキスト/メディア送信と受信監視を公開します。アクションサーフェスからは、メソッドごとの機能ゲートに従って `react`、`edit`、`unsend`、`reply`、`sendWithEffect`、グループ操作を非表示にします。
- iMessage ワークロード用に、SIP をオフにした別の Apple-Silicon 以外の Mac (または専用ボット Mac) を実行し、主要デバイスでは SIP を有効のままにできます。下記の [専用ボット macOS ユーザー (別の iMessage ID)](#deployment-patterns) を参照してください。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` はダイレクトメッセージを制御します:

    - `pairing` (デフォルト)
    - `allowlist` (少なくとも 1 つの `allowFrom` エントリが必要)
    - `open` (`allowFrom` に `"*"` を含める必要あり)
    - `disabled`

    Allowlist フィールド: `channels.imessage.allowFrom`。

    Allowlist エントリは送信者を識別する必要があります: ハンドル、または静的送信者アクセスグループ (`accessGroup:<name>`)。`chat_id:*`、`chat_guid:*`、`chat_identifier:*` などのチャットターゲットには `channels.imessage.groupAllowFrom` を使用します。数値の `chat_id` レジストリキーには `channels.imessage.groups` を使用します。

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` はグループ処理を制御します:

    - `allowlist` (デフォルト)
    - `open`
    - `disabled`

    グループ送信者 allowlist: `channels.imessage.groupAllowFrom`。

    `groupAllowFrom` エントリは、静的送信者アクセスグループ (`accessGroup:<name>`) も参照できます。

    ランタイムフォールバック: `groupAllowFrom` が未設定の場合、iMessage のグループ送信者チェックは `allowFrom` を使用します。DM とグループの許可を分ける必要がある場合は `groupAllowFrom` を設定してください。明示的に空の `groupAllowFrom: []` はフォールバックしません — `allowlist` の下ですべてのグループ送信者をブロックします。
    ランタイムメモ: `channels.imessage` が完全に存在しない場合、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに出します (`channels.defaults.groupPolicy` が設定されていても同様です)。

    <Warning>
    `groupPolicy: "allowlist"` の下でのグループルーティングは、**2 つ**のゲートを連続して実行します:

    1. **送信者 allowlist** (`channels.imessage.groupAllowFrom`) — ハンドル、`accessGroup:<name>`、`chat_guid`、`chat_identifier`、または `chat_id`。有効なリストが空 (つまり `groupAllowFrom` がなく、`allowFrom` フォールバックもない) の場合、すべてのグループ送信者をブロックします。
    2. **グループレジストリ** (`channels.imessage.groups`) — マップにエントリがある場合に適用されます。チャットは明示的な `chat_id` ごとのエントリ、または `groups: { "*": { ... } }` ワイルドカードに一致する必要があります。`groups` が空または存在しない場合は、送信者 allowlist だけで許可が決まります。

    有効なグループ送信者 allowlist が構成されていない場合、すべてのグループメッセージはレジストリゲートの前に破棄されます。各ゲートには、デフォルトログレベルで独自の `warn` レベルシグナルがあり、それぞれ別の修正方法を示します:

    - 起動時にアカウントごと 1 回、有効なグループ送信者 allowlist が空の場合: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — `channels.imessage.groupAllowFrom` (または `allowFrom`) を設定して修正します。`groups` エントリだけを追加しても、ゲート 1 がすべての送信者をブロックしたままです。
    - 実行時に `chat_id` ごと 1 回、送信者がゲート 1 を通過したが、入力済みの `groups` レジストリにチャットが存在しない場合: `imessage: dropping group message from chat_id=<id> ...` — その `chat_id` (または `"*"`) を `channels.imessage.groups` の下に追加して修正します。

    DM には影響しません — 別のコードパスを使用します。

    `groupPolicy: "allowlist"` の下でのグループフローに推奨される構成:

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

    `groupAllowFrom` だけでも、それらの送信者を任意のグループで許可します。許可するチャット範囲を限定する (また `requireMention` などのチャットごとのオプションを設定する) には、`groups` ブロックを追加します。
    </Warning>

    グループのメンションゲート:

    - iMessage にはネイティブのメンションメタデータがありません
    - メンション検出は正規表現パターン (`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`) を使用します
    - 構成されたパターンがない場合、メンションゲートは適用できません
    - 許可された送信者からの制御コマンドはメンションゲートをバイパスします

    グループごとの `systemPrompt`:

    `channels.imessage.groups.*` の各エントリは、任意の `systemPrompt` 文字列を受け付けます。これは、そのグループ内のメッセージを処理するすべてのターンで、エージェントのシステムプロンプトに注入されます。解決方法は `channels.whatsapp.groups` と同じです:

    1. **グループ固有のシステムプロンプト** (`groups["<chat_id>"].systemPrompt`): 特定のグループエントリがマップ内に存在し、**かつ**その `systemPrompt` キーが定義されている場合に使用されます。`systemPrompt` が空文字列 (`""`) の場合、ワイルドカードは抑制され、そのグループにはシステムプロンプトが適用されません。
    2. **グループワイルドカードのシステムプロンプト** (`groups["*"].systemPrompt`): 特定のグループエントリがマップ内にまったく存在しない場合、または存在していても `systemPrompt` キーを定義していない場合に使用されます。

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

    グループごとのプロンプトはグループメッセージにのみ適用されます — ダイレクトメッセージには影響しません。

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM は直接ルーティングを使用します。グループはグループルーティングを使用します。
    - デフォルトの `session.dmScope=main` では、iMessage DM はエージェントのメインセッションに統合されます。
    - グループセッションは分離されます (`agent:<agentId>:imessage:group:<chat_id>`)。
    - 返信は、発信元チャネル/ターゲットメタデータを使用して iMessage に戻されます。

    グループに近いスレッドの挙動:

    複数参加者の iMessage スレッドの一部は `is_group=false` で届くことがあります。
    その `chat_id` が `channels.imessage.groups` の下で明示的に構成されている場合、OpenClaw はそれをグループトラフィックとして扱います (グループゲート + グループセッション分離)。

  </Tab>
</Tabs>

## ACP 会話バインディング

iMessage チャットは ACP セッションにバインドできます。

高速なオペレーターフロー:

- DM または許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 同じ iMessage 会話内の今後のメッセージは、生成された ACP セッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

構成済みの永続バインディングは、`type: "acp"` と `match.channel: "imessage"` を持つトップレベルの `bindings[]` エントリを使用します。

`match.peer.id` には次を使用できます:

- `+15555550123` や `user@example.com` などの正規化済み DM ハンドル
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

共通の ACP バインディング動作については [ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

## デプロイパターン

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    ボットトラフィックを個人の Messages プロファイルから分離するために、専用の Apple ID と macOS ユーザーを使用します。

    一般的なフロー:

    1. 専用の macOS ユーザーを作成/サインインします。
    2. そのユーザーで、ボット用 Apple ID を使って Messages にサインインします。
    3. そのユーザーに `imsg` をインストールします。
    4. OpenClaw がそのユーザーコンテキストで `imsg` を実行できるように SSH ラッパーを作成します。
    5. `channels.imessage.accounts.<id>.cliPath` と `.dbPath` をそのユーザープロファイルに向けます。

    初回実行時には、そのボットユーザーセッションで GUI 承認 (Automation + Full Disk Access) が必要になる場合があります。

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    一般的なトポロジー:

    - gateway は Linux/VM 上で実行されます
    - iMessage + `imsg` は tailnet 内の Mac 上で実行されます
    - `cliPath` ラッパーは SSH を使って `imsg` を実行します
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

    SSH と SCP の両方が非対話になるように SSH キーを使用します。
    最初にホストキーを信頼済みにし (例: `ssh bot@mac-mini.tailnet-1234.ts.net`)、`known_hosts` が設定されていることを確認します。

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage は `channels.imessage.accounts` の下でアカウントごとの構成をサポートします。

    各アカウントは、`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルルート allowlist などのフィールドを上書きできます。

  </Accordion>

  <Accordion title="Direct-message history">
    `channels.imessage.dmHistoryLimit` を設定すると、新しいダイレクトメッセージセッションに、その会話の最近デコードされた `imsg` 履歴をシードします。送信者ごとの上書きには `channels.imessage.dms["<sender>"].historyLimit` を使用します。送信者の履歴を無効にするには `0` を指定します。

    iMessage DM 履歴は、必要に応じて `imsg` から取得されます。`dmHistoryLimit` を未設定のままにすると、グローバルな DM 履歴シードは無効になりますが、送信者ごとの正の `channels.imessage.dms["<sender>"].historyLimit` は、その送信者のシードを引き続き有効にします。

  </Accordion>
</AccordionGroup>

## メディア、チャンク分割、配信ターゲット

<AccordionGroup>
  <Accordion title="添付ファイルとメディア">
    - インバウンド添付ファイルの取り込みは**デフォルトでオフ**です — 写真、ボイスメモ、動画、その他の添付ファイルをエージェントに転送するには、`channels.imessage.includeAttachments: true` を設定します。無効の場合、添付ファイルのみの iMessage はエージェントに届く前に破棄され、`Inbound message` ログ行がまったく生成されないことがあります。
    - `remoteHost` が設定されている場合、リモート添付ファイルパスは SCP 経由で取得できます
    - 添付ファイルパスは許可されたルートと一致する必要があります:
      - `channels.imessage.attachmentRoots` (ローカル)
      - `channels.imessage.remoteAttachmentRoots` (リモート SCP モード)
      - 設定されたルートは、デフォルトのルートパターン `/Users/*/Library/Messages/Attachments` を拡張します (置き換えではなくマージ)
    - SCP は厳格なホストキー確認 (`StrictHostKeyChecking=yes`) を使用します
    - アウトバウンドメディアサイズは `channels.imessage.mediaMaxMb` を使用します (デフォルト 16 MB)

  </Accordion>

  <Accordion title="アウトバウンドテキストとチャンク分割">
    - テキストチャンク制限: `channels.imessage.textChunkLimit` (デフォルト 4000)
    - チャンクモード: `channels.imessage.chunkMode`
      - `length` (デフォルト)
      - `newline` (段落優先の分割)
    - アウトバウンドの markdown 太字/斜体/下線/取り消し線はネイティブのスタイル付きテキストに変換されます (macOS 15+ の受信者はスタイルを表示し、古い受信者にはマーカーなしのプレーンテキストが表示されます)。markdown テーブルはチャンネルの markdown テーブルモードに従って変換されます
    - `channels.imessage.sendTransport` (`auto` デフォルト、`bridge`、`applescript`) は `imsg` が送信を配信する方法を選択します

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

## プライベート API アクション

`imsg launch` が実行中で、`openclaw channels status --probe` が `privateApi.available: true` を報告する場合、メッセージツールは通常のテキスト送信に加えて iMessage ネイティブのアクションを使用できます。

すべてのアクションはデフォルトで有効です。個別のアクションをオフにするには `channels.imessage.actions` を使用します:

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
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="利用可能なアクション">
    - **react**: iMessage tapback を追加/削除します (`messageId`、`emoji`、`remove`)。サポートされる tapback は love、like、dislike、laugh、emphasize、question にマップされます。絵文字なしで削除すると、設定されていた tapback がクリアされます。
    - **reply**: 既存メッセージへのスレッド返信を送信します (`messageId`、`text` または `message`、および `chatGuid`、`chatId`、`chatIdentifier`、または `to`)。添付ファイル付き返信には、さらに `send-rich` が `--file` をサポートする `imsg` ビルドが必要です。
    - **sendWithEffect**: iMessage エフェクト付きでテキストを送信します (`text` または `message`、`effect` または `effectId`)。短い名前: slam、loud、gentle、invisibleink、confetti、lasers、fireworks、balloon、heart、echo、happybirthday、shootingstar、sparkles、spotlight。
    - **edit**: サポートされる macOS/プライベート API バージョンで送信済みメッセージを編集します (`messageId`、`text` または `newText`)。Gateway 自身が送信したメッセージのみ編集できます。
    - **unsend**: サポートされる macOS/プライベート API バージョンで送信済みメッセージを取り消します (`messageId`)。Gateway 自身が送信したメッセージのみ送信取り消しできます。
    - **upload-file**: メディア/ファイルを送信します (`buffer` は base64、またはハイドレート済みの `media`/`path`/`filePath`、`filename`、任意の `asVoice`)。レガシーエイリアス: `sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**: 現在のターゲットがグループ会話の場合にグループチャットを管理します。これらはホストの Messages アイデンティティを変更するため、オーナー送信者または `operator.admin` Gateway クライアントが必要です。
    - **poll**: ネイティブの Apple Messages 投票を作成します (`pollQuestion`、2 から 12 回繰り返す `pollOption`、および `chatGuid`、`chatId`、`chatIdentifier`、または `to`)。iOS/iPadOS/macOS 26+ の受信者はネイティブに表示して投票できます。古い OS バージョンでは「Sent a poll」というテキストフォールバックを受け取ります。`selectors.pollPayloadMessage` が必要です。
    - **poll-vote**: 既存の投票に投票します (`pollId` または `messageId`、および `pollOptionIndex`、`pollOptionId`、`pollOptionText` の正確に 1 つ)。`selectors.pollVoteMessage` と `poll.vote` RPC メソッドが必要です。

    受け入れられたインバウンド投票は、質問、番号付き選択肢ラベル、投票数、`poll-vote` に必要な投票メッセージ ID とともにエージェント向けにレンダリングされます。

  </Accordion>

  <Accordion title="メッセージ ID">
    インバウンド iMessage コンテキストには、利用可能な場合、短い `MessageSid` 値と完全なメッセージ GUID (`MessageSidFull`) の両方が含まれます。短い ID は最近の SQLite バックの返信キャッシュにスコープされ、使用前に現在のチャットと照合されます。短い ID の有効期限が切れているか別のチャットに属する場合は、完全な `MessageSidFull` で再試行してください。

  </Accordion>

  <Accordion title="機能検出">
    OpenClaw は、キャッシュされたプローブステータスが bridge を利用不可と示す場合にのみ、プライベート API アクションを非表示にします。ステータスが不明な場合、アクションは表示されたままで、ディスパッチ時に遅延プローブを行うため、`imsg launch` 後に別途手動でステータスを更新しなくても最初のアクションが成功できます。

  </Accordion>

  <Accordion title="開封確認と入力中表示">
    プライベート API bridge が起動している場合、受け入れられたインバウンドチャットは既読としてマークされ、ダイレクトチャットではターンが受け入れられるとすぐに、エージェントがコンテキストを準備して生成している間に入力中バブルが表示されます。既読マークを無効にするには:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    メソッド別の機能リストより前の古い `imsg` ビルドでは、入力中/既読が黙って無効化されます。OpenClaw は再起動ごとに 1 回だけ警告をログに出すため、確認が欠落している原因を特定できます。

  </Accordion>

  <Accordion title="インバウンド tapback">
    OpenClaw は iMessage tapback を購読し、受け入れられたリアクションを通常のメッセージテキストではなくシステムイベントとしてルーティングします。そのため、ユーザーの tapback が通常の返信ループをトリガーすることはありません。

    通知モードは `channels.imessage.reactionNotifications` で制御されます:

    - `"own"` (デフォルト): ユーザーがボット作成メッセージにリアクションした場合のみ通知します。
    - `"all"`: 承認済み送信者からのすべてのインバウンド tapback を通知します。
    - `"off"`: インバウンド tapback を無視します。

    アカウントごとのオーバーライドは `channels.imessage.accounts.<id>.reactionNotifications` を使用します。

  </Accordion>

  <Accordion title="承認リアクション (👍 / 👎)">
    `approvals.exec.enabled` または `approvals.plugin.enabled` が true でリクエストが iMessage にルーティングされる場合、Gateway は承認プロンプトをネイティブに配信し、tapback を受け入れて解決します:

    - `👍` (Like tapback) → `allow-once`
    - `👎` (Dislike tapback) → `deny`
    - `allow-always` は手動フォールバックのままです: 通常の返信として `/approve <id> allow-always` を送信します。

    リアクション処理では、リアクションしたユーザーのハンドルが明示的な承認者である必要があります。承認者リストは `channels.imessage.allowFrom` (または `channels.imessage.accounts.<id>.allowFrom`) から読み取られます。ユーザーの電話番号を E.164 形式で、または Apple ID メールを追加してください (`chat_id:*` のようなチャットターゲットは有効な承認者エントリではありません)。ワイルドカードエントリ `"*"` は尊重されますが、任意の送信者の承認を許可します。空の承認者リストはリアクションショートカットを完全に無効にします。リアクションショートカットは意図的に `reactionNotifications`、`dmPolicy`、`groupAllowFrom` をバイパスします。承認解決で重要なのは明示的な承認者許可リストだけだからです。

    `/approve` テキストコマンドの認可は同じリストに従います。`channels.imessage.allowFrom` が空でない場合、`/approve <id> <decision>` はその承認者リストに対して認可されます (より広い DM 許可リストではありません)。DM 許可リストでは許可されているが `allowFrom` に含まれない送信者は、明示的な拒否を受け取ります。`allowFrom` が空の場合、同一チャットフォールバックが有効なままで、`/approve` は DM 許可リストが許可する任意のユーザーを認可します。承認すべきすべてのオペレーターを、`/approve` 経由でもリアクション経由でも、`allowFrom` に追加してください。

    オペレーターノート:
    - リアクションバインディングはメモリと Gateway の永続的なキー付きストアの両方に保存され (TTL は承認の有効期限に合わせられます)、Gateway は保留中のプロンプトについて tapback もポーリングするため、Gateway の再起動直後に届いた tapback でも承認を解決できます。
    - オペレーター自身の `is_from_me=true` tapback (たとえばペアリング済み Apple デバイスからのもの) は、そのハンドルが明示的な承認者である場合に承認を解決します。
    - 承認プロンプトは、明示的な承認者が設定されている場合にのみグループ会話にルーティングされます。そうでない場合、任意のグループメンバーが承認できてしまいます。
    - レガシーのテキスト形式 tapback (非常に古い Apple クライアントからの `Liked "…"` プレーンテキスト) は、メッセージ GUID を持たないため承認を解決できません。リアクション解決には、現在の macOS / iOS クライアントが発行する構造化 tapback メタデータが必要です。

  </Accordion>
</AccordionGroup>

## 設定書き込み

iMessage は、デフォルトでチャンネル開始の設定書き込みを許可します (`commands.config: true` の場合の `/config set|unset` 用)。

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

## 分割送信 DM の結合 (1 つの構成内のコマンド + URL)

ユーザーがコマンドと URL を一緒に入力すると (例: `Dump https://example.com/article`)、Apple の Messages アプリは送信を**2 つの別々の `chat.db` 行**に分割します:

1. テキストメッセージ (`"Dump"`)。
2. OG プレビュー画像を添付ファイルとして持つ URL プレビューバルーン (`"https://..."`)。

ほとんどのセットアップでは、2 つの行は OpenClaw に約 0.8-2.0 秒差で到着します。結合しない場合、エージェントはターン 1 でコマンドだけを受け取り (多くの場合「URL を送ってください」と返信します)、その後ターン 2 で URL が届きます。これは Apple の送信パイプラインであり、OpenClaw や `imsg` が導入しているものではありません。

`channels.imessage.coalesceSameSenderDms` は、DM で同じ送信者から連続して届く行のバッファリングを有効にします。`imsg` がソース行の 1 つに構造的な URL プレビューマーカー `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` を公開する場合、OpenClaw はその実際の分割送信だけをマージし、その他のバッファ済み行は別々のターンとして保持します。バルーンメタデータをまったく出力しない古い `imsg` ビルドでは、OpenClaw は分割送信と別々の送信を区別できないため、バケットのマージにフォールバックします。これにより、`Dump <url>` の分割送信が 2 つのターンに回帰するのではなく、メタデータ以前の動作が維持されます。グループチャットでは、複数ユーザーのターン構造を維持するため、引き続きメッセージごとにディスパッチされます。

<Tabs>
  <Tab title="有効化する場合">
    次の場合に有効化します:

    - 1 つのメッセージ内の `command + payload` を想定するスキル (dump、paste、save、queue など) を提供している。
    - ユーザーがコマンドと一緒に URL を貼り付ける。
    - 追加される DM ターン遅延を許容できる (以下を参照)。

    次の場合は無効のままにします:

    - 単語 1 つの DM トリガーで最小のコマンド遅延が必要。
    - すべてのフローがペイロードのフォローアップなしのワンショットコマンドである。

  </Tab>
  <Tab title="有効化">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // オプトイン (デフォルト: false)
        },
      },
    }
    ```

    フラグがオンで、明示的な `messages.inbound.byChannel.imessage` またはグローバル `messages.inbound.debounceMs` がない場合、デバウンスウィンドウは **7000 ms** に広がります (レガシーデフォルトは 0 ms — デバウンスなし)。Apple の URL プレビュー分割送信のタイミングは、Messages.app がプレビュー行を発行する間に数秒まで伸びることがあるため、より広いウィンドウが必要です。

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
  <Tab title="Trade-offs">
    - **正確なマージには現在の `imsg` ペイロードメタデータが必要です。** `balloon_bundle_id` が存在する場合、実際の分割送信だけがマージされます。上記のメタデータなしフォールバックマージは暫定的な後方互換であり、`imsg` が上流で分割送信を結合するようになったら削除されます。
    - **DM メッセージに遅延が追加されます。** フラグがオンの場合、すべての DM（単独の制御コマンドや単一テキストのフォローアップを含む）は、URL プレビュー行が来る可能性に備えて、ディスパッチ前に最大でデバウンスウィンドウまで待機します。グループチャットメッセージは即時ディスパッチのままです。
    - **マージされた出力には上限があります。** マージされたテキストは明示的な `…[truncated]` マーカー付きで 4000 文字まで、添付ファイルは 20 個まで、ソースエントリは 10 個までに制限されます（それを超える場合は最初と最新が保持されます）。すべてのソース GUID は、下流のテレメトリ用に `coalescedMessageGuids` で追跡されます。
    - **DM のみ。** グループチャットはメッセージ単位のディスパッチにフォールスルーするため、複数人が入力しているときでもボットの応答性が維持されます。
    - **オプトインで、チャンネル単位です。** 他のチャンネル（Discord、Slack、Telegram、WhatsApp、…）には影響しません。`channels.bluebubbles.coalesceSameSenderDms` を設定しているレガシー BlueBubbles 設定は、その値を `channels.imessage.coalesceSameSenderDms` に移行する必要があります。

  </Tab>
</Tabs>

### シナリオとエージェントに見える内容

「フラグオン」列は、`balloon_bundle_id` を出力する `imsg` ビルドでの動作を示します。バルーンメタデータをまったく出力しない古い `imsg` ビルドでは、下記で「2 ターン」/「N ターン」と示されている行は、代わりにレガシーマージ（1 ターン）にフォールバックします。OpenClaw は分割送信と個別送信を構造的に判別できないため、メタデータ導入前のマージを保持します。ビルドがバルーンメタデータを出力するようになると、正確な分離が有効になります。

| ユーザーの作成内容                                                | `chat.db` の生成内容                | フラグオフ（デフォルト）                  | フラグオン + ウィンドウ（imsg がバルーンメタデータを出力）                                          |
| ------------------------------------------------------------------ | ----------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com`（1 回の送信）                           | 約 1 秒間隔で 2 行                  | 2 つのエージェントターン: 「Dump」のみ、その後 URL | 1 ターン: マージされたテキスト `Dump https://example.com`                                           |
| `Save this 📎image.jpg caption`（添付ファイル + テキスト）         | URL バルーンメタデータなしで 2 行   | 2 ターン                                  | メタデータが観測された後は 2 ターン。古い/ラッチ前のメタデータなしセッションでは 1 つのマージターン |
| `/status`（単独コマンド）                                         | 1 行                                | 即時ディスパッチ                          | **最大でウィンドウまで待機し、その後ディスパッチ**                                                  |
| URL のみを貼り付け                                                 | 1 行                                | 即時ディスパッチ                          | 最大でウィンドウまで待機し、その後ディスパッチ                                                      |
| テキスト + URL を数分空けて意図的に 2 つの別メッセージとして送信   | ウィンドウ外で 2 行                 | 2 ターン                                  | 2 ターン（その間にウィンドウが期限切れ）                                                            |
| 高速大量送信（ウィンドウ内に 10 件超の短い DM）                   | URL バルーンメタデータなしで N 行   | N ターン                                  | メタデータが観測された後は N ターン。古い/ラッチ前のメタデータなしセッションでは上限付きの 1 つのマージターン |
| グループチャットで 2 人が入力                                     | M 人の送信者から N 行               | M+ ターン（送信者バケットごとに 1 つ）    | M+ ターン — グループチャットは結合されません                                                        |

## ブリッジまたは Gateway 再起動後のインバウンド復旧

iMessage は Gateway の停止中に取り逃したメッセージを復旧し、同時に Push 復旧後に Apple が吐き出すことがある古い「バックログ爆弾」を抑制します。デフォルトの動作は常に有効で、インバウンド重複排除の上に構築されています。

- **リプレイ重複排除。** ディスパッチされたすべてのインバウンドメッセージは、その Apple GUID によって永続 Plugin 状態（`imessage.inbound-dedupe`）に記録され、取り込み時に確保され、処理後にコミットされます（一時的な失敗時はリトライできるよう解放されます）。すでに処理済みのものは、二重にディスパッチされる代わりに破棄されます。これにより、メッセージ単位の帳簿管理なしで復旧リプレイを積極的に行えます。
- **ダウンタイム復旧。** 起動時にモニターは最後にディスパッチした `chat.db` rowid（アカウントごとに永続化されたカーソル）を記憶し、それを `since_rowid` として `imsg watch.subscribe` に渡します。これにより、Gateway が停止している間に到着した行を imsg がリプレイし、その後ライブで追尾します。リプレイは直近 500 行まで、かつ約 2 時間前までのメッセージに制限され、重複排除によって処理済みのものは破棄されます。
- **古いバックログの年齢フェンス。** 起動境界より上の行は本当にライブです。送信日時が到着時刻より約 15 分以上古いものは Push フラッシュのバックログであり、抑制されます。リプレイされた行（境界以下）は代わりにより広い復旧ウィンドウを使用するため、最近取り逃したメッセージは配信され、古い履歴は配信されません。

復旧はローカルとリモートの両方の `cliPath` セットアップで機能します。`since_rowid` リプレイは同じ `imsg` RPC 接続上で実行されるためです。違いはウィンドウです。Gateway が `chat.db` を読み取れる場合（ローカル）、起動時 rowid 境界を固定し、リプレイ範囲に上限を設け、最大で数時間前までの取り逃したメッセージを配信します。リモート SSH `cliPath` 経由ではデータベースを読み取れないため、リプレイに上限はなく、すべての行がライブ年齢フェンスを使用します。それでも最近取り逃したメッセージは復旧し、古いバックログも抑制しますが、より狭いライブウィンドウになります。より広い復旧ウィンドウを使うには、Messages の Mac 上で Gateway を実行してください。

### オペレーターに見えるシグナル

抑制されたバックログはデフォルトレベルでログに記録され、黙って破棄されることはありません（`recovery` フラグはどのウィンドウが適用されたかを示します）。

```text
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### 移行

`channels.imessage.catchup.*` は非推奨です。ダウンタイム復旧は自動であり、新しいセットアップでは設定不要です。`catchup.enabled: true` を含む既存設定は、復旧リプレイウィンドウの互換プロファイルとして引き続き尊重されます。無効な catchup ブロック（`enabled: false` または `enabled: true` なし）は廃止され、`openclaw doctor --fix` がそれらを削除します。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    バイナリと RPC サポートを検証します。

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    プローブで RPC 非対応と報告される場合は、`imsg` を更新してください。private API アクションを利用できない場合は、ログイン済み macOS ユーザーセッションで `imsg launch` を実行し、再度プローブしてください。Gateway が macOS 上で実行されていない場合は、デフォルトのローカル `imsg` パスではなく、上記の SSH 経由のリモート Mac セットアップを使用してください。

  </Accordion>

  <Accordion title="Messages send but inbound iMessages do not arrive">
    まず、メッセージがローカル Mac に到達したかどうかを確認します。`chat.db` が変化しない場合、`imsg status --json` が正常なブリッジを報告していても、OpenClaw はそのメッセージを受信できません。

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

    OpenClaw セッションをデバッグする前に、電話から新しい iMessage を送信し、新しい `chat.db` 行または `imsg watch` イベントを確認してください。これを定期的なブリッジ再起動ループとして実行しないでください。作業中に `imsg launch` と Gateway 再起動を繰り返すと、配信が中断され、進行中のチャンネル実行が取り残される可能性があります。

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    デフォルトの `cliPath: "imsg"` は、Messages にサインインしている Mac 上で実行する必要があります。Linux または Windows では、`channels.imessage.cliPath` を、その Mac に SSH して `imsg "$@"` を実行するラッパースクリプトに設定してください。

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    次に実行します。

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs are ignored">
    次を確認してください。

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - ペアリング承認（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="Group messages are ignored">
    次を確認してください。

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` 許可リストの動作
    - メンションパターン設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="Remote attachments fail">
    次を確認してください。

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway ホストからの SSH/SCP キー認証
    - Gateway ホスト上の `~/.ssh/known_hosts` にホストキーが存在すること
    - Messages を実行している Mac 上でリモートパスを読み取れること

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    同じユーザー/セッションコンテキストの対話型 GUI ターミナルで再実行し、プロンプトを承認します。

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    OpenClaw/`imsg` を実行するプロセスコンテキストに、フルディスクアクセス + オートメーションが付与されていることを確認してください。

  </Accordion>
</AccordionGroup>

## 設定リファレンスへのポインター

- [設定リファレンス - iMessage](/ja-JP/gateway/config-channels#imessage)
- [Gateway 設定](/ja-JP/gateway/configuration)
- [ペアリング](/ja-JP/channels/pairing)

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [BlueBubbles の削除と imsg iMessage パス](/ja-JP/announcements/bluebubbles-imessage) — 告知と移行の概要
- [BlueBubbles からの移行](/ja-JP/channels/imessage-from-bluebubbles) — 設定変換表と段階的な切り替え
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
