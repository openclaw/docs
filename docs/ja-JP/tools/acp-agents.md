---
read_when:
    - ACP 経由でコーディング harness を実行する
    - メッセージングチャネルで会話に紐づく ACP セッションをセットアップする
    - メッセージチャネルの会話を永続的な ACP セッションにバインドする
    - ACP backend と Plugin 配線をトラブルシューティングする
    - ACP 完了配信やエージェント間ループをデバッグする場合
    - チャットから /acp コマンドを操作する դեպքում
summary: Claude Code、Cursor、Gemini CLI、明示的な Codex ACP fallback、OpenClaw ACP、その他の harness agent で ACP ランタイムセッションを使う
title: ACP エージェント
x-i18n:
    generated_at: "2026-04-24T05:22:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d59c5aa858e7888c9188ec9fc7dd5bcb9c8a5458f40d6458a5157ebc16332c2
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) セッションにより、OpenClaw は ACP backend Plugin を通じて外部コーディング harness（たとえば Pi、Claude Code、Cursor、Copilot、OpenClaw ACP、OpenCode、Gemini CLI、その他のサポートされる ACPX harness）を実行できます。

現在の会話で Codex をバインドまたは制御するよう OpenClaw に平文で依頼した場合、OpenClaw はネイティブ Codex app-server Plugin（`/codex bind`, `/codex threads`, `/codex resume`）を使うべきです。`/acp`、ACP、acpx、または Codex のバックグラウンド子セッションを求めた場合、OpenClaw は引き続き Codex を ACP 経由でルーティングできます。各 ACP セッション spawn は [バックグラウンドタスク](/ja-JP/automation/tasks) として追跡されます。

「Claude Code をスレッドで起動して」など、別の外部 harness の使用を OpenClaw に平文で依頼した場合、OpenClaw はそのリクエストをネイティブ sub-agent ランタイムではなく ACP ランタイムへルーティングすべきです。

既存の OpenClaw チャネル会話に、Codex や Claude Code を外部 MCP クライアントとして直接接続したい場合は、
ACP ではなく [`openclaw mcp serve`](/ja-JP/cli/mcp) を使ってください。

## どのページを見ればよいですか？

混同しやすい近接したサーフェスが 3 つあります。

| やりたいこと | 使うもの | メモ |
| ------------ | -------- | ---- |
| 現在の会話で Codex をバインドまたは制御する | `/codex bind`, `/codex threads` | ネイティブ Codex app-server パス。バインド済みチャット返信、画像転送、model/fast/permissions、stop、steer 制御を含みます。ACP は明示的 fallback です |
| OpenClaw _経由で_ Claude Code、Gemini CLI、明示的な Codex ACP、または別の外部 harness を実行する | このページ: ACP エージェント | チャットにバインドされたセッション、`/acp spawn`, `sessions_spawn({ runtime: "acp" })`, バックグラウンドタスク、ランタイム制御 |
| OpenClaw Gateway セッションを、エディターやクライアント向けに ACP サーバー _として_ 公開する | [`openclaw acp`](/ja-JP/cli/acp) | ブリッジモード。IDE/クライアントが stdio/WebSocket で OpenClaw に ACP で接続 |
| ローカル AI CLI を text-only fallback モデルとして再利用する | [CLI Backends](/ja-JP/gateway/cli-backends) | ACP ではありません。OpenClaw tools なし、ACP 制御なし、harness ランタイムなし |

## これはすぐに使えますか？

通常は、はい。新規インストールでは、bundled `acpx` ランタイム Plugin がデフォルトで有効になっており、OpenClaw は startup 時に Plugin ローカルに pin された `acpx` バイナリを probe し、自己修復します。準備状況の確認には `/acp doctor` を実行してください。

初回実行時の注意点:

- 対象 harness アダプター（Codex、Claude など）は、初回利用時に `npx` でオンデマンド取得されることがあります。
- その harness 用の vendor auth は引き続き host 上に存在している必要があります。
- host に npm またはネットワークアクセスがない場合、キャッシュを事前に温めるか別の方法でアダプターをインストールするまで、初回のアダプター取得は失敗します。

## 運用 runbook

チャットからの簡単な `/acp` フロー:

