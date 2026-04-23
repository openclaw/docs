---
read_when:
    - ACP 経由で coding harnesses を実行する
    - メッセージング channels 上で conversation-bound ACP sessions を設定する
    - message channel の conversation を永続的な ACP session にバインドする
    - ACP backend と Plugin の配線をトラブルシューティングする
    - ACP completion delivery や agent-to-agent loops をデバッグする
    - チャットから /acp commands を操作する
summary: Codex、Claude Code、Cursor、Gemini CLI、OpenClaw ACP、その他の harness agents に ACP runtime sessions を使用する
title: ACP Agents
x-i18n:
    generated_at: "2026-04-23T14:10:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 617103fe47ef90592bad4882da719c47c801ebc916d3614c148a66e6601e8cf5
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP Agents

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sessions を使うと、OpenClaw は ACP backend plugin を通じて外部の coding harnesses（たとえば Pi、Claude Code、Codex、Cursor、Copilot、OpenClaw ACP、OpenCode、Gemini CLI、およびその他の対応 ACPX harnesses）を実行できます。

OpenClaw に自然言語で「これを Codex で実行して」や「Claude Code を thread で始めて」と頼んだ場合、OpenClaw はその request を ACP runtime にルーティングするべきです（ネイティブ sub-agent runtime ではありません）。各 ACP session spawn は [background task](/ja-JP/automation/tasks) として追跡されます。

