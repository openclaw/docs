---
read_when:
    - doctor マイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: 'doctor コマンド: ヘルスチェック、設定移行、修復手順'
title: 診断
x-i18n:
    generated_at: "2026-05-07T01:52:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d76a31a8f2197e226894f90fb534f53acf969b75ca1dfdf438a26059880e7ab2
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` は OpenClaw の修復 + 移行ツールです。古くなった設定や状態を修正し、ヘルスを確認して、実行可能な修復手順を提示します。

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

    プロンプトを出さずに既定値を受け入れます（該当する場合は再起動、サービス、サンドボックスの修復手順も含む）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    プロンプトを出さずに推奨修復を適用します（安全な場合は修復 + 再起動）。

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

    プロンプトなしで実行し、安全な移行のみを適用します（設定の正規化 + ディスク上の状態移動）。人による確認が必要な再起動、サービス、サンドボックスの操作はスキップします。レガシー状態の移行は検出された場合に自動実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の Gateway インストールをシステムサービスからスキャンします（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

書き込み前に変更内容を確認したい場合は、まず設定ファイルを開きます。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="ヘルス、UI、更新">
    - git インストール向けの任意の事前更新（対話モードのみ）。
    - UI プロトコルの鮮度チェック（プロトコルスキーマが新しい場合に Control UI を再ビルド）。
    - ヘルスチェック + 再起動プロンプト。
    - Skills 状態サマリー（対象/不足/ブロック）と Plugin 状態。

  </Accordion>
  <Accordion title="設定と移行">
    - レガシー値の設定正規化。
    - レガシーなフラット `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk 設定移行。
    - レガシー Chrome 拡張機能設定と Chrome MCP 準備状況のブラウザー移行チェック。
    - OpenCode プロバイダー override 警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth shadowing 警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth プロファイル向け OAuth TLS 前提条件チェック。
    - `plugins.allow` が制限的なのに、ツールポリシーがワイルドカードまたは Plugin 所有ツールをまだ要求している場合の Plugin/ツール許可リスト警告。
    - レガシーなディスク上の状態移行（セッション/agent ディレクトリ/WhatsApp 認証）。
    - レガシー Plugin マニフェスト contract キー移行（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - レガシー Cron ストア移行（`jobId`, `schedule.cron`, トップレベルの delivery/payload フィールド、payload `provider`, 単純な `notify: true` Webhook フォールバックジョブ）。
    - レガシー agent ランタイムポリシーの `agents.defaults.agentRuntime` と `agents.list[].agentRuntime` への移行。
    - plugins が有効な場合の古い Plugin 設定のクリーンアップ。`plugins.enabled=false` の場合、古い Plugin 参照は無害な封じ込め設定として扱われ、保持されます。

  </Accordion>
  <Accordion title="状態と整合性">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受けた 2026.4.24 ビルドで作成された、重複した prompt-rewrite ブランチに対するセッショントランスクリプト修復。
    - 詰まった subagent 再起動リカバリ tombstone の検出。`--fix` により、古い aborted recovery フラグをクリアして、起動時に child を restart-aborted として扱い続けないようにできます。
    - 状態の整合性と権限チェック（セッション、トランスクリプト、状態ディレクトリ）。
    - ローカル実行時の設定ファイル権限チェック（chmod 600）。
    - モデル認証ヘルス: OAuth の有効期限を確認し、期限切れが近いトークンを更新でき、auth-profile の cooldown/disabled 状態を報告します。
    - 追加 workspace ディレクトリの検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、サービス、supervisor">
    - サンドボックスが有効な場合のサンドボックスイメージ修復。
    - レガシーサービス移行と追加 Gateway 検出。
    - Matrix チャネルのレガシー状態移行（`--fix` / `--repair` モード）。
    - Gateway ランタイムチェック（サービスはインストール済みだが実行中ではない、キャッシュされた launchd label）。
    - チャネル状態警告（実行中の Gateway から probe）。
    - ローカル TUI クライアントがまだ実行中の場合に、Gateway event-loop ヘルス低下に対する WhatsApp 応答性をチェックします。`--fix` は検証済みのローカル TUI クライアントだけを停止します。
    - primary models、fallback、heartbeat/subagent/compaction override、hook、channel model override、session route pin 内のレガシー `openai-codex/*` モデル参照に対する Codex route 修復。`--fix` はそれらを `openai/*` に書き換え、Codex Plugin がインストール済み、有効、`codex` harness を提供し、利用可能な OAuth を持つ場合にのみ `agentRuntime.id: "codex"` を選択します。それ以外の場合は `agentRuntime.id: "pi"` を選択します。
    - 任意修復付きの supervisor 設定監査（launchd/systemd/schtasks）。
    - インストールまたは更新時に shell の `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取り込んだ Gateway サービス向けの組み込み proxy 環境クリーンアップ。
    - Gateway ランタイムのベストプラクティスチェック（Node と Bun、version-manager パス）。
    - Gateway ポート衝突診断（既定 `18789`）。

  </Accordion>
  <Accordion title="認証、セキュリティ、ペアリング">
    - open DM ポリシーに関するセキュリティ警告。
    - ローカルトークンモード向け Gateway 認証チェック（トークン source が存在しない場合にトークン生成を提案。token SecretRef 設定は上書きしません）。
    - デバイスペアリングの問題検出（保留中の初回ペアリクエスト、保留中の role/scope upgrade、古いローカル device-token キャッシュのずれ、paired-record 認証のずれ）。

  </Accordion>
  <Accordion title="workspace と shell">
    - Linux 上の systemd linger チェック。
    - workspace bootstrap ファイルサイズチェック（context ファイルの切り詰め/上限近接警告）。
    - default agent 向け Skills 準備状況チェック。不足している bin、env、config、OS 要件がある許可済み Skills を報告し、`--fix` で利用不可の Skills を `skills.entries` 内で無効化できます。
    - shell completion 状態チェックと自動インストール/アップグレード。
    - メモリ検索 embedding provider 準備状況チェック（ローカルモデル、リモート API key、または QMD binary）。
    - source install チェック（pnpm workspace 不一致、不足している UI assets、不足している tsx binary）。
    - 更新済み設定 + ウィザード metadata を書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI の backfill と reset

Control UI の Dreams scene には、grounded dreaming workflow 向けの **Backfill**、**Reset**、**Clear Grounded** action が含まれます。これらの action は gateway doctor 風の RPC method を使用しますが、`openclaw doctor` CLI 修復/移行の一部では**ありません**。

実行内容:

- **Backfill** は active workspace 内の履歴 `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM diary pass を実行して、reversible backfill entries を `DREAMS.md` に書き込みます。
- **Reset** は `DREAMS.md` から、それらの marked backfill diary entries だけを削除します。
- **Clear Grounded** は、historical replay 由来で、まだ live recall や daily support が蓄積されていない staged grounded-only short-term entries だけを削除します。

