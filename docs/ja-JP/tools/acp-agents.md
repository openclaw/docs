---
read_when:
    - ACP を介したコーディングハーネスの実行
    - メッセージングチャネルで会話に紐づく ACP セッションを設定する
    - メッセージチャネルの会話を永続的な ACP セッションにバインドする
    - ACP バックエンド、Plugin 配線、または完了配信のトラブルシューティング
    - チャットから /acp コマンドを操作する
sidebarTitle: ACP agents
summary: ACP バックエンドを通じて外部コーディングハーネス（Claude Code、Cursor、Gemini CLI、明示的な Codex ACP、OpenClaw ACP、OpenCode）を実行する
title: ACP エージェント
x-i18n:
    generated_at: "2026-07-05T11:52:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) セッションにより、OpenClaw は ACP バックエンド Plugin を通じて、外部コーディングハーネス（Claude Code、Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI、およびその他のサポート対象 ACPX ハーネス）を実行できます。各 spawn は [background task](/ja-JP/automation/tasks) として追跡されます。

<Note>
**ACP は外部ハーネス用の経路であり、デフォルトの Codex 経路ではありません。** ネイティブの Codex app-server Plugin は `/codex ...` コントロールと、エージェントターン用のデフォルト `openai/gpt-*` 組み込みランタイムを所有します。ACP は `/acp ...` コントロールと `sessions_spawn({ runtime: "acp" })` セッションを所有します。

