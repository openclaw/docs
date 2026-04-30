---
read_when:
    - ACP 経由でコーディングハーネスを実行する
    - メッセージングチャネルで会話に紐づく ACP セッションを設定する
    - メッセージチャネルの会話を永続的な ACP セッションにバインドする
    - ACP バックエンド、Plugin の接続設定、または完了結果の配信のトラブルシューティング
    - チャットから /acp コマンドを操作する
sidebarTitle: ACP agents
summary: 外部コーディングハーネス（Claude Code、Cursor、Gemini CLI、明示的な Codex ACP、OpenClaw ACP、OpenCode）を ACP バックエンド経由で実行する
title: ACP エージェント
x-i18n:
    generated_at: "2026-04-30T05:36:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8257bdba22b613093da1a06761fdc5034cae4bca249ae91a531ec3fccabb954
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) セッションにより、
OpenClaw は ACP バックエンド Plugin を通じて外部コーディングハーネス
（たとえば Pi、Claude Code、Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI、およびその他の
対応 ACPX ハーネス）を実行できます。

各 ACP セッションの生成は [バックグラウンドタスク](/ja-JP/automation/tasks) として追跡されます。

<Note>
**ACP は外部ハーネス用の経路であり、デフォルトの Codex 経路ではありません。**
ネイティブの Codex アプリサーバー Plugin は `/codex ...` コントロールと
`agentRuntime.id: "codex"` 埋め込みランタイムを所有し、ACP は
`/acp ...` コントロールと `sessions_spawn({ runtime: "acp" })` セッションを所有します。

