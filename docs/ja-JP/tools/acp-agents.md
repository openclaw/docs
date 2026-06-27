---
read_when:
    - ACP 経由でコーディングハーネスを実行する
    - メッセージングチャンネルで会話に紐づく ACP セッションを設定する
    - メッセージチャネルの会話を永続的な ACP セッションにバインドする
    - ACP バックエンド、Plugin の接続設定、または補完配信のトラブルシューティング
    - チャットから /acp コマンドを操作する
sidebarTitle: ACP agents
summary: 外部コーディングハーネス（Claude Code、Cursor、Gemini CLI、明示的な Codex ACP、OpenClaw ACP、OpenCode）を ACP バックエンド経由で実行する
title: ACP エージェント
x-i18n:
    generated_at: "2026-06-27T13:07:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9ad2fd3dec35062209b5e66a3ec301e8fa247d10a48787e54b938b10b314aee
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) セッションは、
ACP バックエンド Plugin を通じて、OpenClaw が外部コーディングハーネス（たとえば Claude Code、
Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI、その他の
対応 ACPX ハーネス）を実行できるようにします。

各 ACP セッションの spawn は [バックグラウンドタスク](/ja-JP/automation/tasks) として追跡されます。

<Note>
**ACP は外部ハーネス用の経路であり、デフォルトの Codex 経路ではありません。** ネイティブの Codex app-server Plugin は、エージェントターン向けの `/codex ...` コントロールとデフォルトの
`openai/gpt-*` 組み込みランタイムを所有します。ACP は
`/acp ...` コントロールと `sessions_spawn({ runtime: "acp" })` セッションを所有します。

