---
read_when:
    - doctor マイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: 'Doctor コマンド: ヘルスチェック、設定移行、修復手順'
title: 診断
x-i18n:
    generated_at: "2026-05-07T13:17:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7826cb4f3e97e56b07a5ba3b1c61860b15d6831d29012a0a16fe8f5f7014d1d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` は OpenClaw の修復 + 移行ツールです。古くなった設定/状態を修正し、ヘルスをチェックし、実行可能な修復手順を提示します。

## クイックスタート

```bash
openclaw doctor
```

### ヘッドレスおよび自動化モード

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    プロンプトなしでデフォルトを受け入れます（該当する場合は再起動/サービス/サンドボックスの修復手順を含む）。

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

    プロンプトなしで実行し、安全な移行のみを適用します（設定の正規化 + ディスク上の状態移動）。人間の確認が必要な再起動/サービス/サンドボックス操作はスキップします。レガシー状態の移行は、検出されると自動的に実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の gateway インストール（launchd/systemd/schtasks）についてシステムサービスをスキャンします。

  </Tab>
</Tabs>

書き込む前に変更を確認したい場合は、先に設定ファイルを開いてください。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="ヘルス、UI、更新">
    - git インストール向けの任意の事前更新（対話モードのみ）。
    - UI プロトコルの鮮度チェック（プロトコルスキーマが新しい場合は Control UI を再ビルドします）。
    - ヘルスチェック + 再起動プロンプト。
    - Skills の状態概要（対象/不足/ブロック）と Plugin の状態。

  </Accordion>
  <Accordion title="設定と移行">
    - レガシー値の設定正規化。
    - レガシーのフラットな `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk 設定移行。
    - レガシー Chrome 拡張機能設定と Chrome MCP 準備状況に関するブラウザー移行チェック。
    - OpenCode プロバイダー上書き警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth シャドーイング警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth プロファイルの OAuth TLS 前提条件チェック。
    - `plugins.allow` が制限的なのに、ツールポリシーがまだワイルドカードまたは Plugin 所有ツールを要求している場合の Plugin/ツール allowlist 警告。
    - レガシーのディスク上状態移行（セッション/エージェントディレクトリ/WhatsApp 認証）。
    - レガシー Plugin マニフェスト契約キー移行（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - レガシー cron ストア移行（`jobId`、`schedule.cron`、トップレベルの delivery/payload フィールド、payload `provider`、単純な `notify: true` webhook フォールバックジョブ）。
    - レガシーエージェント runtime-policy の `agents.defaults.agentRuntime` および `agents.list[].agentRuntime` への移行。
    - Plugin が有効な場合の古い Plugin 設定クリーンアップ。`plugins.enabled=false` の場合、古い Plugin 参照は無害な封じ込め設定として扱われ、保持されます。

  </Accordion>
  <Accordion title="状態と整合性">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受けた 2026.4.24 ビルドによって作成された重複 prompt-rewrite ブランチのセッショントランスクリプト修復。
    - 詰まったサブエージェントの再起動リカバリー tombstone 検出。古い中断済みリカバリーフラグをクリアする `--fix` に対応し、起動時に子を再起動中断済みとして扱い続けないようにします。
    - 状態の整合性と権限チェック（セッション、トランスクリプト、状態ディレクトリ）。
    - ローカル実行時の設定ファイル権限チェック（chmod 600）。
    - モデル認証ヘルス: OAuth の有効期限をチェックし、期限切れ間近のトークンを更新でき、auth-profile の cooldown/disabled 状態を報告します。
    - 追加 workspace ディレクトリの検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、サービス、supervisor">
    - サンドボックスが有効な場合のサンドボックスイメージ修復。
    - レガシーサービス移行と追加 Gateway 検出。
    - Matrix チャンネルのレガシー状態移行（`--fix` / `--repair` モード）。
    - Gateway ランタイムチェック（サービスはインストール済みだが未実行、キャッシュされた launchd ラベル）。
    - チャンネル状態警告（実行中の Gateway からプローブ）。
    - チャンネル固有の権限チェックは `openclaw channels capabilities` の下にあります。たとえば Discord ボイスチャンネル権限は `openclaw channels capabilities --channel discord --target channel:<channel-id>` で監査されます。
    - ローカル TUI クライアントがまだ実行中で、Gateway event-loop ヘルスが低下している場合の WhatsApp 応答性チェック。`--fix` は検証済みのローカル TUI クライアントのみを停止します。
    - プライマリモデル、fallback、heartbeat/subagent/compaction 上書き、hook、チャンネルモデル上書き、セッション route pin 内のレガシー `openai-codex/*` モデル参照に対する Codex route 修復。`--fix` はそれらを `openai/*` に書き換え、Codex Plugin がインストール済み、有効、`codex` ハーネスを提供し、利用可能な OAuth を持つ場合にのみ `agentRuntime.id: "codex"` を選択します。それ以外の場合は `agentRuntime.id: "pi"` を選択します。
    - 任意修復付きの supervisor 設定監査（launchd/systemd/schtasks）。
    - インストールまたは更新時にシェルの `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取り込んだ Gateway サービスの埋め込みプロキシ環境クリーンアップ。
    - Gateway ランタイムのベストプラクティスチェック（Node と Bun、バージョンマネージャーパス）。
    - Gateway ポート衝突診断（デフォルト `18789`）。

  </Accordion>
  <Accordion title="認証、セキュリティ、ペアリング">
    - オープン DM ポリシーのセキュリティ警告。
    - ローカルトークンモードの Gateway 認証チェック（トークンソースがない場合にトークン生成を提示します。token SecretRef 設定は上書きしません）。
    - デバイスペアリング問題の検出（保留中の初回ペアリングリクエスト、保留中の role/scope アップグレード、古いローカル device-token キャッシュのドリフト、ペアリング済みレコードの認証ドリフト）。

  </Accordion>
  <Accordion title="Workspace とシェル">
    - Linux の systemd linger チェック。
    - Workspace bootstrap ファイルサイズチェック（コンテキストファイルの切り詰め/上限接近警告）。
    - デフォルトエージェントの Skills 準備状況チェック。不足している bin、env、config、または OS 要件がある許可済み Skills を報告し、`--fix` は `skills.entries` 内の利用不可 Skills を無効化できます。
    - シェル補完の状態チェックと自動インストール/アップグレード。
    - メモリ検索 embedding プロバイダー準備状況チェック（ローカルモデル、リモート API キー、または QMD バイナリ）。
    - ソースインストールチェック（pnpm workspace 不一致、UI アセット不足、tsx バイナリ不足）。
    - 更新済み設定 + ウィザードメタデータを書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI backfill とリセット

Control UI Dreams シーンには、grounded dreaming ワークフロー用の **Backfill**、**Reset**、**Clear Grounded** アクションが含まれています。これらのアクションは Gateway の doctor 風 RPC メソッドを使用しますが、`openclaw doctor` CLI の修復/移行の一部では**ありません**。

実行内容:

- **Backfill** はアクティブな workspace 内の履歴 `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM diary pass を実行し、可逆な backfill エントリを `DREAMS.md` に書き込みます。
- **Reset** は `DREAMS.md` から、それらのマークされた backfill diary エントリのみを削除します。
- **Clear Grounded** は、履歴 replay 由来で、まだ live recall や daily support を蓄積していない staged grounded-only short-term エントリのみを削除します。

それ自体では実行**しない**こと:

- `MEMORY.md` を編集しません
- 完全な doctor 移行を実行しません
- staged CLI パスを先に明示的に実行しない限り、grounded candidate を live short-term promotion store に自動的に stage しません

grounded historical replay を通常の deep promotion lane に影響させたい場合は、代わりに CLI フローを使用してください。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` をレビュー面として維持しながら、grounded durable candidate を short-term dreaming store に stage します。

## 詳細な動作と根拠

<AccordionGroup>
  <Accordion title="0. 任意の更新（git インストール）">
    これが git checkout で、doctor が対話モードで実行されている場合、doctor 実行前に更新（fetch/rebase/build）を提示します。
  </Accordion>
  <Accordion title="1. 設定の正規化">
    設定にレガシー値の形（たとえばチャンネル固有の上書きがない `messages.ackReaction`）が含まれている場合、doctor はそれらを現在のスキーマに正規化します。

    これにはレガシー Talk のフラットフィールドが含まれます。現在の公開 Talk 音声設定は `talk.provider` + `talk.providers.<provider>` で、リアルタイム voice 設定は `talk.realtime.*` です。Doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` の形を provider map に書き換え、レガシーのトップレベルリアルタイム selector（`talk.mode`、`talk.transport`、`talk.brain`、`talk.model`、`talk.voice`）を `talk.realtime` に書き換えます。

    Doctor は `plugins.allow` が空でなく、ツールポリシーがワイルドカードまたは Plugin 所有ツールエントリを使っている場合にも警告します。`tools.allow: ["*"]` は実際に読み込まれる Plugin のツールにのみ一致します。排他的な Plugin allowlist はバイパスしません。Doctor は移行済みレガシー allowlist 設定に対して `plugins.bundledDiscovery: "compat"` を書き込み、既存の bundled provider 動作を維持したうえで、より厳格な `"allowlist"` 設定を示します。

  </Accordion>
  <Accordion title="2. レガシー設定キーの移行">
    設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` の実行を求めます。

    Doctor は次を行います。

    - 見つかったレガシーキーを説明します。
    - 適用した移行を表示します。
    - 更新済みスキーマで `~/.openclaw/openclaw.json` を書き換えます。

    Gateway の起動はレガシー設定形式を拒否し、`openclaw doctor --fix` の実行を求めます。起動時に `openclaw.json` を書き換えることはありません。Cron ジョブストア移行も `openclaw doctor --fix` によって処理されます。

    現在の移行:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 表示可能な返信ポリシーがない設定済みチャンネル設定 → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → トップレベルの `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - 従来の `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - 従来のトップレベルのリアルタイム Talk セレクター（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`）+ `talk.provider`/`talk.providers` → `talk.realtime`
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
    - 名前付き `accounts` があり、単一アカウント用のトップレベルチャンネル値が残っているチャンネルでは、それらのアカウントスコープ値を、そのチャンネル用に昇格されたアカウントへ移動します（ほとんどのチャンネルでは `accounts.default`。Matrix は既存の一致する名前付き/デフォルトターゲットを保持できます）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` を削除します。低速なプロバイダー/モデルのタイムアウトには `models.providers.<id>.timeoutSeconds` を使用します
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` を削除します（従来の拡張機能リレー設定）
    - 従来の `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 起動時も、`api` が将来の enum 値または未知の enum 値に設定されているプロバイダーはフェイルクローズせずスキップします）

    Doctor の警告には、複数アカウントのチャンネルに対するアカウントデフォルトのガイダンスも含まれます。

    - 2 つ以上の `channels.<channel>.accounts` エントリが設定されていて、`channels.<channel>.defaultAccount` または `accounts.default` がない場合、フォールバックルーティングが予期しないアカウントを選ぶ可能性があると doctor が警告します。
    - `channels.<channel>.defaultAccount` が未知のアカウント ID に設定されている場合、doctor が警告し、設定済みのアカウント ID を一覧表示します。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダーのオーバーライド">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、`@mariozechner/pi-ai` の組み込み OpenCode カタログが上書きされます。これにより、モデルが誤った API に強制されたり、コストがゼロになったりする可能性があります。Doctor は、オーバーライドを削除してモデルごとの API ルーティングとコストを復元できるよう警告します。
  </Accordion>
  <Accordion title="2c. ブラウザー移行と Chrome MCP 準備状況">
    ブラウザー設定が削除済みの Chrome 拡張機能パスをまだ指している場合、doctor はそれを現在のホストローカル Chrome MCP 接続モデルに正規化します。

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になります
    - `browser.relayBindHost` は削除されます

    Doctor は、`defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使用している場合、ホストローカル Chrome MCP パスも監査します。

    - デフォルトの自動接続プロファイルについて、同じホストに Google Chrome がインストールされているかを確認します
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合に警告します
    - ブラウザーの検査ページでリモートデバッグを有効にするよう通知します（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

    Doctor は Chrome 側の設定を有効化できません。ホストローカル Chrome MCP では引き続き次が必要です。

    - Gateway/Node ホスト上の Chromium ベースブラウザー 144+
    - ブラウザーがローカルで実行されていること
    - そのブラウザーでリモートデバッグが有効になっていること
    - ブラウザーで最初の接続同意プロンプトを承認すること

    ここでの準備状況は、ローカル接続の前提条件のみを対象とします。Existing-session は現在の Chrome MCP ルート制限を維持します。`responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなどの高度なルートには、引き続き管理ブラウザーまたは raw CDP プロファイルが必要です。

    このチェックは、Docker、サンドボックス、リモートブラウザー、その他のヘッドレスフローには適用されません。それらは引き続き raw CDP を使用します。

  </Accordion>
  <Accordion title="2d. OAuth TLS の前提条件">
    OpenAI Codex OAuth プロファイルが設定されている場合、doctor は OpenAI 認可エンドポイントをプローブし、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できるか確認します。プローブが証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、自己署名証明書）で失敗した場合、doctor はプラットフォーム固有の修正ガイダンスを出力します。Homebrew Node を使っている macOS では、通常の修正は `brew postinstall ca-certificates` です。`--deep` では、Gateway が正常な場合でもプローブが実行されます。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダーのオーバーライド">
    以前に `models.providers.openai-codex` の下へ従来の OpenAI トランスポート設定を追加していた場合、新しいリリースが自動的に使用する組み込み Codex OAuth プロバイダーパスをそれらが隠してしまう可能性があります。Doctor は、Codex OAuth と並んでそれらの古いトランスポート設定を見つけた場合に警告し、古くなったトランスポートオーバーライドを削除または書き換えて、組み込みのルーティング/フォールバック動作を戻せるようにします。カスタムプロキシとヘッダーのみのオーバーライドは引き続きサポートされ、この警告は発生しません。
  </Accordion>
  <Accordion title="2f. Codex ルート修復">
    Doctor は従来の `openai-codex/*` モデル参照をチェックします。ネイティブ Codex ハーネスルーティングは正規の `openai/*` モデル参照を使用します。OpenAI エージェントターンは、OpenClaw PI OpenAI パスではなく Codex アプリサーバーハーネスを経由します。

    `--fix` / `--repair` モードでは、doctor はデフォルトエージェントとエージェントごとの影響を受ける参照を書き換えます。これにはプライマリモデル、フォールバック、heartbeat/subagent/compaction オーバーライド、フック、チャンネルモデルオーバーライド、古い永続化済みセッションルート状態が含まれます。

    - `openai-codex/gpt-*` は `openai/gpt-*` になります。
    - 一致するエージェントランタイムは、Codex がインストール済み、有効、`codex` ハーネスを提供し、使用可能な OAuth を持つ場合にのみ `agentRuntime.id: "codex"` になります。
    - それ以外の場合、一致するエージェントランタイムは `agentRuntime.id: "pi"` になります。
    - 既存のモデルフォールバックリストは、従来のエントリを書き換えたうえで保持されます。コピーされたモデルごとの設定は、従来のキーから正規の `openai/*` キーへ移動します。
    - 永続化済みセッションの `modelProvider`/`providerOverride`、`model`/`modelOverride`、フォールバック通知、認証プロファイルの固定、Codex ハーネスの固定は、検出されたすべてのエージェントセッションストアで修復されます。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」という意味です。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使用する」という意味です。

  </Accordion>
  <Accordion title="2g. セッションルートのクリーンアップ">
    Doctor は、設定済みモデルまたはランタイムを Codex などの Plugin 所有ルートから移動した後に残る、古い自動作成ルート状態についても、検出されたエージェントセッションストアをスキャンします。

    `openclaw doctor --fix` は、所有元ルートが設定されなくなった場合に、`modelOverrideSource: "auto"` モデル固定、ランタイムモデルメタデータ、固定ハーネス ID、CLI セッションバインディング、自動認証プロファイルオーバーライドなどの、自動作成された古い状態をクリアできます。明示的なユーザーまたは従来セッションのモデル選択は手動レビュー用に報告され、変更されません。そのルートが不要になった場合は、`/model ...`、`/new` で切り替えるか、セッションをリセットしてください。

  </Accordion>
  <Accordion title="3. 従来状態の移行（ディスクレイアウト）">
    Doctor は、古いオンディスクレイアウトを現在の構造へ移行できます。

    - セッションストア + トランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）:
      - 従来の `~/.openclaw/credentials/*.json`（`oauth.json` を除く）から
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートで冪等です。doctor は、バックアップとして従来フォルダーを残す場合に警告を出します。Gateway/CLI も起動時に従来のセッション + エージェントディレクトリを自動移行するため、履歴/認証/モデルは手動で doctor を実行しなくてもエージェントごとのパスに配置されます。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talk プロバイダー/プロバイダーマップの正規化は構造的等価性で比較するようになったため、キー順序だけの差分で `doctor --fix` の変更が何度も発生することはなくなりました。

  </Accordion>
  <Accordion title="3a. 従来の Plugin マニフェスト移行">
    Doctor は、非推奨のトップレベル capability キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）について、インストール済みのすべての Plugin マニフェストをスキャンします。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをその場で書き換えることを提案します。この移行は冪等です。`contracts` キーにすでに同じ値がある場合、データを重複させずに従来のキーが削除されます。
  </Accordion>
  <Accordion title="3b. 従来の Cron ストア移行">
    Doctor は、cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、オーバーライドされている場合は `cron.store`）についても、スケジューラーが互換性のためにまだ受け付けている古いジョブ形状をチェックします。

    現在の cron クリーンアップには次が含まれます。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルのペイロードフィールド（`message`、`model`、`thinking`、...）→ `payload`
    - トップレベルの配信フィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - ペイロードの `provider` 配信エイリアス → 明示的な `delivery.channel`
    - 単純な従来の `notify: true` webhook フォールバックジョブ → `delivery.to=cron.webhook` を伴う明示的な `delivery.mode="webhook"`

    Doctor は、動作を変更せずに実行できる場合にのみ `notify: true` ジョブを自動移行します。ジョブがレガシー通知フォールバックと既存の非 Webhook 配信モードを組み合わせている場合、doctor は警告し、そのジョブを手動レビュー用に残します。

    Linux では、ユーザーの crontab がまだレガシーの `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出している場合にも doctor が警告します。このホストローカルスクリプトは現在の OpenClaw では保守されておらず、cron が systemd user bus に到達できない場合に、誤った `Gateway inactive` メッセージを `~/.openclaw/logs/whatsapp-health.log` に書き込むことがあります。古い crontab エントリは `crontab -e` で削除してください。現在のヘルスチェックには `openclaw channels status --probe`、`openclaw doctor`、`openclaw gateway status` を使用してください。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    Doctor は、すべてのエージェントセッションディレクトリで古い書き込みロックファイル、つまりセッションが異常終了したときに残されたファイルをスキャンします。見つかった各ロックファイルについて、パス、PID、PID がまだ生存しているか、ロックの経過時間、古いと見なされるかどうか（PID が死んでいる、または 30 分より古い）を報告します。`--fix` / `--repair` モードでは古いロックファイルを自動的に削除します。それ以外の場合は注記を出力し、`--fix` で再実行するよう指示します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    Doctor は、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状がないか、エージェントセッション JSONL ファイルをスキャンします。これは、OpenClaw 内部ランタイムコンテキストを含む放棄されたユーザーターンと、同じ表示ユーザープロンプトを含むアクティブな兄弟がある形状です。`--fix` / `--repair` モードでは、doctor は影響を受ける各ファイルを元ファイルの隣にバックアップし、トランスクリプトをアクティブブランチへ書き換えるため、gateway 履歴とメモリリーダーには重複ターンが見えなくなります。
  </Accordion>
  <Accordion title="4. 状態整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の中枢です。これが消えると、セッション、認証情報、ログ、設定が失われます（別の場所にバックアップがない場合）。

    Doctor がチェックする内容:

    - **状態ディレクトリの欠落**: 壊滅的な状態損失について警告し、ディレクトリの再作成を促し、失われたデータは復元できないことを知らせます。
    - **状態ディレクトリの権限**: 書き込み可能性を検証します。権限の修復を提案します（所有者/グループの不一致が検出された場合は `chown` ヒントも出力します）。
    - **macOS のクラウド同期された状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` の下に解決される場合に警告します。同期ベースのパスは I/O の低速化やロック/同期競合を引き起こす可能性があるためです。
    - **Linux の SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合に警告します。SD または eMMC ベースのランダム I/O は、セッションや認証情報の書き込み時に遅く、摩耗も早くなる可能性があるためです。
    - **セッションディレクトリの欠落**: 履歴を永続化し、`ENOENT` クラッシュを避けるには、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプト不一致**: 最近のセッションエントリでトランスクリプトファイルが欠落している場合に警告します。
    - **メインセッションの「1 行 JSONL」**: メイントランスクリプトが 1 行しかない場合にフラグを立てます（履歴が蓄積されていません）。
    - **複数の状態ディレクトリ**: 複数の `~/.openclaw` フォルダがホームディレクトリ間に存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分割される可能性があります）。
    - **リモートモードの注意**: `gateway.mode=remote` の場合、doctor はリモートホストで実行するよう促します（状態はそこに存在します）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全員から読み取り可能な場合に警告し、`600` へ厳格化することを提案します。

  </Accordion>
  <Accordion title="5. モデル認証の健全性（OAuth 有効期限）">
    Doctor は認証ストア内の OAuth プロファイルを検査し、トークンの期限が近い、または期限切れの場合に警告し、安全な場合は更新できます。Anthropic OAuth/トークンプロファイルが古い場合は、Anthropic API キーまたは Anthropic setup-token パスを提案します。更新プロンプトは対話的に実行している場合（TTY）にのみ表示されます。`--non-interactive` は更新試行をスキップします。

    OAuth 更新が永続的に失敗した場合（たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求める場合）、doctor は再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを出力します。

    Doctor は、次の理由で一時的に使用できない認証プロファイルも報告します。

    - 短いクールダウン（レート制限/タイムアウト/認証失敗）
    - より長い無効化（請求/クレジット失敗）

  </Accordion>
  <Accordion title="6. フックモデル検証">
    `hooks.gmail.model` が設定されている場合、doctor はモデル参照をカタログと許可リストに照らして検証し、解決できない、または許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージの修復">
    サンドボックス化が有効な場合、doctor は Docker イメージをチェックし、現在のイメージが欠落している場合はビルドまたはレガシー名への切り替えを提案します。
  </Accordion>
  <Accordion title="7b. Plugin インストールのクリーンアップ">
    Doctor は、`openclaw doctor --fix` / `openclaw doctor --repair` モードで、レガシーな OpenClaw 生成の Plugin 依存関係ステージング状態を削除します。これには、古い生成済み依存関係ルート、古い install-stage ディレクトリ、以前のバンドル Plugin 依存関係修復コードによる package-local な残骸、現在のバンドル済みマニフェストをシャドーする可能性のある、孤立または復元された管理対象 npm コピーのバンドル済み `@openclaw/*` Plugin が含まれます。

    Doctor は、設定で参照されているもののローカル Plugin レジストリが見つけられない、欠落したダウンロード可能 Plugin も再インストールできます。例として、実体のある `plugins.entries`、設定済みのチャンネル/プロバイダー/検索設定、設定済みのエージェントランタイムがあります。パッケージ更新中、doctor はコアパッケージが入れ替えられている間はパッケージマネージャーによる Plugin 修復の実行を避けます。設定済み Plugin の復旧がまだ必要な場合は、更新後に `openclaw doctor --fix` を再度実行してください。Gateway 起動と設定再読み込みはパッケージマネージャーを実行しません。Plugin インストールは明示的な doctor/install/update 作業のままです。

  </Accordion>
  <Accordion title="8. Gateway サービスの移行とクリーンアップヒント">
    Doctor はレガシー gateway サービス（launchd/systemd/schtasks）を検出し、それらを削除して現在の gateway ポートを使用する OpenClaw サービスをインストールすることを提案します。追加の gateway 風サービスをスキャンし、クリーンアップヒントを出力することもできます。プロファイル名付きの OpenClaw gateway サービスは第一級のものと見なされ、「extra」としてフラグ付けされません。

    Linux では、ユーザーレベルの gateway サービスが欠落している一方で、システムレベルの OpenClaw gateway サービスが存在する場合、doctor は 2 つ目のユーザーレベルサービスを自動的にはインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で確認してから、重複を削除するか、システムスーパーバイザーが gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. 起動時の Matrix 移行">
    Matrix チャンネルアカウントに保留中または対応可能なレガシー状態移行がある場合、doctor は（`--fix` / `--repair` モードで）移行前スナップショットを作成し、その後ベストエフォートの移行手順を実行します。レガシー Matrix 状態移行とレガシー暗号化状態準備です。どちらの手順も非致命的で、エラーはログに記録され、起動は続行されます。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証ドリフト">
    Doctor は現在、通常のヘルスパスの一部としてデバイスペアリング状態を検査します。

    報告する内容:

    - 保留中の初回ペアリングリクエスト
    - すでにペアリング済みのデバイスに対する保留中のロールアップグレード
    - すでにペアリング済みのデバイスに対する保留中のスコープアップグレード
    - デバイス id はまだ一致しているが、デバイスアイデンティティが承認済みレコードと一致しなくなった公開鍵不一致の修復
    - 承認済みロールのアクティブトークンが欠落しているペアリング済みレコード
    - スコープが承認済みペアリングベースラインの外へドリフトしたペアリング済みトークン
    - gateway 側のトークンローテーションより前の、または古いスコープメタデータを持つ、現在のマシン用のローカルキャッシュ済みデバイストークンエントリ

    Doctor はペアリングリクエストを自動承認したり、デバイストークンを自動ローテーションしたりしません。代わりに正確な次の手順を出力します。

    - `openclaw devices list` で保留中のリクエストを確認する
    - `openclaw devices approve <requestId>` で正確なリクエストを承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除し、再承認する

    これにより、よくある「すでにペアリング済みなのにまだペアリングが必要と表示される」穴が塞がれます。doctor は初回ペアリング、保留中のロール/スコープアップグレード、古いトークン/デバイスアイデンティティのドリフトを区別するようになりました。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    Doctor は、プロバイダーが許可リストなしで DM に開かれている場合、またはポリシーが危険な方法で設定されている場合に警告を出します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemd ユーザーサービスとして実行している場合、doctor は linger が有効であることを確認し、ログアウト後も gateway が生存し続けるようにします。
  </Accordion>
  <Accordion title="11. ワークスペース状態（Skills、Plugin、レガシーディレクトリ）">
    Doctor はデフォルトエージェントのワークスペース状態の概要を出力します。

    - **Skills 状態**: 対象、要件欠落、許可リストでブロックされた Skills の数を数えます。
    - **レガシーワークスペースディレクトリ**: 現在のワークスペースと並んで `~/openclaw` またはその他のレガシーワークスペースディレクトリが存在する場合に警告します。
    - **Plugin 状態**: 有効/無効/エラーの Plugin 数を数えます。エラーがある場合は Plugin ID を一覧表示し、バンドル Plugin の機能を報告します。
    - **Plugin 互換性警告**: 現在のランタイムとの互換性問題がある Plugin にフラグを立てます。
    - **Plugin 診断**: Plugin レジストリがロード時に出力した警告またはエラーを表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    Doctor は、ワークスペースブートストラップファイル（たとえば `AGENTS.md`、`CLAUDE.md`、またはその他の注入されたコンテキストファイル）が、設定された文字数予算に近い、または超えているかをチェックします。ファイルごとの生文字数と注入後文字数、切り捨て率、切り捨て原因（`max/file` または `max/total`）、合計予算に対する合計注入文字数を報告します。ファイルが切り捨てられている、または制限に近い場合、doctor は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` の調整ヒントを出力します。
  </Accordion>
  <Accordion title="11d. 古いチャンネル Plugin のクリーンアップ">
    `openclaw doctor --fix` が欠落したチャンネル Plugin を削除する場合、その Plugin を参照していたぶら下がったチャンネルスコープ設定も削除します。`channels.<id>` エントリ、そのチャンネルを指定していた heartbeat ターゲット、`agents.*.models["<channel>/*"]` オーバーライドです。これにより、チャンネルランタイムがなくなったにもかかわらず設定が gateway にバインドを要求し続ける Gateway ブートループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    Doctor は、現在のシェル（zsh、bash、fish、または PowerShell）にタブ補完がインストールされているかをチェックします。

    - シェルプロファイルが低速な動的補完パターン（`source <(openclaw completion ...)`）を使用している場合、doctor はそれをより高速なキャッシュファイル方式へアップグレードします。
    - 補完がプロファイルで設定されているがキャッシュファイルが欠落している場合、doctor はキャッシュを自動的に再生成します。
    - 補完がまったく設定されていない場合、doctor はインストールを促します（対話モードのみ。`--non-interactive` ではスキップされます）。

    キャッシュを手動で再生成するには、`openclaw completion --write-state` を実行してください。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック（ローカルトークン）">
    Doctor はローカル gateway トークン認証の準備状態をチェックします。

    - トークンモードでトークンが必要で、トークンソースが存在しない場合、doctor は生成を提案します。
    - `gateway.auth.token` が SecretRef 管理だが利用できない場合、doctor は警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、実行時のフェイルファスト動作を弱めずに、設定済みの認証情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象を絞った設定修復に、status 系コマンドと同じ読み取り専用の SecretRef 要約モデルを使うようになりました。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` `@username` 修復は、利用可能な場合に設定済みのボット認証情報を使おうとします。
    - Telegram ボットトークンが SecretRef 経由で設定されているものの、現在のコマンドパスで利用できない場合、doctor はその認証情報が設定済みだが利用不可であることを報告し、トークンが欠落していると誤報したりクラッシュしたりせず、自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway ヘルスチェック + 再起動">
    doctor はヘルスチェックを実行し、Gateway が正常でないように見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状況">
    doctor は、設定済みのメモリ検索埋め込みプロバイダーがデフォルトエージェントで利用可能かどうかを確認します。動作は、設定済みのバックエンドとプロバイダーによって異なります。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動できるかを調べます。できない場合は、npm パッケージと手動バイナリパスのオプションを含む修正ガイダンスを表示します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイル、または認識済みのリモート/ダウンロード可能なモデル URL を確認します。欠落している場合は、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー** (`openai`, `voyage` など): API キーが環境または認証ストアに存在することを検証します。欠落している場合は、実行可能な修正ヒントを表示します。
    - **自動プロバイダー**: まずローカルモデルの利用可否を確認し、その後、自動選択順で各リモートプロバイダーを試します。

    キャッシュされた Gateway プローブ結果が利用可能な場合（チェック時点で Gateway が正常だった場合）、doctor はその結果を CLI から見える設定と照合し、不一致があれば示します。doctor はデフォルトパスで新しい埋め込み ping を開始しません。ライブのプロバイダーチェックが必要な場合は、詳細メモリステータスコマンドを使ってください。

    実行時の埋め込み準備状況を検証するには、`openclaw memory status --deep` を使います。

  </Accordion>
  <Accordion title="14. チャネルステータス警告">
    Gateway が正常な場合、doctor はチャネルステータスのプローブを実行し、推奨される修正とともに警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー設定の監査 + 修復">
    doctor は、インストール済みのスーパーバイザー設定（launchd/systemd/schtasks）に、欠落または古いデフォルト（例: systemd の network-online 依存関係と再起動遅延）がないかを確認します。不一致が見つかった場合は更新を推奨し、サービスファイル/タスクを現在のデフォルトに書き換えられます。

    注:

    - `openclaw doctor` は、スーパーバイザー設定を書き換える前に確認します。
    - `openclaw doctor --yes` は、デフォルトの修復プロンプトを承認します。
    - `openclaw doctor --repair` は、推奨される修正をプロンプトなしで適用します。
    - `openclaw doctor --repair --force` は、カスタムのスーパーバイザー設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、Gateway サービスライフサイクルについて doctor を読み取り専用に保ちます。サービスの健全性は引き続き報告し、サービス以外の修復も実行しますが、外部スーパーバイザーがそのライフサイクルを所有しているため、サービスの install/start/restart/bootstrap、スーパーバイザー設定の書き換え、レガシーサービスのクリーンアップはスキップします。
    - Linux では、一致する systemd Gateway ユニットがアクティブな間、doctor はコマンド/エントリーポイントのメタデータを書き換えません。また、重複サービススキャン中に非アクティブな非レガシーの追加 Gateway 風ユニットを無視するため、付随するサービスファイルによってクリーンアップのノイズが発生しません。
    - トークン認証がトークンを必要とし、`gateway.auth.token` が SecretRef 管理の場合、doctor のサービスインストール/修復は SecretRef を検証しますが、解決済みの平文トークン値をスーパーバイザーサービスの環境メタデータに永続化しません。
    - doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストールがインラインで埋め込んだ、管理対象の `.env`/SecretRef 由来のサービス環境値を検出し、それらの値がスーパーバイザー定義ではなく実行時ソースから読み込まれるようにサービスメタデータを書き換えます。
    - doctor は、`gateway.port` の変更後もサービスコマンドが古い `--port` を固定している場合に検出し、サービスメタデータを現在のポートに書き換えます。
    - トークン認証がトークンを必要とし、設定済みのトークン SecretRef が未解決の場合、doctor は実行可能なガイダンスとともにインストール/修復パスをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、doctor は mode が明示的に設定されるまでインストール/修復をブロックします。
    - Linux のユーザー systemd ユニットでは、doctor のトークンドリフトチェックが、サービス認証メタデータの比較時に `Environment=` と `EnvironmentFile=` の両方のソースを含むようになりました。
    - doctor のサービス修復は、設定が新しいバージョンによって最後に書き込まれている場合、古い OpenClaw バイナリの Gateway サービスを書き換えたり、停止したり、再起動したりすることを拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` によって、いつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway 実行時 + ポート診断">
    doctor はサービス実行時（PID、直近の終了ステータス）を検査し、サービスがインストールされているのに実際には実行されていない場合に警告します。また、Gateway ポート（デフォルト `18789`）でのポート衝突も確認し、考えられる原因（Gateway がすでに実行中、SSH トンネル）を報告します。
  </Accordion>
  <Accordion title="17. Gateway 実行時のベストプラクティス">
    doctor は、Gateway サービスが Bun またはバージョン管理された Node パス（`nvm`, `fnm`, `volta`, `asdf` など）で実行されている場合に警告します。WhatsApp + Telegram チャネルには Node が必要であり、サービスはシェル初期化を読み込まないため、バージョンマネージャーのパスはアップグレード後に壊れる可能性があります。doctor は、利用可能な場合にシステム Node インストール（Homebrew/apt/choco）への移行を提案します。

    新規インストールまたは修復された macOS LaunchAgent は、対話型シェルの PATH をコピーする代わりに、正規のシステム PATH（`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`）を使います。そのため、Volta、asdf、fnm、pnpm、およびその他のバージョンマネージャーディレクトリによって、どの Node 子プロセスが解決されるかは変わりません。Linux サービスは明示的な環境ルート（`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`）と安定した user-bin ディレクトリを引き続き保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、それらのディレクトリがディスク上に存在する場合にのみサービス PATH に書き込まれます。

  </Accordion>
  <Accordion title="18. 設定書き込み + ウィザードメタデータ">
    doctor は設定変更を永続化し、doctor 実行を記録するためにウィザードメタデータを刻印します。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント（バックアップ + メモリシステム）">
    doctor は、ワークスペースメモリシステムが欠落している場合に提案し、ワークスペースがまだ git 管理下にない場合はバックアップのヒントを表示します。

    ワークスペース構造と git バックアップ（非公開の GitHub または GitLab を推奨）の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
