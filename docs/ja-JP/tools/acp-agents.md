---
read_when:
    - ACP経由でコーディングハーネスを実行する
    - メッセージングチャネルで会話にバインドされたACPセッションを設定する
    - メッセージチャネルの会話を永続的なACPセッションにバインドする
    - ACPバックエンドとPlugin配線のトラブルシューティング
    - チャットから `/acp` コマンドを操作する
summary: Codex、Claude Code、Cursor、Gemini CLI、OpenClaw ACP、そのほかのハーネスエージェントにACPランタイムセッションを使う
title: ACP Agents
x-i18n:
    generated_at: "2026-04-21T13:37:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: e458ff21d63e52ed0eed4ed65ba2c45aecae20563a3ef10bf4b64e948284b51a
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP Agents

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) セッションにより、OpenClawはACPバックエンドPluginを通じて外部のコーディングハーネス（たとえば Pi、Claude Code、Codex、Cursor、Copilot、OpenClaw ACP、OpenCode、Gemini CLI、そのほか対応するACPXハーネス）を実行できます。

OpenClawに自然言語で「これをCodexで実行して」や「このスレッドでClaude Codeを起動して」と依頼した場合、OpenClawはその要求をACPランタイムにルーティングするべきです（ネイティブのサブエージェントランタイムではありません）。各ACPセッションの起動は [background task](/ja-JP/automation/tasks) として追跡されます。

CodexやClaude Codeを、既存のOpenClawチャネル会話に直接接続する外部MCPクライアントとして使いたい場合は、ACPではなく [`openclaw mcp serve`](/cli/mcp) を使ってください。

## どのページを見ればよいですか？

近い位置にある3つの機能があり、混同しやすいです:

| やりたいこと                                                                          | 使うもの                              | 補足                                                                                                            |
| ------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| OpenClaw _経由で_ Codex、Claude Code、Gemini CLI、または別の外部ハーネスを実行したい | このページ: ACP Agents                | チャットにバインドされたセッション、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、background task、ランタイム制御 |
| OpenClaw Gatewayセッションを、エディターやクライアント向けのACPサーバー _として_ 公開したい | [`openclaw acp`](/cli/acp)            | ブリッジモード。IDE/クライアントがstdio/WebSocket経由でOpenClawにACP接続します                                  |
| ローカルAI CLIをテキスト専用のフォールバックモデルとして再利用したい                 | [CLI Backends](/ja-JP/gateway/cli-backends) | ACPではありません。OpenClawツールもACP制御もハーネスランタイムもありません                                      |

## これはそのまま使えますか？

通常は、はい。

- 新規インストールでは、バンドル済みの `acpx` ランタイムPluginがデフォルトで有効になっています。
- バンドル済みの `acpx` Pluginは、そのPluginローカルに固定された `acpx` バイナリを優先して使います。
- 起動時に、OpenClawはそのバイナリをプローブし、必要であれば自己修復します。
- 手早く準備状況を確認したい場合は、`/acp doctor` から始めてください。

初回利用時に起こり得ること:

- 対象ハーネスのアダプターが、そのハーネスを初めて使うときに `npx` でオンデマンド取得されることがあります。
- そのハーネス用のベンダー認証は、引き続きホスト側に存在している必要があります。
- ホストにnpm/ネットワークアクセスがない場合、初回アダプター取得は、キャッシュを事前に温めるか別の方法でアダプターをインストールするまで失敗することがあります。

例:

- `/acp spawn codex`: OpenClawは `acpx` をブートストラップできる状態であるはずですが、Codex ACPアダプターは初回取得が必要な場合があります。
- `/acp spawn claude`: Claude ACPアダプターでも同様で、加えてそのホスト上でのClaude側認証も必要です。

## 高速なオペレーターフロー

実用的な `/acp` ランブックが欲しい場合は、これを使ってください:

1. セッションを起動する:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. バインドされた会話またはスレッドで作業します（またはそのセッションキーを明示的に指定します）。
3. ランタイム状態を確認する:
   - `/acp status`
4. 必要に応じてランタイムオプションを調整する:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. コンテキストを置き換えずにアクティブなセッションへ指示を追加する:
   - `/acp steer tighten logging and continue`
6. 作業を止める:
   - `/acp cancel`（現在のターンを停止）、または
   - `/acp close`（セッションを閉じてバインディングも削除）

## 人向けクイックスタート

自然な依頼の例:

