---
read_when:
    - doctor マイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: 'Doctor コマンド: ヘルスチェック、設定移行、修復手順'
title: 診断
x-i18n:
    generated_at: "2026-05-10T19:35:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417440c2f658be5848b305bffeb006ad435f069d93f7e73ffbeef9468b58e1b3
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` は OpenClaw の修復 + 移行ツールです。古くなった設定や状態を修正し、健全性をチェックし、実行可能な修復手順を提示します。

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

    プロンプトを表示せずに既定値を受け入れます（該当する場合は、再起動、サービス、サンドボックスの修復手順を含みます）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    プロンプトを表示せずに推奨修復を適用します（安全な場合の修復 + 再起動）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    積極的な修復も適用します（カスタムのスーパーバイザー設定を上書きします）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    プロンプトなしで実行し、安全な移行（設定の正規化 + ディスク上の状態移動）のみを適用します。人間の確認が必要な再起動、サービス、サンドボックスの操作はスキップします。レガシー状態の移行は、検出されると自動的に実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の Gateway インストール（launchd/systemd/schtasks）についてシステムサービスをスキャンします。

  </Tab>
</Tabs>

書き込む前に変更を確認したい場合は、先に設定ファイルを開きます。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="健全性、UI、更新">
    - git インストール向けの任意の事前更新（対話時のみ）。
    - UI プロトコルの鮮度チェック（プロトコルスキーマのほうが新しい場合に Control UI を再ビルド）。
    - 健全性チェック + 再起動プロンプト。
    - Skills 状態の概要（対象/不足/ブロック）と Plugin 状態。

  </Accordion>
  <Accordion title="設定と移行">
    - レガシー値の設定正規化。
    - レガシーなフラットな `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk 設定移行。
    - レガシー Chrome 拡張機能設定と Chrome MCP の準備状況に関するブラウザー移行チェック。
    - OpenCode プロバイダー上書き警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth シャドーイング警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth プロファイル向けの OAuth TLS 前提条件チェック。
    - `plugins.allow` が制限的なのに、ツールポリシーがワイルドカードまたは Plugin 所有ツールを要求している場合の Plugin/ツール許可リスト警告。
    - レガシーなディスク上の状態移行（セッション/エージェントディレクトリ/WhatsApp 認証）。
    - レガシー Plugin マニフェスト契約キーの移行（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - レガシー Cron ストア移行（`jobId`, `schedule.cron`, トップレベルの配信/ペイロードフィールド、ペイロードの `provider`, 単純な `notify: true` Webhook フォールバックジョブ）。
    - レガシーなエージェント全体のランタイムポリシーのクリーンアップ。プロバイダー/モデルのランタイムポリシーが有効なルート選択器です。
    - Plugin が有効な場合の古い Plugin 設定のクリーンアップ。`plugins.enabled=false` の場合、古い Plugin 参照は不活性な封じ込め設定として扱われ、保持されます。

  </Accordion>
  <Accordion title="状態と整合性">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受けた 2026.4.24 ビルドによって作成された重複プロンプト書き換えブランチのセッショントランスクリプト修復。
    - 詰まったサブエージェントの再起動リカバリー tombstone 検出。`--fix` により、古い中止済みリカバリーフラグをクリアし、起動時に子を再起動中止済みとして扱い続けないようにできます。
    - 状態の整合性と権限チェック（セッション、トランスクリプト、状態ディレクトリ）。
    - ローカル実行時の設定ファイル権限チェック（chmod 600）。
    - モデル認証の健全性: OAuth の期限切れを確認し、期限切れが近いトークンを更新でき、認証プロファイルのクールダウン/無効状態を報告します。
    - 追加ワークスペースディレクトリの検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、サービス、スーパーバイザー">
    - サンドボックス化が有効な場合のサンドボックスイメージ修復。
    - レガシーサービスの移行と追加 Gateway の検出。
    - Matrix チャネルのレガシー状態移行（`--fix` / `--repair` モード）。
    - Gateway ランタイムチェック（サービスはインストール済みだが実行されていない、キャッシュされた launchd ラベル）。
    - チャネル状態の警告（実行中の Gateway からプローブ）。
    - チャネル固有の権限チェックは `openclaw channels capabilities` の下にあります。たとえば、Discord 音声チャネルの権限は `openclaw channels capabilities --channel discord --target channel:<channel-id>` で監査されます。
    - local TUI クライアントがまだ実行中の状態で Gateway イベントループの健全性が低下している場合の WhatsApp 応答性チェック。`--fix` は検証済みの local TUI クライアントだけを停止します。
    - プライマリモデル、フォールバック、Heartbeat/サブエージェント/Compaction 上書き、フック、チャネルモデル上書き、セッションルートピンに含まれるレガシー `openai-codex/*` モデル参照の Codex ルート修復。`--fix` はそれらを `openai/*` に書き換え、古いセッション/エージェント全体のランタイムピンを削除し、既定の Codex ハーネス上の正規 OpenAI エージェント参照を残します。
    - 任意修復付きのスーパーバイザー設定監査（launchd/systemd/schtasks）。
    - インストールまたは更新時にシェルの `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取り込んだ Gateway サービス向けの埋め込みプロキシ環境クリーンアップ。
    - Gateway ランタイムのベストプラクティスチェック（Node と Bun、バージョンマネージャーのパス）。
    - Gateway ポート衝突診断（既定 `18789`）。

  </Accordion>
  <Accordion title="認証、セキュリティ、ペアリング">
    - オープン DM ポリシーのセキュリティ警告。
    - ローカルトークンモードの Gateway 認証チェック（トークンソースが存在しない場合にトークン生成を提案します。トークン SecretRef 設定は上書きしません）。
    - デバイスペアリングの問題検出（保留中の初回ペアリクエスト、保留中のロール/スコープアップグレード、古いローカルデバイストークンキャッシュのずれ、ペアリング済みレコードの認証ずれ）。

  </Accordion>
  <Accordion title="ワークスペースとシェル">
    - Linux での systemd linger チェック。
    - ワークスペースブートストラップファイルサイズチェック（コンテキストファイルの切り詰め/上限接近警告）。
    - 既定エージェントの Skills 準備状況チェック。bin、env、config、または OS 要件が不足している許可済み Skills を報告し、`--fix` は `skills.entries` 内の利用できない Skills を無効化できます。
    - シェル補完の状態チェックと自動インストール/アップグレード。
    - メモリ検索埋め込みプロバイダーの準備状況チェック（ローカルモデル、リモート API キー、または QMD バイナリ）。
    - ソースインストールチェック（pnpm ワークスペースの不一致、不足している UI アセット、不足している tsx バイナリ）。
    - 更新された設定 + ウィザードメタデータを書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI のバックフィルとリセット

Control UI の Dreams シーンには、接地済み Dreaming ワークフロー向けの **バックフィル**、**リセット**、**接地済みをクリア** アクションがあります。これらのアクションは Gateway の doctor 風 RPC メソッドを使用しますが、`openclaw doctor` CLI の修復/移行の一部では**ありません**。

それらが行うこと:

- **バックフィル** は、アクティブなワークスペース内の過去の `memory/YYYY-MM-DD.md` ファイルをスキャンし、接地済み REM 日記パスを実行し、可逆なバックフィルエントリを `DREAMS.md` に書き込みます。
- **リセット** は、`DREAMS.md` から、マークされたバックフィル日記エントリだけを削除します。
- **接地済みをクリア** は、過去のリプレイから来て、まだライブリコールや日次サポートを蓄積していない、ステージ済みの接地済み限定短期エントリだけを削除します。

それらが単独では行わ**ない**こと:

- `MEMORY.md` を編集しません
- doctor の完全な移行を実行しません
- 先にステージ済み CLI パスを明示的に実行しない限り、接地済み候補をライブの短期昇格ストアへ自動的にステージしません

接地済みの履歴リプレイが通常のディープ昇格レーンに影響するようにしたい場合は、代わりに CLI フローを使用します。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` をレビュー面として保持しながら、接地済みの永続候補を短期 Dreaming ストアにステージします。

