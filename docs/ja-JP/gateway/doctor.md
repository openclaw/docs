---
read_when:
    - doctorマイグレーションの追加または変更
    - 互換性のない設定変更を導入すること
summary: 'Doctorコマンド: ヘルスチェック、設定マイグレーション、および修復手順'
title: Doctor
x-i18n:
    generated_at: "2026-04-21T04:45:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6460fe657e7cf0d938bfbb77e1cc0355c1b67830327d441878e48375de52a46f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor`は、OpenClaw用の修復 + マイグレーションツールです。古い
config/stateを修正し、ヘルスチェックを行い、実行可能な修復手順を提示します。

## クイックスタート

```bash
openclaw doctor
```

### ヘッドレス / 自動化

```bash
openclaw doctor --yes
```

プロンプトを表示せずにデフォルトを受け入れます（該当する場合、restart/service/sandbox修復手順も含みます）。

```bash
openclaw doctor --repair
```

推奨される修復をプロンプトなしで適用します（安全な範囲での修復 + 再起動）。

```bash
openclaw doctor --repair --force
```

より強力な修復も適用します（カスタムsupervisor configを上書きします）。

```bash
openclaw doctor --non-interactive
```

プロンプトなしで実行し、安全なマイグレーションのみを適用します（configの正規化 + ディスク上のstate移動）。人による確認が必要なrestart/service/sandbox操作はスキップします。
検出されたlegacy state migrationは自動で実行されます。

```bash
openclaw doctor --deep
```

追加のgatewayインストールがないか、system servicesをスキャンします（launchd/systemd/schtasks）。

書き込み前に変更内容を確認したい場合は、まずconfigファイルを開いてください。

```bash
cat ~/.openclaw/openclaw.json
```

## 動作内容（概要）

- git install向けの任意の事前更新（対話モードのみ）。
- UI protocolの鮮度チェック（protocol schemaのほうが新しい場合はControl UIを再ビルド）。
- ヘルスチェック + 再起動プロンプト。
- Skillsの状態サマリー（eligible/missing/blocked）とplugin status。
- legacy valuesのconfig正規化。
- legacyなフラット`talk.*`フィールドから`talk.provider` + `talk.providers.<provider>`へのTalk config migration。
- legacy Chrome extension configとChrome MCP readinessに対するbrowser migration checks。
- OpenCode provider overrideの警告（`models.providers.opencode` / `models.providers.opencode-go`）。
- Codex OAuth shadowingの警告（`models.providers.openai-codex`）。
- OpenAI Codex OAuth profile向けのOAuth TLS前提条件チェック。
- ディスク上のlegacy state migration（sessions/agent dir/WhatsApp auth）。
- legacy plugin manifest contract key migration（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
- legacy Cron store migration（`jobId`、`schedule.cron`、トップレベルのdelivery/payload fields、payload `provider`、単純な`notify: true`のWebhook fallback jobs）。
- session lock fileの検査と古いlockのクリーンアップ。
- stateの整合性と権限チェック（sessions、transcripts、state dir）。
- ローカル実行時のconfig file権限チェック（chmod 600）。
- モデル認証の健全性: OAuth期限切れの確認、期限切れ間近トークンのrefresh、auth-profileのcooldown/disabled状態の報告。
- 追加workspace dirの検出（`~/openclaw`）。
- sandboxingが有効な場合のsandbox image修復。
- legacy service migrationと追加gateway検出。
- Matrix channelのlegacy state migration（`--fix` / `--repair`モード時）。
- Gateway runtime checks（serviceがインストール済みだが未実行、cached launchd label）。
- channel status warnings（実行中のgatewayからprobe）。
- supervisor config audit（launchd/systemd/schtasks）と任意の修復。
- Gateway runtimeのベストプラクティスチェック（Node vs Bun、version-manager paths）。
- Gateway port競合診断（デフォルト`18789`）。
- open DM policiesに対するセキュリティ警告。
- ローカルトークンモードにおけるGateway auth checks（トークンソースが存在しない場合はトークン生成を提案。token SecretRef configは上書きしない）。
- デバイスペアリングの問題検出（初回ペア要求の保留、role/scopeアップグレードの保留、古いlocal device-token cacheの不整合、paired-record auth drift）。
- Linuxでのsystemd lingerチェック。
- workspace bootstrap fileサイズチェック（コンテキストファイルの切り詰め/上限近接警告）。
- shell completionの状態チェックと自動インストール/アップグレード。
- memory search embedding provider readinessチェック（local model、remote API key、またはQMD binary）。
- ソースインストールチェック（pnpm workspace mismatch、missing UI assets、missing tsx binary）。
- 更新されたconfig + wizard metadataを書き込み。

