---
read_when:
    - '`openclaw onboard` の詳細な動作が必要な場合'
    - オンボーディング結果をデバッグしている場合や、オンボーディングクライアントを統合している場合
sidebarTitle: CLI reference
summary: CLI セットアップフロー、認証/モデル設定、出力、内部動作の完全リファレンス
title: CLI セットアップリファレンス
x-i18n:
    generated_at: "2026-04-24T05:22:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4b9377e84a6f8063f20a80fe08b5ea2eccdd5b329ec8dfd9d16cbf425d01f66
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

このページは `openclaw onboard` の完全リファレンスです。
短いガイドについては [Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。

## wizard が行うこと

ローカルモード（デフォルト）では、次を順に案内します。

- モデルと認証の設定（OpenAI Code subscription OAuth、Anthropic Claude CLI または API key、さらに MiniMax、GLM、Ollama、Moonshot、StepFun、AI Gateway オプション）
- workspace の場所とブートストラップ file
- Gateway 設定（port、bind、auth、tailscale）
- channels と providers（Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、BlueBubbles、その他の bundled channel plugins）
- デーモンインストール（LaunchAgent、systemd user unit、またはネイティブ Windows Scheduled Task。Startup-folder フォールバックあり）
- health check
- Skills セットアップ

リモートモードでは、このマシンが別の場所にある gateway に接続するよう設定します。
リモートホストには何もインストールも変更もしません。

## ローカルフローの詳細

<Steps>
  <Step title="既存 config の検出">
    - `~/.openclaw/openclaw.json` が存在する場合、Keep、Modify、Reset を選択します。
    - wizard を再実行しても、明示的に Reset を選ばない限り（または `--reset` を渡さない限り）何も消去されません。
    - CLI の `--reset` のデフォルトは `config+creds+sessions` です。workspace も削除するには `--reset-scope full` を使ってください。
    - config が無効、またはレガシー key を含む場合、wizard は停止し、続行前に `openclaw doctor` を実行するよう求めます。
    - Reset は `trash` を使い、次の scope を提供します:
      - Config のみ
      - Config + credentials + sessions
      - Full reset（workspace も削除）
  </Step>
  <Step title="モデルと認証">
    - 完全なオプションマトリクスは [認証とモデルのオプション](#auth-and-model-options) にあります。
  </Step>
  <Step title="ワークスペース">
    - デフォルトは `~/.openclaw/workspace`（変更可能）。
    - 初回 bootstrap 儀式に必要な workspace file を seed します。
    - Workspace レイアウト: [Agent workspace](/ja-JP/concepts/agent-workspace)。
  </Step>
  <Step title="Gateway">
    - port、bind、auth mode、tailscale 公開を尋ねます。
    - 推奨: loopback であっても token auth を有効にして、ローカル WS クライアントにも認証を要求してください。
    - token mode では、対話セットアップで次を提供します:
      - **Generate/store plaintext token**（デフォルト）
      - **Use SecretRef**（オプトイン）
    - password mode でも、対話セットアップは plaintext または SecretRef 保存をサポートします。
    - 非対話 token SecretRef 経路: `--gateway-token-ref-env <ENV_VAR>`.
      - オンボーディングプロセス環境内に空でない env var が必要です。
      - `--gateway-token` とは併用できません。
    - 認証を無効にするのは、すべてのローカルプロセスを完全に信頼している場合だけにしてください。
    - non-loopback bind では引き続き auth が必要です。
  </Step>
  <Step title="チャンネル">
    - [WhatsApp](/ja-JP/channels/whatsapp): 任意の QR login
    - [Telegram](/ja-JP/channels/telegram): bot token
    - [Discord](/ja-JP/channels/discord): bot token
    - [Google Chat](/ja-JP/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/ja-JP/channels/mattermost): bot token + base URL
    - [Signal](/ja-JP/channels/signal): 任意の `signal-cli` install + account config
    - [BlueBubbles](/ja-JP/channels/bluebubbles): iMessage 向け推奨。server URL + password + webhook
    - [iMessage](/ja-JP/channels/imessage): レガシー `imsg` CLI path + DB access
    - DM security: デフォルトは pairing です。最初の DM でコードが送られます。`openclaw pairing approve <channel> <code>` で承認するか、allowlist を使ってください。
  </Step>
  <Step title="デーモンインストール">
    - macOS: LaunchAgent
      - ログイン中ユーザーセッションが必要です。headless 用には custom LaunchDaemon を使ってください（同梱はされていません）。
    - Linux と Windows via WSL2: systemd user unit
      - wizard は `loginctl enable-linger <user>` を試み、logout 後も gateway が動き続けるようにします。
      - sudo を求める場合があります（`/var/lib/systemd/linger` に書き込みます）。まず sudo なしで試します。
    - ネイティブ Windows: まず Scheduled Task
      - task 作成が拒否された場合、OpenClaw はユーザーごとの Startup-folder login item にフォールバックし、gateway を即時起動します。
      - Scheduled Task のほうが supervisor status が優れているため、引き続き推奨です。
    - ランタイム選択: Node（推奨。WhatsApp と Telegram では必須）。Bun は推奨されません。
  </Step>
  <Step title="Health check">
    - 必要なら gateway を起動し、`openclaw health` を実行します。
    - `openclaw status --deep` は、サポートされる場合、status 出力に live gateway health probe とチャンネル probe を追加します。
  </Step>
  <Step title="Skills">
    - 利用可能な Skills を読み、要件を確認します。
    - node manager として npm、pnpm、bun を選ばせます。
    - 任意依存をインストールします（一部は macOS で Homebrew を使います）。
  </Step>
  <Step title="完了">
    - iOS、Android、macOS アプリのオプションを含むサマリーと次のステップ。
  </Step>
</Steps>

<Note>
GUI が検出されない場合、wizard はブラウザを開く代わりに Control UI 用の SSH ポートフォワード手順を表示します。
Control UI asset がない場合、wizard はそれをビルドしようとします。フォールバックは `pnpm ui:build` です（UI 依存は自動インストール）。
</Note>

## リモートモードの詳細

リモートモードは、このマシンが別の場所の gateway に接続するよう設定します。

<Info>
リモートモードは、リモートホストには何もインストールも変更もしません。
</Info>

設定するもの:

- リモート gateway URL（`ws://...`）
- リモート gateway auth が必要なら token（推奨）

<Note>
- gateway が loopback-only なら、SSH tunneling または tailnet を使ってください。
- Discovery ヒント:
  - macOS: Bonjour（`dns-sd`）
  - Linux: Avahi（`avahi-browse`）
</Note>

## 認証とモデルのオプション

<AccordionGroup>
  <Accordion title="Anthropic API key">
    `ANTHROPIC_API_KEY` があればそれを使い、なければ key を尋ねてから、デーモン用に保存します。
  </Accordion>
  <Accordion title="OpenAI Code subscription（OAuth）">
    ブラウザフロー。`code#state` を貼り付けます。

    model が未設定またはすでに OpenAI ファミリーの場合、`agents.defaults.model` を `openai-codex/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="OpenAI Code subscription（device pairing）">
    有効期限の短い device code を使うブラウザ pairing フロー。

    model が未設定またはすでに OpenAI ファミリーの場合、`agents.defaults.model` を `openai-codex/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="OpenAI API key">
    `OPENAI_API_KEY` があればそれを使い、なければ key を尋ねた後、その認証情報を auth profile に保存します。

    model が未設定、`openai/*`、または `openai-codex/*` の場合、`agents.defaults.model` を `openai/gpt-5.4` に設定します。

  </Accordion>
  <Accordion title="xAI（Grok）API key">
    `XAI_API_KEY` を尋ね、xAI を model provider として設定します。
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）を尋ね、Zen または Go カタログを選ばせます。
    Setup URL: [opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API key（汎用）">
    key を保存します。
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` を尋ねます。
    詳細: [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    account ID、gateway ID、`CLOUDFLARE_AI_GATEWAY_API_KEY` を尋ねます。
    詳細: [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    Config は自動で書き込まれます。ホスト型デフォルトは `MiniMax-M2.7` です。API-key セットアップでは
    `minimax/...` を使い、OAuth セットアップでは `minimax-portal/...` を使います。
    詳細: [MiniMax](/ja-JP/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    StepFun standard または Step Plan の China/global endpoint 用 config が自動で書き込まれます。
    Standard には現在 `step-3.5-flash` が含まれ、Step Plan には `step-3.5-flash-2603` も含まれます。
    詳細: [StepFun](/ja-JP/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（Anthropic 互換）">
    `SYNTHETIC_API_KEY` を尋ねます。
    詳細: [Synthetic](/ja-JP/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（Cloud とローカル open model）">
    最初に `Cloud + Local`、`Cloud only`、`Local only` を尋ねます。
    `Cloud only` は `OLLAMA_API_KEY` と `https://ollama.com` を使います。
    host を使う mode では base URL（デフォルト `http://127.0.0.1:11434`）を尋ね、利用可能なモデルを検出し、デフォルトを提案します。
    `Cloud + Local` では、その Ollama host が cloud access 用に sign in 済みかどうかも確認します。
    詳細: [Ollama](/ja-JP/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot と Kimi Coding">
    Moonshot（Kimi K2）と Kimi Coding の config は自動で書き込まれます。
    詳細: [Moonshot AI（Kimi + Kimi Coding）](/ja-JP/providers/moonshot)。
  </Accordion>
  <Accordion title="Custom provider">
    OpenAI 互換および Anthropic 互換 endpoint で動作します。

    対話型オンボーディングは、他の provider API key フローと同じ API key 保存方法をサポートします:
    - **Paste API key now**（plaintext）
    - **Use secret reference**（env ref または configured provider ref。事前検証あり）

    非対話フラグ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（任意。`CUSTOM_API_KEY` にフォールバック）
    - `--custom-provider-id`（任意）
    - `--custom-compatibility <openai|anthropic>`（任意。デフォルト `openai`）

  </Accordion>
  <Accordion title="Skip">
    認証を未設定のままにします。
  </Accordion>
</AccordionGroup>

モデル動作:

- 検出されたオプションからデフォルトモデルを選ぶか、provider と model を手入力します。
- オンボーディングが provider auth choice から始まる場合、model picker は
  その provider を自動的に優先します。Volcengine と BytePlus では、同じ優先設定が
  それらの coding-plan variant（`volcengine-plan/*`、
  `byteplus-plan/*`）にも一致します。
- その preferred-provider フィルタが空になる場合、picker はモデルが何もない状態を見せる代わりに full catalog にフォールバックします。
- Wizard は model check を実行し、設定された model が未知または認証不足の場合は警告します。

認証情報と profile path:

- Auth profiles（API key + OAuth）: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー OAuth import: `~/.openclaw/credentials/oauth.json`

認証情報保存モード:

- デフォルトのオンボーディング動作では、API key は plaintext 値として auth profile に保存されます。
- `--secret-input-mode ref` を使うと、plaintext key 保存の代わりに reference mode が有効になります。
  対話セットアップでは次のどちらかを選べます:
  - environment variable ref（例 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - configured provider ref（`file` または `exec`）と provider alias + id
- 対話型 reference mode は保存前に高速な preflight validation を実行します。
  - Env ref: 変数名と、現在のオンボーディング環境での非空値を検証します。
  - Provider ref: provider config を検証し、要求された id を解決します。
  - preflight が失敗すると、オンボーディングはエラーを表示し、再試行させます。
- 非対話モードでの `--secret-input-mode ref` は env-backed のみです。
  - onboarding process 環境に provider env var を設定してください。
  - インライン key フラグ（たとえば `--openai-api-key`）は、その env var が設定されていることを要求します。そうでなければオンボーディングは即失敗します。
  - custom provider では、非対話 `ref` mode は `models.providers.<id>.apiKey` を `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存します。
  - その custom-provider ケースでは、`--custom-api-key` は `CUSTOM_API_KEY` が設定されていることを要求します。そうでなければオンボーディングは即失敗します。
- Gateway auth 認証情報は、対話セットアップで plaintext と SecretRef の両方をサポートします:
  - Token mode: **Generate/store plaintext token**（デフォルト）または **Use SecretRef**。
  - Password mode: plaintext または SecretRef。
- 非対話 token SecretRef 経路: `--gateway-token-ref-env <ENV_VAR>`。
- 既存の plaintext セットアップは、そのまま変更なく動作し続けます。

<Note>
Headless と server のヒント: OAuth はブラウザのあるマシンで完了し、その後
そのエージェントの `auth-profiles.json`（たとえば
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
`$OPENCLAW_STATE_DIR/...` path）を gateway host にコピーしてください。`credentials/oauth.json`
はレガシー import source にすぎません。
</Note>

## 出力と内部動作

`~/.openclaw/openclaw.json` に典型的に含まれるフィールド:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（MiniMax を選んだ場合）
- `tools.profile`（ローカルオンボーディングでは、未設定ならデフォルトで `"coding"` になります。既存の明示値は保持されます）
- `gateway.*`（mode、bind、auth、tailscale）
- `session.dmScope`（ローカルオンボーディングでは、未設定ならデフォルトで `per-channel-peer` になります。既存の明示値は保持されます）
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- prompt 中に opt-in した場合の channel allowlist（Slack、Discord、Matrix、Microsoft Teams）。可能な場合は名前が ID に解決されます
- `skills.install.nodeManager`
  - `setup --node-manager` フラグは `npm`、`pnpm`、`bun` を受け付けます。
  - 手動 config では後から `skills.install.nodeManager: "yarn"` に設定することもできます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` は `agents.list[]` と任意の `bindings` を書き込みます。

WhatsApp 認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` 配下に置かれます。
Session は `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。

<Note>
一部のチャンネルは Plugin として配信されます。セットアップ中にそれらを選択した場合、wizard はチャンネル設定の前に Plugin のインストール（npm またはローカル path）を求めます。
</Note>

Gateway wizard RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

クライアント（macOS アプリと Control UI）は、オンボーディングロジックを再実装せずに step をレンダリングできます。

Signal セットアップの動作:

- 適切なリリース asset をダウンロードする
- それを `~/.openclaw/tools/signal-cli/<version>/` 配下に保存する
- config に `channels.signal.cliPath` を書き込む
- JVM build には Java 21 が必要
- 利用可能な場合は native build を使う
- Windows は WSL2 を使い、WSL 内で Linux の signal-cli フローに従う

## 関連ドキュメント

- Onboarding hub: [Onboarding (CLI)](/ja-JP/start/wizard)
- 自動化とスクリプト: [CLI Automation](/ja-JP/start/wizard-cli-automation)
- コマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
