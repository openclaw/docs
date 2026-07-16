---
read_when:
    - チャットコマンドの使用または設定
    - コマンドルーティングまたは権限のデバッグ
    - スキルコマンドの登録方法を理解する
sidebarTitle: Slash commands
summary: 利用可能なすべてのスラッシュコマンド、ディレクティブ、インラインショートカット — 設定、ルーティング、各サーフェスでの動作。
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-07-16T12:12:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e3a50447f4776d606476f3e8511595fd27bcb889d1e9e2620b1f062ac63fb3a0
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway は、`/` で始まる単独メッセージとして送信されたコマンドを処理します。
ホスト専用の bash コマンドには `! <cmd>` を使用します（`/bash <cmd>` はそのエイリアスです）。

会話が ACP セッションにバインドされている場合、通常のテキストは ACP
ハーネスにルーティングされます。Gateway 管理コマンドはローカルに留まります。`/acp ...` は常に
OpenClaw コマンドハンドラーに到達し、`/status` と `/unfocus` は、
そのサーフェスでコマンド処理が有効な場合、常にローカルに留まります。

## 3 種類のコマンド

<CardGroup cols={3}>
  <Card title="コマンド" icon="terminal">
    Gateway が処理する単独の `/...` メッセージです。メッセージ内の
    唯一の内容として送信する必要があります。
  </Card>
  <Card title="ディレクティブ" icon="sliders">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、
    `/exec`、`/model`、`/queue` — モデルがメッセージを
    認識する前に取り除かれます。単独で送信するとセッション設定を永続化し、
    他のテキストとともに送信するとインラインヒントとして機能します。
  </Card>
  <Card title="インラインショートカット" icon="bolt">
    `/help`、`/commands`、`/status`、`/whoami` — 即座に実行され、
    モデルが残りのテキストを認識する前に取り除かれます。承認済み送信者のみ使用できます。
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="ディレクティブの動作の詳細">
    - ディレクティブは、モデルがメッセージを認識する前に取り除かれます。
    - **ディレクティブのみ**のメッセージ（メッセージの内容がディレクティブのみ）では、
      セッションに永続化され、確認応答が返されます。
    - 他のテキストを含む**通常のチャット**メッセージでは、インラインヒントとして機能し、
      セッション設定は永続化**されません**。
    - ディレクティブは**承認済み送信者**にのみ適用されます。`commands.allowFrom`
      が設定されている場合、それが使用される唯一の許可リストです。それ以外の場合、認可は
      チャンネルの許可リスト／ペアリングと `commands.useAccessGroups` に基づきます。未承認の
      送信者が使用したディレクティブはプレーンテキストとして扱われます。
  </Accordion>
</AccordionGroup>