1. **Spawn** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto`, または明示的な `/acp spawn codex --bind here`
2. バインドされた会話またはスレッドで**作業**する（または session key を明示的に指定する）。
3. **状態確認** — `/acp status`
4. **調整** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. コンテキストを置き換えずに**誘導**する — `/acp steer tighten logging and continue`
6. **停止** — `/acp cancel`（現在のターン）または `/acp close`（セッション + bindings）

ネイティブ Codex Plugin にルーティングされるべき自然言語トリガー:

- 「この Discord チャネルを Codex にバインドして。」
- 「このチャットを Codex スレッド `<id>` に接続して。」
- 「Codex スレッドを表示して、その後これをバインドして。」

ネイティブ Codex 会話バインディングはデフォルトのチャット制御パスですが、対話的な Codex 承認/tool フローに対しては意図的に保守的です。このバインド済みチャットパスでは OpenClaw の動的 tools と承認プロンプトはまだ公開されていないため、そのようなリクエストは明確な説明付きで拒否されます。ワークフローが OpenClaw 動的 tools や長時間の対話的承認に依存する場合は、Codex harness パスまたは明示的 ACP fallback を使ってください。

ACP ランタイムにルーティングされるべき自然言語トリガー:

- 「これを one-shot の Claude Code ACP セッションとして実行して、結果を要約して。」
- 「このタスクに Gemini CLI をスレッドで使って、その後のフォローアップも同じスレッドで続けて。」
- 「Codex を ACP 経由でバックグラウンドスレッドで実行して。」

OpenClaw は `runtime: "acp"` を選び、harness `agentId` を解決し、サポートされている場合は現在の会話またはスレッドへバインドし、close/expiry までそのセッションにフォローアップをルーティングします。Codex がこのパスを使うのは、ACP が明示的な場合、または要求されたバックグラウンドランタイムがまだ ACP を必要とする場合だけです。

## ACP と sub-agents の違い

外部 harness ランタイムが必要なら ACP を使ってください。Codex の会話バインディング/制御にはネイティブ Codex app-server を使ってください。OpenClaw ネイティブの委譲実行が必要なら sub-agents を使ってください。

| 項目 | ACP セッション | Sub-agent 実行 |
| ---- | -------------- | -------------- |
| ランタイム | ACP backend Plugin（例: acpx） | OpenClaw ネイティブ sub-agent ランタイム |
| セッションキー | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| 主なコマンド | `/acp ...` | `/subagents ...` |
| Spawn tool | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn`（デフォルトランタイム） |

あわせて [Sub-agents](/ja-JP/tools/subagents) も参照してください。

## ACP が Claude Code を実行する仕組み

ACP 経由で Claude Code を使う場合、スタックは次のとおりです。

1. OpenClaw ACP セッション制御プレーン
2. bundled `acpx` ランタイム Plugin
3. Claude ACP アダプター
4. Claude 側ランタイム/セッション機構

重要な違い:

- ACP Claude は、ACP 制御、セッション再開、バックグラウンドタスク追跡、およびオプションの会話/スレッドバインディングを備えた harness セッションです。
- CLI backends は、別個の text-only ローカル fallback ランタイムです。[CLI Backends](/ja-JP/gateway/cli-backends) を参照してください。

運用者向けの実用的なルール:

- `/acp spawn`、バインド可能なセッション、ランタイム制御、または永続的な harness 作業が必要: ACP を使う
- 生の CLI を通じた単純なローカル text fallback が必要: CLI backends を使う

## バインド済みセッション

### 現在の会話へのバインド

`/acp spawn <harness> --bind here` は、現在の会話を spawn された ACP セッションに固定します。子スレッドは作られず、同じチャットサーフェスのままです。OpenClaw は引き続き transport、auth、安全性、配信を所有します。その会話内のフォローアップメッセージは同じセッションにルーティングされます。`/new` と `/reset` はセッションをその場でリセットし、`/acp close` は binding を削除します。

考え方:

- **chat surface** — 人が話し続ける場所（Discord チャネル、Telegram topic、iMessage チャット）。
- **ACP セッション** — OpenClaw がルーティングする、永続的な Codex/Claude/Gemini ランタイム state。
- **子スレッド/topic** — `--thread ...` によってのみ作成される、任意の追加メッセージングサーフェス。
- **ランタイム workspace** — harness が動作するファイルシステム上の場所（`cwd`、repo checkout、backend workspace）。chat surface とは独立しています。

