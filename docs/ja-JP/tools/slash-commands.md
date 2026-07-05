---
read_when:
    - チャットコマンドの使用または設定
    - コマンドルーティングまたは権限のデバッグ
    - Skills コマンドの登録方法を理解する
sidebarTitle: Slash commands
summary: 利用可能なすべてのスラッシュコマンド、ディレクティブ、インラインショートカット — 設定、ルーティング、サーフェスごとの動作。
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-07-05T11:53:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9b26a7a27672d9d06572807a50346952ad7ebadbaa71e0c57dd3de5cbeb432e
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway は、`/` で始まる単独メッセージとして送信されたコマンドを処理します。
ホスト専用の bash コマンドは `! <cmd>` を使います（`/bash <cmd>` はエイリアス）。

会話が ACP セッションにバインドされている場合、通常のテキストは ACP
ハーネスにルーティングされます。Gateway 管理コマンドはローカルのままです。`/acp ...` は常に
OpenClaw コマンドハンドラーに届き、`/status` と `/unfocus` は、そのサーフェスで
コマンド処理が有効な場合は常にローカルに留まります。

## 3 種類のコマンド

<CardGroup cols={3}>
  <Card title="コマンド" icon="terminal">
    Gateway が処理する単独の `/...` メッセージ。メッセージ内の
    唯一の内容として送信する必要があります。
  </Card>
  <Card title="ディレクティブ" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — モデルに見える前にメッセージから
    削除されます。単独で送信された場合はセッション設定を保持し、他のテキストと
    一緒に送信された場合はインラインヒントとして機能します。
  </Card>
  <Card title="インラインショートカット" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — すぐに実行され、
    残りのテキストがモデルに見える前に削除されます。許可された送信者のみ。
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="ディレクティブ動作の詳細">
    - ディレクティブは、モデルに見える前にメッセージから削除されます。
    - **ディレクティブのみ** のメッセージ（メッセージがディレクティブだけ）の場合、セッションに
      保持され、確認応答を返します。
    - 他のテキストを含む **通常のチャット** メッセージでは、インラインヒントとして機能し、
      セッション設定は保持されません。
    - ディレクティブは **許可された送信者** にのみ適用されます。`commands.allowFrom`
      が設定されている場合、それが使用される唯一の許可リストです。それ以外の場合、認可は
      チャネルの許可リスト/ペアリングと `commands.useAccessGroups` から取得されます。許可されていない
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
  チャットメッセージ内の `/...` の解析を有効にします。ネイティブコマンドのないサーフェス
  （WhatsApp、WebChat、Signal、iMessage、Google Chat、Microsoft Teams）では、`false` に設定されていても
  テキストコマンドは機能します。
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ネイティブコマンドを登録します。auto: Discord/Telegram ではオン、Slack ではオフ。
  ネイティブサポートのないプロバイダーでは無視されます。チャネルごとに
  `channels.<provider>.commands.native` で上書きします。Discord では、`false` はスラッシュコマンドの
  登録をスキップします。以前に登録されたコマンドは、削除されるまで表示されたままになる場合があります。
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  サポートされている場合、スキルコマンドをネイティブに登録します。auto: 
  Discord/Telegram ではオン、Slack ではオフ。`channels.<provider>.commands.nativeSkills` で
  上書きします。
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` でホストシェルコマンドを実行できるようにします（`/bash <cmd>` エイリアス）。`tools.elevated`
  許可リストが必要です。
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash がバックグラウンドモードに切り替わるまで待機する時間です（`0` は
  すぐにバックグラウンド化します）。
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config` を有効にします（`openclaw.json` を読み書きします）。オーナー専用。
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP 設定を読み書きします）。オーナー専用。
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` を有効にします（Plugin の検出/ステータス、およびインストール + 有効化/無効化）。書き込みはオーナー専用。
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` を有効にします（実行時のみの設定上書き）。オーナー専用。
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` と Gateway 再起動ツールアクションを有効にします。
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  オーナー専用コマンドサーフェス向けの明示的なオーナー許可リスト。`commands.allowFrom` および
  DM ペアリングアクセスとは別です。
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  チャネルごと: オーナー専用コマンドにオーナー ID を要求します。`true` の場合、
  送信者は `commands.ownerAllowFrom` に一致するか、内部 `operator.admin`
  スコープを持っている必要があります。ワイルドカードの `allowFrom` エントリだけでは **不十分** です。
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  システムプロンプト内でオーナー ID がどのように表示されるかを制御します。
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"` の場合に使用される HMAC シークレット。
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  コマンド認可用のプロバイダー別許可リスト。設定されている場合、コマンドとディレクティブの
  **唯一** の認可ソースです。グローバルデフォルトには `"*"` を使用し、
  プロバイダー固有のキーがそれを上書きします。
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` が設定されていない場合に、コマンドの許可リスト/ポリシーを適用します。
</ParamField>

## コマンド一覧

コマンドは 3 つのソースから提供されます。

- **コア組み込み:** `src/auto-reply/commands-registry.shared.ts`
- **生成された dock コマンド:** `src/auto-reply/commands-registry.data.ts`
- **Plugin コマンド:** Plugin の `registerCommand()` 呼び出し

利用可否は、設定フラグ、チャネルサーフェス、インストール済み/有効化済みの
plugins によって決まります。

### コアコマンド

<AccordionGroup>
  <Accordion title="セッションと実行">
    | コマンド | 説明 |
    | --- | --- |
    | `/new [model]` | 現在のセッションをアーカイブし、新しいセッションを開始します |
    | `/reset [soft [message]]` | 現在のセッションをその場でリセットします。`soft` はトランスクリプトを保持し、再利用された CLI バックエンドセッション ID を削除し、起動処理を再実行します |
    | `/name <title>` | 現在のセッションに名前を付ける、または名前を変更します。タイトルを省略すると現在の名前と候補を表示します |
    | `/compact [instructions]` | セッションコンテキストを圧縮します。[Compaction](/ja-JP/concepts/compaction) を参照 |
    | `/stop` | 現在の実行を中止します |
    | `/session idle <duration\|off>` | スレッドバインディングのアイドル期限を管理します |
    | `/session max-age <duration\|off>` | スレッドバインディングの最大有効期限を管理します |
    | `/export-session [path]` | 現在のセッションを HTML にエクスポートします。エイリアス: `/export` |
    | `/export-trajectory [path]` | 現在のセッションの JSONL trajectory バンドルをエクスポートします。エイリアス: `/trajectory` |

    <Note>
      Control UI は、入力された `/new` をインターセプトして新しい
      ダッシュボードセッションを作成して切り替えます。ただし、`session.dmScope: "main"` が設定されていて、
      現在の親がエージェントのメインセッションである場合は例外で、その場合 `/new` は
      メインセッションをその場でリセットします。入力された `/reset` は引き続き Gateway の
      インプレースリセットを実行します。固定された
      セッションモデル選択を解除したい場合は `/model default` を使用してください。
    </Note>

  </Accordion>

  <Accordion title="モデルと実行制御">
    | コマンド | 説明 |
    | --- | --- |
    | `/think <level\|default>` | 思考レベルを設定するか、セッションの上書きを解除します。エイリアス: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | 詳細出力を切り替えます。エイリアス: `/v` |
    | `/trace on\|off` | 現在のセッションの Plugin トレース出力を切り替えます |
    | `/fast [status\|auto\|on\|off\|default]` | 高速モードを表示、設定、または解除します |
    | `/reasoning [on\|off\|stream]` | 推論の表示を切り替えます。エイリアス: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | elevated モードを切り替えます。エイリアス: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | exec デフォルトを表示または設定します |
    | `/login [codex\|openai\|openai-codex]` | プライベートチャットまたは Web UI セッションから Codex/OpenAI ログインをペアリングします。オーナー/admin のみ |
    | `/model [name\|#\|status]` | モデルを表示または設定します |
    | `/models [provider] [page] [limit=<n>\|all]` | 設定済み/認証利用可能なプロバイダーまたはモデルを一覧表示します |
    | `/queue <mode>` | アクティブ実行キューの動作を管理します。[Queue](/ja-JP/concepts/queue) と [Queue steering](/ja-JP/concepts/queue-steering) を参照 |
    | `/steer <message>` | アクティブな実行にガイダンスを挿入します。エイリアス: `/tell`。[Steer](/ja-JP/tools/steer) を参照 |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning の安全性">
        - `/verbose` はデバッグ用です — 通常利用では **off** にしてください。
        - `/trace` は Plugin が所有するトレース/デバッグ行のみを表示します。通常の詳細な出力はオフのままです。
        - `/fast auto|on|off` はセッションの上書きを保持します。解除するには Sessions UI の `inherit` オプションを使用します。
        - `/fast` はプロバイダー固有です。OpenAI/Codex はこれを `service_tier=priority` にマップし、Anthropic への直接リクエストは `service_tier=auto` または `standard_only` にマップします。
        - `/reasoning`、`/verbose`、`/trace` はグループ設定ではリスクがあります — 内部推論や Plugin 診断が表示される可能性があります。グループチャットではオフにしてください。

      </Accordion>
      <Accordion title="モデル切り替えの詳細">
        - `/model` は新しいモデルをすぐにセッションに保持します。
        - エージェントがアイドル状態の場合、次の実行ですぐに使用されます。
        - 実行がアクティブな場合、切り替えは保留としてマークされ、次のクリーンなリトライポイントで適用されます。

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="検出とステータス">
    | コマンド | 説明 |
    | --- | --- |
    | `/help` | 短いヘルプ概要を表示します |
    | `/commands` | 生成されたコマンドカタログを表示します |
    | `/tools [compact\|verbose]` | 現在のエージェントが今すぐ使用できるものを表示します |
    | `/status` | 実行/ランタイムステータス、Gateway とシステムの稼働時間、Plugin の正常性、およびプロバイダー使用量/クォータを表示します |
    | `/status plugins` | Plugin の詳細な正常性を表示します: 読み込みエラー、隔離、チャネル Plugin の失敗、依存関係の問題、互換性通知。`commands.plugins: true` が必要です |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | 現在のセッションの永続的な [goal](/ja-JP/tools/goal) を管理します |
    | `/diagnostics [note]` | オーナー専用のサポートレポートフロー。毎回 exec 承認を求めます |
    | `/crestodian <request>` | オーナー DM から Crestodian セットアップおよび修復ヘルパーを実行します |
    | `/tasks` | 現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示します |
    | `/context [list\|detail\|map\|json]` | コンテキストがどのように組み立てられるかを説明します |
    | `/whoami` | 送信者 ID を表示します。エイリアス: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | 応答ごとの使用量フッターを制御します（`reset`/`inherit`/`clear`/`default` はセッションの上書きを解除して設定済みデフォルトを再継承します）、またはローカルのコスト概要を出力します |
  </Accordion>

  <Accordion title="Skills、許可リスト、承認">
    | コマンド | 説明 |
    | --- | --- |
    | `/skill <name> [input]` | 名前で skill を実行します |
    | `/allowlist [list\|add\|remove] ...` | 許可リストエントリを管理します。テキスト専用 |
    | `/approve <id> <decision>` | exec または Plugin 承認プロンプトを解決します |
    | `/btw <question>` | セッションコンテキストを変更せずに補足質問をします。エイリアス: `/side`。[BTW](/ja-JP/tools/btw) を参照 |
  </Accordion>

  <Accordion title="サブエージェントと ACP">
    | コマンド | 説明 |
    | --- | --- |
    | `/subagents list\|log\|info` | 現在のセッションのサブエージェント実行を調べる |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP セッションとランタイムオプションを管理する。ランタイム制御には、外部所有者または内部 Gateway 管理者の ID が必要 |
    | `/focus <target>` | 現在の Discord スレッドまたは Telegram トピックをセッションターゲットに紐づける |
    | `/unfocus` | 現在のスレッド紐づけを削除する |
    | `/agents` | 現在のセッションのスレッド紐づけ済みエージェントを一覧表示する |
  </Accordion>

  <Accordion title="所有者専用の書き込みと管理">
    | コマンド | 必要条件 | 説明 |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` を読み書きする。所有者専用 |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw が管理する MCP サーバー設定を読み書きする。所有者専用 |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | plugin 状態を調べる、または変更する。書き込みは所有者専用。エイリアス: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | ランタイム専用の設定オーバーライド。所有者専用 |
    | `/restart` | `commands.restart: true` (デフォルト) | OpenClaw を再起動する |
    | `/send on\|off\|inherit` | 所有者 | 送信ポリシーを設定する |
  </Accordion>

  <Accordion title="音声、TTS、チャネル制御">
    | コマンド | 説明 |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS を制御する。[TTS](/ja-JP/tools/tts) を参照 |
    | `/activation mention\|always` | グループ起動モードを設定する |
    | `/bash <command>` | ホストのシェルコマンドを実行する。エイリアス: `! <command>`。`commands.bash: true` が必要 |
    | `!poll [sessionId]` | バックグラウンド bash ジョブを確認する |
    | `!stop [sessionId]` | バックグラウンド bash ジョブを停止する |
  </Accordion>
</AccordionGroup>

### Dock コマンド

Dock コマンドは、アクティブなセッションの返信経路を別のリンク済みチャネルに切り替えます。
セットアップとトラブルシューティングについては、[チャネルドッキング](/ja-JP/concepts/channel-docking) を参照してください。

ネイティブコマンド対応のチャネル plugin から生成されます:

- `/dock-discord` (エイリアス: `/dock_discord`)
- `/dock-mattermost` (エイリアス: `/dock_mattermost`)
- `/dock-slack` (エイリアス: `/dock_slack`)
- `/dock-telegram` (エイリアス: `/dock_telegram`)

Dock コマンドには `session.identityLinks` が必要です。送信元の送信者とターゲットピアは、
同じ ID グループに属している必要があります。

### バンドル済み plugin コマンド

| コマンド                                                | 説明                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | メモリ dreaming を切り替える (所有者または Gateway 管理者)。[Dreaming](/ja-JP/concepts/dreaming) を参照                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | デバイスペアリングを管理する。[ペアリング](/ja-JP/channels/pairing) を参照                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | 高リスクの phone node コマンドを一時的に有効化する                                                                                                                                                  |
| `/voice status\|list\|set <voiceId>`                    | Talk 音声設定を管理する。Discord ネイティブ名: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | LINE リッチカードプリセットを送信する。[LINE](/ja-JP/channels/line) を参照                                                                                                                                        |
| `/codex <action> ...`                                   | Codex アプリサーバーハーネスを紐づけ、操作し、調べる (status、threads、resume、model、fast、permissions、compact、review、mcp、skills など)。[Codex ハーネス](/ja-JP/plugins/codex-harness) を参照 |

QQBot 専用: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill コマンド

ユーザーが呼び出せる Skills はスラッシュコマンドとして公開されます:

- `/skill <name> [input]` は汎用エントリポイントとして常に動作します。
- Skills は直接コマンドとして登録できます (例: OpenProse の `/prose`)。
- ネイティブ Skill コマンド登録は `commands.nativeSkills` と
  `channels.<provider>.commands.nativeSkills` で制御されます。
- 名前は `a-z0-9_` にサニタイズされます (最大 32 文字)。衝突時は数字のサフィックスが付きます。

<AccordionGroup>
  <Accordion title="Skill コマンドのディスパッチ">
    デフォルトでは、Skill コマンドは通常のリクエストとしてモデルにルーティングされます。

    Skills は `command-dispatch: tool` を宣言して、ツールへ直接ルーティングできます
    (決定的で、モデルは関与しません)。例: `/prose` (OpenProse plugin)
    — [OpenProse](/ja-JP/prose) を参照。

  </Accordion>
  <Accordion title="ネイティブコマンド引数">
    必須引数が省略された場合、Discord は動的オプションとボタンメニューにオートコンプリートを使用します。
    Telegram と Slack は、選択肢を持つコマンドにボタンメニューを表示します。
    動的な選択肢はターゲットセッションのモデルに対して解決されるため、`/think` レベルのようなモデル固有の
    オプションはセッションの `/model` オーバーライドに従います。
  </Accordion>
</AccordionGroup>

## `/tools`: エージェントが現在使用できるもの

`/tools` はランタイムに関する質問に答えます: **この会話でこのエージェントが今使用できるもの** です。
静的な設定カタログではありません。

```text
/tools         # コンパクト表示
/tools verbose # 短い説明付き
```

結果はセッションスコープです。エージェント、チャネル、スレッド、送信者の認可、
またはモデルを変更すると、出力が変わることがあります。プロファイルとオーバーライドの編集には、
Control UI の Tools パネルまたは設定サーフェスを使用してください。

## `/model`: モデル選択

```text
/model             # モデルピッカーを表示
/model list        # 同じ
/model 3           # ピッカーから番号で選択
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # セッションのモデル選択をクリア
/model status      # エンドポイントと API モードを含む詳細表示
```

Discord では、`/model` と `/models` がプロバイダーとモデルのドロップダウンを備えた
インタラクティブなピッカーを開きます。ピッカーは `provider/*` エントリを含む
`agents.defaults.models` を尊重します。

## `/config`: ディスク上の設定書き込み

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

設定は書き込み前に検証されます。無効な変更は拒否されます。`/config`
の更新は再起動後も保持されます。

## `/mcp`: MCP サーバー設定

<Note>
  所有者専用。デフォルトでは無効です — `commands.mcp: true` で有効化します。
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` は設定を OpenClaw 設定に保存し、埋め込みエージェントのプロジェクト設定には保存しません。

## `/debug`: ランタイム専用オーバーライド

<Note>
  所有者専用。デフォルトでは無効です — `commands.debug: true` で有効化します。
  オーバーライドは新しい設定読み取りに即時適用されますが、ディスクには**書き込みません**。
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: plugin 管理

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

`/plugins enable|disable` は plugin 設定を更新し、新しいエージェントターンに対して Gateway
plugin ランタイムをホットリロードします。`/plugins install` は plugin ソースモジュールが変更されたため、
管理対象 Gateway を自動的に再起動します。

## `/trace`: plugin トレース出力

```text
/trace          # 現在のトレース状態を表示
/trace on
/trace off
```

`/trace` は、完全な詳細モードなしでセッションスコープの plugin トレース/デバッグ行を表示します。
これは `/debug` (ランタイムオーバーライド) や `/verbose` (通常のツール出力) の代替ではありません。

## `/btw`: 脇の質問

`/btw` は現在のセッションコンテキストについての簡単な脇の質問です。エイリアス: `/side`。

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

通常のメッセージとは異なります:

- 現在のセッションを背景コンテキストとして使用します。
- Codex ハーネスセッションでは、一時的な Codex サイドスレッドとして実行されます。
- 今後のセッションコンテキストを変更しません。
- トランスクリプト履歴には書き込まれません。

完全な動作については、[BTW の脇の質問](/ja-JP/tools/btw) を参照してください。

## サーフェスに関する注記

<AccordionGroup>
  <Accordion title="サーフェスごとのセッションスコープ">
    - **テキストコマンド:** 通常のチャットセッションで実行されます (DM は `main` を共有し、グループは独自のセッションを持ちます)。
    - **ネイティブ Discord コマンド:** `agent:<agentId>:discord:slash:<userId>`
    - **ネイティブ Slack コマンド:** `agent:<agentId>:slack:slash:<userId>` (`channels.slack.slashCommand.sessionPrefix` でプレフィックスを設定可能)
    - **ネイティブ Telegram コマンド:** `telegram:slash:<userId>` (`CommandTargetSessionKey` 経由でチャットセッションを対象にします)
    - **`/login codex`** はデバイスペアリングコードをプライベートチャットまたは Web UI レスポンスパス経由でのみ送信します。Telegram グループ/トピックからの呼び出しでは、代わりに所有者へ bot に DM するよう依頼します。
    - **`/stop`** は現在の実行を中止するため、アクティブなチャットセッションを対象にします。

  </Accordion>
  <Accordion title="Slack 固有事項">
    `channels.slack.slashCommand` は単一の `/openclaw` 形式のコマンドをサポートします。
    `commands.native: true` の場合、組み込みコマンドごとに Slack スラッシュコマンドを 1 つ作成します。
    Slack は `/status` を予約しているため、`/agentstatus` (`/status` ではなく) を登録してください。
    テキストの `/status` は Slack メッセージ内でも引き続き動作します。
  </Accordion>
  <Accordion title="高速パスとインラインショートカット">
    - 許可リストに含まれる送信者からのコマンドのみのメッセージは即時処理されます (キュー + モデルをバイパス)。
    - インラインショートカット (`/help`, `/commands`, `/status`, `/whoami`) は通常のメッセージに埋め込まれていても動作し、残りのテキストがモデルに渡される前に除去されます。
    - 認可されていないコマンドのみのメッセージはサイレントに無視されます。インラインの `/...` トークンはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="引数に関する注記">
    - コマンドは、コマンドと引数の間に任意の `:` を受け付けます (`/think: high`, `/send: on`)。
    - `/new <model>` はモデルエイリアス、`provider/model`、またはプロバイダー名 (あいまい一致) を受け付けます。一致しない場合、そのテキストはメッセージ本文として扱われます。
    - `/allowlist add|remove` には `commands.config: true` が必要で、チャネルの `configWrites` を尊重します。

  </Accordion>
</AccordionGroup>

## プロバイダー使用状況とステータス

- **プロバイダー使用状況/クォータ** (例: 「Claude 80% left」) は、使用状況追跡が有効な場合、現在のモデルプロバイダーについて `/status` に表示されます。
- `/status` の **トークン/キャッシュ行** は、ライブセッションスナップショットが少ない場合、最新のトランスクリプト使用状況エントリにフォールバックできます。
- **実行とランタイム:** `/status` は有効なサンドボックスパスに `Execution` を、セッションの実行主体に `Runtime` を報告します: `OpenClaw Default`、`OpenAI Codex`、CLI バックエンド、または ACP バックエンド。
- **レスポンスごとのトークン/コスト:** `/usage off|tokens|full` で制御されます。
- `/model status` はモデル/認証/エンドポイントに関するものであり、使用状況ではありません。

## 関連

<CardGroup cols={2}>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="puzzle-piece">
    skill のスラッシュコマンドがどのように登録され、ゲートされるか。
  </Card>
  <Card title="スキルの作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    独自のスラッシュコマンドを登録する skill を構築します。
  </Card>
  <Card title="BTW" href="/ja-JP/tools/btw" icon="comments">
    セッションコンテキストを変更せずに横から質問します。
  </Card>
  <Card title="Steer" href="/ja-JP/tools/steer" icon="compass">
    `/steer` で実行中のエージェントを誘導します。
  </Card>
</CardGroup>
