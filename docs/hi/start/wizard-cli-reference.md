---
read_when:
    - आपको किसी विशिष्ट `openclaw onboard` चरण के विस्तृत व्यवहार की आवश्यकता है
    - आप ऑनबोर्डिंग परिणामों को डीबग कर रहे हैं या ऑनबोर्डिंग क्लाइंट एकीकृत कर रहे हैं
sidebarTitle: CLI reference
summary: 'openclaw onboard का चरण-दर-चरण व्यवहार: प्रत्येक चरण क्या करता है, कौन-सा कॉन्फ़िगरेशन लिखता है, और आंतरिक कार्यप्रणाली'
title: CLI सेटअप संदर्भ
x-i18n:
    generated_at: "2026-07-16T17:33:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96c1469c6b64f08fd9105c8b737df164d39d27d051bbb9bb4f76b9e1e057785d
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

यह पृष्ठ चरण-दर-चरण ऑनबोर्डिंग व्यवहार, आउटपुट और आंतरिक कार्यप्रणाली को कवर करता है।
मार्गदर्शिका के लिए, [ऑनबोर्डिंग (CLI)](/hi/start/wizard) देखें। संपूर्ण CLI फ़्लैग
संदर्भ (प्रत्येक `--flag`, गैर-इंटरैक्टिव उदाहरण, प्रदाता-विशिष्ट
कमांड) के लिए, [`openclaw onboard`](/hi/cli/onboard) देखें।

## विज़ार्ड क्या करता है

स्थानीय मोड (डिफ़ॉल्ट) आपको इन चरणों से ले जाता है:

- मॉडल और प्रमाणीकरण सेटअप (Anthropic, OpenAI Code सदस्यता OAuth, xAI, OpenCode, कस्टम एंडपॉइंट और प्रदाता के स्वामित्व वाले अन्य प्रमाणीकरण प्रवाह)
- वर्कस्पेस स्थान और बूटस्ट्रैप फ़ाइलें
- Gateway सेटिंग्स (पोर्ट, बाइंड, प्रमाणीकरण, Tailscale)
- चैनल और प्रदाता (Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp और अन्य बंडल किए गए या Plugin चैनल)
- वेब खोज प्रदाता (वैकल्पिक)
- डेमन इंस्टॉलेशन (LaunchAgent, systemd उपयोगकर्ता यूनिट या Startup-folder फ़ॉलबैक वाला मूल Windows Scheduled Task)
- स्वास्थ्य जाँच
- Skills सेटअप

रिमोट मोड इस मशीन को किसी अन्य स्थान के Gateway से कनेक्ट होने के लिए कॉन्फ़िगर करता है। यह
रिमोट होस्ट पर कुछ भी इंस्टॉल या संशोधित नहीं करता।

## स्थानीय प्रवाह का विवरण