## Dreams UIのbackfillとreset

Control UIのDreams sceneには、grounded dreaming workflow向けの**Backfill**、**Reset**、**Clear Grounded**
アクションがあります。これらのアクションはgatewayの
doctorスタイルRPCメソッドを使用しますが、`openclaw doctor` CLIの
修復/マイグレーションの一部では**ありません**。

これらが行うこと:

- **Backfill**は、アクティブな
  workspace内の過去の`memory/YYYY-MM-DD.md`ファイルをスキャンし、
  grounded REM diary passを実行し、
  元に戻せるbackfill entriesを`DREAMS.md`に書き込みます。
- **Reset**は、そのようにマークされたbackfill diary entriesだけを`DREAMS.md`から削除します。
- **Clear Grounded**は、過去のリプレイから来たgrounded専用のstaged short-term entriesのうち、
  まだlive recallやdaily
  supportが蓄積していないものだけを削除します。

これらが単独では行わないこと:

- `MEMORY.md`は編集しません
- 完全なdoctor migrationは実行しません
- 明示的にstaged CLI pathを先に実行しない限り、
  grounded candidatesをlive short-term
  promotion storeへ自動的にstageしません

groundedな過去リプレイを通常のdeep promotion
laneに反映させたい場合は、代わりにCLIフローを使ってください。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md`をレビュー対象として維持しつつ、
grounded durable candidatesをshort-term dreaming storeへstageします。

## 詳細な動作と理由

### 0) 任意の更新（git installs）

これがgit checkoutで、doctorが対話モードで実行されている場合、
doctorを実行する前に更新（fetch/rebase/build）するかを提案します。

### 1) Configの正規化

configにlegacyな値の形状が含まれている場合（たとえばchannel固有のoverrideなしの`messages.ackReaction`）、
doctorはそれらを現在の
schemaへ正規化します。

これにはlegacyなTalk flat fieldsも含まれます。現在の公開Talk configは
`talk.provider` + `talk.providers.<provider>`です。doctorは古い
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey`の形状をprovider mapへ書き換えます。

### 2) Legacy config key migrations

configにdeprecated keysが含まれている場合、他のコマンドは実行を拒否し、
`openclaw doctor`を実行するよう求めます。

doctorは以下を行います。

- どのlegacy keysが見つかったかを説明する。
- 適用したmigrationを表示する。
- 更新されたschemaで`~/.openclaw/openclaw.json`を書き換える。

Gatewayも、legacy config formatを検出すると起動時にdoctor migrationsを自動実行するため、
古いconfigは手動介入なしで修復されます。
Cron job store migrationsは`openclaw doctor --fix`で処理されます。

