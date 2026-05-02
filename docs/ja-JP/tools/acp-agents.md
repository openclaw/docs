---
read_when:
    - ACP 経由でコーディングハーネスを実行する
    - メッセージングチャネルで会話に紐づけられた ACP セッションを設定する
    - メッセージチャネルの会話を永続的な ACP セッションにバインドする
    - ACP バックエンド、Plugin 接続、または補完配信のトラブルシューティング
    - チャットから /acp コマンドを操作する
sidebarTitle: ACP agents
summary: 外部コーディングハーネス（Claude Code、Cursor、Gemini CLI、明示的な Codex ACP、OpenClaw ACP、OpenCode）を ACP バックエンド経由で実行する
title: ACP エージェント
x-i18n:
    generated_at: "2026-05-02T05:06:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e5fdd4df58c6e15182ae068cb77f5b257e954e5e546014464f273c504463553
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) セッションにより、OpenClaw は ACP バックエンド Plugin を通じて外部コーディングハーネス（たとえば Pi、Claude Code、Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI、およびその他のサポート対象 ACPX ハーネス）を実行できます。

各 ACP セッションの生成は [バックグラウンドタスク](/ja-JP/automation/tasks) として追跡されます。

<Note>
**ACP は外部ハーネス用の経路であり、デフォルトの Codex 経路ではありません。** ネイティブ Codex アプリサーバー Plugin は `/codex ...` コントロールと `agentRuntime.id: "codex"` 埋め込みランタイムを所有し、ACP は `/acp ...` コントロールと `sessions_spawn({ runtime: "acp" })` セッションを所有します。

