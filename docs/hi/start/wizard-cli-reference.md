---
read_when:
    - आपको openclaw onboard के लिए विस्तृत व्यवहार चाहिए
    - आप ऑनबोर्डिंग परिणामों को डीबग कर रहे हैं या ऑनबोर्डिंग क्लाइंटों को एकीकृत कर रहे हैं
sidebarTitle: CLI reference
summary: CLI सेटअप प्रवाह, auth/model सेटअप, आउटपुट और internals के लिए पूर्ण संदर्भ
title: CLI सेटअप संदर्भ
x-i18n:
    generated_at: "2026-07-04T06:35:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 016ea0c85cefd5cc70d0988e82f2cbb5898c0ae3134f68df645dddb58c2dfe9a
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

यह पृष्ठ `openclaw onboard` का पूर्ण संदर्भ है।
संक्षिप्त मार्गदर्शिका के लिए, [ऑनबोर्डिंग (CLI)](/hi/start/wizard) देखें।

## विज़ार्ड क्या करता है

स्थानीय मोड (डिफ़ॉल्ट) आपको इनके माध्यम से ले जाता है:

- मॉडल और प्रमाणीकरण सेटअप (OpenAI Code सब्सक्रिप्शन OAuth, Anthropic Claude CLI या API key, साथ ही MiniMax, GLM, Ollama, Moonshot, StepFun, और AI Gateway विकल्प)
- वर्कस्पेस स्थान और बूटस्ट्रैप फ़ाइलें
- Gateway सेटिंग्स (पोर्ट, बाइंड, प्रमाणीकरण, Tailscale)
- चैनल और प्रदाता (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage, और अन्य बंडल किए गए चैनल Plugin)
- Daemon इंस्टॉल (LaunchAgent, systemd user unit, या Startup-folder fallback के साथ native Windows Scheduled Task)
- स्वास्थ्य जांच
- Skills सेटअप

रिमोट मोड इस मशीन को कहीं और मौजूद Gateway से कनेक्ट करने के लिए कॉन्फ़िगर करता है।
यह रिमोट होस्ट पर कुछ भी इंस्टॉल या संशोधित नहीं करता।

## स्थानीय फ़्लो विवरण

