---
read_when:
    - openclaw onboard の詳細な挙動が必要です
    - オンボーディング結果をデバッグしている、またはオンボーディングクライアントを統合している
sidebarTitle: CLI reference
summary: CLI セットアップフロー、認証/モデル設定、出力、内部構造の完全なリファレンス
title: CLI セットアップリファレンス
x-i18n:
    generated_at: "2026-06-27T13:06:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6e46c81dd51ee9f1ce492dedc2911d449f507a136bd8805bc157915684a1941
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

このページは `openclaw onboard` の完全なリファレンスです。
短いガイドは [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。

## ウィザードが行うこと

ローカルモード (デフォルト) では、次の手順を案内します。

- モデルと認証のセットアップ (OpenAI Code サブスクリプション OAuth、Anthropic Claude CLI または API キー、さらに MiniMax、GLM、Ollama、Moonshot、StepFun、AI Gateway オプション)
- ワークスペースの場所とブートストラップファイル
- Gateway 設定 (ポート、バインド、認証、Tailscale)
- チャネルとプロバイダー (Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、iMessage、その他のバンドル済みチャネルプラグイン)
- デーモンのインストール (LaunchAgent、systemd ユーザーユニット、または Startup フォルダーのフォールバック付きネイティブ Windows Scheduled Task)
- ヘルスチェック
- Skills セットアップ

リモートモードでは、このマシンが別の場所にある Gateway に接続するように設定します。
リモートホスト上では何もインストールまたは変更しません。

## ローカルフローの詳細

<Steps>
  <Step title="既存設定の検出">
    - `~/.openclaw/openclaw.json` が存在する場合は、保持、変更、リセットのいずれかを選択します。
    - 明示的にリセットを選択しない限り (または `--reset` を渡さない限り)、ウィザードを再実行しても何も消去されません。
    - CLI の `--reset` はデフォルトで `config+creds+sessions` です。ワークスペースも削除するには `--reset-scope full` を使用します。
    - 設定が無効、またはレガシーキーを含む場合、ウィザードは停止し、続行する前に `openclaw doctor` を実行するよう求めます。
    - リセットは `trash` を使用し、次のスコープを提示します。
      - 設定のみ
      - 設定 + 認証情報 + セッション
      - 完全リセット (ワークスペースも削除)

  </Step>
  <Step title="モデルと認証">
    - 完全なオプション一覧は [認証とモデルのオプション](#auth-and-model-options) にあります。

  </Step>
  <Step title="ワークスペース">
    - デフォルトは `~/.openclaw/workspace` (設定可能)。
    - 初回実行のブートストラップ儀式に必要なワークスペースファイルを配置します。
    - ワークスペースのレイアウト: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Step>
  <Step title="Gateway">
    - ポート、バインド、認証モード、Tailscale 公開について尋ねます。
    - 推奨: local loopback でもトークン認証を有効にしたままにして、ローカル WS クライアントにも認証を必須にします。
    - トークンモードでは、対話型セットアップで次を提示します。
      - **プレーンテキストトークンを生成/保存** (デフォルト)
      - **SecretRef を使用** (オプトイン)
    - パスワードモードでは、対話型セットアップでプレーンテキストまたは SecretRef ストレージもサポートします。
    - 非対話型トークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセスの環境に空でない環境変数が必要です。
      - `--gateway-token` と組み合わせることはできません。
    - すべてのローカルプロセスを完全に信頼できる場合にのみ、認証を無効にしてください。
    - 非ループバックバインドでは、引き続き認証が必要です。

  </Step>
  <Step title="チャネル">
    - [WhatsApp](/ja-JP/channels/whatsapp): 任意の QR ログイン
    - [Telegram](/ja-JP/channels/telegram): ボットトークン
    - [Discord](/ja-JP/channels/discord): ボットトークン
    - [Google Chat](/ja-JP/channels/googlechat): サービスアカウント JSON + Webhook オーディエンス
    - [Mattermost](/ja-JP/channels/mattermost): ボットトークン + ベース URL
    - [Signal](/ja-JP/channels/signal): 任意の `signal-cli` インストール + アカウント設定
    - [iMessage](/ja-JP/channels/imessage): `imsg` CLI パス + Messages DB アクセス。Gateway が Mac 外で動作する場合は SSH ラッパーを使用します
    - DM セキュリティ: デフォルトはペアリングです。最初の DM でコードを送信します。次のコマンドで承認します。
      `openclaw pairing approve <channel> <code>` または許可リストを使用します。
  </Step>
  <Step title="デーモンのインストール">
    - macOS: LaunchAgent
      - ログイン済みユーザーセッションが必要です。ヘッドレスの場合は、カスタム LaunchDaemon (未同梱) を使用します。
    - Linux および WSL2 経由の Windows: systemd ユーザーユニット
      - ウィザードは `loginctl enable-linger <user>` を試行し、ログアウト後も Gateway が稼働し続けるようにします。
      - sudo を求める場合があります (`/var/lib/systemd/linger` に書き込み)。最初は sudo なしで試行します。
    - ネイティブ Windows: まず Scheduled Task
      - タスク作成が拒否された場合、OpenClaw はユーザーごとの Startup フォルダーのログイン項目にフォールバックし、Gateway を即座に起動します。
      - Scheduled Task は、より優れたスーパーバイザーステータスを提供するため引き続き推奨されます。
    - ランタイム選択: Node (推奨。WhatsApp と Telegram には必須)。Bun は推奨されません。

  </Step>
  <Step title="ヘルスチェック">
    - Gateway を起動し (必要な場合)、`openclaw health` を実行します。
    - `openclaw status --deep` は、サポートされている場合のチャネルプローブを含め、ライブ Gateway ヘルスプローブをステータス出力に追加します。

  </Step>
  <Step title="Skills">
    - 利用可能な Skills を読み取り、要件を確認します。
    - Node マネージャーを選択できます: npm、pnpm、または bun。
    - 任意の依存関係をインストールします (一部は macOS で Homebrew を使用します)。

  </Step>
  <Step title="完了">
    - iOS、Android、macOS アプリのオプションを含む、概要と次の手順。

  </Step>
</Steps>

<Note>
GUI が検出されない場合、ウィザードはブラウザーを開く代わりに Control UI 用の SSH ポートフォワード手順を出力します。
Control UI アセットがない場合、ウィザードはそれらのビルドを試行します。フォールバックは `pnpm ui:build` です (UI 依存関係を自動インストールします)。
</Note>

## リモートモードの詳細

リモートモードでは、このマシンが別の場所にある Gateway に接続するように設定します。

<Info>
リモートモードは、リモートホスト上で何もインストールまたは変更しません。
</Info>

設定する内容:

- リモート Gateway URL (`ws://...`)
- リモート Gateway 認証が必要な場合のトークン (推奨)

<Note>
- Gateway がループバック専用の場合は、SSH トンネリングまたは tailnet を使用します。
- 検出ヒント:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## 認証とモデルのオプション

<AccordionGroup>
  <Accordion title="Anthropic API キー">
    存在する場合は `ANTHROPIC_API_KEY` を使用し、存在しない場合はキーの入力を求めてから、デーモンで使用できるよう保存します。
  </Accordion>
  <Accordion title="OpenAI Code サブスクリプション (OAuth)">
    ブラウザーフローです。`code#state` を貼り付けます。

    モデルが未設定、またはすでに OpenAI 系の場合、Codex ランタイムを通じて `agents.defaults.model` を `openai/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="OpenAI Code サブスクリプション (デバイスペアリング)">
    短時間だけ有効なデバイスコードを使用するブラウザーペアリングフローです。

    モデルが未設定、またはすでに OpenAI 系の場合、Codex ランタイムを通じて `agents.defaults.model` を `openai/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="OpenAI API キー">
    存在する場合は `OPENAI_API_KEY` を使用し、存在しない場合はキーの入力を求めてから、認証プロファイルに認証情報を保存します。

    モデルが未設定、`openai/*`、またはレガシー Codex モデル参照の場合、`agents.defaults.model` を `openai/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    対象の SuperGrok または X Premium アカウント向けのブラウザーサインインです。これは、ほとんどのユーザーに推奨される xAI パスです。OpenClaw は、Grok モデル、Grok `web_search`、`x_search`、`code_execution` 用に、得られた認証プロファイルを保存します。
  </Accordion>
  <Accordion title="xAI (Grok) デバイスコード">
    localhost コールバックの代わりに短いコードを使用する、リモートに適したブラウザーサインインです。SSH、Docker、または VPS ホストから使用します。
  </Accordion>
  <Accordion title="xAI (Grok) API キー">
    `XAI_API_KEY` の入力を求め、xAI をモデルプロバイダーとして設定します。サブスクリプション OAuth ではなく xAI Console API キーを使いたい場合に使用します。
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`) の入力を求め、Zen または Go カタログを選択できます。
    セットアップ URL: [opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API キー (汎用)">
    キーを保存します。
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` の入力を求めます。
    詳細: [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    アカウント ID、Gateway ID、`CLOUDFLARE_AI_GATEWAY_API_KEY` の入力を求めます。
    詳細: [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    設定は自動で書き込まれます。ホスト型のデフォルトは `MiniMax-M3` です。API キーセットアップでは
    `minimax/...` を使用し、OAuth セットアップでは `minimax-portal/...` を使用します。
    詳細: [MiniMax](/ja-JP/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    中国またはグローバルエンドポイント上の StepFun standard または Step Plan 向けに、設定が自動で書き込まれます。
    Standard には現在 `step-3.5-flash` が含まれ、Step Plan には `step-3.5-flash-2603` も含まれます。
    詳細: [StepFun](/ja-JP/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic (Anthropic 互換)">
    `SYNTHETIC_API_KEY` の入力を求めます。
    詳細: [Synthetic](/ja-JP/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama (クラウドおよびローカルオープンモデル)">
    最初に `Cloud + Local`、`Cloud only`、または `Local only` の入力を求めます。
    `Cloud only` は `https://ollama.com` で `OLLAMA_API_KEY` を使用します。
    ホストに基づくモードでは、ベース URL (デフォルト `http://127.0.0.1:11434`) の入力を求め、利用可能なモデルを検出し、デフォルトを提案します。
    `Cloud + Local` は、その Ollama ホストがクラウドアクセスにサインインしているかも確認します。
    詳細: [Ollama](/ja-JP/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot と Kimi Coding">
    Moonshot (Kimi K2) と Kimi Coding の設定は自動で書き込まれます。
    詳細: [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)。
  </Accordion>
  <Accordion title="カスタムプロバイダー">
    OpenAI 互換および Anthropic 互換エンドポイントで動作します。

    対話型オンボーディングは、他のプロバイダー API キーフローと同じ API キーストレージ選択肢をサポートします。
    - **今すぐ API キーを貼り付け** (プレーンテキスト)
    - **シークレット参照を使用** (env ref または設定済みプロバイダー ref。事前検証付き)

    非対話型フラグ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (任意。`CUSTOM_API_KEY` にフォールバック)
    - `--custom-provider-id` (任意)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (任意。デフォルトは `openai`)
    - `--custom-image-input` / `--custom-text-input` (任意。推論されたモデル入力機能を上書き)

  </Accordion>
  <Accordion title="スキップ">
    認証を未設定のままにします。
  </Accordion>
</AccordionGroup>

モデルの動作:

- 検出されたオプションからデフォルトモデルを選択するか、プロバイダーとモデルを手動で入力します。
- カスタムプロバイダーのオンボーディングは、一般的なモデル ID の画像サポートを推論し、モデル名が不明な場合にのみ確認します。
- オンボーディングがプロバイダー認証の選択から始まった場合、モデルピッカーは
  そのプロバイダーを自動的に優先します。Volcengine と BytePlus では、同じ優先設定が
  それらの coding-plan バリアント (`volcengine-plan/*`、
  `byteplus-plan/*`) にも一致します。
- その優先プロバイダーフィルターが空になる場合、ピッカーは
  モデルなしを表示する代わりに完全なカタログへフォールバックします。
- ウィザードはモデルチェックを実行し、設定済みモデルが不明、または認証が欠けている場合に警告します。

認証情報とプロファイルのパス:

- 認証プロファイル (API キー + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー OAuth インポート: `~/.openclaw/credentials/oauth.json`

認証情報ストレージモード:

- デフォルトのオンボーディング動作では、API キーが認証プロファイルにプレーンテキスト値として永続化されます。
- `--secret-input-mode ref` は、プレーンテキストのキー保存ではなく参照モードを有効にします。
  インタラクティブ設定では、次のいずれかを選択できます。
  - 環境変数 ref (例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - provider エイリアス + id を使う、設定済み provider ref (`file` または `exec`)
- インタラクティブ参照モードでは、保存前に高速なプリフライト検証が実行されます。
  - Env refs: 現在のオンボーディング環境で、変数名 + 空でない値を検証します。
  - Provider refs: provider 設定を検証し、要求された id を解決します。
  - プリフライトに失敗した場合、オンボーディングはエラーを表示し、再試行できるようにします。
- 非インタラクティブモードでは、`--secret-input-mode ref` は env バックのみです。
  - オンボーディングプロセス環境で provider env var を設定します。
  - インラインキーのフラグ (例: `--openai-api-key`) では、その env var が設定されている必要があります。設定されていない場合、オンボーディングは即座に失敗します。
  - カスタム provider の場合、非インタラクティブ `ref` モードは `models.providers.<id>.apiKey` を `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存します。
  - そのカスタム provider の場合、`--custom-api-key` では `CUSTOM_API_KEY` が設定されている必要があります。設定されていない場合、オンボーディングは即座に失敗します。
- Gateway 認証情報は、インタラクティブ設定でプレーンテキストと SecretRef の選択肢をサポートします。
  - トークンモード: **プレーンテキストトークンを生成/保存** (デフォルト) または **SecretRef を使用**。
  - パスワードモード: プレーンテキストまたは SecretRef。
- 非インタラクティブなトークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
- 既存のプレーンテキスト設定は変更なしで引き続き動作します。

<Note>
ヘッドレスとサーバー向けのヒント: ブラウザーがあるマシンで OAuth を完了し、その後
そのエージェントの `auth-profiles.json` (例:
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
`$OPENCLAW_STATE_DIR/...` パス) を Gateway ホストにコピーします。`credentials/oauth.json`
はレガシーのインポート元にすぎません。
</Note>

## 出力と内部

`~/.openclaw/openclaw.json` の典型的なフィールド:

- `agents.defaults.workspace`
- `--skip-bootstrap` が渡された場合の `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers` (Minimax が選択された場合)
- `tools.profile` (local オンボーディングは未設定時にデフォルトで `"coding"` になります。既存の明示的な値は保持されます)
- `gateway.*` (mode、bind、auth、tailscale)
- `session.dmScope` (local オンボーディングは未設定時にデフォルトで `per-channel-peer` にします。既存の明示的な値は保持されます)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- プロンプト中にオプトインした場合の Channel allowlists (Slack、Discord、Matrix、Microsoft Teams) (可能な場合、名前は ID に解決されます)
- `skills.install.nodeManager`
  - `setup --node-manager` フラグは `npm`、`pnpm`、または `bun` を受け付けます。
  - 手動設定では、後から `skills.install.nodeManager: "yarn"` を設定することもできます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` は `agents.list[]` と任意の `bindings` を書き込みます。

WhatsApp 認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` 配下に配置されます。
セッションは `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。

<Note>
一部のチャンネルは plugins として提供されます。設定中に選択すると、ウィザードは
チャンネル設定の前に plugin (npm または local パス) のインストールを求めます。
</Note>

Gateway ウィザード RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

クライアント (macOS アプリと Control UI) は、オンボーディングロジックを再実装せずにステップをレンダリングできます。

Signal 設定の動作:

- 適切なリリースアセットをダウンロードします
- `~/.openclaw/tools/signal-cli/<version>/` 配下に保存します
- config に `channels.signal.cliPath` を書き込みます
- JVM ビルドには Java 21 が必要です
- 利用可能な場合はネイティブビルドが使用されます
- Windows は WSL2 を使用し、WSL 内で Linux の signal-cli フローに従います

## 関連ドキュメント

- オンボーディングハブ: [オンボーディング (CLI)](/ja-JP/start/wizard)
- 自動化とスクリプト: [CLI 自動化](/ja-JP/start/wizard-cli-automation)
- コマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
