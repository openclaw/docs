---
read_when:
    - doctor マイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: 'doctorコマンド: ヘルスチェック、設定の移行、修復手順'
title: 診断
x-i18n:
    generated_at: "2026-05-11T20:30:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4994177bb3a3751211437403becc1c68c7f07fa52a72b84c9d129c7922705522
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` は OpenClaw の修復 + 移行ツールです。古い設定や状態を修正し、健全性を確認し、実行可能な修復手順を提供します。

## クイックスタート

```bash
openclaw doctor
```

### ヘッドレスモードと自動化モード

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    プロンプトなしでデフォルトを受け入れます（該当する場合は再起動、サービス、サンドボックスの修復手順も含む）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    プロンプトなしで推奨修復を適用します（安全な場合は修復 + 再起動）。

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

    プロンプトなしで実行し、安全な移行のみを適用します（設定の正規化 + ディスク上の状態移動）。人間の確認が必要な再起動、サービス、サンドボックス操作はスキップします。レガシー状態の移行は、検出されると自動的に実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の Gateway インストールを探すためにシステムサービスをスキャンします（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

書き込む前に変更を確認したい場合は、まず設定ファイルを開きます。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="健全性、UI、更新">
    - git インストール向けの任意の事前更新（対話時のみ）。
    - UI プロトコル鮮度チェック（プロトコルスキーマのほうが新しい場合に Control UI を再ビルド）。
    - 健全性チェック + 再起動プロンプト。
    - Skills ステータス概要（対象/不足/ブロック）と Plugin ステータス。

  </Accordion>
  <Accordion title="設定と移行">
    - レガシー値の設定正規化。
    - レガシーのフラットな `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk 設定移行。
    - レガシー Chrome 拡張機能設定と Chrome MCP 準備状況のブラウザー移行チェック。
    - OpenCode プロバイダー上書き警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth シャドーイング警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth プロファイル向け OAuth TLS 前提条件チェック。
    - `plugins.allow` が制限的だがツールポリシーがまだワイルドカードまたは Plugin 所有ツールを要求している場合の Plugin/ツール許可リスト警告。
    - レガシーのディスク上状態移行（sessions/agent dir/WhatsApp auth）。
    - レガシー Plugin manifest contract キー移行（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - レガシー cron ストア移行（`jobId`、`schedule.cron`、トップレベルの delivery/payload フィールド、payload `provider`、単純な `notify: true` webhook フォールバックジョブ）。
    - レガシーの agent 全体 runtime-policy クリーンアップ。プロバイダー/モデル runtime policy が有効なルートセレクターです。
    - Plugin が有効な場合の古い Plugin 設定クリーンアップ。`plugins.enabled=false` の場合、古い Plugin 参照は不活性な封じ込め設定として扱われ、保持されます。

  </Accordion>
  <Accordion title="状態と整合性">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受ける 2026.4.24 ビルドで作成された重複 prompt-rewrite ブランチのセッショントランスクリプト修復。
    - 詰まった subagent restart-recovery tombstone 検出。古い中断済みリカバリーフラグを消去し、起動時にその子を restart-aborted と扱い続けないようにする `--fix` サポート付き。
    - 状態の整合性と権限チェック（sessions、transcripts、state dir）。
    - ローカル実行時の設定ファイル権限チェック（chmod 600）。
    - モデル認証の健全性: OAuth 有効期限を確認し、期限切れが近いトークンを更新でき、auth-profile のクールダウン/無効状態を報告します。
    - 追加 workspace dir 検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、サービス、supervisor">
    - サンドボックスが有効な場合のサンドボックスイメージ修復。
    - レガシーサービス移行と追加 Gateway 検出。
    - Matrix チャンネルのレガシー状態移行（`--fix` / `--repair` モード）。
    - Gateway ランタイムチェック（サービスはインストール済みだが実行中でない、キャッシュされた launchd ラベル）。
    - チャンネルステータス警告（実行中の Gateway からプローブ）。
    - チャンネル固有の権限チェックは `openclaw channels capabilities` の下にあります。たとえば、Discord 音声チャンネル権限は `openclaw channels capabilities --channel discord --target channel:<channel-id>` で監査されます。
    - local TUI クライアントがまだ実行中である状態で Gateway イベントループの健全性が低下している場合の WhatsApp 応答性チェック。`--fix` は検証済みの local TUI クライアントのみを停止します。
    - 主要モデル、fallback、heartbeat/subagent/compaction 上書き、hooks、チャンネルモデル上書き、セッションルート pin 内のレガシー `openai-codex/*` モデル参照に対する Codex ルート修復。`--fix` はそれらを `openai/*` に書き換え、古いセッション/agent 全体 runtime pin を削除し、正規の OpenAI agent 参照はデフォルト Codex harness 上に残します。
    - 任意修復付きの supervisor 設定監査（launchd/systemd/schtasks）。
    - インストールまたは更新時にシェルの `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取り込んだ Gateway サービス向けの組み込みプロキシ環境クリーンアップ。
    - Gateway ランタイムのベストプラクティスチェック（Node と Bun、バージョンマネージャーパス）。
    - Gateway ポート衝突診断（デフォルト `18789`）。

  </Accordion>
  <Accordion title="認証、セキュリティ、ペアリング">
    - オープン DM ポリシーに対するセキュリティ警告。
    - local token モード向け Gateway 認証チェック（トークンソースがない場合にトークン生成を提案。token SecretRef 設定は上書きしません）。
    - デバイスペアリング問題検出（保留中の初回 pair 要求、保留中の role/scope アップグレード、古いローカル device-token キャッシュのずれ、paired-record auth のずれ）。

  </Accordion>
  <Accordion title="ワークスペースとシェル">
    - Linux での systemd linger チェック。
    - ワークスペース bootstrap ファイルサイズチェック（コンテキストファイルの切り詰め/上限付近警告）。
    - デフォルト agent 向け Skills 準備状況チェック。不足している bin、env、config、または OS 要件がある許可済み Skills を報告し、`--fix` は `skills.entries` 内で利用不可の Skills を無効化できます。
    - シェル補完ステータスチェックと自動インストール/アップグレード。
    - メモリ検索 embedding プロバイダー準備状況チェック（ローカルモデル、リモート API キー、または QMD バイナリ）。
    - ソースインストールチェック（pnpm workspace 不一致、不足している UI アセット、不足している tsx バイナリ）。
    - 更新された設定 + ウィザードメタデータを書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI バックフィルとリセット

Control UI の Dreams シーンには、grounded dreaming ワークフロー向けの **Backfill**、**Reset**、**Clear Grounded** アクションが含まれています。これらのアクションは gateway doctor 形式の RPC メソッドを使用しますが、`openclaw doctor` CLI の修復/移行の一部では**ありません**。

実行内容:

- **Backfill** はアクティブなワークスペース内の過去の `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM diary パスを実行し、可逆的なバックフィルエントリを `DREAMS.md` に書き込みます。
- **Reset** は `DREAMS.md` から、それらのマーク付きバックフィル diary エントリのみを削除します。
- **Clear Grounded** は、過去の replay から来た、まだ live recall や daily support を蓄積していないステージ済みの grounded-only short-term エントリのみを削除します。

