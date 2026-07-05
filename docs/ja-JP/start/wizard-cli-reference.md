---
read_when:
    - 特定の `openclaw onboard` ステップの詳細な動作が必要です
    - オンボーディング結果をデバッグしている、またはオンボーディングクライアントを統合している
sidebarTitle: CLI reference
summary: 'openclaw onboard のステップごとの挙動: 各ステップが行うこと、書き込む設定、内部処理'
title: CLI セットアップリファレンス
x-i18n:
    generated_at: "2026-07-05T11:52:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ac01078241e0dfdbadf065bbe3c42b543c76596ed63af12e47af683e5f6691f8
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

このページでは、ステップごとのオンボーディングの動作、出力、内部実装を扱います。
手順説明は [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。CLI フラグの完全な
リファレンス（すべての `--flag`、非対話型の例、プロバイダー固有の
コマンド）は、[`openclaw onboard`](/ja-JP/cli/onboard) を参照してください。

## ウィザードが行うこと

ローカルモード（デフォルト）では、次を順に設定します。

- モデルと認証のセットアップ（Anthropic、OpenAI Code サブスクリプション OAuth、xAI、OpenCode、カスタムエンドポイント、その他のプロバイダー所有の認証フロー）
- ワークスペースの場所とブートストラップファイル
- Gateway 設定（ポート、バインド、認証、Tailscale）
- チャネルとプロバイダー（Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp、その他のバンドル済みまたは Plugin チャネル）
- Web 検索プロバイダー（任意）
- デーモンのインストール（LaunchAgent、systemd ユーザーユニット、またはスタートアップフォルダーのフォールバック付きのネイティブ Windows Scheduled Task）
- ヘルスチェック
- Skills のセットアップ

リモートモードでは、このマシンを別の場所にある Gateway に接続するよう設定します。リモートホストには何もインストールせず、変更もしません。

## ローカルフローの詳細

<Steps>
  <Step title="既存設定の検出">
    - `~/.openclaw/openclaw.json` が存在する場合は、**現在の値を維持**、**確認して更新**、または **セットアップ前にリセット** を選択します。
    - ウィザードを再実行しても、明示的にリセットを選択しない限り（または `--reset` を渡さない限り）何も消去されません。
    - CLI の `--reset` はデフォルトで `config+creds+sessions` です。ワークスペースも削除するには `--reset-scope full` を使用します。
    - 設定が無効、またはレガシーキーを含む場合、ウィザードは停止し、続行前に `openclaw doctor` を実行するよう求めます。
    - リセットは状態をゴミ箱へ移動し（直接削除はしません）、次のスコープを提示します。
      - 設定のみ
      - 設定 + 認証情報 + セッション
      - フルリセット（ワークスペースも削除）

  </Step>
  <Step title="モデルと認証">
    - 完全なオプション一覧は [認証とモデルのオプション](#auth-and-model-options) にあります。

  </Step>
  <Step title="ワークスペース">
    - デフォルトは `~/.openclaw/workspace`（設定可能）です。
    - 初回実行時のブートストラップに必要なワークスペースファイルを配置します。
    - ワークスペースのレイアウト: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Step>
  <Step title="Gateway">
    - ポート、バインド、認証モード、Tailscale 公開を確認します。
    - 推奨: loopback の場合でもトークン認証を有効にして、ローカル WS クライアントに認証を必須にします。
    - トークンモードでは、対話型セットアップで次を提示します。
      - **プレーンテキストトークンを生成/保存**（デフォルト）
      - **SecretRef を使用**（オプトイン）
    - パスワードモードでは、対話型セットアップでプレーンテキストまたは SecretRef の保存もサポートします。
    - 非対話型のトークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセスの環境に空でない環境変数が必要です。
      - `--gateway-token` とは組み合わせられません。
    - すべてのローカルプロセスを完全に信頼できる場合にのみ、認証を無効にしてください。
    - 非 loopback バインドでは引き続き認証が必要です。

  </Step>
  <Step title="チャネル">
    - [WhatsApp](/ja-JP/channels/whatsapp): 任意の QR ログイン
    - [Telegram](/ja-JP/channels/telegram): bot トークン
    - [Discord](/ja-JP/channels/discord): bot トークン
    - [Google Chat](/ja-JP/channels/googlechat): サービスアカウント JSON + webhook オーディエンス
    - [Mattermost](/ja-JP/channels/mattermost): bot トークン + ベース URL
    - [Signal](/ja-JP/channels/signal): 任意の `signal-cli` インストール + アカウント設定
    - [iMessage](/ja-JP/channels/imessage): `imsg` CLI パス + Messages DB アクセス。Gateway が Mac 以外で動作する場合は SSH ラッパーを使用します。
    - DM セキュリティ: デフォルトはペアリングです。最初の DM でコードを送信します。
      `openclaw pairing approve <channel> <code>` で承認するか、許可リストを使用します。
  </Step>
  <Step title="Web 検索">
    - プロバイダー（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）を選択するか、スキップします。
    - この手順は `--skip-search` でスキップできます。あとで `openclaw configure --section web` で再設定します。

  </Step>
  <Step title="デーモンのインストール">
    - macOS: LaunchAgent
      - ログイン中のユーザーセッションが必要です。ヘッドレスでは、カスタム LaunchDaemon（同梱されていません）を使用します。
    - Linux および WSL2 経由の Windows: systemd ユーザーユニット
      - ウィザードは、ログアウト後も gateway が起動し続けるよう `loginctl enable-linger <user>` を試行します。
      - sudo を求める場合があります（`/var/lib/systemd/linger` に書き込みます）。まず sudo なしで試します。
    - ネイティブ Windows: 最初に Scheduled Task
      - タスク作成が拒否された場合、OpenClaw はユーザー単位のスタートアップフォルダーのログイン項目にフォールバックし、gateway を即座に起動します。
      - Scheduled Tasks はよりよいスーパーバイザーステータスを提供するため、引き続き推奨されます。
    - ランタイム選択: 対話型では Node のみ提示されます。Bun は WhatsApp/Telegram の再接続時にメモリを破損する可能性があり、これらのチャネルではサポート対象のデーモンランタイムではありません。この組み合わせ以外でのみ `--daemon-runtime bun` を渡してください。

  </Step>
  <Step title="ヘルスチェック">
    - gateway を起動し（必要な場合）、`openclaw health` を実行します。
    - `openclaw status --deep` は、サポートされている場合のチャネルプローブを含め、ライブ gateway ヘルスプローブをステータス出力に追加します。

  </Step>
  <Step title="Skills">
    - 利用可能な skills を読み取り、要件を確認します。
    - node マネージャーを選択できます: npm、pnpm、または bun。
    - 必要なインストーラーが利用可能な場合、信頼済みのバンドル済み skills の任意依存関係をインストールします。
    - 利用できない Homebrew、uv、Go インストーラーはスキップし、影響を受ける
      skills を手動セットアップの案内とともにグループ化します。不足している前提条件をインストールした後に
      `openclaw doctor` を実行してください。

  </Step>
  <Step title="完了">
    - iOS、Android、macOS アプリのオプションを含む概要と次の手順。

  </Step>
</Steps>

<Note>
GUI が検出されない場合、ウィザードはブラウザーを開く代わりに Control UI 用の SSH ポート転送手順を出力します。
Control UI アセットが見つからない場合、ウィザードはそれらのビルドを試行します。フォールバックは `pnpm ui:build` です（UI 依存関係を自動インストールします）。
</Note>

## リモートモードの詳細

リモートモードでは、このマシンを別の場所にある Gateway に接続するよう設定します。リモートホストには何もインストールせず、変更もしません。

設定する内容:

- リモート gateway URL（`ws://...` または `wss://...`）
- リモート Gateway の設定に一致する、トークン、パスワード、または認証なし

<Steps>
  <Step title="検出（任意）">
    `dns-sd`（macOS）または `avahi-browse`（Linux）が利用可能な場合、オンボーディングは
    手動 URL 入力にフォールバックする前に Bonjour/mDNS gateway ビーコンを検索するかを提示します。
    設定されている場合は、広域 DNS-SD 検出も試行されます。
    ドキュメント: [Gateway 検出](/ja-JP/gateway/discovery)、[Bonjour](/ja-JP/gateway/bonjour)。
  </Step>
  <Step title="接続方法">
    ビーコンを選択した場合は、直接 WebSocket または SSH トンネルを選択します。
    - **直接**: `wss://` で接続し、検出された TLS フィンガープリントを信頼するか確認します（初回使用時に信頼して固定。承認した場合のみ固定されます）。
    - **SSH トンネル**: 先に実行する `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      コマンドを出力し、その後ローカルトンネルエンドポイントに接続します。
  </Step>
  <Step title="認証">
    トークン（推奨）、パスワード、または認証なしを選択し、任意でプレーンテキストの代わりに SecretRef として保存します。
  </Step>
</Steps>

<Note>
gateway が loopback 専用で検出できない場合は、SSH トンネリングまたは tailnet を手動で使用してください。
プレーンテキストの `ws://` は、loopback、プライベート IP リテラル、`.local`、Tailnet `*.ts.net` URL で受け入れられます。その他のプライベート DNS 名には `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` が必要です。
</Note>

## 認証とモデルのオプション

<AccordionGroup>
  <Accordion title="Anthropic API キー">
    `ANTHROPIC_API_KEY` が存在する場合はそれを使用し、存在しない場合はキーの入力を求めて、デーモンで使用できるよう保存します。
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    対話型のオンボーディング/設定では推奨されるローカルパスです。利用可能な場合は既存の Claude CLI サインインを再利用します。
  </Accordion>
  <Accordion title="OpenAI Code サブスクリプション (OAuth)">
    ブラウザーフローです。`code#state` を貼り付けます。

    モデルが未設定、またはすでに OpenAI ファミリーの場合、Codex ランタイムを通じて `agents.defaults.model` を `openai/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="OpenAI Code サブスクリプション（デバイスペアリング）">
    短命のデバイスコードを使うブラウザーペアリングフローです。

    モデルが未設定、またはすでに OpenAI ファミリーの場合、Codex ランタイムを通じて `agents.defaults.model` を `openai/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="OpenAI API キー">
    `OPENAI_API_KEY` が存在する場合はそれを使用し、存在しない場合はキーの入力を求めて、その認証情報を認証プロファイルに保存します。

    モデルが未設定、`openai/*`、またはレガシー Codex モデル参照の場合、`agents.defaults.model` を `openai/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    対象の SuperGrok または X Premium アカウント向けのブラウザーサインインです。これはほとんどのユーザーに推奨される xAI パスです。OpenClaw は、Grok モデル、Grok `web_search`、`x_search`、`code_execution` 用に、生成された認証プロファイルを保存します。
  </Accordion>
  <Accordion title="xAI (Grok) デバイスコード">
    localhost コールバックの代わりに短いコードを使う、リモート向けのブラウザーサインインです。SSH、Docker、または VPS ホストから使用します。
  </Accordion>
  <Accordion title="xAI (Grok) API キー">
    `XAI_API_KEY` の入力を求め、xAI をモデルプロバイダーとして設定します。サブスクリプション OAuth の代わりに xAI Console API キーを使用したい場合に使います。
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）の入力を求め、Zen または Go カタログを選択できます（1 つの API キーで両方をカバーします）。
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
    アカウント ID、gateway ID、`CLOUDFLARE_AI_GATEWAY_API_KEY` の入力を求めます。
    詳細: [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    設定は自動で書き込まれます。ホスト型のデフォルトは `MiniMax-M3` です。API キーセットアップでは
    `minimax/...` を使用し、OAuth セットアップでは `minimax-portal/...` を使用します。
    詳細: [MiniMax](/ja-JP/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    StepFun standard または Step Plan の設定は、中国またはグローバルエンドポイント向けに自動で書き込まれます。
    Standard には現在 `step-3.5-flash` が含まれ、Step Plan には `step-3.5-flash-2603` も含まれます。
    詳細: [StepFun](/ja-JP/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（Anthropic 互換）">
    `SYNTHETIC_API_KEY` の入力を求めます。
    詳細: [Synthetic](/ja-JP/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（クラウドおよびローカルのオープンモデル）">
    まず `Cloud + Local`、`Cloud only`、または `Local only` の入力を求めます。
    `Cloud only` は `https://ollama.com` で `OLLAMA_API_KEY` を使用します。
    ホストを使うモードでは、ベース URL（デフォルト `http://127.0.0.1:11434`）の入力を求め、利用可能なモデルを検出し、デフォルトを提案します。
    `Cloud + Local` は、その Ollama ホストがクラウドアクセスにサインインしているかも確認します。
    詳細: [Ollama](/ja-JP/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot と Kimi Coding">
    Moonshot（Kimi K2）と Kimi Coding の設定は自動で書き込まれます。
    詳細: [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)。
  </Accordion>
  <Accordion title="カスタムプロバイダー">
    OpenAI 互換、OpenAI Responses 互換、Anthropic 互換のエンドポイントで動作します。

    対話型オンボーディングは、他のプロバイダー API キーフローと同じ API キー保存方法をサポートします。
    - **API キーを今すぐ貼り付け**（プレーンテキスト）
    - **シークレット参照を使用**（env ref または設定済みプロバイダー参照。事前検証あり）

    オンボーディングは一般的な vision モデル ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral など）の画像サポートを推測し、モデル名が不明な場合のみ質問します。

    非対話フラグ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (任意。`CUSTOM_API_KEY` にフォールバック)
    - `--custom-provider-id` (任意)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (任意。デフォルトは `openai`)
    - `--custom-image-input` / `--custom-text-input` (任意。推定されたモデル入力機能を上書き)

  </Accordion>
  <Accordion title="Skip">
    認証を未構成のままにします。
  </Accordion>
</AccordionGroup>

モデルの動作:

- 検出された選択肢からデフォルトモデルを選ぶか、プロバイダーとモデルを手動で入力します。
- オンボーディングがプロバイダー認証の選択から始まった場合、モデルピッカーは
  そのプロバイダーを自動的に優先します。Volcengine と BytePlus では、同じ優先設定が
  それぞれのコーディングプランのバリアント (`volcengine-plan/*`,
  `byteplus-plan/*`) にも一致します。
- その優先プロバイダーのフィルターが空になる場合、ピッカーは
  モデルなしを表示する代わりに完全なカタログへフォールバックします。
- ウィザードはモデルチェックを実行し、構成済みモデルが不明または認証不足の場合に警告します。

認証情報とプロファイルのパス:

- 認証プロファイル (API キー + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー OAuth インポート: `~/.openclaw/credentials/oauth.json`

認証情報の保存モード:

- デフォルトのオンボーディング動作では、API キーを認証プロファイル内に平文値として永続化します。
- `--secret-input-mode ref` は、平文キー保存の代わりに参照モードを有効にします。
  対話型セットアップでは、次のいずれかを選択できます:
  - 環境変数参照 (例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - プロバイダーの別名 + id を持つ構成済みプロバイダー参照 (`file` または `exec`)
- 対話型参照モードは、保存前に高速な事前検証を実行します。
  - 環境変数参照: 現在のオンボーディング環境で、変数名 + 空でない値を検証します。
  - プロバイダー参照: プロバイダー構成を検証し、要求された id を解決します。
  - 事前検証に失敗した場合、オンボーディングはエラーを表示し、再試行できるようにします。
- 非対話モードでは、`--secret-input-mode ref` は環境変数ベースのみです。
  - オンボーディングプロセス環境でプロバイダー環境変数を設定します。
  - インラインキーフラグ (例: `--openai-api-key`) では、その環境変数が設定されている必要があります。設定されていない場合、オンボーディングは即座に失敗します。
  - カスタムプロバイダーでは、非対話の `ref` モードは `models.providers.<id>.apiKey` を `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存します。
  - そのカスタムプロバイダーの場合、`--custom-api-key` では `CUSTOM_API_KEY` が設定されている必要があります。設定されていない場合、オンボーディングは即座に失敗します。
- Gateway 認証情報は、対話型セットアップで平文と SecretRef の選択肢をサポートします:
  - トークンモード: **平文トークンを生成/保存** (デフォルト) または **SecretRef を使用**。
  - パスワードモード: 平文または SecretRef。
- 非対話トークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
- 既存の平文セットアップは変更なしで引き続き動作します。

<Note>
ヘッドレスおよびサーバー向けのヒント: ブラウザーがあるマシンで OAuth を完了してから、そのエージェントの
`auth-profiles.json` (例:
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
`$OPENCLAW_STATE_DIR/...` パス) を Gateway ホストへコピーします。`credentials/oauth.json`
はレガシーのインポート元にすぎません。
</Note>

## 出力と内部

`~/.openclaw/openclaw.json` の典型的なフィールド:

- `agents.defaults.workspace`
- `--skip-bootstrap` が渡された場合の `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers` (Minimax が選択された場合)
- `tools.profile` (未設定の場合、ローカルオンボーディングはデフォルトで `"coding"` になります。既存の明示的な値は保持されます)
- `gateway.*` (モード、バインド、認証、tailscale)
- `session.dmScope` (未設定の場合、ローカルオンボーディングはこれをデフォルトで `per-channel-peer` にします。既存の明示的な値は保持されます)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- プロンプト中にオプトインした場合のチャネル許可リスト (Discord, iMessage, Signal, Slack, Telegram, WhatsApp)。Discord と Slack は入力された名前も ID に解決します
- `skills.install.nodeManager`
  - `setup --node-manager` フラグは `npm`, `pnpm`, `bun` を受け付けます。
  - 手動構成では、後から `skills.install.nodeManager: "yarn"` を設定することもできます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` は `agents.list[]` と任意の `bindings` を書き込みます。

WhatsApp 認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` の下に入ります。
セッションは `~/.openclaw/agents/<agentId>/sessions/` の下に保存されます。

<Note>
一部のチャネルは plugins として提供されます。セットアップ中に選択した場合、ウィザードは
チャネル構成の前に plugin (npm またはローカルパス) のインストールを促します。
</Note>

## 非対話セットアップ

`--non-interactive` には `--accept-risk` が必要です (エージェントが
強力であり、システム全体へのアクセスにはリスクがあることを確認します):

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

完全なフラグリファレンスとプロバイダー固有の例: [`openclaw onboard`](/ja-JP/cli/onboard), [CLI 自動化](/ja-JP/start/wizard-cli-automation)。

## Gateway ウィザード RPC

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

クライアント (macOS アプリと Control UI) は、オンボーディングロジックを再実装せずに手順をレンダリングできます。

## Signal セットアップの動作

- 公式の `signal-cli` GitHub リリースから適切なリリースアセットをダウンロードします (ネイティブビルド、Linux x86-64 のみ)
- その他のプラットフォーム (macOS、非 x64 Linux) では、代わりに Homebrew 経由でインストールします
- リリースアセットのインストールを `~/.openclaw/tools/signal-cli/<version>/` の下に保存します
- 構成に `channels.signal.cliPath` を書き込みます
- ネイティブ Windows はまだサポートされていません。Linux のインストールパスを取得するには、WSL2 内でオンボーディングを実行してください

## 関連ドキュメント

- オンボーディングハブ: [オンボーディング (CLI)](/ja-JP/start/wizard)
- 自動化とスクリプト: [CLI 自動化](/ja-JP/start/wizard-cli-automation)
- コマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