例:

- `/codex bind` — このチャットを維持し、ネイティブ Codex app-server を spawn または接続し、今後のメッセージをここへルーティングする。
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — チャットからバインド済みのネイティブ Codex スレッドを調整する。
- `/codex stop` または `/codex steer focus on the failing tests first` — アクティブなネイティブ Codex ターンを制御する。
- `/acp spawn codex --bind here` — Codex 用の明示的 ACP fallback。
- `/acp spawn codex --thread auto` — OpenClaw が子スレッド/topic を作成して、そこへバインドすることがあります。
- `/acp spawn codex --bind here --cwd /workspace/repo` — 同じチャットにバインドしつつ、Codex は `/workspace/repo` で実行される。

メモ:

- `--bind here` と `--thread ...` は同時に使えません。
- `--bind here` は、現在の会話バインディングを広告するチャネルでのみ動作します。そうでない場合、OpenClaw は明確な未サポートメッセージを返します。bindings は gateway 再起動をまたいで保持されます。
- Discord では、`spawnAcpSessions` が必要なのは、OpenClaw が `--thread auto|here` のために子スレッドを作成する必要がある場合だけで、`--bind here` には不要です。
- 別の ACP エージェントに `--cwd` なしで spawn した場合、OpenClaw はデフォルトで**対象エージェントの** workspace を継承します。継承したパスが存在しない場合（`ENOENT`/`ENOTDIR`）は backend デフォルトへフォールバックしますが、その他のアクセスエラー（例: `EACCES`）は spawn エラーとして表面化します。

### スレッドにバインドされたセッション

チャネルアダプターでスレッド binding が有効になっている場合、ACP セッションはスレッドにバインドできます。

- OpenClaw はスレッドを対象 ACP セッションにバインドします。
- そのスレッド内のフォローアップメッセージは、バインドされた ACP セッションにルーティングされます。
- ACP の出力は同じスレッドに返されます。
- unfocus/close/archive/idle-timeout または max-age expiry により binding は削除されます。

スレッド binding サポートはアダプター依存です。アクティブなチャネルアダプターがスレッド binding をサポートしていない場合、OpenClaw は明確な未サポート/利用不可メッセージを返します。

スレッドにバインドされた ACP に必要な feature flag:

- `acp.enabled=true`
- `acp.dispatch.enabled` はデフォルトでオン（ACP dispatch を一時停止するには `false` を設定）
- チャネルアダプターの ACP thread-spawn フラグが有効（アダプター依存）
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### スレッド対応チャネル

- セッション/スレッド binding capability を公開する任意のチャネルアダプター。
- 現在の組み込みサポート:
  - Discord スレッド/チャネル
  - Telegram topics（グループ/スーパーグループの forum topics と DM topics）
- Plugin チャネルも、同じ binding インターフェースを通じてサポートを追加できます。

## チャネル固有の設定

一時的でないワークフローでは、トップレベルの `bindings[]` エントリーで永続的な ACP bindings を設定します。

### Binding モデル

- `bindings[].type="acp"` は永続的な ACP 会話 binding を示します。
- `bindings[].match` は対象会話を識別します:
  - Discord チャネルまたはスレッド: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum topic: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/グループチャット: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    安定したグループ binding には `chat_id:*` または `chat_identifier:*` を推奨します。
  - iMessage DM/グループチャット: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    安定したグループ binding には `chat_id:*` を推奨します。
- `bindings[].agentId` は所有する OpenClaw エージェント ID です。
- オプションの ACP 上書きは `bindings[].acp` 配下に置きます:
  - `mode`（`persistent` または `oneshot`）
  - `label`
  - `cwd`
  - `backend`

### エージェントごとのランタイムデフォルト

