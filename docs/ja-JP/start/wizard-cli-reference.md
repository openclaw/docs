---
read_when:
    - openclaw onboard の詳細な動作が必要です
    - オンボーディング結果をデバッグしている、またはオンボーディングクライアントを統合している
sidebarTitle: CLI reference
summary: CLI セットアップフロー、認証/モデル設定、出力、内部構造の完全なリファレンス
title: CLI セットアップリファレンス
x-i18n:
    generated_at: "2026-07-04T06:22:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 016ea0c85cefd5cc70d0988e82f2cbb5898c0ae3134f68df645dddb58c2dfe9a
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

このページは `openclaw onboard` の完全なリファレンスです。
短いガイドは [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。

## ウィザードが行うこと

ローカルモード (デフォルト) では、次の内容を順に設定します。

- モデルと認証のセットアップ (OpenAI Code サブスクリプション OAuth、Anthropic Claude CLI または API キー、さらに MiniMax、GLM、Ollama、Moonshot、StepFun、AI Gateway オプション)
- ワークスペースの場所とブートストラップファイル
- Gateway 設定 (ポート、バインド、認証、Tailscale)
- チャンネルとプロバイダー (Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、iMessage、およびその他の同梱チャンネル Plugin)
- デーモンのインストール (LaunchAgent、systemd ユーザーユニット、または Startup フォルダーへのフォールバック付きのネイティブ Windows Scheduled Task)
- ヘルスチェック
- Skills のセットアップ

リモートモードでは、このマシンを別の場所にある Gateway へ接続するように設定します。
リモートホストには何もインストールせず、変更もしません。

## ローカルフローの詳細

<Steps>
  <Step title="Existing config detection">
    - `~/.openclaw/openclaw.json` が存在する場合は、Keep、Modify、Reset のいずれかを選択します。
    - ウィザードを再実行しても、Reset を明示的に選択しない限り (または `--reset` を渡さない限り)、何も消去されません。
    - CLI の `--reset` はデフォルトで `config+creds+sessions` です。ワークスペースも削除するには `--reset-scope full` を使用します。
    - 設定が無効、またはレガシーキーを含む場合、ウィザードは停止し、続行前に `openclaw doctor` を実行するよう求めます。
    - Reset は `trash` を使用し、次のスコープを提示します。
      - 設定のみ
      - 設定 + 認証情報 + セッション
      - 完全リセット (ワークスペースも削除)

  </Step>
  <Step title="Model and auth">
    - オプションの完全な一覧は [認証とモデルのオプション](#auth-and-model-options) にあります。

  </Step>
  <Step title="Workspace">
    - デフォルトは `~/.openclaw/workspace` です (設定可能)。
    - 初回実行時のブートストラップ儀式に必要なワークスペースファイルをシードします。
    - ワークスペースのレイアウト: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Step>
  <Step title="Gateway">
    - ポート、バインド、認証モード、Tailscale 公開についてプロンプトします。
    - 推奨: ループバックでもトークン認証を有効のままにして、ローカル WS クライアントに認証を必須にします。
    - トークンモードでは、対話型セットアップで次を選べます。
      - **平文トークンを生成/保存** (デフォルト)
      - **SecretRef を使用** (オプトイン)
    - パスワードモードでは、対話型セットアップで平文または SecretRef の保存もサポートします。
    - 非対話型のトークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセス環境に空でない環境変数が必要です。
      - `--gateway-token` と組み合わせることはできません。
    - すべてのローカルプロセスを完全に信頼できる場合にのみ、認証を無効化してください。
    - 非ループバックのバインドでは、引き続き認証が必要です。

  </Step>
  <Step title="Channels">
    - [WhatsApp](/ja-JP/channels/whatsapp): 任意の QR ログイン
    - [Telegram](/ja-JP/channels/telegram): bot トークン
    - [Discord](/ja-JP/channels/discord): bot トークン
    - [Google Chat](/ja-JP/channels/googlechat): サービスアカウント JSON + Webhook オーディエンス
    - [Mattermost](/ja-JP/channels/mattermost): bot トークン + ベース URL
    - [Signal](/ja-JP/channels/signal): 任意の `signal-cli` インストール + アカウント設定
    - [iMessage](/ja-JP/channels/imessage): `imsg` CLI パス + Messages DB アクセス。Gateway が Mac 以外で実行される場合は SSH ラッパーを使用してください
    - DM セキュリティ: デフォルトはペアリングです。最初の DM でコードを送信します。
      `openclaw pairing approve <channel> <code>` で承認するか、許可リストを使用します。
  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - ログイン済みのユーザーセッションが必要です。ヘッドレスでは、カスタム LaunchDaemon を使用してください (同梱されていません)。
    - Linux および WSL2 経由の Windows: systemd ユーザーユニット
      - ウィザードは `loginctl enable-linger <user>` を試行し、ログアウト後も Gateway が稼働し続けるようにします。
      - sudo を求める場合があります (`/var/lib/systemd/linger` に書き込みます)。まず sudo なしで試行します。
    - ネイティブ Windows: 最初に Scheduled Task
      - タスク作成が拒否された場合、OpenClaw はユーザーごとの Startup フォルダーのログイン項目へフォールバックし、Gateway を即座に起動します。
      - Scheduled Task は、より優れたスーパーバイザー状態を提供するため引き続き推奨されます。
    - ランタイム選択: Node (推奨。WhatsApp と Telegram に必要)。Bun は推奨されません。

  </Step>
  <Step title="Health check">
    - Gateway を起動し (必要な場合)、`openclaw health` を実行します。
    - `openclaw status --deep` は、サポートされている場合のチャンネルプローブを含め、ライブ Gateway ヘルスプローブをステータス出力へ追加します。

  </Step>
  <Step title="Skills">
    - 利用可能な Skills を読み取り、要件を確認します。
    - ノードマネージャーとして npm、pnpm、bun のいずれかを選べます。
    - 必要なインストーラーが利用可能な場合、信頼済みの同梱 Skills の任意依存関係をインストールします。
    - 利用できない Homebrew、uv、Go インストーラーをスキップし、影響を受ける Skills を手動セットアップガイダンス付きでグループ化します。不足している前提条件をインストールした後、`openclaw doctor` を実行してください。

  </Step>
  <Step title="Finish">
    - iOS、Android、macOS アプリのオプションを含む概要と次の手順。

  </Step>
</Steps>

<Note>
GUI が検出されない場合、ウィザードはブラウザーを開く代わりに、Control UI 用の SSH ポートフォワード手順を出力します。
Control UI アセットがない場合、ウィザードはそれらのビルドを試行します。フォールバックは `pnpm ui:build` です (UI 依存関係を自動インストールします)。
</Note>

## リモートモードの詳細

リモートモードでは、このマシンを別の場所にある Gateway へ接続するように設定します。

<Info>
リモートモードはリモートホストに何もインストールせず、変更もしません。
</Info>

設定する内容:

- リモート Gateway URL (`ws://...`)
- リモート Gateway 認証が必要な場合のトークン (推奨)

<Note>
- Gateway がループバック専用の場合は、SSH トンネリングまたは tailnet を使用してください。
- 検出ヒント:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## 認証とモデルのオプション

<AccordionGroup>
  <Accordion title="Anthropic API key">
    存在する場合は `ANTHROPIC_API_KEY` を使用し、そうでない場合はキーを求めてから、デーモンで使用できるよう保存します。
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    ブラウザーフローです。`code#state` を貼り付けます。

    モデルが未設定、またはすでに OpenAI ファミリーの場合、Codex ランタイム経由で `agents.defaults.model` を `openai/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    短命のデバイスコードを使用するブラウザーペアリングフローです。

    モデルが未設定、またはすでに OpenAI ファミリーの場合、Codex ランタイム経由で `agents.defaults.model` を `openai/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="OpenAI API key">
    存在する場合は `OPENAI_API_KEY` を使用し、そうでない場合はキーを求めてから、認証プロファイルに認証情報を保存します。

    モデルが未設定、`openai/*`、またはレガシー Codex モデル参照の場合、`agents.defaults.model` を `openai/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    対象の SuperGrok または X Premium アカウント向けのブラウザーサインインです。これはほとんどのユーザーに推奨される xAI パスです。OpenClaw は、Grok モデル、Grok `web_search`、`x_search`、`code_execution` 用に、結果の認証プロファイルを保存します。
  </Accordion>
  <Accordion title="xAI (Grok) device code">
    localhost コールバックの代わりに短いコードを使う、リモート向けのブラウザーサインインです。SSH、Docker、VPS ホストから使用してください。
  </Accordion>
  <Accordion title="xAI (Grok) API key">
    `XAI_API_KEY` を求め、xAI をモデルプロバイダーとして設定します。サブスクリプション OAuth ではなく xAI Console API キーを使いたい場合に使用します。
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`) を求め、Zen または Go カタログを選択できます。
    セットアップ URL: [opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API key (generic)">
    キーを保存します。
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` を求めます。
    詳細: [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    アカウント ID、Gateway ID、`CLOUDFLARE_AI_GATEWAY_API_KEY` を求めます。
    詳細: [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    設定は自動で書き込まれます。ホスト型のデフォルトは `MiniMax-M3` です。API キーセットアップでは `minimax/...` を使用し、OAuth セットアップでは `minimax-portal/...` を使用します。
    詳細: [MiniMax](/ja-JP/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    設定は、中国またはグローバルエンドポイント上の StepFun standard または Step Plan 向けに自動で書き込まれます。
    Standard には現在 `step-3.5-flash` が含まれ、Step Plan には `step-3.5-flash-2603` も含まれます。
    詳細: [StepFun](/ja-JP/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    `SYNTHETIC_API_KEY` を求めます。
    詳細: [Synthetic](/ja-JP/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    最初に `Cloud + Local`、`Cloud only`、`Local only` のいずれかを求めます。
    `Cloud only` は `https://ollama.com` で `OLLAMA_API_KEY` を使用します。
    ホストに基づくモードでは、ベース URL (デフォルト `http://127.0.0.1:11434`) を求め、利用可能なモデルを検出し、デフォルトを提案します。
    `Cloud + Local` は、その Ollama ホストがクラウドアクセスにサインイン済みかどうかも確認します。
    詳細: [Ollama](/ja-JP/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    Moonshot (Kimi K2) と Kimi Coding の設定は自動で書き込まれます。
    詳細: [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)。
  </Accordion>
  <Accordion title="Custom provider">
    OpenAI 互換および Anthropic 互換のエンドポイントで動作します。

    対話型オンボーディングでは、他のプロバイダー API キーフローと同じ API キー保存選択肢をサポートします。
    - **今すぐ API キーを貼り付け** (平文)
    - **シークレット参照を使用** (事前検証付きの env ref または設定済みプロバイダー ref)

    非対話型フラグ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (任意。`CUSTOM_API_KEY` にフォールバック)
    - `--custom-provider-id` (任意)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (任意。デフォルトは `openai`)
    - `--custom-image-input` / `--custom-text-input` (任意。推論されたモデル入力機能を上書き)

  </Accordion>
  <Accordion title="Skip">
    認証を未設定のままにします。
  </Accordion>
</AccordionGroup>

モデルの挙動:

- 検出されたオプションからデフォルトモデルを選ぶか、プロバイダーとモデルを手動で入力します。
- カスタムプロバイダーのオンボーディングでは、一般的なモデル ID について画像サポートを推論し、モデル名が不明な場合にのみ質問します。
- オンボーディングがプロバイダー認証の選択から開始された場合、モデルピッカーはそのプロバイダーを自動的に優先します。Volcengine と BytePlus では、同じ優先設定がそれぞれの coding-plan バリアント (`volcengine-plan/*`、`byteplus-plan/*`) にも一致します。
- その優先プロバイダーフィルターが空になる場合、ピッカーはモデルを表示しない代わりに完全なカタログへフォールバックします。
- ウィザードはモデルチェックを実行し、設定されたモデルが不明、または認証がない場合に警告します。

認証情報とプロファイルのパス:

- 認証プロファイル (API キー + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー OAuth インポート: `~/.openclaw/credentials/oauth.json`

認証情報の保存モード:

- デフォルトのオンボーディング動作では、API キーは auth プロファイル内のプレーンテキスト値として保持されます。
- `--secret-input-mode ref` は、プレーンテキストのキー保存ではなく参照モードを有効にします。
  対話型セットアップでは、次のいずれかを選択できます。
  - 環境変数参照（例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - provider エイリアス + id を使用する構成済み provider 参照（`file` または `exec`）
- 対話型参照モードでは、保存前に高速な事前検証が実行されます。
  - Env refs: 現在のオンボーディング環境で、変数名 + 空でない値を検証します。
  - Provider refs: provider 構成を検証し、要求された id を解決します。
  - 事前検証に失敗した場合、オンボーディングはエラーを表示し、再試行できるようにします。
- 非対話型モードでは、`--secret-input-mode ref` は env バックのみです。
  - オンボーディングプロセス環境で provider 環境変数を設定します。
  - インラインキー フラグ（例: `--openai-api-key`）では、その環境変数が設定されている必要があります。設定されていない場合、オンボーディングは即座に失敗します。
  - カスタム provider の場合、非対話型 `ref` モードは `models.providers.<id>.apiKey` を `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存します。
  - そのカスタム provider の場合、`--custom-api-key` では `CUSTOM_API_KEY` が設定されている必要があります。設定されていない場合、オンボーディングは即座に失敗します。
- Gateway 認証資格情報は、対話型セットアップでプレーンテキストと SecretRef の選択肢をサポートします。
  - トークンモード: **プレーンテキスト トークンを生成/保存**（デフォルト）または **SecretRef を使用**。
  - パスワードモード: プレーンテキストまたは SecretRef。
- 非対話型トークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
- 既存のプレーンテキスト セットアップは変更なしで引き続き動作します。

<Note>
ヘッドレスおよびサーバーのヒント: ブラウザがあるマシンで OAuth を完了し、その後
そのエージェントの `auth-profiles.json`（例:
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
`$OPENCLAW_STATE_DIR/...` パス）を Gateway ホストにコピーします。`credentials/oauth.json`
はレガシー インポート ソースにすぎません。
</Note>

## 出力と内部

`~/.openclaw/openclaw.json` の一般的なフィールド:

- `agents.defaults.workspace`
- `--skip-bootstrap` が渡された場合の `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（Minimax が選択された場合）
- `tools.profile`（未設定の場合、ローカル オンボーディングはデフォルトで `"coding"` になります。既存の明示的な値は保持されます）
- `gateway.*`（mode、bind、auth、tailscale）
- `session.dmScope`（未設定の場合、ローカル オンボーディングはこれをデフォルトで `per-channel-peer` にします。既存の明示的な値は保持されます）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- プロンプト中にオプトインした場合のチャネル許可リスト（Slack、Discord、Matrix、Microsoft Teams）（可能な場合、名前は ID に解決されます）
- `skills.install.nodeManager`
  - `setup --node-manager` フラグは `npm`、`pnpm`、または `bun` を受け付けます。
  - 手動構成では、後から `skills.install.nodeManager: "yarn"` を引き続き設定できます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` は `agents.list[]` と任意の `bindings` を書き込みます。

WhatsApp 資格情報は `~/.openclaw/credentials/whatsapp/<accountId>/` の下に置かれます。
セッションは `~/.openclaw/agents/<agentId>/sessions/` の下に保存されます。

<Note>
一部のチャネルは plugins として提供されます。セットアップ中に選択すると、ウィザードは
チャネル構成の前に plugin（npm またはローカルパス）のインストールを促します。
</Note>

Gateway ウィザード RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

クライアント（macOS アプリと Control UI）は、オンボーディング ロジックを再実装せずに手順をレンダリングできます。

Signal セットアップ動作:

- 適切なリリース アセットをダウンロードします
- `~/.openclaw/tools/signal-cli/<version>/` の下に保存します
- 構成に `channels.signal.cliPath` を書き込みます
- JVM ビルドには Java 21 が必要です
- 利用可能な場合はネイティブ ビルドが使用されます
- Windows は WSL2 を使用し、WSL 内で Linux signal-cli フローに従います

## 関連ドキュメント

- オンボーディング ハブ: [オンボーディング（CLI）](/ja-JP/start/wizard)
- 自動化とスクリプト: [CLI 自動化](/ja-JP/start/wizard-cli-automation)
- コマンド リファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
