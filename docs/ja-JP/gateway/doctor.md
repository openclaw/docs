---
read_when:
    - doctor マイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: 'doctor コマンド: ヘルスチェック、設定の移行、修復手順'
title: 診断
x-i18n:
    generated_at: "2026-05-04T09:37:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bc8615f5e49e8c20785a9dc9779c447fd0d5794c80663d2396b0a20b4187798
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` は OpenClaw の修復 + 移行ツールです。古い設定や状態を修正し、ヘルスチェックを実行し、実行可能な修復手順を提示します。

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

    プロンプトを表示せずにデフォルトを受け入れます（該当する場合は再起動、サービス、サンドボックスの修復手順も含む）。

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

    プロンプトなしで実行し、安全な移行（設定の正規化 + ディスク上の状態移動）のみを適用します。人間の確認が必要な再起動、サービス、サンドボックスの操作はスキップします。レガシー状態の移行は、検出されると自動的に実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の Gateway インストール（launchd/systemd/schtasks）についてシステムサービスをスキャンします。

  </Tab>
</Tabs>

書き込む前に変更を確認したい場合は、まず設定ファイルを開いてください。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="ヘルス、UI、更新">
    - git インストール向けの任意の事前更新（対話時のみ）。
    - UI プロトコルの鮮度チェック（プロトコルスキーマのほうが新しい場合、Control UI を再ビルドします）。
    - ヘルスチェック + 再起動プロンプト。
    - Skills ステータス概要（対象/不足/ブロック）と plugin ステータス。

  </Accordion>
  <Accordion title="設定と移行">
    - レガシー値の設定正規化。
    - レガシーのフラットな `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk 設定移行。
    - レガシー Chrome 拡張機能設定と Chrome MCP 準備状態のブラウザー移行チェック。
    - OpenCode プロバイダー上書き警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth シャドーイング警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth プロファイル向けの OAuth TLS 前提条件チェック。
    - `plugins.allow` は制限的だがツールポリシーがまだワイルドカードまたは plugin 所有ツールを要求している場合の plugin/ツール許可リスト警告。
    - レガシーのディスク上状態移行（セッション/エージェントディレクトリ/WhatsApp 認証）。
    - レガシー plugin マニフェスト契約キー移行（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - レガシー Cron ストア移行（`jobId`, `schedule.cron`, トップレベルの delivery/payload フィールド、payload `provider`, 単純な `notify: true` webhook フォールバックジョブ）。
    - レガシーエージェント runtime-policy から `agents.defaults.agentRuntime` と `agents.list[].agentRuntime` への移行。
    - plugin が有効な場合の古い plugin 設定のクリーンアップ。`plugins.enabled=false` の場合、古い plugin 参照は不活性な封じ込め設定として扱われ、保持されます。

  </Accordion>
  <Accordion title="状態と整合性">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受けた 2026.4.24 ビルドで作成された重複プロンプト書き換えブランチに対するセッショントランスクリプト修復。
    - 行き詰まったサブエージェントの再起動リカバリー tombstone 検出。古い中止済みリカバリーフラグをクリアして、起動時に子を再起動中止済みとして扱い続けないようにする `--fix` サポート付き。
    - 状態の整合性と権限チェック（セッション、トランスクリプト、状態ディレクトリ）。
    - ローカル実行時の設定ファイル権限チェック（chmod 600）。
    - モデル認証ヘルス: OAuth 有効期限を確認し、期限が近いトークンを更新でき、認証プロファイルのクールダウン/無効状態を報告します。
    - 追加ワークスペースディレクトリの検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、サービス、supervisor">
    - サンドボックス化が有効な場合のサンドボックスイメージ修復。
    - レガシーサービス移行と追加 Gateway 検出。
    - Matrix チャンネルのレガシー状態移行（`--fix` / `--repair` モード）。
    - Gateway ランタイムチェック（サービスはインストール済みだが実行されていない、キャッシュ済み launchd ラベル）。
    - チャンネルステータス警告（実行中の gateway からプローブ）。
    - supervisor 設定監査（launchd/systemd/schtasks）と任意の修復。
    - インストールまたは更新中にシェルの `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取り込んだ gateway サービス向けの埋め込みプロキシ環境クリーンアップ。
    - Gateway ランタイムのベストプラクティスチェック（Node と Bun、バージョンマネージャーパス）。
    - Gateway ポート衝突診断（デフォルト `18789`）。

  </Accordion>
  <Accordion title="認証、セキュリティ、ペアリング">
    - オープン DM ポリシーに関するセキュリティ警告。
    - ローカルトークンモードの Gateway 認証チェック（トークンソースが存在しない場合にトークン生成を提案します。トークン SecretRef 設定は上書きしません）。
    - デバイスペアリングの問題検出（保留中の初回ペアリングリクエスト、保留中のロール/スコープアップグレード、古いローカル device-token キャッシュのドリフト、ペアリング済みレコードの認証ドリフト）。

  </Accordion>
  <Accordion title="ワークスペースとシェル">
    - Linux での systemd linger チェック。
    - ワークスペースブートストラップファイルサイズチェック（コンテキストファイルの切り捨て/上限付近の警告）。
    - デフォルトエージェントの Skills 準備状態チェック。不足しているバイナリ、環境、設定、または OS 要件がある許可済み Skills を報告し、`--fix` で利用不可の Skills を `skills.entries` で無効化できます。
    - シェル補完ステータスチェックと自動インストール/アップグレード。
    - メモリ検索埋め込みプロバイダーの準備状態チェック（ローカルモデル、リモート API キー、または QMD バイナリ）。
    - ソースインストールチェック（pnpm ワークスペース不一致、UI アセット不足、tsx バイナリ不足）。
    - 更新済み設定 + ウィザードメタデータを書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI バックフィルとリセット

Control UI の Dreams シーンには、grounded dreaming ワークフロー向けの **Backfill**、**Reset**、**Clear Grounded** アクションが含まれます。これらのアクションは gateway の doctor スタイルの RPC メソッドを使用しますが、`openclaw doctor` CLI の修復/移行の一部では**ありません**。

実行内容:

- **Backfill** は、アクティブなワークスペース内の過去の `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM 日記パスを実行し、可逆的なバックフィルエントリを `DREAMS.md` に書き込みます。
- **Reset** は、`DREAMS.md` からマークされたバックフィル日記エントリだけを削除します。
- **Clear Grounded** は、過去の再生から来ていて、まだライブ recall や日次サポートが蓄積されていない、ステージ済みの grounded 専用短期エントリだけを削除します。

