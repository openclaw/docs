---
read_when:
    - チャットコマンドを使用または設定しているとき
    - コマンドのルーティングや権限をデバッグしているとき
summary: 'スラッシュコマンド: テキストとネイティブ、設定、サポートされるコマンド'
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-04-08T06:02:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a7ee7f1a8012058279b9e632889b291d4e659e4ec81209ca8978afbb9ad4b96
    source_path: tools/slash-commands.md
    workflow: 15
---

# スラッシュコマンド

コマンドは Gateway によって処理されます。ほとんどのコマンドは、`/` で始まる**単独の**メッセージとして送信する必要があります。
ホスト専用の bash チャットコマンドは `! <cmd>` を使用します（`/bash <cmd>` はエイリアスです）。

関連するシステムは 2 つあります。

- **コマンド**: 単独の `/...` メッセージ。
- **ディレクティブ**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`。
  - ディレクティブは、モデルがメッセージを見る前に取り除かれます。
  - 通常のチャットメッセージ内では（ディレクティブのみのメッセージではない場合）、これらは「インラインヒント」として扱われ、セッション設定は保持されません。
  - ディレクティブのみのメッセージでは（メッセージがディレクティブだけを含む場合）、セッションに保持され、確認応答が返されます。
  - ディレクティブは**認可された送信者**に対してのみ適用されます。`commands.allowFrom` が設定されている場合、それが使用される唯一の
    許可リストです。そうでない場合、認可はチャンネルの許可リストやペアリングに加えて `commands.useAccessGroups` から決まります。
    未認可の送信者では、ディレクティブは通常のテキストとして扱われます。

**インラインショートカット**もいくつかあります（許可リストに含まれる / 認可された送信者のみ）: `/help`, `/commands`, `/status`, `/whoami` (`/id`)。
これらは即座に実行され、モデルがメッセージを見る前に取り除かれ、残りのテキストは通常のフローを続行します。

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

- `commands.text`（デフォルト `true`）は、チャットメッセージ内での `/...` の解析を有効にします。
  - ネイティブコマンドのないサーフェス（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams）では、これを `false` に設定してもテキストコマンドは引き続き動作します。
- `commands.native`（デフォルト `"auto"`）は、ネイティブコマンドを登録します。
  - Auto: Discord/Telegram ではオン、Slack ではオフ（スラッシュコマンドを追加するまで）、ネイティブサポートのないプロバイダーでは無視されます。
  - プロバイダーごとに上書きするには、`channels.discord.commands.native`、`channels.telegram.commands.native`、または `channels.slack.commands.native` を設定します（bool または `"auto"`）。
  - `false` にすると、起動時に Discord/Telegram で以前登録されたコマンドを削除します。Slack のコマンドは Slack アプリで管理されるため、自動では削除されません。
- `commands.nativeSkills`（デフォルト `"auto"`）は、サポートされている場合に **skill** コマンドをネイティブ登録します。
  - Auto: Discord/Telegram ではオン、Slack ではオフ（Slack では skill ごとにスラッシュコマンドを作成する必要があります）。
  - プロバイダーごとに上書きするには、`channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、または `channels.slack.commands.nativeSkills` を設定します（bool または `"auto"`）。