- 「このDiscordチャネルをCodexにバインドして。」
- 「ここでスレッド内に永続的なCodexセッションを起動して、集中状態を維持して。」
- 「これをClaude Code ACPのワンショットセッションとして実行して、結果を要約して。」
- 「このiMessageチャットをCodexにバインドして、その後のやり取りも同じワークスペースで続けて。」
- 「このタスクにはGemini CLIをこのスレッドで使って、その後のフォローアップも同じスレッドで続けて。」

OpenClawがすべきこと:

1. `runtime: "acp"` を選ぶ。
2. 要求されたハーネスターゲット（`agentId`。たとえば `codex`）を解決する。
3. 現在の会話へのバインドが要求されていて、アクティブなチャネルがそれをサポートしている場合、その会話にACPセッションをバインドする。
4. そうでない場合、スレッドバインドが要求されていて、現在のチャネルがそれをサポートしているなら、そのスレッドにACPセッションをバインドする。
5. バインド解除、クローズ、期限切れになるまで、その後のバインド済みメッセージを同じACPセッションにルーティングする。

## ACPとサブエージェントの違い

外部ハーネスランタイムが必要ならACPを使ってください。OpenClawネイティブの委任実行が必要ならサブエージェントを使ってください。

| 項目          | ACPセッション                          | サブエージェント実行                 |
| ------------- | -------------------------------------- | ------------------------------------ |
| ランタイム    | ACPバックエンドPlugin（たとえば acpx） | OpenClawネイティブのサブエージェントランタイム |
| セッションキー | `agent:<agentId>:acp:<uuid>`           | `agent:<agentId>:subagent:<uuid>`    |
| 主なコマンド  | `/acp ...`                             | `/subagents ...`                     |
| 起動ツール    | `runtime:"acp"` 付きの `sessions_spawn` | `sessions_spawn`（デフォルトランタイム） |

関連項目: [Sub-agents](/ja-JP/tools/subagents)

## ACPがClaude Codeをどう実行するか

ACP経由のClaude Codeでは、スタックは次のとおりです:

1. OpenClaw ACPセッション制御プレーン
2. バンドル済み `acpx` ランタイムPlugin
3. Claude ACPアダプター
4. Claude側のランタイム/セッション機構

重要な違い:

- ACP Claudeは、ACP制御、セッション再開、background task追跡、任意の会話/スレッドバインドを備えたハーネスセッションです。
- CLIバックエンドは別個のテキスト専用ローカルフォールバックランタイムです。[CLI Backends](/ja-JP/gateway/cli-backends) を参照してください。

運用上の実践ルール:

- `/acp spawn`、バインド可能なセッション、ランタイム制御、または永続的なハーネス作業が必要なら: ACPを使う
- 生のCLI経由で単純なローカルテキストフォールバックが欲しいなら: CLIバックエンドを使う

## バインド済みセッション

### 現在の会話へのバインド

現在の会話を子スレッドを作らずに永続的なACPワークスペースにしたい場合は、`/acp spawn <harness> --bind here` を使ってください。

動作:

- OpenClawは引き続き、チャネルトランスポート、認証、安全性、配信を管理します。
- 現在の会話は、起動されたACPセッションキーに固定されます。
- その会話内のフォローアップメッセージは、同じACPセッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済みACPセッションをその場でリセットします。
- `/acp close` はセッションを閉じ、現在の会話バインディングを削除します。

実際にどういう意味か:

- `--bind here` は同じチャット画面を維持します。Discordでは、現在のチャネルはそのまま現在のチャネルです。
- `--bind here` は、新しい作業を起動する場合には新しいACPセッションを作成することがあります。バインドは、そのセッションを現在の会話に紐付けます。
- `--bind here` 自体は、子のDiscordスレッドやTelegramトピックを作成しません。
- ACPランタイム自体は、独自の作業ディレクトリ（`cwd`）やバックエンド管理のディスク上ワークスペースを持つことがあります。そのランタイムワークスペースはチャット画面とは別物であり、新しいメッセージングスレッドを意味するものではありません。
- 別のACPエージェントへ起動し、かつ `--cwd` を渡さない場合、OpenClawはデフォルトで**対象エージェントの**ワークスペースを継承します。要求元のワークスペースではありません。
- 継承したワークスペースパスが存在しない場合（`ENOENT`/`ENOTDIR`）、OpenClawは誤ったツリーを黙って再利用せず、バックエンドのデフォルトcwdへフォールバックします。
- 継承したワークスペースは存在するがアクセスできない場合（たとえば `EACCES`）、起動は `cwd` を捨てるのではなく、実際のアクセスエラーを返します。

