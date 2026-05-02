---
read_when:
    - doctor マイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: 'doctor コマンド: ヘルスチェック、設定移行、修復手順'
title: 診断
x-i18n:
    generated_at: "2026-05-02T20:47:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 504cf06e8457315eb1df4970a877b88fdc2e32f34974ce789875373e9e030234
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` は OpenClaw の修復 + 移行ツールです。古い構成/状態を修正し、健全性を確認し、実行可能な修復手順を提示します。

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

    確認なしでデフォルトを受け入れます（該当する場合は再起動/サービス/サンドボックスの修復手順を含みます）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    確認なしで推奨される修復を適用します（安全な場合は修復 + 再起動）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    積極的な修復も適用します（カスタム supervisor 構成を上書きします）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    プロンプトなしで実行し、安全な移行のみを適用します（構成の正規化 + ディスク上の状態移動）。人間の確認が必要な再起動/サービス/サンドボックス操作はスキップします。レガシー状態の移行は、検出されると自動的に実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の gateway インストール（launchd/systemd/schtasks）についてシステムサービスをスキャンします。

  </Tab>
</Tabs>

書き込む前に変更を確認したい場合は、まず構成ファイルを開いてください。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="健全性、UI、更新">
    - git インストール向けの任意の事前更新（対話型のみ）。
    - UI プロトコルの鮮度確認（プロトコルスキーマの方が新しい場合は Control UI を再ビルド）。
    - 健全性確認 + 再起動プロンプト。
    - Skills ステータス概要（対象/不足/ブロック済み）と Plugin ステータス。

  </Accordion>
  <Accordion title="構成と移行">
    - レガシー値の構成正規化。
    - レガシーのフラットな `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk 構成移行。
    - レガシー Chrome 拡張構成と Chrome MCP 対応状況のブラウザー移行確認。
    - OpenCode プロバイダー上書き警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth シャドーイング警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth プロファイル向けの OAuth TLS 前提条件確認。
    - `plugins.allow` が制限的なのに、ツールポリシーがワイルドカードまたは Plugin 所有ツールをまだ要求している場合の Plugin/ツール許可リスト警告。
    - レガシーのディスク上状態移行（セッション/エージェントディレクトリ/WhatsApp 認証）。
    - レガシー Plugin マニフェスト契約キーの移行（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - レガシー cron ストア移行（`jobId`, `schedule.cron`, トップレベルの delivery/payload フィールド、payload `provider`, 単純な `notify: true` webhook フォールバックジョブ）。
    - レガシー agent runtime-policy から `agents.defaults.agentRuntime` と `agents.list[].agentRuntime` への移行。
    - Plugin が有効な場合の古い Plugin 構成のクリーンアップ。`plugins.enabled=false` の場合、古い Plugin 参照は不活性な封じ込め構成として扱われ、保持されます。

  </Accordion>
  <Accordion title="状態と整合性">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受けた 2026.4.24 ビルドによって作成された重複したプロンプト書き換えブランチのセッショントランスクリプト修復。
    - 行き詰まったサブエージェントの再起動復旧 tombstone 検出。古い中止済み復旧フラグをクリアして、起動時に子を再起動中止として扱い続けないようにする `--fix` サポート付き。
    - 状態の整合性と権限確認（セッション、トランスクリプト、状態ディレクトリ）。
    - ローカル実行時の構成ファイル権限確認（chmod 600）。
    - モデル認証の健全性: OAuth の有効期限を確認し、期限切れ間近のトークンを更新でき、auth-profile のクールダウン/無効状態を報告します。
    - 追加ワークスペースディレクトリの検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、サービス、supervisor">
    - サンドボックスが有効な場合のサンドボックスイメージ修復。
    - レガシーサービス移行と追加 gateway 検出。
    - Matrix チャネルのレガシー状態移行（`--fix` / `--repair` モード）。
    - Gateway ランタイム確認（サービスはインストール済みだが実行中でない、キャッシュされた launchd ラベル）。
    - チャネルステータス警告（実行中の gateway からプローブ）。
    - 任意の修復を伴う supervisor 構成監査（launchd/systemd/schtasks）。
    - インストールまたは更新時にシェルの `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取り込んだ gateway サービス向けの組み込みプロキシ環境クリーンアップ。
    - Gateway ランタイムのベストプラクティス確認（Node と Bun、バージョンマネージャーパス）。
    - Gateway ポート競合診断（デフォルト `18789`）。

  </Accordion>
  <Accordion title="認証、セキュリティ、ペアリング">
    - オープン DM ポリシーに関するセキュリティ警告。
    - ローカルトークンモードの Gateway 認証確認（トークンソースが存在しない場合にトークン生成を提案します。token SecretRef 構成は上書きしません）。
    - デバイスペアリングの問題検出（保留中の初回ペアリング要求、保留中のロール/スコープ昇格、古いローカル device-token キャッシュのずれ、ペア済みレコードの認証ずれ）。

  </Accordion>
  <Accordion title="ワークスペースとシェル">
    - Linux での systemd linger 確認。
    - ワークスペース bootstrap ファイルサイズ確認（コンテキストファイルの切り詰め/上限接近警告）。
    - デフォルトエージェント向けの Skills 準備状況確認。不足しているバイナリ、環境、構成、または OS 要件がある許可済み Skills を報告し、`--fix` は `skills.entries` で利用不可の Skills を無効化できます。
    - シェル補完ステータス確認と自動インストール/アップグレード。
    - メモリ検索埋め込みプロバイダーの準備状況確認（ローカルモデル、リモート API キー、または QMD バイナリ）。
    - ソースインストール確認（pnpm ワークスペース不一致、UI アセット不足、tsx バイナリ不足）。
    - 更新済み構成 + ウィザードメタデータを書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI のバックフィルとリセット

Control UI の Dreams シーンには、grounded dreaming ワークフロー用の **Backfill**、**Reset**、**Clear Grounded** アクションがあります。これらのアクションは gateway の doctor 風 RPC メソッドを使用しますが、`openclaw doctor` CLI の修復/移行の一部では**ありません**。

実行内容:

- **Backfill** はアクティブなワークスペース内の過去の `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM diary パスを実行して、元に戻せる backfill エントリを `DREAMS.md` に書き込みます。
- **Reset** は、マークされた backfill diary エントリだけを `DREAMS.md` から削除します。
- **Clear Grounded** は、過去のリプレイ由来で、まだライブ recall や日次サポートを蓄積していない staged grounded-only short-term エントリだけを削除します。

