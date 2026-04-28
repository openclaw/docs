---
read_when:
    - '`openclaw onboard` の詳細な動作が必要です'
    - オンボーディング結果をデバッグしている、またはオンボーディングクライアントを統合しているところです
sidebarTitle: CLI reference
summary: CLI セットアップフロー、認証/モデル設定、出力、および内部動作の完全リファレンス
title: CLI セットアップリファレンス
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-25T18:21:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967fd6734d8facaa732b40567c33e48434208bf861d102adc8a4ee042f13041
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

このページは `openclaw onboard` の完全なリファレンスです。
短いガイドについては、[オンボーディング（CLI）](/ja-JP/start/wizard) を参照してください。

## ウィザードが行うこと

ローカルモード（デフォルト）では、次の内容を順番に設定します:

- モデルと認証の設定（OpenAI Code サブスクリプション OAuth、Anthropic Claude CLI または API キー、さらに MiniMax、GLM、Ollama、Moonshot、StepFun、AI Gateway オプション）
- ワークスペースの場所とブートストラップファイル
- Gateway 設定（ポート、bind、auth、Tailscale）
- チャネルと provider（Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、BlueBubbles、およびその他のバンドル済みチャネル Plugin）
- デーモンのインストール（LaunchAgent、systemd user unit、またはネイティブ Windows Scheduled Task。Startup フォルダへのフォールバックあり）
- ヘルスチェック
- Skills のセットアップ

リモートモードでは、このマシンを別の場所にある Gateway に接続するよう設定します。
リモートホストに何かをインストールしたり変更したりはしません。

## ローカルフローの詳細