- `commands.bash`（デフォルト `false`）は、`! <cmd>` によるホストシェルコマンド実行を有効にします（`/bash <cmd>` はエイリアスです。`tools.elevated` の許可リストが必要です）。
- `commands.bashForegroundMs`（デフォルト `2000`）は、bash がバックグラウンドモードに切り替わる前に待機する時間を制御します（`0` の場合は即座にバックグラウンド化します）。
- `commands.config`（デフォルト `false`）は `/config` を有効にします（`openclaw.json` の読み取り / 書き込み）。
- `commands.mcp`（デフォルト `false`）は `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP 設定の読み取り / 書き込み）。
- `commands.plugins`（デフォルト `false`）は `/plugins` を有効にします（プラグインの検出 / 状態、およびインストール + 有効化 / 無効化の操作）。
- `commands.debug`（デフォルト `false`）は `/debug` を有効にします（ランタイム限定のオーバーライド）。
- `commands.restart`（デフォルト `true`）は `/restart` と Gateway 再起動ツールアクションを有効にします。
- `commands.ownerAllowFrom`（省略可能）は、owner 専用のコマンド / ツールサーフェス向けの明示的な owner 許可リストを設定します。これは `commands.allowFrom` とは別です。
- `commands.ownerDisplay` は、システムプロンプト内で owner ID をどのように表示するかを制御します: `raw` または `hash`。
- `commands.ownerDisplaySecret` は、`commands.ownerDisplay="hash"` のときに使用する HMAC シークレットを省略可能で設定します。
- `commands.allowFrom`（省略可能）は、コマンド認可のためのプロバイダーごとの許可リストを設定します。これが構成されている場合、コマンドとディレクティブに対する唯一の認可ソースとなり（チャンネルの許可リスト / ペアリングと `commands.useAccessGroups`
  は無視されます）。グローバルデフォルトには `"*"` を使用し、プロバイダー固有のキーがそれを上書きします。
- `commands.useAccessGroups`（デフォルト `true`）は、`commands.allowFrom` が設定されていない場合に、コマンドに対して許可リスト / ポリシーを適用します。

## コマンド一覧

現在の source-of-truth:

- コアの組み込みコマンドは `src/auto-reply/commands-registry.shared.ts` から
- 生成される dock コマンドは `src/auto-reply/commands-registry.data.ts` から
- プラグインコマンドはプラグインの `registerCommand()` 呼び出しから
- あなたの Gateway で実際に利用できるかどうかは、引き続き設定フラグ、チャンネルサーフェス、インストール / 有効化されたプラグインに依存します

### コアの組み込みコマンド

現在利用可能な組み込みコマンド:

- `/new [model]` は新しいセッションを開始します。`/reset` はリセット用エイリアスです。
- `/compact [instructions]` はセッションコンテキストを圧縮します。[/concepts/compaction](/ja-JP/concepts/compaction) を参照してください。
- `/stop` は現在の実行を中止します。
- `/session idle <duration|off>` と `/session max-age <duration|off>` は、スレッドバインディングの有効期限を管理します。
- `/think <off|minimal|low|medium|high|xhigh>` は thinking レベルを設定します。エイリアス: `/thinking`, `/t`。
- `/verbose on|off|full` は詳細出力を切り替えます。エイリアス: `/v`。
- `/fast [status|on|off]` は高速モードを表示または設定します。
- `/reasoning [on|off|stream]` は reasoning の表示を切り替えます。エイリアス: `/reason`。
- `/elevated [on|off|ask|full]` は elevated モードを切り替えます。エイリアス: `/elev`。
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` は exec のデフォルトを表示または設定します。
- `/model [name|#|status]` はモデルを表示または設定します。
- `/models [provider] [page] [limit=<n>|size=<n>|all]` は、プロバイダーまたはプロバイダーのモデルを一覧表示します。
- `/queue <mode>` は、キューの動作（`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`）と、`debounce:2s cap:25 drop:summarize` のようなオプションを管理します。
- `/help` は短いヘルプ要約を表示します。
- `/commands` は生成されたコマンドカタログを表示します。
- `/tools [compact|verbose]` は、現在このエージェントが使えるものを表示します。
- `/status` は、利用可能な場合はプロバイダー使用量 / クォータを含むランタイム状態を表示します。
- `/tasks` は、現在のセッションのアクティブ / 最近のバックグラウンドタスクを一覧表示します。
- `/context [list|detail|json]` は、コンテキストがどのように組み立てられるかを説明します。
- `/export-session [path]` は、現在のセッションを HTML にエクスポートします。エイリアス: `/export`。
- `/whoami` はあなたの送信者 ID を表示します。エイリアス: `/id`。
- `/skill <name> [input]` は、名前で skill を実行します。
- `/allowlist [list|add|remove] ...` は、許可リストエントリを管理します。テキスト専用です。
- `/approve <id> <decision>` は、exec 承認プロンプトを解決します。
- `/btw <question>` は、将来のセッションコンテキストを変更せずに横道の質問をします。[/tools/btw](/ja-JP/tools/btw) を参照してください。
- `/subagents list|kill|log|info|send|steer|spawn` は、現在のセッションのサブエージェント実行を管理します。
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` は、ACP セッションとランタイムオプションを管理します。
- `/focus <target>` は、現在の Discord スレッドまたは Telegram トピック / 会話をセッションターゲットにバインドします。
- `/unfocus` は、現在のバインディングを削除します。
- `/agents` は、現在のセッションにスレッドバインドされたエージェントを一覧表示します。
- `/kill <id|#|all>` は、実行中の 1 つまたはすべてのサブエージェントを中止します。
- `/steer <id|#> <message>` は、実行中のサブエージェントにステアリングを送信します。エイリアス: `/tell`。
- `/config show|get|set|unset` は `openclaw.json` を読み書きします。owner 専用。`commands.config: true` が必要です。
- `/mcp show|get|set|unset` は、`mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定を読み書きします。owner 専用。`commands.mcp: true` が必要です。
- `/plugins list|inspect|show|get|install|enable|disable` は、プラグイン状態を検査または変更します。`/plugin` はエイリアスです。書き込みは owner 専用です。`commands.plugins: true` が必要です。
- `/debug show|set|unset|reset` は、ランタイム限定の設定オーバーライドを管理します。owner 専用。`commands.debug: true` が必要です。
- `/usage off|tokens|full|cost` は、レスポンスごとの使用量フッターを制御するか、ローカルのコスト要約を表示します。
- `/tts on|off|status|provider|limit|summary|audio|help` は TTS を制御します。[/tools/tts](/ja-JP/tools/tts) を参照してください。
- `/restart` は、有効な場合に OpenClaw を再起動します。デフォルト: 有効。無効にするには `commands.restart: false` を設定します。
- `/activation mention|always` は、グループアクティベーションモードを設定します。
- `/send on|off|inherit` は、送信ポリシーを設定します。owner 専用。
- `/bash <command>` はホストシェルコマンドを実行します。テキスト専用。エイリアス: `! <command>`。`commands.bash: true` と `tools.elevated` の許可リストが必要です。
- `!poll [sessionId]` は、バックグラウンドの bash ジョブを確認します。
- `!stop [sessionId]` は、バックグラウンドの bash ジョブを停止します。

### 生成される dock コマンド

Dock コマンドは、ネイティブコマンドをサポートするチャンネルプラグインから生成されます。現在バンドルされているセット:

- `/dock-discord`（エイリアス: `/dock_discord`）
- `/dock-mattermost`（エイリアス: `/dock_mattermost`）
- `/dock-slack`（エイリアス: `/dock_slack`）
- `/dock-telegram`（エイリアス: `/dock_telegram`）

### バンドルされたプラグインコマンド

バンドルされたプラグインは、さらにスラッシュコマンドを追加できます。このリポジトリで現在バンドルされているコマンド:

- `/dreaming [on|off|status|help]` は、メモリ dreaming を切り替えます。[Dreaming](/ja-JP/concepts/dreaming) を参照してください。
- `/pair [qr|status|pending|approve|cleanup|notify]` は、デバイスのペアリング / セットアップフローを管理します。[Pairing](/ja-JP/channels/pairing) を参照してください。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` は、高リスクの phone node コマンドを一時的にアームします。
- `/voice status|list [limit]|set <voiceId|name>` は Talk 音声設定を管理します。Discord では、ネイティブコマンド名は `/talkvoice` です。
- `/card ...` は LINE のリッチカードプリセットを送信します。[LINE](/ja-JP/channels/line) を参照してください。
- QQBot 専用コマンド:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動的な skill コマンド