Codex や Claude Code を、既存の OpenClaw channel conversations に対して外部 MCP client として直接接続したい場合は、
ACP の代わりに [`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。

## どのページを見るべきか

近接した 3 つの surface があり、混同しやすいです。

| あなたがやりたいこと | 使うもの | 注記 |
| -------------------- | -------- | ---- |
| Codex、Claude Code、Gemini CLI、または他の外部 harness を OpenClaw _経由で_ 実行したい | このページ: ACP Agents | チャットにバインドされた sessions、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、background tasks、runtime controls |
| OpenClaw Gateway session を editor や client 向けの ACP server _として_ 公開したい | [`openclaw acp`](/ja-JP/cli/acp) | bridge mode。IDE/client が stdio/WebSocket 経由で OpenClaw に ACP で接続 |
| ローカル AI CLI をテキスト専用の fallback model として再利用したい | [CLI Backends](/ja-JP/gateway/cli-backends) | ACP ではありません。OpenClaw tools なし、ACP controls なし、harness runtime なし |

## そのままで動きますか

通常は、はい。

- 新規インストールでは、bundled の `acpx` runtime plugin がデフォルトで有効になっています。
- bundled の `acpx` Plugin は、その plugin-local に pin された `acpx` binary を優先します。
- 起動時に OpenClaw はその binary を probe し、必要なら自己修復します。
- 手早い readiness check がほしいなら、まず `/acp doctor` から始めてください。

初回使用時にまだ起こり得ること:

- 対象 harness adapter は、その harness を最初に使うときに `npx` でオンデマンド取得されることがあります。
- その harness 向けの vendor auth は、引き続き host 上に存在している必要があります。
- host に npm/network access がない場合、caches が事前に warm 済みになるか、adapter が別の方法でインストールされるまでは、初回 adapter fetch が失敗することがあります。

例:

- `/acp spawn codex`: OpenClaw は `acpx` を bootstrap できる状態であるべきですが、Codex ACP adapter はまだ初回 fetch が必要な場合があります。
- `/acp spawn claude`: Claude ACP adapter でも同様で、加えてその host 上の Claude 側 auth も必要です。

## 実用的なオペレーターフロー

実践的な `/acp` runbook がほしい場合はこれを使ってください。

1. session を spawn する:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. バインドされた conversation または thread で作業する（またはその session key を明示的に target する）。
3. runtime state を確認する:
   - `/acp status`
4. 必要に応じて runtime options を調整する:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. context を置き換えずにアクティブ session を軽く誘導する:
   - `/acp steer tighten logging and continue`
6. 作業を止める:
   - `/acp cancel`（現在の turn を停止）、または
   - `/acp close`（session を閉じて bindings を削除）

## 人向けクイックスタート

自然な依頼の例:

- 「この Discord channel を Codex にバインドして」
- 「ここで thread に persistent な Codex session を開始して、そのまま focused に保って」
- 「これを one-shot の Claude Code ACP session として実行して、結果を要約して」
- 「この iMessage chat を Codex にバインドして、後続も同じ workspace で続けて」
- 「この task には thread で Gemini CLI を使って、その後の follow-up も同じ thread で続けて」

OpenClaw が行うべきこと:

1. `runtime: "acp"` を選ぶ。
2. 要求された harness target（`agentId`、たとえば `codex`）を解決する。
3. 現在の conversation binding が要求されていて、アクティブ channel がそれをサポートしているなら、ACP session をその conversation に bind する。
4. そうでなく、thread binding が要求されていて、現在の channel がそれをサポートしているなら、ACP session をその thread に bind する。
5. unfocused/closed/expired になるまで、後続の bound messages を同じ ACP session にルーティングする。

## ACP と sub-agents の違い

外部 harness runtime がほしい場合は ACP を使ってください。OpenClaw ネイティブの委譲実行がほしい場合は sub-agents を使ってください。

| Area | ACP session | Sub-agent run |
| ---- | ----------- | ------------- |
| Runtime | ACP backend plugin（例: acpx） | OpenClaw ネイティブ sub-agent runtime |
| Session key | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| Main commands | `/acp ...` | `/subagents ...` |
| Spawn tool | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn`（デフォルト runtime） |

関連項目: [Sub-agents](/ja-JP/tools/subagents)。

## ACP が Claude Code をどう実行するか

ACP 経由の Claude Code では、スタックは次のとおりです。

1. OpenClaw ACP session control plane
2. bundled の `acpx` runtime plugin
3. Claude ACP adapter
4. Claude 側の runtime/session machinery

重要な違い:

- ACP Claude は、ACP controls、session resume、background-task tracking、任意の conversation/thread binding を備えた harness session です。
- CLI backends は別のテキスト専用ローカル fallback runtimes です。[CLI Backends](/ja-JP/gateway/cli-backends) を参照してください。

オペレーター向けの実務ルール:

- `/acp spawn`、bind 可能な sessions、runtime controls、または persistent な harness work がほしい: ACP を使う
- 生の CLI を通じた単純なローカル text fallback がほしい: CLI backends を使う

## Bound sessions

### 現在の conversation への bind

子 thread を作らずに、現在の conversation を durable な ACP workspace にしたい場合は `/acp spawn <harness> --bind here` を使います。

動作:

- OpenClaw は引き続き channel transport、auth、safety、delivery を所有します。
- 現在の conversation は、spawn された ACP session key に固定されます。
- その conversation 内の follow-up messages は、同じ ACP session にルーティングされます。
- `/new` と `/reset` は、同じ bound ACP session をその場でリセットします。
- `/acp close` は session を閉じ、現在の conversation binding を削除します。

実際の意味:

- `--bind here` は同じ chat surface を維持します。Discord では、現在の channel はそのまま現在の channel です。
- `--bind here` は、新しい作業を spawn している場合には新しい ACP session を作ることもあります。bind はその session を現在の conversation にアタッチします。
- `--bind here` 自体は子 Discord thread や Telegram topic を作成しません。
- ACP runtime は独自の working directory（`cwd`）や backend 管理 workspace をディスク上に持つことができます。その runtime workspace は chat surface とは別であり、新しい messaging thread を意味しません。
- 別の ACP agent に spawn し、`--cwd` を渡さなかった場合、OpenClaw はデフォルトで requester ではなく **target agent の** workspace を継承します。
- その継承された workspace path が存在しない場合（`ENOENT`/`ENOTDIR`）、OpenClaw は誤った tree を黙って再利用するのではなく、backend default cwd にフォールバックします。
- 継承された workspace は存在するがアクセスできない場合（たとえば `EACCES`）、spawn は `cwd` を捨てずに実際の access error を返します。

メンタルモデル:

- chat surface: 人が会話を続ける場所（`Discord channel`、`Telegram topic`、`iMessage chat`）
- ACP session: OpenClaw がルーティングする durable な Codex/Claude/Gemini runtime state
- child thread/topic: `--thread ...` でのみ作成される任意の追加 messaging surface
- runtime workspace: harness が動作する filesystem location（`cwd`、repo checkout、backend workspace）

例:

- `/acp spawn codex --bind here`: この chat を維持し、Codex ACP session を spawn または attach し、ここでの将来の messages をそこにルーティングする
- `/acp spawn codex --thread auto`: OpenClaw は child thread/topic を作成し、そこに ACP session を bind する場合がある
- `/acp spawn codex --bind here --cwd /workspace/repo`: 上と同じ chat binding だが、Codex は `/workspace/repo` で動作する

現在の conversation binding のサポート:

- 現在の conversation binding サポートを公開する chat/message channels は、共有 conversation-binding path を通じて `--bind here` を利用できます。
- custom な thread/topic semantics を持つ channels でも、同じ共有 interface の背後で channel 固有の canonicalization を提供できます。
- `--bind here` は常に「現在の conversation をその場で bind する」という意味です。
- 汎用の現在 conversation bind は共有 OpenClaw binding store を使い、通常の gateway restart をまたいで存続します。

注記:

- `/acp spawn` では `--bind here` と `--thread ...` は相互排他的です。
- Discord では、`--bind here` は現在の channel または thread をその場で bind します。`spawnAcpSessions` が必要なのは、OpenClaw が `--thread auto|here` のために child thread を作成する必要がある場合だけです。
- アクティブ channel が現在 conversation の ACP bindings を公開していない場合、OpenClaw は明確な unsupported message を返します。
- `resume` や「new session」に関する質問は、channel の質問ではなく ACP-session の質問です。現在の chat surface を変えずに runtime state を再利用または置き換えられます。

### Thread-bound sessions

channel adapter で thread bindings が有効な場合、ACP sessions を threads に bind できます。

- OpenClaw は thread を target ACP session に bind します。
- その thread 内の follow-up messages は bound ACP session にルーティングされます。
- ACP output は同じ thread に返送されます。
- unfocus/close/archive/idle-timeout または max-age expiry により binding は削除されます。

thread binding のサポートは adapter ごとです。アクティブ channel adapter が thread bindings をサポートしない場合、OpenClaw は明確な unsupported/unavailable message を返します。

thread-bound ACP に必要な feature flags:

- `acp.enabled=true`
- `acp.dispatch.enabled` はデフォルトでオン（ACP dispatch を一時停止するには `false`）
- channel-adapter の ACP thread-spawn flag が有効（adapter ごと）
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Thread をサポートする channels

- session/thread binding capability を公開する任意の channel adapter
- 現在の built-in サポート:
  - Discord threads/channels
  - Telegram topics（groups/supergroups 内の forum topics と DM topics）
- Plugin channels も同じ binding interface を通じてサポートを追加できます。

## Channel 固有の設定

非 ephemeral なワークフローでは、トップレベルの `bindings[]` entries で persistent な ACP bindings を設定してください。

### Binding model

- `bindings[].type="acp"` は persistent な ACP conversation binding を示します。
- `bindings[].match` は target conversation を識別します:
  - Discord channel または thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum topic: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/group chat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    安定した group bindings には `chat_id:*` または `chat_identifier:*` を推奨します。
  - iMessage DM/group chat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    安定した group bindings には `chat_id:*` を推奨します。
- `bindings[].agentId` は owning OpenClaw agent id です。
- 任意の ACP overrides は `bindings[].acp` の下に置きます:
  - `mode`（`persistent` または `oneshot`）
  - `label`
  - `cwd`
  - `backend`

### agent ごとの runtime defaults

agent ごとに 1 回だけ ACP defaults を定義するには `agents.list[].runtime` を使います。

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（harness id、たとえば `codex` または `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP bound sessions の override 優先順位:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. グローバル ACP defaults（例: `acp.backend`）

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

- OpenClaw は、設定済み ACP session が使用前に存在することを保証します。
- その channel または topic 内の messages は、設定済み ACP session にルーティングされます。
- bound conversations では、`/new` と `/reset` は同じ ACP session key をその場でリセットします。
- 一時的な runtime bindings（たとえば thread-focus flows が作成したもの）が存在する場合は、引き続きそれが適用されます。
- 明示的な `cwd` を伴わない cross-agent ACP spawns では、OpenClaw は agent config から target agent の workspace を継承します。
- 継承された workspace path が存在しない場合は backend default cwd にフォールバックし、存在するのにアクセスできない場合は spawn error として表面化します。

## ACP sessions を開始する（interfaces）

### `sessions_spawn` から

agent turn または tool call から ACP session を開始するには `runtime: "acp"` を使います。

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

注記:

- `runtime` のデフォルトは `subagent` なので、ACP sessions には明示的に `runtime: "acp"` を設定してください。
- `agentId` を省略した場合、設定済みであれば OpenClaw は `acp.defaultAgent` を使用します。
- `mode: "session"` は、永続的な bound conversation を維持するために `thread: true` が必要です。

interface の詳細:

- `task`（必須）: ACP session に送られる初期 prompt。
- `runtime`（ACP では必須）: `"acp"` でなければなりません。
- `agentId`（任意）: ACP target harness id。設定されていれば `acp.defaultAgent` にフォールバックします。
- `thread`（任意、デフォルト `false`）: サポートされる場合に thread binding flow を要求します。
- `mode`（任意）: `run`（one-shot）または `session`（persistent）。
  - デフォルトは `run`
  - `thread: true` で mode が省略された場合、OpenClaw は runtime path ごとに persistent behavior をデフォルトにすることがあります
  - `mode: "session"` には `thread: true` が必要です
- `cwd`（任意）: 要求する runtime working directory（backend/runtime policy によって検証されます）。省略された場合、設定されていれば ACP spawn は target agent workspace を継承します。継承された path が存在しない場合は backend defaults にフォールバックし、実際の access errors は返されます。
- `label`（任意）: session/banner text で使われる operator 向けラベル。
- `resumeSessionId`（任意）: 新しい ACP session を作成する代わりに既存の ACP session を再開します。agent は `session/load` を通じて conversation history を再生します。`runtime: "acp"` が必要です。
- `streamTo`（任意）: `"parent"` は、初期 ACP run progress summaries を system events として requester session にストリーミングで返します。
  - 利用可能な場合、受け付けられた response には、完全な relay history を tail できる session スコープの JSONL log（`<sessionId>.acp-stream.jsonl`）を指す `streamLogPath` が含まれます。
- `model`（任意）: ACP child session 用の明示的な model override。`runtime: "acp"` のときに尊重され、child は target agent default に黙ってフォールバックせず、要求された model を使います。

## 配信モデル

ACP sessions は、対話型 workspace にも、parent 所有の background work にもなれます。配信 path はその形によって異なります。

### 対話型 ACP sessions

対話型 sessions は、見えている chat surface 上で会話を続けるためのものです。

- `/acp spawn ... --bind here` は、現在の conversation を ACP session に bind します。
- `/acp spawn ... --thread ...` は、channel の thread/topic を ACP session に bind します。
- 永続的に設定された `bindings[].type="acp"` は、一致する conversations を同じ ACP session にルーティングします。

bound conversation 内の follow-up messages は直接 ACP session にルーティングされ、ACP output は同じ channel/thread/topic に返送されます。

### Parent 所有の one-shot ACP sessions

別の agent run によって spawn された one-shot ACP sessions は、sub-agents と同様の background children です。

- parent は `sessions_spawn({ runtime: "acp", mode: "run" })` で作業を依頼します。
- child は自身の ACP harness session で実行されます。
- completion は内部の task-completion announce path を通じて返されます。
- ユーザー向け reply が有用な場合、parent は child result を通常の assistant voice で書き換えます。

この path を parent と child の peer-to-peer chat として扱わないでください。child はすでに parent への completion channel を持っています。

### `sessions_send` と A2A delivery

`sessions_send` は spawn 後に別の session を target にできます。通常の peer sessions では、OpenClaw は message を注入した後に agent-to-agent（A2A）の follow-up path を使います。

- target session の reply を待つ
- 必要に応じて requester と target に有限回の follow-up turns を交換させる
- target に announce message を生成させる
- その announce を見えている channel または thread に配信する

この A2A path は、sender が visible な follow-up を必要とする peer sends 向けの fallback です。たとえば広い `tools.sessions.visibility` 設定の下で、無関係な session が ACP target を見て message を送れる場合などに有効のままです。

OpenClaw は、requester が自身の parent 所有 one-shot ACP child の親である場合にのみ、この A2A follow-up をスキップします。その場合、task completion の上に A2A を走らせると、child の結果で parent を起こし、その parent's reply を child に送り返して、parent/child echo loop を作ってしまう可能性があります。`sessions_send` の結果は、その owned-child のケースでは `delivery.status="skipped"` を報告します。completion path がすでに結果に責任を持っているためです。

### 既存 session を再開する

新しく始める代わりに以前の ACP session を続行するには `resumeSessionId` を使用します。agent は `session/load` を通じて conversation history を再生するため、以前の完全な context を引き継いで再開できます。

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

よくある用途:

- Codex session を laptop から phone に引き継ぐ — agent に、途中から作業を再開するよう伝える
- CLI で対話的に始めた coding session を、今度は agent 経由で headless に続ける
- gateway restart や idle timeout で中断した作業を再開する

注記:

- `resumeSessionId` には `runtime: "acp"` が必要です。sub-agent runtime で使うと error になります。
- `resumeSessionId` は上流の ACP conversation history を復元します。`thread` と `mode` は新しく作る OpenClaw session に対して通常どおり適用されるため、`mode: "session"` には引き続き `thread: true` が必要です。
- target agent は `session/load` をサポートしている必要があります（Codex と Claude Code は対応）。
- session ID が見つからない場合、spawn は明確な error で失敗し、新しい session への黙ったフォールバックは行いません。

### Operator smoke test

gateway deploy の後に、単体テストが通るだけでなく、ACP spawn
が実際に end-to-end で動作していることを手早く live check したい場合に使います。

推奨 gate:

1. 対象 host 上で、デプロイされた gateway version/commit を確認する。
2. デプロイされた source に、`src/gateway/sessions-patch.ts` の
   ACP lineage acceptance（`subagent:* or acp:* sessions`）が含まれていることを確認する。
3. live agent（たとえば `jpclawhq` 上の
   `razor(main)`）に一時的な ACPX bridge session を開く。
4. その agent に、次の条件で `sessions_spawn` を呼び出すよう依頼する:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. agent が次を報告することを確認する:
   - `accepted=yes`
   - 実際の `childSessionKey`
   - validator error がない
6. 一時的な ACPX bridge session をクリーンアップする。

live agent への prompt 例:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

注記:

- thread-bound persistent ACP sessions を意図的にテストしているのでなければ、
  この smoke test は `mode: "run"` のままにしてください。
- 基本 gate に `streamTo: "parent"` を要求しないでください。この path は
  requester/session capabilities に依存し、別の integration check です。
- thread-bound の `mode: "session"` テストは、実際の Discord thread または Telegram topic からの、より豊かな第 2 段階 integration
  pass として扱ってください。

## Sandbox compatibility

ACP sessions は現在、OpenClaw sandbox 内ではなく host runtime 上で動作します。

現在の制限:

- requester session が sandboxed の場合、`sessions_spawn({ runtime: "acp" })` と `/acp spawn` の両方で ACP spawns はブロックされます。
  - Error: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"` を使う `sessions_spawn` は `sandbox: "require"` をサポートしません。
  - Error: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

sandbox 強制実行が必要な場合は `runtime: "subagent"` を使ってください。

### `/acp` command から

チャットから明示的な operator control が必要な場合は `/acp spawn` を使います。

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

主要 flags:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

詳しくは [Slash Commands](/ja-JP/tools/slash-commands) を参照してください。

## Session target resolution

多くの `/acp` actions は任意の session target（`session-key`、`session-id`、`session-label`）を受け付けます。

解決順序:

1. 明示的な target 引数（または `/acp steer` の `--session`）
   - まず key を試す
   - 次に UUID 形状の session id を試す
   - 最後に label を試す
2. 現在の thread binding（この conversation/thread が ACP session に bind されている場合）
3. 現在の requester session へのフォールバック

現在の conversation bindings と thread bindings は、どちらも step 2 に参加します。

target が何も解決されない場合、OpenClaw は明確な error（`Unable to resolve session target: ...`）を返します。

## Spawn bind modes

`/acp spawn` は `--bind here|off` をサポートします。

| Mode   | 動作 |
| ------ | ---- |
| `here` | 現在アクティブな conversation をその場で bind します。アクティブな conversation がなければ失敗します。 |
| `off`  | 現在の conversation binding を作成しません。 |

注記:

- `--bind here` は、「この channel または chat を Codex-backed にする」ための最も簡単な operator path です。
- `--bind here` は child thread を作成しません。
- `--bind here` は、現在の conversation binding サポートを公開している channels でのみ利用可能です。
- `--bind` と `--thread` は同じ `/acp spawn` call では組み合わせられません。

## Spawn thread modes

`/acp spawn` は `--thread auto|here|off` をサポートします。

| Mode   | 動作 |
| ------ | ---- |
| `auto` | アクティブな thread 内では、その thread を bind します。thread 外では、サポートされていれば child thread を作成して bind します。 |
| `here` | 現在アクティブな thread を必須とします。thread 内でなければ失敗します。 |
| `off`  | bind しません。session は unbound のまま開始されます。 |

注記:

- thread binding がない surfaces では、デフォルト動作は実質的に `off` です。
- thread-bound spawn には channel policy のサポートが必要です:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- child thread を作らずに現在の conversation を固定したい場合は `--bind here` を使用してください。

## ACP controls

利用可能な command family:

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

`/acp status` は、実効 runtime options と、利用可能な場合は runtime レベルと backend レベル両方の session identifiers を表示します。

一部の controls は backend capabilities に依存します。backend が control をサポートしていない場合、OpenClaw は明確な unsupported-control error を返します。

## ACP command cookbook

| Command              | 何をするか | 例 |
| -------------------- | ---------- | -- |
| `/acp spawn`         | ACP session を作成し、任意で現在 bind または thread bind を行う。 | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel`        | target session の進行中 turn をキャンセルする。 | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer`         | 実行中 session に steer instruction を送る。 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | session を閉じて thread targets を unbind する。 | `/acp close` |
| `/acp status`        | backend、mode、state、runtime options、capabilities を表示する。 | `/acp status` |
| `/acp set-mode`      | target session の runtime mode を設定する。 | `/acp set-mode plan` |
| `/acp set`           | 汎用 runtime config option の書き込み。 | `/acp set model openai/gpt-5.4` |
| `/acp cwd`           | runtime working directory override を設定する。 | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions`   | approval policy profile を設定する。 | `/acp permissions strict` |
| `/acp timeout`       | runtime timeout（秒）を設定する。 | `/acp timeout 120` |
| `/acp model`         | runtime model override を設定する。 | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | session runtime option overrides を削除する。 | `/acp reset-options` |
| `/acp sessions`      | store から最近の ACP sessions を一覧表示する。 | `/acp sessions` |
| `/acp doctor`        | backend の health、capabilities、実行可能な fixes。 | `/acp doctor` |
| `/acp install`       | 決定的な install と enable 手順を表示する。 | `/acp install` |

`/acp sessions` は、現在の bound session または requester session に対する store を読み取ります。`session-key`、`session-id`、`session-label` tokens を受け付ける commands は、custom な agent ごとの `session.store` roots を含む gateway session discovery を通じて targets を解決します。

## Runtime options の対応関係

`/acp` には convenience commands と generic setter があります。

等価な操作:

- `/acp model <id>` は runtime config key `model` に対応します。
- `/acp permissions <profile>` は runtime config key `approval_policy` に対応します。
- `/acp timeout <seconds>` は runtime config key `timeout` に対応します。
- `/acp cwd <path>` は runtime cwd override を直接更新します。
- `/acp set <key> <value>` は generic path です。
  - 特別扱い: `key=cwd` は cwd override path を使います。
- `/acp reset-options` は target session のすべての runtime overrides をクリアします。

## acpx harness support（現在）

現在の acpx built-in harness aliases:

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

OpenClaw が acpx backend を使う場合、acpx config に custom agent aliases が定義されていない限り、`agentId` にはこれらの値を推奨します。
もしローカルの Cursor install がまだ `agent acp` として ACP を公開している場合は、built-in default を変更するのではなく、acpx config 側で `cursor` agent command を override してください。

直接の acpx CLI usage では `--agent <command>` によって任意の adapters も target にできますが、この raw escape hatch は acpx CLI の機能であり、通常の OpenClaw `agentId` path ではありません。

## 必須 config

core ACP baseline:

```json5
{
  acp: {
    enabled: true,
    // 任意。デフォルトは true。/acp controls を維持したまま ACP dispatch を一時停止するには false を設定します。
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

thread binding config は channel-adapter ごとです。Discord の例:

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

thread-bound ACP spawn が動かない場合は、まず adapter feature flag を確認してください。

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

現在の conversation bind には child-thread 作成は必要ありません。必要なのは、アクティブな conversation context と、ACP conversation bindings を公開する channel adapter です。

詳しくは [Configuration Reference](/ja-JP/gateway/configuration-reference) を参照してください。

## acpx backend 用の Plugin セットアップ

新規インストールでは bundled の `acpx` runtime plugin がデフォルトで有効になっているため、ACP
は通常、手動で Plugin をインストールしなくても動作します。

まずは次を実行してください。

```text
/acp doctor
```

`acpx` を無効化した、`plugins.allow` / `plugins.deny` で拒否した、または
ローカル開発 checkout に切り替えたい場合は、明示的な plugin path を使ってください。

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

開発中のローカル workspace install:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

その後、backend health を検証します。

```text
/acp doctor
```

### acpx command と version 設定

デフォルトでは、bundled の acpx backend plugin（`acpx`）は plugin-local に pin された binary を使います。

1. command のデフォルトは、ACPX plugin package 内の plugin-local `node_modules/.bin/acpx` です。
2. expected version のデフォルトは extension pin です。
3. startup は ACP backend を即座に not-ready として登録します。
4. background ensure job が `acpx --version` を検証します。
5. plugin-local binary がない、または version が一致しない場合、次を実行して再検証します:
   `npm install --omit=dev --no-save acpx@<pinned>`

plugin config で command/version を override できます。

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

注記:

- `command` は absolute path、relative path、または command name（`acpx`）を受け付けます。
- relative paths は OpenClaw workspace directory から解決されます。
- `expectedVersion: "any"` は strict version matching を無効化します。
- `command` が custom binary/path を指している場合、plugin-local auto-install は無効になります。
- backend health check の実行中も OpenClaw startup は non-blocking のままです。

詳しくは [Plugins](/ja-JP/tools/plugin) を参照してください。

### 依存関係の自動インストール

`npm install -g openclaw` で OpenClaw をグローバルインストールすると、acpx
runtime dependencies（platform 固有 binaries）は postinstall hook により自動インストールされます。自動インストールに失敗しても gateway は通常どおり起動し、不足している dependency は `openclaw acp doctor` を通じて報告されます。

### Plugin tools MCP bridge

デフォルトでは、ACPX sessions は OpenClaw の plugin 登録済み tools を ACP harness に**公開しません**。

Codex や Claude Code のような ACP agents に、memory recall/store など、インストール済みの
OpenClaw plugin tools を呼ばせたい場合は、専用 bridge を有効にしてください。

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

これが行うこと:

- ACPX session
  bootstrap に `openclaw-plugin-tools` という built-in MCP server を注入します。
- インストール済みかつ有効な OpenClaw
  plugins によってすでに登録されている plugin tools を公開します。
- この機能は明示的かつデフォルト off のままです。

セキュリティと trust に関する注記:

- これは ACP harness の tool surface を拡張します。
- ACP agents がアクセスできるのは、gateway ですでに有効な plugin tools のみです。
- これは、それらの plugins に OpenClaw 自体で実行を許可するのと同じ trust boundary として扱ってください。
- 有効にする前に、インストール済み plugins を確認してください。

custom `mcpServers` は従来どおり引き続き機能します。built-in の plugin-tools bridge は、
generic MCP server config の置き換えではなく、追加の opt-in convenience です。

### OpenClaw tools MCP bridge

デフォルトでは、ACPX sessions は built-in OpenClaw tools も
MCP 経由で公開しません。ACP agent が `cron` のような選択された
built-in tools を必要とする場合は、別の core-tools bridge を有効にしてください。

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

これが行うこと:

- ACPX session
  bootstrap に `openclaw-tools` という built-in MCP server を注入します。
- 選択された built-in OpenClaw tools を公開します。初期 server は `cron` を公開します。
- core-tool exposure は明示的かつデフォルト off のままです。

### Runtime timeout 設定

bundled の `acpx` Plugin は、embedded runtime turns のデフォルト timeout を 120 秒にしています。これにより、Gemini CLI のような遅めの harnesses にも、ACP startup と initialization を完了する十分な時間が与えられます。host に別の
runtime limit が必要な場合は override してください。

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

この値を変更した後は gateway を再起動してください。

### Health probe agent 設定

bundled の `acpx` Plugin は、embedded runtime backend の readiness を判断する際に 1 つの harness agent を probe します。デフォルトは `codex` です。デプロイ環境で別の default ACP agent を使っている場合は、probe agent を同じ id に設定してください。

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

この値を変更した後は gateway を再起動してください。

## Permission 設定

ACP sessions は non-interactive に実行されます。file-write や shell-exec の permission prompts を承認または拒否するための TTY はありません。acpx Plugin は、permissions の扱いを制御する 2 つの config keys を提供します。

これらの ACPX harness permissions は、OpenClaw exec approvals とは別物であり、Claude CLI の `--permission-mode bypassPermissions` のような CLI-backend vendor bypass flags とも別物です。ACPX の `approve-all` は、ACP sessions 向けの harness レベルの break-glass switch です。

### `permissionMode`

harness agent が prompt なしで実行できる操作を制御します。

| Value           | 動作 |
| --------------- | ---- |
| `approve-all`   | すべての file writes と shell commands を自動承認します。 |
| `approve-reads` | reads のみ自動承認します。writes と exec は prompts が必要です。 |
| `deny-all`      | すべての permission prompts を拒否します。 |

### `nonInteractivePermissions`

permission prompt が表示されるべきだが interactive TTY が利用できない場合に何が起こるかを制御します（ACP sessions では常にこの状態です）。

| Value  | 動作 |
| ------ | ---- |
| `fail` | `AcpRuntimeError` で session を中断します。**（デフォルト）** |
| `deny` | permission を黙って拒否して続行します（graceful degradation）。 |

### 設定

plugin config で設定します。

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

これらの値を変更した後は gateway を再起動してください。

> **重要:** OpenClaw は現在、`permissionMode=approve-reads` と `nonInteractivePermissions=fail` をデフォルトにしています。non-interactive な ACP sessions では、permission prompt を発生させる write または exec は、`AcpRuntimeError: Permission prompt unavailable in non-interactive mode` で失敗する可能性があります。
>
> permissions を制限する必要がある場合は、session がクラッシュするのではなく graceful に degrade するよう、`nonInteractivePermissions` を `deny` に設定してください。

## トラブルシューティング

| Symptom                                                                     | Likely cause | Fix |
| --------------------------------------------------------------------------- | ------------ | --- |
| `ACP runtime backend is not configured`                                     | backend Plugin が見つからないか無効。 | backend Plugin をインストールして有効化し、その後 `/acp doctor` を実行する。 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP がグローバルに無効。 | `acp.enabled=true` に設定する。 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 通常の thread messages からの dispatch が無効。 | `acp.dispatch.enabled=true` に設定する。 |
| `ACP agent "<id>" is not allowed by policy`                                 | agent が allowlist に入っていない。 | 許可された `agentId` を使うか、`acp.allowedAgents` を更新する。 |
| `Unable to resolve session target: ...`                                     | key/id/label token が不正。 | `/acp sessions` を実行し、正確な key/label をコピーして再試行する。 |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` が、アクティブで bind 可能な conversation なしで使われた。 | 対象の chat/channel に移動して再試行するか、unbound spawn を使う。 |
| `Conversation bindings are unavailable for <channel>.`                      | adapter に current-conversation ACP binding capability がない。 | サポートされている場合は `/acp spawn ... --thread ...` を使うか、トップレベルの `bindings[]` を設定するか、対応 channel に移動する。 |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` が thread context 外で使われた。 | 対象 thread に移動するか、`--thread auto`/`off` を使う。 |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 別の user がアクティブ binding target を所有している。 | owner として rebind するか、別の conversation または thread を使う。 |
| `Thread bindings are unavailable for <channel>.`                            | adapter に thread binding capability がない。 | `--thread off` を使うか、対応 adapter/channel に移動する。 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime は host 側で動作し、requester session が sandboxed。 | sandboxed sessions からは `runtime="subagent"` を使うか、sandbox ではない session から ACP spawn を実行する。 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP runtime に対して `sandbox="require"` が要求された。 | 必須 sandboxing には `runtime="subagent"` を使うか、sandbox ではない session から ACP を `sandbox="inherit"` で使う。 |
| Missing ACP metadata for bound session                                      | 古くなった/削除された ACP session metadata。 | `/acp spawn` で再作成し、その後 thread を rebind/focus する。 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` が non-interactive ACP session で writes/exec をブロックしている。 | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定し、gateway を再起動する。[Permission configuration](#permission-configuration) を参照。 |
| ACP session fails early with little output                                  | permission prompts が `permissionMode`/`nonInteractivePermissions` によりブロックされている。 | gateway logs で `AcpRuntimeError` を確認する。完全な permissions が必要なら `permissionMode=approve-all`、graceful degradation なら `nonInteractivePermissions=deny` を設定する。 |
| ACP session stalls indefinitely after completing work                       | harness process は終了したが ACP session が completion を報告しなかった。 | `ps aux \| grep acpx` で監視し、古い processes を手動で kill する。 |