単独では実行しないこと:

- `MEMORY.md` は編集しません
- 完全な doctor 移行は実行しません
- ステージ済み CLI パスを明示的に先に実行しない限り、grounded candidate を live short-term promotion store に自動的にステージしません

grounded historical replay を通常の deep promotion lane に影響させたい場合は、代わりに CLI フローを使用します。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` をレビュー面として維持しながら、grounded durable candidate が short-term dreaming store にステージされます。

## 詳細な動作と根拠

<AccordionGroup>
  <Accordion title="0. 任意更新（git インストール）">
    これが git checkout で、doctor が対話的に実行されている場合、doctor 実行前に更新（fetch/rebase/build）を提案します。
  </Accordion>
  <Accordion title="1. 設定の正規化">
    設定にレガシー値の形（たとえばチャンネル固有の上書きなしの `messages.ackReaction`）が含まれている場合、doctor はそれらを現在のスキーマに正規化します。

    これにはレガシー Talk フラットフィールドが含まれます。現在の公開 Talk speech 設定は `talk.provider` + `talk.providers.<provider>` で、realtime voice 設定は `talk.realtime.*` です。Doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` の形をプロバイダーマップに書き換え、レガシーのトップレベル realtime selector（`talk.mode`、`talk.transport`、`talk.brain`、`talk.model`、`talk.voice`）を `talk.realtime` に書き換えます。

    Doctor はまた、`plugins.allow` が空でなく、ツールポリシーが
    ワイルドカードまたは Plugin 所有ツールエントリを使用している場合に警告します。`tools.allow: ["*"]` は実際に読み込まれた Plugin
    のツールだけに一致します。排他的な Plugin
    許可リストを迂回するものではありません。Doctor は移行された
    レガシー許可リスト設定に `plugins.bundledDiscovery: "compat"` を書き込み、既存の bundled provider 動作を維持し、
    その後、より厳格な `"allowlist"` 設定を示します。

  </Accordion>
  <Accordion title="2. レガシー設定キーの移行">
    設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` の実行を求めます。

    Doctor は次を実行します。

    - 見つかったレガシーキーを説明します。
    - 適用した移行を表示します。
    - 更新されたスキーマで `~/.openclaw/openclaw.json` を書き換えます。

    Gateway 起動はレガシー設定形式を拒否し、`openclaw doctor --fix` の実行を求めます。起動時に `openclaw.json` を書き換えることはありません。Cron ジョブストア移行も `openclaw doctor --fix` によって処理されます。

    現在の移行:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 表示可能な返信ポリシーが欠落している設定済みチャンネル設定 → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → トップレベルの `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - レガシーの `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - レガシーのトップレベルのリアルタイム Talk セレクター（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`）+ `talk.provider`/`talk.providers` → `talk.realtime`
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
    - 名前付き `accounts` があるものの、単一アカウント用のトップレベルチャンネル値が残っているチャンネルでは、そのアカウントスコープの値を、そのチャンネル用に選ばれた昇格済みアカウントへ移動します（ほとんどのチャンネルでは `accounts.default`。Matrix は既存の一致する名前付き/デフォルトターゲットを保持できます）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` を削除します。低速なプロバイダー/モデルのタイムアウトには `models.providers.<id>.timeoutSeconds` を使用してください
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` を削除します（レガシー拡張機能リレー設定）
    - レガシーの `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 起動時も、`api` が将来の enum 値または不明な enum 値に設定されているプロバイダーは、閉じて失敗するのではなくスキップします）
    - `plugins.entries.codex.config.codexDynamicToolsProfile` を削除します。Codex アプリサーバーは常に Codex ネイティブのワークスペースツールをネイティブのまま維持します

    Doctorの警告には、マルチアカウントチャンネル向けのアカウントデフォルトのガイダンスも含まれます。

    - 2つ以上の `channels.<channel>.accounts` エントリが `channels.<channel>.defaultAccount` または `accounts.default` なしで設定されている場合、フォールバックルーティングが予期しないアカウントを選択する可能性があることを doctor が警告します。
    - `channels.<channel>.defaultAccount` が不明なアカウント ID に設定されている場合、doctor が警告し、設定済みのアカウント ID を一覧表示します。

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、それは `@earendil-works/pi-ai` からの組み込み OpenCode カタログを上書きします。その結果、モデルが誤った API に強制されたり、コストがゼロになったりする可能性があります。doctor は警告を出すため、その上書きを削除して、モデルごとの API ルーティングとコストを復元できます。
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    ブラウザー設定が削除済みの Chrome 拡張機能パスをまだ指している場合、doctor はそれを現在のホストローカルな Chrome MCP アタッチモデルへ正規化します。

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になります
    - `browser.relayBindHost` は削除されます

    `defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使用している場合、doctor はホストローカルな Chrome MCP パスも監査します。

    - デフォルトの自動接続プロファイルについて、同じホストに Google Chrome がインストールされているか確認します
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合は警告します
    - ブラウザーの inspect ページでリモートデバッグを有効にするよう通知します（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

    doctor は Chrome 側の設定を代わりに有効化することはできません。ホストローカルな Chrome MCP には引き続き次が必要です。

    - Gateway/Node ホスト上の Chromium ベースブラウザー 144+
    - ローカルで実行中のブラウザー
    - そのブラウザーで有効化されたリモートデバッグ
    - ブラウザー内の初回アタッチ同意プロンプトの承認

    ここでの準備状況は、ローカルアタッチの前提条件のみを対象にしています。Existing-session は現在の Chrome MCP ルート制限を維持します。`responsebody`、PDF エクスポート、ダウンロードのインターセプト、バッチアクションのような高度なルートには、引き続きマネージドブラウザーまたは生の CDP プロファイルが必要です。

    このチェックは Docker、sandbox、remote-browser、またはその他の headless フローには**適用されません**。それらは引き続き生の CDP を使用します。

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    OpenAI Codex OAuth プロファイルが設定されている場合、doctor は OpenAI 認可エンドポイントをプローブして、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できることを確認します。プローブが証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、自己署名証明書）で失敗した場合、doctor はプラットフォーム固有の修正ガイダンスを出力します。Homebrew Node を使う macOS では、通常の修正は `brew postinstall ca-certificates` です。`--deep` では、Gateway が正常でもプローブが実行されます。
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    以前に `models.providers.openai-codex` の下へレガシー OpenAI トランスポート設定を追加していた場合、それらは新しいリリースが自動的に使用する組み込み Codex OAuth プロバイダーパスを覆い隠す可能性があります。古いトランスポート設定が Codex OAuth と並んで見つかった場合、doctor は警告します。これにより、古いトランスポート上書きを削除または書き直して、組み込みのルーティング/フォールバック動作を取り戻せます。カスタムプロキシとヘッダーのみの上書きは引き続きサポートされ、この警告は発生しません。
  </Accordion>
  <Accordion title="2f. Codex route repair">
    doctor はレガシーの `openai-codex/*` モデル参照を確認します。ネイティブ Codex ハーネスルーティングは正規の `openai/*` モデル参照を使用します。OpenAI エージェントターンは OpenClaw PI OpenAI パスではなく、Codex アプリサーバーハーネスを経由します。

    `--fix` / `--repair` モードでは、doctor は影響を受けるデフォルトエージェントとエージェントごとの参照を書き換えます。これには、プライマリモデル、フォールバック、Heartbeat/subagent/compaction の上書き、フック、チャンネルモデルの上書き、古い永続化済みセッションルート状態が含まれます。

    - `openai-codex/gpt-*` は `openai/gpt-*` になります。
    - Codex 意図は、修復されたエージェントモデル参照に対するプロバイダー/モデルスコープの `agentRuntime.id: "codex"` エントリへ移動します。これにより、モデル参照が `openai/*` になった後も `openai-codex:...` 認証プロファイルを選択できます。
    - ランタイム選択はプロバイダー/モデルスコープのため、古いエージェント全体のランタイム設定と永続化済みセッションのランタイムピンは削除されます。
    - 修復されたレガシーモデル参照が古い認証パスを維持するために Codex ルーティングを必要としない限り、既存のプロバイダー/モデルのランタイムポリシーは保持されます。
    - 既存のモデルフォールバックリストは、レガシーエントリを書き換えたうえで保持されます。コピーされたモデルごとの設定は、レガシーキーから正規の `openai/*` キーへ移動します。
    - 永続化済みセッションの `modelProvider`/`providerOverride`、`model`/`modelOverride`、フォールバック通知、認証プロファイルピンは、検出されたすべてのエージェントセッションストアにわたって修復されます。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」という意味です。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使用する」という意味です。

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    doctor は、設定済みモデルまたはランタイムを Codex のような Plugin 所有ルートから移動した後に残った、古い自動作成ルート状態について、検出されたエージェントセッションストアもスキャンします。

    `openclaw doctor --fix` は、所有ルートが設定されなくなった場合に、`modelOverrideSource: "auto"` モデルピン、ランタイムモデルメタデータ、ピン留めされたハーネス ID、CLI セッションバインディング、自動認証プロファイル上書きなど、自動作成された古い状態をクリアできます。明示的なユーザーまたはレガシーセッションのモデル選択は手動確認用に報告され、そのまま残されます。そのルートが不要になった場合は、`/model ...`、`/new`、またはセッションのリセットで切り替えてください。

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    doctor は古いオンディスクレイアウトを現在の構造へ移行できます。

    - セッションストア + トランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）:
      - レガシーの `~/.openclaw/credentials/*.json` から（`oauth.json` を除く）
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートかつ冪等です。バックアップとしてレガシーフォルダーを残す場合、doctor は警告を出します。Gateway/CLI も起動時にレガシーセッション + エージェントディレクトリを自動移行するため、履歴/認証/モデルは手動の doctor 実行なしでエージェントごとのパスに配置されます。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talk プロバイダー/プロバイダーマップの正規化は構造的等価性で比較するようになったため、キー順序だけの差分で繰り返しの no-op `doctor --fix` 変更が発生しなくなりました。

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    doctor はインストール済みのすべての Plugin マニフェストをスキャンし、非推奨のトップレベル機能キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）を探します。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをインプレースで書き換えることを提案します。この移行は冪等です。`contracts` キーに同じ値がすでにある場合、データを重複させずにレガシーキーが削除されます。
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    doctor は cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、上書き時は `cron.store`）も確認し、スケジューラーが互換性のためにまだ受け付ける古いジョブ形状を探します。

    現在の cron クリーンアップには次が含まれます。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 最上位のペイロードフィールド (`message`, `model`, `thinking`, ...) → `payload`
    - 最上位の配信フィールド (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - ペイロードの `provider` 配信エイリアス → 明示的な `delivery.channel`
    - 単純なレガシー `notify: true` Webhook フォールバックジョブ → `delivery.to=cron.webhook` を伴う明示的な `delivery.mode="webhook"`

    Doctor は、動作を変えずに実行できる場合にのみ `notify: true` ジョブを自動移行します。ジョブがレガシー通知フォールバックと既存の非 Webhook 配信モードを組み合わせている場合、doctor は警告し、そのジョブを手動レビュー用に残します。

    Linux では、ユーザーの crontab がまだレガシー `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出している場合にも doctor が警告します。このホストローカルスクリプトは現在の OpenClaw ではメンテナンスされておらず、cron が systemd ユーザーバスに到達できない場合に、誤った `Gateway inactive` メッセージを `~/.openclaw/logs/whatsapp-health.log` に書き込むことがあります。古い crontab エントリは `crontab -e` で削除してください。現在のヘルスチェックには `openclaw channels status --probe`、`openclaw doctor`、`openclaw gateway status` を使用します。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    Doctor は、すべてのエージェントセッションディレクトリで古い書き込みロックファイル、つまりセッションが異常終了したときに残されたファイルをスキャンします。見つかった各ロックファイルについて、パス、PID、その PID がまだ生存しているか、ロックの経過時間、古いと見なされるかどうか（停止した PID、30 分超、または OpenClaw 以外のプロセスに属すると証明できる生存 PID）を報告します。`--fix` / `--repair` モードでは、古いロックファイルを自動的に削除します。それ以外の場合は注記を出力し、`--fix` を付けて再実行するよう指示します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    Doctor は、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状を、エージェントセッション JSONL ファイルでスキャンします。これは、OpenClaw 内部ランタイムコンテキストを含む放棄されたユーザーターンと、同じ可視ユーザープロンプトを含むアクティブな兄弟ブランチです。`--fix` / `--repair` モードでは、doctor は影響を受ける各ファイルを元ファイルの隣にバックアップし、Gateway 履歴とメモリリーダーが重複ターンを見なくなるよう、トランスクリプトをアクティブブランチに書き換えます。
  </Accordion>
  <Accordion title="4. 状態整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の中枢です。消えると、セッション、認証情報、ログ、設定を失います（他の場所にバックアップがない限り）。

    Doctor は次をチェックします。

    - **状態ディレクトリの欠落**: 壊滅的な状態喪失について警告し、ディレクトリの再作成を促し、欠落したデータは復旧できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能性を検証します。権限修復を提案し、所有者/グループの不一致が検出された場合は `chown` ヒントを出します。
    - **macOS のクラウド同期状態ディレクトリ**: 状態が iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) または `~/Library/CloudStorage/...` 配下に解決される場合、同期ベースのパスにより I/O が遅くなり、ロック/同期競合が発生する可能性があるため警告します。
    - **Linux の SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合、SD または eMMC ベースのランダム I/O は、セッションや認証情報の書き込み時に遅く、摩耗が早くなる可能性があるため警告します。
    - **セッションディレクトリの欠落**: 履歴を永続化し、`ENOENT` クラッシュを避けるには、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプト不一致**: 最近のセッションエントリにトランスクリプトファイルが欠落している場合に警告します。
    - **メインセッションの「1 行 JSONL」**: メイントランスクリプトが 1 行しかない場合にフラグを立てます（履歴が蓄積されていません）。
    - **複数の状態ディレクトリ**: 複数の `~/.openclaw` フォルダがホームディレクトリ間に存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分割される可能性があります）。
    - **リモートモードのリマインダー**: `gateway.mode=remote` の場合、doctor はリモートホスト上で実行するよう通知します（状態はそこにあります）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全員から読み取り可能な場合に警告し、`600` への制限を提案します。

  </Accordion>
  <Accordion title="5. モデル認証のヘルス（OAuth 期限切れ）">
    Doctor は認証ストア内の OAuth プロファイルを検査し、トークンが期限切れ間近または期限切れの場合に警告し、安全な場合は更新できます。Anthropic OAuth/トークンプロファイルが古い場合は、Anthropic API キーまたは Anthropic セットアップトークンのパスを提案します。更新プロンプトは対話的に実行している場合（TTY）にのみ表示されます。`--non-interactive` では更新試行をスキップします。

    OAuth 更新が恒久的に失敗した場合（たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求めた場合）、doctor は再認証が必要であることを報告し、実行する正確な `openclaw models auth login --provider ...` コマンドを出力します。

    Doctor は、次の理由で一時的に使用できない認証プロファイルも報告します。

    - 短いクールダウン（レート制限/タイムアウト/認証失敗）
    - 長い無効化（請求/クレジット失敗）

  </Accordion>
  <Accordion title="6. フックモデル検証">
    `hooks.gmail.model` が設定されている場合、doctor はカタログと許可リストに対してモデル参照を検証し、解決できない場合や許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージ修復">
    サンドボックスが有効な場合、doctor は Docker イメージをチェックし、現在のイメージが欠落している場合はビルドまたはレガシー名への切り替えを提案します。
  </Accordion>
  <Accordion title="7b. Plugin インストールのクリーンアップ">
    Doctor は、`openclaw doctor --fix` / `openclaw doctor --repair` モードで、レガシーな OpenClaw 生成の Plugin 依存関係ステージング状態を削除します。これには、古い生成済み依存関係ルート、古いインストールステージディレクトリ、以前の同梱 Plugin 依存関係修復コードによるパッケージローカルの残骸、現在の同梱マニフェストを隠してしまう可能性がある、孤立または復旧された管理対象 npm コピーの同梱 `@openclaw/*` plugins が含まれます。

    設定がダウンロード可能な plugins を参照しているが、ローカル Plugin レジストリで見つからない場合、doctor は欠落した plugins を再インストールすることもできます。例として、実体のある `plugins.entries`、設定済みのチャネル/プロバイダー/検索設定、設定済みのエージェントランタイムがあります。パッケージ更新中は、コアパッケージの差し替え中に doctor がパッケージマネージャーによる Plugin 修復を実行しないようにします。設定済み Plugin の復旧がまだ必要な場合は、更新後に `openclaw doctor --fix` を再実行してください。Gateway 起動と設定リロードではパッケージマネージャーを実行しません。Plugin のインストールは明示的な doctor/install/update 作業のままです。

  </Accordion>
  <Accordion title="8. Gateway サービスの移行とクリーンアップヒント">
    Doctor はレガシー Gateway サービス（launchd/systemd/schtasks）を検出し、それらを削除して現在の Gateway ポートを使う OpenClaw サービスをインストールすることを提案します。追加の Gateway 風サービスをスキャンしてクリーンアップヒントを出力することもできます。プロファイル名付きの OpenClaw Gateway サービスは第一級のものと見なされ、「extra」としてフラグ付けされません。

    Linux では、ユーザーレベルの Gateway サービスが欠落している一方で、システムレベルの OpenClaw Gateway サービスが存在する場合、doctor は 2 つ目のユーザーレベルサービスを自動的にはインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で確認し、重複を削除するか、システムスーパーバイザーが Gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. 起動時の Matrix 移行">
    Matrix チャネルアカウントに保留中または対応可能なレガシー状態移行がある場合、doctor は（`--fix` / `--repair` モードで）移行前スナップショットを作成し、その後ベストエフォートの移行ステップ、つまりレガシー Matrix 状態移行とレガシー暗号化状態準備を実行します。どちらのステップも致命的ではありません。エラーはログに記録され、起動は続行されます。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証ドリフト">
    Doctor は通常のヘルスパスの一部として、デバイスペアリング状態を検査するようになりました。

    報告内容:

    - 保留中の初回ペアリング要求
    - すでにペアリング済みのデバイスに対する保留中のロールアップグレード
    - すでにペアリング済みのデバイスに対する保留中のスコープアップグレード
    - デバイス ID はまだ一致しているが、デバイス ID 情報が承認済みレコードと一致しなくなった公開鍵不一致の修復
    - 承認済みロールのアクティブトークンが欠落しているペアリング済みレコード
    - スコープが承認済みペアリングベースラインから逸脱しているペアリング済みトークン
    - Gateway 側のトークンローテーションより古い、または古いスコープメタデータを持つ、現在のマシンのローカルキャッシュ済みデバイストークンエントリ

    Doctor はペアリング要求を自動承認せず、デバイストークンも自動ローテーションしません。代わりに、正確な次の手順を出力します。

    - `openclaw devices list` で保留中の要求を確認する
    - `openclaw devices approve <requestId>` で正確な要求を承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除して再承認する

    これにより、「すでにペアリング済みなのに、まだペアリングが必要と言われる」という一般的な穴が塞がります。doctor は初回ペアリング、保留中のロール/スコープアップグレード、古いトークン/デバイス ID 情報のドリフトを区別するようになりました。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    Doctor は、プロバイダーが許可リストなしで DM に開かれている場合、またはポリシーが危険な方法で設定されている場合に警告を出します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemd ユーザーサービスとして実行している場合、doctor はログアウト後も Gateway が動作し続けるよう lingering が有効であることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペース状態（Skills、plugins、レガシーディレクトリ）">
    Doctor はデフォルトエージェントのワークスペース状態の概要を出力します。

    - **Skills の状態**: 対象、要件欠落、許可リストでブロックされた Skills の数を数えます。
    - **レガシーワークスペースディレクトリ**: `~/openclaw` またはその他のレガシーワークスペースディレクトリが現在のワークスペースと並存している場合に警告します。
    - **Plugin の状態**: 有効/無効/エラーの plugins を数えます。エラーがある場合は Plugin ID を一覧表示し、バンドル Plugin の機能を報告します。
    - **Plugin 互換性警告**: 現在のランタイムとの互換性問題がある plugins にフラグを立てます。
    - **Plugin 診断**: Plugin レジストリが発したロード時の警告またはエラーを表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    Doctor は、ワークスペースのブートストラップファイル（たとえば `AGENTS.md`、`CLAUDE.md`、その他の注入コンテキストファイル）が、設定された文字数バジェットに近い、または超えているかをチェックします。ファイルごとの raw と注入後の文字数、切り詰め率、切り詰め原因（`max/file` または `max/total`）、合計バジェットに対する注入文字数の割合を報告します。ファイルが切り詰められている、または上限に近い場合、doctor は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` を調整するためのヒントを出力します。
  </Accordion>
  <Accordion title="11d. 古いチャネル Plugin のクリーンアップ">
    `openclaw doctor --fix` が欠落したチャネル Plugin を削除するとき、その Plugin を参照していたぶら下がったチャネルスコープ設定も削除します。`channels.<id>` エントリ、チャネル名を指定した Heartbeat ターゲット、`agents.*.models["<channel>/*"]` オーバーライドです。これにより、チャネルランタイムが消えているのに設定が Gateway にバインドを求め続ける Gateway ブートループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    Doctor は、現在のシェル（zsh、bash、fish、PowerShell）にタブ補完がインストールされているかをチェックします。

    - シェルプロファイルが遅い動的補完パターン（`source <(openclaw completion ...)`）を使用している場合、doctor はそれをより高速なキャッシュファイル方式にアップグレードします。
    - 補完がプロファイルで設定されているがキャッシュファイルが欠落している場合、doctor はキャッシュを自動的に再生成します。
    - 補完がまったく設定されていない場合、doctor はインストールを促します（対話モードのみ。`--non-interactive` ではスキップ）。

    キャッシュを手動で再生成するには、`openclaw completion --write-state` を実行します。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック（ローカルトークン）">
    Doctor はローカル Gateway トークン認証の準備状況をチェックします。

    - トークンモードでトークンが必要で、トークンソースが存在しない場合、doctor はトークンの生成を提案します。
    - `gateway.auth.token` が SecretRef 管理だが利用できない場合、doctor は警告し、それをプレーンテキストで上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、ランタイムのフェイルファスト動作を弱めずに、設定済み認証情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象を絞った設定修復のために、status 系コマンドと同じ読み取り専用 SecretRef サマリーモデルを使用するようになりました。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` `@username` 修復は、利用可能な場合に設定済みボット認証情報の使用を試みます。
    - Telegram ボットトークンが SecretRef 経由で設定されているが、現在のコマンドパスで利用できない場合、doctor はその認証情報が設定済みだが利用不可であることを報告し、クラッシュしたりトークンが欠落していると誤報告したりする代わりに、自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway ヘルスチェック + 再起動">
    Doctor はヘルスチェックを実行し、Gateway が異常に見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状況">
    Doctor は、設定済みのメモリ検索埋め込みプロバイダーがデフォルトエージェントで準備できているかをチェックします。動作は設定済みバックエンドとプロバイダーによって異なります。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動可能かをプローブします。そうでない場合、npm パッケージや手動バイナリパスのオプションを含む修正ガイダンスを出力します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイル、または認識済みのリモート/ダウンロード可能なモデル URL をチェックします。欠落している場合は、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー**（`openai`、`voyage` など）: API キーが環境または認証ストアに存在することを確認します。欠落している場合は、実行可能な修正ヒントを出力します。
    - **自動プロバイダー**: まずローカルモデルの可用性をチェックし、その後、自動選択順に各リモートプロバイダーを試します。

    キャッシュされた Gateway プローブ結果が利用可能な場合（チェック時点で Gateway が正常だった場合）、doctor はその結果を CLI から見える設定と照合し、不一致があれば記録します。Doctor はデフォルトパスで新しい埋め込み ping を開始しません。ライブのプロバイダーチェックが必要な場合は、詳細メモリステータスコマンドを使用してください。

    ランタイムで埋め込みの準備状況を確認するには、`openclaw memory status --deep` を使用してください。

  </Accordion>
  <Accordion title="14. チャンネルステータス警告">
    Gateway が正常な場合、doctor はチャンネルステータスプローブを実行し、推奨される修正とともに警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー設定の監査 + 修復">
    Doctor は、インストール済みのスーパーバイザー設定（launchd/systemd/schtasks）に、欠落または古いデフォルト（例: systemd の network-online 依存関係や再起動遅延）がないかをチェックします。不一致を見つけると、更新を推奨し、サービスファイル/タスクを現在のデフォルトに書き換えることができます。

    注:

    - `openclaw doctor` は、スーパーバイザー設定を書き換える前に確認します。
    - `openclaw doctor --yes` はデフォルトの修復プロンプトを受け入れます。
    - `openclaw doctor --repair` は、確認なしで推奨修正を適用します。
    - `openclaw doctor --repair --force` は、カスタムスーパーバイザー設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、Gateway サービスライフサイクルについて doctor を読み取り専用にします。サービスヘルスは引き続き報告し、非サービス修復も実行しますが、外部スーパーバイザーがそのライフサイクルを所有しているため、サービスの install/start/restart/bootstrap、スーパーバイザー設定の書き換え、レガシーサービスのクリーンアップはスキップします。
    - Linux では、doctor は一致する systemd Gateway ユニットがアクティブな間、コマンド/エントリーポイントメタデータを書き換えません。また、重複サービススキャン中は、非アクティブな非レガシーの追加 Gateway 風ユニットを無視するため、付随サービスファイルがクリーンアップノイズを生むことはありません。
    - トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、doctor のサービス install/repair は SecretRef を検証しますが、解決済みのプレーンテキストトークン値をスーパーバイザーサービス環境メタデータに永続化しません。
    - Doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task インストールがインラインに埋め込んだ、管理対象 `.env`/SecretRef バックのサービス環境値を検出し、それらの値がスーパーバイザー定義ではなくランタイムソースから読み込まれるようにサービスメタデータを書き換えます。
    - Doctor は、`gateway.port` の変更後もサービスコマンドが古い `--port` を固定している場合を検出し、サービスメタデータを現在のポートに書き換えます。
    - トークン認証でトークンが必要で、設定済みトークン SecretRef が未解決の場合、doctor は実行可能なガイダンスとともに install/repair パスをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定されており、`gateway.auth.mode` が未設定の場合、doctor はモードが明示的に設定されるまで install/repair をブロックします。
    - Linux ユーザー systemd ユニットでは、doctor のトークンドリフトチェックは、サービス認証メタデータを比較する際に `Environment=` と `EnvironmentFile=` の両方のソースを含むようになりました。
    - Doctor のサービス修復は、設定がより新しいバージョンによって最後に書き込まれていた場合、古い OpenClaw バイナリから Gateway サービスを書き換えたり、停止したり、再起動したりすることを拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` により、いつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway ランタイム + ポート診断">
    Doctor はサービスランタイム（PID、最後の終了ステータス）を検査し、サービスがインストールされているが実際には実行されていない場合に警告します。また、Gateway ポート（デフォルト `18789`）でのポート衝突をチェックし、考えられる原因（Gateway がすでに実行中、SSH トンネル）を報告します。
  </Accordion>
  <Accordion title="17. Gateway ランタイムのベストプラクティス">
    Doctor は、Gateway サービスが Bun またはバージョン管理された Node パス（`nvm`、`fnm`、`volta`、`asdf` など）で実行されている場合に警告します。WhatsApp + Telegram チャンネルには Node が必要であり、サービスはシェル初期化を読み込まないため、バージョンマネージャーのパスはアップグレード後に壊れる可能性があります。Doctor は、利用可能な場合にシステム Node インストール（Homebrew/apt/choco）への移行を提案します。

    新しくインストールまたは修復された macOS LaunchAgent は、対話型シェル PATH をコピーする代わりに、正規のシステム PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`）を使用します。そのため、Homebrew 管理のシステムバイナリは引き続き利用可能であり、Volta、asdf、fnm、pnpm、その他のバージョンマネージャーディレクトリが、どの Node 子プロセスが解決されるかを変更することはありません。Linux サービスでは、明示的な環境ルート（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）と安定したユーザー bin ディレクトリを引き続き保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、それらのディレクトリがディスク上に存在する場合にのみサービス PATH に書き込まれます。

  </Accordion>
  <Accordion title="18. 設定書き込み + ウィザードメタデータ">
    Doctor は設定変更を永続化し、doctor 実行を記録するためにウィザードメタデータを刻印します。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント（バックアップ + メモリシステム）">
    Doctor は、ワークスペースメモリシステムが欠落している場合に提案し、ワークスペースがまだ git 管理下にない場合はバックアップのヒントを出力します。

    ワークスペース構造と git バックアップ（非公開の GitHub または GitLab を推奨）の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