ユーザーが呼び出せる skill も、スラッシュコマンドとして公開されます。

- `/skill <name> [input]` は、汎用エントリーポイントとして常に機能します。
- skills は、skill / プラグインがそれらを登録すると `/prose` のような直接コマンドとしても表示されることがあります。
- ネイティブ skill コマンド登録は `commands.nativeSkills` と `channels.<provider>.commands.nativeSkills` によって制御されます。

注:

- コマンドは、コマンドと引数の間に省略可能な `:` を受け付けます（例: `/think: high`, `/send: on`, `/help:`）。
- `/new <model>` は、モデルエイリアス、`provider/model`、またはプロバイダー名（あいまい一致）を受け付けます。一致しない場合、テキストはメッセージ本文として扱われます。
- プロバイダー使用量の完全な内訳を見るには、`openclaw status --usage` を使用します。
- `/allowlist add|remove` には `commands.config=true` が必要で、チャンネルの `configWrites` を尊重します。
- マルチアカウントチャンネルでは、設定対象の `/allowlist --account <id>` と `/config set channels.<provider>.accounts.<id>...` も、対象アカウントの `configWrites` を尊重します。
- `/usage` はレスポンスごとの使用量フッターを制御します。`/usage cost` は OpenClaw セッションログからローカルのコスト要約を表示します。
- `/restart` はデフォルトで有効です。無効にするには `commands.restart: false` を設定します。
- `/plugins install <spec>` は、`openclaw plugins install` と同じプラグイン指定を受け付けます: ローカルパス / アーカイブ、npm パッケージ、または `clawhub:<pkg>`。
- `/plugins enable|disable` は、プラグイン設定を更新し、再起動を促すことがあります。
- Discord 専用ネイティブコマンド: `/vc join|leave|status` は音声チャンネルを制御します（`channels.discord.voice` とネイティブコマンドが必要で、テキストでは利用できません）。
- Discord のスレッドバインディングコマンド（`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`）は、有効なスレッドバインディングが有効である必要があります（`session.threadBindings.enabled` および / または `channels.discord.threadBindings.enabled`）。
- ACP コマンドのリファレンスとランタイム動作: [ACP Agents](/ja-JP/tools/acp-agents)。
- `/verbose` はデバッグと追加の可視性のためのものです。通常使用では**オフ**のままにしてください。
- `/fast on|off` はセッションのオーバーライドを保持します。これをクリアして設定のデフォルトに戻すには、Sessions UI の `inherit` オプションを使用します。
- `/fast` はプロバイダー固有です: OpenAI/OpenAI Codex ではネイティブ Responses エンドポイントで `service_tier=priority` に対応し、`api.anthropic.com` に送られる OAuth 認証トラフィックを含む直接の公開 Anthropic リクエストでは `service_tier=auto` または `standard_only` に対応します。[OpenAI](/ja-JP/providers/openai) と [Anthropic](/ja-JP/providers/anthropic) を参照してください。
- ツール失敗の要約は必要に応じて引き続き表示されますが、詳細な失敗テキストが含まれるのは `/verbose` が `on` または `full` の場合のみです。
- `/reasoning`（および `/verbose`）はグループ設定では危険です: 公開する意図のなかった内部 reasoning やツール出力が漏れる可能性があります。特にグループチャットでは、オフのままにしておくことを推奨します。
- `/model` は、新しいセッションモデルを即座に保持します。
- エージェントがアイドル状態であれば、次の実行ですぐにそれが使われます。
- すでに実行がアクティブな場合、OpenClaw はライブ切り替えを保留中としてマークし、クリーンな再試行ポイントでのみ新しいモデルへ再開します。
- ツールアクティビティまたは応答出力がすでに始まっている場合、その保留中の切り替えは後の再試行機会または次のユーザーターンまでキューに残ることがあります。
- **高速パス:** 許可リストに含まれる送信者からのコマンドのみのメッセージは即座に処理されます（キュー + モデルをバイパス）。
- **グループメンションのゲーティング:** 許可リストに含まれる送信者からのコマンドのみのメッセージは、メンション要件をバイパスします。
- **インラインショートカット（許可リストに含まれる送信者のみ）:** 一部のコマンドは通常メッセージ内に埋め込まれていても動作し、モデルが残りのテキストを見る前に取り除かれます。
  - 例: `hey /status` は status 応答をトリガーし、残りのテキストは通常のフローを続行します。