Codex または Claude Code を外部 MCP クライアントとして
既存の OpenClaw チャネル会話へ直接接続したい場合は、
ACP ではなく [`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。
</Note>

## どのページを使うべきか？

| やりたいこと                                                                                    | 使用するもの                              | 注記                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 現在の会話で Codex をバインドまたは制御する                                               | `/codex bind`, `/codex threads`       | `codex` Plugin が有効な場合のネイティブ Codex アプリサーバー経路。バインドされたチャット返信、画像転送、モデル/高速/権限、停止、誘導コントロールを含みます。ACP は明示的なフォールバックです |
| Claude Code、Gemini CLI、明示的な Codex ACP、または別の外部ハーネスを OpenClaw _経由で_ 実行する | このページ                             | チャットにバインドされたセッション、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、バックグラウンドタスク、ランタイムコントロール                                                                                   |
| エディタまたはクライアント向けに OpenClaw Gateway セッションを ACP サーバー _として_ 公開する                   | [`openclaw acp`](/ja-JP/cli/acp)            | ブリッジモード。IDE/クライアントは stdio/WebSocket 経由で OpenClaw と ACP で通信します                                                                                                                            |
| ローカル AI CLI をテキストのみのフォールバックモデルとして再利用する                                              | [CLI バックエンド](/ja-JP/gateway/cli-backends) | ACP ではありません。OpenClaw ツール、ACP コントロール、ハーネスランタイムはありません                                                                                                                               |

## これはそのまま動作しますか？

通常ははい。新規インストールには、OpenClaw が起動時にプローブして自己修復する
Plugin ローカルに固定された `acpx` バイナリ付きの、バンドル済み `acpx` ランタイム Plugin が
デフォルトで有効化されて同梱されています。準備状況の確認には `/acp doctor` を実行してください。

OpenClaw は ACP が**本当に使用可能**な場合にのみ、ACP 生成についてエージェントに教えます。
ACP が有効であること、ディスパッチが無効化されていないこと、現在のセッションが
サンドボックスでブロックされていないこと、ランタイムバックエンドが読み込まれていることが
必要です。これらの条件を満たさない場合、ACP Plugin Skills と
`sessions_spawn` の ACP ガイダンスは非表示のままになり、エージェントが
利用できないバックエンドを提案しないようにします。

<AccordionGroup>
  <Accordion title="初回実行時の注意点">
    - `plugins.allow` が設定されている場合、それは制限的な Plugin インベントリであり、**必ず** `acpx` を含める必要があります。そうでない場合、バンドル済みデフォルトは意図的にブロックされ、`/acp doctor` は allowlist エントリの不足を報告します。
    - バンドル済み Codex ACP アダプターは `acpx` Plugin とともにステージングされ、可能な場合はローカルで起動されます。
    - 他のターゲットハーネスアダプターは、初回使用時に `npx` でオンデマンド取得される場合があります。
    - そのハーネスのベンダー認証は、ホスト上に存在している必要があります。
    - ホストに npm またはネットワークアクセスがない場合、キャッシュを事前にウォームするか、別の方法でアダプターをインストールするまで、初回実行時のアダプター取得は失敗します。

  </Accordion>
  <Accordion title="ランタイムの前提条件">
    ACP は実際の外部ハーネスプロセスを起動します。OpenClaw はルーティング、
    バックグラウンドタスク状態、配信、バインディング、ポリシーを所有します。
    ハーネスは、そのプロバイダーログイン、モデルカタログ、ファイルシステム動作、
    ネイティブツールを所有します。

    OpenClaw を疑う前に、次を確認してください。

    - `/acp doctor` が、有効で健全なバックエンドを報告している。
    - その allowlist が設定されている場合、ターゲット ID が `acp.allowedAgents` で許可されている。
    - ハーネスコマンドを Gateway ホスト上で起動できる。
    - そのハーネスのプロバイダー認証が存在している（`claude`、`codex`、`gemini`、`opencode`、`droid` など）。
    - 選択したモデルがそのハーネスに存在している。モデル ID はハーネス間で移植可能ではありません。
    - 要求した `cwd` が存在しアクセス可能である。または `cwd` を省略し、バックエンドにデフォルトを使わせる。
    - 権限モードが作業に一致している。非対話型セッションはネイティブ権限プロンプトをクリックできないため、書き込み/実行が多いコーディング実行では通常、ヘッドレスで進行できる ACPX 権限プロファイルが必要です。

  </Accordion>
</AccordionGroup>

OpenClaw Plugin ツールと組み込み OpenClaw ツールは、デフォルトでは
ACP ハーネスに公開されません。ハーネスがそれらのツールを直接呼び出す必要がある場合にのみ、
[ACP エージェント — セットアップ](/ja-JP/tools/acp-agents-setup) で明示的な MCP ブリッジを有効にしてください。

## 対応ハーネスターゲット

バンドル済み `acpx` バックエンドでは、これらのハーネス ID を `/acp spawn <id>` または
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` のターゲットとして使用します。

| ハーネス ID | 一般的なバックエンド                                | 注記                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP アダプター                        | ホスト上に Claude Code 認証が必要です。                                              |
| `codex`    | Codex ACP アダプター                              | ネイティブ `/codex` が利用できない場合、または ACP が要求された場合のみの明示的な ACP フォールバックです。 |
| `copilot`  | GitHub Copilot ACP アダプター                     | Copilot CLI/ランタイム認証が必要です。                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | ローカルインストールが別の ACP エントリポイントを公開している場合は、acpx コマンドを上書きします。    |
| `droid`    | Factory Droid CLI                              | ハーネス環境に Factory/Droid 認証または `FACTORY_API_KEY` が必要です。        |
| `gemini`   | Gemini CLI ACP アダプター                         | Gemini CLI 認証または API キー設定が必要です。                                          |
| `iflow`    | iFlow CLI                                      | アダプターの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `kilocode` | Kilo Code CLI                                  | アダプターの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `kimi`     | Kimi/Moonshot CLI                              | ホスト上に Kimi/Moonshot 認証が必要です。                                            |
| `kiro`     | Kiro CLI                                       | アダプターの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `opencode` | OpenCode ACP アダプター                           | OpenCode CLI/プロバイダー認証が必要です。                                                |
| `openclaw` | `openclaw acp` 経由の OpenClaw Gateway ブリッジ | ACP 対応ハーネスが OpenClaw Gateway セッションへ話しかけられるようにします。                 |
| `pi`       | Pi/埋め込み OpenClaw ランタイム                   | OpenClaw ネイティブハーネス実験に使用されます。                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | ホスト上に Qwen 互換認証が必要です。                                          |

カスタム acpx エージェントエイリアスは acpx 自体で構成できますが、OpenClaw の
ポリシーはディスパッチ前に引き続き `acp.allowedAgents` と
`agents.list[].runtime.acp.agent` マッピングを確認します。

## オペレーターランブック

チャットからのクイック `/acp` フロー:

<Steps>
  <Step title="生成">
    `/acp spawn claude --bind here`、
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
    `/acp model <provider/model>`、
    `/acp permissions <profile>`、
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
    - 生成は ACP ランタイムセッションを作成または再開し、OpenClaw セッションストアに ACP メタデータを記録し、実行が親所有の場合はバックグラウンドタスクを作成することがあります。
    - 親所有の ACP セッションは、ランタイムセッションが永続的であってもバックグラウンド作業として扱われます。完了とサーフェス間配信は、通常のユーザー向けチャットセッションのように動作するのではなく、親タスク通知経由で行われます。
    - タスクメンテナンスは、終端状態または孤立した親所有の一回限り ACP セッションを閉じます。永続 ACP セッションは、アクティブな会話バインディングが残っている間は保持されます。アクティブなバインディングがない古い永続セッションは、所有タスクが完了した後、またはそのタスクレコードがなくなった後に、黙って再開されないよう閉じられます。
    - バインドされたフォローアップメッセージは、バインディングが閉じられる、フォーカス解除される、リセットされる、または期限切れになるまで、ACP セッションへ直接送られます。
    - Gateway コマンドはローカルに留まります。`/acp ...`、`/status`、`/unfocus` は、通常のプロンプトテキストとしてバインドされた ACP ハーネスへ送信されることはありません。
    - `cancel` は、バックエンドがキャンセルをサポートしている場合にアクティブなターンを中止します。バインディングやセッションメタデータは削除しません。
    - `close` は OpenClaw の視点から ACP セッションを終了し、バインディングを削除します。ハーネスが再開をサポートしている場合、ハーネス側では独自の上流履歴を保持することがあります。
    - アイドル状態のランタイムワーカーは、`acp.runtime.ttlMinutes` 後にクリーンアップ対象になります。保存済みセッションメタデータは `/acp sessions` で引き続き利用できます。

  </Accordion>
  <Accordion title="ネイティブ Codex ルーティング規則">
    有効な場合に**ネイティブ Codex
    Plugin** へルーティングされるべき自然言語トリガー:

    - 「この Discord チャネルを Codex にバインドして。」
    - 「このチャットを Codex スレッド `<id>` にアタッチして。」
    - 「Codex スレッドを表示してから、これをバインドして。」

    ネイティブ Codex 会話バインディングは、デフォルトのチャット制御経路です。
    OpenClaw 動的ツールは引き続き OpenClaw 経由で実行される一方、
    シェル/apply-patch などの Codex ネイティブツールは Codex 内で実行されます。
    Codex ネイティブツールイベントについて、OpenClaw はターンごとのネイティブ
    フックリレーを注入し、Plugin フックが `before_tool_call` をブロックし、
    `after_tool_call` を監視し、Codex `PermissionRequest` イベントを
    OpenClaw 承認経由でルーティングできるようにします。Codex `Stop` フックは
    OpenClaw `before_agent_finalize` に中継され、そこで Plugin は Codex が回答を確定する前に
    もう 1 回モデルパスを要求できます。このリレーは意図的に保守的なままです。
    Codex ネイティブツール引数を変更したり、Codex スレッドレコードを書き換えたりしません。
    ACP ランタイム/セッションモデルが必要な場合にのみ、明示的な ACP を使用してください。
    埋め込み Codex サポートの境界は、
    [Codex ハーネス v1 サポート契約](/ja-JP/plugins/codex-harness#v1-support-contract) に記載されています。

  </Accordion>
  <Accordion title="モデル / プロバイダー / ランタイム選択チートシート">
    - `openai-codex/*` — PI Codex OAuth/サブスクリプションルート。
    - `openai/*` と `agentRuntime.id: "codex"` — ネイティブ Codex アプリサーバー組み込みランタイム。
    - `/codex ...` — ネイティブ Codex 会話制御。
    - `/acp ...` または `runtime: "acp"` — 明示的な ACP/acpx 制御。

  </Accordion>
  <Accordion title="ACP ルーティングの自然言語トリガー">
    ACP ランタイムへルーティングするべきトリガー:

    - "これをワンショットの Claude Code ACP セッションとして実行し、結果を要約してください。"
    - "このタスクではスレッド内で Gemini CLI を使用し、その後のフォローアップを同じスレッドに保持してください。"
    - "バックグラウンドスレッドで ACP 経由で Codex を実行してください。"

    OpenClaw は `runtime: "acp"` を選択し、ハーネス `agentId` を解決し、
    対応している場合は現在の会話またはスレッドにバインドし、
    クローズまたは期限切れまでフォローアップをそのセッションへルーティングします。Codex は、
    ACP/acpx が明示されている場合、または要求された操作でネイティブ Codex
    plugin が利用できない場合にのみ、このパスに従います。

    `sessions_spawn` では、ACP が有効で、リクエスターがサンドボックス化されておらず、
    ACP ランタイムバックエンドがロードされている場合にのみ、`runtime: "acp"` が通知されます。
    `acp.dispatch.enabled=false` は自動 ACP スレッドディスパッチを一時停止しますが、
    明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しを隠したりブロックしたりしません。
    これは `codex`、`claude`、`droid`、`gemini`、`opencode` などの ACP ハーネス ID を対象にします。
    そのエントリが `agents.list[].runtime.type="acp"` で明示的に設定されていない限り、
    `agents_list` から通常の OpenClaw 設定エージェント ID を渡さないでください。
    それ以外の場合は、デフォルトのサブエージェントランタイムを使用します。OpenClaw エージェントが
    `runtime.type="acp"` で設定されている場合、OpenClaw は
    `runtime.acp.agent` を基盤となるハーネス ID として使用します。

  </Accordion>
</AccordionGroup>

## ACP とサブエージェントの比較

外部ハーネスランタイムを使いたい場合は ACP を使用します。`codex`
plugin が有効な場合に Codex 会話のバインド/制御を行うには、**ネイティブ Codex
アプリサーバー**を使用します。OpenClaw ネイティブの委任実行を使いたい場合は、
**サブエージェント**を使用します。

| 領域          | ACP セッション                           | サブエージェント実行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| ランタイム       | ACP バックエンド plugin (例: acpx) | OpenClaw ネイティブサブエージェントランタイム  |
| セッションキー   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| メインコマンド | `/acp ...`                            | `/subagents ...`                   |
| 起動ツール    | `runtime:"acp"` を指定した `sessions_spawn` | `sessions_spawn` (デフォルトランタイム) |

[サブエージェント](/ja-JP/tools/subagents)も参照してください。

## ACP が Claude Code を実行する方法

ACP 経由の Claude Code では、スタックは次のとおりです。

1. OpenClaw ACP セッション制御プレーン。
2. バンドルされた `acpx` ランタイム plugin。
3. Claude ACP アダプター。
4. Claude 側のランタイム/セッション機構。

ACP Claude は、ACP 制御、セッション再開、バックグラウンドタスク追跡、
任意の会話/スレッドバインドを備えた**ハーネスセッション**です。

CLI バックエンドは、テキスト専用の別個のローカルフォールバックランタイムです。
[CLI バックエンド](/ja-JP/gateway/cli-backends)を参照してください。

運用者向けの実用的なルールは次のとおりです。

- **`/acp spawn`、バインド可能なセッション、ランタイム制御、または永続的なハーネス作業が必要ですか?** ACP を使用します。
- **生の CLI 経由の単純なローカルテキストフォールバックが必要ですか?** CLI バックエンドを使用します。

## バインドされたセッション

### メンタルモデル

- **チャットサーフェス** — 人々が会話を続ける場所 (Discord チャンネル、Telegram トピック、iMessage チャット)。
- **ACP セッション** — OpenClaw がルーティングする、永続的な Codex/Claude/Gemini ランタイム状態。
- **子スレッド/トピック** — `--thread ...` によってのみ作成される任意の追加メッセージングサーフェス。
- **ランタイムワークスペース** — ハーネスが実行されるファイルシステム上の場所 (`cwd`、リポジトリチェックアウト、バックエンドワークスペース)。チャットサーフェスから独立しています。

### 現在の会話へのバインド

`/acp spawn <harness> --bind here` は、現在の会話を生成された ACP セッションに固定します。
子スレッドはなく、同じチャットサーフェスです。OpenClaw は引き続き、
トランスポート、認証、安全性、配信を所有します。その会話内のフォローアップメッセージは
同じセッションへルーティングされます。`/new` と `/reset` はセッションをその場でリセットし、
`/acp close` はバインドを削除します。

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
  <Accordion title="バインドルールと排他性">
    - `--bind here` と `--thread ...` は同時に使用できません。
    - `--bind here` は、現在の会話へのバインド機能を通知するチャンネルでのみ機能します。それ以外の場合、OpenClaw は明確な非対応メッセージを返します。バインドは Gateway の再起動後も保持されます。
    - Discord では、`spawnAcpSessions` が必要になるのは、OpenClaw が `--thread auto|here` のために子スレッドを作成する必要がある場合のみです。`--bind here` では必要ありません。
    - `--cwd` なしで別の ACP エージェントを生成した場合、OpenClaw はデフォルトで**ターゲットエージェントの**ワークスペースを継承します。継承されたパスが存在しない場合 (`ENOENT`/`ENOTDIR`) はバックエンドのデフォルトにフォールバックします。それ以外のアクセスエラー (例: `EACCES`) は生成エラーとして表面化します。
    - Gateway 管理コマンドは、バインドされた会話内ではローカルのままです。通常のフォローアップテキストがバインドされた ACP セッションへルーティングされる場合でも、`/acp ...` コマンドは OpenClaw によって処理されます。`/status` と `/unfocus` も、そのサーフェスでコマンド処理が有効な場合は常にローカルのままです。

  </Accordion>
  <Accordion title="スレッドにバインドされたセッション">
    チャンネルアダプターでスレッドバインドが有効な場合:

    - OpenClaw はスレッドをターゲット ACP セッションにバインドします。
    - そのスレッド内のフォローアップメッセージは、バインドされた ACP セッションへルーティングされます。
    - ACP の出力は同じスレッドへ返送されます。
    - フォーカス解除/クローズ/アーカイブ/アイドルタイムアウト、または最大期間の期限切れによりバインドが削除されます。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status`、`/unfocus` は Gateway コマンドであり、ACP ハーネスへのプロンプトではありません。

    スレッドにバインドされた ACP に必要な機能フラグ:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` はデフォルトでオンです (自動 ACP スレッドディスパッチを一時停止するには `false` に設定します。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き機能します)。
    - チャンネルアダプターの ACP スレッド生成フラグが有効 (アダプター固有):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    スレッドバインドのサポートはアダプター固有です。アクティブなチャンネルアダプターが
    スレッドバインドをサポートしていない場合、OpenClaw は明確な
    非対応/利用不可メッセージを返します。

  </Accordion>
  <Accordion title="スレッドをサポートするチャンネル">
    - セッション/スレッドバインド機能を公開する任意のチャンネルアダプター。
    - 現在の組み込みサポート: **Discord** スレッド/チャンネル、**Telegram** トピック (グループ/スーパーグループ内のフォーラムトピック、および DM トピック)。
    - Plugin チャンネルは同じバインドインターフェイスを通じてサポートを追加できます。

  </Accordion>
</AccordionGroup>

## 永続的なチャンネルバインド

非一時的なワークフローでは、トップレベルの `bindings[]` エントリで
永続的な ACP バインドを設定します。

### バインドモデル

<ParamField path="bindings[].type" type='"acp"'>
  永続的な ACP 会話バインドを示します。
</ParamField>
<ParamField path="bindings[].match" type="object">
  ターゲット会話を識別します。チャンネルごとの形式:

- **Discord チャンネル/スレッド:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram フォーラムトピック:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/グループ:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。安定したグループバインドには `chat_id:*` または `chat_identifier:*` を優先してください。
- **iMessage DM/グループ:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。安定したグループバインドには `chat_id:*` を優先してください。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  所有する OpenClaw エージェント ID。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  任意の ACP オーバーライド。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  任意の運用者向けラベル。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  任意のランタイム作業ディレクトリ。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  任意のバックエンドオーバーライド。
</ParamField>

### エージェントごとのランタイムデフォルト

`agents.list[].runtime` を使用して、エージェントごとに ACP デフォルトを一度だけ定義します。

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ハーネス ID、例: `codex` または `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP バインドセッションのオーバーライド優先順位:**

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
- バインドされた会話では、`/new` と `/reset` は同じ ACP セッションキーをその場でリセットします。
- 一時的なランタイムバインド (たとえばスレッドフォーカスフローによって作成されたもの) は、存在する場所では引き続き適用されます。
- 明示的な `cwd` なしのクロスエージェント ACP 生成では、OpenClaw はエージェント設定からターゲットエージェントワークスペースを継承します。
- 継承されたワークスペースパスが存在しない場合はバックエンドのデフォルト cwd にフォールバックします。存在するがアクセスに失敗する場合は生成エラーとして表面化します。

## ACP セッションを開始する

ACP セッションを開始する方法は 2 つあります。

<Tabs>
  <Tab title="sessions_spawn から">
    `runtime: "acp"` を使用して、エージェントターンまたは
    ツール呼び出しから ACP セッションを開始します。

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
    `runtime` のデフォルトは `subagent` のため、ACP セッションでは明示的に
    `runtime: "acp"` を設定してください。`agentId` が省略された場合、設定されていれば
    OpenClaw は `acp.defaultAgent` を使用します。永続的に紐付けられた会話を保持するには、
    `mode: "session"` に `thread: true` が必要です。
    </Note>

  </Tab>
  <Tab title="/acp コマンドから">
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
  ACP セッションに送信される初期プロンプト。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP セッションでは `"acp"` である必要があります。
</ParamField>
<ParamField path="agentId" type="string">
  ACP ターゲットハーネス ID。設定されている場合は `acp.defaultAgent` にフォールバックします。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  サポートされている場合、スレッド紐付けフローを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` はワンショット、`"session"` は永続的です。`thread: true` で
  `mode` が省略された場合、OpenClaw はランタイムパスごとに永続的な動作を
  デフォルトにすることがあります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cwd" type="string">
  要求されたランタイム作業ディレクトリ（バックエンド/ランタイムポリシーによって検証されます）。
  省略された場合、ACP spawn は設定されていればターゲットエージェントのワークスペースを
  継承します。継承されたパスがない場合はバックエンドのデフォルトにフォールバックし、
  実際のアクセスエラーは返されます。
</ParamField>
<ParamField path="label" type="string">
  セッション/バナーテキストで使用されるオペレーター向けラベル。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  新しいセッションを作成する代わりに、既存の ACP セッションを再開します。
  エージェントは `session/load` を通じて会話履歴を再生します。
  `runtime: "acp"` が必要です。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` は、初期 ACP 実行の進行状況サマリーをシステムイベントとして
  要求元セッションへストリームします。受理されたレスポンスには、完全なリレー履歴を
  tail できるセッションスコープの JSONL ログ（`<sessionId>.acp-stream.jsonl`）を指す
  `streamLogPath` が含まれます。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  N 秒後に ACP 子ターンを中止します。`0` はターンを Gateway の
  タイムアウトなしパスに保持します。同じ値が Gateway 実行と ACP ランタイムに適用されるため、
  停止したハーネスやクォータを使い切ったハーネスが親エージェントのレーンを
  無期限に占有しません。
</ParamField>
<ParamField path="model" type="string">
  ACP 子セッションの明示的なモデル上書き。Codex ACP spawn は、
  `openai-codex/gpt-5.4` などの OpenClaw Codex 参照を `session/new` の前に
  Codex ACP 起動設定へ正規化します。`openai-codex/gpt-5.4/high` のような
  スラッシュ形式も Codex ACP の推論エフォートを設定します。他のハーネスは ACP `models` を
  広告し、`session/set_model` をサポートする必要があります。そうでない場合、
  OpenClaw/acpx はターゲットエージェントのデフォルトへ黙ってフォールバックするのではなく、
  明確に失敗します。
</ParamField>
<ParamField path="thinking" type="string">
  明示的な思考/推論エフォート。Codex ACP では、`minimal` は低エフォートに対応し、
  `low`/`medium`/`high`/`xhigh` は直接対応し、`off` は推論エフォートの起動上書きを省略します。
</ParamField>

## spawn の紐付けモードとスレッドモード

<Tabs>
  <Tab title="--bind here|off">
    | モード   | 動作                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 現在アクティブな会話をその場で紐付けます。アクティブな会話がない場合は失敗します。 |
    | `off`  | 現在の会話の紐付けを作成しません。                          |

    注:

    - `--bind here` は、「このチャンネルまたはチャットを Codex バックにする」ための最も単純なオペレーターパスです。
    - `--bind here` は子スレッドを作成しません。
    - `--bind here` は、現在の会話の紐付けサポートを公開しているチャンネルでのみ使用できます。
    - `--bind` と `--thread` は同じ `/acp spawn` 呼び出しで組み合わせることはできません。

  </Tab>
  <Tab title="--thread auto|here|off">
    | モード   | 動作                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | アクティブなスレッド内では、そのスレッドを紐付けます。スレッド外では、サポートされている場合に子スレッドを作成/紐付けます。 |
    | `here` | 現在アクティブなスレッドを要求します。スレッド内でない場合は失敗します。                                                  |
    | `off`  | 紐付けなし。セッションは未紐付けで開始されます。                                                                 |

    注:

    - スレッド紐付けでないサーフェスでは、デフォルト動作は実質的に `off` です。
    - スレッド紐付けされた spawn にはチャンネルポリシーのサポートが必要です:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - 子スレッドを作成せずに現在の会話を固定したい場合は、`--bind here` を使用します。

  </Tab>
</Tabs>

## 配信モデル

ACP セッションは、対話型ワークスペースにも、親が所有するバックグラウンド作業にもできます。
配信パスはその形によって異なります。

<AccordionGroup>
  <Accordion title="対話型 ACP セッション">
    対話型セッションは、表示されているチャットサーフェスで会話を継続することを想定しています:

    - `/acp spawn ... --bind here` は現在の会話を ACP セッションに紐付けます。
    - `/acp spawn ... --thread ...` はチャンネルのスレッド/トピックを ACP セッションに紐付けます。
    - 永続設定された `bindings[].type="acp"` は、一致する会話を同じ ACP セッションへルーティングします。

    紐付けられた会話での後続メッセージは ACP セッションへ直接ルーティングされ、
    ACP の出力は同じチャンネル/スレッド/トピックへ返されます。

    OpenClaw がハーネスに送信する内容:

    - 通常の紐付け済み後続メッセージはプロンプトテキストとして送信され、添付ファイルはハーネス/バックエンドがサポートしている場合にのみ追加されます。
    - `/acp` 管理コマンドとローカル Gateway コマンドは ACP ディスパッチ前にインターセプトされます。
    - ランタイム生成の完了イベントはターゲットごとに具体化されます。OpenClaw エージェントは OpenClaw の内部ランタイムコンテキストエンベロープを受け取り、外部 ACP ハーネスは子の結果と指示を含むプレーンなプロンプトを受け取ります。生の `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` エンベロープは、外部ハーネスに送信したり ACP ユーザートランスクリプトテキストとして永続化したりしてはなりません。
    - ACP トランスクリプトエントリは、ユーザーに見えるトリガーテキストまたはプレーンな完了プロンプトを使用します。内部イベントメタデータは可能な限り OpenClaw 内で構造化されたままにし、ユーザー作成のチャット内容として扱いません。

  </Accordion>
  <Accordion title="親が所有するワンショット ACP セッション">
    別のエージェント実行によって spawn されたワンショット ACP セッションは、
    サブエージェントと同様のバックグラウンド子として実行されます:

    - 親は `sessions_spawn({ runtime: "acp", mode: "run" })` で作業を依頼します。
    - 子は独自の ACP ハーネスセッションで実行されます。
    - 子ターンはネイティブのサブエージェント spawn と同じバックグラウンドレーンで実行されるため、遅い ACP ハーネスが無関係なメインセッション作業をブロックしません。
    - 完了はタスク完了アナウンスパスを通じて報告されます。OpenClaw は内部完了メタデータを外部ハーネスへ送信する前にプレーンな ACP プロンプトへ変換するため、ハーネスは OpenClaw 専用のランタイムコンテキストマーカーを見ません。
    - ユーザー向けの返信が有用な場合、親は子の結果を通常のアシスタントの声で書き換えます。

    このパスを、親と子のピアツーピアチャットとして扱わないでください。
    子にはすでに親へ戻る完了チャンネルがあります。

  </Accordion>
  <Accordion title="sessions_send と A2A 配信">
    `sessions_send` は spawn 後に別のセッションをターゲットにできます。通常の
    ピアセッションでは、OpenClaw はメッセージを注入した後にエージェント間（A2A）の
    後続パスを使用します:

    - ターゲットセッションの返信を待ちます。
    - 任意で、要求元とターゲットが制限された回数の後続ターンを交換できるようにします。
    - ターゲットにアナウンスメッセージを生成するよう依頼します。
    - そのアナウンスを表示中のチャンネルまたはスレッドへ配信します。

    この A2A パスは、送信者が表示される後続応答を必要とするピア送信のフォールバックです。
    たとえば広範な `tools.sessions.visibility` 設定のもとで、無関係なセッションが
    ACP ターゲットを見てメッセージできる場合は有効なままです。

    OpenClaw が A2A 後続をスキップするのは、要求元が自身の親所有ワンショット ACP 子の
    親である場合だけです。その場合、タスク完了の上に A2A を実行すると、
    子の結果で親が起動し、親の返信が子へ転送され、親/子のエコーループが作られる可能性があります。
    その所有子のケースでは、完了パスがすでに結果に責任を持つため、`sessions_send` の結果は
    `delivery.status="skipped"` を報告します。

  </Accordion>
  <Accordion title="既存セッションを再開する">
    新しく開始する代わりに以前の ACP セッションを継続するには、
    `resumeSessionId` を使用します。エージェントは `session/load` を通じて会話履歴を
    再生するため、以前の内容を完全なコンテキストとして引き継ぎます。

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    一般的なユースケース:

    - ノート PC からスマートフォンへ Codex セッションを引き継ぐ場合。エージェントに前回の続きから再開するよう伝えます。
    - CLI で対話的に開始したコーディングセッションを、今度はエージェント経由でヘッドレスに継続する場合。
    - gateway の再起動やアイドルタイムアウトで中断された作業を再開する場合。

    注:

    - `resumeSessionId` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムはこの ACP 専用フィールドを無視します。
    - `streamTo` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムはこの ACP 専用フィールドを無視します。
    - `resumeSessionId` はホストローカルの ACP/ハーネス再開 ID であり、OpenClaw チャンネルセッションキーではありません。OpenClaw はディスパッチ前に ACP spawn ポリシーとターゲットエージェントポリシーを引き続き確認し、その上流 ID のロード認可は ACP バックエンドまたはハーネスが所有します。
    - `resumeSessionId` は上流 ACP 会話履歴を復元します。`thread` と `mode` は作成中の新しい OpenClaw セッションにも通常どおり適用されるため、`mode: "session"` には引き続き `thread: true` が必要です。
    - ターゲットエージェントは `session/load` をサポートしている必要があります（Codex と Claude Code はサポートしています）。
    - セッション ID が見つからない場合、spawn は明確なエラーで失敗します。新しいセッションへの黙示的なフォールバックはありません。

  </Accordion>
  <Accordion title="デプロイ後のスモークテスト">
    gateway のデプロイ後は、ユニットテストを信頼するだけでなく、ライブのエンドツーエンドチェックを実行します:

    1. ターゲットホスト上のデプロイ済み gateway バージョンとコミットを確認します。
    2. ライブエージェントへの一時的な ACPX ブリッジセッションを開きます。
    3. そのエージェントに、`runtime: "acp"`、`agentId: "codex"`、`mode: "run"`、タスク `Reply with exactly LIVE-ACP-SPAWN-OK` で `sessions_spawn` を呼び出すよう依頼します。
    4. `accepted=yes`、実際の `childSessionKey`、バリデーターエラーがないことを確認します。
    5. 一時的なブリッジセッションをクリーンアップします。

    ゲートは `mode: "run"` のままにし、`streamTo: "parent"` はスキップします。
    スレッド紐付けの `mode: "session"` とストリームリレーパスは、
    別のより充実した統合パスです。

  </Accordion>
</AccordionGroup>

## サンドボックス互換性

ACP セッションは現在、OpenClaw サンドボックス内ではなく、ホストランタイム上で実行されます。

<Warning>
**セキュリティ境界:**

- 外部ハーネスは、それ自身の CLI 権限と選択された `cwd` に従って読み書きできます。
- OpenClaw のサンドボックスポリシーは、ACP ハーネスの実行を**ラップしません**。
- OpenClaw は引き続き、ACP の機能ゲート、許可されたエージェント、セッション所有権、チャンネルバインディング、Gateway 配信ポリシーを適用します。
- サンドボックスが適用される OpenClaw ネイティブの作業には `runtime: "subagent"` を使用してください。

</Warning>

現在の制限:

- リクエスターセッションがサンドボックス化されている場合、`sessions_spawn({ runtime: "acp" })` と `/acp spawn` のどちらでも ACP の生成はブロックされます。
- `runtime: "acp"` を指定した `sessions_spawn` は `sandbox: "require"` をサポートしていません。

## セッションターゲットの解決

ほとんどの `/acp` アクションは、任意のセッションターゲット（`session-key`、
`session-id`、または `session-label`）を受け取れます。

**解決順序:**

1. 明示的なターゲット引数（または `/acp steer` の `--session`）
   - キーを試します
   - 次に UUID 形式のセッション id を試します
   - 次にラベルを試します
2. 現在のスレッドバインディング（この会話/スレッドが ACP セッションにバインドされている場合）。
3. 現在のリクエスターセッションへのフォールバック。

現在の会話バインディングとスレッドバインディングは、どちらも
ステップ 2 に参加します。

ターゲットを解決できない場合、OpenClaw は明確なエラー
（`Unable to resolve session target: ...`）を返します。

## ACP コントロール

| コマンド             | 何をするか                                                | 例                                                            |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP セッションを作成します。現在のバインドまたはスレッドバインドは任意です。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ターゲットセッションの進行中のターンをキャンセルします。  | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 実行中のセッションにステア指示を送信します。              | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | セッションを閉じ、スレッドターゲットのバインドを解除します。 | `/acp close`                                                  |
| `/acp status`        | バックエンド、モード、状態、ランタイムオプション、機能を表示します。 | `/acp status`                                                 |
| `/acp set-mode`      | ターゲットセッションのランタイムモードを設定します。      | `/acp set-mode plan`                                          |
| `/acp set`           | 汎用ランタイム設定オプションを書き込みます。              | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ランタイム作業ディレクトリのオーバーライドを設定します。  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 承認ポリシープロファイルを設定します。                    | `/acp permissions strict`                                     |
| `/acp timeout`       | ランタイムタイムアウト（秒）を設定します。                | `/acp timeout 120`                                            |
| `/acp model`         | ランタイムモデルのオーバーライドを設定します。            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | セッションのランタイムオプションオーバーライドを削除します。 | `/acp reset-options`                                          |
| `/acp sessions`      | ストアから最近の ACP セッションを一覧表示します。         | `/acp sessions`                                               |
| `/acp doctor`        | バックエンドの健全性、機能、実行可能な修正を表示します。  | `/acp doctor`                                                 |
| `/acp install`       | 決定論的なインストール手順と有効化手順を出力します。      | `/acp install`                                                |

`/acp status` は、有効なランタイムオプションに加えて、ランタイムレベルおよび
バックエンドレベルのセッション識別子を表示します。バックエンドに機能がない場合、サポートされていないコントロールのエラーが
明確に表示されます。`/acp sessions` は、現在バインドされているセッションまたはリクエスターセッションの
ストアを読み取ります。ターゲットトークン
（`session-key`、`session-id`、または `session-label`）は、エージェントごとのカスタム `session.store`
ルートを含む Gateway セッション検出を通じて解決されます。

### ランタイムオプションのマッピング

`/acp` には便利なコマンドと汎用セッターがあります。同等の
操作は次のとおりです。

| コマンド                     | マップ先                             | 注記                                                                                                                                                                           |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | ランタイム設定キー `model`           | Codex ACP では、OpenClaw は `openai-codex/<model>` をアダプターモデル id に正規化し、`openai-codex/gpt-5.4/high` のようなスラッシュ付き推論サフィックスを `reasoning_effort` にマップします。 |
| `/acp set thinking <level>`  | ランタイム設定キー `thinking`        | Codex ACP では、アダプターが対応している場合、OpenClaw は対応する `reasoning_effort` を送信します。                                                                            |
| `/acp permissions <profile>` | ランタイム設定キー `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | ランタイム設定キー `timeout`         | —                                                                                                                                                                              |
| `/acp cwd <path>`            | ランタイム cwd オーバーライド        | 直接更新です。                                                                                                                                                                 |
| `/acp set <key> <value>`     | 汎用                                 | `key=cwd` は cwd オーバーライドパスを使用します。                                                                                                                              |
| `/acp reset-options`         | すべてのランタイムオーバーライドをクリアします | —                                                                                                                                                                              |

## acpx ハーネス、Plugin 設定、権限

acpx ハーネス設定（Claude Code / Codex / Gemini CLI
エイリアス）、plugin-tools と OpenClaw-tools MCP ブリッジ、および ACP
権限モードについては、
[ACP エージェント — 設定](/ja-JP/tools/acp-agents-setup)を参照してください。

## トラブルシューティング

| 症状                                                                        | 考えられる原因                                                                                                         | 修正                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | バックエンド Plugin がない、無効化されている、または `plugins.allow` によってブロックされている。                       | バックエンド Plugin をインストールして有効化し、その許可リストが設定されている場合は `plugins.allow` に `acpx` を含めてから、`/acp doctor` を実行する。                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP がグローバルに無効化されている。                                                                                   | `acp.enabled=true` を設定する。                                                                                                                                          |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 通常のスレッドメッセージからの自動ディスパッチが無効化されている。                                                     | 自動スレッドルーティングを再開するには `acp.dispatch.enabled=true` を設定する。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き動作する。               |
| `ACP agent "<id>" is not allowed by policy`                                 | エージェントが許可リストに含まれていない。                                                                             | 許可された `agentId` を使用するか、`acp.allowedAgents` を更新する。                                                                                                      |
| `/acp doctor` reports backend not ready right after startup                 | Plugin 依存関係のプローブまたは自己修復がまだ実行中。                                                                 | 少し待ってから `/acp doctor` を再実行する。正常化しない場合は、バックエンドのインストールエラーと Plugin の許可/拒否ポリシーを調べる。                                |
| Harness command not found                                                   | アダプター CLI がインストールされていない、ステージングされた Plugin 依存関係がない、または非 Codex アダプターの初回実行 `npx` 取得が失敗した。 | `/acp doctor` を実行し、Plugin 依存関係を修復し、Gateway ホストにアダプターをインストール/事前ウォームするか、acpx エージェントコマンドを明示的に設定する。             |
| Model-not-found from the harness                                            | モデル ID は別のプロバイダー/ハーネスでは有効だが、この ACP ターゲットでは有効ではない。                               | そのハーネスが一覧表示するモデルを使用するか、ハーネスでモデルを設定するか、オーバーライドを省略する。                                                                  |
| Vendor auth error from the harness                                          | OpenClaw は正常だが、ターゲット CLI/プロバイダーにログインしていない。                                                 | Gateway ホスト環境でログインするか、必要なプロバイダーキーを指定する。                                                                                                  |
| `Unable to resolve session target: ...`                                     | キー/ID/ラベルトークンが不正。                                                                                        | `/acp sessions` を実行し、正確なキー/ラベルをコピーして再試行する。                                                                                                      |
| `--bind here requires running /acp spawn inside an active ... conversation` | アクティブなバインド可能な会話なしで `--bind here` が使用された。                                                      | ターゲットのチャット/チャンネルに移動して再試行するか、未バインドの spawn を使用する。                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | アダプターに現在の会話の ACP バインディング機能がない。                                                                | サポートされている場合は `/acp spawn ... --thread ...` を使用し、トップレベルの `bindings[]` を設定するか、サポートされているチャンネルに移動する。                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | スレッドコンテキスト外で `--thread here` が使用された。                                                                | ターゲットスレッドに移動するか、`--thread auto`/`off` を使用する。                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 別のユーザーがアクティブなバインディングターゲットを所有している。                                                     | 所有者として再バインドするか、別の会話またはスレッドを使用する。                                                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | アダプターにスレッドバインディング機能がない。                                                                         | `--thread off` を使用するか、サポートされているアダプター/チャンネルに移動する。                                                                                        |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP ランタイムはホスト側にあり、要求元セッションはサンドボックス化されている。                                         | サンドボックス化されたセッションからは `runtime="subagent"` を使用するか、サンドボックス化されていないセッションから ACP spawn を実行する。                            |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP ランタイムに対して `sandbox="require"` が要求された。                                                              | 必須のサンドボックス化には `runtime="subagent"` を使用するか、サンドボックス化されていないセッションから `sandbox="inherit"` で ACP を使用する。                        |
| `Cannot apply --model ... did not advertise model support`                  | ターゲットハーネスが汎用 ACP モデル切り替えを公開していない。                                                          | ACP `models`/`session/set_model` を公開するハーネスを使用するか、Codex ACP モデル参照を使用するか、独自の起動フラグがある場合はハーネス内でモデルを直接設定する。       |
| Missing ACP metadata for bound session                                      | 古い/削除された ACP セッションメタデータ。                                                                             | `/acp spawn` で再作成してから、スレッドを再バインド/フォーカスする。                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` が非対話型 ACP セッションでの書き込み/実行をブロックしている。                                        | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定し、Gateway を再起動する。[権限設定](/ja-JP/tools/acp-agents-setup#permission-configuration) を参照。      |
| ACP session fails early with little output                                  | 権限プロンプトが `permissionMode`/`nonInteractivePermissions` によってブロックされている。                             | Gateway ログで `AcpRuntimeError` を確認する。完全な権限には `permissionMode=approve-all` を設定する。正常な機能低下には `nonInteractivePermissions=deny` を設定する。   |
| ACP session stalls indefinitely after completing work                       | ハーネスプロセスは終了したが、ACP セッションが完了を報告しなかった。                                                   | `ps aux \| grep acpx` で監視し、古いプロセスを手動で kill する。                                                                                                        |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 内部イベントエンベロープが ACP 境界を越えて漏えいした。                                                               | OpenClaw を更新し、完了フローを再実行する。外部ハーネスはプレーンな完了プロンプトのみを受け取るべき。                                                                  |

## 関連

- [ACP エージェント — セットアップ](/ja-JP/tools/acp-agents-setup)
- [エージェント送信](/ja-JP/tools/agent-send)
- [CLI バックエンド](/ja-JP/gateway/cli-backends)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (ブリッジモード)](/ja-JP/cli/acp)
- [サブエージェント](/ja-JP/tools/subagents)
