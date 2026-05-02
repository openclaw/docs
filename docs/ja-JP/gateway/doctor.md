---
read_when:
    - doctorマイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: 'doctor コマンド: ヘルスチェック、設定移行、修復手順'
title: 診断
x-i18n:
    generated_at: "2026-05-02T04:55:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff4ab00fd6a11588abe790350fe139bc49f61e688bcd741389dd63732aa4430c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` はOpenClawの修復 + 移行ツールです。古い設定/状態を修正し、ヘルスを確認し、実行可能な修復手順を提示します。

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

    プロンプトを表示せずにデフォルトを受け入れます（該当する場合は、再起動、サービス、サンドボックスの修復手順を含む）。

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

    強力な修復も適用します（カスタムのスーパーバイザー設定を上書きします）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    プロンプトなしで実行し、安全な移行のみを適用します（設定の正規化 + ディスク上の状態移動）。人による確認が必要な再起動、サービス、サンドボックス操作はスキップします。レガシー状態の移行は、検出されると自動的に実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加のGatewayインストール（launchd/systemd/schtasks）についてシステムサービスをスキャンします。

  </Tab>
</Tabs>

書き込む前に変更を確認したい場合は、先に設定ファイルを開きます。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - gitインストール向けの任意の事前更新（対話モードのみ）。
    - UIプロトコルの鮮度チェック（プロトコルスキーマの方が新しい場合にControl UIを再ビルド）。
    - ヘルスチェック + 再起動プロンプト。
    - Skillsステータス概要（対象/欠落/ブロック）とPluginステータス。

  </Accordion>
  <Accordion title="Config and migrations">
    - レガシー値の設定正規化。
    - レガシーのフラットな`talk.*`フィールドから`talk.provider` + `talk.providers.<provider>`へのTalk設定移行。
    - レガシーChrome拡張機能設定とChrome MCPの準備状況に関するブラウザー移行チェック。
    - OpenCodeプロバイダー上書き警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuthシャドーイング警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuthプロファイルのOAuth TLS前提条件チェック。
    - `plugins.allow`が制限的でも、ツールポリシーがワイルドカードまたはPlugin所有ツールを要求している場合のPlugin/ツール許可リスト警告。
    - レガシーのディスク上状態移行（セッション/エージェントディレクトリ/WhatsApp認証）。
    - レガシーPluginマニフェスト契約キーの移行（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - レガシーCronストア移行（`jobId`、`schedule.cron`、トップレベルの配信/ペイロードフィールド、ペイロード`provider`、単純な`notify: true` Webhookフォールバックジョブ）。
    - レガシーエージェントランタイムポリシーの`agents.defaults.agentRuntime`および`agents.list[].agentRuntime`への移行。
    - Pluginが有効な場合の古いPlugin設定のクリーンアップ。`plugins.enabled=false`の場合、古いPlugin参照は不活性な封じ込め設定として扱われ、保持されます。

  </Accordion>
  <Accordion title="State and integrity">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受ける2026.4.24ビルドで作成された重複したプロンプト書き換えブランチに対するセッショントランスクリプト修復。
    - 行き詰まったサブエージェントの再起動リカバリ墓標検出。古い中止済みリカバリフラグをクリアし、起動時に子を再起動中止として扱い続けないようにする`--fix`サポート付き。
    - 状態の整合性と権限チェック（セッション、トランスクリプト、状態ディレクトリ）。
    - ローカル実行時の設定ファイル権限チェック（chmod 600）。
    - モデル認証ヘルス: OAuth有効期限を確認し、期限切れ間近のトークンを更新でき、認証プロファイルのクールダウン/無効状態を報告します。
    - 余分なワークスペースディレクトリ検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - サンドボックス化が有効な場合のサンドボックスイメージ修復。
    - レガシーサービス移行と追加Gateway検出。
    - Matrixチャンネルのレガシー状態移行（`--fix` / `--repair`モード）。
    - Gatewayランタイムチェック（サービスはインストール済みだが未実行、キャッシュされたlaunchdラベル）。
    - チャンネルステータス警告（実行中のGatewayからプローブ）。
    - 任意の修復を伴うスーパーバイザー設定監査（launchd/systemd/schtasks）。
    - インストールまたは更新中にシェルの`HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY`値を取得したGatewayサービス向けの埋め込みプロキシ環境クリーンアップ。
    - Gatewayランタイムのベストプラクティスチェック（NodeとBun、バージョンマネージャーパス）。
    - Gatewayポート衝突診断（デフォルト`18789`）。

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - オープンなDMポリシーに関するセキュリティ警告。
    - ローカルトークンモードのGateway認証チェック（トークンソースが存在しない場合にトークン生成を提案します。トークンSecretRef設定は上書きしません）。
    - デバイスペアリングの問題検出（保留中の初回ペア要求、保留中のロール/スコープアップグレード、古いローカルデバイストークンキャッシュのずれ、ペア済みレコードの認証ずれ）。

  </Accordion>
  <Accordion title="Workspace and shell">
    - Linuxでのsystemd lingerチェック。
    - ワークスペースブートストラップファイルサイズチェック（コンテキストファイルの切り詰め/上限間近の警告）。
    - シェル補完ステータスチェックと自動インストール/アップグレード。
    - メモリ検索埋め込みプロバイダー準備状況チェック（ローカルモデル、リモートAPIキー、またはQMDバイナリ）。
    - ソースインストールチェック（pnpmワークスペース不一致、UIアセット欠落、tsxバイナリ欠落）。
    - 更新された設定 + ウィザードメタデータを書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UIのバックフィルとリセット

