---
read_when:
    - ACP を通じてコーディングハーネスを実行する
    - メッセージングチャネルで会話に紐づく ACP セッションを設定する
    - メッセージチャネルの会話を永続的な ACP セッションに紐付ける
    - ACP バックエンド、Plugin の接続、または完了配信のトラブルシューティング
    - チャットから `/acp` コマンドを操作する
sidebarTitle: ACP agents
summary: ACP バックエンドを通じて外部コーディングハーネス（Claude Code、Cursor、Gemini CLI、明示的な Codex ACP、OpenClaw ACP、OpenCode）を実行する
title: ACP エージェント
x-i18n:
    generated_at: "2026-04-26T11:40:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3b8550be4cf0da2593b0770e302833e1722820d3c922e5508a253685cd0cb6b
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) セッションを使用すると、OpenClaw は ACP バックエンド Plugin を通じて外部コーディングハーネス（たとえば Pi、Claude Code、Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI、およびその他のサポート対象 ACPX ハーネス）を実行できます。

各 ACP セッションの起動は、[バックグラウンドタスク](/ja-JP/automation/tasks) として追跡されます。

<Note>
**ACP は外部ハーネス用の経路であり、デフォルトの Codex 経路ではありません。**
ネイティブの Codex app-server Plugin は `/codex ...` の制御と
`agentRuntime.id: "codex"` の埋め込みランタイムを管理し、ACP は
`/acp ...` の制御と `sessions_spawn({ runtime: "acp" })` セッションを管理します。

