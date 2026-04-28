---
read_when:
    - iMessage サポートの設定
    - iMessage の送受信のデバッグ
summary: imsg 経由の従来の iMessage サポート（stdio 上の JSON-RPC）。新しいセットアップでは BlueBubbles を使用してください。
title: iMessage
x-i18n:
    generated_at: "2026-04-25T13:41:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b693b222ab60fe9fee8be47ec4b347ba126f11558888d336220e39425023dcd
    source_path: channels/imessage.md
    workflow: 15
---

<Warning>
新しい iMessage デプロイメントでは、<a href="/ja-JP/channels/bluebubbles">BlueBubbles</a> を使用してください。

`imsg` 連携はレガシーであり、将来のリリースで削除される可能性があります。
</Warning>

ステータス: レガシーな外部CLI連携。Gateway は `imsg rpc` を起動し、stdio 上の JSON-RPC で通信します（別個のデーモンやポートは不要）。

<CardGroup cols={3}>
  <Card title="BlueBubbles (recommended)" icon="message-circle" href="/ja-JP/channels/bluebubbles">
    新しいセットアップ向けの推奨 iMessage 経路です。
  </Card>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    iMessage DM はデフォルトでペアリングモードを使用します。
  </Card>
  <Card title="Configuration reference" icon="settings" href="/ja-JP/gateway/config-channels#imessage">
    iMessage フィールドの完全なリファレンスです。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="ローカル Mac（高速パス）">
    <Steps>
      <Step title="imsg をインストールして確認する">

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

      <Step title="最初の DM ペアリングを承認する（デフォルトの dmPolicy）">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        ペアリング要求は1時間後に期限切れになります。
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH 経由のリモート Mac">
    OpenClaw が必要とするのは stdio 互換の `cliPath` のみなので、`cliPath` を、リモート Mac に SSH 接続して `imsg` を実行するラッパースクリプトに向けることができます。

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
      remoteHost: "user@gateway-host", // SCP 添付ファイル取得に使用
      includeAttachments: true,
      // オプション: 許可する添付ファイルルートを上書きします。
      // デフォルトには /Users/*/Library/Messages/Attachments が含まれます
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    `remoteHost` が設定されていない場合、OpenClaw は SSH ラッパースクリプトを解析して自動検出を試みます。
    `remoteHost` は `host` または `user@host` である必要があります（スペースや SSH オプションは不可）。
    OpenClaw は SCP に厳格な host-key チェックを使用するため、リレー先ホストキーが `~/.ssh/known_hosts` にすでに存在している必要があります。
    添付ファイルのパスは、許可されたルート（`attachmentRoots` / `remoteAttachmentRoots`）に対して検証されます。

  </Tab>
</Tabs>

## 要件と権限（macOS）

- `imsg` を実行する Mac で Messages にサインインしている必要があります。
- OpenClaw/`imsg` を実行するプロセスコンテキストにはフルディスクアクセスが必要です（Messages DB へのアクセス）。
- Messages.app 経由でメッセージを送信するには Automation 権限が必要です。

<Tip>
権限はプロセスコンテキストごとに付与されます。Gateway がヘッドレス（LaunchAgent/SSH）で実行される場合は、同じコンテキストで一度だけ対話的コマンドを実行してプロンプトを表示させてください。

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.imessage.dmPolicy` はダイレクトメッセージを制御します:

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`allowFrom` に `"*"` を含める必要があります）
    - `disabled`

    Allowlist フィールド: `channels.imessage.allowFrom`。

    Allowlist エントリには、handle またはチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用できます。

  </Tab>

  <Tab title="グループポリシー + メンション">
    `channels.imessage.groupPolicy` はグループ処理を制御します:

    - `allowlist`（設定時のデフォルト）
    - `open`
    - `disabled`

    グループ送信者 Allowlist: `channels.imessage.groupAllowFrom`。

    実行時フォールバック: `groupAllowFrom` が未設定の場合、利用可能であれば iMessage グループ送信者チェックは `allowFrom` にフォールバックします。
    実行時の注意: `channels.imessage` が完全に欠けている場合、実行時には `groupPolicy="allowlist"` にフォールバックし、警告を記録します（`channels.defaults.groupPolicy` が設定されていても同様です）。

    グループ向けのメンションゲーティング:

    - iMessage にはネイティブのメンションメタデータがありません
    - メンション検出には正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバック `messages.groupChat.mentionPatterns`）を使用します
    - パターンが設定されていない場合、メンションゲーティングは適用できません

    認可された送信者からの制御コマンドは、グループ内でメンションゲーティングをバイパスできます。

  </Tab>

  <Tab title="セッションと決定的な返信">
    - DM はダイレクトルーティングを使用し、グループはグループルーティングを使用します。
    - デフォルトの `session.dmScope=main` では、iMessage DM はエージェントのメインセッションに集約されます。
    - グループセッションは分離されます（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 返信は、元のチャネル/ターゲットメタデータを使って iMessage にルーティングされます。

    グループ風スレッドの動作:

    一部の複数参加者 iMessage スレッドは、`is_group=false` で到着することがあります。
    その `chat_id` が `channels.imessage.groups` で明示的に設定されている場合、OpenClaw はそれをグループトラフィックとして扱います（グループゲーティング + グループセッション分離）。

  </Tab>
</Tabs>

## ACP 会話バインディング

レガシー iMessage チャットは ACP セッションにもバインドできます。

高速なオペレーターフロー:

- DM または許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 以後、同じ iMessage 会話内のメッセージは、起動された ACP セッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

設定済みの永続バインディングは、トップレベルの `bindings[]` エントリで `type: "acp"` および `match.channel: "imessage"` を使ってサポートされます。

`match.peer.id` には次を使用できます:

- `+15555550123` や `user@example.com` のような正規化された DM handle
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

共有 ACP バインディング動作については [ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

## デプロイパターン

<AccordionGroup>
  <Accordion title="専用ボット macOS ユーザー（個人の iMessage ID とは別）">
    専用の Apple ID と macOS ユーザーを使用して、ボットのトラフィックを個人の Messages プロファイルから分離します。

    典型的なフロー:

    1. 専用の macOS ユーザーを作成してサインインします。
    2. そのユーザーで、ボット用 Apple ID を使って Messages にサインインします。
    3. そのユーザーに `imsg` をインストールします。
    4. OpenClaw がそのユーザーコンテキストで `imsg` を実行できるように SSH ラッパーを作成します。
    5. `channels.imessage.accounts.<id>.cliPath` と `.dbPath` をそのユーザープロファイルに向けます。

    初回実行では、そのボットユーザーセッションで GUI 承認（Automation + フルディスクアクセス）が必要になる場合があります。

  </Accordion>

  <Accordion title="Tailscale 経由のリモート Mac（例）">
    一般的なトポロジー:

    - Gateway は Linux/VM 上で実行
    - iMessage + `imsg` は tailnet 内の Mac 上で実行
    - `cliPath` ラッパーは SSH を使って `imsg` を実行
    - `remoteHost` は SCP 添付ファイル取得を有効化

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
    まずホストキーを信頼済みにしてください（例: `ssh bot@mac-mini.tailnet-1234.ts.net`）。これにより `known_hosts` が設定されます。

  </Accordion>

  <Accordion title="マルチアカウントパターン">
    iMessage は `channels.imessage.accounts` の下でアカウントごとの設定をサポートします。

    各アカウントは、`cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、履歴設定、添付ファイルルート Allowlist などのフィールドを上書きできます。

  </Accordion>