## 設定

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  チャットメッセージ内の `/...` の解析を有効にします。ネイティブコマンドがないサーフェス
  （WhatsApp、WebChat、Signal、iMessage、Google Chat、Microsoft Teams）では、
  `false` に設定されていてもテキストコマンドが機能します。
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ネイティブコマンドを登録します。自動設定：Discord／Telegram ではオン、Slack ではオフ。
  ネイティブサポートのないプロバイダーでは無視されます。チャンネルごとに
  `channels.<provider>.commands.native` で上書きできます。Discord では、`false` によりスラッシュコマンドの
  登録がスキップされます。以前に登録されたコマンドは、削除されるまで表示され続ける場合があります。
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  サポートされている場合、Skill コマンドをネイティブに登録します。自動設定：
  Discord／Telegram ではオン、Slack ではオフ。`channels.<provider>.commands.nativeSkills`
  で上書きできます。
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` によるホストのシェルコマンド実行を有効にします（`/bash <cmd>` はエイリアス）。`tools.elevated`
  の許可リストが必要です。
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash がバックグラウンドモードに切り替わるまで待機する時間です（`0` は
  即座にバックグラウンド化します）。
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config` を有効にします（`openclaw.json` を読み書きします）。オーナーのみ使用できます。
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` を有効にします（`mcp.servers` 配下にある OpenClaw 管理の MCP 設定を読み書きします）。オーナーのみ使用できます。
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` を有効にします（Plugin の検出／状態確認、およびインストール＋有効化／無効化）。書き込みはオーナーのみ実行できます。
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` を有効にします（ランタイムのみの設定上書き）。オーナーのみ使用できます。
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` と外部からの `SIGUSR1` 再起動リクエストを有効にします。
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  オーナー専用コマンドサーフェス向けの明示的なオーナー許可リストです。
  `commands.allowFrom` および DM ペアリングアクセスとは別です。
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  チャンネルごとの設定：オーナー専用コマンドにオーナーの本人性を要求します。`true` の場合、
  送信者は `commands.ownerAllowFrom` と一致するか、内部の `operator.admin`
  スコープを保持している必要があります。ワイルドカードの `allowFrom` エントリだけでは**不十分**です。
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  システムプロンプト内でのオーナー ID の表示方法を制御します。
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"` の場合に使用される HMAC シークレットです。
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  コマンド認可用のプロバイダーごとの許可リストです。設定されている場合、コマンドとディレクティブの
  **唯一の**認可ソースになります。グローバルなデフォルトには `"*"` を使用します。
  プロバイダー固有のキーはそれを上書きします。
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` が設定されていない場合、コマンドに対して許可リスト／ポリシーを適用します。
</ParamField>

## コマンド一覧

コマンドには 3 つの提供元があります。

- **コア組み込みコマンド：** `src/auto-reply/commands-registry.shared.ts`
- **生成されたドックコマンド：** `src/auto-reply/commands-registry.data.ts`
- **Plugin コマンド：** Plugin の `registerCommand()` 呼び出し

利用可否は、設定フラグ、チャンネルサーフェス、インストール済み／有効化済みの
Plugin によって異なります。

### コアコマンド

<AccordionGroup>
  <Accordion title="セッションと実行">
    | コマンド | 説明 |
    | --- | --- |
    | `/new [model]` | 現在のセッションをアーカイブし、新しいセッションを開始します |
    | `/reset [soft [message]]` | 現在のセッションをその場でリセットします。`soft` はトランスクリプトを保持し、再利用された CLI バックエンドのセッション ID を破棄して、起動処理を再実行します |
    | `/name <title>` | 現在のセッションに名前を付けるか、名前を変更します。タイトルを省略すると、現在の名前と候補が表示されます |
    | `/compact [instructions]` | セッションコンテキストを Compaction します。[Compaction](/ja-JP/concepts/compaction)を参照してください |
    | `/stop` | 現在の実行を中止します |
    | `/session idle <duration\|off>` | スレッドバインドのアイドル有効期限を管理します |
    | `/session max-age <duration\|off>` | スレッドバインドの最大期間による有効期限を管理します |
    | `/export-session [path]` | オーナーのみ。現在のセッションをワークスペース内の HTML にエクスポートします。エイリアス：`/export` |
    | `/export-trajectory [path]` | 現在のセッションの JSONL 軌跡バンドルをエクスポートします。エイリアス：`/trajectory` |

    明示的な `/export-session` パスを指定すると、ワークスペース内の既存ファイルが
    置き換えられます。パスを省略すると、名前の衝突を回避したファイル名が生成されます。

    <Note>
      Control UI は、入力された `/new` をインターセプトして新しい
      ダッシュボードセッションを作成し、そこへ切り替えます。ただし、`session.dmScope: "main"` が設定されていて、
      現在の親がエージェントのメインセッションである場合は、`/new` が
      メインセッションをその場でリセットします。入力された `/reset` は引き続き Gateway の
      その場でのリセットを実行します。固定されたセッションのモデル選択をクリアする場合は、
      `/model default` を使用します。
    </Note>

  </Accordion>

  <Accordion title="モデルと実行の制御">
    | コマンド | 説明 |
    | --- | --- |
    | `/think <level\|default>` | 思考レベルを設定するか、セッションの上書きをクリアします。エイリアス：`/thinking`、`/t` |
    | `/verbose on\|off\|full` | 詳細出力を切り替えます。エイリアス：`/v` |
    | `/trace on\|off` | 現在のセッションの Plugin トレース出力を切り替えます |
    | `/fast [status\|auto\|on\|off\|default]` | 高速モードを表示、設定、またはクリアします |
    | `/reasoning [on\|off\|stream]` | 推論の表示／非表示を切り替えます。エイリアス：`/reason` |
    | `/elevated [on\|off\|ask\|full]` | 昇格モードを切り替えます。エイリアス：`/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | exec のデフォルトを表示または設定します |
    | `/login [codex\|openai\|openai-codex]` | プライベートチャットまたは Web UI セッションから Codex／OpenAI ログインをペアリングします。オーナー／管理者のみ使用できます |
    | `/model [name\|#\|status]` | モデルを表示または設定します |
    | `/models [provider] [page] [limit=<n>\|all]` | 設定済み、または認証により利用可能なプロバイダーやモデルを一覧表示します |
    | `/queue <mode>` | アクティブな実行キューの動作を管理します。[キュー](/ja-JP/concepts/queue)と[キューのステアリング](/ja-JP/concepts/queue-steering)を参照してください |
    | `/steer <message>` | アクティブな実行にガイダンスを注入します。エイリアス：`/tell`。[ステアリング](/ja-JP/tools/steer)を参照してください |

    <AccordionGroup>
      <Accordion title="verbose／trace／fast／reasoning の安全性">
        - `/verbose` はデバッグ用です。通常の使用では**オフ**にしてください。
        - `/trace` は Plugin が所有するトレース／デバッグ行のみを表示します。通常の詳細メッセージはオフのままです。
        - `/fast auto|on|off` はセッションの上書きを永続化します。クリアするには Sessions UI の `inherit` オプションを使用します。
        - `/fast` はプロバイダー固有です。OpenAI／Codex では `service_tier=priority` にマッピングされ、Anthropic への直接リクエストでは `service_tier=auto` または `standard_only` にマッピングされます。
        - `/reasoning`、`/verbose`、`/trace` はグループ環境では危険です。内部推論や Plugin の診断情報が公開される可能性があります。グループチャットではオフにしてください。

      </Accordion>
      <Accordion title="モデル切り替えの詳細">
        - `/model` は新しいモデルを即座にセッションへ永続化します。
        - エージェントがアイドル状態の場合、次の実行からすぐに使用されます。
        - 実行中の場合、切り替えは保留としてマークされ、次のクリーンな再試行ポイントで適用されます。

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="検出と状態">
    | コマンド | 説明 |
    | --- | --- |
    | `/help` | 短いヘルプ概要を表示します |
    | `/commands` | 生成されたコマンドカタログを表示します |
    | `/tools [compact\|verbose]` | 現在のエージェントが今すぐ使用できるものを表示します |
    | `/status` | 実行／ランタイムの状態、Gateway とシステムの稼働時間、Plugin の正常性、およびプロバイダーの使用量／クォータを表示します |
    | `/status plugins` | Plugin の詳細な正常性を表示します。読み込みエラー、隔離、チャンネル Plugin の障害、依存関係の問題、互換性に関する通知が含まれます。`commands.plugins: true` が必要です |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | 現在のセッションの永続的な[目標](/ja-JP/tools/goal)を管理します |
    | `/diagnostics [note]` | オーナー専用のサポートレポートフローです。毎回 exec の承認を求めます |
    | `/openclaw <request>` | オーナーの DM から OpenClaw のセットアップおよび修復ヘルパーを実行します |
    | `/tasks` | 現在のセッションのアクティブな／最近のバックグラウンドタスクを一覧表示します |
    | `/context [list\|detail\|map\|json]` | コンテキストの構築方法を説明します |
    | `/whoami` | 送信者 ID を表示します。エイリアス：`/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | 応答ごとの使用量フッターを制御するか（`reset`／`inherit`／`clear`／`default` はセッションの上書きをクリアし、設定済みのデフォルトを再継承します）、ローカルのコスト概要を表示します |
  </Accordion>

  <Accordion title="Skills、許可リスト、承認">
    | コマンド | 説明 |
    | --- | --- |
    | `/skill <name> [input]` | 名前を指定してスキルを実行 |
    | `/learn [request]` | 現在の会話または指定したソースから、レビュー可能なスキルを1つ [Skill Workshop](/ja-JP/tools/skill-workshop) で下書き |
    | `/allowlist [list\|add\|remove] ...` | 許可リストのエントリを管理。テキストのみ |
    | `/approve <id> <decision>` | exec または Plugin の承認プロンプトを解決 |
    | `/btw <question>` | セッションコンテキストを変更せずに補足的な質問を行う。エイリアス: `/side`。[BTW](/ja-JP/tools/btw) を参照 |
  </Accordion>

  <Accordion title="サブエージェントと ACP">
    | コマンド | 説明 |
    | --- | --- |
    | `/subagents list\|log\|info` | 現在のセッションのサブエージェント実行を確認 |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP セッションとランタイムオプションを管理。ランタイム制御には外部オーナーまたは内部 Gateway 管理者のアイデンティティが必要 |
    | `/focus <target>` | 現在の Discord スレッドまたは Telegram トピックをセッションターゲットにバインド |
    | `/unfocus` | 現在のスレッドのバインドを解除 |
    | `/agents` | 現在のセッションでスレッドにバインドされているエージェントを一覧表示 |
  </Accordion>

  <Accordion title="オーナー限定の書き込みと管理">
    | コマンド | 必要条件 | 説明 |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` を読み書き。オーナー限定 |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw が管理する MCP サーバー設定を読み書き。オーナー限定 |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin の状態を確認または変更。書き込みはオーナー限定。エイリアス: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | ランタイム限定の設定オーバーライド。オーナー限定 |
    | `/restart` | `commands.restart: true`（デフォルト） | OpenClaw を再起動 |
    | `/send on\|off\|inherit` | オーナー | 送信ポリシーを設定 |
  </Accordion>

  <Accordion title="音声、TTS、チャンネル制御">
    | コマンド | 説明 |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS を制御。[TTS](/ja-JP/tools/tts) を参照 |
    | `/activation mention\|always` | グループのアクティベーションモードを設定 |
    | `/bash <command>` | ホストのシェルコマンドを実行。エイリアス: `! <command>`。`commands.bash: true` が必要 |
    | `!poll [sessionId]` | バックグラウンドの bash ジョブを確認 |
    | `!stop [sessionId]` | バックグラウンドの bash ジョブを停止 |
  </Accordion>
