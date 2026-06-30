---
read_when:
    - आपको `openclaw onboard` के लिए विस्तृत व्यवहार चाहिए
    - आप onboarding परिणामों को डिबग कर रहे हैं या onboarding क्लाइंट्स को इंटीग्रेट कर रहे हैं
sidebarTitle: CLI reference
summary: CLI सेटअप प्रवाह, auth/model सेटअप, आउटपुट और आंतरिक हिस्सों के लिए संपूर्ण संदर्भ
title: CLI सेटअप संदर्भ
x-i18n:
    generated_at: "2026-06-30T22:18:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be3e95a300707eade19f5c7fdf6f3a330ffe7e1e83866b36fb9bd1f742256ef
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

यह पेज `openclaw onboard` के लिए पूर्ण संदर्भ है।
संक्षिप्त मार्गदर्शिका के लिए, [ऑनबोर्डिंग (CLI)](/hi/start/wizard) देखें।

## विज़ार्ड क्या करता है

स्थानीय मोड (डिफ़ॉल्ट) आपको इनके माध्यम से ले जाता है:

- मॉडल और auth सेटअप (OpenAI Code सदस्यता OAuth, Anthropic Claude CLI या API key, साथ ही MiniMax, GLM, Ollama, Moonshot, StepFun, और AI Gateway विकल्प)
- Workspace स्थान और bootstrap फ़ाइलें
- Gateway सेटिंग्स (port, bind, auth, Tailscale)
- Channels और providers (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage, और अन्य bundled channel plugins)
- डेमन इंस्टॉल (LaunchAgent, systemd user unit, या Startup-folder fallback के साथ native Windows Scheduled Task)
- Health check
- Skills सेटअप

Remote mode इस मशीन को कहीं और मौजूद gateway से कनेक्ट करने के लिए कॉन्फ़िगर करता है।
यह remote host पर कुछ भी इंस्टॉल या संशोधित नहीं करता।

## स्थानीय flow विवरण

