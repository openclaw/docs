---
read_when:
    - ACP 経由でコーディングハーネスを実行する
    - メッセージングチャネルで会話に紐づく ACP セッションを設定する
    - メッセージチャネルの会話を永続的な ACP セッションにバインドする
    - ACP バックエンド、Plugin 連携、または completion 配信のトラブルシューティング
    - チャットから /acp コマンドを操作する
sidebarTitle: ACP agents
summary: 外部コーディングハーネス（Claude Code、Cursor、Gemini CLI、明示的な Codex ACP、OpenClaw ACP、OpenCode）を ACP バックエンド経由で実行する
title: ACP エージェント
x-i18n:
    generated_at: "2026-05-02T21:07:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec2404924cbb4c4cd0d94485bc7d8ea586c0ef5f4380e72d5212c8bd9d868c20
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) セッションにより、OpenClaw は ACP バックエンド Plugin を通じて、外部コーディングハーネス（たとえば Pi、Claude Code、Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI、およびその他の対応 ACPX ハーネス）を実行できます。

各 ACP セッションの spawn は [バックグラウンドタスク](/ja-JP/automation/tasks) として追跡されます。

<Note>
**ACP は外部ハーネス用の経路であり、デフォルトの Codex 経路ではありません。** ネイティブの Codex アプリサーバー Plugin は `/codex ...` コントロールと `agentRuntime.id: "codex"` の組み込みランタイムを所有します。ACP は `/acp ...` コントロールと `sessions_spawn({ runtime: "acp" })` セッションを所有します。

