---
read_when:
    - openclaw onboard の詳細な動作が必要です
    - オンボーディング結果をデバッグしている、またはオンボーディングクライアントを統合している
sidebarTitle: CLI reference
summary: CLI セットアップフロー、認証/モデル設定、出力、内部構造の完全なリファレンス
title: CLI セットアップリファレンス
x-i18n:
    generated_at: "2026-05-10T19:52:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9166e8763c1ee1884817a9625a035b7efa1a97a1d4d4e4dffc1926675b1d3214
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

このページは `openclaw onboard` の完全なリファレンスです。
短いガイドについては、[オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。

## ウィザードが行うこと

ローカルモード (デフォルト) では、次の項目を順に設定します。

- モデルと認証のセットアップ (OpenAI Code サブスクリプション OAuth、Anthropic Claude CLI または API キー、さらに MiniMax、GLM、Ollama、Moonshot、StepFun、AI Gateway オプション)
- ワークスペースの場所とブートストラップファイル
- Gateway 設定 (ポート、バインド、認証、Tailscale)
- チャネルとプロバイダー (Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、iMessage、およびその他の同梱チャネル Plugin)
- デーモンのインストール (LaunchAgent、systemd ユーザーユニット、または Startup フォルダーへのフォールバック付きのネイティブ Windows Scheduled Task)
- ヘルスチェック
- Skills のセットアップ

リモートモードでは、このマシンが別の場所にある Gateway へ接続するように設定します。
リモートホスト上のものをインストールしたり変更したりすることはありません。

## ローカルフローの詳細

<Steps>
  <Step title="既存設定の検出">
    - `~/.openclaw/openclaw.json` が存在する場合は、保持、変更、リセットのいずれかを選択します。
    - ウィザードを再実行しても、明示的にリセットを選択しない限り (または `--reset` を渡さない限り)、何も消去されません。
    - CLI の `--reset` はデフォルトで `config+creds+sessions` です。ワークスペースも削除するには `--reset-scope full` を使用します。
    - 設定が無効、またはレガシーキーを含んでいる場合、ウィザードは停止し、続行する前に `openclaw doctor` の実行を求めます。
    - リセットには `trash` が使用され、次のスコープが提示されます。
      - 設定のみ
      - 設定 + 認証情報 + セッション
      - 完全リセット (ワークスペースも削除)

  </Step>
  <Step title="モデルと認証">
    - 完全なオプション一覧は [認証とモデルのオプション](#auth-and-model-options) にあります。

  </Step>
  <Step title="ワークスペース">
    - デフォルトは `~/.openclaw/workspace` です (設定可能)。
    - 初回実行のブートストラップ儀式に必要なワークスペースファイルを投入します。
    - ワークスペースのレイアウト: [Agent workspace](/ja-JP/concepts/agent-workspace)。

  </Step>
  <Step title="Gateway">
    - ポート、バインド、認証モード、Tailscale での公開について入力を求めます。
    - 推奨: loopback の場合でもトークン認証を有効のままにし、ローカル WS クライアントに認証を必須にします。
    - トークンモードでは、対話型セットアップで次の選択肢が提示されます。
      - **プレーンテキストトークンを生成して保存** (デフォルト)
      - **SecretRef を使用** (オプトイン)
    - パスワードモードでは、対話型セットアップでプレーンテキストまたは SecretRef ストレージもサポートされます。
    - 非対話型のトークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセス環境に、空でない環境変数が必要です。
      - `--gateway-token` と組み合わせることはできません。
    - すべてのローカルプロセスを完全に信頼できる場合にのみ、認証を無効にしてください。
    - loopback 以外のバインドでは、引き続き認証が必要です。

  </Step>
  <Step title="チャネル">
    - [WhatsApp](/ja-JP/channels/whatsapp): オプションの QR ログイン
    - [Telegram](/ja-JP/channels/telegram): bot トークン
    - [Discord](/ja-JP/channels/discord): bot トークン
    - [Google Chat](/ja-JP/channels/googlechat): サービスアカウント JSON + Webhook オーディエンス
    - [Mattermost](/ja-JP/channels/mattermost): bot トークン + ベース URL
    - [Signal](/ja-JP/channels/signal): オプションの `signal-cli` インストール + アカウント設定
    - [iMessage](/ja-JP/channels/imessage): `imsg` CLI パス + Messages DB アクセス。Gateway が Mac 以外で動作する場合は SSH ラッパーを使用します
    - DM セキュリティ: デフォルトはペアリングです。最初の DM でコードが送信されます。承認するには
      `openclaw pairing approve <channel> <code>` を使用するか、許可リストを使用します。
  </Step>
  <Step title="デーモンのインストール">
    - macOS: LaunchAgent
      - ログイン済みユーザーセッションが必要です。ヘッドレス環境では、カスタム LaunchDaemon を使用してください (同梱されていません)。
    - Linux および WSL2 経由の Windows: systemd ユーザーユニット
      - ウィザードは、ログアウト後も Gateway が起動し続けるように `loginctl enable-linger <user>` を試行します。
      - sudo を求める場合があります (`/var/lib/systemd/linger` に書き込みます)。最初は sudo なしで試行します。
    - ネイティブ Windows: まず Scheduled Task
      - タスク作成が拒否された場合、OpenClaw はユーザーごとの Startup フォルダーログイン項目にフォールバックし、Gateway をただちに起動します。
      - Scheduled Task は、より優れたスーパーバイザーステータスを提供するため、引き続き推奨されます。
    - ランタイムの選択: Node (推奨。WhatsApp と Telegram に必要)。Bun は推奨されません。

  </Step>
  <Step title="ヘルスチェック">
    - Gateway を起動し (必要な場合)、`openclaw health` を実行します。
    - `openclaw status --deep` は、サポートされている場合はチャネルプローブを含め、ライブ Gateway ヘルスプローブをステータス出力に追加します。

  </Step>
  <Step title="Skills">
    - 利用可能な Skills を読み取り、要件を確認します。
    - node マネージャーとして npm、pnpm、bun のいずれかを選択できます。
    - オプションの依存関係をインストールします (macOS では Homebrew を使用するものがあります)。

  </Step>
  <Step title="完了">
    - iOS、Android、macOS アプリのオプションを含む、概要と次のステップを表示します。

  </Step>
</Steps>

<Note>
GUI が検出されない場合、ウィザードはブラウザーを開く代わりに、Control UI 用の SSH ポートフォワード手順を出力します。
Control UI アセットが見つからない場合、ウィザードはそれらのビルドを試みます。フォールバックは `pnpm ui:build` です (UI 依存関係を自動インストールします)。
</Note>

## リモートモードの詳細

リモートモードでは、このマシンが別の場所にある Gateway へ接続するように設定します。

<Info>
リモートモードは、リモートホスト上のものをインストールしたり変更したりしません。
</Info>

設定する内容:

- リモート Gateway URL (`ws://...`)
- リモート Gateway 認証が必要な場合のトークン (推奨)

<Note>
- Gateway が loopback のみの場合は、SSH トンネリングまたは tailnet を使用します。
- 検出のヒント:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## 認証とモデルのオプション

<AccordionGroup>
  <Accordion title="Anthropic API キー">
    存在する場合は `ANTHROPIC_API_KEY` を使用し、存在しない場合はキーの入力を求めてから、デーモンで使用できるように保存します。
  </Accordion>
  <Accordion title="OpenAI Code サブスクリプション (OAuth)">
    ブラウザーフローです。`code#state` を貼り付けます。

    モデルが未設定、またはすでに OpenAI ファミリーの場合、Codex ランタイムを通じて `agents.defaults.model` を `openai/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="OpenAI Code サブスクリプション (デバイスペアリング)">
    短命のデバイスコードを使用するブラウザーペアリングフローです。

    モデルが未設定、またはすでに OpenAI ファミリーの場合、Codex ランタイムを通じて `agents.defaults.model` を `openai/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="OpenAI API キー">
    存在する場合は `OPENAI_API_KEY` を使用し、存在しない場合はキーの入力を求めてから、認証プロファイルに認証情報を保存します。

    モデルが未設定、`openai/*`、または `openai-codex/*` の場合、`agents.defaults.model` を `openai/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="xAI (Grok) API キー">
    `XAI_API_KEY` の入力を求め、xAI をモデルプロバイダーとして設定します。
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`) の入力を求め、Zen または Go カタログを選択できるようにします。
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
    設定は自動で書き込まれます。ホスト型のデフォルトは `MiniMax-M2.7` です。API キーセットアップでは
    `minimax/...` が使用され、OAuth セットアップでは `minimax-portal/...` が使用されます。
    詳細: [MiniMax](/ja-JP/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    中国またはグローバルのエンドポイント上の StepFun standard または Step Plan 向けに、設定が自動で書き込まれます。
    Standard には現在 `step-3.5-flash` が含まれ、Step Plan には `step-3.5-flash-2603` も含まれます。
    詳細: [StepFun](/ja-JP/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic (Anthropic 互換)">
    `SYNTHETIC_API_KEY` の入力を求めます。
    詳細: [Synthetic](/ja-JP/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama (クラウドおよびローカルオープンモデル)">
    まず `Cloud + Local`、`Cloud only`、`Local only` の入力を求めます。
    `Cloud only` は `OLLAMA_API_KEY` を `https://ollama.com` とともに使用します。
    ホスト backed モードでは、ベース URL (デフォルト `http://127.0.0.1:11434`) の入力を求め、利用可能なモデルを検出し、デフォルトを提案します。
    `Cloud + Local` は、その Ollama ホストがクラウドアクセスにサインインしているかも確認します。
    詳細: [Ollama](/ja-JP/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot と Kimi Coding">
    Moonshot (Kimi K2) と Kimi Coding の設定は自動で書き込まれます。
    詳細: [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)。
  </Accordion>
  <Accordion title="カスタムプロバイダー">
    OpenAI 互換および Anthropic 互換エンドポイントで動作します。

    対話型オンボーディングは、他のプロバイダー API キーフローと同じ API キーストレージの選択肢をサポートします。
    - **今すぐ API キーを貼り付け** (プレーンテキスト)
    - **シークレット参照を使用** (事前検証付きの env ref または設定済み provider ref)

    非対話型フラグ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (オプション。`CUSTOM_API_KEY` にフォールバック)
    - `--custom-provider-id` (オプション)
    - `--custom-compatibility <openai|anthropic>` (オプション。デフォルトは `openai`)
    - `--custom-image-input` / `--custom-text-input` (オプション。推論されたモデル入力機能を上書き)

  </Accordion>
  <Accordion title="スキップ">
    認証を未設定のままにします。
  </Accordion>
</AccordionGroup>

モデルの動作:

- 検出されたオプションからデフォルトモデルを選択するか、プロバイダーとモデルを手動で入力します。
- カスタムプロバイダーのオンボーディングは、一般的なモデル ID について画像サポートを推論し、モデル名が不明な場合にのみ確認します。
- オンボーディングがプロバイダー認証の選択から開始された場合、モデルピッカーは
  そのプロバイダーを自動的に優先します。Volcengine と BytePlus では、同じ優先設定が
  それぞれの coding-plan バリアント (`volcengine-plan/*`,
  `byteplus-plan/*`) にも一致します。
- その優先プロバイダーフィルターが空になる場合、ピッカーはモデルなしを表示する代わりに
  完全なカタログにフォールバックします。
- ウィザードはモデルチェックを実行し、設定されたモデルが不明、または認証が不足している場合に警告します。

認証情報とプロファイルのパス:

- 認証プロファイル (API キー + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー OAuth インポート: `~/.openclaw/credentials/oauth.json`

認証情報ストレージモード:

- デフォルトのオンボーディング動作では、API キーが認証プロファイル内のプレーンテキスト値として永続化されます。
- `--secret-input-mode ref` は、プレーンテキストキー保存の代わりに参照モードを有効にします。
  対話型セットアップでは、次のいずれかを選択できます。
  - 環境変数 ref (例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - 設定済み provider ref (`file` または `exec`) と provider エイリアス + id
- 対話型の参照モードでは、保存前に高速な事前検証が実行されます。
  - Env refs: 現在のオンボーディング環境で、変数名 + 空でない値を検証します。
  - Provider refs: プロバイダー設定を検証し、要求された id を解決します。
  - 事前検証に失敗した場合、オンボーディングはエラーを表示し、再試行できるようにします。
- 非対話型モードでは、`--secret-input-mode ref` は env backed のみです。
  - オンボーディングプロセス環境でプロバイダー環境変数を設定します。
  - インラインキーフラグ (例: `--openai-api-key`) では、その環境変数が設定されている必要があります。設定されていない場合、オンボーディングはすぐに失敗します。
  - カスタムプロバイダーでは、非対話型の `ref` モードは `models.providers.<id>.apiKey` を `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存します。
  - そのカスタムプロバイダーの場合、`--custom-api-key` では `CUSTOM_API_KEY` が設定されている必要があります。設定されていない場合、オンボーディングはすぐに失敗します。
- Gateway 認証情報は、対話型セットアップでプレーンテキストと SecretRef の選択肢をサポートします。
  - トークンモード: **プレーンテキストトークンを生成して保存** (デフォルト) または **SecretRef を使用**。
  - パスワードモード: プレーンテキストまたは SecretRef。
- 非対話型のトークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
- 既存のプレーンテキストセットアップは、変更なしで引き続き動作します。

<Note>
ヘッドレスおよびサーバー向けのヒント: ブラウザがあるマシンで OAuth を完了してから、そのエージェントの `auth-profiles.json` (例: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する `$OPENCLAW_STATE_DIR/...` パス) を Gateway ホストにコピーします。`credentials/oauth.json` はレガシーのインポート元にすぎません。
</Note>

## 出力と内部

`~/.openclaw/openclaw.json` の典型的なフィールド:

- `agents.defaults.workspace`
- `--skip-bootstrap` が渡された場合の `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers` (Minimax を選択した場合)
- `tools.profile` (未設定の場合、ローカルのオンボーディングは `"coding"` をデフォルトにします。既存の明示的な値は保持されます)
- `gateway.*` (mode、bind、auth、tailscale)
- `session.dmScope` (未設定の場合、ローカルのオンボーディングはこれを `per-channel-peer` にデフォルト設定します。既存の明示的な値は保持されます)
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- プロンプト中にオプトインした場合のチャネル許可リスト (Slack、Discord、Matrix、Microsoft Teams) (可能な場合、名前は ID に解決されます)
- `skills.install.nodeManager`
  - `setup --node-manager` フラグは `npm`、`pnpm`、または `bun` を受け付けます。
  - 手動設定では、後から `skills.install.nodeManager: "yarn"` を引き続き設定できます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` は `agents.list[]` と任意の `bindings` を書き込みます。

WhatsApp 認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` の下に配置されます。
セッションは `~/.openclaw/agents/<agentId>/sessions/` の下に保存されます。

<Note>
一部のチャネルは plugins として提供されます。セットアップ中に選択すると、ウィザードはチャネル設定の前に Plugin (npm またはローカルパス) のインストールを促します。
</Note>

Gateway ウィザード RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

クライアント (macOS アプリと Control UI) は、オンボーディングロジックを再実装せずにステップを表示できます。

Signal セットアップの動作:

- 適切なリリースアセットをダウンロードします
- `~/.openclaw/tools/signal-cli/<version>/` の下に保存します
- 設定に `channels.signal.cliPath` を書き込みます
- JVM ビルドには Java 21 が必要です
- 利用可能な場合はネイティブビルドが使用されます
- Windows では WSL2 を使用し、WSL 内で Linux の signal-cli フローに従います

## 関連ドキュメント

- オンボーディングハブ: [オンボーディング (CLI)](/ja-JP/start/wizard)
- 自動化とスクリプト: [CLI 自動化](/ja-JP/start/wizard-cli-automation)
- コマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