- 現在: `/help`, `/commands`, `/status`, `/whoami` (`/id`)。
- 未認可のコマンドのみのメッセージは黙って無視され、インラインの `/...` トークンは通常のテキストとして扱われます。
- **Skill コマンド:** `user-invocable` な skills はスラッシュコマンドとして公開されます。名前は `a-z0-9_` にサニタイズされ（最大 32 文字）、衝突した場合は数値サフィックスが付きます（例: `_2`）。
  - `/skill <name> [input]` は、名前で skill を実行します（ネイティブコマンドの制限により skill ごとのコマンドを使えない場合に便利です）。
  - デフォルトでは、skill コマンドは通常のリクエストとしてモデルに転送されます。
  - skills は任意で `command-dispatch: tool` を宣言し、コマンドを直接ツールにルーティングできます（決定的、モデルなし）。
  - 例: `/prose`（OpenProse プラグイン）— [OpenProse](/ja-JP/prose) を参照してください。
- **ネイティブコマンド引数:** Discord は動的オプションにオートコンプリートを使用します（必須引数を省略した場合はボタンメニューも使用します）。Telegram と Slack は、コマンドが選択肢をサポートしていて引数を省略した場合、ボタンメニューを表示します。

## `/tools`

`/tools` が答えるのは設定の質問ではなく、ランタイムの質問です: **このエージェントが今この会話で使えるものは何か**
です。