考え方:

- チャット画面: 人が会話を続ける場所（`Discord channel`、`Telegram topic`、`iMessage chat`）
- ACPセッション: OpenClawがルーティングする、永続的なCodex/Claude/Geminiのランタイム状態
- 子スレッド/トピック: `--thread ...` を使ったときにのみ作られる任意の追加メッセージング画面
- ランタイムワークスペース: ハーネスが実行されるファイルシステム上の場所（`cwd`、repo checkout、バックエンドワークスペース）

例:

- `/acp spawn codex --bind here`: このチャットを維持し、Codex ACPセッションを起動または接続し、今後のメッセージをここからそこへルーティングする
- `/acp spawn codex --thread auto`: OpenClawは子スレッド/トピックを作成し、そこにACPセッションをバインドする場合があります
- `/acp spawn codex --bind here --cwd /workspace/repo`: 上と同じチャットバインドだが、Codexは `/workspace/repo` で実行される

現在の会話バインドのサポート:

- 現在の会話バインディングのサポートを公開しているチャネル/メッセージチャネルは、共有の会話バインディング経路を通じて `--bind here` を使えます。
- 独自のスレッド/トピック意味論を持つチャネルでも、同じ共有インターフェースの背後でチャネル固有の正規化を提供できます。
- `--bind here` は常に「現在の会話をその場でバインドする」ことを意味します。
- 汎用の現在の会話バインドは、共有のOpenClawバインディングストアを使い、通常のGateway再起動後も維持されます。

注意:

- `/acp spawn` では `--bind here` と `--thread ...` は同時に使えません。
- Discordでは、`--bind here` は現在のチャネルまたはスレッドをその場でバインドします。OpenClawが `--thread auto|here` のために子スレッドを作成する必要がある場合にのみ、`spawnAcpSessions` が必要です。
- アクティブなチャネルが現在の会話ACPバインディングを公開していない場合、OpenClawは未対応であることを明確に返します。
- `resume` や「新しいセッションにするか」という問いは、チャネルの問題ではなくACPセッションの問題です。現在のチャット画面を変えずに、ランタイム状態を再利用することも置き換えることもできます。

### スレッドにバインドされたセッション

チャネルアダプターでスレッドバインディングが有効になっている場合、ACPセッションをスレッドにバインドできます:

- OpenClawはスレッドを対象ACPセッションにバインドします。
- そのスレッド内のフォローアップメッセージは、バインドされたACPセッションにルーティングされます。
- ACPの出力は同じスレッドに返されます。
- フォーカス解除、クローズ、アーカイブ、アイドルタイムアウト、または最大保持期間の期限切れでバインディングは削除されます。

スレッドバインディングのサポートはアダプター依存です。アクティブなチャネルアダプターがスレッドバインディングをサポートしていない場合、OpenClawは未対応/利用不可であることを明確に返します。

スレッドバインドACPに必要な機能フラグ:

- `acp.enabled=true`
- `acp.dispatch.enabled` はデフォルトでオンです（ACPディスパッチを一時停止するには `false` を設定）
- チャネルアダプター側のACPスレッド起動フラグを有効化（アダプター依存）
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### スレッド対応チャネル

- セッション/スレッドバインディング機能を公開する任意のチャネルアダプター。
- 現在の組み込みサポート:
  - Discordスレッド/チャネル
  - Telegramトピック（グループ/スーパーグループのフォーラムトピック、およびDMトピック）
- Pluginチャネルも同じバインディングインターフェースを通じてサポートを追加できます。

## チャネル固有の設定

一時的ではないワークフローでは、トップレベルの `bindings[]` エントリーで永続的なACPバインディングを設定してください。

### バインディングモデル

- `bindings[].type="acp"` は永続的なACP会話バインディングを示します。
- `bindings[].match` は対象会話を識別します:
  - Discordチャネルまたはスレッド: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegramフォーラムトピック: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/グループチャット: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    安定したグループバインディングには `chat_id:*` または `chat_identifier:*` を推奨します。
  - iMessage DM/グループチャット: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    安定したグループバインディングには `chat_id:*` を推奨します。
- `bindings[].agentId` は所有するOpenClawエージェントIDです。
- 任意のACP上書きは `bindings[].acp` に置きます:
  - `mode`（`persistent` または `oneshot`）
  - `label`
  - `cwd`
  - `backend`

### エージェントごとのランタイムデフォルト

