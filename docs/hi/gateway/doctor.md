---
read_when:
    - doctor migrations जोड़ना या संशोधित करना
    - ब्रेकिंग कॉन्फ़िगरेशन बदलावों का परिचय
sidebarTitle: Doctor
summary: 'Doctor कमांड: स्वास्थ्य जांच, कॉन्फ़िग माइग्रेशन, और मरम्मत चरण'
title: डॉक्टर
x-i18n:
    generated_at: "2026-06-28T23:07:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` OpenClaw के लिए मरम्मत + माइग्रेशन टूल है। यह पुराने config/state को ठीक करता है, स्वास्थ्य जांचता है, और लागू करने योग्य मरम्मत चरण देता है।

## त्वरित शुरुआत

```bash
openclaw doctor
```

### Headless और automation मोड

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    संकेत दिए बिना defaults स्वीकार करें (जहां लागू हो, restart/service/sandbox मरम्मत चरणों सहित)।

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    संकेत दिए बिना अनुशंसित मरम्मत लागू करें (जहां सुरक्षित हो, मरम्मत + restarts)।

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    CI या preflight automation के लिए structured स्वास्थ्य जांच चलाएं। यह मोड
    read-only है: यह संकेत नहीं देता, मरम्मत नहीं करता, config migrate नहीं करता, services restart नहीं करता, या
    state को नहीं छूता।

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    आक्रामक मरम्मत भी लागू करें (custom supervisor configs को overwrite करता है)।

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    prompts के बिना चलाएं और केवल सुरक्षित migrations लागू करें (config normalization + on-disk state moves)। उन restart/service/sandbox actions को छोड़ता है जिनके लिए मानवीय पुष्टि चाहिए। Legacy state migrations पहचाने जाने पर अपने आप चलते हैं।

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    अतिरिक्त gateway installs के लिए system services scan करें (launchd/systemd/schtasks)।

  </Tab>
</Tabs>

अगर आप लिखने से पहले बदलावों की समीक्षा करना चाहते हैं, तो पहले config file खोलें:

```bash
cat ~/.openclaw/openclaw.json
```

## Read-only lint मोड

`openclaw doctor --lint`, `openclaw doctor --fix` का automation-अनुकूल sibling है। दोनों doctor health checks का उपयोग करते हैं, लेकिन उनका रुख
अलग है:

| मोड                     | Prompts   | config/state लिखता है     | Output                 | इसके लिए उपयोग करें                      |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | हां       | नहीं                      | अनुकूल health report | status जांचने वाला मानव         |
| `openclaw doctor --fix`  | कभी-कभी | हां, repair policy के साथ | अनुकूल repair log    | approved repairs लागू करना       |
| `openclaw doctor --lint` | नहीं        | नहीं                      | structured findings    | CI, preflight, और review gates |

Modernized health checks वैकल्पिक `repair()` implementation दे सकते हैं।
`doctor --fix` मौजूद होने पर उन repairs को लागू करता है और उन checks के लिए मौजूदा doctor repair flow का उपयोग जारी रखता है जो अभी migrate नहीं हुए हैं।
Structured repair contract repair reporting को detection से भी अलग करता है:
`detect()` मौजूदा findings report करता है, जबकि `repair()` changes,
config/file diffs, और non-file side effects report कर सकता है। यह भविष्य के `doctor --fix --dry-run` और diff output के लिए migration path खुला रखता है, बिना lint checks को
mutations plan करवाए।

उदाहरण:

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON output में शामिल है:

- `ok`: क्या कोई visible finding selected severity threshold पर पहुंची
- `checksRun`: execute किए गए health checks की संख्या
- `checksSkipped`: selected profile, `--only`, या `--skip` से छोड़ी गई checks
- `findings`: `checkId`, `severity`, `message`, और
  वैकल्पिक `path`, `line`, `column`, `ocPath`, और `fixHint` के साथ structured diagnostics

Exit codes:

- `0`: selected threshold पर या उससे ऊपर कोई findings नहीं
- `1`: एक या अधिक findings selected threshold पर पहुंचीं
- `2`: lint findings emit होने से पहले command/runtime failure

क्या print होता है और क्या non-zero lint exit कराता है, दोनों नियंत्रित करने के लिए `--severity-min info|warning|error` का उपयोग करें। Complete lint inventory चलाने के लिए `--all` का उपयोग करें,
जिसमें default automation set से बाहर रखे गए deeper opt-in checks भी शामिल हैं। संकरे preflight gates के लिए `--only <id>` और
बाकी lint run को सक्रिय रखते हुए शोर वाली check को अस्थायी रूप से बाहर करने के लिए
`--skip <id>` का उपयोग करें।
`--json`, `--severity-min`, `--all`, `--only`, और
`--skip` जैसे lint-output options को `--lint` के साथ जोड़ा जाना चाहिए; regular doctor और repair runs उन्हें reject करते हैं।

## यह क्या करता है (सारांश)

