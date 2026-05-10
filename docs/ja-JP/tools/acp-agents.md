---
read_when:
    - ACP 経由でコーディングハーネスを実行する
    - メッセージングチャネルで会話に紐づいた ACP セッションを設定する
    - メッセージチャネルの会話を永続的な ACP セッションにバインドする
    - ACP バックエンド、Plugin の接続設定、または補完配信のトラブルシューティング
    - チャットから /acp コマンドを操作する
sidebarTitle: ACP agents
summary: 外部コーディングハーネス（Claude Code、Cursor、Gemini CLI、明示的な Codex ACP、OpenClaw ACP、OpenCode）を ACP バックエンド経由で実行する
title: ACP エージェント
x-i18n:
    generated_at: "2026-05-10T19:53:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f4beb509c00c965bc2b202648f1b6567d1f3a633f2f9926882adafc5144e06
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) セッションにより、OpenClaw は ACP バックエンドPluginを通じて、外部コーディングハーネス（たとえば Pi、Claude Code、Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI、およびその他の対応 ACPX ハーネス）を実行できます。

各 ACP セッションの生成は、[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

<Note>
**ACP は外部ハーネス用の経路であり、デフォルトの Codex 経路ではありません。** ネイティブ Codex アプリサーバーPluginは、`/codex ...` コントロールとエージェントターン用のデフォルト `openai/gpt-*` 組み込みランタイムを担当します。ACP は、`/acp ...` コントロールと `sessions_spawn({ runtime: "acp" })` セッションを担当します。

Codex または Claude Code を外部 MCP クライアントとして既存の OpenClaw チャンネル会話に直接接続したい場合は、ACP ではなく [`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。
</Note>

## どのページを見ればよいですか？

| やりたいこと                                                                                    | 使用するもの                              | メモ                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 現在の会話で Codex をバインドまたは制御する                                               | `/codex bind`, `/codex threads`       | `codex` Pluginが有効な場合のネイティブ Codex アプリサーバー経路です。バインドされたチャット返信、画像転送、モデル/高速/権限、停止、誘導コントロールが含まれます。ACP は明示的なフォールバックです |
| Claude Code、Gemini CLI、明示的な Codex ACP、または別の外部ハーネスを OpenClaw _経由で_ 実行する | このページ                             | チャットにバインドされたセッション、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、バックグラウンドタスク、ランタイムコントロール                                                                                   |
| エディターまたはクライアント向けに OpenClaw Gateway セッションを ACP サーバー _として_ 公開する                   | [`openclaw acp`](/ja-JP/cli/acp)            | ブリッジモードです。IDE/クライアントは stdio/WebSocket 経由で ACP を使って OpenClaw と通信します                                                                                                                            |
| ローカル AI CLI をテキスト専用フォールバックモデルとして再利用する                                              | [CLI バックエンド](/ja-JP/gateway/cli-backends) | ACP ではありません。OpenClaw ツール、ACP コントロール、ハーネスランタイムはありません                                                                                                                               |

## これは最初から動作しますか？

はい、公式 ACP ランタイムPluginをインストールすれば動作します。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

ソースチェックアウトでは、`pnpm install` 後にローカルの `extensions/acpx` ワークスペースPluginを使用できます。準備状況のチェックには `/acp doctor` を実行してください。

OpenClaw が ACP 生成についてエージェントに教えるのは、ACP が**本当に使用可能**な場合だけです。ACP が有効であり、ディスパッチが無効化されておらず、現在のセッションがサンドボックスでブロックされておらず、ランタイムバックエンドがロードされている必要があります。これらの条件が満たされていない場合、ACP Plugin Skills と `sessions_spawn` の ACP ガイダンスは非表示のままになり、エージェントが利用できないバックエンドを提案しないようにします。

<AccordionGroup>
  <Accordion title="初回実行時の注意点">
    - `plugins.allow` が設定されている場合、それは制限的なPluginインベントリであり、**必ず** `acpx` を含める必要があります。そうでない場合、インストール済みの ACP バックエンドは意図的にブロックされ、`/acp doctor` は allowlist エントリの欠落を報告します。
    - Codex ACP アダプターは `acpx` Pluginとともにステージングされ、可能な場合はローカルで起動されます。
    - Codex ACP は分離された `CODEX_HOME` で実行されます。OpenClaw はホストの Codex 設定から信頼済みプロジェクトエントリのみをコピーし、アクティブなワークスペースを信頼します。認証、通知、フックはホスト設定に残します。
    - 他の対象ハーネスアダプターは、初回使用時に必要に応じて `npx` で取得される場合があります。
    - そのハーネスのベンダー認証は、引き続きホスト上に存在している必要があります。
    - ホストに npm またはネットワークアクセスがない場合、キャッシュを事前にウォームアップするか、別の方法でアダプターをインストールするまで、初回実行時のアダプター取得は失敗します。

  </Accordion>
  <Accordion title="ランタイムの前提条件">
    ACP は実際の外部ハーネスプロセスを起動します。OpenClaw はルーティング、バックグラウンドタスク状態、配信、バインディング、ポリシーを担当します。ハーネスはプロバイダーログイン、モデルカタログ、ファイルシステム動作、ネイティブツールを担当します。

    OpenClaw の問題と判断する前に、次を確認してください。

    - `/acp doctor` が、有効で正常なバックエンドを報告している。
    - allowlist が設定されている場合、対象 id が `acp.allowedAgents` で許可されている。
    - ハーネスコマンドが Gateway ホストで起動できる。
    - そのハーネスのプロバイダー認証（`claude`、`codex`、`gemini`、`opencode`、`droid` など）が存在している。
    - 選択したモデルがそのハーネスに存在している - モデル id はハーネス間で移植可能ではありません。
    - 要求された `cwd` が存在しアクセス可能である。または `cwd` を省略し、バックエンドにデフォルトを使用させる。
    - 権限モードが作業に一致している。非対話型セッションではネイティブの権限プロンプトをクリックできないため、書き込み/実行の多いコーディング実行では通常、ヘッドレスで続行できる ACPX 権限プロファイルが必要です。

  </Accordion>
</AccordionGroup>

OpenClaw Pluginツールと組み込み OpenClaw ツールは、デフォルトでは ACP ハーネスに公開されません。ハーネスからそれらのツールを直接呼び出す必要がある場合にのみ、[ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup)で明示的な MCP ブリッジを有効にしてください。

## 対応ハーネス対象

`acpx` バックエンドでは、これらのハーネス id を `/acp spawn <id>` または `sessions_spawn({ runtime: "acp", agentId: "<id>" })` の対象として使用します。

| ハーネス id | 典型的なバックエンド                                | メモ                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP アダプター                        | ホスト上に Claude Code 認証が必要です。                                              |
| `codex`    | Codex ACP アダプター                              | ネイティブ `/codex` が利用できない場合、または ACP が要求された場合のみの明示的な ACP フォールバックです。 |
| `copilot`  | GitHub Copilot ACP アダプター                     | Copilot CLI/ランタイム認証が必要です。                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | ローカルインストールが別の ACP エントリポイントを公開している場合は、acpx コマンドを上書きしてください。    |
| `droid`    | Factory Droid CLI                              | ハーネス環境に Factory/Droid 認証または `FACTORY_API_KEY` が必要です。        |
| `gemini`   | Gemini CLI ACP アダプター                         | Gemini CLI 認証または API キー設定が必要です。                                          |
| `iflow`    | iFlow CLI                                      | アダプターの可用性とモデル制御は、インストールされた CLI に依存します。                 |
| `kilocode` | Kilo Code CLI                                  | アダプターの可用性とモデル制御は、インストールされた CLI に依存します。                 |
| `kimi`     | Kimi/Moonshot CLI                              | ホスト上に Kimi/Moonshot 認証が必要です。                                            |
| `kiro`     | Kiro CLI                                       | アダプターの可用性とモデル制御は、インストールされた CLI に依存します。                 |
| `opencode` | OpenCode ACP アダプター                           | OpenCode CLI/プロバイダー認証が必要です。                                                |
| `openclaw` | `openclaw acp` 経由の OpenClaw Gateway ブリッジ | ACP 対応ハーネスが OpenClaw Gateway セッションに通信を返せるようにします。                 |
| `pi`       | Pi/組み込み OpenClaw ランタイム                   | OpenClaw ネイティブハーネスの実験に使用されます。                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | ホスト上に Qwen 互換の認証が必要です。                                          |

カスタム acpx エージェントエイリアスは acpx 自体で設定できますが、OpenClaw のポリシーはディスパッチ前に引き続き `acp.allowedAgents` と任意の `agents.list[].runtime.acp.agent` マッピングをチェックします。

## オペレーター用ランブック

チャットからの簡単な `/acp` フロー:

<Steps>
  <Step title="生成">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`、または明示的な
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="作業">
    バインドされた会話またはスレッドで続行します（またはセッションキーを明示的に対象にします）。
  </Step>
  <Step title="状態を確認">
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
    - 生成は ACP ランタイムセッションを作成または再開し、OpenClaw セッションストアに ACP メタデータを記録し、実行が親所有の場合はバックグラウンドタスクを作成する場合があります。
    - 親所有の ACP セッションは、ランタイムセッションが永続的な場合でもバックグラウンド作業として扱われます。完了とサーフェス横断の配信は、通常のユーザー向けチャットセッションのように動作するのではなく、親タスク通知機構を通じて行われます。
    - タスクメンテナンスは、終了済みまたは孤立した親所有の単発 ACP セッションを閉じます。永続 ACP セッションは、アクティブな会話バインディングが残っている間は保持されます。アクティブなバインディングのない古い永続セッションは、所有タスクが完了した後、またはそのタスクレコードがなくなった後に静かに再開できないよう閉じられます。
    - バインドされたフォローアップメッセージは、バインディングが閉じられる、フォーカス解除される、リセットされる、または期限切れになるまで、ACP セッションに直接送られます。
    - Gateway コマンドはローカルにとどまります。`/acp ...`、`/status`、`/unfocus` は、通常のプロンプトテキストとしてバインド済み ACP ハーネスに送信されることはありません。
    - `cancel` は、バックエンドがキャンセルをサポートしている場合にアクティブなターンを中止します。バインディングやセッションメタデータは削除しません。
    - `close` は OpenClaw の観点から ACP セッションを終了し、バインディングを削除します。ハーネスが再開をサポートしている場合、独自の上流履歴を保持することがあります。
    - acpx Pluginは `close` 後に OpenClaw 所有のラッパーおよびアダプタープロセスツリーをクリーンアップし、Gateway 起動時に古い OpenClaw 所有の ACPX 孤立プロセスを回収します。
    - アイドル状態のランタイムワーカーは `acp.runtime.ttlMinutes` 後にクリーンアップ対象になります。保存されたセッションメタデータは `/acp sessions` で引き続き利用できます。

  </Accordion>
  <Accordion title="ネイティブ Codex ルーティングルール">
    有効な場合に**ネイティブ Codex Plugin**へルーティングすべき自然言語トリガー:

    - 「この Discord チャンネルを Codex にバインドする。」
    - 「このチャットを Codex スレッド `<id>` に添付する。」
    - 「Codex スレッドを表示してから、これをバインドする。」

    ネイティブ Codex 会話バインディングがデフォルトのチャット制御パスです。
    OpenClaw の動的ツールは引き続き OpenClaw 経由で実行されますが、
    shell/apply-patch などの Codex ネイティブツールは Codex 内で実行されます。
    Codex ネイティブツールイベントについては、OpenClaw がターンごとのネイティブ
    フックリレーを注入し、Plugin フックが `before_tool_call` をブロックし、
    `after_tool_call` を監視し、Codex `PermissionRequest` イベントを
    OpenClaw の承認経由でルーティングできるようにします。Codex `Stop` フックは
    OpenClaw `before_agent_finalize` にリレーされ、そこで Plugin は Codex が回答を
    確定する前に、モデルパスをもう1回要求できます。このリレーは
    意図的に保守的なままです。Codex ネイティブツールの
    引数を変更したり、Codex スレッド記録を書き換えたりしません。ACP ランタイム/セッションモデルが
    必要な場合にのみ、明示的な ACP を使用してください。埋め込み Codex
    サポート境界は
    [Codex harness v1 サポート契約](/ja-JP/plugins/codex-harness-runtime#v1-support-contract)に記載されています。

  </Accordion>
  <Accordion title="モデル / プロバイダー / ランタイム選択チートシート">
    - `openai-codex/*` - doctor により修復される従来の Codex OAuth/サブスクリプションモデルルート。
    - `openai/*` - OpenAI エージェントターン用のネイティブ Codex app-server 埋め込みランタイム。
    - `/codex ...` - ネイティブ Codex 会話制御。
    - `/acp ...` または `runtime: "acp"` - 明示的な ACP/acpx 制御。

  </Accordion>
  <Accordion title="ACP ルーティング用自然言語トリガー">
    ACP ランタイムにルーティングすべきトリガー:

    - 「これをワンショットの Claude Code ACP セッションとして実行し、結果を要約してください。」
    - 「このタスクにはスレッド内で Gemini CLI を使用し、その後のフォローアップを同じスレッドに保持してください。」
    - 「バックグラウンドスレッドで ACP 経由で Codex を実行してください。」

    OpenClaw は `runtime: "acp"` を選択し、ハーネス `agentId` を解決し、
    サポートされている場合は現在の会話またはスレッドにバインドし、
    クローズ/期限切れまでフォローアップをそのセッションにルーティングします。Codex は
    ACP/acpx が明示されている場合、または要求された操作でネイティブ Codex
    Plugin が利用できない場合にのみ、このパスに従います。

    `sessions_spawn` では、`runtime: "acp"` は ACP
    が有効で、リクエスターがサンドボックス化されておらず、ACP ランタイム
    バックエンドが読み込まれている場合にのみ公開されます。`acp.dispatch.enabled=false` は自動
    ACP スレッドディスパッチを一時停止しますが、明示的な
    `sessions_spawn({ runtime: "acp" })` 呼び出しを隠したりブロックしたりしません。対象は `codex`、
    `claude`、`droid`、`gemini`、`opencode` などの ACP ハーネス ID です。通常の
    OpenClaw 設定エージェント ID を `agents_list` から渡さないでください。ただし、そのエントリーが
    `agents.list[].runtime.type="acp"` で明示的に設定されている場合は除きます。
    それ以外の場合は、デフォルトのサブエージェントランタイムを使用してください。OpenClaw エージェントが
    `runtime.type="acp"` で設定されている場合、OpenClaw は
    `runtime.acp.agent` を基盤となるハーネス ID として使用します。

  </Accordion>
</AccordionGroup>

## ACP とサブエージェントの比較

外部ハーネスランタイムが必要な場合は ACP を使用します。`codex`
Plugin が有効な場合、Codex 会話バインディング/制御には **ネイティブ Codex
app-server** を使用します。OpenClaw ネイティブの
委任実行が必要な場合は **サブエージェント** を使用します。

| エリア        | ACP セッション                       | サブエージェント実行               |
| ------------- | ------------------------------------- | ---------------------------------- |
| ランタイム    | ACP バックエンドPlugin（例: acpx）    | OpenClaw ネイティブサブエージェントランタイム |
| セッションキー | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主なコマンド  | `/acp ...`                            | `/subagents ...`                   |
| スポーンツール | `runtime:"acp"` 付きの `sessions_spawn` | `sessions_spawn`（デフォルトランタイム） |

[サブエージェント](/ja-JP/tools/subagents)も参照してください。

## ACP が Claude Code を実行する仕組み

ACP 経由の Claude Code では、スタックは次のとおりです。

1. OpenClaw ACP セッション制御プレーン。
2. 公式 `@openclaw/acpx` ランタイムPlugin。
3. Claude ACP アダプター。
4. Claude 側のランタイム/セッション機構。

ACP Claude は、ACP 制御、セッション再開、
バックグラウンドタスク追跡、任意の会話/スレッドバインディングを備えた
**ハーネスセッション** です。

CLI バックエンドは、別個のテキスト専用ローカルフォールバックランタイムです - 
[CLI バックエンド](/ja-JP/gateway/cli-backends)を参照してください。

オペレーター向けの実用上のルール:

- **`/acp spawn`、バインド可能なセッション、ランタイム制御、または永続的なハーネス作業が必要ですか?** ACP を使用してください。
- **生の CLI を通じたシンプルなローカルテキストフォールバックが必要ですか?** CLI バックエンドを使用してください。

## バインド済みセッション

### 考え方

- **チャットサーフェス** - 人が会話を続ける場所（Discord チャンネル、Telegram トピック、iMessage チャット）。
- **ACP セッション** - OpenClaw がルーティングする永続的な Codex/Claude/Gemini ランタイム状態。
- **子スレッド/トピック** - `--thread ...` によってのみ作成される任意の追加メッセージングサーフェス。
- **ランタイムワークスペース** - ハーネスが実行されるファイルシステム上の場所（`cwd`、リポジトリチェックアウト、バックエンドワークスペース）。チャットサーフェスとは独立しています。

### 現在の会話へのバインド

`/acp spawn <harness> --bind here` は、現在の会話を
スポーンされた ACP セッションに固定します - 子スレッドはなく、同じチャットサーフェスです。OpenClaw は
トランスポート、認証、安全性、配信を引き続き所有します。その
会話内のフォローアップメッセージは同じセッションにルーティングされます。`/new` と `/reset` は
その場でセッションをリセットします。`/acp close` はバインディングを削除します。

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
    - `--bind here` と `--thread ...` は相互排他的です。
    - `--bind here` は現在の会話バインディングを公開しているチャンネルでのみ機能します。それ以外の場合、OpenClaw は明確な未サポートメッセージを返します。バインディングは Gateway 再起動後も維持されます。
    - Discord では、`spawnSessions` は `--thread auto|here` の子スレッド作成を制御します - `--bind here` ではありません。
    - `--cwd` なしで別の ACP エージェントにスポーンする場合、OpenClaw はデフォルトで **ターゲットエージェントの** ワークスペースを継承します。存在しない継承パス（`ENOENT`/`ENOTDIR`）はバックエンドのデフォルトにフォールバックします。その他のアクセスエラー（例: `EACCES`）はスポーンエラーとして表面化します。
    - Gateway 管理コマンドはバインド済み会話内でローカル処理のままです - 通常のフォローアップテキストがバインド済み ACP セッションにルーティングされる場合でも、`/acp ...` コマンドは OpenClaw によって処理されます。`/status` と `/unfocus` も、そのサーフェスでコマンド処理が有効な場合は常にローカル処理のままです。

  </Accordion>
  <Accordion title="スレッドバインドセッション">
    チャンネルアダプターでスレッドバインディングが有効な場合:

    - OpenClaw はスレッドをターゲット ACP セッションにバインドします。
    - そのスレッド内のフォローアップメッセージはバインド済み ACP セッションにルーティングされます。
    - ACP 出力は同じスレッドに返されます。
    - フォーカス解除/クローズ/アーカイブ/アイドルタイムアウト、または max-age の期限切れによりバインディングが削除されます。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status`、`/unfocus` は Gateway コマンドであり、ACP ハーネスへのプロンプトではありません。

    スレッドバインド ACP に必要な機能フラグ:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` はデフォルトでオンです（自動 ACP スレッドディスパッチを一時停止するには `false` を設定します。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き機能します）。
    - チャンネルアダプターのスレッドセッションスポーンが有効（デフォルト: `true`）:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    スレッドバインディングのサポートはアダプター固有です。アクティブなチャンネル
    アダプターがスレッドバインディングをサポートしていない場合、OpenClaw は明確な
    未サポート/利用不可メッセージを返します。

  </Accordion>
  <Accordion title="スレッド対応チャンネル">
    - セッション/スレッドバインディング機能を公開する任意のチャンネルアダプター。
    - 現在の組み込みサポート: **Discord** スレッド/チャンネル、**Telegram** トピック（グループ/スーパーグループ内のフォーラムトピックと DM トピック）。
    - Plugin チャンネルは同じバインディングインターフェイスを通じてサポートを追加できます。

  </Accordion>
</AccordionGroup>

## 永続的なチャンネルバインディング

非一時的なワークフローでは、トップレベルの `bindings[]` エントリーで
永続的な ACP バインディングを設定します。

### バインディングモデル

<ParamField path="bindings[].type" type='"acp"'>
  永続的な ACP 会話バインディングを示します。
</ParamField>
<ParamField path="bindings[].match" type="object">
  ターゲット会話を識別します。チャンネルごとの形状:

- **Discord チャンネル/スレッド:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack チャンネル/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`。安定した Slack ID を優先してください。チャンネルバインディングは、そのチャンネルのスレッド内の返信にも一致します。
- **Telegram フォーラムトピック:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **iMessage DM/グループ:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。安定したグループバインディングには `chat_id:*` を優先してください。

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

### エージェントごとのランタイムデフォルト

`agents.list[].runtime` を使用して、エージェントごとに ACP デフォルトを一度だけ定義します。

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（ハーネス ID。例: `codex` または `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP バインド済みセッションのオーバーライド優先順位:**

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

- OpenClaw は、構成された ACP セッションが使用前に存在することを保証します。
- そのチャンネルまたはトピック内のメッセージは、構成された ACP セッションにルーティングされます。
- バインドされた会話では、`/new` と `/reset` は同じ ACP セッションキーをその場でリセットします。
- 一時的なランタイムバインディング（たとえばスレッドフォーカスフローによって作成されたもの）は、存在する場所では引き続き適用されます。
- 明示的な `cwd` なしでエージェント間 ACP をスポーンする場合、OpenClaw はエージェント構成から対象エージェントのワークスペースを継承します。
- 継承されたワークスペースパスが存在しない場合はバックエンドのデフォルト cwd にフォールバックします。存在するがアクセスに失敗した場合は、スポーンエラーとして表示されます。

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
    `runtime` のデフォルトは `subagent` なので、ACP セッションでは
    `runtime: "acp"` を明示的に設定してください。`agentId` が省略された場合、
    構成されていれば OpenClaw は `acp.defaultAgent` を使用します。
    `mode: "session"` には、永続的なバインド済み会話を維持するために
    `thread: true` が必要です。
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
  ACP セッションでは `"acp"` でなければなりません。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 対象ハーネス ID。設定されている場合は `acp.defaultAgent` にフォールバックします。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  サポートされている場合にスレッドバインディングフローを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` はワンショット、`"session"` は永続です。`thread: true` で
  `mode` が省略された場合、OpenClaw はランタイムパスごとに永続的な動作を
  デフォルトにすることがあります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cwd" type="string">
  要求されたランタイム作業ディレクトリ（バックエンド/ランタイムポリシーによって検証されます）。
  省略された場合、ACP スポーンは構成されていれば対象エージェントのワークスペースを
  継承します。継承されたパスが存在しない場合はバックエンドのデフォルトに
  フォールバックし、実際のアクセスエラーは返されます。
</ParamField>
<ParamField path="label" type="string">
  セッション/バナーテキストで使用されるオペレーター向けラベル。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  新しい ACP セッションを作成する代わりに、既存の ACP セッションを再開します。
  エージェントは `session/load` によって会話履歴を再生します。
  `runtime: "acp"` が必要です。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` は、初期 ACP 実行の進捗サマリーをシステムイベントとして
  リクエスターセッションへストリーミングします。受け付けられるレスポンスには、
  完全なリレー履歴を tail できるセッションスコープの JSONL ログ
  （`<sessionId>.acp-stream.jsonl`）を指す `streamLogPath` が含まれます。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  N 秒後に ACP 子ターンを中止します。`0` はそのターンを Gateway の
  タイムアウトなしパスに保持します。同じ値が Gateway 実行と ACP ランタイムに
  適用されるため、停止した、またはクォータを使い切ったハーネスが親エージェントの
  レーンを無期限に占有することはありません。
</ParamField>
<ParamField path="model" type="string">
  ACP 子セッションの明示的なモデル上書き。Codex ACP スポーンは、
  `openai-codex/gpt-5.4` などの OpenClaw Codex 参照を `session/new` の前に
  Codex ACP 起動構成へ正規化します。`openai-codex/gpt-5.4/high` などの
  スラッシュ形式では、Codex ACP の推論エフォートも設定されます。
  ほかのハーネスは ACP `models` を広告し、`session/set_model` を
  サポートしている必要があります。そうでない場合、OpenClaw/acpx は対象エージェントの
  デフォルトへ暗黙にフォールバックするのではなく、明確に失敗します。
</ParamField>
<ParamField path="thinking" type="string">
  明示的な思考/推論エフォート。Codex ACP では、`minimal` は低エフォートに対応し、
  `low`/`medium`/`high`/`xhigh` は直接対応し、`off` は
  reasoning-effort 起動上書きを省略します。
</ParamField>

## スポーンのバインドモードとスレッドモード

<Tabs>
  <Tab title="--bind here|off">
    | モード | 動作                                                                   |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 現在のアクティブな会話をその場でバインドします。アクティブな会話がない場合は失敗します。 |
    | `off`  | 現在の会話バインディングを作成しません。                               |

    注:

    - `--bind here` は、「このチャンネルまたはチャットを Codex バックにする」ための最も簡単なオペレーターパスです。
    - `--bind here` は子スレッドを作成しません。
    - `--bind here` は、現在の会話バインディングのサポートを公開しているチャンネルでのみ使用できます。
    - `--bind` と `--thread` は同じ `/acp spawn` 呼び出しで組み合わせることはできません。

  </Tab>
  <Tab title="--thread auto|here|off">
    | モード | 動作                                                                                                 |
    | ------ | ---------------------------------------------------------------------------------------------------- |
    | `auto` | アクティブなスレッド内では、そのスレッドをバインドします。スレッド外では、サポートされている場合に子スレッドを作成/バインドします。 |
    | `here` | 現在のアクティブなスレッドを要求します。スレッド内でない場合は失敗します。                           |
    | `off`  | バインディングなし。セッションは未バインドで開始されます。                                           |

    注:

    - スレッドバインディングではないサーフェスでは、デフォルトの動作は実質的に `off` です。
    - スレッドバインドされたスポーンには、チャンネルポリシーのサポートが必要です:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - 子スレッドを作成せずに現在の会話を固定したい場合は、`--bind here` を使用します。

  </Tab>
</Tabs>

## 配信モデル

ACP セッションは、対話型ワークスペースにも、親が所有するバックグラウンド作業にもできます。
配信パスはその形態によって異なります。

<AccordionGroup>
  <Accordion title="対話型 ACP セッション">
    対話型セッションは、表示されているチャットサーフェスで会話を続けることを意図しています。

    - `/acp spawn ... --bind here` は現在の会話を ACP セッションにバインドします。
    - `/acp spawn ... --thread ...` はチャンネルのスレッド/トピックを ACP セッションにバインドします。
    - 永続的に構成された `bindings[].type="acp"` は、一致する会話を同じ ACP セッションにルーティングします。

    バインドされた会話内のフォローアップメッセージは ACP セッションへ直接ルーティングされ、
    ACP の出力は同じチャンネル/スレッド/トピックへ戻されます。

    OpenClaw がハーネスへ送信する内容:

    - 通常のバインド済みフォローアップはプロンプトテキストとして送信され、ハーネス/バックエンドがサポートする場合にのみ添付ファイルも送信されます。
    - `/acp` 管理コマンドとローカル Gateway コマンドは、ACP ディスパッチ前にインターセプトされます。
    - ランタイム生成の完了イベントは対象ごとに具体化されます。OpenClaw エージェントは OpenClaw の内部 runtime-context エンベロープを受け取り、外部 ACP ハーネスは子の結果と指示を含むプレーンなプロンプトを受け取ります。生の `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` エンベロープを外部ハーネスへ送信したり、ACP ユーザートランスクリプトテキストとして永続化したりしてはいけません。
    - ACP トランスクリプトエントリは、ユーザーに見えるトリガーテキストまたはプレーンな完了プロンプトを使用します。内部イベントメタデータは可能な場合は OpenClaw 内で構造化されたまま保持され、ユーザー作成のチャットコンテンツとして扱われません。

  </Accordion>
  <Accordion title="親が所有するワンショット ACP セッション">
    別のエージェント実行によってスポーンされたワンショット ACP セッションは、
    サブエージェントに似たバックグラウンドの子です。

    - 親は `sessions_spawn({ runtime: "acp", mode: "run" })` で作業を要求します。
    - 子は自身の ACP ハーネスセッション内で実行されます。
    - 子ターンはネイティブのサブエージェントスポーンと同じバックグラウンドレーンで実行されるため、遅い ACP ハーネスが無関係なメインセッション作業をブロックしません。
    - 完了はタスク完了通知パスを通じて報告されます。OpenClaw は外部ハーネスへ送信する前に内部完了メタデータをプレーンな ACP プロンプトへ変換するため、ハーネスは OpenClaw 専用のランタイムコンテキストマーカーを見ません。
    - ユーザー向けの返信が有用な場合、親は子の結果を通常のアシスタント音声で書き直します。

    このパスを、親と子の間のピアツーピアチャットとして扱わないでください。
    子には、親へ戻る完了チャンネルがすでにあります。

  </Accordion>
  <Accordion title="sessions_send と A2A 配信">
    `sessions_send` はスポーン後に別のセッションを対象にできます。通常のピアセッションでは、
    OpenClaw はメッセージを注入した後、エージェント間（A2A）フォローアップパスを使用します。

    - 対象セッションの返信を待ちます。
    - 必要に応じて、リクエスターと対象に制限された回数のフォローアップターンを交換させます。
    - 対象に通知メッセージを生成するよう依頼します。
    - その通知を表示中のチャンネルまたはスレッドへ配信します。

    この A2A パスは、送信者に表示可能なフォローアップが必要なピア送信向けのフォールバックです。
    たとえば広い `tools.sessions.visibility` 設定のもとで、無関係なセッションが
    ACP 対象を見てメッセージ送信できる場合にも有効なままです。

    OpenClaw が A2A フォローアップをスキップするのは、リクエスターが自分自身の、
    親が所有するワンショット ACP 子の親である場合だけです。この場合、タスク完了の上に
    A2A を実行すると、子の結果で親を起こし、親の返信を子へ送り返し、
    親/子のエコーループを作成する可能性があります。完了パスがすでに結果を担当しているため、
    `sessions_send` の結果は、その所有子ケースで `delivery.status="skipped"` を報告します。

  </Accordion>
  <Accordion title="既存セッションを再開する">
    新しく開始する代わりに以前の ACP セッションを続行するには、`resumeSessionId` を使用します。
    エージェントは `session/load` によって会話履歴を再生するため、
    以前の完全なコンテキストを引き継ぎます。

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    一般的なユースケース:

    - Codex セッションをラップトップからスマートフォンへ引き渡す - エージェントに中断したところから続けるよう伝えます。
    - CLI で対話的に開始したコーディングセッションを、今度はエージェント経由でヘッドレスに続行する。
    - Gateway の再起動またはアイドルタイムアウトによって中断された作業を再開する。

    注:

    - `resumeSessionId` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `streamTo` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `resumeSessionId` はホストローカルな ACP/ハーネス再開 ID であり、OpenClaw チャンネルセッションキーではありません。OpenClaw はディスパッチ前に ACP スポーンポリシーと対象エージェントポリシーを引き続きチェックしますが、その上流 ID の読み込みに関する認可は ACP バックエンドまたはハーネスが所有します。
    - `resumeSessionId` は上流 ACP 会話履歴を復元します。作成する新しい OpenClaw セッションには `thread` と `mode` が通常どおり適用されるため、`mode: "session"` には引き続き `thread: true` が必要です。
    - 対象エージェントは `session/load` をサポートしている必要があります（Codex と Claude Code はサポートしています）。
    - セッション ID が見つからない場合、スポーンは明確なエラーで失敗します。新しいセッションへの暗黙のフォールバックはありません。

  </Accordion>
  <Accordion title="デプロイ後のスモークテスト">
    Gateway のデプロイ後は、単体テストを信頼するだけでなく、
    ライブのエンドツーエンドチェックを実行します:

    1. ターゲットホスト上のデプロイ済み Gateway バージョンとコミットを検証します。
    2. ライブエージェントへの一時 ACPX ブリッジセッションを開きます。
    3. そのエージェントに、`runtime: "acp"`、`agentId: "codex"`、`mode: "run"`、タスク `Reply with exactly LIVE-ACP-SPAWN-OK` で `sessions_spawn` を呼び出すよう依頼します。
    4. `accepted=yes`、実際の `childSessionKey`、バリデーターエラーがないことを検証します。
    5. 一時ブリッジセッションをクリーンアップします。

    ゲートは `mode: "run"` のままにし、`streamTo: "parent"` はスキップします -
    スレッドにバインドされた `mode: "session"` とストリームリレーのパスは、別個の
    より充実した統合パスです。

  </Accordion>
</AccordionGroup>

## サンドボックス互換性

ACP セッションは現在、OpenClaw サンドボックス内ではなく、ホストランタイム上で実行されます。

<Warning>
**セキュリティ境界:**

- 外部ハーネスは、自身の CLI 権限と選択された `cwd` に従って読み書きできます。
- OpenClaw のサンドボックスポリシーは、ACP ハーネスの実行をラップしません。
- OpenClaw は引き続き、ACP 機能ゲート、許可されたエージェント、セッション所有権、チャネルバインディング、Gateway 配信ポリシーを適用します。
- サンドボックスで強制される OpenClaw ネイティブの作業には、`runtime: "subagent"` を使用してください。

</Warning>

現在の制限:

- リクエスト元セッションがサンドボックス化されている場合、`sessions_spawn({ runtime: "acp" })` と `/acp spawn` の両方で ACP spawn はブロックされます。
- `runtime: "acp"` を指定した `sessions_spawn` は、`sandbox: "require"` をサポートしていません。

## セッションターゲットの解決

ほとんどの `/acp` アクションは、任意のセッションターゲット（`session-key`、
`session-id`、または `session-label`）を受け取ります。

**解決順序:**

1. 明示的なターゲット引数（または `/acp steer` の `--session`）
   - key を試行
   - 次に UUID 形式の session id
   - 次に label
2. 現在のスレッドバインディング（この会話/スレッドが ACP セッションにバインドされている場合）。
3. 現在のリクエスト元セッションへのフォールバック。

現在の会話バインディングとスレッドバインディングは、どちらも
ステップ 2 に参加します。

ターゲットを解決できない場合、OpenClaw は明確なエラーを返します
（`Unable to resolve session target: ...`）。

## ACP コントロール

| コマンド             | 実行内容                                                  | 例                                                            |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP セッションを作成します。任意で現在のバインドまたはスレッドバインドを指定できます。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ターゲットセッションの進行中のターンをキャンセルします。  | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 実行中のセッションに steer 指示を送信します。             | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | セッションを閉じ、スレッドターゲットのバインドを解除します。 | `/acp close`                                                  |
| `/acp status`        | バックエンド、モード、状態、ランタイムオプション、capabilities を表示します。 | `/acp status`                                                 |
| `/acp set-mode`      | ターゲットセッションのランタイムモードを設定します。      | `/acp set-mode plan`                                          |
| `/acp set`           | 汎用ランタイム設定オプションを書き込みます。              | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ランタイム作業ディレクトリのオーバーライドを設定します。  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 承認ポリシープロファイルを設定します。                    | `/acp permissions strict`                                     |
| `/acp timeout`       | ランタイムタイムアウト（秒）を設定します。                | `/acp timeout 120`                                            |
| `/acp model`         | ランタイムモデルのオーバーライドを設定します。            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | セッションランタイムオプションのオーバーライドを削除します。 | `/acp reset-options`                                          |
| `/acp sessions`      | ストアから最近の ACP セッションを一覧表示します。         | `/acp sessions`                                               |
| `/acp doctor`        | バックエンドの健全性、capabilities、実行可能な修正を表示します。 | `/acp doctor`                                                 |
| `/acp install`       | 決定的なインストール手順と有効化手順を出力します。        | `/acp install`                                                |

`/acp status` は、有効なランタイムオプションに加えて、ランタイムレベルと
バックエンドレベルのセッション識別子を表示します。バックエンドに capability がない場合、サポートされていないコントロールのエラーは
明確に表示されます。`/acp sessions` は、現在バインドされているセッションまたはリクエスト元セッションの
ストアを読み取ります。ターゲットトークン
（`session-key`、`session-id`、または `session-label`）は、
gateway セッション検出を通じて解決されます。これには、エージェントごとのカスタム `session.store`
ルートも含まれます。

### ランタイムオプションのマッピング

`/acp` には便利コマンドと汎用 setter があります。同等の
操作:

| コマンド                     | マッピング先                         | 注記                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | ランタイム設定キー `model`           | Codex ACP の場合、OpenClaw は `openai-codex/<model>` をアダプターモデル ID に正規化し、`openai-codex/gpt-5.4/high` などのスラッシュ付き reasoning サフィックスを `reasoning_effort` にマッピングします。 |
| `/acp set thinking <level>`  | 正規オプション `thinking`            | OpenClaw は、存在する場合、バックエンドが広告する同等の値を送信します。優先順は `thinking`、次に `effort`、`reasoning_effort`、または `thought_level` です。Codex ACP の場合、アダプターは値を `reasoning_effort` にマッピングします。 |
| `/acp permissions <profile>` | 正規オプション `permissionProfile`   | OpenClaw は、存在する場合、`approval_policy`、`permission_profile`、`permissions`、または `permission_mode` など、バックエンドが広告する同等の値を送信します。                                                       |
| `/acp timeout <seconds>`     | 正規オプション `timeoutSeconds`      | OpenClaw は、存在する場合、`timeout` または `timeout_seconds` など、バックエンドが広告する同等の値を送信します。                                                                                           |
| `/acp cwd <path>`            | ランタイム cwd オーバーライド        | 直接更新します。                                                                                                                                                                                           |
| `/acp set <key> <value>`     | 汎用                                 | `key=cwd` は cwd オーバーライドパスを使用します。                                                                                                                                                          |
| `/acp reset-options`         | すべてのランタイムオーバーライドをクリア | -                                                                                                                                                                                                          |

## acpx ハーネス、Plugin セットアップ、権限

acpx ハーネス設定（Claude Code / Codex / Gemini CLI
エイリアス）、plugin-tools と OpenClaw-tools MCP ブリッジ、および ACP
権限モードについては、
[ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup) を参照してください。

## トラブルシューティング

| 症状                                                                        | 考えられる原因                                                                                                         | 修正                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | バックエンド plugin が見つからない、無効化されている、または `plugins.allow` によってブロックされています。            | バックエンド plugin をインストールして有効化し、その許可リストが設定されている場合は `plugins.allow` に `acpx` を含めてから、`/acp doctor` を実行します。                |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP がグローバルに無効化されています。                                                                                 | `acp.enabled=true` を設定します。                                                                                                                                        |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 通常のスレッドメッセージからの自動ディスパッチが無効化されています。                                                   | 自動スレッドルーティングを再開するには `acp.dispatch.enabled=true` を設定します。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き動作します。             |
| `ACP agent "<id>" is not allowed by policy`                                 | エージェントが許可リストに含まれていません。                                                                           | 許可された `agentId` を使用するか、`acp.allowedAgents` を更新します。                                                                                                    |
| `/acp doctor` reports backend not ready right after startup                 | バックエンド plugin が見つからない、無効化されている、許可/拒否ポリシーでブロックされている、または設定された実行ファイルが利用できません。 | バックエンド plugin をインストール/有効化し、`/acp doctor` を再実行します。それでも異常なままの場合は、バックエンドのインストールまたはポリシーエラーを確認します。       |
| Harness command not found                                                   | Adapter CLI がインストールされていない、外部 plugin が見つからない、または Codex 以外のアダプターで初回実行時の `npx` 取得に失敗しました。 | `/acp doctor` を実行し、Gateway ホスト上でアダプターをインストール/事前ウォームアップするか、acpx エージェントコマンドを明示的に設定します。                             |
| Model-not-found from the harness                                            | モデル ID は別のプロバイダー/ハーネスでは有効ですが、この ACP ターゲットでは有効ではありません。                       | そのハーネスに一覧表示されるモデルを使用するか、ハーネスでモデルを設定するか、上書きを省略します。                                                                       |
| Vendor auth error from the harness                                          | OpenClaw は正常ですが、ターゲット CLI/プロバイダーがログインしていません。                                             | Gateway ホスト環境でログインするか、必要なプロバイダーキーを提供します。                                                                                                 |
| `Unable to resolve session target: ...`                                     | キー/ID/ラベルトークンが正しくありません。                                                                             | `/acp sessions` を実行し、正確なキー/ラベルをコピーして再試行します。                                                                                                    |
| `--bind here requires running /acp spawn inside an active ... conversation` | アクティブなバインド可能会話なしで `--bind here` が使用されました。                                                    | ターゲットのチャット/チャンネルへ移動して再試行するか、非バインドの spawn を使用します。                                                                                 |
| `Conversation bindings are unavailable for <channel>.`                      | アダプターに現在の会話の ACP バインディング機能がありません。                                                          | サポートされている場合は `/acp spawn ... --thread ...` を使用し、トップレベルの `bindings[]` を設定するか、サポートされているチャンネルへ移動します。                    |
| `--thread here requires running /acp spawn inside an active ... thread`     | スレッドコンテキストの外で `--thread here` が使用されました。                                                          | ターゲットスレッドへ移動するか、`--thread auto`/`off` を使用します。                                                                                                     |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 別のユーザーがアクティブなバインディングターゲットを所有しています。                                                   | 所有者として再バインドするか、別の会話またはスレッドを使用します。                                                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | アダプターにスレッドバインディング機能がありません。                                                                   | `--thread off` を使用するか、サポートされているアダプター/チャンネルへ移動します。                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP ランタイムはホスト側です。要求元セッションはサンドボックス化されています。                                          | サンドボックス化されたセッションからは `runtime="subagent"` を使用するか、サンドボックス化されていないセッションから ACP spawn を実行します。                            |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP ランタイムに対して `sandbox="require"` が要求されました。                                                          | 必須のサンドボックス化には `runtime="subagent"` を使用するか、サンドボックス化されていないセッションから `sandbox="inherit"` で ACP を使用します。                        |
| `Cannot apply --model ... did not advertise model support`                  | ターゲットハーネスは汎用 ACP モデル切り替えを公開していません。                                                        | ACP `models`/`session/set_model` を告知するハーネスを使用するか、Codex ACP モデル参照を使用するか、独自の起動フラグがある場合はハーネスで直接モデルを設定します。        |
| Missing ACP metadata for bound session                                      | 古い、または削除された ACP セッションメタデータです。                                                                  | `/acp spawn` で再作成してから、スレッドを再バインド/フォーカスします。                                                                                                   |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` が非対話型 ACP セッションで書き込み/実行をブロックしています。                                        | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定し、gateway を再起動します。[Permission configuration](/ja-JP/tools/acp-agents-setup#permission-configuration) を参照してください。 |
| ACP session fails early with little output                                  | 権限プロンプトが `permissionMode`/`nonInteractivePermissions` によってブロックされています。                           | `AcpRuntimeError` がないか gateway ログを確認します。完全な権限には `permissionMode=approve-all` を設定し、穏やかな機能低下には `nonInteractivePermissions=deny` を設定します。 |
| ACP session stalls indefinitely after completing work                       | ハーネスプロセスは終了しましたが、ACP セッションが完了を報告しませんでした。                                            | OpenClaw を更新してください。現在の acpx クリーンアップは、終了時と Gateway 起動時に OpenClaw 所有の古いラッパーおよびアダプタープロセスを回収します。                  |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 内部イベントエンベロープが ACP 境界を越えて漏えいしました。                                                           | OpenClaw を更新し、完了フローを再実行します。外部ハーネスはプレーンな完了プロンプトのみを受け取るべきです。                                                             |

## 関連

- [ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup)
- [エージェント送信](/ja-JP/tools/agent-send)
- [CLI バックエンド](/ja-JP/gateway/cli-backends)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（ブリッジモード）](/ja-JP/cli/acp)
- [サブエージェント](/ja-JP/tools/subagents)