<Steps>
  <Step title="मौजूदा कॉन्फ़िग पहचान">
    - यदि `~/.openclaw/openclaw.json` मौजूद है, तो Keep, Modify, या Reset चुनें।
    - विज़ार्ड को फिर से चलाने से कुछ भी मिटता नहीं है, जब तक कि आप स्पष्ट रूप से Reset न चुनें (या `--reset` पास न करें)।
    - CLI `--reset` का डिफ़ॉल्ट `config+creds+sessions` है; वर्कस्पेस भी हटाने के लिए `--reset-scope full` का उपयोग करें।
    - यदि कॉन्फ़िग अमान्य है या उसमें लेगेसी कुंजियाँ हैं, तो विज़ार्ड रुक जाता है और जारी रखने से पहले आपसे `openclaw doctor` चलाने को कहता है।
    - Reset `trash` का उपयोग करता है और ये स्कोप देता है:
      - केवल कॉन्फ़िग
      - कॉन्फ़िग + क्रेडेंशियल + सेशन
      - पूर्ण रीसेट (वर्कस्पेस भी हटाता है)

  </Step>
  <Step title="मॉडल और प्रमाणीकरण">
    - पूरा विकल्प मैट्रिक्स [प्रमाणीकरण और मॉडल विकल्प](#auth-and-model-options) में है।

  </Step>
  <Step title="वर्कस्पेस">
    - डिफ़ॉल्ट `~/.openclaw/workspace` (कॉन्फ़िगर किया जा सकता है)।
    - पहली बार चलने वाले बूटस्ट्रैप रिचुअल के लिए आवश्यक वर्कस्पेस फ़ाइलें सीड करता है।
    - वर्कस्पेस लेआउट: [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace)।

  </Step>
  <Step title="Gateway">
    - पोर्ट, बाइंड, प्रमाणीकरण मोड, और Tailscale एक्सपोज़र के लिए पूछता है।
    - अनुशंसित: loopback के लिए भी टोकन प्रमाणीकरण सक्षम रखें, ताकि स्थानीय WS क्लाइंट को प्रमाणीकरण करना पड़े।
    - टोकन मोड में, इंटरैक्टिव सेटअप ये देता है:
      - **प्लेनटेक्स्ट टोकन जनरेट/स्टोर करें** (डिफ़ॉल्ट)
      - **SecretRef उपयोग करें** (ऑप्ट-इन)
    - पासवर्ड मोड में, इंटरैक्टिव सेटअप प्लेनटेक्स्ट या SecretRef स्टोरेज का भी समर्थन करता है।
    - गैर-इंटरैक्टिव टोकन SecretRef पथ: `--gateway-token-ref-env <ENV_VAR>`।
      - ऑनबोर्डिंग प्रक्रिया के वातावरण में एक गैर-खाली env var आवश्यक है।
      - `--gateway-token` के साथ जोड़ा नहीं जा सकता।
    - प्रमाणीकरण केवल तब अक्षम करें जब आप हर स्थानीय प्रक्रिया पर पूरा भरोसा करते हों।
    - गैर-loopback बाइंड के लिए फिर भी प्रमाणीकरण आवश्यक है।

  </Step>
  <Step title="चैनल">
    - [WhatsApp](/hi/channels/whatsapp): वैकल्पिक QR लॉगिन
    - [Telegram](/hi/channels/telegram): bot token
    - [Discord](/hi/channels/discord): bot token
    - [Google Chat](/hi/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/hi/channels/mattermost): bot token + base URL
    - [Signal](/hi/channels/signal): वैकल्पिक `signal-cli` इंस्टॉल + अकाउंट कॉन्फ़िग
    - [iMessage](/hi/channels/imessage): `imsg` CLI पथ + Messages DB एक्सेस; जब Gateway Mac से बाहर चलता है तो SSH wrapper का उपयोग करें
    - DM सुरक्षा: डिफ़ॉल्ट pairing है। पहला DM एक कोड भेजता है; इसके ज़रिए स्वीकृत करें
      `openclaw pairing approve <channel> <code>` या allowlists का उपयोग करें।
  </Step>
  <Step title="Daemon इंस्टॉल">
    - macOS: LaunchAgent
      - लॉग-इन उपयोगकर्ता सेशन आवश्यक है; headless के लिए, custom LaunchDaemon का उपयोग करें (शिप नहीं किया गया)।
    - Linux और Windows via WSL2: systemd user unit
      - विज़ार्ड `loginctl enable-linger <user>` का प्रयास करता है ताकि logout के बाद भी Gateway चलता रहे।
      - sudo के लिए पूछ सकता है (`/var/lib/systemd/linger` लिखता है); पहले sudo के बिना प्रयास करता है।
    - Native Windows: पहले Scheduled Task
      - यदि task creation अस्वीकार हो, तो OpenClaw प्रति-उपयोगकर्ता Startup-folder login item पर वापस जाता है और Gateway तुरंत शुरू करता है।
      - Scheduled Tasks अभी भी पसंदीदा हैं क्योंकि वे बेहतर supervisor status देते हैं।
    - रनटाइम चयन: Node (अनुशंसित; WhatsApp और Telegram के लिए आवश्यक)। Bun अनुशंसित नहीं है।

  </Step>
  <Step title="स्वास्थ्य जांच">
    - Gateway शुरू करता है (यदि आवश्यक हो) और `openclaw health` चलाता है।
    - `openclaw status --deep` status output में live Gateway health probe जोड़ता है, समर्थित होने पर channel probes सहित।

  </Step>
  <Step title="Skills">
    - उपलब्ध Skills पढ़ता है और आवश्यकताएँ जांचता है।
    - आपको node manager चुनने देता है: npm, pnpm, या bun।
    - जब आवश्यक installer उपलब्ध हो, trusted bundled skills के लिए वैकल्पिक dependencies इंस्टॉल करता है।
    - अनुपलब्ध Homebrew, uv, और Go installers को छोड़ता है, फिर प्रभावित
      Skills को manual setup guidance के साथ समूहित करता है। गुम prerequisites इंस्टॉल करने के बाद `openclaw doctor` चलाएँ।

  </Step>
  <Step title="समाप्त">
    - सारांश और अगले चरण, जिनमें iOS, Android, और macOS app विकल्प शामिल हैं।

  </Step>
</Steps>

<Note>
यदि कोई GUI नहीं मिलता, तो विज़ार्ड browser खोलने के बजाय Control UI के लिए SSH port-forward निर्देश प्रिंट करता है।
यदि Control UI assets अनुपस्थित हैं, तो विज़ार्ड उन्हें build करने का प्रयास करता है; fallback `pnpm ui:build` है (UI deps को auto-installs करता है)।
</Note>

## रिमोट मोड विवरण

रिमोट मोड इस मशीन को कहीं और मौजूद Gateway से कनेक्ट करने के लिए कॉन्फ़िगर करता है।

<Info>
रिमोट मोड रिमोट होस्ट पर कुछ भी इंस्टॉल या संशोधित नहीं करता।
</Info>

आप जो सेट करते हैं:

- रिमोट Gateway URL (`ws://...`)
- यदि रिमोट Gateway प्रमाणीकरण आवश्यक है तो टोकन (अनुशंसित)

<Note>
- यदि Gateway केवल loopback है, तो SSH tunneling या tailnet का उपयोग करें।
- Discovery hints:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## प्रमाणीकरण और मॉडल विकल्प

<AccordionGroup>
  <Accordion title="Anthropic API key">
    मौजूद होने पर `ANTHROPIC_API_KEY` का उपयोग करता है या key के लिए पूछता है, फिर उसे daemon उपयोग के लिए सहेजता है।
  </Accordion>
  <Accordion title="OpenAI Code सब्सक्रिप्शन (OAuth)">
    Browser flow; `code#state` paste करें।

    जब model unset हो या पहले से OpenAI-family हो, तो Codex runtime के माध्यम से `agents.defaults.model` को `openai/gpt-5.5` पर सेट करता है।

  </Accordion>
  <Accordion title="OpenAI Code सब्सक्रिप्शन (device pairing)">
    अल्पकालिक device code के साथ browser pairing flow।

    जब model unset हो या पहले से OpenAI-family हो, तो Codex runtime के माध्यम से `agents.defaults.model` को `openai/gpt-5.5` पर सेट करता है।

  </Accordion>
  <Accordion title="OpenAI API key">
    मौजूद होने पर `OPENAI_API_KEY` का उपयोग करता है या key के लिए पूछता है, फिर credential को auth profiles में स्टोर करता है।

    जब model unset हो, `openai/*` हो, या legacy Codex model refs हों, तो `agents.defaults.model` को `openai/gpt-5.5` पर सेट करता है।

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    पात्र SuperGrok या X Premium accounts के लिए browser sign-in। यह अधिकांश
    उपयोगकर्ताओं के लिए अनुशंसित xAI पथ है। OpenClaw Grok models, Grok `web_search`, `x_search`, और `code_execution` के लिए परिणामी auth
    profile स्टोर करता है।
  </Accordion>
  <Accordion title="xAI (Grok) device code">
    localhost callback के बजाय छोटे code के साथ remote-friendly browser sign-in।
    इसे SSH, Docker, या VPS hosts से उपयोग करें।
  </Accordion>
  <Accordion title="xAI (Grok) API key">
    `XAI_API_KEY` के लिए पूछता है और xAI को model provider के रूप में कॉन्फ़िगर करता है। इसे तब उपयोग करें
    जब आपको subscription OAuth के बजाय xAI Console API key चाहिए।
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (या `OPENCODE_ZEN_API_KEY`) के लिए पूछता है और आपको Zen या Go catalog चुनने देता है।
    Setup URL: [opencode.ai/auth](https://opencode.ai/auth)।
  </Accordion>
  <Accordion title="API key (generic)">
    आपके लिए key स्टोर करता है।
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` के लिए पूछता है।
    अधिक विवरण: [Vercel AI Gateway](/hi/providers/vercel-ai-gateway)।
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    account ID, gateway ID, और `CLOUDFLARE_AI_GATEWAY_API_KEY` के लिए पूछता है।
    अधिक विवरण: [Cloudflare AI Gateway](/hi/providers/cloudflare-ai-gateway)।
  </Accordion>
  <Accordion title="MiniMax">
    कॉन्फ़िग auto-written है। Hosted default `MiniMax-M3` है; API-key setup
    `minimax/...` का उपयोग करता है, और OAuth setup `minimax-portal/...` का उपयोग करता है।
    अधिक विवरण: [MiniMax](/hi/providers/minimax)।
  </Accordion>
  <Accordion title="StepFun">
    China या global endpoints पर StepFun standard या Step Plan के लिए कॉन्फ़िग auto-written है।
    Standard में वर्तमान में `step-3.5-flash` शामिल है, और Step Plan में `step-3.5-flash-2603` भी शामिल है।
    अधिक विवरण: [StepFun](/hi/providers/stepfun)।
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    `SYNTHETIC_API_KEY` के लिए पूछता है।
    अधिक विवरण: [Synthetic](/hi/providers/synthetic)।
  </Accordion>
  <Accordion title="Ollama (Cloud और local open models)">
    पहले `Cloud + Local`, `Cloud only`, या `Local only` के लिए पूछता है।
    `Cloud only` `https://ollama.com` के साथ `OLLAMA_API_KEY` का उपयोग करता है।
    host-backed modes base URL (डिफ़ॉल्ट `http://127.0.0.1:11434`) के लिए पूछते हैं, उपलब्ध models खोजते हैं, और defaults सुझाते हैं।
    `Cloud + Local` यह भी जांचता है कि वह Ollama host cloud access के लिए signed in है या नहीं।
    अधिक विवरण: [Ollama](/hi/providers/ollama)।
  </Accordion>
  <Accordion title="Moonshot और Kimi Coding">
    Moonshot (Kimi K2) और Kimi Coding configs auto-written हैं।
    अधिक विवरण: [Moonshot AI (Kimi + Kimi Coding)](/hi/providers/moonshot)।
  </Accordion>
  <Accordion title="Custom provider">
    OpenAI-compatible और Anthropic-compatible endpoints के साथ काम करता है।

    Interactive onboarding अन्य provider API key flows जैसी ही API key storage choices का समर्थन करता है:
    - **अब API key paste करें** (plaintext)
    - **secret reference उपयोग करें** (env ref या configured provider ref, preflight validation के साथ)

    Non-interactive flags:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (वैकल्पिक; `CUSTOM_API_KEY` पर fallback करता है)
    - `--custom-provider-id` (वैकल्पिक)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (वैकल्पिक; default `openai`)
    - `--custom-image-input` / `--custom-text-input` (वैकल्पिक; inferred model input capability को override करता है)

  </Accordion>
  <Accordion title="Skip">
    प्रमाणीकरण को अनकॉन्फ़िगर छोड़ता है।
  </Accordion>
</AccordionGroup>

मॉडल व्यवहार:

- पहचाने गए विकल्पों से default model चुनें, या provider और model manually दर्ज करें।
- Custom-provider onboarding common model IDs के लिए image support infer करता है और केवल तब पूछता है जब model name unknown हो।
- जब onboarding provider auth choice से शुरू होता है, तो model picker
  उस provider को automatically prefer करता है। Volcengine और BytePlus के लिए, वही preference
  उनके coding-plan variants (`volcengine-plan/*`,
  `byteplus-plan/*`) से भी match करती है।
- यदि वह preferred-provider filter खाली होगा, तो picker
  कोई models न दिखाने के बजाय full catalog पर fallback करता है।
- विज़ार्ड model check चलाता है और configured model unknown होने या auth missing होने पर चेतावनी देता है।

Credential और profile paths:

- Auth profiles (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy OAuth import: `~/.openclaw/credentials/oauth.json`

Credential storage mode:

- डिफ़ॉल्ट ऑनबोर्डिंग व्यवहार API कुंजियों को प्रमाणीकरण प्रोफ़ाइल में सादे टेक्स्ट मानों के रूप में सहेजता है।
- `--secret-input-mode ref` सादे टेक्स्ट कुंजी संग्रह के बजाय संदर्भ मोड सक्षम करता है।
  इंटरैक्टिव सेटअप में, आप इनमें से कोई भी चुन सकते हैं:
  - एनवायरनमेंट वैरिएबल संदर्भ (उदाहरण के लिए `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - कॉन्फ़िगर किया गया प्रदाता संदर्भ (`file` या `exec`) प्रदाता उपनाम + id के साथ
- इंटरैक्टिव संदर्भ मोड सहेजने से पहले तेज़ प्रीफ़्लाइट सत्यापन चलाता है।
  - Env संदर्भ: मौजूदा ऑनबोर्डिंग एनवायरनमेंट में वैरिएबल नाम + गैर-खाली मान सत्यापित करता है।
  - प्रदाता संदर्भ: प्रदाता कॉन्फ़िगरेशन सत्यापित करता है और अनुरोधित id रिज़ॉल्व करता है।
  - यदि प्रीफ़्लाइट विफल होता है, तो ऑनबोर्डिंग त्रुटि दिखाता है और आपको फिर से प्रयास करने देता है।
- गैर-इंटरैक्टिव मोड में, `--secret-input-mode ref` केवल env-समर्थित होता है।
  - ऑनबोर्डिंग प्रक्रिया एनवायरनमेंट में प्रदाता env var सेट करें।
  - इनलाइन कुंजी फ़्लैग (उदाहरण के लिए `--openai-api-key`) के लिए वह env var सेट होना आवश्यक है; अन्यथा ऑनबोर्डिंग तुरंत विफल हो जाता है।
  - कस्टम प्रदाताओं के लिए, गैर-इंटरैक्टिव `ref` मोड `models.providers.<id>.apiKey` को `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` के रूप में सहेजता है।
  - उस कस्टम-प्रदाता मामले में, `--custom-api-key` के लिए `CUSTOM_API_KEY` सेट होना आवश्यक है; अन्यथा ऑनबोर्डिंग तुरंत विफल हो जाता है।
- Gateway प्रमाणीकरण क्रेडेंशियल इंटरैक्टिव सेटअप में सादे टेक्स्ट और SecretRef विकल्पों का समर्थन करते हैं:
  - टोकन मोड: **सादा टेक्स्ट टोकन जनरेट/सहेजें** (डिफ़ॉल्ट) या **SecretRef का उपयोग करें**।
  - पासवर्ड मोड: सादा टेक्स्ट या SecretRef।
- गैर-इंटरैक्टिव टोकन SecretRef पथ: `--gateway-token-ref-env <ENV_VAR>`।
- मौजूदा सादे टेक्स्ट सेटअप बिना बदलाव के काम करते रहते हैं।

<Note>
हेडलेस और सर्वर सुझाव: OAuth को ब्राउज़र वाली मशीन पर पूरा करें, फिर
उस एजेंट की `auth-profiles.json` (उदाहरण के लिए
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, या मिलान वाला
`$OPENCLAW_STATE_DIR/...` पथ) को Gateway होस्ट पर कॉपी करें। `credentials/oauth.json`
केवल एक लेगेसी आयात स्रोत है।
</Note>

## आउटपुट और आंतरिक विवरण

`~/.openclaw/openclaw.json` में सामान्य फ़ील्ड:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` जब `--skip-bootstrap` पास किया जाता है
- `agents.defaults.model` / `models.providers` (यदि Minimax चुना गया हो)
- `tools.profile` (अनसेट होने पर स्थानीय ऑनबोर्डिंग डिफ़ॉल्ट रूप से `"coding"` करती है; मौजूदा स्पष्ट मान सुरक्षित रखे जाते हैं)
- `gateway.*` (मोड, bind, auth, tailscale)
- `session.dmScope` (अनसेट होने पर स्थानीय ऑनबोर्डिंग इसे डिफ़ॉल्ट रूप से `per-channel-peer` करती है; मौजूदा स्पष्ट मान सुरक्षित रखे जाते हैं)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- चैनल allowlists (Slack, Discord, Matrix, Microsoft Teams) जब आप प्रॉम्प्ट के दौरान ऑप्ट इन करते हैं (संभव होने पर नाम IDs में रिज़ॉल्व होते हैं)
- `skills.install.nodeManager`
  - `setup --node-manager` फ़्लैग `npm`, `pnpm`, या `bun` स्वीकार करता है।
  - मैनुअल कॉन्फ़िगरेशन बाद में भी `skills.install.nodeManager: "yarn"` सेट कर सकता है।
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` `agents.list[]` और वैकल्पिक `bindings` लिखता है।

WhatsApp क्रेडेंशियल `~/.openclaw/credentials/whatsapp/<accountId>/` के अंतर्गत जाते हैं।
सेशन `~/.openclaw/agents/<agentId>/sessions/` के अंतर्गत संग्रहीत किए जाते हैं।

<Note>
कुछ चैनल Plugins के रूप में दिए जाते हैं। सेटअप के दौरान चुने जाने पर, विज़ार्ड
चैनल कॉन्फ़िगरेशन से पहले Plugin (npm या स्थानीय पथ) इंस्टॉल करने का संकेत देता है।
</Note>

Gateway विज़ार्ड RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

क्लाइंट (macOS ऐप और Control UI) ऑनबोर्डिंग लॉजिक को दोबारा लागू किए बिना चरण रेंडर कर सकते हैं।

Signal सेटअप व्यवहार:

- उपयुक्त रिलीज़ एसेट डाउनलोड करता है
- उसे `~/.openclaw/tools/signal-cli/<version>/` के अंतर्गत सहेजता है
- कॉन्फ़िग में `channels.signal.cliPath` लिखता है
- JVM बिल्ड के लिए Java 21 आवश्यक है
- उपलब्ध होने पर नेटिव बिल्ड उपयोग किए जाते हैं
- Windows WSL2 का उपयोग करता है और WSL के भीतर Linux signal-cli प्रवाह का पालन करता है

## संबंधित दस्तावेज़

- ऑनबोर्डिंग हब: [ऑनबोर्डिंग (CLI)](/hi/start/wizard)
- ऑटोमेशन और स्क्रिप्ट: [CLI ऑटोमेशन](/hi/start/wizard-cli-automation)
- कमांड संदर्भ: [`openclaw onboard`](/hi/cli/onboard)
