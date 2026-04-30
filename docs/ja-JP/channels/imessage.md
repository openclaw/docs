---
read_when:
    - iMessage サポートの設定
    - iMessage 送受信のデバッグ
summary: imsg（stdio 経由の JSON-RPC）によるレガシー iMessage サポート。新しいセットアップでは BlueBubbles を使用してください。
title: iMessage
x-i18n:
    generated_at: "2026-04-30T04:58:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60eeb3553a6511d56b8177ca4eafbedfed2d0852ac64c230c250911cd18ce17e
    source_path: channels/imessage.md
    workflow: 16
---

<Warning>
新しい iMessage デプロイでは、<a href="/ja-JP/channels/bluebubbles">BlueBubbles</a>を使用してください。

`imsg` 連携はレガシーであり、将来のリリースで削除される可能性があります。
</Warning>

状態: レガシーの外部 CLI 連携。Gateway は `imsg rpc` を起動し、stdio 上の JSON-RPC で通信します（別個のデーモン/ポートはありません）。

<CardGroup cols={3}>
  <Card title="BlueBubbles (推奨)" icon="message-circle" href="/ja-JP/channels/bluebubbles">
    新規セットアップで推奨される iMessage 経路です。
  </Card>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    iMessage DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="設定リファレンス" icon="settings" href="/ja-JP/gateway/config-channels#imessage">
    iMessage フィールドの完全なリファレンスです。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="ローカル Mac (高速経路)">
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

      <Step title="Gateway を起動する">

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
    OpenClaw に必要なのは stdio 互換の `cliPath` だけなので、リモート Mac に SSH して `imsg` を実行するラッパースクリプトを `cliPath` に指定できます。

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
    OpenClaw は SCP に厳密なホストキー検証を使用するため、リレーホストキーはすでに `~/.ssh/known_hosts` に存在している必要があります。
    添付ファイルパスは許可されたルート（`attachmentRoots` / `remoteAttachmentRoots`）に対して検証されます。

  </Tab>
</Tabs>

## 要件と権限 (macOS)

- `imsg` を実行する Mac で Messages にサインインしている必要があります。
- OpenClaw/`imsg` を実行するプロセスコンテキストにはフルディスクアクセスが必要です（Messages DB アクセス）。
- Messages.app 経由でメッセージを送信するには Automation 権限が必要です。

<Tip>
権限はプロセスコンテキストごとに付与されます。Gateway がヘッドレス（LaunchAgent/SSH）で実行される場合、同じコンテキストで 1 回だけ対話型コマンドを実行してプロンプトを表示させます。

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

    Allowlist フィールド: `channels.imessage.allowFrom`。

    Allowlist エントリにはハンドルまたはチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用できます。

  </Tab>

  <Tab title="グループポリシー + メンション">
    `channels.imessage.groupPolicy` はグループ処理を制御します。

    - `allowlist` (設定されている場合のデフォルト)
    - `open`
    - `disabled`

    グループ送信者 Allowlist: `channels.imessage.groupAllowFrom`。

    ランタイムフォールバック: `groupAllowFrom` が未設定の場合、利用可能であれば iMessage グループ送信者チェックは `allowFrom` にフォールバックします。
    ランタイム注記: `channels.imessage` が完全に欠落している場合、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに記録します（`channels.defaults.groupPolicy` が設定されている場合でも）。

    グループのメンションゲート:

    - iMessage にはネイティブのメンションメタデータがありません
    - メンション検出は正規表現パターンを使用します（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - パターンが設定されていない場合、メンションゲートを強制できません

    認可済み送信者からの制御コマンドは、グループ内のメンションゲートをバイパスできます。

  </Tab>

  <Tab title="セッションと決定的な返信">
    - DM は直接ルーティングを使用し、グループはグループルーティングを使用します。
    - デフォルトの `session.dmScope=main` では、iMessage DM はエージェントのメインセッションにまとめられます。
    - グループセッションは分離されます（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 返信は、発信元のチャネル/ターゲットメタデータを使用して iMessage に戻されます。

    グループ風スレッドの動作:

    複数参加者の iMessage スレッドの一部は `is_group=false` で届くことがあります。
    その `chat_id` が `channels.imessage.groups` の下で明示的に設定されている場合、OpenClaw はそれをグループトラフィックとして扱います（グループゲート + グループセッション分離）。

  </Tab>
</Tabs>

## ACP 会話バインディング

レガシー iMessage チャットは ACP セッションにバインドすることもできます。

