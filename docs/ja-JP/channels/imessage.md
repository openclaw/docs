---
read_when:
    - iMessage サポートの設定
    - iMessage の送受信のデバッグ
summary: imsg 経由のネイティブ iMessage 対応（stdio 上の JSON-RPC）。ホスト要件を満たす場合、新しい OpenClaw iMessage セットアップに推奨されます。
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
新しい OpenClaw iMessage デプロイでは、サインイン済みの macOS Messages ホストで `imsg` を実行できる場合はここから始めます。BlueBubbles は、その HTTP サーバー、webhooks、またはより豊富な private-API アクションに依存する既存セットアップ向けのレガシーフォールバックとして引き続き利用できます。
</Note>

ステータス: ネイティブ外部 CLI 統合。Gateway は `imsg rpc` を起動し、stdio 上の JSON-RPC で通信します (別個のデーモン/ポートは不要)。

<CardGroup cols={3}>
  <Card title="BlueBubbles (レガシーフォールバック)" icon="message-circle" href="/ja-JP/channels/bluebubbles">
    既存の BlueBubbles ベースのルーティングでは引き続き使用します。imsg が適合する新規セットアップでは避けてください。
  </Card>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    iMessage DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="設定リファレンス" icon="settings" href="/ja-JP/gateway/config-channels#imessage">
    iMessage フィールドの完全なリファレンス。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="ローカル Mac (高速パス)">
    <Steps>
      <Step title="imsg をインストールして検証する">

```bash
brew install steipete/tap/imsg
imsg rpc --help
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

      <Step title="gateway を起動する">

```bash
openclaw gateway
```

      </Step>

      <Step title="最初の DM ペアリングを承認する (デフォルトの dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        ペアリングリクエストは 1 時間後に期限切れになります。
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH 経由のリモート Mac">
    OpenClaw が必要とするのは stdio 互換の `cliPath` だけなので、`cliPath` に、リモート Mac へ SSH して `imsg` を実行するラッパースクリプトを指定できます。

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
    `remoteHost` は `host` または `user@host` である必要があります (スペースや SSH オプションは不可)。
    OpenClaw は SCP に厳格なホストキー確認を使用するため、リレーホストのキーはすでに `~/.ssh/known_hosts` に存在している必要があります。
    添付ファイルパスは、許可されたルート (`attachmentRoots` / `remoteAttachmentRoots`) に対して検証されます。

  </Tab>
</Tabs>

## 要件と権限 (macOS)

- `imsg` を実行する Mac で Messages にサインインしている必要があります。
- OpenClaw/`imsg` を実行するプロセスコンテキストにはフルディスクアクセスが必要です (Messages DB アクセス)。
- Messages.app 経由でメッセージを送信するには自動操作の権限が必要です。

<Tip>
権限はプロセスコンテキストごとに付与されます。gateway がヘッドレス (LaunchAgent/SSH) で実行される場合は、同じコンテキストで一度だけ対話的コマンドを実行してプロンプトを表示します。

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.imessage.dmPolicy` はダイレクトメッセージを制御します。

    - `pairing` (デフォルト)
    - `allowlist`
    - `open` (`allowFrom` に `"*"` を含める必要があります)
    - `disabled`

    許可リストフィールド: `channels.imessage.allowFrom`。

    許可リストエントリにはハンドルまたはチャットターゲット (`chat_id:*`、`chat_guid:*`、`chat_identifier:*`) を使用できます。

  </Tab>

  <Tab title="グループポリシー + メンション">
    `channels.imessage.groupPolicy` はグループ処理を制御します。

    - `allowlist` (設定されている場合のデフォルト)
    - `open`
    - `disabled`

    グループ送信者の許可リスト: `channels.imessage.groupAllowFrom`。

    ランタイムフォールバック: `groupAllowFrom` が未設定の場合、iMessage グループ送信者チェックは、利用可能であれば `allowFrom` にフォールバックします。
    ランタイムメモ: `channels.imessage` が完全に欠落している場合、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに記録します (`channels.defaults.groupPolicy` が設定されている場合でも)。

    グループのメンションゲート:

    - iMessage にはネイティブのメンションメタデータがありません
    - メンション検出は regex パターン (`agents.list[].groupChat.mentionPatterns`、フォールバック `messages.groupChat.mentionPatterns`) を使用します
    - 設定済みパターンがない場合、メンションゲートは強制できません

    認可済み送信者からの制御コマンドは、グループ内のメンションゲートをバイパスできます。

  </Tab>

  <Tab title="セッションと決定的な返信">
    - DM はダイレクトルーティングを使用し、グループはグループルーティングを使用します。
    - デフォルトの `session.dmScope=main` では、iMessage DM はエージェントのメインセッションにまとまります。
    - グループセッションは分離されます (`agent:<agentId>:imessage:group:<chat_id>`)。
    - 返信は、発信元のチャンネル/ターゲットメタデータを使用して iMessage にルーティングされます。

    グループ風スレッドの挙動:

    一部の複数参加者 iMessage スレッドは `is_group=false` として到着することがあります。
    その `chat_id` が `channels.imessage.groups` で明示的に設定されている場合、OpenClaw はそれをグループトラフィックとして扱います (グループゲート + グループセッション分離)。

  </Tab>