- デフォルトの `/tools` は簡潔で、すばやく見渡せるよう最適化されています。
- `/tools verbose` は短い説明を追加します。
- 引数をサポートするネイティブコマンドサーフェスでは、同じモード切り替え `compact|verbose` が公開されます。
- 結果はセッションスコープなので、エージェント、チャンネル、スレッド、送信者認可、またはモデルを変更すると
  出力が変わることがあります。
- `/tools` には、コアツール、接続された
  プラグインツール、チャンネル所有ツールを含め、実行時に実際に到達可能なツールが含まれます。

プロファイルやオーバーライドの編集には、`/tools` を静的カタログとして扱うのではなく、
Control UI の Tools パネルまたは config/catalog サーフェスを使用してください。

## 使用量サーフェス（どこに何が表示されるか）

- **プロバイダー使用量 / クォータ**（例: 「Claude 80% left」）は、使用量トラッキングが有効な場合、現在のモデルプロバイダーについて `/status` に表示されます。OpenClaw はプロバイダーのウィンドウを `% left` に正規化します。MiniMax では残量のみの percent フィールドは表示前に反転され、`model_remains` レスポンスではチャットモデルエントリに加えてモデルタグ付きのプランラベルが優先されます。
- `/status` の**トークン / キャッシュ行**は、ライブセッションスナップショットが疎な場合、最新の transcript 使用量エントリにフォールバックできます。既存の非ゼロのライブ値が引き続き優先され、transcript フォールバックでは、保存された合計が欠落しているか小さすぎる場合に、アクティブなランタイムモデルラベルと、より大きいプロンプト指向の合計も復元できます。
- **レスポンスごとのトークン / コスト**は `/usage off|tokens|full` で制御されます（通常の応答に追記されます）。
- `/model status` は使用量ではなく、**モデル / 認証 / エンドポイント**に関するものです。

## モデル選択（`/model`）

`/model` はディレクティブとして実装されています。

例:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

注:

- `/model` と `/model list` は、簡潔で番号付きのピッカー（モデルファミリー + 利用可能なプロバイダー）を表示します。
- Discord では、`/model` と `/models` は、プロバイダーとモデルのドロップダウンに加え、Submit ステップ付きのインタラクティブピッカーを開きます。
- `/model <#>` はそのピッカーから選択し、可能な場合は現在のプロバイダーを優先します。
- `/model status` は詳細ビューを表示し、利用可能な場合は設定済みプロバイダーエンドポイント（`baseUrl`）と API モード（`api`）を含みます。