それ自体では実行**しない**こと:

- `MEMORY.md` を編集しません
- full doctor migration を実行しません
- staged CLI path を明示的に先に実行しない限り、grounded candidate を live short-term promotion store へ自動的に stage しません

grounded historical replay を通常の deep promotion lane に反映させたい場合は、代わりに CLI flow を使用します。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` を review surface として維持しながら、grounded durable candidates を short-term dreaming store に stage します。

## 詳細な挙動と根拠

<AccordionGroup>
  <Accordion title="0. 任意の更新（git インストール）">
    これが git checkout で doctor が対話モードで実行されている場合、doctor を実行する前に更新（fetch/rebase/build）を提案します。
  </Accordion>
  <Accordion title="1. 設定の正規化">
    設定にレガシーな値の形（たとえば channel-specific override なしの `messages.ackReaction`）が含まれる場合、doctor はそれらを現在のスキーマに正規化します。

    これにはレガシーな Talk flat フィールドも含まれます。現在の公開 Talk speech config は `talk.provider` + `talk.providers.<provider>` で、realtime voice config は `talk.realtime.*` です。Doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形状を provider map に書き換え、レガシーなトップレベル realtime selector（`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`）を `talk.realtime` に書き換えます。

    Doctor はまた、`plugins.allow` が空でなく、ツールポリシーが
    wildcard または plugin-owned tool entry を使用している場合に警告します。`tools.allow: ["*"]` は、実際に読み込まれる plugins
    由来のツールにのみ一致します。exclusive plugin
    allowlist を迂回するものではありません。Doctor は、移行された
    レガシー allowlist config に `plugins.bundledDiscovery: "compat"` を書き込み、既存の bundled provider behavior を保持したうえで、
    より厳格な `"allowlist"` 設定を示します。

  </Accordion>
  <Accordion title="2. レガシー設定キーの移行">
    設定に deprecated key が含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` の実行を求めます。

    Doctor は次を実行します。

    - 見つかったレガシーキーを説明します。
    - 適用した移行を表示します。
    - 更新済みスキーマで `~/.openclaw/openclaw.json` を書き換えます。

    Gateway startup はレガシー設定形式を拒否し、`openclaw doctor --fix` の実行を求めます。startup 時に `openclaw.json` を書き換えることはありません。Cron job store の移行も `openclaw doctor --fix` により処理されます。

    現在の移行:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 表示可能な返信ポリシーがない構成済みチャンネル設定 → `messages.groupChat.visibleReplies: "message_tool"`
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
    - 名前付き `accounts` があるものの、単一アカウント用のトップレベルチャンネル値が残っているチャンネルでは、それらのアカウントスコープ値を、そのチャンネル用に選ばれた昇格済みアカウントへ移動します（ほとんどのチャンネルでは `accounts.default`。Matrix では既存の一致する名前付き/デフォルトターゲットを保持できます）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` を削除します。遅いプロバイダー/モデルのタイムアウトには `models.providers.<id>.timeoutSeconds` を使います
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` を削除します（従来の拡張機能リレー設定）
    - 従来の `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 起動時も、`api` が将来または不明な列挙値に設定されたプロバイダーは、閉じて失敗するのではなくスキップします）

    doctor の警告には、マルチアカウントチャンネル向けのアカウントデフォルト案内も含まれます。

    - 2 つ以上の `channels.<channel>.accounts` エントリーが `channels.<channel>.defaultAccount` または `accounts.default` なしで構成されている場合、フォールバックルーティングで予期しないアカウントが選ばれる可能性があると doctor が警告します。
    - `channels.<channel>.defaultAccount` が不明なアカウント ID に設定されている場合、doctor が警告し、構成済みアカウント ID を一覧表示します。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダー上書き">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、`@mariozechner/pi-ai` の組み込み OpenCode カタログを上書きします。その結果、モデルが誤った API に強制されたり、コストがゼロになったりする可能性があります。doctor は、上書きを削除してモデルごとの API ルーティングとコストを復元できるように警告します。
  </Accordion>
  <Accordion title="2c. ブラウザー移行と Chrome MCP 準備状況">
    ブラウザー設定が削除済みの Chrome 拡張機能パスをまだ指している場合、doctor は現在のホストローカル Chrome MCP アタッチモデルへ正規化します。

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になります
    - `browser.relayBindHost` は削除されます

    `defaultProfile: "user"` または構成済みの `existing-session` プロファイルを使っている場合、doctor はホストローカル Chrome MCP パスも監査します。

    - デフォルトの自動接続プロファイルについて、同じホストに Google Chrome がインストールされているか確認します
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合に警告します
    - ブラウザーの検査ページでリモートデバッグを有効にするよう促します（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

    doctor は Chrome 側の設定を代わりに有効化できません。ホストローカル Chrome MCP には引き続き次が必要です。

    - Gateway/Node ホスト上の Chromium ベースのブラウザー 144+
    - ブラウザーがローカルで実行されていること
    - そのブラウザーでリモートデバッグが有効になっていること
    - ブラウザー内の初回アタッチ同意プロンプトを承認すること

    ここでの準備状況は、ローカルアタッチの前提条件のみを対象とします。Existing-session は現在の Chrome MCP ルート制限を保持します。`responsebody`、PDF エクスポート、ダウンロードのインターセプト、バッチアクションなどの高度なルートには、引き続き管理対象ブラウザーまたは生の CDP プロファイルが必要です。

    このチェックは Docker、sandbox、remote-browser、またはその他のヘッドレスフローには**適用されません**。これらは引き続き生の CDP を使います。

  </Accordion>
  <Accordion title="2d. OAuth TLS の前提条件">
    OpenAI Codex OAuth プロファイルが構成されている場合、doctor は OpenAI 認可エンドポイントをプローブし、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できることを確認します。プローブが証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、自己署名証明書）で失敗した場合、doctor はプラットフォーム固有の修正案内を表示します。Homebrew Node を使っている macOS では、通常の修正は `brew postinstall ca-certificates` です。`--deep` では、Gateway が正常でもプローブが実行されます。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダー上書き">
    以前に `models.providers.openai-codex` の下へ従来の OpenAI トランスポート設定を追加していた場合、新しいリリースが自動的に使う組み込み Codex OAuth プロバイダーパスを隠してしまうことがあります。doctor は、Codex OAuth と並んでこれらの古いトランスポート設定を検出すると警告し、古くなったトランスポート上書きを削除または書き換えて、組み込みのルーティング/フォールバック動作を戻せるようにします。カスタムプロキシとヘッダーのみの上書きは引き続きサポートされ、この警告は発生しません。
  </Accordion>
  <Accordion title="2f. Codex ルート修復">
    doctor は従来の `openai-codex/*` モデル参照をチェックします。ネイティブ Codex ハーネスルーティングでは、標準の `openai/*` モデル参照と `agentRuntime.id: "codex"` を使い、ターンが OpenClaw PI OpenAI パスではなく Codex アプリサーバーハーネスを通るようにします。

    `--fix` / `--repair` モードでは、doctor は影響を受けるデフォルトエージェントおよびエージェントごとの参照を書き換えます。対象には、プライマリモデル、フォールバック、Heartbeat/subagent/Compaction 上書き、フック、チャンネルモデル上書き、古くなった永続セッションルート状態が含まれます。

    - `openai-codex/gpt-*` は `openai/gpt-*` になります。
    - 一致するエージェントランタイムは、Codex がインストール済み、有効、`codex` ハーネスを提供、かつ使用可能な OAuth がある場合にのみ `agentRuntime.id: "codex"` になります。
    - それ以外の場合、一致するエージェントランタイムは `agentRuntime.id: "pi"` になります。
    - 既存のモデルフォールバックリストは、従来のエントリーを書き換えたうえで保持されます。コピーされたモデルごとの設定は、従来のキーから標準の `openai/*` キーへ移動します。
    - 永続化されたセッションの `modelProvider`/`providerOverride`、`model`/`modelOverride`、フォールバック通知、認証プロファイルの固定、Codex ハーネスの固定は、検出されたすべてのエージェントセッションストアで修復されます。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」ことを意味します。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使う」ことを意味します。

  </Accordion>
  <Accordion title="2g. セッションルートのクリーンアップ">
    doctor は、Codex のような Plugin 所有ルートから構成済みモデルまたはランタイムを移動した後に残る、古い自動作成ルート状態についても、検出されたエージェントセッションストアをスキャンします。

    `openclaw doctor --fix` は、`modelOverrideSource: "auto"` のモデル固定、ランタイムモデルメタデータ、固定されたハーネス ID、CLI セッションバインディング、自動認証プロファイル上書きなど、所有ルートがもう構成されていない場合の自動作成された古い状態をクリアできます。明示的なユーザーまたは従来セッションのモデル選択は手動レビュー用に報告され、変更されません。そのルートがもう意図されていない場合は、`/model ...`、`/new`、またはセッションのリセットで切り替えます。

  </Accordion>
  <Accordion title="3. 従来状態の移行（ディスクレイアウト）">
    doctor は、古いオンディスクレイアウトを現在の構造へ移行できます。

    - セッションストア + トランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）:
      - 従来の `~/.openclaw/credentials/*.json`（`oauth.json` を除く）から
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートかつ冪等です。doctor は、バックアップとして従来フォルダーを残す場合に警告を出します。Gateway/CLI も起動時に従来のセッションとエージェントディレクトリを自動移行するため、手動で doctor を実行しなくても、履歴/認証/モデルはエージェントごとのパスに配置されます。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talk プロバイダー/プロバイダーマップの正規化は現在、構造的等価性で比較するため、キー順序だけの差分で no-op の `doctor --fix` 変更が繰り返し発生することはなくなりました。

  </Accordion>
  <Accordion title="3a. 従来の Plugin マニフェスト移行">
    doctor は、インストール済みのすべての Plugin マニフェストをスキャンし、非推奨のトップレベル機能キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）を探します。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをインプレースで書き換える提案をします。この移行は冪等です。`contracts` キーに同じ値がすでにある場合、データを重複させずに従来キーを削除します。
  </Accordion>
  <Accordion title="3b. 従来の Cron ストア移行">
    doctor は、Cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、上書き時は `cron.store`）についても、スケジューラーが互換性のために引き続き受け入れる古いジョブ形状をチェックします。

    現在の Cron クリーンアップには次が含まれます。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルのペイロードフィールド（`message`、`model`、`thinking`、...）→ `payload`
    - トップレベルの配信フィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - ペイロードの `provider` 配信エイリアス → 明示的な `delivery.channel`
    - 永続化された無効な Cron `payload.model` センチネル（`"default"`、`"null"`、空文字列、JSON `null`）→ モデル上書きを削除
    - 単純な従来の `notify: true` Webhook フォールバックジョブ → `delivery.to=cron.webhook` を伴う明示的な `delivery.mode="webhook"`

    診断機能は、動作を変更せずに実行できる場合にのみ `notify: true` ジョブを自動移行します。ジョブがレガシーの通知フォールバックと既存の非Webhook配信モードを組み合わせている場合、診断機能は警告を出し、そのジョブを手動レビュー対象として残します。

    Linux では、ユーザーの crontab がまだレガシーの `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出している場合にも診断機能が警告します。このホストローカルスクリプトは現在の OpenClaw では保守されておらず、Cron が systemd user bus に到達できない場合に、誤った `Gateway inactive` メッセージを `~/.openclaw/logs/whatsapp-health.log` に書き込むことがあります。古い crontab エントリは `crontab -e` で削除してください。現在のヘルスチェックには `openclaw channels status --probe`、`openclaw doctor`、`openclaw gateway status` を使用してください。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    診断機能は、すべてのエージェントセッションディレクトリで古い書き込みロックファイル、つまりセッションが異常終了したときに残されたファイルをスキャンします。見つかった各ロックファイルについて、パス、PID、PID がまだ生存しているか、ロックの経過時間、古いと見なされるかどうか（死んだ PID または 30 分超）を報告します。`--fix` / `--repair` モードでは古いロックファイルを自動的に削除します。それ以外の場合は注記を出力し、`--fix` を付けて再実行するよう指示します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    診断機能は、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状がないか、エージェントセッションの JSONL ファイルをスキャンします。これは、OpenClaw 内部ランタイムコンテキストを持つ放棄されたユーザーターンと、同じ可視ユーザープロンプトを含むアクティブな兄弟ターンです。`--fix` / `--repair` モードでは、診断機能は影響を受ける各ファイルを元ファイルの隣にバックアップし、トランスクリプトをアクティブブランチへ書き換えるため、Gateway 履歴とメモリリーダーが重複ターンを見なくなります。
  </Accordion>
  <Accordion title="4. 状態整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の中枢です。これが消えると、セッション、認証情報、ログ、設定が失われます（別の場所にバックアップがある場合を除く）。

    診断機能は次をチェックします。

    - **状態ディレクトリがない**: 壊滅的な状態損失について警告し、ディレクトリの再作成を促し、失われたデータは復旧できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能性を検証します。権限の修復を提案し、所有者/グループの不一致が検出された場合は `chown` のヒントを出力します。
    - **macOS のクラウド同期状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` の下に解決される場合に警告します。同期バックエンドのパスは I/O の低速化やロック/同期競合を引き起こす可能性があります。
    - **Linux の SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合に警告します。SD または eMMC バックエンドのランダム I/O は、セッションや認証情報の書き込み時に遅くなり、摩耗が早まる可能性があります。
    - **セッションディレクトリがない**: 履歴を永続化し、`ENOENT` クラッシュを避けるには、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプト不一致**: 最近のセッションエントリにトランスクリプトファイルがない場合に警告します。
    - **メインセッションの「1行JSONL」**: メイントランスクリプトが 1 行しかない場合にフラグを立てます（履歴が蓄積されていません）。
    - **複数の状態ディレクトリ**: 複数の `~/.openclaw` フォルダがホームディレクトリ間に存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分割される可能性があります）。
    - **リモートモードのリマインダー**: `gateway.mode=remote` の場合、診断機能はリモートホストで実行するよう通知します（状態はそこにあります）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全員に読み取り可能な場合に警告し、`600` へ厳格化することを提案します。

  </Accordion>
  <Accordion title="5. モデル認証の健全性（OAuth 有効期限）">
    診断機能は認証ストア内の OAuth プロファイルを検査し、トークンが期限切れ間近または期限切れの場合に警告し、安全な場合は更新できます。Anthropic OAuth/トークンプロファイルが古い場合は、Anthropic API キーまたは Anthropic setup-token パスを提案します。更新プロンプトは対話的に実行している場合（TTY）にのみ表示されます。`--non-interactive` では更新の試行をスキップします。

    OAuth 更新が恒久的に失敗した場合（たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求めた場合）、診断機能は再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを出力します。

    診断機能は、次の理由で一時的に使用できない認証プロファイルも報告します。

    - 短いクールダウン（レート制限/タイムアウト/認証失敗）
    - 長い無効化（請求/クレジット失敗）

  </Accordion>
  <Accordion title="6. フックモデル検証">
    `hooks.gmail.model` が設定されている場合、診断機能はモデル参照をカタログおよび許可リストと照合して検証し、解決できない場合や許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージ修復">
    サンドボックス化が有効な場合、診断機能は Docker イメージをチェックし、現在のイメージがない場合はビルドまたはレガシー名への切り替えを提案します。
  </Accordion>
  <Accordion title="7b. Plugin インストールのクリーンアップ">
    診断機能は、`openclaw doctor --fix` / `openclaw doctor --repair` モードで、OpenClaw が生成したレガシーなPlugin依存関係ステージング状態を削除します。これには、古い生成済み依存関係ルート、古いインストールステージディレクトリ、以前のバンドルPlugin依存関係修復コードによるパッケージローカルの残骸、現在のバンドルマニフェストを隠してしまう可能性がある、孤立または復旧された管理対象 npm コピーのバンドル `@openclaw/*` Plugin が含まれます。

    設定がダウンロード可能なPluginを参照しているものの、ローカルPluginレジストリで見つからない場合、診断機能はそれらを再インストールすることもできます。例には、実体のある `plugins.entries`、設定済みのチャネル/プロバイダー/検索設定、設定済みのエージェントランタイムが含まれます。パッケージ更新中、診断機能はコアパッケージの入れ替え中にパッケージマネージャーによるPlugin修復を実行しないようにします。設定済みPluginの復旧がまだ必要な場合は、更新後に `openclaw doctor --fix` を再度実行してください。Gateway 起動と設定リロードはパッケージマネージャーを実行しません。Plugin インストールは明示的な診断/インストール/更新作業のままです。

  </Accordion>
  <Accordion title="8. Gateway サービスの移行とクリーンアップのヒント">
    診断機能はレガシー Gateway サービス（launchd/systemd/schtasks）を検出し、それらを削除して現在の Gateway ポートを使用する OpenClaw サービスをインストールすることを提案します。追加の Gateway 風サービスをスキャンし、クリーンアップのヒントを出力することもできます。プロファイル名付きの OpenClaw Gateway サービスは第一級のものと見なされ、「余分」としてフラグ付けされません。

    Linux では、ユーザーレベルの Gateway サービスがない一方でシステムレベルの OpenClaw Gateway サービスが存在する場合、診断機能は 2 つ目のユーザーレベルサービスを自動的にはインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で検査し、重複を削除するか、システムスーパーバイザーが Gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. 起動時の Matrix 移行">
    Matrix チャネルアカウントに保留中または対応可能なレガシー状態移行がある場合、診断機能は（`--fix` / `--repair` モードで）移行前スナップショットを作成し、その後ベストエフォートの移行手順を実行します。レガシー Matrix 状態移行と、レガシー暗号化状態の準備です。どちらの手順も致命的ではありません。エラーはログに記録され、起動は続行します。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証ドリフト">
    診断機能は現在、通常のヘルスパスの一部としてデバイスペアリング状態を検査します。

    報告内容:

    - 初回ペアリングリクエストの保留
    - すでにペアリング済みのデバイスに対するロールアップグレードの保留
    - すでにペアリング済みのデバイスに対するスコープアップグレードの保留
    - デバイス ID はまだ一致しているが、デバイス ID が承認済みレコードと一致しなくなった公開鍵不一致の修復
    - 承認済みロールに対するアクティブトークンがないペアリング済みレコード
    - 承認済みペアリングベースラインの外へスコープがドリフトしたペアリング済みトークン
    - 現在のマシンのローカルキャッシュ済みデバイストークンエントリのうち、Gateway 側のトークンローテーションより古いもの、または古いスコープメタデータを持つもの

    診断機能はペアリングリクエストを自動承認したり、デバイストークンを自動ローテーションしたりしません。代わりに、正確な次の手順を出力します。

    - `openclaw devices list` で保留中のリクエストを検査する
    - `openclaw devices approve <requestId>` で正確なリクエストを承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除して再承認する

    これにより、よくある「すでにペアリング済みなのにまだペアリングが必要と表示される」抜け穴が閉じられます。診断機能は現在、初回ペアリング、保留中のロール/スコープアップグレード、古いトークン/デバイス ID のドリフトを区別します。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    プロバイダーが許可リストなしで DM に対して開かれている場合、またはポリシーが危険な方法で設定されている場合、診断機能は警告を出します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemd ユーザーサービスとして実行している場合、診断機能はログアウト後も Gateway が稼働し続けるよう linger が有効であることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペースのステータス（Skills、Plugin、レガシーディレクトリ）">
    診断機能はデフォルトエージェントのワークスペース状態の概要を出力します。

    - **Skillsステータス**: 対象、要件不足、許可リストによるブロックの Skills 数を数えます。
    - **レガシーワークスペースディレクトリ**: `~/openclaw` またはその他のレガシーワークスペースディレクトリが現在のワークスペースと並んで存在する場合に警告します。
    - **Pluginステータス**: 有効/無効/エラーのPlugin数を数えます。エラーがある場合はPlugin IDを一覧表示し、バンドルPlugin機能を報告します。
    - **Plugin互換性警告**: 現在のランタイムと互換性の問題があるPluginにフラグを立てます。
    - **Plugin診断**: Pluginレジストリが出力した読み込み時の警告またはエラーを表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    診断機能は、ワークスペースのブートストラップファイル（たとえば `AGENTS.md`、`CLAUDE.md`、その他の注入済みコンテキストファイル）が、設定された文字数予算に近いか超えているかをチェックします。ファイルごとの生の文字数と注入後の文字数、切り詰め率、切り詰め原因（`max/file` または `max/total`）、合計注入文字数が総予算に占める割合を報告します。ファイルが切り詰められている、または上限に近い場合、診断機能は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` の調整に関するヒントを出力します。
  </Accordion>
  <Accordion title="11d. 古いチャネルPluginのクリーンアップ">
    `openclaw doctor --fix` が見つからないチャネルPluginを削除する場合、そのPluginを参照していた未解決のチャネルスコープ設定も削除します。`channels.<id>` エントリ、チャネル名を指定していた Heartbeat ターゲット、`agents.*.models["<channel>/*"]` オーバーライドです。これにより、チャネルランタイムがなくなっているにもかかわらず、設定が Gateway にそれへのバインドを要求し続ける Gateway ブートループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    診断機能は、現在のシェル（zsh、bash、fish、PowerShell）にタブ補完がインストールされているかをチェックします。

    - シェルプロファイルが遅い動的補完パターン（`source <(openclaw completion ...)`）を使用している場合、診断機能はそれをより高速なキャッシュファイル方式へアップグレードします。
    - 補完がプロファイル内で設定されているもののキャッシュファイルがない場合、診断機能はキャッシュを自動再生成します。
    - 補完がまったく設定されていない場合、診断機能はインストールを促します（対話モードのみ。`--non-interactive` ではスキップされます）。

    キャッシュを手動で再生成するには `openclaw completion --write-state` を実行してください。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック（ローカルトークン）">
    診断機能はローカル Gateway トークン認証の準備状態をチェックします。

    - トークンモードでトークンが必要であり、トークンソースが存在しない場合、診断機能は生成を提案します。
    - `gateway.auth.token` が SecretRef 管理だが利用できない場合、診断機能は警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、実行時のフェイルファスト動作を弱めずに、設定済みの認証情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象を絞った設定修復で、status 系コマンドと同じ読み取り専用の SecretRef 要約モデルを使用するようになりました。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` `@username` 修復は、利用可能な場合、設定済みのボット認証情報の使用を試みます。
    - Telegram ボットトークンが SecretRef 経由で設定されているものの、現在のコマンドパスで利用できない場合、doctor は認証情報が設定済みだが利用不可であることを報告し、クラッシュしたりトークンが不足していると誤報告したりせずに自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway ヘルスチェック + 再起動">
    doctor はヘルスチェックを実行し、Gateway が正常でないように見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状態">
    doctor は、設定済みのメモリ検索埋め込みプロバイダーがデフォルトエージェントで使用可能かどうかを確認します。動作は、設定済みのバックエンドとプロバイダーによって異なります。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動できるかを調べます。できない場合は、npm パッケージと手動のバイナリパスオプションを含む修正ガイダンスを出力します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイル、または認識済みのリモート/ダウンロード可能なモデル URL があるかを確認します。見つからない場合は、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー** (`openai`, `voyage` など): API キーが環境または認証ストアに存在することを検証します。見つからない場合は、実行可能な修正ヒントを出力します。
    - **自動プロバイダー**: まずローカルモデルの可用性を確認し、その後、自動選択順で各リモートプロバイダーを試します。

    キャッシュ済みの Gateway プローブ結果が利用可能な場合（チェック時点で Gateway が正常だった場合）、doctor はその結果を CLI から見える設定と照合し、不一致があれば記録します。doctor はデフォルトパスでは新しい埋め込み ping を開始しません。ライブのプロバイダーチェックが必要な場合は、深いメモリステータスコマンドを使用してください。

    実行時の埋め込み準備状態を検証するには、`openclaw memory status --deep` を使用してください。

  </Accordion>
  <Accordion title="14. チャンネルステータス警告">
    Gateway が正常な場合、doctor はチャンネルステータスプローブを実行し、推奨される修正とともに警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー設定の監査 + 修復">
    doctor は、インストール済みのスーパーバイザー設定（launchd/systemd/schtasks）に不足または古いデフォルト（例: systemd の network-online 依存関係と再起動遅延）がないかを確認します。不一致が見つかった場合は更新を推奨し、サービスファイル/タスクを現在のデフォルトに書き換えることができます。

    注記:

    - `openclaw doctor` は、スーパーバイザー設定を書き換える前に確認を求めます。
    - `openclaw doctor --yes` はデフォルトの修復プロンプトを受け入れます。
    - `openclaw doctor --repair` は、推奨される修正をプロンプトなしで適用します。
    - `openclaw doctor --repair --force` は、カスタムスーパーバイザー設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、Gateway サービスライフサイクルに対して doctor を読み取り専用のままにします。サービスヘルスの報告と非サービス修復は引き続き実行しますが、外部スーパーバイザーがそのライフサイクルを所有しているため、サービスのインストール/開始/再起動/ブートストラップ、スーパーバイザー設定の書き換え、レガシーサービスのクリーンアップはスキップします。
    - Linux では、一致する systemd Gateway ユニットがアクティブな間、doctor はコマンド/エントリポイントのメタデータを書き換えません。また、重複サービススキャン中は、非アクティブでレガシーではない追加の Gateway 風ユニットを無視するため、付随するサービスファイルがクリーンアップのノイズを発生させません。
    - トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、doctor のサービスインストール/修復は SecretRef を検証しますが、解決済みの平文トークン値をスーパーバイザーサービス環境メタデータに永続化しません。
    - doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストールがインラインに埋め込んだ、管理対象の `.env`/SecretRef ベースのサービス環境値を検出し、それらの値がスーパーバイザー定義ではなくランタイムソースから読み込まれるようにサービスメタデータを書き換えます。
    - doctor は、`gateway.port` の変更後もサービスコマンドが古い `--port` を固定している場合を検出し、サービスメタデータを現在のポートに書き換えます。
    - トークン認証でトークンが必要で、設定済みのトークン SecretRef が未解決の場合、doctor は実行可能なガイダンスを示してインストール/修復パスをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定されており、`gateway.auth.mode` が未設定の場合、doctor はモードが明示的に設定されるまでインストール/修復をブロックします。
    - Linux のユーザー systemd ユニットでは、doctor のトークンドリフトチェックで、サービス認証メタデータを比較するときに `Environment=` と `EnvironmentFile=` の両方のソースが含まれるようになりました。
    - doctor のサービス修復は、設定が新しいバージョンによって最後に書き込まれている場合、古い OpenClaw バイナリから Gateway サービスを書き換えたり、停止したり、再起動したりすることを拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` を使えば、いつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway ランタイム + ポート診断">
    doctor はサービスランタイム（PID、直近の終了ステータス）を検査し、サービスがインストールされているのに実際には実行されていない場合に警告します。また、Gateway ポート（デフォルト `18789`）のポート競合を確認し、考えられる原因（Gateway がすでに実行中、SSH トンネル）を報告します。
  </Accordion>
  <Accordion title="17. Gateway ランタイムのベストプラクティス">
    doctor は、Gateway サービスが Bun、またはバージョン管理された Node パス（`nvm`, `fnm`, `volta`, `asdf` など）で実行されている場合に警告します。WhatsApp + Telegram チャンネルには Node が必要であり、バージョンマネージャーのパスは、サービスがシェル初期化を読み込まないため、アップグレード後に壊れる可能性があります。doctor は、利用可能な場合、システムの Node インストール（Homebrew/apt/choco）への移行を提案します。

    新しくインストールまたは修復された macOS LaunchAgent は、対話型シェルの PATH をコピーする代わりに、正規のシステム PATH（`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`）を使用します。そのため、Volta、asdf、fnm、pnpm、その他のバージョンマネージャーディレクトリによって、Node 子プロセスが解決する対象が変わることはありません。Linux サービスは引き続き明示的な環境ルート（`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`）と安定したユーザー bin ディレクトリを保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、それらのディレクトリがディスク上に存在する場合にのみサービス PATH に書き込まれます。

  </Accordion>
  <Accordion title="18. 設定書き込み + ウィザードメタデータ">
    doctor は設定変更を永続化し、doctor 実行を記録するためにウィザードメタデータをスタンプします。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント（バックアップ + メモリシステム）">
    doctor は、ワークスペースメモリシステムがない場合に提案し、ワークスペースがまだ git 管理下にない場合はバックアップのヒントを出力します。

    ワークスペース構造と git バックアップ（非公開の GitHub または GitLab を推奨）の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