</AccordionGroup>

### ドックコマンド

ドックコマンドは、アクティブなセッションの返信経路を、リンクされた別のチャンネルに切り替えます。
セットアップとトラブルシューティングについては、[チャンネルのドッキング](/ja-JP/concepts/channel-docking)を参照してください。

ネイティブコマンドをサポートするチャンネル Plugin から生成されます。

- `/dock-discord`（エイリアス: `/dock_discord`）
- `/dock-mattermost`（エイリアス: `/dock_mattermost`）
- `/dock-slack`（エイリアス: `/dock_slack`）
- `/dock-telegram`（エイリアス: `/dock_telegram`）

ドックコマンドには `session.identityLinks` が必要です。送信元の送信者とターゲットのピアは、
同じアイデンティティグループに属している必要があります。

### バンドルされた Plugin のコマンド

| コマンド                                                 | 説明                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | メモリの Dreaming を切り替え（オーナーまたは Gateway 管理者）。[Dreaming](/ja-JP/concepts/dreaming)を参照                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | デバイスのペアリングを管理。[ペアリング](/ja-JP/channels/pairing)を参照                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | 高リスクの Node コマンド（カメラ／画面／コンピューター／書き込み）を一時的に有効化。[コンピューターの使用](/ja-JP/nodes/computer-use)を参照                                                                               |
| `/voice status\|list\|set <voiceId>`                    | Talk の音声設定を管理。Discord でのネイティブ名: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | LINE のリッチカードプリセットを送信。[LINE](/ja-JP/channels/line)を参照                                                                                                                                        |
| `/codex <action> ...`                                   | Codex app-server ハーネスをバインド、操作、確認（ステータス、スレッド、再開、モデル、高速化、権限、圧縮、レビュー、MCP、Skills など）。[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照 |

QQBot 限定: `/bot-ping`、`/bot-version`、`/bot-help`、`/bot-upgrade`、`/bot-logs`

### スキルコマンド

ユーザーが呼び出せるスキルは、スラッシュコマンドとして公開されます。

- `/skill <name> [input]` は、汎用エントリーポイントとして常に機能します。
- Skills は直接コマンドとして登録できます（例: OpenProse の `/prose`）。
- ネイティブスキルコマンドの登録は、`commands.nativeSkills` と
  `channels.<provider>.commands.nativeSkills` で制御されます。
- 名前は `a-z0-9_` にサニタイズされ（最大32文字）、衝突時には数字の接尾辞が付きます。

<AccordionGroup>
  <Accordion title="スキルコマンドのディスパッチ">
    デフォルトでは、スキルコマンドは通常のリクエストとしてモデルにルーティングされます。

    Skills は `command-dispatch: tool` を宣言して、ツールに直接ルーティングできます
    （決定論的で、モデルは関与しません）。例: `/prose`（OpenProse Plugin）
    — [OpenProse](/ja-JP/prose)を参照してください。

  </Accordion>
  <Accordion title="ネイティブコマンドの引数">
    Discord では、必須の引数が省略された場合、動的オプションにはオートコンプリートを、
    ボタンメニューが必要な場合にはそれを使用します。Telegram と Slack では、
    選択肢のあるコマンドにボタンメニューが表示されます。動的な選択肢はターゲットセッションのモデルに対して解決されるため、
    `/think` レベルのようなモデル固有のオプションは、セッションの `/model` オーバーライドに従います。
  </Accordion>
</AccordionGroup>

## `/tools`: エージェントが現在使用できるもの

`/tools` は、ランタイムに関する質問、つまり**この会話でこのエージェントが現在使用できるもの**に回答します。静的な設定カタログではありません。

```text
/tools         # コンパクト表示
/tools verbose # 短い説明付き
```

結果はセッション単位です。エージェント、チャンネル、スレッド、送信者の
認可、またはモデルを変更すると、出力が変わる場合があります。プロファイルとオーバーライドを編集するには、
Control UI の Tools パネルまたは設定画面を使用してください。

## `/model`: モデルの選択

```text
/model             # モデル選択画面を表示
/model list        # 同じ
/model 3           # 選択画面の番号で選択
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # セッションのモデル選択をクリア
/model status      # エンドポイントと API モードを含む詳細表示
```

Discord では、`/model` と `/models` により、プロバイダーと
モデルのドロップダウンを備えた対話型の選択画面が開きます。この選択画面は、
`provider/*` エントリを含む `agents.defaults.models` に従います。

## `/config`: ディスク上の設定への書き込み

<Note>
  オーナー限定。デフォルトでは無効です — `commands.config: true` で有効にしてください。
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

設定は書き込み前に検証されます。無効な変更は拒否されます。`/config` の
更新は再起動後も保持されます。

## `/mcp`: MCP サーバー設定

<Note>
  オーナー限定。デフォルトでは無効です — `commands.mcp: true` で有効にしてください。
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` は、組み込みエージェントのプロジェクト設定ではなく、OpenClaw の設定に保存します。
`/mcp show` は、資格情報を含むフィールド、認識された資格情報フラグの
値、および既知のシークレット形式の引数を秘匿します。グループから実行した場合、
設定はオーナーに非公開で送信されます。オーナーへの非公開経路を利用できない場合、
コマンドは安全側に失敗し、オーナーにダイレクトチャットから再試行するよう求めます。

## `/debug`: ランタイム限定のオーバーライド

<Note>
  オーナー限定。デフォルトでは無効です — `commands.debug: true` で有効にしてください。
  オーバーライドは新しい設定の読み取りに即座に適用されますが、ディスクには**書き込まれません**。
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: Plugin の管理

<Note>
  書き込みはオーナー限定。デフォルトでは無効です — `commands.plugins: true` で有効にしてください。
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

`/plugins enable|disable` は Plugin の設定を更新し、新しいエージェントターン向けに Gateway の
Plugin ランタイムをホットリロードします。`/plugins install` は Plugin のソースモジュールが変更されたため、
管理対象の Gateway を自動的に再起動します。信頼済みの ClawHub および公式カタログからのインストールには、
追加の確認は必要ありません。任意の npm、git、アーカイブ、`npm-pack:`、ローカルパスのソースでは、
出所に関する警告が表示され、ソースを確認した後、末尾に `--force` を付ける必要があります。
このフラグはソースを承認し、既存のインストールの置き換えを許可しますが、
`security.installPolicy` やインストーラーのセキュリティチェックを迂回するものではありません。リスク警告のある ClawHub リリースには、
シェル限定の別の `--acknowledge-clawhub-risk` フラグが引き続き必要です。マーケットプレイス、リンク済み、固定済みのインストールも
引き続きシェル限定です。

## `/trace`: Plugin のトレース出力

```text
/trace          # 現在のトレース状態を表示
/trace on
/trace off
```

`/trace` は、完全な詳細モードを使用せずに、セッション単位の Plugin トレース／デバッグ行を表示します。
これは、`/debug`（ランタイムオーバーライド）や `/verbose`（通常の
ツール出力）を置き換えるものではありません。

## `/btw`: 補足的な質問

`/btw` は、現在のセッションコンテキストに関する簡単な補足質問です。エイリアス: `/side`。

```text
/btw 今、何をしていますか？
/side メインの実行が続いている間に何が変わりましたか？
```

通常のメッセージとは異なり、次のように動作します。

- 現在のセッションを背景コンテキストとして使用します。
- Codex ハーネスセッションでは、一時的な Codex の補足スレッドとして実行されます。
- 今後のセッションコンテキストを**変更しません**。
- トランスクリプト履歴には書き込まれません。

完全な動作については、[BTW の補足質問](/ja-JP/tools/btw)を参照してください。

## サーフェスに関する注記

<AccordionGroup>
  <Accordion title="サーフェスごとのセッションスコープ">
    - **テキストコマンド:** 通常のチャットセッションで実行されます（DM は `main` を共有し、グループには独自のセッションがあります）。
    - **Discord のネイティブコマンド:** `agent:<agentId>:discord:slash:<userId>`
    - **Slack のネイティブコマンド:** `agent:<agentId>:slack:slash:<userId>`（プレフィックスは `channels.slack.slashCommand.sessionPrefix` で設定可能）
    - **Telegram のネイティブコマンド:** `telegram:slash:<userId>`（`CommandTargetSessionKey` を介してチャットセッションをターゲットにします）
    - **`/login codex`** は、デバイスのペアリングコードをプライベートチャットまたは Web UI の応答経路でのみ送信します。Telegram のグループ／トピックから呼び出した場合は、代わりにボットへ DM するようオーナーに求めます。
    - **`/stop`** は、現在の実行を中止するためにアクティブなチャットセッションをターゲットにします。

  </Accordion>
  <Accordion title="Slack 固有の事項">
    `channels.slack.slashCommand` は、単一の `/openclaw` 形式のコマンドをサポートします。
    `commands.native: true` では、組み込みコマンドごとに Slack スラッシュコマンドを1つ作成します。
    Slack が `/status` を予約しているため、`/agentstatus`（`/status` ではなく）を登録してください。
    Slack メッセージ内では、テキスト `/status` も引き続き機能します。
  </Accordion>
  <Accordion title="高速処理とインラインショートカット">
    - 許可リストに登録された送信者からのコマンドのみのメッセージは、即座に処理されます（キューとモデルをバイパスします）。
    - インラインショートカット（`/help`、`/commands`、`/status`、`/whoami`）は通常のメッセージ内に埋め込んでも機能し、残りのテキストをモデルが認識する前に除去されます。
    - 許可されていないコマンドのみのメッセージは通知なく無視されます。インラインの `/...` トークンはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="引数に関する注意事項">
    - コマンドでは、コマンドと引数の間に任意の `:` を指定できます（`/think: high`、`/send: on`）。
    - `/new <model>` はモデルのエイリアス、`provider/model`、またはプロバイダー名（あいまい一致）を受け付けます。一致しない場合、そのテキストはメッセージ本文として扱われます。
    - `/allowlist add|remove` には `commands.config: true` が必要で、チャンネルの `configWrites` に従います。

  </Accordion>
</AccordionGroup>

## プロバイダーの使用量とステータス

- 使用量追跡が有効な場合、現在のモデルプロバイダーの**プロバイダー使用量／クォータ**（例：「Claude 残り80%」）が `/status` に表示されます。
- ライブセッションのスナップショットに情報が少ない場合、`/status` の**トークン／キャッシュ行**では、最新のトランスクリプト使用量エントリを代わりに使用できます。
- **実行とランタイムの違い：** `/status` は、有効なサンドボックスパスを `Execution` として、セッションの実行主体（`OpenClaw Default`、`OpenAI Codex`、CLI バックエンド、または ACP バックエンド）を `Runtime` として報告します。
- **応答ごとのトークン数／コスト：** `/usage off|tokens|full` で制御します。
- `/model status` はモデル、認証、エンドポイントに関するものであり、使用量に関するものではありません。

## 関連項目

<CardGroup cols={2}>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="puzzle-piece">
    Skills のスラッシュコマンドを登録し、利用を制御する方法。
  </Card>
  <Card title="Skills の作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    独自のスラッシュコマンドを登録する Skills を作成します。
  </Card>
  <Card title="BTW" href="/ja-JP/tools/btw" icon="comments">
    セッションのコンテキストを変更せずに補足的な質問をします。
  </Card>
  <Card title="誘導" href="/ja-JP/tools/steer" icon="compass">
    実行中に `/steer` を使用してエージェントを誘導します。
  </Card>
</CardGroup>
