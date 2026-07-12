---
read_when:
    - チャットコマンドの使用または設定
    - コマンドのルーティングまたは権限のデバッグ
    - スキルコマンドがどのように登録されるかを理解する
sidebarTitle: Slash commands
summary: 利用可能なすべてのスラッシュコマンド、ディレクティブ、インラインショートカット — 設定、ルーティング、各サーフェスでの動作。
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-07-11T22:46:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0017f229610ff5b1f4ff4a11a77814575835cfd07c7d4dbcce8b0d51ed4f4dd1
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway は、`/` で始まる単独メッセージとして送信されたコマンドを処理します。
ホスト専用の bash コマンドは `! <cmd>` を使用します（`/bash <cmd>` はエイリアスです）。

会話が ACP セッションにバインドされている場合、通常のテキストは ACP
ハーネスにルーティングされます。Gateway 管理コマンドはローカルに留まります。`/acp ...` は常に
OpenClaw コマンドハンドラーに到達し、対象サーフェスでコマンド処理が有効な場合は
`/status` と `/unfocus` もローカルに留まります。

## 3 種類のコマンド

<CardGroup cols={3}>
  <Card title="コマンド" icon="terminal">
    Gateway が処理する単独の `/...` メッセージです。メッセージ内の
    唯一の内容として送信する必要があります。
  </Card>
  <Card title="ディレクティブ" icon="sliders">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、
    `/exec`、`/model`、`/queue` — モデルがメッセージを認識する前に
    取り除かれます。単独で送信するとセッション設定を保持し、他のテキストと
    一緒に送信するとインラインヒントとして機能します。
  </Card>
  <Card title="インラインショートカット" icon="bolt">
    `/help`、`/commands`、`/status`、`/whoami` — 即座に実行され、
    モデルが残りのテキストを認識する前に取り除かれます。認可された送信者のみ使用できます。
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="ディレクティブの動作の詳細">
    - ディレクティブは、モデルがメッセージを認識する前に取り除かれます。
    - **ディレクティブのみ**のメッセージ（メッセージの内容がディレクティブのみ）では、
      セッションに保持され、確認応答が返されます。
    - 他のテキストを含む**通常のチャット**メッセージでは、インラインヒントとして機能し、
      セッション設定は保持され**ません**。
    - ディレクティブは**認可された送信者**にのみ適用されます。`commands.allowFrom`
      が設定されている場合、それだけが許可リストとして使用されます。それ以外の場合、認可は
      チャンネルの許可リスト／ペアリングと `commands.useAccessGroups` に基づきます。認可されていない
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
  チャットメッセージ内の `/...` の解析を有効にします。ネイティブコマンドがない
  サーフェス（WhatsApp、WebChat、Signal、iMessage、Google Chat、Microsoft Teams）では、
  `false` に設定されていてもテキストコマンドが機能します。
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ネイティブコマンドを登録します。自動設定では Discord／Telegram で有効、Slack で無効になり、
  ネイティブ対応のないプロバイダーでは無視されます。チャンネルごとに
  `channels.<provider>.commands.native` で上書きできます。Discord では、`false` にするとスラッシュコマンドの
  登録を省略します。以前に登録されたコマンドは、削除されるまで表示され続ける場合があります。
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  対応している場合、スキルコマンドをネイティブに登録します。自動設定では
  Discord／Telegram で有効、Slack で無効になります。
  `channels.<provider>.commands.nativeSkills` で上書きできます。
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` によるホストシェルコマンドの実行を有効にします（`/bash <cmd>` はエイリアスです）。
  `tools.elevated` の許可リストが必要です。
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash がバックグラウンドモードに切り替わるまで待機する時間です（`0` の場合は
  即座にバックグラウンドへ移行します）。
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config`（`openclaw.json` の読み書き）を有効にします。所有者のみ使用できます。
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp`（`mcp.servers` 配下の OpenClaw 管理 MCP 設定の読み書き）を有効にします。所有者のみ使用できます。
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins`（Plugin の検出／状態確認、およびインストール、有効化／無効化）を有効にします。書き込みは所有者のみ実行できます。
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug`（ランタイム限定の設定上書き）を有効にします。所有者のみ使用できます。
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` と Gateway 再起動ツールのアクションを有効にします。
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  所有者専用コマンドサーフェス用の明示的な所有者許可リストです。
  `commands.allowFrom` および DM ペアリングアクセスとは別です。
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  チャンネル単位で、所有者専用コマンドに所有者 ID を要求します。`true` の場合、
  送信者は `commands.ownerAllowFrom` に一致するか、内部の `operator.admin`
  スコープを保持している必要があります。`allowFrom` のワイルドカードエントリだけでは**不十分**です。
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  システムプロンプトで所有者 ID をどのように表示するかを制御します。
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"` の場合に使用する HMAC シークレットです。
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  コマンド認可用のプロバイダー別許可リストです。設定した場合、コマンドとディレクティブに対する
  **唯一の**認可元になります。グローバルなデフォルトには `"*"` を使用します。プロバイダー固有のキーがこれを上書きします。
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` が設定されていない場合、コマンドに許可リストとポリシーを適用します。
</ParamField>

## コマンド一覧

コマンドは次の 3 つのソースから提供されます。

- **コア組み込みコマンド:** `src/auto-reply/commands-registry.shared.ts`
- **生成された dock コマンド:** `src/auto-reply/commands-registry.data.ts`
- **Plugin コマンド:** Plugin による `registerCommand()` 呼び出し

利用可否は、設定フラグ、チャンネルサーフェス、およびインストール済みで有効化されている
Plugin によって異なります。

### コアコマンド

  <AccordionGroup>
  <Accordion title="セッションと実行">
    | コマンド | 説明 |
    | --- | --- |
    | `/new [model]` | 現在のセッションをアーカイブし、新しいセッションを開始します |
    | `/reset [soft [message]]` | 現在のセッションをその場でリセットします。`soft` はトランスクリプトを維持し、再利用されている CLI バックエンドのセッション ID を破棄して、起動処理を再実行します |
    | `/name <title>` | 現在のセッションに名前を付けるか、名前を変更します。タイトルを省略すると、現在の名前と候補が表示されます |
    | `/compact [instructions]` | セッションのコンテキストを圧縮します。[Compaction](/ja-JP/concepts/compaction)を参照してください |
    | `/stop` | 現在の実行を中止します |
    | `/session idle <duration\|off>` | スレッドバインディングのアイドル有効期限を管理します |
    | `/session max-age <duration\|off>` | スレッドバインディングの最大経過時間による有効期限を管理します |
    | `/export-session [path]` | 現在のセッションを HTML にエクスポートします。エイリアス: `/export` |
    | `/export-trajectory [path]` | 現在のセッションの JSONL 軌跡バンドルをエクスポートします。エイリアス: `/trajectory` |

    <Note>
      Control UI は入力された `/new` をインターセプトし、新しいダッシュボードセッションを作成して切り替えます。ただし、`session.dmScope: "main"` が設定され、現在の親がエージェントのメインセッションである場合、`/new` はメインセッションをその場でリセットします。入力された `/reset` は引き続き Gateway のインプレースリセットを実行します。固定されたセッションのモデル選択を解除する場合は、`/model default` を使用してください。
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
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | exec のデフォルト設定を表示または設定します |
    | `/login [codex\|openai\|openai-codex]` | プライベートチャットまたは Web UI セッションから Codex/OpenAI ログインをペアリングします。所有者または管理者のみ |
    | `/model [name\|#\|status]` | モデルを表示または設定します |
    | `/models [provider] [page] [limit=<n>\|all]` | 設定済み、または認証で利用可能なプロバイダーやモデルを一覧表示します |
    | `/queue <mode>` | アクティブな実行キューの動作を管理します。[キュー](/ja-JP/concepts/queue)および[キューの方向付け](/ja-JP/concepts/queue-steering)を参照してください |
    | `/steer <message>` | アクティブな実行に指示を挿入します。エイリアス: `/tell`。[方向付け](/ja-JP/tools/steer)を参照してください |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning の安全性">
        - `/verbose` はデバッグ用です。通常の使用では **オフ** にしてください。
        - `/trace` が表示するのは Plugin が所有するトレース行とデバッグ行だけです。通常の詳細メッセージはオフのままです。
        - `/fast auto|on|off` はセッションのオーバーライドを保持します。解除するには Sessions UI の `inherit` オプションを使用してください。
        - `/fast` はプロバイダー固有です。OpenAI/Codex では `service_tier=priority` に対応し、Anthropic への直接リクエストでは `service_tier=auto` または `standard_only` に対応します。
        - `/reasoning`、`/verbose`、`/trace` はグループ環境では危険です。内部の推論や Plugin の診断情報が公開される可能性があります。グループチャットではオフにしてください。

      </Accordion>
      <Accordion title="モデル切り替えの詳細">
        - `/model` は新しいモデルをセッションに即座に保存します。
        - エージェントがアイドル状態の場合、次回の実行からすぐに使用されます。
        - 実行中の場合、切り替えは保留として記録され、次の正常な再試行時点で適用されます。

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="検出とステータス">
    | コマンド | 説明 |
    | --- | --- |
    | `/help` | 簡潔なヘルプの概要を表示します |
    | `/commands` | 生成されたコマンドカタログを表示します |
    | `/tools [compact\|verbose]` | 現在のエージェントが今すぐ使用できるものを表示します |
    | `/status` | 実行およびランタイムのステータス、Gateway とシステムの稼働時間、Plugin の健全性、プロバイダーの使用量とクォータを表示します |
    | `/status plugins` | Plugin の詳細な健全性（読み込みエラー、隔離、チャンネル Plugin の障害、依存関係の問題、互換性に関する通知）を表示します。`commands.plugins: true` が必要です |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | 現在のセッションの永続的な[目標](/ja-JP/tools/goal)を管理します |
    | `/diagnostics [note]` | オーナー専用のサポートレポートフローです。毎回、実行の承認を求めます |
    | `/crestodian <request>` | オーナーの DM から Crestodian のセットアップおよび修復ヘルパーを実行します |
    | `/tasks` | 現在のセッションの実行中および最近のバックグラウンドタスクを一覧表示します |
    | `/context [list\|detail\|map\|json]` | コンテキストがどのように構成されるかを説明します |
    | `/whoami` | 送信者 ID を表示します。エイリアス: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | 応答ごとの使用量フッターを制御するか（`reset`/`inherit`/`clear`/`default` はセッションの上書きを解除し、設定済みのデフォルトを再継承します）、ローカルのコスト概要を表示します |
  </Accordion>

  <Accordion title="Skills、許可リスト、承認">
    | コマンド | 説明 |
    | --- | --- |
    | `/skill <name> [input]` | 名前を指定して Skill を実行します |
    | `/learn [request]` | 現在の会話または指定したソースから、[Skill Workshop](/ja-JP/tools/skill-workshop)を通じてレビュー可能な Skill を1つ作成します |
    | `/allowlist [list\|add\|remove] ...` | 許可リストのエントリを管理します。テキストのみ |
    | `/approve <id> <decision>` | 実行または Plugin の承認プロンプトに応答します |
    | `/btw <question>` | セッションのコンテキストを変更せずに補足的な質問をします。エイリアス: `/side`。[BTW](/ja-JP/tools/btw)を参照してください |
  </Accordion>

  <Accordion title="サブエージェントと ACP">
    | コマンド | 説明 |
    | --- | --- |
    | `/subagents list\|log\|info` | 現在のセッションのサブエージェント実行を確認する |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP セッションとランタイムオプションを管理する。ランタイム制御には、外部オーナーまたは内部 Gateway 管理者のアイデンティティが必要 |
    | `/focus <target>` | 現在の Discord スレッドまたは Telegram トピックをセッションターゲットに関連付ける |
    | `/unfocus` | 現在のスレッドの関連付けを解除する |
    | `/agents` | 現在のセッションでスレッドに関連付けられたエージェントを一覧表示する |
  </Accordion>

  <Accordion title="オーナー限定の書き込みと管理">
    | コマンド | 必要条件 | 説明 |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json`を読み書きする。オーナー限定 |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw が管理する MCP サーバー設定を読み書きする。オーナー限定 |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin の状態を確認または変更する。書き込みはオーナー限定。エイリアス: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | ランタイム限定の設定オーバーライド。オーナー限定 |
    | `/restart` | `commands.restart: true`（デフォルト） | OpenClaw を再起動する |
    | `/send on\|off\|inherit` | オーナー | 送信ポリシーを設定する |
  </Accordion>

  <Accordion title="音声、TTS、チャンネル制御">
    | コマンド | 説明 |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS を制御する。[TTS](/ja-JP/tools/tts)を参照 |
    | `/activation mention\|always` | グループのアクティベーションモードを設定する |
    | `/bash <command>` | ホストのシェルコマンドを実行する。エイリアス: `! <command>`。`commands.bash: true`が必要 |
    | `!poll [sessionId]` | バックグラウンドの bash ジョブを確認する |
    | `!stop [sessionId]` | バックグラウンドの bash ジョブを停止する |
  </Accordion>
</AccordionGroup>

### ドックコマンド

ドックコマンドは、アクティブなセッションの応答経路を、リンク済みの別チャンネルへ切り替えます。
設定とトラブルシューティングについては、[チャンネルのドッキング](/ja-JP/concepts/channel-docking)を参照してください。

ネイティブコマンドをサポートするチャンネル Plugin から生成されます。

- `/dock-discord`（エイリアス: `/dock_discord`）
- `/dock-mattermost`（エイリアス: `/dock_mattermost`）
- `/dock-slack`（エイリアス: `/dock_slack`）
- `/dock-telegram`（エイリアス: `/dock_telegram`）

ドックコマンドには`session.identityLinks`が必要です。送信元の送信者と対象の相手は、
同じアイデンティティグループに属している必要があります。

### バンドル済み Plugin のコマンド

| コマンド                                                | 説明                                                                                                                                                                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | メモリの Dreaming を切り替える（オーナーまたは Gateway 管理者）。[Dreaming](/ja-JP/concepts/dreaming)を参照                                                                                                    |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | デバイスのペアリングを管理する。[ペアリング](/ja-JP/channels/pairing)を参照                                                                                                                                    |
| `/phone status\|arm ...\|disarm`                        | リスクの高い Node コマンド（カメラ、画面、コンピューター、書き込み）を一時的に有効化する。[コンピューターの使用](/ja-JP/nodes/computer-use)を参照                                                               |
| `/voice status\|list\|set <voiceId>`                    | Talk の音声設定を管理する。Discord でのネイティブ名: `/talkvoice`                                                                                                                                         |
| `/card ...`                                             | LINE のリッチカードプリセットを送信する。[LINE](/ja-JP/channels/line)を参照                                                                                                                                    |
| `/codex <action> ...`                                   | Codex app-server ハーネスを関連付け、操作し、確認する（ステータス、スレッド、再開、モデル、高速化、権限、圧縮、レビュー、MCP、Skills など）。[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照 |

QQBot 限定: `/bot-ping`、`/bot-version`、`/bot-help`、`/bot-upgrade`、`/bot-logs`

### Skill コマンド

ユーザーが呼び出せる Skills は、スラッシュコマンドとして公開されます。

- `/skill <name> [input]`は汎用エントリーポイントとして常に機能します。
- Skills は直接コマンドとして登録できます（例: OpenProse の`/prose`）。
- ネイティブ Skill コマンドの登録は、`commands.nativeSkills`と
  `channels.<provider>.commands.nativeSkills`で制御されます。
- 名前は`a-z0-9_`に正規化されます（最大 32 文字）。重複した場合は数字の接尾辞が付加されます。

<AccordionGroup>
  <Accordion title="Skill コマンドのディスパッチ">
    デフォルトでは、Skill コマンドは通常のリクエストとしてモデルにルーティングされます。

    Skills は`command-dispatch: tool`を宣言することで、ツールへ直接
    ルーティングできます（決定的で、モデルは関与しません）。例: `/prose`（OpenProse Plugin）
    — [OpenProse](/ja-JP/prose)を参照してください。

  </Accordion>
  <Accordion title="ネイティブコマンドの引数">
    Discord では、必須引数が省略された場合、動的オプションにはオートコンプリートを、
    必要に応じてボタンメニューを使用します。Telegram と Slack では、選択肢を持つ
    コマンドにボタンメニューを表示します。動的な選択肢は対象セッションのモデルに基づいて解決されるため、
    `/think`のレベルなどのモデル固有オプションは、セッションの`/model`オーバーライドに従います。
  </Accordion>
</AccordionGroup>

## `/tools`: エージェントが現在使用できるもの

`/tools`はランタイムに関する質問、つまり**この会話で、このエージェントが今すぐ使用できるもの**
に回答します。静的な設定カタログではありません。

```text
/tools         # compact view
/tools verbose # with short descriptions
```

結果はセッション単位です。エージェント、チャンネル、スレッド、送信者の
認可、またはモデルを変更すると、出力が変わる場合があります。プロファイルやオーバーライドを編集するには、
Control UI のツールパネルまたは設定インターフェースを使用してください。

## `/model`: モデルの選択

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

Discord では、`/model`と`/models`で、プロバイダーと
モデルのドロップダウンを備えた対話型ピッカーが開きます。ピッカーは
`provider/*`エントリを含む`agents.defaults.models`に従います。

## `/config`: ディスク上の設定への書き込み

<Note>
  オーナー限定。デフォルトでは無効です。`commands.config: true`で有効にしてください。
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

設定は書き込み前に検証されます。無効な変更は拒否されます。`/config`の
更新内容は再起動後も保持されます。

## `/mcp`: MCP サーバー設定

<Note>
  オーナー限定。デフォルトでは無効です。`commands.mcp: true`で有効にしてください。
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp`は設定を埋め込みエージェントのプロジェクト設定ではなく、OpenClaw の設定に保存します。
`/mcp show`は、認証情報を含むフィールド、認識された認証情報フラグの
値、および既知のシークレット形式の引数を秘匿します。グループから実行した場合、
設定はオーナーへ非公開で送信されます。オーナーへの非公開経路が
利用できない場合、コマンドは安全側に失敗し、オーナーにダイレクト
チャットから再試行するよう求めます。

## `/debug`: ランタイム限定のオーバーライド

<Note>
  オーナー限定。デフォルトでは無効です。`commands.debug: true`で有効にしてください。
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
  書き込みはオーナー限定。デフォルトでは無効です。`commands.plugins: true`で有効にしてください。
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable`は Plugin の設定を更新し、新しいエージェントターン向けに
Gateway の Plugin ランタイムをホットリロードします。`/plugins install`は Plugin の
ソースモジュールが変更されるため、管理対象の Gateway を自動的に再起動します。

## `/trace`: Plugin のトレース出力

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace`は、完全な詳細モードを有効にせず、セッション単位の Plugin のトレース行や
デバッグ行を表示します。これは`/debug`（ランタイムオーバーライド）や`/verbose`（通常の
ツール出力）の代わりにはなりません。

## `/btw`: 補足的な質問

`/btw`は、現在のセッションコンテキストについて手早く補足質問するためのコマンドです。エイリアス: `/side`。

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

通常のメッセージとは異なり、次のように動作します。

- 現在のセッションを背景コンテキストとして使用します。
- Codex ハーネスセッションでは、一時的な Codex のサイドスレッドとして実行されます。
- 以降のセッションコンテキストを変更**しません**。
- トランスクリプト履歴には書き込まれません。

完全な動作については、[BTW の補足質問](/ja-JP/tools/btw)を参照してください。

## インターフェースに関する注意事項

<AccordionGroup>
  <Accordion title="インターフェースごとのセッションスコープ">
    - **テキストコマンド:** 通常のチャットセッションで実行されます（DM は`main`を共有し、グループにはそれぞれ独自のセッションがあります）。
    - **Discord のネイティブコマンド:** `agent:<agentId>:discord:slash:<userId>`
    - **Slack のネイティブコマンド:** `agent:<agentId>:slack:slash:<userId>`（接頭辞は`channels.slack.slashCommand.sessionPrefix`で設定可能）
    - **Telegram のネイティブコマンド:** `telegram:slash:<userId>`（`CommandTargetSessionKey`を介してチャットセッションを対象にします）
    - **`/login codex`**は、デバイスのペアリングコードを非公開チャットまたは Web UI の応答経路からのみ送信します。Telegram のグループやトピックから呼び出した場合、代わりにオーナーへボットに DM するよう求めます。
    - **`/stop`**は、アクティブなチャットセッションを対象にして、現在の実行を中止します。

  </Accordion>
  <Accordion title="Slack 固有の事項">
    `channels.slack.slashCommand`は、単一の`/openclaw`形式のコマンドをサポートします。
    `commands.native: true`の場合は、組み込みコマンドごとに Slack のスラッシュコマンドを
    1 つ作成してください。Slack は`/status`を予約しているため、`/status`ではなく
    `/agentstatus`を登録してください。テキストの`/status`は Slack のメッセージ内でも引き続き機能します。
  </Accordion>
  <Accordion title="高速処理経路とインラインショートカット">
    - 許可リストに登録された送信者からのコマンドのみのメッセージは、即座に処理されます（キューとモデルを迂回します）。
    - インラインショートカット（`/help`、`/commands`、`/status`、`/whoami`）は通常のメッセージ内に埋め込んでも機能し、残りのテキストがモデルに渡される前に除去されます。
    - 認可されていないコマンドのみのメッセージは通知なく無視されます。インラインの`/...`トークンはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="引数に関する注意事項">
    - コマンドと引数の間には、任意で`:`を指定できます（`/think: high`、`/send: on`）。
    - `/new <model>`は、モデルのエイリアス、`provider/model`、またはプロバイダー名（あいまい一致）を受け付けます。一致しない場合、そのテキストはメッセージ本文として扱われます。
    - `/allowlist add|remove`には`commands.config: true`が必要で、チャンネルの`configWrites`に従います。

  </Accordion>
</AccordionGroup>

## プロバイダーの使用状況とステータス

- **プロバイダーの使用量/クォータ**（例: 「Claude 残り 80%」）は、使用量追跡が有効な場合、現在のモデルプロバイダーについて `/status` に表示されます。
- `/status` の**トークン/キャッシュ行**は、ライブセッションのスナップショットに十分な情報がない場合、最新のトランスクリプト使用量エントリにフォールバックできます。
- **実行環境とランタイム:** `/status` は、実効サンドボックスパスを `Execution` として、セッションを実行している主体を `Runtime` として報告します。実行主体は `OpenClaw Default`、`OpenAI Codex`、CLI バックエンド、または ACP バックエンドです。
- **応答ごとのトークン数/コスト:** `/usage off|tokens|full` で制御します。
- `/model status` はモデル/認証/エンドポイントに関するものであり、使用量に関するものではありません。

## 関連項目

<CardGroup cols={2}>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="puzzle-piece">
    Skills のスラッシュコマンドが登録され、利用可否を制御される仕組み。
  </Card>
  <Card title="Skills の作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    独自のスラッシュコマンドを登録する Skills を作成します。
  </Card>
  <Card title="BTW" href="/ja-JP/tools/btw" icon="comments">
    セッションコンテキストを変更せずに補足的な質問をします。
  </Card>
  <Card title="Steer" href="/ja-JP/tools/steer" icon="compass">
    実行中に `/steer` でエージェントを誘導します。
  </Card>
</CardGroup>