Codex または Claude Code を外部 MCP クライアントとして既存の OpenClaw チャネル会話に直接接続できるようにするには、ACP ではなく [`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。
</Note>

## どのページを見ればよいですか？

| やりたいこと                                                                                  | 使用するもの                              | 注記                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 現在の会話で Codex をバインドまたは制御する                                               | `/codex bind`, `/codex threads`       | `codex` Plugin が有効な場合のネイティブ Codex app-server 経路: バインドされたチャット返信、画像転送、model/fast/permissions、停止、誘導。ACP は明示的なフォールバックです |
| Claude Code、Gemini CLI、明示的な Codex ACP、または別の外部ハーネスを OpenClaw _経由で_ 実行する | このページ                             | チャットにバインドされたセッション、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、background tasks、ランタイムコントロール                                                                 |
| エディタまたはクライアント向けに OpenClaw Gateway セッションを ACP サーバー _として_ 公開する                   | [`openclaw acp`](/ja-JP/cli/acp)            | ブリッジモード: IDE/クライアントが stdio/WebSocket 経由で OpenClaw に ACP で通信します                                                                                                      |
| ローカル AI CLI をテキスト専用のフォールバックモデルとして再利用する                                              | [CLI バックエンド](/ja-JP/gateway/cli-backends) | ACP ではありません: OpenClaw ツールなし、ACP コントロールなし、ハーネスランタイムなし                                                                                                             |

## これはそのまま動作しますか？

はい。公式 ACP ランタイム Plugin をインストールした後に動作します。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

ソースチェックアウトでは、`pnpm install` 後にローカルの `extensions/acpx` ワークスペース Plugin を使用できます。準備状況の確認には `/acp doctor` を実行してください。

OpenClaw は、ACP が**本当に利用可能**な場合にのみ、エージェントへ ACP spawn について教えます。ACP が有効であること、dispatch が無効化されていないこと、現在のセッションがサンドボックスでブロックされていないこと、ランタイムバックエンドが読み込まれて正常であることが必要です。いずれかの条件が失敗すると、ACP Skills と `sessions_spawn` の ACP ガイダンスは非表示のままになり、エージェントが利用できないバックエンドを提案しないようにします。

<AccordionGroup>
  <Accordion title="初回実行時の注意点">
    - `plugins.allow` が設定されている場合、それは制限的な Plugin インベントリであり、`acpx` を含める**必要があります**。含まれていない場合、インストール済み ACP バックエンドは意図的にブロックされます（`/acp doctor` は不足している allowlist エントリを報告します）。
    - Codex ACP アダプタは `acpx` Plugin に同梱されており、可能な場合はローカルで起動します。
    - Codex ACP は分離された `CODEX_HOME` で実行されます。OpenClaw は、信頼済みプロジェクトの trust エントリに加えて、安全なモデル/プロバイダーのルーティング設定（`model`、`model_provider`、`model_reasoning_effort`、`sandbox_mode`、および安全な `model_providers.<name>` フィールド）をホストの Codex 設定からコピーします。auth、notifications、hooks はホスト設定にのみ残ります。
    - 他のターゲットハーネスアダプタは、初回使用時に必要に応じて `npx` で取得されることがあります。
    - そのハーネスの vendor auth は、ホスト上にすでに存在している必要があります。
    - ホストに npm またはネットワークアクセスがない場合、キャッシュが事前にウォームアップされるか、別の方法でアダプタがインストールされるまで、初回実行時のアダプタ取得は失敗します。

  </Accordion>
  <Accordion title="ランタイムの前提条件">
    ACP は実際の外部ハーネスプロセスを起動します。OpenClaw はルーティング、background-task 状態、配信、バインディング、ポリシーを所有します。ハーネスはプロバイダーログイン、モデルカタログ、ファイルシステム挙動、ネイティブツールを所有します。

    OpenClaw を疑う前に、以下を確認してください。

    - `/acp doctor` が、有効で正常なバックエンドを報告している。
    - その allowlist が設定されている場合、ターゲット ID が `acp.allowedAgents` で許可されている。
    - ハーネスコマンドを Gateway ホストで起動できる。
    - そのハーネス（`claude`、`codex`、`gemini`、`opencode`、`droid` など）のプロバイダー auth が存在する。
    - 選択したモデルがそのハーネスに存在する - モデル ID はハーネス間で移植可能ではありません。
    - 要求された `cwd` が存在し、アクセス可能である。または `cwd` を省略して、バックエンドにデフォルトを使用させる。
    - permission mode が作業に合っている。非対話型セッションはネイティブの権限プロンプトをクリックできないため、書き込み/実行が多いコーディング実行では通常、ヘッドレスで進められる ACPX 権限プロファイルが必要です。

  </Accordion>
</AccordionGroup>

OpenClaw Plugin ツールと組み込み OpenClaw ツールは、デフォルトでは ACP ハーネスに公開されません。ハーネスがそれらのツールを直接呼び出す必要がある場合にのみ、[ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup) で明示的な MCP ブリッジを有効にしてください。

## サポート対象のハーネスターゲット

`acpx` バックエンドでは、これらの ID を `/acp spawn <id>` または `sessions_spawn({ runtime: "acp", agentId: "<id>" })` のターゲットとして使用します。

| ハーネス ID   | 一般的なバックエンド                                | 注記                                                                               |
| ------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`     | Claude Code ACP アダプタ                        | ホスト上の Claude Code auth が必要です。                                              |
| `codex`      | Codex ACP アダプタ                              | ネイティブ `/codex` が利用できない場合、または ACP が要求された場合のみの明示的な ACP フォールバックです。 |
| `copilot`    | GitHub Copilot ACP アダプタ                     | Copilot CLI/ランタイム auth が必要です。                                                  |
| `cursor`     | Cursor CLI ACP (`cursor-agent acp`)            | ローカルインストールが別の ACP エントリポイントを公開している場合は、acpx コマンドを上書きしてください。    |
| `droid`      | Factory Droid CLI                              | ハーネス環境で Factory/Droid auth または `FACTORY_API_KEY` が必要です。        |
| `fast-agent` | fast-agent-mcp ACP アダプタ                     | 必要に応じて `uvx` で取得されます。                                                       |
| `gemini`     | Gemini CLI ACP アダプタ                         | Gemini CLI auth または API キー設定が必要です。                                          |
| `iflow`      | iFlow CLI                                      | アダプタの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `kilocode`   | Kilo Code CLI                                  | アダプタの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `kimi`       | Kimi/Moonshot CLI                              | ホスト上の Kimi/Moonshot auth が必要です。                                            |
| `kiro`       | Kiro CLI                                       | アダプタの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `mux`        | Mux CLI ACP アダプタ                            | 必要に応じて `npx` で取得されます。                                                       |
| `opencode`   | OpenCode ACP アダプタ                           | OpenCode CLI/プロバイダー auth が必要です。                                                |
| `openclaw`   | `openclaw acp` 経由の OpenClaw Gateway ブリッジ | ACP 対応ハーネスが OpenClaw Gateway セッションに通信を戻せるようにします。                 |
| `qoder`      | Qoder CLI                                      | アダプタの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `qwen`       | Qwen Code / Qwen CLI                           | ホスト上の Qwen 互換 auth が必要です。                                          |
| `trae`       | Trae CLI ACP アダプタ                           | アダプタの可用性とモデル制御は、インストール済み CLI に依存します。                 |

`pi` (pi-acp) も acpx バックエンドに登録されていますが、上記の他のものと同じ意味でのコーディングハーネスではありません。

カスタム acpx エージェントエイリアスは acpx 自体で設定できますが、OpenClaw ポリシーは dispatch 前に引き続き `acp.allowedAgents` と、任意の `agents.list[].runtime.acp.agent` マッピングを確認します。

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
  <Step title="状態確認">
    `/acp status`
  </Step>
  <Step title="調整">
    `/acp model <provider/model>`、`/acp permissions <profile>`、
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
    - Spawn は ACP ランタイムセッションを作成または再開し、ACP メタデータを OpenClaw セッションストアに記録し、実行が親所有の場合は background task を作成することがあります。
    - 親所有の ACP セッションは、ランタイムセッションが永続的な場合でもバックグラウンド作業として扱われます。完了とサーフェス横断の配信は、通常のユーザー向けチャットセッションのように動作するのではなく、親タスク通知機構を通じて行われます。
    - タスクメンテナンスは、終端状態または孤立した親所有のワンショット ACP セッションを閉じます。永続 ACP セッションは、アクティブな会話バインディングが残っている間は保持されます。アクティブなバインディングのない古い永続セッションは、所有タスクが完了した後、またはそのタスクレコードがなくなった後に暗黙に再開されないよう閉じられます。
    - バインドされたフォローアップメッセージは、バインディングが閉じられる、フォーカス解除される、リセットされる、または期限切れになるまで、ACP セッションに直接送信されます。
    - Gateway コマンドはローカルに留まります。`/acp ...`、`/status`、`/unfocus` は、通常のプロンプトテキストとしてバインドされた ACP ハーネスに送信されることはありません。
    - `cancel` は、バックエンドがキャンセルをサポートする場合、アクティブなターンを中止します。バインディングやセッションメタデータは削除しません。
    - `close` は OpenClaw の視点から ACP セッションを終了し、バインディングを削除します。ハーネスが再開をサポートしている場合、独自のアップストリーム履歴を保持することがあります。
    - acpx Plugin は `close` 後に OpenClaw 所有のラッパーおよびアダプタプロセスツリーをクリーンアップし、Gateway 起動時に古い OpenClaw 所有の ACPX 孤児プロセスを回収します。
    - アイドル状態のランタイムワーカーは、`acp.runtime.ttlMinutes` 後にクリーンアップ対象になります。保存されたセッションメタデータは `/acp sessions` で引き続き利用できます。

  </Accordion>
  <Accordion title="ネイティブ Codex ルーティングルール">
    有効な場合に**ネイティブ Codex Plugin**へルーティングすべき自然言語トリガー:

    - 「この Discord チャネルを Codex にバインドする。」
    - 「このチャットを Codex スレッド `<id>` に接続する。」
    - 「Codex スレッドを表示してから、これをバインドする。」

    Codex ネイティブの会話バインディングが、デフォルトのチャット制御パスです。
    OpenClaw の動的ツールは引き続き OpenClaw 経由で実行され、一方で shell/apply-patch などの Codex ネイティブ
    ツールは Codex 内で実行されます。Codex ネイティブの
    ツールイベントでは、OpenClaw がターンごとのネイティブフックリレーを注入するため、Plugin フックは
    `before_tool_call` をブロックし、`after_tool_call` を観測し、Codex の
    `PermissionRequest` イベントを OpenClaw 承認経由でルーティングできます。Codex の `Stop` フックは
    OpenClaw の `before_agent_finalize` にリレーされ、そこで Plugin は
    Codex が回答を確定する前にもう 1 回のモデルパスを要求できます。このリレーは
    意図的に保守的に保たれています。Codex ネイティブのツール引数を変更したり、
    Codex のスレッドレコードを書き換えたりしません。
    ACP ランタイム/セッションモデルが必要な場合にのみ、明示的な ACP を使用してください。
    埋め込み Codex のサポート境界は、
    [Codex ハーネス v1 サポート契約](/ja-JP/plugins/codex-harness-runtime#v1-support-contract) に
    文書化されています。

  </Accordion>
  <Accordion title="モデル / プロバイダー / ランタイム選択チートシート">
    - レガシー Codex モデル参照 - doctor によって修復されるレガシー Codex OAuth/サブスクリプションモデルルート。
    - `openai/*` - OpenAI エージェントターン向けのネイティブ Codex app-server 埋め込みランタイム。
    - `/codex ...` - ネイティブ Codex 会話制御。
    - `/acp ...` または `runtime: "acp"` - 明示的な ACP/acpx 制御。

  </Accordion>
  <Accordion title="ACP ルーティングの自然言語トリガー">
    ACP ランタイムにルーティングすべきトリガー:

    - 「これをワンショットの Claude Code ACP セッションとして実行し、結果を要約してください。」
    - 「このタスクにはスレッド内で Gemini CLI を使用し、その後のフォローアップも同じスレッドで続けてください。」
    - 「バックグラウンドスレッドで ACP 経由で Codex を実行してください。」

    OpenClaw は `runtime: "acp"` を選択し、ハーネス `agentId` を解決し、
    サポートされている場合は現在の会話またはスレッドにバインドし、クローズ/期限切れまで
    フォローアップをそのセッションにルーティングします。Codex は、
    ACP/acpx が明示されている場合、または要求された操作に対してネイティブ Codex Plugin が
    利用できない場合にのみ、このパスに従います。

    `sessions_spawn` では、ACP が有効で、リクエスターがサンドボックス化されておらず、
    ACP ランタイムバックエンドがロードされている場合にのみ、`runtime: "acp"` が通知されます。
    `acp.dispatch.enabled=false` は自動 ACP スレッドディスパッチを一時停止しますが、
    明示的な `sessions_spawn({ runtime: "acp" })`
    呼び出しを隠したりブロックしたりはしません。これは `codex`、`claude`、`droid`、
    `gemini`、`opencode` などの ACP ハーネス ID を対象にします。
    そのエントリが `agents.list[].runtime.type="acp"` で明示的に構成されていない限り、
    `agents_list` から通常の OpenClaw 設定エージェント ID を渡さないでください。
    それ以外の場合は、デフォルトのサブエージェントランタイムを使用してください。
    OpenClaw エージェントが `runtime.type="acp"` で構成されている場合、
    OpenClaw は `runtime.acp.agent` を基盤となるハーネス ID として使用します。

  </Accordion>
</AccordionGroup>

## ACP とサブエージェント

外部ハーネスランタイムが必要な場合は ACP を使用します。`codex` Plugin が
有効な場合、Codex の会話バインディング/制御には **ネイティブ Codex
app-server** を使用します。OpenClaw ネイティブの委任実行が必要な場合は
**サブエージェント**を使用します。

| 領域          | ACP セッション                           | サブエージェント実行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| ランタイム       | ACP バックエンド Plugin (例: acpx) | OpenClaw ネイティブのサブエージェントランタイム  |
| セッションキー   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| メインコマンド | `/acp ...`                            | `/subagents ...`                   |
| 生成ツール    | `runtime:"acp"` 付きの `sessions_spawn` | `sessions_spawn` (デフォルトランタイム) |

[サブエージェント](/ja-JP/tools/subagents) も参照してください。

## ACP が Claude Code を実行する仕組み

ACP 経由の Claude Code では、スタックは次のとおりです。

1. OpenClaw ACP セッション制御プレーン。
2. 公式 `@openclaw/acpx` ランタイム Plugin。
3. Claude ACP アダプター。
4. Claude 側のランタイム/セッション機構。

ACP Claude は、ACP 制御、セッション再開、
バックグラウンドタスク追跡、任意の会話/スレッドバインディングを備えた
**ハーネスセッション**です。

CLI バックエンドは、別個のテキスト専用 local fallback ランタイムです -
[CLI バックエンド](/ja-JP/gateway/cli-backends) を参照してください。

オペレーター向けの実用的なルールは次のとおりです。

- **`/acp spawn`、バインド可能なセッション、ランタイム制御、または永続的なハーネス作業が必要ですか?** ACP を使用します。
- **raw CLI 経由の単純なローカルテキストフォールバックが必要ですか?** CLI バックエンドを使用します。

## バインドされたセッション

### メンタルモデル

- **チャットサーフェス** - 人々が会話を続ける場所 (Discord チャンネル、Telegram トピック、iMessage チャット)。
- **ACP セッション** - OpenClaw がルーティングする永続的な Codex/Claude/Gemini ランタイム状態。
- **子スレッド/トピック** - `--thread ...` によってのみ作成される任意の追加メッセージングサーフェス。
- **ランタイムワークスペース** - ハーネスが実行されるファイルシステム上の場所 (`cwd`、リポジトリ checkout、バックエンドワークスペース)。チャットサーフェスとは独立しています。

### 現在の会話へのバインド

`/acp spawn <harness> --bind here` は、現在の会話を
生成された ACP セッションに固定します。子スレッドはなく、同じチャットサーフェスです。
OpenClaw は、transport、auth、safety、delivery の所有を維持します。
その会話内のフォローアップメッセージは同じセッションにルーティングされます。
`/new` と `/reset` はセッションをその場でリセットし、
`/acp close` はバインディングを削除します。

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
    - `--bind here` は、現在の会話バインディングを通知するチャンネルでのみ機能します。それ以外の場合、OpenClaw は明確な非サポートメッセージを返します。バインディングは gateway 再起動後も保持されます。
    - Discord では、`spawnSessions` は `--thread auto|here` の子スレッド作成を制御します。`--bind here` は対象ではありません。
    - `--cwd` なしで別の ACP エージェントに生成する場合、OpenClaw はデフォルトで **ターゲットエージェントの** ワークスペースを継承します。継承されたパスが見つからない場合 (`ENOENT`/`ENOTDIR`) はバックエンドのデフォルトにフォールバックします。その他のアクセスエラー (例: `EACCES`) は生成エラーとして表面化します。
    - Gateway 管理コマンドは、バインドされた会話内ではローカルに留まります。通常のフォローアップテキストがバインドされた ACP セッションにルーティングされる場合でも、`/acp ...` コマンドは OpenClaw によって処理されます。`/status` と `/unfocus` も、そのサーフェスでコマンド処理が有効な場合は常にローカルに留まります。

  </Accordion>
  <Accordion title="スレッドにバインドされたセッション">
    チャンネルアダプターでスレッドバインディングが有効な場合:

    - OpenClaw はスレッドをターゲット ACP セッションにバインドします。
    - そのスレッド内のフォローアップメッセージは、バインドされた ACP セッションにルーティングされます。
    - ACP 出力は同じスレッドに返されます。
    - unfocus/close/archive/idle-timeout または max-age 期限切れにより、バインディングが削除されます。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status`、`/unfocus` は Gateway コマンドであり、ACP ハーネスへのプロンプトではありません。

    スレッドにバインドされた ACP に必要な機能フラグ:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` はデフォルトでオンです (自動 ACP スレッドディスパッチを一時停止するには `false` に設定します。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き機能します)。
    - チャンネルアダプターのスレッドセッション生成が有効 (デフォルト: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    スレッドバインディングサポートはアダプター固有です。アクティブなチャンネルアダプターが
    スレッドバインディングをサポートしていない場合、OpenClaw は明確な
    unsupported/unavailable メッセージを返します。

  </Accordion>
  <Accordion title="スレッドをサポートするチャンネル">
    - セッション/スレッドバインディング機能を公開する任意のチャンネルアダプター。
    - 現在の組み込みサポート: **Discord** スレッド/チャンネル、**Telegram** トピック (グループ/スーパーグループ内のフォーラムトピック、および DM トピック)。
    - Plugin チャンネルは、同じバインディングインターフェース経由でサポートを追加できます。

  </Accordion>
</AccordionGroup>

## 永続的なチャンネルバインディング

非エフェメラルなワークフローでは、トップレベルの
`bindings[]` エントリで永続的な ACP バインディングを構成します。

### バインディングモデル

<ParamField path="bindings[].type" type='"acp"'>
  永続的な ACP 会話バインディングとしてマークします。
</ParamField>
<ParamField path="bindings[].match" type="object">
  ターゲット会話を識別します。チャンネルごとの形状:

- **Discord チャンネル/スレッド:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack チャンネル/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`。安定した Slack ID を推奨します。チャンネルバインディングは、そのチャンネルのスレッド内の返信にも一致します。
- **Telegram フォーラムトピック:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp DM/グループ:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`。ダイレクトチャットには `+15555550123` などの E.164 番号を、グループには `120363424282127706@g.us` などの WhatsApp グループ JID を使用します。
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

- OpenClaw は、チャンネル固有の許可後かつ使用前に、設定済みの ACP セッションが存在することを保証します。
- そのチャンネル、トピック、またはチャット内のメッセージは、設定済みの ACP セッションにルーティングされます。
- 設定済みの ACP バインディングは、自身のセッションルートを所有します。チャンネルのブロードキャストファンアウトは、一致したバインディングの設定済み ACP セッションを置き換えません。
- バインド済み会話では、`/new` と `/reset` は同じ ACP セッションキーをその場でリセットします。
- 一時的なランタイムバインディング（たとえばスレッドフォーカスフローで作成されたもの）は、存在する場所では引き続き適用されます。
- 明示的な `cwd` なしでクロスエージェント ACP をスポーンする場合、OpenClaw はエージェント設定から対象エージェントのワークスペースを継承します。
- 継承されたワークスペースパスが存在しない場合はバックエンドのデフォルト cwd にフォールバックします。存在するがアクセスに失敗した場合は、スポーンエラーとして表面化します。

## ACP セッションを開始する

ACP セッションを開始する方法は 2 つあります。

<Tabs>
  <Tab title="From sessions_spawn">
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
    `runtime` のデフォルトは `subagent` なので、ACP セッションでは
    `runtime: "acp"` を明示的に設定してください。`agentId` が省略された場合、
    OpenClaw は設定されていれば `acp.defaultAgent` を使用します。
    永続的なバインド済み会話を維持するには、`mode: "session"` で
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
  ACP 対象ハーネス ID。設定されていれば `acp.defaultAgent` にフォールバックします。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  サポートされる場合、スレッドバインディングフローを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` はワンショット、`"session"` は永続的です。`thread: true` で
  `mode` が省略された場合、OpenClaw はランタイムパスごとに永続的な動作を
  デフォルトにすることがあります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cwd" type="string">
  要求されたランタイム作業ディレクトリ（バックエンド/ランタイムポリシーによって検証されます）。
  省略された場合、ACP スポーンは設定されていれば対象エージェントのワークスペースを継承します。
  継承されたパスが存在しない場合はバックエンドのデフォルトにフォールバックし、実際のアクセス
  エラーは返されます。
</ParamField>
<ParamField path="label" type="string">
  セッション/バナーテキストで使用される、オペレーター向けラベル。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  新しい ACP セッションを作成する代わりに、既存の ACP セッションを再開します。
  エージェントは `session/load` を介して会話履歴を再生します。
  `runtime: "acp"` が必要です。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` は初期 ACP 実行の進捗サマリーをシステムイベントとしてリクエスト元
  セッションへストリーミングします。受け入れられたレスポンスには、セッションスコープの
  JSONL ログ（`<sessionId>.acp-stream.jsonl`）を指す `streamLogPath` が含まれ、
  完全なリレー履歴を tail できます。親の進捗ストリームは、
  `streaming.progress.commentary=false` でない限り、デフォルトでアシスタントの
  commentary と ACP ステータス進捗を表示します。Discord も、ストリームモードが
  設定されていない場合、親プレビューのデフォルトを進捗モードにします。ステータス進捗は
  引き続き `acp.stream.tagVisibility` に従うため、`plan` などのタグは明示的に
  有効化されない限り非表示のままです。
</ParamField>

ACP `sessions_spawn` 実行は、デフォルトの子ターン制限に
`agents.defaults.subagents.runTimeoutSeconds` を使用します。このツールは呼び出しごとの
タイムアウト上書き（`runTimeoutSeconds`/`timeoutSeconds`）を受け付けず、
config-the-default エラーで拒否されます。

<ParamField path="model" type="string">
  ACP 子セッションの明示的なモデル上書き。Codex ACP スポーンは、
  `openai/gpt-5.4` などの OpenAI 参照を、`session/new` の前に Codex ACP 起動設定へ
  正規化します。`openai/gpt-5.4/high` のようなスラッシュ形式は、Codex ACP の
  reasoning effort も設定します。省略された場合、`sessions_spawn({ runtime: "acp" })`
  は、設定されていれば既存のサブエージェントモデルデフォルト
  （`agents.defaults.subagents.model` または `agents.list[].subagents.model`）を
  使用します。そうでなければ ACP ハーネス自身のデフォルトモデルを使用させます。
  他のハーネスは ACP `models` を広告し、`session/set_model` をサポートする必要があります。
  そうでない場合、OpenClaw/acpx は対象エージェントのデフォルトへ黙ってフォールバックせず、
  明確に失敗します。
</ParamField>
<ParamField path="thinking" type="string">
  明示的な thinking/reasoning effort。Codex ACP では、`minimal` は低 effort にマップされ、
  `low`/`medium`/`high`/`xhigh` は直接マップされ、`off` は reasoning-effort 起動
  上書きを省略します。省略された場合、ACP スポーンは、選択されたモデルに対して既存の
  サブエージェント thinking デフォルトと、モデル別の
  `agents.defaults.models["provider/model"].params.thinking` を使用します。
</ParamField>

## スポーンのバインドとスレッドモード

<Tabs>
  <Tab title="--bind here|off">
    | モード | 動作 |
    | ------ | ----------------------------------------------------------------------- |
    | `here` | 現在のアクティブな会話をその場でバインドします。アクティブな会話がない場合は失敗します。 |
    | `off`  | 現在の会話バインディングを作成しません。                          |

    注記:

    - `--bind here` は、「このチャンネルまたはチャットを Codex バックにする」ための最も単純なオペレーターパスです。
    - `--bind here` は子スレッドを作成しません。
    - `--bind here` は、現在の会話バインディングサポートを公開しているチャンネルでのみ使用できます。
    - `--bind` と `--thread` を同じ `/acp spawn` 呼び出しで組み合わせることはできません。

  </Tab>
  <Tab title="--thread auto|here|off">
    | モード | 動作 |
    | ------ | ------------------------------------------------------------------------------------------------- |
    | `auto` | アクティブなスレッド内では、そのスレッドをバインドします。スレッド外では、サポートされる場合に子スレッドを作成/バインドします。 |
    | `here` | 現在のアクティブなスレッドを要求します。スレッド内でない場合は失敗します。                                                  |
    | `off`  | バインディングなし。セッションは未バインドで開始します。                                                                 |

    注記:

    - 非スレッドバインディング面では、デフォルト動作は実質的に `off` です。
    - スレッドバインドのスポーンにはチャンネルポリシーのサポートが必要です:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - 子スレッドを作成せずに現在の会話へ固定したい場合は、`--bind here` を使用します。

  </Tab>
</Tabs>

## 配信モデル

ACP セッションは、対話型ワークスペースまたは親所有のバックグラウンド作業のどちらにもできます。
配信パスはその形によって異なります。

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    対話型セッションは、表示されているチャット面で会話を続けるためのものです:

    - `/acp spawn ... --bind here` は、現在の会話を ACP セッションにバインドします。
    - `/acp spawn ... --thread ...` は、チャンネルのスレッド/トピックを ACP セッションにバインドします。
    - 永続的に設定された `bindings[].type="acp"` は、一致する会話を同じ ACP セッションへルーティングします。

    バインド済み会話内のフォローアップメッセージは ACP セッションへ直接ルーティングされ、
    ACP 出力は同じチャンネル/スレッド/トピックへ配信されます。

    OpenClaw がハーネスへ送信するもの:

    - 通常のバインド済みフォローアップは、プロンプトテキストとして送信されます。添付ファイルは、ハーネス/バックエンドがサポートする場合のみ追加されます。
    - `/acp` 管理コマンドとローカル Gateway コマンドは、ACP ディスパッチ前にインターセプトされます。
    - ランタイム生成の完了イベントは対象ごとに実体化されます。OpenClaw エージェントは OpenClaw の内部ランタイムコンテキストエンベロープを受け取り、外部 ACP ハーネスは子の結果と指示を含むプレーンなプロンプトを受け取ります。生の `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` エンベロープは、外部ハーネスへ送信したり、ACP ユーザートランスクリプトテキストとして永続化したりしてはいけません。
    - ACP トランスクリプトエントリは、ユーザーに見えるトリガーテキストまたはプレーンな完了プロンプトを使用します。内部イベントメタデータは可能な限り OpenClaw 内で構造化されたまま保持され、ユーザーが作成したチャット内容として扱われません。

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    別のエージェント実行によってスポーンされたワンショット ACP セッションは、
    サブエージェントに似たバックグラウンド子です:

    - 親は `sessions_spawn({ runtime: "acp", mode: "run" })` で作業を依頼します。
    - 子は自身の ACP ハーネスセッション内で実行されます。
    - 子ターンはネイティブサブエージェントスポーンと同じバックグラウンドレーンで実行されるため、遅い ACP ハーネスが無関係なメインセッション作業をブロックしません。
    - 完了はタスク完了アナウンスパスを通じて報告されます。OpenClaw は内部完了メタデータを外部ハーネスへ送信する前にプレーンな ACP プロンプトへ変換するため、ハーネスは OpenClaw 専用のランタイムコンテキストマーカーを見ません。
    - ユーザー向けの返信が有用な場合、親は子の結果を通常のアシスタント音声に書き換えます。

    このパスを親と子の間のピアツーピアチャットとして扱わないでください。
    子にはすでに親へ戻る完了チャンネルがあります。

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` はスポーン後に別のセッションを対象にできます。通常のピア
    セッションでは、OpenClaw はメッセージを注入した後、エージェント間（A2A）の
    フォローアップパスを使用します:

    - 対象セッションの返信を待ちます。
    - 任意で、リクエスト元と対象に制限付きのフォローアップターン数を交換させます。
    - 対象にアナウンスメッセージの生成を依頼します。
    - そのアナウンスを表示中のチャンネルまたはスレッドへ配信します。

    その A2A パスは、送信者が表示可能なフォローアップを必要とするピア送信用のフォールバックです。無関係なセッションが ACP ターゲットを確認してメッセージ送信できる場合、たとえば広範な `tools.sessions.visibility` 設定の下では、有効なままになります。

    OpenClaw は、リクエスターが自身の親所有のワンショット ACP 子の親である場合にのみ、A2A フォローアップをスキップします。その場合、タスク完了の上で A2A を実行すると、子の結果で親を起動し、親の返信を子に転送し返し、親/子のエコーループを作る可能性があります。`sessions_send` の結果は、その所有子ケースで `delivery.status="skipped"` を報告します。これは完了パスがすでに結果を扱う責任を持っているためです。

  </Accordion>
  <Accordion title="既存のセッションを再開">
    新規に開始する代わりに、以前の ACP セッションを続行するには `resumeSessionId` を使用します。エージェントは `session/load` 経由で会話履歴を再生するため、それ以前の完全なコンテキストを引き継いで続行します。

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    一般的なユースケース:

    - Codex セッションをノート PC からスマートフォンへ引き継ぐ - 中断したところから再開するようエージェントに伝えます。
    - CLI で対話的に開始したコーディングセッションを、今度はエージェント経由でヘッドレスに続行します。
    - Gateway の再起動やアイドルタイムアウトで中断された作業を再開します。

    注記:

    - `resumeSessionId` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `streamTo` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `resumeSessionId` はホストローカルの ACP/ハーネス再開 ID であり、OpenClaw チャンネルセッションキーではありません。OpenClaw はディスパッチ前に ACP スポーンポリシーとターゲットエージェントポリシーを引き続き確認しますが、その上流 ID をロードするための認可は ACP バックエンドまたはハーネスが所有します。
    - `resumeSessionId` は上流 ACP 会話履歴を復元します。`thread` と `mode` は作成中の新しい OpenClaw セッションに通常どおり適用されるため、`mode: "session"` は引き続き `thread: true` を必要とします。
    - ターゲットエージェントは `session/load` をサポートしている必要があります（Codex と Claude Code はサポートしています）。
    - セッション ID が見つからない場合、スポーンは明確なエラーで失敗します - 新しいセッションへの暗黙のフォールバックはありません。

  </Accordion>
  <Accordion title="デプロイ後のスモークテスト">
    Gateway のデプロイ後は、単体テストを信頼するのではなく、ライブのエンドツーエンド確認を実行します。

    1. ターゲットホスト上のデプロイ済み Gateway のバージョンとコミットを検証します。
    2. ライブエージェントへの一時 ACPX ブリッジセッションを開きます。
    3. そのエージェントに、`runtime: "acp"`、`agentId: "codex"`、`mode: "run"`、タスク `Reply with exactly LIVE-ACP-SPAWN-OK` で `sessions_spawn` を呼び出すよう依頼します。
    4. `accepted=yes`、実際の `childSessionKey`、バリデーターエラーがないことを検証します。
    5. 一時ブリッジセッションをクリーンアップします。

    ゲートは `mode: "run"` のままにし、`streamTo: "parent"` はスキップします -
    スレッドに紐づく `mode: "session"` とストリームリレーのパスは、別のより豊富な統合パスです。

  </Accordion>
</AccordionGroup>

## サンドボックス互換性

ACP セッションは現在、OpenClaw
サンドボックス内ではなく、ホストランタイム上で実行されます。

<Warning>
**セキュリティ境界:**

- 外部ハーネスは、自身の CLI 権限と選択された `cwd` に従って読み書きできます。
- OpenClaw のサンドボックスポリシーは ACP ハーネス実行を**ラップしません**。
- OpenClaw は引き続き ACP 機能ゲート、許可されたエージェント、セッション所有権、チャンネルバインディング、Gateway 配信ポリシーを強制します。
- サンドボックスで強制される OpenClaw ネイティブ作業には `runtime: "subagent"` を使用します。

</Warning>

現在の制限:

- リクエスターセッションがサンドボックス化されている場合、ACP スポーンは `sessions_spawn({ runtime: "acp" })` と `/acp spawn` の両方でブロックされます。
- `runtime: "acp"` を指定した `sessions_spawn` は `sandbox: "require"` をサポートしません。

## セッションターゲットの解決

ほとんどの `/acp` アクションは、省略可能なセッションターゲット（`session-key`、`session-id`、または `session-label`）を受け取ります。

**解決順序:**

1. 明示的なターゲット引数（または `/acp steer` の `--session`）
   - キーを試します
   - 次に UUID 形式のセッション ID
   - 次にラベル
2. 現在のスレッドバインディング（この会話/スレッドが ACP セッションにバインドされている場合）。
3. 現在のリクエスターセッションへのフォールバック。

現在の会話バインディングとスレッドバインディングは、どちらもステップ 2 に参加します。

ターゲットが解決されない場合、OpenClaw は明確なエラーを返します
（`Unable to resolve session target: ...`）。

## ACP コントロール

| コマンド              | 動作                                              | 例                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP セッションを作成します。任意で現在のバインドまたはスレッドバインドを指定できます。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ターゲットセッションの進行中ターンをキャンセルします。                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 実行中セッションにステア指示を送信します。                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | セッションを閉じ、スレッドターゲットのバインドを解除します。                  | `/acp close`                                                  |
| `/acp status`        | バックエンド、モード、状態、ランタイムオプション、機能を表示します。 | `/acp status`                                                 |
| `/acp set-mode`      | ターゲットセッションのランタイムモードを設定します。                      | `/acp set-mode plan`                                          |
| `/acp set`           | 汎用ランタイム設定オプションを書き込みます。                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ランタイム作業ディレクトリのオーバーライドを設定します。                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 承認ポリシープロファイルを設定します。                              | `/acp permissions strict`                                     |
| `/acp timeout`       | ランタイムタイムアウト（秒）を設定します。                            | `/acp timeout 120`                                            |
| `/acp model`         | ランタイムモデルのオーバーライドを設定します。                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | セッションランタイムオプションのオーバーライドを削除します。                  | `/acp reset-options`                                          |
| `/acp sessions`      | ストア内の最近の ACP セッションを一覧表示します。                      | `/acp sessions`                                               |
| `/acp doctor`        | バックエンドの健全性、機能、実行可能な修正を表示します。           | `/acp doctor`                                                 |
| `/acp install`       | 決定論的なインストール手順と有効化手順を出力します。             | `/acp install`                                                |

ランタイムコントロール（`spawn`、`cancel`、`steer`、`close`、`status`、`set-mode`、
`set`、`cwd`、`permissions`、`timeout`、`model`、および `reset-options`）には、外部チャンネルからの所有者 ID と内部 Gateway クライアントからの `operator.admin` が必要です。認可された非所有者の送信者は、引き続き `sessions`、
`doctor`、`install`、および `help` を使用できます。

`/acp status` は、有効なランタイムオプションに加えて、ランタイムレベルおよびバックエンドレベルのセッション識別子を表示します。バックエンドに機能がない場合、サポートされていないコントロールのエラーが明確に表示されます。`/acp sessions` は、現在バインドされているセッションまたはリクエスターセッションのストアを読み取ります。ターゲットトークン（`session-key`、`session-id`、または `session-label`）は、エージェントごとのカスタム `session.store` ルートを含む Gateway セッション検出を通じて解決されます。

### ランタイムオプションのマッピング

`/acp` には便利なコマンドと汎用セッターがあります。同等の操作:

| コマンド                      | マップ先                              | 注記                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | ランタイム設定キー `model`           | Codex ACP の場合、OpenClaw は `openai/<model>` をアダプターモデル ID に正規化し、`openai/gpt-5.4/high` のようなスラッシュ推論サフィックスを `reasoning_effort` にマップします。                                         |
| `/acp set thinking <level>`  | 正規オプション `thinking`          | OpenClaw は、存在する場合はバックエンドが通知した同等の値を送信し、`thinking`、次に `effort`、`reasoning_effort`、または `thought_level` を優先します。Codex ACP の場合、アダプターは値を `reasoning_effort` にマップします。 |
| `/acp permissions <profile>` | 正規オプション `permissionProfile` | OpenClaw は、存在する場合は `approval_policy`、`permission_profile`、`permissions`、または `permission_mode` など、バックエンドが通知した同等の値を送信します。                                                       |
| `/acp timeout <seconds>`     | 正規オプション `timeoutSeconds`    | OpenClaw は、存在する場合は `timeout` または `timeout_seconds` など、バックエンドが通知した同等の値を送信します。                                                                                                     |
| `/acp cwd <path>`            | ランタイム cwd オーバーライド                 | 直接更新します。                                                                                                                                                                                             |
| `/acp set <key> <value>`     | 汎用                              | `key=cwd` は cwd オーバーライドパスを使用します。                                                                                                                                                                      |
| `/acp reset-options`         | すべてのランタイムオーバーライドをクリア         | -                                                                                                                                                                                                          |

## acpx ハーネス、Plugin セットアップ、権限

acpx ハーネス設定（Claude Code / Codex / Gemini CLI エイリアス）、plugin-tools と OpenClaw-tools MCP ブリッジ、および ACP 権限モードについては、[ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup) を参照してください。

## トラブルシューティング

| 症状                                                                                      | 考えられる原因                                                                                                         | 修正                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                                   | バックエンドPluginがない、無効化されている、または `plugins.allow` によってブロックされている。                       | バックエンドPluginをインストールして有効化し、その許可リストが設定されている場合は `plugins.allow` に `acpx` を含めてから、`/acp doctor` を実行する。                  |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACPがグローバルに無効化されている。                                                                                   | `acp.enabled=true` を設定する。                                                                                                                                         |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | 通常のスレッドメッセージからの自動ディスパッチが無効化されている。                                                     | 自動スレッドルーティングを再開するには `acp.dispatch.enabled=true` を設定する。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き動作する。              |
| `ACP agent "<id>" is not allowed by policy`                                               | エージェントが許可リストに含まれていない。                                                                             | 許可された `agentId` を使うか、`acp.allowedAgents` を更新する。                                                                                                         |
| `/acp doctor` reports backend not ready right after startup                               | バックエンドPluginがない、無効化されている、許可/拒否ポリシーでブロックされている、または設定済みの実行ファイルが利用できない。 | バックエンドPluginをインストール/有効化し、`/acp doctor` を再実行する。正常でない状態が続く場合は、バックエンドのインストールまたはポリシーエラーを調べる。            |
| Harness command not found                                                                 | アダプターCLIがインストールされていない、外部Pluginがない、または非Codexアダプターで初回実行時の `npx` 取得に失敗した。 | `/acp doctor` を実行し、Gatewayホストでアダプターをインストール/事前ウォームアップするか、acpxエージェントコマンドを明示的に設定する。                                |
| Model-not-found from the harness                                                          | モデルIDは別のプロバイダー/ハーネスでは有効だが、このACPターゲットでは有効でない。                                    | そのハーネスが一覧表示するモデルを使うか、ハーネス内でモデルを設定するか、オーバーライドを省略する。                                                                   |
| Vendor auth error from the harness                                                        | OpenClawは正常だが、ターゲットCLI/プロバイダーにログインしていない。                                                   | Gatewayホスト環境でログインするか、必要なプロバイダーキーを指定する。                                                                                                  |
| `Unable to resolve session target: ...`                                                   | キー/ID/ラベルトークンが正しくない。                                                                                  | `/acp sessions` を実行し、正確なキー/ラベルをコピーして再試行する。                                                                                                     |
| `--bind here requires running /acp spawn inside an active ... conversation`               | アクティブなバインド可能会話なしで `--bind here` が使われた。                                                          | ターゲットのチャット/チャンネルに移動して再試行するか、バインドなしのspawnを使う。                                                                                     |
| `Conversation bindings are unavailable for <channel>.`                                    | アダプターに現在の会話へのACPバインディング機能がない。                                                                | サポートされている場合は `/acp spawn ... --thread ...` を使うか、トップレベルの `bindings[]` を設定するか、サポートされているチャンネルに移動する。                    |
| `--thread here requires running /acp spawn inside an active ... thread`                   | スレッドコンテキスト外で `--thread here` が使われた。                                                                  | ターゲットスレッドに移動するか、`--thread auto`/`off` を使う。                                                                                                         |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | 別のユーザーがアクティブなバインディングターゲットを所有している。                                                     | 所有者として再バインドするか、別の会話またはスレッドを使う。                                                                                                           |
| `Thread bindings are unavailable for <channel>.`                                          | アダプターにスレッドバインディング機能がない。                                                                         | `--thread off` を使うか、サポートされているアダプター/チャンネルに移動する。                                                                                           |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | ACPランタイムはホスト側にある。要求元セッションはサンドボックス化されている。                                          | サンドボックス化されたセッションからは `runtime="subagent"` を使うか、サンドボックス化されていないセッションからACP spawnを実行する。                                 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | ACPランタイムに `sandbox="require"` が要求された。                                                                     | 必須のサンドボックス化には `runtime="subagent"` を使うか、サンドボックス化されていないセッションから `sandbox="inherit"` でACPを使う。                                  |
| `Cannot apply --model ... did not advertise model support`                                | ターゲットハーネスが汎用ACPモデル切り替えを公開していない。                                                            | ACP `models`/`session/set_model` を公開しているハーネスを使うか、Codex ACPモデル参照を使うか、独自の起動フラグがある場合はハーネス内でモデルを直接設定する。           |
| Missing ACP metadata for bound session                                                    | 古い、または削除済みのACPセッションメタデータ。                                                                        | `/acp spawn` で再作成してから、スレッドを再バインド/フォーカスする。                                                                                                   |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` が非対話ACPセッションで書き込み/実行をブロックしている。                                              | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定し、gatewayを再起動する。[権限設定](/ja-JP/tools/acp-agents-setup#permission-configuration)を参照。       |
| ACP session fails early with little output                                                | 権限プロンプトが `permissionMode`/`nonInteractivePermissions` によってブロックされている。                             | gatewayログで `AcpRuntimeError` を確認する。完全な権限には `permissionMode=approve-all` を設定し、穏やかな機能低下には `nonInteractivePermissions=deny` を設定する。   |
| ACP session stalls indefinitely after completing work                                     | ハーネスプロセスは終了したが、ACPセッションが完了を報告しなかった。                                                    | OpenClawを更新する。現在のacpxクリーンアップは、OpenClawが所有する古いラッパーおよびアダプタープロセスを、クローズ時とGateway起動時に回収する。                       |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                      | 内部イベントエンベロープがACP境界を越えて漏れた。                                                                     | OpenClawを更新し、完了フローを再実行する。外部ハーネスはプレーンな完了プロンプトのみを受け取るべきである。                                                            |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` はACP/acpxではなく、ネイティブCodexフックリレーに属する。バインドされたCodexチャットでは、`/new` または `/reset` で新しいセッションを開始する。一度は動作し、その後次のネイティブツール呼び出しで再発する場合は、`/new` を繰り返すのではなく、Codex app-serverまたはOpenClaw Gatewayを再起動する。[Codexハーネスのトラブルシューティング](/ja-JP/plugins/codex-harness#troubleshooting)を参照。
</Note>

## 関連

- [ACPエージェント - セットアップ](/ja-JP/tools/acp-agents-setup)
- [エージェント送信](/ja-JP/tools/agent-send)
- [CLIバックエンド](/ja-JP/gateway/cli-backends)
- [Codexハーネス](/ja-JP/plugins/codex-harness)
- [Codexハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (ブリッジモード)](/ja-JP/cli/acp)
- [サブエージェント](/ja-JP/tools/subagents)