## 詳細な挙動と根拠

<AccordionGroup>
  <Accordion title="0. 任意更新（git インストール）">
    これが git チェックアウトで、doctor が対話的に実行されている場合、doctor 実行前に更新（fetch/rebase/build）を提案します。
  </Accordion>
  <Accordion title="1. 設定の正規化">
    設定にレガシーな値形状（たとえばチャネル固有の上書きがない `messages.ackReaction`）が含まれている場合、doctor はそれらを現在のスキーマへ正規化します。

    これにはレガシーな Talk フラットフィールドが含まれます。現在の公開 Talk 音声設定は `talk.provider` + `talk.providers.<provider>` で、リアルタイム音声設定は `talk.realtime.*` です。Doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形状をプロバイダーマップに書き換え、レガシーなトップレベルのリアルタイムセレクター（`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`）を `talk.realtime` に書き換えます。

    Doctor は、`plugins.allow` が空でなく、ツールポリシーが
    ワイルドカードまたは Plugin 所有ツールエントリを使用している場合にも警告します。`tools.allow: ["*"]` は、実際に読み込まれる Plugin
    由来のツールにのみ一致します。排他的な Plugin
    許可リストをバイパスするものではありません。Doctor は、移行された
    レガシー許可リスト設定に対して `plugins.bundledDiscovery: "compat"` を書き込み、既存のバンドルプロバイダー挙動を保持し、
    その後、より厳密な `"allowlist"` 設定を示します。

  </Accordion>
  <Accordion title="2. レガシー設定キーの移行">
    設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` の実行を求めます。

    Doctor は次を行います。

    - 検出されたレガシーキーを説明します。
    - 適用した移行を表示します。
    - 更新されたスキーマで `~/.openclaw/openclaw.json` を書き換えます。

    Gateway の起動はレガシー設定形式を拒否し、`openclaw doctor --fix` の実行を求めます。起動時に `openclaw.json` を書き換えることはありません。Cron ジョブストアの移行も `openclaw doctor --fix` によって処理されます。

    現在の移行:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 可視返信ポリシーが欠けている構成済みチャンネル設定 → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → トップレベルの `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - レガシーの `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - レガシーのトップレベルリアルタイム Talk セレクター (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` および `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` および `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` および `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` および `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 名前付きの `accounts` を持つチャンネルで、単一アカウント用のトップレベルチャンネル値が残っている場合は、それらのアカウントスコープ値を、そのチャンネル用に選ばれた昇格先アカウントへ移動します（ほとんどのチャンネルでは `accounts.default`。Matrix は既存の一致する名前付き/デフォルトターゲットを維持できます）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` を削除します。遅いプロバイダー/モデルのタイムアウトには `models.providers.<id>.timeoutSeconds` を使用します
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` を削除します（レガシー拡張機能リレー設定）
    - レガシーの `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 起動時にも、`api` が将来または未知の enum 値に設定されているプロバイダーは、フェイルクローズで失敗させるのではなくスキップします）
    - `plugins.entries.codex.config.codexDynamicToolsProfile` を削除します。Codex アプリサーバーは常に Codex ネイティブのワークスペースツールをネイティブのままにします

    doctor の警告には、複数アカウントのチャンネル向けのアカウントデフォルトガイダンスも含まれます:

    - 2 つ以上の `channels.<channel>.accounts` エントリが `channels.<channel>.defaultAccount` または `accounts.default` なしで構成されている場合、doctor はフォールバックルーティングが予期しないアカウントを選ぶ可能性があることを警告します。
    - `channels.<channel>.defaultAccount` が未知のアカウント ID に設定されている場合、doctor は警告し、構成済みアカウント ID を一覧表示します。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダーのオーバーライド">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、`@mariozechner/pi-ai` の組み込み OpenCode カタログをオーバーライドします。これにより、モデルに誤った API を強制したり、コストを 0 にしたりする可能性があります。doctor は警告するため、そのオーバーライドを削除して、モデルごとの API ルーティング + コストを復元できます。
  </Accordion>
  <Accordion title="2c. ブラウザー移行と Chrome MCP の準備状況">
    ブラウザー設定がまだ削除済みの Chrome 拡張機能パスを指している場合、doctor はそれを現在のホストローカル Chrome MCP アタッチモデルへ正規化します:

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になります
    - `browser.relayBindHost` は削除されます

    `defaultProfile: "user"` または構成済みの `existing-session` プロファイルを使用している場合、doctor はホストローカル Chrome MCP パスも監査します:

    - デフォルトの自動接続プロファイルについて、Google Chrome が同じホストにインストールされているかをチェックします
    - 検出された Chrome バージョンをチェックし、Chrome 144 未満の場合は警告します
    - ブラウザーの inspect ページでリモートデバッグを有効にするよう通知します（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

    doctor は Chrome 側の設定を有効化できません。ホストローカル Chrome MCP には引き続き以下が必要です:

    - Gateway/Node ホスト上の Chromium ベースブラウザー 144+
    - ブラウザーがローカルで実行されていること
    - そのブラウザーでリモートデバッグが有効になっていること
    - ブラウザーで初回アタッチ同意プロンプトを承認すること

    ここでの準備状況は、ローカルアタッチの前提条件のみを対象としています。Existing-session は現在の Chrome MCP ルート制限を維持します。`responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなどの高度なルートには、引き続きマネージドブラウザーまたは raw CDP プロファイルが必要です。

    このチェックは Docker、sandbox、remote-browser、その他の headless フローには**適用されません**。それらは引き続き raw CDP を使用します。

  </Accordion>
  <Accordion title="2d. OAuth TLS の前提条件">
    OpenAI Codex OAuth プロファイルが構成されている場合、doctor は OpenAI 認可エンドポイントを検査し、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できるかを確認します。検査が証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、または自己署名証明書）で失敗した場合、doctor はプラットフォーム別の修正ガイダンスを表示します。macOS で Homebrew Node を使用している場合、通常の修正は `brew postinstall ca-certificates` です。`--deep` では、Gateway が正常でも検査が実行されます。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダーのオーバーライド">
    以前に `models.providers.openai-codex` の下へレガシーの OpenAI トランスポート設定を追加していた場合、それらは新しいリリースが自動的に使用する組み込み Codex OAuth プロバイダーパスを覆い隠すことがあります。doctor は、Codex OAuth と並んでそれらの古いトランスポート設定を検出すると警告するため、古いトランスポートオーバーライドを削除または書き換えて、組み込みのルーティング/フォールバック動作を取り戻せます。カスタムプロキシとヘッダーのみのオーバーライドは引き続きサポートされ、この警告は発生しません。
  </Accordion>
  <Accordion title="2f. Codex ルート修復">
    doctor はレガシーの `openai-codex/*` モデル参照をチェックします。ネイティブ Codex ハーネスのルーティングは正規の `openai/*` モデル参照を使用します。OpenAI エージェントのターンは、OpenClaw PI OpenAI パスではなく Codex アプリサーバーハーネスを経由します。

    `--fix` / `--repair` モードでは、doctor は影響を受けるデフォルトエージェントおよびエージェントごとの参照を書き換えます。これには、プライマリモデル、フォールバック、Heartbeat/サブエージェント/Compaction のオーバーライド、フック、チャンネルモデルオーバーライド、古い永続化セッションルート状態が含まれます:

    - `openai-codex/gpt-*` は `openai/gpt-*` になります。
    - Codex intent は、修復されたエージェントモデル参照について、プロバイダー/モデルスコープの `agentRuntime.id: "codex"` エントリへ移動します。これにより、モデル参照が `openai/*` になった後も `openai-codex:...` 認証プロファイルを選択できます。
    - ランタイム選択はプロバイダー/モデルスコープであるため、古いエージェント全体のランタイム設定と永続化セッションのランタイムピンは削除されます。
    - 修復されたレガシーモデル参照が古い認証パスを維持するために Codex ルーティングを必要としない限り、既存のプロバイダー/モデルランタイムポリシーは維持されます。
    - 既存のモデルフォールバックリストは、レガシーエントリを書き換えた上で維持されます。コピーされたモデルごとの設定は、レガシーキーから正規の `openai/*` キーへ移動します。
    - 永続化セッションの `modelProvider`/`providerOverride`、`model`/`modelOverride`、フォールバック通知、認証プロファイルのピンは、検出されたすべてのエージェントセッションストアで修復されます。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」を意味します。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使用する」を意味します。

  </Accordion>
  <Accordion title="2g. セッションルートのクリーンアップ">
    doctor は、構成済みモデルまたはランタイムを Codex などの Plugin 所有ルートから移動した後に残る、古い自動作成ルート状態について、検出されたエージェントセッションストアもスキャンします。

    `openclaw doctor --fix` は、所有元ルートが構成されなくなった場合に、`modelOverrideSource: "auto"` モデルピン、ランタイムモデルメタデータ、ピン留めされたハーネス ID、CLI セッションバインディング、自動認証プロファイルオーバーライドなど、自動作成された古い状態をクリアできます。明示的なユーザーまたはレガシーセッションのモデル選択は、手動レビュー用に報告され、そのまま残されます。そのルートが不要になった場合は、`/model ...`、`/new`、またはセッションのリセットで切り替えてください。

  </Accordion>
  <Accordion title="3. レガシー状態の移行（ディスクレイアウト）">
    doctor は古いオンディスクレイアウトを現在の構造へ移行できます:

    - セッションストア + トランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態 (Baileys):
      - レガシーの `~/.openclaw/credentials/*.json` から（`oauth.json` を除く）
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートかつ冪等です。doctor は、レガシーフォルダーをバックアップとして残す場合に警告を出します。Gateway/CLI も起動時にレガシーセッション + エージェントディレクトリを自動移行するため、手動で doctor を実行しなくても履歴/認証/モデルがエージェントごとのパスに配置されます。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talk プロバイダー/プロバイダーマップの正規化は、構造的等価性で比較するようになったため、キー順序だけの差分では、反復的な no-op の `doctor --fix` 変更は発生しなくなります。

  </Accordion>
  <Accordion title="3a. レガシー Plugin マニフェストの移行">
    doctor は、非推奨のトップレベル capability キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）について、インストール済みのすべての Plugin マニフェストをスキャンします。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをインプレースで書き換えることを提案します。この移行は冪等です。`contracts` キーに同じ値がすでにある場合、データを重複させずにレガシーキーを削除します。
  </Accordion>
  <Accordion title="3b. レガシー Cron ストアの移行">
    doctor は、Cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、オーバーライドされている場合は `cron.store`）について、スケジューラーが互換性のためにまだ受け入れている古いジョブ形式もチェックします。

    現在の Cron クリーンアップには以下が含まれます:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルのペイロードフィールド（`message`、`model`、`thinking`、...） → `payload`
    - トップレベルの配信フィールド（`deliver`、`channel`、`to`、`provider`、...） → `delivery`
    - ペイロードの `provider` 配信エイリアス → 明示的な `delivery.channel`
    - シンプルなレガシー `notify: true` Webhook フォールバックジョブ → `delivery.to=cron.webhook` を指定した明示的な `delivery.mode="webhook"`

    Doctor は、挙動を変更せずに実行できる場合にのみ `notify: true` ジョブを自動移行します。ジョブがレガシー通知フォールバックと既存の非 Webhook 配信モードを組み合わせている場合、doctor は警告し、そのジョブを手動レビュー用に残します。

    Linux では、ユーザーの crontab がまだレガシーの `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出している場合にも doctor が警告します。そのホストローカルスクリプトは現在の OpenClaw では保守されておらず、cron が systemd ユーザーバスに到達できない場合に、誤った `Gateway inactive` メッセージを `~/.openclaw/logs/whatsapp-health.log` に書き込む可能性があります。古い crontab エントリは `crontab -e` で削除してください。現在のヘルスチェックには `openclaw channels status --probe`、`openclaw doctor`、`openclaw gateway status` を使用してください。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    Doctor は、すべてのエージェントセッションディレクトリで古い書き込みロックファイルをスキャンします。これはセッションが異常終了したときに残されたファイルです。見つかった各ロックファイルについて、パス、PID、その PID がまだ生存しているかどうか、ロックの経過時間、古いと見なされるかどうか（停止した PID、30 分超、または OpenClaw 以外のプロセスに属することを証明できる生存 PID）を報告します。`--fix` / `--repair` モードでは古いロックファイルを自動的に削除します。それ以外の場合は注記を出力し、`--fix` で再実行するよう指示します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    Doctor は、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状がないか、エージェントセッションの JSONL ファイルをスキャンします。これは OpenClaw 内部ランタイムコンテキストを含む破棄されたユーザーターンと、同じ表示ユーザープロンプトを含むアクティブな兄弟です。`--fix` / `--repair` モードでは、doctor は影響を受ける各ファイルを元のファイルの隣にバックアップし、トランスクリプトをアクティブブランチへ書き換えるため、gateway 履歴とメモリリーダーに重複ターンが見えなくなります。
  </Accordion>
  <Accordion title="4. 状態の整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の中枢です。消失すると、セッション、認証情報、ログ、設定を失います（他の場所にバックアップがある場合を除く）。

    Doctor は次をチェックします。

    - **状態ディレクトリの欠落**: 壊滅的な状態損失について警告し、ディレクトリを再作成するか確認し、欠落データは復旧できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能性を検証します。権限の修復を提案します（所有者/グループの不一致が検出された場合は `chown` のヒントを出力します）。
    - **macOS のクラウド同期状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` 配下に解決される場合に警告します。同期ベースのパスは I/O の低速化やロック/同期競合を引き起こす可能性があるためです。
    - **Linux の SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合に警告します。SD または eMMC ベースのランダム I/O は低速になりやすく、セッションや認証情報の書き込みで摩耗が早まる可能性があるためです。
    - **セッションディレクトリの欠落**: 履歴を永続化し、`ENOENT` クラッシュを避けるには、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプトの不一致**: 最近のセッションエントリにトランスクリプトファイルが欠落している場合に警告します。
    - **メインセッションの「1 行 JSONL」**: メイントランスクリプトが 1 行だけの場合にフラグを立てます（履歴が蓄積されていません）。
    - **複数の状態ディレクトリ**: 複数の `~/.openclaw` フォルダーがホームディレクトリ間に存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分割される可能性があります）。
    - **リモートモードのリマインダー**: `gateway.mode=remote` の場合、doctor はリモートホストで実行するよう通知します（状態はそこにあります）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全員に読み取り可能な場合に警告し、`600` へ厳格化することを提案します。

  </Accordion>
  <Accordion title="5. モデル認証のヘルス（OAuth の有効期限）">
    Doctor は認証ストア内の OAuth プロファイルを検査し、トークンの有効期限が近い/切れている場合に警告し、安全な場合は更新できます。Anthropic の OAuth/トークンプロファイルが古い場合、Anthropic API キーまたは Anthropic setup-token パスを提案します。更新プロンプトは対話実行時（TTY）にのみ表示されます。`--non-interactive` は更新試行をスキップします。

    OAuth 更新が永続的に失敗した場合（たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求める場合）、doctor は再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを出力します。

    Doctor は、次の理由で一時的に使用できない認証プロファイルも報告します。

    - 短いクールダウン（レート制限/タイムアウト/認証失敗）
    - より長い無効化（請求/クレジットの失敗）

  </Accordion>
  <Accordion title="6. フックモデルの検証">
    `hooks.gmail.model` が設定されている場合、doctor はカタログおよび許可リストに照らしてモデル参照を検証し、解決できない、または許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージの修復">
    サンドボックス化が有効な場合、doctor は Docker イメージをチェックし、現在のイメージが欠落している場合はビルドまたはレガシー名への切り替えを提案します。
  </Accordion>
  <Accordion title="7b. Plugin インストールのクリーンアップ">
    Doctor は、`openclaw doctor --fix` / `openclaw doctor --repair` モードで、レガシーな OpenClaw 生成 Plugin 依存関係のステージング状態を削除します。これには、古い生成済み依存関係ルート、古いインストールステージディレクトリ、以前のバンドル Plugin 依存関係修復コードによるパッケージローカルの残骸、現在のバンドルマニフェストをシャドウする可能性がある、孤立または復旧されたバンドル `@openclaw/*` Plugin の管理対象 npm コピーが含まれます。

    Doctor は、設定から参照されているにもかかわらずローカル Plugin レジストリで見つからない、欠落したダウンロード可能 Plugin も再インストールできます。例には、具体的な `plugins.entries`、設定済みのチャンネル/プロバイダー/検索設定、設定済みのエージェントランタイムが含まれます。パッケージ更新中、doctor はコアパッケージの入れ替え中にパッケージマネージャーによる Plugin 修復を実行しません。設定済み Plugin の復旧がまだ必要な場合は、更新後に `openclaw doctor --fix` を再度実行してください。Gateway 起動と設定リロードではパッケージマネージャーは実行されません。Plugin インストールは明示的な doctor/install/update 作業のままです。

  </Accordion>
  <Accordion title="8. Gatewayサービスの移行とクリーンアップのヒント">
    Doctorはレガシーなgatewayサービス（launchd/systemd/schtasks）を検出し、それらを削除して現在のgatewayポートを使うOpenClawサービスをインストールする選択肢を提示します。追加のgateway風サービスをスキャンし、クリーンアップのヒントを表示することもできます。プロファイル名付きのOpenClaw gatewayサービスは第一級のものとみなされ、「余分」としてフラグ付けされません。

    Linuxでは、ユーザーレベルのgatewayサービスが存在しないがシステムレベルのOpenClaw gatewayサービスが存在する場合、doctorは2つ目のユーザーレベルサービスを自動ではインストールしません。`openclaw gateway status --deep`または`openclaw doctor --deep`で確認し、重複を削除するか、システムスーパーバイザーがgatewayのライフサイクルを管理している場合は`OPENCLAW_SERVICE_REPAIR_POLICY=external`を設定してください。

  </Accordion>
  <Accordion title="8b. 起動時のMatrix移行">
    Matrixチャネルアカウントに保留中または実行可能なレガシー状態の移行がある場合、doctorは（`--fix` / `--repair`モードで）移行前スナップショットを作成し、その後ベストエフォートの移行手順を実行します。レガシーMatrix状態の移行と、レガシー暗号化状態の準備です。どちらの手順も致命的ではありません。エラーはログに記録され、起動は続行されます。読み取り専用モード（`--fix`なしの`openclaw doctor`）では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスのペアリングと認証のずれ">
    Doctorは通常のヘルスチェックの一部として、デバイスペアリング状態を検査するようになりました。

    報告内容:

    - 保留中の初回ペアリング要求
    - すでにペアリング済みのデバイスに対する保留中のロールアップグレード
    - すでにペアリング済みのデバイスに対する保留中のスコープアップグレード
    - デバイスidは一致しているが、デバイスIDが承認済みレコードと一致しなくなった場合の公開鍵不一致の修復
    - 承認済みロールのアクティブなトークンがないペアリング済みレコード
    - 承認済みペアリングベースラインの外へスコープがずれたペアリング済みトークン
    - gateway側のトークンローテーションより古い、または古いスコープメタデータを保持している、現在のマシン向けのローカルキャッシュ済みデバイストークンエントリ

    Doctorはペアリング要求を自動承認したり、デバイストークンを自動ローテーションしたりしません。代わりに、正確な次の手順を表示します。

    - `openclaw devices list`で保留中の要求を確認する
    - `openclaw devices approve <requestId>`で該当する要求を承認する
    - `openclaw devices rotate --device <deviceId> --role <role>`で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>`で古いレコードを削除し、再承認する

    これにより、よくある「すでにペアリング済みなのに、まだペアリングが必要と表示される」穴が解消されます。doctorは初回ペアリング、保留中のロール/スコープアップグレード、古いトークン/デバイスIDのずれを区別するようになりました。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    Doctorは、プロバイダーが許可リストなしでDMに対して開かれている場合、またはポリシーが危険な方法で設定されている場合に警告を発します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemdユーザーサービスとして実行している場合、doctorはログアウト後もgatewayが稼働し続けるようにlingerが有効であることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペースの状態（Skills、plugins、レガシーディレクトリ）">
    Doctorはデフォルトエージェントのワークスペース状態の概要を表示します。

    - **Skillsの状態**: 対象、要件不足、許可リストでブロックされたskillsの数を数えます。
    - **レガシーワークスペースディレクトリ**: `~/openclaw`またはその他のレガシーワークスペースディレクトリが現在のワークスペースと併存している場合に警告します。
    - **Pluginの状態**: 有効/無効/エラーのplugins数を数えます。エラーがある場合はplugin IDを列挙し、バンドルpluginの機能を報告します。
    - **Plugin互換性警告**: 現在のランタイムとの互換性問題があるpluginsをフラグ付けします。
    - **Plugin診断**: pluginレジストリによって読み込み時に発行された警告やエラーを表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    Doctorは、ワークスペースのブートストラップファイル（例: `AGENTS.md`、`CLAUDE.md`、またはその他の注入済みコンテキストファイル）が、設定された文字数上限に近い、または超えているかどうかを確認します。ファイルごとの生の文字数と注入後の文字数、切り詰め率、切り詰め原因（`max/file`または`max/total`）、合計予算に対する総注入文字数の割合を報告します。ファイルが切り詰められているか上限に近い場合、doctorは`agents.defaults.bootstrapMaxChars`と`agents.defaults.bootstrapTotalMaxChars`を調整するためのヒントを表示します。
  </Accordion>
  <Accordion title="11d. 古いチャネルpluginのクリーンアップ">
    `openclaw doctor --fix`が存在しないチャネルpluginを削除する場合、そのpluginを参照していた宙ぶらりんのチャネルスコープ設定も削除します。`channels.<id>`エントリ、チャネルを名指ししたheartbeatターゲット、`agents.*.models["<channel>/*"]`の上書きです。これにより、チャネルランタイムがなくなっているのに設定がgatewayにそのチャネルへのバインドを要求し続けるGateway起動ループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    Doctorは、現在のシェル（zsh、bash、fish、またはPowerShell）にタブ補完がインストールされているかどうかを確認します。

    - シェルプロファイルが遅い動的補完パターン（`source <(openclaw completion ...)`）を使っている場合、doctorはより高速なキャッシュ済みファイル方式へアップグレードします。
    - 補完がプロファイルに設定されているがキャッシュファイルがない場合、doctorはキャッシュを自動的に再生成します。
    - 補完がまったく設定されていない場合、doctorはインストールを促します（対話モードのみ。`--non-interactive`ではスキップされます）。

    キャッシュを手動で再生成するには、`openclaw completion --write-state`を実行してください。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック（ローカルトークン）">
    Doctor はローカル Gateway トークン認証の準備状態をチェックします。

    - トークンモードでトークンが必要で、トークンソースが存在しない場合、doctor は生成を提案します。
    - `gateway.auth.token` が SecretRef 管理だが利用できない場合、doctor は警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、ランタイムのフェイルファスト動作を弱めずに、設定済みの認証情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象を絞った設定修復のために、status 系コマンドと同じ読み取り専用の SecretRef サマリーモデルを使用するようになりました。
    - 例: Telegram `allowFrom` / `groupAllowFrom` の `@username` 修復は、利用可能な場合は設定済みのボット認証情報を使おうとします。
    - Telegram ボットトークンが SecretRef 経由で設定されているものの、現在のコマンドパスで利用できない場合、doctor は認証情報が設定済みだが利用不可であることを報告し、クラッシュしたりトークンが欠落していると誤報告したりする代わりに、自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway ヘルスチェック + 再起動">
    Doctor はヘルスチェックを実行し、Gateway が異常に見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状態">
    Doctor は、設定済みのメモリ検索埋め込みプロバイダーがデフォルトエージェントに対して準備できているかをチェックします。動作は、設定済みのバックエンドとプロバイダーによって異なります。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動できるかをプローブします。できない場合は、npm パッケージと手動バイナリパスオプションを含む修正ガイダンスを出力します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイル、または認識済みのリモート/ダウンロード可能なモデル URL をチェックします。見つからない場合は、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー**（`openai`、`voyage` など）: API キーが環境または認証ストアに存在することを検証します。存在しない場合は、実行可能な修正ヒントを出力します。
    - **自動プロバイダー**: まずローカルモデルの可用性をチェックし、その後、自動選択順で各リモートプロバイダーを試します。

    キャッシュされた Gateway プローブ結果が利用できる場合（チェック時点で Gateway が正常だった場合）、doctor はその結果を CLI から見える設定と相互参照し、差異があれば記録します。Doctor はデフォルトパスでは新しい埋め込み ping を開始しません。ライブのプロバイダーチェックが必要な場合は、詳細メモリステータスコマンドを使用してください。

    ランタイムで埋め込みの準備状態を検証するには、`openclaw memory status --deep` を使用します。

  </Accordion>
  <Accordion title="14. チャンネルステータス警告">
    Gateway が正常な場合、doctor はチャンネルステータスプローブを実行し、推奨される修正とともに警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー設定監査 + 修復">
    Doctor は、インストール済みのスーパーバイザー設定（launchd/systemd/schtasks）に、欠落している、または古いデフォルト（例: systemd の network-online 依存関係や再起動遅延）がないかをチェックします。不一致が見つかると、更新を推奨し、サービスファイル/タスクを現在のデフォルトに書き換えることができます。

    注意:

    - `openclaw doctor` はスーパーバイザー設定を書き換える前に確認します。
    - `openclaw doctor --yes` はデフォルトの修復プロンプトを受け入れます。
    - `openclaw doctor --repair` は推奨される修正をプロンプトなしで適用します。
    - `openclaw doctor --repair --force` はカスタムスーパーバイザー設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、Gateway サービスライフサイクルについて doctor を読み取り専用に保ちます。サービスヘルスを引き続き報告し、サービス以外の修復は実行しますが、外部スーパーバイザーがそのライフサイクルを所有しているため、サービスのインストール/起動/再起動/ブートストラップ、スーパーバイザー設定の書き換え、レガシーサービスのクリーンアップはスキップします。
    - Linux では、一致する systemd Gateway ユニットがアクティブな間、doctor はコマンド/エントリーポイントメタデータを書き換えません。また、重複サービススキャン中は、非アクティブで非レガシーの追加 Gateway 風ユニットを無視するため、関連サービスファイルがクリーンアップノイズを発生させません。
    - トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、doctor のサービスインストール/修復は SecretRef を検証しますが、解決済みの平文トークン値をスーパーバイザーサービス環境メタデータに永続化しません。
    - Doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストールがインラインに埋め込んだ、管理対象 `.env`/SecretRef ベースのサービス環境値を検出し、それらの値がスーパーバイザー定義ではなくランタイムソースから読み込まれるようにサービスメタデータを書き換えます。
    - Doctor は、`gateway.port` の変更後もサービスコマンドが古い `--port` を固定している場合に検出し、サービスメタデータを現在のポートに書き換えます。
    - トークン認証でトークンが必要で、設定済みのトークン SecretRef が未解決の場合、doctor は実行可能なガイダンスとともにインストール/修復パスをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、doctor はモードが明示的に設定されるまでインストール/修復をブロックします。
    - Linux ユーザー systemd ユニットでは、doctor のトークンドリフトチェックは、サービス認証メタデータを比較する際に `Environment=` と `EnvironmentFile=` の両方のソースを含むようになりました。
    - Doctor のサービス修復は、設定がより新しいバージョンによって最後に書き込まれていた場合、古い OpenClaw バイナリから Gateway サービスを書き換えたり、停止したり、再起動したりすることを拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` により、いつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway ランタイム + ポート診断">
    Doctor はサービスランタイム（PID、最後の終了ステータス）を検査し、サービスがインストールされているのに実際には実行されていない場合に警告します。また、Gateway ポート（デフォルト `18789`）でポート競合がないかをチェックし、考えられる原因（Gateway がすでに実行中、SSH トンネル）を報告します。
  </Accordion>
  <Accordion title="17. Gateway ランタイムのベストプラクティス">
    Doctor は、Gateway サービスが Bun またはバージョン管理された Node パス（`nvm`、`fnm`、`volta`、`asdf` など）で実行されている場合に警告します。WhatsApp + Telegram チャンネルには Node が必要であり、サービスはシェル初期化を読み込まないため、バージョンマネージャーパスはアップグレード後に壊れる可能性があります。Doctor は、利用可能な場合はシステムの Node インストール（Homebrew/apt/choco）への移行を提案します。

    新規インストールまたは修復された macOS LaunchAgent は、対話型シェルの PATH をコピーする代わりに、正規のシステム PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`）を使用します。そのため、Homebrew 管理のシステムバイナリは引き続き利用可能であり、Volta、asdf、fnm、pnpm、その他のバージョンマネージャーディレクトリが、Node 子プロセスの解決先を変えることはありません。Linux サービスは引き続き明示的な環境ルート（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）と安定したユーザーバイナリディレクトリを保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、それらのディレクトリがディスク上に存在する場合にのみサービス PATH に書き込まれます。

  </Accordion>
  <Accordion title="18. 設定書き込み + ウィザードメタデータ">
    Doctor は設定変更を永続化し、doctor 実行を記録するためにウィザードメタデータを刻印します。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント（バックアップ + メモリシステム）">
    Doctor は、ワークスペースメモリシステムがない場合に提案し、ワークスペースがまだ git 管理下にない場合はバックアップのヒントを出力します。

    ワークスペース構造と git バックアップ（プライベート GitHub または GitLab を推奨）の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
