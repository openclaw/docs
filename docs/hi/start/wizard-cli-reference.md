---
read_when:
    - आपको openclaw onboard के लिए विस्तृत व्यवहार चाहिए
    - आप ऑनबोर्डिंग परिणामों को डीबग कर रहे हैं या ऑनबोर्डिंग क्लाइंट्स को एकीकृत कर रहे हैं
sidebarTitle: CLI reference
summary: CLI सेटअप प्रवाह, प्रमाणीकरण/मॉडल सेटअप, आउटपुट और आंतरिक विवरणों के लिए पूर्ण संदर्भ
title: CLI सेटअप संदर्भ
x-i18n:
    generated_at: "2026-06-29T00:15:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6e46c81dd51ee9f1ce492dedc2911d449f507a136bd8805bc157915684a1941
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

यह पृष्ठ `openclaw onboard` का पूर्ण संदर्भ है।
संक्षिप्त गाइड के लिए, [ऑनबोर्डिंग (CLI)](/hi/start/wizard) देखें।

## विज़ार्ड क्या करता है

स्थानीय मोड (डिफ़ॉल्ट) आपको इनसे गुज़ारता है:

- मॉडल और ऑथ सेटअप (OpenAI Code subscription OAuth, Anthropic Claude CLI या API key, साथ ही MiniMax, GLM, Ollama, Moonshot, StepFun, और AI Gateway विकल्प)
- वर्कस्पेस स्थान और बूटस्ट्रैप फ़ाइलें
- Gateway सेटिंग्स (पोर्ट, बाइंड, ऑथ, tailscale)
- चैनल और प्रदाता (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage, और अन्य बंडल किए गए चैनल plugins)
- डेमन इंस्टॉल (LaunchAgent, systemd user unit, या Startup-folder fallback के साथ native Windows Scheduled Task)
- स्वास्थ्य जांच
- Skills सेटअप

रिमोट मोड इस मशीन को कहीं और मौजूद gateway से कनेक्ट करने के लिए कॉन्फ़िगर करता है।
यह रिमोट होस्ट पर कुछ भी इंस्टॉल या संशोधित नहीं करता।

## स्थानीय फ़्लो विवरण