`agents.list[].runtime` を使うと、エージェントごとのACPデフォルトを一度だけ定義できます:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（ハーネスID。たとえば `codex` または `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACPバインド済みセッションの上書き優先順位:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. グローバルACPデフォルト（たとえば `acp.backend`）

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
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
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
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

動作:

- OpenClawは、設定されたACPセッションが使用前に存在することを保証します。
- そのチャネルまたはトピック内のメッセージは、設定されたACPセッションにルーティングされます。
- バインド済み会話では、`/new` と `/reset` は同じACPセッションキーをその場でリセットします。
- 一時的なランタイムバインディング（たとえばスレッドフォーカスフローで作られたもの）が存在する場合、それらも引き続き適用されます。
- 明示的な `cwd` なしでエージェント間ACP起動を行う場合、OpenClawはエージェント設定から対象エージェントのワークスペースを継承します。
- 継承したワークスペースパスが存在しない場合はバックエンドのデフォルトcwdへフォールバックし、存在するのにアクセスできない場合は起動エラーとして返されます。

## ACPセッションを起動する（インターフェース）

### `sessions_spawn` から

エージェントターンまたはツール呼び出しからACPセッションを開始するには、`runtime: "acp"` を使います。

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

注意:

- `runtime` のデフォルトは `subagent` なので、ACPセッションでは明示的に `runtime: "acp"` を設定してください。
- `agentId` を省略した場合、設定されていればOpenClawは `acp.defaultAgent` を使います。
- `mode: "session"` では、永続的なバインド済み会話を維持するために `thread: true` が必要です。

インターフェース詳細:

- `task`（必須）: ACPセッションに送る初期プロンプト。
- `runtime`（ACPでは必須）: `"acp"` でなければなりません。
- `agentId`（任意）: ACP対象ハーネスID。設定されていれば `acp.defaultAgent` にフォールバックします。
- `thread`（任意、デフォルト `false`）: サポートされる場合にスレッドバインドフローを要求します。
- `mode`（任意）: `run`（ワンショット）または `session`（永続）。
  - デフォルトは `run`
  - `thread: true` で `mode` を省略した場合、OpenClawはランタイム経路ごとに永続動作をデフォルトにすることがあります
  - `mode: "session"` には `thread: true` が必要
- `cwd`（任意）: 要求するランタイム作業ディレクトリ（バックエンド/ランタイムポリシーで検証されます）。省略した場合、設定されていればACP起動は対象エージェントのワークスペースを継承します。継承パスが存在しない場合はバックエンドデフォルトへフォールバックし、実際のアクセスエラーはそのまま返されます。
- `label`（任意）: セッション/バナーテキストで使われる、オペレーター向けラベル。
- `resumeSessionId`（任意）: 新しいセッションを作らず、既存のACPセッションを再開します。エージェントは `session/load` を通じて会話履歴を再生します。`runtime: "acp"` が必要です。
- `streamTo`（任意）: `"parent"` を指定すると、初期ACP実行の進捗要約をシステムイベントとして要求元セッションへストリーミングします。
  - 利用可能な場合、受理されたレスポンスには `streamLogPath` が含まれ、セッション単位のJSONLログ（`<sessionId>.acp-stream.jsonl`）を `tail` して完全な中継履歴を確認できます。

### 既存セッションを再開する

新しく開始せず以前のACPセッションを続行するには、`resumeSessionId` を使います。エージェントは `session/load` を通じて会話履歴を再生するため、それまでの完全な文脈を保ったまま再開できます。

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

よくある用途:

- ノートPCからスマートフォンへCodexセッションを引き継ぐ — エージェントに中断箇所から続けるよう指示する
- CLIで対話的に始めたコーディングセッションを、今度はエージェント経由でヘッドレスに続ける
- Gateway再起動やアイドルタイムアウトで中断した作業を再開する

注意:

- `resumeSessionId` には `runtime: "acp"` が必要です — サブエージェントランタイムで使うとエラーになります。
- `resumeSessionId` は上流ACP会話履歴を復元します。`thread` と `mode` は新しく作るOpenClawセッションに対して通常どおり適用されるため、`mode: "session"` には引き続き `thread: true` が必要です。
- 対象エージェントは `session/load` をサポートしている必要があります（CodexとClaude Codeは対応しています）。
- セッションIDが見つからない場合、起動は明確なエラーで失敗します — 新しいセッションへの暗黙フォールバックはありません。

### オペレータースモークテスト

Gatewayデプロイ後に、単体テストが通るだけでなくACP起動が本当にエンドツーエンドで動いているかを素早く確認したい場合に使ってください。

推奨ゲート:

1. 対象ホスト上のデプロイ済みGatewayバージョン/コミットを確認する。
2. デプロイ済みソースに、`src/gateway/sessions-patch.ts` のACP系統受理（`subagent:* or acp:* sessions`）が含まれていることを確認する。
3. 一時的なACPXブリッジセッションをライブエージェント（たとえば `jpclawhq` 上の `razor(main)`）に対して開く。
4. そのエージェントに次の条件で `sessions_spawn` を呼び出すよう依頼する:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. エージェントが次を報告することを確認する:
   - `accepted=yes`
   - 実在する `childSessionKey`
   - バリデーターエラーなし
6. 一時的なACPXブリッジセッションをクリーンアップする。

ライブエージェントへのプロンプト例:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

注意:

- このスモークテストは、意図的にスレッドバインドされた永続ACPセッションをテストしているのでない限り、`mode: "run"` のままにしてください。
- 基本ゲートでは `streamTo: "parent"` を必須にしないでください。この経路は要求元/セッション機能に依存し、別個の統合チェックです。
- スレッドバインドされた `mode: "session"` のテストは、実際のDiscordスレッドやTelegramトピックから行う、よりリッチな第2段階の統合確認として扱ってください。

## サンドボックス互換性

現在、ACPセッションはOpenClawサンドボックス内ではなく、ホストランタイム上で動作します。

現在の制限:

- 要求元セッションがサンドボックス化されている場合、ACP起動は `sessions_spawn({ runtime: "acp" })` と `/acp spawn` の両方でブロックされます。
  - エラー: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"` を使う `sessions_spawn` では `sandbox: "require"` はサポートされません。
  - エラー: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

