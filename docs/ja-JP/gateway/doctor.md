---
read_when:
    - doctor マイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: 'Doctor コマンド: ヘルスチェック、設定移行、修復手順'
title: 診断
x-i18n:
    generated_at: "2026-04-30T05:12:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: c27b8e85eb0a577e676f0e6e205262775ff37303453e64fc1bc2adaf8b51147c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` は OpenClaw の修復 + 移行ツールです。古い設定/状態を修正し、健全性を確認し、実行可能な修復手順を提示します。

## クイックスタート

```bash
openclaw doctor
```

### ヘッドレスと自動化モード

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    プロンプトを表示せずにデフォルトを受け入れます（該当する場合は再起動/サービス/サンドボックスの修復手順を含む）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    プロンプトを表示せずに推奨される修復を適用します（安全な場合は修復 + 再起動）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    積極的な修復も適用します（カスタム supervisor 設定を上書きします）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    プロンプトなしで実行し、安全な移行のみを適用します（設定の正規化 + ディスク上の状態移動）。人の確認が必要な再起動/サービス/サンドボックスの操作はスキップします。レガシー状態の移行は、検出されると自動的に実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の gateway インストール（launchd/systemd/schtasks）をシステムサービスからスキャンします。

  </Tab>
</Tabs>

書き込み前に変更を確認したい場合は、先に設定ファイルを開きます。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="健全性、UI、更新">
    - git インストール向けの任意の事前更新（対話時のみ）。
    - UI プロトコルの鮮度チェック（プロトコルスキーマの方が新しい場合に Control UI を再ビルド）。
    - 健全性チェック + 再起動プロンプト。
    - Skills のステータス概要（対象/不足/ブロック）と plugin ステータス。

  </Accordion>
  <Accordion title="設定と移行">
    - レガシー値の設定正規化。
    - レガシーなフラット `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk 設定移行。
    - レガシー Chrome 拡張機能設定と Chrome MCP 準備状況に関するブラウザー移行チェック。
    - OpenCode プロバイダー上書き警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth シャドーイング警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth プロファイル向け OAuth TLS 前提条件チェック。
    - レガシーなディスク上の状態移行（セッション/エージェントディレクトリ/WhatsApp 認証）。
    - レガシー plugin マニフェスト契約キー移行（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - レガシー cron ストア移行（`jobId`、`schedule.cron`、トップレベルの配信/ペイロードフィールド、ペイロード `provider`、単純な `notify: true` webhook フォールバックジョブ）。
    - レガシーなエージェント実行時ポリシーの `agents.defaults.agentRuntime` と `agents.list[].agentRuntime` への移行。
    - plugin が有効な場合の古い plugin 設定のクリーンアップ。`plugins.enabled=false` の場合、古い plugin 参照は不活性な封じ込め設定として扱われ、保持されます。

  </Accordion>
  <Accordion title="状態と整合性">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受けた 2026.4.24 ビルドによって作成された重複プロンプト書き換えブランチのセッショントランスクリプト修復。
    - 状態の整合性と権限チェック（セッション、トランスクリプト、状態ディレクトリ）。
    - ローカル実行時の設定ファイル権限チェック（chmod 600）。
    - モデル認証の健全性: OAuth の有効期限を確認し、期限切れ間近のトークンを更新でき、認証プロファイルのクールダウン/無効状態を報告します。
    - 追加ワークスペースディレクトリの検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、サービス、supervisor">
    - サンドボックスが有効な場合のサンドボックスイメージ修復。
    - レガシーサービス移行と追加 gateway の検出。
    - Matrix チャンネルのレガシー状態移行（`--fix` / `--repair` モード）。
    - Gateway 実行時チェック（サービスはインストール済みだが実行されていない、キャッシュされた launchd ラベル）。
    - チャンネルステータス警告（実行中の gateway からプローブ）。
    - supervisor 設定監査（launchd/systemd/schtasks）と任意の修復。
    - インストールまたは更新中にシェルの `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取り込んだ gateway サービス向けの埋め込みプロキシ環境クリーンアップ。
    - Gateway 実行時のベストプラクティスチェック（Node と Bun、バージョンマネージャーパス）。
    - Gateway ポート衝突診断（デフォルト `18789`）。

  </Accordion>
  <Accordion title="認証、セキュリティ、ペアリング">
    - オープン DM ポリシーに関するセキュリティ警告。
    - ローカルトークンモードの Gateway 認証チェック（トークンソースがない場合はトークン生成を提案し、トークン SecretRef 設定は上書きしません）。
    - デバイスペアリング問題の検出（保留中の初回ペアリング要求、保留中のロール/スコープアップグレード、古いローカルデバイストークンキャッシュのずれ、ペアリング済みレコードの認証ずれ）。

  </Accordion>
  <Accordion title="ワークスペースとシェル">
    - Linux での systemd linger チェック。
    - ワークスペースのブートストラップファイルサイズチェック（コンテキストファイルの切り詰め/上限間近警告）。
    - シェル補完ステータスチェックと自動インストール/アップグレード。
    - メモリ検索埋め込みプロバイダー準備状況チェック（ローカルモデル、リモート API キー、または QMD バイナリ）。
    - ソースインストールチェック（pnpm ワークスペース不一致、不足している UI アセット、不足している tsx バイナリ）。
    - 更新済み設定 + ウィザードメタデータを書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI のバックフィルとリセット