<AccordionGroup>
  <Accordion title="Health, UI, और updates">
    - git installs के लिए वैकल्पिक pre-flight update (केवल interactive)।
    - UI protocol freshness check (protocol schema नया होने पर Control UI rebuild करता है)।
    - Health check + restart prompt।
    - Skills status summary (eligible/missing/blocked) और plugin status।

  </Accordion>
  <Accordion title="Config और migrations">
    - legacy values के लिए config normalization।
    - legacy flat `talk.*` fields से `talk.provider` + `talk.providers.<provider>` में Talk config migration।
    - legacy Chrome extension configs और Chrome MCP readiness के लिए browser migration checks।
    - OpenCode provider override warnings (`models.providers.opencode` / `models.providers.opencode-go`)।
    - Legacy OpenAI Codex provider/profile migration (`openai-codex` → `openai`) और stale `models.providers.openai-codex` के लिए shadowing warnings।
    - OpenAI Codex OAuth profiles के लिए OAuth TLS prerequisites check।
    - जब `plugins.allow` restrictive हो लेकिन tool policy अभी भी wildcard या plugin-owned tools मांगती हो, तब Plugin/tool allowlist warnings।
    - Legacy on-disk state migration (sessions/agent dir/WhatsApp auth)।
    - Legacy plugin manifest contract key migration (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)।
    - Legacy cron store migration (`jobId`, `schedule.cron`, top-level delivery/payload fields, payload `provider`, `notify: true` webhook fallback jobs)।
    - Legacy whole-agent runtime-policy cleanup; provider/model runtime policy सक्रिय route selector है।
    - plugins enabled होने पर stale plugin config cleanup; जब `plugins.enabled=false` हो, stale plugin references को inert containment config माना जाता है और preserve किया जाता है।

  </Accordion>
  <Accordion title="State और integrity">
    - Session lock file inspection और stale lock cleanup।
    - प्रभावित 2026.4.24 builds द्वारा बनाए गए duplicated prompt-rewrite branches के लिए session transcript repair।
    - Wedged subagent restart-recovery tombstone detection, `--fix` support के साथ stale aborted recovery flags clear करने के लिए, ताकि startup child को restart-aborted मानता न रहे।
    - State integrity और permissions checks (sessions, transcripts, state dir)।
    - locally चलने पर config file permission checks (chmod 600)।
    - Model auth health: OAuth expiry checks करता है, expiring tokens refresh कर सकता है, और auth-profile cooldown/disabled states report करता है।

  </Accordion>
  <Accordion title="Gateway, services, और supervisors">
    - sandboxing enabled होने पर Sandbox image repair।
    - Legacy service migration और extra gateway detection।
    - Matrix channel legacy state migration (`--fix` / `--repair` mode में)।
    - Gateway runtime checks (service installed but not running; cached launchd label)।
    - Channel status warnings (running gateway से probed)।
    - Channel-specific permission checks `openclaw channels capabilities` के अंतर्गत रहते हैं; उदाहरण के लिए, Discord voice channel permissions को `openclaw channels capabilities --channel discord --target channel:<channel-id>` से audit किया जाता है।
    - local TUI clients अभी भी चल रहे हों तो degraded Gateway event-loop health के लिए WhatsApp responsiveness checks; `--fix` केवल verified local TUI clients को stop करता है।
    - primary models, fallbacks, image/video generation models, heartbeat/subagent/compaction overrides, hooks, channel model overrides, और session route pins में legacy `openai-codex/*` model refs के लिए Codex route repair; `--fix` उन्हें `openai/*` में rewrite करता है, `openai-codex:*` auth profiles/order को `openai:*` में migrate करता है, stale session/whole-agent runtime pins हटाता है, और canonical OpenAI agent refs को default Codex harness पर छोड़ता है।
    - optional repair के साथ Supervisor config audit (launchd/systemd/schtasks)।
    - gateway services के लिए embedded proxy environment cleanup, जिन्होंने install या update के दौरान shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` values capture किए थे।
    - Gateway runtime best-practice checks (Node vs Bun, version-manager paths)।
    - Gateway port collision diagnostics (default `18789`)।

  </Accordion>
  <Accordion title="Auth, security, और pairing">
    - open DM policies के लिए security warnings।
    - local token mode के लिए Gateway auth checks (token source मौजूद न होने पर token generation offer करता है; token SecretRef configs overwrite नहीं करता)।
    - Device pairing trouble detection (pending first-time pair requests, pending role/scope upgrades, stale local device-token cache drift, और paired-record auth drift)।

  </Accordion>
  <Accordion title="Workspace और shell">
    - Linux पर systemd linger check।
    - Workspace bootstrap file size check (context files के लिए truncation/near-limit warnings)।
    - default agent के लिए Skills readiness check; missing bins, env, config, या OS requirements वाले allowed skills report करता है, और `--fix` unavailable skills को `skills.entries` में disable कर सकता है।
    - Shell completion status check और auto-install/upgrade।
    - Memory search embedding provider readiness check (local model, remote API key, या QMD binary)।
    - Source install checks (pnpm workspace mismatch, missing UI assets, missing tsx binary)।
    - updated config + wizard metadata लिखता है।

  </Accordion>
</AccordionGroup>

## Dreams UI backfill और reset

Control UI Dreams scene में grounded dreaming workflow के लिए **Backfill**, **Reset**, और **Clear Grounded** actions शामिल हैं। ये actions gateway doctor-style RPC methods का उपयोग करते हैं, लेकिन ये `openclaw doctor` CLI repair/migration का हिस्सा **नहीं** हैं।

वे क्या करते हैं:

- **Backfill** active workspace में historical `memory/YYYY-MM-DD.md` files scan करता है, grounded REM diary pass चलाता है, और reversible backfill entries को `DREAMS.md` में लिखता है।
- **Reset** केवल उन marked backfill diary entries को `DREAMS.md` से हटाता है।
- **Clear Grounded** केवल staged grounded-only short-term entries को हटाता है जो historical replay से आई थीं और जिनमें अभी live recall या daily support जमा नहीं हुआ है।

वे अपने आप क्या **नहीं** करते:

- वे `MEMORY.md` edit नहीं करते
- वे full doctor migrations नहीं चलाते
- वे grounded candidates को live short-term promotion store में अपने आप stage नहीं करते, जब तक आप पहले staged CLI path explicit रूप से न चलाएं

अगर आप चाहते हैं कि grounded historical replay normal deep promotion lane को प्रभावित करे, तो इसके बजाय CLI flow का उपयोग करें:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

यह grounded durable candidates को short-term dreaming store में stage करता है, जबकि `DREAMS.md` को review surface बनाए रखता है।

## विस्तृत व्यवहार और तर्क

<AccordionGroup>
  <Accordion title="0. वैकल्पिक update (git installs)">
    यदि यह git checkout है और doctor interactively चल रहा है, तो यह doctor चलाने से पहले update (fetch/rebase/build) करने की पेशकश करता है।
  </Accordion>
  <Accordion title="1. Config normalization">
    यदि config में legacy value shapes हैं (उदाहरण के लिए channel-specific override के बिना `messages.ackReaction`), तो doctor उन्हें current schema में normalize करता है।

    इसमें legacy Talk flat fields शामिल हैं। Current public Talk speech config `talk.provider` + `talk.providers.<provider>` है, और realtime voice config `talk.realtime.*` है। Doctor पुराने `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` shapes को provider map में rewrite करता है, और legacy top-level realtime selectors (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) को `talk.realtime` में rewrite करता है।

    Doctor तब भी चेतावनी देता है जब `plugins.allow` खाली न हो और टूल नीति
    wildcard या Plugin-स्वामित्व वाली टूल प्रविष्टियों का उपयोग करती हो। `tools.allow: ["*"]` केवल उन टूल से मेल खाता है
    जो वास्तव में लोड होने वाले plugins से आते हैं; यह विशेष Plugin
    allowlist को bypass नहीं करता।

  </Accordion>
  <Accordion title="2. लेगसी कॉन्फ़िग कुंजी माइग्रेशन">
    जब कॉन्फ़िग में deprecated कुंजियाँ होती हैं, तो अन्य कमांड चलने से इनकार करते हैं और आपसे `openclaw doctor` चलाने को कहते हैं।

    Doctor करेगा:

    - बताएगा कि कौन-सी लेगसी कुंजियाँ मिलीं।
    - वह माइग्रेशन दिखाएगा जो उसने लागू किया।
    - अपडेट किए गए schema के साथ `~/.openclaw/openclaw.json` को फिर से लिखेगा।

    Gateway startup लेगसी कॉन्फ़िग formats को अस्वीकार करता है और आपसे `openclaw doctor --fix` चलाने को कहता है; यह startup पर `openclaw.json` को फिर से नहीं लिखता। Cron job store migrations भी `openclaw doctor --fix` से संभाले जाते हैं।

    मौजूदा migrations:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - retired `channels.webchat` और `gateway.webchat` हटाएँ
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → top-level `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - लेगसी `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - लेगसी top-level realtime Talk selectors (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` और `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` और `messages.tts.providers.microsoft`
    - TTS speaker selection fields (`voice`/`voiceName`/`voiceId`) → `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` और `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` और `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - जिन channels में नामित `accounts` हैं लेकिन single-account top-level channel values बचे हुए हैं, उन account-scoped values को उस channel के लिए चुने गए promoted account में ले जाएँ (अधिकांश channels के लिए `accounts.default`; Matrix किसी मौजूदा matching named/default target को सुरक्षित रख सकता है)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` हटाएँ; धीमे provider/model timeouts के लिए `models.providers.<id>.timeoutSeconds` का उपयोग करें, और जब पूरी run को अधिक देर तक चलना हो तो agent/run timeout को उस मान से ऊपर रखें
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` हटाएँ (लेगसी extension relay setting)
    - लेगसी `models.providers.*.api: "openai"` → `"openai-completions"` (Gateway startup उन providers को भी छोड़ देता है जिनका `api` किसी future या unknown enum value पर सेट है, बंद होकर fail होने के बजाय)
    - `plugins.entries.codex.config.codexDynamicToolsProfile` हटाएँ; Codex app-server हमेशा Codex-native workspace tools को native रखता है

    Doctor warnings में multi-account channels के लिए account-default guidance भी शामिल है:

    - अगर दो या अधिक `channels.<channel>.accounts` entries `channels.<channel>.defaultAccount` या `accounts.default` के बिना configured हैं, तो doctor चेतावनी देता है कि fallback routing कोई अनपेक्षित account चुन सकती है।
    - अगर `channels.<channel>.defaultAccount` किसी unknown account ID पर सेट है, तो doctor चेतावनी देता है और configured account IDs सूचीबद्ध करता है।

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    अगर आपने `models.providers.opencode`, `opencode-zen`, या `opencode-go` manually जोड़ा है, तो यह `openclaw/plugin-sdk/llm` से built-in OpenCode catalog को override करता है। इससे models गलत API पर force हो सकते हैं या costs zero हो सकती हैं। Doctor चेतावनी देता है ताकि आप override हटा सकें और per-model API routing + costs restore कर सकें।
  </Accordion>
  <Accordion title="2c. Browser migration और Chrome MCP readiness">
    अगर आपका browser config अभी भी हटाए गए Chrome extension path की ओर इशारा करता है, तो doctor उसे मौजूदा host-local Chrome MCP attach model में normalize करता है:

    - `browser.profiles.*.driver: "extension"` becomes `"existing-session"`
    - `browser.relayBindHost` हटाया जाता है

    जब आप `defaultProfile: "user"` या configured `existing-session` profile का उपयोग करते हैं, तो Doctor host-local Chrome MCP path का audit भी करता है:

    - default auto-connect profiles के लिए जाँचता है कि Google Chrome उसी host पर installed है या नहीं
    - detected Chrome version की जाँचता है और Chrome 144 से कम होने पर चेतावनी देता है
    - आपको browser inspect page में remote debugging enable करने की याद दिलाता है (उदाहरण के लिए `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, या `edge://inspect/#remote-debugging`)

    Doctor आपके लिए Chrome-side setting enable नहीं कर सकता। Host-local Chrome MCP को अभी भी चाहिए:

    - gateway/node host पर Chromium-based browser 144+
    - browser locally चल रहा हो
    - उस browser में remote debugging enabled हो
    - browser में पहले attach consent prompt को approve करना

    यहाँ readiness केवल local attach prerequisites के बारे में है। Existing-session मौजूदा Chrome MCP route limits रखता है; `responsebody`, PDF export, download interception, और batch actions जैसे advanced routes के लिए अभी भी managed browser या raw CDP profile चाहिए।

    यह check Docker, sandbox, remote-browser, या अन्य headless flows पर लागू **नहीं** होता। वे raw CDP का उपयोग जारी रखते हैं।

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    जब कोई OpenAI Codex OAuth profile configured होता है, तो doctor OpenAI authorization endpoint को probe करता है ताकि verify किया जा सके कि local Node/OpenSSL TLS stack certificate chain validate कर सकता है। अगर probe certificate error के साथ fail होता है (उदाहरण के लिए `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, expired cert, या self-signed cert), तो doctor platform-specific fix guidance print करता है। macOS पर Homebrew Node के साथ, fix आम तौर पर `brew postinstall ca-certificates` होता है। `--deep` के साथ, probe Gateway healthy होने पर भी चलता है।
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    अगर आपने पहले `models.providers.openai-codex` के तहत लेगसी OpenAI transport settings जोड़ी थीं, तो वे built-in Codex OAuth provider path को shadow कर सकती हैं, जिसका नए releases अपने आप उपयोग करते हैं। Doctor जब Codex OAuth के साथ वे पुराने transport settings देखता है तो चेतावनी देता है, ताकि आप stale transport override हटा या फिर से लिख सकें और built-in routing/fallback behavior वापस पा सकें। Custom proxies और header-only overrides अभी भी supported हैं और यह warning trigger नहीं करते।
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor लेगसी `openai-codex/*` model refs की जाँच करता है। Native Codex harness routing canonical `openai/*` model refs का उपयोग करती है; OpenAI agent turns OpenClaw OpenAI provider path के बजाय Codex app-server harness से गुजरते हैं।

    `--fix` / `--repair` mode में, doctor affected default-agent और per-agent refs को फिर से लिखता है, जिनमें primary models, fallbacks, image/video generation models, heartbeat/subagent/compaction overrides, hooks, channel model overrides, और stale persisted session route state शामिल हैं:

    - `openai-codex/gpt-*` becomes `openai/gpt-*`.
    - Codex intent repaired agent model refs के लिए provider/model-scoped `agentRuntime.id: "codex"` entries में जाता है।
    - Stale whole-agent runtime config और persisted session runtime pins हटाए जाते हैं क्योंकि runtime selection provider/model-scoped है।
    - Existing provider/model runtime policy सुरक्षित रखी जाती है जब तक repaired legacy model ref को पुराना auth path बनाए रखने के लिए Codex routing की जरूरत न हो।
    - Existing model fallback lists अपनी legacy entries rewrite करके सुरक्षित रखी जाती हैं; copied per-model settings legacy key से canonical `openai/*` key में जाती हैं।
    - Persisted session `modelProvider`/`providerOverride`, `model`/`modelOverride`, fallback notices, और auth-profile pins सभी discovered agent session stores में repaired किए जाते हैं।
    - `/codex ...` का अर्थ है "chat से native Codex conversation को control या bind करें।"
    - `/acp ...` या `runtime: "acp"` का अर्थ है "external ACP/acpx adapter का उपयोग करें।"

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor discovered agent session stores को stale auto-created route state के लिए भी scan करता है, जब आप configured models या runtime को Codex जैसे Plugin-owned route से दूर ले जाते हैं।

    `openclaw doctor --fix` auto-created stale state को clear कर सकता है, जैसे `modelOverrideSource: "auto"` model pins, runtime model metadata, pinned harness ids, CLI session bindings, और auto auth-profile overrides, जब उनका owning route अब configured नहीं है। Explicit user या legacy session model choices manual review के लिए reported होते हैं और untouched छोड़े जाते हैं; जब वह route अब intended न हो, तो उन्हें `/model ...`, `/new` से switch करें, या session reset करें।

  </Accordion>
  <Accordion title="3. लेगसी state migrations (disk layout)">
    Doctor पुराने on-disk layouts को मौजूदा structure में migrate कर सकता है:

    - Sessions store + transcripts:
      - `~/.openclaw/sessions/` से `~/.openclaw/agents/<agentId>/sessions/` में
    - Agent dir:
      - `~/.openclaw/agent/` से `~/.openclaw/agents/<agentId>/agent/` में
    - WhatsApp auth state (Baileys):
      - लेगसी `~/.openclaw/credentials/*.json` से (`oauth.json` को छोड़कर)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` में (default account id: `default`)

    ये migrations best-effort और idempotent हैं; doctor जब किसी भी legacy folders को backups के रूप में पीछे छोड़ता है तो warnings emit करेगा। Gateway/CLI भी startup पर legacy sessions + agent dir को auto-migrate करता है ताकि history/auth/models manual doctor run के बिना per-agent path में land हों। WhatsApp auth को जानबूझकर केवल `openclaw doctor` के माध्यम से migrate किया जाता है। Talk provider/provider-map normalization अब structural equality से compare करता है, इसलिए key-order-only diffs अब repeat no-op `doctor --fix` changes trigger नहीं करते।

  </Accordion>
  <Accordion title="3a. पुराने Plugin मैनिफेस्ट माइग्रेशन">
    Doctor सभी इंस्टॉल किए गए Plugin मैनिफेस्ट में अप्रचलित शीर्ष-स्तरीय capability कुंजियों (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) के लिए स्कैन करता है। मिलने पर, यह उन्हें `contracts` ऑब्जेक्ट में ले जाने और मैनिफेस्ट फ़ाइल को उसी स्थान पर फिर से लिखने की पेशकश करता है। यह माइग्रेशन idempotent है; यदि `contracts` कुंजी में पहले से वही मान हैं, तो डेटा को डुप्लिकेट किए बिना legacy कुंजी हटा दी जाती है।
  </Accordion>
  <Accordion title="3b. पुराने cron स्टोर माइग्रेशन">
    Doctor पुराने job shapes के लिए cron job store (डिफ़ॉल्ट रूप से `~/.openclaw/cron/jobs.json`, या ओवरराइड होने पर `cron.store`) की भी जांच करता है जिन्हें scheduler अभी भी compatibility के लिए स्वीकार करता है।

    मौजूदा cron cleanups में शामिल हैं:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - शीर्ष-स्तरीय payload fields (`message`, `model`, `thinking`, ...) → `payload`
    - शीर्ष-स्तरीय delivery fields (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload `provider` delivery aliases → स्पष्ट `delivery.channel`
    - legacy `notify: true` webhook fallback jobs → `cron.webhook` सेट होने पर उससे स्पष्ट webhook delivery; announce jobs अपनी chat delivery रखते हैं और `delivery.completionDestination` पाते हैं। जब `cron.webhook` unset हो, तो no-target jobs के लिए निष्क्रिय शीर्ष-स्तरीय `notify` marker हटाया जाता है (मौजूदा delivery, announce सहित, सुरक्षित रहती है) क्योंकि runtime delivery इसे कभी नहीं पढ़ती

    Gateway load time पर malformed cron rows को भी sanitize करता है ताकि मान्य jobs चलती रहें। Raw malformed rows को `jobs.json` से हटाने से पहले active store के बगल में `jobs-quarantine.json` में कॉपी किया जाता है; doctor quarantined rows की रिपोर्ट करता है ताकि आप उन्हें manually review या repair कर सकें।

    Gateway startup runtime projection को normalize करता है और शीर्ष-स्तरीय `notify` marker को ignore करता है, लेकिन doctor repair के लिए persisted cron config को छोड़ देता है। जब `cron.webhook` unset हो, तो doctor उन jobs के लिए inert marker हटाता है जिनका कोई migration target नहीं है (`delivery.mode` none/absent, unusable webhook target, या मौजूदा announce/chat delivery), existing delivery को अछूता छोड़ते हुए, ताकि बार-बार `doctor --fix` चलाने पर उसी job के बारे में फिर warning न आए। यदि `cron.webhook` set है लेकिन valid HTTP(S) URL नहीं है, तो doctor अभी भी warn करता है और marker छोड़ देता है ताकि आप URL ठीक कर सकें।

    Linux पर, doctor यह भी warn करता है जब user का crontab अभी भी legacy `~/.openclaw/bin/ensure-whatsapp.sh` invoke करता है। यह host-local script वर्तमान OpenClaw द्वारा maintained नहीं है और जब cron systemd user bus तक नहीं पहुंच पाता तो `~/.openclaw/logs/whatsapp-health.log` में false `Gateway inactive` messages लिख सकता है। stale crontab entry को `crontab -e` से हटाएं; current health checks के लिए `openclaw channels status --probe`, `openclaw doctor`, और `openclaw gateway status` का उपयोग करें।

  </Accordion>
  <Accordion title="3c. session lock cleanup">
    Doctor stale write-lock files के लिए हर agent session directory को scan करता है — वे files जो किसी session के असामान्य रूप से exit होने पर पीछे रह जाती हैं। मिली हुई प्रत्येक lock file के लिए यह रिपोर्ट करता है: path, PID, क्या PID अभी भी alive है, lock age, और क्या इसे stale माना गया है (dead PID, malformed owner metadata, 30 minutes से पुराना, या ऐसा live PID जिसे non-OpenClaw process से संबंधित साबित किया जा सके)। `--fix` / `--repair` mode में यह dead, orphaned, recycled, malformed-old, या non-OpenClaw owners वाले locks को automatically हटाता है। पुराने locks जो अभी भी live OpenClaw process के owned हैं, report किए जाते हैं लेकिन यथावत छोड़े जाते हैं ताकि doctor किसी active transcript writer को cut off न करे।
  </Accordion>
  <Accordion title="3d. session transcript branch repair">
    Doctor 2026.4.24 prompt transcript rewrite bug द्वारा बनाई गई duplicated branch shape के लिए agent session JSONL files को scan करता है: OpenClaw internal runtime context वाला abandoned user turn और वही visible user prompt रखने वाला active sibling। `--fix` / `--repair` mode में, doctor प्रत्येक affected file का original के बगल में backup बनाता है और transcript को active branch में rewrite करता है ताकि gateway history और memory readers अब duplicate turns न देखें।
  </Accordion>
  <Accordion title="4. State integrity checks (session persistence, routing, and safety)">
    state directory operational brainstem है। यदि यह गायब हो जाती है, तो आप sessions, credentials, logs, और config खो देते हैं (जब तक आपके पास कहीं और backups न हों)।

    Doctor checks:

    - **State dir missing**: catastrophic state loss के बारे में warn करता है, directory को recreate करने के लिए prompt करता है, और याद दिलाता है कि यह missing data recover नहीं कर सकता।
    - **State dir permissions**: writability verify करता है; permissions repair करने की पेशकश करता है (और owner/group mismatch detect होने पर `chown` hint emit करता है)।
    - **macOS cloud-synced state dir**: जब state iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) या `~/Library/CloudStorage/...` के अंतर्गत resolve होती है, तो warn करता है क्योंकि sync-backed paths धीमे I/O और lock/sync races पैदा कर सकते हैं।
    - **Linux SD or eMMC state dir**: जब state किसी `mmcblk*` mount source पर resolve होती है, तो warn करता है, क्योंकि SD या eMMC-backed random I/O session और credential writes के तहत धीमा हो सकता है और जल्दी घिस सकता है।
    - **Linux volatile state dir**: जब state `tmpfs` या `ramfs` पर resolve होती है, तो warn करता है, क्योंकि sessions, credentials, config, और SQLite state अपने WAL/journal sidecars सहित reboot पर गायब हो जाएंगे। Docker `overlay` mounts को जानबूझकर flag नहीं किया जाता क्योंकि उनकी writable layers host reboots के पार persist करती हैं जब तक container बना रहता है।
    - **Session dirs missing**: history persist करने और `ENOENT` crashes से बचने के लिए `sessions/` और session store directory required हैं।
    - **Transcript mismatch**: जब recent session entries में transcript files missing होती हैं, तो warn करता है।
    - **Main session "1-line JSONL"**: जब main transcript में केवल एक line हो (history accumulate नहीं हो रही), तो flag करता है।
    - **Multiple state dirs**: जब home directories में कई `~/.openclaw` folders मौजूद हों या `OPENCLAW_STATE_DIR` कहीं और point करता हो, तो warn करता है (history installs के बीच split हो सकती है)।
    - **Remote mode reminder**: यदि `gateway.mode=remote` है, तो doctor आपको इसे remote host पर चलाने की याद दिलाता है (state वहीं रहती है)।
    - **Config file permissions**: यदि `~/.openclaw/openclaw.json` group/world readable है, तो warn करता है और इसे `600` तक tighten करने की पेशकश करता है।

  </Accordion>
  <Accordion title="5. Model auth health (OAuth expiry)">
    Doctor auth store में OAuth profiles को inspect करता है, tokens expiring/expired होने पर warn करता है, और safe होने पर उन्हें refresh कर सकता है। यदि Anthropic OAuth/token profile stale है, तो यह Anthropic API key या Anthropic setup-token path सुझाता है। Refresh prompts केवल interactively (TTY) चलाने पर दिखाई देते हैं; `--non-interactive` refresh attempts छोड़ देता है।

    जब OAuth refresh permanently fail होता है (उदाहरण के लिए `refresh_token_reused`, `invalid_grant`, या कोई provider आपको फिर से sign in करने को कहता है), तो doctor रिपोर्ट करता है कि re-auth required है और चलाने के लिए exact `openclaw models auth login --provider ...` command print करता है।

    Doctor उन auth profiles की भी report करता है जो अस्थायी रूप से unusable हैं, इनके कारण:

    - short cooldowns (rate limits/timeouts/auth failures)
    - longer disables (billing/credit failures)

    Legacy Codex OAuth profiles जिनके tokens macOS Keychain में रहते हैं (file-based sidecar layout से पहले की पुरानी onboarding) केवल doctor द्वारा repaired होते हैं। Keychain-backed legacy tokens को inline `auth-profiles.json` में migrate करने के लिए interactive terminal से एक बार `openclaw doctor --fix` चलाएं; उसके बाद, embedded turns (Telegram, cron, sub-agent dispatch) उन्हें canonical OpenAI OAuth profiles के रूप में resolve करते हैं।

  </Accordion>
  <Accordion title="6. Hooks model validation">
    यदि `hooks.gmail.model` set है, तो doctor model reference को catalog और allowlist के खिलाफ validate करता है और जब यह resolve नहीं होगा या disallowed होगा तो warn करता है।
  </Accordion>
  <Accordion title="7. Sandbox image repair">
    sandboxing enabled होने पर, doctor Docker images check करता है और current image missing होने पर legacy names build या switch करने की पेशकश करता है।
  </Accordion>
  <Accordion title="7b. Plugin install cleanup">
    Doctor `openclaw doctor --fix` / `openclaw doctor --repair` mode में legacy OpenClaw-generated plugin dependency staging state हटाता है। इसमें stale generated dependency roots, पुराने install-stage directories, पहले के bundled-plugin dependency repair code से package-local debris, और bundled `@openclaw/*` plugins की orphaned या recovered managed npm copies शामिल हैं जो current bundled manifest को shadow कर सकती हैं। Doctor managed npm plugins में host `openclaw` package को भी relink करता है जो `peerDependencies.openclaw` declare करते हैं, ताकि `openclaw/plugin-sdk/*` जैसे package-local runtime imports updates या npm repairs के बाद resolve होते रहें।

    जब config downloadable plugins को reference करता है लेकिन local plugin registry उन्हें नहीं ढूंढ पाती, तो doctor missing downloadable plugins को reinstall भी कर सकता है। उदाहरणों में material `plugins.entries`, configured channel/provider/search settings, और configured agent runtimes शामिल हैं। Package updates के दौरान, doctor core package swap किए जाने पर package-manager plugin repair चलाने से बचता है; यदि configured plugin को अभी भी recovery चाहिए, तो update के बाद फिर से `openclaw doctor --fix` चलाएं। Gateway startup और config reload package managers नहीं चलाते; plugin installs explicit doctor/install/update work ही रहते हैं।

  </Accordion>
  <Accordion title="8. Gateway service migrations and cleanup hints">
    Doctor legacy gateway services (launchd/systemd/schtasks) detect करता है और उन्हें remove करके current gateway port का उपयोग करते हुए OpenClaw service install करने की पेशकश करता है। यह extra gateway-like services के लिए scan करके cleanup hints print भी कर सकता है। Profile-named OpenClaw gateway services first-class मानी जाती हैं और उन्हें "extra" के रूप में flag नहीं किया जाता।

    Linux पर, यदि user-level gateway service missing है लेकिन system-level OpenClaw gateway service मौजूद है, तो doctor automatically दूसरी user-level service install नहीं करता। `openclaw gateway status --deep` या `openclaw doctor --deep` से inspect करें, फिर duplicate हटाएं या जब कोई system supervisor gateway lifecycle own करता हो तो `OPENCLAW_SERVICE_REPAIR_POLICY=external` set करें।

  </Accordion>
  <Accordion title="8b. Startup Matrix migration">
    जब किसी Matrix channel account में pending या actionable legacy state migration होता है, तो doctor (`--fix` / `--repair` mode में) pre-migration snapshot बनाता है और फिर best-effort migration steps चलाता है: legacy Matrix state migration और legacy encrypted-state preparation। दोनों steps non-fatal हैं; errors log किए जाते हैं और startup जारी रहता है। Read-only mode में (`openclaw doctor` बिना `--fix`) यह check पूरी तरह skipped होता है।
  </Accordion>
  <Accordion title="8c. Device pairing and auth drift">
    Doctor अब normal health pass के हिस्से के रूप में device-pairing state inspect करता है।

    यह क्या report करता है:

    - pending first-time pairing requests
    - already paired devices के लिए pending role upgrades
    - already paired devices के लिए pending scope upgrades
    - public-key mismatch repairs जहां device id अभी भी match करती है लेकिन device identity अब approved record से match नहीं करती
    - approved role के लिए active token missing वाले paired records
    - paired tokens जिनके scopes approved pairing baseline से बाहर drift हो गए हैं
    - current machine के लिए local cached device-token entries जो gateway-side token rotation से पहले की हैं या stale scope metadata carry करती हैं

    Doctor pair requests को auto-approve या device tokens को auto-rotate नहीं करता। इसके बजाय यह exact next steps print करता है:

    - pending requests को `openclaw devices list` से inspect करें
    - exact request को `openclaw devices approve <requestId>` से approve करें
    - fresh token को `openclaw devices rotate --device <deviceId> --role <role>` से rotate करें
    - stale record को `openclaw devices remove <deviceId>` से remove और re-approve करें

    यह सामान्य "पहले से paired है लेकिन फिर भी pairing required मिल रहा है" कमी को बंद करता है: doctor अब first-time pairing को pending role/scope upgrades और stale token/device-identity drift से अलग पहचानता है।

  </Accordion>
  <Accordion title="9. सुरक्षा चेतावनियां">
    जब कोई provider बिना allowlist के DMs के लिए खुला हो, या कोई policy खतरनाक तरीके से configured हो, तो Doctor warnings देता है।
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd user service के रूप में चलने पर, doctor सुनिश्चित करता है कि lingering enabled हो ताकि logout के बाद भी Gateway चालू रहे।
  </Accordion>
  <Accordion title="11. Workspace status (skills, plugins, and TaskFlows)">
    Doctor default agent के लिए workspace state का सारांश print करता है:

    - **Skills status**: eligible, missing-requirements, और allowlist-blocked skills की गिनती करता है।
    - **Plugin status**: enabled/disabled/errored plugins की गिनती करता है; किसी भी error के लिए plugin IDs list करता है; bundle plugin capabilities report करता है।
    - **Plugin compatibility warnings**: उन plugins को flag करता है जिनमें current runtime के साथ compatibility issues हैं।
    - **Plugin diagnostics**: plugin registry द्वारा emitted किसी भी load-time warnings या errors को surface करता है।
    - **TaskFlow recovery**: suspicious managed TaskFlows को surface करता है जिन्हें manual inspection या cancellation की जरूरत है।

  </Accordion>
  <Accordion title="11b. Bootstrap file size">
    Doctor जांचता है कि workspace bootstrap files (उदाहरण के लिए `AGENTS.md`, `CLAUDE.md`, या अन्य injected context files) configured character budget के करीब हैं या उससे ऊपर। यह per-file raw vs. injected character counts, truncation percentage, truncation cause (`max/file` या `max/total`), और total budget के fraction के रूप में total injected characters report करता है। जब files truncate होती हैं या limit के करीब होती हैं, तो doctor `agents.defaults.bootstrapMaxChars` और `agents.defaults.bootstrapTotalMaxChars` tune करने के लिए tips print करता है।
  </Accordion>
  <Accordion title="11d. Stale channel plugin cleanup">
    जब `openclaw doctor --fix` कोई missing channel plugin हटाता है, तो यह उस plugin को reference करने वाला dangling channel-scoped config भी हटाता है: `channels.<id>` entries, channel का नाम लेने वाले heartbeat targets, और `agents.*.models["<channel>/*"]` overrides। यह उन Gateway boot loops को रोकता है जहां channel runtime gone है लेकिन config अभी भी Gateway से उसे bind करने को कहता है।
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor जांचता है कि current shell (zsh, bash, fish, या PowerShell) के लिए tab completion installed है या नहीं:

    - अगर shell profile slow dynamic completion pattern (`source <(openclaw completion ...)`) का उपयोग करता है, तो doctor उसे faster cached file variant में upgrade करता है।
    - अगर completion profile में configured है लेकिन cache file missing है, तो doctor cache को automatically regenerate करता है।
    - अगर कोई completion configured नहीं है, तो doctor उसे install करने के लिए prompt करता है (सिर्फ interactive mode; `--non-interactive` के साथ skip किया जाता है)।

    Cache को manually regenerate करने के लिए `openclaw completion --write-state` चलाएं।

  </Accordion>
  <Accordion title="12. Gateway auth checks (local token)">
    Doctor local gateway token auth readiness जांचता है।

    - अगर token mode को token चाहिए और कोई token source मौजूद नहीं है, तो doctor एक token generate करने की पेशकश करता है।
    - अगर `gateway.auth.token` SecretRef-managed है लेकिन unavailable है, तो doctor चेतावनी देता है और इसे plaintext से overwrite नहीं करता।
    - `openclaw doctor --generate-gateway-token` generation को तभी force करता है जब कोई token SecretRef configured न हो।

  </Accordion>
  <Accordion title="12b. Read-only SecretRef-aware repairs">
    कुछ repair flows को runtime fail-fast behavior कमजोर किए बिना configured credentials inspect करने की जरूरत होती है।

    - `openclaw doctor --fix` अब targeted config repairs के लिए status-family commands जैसा ही read-only SecretRef summary model उपयोग करता है।
    - उदाहरण: Telegram `allowFrom` / `groupAllowFrom` `@username` repair available होने पर configured bot credentials का उपयोग करने की कोशिश करता है।
    - अगर Telegram bot token SecretRef के जरिए configured है लेकिन current command path में unavailable है, तो doctor report करता है कि credential configured-but-unavailable है और crash करने या token को missing बताने के बजाय auto-resolution skip करता है।

  </Accordion>
  <Accordion title="13. Gateway health check + restart">
    Doctor health check चलाता है और Gateway unhealthy दिखने पर restart करने की पेशकश करता है।
  </Accordion>
  <Accordion title="13b. Memory search readiness">
    Doctor जांचता है कि configured memory search embedding provider default agent के लिए ready है या नहीं। Behavior configured backend और provider पर निर्भर करता है:

    - **QMD backend**: probe करता है कि `qmd` binary available और startable है या नहीं। अगर नहीं, तो npm package और manual binary path option सहित fix guidance print करता है।
    - **Explicit local provider**: local model file या recognized remote/downloadable model URL की जांच करता है। missing होने पर remote provider पर switch करने का सुझाव देता है।
    - **Explicit remote provider** (`openai`, `voyage`, आदि): verify करता है कि API key environment या auth store में मौजूद है। missing होने पर actionable fix hints print करता है।
    - **Legacy auto provider**: `memorySearch.provider: "auto"` को OpenAI की तरह treat करता है, OpenAI readiness जांचता है, और `doctor --fix` इसे `provider: "openai"` में rewrite करता है।

    जब cached gateway probe result available होता है (check के समय Gateway healthy था), doctor इसके result को CLI-visible config के साथ cross-reference करता है और किसी discrepancy को note करता है। Doctor default path पर fresh embedding ping शुरू नहीं करता; जब live provider check चाहिए, तो deep memory status command का उपयोग करें।

    Runtime पर embedding readiness verify करने के लिए `openclaw memory status --deep` उपयोग करें।

  </Accordion>
  <Accordion title="14. Channel status warnings">
    अगर Gateway healthy है, तो doctor channel status probe चलाता है और suggested fixes के साथ warnings report करता है।
  </Accordion>
  <Accordion title="15. Supervisor config audit + repair">
    Doctor missing या outdated defaults (जैसे, systemd network-online dependencies और restart delay) के लिए installed supervisor config (launchd/systemd/schtasks) जांचता है। mismatch मिलने पर, यह update recommend करता है और service file/task को current defaults में rewrite कर सकता है।

    Notes:

    - `openclaw doctor` supervisor config rewrite करने से पहले prompt करता है।
    - `openclaw doctor --yes` default repair prompts accept करता है।
    - `openclaw doctor --fix` prompts के बिना recommended fixes apply करता है (`--repair` एक alias है)।
    - `openclaw doctor --fix --force` custom supervisor configs overwrite करता है।
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` gateway service lifecycle के लिए doctor को read-only रखता है। यह अभी भी service health report करता है और non-service repairs चलाता है, लेकिन service install/start/restart/bootstrap, supervisor config rewrites, और legacy service cleanup skip करता है क्योंकि वह lifecycle external supervisor own करता है।
    - Linux पर, matching systemd gateway unit active होने पर doctor command/entrypoint metadata rewrite नहीं करता। यह duplicate-service scan के दौरान inactive non-legacy extra gateway-like units को भी ignore करता है ताकि companion service files cleanup noise न बनाएं।
    - अगर token auth को token चाहिए और `gateway.auth.token` SecretRef-managed है, तो doctor service install/repair SecretRef validate करता है लेकिन resolved plaintext token values को supervisor service environment metadata में persist नहीं करता।
    - Doctor managed `.env`/SecretRef-backed service environment values detect करता है जिन्हें पुराने LaunchAgent, systemd, या Windows Scheduled Task installs ने inline embed किया था, और service metadata rewrite करता है ताकि वे values supervisor definition के बजाय runtime source से load हों।
    - Doctor detect करता है जब service command `gateway.port` बदलने के बाद भी पुराने `--port` को pin करता है और service metadata को current port में rewrite करता है।
    - अगर token auth को token चाहिए और configured token SecretRef unresolved है, तो doctor install/repair path को actionable guidance के साथ block करता है।
    - अगर `gateway.auth.token` और `gateway.auth.password` दोनों configured हैं और `gateway.auth.mode` unset है, तो doctor mode explicitly set होने तक install/repair block करता है।
    - Linux user-systemd units के लिए, doctor token drift checks अब service auth metadata compare करते समय `Environment=` और `EnvironmentFile=` दोनों sources शामिल करते हैं।
    - Doctor service repairs किसी पुराने OpenClaw binary से Gateway service को rewrite, stop, या restart करने से मना करते हैं जब config last किसी newer version द्वारा लिखा गया था। [Gateway troubleshooting](/hi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) देखें।
    - आप हमेशा `openclaw gateway install --force` के जरिए full rewrite force कर सकते हैं।

  </Accordion>
  <Accordion title="16. Gateway runtime + port diagnostics">
    Doctor service runtime (PID, last exit status) inspect करता है और service installed होने पर लेकिन वास्तव में running न होने पर warning देता है। यह gateway port (default `18789`) पर port collisions की भी जांच करता है और likely causes (Gateway already running, SSH tunnel) report करता है।
  </Accordion>
  <Accordion title="17. Gateway runtime best practices">
    Doctor warning देता है जब Gateway service Bun या version-managed Node path (`nvm`, `fnm`, `volta`, `asdf`, आदि) पर चलती है। WhatsApp + Telegram channels को Node चाहिए, और version-manager paths upgrades के बाद break हो सकते हैं क्योंकि service आपका shell init load नहीं करती। Doctor available होने पर system Node install (Homebrew/apt/choco) पर migrate करने की पेशकश करता है।

    Newly installed या repaired macOS LaunchAgents interactive shell PATH copy करने के बजाय canonical system PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) का उपयोग करते हैं, ताकि Homebrew-managed system binaries available रहें जबकि Volta, asdf, fnm, pnpm, और अन्य version-manager directories यह न बदलें कि कौन से Node child processes resolve होते हैं। Linux services अभी भी explicit environment roots (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) और stable user-bin directories रखते हैं, लेकिन guessed version-manager fallback directories service PATH में तभी लिखी जाती हैं जब वे directories disk पर मौजूद हों।

  </Accordion>
  <Accordion title="18. Config write + wizard metadata">
    Doctor किसी भी config changes को persist करता है और doctor run record करने के लिए wizard metadata stamp करता है।
  </Accordion>
  <Accordion title="19. Workspace tips (backup + memory system)">
    Doctor missing होने पर workspace memory system suggest करता है और अगर workspace पहले से git के तहत नहीं है तो backup tip print करता है।

    workspace structure और git backup (recommended private GitHub या GitLab) की full guide के लिए [/concepts/agent-workspace](/hi/concepts/agent-workspace) देखें।

  </Accordion>
</AccordionGroup>

## संबंधित

- [Gateway runbook](/hi/gateway)
- [Gateway troubleshooting](/hi/gateway/troubleshooting)