## デバッグオーバーライド

`/debug` を使うと、**ランタイム限定**の設定オーバーライド（メモリ上、ディスクではない）を設定できます。owner 専用です。デフォルトでは無効で、`commands.debug: true` で有効化します。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

注:

- オーバーライドは新しい config の読み取りに即座に適用されますが、`openclaw.json` には書き込みません。
- `/debug reset` を使うと、すべてのオーバーライドをクリアしてディスク上の config に戻せます。

## 設定更新

`/config` はディスク上の設定（`openclaw.json`）に書き込みます。owner 専用です。デフォルトでは無効で、`commands.config: true` で有効化します。

例:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

注:

- 設定は書き込み前に検証されます。無効な変更は拒否されます。
- `/config` の更新は再起動後も保持されます。

## MCP 更新

`/mcp` は `mcp.servers` 配下の OpenClaw 管理 MCP サーバー定義を書き込みます。owner 専用です。デフォルトでは無効で、`commands.mcp: true` で有効化します。

例:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

注:

- `/mcp` は Pi 所有のプロジェクト設定ではなく、OpenClaw 設定に保存します。
- 実際にどのトランスポートを実行できるかは、ランタイムアダプターが決定します。

## プラグイン更新

`/plugins` を使うと、オペレーターは検出されたプラグインを確認し、設定内で有効化を切り替えられます。読み取り専用フローでは `/plugin` をエイリアスとして使えます。デフォルトでは無効で、`commands.plugins: true` で有効化します。

例:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

注:

- `/plugins list` と `/plugins show` は、現在のワークスペースとディスク上の設定に対して実際のプラグイン検出を使用します。
- `/plugins enable|disable` はプラグイン設定のみを更新します。プラグインのインストールやアンインストールは行いません。
- 有効化 / 無効化の変更後は、適用するために Gateway を再起動してください。

## サーフェスに関する注記

- **テキストコマンド**は通常のチャットセッションで実行されます（DM は `main` を共有し、グループは独自のセッションを持ちます）。
- **ネイティブコマンド**は分離されたセッションを使用します:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>`（プレフィックスは `channels.slack.slashCommand.sessionPrefix` で設定可能）
  - Telegram: `telegram:slash:<userId>`（`CommandTargetSessionKey` を介してチャットセッションをターゲットにします）
- **`/stop`** は、現在の実行を中止できるよう、アクティブなチャットセッションを対象にします。
- **Slack:** `channels.slack.slashCommand` は、単一の `/openclaw` スタイルコマンド向けに引き続きサポートされています。`commands.native` を有効にする場合、組み込みコマンドごとに 1 つの Slack スラッシュコマンドを作成する必要があります（名前は `/help` と同じです）。Slack 向けのコマンド引数メニューは、ephemeral な Block Kit ボタンとして配信されます。
  - Slack ネイティブ例外: Slack は `/status` を予約しているため、`/status` ではなく `/agentstatus` を登録してください。テキストの `/status` は Slack メッセージ内でも引き続き動作します。

## BTW 横道の質問

`/btw` は、現在のセッションについてのすばやい**横道の質問**です。

通常のチャットとは異なり、次のような特徴があります。

- 現在のセッションを背景コンテキストとして使用する
- ツールなしの単発呼び出しとして実行される
- 将来のセッションコンテキストを変更しない
- transcript 履歴には書き込まれない
- 通常のアシスタントメッセージではなく、ライブの横道結果として配信される

そのため、`/btw` はメインの
タスクを進めたまま一時的な確認をしたいときに役立ちます。

例:

```text
/btw what are we doing right now?
```

完全な動作とクライアント UX の
詳細については、[BTW Side Questions](/ja-JP/tools/btw) を参照してください。
