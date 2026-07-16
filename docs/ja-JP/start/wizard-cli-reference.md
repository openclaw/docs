---
read_when:
    - 特定の `openclaw onboard` ステップの詳細な動作が必要です
    - オンボーディング結果をデバッグする場合、またはオンボーディングクライアントを統合する場合
sidebarTitle: CLI reference
summary: openclaw onboard のステップごとの動作：各ステップの処理内容、書き込む設定、内部動作
title: CLI セットアップリファレンス
x-i18n:
    generated_at: "2026-07-16T12:18:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96c1469c6b64f08fd9105c8b737df164d39d27d051bbb9bb4f76b9e1e057785d
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

このページでは、段階的なオンボーディングの動作、出力、内部実装について説明します。
手順については、[オンボーディング（CLI）](/ja-JP/start/wizard)を参照してください。CLI フラグの完全な
リファレンス（すべての `--flag`、非対話型の例、プロバイダー固有の
コマンド）については、[`openclaw onboard`](/ja-JP/cli/onboard)を参照してください。

## ウィザードの機能

ローカルモード（デフォルト）では、次の手順を案内します。

- モデルと認証のセットアップ（Anthropic、OpenAI Code サブスクリプション OAuth、xAI、OpenCode、カスタムエンドポイント、およびその他のプロバイダー所有の認証フロー）
- ワークスペースの場所とブートストラップファイル
- Gateway の設定（ポート、バインド、認証、Tailscale）
- チャンネルとプロバイダー（Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp、およびその他のバンドル済みまたは Plugin のチャンネル）
- Web 検索プロバイダー（任意）
- デーモンのインストール（LaunchAgent、systemd ユーザーユニット、またはスタートアップフォルダーへのフォールバックを備えた Windows ネイティブの Scheduled Task）
- ヘルスチェック
- Skills のセットアップ

リモートモードでは、このマシンから別の場所にある Gateway へ接続するよう設定します。
リモートホストには何もインストールまたは変更しません。

## ローカルフローの詳細