エージェントごとに ACP デフォルトを一度だけ定義するには `agents.list[].runtime` を使います。

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（harness ID。例: `codex` または `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP バインド済みセッションの上書き優先順位:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. グローバル ACP デフォルト（例: `acp.backend`）

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

- OpenClaw は、設定された ACP セッションが使用前に存在することを保証します。
- そのチャネルまたは topic のメッセージは、設定された ACP セッションにルーティングされます。
- バインド済み会話では、`/new` と `/reset` は同じ ACP セッションキーをその場でリセットします。
- 一時的なランタイム binding（たとえば thread-focus フローで作成されたもの）は、存在する場合は引き続き適用されます。
- 明示的な `cwd` なしの cross-agent ACP spawn では、OpenClaw は対象エージェントの workspace を agent config から継承します。
- 継承した workspace パスが見つからない場合は backend デフォルトの cwd にフォールバックし、存在するパスへのアクセス失敗は spawn エラーとして表面化します。

## ACP セッションを開始する（インターフェース）

### `sessions_spawn` から

エージェントターンまたは tool call から ACP セッションを開始するには `runtime: "acp"` を使います。

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

メモ:

- `runtime` のデフォルトは `subagent` なので、ACP セッションでは `runtime: "acp"` を明示的に設定してください。
- `agentId` を省略した場合、設定されていれば OpenClaw は `acp.defaultAgent` を使います。
- `mode: "session"` では、永続的なバインド済み会話を維持するために `thread: true` が必要です。

インターフェース詳細:

- `task`（必須）: ACP セッションに送る初期プロンプト。
- `runtime`（ACP では必須）: `"acp"` でなければなりません。
- `agentId`（任意）: ACP 対象 harness ID。設定されていれば `acp.defaultAgent` にフォールバックします。
- `thread`（任意、デフォルト `false`）: サポートされている場合に thread binding フローを要求します。
- `mode`（任意）: `run`（one-shot）または `session`（永続）。
  - デフォルトは `run`
  - `thread: true` で mode を省略した場合、OpenClaw はランタイムパスごとに永続動作をデフォルトにすることがあります
  - `mode: "session"` には `thread: true` が必要です
- `cwd`（任意）: 要求するランタイム作業ディレクトリ（backend/runtime ポリシーで検証されます）。省略した場合、設定されていれば ACP spawn は対象エージェントの workspace を継承します。継承したパスが見つからない場合は backend デフォルトにフォールバックし、実際のアクセスエラーはそのまま返されます。
- `label`（任意）: セッション/バナーテキストで使われる運用者向けラベル。
- `resumeSessionId`（任意）: 新しい ACP セッションを作る代わりに既存の ACP セッションを再開します。agent は `session/load` を通じて会話履歴を再生します。`runtime: "acp"` が必要です。
- `streamTo`（任意）: `"parent"` は、初期 ACP 実行の進捗サマリーを system event として要求元セッションへストリーミングします。
  - 利用可能な場合、受理された応答にはフル relay 履歴を tail できる session スコープの JSONL ログ（`<sessionId>.acp-stream.jsonl`）を指す `streamLogPath` が含まれます。
- `model`（任意）: ACP 子セッションに対する明示的モデル上書き。`runtime: "acp"` で尊重されるため、子は対象エージェントのデフォルトへ黙ってフォールバックせず、要求されたモデルを使います。

## 配信モデル

ACP セッションは、対話型 workspace にも、親所有のバックグラウンド作業にもなれます。配信パスはその形に依存します。

### 対話型 ACP セッション

対話型セッションは、見えるチャットサーフェス上で会話を続けるためのものです。

- `/acp spawn ... --bind here` は現在の会話を ACP セッションにバインドします。
- `/acp spawn ... --thread ...` はチャネル thread/topic を ACP セッションにバインドします。
- 永続的に設定された `bindings[].type="acp"` は、一致する会話を同じ ACP セッションにルーティングします。

バインド済み会話のフォローアップメッセージは ACP セッションへ直接ルーティングされ、ACP 出力は同じチャネル/thread/topic に返されます。

### 親所有の one-shot ACP セッション

別のエージェント実行によって spawn された one-shot ACP セッションは、sub-agents に似たバックグラウンド子です。

- 親は `sessions_spawn({ runtime: "acp", mode: "run" })` で作業を要求します。
- 子は独自の ACP harness セッションで実行されます。
- 完了は内部 task-completion announce パスを通じて報告されます。
- ユーザー向け返信が有用な場合、親は子の結果を通常のアシスタントの声で書き直します。

このパスを、親と子の peer-to-peer チャットとして扱わないでください。子にはすでに親へ戻る完了チャネルがあります。

### `sessions_send` と A2A 配信

`sessions_send` は spawn 後に別のセッションを対象にできます。通常の peer セッションでは、OpenClaw はメッセージ注入後に agent-to-agent（A2A）のフォローアップパスを使います。

- 対象セッションの返信を待つ
- オプションで、要求元と対象が制限された回数だけフォローアップターンを交換できるようにする
- 対象に announce メッセージを生成させる
- その announce を見えているチャネルまたは thread に配信する

この A2A パスは、送信者に見えるフォローアップが必要な peer 送信の fallback です。たとえば広い `tools.sessions.visibility` 設定の下で、無関係なセッションが ACP 対象を見てメッセージを送れる場合などに有効のままです。

要求元が、自身の親所有 one-shot ACP 子の親である場合に限り、OpenClaw は A2A フォローアップをスキップします。この場合、task completion の上にさらに A2A を実行すると、親が子の結果で起こされ、その親の返信が再び子へ転送され、親子の echo loop が発生する可能性があります。`sessions_send` の結果は、この所有子ケースでは `delivery.status="skipped"` を報告します。結果については、完了パスがすでに責任を持っているためです。

### 既存セッションを再開する

新しく始める代わりに以前の ACP セッションを継続するには `resumeSessionId` を使います。agent は `session/load` を通じて会話履歴を再生するため、それまでの完全なコンテキストを持ったまま再開します。

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

よくある利用例:

- ノート PC から携帯電話へ Codex セッションを引き継ぐ — 中断した場所から再開するよう agent に伝える
- CLI で対話的に始めたコーディングセッションを、今度は agent 経由で headless に継続する
- gateway 再起動や idle timeout で中断された作業を再開する

メモ:

- `resumeSessionId` には `runtime: "acp"` が必要です — sub-agent ランタイムで使うとエラーを返します。
- `resumeSessionId` は上流 ACP の会話履歴を復元します。`thread` と `mode` は、作成中の新しい OpenClaw セッションに対して通常どおり適用されるため、`mode: "session"` には引き続き `thread: true` が必要です。
- 対象エージェントは `session/load` をサポートしている必要があります（Codex と Claude Code はサポートします）。
- セッション ID が見つからない場合、spawn は明確なエラーで失敗します — 新しいセッションへ黙ってフォールバックすることはありません。

<Accordion title="デプロイ後スモークテスト">

gateway デプロイ後は、ユニットテストを信じるのではなく、ライブの end-to-end チェックを実行してください。

1. 対象 host 上で、デプロイ済み gateway のバージョンと commit を確認する。
2. ライブ agent への一時的な ACPX ブリッジセッションを開く。
3. その agent に、`runtime: "acp"`、`agentId: "codex"`、`mode: "run"`、および task `Reply with exactly LIVE-ACP-SPAWN-OK` を指定して `sessions_spawn` を呼び出すよう依頼する。
4. `accepted=yes`、実在する `childSessionKey`、validator エラーなしを確認する。
5. 一時ブリッジセッションをクリーンアップする。

ゲートは `mode: "run"` のままにし、`streamTo: "parent"` はスキップしてください。thread にバインドされた `mode: "session"` と stream-relay パスは、別のより豊かな統合パスです。

</Accordion>

## Sandbox 互換性

ACP セッションは現在、OpenClaw sandbox 内ではなく host ランタイム上で動作します。

現在の制限:

- 要求元セッションが sandbox 化されている場合、`sessions_spawn({ runtime: "acp" })` と `/acp spawn` の両方で ACP spawn はブロックされます。
  - エラー: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"` を持つ `sessions_spawn` は `sandbox: "require"` をサポートしません。
  - エラー: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

