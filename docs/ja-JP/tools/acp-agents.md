---
read_when:
    - ACP 経由でコーディングハーネスを実行する
    - メッセージングチャネルで会話に紐づく ACP セッションを設定する
    - メッセージチャネルの会話を永続的な ACP セッションに紐付ける
    - ACP バックエンド、Plugin の接続、または完了通知のトラブルシューティング
    - チャットから /acp コマンドを操作する
sidebarTitle: ACP agents
summary: ACP バックエンドを介して外部コーディングハーネス（Claude Code、Cursor、Gemini CLI、明示的な Codex ACP、OpenClaw ACP、OpenCode）を実行する
title: ACP エージェント
x-i18n:
    generated_at: "2026-07-11T22:42:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) セッションを使用すると、
OpenClaw は ACP バックエンド Plugin を介して、外部コーディングハーネス（Claude Code、Cursor、Copilot、Droid、
OpenClaw ACP、OpenCode、Gemini CLI、およびその他の対応 ACPX ハーネス）を
実行できます。各起動は
[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

<Note>
**ACP は外部ハーネス用の経路であり、デフォルトの Codex 経路ではありません。** ネイティブの
Codex app-server Plugin は、`/codex ...` コントロールと、エージェントターンで使用するデフォルトの
`openai/gpt-*` 組み込みランタイムを所有します。一方、ACP は `/acp ...` コントロールと
` sessions_spawn({ runtime: "acp" })` セッションを所有します。

Codex または Claude Code を外部 MCP クライアントとして既存の OpenClaw チャンネル会話へ
直接接続するには、ACP ではなく
[`openclaw mcp serve`](/ja-JP/cli/mcp) を使用してください。
</Note>

## どのページを参照すればよいですか？

| 目的                                                                                             | 使用するもの                          | 注記                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 現在の会話で Codex をバインドまたは制御する                                                      | `/codex bind`、`/codex threads`       | `codex` Plugin が有効な場合のネイティブ Codex app-server 経路：バインドされたチャットへの返信、画像転送、モデル／高速モード／権限、停止、方向修正。ACP は明示的なフォールバックです |
| Claude Code、Gemini CLI、明示的な Codex ACP、または別の外部ハーネスを OpenClaw _経由で_ 実行する | このページ                            | チャットにバインドされたセッション、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、バックグラウンドタスク、ランタイム制御                                                               |
| OpenClaw Gateway セッションをエディターまたはクライアント向けの ACP サーバーとして公開する       | [`openclaw acp`](/ja-JP/cli/acp)            | ブリッジモード：IDE／クライアントが stdio／WebSocket 経由で OpenClaw と ACP 通信を行います                                                                                                    |
| ローカル AI CLI をテキスト専用のフォールバックモデルとして再利用する                            | [CLI バックエンド](/ja-JP/gateway/cli-backends) | ACP ではありません：OpenClaw ツール、ACP コントロール、ハーネスランタイムは利用できません                                                                                                    |

## そのまま利用できますか？

はい。公式 ACP ランタイム Plugin をインストールすれば利用できます。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

ソースチェックアウトでは、`pnpm install` の実行後にローカルの
`extensions/acpx` ワークスペース Plugin を使用できます。準備状況を確認するには `/acp doctor` を実行してください。

OpenClaw がエージェントに ACP 起動方法を提示するのは、ACP が**実際に使用可能**な場合だけです。
ACP が有効であり、ディスパッチが無効化されておらず、現在のセッションが
サンドボックスによってブロックされておらず、ランタイムバックエンドが読み込まれて正常である必要があります。
いずれかの条件を満たさない場合、エージェントが利用できないバックエンドを提案しないように、
ACP Skills と `sessions_spawn` の ACP ガイダンスは非表示のままになります。

<AccordionGroup>
  <Accordion title="初回実行時の注意点">
    - `plugins.allow` が設定されている場合、それは制限付きの Plugin インベントリとして機能し、**必ず** `acpx` を含める必要があります。含まれていない場合、インストール済みの ACP バックエンドは意図的にブロックされます（`/acp doctor` は許可リストの不足項目を報告します）。
    - Codex ACP アダプターは `acpx` Plugin に同梱されており、可能な場合はローカルで起動します。
    - Codex ACP は分離された `CODEX_HOME` で実行されます。OpenClaw は、信頼済みプロジェクトの信頼設定と、安全なモデル／プロバイダーのルーティング設定（`model`、`model_provider`、`model_reasoning_effort`、`sandbox_mode`、および安全な `model_providers.<name>` フィールド）をホストの Codex 設定からコピーします。認証、通知、フックはホスト設定にのみ残ります。
    - その他の対象ハーネスのアダプターは、初回使用時に必要に応じて `npx` で取得されることがあります。
    - そのハーネス用のベンダー認証が、ホスト上にあらかじめ存在している必要があります。
    - ホストで npm またはネットワークアクセスを利用できない場合、キャッシュを事前に準備するか、別の方法でアダプターをインストールするまで、初回実行時のアダプター取得は失敗します。

  </Accordion>
  <Accordion title="ランタイムの前提条件">
    ACP は実際の外部ハーネスプロセスを起動します。OpenClaw はルーティング、
    バックグラウンドタスクの状態、配信、バインディング、ポリシーを所有し、ハーネスは
    プロバイダーへのログイン、モデルカタログ、ファイルシステム動作、ネイティブツールを所有します。

    OpenClaw に原因があると判断する前に、以下を確認してください。

    - `/acp doctor` が、有効で正常なバックエンドを報告していること。
    - 許可リスト `acp.allowedAgents` が設定されている場合、対象 ID が許可されていること。
    - ハーネスコマンドを Gateway ホスト上で起動できること。
    - そのハーネス用のプロバイダー認証が存在すること（`claude`、`codex`、`gemini`、`opencode`、`droid` など）。
    - 選択したモデルがそのハーネスに存在すること。モデル ID はハーネス間で互換ではありません。
    - 要求した `cwd` が存在しアクセス可能であること。そうでなければ `cwd` を省略し、バックエンドのデフォルトを使用してください。
    - 権限モードが作業内容に適合していること。非対話型セッションではネイティブの権限プロンプトをクリックできないため、書き込みやコマンド実行を多用するコーディング処理では通常、ヘッドレスで処理を続行できる ACPX 権限プロファイルが必要です。

  </Accordion>
</AccordionGroup>

OpenClaw Plugin のツールと OpenClaw の組み込みツールは、デフォルトでは ACP
ハーネスに公開されません。ハーネスからこれらのツールを直接呼び出す必要がある場合にのみ、
[ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup)で明示的な MCP ブリッジを有効にしてください。

## 対応ハーネス対象

`acpx` バックエンドでは、以下の ID を `/acp spawn <id>` または
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` の対象として使用します。

| ハーネス ID   | 一般的なバックエンド                             | 注記                                                                                         |
| ------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `claude`      | Claude Code ACP アダプター                       | ホスト上に Claude Code の認証が必要です。                                                    |
| `codex`       | Codex ACP アダプター                             | ネイティブの `/codex` が利用できない場合、または ACP が要求された場合のみの明示的な ACP フォールバックです。 |
| `copilot`     | GitHub Copilot ACP アダプター                    | Copilot CLI／ランタイムの認証が必要です。                                                    |
| `cursor`      | Cursor CLI ACP（`cursor-agent acp`）             | ローカルインストールで別の ACP エントリーポイントが公開される場合は、acpx コマンドを上書きしてください。 |
| `droid`       | Factory Droid CLI                                | ハーネス環境に Factory／Droid の認証または `FACTORY_API_KEY` が必要です。                     |
| `fast-agent`  | fast-agent-mcp ACP アダプター                    | 必要に応じて `uvx` で取得されます。                                                          |
| `gemini`      | Gemini CLI ACP アダプター                        | Gemini CLI の認証または API キー設定が必要です。                                             |
| `iflow`       | iFlow CLI                                        | アダプターの利用可否とモデル制御は、インストール済みの CLI によって異なります。              |
| `kilocode`    | Kilo Code CLI                                    | アダプターの利用可否とモデル制御は、インストール済みの CLI によって異なります。              |
| `kimi`        | Kimi／Moonshot CLI                               | ホスト上に Kimi／Moonshot の認証が必要です。                                                 |
| `kiro`        | Kiro CLI                                         | アダプターの利用可否とモデル制御は、インストール済みの CLI によって異なります。              |
| `mux`         | Mux CLI ACP アダプター                           | 必要に応じて `npx` で取得されます。                                                          |
| `opencode`    | OpenCode ACP アダプター                          | OpenCode CLI／プロバイダーの認証が必要です。                                                 |
| `openclaw`    | `openclaw acp` を介した OpenClaw Gateway ブリッジ | ACP 対応ハーネスから OpenClaw Gateway セッションへ通信できます。                             |
| `qoder`       | Qoder CLI                                        | アダプターの利用可否とモデル制御は、インストール済みの CLI によって異なります。              |
| `qwen`        | Qwen Code／Qwen CLI                              | ホスト上に Qwen 互換の認証が必要です。                                                       |
| `trae`        | Trae CLI ACP アダプター                          | アダプターの利用可否とモデル制御は、インストール済みの CLI によって異なります。              |

`pi`（pi-acp）も acpx バックエンドに登録されていますが、上記の他のものと
同じ意味でのコーディングハーネスではありません。

カスタム acpx エージェントエイリアスは acpx 自体で設定できますが、OpenClaw の
ポリシーはディスパッチ前に引き続き `acp.allowedAgents` と
`agents.list[].runtime.acp.agent` のマッピングを確認します。

## 運用手順

チャットから行う簡単な `/acp` の流れ：

<Steps>
  <Step title="起動">
    `/acp spawn claude --bind here`、
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
    `/acp model <provider/model>`、`/acp permissions <profile>`、
    `/acp timeout <seconds>`。
  </Step>
  <Step title="方向修正">
    コンテキストを置き換えずに実行します：`/acp steer ログを厳密化して続行`。
  </Step>
  <Step title="停止">
    `/acp cancel`（現在のターン）または `/acp close`（セッションとバインディング）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="ライフサイクルの詳細">
    - 起動すると ACP ランタイムセッションが作成または再開され、ACP メタデータが OpenClaw セッションストアに記録されます。また、実行が親所有の場合はバックグラウンドタスクが作成されることがあります。
    - 親所有の ACP セッションは、ランタイムセッションが永続的な場合でもバックグラウンド処理として扱われます。完了通知とサーフェス間の配信は、通常のユーザー向けチャットセッションのように動作するのではなく、親タスクの通知機構を介して行われます。
    - タスクの保守処理は、終了済みまたは孤立した親所有の単発 ACP セッションを閉じます。永続 ACP セッションは、有効な会話バインディングが残っている間は維持されます。有効なバインディングのない古い永続セッションは、所有タスクの完了後またはタスクレコードの消失後に暗黙的に再開されないよう閉じられます。
    - バインドされた後続メッセージは、バインディングが閉じられる、フォーカスが解除される、リセットされる、または期限切れになるまで、ACP セッションへ直接送信されます。
    - Gateway コマンドはローカルに留まります。`/acp ...`、`/status`、`/unfocus` が通常のプロンプトテキストとしてバインド済み ACP ハーネスへ送信されることはありません。
    - バックエンドがキャンセルに対応している場合、`cancel` はアクティブなターンを中止します。バインディングやセッションメタデータは削除しません。
    - `close` は OpenClaw の観点から ACP セッションを終了し、バインディングを削除します。再開に対応するハーネスでは、ハーネス自身の上流履歴が引き続き保持される場合があります。
    - acpx Plugin は `close` 後に OpenClaw 所有のラッパーおよびアダプターのプロセスツリーをクリーンアップし、Gateway 起動時に残存する OpenClaw 所有の ACPX 孤立プロセスを回収します。
    - アイドル状態のランタイムワーカーは、`acp.runtime.ttlMinutes` の経過後にクリーンアップ対象となります。保存済みのセッションメタデータは `/acp sessions` で引き続き利用できます。

  </Accordion>
  <Accordion title="ネイティブ Codex のルーティング規則">
    有効な場合に**ネイティブ Codex Plugin**へルーティングされるべき
    自然言語トリガー：

    - 「この Discord チャンネルを Codex にバインドする。」
    - 「このチャットを Codex スレッド `<id>` に接続する。」
    - 「Codex スレッドを表示してから、これをバインドする。」

    ネイティブ Codex 会話バインディングが、デフォルトのチャット制御経路です。
    OpenClaw の動的ツールは引き続き OpenClaw 経由で実行されますが、shell/apply-patch などの Codex ネイティブ
    ツールは Codex 内で実行されます。Codex ネイティブの
    ツールイベントでは、OpenClaw がターンごとのネイティブフックリレーを注入するため、Plugin フックは
    `before_tool_call` をブロックし、`after_tool_call` を監視し、Codex の
    `PermissionRequest` イベントを OpenClaw の承認処理へルーティングできます。Codex の `Stop` フックは
    OpenClaw の `before_agent_finalize` にリレーされ、そこで Plugin は Codex が回答を確定する前に
    もう一度モデルを実行するよう要求できます。このリレーは
    意図的に保守的な動作を維持します。Codex ネイティブツールの引数を変更したり、
    Codex のスレッド記録を書き換えたりすることはありません。ACP ランタイム／セッションモデルを使用したい場合にのみ、
    ACP を明示的に使用してください。組み込み Codex のサポート境界については、
    [Codex ハーネス v1 サポート契約](/ja-JP/plugins/codex-harness-runtime#v1-support-contract)に
    記載されています。

  </Accordion>
  <Accordion title="モデル／プロバイダー／ランタイム選択早見表">
    - 従来の Codex モデル参照 - 従来の Codex OAuth／サブスクリプションモデル経路。doctor によって修復されます。
    - `openai/*` - OpenAI エージェントターン向けのネイティブ Codex app-server 組み込みランタイム。
    - `/codex ...` - ネイティブ Codex 会話制御。
    - `/acp ...` または `runtime: "acp"` - 明示的な ACP／acpx 制御。

  </Accordion>
  <Accordion title="ACP ルーティングの自然言語トリガー">
    ACP ランタイムへルーティングすべきトリガー：

    - 「これを単発の Claude Code ACP セッションとして実行し、結果を要約してください。」
    - 「このタスクにはスレッド内で Gemini CLI を使用し、その後の追加対応も同じスレッドで続けてください。」
    - 「バックグラウンドスレッドで ACP 経由の Codex を実行してください。」

    OpenClaw は `runtime: "acp"` を選択し、ハーネスの `agentId` を解決し、サポートされている場合は
    現在の会話またはスレッドにバインドして、クローズまたは有効期限切れまで追加メッセージを
    そのセッションへルーティングします。Codex がこの経路を使用するのは、
    ACP／acpx が明示されている場合、または要求された操作でネイティブ Codex Plugin が利用できない場合のみです。

    `sessions_spawn` では、ACP が有効で、要求元がサンドボックス化されておらず、ACP ランタイムバックエンドが
    読み込まれている場合にのみ、`runtime: "acp"` が提示されます。
    `acp.dispatch.enabled=false` は ACP スレッドの自動ディスパッチを一時停止しますが、
    明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しを非表示にしたりブロックしたりはしません。
    対象には `codex`、`claude`、`droid`、
    `gemini`、`opencode` などの ACP ハーネス ID を指定します。`agents_list` の通常の OpenClaw 設定エージェント ID は、
    そのエントリに `agents.list[].runtime.type="acp"` が明示的に設定されていない限り、
    渡さないでください。それ以外の場合は、デフォルトのサブエージェントランタイムを使用してください。
    OpenClaw エージェントに `runtime.type="acp"` が設定されている場合、
    OpenClaw は `runtime.acp.agent` を基盤となるハーネス ID として使用します。

  </Accordion>
</AccordionGroup>

## ACP とサブエージェントの比較

外部ハーネスランタイムを使用したい場合は ACP を使用します。`codex` Plugin が有効な場合に Codex の会話をバインド／制御するには、**ネイティブ Codex
app-server** を使用します。OpenClaw ネイティブの委任実行が必要な場合は、**サブエージェント**を使用します。

| 項目          | ACP セッション                           | サブエージェント実行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| ランタイム       | ACP バックエンド Plugin（例：acpx） | OpenClaw ネイティブのサブエージェントランタイム  |
| セッションキー   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主なコマンド | `/acp ...`                            | `/subagents ...`                   |
| 起動ツール    | `runtime:"acp"` を指定した `sessions_spawn` | `sessions_spawn`（デフォルトランタイム） |

[サブエージェント](/ja-JP/tools/subagents)も参照してください。

## ACP が Claude Code を実行する仕組み

ACP 経由の Claude Code では、スタックは次のとおりです。

1. OpenClaw ACP セッション制御プレーン。
2. 公式 `@openclaw/acpx` ランタイム Plugin。
3. Claude ACP アダプター。
4. Claude 側のランタイム／セッション機構。

ACP Claude は、ACP 制御、セッション再開、
バックグラウンドタスク追跡、およびオプションの会話／スレッドバインディングを備えた**ハーネスセッション**です。

CLI バックエンドは、独立したテキスト専用のローカルフォールバックランタイムです。
[CLI バックエンド](/ja-JP/gateway/cli-backends)を参照してください。

運用者向けの実用的なルールは次のとおりです。

- **`/acp spawn`、バインド可能なセッション、ランタイム制御、または永続的なハーネス作業が必要ですか？** ACP を使用します。
- **生の CLI を介した単純なローカルテキストフォールバックが必要ですか？** CLI バックエンドを使用します。

## バインドされたセッション

### メンタルモデル

- **チャット画面** - ユーザーが会話を続ける場所（Discord チャンネル、Telegram トピック、iMessage チャット）。
- **ACP セッション** - OpenClaw がルーティングする永続的な Codex／Claude／Gemini ランタイム状態。
- **子スレッド／トピック** - `--thread ...` によってのみ作成される、オプションの追加メッセージ画面。
- **ランタイムワークスペース** - ハーネスが実行されるファイルシステム上の場所（`cwd`、リポジトリのチェックアウト、バックエンドワークスペース）。チャット画面とは独立しています。

### 現在の会話へのバインド

`/acp spawn <harness> --bind here` は、現在の会話を
起動した ACP セッションに固定します。子スレッドは作成されず、同じチャット画面を使用します。OpenClaw が引き続き
トランスポート、認証、安全性、配信を管理します。その会話内の追加メッセージは
同じセッションへルーティングされ、`/new` と `/reset` はその場でセッションをリセットし、
`/acp close` はバインディングを削除します。

例：

```text
/codex bind                                              # ネイティブ Codex をバインドし、以後のメッセージをここへルーティング
/codex model gpt-5.4                                     # バインドされたネイティブ Codex スレッドを調整
/codex stop                                              # アクティブなネイティブ Codex ターンを制御
/acp spawn codex --bind here                             # Codex 向けの明示的な ACP フォールバック
/acp spawn codex --thread auto                           # 子スレッド／トピックを作成し、そこへバインドする場合がある
/acp spawn codex --bind here --cwd /workspace/repo       # 同じチャットバインディングを使用し、Codex は /workspace/repo で実行
```

<AccordionGroup>
  <Accordion title="バインディングのルールと排他性">
    - `--bind here` と `--thread ...` は同時に使用できません。
    - `--bind here` は、現在の会話へのバインディング対応を表明するチャンネルでのみ機能します。それ以外の場合、OpenClaw は未対応であることを明確に示すメッセージを返します。バインディングは Gateway の再起動後も保持されます。
    - Discord では、`spawnSessions` が `--thread auto|here` による子スレッド作成を制御します。`--bind here` は対象外です。
    - `--cwd` を指定せずに別の ACP エージェントを起動した場合、OpenClaw はデフォルトで**対象エージェントの**ワークスペースを継承します。継承したパスが存在しない場合（`ENOENT`／`ENOTDIR`）はバックエンドのデフォルトにフォールバックします。その他のアクセスエラー（例：`EACCES`）は起動エラーとして表面化します。
    - バインドされた会話でも Gateway 管理コマンドはローカルに留まります。通常の追加テキストがバインド先の ACP セッションへルーティングされる場合でも、`/acp ...` コマンドは OpenClaw が処理します。また、その画面でコマンド処理が有効な場合、`/status` と `/unfocus` もローカルに留まります。

  </Accordion>
  <Accordion title="スレッドにバインドされたセッション">
    チャンネルアダプターでスレッドバインディングが有効な場合：

    - OpenClaw はスレッドを対象の ACP セッションにバインドします。
    - そのスレッド内の追加メッセージは、バインドされた ACP セッションへルーティングされます。
    - ACP の出力は同じスレッドへ配信されます。
    - フォーカス解除／クローズ／アーカイブ／アイドルタイムアウトまたは最大経過時間による有効期限切れで、バインディングが削除されます。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status`、`/unfocus` は Gateway コマンドであり、ACP ハーネスへのプロンプトではありません。

    スレッドバインド ACP に必要な機能フラグ：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` はデフォルトでオンです（`false` に設定すると ACP スレッドの自動ディスパッチを一時停止します。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き機能します）。
    - チャンネルアダプターによるスレッドセッションの起動を有効化（デフォルト：`true`）：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`

    スレッドバインディングのサポートはアダプターごとに異なります。アクティブなチャンネルアダプターが
    スレッドバインディングをサポートしていない場合、OpenClaw は
    未対応または利用不可であることを明確に示すメッセージを返します。

  </Accordion>
  <Accordion title="スレッドをサポートするチャンネル">
    - セッション／スレッドバインディング機能を公開する任意のチャンネルアダプター。
    - 現在の組み込みサポート：**Discord** のスレッド／チャンネル、**Telegram** のトピック（グループ／スーパーグループ内のフォーラムトピックおよび DM トピック）。
    - Plugin チャンネルは同じバインディングインターフェースを介してサポートを追加できます。

  </Accordion>
</AccordionGroup>

## 永続的なチャンネルバインディング

一時的でないワークフローでは、トップレベルの
`bindings[]` エントリで永続的な ACP バインディングを設定します。

### バインディングモデル

<ParamField path="bindings[].type" type='"acp"'>
  永続的な ACP 会話バインディングであることを示します。
</ParamField>
<ParamField path="bindings[].match" type="object">
  対象の会話を識別します。チャンネルごとの形式：

- **Discord チャンネル／スレッド：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack チャンネル／DM：** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`。安定した Slack ID を優先してください。チャンネルバインディングは、そのチャンネル内のスレッドへの返信にも一致します。
- **Telegram フォーラムトピック：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp DM／グループ：** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`。ダイレクトチャットには `+15555550123` のような E.164 番号を、グループには `120363424282127706@g.us` のような WhatsApp グループ JID を使用します。
- **iMessage DM／グループ：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。安定したグループバインディングには `chat_id:*` を優先してください。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  所有する OpenClaw エージェントの ID。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  オプションの ACP オーバーライド。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  オプションの運用者向けラベル。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  オプションのランタイム作業ディレクトリ。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  オプションのバックエンドオーバーライド。
</ParamField>

### エージェントごとのランタイムデフォルト

`agents.list[].runtime` を使用して、エージェントごとに ACP のデフォルトを一度定義します。

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（ハーネス ID。例：`codex` または `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP バインドセッションのオーバーライド優先順位：**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. グローバル ACP デフォルト（例：`acp.backend`）

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

- OpenClaw は、チャネル固有の受け入れ処理後、使用前に、設定された ACP セッションが存在することを保証します。
- そのチャネル、トピック、またはチャット内のメッセージは、設定された ACP セッションにルーティングされます。
- 設定された ACP バインディングは、そのセッションルートを所有します。チャネルのブロードキャストによるファンアウトが、一致したバインディングの設定済み ACP セッションを置き換えることはありません。
- バインドされた会話では、`/new` と `/reset` は同じ ACP セッションキーをその場でリセットします。
- 一時的なランタイムバインディング（たとえば、スレッドフォーカスフローによって作成されたもの）は、存在する場合は引き続き適用されます。
- 明示的な `cwd` がないエージェント間 ACP スポーンでは、OpenClaw はエージェント設定から対象エージェントのワークスペースを継承します。
- 継承されたワークスペースパスが存在しない場合はバックエンドのデフォルト cwd にフォールバックし、存在するパスへのアクセス失敗はスポーンエラーとして報告されます。

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
    `runtime` のデフォルトは `subagent` なので、ACP セッションでは
    `runtime: "acp"` を明示的に設定してください。`agentId` を省略した場合、設定されていれば
    OpenClaw は `acp.defaultAgent` を使用します。`mode: "session"` では、永続的にバインドされた
    会話を維持するために `thread: true` が必要です。
    </Note>

  </Tab>
  <Tab title="/acp コマンドから">
    チャットからオペレーターが明示的に制御するには、`/acp spawn` を使用します。

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

### `sessions_spawn` のパラメーター

<ParamField path="task" type="string" required>
  ACP セッションに送信される最初のプロンプト。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP セッションでは `"acp"` でなければなりません。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 対象ハーネスの ID。設定されている場合は `acp.defaultAgent` にフォールバックします。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  サポートされている場合に、スレッドバインディングフローを要求します。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` は単発実行、`"session"` は永続実行です。`thread: true` で
  `mode` が省略された場合、OpenClaw はランタイムパスに応じて永続動作を
  デフォルトにすることがあります。`mode: "session"` には `thread: true` が必要です。
</ParamField>
<ParamField path="cwd" type="string">
  要求するランタイム作業ディレクトリ（バックエンド／ランタイムポリシーによって検証されます）。
  省略した場合、設定されていれば ACP スポーンは対象エージェントのワークスペースを継承します。
  継承されたパスが存在しない場合はバックエンドのデフォルトにフォールバックし、実際のアクセス
  エラーは返されます。
</ParamField>
<ParamField path="label" type="string">
  セッション／バナーテキストで使用される、オペレーター向けのラベル。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  新しいセッションを作成する代わりに、既存の ACP セッションを再開します。エージェントは
  `session/load` を介して会話履歴を再生します。`runtime: "acp"` が必要です。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` は、最初の ACP 実行の進行状況概要をシステムイベントとして要求元
  セッションにストリーミングします。受理された応答には、セッションスコープの JSONL ログ
  （`<sessionId>.acp-stream.jsonl`）を指す `streamLogPath` が含まれ、リレー履歴全体を
  `tail` できます。`streaming.progress.commentary=false` でない限り、親への進行状況
  ストリームには、デフォルトでアシスタントの解説と ACP ステータス進行状況が表示されます。
  ストリームモードが設定されていない場合、Discord の親プレビューもデフォルトで進行状況
  モードになります。ステータス進行状況は引き続き `acp.stream.tagVisibility` に従うため、
  `plan` などのタグは明示的に有効化されない限り非表示のままです。
</ParamField>

ACP の `sessions_spawn` 実行では、デフォルトの子ターン制限として
`agents.defaults.subagents.runTimeoutSeconds` が使用されます。このツールは呼び出しごとの
タイムアウト上書きを受け付けません（`runTimeoutSeconds`／`timeoutSeconds` は、
デフォルトを設定するよう求めるエラーで拒否されます）。

<ParamField path="model" type="string">
  ACP 子セッション用の明示的なモデル上書き。Codex ACP スポーンでは、
  `openai/gpt-5.4` などの OpenAI 参照を、`session/new` の前に Codex ACP の起動設定へ
  正規化します。`openai/gpt-5.4/high` などのスラッシュ形式では、Codex ACP の推論強度も
  設定されます。省略した場合、`sessions_spawn({ runtime: "acp" })` は、設定されていれば
  既存のサブエージェントモデルのデフォルト（`agents.defaults.subagents.model` または
  `agents.list[].subagents.model`）を使用します。それ以外の場合は、ACP ハーネス独自の
  デフォルトモデルを使用させます。その他のハーネスは ACP `models` を公開し、
  `session/set_model` をサポートする必要があります。サポートしない場合、OpenClaw／acpx は
  対象エージェントのデフォルトに暗黙的にフォールバックせず、明確に失敗します。
</ParamField>
<ParamField path="thinking" type="string">
  明示的な思考／推論強度。Codex ACP では、`minimal` は低い強度に対応し、
  `low`／`medium`／`high`／`xhigh` はそのまま対応し、`off` は起動時の推論強度上書きを
  省略します。省略した場合、ACP スポーンは既存のサブエージェントの思考デフォルトと、
  選択されたモデルに対するモデル単位の
  `agents.defaults.models["provider/model"].params.thinking` を使用します。
</ParamField>

## スポーンのバインドモードとスレッドモード

<Tabs>
  <Tab title="--bind here|off">
    | モード | 動作                                                                    |
    | ------ | ----------------------------------------------------------------------- |
    | `here` | 現在アクティブな会話をその場でバインドします。アクティブな会話がなければ失敗します。 |
    | `off`  | 現在の会話へのバインディングを作成しません。                            |

    注記:

    - `--bind here` は、「このチャネルまたはチャットを Codex で処理する」ための最も簡単なオペレーター向け手順です。
    - `--bind here` は子スレッドを作成しません。
    - `--bind here` は、現在の会話へのバインディングをサポートするチャネルでのみ使用できます。
    - 同じ `/acp spawn` 呼び出しで `--bind` と `--thread` を組み合わせることはできません。

  </Tab>
  <Tab title="--thread auto|here|off">
    | モード | 動作                                                                                                      |
    | ------ | --------------------------------------------------------------------------------------------------------- |
    | `auto` | アクティブなスレッド内ではそのスレッドをバインドします。スレッド外では、サポートされていれば子スレッドを作成してバインドします。 |
    | `here` | 現在アクティブなスレッドを必須とし、スレッド内でなければ失敗します。                                     |
    | `off`  | バインドしません。セッションは未バインドで開始されます。                                                 |

    注記:

    - スレッドをバインドできないサーフェスでは、デフォルト動作は実質的に `off` です。
    - スレッドバインドのスポーンには、チャネルポリシーによるサポートが必要です。
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - 子スレッドを作成せずに現在の会話を固定する場合は、`--bind here` を使用します。

  </Tab>
</Tabs>

## 配信モデル

ACP セッションは、対話型ワークスペースまたは親が所有するバックグラウンド作業の
いずれかとして利用できます。配信経路はその形態によって異なります。

<AccordionGroup>
  <Accordion title="対話型 ACP セッション">
    対話型セッションは、可視のチャットサーフェスで会話を継続することを目的としています。

    - `/acp spawn ... --bind here` は、現在の会話を ACP セッションにバインドします。
    - `/acp spawn ... --thread ...` は、チャネルのスレッド／トピックを ACP セッションにバインドします。
    - 永続的に設定された `bindings[].type="acp"` は、一致する会話を同じ ACP セッションにルーティングします。

    バインドされた会話内の後続メッセージは ACP セッションに直接ルーティングされ、
    ACP の出力は同じチャネル／スレッド／トピックに返されます。

    OpenClaw がハーネスに送信する内容:

    - 通常のバインドされた後続メッセージは、プロンプトテキストとして送信されます。添付ファイルは、ハーネス／バックエンドがサポートする場合にのみ追加されます。
    - `/acp` 管理コマンドとローカル Gateway コマンドは、ACP へのディスパッチ前にインターセプトされます。
    - ランタイムが生成した完了イベントは、対象ごとに具現化されます。OpenClaw エージェントには OpenClaw の内部ランタイムコンテキストエンベロープが渡され、外部 ACP ハーネスには子の結果と指示を含むプレーンなプロンプトが渡されます。生の `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` エンベロープを外部ハーネスに送信したり、ACP ユーザートランスクリプトのテキストとして永続化したりしてはなりません。
    - ACP トランスクリプトのエントリには、ユーザーに表示されるトリガーテキストまたはプレーンな完了プロンプトが使用されます。内部イベントメタデータは、可能な限り OpenClaw 内で構造化されたまま保持され、ユーザーが作成したチャット内容として扱われません。

  </Accordion>
  <Accordion title="親が所有する単発 ACP セッション">
    別のエージェント実行によってスポーンされた単発 ACP セッションは、
    サブエージェントと同様のバックグラウンド子セッションです。

    - 親は `sessions_spawn({ runtime: "acp", mode: "run" })` を使用して作業を依頼します。
    - 子は独自の ACP ハーネスセッション内で実行されます。
    - 子ターンはネイティブのサブエージェントスポーンと同じバックグラウンドレーンで実行されるため、遅い ACP ハーネスが無関係なメインセッションの作業をブロックすることはありません。
    - 完了はタスク完了通知経路を通じて親に報告されます。OpenClaw は、外部ハーネスに送信する前に内部完了メタデータをプレーンな ACP プロンプトへ変換するため、ハーネスに OpenClaw 専用のランタイムコンテキストマーカーが表示されることはありません。
    - ユーザー向けの応答が有用な場合、親は子の結果を通常のアシスタントの文体で書き直します。

    この経路を、親と子の間のピアツーピアチャットとして扱っては
    **なりません**。子にはすでに親へ返す完了チャネルがあります。

  </Accordion>
  <Accordion title="sessions_send と A2A 配信">
    `sessions_send` は、スポーン後に別のセッションを対象にできます。通常のピア
    セッションでは、OpenClaw はメッセージを注入した後、エージェント間（A2A）の
    後続処理経路を使用します。

    - 対象セッションの応答を待ちます。
    - 必要に応じて、要求元と対象の間で上限付きの回数の後続ターンをやり取りさせます。
    - 対象に通知メッセージの生成を依頼します。
    - その通知を可視のチャネルまたはスレッドに配信します。

    この A2A パスは、送信者に見えるフォローアップが必要なピア送信のためのフォールバックです。たとえば、広範な `tools.sessions.visibility` 設定のもとで、無関係なセッションが ACP ターゲットを参照してメッセージを送信できる場合、このパスは有効なままです。

    OpenClaw が A2A フォローアップをスキップするのは、リクエスターが、自身の親が所有する単発 ACP 子セッションの親である場合のみです。この場合、タスク完了に加えて A2A を実行すると、子セッションの結果によって親が起動され、親の応答が子セッションへ送り返され、親子間のエコーループが発生する可能性があります。その所有子セッションの場合、結果の処理は完了パスがすでに担っているため、`sessions_send` の結果は `delivery.status="skipped"` を報告します。

  </Accordion>
  <Accordion title="既存のセッションを再開する">
    新しく開始する代わりに、`resumeSessionId` を使用して以前の ACP セッションを続行します。エージェントは `session/load` を介して会話履歴を再生するため、それまでの完全なコンテキストを引き継いで再開します。

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    一般的なユースケース:

    - Codex セッションをノートパソコンからスマートフォンへ引き継ぎ、エージェントに中断した箇所から再開するよう指示する。
    - CLI で対話的に開始したコーディングセッションを、エージェント経由でヘッドレスに続行する。
    - Gateway の再起動やアイドルタイムアウトによって中断された作業を再開する。

    注:

    - `resumeSessionId` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `streamTo` は `runtime: "acp"` の場合にのみ適用されます。デフォルトのサブエージェントランタイムは、この ACP 専用フィールドを無視します。
    - `resumeSessionId` はホストローカルの ACP/ハーネス再開 ID であり、OpenClaw のチャネルセッションキーではありません。OpenClaw はディスパッチ前に引き続き ACP の生成ポリシーとターゲットエージェントポリシーを確認し、その上流 ID を読み込むための認可は ACP バックエンドまたはハーネスが担います。
    - `resumeSessionId` は上流 ACP の会話履歴を復元します。`thread` と `mode` は、作成する新しい OpenClaw セッションに通常どおり適用されるため、`mode: "session"` では引き続き `thread: true` が必要です。
    - ターゲットエージェントは `session/load` をサポートしている必要があります（Codex と Claude Code はサポートしています）。
    - セッション ID が見つからない場合、生成は明確なエラーで失敗し、新しいセッションへ暗黙にフォールバックすることはありません。

  </Accordion>
  <Accordion title="デプロイ後のスモークテスト">
    Gateway のデプロイ後は、単体テストだけを信頼せず、実環境でエンドツーエンドチェックを実行します。

    1. ターゲットホスト上で、デプロイされた Gateway のバージョンとコミットを確認します。
    2. 稼働中のエージェントへの一時的な ACPX ブリッジセッションを開きます。
    3. そのエージェントに、`runtime: "acp"`、`agentId: "codex"`、`mode: "run"`、タスク `Reply with exactly LIVE-ACP-SPAWN-OK` を指定して `sessions_spawn` を呼び出すよう依頼します。
    4. `accepted=yes`、実際の `childSessionKey`、およびバリデーターエラーがないことを確認します。
    5. 一時的なブリッジセッションをクリーンアップします。

    ゲートは `mode: "run"` のままにし、`streamTo: "parent"` は省略してください。スレッドにバインドされた `mode: "session"` とストリームリレーのパスは、それぞれ別の、より高度な統合テストで確認します。

  </Accordion>
</AccordionGroup>

## サンドボックス互換性

ACP セッションは現在、OpenClaw サンドボックス内では**なく**、ホストランタイム上で実行されます。

<Warning>
**セキュリティ境界:**

- 外部ハーネスは、自身の CLI 権限と選択された `cwd` に従って読み書きできます。
- OpenClaw のサンドボックスポリシーは ACP ハーネスの実行を**ラップしません**。
- OpenClaw は引き続き、ACP の機能ゲート、許可されたエージェント、セッション所有権、チャネルバインディング、および Gateway の配信ポリシーを適用します。
- サンドボックスが適用される OpenClaw ネイティブの作業には `runtime: "subagent"` を使用してください。

</Warning>

現在の制限事項:

- リクエスターセッションがサンドボックス化されている場合、`sessions_spawn({ runtime: "acp" })` と `/acp spawn` のどちらでも ACP の生成はブロックされます。
- `runtime: "acp"` を指定した `sessions_spawn` は `sandbox: "require"` をサポートしていません。

## セッションターゲットの解決

ほとんどの `/acp` アクションは、オプションのセッションターゲット（`session-key`、`session-id`、または `session-label`）を受け付けます。

**解決順序:**

1. 明示的なターゲット引数（または `/acp steer` の `--session`）
   - まずキーを試行
   - 次に UUID 形式のセッション ID
   - 最後にラベル
2. 現在のスレッドバインディング（この会話またはスレッドが ACP セッションにバインドされている場合）。
3. 現在のリクエスターセッションへのフォールバック。

現在の会話のバインディングとスレッドのバインディングは、どちらも手順 2 の対象になります。

ターゲットを解決できない場合、OpenClaw は明確なエラー（`Unable to resolve session target: ...`）を返します。

## ACP コントロール

| コマンド             | 動作                                                      | 例                                                            |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP セッションを作成し、必要に応じて現在の会話またはスレッドにバインドします。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ターゲットセッションで進行中のターンをキャンセルします。  | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 実行中のセッションへ誘導指示を送信します。                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | セッションを閉じ、スレッドターゲットのバインドを解除します。 | `/acp close`                                                  |
| `/acp status`        | バックエンド、モード、状態、ランタイムオプション、機能を表示します。 | `/acp status`                                                 |
| `/acp set-mode`      | ターゲットセッションのランタイムモードを設定します。      | `/acp set-mode plan`                                          |
| `/acp set`           | 汎用ランタイム設定オプションを書き込みます。              | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ランタイムの作業ディレクトリのオーバーライドを設定します。 | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 承認ポリシープロファイルを設定します。                    | `/acp permissions strict`                                     |
| `/acp timeout`       | ランタイムのタイムアウト（秒）を設定します。              | `/acp timeout 120`                                            |
| `/acp model`         | ランタイムモデルのオーバーライドを設定します。            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | セッションのランタイムオプションのオーバーライドを削除します。 | `/acp reset-options`                                          |
| `/acp sessions`      | ストア内の最近の ACP セッションを一覧表示します。         | `/acp sessions`                                               |
| `/acp doctor`        | バックエンドの健全性、機能、実行可能な修正方法を表示します。 | `/acp doctor`                                                 |
| `/acp install`       | 決定論的なインストール手順と有効化手順を表示します。      | `/acp install`                                                |

ランタイムコントロール（`spawn`、`cancel`、`steer`、`close`、`status`、`set-mode`、`set`、`cwd`、`permissions`、`timeout`、`model`、`reset-options`）には、外部チャネルでは所有者のアイデンティティが、内部 Gateway クライアントでは `operator.admin` が必要です。認可された所有者以外の送信者も、`sessions`、`doctor`、`install`、`help` は引き続き使用できます。

`/acp status` は、有効なランタイムオプションに加えて、ランタイムレベルとバックエンドレベルのセッション識別子を表示します。バックエンドに機能がない場合、未サポートのコントロールに関するエラーが明確に表示されます。`/acp sessions` は、現在バインドされているセッションまたはリクエスターセッションのストアを読み取ります。ターゲットトークン（`session-key`、`session-id`、または `session-label`）は、エージェントごとのカスタム `session.store` ルートを含む Gateway のセッション検出を通じて解決されます。

### ランタイムオプションのマッピング

`/acp` には便利なコマンドと汎用セッターがあります。同等の操作は次のとおりです。

| コマンド                     | マッピング先                         | 注記                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | ランタイム設定キー `model`           | Codex ACP の場合、OpenClaw は `openai/<model>` をアダプターモデル ID に正規化し、`openai/gpt-5.4/high` のようなスラッシュ区切りの推論サフィックスを `reasoning_effort` にマッピングします。                     |
| `/acp set thinking <level>`  | 正規オプション `thinking`            | OpenClaw は、存在する場合、バックエンドが通知した同等のオプションを送信し、`thinking`、`effort`、`reasoning_effort`、`thought_level` の順に優先します。Codex ACP の場合、アダプターが値を `reasoning_effort` にマッピングします。 |
| `/acp permissions <profile>` | 正規オプション `permissionProfile`   | OpenClaw は、存在する場合、`approval_policy`、`permission_profile`、`permissions`、`permission_mode` など、バックエンドが通知した同等のオプションを送信します。                                             |
| `/acp timeout <seconds>`     | 正規オプション `timeoutSeconds`      | OpenClaw は、存在する場合、`timeout` や `timeout_seconds` など、バックエンドが通知した同等のオプションを送信します。                                                                                         |
| `/acp cwd <path>`            | ランタイムの cwd オーバーライド      | 直接更新します。                                                                                                                                                                                           |
| `/acp set <key> <value>`     | 汎用                                 | `key=cwd` は cwd オーバーライドパスを使用します。                                                                                                                                                          |
| `/acp reset-options`         | すべてのランタイムオーバーライドをクリア | -                                                                                                                                                                                                          |

## acpx ハーネス、Plugin のセットアップ、権限

acpx ハーネスの設定（Claude Code / Codex / Gemini CLI のエイリアス）、plugin-tools と OpenClaw-tools の MCP ブリッジ、および ACP の権限モードについては、[ACP エージェント - セットアップ](/ja-JP/tools/acp-agents-setup)を参照してください。

## トラブルシューティング

| 症状                                                                                      | 考えられる原因                                                                                                         | 修正方法                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                                   | バックエンドPluginが存在しない、無効になっている、または `plugins.allow` によってブロックされている。                 | バックエンドPluginをインストールして有効にし、許可リストが設定されている場合は `plugins.allow` に `acpx` を追加してから、`/acp doctor` を実行する。                      |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACPがグローバルに無効になっている。                                                                                    | `acp.enabled=true` を設定する。                                                                                                                                          |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | 通常のスレッドメッセージからの自動ディスパッチが無効になっている。                                                     | 自動スレッドルーティングを再開するには `acp.dispatch.enabled=true` を設定する。明示的な `sessions_spawn({ runtime: "acp" })` 呼び出しは引き続き機能する。                |
| `ACP agent "<id>" is not allowed by policy`                                               | エージェントが許可リストに含まれていない。                                                                             | 許可されている `agentId` を使用するか、`acp.allowedAgents` を更新する。                                                                                                  |
| `/acp doctor` reports backend not ready right after startup                               | バックエンドPluginが存在しない、無効になっている、許可・拒否ポリシーによってブロックされている、または設定された実行ファイルを利用できない。 | バックエンドPluginをインストールまたは有効化して `/acp doctor` を再実行し、正常にならない場合はバックエンドのインストールエラーまたはポリシーエラーを確認する。          |
| ハーネスコマンドが見つからない                                                            | アダプターCLIがインストールされていない、外部Pluginが存在しない、またはCodex以外のアダプターで初回実行時の `npx` 取得に失敗した。 | `/acp doctor` を実行し、Gatewayホスト上でアダプターをインストールまたは事前準備するか、acpxエージェントコマンドを明示的に設定する。                                      |
| ハーネスからモデル未検出エラーが返される                                                  | モデルIDは別のプロバイダーまたはハーネスでは有効だが、このACPターゲットでは無効である。                                | そのハーネスに一覧表示されるモデルを使用するか、ハーネスでモデルを設定するか、オーバーライドを省略する。                                                               |
| ハーネスからベンダー認証エラーが返される                                                  | OpenClawは正常だが、対象のCLIまたはプロバイダーにログインしていない。                                                  | Gatewayホスト環境でログインするか、必要なプロバイダーキーを指定する。                                                                                                   |
| `Unable to resolve session target: ...`                                                   | キー、ID、またはラベルトークンが正しくない。                                                                           | `/acp sessions` を実行し、正確なキーまたはラベルをコピーして再試行する。                                                                                                |
| `--bind here requires running /acp spawn inside an active ... conversation`               | バインド可能なアクティブな会話がない状態で `--bind here` を使用した。                                                  | 対象のチャットまたはチャンネルに移動して再試行するか、バインドなしで生成する。                                                                                           |
| `Conversation bindings are unavailable for <channel>.`                                    | アダプターに現在の会話をACPへバインドする機能がない。                                                                  | サポートされている場合は `/acp spawn ... --thread ...` を使用するか、トップレベルの `bindings[]` を設定するか、サポートされているチャンネルに移動する。                 |
| `--thread here requires running /acp spawn inside an active ... thread`                   | スレッドコンテキスト外で `--thread here` を使用した。                                                                  | 対象のスレッドに移動するか、`--thread auto` または `off` を使用する。                                                                                                   |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | 別のユーザーがアクティブなバインド先を所有している。                                                                   | 所有者として再バインドするか、別の会話またはスレッドを使用する。                                                                                                         |
| `Thread bindings are unavailable for <channel>.`                                          | アダプターにスレッドバインド機能がない。                                                                               | `--thread off` を使用するか、サポートされているアダプターまたはチャンネルに移動する。                                                                                    |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | ACPランタイムはホスト側で動作するが、要求元のセッションがサンドボックス化されている。                                 | サンドボックス化されたセッションからは `runtime="subagent"` を使用するか、サンドボックス化されていないセッションからACP生成を実行する。                               |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | ACPランタイムに対して `sandbox="require"` が要求された。                                                               | サンドボックス化が必須の場合は `runtime="subagent"` を使用するか、サンドボックス化されていないセッションから `sandbox="inherit"` を指定してACPを使用する。             |
| `Cannot apply --model ... did not advertise model support`                                | 対象のハーネスが汎用的なACPモデル切り替えを公開していない。                                                            | ACPの `models`/`session/set_model` を公開するハーネスを使用するか、Codex ACPモデル参照を使用するか、独自の起動フラグがある場合はハーネスでモデルを直接設定する。        |
| バインドされたセッションのACPメタデータがない                                             | ACPセッションのメタデータが古いか削除されている。                                                                      | `/acp spawn` で再作成してから、スレッドを再バインドまたはフォーカスする。                                                                                               |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | 非対話型ACPセッションで `permissionMode` が書き込みまたは実行をブロックしている。                                      | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定し、Gatewayを再起動する。[権限設定](/ja-JP/tools/acp-agents-setup#permission-configuration)を参照。       |
| ACPセッションがほとんど出力せず早期に失敗する                                             | `permissionMode` または `nonInteractivePermissions` によって権限プロンプトがブロックされている。                       | Gatewayログで `AcpRuntimeError` を確認する。完全な権限を付与するには `permissionMode=approve-all` を設定し、適切に機能を縮退させるには `nonInteractivePermissions=deny` を設定する。 |
| ACPセッションが作業完了後も無期限に停止する                                               | ハーネスプロセスは終了したが、ACPセッションが完了を報告しなかった。                                                    | OpenClawを更新する。現在のacpxクリーンアップは、終了時およびGateway起動時に、OpenClawが所有する古いラッパープロセスとアダプタープロセスを終了する。                    |
| ハーネスに `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` が表示される                           | 内部イベントエンベロープがACP境界を越えて漏洩した。                                                                    | OpenClawを更新して完了フローを再実行する。外部ハーネスはプレーンな完了プロンプトのみを受信する必要がある。                                                             |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` は、
ACP/acpxではなく、ネイティブCodexフックリレーに属するエラーである。バインドされたCodexチャットでは、
`/new` または `/reset` で新しいセッションを開始する。一度は機能しても、
次のネイティブツール呼び出しで再び発生する場合は、`/new` を繰り返すのではなく、
Codex app-serverまたはOpenClaw Gatewayを再起動する。
[Codexハーネスのトラブルシューティング](/ja-JP/plugins/codex-harness#troubleshooting)を参照。
</Note>

## 関連項目

- [ACPエージェント - セットアップ](/ja-JP/tools/acp-agents-setup)
- [エージェント送信](/ja-JP/tools/agent-send)
- [CLIバックエンド](/ja-JP/gateway/cli-backends)
- [Codexハーネス](/ja-JP/plugins/codex-harness)
- [Codexハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [マルチエージェント用サンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（ブリッジモード）](/ja-JP/cli/acp)
- [サブエージェント](/ja-JP/tools/subagents)
