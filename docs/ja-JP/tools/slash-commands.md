---
read_when:
    - チャットコマンドの使用または設定
    - コマンドルーティングまたは権限のデバッグ
    - スキルコマンドの登録方法を理解する
sidebarTitle: Slash commands
summary: 利用可能なすべてのスラッシュコマンド、ディレクティブ、インラインショートカット — 設定、ルーティング、各サーフェスでの動作。
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-07-12T14:53:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0017f229610ff5b1f4ff4a11a77814575835cfd07c7d4dbcce8b0d51ed4f4dd1
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway は、`/` で始まる単独メッセージとして送信されたコマンドを処理します。
ホスト専用の bash コマンドでは `! <cmd>` を使用します（`/bash <cmd>` はエイリアスです）。

会話が ACP セッションにバインドされている場合、通常のテキストは ACP
ハーネスにルーティングされます。Gateway 管理コマンドはローカルに留まります。`/acp ...` は常に
OpenClaw コマンドハンドラーに到達し、そのサーフェスでコマンド処理が有効な場合、
`/status` と `/unfocus` もローカルに留まります。

## 3 種類のコマンド

<CardGroup cols={3}>
  <Card title="コマンド" icon="terminal">
    Gateway が処理する単独の `/...` メッセージです。メッセージ内の
    唯一の内容として送信する必要があります。
  </Card>
  <Card title="ディレクティブ" icon="sliders">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、
    `/exec`、`/model`、`/queue` — モデルがメッセージを確認する前に
    除去されます。単独で送信するとセッション設定を保持し、他のテキストと
    一緒に送信するとインラインヒントとして機能します。
  </Card>
  <Card title="インラインショートカット" icon="bolt">
    `/help`、`/commands`、`/status`、`/whoami` — 即座に実行され、
    モデルが残りのテキストを確認する前に除去されます。承認済みの送信者のみ使用できます。
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="ディレクティブの動作の詳細">
    - ディレクティブは、モデルがメッセージを確認する前に除去されます。
    - **ディレクティブのみ**のメッセージ（メッセージの内容がディレクティブのみ）では、
      セッションに保持され、確認応答が返されます。
    - 他のテキストを含む**通常のチャット**メッセージでは、インラインヒントとして機能し、
      セッション設定は保持**されません**。
    - ディレクティブは**承認済みの送信者**にのみ適用されます。`commands.allowFrom` が
      設定されている場合は、それが唯一使用される許可リストです。それ以外の場合、承認は
      チャンネルの許可リスト／ペアリングと `commands.useAccessGroups` に基づきます。未承認の
      送信者からのディレクティブはプレーンテキストとして扱われます。
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
  ネイティブコマンドを登録します。自動設定：Discord／Telegram ではオン、Slack ではオフです。
  ネイティブ対応のないプロバイダーでは無視されます。チャンネルごとに
  `channels.<provider>.commands.native` で上書きできます。Discord では、`false` にすると
  スラッシュコマンドの登録がスキップされます。以前に登録されたコマンドは、削除されるまで
  表示されたままになる場合があります。
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  対応している場合、スキルコマンドをネイティブに登録します。自動設定：Discord／Telegram
  ではオン、Slack ではオフです。`channels.<provider>.commands.nativeSkills` で
  上書きできます。
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` によるホストのシェルコマンド実行を有効にします（`/bash <cmd>` はエイリアスです）。
  `tools.elevated` の許可リストが必要です。
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash がバックグラウンドモードへ切り替えるまで待機する時間です（`0` の場合は
  直ちにバックグラウンドへ移行します）。
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config`（`openclaw.json` の読み取り／書き込み）を有効にします。オーナーのみ使用できます。
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp`（`mcp.servers` 配下の OpenClaw 管理 MCP 設定の読み取り／書き込み）を有効にします。オーナーのみ使用できます。
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins`（Plugin の検出／状態確認、およびインストールと有効化／無効化）を有効にします。書き込みはオーナーのみ実行できます。
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug`（ランタイム限定の設定上書き）を有効にします。オーナーのみ使用できます。
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` と Gateway 再起動ツールのアクションを有効にします。
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  オーナー専用コマンドサーフェス用の明示的なオーナー許可リストです。
  `commands.allowFrom` および DM ペアリングアクセスとは別です。
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  チャンネルごとに、オーナー専用コマンドにオーナー ID を必須とします。`true` の場合、
  送信者は `commands.ownerAllowFrom` に一致するか、内部の `operator.admin`
  スコープを保持している必要があります。ワイルドカードの `allowFrom` エントリだけでは**不十分**です。
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  システムプロンプトで所有者 ID をどのように表示するかを制御します。
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"` の場合に使用される HMAC シークレットです。
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  コマンド認可用のプロバイダー別許可リストです。設定されている場合、コマンドとディレクティブに対する
  **唯一の**認可ソースになります。グローバルなデフォルトには `"*"` を使用します。プロバイダー固有のキーが
  それを上書きします。
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` が設定されていない場合に、コマンドへ許可リストとポリシーを適用します。
</ParamField>

## コマンド一覧

コマンドは次の 3 つのソースから提供されます。

- **コア組み込みコマンド:** `src/auto-reply/commands-registry.shared.ts`
- **生成された dock コマンド:** `src/auto-reply/commands-registry.data.ts`
- **Plugin コマンド:** Plugin による `registerCommand()` 呼び出し

利用可否は、設定フラグ、チャンネルのサーフェス、およびインストール済みかつ有効化された
Plugin によって決まります。

### コアコマンド

  <AccordionGroup>
  <Accordion title="セッションと実行">
    | コマンド | 説明 |
    | --- | --- |
    | `/new [model]` | 現在のセッションをアーカイブし、新しいセッションを開始します |
    | `/reset [soft [message]]` | 現在のセッションをその場でリセットします。`soft` はトランスクリプトを保持し、再利用されている CLI バックエンドのセッション ID を破棄して、起動処理を再実行します |
    | `/name <title>` | 現在のセッションに名前を付けるか、名前を変更します。タイトルを省略すると、現在の名前と候補が表示されます |
    | `/compact [instructions]` | セッションのコンテキストを圧縮します。[Compaction](/ja-JP/concepts/compaction)を参照してください |
    | `/stop` | 現在の実行を中止します |
    | `/session idle <duration\|off>` | スレッドバインディングのアイドル有効期限を管理します |
    | `/session max-age <duration\|off>` | スレッドバインディングの最大有効期間による期限切れを管理します |
    | `/export-session [path]` | 現在のセッションを HTML にエクスポートします。エイリアス: `/export` |
    | `/export-trajectory [path]` | 現在のセッションの JSONL 軌跡バンドルをエクスポートします。エイリアス: `/trajectory` |

    <Note>
      コントロール UI は、入力された `/new` をインターセプトして、新しい
      ダッシュボードセッションを作成し、そのセッションに切り替えます。ただし、`session.dmScope: "main"` が設定され、
      現在の親がエージェントのメインセッションである場合は、`/new` によって
      メインセッションがその場でリセットされます。入力された `/reset` では、引き続き Gateway の
      インプレースリセットが実行されます。セッションに固定されたモデルの選択を解除する場合は、
      `/model default` を使用してください。
    </Note>

  </Accordion>

  <Accordion title="モデルと実行の制御">
    | コマンド | 説明 |
    | --- | --- |
    | `/think <level\|default>` | 思考レベルを設定するか、セッションのオーバーライドを解除します。エイリアス: `/thinking`、`/t` |
    | `/verbose on\|off\|full` | 詳細出力を切り替えます。エイリアス: `/v` |
    | `/trace on\|off` | 現在のセッションの Plugin トレース出力を切り替えます |
    | `/fast [status\|auto\|on\|off\|default]` | 高速モードを表示、設定、または解除します |
    | `/reasoning [on\|off\|stream]` | 推論の表示を切り替えます。エイリアス: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | 昇格モードを切り替えます。エイリアス: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | exec のデフォルトを表示または設定します |
    | `/login [codex\|openai\|openai-codex]` | プライベートチャットまたは Web UI セッションから Codex/OpenAI ログインをペアリングします。オーナーまたは管理者のみ |
    | `/model [name\|#\|status]` | モデルを表示または設定します |
    | `/models [provider] [page] [limit=<n>\|all]` | 設定済み、または認証により利用可能なプロバイダーやモデルを一覧表示します |
    | `/queue <mode>` | アクティブな実行キューの動作を管理します。[キュー](/ja-JP/concepts/queue)および[キューのステアリング](/ja-JP/concepts/queue-steering)を参照してください |
    | `/steer <message>` | アクティブな実行に指示を挿入します。エイリアス: `/tell`。[ステアリング](/ja-JP/tools/steer)を参照してください |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning の安全性">
        - `/verbose` はデバッグ用です。通常の使用では **オフ** にしてください。
        - `/trace` は Plugin が所有するトレース行とデバッグ行のみを表示します。通常の詳細メッセージはオフのままです。
        - `/fast auto|on|off` はセッションのオーバーライドを保持します。解除するには、セッション UI の `inherit` オプションを使用してください。
        - `/fast` はプロバイダー固有です。OpenAI/Codex では `service_tier=priority` に対応し、Anthropic への直接リクエストでは `service_tier=auto` または `standard_only` に対応します。
        - `/reasoning`、`/verbose`、`/trace` はグループ環境では危険です。内部推論や Plugin の診断情報が公開される可能性があります。グループチャットではオフにしてください。

      </Accordion>
      <Accordion title="モデル切り替えの詳細">
        - `/model` は新しいモデルをただちにセッションへ保存します。
        - エージェントがアイドル状態の場合、次の実行ですぐに使用されます。
        - 実行中の場合、切り替えは保留中としてマークされ、次の正常な再試行ポイントで適用されます。

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="検出とステータス">
    | コマンド | 説明 |
    | --- | --- |
    | `/help` | 短いヘルプ概要を表示します |
    | `/commands` | 生成されたコマンドカタログを表示します |
    | `/tools [compact\|verbose]` | 現在のエージェントが今すぐ使用できるものを表示します |
    | `/status` | 実行／ランタイムのステータス、Gateway とシステムの稼働時間、Plugin の健全性、プロバイダーの使用量／クォータを表示します |
    | `/status plugins` | Plugin の詳細な健全性（読み込みエラー、隔離、チャンネル Plugin の障害、依存関係の問題、互換性に関する通知）を表示します。`commands.plugins: true` が必要です |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | 現在のセッションの永続的な[目標](/ja-JP/tools/goal)を管理します |
    | `/diagnostics [note]` | 所有者専用のサポートレポートフローです。毎回、実行の承認を求めます |
    | `/crestodian <request>` | 所有者の DM から Crestodian のセットアップおよび修復ヘルパーを実行します |
    | `/tasks` | 現在のセッションのアクティブな／最近のバックグラウンドタスクを一覧表示します |
    | `/context [list\|detail\|map\|json]` | コンテキストがどのように構成されるかを説明します |
    | `/whoami` | 送信者 ID を表示します。エイリアス: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | 応答ごとの使用量フッターを制御するか（`reset`/`inherit`/`clear`/`default` はセッションのオーバーライドを解除し、設定済みのデフォルトを再継承します）、ローカルのコスト概要を表示します |
  </Accordion>

  <Accordion title="Skills、許可リスト、承認">
    | コマンド | 説明 |
    | --- | --- |
    | `/skill <name> [input]` | 名前を指定してスキルを実行します |
    | `/learn [request]` | 現在の会話または指定したソースから、[Skill Workshop](/ja-JP/tools/skill-workshop)を通じてレビュー可能なスキルを 1 つ下書きします |
    | `/allowlist [list\|add\|remove] ...` | 許可リストのエントリを管理します。テキストのみ |
    | `/approve <id> <decision>` | 実行または Plugin の承認プロンプトを解決します |
    | `/btw <question>` | セッションのコンテキストを変更せずに補足的な質問をします。エイリアス: `/side`。[BTW](/ja-JP/tools/btw)を参照してください |
  </Accordion>

  <Accordion title="サブエージェントと ACP">
    | コマンド | 説明 |
    | --- | --- |
    | `/subagents list\|log\|info` | 現在のセッションのサブエージェント実行を確認する |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP セッションとランタイムオプションを管理する。ランタイム制御には、外部の所有者または内部の Gateway 管理者 ID が必要 |
    | `/focus <target>` | 現在の Discord スレッドまたは Telegram トピックをセッションターゲットに関連付ける |
    | `/unfocus` | 現在のスレッドの関連付けを解除する |
    | `/agents` | 現在のセッションでスレッドに関連付けられたエージェントを一覧表示する |
  </Accordion>

  <Accordion title="所有者限定の書き込みと管理">
    | コマンド | 要件 | 説明 |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` を読み書きする。所有者限定 |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw が管理する MCP サーバー設定を読み書きする。所有者限定 |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin の状態を確認または変更する。書き込みは所有者限定。エイリアス: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | ランタイム限定の設定オーバーライド。所有者限定 |
    | `/restart` | `commands.restart: true`（デフォルト） | OpenClaw を再起動する |
    | `/send on\|off\|inherit` | 所有者 | 送信ポリシーを設定する |
  </Accordion>

  <Accordion title="音声、TTS、チャンネル制御">
    | コマンド | 説明 |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS を制御する。[TTS](/ja-JP/tools/tts) を参照 |
    | `/activation mention\|always` | グループのアクティベーションモードを設定する |
    | `/bash <command>` | ホストのシェルコマンドを実行する。エイリアス: `! <command>`。`commands.bash: true` が必要 |
    | `!poll [sessionId]` | バックグラウンドの bash ジョブを確認する |
    | `!stop [sessionId]` | バックグラウンドの bash ジョブを停止する |
  </Accordion>
</AccordionGroup>

### ドックコマンド

ドックコマンドは、アクティブなセッションの返信経路を、リンクされた別のチャンネルへ切り替えます。
設定とトラブルシューティングについては、[チャンネルドッキング](/ja-JP/concepts/channel-docking)を参照してください。

ネイティブコマンドをサポートするチャンネル Plugin から生成されます。

- `/dock-discord`（エイリアス: `/dock_discord`）
- `/dock-mattermost`（エイリアス: `/dock_mattermost`）
- `/dock-slack`（エイリアス: `/dock_slack`）
- `/dock-telegram`（エイリアス: `/dock_telegram`）

ドックコマンドには `session.identityLinks` が必要です。送信元の送信者とターゲットのピアは、
同じ ID グループに属している必要があります。

### バンドルされた Plugin のコマンド

| コマンド                                                | 説明                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | メモリの Dreaming を切り替える（所有者または Gateway 管理者）。[Dreaming](/ja-JP/concepts/dreaming)を参照                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | デバイスのペアリングを管理する。[ペアリング](/ja-JP/channels/pairing)を参照                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | リスクの高い Node コマンド（カメラ／画面／コンピューター／書き込み）を一時的に有効化する。[コンピューター操作](/nodes/computer-use)を参照                                                                               |
| `/voice status\|list\|set <voiceId>`                    | Talk の音声設定を管理する。Discord でのネイティブ名: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | LINE のリッチカードプリセットを送信する。[LINE](/ja-JP/channels/line)を参照                                                                                                                                        |
| `/codex <action> ...`                                   | Codex app-server ハーネスを関連付け、操作し、確認する（ステータス、スレッド、再開、モデル、高速化、権限、圧縮、レビュー、MCP、Skills など）。[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照 |

QQBot 限定: `/bot-ping`、`/bot-version`、`/bot-help`、`/bot-upgrade`、`/bot-logs`

### Skill コマンド

ユーザーが呼び出せる Skills は、スラッシュコマンドとして公開されます。

- `/skill <name> [input]` は汎用エントリーポイントとして常に機能します。
- Skills は直接コマンドとして登録できます（例: OpenProse の `/prose`）。
- ネイティブ Skill コマンドの登録は `commands.nativeSkills` と
  `channels.<provider>.commands.nativeSkills` で制御されます。
- 名前は `a-z0-9_` にサニタイズされ（最大 32 文字）、競合した場合は数値のサフィックスが付加されます。

<AccordionGroup>
  <Accordion title="Skill コマンドのディスパッチ">
    デフォルトでは、Skill コマンドは通常のリクエストとしてモデルにルーティングされます。

    Skills は `command-dispatch: tool` を宣言することで、ツールへ直接ルーティングできます
    （決定論的で、モデルは関与しません）。例: `/prose`（OpenProse Plugin）
    — [OpenProse](/ja-JP/prose)を参照してください。

  </Accordion>
  <Accordion title="ネイティブコマンドの引数">
    Discord は、必須引数が省略された場合、動的オプションにはオートコンプリートを、
    ボタンメニューには必要に応じてボタンメニューを使用します。Telegram と Slack は、
    選択肢のあるコマンドにボタンメニューを表示します。動的な選択肢はターゲットセッションのモデルに対して解決されるため、
    `/think` レベルなどのモデル固有オプションは、セッションの `/model` オーバーライドに従います。
  </Accordion>
</AccordionGroup>

## `/tools`: エージェントが現在使用できるもの

`/tools` はランタイムに関する問い、つまり**この会話で、このエージェントが今すぐ使用できるもの**
に答えます。静的な設定カタログではありません。

```text
/tools         # コンパクト表示
/tools verbose # 短い説明付き
```

結果はセッション単位です。エージェント、チャンネル、スレッド、送信者の
認可、またはモデルを変更すると、出力が変わる可能性があります。プロファイルとオーバーライドを編集するには、
Control UI の Tools パネルまたは設定サーフェスを使用してください。

## `/model`: モデルの選択

```text
/model             # モデルピッカーを表示
/model list        # 同じ
/model 3           # ピッカーの番号で選択
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # セッションのモデル選択をクリア
/model status      # エンドポイントと API モードを含む詳細表示
```

Discord では、`/model` と `/models` によって、プロバイダーと
モデルのドロップダウンを備えた対話型ピッカーが開きます。ピッカーは、
`provider/*` エントリを含む `agents.defaults.models` に従います。

## `/config`: ディスク上の設定への書き込み

<Note>
  所有者限定。デフォルトでは無効です。`commands.config: true` で有効にします。
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
  所有者限定。デフォルトでは無効です。`commands.mcp: true` で有効にします。
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` は、組み込みエージェントのプロジェクト設定ではなく、OpenClaw の設定に構成を保存します。
`/mcp show` は、認証情報を含むフィールド、認識された認証情報フラグの
値、および既知のシークレット形式の引数をマスキングします。グループから実行された場合、
設定は所有者へ非公開で送信されます。所有者への非公開経路が
利用できない場合、コマンドは安全側に失敗し、ダイレクト
チャットから再試行するよう所有者に求めます。

## `/debug`: ランタイム限定のオーバーライド

<Note>
  所有者限定。デフォルトでは無効です。`commands.debug: true` で有効にします。
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
  書き込みは所有者限定。デフォルトでは無効です。`commands.plugins: true` で有効にします。
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` は Plugin の設定を更新し、新しいエージェントターン向けに Gateway の
Plugin ランタイムをホットリロードします。`/plugins install` は Plugin のソースモジュールが
変更されたため、管理対象の Gateway を自動的に再起動します。

## `/trace`: Plugin のトレース出力

```text
/trace          # 現在のトレース状態を表示
/trace on
/trace off
```

`/trace` は、完全な詳細モードを有効にすることなく、セッション単位の Plugin トレース／デバッグ行を
表示します。これは `/debug`（ランタイムオーバーライド）や `/verbose`（通常の
ツール出力）の代替ではありません。

## `/btw`: 補足的な質問

`/btw` は、現在のセッションコンテキストに関する簡単な補足質問です。エイリアス: `/side`。

```text
/btw 今、何をしていますか？
/side メインの実行が続いている間に何が変わりましたか？
```

通常のメッセージとは異なり、次のように動作します。

- 現在のセッションを背景コンテキストとして使用します。
- Codex ハーネスセッションでは、一時的な Codex サイドスレッドとして実行されます。
- 以降のセッションコンテキストを変更**しません**。
- トランスクリプト履歴には書き込まれません。

完全な動作については、[BTW の補足質問](/ja-JP/tools/btw)を参照してください。

## サーフェスに関する注記

<AccordionGroup>
  <Accordion title="サーフェスごとのセッションスコープ">
    - **テキストコマンド:** 通常のチャットセッションで実行されます（DM は `main` を共有し、グループは独自のセッションを持ちます）。
    - **Discord のネイティブコマンド:** `agent:<agentId>:discord:slash:<userId>`
    - **Slack のネイティブコマンド:** `agent:<agentId>:slack:slash:<userId>`（プレフィックスは `channels.slack.slashCommand.sessionPrefix` で設定可能）
    - **Telegram のネイティブコマンド:** `telegram:slash:<userId>`（`CommandTargetSessionKey` を介してチャットセッションをターゲットにします）
    - **`/login codex`** は、非公開チャットまたは Web UI の応答経路を通じてのみデバイスペアリングコードを送信します。Telegram のグループ／トピックから呼び出した場合は、代わりにボットへ DM するよう所有者に求めます。
    - **`/stop`** は、現在の実行を中止するためにアクティブなチャットセッションをターゲットにします。

  </Accordion>
  <Accordion title="Slack 固有の事項">
    `channels.slack.slashCommand` は、単一の `/openclaw` 形式のコマンドをサポートします。
    `commands.native: true` の場合、組み込みコマンドごとに Slack のスラッシュコマンドを 1 つ作成します。
    Slack は `/status` を予約しているため、`/agentstatus`（`/status` ではありません）を登録してください。
    テキストの `/status` は、Slack メッセージ内で引き続き機能します。
  </Accordion>
  <Accordion title="高速パスとインラインショートカット">
    - 許可リストに登録された送信者からのコマンドのみのメッセージは、即座に処理されます（キューとモデルをバイパスします）。
    - インラインショートカット（`/help`、`/commands`、`/status`、`/whoami`）は通常のメッセージに埋め込まれていても機能し、残りのテキストをモデルが確認する前に削除されます。
    - 認可されていないコマンドのみのメッセージは通知なく無視されます。インラインの `/...` トークンはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="引数に関する注記">
    - コマンドと引数の間には、オプションで `:` を使用できます（`/think: high`、`/send: on`）。
    - `/new <model>` は、モデルのエイリアス、`provider/model`、またはプロバイダー名（あいまい一致）を受け付けます。一致しない場合、そのテキストはメッセージ本文として扱われます。
    - `/allowlist add|remove` には `commands.config: true` が必要で、チャンネルの `configWrites` に従います。

  </Accordion>
</AccordionGroup>

## プロバイダーの使用状況とステータス

- **プロバイダーの使用量/クォータ**（例:「Claude 残り 80%」）は、使用量追跡が有効な場合、現在のモデルプロバイダーについて `/status` に表示されます。
- `/status` の**トークン/キャッシュ行**は、ライブセッションのスナップショットに情報が少ない場合、最新のトランスクリプト使用量エントリにフォールバックできます。
- **実行環境とランタイム:** `/status` は、有効なサンドボックスパスを `Execution` として、セッションの実行主体を `Runtime` として報告します。実行主体は `OpenClaw Default`、`OpenAI Codex`、CLI バックエンド、または ACP バックエンドです。
- **応答ごとのトークン数/コスト:** `/usage off|tokens|full` で制御します。
- `/model status` はモデル/認証/エンドポイントに関するものであり、使用量に関するものではありません。

## 関連項目

<CardGroup cols={2}>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="puzzle-piece">
    Skills のスラッシュコマンドが登録され、使用可否を制御される仕組み。
  </Card>
  <Card title="Skillsの作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    独自のスラッシュコマンドを登録する Skills を作成します。
  </Card>
  <Card title="BTW" href="/ja-JP/tools/btw" icon="comments">
    セッションコンテキストを変更せずに補足的な質問をします。
  </Card>
  <Card title="Steer" href="/ja-JP/tools/steer" icon="compass">
    `/steer` を使用して、実行中にエージェントを誘導します。
  </Card>
</CardGroup>