sandbox による強制実行が必要な場合は `runtime: "subagent"` を使ってください。

### `/acp` コマンドから

必要に応じて、チャットからの明示的な運用者制御には `/acp spawn` を使います。

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

[Slash Commands](/ja-JP/tools/slash-commands) を参照してください。

## セッション対象の解決

多くの `/acp` アクションは、任意のセッション対象（`session-key`、`session-id`、または `session-label`）を受け付けます。

解決順序:

1. 明示的な対象引数（または `/acp steer` の `--session`）
   - まず key を試す
   - 次に UUID 形式の session id を試す
   - 次に label を試す
2. 現在の thread binding（この会話/thread が ACP セッションにバインドされている場合）
3. 現在の要求元セッションへのフォールバック

現在の会話 binding と thread binding の両方が、手順 2 に参加します。

対象を解決できない場合、OpenClaw は明確なエラーを返します（`Unable to resolve session target: ...`）。

## Spawn bind モード

`/acp spawn` は `--bind here|off` をサポートします。

| モード | 動作 |
| ------ | ---- |
| `here` | 現在アクティブな会話をその場でバインドする。アクティブなものがなければ失敗。 |
| `off`  | 現在の会話 binding を作成しない。 |

メモ:

- `--bind here` は「このチャネルまたはチャットを Codex バックエンドにする」ための最も簡単な運用パスです。
- `--bind here` は子 thread を作成しません。
- `--bind here` は、現在の会話 binding サポートを公開しているチャネルでのみ利用できます。
- `--bind` と `--thread` は同じ `/acp spawn` 呼び出しで組み合わせることはできません。