Control UIのDreamsシーンには、グラウンデッドDreamingワークフロー向けの**バックフィル**、**リセット**、**グラウンデッドをクリア**アクションがあります。これらのアクションはGatewayのdoctor風RPCメソッドを使用しますが、`openclaw doctor` CLIの修復/移行の一部では**ありません**。

実行すること:

- **バックフィル**は、アクティブなワークスペース内の過去の`memory/YYYY-MM-DD.md`ファイルをスキャンし、グラウンデッドREM日記パスを実行し、可逆なバックフィルエントリを`DREAMS.md`に書き込みます。
- **リセット**は、`DREAMS.md`からマークされたバックフィル日記エントリのみを削除します。
- **グラウンデッドをクリア**は、履歴リプレイ由来で、まだライブリコールや日次サポートが蓄積されていない、ステージ済みのグラウンデッド専用短期エントリのみを削除します。

それ自体では実行しないこと:

- `MEMORY.md`を編集しません
- 完全なdoctor移行を実行しません
- 先にステージ済みCLIパスを明示的に実行しない限り、グラウンデッド候補をライブ短期昇格ストアへ自動的にステージしません

グラウンデッド履歴リプレイを通常の深い昇格レーンに影響させたい場合は、代わりにCLIフローを使用します。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md`をレビュー面として維持しながら、グラウンデッドで耐久性のある候補を短期Dreamingストアにステージします。

## 詳細な動作と根拠

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    これがgitチェックアウトで、doctorが対話的に実行されている場合、doctorを実行する前に更新（fetch/rebase/build）を提案します。
  </Accordion>
  <Accordion title="1. Config normalization">
    設定にレガシー値の形（たとえば、チャンネル固有の上書きなしの`messages.ackReaction`）が含まれている場合、doctorはそれらを現在のスキーマへ正規化します。

    これにはレガシーTalkのフラットフィールドも含まれます。現在の公開Talk設定は`talk.provider` + `talk.providers.<provider>`です。Doctorは古い`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey`の形をプロバイダーマップへ書き換えます。

    Doctorは、`plugins.allow`が空ではなく、ツールポリシーが
    ワイルドカードまたはPlugin所有ツールのエントリを使用している場合にも警告します。`tools.allow: ["*"]`は、実際に読み込まれるPluginの
    ツールにのみ一致します。排他的なPlugin
    許可リストを迂回するものではありません。

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor`の実行を求めます。

    Doctorは次を実行します。

    - 見つかったレガシーキーを説明します。
    - 適用した移行を表示します。
    - 更新されたスキーマで`~/.openclaw/openclaw.json`を書き換えます。

    Gatewayも、起動時にレガシー設定形式を検出した場合はdoctor移行を自動実行するため、古い設定は手動介入なしで修復されます。Cronジョブストアの移行は`openclaw doctor --fix`によって処理されます。

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
    - 名前付き `accounts` があるが、単一アカウント用のトップレベルチャネル値が残っているチャネルでは、そのアカウントスコープの値を、そのチャネルに選ばれた昇格済みアカウントへ移動する（ほとんどのチャネルでは `accounts.default`。Matrix は既存の一致する名前付き/デフォルトターゲットを保持できる）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` を削除する。遅いプロバイダー/モデルのタイムアウトには `models.providers.<id>.timeoutSeconds` を使う
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` を削除する（レガシー拡張リレー設定）
    - レガシー `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 起動時は、`api` が将来の enum 値または未知の enum 値に設定されたプロバイダーも、閉じて失敗するのではなくスキップする）

    Doctor の警告には、マルチアカウントチャネル向けのアカウントデフォルトガイダンスも含まれる:

    - 2つ以上の `channels.<channel>.accounts` エントリが、`channels.<channel>.defaultAccount` または `accounts.default` なしで設定されている場合、フォールバックルーティングが予期しないアカウントを選ぶ可能性があると doctor が警告する。
    - `channels.<channel>.defaultAccount` が未知のアカウント ID に設定されている場合、doctor が警告し、設定済みのアカウント ID を一覧表示する。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダー上書き">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、それは `@mariozechner/pi-ai` の組み込み OpenCode カタログを上書きする。その結果、モデルが誤った API に強制されたり、コストがゼロ化されたりする可能性がある。doctor は、上書きを削除してモデル単位の API ルーティングとコストを復元できるように警告する。
  </Accordion>
  <Accordion title="2c. ブラウザ移行と Chrome MCP 準備状況">
    ブラウザ設定が削除済みの Chrome 拡張パスをまだ指している場合、doctor はそれを現在のホストローカル Chrome MCP attach モデルに正規化する:

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になる
    - `browser.relayBindHost` は削除される

    doctor は、`defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使っている場合、ホストローカル Chrome MCP パスも監査する:

    - デフォルト自動接続プロファイルでは、同じホストに Google Chrome がインストールされているか確認する
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合は警告する
    - ブラウザの検査ページでリモートデバッグを有効にするよう通知する（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

    doctor は Chrome 側の設定を有効化できない。ホストローカル Chrome MCP には引き続き次が必要:

    - gateway/node ホスト上の Chromium ベースブラウザ 144+
    - ローカルで実行中のブラウザ
    - そのブラウザで有効化されたリモートデバッグ
    - ブラウザで最初の attach 同意プロンプトを承認すること

    ここでの準備状況は、ローカル attach の前提条件のみを対象とする。Existing-session は現在の Chrome MCP ルート制限を維持する。`responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなどの高度なルートには、引き続き managed browser または raw CDP プロファイルが必要。

    このチェックは Docker、sandbox、remote-browser、その他のヘッドレスフローには**適用されない**。それらは引き続き raw CDP を使う。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前提条件">
    OpenAI Codex OAuth プロファイルが設定されている場合、doctor は OpenAI 認可エンドポイントを調査し、ローカル Node/OpenSSL TLS スタックが証明書チェーンを検証できることを確認する。調査が証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、または自己署名証明書）で失敗した場合、doctor はプラットフォーム固有の修正ガイダンスを出力する。macOS で Homebrew Node を使っている場合、通常の修正は `brew postinstall ca-certificates`。`--deep` では、gateway が正常な場合でも調査が実行される。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダー上書き">
    以前に `models.providers.openai-codex` の下へレガシー OpenAI トランスポート設定を追加していた場合、それらは新しいリリースが自動的に使う組み込み Codex OAuth プロバイダーパスを覆い隠す可能性がある。doctor は Codex OAuth と一緒にそれらの古いトランスポート設定を検出すると警告し、古いトランスポート上書きを削除または書き換えて、組み込みのルーティング/フォールバック動作を取り戻せるようにする。カスタムプロキシとヘッダーのみの上書きは引き続きサポートされ、この警告をトリガーしない。
  </Accordion>
  <Accordion title="2f. Codex Plugin ルート警告">
    バンドルされた Codex Plugin が有効な場合、doctor は `openai-codex/*` のプライマリモデル参照がまだデフォルト PI runner 経由で解決されているかどうかも確認する。この組み合わせは PI 経由で Codex OAuth/サブスクリプション認証を使いたい場合には有効だが、ネイティブ Codex app-server ハーネスと混同しやすい。doctor は警告し、明示的な app-server 形状を示す: `openai/*` に加えて `agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex`。

    doctor はこれを自動修復しない。どちらのルートも有効なため:

    - `openai-codex/*` + PI は「通常の OpenClaw runner 経由で Codex OAuth/サブスクリプション認証を使う」という意味。
    - `openai/*` + `agentRuntime.id: "codex"` は「埋め込み turn をネイティブ Codex app-server 経由で実行する」という意味。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」という意味。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使う」という意味。

    警告が表示されたら、意図したルートを選び、設定を手動で編集する。PI Codex OAuth が意図したものなら、警告はそのままにする。

  </Accordion>
  <Accordion title="3. レガシー状態移行（ディスクレイアウト）">
    doctor は古いオンディスクレイアウトを現在の構造へ移行できる:

    - セッションストア + トランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）:
      - レガシー `~/.openclaw/credentials/*.json`（`oauth.json` を除く）から
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートで冪等だ。doctor は、バックアップとして残したレガシーフォルダーがある場合に警告を出す。Gateway/CLI も起動時にレガシーセッション + エージェントディレクトリを自動移行するため、手動で doctor を実行しなくても履歴/認証/モデルはエージェント単位のパスに配置される。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行される。Talk プロバイダー/プロバイダーマップの正規化は現在、構造的等価性で比較するため、キー順序のみの差分で繰り返し no-op の `doctor --fix` 変更が発生することはなくなった。

  </Accordion>
  <Accordion title="3a. レガシー Plugin マニフェスト移行">
    doctor は、非推奨のトップレベル capability キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）について、インストール済みのすべての Plugin マニフェストをスキャンする。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをその場で書き換えることを提案する。この移行は冪等だ。`contracts` キーにすでに同じ値がある場合、データを複製せずにレガシーキーが削除される。
  </Accordion>
  <Accordion title="3b. レガシー cron ストア移行">
    doctor は cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、または上書き時は `cron.store`）についても、スケジューラーが互換性のためにまだ受け付ける古いジョブ形状を確認する。

    現在の cron クリーンアップには次が含まれる:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルのペイロードフィールド（`message`、`model`、`thinking`、...）→ `payload`
    - トップレベルの配信フィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - ペイロードの `provider` 配信エイリアス → 明示的な `delivery.channel`
    - シンプルなレガシー `notify: true` webhook フォールバックジョブ → `delivery.to=cron.webhook` を持つ明示的な `delivery.mode="webhook"`

    doctor は、動作を変えずに実行できる場合に限り、`notify: true` ジョブを自動移行する。ジョブがレガシー notify フォールバックと既存の非 webhook 配信モードを組み合わせている場合、doctor は警告し、そのジョブを手動レビュー用に残す。

    Linux では、ユーザーの crontab がレガシー `~/.openclaw/bin/ensure-whatsapp.sh` をまだ呼び出している場合にも doctor が警告する。そのホストローカルスクリプトは現在の OpenClaw では保守されておらず、cron が systemd ユーザーバスに到達できない場合に `~/.openclaw/logs/whatsapp-health.log` へ誤った `Gateway inactive` メッセージを書き込む可能性がある。古い crontab エントリは `crontab -e` で削除する。現在のヘルスチェックには `openclaw channels status --probe`、`openclaw doctor`、`openclaw gateway status` を使う。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    Doctor は、すべてのエージェントセッションディレクトリをスキャンして古い書き込みロックファイル、つまりセッションが異常終了したときに残されたファイルを探します。見つかった各ロックファイルについて、パス、PID、その PID がまだ生存しているか、ロックの経過時間、古いと見なされるかどうか（PID が死んでいる、または 30 分より古い）を報告します。`--fix` / `--repair` モードでは古いロックファイルを自動的に削除します。それ以外の場合は注記を表示し、`--fix` を付けて再実行するよう指示します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトブランチの修復">
    Doctor は、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状がないか、エージェントセッションの JSONL ファイルをスキャンします。これは、OpenClaw 内部ランタイムコンテキストを含む放棄されたユーザーターンと、同じ可視ユーザープロンプトを含むアクティブな兄弟ブランチです。`--fix` / `--repair` モードでは、doctor は影響を受けた各ファイルを元ファイルの隣にバックアップし、トランスクリプトをアクティブブランチへ書き換えるため、gateway 履歴とメモリリーダーは重複ターンを見なくなります。
  </Accordion>
  <Accordion title="4. 状態整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の脳幹です。消失すると、別の場所にバックアップがない限り、セッション、認証情報、ログ、設定を失います。

    Doctor は次をチェックします。

    - **状態ディレクトリの欠落**: 壊滅的な状態喪失について警告し、ディレクトリの再作成を促し、欠落データは復元できないことを知らせます。
    - **状態ディレクトリの権限**: 書き込み可能性を確認します。権限の修復を提案し、所有者/グループの不一致が検出された場合は `chown` のヒントを出します。
    - **macOS のクラウド同期状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` 配下に解決される場合に警告します。同期対象パスは I/O が遅くなり、ロック/同期競合を引き起こす可能性があるためです。
    - **Linux の SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合に警告します。SD または eMMC を背後に持つランダム I/O は、セッションや認証情報の書き込み時に遅くなり、摩耗が早まる可能性があるためです。
    - **セッションディレクトリの欠落**: `sessions/` とセッションストアディレクトリは、履歴を永続化し、`ENOENT` クラッシュを避けるために必須です。
    - **トランスクリプトの不一致**: 最近のセッションエントリでトランスクリプトファイルが欠落している場合に警告します。
    - **メインセッションの「1-line JSONL」**: メイントランスクリプトが 1 行しかない場合にフラグを立てます（履歴が蓄積されていません）。
    - **複数の状態ディレクトリ**: 複数の `~/.openclaw` フォルダーがホームディレクトリ間に存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分断される可能性があります）。
    - **リモートモードのリマインダー**: `gateway.mode=remote` の場合、doctor はリモートホストで実行するよう促します（状態はそこにあります）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全ユーザーに読み取り可能な場合に警告し、`600` への厳格化を提案します。

  </Accordion>
  <Accordion title="5. モデル認証の健全性（OAuth の有効期限）">
    Doctor は認証ストア内の OAuth プロファイルを検査し、トークンが期限切れ間近または期限切れの場合に警告し、安全な場合は更新できます。Anthropic の OAuth/トークンプロファイルが古い場合は、Anthropic API キーまたは Anthropic の setup-token パスを提案します。更新プロンプトは対話的に実行している場合（TTY）にのみ表示されます。`--non-interactive` では更新試行をスキップします。

    OAuth 更新が恒久的に失敗した場合（たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求めた場合）、doctor は再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを表示します。

    Doctor は、次の理由で一時的に使用できない認証プロファイルも報告します。

    - 短いクールダウン（レート制限/タイムアウト/認証失敗）
    - より長い無効化（請求/クレジット失敗）

  </Accordion>
  <Accordion title="6. フックモデル検証">
    `hooks.gmail.model` が設定されている場合、doctor はモデル参照をカタログおよび許可リストと照合し、解決できない、または許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージ修復">
    サンドボックス化が有効な場合、doctor は Docker イメージをチェックし、現在のイメージが欠落している場合はビルドするかレガシー名へ切り替えることを提案します。
  </Accordion>
  <Accordion title="7b. Plugin インストールのクリーンアップ">
    Doctor は `openclaw doctor --fix` / `openclaw doctor --repair` モードで、OpenClaw が生成したレガシーな Plugin 依存関係のステージング状態を削除します。これには、古い生成済み依存関係ルート、古いインストールステージディレクトリ、以前のバンドル Plugin 依存関係修復コードによるパッケージローカルの残骸が含まれます。

    Doctor は、設定がダウンロード可能な Plugin を参照しているがローカル Plugin レジストリで見つからない場合、それらを再インストールすることもできます。Gateway の起動と設定再読み込みはパッケージマネージャーを実行しません。Plugin のインストールは明示的な doctor/install/update 作業のままです。

  </Accordion>
  <Accordion title="8. Gateway サービス移行とクリーンアップのヒント">
    Doctor はレガシー gateway サービス（launchd/systemd/schtasks）を検出し、それらを削除して現在の gateway ポートを使用する OpenClaw サービスをインストールすることを提案します。追加の gateway らしいサービスをスキャンし、クリーンアップのヒントを表示することもできます。プロファイル名付きの OpenClaw gateway サービスはファーストクラスと見なされ、「追加」としてフラグ付けされません。

    Linux では、ユーザーレベルの gateway サービスが欠落している一方でシステムレベルの OpenClaw gateway サービスが存在する場合、doctor は 2 つ目のユーザーレベルサービスを自動的にはインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で調査し、重複を削除するか、システムスーパーバイザーが gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. 起動時の Matrix 移行">
    Matrix チャネルアカウントに保留中または対応可能なレガシー状態移行がある場合、doctor は（`--fix` / `--repair` モードで）移行前スナップショットを作成し、その後ベストエフォートの移行手順を実行します。レガシー Matrix 状態移行とレガシー暗号化状態の準備です。どちらの手順も致命的ではありません。エラーはログに記録され、起動は続行されます。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証のドリフト">
    Doctor は通常の健全性パスの一部として、デバイスペアリング状態を検査するようになりました。

    報告内容:

    - 保留中の初回ペアリング要求
    - すでにペアリング済みのデバイスに対する保留中のロールアップグレード
    - すでにペアリング済みのデバイスに対する保留中のスコープアップグレード
    - デバイス ID はまだ一致しているが、デバイス ID 情報が承認済みレコードと一致しなくなった公開鍵不一致の修復
    - 承認済みロールのアクティブトークンが欠落しているペアリング済みレコード
    - スコープが承認済みペアリングベースラインの外へドリフトしたペアリング済みトークン
    - gateway 側のトークンローテーションより古い、または古いスコープメタデータを持つ、現在のマシンのローカルキャッシュ済みデバイストークンエントリ

    Doctor はペアリング要求を自動承認したり、デバイストークンを自動ローテーションしたりしません。代わりに正確な次の手順を表示します。

    - `openclaw devices list` で保留中の要求を調査する
    - `openclaw devices approve <requestId>` で正確な要求を承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除して再承認する

    これにより、一般的な「すでにペアリング済みなのにまだペアリングが必要と言われる」穴を塞ぎます。doctor は初回ペアリング、保留中のロール/スコープアップグレード、古いトークン/デバイス ID 情報のドリフトを区別するようになりました。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    Doctor は、プロバイダーが許可リストなしで DM に開放されている場合、またはポリシーが危険な形で設定されている場合に警告を出します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemd ユーザーサービスとして実行している場合、doctor はログアウト後も gateway が生存し続けるよう lingering が有効であることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペース状態（Skills、Plugin、レガシーディレクトリ）">
    Doctor はデフォルトエージェントのワークスペース状態の概要を表示します。

    - **Skills 状態**: 対象、要件欠落、許可リストでブロックされた Skills を数えます。
    - **レガシーワークスペースディレクトリ**: `~/openclaw` やその他のレガシーワークスペースディレクトリが現在のワークスペースと並んで存在する場合に警告します。
    - **Plugin 状態**: 有効/無効/エラーの Plugin を数えます。エラーがある場合は Plugin ID を列挙します。バンドル Plugin の機能を報告します。
    - **Plugin 互換性警告**: 現在のランタイムとの互換性問題がある Plugin にフラグを立てます。
    - **Plugin 診断**: Plugin レジストリが出した読み込み時の警告やエラーを表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    Doctor は、ワークスペースのブートストラップファイル（たとえば `AGENTS.md`、`CLAUDE.md`、またはその他の注入コンテキストファイル）が、設定済みの文字数上限に近いか超えているかをチェックします。ファイルごとの生の文字数と注入後の文字数、切り詰め率、切り詰め原因（`max/file` または `max/total`）、合計予算に対する合計注入文字数の割合を報告します。ファイルが切り詰められている、または上限に近い場合、doctor は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` の調整に関するヒントを表示します。
  </Accordion>
  <Accordion title="11d. 古いチャネル Plugin のクリーンアップ">
    `openclaw doctor --fix` が欠落しているチャネル Plugin を削除するとき、その Plugin を参照していたぶら下がったチャネルスコープ設定も削除します。`channels.<id>` エントリ、チャネル名を指定した heartbeat ターゲット、`agents.*.models["<channel>/*"]` オーバーライドです。これにより、チャネルランタイムがなくなっているのに設定が gateway にバインドを要求し続ける Gateway 起動ループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    Doctor は現在のシェル（zsh、bash、fish、または PowerShell）にタブ補完がインストールされているかをチェックします。

    - シェルプロファイルが遅い動的補完パターン（`source <(openclaw completion ...)`）を使用している場合、doctor はそれをより高速なキャッシュファイル方式へアップグレードします。
    - 補完がプロファイルで設定されているがキャッシュファイルが欠落している場合、doctor はキャッシュを自動的に再生成します。
    - 補完がまったく設定されていない場合、doctor はインストールを促します（対話モードのみ。`--non-interactive` ではスキップされます）。

    キャッシュを手動で再生成するには `openclaw completion --write-state` を実行してください。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック（ローカルトークン）">
    Doctor はローカル gateway トークン認証の準備状態をチェックします。

    - トークンモードでトークンが必要で、トークンソースが存在しない場合、doctor は生成を提案します。
    - `gateway.auth.token` が SecretRef 管理だが利用できない場合、doctor は警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、ランタイムの fail-fast 動作を弱めることなく、設定済みの認証情報を調査する必要があります。

    - `openclaw doctor --fix` は、対象を絞った設定修復で、status 系コマンドと同じ読み取り専用 SecretRef 要約モデルを使用するようになりました。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` `@username` 修復は、利用可能な場合に設定済みボット認証情報を使用しようとします。
    - Telegram ボットトークンが SecretRef 経由で設定されているが現在のコマンドパスで利用できない場合、doctor は認証情報が設定済みだが利用不可であることを報告し、クラッシュしたりトークンが欠落していると誤報告したりせず、自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway 健全性チェックと再起動">
    Doctor は健全性チェックを実行し、gateway が不健全に見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状態">
    Doctor は、設定済みのメモリ検索埋め込みプロバイダーがデフォルトエージェントで準備できているかをチェックします。動作は設定済みのバックエンドとプロバイダーによって異なります。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動できるかをプローブします。できない場合は、npm パッケージと手動バイナリパスのオプションを含む修正ガイダンスを出力します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイル、または認識済みのリモート/ダウンロード可能なモデル URL を確認します。見つからない場合は、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー** (`openai`, `voyage` など): API キーが環境または認証ストアに存在することを検証します。見つからない場合は、実行可能な修正ヒントを出力します。
    - **自動プロバイダー**: まずローカルモデルの可用性を確認し、その後、自動選択順で各リモートプロバイダーを試します。

    キャッシュ済みの Gateway プローブ結果が利用可能な場合（チェック時点で Gateway が正常だった場合）、doctor はその結果を CLI から見える設定と照合し、不一致があれば記録します。doctor はデフォルトパスでは新しい埋め込み ping を開始しません。ライブのプロバイダーチェックが必要な場合は、deep メモリステータスコマンドを使用してください。

    実行時に埋め込みの準備状態を検証するには、`openclaw memory status --deep` を使用します。

  </Accordion>
  <Accordion title="14. チャンネルステータスの警告">
    Gateway が正常な場合、doctor はチャンネルステータスプローブを実行し、推奨修正とともに警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー設定の監査 + 修復">
    Doctor は、インストール済みのスーパーバイザー設定（launchd/systemd/schtasks）に、欠落または古いデフォルト（例: systemd の network-online 依存関係や再起動遅延）がないか確認します。不一致が見つかった場合は更新を推奨し、サービスファイル/タスクを現在のデフォルトに書き換えることができます。

    注:

    - `openclaw doctor` はスーパーバイザー設定を書き換える前に確認します。
    - `openclaw doctor --yes` はデフォルトの修復プロンプトを受け入れます。
    - `openclaw doctor --repair` は推奨修正をプロンプトなしで適用します。
    - `openclaw doctor --repair --force` はカスタムスーパーバイザー設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、Gateway サービスライフサイクルについて doctor を読み取り専用に保ちます。サービス健全性の報告と非サービス修復は引き続き行いますが、外部スーパーバイザーがそのライフサイクルを所有しているため、サービスのインストール/開始/再起動/ブートストラップ、スーパーバイザー設定の書き換え、レガシーサービスのクリーンアップはスキップします。
    - Linux では、一致する systemd Gateway ユニットがアクティブな間、doctor はコマンド/エントリポイントのメタデータを書き換えません。また、重複サービススキャン中は、非アクティブでレガシーではない追加の Gateway 風ユニットを無視するため、付随するサービスファイルによるクリーンアップノイズは発生しません。
    - トークン認証がトークンを必要とし、`gateway.auth.token` が SecretRef で管理されている場合、doctor のサービスインストール/修復は SecretRef を検証しますが、解決済みの平文トークン値をスーパーバイザーサービス環境メタデータに永続化しません。
    - Doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストールがインラインで埋め込んだ、管理対象の `.env`/SecretRef ベースのサービス環境値を検出し、それらの値がスーパーバイザー定義ではなく実行時ソースから読み込まれるようにサービスメタデータを書き換えます。
    - Doctor は、`gateway.port` の変更後もサービスコマンドが古い `--port` に固定されている場合を検出し、サービスメタデータを現在のポートに書き換えます。
    - トークン認証がトークンを必要とし、設定されたトークン SecretRef が未解決の場合、doctor は実行可能なガイダンスとともにインストール/修復パスをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定されており、`gateway.auth.mode` が未設定の場合、doctor はモードが明示的に設定されるまでインストール/修復をブロックします。
    - Linux のユーザー systemd ユニットでは、doctor のトークンドリフトチェックは、サービス認証メタデータを比較するときに `Environment=` と `EnvironmentFile=` の両方のソースを含むようになりました。
    - Doctor のサービス修復は、設定がより新しいバージョンによって最後に書き込まれている場合、古い OpenClaw バイナリからの Gateway サービスの書き換え、停止、再起動を拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` を使用すれば、いつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway 実行時 + ポート診断">
    Doctor はサービスの実行時（PID、最後の終了ステータス）を検査し、サービスがインストールされているが実際には実行されていない場合に警告します。また、Gateway ポート（デフォルトは `18789`）のポート衝突も確認し、考えられる原因（Gateway がすでに実行中、SSH トンネル）を報告します。
  </Accordion>
  <Accordion title="17. Gateway 実行時のベストプラクティス">
    Doctor は、Gateway サービスが Bun またはバージョン管理された Node パス（`nvm`, `fnm`, `volta`, `asdf` など）で実行されている場合に警告します。WhatsApp + Telegram チャンネルには Node が必要であり、サービスはシェル初期化を読み込まないため、バージョンマネージャーのパスはアップグレード後に壊れる可能性があります。Doctor は、利用可能な場合にシステム Node インストール（Homebrew/apt/choco）へ移行することを提案します。

    新しくインストールまたは修復されたサービスは、明示的な環境ルート（`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`）と安定したユーザー bin ディレクトリを保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、それらのディレクトリがディスク上に存在する場合にのみサービス PATH に書き込まれます。これにより、生成されるスーパーバイザー PATH は、doctor が後で実行する同じ最小 PATH 監査と整合します。

  </Accordion>
  <Accordion title="18. 設定書き込み + ウィザードメタデータ">
    Doctor は設定変更を永続化し、doctor 実行を記録するためにウィザードメタデータをスタンプします。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント（バックアップ + メモリシステム）">
    Doctor は、ワークスペースメモリシステムがない場合に提案し、ワークスペースがまだ git 管理下にない場合はバックアップのヒントを出力します。

    ワークスペース構造と git バックアップ（非公開 GitHub または GitLab を推奨）の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