</AccordionGroup>

## メディア、チャンク化、配信ターゲット

<AccordionGroup>
  <Accordion title="添付ファイルとメディア">
    - 受信添付ファイルの取り込みはオプションです: `channels.imessage.includeAttachments`
    - `remoteHost` が設定されている場合、リモート添付ファイルパスは SCP で取得できます
    - 添付ファイルパスは許可されたルートに一致する必要があります:
      - `channels.imessage.attachmentRoots`（ローカル）
      - `channels.imessage.remoteAttachmentRoots`（リモート SCP モード）
      - デフォルトのルートパターン: `/Users/*/Library/Messages/Attachments`
    - SCP は厳格な host-key チェックを使用します（`StrictHostKeyChecking=yes`）
    - 送信メディアサイズには `channels.imessage.mediaMaxMb` を使用します（デフォルト 16 MB）

  </Accordion>

  <Accordion title="送信チャンク化">
    - テキストチャンク上限: `channels.imessage.textChunkLimit`（デフォルト 4000）
    - チャンクモード: `channels.imessage.chunkMode`
      - `length`（デフォルト）
      - `newline`（段落優先の分割）

  </Accordion>

  <Accordion title="アドレス指定形式">
    推奨される明示的ターゲット:

    - `chat_id:123`（安定したルーティングに推奨）
    - `chat_guid:...`
    - `chat_identifier:...`

    handle ターゲットもサポートされます:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## 設定書き込み

iMessage は、デフォルトでチャネル起点の設定書き込みを許可します（`commands.config: true` の場合の `/config set|unset` 用）。

無効化するには:

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
  <Accordion title="imsg が見つからない、または RPC が未対応">
    バイナリと RPC サポートを検証してください:

```bash
imsg rpc --help
openclaw channels status --probe
```

    プローブで RPC 未対応と報告される場合は、`imsg` を更新してください。

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
    - `channels.imessage.groups` の Allowlist 動作
    - メンションパターン設定（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="リモート添付ファイルが失敗する">
    確認項目:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway ホストからの SSH/SCP 鍵認証
    - Gateway ホスト上の `~/.ssh/known_hosts` にホストキーが存在する
    - Messages を実行している Mac 上でリモートパスが読み取り可能である

  </Accordion>

  <Accordion title="macOS 権限プロンプトを見逃した">
    同じユーザー/セッションコンテキストの対話式 GUI ターミナルで再実行し、プロンプトを承認してください:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    OpenClaw/`imsg` を実行するプロセスコンテキストに、フルディスクアクセスと Automation が付与されていることを確認してください。

  </Accordion>
</AccordionGroup>

## 設定リファレンスへのポインタ

- [Configuration reference - iMessage](/ja-JP/gateway/config-channels#imessage)
- [Gateway configuration](/ja-JP/gateway/configuration)
- [Pairing](/ja-JP/channels/pairing)
- [BlueBubbles](/ja-JP/channels/bluebubbles)

## 関連

- [Channels Overview](/ja-JP/channels) — すべての対応チャネル
- [Pairing](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャット動作とメンションゲーティング
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
