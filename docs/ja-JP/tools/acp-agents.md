---
read_when:
    - ACP 経由でコーディングハーネスを実行する
    - メッセージングチャンネルで会話に紐づく ACP セッションを設定する
    - メッセージチャネルの会話を永続 ACP セッションにバインドする
    - ACPバックエンド、Plugin配線、または完了配信のトラブルシューティング
    - チャットから /acp コマンドを操作する
sidebarTitle: ACP agents
summary: 外部コーディングハーネス（Claude Code、Cursor、Gemini CLI、明示的な Codex ACP、OpenClaw ACP、OpenCode）を ACP バックエンド経由で実行する
title: ACP エージェント
x-i18n:
    generated_at: "2026-07-05T01:59:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bc48f9d2d3d379596f50132b70f07d42d860a4c633835e0bda6622fcd5be8db
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) セッションにより、
OpenClaw は ACP バックエンド Plugin 経由で外部コーディングハーネス
（たとえば Claude Code、Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI、およびその他の
サポートされている ACPX ハーネス）を実行できます。

各 ACP セッションの起動は [バックグラウンドタスク](/ja-JP/automation/tasks) として追跡されます。

<Note>
**ACP は外部ハーネス用のパスであり、デフォルトの Codex パスではありません。** ネイティブの
Codex アプリサーバー Plugin が `/codex ...` コントロールと、エージェントターン用のデフォルト
`openai/gpt-*` 組み込みランタイムを所有します。ACP は
`/acp ...` コントロールと `sessions_spawn({ runtime: "acp" })` セッションを所有します。

