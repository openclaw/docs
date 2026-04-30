---
read_when:
    - openclaw onboard の詳細な動作が必要です
    - オンボーディング結果をデバッグする場合、またはオンボーディングクライアントを統合する場合
sidebarTitle: CLI reference
summary: CLI セットアップフロー、認証/モデル設定、出力、内部構造の完全リファレンス
title: CLI セットアップリファレンス
x-i18n:
    generated_at: "2026-04-30T05:35:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d40a63ff27d6aaf4cda167ad0cdf3ad7c4f61ecf92d1cf51b5a0237b24917a7
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

このページは `openclaw onboard` の完全なリファレンスです。
短いガイドは [オンボーディング（CLI）](/ja-JP/start/wizard) を参照してください。

## ウィザードが行うこと

ローカルモード（デフォルト）では、次を順に案内します。

- モデルと認証のセットアップ（OpenAI Code サブスクリプション OAuth、Anthropic Claude CLI または API キー、さらに MiniMax、GLM、Ollama、Moonshot、StepFun、AI Gateway のオプション）
- ワークスペースの場所とブートストラップファイル
- Gateway 設定（ポート、バインド、認証、tailscale）
- チャンネルとプロバイダー（Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、BlueBubbles、その他の同梱チャンネル Plugin）
- デーモンのインストール（LaunchAgent、systemd ユーザーユニット、またはネイティブ Windows Scheduled Task と Startup フォルダーのフォールバック）
- ヘルスチェック
- Skills のセットアップ

リモートモードでは、このマシンが別の場所にある Gateway へ接続するよう設定します。
リモートホストに何かをインストールしたり変更したりすることはありません。

## ローカルフローの詳細

<Steps>
  <Step title="既存設定の検出">
    - `~/.openclaw/openclaw.json` が存在する場合は、Keep、Modify、Reset から選択します。
    - 明示的に Reset を選択しない限り（または `--reset` を渡さない限り）、ウィザードを再実行しても何も消去されません。
    - CLI の `--reset` はデフォルトで `config+creds+sessions` です。ワークスペースも削除するには `--reset-scope full` を使用します。
    - 設定が無効、またはレガシーキーを含む場合、ウィザードは停止し、続行する前に `openclaw doctor` を実行するよう求めます。
    - Reset は `trash` を使用し、次のスコープを提示します。
      - 設定のみ
      - 設定 + 資格情報 + セッション
      - 完全リセット（ワークスペースも削除）

  </Step>
  <Step title="モデルと認証">
    - 完全なオプション表は [認証とモデルのオプション](#auth-and-model-options) にあります。

  </Step>
  <Step title="ワークスペース">
    - デフォルトは `~/.openclaw/workspace`（設定可能）です。
    - 初回実行のブートストラップ手順に必要なワークスペースファイルを配置します。
    - ワークスペースのレイアウト: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)。

  </Step>
  <Step title="Gateway">
    - ポート、バインド、認証モード、tailscale 公開について確認します。
    - 推奨: local loopback でもトークン認証を有効にしたままにし、ローカル WS クライアントにも認証を要求します。
    - トークンモードでは、対話型セットアップで次を提示します。
      - **平文トークンを生成/保存**（デフォルト）
      - **SecretRef を使用**（オプトイン）
    - パスワードモードでは、対話型セットアップで平文または SecretRef の保存もサポートします。
    - 非対話型のトークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセス環境内に空でない環境変数が必要です。
      - `--gateway-token` と組み合わせることはできません。
    - すべてのローカルプロセスを完全に信頼している場合のみ、認証を無効にしてください。
    - local loopback 以外のバインドでは引き続き認証が必要です。

  </Step>
  <Step title="チャンネル">
    - [WhatsApp](/ja-JP/channels/whatsapp): 任意の QR ログイン
    - [Telegram](/ja-JP/channels/telegram): ボットトークン
    - [Discord](/ja-JP/channels/discord): ボットトークン
    - [Google Chat](/ja-JP/channels/googlechat): サービスアカウント JSON + Webhook オーディエンス
    - [Mattermost](/ja-JP/channels/mattermost): ボットトークン + ベース URL
    - [Signal](/ja-JP/channels/signal): 任意の `signal-cli` インストール + アカウント設定
    - [BlueBubbles](/ja-JP/channels/bluebubbles): iMessage に推奨。サーバー URL + パスワード + Webhook
    - [iMessage](/ja-JP/channels/imessage): レガシー `imsg` CLI パス + DB アクセス
    - DM セキュリティ: デフォルトはペアリングです。最初の DM でコードを送信します。
      `openclaw pairing approve <channel> <code>` で承認するか、許可リストを使用します。
  </Step>
  <Step title="デーモンのインストール">
    - macOS: LaunchAgent
      - ログイン済みユーザーセッションが必要です。ヘッドレス環境では、カスタム LaunchDaemon（同梱されていません）を使用してください。
    - Linux および WSL2 経由の Windows: systemd ユーザーユニット
      - Gateway がログアウト後も稼働し続けるよう、ウィザードは `loginctl enable-linger <user>` を試行します。
      - sudo を求められる場合があります（`/var/lib/systemd/linger` に書き込みます）。まず sudo なしで試行します。
    - ネイティブ Windows: まず Scheduled Task
      - タスク作成が拒否された場合、OpenClaw はユーザーごとの Startup フォルダーのログイン項目にフォールバックし、Gateway を即時起動します。
      - Scheduled Tasks は、より優れたスーパーバイザーステータスを提供するため、引き続き推奨されます。
    - ランタイム選択: Node（推奨。WhatsApp と Telegram に必要）。Bun は推奨されません。

  </Step>
  <Step title="ヘルスチェック">
    - 必要に応じて Gateway を起動し、`openclaw health` を実行します。
    - `openclaw status --deep` は、サポートされている場合はチャンネルプローブも含め、ライブ Gateway ヘルスプローブをステータス出力に追加します。

  </Step>
  <Step title="Skills">
    - 利用可能な Skills を読み取り、要件を確認します。
    - Node マネージャーとして npm、pnpm、bun のいずれかを選択できます。
    - 任意の依存関係をインストールします（一部は macOS で Homebrew を使用します）。

  </Step>
  <Step title="完了">
    - iOS、Android、macOS アプリのオプションを含む概要と次の手順。

  </Step>
