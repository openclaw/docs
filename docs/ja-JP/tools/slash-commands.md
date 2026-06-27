---
read_when:
    - チャットコマンドの使用または設定
    - コマンドルーティングや権限のデバッグ
    - スキルコマンドが登録される仕組みを理解する
sidebarTitle: Slash commands
summary: 利用可能なすべてのスラッシュコマンド、ディレクティブ、インラインショートカット — 設定、ルーティング、サーフェスごとの動作。
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-06-27T13:17:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f53a5209d1c99c593d646b4ecc12e7074f72766cf3d1278c4d13511369d29bc
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway は、`/` で始まる単独メッセージとして送信されたコマンドを処理します。
ホスト専用の bash コマンドは `! <cmd>` を使います（`/bash <cmd>` はエイリアスです）。

会話が ACP セッションにバインドされている場合、通常のテキストは ACP
ハーネスへルーティングされます。Gateway 管理コマンドはローカルのままです。`/acp ...` は常に
OpenClaw コマンドハンドラーに届き、サーフェスでコマンド処理が有効な場合、`/status` と `/unfocus` もローカルに留まります。

## 3 種類のコマンド

<CardGroup cols={3}>
  <Card title="Commands" icon="terminal">
    Gateway によって処理される単独の `/...` メッセージです。メッセージ内の
    唯一の内容として送信する必要があります。
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、
    `/exec`、`/model`、`/queue` — モデルが見る前にメッセージから除去されます。
    単独で送信された場合はセッション設定を永続化し、他のテキストと一緒に送信された場合は
    インラインヒントとして動作します。
  </Card>
  <Card title="Inline shortcuts" icon="bolt">
    `/help`、`/commands`、`/status`、`/whoami` — 即座に実行され、
    モデルが残りのテキストを見る前に除去されます。認可済み送信者のみです。
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Directive behavior details">
    - ディレクティブは、モデルが見る前にメッセージから除去されます。
    - **ディレクティブのみ**のメッセージ（メッセージがディレクティブだけ）の場合、
      セッションに永続化され、確認応答を返します。
    - 他のテキストを含む**通常のチャット**メッセージでは、インラインヒントとして動作し、
      セッション設定は永続化**されません**。
    - ディレクティブは**認可済み送信者**にのみ適用されます。`commands.allowFrom`
      が設定されている場合、それが使用される唯一の許可リストです。そうでない場合、認可は
      チャンネル許可リスト/ペアリングと `commands.useAccessGroups` から得られます。未認可の
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
  （WhatsApp、WebChat、Signal、iMessage、Google Chat、Microsoft Teams）では、`false` に
  設定されていてもテキストコマンドが動作します。
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ネイティブコマンドを登録します。Auto: Discord/Telegram ではオン、Slack ではオフ、
  ネイティブ対応のないプロバイダーでは無視されます。チャンネルごとに
  `channels.<provider>.commands.native` で上書きします。Discord では、`false` はスラッシュコマンドの
  登録をスキップします。以前に登録されたコマンドは削除されるまで表示されたままになることがあります。
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  対応している場合、スキルコマンドをネイティブに登録します。Auto: 
  Discord/Telegram ではオン、Slack ではオフです。
  `channels.<provider>.commands.nativeSkills` で上書きします。
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` でホストシェルコマンドを実行できるようにします（`/bash <cmd>` エイリアス）。`tools.elevated`
  許可リストが必要です。
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash がバックグラウンドモードに切り替わるまで待機する時間です（`0` は
  即座にバックグラウンド化します）。
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config` を有効にします（`openclaw.json` を読み書きします）。オーナー専用です。
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP 設定を読み書きします）。オーナー専用です。
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` を有効にします（plugin の検出/ステータスに加え、インストールと有効化/無効化）。書き込みはオーナー専用です。
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` を有効にします（ランタイム専用の設定上書き）。オーナー専用です。
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` と Gateway 再起動ツールアクションを有効にします。
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  オーナー専用コマンドサーフェス用の明示的なオーナー許可リストです。
  `commands.allowFrom` および DM ペアリングアクセスとは別です。
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  チャンネルごと: オーナー専用コマンドにオーナー ID を要求します。`true` の場合、
  送信者は `commands.ownerAllowFrom` に一致するか、内部 `operator.admin`
  スコープを保持している必要があります。ワイルドカードの `allowFrom` エントリだけでは**不十分**です。
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  システムプロンプトにオーナー ID を表示する方法を制御します。
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"` のときに使用される HMAC シークレットです。
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  コマンド認可用のプロバイダーごとの許可リストです。設定されている場合、これは
  コマンドとディレクティブの**唯一**の認可ソースです。グローバル既定値には `"*"` を使い、
  プロバイダー固有キーがそれを上書きします。
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` が設定されていない場合、コマンドに許可リスト/ポリシーを適用します。
</ParamField>

## コマンド一覧

コマンドは 3 つのソースから来ます。

- **コア組み込み:** `src/auto-reply/commands-registry.shared.ts`
- **生成された dock コマンド:** `src/auto-reply/commands-registry.data.ts`
- **Plugin コマンド:** plugin の `registerCommand()` 呼び出し

利用可否は設定フラグ、チャンネルサーフェス、インストール済み/有効化済み
plugins に依存します。

### コアコマンド

<AccordionGroup>
  <Accordion title="Sessions and runs">
    | コマンド | 説明 |
    | --- | --- |
    | `/new [model]` | 現在のセッションをアーカイブし、新しいセッションを開始する |
    | `/reset [soft [message]]` | 現在のセッションをその場でリセットする。`soft` はトランスクリプトを保持し、再利用された CLI バックエンドセッション ID を破棄し、起動処理を再実行する |
    | `/name <title>` | 現在のセッションに名前を付ける、または名前を変更する。現在の名前と提案を表示するにはタイトルを省略する |
    | `/compact [instructions]` | セッションコンテキストを圧縮する。[Compaction](/ja-JP/concepts/compaction) を参照 |
    | `/stop` | 現在の実行を中止する |
    | `/session idle <duration\|off>` | スレッドバインドのアイドル期限を管理する |
    | `/session max-age <duration\|off>` | スレッドバインドの最大期間期限を管理する |
    | `/export-session [path]` | 現在のセッションを HTML にエクスポートする。エイリアス: `/export` |
    | `/export-trajectory [path]` | 現在のセッションの JSONL trajectory バンドルをエクスポートする。エイリアス: `/trajectory` |

    <Note>
      Control UI は、入力された `/new` を横取りして新しい
      ダッシュボードセッションを作成し切り替えます。ただし、`session.dmScope: "main"` が設定され、
      現在の親がエージェントのメインセッションである場合を除きます。その場合 `/new` は
      メインセッションをその場でリセットします。入力された `/reset` は引き続き Gateway の
      インプレースリセットを実行します。固定された
      セッションモデル選択をクリアしたい場合は `/model default` を使います。
    </Note>

  </Accordion>

  <Accordion title="Model and run controls">
    | コマンド | 説明 |
    | --- | --- |
    | `/think <level\|default>` | thinking レベルを設定する、またはセッション上書きをクリアする。エイリアス: `/thinking`、`/t` |
    | `/verbose on\|off\|full` | 詳細出力を切り替える。エイリアス: `/v` |
    | `/trace on\|off` | 現在のセッションの plugin trace 出力を切り替える |
    | `/fast [status\|auto\|on\|off\|default]` | fast mode を表示、設定、またはクリアする |
    | `/reasoning [on\|off\|stream]` | reasoning の可視性を切り替える。エイリアス: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | elevated mode を切り替える。エイリアス: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | exec 既定値を表示または設定する |
    | `/model [name\|#\|status]` | モデルを表示または設定する |
    | `/models [provider] [page] [limit=<n>\|all]` | 設定済み/認証利用可能なプロバイダーまたはモデルを一覧表示する |
    | `/queue <mode>` | アクティブ実行キューの動作を管理する。[Queue](/ja-JP/concepts/queue) と [Queue steering](/ja-JP/concepts/queue-steering) を参照 |
    | `/steer <message>` | アクティブな実行にガイダンスを注入する。エイリアス: `/tell`。[Steer](/ja-JP/tools/steer) を参照 |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning safety">
        - `/verbose` はデバッグ用です。通常利用では**オフ**にしてください。
        - `/trace` は plugin 所有の trace/debug 行だけを表示します。通常の詳細な雑音はオフのままです。
        - `/fast auto|on|off` はセッション上書きを永続化します。クリアするには Sessions UI の `inherit` オプションを使います。
        - `/fast` はプロバイダー固有です。OpenAI/Codex は `service_tier=priority` にマップし、直接の Anthropic リクエストは `service_tier=auto` または `standard_only` にマップします。
        - `/reasoning`、`/verbose`、`/trace` はグループ設定ではリスクがあります。内部 reasoning や plugin 診断を露出する可能性があります。グループチャットではオフにしてください。

      </Accordion>
      <Accordion title="Model switching details">
        - `/model` は新しいモデルをすぐにセッションへ永続化します。
        - エージェントがアイドル状態の場合、次の実行ですぐに使用されます。
        - 実行中の場合、切り替えは保留としてマークされ、次のクリーンな再試行ポイントで適用されます。

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Discovery and status">
    | コマンド | 説明 |
    | --- | --- |
    | `/help` | 短いヘルプ概要を表示する |
    | `/commands` | 生成されたコマンドカタログを表示する |
    | `/tools [compact\|verbose]` | 現在のエージェントが今使えるものを表示する |
    | `/status` | 実行/ランタイムステータス、Gateway とシステムの稼働時間、plugin health、さらにプロバイダーの使用量/クォータを表示する |
    | `/status plugins` | 詳細な plugin health を表示する: 読み込みエラー、隔離、チャンネル失敗、依存関係の問題、互換性通知 |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | 現在のセッションの永続的な [goal](/ja-JP/tools/goal) を管理する |
    | `/diagnostics [note]` | オーナー専用のサポートレポートフロー。毎回 exec 承認を求める |
    | `/crestodian <request>` | オーナー DM から Crestodian セットアップおよび修復ヘルパーを実行する |
    | `/tasks` | 現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示する |
    | `/context [list\|detail\|map\|json]` | コンテキストがどのように組み立てられるかを説明する |
    | `/whoami` | 自分の送信者 ID を表示する。エイリアス: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | 応答ごとの使用量フッターを制御する（`reset`/`inherit`/`clear`/`default` は、設定された既定値を再継承するためにセッション上書きをクリアする）、またはローカルのコスト概要を出力する |
  </Accordion>

  <Accordion title="Skills, allowlists, approvals">
    | コマンド | 説明 |
    | --- | --- |
    | `/skill <name> [input]` | 名前で skill を実行する |
    | `/allowlist [list\|add\|remove] ...` | 許可リストエントリを管理する。テキストのみ |
    | `/approve <id> <decision>` | exec または plugin 承認プロンプトを解決する |
    | `/btw <question>` | セッションコンテキストを変更せずに横道の質問をする。エイリアス: `/side`。[BTW](/ja-JP/tools/btw) を参照 |
  </Accordion>

  <Accordion title="サブエージェントと ACP">
    | コマンド | 説明 |
    | --- | --- |
    | `/subagents list\|log\|info` | 現在のセッションのサブエージェント実行を調べる |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP セッションとランタイムオプションを管理する |
    | `/focus <target>` | 現在の Discord スレッドまたは Telegram トピックをセッションターゲットに関連付ける |
    | `/unfocus` | 現在のスレッドの関連付けを削除する |
    | `/agents` | 現在のセッションのスレッド関連付け済みエージェントを一覧表示する |
  </Accordion>

  <Accordion title="所有者専用の書き込みと管理">
    | コマンド | 必須 | 説明 |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` を読み書きする。所有者専用 |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw 管理の MCP サーバー設定を読み書きする。所有者専用 |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin の状態を調べる、または変更する。書き込みは所有者専用。エイリアス: `/plugin` |
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
    | `!poll [sessionId]` | バックグラウンドの bash ジョブを確認する |
    | `!stop [sessionId]` | バックグラウンドの bash ジョブを停止する |
  </Accordion>
</AccordionGroup>

### ドックコマンド

ドックコマンドは、アクティブなセッションの返信先経路を別のリンク済みチャンネルに切り替えます。
セットアップとトラブルシューティングについては、[チャンネルドッキング](/ja-JP/concepts/channel-docking) を参照してください。

ネイティブコマンド対応のチャンネル Plugin から生成されます:

- `/dock-discord` (エイリアス: `/dock_discord`)
- `/dock-mattermost` (エイリアス: `/dock_mattermost`)
- `/dock-slack` (エイリアス: `/dock_slack`)
- `/dock-telegram` (エイリアス: `/dock_telegram`)

ドックコマンドには `session.identityLinks` が必要です。送信元の送信者とターゲットのピアは、同じアイデンティティグループに属している必要があります。

### バンドル済み Plugin コマンド

| コマンド                                                                                      | 説明                                                                       |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | メモリ Dreaming を切り替える。[Dreaming](/ja-JP/concepts/dreaming) を参照                        |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | デバイスペアリングを管理する。[ペアリング](/ja-JP/channels/pairing) を参照                           |
| `/phone status\|arm ...\|disarm`                                                             | 高リスクの電話ノードコマンドを一時的に準備状態にする                                     |
| `/voice status\|list\|set <voiceId>`                                                         | Talk 音声設定を管理する。Discord のネイティブ名: `/talkvoice`                       |
| `/card ...`                                                                                  | LINE リッチカードのプリセットを送信する。[LINE](/ja-JP/channels/line) を参照                           |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Codex アプリサーバーハーネスを制御する。[Codex ハーネス](/ja-JP/plugins/codex-harness) を参照 |

QQBot 専用: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill コマンド

ユーザーが呼び出せる Skills はスラッシュコマンドとして公開されます:

- `/skill <name> [input]` は汎用エントリーポイントとして常に動作します。
- Skills は直接コマンドとして登録できます (例: OpenProse の `/prose`)。
- ネイティブの Skill コマンド登録は `commands.nativeSkills` と
  `channels.<provider>.commands.nativeSkills` で制御されます。
- 名前は `a-z0-9_` にサニタイズされます (最大 32 文字)。衝突した場合は数字のサフィックスが付きます。

<AccordionGroup>
  <Accordion title="Skill コマンドのディスパッチ">
    デフォルトでは、Skill コマンドは通常のリクエストとしてモデルにルーティングされます。

    Skills は `command-dispatch: tool` を宣言して、ツールに直接ルーティングできます
    (決定的で、モデルは関与しません)。例: `/prose` (OpenProse Plugin)
    — [OpenProse](/ja-JP/prose) を参照。

  </Accordion>
  <Accordion title="ネイティブコマンド引数">
    Discord は、必須引数が省略された場合に動的オプションとボタンメニューにオートコンプリートを使用します。Telegram と Slack は、選択肢のあるコマンドにボタンメニューを表示します。動的な選択肢はターゲットセッションのモデルに対して解決されるため、`/think` レベルのようなモデル固有のオプションはセッションの `/model` オーバーライドに従います。
  </Accordion>
</AccordionGroup>

## `/tools` — エージェントが今使えるもの

`/tools` はランタイム上の質問に答えます: **このエージェントがこの会話で今使えるもの** — 静的な設定カタログではありません。

```text
/tools         # compact view
/tools verbose # with short descriptions
```

結果はセッションスコープです。エージェント、チャンネル、スレッド、送信者の認可、またはモデルを変更すると、出力が変わることがあります。プロファイルとオーバーライドの編集には、Control UI の Tools パネルまたは設定サーフェスを使用してください。

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

Discord では、`/model` と `/models` がプロバイダーとモデルのドロップダウンを備えたインタラクティブなピッカーを開きます。ピッカーは `provider/*` エントリを含む `agents.defaults.models` を尊重します。

## `/config` — ディスク上の設定書き込み

<Note>
  所有者専用。デフォルトでは無効です — `commands.config: true` で有効にします。
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

設定は書き込み前に検証されます。無効な変更は拒否されます。`/config` の更新は再起動後も保持されます。

## `/mcp` — MCP サーバー設定

<Note>
  所有者専用。デフォルトでは無効です — `commands.mcp: true` で有効にします。
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` は、埋め込みエージェントのプロジェクト設定ではなく、OpenClaw 設定に設定を保存します。

## `/debug` — ランタイム専用オーバーライド

<Note>
  所有者専用。デフォルトでは無効です — `commands.debug: true` で有効にします。
  オーバーライドは新しい設定読み取りに即座に適用されますが、ディスクには書き込みません。
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
  書き込みは所有者専用。デフォルトでは無効です — `commands.plugins: true` で有効にします。
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` は Plugin 設定を更新し、新しいエージェントターン向けに Gateway の Plugin ランタイムをホットリロードします。`/plugins install` は Plugin ソースモジュールが変更されたため、管理対象の Gateway を自動的に再起動します。

## `/trace` — Plugin トレース出力

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` は、完全な冗長モードなしでセッションスコープの Plugin トレース/デバッグ行を表示します。これは `/debug` (ランタイムオーバーライド) や `/verbose` (通常のツール出力) の代替ではありません。

## `/btw` — 横道の質問

`/btw` は現在のセッションコンテキストについての簡単な横道の質問です。エイリアス: `/side`。

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

通常のメッセージとは異なり:

- 現在のセッションを背景コンテキストとして使用します。
- Codex ハーネスセッションでは、一時的な Codex サイドスレッドとして実行されます。
- 将来のセッションコンテキストを変更しません。
- トランスクリプト履歴には書き込まれません。

完全な動作については、[BTW 横道の質問](/ja-JP/tools/btw) を参照してください。

## サーフェスの注意事項

<AccordionGroup>
  <Accordion title="サーフェスごとのセッションスコープ">
    - **テキストコマンド:** 通常のチャットセッションで実行されます (DM は `main` を共有し、グループは独自のセッションを持ちます)。
    - **ネイティブ Discord コマンド:** `agent:<agentId>:discord:slash:<userId>`
    - **ネイティブ Slack コマンド:** `agent:<agentId>:slack:slash:<userId>` (`channels.slack.slashCommand.sessionPrefix` でプレフィックスを設定可能)
    - **ネイティブ Telegram コマンド:** `telegram:slash:<userId>` (`CommandTargetSessionKey` 経由でチャットセッションをターゲットにします)
    - **`/stop`** は、現在の実行を中止するためにアクティブなチャットセッションをターゲットにします。

  </Accordion>
  <Accordion title="Slack 固有事項">
    `channels.slack.slashCommand` は単一の `/openclaw` 形式のコマンドに対応します。
    `commands.native: true` では、組み込みコマンドごとに Slack スラッシュコマンドを 1 つ作成します。Slack は `/status` を予約しているため、`/agentstatus` (`/status` ではありません) を登録してください。テキストの `/status` は Slack メッセージ内でも引き続き動作します。
  </Accordion>
  <Accordion title="高速経路とインラインショートカット">
    - 許可リスト内の送信者からのコマンドのみのメッセージは即座に処理されます (キュー + モデルをバイパス)。
    - インラインショートカット (`/help`, `/commands`, `/status`, `/whoami`) は通常のメッセージ内に埋め込まれていても動作し、残りのテキストをモデルが見る前に取り除かれます。
    - 認可されていないコマンドのみのメッセージは黙って無視されます。インラインの `/...` トークンはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="引数に関する注意">
    - コマンドは、コマンドと引数の間に任意の `:` を受け付けます (`/think: high`, `/send: on`)。
    - `/new <model>` は、モデルエイリアス、`provider/model`、またはプロバイダー名 (あいまい一致) を受け付けます。一致しない場合、そのテキストはメッセージ本文として扱われます。
    - `/allowlist add|remove` には `commands.config: true` が必要で、チャンネルの `configWrites` に従います。

  </Accordion>
</AccordionGroup>

## プロバイダーの使用量とステータス

- **プロバイダーの使用量/クォータ** (例: 「Claude 80% left」) は、使用量トラッキングが有効な場合、現在のモデルプロバイダーについて `/status` に表示されます。
- **トークン/キャッシュ行** は、ライブセッションスナップショットの情報が少ない場合、最新のトランスクリプト使用量エントリにフォールバックできます。
- **実行とランタイム:** `/status` は、有効なサンドボックスパスを `Execution` として、セッションを実行している主体を `Runtime` として報告します: `OpenClaw Default`、`OpenAI Codex`、CLI バックエンド、または ACP バックエンド。
- **応答ごとのトークン/コスト:** `/usage off|tokens|full` で制御されます。
- `/model status` はモデル/認証/エンドポイントに関するものであり、使用量に関するものではありません。

## 関連

<CardGroup cols={2}>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="puzzle-piece">
    Skill スラッシュコマンドが登録され、ゲートされる仕組み。
  </Card>
  <Card title="Skills の作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    独自のスラッシュコマンドを登録する Skill を構築します。
  </Card>
  <Card title="BTW" href="/ja-JP/tools/btw" icon="comments">
    セッションコンテキストを変更せずに横道の質問をします。
  </Card>
  <Card title="Steer" href="/ja-JP/tools/steer" icon="compass">
    `/steer` で実行中のエージェントを誘導します。
  </Card>
</CardGroup>
