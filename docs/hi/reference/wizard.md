---
read_when:
    - किसी विशिष्ट ऑनबोर्डिंग चरण या फ़्लैग को देखना
    - गैर-इंटरैक्टिव मोड के साथ ऑनबोर्डिंग को स्वचालित करना
    - ऑनबोर्डिंग व्यवहार की डीबगिंग
sidebarTitle: Onboarding Reference
summary: 'CLI ऑनबोर्डिंग के लिए पूर्ण संदर्भ: हर चरण, फ़्लैग, और कॉन्फ़िग फ़ील्ड'
title: ऑनबोर्डिंग संदर्भ
x-i18n:
    generated_at: "2026-06-29T00:12:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 739048d53983febc32adaeab10225a288ae66752bee70cfea500d1664fd8546b
    source_path: reference/wizard.md
    workflow: 16
---

यह `openclaw onboard` का पूरा संदर्भ है।
उच्च-स्तरीय अवलोकन के लिए, [ऑनबोर्डिंग (CLI)](/hi/start/wizard) देखें।

## प्रवाह विवरण (स्थानीय मोड)

<Steps>
  <Step title="मौजूदा कॉन्फिग पहचान">
    - यदि `~/.openclaw/openclaw.json` मौजूद है, तो **मौजूदा मान रखें**, **समीक्षा करें और अपडेट करें**, या **सेटअप से पहले रीसेट करें** चुनें।
    - ऑनबोर्डिंग फिर से चलाने पर कुछ भी नहीं मिटता, जब तक आप स्पष्ट रूप से **रीसेट** न चुनें
      (या `--reset` पास न करें)।
    - CLI `--reset` डिफ़ॉल्ट रूप से `config+creds+sessions` पर सेट होता है; workspace भी हटाने के लिए `--reset-scope full`
      का उपयोग करें।
    - यदि कॉन्फिग अमान्य है या उसमें legacy keys हैं, तो wizard रुक जाता है और आगे बढ़ने से पहले
      आपसे `openclaw doctor` चलाने को कहता है।
    - रीसेट `trash` का उपयोग करता है (कभी `rm` नहीं) और ये scopes देता है:
      - केवल कॉन्फिग
      - कॉन्फिग + credentials + sessions
      - पूरा रीसेट (workspace भी हटाता है)

  </Step>
  <Step title="मॉडल/Auth">
    - **Anthropic API key**: यदि मौजूद हो तो `ANTHROPIC_API_KEY` का उपयोग करता है या key मांगता है, फिर daemon उपयोग के लिए उसे सहेजता है।
    - **Anthropic API key**: onboarding/configure में पसंदीदा Anthropic assistant विकल्प।
    - **Anthropic setup-token**: onboarding/configure में अभी भी उपलब्ध है, हालांकि OpenClaw अब उपलब्ध होने पर Claude CLI reuse को प्राथमिकता देता है।
    - **OpenAI Code (Codex) subscription (OAuth)**: browser flow; `code#state` पेस्ट करें।
      - जब model unset हो या पहले से OpenAI-family हो, तो Codex runtime के ज़रिए `agents.defaults.model` को `openai/gpt-5.5` पर सेट करता है।
    - **OpenAI Code (Codex) subscription (device pairing)**: अल्प-आयु device code के साथ browser pairing flow।
      - जब model unset हो या पहले से OpenAI-family हो, तो Codex runtime के ज़रिए `agents.defaults.model` को `openai/gpt-5.5` पर सेट करता है।
    - **OpenAI API key**: यदि मौजूद हो तो `OPENAI_API_KEY` का उपयोग करता है या key मांगता है, फिर उसे auth profiles में सहेजता है।
      - जब model unset, `openai/*`, या legacy Codex model refs हो, तो `agents.defaults.model` को `openai/gpt-5.5` पर सेट करता है।
    - **xAI (Grok) OAuth / API key**: चुने जाने पर xAI OAuth से sign in करता है, या API-key path पर `XAI_API_KEY` मांगता है, और xAI को model provider के रूप में कॉन्फिगर करता है।
    - **OpenCode**: `OPENCODE_API_KEY` (या `OPENCODE_ZEN_API_KEY`, इसे https://opencode.ai/auth पर प्राप्त करें) मांगता है और आपको Zen या Go catalog चुनने देता है।
    - **Ollama**: पहले **Cloud + Local**, **Cloud only**, या **Local only** देता है। `Cloud only` `OLLAMA_API_KEY` मांगता है और `https://ollama.com` का उपयोग करता है; host-backed modes Ollama base URL मांगते हैं, उपलब्ध models खोजते हैं, और आवश्यकता होने पर चुने गए local model को auto-pull करते हैं; `Cloud + Local` यह भी जांचता है कि वह Ollama host cloud access के लिए signed in है या नहीं।
    - अधिक विवरण: [Ollama](/hi/providers/ollama)
    - **API key**: आपके लिए key सहेजता है।
    - **Vercel AI Gateway (multi-model proxy)**: `AI_GATEWAY_API_KEY` मांगता है।
    - अधिक विवरण: [Vercel AI Gateway](/hi/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID, Gateway ID, और `CLOUDFLARE_AI_GATEWAY_API_KEY` मांगता है।
    - अधिक विवरण: [Cloudflare AI Gateway](/hi/providers/cloudflare-ai-gateway)
    - **MiniMax**: कॉन्फिग auto-written होता है; hosted default `MiniMax-M3` है।
      API-key setup `minimax/...` का उपयोग करता है, और OAuth setup
      `minimax-portal/...` का उपयोग करता है।
    - अधिक विवरण: [MiniMax](/hi/providers/minimax)
    - **StepFun**: China या global endpoints पर StepFun standard या Step Plan के लिए कॉन्फिग auto-written होता है।
    - Standard में वर्तमान में `step-3.5-flash` शामिल है, और Step Plan में `step-3.5-flash-2603` भी शामिल है।
    - अधिक विवरण: [StepFun](/hi/providers/stepfun)
    - **Synthetic (Anthropic-compatible)**: `SYNTHETIC_API_KEY` मांगता है।
    - अधिक विवरण: [Synthetic](/hi/providers/synthetic)
    - **Moonshot (Kimi K2)**: कॉन्फिग auto-written होता है।
    - **Kimi Coding**: कॉन्फिग auto-written होता है।
    - अधिक विवरण: [Moonshot AI (Kimi + Kimi Coding)](/hi/providers/moonshot)
    - **Skip**: अभी कोई auth कॉन्फिगर नहीं किया गया।
    - पहचाने गए विकल्पों में से default model चुनें (या provider/model हाथ से दर्ज करें)। सर्वोत्तम गुणवत्ता और कम prompt-injection जोखिम के लिए, अपने provider stack में उपलब्ध सबसे मजबूत latest-generation model चुनें।
    - Onboarding model check चलाती है और configured model अज्ञात होने या auth missing होने पर चेतावनी देती है।
    - API key storage mode डिफ़ॉल्ट रूप से plaintext auth-profile values होता है। इसके बजाय env-backed refs सहेजने के लिए `--secret-input-mode ref` का उपयोग करें (उदाहरण `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)।
    - Auth profiles `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` में रहते हैं (API keys + OAuth)। `~/.openclaw/credentials/oauth.json` केवल legacy import-only है।
    - अधिक विवरण: [/concepts/oauth](/hi/concepts/oauth)
    <Note>
    Headless/server tip: OAuth को browser वाली machine पर पूरा करें, फिर
    उस agent का `auth-profiles.json` (उदाहरण
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, या matching
    `$OPENCLAW_STATE_DIR/...` path) gateway host पर copy करें। `credentials/oauth.json`
    केवल legacy import source है।
    </Note>
  </Step>
  <Step title="Workspace">
    - Default `~/.openclaw/workspace` (configurable)।
    - agent bootstrap ritual के लिए आवश्यक workspace files seed करता है।
    - पूरा workspace layout + backup guide: [Agent workspace](/hi/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port, bind, auth mode, tailscale exposure।
    - Auth recommendation: loopback के लिए भी **Token** रखें ताकि local WS clients को authenticate करना पड़े।
    - Token mode में, interactive setup ये विकल्प देता है:
      - **Plaintext token generate/store करें** (default)
      - **SecretRef उपयोग करें** (opt-in)
      - Quickstart onboarding probe/dashboard bootstrap के लिए `env`, `file`, और `exec` providers में मौजूद `gateway.auth.token` SecretRefs का reuse करता है।
      - यदि वह SecretRef कॉन्फिगर है लेकिन resolve नहीं हो सकता, तो onboarding silently runtime auth degrade करने के बजाय clear fix message के साथ जल्दी fail होती है।
    - Password mode में, interactive setup plaintext या SecretRef storage को भी support करता है।
    - Non-interactive token SecretRef path: `--gateway-token-ref-env <ENV_VAR>`।
      - Onboarding process environment में non-empty env var आवश्यक है।
      - `--gateway-token` के साथ combine नहीं किया जा सकता।
    - Auth केवल तभी disable करें जब आप हर local process पर पूरा भरोसा करते हों।
    - Non-loopback binds को अभी भी auth चाहिए।

  </Step>
  <Step title="Channels">
    - [WhatsApp](/hi/channels/whatsapp): optional QR login।
    - [Telegram](/hi/channels/telegram): bot token।
    - [Discord](/hi/channels/discord): bot token।
    - [Google Chat](/hi/channels/googlechat): service account JSON + webhook audience।
    - [Mattermost](/hi/channels/mattermost) (plugin): bot token + base URL।
    - [Signal](/hi/channels/signal): optional `signal-cli` install + account config।
    - [iMessage](/hi/channels/imessage): `imsg` CLI path + Messages DB access; Gateway off-Mac चलने पर SSH wrapper का उपयोग करें।
    - DM security: default pairing है। पहला DM code भेजता है; `openclaw pairing approve <channel> <code>` के ज़रिए approve करें या allowlists का उपयोग करें।

  </Step>
  <Step title="Web search">
    - Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, या Tavily जैसा supported provider चुनें (या skip करें)।
    - API-backed providers quick setup के लिए env vars या existing config का उपयोग कर सकते हैं; key-free providers इसके बजाय अपनी provider-specific prerequisites का उपयोग करते हैं।
    - `--skip-search` से skip करें।
    - बाद में कॉन्फिगर करें: `openclaw configure --section web`।

  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - Logged-in user session आवश्यक है; headless के लिए custom LaunchDaemon उपयोग करें (ship नहीं किया गया)।
    - Linux (और WSL2 के ज़रिए Windows): systemd user unit
      - Onboarding `loginctl enable-linger <user>` के ज़रिए lingering enable करने की कोशिश करती है ताकि logout के बाद Gateway चालू रहे।
      - sudo मांग सकता है (`/var/lib/systemd/linger` लिखता है); पहले बिना sudo कोशिश करता है।
    - **Runtime selection:** Node (recommended; WhatsApp/Telegram के लिए आवश्यक)। Bun **recommended नहीं** है।
    - यदि token auth को token चाहिए और `gateway.auth.token` SecretRef-managed है, तो daemon install उसे validate करता है लेकिन resolved plaintext token values को supervisor service environment metadata में persist नहीं करता।
    - यदि token auth को token चाहिए और configured token SecretRef unresolved है, तो daemon install actionable guidance के साथ blocked होता है।
    - यदि `gateway.auth.token` और `gateway.auth.password` दोनों कॉन्फिगर हैं और `gateway.auth.mode` unset है, तो daemon install तब तक blocked रहता है जब तक mode स्पष्ट रूप से set न हो।

  </Step>
  <Step title="Health check">
    - Gateway शुरू करता है (यदि आवश्यक हो) और `openclaw health` चलाता है।
    - Tip: `openclaw status --deep` status output में live gateway health probe जोड़ता है, supported होने पर channel probes सहित (reachable gateway आवश्यक है)।

  </Step>
  <Step title="Skills (recommended)">
    - उपलब्ध skills पढ़ता है और requirements जांचता है।
    - आपको node manager चुनने देता है: **npm / pnpm** (bun recommended नहीं)।
    - optional dependencies install करता है (कुछ macOS पर Homebrew का उपयोग करते हैं)।

  </Step>
  <Step title="समाप्त करें">
    - Summary + next steps, जिसमें Terminal, Browser, या बाद के लिए **आप अपने agent को कैसे hatch करना चाहते हैं?** prompt शामिल है।

  </Step>
</Steps>

<Note>
यदि कोई GUI detect नहीं होता, तो onboarding browser खोलने के बजाय Control UI के लिए SSH port-forward instructions print करती है।
यदि Control UI assets missing हैं, तो onboarding उन्हें build करने की कोशिश करती है; fallback `pnpm ui:build` है (UI deps auto-installs करता है)।
</Note>

## Non-interactive mode

Onboarding automate या script करने के लिए `--non-interactive` का उपयोग करें:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Machine-readable summary के लिए `--json` जोड़ें।

Non-interactive mode में Gateway token SecretRef:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` और `--gateway-token-ref-env` mutually exclusive हैं।

<Note>
`--json` non-interactive mode imply **नहीं** करता। Scripts के लिए `--non-interactive` (और `--workspace`) का उपयोग करें।
</Note>

Provider-specific command examples [CLI Automation](/hi/start/wizard-cli-automation#provider-specific-examples) में हैं।
Flag semantics और step ordering के लिए इस reference page का उपयोग करें।

### Agent जोड़ें (non-interactive)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway wizard RPC

Gateway onboarding flow को RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`) पर expose करता है।
Clients (macOS app, Control UI) onboarding logic को re-implement किए बिना steps render कर सकते हैं।

## Signal setup (signal-cli)

Onboarding GitHub releases से `signal-cli` install कर सकती है:

- उपयुक्त release asset download करता है।
- इसे `~/.openclaw/tools/signal-cli/<version>/` के अंतर्गत सहेजता है।
- आपके config में `channels.signal.cliPath` लिखता है।

Notes:

- JVM builds के लिए **Java 21** आवश्यक है।
- उपलब्ध होने पर Native builds उपयोग किए जाते हैं।
- Windows WSL2 का उपयोग करता है; signal-cli install WSL के अंदर Linux flow का पालन करता है।

## Wizard क्या लिखता है

`~/.openclaw/openclaw.json` में typical fields:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (यदि Minimax चुना गया हो)
- `tools.profile` (सेट न होने पर स्थानीय ऑनबोर्डिंग डिफ़ॉल्ट रूप से `"coding"` पर रहती है; मौजूदा स्पष्ट मान सुरक्षित रखे जाते हैं)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (व्यवहार विवरण: [CLI सेटअप संदर्भ](/hi/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- चैनल अनुमति-सूचियां (Slack/Discord/Matrix/Microsoft Teams) जब आप प्रॉम्प्ट के दौरान ऑप्ट इन करते हैं (जहां संभव हो, नाम IDs में रिज़ॉल्व होते हैं)।
- `skills.install.nodeManager`
  - `setup --node-manager` `npm`, `pnpm`, या `bun` स्वीकार करता है।
  - मैनुअल कॉन्फ़िग अब भी `skills.install.nodeManager` को सीधे सेट करके `yarn` का उपयोग कर सकता है।
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` `agents.list[]` और वैकल्पिक `bindings` लिखता है।

WhatsApp क्रेडेंशियल `~/.openclaw/credentials/whatsapp/<accountId>/` के अंतर्गत जाते हैं।
सेशन `~/.openclaw/agents/<agentId>/sessions/` के अंतर्गत संग्रहीत होते हैं।

कुछ चैनल plugins के रूप में डिलीवर किए जाते हैं। जब आप सेटअप के दौरान कोई एक चुनते हैं, तो उसे कॉन्फ़िगर किए जाने से पहले ऑनबोर्डिंग उसे इंस्टॉल करने के लिए प्रॉम्प्ट करेगा (npm या स्थानीय पथ)।

## संबंधित दस्तावेज़

- ऑनबोर्डिंग अवलोकन: [ऑनबोर्डिंग (CLI)](/hi/start/wizard)
- macOS ऐप ऑनबोर्डिंग: [ऑनबोर्डिंग](/hi/start/onboarding)
- कॉन्फ़िग संदर्भ: [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration)
- प्रदाता: [WhatsApp](/hi/channels/whatsapp), [Telegram](/hi/channels/telegram), [Discord](/hi/channels/discord), [Google Chat](/hi/channels/googlechat), [Signal](/hi/channels/signal), [iMessage](/hi/channels/imessage)
- Skills: [Skills](/hi/tools/skills), [Skills कॉन्फ़िग](/hi/tools/skills-config)