Codex または Claude Code を外部 MCP クライアントとして、既存の OpenClaw チャンネル会話へ
直接接続したい場合は、ACP ではなく
[`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。
</Note>

## どのページを使えばよいですか？

| やりたいこと                                                                                    | 使用するもの                              | 注記                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 現在の会話で Codex をバインドまたは制御する                                               | `/codex bind`, `/codex threads`       | `codex` Plugin が有効な場合のネイティブ Codex アプリサーバーパス。バインドされたチャット返信、画像転送、モデル/高速/権限、停止、ステアリングコントロールを含みます。ACP は明示的なフォールバックです |
| Claude Code、Gemini CLI、明示的な Codex ACP、または別の外部ハーネスを OpenClaw _経由で_ 実行する | このページ                             | チャットにバインドされたセッション、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、バックグラウンドタスク、ランタイムコントロール                                                                                   |
| エディターまたはクライアント向けに、OpenClaw Gateway セッションを ACP サーバー _として_ 公開する                   | [`openclaw acp`](/ja-JP/cli/acp)            | ブリッジモード。IDE/クライアントは stdio/WebSocket 経由で OpenClaw に ACP で通信します                                                                                                                            |
| ローカル AI CLI をテキスト専用のフォールバックモデルとして再利用する                                              | [CLI バックエンド](/ja-JP/gateway/cli-backends) | ACP ではありません。OpenClaw ツール、ACP コントロール、ハーネスランタイムはいずれもありません                                                                                                                               |

## これはそのまま動作しますか？

はい。公式 ACP ランタイム Plugin をインストールした後に動作します。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

ソースチェックアウトでは、`pnpm install` 後にローカルの `extensions/acpx` ワークスペース Plugin を使用できます。
準備状況の確認には `/acp doctor` を実行してください。

OpenClaw は、ACP が**実際に使用可能**な場合にのみ、ACP 起動についてエージェントに知らせます。
ACP が有効であり、ディスパッチが無効化されておらず、現在のセッションがサンドボックスでブロックされておらず、
ランタイムバックエンドが読み込まれている必要があります。これらの条件が満たされない場合、
ACP Plugin Skills と `sessions_spawn` の ACP ガイダンスは非表示のままになり、
エージェントが利用できないバックエンドを提案しないようにします。

<AccordionGroup>
  <Accordion title="初回実行時の注意点">
    - `plugins.allow` が設定されている場合、それは制限的な Plugin インベントリであり、**必ず** `acpx` を含める必要があります。そうでない場合、インストール済みの ACP バックエンドは意図的にブロックされ、`/acp doctor` は allowlist エントリの不足を報告します。
    - Codex ACP アダプターは `acpx` Plugin とともにステージングされ、可能な場合はローカルで起動されます。
    - Codex ACP は分離された `CODEX_HOME` で実行されます。OpenClaw はホストの Codex 設定から信頼済みプロジェクトエントリと安全なモデル/プロバイダールーティング設定をコピーします。一方で、認証、通知、フックはホスト設定に残ります。
    - その他のターゲットハーネスアダプターは、初回使用時に引き続き `npx` でオンデマンド取得される場合があります。
    - ベンダー認証は、そのハーネス用にホスト上に存在している必要があります。
    - ホストに npm またはネットワークアクセスがない場合、キャッシュを事前にウォームアップするか、別の方法でアダプターをインストールするまで、初回実行時のアダプター取得は失敗します。

  </Accordion>
  <Accordion title="ランタイムの前提条件">
    ACP は実際の外部ハーネスプロセスを起動します。OpenClaw はルーティング、
    バックグラウンドタスク状態、配信、バインディング、ポリシーを所有します。ハーネスは
    自身のプロバイダーログイン、モデルカタログ、ファイルシステム動作、
    ネイティブツールを所有します。

    OpenClaw を疑う前に、次を確認してください。

    - `/acp doctor` が、有効で正常なバックエンドを報告している。
    - allowlist が設定されている場合、ターゲット id が `acp.allowedAgents` で許可されている。
    - ハーネスコマンドを Gateway ホスト上で起動できる。
    - そのハーネスのプロバイダー認証が存在している（`claude`、`codex`、`gemini`、`opencode`、`droid` など）。
    - 選択したモデルがそのハーネスに存在している。モデル id はハーネス間で移植可能ではありません。
    - 要求された `cwd` が存在しアクセス可能である。または `cwd` を省略し、バックエンドにデフォルトを使用させる。
    - 権限モードが作業に合っている。非対話型セッションではネイティブ権限プロンプトをクリックできないため、書き込み/実行が多いコーディング実行では通常、ヘッドレスで進行できる ACPX 権限プロファイルが必要です。

  </Accordion>
</AccordionGroup>

OpenClaw Plugin ツールと組み込み OpenClaw ツールは、デフォルトでは
ACP ハーネスに公開されません。ハーネスがそれらのツールを直接呼び出すべき場合にのみ、
[ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup) で明示的な MCP ブリッジを有効にしてください。

## サポートされているハーネスターゲット

`acpx` バックエンドでは、`/acp spawn <id>` または
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` のターゲットとして、次のハーネス id を使用します。

| ハーネス id | 一般的なバックエンド                                | 注記                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP アダプター                        | ホスト上の Claude Code 認証が必要です。                                              |
| `codex`    | Codex ACP アダプター                              | ネイティブ `/codex` が利用できない場合、または ACP が要求された場合のみの明示的な ACP フォールバックです。 |
| `copilot`  | GitHub Copilot ACP アダプター                     | Copilot CLI/ランタイム認証が必要です。                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | ローカルインストールが別の ACP エントリーポイントを公開している場合は、acpx コマンドを上書きしてください。    |
| `droid`    | Factory Droid CLI                              | ハーネス環境に Factory/Droid 認証または `FACTORY_API_KEY` が必要です。        |
| `gemini`   | Gemini CLI ACP アダプター                         | Gemini CLI 認証または API キー設定が必要です。                                          |
| `iflow`    | iFlow CLI                                      | アダプターの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `kilocode` | Kilo Code CLI                                  | アダプターの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `kimi`     | Kimi/Moonshot CLI                              | ホスト上の Kimi/Moonshot 認証が必要です。                                            |
| `kiro`     | Kiro CLI                                       | アダプターの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `opencode` | OpenCode ACP アダプター                           | OpenCode CLI/プロバイダー認証が必要です。                                                |
| `openclaw` | `openclaw acp` 経由の OpenClaw Gateway ブリッジ | ACP 対応ハーネスが OpenClaw Gateway セッションへ通信を戻せるようにします。                 |
| `qwen`     | Qwen Code / Qwen CLI                           | ホスト上の Qwen 互換認証が必要です。                                          |

カスタム acpx エージェントエイリアスは acpx 自体で設定できますが、OpenClaw
ポリシーはディスパッチ前に引き続き `acp.allowedAgents` と
`agents.list[].runtime.acp.agent` マッピングを確認します。

## オペレーターランブック

チャットからの簡単な `/acp` フロー:

<Steps>
  <Step title="起動">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`、または明示的な
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="作業">
    バインドされた会話またはスレッドで続行します（またはセッションキーを
    明示的に指定します）。
  </Step>
  <Step title="状態確認">
    `/acp status`
  </Step>
  <Step title="調整">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`。
  </Step>
  <Step title="ステアリング">
    コンテキストを置き換えずに: `/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（現在のターン）または `/acp close`（セッション + バインディング）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="ライフサイクルの詳細">
    - 起動により ACP ランタイムセッションが作成または再開され、OpenClaw セッションストアに ACP メタデータが記録され、実行が親所有の場合はバックグラウンドタスクが作成されることがあります。
    - 親所有の ACP セッションは、ランタイムセッションが永続的であってもバックグラウンド作業として扱われます。完了とサーフェス横断の配信は、通常のユーザー向けチャットセッションのように動作するのではなく、親タスク通知機構を通じて行われます。
    - タスクメンテナンスは、終端状態または孤立した親所有のワンショット ACP セッションを閉じます。永続 ACP セッションは、アクティブな会話バインディングが残っている間は保持されます。アクティブなバインディングのない古い永続セッションは、所有タスクが完了した後、またはそのタスクレコードがなくなった後に静かに再開されないよう閉じられます。
    - バインドされたフォローアップメッセージは、バインディングが閉じられる、フォーカス解除される、リセットされる、または期限切れになるまで、ACP セッションへ直接送られます。
    - Gateway コマンドはローカルに留まります。`/acp ...`、`/status`、`/unfocus` は、バインドされた ACP ハーネスへ通常のプロンプトテキストとして送信されることはありません。
    - `cancel` は、バックエンドがキャンセルをサポートしている場合にアクティブなターンを中止します。バインディングまたはセッションメタデータは削除しません。
    - `close` は OpenClaw の観点から ACP セッションを終了し、バインディングを削除します。ハーネスが再開をサポートしている場合、自身の上流履歴を保持し続けることがあります。
    - acpx Plugin は、`close` 後に OpenClaw 所有のラッパーとアダプタープロセスツリーをクリーンアップし、Gateway 起動時に古い OpenClaw 所有の ACPX 孤立プロセスを回収します。
    - アイドル状態のランタイムワーカーは、`acp.runtime.ttlMinutes` 後にクリーンアップ対象になります。保存されたセッションメタデータは `/acp sessions` で引き続き利用できます。

  </Accordion>
  <Accordion title="ネイティブ Codex ルーティングルール">
    有効な場合に**ネイティブ Codex
    Plugin** へルーティングされるべき自然言語トリガー:

    - 「この Discord チャンネルを Codex にバインドして。」
    - 「このチャットを Codex スレッド `<id>` に添付して。」
    - 「Codex スレッドを表示してから、これをバインドして。」

    ネイティブ Codex 会話バインディングは、既定のチャット制御パスです。
    OpenClaw 動的ツールは引き続き OpenClaw 経由で実行される一方で、
    shell/apply-patch などの Codex ネイティブツールは Codex 内で実行されます。
    Codex ネイティブツールイベントについて、OpenClaw はターンごとのネイティブ
    フックリレーを注入するため、Plugin フックは `before_tool_call` をブロックし、
    `after_tool_call` を観測し、Codex `PermissionRequest` イベントを
    OpenClaw 承認にルーティングできます。Codex `Stop` フックは
    OpenClaw `before_agent_finalize` にリレーされ、そこで Plugin は Codex が
    回答を確定する前にもう一度モデルパスを要求できます。このリレーは
    意図的に保守的なままです。Codex ネイティブツールの引数を変更したり、
    Codex スレッドレコードを書き換えたりしません。ACP ランタイム/セッションモデルを
    使いたい場合にのみ、明示的な ACP を使用してください。埋め込み Codex
    サポート境界は
    [Codex ハーネス v1 サポート契約](/ja-JP/plugins/codex-harness-runtime#v1-support-contract)に記載されています。

  </Accordion>
  <Accordion title="モデル / プロバイダー / ランタイム選択チートシート">
    - レガシー Codex モデル参照 - レガシー Codex OAuth/サブスクリプションモデルルートは doctor によって修復されます。
    - `openai/*` - OpenAI エージェントターン用のネイティブ Codex app-server 埋め込みランタイム。
    - `/codex ...` - ネイティブ Codex 会話制御。
    - `/acp ...` または `runtime: "acp"` - 明示的な ACP/acpx 制御。

  </Accordion>
  <Accordion title="ACP ルーティングの自然言語トリガー">
    ACP ランタイムにルーティングするべきトリガー:

    - 「これをワンショットの Claude Code ACP セッションとして実行し、結果を要約してください。」
    - 「このタスクには Gemini CLI をスレッド内で使い、その後のフォローアップを同じスレッドに維持してください。」
    - 「バックグラウンドスレッドで Codex を ACP 経由で実行してください。」

    OpenClaw は `runtime: "acp"` を選択し、ハーネス `agentId` を解決し、
    サポートされている場合は現在の会話またはスレッドにバインドし、
    クローズ/期限切れまでフォローアップをそのセッションにルーティングします。Codex は、
    ACP/acpx が明示されている場合、または要求された操作でネイティブ Codex
    Plugin が利用できない場合にのみ、このパスに従います。

    `sessions_spawn` では、ACP が有効で、リクエスターがサンドボックス化されておらず、
    ACP ランタイムバックエンドがロードされている場合にのみ、`runtime: "acp"` が
    通知されます。`acp.dispatch.enabled=false` は自動 ACP スレッドディスパッチを
    一時停止しますが、明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しを
    非表示にしたりブロックしたりしません。これは `codex`、`claude`、`droid`、
    `gemini`、`opencode` などの ACP ハーネス ID を対象にします。そのエントリが
    `agents.list[].runtime.type="acp"` で明示的に設定されていない限り、
    `agents_list` から通常の OpenClaw 設定エージェント ID を渡さないでください。
    それ以外の場合は、既定のサブエージェントランタイムを使用してください。OpenClaw エージェントが
    `runtime.type="acp"` で設定されている場合、OpenClaw は
    `runtime.acp.agent` を基になるハーネス ID として使用します。

  </Accordion>
</AccordionGroup>

## ACP とサブエージェントの比較

外部ハーネスランタイムが必要な場合は ACP を使用します。`codex`
Plugin が有効な場合に Codex 会話バインディング/制御を行うには、**ネイティブ Codex
app-server** を使用します。OpenClaw ネイティブの委任実行が必要な場合は
**サブエージェント**を使用します。

| 領域          | ACP セッション                           | サブエージェント実行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| ランタイム       | ACP バックエンド Plugin（例: acpx） | OpenClaw ネイティブサブエージェントランタイム  |
| セッションキー   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主なコマンド | `/acp ...`                            | `/subagents ...`                   |
| 生成ツール    | `runtime:"acp"` 付きの `sessions_spawn` | `sessions_spawn`（既定ランタイム） |

[サブエージェント](/ja-JP/tools/subagents)も参照してください。

## ACP が Claude Code を実行する仕組み

ACP 経由の Claude Code では、スタックは次のとおりです。

1. OpenClaw ACP セッション制御プレーン。
2. 公式 `@openclaw/acpx` ランタイム Plugin。
3. Claude ACP アダプター。
4. Claude 側のランタイム/セッション機構。

ACP Claude は、ACP 制御、セッション再開、
バックグラウンドタスク追跡、任意の会話/スレッドバインディングを備えた
**ハーネスセッション**です。

CLI バックエンドは、別個のテキスト専用ローカルフォールバックランタイムです -
[CLI バックエンド](/ja-JP/gateway/cli-backends)を参照してください。

オペレーター向けの実用的なルールは次のとおりです。

- **`/acp spawn`、バインド可能なセッション、ランタイム制御、または永続的なハーネス作業が必要ですか?** ACP を使用してください。
- **生の CLI 経由の単純なローカルテキストフォールバックが必要ですか?** CLI バックエンドを使用してください。

## バインド済みセッション

### メンタルモデル

- **チャットサーフェス** - 人々が会話を続ける場所（Discord チャンネル、Telegram トピック、iMessage チャット）。
- **ACP セッション** - OpenClaw がルーティングする耐久的な Codex/Claude/Gemini ランタイム状態。
- **子スレッド/トピック** - `--thread ...` によってのみ作成される任意の追加メッセージングサーフェス。
- **ランタイムワークスペース** - ハーネスが実行されるファイルシステムの場所（`cwd`、リポジトリチェックアウト、バックエンドワークスペース）。チャットサーフェスとは独立しています。

### 現在の会話へのバインド

`/acp spawn <harness> --bind here` は、現在の会話を
生成された ACP セッションに固定します - 子スレッドはなく、同じチャットサーフェスです。OpenClaw は
トランスポート、認証、安全性、配信を引き続き所有します。その会話内のフォローアップメッセージは
同じセッションにルーティングされます。`/new` と `/reset` は
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
    - `--bind here` は、現在の会話バインディングを通知するチャンネルでのみ機能します。それ以外の場合、OpenClaw は明確な未サポートメッセージを返します。バインディングは Gateway の再起動後も保持されます。
    - Discord では、`spawnSessions` は `--thread auto|here` の子スレッド作成を制御します - `--bind here` ではありません。
    - `--cwd` なしで別の ACP エージェントに生成する場合、OpenClaw は既定で**ターゲットエージェントの**ワークスペースを継承します。継承されたパスが存在しない場合（`ENOENT`/`ENOTDIR`）はバックエンド既定値にフォールバックします。その他のアクセスエラー（例: `EACCES`）は生成エラーとして表示されます。
    - Gateway 管理コマンドはバインド済み会話内でもローカルのままです - 通常のフォローアップテキストがバインド済み ACP セッションにルーティングされる場合でも、`/acp ...` コマンドは OpenClaw によって処理されます。`/status` と `/unfocus` も、そのサーフェスでコマンド処理が有効な場合は常にローカルのままです。

  </Accordion>
  <Accordion title="スレッドバインド済みセッション">
    チャンネルアダプターでスレッドバインディングが有効な場合:

    - OpenClaw はスレッドをターゲット ACP セッションにバインドします。
    - そのスレッド内のフォローアップメッセージは、バインド済み ACP セッションにルーティングされます。
    - ACP 出力は同じスレッドに配信されます。
    - フォーカス解除/クローズ/アーカイブ/アイドルタイムアウト、または最大経過時間の期限切れにより、バインディングが削除されます。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status`、`/unfocus` は Gateway コマンドであり、ACP ハーネスへのプロンプトではありません。

    スレッドバインド ACP に必要な機能フラグ:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` は既定でオンです（自動 ACP スレッドディスパッチを一時停止するには `false` を設定します。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き機能します）。
    - チャンネルアダプターのスレッドセッション生成が有効（既定: `true`）:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    スレッドバインディングのサポートはアダプター固有です。アクティブなチャンネル
    アダプターがスレッドバインディングをサポートしていない場合、OpenClaw は明確な
    未サポート/利用不可メッセージを返します。

  </Accordion>
  <Accordion title="スレッドをサポートするチャンネル">
    - セッション/スレッドバインディング機能を公開する任意のチャンネルアダプター。
    - 現在の組み込みサポート: **Discord** スレッド/チャンネル、**Telegram** トピック（グループ/スーパーグループ内のフォーラムトピック、および DM トピック）。
    - Plugin チャンネルは、同じバインディングインターフェイスを通じてサポートを追加できます。

  </Accordion>
</AccordionGroup>

## 永続的なチャンネルバインディング

非一時的なワークフローでは、トップレベルの `bindings[]` エントリで
永続的な ACP バインディングを設定します。

### バインディングモデル

<ParamField path="bindings[].type" type='"acp"'>
  永続的な ACP 会話バインディングとしてマークします。
</ParamField>
<ParamField path="bindings[].match" type="object">
  ターゲット会話を識別します。チャンネルごとの形状:

- **Discord チャンネル/スレッド:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack チャンネル/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`。安定した Slack ID を推奨します。チャンネルバインディングは、そのチャンネルのスレッド内の返信にも一致します。
- **Telegram フォーラムトピック:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp DM/グループ:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`。直接チャットには `+15555550123` などの E.164 番号を使用し、グループには `120363424282127706@g.us` などの WhatsApp グループ JID を使用します。
- **iMessage DM/グループ:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。安定したグループバインディングには `chat_id:*` を推奨します。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  所有する OpenClaw エージェント ID。
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

### エージェントごとのランタイム既定値

エージェントごとに一度だけ ACP 既定値を定義するには、`agents.list[].runtime` を使用します。

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（ハーネス ID、例: `codex` または `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP バインド済みセッションのオーバーライド優先順位:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. グローバル ACP 既定値（例: `acp.backend`）

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

### 挙動

- OpenClaw は、チャネル固有の受け入れ処理の後、使用前に、設定済み ACP セッションが存在することを保証します。
- そのチャネル、トピック、またはチャット内のメッセージは、設定済み ACP セッションにルーティングされます。
- 設定済み ACP バインディングは自身のセッションルートを所有します。チャネルブロードキャストのファンアウトは、一致したバインディングの設定済み ACP セッションを置き換えません。
- バインド済みの会話では、`/new` と `/reset` は同じ ACP セッションキーをその場でリセットします。
- 一時的なランタイムバインディング（たとえばスレッドフォーカスフローで作成されたもの）は、存在する場所では引き続き適用されます。
- 明示的な `cwd` がないクロスエージェント ACP スポーンでは、OpenClaw はエージェント設定からターゲットエージェントのワークスペースを継承します。
- 継承されたワークスペースパスが存在しない場合はバックエンドのデフォルト cwd にフォールバックし、存在するがアクセスに失敗した場合はスポーンエラーとして表面化します。

## ACP セッションを開始する

ACP セッションを開始する方法は 2 つあります。

<Tabs>
  <Tab title="sessions_spawn から">
    エージェントターンまたはツール呼び出しから ACP セッションを開始するには、`runtime: "acp"` を使用します。

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
    `runtime` のデフォルトは `subagent` なので、ACP セッションでは `runtime: "acp"` を明示的に設定してください。`agentId` を省略した場合、設定されていれば OpenClaw は `acp.defaultAgent` を使用します。`mode: "session"` では、永続的なバインド済み会話を維持するために `thread: true` が必要です。
    </Note>

  </Tab>
  <Tab title="/acp コマンドから">
    チャットから明示的にオペレーター制御するには、`/acp spawn` を使用します。

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
  ACP セッションに送信される初期プロンプト。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP セッションでは `"acp"` である必要があります。
</ParamField>
<ParamField path="agentId" type="string">
  ACP ターゲットハーネス ID。設定されていれば `acp.defaultAgent` にフォールバックします。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  サポートされている場合にスレッドバインディングフローを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` は1回限り、`"session"` は永続的です。`thread: true` で `mode` が省略された場合、OpenClaw はランタイムパスごとに永続的な挙動をデフォルトにすることがあります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cwd" type="string">
  要求されたランタイム作業ディレクトリ（バックエンド/ランタイムポリシーによって検証されます）。省略された場合、ACP スポーンは、設定されていればターゲットエージェントのワークスペースを継承します。継承されたパスが存在しない場合はバックエンドのデフォルトにフォールバックし、実際のアクセスエラーは返されます。
</ParamField>
<ParamField path="label" type="string">
  セッション/バナーテキストで使用される、オペレーター向けのラベル。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  新しい ACP セッションを作成する代わりに、既存の ACP セッションを再開します。エージェントは `session/load` 経由で会話履歴を再生します。`runtime: "acp"` が必要です。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` は、初期 ACP 実行の進行状況サマリーをシステムイベントとして要求元セッションにストリーミングします。受け入れられたレスポンスには、完全なリレー履歴を tail できるセッションスコープの JSONL ログ（`<sessionId>.acp-stream.jsonl`）を指す `streamLogPath` が含まれます。親進行ストリームは、`streaming.progress.commentary=false` でない限り、デフォルトでアシスタントのコメントと ACP ステータス進行を表示します。Discord も、ストリームモードが設定されていない場合、親プレビューをデフォルトで進行モードにします。ステータス進行は引き続き `acp.stream.tagVisibility` に従うため、`plan` などのタグは明示的に有効化されない限り非表示のままです。
</ParamField>

ACP `sessions_spawn` 実行は、デフォルトの子ターン制限として `agents.defaults.subagents.runTimeoutSeconds` を使用します。このツールは呼び出しごとのタイムアウト上書きを受け付けません。

<ParamField path="model" type="string">
  ACP 子セッションの明示的なモデル上書き。Codex ACP スポーンは、`session/new` の前に、`openai/gpt-5.4` などの OpenAI 参照を Codex ACP 起動設定に正規化します。`openai/gpt-5.4/high` などのスラッシュ形式は、Codex ACP 推論エフォートも設定します。
  省略された場合、`sessions_spawn({ runtime: "acp" })` は、設定されていれば既存のサブエージェントモデルのデフォルト（`agents.defaults.subagents.model` または `agents.list[].subagents.model`）を使用します。それ以外の場合は、ACP ハーネス自身のデフォルトモデルを使用させます。
  その他のハーネスは ACP `models` を広告し、`session/set_model` をサポートしている必要があります。そうでない場合、OpenClaw/acpx はターゲットエージェントのデフォルトに黙ってフォールバックするのではなく、明確に失敗します。
</ParamField>
<ParamField path="thinking" type="string">
  明示的な思考/推論エフォート。Codex ACP では、`minimal` は低エフォートに対応し、`low`/`medium`/`high`/`xhigh` は直接対応し、`off` は推論エフォートの起動上書きを省略します。
  省略された場合、ACP スポーンは既存のサブエージェント思考デフォルトと、選択されたモデルに対するモデル別 `agents.defaults.models["provider/model"].params.thinking` を使用します。
</ParamField>

## スポーンの bind モードと thread モード

<Tabs>
  <Tab title="--bind here|off">
    | モード   | 挙動                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 現在のアクティブな会話をその場でバインドします。アクティブな会話がない場合は失敗します。 |
    | `off`  | 現在の会話へのバインディングを作成しません。                          |

    注意:

    - `--bind here` は、「このチャネルまたはチャットを Codex バックにする」ための最も単純なオペレーターパスです。
    - `--bind here` は子スレッドを作成しません。
    - `--bind here` は、現在の会話のバインディングサポートを公開しているチャネルでのみ使用できます。
    - `--bind` と `--thread` を同じ `/acp spawn` 呼び出しで組み合わせることはできません。

  </Tab>
  <Tab title="--thread auto|here|off">
    | モード   | 挙動                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | アクティブなスレッド内では、そのスレッドをバインドします。スレッド外では、サポートされている場合に子スレッドを作成/バインドします。 |
    | `here` | 現在のアクティブなスレッドを要求します。スレッド内でない場合は失敗します。                                                  |
    | `off`  | バインディングなし。セッションは未バインドで開始します。                                                                 |

    注意:

    - スレッドバインディングではないサーフェスでは、デフォルトの挙動は実質的に `off` です。
    - スレッドバインドされたスポーンには、チャネルポリシーのサポートが必要です:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - 子スレッドを作成せずに現在の会話を固定したい場合は、`--bind here` を使用します。

  </Tab>
</Tabs>

## 配信モデル

ACP セッションは、対話型ワークスペースにも、親が所有するバックグラウンド作業にもなり得ます。配信パスはその形に依存します。

<AccordionGroup>
  <Accordion title="対話型 ACP セッション">
    対話型セッションは、可視のチャットサーフェスで会話を続けることを意図しています:

    - `/acp spawn ... --bind here` は、現在の会話を ACP セッションにバインドします。
    - `/acp spawn ... --thread ...` は、チャネルスレッド/トピックを ACP セッションにバインドします。
    - 永続的な設定済み `bindings[].type="acp"` は、一致する会話を同じ ACP セッションにルーティングします。

    バインド済み会話内の後続メッセージは ACP セッションに直接ルーティングされ、ACP 出力は同じチャネル/スレッド/トピックに返送されます。

    OpenClaw がハーネスに送信する内容:

    - 通常のバインド済み後続メッセージは、プロンプトテキストとして送信されます。添付ファイルは、ハーネス/バックエンドがサポートしている場合にのみ追加されます。
    - `/acp` 管理コマンドとローカル Gateway コマンドは、ACP ディスパッチ前にインターセプトされます。
    - ランタイム生成の完了イベントはターゲットごとに実体化されます。OpenClaw エージェントは OpenClaw の内部ランタイムコンテキストエンベロープを受け取り、外部 ACP ハーネスは子の結果と指示を含むプレーンなプロンプトを受け取ります。生の `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` エンベロープを外部ハーネスに送信したり、ACP ユーザートランスクリプトテキストとして永続化したりしてはいけません。
    - ACP トランスクリプトエントリは、ユーザーに表示されるトリガーテキストまたはプレーンな完了プロンプトを使用します。内部イベントメタデータは可能な場合は OpenClaw 内で構造化されたままとなり、ユーザー作成のチャット内容として扱われません。

  </Accordion>
  <Accordion title="親が所有する1回限りの ACP セッション">
    別のエージェント実行によってスポーンされた1回限りの ACP セッションは、サブエージェントに似たバックグラウンドの子です:

    - 親は `sessions_spawn({ runtime: "acp", mode: "run" })` で作業を依頼します。
    - 子は自身の ACP ハーネスセッション内で実行されます。
    - 子ターンはネイティブサブエージェントのスポーンで使用されるものと同じバックグラウンドレーンで実行されるため、遅い ACP ハーネスが無関係なメインセッション作業をブロックしません。
    - 完了はタスク完了アナウンスパスを通じて報告されます。OpenClaw は、外部ハーネスに送信する前に内部完了メタデータをプレーンな ACP プロンプトに変換するため、ハーネスは OpenClaw 専用のランタイムコンテキストマーカーを見ません。
    - ユーザー向けの返信が有用な場合、親は子の結果を通常のアシスタントの声で書き直します。

    このパスを、親と子の間のピアツーピアチャットとして扱わないでください。子にはすでに親へ戻る完了チャネルがあります。

  </Accordion>
  <Accordion title="sessions_send と A2A 配信">
    `sessions_send` はスポーン後に別のセッションをターゲットにできます。通常のピアセッションでは、OpenClaw はメッセージを注入した後、エージェント間（A2A）の後続パスを使用します:

    - ターゲットセッションの返信を待ちます。
    - 必要に応じて、要求元とターゲットが制限された回数の後続ターンを交換できるようにします。
    - ターゲットにアナウンスメッセージを生成するよう依頼します。
    - そのアナウンスを可視のチャネルまたはスレッドに配信します。

    その A2A パスは、送信者が可視の後続メッセージを必要とするピア送信のフォールバックです。無関係なセッションが ACP ターゲットを見てメッセージできる場合、たとえば広い `tools.sessions.visibility` 設定の下でも、有効なままです。

    OpenClaw が A2A のフォローアップをスキップするのは、リクエスト元が
    自分の親が所有するワンショット ACP 子の親である場合だけです。この場合、
    タスク完了の上で A2A を実行すると、子の結果で親が起動し、
    親の返信が子に戻され、親子間のエコーループが作られる可能性があります。
    その所有子ケースでは、完了パスがすでに結果を担当しているため、
    `sessions_send` の結果は `delivery.status="skipped"` を報告します。

  </Accordion>
  <Accordion title="既存セッションを再開する">
    新規に開始する代わりに、以前の ACP セッションを続行するには
    `resumeSessionId` を使用します。エージェントは `session/load` を通じて
    会話履歴を再生するため、以前の完全なコンテキストを引き継いで再開します。

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    一般的なユースケース:

    - Codex セッションをノート PC からスマートフォンに引き継ぐ - エージェントに、前回の続きから再開するよう伝えます。
    - CLI で対話的に開始したコーディングセッションを、今度はエージェント経由でヘッドレスに続行する。
    - Gateway の再起動やアイドルタイムアウトで中断された作業を再開する。

    注意:

    - `resumeSessionId` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `streamTo` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `resumeSessionId` はホストローカルの ACP/ハーネス再開 ID であり、OpenClaw チャネルセッションキーではありません。OpenClaw はディスパッチ前に ACP のスポーンポリシーとターゲットエージェントポリシーを引き続き確認しますが、そのアップストリーム ID を読み込むための認可は ACP バックエンドまたはハーネスが所有します。
    - `resumeSessionId` はアップストリーム ACP の会話履歴を復元します。`thread` と `mode` は、作成中の新しい OpenClaw セッションに通常どおり適用されるため、`mode: "session"` には引き続き `thread: true` が必要です。
    - ターゲットエージェントは `session/load` をサポートしている必要があります（Codex と Claude Code はサポートしています）。
    - セッション ID が見つからない場合、スポーンは明確なエラーで失敗します。新しいセッションへのサイレントフォールバックはありません。

  </Accordion>
  <Accordion title="デプロイ後のスモークテスト">
    Gateway のデプロイ後は、ユニットテストを信頼するだけでなく、
    ライブのエンドツーエンド確認を実行します。

    1. ターゲットホスト上で、デプロイされた Gateway のバージョンとコミットを確認します。
    2. ライブエージェントへの一時的な ACPX ブリッジセッションを開きます。
    3. そのエージェントに、`runtime: "acp"`、`agentId: "codex"`、`mode: "run"`、タスク `Reply with exactly LIVE-ACP-SPAWN-OK` で `sessions_spawn` を呼び出すよう依頼します。
    4. `accepted=yes`、実際の `childSessionKey`、バリデーターエラーがないことを確認します。
    5. 一時的なブリッジセッションをクリーンアップします。

    ゲートは `mode: "run"` のままにし、`streamTo: "parent"` はスキップします。
    スレッドに紐づく `mode: "session"` とストリームリレーパスは、
    別のより豊富な統合確認です。

  </Accordion>
</AccordionGroup>

## サンドボックス互換性

ACP セッションは現在、OpenClaw サンドボックス内ではなく、
ホストランタイム上で実行されます。

<Warning>
**セキュリティ境界:**

- 外部ハーネスは、自身の CLI 権限と選択された `cwd` に従って読み書きできます。
- OpenClaw のサンドボックスポリシーは ACP ハーネスの実行を**ラップしません**。
- OpenClaw は引き続き、ACP フィーチャーゲート、許可されたエージェント、セッション所有権、チャネルバインディング、Gateway 配信ポリシーを強制します。
- サンドボックスで強制される OpenClaw ネイティブの作業には `runtime: "subagent"` を使用します。

</Warning>

現在の制限:

- リクエスト元セッションがサンドボックス化されている場合、`sessions_spawn({ runtime: "acp" })` と `/acp spawn` の両方で ACP スポーンはブロックされます。
- `runtime: "acp"` を指定した `sessions_spawn` は `sandbox: "require"` をサポートしません。

## セッションターゲットの解決

ほとんどの `/acp` アクションは、任意のセッションターゲット（`session-key`、
`session-id`、または `session-label`）を受け付けます。

**解決順序:**

1. 明示的なターゲット引数（または `/acp steer` の `--session`）
   - キーを試す
   - 次に UUID 形式のセッション ID
   - 次にラベル
2. 現在のスレッドバインディング（この会話/スレッドが ACP セッションに紐づいている場合）。
3. 現在のリクエスト元セッションへのフォールバック。

現在の会話バインディングとスレッドバインディングは、どちらも
ステップ 2 に参加します。

ターゲットが解決されない場合、OpenClaw は明確なエラー
（`Unable to resolve session target: ...`）を返します。

## ACP の制御

| コマンド             | 実行内容                                                  | 例                                                            |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP セッションを作成します。任意で現在のバインドまたはスレッドバインドを指定できます。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ターゲットセッションの実行中ターンをキャンセルします。    | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 実行中セッションにステア指示を送信します。                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | セッションを閉じ、スレッドターゲットのバインドを解除します。 | `/acp close`                                                  |
| `/acp status`        | バックエンド、モード、状態、ランタイムオプション、ケイパビリティを表示します。 | `/acp status`                                                 |
| `/acp set-mode`      | ターゲットセッションのランタイムモードを設定します。      | `/acp set-mode plan`                                          |
| `/acp set`           | 汎用ランタイム設定オプションを書き込みます。              | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ランタイムの作業ディレクトリ上書きを設定します。          | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 承認ポリシープロファイルを設定します。                    | `/acp permissions strict`                                     |
| `/acp timeout`       | ランタイムタイムアウト（秒）を設定します。                | `/acp timeout 120`                                            |
| `/acp model`         | ランタイムモデルの上書きを設定します。                    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | セッションのランタイムオプション上書きを削除します。      | `/acp reset-options`                                          |
| `/acp sessions`      | ストア内の最近の ACP セッションを一覧表示します。         | `/acp sessions`                                               |
| `/acp doctor`        | バックエンドの健全性、ケイパビリティ、実行可能な修正を表示します。 | `/acp doctor`                                                 |
| `/acp install`       | 決定的なインストール手順と有効化手順を出力します。        | `/acp install`                                                |

ランタイム制御（`spawn`、`cancel`、`steer`、`close`、`status`、`set-mode`、
`set`、`cwd`、`permissions`、`timeout`、`model`、`reset-options`）には、
外部チャネルからの所有者 ID と、内部 Gateway クライアントからの
`operator.admin` が必要です。認可された非所有者の送信者も、`sessions`、
`doctor`、`install`、`help` は引き続き使用できます。

`/acp status` は、有効なランタイムオプションに加えて、ランタイムレベルと
バックエンドレベルのセッション識別子を表示します。バックエンドにケイパビリティが
ない場合、サポートされない制御のエラーは明確に表示されます。`/acp sessions` は、
現在バインドされているセッションまたはリクエスト元セッションのストアを読み取ります。
ターゲットトークン（`session-key`、`session-id`、または `session-label`）は、
エージェントごとのカスタム `session.store` ルートを含む Gateway セッション検出を
通じて解決されます。

### ランタイムオプションのマッピング

`/acp` には便利なコマンドと汎用セッターがあります。同等の操作:

| コマンド                     | マップ先                             | 注意                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | ランタイム設定キー `model`           | Codex ACP では、OpenClaw は `openai/<model>` をアダプターモデル ID に正規化し、`openai/gpt-5.4/high` のようなスラッシュ付き推論サフィックスを `reasoning_effort` にマップします。                         |
| `/acp set thinking <level>`  | 正規オプション `thinking`            | OpenClaw は、存在する場合はバックエンドが広告する同等のものを送信し、`thinking`、次に `effort`、`reasoning_effort`、または `thought_level` を優先します。Codex ACP では、アダプターが値を `reasoning_effort` にマップします。 |
| `/acp permissions <profile>` | 正規オプション `permissionProfile`   | OpenClaw は、存在する場合は `approval_policy`、`permission_profile`、`permissions`、`permission_mode` など、バックエンドが広告する同等のものを送信します。                                                |
| `/acp timeout <seconds>`     | 正規オプション `timeoutSeconds`      | OpenClaw は、存在する場合は `timeout` や `timeout_seconds` など、バックエンドが広告する同等のものを送信します。                                                                                            |
| `/acp cwd <path>`            | ランタイム cwd 上書き                | 直接更新します。                                                                                                                                                                                           |
| `/acp set <key> <value>`     | 汎用                                 | `key=cwd` は cwd 上書きパスを使用します。                                                                                                                                                                  |
| `/acp reset-options`         | すべてのランタイム上書きをクリアします | -                                                                                                                                                                                                          |

## acpx ハーネス、Plugin セットアップ、権限

acpx ハーネス設定（Claude Code / Codex / Gemini CLI
エイリアス）、plugin-tools と OpenClaw-tools MCP ブリッジ、ACP
権限モードについては、
[ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup)を参照してください。

## トラブルシューティング

| 症状                                                                                      | 考えられる原因                                                                                                         | 修正                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                                   | バックエンド Plugin が見つからない、無効化されている、または `plugins.allow` によってブロックされています。            | バックエンド Plugin をインストールして有効化し、その許可リストが設定されている場合は `plugins.allow` に `acpx` を含めてから、`/acp doctor` を実行します。                |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP がグローバルに無効化されています。                                                                                 | `acp.enabled=true` を設定します。                                                                                                                                        |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | 通常のスレッドメッセージからの自動ディスパッチが無効化されています。                                                   | 自動スレッドルーティングを再開するには `acp.dispatch.enabled=true` を設定します。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き機能します。             |
| `ACP agent "<id>" is not allowed by policy`                                               | エージェントが許可リストに含まれていません。                                                                           | 許可された `agentId` を使用するか、`acp.allowedAgents` を更新します。                                                                                                    |
| `/acp doctor` が起動直後にバックエンド未準備と報告する                                   | バックエンド Plugin が見つからない、無効化されている、許可/拒否ポリシーでブロックされている、または設定済み実行ファイルが利用できません。 | バックエンド Plugin をインストール/有効化し、`/acp doctor` を再実行します。正常でない状態が続く場合は、バックエンドのインストールまたはポリシーエラーを調べます。         |
| ハーネスコマンドが見つからない                                                           | アダプター CLI がインストールされていない、外部 Plugin が見つからない、または Codex 以外のアダプターで初回実行時の `npx` 取得に失敗しました。 | `/acp doctor` を実行し、Gateway ホスト上でアダプターをインストール/プリウォームするか、acpx エージェントコマンドを明示的に設定します。                                  |
| ハーネスから model-not-found が返る                                                       | モデル ID は別のプロバイダー/ハーネスでは有効ですが、この ACP ターゲットでは有効ではありません。                      | そのハーネスが一覧表示するモデルを使用する、ハーネス内でモデルを設定する、またはオーバーライドを省略します。                                                             |
| ハーネスからベンダー認証エラーが返る                                                     | OpenClaw は正常ですが、ターゲット CLI/プロバイダーにログインしていません。                                             | Gateway ホスト環境でログインするか、必要なプロバイダーキーを指定します。                                                                                                |
| `Unable to resolve session target: ...`                                                   | キー/ID/ラベルトークンが正しくありません。                                                                             | `/acp sessions` を実行し、正確なキー/ラベルをコピーして再試行します。                                                                                                    |
| `--bind here requires running /acp spawn inside an active ... conversation`               | アクティブなバインド可能会話なしで `--bind here` が使用されました。                                                    | ターゲットのチャット/チャンネルに移動して再試行するか、バインドなしの spawn を使用します。                                                                               |
| `Conversation bindings are unavailable for <channel>.`                                    | アダプターに現在の会話の ACP バインド機能がありません。                                                               | サポートされている場合は `/acp spawn ... --thread ...` を使用する、トップレベルの `bindings[]` を設定する、またはサポートされているチャンネルに移動します。               |
| `--thread here requires running /acp spawn inside an active ... thread`                   | `--thread here` がスレッドコンテキスト外で使用されました。                                                            | ターゲットスレッドに移動するか、`--thread auto`/`off` を使用します。                                                                                                     |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | 別のユーザーがアクティブなバインド先を所有しています。                                                                 | 所有者として再バインドするか、別の会話またはスレッドを使用します。                                                                                                       |
| `Thread bindings are unavailable for <channel>.`                                          | アダプターにスレッドバインド機能がありません。                                                                         | `--thread off` を使用するか、サポートされているアダプター/チャンネルに移動します。                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | ACP ランタイムはホスト側です。要求元セッションはサンドボックス化されています。                                        | サンドボックス化されたセッションからは `runtime="subagent"` を使用するか、サンドボックス化されていないセッションから ACP spawn を実行します。                            |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | ACP ランタイムに対して `sandbox="require"` が要求されました。                                                          | 必須のサンドボックス化には `runtime="subagent"` を使用するか、サンドボックス化されていないセッションから `sandbox="inherit"` で ACP を使用します。                        |
| `Cannot apply --model ... did not advertise model support`                                | ターゲットハーネスが汎用 ACP モデル切り替えを公開していません。                                                       | ACP `models`/`session/set_model` を通知するハーネスを使用する、Codex ACP モデル参照を使用する、または独自の起動フラグがある場合はハーネス内でモデルを直接設定します。      |
| バインド済みセッションの ACP メタデータがない                                             | 古い/削除済みの ACP セッションメタデータです。                                                                         | `/acp spawn` で再作成してから、スレッドを再バインド/フォーカスします。                                                                                                   |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | 非対話型 ACP セッションで `permissionMode` が書き込み/実行をブロックしています。                                      | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定し、Gateway を再起動します。[権限設定](/ja-JP/tools/acp-agents-setup#permission-configuration)を参照してください。 |
| ACP セッションが出力の少ない早い段階で失敗する                                           | 権限プロンプトが `permissionMode`/`nonInteractivePermissions` によってブロックされています。                          | Gateway ログで `AcpRuntimeError` を確認します。完全な権限には `permissionMode=approve-all` を設定します。正常な縮退には `nonInteractivePermissions=deny` を設定します。   |
| ACP セッションが作業完了後に無期限に停止する                                             | ハーネスプロセスは終了しましたが、ACP セッションが完了を報告しませんでした。                                           | OpenClaw を更新してください。現在の acpx クリーンアップは、終了時と Gateway 起動時に OpenClaw 所有の古いラッパーおよびアダプタープロセスを回収します。                  |
| ハーネスに `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` が見える                              | 内部イベントエンベロープが ACP 境界を越えて漏れています。                                                            | OpenClaw を更新し、完了フローを再実行してください。外部ハーネスはプレーンな完了プロンプトのみを受け取るべきです。                                                       |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` は
ACP/acpx ではなくネイティブ Codex フックリレーに属します。バインド済みの Codex チャットでは、
`/new` または `/reset` で新しいセッションを開始してください。一度は動作し、その後次のネイティブツール呼び出しで再発する場合は、
`/new` を繰り返すのではなく、Codex app-server または OpenClaw Gateway を再起動してください。
[Codex ハーネスのトラブルシューティング](/ja-JP/plugins/codex-harness#troubleshooting)を参照してください。
</Note>

## 関連

- [ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup)
- [エージェント送信](/ja-JP/tools/agent-send)
- [CLI バックエンド](/ja-JP/gateway/cli-backends)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (ブリッジモード)](/ja-JP/cli/acp)
- [サブエージェント](/ja-JP/tools/subagents)
