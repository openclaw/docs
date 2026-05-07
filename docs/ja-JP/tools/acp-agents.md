---
read_when:
    - ACP 経由でコーディングハーネスを実行する
    - メッセージングチャネルで会話に紐づいた ACP セッションを設定する
    - メッセージチャネルの会話を永続的な ACP セッションにバインドする
    - ACP バックエンド、Plugin の接続、または補完配信のトラブルシューティング
    - チャットから /acp コマンドを操作する
sidebarTitle: ACP agents
summary: 外部コーディングハーネス（Claude Code、Cursor、Gemini CLI、明示的な Codex ACP、OpenClaw ACP、OpenCode）を ACP バックエンド経由で実行する
title: ACP エージェント
x-i18n:
    generated_at: "2026-05-07T13:26:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5cdb853d2cec2c7466fff5f1e046b38bf9bac8b2b62f208ad3465a666272631
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) セッションにより、OpenClaw は ACP バックエンド Plugin を通じて外部コーディングハーネス（たとえば Pi、Claude Code、Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI、およびその他の対応 ACPX ハーネス）を実行できます。

各 ACP セッションの spawn は [バックグラウンドタスク](/ja-JP/automation/tasks) として追跡されます。

<Note>
**ACP は外部ハーネス向けの経路であり、デフォルトの Codex 経路ではありません。** ネイティブ Codex アプリサーバー Plugin は `/codex ...` コントロールと `agentRuntime.id: "codex"` 埋め込みランタイムを所有します。一方 ACP は `/acp ...` コントロールと `sessions_spawn({ runtime: "acp" })` セッションを所有します。