</Tabs>

## ACP 会話バインディング

レガシー iMessage チャットは ACP セッションにもバインドできます。

高速なオペレーターフロー:

- DM または許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 同じ iMessage 会話内の今後のメッセージは、生成された ACP セッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

設定済みの永続バインディングは、`type: "acp"` と `match.channel: "imessage"` を持つトップレベルの `bindings[]` エントリでサポートされます。

`match.peer.id` には以下を使用できます。

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
  <Accordion title="専用 bot macOS ユーザー (個別の iMessage ID)">
    専用の Apple ID と macOS ユーザーを使用して、bot トラフィックを個人の Messages プロファイルから分離します。

    一般的なフロー:

    1. 専用の macOS ユーザーを作成/サインインします。
    2. そのユーザーで bot Apple ID を使って Messages にサインインします。
    3. そのユーザーに `imsg` をインストールします。
    4. OpenClaw がそのユーザーコンテキストで `imsg` を実行できるように SSH ラッパーを作成します。
    5. `channels.imessage.accounts.<id>.cliPath` と `.dbPath` をそのユーザープロファイルに向けます。

    初回実行では、その bot ユーザーセッションで GUI 承認 (自動操作 + フルディスクアクセス) が必要になる場合があります。

  </Accordion>

  <Accordion title="Tailscale 経由のリモート Mac (例)">
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

    SSH と SCP の両方が非対話的になるように SSH キーを使用します。
    まずホストキーが信頼済みであることを確認し (例: `ssh bot@mac-mini.tailnet-1234.ts.net`)、`known_hosts` が設定されるようにします。

  </Accordion>

  <Accordion title="マルチアカウントパターン">
    iMessage は `channels.imessage.accounts` 配下のアカウントごとの設定をサポートします。

    各アカウントは、`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルルート許可リストなどのフィールドを上書きできます。

  </Accordion>
</AccordionGroup>

## メディア、チャンク化、配信ターゲット

<AccordionGroup>
  <Accordion title="添付ファイルとメディア">
    - インバウンド添付ファイル取り込みは任意です: `channels.imessage.includeAttachments`
    - `remoteHost` が設定されている場合、リモート添付ファイルパスを SCP 経由で取得できます
    - 添付ファイルパスは許可されたルートと一致する必要があります。
      - `channels.imessage.attachmentRoots` (ローカル)
      - `channels.imessage.remoteAttachmentRoots` (リモート SCP モード)
      - デフォルトのルートパターン: `/Users/*/Library/Messages/Attachments`
    - SCP は厳格なホストキー確認を使用します (`StrictHostKeyChecking=yes`)
    - アウトバウンドメディアサイズは `channels.imessage.mediaMaxMb` を使用します (デフォルト 16 MB)

  </Accordion>

  <Accordion title="アウトバウンドのチャンク化">
    - テキストチャンク制限: `channels.imessage.textChunkLimit` (デフォルト 4000)
    - チャンクモード: `channels.imessage.chunkMode`
      - `length` (デフォルト)
      - `newline` (段落優先の分割)

  </Accordion>

  <Accordion title="アドレス指定形式">
    推奨される明示的ターゲット:

    - `chat_id:123` (安定したルーティングに推奨)
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

## 設定書き込み

iMessage は、デフォルトでチャンネル起点の設定書き込みを許可します (`commands.config: true` の場合の `/config set|unset`)。

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

## トラブルシューティング

<AccordionGroup>
  <Accordion title="imsg が見つからない、または RPC がサポートされていない">
    バイナリと RPC サポートを検証します。

```bash
imsg rpc --help
openclaw channels status --probe
```

    probe が RPC 非対応を報告する場合は、`imsg` を更新してください。

  </Accordion>

  <Accordion title="DM が無視される">
    確認項目:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - ペアリング承認 (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="グループメッセージが無視される">
    確認項目:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` 許可リスト動作
    - メンションパターン設定 (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="リモート添付ファイルが失敗する">
    確認項目:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - gateway ホストからの SSH/SCP キー認証
    - gateway ホスト上の `~/.ssh/known_hosts` にホストキーが存在すること
    - Messages を実行している Mac 上でリモートパスが読み取り可能であること

  </Accordion>

  <Accordion title="macOS 権限プロンプトを見逃した">
    同じユーザー/セッションコンテキストの対話的な GUI ターミナルで再実行し、プロンプトを承認します。

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    OpenClaw/`imsg` を実行するプロセスコンテキストにフルディスクアクセス + 自動操作が付与されていることを確認します。

  </Accordion>
</AccordionGroup>

## 設定リファレンスポインター

- [設定リファレンス - iMessage](/ja-JP/gateway/config-channels#imessage)
- [Gateway 設定](/ja-JP/gateway/configuration)
- [ペアリング](/ja-JP/channels/pairing)
- [BlueBubbles](/ja-JP/channels/bluebubbles)

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