<Steps>
  <Step title="मौजूदा कॉन्फ़िगरेशन का पता लगाना">
    - यदि `~/.openclaw/openclaw.json` मौजूद है, तो **वर्तमान मान बनाए रखें**, **समीक्षा करके अपडेट करें** या **सेटअप से पहले रीसेट करें** चुनें।
    - विज़ार्ड को दोबारा चलाने पर कुछ भी नहीं मिटता, जब तक कि आप स्पष्ट रूप से Reset न चुनें (या `--reset` पास न करें)।
    - CLI `--reset` का डिफ़ॉल्ट `config+creds+sessions` है; वर्कस्पेस भी हटाने के लिए `--reset-scope full` का उपयोग करें।
    - यदि कॉन्फ़िगरेशन अमान्य है या उसमें पुराने कुंजी नाम हैं, तो विज़ार्ड रुक जाता है और आगे बढ़ने से पहले आपको `openclaw doctor` चलाने के लिए कहता है।
    - रीसेट स्थिति को Trash में ले जाता है (कभी भी सीधे नहीं मिटाता) और ये दायरे प्रदान करता है:
      - केवल कॉन्फ़िगरेशन
      - कॉन्फ़िगरेशन + क्रेडेंशियल + सत्र
      - पूर्ण रीसेट (वर्कस्पेस भी हटाता है)

  </Step>
  <Step title="मॉडल और प्रमाणीकरण">
    - संपूर्ण विकल्प मैट्रिक्स [प्रमाणीकरण और मॉडल विकल्प](#auth-and-model-options) में है।

  </Step>
  <Step title="वर्कस्पेस">
    - डिफ़ॉल्ट `~/.openclaw/workspace` (कॉन्फ़िगर करने योग्य)।
    - पहली बार बूटस्ट्रैप करने के लिए आवश्यक वर्कस्पेस फ़ाइलें तैयार करता है।
    - वर्कस्पेस लेआउट: [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace)।

  </Step>
  <Step title="Gateway">
    - पोर्ट, बाइंड, प्रमाणीकरण मोड और Tailscale एक्सपोज़र के बारे में पूछता है।
    - अनुशंसित: लूपबैक के लिए भी टोकन प्रमाणीकरण सक्षम रखें, ताकि स्थानीय WS क्लाइंट को प्रमाणीकरण करना पड़े।
    - टोकन मोड में, इंटरैक्टिव सेटअप ये विकल्प प्रदान करता है:
      - **प्लेनटेक्स्ट टोकन जनरेट/संग्रहित करें** (डिफ़ॉल्ट)
      - **SecretRef का उपयोग करें** (वैकल्पिक चयन)
    - पासवर्ड मोड में, इंटरैक्टिव सेटअप प्लेनटेक्स्ट या SecretRef संग्रहण का भी समर्थन करता है।
    - गैर-इंटरैक्टिव टोकन SecretRef पथ: `--gateway-token-ref-env <ENV_VAR>`।
      - ऑनबोर्डिंग प्रक्रिया के परिवेश में एक गैर-रिक्त परिवेश चर आवश्यक है।
      - इसे `--gateway-token` के साथ संयोजित नहीं किया जा सकता।
    - प्रमाणीकरण केवल तभी अक्षम करें, जब आपको प्रत्येक स्थानीय प्रक्रिया पर पूरा भरोसा हो।
    - गैर-लूपबैक बाइंड के लिए अब भी प्रमाणीकरण आवश्यक है।

  </Step>
  <Step title="चैनल">
    - [WhatsApp](/hi/channels/whatsapp): वैकल्पिक QR लॉगिन
    - [Telegram](/hi/channels/telegram): बॉट टोकन
    - [Discord](/hi/channels/discord): बॉट टोकन
    - [Google Chat](/hi/channels/googlechat): सेवा खाता JSON + Webhook ऑडियंस
    - [Mattermost](/hi/channels/mattermost): बॉट टोकन + आधार URL
    - [Signal](/hi/channels/signal): वैकल्पिक `signal-cli` इंस्टॉलेशन + खाता कॉन्फ़िगरेशन
    - [iMessage](/hi/channels/imessage): `imsg` CLI पथ + Messages DB एक्सेस; जब Gateway Mac से अलग किसी मशीन पर चलता हो, तो SSH रैपर का उपयोग करें
    - DM सुरक्षा: डिफ़ॉल्ट पेयरिंग है। पहला DM एक कोड भेजता है; इसके माध्यम से अनुमोदन दें
      `openclaw pairing approve <channel> <code>` या अनुमति-सूचियों का उपयोग करें।
  </Step>
  <Step title="वेब खोज">
    - कोई प्रदाता चुनें (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily) या इसे छोड़ दें।
    - इस चरण को `--skip-search` से छोड़ें; बाद में `openclaw configure --section web` से फिर कॉन्फ़िगर करें।

  </Step>
  <Step title="डेमन इंस्टॉलेशन">
    - macOS: LaunchAgent
      - लॉग-इन उपयोगकर्ता सत्र आवश्यक है; हेडलेस उपयोग के लिए कस्टम LaunchDaemon का उपयोग करें (वितरित नहीं किया जाता)।
    - WSL2 के माध्यम से Linux और Windows: systemd उपयोगकर्ता यूनिट
      - विज़ार्ड `loginctl enable-linger <user>` का प्रयास करता है, ताकि लॉगआउट के बाद भी Gateway चलता रहे।
      - यह sudo के लिए पूछ सकता है (`/var/lib/systemd/linger` लिखता है); पहले यह sudo के बिना प्रयास करता है।
    - मूल Windows: पहले Scheduled Task
      - यदि टास्क बनाने की अनुमति नहीं मिलती, तो OpenClaw प्रति-उपयोगकर्ता Startup-folder लॉगिन आइटम पर फ़ॉलबैक करता है और Gateway को तुरंत शुरू कर देता है।
      - Scheduled Tasks को प्राथमिकता दी जाती है, क्योंकि वे बेहतर सुपरवाइज़र स्थिति प्रदान करते हैं।
    - रनटाइम चयन: Node आवश्यक है, क्योंकि OpenClaw का मानक रनटाइम स्थिति संग्रह `node:sqlite` का उपयोग करता है।

  </Step>
  <Step title="स्वास्थ्य जाँच">
    - Gateway शुरू करता है (यदि आवश्यक हो) और `openclaw health` चलाता है।
    - `openclaw status --deep` स्थिति आउटपुट में लाइव Gateway स्वास्थ्य परीक्षण जोड़ता है, जिसमें समर्थित होने पर चैनल परीक्षण भी शामिल होते हैं।

  </Step>
  <Step title="Skills">
    - उपलब्ध Skills को पढ़ता है और आवश्यकताओं की जाँच करता है।
    - आपको Node मैनेजर चुनने देता है: npm, pnpm या bun।
    - आवश्यक इंस्टॉलर उपलब्ध होने पर विश्वसनीय बंडल किए गए Skills के लिए वैकल्पिक निर्भरताएँ
      इंस्टॉल करता है।
    - अनुपलब्ध Homebrew, uv और Go इंस्टॉलर छोड़ देता है, फिर प्रभावित
      Skills को मैन्युअल सेटअप मार्गदर्शन के साथ समूहित करता है। अनुपलब्ध पूर्वापेक्षाएँ
      इंस्टॉल करने के बाद `openclaw doctor` चलाएँ।

  </Step>
  <Step title="समापन">
    - सारांश और अगले चरण, जिनमें iOS, Android और macOS ऐप विकल्प शामिल हैं।

  </Step>
</Steps>

<Note>
यदि कोई GUI नहीं मिलता, तो विज़ार्ड ब्राउज़र खोलने के बजाय Control UI के लिए SSH पोर्ट-फ़ॉरवर्ड निर्देश प्रिंट करता है।
यदि Control UI एसेट अनुपलब्ध हैं, तो विज़ार्ड उन्हें बिल्ड करने का प्रयास करता है; फ़ॉलबैक `pnpm ui:build` है (UI निर्भरताएँ स्वतः इंस्टॉल करता है)।
</Note>

## रिमोट मोड का विवरण

रिमोट मोड इस मशीन को किसी अन्य स्थान के Gateway से कनेक्ट होने के लिए कॉन्फ़िगर करता है। यह
रिमोट होस्ट पर कुछ भी इंस्टॉल या संशोधित नहीं करता।

आप ये निर्धारित करते हैं:

- रिमोट Gateway URL (`ws://...` या `wss://...`)
- रिमोट Gateway के कॉन्फ़िगरेशन से मेल खाता टोकन, पासवर्ड या बिना प्रमाणीकरण का विकल्प

<Steps>
  <Step title="खोज (वैकल्पिक)">
    यदि `dns-sd` (macOS) या `avahi-browse` (Linux) उपलब्ध है, तो ऑनबोर्डिंग
    मैन्युअल URL प्रविष्टि पर फ़ॉलबैक करने से पहले Bonjour/mDNS Gateway बीकन खोजने
    का विकल्प देती है। कॉन्फ़िगर होने पर वाइड-एरिया DNS-SD खोज का भी प्रयास किया जाता है।
    दस्तावेज़: [Gateway खोज](/hi/gateway/discovery), [Bonjour](/hi/gateway/bonjour)।
  </Step>
  <Step title="कनेक्शन विधि">
    बीकन चुने जाने पर, प्रत्यक्ष WebSocket या SSH टनल चुनें:
    - **प्रत्यक्ष**: `wss://` पर कनेक्ट करता है और खोजे गए
      TLS फ़िंगरप्रिंट पर भरोसा करने के लिए कहता है (पहले उपयोग पर भरोसा पिनिंग; आपके स्वीकार करने पर ही पिन किया जाता है)।
    - **SSH टनल**: पहले चलाने के लिए `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      कमांड प्रिंट करता है, फिर स्थानीय टनल एंडपॉइंट से कनेक्ट करता है।
  </Step>
  <Step title="प्रमाणीकरण">
    टोकन (अनुशंसित), पासवर्ड या बिना प्रमाणीकरण का विकल्प चुनें, फिर वैकल्पिक रूप से इसे
    प्लेनटेक्स्ट के बजाय SecretRef के रूप में संग्रहित करें।
  </Step>
</Steps>

<Note>
यदि Gateway केवल लूपबैक पर है और खोजा नहीं जा सकता, तो SSH टनलिंग या किसी tailnet का मैन्युअल रूप से उपयोग करें।
प्लेनटेक्स्ट `ws://` लूपबैक, निजी IP लिटरल, `.local` और Tailnet `*.ts.net` URL के लिए स्वीकार किया जाता है; अन्य निजी-DNS नामों के लिए `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` आवश्यक है।
</Note>

## प्रमाणीकरण और मॉडल विकल्प

यदि इंटरैक्टिव ऑनबोर्डिंग में प्रदाता सेटअप चरण विफल होता है (उदाहरण के लिए स्थानीय साइन-इन के
बिना CLI पुनः उपयोग विकल्प), तो विज़ार्ड त्रुटि दिखाता है और बाहर निकलने के बजाय प्रदाता चयनकर्ता
पर लौट आता है। स्पष्ट `--auth-choice` रन स्वचालन के लिए अब भी तुरंत विफल होते हैं।

<AccordionGroup>
  <Accordion title="Anthropic API कुंजी">
    यदि `ANTHROPIC_API_KEY` मौजूद है, तो उसका उपयोग करता है; अन्यथा कुंजी माँगता है, फिर डेमन के उपयोग के लिए उसे सहेजता है।
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    इंटरैक्टिव ऑनबोर्डिंग/कॉन्फ़िगरेशन में पसंदीदा स्थानीय पथ; उपलब्ध होने पर मौजूदा Claude CLI साइन-इन का पुनः उपयोग करता है।
  </Accordion>
  <Accordion title="OpenAI Code सदस्यता (OAuth)">
    ब्राउज़र प्रवाह; `code#state` पेस्ट करें।

    बिना प्राथमिक मॉडल वाले नए सेटअप पर, Codex रनटाइम के माध्यम से `agents.defaults.model` को
    `openai/gpt-5.6-sol` पर सेट करता है।

  </Accordion>
  <Accordion title="OpenAI Code सदस्यता (डिवाइस पेयरिंग)">
    अल्पकालिक डिवाइस कोड वाला ब्राउज़र पेयरिंग प्रवाह।

    बिना प्राथमिक मॉडल वाले नए सेटअप पर, Codex रनटाइम के माध्यम से `agents.defaults.model` को
    `openai/gpt-5.6-sol` पर सेट करता है।

  </Accordion>
  <Accordion title="OpenAI API कुंजी">
    यदि `OPENAI_API_KEY` मौजूद है, तो उसका उपयोग करता है; अन्यथा कुंजी माँगता है, फिर क्रेडेंशियल को प्रमाणीकरण प्रोफ़ाइल में संग्रहित करता है।

    बिना प्राथमिक मॉडल वाले नए सेटअप पर, `agents.defaults.model` को
    `openai/gpt-5.6` पर सेट करता है; बिना उपसर्ग वाली प्रत्यक्ष-API मॉडल ID Sol टियर पर रिज़ॉल्व होती है।

    OpenAI को जोड़ने या पुनः प्रमाणित करने पर मौजूदा स्पष्ट प्राथमिक
    मॉडल सुरक्षित रहता है, जिसमें `openai/gpt-5.5` शामिल है। यदि खाता GPT-5.6 उपलब्ध नहीं कराता,
    तो `openai/gpt-5.5` को स्पष्ट रूप से चुनें; OpenClaw इसे चुपचाप डाउनग्रेड नहीं करता।

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    योग्य SuperGrok या X Premium खातों के लिए ब्राउज़र साइन-इन। अधिकांश उपयोगकर्ताओं के लिए यह
    अनुशंसित xAI मार्ग है। OpenClaw, Grok मॉडल, Grok `web_search`, `x_search`, और `code_execution` के लिए
    परिणामी प्रमाणीकरण प्रोफ़ाइल संग्रहीत करता है।
  </Accordion>
  <Accordion title="xAI (Grok) डिवाइस कोड">
    localhost कॉलबैक के बजाय छोटे कोड के साथ दूरस्थ-अनुकूल ब्राउज़र साइन-इन।
    इसका उपयोग SSH, Docker, या VPS होस्ट से करें।
  </Accordion>
  <Accordion title="xAI (Grok) API कुंजी">
    `XAI_API_KEY` के लिए संकेत देता है और xAI को मॉडल प्रदाता के रूप में कॉन्फ़िगर करता है। इसका उपयोग
    तब करें, जब सदस्यता OAuth के बजाय xAI Console API कुंजी चाहिए।
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY` (या `OPENCODE_ZEN_API_KEY`) के लिए संकेत देता है और Zen या Go कैटलॉग चुनने देता है (एक API कुंजी दोनों को कवर करती है)।
    सेटअप URL: [opencode.ai/auth](https://opencode.ai/auth)।
  </Accordion>
  <Accordion title="API कुंजी (सामान्य)">
    कुंजी आपके लिए संग्रहीत करता है।
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` के लिए संकेत देता है।
    अधिक विवरण: [Vercel AI Gateway](/hi/providers/vercel-ai-gateway)।
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    खाता ID, Gateway ID, और `CLOUDFLARE_AI_GATEWAY_API_KEY` के लिए संकेत देता है।
    अधिक विवरण: [Cloudflare AI Gateway](/hi/providers/cloudflare-ai-gateway)।
  </Accordion>
  <Accordion title="MiniMax">
    कॉन्फ़िगरेशन स्वतः लिखा जाता है। होस्टेड डिफ़ॉल्ट `MiniMax-M3` है; API-कुंजी सेटअप
    `minimax/...` का उपयोग करता है, और OAuth सेटअप `minimax-portal/...` का उपयोग करता है।
    अधिक विवरण: [MiniMax](/hi/providers/minimax)।
  </Accordion>
  <Accordion title="StepFun">
    चीन या वैश्विक एंडपॉइंट पर StepFun standard या Step Plan के लिए कॉन्फ़िगरेशन स्वतः लिखा जाता है।
    Standard में वर्तमान में `step-3.5-flash` शामिल है, और Step Plan में `step-3.5-flash-2603` भी शामिल है।
    अधिक विवरण: [StepFun](/hi/providers/stepfun)।
  </Accordion>
  <Accordion title="Synthetic (Anthropic-संगत)">
    `SYNTHETIC_API_KEY` के लिए संकेत देता है।
    अधिक विवरण: [Synthetic](/hi/providers/synthetic)।
  </Accordion>
  <Accordion title="Ollama (क्लाउड और स्थानीय ओपन मॉडल)">
    पहले `Cloud + Local`, `Cloud only`, या `Local only` के लिए संकेत देता है।
    `Cloud only`, `https://ollama.com` के साथ `OLLAMA_API_KEY` का उपयोग करता है।
    होस्ट-समर्थित मोड आधार URL (डिफ़ॉल्ट `http://127.0.0.1:11434`) के लिए संकेत देते हैं, उपलब्ध मॉडल खोजते हैं, और डिफ़ॉल्ट सुझाते हैं।
    `Cloud + Local` यह भी जाँचता है कि वह Ollama होस्ट क्लाउड एक्सेस के लिए साइन इन है या नहीं।
    अधिक विवरण: [Ollama](/hi/providers/ollama)।
  </Accordion>
  <Accordion title="Moonshot और Kimi Coding">
    Moonshot (Kimi K2) और Kimi Coding के कॉन्फ़िगरेशन स्वतः लिखे जाते हैं।
    अधिक विवरण: [Moonshot AI (Kimi + Kimi Coding)](/hi/providers/moonshot)।
  </Accordion>
  <Accordion title="कस्टम प्रदाता">
    OpenAI-संगत, OpenAI Responses-संगत, और Anthropic-संगत एंडपॉइंट के साथ काम करता है।

    इंटरैक्टिव ऑनबोर्डिंग अन्य प्रदाता API कुंजी प्रवाहों जैसे ही API कुंजी भंडारण विकल्पों का समर्थन करती है:
    - **API कुंजी अभी पेस्ट करें** (सादा टेक्स्ट)
    - **सीक्रेट संदर्भ का उपयोग करें** (env संदर्भ या कॉन्फ़िगर किया गया प्रदाता संदर्भ, प्रीफ़्लाइट सत्यापन सहित)

    ऑनबोर्डिंग सामान्य विज़न मॉडल ID (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral, और समान) के लिए छवि समर्थन का अनुमान लगाती है और केवल मॉडल का नाम अज्ञात होने पर पूछती है।

    गैर-इंटरैक्टिव फ़्लैग:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (वैकल्पिक; `CUSTOM_API_KEY` पर फ़ॉलबैक करता है)
    - `--custom-provider-id` (वैकल्पिक)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (वैकल्पिक; डिफ़ॉल्ट `openai`)
    - `--custom-image-input` / `--custom-text-input` (वैकल्पिक; अनुमानित मॉडल इनपुट क्षमता को ओवरराइड करता है)

  </Accordion>
  <Accordion title="छोड़ें">
    प्रमाणीकरण को अकॉन्फ़िगर किया हुआ छोड़ता है।
  </Accordion>
</AccordionGroup>

मॉडल व्यवहार:

- पहचाने गए विकल्पों में से डिफ़ॉल्ट मॉडल चुनें, या प्रदाता और मॉडल मैन्युअल रूप से दर्ज करें।
- जब ऑनबोर्डिंग प्रदाता प्रमाणीकरण विकल्प से शुरू होती है, तो मॉडल चयनकर्ता
  स्वचालित रूप से उस प्रदाता को प्राथमिकता देता है। Volcengine और BytePlus के लिए, यही प्राथमिकता
  उनके कोडिंग-प्लान वेरिएंट (`volcengine-plan/*`,
  `byteplus-plan/*`) से भी मेल खाती है।
- यदि प्राथमिकता-प्राप्त प्रदाता फ़िल्टर खाली होता, तो चयनकर्ता कोई मॉडल न दिखाने के बजाय
  पूरे कैटलॉग पर फ़ॉलबैक करता है।
- विज़ार्ड मॉडल जाँच चलाता है और कॉन्फ़िगर किया गया मॉडल अज्ञात होने या प्रमाणीकरण अनुपस्थित होने पर चेतावनी देता है।

क्रेडेंशियल और प्रोफ़ाइल पथ:

- प्रमाणीकरण प्रोफ़ाइल (API कुंजियाँ + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- लेगेसी OAuth आयात: `~/.openclaw/credentials/oauth.json`

क्रेडेंशियल भंडारण मोड:

- डिफ़ॉल्ट ऑनबोर्डिंग व्यवहार API कुंजियों को प्रमाणीकरण प्रोफ़ाइल में सादे टेक्स्ट मानों के रूप में बनाए रखता है।
- `--secret-input-mode ref` सादे टेक्स्ट कुंजी भंडारण के बजाय संदर्भ मोड सक्षम करता है।
  इंटरैक्टिव सेटअप में, इनमें से कोई भी चुना जा सकता है:
  - एनवायरनमेंट वेरिएबल संदर्भ (उदाहरण के लिए `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - प्रदाता उपनाम + ID के साथ कॉन्फ़िगर किया गया प्रदाता संदर्भ (`file` या `exec`)
- इंटरैक्टिव संदर्भ मोड सहेजने से पहले तेज़ प्रीफ़्लाइट सत्यापन चलाता है।
  - Env संदर्भ: वर्तमान ऑनबोर्डिंग एनवायरनमेंट में वेरिएबल नाम + गैर-रिक्त मान को सत्यापित करता है।
  - प्रदाता संदर्भ: प्रदाता कॉन्फ़िगरेशन को सत्यापित करता है और अनुरोधित ID को हल करता है।
  - यदि प्रीफ़्लाइट विफल होता है, तो ऑनबोर्डिंग त्रुटि दिखाती है और पुनः प्रयास करने देती है।
- गैर-इंटरैक्टिव मोड में, `--secret-input-mode ref` केवल env-समर्थित है।
  - ऑनबोर्डिंग प्रक्रिया के एनवायरनमेंट में प्रदाता env वेरिएबल सेट करें।
  - इनलाइन कुंजी फ़्लैग (उदाहरण के लिए `--openai-api-key`) के लिए वह env वेरिएबल सेट होना आवश्यक है; अन्यथा ऑनबोर्डिंग तुरंत विफल हो जाती है।
  - कस्टम प्रदाताओं के लिए, गैर-इंटरैक्टिव `ref` मोड `models.providers.<id>.apiKey` को `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` के रूप में संग्रहीत करता है।
  - उस कस्टम-प्रदाता स्थिति में, `--custom-api-key` के लिए `CUSTOM_API_KEY` सेट होना आवश्यक है; अन्यथा ऑनबोर्डिंग तुरंत विफल हो जाती है।
- Gateway प्रमाणीकरण क्रेडेंशियल इंटरैक्टिव सेटअप में सादा टेक्स्ट और SecretRef विकल्पों का समर्थन करते हैं:
  - टोकन मोड: **सादा टेक्स्ट टोकन जनरेट/संग्रहीत करें** (डिफ़ॉल्ट) या **SecretRef का उपयोग करें**।
  - पासवर्ड मोड: सादा टेक्स्ट या SecretRef।
- गैर-इंटरैक्टिव टोकन SecretRef पथ: `--gateway-token-ref-env <ENV_VAR>`।
- मौजूदा सादा टेक्स्ट सेटअप बिना किसी बदलाव के काम करते रहते हैं।

<Note>
हेडलेस और सर्वर सुझाव: ब्राउज़र वाली मशीन पर OAuth पूरा करें, फिर
उस एजेंट की `auth-profiles.json` (उदाहरण के लिए
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, या उससे मेल खाता
`$OPENCLAW_STATE_DIR/...` पथ) Gateway होस्ट पर कॉपी करें। `credentials/oauth.json`
केवल एक लेगेसी आयात स्रोत है।
</Note>

## आउटपुट और आंतरिक संरचना

`~/.openclaw/openclaw.json` में सामान्य फ़ील्ड:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, जब `--skip-bootstrap` पास किया जाता है
- `agents.defaults.model` / `models.providers` (यदि Minimax चुना गया हो)
- `tools.profile` (सेट न होने पर स्थानीय ऑनबोर्डिंग डिफ़ॉल्ट रूप से `"coding"` का उपयोग करती है; मौजूदा स्पष्ट मान सुरक्षित रखे जाते हैं)
- `gateway.*` (मोड, बाइंड, प्रमाणीकरण, Tailscale)
- `session.dmScope` (सेट न होने पर स्थानीय ऑनबोर्डिंग इसे डिफ़ॉल्ट रूप से `per-channel-peer` पर सेट करती है; मौजूदा स्पष्ट मान सुरक्षित रखे जाते हैं)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- प्रॉम्प्ट के दौरान ऑप्ट इन करने पर चैनल अनुमति-सूचियाँ (Discord, iMessage, Signal, Slack, Telegram, WhatsApp); Discord और Slack दर्ज किए गए नामों को ID में भी हल करते हैं
- `skills.install.nodeManager`
  - `setup --node-manager` फ़्लैग `npm`, `pnpm`, या `bun` स्वीकार करता है।
  - मैन्युअल कॉन्फ़िगरेशन बाद में भी `skills.install.nodeManager: "yarn"` सेट कर सकता है।
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add`, `agents.list[]` और वैकल्पिक `bindings` लिखता है।

WhatsApp क्रेडेंशियल `~/.openclaw/credentials/whatsapp/<accountId>/` के अंतर्गत रखे जाते हैं।
सक्रिय सत्र और ट्रांसक्रिप्ट
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` में संग्रहीत किए जाते हैं।
`~/.openclaw/agents/<agentId>/sessions/` डायरेक्टरी का उपयोग लेगेसी माइग्रेशन
इनपुट और संग्रह/सहायता आर्टिफ़ैक्ट के लिए किया जाता है।

<Note>
कुछ चैनल plugins के रूप में प्रदान किए जाते हैं। सेटअप के दौरान चुने जाने पर, विज़ार्ड
चैनल कॉन्फ़िगरेशन से पहले plugin (npm या स्थानीय पथ) इंस्टॉल करने के लिए संकेत देता है।
</Note>

## गैर-इंटरैक्टिव सेटअप

`--non-interactive` के लिए `--accept-risk` आवश्यक है (यह स्वीकार करता है कि एजेंट
शक्तिशाली होते हैं और पूर्ण सिस्टम एक्सेस जोखिमपूर्ण है):

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

संपूर्ण फ़्लैग संदर्भ और प्रदाता-विशिष्ट उदाहरण: [`openclaw onboard`](/hi/cli/onboard), [CLI स्वचालन](/hi/start/wizard-cli-automation)।

## Gateway विज़ार्ड RPC

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

क्लाइंट (macOS ऐप और Control UI) ऑनबोर्डिंग लॉजिक को दोबारा लागू किए बिना चरणों को रेंडर कर सकते हैं।

## Signal सेटअप व्यवहार

- आधिकारिक `signal-cli` GitHub रिलीज़ से उपयुक्त रिलीज़ एसेट डाउनलोड करता है (नेटिव बिल्ड, केवल Linux x86-64)
- अन्य प्लेटफ़ॉर्म (macOS, गैर-x64 Linux) पर इसके बजाय Homebrew के माध्यम से इंस्टॉल करता है
- रिलीज़-एसेट इंस्टॉलेशन को `~/.openclaw/tools/signal-cli/<version>/` के अंतर्गत संग्रहीत करता है
- कॉन्फ़िगरेशन में `channels.signal.cliPath` लिखता है
- नेटिव Windows अभी समर्थित नहीं है; Linux इंस्टॉल पथ प्राप्त करने के लिए WSL2 के भीतर ऑनबोर्डिंग चलाएँ

## संबंधित दस्तावेज़

- ऑनबोर्डिंग केंद्र: [ऑनबोर्डिंग (CLI)](/hi/start/wizard)
- स्वचालन और स्क्रिप्ट: [CLI स्वचालन](/hi/start/wizard-cli-automation)
- कमांड संदर्भ: [`openclaw onboard`](/hi/cli/onboard)