Codex または Claude Code を外部 MCP クライアントとして既存の OpenClaw チャネル会話に直接接続したい場合は、ACP ではなく [`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。
</Note>

## どのページを見ればよいですか？

| やりたいこと                                                                                    | 使用するもの                              | 注記                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 現在の会話で Codex をバインドまたは制御する                                               | `/codex bind`, `/codex threads`       | `codex` Plugin が有効な場合のネイティブ Codex アプリサーバー経路です。バインドされたチャット返信、画像転送、モデル/fast/権限、停止、ステア制御を含みます。ACP は明示的なフォールバックです |
| Claude Code、Gemini CLI、明示的な Codex ACP、または別の外部ハーネスを OpenClaw _経由で_ 実行する | このページ                             | チャットにバインドされたセッション、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、バックグラウンドタスク、ランタイム制御                                                                                   |
| エディターまたはクライアント向けに OpenClaw Gateway セッションを ACP サーバー _として_ 公開する                   | [`openclaw acp`](/ja-JP/cli/acp)            | ブリッジモードです。IDE/クライアントは stdio/WebSocket 経由で OpenClaw に ACP で通信します                                                                                                                            |
| ローカル AI CLI をテキスト専用フォールバックモデルとして再利用する                                              | [CLI バックエンド](/ja-JP/gateway/cli-backends) | ACP ではありません。OpenClaw ツールなし、ACP コントロールなし、ハーネスランタイムなし                                                                                                                               |

## これはそのまま動作しますか？

はい。公式 ACP ランタイム Plugin をインストールした後に動作します。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

ソースチェックアウトでは、`pnpm install` 後にローカルの `extensions/acpx` ワークスペース Plugin を使用できます。準備状況のチェックには `/acp doctor` を実行します。

OpenClaw がエージェントに ACP spawn を教えるのは、ACP が**本当に使用可能**な場合だけです。ACP が有効であること、dispatch が無効化されていないこと、現在のセッションがサンドボックスでブロックされていないこと、ランタイムバックエンドがロード済みであることが必要です。これらの条件が満たされない場合、ACP Plugin Skills と `sessions_spawn` の ACP ガイダンスは非表示のままになり、エージェントが利用できないバックエンドを提案しないようにします。

<AccordionGroup>
  <Accordion title="初回実行時の注意点">
    - `plugins.allow` が設定されている場合、それは制限的な Plugin インベントリであり、**必ず** `acpx` を含める必要があります。含まれていない場合、インストール済みの ACP バックエンドは意図的にブロックされ、`/acp doctor` は allowlist エントリの欠落を報告します。
    - Codex ACP アダプターは `acpx` Plugin とともにステージされ、可能な場合はローカルで起動されます。
    - Codex ACP は分離された `CODEX_HOME` で実行されます。OpenClaw はホストの Codex 設定から信頼済みプロジェクトエントリだけをコピーし、アクティブなワークスペースを信頼します。auth、通知、フックはホスト設定に残します。
    - 他のターゲットハーネスアダプターは、初回使用時に必要に応じて `npx` で取得される場合があります。
    - そのハーネスのベンダー auth は引き続きホスト上に存在している必要があります。
    - ホストに npm またはネットワークアクセスがない場合、キャッシュを事前にウォームするか別の方法でアダプターをインストールするまで、初回実行時のアダプター取得は失敗します。

  </Accordion>
  <Accordion title="ランタイム前提条件">
    ACP は実際の外部ハーネスプロセスを起動します。OpenClaw はルーティング、バックグラウンドタスク状態、配信、バインディング、ポリシーを所有します。ハーネスはプロバイダーログイン、モデルカタログ、ファイルシステムの挙動、ネイティブツールを所有します。

    OpenClaw を疑う前に、次を確認してください。

    - `/acp doctor` が、有効で正常なバックエンドを報告している。
    - allowlist が設定されている場合、ターゲット id が `acp.allowedAgents` で許可されている。
    - ハーネスコマンドを Gateway ホスト上で起動できる。
    - そのハーネスのプロバイダー auth が存在している（`claude`、`codex`、`gemini`、`opencode`、`droid` など）。
    - 選択したモデルがそのハーネスに存在している。モデル id はハーネス間で移植可能ではありません。
    - 要求した `cwd` が存在してアクセス可能である。または `cwd` を省略して、バックエンドのデフォルトを使用させる。
    - 権限モードが作業に合っている。非インタラクティブセッションはネイティブ権限プロンプトをクリックできないため、書き込み/実行が多いコーディング実行では通常、ヘッドレスに進行できる ACPX 権限プロファイルが必要です。

  </Accordion>
</AccordionGroup>

OpenClaw Plugin ツールと組み込み OpenClaw ツールは、デフォルトでは ACP ハーネスに公開されません。ハーネスがこれらのツールを直接呼び出すべき場合にのみ、[ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup) で明示的な MCP ブリッジを有効にしてください。

## 対応ハーネスターゲット

`acpx` バックエンドでは、これらのハーネス id を `/acp spawn <id>` または `sessions_spawn({ runtime: "acp", agentId: "<id>" })` のターゲットとして使用します。

| ハーネス id | 一般的なバックエンド                                | 注記                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP アダプター                        | ホスト上の Claude Code auth が必要です。                                              |
| `codex`    | Codex ACP アダプター                              | ネイティブ `/codex` が利用できない場合、または ACP が要求された場合の明示的な ACP フォールバック専用です。 |
| `copilot`  | GitHub Copilot ACP アダプター                     | Copilot CLI/runtime auth が必要です。                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | ローカルインストールが別の ACP エントリポイントを公開している場合は、acpx コマンドを上書きしてください。    |
| `droid`    | Factory Droid CLI                              | Factory/Droid auth、またはハーネス環境内の `FACTORY_API_KEY` が必要です。        |
| `gemini`   | Gemini CLI ACP アダプター                         | Gemini CLI auth または API キー設定が必要です。                                          |
| `iflow`    | iFlow CLI                                      | アダプターの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `kilocode` | Kilo Code CLI                                  | アダプターの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `kimi`     | Kimi/Moonshot CLI                              | ホスト上の Kimi/Moonshot auth が必要です。                                            |
| `kiro`     | Kiro CLI                                       | アダプターの可用性とモデル制御は、インストール済み CLI に依存します。                 |
| `opencode` | OpenCode ACP アダプター                           | OpenCode CLI/provider auth が必要です。                                                |
| `openclaw` | `openclaw acp` 経由の OpenClaw Gateway ブリッジ | ACP 対応ハーネスが OpenClaw Gateway セッションに通信を戻せるようにします。                 |
| `pi`       | Pi/埋め込み OpenClaw ランタイム                   | OpenClaw ネイティブのハーネス実験に使用されます。                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | ホスト上の Qwen 互換 auth が必要です。                                          |

カスタム acpx エージェントエイリアスは acpx 自体で設定できますが、OpenClaw ポリシーは dispatch 前に引き続き `acp.allowedAgents` と任意の `agents.list[].runtime.acp.agent` マッピングをチェックします。

## オペレーターランブック

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
  <Step title="状態を確認">
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
    - Spawn は ACP ランタイムセッションを作成または再開し、ACP メタデータを OpenClaw セッションストアに記録します。また、実行が親所有の場合はバックグラウンドタスクを作成することがあります。
    - 親所有の ACP セッションは、ランタイムセッションが永続的であってもバックグラウンド作業として扱われます。完了とサーフェス横断の配信は、通常のユーザー向けチャットセッションのように振る舞うのではなく、親タスク通知機構を通じて行われます。
    - タスクメンテナンスは、終端状態または孤立した親所有のワンショット ACP セッションを閉じます。永続 ACP セッションは、アクティブな会話バインディングが残っている間は保持されます。アクティブなバインディングがない古い永続セッションは、所有タスクが完了した後またはそのタスクレコードがなくなった後に暗黙に再開されないよう閉じられます。
    - バインドされたフォローアップメッセージは、バインディングが閉じられる、フォーカス解除される、リセットされる、または期限切れになるまで、ACP セッションに直接送られます。
    - Gateway コマンドはローカルに留まります。`/acp ...`、`/status`、`/unfocus` が、バインドされた ACP ハーネスに通常のプロンプトテキストとして送信されることはありません。
    - `cancel` は、バックエンドがキャンセルをサポートしている場合にアクティブなターンを中止します。バインディングやセッションメタデータは削除しません。
    - `close` は OpenClaw の視点から ACP セッションを終了し、バインディングを削除します。ハーネスが resume をサポートしている場合、ハーネス側の上流履歴は保持されることがあります。
    - acpx Plugin は `close` 後に OpenClaw 所有のラッパーおよびアダプタープロセスツリーをクリーンアップし、Gateway 起動時に古い OpenClaw 所有の ACPX 孤児プロセスを回収します。
    - アイドル状態のランタイムワーカーは `acp.runtime.ttlMinutes` 後にクリーンアップ対象になります。保存済みセッションメタデータは `/acp sessions` で引き続き利用できます。

  </Accordion>
  <Accordion title="ネイティブ Codex ルーティングルール">
    有効な場合に**ネイティブ Codex Plugin**へルーティングされるべき自然言語トリガー:

    - 「この Discord チャネルを Codex にバインドして。」
    - 「このチャットを Codex スレッド `<id>` にアタッチして。」
    - 「Codex スレッドを表示してから、これをバインドして。」

    Codex ネイティブの会話バインディングが既定のチャット制御パスです。
    OpenClaw の動的ツールは引き続き OpenClaw 経由で実行されますが、
    shell/apply-patch などの Codex ネイティブツールは Codex 内で実行されます。
    Codex ネイティブツールイベントについて、OpenClaw はターンごとのネイティブ
    hook relay を注入し、plugin hooks が `before_tool_call` をブロックし、
    `after_tool_call` を監視し、Codex `PermissionRequest` イベントを
    OpenClaw approvals 経由でルーティングできるようにします。Codex `Stop` hooks は
    OpenClaw `before_agent_finalize` にリレーされ、そこで plugins は Codex が回答を確定する前に
    もう1回のモデルパスを要求できます。このリレーは意図的に保守的なままです。
    Codex ネイティブツールの引数を変更したり、Codex のスレッドレコードを書き換えたりしません。
    ACP ランタイム/セッションモデルを使いたい場合にのみ、明示的な ACP を使用してください。
    埋め込み Codex サポート境界は
    [Codex harness v1 サポート契約](/ja-JP/plugins/codex-harness#v1-support-contract)に記載されています。

  </Accordion>
  <Accordion title="モデル / provider / ランタイム選択の早見表">
    - `openai-codex/*` - doctor によって修復される従来の Codex OAuth/サブスクリプションモデルルート。
    - `openai/*` - OpenAI agent ターン向けのネイティブ Codex app-server 埋め込みランタイム。
    - `/codex ...` - ネイティブ Codex 会話制御。
    - `/acp ...` または `runtime: "acp"` - 明示的な ACP/acpx 制御。

  </Accordion>
  <Accordion title="ACP ルーティングの自然言語トリガー">
    ACP ランタイムにルーティングするべきトリガー:

    - 「これをワンショットの Claude Code ACP セッションとして実行し、結果を要約してください。」
    - 「このタスクには Gemini CLI をスレッド内で使用し、その後のフォローアップも同じスレッドで続けてください。」
    - 「バックグラウンドスレッドで ACP 経由で Codex を実行してください。」

    OpenClaw は `runtime: "acp"` を選択し、harness `agentId` を解決し、
    サポートされている場合は現在の会話またはスレッドにバインドし、
    close/expiry までフォローアップをそのセッションにルーティングします。Codex は、
    ACP/acpx が明示されている場合、または要求された操作でネイティブ Codex
    plugin が利用できない場合にのみ、このパスに従います。

    `sessions_spawn` では、ACP が有効で、requester がサンドボックス化されておらず、
    ACP ランタイム backend が読み込まれている場合にのみ、`runtime: "acp"` が通知されます。
    `acp.dispatch.enabled=false` は自動 ACP スレッド dispatch を一時停止しますが、
    明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しを隠したりブロックしたりしません。
    これは `codex`、`claude`、`droid`、`gemini`、`opencode` などの ACP harness id を対象にします。
    そのエントリが `agents.list[].runtime.type="acp"` で明示的に構成されていない限り、
    `agents_list` から通常の OpenClaw config agent id を渡さないでください。
    それ以外の場合は、既定の sub-agent ランタイムを使用します。OpenClaw agent が
    `runtime.type="acp"` で構成されている場合、OpenClaw は
    `runtime.acp.agent` を基盤となる harness id として使用します。

  </Accordion>
</AccordionGroup>

## ACP と sub-agents

外部 harness ランタイムが必要な場合は ACP を使用します。`codex`
plugin が有効な場合に Codex 会話バインディング/制御を行うには、**ネイティブ Codex
app-server** を使用します。OpenClaw ネイティブの委任実行が必要な場合は
**sub-agents** を使用します。

| 領域          | ACP セッション                           | Sub-agent 実行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| ランタイム       | ACP backend plugin (例: acpx) | OpenClaw ネイティブ sub-agent ランタイム  |
| セッションキー   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| メインコマンド | `/acp ...`                            | `/subagents ...`                   |
| Spawn ツール    | `runtime:"acp"` を指定した `sessions_spawn` | `sessions_spawn` (既定のランタイム) |

[Sub-agents](/ja-JP/tools/subagents) も参照してください。

## ACP が Claude Code を実行する方法

ACP 経由の Claude Code では、スタックは次のとおりです。

1. OpenClaw ACP セッション制御プレーン。
2. 公式 `@openclaw/acpx` ランタイム plugin。
3. Claude ACP アダプター。
4. Claude 側のランタイム/セッション機構。

ACP Claude は、ACP 制御、セッション再開、
バックグラウンドタスク追跡、任意の会話/スレッドバインディングを備えた
**harness セッション**です。

CLI backends は、独立したテキスト専用のローカル fallback ランタイムです。
[CLI Backends](/ja-JP/gateway/cli-backends) を参照してください。

operators 向けの実用的なルールは次のとおりです。

- **`/acp spawn`、バインド可能なセッション、ランタイム制御、または永続的な harness 作業が必要ですか?** ACP を使用します。
- **raw CLI 経由の単純なローカルテキスト fallback が必要ですか?** CLI backends を使用します。

## バインドされたセッション

### メンタルモデル

- **チャットサーフェス** - 人が会話を続ける場所 (Discord チャンネル、Telegram トピック、iMessage チャット)。
- **ACP セッション** - OpenClaw がルーティングする永続的な Codex/Claude/Gemini ランタイム状態。
- **子スレッド/トピック** - `--thread ...` によってのみ作成される任意の追加メッセージングサーフェス。
- **ランタイム workspace** - harness が実行されるファイルシステム上の場所 (`cwd`、repo checkout、backend workspace)。チャットサーフェスとは独立しています。

### 現在の会話へのバインド

`/acp spawn <harness> --bind here` は、現在の会話を
spawn された ACP セッションに固定します。子スレッドはなく、同じチャットサーフェスです。
OpenClaw は transport、auth、安全性、delivery を引き続き所有します。
その会話内のフォローアップメッセージは同じセッションにルーティングされます。
`/new` と `/reset` はセッションをその場でリセットし、`/acp close` はバインディングを削除します。

例:

```text
/codex bind                                              # ネイティブ Codex バインド、今後のメッセージをここにルーティング
/codex model gpt-5.4                                     # バインドされたネイティブ Codex スレッドを調整
/codex stop                                              # アクティブなネイティブ Codex ターンを制御
/acp spawn codex --bind here                             # Codex 用の明示的な ACP fallback
/acp spawn codex --thread auto                           # 子スレッド/トピックを作成し、そこにバインドする場合があります
/acp spawn codex --bind here --cwd /workspace/repo       # 同じチャットバインディング、Codex は /workspace/repo で実行
```

<AccordionGroup>
  <Accordion title="バインディングルールと排他性">
    - `--bind here` と `--thread ...` は相互排他的です。
    - `--bind here` は、現在の会話へのバインディングを通知するチャンネルでのみ機能します。それ以外の場合、OpenClaw は明確な未サポートメッセージを返します。バインディングは gateway 再起動後も永続します。
    - Discord では、`spawnSessions` が `--thread auto|here` の子スレッド作成を制御します。`--bind here` は対象ではありません。
    - `--cwd` なしで別の ACP agent に spawn した場合、OpenClaw は既定で**対象 agent の** workspace を継承します。継承されたパスが存在しない場合 (`ENOENT`/`ENOTDIR`) は backend 既定に fallback します。その他のアクセスエラー (例: `EACCES`) は spawn エラーとして表示されます。
    - Gateway 管理コマンドは、バインドされた会話でもローカルのままです。通常のフォローアップテキストがバインドされた ACP セッションにルーティングされる場合でも、`/acp ...` コマンドは OpenClaw によって処理されます。`/status` と `/unfocus` も、そのサーフェスでコマンド処理が有効な場合は常にローカルのままです。

  </Accordion>
  <Accordion title="スレッドバインドセッション">
    チャンネルアダプターでスレッドバインディングが有効な場合:

    - OpenClaw はスレッドを対象の ACP セッションにバインドします。
    - そのスレッド内のフォローアップメッセージは、バインドされた ACP セッションにルーティングされます。
    - ACP 出力は同じスレッドに返されます。
    - Unfocus/close/archive/idle-timeout または max-age expiry によってバインディングが削除されます。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status`、`/unfocus` は Gateway コマンドであり、ACP harness へのプロンプトではありません。

    スレッドバインド ACP に必要な機能フラグ:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` は既定でオンです (自動 ACP スレッド dispatch を一時停止するには `false` に設定します。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き機能します)。
    - チャンネルアダプターのスレッドセッション spawns が有効 (既定: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    スレッドバインディングのサポートはアダプター固有です。アクティブなチャンネル
    アダプターがスレッドバインディングをサポートしていない場合、OpenClaw は明確な
    unsupported/unavailable メッセージを返します。

  </Accordion>
  <Accordion title="スレッド対応チャンネル">
    - セッション/スレッドバインディング機能を公開する任意のチャンネルアダプター。
    - 現在の組み込みサポート: **Discord** スレッド/チャンネル、**Telegram** トピック (グループ/スーパーグループ内のフォーラムトピックおよび DM トピック)。
    - Plugin チャンネルは同じバインディングインターフェースを通じてサポートを追加できます。

  </Accordion>
</AccordionGroup>

## 永続的なチャンネルバインディング

一時的でないワークフローでは、トップレベルの `bindings[]` エントリで
永続的な ACP バインディングを構成します。

### バインディングモデル

<ParamField path="bindings[].type" type='"acp"'>
  永続的な ACP 会話バインディングとしてマークします。
</ParamField>
<ParamField path="bindings[].match" type="object">
  対象の会話を識別します。チャンネルごとの形状:

- **Discord チャンネル/スレッド:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram フォーラムトピック:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/グループ:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。安定したグループバインディングには `chat_id:*` または `chat_identifier:*` を推奨します。
- **iMessage DM/グループ:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。安定したグループバインディングには `chat_id:*` を推奨します。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  所有する OpenClaw agent id。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  任意の ACP override。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  任意の operator 向けラベル。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  任意のランタイム作業ディレクトリ。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  任意の backend override。
</ParamField>

### agent ごとのランタイム既定値

`agents.list[].runtime` を使用して、agent ごとに ACP 既定値を一度だけ定義します。

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness id、例: `codex` または `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP バインドセッションの override 優先順位:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. グローバル ACP 既定値 (例: `acp.backend`)

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

- OpenClaw は、設定済みの ACP セッションが使用前に存在することを保証します。
- そのチャンネルまたはトピック内のメッセージは、設定済みの ACP セッションにルーティングされます。
- バインドされた会話では、`/new` と `/reset` は同じ ACP セッションキーをその場でリセットします。
- 一時的なランタイムバインディング（たとえばスレッドフォーカスフローで作成されたもの）は、存在する場所では引き続き適用されます。
- 明示的な `cwd` なしでエージェント間 ACP を起動する場合、OpenClaw はエージェント設定から対象エージェントのワークスペースを継承します。
- 継承したワークスペースパスが見つからない場合はバックエンドのデフォルト cwd にフォールバックし、見つかっているパスへのアクセス失敗は起動エラーとして表面化します。

## ACP セッションを開始する

ACP セッションを開始する方法は 2 つあります。

<Tabs>
  <Tab title="From sessions_spawn">
    エージェントのターンまたはツール呼び出しから ACP セッションを開始するには、`runtime: "acp"` を使用します。

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
    `runtime: "acp"` を明示的に設定してください。`agentId` を省略した場合、OpenClaw は
    設定されていれば `acp.defaultAgent` を使用します。`mode: "session"` では、
    永続的なバインド済み会話を維持するために `thread: true` が必要です。
    </Note>

  </Tab>
  <Tab title="From /acp command">
    チャットから明示的にオペレーターが制御するには、`/acp spawn` を使用します。

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
  ACP の対象ハーネス id。設定されていれば `acp.defaultAgent` にフォールバックします。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  サポートされている場合にスレッドバインディングフローをリクエストします。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` は一回限りで、`"session"` は永続的です。`thread: true` で
  `mode` が省略された場合、OpenClaw はランタイムパスごとに永続的な挙動を
  デフォルトにする場合があります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cwd" type="string">
  リクエストされたランタイム作業ディレクトリ（バックエンド/ランタイム
  ポリシーによって検証されます）。省略した場合、ACP 起動は設定されている
  対象エージェントのワークスペースを継承します。継承したパスが見つからない場合は
  バックエンドのデフォルトにフォールバックし、実際のアクセスエラーは返されます。
</ParamField>
<ParamField path="label" type="string">
  セッション/バナーテキストで使用される、オペレーター向けのラベル。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  新しいセッションを作成する代わりに、既存の ACP セッションを再開します。
  エージェントは `session/load` によって会話履歴を再生します。
  `runtime: "acp"` が必要です。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` は、ACP の初回実行の進捗サマリーをシステムイベントとして
  リクエスト元セッションへストリーミングします。受け入れられたレスポンスには、
  セッションスコープの JSONL ログ（`<sessionId>.acp-stream.jsonl`）を指す
  `streamLogPath` が含まれる場合があり、完全なリレー履歴を tail できます。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  N 秒後に ACP 子ターンを中止します。`0` はターンを Gateway の
  タイムアウトなしパスに維持します。同じ値が Gateway 実行と ACP ランタイムに
  適用されるため、停止したハーネスやクォータを使い切ったハーネスが
  親エージェントレーンを無期限に占有しません。
</ParamField>
<ParamField path="model" type="string">
  ACP 子セッションの明示的なモデルオーバーライド。Codex ACP 起動では、
  `openai-codex/gpt-5.4` などの OpenClaw Codex 参照を、`session/new` の前に
  Codex ACP 起動設定へ正規化します。`openai-codex/gpt-5.4/high` のような
  スラッシュ形式では、Codex ACP の推論エフォートも設定します。
  その他のハーネスは ACP `models` を公開し、`session/set_model` を
  サポートする必要があります。そうでない場合、OpenClaw/acpx は対象エージェントの
  デフォルトへ黙ってフォールバックするのではなく、明確に失敗します。
</ParamField>
<ParamField path="thinking" type="string">
  明示的な thinking/推論エフォート。Codex ACP では、`minimal` は
  低エフォートに対応し、`low`/`medium`/`high`/`xhigh` は直接対応し、
  `off` は推論エフォートの起動オーバーライドを省略します。
</ParamField>

## 起動時のバインドモードとスレッドモード

<Tabs>
  <Tab title="--bind here|off">
    | モード | 挙動                                                                     |
    | ------ | ------------------------------------------------------------------------ |
    | `here` | 現在のアクティブな会話をその場でバインドします。アクティブな会話がなければ失敗します。 |
    | `off`  | 現在の会話のバインディングを作成しません。                               |

    注記:

    - `--bind here` は、「このチャンネルまたはチャットを Codex バックエンドにする」ための最も単純なオペレーターパスです。
    - `--bind here` は子スレッドを作成しません。
    - `--bind here` は、現在の会話のバインディングサポートを公開しているチャンネルでのみ使用できます。
    - `--bind` と `--thread` を同じ `/acp spawn` 呼び出しで組み合わせることはできません。

  </Tab>
  <Tab title="--thread auto|here|off">
    | モード | 挙動                                                                                                     |
    | ------ | -------------------------------------------------------------------------------------------------------- |
    | `auto` | アクティブなスレッド内では、そのスレッドをバインドします。スレッド外では、サポートされていれば子スレッドを作成/バインドします。 |
    | `here` | 現在のアクティブなスレッドを要求します。スレッド内でなければ失敗します。                                 |
    | `off`  | バインディングなし。セッションは未バインドで開始します。                                                 |

    注記:

    - スレッドバインディングでないサーフェスでは、デフォルトの挙動は実質的に `off` です。
    - スレッドバインド起動にはチャンネルポリシーのサポートが必要です:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - 子スレッドを作成せずに現在の会話を固定したい場合は、`--bind here` を使用します。

  </Tab>
</Tabs>

## 配信モデル

ACP セッションは、対話型ワークスペースにも、親が所有する
バックグラウンド作業にもなれます。配信パスはその形によって変わります。

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    対話型セッションは、目に見えるチャットサーフェスで会話を続けるためのものです:

    - `/acp spawn ... --bind here` は、現在の会話を ACP セッションにバインドします。
    - `/acp spawn ... --thread ...` は、チャンネルのスレッド/トピックを ACP セッションにバインドします。
    - 永続的に設定された `bindings[].type="acp"` は、一致する会話を同じ ACP セッションにルーティングします。

    バインドされた会話内の後続メッセージは ACP セッションに直接ルーティングされ、
    ACP 出力は同じチャンネル/スレッド/トピックへ返されます。

    OpenClaw がハーネスへ送信する内容:

    - 通常のバインド済み後続メッセージは、プロンプトテキストとして送信されます。添付ファイルは、ハーネス/バックエンドがサポートする場合のみ追加されます。
    - `/acp` 管理コマンドとローカル Gateway コマンドは、ACP へのディスパッチ前にインターセプトされます。
    - ランタイム生成の完了イベントは、対象ごとに具現化されます。OpenClaw エージェントは OpenClaw の内部ランタイムコンテキストエンベロープを受け取り、外部 ACP ハーネスは子の結果と指示を含むプレーンなプロンプトを受け取ります。生の `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` エンベロープは、外部ハーネスへ送信したり、ACP ユーザートランスクリプトテキストとして永続化したりしてはいけません。
    - ACP トランスクリプトエントリには、ユーザーに見えるトリガーテキストまたはプレーンな完了プロンプトが使用されます。内部イベントメタデータは可能な限り OpenClaw 内で構造化されたまま保持され、ユーザー作成のチャットコンテンツとして扱われません。

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    別のエージェント実行によって起動された一回限りの ACP セッションは、
    サブエージェントに似たバックグラウンドの子です:

    - 親は `sessions_spawn({ runtime: "acp", mode: "run" })` で作業を依頼します。
    - 子は独自の ACP ハーネスセッションで実行されます。
    - 子ターンはネイティブのサブエージェント起動で使われるものと同じバックグラウンドレーンで実行されるため、遅い ACP ハーネスが無関係なメインセッション作業をブロックしません。
    - 完了はタスク完了通知パスを通じて報告されます。OpenClaw は、外部ハーネスへ送信する前に内部完了メタデータをプレーンな ACP プロンプトへ変換するため、ハーネスは OpenClaw 専用のランタイムコンテキストマーカーを見ません。
    - ユーザー向けの返信が有用な場合、親は子の結果を通常のアシスタントの声で書き換えます。

    このパスを、親と子のピアツーピアチャットとして扱っては**いけません**。
    子には、親へ戻る完了チャンネルがすでにあります。

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` は、起動後に別のセッションを対象にできます。通常の
    ピアセッションでは、OpenClaw はメッセージを注入した後、エージェント間（A2A）の
    後続パスを使用します:

    - 対象セッションの返信を待ちます。
    - 必要に応じて、リクエスト元と対象が制限された回数の後続ターンを交換できるようにします。
    - 対象に通知メッセージを生成するよう依頼します。
    - その通知を目に見えるチャンネルまたはスレッドへ配信します。

    この A2A パスは、送信者が目に見える後続応答を必要とする
    ピア送信のフォールバックです。たとえば広範な
    `tools.sessions.visibility` 設定のもとで、無関係のセッションが
    ACP 対象を見てメッセージできる場合には有効なままです。

    OpenClaw が A2A 後続処理をスキップするのは、リクエスト元が
    自身の、親が所有する一回限りの ACP 子の親である場合のみです。
    その場合、タスク完了の上で A2A を実行すると、子の結果で親を起こし、
    親の返信を子へ送り返して、親/子のエコーループを作成する可能性があります。
    その所有子ケースでは、結果には完了パスがすでに責任を持つため、
    `sessions_send` の結果は `delivery.status="skipped"` を報告します。

  </Accordion>
  <Accordion title="Resume an existing session">
    新しく開始する代わりに、前の ACP セッションを続行するには
    `resumeSessionId` を使用します。エージェントは `session/load` によって
    会話履歴を再生するため、以前の完全なコンテキストを引き継ぎます。

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    一般的なユースケース:

    - Codex セッションをラップトップからスマートフォンへ引き継ぎます。エージェントに、中断したところから再開するよう伝えます。
    - CLI で対話的に開始したコーディングセッションを、今度はエージェント経由でヘッドレスに続行します。
    - Gateway の再起動やアイドルタイムアウトで中断された作業を再開します。

    注記:

    - `resumeSessionId` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `streamTo` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `resumeSessionId` はホストローカルな ACP/ハーネスの再開 id であり、OpenClaw チャンネルセッションキーではありません。OpenClaw はディスパッチ前に ACP 起動ポリシーと対象エージェントポリシーを引き続きチェックし、そのアップストリーム id を読み込む認可は ACP バックエンドまたはハーネスが所有します。
    - `resumeSessionId` はアップストリームの ACP 会話履歴を復元します。`thread` と `mode` は、作成中の新しい OpenClaw セッションに通常どおり適用されるため、`mode: "session"` には引き続き `thread: true` が必要です。
    - 対象エージェントは `session/load` をサポートしている必要があります（Codex と Claude Code はサポートしています）。
    - セッション id が見つからない場合、起動は明確なエラーで失敗します。新しいセッションへの暗黙のフォールバックはありません。

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Gateway のデプロイ後は、単体テストを信頼するのではなく、
    ライブのエンドツーエンドチェックを実行します:

    1. ターゲットホスト上のデプロイ済み Gateway バージョンとコミットを確認します。
    2. ライブエージェントへの一時 ACPX ブリッジセッションを開きます。
    3. そのエージェントに、`runtime: "acp"`、`agentId: "codex"`、`mode: "run"`、タスク `Reply with exactly LIVE-ACP-SPAWN-OK` で `sessions_spawn` を呼び出すよう依頼します。
    4. `accepted=yes`、実際の `childSessionKey`、バリデーターエラーがないことを確認します。
    5. 一時ブリッジセッションをクリーンアップします。

    ゲートは `mode: "run"` のままにし、`streamTo: "parent"` はスキップします。
    スレッドにバインドされた `mode: "session"` とストリームリレー経路は、別の
    より詳細な統合パスです。

  </Accordion>
</AccordionGroup>

## サンドボックス互換性

ACP セッションは現在、OpenClaw サンドボックス内では**なく**、
ホストランタイム上で実行されます。

<Warning>
**セキュリティ境界:**

- 外部ハーネスは、それ自体の CLI 権限と選択された `cwd` に従って読み書きできます。
- OpenClaw のサンドボックスポリシーは ACP ハーネス実行をラップ**しません**。
- OpenClaw は引き続き ACP 機能ゲート、許可されたエージェント、セッション所有権、チャネルバインディング、Gateway 配信ポリシーを適用します。
- サンドボックスで強制される OpenClaw ネイティブ作業には `runtime: "subagent"` を使用してください。

</Warning>

現在の制限:

- リクエスターセッションがサンドボックス化されている場合、`sessions_spawn({ runtime: "acp" })` と `/acp spawn` の両方で ACP spawn はブロックされます。
- `runtime: "acp"` を指定した `sessions_spawn` は `sandbox: "require"` をサポートしていません。

## セッションターゲット解決

ほとんどの `/acp` アクションは、任意のセッションターゲット（`session-key`、
`session-id`、または `session-label`）を受け付けます。

**解決順序:**

1. 明示的なターゲット引数（または `/acp steer` の `--session`）
   - キーを試します
   - 次に UUID 形式のセッション ID
   - 次にラベル
2. 現在のスレッドバインディング（この会話/スレッドが ACP セッションにバインドされている場合）。
3. 現在のリクエスターセッションへのフォールバック。

現在の会話バインディングとスレッドバインディングは、どちらも
ステップ 2 に参加します。

ターゲットを解決できない場合、OpenClaw は明確なエラーを返します
（`Unable to resolve session target: ...`）。

## ACP コントロール

| コマンド             | 実行内容                                                  | 例                                                            |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP セッションを作成します。任意で現在のバインドまたはスレッドバインドを行います。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ターゲットセッションの進行中のターンをキャンセルします。  | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 実行中のセッションに操舵指示を送信します。                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | セッションを閉じ、スレッドターゲットのバインドを解除します。 | `/acp close`                                                  |
| `/acp status`        | バックエンド、モード、状態、ランタイムオプション、機能を表示します。 | `/acp status`                                                 |
| `/acp set-mode`      | ターゲットセッションのランタイムモードを設定します。      | `/acp set-mode plan`                                          |
| `/acp set`           | 汎用ランタイム設定オプションを書き込みます。              | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ランタイム作業ディレクトリのオーバーライドを設定します。  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 承認ポリシープロファイルを設定します。                    | `/acp permissions strict`                                     |
| `/acp timeout`       | ランタイムタイムアウト（秒）を設定します。                | `/acp timeout 120`                                            |
| `/acp model`         | ランタイムモデルのオーバーライドを設定します。            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | セッションランタイムオプションのオーバーライドを削除します。 | `/acp reset-options`                                          |
| `/acp sessions`      | ストアから最近の ACP セッションを一覧表示します。         | `/acp sessions`                                               |
| `/acp doctor`        | バックエンドの健全性、機能、実行可能な修正を表示します。  | `/acp doctor`                                                 |
| `/acp install`       | 決定的なインストール手順と有効化手順を出力します。        | `/acp install`                                                |

`/acp status` は有効なランタイムオプションに加え、ランタイムレベルと
バックエンドレベルのセッション識別子を表示します。バックエンドに機能がない場合、
サポートされていないコントロールのエラーが明確に表示されます。`/acp sessions` は、
現在バインドされているセッションまたはリクエスターセッションのストアを読み取ります。ターゲットトークン
（`session-key`、`session-id`、または `session-label`）は、
カスタムのエージェントごとの `session.store` ルートを含む
Gateway セッション探索を通じて解決されます。

### ランタイムオプションのマッピング

`/acp` には便利なコマンドと汎用セッターがあります。同等の
操作:

| コマンド                     | マッピング先                         | 注記                                                                                                                                                                           |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | ランタイム設定キー `model`           | Codex ACP では、OpenClaw は `openai-codex/<model>` をアダプターモデル ID に正規化し、`openai-codex/gpt-5.4/high` のようなスラッシュ付き reasoning サフィックスを `reasoning_effort` にマッピングします。 |
| `/acp set thinking <level>`  | ランタイム設定キー `thinking`        | Codex ACP では、OpenClaw はアダプターが対応している場合に対応する `reasoning_effort` を送信します。                                                                             |
| `/acp permissions <profile>` | ランタイム設定キー `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | ランタイム設定キー `timeout`         | -                                                                                                                                                                              |
| `/acp cwd <path>`            | ランタイム cwd オーバーライド        | 直接更新します。                                                                                                                                                               |
| `/acp set <key> <value>`     | 汎用                                 | `key=cwd` は cwd オーバーライドパスを使用します。                                                                                                                              |
| `/acp reset-options`         | すべてのランタイムオーバーライドをクリア | -                                                                                                                                                                              |

## acpx ハーネス、Plugin セットアップ、権限

acpx ハーネス設定（Claude Code / Codex / Gemini CLI
エイリアス）、plugin-tools と OpenClaw-tools MCP ブリッジ、ACP
権限モードについては、
[ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup) を参照してください。

## トラブルシューティング

| 症状                                                                        | 考えられる原因                                                                                                         | 修正方法                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | バックエンドPluginがない、無効化されている、または `plugins.allow` によってブロックされている。                        | バックエンドPluginをインストールして有効化し、その許可リストが設定されている場合は `plugins.allow` に `acpx` を含めてから、`/acp doctor` を実行する。                   |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACPがグローバルに無効化されている。                                                                                    | `acp.enabled=true` を設定する。                                                                                                                                          |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 通常のスレッドメッセージからの自動ディスパッチが無効化されている。                                                     | 自動スレッドルーティングを再開するには `acp.dispatch.enabled=true` を設定する。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き動作する。                |
| `ACP agent "<id>" is not allowed by policy`                                 | エージェントが許可リストに含まれていない。                                                                             | 許可された `agentId` を使用するか、`acp.allowedAgents` を更新する。                                                                                                      |
| 起動直後に `/acp doctor` がバックエンド未準備を報告する                    | バックエンドPluginがない、無効化されている、許可/拒否ポリシーでブロックされている、または設定済みの実行ファイルが利用できない。 | バックエンドPluginをインストール/有効化し、`/acp doctor` を再実行する。正常にならない場合は、バックエンドのインストールまたはポリシーエラーを調べる。                  |
| ハーネスコマンドが見つからない                                             | アダプターCLIがインストールされていない、外部Pluginがない、または非Codexアダプターの初回 `npx` 取得に失敗した。        | `/acp doctor` を実行し、Gatewayホストでアダプターをインストール/事前ウォームするか、acpxエージェントコマンドを明示的に設定する。                                       |
| ハーネスからモデル未検出エラーが返る                                       | モデルIDは別のプロバイダー/ハーネスでは有効だが、このACPターゲットでは有効ではない。                                  | そのハーネスが一覧表示するモデルを使用する、ハーネスでモデルを設定する、または上書きを省略する。                                                                       |
| ハーネスからベンダー認証エラーが返る                                       | OpenClawは正常だが、ターゲットCLI/プロバイダーにログインしていない。                                                   | Gatewayホスト環境でログインするか、必要なプロバイダーキーを指定する。                                                                                                   |
| `Unable to resolve session target: ...`                                     | キー/ID/ラベルトークンが不正。                                                                                        | `/acp sessions` を実行し、正確なキー/ラベルをコピーして再試行する。                                                                                                     |
| `--bind here requires running /acp spawn inside an active ... conversation` | アクティブなバインド可能会話なしで `--bind here` が使用された。                                                        | ターゲットのチャット/チャンネルに移動して再試行するか、未バインドのspawnを使用する。                                                                                    |
| `Conversation bindings are unavailable for <channel>.`                      | アダプターに現在の会話へのACPバインディング機能がない。                                                                | サポートされている場合は `/acp spawn ... --thread ...` を使用し、トップレベルの `bindings[]` を設定するか、対応チャンネルへ移動する。                                  |
| `--thread here requires running /acp spawn inside an active ... thread`     | スレッドコンテキスト外で `--thread here` が使用された。                                                                | ターゲットスレッドへ移動するか、`--thread auto`/`off` を使用する。                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 別のユーザーがアクティブなバインディングターゲットを所有している。                                                     | 所有者として再バインドするか、別の会話またはスレッドを使用する。                                                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | アダプターにスレッドバインディング機能がない。                                                                         | `--thread off` を使用するか、対応アダプター/チャンネルへ移動する。                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACPランタイムはホスト側であり、リクエスターセッションはサンドボックス化されている。                                    | サンドボックス化されたセッションからは `runtime="subagent"` を使用するか、非サンドボックス化セッションからACP spawnを実行する。                                        |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACPランタイムに `sandbox="require"` が要求された。                                                                      | 必須のサンドボックス化には `runtime="subagent"` を使用するか、非サンドボックス化セッションから `sandbox="inherit"` でACPを使用する。                                    |
| `Cannot apply --model ... did not advertise model support`                  | ターゲットハーネスが汎用ACPモデル切り替えを公開していない。                                                            | ACP `models`/`session/set_model` を通知するハーネスを使用する、Codex ACPモデル参照を使用する、または独自の起動フラグがある場合はハーネス内でモデルを直接設定する。       |
| バインド済みセッションのACPメタデータがない                                | 古い、または削除されたACPセッションメタデータ。                                                                        | `/acp spawn` で再作成してから、スレッドを再バインド/フォーカスする。                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` が非インタラクティブACPセッションで書き込み/実行をブロックしている。                                  | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定し、Gatewayを再起動する。[権限設定](/ja-JP/tools/acp-agents-setup#permission-configuration)を参照。        |
| ACPセッションが少ない出力で早期に失敗する                                  | 権限プロンプトが `permissionMode`/`nonInteractivePermissions` によってブロックされている。                             | `AcpRuntimeError` がないかGatewayログを確認する。完全な権限には `permissionMode=approve-all` を設定し、正常な縮退には `nonInteractivePermissions=deny` を設定する。      |
| ACPセッションが作業完了後に無期限で停止する                                | ハーネスプロセスは終了したが、ACPセッションが完了を報告しなかった。                                                    | OpenClawを更新する。現在のacpxクリーンアップは、OpenClawが所有する古いラッパーおよびアダプタープロセスを、クローズ時とGateway起動時に回収する。                       |
| ハーネスが `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` を見る                  | 内部イベントエンベロープがACP境界を越えて漏れた。                                                                     | OpenClawを更新し、完了フローを再実行する。外部ハーネスはプレーンな完了プロンプトのみを受け取る必要がある。                                                            |

## 関連

- [ACPエージェント - セットアップ](/ja-JP/tools/acp-agents-setup)
- [エージェント送信](/ja-JP/tools/agent-send)
- [CLIバックエンド](/ja-JP/gateway/cli-backends)
- [Codexハーネス](/ja-JP/plugins/codex-harness)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（ブリッジモード）](/ja-JP/cli/acp)
- [サブエージェント](/ja-JP/tools/subagents)