サンドボックス強制実行が必要な場合は `runtime: "subagent"` を使ってください。

### `/acp` コマンドから

チャットから明示的にオペレーター制御したい場合は、`/acp spawn` を使ってください。

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

主なフラグ:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

[Slash Commands](/ja-JP/tools/slash-commands) も参照してください。

## セッションターゲット解決

ほとんどの `/acp` アクションは、任意のセッションターゲット（`session-key`、`session-id`、または `session-label`）を受け付けます。

解決順序:

1. 明示的なターゲット引数（または `/acp steer` の `--session`）
   - まずキーを試す
   - 次にUUID形式のセッションID
   - その後ラベル
2. 現在のスレッドバインディング（この会話/スレッドがACPセッションにバインドされている場合）
3. 現在の要求元セッションへのフォールバック

現在の会話バインディングとスレッドバインディングは、どちらも手順2に参加します。

どのターゲットも解決できない場合、OpenClawは明確なエラー（`Unable to resolve session target: ...`）を返します。

## 起動バインドモード

`/acp spawn` は `--bind here|off` をサポートします。

| モード | 動作                                                                 |
| ------ | -------------------------------------------------------------------- |
| `here` | 現在アクティブな会話をその場でバインドします。アクティブでなければ失敗します。 |
| `off`  | 現在の会話バインディングを作成しません。                              |

注意:

- `--bind here` は「このチャネルまたはチャットをCodexバックエンドにする」ための最も簡単な運用パスです。
- `--bind here` は子スレッドを作成しません。
- `--bind here` は、現在の会話バインディング対応を公開しているチャネルでのみ利用できます。
- `--bind` と `--thread` は同じ `/acp spawn` 呼び出しでは併用できません。

## 起動スレッドモード

`/acp spawn` は `--thread auto|here|off` をサポートします。

| モード | 動作                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------- |
| `auto` | アクティブなスレッド内ではそのスレッドにバインドします。スレッド外では、サポートされていれば子スレッドを作成/バインドします。 |
| `here` | 現在アクティブなスレッドを必須とし、スレッド内でなければ失敗します。                                   |
| `off`  | バインドしません。セッションは未バインドで開始されます。                                               |

注意:

- スレッドバインディング非対応の画面では、デフォルト動作は実質的に `off` です。
- スレッドバインド起動にはチャネルポリシー対応が必要です:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- 子スレッドを作らず現在の会話を固定したい場合は `--bind here` を使ってください。

## ACP制御