それ単体では**実行しない**こと:

- `MEMORY.md` を編集しません
- doctor 移行全体を実行しません
- staged CLI パスを明示的に先に実行しない限り、grounded candidates をライブ short-term promotion ストアに自動的に stage しません

grounded な過去リプレイを通常の deep promotion レーンに影響させたい場合は、代わりに CLI フローを使用してください。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` をレビュー面として維持しながら、grounded durable candidates を short-term dreaming ストアに stage します。

## 詳細な挙動と根拠

<AccordionGroup>
  <Accordion title="0. 任意の更新（git インストール）">
    これが git チェックアウトで doctor が対話的に実行されている場合、doctor の実行前に更新（fetch/rebase/build）を提案します。
  </Accordion>
  <Accordion title="1. 構成の正規化">
    構成にレガシー値の形（たとえばチャネル固有の上書きなしの `messages.ackReaction`）が含まれる場合、doctor はそれらを現在のスキーマに正規化します。

    これにはレガシーの Talk フラットフィールドが含まれます。現在の公開 Talk 構成は `talk.provider` + `talk.providers.<provider>` です。Doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` の形をプロバイダーマップに書き換えます。

    Doctor はまた、`plugins.allow` が空でなく、ツールポリシーが
    ワイルドカードまたは Plugin 所有ツールエントリを使用している場合に警告します。`tools.allow: ["*"]` は
    実際に読み込まれる Plugin のツールにのみ一致します。排他的な Plugin
    許可リストを迂回するものではありません。

  </Accordion>
  <Accordion title="2. レガシー構成キーの移行">
    構成に非推奨キーが含まれる場合、他のコマンドは実行を拒否し、`openclaw doctor` を実行するよう求めます。

    Doctor は次を行います。

    - 見つかったレガシーキーを説明します。
    - 適用した移行を表示します。
    - 更新済みスキーマで `~/.openclaw/openclaw.json` を書き換えます。

    Gateway もレガシー構成形式を検出すると起動時に doctor 移行を自動実行するため、古い構成は手動介入なしで修復されます。Cron ジョブストアの移行は `openclaw doctor --fix` によって処理されます。

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
    - 名前付き `accounts` がある一方で単一アカウント用のトップレベルチャンネル値が残っているチャンネルでは、それらのアカウントスコープ値を、そのチャンネル用に昇格されたアカウントへ移動する（ほとんどのチャンネルでは `accounts.default`。Matrix は既存の一致する名前付き/デフォルト対象を保持できる）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` を削除する。遅いプロバイダー/モデルのタイムアウトには `models.providers.<id>.timeoutSeconds` を使用する
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` を削除する（レガシー拡張リレー設定）
    - レガシー `models.providers.*.api: "openai"` → `"openai-completions"`（gateway 起動時は、`api` が将来の enum 値または不明な enum 値に設定されたプロバイダーも、フェイルクローズせずにスキップする）

    Doctor の警告には、複数アカウントチャンネル向けのアカウントデフォルトのガイダンスも含まれる。

    - 2 つ以上の `channels.<channel>.accounts` エントリが `channels.<channel>.defaultAccount` または `accounts.default` なしで設定されている場合、フォールバックルーティングが予期しないアカウントを選ぶ可能性があることを doctor が警告する。
    - `channels.<channel>.defaultAccount` が不明なアカウント ID に設定されている場合、doctor が警告し、設定済みのアカウント ID を一覧表示する。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダーのオーバーライド">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、`@mariozechner/pi-ai` の組み込み OpenCode カタログを上書きする。それにより、モデルが誤った API に割り当てられたり、コストがゼロになったりする可能性がある。オーバーライドを削除し、モデルごとの API ルーティングとコストを復元できるように、doctor が警告する。
  </Accordion>
  <Accordion title="2c. ブラウザー移行と Chrome MCP 対応状況">
    ブラウザー設定が削除済みの Chrome 拡張パスをまだ指している場合、doctor はそれを現在のホストローカル Chrome MCP アタッチモデルに正規化する。

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になる
    - `browser.relayBindHost` は削除される

    `defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使用している場合、doctor はホストローカル Chrome MCP パスも監査する。

    - デフォルトの自動接続プロファイルについて、同じホストに Google Chrome がインストールされているかを確認する
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合は警告する
    - ブラウザーの inspect ページでリモートデバッグを有効にするよう通知する（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

    Doctor は Chrome 側の設定を代わりに有効化できない。ホストローカル Chrome MCP には引き続き次が必要。

    - gateway/node ホスト上の Chromium ベースブラウザー 144+
    - ブラウザーがローカルで実行中であること
    - そのブラウザーでリモートデバッグが有効であること
    - ブラウザー内の初回アタッチ同意プロンプトを承認すること

    ここでの対応状況はローカルアタッチの前提条件のみを対象とする。Existing-session は現在の Chrome MCP ルート制限を維持する。`responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションのような高度なルートには、引き続き管理ブラウザーまたは raw CDP プロファイルが必要。

    このチェックは Docker、sandbox、remote-browser、その他のヘッドレスフローには**適用されない**。それらは引き続き raw CDP を使用する。

  </Accordion>
  <Accordion title="2d. OAuth TLS の前提条件">
    OpenAI Codex OAuth プロファイルが設定されている場合、doctor は OpenAI 認可エンドポイントを調査し、ローカル Node/OpenSSL TLS スタックが証明書チェーンを検証できるかを確認する。調査が証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、自己署名証明書）で失敗した場合、doctor はプラットフォーム別の修正ガイダンスを表示する。macOS で Homebrew Node を使っている場合、修正は通常 `brew postinstall ca-certificates`。`--deep` では、gateway が正常でも調査が実行される。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダーのオーバーライド">
    以前に `models.providers.openai-codex` の下へレガシー OpenAI トランスポート設定を追加していた場合、新しいリリースが自動的に使用する組み込み Codex OAuth プロバイダーパスを覆い隠す可能性がある。Codex OAuth と並んでそれらの古いトランスポート設定が見つかると doctor が警告するため、古いトランスポートオーバーライドを削除または書き換え、組み込みのルーティング/フォールバック動作を取り戻せる。カスタムプロキシとヘッダーのみのオーバーライドは引き続きサポートされ、この警告は発生しない。
  </Accordion>
  <Accordion title="2f. Codex Plugin ルートの警告">
    バンドルされた Codex Plugin が有効な場合、doctor は `openai-codex/*` のプライマリモデル参照がまだデフォルトの PI ランナー経由で解決されるかも確認する。この組み合わせは PI 経由で Codex OAuth/サブスクリプション認証を使いたい場合には有効だが、ネイティブ Codex app-server ハーネスと混同しやすい。Doctor は警告し、明示的な app-server 形状を示す: `openai/*` と `agentRuntime.id: "codex"`、または `OPENCLAW_AGENT_RUNTIME=codex`。

    両方のルートが有効なため、doctor はこれを自動修復しない。

    - `openai-codex/*` + PI は「通常の OpenClaw ランナー経由で Codex OAuth/サブスクリプション認証を使用する」ことを意味する。
    - `openai/*` + `agentRuntime.id: "codex"` は「埋め込みターンをネイティブ Codex app-server 経由で実行する」ことを意味する。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」ことを意味する。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使用する」ことを意味する。

    警告が表示された場合は、意図したルートを選び、設定を手動で編集する。PI Codex OAuth が意図的な場合は、警告をそのままにしておく。

  </Accordion>
  <Accordion title="3. レガシー状態の移行（ディスクレイアウト）">
    Doctor は古いオンディスクレイアウトを現在の構造へ移行できる。

    - セッションストア + トランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）:
      - レガシー `~/.openclaw/credentials/*.json` から（`oauth.json` を除く）
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートで冪等。バックアップとしてレガシーフォルダーを残す場合、doctor は警告を出す。Gateway/CLI も起動時にレガシーのセッションとエージェントディレクトリを自動移行するため、手動で doctor を実行しなくても履歴/認証/モデルはエージェントごとのパスに配置される。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行される。Talk プロバイダー/プロバイダーマップ正規化は構造的等価性で比較するようになったため、キー順序のみの差分で `doctor --fix` の no-op 変更が繰り返し発生することはなくなった。

  </Accordion>
  <Accordion title="3a. レガシー Plugin マニフェストの移行">
    Doctor は、インストール済みのすべての Plugin マニフェストで非推奨のトップレベル機能キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）をスキャンする。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをインプレースで書き換える提案を行う。この移行は冪等。`contracts` キーにすでに同じ値がある場合、データを重複させずにレガシーキーが削除される。
  </Accordion>
  <Accordion title="3b. レガシー cron ストアの移行">
    Doctor は cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、上書きされている場合は `cron.store`）も確認し、スケジューラーが互換性のためにまだ受け入れている古いジョブ形状を探す。

    現在の cron クリーンアップには次が含まれる。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルの payload フィールド（`message`、`model`、`thinking`、...）→ `payload`
    - トップレベルの delivery フィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload の `provider` delivery エイリアス → 明示的な `delivery.channel`
    - 単純なレガシー `notify: true` webhook フォールバックジョブ → `delivery.to=cron.webhook` を伴う明示的な `delivery.mode="webhook"`

    Doctor は動作を変えずに実行できる場合にのみ、`notify: true` ジョブを自動移行する。ジョブがレガシー notify フォールバックと既存の非 webhook delivery モードを組み合わせている場合、doctor は警告し、そのジョブを手動レビュー用に残す。

    Linux では、ユーザーの crontab がまだレガシー `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出している場合にも doctor が警告する。そのホストローカルスクリプトは現在の OpenClaw では保守されておらず、cron が systemd ユーザーバスに到達できない場合に `~/.openclaw/logs/whatsapp-health.log` へ誤った `Gateway inactive` メッセージを書き込むことがある。古い crontab エントリは `crontab -e` で削除する。現在のヘルスチェックには `openclaw channels status --probe`、`openclaw doctor`、`openclaw gateway status` を使用する。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    Doctor は各エージェントセッションディレクトリをスキャンし、古い書き込みロックファイル、つまりセッションが異常終了したときに残されたファイルを探します。見つかった各ロックファイルについて、パス、PID、PID がまだ生存しているか、ロックの経過時間、古いと見なされるかどうか（停止した PID または 30 分超過）を報告します。`--fix` / `--repair` モードでは、古いロックファイルを自動的に削除します。それ以外の場合は注記を表示し、`--fix` で再実行するよう指示します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    Doctor はエージェントセッションの JSONL ファイルをスキャンし、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状を探します。これは、OpenClaw 内部ランタイムコンテキストを持つ放棄されたユーザーターンと、同じ表示上のユーザープロンプトを含むアクティブな兄弟要素です。`--fix` / `--repair` モードでは、doctor は影響を受ける各ファイルを元ファイルの隣にバックアップし、トランスクリプトをアクティブブランチへ書き換えるため、gateway 履歴とメモリリーダーに重複ターンが表示されなくなります。
  </Accordion>
  <Accordion title="4. 状態整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の中枢です。これが消えると、別の場所にバックアップがない限り、セッション、認証情報、ログ、設定を失います。

    Doctor がチェックする内容:

    - **状態ディレクトリの欠落**: 壊滅的な状態喪失について警告し、ディレクトリの再作成を促し、欠落データは復旧できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能性を検証し、権限の修復を提案します（所有者/グループの不一致が検出された場合は `chown` のヒントを出します）。
    - **macOS のクラウド同期された状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` 配下に解決される場合に警告します。同期ベースのパスは I/O の低速化やロック/同期の競合を引き起こす可能性があるためです。
    - **Linux の SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合に警告します。SD または eMMC ベースのランダム I/O は、セッションや認証情報の書き込み時に低速になり、摩耗が早まる可能性があるためです。
    - **セッションディレクトリの欠落**: 履歴を永続化し、`ENOENT` クラッシュを避けるには、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプトの不一致**: 最近のセッションエントリにトランスクリプトファイルが欠落している場合に警告します。
    - **メインセッションの「1 行 JSONL」**: メイントランスクリプトが 1 行しかない場合にフラグを立てます（履歴が蓄積されていません）。
    - **複数の状態ディレクトリ**: 複数の `~/.openclaw` フォルダーがホームディレクトリ間に存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分割される可能性があります）。
    - **リモートモードのリマインダー**: `gateway.mode=remote` の場合、doctor はリモートホスト上で実行するよう通知します（状態はそこにあります）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全員に読み取り可能な場合に警告し、`600` へ厳格化することを提案します。

  </Accordion>
  <Accordion title="5. モデル認証の健全性（OAuth の期限切れ）">
    Doctor は認証ストア内の OAuth プロファイルを検査し、トークンが期限切れ間近または期限切れの場合に警告し、安全な場合は更新できます。Anthropic OAuth/トークンプロファイルが古い場合は、Anthropic API キーまたは Anthropic セットアップトークンのパスを提案します。更新プロンプトは対話的に実行している場合（TTY）にのみ表示されます。`--non-interactive` では更新試行をスキップします。

    OAuth 更新が恒久的に失敗した場合（たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求めた場合）、doctor は再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを出力します。

    Doctor は、次の理由で一時的に使用できない認証プロファイルも報告します。

    - 短いクールダウン（レート制限/タイムアウト/認証失敗）
    - より長い無効化（請求/クレジット失敗）

  </Accordion>
  <Accordion title="6. フックのモデル検証">
    `hooks.gmail.model` が設定されている場合、doctor はモデル参照をカタログと許可リストに照らして検証し、解決できない場合や許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージ修復">
    サンドボックスが有効な場合、doctor は Docker イメージをチェックし、現在のイメージが欠落している場合はビルドするか従来の名前へ切り替えることを提案します。
  </Accordion>
  <Accordion title="7b. Plugin インストールのクリーンアップ">
    Doctor は `openclaw doctor --fix` / `openclaw doctor --repair` モードで、従来の OpenClaw 生成 Plugin 依存関係ステージング状態を削除します。これには、古い生成済み依存関係ルート、古いインストールステージディレクトリ、以前のバンドル Plugin 依存関係修復コードによるパッケージローカルの残骸が含まれます。

    Doctor は、設定がダウンロード可能な Plugin を参照しているが、ローカル Plugin レジストリがそれを見つけられない場合に、その Plugin を再インストールすることもできます。2026.5.2 のバンドル Plugin 外部化では、doctor は既存設定ですでに使用されているダウンロード可能な Plugin を自動的にインストールし、その後 `meta.lastTouchedVersion` に依存して、そのリリース処理を一度だけ実行します。Gateway 起動と設定再読み込みはパッケージマネージャーを実行しません。Plugin インストールは明示的な doctor/install/update 作業のままです。

  </Accordion>
  <Accordion title="8. Gateway サービス移行とクリーンアップのヒント">
    Doctor は従来の gateway サービス（launchd/systemd/schtasks）を検出し、それらを削除して現在の gateway ポートを使って OpenClaw サービスをインストールすることを提案します。追加の gateway 風サービスをスキャンして、クリーンアップのヒントを表示することもできます。プロファイル名付きの OpenClaw gateway サービスは第一級のものと見なされ、「extra」としてフラグ付けされません。

    Linux では、ユーザーレベルの gateway サービスが欠落している一方で、システムレベルの OpenClaw gateway サービスが存在する場合、doctor は 2 つ目のユーザーレベルサービスを自動的にインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で確認し、重複を削除するか、システムスーパーバイザーが gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. 起動時の Matrix 移行">
    Matrix チャネルアカウントに保留中または対応可能な従来状態移行がある場合、doctor は（`--fix` / `--repair` モードで）移行前スナップショットを作成し、その後ベストエフォートの移行手順を実行します。従来の Matrix 状態移行と従来の暗号化状態準備です。どちらの手順も致命的ではありません。エラーはログに記録され、起動は続行されます。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェック全体がスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証ドリフト">
    Doctor は通常の健全性チェックの一部として、デバイスペアリング状態を検査するようになりました。

    報告内容:

    - 保留中の初回ペアリング要求
    - すでにペアリング済みのデバイスに対する保留中のロールアップグレード
    - すでにペアリング済みのデバイスに対する保留中のスコープアップグレード
    - デバイス ID はまだ一致しているが、デバイス ID 情報が承認済みレコードと一致しなくなった公開鍵不一致の修復
    - 承認済みロール用のアクティブなトークンがないペアリング済みレコード
    - スコープが承認済みペアリング基準から外れたペアリング済みトークン
    - gateway 側のトークンローテーションより古い、または古いスコープメタデータを持つ、現在のマシン用のローカルキャッシュ済みデバイストークンエントリ

    Doctor はペアリング要求を自動承認したり、デバイストークンを自動ローテーションしたりしません。代わりに正確な次の手順を表示します。

    - `openclaw devices list` で保留中の要求を確認する
    - `openclaw devices approve <requestId>` で正確な要求を承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除して再承認する

    これにより、よくある「すでにペアリング済みなのにペアリングが必要と表示され続ける」穴を閉じます。doctor は初回ペアリング、保留中のロール/スコープアップグレード、古いトークン/デバイス ID 情報のドリフトを区別するようになりました。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    Doctor は、プロバイダーが許可リストなしで DM に開放されている場合、またはポリシーが危険な方法で設定されている場合に警告を出します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemd ユーザーサービスとして実行している場合、doctor はログアウト後も gateway が存続するよう lingering が有効であることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペース状態（Skills、plugins、従来ディレクトリ）">
    Doctor はデフォルトエージェントのワークスペース状態の概要を出力します。

    - **Skills 状態**: 対象、要件欠落、許可リストでブロックされた Skills を数えます。
    - **従来ワークスペースディレクトリ**: `~/openclaw` または他の従来ワークスペースディレクトリが現在のワークスペースと並んで存在する場合に警告します。
    - **Plugin 状態**: 有効/無効/エラーの plugins を数えます。エラーがある場合は Plugin ID を一覧表示します。バンドル Plugin の機能を報告します。
    - **Plugin 互換性警告**: 現在のランタイムと互換性の問題がある plugins にフラグを立てます。
    - **Plugin 診断**: Plugin レジストリが読み込み時に出した警告やエラーを表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    Doctor は、ワークスペースのブートストラップファイル（たとえば `AGENTS.md`、`CLAUDE.md`、または他の注入コンテキストファイル）が、設定された文字数予算に近いか超えているかをチェックします。ファイルごとの生文字数と注入後文字数、切り詰め率、切り詰め原因（`max/file` または `max/total`）、合計注入文字数が合計予算に占める割合を報告します。ファイルが切り詰められているか上限に近い場合、doctor は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` を調整するヒントを表示します。
  </Accordion>
  <Accordion title="11d. 古いチャネル Plugin のクリーンアップ">
    `openclaw doctor --fix` が欠落したチャネル Plugin を削除すると、その Plugin を参照していたぶら下がりのチャネルスコープ設定も削除します。`channels.<id>` エントリ、チャネル名を指定していた Heartbeat ターゲット、`agents.*.models["<channel>/*"]` オーバーライドです。これにより、チャネルランタイムが消えているのに設定が gateway にバインドを求め続ける Gateway 起動ループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    Doctor は、現在のシェル（zsh、bash、fish、または PowerShell）にタブ補完がインストールされているかをチェックします。

    - シェルプロファイルが低速な動的補完パターン（`source <(openclaw completion ...)`）を使用している場合、doctor はより高速なキャッシュファイル方式へアップグレードします。
    - 補完がプロファイルに設定されているがキャッシュファイルが欠落している場合、doctor はキャッシュを自動的に再生成します。
    - 補完がまったく設定されていない場合、doctor はインストールを促します（対話モードのみ。`--non-interactive` ではスキップされます）。

    キャッシュを手動で再生成するには、`openclaw completion --write-state` を実行します。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック（ローカルトークン）">
    Doctor はローカル gateway トークン認証の準備状況をチェックします。

    - トークンモードがトークンを必要とし、トークンソースが存在しない場合、doctor は生成を提案します。
    - `gateway.auth.token` が SecretRef 管理だが利用できない場合、doctor は警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、ランタイムの fail-fast 動作を弱めることなく、設定済みの認証情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象を絞った設定修復に、status 系コマンドと同じ読み取り専用 SecretRef 概要モデルを使うようになりました。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` `@username` 修復は、利用可能な場合、設定済み bot 認証情報の使用を試みます。
    - Telegram bot トークンが SecretRef 経由で設定されているが現在のコマンドパスで利用できない場合、doctor は認証情報が設定済みだが利用不可であることを報告し、クラッシュしたりトークンが欠落していると誤報したりせず、自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gatewayヘルスチェック + 再起動">
    Doctor はヘルスチェックを実行し、Gateway が異常に見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状態">
    Doctor は、設定されたメモリ検索埋め込みプロバイダーがデフォルトエージェントで使用可能かどうかを確認します。動作は、設定されたバックエンドとプロバイダーによって異なります。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動できるかを検査します。できない場合は、npm パッケージと手動のバイナリパスオプションを含む修正ガイダンスを出力します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイル、または認識済みのリモート/ダウンロード可能なモデル URL があるかを確認します。見つからない場合は、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー**（`openai`、`voyage` など）: API キーが環境または認証ストアに存在するかを検証します。存在しない場合は、実行可能な修正ヒントを出力します。
    - **自動プロバイダー**: まずローカルモデルの可用性を確認し、その後自動選択順に各リモートプロバイダーを試します。

    キャッシュされた Gateway 検査結果が利用可能な場合（チェック時点で Gateway が正常だった場合）、doctor はその結果を CLI から見える設定と照合し、不一致があれば記録します。Doctor はデフォルトパスでは新しい埋め込み ping を開始しません。ライブプロバイダーチェックが必要な場合は、詳細メモリステータスコマンドを使用します。

    実行時の埋め込み準備状態を検証するには、`openclaw memory status --deep` を使用します。

  </Accordion>
  <Accordion title="14. チャネルステータス警告">
    Gateway が正常な場合、doctor はチャネルステータス検査を実行し、推奨される修正とともに警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー設定の監査 + 修復">
    Doctor は、インストール済みのスーパーバイザー設定（launchd/systemd/schtasks）に、不足しているデフォルトや古いデフォルト（例: systemd の network-online 依存関係と再起動遅延）がないかを確認します。不一致が見つかった場合は更新を推奨し、サービスファイル/タスクを現在のデフォルトに書き換えることができます。

    注:

    - `openclaw doctor` は、スーパーバイザー設定を書き換える前に確認を求めます。
    - `openclaw doctor --yes` は、デフォルトの修復プロンプトを承認します。
    - `openclaw doctor --repair` は、推奨される修正を確認なしで適用します。
    - `openclaw doctor --repair --force` は、カスタムスーパーバイザー設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、Gateway サービスライフサイクルに対して doctor を読み取り専用に保ちます。サービスの正常性を引き続き報告し、非サービス修復も実行しますが、外部スーパーバイザーがそのライフサイクルを所有しているため、サービスのインストール/開始/再起動/ブートストラップ、スーパーバイザー設定の書き換え、レガシーサービスのクリーンアップはスキップします。
    - Linux では、対応する systemd Gateway ユニットがアクティブな間、doctor はコマンド/エントリポイントのメタデータを書き換えません。また、重複サービススキャン中に非アクティブでレガシーではない追加の Gateway 風ユニットを無視するため、付随するサービスファイルがクリーンアップノイズを発生させません。
    - トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、doctor のサービスインストール/修復は SecretRef を検証しますが、解決済みの平文トークン値をスーパーバイザーサービス環境メタデータに永続化しません。
    - Doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストールがインラインに埋め込んだ、管理対象の `.env`/SecretRef ベースのサービス環境値を検出し、それらの値がスーパーバイザー定義ではなくランタイムソースから読み込まれるようにサービスメタデータを書き換えます。
    - Doctor は、`gateway.port` の変更後もサービスコマンドが古い `--port` を固定している場合に検出し、サービスメタデータを現在のポートに書き換えます。
    - トークン認証でトークンが必要で、設定されたトークン SecretRef が未解決の場合、doctor は実行可能なガイダンスとともにインストール/修復パスをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、doctor はモードが明示的に設定されるまでインストール/修復をブロックします。
    - Linux のユーザー systemd ユニットでは、doctor のトークンドリフトチェックは、サービス認証メタデータを比較する際に `Environment=` と `EnvironmentFile=` の両方のソースを含むようになりました。
    - Doctor のサービス修復は、設定が新しいバージョンによって最後に書き込まれている場合、古い OpenClaw バイナリから Gateway サービスを書き換えたり、停止したり、再起動したりすることを拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` で、いつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway ランタイム + ポート診断">
    Doctor はサービスランタイム（PID、直近の終了ステータス）を検査し、サービスがインストール済みでも実際には実行されていない場合に警告します。また、Gateway ポート（デフォルト `18789`）のポート競合を確認し、考えられる原因（Gateway がすでに実行中、SSH トンネル）を報告します。
  </Accordion>
  <Accordion title="17. Gateway ランタイムのベストプラクティス">
    Doctor は、Gateway サービスが Bun またはバージョン管理された Node パス（`nvm`、`fnm`、`volta`、`asdf` など）で実行されている場合に警告します。WhatsApp + Telegram チャネルには Node が必要であり、サービスはシェル初期化を読み込まないため、バージョンマネージャーのパスはアップグレード後に壊れることがあります。Doctor は、利用可能な場合はシステムの Node インストール（Homebrew/apt/choco）への移行を提案します。

    新規インストールまたは修復された macOS LaunchAgent は、対話型シェルの PATH をコピーする代わりに、正規のシステム PATH（`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`）を使用するため、Volta、asdf、fnm、pnpm、およびその他のバージョンマネージャーディレクトリによって、どの Node 子プロセスが解決されるかは変わりません。Linux サービスは引き続き明示的な環境ルート（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）と安定したユーザー bin ディレクトリを保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、それらのディレクトリがディスク上に存在する場合にのみサービス PATH に書き込まれます。

  </Accordion>
  <Accordion title="18. 設定の書き込み + ウィザードメタデータ">
    Doctor は設定変更を永続化し、doctor 実行を記録するためにウィザードメタデータを付与します。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント（バックアップ + メモリシステム）">
    Doctor は、存在しない場合にワークスペースメモリシステムを提案し、ワークスペースがまだ git 管理下にない場合はバックアップのヒントを出力します。

    ワークスペース構造と git バックアップ（非公開 GitHub または GitLab を推奨）の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