<Steps>
  <Step title="既存設定の検出">
    - `~/.openclaw/openclaw.json` が存在する場合は、Keep、Modify、Reset を選択します。
    - 明示的に Reset を選ぶ（または `--reset` を渡す）まで、ウィザードを再実行しても何も消去されません。
    - CLI の `--reset` のデフォルトは `config+creds+sessions` です。ワークスペースも削除するには `--reset-scope full` を使ってください。
    - 設定が無効、またはレガシーキーを含んでいる場合、ウィザードは停止し、続行前に `openclaw doctor` を実行するよう求めます。
    - Reset は `trash` を使い、次のスコープを提供します:
      - 設定のみ
      - 設定 + 認証情報 + セッション
      - フルリセット（ワークスペースも削除）
  </Step>
  <Step title="モデルと認証">
    - 完全なオプション一覧は [認証とモデルのオプション](#auth-and-model-options) にあります。
  </Step>
  <Step title="ワークスペース">
    - デフォルトは `~/.openclaw/workspace`（変更可能）。
    - 初回実行のブートストラップ手順に必要なワークスペースファイルを配置します。
    - ワークスペース構成: [Agent workspace](/ja-JP/concepts/agent-workspace)。
  </Step>
  <Step title="Gateway">
    - ポート、bind、auth mode、Tailscale 公開について確認します。
    - 推奨: loopback の場合でも token auth を有効にして、ローカル WS クライアントにも認証を必須にしてください。
    - token mode では、対話セットアップで次を選べます:
      - **プレーンテキストトークンを生成して保存**（デフォルト）
      - **SecretRef を使う**（オプトイン）
    - password mode でも、対話セットアップはプレーンテキスト保存または SecretRef 保存をサポートします。
    - 非対話の token SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセス環境内に空でない env var が必要です。
      - `--gateway-token` とは併用できません。
    - すべてのローカルプロセスを完全に信頼している場合にのみ、auth を無効にしてください。
    - 非 loopback bind では、引き続き auth が必要です。
  </Step>
  <Step title="チャネル">
    - [WhatsApp](/ja-JP/channels/whatsapp): 任意の QR ログイン
    - [Telegram](/ja-JP/channels/telegram): bot token
    - [Discord](/ja-JP/channels/discord): bot token
    - [Google Chat](/ja-JP/channels/googlechat): サービスアカウント JSON + Webhook audience
    - [Mattermost](/ja-JP/channels/mattermost): bot token + base URL
    - [Signal](/ja-JP/channels/signal): 任意の `signal-cli` インストール + アカウント設定
    - [BlueBubbles](/ja-JP/channels/bluebubbles): iMessage に推奨。サーバー URL + password + Webhook
    - [iMessage](/ja-JP/channels/imessage): レガシー `imsg` CLI パス + DB アクセス
    - DM セキュリティ: デフォルトは pairing です。最初の DM でコードが送信されます。`openclaw pairing approve <channel> <code>` で承認するか、allowlist を使ってください。
  </Step>
  <Step title="デーモンのインストール">
    - macOS: LaunchAgent
      - ログイン済みユーザーセッションが必要です。ヘッドレス用途では、カスタム LaunchDaemon を使ってください（同梱はされていません）。
    - Linux および WSL2 上の Windows: systemd user unit
      - ログアウト後も Gateway が動作し続けるよう、ウィザードは `loginctl enable-linger <user>` を試みます。
      - sudo を求められる場合があります（`/var/lib/systemd/linger` に書き込み）。まず sudo なしで試します。
    - ネイティブ Windows: まず Scheduled Task
      - タスク作成が拒否された場合、OpenClaw はユーザーごとの Startup フォルダのログイン項目にフォールバックし、すぐに Gateway を起動します。
      - Supervisor の状態確認がより良いため、Scheduled Task が引き続き推奨です。
    - ランタイム選択: Node（推奨。WhatsApp と Telegram では必須）。Bun は推奨されません。
  </Step>
  <Step title="ヘルスチェック">
    - 必要に応じて Gateway を起動し、`openclaw health` を実行します。
    - `openclaw status --deep` は、サポートされている場合はチャネルプローブを含むライブ Gateway ヘルスプローブをステータス出力に追加します。
  </Step>
  <Step title="Skills">
    - 利用可能な Skills を読み取り、要件を確認します。
    - node manager として npm、pnpm、bun を選択できます。
    - 任意の依存関係をインストールします（一部は macOS で Homebrew を使用します）。
  </Step>
  <Step title="完了">
    - iOS、Android、macOS アプリのオプションを含むサマリーと次のステップを表示します。
  </Step>
</Steps>

<Note>
GUI が検出されない場合、ウィザードはブラウザを開く代わりに、Control UI 用の SSH ポートフォワード手順を表示します。
Control UI アセットが欠けている場合、ウィザードはそれらのビルドを試みます。フォールバックは `pnpm ui:build` です（UI 依存関係を自動インストールします）。
</Note>

## リモートモードの詳細

リモートモードでは、このマシンを別の場所にある Gateway に接続するよう設定します。

<Info>
リモートモードでは、リモートホストに何かをインストールしたり変更したりしません。
</Info>

設定する内容:

- リモート Gateway URL（`ws://...`）
- リモート Gateway で auth が必要な場合の token（推奨）

<Note>
- Gateway が loopback のみの場合は、SSH トンネリングまたは tailnet を使ってください。
- 検出のヒント:
  - macOS: Bonjour（`dns-sd`）
  - Linux: Avahi（`avahi-browse`）
</Note>

## 認証とモデルのオプション

<AccordionGroup>
  <Accordion title="Anthropic API キー">
    `ANTHROPIC_API_KEY` が存在すればそれを使い、なければキーの入力を求め、その後デーモン利用のために保存します。
  </Accordion>
  <Accordion title="OpenAI Code サブスクリプション（OAuth）">
    ブラウザフローです。`code#state` を貼り付けます。

    モデルが未設定、またはすでに OpenAI ファミリーである場合、`agents.defaults.model` を `openai-codex/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="OpenAI Code サブスクリプション（デバイスペアリング）">
    短時間有効な device code を使うブラウザペアリングフローです。

    モデルが未設定、またはすでに OpenAI ファミリーである場合、`agents.defaults.model` を `openai-codex/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="OpenAI API キー">
    `OPENAI_API_KEY` が存在すればそれを使い、なければキーの入力を求め、その後認証情報を auth profiles に保存します。

    モデルが未設定、`openai/*`、または `openai-codex/*` の場合、`agents.defaults.model` を `openai/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="xAI（Grok）API キー">
    `XAI_API_KEY` の入力を求め、xAI をモデル provider として設定します。
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）の入力を求め、Zen カタログまたは Go カタログを選択できます。
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
    account ID、gateway ID、`CLOUDFLARE_AI_GATEWAY_API_KEY` の入力を求めます。
    詳細: [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    設定は自動書き込みされます。ホスト版のデフォルトは `MiniMax-M2.7` です。API キー構成では
    `minimax/...`、OAuth 構成では `minimax-portal/...` を使います。
    詳細: [MiniMax](/ja-JP/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    China または global endpoint 上の StepFun standard または Step Plan 用に設定が自動書き込みされます。
    現在、standard には `step-3.5-flash` が含まれ、Step Plan には `step-3.5-flash-2603` も含まれます。
    詳細: [StepFun](/ja-JP/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（Anthropic 互換）">
    `SYNTHETIC_API_KEY` の入力を求めます。
    詳細: [Synthetic](/ja-JP/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（Cloud とローカルのオープンモデル）">
    最初に `Cloud + Local`、`Cloud only`、`Local only` を確認します。
    `Cloud only` は `https://ollama.com` と `OLLAMA_API_KEY` を使います。
    ホスト利用モードでは base URL（デフォルト `http://127.0.0.1:11434`）を確認し、利用可能なモデルを検出し、デフォルト候補を提案します。
    `Cloud + Local` では、その Ollama ホストが cloud access 用にサインイン済みかどうかも確認します。
    詳細: [Ollama](/ja-JP/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot と Kimi Coding">
    Moonshot（Kimi K2）および Kimi Coding の設定は自動書き込みされます。
    詳細: [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)。
  </Accordion>
  <Accordion title="カスタム provider">
    OpenAI 互換および Anthropic 互換 endpoint で動作します。

    対話オンボーディングは、他の provider API キーフローと同じ API キー保存方法をサポートします:
    - **今すぐ API キーを貼り付ける**（プレーンテキスト）
    - **シークレット参照を使う**（env ref または設定済み provider ref。事前検証あり）

    非対話フラグ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（任意。未指定時は `CUSTOM_API_KEY` にフォールバック）
    - `--custom-provider-id`（任意）
    - `--custom-compatibility <openai|anthropic>`（任意。デフォルトは `openai`）

  </Accordion>
  <Accordion title="スキップ">
    認証を未設定のままにします。
  </Accordion>
</AccordionGroup>

モデルの動作:

- 検出されたオプションからデフォルトモデルを選ぶか、provider と model を手動入力します。
- オンボーディングが provider 認証の選択から始まる場合、モデルピッカーは
  自動的にその provider を優先します。Volcengine と BytePlus では、この優先設定は
  それぞれの coding-plan バリアント（`volcengine-plan/*`、
  `byteplus-plan/*`）にも一致します。
- その preferred-provider フィルターで結果が空になる場合、モデルピッカーは
  モデルが 1 つも表示されない代わりに、完全なカタログにフォールバックします。
- ウィザードはモデルチェックを実行し、設定されたモデルが不明または認証不足であれば警告します。

認証情報とプロファイルのパス:

- auth profiles（API キー + OAuth）: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー OAuth import: `~/.openclaw/credentials/oauth.json`

認証情報の保存モード:

- デフォルトのオンボーディング動作では、API キーは auth profiles にプレーンテキスト値として保存されます。
- `--secret-input-mode ref` を使うと、プレーンテキストのキー保存ではなく参照モードが有効になります。
  対話セットアップでは、次のいずれかを選べます:
  - 環境変数参照（例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 設定済み provider 参照（`file` または `exec`）。provider alias + id を使用
- 対話参照モードでは、保存前に高速な事前検証を実行します。
  - Env ref: 変数名と、現在のオンボーディング環境内で空でない値を検証します。
  - Provider ref: provider 設定を検証し、要求された id を解決します。
  - 事前検証に失敗した場合、オンボーディングはエラーを表示し、再試行できます。
- 非対話モードでは、`--secret-input-mode ref` は env バックのみです。
  - provider env var をオンボーディングプロセス環境に設定してください。
  - インラインキーフラグ（例: `--openai-api-key`）では、その env var が設定されている必要があります。そうでない場合、オンボーディングは即座に失敗します。
  - カスタム provider では、非対話 `ref` モードは `models.providers.<id>.apiKey` を `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存します。
  - このカスタム provider の場合、`--custom-api-key` には `CUSTOM_API_KEY` の設定が必要です。そうでない場合、オンボーディングは即座に失敗します。
- Gateway の認証情報は、対話セットアップでプレーンテキストと SecretRef の両方をサポートします:
  - Token mode: **プレーンテキストトークンを生成して保存**（デフォルト）または **SecretRef を使う**。
  - Password mode: プレーンテキストまたは SecretRef。
- 非対話の token SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
- 既存のプレーンテキスト構成も、そのまま引き続き利用できます。

<Note>
ヘッドレスおよびサーバー向けのヒント: ブラウザのあるマシンで OAuth を完了し、その後
そのエージェントの `auth-profiles.json`（例:
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
`$OPENCLAW_STATE_DIR/...` パス）を Gateway ホストにコピーしてください。`credentials/oauth.json`
はレガシー import 元にすぎません。
</Note>

## 出力と内部動作

`~/.openclaw/openclaw.json` に含まれる代表的なフィールド:

- `agents.defaults.workspace`
- `--skip-bootstrap` が渡された場合の `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（MiniMax が選ばれた場合）
- `tools.profile`（ローカルオンボーディングでは未設定時のデフォルトが `"coding"`。既存の明示的な値は保持されます）
- `gateway.*`（mode、bind、auth、Tailscale）
- `session.dmScope`（ローカルオンボーディングでは未設定時のデフォルトが `per-channel-peer`。既存の明示的な値は保持されます）
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- プロンプト中にオプトインした場合のチャネル allowlist（Slack、Discord、Matrix、Microsoft Teams）。可能な場合は名前が ID に解決されます
- `skills.install.nodeManager`
  - `setup --node-manager` フラグは `npm`、`pnpm`、または `bun` を受け付けます。
  - 手動設定では、後から `skills.install.nodeManager: "yarn"` を設定することもできます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` は `agents.list[]` と任意の `bindings` を書き込みます。

WhatsApp の認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` 配下に保存されます。
セッションは `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。

<Note>
一部のチャネルは Plugin として配布されます。セットアップ中にそれらを選択すると、ウィザードは
チャネル設定の前に Plugin のインストール（npm またはローカルパス）を促します。
</Note>

Gateway ウィザード RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

クライアント（macOS アプリおよび Control UI）は、オンボーディングロジックを再実装せずにステップをレンダリングできます。

Signal のセットアップ動作:

- 適切なリリースアセットをダウンロードする
- `~/.openclaw/tools/signal-cli/<version>/` 配下に保存する
- 設定に `channels.signal.cliPath` を書き込む
- JVM ビルドには Java 21 が必要
- 利用可能な場合はネイティブビルドが使用される
- Windows では WSL2 を使用し、WSL 内で Linux の signal-cli フローに従う

## 関連ドキュメント

- オンボーディングハブ: [オンボーディング（CLI）](/ja-JP/start/wizard)
- 自動化とスクリプト: [CLI 自動化](/ja-JP/start/wizard-cli-automation)
- コマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