現在のmigration:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → トップレベル`bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- legacy `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- named `accounts`を持つchannelで、single-account用のトップレベルchannel valuesが残っている場合、それらのaccountスコープ値を、そのchannel用に選ばれたpromoted accountへ移動する（多くのchannelでは`accounts.default`。Matrixは既存の一致するnamed/default targetを維持できる）
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost`を削除（legacy extension relay setting）

doctorの警告には、multi-account channels向けのaccount-defaultガイダンスも含まれます。

- 2つ以上の`channels.<channel>.accounts`エントリが設定されているのに`channels.<channel>.defaultAccount`または`accounts.default`がない場合、doctorはfallback routingが予期しないaccountを選ぶ可能性があると警告します。
- `channels.<channel>.defaultAccount`が未知のaccount IDに設定されている場合、doctorは警告し、設定済みaccount IDを一覧表示します。

### 2b) OpenCode provider overrides

`models.providers.opencode`、`opencode-zen`、または`opencode-go`を
手動で追加している場合、それは`@mariozechner/pi-ai`由来の組み込みOpenCode catalogを上書きします。
その結果、モデルが誤ったAPIへ強制されたり、コストが0になったりする可能性があります。doctorは、
overrideを削除してモデルごとのAPI routing + costsを復元できるよう警告します。

### 2c) Browser migrationとChrome MCP readiness

browser configがまだ削除済みのChrome extension pathを指している場合、doctorは
それを現在のhost-local Chrome MCP attach modelへ正規化します。

- `browser.profiles.*.driver: "extension"`は`"existing-session"`になります
- `browser.relayBindHost`は削除されます

doctorはまた、`defaultProfile:
"user"`または設定済みの`existing-session` profileを使用している場合に、
host-local Chrome MCP pathを監査します。

- デフォルトの
  auto-connect profiles向けに、同じhostにGoogle Chromeがインストールされているかを確認する
- 検出したChrome versionを確認し、Chrome 144未満の場合は警告する
- browser inspect pageでremote debuggingを有効にするよう案内する（
  例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、
  または`edge://inspect/#remote-debugging`）

doctorは、Chrome側の設定を代わりに有効化することはできません。host-local Chrome MCPには引き続き次が必要です。

- gateway/node host上にあるChromium系browser 144+
- browserがローカルで起動していること
- そのbrowserでremote debuggingが有効であること
- browser内で最初のattach consent promptを承認すること

ここでのreadinessは、ローカルattachの前提条件だけに関するものです。Existing-sessionは
現在のChrome MCP route制限を維持します。`responsebody`、PDF
export、download interception、batch actionsのような高度なrouteには、
引き続きmanaged browserまたはraw CDP profileが必要です。

このチェックはDocker、sandbox、remote-browser、その他の
headlessフローには**適用されません**。それらは引き続きraw CDPを使用します。

### 2d) OAuth TLS前提条件