<Steps>
  <Step title="既存設定の検出">
    - `~/.openclaw/openclaw.json` が存在する場合は、**現在の値を維持**、**確認して更新**、または**セットアップ前にリセット**を選択します。
    - 明示的にリセットを選択（または `--reset` を指定）しない限り、ウィザードを再実行しても何も消去されません。
    - CLI の `--reset` はデフォルトで `config+creds+sessions` になります。ワークスペースも削除するには `--reset-scope full` を使用します。
    - 設定が無効であるかレガシーキーを含む場合、ウィザードは停止し、続行する前に `openclaw doctor` を実行するよう求めます。
    - リセットでは状態をゴミ箱へ移動し（直接削除することはありません）、次のスコープを選択できます。
      - 設定のみ
      - 設定 + 認証情報 + セッション
      - 完全リセット（ワークスペースも削除）

  </Step>
  <Step title="モデルと認証">
    - すべての選択肢は、[認証とモデルのオプション](#auth-and-model-options)に記載されています。

  </Step>
  <Step title="ワークスペース">
    - デフォルトは `~/.openclaw/workspace`（設定可能）です。
    - 初回実行時のブートストラップに必要なワークスペースファイルを配置します。
    - ワークスペースのレイアウト：[エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Step>
  <Step title="Gateway">
    - ポート、バインド、認証モード、Tailscale での公開について入力を求めます。
    - 推奨：local loopback の場合でも、ローカルの WS クライアントに認証を必須とするため、トークン認証を有効にしておきます。
    - トークンモードでは、対話型セットアップで次の選択肢が表示されます。
      - **平文トークンを生成して保存**（デフォルト）
      - **SecretRef を使用**（オプトイン）
    - パスワードモードでも、対話型セットアップは平文または SecretRef での保存に対応しています。
    - 非対話型のトークン SecretRef パス：`--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセスの環境に空でない環境変数が必要です。
      - `--gateway-token` とは併用できません。
    - すべてのローカルプロセスを完全に信頼できる場合に限り、認証を無効にしてください。
    - local loopback 以外へのバインドでは、引き続き認証が必要です。

  </Step>
  <Step title="チャンネル">
    - [WhatsApp](/ja-JP/channels/whatsapp)：任意の QR ログイン
    - [Telegram](/ja-JP/channels/telegram)：ボットトークン
    - [Discord](/ja-JP/channels/discord)：ボットトークン
    - [Google Chat](/ja-JP/channels/googlechat)：サービスアカウント JSON + Webhook オーディエンス
    - [Mattermost](/ja-JP/channels/mattermost)：ボットトークン + ベース URL
    - [Signal](/ja-JP/channels/signal)：任意の `signal-cli` のインストール + アカウント設定
    - [iMessage](/ja-JP/channels/imessage)：`imsg` CLI パス + Messages DB へのアクセス。Gateway を Mac 以外で実行する場合は SSH ラッパーを使用します
    - DM のセキュリティ：デフォルトはペアリングです。最初の DM でコードが送信されます。次のコマンドで承認するか、
      `openclaw pairing approve <channel> <code>` または許可リストを使用します。
  </Step>
  <Step title="Web 検索">
    - プロバイダー（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）を選択するか、スキップします。
    - `--skip-search` でこの手順をスキップできます。後から `openclaw configure --section web` で再設定できます。

  </Step>
  <Step title="デーモンのインストール">
    - macOS：LaunchAgent
      - ログイン中のユーザーセッションが必要です。ヘッドレス環境では、カスタム LaunchDaemon（同梱されていません）を使用します。
    - Linux および WSL2 経由の Windows：systemd ユーザーユニット
      - ログアウト後も Gateway を稼働させるため、ウィザードは `loginctl enable-linger <user>` を試行します。
      - sudo を求められる場合があります（`/var/lib/systemd/linger` に書き込みます）。最初に sudo なしで試行します。
    - Windows ネイティブ：最初に Scheduled Task
      - タスク作成が拒否された場合、OpenClaw はユーザーごとのスタートアップフォルダーのログイン項目へフォールバックし、Gateway を直ちに起動します。
      - より優れたスーパーバイザー状態を提供するため、Scheduled Tasks が引き続き推奨されます。
    - ランタイムの選択：OpenClaw の標準ランタイム状態ストアでは `node:sqlite` を使用するため、Node が必要です。

  </Step>
  <Step title="ヘルスチェック">
    - 必要に応じて Gateway を起動し、`openclaw health` を実行します。
    - `openclaw status --deep` は、対応している場合のチャンネルプローブを含め、稼働中の Gateway のヘルスプローブをステータス出力に追加します。

  </Step>
  <Step title="Skills">
    - 利用可能な Skills を読み込み、要件を確認します。
    - Node マネージャーとして npm、pnpm、または bun を選択できます。
    - 必要なインストーラーが利用できる場合、信頼済みのバンドル Skills 用の任意の依存関係を
      インストールします。
    - 利用できない Homebrew、uv、Go インストーラーをスキップし、影響を受ける
      Skills を手動セットアップのガイダンスとともにグループ化します。不足している前提条件を
      インストールした後、`openclaw doctor` を実行します。

  </Step>
  <Step title="完了">
    - 概要と次の手順（iOS、Android、macOS アプリのオプションを含む）。

  </Step>
</Steps>

<Note>
GUI が検出されない場合、ウィザードはブラウザーを開く代わりに、Control UI 用の SSH ポートフォワーディング手順を表示します。
Control UI のアセットがない場合、ウィザードはそのビルドを試行します。フォールバックは `pnpm ui:build` です（UI の依存関係を自動インストールします）。
</Note>

## リモートモードの詳細

リモートモードでは、このマシンから別の場所にある Gateway へ接続するよう設定します。
リモートホストには何もインストールまたは変更しません。

設定する項目：

- リモート Gateway の URL（`ws://...` または `wss://...`）
- リモート Gateway の設定に一致するトークン、パスワード、または認証なし

<Steps>
  <Step title="検出（任意）">
    `dns-sd`（macOS）または `avahi-browse`（Linux）が利用可能な場合、オンボーディングでは
    手動で URL を入力する前に、Bonjour/mDNS の Gateway ビーコンを検索するかどうかを
    選択できます。設定されている場合は、広域 DNS-SD 検出も
    試行されます。ドキュメント：[Gateway の検出](/ja-JP/gateway/discovery)、[Bonjour](/ja-JP/gateway/bonjour)。
  </Step>
  <Step title="接続方法">
    ビーコンを選択した場合は、直接 WebSocket または SSH トンネルを選択します。
    - **直接**：`wss://` 経由で接続し、検出された
      TLS フィンガープリントを信頼するか確認します（初回利用時の信頼によるピン留め。承認した場合のみピン留めされます）。
    - **SSH トンネル**：最初に実行する `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      コマンドを表示し、その後ローカルトンネルのエンドポイントへ接続します。
  </Step>
  <Step title="認証">
    トークン（推奨）、パスワード、または認証なしを選択し、必要に応じて平文ではなく
    SecretRef として保存します。
  </Step>
</Steps>

<Note>
Gateway が local loopback のみに限定され、検出できない場合は、SSH トンネリングまたは tailnet を手動で使用します。
平文の `ws://` は、local loopback、プライベート IP リテラル、`.local`、および Tailnet の `*.ts.net` URL で使用できます。その他のプライベート DNS 名には `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` が必要です。
</Note>

## 認証とモデルのオプション

対話型オンボーディングでプロバイダーのセットアップ手順が失敗した場合（たとえば、ローカルでサインインしていない状態で CLI の再利用オプションを選択した場合）、
ウィザードは終了せず、エラーを表示してプロバイダー選択画面に戻ります。
明示的な `--auth-choice` の実行は、自動化のため引き続き即座に失敗します。

<AccordionGroup>
  <Accordion title="Anthropic API キー">
    `ANTHROPIC_API_KEY` が存在する場合はそれを使用し、存在しない場合はキーの入力を求めて、デーモンで使用するために保存します。
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    対話型オンボーディング/設定で推奨されるローカルパスです。既存の Claude CLI サインインが利用可能な場合は再利用します。
  </Accordion>
  <Accordion title="OpenAI Code サブスクリプション（OAuth）">
    ブラウザーフローで、`code#state` を貼り付けます。

    プライマリモデルがない新規セットアップでは、Codex ランタイムを通じて
    `agents.defaults.model` を `openai/gpt-5.6-sol` に設定します。

  </Accordion>
  <Accordion title="OpenAI Code サブスクリプション（デバイスペアリング）">
    有効期間の短いデバイスコードを使用するブラウザーペアリングフローです。

    プライマリモデルがない新規セットアップでは、Codex ランタイムを通じて
    `agents.defaults.model` を `openai/gpt-5.6-sol` に設定します。

  </Accordion>
  <Accordion title="OpenAI API キー">
    `OPENAI_API_KEY` が存在する場合はそれを使用し、存在しない場合はキーの入力を求めて、認証情報を認証プロファイルに保存します。

    プライマリモデルがない新規セットアップでは、`agents.defaults.model` を
    `openai/gpt-5.6` に設定します。修飾子のない直接 API モデル ID は Sol ティアとして解決されます。

    OpenAI を追加または再認証しても、`openai/gpt-5.5` を含む既存の明示的なプライマリ
    モデルは維持されます。アカウントで GPT-5.6 が公開されていない場合は、
    `openai/gpt-5.5` を明示的に選択してください。OpenClaw が暗黙的にダウングレードすることはありません。

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    対象となる SuperGrok または X Premium アカウントでブラウザーからサインインします。これは、
    ほとんどのユーザーに推奨される xAI の方法です。OpenClaw は、Grok モデル、Grok `web_search`、
    `x_search`、および `code_execution` 用に、生成された認証プロファイルを保存します。
  </Accordion>
  <Accordion title="xAI (Grok) デバイスコード">
    localhost コールバックの代わりに短いコードを使用する、リモート環境向けのブラウザーサインインです。
    SSH、Docker、または VPS ホストから使用します。
  </Accordion>
  <Accordion title="xAI (Grok) API キー">
    `XAI_API_KEY` の入力を求め、xAI をモデルプロバイダーとして設定します。サブスクリプション OAuth ではなく、
    xAI Console API キーを使用する場合に選択します。
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）の入力を求め、Zen または Go カタログを選択できます（1 つの API キーで両方を利用できます）。
    セットアップ URL: [opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API キー（汎用）">
    キーを保存します。
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` の入力を求めます。
    詳細: [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    アカウント ID、Gateway ID、および `CLOUDFLARE_AI_GATEWAY_API_KEY` の入力を求めます。
    詳細: [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    設定は自動的に書き込まれます。ホスト型のデフォルトは `MiniMax-M3` です。API キーのセットアップでは
    `minimax/...`、OAuth のセットアップでは `minimax-portal/...` を使用します。
    詳細: [MiniMax](/ja-JP/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    中国またはグローバルのエンドポイント上の StepFun standard または Step Plan 向けに、設定が自動的に書き込まれます。
    現在、Standard には `step-3.5-flash` が含まれ、Step Plan には `step-3.5-flash-2603` も含まれます。
    詳細: [StepFun](/ja-JP/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（Anthropic 互換）">
    `SYNTHETIC_API_KEY` の入力を求めます。
    詳細: [Synthetic](/ja-JP/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（Cloud およびローカルのオープンモデル）">
    最初に `Cloud + Local`、`Cloud only`、または `Local only` の入力を求めます。
    `Cloud only` は `https://ollama.com` とともに `OLLAMA_API_KEY` を使用します。
    ホストを使用するモードでは、ベース URL（デフォルトは `http://127.0.0.1:11434`）の入力を求め、利用可能なモデルを検出し、デフォルトを提案します。
    `Cloud + Local` は、その Ollama ホストがクラウドアクセス用にサインイン済みかどうかも確認します。
    詳細: [Ollama](/ja-JP/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot および Kimi Coding">
    Moonshot（Kimi K2）および Kimi Coding の設定は自動的に書き込まれます。
    詳細: [Moonshot AI（Kimi + Kimi Coding）](/ja-JP/providers/moonshot)。
  </Accordion>
  <Accordion title="カスタムプロバイダー">
    OpenAI 互換、OpenAI Responses 互換、および Anthropic 互換のエンドポイントで動作します。

    対話型オンボーディングでは、他のプロバイダーの API キーフローと同じ API キー保存方法を選択できます。
    - **API キーを今すぐ貼り付ける**（プレーンテキスト）
    - **シークレット参照を使用する**（環境変数参照または設定済みプロバイダー参照。事前検証あり）

    オンボーディングは、一般的なビジョンモデル ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral、および類似モデル）から画像対応を推測し、モデル名が不明な場合にのみ確認します。

    非対話型フラグ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（省略可能。`CUSTOM_API_KEY` にフォールバック）
    - `--custom-provider-id`（省略可能）
    - `--custom-compatibility <openai|openai-responses|anthropic>`（省略可能。デフォルトは `openai`）
    - `--custom-image-input` / `--custom-text-input`（省略可能。推測されたモデル入力機能を上書き）

  </Accordion>
  <Accordion title="スキップ">
    認証を未設定のままにします。
  </Accordion>
</AccordionGroup>

モデルの動作:

- 検出された選択肢からデフォルトモデルを選ぶか、プロバイダーとモデルを手動で入力します。
- プロバイダー認証の選択からオンボーディングを開始すると、モデル選択画面では
  そのプロバイダーが自動的に優先されます。Volcengine と BytePlus では、この優先設定は
  それぞれのコーディングプランのバリアント（`volcengine-plan/*`、
  `byteplus-plan/*`）にも一致します。
- 優先プロバイダーによる絞り込み結果が空になる場合、モデルを何も表示しないのではなく、
  完全なカタログにフォールバックします。
- ウィザードはモデルチェックを実行し、設定されたモデルが不明、または認証がない場合に警告します。

認証情報とプロファイルのパス:

- 認証プロファイル（API キー + OAuth）: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー OAuth のインポート: `~/.openclaw/credentials/oauth.json`

認証情報の保存モード:

- デフォルトのオンボーディング動作では、API キーをプレーンテキスト値として認証プロファイルに保存します。
- `--secret-input-mode ref` を使用すると、プレーンテキストでのキー保存ではなく参照モードが有効になります。
  対話型セットアップでは、次のいずれかを選択できます。
  - 環境変数参照（例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - プロバイダーのエイリアス + ID を指定した設定済みプロバイダー参照（`file` または `exec`）
- 対話型の参照モードでは、保存前に簡易的な事前検証を実行します。
  - 環境変数参照: 現在のオンボーディング環境で、変数名と空でない値を検証します。
  - プロバイダー参照: プロバイダー設定を検証し、要求された ID を解決します。
  - 事前検証に失敗した場合、オンボーディングはエラーを表示し、再試行できるようにします。
- 非対話型モードでは、`--secret-input-mode ref` は環境変数のみを参照します。
  - オンボーディングプロセスの環境に、プロバイダーの環境変数を設定します。
  - インラインキーフラグ（例: `--openai-api-key`）を使用するには、その環境変数を設定する必要があります。未設定の場合、オンボーディングは即座に失敗します。
  - カスタムプロバイダーの場合、非対話型の `ref` モードでは `models.providers.<id>.apiKey` を `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存します。
  - このカスタムプロバイダーの場合、`--custom-api-key` を使用するには `CUSTOM_API_KEY` を設定する必要があります。未設定の場合、オンボーディングは即座に失敗します。
- 対話型セットアップでは、Gateway の認証情報でプレーンテキストと SecretRef のいずれかを選択できます。
  - トークンモード: **プレーンテキストのトークンを生成して保存**（デフォルト）または **SecretRef を使用**。
  - パスワードモード: プレーンテキストまたは SecretRef。
- 非対話型トークンの SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
- 既存のプレーンテキストによるセットアップは、変更なく引き続き動作します。

<Note>
ヘッドレス環境およびサーバー向けのヒント: ブラウザーがあるマシンで OAuth を完了してから、
そのエージェントの `auth-profiles.json`（例:
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
`$OPENCLAW_STATE_DIR/...` パス）を Gateway ホストにコピーします。`credentials/oauth.json`
はレガシーインポート元としてのみ使用されます。
</Note>

## 出力と内部構造

`~/.openclaw/openclaw.json` の一般的なフィールド:

- `agents.defaults.workspace`
- `--skip-bootstrap` が渡された場合は `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（Minimax を選択した場合）
- `tools.profile`（未設定の場合、ローカルオンボーディングではデフォルトで `"coding"` に設定。既存の明示的な値は維持）
- `gateway.*`（モード、バインド、認証、Tailscale）
- `session.dmScope`（未設定の場合、ローカルオンボーディングではデフォルトで `per-channel-peer` に設定。既存の明示的な値は維持）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- プロンプト中にオプトインした場合のチャンネル許可リスト（Discord、iMessage、Signal、Slack、Telegram、WhatsApp）。Discord と Slack では、入力された名前も ID に解決されます
- `skills.install.nodeManager`
  - `setup --node-manager` フラグには `npm`、`pnpm`、または `bun` を指定できます。
  - 後から手動設定で `skills.install.nodeManager: "yarn"` を設定することもできます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` は `agents.list[]` と、省略可能な `bindings` を書き込みます。

WhatsApp の認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` に保存されます。
アクティブなセッションとトランスクリプトは
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` に保存されます。
`~/.openclaw/agents/<agentId>/sessions/` ディレクトリは、レガシー移行の
入力およびアーカイブ／サポート用アーティファクトに使用されます。

<Note>
一部のチャンネルは Plugin として提供されます。セットアップ中に選択すると、ウィザードは
チャンネル設定の前に Plugin（npm またはローカルパス）のインストールを求めます。
</Note>

## 非対話型セットアップ

`--non-interactive` には `--accept-risk` が必要です（エージェントは強力であり、
システム全体へのアクセスにはリスクがあることを了承します）。

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

全フラグのリファレンスとプロバイダー固有の例: [`openclaw onboard`](/ja-JP/cli/onboard)、[CLI 自動化](/ja-JP/start/wizard-cli-automation)。

## Gateway ウィザード RPC

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

クライアント（macOS アプリおよび Control UI）は、オンボーディングロジックを再実装せずに手順をレンダリングできます。

## Signal のセットアップ動作

- 公式の `signal-cli` GitHub リリースから、適切なリリースアセットをダウンロードします（ネイティブビルド、Linux x86-64 のみ）
- その他のプラットフォーム（macOS、非 x64 Linux）では、代わりに Homebrew を使用してインストールします
- リリースアセットによるインストールを `~/.openclaw/tools/signal-cli/<version>/` に保存します
- 設定に `channels.signal.cliPath` を書き込みます
- ネイティブ Windows はまだサポートされていません。Linux のインストールパスを利用するには、WSL2 内でオンボーディングを実行してください

## 関連ドキュメント

- オンボーディングハブ: [オンボーディング（CLI）](/ja-JP/start/wizard)
- 自動化とスクリプト: [CLI 自動化](/ja-JP/start/wizard-cli-automation)
- コマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