Codex または Claude Code を外部 MCP クライアントとして既存の OpenClaw チャンネル会話に直接接続したい場合は、ACP ではなく [`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。
</Note>

## どのページを見ればよいですか？

| やりたいこと                                                                                    | 使用するもの                              | 注記                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 現在の会話で Codex をバインドまたは制御する                                               | `/codex bind`, `/codex threads`       | `codex` Plugin が有効な場合のネイティブ Codex アプリサーバー経路です。バインドされたチャット返信、画像転送、モデル/高速/権限、停止、誘導コントロールを含みます。ACP は明示的なフォールバックです |
| Claude Code、Gemini CLI、明示的な Codex ACP、または別の外部ハーネスを OpenClaw _経由で_ 実行する | このページ                             | チャットにバインドされたセッション、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、バックグラウンドタスク、ランタイムコントロール                                                                                   |
| エディターまたはクライアント向けに OpenClaw Gateway セッションを ACP サーバー _として_ 公開する                   | [`openclaw acp`](/ja-JP/cli/acp)            | ブリッジモード。IDE/クライアントは stdio/WebSocket 経由で OpenClaw に ACP で通信します                                                                                                                            |
| ローカル AI CLI をテキスト専用のフォールバックモデルとして再利用する                                              | [CLI バックエンド](/ja-JP/gateway/cli-backends) | ACP ではありません。OpenClaw ツール、ACP コントロール、ハーネスランタイムはありません                                                                                                                               |

## これは最初から動作しますか？

通常は動作します。新規インストールでは、バンドルされた `acpx` ランタイム Plugin がデフォルトで有効になっており、Plugin ローカルに固定された `acpx` バイナリが含まれます。OpenClaw は Gateway HTTP リスナーが稼働した直後にそれをプローブし、自己修復します。準備状態の確認には `/acp doctor` を実行してください。

OpenClaw は ACP が**本当に使用可能**な場合にのみ、エージェントに ACP 生成について知らせます。ACP が有効で、ディスパッチが無効化されておらず、現在のセッションがサンドボックスでブロックされておらず、ランタイムバックエンドがロードされている必要があります。これらの条件が満たされない場合、ACP Plugin Skills と `sessions_spawn` の ACP ガイダンスは非表示のままになり、エージェントが利用できないバックエンドを提案しないようにします。

<AccordionGroup>
  <Accordion title="初回実行時の注意点">
    - `plugins.allow` が設定されている場合、それは制限的な Plugin インベントリであり、**必ず** `acpx` を含める必要があります。含まれていない場合、バンドルされたデフォルトは意図的にブロックされ、`/acp doctor` は allowlist エントリの欠落を報告します。
    - バンドルされた Codex ACP アダプターは `acpx` Plugin とともにステージングされ、可能な場合はローカルで起動されます。
    - その他のターゲットハーネスアダプターは、初回使用時に `npx` でオンデマンド取得される場合があります。
    - そのハーネスのベンダー認証は、引き続きホスト上に存在している必要があります。
    - ホストに npm またはネットワークアクセスがない場合、キャッシュを事前に温めるか、別の方法でアダプターをインストールするまで、初回実行時のアダプター取得は失敗します。

  </Accordion>
  <Accordion title="ランタイム前提条件">
    ACP は実際の外部ハーネスプロセスを起動します。OpenClaw はルーティング、バックグラウンドタスク状態、配信、バインディング、ポリシーを所有します。ハーネスはプロバイダーログイン、モデルカタログ、ファイルシステム動作、ネイティブツールを所有します。

    OpenClaw の問題と判断する前に、次を確認してください。

    - `/acp doctor` が有効で正常なバックエンドを報告している。
    - allowlist が設定されている場合、ターゲット ID が `acp.allowedAgents` で許可されている。
    - ハーネスコマンドを Gateway ホスト上で開始できる。
    - そのハーネスのプロバイダー認証が存在する（`claude`、`codex`、`gemini`、`opencode`、`droid` など）。
    - 選択したモデルがそのハーネスに存在する。モデル ID はハーネス間で移植できません。
    - 要求された `cwd` が存在し、アクセス可能である。または `cwd` を省略し、バックエンドにデフォルトを使用させる。
    - 権限モードが作業に合っている。非対話型セッションではネイティブの権限プロンプトをクリックできないため、書き込み/実行が多いコーディング実行では通常、ヘッドレスで進行できる ACPX 権限プロファイルが必要です。

  </Accordion>
</AccordionGroup>

OpenClaw Plugin ツールと組み込みの OpenClaw ツールは、デフォルトでは ACP ハーネスに公開されません。ハーネスがこれらのツールを直接呼び出す必要がある場合にのみ、[ACP エージェント — セットアップ](/ja-JP/tools/acp-agents-setup) の明示的な MCP ブリッジを有効にしてください。

## サポート対象ハーネスターゲット

バンドルされた `acpx` バックエンドでは、これらのハーネス ID を `/acp spawn <id>` または `sessions_spawn({ runtime: "acp", agentId: "<id>" })` ターゲットとして使用します。

| ハーネス ID | 一般的なバックエンド                                | 注記                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP アダプター                        | ホスト上の Claude Code 認証が必要です。                                              |
| `codex`    | Codex ACP アダプター                              | ネイティブ `/codex` が利用できない場合、または ACP が要求された場合のみの明示的な ACP フォールバックです。 |
| `copilot`  | GitHub Copilot ACP アダプター                     | Copilot CLI/ランタイム認証が必要です。                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | ローカルインストールが異なる ACP エントリーポイントを公開している場合は、acpx コマンドを上書きします。    |
| `droid`    | Factory Droid CLI                              | Factory/Droid 認証、またはハーネス環境内の `FACTORY_API_KEY` が必要です。        |
| `gemini`   | Gemini CLI ACP アダプター                         | Gemini CLI 認証または API キー設定が必要です。                                          |
| `iflow`    | iFlow CLI                                      | アダプターの可用性とモデル制御は、インストールされている CLI に依存します。                 |
| `kilocode` | Kilo Code CLI                                  | アダプターの可用性とモデル制御は、インストールされている CLI に依存します。                 |
| `kimi`     | Kimi/Moonshot CLI                              | ホスト上の Kimi/Moonshot 認証が必要です。                                            |
| `kiro`     | Kiro CLI                                       | アダプターの可用性とモデル制御は、インストールされている CLI に依存します。                 |
| `opencode` | OpenCode ACP アダプター                           | OpenCode CLI/プロバイダー認証が必要です。                                                |
| `openclaw` | `openclaw acp` 経由の OpenClaw Gateway ブリッジ | ACP 対応ハーネスが OpenClaw Gateway セッションへ戻って通信できるようにします。                 |
| `pi`       | Pi/埋め込み OpenClaw ランタイム                   | OpenClaw ネイティブハーネスの実験に使用されます。                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | ホスト上の Qwen 互換認証が必要です。                                          |

カスタム acpx エージェントエイリアスは acpx 自体で設定できますが、OpenClaw ポリシーはディスパッチ前に引き続き `acp.allowedAgents` と `agents.list[].runtime.acp.agent` マッピングを確認します。

## オペレーター実行手順

チャットからのクイック `/acp` フロー:

<Steps>
  <Step title="生成">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`、または明示的な
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="作業">
    バインドされた会話またはスレッドで続行します（またはセッションキーを明示的に指定します）。
  </Step>
  <Step title="状態確認">
    `/acp status`
  </Step>
  <Step title="調整">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`。
  </Step>
  <Step title="誘導">
    コンテキストを置き換えずに: `/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（現在のターン）または `/acp close`（セッション + バインディング）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="ライフサイクルの詳細">
    - 生成は ACP ランタイムセッションを作成または再開し、OpenClaw セッションストアに ACP メタデータを記録します。また、実行が親所有の場合はバックグラウンドタスクを作成する場合があります。
    - 親所有の ACP セッションは、ランタイムセッションが永続的な場合でもバックグラウンド作業として扱われます。完了とサーフェス間配信は、通常のユーザー向けチャットセッションのように動作するのではなく、親タスク通知機構を通じて行われます。
    - タスクメンテナンスは、終了済みまたは孤立した親所有のワンショット ACP セッションを閉じます。永続 ACP セッションは、アクティブな会話バインディングが残っている間は保持されます。アクティブなバインディングのない古い永続セッションは、所有タスクが完了した後、またはそのタスクレコードがなくなった後に黙って再開されないように閉じられます。
    - バインドされたフォローアップメッセージは、バインディングが閉じられる、フォーカス解除される、リセットされる、または期限切れになるまで、ACP セッションへ直接送信されます。
    - Gateway コマンドはローカルに留まります。`/acp ...`、`/status`、`/unfocus` が通常のプロンプトテキストとしてバインドされた ACP ハーネスに送信されることはありません。
    - `cancel` はバックエンドがキャンセルをサポートしている場合、アクティブなターンを中止します。バインディングやセッションメタデータは削除しません。
    - `close` は OpenClaw の観点から ACP セッションを終了し、バインディングを削除します。ハーネスが再開をサポートしている場合、独自の上流履歴を保持する場合があります。
    - アイドル状態のランタイムワーカーは `acp.runtime.ttlMinutes` 後にクリーンアップ対象になります。保存されたセッションメタデータは `/acp sessions` で引き続き利用できます。

  </Accordion>
  <Accordion title="ネイティブ Codex ルーティング規則">
    有効な場合に**ネイティブ Codex Plugin** へルーティングされるべき自然言語トリガー:

    - 「この Discord チャンネルを Codex にバインドして。」
    - 「このチャットを Codex スレッド `<id>` にアタッチして。」
    - 「Codex スレッドを表示してから、これをバインドして。」

    ネイティブ Codex 会話バインディングは、デフォルトのチャット制御経路です。OpenClaw 動的ツールは引き続き OpenClaw を通じて実行され、shell/apply-patch などの Codex ネイティブツールは Codex 内で実行されます。Codex ネイティブツールイベントについては、OpenClaw がターンごとのネイティブフックリレーを注入し、Plugin フックが `before_tool_call` をブロックし、`after_tool_call` を観察し、Codex `PermissionRequest` イベントを OpenClaw 承認にルーティングできるようにします。Codex `Stop` フックは OpenClaw `before_agent_finalize` にリレーされ、そこで Plugin は Codex が回答を確定する前に、もう 1 回モデルパスを要求できます。このリレーは意図的に保守的なままです。Codex ネイティブツール引数を変更したり、Codex スレッドレコードを書き換えたりしません。ACP ランタイム/セッションモデルが必要な場合にのみ、明示的な ACP を使用してください。埋め込み Codex サポート境界は [Codex ハーネス v1 サポート契約](/ja-JP/plugins/codex-harness#v1-support-contract) に文書化されています。

  </Accordion>
  <Accordion title="モデル / プロバイダー / ランタイム選択チートシート">
    - `openai-codex/*` — PI Codex OAuth/サブスクリプションルート。
    - `openai/*` と `agentRuntime.id: "codex"` — ネイティブ Codex app-server 組み込みランタイム。
    - `/codex ...` — ネイティブ Codex 会話制御。
    - `/acp ...` または `runtime: "acp"` — 明示的な ACP/acpx 制御。

  </Accordion>
  <Accordion title="ACP ルーティングの自然言語トリガー">
    ACP ランタイムへルーティングするべきトリガー:

    - 「これをワンショットの Claude Code ACP セッションとして実行し、結果を要約してください。」
    - 「このタスクには Gemini CLI をスレッド内で使用し、その後のフォローアップも同じスレッドに維持してください。」
    - 「バックグラウンドスレッドで ACP 経由の Codex を実行してください。」

    OpenClaw は `runtime: "acp"` を選択し、ハーネスの `agentId` を解決し、
    サポートされている場合は現在の会話またはスレッドにバインドし、
    クローズまたは期限切れまでフォローアップをそのセッションへルーティングします。Codex は、
    ACP/acpx が明示されている場合、またはリクエストされた操作でネイティブ Codex
    plugin が利用できない場合にのみ、この経路に従います。

    `sessions_spawn` では、ACP が有効で、リクエスターがサンドボックス化されておらず、
    ACP ランタイムバックエンドがロードされている場合にのみ、`runtime: "acp"` が公開されます。
    `acp.dispatch.enabled=false` は自動 ACP スレッドディスパッチを一時停止しますが、
    明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しを非表示にしたりブロックしたりはしません。
    これは `codex`、`claude`、`droid`、`gemini`、`opencode` などの ACP ハーネス id を対象にします。
    そのエントリが `agents.list[].runtime.type="acp"` で明示的に設定されていない限り、
    `agents_list` の通常の OpenClaw 設定 agent id を渡さないでください。
    それ以外の場合は、デフォルトのサブエージェントランタイムを使用してください。OpenClaw agent が
    `runtime.type="acp"` で設定されている場合、OpenClaw は
    `runtime.acp.agent` を基盤となるハーネス id として使用します。

  </Accordion>
</AccordionGroup>

## ACP とサブエージェントの違い

外部ハーネスランタイムが必要な場合は ACP を使用します。`codex`
plugin が有効な場合に Codex の会話バインディング/制御を行うには、**ネイティブ Codex
app-server** を使用します。OpenClaw ネイティブの委任実行が必要な場合は、**サブエージェント** を使用します。

| 領域          | ACP セッション                         | サブエージェント実行               |
| ------------- | ------------------------------------- | ---------------------------------- |
| ランタイム       | ACP バックエンド plugin（例: acpx） | OpenClaw ネイティブのサブエージェントランタイム |
| セッションキー   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| メインコマンド | `/acp ...`                            | `/subagents ...`                   |
| 起動ツール    | `runtime:"acp"` を指定した `sessions_spawn` | `sessions_spawn`（デフォルトランタイム） |

[サブエージェント](/ja-JP/tools/subagents) も参照してください。

## ACP が Claude Code を実行する仕組み

ACP 経由の Claude Code では、スタックは次のとおりです。

1. OpenClaw ACP セッション制御プレーン。
2. バンドルされた `acpx` ランタイム plugin。
3. Claude ACP アダプター。
4. Claude 側のランタイム/セッション機構。

ACP Claude は、ACP 制御、セッション再開、
バックグラウンドタスク追跡、任意の会話/スレッドバインディングを備えた**ハーネスセッション**です。

CLI バックエンドは、別個のテキスト専用ローカルフォールバックランタイムです。
[CLI バックエンド](/ja-JP/gateway/cli-backends) を参照してください。

オペレーター向けの実用的なルールは次のとおりです。

- **`/acp spawn`、バインド可能なセッション、ランタイム制御、または永続的なハーネス作業が必要ですか?** ACP を使用します。
- **生の CLI 経由の単純なローカルテキストフォールバックが必要ですか?** CLI バックエンドを使用します。

## バインドされたセッション

### メンタルモデル

- **チャットサーフェス** — 人が会話を続ける場所（Discord チャンネル、Telegram トピック、iMessage チャット）。
- **ACP セッション** — OpenClaw がルーティングする、永続的な Codex/Claude/Gemini ランタイム状態。
- **子スレッド/トピック** — `--thread ...` によってのみ作成される、任意の追加メッセージングサーフェス。
- **ランタイムワークスペース** — ハーネスが実行されるファイルシステム上の場所（`cwd`、リポジトリチェックアウト、バックエンドワークスペース）。チャットサーフェスとは独立しています。

### 現在の会話へのバインド

`/acp spawn <harness> --bind here` は、現在の会話を
起動された ACP セッションへ固定します。子スレッドはなく、同じチャットサーフェスです。OpenClaw は
トランスポート、認証、安全性、配信を引き続き所有します。その会話内のフォローアップメッセージは
同じセッションへルーティングされます。`/new` と `/reset` は
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
    - `--bind here` は、現在の会話バインディングを公開しているチャンネルでのみ機能します。それ以外の場合、OpenClaw は明確な未サポートメッセージを返します。バインディングは Gateway の再起動後も保持されます。
    - Discord では、`spawnAcpSessions` は OpenClaw が `--thread auto|here` 用の子スレッドを作成する必要がある場合にのみ必要です。`--bind here` には不要です。
    - `--cwd` なしで別の ACP agent へ起動した場合、OpenClaw はデフォルトで**対象 agent の**ワークスペースを継承します。継承されたパスが存在しない場合（`ENOENT`/`ENOTDIR`）はバックエンドのデフォルトにフォールバックします。他のアクセスエラー（例: `EACCES`）は起動エラーとして表示されます。
    - Gateway 管理コマンドは、バインドされた会話内でもローカルに留まります。通常のフォローアップテキストがバインドされた ACP セッションへルーティングされる場合でも、`/acp ...` コマンドは OpenClaw によって処理されます。`/status` と `/unfocus` も、そのサーフェスでコマンド処理が有効な場合は常にローカルに留まります。

  </Accordion>
  <Accordion title="スレッドバインドセッション">
    チャンネルアダプターでスレッドバインディングが有効な場合:

    - OpenClaw はスレッドを対象 ACP セッションにバインドします。
    - そのスレッド内のフォローアップメッセージは、バインドされた ACP セッションへルーティングされます。
    - ACP 出力は同じスレッドへ返されます。
    - フォーカス解除/クローズ/アーカイブ/アイドルタイムアウト、または最大有効期間の期限切れにより、バインディングが削除されます。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status`、`/unfocus` は Gateway コマンドであり、ACP ハーネスへのプロンプトではありません。

    スレッドバインド ACP に必要な機能フラグ:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` はデフォルトでオンです（自動 ACP スレッドディスパッチを一時停止するには `false` を設定します。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き機能します）。
    - チャンネルアダプターの ACP スレッド起動フラグが有効（アダプター固有）:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    スレッドバインディングのサポートはアダプター固有です。アクティブなチャンネル
    アダプターがスレッドバインディングをサポートしていない場合、OpenClaw は明確な
    未サポート/利用不可メッセージを返します。

  </Accordion>
  <Accordion title="スレッドをサポートするチャンネル">
    - セッション/スレッドバインディング機能を公開する任意のチャンネルアダプター。
    - 現在の組み込みサポート: **Discord** スレッド/チャンネル、**Telegram** トピック（グループ/スーパーグループ内のフォーラムトピックおよび DM トピック）。
    - Plugin チャンネルは、同じバインディングインターフェイスを通じてサポートを追加できます。

  </Accordion>
</AccordionGroup>

## 永続的なチャンネルバインディング

一時的でないワークフローでは、トップレベルの `bindings[]` エントリで
永続的な ACP バインディングを設定します。

### バインディングモデル

<ParamField path="bindings[].type" type='"acp"'>
  永続的な ACP 会話バインディングを示します。
</ParamField>
<ParamField path="bindings[].match" type="object">
  対象会話を識別します。チャンネルごとの形状:

- **Discord チャンネル/スレッド:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram フォーラムトピック:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/グループ:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。安定したグループバインディングには `chat_id:*` または `chat_identifier:*` を推奨します。
- **iMessage DM/グループ:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。安定したグループバインディングには `chat_id:*` を推奨します。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  所有する OpenClaw agent id。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  任意の ACP オーバーライド。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  任意のオペレーター向けラベル。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  任意のランタイム作業ディレクトリ。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  任意のバックエンドオーバーライド。
</ParamField>

### agent ごとのランタイムデフォルト

agent ごとに ACP デフォルトを一度だけ定義するには、`agents.list[].runtime` を使用します。

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（ハーネス id、例: `codex` または `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP バインドセッションのオーバーライド優先順位:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. グローバル ACP デフォルト（例: `acp.backend`）

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
- バインドされた会話では、`/new` と `/reset` は同じ ACP セッションキーをその場でリセットします。
- 一時的なランタイムバインディング（たとえばスレッドフォーカスフローによって作成されたもの）は、存在する場所では引き続き適用されます。
- 明示的な `cwd` なしでクロス agent ACP 起動を行う場合、OpenClaw は agent 設定から対象 agent ワークスペースを継承します。
- 継承されたワークスペースパスが存在しない場合は、バックエンドのデフォルト cwd にフォールバックします。存在するがアクセスに失敗する場合は、起動エラーとして表示されます。

## ACP セッションを開始する

ACP セッションを開始する方法は 2 つあります。

<Tabs>
  <Tab title="sessions_spawn から">
    agent ターンまたはツール呼び出しから ACP セッションを開始するには、
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
    `runtime: "acp"` を設定してください。`agentId` を省略した場合、OpenClaw は
    設定されていれば `acp.defaultAgent` を使用します。`mode: "session"` では、
    永続的にバインドされた会話を維持するために `thread: true` が必要です。
    </Note>

  </Tab>
  <Tab title="From /acp command">
    チャットから明示的にオペレーター制御を行うには `/acp spawn` を使用します。

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

    [スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

  </Tab>
</Tabs>

### `sessions_spawn` パラメーター

<ParamField path="task" type="string" required>
  ACP セッションへ送信される初期プロンプト。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP セッションでは `"acp"` である必要があります。
</ParamField>
<ParamField path="agentId" type="string">
  ACP ターゲットハーネス ID。設定されている場合は `acp.defaultAgent` にフォールバックします。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  サポートされている場合にスレッドバインディングフローを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` はワンショット、`"session"` は永続的です。`thread: true` で
  `mode` を省略した場合、OpenClaw はランタイムパスに応じて永続的な動作を
  デフォルトにすることがあります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cwd" type="string">
  要求するランタイム作業ディレクトリ（バックエンド/ランタイムポリシーにより検証されます）。
  省略した場合、ACP spawn は設定されていればターゲットエージェントのワークスペースを
  継承します。継承されたパスが存在しない場合はバックエンドのデフォルトにフォールバックし、
  実際のアクセスエラーは返されます。
</ParamField>
<ParamField path="label" type="string">
  セッション/バナーテキストで使用される、オペレーター向けラベル。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  新規作成ではなく既存の ACP セッションを再開します。エージェントは
  `session/load` 経由で会話履歴を再生します。`runtime: "acp"` が必要です。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` は、初期 ACP 実行の進行状況サマリーをシステムイベントとして
  要求元セッションへストリームします。受け入れられた応答には、
  完全なリレー履歴を追跡できる、セッションスコープの JSONL ログ
  （`<sessionId>.acp-stream.jsonl`）を指す `streamLogPath` が含まれます。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  N 秒後に ACP 子ターンを中止します。`0` はそのターンを Gateway の
  タイムアウトなしパスに保持します。同じ値が Gateway 実行と ACP ランタイムに
  適用されるため、停止した、またはクォータを使い切ったハーネスが
  親エージェントレーンを無期限に占有しません。
</ParamField>
<ParamField path="model" type="string">
  ACP 子セッションの明示的なモデルオーバーライド。Codex ACP spawn は、
  `openai-codex/gpt-5.4` のような OpenClaw Codex 参照を、`session/new` の前に
  Codex ACP 起動設定へ正規化します。`openai-codex/gpt-5.4/high` のような
  スラッシュ形式では、Codex ACP の推論エフォートも設定されます。
  その他のハーネスは ACP `models` を公開し、`session/set_model` を
  サポートする必要があります。そうでない場合、OpenClaw/acpx はターゲットエージェントの
  デフォルトへ黙ってフォールバックせず、明確に失敗します。
</ParamField>
<ParamField path="thinking" type="string">
  明示的な thinking/推論エフォート。Codex ACP では、`minimal` は
  low effort に対応し、`low`/`medium`/`high`/`xhigh` は直接対応し、
  `off` は reasoning-effort 起動オーバーライドを省略します。
</ParamField>

## Spawn のバインドモードとスレッドモード

<Tabs>
  <Tab title="--bind here|off">
    | モード | 動作 |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 現在のアクティブな会話をその場でバインドします。アクティブな会話がない場合は失敗します。 |
    | `off`  | 現在の会話バインディングを作成しません。                          |

    注記:

    - `--bind here` は、「このチャンネルまたはチャットを Codex バックエンドにする」ための最も単純なオペレーターパスです。
    - `--bind here` は子スレッドを作成しません。
    - `--bind here` は、現在の会話バインディングサポートを公開しているチャンネルでのみ利用できます。
    - `--bind` と `--thread` は同じ `/acp spawn` 呼び出しで組み合わせることはできません。

  </Tab>
  <Tab title="--thread auto|here|off">
    | モード | 動作 |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | アクティブなスレッド内では、そのスレッドをバインドします。スレッド外では、サポートされている場合に子スレッドを作成/バインドします。 |
    | `here` | 現在のアクティブなスレッドを必須とします。スレッド内でない場合は失敗します。                                                  |
    | `off`  | バインディングなし。セッションはバインドされずに開始します。                                                                 |

    注記:

    - スレッドバインディングではないサーフェスでは、デフォルトの動作は実質的に `off` です。
    - スレッドバインドされた spawn にはチャンネルポリシーのサポートが必要です:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - 子スレッドを作成せずに現在の会話を固定したい場合は `--bind here` を使用します。

  </Tab>
</Tabs>

## 配信モデル

ACP セッションは、対話型ワークスペースにも、親が所有する
バックグラウンド作業にもなり得ます。配信パスはその形態によって異なります。

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    対話型セッションは、表示されているチャットサーフェスで会話を続けることを目的としています:

    - `/acp spawn ... --bind here` は現在の会話を ACP セッションへバインドします。
    - `/acp spawn ... --thread ...` はチャンネルのスレッド/トピックを ACP セッションへバインドします。
    - 永続的に設定された `bindings[].type="acp"` は、一致する会話を同じ ACP セッションへルーティングします。

    バインドされた会話内の後続メッセージは ACP セッションへ直接ルーティングされ、
    ACP の出力は同じチャンネル/スレッド/トピックへ返されます。

    OpenClaw がハーネスへ送信する内容:

    - 通常のバインドされた後続メッセージは、プロンプトテキストとして送信され、ハーネス/バックエンドがサポートする場合のみ添付ファイルも送信されます。
    - `/acp` 管理コマンドとローカル Gateway コマンドは、ACP へディスパッチされる前にインターセプトされます。
    - ランタイム生成の完了イベントは、ターゲットごとに実体化されます。OpenClaw エージェントは OpenClaw の内部 runtime-context エンベロープを受け取り、外部 ACP ハーネスは子の結果と指示を含むプレーンなプロンプトを受け取ります。生の `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` エンベロープは、外部ハーネスへ送信したり、ACP ユーザートランスクリプトテキストとして永続化したりしてはいけません。
    - ACP トランスクリプトエントリは、ユーザーに表示されるトリガーテキストまたはプレーンな完了プロンプトを使用します。内部イベントメタデータは可能な限り OpenClaw 内で構造化されたまま保持され、ユーザーが作成したチャットコンテンツとして扱われません。

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    別のエージェント実行によって spawn されたワンショット ACP セッションは、
    サブエージェントに似たバックグラウンドの子です:

    - 親は `sessions_spawn({ runtime: "acp", mode: "run" })` で作業を依頼します。
    - 子は独自の ACP ハーネスセッションで実行されます。
    - 子ターンはネイティブなサブエージェント spawn と同じバックグラウンドレーンで実行されるため、遅い ACP ハーネスが無関係なメインセッション作業をブロックしません。
    - 完了はタスク完了通知パスを通じて返されます。OpenClaw は内部完了メタデータを、外部ハーネスへ送信する前にプレーンな ACP プロンプトへ変換するため、ハーネスは OpenClaw 専用のランタイムコンテキストマーカーを見ません。
    - ユーザー向けの返信が有用な場合、親は子の結果を通常のアシスタントの声で書き換えます。

    このパスを親と子のピアツーピアチャットとして扱わないでください。
    子には、親へ戻る完了チャンネルがすでにあります。

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` は spawn 後に別のセッションをターゲットにできます。通常の
    ピアセッションでは、OpenClaw はメッセージを注入した後に
    エージェント間（A2A）の後続パスを使用します:

    - ターゲットセッションの返信を待ちます。
    - 任意で、要求元とターゲットに制限された回数の後続ターンを交換させます。
    - ターゲットに通知メッセージの生成を依頼します。
    - その通知を表示中のチャンネルまたはスレッドへ配信します。

    この A2A パスは、送信者が表示可能な後続応答を必要とするピア送信の
    フォールバックです。たとえば広い `tools.sessions.visibility` 設定の下で、
    無関係なセッションが ACP ターゲットを見てメッセージできる場合も有効なままです。

    OpenClaw が A2A 後続をスキップするのは、要求元が自分自身の
    親所有ワンショット ACP 子の親である場合のみです。この場合、
    タスク完了の上に A2A を実行すると、子の結果で親を起こし、
    親の返信を子へ戻し、親/子のエコーループを作る可能性があります。
    その所有子ケースでは、`sessions_send` の結果は
    `delivery.status="skipped"` を報告します。結果はすでに完了パスが担当しているためです。

  </Accordion>
  <Accordion title="Resume an existing session">
    新規開始ではなく以前の ACP セッションを続行するには `resumeSessionId` を使用します。
    エージェントは `session/load` 経由で会話履歴を再生するため、
    以前の完全なコンテキストを引き継いで開始します。

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    よくあるユースケース:

    - Codex セッションをノート PC からスマートフォンへ引き継ぐ場合。中断した場所から再開するようエージェントに伝えます。
    - CLI で対話的に開始したコーディングセッションを、今度はエージェント経由でヘッドレスに続行する場合。
    - Gateway の再起動やアイドルタイムアウトで中断された作業を再開する場合。

    注記:

    - `resumeSessionId` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `streamTo` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `resumeSessionId` はホストローカルな ACP/ハーネス再開 ID であり、OpenClaw チャンネルセッションキーではありません。OpenClaw はディスパッチ前に ACP spawn ポリシーとターゲットエージェントポリシーを引き続き確認しますが、そのアップストリーム ID を読み込む認可は ACP バックエンドまたはハーネスが所有します。
    - `resumeSessionId` はアップストリームの ACP 会話履歴を復元します。作成している新しい OpenClaw セッションには `thread` と `mode` が通常どおり適用されるため、`mode: "session"` には引き続き `thread: true` が必要です。
    - ターゲットエージェントは `session/load` をサポートしている必要があります（Codex と Claude Code はサポートしています）。
    - セッション ID が見つからない場合、spawn は明確なエラーで失敗します。新しいセッションへの暗黙のフォールバックはありません。

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Gateway のデプロイ後は、ユニットテストを信頼するのではなく、
    ライブのエンドツーエンドチェックを実行します:

    1. ターゲットホスト上のデプロイ済み Gateway バージョンとコミットを確認します。
    2. ライブエージェントへの一時 ACPX ブリッジセッションを開きます。
    3. そのエージェントに、`runtime: "acp"`、`agentId: "codex"`、`mode: "run"`、タスク `Reply with exactly LIVE-ACP-SPAWN-OK` で `sessions_spawn` を呼び出すよう依頼します。
    4. `accepted=yes`、実際の `childSessionKey`、バリデーターエラーがないことを確認します。
    5. 一時ブリッジセッションをクリーンアップします。

    ゲートは `mode: "run"` のままにし、`streamTo: "parent"` はスキップします。
    スレッドバインドされた `mode: "session"` とストリームリレーパスは、
    別個のよりリッチな統合パスです。

  </Accordion>
</AccordionGroup>

## サンドボックス互換性

ACP セッションは現在、OpenClaw サンドボックス内ではなく、ホストランタイム上で実行されます。

<Warning>
**セキュリティ境界:**

- 外部ハーネスは、それ自身の CLI 権限と選択された `cwd` に従って読み書きできます。
- OpenClaw のサンドボックスポリシーは、ACP ハーネス実行を**ラップしません**。
- OpenClaw は引き続き、ACP 機能ゲート、許可されたエージェント、セッション所有権、チャンネルバインディング、Gateway 配信ポリシーを適用します。
- サンドボックスが適用される OpenClaw ネイティブの作業には `runtime: "subagent"` を使用します。

</Warning>

現在の制限:

- リクエスト元セッションがサンドボックス化されている場合、ACP のスポーンは `sessions_spawn({ runtime: "acp" })` と `/acp spawn` の両方でブロックされます。
- `runtime: "acp"` を指定した `sessions_spawn` は `sandbox: "require"` をサポートしません。

## セッションターゲットの解決

ほとんどの `/acp` アクションは、任意のセッションターゲット (`session-key`,
`session-id`、または `session-label`) を受け付けます。

**解決順序:**

1. 明示的なターゲット引数 (`/acp steer` の場合は `--session`)
   - key を試す
   - 次に UUID 形式のセッション ID
   - 次にラベル
2. 現在のスレッドバインディング (この会話/スレッドが ACP セッションにバインドされている場合)。
3. 現在のリクエスト元セッションへのフォールバック。

現在の会話バインディングとスレッドバインディングは、どちらも
ステップ 2 に関与します。

ターゲットが解決されない場合、OpenClaw は明確なエラーを返します
(`Unable to resolve session target: ...`)。

## ACP コントロール

| コマンド              | 実行内容                                                  | 例                                                            |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP セッションを作成します。現在のバインドまたはスレッドバインドは任意です。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ターゲットセッションの進行中ターンをキャンセルします。    | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 実行中セッションにステア指示を送信します。                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | セッションを閉じ、スレッドターゲットのバインドを解除します。 | `/acp close`                                                  |
| `/acp status`        | バックエンド、モード、状態、ランタイムオプション、機能を表示します。 | `/acp status`                                                 |
| `/acp set-mode`      | ターゲットセッションのランタイムモードを設定します。      | `/acp set-mode plan`                                          |
| `/acp set`           | 汎用ランタイム設定オプションを書き込みます。              | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ランタイム作業ディレクトリのオーバーライドを設定します。  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 承認ポリシープロファイルを設定します。                    | `/acp permissions strict`                                     |
| `/acp timeout`       | ランタイムタイムアウト (秒) を設定します。                 | `/acp timeout 120`                                            |
| `/acp model`         | ランタイムモデルのオーバーライドを設定します。            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | セッションのランタイムオプションのオーバーライドを削除します。 | `/acp reset-options`                                          |
| `/acp sessions`      | ストアから最近の ACP セッションを一覧表示します。         | `/acp sessions`                                               |
| `/acp doctor`        | バックエンドの健全性、機能、実行可能な修正を表示します。  | `/acp doctor`                                                 |
| `/acp install`       | 決定的なインストール手順と有効化手順を出力します。        | `/acp install`                                                |

`/acp status` は、有効なランタイムオプションに加えて、ランタイムレベルおよび
バックエンドレベルのセッション識別子を表示します。バックエンドに機能がない場合、
サポートされていないコントロールのエラーが明確に表示されます。`/acp sessions` は、
現在バインドされているセッションまたはリクエスト元セッションのストアを読み取ります。ターゲットトークン
(`session-key`、`session-id`、または `session-label`) は、
エージェントごとのカスタム `session.store` ルートを含む
Gateway セッション検出を通じて解決されます。

### ランタイムオプションのマッピング

`/acp` には便利なコマンドと汎用 setter があります。等価な
操作:

| コマンド                      | マップ先                             | 注記                                                                                                                                                                           |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | ランタイム設定キー `model`           | Codex ACP の場合、OpenClaw は `openai-codex/<model>` をアダプターモデル ID に正規化し、`openai-codex/gpt-5.4/high` などのスラッシュ付き reasoning サフィックスを `reasoning_effort` にマップします。 |
| `/acp set thinking <level>`  | ランタイム設定キー `thinking`        | Codex ACP の場合、OpenClaw はアダプターが対応している場合に対応する `reasoning_effort` を送信します。                                                                          |
| `/acp permissions <profile>` | ランタイム設定キー `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | ランタイム設定キー `timeout`         | —                                                                                                                                                                              |
| `/acp cwd <path>`            | ランタイム cwd オーバーライド        | 直接更新します。                                                                                                                                                              |
| `/acp set <key> <value>`     | 汎用                                 | `key=cwd` は cwd オーバーライドパスを使用します。                                                                                                                             |
| `/acp reset-options`         | すべてのランタイムオーバーライドをクリア | —                                                                                                                                                                              |

## acpx ハーネス、Plugin セットアップ、権限

acpx ハーネス設定 (Claude Code / Codex / Gemini CLI
エイリアス)、plugin-tools および OpenClaw-tools MCP ブリッジ、ACP
権限モードについては、
[ACP エージェント — セットアップ](/ja-JP/tools/acp-agents-setup) を参照してください。

## トラブルシューティング

| 症状                                                                        | 考えられる原因                                                                                                         | 修正                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | バックエンドPluginがない、無効化されている、または `plugins.allow` によってブロックされています。                     | バックエンドPluginをインストールして有効化し、その許可リストが設定されている場合は `plugins.allow` に `acpx` を含めてから、`/acp doctor` を実行します。                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACPがグローバルに無効化されています。                                                                                 | `acp.enabled=true` を設定します。                                                                                                                                        |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 通常のスレッドメッセージからの自動ディスパッチが無効化されています。                                                 | 自動スレッドルーティングを再開するには `acp.dispatch.enabled=true` を設定します。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き機能します。            |
| `ACP agent "<id>" is not allowed by policy`                                 | エージェントが許可リストにありません。                                                                               | 許可されている `agentId` を使用するか、`acp.allowedAgents` を更新します。                                                                                                |
| `/acp doctor` reports backend not ready right after startup                 | バックエンドPluginがない、無効化されている、allow/denyポリシーでブロックされている、または設定済みの実行ファイルを利用できません。 | バックエンドPluginをインストールまたは有効化し、`/acp doctor` を再実行します。正常化しない場合は、バックエンドのインストールまたはポリシーエラーを確認します。          |
| Harness command not found                                                   | アダプターCLIがインストールされていない、外部Pluginがない、またはCodex以外のアダプターで初回実行の `npx` フェッチに失敗しました。 | `/acp doctor` を実行し、Gatewayホストでアダプターをインストールまたは事前ウォームアップするか、acpxエージェントコマンドを明示的に設定します。                           |
| Model-not-found from the harness                                            | モデルIDは別のプロバイダー/ハーネスでは有効ですが、このACPターゲットでは有効ではありません。                         | そのハーネスが一覧表示するモデルを使用するか、ハーネス内でモデルを設定するか、オーバーライドを省略します。                                                            |
| Vendor auth error from the harness                                          | OpenClawは正常ですが、ターゲットCLI/プロバイダーにログインしていません。                                             | Gatewayホスト環境でログインするか、必要なプロバイダーキーを指定します。                                                                                                 |
| `Unable to resolve session target: ...`                                     | キー/ID/ラベルトークンが正しくありません。                                                                            | `/acp sessions` を実行し、正確なキー/ラベルをコピーして再試行します。                                                                                                   |
| `--bind here requires running /acp spawn inside an active ... conversation` | アクティブなバインド可能な会話なしで `--bind here` が使用されました。                                                | ターゲットのチャット/チャンネルへ移動して再試行するか、未バインドのspawnを使用します。                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | アダプターに現在の会話のACPバインディング機能がありません。                                                          | サポートされている場合は `/acp spawn ... --thread ...` を使用するか、トップレベルの `bindings[]` を設定するか、サポートされているチャンネルへ移動します。                |
| `--thread here requires running /acp spawn inside an active ... thread`     | スレッドコンテキストの外で `--thread here` が使用されました。                                                        | ターゲットスレッドへ移動するか、`--thread auto`/`off` を使用します。                                                                                                    |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 別のユーザーがアクティブなバインディングターゲットを所有しています。                                                 | 所有者として再バインドするか、別の会話またはスレッドを使用します。                                                                                                     |
| `Thread bindings are unavailable for <channel>.`                            | アダプターにスレッドバインディング機能がありません。                                                                 | `--thread off` を使用するか、サポートされているアダプター/チャンネルへ移動します。                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACPランタイムはホスト側です。要求元セッションはサンドボックス化されています。                                       | サンドボックス化されたセッションからは `runtime="subagent"` を使用するか、サンドボックス化されていないセッションからACP spawnを実行します。                            |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACPランタイムに対して `sandbox="require"` が要求されました。                                                         | 必須のサンドボックス化には `runtime="subagent"` を使用するか、サンドボックス化されていないセッションから `sandbox="inherit"` でACPを使用します。                        |
| `Cannot apply --model ... did not advertise model support`                  | ターゲットハーネスが汎用ACPモデル切り替えを公開していません。                                                        | ACP `models`/`session/set_model` を通知するハーネスを使用するか、Codex ACPモデル参照を使用するか、独自の起動フラグがある場合はハーネス内でモデルを直接設定します。       |
| Missing ACP metadata for bound session                                      | ACPセッションメタデータが古いか削除されています。                                                                    | `/acp spawn` で再作成してから、スレッドを再バインド/フォーカスします。                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` が非対話型ACPセッションでの書き込み/実行をブロックしています。                                     | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定し、Gatewayを再起動します。[権限設定](/ja-JP/tools/acp-agents-setup#permission-configuration)を参照してください。 |
| ACP session fails early with little output                                  | 権限プロンプトが `permissionMode`/`nonInteractivePermissions` によってブロックされています。                         | Gatewayログで `AcpRuntimeError` を確認します。完全な権限には `permissionMode=approve-all` を設定します。正常な縮退には `nonInteractivePermissions=deny` を設定します。 |
| ACP session stalls indefinitely after completing work                       | ハーネスプロセスは終了しましたが、ACPセッションが完了を報告しませんでした。                                          | `ps aux \| grep acpx` で監視し、古いプロセスを手動でkillします。                                                                                                       |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 内部イベントエンベロープがACP境界を越えて漏れました。                                                                | OpenClawを更新して完了フローを再実行します。外部ハーネスはプレーンな完了プロンプトのみを受け取るべきです。                                                            |

## 関連

- [ACPエージェント — セットアップ](/ja-JP/tools/acp-agents-setup)
- [エージェント送信](/ja-JP/tools/agent-send)
- [CLIバックエンド](/ja-JP/gateway/cli-backends)
- [Codexハーネス](/ja-JP/plugins/codex-harness)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (ブリッジモード)](/ja-JP/cli/acp)
- [サブエージェント](/ja-JP/tools/subagents)
