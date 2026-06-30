---
read_when:
    - ACP 経由でコーディングハーネスを実行する
    - メッセージングチャネルで会話に紐づいたACPセッションを設定する
    - メッセージチャネルの会話を永続的な ACP セッションにバインドする
    - ACP バックエンド、plugin 配線、または完了配信のトラブルシューティング
    - チャットから /acp コマンドを操作する
sidebarTitle: ACP agents
summary: ACP バックエンド経由で外部コーディングハーネス（Claude Code、Cursor、Gemini CLI、明示的な Codex ACP、OpenClaw ACP、OpenCode）を実行する
title: ACP エージェント
x-i18n:
    generated_at: "2026-06-30T13:49:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61edbc3b5a8303dc88e27a1315fe996da70eeee7aa211877d5680eb150e36cb
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) セッションにより、
OpenClaw は ACP バックエンドプラグインを通じて外部コーディングハーネス（たとえば Claude Code、
Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI、およびその他の
サポートされている ACPX ハーネス）を実行できます。

各 ACP セッションの起動は[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

<Note>
**ACP は外部ハーネス用の経路であり、デフォルトの Codex 経路ではありません。** 
ネイティブ Codex app-server プラグインは、エージェントターン用の `/codex ...` コントロールとデフォルトの
`openai/gpt-*` 組み込みランタイムを所有します。一方 ACP は、
`/acp ...` コントロールと `sessions_spawn({ runtime: "acp" })` セッションを所有します。

Codex または Claude Code を外部 MCP クライアントとして既存の OpenClaw チャンネル会話に
直接接続したい場合は、ACP ではなく
[`openclaw mcp serve`](/ja-JP/cli/mcp) を使用します。
</Note>

## どのページを使えばよいですか？

| やりたいこと                                                                                    | 使用するもの                              | メモ                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 現在の会話で Codex をバインドまたは制御する                                               | `/codex bind`, `/codex threads`       | `codex` プラグインが有効な場合のネイティブ Codex app-server 経路です。バインドされたチャット返信、画像転送、モデル/高速/権限、停止、誘導コントロールを含みます。ACP は明示的なフォールバックです |
| Claude Code、Gemini CLI、明示的な Codex ACP、または別の外部ハーネスを OpenClaw _経由で_ 実行する | このページ                             | チャットにバインドされたセッション、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、バックグラウンドタスク、ランタイムコントロール                                                                                   |
| エディターまたはクライアント向けに OpenClaw Gateway セッションを ACP サーバー _として_ 公開する                   | [`openclaw acp`](/ja-JP/cli/acp)            | ブリッジモードです。IDE/クライアントは stdio/WebSocket 経由で OpenClaw に ACP で通信します                                                                                                                            |
| ローカル AI CLI をテキスト専用フォールバックモデルとして再利用する                                              | [CLI バックエンド](/ja-JP/gateway/cli-backends) | ACP ではありません。OpenClaw ツールも ACP コントロールもハーネスランタイムもありません                                                                                                                               |

## これはそのまま動作しますか？

はい。公式 ACP ランタイムプラグインをインストールした後に動作します。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

ソースチェックアウトでは、`pnpm install` 後にローカルの `extensions/acpx` ワークスペースプラグインを使用できます。
準備状況チェックには `/acp doctor` を実行します。

OpenClaw がエージェントに ACP 起動を教えるのは、ACP が**実際に
使用可能**な場合だけです。ACP が有効であり、ディスパッチが無効化されておらず、現在の
セッションがサンドボックスでブロックされておらず、ランタイムバックエンドが
読み込まれている必要があります。これらの条件が満たされない場合、ACP プラグイン Skills と
`sessions_spawn` の ACP ガイダンスは非表示のままになり、エージェントが
利用できないバックエンドを提案しないようにします。

<AccordionGroup>
  <Accordion title="First-run gotchas">
    - `plugins.allow` が設定されている場合、それは制限付きのプラグインインベントリであり、**必ず** `acpx` を含める必要があります。含まれていない場合、インストール済みの ACP バックエンドは意図的にブロックされ、`/acp doctor` は allowlist エントリがないことを報告します。
    - Codex ACP アダプターは `acpx` プラグインとともにステージングされ、可能な場合はローカルで起動されます。
    - Codex ACP は分離された `CODEX_HOME` で実行されます。OpenClaw は信頼済みプロジェクトエントリと安全なモデル/プロバイダーのルーティング設定をホストの Codex 設定からコピーします。一方、認証、通知、フックはホスト設定に残ります。
    - 他の対象ハーネスアダプターは、初回使用時に必要に応じて `npx` で取得されることがあります。
    - そのハーネスのベンダー認証は、引き続きホスト上に存在している必要があります。
    - ホストに npm またはネットワークアクセスがない場合、キャッシュを事前に温めるか、別の方法でアダプターをインストールするまで、初回のアダプター取得は失敗します。

  </Accordion>
  <Accordion title="Runtime prerequisites">
    ACP は実際の外部ハーネスプロセスを起動します。OpenClaw はルーティング、
    バックグラウンドタスク状態、配信、バインディング、ポリシーを所有します。ハーネスは、
    そのプロバイダーログイン、モデルカタログ、ファイルシステム動作、
    ネイティブツールを所有します。

    OpenClaw を疑う前に、以下を確認してください。

    - `/acp doctor` が有効で正常なバックエンドを報告している。
    - その allowlist が設定されている場合、対象 id が `acp.allowedAgents` で許可されている。
    - ハーネスコマンドが Gateway ホスト上で起動できる。
    - そのハーネス（`claude`、`codex`、`gemini`、`opencode`、`droid` など）のプロバイダー認証が存在している。
    - 選択したモデルがそのハーネスに存在している - モデル id はハーネス間で移植可能ではありません。
    - 要求された `cwd` が存在しアクセス可能である。そうでない場合は `cwd` を省略し、バックエンドにデフォルトを使用させる。
    - 権限モードが作業に合っている。非インタラクティブセッションではネイティブ権限プロンプトをクリックできないため、書き込み/実行の多いコーディング実行では通常、ヘッドレスで進行できる ACPX 権限プロファイルが必要です。

  </Accordion>
</AccordionGroup>

OpenClaw プラグインツールと組み込み OpenClaw ツールは、デフォルトでは
ACP ハーネスに公開されません。ハーネスがそれらのツールを直接呼び出すべき場合にのみ、
[ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup) の明示的な MCP ブリッジを有効にします。

## サポートされているハーネス対象

`acpx` バックエンドでは、これらのハーネス id を `/acp spawn <id>`
または `sessions_spawn({ runtime: "acp", agentId: "<id>" })` の対象として使用します。

| ハーネス id | 一般的なバックエンド                                | メモ                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP アダプター                        | ホスト上の Claude Code 認証が必要です。                                              |
| `codex`    | Codex ACP アダプター                              | ネイティブ `/codex` が利用できない場合、または ACP が要求された場合のみの明示的な ACP フォールバックです。 |
| `copilot`  | GitHub Copilot ACP アダプター                     | Copilot CLI/ランタイム認証が必要です。                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | ローカルインストールが別の ACP エントリポイントを公開している場合は、acpx コマンドを上書きします。    |
| `droid`    | Factory Droid CLI                              | ハーネス環境内の Factory/Droid 認証または `FACTORY_API_KEY` が必要です。        |
| `gemini`   | Gemini CLI ACP アダプター                         | Gemini CLI 認証または API キー設定が必要です。                                          |
| `iflow`    | iFlow CLI                                      | アダプターの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `kilocode` | Kilo Code CLI                                  | アダプターの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `kimi`     | Kimi/Moonshot CLI                              | ホスト上の Kimi/Moonshot 認証が必要です。                                            |
| `kiro`     | Kiro CLI                                       | アダプターの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `opencode` | OpenCode ACP アダプター                           | OpenCode CLI/プロバイダー認証が必要です。                                                |
| `openclaw` | `openclaw acp` 経由の OpenClaw Gateway ブリッジ | ACP 対応ハーネスが OpenClaw Gateway セッションへ通信し返せるようにします。                 |
| `qwen`     | Qwen Code / Qwen CLI                           | ホスト上の Qwen 互換認証が必要です。                                          |

カスタム acpx エージェントエイリアスは acpx 自体で設定できますが、OpenClaw
ポリシーは引き続き、ディスパッチ前に `acp.allowedAgents` と
`agents.list[].runtime.acp.agent` マッピングを確認します。

## オペレーターランブック

チャットからのクイック `/acp` フロー:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`、
    `/acp spawn gemini --mode persistent --thread auto`、または明示的な
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="Work">
    バインドされた会話またはスレッドで続行します（またはセッション
    キーを明示的に対象にします）。
  </Step>
  <Step title="Check state">
    `/acp status`
  </Step>
  <Step title="Tune">
    `/acp model <provider/model>`、
    `/acp permissions <profile>`、
    `/acp timeout <seconds>`。
  </Step>
  <Step title="Steer">
    コンテキストを置き換えずに: `/acp steer tighten logging and continue`。
  </Step>
  <Step title="Stop">
    `/acp cancel`（現在のターン）または `/acp close`（セッション + バインディング）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lifecycle details">
    - 起動は ACP ランタイムセッションを作成または再開し、OpenClaw セッションストアに ACP メタデータを記録し、実行が親所有の場合はバックグラウンドタスクを作成することがあります。
    - 親所有の ACP セッションは、ランタイムセッションが永続的な場合でもバックグラウンド作業として扱われます。完了とサーフェス横断の配信は、通常のユーザー向けチャットセッションのように動作するのではなく、親タスク通知機構を通じて行われます。
    - タスクメンテナンスは、終端状態または孤立した親所有のワンショット ACP セッションを閉じます。永続 ACP セッションはアクティブな会話バインディングが残っている間は保持されます。アクティブなバインディングがない古い永続セッションは、所有タスクが完了した後、またはそのタスクレコードがなくなった後に、暗黙に再開されないよう閉じられます。
    - バインドされたフォローアップメッセージは、バインディングが閉じられる、フォーカス解除される、リセットされる、または期限切れになるまで、ACP セッションへ直接送られます。
    - Gateway コマンドはローカルに留まります。`/acp ...`、`/status`、`/unfocus` が、バインドされた ACP ハーネスに通常のプロンプトテキストとして送信されることはありません。
    - `cancel` は、バックエンドがキャンセルをサポートしている場合にアクティブなターンを中止します。バインディングやセッションメタデータは削除しません。
    - `close` は OpenClaw の観点から ACP セッションを終了し、バインディングを削除します。ハーネスが再開をサポートしている場合、自身のアップストリーム履歴を保持することがあります。
    - acpx プラグインは `close` 後に OpenClaw 所有のラッパーおよびアダプタープロセスツリーをクリーンアップし、Gateway 起動時に古い OpenClaw 所有 ACPX 孤児プロセスを刈り取ります。
    - アイドル状態のランタイムワーカーは `acp.runtime.ttlMinutes` 後にクリーンアップ対象になります。保存済みセッションメタデータは `/acp sessions` で引き続き利用できます。

  </Accordion>
  <Accordion title="Native Codex routing rules">
    有効な場合に**ネイティブ Codex
    プラグイン**へルーティングされるべき自然言語トリガー:

    - 「この Discord チャンネルを Codex にバインドして。」
    - 「このチャットを Codex スレッド `<id>` に接続して。」
    - 「Codex スレッドを表示してから、これをバインドして。」

    ネイティブ Codex 会話バインディングは、デフォルトのチャット制御パスです。
    OpenClaw 動的ツールは引き続き OpenClaw 経由で実行されますが、
    shell/apply-patch などの Codex ネイティブツールは Codex 内で実行されます。
    Codex ネイティブツールイベントでは、OpenClaw はターンごとのネイティブ
    フックリレーを注入し、Plugin フックが `before_tool_call` をブロックし、
    `after_tool_call` を監視し、Codex `PermissionRequest` イベントを
    OpenClaw 承認経由でルーティングできるようにします。Codex `Stop` フックは
    OpenClaw `before_agent_finalize` にリレーされ、そこで Plugin は Codex が回答を
    確定する前に、もう 1 回のモデルパスを要求できます。このリレーは意図的に
    保守的なままです。Codex ネイティブツール引数を変更したり、Codex スレッドレコードを
    書き換えたりしません。ACP ランタイム/セッションモデルを使いたい場合にのみ、
    明示的な ACP を使用してください。埋め込み Codex
    サポート境界は
    [Codex ハーネス v1 サポート契約](/ja-JP/plugins/codex-harness-runtime#v1-support-contract)に記載されています。

  </Accordion>
  <Accordion title="モデル / プロバイダー / ランタイム選択チートシート">
    - レガシー Codex モデル参照 - doctor によって修復されるレガシー Codex OAuth/サブスクリプションモデルルート。
    - `openai/*` - OpenAI エージェントターン用のネイティブ Codex app-server 埋め込みランタイム。
    - `/codex ...` - ネイティブ Codex 会話制御。
    - `/acp ...` または `runtime: "acp"` - 明示的な ACP/acpx 制御。

  </Accordion>
  <Accordion title="ACP ルーティングの自然言語トリガー">
    ACP ランタイムにルーティングする必要があるトリガー:

    - 「これをワンショット Claude Code ACP セッションとして実行し、結果を要約してください。」
    - 「このタスクには Gemini CLI をスレッド内で使用し、その後のフォローアップも同じスレッドに維持してください。」
    - 「Codex を ACP 経由でバックグラウンドスレッドで実行してください。」

    OpenClaw は `runtime: "acp"` を選択し、ハーネス `agentId` を解決し、
    サポートされている場合は現在の会話またはスレッドにバインドし、
    close/expiry までフォローアップをそのセッションにルーティングします。Codex は、
    ACP/acpx が明示されている場合、または要求された操作でネイティブ Codex
    Plugin が利用できない場合にのみ、このパスに従います。

    `sessions_spawn` では、ACP が有効で、要求元がサンドボックス化されておらず、
    ACP ランタイムバックエンドがロードされている場合にのみ、
    `runtime: "acp"` が通知されます。`acp.dispatch.enabled=false` は自動
    ACP スレッドディスパッチを一時停止しますが、明示的な
    `sessions_spawn({ runtime: "acp" })` 呼び出しを非表示にしたりブロックしたりしません。これは `codex`、
    `claude`、`droid`、`gemini`、`opencode` などの ACP ハーネス id を対象にします。該当エントリが
    `agents.list[].runtime.type="acp"` で明示的に構成されていない限り、`agents_list` から通常の
    OpenClaw config エージェント id を渡さないでください。
    それ以外の場合は、デフォルトのサブエージェントランタイムを使用してください。OpenClaw エージェントが
    `runtime.type="acp"` で構成されている場合、OpenClaw は
    `runtime.acp.agent` を基盤となるハーネス id として使用します。

  </Accordion>
</AccordionGroup>

## ACP とサブエージェントの比較

外部ハーネスランタイムを使いたい場合は ACP を使用します。`codex`
Plugin が有効な場合に Codex 会話バインディング/制御を行うには、**ネイティブ Codex
app-server** を使用します。OpenClaw ネイティブの
委任実行を使いたい場合は、**サブエージェント** を使用します。

| 領域          | ACP セッション                           | サブエージェント実行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| ランタイム       | ACP バックエンド Plugin（例: acpx） | OpenClaw ネイティブサブエージェントランタイム  |
| セッションキー   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主なコマンド | `/acp ...`                            | `/subagents ...`                   |
| 起動ツール    | `runtime:"acp"` 付きの `sessions_spawn` | `sessions_spawn`（デフォルトランタイム） |

[サブエージェント](/ja-JP/tools/subagents)も参照してください。

## ACP が Claude Code を実行する仕組み

ACP 経由の Claude Code では、スタックは次のとおりです。

1. OpenClaw ACP セッション制御プレーン。
2. 公式 `@openclaw/acpx` ランタイム Plugin。
3. Claude ACP アダプター。
4. Claude 側のランタイム/セッション機構。

ACP Claude は、ACP 制御、セッション再開、
バックグラウンドタスク追跡、任意の会話/スレッドバインディングを備えた**ハーネスセッション**です。

CLI バックエンドは、別個のテキスト専用ローカルフォールバックランタイムです -
[CLI バックエンド](/ja-JP/gateway/cli-backends)を参照してください。

オペレーター向けの実用的なルールは次のとおりです。

- **`/acp spawn`、バインド可能なセッション、ランタイム制御、または永続的なハーネス作業が必要ですか?** ACP を使用します。
- **生の CLI 経由のシンプルなローカルテキストフォールバックが必要ですか?** CLI バックエンドを使用します。

## バインドされたセッション

### メンタルモデル

- **チャットサーフェス** - 人が会話を続ける場所（Discord チャンネル、Telegram トピック、iMessage チャット）。
- **ACP セッション** - OpenClaw がルーティングする永続的な Codex/Claude/Gemini ランタイム状態。
- **子スレッド/トピック** - `--thread ...` によってのみ作成される任意の追加メッセージングサーフェス。
- **ランタイムワークスペース** - ハーネスが実行されるファイルシステム上の場所（`cwd`、repo checkout、バックエンドワークスペース）。チャットサーフェスとは独立しています。

### 現在の会話へのバインド

`/acp spawn <harness> --bind here` は、現在の会話を
起動された ACP セッションに固定します - 子スレッドはなく、同じチャットサーフェスです。OpenClaw は
引き続き transport、auth、safety、delivery を所有します。その
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
    - `--bind here` と `--thread ...` は相互に排他的です。
    - `--bind here` は、現在の会話バインディングを通知するチャンネルでのみ機能します。それ以外の場合、OpenClaw は明確な未サポートメッセージを返します。バインディングは Gateway の再起動後も保持されます。
    - Discord では、`spawnSessions` は `--thread auto|here` の子スレッド作成を制御します - `--bind here` ではありません。
    - `--cwd` なしで別の ACP エージェントに起動した場合、OpenClaw はデフォルトで**ターゲットエージェントの**ワークスペースを継承します。継承されたパスがない場合（`ENOENT`/`ENOTDIR`）はバックエンドのデフォルトにフォールバックします。その他のアクセスエラー（例: `EACCES`）は起動エラーとして表示されます。
    - Gateway 管理コマンドはバインドされた会話内でもローカルに留まります - 通常のフォローアップテキストがバインドされた ACP セッションにルーティングされる場合でも、`/acp ...` コマンドは OpenClaw によって処理されます。`/status` と `/unfocus` も、そのサーフェスでコマンド処理が有効な場合は常にローカルに留まります。

  </Accordion>
  <Accordion title="スレッドバインドセッション">
    チャンネルアダプターでスレッドバインディングが有効な場合:

    - OpenClaw はスレッドをターゲット ACP セッションにバインドします。
    - そのスレッド内のフォローアップメッセージは、バインドされた ACP セッションにルーティングされます。
    - ACP 出力は同じスレッドに返送されます。
    - Unfocus/close/archive/idle-timeout または max-age expiry によってバインディングが削除されます。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status`、`/unfocus` は Gateway コマンドであり、ACP ハーネスへのプロンプトではありません。

    スレッドバインド ACP に必要な feature flags:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` はデフォルトでオンです（自動 ACP スレッドディスパッチを一時停止するには `false` を設定します。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き機能します）。
    - チャンネルアダプターのスレッドセッション起動が有効（デフォルト: `true`）:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    スレッドバインディングのサポートはアダプター固有です。アクティブなチャンネル
    アダプターがスレッドバインディングをサポートしていない場合、OpenClaw は明確な
    未サポート/利用不可メッセージを返します。

  </Accordion>
  <Accordion title="スレッド対応チャンネル">
    - セッション/スレッドバインディング機能を公開する任意のチャンネルアダプター。
    - 現在の組み込みサポート: **Discord** スレッド/チャンネル、**Telegram** トピック（グループ/スーパーグループのフォーラムトピックと DM トピック）。
    - Plugin チャンネルは同じバインディングインターフェイスを通じてサポートを追加できます。

  </Accordion>
</AccordionGroup>

## 永続的なチャンネルバインディング

非エフェメラルなワークフローでは、トップレベルの
`bindings[]` エントリで永続的な ACP バインディングを構成します。

### バインディングモデル

<ParamField path="bindings[].type" type='"acp"'>
  永続的な ACP 会話バインディングを示します。
</ParamField>
<ParamField path="bindings[].match" type="object">
  ターゲット会話を識別します。チャンネルごとの形状:

- **Discord チャンネル/スレッド:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack チャンネル/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`。安定した Slack id を推奨します。チャンネルバインディングは、そのチャンネルのスレッド内の返信にも一致します。
- **Telegram フォーラムトピック:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp DM/グループ:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`。直接チャットには `+15555550123` などの E.164 番号を使用し、グループには `120363424282127706@g.us` などの WhatsApp グループ JID を使用します。
- **iMessage DM/グループ:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。安定したグループバインディングには `chat_id:*` を推奨します。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  所有する OpenClaw エージェント id。
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

`agents.list[].runtime` を使用して、エージェントごとに ACP デフォルトを一度定義します。

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

- OpenClaw は、チャネル固有の受け入れ後、使用前に、設定された ACP セッションが存在することを保証します。
- そのチャネル、トピック、またはチャット内のメッセージは、設定された ACP セッションにルーティングされます。
- 設定済みの ACP バインディングは、自身のセッションルートを所有します。チャネルのブロードキャスト fan-out は、一致したバインディングに設定された ACP セッションを置き換えません。
- バインドされた会話では、`/new` と `/reset` は同じ ACP セッションキーをその場でリセットします。
- 一時的なランタイムバインディング（たとえば thread-focus フローで作成されたもの）は、存在する場所では引き続き適用されます。
- 明示的な `cwd` なしでクロスエージェント ACP spawn を行う場合、OpenClaw はエージェント設定からターゲットエージェントのワークスペースを継承します。
- 継承されたワークスペースパスが存在しない場合はバックエンドのデフォルト cwd にフォールバックします。存在するパスへのアクセス失敗は spawn エラーとして表面化します。

## ACP セッションを開始する

ACP セッションを開始する方法は 2 つあります。

<Tabs>
  <Tab title="From sessions_spawn">
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
    `runtime` のデフォルトは `subagent` なので、ACP セッションでは `runtime: "acp"` を明示的に設定します。`agentId` が省略された場合、OpenClaw は設定されていれば `acp.defaultAgent` を使用します。永続的なバインド済み会話を保持するには、`mode: "session"` に `thread: true` が必要です。
    </Note>

  </Tab>
  <Tab title="From /acp command">
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
  ACP ターゲットハーネス id。設定されている場合は `acp.defaultAgent` にフォールバックします。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  サポートされている場合にスレッドバインディングフローを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` は一回限りです。`"session"` は永続的です。`thread: true` で `mode` が省略された場合、OpenClaw はランタイムパスごとに永続動作をデフォルトにする場合があります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cwd" type="string">
  要求されたランタイム作業ディレクトリ（バックエンド/ランタイムポリシーによって検証されます）。省略された場合、ACP spawn は設定されていればターゲットエージェントのワークスペースを継承します。継承されたパスが存在しない場合はバックエンドのデフォルトにフォールバックし、実際のアクセスエラーは返されます。
</ParamField>
<ParamField path="label" type="string">
  セッション/バナーテキストで使用されるオペレーター向けラベル。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  新しい ACP セッションを作成する代わりに、既存の ACP セッションを再開します。エージェントは `session/load` 経由で会話履歴を再生します。`runtime: "acp"` が必要です。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` は、初期 ACP 実行の進捗サマリーをシステムイベントとして要求元セッションにストリームします。受け入れられたレスポンスには、完全なリレー履歴を tail できるセッションスコープの JSONL ログ（`<sessionId>.acp-stream.jsonl`）を指す `streamLogPath` が含まれます。親進捗ストリームは、`streaming.progress.commentary=false` でない限り、デフォルトで assistant commentary と ACP ステータス進捗を表示します。Discord も、ストリームモードが設定されていない場合、親プレビューをデフォルトで進捗モードにします。ステータス進捗は引き続き `acp.stream.tagVisibility` を尊重するため、`plan` などのタグは明示的に有効化されない限り非表示のままです。
</ParamField>

ACP `sessions_spawn` 実行は、デフォルトの子ターン制限として `agents.defaults.subagents.runTimeoutSeconds` を使用します。このツールは呼び出しごとのタイムアウト上書きを受け付けません。

<ParamField path="model" type="string">
  ACP 子セッションの明示的なモデル上書き。Codex ACP spawn は、`openai/gpt-5.4` などの OpenAI refs を `session/new` の前に Codex ACP 起動設定へ正規化します。`openai/gpt-5.4/high` などのスラッシュ形式は Codex ACP reasoning effort も設定します。
  省略された場合、`sessions_spawn({ runtime: "acp" })` は、設定されていれば既存の subagent モデルデフォルト（`agents.defaults.subagents.model` または `agents.list[].subagents.model`）を使用します。それ以外の場合は、ACP ハーネスに自身のデフォルトモデルを使用させます。
  他のハーネスは ACP `models` を公開し、`session/set_model` をサポートする必要があります。そうでない場合、OpenClaw/acpx はターゲットエージェントのデフォルトへ黙ってフォールバックするのではなく、明確に失敗します。
</ParamField>
<ParamField path="thinking" type="string">
  明示的な thinking/reasoning effort。Codex ACP では、`minimal` は低 effort にマップされ、`low`/`medium`/`high`/`xhigh` は直接マップされ、`off` は reasoning-effort 起動上書きを省略します。
  省略された場合、ACP spawn は、選択されたモデルに対して既存の subagent thinking デフォルトとモデルごとの `agents.defaults.models["provider/model"].params.thinking` を使用します。
</ParamField>

## Spawn の bind モードと thread モード

<Tabs>
  <Tab title="--bind here|off">
    | モード | 動作 |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 現在のアクティブな会話をその場でバインドします。アクティブな会話がない場合は失敗します。 |
    | `off`  | 現在の会話バインディングを作成しません。                          |

    注記:

    - `--bind here` は、「このチャネルまたはチャットを Codex バックにする」ための最も単純なオペレーターパスです。
    - `--bind here` は子スレッドを作成しません。
    - `--bind here` は、現在の会話バインディングサポートを公開するチャネルでのみ使用できます。
    - `--bind` と `--thread` は同じ `/acp spawn` 呼び出しで組み合わせることはできません。

  </Tab>
  <Tab title="--thread auto|here|off">
    | モード | 動作 |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | アクティブなスレッド内では、そのスレッドをバインドします。スレッド外では、サポートされている場合に子スレッドを作成/バインドします。 |
    | `here` | 現在のアクティブなスレッドを要求します。スレッド内でない場合は失敗します。                                                  |
    | `off`  | バインディングなし。セッションは未バインドで開始します。                                                                 |

    注記:

    - スレッドバインディングではない surface では、デフォルト動作は実質的に `off` です。
    - スレッドバインドされた spawn にはチャネルポリシーサポートが必要です:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - 子スレッドを作成せずに現在の会話へ固定したい場合は、`--bind here` を使用します。

  </Tab>
</Tabs>

## 配信モデル

ACP セッションは、対話型ワークスペースにも、親が所有するバックグラウンド作業にもなれます。配信パスはその形によって異なります。

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    対話型セッションは、可視チャット surface で会話を続けることを目的としています:

    - `/acp spawn ... --bind here` は、現在の会話を ACP セッションにバインドします。
    - `/acp spawn ... --thread ...` は、チャネルのスレッド/トピックを ACP セッションにバインドします。
    - 永続的に設定された `bindings[].type="acp"` は、一致する会話を同じ ACP セッションにルーティングします。

    バインドされた会話内のフォローアップメッセージは ACP セッションへ直接ルーティングされ、ACP の出力は同じチャネル/スレッド/トピックへ配信されます。

    OpenClaw がハーネスへ送信する内容:

    - 通常のバインド済みフォローアップは、プロンプトテキストとして送信されます。添付ファイルは、ハーネス/バックエンドがサポートする場合にのみ追加されます。
    - `/acp` 管理コマンドとローカル Gateway コマンドは、ACP dispatch の前にインターセプトされます。
    - ランタイム生成の完了イベントはターゲットごとに具現化されます。OpenClaw エージェントは OpenClaw の内部 runtime-context envelope を受け取ります。外部 ACP ハーネスは子の結果と指示を含むプレーンなプロンプトを受け取ります。生の `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` envelope は、外部ハーネスへ送信されたり、ACP ユーザートランスクリプトテキストとして永続化されたりしてはなりません。
    - ACP トランスクリプトエントリは、ユーザーに見えるトリガーテキストまたはプレーンな完了プロンプトを使用します。内部イベントメタデータは可能な限り OpenClaw 内で構造化されたまま保持され、ユーザー作成のチャット内容として扱われません。

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    別のエージェント実行によって spawn された一回限りの ACP セッションは、sub-agent と同様のバックグラウンド子です:

    - 親は `sessions_spawn({ runtime: "acp", mode: "run" })` で作業を依頼します。
    - 子は自身の ACP ハーネスセッション内で実行されます。
    - 子ターンはネイティブ sub-agent spawn と同じバックグラウンド lane で実行されるため、遅い ACP ハーネスが無関係なメインセッション作業をブロックすることはありません。
    - 完了は task-completion announce パス経由で報告されます。OpenClaw は内部完了メタデータを外部ハーネスへ送信する前にプレーンな ACP プロンプトへ変換するため、ハーネスは OpenClaw 専用のランタイムコンテキストマーカーを見ません。
    - ユーザー向けの返信が有用な場合、親は子の結果を通常の assistant voice で書き直します。

    このパスを、親と子の間のピアツーピアチャットとして扱わないでください。子にはすでに親へ戻る完了チャネルがあります。

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` は spawn 後に別のセッションをターゲットにできます。通常のピアセッションでは、OpenClaw はメッセージ注入後にエージェント間（A2A）フォローアップパスを使用します:

    - ターゲットセッションの返信を待ちます。
    - 必要に応じて、要求元とターゲットに制限された回数のフォローアップターンを交換させます。
    - ターゲットに announce メッセージを生成するよう依頼します。
    - その announce を可視チャネルまたはスレッドへ配信します。

    その A2A パスは、送信者が可視フォローアップを必要とするピア送信のフォールバックです。たとえば広い `tools.sessions.visibility` 設定の下で、無関係なセッションが ACP ターゲットを見てメッセージできる場合でも、有効なままです。

    OpenClaw は、リクエスト元が自身の親所有のワンショット ACP 子の
    親である場合にのみ、A2A フォローアップをスキップします。その場合、
    タスク完了の上で A2A を実行すると、親が子の結果で起動され、
    親の返信が子へ戻され、親/子のエコーループが発生する可能性があります。
    `sessions_send` の結果は、この所有子のケースで
    `delivery.status="skipped"` を報告します。これは、完了パスがすでに
    結果を担当しているためです。

  </Accordion>
  <Accordion title="既存セッションを再開する">
    新しく開始する代わりに、`resumeSessionId` を使って以前の ACP セッションを
    継続します。エージェントは `session/load` を通じて会話履歴を再生するため、
    以前の完全なコンテキストを引き継いで再開します。

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    一般的なユースケース:

    - ノート PC の Codex セッションをスマートフォンへ引き継ぐ - 中断したところから続けるようエージェントに指示します。
    - CLI で対話的に開始したコーディングセッションを、エージェント経由でヘッドレスに継続します。
    - gateway の再起動やアイドルタイムアウトで中断された作業を再開します。

    注意:

    - `resumeSessionId` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `streamTo` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `resumeSessionId` はホストローカルの ACP/ハーネス再開 ID であり、OpenClaw チャンネルセッションキーではありません。OpenClaw はディスパッチ前に ACP spawn ポリシーとターゲットエージェントポリシーを引き続き確認し、その upstream ID の読み込み認可は ACP バックエンドまたはハーネスが所有します。
    - `resumeSessionId` は upstream ACP の会話履歴を復元します。`thread` と `mode` は、作成している新しい OpenClaw セッションに通常どおり適用されるため、`mode: "session"` には引き続き `thread: true` が必要です。
    - ターゲットエージェントは `session/load` をサポートしている必要があります（Codex と Claude Code はサポートしています）。
    - セッション ID が見つからない場合、spawn は明確なエラーで失敗します。新しいセッションへのサイレントフォールバックはありません。

  </Accordion>
  <Accordion title="デプロイ後のスモークテスト">
    Gateway のデプロイ後は、単体テストを信頼するだけでなく、
    ライブのエンドツーエンドチェックを実行します。

    1. ターゲットホスト上のデプロイ済み Gateway バージョンとコミットを確認します。
    2. ライブエージェントへの一時 ACPX ブリッジセッションを開きます。
    3. そのエージェントに、`runtime: "acp"`、`agentId: "codex"`、`mode: "run"`、タスク `Reply with exactly LIVE-ACP-SPAWN-OK` で `sessions_spawn` を呼び出すよう依頼します。
    4. `accepted=yes`、実際の `childSessionKey`、バリデーターエラーがないことを確認します。
    5. 一時ブリッジセッションをクリーンアップします。

    ゲートは `mode: "run"` のままにし、`streamTo: "parent"` はスキップします。
    スレッドに紐づく `mode: "session"` とストリームリレーパスは、
    より高度な別個の統合パスです。

  </Accordion>
</AccordionGroup>

## サンドボックス互換性

ACP セッションは現在、OpenClaw サンドボックス内ではなく、ホストランタイム上で実行されます。

<Warning>
**セキュリティ境界:**

- 外部ハーネスは、自身の CLI 権限と選択された `cwd` に従って読み書きできます。
- OpenClaw のサンドボックスポリシーは、ACP ハーネス実行をラップしません。
- OpenClaw は引き続き、ACP 機能ゲート、許可済みエージェント、セッション所有権、チャンネルバインディング、Gateway 配信ポリシーを適用します。
- サンドボックスで強制される OpenClaw ネイティブ作業には `runtime: "subagent"` を使用します。

</Warning>

現在の制限:

- リクエスト元セッションがサンドボックス化されている場合、ACP spawn は `sessions_spawn({ runtime: "acp" })` と `/acp spawn` の両方でブロックされます。
- `runtime: "acp"` を指定した `sessions_spawn` は `sandbox: "require"` をサポートしません。

## セッションターゲット解決

ほとんどの `/acp` アクションは、任意のセッションターゲット（`session-key`、
`session-id`、または `session-label`）を受け付けます。

**解決順序:**

1. 明示的なターゲット引数（または `/acp steer` の `--session`）
   - key を試す
   - 次に UUID 形式のセッション ID
   - 次に label
2. 現在のスレッドバインディング（この会話/スレッドが ACP セッションにバインドされている場合）。
3. 現在のリクエスト元セッションへのフォールバック。

現在の会話バインディングとスレッドバインディングは、どちらも
ステップ 2 に参加します。

ターゲットが解決されない場合、OpenClaw は明確なエラー
（`Unable to resolve session target: ...`）を返します。

## ACP コントロール

| コマンド             | 動作                                                      | 例                                                            |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP セッションを作成します。任意で現在のバインドまたはスレッドバインドを指定できます。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ターゲットセッションの実行中ターンをキャンセルします。    | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 実行中セッションへ steer 指示を送信します。               | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | セッションを閉じ、スレッドターゲットのバインドを解除します。 | `/acp close`                                                  |
| `/acp status`        | バックエンド、モード、状態、ランタイムオプション、機能を表示します。 | `/acp status`                                                 |
| `/acp set-mode`      | ターゲットセッションのランタイムモードを設定します。      | `/acp set-mode plan`                                          |
| `/acp set`           | 汎用ランタイム設定オプションを書き込みます。              | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ランタイム作業ディレクトリの上書きを設定します。          | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 承認ポリシープロファイルを設定します。                    | `/acp permissions strict`                                     |
| `/acp timeout`       | ランタイムタイムアウト（秒）を設定します。                | `/acp timeout 120`                                            |
| `/acp model`         | ランタイムモデルの上書きを設定します。                    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | セッションランタイムオプションの上書きを削除します。      | `/acp reset-options`                                          |
| `/acp sessions`      | store から最近の ACP セッションを一覧表示します。         | `/acp sessions`                                               |
| `/acp doctor`        | バックエンドの健全性、機能、実行可能な修正を表示します。  | `/acp doctor`                                                 |
| `/acp install`       | 決定的なインストール手順と有効化手順を出力します。        | `/acp install`                                                |

ランタイムコントロール（`spawn`、`cancel`、`steer`、`close`、`status`、`set-mode`、
`set`、`cwd`、`permissions`、`timeout`、`model`、`reset-options`）には、
外部チャンネルでは所有者 ID が、内部 Gateway クライアントでは `operator.admin` が必要です。
認可された非所有者の送信者も、`sessions`、`doctor`、`install`、`help` は引き続き使用できます。

`/acp status` は、有効なランタイムオプションに加え、ランタイムレベルと
バックエンドレベルのセッション識別子を表示します。バックエンドに機能がない場合、
サポートされないコントロールのエラーは明確に表示されます。`/acp sessions` は、
現在バインドされているセッションまたはリクエスト元セッションの store を読み取ります。
ターゲットトークン（`session-key`、`session-id`、または `session-label`）は、
エージェントごとのカスタム `session.store` ルートを含む、
gateway セッションディスカバリーを通じて解決されます。

### ランタイムオプションのマッピング

`/acp` には便利なコマンドと汎用 setter があります。同等の操作:

| コマンド                     | マップ先                             | 注意                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | ランタイム設定キー `model`           | Codex ACP の場合、OpenClaw は `openai/<model>` をアダプターモデル ID に正規化し、`openai/gpt-5.4/high` のようなスラッシュ付き reasoning サフィックスを `reasoning_effort` にマップします。                  |
| `/acp set thinking <level>`  | 正準オプション `thinking`            | OpenClaw は、存在する場合はバックエンドが広告した同等項目を送信し、`thinking`、次に `effort`、`reasoning_effort`、または `thought_level` を優先します。Codex ACP の場合、アダプターが値を `reasoning_effort` にマップします。 |
| `/acp permissions <profile>` | 正準オプション `permissionProfile`   | OpenClaw は、存在する場合は `approval_policy`、`permission_profile`、`permissions`、または `permission_mode` など、バックエンドが広告した同等項目を送信します。                                         |
| `/acp timeout <seconds>`     | 正準オプション `timeoutSeconds`      | OpenClaw は、存在する場合は `timeout` または `timeout_seconds` など、バックエンドが広告した同等項目を送信します。                                                                                         |
| `/acp cwd <path>`            | ランタイム cwd 上書き                | 直接更新します。                                                                                                                                                                                           |
| `/acp set <key> <value>`     | 汎用                                 | `key=cwd` は cwd 上書きパスを使用します。                                                                                                                                                                  |
| `/acp reset-options`         | すべてのランタイム上書きをクリアします | -                                                                                                                                                                                                          |

## acpx ハーネス、Plugin セットアップ、権限

acpx ハーネス設定（Claude Code / Codex / Gemini CLI
エイリアス）、plugin-tools と OpenClaw-tools MCP ブリッジ、および ACP
権限モードについては、
[ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup) を参照してください。

## トラブルシューティング

| 症状                                                                        | 考えられる原因                                                                                                         | 修正                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | バックエンドPluginがない、無効化されている、または `plugins.allow` によってブロックされている。                        | バックエンドPluginをインストールして有効化し、その許可リストが設定されている場合は `plugins.allow` に `acpx` を含めてから、`/acp doctor` を実行する。                    |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP がグローバルに無効化されている。                                                                                  | `acp.enabled=true` を設定する。                                                                                                                                          |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 通常のスレッドメッセージからの自動ディスパッチが無効化されている。                                                    | 自動スレッドルーティングを再開するには `acp.dispatch.enabled=true` を設定する。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き動作する。                 |
| `ACP agent "<id>" is not allowed by policy`                                 | エージェントが許可リストに含まれていない。                                                                             | 許可された `agentId` を使用するか、`acp.allowedAgents` を更新する。                                                                                                      |
| `/acp doctor` reports backend not ready right after startup                 | バックエンドPluginがない、無効化されている、allow/deny ポリシーでブロックされている、または設定済みの実行ファイルが利用できない。 | バックエンドPluginをインストールまたは有効化し、`/acp doctor` を再実行する。正常でない状態が続く場合は、バックエンドのインストールまたはポリシーエラーを確認する。       |
| Harness command not found                                                   | アダプター CLI がインストールされていない、外部Pluginがない、または非 Codex アダプターの初回実行時 `npx` フェッチに失敗した。 | `/acp doctor` を実行し、Gateway ホストでアダプターをインストールまたは事前ウォームアップするか、acpx エージェントコマンドを明示的に設定する。                            |
| Model-not-found from the harness                                            | モデル ID は別のプロバイダー/ハーネスでは有効だが、この ACP ターゲットでは有効ではない。                              | そのハーネスに表示されるモデルを使用する、ハーネスでモデルを設定する、またはオーバーライドを省略する。                                                                  |
| Vendor auth error from the harness                                          | OpenClaw は正常だが、ターゲット CLI/プロバイダーにログインしていない。                                                 | Gateway ホスト環境でログインするか、必要なプロバイダーキーを指定する。                                                                                                  |
| `Unable to resolve session target: ...`                                     | キー/ID/ラベルトークンが不正。                                                                                        | `/acp sessions` を実行し、正確なキー/ラベルをコピーして再試行する。                                                                                                      |
| `--bind here requires running /acp spawn inside an active ... conversation` | アクティブでバインド可能な会話なしで `--bind here` が使用された。                                                     | ターゲットのチャット/チャンネルへ移動して再試行するか、非バインドの spawn を使用する。                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | アダプターに現在の会話の ACP バインド機能がない。                                                                     | サポートされている場合は `/acp spawn ... --thread ...` を使用する、トップレベルの `bindings[]` を設定する、またはサポート対象チャンネルへ移動する。                      |
| `--thread here requires running /acp spawn inside an active ... thread`     | スレッドコンテキスト外で `--thread here` が使用された。                                                               | ターゲットスレッドへ移動するか、`--thread auto`/`off` を使用する。                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 別のユーザーがアクティブなバインドターゲットを所有している。                                                          | 所有者として再バインドするか、別の会話またはスレッドを使用する。                                                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | アダプターにスレッドバインド機能がない。                                                                               | `--thread off` を使用するか、サポート対象のアダプター/チャンネルへ移動する。                                                                                            |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP ランタイムはホスト側にあり、要求元セッションがサンドボックス化されている。                                        | サンドボックス化されたセッションからは `runtime="subagent"` を使用するか、サンドボックス化されていないセッションから ACP spawn を実行する。                              |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP ランタイムに対して `sandbox="require"` が要求された。                                                             | 必須のサンドボックス化には `runtime="subagent"` を使用するか、サンドボックス化されていないセッションから `sandbox="inherit"` で ACP を使用する。                         |
| `Cannot apply --model ... did not advertise model support`                  | ターゲットハーネスが汎用 ACP モデル切り替えを公開していない。                                                         | ACP `models`/`session/set_model` を advertise するハーネスを使用する、Codex ACP モデル参照を使用する、または独自の起動フラグがある場合はハーネス内でモデルを直接設定する。 |
| Missing ACP metadata for bound session                                      | 古い、または削除された ACP セッションメタデータ。                                                                      | `/acp spawn` で再作成してから、スレッドを再バインド/フォーカスする。                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` が非対話 ACP セッションで書き込み/実行をブロックしている。                                           | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定し、gateway を再起動する。[権限設定](/ja-JP/tools/acp-agents-setup#permission-configuration)を参照。        |
| ACP session fails early with little output                                  | 権限プロンプトが `permissionMode`/`nonInteractivePermissions` によってブロックされている。                            | gateway ログで `AcpRuntimeError` を確認する。完全な権限には `permissionMode=approve-all` を設定し、優雅な縮退には `nonInteractivePermissions=deny` を設定する。           |
| ACP session stalls indefinitely after completing work                       | ハーネスプロセスは終了したが、ACP セッションが完了を報告しなかった。                                                  | OpenClaw を更新する。現在の acpx クリーンアップは、終了時と Gateway 起動時に、OpenClaw が所有する古いラッパーおよびアダプタープロセスを刈り取る。                       |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 内部イベントエンベロープが ACP 境界を越えて漏れた。                                                                  | OpenClaw を更新し、完了フローを再実行する。外部ハーネスはプレーンな完了プロンプトのみを受け取るべきである。                                                            |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` は
ACP/acpx ではなく、ネイティブ Codex フックリレーに属する。バインドされた Codex チャットでは、
`/new` または `/reset` で新しいセッションを開始する。一度動作した後、次のネイティブツール呼び出しで
再発する場合は、`/new` を繰り返すのではなく、Codex app-server または OpenClaw Gateway を再起動する。
[Codex ハーネスのトラブルシューティング](/ja-JP/plugins/codex-harness#troubleshooting)を参照。
</Note>

## 関連

- [ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup)
- [エージェント送信](/ja-JP/tools/agent-send)
- [CLI バックエンド](/ja-JP/gateway/cli-backends)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（ブリッジモード）](/ja-JP/cli/acp)
- [サブエージェント](/ja-JP/tools/subagents)
