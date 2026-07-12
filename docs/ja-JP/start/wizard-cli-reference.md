---
read_when:
    - 特定の `openclaw onboard` ステップの詳細な動作が必要です
    - オンボーディング結果をデバッグする場合や、オンボーディングクライアントを統合する場合
sidebarTitle: CLI reference
summary: openclaw onboard のステップごとの動作：各ステップの処理内容、書き込まれる設定、内部動作
title: CLI セットアップリファレンス
x-i18n:
    generated_at: "2026-07-12T14:54:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 56b318b3c5fbaeb37e99871e10b35eae38b209f3a2f683ff85816aca87a4ee6e
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

このページでは、段階的なオンボーディングの動作、出力、内部処理について説明します。
手順の解説については、[オンボーディング（CLI）](/ja-JP/start/wizard)を参照してください。CLI フラグの完全な
リファレンス（すべての `--flag`、非対話型の例、プロバイダー固有の
コマンド）については、[`openclaw onboard`](/ja-JP/cli/onboard)を参照してください。

## ウィザードの動作

ローカルモード（デフォルト）では、以下の手順を案内します。

- モデルと認証のセットアップ（Anthropic、OpenAI Code サブスクリプション OAuth、xAI、OpenCode、カスタムエンドポイント、およびその他のプロバイダー所有の認証フロー）
- ワークスペースの場所とブートストラップファイル
- Gateway 設定（ポート、バインド、認証、Tailscale）
- チャンネルとプロバイダー（Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp、およびその他の同梱チャンネルまたは Plugin チャンネル）
- Web 検索プロバイダー（任意）
- デーモンのインストール（LaunchAgent、systemd ユーザーユニット、またはスタートアップフォルダーへのフォールバックを備えたネイティブ Windows タスク スケジューラ）
- ヘルスチェック
- Skills のセットアップ

リモートモードでは、このマシンから別の場所にある Gateway へ接続するよう設定します。
リモートホストには何もインストールせず、変更も加えません。

## ローカルフローの詳細