OpenAI Codex OAuth profileが設定されている場合、doctorはOpenAI
authorization endpointをprobeし、ローカルのNode/OpenSSL TLS stackが
certificate chainを検証できるか確認します。probeがcertificate errorで失敗した場合（
たとえば`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、expired cert、またはself-signed cert）、
doctorはplatform固有の修正ガイダンスを表示します。macOSでHomebrew版Nodeを使っている場合、
通常の修正は`brew postinstall ca-certificates`です。`--deep`では、
gatewayが健全でもprobeが実行されます。

### 2c) Codex OAuth provider overrides

以前にlegacyなOpenAI transport設定を
`models.providers.openai-codex`の下に追加していた場合、それらが新しいリリースで自動的に使われる
組み込みのCodex OAuth provider pathをシャドーすることがあります。doctorは、
Codex OAuthと一緒にそれらの古いtransport設定を検出すると警告を出します。これにより、
古いtransport overrideを削除または書き換えて、
組み込みのrouting/fallback動作を再び使えるようになります。
カスタムproxyやheader-only overrideは引き続きサポートされており、この警告は発生しません。

### 3) Legacy state migrations（ディスクレイアウト）

doctorは、古いディスク上のレイアウトを現在の構造へマイグレーションできます。

- Sessions store + transcripts:
  - `~/.openclaw/sessions/`から`~/.openclaw/agents/<agentId>/sessions/`へ
- Agent dir:
  - `~/.openclaw/agent/`から`~/.openclaw/agents/<agentId>/agent/`へ
- WhatsApp auth state（Baileys）:
  - legacyな`~/.openclaw/credentials/*.json`（`oauth.json`を除く）から
  - `~/.openclaw/credentials/whatsapp/<accountId>/...`へ（デフォルトのaccount id: `default`）

これらのマイグレーションはベストエフォートかつ冪等です。backupとして
legacy folderを残した場合、doctorは警告を出します。Gateway/CLIも、
legacyなsessions + agent dirを起動時に自動マイグレーションするため、
history/auth/modelsは手動でdoctorを実行しなくても
agentごとのpathへ配置されます。WhatsApp authは意図的に
`openclaw doctor`経由でのみマイグレーションされます。Talk provider/provider-mapの正規化は現在、
構造的同値性で比較するため、キー順だけが異なる差分では
no-opな`doctor --fix`変更が繰り返し発生しなくなりました。

### 3a) Legacy plugin manifest migrations

doctorは、インストール済みのすべてのplugin manifestをスキャンして、
非推奨のトップレベルcapability key
（`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、
`webSearchProviders`）を検出します。見つかった場合、それらを`contracts`
objectへ移動し、manifest fileをその場で書き換えることを提案します。このマイグレーションは冪等です。
`contracts`キーにすでに同じ値がある場合、legacy keyは
データを重複させずに削除されます。

### 3b) Legacy Cron store migrations

doctorはまた、Cron job store（デフォルトでは`~/.openclaw/cron/jobs.json`、
または上書き時は`cron.store`）に対して、schedulerが
互換性のため引き続き受け付ける古いjob形状がないか確認します。

現在のCronクリーンアップには次が含まれます。

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- トップレベルpayload fields（`message`、`model`、`thinking`、...）→ `payload`
- トップレベルdelivery fields（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
- payload `provider`のdelivery alias → 明示的な`delivery.channel`
- 単純なlegacy `notify: true` Webhook fallback jobs → 明示的な`delivery.mode="webhook"`と`delivery.to=cron.webhook`

doctorは、動作を変えずに実行できる場合にのみ`notify: true` jobsを
自動マイグレーションします。jobがlegacy notify fallbackと既存の
non-Webhook delivery modeを組み合わせている場合、doctorは警告し、
そのjobは手動レビュー用に残します。

### 3c) Session lock cleanup

doctorは、各agent session directoryをスキャンして、古いwrite-lock fileを探します。
これらはsessionが異常終了したときに残されたファイルです。検出した各lock fileについて、
次を報告します:
path、PID、そのPIDがまだ生きているか、lock age、そして
それが古いと見なされるかどうか（PIDが死んでいる、または30分以上経過）。`--fix` / `--repair`
モードでは、doctorは古いlock fileを自動で削除します。それ以外では注記を表示し、
`--fix`付きで再実行するよう案内します。

### 4) State integrity checks（セッション永続化、routing、安全性）

state directoryは運用上の脳幹です。これが消えると、
sessions、credentials、logs、configを失います
（別の場所にbackupがない限り）。

doctorは次を確認します。

- **State dir missing**: 深刻なstate喪失について警告し、
  directoryの再作成を提案し、欠落したデータは復旧できないことを通知します。
- **State dir permissions**: 書き込み可能か検証し、権限修復を提案します
  （owner/groupの不一致が検出された場合は`chown`のヒントも出します）。
- **macOS cloud-synced state dir**: stateがiCloud Drive
  （`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または
  `~/Library/CloudStorage/...`配下にある場合に警告します。syncベースのpathはI/O低下や
  lock/sync raceの原因になりうるためです。
- **Linux SD or eMMC state dir**: stateが`mmcblk*`
  mount sourceに解決される場合に警告します。SDまたはeMMCベースのランダムI/Oは、
  sessionやcredentialの書き込みで遅くなりやすく、摩耗も早いためです。
- **Session dirs missing**: `sessions/`とsession store directoryは、
  historyを永続化し、`ENOENT` crashを避けるために必要です。
- **Transcript mismatch**: 最近のsession entriesに対応する
  transcript fileが欠けている場合に警告します。
- **Main session “1-line JSONL”**: メインtranscriptが1行しかない場合にフラグを立てます
  （historyが蓄積されていない状態）。
- **Multiple state dirs**: 複数の`~/.openclaw` folderが
  home directoryをまたいで存在する場合や、`OPENCLAW_STATE_DIR`が別の場所を指している場合に警告します
  （インストール間でhistoryが分割される可能性があります）。
- **Remote mode reminder**: `gateway.mode=remote`の場合、
  doctorはremote host上で実行するよう案内します（stateはそこにあります）。
- **Config file permissions**: `~/.openclaw/openclaw.json`が
  group/world readableな場合に警告し、`600`へ制限することを提案します。

### 5) Model auth health（OAuth expiry）

doctorはauth store内のOAuth profileを検査し、トークンが
期限切れ間近または期限切れの場合に警告し、安全な場合はrefreshできます。Anthropic
OAuth/token profileが古い場合は、Anthropic API keyまたは
Anthropic setup-token pathを提案します。
refresh promptは対話モード（TTY）で実行中の場合にのみ表示されます。`--non-interactive`
ではrefresh試行をスキップします。

OAuth refreshが恒久的に失敗した場合（たとえば`refresh_token_reused`、
`invalid_grant`、または再サインインが必要だとproviderが示した場合）、
doctorは再認証が必要だと報告し、実行すべき正確な
`openclaw models auth login --provider ...`
コマンドを表示します。

doctorはまた、次の理由で一時的に使用できないauth profileも報告します。

- 短いcooldown（レート制限/タイムアウト/auth failures）
- 長めの無効化（課金/クレジットの失敗）

### 6) Hooks model validation

`hooks.gmail.model`が設定されている場合、doctorは
catalogおよびallowlistに対してmodel referenceを検証し、
解決できない、または許可されていない場合に警告します。

### 7) Sandbox image repair

sandboxingが有効な場合、doctorはDocker imageを確認し、
現在のimageがない場合はビルドまたはlegacy nameへの切り替えを提案します。

### 7b) バンドルされたpluginのruntime deps

doctorは、現在のconfigで有効か、またはbundled manifestのデフォルトで有効になっている
bundled pluginsについてのみruntime dependenciesを確認します。たとえば
`plugins.entries.discord.enabled: true`、legacyな
`channels.discord.enabled: true`、またはデフォルト有効のbundled providerです。
不足がある場合、doctorはpackagesを報告し、
`openclaw doctor --fix` / `openclaw doctor --repair`モードでインストールします。外部pluginsは引き続き
`openclaw plugins install` / `openclaw plugins update`を使用します。doctorは
任意のplugin pathに対してdependenciesをインストールしません。

### 8) Gateway service migrationsとcleanup hints

doctorはlegacyなgateway services（launchd/systemd/schtasks）を検出し、
それらを削除して現在のgateway
portを使用するOpenClaw serviceをインストールすることを提案します。
追加のgateway風serviceをスキャンし、cleanup hintを表示することもできます。
profile名付きのOpenClaw gateway servicesは第一級として扱われ、
「extra」とは見なされません。

### 8b) Startup Matrix migration

Matrix channel accountに保留中または実行可能なlegacy state migrationがある場合、
doctor（`--fix` / `--repair`モード）はpre-migration snapshotを作成してから、
ベストエフォートのmigration stepsを実行します: legacy Matrix state migrationと
legacy encrypted-state preparationです。どちらの手順も致命的ではなく、エラーは記録され、
startupは継続します。読み取り専用モード（`--fix`なしの`openclaw doctor`）では、このチェックは
完全にスキップされます。

### 8c) Device pairingとauth drift

doctorは現在、通常のhealth passの一部としてdevice-pairing stateを検査します。

報告される内容:

- 初回pairing requestの保留
- すでにpair済みdeviceに対するrole upgradeの保留
- すでにpair済みdeviceに対するscope upgradeの保留
- device idは一致しているがdevice
  identityが承認済みrecordと一致しなくなった場合のpublic-key mismatch repair
- 承認済みroleに対するactive tokenがないpaired records
- scopeが承認済みpairing baselineからずれたpaired tokens
- 現在のマシン向けのローカルcached device-token entriesで、
  gateway側のtoken rotationより古いもの、または古いscope metadataを持つもの

doctorはpair requestの自動承認やdevice tokenの自動ローテーションは行いません。
代わりに、正確な次の手順を表示します。

- 保留中requestを`openclaw devices list`で確認する
- 正確なrequestを`openclaw devices approve <requestId>`で承認する
- 新しいtokenを`openclaw devices rotate --device <deviceId> --role <role>`でローテーションする
- 古いrecordを`openclaw devices remove <deviceId>`で削除して再承認する

これにより、よくある「すでにpair済みなのに、それでもpairing requiredになる」
問題を解消します。doctorは現在、
初回pairing、保留中のrole/scope
upgrade、古いtoken/device-identity driftを区別します。

### 9) セキュリティ警告

doctorは、providerがallowlistなしでDMに開かれている場合や、
policyが危険な形で設定されている場合に警告を出します。

### 10) systemd linger（Linux）

systemd user serviceとして実行されている場合、doctorはlogout後も
gatewayが生き続けるよう、lingerが有効になっていることを確認します。

### 11) Workspace status（Skills、plugins、legacy dirs）

doctorは、デフォルトagentのworkspace stateの概要を表示します。

- **Skills status**: eligible、missing-requirements、allowlist-blockedのSkills数。
- **Legacy workspace dirs**: `~/openclaw`またはその他のlegacy workspace directoriesが
  現在のworkspaceと並存している場合に警告します。
- **Plugin status**: loaded/disabled/errored pluginsの数。errorがある
  plugin IDsを列挙し、bundle plugin capabilitiesを報告します。
- **Plugin compatibility warnings**: 現在のruntimeと互換性問題があるpluginsにフラグを立てます。
- **Plugin diagnostics**: plugin registryが
  load時に出したwarningやerrorを表示します。

### 11b) Bootstrap fileサイズ

doctorは、workspace bootstrap files（たとえば`AGENTS.md`、
`CLAUDE.md`、またはその他の注入されるcontext files）が設定された
文字数予算に近いか超過していないかを確認します。各ファイルについて、生文字数と注入後文字数、
切り詰め率、切り詰めの原因（`max/file`または`max/total`）、および
合計予算に対する総注入文字数の割合を報告します。ファイルが切り詰められているか上限に近い場合、
doctorは`agents.defaults.bootstrapMaxChars`
および`agents.defaults.bootstrapTotalMaxChars`の調整ヒントを表示します。

### 11c) Shell completion

doctorは、現在のshell
（zsh、bash、fish、またはPowerShell）に対してtab completionがインストールされているか確認します。

- shell profileが低速な動的completionパターン
  （`source <(openclaw completion ...)`）を使っている場合、doctorはそれをより高速な
  cached file方式へアップグレードします。
- profileにcompletionが設定されているがcache fileがない場合、
  doctorはcacheを自動再生成します。
- completionがまったく設定されていない場合、doctorはインストールを提案します
  （対話モードのみ。`--non-interactive`ではスキップ）。

cacheを手動で再生成するには`openclaw completion --write-state`を実行してください。

### 12) Gateway auth checks（local token）

doctorはローカルGateway token authの準備状況を確認します。

- token modeでtokenが必要なのにtoken sourceがない場合、doctorは生成を提案します。
- `gateway.auth.token`がSecretRef管理だが利用できない場合、doctorは警告し、
  平文で上書きしません。
- `openclaw doctor --generate-gateway-token`は、token SecretRefが設定されていない場合にのみ
  生成を強制します。

### 12b) 読み取り専用のSecretRef対応修復

一部の修復フローでは、runtimeのfail-fast動作を弱めずに、
設定済みcredentialsを検査する必要があります。

- `openclaw doctor --fix`は現在、status系コマンドと同じ読み取り専用SecretRef summary modelを、対象を絞ったconfig修復に使用します。
- 例: Telegramの`allowFrom` / `groupAllowFrom`の`@username`修復では、利用可能な場合に設定済みのbot credentialsを使おうとします。
- Telegram bot tokenがSecretRef経由で設定されているが現在のコマンドパスでは利用できない場合、doctorはcredentialが「configured-but-unavailable」であると報告し、クラッシュしたりtokenをmissingと誤報したりせずに自動解決をスキップします。

### 13) Gateway health check + restart

doctorはヘルスチェックを実行し、gatewayが
不健全に見える場合は再起動を提案します。

### 13b) Memory search readiness

doctorは、デフォルトagentに対して設定済みのmemory search embedding providerの準備が整っているか確認します。
動作は、設定されたbackendとproviderによって異なります。

- **QMD backend**: `qmd` binaryが利用可能で起動できるかをprobeします。
  できない場合は、npm packageや手動binary pathオプションを含む修正ガイダンスを表示します。
- **明示的なローカルprovider**: ローカルmodel fileまたは認識可能な
  remote/downloadable model URLを確認します。見つからない場合は、remote providerへの切り替えを提案します。
- **明示的なremote provider**（`openai`、`voyage`など）: API keyが
  environmentまたはauth storeに存在するか検証します。存在しない場合は、実行可能な修正ヒントを表示します。
- **Auto provider**: まずローカルmodelの可用性を確認し、その後
  auto-selection順に各remote providerを試します。

gateway probe結果が利用可能な場合（チェック時点でgatewayが健全だった場合）、
doctorはその結果をCLIから見えるconfigと照合し、
不一致があれば指摘します。

実行時のembedding readinessを確認するには`openclaw memory status --deep`を使用してください。

### 14) Channel status warnings

gatewayが健全な場合、doctorはchannel status probeを実行し、
推奨される修正とともに警告を報告します。

### 15) Supervisor config audit + repair

doctorは、インストール済みのsupervisor config（launchd/systemd/schtasks）に
不足または古いデフォルト設定（例: systemdのnetwork-online dependenciesや
restart delay）がないか確認します。不一致が見つかった場合は、
更新を推奨し、現在のデフォルトに合わせてservice file/taskを
書き換えることができます。

注記:

- `openclaw doctor`はsupervisor configを書き換える前に確認を求めます。
- `openclaw doctor --yes`はデフォルトの修復プロンプトを受け入れます。
- `openclaw doctor --repair`は推奨される修復をプロンプトなしで適用します。
- `openclaw doctor --repair --force`はカスタムsupervisor configsを上書きします。
- token authでtokenが必要で、`gateway.auth.token`がSecretRef管理の場合、doctorのservice install/repairはSecretRefを検証しますが、解決済みの平文token値をsupervisor service environment metadataへ永続化しません。
- token authでtokenが必要で、設定されたtoken SecretRefが未解決の場合、doctorはinstall/repair pathをブロックし、実行可能なガイダンスを表示します。
- `gateway.auth.token`と`gateway.auth.password`の両方が設定され、`gateway.auth.mode`が未設定の場合、doctorはmodeが明示的に設定されるまでinstall/repairをブロックします。
- Linux user-systemd unitsでは、doctorのtoken drift checksに、service auth metadataを比較するときの`Environment=`と`EnvironmentFile=`の両方のソースが含まれるようになりました。
- `openclaw gateway install --force`でいつでも完全な再書き込みを強制できます。

### 16) Gateway runtime + port diagnostics

doctorはservice runtime（PID、最後のexit status）を検査し、
serviceはインストール済みだが実際には実行されていない場合に警告します。また、
gateway port（デフォルト`18789`）のport競合も確認し、考えられる原因
（gatewayがすでに実行中、SSH tunnel）を報告します。

### 17) Gateway runtime best practices

doctorは、gateway serviceがBun上で動作している場合や、version-manager管理のNode path
（`nvm`、`fnm`、`volta`、`asdf`など）上で動作している場合に警告します。WhatsApp + Telegram channelsにはNodeが必要であり、
version-managerのpathは、serviceがshell initを読み込まないため、
アップグレード後に壊れる可能性があります。利用可能な場合、doctorはsystem Node installへの移行を提案します
（Homebrew/apt/choco）。

### 18) Config write + wizard metadata

doctorはconfig変更を永続化し、doctor実行を記録するために
wizard metadataを記録します。

### 19) Workspace tips（backup + memory system）

doctorは、存在しない場合はworkspace memory systemを提案し、
workspaceがまだgit管理下でない場合はbackupのヒントを表示します。

workspace構造とgit backup（推奨: private GitHubまたはGitLab）の完全なガイドについては、
[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace)を参照してください。