</Steps>

<Note>
GUI が検出されない場合、ウィザードはブラウザーを開く代わりに Control UI 用の SSH ポートフォワード手順を出力します。
Control UI アセットが見つからない場合、ウィザードはそれらのビルドを試行します。フォールバックは `pnpm ui:build`（UI 依存関係を自動インストール）です。
</Note>

## リモートモードの詳細

リモートモードでは、このマシンが別の場所にある Gateway へ接続するよう設定します。

<Info>
リモートモードでは、リモートホストに何かをインストールしたり変更したりすることはありません。
</Info>

設定する項目:

- リモート Gateway URL（`ws://...`）
- リモート Gateway 認証が必要な場合のトークン（推奨）

<Note>
- Gateway が local loopback のみの場合は、SSH トンネリングまたは tailnet を使用してください。
- 検出のヒント:
  - macOS: Bonjour（`dns-sd`）
  - Linux: Avahi（`avahi-browse`）

</Note>

## 認証とモデルのオプション

<AccordionGroup>
  <Accordion title="Anthropic API キー">
    存在する場合は `ANTHROPIC_API_KEY` を使用し、存在しない場合はキーの入力を求めてから、デーモンで使用できるよう保存します。
  </Accordion>
  <Accordion title="OpenAI Code サブスクリプション（OAuth）">
    ブラウザーフローです。`code#state` を貼り付けます。

    モデルが未設定、またはすでに OpenAI ファミリーの場合、`agents.defaults.model` を `openai-codex/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="OpenAI Code サブスクリプション（デバイスペアリング）">
    短時間有効なデバイスコードを使用するブラウザーペアリングフローです。

    モデルが未設定、またはすでに OpenAI ファミリーの場合、`agents.defaults.model` を `openai-codex/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="OpenAI API キー">
    存在する場合は `OPENAI_API_KEY` を使用し、存在しない場合はキーの入力を求めてから、資格情報を認証プロファイルに保存します。

    モデルが未設定、`openai/*`、または `openai-codex/*` の場合、`agents.defaults.model` を `openai/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="xAI（Grok）API キー">
    `XAI_API_KEY` の入力を求め、xAI をモデルプロバイダーとして設定します。
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）の入力を求め、Zen または Go カタログを選択できます。
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
    アカウント ID、Gateway ID、`CLOUDFLARE_AI_GATEWAY_API_KEY` の入力を求めます。
    詳細: [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    設定は自動で書き込まれます。ホスト版のデフォルトは `MiniMax-M2.7` です。API キーセットアップでは
    `minimax/...` を使用し、OAuth セットアップでは `minimax-portal/...` を使用します。
    詳細: [MiniMax](/ja-JP/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    設定は、中国またはグローバルエンドポイント上の StepFun 標準または Step Plan 向けに自動で書き込まれます。
    標準には現在 `step-3.5-flash` が含まれ、Step Plan には `step-3.5-flash-2603` も含まれます。
    詳細: [StepFun](/ja-JP/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（Anthropic 互換）">
    `SYNTHETIC_API_KEY` の入力を求めます。
    詳細: [Synthetic](/ja-JP/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（クラウドとローカルオープンモデル）">
    まず `Cloud + Local`、`Cloud only`、`Local only` の入力を求めます。
    `Cloud only` は `OLLAMA_API_KEY` と `https://ollama.com` を使用します。
    ホストベースのモードでは、ベース URL（デフォルト `http://127.0.0.1:11434`）の入力を求め、利用可能なモデルを検出し、デフォルトを提案します。
    `Cloud + Local` では、その Ollama ホストがクラウドアクセスにサインインしているかどうかも確認します。
    詳細: [Ollama](/ja-JP/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot と Kimi Coding">
    Moonshot（Kimi K2）と Kimi Coding の設定は自動で書き込まれます。
    詳細: [Moonshot AI（Kimi + Kimi Coding）](/ja-JP/providers/moonshot)。
  </Accordion>
  <Accordion title="カスタムプロバイダー">
    OpenAI 互換および Anthropic 互換のエンドポイントで動作します。

    対話型オンボーディングでは、他のプロバイダー API キーフローと同じ API キー保存の選択肢をサポートします。
    - **今すぐ API キーを貼り付ける**（平文）
    - **シークレット参照を使用**（env ref または設定済みプロバイダー ref。事前検証あり）

    非対話型フラグ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（任意。`CUSTOM_API_KEY` にフォールバック）
    - `--custom-provider-id`（任意）
    - `--custom-compatibility <openai|anthropic>`（任意。デフォルトは `openai`）
    - `--custom-image-input` / `--custom-text-input`（任意。推論されたモデル入力機能を上書き）

  </Accordion>
  <Accordion title="スキップ">
    認証を未設定のままにします。
  </Accordion>
</AccordionGroup>

モデルの動作:

- 検出されたオプションからデフォルトモデルを選択するか、プロバイダーとモデルを手動入力します。
- カスタムプロバイダーのオンボーディングでは、一般的なモデル ID について画像サポートを推論し、モデル名が不明な場合のみ確認します。
- オンボーディングがプロバイダー認証の選択から開始された場合、モデルピッカーは
  そのプロバイダーを自動的に優先します。Volcengine と BytePlus では、同じ優先設定が
  それぞれのコーディングプランバリアント（`volcengine-plan/*`、
  `byteplus-plan/*`）にも一致します。
- その優先プロバイダーフィルターが空になる場合、モデルを表示しない代わりに、ピッカーは
  完全なカタログへフォールバックします。
- ウィザードはモデルチェックを実行し、設定されたモデルが不明、または認証が不足している場合に警告します。

資格情報とプロファイルのパス:

- 認証プロファイル（API キー + OAuth）: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー OAuth インポート: `~/.openclaw/credentials/oauth.json`

資格情報の保存モード:

- デフォルトのオンボーディング動作では、API キーを認証プロファイル内に平文値として保持します。
- `--secret-input-mode ref` は、平文キー保存の代わりに参照モードを有効にします。
  対話型セットアップでは、次のいずれかを選択できます。
  - 環境変数 ref（例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 設定済みプロバイダー ref（`file` または `exec`）。プロバイダーエイリアス + ID を使用
- 対話型参照モードでは、保存前に高速な事前検証を実行します。
  - Env refs: 変数名 + 現在のオンボーディング環境内の空でない値を検証します。
  - Provider refs: プロバイダー設定を検証し、要求された ID を解決します。
  - 事前検証に失敗した場合、オンボーディングはエラーを表示し、再試行できるようにします。
- 非対話型モードでは、`--secret-input-mode ref` は env ベースのみです。
  - オンボーディングプロセス環境内にプロバイダー環境変数を設定します。
  - インラインキーフラグ（例: `--openai-api-key`）では、その環境変数が設定されている必要があります。設定されていない場合、オンボーディングは即座に失敗します。
  - カスタムプロバイダーの場合、非対話型の `ref` モードは `models.providers.<id>.apiKey` を `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存します。
  - そのカスタムプロバイダーの場合、`--custom-api-key` には `CUSTOM_API_KEY` が設定されている必要があります。設定されていない場合、オンボーディングは即座に失敗します。
- Gateway 認証資格情報は、対話型セットアップで平文と SecretRef の選択肢をサポートします。
  - トークンモード: **平文トークンを生成/保存**（デフォルト）または **SecretRef を使用**。
  - パスワードモード: 平文または SecretRef。
- 非対話型のトークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
- 既存の平文セットアップは変更なしで引き続き動作します。

<Note>
ヘッドレス環境およびサーバー向けのヒント: ブラウザーがあるマシンで OAuth を完了してから、そのエージェントの `auth-profiles.json`（例: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する `$OPENCLAW_STATE_DIR/...` パス）を Gateway ホストにコピーしてください。`credentials/oauth.json` は従来のインポート元にすぎません。
</Note>

## 出力と内部構造

`~/.openclaw/openclaw.json` の代表的なフィールド:

- `agents.defaults.workspace`
- `--skip-bootstrap` が渡された場合の `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（Minimax が選択された場合）
- `tools.profile`（未設定の場合、ローカルのオンボーディングは既定で `"coding"` になります。既存の明示的な値は保持されます）
- `gateway.*`（mode, bind, auth, tailscale）
- `session.dmScope`（未設定の場合、ローカルのオンボーディングは既定で `per-channel-peer` にします。既存の明示的な値は保持されます）
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- プロンプト中にオプトインした場合のチャンネル許可リスト（Slack, Discord, Matrix, Microsoft Teams）（可能な場合、名前は ID に解決されます）
- `skills.install.nodeManager`
  - `setup --node-manager` フラグは `npm`、`pnpm`、または `bun` を受け付けます。
  - 手動設定では、後から `skills.install.nodeManager: "yarn"` を設定することもできます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` は `agents.list[]` と任意の `bindings` を書き込みます。

WhatsApp 認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` 配下に置かれます。
セッションは `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。

<Note>
一部のチャンネルは plugins として提供されます。セットアップ中に選択すると、ウィザードはチャンネル設定の前に plugin（npm またはローカルパス）のインストールを促します。
</Note>

Gateway ウィザード RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

クライアント（macOS アプリと Control UI）は、オンボーディングロジックを再実装せずに手順をレンダリングできます。

Signal セットアップの動作:

- 適切なリリースアセットをダウンロードします
- `~/.openclaw/tools/signal-cli/<version>/` 配下に保存します
- 設定に `channels.signal.cliPath` を書き込みます
- JVM ビルドには Java 21 が必要です
- 利用可能な場合はネイティブビルドが使用されます
- Windows は WSL2 を使用し、WSL 内で Linux の signal-cli フローに従います

## 関連ドキュメント

- オンボーディングハブ: [オンボーディング（CLI）](/ja-JP/start/wizard)
- 自動化とスクリプト: [CLI 自動化](/ja-JP/start/wizard-cli-automation)
- コマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