Codex または Claude Code を外部 MCP クライアントとして既存の OpenClaw チャネル会話に直接接続したい場合は、
ACP ではなく [`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。
</Note>

## どのページを使えばよいですか？

| したいこと… | 使用するもの | 注記 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 現在の会話で Codex を紐付けまたは制御する | `/codex bind`, `/codex threads` | `codex` Plugin が有効な場合のネイティブ Codex app-server 経路です。紐付けられたチャット返信、画像転送、model/fast/permissions、stop、および steer 制御を含みます。ACP は明示的なフォールバックです |
| Claude Code、Gemini CLI、明示的な Codex ACP、または別の外部ハーネスを OpenClaw を介して実行する | このページ | チャットに紐付いたセッション、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、バックグラウンドタスク、ランタイム制御 |
| OpenClaw Gateway セッションをエディターまたはクライアント向けの ACP サーバーとして公開する | [`openclaw acp`](/ja-JP/cli/acp) | ブリッジモードです。IDE/クライアントは stdio/WebSocket 経由で OpenClaw と ACP で通信します |
| ローカル AI CLI をテキスト専用のフォールバック model として再利用する | [CLI バックエンド](/ja-JP/gateway/cli-backends) | ACP ではありません。OpenClaw tools、ACP 制御、ハーネスランタイムはありません |

## これはそのまま使えますか？

通常は使えます。新規インストールでは、バンドルされた `acpx` ランタイム Plugin がデフォルトで有効になっており、Plugin ローカルに固定された `acpx` バイナリを OpenClaw が検出し、起動時に自己修復します。準備状況を確認するには `/acp doctor` を実行してください。

OpenClaw は、ACP の起動が**実際に利用可能**な場合にのみ、エージェントに ACP 起動について教えます。ACP が有効であり、ディスパッチが無効化されておらず、現在のセッションがサンドボックスによってブロックされておらず、ランタイムバックエンドが読み込まれている必要があります。これらの条件が満たされていない場合、ACP Plugin の Skills と `sessions_spawn` の ACP ガイダンスは非表示のままになり、利用できないバックエンドをエージェントが提案しないようになります。

<AccordionGroup>
  <Accordion title="初回実行時の注意点">
    - `plugins.allow` が設定されている場合、それは制限的な Plugin インベントリであり、**必ず** `acpx` を含める必要があります。含まれていない場合、バンドルされたデフォルトは意図的にブロックされ、`/acp doctor` は不足している allowlist エントリを報告します。
    - 対象ハーネスアダプター（Codex、Claude など）は、初回使用時に `npx` でオンデマンド取得されることがあります。
    - そのハーネス用のベンダー認証は、引き続きホスト上に存在している必要があります。
    - ホストに npm またはネットワークアクセスがない場合、キャッシュが事前に温められるか、別の方法でアダプターがインストールされるまで、初回のアダプター取得は失敗します。
  </Accordion>
  <Accordion title="ランタイムの前提条件">
    ACP は実際の外部ハーネスプロセスを起動します。OpenClaw はルーティング、
    バックグラウンドタスクの状態、配信、紐付け、およびポリシーを管理し、ハーネスは
    そのプロバイダーログイン、model カタログ、ファイルシステム動作、および
    ネイティブ tools を管理します。

    OpenClaw を疑う前に、次を確認してください:

    - `/acp doctor` が有効で正常なバックエンドを報告していること。
    - allowlist が設定されている場合、対象 id が `acp.allowedAgents` によって許可されていること。
    - ハーネスコマンドが Gateway ホスト上で起動できること。
    - そのハーネス用のプロバイダー認証（`claude`、`codex`、`gemini`、`opencode`、`droid` など）が存在すること。
    - 選択した model がそのハーネスに存在すること — model id はハーネス間で互換性がありません。
    - 要求された `cwd` が存在し、アクセス可能であること。あるいは `cwd` を省略し、バックエンドにデフォルトを使わせること。
    - 権限モードが作業内容に一致していること。非対話型セッションではネイティブ権限プロンプトをクリックできないため、書き込み/実行が多いコーディング実行では通常、ヘッドレスで進行できる ACPX 権限プロファイルが必要です。

  </Accordion>
</AccordionGroup>

OpenClaw Plugin tools と OpenClaw 組み込み tools は、デフォルトでは
ACP ハーネスに公開されません。ハーネスがそれらの tools を直接呼び出す必要がある場合にのみ、
[ACP エージェント — セットアップ](/ja-JP/tools/acp-agents-setup) の明示的な MCP ブリッジを有効にしてください。

## サポートされるハーネス対象

バンドルされた `acpx` バックエンドでは、これらのハーネス id を `/acp spawn <id>`
または `sessions_spawn({ runtime: "acp", agentId: "<id>" })` の対象として使用します:

| Harness id | 一般的なバックエンド | 注記 |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP アダプター                        | ホスト上に Claude Code 認証が必要です。 |
| `codex`    | Codex ACP アダプター                              | ネイティブ `/codex` が利用できない場合、または ACP が要求された場合のみの明示的 ACP フォールバックです。 |
| `copilot`  | GitHub Copilot ACP アダプター                     | Copilot CLI/ランタイム認証が必要です。 |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | ローカルインストールが別の ACP エントリーポイントを公開している場合は acpx コマンドを上書きしてください。 |
| `droid`    | Factory Droid CLI                              | ハーネス環境に Factory/Droid 認証または `FACTORY_API_KEY` が必要です。 |
| `gemini`   | Gemini CLI ACP アダプター                         | Gemini CLI 認証または API キー設定が必要です。 |
| `iflow`    | iFlow CLI                                      | アダプターの可用性と model 制御はインストールされた CLI に依存します。 |
| `kilocode` | Kilo Code CLI                                  | アダプターの可用性と model 制御はインストールされた CLI に依存します。 |
| `kimi`     | Kimi/Moonshot CLI                              | ホスト上に Kimi/Moonshot 認証が必要です。 |
| `kiro`     | Kiro CLI                                       | アダプターの可用性と model 制御はインストールされた CLI に依存します。 |
| `opencode` | OpenCode ACP アダプター                           | OpenCode CLI/プロバイダー認証が必要です。 |
| `openclaw` | `openclaw acp` を介した OpenClaw Gateway ブリッジ | ACP 対応ハーネスが OpenClaw Gateway セッションに対して通信できるようにします。 |
| `pi`       | Pi/埋め込み OpenClaw ランタイム                   | OpenClaw ネイティブのハーネス実験に使用されます。 |
| `qwen`     | Qwen Code / Qwen CLI                           | ホスト上に Qwen 互換認証が必要です。 |

カスタム acpx エージェントエイリアスは acpx 自体で設定できますが、OpenClaw
ポリシーは引き続き `acp.allowedAgents` と
`agents.list[].runtime.acp.agent` のマッピングをディスパッチ前に確認します。

## オペレーター向けランブック

チャットからの簡単な `/acp` フロー:

<Steps>
  <Step title="起動">
    `/acp spawn claude --bind here`、
    `/acp spawn gemini --mode persistent --thread auto`、または明示的な
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="作業">
    紐付けられた会話またはスレッドで続けます（または
    セッションキーを明示的に指定します）。
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
    `/acp cancel`（現在のターン）または `/acp close`（セッション + 紐付け）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="ライフサイクルの詳細">
    - 起動により ACP ランタイムセッションが作成または再開され、OpenClaw セッションストアに ACP メタデータが記録され、実行が親所有である場合はバックグラウンドタスクが作成されることがあります。
    - 紐付けられた後続メッセージは、紐付けが閉じられる、フォーカス解除される、リセットされる、または期限切れになるまで、ACP セッションに直接送られます。
    - Gateway コマンドはローカルに留まります。`/acp ...`、`/status`、および `/unfocus` は、紐付けられた ACP ハーネスに通常のプロンプトテキストとして送信されることはありません。
    - `cancel` は、バックエンドがキャンセルをサポートしている場合にアクティブなターンを中断します。紐付けやセッションメタデータは削除しません。
    - `close` は OpenClaw の観点で ACP セッションを終了し、紐付けを削除します。ハーネスが再開をサポートしている場合は、それ自体の上流履歴を保持することがあります。
    - アイドル状態のランタイムワーカーは `acp.runtime.ttlMinutes` の後にクリーンアップ対象になります。保存されたセッションメタデータは `/acp sessions` で引き続き利用できます。
  </Accordion>
  <Accordion title="ネイティブ Codex ルーティングルール">
    有効な場合に **ネイティブ Codex Plugin** にルーティングされるべき自然言語トリガー:

    - 「この Discord チャネルを Codex に紐付けて。」
    - 「このチャットを Codex スレッド `<id>` に接続して。」
    - 「Codex スレッドを表示してから、このスレッドを紐付けて。」

    ネイティブ Codex の会話紐付けは、デフォルトのチャット制御経路です。
    OpenClaw の動的 tools は引き続き OpenClaw を通じて実行され、
    shell/apply-patch などの Codex ネイティブ tools は Codex 内で実行されます。
    Codex ネイティブツールイベントについては、OpenClaw はターンごとのネイティブ
    フックリレーを注入し、Plugin フックが `before_tool_call` をブロックし、
    `after_tool_call` を監視し、Codex の `PermissionRequest` イベントを
    OpenClaw の承認を通してルーティングできるようにします。Codex の `Stop`
    フックは OpenClaw の `before_agent_finalize` にリレーされ、そこで Plugins は
    Codex が回答を確定する前に、もう 1 回の model パスを要求できます。リレーは
    意図的に保守的なままです。Codex ネイティブツールの引数を変更したり、
    Codex スレッドレコードを書き換えたりはしません。ACP ランタイム/セッションモデルが
    必要な場合にのみ、明示的 ACP を使用してください。埋め込み Codex
    サポート境界については、
    [Codex harness v1 サポート契約](/ja-JP/plugins/codex-harness#v1-support-contract) に記載されています。

  </Accordion>
  <Accordion title="model / provider / ランタイム選択の早見表">
    - `openai-codex/*` — PI Codex OAuth/サブスクリプション経路。
    - `openai/*` と `agentRuntime.id: "codex"` — ネイティブ Codex app-server 埋め込みランタイム。
    - `/codex ...` — ネイティブ Codex 会話制御。
    - `/acp ...` または `runtime: "acp"` — 明示的 ACP/acpx 制御。
  </Accordion>
  <Accordion title="ACP ルーティング自然言語トリガー">
    ACP ランタイムにルーティングされるべきトリガー:

    - 「これを単発の Claude Code ACP セッションとして実行して、結果を要約して。」
    - 「このタスクでは Gemini CLI をスレッドで使って、その後のやり取りも同じスレッドで続けて。」
    - 「Codex を ACP 経由でバックグラウンドスレッドで実行して。」

    OpenClaw は `runtime: "acp"` を選択し、ハーネスの `agentId` を解決し、
サポートされている場合は現在の会話またはスレッドに紐付け、
閉じるか期限切れになるまで、そのセッションに後続メッセージを
ルーティングします。Codex がこの経路に従うのは、ACP/acpx が明示されている場合、
または要求された操作でネイティブ Codex Plugin が利用できない場合のみです。

`sessions_spawn` では、`runtime: "acp"` は ACP が
有効であり、リクエスターがサンドボックス化されておらず、
ACP ランタイムバックエンドが読み込まれている場合にのみ案内されます。
対象は `codex`、
`claude`、`droid`、`gemini`、`opencode` などの ACP ハーネス id です。
通常の
OpenClaw 設定エージェント id を `agents_list` から渡してはいけません。そのエントリが
`agents.list[].runtime.type="acp"` で明示的に設定されている場合を除き、
その場合以外はデフォルトのサブエージェントランタイムを使用してください。OpenClaw エージェントが
`runtime.type="acp"` で設定されている場合、OpenClaw は
基盤となるハーネス id として `runtime.acp.agent` を使用します。

  </Accordion>
</AccordionGroup>

## ACP とサブエージェントの違い

外部ハーネスランタイムが必要な場合は ACP を使用します。`codex`
Plugin が有効な場合に Codex の会話紐付け/制御を行いたいなら、**ネイティブ Codex
app-server** を使用します。OpenClaw ネイティブの
委譲実行が必要な場合は **サブエージェント** を使用します。

| 項目 | ACP セッション | サブエージェント実行 |
| ------------- | ------------------------------------- | ---------------------------------- |
| ランタイム | ACP バックエンド Plugin（たとえば acpx） | OpenClaw ネイティブのサブエージェントランタイム |
| セッションキー | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| 主なコマンド | `/acp ...` | `/subagents ...` |
| 起動ツール | `sessions_spawn` と `runtime:"acp"` | `sessions_spawn`（デフォルトランタイム） |

あわせて [Sub-agents](/ja-JP/tools/subagents) も参照してください。

## ACP が Claude Code を実行する仕組み

ACP 経由で Claude Code を使用する場合、スタックは次のとおりです。

1. OpenClaw ACP セッション制御プレーン。
2. バンドルされた `acpx` ランタイム Plugin。
3. Claude ACP アダプター。
4. Claude 側のランタイム/セッション機構。

ACP Claude は、ACP 制御、セッション再開、
バックグラウンドタスク追跡、およびオプションの会話/スレッド紐付けを備えた
**ハーネスセッション** です。

CLI バックエンドは別のテキスト専用ローカルフォールバックランタイムです。詳しくは
[CLI バックエンド](/ja-JP/gateway/cli-backends) を参照してください。

運用担当者向けの実用的なルールは次のとおりです。

- **`/acp spawn`、紐付け可能なセッション、ランタイム制御、または永続的なハーネス作業が必要ですか？** ACP を使用してください。
- **生の CLI を通じたシンプルなローカルテキストフォールバックが必要ですか？** CLI バックエンドを使用してください。

## 紐付けられたセッション

### 考え方

- **チャットサーフェス** — 人が会話を続ける場所（Discord チャネル、Telegram トピック、iMessage チャット）。
- **ACP セッション** — OpenClaw がルーティング先とする、永続的な Codex/Claude/Gemini のランタイム状態。
- **子スレッド/トピック** — `--thread ...` の場合にのみ作成される、任意の追加メッセージングサーフェス。
- **ランタイムワークスペース** — ハーネスが実行されるファイルシステム上の場所（`cwd`、リポジトリチェックアウト、バックエンドワークスペース）。チャットサーフェスとは独立しています。

### 現在の会話への紐付け

`/acp spawn <harness> --bind here` は現在の会話を
起動した ACP セッションに固定します。子スレッドは作成されず、同じチャットサーフェスを使います。OpenClaw は
引き続きトランスポート、認証、安全性、および配信を管理します。その会話内の
後続メッセージは同じセッションにルーティングされます。`/new` と `/reset` は
その場でセッションをリセットし、`/acp close` は紐付けを削除します。

例:

```text
/codex bind                                              # ネイティブ Codex を紐付けし、今後のメッセージをここにルーティング
/codex model gpt-5.4                                     # 紐付けられたネイティブ Codex スレッドを調整
/codex stop                                              # アクティブなネイティブ Codex ターンを制御
/acp spawn codex --bind here                             # Codex 用の明示的 ACP フォールバック
/acp spawn codex --thread auto                           # 子スレッド/トピックを作成してそこに紐付ける場合があります
/acp spawn codex --bind here --cwd /workspace/repo       # 同じチャットに紐付けたまま、Codex は /workspace/repo で実行
```

<AccordionGroup>
  <Accordion title="紐付けルールと排他性">
    - `--bind here` と `--thread ...` は同時に使用できません。
    - `--bind here` は現在の会話への紐付けを案内するチャネルでのみ機能します。それ以外の場合、OpenClaw は明確な未対応メッセージを返します。紐付けは gateway の再起動後も維持されます。
    - Discord では、OpenClaw が `--thread auto|here` のために子スレッドを作成する必要がある場合にのみ `spawnAcpSessions` が必要で、`--bind here` には不要です。
    - 明示的な `--cwd` なしで別の ACP エージェントに起動する場合、OpenClaw はデフォルトで**対象エージェントの**ワークスペースを継承します。継承したパスが見つからない場合（`ENOENT`/`ENOTDIR`）はバックエンドのデフォルトにフォールバックし、その他のアクセスエラー（例: `EACCES`）は起動エラーとして表面化します。
    - Gateway 管理コマンドは、紐付けられた会話でもローカルに留まります。通常の後続テキストが紐付けられた ACP セッションにルーティングされる場合でも、`/acp ...` コマンドは OpenClaw が処理します。`/status` と `/unfocus` も、そのサーフェスでコマンド処理が有効である限りローカルに留まります。
  </Accordion>
  <Accordion title="スレッドに紐付けられたセッション">
    チャネルアダプターでスレッド紐付けが有効な場合:

    - OpenClaw はスレッドを対象 ACP セッションに紐付けます。
    - そのスレッド内の後続メッセージは、紐付けられた ACP セッションにルーティングされます。
    - ACP の出力は同じスレッドに返されます。
    - フォーカス解除/クローズ/アーカイブ/アイドルタイムアウト、または最大経過時間の期限切れで紐付けは削除されます。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status`、および `/unfocus` は Gateway コマンドであり、ACP ハーネスへのプロンプトではありません。

    スレッドに紐付けられた ACP に必要な機能フラグ:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` はデフォルトでオンです（ACP ディスパッチを一時停止するには `false` を設定）。
    - チャネルアダプターの ACP スレッド起動フラグが有効（アダプター固有）:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    スレッド紐付けのサポートはアダプター固有です。アクティブなチャネル
    アダプターがスレッド紐付けをサポートしていない場合、OpenClaw は明確な
    未対応/利用不可メッセージを返します。

  </Accordion>
  <Accordion title="スレッドをサポートするチャネル">
    - セッション/スレッド紐付け機能を公開する任意のチャネルアダプター。
    - 現在の組み込みサポート: **Discord** スレッド/チャネル、**Telegram** トピック（グループ/スーパーグループのフォーラムトピックおよび DM トピック）。
    - Plugin チャネルは同じ紐付けインターフェースを通じてサポートを追加できます。
  </Accordion>
</AccordionGroup>

## 永続的なチャネル紐付け

一時的ではないワークフローでは、
トップレベルの `bindings[]` エントリで永続的な ACP 紐付けを設定します。

### 紐付けモデル

<ParamField path="bindings[].type" type='"acp"'>
  永続的な ACP 会話紐付けであることを示します。
</ParamField>
<ParamField path="bindings[].match" type="object">
  対象の会話を識別します。チャネルごとの形式:

- **Discord チャネル/スレッド:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram フォーラムトピック:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/グループ:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。安定したグループ紐付けには `chat_id:*` または `chat_identifier:*` を推奨します。
- **iMessage DM/グループ:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。安定したグループ紐付けには `chat_id:*` を推奨します。
</ParamField>
  <ParamField path="bindings[].agentId" type="string">
  所有する OpenClaw エージェント id。
  </ParamField>
  <ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  任意の ACP 上書きです。
  </ParamField>
  <ParamField path="bindings[].acp.label" type="string">
  任意のオペレーター向けラベルです。
  </ParamField>
  <ParamField path="bindings[].acp.cwd" type="string">
  任意のランタイム作業ディレクトリです。
  </ParamField>
  <ParamField path="bindings[].acp.backend" type="string">
  任意のバックエンド上書きです。
  </ParamField>

### エージェントごとのランタイムデフォルト

エージェントごとに一度だけ ACP デフォルトを定義するには `agents.list[].runtime` を使用します:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（ハーネス id。例: `codex` または `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP 紐付けセッションの上書き優先順位:**

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
- そのチャネルまたはトピック内のメッセージは、設定された ACP セッションにルーティングされます。
- 紐付けられた会話では、`/new` と `/reset` は同じ ACP セッションキーをその場でリセットします。
- 一時的なランタイム紐付け（たとえばスレッドフォーカスフローで作成されたもの）は、存在する場合は引き続き適用されます。
- 明示的な `cwd` なしのエージェント間 ACP 起動では、OpenClaw は対象エージェントのワークスペースをエージェント設定から継承します。
- 継承したワークスペースパスが見つからない場合は、バックエンドのデフォルト cwd にフォールバックします。存在しないこと以外のアクセス失敗は起動エラーとして表面化します。

## ACP セッションを開始する

ACP セッションを開始する方法は 2 つあります:

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
    `runtime` のデフォルトは `subagent` なので、ACP セッションでは
    `runtime: "acp"` を明示的に設定してください。`agentId` が省略された場合、OpenClaw は
    設定されていれば `acp.defaultAgent` を使用します。`mode: "session"` には
    永続的な紐付け会話を維持するために `thread: true` が必要です。
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

    [スラッシュコマンド](/ja-JP/tools/slash-commands) も参照してください。

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
  ACP 対象のハーネス id。設定されていれば `acp.defaultAgent` にフォールバックします。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  サポートされている場合はスレッド紐付けフローを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` は単発、`"session"` は永続です。`thread: true` で
  `mode` が省略されている場合、OpenClaw はランタイム経路ごとに
  永続動作をデフォルトにすることがあります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cwd" type="string">
  要求されたランタイム作業ディレクトリ（バックエンド/ランタイム
  ポリシーによって検証されます）。省略した場合、ACP 起動は
  設定されていれば対象エージェントのワークスペースを継承します。
  継承されたパスが見つからない場合はバックエンドの
  デフォルトにフォールバックし、実際のアクセスエラーは返されます。
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
  `"parent"` は初回 ACP 実行の進捗サマリーを
  システムイベントとしてリクエスターセッションにストリーミングします。受理された応答には、
  完全なリレー履歴を追跡できるセッションスコープの JSONL ログ
  （`<sessionId>.acp-stream.jsonl`）を指す `streamLogPath` を含めることができます。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  N 秒後に ACP 子ターンを中断します。`0` の場合、そのターンは
  gateway の無制限タイムアウト経路のままになります。同じ値が Gateway
  実行と ACP ランタイムに適用されるため、停止したハーネスやクォータ枯渇したハーネスが
  親エージェントのレーンを無期限に占有しません。
</ParamField>
<ParamField path="model" type="string">
  ACP 子セッションに対する明示的な model 上書きです。Codex ACP 起動では、
  `openai-codex/gpt-5.4` のような OpenClaw Codex 参照を、`session/new` の前に
  Codex ACP 起動設定へ正規化します。`openai-codex/gpt-5.4/high` のような
  スラッシュ形式では、Codex ACP の推論努力も設定されます。
  その他のハーネスは ACP `models` を公開し、
  `session/set_model` をサポートしている必要があります。そうでない場合、
  OpenClaw/acpx は対象エージェントのデフォルトに黙ってフォールバックせず、
  明確に失敗します。
</ParamField>
<ParamField path="thinking" type="string">
  明示的な thinking/推論努力です。Codex ACP では `minimal` は
  低い努力にマッピングされ、`low`/`medium`/`high`/`xhigh` は直接マッピングされ、
  `off` は推論努力の起動時上書きを省略します。
</ParamField>

## 起動時の bind モードと thread モード

<Tabs>
  <Tab title="--bind here|off">
    | モード | 動作 |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 現在アクティブな会話をその場で紐付けます。アクティブな会話がない場合は失敗します。 |
    | `off`  | 現在の会話への紐付けを作成しません。 |

    注記:

    - `--bind here` は「このチャネルまたはチャットを Codex 対応にする」ための最も簡単なオペレーター経路です。
    - `--bind here` では子スレッドは作成されません。
    - `--bind here` は、現在の会話の紐付けサポートを公開しているチャネルでのみ利用できます。
    - `--bind` と `--thread` は同じ `/acp spawn` 呼び出しで併用できません。

  </Tab>
  <Tab title="--thread auto|here|off">
    | モード | 動作 |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | アクティブなスレッド内ではそのスレッドを紐付けます。スレッド外では、サポートされていれば子スレッドを作成して紐付けます。 |
    | `here` | 現在アクティブなスレッドが必要です。スレッド内でない場合は失敗します。 |
    | `off`  | 紐付けなし。セッションは紐付けられない状態で開始されます。 |

    注記:

    - スレッド紐付けに対応していないサーフェスでは、デフォルト動作は実質的に `off` です。
    - スレッドに紐付けられた起動にはチャネルポリシーのサポートが必要です:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - 子スレッドを作成せずに現在の会話を固定したい場合は `--bind here` を使用してください。

  </Tab>
</Tabs>

## 配信モデル

ACP セッションは、対話型ワークスペースにも、親所有の
バックグラウンド作業にもなり得ます。配信経路はその形状に依存します。

<AccordionGroup>
  <Accordion title="対話型 ACP セッション">
    対話型セッションは、見えるチャット
    サーフェス上で会話を続けるためのものです:

    - `/acp spawn ... --bind here` は現在の会話を ACP セッションに紐付けます。
    - `/acp spawn ... --thread ...` はチャネルスレッド/トピックを ACP セッションに紐付けます。
    - 永続的に設定された `bindings[].type="acp"` は、一致する会話を同じ ACP セッションにルーティングします。

    紐付けられた会話の後続メッセージは直接
    ACP セッションにルーティングされ、ACP の出力は同じ
    チャネル/スレッド/トピックに返されます。

    OpenClaw がハーネスに送信するもの:

    - 通常の紐付け済み後続メッセージは、ハーネス/バックエンドがサポートする場合にのみ添付ファイルとともに、プロンプトテキストとして送信されます。
    - `/acp` 管理コマンドとローカル Gateway コマンドは ACP ディスパッチの前に横取りされます。
    - ランタイム生成の完了イベントは対象ごとに具体化されます。OpenClaw エージェントは OpenClaw の内部ランタイムコンテキストエンベロープを受け取り、外部 ACP ハーネスは子結果と指示を含むプレーンなプロンプトを受け取ります。生の `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` エンベロープを外部ハーネスに送信したり、ACP のユーザートランスクリプトテキストとして保存したりしてはいけません。
    - ACP トランスクリプトエントリは、ユーザーに見えるトリガーテキストまたはプレーンな完了プロンプトを使用します。内部イベントメタデータは可能な限り OpenClaw 内で構造化されたまま保持され、ユーザー作成のチャットコンテンツとして扱われません。

  </Accordion>
  <Accordion title="親所有の単発 ACP セッション">
    別のエージェント実行によって起動される単発 ACP セッションは、
    サブエージェントに似たバックグラウンド子です:

    - 親は `sessions_spawn({ runtime: "acp", mode: "run" })` で作業を要求します。
    - 子は自身の ACP ハーネスセッションで実行されます。
    - 子ターンはネイティブのサブエージェント起動と同じバックグラウンドレーンで実行されるため、遅い ACP ハーネスが無関係なメインセッション作業を妨げません。
    - 完了はタスク完了通知経路を通じて報告されます。OpenClaw は内部完了メタデータを、外部ハーネスに送信する前にプレーンな ACP プロンプトへ変換するため、ハーネスは OpenClaw 専用のランタイムコンテキストマーカーを目にしません。
    - 親は、ユーザー向け返信が有用な場合、子の結果を通常の assistant 音声で書き換えます。

    この経路を親と子のピアツーピアチャットとして
    扱ってはいけません。子にはすでに親へ戻る完了チャネルがあります。

  </Accordion>
  <Accordion title="sessions_send と A2A 配信">
    `sessions_send` は起動後に別のセッションを対象にできます。通常の
    ピアセッションでは、OpenClaw はメッセージ注入後に
    エージェント間（A2A）後続経路を使用します:

    - 対象セッションの返信を待つ。
    - 必要に応じて、リクエスターと対象が制限付きの回数だけ後続ターンをやり取りできるようにする。
    - 対象に通知メッセージの生成を依頼する。
    - その通知を可視チャネルまたはスレッドに配信する。

    この A2A 経路は、送信者が目に見える
    後続応答を必要とするピア送信のフォールバックです。たとえば広い
    `tools.sessions.visibility` 設定の下で、無関係なセッションが
    ACP 対象を見てメッセージできる場合でも、この経路は有効のままです。

    OpenClaw が A2A 後続処理をスキップするのは、
    リクエスターが自身の親所有の単発 ACP 子の親である場合だけです。その場合、
    タスク完了の上に A2A を重ねて実行すると、親が子の結果で起こされ、
    親の返信が子へ送り返され、
    親子のエコーループが発生する可能性があります。`sessions_send` の結果は、
    完了経路がすでに結果を担当しているため、その所有子ケースでは
    `delivery.status="skipped"` を報告します。

  </Accordion>
  <Accordion title="既存セッションを再開する">
    新しく開始する代わりに以前の ACP セッションを続行するには、
    `resumeSessionId` を使用します。エージェントは
    `session/load` を通じて会話履歴を再生するため、
    それまでの完全なコンテキストを保ったまま再開できます。

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    よくある使用例:

    - Codex セッションをノート PC からスマートフォンへ引き継ぐ — エージェントに中断したところから再開するよう伝えます。
    - CLI で対話的に開始したコーディングセッションを、今度はエージェント経由でヘッドレスに続行する。
    - gateway の再起動やアイドルタイムアウトで中断された作業を再開する。

    注記:

    - `resumeSessionId` には `runtime: "acp"` が必要です — サブエージェントランタイムで使用するとエラーになります。
    - `resumeSessionId` は上流の ACP 会話履歴を復元します。`thread` と `mode` は作成中の新しい OpenClaw セッションにも通常どおり適用されるため、`mode: "session"` には引き続き `thread: true` が必要です。
    - 対象エージェントは `session/load` をサポートしている必要があります（Codex と Claude Code はサポートしています）。
    - セッション id が見つからない場合、起動は明確なエラーで失敗します — 新しいセッションへの暗黙のフォールバックはありません。

  </Accordion>
  <Accordion title="デプロイ後スモークテスト">
    gateway のデプロイ後は、ユニットテストを信頼するのではなく、
    ライブのエンドツーエンド確認を実行してください:

    1. 対象ホスト上のデプロイ済み gateway バージョンとコミットを確認する。
    2. ライブエージェントへの一時的な ACPX ブリッジセッションを開く。
    3. そのエージェントに、`runtime: "acp"`、`agentId: "codex"`、`mode: "run"`、タスク `Reply with exactly LIVE-ACP-SPAWN-OK` で `sessions_spawn` を呼び出すよう依頼する。
    4. `accepted=yes`、実在する `childSessionKey`、およびバリデーターエラーがないことを確認する。
    5. 一時的なブリッジセッションをクリーンアップする。

    ゲートは `mode: "run"` のままにし、`streamTo: "parent"` はスキップしてください —
    スレッドに紐付いた `mode: "session"` と stream リレー経路は、
    別のより高度な統合パスです。

  </Accordion>
</AccordionGroup>

## サンドボックス互換性

ACP セッションは現在、OpenClaw サンドボックス内ではなく、
ホストランタイム上で実行されます。

<Warning>
**セキュリティ境界:**

- 外部ハーネスは、自身の CLI 権限と選択された `cwd` に従って読み書きできます。
- OpenClaw のサンドボックスポリシーは ACP ハーネス実行を**ラップしません**。
- それでも OpenClaw は、ACP 機能ゲート、許可されたエージェント、セッション所有権、チャネル紐付け、および Gateway 配信ポリシーを強制します。
- サンドボックスが強制される OpenClaw ネイティブ作業には `runtime: "subagent"` を使用してください。
</Warning>

現在の制限:

- リクエスターセッションがサンドボックス化されている場合、ACP 起動は `sessions_spawn({ runtime: "acp" })` と `/acp spawn` の両方でブロックされます。
- `runtime: "acp"` の `sessions_spawn` は `sandbox: "require"` をサポートしません。

## セッション対象の解決

ほとんどの `/acp` アクションは、任意のセッション対象（`session-key`、
`session-id`、または `session-label`）を受け付けます。

**解決順序:**

1. 明示的な対象引数（または `/acp steer` の `--session`）
   - まずキーを試す
   - 次に UUID 形式の session id
   - 次にラベル
2. 現在のスレッド紐付け（この会話/スレッドが ACP セッションに紐付けられている場合）。
3. 現在のリクエスターセッションへのフォールバック。

現在の会話への紐付けとスレッド紐付けはどちらも
手順 2 に参加します。

対象が解決できない場合、OpenClaw は明確なエラー
（`Unable to resolve session target: ...`）を返します。

## ACP 制御

| コマンド | すること | 例 |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP セッションを作成します。現在の会話への紐付けまたはスレッド紐付けは任意です。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 対象セッションの進行中ターンをキャンセルします。 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 実行中セッションに steer 指示を送信します。 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | セッションを閉じてスレッド対象の紐付けを解除します。 | `/acp close`                                                  |
| `/acp status`        | バックエンド、モード、状態、ランタイムオプション、機能を表示します。 | `/acp status`                                                 |
| `/acp set-mode`      | 対象セッションのランタイムモードを設定します。 | `/acp set-mode plan`                                          |
| `/acp set`           | 汎用ランタイム設定オプションを書き込みます。 | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ランタイム作業ディレクトリの上書きを設定します。 | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 承認ポリシープロファイルを設定します。 | `/acp permissions strict`                                     |
| `/acp timeout`       | ランタイムタイムアウト（秒）を設定します。 | `/acp timeout 120`                                            |
| `/acp model`         | ランタイム model 上書きを設定します。 | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | セッションのランタイムオプション上書きを削除します。 | `/acp reset-options`                                          |
| `/acp sessions`      | ストアから最近の ACP セッションを一覧表示します。 | `/acp sessions`                                               |
| `/acp doctor`        | バックエンドの健全性、機能、実行可能な修正を表示します。 | `/acp doctor`                                                 |
| `/acp install`       | 決定的なインストール手順と有効化手順を表示します。 | `/acp install`                                                |

`/acp status` は、有効なランタイムオプションに加えて、ランタイムレベルおよび
バックエンドレベルのセッション識別子を表示します。バックエンドに機能がない場合は、
未対応制御エラーが明確に表示されます。`/acp sessions` は、
現在紐付けられているセッションまたはリクエスターセッションについてストアを読み取ります。対象トークン
（`session-key`、`session-id`、または `session-label`）は、
カスタムのエージェントごとの `session.store`
ルートを含む gateway セッション検出を通じて解決されます。

### ランタイムオプションの対応

`/acp` には簡易コマンドと汎用セッターがあります。同等の
操作は次のとおりです:

| コマンド | 対応先 | 注記 |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | ランタイム設定キー `model`           | Codex ACP では、OpenClaw は `openai-codex/<model>` をアダプター model id に正規化し、`openai-codex/gpt-5.4/high` のようなスラッシュ推論サフィックスを `reasoning_effort` にマッピングします。 |
| `/acp set thinking <level>`  | ランタイム設定キー `thinking`        | Codex ACP では、アダプターが対応している場合、OpenClaw は対応する `reasoning_effort` を送信します。 |
| `/acp permissions <profile>` | ランタイム設定キー `approval_policy` | — |
| `/acp timeout <seconds>`     | ランタイム設定キー `timeout`         | — |
| `/acp cwd <path>`            | ランタイム `cwd` 上書き              | 直接更新です。 |
| `/acp set <key> <value>`     | 汎用                              | `key=cwd` は cwd 上書きパスを使用します。 |
| `/acp reset-options`         | すべてのランタイム上書きをクリアします | — |

## acpx ハーネス、Plugin セットアップ、権限

acpx ハーネス設定（Claude Code / Codex / Gemini CLI
エイリアス）、plugin-tools と OpenClaw-tools の MCP ブリッジ、および ACP
権限モードについては、
[ACP エージェント — セットアップ](/ja-JP/tools/acp-agents-setup) を参照してください。

## トラブルシューティング

| 症状 | 可能性の高い原因 | 修正方法 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | バックエンド Plugin が存在しない、無効化されている、または `plugins.allow` によってブロックされています。 | バックエンド Plugin をインストールして有効化し、その allowlist が設定されている場合は `plugins.allow` に `acpx` を含め、その後 `/acp doctor` を実行してください。 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP がグローバルで無効化されています。 | `acp.enabled=true` を設定してください。 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 通常のスレッドメッセージからのディスパッチが無効化されています。 | `acp.dispatch.enabled=true` を設定してください。 |
| `ACP agent "<id>" is not allowed by policy`                                 | エージェントが allowlist に含まれていません。 | 許可されている `agentId` を使用するか、`acp.allowedAgents` を更新してください。 |
| 起動直後に `/acp doctor` がバックエンド未準備を報告する                 | Plugin の依存関係プローブまたは自己修復がまだ実行中です。 | 少し待ってから `/acp doctor` を再実行してください。それでも不健全なままなら、バックエンドのインストールエラーと Plugin の allow/deny ポリシーを確認してください。 |
| ハーネスコマンドが見つからない                                                   | アダプター CLI がインストールされていないか、初回実行時の `npx` 取得に失敗しました。 | Gateway ホスト上でアダプターをインストールまたは事前ウォームアップするか、acpx エージェントコマンドを明示的に設定してください。 |
| ハーネスから model-not-found が返る                                            | model id は別のプロバイダー/ハーネスでは有効ですが、この ACP 対象では有効ではありません。 | そのハーネスが一覧表示する model を使用するか、ハーネス内で model を設定するか、上書きを省略してください。 |
| ハーネスからベンダー認証エラーが返る                                          | OpenClaw は正常ですが、対象 CLI/プロバイダーにログインしていません。 | Gateway ホスト環境でログインするか、必要なプロバイダーキーを提供してください。 |
| `Unable to resolve session target: ...`                                     | 不正な key/id/label トークンです。 | `/acp sessions` を実行し、正確な key/label をコピーして再試行してください。 |
| `--bind here requires running /acp spawn inside an active ... conversation` | アクティブで紐付け可能な会話がない状態で `--bind here` を使用しました。 | 対象のチャット/チャネルに移動して再試行するか、紐付けなしの起動を使用してください。 |
| `Conversation bindings are unavailable for <channel>.`                      | アダプターに現在の会話への ACP 紐付け機能がありません。 | サポートされている場合は `/acp spawn ... --thread ...` を使用するか、トップレベルの `bindings[]` を設定するか、対応しているチャネルに移動してください。 |
| `--thread here requires running /acp spawn inside an active ... thread`     | スレッドコンテキスト外で `--thread here` を使用しました。 | 対象スレッドに移動するか、`--thread auto` または `off` を使用してください。 |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 別のユーザーがアクティブな紐付け対象を所有しています。 | 所有者として再紐付けするか、別の会話またはスレッドを使用してください。 |
| `Thread bindings are unavailable for <channel>.`                            | アダプターにスレッド紐付け機能がありません。 | `--thread off` を使用するか、対応しているアダプター/チャネルに移動してください。 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP ランタイムはホスト側であり、リクエスターセッションがサンドボックス化されています。 | サンドボックス化されたセッションからは `runtime="subagent"` を使用するか、サンドボックス化されていないセッションから ACP 起動を実行してください。 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP ランタイムに対して `sandbox="require"` が要求されました。 | サンドボックス必須の場合は `runtime="subagent"` を使用するか、サンドボックス化されていないセッションから `sandbox="inherit"` で ACP を使用してください。 |
| `Cannot apply --model ... did not advertise model support`                  | 対象ハーネスが汎用 ACP model 切り替えを公開していません。 | ACP `models`/`session/set_model` を公開するハーネスを使用するか、Codex ACP model 参照を使用するか、そのハーネス独自の起動フラグがある場合はハーネス内で model を直接設定してください。 |
| 紐付けられたセッションの ACP メタデータが欠落している                                      | 古いまたは削除された ACP セッションメタデータです。 | `/acp spawn` で再作成し、その後スレッドを再紐付け/再フォーカスしてください。 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` により、非対話型 ACP セッションで書き込み/実行がブロックされています。 | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定し、gateway を再起動してください。[権限設定](/ja-JP/tools/acp-agents-setup#permission-configuration) を参照してください。 |
| ACP セッションがほとんど出力せずに早期失敗する                                  | 権限プロンプトが `permissionMode`/`nonInteractivePermissions` によってブロックされています。 | `AcpRuntimeError` について gateway ログを確認してください。完全な権限が必要なら `permissionMode=approve-all` を設定し、段階的な劣化動作をさせるなら `nonInteractivePermissions=deny` を設定してください。 |
| 作業完了後も ACP セッションが無期限に停止したままになる                       | ハーネスプロセスは終了しましたが、ACP セッションが完了を報告しませんでした。 | `ps aux \| grep acpx` で監視し、古いプロセスを手動で kill してください。 |
| ハーネスに `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` が見える                        | 内部イベントエンベロープが ACP 境界を越えて漏えいしました。 | OpenClaw を更新して完了フローを再実行してください。外部ハーネスが受け取るのはプレーンな完了プロンプトのみであるべきです。 |

## 関連

- [ACP エージェント — セットアップ](/ja-JP/tools/acp-agents-setup)
- [エージェント送信](/ja-JP/tools/agent-send)
- [CLI バックエンド](/ja-JP/gateway/cli-backends)
- [Codex harness](/ja-JP/plugins/codex-harness)
- [マルチエージェントサンドボックス tools](/ja-JP/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（ブリッジモード）](/ja-JP/cli/acp)
- [Sub-agents](/ja-JP/tools/subagents)