## Spawn thread モード

`/acp spawn` は `--thread auto|here|off` をサポートします。

| モード | 動作 |
| ------ | ---- |
| `auto` | アクティブ thread 内では、その thread をバインドする。thread 外では、サポートされていれば子 thread を作成してバインドする。 |
| `here` | 現在アクティブな thread を必須とする。thread 内でなければ失敗。 |
| `off`  | binding なし。セッションはバインドされないまま開始される。 |

メモ:

- スレッド binding 非対応サーフェスでは、デフォルト動作は実質的に `off` です。
- スレッドにバインドされた spawn にはチャネルポリシーサポートが必要です:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- 子スレッドを作成せずに現在の会話を固定したい場合は `--bind here` を使ってください。

## ACP 制御

| コマンド | すること | 例 |
| -------- | -------- | -- |
| `/acp spawn` | ACP セッションを作成する。現在の bind または thread bind を任意で指定可能。 | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel` | 対象セッションの進行中ターンをキャンセルする。 | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` | 実行中セッションに steer 指示を送る。 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close` | セッションを閉じて thread 対象の binding を解除する。 | `/acp close` |
| `/acp status` | backend、mode、state、ランタイムオプション、capability を表示する。 | `/acp status` |
| `/acp set-mode` | 対象セッションのランタイム mode を設定する。 | `/acp set-mode plan` |
| `/acp set` | 汎用ランタイム config オプションを書き込む。 | `/acp set model openai/gpt-5.4` |
| `/acp cwd` | ランタイム作業ディレクトリ上書きを設定する。 | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions` | 承認ポリシープロファイルを設定する。 | `/acp permissions strict` |
| `/acp timeout` | ランタイム timeout（秒）を設定する。 | `/acp timeout 120` |
| `/acp model` | ランタイムモデル上書きを設定する。 | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | セッションのランタイムオプション上書きを削除する。 | `/acp reset-options` |
| `/acp sessions` | store から最近の ACP セッションを一覧する。 | `/acp sessions` |
| `/acp doctor` | backend のヘルス、capability、実行可能な修正を表示する。 | `/acp doctor` |
| `/acp install` | 決定的な install と有効化手順を表示する。 | `/acp install` |

`/acp status` は、有効なランタイムオプションに加えて、ランタイムレベルと backend レベルのセッション識別子を表示します。backend に capability がない場合、未サポートの制御エラーは明確に表面化します。`/acp sessions` は、現在のバインド済みセッションまたは要求元セッションについて store を読み取ります。対象トークン（`session-key`、`session-id`、または `session-label`）は、カスタムなエージェントごとの `session.store` ルートを含め、gateway のセッション discovery を通じて解決されます。

## ランタイムオプションのマッピング

`/acp` には便利コマンドと汎用 setter があります。

等価な操作:

- `/acp model <id>` はランタイム config キー `model` に対応します。
- `/acp permissions <profile>` はランタイム config キー `approval_policy` に対応します。
- `/acp timeout <seconds>` はランタイム config キー `timeout` に対応します。
- `/acp cwd <path>` はランタイム `cwd` 上書きを直接更新します。
- `/acp set <key> <value>` は汎用パスです。
  - 特別扱い: `key=cwd` は cwd 上書きパスを使います。