<Steps>
  <Step title="मौजूदा कॉन्फ़िग पहचान">
    - यदि `~/.openclaw/openclaw.json` मौजूद है, तो Keep, Modify, या Reset चुनें।
    - विज़ार्ड दोबारा चलाने से कुछ भी मिटता नहीं है, जब तक आप स्पष्ट रूप से Reset न चुनें (या `--reset` पास न करें)।
    - CLI `--reset` डिफ़ॉल्ट रूप से `config+creds+sessions` पर सेट होता है; वर्कस्पेस भी हटाने के लिए `--reset-scope full` का उपयोग करें।
    - यदि कॉन्फ़िग अमान्य है या उसमें legacy keys हैं, तो विज़ार्ड रुकता है और जारी रखने से पहले आपसे `openclaw doctor` चलाने को कहता है।
    - Reset `trash` का उपयोग करता है और scopes प्रदान करता है:
      - केवल कॉन्फ़िग
      - कॉन्फ़िग + क्रेडेंशियल्स + सत्र
      - पूर्ण रीसेट (वर्कस्पेस भी हटाता है)

  </Step>
  <Step title="मॉडल और ऑथ">
    - पूरा विकल्प मैट्रिक्स [ऑथ और मॉडल विकल्प](#auth-and-model-options) में है।

  </Step>
  <Step title="वर्कस्पेस">
    - डिफ़ॉल्ट `~/.openclaw/workspace` (कॉन्फ़िगर करने योग्य)।
    - पहले रन के बूटस्ट्रैप अनुष्ठान के लिए ज़रूरी वर्कस्पेस फ़ाइलें सीड करता है।
    - वर्कस्पेस लेआउट: [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace)।

  </Step>
  <Step title="Gateway">
    - पोर्ट, बाइंड, ऑथ मोड, और tailscale exposure के लिए prompts करता है।
    - अनुशंसित: loopback के लिए भी token auth सक्षम रखें, ताकि local WS clients को authenticate करना पड़े।
    - token mode में, interactive setup ये प्रदान करता है:
      - **plaintext token जनरेट/स्टोर करें** (डिफ़ॉल्ट)
      - **SecretRef का उपयोग करें** (opt-in)
    - password mode में, interactive setup plaintext या SecretRef storage का भी समर्थन करता है।
    - non-interactive token SecretRef path: `--gateway-token-ref-env <ENV_VAR>`।
      - onboarding process environment में non-empty env var की आवश्यकता होती है।
      - `--gateway-token` के साथ combine नहीं किया जा सकता।
    - auth केवल तभी disable करें जब आप हर local process पर पूरी तरह भरोसा करते हों।
    - Non-loopback binds में फिर भी auth की आवश्यकता होती है।

  </Step>
  <Step title="चैनल">
    - [WhatsApp](/hi/channels/whatsapp): वैकल्पिक QR login
    - [Telegram](/hi/channels/telegram): bot token
    - [Discord](/hi/channels/discord): bot token
    - [Google Chat](/hi/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/hi/channels/mattermost): bot token + base URL
    - [Signal](/hi/channels/signal): वैकल्पिक `signal-cli` install + account config
    - [iMessage](/hi/channels/imessage): `imsg` CLI path + Messages DB access; जब Gateway Mac से बाहर चलता हो, तो SSH wrapper का उपयोग करें
    - DM सुरक्षा: डिफ़ॉल्ट pairing है। पहला DM एक code भेजता है; इसके जरिए approve करें
      `openclaw pairing approve <channel> <code>` या allowlists का उपयोग करें।
  </Step>
  <Step title="डेमन इंस्टॉल">
    - macOS: LaunchAgent
      - logged-in user session आवश्यक है; headless के लिए, custom LaunchDaemon का उपयोग करें (shipped नहीं है)।
    - Linux और Windows via WSL2: systemd user unit
      - विज़ार्ड `loginctl enable-linger <user>` का प्रयास करता है ताकि gateway logout के बाद भी चलता रहे।
      - sudo के लिए prompt कर सकता है (`/var/lib/systemd/linger` लिखता है); पहले sudo के बिना प्रयास करता है।
    - Native Windows: पहले Scheduled Task
      - यदि task creation deny हो जाता है, तो OpenClaw per-user Startup-folder login item पर fallback करता है और gateway तुरंत शुरू करता है।
      - Scheduled Tasks preferred रहते हैं क्योंकि वे बेहतर supervisor status प्रदान करते हैं।
    - Runtime selection: Node (अनुशंसित; WhatsApp और Telegram के लिए आवश्यक)। Bun अनुशंसित नहीं है।

  </Step>
  <Step title="स्वास्थ्य जांच">
    - gateway (यदि आवश्यक हो) शुरू करता है और `openclaw health` चलाता है।
    - `openclaw status --deep` status output में live gateway health probe जोड़ता है, जिसमें समर्थित होने पर channel probes भी शामिल होते हैं।

  </Step>
  <Step title="Skills">
    - उपलब्ध skills पढ़ता है और requirements जांचता है।
    - आपको node manager चुनने देता है: npm, pnpm, या bun।
    - वैकल्पिक dependencies इंस्टॉल करता है (कुछ macOS पर Homebrew का उपयोग करती हैं)।

  </Step>
  <Step title="समाप्त">
    - सारांश और अगले चरण, जिनमें iOS, Android, और macOS app विकल्प शामिल हैं।

  </Step>
</Steps>

<Note>
यदि कोई GUI detect नहीं होता, तो विज़ार्ड browser खोलने के बजाय Control UI के लिए SSH port-forward निर्देश print करता है।
यदि Control UI assets missing हैं, तो विज़ार्ड उन्हें build करने का प्रयास करता है; fallback `pnpm ui:build` है (UI deps auto-installs करता है)।
</Note>

## रिमोट मोड विवरण

रिमोट मोड इस मशीन को कहीं और मौजूद gateway से कनेक्ट करने के लिए कॉन्फ़िगर करता है।

<Info>
रिमोट मोड रिमोट होस्ट पर कुछ भी इंस्टॉल या संशोधित नहीं करता।
</Info>

आप जो सेट करते हैं:

- Remote gateway URL (`ws://...`)
- Token यदि remote gateway auth आवश्यक है (अनुशंसित)

<Note>
- यदि gateway loopback-only है, तो SSH tunneling या tailnet का उपयोग करें।
- Discovery hints:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## ऑथ और मॉडल विकल्प

<AccordionGroup>
  <Accordion title="Anthropic API key">
    मौजूद होने पर `ANTHROPIC_API_KEY` का उपयोग करता है या key के लिए prompt करता है, फिर daemon use के लिए उसे save करता है।
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    Browser flow; `code#state` paste करें।

    जब model unset हो या पहले से OpenAI-family हो, तो Codex runtime के माध्यम से `agents.defaults.model` को `openai/gpt-5.5` पर set करता है।

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    short-lived device code के साथ browser pairing flow।

    जब model unset हो या पहले से OpenAI-family हो, तो Codex runtime के माध्यम से `agents.defaults.model` को `openai/gpt-5.5` पर set करता है।

  </Accordion>
  <Accordion title="OpenAI API key">
    मौजूद होने पर `OPENAI_API_KEY` का उपयोग करता है या key के लिए prompt करता है, फिर credential को auth profiles में store करता है।

    जब model unset हो, `openai/*` हो, या legacy Codex model refs हों, तो `agents.defaults.model` को `openai/gpt-5.5` पर set करता है।

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    eligible SuperGrok या X Premium accounts के लिए browser sign-in। अधिकांश users के लिए यह
    अनुशंसित xAI path है। OpenClaw Grok models, Grok `web_search`, `x_search`, और `code_execution` के लिए resulting auth
    profile store करता है।
  </Accordion>
  <Accordion title="xAI (Grok) device code">
    localhost callback के बजाय short code के साथ remote-friendly browser sign-in।
    इसे SSH, Docker, या VPS hosts से उपयोग करें।
  </Accordion>
  <Accordion title="xAI (Grok) API key">
    `XAI_API_KEY` के लिए prompt करता है और xAI को model provider के रूप में configure करता है। इसका उपयोग तब करें
    जब आप subscription OAuth के बजाय xAI Console API key चाहते हों।
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (या `OPENCODE_ZEN_API_KEY`) के लिए prompt करता है और आपको Zen या Go catalog चुनने देता है।
    Setup URL: [opencode.ai/auth](https://opencode.ai/auth)।
  </Accordion>
  <Accordion title="API key (generic)">
    आपके लिए key store करता है।
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` के लिए prompt करता है।
    अधिक विवरण: [Vercel AI Gateway](/hi/providers/vercel-ai-gateway)।
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    account ID, gateway ID, और `CLOUDFLARE_AI_GATEWAY_API_KEY` के लिए prompt करता है।
    अधिक विवरण: [Cloudflare AI Gateway](/hi/providers/cloudflare-ai-gateway)।
  </Accordion>
  <Accordion title="MiniMax">
    Config auto-written है। Hosted default `MiniMax-M3` है; API-key setup
    `minimax/...` का उपयोग करता है, और OAuth setup `minimax-portal/...` का उपयोग करता है।
    अधिक विवरण: [MiniMax](/hi/providers/minimax)।
  </Accordion>
  <Accordion title="StepFun">
    Config China या global endpoints पर StepFun standard या Step Plan के लिए auto-written है।
    Standard में फिलहाल `step-3.5-flash` शामिल है, और Step Plan में `step-3.5-flash-2603` भी शामिल है।
    अधिक विवरण: [StepFun](/hi/providers/stepfun)।
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    `SYNTHETIC_API_KEY` के लिए prompt करता है।
    अधिक विवरण: [Synthetic](/hi/providers/synthetic)।
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    पहले `Cloud + Local`, `Cloud only`, या `Local only` के लिए prompt करता है।
    `Cloud only` `https://ollama.com` के साथ `OLLAMA_API_KEY` का उपयोग करता है।
    host-backed modes base URL (डिफ़ॉल्ट `http://127.0.0.1:11434`) के लिए prompt करते हैं, उपलब्ध models discover करते हैं, और defaults suggest करते हैं।
    `Cloud + Local` यह भी checks करता है कि उस Ollama host में cloud access के लिए sign in है या नहीं।
    अधिक विवरण: [Ollama](/hi/providers/ollama)।
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    Moonshot (Kimi K2) और Kimi Coding configs auto-written हैं।
    अधिक विवरण: [Moonshot AI (Kimi + Kimi Coding)](/hi/providers/moonshot)।
  </Accordion>
  <Accordion title="Custom provider">
    OpenAI-compatible और Anthropic-compatible endpoints के साथ काम करता है।

    Interactive onboarding अन्य provider API key flows जैसी समान API key storage choices का समर्थन करता है:
    - **अभी API key paste करें** (plaintext)
    - **secret reference का उपयोग करें** (env ref या configured provider ref, preflight validation के साथ)

    Non-interactive flags:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (optional; `CUSTOM_API_KEY` पर falls back)
    - `--custom-provider-id` (optional)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (optional; default `openai`)
    - `--custom-image-input` / `--custom-text-input` (optional; inferred model input capability override करता है)

  </Accordion>
  <Accordion title="Skip">
    auth unconfigured छोड़ता है।
  </Accordion>
</AccordionGroup>

Model behavior:

- detected options से default model चुनें, या provider और model manually enter करें।
- Custom-provider onboarding common model IDs के लिए image support infer करता है और केवल तब पूछता है जब model name unknown हो।
- जब onboarding provider auth choice से शुरू होती है, तो model picker
  उस provider को automatically prefer करता है। Volcengine और BytePlus के लिए, वही preference
  उनके coding-plan variants (`volcengine-plan/*`,
  `byteplus-plan/*`) से भी match करता है।
- यदि वह preferred-provider filter empty होगा, तो picker no models दिखाने के बजाय
  full catalog पर falls back करता है।
- Wizard model check चलाता है और configured model unknown या auth missing होने पर warning देता है।

Credential and profile paths:

- Auth profiles (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy OAuth import: `~/.openclaw/credentials/oauth.json`

Credential storage mode:

- डिफ़ॉल्ट ऑनबोर्डिंग व्यवहार API कुंजियों को auth प्रोफ़ाइलों में सादा-पाठ मानों के रूप में बनाए रखता है।
- `--secret-input-mode ref` सादा-पाठ कुंजी संग्रहण के बजाय संदर्भ मोड सक्षम करता है।
  इंटरैक्टिव सेटअप में, आप इनमें से कोई भी चुन सकते हैं:
  - पर्यावरण चर संदर्भ (उदाहरण के लिए `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - कॉन्फ़िगर किया गया प्रदाता संदर्भ (`file` या `exec`) प्रदाता उपनाम + id के साथ
- इंटरैक्टिव संदर्भ मोड सहेजने से पहले तेज़ पूर्व-जांच सत्यापन चलाता है।
  - पर्यावरण संदर्भ: वर्तमान ऑनबोर्डिंग परिवेश में चर नाम + गैर-रिक्त मान सत्यापित करता है।
  - प्रदाता संदर्भ: प्रदाता कॉन्फ़िग सत्यापित करता है और अनुरोधित id हल करता है।
  - यदि पूर्व-जांच विफल होती है, तो ऑनबोर्डिंग त्रुटि दिखाता है और आपको फिर से प्रयास करने देता है।
- गैर-इंटरैक्टिव मोड में, `--secret-input-mode ref` केवल पर्यावरण-समर्थित होता है।
  - ऑनबोर्डिंग प्रक्रिया परिवेश में प्रदाता पर्यावरण चर सेट करें।
  - इनलाइन कुंजी फ़्लैग (उदाहरण के लिए `--openai-api-key`) के लिए वह पर्यावरण चर सेट होना आवश्यक है; अन्यथा ऑनबोर्डिंग तुरंत विफल हो जाती है।
  - कस्टम प्रदाताओं के लिए, गैर-इंटरैक्टिव `ref` मोड `models.providers.<id>.apiKey` को `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` के रूप में संग्रहीत करता है।
  - उस कस्टम-प्रदाता मामले में, `--custom-api-key` के लिए `CUSTOM_API_KEY` सेट होना आवश्यक है; अन्यथा ऑनबोर्डिंग तुरंत विफल हो जाती है।
- Gateway auth क्रेडेंशियल इंटरैक्टिव सेटअप में सादा-पाठ और SecretRef विकल्पों का समर्थन करते हैं:
  - टोकन मोड: **सादा-पाठ टोकन जनरेट/संग्रहीत करें** (डिफ़ॉल्ट) या **SecretRef का उपयोग करें**।
  - पासवर्ड मोड: सादा-पाठ या SecretRef।
- गैर-इंटरैक्टिव टोकन SecretRef पथ: `--gateway-token-ref-env <ENV_VAR>`।
- मौजूदा सादा-पाठ सेटअप बिना बदलाव काम करते रहते हैं।

<Note>
हेडलेस और सर्वर सुझाव: OAuth को ब्राउज़र वाली मशीन पर पूरा करें, फिर
उस एजेंट की `auth-profiles.json` (उदाहरण के लिए
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, या मेल खाता
`$OPENCLAW_STATE_DIR/...` पथ) Gateway होस्ट पर कॉपी करें। `credentials/oauth.json`
केवल एक लेगेसी आयात स्रोत है।
</Note>

## आउटपुट और आंतरिक विवरण

`~/.openclaw/openclaw.json` में सामान्य फ़ील्ड:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` जब `--skip-bootstrap` पास किया जाता है
- `agents.defaults.model` / `models.providers` (यदि Minimax चुना गया हो)
- `tools.profile` (स्थानीय ऑनबोर्डिंग सेट न होने पर डिफ़ॉल्ट रूप से `"coding"` होता है; मौजूदा स्पष्ट मान सुरक्षित रखे जाते हैं)
- `gateway.*` (मोड, bind, auth, tailscale)
- `session.dmScope` (स्थानीय ऑनबोर्डिंग सेट न होने पर इसे डिफ़ॉल्ट रूप से `per-channel-peer` करता है; मौजूदा स्पष्ट मान सुरक्षित रखे जाते हैं)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- चैनल allowlists (Slack, Discord, Matrix, Microsoft Teams) जब आप प्रॉम्प्ट के दौरान विकल्प चुनते हैं (संभव होने पर नाम IDs में हल होते हैं)
- `skills.install.nodeManager`
  - `setup --node-manager` फ़्लैग `npm`, `pnpm`, या `bun` स्वीकार करता है।
  - मैनुअल कॉन्फ़िग बाद में भी `skills.install.nodeManager: "yarn"` सेट कर सकता है।
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` `agents.list[]` और वैकल्पिक `bindings` लिखता है।

WhatsApp क्रेडेंशियल `~/.openclaw/credentials/whatsapp/<accountId>/` के अंतर्गत जाते हैं।
सत्र `~/.openclaw/agents/<agentId>/sessions/` के अंतर्गत संग्रहीत होते हैं।

<Note>
कुछ चैनल plugins के रूप में डिलीवर किए जाते हैं। सेटअप के दौरान चुने जाने पर, विज़ार्ड
चैनल कॉन्फ़िगरेशन से पहले plugin (npm या स्थानीय पथ) इंस्टॉल करने के लिए प्रॉम्प्ट करता है।
</Note>

Gateway विज़ार्ड RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

क्लाइंट (macOS ऐप और Control UI) ऑनबोर्डिंग लॉजिक को फिर से लागू किए बिना चरणों को रेंडर कर सकते हैं।

Signal सेटअप व्यवहार:

- उपयुक्त रिलीज़ एसेट डाउनलोड करता है
- उसे `~/.openclaw/tools/signal-cli/<version>/` के अंतर्गत संग्रहीत करता है
- कॉन्फ़िग में `channels.signal.cliPath` लिखता है
- JVM बिल्ड के लिए Java 21 आवश्यक है
- उपलब्ध होने पर नेटिव बिल्ड उपयोग किए जाते हैं
- Windows WSL2 का उपयोग करता है और WSL के अंदर Linux signal-cli फ़्लो का पालन करता है

## संबंधित दस्तावेज़

- ऑनबोर्डिंग हब: [ऑनबोर्डिंग (CLI)](/hi/start/wizard)
- स्वचालन और स्क्रिप्ट: [CLI स्वचालन](/hi/start/wizard-cli-automation)
- कमांड संदर्भ: [`openclaw onboard`](/hi/cli/onboard)