高速なオペレーターフロー:

- DM または許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 同じ iMessage 会話内の今後のメッセージは、生成された ACP セッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

設定済みの永続バインディングは、トップレベルの `bindings[]` エントリで `type: "acp"` と `match.channel: "imessage"` を指定することでサポートされます。

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

共有 ACP バインディングの動作については、[ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用 bot macOS ユーザー (別の iMessage ID)">
    専用の Apple ID と macOS ユーザーを使用して、bot トラフィックを個人の Messages プロファイルから分離します。

    一般的な流れ:

    1. 専用の macOS ユーザーを作成/サインインします。
    2. そのユーザーで bot Apple ID を使用して Messages にサインインします。
    3. そのユーザーに `imsg` をインストールします。
    4. OpenClaw がそのユーザーコンテキストで `imsg` を実行できるように SSH ラッパーを作成します。
    5. `channels.imessage.accounts.<id>.cliPath` と `.dbPath` をそのユーザープロファイルに向けます。

    初回実行時には、その bot ユーザーセッションで GUI 承認（Automation + フルディスクアクセス）が必要になる場合があります。

  </Accordion>

  <Accordion title="Tailscale 経由のリモート Mac (例)">
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

    SSH と SCP の両方が非対話型になるように SSH キーを使用します。
    まずホストキーが信頼済みであることを確認し（たとえば `ssh bot@mac-mini.tailnet-1234.ts.net`）、`known_hosts` が登録されるようにします。

  </Accordion>

  <Accordion title="マルチアカウントパターン">
    iMessage は `channels.imessage.accounts` の下でアカウントごとの設定をサポートします。

    各アカウントは、`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルルート Allowlist などのフィールドを上書きできます。

  </Accordion>
</AccordionGroup>

## メディア、チャンク化、配信ターゲット

<AccordionGroup>
  <Accordion title="添付ファイルとメディア">
    - 受信添付ファイルの取り込みは任意です: `channels.imessage.includeAttachments`
    - `remoteHost` が設定されている場合、リモート添付ファイルパスは SCP 経由で取得できます
    - 添付ファイルパスは許可されたルートと一致する必要があります:
      - `channels.imessage.attachmentRoots` (ローカル)
      - `channels.imessage.remoteAttachmentRoots` (リモート SCP モード)
      - デフォルトのルートパターン: `/Users/*/Library/Messages/Attachments`
    - SCP は厳密なホストキー検証を使用します（`StrictHostKeyChecking=yes`）
    - 送信メディアサイズは `channels.imessage.mediaMaxMb` を使用します（デフォルト 16 MB）

  </Accordion>

  <Accordion title="送信チャンク化">
    - テキストチャンク制限: `channels.imessage.textChunkLimit` (デフォルト 4000)
    - チャンクモード: `channels.imessage.chunkMode`
      - `length` (デフォルト)
      - `newline` (段落優先の分割)

  </Accordion>

  <Accordion title="アドレス指定形式">
    推奨される明示的なターゲット:

    - `chat_id:123` (安定したルーティングに推奨)
    - `chat_guid:...`
    - `chat_identifier:...`

    ハンドルターゲットもサポートされています。

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## 設定書き込み

iMessage は、デフォルトでチャネル主導の設定書き込みを許可します（`commands.config: true` の場合の `/config set|unset`）。

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

    プローブで RPC がサポートされていないと報告された場合は、`imsg` を更新してください。

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
    - `channels.imessage.groups` Allowlist の動作
    - メンションパターン設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="リモート添付ファイルが失敗する">
    確認項目:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway ホストからの SSH/SCP キー認証
    - Gateway ホスト上の `~/.ssh/known_hosts` にホストキーが存在する
    - Messages を実行している Mac 上でリモートパスを読み取れる

  </Accordion>

  <Accordion title="macOS 権限プロンプトを見逃した">
    同じユーザー/セッションコンテキストの対話型 GUI ターミナルで再実行し、プロンプトを承認します。

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    OpenClaw/`imsg` を実行するプロセスコンテキストに、フルディスクアクセス + Automation が付与されていることを確認してください。

  </Accordion>
</AccordionGroup>

## 設定リファレンスへのポインター

- [設定リファレンス - iMessage](/ja-JP/gateway/config-channels#imessage)
- [Gateway 設定](/ja-JP/gateway/configuration)
- [ペアリング](/ja-JP/channels/pairing)
- [BlueBubbles](/ja-JP/channels/bluebubbles)

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