- `/acp reset-options` は対象セッションのすべてのランタイム上書きをクリアします。

## acpx harness、Plugin セットアップ、権限

acpx harness 設定（Claude Code / Codex / Gemini CLI エイリアス）、  
plugin-tools と OpenClaw-tools MCP ブリッジ、および ACP 権限モードについては、
[ACP エージェント — セットアップ](/ja-JP/tools/acp-agents-setup) を参照してください。

## トラブルシューティング

| 症状 | 可能性の高い原因 | 修正 |
| ---- | ---------------- | ---- |
| `ACP runtime backend is not configured` | Backend Plugin がない、または無効。 | backend Plugin を install して有効化し、その後 `/acp doctor` を実行してください。 |
| `ACP is disabled by policy (acp.enabled=false)` | ACP がグローバルに無効。 | `acp.enabled=true` を設定してください。 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | 通常の thread メッセージからの dispatch が無効。 | `acp.dispatch.enabled=true` を設定してください。 |
| `ACP agent "<id>" is not allowed by policy` | agent が allowlist に入っていない。 | 許可された `agentId` を使うか、`acp.allowedAgents` を更新してください。 |
| `Unable to resolve session target: ...` | key/id/label トークンが不正。 | `/acp sessions` を実行し、正確な key/label をコピーして再試行してください。 |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` が、アクティブでバインド可能な会話なしで使われた。 | 対象チャット/チャネルに移動して再試行するか、バインドなし spawn を使ってください。 |
| `Conversation bindings are unavailable for <channel>.` | アダプターに現在の会話 ACP binding capability がない。 | サポートされている場合は `/acp spawn ... --thread ...` を使うか、トップレベル `bindings[]` を設定するか、サポートされるチャネルへ移動してください。 |
| `--thread here requires running /acp spawn inside an active ... thread` | `--thread here` が thread コンテキスト外で使われた。 | 対象 thread に移動するか、`--thread auto`/`off` を使ってください。 |
| `Only <user-id> can rebind this channel/conversation/thread.` | 別ユーザーがアクティブ binding 対象を所有している。 | 所有者として再バインドするか、別の会話または thread を使ってください。 |
| `Thread bindings are unavailable for <channel>.` | アダプターに thread binding capability がない。 | `--thread off` を使うか、サポートされるアダプター/チャネルへ移動してください。 |
| `Sandboxed sessions cannot spawn ACP sessions ...` | ACP ランタイムは host 側で、要求元セッションが sandbox 化されている。 | sandbox 化されたセッションからは `runtime="subagent"` を使うか、sandbox でないセッションから ACP spawn を実行してください。 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | ACP ランタイムに対して `sandbox="require"` が要求された。 | sandbox 必須なら `runtime="subagent"` を使うか、sandbox でないセッションから `sandbox="inherit"` で ACP を使ってください。 |
| バインド済みセッションの ACP メタデータが欠落している | 古い/削除された ACP セッションメタデータ。 | `/acp spawn` で再作成し、その後 thread を再バインド/フォーカスしてください。 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` が非対話 ACP セッションで書き込み/exec をブロックしている。 | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定して gateway を再起動してください。[Permission configuration](/ja-JP/tools/acp-agents-setup#permission-configuration) を参照してください。 |
| ACP セッションが初期段階でほとんど出力なく失敗する | `permissionMode`/`nonInteractivePermissions` により権限プロンプトがブロックされている。 | gateway ログで `AcpRuntimeError` を確認してください。完全な権限が必要なら `permissionMode=approve-all`、穏当な劣化動作が必要なら `nonInteractivePermissions=deny` を設定してください。 |
| ACP セッションが作業完了後も無期限に停止する | harness プロセスは終了したが、ACP セッションが完了を報告しなかった。 | `ps aux \| grep acpx` で監視し、古いプロセスを手動で kill してください。 |

## 関連

- [Sub-agents](/ja-JP/tools/subagents)
- [マルチエージェント sandbox tools](/ja-JP/tools/multi-agent-sandbox-tools)
- [Agent send](/ja-JP/tools/agent-send)