利用可能なコマンド群:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` は有効なランタイムオプションを表示し、利用可能な場合はランタイムレベルとバックエンドレベルの両方のセッション識別子も表示します。

一部の制御はバックエンド機能に依存します。バックエンドが制御をサポートしていない場合、OpenClawは未対応制御エラーを明確に返します。

## ACPコマンドクックブック

| コマンド             | できること                                              | 例                                                            |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACPセッションを作成します。現在の会話バインドまたはスレッドバインドは任意です。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 対象セッションの進行中ターンをキャンセルします。        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 実行中セッションに追加指示を送ります。                  | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | セッションを閉じ、スレッドターゲットのバインドを解除します。 | `/acp close`                                                  |
| `/acp status`        | バックエンド、モード、状態、ランタイムオプション、機能を表示します。 | `/acp status`                                                 |
| `/acp set-mode`      | 対象セッションのランタイムモードを設定します。          | `/acp set-mode plan`                                          |
| `/acp set`           | 汎用のランタイム設定オプションを書き込みます。          | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ランタイム作業ディレクトリの上書きを設定します。        | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 承認ポリシープロファイルを設定します。                  | `/acp permissions strict`                                     |
| `/acp timeout`       | ランタイムタイムアウト（秒）を設定します。              | `/acp timeout 120`                                            |
| `/acp model`         | ランタイムモデルの上書きを設定します。                  | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | セッションのランタイムオプション上書きを削除します。    | `/acp reset-options`                                          |
| `/acp sessions`      | ストアから最近のACPセッションを一覧表示します。         | `/acp sessions`                                               |
| `/acp doctor`        | バックエンドのヘルス、機能、実行可能な修正方法を表示します。 | `/acp doctor`                                                 |
| `/acp install`       | 決定的なインストールおよび有効化手順を表示します。      | `/acp install`                                                |

`/acp sessions` は、現在のバインド済みセッションまたは要求元セッションについてストアを読み取ります。`session-key`、`session-id`、または `session-label` トークンを受け付けるコマンドは、エージェントごとのカスタム `session.store` ルートを含むGatewayセッション探索を通じてターゲットを解決します。

## ランタイムオプションの対応関係

`/acp` には便利コマンドと汎用セッターがあります。

等価な操作:

- `/acp model <id>` はランタイム設定キー `model` に対応します。
- `/acp permissions <profile>` はランタイム設定キー `approval_policy` に対応します。
- `/acp timeout <seconds>` はランタイム設定キー `timeout` に対応します。
- `/acp cwd <path>` はランタイムcwd上書きを直接更新します。
- `/acp set <key> <value>` は汎用経路です。
  - 特例: `key=cwd` はcwd上書き経路を使います。
- `/acp reset-options` は、対象セッションのすべてのランタイム上書きをクリアします。

## acpxハーネスサポート（現時点）

現在のacpx組み込みハーネスエイリアス:

- `claude`
- `codex`
- `copilot`
- `cursor`（Cursor CLI: `cursor-agent acp`）
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

OpenClawがacpxバックエンドを使う場合、acpx設定でカスタムエージェントエイリアスを定義していない限り、`agentId` にはこれらの値を使ってください。
ローカルのCursorインストールがまだACPを `agent acp` として公開している場合は、組み込みデフォルトを変えるのではなく、acpx設定で `cursor` エージェントコマンドを上書きしてください。

acpx CLIを直接使う場合は、`--agent <command>` で任意のアダプターも指定できますが、この生のエスケープハッチはacpx CLIの機能であり、通常のOpenClaw `agentId` 経路ではありません。

## 必須設定

ACPの基本設定:

```json5
{
  acp: {
    enabled: true,
    // 任意。デフォルトはtrueです。/acp制御を維持したままACPディスパッチを一時停止するにはfalseを設定します。
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

スレッドバインディング設定はチャネルアダプターごとに異なります。Discordの例:

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
        spawnAcpSessions: true,
      },
    },
  },
}
```

スレッドにバインドされたACP起動が動作しない場合は、まずアダプター機能フラグを確認してください:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

現在の会話バインドでは子スレッド作成は不要です。必要なのは、アクティブな会話コンテキストと、ACP会話バインディングを公開するチャネルアダプターです。

[Configuration Reference](/ja-JP/gateway/configuration-reference) を参照してください。

## acpxバックエンド用Pluginセットアップ

新規インストールでは、バンドル済みの `acpx` ランタイムPluginがデフォルトで有効になっているため、通常は手動でPluginをインストールしなくてもACPは動作します。

まず次を実行してください:

```text
/acp doctor
```

`acpx` を無効化した場合、`plugins.allow` / `plugins.deny` で拒否した場合、またはローカル開発チェックアウトに切り替えたい場合は、明示的なPlugin経路を使います:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

開発中のローカルワークスペースインストール:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

その後、バックエンドのヘルスを確認します:

```text
/acp doctor
```

### acpxコマンドとバージョン設定

デフォルトでは、バンドル済みacpxバックエンドPlugin（`acpx`）はPluginローカルに固定されたバイナリを使います:

1. コマンドのデフォルトは、ACPX Pluginパッケージ内のPluginローカル `node_modules/.bin/acpx` です。
2. 期待バージョンのデフォルトはextension pinです。
3. 起動時に、OpenClawはACPバックエンドを即座に未準備として登録します。
4. バックグラウンドのensureジョブが `acpx --version` を検証します。
5. Pluginローカルバイナリが存在しないか不一致の場合、次を実行して再検証します:
   `npm install --omit=dev --no-save acpx@<pinned>`

Plugin設定でコマンド/バージョンを上書きできます:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

注意:

- `command` には絶対パス、相対パス、またはコマンド名（`acpx`）を指定できます。
- 相対パスはOpenClawワークスペースディレクトリから解決されます。
- `expectedVersion: "any"` は厳密なバージョン一致を無効にします。
- `command` がカスタムバイナリ/パスを指す場合、Pluginローカル自動インストールは無効になります。
- OpenClawの起動は、バックエンドヘルスチェックの実行中も非ブロッキングのままです。

[Plugins](/ja-JP/tools/plugin) を参照してください。

### 自動依存関係インストール

`npm install -g openclaw` でOpenClawをグローバルインストールすると、acpxランタイム依存関係（プラットフォーム固有バイナリ）はpostinstallフックによって自動的にインストールされます。自動インストールに失敗しても、Gatewayは通常どおり起動し、不足している依存関係は `openclaw acp doctor` を通じて報告されます。

### Plugin tools MCPブリッジ

デフォルトでは、ACPXセッションはOpenClawのPlugin登録済みツールをACPハーネスに**公開しません**。

CodexやClaude CodeのようなACPエージェントから、memory recall/storeのようなインストール済みOpenClaw Pluginツールを呼び出したい場合は、専用ブリッジを有効化してください:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

これにより行われること:

- `openclaw-plugin-tools` という名前の組み込みMCPサーバーがACPXセッションのブートストラップに注入されます。
- インストール済みかつ有効なOpenClaw Pluginsによってすでに登録されているPluginツールを公開します。
- この機能は明示的であり、デフォルトではオフのままです。

セキュリティと信頼に関する注意:

- これによりACPハーネスのツール面が広がります。
- ACPエージェントがアクセスできるのは、Gateway内ですでに有効なPluginツールだけです。
- これは、それらのPluginsをOpenClaw自体で実行させるのと同じ信頼境界として扱ってください。
- 有効化前にインストール済みPluginsを確認してください。

カスタム `mcpServers` はこれまでどおり動作します。組み込みのplugin-toolsブリッジは、汎用MCPサーバー設定の置き換えではなく、追加のオプトイン利便機能です。

### ランタイムタイムアウト設定

バンドル済み `acpx` Pluginは、埋め込みランタイムターンのデフォルトタイムアウトを120秒に設定しています。これにより、Gemini CLIのような遅いハーネスにもACP起動と初期化を完了する十分な時間が与えられます。ホストで異なるランタイム上限が必要な場合は上書きしてください:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

この値を変更したらGatewayを再起動してください。

### ヘルスプローブエージェント設定

バンドル済み `acpx` Pluginは、埋め込みランタイムバックエンドの準備完了判定時に1つのハーネスエージェントをプローブします。デフォルトは `codex` です。デプロイで別のデフォルトACPエージェントを使う場合は、プローブエージェントも同じIDに設定してください:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

この値を変更したらGatewayを再起動してください。

## 権限設定

ACPセッションは非対話的に実行されます — ファイル書き込みやシェル実行の権限プロンプトを承認/拒否するためのTTYはありません。acpx Pluginには、権限の扱いを制御する2つの設定キーがあります:

これらのACPXハーネス権限は、OpenClawのexec承認とも、Claude CLI `--permission-mode bypassPermissions` のようなCLIバックエンドのベンダーバイパスフラグとも別です。ACPXの `approve-all` は、ACPセッション向けのハーネスレベルの非常手段スイッチです。

### `permissionMode`

ハーネスエージェントがプロンプトなしで実行できる操作を制御します。

| 値              | 動作                                                          |
| --------------- | ------------------------------------------------------------- |
| `approve-all`   | すべてのファイル書き込みとシェルコマンドを自動承認します。     |
| `approve-reads` | 読み取りのみを自動承認します。書き込みと実行はプロンプトが必要です。 |
| `deny-all`      | すべての権限プロンプトを拒否します。                           |

### `nonInteractivePermissions`

権限プロンプトが表示されるはずだが、対話型TTYが使えない場合（ACPセッションでは常にこの状態）にどうするかを制御します。

| 値     | 動作                                                     |
| ------ | -------------------------------------------------------- |
| `fail` | `AcpRuntimeError` でセッションを中止します。**（デフォルト）** |
| `deny` | 権限を黙って拒否して続行します（穏当な劣化動作）。       |

### 設定

Plugin設定で指定します:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

これらの値を変更したらGatewayを再起動してください。

> **重要:** OpenClawの現在のデフォルトは `permissionMode=approve-reads` および `nonInteractivePermissions=fail` です。非対話型ACPセッションでは、権限プロンプトを引き起こす書き込みまたは実行は `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` で失敗することがあります。
>
> 権限を制限したい場合は、セッションがクラッシュするのではなく穏当に劣化動作するように、`nonInteractivePermissions` を `deny` に設定してください。

## トラブルシューティング

| 症状                                                                        | 可能性の高い原因                                                                | 修正方法                                                                                                                                                          |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | バックエンドPluginが存在しない、または無効です。                                | バックエンドPluginをインストールして有効化し、その後 `/acp doctor` を実行してください。                                                                          |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACPがグローバルに無効化されています。                                           | `acp.enabled=true` を設定してください。                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 通常のスレッドメッセージからのディスパッチが無効化されています。                | `acp.dispatch.enabled=true` を設定してください。                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | エージェントが許可リストに入っていません。                                      | 許可された `agentId` を使うか、`acp.allowedAgents` を更新してください。                                                                                           |
| `Unable to resolve session target: ...`                                     | キー/id/ラベルトークンが不正です。                                              | `/acp sessions` を実行し、正確なキー/ラベルをコピーして再試行してください。                                                                                      |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` が、バインド可能なアクティブ会話なしで使われました。              | 対象のチャット/チャネルへ移動して再試行するか、バインドなし起動を使ってください。                                                                                 |
| `Conversation bindings are unavailable for <channel>.`                      | アダプターに現在の会話ACPバインディング機能がありません。                       | サポートされている場合は `/acp spawn ... --thread ...` を使うか、トップレベルの `bindings[]` を設定するか、対応チャネルへ移動してください。                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` がスレッドコンテキスト外で使われました。                        | 対象スレッドへ移動するか、`--thread auto` / `off` を使ってください。                                                                                             |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 別のユーザーがアクティブなバインディングターゲットを所有しています。            | 所有者として再バインドするか、別の会話またはスレッドを使ってください。                                                                                           |
| `Thread bindings are unavailable for <channel>.`                            | アダプターにスレッドバインディング機能がありません。                            | `--thread off` を使うか、対応するアダプター/チャネルへ移動してください。                                                                                         |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACPランタイムはホスト側で動作し、要求元セッションはサンドボックス化されています。 | サンドボックス化されたセッションからは `runtime="subagent"` を使うか、非サンドボックスセッションからACP起動を実行してください。                                  |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACPランタイムに対して `sandbox="require"` が要求されました。                    | サンドボックス必須なら `runtime="subagent"` を使うか、非サンドボックスセッションから `sandbox="inherit"` でACPを使ってください。                                 |
| バインド済みセッションのACPメタデータが不足している                         | ACPセッションメタデータが古い、または削除されています。                         | `/acp spawn` で再作成し、その後スレッドを再バインド/再フォーカスしてください。                                                                                   |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | 非対話型ACPセッションで `permissionMode` が書き込み/実行をブロックしています。 | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定し、Gatewayを再起動してください。[権限設定](#permission-configuration) を参照してください。 |
| ACPセッションが出力ほぼなしで早期に失敗する                                 | 権限プロンプトが `permissionMode` / `nonInteractivePermissions` によりブロックされています。 | Gatewayログで `AcpRuntimeError` を確認してください。完全な権限が必要なら `permissionMode=approve-all`、穏当な劣化動作にしたいなら `nonInteractivePermissions=deny` を設定してください。 |
| ACPセッションが作業完了後も無期限に停止したままになる                       | ハーネスプロセスは終了したが、ACPセッションが完了を報告していません。           | `ps aux \| grep acpx` で監視し、古いプロセスを手動でkillしてください。                                                                                           |