Control UI Dreams シーンには、grounded dreaming ワークフロー向けの **バックフィル**、**リセット**、**Grounded をクリア** アクションがあります。これらのアクションは gateway の doctor 風 RPC メソッドを使用しますが、`openclaw doctor` CLI の修復/移行の一部ではありません。

実行すること:

- **バックフィル** は、アクティブなワークスペース内の履歴 `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM 日記パスを実行して、可逆なバックフィルエントリを `DREAMS.md` に書き込みます。
- **リセット** は、マークされたバックフィル日記エントリだけを `DREAMS.md` から削除します。
- **Grounded をクリア** は、履歴リプレイから来て、まだライブ recall や日次サポートを蓄積していない、ステージ済みの grounded 専用短期エントリだけを削除します。

それ自体では実行しないこと:

- `MEMORY.md` を編集しません
- 完全な doctor 移行を実行しません
- ステージ済み CLI パスを明示的に先に実行しない限り、grounded 候補をライブ短期昇格ストアに自動的にステージしません

grounded 履歴リプレイを通常の深い昇格レーンに影響させたい場合は、代わりに CLI フローを使用します。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` をレビュー面として維持しながら、grounded な永続候補を短期 dreaming ストアにステージします。

## 詳細な挙動と根拠

<AccordionGroup>
  <Accordion title="0. 任意の更新（git インストール）">
    これが git チェックアウトで、doctor が対話的に実行されている場合、doctor の実行前に更新（fetch/rebase/build）を提案します。
  </Accordion>
  <Accordion title="1. 設定の正規化">
    設定にレガシー値の形状が含まれている場合（たとえばチャンネル固有の上書きがない `messages.ackReaction`）、doctor はそれを現在のスキーマに正規化します。

    これにはレガシーな Talk フラットフィールドが含まれます。現在の公開 Talk 設定は `talk.provider` + `talk.providers.<provider>` です。Doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` の形状をプロバイダーマップに書き換えます。

  </Accordion>
  <Accordion title="2. レガシー設定キーの移行">
    設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` の実行を求めます。

    Doctor は次を行います。

    - 検出されたレガシーキーを説明します。
    - 適用した移行を表示します。
    - 更新されたスキーマで `~/.openclaw/openclaw.json` を書き換えます。

    Gateway も、起動時にレガシー設定形式を検出すると doctor 移行を自動実行するため、古い設定は手動介入なしで修復されます。Cron ジョブストアの移行は `openclaw doctor --fix` によって処理されます。

    現在の移行:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → トップレベルの `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - レガシー `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` と `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` と `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` と `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` と `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 名前付き `accounts` があるものの、単一アカウント時代のトップレベルチャンネル値が残っているチャンネルでは、それらのアカウントスコープ値を、そのチャンネルで選択された昇格済みアカウントに移動します（ほとんどのチャンネルでは `accounts.default`。Matrix は既存の一致する名前付き/デフォルトターゲットを保持できます）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` を削除します。遅いプロバイダー/モデルのタイムアウトには `models.providers.<id>.timeoutSeconds` を使用してください
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` を削除します（レガシー拡張機能リレー設定）
    - レガシー `models.providers.*.api: "openai"` → `"openai-completions"`（gateway 起動時も、`api` が将来または未知の enum 値に設定されているプロバイダーは失敗終了せずスキップします）

    Doctor の警告には、マルチアカウントチャンネル向けのアカウントデフォルトのガイダンスも含まれます。

    - 2 つ以上の `channels.<channel>.accounts` エントリが、`channels.<channel>.defaultAccount` または `accounts.default` なしで設定されている場合、doctor はフォールバックルーティングが予期しないアカウントを選ぶ可能性があると警告します。
    - `channels.<channel>.defaultAccount` が未知のアカウント ID に設定されている場合、doctor は警告し、設定済みアカウント ID を一覧表示します。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダーのオーバーライド">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、それは `@mariozechner/pi-ai` の組み込み OpenCode カタログをオーバーライドします。その結果、モデルが誤った API に強制されたり、コストがゼロになったりすることがあります。doctor は、オーバーライドを削除してモデルごとの API ルーティングとコストを復元できるよう警告します。
  </Accordion>
  <Accordion title="2c. ブラウザー移行と Chrome MCP 準備状況">
    ブラウザー設定がまだ削除済みの Chrome 拡張機能パスを指している場合、doctor はそれを現在のホストローカル Chrome MCP アタッチモデルに正規化します。

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になります
    - `browser.relayBindHost` は削除されます

    `defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使用している場合、doctor はホストローカル Chrome MCP パスも監査します。

    - デフォルトの自動接続プロファイルについて、同じホストに Google Chrome がインストールされているかを確認します
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合は警告します
    - ブラウザーの検査ページでリモートデバッグを有効にするよう通知します（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

    doctor は Chrome 側の設定を代わりに有効化することはできません。ホストローカル Chrome MCP には引き続き次が必要です。

    - gateway/node ホスト上の Chromium ベースのブラウザー 144+
    - ローカルで実行中のブラウザー
    - そのブラウザーで有効化されたリモートデバッグ
    - ブラウザー内での最初のアタッチ同意プロンプトの承認

    ここでの準備状況は、ローカルアタッチの前提条件に関するものだけです。existing-session は現在の Chrome MCP ルート制限を維持します。`responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなどの高度なルートには、引き続き管理ブラウザーまたは raw CDP プロファイルが必要です。

    このチェックは Docker、sandbox、remote-browser、またはその他のヘッドレスフローには**適用されません**。それらは引き続き raw CDP を使用します。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前提条件">
    OpenAI Codex OAuth プロファイルが設定されている場合、doctor は OpenAI 認可エンドポイントをプローブし、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できることを確認します。プローブが証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、または自己署名証明書）で失敗した場合、doctor はプラットフォーム固有の修正ガイダンスを出力します。Homebrew Node を使用する macOS では、通常の修正は `brew postinstall ca-certificates` です。`--deep` では、Gateway が正常な場合でもプローブが実行されます。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダーのオーバーライド">
    以前に `models.providers.openai-codex` の下にレガシー OpenAI トランスポート設定を追加していた場合、それらが新しいリリースで自動的に使用される組み込み Codex OAuth プロバイダーパスを覆い隠すことがあります。doctor は、Codex OAuth と一緒にそれらの古いトランスポート設定を検出した場合に警告し、古いトランスポートオーバーライドを削除または書き換えて、組み込みのルーティング/フォールバック動作を取り戻せるようにします。カスタムプロキシとヘッダーのみのオーバーライドは引き続きサポートされ、この警告は発生しません。
  </Accordion>
  <Accordion title="2f. Codex Plugin ルート警告">
    バンドルされた Codex Plugin が有効な場合、doctor は `openai-codex/*` のプライマリモデル参照がまだデフォルトの PI ランナー経由で解決されるかどうかも確認します。この組み合わせは、PI 経由で Codex OAuth/サブスクリプション認証を使用したい場合には有効ですが、ネイティブ Codex アプリサーバーハーネスと混同しやすいものです。doctor は警告し、明示的なアプリサーバー形状を示します: `openai/*` に加えて `agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex`。

    doctor はこれを自動修復しません。どちらのルートも有効だからです。

    - `openai-codex/*` + PI は「通常の OpenClaw ランナー経由で Codex OAuth/サブスクリプション認証を使用する」ことを意味します。
    - `openai/*` + `runtime: "codex"` は「埋め込みターンをネイティブ Codex アプリサーバー経由で実行する」ことを意味します。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」ことを意味します。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使用する」ことを意味します。

    警告が表示された場合は、意図したルートを選択し、設定を手動で編集してください。PI Codex OAuth が意図したものなら、警告はそのままにしてください。

  </Accordion>
  <Accordion title="3. レガシー状態の移行（ディスクレイアウト）">
    doctor は、古いオンディスクレイアウトを現在の構造に移行できます。

    - セッションストア + トランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）:
      - レガシー `~/.openclaw/credentials/*.json` から（`oauth.json` を除く）
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートかつ冪等です。doctor は、バックアップとしてレガシーフォルダーを残す場合に警告を出します。Gateway/CLI も起動時にレガシーセッション + エージェントディレクトリを自動移行するため、手動で doctor を実行しなくても、履歴/認証/モデルはエージェントごとのパスに配置されます。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talk プロバイダー/プロバイダーマップの正規化は現在、構造的等価性で比較するため、キー順序だけの差分で `doctor --fix` の無操作変更が繰り返し発生することはなくなりました。

  </Accordion>
  <Accordion title="3a. レガシー Plugin マニフェストの移行">
    doctor は、インストール済みのすべての Plugin マニフェストをスキャンし、非推奨のトップレベル capability キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）を探します。見つかった場合、それらを `contracts` オブジェクトに移動し、マニフェストファイルをインプレースで書き換えることを提案します。この移行は冪等です。`contracts` キーにすでに同じ値がある場合、データを重複させずにレガシーキーが削除されます。
  </Accordion>
  <Accordion title="3b. レガシー Cron ストアの移行">
    doctor は、cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、オーバーライドされている場合は `cron.store`）について、スケジューラーが互換性のためにまだ受け付ける古いジョブ形状も確認します。

    現在の cron クリーンアップには次が含まれます。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルのペイロードフィールド（`message`、`model`、`thinking`、...）→ `payload`
    - トップレベルの配信フィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - ペイロードの `provider` 配信エイリアス → 明示的な `delivery.channel`
    - 単純なレガシー `notify: true` Webhook フォールバックジョブ → `delivery.to=cron.webhook` を伴う明示的な `delivery.mode="webhook"`

    doctor は、動作を変更せずに実行できる場合にのみ `notify: true` ジョブを自動移行します。ジョブがレガシー notify フォールバックと既存の非 Webhook 配信モードを組み合わせている場合、doctor は警告し、そのジョブを手動レビュー用に残します。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    doctor は、すべてのエージェントセッションディレクトリをスキャンして、古い書き込みロックファイル、つまりセッションが異常終了したときに残されたファイルを探します。見つかった各ロックファイルについて、パス、PID、その PID がまだ生存しているか、ロックの経過時間、古いと見なされるかどうか（死んだ PID または 30 分超）を報告します。`--fix` / `--repair` モードでは古いロックファイルを自動的に削除します。それ以外の場合は注記を出力し、`--fix` で再実行するよう案内します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトブランチ修復">
    doctor は、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状、つまり OpenClaw 内部ランタイムコンテキストを持つ放棄されたユーザーターンと、同じ表示ユーザープロンプトを含むアクティブな兄弟を、エージェントセッション JSONL ファイル内でスキャンします。`--fix` / `--repair` モードでは、doctor は影響を受けた各ファイルを元ファイルの隣にバックアップし、トランスクリプトをアクティブブランチに書き換えるため、gateway 履歴とメモリーリーダーが重複ターンを見なくなります。
  </Accordion>
  <Accordion title="4. 状態整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の脳幹です。これが消えると、別の場所にバックアップがない限り、セッション、認証情報、ログ、設定を失います。

    doctor は次を確認します。

    - **状態ディレクトリの欠落**: 壊滅的な状態喪失について警告し、ディレクトリの再作成を促し、欠落したデータは復元できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能性を検証します。権限の修復を提案します（所有者/グループの不一致が検出された場合は `chown` ヒントを出します）。
    - **macOS のクラウド同期状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` 配下に解決される場合、同期付きパスでは I/O が遅くなったりロック/同期競合が発生したりする可能性があるため警告します。
    - **Linux SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合、SD または eMMC ベースのランダム I/O はセッションや認証情報の書き込み下で遅くなり、摩耗が早くなる可能性があるため警告します。
    - **セッションディレクトリの欠落**: 履歴を永続化し、`ENOENT` クラッシュを避けるには、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプト不一致**: 最近のセッションエントリでトランスクリプトファイルが欠落している場合に警告します。
    - **メインセッションの「1 行 JSONL」**: メイントランスクリプトが 1 行しかない場合にフラグを立てます（履歴が蓄積されていません）。
    - **複数の状態ディレクトリ**: 複数の `~/.openclaw` フォルダーがホームディレクトリ間に存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分断される可能性があります）。
    - **リモートモード通知**: `gateway.mode=remote` の場合、doctor はリモートホストで実行するよう通知します（状態はそこにあります）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全員に読み取り可能な場合に警告し、`600` へ厳格化することを提案します。

  </Accordion>
  <Accordion title="5. モデル認証の健全性（OAuth 期限切れ）">
    doctor は認証ストア内の OAuth プロファイルを検査し、トークンが期限切れ間近/期限切れの場合に警告し、安全な場合は更新できます。Anthropic OAuth/トークンプロファイルが古い場合、Anthropic API キーまたは Anthropic setup-token パスを提案します。更新プロンプトは対話的に実行している場合（TTY）にのみ表示されます。`--non-interactive` は更新試行をスキップします。

    OAuth 更新が恒久的に失敗した場合（例: `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求める場合）、doctor は再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを出力します。

    doctor は、一時的に使用できない認証プロファイルについても報告します。理由は次のとおりです。

    - 短いクールダウン（レート制限/タイムアウト/認証失敗）
    - より長い無効化（請求/クレジット失敗）

  </Accordion>
  <Accordion title="6. フックモデル検証">
    `hooks.gmail.model` が設定されている場合、doctor はカタログと許可リストに照らしてモデル参照を検証し、解決できない場合や許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. Sandbox イメージ修復">
    サンドボックス化が有効な場合、doctor は Docker イメージを確認し、現在のイメージが欠落していればビルドまたはレガシー名への切り替えを提案します。
  </Accordion>
  <Accordion title="7b. バンドル Plugin ランタイム依存関係">
    doctor は、現在の設定でアクティブになっている、またはバンドルマニフェストのデフォルトで有効化されているバンドル Plugin についてのみ、ランタイム依存関係を検証します。たとえば、`plugins.entries.discord.enabled: true`、レガシー `channels.discord.enabled: true`、設定済みの `models.providers.*` / エージェントモデル参照、またはプロバイダー所有権のないデフォルト有効のバンドル Plugin です。不足がある場合、doctor はパッケージを報告し、`openclaw doctor --fix` / `openclaw doctor --repair` モードでインストールします。外部 Plugin は引き続き `openclaw plugins install` / `openclaw plugins update` を使用します。doctor は任意の Plugin パスの依存関係をインストールしません。

    doctor 修復中、バンドルされたランタイム依存関係の npm インストールは、TTY セッションではスピナー進行状況を、パイプまたはヘッドレス出力では定期的な行単位の進行状況を報告します。Gateway とローカル CLI は、バンドルされた Plugin をインポートする前に、必要に応じて有効なバンドル Plugin ランタイム依存関係も修復できます。これらのインストールは Plugin ランタイムインストールルートに限定され、スクリプトを無効にして実行され、パッケージロックを書き込まず、インストールルートロックで保護されるため、並行する CLI または Gateway の起動が同じ `node_modules` ツリーを同時に変更することはありません。

  </Accordion>
  <Accordion title="8. Gateway サービスの移行とクリーンアップのヒント">
    doctor はレガシー gateway サービス（launchd/systemd/schtasks）を検出し、それらを削除して現在の gateway ポートを使用する OpenClaw サービスをインストールすることを提案します。また、追加の gateway 風サービスをスキャンしてクリーンアップのヒントを出力できます。プロファイル名付きの OpenClaw gateway サービスは第一級のものと見なされ、「extra」としてフラグ付けされません。

    Linux では、ユーザーレベルの gateway サービスが存在しない一方でシステムレベルの OpenClaw gateway サービスが存在する場合、doctor は 2 つ目のユーザーレベルサービスを自動的にはインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で調査し、重複を削除するか、システムスーパーバイザーが gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. Startup Matrix 移行">
    Matrix チャネルアカウントに保留中または対応可能なレガシー状態移行がある場合、doctor は（`--fix` / `--repair` モードで）移行前スナップショットを作成してから、ベストエフォートの移行手順を実行します。レガシー Matrix 状態移行とレガシー暗号化状態の準備です。どちらの手順も致命的ではありません。エラーはログに記録され、起動は続行されます。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証ドリフト">
    doctor は通常の健全性パスの一部として、デバイスペアリング状態を検査するようになりました。

    報告内容:

    - 保留中の初回ペアリング要求
    - すでにペアリング済みのデバイスに対する保留中のロールアップグレード
    - すでにペアリング済みのデバイスに対する保留中のスコープアップグレード
    - デバイス ID はまだ一致しているが、デバイス ID が承認済みレコードと一致しなくなった公開鍵不一致の修復
    - 承認済みロールの有効なトークンがないペアリング済みレコード
    - スコープが承認済みペアリングベースラインの外へドリフトしたペアリング済みトークン
    - gateway 側のトークンローテーションより古い、または古いスコープメタデータを持つ、現在のマシンのローカルキャッシュ済みデバイストークンエントリ

    doctor はペアリング要求を自動承認したり、デバイストークンを自動ローテーションしたりしません。代わりに、正確な次の手順を出力します。

    - `openclaw devices list` で保留中の要求を調査する
    - `openclaw devices approve <requestId>` で正確な要求を承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除して再承認する

    これにより、一般的な「すでにペアリング済みなのにまだペアリングが必要になる」穴が塞がれます。doctor は初回ペアリング、保留中のロール/スコープアップグレード、古いトークン/デバイス ID ドリフトを区別するようになりました。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    provider が許可リストなしで DM に開かれている場合、またはポリシーが危険な方法で構成されている場合、doctor は警告を発します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemd ユーザーサービスとして実行している場合、doctor はログアウト後も gateway が存続するように linger が有効であることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペース状態（Skills、plugins、レガシーディレクトリ）">
    doctor はデフォルトエージェントのワークスペース状態の概要を出力します。

    - **Skills 状態**: 対象、要件不足、許可リストでブロックされた Skills の数を数えます。
    - **レガシーワークスペースディレクトリ**: 現在のワークスペースと並んで `~/openclaw` またはその他のレガシーワークスペースディレクトリが存在する場合に警告します。
    - **Plugin 状態**: 有効/無効/エラーの plugins 数を数えます。エラーがある Plugin ID を一覧表示し、バンドル Plugin の capability を報告します。
    - **Plugin 互換性警告**: 現在のランタイムとの互換性問題がある plugins にフラグを立てます。
    - **Plugin 診断**: Plugin registry から発せられた読み込み時の警告またはエラーを表示します。

  </Accordion>
  <Accordion title="11b. Bootstrap ファイルサイズ">
    doctor は、ワークスペースの bootstrap ファイル（たとえば `AGENTS.md`、`CLAUDE.md`、またはその他の注入コンテキストファイル）が、構成された文字数バジェットに近い、または超えているかを確認します。ファイルごとの raw と注入後の文字数、切り詰め率、切り詰め原因（`max/file` または `max/total`）、合計バジェットに対する合計注入文字数の割合を報告します。ファイルが切り詰められているか、上限に近い場合、doctor は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` の調整ヒントを出力します。
  </Accordion>
  <Accordion title="11d. 古いチャネル Plugin のクリーンアップ">
    `openclaw doctor --fix` が見つからないチャネル Plugin を削除すると、その Plugin を参照していた未解決のチャネルスコープ構成も削除します。`channels.<id>` エントリ、そのチャネルを指定していた Heartbeat ターゲット、`agents.*.models["<channel>/*"]` オーバーライドです。これにより、チャネルランタイムがなくなっているのに構成が gateway にそのバインドを要求し続ける Gateway 起動ループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    doctor は、現在のシェル（zsh、bash、fish、または PowerShell）にタブ補完がインストールされているかを確認します。

    - シェルプロファイルが低速な動的補完パターン（`source <(openclaw completion ...)`）を使用している場合、doctor はそれをより高速なキャッシュファイル方式にアップグレードします。
    - 補完がプロファイルに構成されているがキャッシュファイルがない場合、doctor はキャッシュを自動的に再生成します。
    - 補完がまったく構成されていない場合、doctor はインストールを促します（対話モードのみ。`--non-interactive` ではスキップ）。

    キャッシュを手動で再生成するには、`openclaw completion --write-state` を実行してください。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック（ローカルトークン）">
    doctor はローカル gateway トークン認証の準備状況を確認します。

    - トークンモードでトークンが必要で、トークンソースが存在しない場合、doctor は生成を提案します。
    - `gateway.auth.token` が SecretRef 管理だが利用できない場合、doctor は警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が構成されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. SecretRef 対応の読み取り専用修復">
    一部の修復フローでは、ランタイムの fail-fast 動作を弱めずに、構成済み認証情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象を絞った構成修復のために、status 系コマンドと同じ読み取り専用 SecretRef 要約モデルを使用するようになりました。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` の `@username` 修復は、利用可能な場合、構成済み bot 認証情報の使用を試みます。
    - Telegram bot トークンが SecretRef 経由で構成されているが現在のコマンドパスで利用できない場合、doctor は認証情報が構成済みだが利用不可であることを報告し、クラッシュしたりトークンが欠落していると誤報告したりせず、自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway 健全性チェック + 再起動">
    doctor は健全性チェックを実行し、gateway が不健全に見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状況">
    doctor は、構成されたメモリ検索 embedding provider がデフォルトエージェントで準備できているかを確認します。動作は、構成されたバックエンドと provider に依存します。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動可能かを検査します。そうでない場合、npm パッケージと手動バイナリパスの選択肢を含む修正ガイダンスを出力します。
    - **明示的なローカル provider**: ローカルモデルファイル、または認識済みのリモート/ダウンロード可能なモデル URL を確認します。欠落している場合、リモート provider への切り替えを提案します。
    - **明示的なリモート provider**（`openai`、`voyage` など）: API キーが環境または auth store に存在することを検証します。欠落している場合、対応可能な修正ヒントを出力します。
    - **自動 provider**: まずローカルモデルの可用性を確認し、その後、自動選択順で各リモート provider を試します。

    キャッシュ済み gateway probe 結果が利用可能な場合（チェック時点で gateway が健全だった場合）、doctor はその結果を CLI から見える構成と照合し、不一致があれば記録します。doctor はデフォルトパスで新しい embedding ping を開始しません。ライブ provider チェックが必要な場合は、deep メモリ状態コマンドを使用してください。

    ランタイムで embedding 準備状況を検証するには、`openclaw memory status --deep` を使用してください。

  </Accordion>
  <Accordion title="14. チャネル状態警告">
    gateway が健全な場合、doctor はチャネル状態 probe を実行し、推奨修正付きで警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー構成監査 + 修復">
    doctor は、インストール済みのスーパーバイザー構成（launchd/systemd/schtasks）に、欠落または古いデフォルト（例: systemd の network-online 依存関係と再起動遅延）がないか確認します。不一致を見つけると、更新を推奨し、サービスファイル/タスクを現在のデフォルトに書き換えることができます。

    注:

    - `openclaw doctor` はスーパーバイザー構成を書き換える前に確認します。
    - `openclaw doctor --yes` はデフォルトの修復プロンプトを受け入れます。
    - `openclaw doctor --repair` はプロンプトなしで推奨修正を適用します。
    - `openclaw doctor --repair --force` はカスタムスーパーバイザー構成を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、gateway サービスライフサイクルについて doctor を読み取り専用に保ちます。サービス健全性の報告と非サービス修復は引き続き実行しますが、外部スーパーバイザーがそのライフサイクルを所有しているため、サービスのインストール/開始/再起動/bootstrap、スーパーバイザー構成の書き換え、レガシーサービスのクリーンアップをスキップします。
    - Linux では、一致する systemd gateway unit が有効な間、doctor はコマンド/エントリポイントメタデータを書き換えません。また、重複サービススキャン中に非アクティブな非レガシーの追加 gateway 風 unit を無視するため、コンパニオンサービスファイルがクリーンアップのノイズを作りません。
    - トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、doctor のサービスインストール/修復は SecretRef を検証しますが、解決済みの平文トークン値をスーパーバイザーサービス環境メタデータに永続化しません。
    - doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task インストールがインラインに埋め込んだ、管理対象の `.env`/SecretRef-backed サービス環境値を検出し、それらの値がスーパーバイザー定義ではなくランタイムソースから読み込まれるようにサービスメタデータを書き換えます。
    - doctor は、`gateway.port` の変更後もサービスコマンドが古い `--port` を固定している場合を検出し、サービスメタデータを現在のポートに書き換えます。
    - トークン認証でトークンが必要で、構成済みトークン SecretRef が未解決の場合、doctor は対応可能なガイダンスとともにインストール/修復パスをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が構成され、`gateway.auth.mode` が未設定の場合、doctor は mode が明示的に設定されるまでインストール/修復をブロックします。
    - Linux user-systemd units では、doctor のトークンドリフトチェックはサービス認証メタデータを比較する際に `Environment=` と `EnvironmentFile=` の両方のソースを含むようになりました。
    - doctor のサービス修復は、構成が最後に新しいバージョンによって書き込まれている場合、古い OpenClaw バイナリから gateway サービスを書き換え、停止、または再起動することを拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) を参照してください。
    - `openclaw gateway install --force` を使用すれば、いつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway ランタイム + ポート診断">
    Doctor はサービスランタイム (PID、最後の終了ステータス) を検査し、サービスがインストール済みでも実際には実行されていない場合に警告します。また、Gateway ポート (デフォルト `18789`) のポート競合を確認し、考えられる原因 (Gateway がすでに実行中、SSH トンネル) を報告します。
  </Accordion>
  <Accordion title="17. Gateway ランタイムのベストプラクティス">
    Doctor は、Gateway サービスが Bun またはバージョン管理された Node パス (`nvm`、`fnm`、`volta`、`asdf` など) で実行されている場合に警告します。WhatsApp + Telegram チャネルには Node が必要であり、バージョンマネージャーのパスは、サービスがシェル初期化を読み込まないため、アップグレード後に壊れることがあります。Doctor は、利用可能な場合にシステムの Node インストール (Homebrew/apt/choco) へ移行することを提案します。

    新しくインストールまたは修復されたサービスは、明示的な環境ルート (`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`) と安定したユーザー bin ディレクトリを保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、それらのディレクトリがディスク上に存在する場合にのみサービス PATH に書き込まれます。これにより、生成された supervisor PATH は、Doctor が後で実行する同じ最小 PATH 監査と整合します。

  </Accordion>
  <Accordion title="18. 設定の書き込み + ウィザードメタデータ">
    Doctor は設定変更を永続化し、Doctor 実行を記録するためにウィザードメタデータを刻印します。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント (バックアップ + メモリシステム)">
    Doctor は、ワークスペースメモリシステムがない場合に提案し、ワークスペースがまだ git 管理下にない場合はバックアップのヒントを出力します。

    ワークスペース構造と git バックアップ (非公開の GitHub または GitLab を推奨) の完全なガイドは、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