Codex または Claude Code を外部 MCP クライアントとして既存の OpenClaw チャネル会話へ直接接続したい場合は、ACP ではなく [`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。
</Note>

## どのページを見ればよいですか？

| やりたいこと                                                                                    | 使用するもの                              | 注記                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 現在の会話で Codex をバインドまたは制御する                                               | `/codex bind`, `/codex threads`       | `codex` Plugin が有効な場合のネイティブ Codex アプリサーバー経路です。バインドされたチャット返信、画像転送、モデル/高速/権限、停止、ステア制御を含みます。ACP は明示的なフォールバックです |
| Claude Code、Gemini CLI、明示的な Codex ACP、または別の外部ハーネスを OpenClaw _経由で_ 実行する | このページ                             | チャットにバインドされたセッション、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、バックグラウンドタスク、ランタイム制御                                                                                   |
| エディタまたはクライアント向けに OpenClaw Gateway セッションを ACP サーバー _として_ 公開する                   | [`openclaw acp`](/ja-JP/cli/acp)            | ブリッジモードです。IDE/クライアントは stdio/WebSocket 経由で ACP を OpenClaw とやり取りします                                                                                                                            |
| ローカル AI CLI をテキスト専用フォールバックモデルとして再利用する                                              | [CLI バックエンド](/ja-JP/gateway/cli-backends) | ACP ではありません。OpenClaw ツール、ACP コントロール、ハーネスランタイムはありません                                                                                                                               |

## これは初期状態で動作しますか？

はい。公式 ACP ランタイム Plugin をインストールした後に動作します。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

ソース checkout では、`pnpm install` 後にローカルの `extensions/acpx` ワークスペース Plugin を使用できます。準備状況を確認するには `/acp doctor` を実行してください。

OpenClaw は、ACP が**本当に使用可能**な場合にのみ、エージェントに ACP spawn について教えます。ACP が有効であること、dispatch が無効化されていないこと、現在のセッションがサンドボックスでブロックされていないこと、ランタイムバックエンドがロードされていることが必要です。これらの条件を満たさない場合、ACP Plugin Skills と `sessions_spawn` の ACP ガイダンスは非表示のままになり、エージェントが利用できないバックエンドを提案しないようにします。

<AccordionGroup>
  <Accordion title="初回実行時の注意点">
    - `plugins.allow` が設定されている場合、それは制限的な Plugin インベントリであり、**必ず** `acpx` を含める必要があります。含まれていない場合、インストール済みの ACP バックエンドは意図的にブロックされ、`/acp doctor` は allowlist エントリの不足を報告します。
    - Codex ACP アダプターは `acpx` Plugin とともにステージングされ、可能な場合はローカルで起動されます。
    - 他のターゲットハーネスアダプターは、初回使用時に `npx` でオンデマンド取得される場合があります。
    - そのハーネスのベンダー認証は、引き続きホスト上に存在している必要があります。
    - ホストに npm またはネットワークアクセスがない場合、キャッシュを事前に warm するかアダプターを別の方法でインストールするまで、初回実行時のアダプター取得は失敗します。

  </Accordion>
  <Accordion title="ランタイムの前提条件">
    ACP は実際の外部ハーネスプロセスを起動します。OpenClaw はルーティング、バックグラウンドタスク状態、配信、バインディング、ポリシーを所有します。ハーネスはプロバイダーログイン、モデルカタログ、ファイルシステム動作、ネイティブツールを所有します。

    OpenClaw の問題と判断する前に、次を確認してください。

    - `/acp doctor` が、有効で正常なバックエンドを報告していること。
    - allowlist が設定されている場合、ターゲット id が `acp.allowedAgents` で許可されていること。
    - ハーネスコマンドが Gateway ホストで起動できること。
    - そのハーネスのプロバイダー認証が存在すること（`claude`, `codex`, `gemini`, `opencode`, `droid` など）。
    - 選択したモデルがそのハーネスに存在すること。モデル id はハーネス間で移植可能ではありません。
    - 要求した `cwd` が存在しアクセス可能であること。または `cwd` を省略して、バックエンドにデフォルトを使用させること。
    - 権限モードが作業に合っていること。非インタラクティブセッションはネイティブ権限プロンプトをクリックできないため、書き込み/実行が多いコーディング実行では通常、ヘッドレスで進行できる ACPX 権限プロファイルが必要です。

  </Accordion>
</AccordionGroup>

OpenClaw Plugin ツールと組み込み OpenClaw ツールは、デフォルトでは ACP ハーネスに公開されません。ハーネスがそれらのツールを直接呼び出す必要がある場合のみ、[ACP エージェント — セットアップ](/ja-JP/tools/acp-agents-setup) で明示的な MCP ブリッジを有効にしてください。

## 対応ハーネスターゲット

`acpx` バックエンドでは、次のハーネス id を `/acp spawn <id>` または `sessions_spawn({ runtime: "acp", agentId: "<id>" })` のターゲットとして使用します。

| ハーネス id | 一般的なバックエンド                                | 注記                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP アダプター                        | ホスト上の Claude Code 認証が必要です。                                              |
| `codex`    | Codex ACP アダプター                              | ネイティブ `/codex` が利用できない場合、または ACP が要求された場合のみの明示的な ACP フォールバックです。 |
| `copilot`  | GitHub Copilot ACP アダプター                     | Copilot CLI/ランタイム認証が必要です。                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | ローカルインストールが別の ACP エントリポイントを公開している場合は、acpx コマンドを上書きしてください。    |
| `droid`    | Factory Droid CLI                              | ハーネス環境で Factory/Droid 認証または `FACTORY_API_KEY` が必要です。        |
| `gemini`   | Gemini CLI ACP アダプター                         | Gemini CLI 認証または API キー設定が必要です。                                          |
| `iflow`    | iFlow CLI                                      | アダプターの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `kilocode` | Kilo Code CLI                                  | アダプターの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `kimi`     | Kimi/Moonshot CLI                              | ホスト上の Kimi/Moonshot 認証が必要です。                                            |
| `kiro`     | Kiro CLI                                       | アダプターの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `opencode` | OpenCode ACP アダプター                           | OpenCode CLI/プロバイダー認証が必要です。                                                |
| `openclaw` | `openclaw acp` 経由の OpenClaw Gateway ブリッジ | ACP 対応ハーネスが OpenClaw Gateway セッションへ通信し返せるようにします。                 |
| `pi`       | Pi/組み込み OpenClaw ランタイム                   | OpenClaw ネイティブハーネス実験に使用されます。                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | ホスト上の Qwen 互換認証が必要です。                                          |

カスタム acpx エージェントエイリアスは acpx 自体で設定できますが、OpenClaw のポリシーは dispatch 前に引き続き `acp.allowedAgents` と任意の `agents.list[].runtime.acp.agent` マッピングを確認します。

## オペレーター向けランブック

チャットからの簡単な `/acp` フロー:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`、または明示的な
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="作業">
    バインドされた会話またはスレッドで続行します（またはセッションキーを明示的に指定します）。
  </Step>
  <Step title="状態の確認">
    `/acp status`
  </Step>
  <Step title="調整">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`。
  </Step>
  <Step title="ステア">
    コンテキストを置き換えずに: `/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（現在のターン）または `/acp close`（セッション + バインディング）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="ライフサイクルの詳細">
    - Spawn は ACP ランタイムセッションを作成または再開し、OpenClaw セッションストアに ACP メタデータを記録します。また、実行が親所有の場合はバックグラウンドタスクを作成する場合があります。
    - 親所有の ACP セッションは、ランタイムセッションが永続的であってもバックグラウンド作業として扱われます。完了とサーフェス横断の配信は、通常のユーザー向けチャットセッションのように動作するのではなく、親タスク通知機構を通じて行われます。
    - タスク保守は、終端状態または孤立した親所有の単発 ACP セッションを閉じます。永続 ACP セッションは、アクティブな会話バインディングが残っている間は保持されます。アクティブなバインディングのない古い永続セッションは、所有タスクの完了後またはそのタスクレコードがなくなった後に暗黙に再開されないよう閉じられます。
    - バインドされたフォローアップメッセージは、バインディングが閉じられる、フォーカス解除される、リセットされる、または期限切れになるまで、ACP セッションへ直接送られます。
    - Gateway コマンドはローカルに留まります。`/acp ...`、`/status`、`/unfocus` が通常のプロンプトテキストとしてバインド済み ACP ハーネスへ送信されることはありません。
    - `cancel` はバックエンドがキャンセルをサポートしている場合にアクティブなターンを中止します。バインディングやセッションメタデータは削除しません。
    - `close` は OpenClaw の視点から ACP セッションを終了し、バインディングを削除します。ハーネスは、resume をサポートしている場合、自身の上流履歴を引き続き保持することがあります。
    - アイドル状態のランタイムワーカーは `acp.runtime.ttlMinutes` 後にクリーンアップ対象になります。保存されたセッションメタデータは `/acp sessions` で引き続き利用できます。

  </Accordion>
  <Accordion title="ネイティブ Codex ルーティングルール">
    有効な場合に **ネイティブ Codex Plugin** へルーティングされるべき自然言語トリガー:

    - 「この Discord チャネルを Codex にバインドして。」
    - 「このチャットを Codex スレッド `<id>` に接続して。」
    - 「Codex スレッドを表示してから、これをバインドして。」

    ネイティブ Codex 会話バインディングは、デフォルトのチャット制御経路です。OpenClaw 動的ツールは引き続き OpenClaw を通じて実行され、shell/apply-patch などの Codex ネイティブツールは Codex 内で実行されます。Codex ネイティブツールイベントでは、OpenClaw がターンごとのネイティブ hook リレーを注入し、Plugin hooks が `before_tool_call` をブロックし、`after_tool_call` を監視し、Codex `PermissionRequest` イベントを OpenClaw 承認経由でルーティングできるようにします。Codex `Stop` hooks は OpenClaw `before_agent_finalize` にリレーされ、そこで Plugin は Codex が回答を確定する前に、もう 1 回モデルパスを要求できます。このリレーは意図的に保守的なままです。Codex ネイティブツール引数を変更したり、Codex スレッドレコードを書き換えたりしません。ACP ランタイム/セッションモデルが必要な場合にのみ、明示的な ACP を使用してください。組み込み Codex サポート境界は [Codex ハーネス v1 サポート契約](/ja-JP/plugins/codex-harness#v1-support-contract) に文書化されています。

  </Accordion>
  <Accordion title="モデル / プロバイダー / ランタイム選択チートシート">
    - `openai-codex/*` — PI Codex OAuth/サブスクリプション経路。
    - `openai/*` と `agentRuntime.id: "codex"` — ネイティブ Codex アプリサーバー組み込みランタイム。
    - `/codex ...` — ネイティブ Codex 会話制御。
    - `/acp ...` または `runtime: "acp"` — 明示的な ACP/acpx 制御。

  </Accordion>
  <Accordion title="ACP ルーティングの自然言語トリガー">
    ACP ランタイムへルーティングするべきトリガー:

    - "これをワンショットの Claude Code ACP セッションとして実行し、結果を要約してください。"
    - "このタスクにはスレッド内で Gemini CLI を使い、その後のフォローアップも同じスレッドで続けてください。"
    - "バックグラウンドスレッドで ACP 経由で Codex を実行してください。"

    OpenClaw は `runtime: "acp"` を選択し、ハーネス `agentId` を解決し、
    サポートされている場合は現在の会話またはスレッドにバインドし、
    クローズまたは期限切れまでフォローアップをそのセッションへルーティングします。Codex は
    ACP/acpx が明示されている場合、または要求された操作でネイティブ Codex
    plugin を利用できない場合にのみ、この経路に従います。

    `sessions_spawn` では、`runtime: "acp"` は ACP
    が有効で、リクエスターがサンドボックス化されておらず、ACP ランタイム
    バックエンドが読み込まれている場合にのみ公開されます。`acp.dispatch.enabled=false` は自動
    ACP スレッドディスパッチを一時停止しますが、明示的な
    `sessions_spawn({ runtime: "acp" })` 呼び出しを非表示にしたりブロックしたりしません。対象は `codex`、
    `claude`、`droid`、`gemini`、`opencode` などの ACP ハーネス ID です。該当エントリが
    `agents.list[].runtime.type="acp"` で明示的に設定されていない限り、
    `agents_list` からの通常の OpenClaw 設定エージェント ID を渡さないでください。
    それ以外の場合は、デフォルトのサブエージェントランタイムを使用してください。OpenClaw エージェントが
    `runtime.type="acp"` で設定されている場合、OpenClaw は
    `runtime.acp.agent` を基盤ハーネス ID として使用します。

  </Accordion>
</AccordionGroup>

## ACP とサブエージェント

外部ハーネスランタイムが必要な場合は ACP を使用します。`codex`
plugin が有効な場合、Codex 会話のバインド/制御には **ネイティブ Codex
アプリサーバー**を使用します。OpenClaw ネイティブの
委任実行が必要な場合は **サブエージェント**を使用します。

| 領域          | ACP セッション                           | サブエージェント実行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| ランタイム       | ACP バックエンド plugin (例: acpx) | OpenClaw ネイティブサブエージェントランタイム  |
| セッションキー   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主なコマンド | `/acp ...`                            | `/subagents ...`                   |
| 生成ツール    | `runtime:"acp"` 付きの `sessions_spawn` | `sessions_spawn` (デフォルトランタイム) |

[サブエージェント](/ja-JP/tools/subagents) も参照してください。

## ACP が Claude Code を実行する仕組み

ACP 経由の Claude Code では、スタックは次のとおりです。

1. OpenClaw ACP セッション制御プレーン。
2. 公式 `@openclaw/acpx` ランタイム plugin。
3. Claude ACP アダプター。
4. Claude 側のランタイム/セッション機構。

ACP Claude は ACP 制御、セッション再開、
バックグラウンドタスク追跡、省略可能な会話/スレッドバインドを備えた **ハーネスセッション**です。

CLI バックエンドは、テキストのみのローカルフォールバックランタイムとして分離されています —
[CLI バックエンド](/ja-JP/gateway/cli-backends) を参照してください。

オペレーターにとっての実用的なルールは次のとおりです。

- **`/acp spawn`、バインド可能なセッション、ランタイム制御、または永続的なハーネス作業が必要ですか?** ACP を使用します。
- **生の CLI 経由の単純なローカルテキストフォールバックが必要ですか?** CLI バックエンドを使用します。

## バインド済みセッション

### メンタルモデル

- **チャットサーフェス** — 人が会話を続ける場所 (Discord チャンネル、Telegram トピック、iMessage チャット)。
- **ACP セッション** — OpenClaw がルーティングする永続的な Codex/Claude/Gemini ランタイム状態。
- **子スレッド/トピック** — `--thread ...` によってのみ作成される任意の追加メッセージングサーフェス。
- **ランタイムワークスペース** — ハーネスが実行されるファイルシステム上の場所 (`cwd`、リポジトリチェックアウト、バックエンドワークスペース)。チャットサーフェスとは独立しています。

### 現在の会話へのバインド

`/acp spawn <harness> --bind here` は現在の会話を
生成された ACP セッションに固定します — 子スレッドはなく、同じチャットサーフェスです。OpenClaw は
トランスポート、認証、安全性、配信を引き続き所有します。その
会話内のフォローアップメッセージは同じセッションへルーティングされます。`/new` と `/reset` は
セッションをその場でリセットします。`/acp close` はバインディングを削除します。

例:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="バインディングルールと排他性">
    - `--bind here` と `--thread ...` は相互に排他的です。
    - `--bind here` は、現在の会話バインディングを公開しているチャンネルでのみ動作します。それ以外の場合、OpenClaw は明確な未サポートメッセージを返します。バインディングは gateway 再起動後も保持されます。
    - Discord では、`spawnSessions` は `--thread auto|here` の子スレッド作成を制御します — `--bind here` ではありません。
    - `--cwd` なしで別の ACP エージェントへ生成する場合、OpenClaw はデフォルトで **ターゲットエージェントの** ワークスペースを継承します。継承されたパスが存在しない場合 (`ENOENT`/`ENOTDIR`) はバックエンドのデフォルトにフォールバックします。その他のアクセスエラー (例: `EACCES`) は生成エラーとして表示されます。
    - Gateway 管理コマンドはバインド済み会話内でもローカルにとどまります — 通常のフォローアップテキストがバインド済み ACP セッションへルーティングされる場合でも、`/acp ...` コマンドは OpenClaw によって処理されます。`/status` と `/unfocus` も、そのサーフェスでコマンド処理が有効な場合は常にローカルにとどまります。

  </Accordion>
  <Accordion title="スレッドバインド済みセッション">
    チャンネルアダプターでスレッドバインディングが有効な場合:

    - OpenClaw はスレッドをターゲット ACP セッションにバインドします。
    - そのスレッド内のフォローアップメッセージはバインド済み ACP セッションへルーティングされます。
    - ACP 出力は同じスレッドへ返されます。
    - フォーカス解除/クローズ/アーカイブ/アイドルタイムアウトまたは最大経過時間による期限切れで、バインディングが削除されます。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status`、`/unfocus` は Gateway コマンドであり、ACP ハーネスへのプロンプトではありません。

    スレッドバインド ACP に必要な機能フラグ:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` はデフォルトでオンです (`false` に設定すると自動 ACP スレッドディスパッチを一時停止します。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き動作します)。
    - チャンネルアダプターのスレッドセッション生成が有効 (デフォルト: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    スレッドバインディングのサポートはアダプター固有です。アクティブなチャンネル
    アダプターがスレッドバインディングをサポートしていない場合、OpenClaw は明確な
    未サポート/利用不可メッセージを返します。

  </Accordion>
  <Accordion title="スレッドをサポートするチャンネル">
    - セッション/スレッドバインディング機能を公開する任意のチャンネルアダプター。
    - 現在の組み込みサポート: **Discord** スレッド/チャンネル、**Telegram** トピック (グループ/スーパーグループ内のフォーラムトピックおよび DM トピック)。
    - Plugin チャンネルは同じバインディングインターフェイスを通じてサポートを追加できます。

  </Accordion>
</AccordionGroup>

## 永続的なチャンネルバインディング

非一時的なワークフローでは、トップレベルの
`bindings[]` エントリに永続的な ACP バインディングを設定します。

### バインディングモデル

<ParamField path="bindings[].type" type='"acp"'>
  永続的な ACP 会話バインディングとしてマークします。
</ParamField>
<ParamField path="bindings[].match" type="object">
  ターゲット会話を識別します。チャンネルごとの形状:

- **Discord チャンネル/スレッド:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram フォーラムトピック:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/グループ:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。安定したグループバインディングには `chat_id:*` または `chat_identifier:*` を優先してください。
- **iMessage DM/グループ:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。安定したグループバインディングには `chat_id:*` を優先してください。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  所有元の OpenClaw エージェント ID。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  省略可能な ACP オーバーライド。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  オペレーター向けの省略可能なラベル。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  省略可能なランタイム作業ディレクトリ。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  省略可能なバックエンドオーバーライド。
</ParamField>

### エージェントごとのランタイムデフォルト

`agents.list[].runtime` を使用して、エージェントごとに ACP デフォルトを一度だけ定義します。

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ハーネス ID、例: `codex` または `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP バインド済みセッションのオーバーライド優先順位:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. グローバル ACP デフォルト (例: `acp.backend`)

### 例

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

### 動作

- OpenClaw は、設定された ACP セッションが使用前に存在することを保証します。
- そのチャンネルまたはトピック内のメッセージは、設定された ACP セッションへルーティングされます。
- バインド済み会話では、`/new` と `/reset` は同じ ACP セッションキーをその場でリセットします。
- 一時的なランタイムバインディング (たとえばスレッドフォーカスフローによって作成されたもの) は、存在する場所で引き続き適用されます。
- 明示的な `cwd` なしでクロスエージェント ACP 生成を行う場合、OpenClaw はエージェント設定からターゲットエージェントワークスペースを継承します。
- 継承されたワークスペースパスが存在しない場合はバックエンドのデフォルト cwd にフォールバックします。存在するがアクセスに失敗した場合は生成エラーとして表示されます。

## ACP セッションを開始する

ACP セッションを開始する方法は 2 つあります。

<Tabs>
  <Tab title="sessions_spawn から">
    エージェントターンまたはツール呼び出しから ACP セッションを開始するには、
    `runtime: "acp"` を使用します。

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` のデフォルトは `subagent` なので、ACP セッションでは明示的に
    `runtime: "acp"` を設定します。`agentId` が省略された場合、設定されていれば OpenClaw は
    `acp.defaultAgent` を使用します。永続的にバインドされた会話を維持するには、`mode: "session"` で
    `thread: true` が必要です。
    </Note>

  </Tab>
  <Tab title="From /acp command">
    チャットから明示的にオペレーター制御するには `/acp spawn` を使用します。

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    主要なフラグ:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    [スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

  </Tab>
</Tabs>

### `sessions_spawn` パラメーター

<ParamField path="task" type="string" required>
  ACP セッションに送信される初期プロンプト。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP セッションでは `"acp"` である必要があります。
</ParamField>
<ParamField path="agentId" type="string">
  ACP ターゲットハーネス ID。設定されていれば `acp.defaultAgent` にフォールバックします。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  サポートされている場合、スレッドバインディングフローを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` は一回限り、`"session"` は永続です。`thread: true` で
  `mode` が省略された場合、OpenClaw はランタイムパスごとに永続的な動作をデフォルトにすることがあります。
  `mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cwd" type="string">
  要求されるランタイム作業ディレクトリ（バックエンド/ランタイムポリシーによって検証されます）。省略された場合、ACP spawn は設定されていればターゲットエージェントのワークスペースを継承します。継承されたパスが存在しない場合はバックエンドのデフォルトにフォールバックし、実際のアクセスエラーは返されます。
</ParamField>
<ParamField path="label" type="string">
  セッション/バナーテキストで使用されるオペレーター向けラベル。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  新しいセッションを作成する代わりに、既存の ACP セッションを再開します。エージェントは
  `session/load` を通じて会話履歴を再生します。
  `runtime: "acp"` が必要です。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` は、初期 ACP 実行の進行状況サマリーをシステムイベントとして要求元セッションへストリームします。受け入れられたレスポンスには、完全なリレー履歴を tail できるセッションスコープの JSONL ログ
  (`<sessionId>.acp-stream.jsonl`) を指す `streamLogPath` が含まれます。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  N 秒後に ACP 子ターンを中止します。`0` はターンを
  Gateway のタイムアウトなしパスに保持します。同じ値が Gateway
  実行と ACP ランタイムに適用されるため、停止した、またはクォータを使い切ったハーネスが親エージェントのレーンを無期限に占有することはありません。
</ParamField>
<ParamField path="model" type="string">
  ACP 子セッションの明示的なモデル上書き。Codex ACP spawn は
  `openai-codex/gpt-5.4` などの OpenClaw Codex 参照を、`session/new` の前に Codex
  ACP 起動設定へ正規化します。`openai-codex/gpt-5.4/high` のようなスラッシュ形式では、Codex ACP の推論 effort も設定されます。
  他のハーネスは ACP `models` を公開し、
  `session/set_model` をサポートする必要があります。そうでない場合、OpenClaw/acpx はターゲットエージェントのデフォルトへ黙ってフォールバックせず、明確に失敗します。
</ParamField>
<ParamField path="thinking" type="string">
  明示的な思考/推論 effort。Codex ACP では、`minimal` は低 effort にマップされ、
  `low`/`medium`/`high`/`xhigh` は直接マップされ、`off`
  は推論 effort の起動時上書きを省略します。
</ParamField>

## Spawn のバインドモードとスレッドモード

<Tabs>
  <Tab title="--bind here|off">
    | モード | 動作                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 現在のアクティブな会話をその場でバインドします。アクティブなものがなければ失敗します。 |
    | `off`  | 現在の会話バインディングを作成しません。                          |

    注:

    - `--bind here` は、「このチャンネルまたはチャットを Codex バックにする」ための最も単純なオペレーターパスです。
    - `--bind here` は子スレッドを作成しません。
    - `--bind here` は、現在の会話バインディングサポートを公開するチャンネルでのみ使用できます。
    - `--bind` と `--thread` は、同じ `/acp spawn` 呼び出しで組み合わせることはできません。

  </Tab>
  <Tab title="--thread auto|here|off">
    | モード | 動作                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | アクティブなスレッド内では、そのスレッドをバインドします。スレッド外では、サポートされていれば子スレッドを作成/バインドします。 |
    | `here` | 現在のアクティブなスレッドを必須にします。スレッド内でない場合は失敗します。                                                  |
    | `off`  | バインディングなし。セッションは未バインドで開始されます。                                                                 |

    注:

    - スレッドバインディングではないサーフェスでは、デフォルトの動作は実質的に `off` です。
    - スレッドバインド spawn には、チャンネルポリシーのサポートが必要です:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - 子スレッドを作成せずに現在の会話へ固定したい場合は、`--bind here` を使用します。

  </Tab>
</Tabs>

## 配信モデル

ACP セッションは、対話型ワークスペースにも、親所有のバックグラウンド作業にもできます。配信パスはその形態によって異なります。

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    対話型セッションは、可視のチャットサーフェスで会話を続けるためのものです:

    - `/acp spawn ... --bind here` は現在の会話を ACP セッションにバインドします。
    - `/acp spawn ... --thread ...` はチャンネルのスレッド/トピックを ACP セッションにバインドします。
    - 永続的に設定された `bindings[].type="acp"` は、一致する会話を同じ ACP セッションへルーティングします。

    バインドされた会話内の後続メッセージは ACP セッションへ直接ルーティングされ、ACP 出力は同じチャンネル/スレッド/トピックへ返されます。

    OpenClaw がハーネスに送信する内容:

    - 通常のバインド済みフォローアップは、プロンプトテキストとして送信されます。添付ファイルは、ハーネス/バックエンドがサポートする場合にのみ追加されます。
    - `/acp` 管理コマンドとローカル Gateway コマンドは、ACP ディスパッチ前にインターセプトされます。
    - ランタイム生成の完了イベントは、ターゲットごとに具現化されます。OpenClaw エージェントは OpenClaw の内部ランタイムコンテキストエンベロープを受け取り、外部 ACP ハーネスは子の結果と指示を含むプレーンなプロンプトを受け取ります。生の `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` エンベロープは、外部ハーネスに送信したり、ACP ユーザートランスクリプトテキストとして永続化したりしてはいけません。
    - ACP トランスクリプトエントリは、ユーザーに表示されるトリガーテキストまたはプレーンな完了プロンプトを使用します。内部イベントメタデータは、可能な限り OpenClaw 内で構造化されたまま保持され、ユーザー作成のチャット内容として扱われません。

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    別のエージェント実行によって spawn された一回限りの ACP セッションは、サブエージェントに似たバックグラウンド子です:

    - 親は `sessions_spawn({ runtime: "acp", mode: "run" })` で作業を依頼します。
    - 子は自身の ACP ハーネスセッション内で実行されます。
    - 子ターンはネイティブのサブエージェント spawn と同じバックグラウンドレーンで実行されるため、遅い ACP ハーネスが無関係なメインセッション作業をブロックしません。
    - 完了はタスク完了アナウンスパスを通じて報告されます。OpenClaw は内部完了メタデータをプレーンな ACP プロンプトに変換してから外部ハーネスへ送信するため、ハーネスが OpenClaw 専用のランタイムコンテキストマーカーを見ることはありません。
    - ユーザー向けの返信が有用な場合、親は子の結果を通常のアシスタントの声で書き直します。

    このパスを親と子のピアツーピアチャットとして扱わないでください。子にはすでに親へ戻る完了チャンネルがあります。

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` は spawn 後に別のセッションをターゲットにできます。通常のピアセッションでは、OpenClaw はメッセージ注入後にエージェント間（A2A）のフォローアップパスを使用します:

    - ターゲットセッションの返信を待ちます。
    - 必要に応じて、要求元とターゲットが制限された回数のフォローアップターンを交換できるようにします。
    - ターゲットにアナウンスメッセージの生成を依頼します。
    - そのアナウンスを可視のチャンネルまたはスレッドへ配信します。

    この A2A パスは、送信者が可視のフォローアップを必要とするピア送信のフォールバックです。たとえば広範な
    `tools.sessions.visibility` 設定の下で、無関係なセッションが ACP ターゲットを表示してメッセージできる場合にも有効なままです。

    OpenClaw が A2A フォローアップをスキップするのは、要求元が自身の親所有の一回限りの ACP 子の親である場合だけです。その場合、タスク完了の上に A2A を実行すると、子の結果で親が起動し、親の返信が子へ送り返され、親/子のエコーループが作成される可能性があります。完了パスがすでに結果を担当しているため、その所有子ケースでは `sessions_send` の結果が
    `delivery.status="skipped"` を報告します。

  </Accordion>
  <Accordion title="Resume an existing session">
    新しく開始する代わりに以前の ACP セッションを継続するには、`resumeSessionId` を使用します。エージェントは
    `session/load` を通じて会話履歴を再生するため、以前の内容を完全なコンテキストとして引き継ぎます。

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    一般的なユースケース:

    - Codex セッションをノート PC からスマートフォンへ引き渡す。エージェントに中断したところから続けるよう伝えます。
    - CLI で対話的に開始したコーディングセッションを、今度はエージェント経由でヘッドレスに継続する。
    - Gateway の再起動またはアイドルタイムアウトで中断された作業を引き継ぐ。

    注:

    - `resumeSessionId` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `streamTo` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `resumeSessionId` はホストローカルの ACP/ハーネス再開 ID であり、OpenClaw チャンネルセッションキーではありません。OpenClaw はディスパッチ前に ACP spawn ポリシーとターゲットエージェントポリシーを引き続き確認し、その上流 ID のロード認可は ACP バックエンドまたはハーネスが所有します。
    - `resumeSessionId` は上流 ACP 会話履歴を復元します。作成中の新しい OpenClaw セッションには `thread` と `mode` が通常どおり適用されるため、`mode: "session"` には引き続き `thread: true` が必要です。
    - ターゲットエージェントは `session/load` をサポートしている必要があります（Codex と Claude Code はサポートしています）。
    - セッション ID が見つからない場合、spawn は明確なエラーで失敗します。新しいセッションへの暗黙のフォールバックはありません。

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Gateway のデプロイ後は、単体テストを信頼するだけでなく、ライブのエンドツーエンドチェックを実行します:

    1. ターゲットホストでデプロイ済み Gateway のバージョンとコミットを確認します。
    2. ライブエージェントへの一時的な ACPX ブリッジセッションを開きます。
    3. そのエージェントに、`runtime: "acp"`、`agentId: "codex"`、`mode: "run"`、タスク `Reply with exactly LIVE-ACP-SPAWN-OK` で `sessions_spawn` を呼び出すよう依頼します。
    4. `accepted=yes`、実際の `childSessionKey`、バリデーターエラーがないことを確認します。
    5. 一時的なブリッジセッションをクリーンアップします。

    ゲートは `mode: "run"` のままにし、`streamTo: "parent"` はスキップします。
    スレッドバインドの `mode: "session"` とストリームリレーパスは、別個のより豊富な統合パスです。

  </Accordion>
</AccordionGroup>

## サンドボックス互換性

ACP セッションは現在、OpenClaw サンドボックス内ではなく、ホストランタイム上で実行されます。

<Warning>
**セキュリティ境界:**

- 外部ハーネスは、それ自体の CLI 権限と選択された `cwd` に従って読み書きできます。
- OpenClaw のサンドボックスポリシーは、ACP ハーネスの実行を**ラップしません**。
- OpenClaw は引き続き、ACP 機能ゲート、許可されたエージェント、セッション所有権、チャネルバインディング、Gateway 配信ポリシーを適用します。
- サンドボックスが適用される OpenClaw ネイティブの作業には `runtime: "subagent"` を使用してください。

</Warning>

現在の制限:

- リクエスト元セッションがサンドボックス化されている場合、`sessions_spawn({ runtime: "acp" })` と `/acp spawn` のどちらでも ACP スポーンはブロックされます。
- `runtime: "acp"` を指定した `sessions_spawn` は `sandbox: "require"` をサポートしていません。

## セッションターゲットの解決

ほとんどの `/acp` アクションは、省略可能なセッションターゲット（`session-key`、
`session-id`、または `session-label`）を受け取ります。

**解決順序:**

1. 明示的なターゲット引数（または `/acp steer` の `--session`）
   - キーを試します
   - 次に UUID 形式のセッション ID を試します
   - 次にラベルを試します
2. 現在のスレッドバインディング（この会話/スレッドが ACP セッションにバインドされている場合）。
3. 現在のリクエスト元セッションへのフォールバック。

現在の会話のバインディングとスレッドバインディングは、どちらも
ステップ 2 に参加します。

ターゲットを解決できない場合、OpenClaw は明確なエラーを返します
（`Unable to resolve session target: ...`）。

## ACP コントロール

| コマンド             | 実行内容                                                  | 例                                                            |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP セッションを作成します。現在のバインドまたはスレッドバインドは任意です。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ターゲットセッションの実行中ターンをキャンセルします。    | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 実行中セッションにステア指示を送信します。                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | セッションを閉じ、スレッドターゲットのバインドを解除します。 | `/acp close`                                                  |
| `/acp status`        | バックエンド、モード、状態、ランタイムオプション、機能を表示します。 | `/acp status`                                                 |
| `/acp set-mode`      | ターゲットセッションのランタイムモードを設定します。      | `/acp set-mode plan`                                          |
| `/acp set`           | 汎用ランタイム設定オプションを書き込みます。              | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ランタイムの作業ディレクトリ上書きを設定します。          | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 承認ポリシープロファイルを設定します。                    | `/acp permissions strict`                                     |
| `/acp timeout`       | ランタイムタイムアウト（秒）を設定します。                | `/acp timeout 120`                                            |
| `/acp model`         | ランタイムモデルの上書きを設定します。                    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | セッションのランタイムオプション上書きを削除します。      | `/acp reset-options`                                          |
| `/acp sessions`      | ストアから最近の ACP セッションを一覧表示します。         | `/acp sessions`                                               |
| `/acp doctor`        | バックエンドの健全性、機能、実行可能な修正を表示します。  | `/acp doctor`                                                 |
| `/acp install`       | 決定的なインストール手順と有効化手順を出力します。        | `/acp install`                                                |

`/acp status` は、有効なランタイムオプションに加えて、ランタイムレベルと
バックエンドレベルのセッション識別子を表示します。バックエンドに機能がない場合、未対応コントロールのエラーは
明確に表示されます。`/acp sessions` は、現在バインドされているセッションまたはリクエスト元セッションの
ストアを読み取ります。ターゲットトークン
（`session-key`、`session-id`、または `session-label`）は、
エージェントごとのカスタム `session.store`
ルートを含む Gateway セッション探索を通じて解決されます。

### ランタイムオプションのマッピング

`/acp` には便利なコマンドと汎用セッターがあります。同等の
操作:

| コマンド                     | マッピング先                         | 注記                                                                                                                                                                           |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | ランタイム設定キー `model`           | Codex ACP では、OpenClaw は `openai-codex/<model>` をアダプターモデル ID に正規化し、`openai-codex/gpt-5.4/high` のようなスラッシュ付き reasoning サフィックスを `reasoning_effort` にマッピングします。 |
| `/acp set thinking <level>`  | ランタイム設定キー `thinking`        | Codex ACP では、アダプターが対応している場合、OpenClaw は対応する `reasoning_effort` を送信します。                                                                            |
| `/acp permissions <profile>` | ランタイム設定キー `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | ランタイム設定キー `timeout`         | —                                                                                                                                                                              |
| `/acp cwd <path>`            | ランタイム cwd 上書き                | 直接更新。                                                                                                                                                                     |
| `/acp set <key> <value>`     | 汎用                                 | `key=cwd` は cwd 上書きパスを使用します。                                                                                                                                      |
| `/acp reset-options`         | すべてのランタイム上書きをクリアします | —                                                                                                                                                                              |

## acpx ハーネス、Plugin セットアップ、権限

acpx ハーネス設定（Claude Code / Codex / Gemini CLI
エイリアス）、plugin-tools および OpenClaw-tools MCP ブリッジ、ACP
権限モードについては、
[ACP エージェント — セットアップ](/ja-JP/tools/acp-agents-setup) を参照してください。

## トラブルシューティング

| 症状                                                                        | 考えられる原因                                                                                                         | 修正                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | バックエンド Plugin が見つからない、無効化されている、または `plugins.allow` によってブロックされている。              | バックエンド Plugin をインストールして有効化し、その許可リストが設定されている場合は `plugins.allow` に `acpx` を含めてから、`/acp doctor` を実行する。                  |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP がグローバルに無効化されている。                                                                                   | `acp.enabled=true` を設定する。                                                                                                                                          |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 通常のスレッドメッセージからの自動ディスパッチが無効化されている。                                                     | 自動スレッドルーティングを再開するには `acp.dispatch.enabled=true` を設定する。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き動作する。                |
| `ACP agent "<id>" is not allowed by policy`                                 | エージェントが許可リストに含まれていない。                                                                             | 許可されている `agentId` を使用するか、`acp.allowedAgents` を更新する。                                                                                                   |
| `/acp doctor` が起動直後にバックエンド未準備を報告する                     | バックエンド Plugin が見つからない、無効化されている、許可/拒否ポリシーでブロックされている、または設定された実行ファイルが利用できない。 | バックエンド Plugin をインストール/有効化し、`/acp doctor` を再実行する。正常にならない場合は、バックエンドのインストールまたはポリシーエラーを確認する。               |
| ハーネスコマンドが見つからない                                             | アダプター CLI がインストールされていない、外部 Plugin が見つからない、または Codex 以外のアダプターで初回の `npx` 取得に失敗した。 | `/acp doctor` を実行し、Gateway ホストでアダプターをインストール/事前ウォームするか、acpx エージェントコマンドを明示的に設定する。                                      |
| ハーネスからモデル未検出エラーが返される                                   | モデル ID は別のプロバイダー/ハーネスでは有効だが、この ACP ターゲットでは有効ではない。                              | そのハーネスが一覧表示するモデルを使用する、ハーネスでモデルを設定する、またはオーバーライドを省略する。                                                                |
| ハーネスからベンダー認証エラーが返される                                   | OpenClaw は正常だが、ターゲット CLI/プロバイダーにログインしていない。                                                 | Gateway ホスト環境でログインするか、必要なプロバイダーキーを提供する。                                                                                                  |
| `Unable to resolve session target: ...`                                     | キー/ID/ラベルトークンが誤っている。                                                                                  | `/acp sessions` を実行し、正確なキー/ラベルをコピーして再試行する。                                                                                                      |
| `--bind here requires running /acp spawn inside an active ... conversation` | アクティブでバインド可能な会話なしで `--bind here` が使用された。                                                      | ターゲットのチャット/チャンネルに移動して再試行するか、未バインドの spawn を使用する。                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | アダプターが現在の会話の ACP バインド機能を持っていない。                                                             | サポートされている場合は `/acp spawn ... --thread ...` を使用する、トップレベルの `bindings[]` を設定する、またはサポートされているチャンネルに移動する。                |
| `--thread here requires running /acp spawn inside an active ... thread`     | スレッドコンテキスト外で `--thread here` が使用された。                                                                | ターゲットスレッドに移動するか、`--thread auto`/`off` を使用する。                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 別のユーザーがアクティブなバインド先を所有している。                                                                   | 所有者として再バインドするか、別の会話またはスレッドを使用する。                                                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | アダプターがスレッドバインド機能を持っていない。                                                                       | `--thread off` を使用するか、サポートされているアダプター/チャンネルに移動する。                                                                                        |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP ランタイムはホスト側であり、リクエスターセッションはサンドボックス化されている。                                  | サンドボックス化されたセッションからは `runtime="subagent"` を使用するか、サンドボックス化されていないセッションから ACP spawn を実行する。                             |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP ランタイムに対して `sandbox="require"` が要求された。                                                              | サンドボックス化が必須の場合は `runtime="subagent"` を使用するか、サンドボックス化されていないセッションから `sandbox="inherit"` で ACP を使用する。                     |
| `Cannot apply --model ... did not advertise model support`                  | ターゲットハーネスが汎用 ACP モデル切り替えを公開していない。                                                         | ACP `models`/`session/set_model` を公開するハーネスを使用する、Codex ACP モデル参照を使用する、または独自の起動フラグがある場合はハーネス内で直接モデルを設定する。     |
| バインドされたセッションの ACP メタデータがない                             | ACP セッションメタデータが古い、または削除されている。                                                                | `/acp spawn` で再作成してから、スレッドを再バインド/フォーカスする。                                                                                                     |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` が非対話型 ACP セッションでの書き込み/実行をブロックしている。                                       | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定し、gateway を再起動する。[権限設定](/ja-JP/tools/acp-agents-setup#permission-configuration)を参照。       |
| ACP セッションがほとんど出力せず早期に失敗する                              | 権限プロンプトが `permissionMode`/`nonInteractivePermissions` によってブロックされている。                            | gateway ログで `AcpRuntimeError` を確認する。完全な権限には `permissionMode=approve-all` を設定し、穏やかな劣化には `nonInteractivePermissions=deny` を設定する。       |
| ACP セッションが作業完了後に無期限に停止する                                | ハーネスプロセスは終了したが、ACP セッションが完了を報告しなかった。                                                  | `ps aux \| grep acpx` で監視し、古いプロセスを手動で kill する。                                                                                                        |
| ハーネスに `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` が見える                 | 内部イベントエンベロープが ACP 境界を越えて漏洩した。                                                                | OpenClaw を更新し、完了フローを再実行する。外部ハーネスはプレーンな完了プロンプトのみを受け取るべきである。                                                            |

## 関連

- [ACP エージェント — セットアップ](/ja-JP/tools/acp-agents-setup)
- [エージェント送信](/ja-JP/tools/agent-send)
- [CLI バックエンド](/ja-JP/gateway/cli-backends)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（ブリッジモード）](/ja-JP/cli/acp)
- [サブエージェント](/ja-JP/tools/subagents)