<Steps>
  <Step title="既存設定の検出">
    - `~/.openclaw/openclaw.json` が存在する場合は、**現在の値を維持**、**確認して更新**、または**セットアップ前にリセット**を選択します。
    - 明示的にリセットを選択（または `--reset` を指定）しない限り、ウィザードを再実行しても何も消去されません。
    - CLI の `--reset` はデフォルトで `config+creds+sessions` です。ワークスペースも削除するには `--reset-scope full` を使用します。
    - 設定が無効であるか、レガシーキーが含まれている場合、ウィザードは停止し、続行前に `openclaw doctor` を実行するよう求めます。
    - リセットでは状態をゴミ箱へ移動し（直接削除することはありません）、以下のスコープを選択できます。
      - 設定のみ
      - 設定 + 認証情報 + セッション
      - 完全リセット（ワークスペースも削除）

  </Step>
  <Step title="モデルと認証">
    - すべての選択肢については、[認証とモデルのオプション](#auth-and-model-options)を参照してください。

  </Step>
  <Step title="ワークスペース">
    - デフォルトは `~/.openclaw/workspace` です（設定可能）。
    - 初回実行時のブートストラップに必要なワークスペースファイルを作成します。
    - ワークスペースの構成：[エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Step>
  <Step title="Gateway">
    - ポート、バインド、認証モード、Tailscale への公開について入力を求めます。
    - 推奨：ローカルの WS クライアントにも認証を必須とするため、ループバックの場合でもトークン認証を有効にしておきます。
    - トークンモードでは、対話型セットアップで以下を選択できます。
      - **平文トークンを生成して保存**（デフォルト）
      - **SecretRef を使用**（オプトイン）
    - パスワードモードでも、対話型セットアップは平文または SecretRef での保存に対応しています。
    - 非対話型のトークン SecretRef パス：`--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセスの環境に、空でない環境変数が必要です。
      - `--gateway-token` と組み合わせることはできません。
    - すべてのローカルプロセスを完全に信頼できる場合にのみ、認証を無効にしてください。
    - ループバック以外へのバインドでは、引き続き認証が必要です。

  </Step>
  <Step title="チャンネル">
    - [WhatsApp](/ja-JP/channels/whatsapp)：任意の QR ログイン
    - [Telegram](/ja-JP/channels/telegram)：ボットトークン
    - [Discord](/ja-JP/channels/discord)：ボットトークン
    - [Google Chat](/ja-JP/channels/googlechat)：サービスアカウント JSON + Webhook オーディエンス
    - [Mattermost](/ja-JP/channels/mattermost)：ボットトークン + ベース URL
    - [Signal](/ja-JP/channels/signal)：任意の `signal-cli` インストール + アカウント設定
    - [iMessage](/ja-JP/channels/imessage)：`imsg` CLI パス + Messages DB へのアクセス。Gateway が Mac 以外で動作する場合は SSH ラッパーを使用します
    - DM のセキュリティ：デフォルトはペアリングです。最初の DM でコードが送信されます。承認するには
      `openclaw pairing approve <channel> <code>` を実行するか、許可リストを使用します。
  </Step>
  <Step title="Web 検索">
    - プロバイダー（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）を選択するか、スキップします。
    - `--skip-search` でこの手順をスキップできます。後から `openclaw configure --section web` で再設定できます。

  </Step>
  <Step title="デーモンのインストール">
    - macOS：LaunchAgent
      - ログイン済みのユーザーセッションが必要です。ヘッドレス環境では、カスタム LaunchDaemon（同梱されていません）を使用してください。
    - Linux、および WSL2 経由の Windows：systemd ユーザーユニット
      - ログアウト後も Gateway が動作し続けるように、ウィザードは `loginctl enable-linger <user>` の実行を試みます。
      - sudo の入力を求める場合があります（`/var/lib/systemd/linger` に書き込みます）。最初は sudo なしで試行します。
    - ネイティブ Windows：まずタスク スケジューラ
      - タスクの作成が拒否された場合、OpenClaw はユーザー単位のスタートアップフォルダーのログイン項目へフォールバックし、Gateway を直ちに起動します。
      - タスク スケジューラの方が優れたスーパーバイザー状態を提供するため、引き続き推奨されます。
    - ランタイムの選択：対話形式では Node のみが提示されます。Bun は WhatsApp/Telegram の再接続時にメモリを破損する可能性があり、これらのチャンネルではサポート対象のデーモンランタイムではありません。この組み合わせ以外でのみ `--daemon-runtime bun` を指定してください。

  </Step>
  <Step title="ヘルスチェック">
    - 必要に応じて Gateway を起動し、`openclaw health` を実行します。
    - `openclaw status --deep` は、対応している場合のチャンネルプローブを含め、稼働中の Gateway のヘルスプローブをステータス出力に追加します。

  </Step>
  <Step title="Skills">
    - 利用可能な Skills を読み取り、要件を確認します。
    - node マネージャーとして npm、pnpm、または bun を選択できます。
    - 必要なインストーラーが利用可能な場合、信頼済みの同梱 Skills に任意の依存関係を
      インストールします。
    - 利用できない Homebrew、uv、Go のインストーラーをスキップし、影響を受ける
      Skills を手動セットアップの案内とともにグループ化します。不足している前提条件を
      インストールした後、`openclaw doctor` を実行してください。

  </Step>
  <Step title="完了">
    - iOS、Android、macOS アプリの選択肢を含む、概要と次の手順を表示します。

  </Step>
</Steps>

<Note>
GUI が検出されない場合、ウィザードはブラウザーを開く代わりに、Control UI 用の SSH ポートフォワーディング手順を出力します。
Control UI のアセットがない場合、ウィザードはビルドを試みます。フォールバックは `pnpm ui:build` です（UI の依存関係を自動インストールします）。
</Note>

## リモートモードの詳細

リモートモードでは、このマシンから別の場所にある Gateway へ接続するよう設定します。
リモートホストには何もインストールせず、変更も加えません。

設定する項目：

- リモート Gateway の URL（`ws://...` または `wss://...`）
- リモート Gateway の設定に一致するトークン、パスワード、または認証なし

<Steps>
  <Step title="検出（任意）">
    `dns-sd`（macOS）または `avahi-browse`（Linux）が利用可能な場合、オンボーディングでは
    URL の手動入力へフォールバックする前に、Bonjour/mDNS の Gateway ビーコンを
    検索できます。設定されている場合は、広域 DNS-SD 検出も試行されます。
    ドキュメント：[Gateway の検出](/ja-JP/gateway/discovery)、[Bonjour](/ja-JP/gateway/bonjour)。
  </Step>
  <Step title="接続方法">
    ビーコンを選択した場合、直接 WebSocket または SSH トンネルを選択します。
    - **直接**：`wss://` 経由で接続し、検出された TLS フィンガープリントを信頼するか確認します
      （初回利用時に信頼する方式で固定し、承認した場合にのみ固定されます）。
    - **SSH トンネル**：最初に実行する `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      コマンドを出力し、その後ローカルトンネルのエンドポイントへ接続します。
  </Step>
  <Step title="認証">
    トークン（推奨）、パスワード、または認証なしを選択し、必要に応じて平文ではなく
    SecretRef として保存します。
  </Step>
</Steps>

<Note>
Gateway がループバック専用で検出できない場合は、SSH トンネリングまたは tailnet を手動で使用してください。
平文の `ws://` は、ループバック、プライベート IP リテラル、`.local`、および Tailnet の `*.ts.net` URL で使用できます。それ以外のプライベート DNS 名には `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` が必要です。
</Note>

## 認証とモデルのオプション

対話型オンボーディングでプロバイダーのセットアップ手順が失敗した場合（たとえば、ローカルでサインインしていない状態で CLI の再利用オプションを選んだ場合）、
ウィザードは終了せず、エラーを表示してプロバイダー選択画面へ戻ります。
明示的な `--auth-choice` の実行では、自動化のため引き続き即座に失敗します。

<AccordionGroup>
  <Accordion title="Anthropic API キー">
    `ANTHROPIC_API_KEY` が存在する場合はそれを使用し、存在しない場合はキーの入力を求めて、デーモンで使用できるよう保存します。
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    対話型のオンボーディングまたは設定で推奨されるローカルパスです。利用可能な場合は、既存の Claude CLI サインインを再利用します。
  </Accordion>
  <Accordion title="OpenAI Code サブスクリプション（OAuth）">
    ブラウザーフローです。`code#state` を貼り付けます。

    プライマリモデルがない新規セットアップでは、Codex ランタイムを通じて
    `agents.defaults.model` を `openai/gpt-5.6-sol` に設定します。

  </Accordion>
  <Accordion title="OpenAI Code サブスクリプション（デバイスペアリング）">
    有効期間の短いデバイスコードを使用するブラウザーペアリングフローです。

    プライマリモデルがない新規セットアップでは、Codex ランタイムを通じて
    `agents.defaults.model` を `openai/gpt-5.6-sol` に設定します。

  </Accordion>
  <Accordion title="OpenAI API キー">
    `OPENAI_API_KEY` が存在する場合はそれを使用し、存在しない場合はキーの入力を求めて、認証プロファイルに認証情報を保存します。

    プライマリモデルがない新規セットアップでは、`agents.defaults.model` を
    `openai/gpt-5.6` に設定します。修飾子のない直接 API モデル ID は Sol ティアに解決されます。

    OpenAI の追加または再認証では、`openai/gpt-5.5` を含め、既存の明示的なプライマリ
    モデルが維持されます。アカウントで GPT-5.6 が提供されていない場合は、
    `openai/gpt-5.5` を明示的に選択してください。OpenClaw が暗黙的にダウングレードすることはありません。

  </Accordion>
  <Accordion title="xAI（Grok）OAuth">
    対象となる SuperGrok または X Premium アカウント向けのブラウザーサインインです。これは
    ほとんどのユーザーに推奨される xAI の方法です。OpenClaw は、生成された認証
    プロファイルを Grok モデル、Grok の `web_search`、`x_search`、`code_execution` 用に保存します。
  </Accordion>
  <Accordion title="xAI（Grok）デバイスコード">
    localhost コールバックの代わりに短いコードを使用する、リモート環境向けのブラウザーサインインです。
    SSH、Docker、または VPS ホストから使用してください。
  </Accordion>
  <Accordion title="xAI（Grok）API キー">
    `XAI_API_KEY` の入力を求め、xAI をモデルプロバイダーとして設定します。サブスクリプション OAuth ではなく
    xAI Console の API キーを使用する場合に選択してください。
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）の入力を求め、Zen または Go カタログを選択できます（1 つの API キーで両方を利用できます）。
    セットアップ URL：[opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API キー（汎用）">
    キーを保存します。
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` の入力を求めます。
    詳細：[Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    アカウント ID、Gateway ID、`CLOUDFLARE_AI_GATEWAY_API_KEY` の入力を求めます。
    詳細：[Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    設定は自動的に書き込まれます。ホスト版のデフォルトは `MiniMax-M3` です。API キーのセットアップでは
    `minimax/...`、OAuth のセットアップでは `minimax-portal/...` を使用します。
    詳細：[MiniMax](/ja-JP/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    中国またはグローバルのエンドポイントに対して、StepFun standard または Step Plan の設定が自動的に書き込まれます。
    現在、Standard には `step-3.5-flash` が含まれ、Step Plan には `step-3.5-flash-2603` も含まれます。
    詳細：[StepFun](/ja-JP/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（Anthropic 互換）">
    `SYNTHETIC_API_KEY` の入力を求めます。
    詳細：[Synthetic](/ja-JP/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（クラウドおよびローカルのオープンモデル）">
    最初に `Cloud + Local`、`Cloud only`、または `Local only` の選択を求めます。
    `Cloud only` では、`https://ollama.com` とともに `OLLAMA_API_KEY` を使用します。
    ホストを使用するモードでは、ベース URL（デフォルトは `http://127.0.0.1:11434`）の入力を求め、利用可能なモデルを検出してデフォルトを提案します。
    `Cloud + Local` では、その Ollama ホストがクラウドアクセス用にサインイン済みかどうかも確認します。
    詳細：[Ollama](/ja-JP/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot と Kimi Coding">
    Moonshot（Kimi K2）と Kimi Coding の設定は自動的に書き込まれます。
    詳細：[Moonshot AI（Kimi + Kimi Coding）](/ja-JP/providers/moonshot)。
  </Accordion>
  <Accordion title="カスタムプロバイダー">
    OpenAI 互換、OpenAI Responses 互換、および Anthropic 互換のエンドポイントで動作します。

    対話型オンボーディングでは、他のプロバイダー API キーフローと同じ API キー保存方法を選択できます。
    - **今すぐ API キーを貼り付ける**（平文）
    - **シークレット参照を使用**（環境変数参照または設定済みプロバイダー参照、事前検証あり）

    オンボーディングは、一般的なビジョンモデル ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral など）から画像対応を推定し、モデル名が不明な場合にのみ確認します。

    非対話型フラグ：
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（任意。未指定時は `CUSTOM_API_KEY` を使用）
    - `--custom-provider-id`（任意）
    - `--custom-compatibility <openai|openai-responses|anthropic>`（任意。デフォルトは `openai`）
    - `--custom-image-input` / `--custom-text-input`（任意。推定されたモデル入力機能を上書き）

  </Accordion>
  <Accordion title="スキップ">
    認証を未設定のままにします。
  </Accordion>
</AccordionGroup>

モデルの動作：

- 検出された選択肢からデフォルトモデルを選ぶか、プロバイダーとモデルを手動で入力します。
- プロバイダーの認証方法を選択してオンボーディングを開始した場合、モデル選択画面では
  そのプロバイダーが自動的に優先されます。Volcengine と BytePlus では、同じ優先設定が
  コーディングプランのバリアント（`volcengine-plan/*`、
  `byteplus-plan/*`）にも適用されます。
- 優先プロバイダーによる絞り込み結果が空になる場合、モデルを何も表示しないのではなく、
  完全なカタログにフォールバックします。
- ウィザードはモデルを確認し、設定されたモデルが不明な場合や認証がない場合に警告します。

認証情報とプロファイルのパス：

- 認証プロファイル（API キー + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧形式の OAuth インポート：`~/.openclaw/credentials/oauth.json`

認証情報の保存モード：

- デフォルトのオンボーディングでは、API キーを認証プロファイルに平文値として保存します。
- `--secret-input-mode ref` を指定すると、平文のキー保存ではなく参照モードが有効になります。
  対話型セットアップでは、次のいずれかを選択できます。
  - 環境変数参照（例：`keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - プロバイダーのエイリアスと ID を指定した、設定済みプロバイダー参照（`file` または `exec`）
- 対話型の参照モードでは、保存前に迅速な事前検証を実行します。
  - 環境変数参照：現在のオンボーディング環境で、変数名と値が空でないことを検証します。
  - プロバイダー参照：プロバイダー設定を検証し、要求された ID を解決します。
  - 事前検証に失敗した場合、オンボーディングはエラーを表示し、再試行できるようにします。
- 非対話型モードでは、`--secret-input-mode ref` は環境変数を使用する場合にのみ対応します。
  - オンボーディングプロセスの環境で、プロバイダーの環境変数を設定します。
  - インラインキーフラグ（例：`--openai-api-key`）を使用するには、その環境変数が設定されている必要があります。設定されていない場合、オンボーディングは即座に失敗します。
  - カスタムプロバイダーでは、非対話型の `ref` モードにより `models.providers.<id>.apiKey` が `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存されます。
  - このカスタムプロバイダーの場合、`--custom-api-key` を使用するには `CUSTOM_API_KEY` が設定されている必要があります。設定されていない場合、オンボーディングは即座に失敗します。
- Gateway の認証情報では、対話型セットアップで平文と SecretRef のいずれかを選択できます。
  - トークンモード：**平文トークンを生成して保存**（デフォルト）または **SecretRef を使用**。
  - パスワードモード：平文または SecretRef。
- 非対話型のトークン SecretRef パス：`--gateway-token-ref-env <ENV_VAR>`。
- 既存の平文セットアップは、そのまま変更なく動作し続けます。

<Note>
ヘッドレス環境およびサーバー向けのヒント：ブラウザーがあるマシンで OAuth を完了してから、
そのエージェントの `auth-profiles.json`（例：
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
`$OPENCLAW_STATE_DIR/...` パス）を Gateway ホストにコピーします。`credentials/oauth.json`
は旧形式のインポート元としてのみ使用されます。
</Note>

## 出力と内部構造

`~/.openclaw/openclaw.json` の代表的なフィールド：

- `agents.defaults.workspace`
- `--skip-bootstrap` を渡した場合の `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（Minimax を選択した場合）
- `tools.profile`（ローカルオンボーディングでは、未設定の場合のデフォルトは `"coding"`。明示的に設定された既存の値は保持されます）
- `gateway.*`（モード、バインド、認証、Tailscale）
- `session.dmScope`（ローカルオンボーディングでは、未設定の場合のデフォルトは `per-channel-peer`。明示的に設定された既存の値は保持されます）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- プロンプトで有効化を選択した場合のチャンネル許可リスト（Discord、iMessage、Signal、Slack、Telegram、WhatsApp）。Discord と Slack では、入力された名前も ID に解決されます
- `skills.install.nodeManager`
  - `setup --node-manager` フラグは `npm`、`pnpm`、または `bun` を受け付けます。
  - 後から手動設定で `skills.install.nodeManager: "yarn"` を指定することもできます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` は `agents.list[]` と、任意で `bindings` を書き込みます。

WhatsApp の認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` に保存されます。
アクティブなセッションとトランスクリプトは
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` に保存されます。
`~/.openclaw/agents/<agentId>/sessions/` ディレクトリは、旧形式の移行入力と
アーカイブ／サポート用成果物に使用されます。

<Note>
一部のチャンネルはプラグインとして提供されます。セットアップ中に選択すると、ウィザードは
チャンネルを設定する前にプラグイン（npm またはローカルパス）のインストールを求めます。
</Note>

## 非対話型セットアップ

`--non-interactive` には `--accept-risk` が必要です（エージェントが
強力であり、システムへのフルアクセスにはリスクがあることを承認します）。

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

フラグの完全なリファレンスとプロバイダー固有の例：[`openclaw onboard`](/ja-JP/cli/onboard)、[CLI 自動化](/ja-JP/start/wizard-cli-automation)。

## Gateway ウィザード RPC

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

クライアント（macOS アプリと Control UI）は、オンボーディングロジックを再実装せずに各ステップを表示できます。

## Signal セットアップの動作

- 公式の `signal-cli` GitHub リリースから適切なリリースアセットをダウンロードします（ネイティブビルド、Linux x86-64 のみ）
- その他のプラットフォーム（macOS、x64 以外の Linux）では、代わりに Homebrew を使用してインストールします
- リリースアセットからのインストール先は `~/.openclaw/tools/signal-cli/<version>/` です
- 設定に `channels.signal.cliPath` を書き込みます
- ネイティブ Windows はまだサポートされていません。Linux のインストールパスを使用するには、WSL2 内でオンボーディングを実行してください

## 関連ドキュメント

- オンボーディングハブ：[オンボーディング（CLI）](/ja-JP/start/wizard)
- 自動化とスクリプト：[CLI 自動化](/ja-JP/start/wizard-cli-automation)
- コマンドリファレンス：[`openclaw onboard`](/ja-JP/cli/onboard)