<Steps>
  <Step title="मौजूदा config detection">
    - यदि `~/.openclaw/openclaw.json` मौजूद है, तो Keep, Modify, या Reset चुनें।
    - विज़ार्ड दोबारा चलाने से कुछ भी साफ़ नहीं होता जब तक आप स्पष्ट रूप से Reset नहीं चुनते (या `--reset` पास नहीं करते)।
    - CLI `--reset` डिफ़ॉल्ट रूप से `config+creds+sessions` पर होता है; workspace भी हटाने के लिए `--reset-scope full` का उपयोग करें।
    - यदि config अमान्य है या उसमें legacy keys हैं, तो विज़ार्ड रुकता है और आगे बढ़ने से पहले आपसे `openclaw doctor` चलाने को कहता है।
    - Reset `trash` का उपयोग करता है और ये scopes प्रदान करता है:
      - केवल config
      - Config + credentials + sessions
      - Full reset (workspace भी हटाता है)

  </Step>
  <Step title="मॉडल और auth">
    - पूरा option matrix [Auth और model options](#auth-and-model-options) में है।

  </Step>
  <Step title="Workspace">
    - डिफ़ॉल्ट `~/.openclaw/workspace` (कॉन्फ़िगर करने योग्य)।
    - पहले-run bootstrap ritual के लिए आवश्यक workspace files seed करता है।
    - Workspace layout: [Agent workspace](/hi/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - port, bind, auth mode, और Tailscale exposure के लिए prompt करता है।
    - अनुशंसित: loopback के लिए भी token auth सक्षम रखें ताकि local WS clients को authenticate करना पड़े।
    - token mode में, interactive setup ये प्रदान करता है:
      - **plaintext token generate/store करें** (डिफ़ॉल्ट)
      - **SecretRef उपयोग करें** (opt-in)
    - password mode में, interactive setup plaintext या SecretRef storage का भी समर्थन करता है।
    - Non-interactive token SecretRef path: `--gateway-token-ref-env <ENV_VAR>`.
      - onboarding process environment में non-empty env var आवश्यक है।
      - `--gateway-token` के साथ संयोजित नहीं किया जा सकता।
    - auth केवल तभी disable करें जब आप हर local process पर पूरा भरोसा करते हों।
    - Non-loopback binds में फिर भी auth आवश्यक है।

  </Step>
  <Step title="Channels">
    - [WhatsApp](/hi/channels/whatsapp): optional QR login
    - [Telegram](/hi/channels/telegram): bot token
    - [Discord](/hi/channels/discord): bot token
    - [Google Chat](/hi/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/hi/channels/mattermost): bot token + base URL
    - [Signal](/hi/channels/signal): optional `signal-cli` install + account config
    - [iMessage](/hi/channels/imessage): `imsg` CLI path + Messages DB access; जब Gateway Mac से बाहर चलता हो तो SSH wrapper उपयोग करें
    - DM security: डिफ़ॉल्ट pairing है। पहला DM एक code भेजता है; इसके जरिए approve करें
      `openclaw pairing approve <channel> <code>` या allowlists उपयोग करें।
  </Step>
  <Step title="डेमन इंस्टॉल">
    - macOS: LaunchAgent
      - logged-in user session आवश्यक है; headless के लिए, custom LaunchDaemon उपयोग करें (ship नहीं किया गया)।
    - Linux और Windows via WSL2: systemd user unit
      - विज़ार्ड `loginctl enable-linger <user>` का प्रयास करता है ताकि logout के बाद भी gateway चालू रहे।
      - sudo के लिए prompt कर सकता है (`/var/lib/systemd/linger` लिखता है); यह पहले बिना sudo के प्रयास करता है।
    - Native Windows: पहले Scheduled Task
      - यदि task creation अस्वीकृत हो, तो OpenClaw per-user Startup-folder login item पर fallback करता है और gateway तुरंत शुरू करता है।
      - Scheduled Tasks पसंदीदा रहती हैं क्योंकि वे बेहतर supervisor status प्रदान करती हैं।
    - Runtime selection: Node (अनुशंसित; WhatsApp और Telegram के लिए आवश्यक)। Bun अनुशंसित नहीं है।

  </Step>
  <Step title="Health check">
    - Gateway शुरू करता है (यदि आवश्यक हो) और `openclaw health` चलाता है।
    - `openclaw status --deep` status output में live gateway health probe जोड़ता है, समर्थित होने पर channel probes सहित।

  </Step>
  <Step title="Skills">
    - उपलब्ध Skills पढ़ता है और requirements जांचता है।
    - आपको node manager चुनने देता है: npm, pnpm, या bun।
    - optional dependencies इंस्टॉल करता है (कुछ macOS पर Homebrew उपयोग करती हैं)।

  </Step>
  <Step title="समापन">
    - Summary और next steps, iOS, Android, और macOS app विकल्पों सहित।

  </Step>
</Steps>

<Note>
यदि कोई GUI detect नहीं होता, तो विज़ार्ड browser खोलने के बजाय Control UI के लिए SSH port-forward instructions print करता है।
यदि Control UI assets missing हैं, तो विज़ार्ड उन्हें build करने का प्रयास करता है; fallback `pnpm ui:build` है (UI deps auto-installs करता है)।
</Note>

## Remote mode विवरण

Remote mode इस मशीन को कहीं और मौजूद gateway से कनेक्ट करने के लिए कॉन्फ़िगर करता है।

<Info>
Remote mode remote host पर कुछ भी इंस्टॉल या संशोधित नहीं करता।
</Info>

आप क्या set करते हैं:

- Remote gateway URL (`ws://...`)
- Token यदि remote gateway auth आवश्यक है (अनुशंसित)

<Note>
- यदि gateway केवल loopback है, तो SSH tunneling या tailnet उपयोग करें।
- Discovery hints:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Auth और model options

<AccordionGroup>
  <Accordion title="Anthropic API key">
    यदि मौजूद हो तो `ANTHROPIC_API_KEY` उपयोग करता है या key के लिए prompt करता है, फिर daemon उपयोग के लिए उसे save करता है।
  </Accordion>
  <Accordion title="OpenAI Code सदस्यता (OAuth)">
    Browser flow; `code#state` paste करें।

    जब model unset हो या पहले से OpenAI-family हो, तो Codex runtime के जरिए `agents.defaults.model` को `openai/gpt-5.5` पर set करता है।

  </Accordion>
  <Accordion title="OpenAI Code सदस्यता (device pairing)">
    short-lived device code के साथ browser pairing flow।

    जब model unset हो या पहले से OpenAI-family हो, तो Codex runtime के जरिए `agents.defaults.model` को `openai/gpt-5.5` पर set करता है।

  </Accordion>
  <Accordion title="OpenAI API key">
    यदि मौजूद हो तो `OPENAI_API_KEY` उपयोग करता है या key के लिए prompt करता है, फिर credential को auth profiles में store करता है।

    जब model unset, `openai/*`, या legacy Codex model refs हो, तो `agents.defaults.model` को `openai/gpt-5.5` पर set करता है।

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    eligible SuperGrok या X Premium accounts के लिए browser sign-in। यह अधिकांश users के लिए
    अनुशंसित xAI path है। OpenClaw Grok models, Grok `web_search`, `x_search`, और `code_execution`
    के लिए resulting auth profile store करता है।
  </Accordion>
  <Accordion title="xAI (Grok) device code">
    localhost callback के बजाय short code के साथ remote-friendly browser sign-in।
    इसे SSH, Docker, या VPS hosts से उपयोग करें।
  </Accordion>
  <Accordion title="xAI (Grok) API key">
    `XAI_API_KEY` के लिए prompt करता है और xAI को model provider के रूप में configure करता है। इसे तब उपयोग करें
    जब आप subscription OAuth के बजाय xAI Console API key चाहते हों।
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (या `OPENCODE_ZEN_API_KEY`) के लिए prompt करता है और आपको Zen या Go catalog चुनने देता है।
    Setup URL: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (generic)">
    आपके लिए key store करता है।
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` के लिए prompt करता है।
    अधिक विवरण: [Vercel AI Gateway](/hi/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    account ID, gateway ID, और `CLOUDFLARE_AI_GATEWAY_API_KEY` के लिए prompt करता है।
    अधिक विवरण: [Cloudflare AI Gateway](/hi/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Config auto-written है। Hosted default `MiniMax-M3` है; API-key setup
    `minimax/...` उपयोग करता है, और OAuth setup `minimax-portal/...` उपयोग करता है।
    अधिक विवरण: [MiniMax](/hi/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Config China या global endpoints पर StepFun standard या Step Plan के लिए auto-written है।
    Standard में वर्तमान में `step-3.5-flash` शामिल है, और Step Plan में `step-3.5-flash-2603` भी शामिल है।
    अधिक विवरण: [StepFun](/hi/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    `SYNTHETIC_API_KEY` के लिए prompt करता है।
    अधिक विवरण: [Synthetic](/hi/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud और local open models)">
    पहले `Cloud + Local`, `Cloud only`, या `Local only` के लिए prompt करता है।
    `Cloud only` `OLLAMA_API_KEY` को `https://ollama.com` के साथ उपयोग करता है।
    host-backed modes base URL (डिफ़ॉल्ट `http://127.0.0.1:11434`) के लिए prompt करते हैं, उपलब्ध models discover करते हैं, और defaults suggest करते हैं।
    `Cloud + Local` यह भी जांचता है कि वह Ollama host cloud access के लिए signed in है या नहीं।
    अधिक विवरण: [Ollama](/hi/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot और Kimi Coding">
    Moonshot (Kimi K2) और Kimi Coding configs auto-written हैं।
    अधिक विवरण: [Moonshot AI (Kimi + Kimi Coding)](/hi/providers/moonshot).
  </Accordion>
  <Accordion title="Custom provider">
    OpenAI-compatible और Anthropic-compatible endpoints के साथ काम करता है।

    Interactive onboarding अन्य provider API key flows जैसी ही API key storage choices का समर्थन करता है:
    - **API key अभी paste करें** (plaintext)
    - **secret reference उपयोग करें** (env ref या configured provider ref, preflight validation के साथ)

    Non-interactive flags:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optional; `CUSTOM_API_KEY` पर falls back)
    - `--custom-provider-id` (optional)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (optional; डिफ़ॉल्ट `openai`)
    - `--custom-image-input` / `--custom-text-input` (optional; inferred model input capability override करता है)

  </Accordion>
  <Accordion title="Skip">
    auth को unconfigured छोड़ता है।
  </Accordion>
</AccordionGroup>

Model behavior:

- detected options से default model चुनें, या provider और model manually enter करें।
- Custom-provider onboarding common model IDs के लिए image support infer करता है और केवल model name unknown होने पर पूछता है।
- जब onboarding किसी provider auth choice से शुरू होता है, तो model picker
  उस provider को automatically prefer करता है। Volcengine और BytePlus के लिए, वही preference
  उनके coding-plan variants (`volcengine-plan/*`,
  `byteplus-plan/*`) से भी match करता है।
- यदि वह preferred-provider filter empty हो, तो picker no models दिखाने के बजाय
  full catalog पर fallback करता है।
- विज़ार्ड model check चलाता है और configured model unknown होने या auth missing होने पर warn करता है।

Credential और profile paths:

- Auth profiles (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy OAuth import: `~/.openclaw/credentials/oauth.json`

Credential storage mode:

- डिफ़ॉल्ट ऑनबोर्डिंग व्यवहार API कुंजियों को auth प्रोफ़ाइलों में सादा पाठ मानों के रूप में बनाए रखता है।
- `--secret-input-mode ref` सादा पाठ कुंजी संग्रहण के बजाय संदर्भ मोड सक्षम करता है।
  इंटरैक्टिव सेटअप में, आप इनमें से कोई भी चुन सकते हैं:
  - environment variable ref (उदाहरण के लिए `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - provider alias + id के साथ कॉन्फ़िगर किया गया provider ref (`file` या `exec`)
- इंटरैक्टिव संदर्भ मोड सहेजने से पहले तेज़ preflight सत्यापन चलाता है।
  - Env refs: मौजूदा ऑनबोर्डिंग परिवेश में variable name + non-empty value सत्यापित करता है।
  - Provider refs: provider config सत्यापित करता है और अनुरोधित id resolve करता है।
  - यदि preflight विफल होता है, तो ऑनबोर्डिंग त्रुटि दिखाती है और आपको फिर से प्रयास करने देती है।
- गैर-इंटरैक्टिव मोड में, `--secret-input-mode ref` केवल env-backed है।
  - provider env var को ऑनबोर्डिंग प्रक्रिया परिवेश में सेट करें।
  - Inline key flags (उदाहरण के लिए `--openai-api-key`) के लिए उस env var का सेट होना आवश्यक है; अन्यथा ऑनबोर्डिंग तुरंत विफल हो जाती है।
  - custom providers के लिए, गैर-इंटरैक्टिव `ref` मोड `models.providers.<id>.apiKey` को `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` के रूप में संग्रहीत करता है।
  - उस custom-provider मामले में, `--custom-api-key` के लिए `CUSTOM_API_KEY` का सेट होना आवश्यक है; अन्यथा ऑनबोर्डिंग तुरंत विफल हो जाती है।
- Gateway auth credentials इंटरैक्टिव सेटअप में सादा पाठ और SecretRef विकल्पों का समर्थन करते हैं:
  - टोकन मोड: **सादा पाठ टोकन जनरेट/संग्रहीत करें** (डिफ़ॉल्ट) या **SecretRef का उपयोग करें**।
  - पासवर्ड मोड: सादा पाठ या SecretRef।
- गैर-इंटरैक्टिव टोकन SecretRef path: `--gateway-token-ref-env <ENV_VAR>`।
- मौजूदा सादा पाठ सेटअप बिना बदलाव के काम करना जारी रखते हैं।

<Note>
हेडलेस और सर्वर सुझाव: OAuth को ब्राउज़र वाली मशीन पर पूरा करें, फिर
उस एजेंट की `auth-profiles.json` (उदाहरण के लिए
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, या मेल खाने वाला
`$OPENCLAW_STATE_DIR/...` path) Gateway host पर कॉपी करें। `credentials/oauth.json`
केवल एक legacy import source है।
</Note>

## आउटपुट और आंतरिक विवरण

`~/.openclaw/openclaw.json` में सामान्य फ़ील्ड:

- `agents.defaults.workspace`
- `--skip-bootstrap` पास किए जाने पर `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers` (यदि Minimax चुना गया हो)
- `tools.profile` (सेट न होने पर local onboarding डिफ़ॉल्ट रूप से `"coding"` होता है; मौजूदा explicit values सुरक्षित रखे जाते हैं)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (सेट न होने पर local onboarding इसे डिफ़ॉल्ट रूप से `per-channel-peer` करता है; मौजूदा explicit values सुरक्षित रखे जाते हैं)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Channel allowlists (Slack, Discord, Matrix, Microsoft Teams) जब आप prompts के दौरान opt in करते हैं (संभव होने पर नाम IDs में resolve होते हैं)
- `skills.install.nodeManager`
  - `setup --node-manager` flag `npm`, `pnpm`, या `bun` स्वीकार करता है।
  - Manual config बाद में भी `skills.install.nodeManager: "yarn"` सेट कर सकता है।
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` `agents.list[]` और वैकल्पिक `bindings` लिखता है।

WhatsApp credentials `~/.openclaw/credentials/whatsapp/<accountId>/` के अंतर्गत जाते हैं।
Sessions `~/.openclaw/agents/<agentId>/sessions/` के अंतर्गत संग्रहीत किए जाते हैं।

<Note>
कुछ channels Plugin के रूप में डिलीवर किए जाते हैं। सेटअप के दौरान चुने जाने पर, विज़ार्ड
channel configuration से पहले Plugin (npm या local path) इंस्टॉल करने का prompt देता है।
</Note>

Gateway wizard RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clients (macOS app और Control UI) ऑनबोर्डिंग logic को फिर से लागू किए बिना steps render कर सकते हैं।

Signal setup behavior:

- उपयुक्त release asset डाउनलोड करता है
- इसे `~/.openclaw/tools/signal-cli/<version>/` के अंतर्गत संग्रहीत करता है
- config में `channels.signal.cliPath` लिखता है
- JVM builds के लिए Java 21 आवश्यक है
- उपलब्ध होने पर Native builds का उपयोग किया जाता है
- Windows WSL2 का उपयोग करता है और WSL के अंदर Linux signal-cli flow का पालन करता है

## संबंधित दस्तावेज़

- Onboarding hub: [Onboarding (CLI)](/hi/start/wizard)
- Automation और scripts: [CLI Automation](/hi/start/wizard-cli-automation)
- Command reference: [`openclaw onboard`](/hi/cli/onboard)