Codex または Claude Code を外部 MCP クライアントとして、既存の OpenClaw チャネル会話へ直接接続したい場合は、ACP ではなく
[`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。
</Note>

## どのページを見ればよいですか？

| やりたいこと                                                                                    | 使用するもの                              | 注記                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 現在の会話で Codex をバインドまたは制御する                                               | `/codex bind`, `/codex threads`       | `codex` Plugin が有効な場合のネイティブ Codex app-server 経路です。バインド済みチャット返信、画像転送、モデル/高速/権限、停止、誘導コントロールを含みます。ACP は明示的なフォールバックです |
| OpenClaw _経由で_ Claude Code、Gemini CLI、明示的な Codex ACP、または別の外部ハーネスを実行する | このページ                             | チャットにバインドされたセッション、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、バックグラウンドタスク、ランタイムコントロール                                                                                   |
| エディタまたはクライアント向けに OpenClaw Gateway セッションを ACP サーバー _として_ 公開する                   | [`openclaw acp`](/ja-JP/cli/acp)            | ブリッジモード。IDE/クライアントは stdio/WebSocket 経由で OpenClaw と ACP で通信します                                                                                                                            |
| ローカルの AI CLI をテキスト専用のフォールバックモデルとして再利用する                                              | [CLI バックエンド](/ja-JP/gateway/cli-backends) | ACP ではありません。OpenClaw ツール、ACP コントロール、ハーネスランタイムはありません                                                                                                                               |

## これはすぐに使えますか？

はい。公式 ACP ランタイム Plugin をインストールした後に使えます。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

ソースチェックアウトでは、`pnpm install` 後にローカルの `extensions/acpx` ワークスペース Plugin を使用できます。準備状況の確認には `/acp doctor` を実行してください。

OpenClaw は、ACP が**本当に使用可能**な場合にのみ、エージェントへ ACP spawn について教えます。ACP が有効であること、dispatch が無効化されていないこと、現在のセッションがサンドボックスでブロックされていないこと、ランタイムバックエンドがロードされていることが必要です。これらの条件を満たさない場合、ACP Plugin Skills と
`sessions_spawn` の ACP ガイダンスは非表示のままになり、エージェントが利用できないバックエンドを提案しないようにします。

<AccordionGroup>
  <Accordion title="初回実行時の注意点">
    - `plugins.allow` が設定されている場合、それは制限的な Plugin インベントリであり、**必ず** `acpx` を含める必要があります。含まれていない場合、インストール済みの ACP バックエンドは意図的にブロックされ、`/acp doctor` は allowlist エントリがないことを報告します。
    - Codex ACP アダプタは `acpx` Plugin とともにステージングされ、可能な場合はローカルで起動されます。
    - Codex ACP は分離された `CODEX_HOME` で実行されます。OpenClaw はホストの Codex 設定から、信頼済みプロジェクトエントリと安全なモデル/プロバイダールーティング設定をコピーしますが、認証、通知、フックはホスト設定に残ります。
    - 他の対象ハーネスアダプタは、初回使用時に `npx` でオンデマンド取得される場合があります。
    - ベンダー認証は、そのハーネス用にホスト上に存在している必要があります。
    - ホストに npm またはネットワークアクセスがない場合、キャッシュを事前に準備するか、別の方法でアダプタをインストールするまで、初回実行時のアダプタ取得は失敗します。

  </Accordion>
  <Accordion title="ランタイム前提条件">
    ACP は実際の外部ハーネスプロセスを起動します。OpenClaw はルーティング、
    バックグラウンドタスク状態、配信、バインディング、ポリシーを所有します。ハーネスは
    自身のプロバイダーログイン、モデルカタログ、ファイルシステム動作、
    ネイティブツールを所有します。

    OpenClaw のせいにする前に、次を確認してください。

    - `/acp doctor` が、有効で正常なバックエンドを報告している。
    - 対象 id が、allowlist が設定されている場合は `acp.allowedAgents` で許可されている。
    - ハーネスコマンドを Gateway ホスト上で開始できる。
    - そのハーネスのプロバイダー認証（`claude`、`codex`、`gemini`、`opencode`、`droid` など）が存在する。
    - 選択したモデルがそのハーネスに存在する - モデル id はハーネス間で移植できません。
    - 要求された `cwd` が存在しアクセス可能である。または `cwd` を省略し、バックエンドにデフォルトを使用させる。
    - 権限モードが作業に合っている。非対話型セッションはネイティブ権限プロンプトをクリックできないため、書き込み/実行が多いコーディング実行では通常、ヘッドレスで進行できる ACPX 権限プロファイルが必要です。

  </Accordion>
</AccordionGroup>

OpenClaw Plugin ツールと組み込みの OpenClaw ツールは、デフォルトでは ACP ハーネスに公開されません。ハーネスからそれらのツールを直接呼び出す必要がある場合にのみ、
[ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup) の明示的な MCP ブリッジを有効にしてください。

## 対応ハーネス対象

`acpx` バックエンドでは、これらのハーネス id を `/acp spawn <id>` または
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` の対象として使用します。

| ハーネス id | 一般的なバックエンド                                | 注記                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP アダプタ                        | ホスト上の Claude Code 認証が必要です。                                              |
| `codex`    | Codex ACP アダプタ                              | ネイティブ `/codex` が利用できない場合、または ACP が要求された場合のみの明示的な ACP フォールバックです。 |
| `copilot`  | GitHub Copilot ACP アダプタ                     | Copilot CLI/ランタイム認証が必要です。                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | ローカルインストールが別の ACP エントリポイントを公開している場合は、acpx コマンドを上書きします。    |
| `droid`    | Factory Droid CLI                              | ハーネス環境に Factory/Droid 認証または `FACTORY_API_KEY` が必要です。        |
| `gemini`   | Gemini CLI ACP アダプタ                         | Gemini CLI 認証または API キー設定が必要です。                                          |
| `iflow`    | iFlow CLI                                      | アダプタの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `kilocode` | Kilo Code CLI                                  | アダプタの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `kimi`     | Kimi/Moonshot CLI                              | ホスト上の Kimi/Moonshot 認証が必要です。                                            |
| `kiro`     | Kiro CLI                                       | アダプタの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `opencode` | OpenCode ACP アダプタ                           | OpenCode CLI/プロバイダー認証が必要です。                                                |
| `openclaw` | `openclaw acp` 経由の OpenClaw Gateway ブリッジ | ACP 対応ハーネスが OpenClaw Gateway セッションへ応答できるようにします。                 |
| `qwen`     | Qwen Code / Qwen CLI                           | ホスト上の Qwen 互換認証が必要です。                                          |

カスタム acpx エージェントエイリアスは acpx 自体で設定できますが、OpenClaw ポリシーは dispatch の前に `acp.allowedAgents` と
`agents.list[].runtime.acp.agent` マッピングを引き続きチェックします。

## オペレーター実行手順

チャットからの簡単な `/acp` フロー:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`、または明示的な
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="作業">
    バインドされた会話またはスレッドで続行します（またはセッションキーを明示的に対象にします）。
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
    - Spawn は ACP ランタイムセッションを作成または再開し、OpenClaw セッションストアに ACP メタデータを記録し、実行が親所有の場合はバックグラウンドタスクを作成する場合があります。
    - 親所有の ACP セッションは、ランタイムセッションが永続的な場合でもバックグラウンド作業として扱われます。完了とサーフェス横断の配信は、通常のユーザー向けチャットセッションのように動作するのではなく、親タスク通知機構を経由します。
    - タスク保守は、終端状態または孤立した親所有の単発 ACP セッションを閉じます。永続的な ACP セッションは、アクティブな会話バインディングが残っている間は保持されます。アクティブなバインディングのない古い永続セッションは、所有タスクが完了した後、またはそのタスク記録が消えた後に暗黙に再開されないように閉じられます。
    - バインドされたフォローアップメッセージは、バインディングが閉じられる、フォーカス解除される、リセットされる、または期限切れになるまで、ACP セッションへ直接送られます。
    - Gateway コマンドはローカルに留まります。`/acp ...`、`/status`、`/unfocus` は、バインドされた ACP ハーネスへ通常のプロンプトテキストとして送信されることはありません。
    - `cancel` は、バックエンドがキャンセルをサポートしている場合にアクティブなターンを中止します。バインディングやセッションメタデータは削除しません。
    - `close` は OpenClaw の観点から ACP セッションを終了し、バインディングを削除します。ハーネスが再開をサポートしている場合、自身の上流履歴を保持することがあります。
    - acpx Plugin は `close` 後に OpenClaw 所有のラッパーとアダプタのプロセスツリーをクリーンアップし、Gateway 起動時に古い OpenClaw 所有の ACPX 孤立プロセスを回収します。
    - アイドル状態のランタイムワーカーは `acp.runtime.ttlMinutes` 後にクリーンアップ対象になります。保存されたセッションメタデータは `/acp sessions` で引き続き利用できます。

  </Accordion>
  <Accordion title="ネイティブ Codex ルーティングルール">
    有効な場合に**ネイティブ Codex Plugin** へルーティングされるべき自然言語トリガー:

    - 「この Discord チャネルを Codex にバインドして。」
    - 「このチャットを Codex スレッド `<id>` にアタッチして。」
    - 「Codex スレッドを表示してから、これをバインドして。」

    ネイティブ Codex 会話バインディングがデフォルトのチャット制御パスです。
    OpenClaw 動的ツールは引き続き OpenClaw 経由で実行されますが、
    shell/apply-patch などの Codex ネイティブツールは Codex 内で実行されます。
    Codex ネイティブツールイベントについて、OpenClaw はターンごとのネイティブ
    フックリレーを挿入し、Plugin フックが `before_tool_call` をブロックし、
    `after_tool_call` を監視し、Codex `PermissionRequest` イベントを
    OpenClaw 承認経由でルーティングできるようにします。Codex `Stop` フックは
    OpenClaw `before_agent_finalize` にリレーされ、そこで Plugin は
    Codex が回答を確定する前に、もう 1 回のモデルパスを要求できます。リレーは
    意図的に保守的なままです。Codex ネイティブツール引数を変更したり、
    Codex スレッドレコードを書き換えたりしません。ACP ランタイム/セッションモデルを
    使用したい場合のみ、明示的な ACP を使用してください。埋め込み Codex
    サポート境界は
    [Codex ハーネス v1 サポート契約](/ja-JP/plugins/codex-harness-runtime#v1-support-contract)に記載されています。

  </Accordion>
  <Accordion title="モデル / プロバイダー / ランタイム選択チートシート">
    - レガシー Codex モデル参照 - レガシー Codex OAuth/サブスクリプションモデルルートは doctor によって修復されます。
    - `openai/*` - OpenAI エージェントターン向けのネイティブ Codex app-server 埋め込みランタイム。
    - `/codex ...` - ネイティブ Codex 会話制御。
    - `/acp ...` または `runtime: "acp"` - 明示的な ACP/acpx 制御。

  </Accordion>
  <Accordion title="ACP ルーティングの自然言語トリガー">
    ACP ランタイムにルーティングすべきトリガー:

    - 「これをワンショット Claude Code ACP セッションとして実行し、結果を要約してください。」
    - 「このタスクには Gemini CLI をスレッドで使用し、その後のフォローアップは同じスレッドに保持してください。」
    - 「バックグラウンドスレッドで Codex を ACP 経由で実行してください。」

    OpenClaw は `runtime: "acp"` を選択し、ハーネス `agentId` を解決し、
    サポートされている場合は現在の会話またはスレッドにバインドし、
    close/expiry までフォローアップをそのセッションにルーティングします。Codex は、
    ACP/acpx が明示されている場合、または要求された操作でネイティブ Codex
    Plugin が利用できない場合のみ、このパスに従います。

    `sessions_spawn` では、ACP が有効で、リクエスターがサンドボックス化されておらず、
    ACP ランタイムバックエンドが読み込まれている場合にのみ、`runtime: "acp"` が
    告知されます。`acp.dispatch.enabled=false` は自動
    ACP スレッドディスパッチを一時停止しますが、明示的な
    `sessions_spawn({ runtime: "acp" })` 呼び出しを非表示にしたりブロックしたりはしません。対象は `codex`、
    `claude`、`droid`、`gemini`、`opencode` などの ACP ハーネス ID です。
    そのエントリが `agents.list[].runtime.type="acp"` で
    明示的に構成されていない限り、`agents_list` から通常の
    OpenClaw 構成エージェント ID を渡さないでください。
    それ以外の場合は、デフォルトのサブエージェントランタイムを使用してください。OpenClaw エージェントが
    `runtime.type="acp"` で構成されている場合、OpenClaw は
    `runtime.acp.agent` を基盤となるハーネス ID として使用します。

  </Accordion>
</AccordionGroup>

## ACP とサブエージェントの比較

外部ハーネスランタイムが必要な場合は ACP を使用します。`codex`
Plugin が有効な場合に Codex 会話バインディング/制御を行うには、**ネイティブ Codex
app-server** を使用します。OpenClaw ネイティブの委任実行が必要な場合は、
**サブエージェント**を使用します。

| 領域          | ACP セッション                           | サブエージェント実行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| ランタイム       | ACP バックエンド Plugin (例: acpx) | OpenClaw ネイティブサブエージェントランタイム  |
| セッションキー   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| メインコマンド | `/acp ...`                            | `/subagents ...`                   |
| 起動ツール    | `runtime:"acp"` を指定した `sessions_spawn` | `sessions_spawn` (デフォルトランタイム) |

[サブエージェント](/ja-JP/tools/subagents)も参照してください。

## ACP が Claude Code を実行する仕組み

ACP 経由の Claude Code では、スタックは次のとおりです。

1. OpenClaw ACP セッション制御プレーン。
2. 公式 `@openclaw/acpx` ランタイム Plugin。
3. Claude ACP アダプター。
4. Claude 側ランタイム/セッション機構。

ACP Claude は、ACP 制御、セッション再開、
バックグラウンドタスク追跡、任意の会話/スレッドバインディングを備えた
**ハーネスセッション**です。

CLI バックエンドは別個のテキスト専用ローカルフォールバックランタイムです -
[CLI バックエンド](/ja-JP/gateway/cli-backends)を参照してください。

運用者向けの実用的なルールは次のとおりです。

- **`/acp spawn`、バインド可能なセッション、ランタイム制御、または永続的なハーネス作業が必要ですか?** ACP を使用します。
- **生の CLI 経由の単純なローカルテキストフォールバックが必要ですか?** CLI バックエンドを使用します。

## バインドされたセッション

### メンタルモデル

- **チャットサーフェス** - 人々が会話を続ける場所 (Discord チャンネル、Telegram トピック、iMessage チャット)。
- **ACP セッション** - OpenClaw がルーティングする永続的な Codex/Claude/Gemini ランタイム状態。
- **子スレッド/トピック** - `--thread ...` によってのみ作成される任意の追加メッセージングサーフェス。
- **ランタイムワークスペース** - ハーネスが実行されるファイルシステム上の場所 (`cwd`、リポジトリチェックアウト、バックエンドワークスペース)。チャットサーフェスとは独立しています。

### 現在の会話へのバインド

`/acp spawn <harness> --bind here` は現在の会話を
起動された ACP セッションにピン留めします - 子スレッドはなく、同じチャットサーフェスです。OpenClaw は
トランスポート、認証、安全性、配信の所有を維持します。その
会話内のフォローアップメッセージは同じセッションにルーティングされます。`/new` と `/reset` は
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
    - `--bind here` と `--thread ...` は同時に指定できません。
    - `--bind here` は、現在の会話バインディングを告知するチャンネルでのみ機能します。それ以外の場合、OpenClaw は明確な非対応メッセージを返します。バインディングは Gateway 再起動後も保持されます。
    - Discord では、`spawnSessions` は `--thread auto|here` の子スレッド作成を制御します - `--bind here` ではありません。
    - `--cwd` なしで別の ACP エージェントに起動する場合、OpenClaw はデフォルトで**ターゲットエージェントの**ワークスペースを継承します。継承されたパスが存在しない場合 (`ENOENT`/`ENOTDIR`) はバックエンドのデフォルトにフォールバックします。その他のアクセスエラー (例: `EACCES`) は起動エラーとして表示されます。
    - Gateway 管理コマンドはバインドされた会話内ではローカルのままです - 通常のフォローアップテキストがバインドされた ACP セッションにルーティングされる場合でも、`/acp ...` コマンドは OpenClaw によって処理されます。`/status` と `/unfocus` も、そのサーフェスでコマンド処理が有効な場合は常にローカルのままです。

  </Accordion>
  <Accordion title="スレッドバインドセッション">
    チャンネルアダプターでスレッドバインディングが有効な場合:

    - OpenClaw はスレッドをターゲット ACP セッションにバインドします。
    - そのスレッド内のフォローアップメッセージはバインドされた ACP セッションにルーティングされます。
    - ACP 出力は同じスレッドに配信されます。
    - unfocus/close/archive/idle-timeout または max-age expiry により、バインディングが削除されます。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status`、`/unfocus` は Gateway コマンドであり、ACP ハーネスへのプロンプトではありません。

    スレッドバインド ACP に必要な機能フラグ:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` はデフォルトでオンです (自動 ACP スレッドディスパッチを一時停止するには `false` を設定します。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き機能します)。
    - チャンネルアダプターのスレッドセッション起動が有効 (デフォルト: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    スレッドバインディングのサポートはアダプター固有です。アクティブなチャンネル
    アダプターがスレッドバインディングをサポートしていない場合、OpenClaw は明確な
    非対応/利用不可メッセージを返します。

  </Accordion>
  <Accordion title="スレッドをサポートするチャンネル">
    - セッション/スレッドバインディング機能を公開する任意のチャンネルアダプター。
    - 現在の組み込みサポート: **Discord** スレッド/チャンネル、**Telegram** トピック (グループ/スーパーグループ内のフォーラムトピックおよび DM トピック)。
    - Plugin チャンネルは同じバインディングインターフェイスを通じてサポートを追加できます。

  </Accordion>
</AccordionGroup>

## 永続的なチャンネルバインディング

一時的ではないワークフローでは、トップレベルの
`bindings[]` エントリで永続 ACP バインディングを構成します。

### バインディングモデル

<ParamField path="bindings[].type" type='"acp"'>
  永続 ACP 会話バインディングを示します。
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
  所有元の OpenClaw エージェント ID。
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

エージェントごとに ACP デフォルトを一度だけ定義するには `agents.list[].runtime` を使用します。

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

- OpenClaw は、チャネル固有の受付後、使用前に、設定された ACP セッションが存在することを保証します。
- そのチャネル、トピック、またはチャット内のメッセージは、設定された ACP セッションへルーティングされます。
- 設定された ACP バインディングは自身のセッションルートを所有します。チャネルブロードキャストのファンアウトは、一致したバインディングに設定された ACP セッションを置き換えません。
- バインドされた会話では、`/new` と `/reset` は同じ ACP セッションキーをその場でリセットします。
- 一時的なランタイムバインディング（たとえばスレッドフォーカスフローで作成されたもの）は、存在する場合は引き続き適用されます。
- 明示的な `cwd` がないクロスエージェント ACP spawn では、OpenClaw はエージェント設定から対象エージェントのワークスペースを継承します。
- 継承されたワークスペースパスがない場合はバックエンドのデフォルト cwd にフォールバックします。存在するパスへのアクセス失敗は spawn エラーとして表面化します。

## ACP セッションを開始する

ACP セッションを開始する方法は 2 つあります。

<Tabs>
  <Tab title="From sessions_spawn">
    エージェントターンまたはツール呼び出しから ACP セッションを開始するには
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
    `runtime` のデフォルトは `subagent` のため、ACP セッションでは
    `runtime: "acp"` を明示的に設定します。`agentId` が省略された場合、
    OpenClaw は設定されていれば `acp.defaultAgent` を使用します。
    `mode: "session"` では、永続的にバインドされた会話を維持するために
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

    主要フラグ:

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
  ACP セッションでは必ず `"acp"` にします。
</ParamField>
<ParamField path="agentId" type="string">
  ACP の対象ハーネス ID。設定されている場合は `acp.defaultAgent` にフォールバックします。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  サポートされている場合にスレッドバインディングフローを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` はワンショット、`"session"` は永続です。`thread: true` で
  `mode` が省略された場合、OpenClaw はランタイムパスごとに永続動作を
  デフォルトにすることがあります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cwd" type="string">
  要求されたランタイム作業ディレクトリ（バックエンド/ランタイムポリシーで検証）。
  省略された場合、ACP spawn は設定されていれば対象エージェントのワークスペースを
  継承します。継承されたパスがない場合はバックエンドのデフォルトにフォールバックし、
  実際のアクセスエラーは返されます。
</ParamField>
<ParamField path="label" type="string">
  セッション/バナーテキストで使用されるオペレーター向けラベル。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  新規作成する代わりに既存の ACP セッションを再開します。エージェントは
  `session/load` によって会話履歴を再生します。`runtime: "acp"` が必要です。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` は、初期 ACP 実行の進行状況サマリーをシステムイベントとして
  リクエスターセッションへストリームします。受け付けられるレスポンスには、
  完全なリレー履歴を tail できるセッションスコープの JSONL ログ
  （`<sessionId>.acp-stream.jsonl`）を指す `streamLogPath` が含まれます。
  親の進行状況ストリームは、`streaming.progress.commentary=false` でない限り、
  デフォルトでアシスタントのコメントと ACP ステータス進行状況を表示します。
  Discord も、ストリームモードが設定されていない場合、親プレビューをデフォルトで
  進行状況モードにします。ステータス進行状況は引き続き `acp.stream.tagVisibility`
  に従うため、`plan` などのタグは明示的に有効化されない限り非表示のままです。
</ParamField>

ACP `sessions_spawn` の実行は、デフォルトの子ターン制限として
`agents.defaults.subagents.runTimeoutSeconds` を使用します。このツールは呼び出しごとの
タイムアウト上書きを受け付けません。

<ParamField path="model" type="string">
  ACP 子セッションの明示的なモデル上書き。Codex ACP spawn は、
  `openai/gpt-5.4` などの OpenAI 参照を、`session/new` の前に
  Codex ACP 起動設定へ正規化します。`openai/gpt-5.4/high` のようなスラッシュ形式では、
  Codex ACP の推論エフォートも設定されます。
  省略された場合、`sessions_spawn({ runtime: "acp" })` は、設定されていれば既存の
  サブエージェントモデルデフォルト（`agents.defaults.subagents.model` または
  `agents.list[].subagents.model`）を使用します。設定されていなければ、ACP ハーネスが
  自身のデフォルトモデルを使用します。
  その他のハーネスは ACP `models` を広告し、`session/set_model` をサポートする必要があります。
  そうでない場合、OpenClaw/acpx は対象エージェントのデフォルトに黙ってフォールバックせず、
  明確に失敗します。
</ParamField>
<ParamField path="thinking" type="string">
  明示的な thinking/推論エフォート。Codex ACP では、`minimal` は低エフォートに対応し、
  `low`/`medium`/`high`/`xhigh` は直接対応し、`off` は reasoning-effort の起動上書きを省略します。
  省略された場合、ACP spawn は既存のサブエージェント thinking デフォルトと、
  選択されたモデルに対するモデル別の
  `agents.defaults.models["provider/model"].params.thinking` を使用します。
</ParamField>

## spawn の bind モードと thread モード

<Tabs>
  <Tab title="--bind here|off">
    | モード | 動作 |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 現在のアクティブな会話をその場でバインドします。アクティブな会話がない場合は失敗します。 |
    | `off`  | 現在の会話バインディングを作成しません。 |

    注:

    - `--bind here` は、「このチャネルまたはチャットを Codex バックエンドにする」ための最も簡単なオペレーターパスです。
    - `--bind here` は子スレッドを作成しません。
    - `--bind here` は、現在の会話バインディングサポートを公開するチャネルでのみ利用できます。
    - `--bind` と `--thread` は同じ `/acp spawn` 呼び出しで組み合わせることはできません。

  </Tab>
  <Tab title="--thread auto|here|off">
    | モード | 動作 |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | アクティブなスレッド内では、そのスレッドをバインドします。スレッド外では、サポートされている場合に子スレッドを作成/バインドします。 |
    | `here` | 現在のアクティブなスレッドを要求します。スレッド内でない場合は失敗します。 |
    | `off`  | バインディングなし。セッションは未バインドで開始します。 |

    注:

    - 非スレッドバインディングサーフェスでは、デフォルト動作は実質的に `off` です。
    - スレッドにバインドされた spawn にはチャネルポリシーのサポートが必要です:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - 子スレッドを作成せずに現在の会話へ固定したい場合は、`--bind here` を使用します。

  </Tab>
</Tabs>

## 配信モデル

ACP セッションは、対話型ワークスペースにも親が所有するバックグラウンド作業にもできます。
配信パスはその形態によって異なります。

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    対話型セッションは、表示されているチャットサーフェスで会話を続けることを意図しています:

    - `/acp spawn ... --bind here` は現在の会話を ACP セッションにバインドします。
    - `/acp spawn ... --thread ...` はチャネルのスレッド/トピックを ACP セッションにバインドします。
    - 永続的に設定された `bindings[].type="acp"` は、一致する会話を同じ ACP セッションへルーティングします。

    バインドされた会話内の後続メッセージは ACP セッションへ直接ルーティングされ、
    ACP 出力は同じチャネル/スレッド/トピックへ返されます。

    OpenClaw がハーネスへ送信する内容:

    - 通常のバインド済みフォローアップは、プロンプトテキストとして送信され、ハーネス/バックエンドがサポートする場合のみ添付ファイルも送信されます。
    - `/acp` 管理コマンドとローカル Gateway コマンドは、ACP ディスパッチ前にインターセプトされます。
    - ランタイム生成の完了イベントは対象ごとに具体化されます。OpenClaw エージェントは OpenClaw の内部 runtime-context エンベロープを受け取り、外部 ACP ハーネスは子の結果と指示を含むプレーンなプロンプトを受け取ります。生の `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` エンベロープを外部ハーネスへ送信したり、ACP ユーザートランスクリプトテキストとして永続化したりしてはいけません。
    - ACP トランスクリプトエントリは、ユーザーに表示されるトリガーテキストまたはプレーンな完了プロンプトを使用します。内部イベントメタデータは可能な限り OpenClaw 内で構造化されたまま保持され、ユーザー作成のチャットコンテンツとして扱われません。

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    別のエージェント実行によって spawn されたワンショット ACP セッションは、
    サブエージェントと同様のバックグラウンド子です:

    - 親は `sessions_spawn({ runtime: "acp", mode: "run" })` で作業を依頼します。
    - 子は自身の ACP ハーネスセッション内で実行されます。
    - 子ターンはネイティブサブエージェント spawn と同じバックグラウンドレーンで実行されるため、低速な ACP ハーネスが無関係なメインセッション作業をブロックしません。
    - 完了はタスク完了アナウンスパスを通じて返されます。OpenClaw は内部完了メタデータをプレーンな ACP プロンプトへ変換してから外部ハーネスへ送信するため、ハーネスは OpenClaw 専用のランタイムコンテキストマーカーを見ません。
    - ユーザー向けの返信が有用な場合、親は子の結果を通常のアシスタントの声に書き換えます。

    このパスを、親と子の間のピアツーピアチャットとして扱わないでください。
    子にはすでに親へ戻る完了チャネルがあります。

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` は spawn 後に別のセッションを対象にできます。通常のピアセッションでは、
    OpenClaw はメッセージ注入後に agent-to-agent（A2A）フォローアップパスを使用します:

    - 対象セッションの返信を待ちます。
    - 必要に応じて、リクエスターと対象に制限された回数のフォローアップターンを交換させます。
    - 対象にアナウンスメッセージを生成するよう依頼します。
    - そのアナウンスを表示されているチャネルまたはスレッドへ配信します。

    この A2A パスは、送信者が表示されるフォローアップを必要とするピア送信のフォールバックです。
    たとえば広範な `tools.sessions.visibility` 設定の下で、無関係なセッションが ACP 対象を
    見てメッセージできる場合も、有効なままです。

    OpenClaw が A2A フォローアップをスキップするのは、リクエスト元が
    自身の親所有の 1 回限りの ACP 子の親である場合のみです。この場合、
    タスク完了の上で A2A を実行すると、子の結果で親を起こし、
    親の返信を子に転送し、親/子のエコーループを
    作成する可能性があります。`sessions_send` の結果は、その所有子ケースで
    `delivery.status="skipped"` を報告します。これは、完了パスがすでに
    結果を担当しているためです。

  </Accordion>
  <Accordion title="既存のセッションを再開する">
    新しく開始する代わりに、`resumeSessionId` を使用して以前の ACP セッションを
    続行します。エージェントは `session/load` を介して会話履歴を再生するため、
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

    - Codex セッションをノート PC からスマートフォンへ引き継ぐ - エージェントに中断したところから再開するよう指示します。
    - CLI で対話的に開始したコーディングセッションを、今度はエージェント経由でヘッドレスに続行します。
    - Gateway の再起動やアイドルタイムアウトで中断された作業を再開します。

    注記:

    - `resumeSessionId` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `streamTo` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `resumeSessionId` は、OpenClaw チャンネルセッションキーではなく、ホストローカルの ACP/ハーネス再開 ID です。OpenClaw はディスパッチ前に ACP spawn ポリシーとターゲットエージェントポリシーを引き続きチェックし、そのアップストリーム ID を読み込むための認可は ACP バックエンドまたはハーネスが所有します。
    - `resumeSessionId` はアップストリーム ACP 会話履歴を復元します。`thread` と `mode` は作成中の新しい OpenClaw セッションに通常どおり適用されるため、`mode: "session"` には引き続き `thread: true` が必要です。
    - ターゲットエージェントは `session/load` をサポートしている必要があります（Codex と Claude Code は対応しています）。
    - セッション ID が見つからない場合、spawn は明確なエラーで失敗します - 新しいセッションへのサイレントフォールバックはありません。

  </Accordion>
  <Accordion title="デプロイ後のスモークテスト">
    Gateway のデプロイ後は、ユニットテストを信頼するだけでなく、
    ライブのエンドツーエンドチェックを実行します。

    1. ターゲットホスト上のデプロイ済み Gateway バージョンとコミットを検証します。
    2. ライブエージェントへの一時的な ACPX ブリッジセッションを開きます。
    3. そのエージェントに、`runtime: "acp"`、`agentId: "codex"`、`mode: "run"`、タスク `Reply with exactly LIVE-ACP-SPAWN-OK` で `sessions_spawn` を呼び出すよう依頼します。
    4. `accepted=yes`、実際の `childSessionKey`、バリデーターエラーがないことを検証します。
    5. 一時的なブリッジセッションをクリーンアップします。

    ゲートは `mode: "run"` のままにし、`streamTo: "parent"` はスキップします -
    スレッドに紐づく `mode: "session"` とストリームリレーのパスは、
    別のより詳細な統合パスです。

  </Accordion>
</AccordionGroup>

## サンドボックス互換性

ACP セッションは現在、OpenClaw サンドボックス内ではなく、ホストランタイム上で実行されます。

<Warning>
**セキュリティ境界:**

- 外部ハーネスは、自身の CLI 権限と選択された `cwd` に従って読み書きできます。
- OpenClaw のサンドボックスポリシーは、ACP ハーネス実行をラップしません。
- OpenClaw は引き続き、ACP 機能ゲート、許可されたエージェント、セッション所有権、チャンネルバインディング、Gateway 配信ポリシーを適用します。
- サンドボックスが適用される OpenClaw ネイティブ作業には、`runtime: "subagent"` を使用します。

</Warning>

現在の制限:

- リクエスターセッションがサンドボックス化されている場合、`sessions_spawn({ runtime: "acp" })` と `/acp spawn` の両方で ACP の起動はブロックされます。
- `runtime: "acp"` を指定した `sessions_spawn` は `sandbox: "require"` をサポートしません。

## セッションターゲットの解決

ほとんどの `/acp` アクションは、任意のセッションターゲット（`session-key`、
`session-id`、または `session-label`）を受け付けます。

**解決順序:**

1. 明示的なターゲット引数（または `/acp steer` の `--session`）
   - キーを試す
   - 次に UUID 形式のセッション ID
   - 次にラベル
2. 現在のスレッドバインディング（この会話/スレッドが ACP セッションにバインドされている場合）。
3. 現在のリクエスターセッションのフォールバック。

現在の会話バインディングとスレッドバインディングは、どちらも
ステップ 2 に参加します。

ターゲットを解決できない場合、OpenClaw は明確なエラー
（`Unable to resolve session target: ...`）を返します。

## ACP コントロール

| コマンド              | 実行内容                                              | 例                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP セッションを作成します。任意で現在のバインドまたはスレッドバインドを指定できます。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ターゲットセッションの進行中のターンをキャンセルします。                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 実行中のセッションにステア指示を送信します。                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | セッションを閉じ、スレッドターゲットのバインドを解除します。                  | `/acp close`                                                  |
| `/acp status`        | バックエンド、モード、状態、ランタイムオプション、機能を表示します。 | `/acp status`                                                 |
| `/acp set-mode`      | ターゲットセッションのランタイムモードを設定します。                      | `/acp set-mode plan`                                          |
| `/acp set`           | 汎用ランタイム設定オプションを書き込みます。                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ランタイム作業ディレクトリのオーバーライドを設定します。                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 承認ポリシープロファイルを設定します。                              | `/acp permissions strict`                                     |
| `/acp timeout`       | ランタイムタイムアウト（秒）を設定します。                            | `/acp timeout 120`                                            |
| `/acp model`         | ランタイムモデルのオーバーライドを設定します。                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | セッションランタイムオプションのオーバーライドを削除します。                  | `/acp reset-options`                                          |
| `/acp sessions`      | ストアから最近の ACP セッションを一覧表示します。                      | `/acp sessions`                                               |
| `/acp doctor`        | バックエンドの健全性、機能、実行可能な修正を表示します。           | `/acp doctor`                                                 |
| `/acp install`       | 決定論的なインストール手順と有効化手順を出力します。             | `/acp install`                                                |

`/acp status` は、有効なランタイムオプションに加えて、ランタイムレベルおよび
バックエンドレベルのセッション識別子を表示します。バックエンドに機能がない場合、
サポートされていないコントロールのエラーは明確に表示されます。`/acp sessions` は、
現在バインドされているセッションまたはリクエスターセッションのストアを読み取ります。ターゲットトークン
（`session-key`、`session-id`、または `session-label`）は、
カスタムのエージェントごとの `session.store` ルートを含む
Gateway セッション検出を通じて解決されます。

### ランタイムオプションのマッピング

`/acp` には便利なコマンドと汎用セッターがあります。同等の
操作:

| コマンド                      | マップ先                              | 注記                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | ランタイム設定キー `model`           | Codex ACP の場合、OpenClaw は `openai/<model>` をアダプターモデル ID に正規化し、`openai/gpt-5.4/high` のようなスラッシュ区切りの推論サフィックスを `reasoning_effort` にマップします。                                         |
| `/acp set thinking <level>`  | 正規オプション `thinking`          | OpenClaw は、存在する場合はバックエンドが通知した同等の値を送信し、`thinking`、次に `effort`、`reasoning_effort`、または `thought_level` を優先します。Codex ACP の場合、アダプターは値を `reasoning_effort` にマップします。 |
| `/acp permissions <profile>` | 正規オプション `permissionProfile` | OpenClaw は、存在する場合は `approval_policy`、`permission_profile`、`permissions`、または `permission_mode` など、バックエンドが通知した同等の値を送信します。                                                       |
| `/acp timeout <seconds>`     | 正規オプション `timeoutSeconds`    | OpenClaw は、存在する場合は `timeout` または `timeout_seconds` など、バックエンドが通知した同等の値を送信します。                                                                                                     |
| `/acp cwd <path>`            | ランタイム cwd オーバーライド                 | 直接更新します。                                                                                                                                                                                             |
| `/acp set <key> <value>`     | 汎用                              | `key=cwd` は cwd オーバーライドパスを使用します。                                                                                                                                                                      |
| `/acp reset-options`         | すべてのランタイムオーバーライドをクリアします         | -                                                                                                                                                                                                          |

## acpx ハーネス、Plugin セットアップ、権限

acpx ハーネス設定（Claude Code / Codex / Gemini CLI
エイリアス）、plugin-tools と OpenClaw-tools MCP ブリッジ、および ACP
権限モードについては、
[ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup)を参照してください。

## トラブルシューティング

| 症状                                                                        | 考えられる原因                                                                                                         | 修正                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | バックエンド Plugin が見つからない、無効化されている、または `plugins.allow` によりブロックされています。              | バックエンド Plugin をインストールして有効化し、その許可リストが設定されている場合は `plugins.allow` に `acpx` を含めてから、`/acp doctor` を実行します。               |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP がグローバルに無効化されています。                                                                                 | `acp.enabled=true` を設定します。                                                                                                                                        |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 通常のスレッドメッセージからの自動ディスパッチが無効化されています。                                                   | 自動スレッドルーティングを再開するには `acp.dispatch.enabled=true` を設定します。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き動作します。            |
| `ACP agent "<id>" is not allowed by policy`                                 | エージェントが許可リストにありません。                                                                                 | 許可された `agentId` を使用するか、`acp.allowedAgents` を更新します。                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | バックエンド Plugin が見つからない、無効化されている、許可/拒否ポリシーでブロックされている、または構成済みの実行ファイルが利用できません。 | バックエンド Plugin をインストール/有効化し、`/acp doctor` を再実行します。異常な状態が続く場合は、バックエンドのインストールまたはポリシーエラーを確認します。         |
| Harness command not found                                                   | アダプター CLI がインストールされていない、外部 Plugin が見つからない、または Codex 以外のアダプターで初回実行時の `npx` 取得に失敗しました。 | `/acp doctor` を実行し、Gateway ホストでアダプターをインストール/事前準備するか、acpx エージェントコマンドを明示的に構成します。                                        |
| Model-not-found from the harness                                            | モデル ID は別のプロバイダー/ハーネスでは有効ですが、この ACP ターゲットでは有効ではありません。                       | そのハーネスが一覧表示するモデルを使用するか、ハーネス内でモデルを構成するか、オーバーライドを省略します。                                                             |
| Vendor auth error from the harness                                          | OpenClaw は正常ですが、ターゲット CLI/プロバイダーにログインしていません。                                             | Gateway ホスト環境でログインするか、必要なプロバイダーキーを指定します。                                                                                                |
| `Unable to resolve session target: ...`                                     | キー/ID/ラベルトークンが不正です。                                                                                     | `/acp sessions` を実行し、正確なキー/ラベルをコピーして再試行します。                                                                                                    |
| `--bind here requires running /acp spawn inside an active ... conversation` | アクティブでバインド可能な会話なしで `--bind here` が使用されました。                                                  | ターゲットのチャット/チャンネルに移動して再試行するか、非バインドのスポーンを使用します。                                                                               |
| `Conversation bindings are unavailable for <channel>.`                      | アダプターに現在の会話の ACP バインド機能がありません。                                                                | サポートされている場合は `/acp spawn ... --thread ...` を使用するか、トップレベルの `bindings[]` を構成するか、サポート対象のチャンネルに移動します。                   |
| `--thread here requires running /acp spawn inside an active ... thread`     | スレッドコンテキスト外で `--thread here` が使用されました。                                                            | ターゲットスレッドに移動するか、`--thread auto`/`off` を使用します。                                                                                                     |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 別のユーザーがアクティブなバインドターゲットを所有しています。                                                         | 所有者として再バインドするか、別の会話またはスレッドを使用します。                                                                                                      |
| `Thread bindings are unavailable for <channel>.`                            | アダプターにスレッドバインド機能がありません。                                                                         | `--thread off` を使用するか、サポート対象のアダプター/チャンネルに移動します。                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP ランタイムはホスト側にあり、要求元セッションはサンドボックス化されています。                                       | サンドボックス化されたセッションからは `runtime="subagent"` を使用するか、サンドボックス化されていないセッションから ACP スポーンを実行します。                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP ランタイムに対して `sandbox="require"` が要求されました。                                                          | 必須のサンドボックス化には `runtime="subagent"` を使用するか、サンドボックス化されていないセッションから `sandbox="inherit"` で ACP を使用します。                       |
| `Cannot apply --model ... did not advertise model support`                  | ターゲットハーネスが汎用 ACP モデル切り替えを公開していません。                                                        | ACP `models`/`session/set_model` を公開するハーネスを使用するか、Codex ACP モデル参照を使用するか、ハーネス独自の起動フラグがある場合はハーネス内でモデルを直接構成します。 |
| Missing ACP metadata for bound session                                      | ACP セッションメタデータが古い、または削除されています。                                                              | `/acp spawn` で再作成してから、スレッドを再バインド/フォーカスします。                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` が非対話型 ACP セッションで書き込み/実行をブロックしています。                                        | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定し、gateway を再起動します。[権限構成](/ja-JP/tools/acp-agents-setup#permission-configuration)を参照してください。 |
| ACP session fails early with little output                                  | 権限プロンプトが `permissionMode`/`nonInteractivePermissions` によってブロックされています。                           | `AcpRuntimeError` がないか gateway ログを確認します。完全な権限には `permissionMode=approve-all` を設定します。段階的な機能低下には `nonInteractivePermissions=deny` を設定します。 |
| ACP session stalls indefinitely after completing work                       | ハーネスプロセスは終了しましたが、ACP セッションが完了を報告しませんでした。                                           | OpenClaw を更新してください。現在の acpx クリーンアップは、クローズ時と Gateway 起動時に OpenClaw 所有の古いラッパーおよびアダプタープロセスを回収します。              |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 内部イベントエンベロープが ACP 境界を越えて漏洩しました。                                                             | OpenClaw を更新し、完了フローを再実行してください。外部ハーネスはプレーンな完了プロンプトのみを受け取るべきです。                                                     |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` は
ACP/acpx ではなく、ネイティブ Codex フックリレーに属します。バインドされた Codex チャットでは、`/new` または `/reset` で新しい
セッションを開始してください。一度は動作し、その後次の
ネイティブツール呼び出しで再発する場合は、`/new` を繰り返すのではなく、Codex app-server または OpenClaw Gateway を再起動してください。
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
