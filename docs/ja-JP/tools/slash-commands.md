---
read_when:
    - チャットコマンドの使用または設定
    - コマンドルーティングまたは権限のデバッグ
    - スキルコマンドが登録される仕組みを理解する
sidebarTitle: Slash commands
summary: 利用可能なすべてのスラッシュコマンド、ディレクティブ、インラインショートカット — 設定、ルーティング、サーフェスごとの挙動。
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-07-01T20:13:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f9b74740baad038d667ccb8d80fc46af686111785b585ea1cb8cde13f41d98f
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway は、`/` で始まる単独メッセージとして送信されたコマンドを処理します。
ホスト専用の bash コマンドは `! <cmd>` を使用します（`/bash <cmd>` はエイリアス）。

会話が ACP セッションにバインドされている場合、通常のテキストは ACP
ハーネスにルーティングされます。Gateway 管理コマンドはローカルのままです。`/acp ...` は常に
OpenClaw コマンドハンドラーに届き、サーフェスでコマンド処理が有効な場合は
`/status` と `/unfocus` もローカルにとどまります。

## 3 種類のコマンド

<CardGroup cols={3}>
  <Card title="コマンド" icon="terminal">
    Gateway によって処理される単独の `/...` メッセージです。メッセージ内の
    唯一の内容として送信する必要があります。
  </Card>
  <Card title="ディレクティブ" icon="sliders">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、
    `/exec`、`/model`、`/queue` — モデルが見る前にメッセージから削除されます。
    単独で送信された場合はセッション設定を永続化し、他のテキストと一緒に
    送信された場合はインラインヒントとして機能します。
  </Card>
  <Card title="インラインショートカット" icon="bolt">
    `/help`、`/commands`、`/status`、`/whoami` — すぐに実行され、
    モデルが残りのテキストを見る前に削除されます。許可された送信者のみ。
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="ディレクティブ動作の詳細">
    - ディレクティブは、モデルが見る前にメッセージから削除されます。
    - **ディレクティブのみ**のメッセージ（メッセージがディレクティブだけの場合）では、
      セッションに永続化され、確認応答で返信します。
    - 他のテキストを含む**通常チャット**メッセージでは、インラインヒントとして機能し、
      セッション設定は永続化**されません**。
    - ディレクティブは**許可された送信者**にのみ適用されます。`commands.allowFrom`
      が設定されている場合、それが使用される唯一の許可リストです。それ以外の場合、
      認可はチャンネルの許可リスト/ペアリングと `commands.useAccessGroups` に由来します。許可されていない
      送信者のディレクティブはプレーンテキストとして扱われます。
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
  `false` に設定されている場合でもテキストコマンドは機能します。
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ネイティブコマンドを登録します。Auto: Discord/Telegram ではオン、Slack ではオフ、
  ネイティブ対応のないプロバイダーでは無視されます。チャンネルごとに
  `channels.<provider>.commands.native` で上書きします。Discord では、`false` はスラッシュコマンドの
  登録をスキップします。以前登録されたコマンドは削除されるまで表示されたままになる場合があります。
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  対応している場合、Skills コマンドをネイティブに登録します。Auto: 
  Discord/Telegram ではオン、Slack ではオフ。`channels.<provider>.commands.nativeSkills`
  で上書きします。
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` によるホストシェルコマンドの実行を有効にします（`/bash <cmd>` エイリアス）。
  `tools.elevated` 許可リストが必要です。
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash がバックグラウンドモードへ切り替わるまで待つ時間です（`0` は
  ただちにバックグラウンド化します）。
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config` を有効にします（`openclaw.json` の読み書き）。オーナー専用。
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP 設定の読み書き）。オーナー専用。
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` を有効にします（Plugin の検出/状態に加え、インストールと有効化/無効化）。書き込みはオーナー専用。
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` を有効にします（ランタイム専用の設定上書き）。オーナー専用。
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` と Gateway 再起動ツールアクションを有効にします。
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  オーナー専用コマンドサーフェスの明示的なオーナー許可リストです。
  `commands.allowFrom` および DM ペアリングアクセスとは別です。
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  チャンネルごとの設定: オーナー専用コマンドにオーナー ID を要求します。`true` の場合、
  送信者は `commands.ownerAllowFrom` に一致するか、内部 `operator.admin`
  スコープを保持している必要があります。ワイルドカードの `allowFrom` エントリだけでは**不十分**です。
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  システムプロンプト内でオーナー ID がどのように表示されるかを制御します。
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"` の場合に使用される HMAC シークレットです。
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  コマンド認可のプロバイダーごとの許可リストです。設定されている場合、コマンドとディレクティブの
  **唯一の**認可ソースになります。グローバルデフォルトには `"*"` を使用し、
  プロバイダー固有のキーがそれを上書きします。
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` が設定されていない場合、コマンドに対して許可リスト/ポリシーを適用します。
</ParamField>

## コマンド一覧

コマンドは 3 つのソースから来ます。

- **コア組み込み:** `src/auto-reply/commands-registry.shared.ts`
- **生成済み dock コマンド:** `src/auto-reply/commands-registry.data.ts`
- **Plugin コマンド:** Plugin の `registerCommand()` 呼び出し

利用可否は、設定フラグ、チャンネルサーフェス、インストール済み/有効化済みの
Plugin によって異なります。

### コアコマンド

<AccordionGroup>
  <Accordion title="セッションと実行">
    | コマンド | 説明 |
    | --- | --- |
    | `/new [model]` | 現在のセッションをアーカイブし、新しいセッションを開始します |
    | `/reset [soft [message]]` | 現在のセッションをその場でリセットします。`soft` はトランスクリプトを保持し、再利用された CLI バックエンドセッション ID を破棄し、起動処理を再実行します |
    | `/name <title>` | 現在のセッションに名前を付ける、または名前を変更します。現在の名前と候補を見るにはタイトルを省略します |
    | `/compact [instructions]` | セッションコンテキストを圧縮します。[Compaction](/ja-JP/concepts/compaction) を参照してください |
    | `/stop` | 現在の実行を中止します |
    | `/session idle <duration\|off>` | スレッドバインディングのアイドル期限を管理します |
    | `/session max-age <duration\|off>` | スレッドバインディングの最大有効期限を管理します |
    | `/export-session [path]` | 現在のセッションを HTML にエクスポートします。エイリアス: `/export` |
    | `/export-trajectory [path]` | 現在のセッションの JSONL trajectory バンドルをエクスポートします。エイリアス: `/trajectory` |

    <Note>
      Control UI は、入力された `/new` をインターセプトして新しい
      ダッシュボードセッションを作成し、それに切り替えます。ただし、`session.dmScope: "main"` が設定されていて、
      現在の親がエージェントのメインセッションである場合を除きます。その場合、`/new` は
      メインセッションをその場でリセットします。入力された `/reset` は引き続き Gateway の
      その場でのリセットを実行します。固定されたセッションモデル選択をクリアしたい場合は
      `/model default` を使用してください。
    </Note>

  </Accordion>

  <Accordion title="モデルと実行の制御">
    | コマンド | 説明 |
    | --- | --- |
    | `/think <level\|default>` | 思考レベルを設定するか、セッション上書きをクリアします。エイリアス: `/thinking`、`/t` |
    | `/verbose on\|off\|full` | 詳細出力を切り替えます。エイリアス: `/v` |
    | `/trace on\|off` | 現在のセッションの Plugin トレース出力を切り替えます |
    | `/fast [status\|auto\|on\|off\|default]` | fast モードを表示、設定、またはクリアします |
    | `/reasoning [on\|off\|stream]` | reasoning の可視性を切り替えます。エイリアス: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | elevated モードを切り替えます。エイリアス: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | exec のデフォルトを表示または設定します |
    | `/login [codex\|openai\|openai-codex]` | プライベートチャットまたは Web UI セッションから Codex/OpenAI ログインをペアリングします。オーナー/管理者のみ |
    | `/model [name\|#\|status]` | モデルを表示または設定します |
    | `/models [provider] [page] [limit=<n>\|all]` | 設定済み/認証利用可能なプロバイダーまたはモデルを一覧表示します |
    | `/queue <mode>` | アクティブ実行のキュー動作を管理します。[キュー](/ja-JP/concepts/queue) と [キュー制御](/ja-JP/concepts/queue-steering) を参照してください |
    | `/steer <message>` | アクティブ実行にガイダンスを注入します。エイリアス: `/tell`。[制御](/ja-JP/tools/steer) を参照してください |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning の安全性">
        - `/verbose` はデバッグ用です。通常使用では**オフ**にしてください。
        - `/trace` は Plugin 所有のトレース/デバッグ行のみを公開します。通常の詳細なおしゃべりはオフのままです。
        - `/fast auto|on|off` はセッション上書きを永続化します。クリアするには Sessions UI の `inherit` オプションを使用します。
        - `/fast` はプロバイダー固有です。OpenAI/Codex はこれを `service_tier=priority` にマップし、直接の Anthropic リクエストは `service_tier=auto` または `standard_only` にマップします。
        - `/reasoning`、`/verbose`、`/trace` はグループ設定ではリスクがあります。内部 reasoning や Plugin 診断を公開する可能性があります。グループチャットではオフにしてください。

      </Accordion>
      <Accordion title="モデル切り替えの詳細">
        - `/model` は新しいモデルをただちにセッションへ永続化します。
        - エージェントがアイドル状態の場合、次の実行ですぐに使用されます。
        - 実行がアクティブな場合、切り替えは保留としてマークされ、次のクリーンな再試行ポイントで適用されます。

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="検出と状態">
    | コマンド | 説明 |
    | --- | --- |
    | `/help` | 短いヘルプ概要を表示します |
    | `/commands` | 生成されたコマンドカタログを表示します |
    | `/tools [compact\|verbose]` | 現在のエージェントが今すぐ使用できるものを表示します |
    | `/status` | 実行/ランタイム状態、Gateway とシステムの稼働時間、Plugin の健全性、さらにプロバイダーの使用量/クォータを表示します |
    | `/status plugins` | 詳細な Plugin 健全性を表示します: 読み込みエラー、隔離、チャンネル障害、依存関係の問題、互換性通知 |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | 現在のセッションの永続的な [goal](/ja-JP/tools/goal) を管理します |
    | `/diagnostics [note]` | オーナー専用のサポートレポートフローです。毎回 exec 承認を求めます |
    | `/crestodian <request>` | オーナー DM から Crestodian セットアップおよび修復ヘルパーを実行します |
    | `/tasks` | 現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示します |
    | `/context [list\|detail\|map\|json]` | コンテキストがどのように組み立てられるかを説明します |
    | `/whoami` | 送信者 ID を表示します。エイリアス: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | 応答ごとの使用量フッターを制御する（`reset`/`inherit`/`clear`/`default` はセッション上書きをクリアして設定済みデフォルトを再継承します）か、ローカルのコスト概要を出力します |
  </Accordion>

  <Accordion title="Skills、許可リスト、承認">
    | コマンド | 説明 |
    | --- | --- |
    | `/skill <name> [input]` | 名前で skill を実行します |
    | `/allowlist [list\|add\|remove] ...` | 許可リストエントリを管理します。テキストのみ |
    | `/approve <id> <decision>` | exec または Plugin 承認プロンプトを解決します |
    | `/btw <question>` | セッションコンテキストを変更せずに横から質問します。エイリアス: `/side`。[BTW](/ja-JP/tools/btw) を参照してください |
  </Accordion>

  <Accordion title="サブエージェントと ACP">
    | コマンド | 説明 |
    | --- | --- |
    | `/subagents list\|log\|info` | 現在のセッションのサブエージェント実行を確認する |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP セッションとランタイムオプションを管理する。ランタイム制御には、外部所有者または内部 Gateway 管理者 ID が必要 |
    | `/focus <target>` | 現在の Discord スレッドまたは Telegram トピックをセッションターゲットにバインドする |
    | `/unfocus` | 現在のスレッドバインドを削除する |
    | `/agents` | 現在のセッションでスレッドにバインドされたエージェントを一覧表示する |
  </Accordion>

  <Accordion title="所有者専用の書き込みと管理">
    | コマンド | 必要条件 | 説明 |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` を読み書きする。所有者専用 |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw 管理の MCP サーバー設定を読み書きする。所有者専用 |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin の状態を確認または変更する。書き込みは所有者専用。エイリアス: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | ランタイム専用の設定オーバーライド。所有者専用 |
    | `/restart` | `commands.restart: true` (デフォルト) | OpenClaw を再起動する |
    | `/send on\|off\|inherit` | 所有者 | 送信ポリシーを設定する |
  </Accordion>

  <Accordion title="音声、TTS、チャンネル制御">
    | コマンド | 説明 |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS を制御する。[TTS](/ja-JP/tools/tts) を参照 |
    | `/activation mention\|always` | グループのアクティベーションモードを設定する |
    | `/bash <command>` | ホストのシェルコマンドを実行する。エイリアス: `! <command>`。`commands.bash: true` が必要 |
    | `!poll [sessionId]` | バックグラウンド bash ジョブを確認する |
    | `!stop [sessionId]` | バックグラウンド bash ジョブを停止する |
  </Accordion>
</AccordionGroup>

### Dock コマンド

Dock コマンドは、アクティブなセッションの返信先ルートを別のリンク済みチャンネルに切り替えます。
セットアップとトラブルシューティングについては、[チャンネルドッキング](/ja-JP/concepts/channel-docking) を参照してください。

ネイティブコマンド対応のチャンネル Plugin から生成されます:

- `/dock-discord` (エイリアス: `/dock_discord`)
- `/dock-mattermost` (エイリアス: `/dock_mattermost`)
- `/dock-slack` (エイリアス: `/dock_slack`)
- `/dock-telegram` (エイリアス: `/dock_telegram`)

Dock コマンドには `session.identityLinks` が必要です。送信元の送信者とターゲットのピアは、同じ ID グループに属している必要があります。

### バンドル Plugin コマンド

| コマンド                                                                                     | 説明                                                                                 |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `/dreaming [on\|off\|status\|help]`                                                          | メモリ Dreaming を切り替える (所有者または Gateway 管理者)。[Dreaming](/ja-JP/concepts/dreaming) を参照 |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | デバイスペアリングを管理する。[ペアリング](/ja-JP/channels/pairing) を参照                 |
| `/phone status\|arm ...\|disarm`                                                             | 高リスクの電話ノードコマンドを一時的に有効化する                                     |
| `/voice status\|list\|set <voiceId>`                                                         | Talk 音声設定を管理する。Discord のネイティブ名: `/talkvoice`                        |
| `/card ...`                                                                                  | LINE リッチカードのプリセットを送信する。[LINE](/ja-JP/channels/line) を参照               |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Codex アプリサーバーハーネスを制御する。[Codex ハーネス](/ja-JP/plugins/codex-harness) を参照 |

QQBot 専用: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill コマンド

ユーザーが呼び出せる Skills はスラッシュコマンドとして公開されます:

- `/skill <name> [input]` は汎用エントリーポイントとして常に機能します。
- Skills は直接コマンドとして登録できます (例: OpenProse の `/prose`)。
- ネイティブ Skill コマンド登録は、`commands.nativeSkills` と
  `channels.<provider>.commands.nativeSkills` で制御されます。
- 名前は `a-z0-9_` にサニタイズされます (最大 32 文字)。衝突した場合は数値サフィックスが付きます。

<AccordionGroup>
  <Accordion title="Skill コマンドディスパッチ">
    デフォルトでは、Skill コマンドは通常のリクエストとしてモデルにルーティングされます。

    Skills は `command-dispatch: tool` を宣言して、ツールへ直接ルーティングできます
    (決定的で、モデルは関与しません)。例: `/prose` (OpenProse Plugin)
    — [OpenProse](/ja-JP/prose) を参照してください。

  </Accordion>
  <Accordion title="ネイティブコマンド引数">
    Discord は、必須引数が省略された場合に動的オプションとボタンメニューにオートコンプリートを使用します。Telegram と Slack は、選択肢のあるコマンドにボタンメニューを表示します。動的な選択肢はターゲットセッションのモデルに対して解決されるため、`/think` レベルのようなモデル固有オプションはセッションの `/model` オーバーライドに従います。
  </Accordion>
</AccordionGroup>

## `/tools` — エージェントが今使えるもの

`/tools` はランタイム上の質問、つまり静的な設定カタログではなく、**この会話でこのエージェントが今使えるもの**に答えます。

```text
/tools         # compact view
/tools verbose # with short descriptions
```

結果はセッションスコープです。エージェント、チャンネル、スレッド、送信者の認可、またはモデルを変更すると、出力が変わる場合があります。プロファイルとオーバーライドを編集するには、Control UI の Tools パネルまたは設定サーフェスを使用してください。

## `/model` — モデル選択

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

Discord では、`/model` と `/models` はプロバイダーとモデルのドロップダウンを備えた対話型ピッカーを開きます。ピッカーは `provider/*` エントリを含む `agents.defaults.models` を尊重します。

## `/config` — ディスク上の設定書き込み

<Note>
  所有者専用。デフォルトでは無効です — `commands.config: true` で有効化します。
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

設定は書き込み前に検証されます。無効な変更は拒否されます。`/config` の更新は再起動後も維持されます。

## `/mcp` — MCP サーバー設定

<Note>
  所有者専用。デフォルトでは無効です — `commands.mcp: true` で有効化します。
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` は設定を埋め込みエージェントのプロジェクト設定ではなく、OpenClaw 設定に保存します。

## `/debug` — ランタイム専用オーバーライド

<Note>
  所有者専用。デフォルトでは無効です — `commands.debug: true` で有効化します。
  オーバーライドは新しい設定読み取りに即座に適用されますが、ディスクには**書き込まれません**。
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — Plugin 管理

<Note>
  書き込みは所有者専用。デフォルトでは無効です — `commands.plugins: true` で有効化します。
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` は Plugin 設定を更新し、新しいエージェントターン向けに Gateway の Plugin ランタイムをホットリロードします。`/plugins install` は Plugin ソースモジュールが変更されるため、管理対象 Gateway を自動的に再起動します。

## `/trace` — Plugin トレース出力

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` は、完全な詳細モードを使わずにセッションスコープの Plugin トレース/デバッグ行を表示します。これは `/debug` (ランタイムオーバーライド) や `/verbose` (通常のツール出力) の代替ではありません。

## `/btw` — 横道の質問

`/btw` は現在のセッションコンテキストに関する簡単な横道の質問です。エイリアス: `/side`。

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

通常のメッセージとは異なります:

- 現在のセッションを背景コンテキストとして使用します。
- Codex ハーネスセッションでは、一時的な Codex サイドスレッドとして実行されます。
- 将来のセッションコンテキストを変更**しません**。
- トランスクリプト履歴には書き込まれません。

完全な動作については、[BTW 横道の質問](/ja-JP/tools/btw) を参照してください。

## サーフェスの注記

<AccordionGroup>
  <Accordion title="サーフェスごとのセッションスコープ">
    - **テキストコマンド:** 通常のチャットセッションで実行されます (DM は `main` を共有し、グループは独自のセッションを持ちます)。
    - **ネイティブ Discord コマンド:** `agent:<agentId>:discord:slash:<userId>`
    - **ネイティブ Slack コマンド:** `agent:<agentId>:slack:slash:<userId>` (プレフィックスは `channels.slack.slashCommand.sessionPrefix` で設定可能)
    - **ネイティブ Telegram コマンド:** `telegram:slash:<userId>` (`CommandTargetSessionKey` を介してチャットセッションをターゲットにします)
    - **`/login codex`** はデバイスペアリングコードをプライベートチャットまたは Web UI 応答パス経由でのみ送信します。Telegram グループ/トピックでの呼び出しでは、代わりにボットへ DM するよう所有者に求めます。
    - **`/stop`** は現在の実行を中止するためにアクティブなチャットセッションをターゲットにします。

  </Accordion>
  <Accordion title="Slack 固有事項">
    `channels.slack.slashCommand` は単一の `/openclaw` 形式のコマンドをサポートします。
    `commands.native: true` では、組み込みコマンドごとに Slack スラッシュコマンドを 1 つ作成します。
    Slack は `/status` を予約しているため、`/agentstatus` (`/status` ではなく) を登録してください。テキストの `/status` は Slack メッセージ内で引き続き機能します。
  </Accordion>
  <Accordion title="高速パスとインラインショートカット">
    - 許可リストに含まれる送信者からのコマンドのみのメッセージは、即座に処理されます (キュー + モデルをバイパス)。
    - インラインショートカット (`/help`, `/commands`, `/status`, `/whoami`) は通常のメッセージ内に埋め込まれていても機能し、モデルが残りのテキストを見る前に取り除かれます。
    - 認可されていないコマンドのみのメッセージは黙って無視されます。インラインの `/...` トークンはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="引数の注記">
    - コマンドは、コマンドと引数の間に任意の `:` を受け付けます (`/think: high`, `/send: on`)。
    - `/new <model>` はモデルエイリアス、`provider/model`、またはプロバイダー名 (あいまい一致) を受け付けます。一致しない場合、テキストはメッセージ本文として扱われます。
    - `/allowlist add|remove` には `commands.config: true` が必要で、チャンネルの `configWrites` を尊重します。

  </Accordion>
</AccordionGroup>

## プロバイダーの使用状況とステータス

- **プロバイダーの使用量/クォータ** (例: 「Claude 80% left」) は、使用量追跡が有効な場合に現在のモデルプロバイダーについて `/status` に表示されます。
- `/status` の **トークン/キャッシュ行** は、ライブセッションスナップショットがまばらな場合、最新のトランスクリプト使用量エントリにフォールバックできます。
- **実行とランタイム:** `/status` は、有効なサンドボックスパスには `Execution` を、セッションを実行している主体には `Runtime` を報告します: `OpenClaw Default`、`OpenAI Codex`、CLI バックエンド、または ACP バックエンド。
- **応答ごとのトークン/コスト:** `/usage off|tokens|full` で制御されます。
- `/model status` はモデル/認証/エンドポイントに関するもので、使用量に関するものではありません。

## 関連

<CardGroup cols={2}>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="puzzle-piece">
    Skill スラッシュコマンドがどのように登録され、ゲートされるか。
  </Card>
  <Card title="Skills の作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    独自のスラッシュコマンドを登録する Skill を構築します。
  </Card>
  <Card title="BTW" href="/ja-JP/tools/btw" icon="comments">
    セッションコンテキストを変更しない横道の質問。
  </Card>
  <Card title="Steer" href="/ja-JP/tools/steer" icon="compass">
    `/steer` で実行中のエージェントを誘導します。
  </Card>
</CardGroup>
