---
read_when:
    - 特定のオンボーディング手順またはフラグを調べる
    - 非対話モードでオンボーディングを自動化する
    - オンボーディング動作のデバッグ
sidebarTitle: Onboarding Reference
summary: 'CLIオンボーディングの完全リファレンス: すべての手順、フラグ、設定フィールド'
title: オンボーディングリファレンス
x-i18n:
    generated_at: "2026-06-27T13:03:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 739048d53983febc32adaeab10225a288ae66752bee70cfea500d1664fd8546b
    source_path: reference/wizard.md
    workflow: 16
---

これは `openclaw onboard` の完全なリファレンスです。
概要については、[オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。

## フローの詳細 (ローカルモード)

<Steps>
  <Step title="既存設定の検出">
    - `~/.openclaw/openclaw.json` が存在する場合は、**現在の値を維持**、**確認して更新**、または **セットアップ前にリセット** を選択します。
    - オンボーディングを再実行しても、明示的に **リセット** を選択しない限り何も消去されません
      (または `--reset` を渡した場合)。
    - CLI の `--reset` はデフォルトで `config+creds+sessions` です。ワークスペースも削除するには `--reset-scope full`
      を使用します。
    - 設定が無効、またはレガシーキーを含む場合、ウィザードは停止し、続行する前に
      `openclaw doctor` を実行するよう求めます。
    - リセットは `trash` を使用し (`rm` は使用しません)、次のスコープを提示します。
      - 設定のみ
      - 設定 + 認証情報 + セッション
      - 完全リセット (ワークスペースも削除)

  </Step>
  <Step title="モデル/認証">
    - **Anthropic API キー**: 存在する場合は `ANTHROPIC_API_KEY` を使用し、存在しない場合はキーの入力を求め、その後デーモンで使用するために保存します。
    - **Anthropic API キー**: オンボーディング/configure で推奨される Anthropic アシスタントの選択肢です。
    - **Anthropic setup-token**: OpenClaw は現在、利用可能な場合は Claude CLI の再利用を優先しますが、オンボーディング/configure では引き続き利用できます。
    - **OpenAI Code (Codex) サブスクリプション (OAuth)**: ブラウザーフローです。`code#state` を貼り付けます。
      - モデルが未設定、またはすでに OpenAI 系である場合、Codex ランタイムを通じて `agents.defaults.model` を `openai/gpt-5.5` に設定します。
    - **OpenAI Code (Codex) サブスクリプション (デバイスペアリング)**: 短時間有効なデバイスコードを使うブラウザーペアリングフローです。
      - モデルが未設定、またはすでに OpenAI 系である場合、Codex ランタイムを通じて `agents.defaults.model` を `openai/gpt-5.5` に設定します。
    - **OpenAI API キー**: 存在する場合は `OPENAI_API_KEY` を使用し、存在しない場合はキーの入力を求め、その後認証プロファイルに保存します。
      - モデルが未設定、`openai/*`、またはレガシー Codex モデル参照である場合、`agents.defaults.model` を `openai/gpt-5.5` に設定します。
    - **xAI (Grok) OAuth / API キー**: 選択した場合は xAI OAuth でサインインし、API キーのパスでは `XAI_API_KEY` の入力を求め、xAI をモデルプロバイダーとして設定します。
    - **OpenCode**: `OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`、https://opencode.ai/auth で取得) の入力を求め、Zen または Go カタログを選択できます。
    - **Ollama**: 最初に **Cloud + Local**、**Cloud のみ**、または **Local のみ** を提示します。`Cloud only` は `OLLAMA_API_KEY` の入力を求め、`https://ollama.com` を使用します。ホストに基づくモードでは Ollama ベース URL の入力を求め、利用可能なモデルを検出し、必要に応じて選択されたローカルモデルを自動 pull します。`Cloud + Local` では、その Ollama ホストがクラウドアクセスにサインインしているかも確認します。
    - 詳細: [Ollama](/ja-JP/providers/ollama)
    - **API キー**: キーを保存します。
    - **Vercel AI Gateway (マルチモデルプロキシ)**: `AI_GATEWAY_API_KEY` の入力を求めます。
    - 詳細: [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: アカウント ID、Gateway ID、`CLOUDFLARE_AI_GATEWAY_API_KEY` の入力を求めます。
    - 詳細: [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
    - **MiniMax**: 設定は自動で書き込まれます。ホスト型のデフォルトは `MiniMax-M3` です。
      API キーセットアップは `minimax/...` を使用し、OAuth セットアップは
      `minimax-portal/...` を使用します。
    - 詳細: [MiniMax](/ja-JP/providers/minimax)
    - **StepFun**: 中国またはグローバルエンドポイントの StepFun standard または Step Plan 用に設定が自動で書き込まれます。
    - Standard には現在 `step-3.5-flash` が含まれ、Step Plan には `step-3.5-flash-2603` も含まれます。
    - 詳細: [StepFun](/ja-JP/providers/stepfun)
    - **Synthetic (Anthropic 互換)**: `SYNTHETIC_API_KEY` の入力を求めます。
    - 詳細: [Synthetic](/ja-JP/providers/synthetic)
    - **Moonshot (Kimi K2)**: 設定は自動で書き込まれます。
    - **Kimi Coding**: 設定は自動で書き込まれます。
    - 詳細: [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)
    - **スキップ**: 認証はまだ設定されません。
    - 検出された選択肢からデフォルトモデルを選びます (または provider/model を手動で入力します)。最高の品質と低いプロンプトインジェクションリスクのため、プロバイダースタックで利用可能な最新世代の最も強力なモデルを選択してください。
    - オンボーディングはモデルチェックを実行し、設定されたモデルが不明、または認証がない場合に警告します。
    - API キーの保存モードは、デフォルトで平文の認証プロファイル値です。代わりに env に基づく参照を保存するには、`--secret-input-mode ref` を使用します (例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)。
    - 認証プロファイルは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API キー + OAuth) にあります。`~/.openclaw/credentials/oauth.json` はレガシーのインポート専用です。
    - 詳細: [/concepts/oauth](/ja-JP/concepts/oauth)
    <Note>
    ヘッドレス/サーバーのヒント: ブラウザーのあるマシンで OAuth を完了し、その後
    そのエージェントの `auth-profiles.json` (例:
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
    `$OPENCLAW_STATE_DIR/...` パス) を Gateway ホストにコピーします。`credentials/oauth.json`
    はレガシーのインポート元にすぎません。
    </Note>
  </Step>
  <Step title="ワークスペース">
    - デフォルトは `~/.openclaw/workspace` (設定可能)。
    - エージェントのブートストラップ儀式に必要なワークスペースファイルを初期配置します。
    - ワークスペース全体のレイアウト + バックアップガイド: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - ポート、バインド、認証モード、tailscale 露出。
    - 認証の推奨: local loopback でも **Token** を維持し、ローカル WS クライアントに認証を必須にします。
    - トークンモードでは、対話式セットアップで次を提示します。
      - **平文トークンを生成/保存** (デフォルト)
      - **SecretRef を使用** (オプトイン)
      - クイックスタートは、オンボーディングのプローブ/ダッシュボードのブートストラップのために、`env`、`file`、`exec` プロバイダーにわたって既存の `gateway.auth.token` SecretRefs を再利用します。
      - その SecretRef が設定されているものの解決できない場合、オンボーディングはランタイム認証を暗黙に劣化させるのではなく、明確な修正メッセージを出して早期に失敗します。
    - パスワードモードでは、対話式セットアップは平文または SecretRef 保存にも対応します。
    - 非対話式トークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセス環境に空でない環境変数が必要です。
      - `--gateway-token` と組み合わせることはできません。
    - すべてのローカルプロセスを完全に信頼できる場合にのみ、認証を無効にしてください。
    - 非 loopback バインドでは引き続き認証が必要です。

  </Step>
  <Step title="チャネル">
    - [WhatsApp](/ja-JP/channels/whatsapp): 任意の QR ログイン。
    - [Telegram](/ja-JP/channels/telegram): ボットトークン。
    - [Discord](/ja-JP/channels/discord): ボットトークン。
    - [Google Chat](/ja-JP/channels/googlechat): サービスアカウント JSON + Webhook audience。
    - [Mattermost](/ja-JP/channels/mattermost) (Plugin): ボットトークン + ベース URL。
    - [Signal](/ja-JP/channels/signal): 任意の `signal-cli` インストール + アカウント設定。
    - [iMessage](/ja-JP/channels/imessage): `imsg` CLI パス + Messages DB アクセス。Gateway が Mac 以外で動作する場合は SSH ラッパーを使用します。
    - DM セキュリティ: デフォルトはペアリングです。最初の DM でコードを送信します。`openclaw pairing approve <channel> <code>` で承認するか、許可リストを使用します。

  </Step>
  <Step title="Web 検索">
    - Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily などの対応プロバイダーを選択します (またはスキップします)。
    - API に基づくプロバイダーは、クイックセットアップに環境変数または既存設定を使用できます。キー不要のプロバイダーは、代わりにプロバイダー固有の前提条件を使用します。
    - `--skip-search` でスキップします。
    - 後で設定: `openclaw configure --section web`。

  </Step>
  <Step title="デーモンのインストール">
    - macOS: LaunchAgent
      - ログイン中のユーザーセッションが必要です。ヘッドレスの場合は、カスタム LaunchDaemon (同梱されていません) を使用します。
    - Linux (および WSL2 経由の Windows): systemd ユーザーユニット
      - オンボーディングは `loginctl enable-linger <user>` による lingering の有効化を試み、ログアウト後も Gateway が稼働し続けるようにします。
      - sudo を求める場合があります (`/var/lib/systemd/linger` に書き込みます)。まず sudo なしで試行します。
    - **ランタイム選択:** Node (推奨。WhatsApp/Telegram に必要)。Bun は **非推奨** です。
    - トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、デーモンのインストールはそれを検証しますが、解決された平文トークン値を supervisor サービス環境メタデータに永続化しません。
    - トークン認証にトークンが必要で、設定されたトークン SecretRef が未解決の場合、デーモンのインストールは実行可能な案内付きでブロックされます。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでデーモンのインストールはブロックされます。

  </Step>
  <Step title="ヘルスチェック">
    - Gateway を起動し (必要な場合)、`openclaw health` を実行します。
    - ヒント: `openclaw status --deep` は、対応している場合のチャネルプローブを含め、ライブ Gateway ヘルスプローブをステータス出力に追加します (到達可能な Gateway が必要です)。

  </Step>
  <Step title="Skills (推奨)">
    - 利用可能な Skills を読み取り、要件を確認します。
    - node マネージャーを選択できます: **npm / pnpm** (bun は非推奨)。
    - 任意の依存関係をインストールします (一部は macOS で Homebrew を使用します)。

  </Step>
  <Step title="完了">
    - 概要 + 次のステップ。Terminal、Browser、または後で行うかを選ぶ **エージェントをどのように hatch しますか?** プロンプトを含みます。

  </Step>
</Steps>

<Note>
GUI が検出されない場合、オンボーディングはブラウザーを開く代わりに Control UI 用の SSH ポートフォワード手順を表示します。
Control UI アセットがない場合、オンボーディングはそれらのビルドを試みます。フォールバックは `pnpm ui:build` です (UI 依存関係を自動インストールします)。
</Note>

## 非対話式モード

オンボーディングを自動化またはスクリプト化するには `--non-interactive` を使用します。

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

機械可読な概要を得るには `--json` を追加します。

非対話式モードでの Gateway トークン SecretRef:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` と `--gateway-token-ref-env` は相互に排他的です。

<Note>
`--json` は非対話式モードを意味しません。スクリプトでは `--non-interactive` (および `--workspace`) を使用してください。
</Note>

プロバイダー固有のコマンド例は [CLI 自動化](/ja-JP/start/wizard-cli-automation#provider-specific-examples) にあります。
フラグの意味とステップ順序については、このリファレンスページを使用してください。

### エージェントを追加 (非対話式)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway ウィザード RPC

Gateway はオンボーディングフローを RPC (`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`) 経由で公開します。
クライアント (macOS アプリ、Control UI) は、オンボーディングロジックを再実装せずにステップをレンダリングできます。

## Signal セットアップ (signal-cli)

オンボーディングは GitHub releases から `signal-cli` をインストールできます。

- 適切なリリースアセットをダウンロードします。
- `~/.openclaw/tools/signal-cli/<version>/` 配下に保存します。
- 設定に `channels.signal.cliPath` を書き込みます。

注記:

- JVM ビルドには **Java 21** が必要です。
- 利用可能な場合はネイティブビルドが使用されます。
- Windows は WSL2 を使用します。signal-cli のインストールは WSL 内の Linux フローに従います。

## ウィザードが書き込む内容

`~/.openclaw/openclaw.json` の典型的なフィールド:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（Minimax を選択した場合）
- `tools.profile`（未設定の場合、ローカルオンボーディングはデフォルトで `"coding"` になります。既存の明示的な値は保持されます）
- `gateway.*`（mode、bind、auth、tailscale）
- `session.dmScope`（動作の詳細: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- プロンプト中にオプトインした場合のチャネル許可リスト（Slack/Discord/Matrix/Microsoft Teams）（可能な場合、名前は ID に解決されます）。
- `skills.install.nodeManager`
  - `setup --node-manager` は `npm`、`pnpm`、または `bun` を受け付けます。
  - 手動設定では、`skills.install.nodeManager` を直接設定することで引き続き `yarn` を使用できます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` は `agents.list[]` と任意の `bindings` を書き込みます。

WhatsApp 認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` 配下に置かれます。
セッションは `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。

一部のチャネルは plugins として提供されます。セットアップ中にいずれかを選択すると、設定できるようになる前に、オンボーディングがそのインストール（npm またはローカルパス）を求めます。

## 関連ドキュメント

- オンボーディング概要: [オンボーディング（CLI）](/ja-JP/start/wizard)
- macOS アプリのオンボーディング: [オンボーディング](/ja-JP/start/onboarding)
- 設定リファレンス: [Gateway 設定](/ja-JP/gateway/configuration)
- プロバイダー: [WhatsApp](/ja-JP/channels/whatsapp), [Telegram](/ja-JP/channels/telegram), [Discord](/ja-JP/channels/discord), [Google Chat](/ja-JP/channels/googlechat), [Signal](/ja-JP/channels/signal), [iMessage](/ja-JP/channels/imessage)
- Skills: [Skills](/ja-JP/tools/skills), [Skills 設定](/ja-JP/tools/skills-config)