それ自体では**実行しない**こと:

- `MEMORY.md` は編集しません
- doctor 移行全体は実行しません
- ステージ済み CLI パスを明示的に先に実行しない限り、grounded 候補をライブ短期昇格ストアへ自動的にステージしません

grounded の過去再生を通常の deep promotion lane に影響させたい場合は、代わりに CLI フローを使用してください。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` をレビュー面として保持しながら、grounded の永続候補を短期 dreaming ストアへステージします。

## 詳細な挙動と根拠

<AccordionGroup>
  <Accordion title="0. 任意の更新（git インストール）">
    これが git チェックアウトで doctor が対話的に実行されている場合、doctor の実行前に更新（fetch/rebase/build）を提案します。
  </Accordion>
  <Accordion title="1. 設定の正規化">
    設定にレガシー値の形状（たとえばチャンネル固有の上書きがない `messages.ackReaction`）が含まれる場合、doctor はそれらを現在のスキーマへ正規化します。

    これにはレガシー Talk のフラットフィールドが含まれます。現在の公開 Talk 設定は `talk.provider` + `talk.providers.<provider>` です。Doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` の形状をプロバイダーマップへ書き換えます。

    また doctor は、`plugins.allow` が空でなく、ツールポリシーが
    ワイルドカードまたは plugin 所有ツールエントリを使用している場合に警告します。`tools.allow: ["*"]` は実際にロードされた plugin
    からのツールにのみ一致します。排他的な plugin
    許可リストをバイパスするものではありません。

  </Accordion>
  <Accordion title="2. レガシー設定キーの移行">
    設定に非推奨キーが含まれる場合、他のコマンドは実行を拒否し、`openclaw doctor` の実行を求めます。

    Doctor は次を実行します。

    - 見つかったレガシーキーを説明します。
    - 適用した移行を表示します。
    - 更新済みスキーマで `~/.openclaw/openclaw.json` を書き換えます。

    Gateway も起動時にレガシー設定形式を検出すると doctor 移行を自動実行するため、古い設定は手動介入なしで修復されます。Cron ジョブストア移行は `openclaw doctor --fix` によって処理されます。

    現在の移行:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - 可視返信ポリシーが欠けている構成済みチャンネル設定 → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → トップレベルの `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - レガシー `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` と `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` と `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` と `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` と `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 名前付き `accounts` があるものの、単一アカウント用のトップレベルチャンネル値が残っているチャンネルでは、それらのアカウントスコープ値を、そのチャンネルで選ばれた昇格先アカウントへ移動する（ほとんどのチャンネルでは `accounts.default`。Matrix は既存の一致する名前付き/デフォルトの対象を保持できる）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` を削除する。低速なプロバイダー/モデルのタイムアウトには `models.providers.<id>.timeoutSeconds` を使用する
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` を削除する（レガシー拡張リレー設定）
    - レガシー `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 起動時には、`api` が将来の enum 値または未知の enum 値に設定されたプロバイダーも、閉じて失敗するのではなくスキップする）

    診断の警告には、複数アカウントチャンネル向けのアカウントデフォルトのガイダンスも含まれる。

    - 2つ以上の `channels.<channel>.accounts` エントリが、`channels.<channel>.defaultAccount` または `accounts.default` なしで構成されている場合、診断はフォールバックルーティングが想定外のアカウントを選ぶ可能性があると警告する。
    - `channels.<channel>.defaultAccount` が未知のアカウント ID に設定されている場合、診断は警告し、構成済みアカウント ID を一覧表示する。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダーオーバーライド">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、それは `@mariozechner/pi-ai` の組み込み OpenCode カタログをオーバーライドする。その結果、モデルが誤った API に強制されたり、コストがゼロになったりする可能性がある。診断は、オーバーライドを削除してモデルごとの API ルーティングとコストを復元できるよう警告する。
  </Accordion>
  <Accordion title="2c. ブラウザー移行と Chrome MCP 準備状況">
    ブラウザー設定がまだ削除済み Chrome 拡張パスを指している場合、診断はそれを現在のホストローカル Chrome MCP アタッチモデルへ正規化する。

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になる
    - `browser.relayBindHost` は削除される

    診断は、`defaultProfile: "user"` または構成済みの `existing-session` プロファイルを使用している場合、ホストローカル Chrome MCP パスも監査する。

    - デフォルトの自動接続プロファイルについて、Google Chrome が同じホストにインストールされているか確認する
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合に警告する
    - ブラウザーの検査ページでリモートデバッグを有効にするよう通知する（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

    診断は Chrome 側の設定を有効化できない。ホストローカル Chrome MCP には引き続き次が必要になる。

    - gateway/node ホスト上の Chromium ベースブラウザー 144+
    - ブラウザーがローカルで実行中であること
    - そのブラウザーでリモートデバッグが有効であること
    - ブラウザーで最初のアタッチ同意プロンプトを承認すること

    ここでの準備状況は、ローカルアタッチの前提条件のみを対象とする。Existing-session は現在の Chrome MCP ルート制限を維持する。`responsebody`、PDF エクスポート、ダウンロード傍受、バッチアクションなどの高度なルートには、引き続き管理ブラウザーまたは raw CDP プロファイルが必要になる。

    このチェックは、Docker、サンドボックス、リモートブラウザー、その他のヘッドレスフローには**適用されない**。それらは引き続き raw CDP を使用する。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前提条件">
    OpenAI Codex OAuth プロファイルが構成されている場合、診断は OpenAI 認可エンドポイントをプローブして、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できることを確認する。プローブが証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、自己署名証明書）で失敗した場合、診断はプラットフォーム固有の修正ガイダンスを出力する。Homebrew Node を使用する macOS では、通常の修正は `brew postinstall ca-certificates` である。`--deep` では、gateway が正常な場合でもプローブが実行される。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダーオーバーライド">
    以前に `models.providers.openai-codex` の下にレガシー OpenAI トランスポート設定を追加していた場合、それらは新しいリリースが自動的に使用する組み込み Codex OAuth プロバイダーパスを隠す可能性がある。診断は、Codex OAuth と並んでそれらの古いトランスポート設定を検出した場合に警告し、古いトランスポートオーバーライドを削除または書き換えて、組み込みのルーティング/フォールバック動作を取り戻せるようにする。カスタムプロキシとヘッダーのみのオーバーライドは引き続きサポートされ、この警告は発生しない。
  </Accordion>
  <Accordion title="2f. Codex Plugin ルート警告">
    バンドルされた Codex Plugin が有効な場合、診断は `openai-codex/*` プライマリモデル参照がまだデフォルトの PI ランナー経由で解決されるかどうかも確認する。この組み合わせは、PI 経由で Codex OAuth/サブスクリプション認証を使用したい場合には有効だが、ネイティブ Codex アプリサーバーハーネスと混同しやすい。診断は警告し、明示的なアプリサーバー形状を示す: `openai/*` に加えて `agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex`。

    診断はこれを自動修復しない。どちらのルートも有効だからである。

    - `openai-codex/*` + PI は「通常の OpenClaw ランナー経由で Codex OAuth/サブスクリプション認証を使用する」という意味。
    - `openai/*` + `agentRuntime.id: "codex"` は「埋め込みターンをネイティブ Codex アプリサーバー経由で実行する」という意味。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」という意味。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使用する」という意味。

    警告が表示された場合は、意図したルートを選び、設定を手動で編集する。PI Codex OAuth が意図的である場合は、警告をそのまま維持する。

  </Accordion>
  <Accordion title="3. レガシー状態移行（ディスクレイアウト）">
    診断は古いオンディスクレイアウトを現在の構造へ移行できる。

    - セッションストア + トランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）:
      - レガシー `~/.openclaw/credentials/*.json` から（`oauth.json` を除く）
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートで冪等である。診断は、バックアップとしてレガシーフォルダーを残す場合に警告を出す。Gateway/CLI も起動時にレガシーセッションとエージェントディレクトリを自動移行するため、履歴/認証/モデルは手動の診断実行なしでエージェントごとのパスに配置される。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行される。Talk プロバイダー/プロバイダーマップ正規化は現在、構造的等価性で比較するため、キー順序のみの差分が、何もしない `doctor --fix` 変更を繰り返し発生させることはなくなった。

  </Accordion>
  <Accordion title="3a. レガシー Plugin マニフェスト移行">
    診断は、インストール済みのすべての Plugin マニフェストをスキャンし、非推奨のトップレベル機能キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）を探す。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをその場で書き換えることを提案する。この移行は冪等である。`contracts` キーにすでに同じ値がある場合、データを重複させずにレガシーキーが削除される。
  </Accordion>
  <Accordion title="3b. レガシー Cron ストア移行">
    診断は、Cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、またはオーバーライドされている場合は `cron.store`）についても、スケジューラーが互換性のために引き続き受け入れる古いジョブ形状を確認する。

    現在の Cron クリーンアップには次が含まれる。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルのペイロードフィールド（`message`、`model`、`thinking`、...）→ `payload`
    - トップレベルの配信フィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - ペイロード `provider` の配信エイリアス → 明示的な `delivery.channel`
    - 単純なレガシー `notify: true` Webhook フォールバックジョブ → `delivery.to=cron.webhook` を伴う明示的な `delivery.mode="webhook"`

    診断は、動作を変更せずに実行できる場合にのみ `notify: true` ジョブを自動移行する。ジョブがレガシー通知フォールバックと既存の非 Webhook 配信モードを組み合わせている場合、診断は警告し、そのジョブを手動レビュー用に残す。

    Linux では、ユーザーの crontab がまだレガシー `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出している場合にも診断が警告する。そのホストローカルスクリプトは現在の OpenClaw では保守されておらず、cron が systemd ユーザーバスに到達できない場合に、誤った `Gateway inactive` メッセージを `~/.openclaw/logs/whatsapp-health.log` へ書き込む可能性がある。古い crontab エントリは `crontab -e` で削除する。現在のヘルスチェックには `openclaw channels status --probe`、`openclaw doctor`、`openclaw gateway status` を使用する。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    診断機能は、すべてのエージェントセッションディレクトリで古い書き込みロックファイルをスキャンします。これは、セッションが異常終了したときに残されたファイルです。見つかった各ロックファイルについて、パス、PID、その PID がまだ生存しているかどうか、ロックの経過時間、古いと見なされるかどうか（停止した PID または 30 分超）を報告します。`--fix` / `--repair` モードでは、古いロックファイルを自動的に削除します。それ以外の場合は注記を表示し、`--fix` を付けて再実行するよう案内します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    診断機能は、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状について、エージェントセッション JSONL ファイルをスキャンします。これは、OpenClaw 内部ランタイムコンテキストを含む放棄されたユーザーターンと、同じ表示ユーザープロンプトを含むアクティブな兄弟ブランチです。`--fix` / `--repair` モードでは、診断機能は影響を受ける各ファイルを元のファイルの隣にバックアップし、トランスクリプトをアクティブなブランチに書き換えるため、gateway 履歴とメモリリーダーに重複ターンが見えなくなります。
  </Accordion>
  <Accordion title="4. 状態整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の中枢です。これが消えると、別の場所にバックアップがない限り、セッション、認証情報、ログ、設定を失います。

    診断機能が確認する内容:

    - **状態ディレクトリがない**: 壊滅的な状態喪失について警告し、ディレクトリの再作成を促し、失われたデータは復元できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能か検証します。権限の修復を提案し、所有者/グループの不一致が検出された場合は `chown` のヒントを出力します。
    - **macOS のクラウド同期された状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` 配下に解決される場合に警告します。同期されるパスは、I/O の低速化やロック/同期の競合を引き起こすことがあります。
    - **Linux の SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合に警告します。SD または eMMC ベースのランダム I/O は、セッションや認証情報の書き込み時に遅く、消耗が早いことがあります。
    - **セッションディレクトリがない**: 履歴を永続化し、`ENOENT` クラッシュを避けるには、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプトの不一致**: 最近のセッションエントリでトランスクリプトファイルが欠落している場合に警告します。
    - **メインセッションの「1 行 JSONL」**: メイントランスクリプトが 1 行しかない場合（履歴が蓄積されていない）にフラグを立てます。
    - **複数の状態ディレクトリ**: ホームディレクトリ全体で複数の `~/.openclaw` フォルダが存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分割される可能性があります）。
    - **リモートモードのリマインダー**: `gateway.mode=remote` の場合、診断機能はリモートホストで実行するよう通知します（状態はそこにあります）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全員から読み取り可能な場合に警告し、`600` へ厳格化することを提案します。

  </Accordion>
  <Accordion title="5. モデル認証の健全性（OAuth 期限切れ）">
    診断機能は認証ストア内の OAuth プロファイルを検査し、トークンが期限切れ間近または期限切れの場合に警告し、安全な場合は更新できます。Anthropic OAuth/トークンプロファイルが古い場合は、Anthropic API キーまたは Anthropic セットアップトークンの経路を提案します。更新プロンプトは対話的に実行している場合（TTY）にのみ表示されます。`--non-interactive` では更新の試行をスキップします。

    OAuth 更新が恒久的に失敗した場合（たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求める場合）、診断機能は再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを出力します。

    診断機能は、次の理由により一時的に使用できない認証プロファイルも報告します:

    - 短いクールダウン（レート制限/タイムアウト/認証失敗）
    - 長い無効化（請求/クレジット失敗）

  </Accordion>
  <Accordion title="6. フックモデル検証">
    `hooks.gmail.model` が設定されている場合、診断機能はモデル参照をカタログおよび許可リストと照合して検証し、解決できない、または許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージ修復">
    サンドボックス化が有効な場合、診断機能は Docker イメージを確認し、現在のイメージがない場合はビルドするかレガシー名へ切り替えることを提案します。
  </Accordion>
  <Accordion title="7b. Plugin インストールのクリーンアップ">
    診断機能は、`openclaw doctor --fix` / `openclaw doctor --repair` モードで、レガシーな OpenClaw 生成 Plugin 依存関係ステージング状態を削除します。対象には、古い生成済み依存関係ルート、旧インストールステージディレクトリ、以前のバンドル済み Plugin 依存関係修復コードによるパッケージローカルの残骸、現在のバンドル済みマニフェストを隠してしまう可能性がある、孤立または復旧された管理対象 npm コピーのバンドル済み `@openclaw/*` plugins が含まれます。

    設定がダウンロード可能な plugins を参照しているものの、ローカル Plugin レジストリで見つからない場合、診断機能はそれらを再インストールすることもできます。2026.5.2 のバンドル済み Plugin 外部化では、診断機能は既存の設定ですでに使用されているダウンロード可能な plugins を自動的にインストールし、その後 `meta.lastTouchedVersion` によって、そのリリース処理を 1 回だけ実行します。Gateway 起動と設定再読み込みはパッケージマネージャーを実行しません。Plugin インストールは明示的な診断/インストール/更新作業のままです。

  </Accordion>
  <Accordion title="8. Gateway サービスの移行とクリーンアップのヒント">
    診断機能はレガシー Gateway サービス（launchd/systemd/schtasks）を検出し、それらを削除して現在の Gateway ポートを使う OpenClaw サービスをインストールすることを提案します。追加の Gateway 風サービスをスキャンし、クリーンアップのヒントを出力することもできます。プロファイル名付きの OpenClaw Gateway サービスは第一級のものと見なされ、「追加」としてフラグ付けされません。

    Linux では、ユーザーレベルの Gateway サービスが欠落しているが、システムレベルの OpenClaw Gateway サービスが存在する場合、診断機能は 2 つ目のユーザーレベルサービスを自動的にインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で確認してから、重複を削除するか、システムスーパーバイザーが Gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定します。

  </Accordion>
  <Accordion title="8b. 起動時の Matrix 移行">
    Matrix チャンネルアカウントに保留中または対処可能なレガシー状態移行がある場合、診断機能は（`--fix` / `--repair` モードで）移行前スナップショットを作成し、その後ベストエフォートの移行手順を実行します。レガシー Matrix 状態移行と、レガシー暗号化状態の準備です。どちらの手順も致命的ではなく、エラーはログに記録され、起動は続行されます。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証のずれ">
    診断機能は通常の健全性チェックの一部として、デバイスペアリング状態を検査するようになりました。

    報告内容:

    - 保留中の初回ペアリングリクエスト
    - すでにペアリング済みのデバイスに対する保留中のロール昇格
    - すでにペアリング済みのデバイスに対する保留中のスコープ昇格
    - デバイス ID はまだ一致しているが、デバイス ID 情報が承認済みレコードと一致しなくなった公開鍵不一致の修復
    - 承認済みロールの有効なトークンが欠落しているペアリング済みレコード
    - スコープが承認済みペアリング基準から外れたペアリング済みトークン
    - 現在のマシン用のローカルキャッシュ済みデバイストークンエントリのうち、Gateway 側のトークンローテーションより古いもの、または古いスコープメタデータを持つもの

    診断機能はペアリングリクエストの自動承認やデバイストークンの自動ローテーションを行いません。代わりに正確な次の手順を出力します:

    - `openclaw devices list` で保留中のリクエストを確認する
    - `openclaw devices approve <requestId>` で正確なリクエストを承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除して再承認する

    これにより、よくある「すでにペアリング済みなのに、まだペアリングが必要になる」穴を塞ぎます。診断機能は、初回ペアリング、保留中のロール/スコープ昇格、古いトークン/デバイス ID 情報のずれを区別するようになりました。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    プロバイダーが許可リストなしで DM に開放されている場合、またはポリシーが危険な方法で設定されている場合、診断機能は警告を出力します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemd ユーザーサービスとして実行している場合、診断機能はログアウト後も gateway が稼働し続けるよう lingering が有効であることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペース状態（Skills、plugins、レガシーディレクトリ）">
    診断機能は、デフォルトエージェントのワークスペース状態の概要を出力します:

    - **Skills 状態**: 対象、要件欠落、許可リストでブロックされた Skills の数を数えます。
    - **レガシーワークスペースディレクトリ**: `~/openclaw` またはその他のレガシーワークスペースディレクトリが現在のワークスペースと並んで存在する場合に警告します。
    - **Plugin 状態**: 有効/無効/エラーの plugins を数えます。エラーがある場合は Plugin ID を一覧表示します。バンドル Plugin の機能を報告します。
    - **Plugin 互換性警告**: 現在のランタイムとの互換性問題がある plugins にフラグを立てます。
    - **Plugin 診断**: Plugin レジストリが読み込み時に出力した警告またはエラーを表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    診断機能は、ワークスペースのブートストラップファイル（たとえば `AGENTS.md`、`CLAUDE.md`、その他の注入コンテキストファイル）が設定済みの文字数予算に近い、または超えていないかを確認します。ファイルごとの生の文字数と注入後の文字数、切り詰め率、切り詰め原因（`max/file` または `max/total`）、合計注入文字数が合計予算に占める割合を報告します。ファイルが切り詰められている、または制限に近い場合、診断機能は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` を調整するためのヒントを出力します。
  </Accordion>
  <Accordion title="11d. 古いチャンネル Plugin のクリーンアップ">
    `openclaw doctor --fix` が欠落しているチャンネル Plugin を削除すると、その Plugin を参照していたぶら下がったチャンネルスコープ設定も削除します。`channels.<id>` エントリ、チャンネル名を指定していた Heartbeat ターゲット、`agents.*.models["<channel>/*"]` オーバーライドです。これにより、チャンネルランタイムはなくなっているのに、設定が gateway にそれへのバインドを求め続ける Gateway 起動ループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    診断機能は、現在のシェル（zsh、bash、fish、または PowerShell）にタブ補完がインストールされているかを確認します:

    - シェルプロファイルが低速な動的補完パターン（`source <(openclaw completion ...)`）を使っている場合、診断機能は高速なキャッシュファイル方式へアップグレードします。
    - 補完がプロファイルに設定されているがキャッシュファイルがない場合、診断機能はキャッシュを自動的に再生成します。
    - 補完がまったく設定されていない場合、診断機能はインストールを促します（対話モードのみ。`--non-interactive` ではスキップ）。

    キャッシュを手動で再生成するには `openclaw completion --write-state` を実行します。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック（ローカルトークン）">
    診断機能はローカル Gateway トークン認証の準備状態を確認します。

    - トークンモードでトークンが必要だがトークンソースが存在しない場合、診断機能は生成を提案します。
    - `gateway.auth.token` が SecretRef 管理だが利用できない場合、診断機能は警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、ランタイムのフェイルファスト動作を弱めずに、設定済みの認証情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象設定修復に対して、状態系コマンドと同じ読み取り専用 SecretRef 要約モデルを使うようになりました。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` の `@username` 修復は、利用可能な場合は設定済みのボット認証情報を使おうとします。
    - Telegram ボットトークンが SecretRef 経由で設定されているものの、現在のコマンドパスで利用できない場合、診断機能は認証情報が設定済みだが利用不可であると報告し、クラッシュしたり、トークンが欠落していると誤報告したりせずに自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway ヘルスチェック + 再起動">
    Doctor はヘルスチェックを実行し、Gateway が正常でないように見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状態">
    Doctor は、設定されたメモリ検索の埋め込みプロバイダーがデフォルトのエージェントで準備できているかを確認します。動作は設定されたバックエンドとプロバイダーによって異なります。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動できるかを検査します。できない場合は、npm パッケージと手動バイナリパスのオプションを含む修正ガイダンスを出力します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイル、または認識済みのリモート/ダウンロード可能なモデル URL を確認します。見つからない場合は、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー**（`openai`、`voyage` など）: API キーが環境または認証ストアに存在することを検証します。見つからない場合は、実行可能な修正ヒントを出力します。
    - **自動プロバイダー**: まずローカルモデルの可用性を確認し、その後、自動選択順で各リモートプロバイダーを試します。

    キャッシュされた Gateway 検査結果が利用可能な場合（チェック時点で Gateway が正常だった場合）、doctor はその結果を CLI から見える設定と照合し、不一致があれば記録します。Doctor はデフォルトのパスでは新しい埋め込み ping を開始しません。ライブのプロバイダーチェックが必要な場合は、詳細メモリステータスコマンドを使用してください。

    実行時に埋め込みの準備状態を検証するには、`openclaw memory status --deep` を使用してください。

  </Accordion>
  <Accordion title="14. チャンネルステータス警告">
    Gateway が正常な場合、doctor はチャンネルステータス検査を実行し、推奨修正とともに警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー設定の監査 + 修復">
    Doctor は、インストール済みのスーパーバイザー設定（launchd/systemd/schtasks）に欠落または古いデフォルト（例: systemd の network-online 依存関係と再起動遅延）がないか確認します。不一致を見つけると、更新を推奨し、サービスファイル/タスクを現在のデフォルトに書き換えることができます。

    注:

    - `openclaw doctor` はスーパーバイザー設定を書き換える前に確認を求めます。
    - `openclaw doctor --yes` はデフォルトの修復プロンプトを承認します。
    - `openclaw doctor --repair` は推奨修正をプロンプトなしで適用します。
    - `openclaw doctor --repair --force` はカスタムスーパーバイザー設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、Gateway サービスのライフサイクルについて doctor を読み取り専用に保ちます。サービスの健全性を引き続き報告し、サービス以外の修復も実行しますが、外部スーパーバイザーがそのライフサイクルを所有しているため、サービスのインストール/開始/再起動/ブートストラップ、スーパーバイザー設定の書き換え、レガシーサービスのクリーンアップはスキップします。
    - Linux では、一致する systemd Gateway ユニットがアクティブな間、doctor はコマンド/エントリーポイントのメタデータを書き換えません。また、重複サービススキャン中は、非アクティブでレガシーではない追加の Gateway 風ユニットを無視するため、付随するサービスファイルによるクリーンアップノイズは発生しません。
    - トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、doctor のサービスインストール/修復は SecretRef を検証しますが、解決済みの平文トークン値をスーパーバイザーサービス環境メタデータへ永続化しません。
    - Doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストールがインラインで埋め込んだ、管理対象の `.env`/SecretRef バックのサービス環境値を検出し、それらの値がスーパーバイザー定義ではなく実行時ソースから読み込まれるようにサービスメタデータを書き換えます。
    - Doctor は、`gateway.port` の変更後もサービスコマンドが古い `--port` を固定している場合に検出し、サービスメタデータを現在のポートへ書き換えます。
    - トークン認証にトークンが必要で、設定されたトークン SecretRef が未解決の場合、doctor は実行可能なガイダンスとともにインストール/修復パスをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、doctor はモードが明示的に設定されるまでインストール/修復をブロックします。
    - Linux のユーザー systemd ユニットでは、doctor のトークンドリフトチェックは、サービス認証メタデータを比較する際に `Environment=` と `EnvironmentFile=` の両方のソースを含むようになりました。
    - Doctor のサービス修復は、設定がより新しいバージョンによって最後に書き込まれている場合、古い OpenClaw バイナリから Gateway サービスを書き換えたり、停止したり、再起動したりすることを拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` でいつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway ランタイム + ポート診断">
    Doctor はサービスランタイム（PID、最後の終了ステータス）を検査し、サービスがインストール済みだが実際には実行されていない場合に警告します。また、Gateway ポート（デフォルトは `18789`）でのポート衝突を確認し、考えられる原因（Gateway がすでに実行中、SSH トンネル）を報告します。
  </Accordion>
  <Accordion title="17. Gateway ランタイムのベストプラクティス">
    Gateway サービスが Bun またはバージョン管理された Node パス（`nvm`、`fnm`、`volta`、`asdf` など）で実行されている場合、doctor は警告します。WhatsApp + Telegram チャンネルには Node が必要であり、サービスはシェル初期化を読み込まないため、バージョンマネージャーのパスはアップグレード後に壊れる可能性があります。Doctor は、利用可能な場合はシステムの Node インストール（Homebrew/apt/choco）への移行を提案します。

    新しくインストールまたは修復された macOS LaunchAgent は、対話型シェルの PATH をコピーする代わりに、標準的なシステム PATH（`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`）を使用するため、Volta、asdf、fnm、pnpm、その他のバージョンマネージャーディレクトリが、Node 子プロセスの解決先を変更することはありません。Linux サービスは引き続き明示的な環境ルート（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）と安定したユーザー bin ディレクトリを保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、それらのディレクトリがディスク上に存在する場合にのみサービス PATH に書き込まれます。

  </Accordion>
  <Accordion title="18. 設定の書き込み + ウィザードメタデータ">
    Doctor は設定変更を永続化し、doctor 実行を記録するためにウィザードメタデータを刻印します。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント（バックアップ + メモリシステム）">
    Doctor は、ワークスペースメモリシステムがない場合に提案し、ワークスペースがまだ git 配下にない場合はバックアップのヒントを出力します。

    ワークスペース構造と git バックアップ（非公開 GitHub または GitLab を推奨）の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
