---
read_when:
    - लाइव मॉडल मैट्रिक्स / CLI बैकएंड / ACP / मीडिया-प्रदाता स्मोक परीक्षण चलाना
    - लाइव-टेस्ट क्रेडेंशियल रिज़ॉल्यूशन की डीबगिंग
    - नए प्रदाता-विशिष्ट लाइव परीक्षण को जोड़ना
sidebarTitle: Live tests
summary: 'लाइव (नेटवर्क से संपर्क करने वाले) परीक्षण: मॉडल मैट्रिक्स, CLI बैकएंड, ACP, मीडिया प्रदाता, क्रेडेंशियल्स'
title: 'परीक्षण: लाइव सुइट्स'
x-i18n:
    generated_at: "2026-07-19T09:30:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6b6330c4f17081429d48ff2a47b48b0a0133555c835a17cea5edf5d1f880d91e
    source_path: help/testing-live.md
    workflow: 16
---

त्वरित शुरुआत, QA रनर, यूनिट/इंटीग्रेशन सुइट और Docker प्रवाह के लिए,
[परीक्षण](/hi/help/testing) देखें। यह पृष्ठ **लाइव** (नेटवर्क को स्पर्श करने वाले) परीक्षणों को कवर करता है:
मॉडल मैट्रिक्स, CLI बैकएंड, ACP, मीडिया प्रदाता और क्रेडेंशियल प्रबंधन।

## लाइव परीक्षण बनाम आपका वास्तविक Gateway

लाइव सुइट और तदर्थ स्मोक परीक्षणों को पहले से वास्तविक ट्रैफ़िक संभाल रहे
Gateway (आपके या किसी अन्य ऑपरेटर के) में कभी व्यवधान नहीं डालना चाहिए:

- अपना स्वयं का Gateway उपयोग करें: इन-प्रोसेस Gateway (नीचे परत 2) का उपयोग करें या
  पृथक स्टेट डायरेक्टरी (`OPENCLAW_STATE_DIR=<scratch>`) और किसी
  उपलब्ध पोर्ट के साथ एक डेवलपमेंट इंस्टेंस शुरू करें। जब किसी वास्तविक Gateway पर
  डिफ़ॉल्ट Gateway पोर्ट (18789) चल रहा हो, तो उससे बाइंड न करें।
- इस सत्र में आपके द्वारा शुरू न की गई किसी सेवा पर `openclaw gateway stop`/`restart` (या `launchctl`/`systemctl`/tmux
  समकक्ष) न चलाएँ — वह ऑपरेटर का लाइव इंस्टेंस है। पहले
  स्पष्ट स्वीकृति प्राप्त करें।
- यथार्थपरक डेटा चाहिए? लाइव स्टेट/DB को अपनी डेवलपमेंट स्टेट डायरेक्टरी में कॉपी करें और
  उस कॉपी के विरुद्ध परीक्षण करें। किसी लाइव Gateway के स्टेट के इन-प्लेस माइग्रेशन के लिए भी
  स्पष्ट स्वीकृति आवश्यक है।

## लाइव: स्थानीय स्मोक कमांड

तदर्थ लाइव जाँचों से पहले प्रक्रिया के एनवायरनमेंट में आवश्यक प्रदाता कुंजी
एक्सपोर्ट करें।

सुरक्षित मीडिया स्मोक:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

सुरक्षित वॉइस-कॉल तत्परता स्मोक:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

जब तक `--yes` भी मौजूद न हो, `voicecall smoke` एक ड्राई रन है; `--yes` का उपयोग केवल
तभी करें जब आप वास्तव में कॉल करना चाहते हों। Twilio, Telnyx और Plivo के लिए,
सफल तत्परता जाँच हेतु सार्वजनिक Webhook URL आवश्यक है—स्थानीय/निजी
लूपबैक URL अस्वीकार कर दिए जाते हैं, क्योंकि वे प्रदाता उन तक नहीं पहुँच सकते।

## लाइव: Android Node क्षमता स्वीप

- परीक्षण: `src/gateway/android-node.capabilities.live.test.ts`
- स्क्रिप्ट: `pnpm android:test:integration`
- लक्ष्य: कनेक्ट किए गए Android Node द्वारा **वर्तमान में विज्ञापित प्रत्येक कमांड** का आह्वान करना और कमांड अनुबंध के व्यवहार का अभिकथन करना।
- दायरा:
  - पूर्व-शर्तों सहित/मैन्युअल सेटअप (सुइट ऐप को इंस्टॉल/रन/पेयर नहीं करता)।
  - चयनित Android Node के लिए कमांड-दर-कमांड Gateway `node.invoke` सत्यापन।
- आवश्यक पूर्व-सेटअप:
  - Android ऐप पहले से Gateway से कनेक्ट और पेयर किया हुआ हो।
  - ऐप को फ़ोरग्राउंड में रखा गया हो।
  - जिन क्षमताओं के सफल होने की अपेक्षा है, उनके लिए अनुमतियाँ/कैप्चर सहमति प्रदान की गई हो।
- वैकल्पिक लक्ष्य ओवरराइड:
  - `OPENCLAW_ANDROID_NODE_ID` या `OPENCLAW_ANDROID_NODE_NAME`।
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`।
- Android सेटअप का पूरा विवरण: [Android ऐप](/hi/platforms/android)

## लाइव: मॉडल स्मोक (प्रोफ़ाइल कुंजियाँ)

लाइव मॉडल परीक्षणों को दो परतों में विभाजित किया गया है, ताकि विफलताएँ पृथक रहें:

- "प्रत्यक्ष मॉडल" बताता है कि प्रदाता/मॉडल दी गई कुंजी से कोई उत्तर दे सकता है या नहीं।
- "Gateway स्मोक" बताता है कि उस मॉडल के लिए पूरा Gateway+एजेंट पाइपलाइन काम करता है या नहीं (सत्र, इतिहास, टूल, सैंडबॉक्स नीति आदि)।

नीचे दी गई क्यूरेटेड मॉडल सूचियाँ `src/agents/live-model-filter.ts` में रहती हैं और
समय के साथ बदलती हैं; इस पृष्ठ के बजाय वहाँ की सरणियों को सत्य का स्रोत
मानें।

MiniMax M3 अपने डिफ़ॉल्ट प्रदाता/मॉडल संदर्भ के रूप में `minimax/MiniMax-M3` का उपयोग करता है।

### परत 1: प्रत्यक्ष मॉडल पूर्णता (Gateway के बिना)

- परीक्षण: `src/agents/models.profiles.live.test.ts`
- लक्ष्य:
  - खोजे गए मॉडलों की गणना करना
  - जिन मॉडलों के क्रेडेंशियल आपके पास हैं, उन्हें चुनने के लिए `getApiKeyForModel` का उपयोग करना
  - प्रत्येक मॉडल पर एक छोटी पूर्णता चलाना (और आवश्यकता होने पर लक्षित रिग्रेशन)
- सक्षम करने का तरीका:
  - `pnpm test:live` (या Vitest को सीधे चलाने पर `OPENCLAW_LIVE_TEST=1`)
  - इस सुइट को वास्तव में चलाने के लिए `OPENCLAW_LIVE_MODELS=modern`, `small` या `all` (`modern` का उपनाम) सेट करें; अन्यथा यह छोड़ दिया जाता है, इसलिए केवल `pnpm test:live` Gateway स्मोक पर केंद्रित रहता है।
- मॉडल चुनने का तरीका:
  - `OPENCLAW_LIVE_MODELS=modern` क्यूरेटेड उच्च-सिग्नल प्राथमिकता सूची चलाता है ([लाइव: मॉडल मैट्रिक्स](#live-model-matrix-what-we-cover) देखें)
  - `OPENCLAW_LIVE_MODELS=small` क्यूरेटेड छोटे-मॉडल की प्राथमिकता सूची चलाता है
  - `OPENCLAW_LIVE_MODELS=all`, `modern` का उपनाम है
  - या `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (कॉमा से अलग की गई अनुमति-सूची)
  - स्थानीय Ollama छोटे-मॉडल रन डिफ़ॉल्ट रूप से `http://127.0.0.1:11434` का उपयोग करते हैं; `OPENCLAW_LIVE_OLLAMA_BASE_URL` केवल LAN, कस्टम या Ollama Cloud एंडपॉइंट के लिए सेट करें।
  - आधुनिक/सभी और छोटे स्वीप डिफ़ॉल्ट रूप से अपनी क्यूरेटेड सूची की लंबाई को सीमा मानते हैं; चयनित प्रोफ़ाइल के संपूर्ण स्वीप के लिए `OPENCLAW_LIVE_MAX_MODELS=0` या छोटी सीमा के लिए कोई धनात्मक संख्या सेट करें।
  - संपूर्ण स्वीप पूरे प्रत्यक्ष-मॉडल परीक्षण के टाइमआउट के लिए `OPENCLAW_LIVE_TEST_TIMEOUT_MS` का उपयोग करते हैं। डिफ़ॉल्ट: 60 मिनट।
  - प्रत्यक्ष-मॉडल प्रोब डिफ़ॉल्ट रूप से 20-तरफ़ा समानांतरता के साथ चलते हैं; इसे ओवरराइड करने के लिए `OPENCLAW_LIVE_MODEL_CONCURRENCY` सेट करें।
- प्रदाता चुनने का तरीका:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (कॉमा से अलग की गई अनुमति-सूची)
- कुंजियाँ कहाँ से आती हैं:
  - डिफ़ॉल्ट रूप से: प्रोफ़ाइल स्टोर और एनवायरनमेंट फ़ॉलबैक
  - केवल **प्रोफ़ाइल स्टोर** लागू करने के लिए `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` सेट करें
- इसके होने का कारण:
  - "प्रदाता API खराब है/कुंजी अमान्य है" को "Gateway एजेंट पाइपलाइन खराब है" से अलग करता है
  - इसमें छोटे, पृथक रिग्रेशन शामिल हैं (उदाहरण: OpenAI Responses/Codex Responses रीजनिंग रीप्ले + टूल-कॉल प्रवाह)

### परत 2: Gateway + डेवलपमेंट एजेंट स्मोक ("@openclaw" वास्तव में क्या करता है)

- परीक्षण: `src/gateway/gateway-models.profiles.live.test.ts`
- लक्ष्य:
  - इन-प्रोसेस Gateway शुरू करना
  - एक `agent:dev:*` सत्र बनाना/पैच करना (प्रत्येक रन में मॉडल ओवरराइड)
  - कुंजियों वाले मॉडलों पर पुनरावृत्ति करना और अभिकथन करना:
    - "सार्थक" प्रतिक्रिया (टूल के बिना)
    - वास्तविक टूल आह्वान काम करता है (रीड प्रोब)
    - वैकल्पिक अतिरिक्त टूल प्रोब (एक्ज़ेक+रीड प्रोब)
    - OpenAI रिग्रेशन पथ (केवल टूल-कॉल -> फ़ॉलो-अप) काम करते रहें
- प्रोब विवरण (ताकि आप विफलताओं को शीघ्रता से समझा सकें):
  - `read` प्रोब: परीक्षण वर्कस्पेस में एक नॉन्स फ़ाइल लिखता है और एजेंट से उसे `read` करने तथा नॉन्स को वापस प्रतिध्वनित करने के लिए कहता है।
  - `exec+read` प्रोब: परीक्षण एजेंट से किसी अस्थायी फ़ाइल में नॉन्स को `exec`-राइट करने, फिर उसे वापस `read` करने के लिए कहता है।
  - इमेज प्रोब: परीक्षण जनरेट की गई PNG (बिल्ली + यादृच्छिक कोड) संलग्न करता है और मॉडल से `cat <CODE>` लौटाने की अपेक्षा करता है।
  - कार्यान्वयन संदर्भ: `src/gateway/gateway-models.profiles.live.test.ts` और `test/helpers/live-image-probe.ts`।
- सक्षम करने का तरीका:
  - `pnpm test:live` (या Vitest को सीधे चलाने पर `OPENCLAW_LIVE_TEST=1`)
- मॉडल चुनने का तरीका:
  - डिफ़ॉल्ट: क्यूरेटेड उच्च-सिग्नल (`modern`) प्राथमिकता सूची
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` क्यूरेटेड छोटे-मॉडल सूची को पूर्ण Gateway+एजेंट पाइपलाइन से चलाता है
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, `modern` का उपनाम है
  - या दायरा सीमित करने के लिए `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (या कॉमा सूची) सेट करें
  - आधुनिक/सभी और छोटे Gateway स्वीप डिफ़ॉल्ट रूप से अपनी क्यूरेटेड सूची की लंबाई को सीमा मानते हैं; चयनित संपूर्ण स्वीप के लिए `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` या छोटी सीमा के लिए कोई धनात्मक संख्या सेट करें।
- प्रदाता चुनने का तरीका ("OpenRouter सब कुछ" से बचें):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (कॉमा से अलग की गई अनुमति-सूची)
- इस लाइव परीक्षण में टूल + इमेज प्रोब हमेशा चालू रहते हैं:
  - `read` प्रोब + `exec+read` प्रोब (टूल स्ट्रेस)
  - जब मॉडल इमेज इनपुट समर्थन विज्ञापित करता है, तब इमेज प्रोब चलता है
  - प्रवाह (उच्च स्तर):
    - परीक्षण "CAT" + यादृच्छिक कोड वाली छोटी PNG जनरेट करता है (`test/helpers/live-image-probe.ts`)
    - उसे `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` के माध्यम से भेजता है
    - Gateway संलग्नकों को `images[]` में पार्स करता है (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - एम्बेडेड एजेंट मॉडल को मल्टीमोडल उपयोगकर्ता संदेश अग्रेषित करता है
    - अभिकथन: उत्तर में `cat` + कोड शामिल है (OCR सहनशीलता: छोटी त्रुटियाँ अनुमत हैं)

<Tip>
यह देखने के लिए कि आप अपनी मशीन पर क्या परीक्षण कर सकते हैं (और सटीक `provider/model` आईडी), चलाएँ:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## लाइव: CLI बैकएंड स्मोक (Claude, Gemini या अन्य स्थानीय CLI)

- परीक्षण: `src/gateway/gateway-cli-backend.live.test.ts`
- लक्ष्य: अपने डिफ़ॉल्ट कॉन्फ़िगरेशन को स्पर्श किए बिना, स्थानीय CLI बैकएंड का उपयोग करके Gateway + एजेंट पाइपलाइन को सत्यापित करना।
- बैकएंड-विशिष्ट स्मोक डिफ़ॉल्ट स्वामी Plugin की `cli-backend.ts` परिभाषा के साथ रहते हैं।
- सक्षम करें:
  - `pnpm test:live` (या Vitest को सीधे चलाने पर `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- डिफ़ॉल्ट:
  - डिफ़ॉल्ट प्रदाता/मॉडल: `claude-cli/claude-sonnet-4-6`
  - कमांड/आर्ग्युमेंट/इमेज व्यवहार स्वामी CLI बैकएंड Plugin मेटाडेटा से आते हैं।
- ओवरराइड (वैकल्पिक):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - वास्तविक इमेज संलग्नक भेजने के लिए `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (पथ प्रॉम्प्ट में इंजेक्ट किए जाते हैं)। Docker रेसिपी में डिफ़ॉल्ट रूप से बंद।
  - प्रॉम्प्ट इंजेक्शन के बजाय इमेज फ़ाइल पथों को CLI आर्ग्युमेंट के रूप में पास करने के लिए `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`।
  - `IMAGE_ARG` सेट होने पर इमेज आर्ग्युमेंट कैसे पास किए जाएँ, इसे नियंत्रित करने के लिए `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (या `"list"`)।
  - दूसरा टर्न भेजने और रिज़्यूम प्रवाह सत्यापित करने के लिए `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`।
  - जब चयनित मॉडल स्विच लक्ष्य का समर्थन करता हो, तब Claude Sonnet -> Opus समान-सत्र निरंतरता प्रोब चुनने के लिए `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`। Docker रेसिपी सहित डिफ़ॉल्ट रूप से बंद।
  - MCP/टूल लूपबैक प्रोब चुनने के लिए `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`। Docker रेसिपी में डिफ़ॉल्ट रूप से बंद।

उदाहरण:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

किफ़ायती Gemini MCP कॉन्फ़िगरेशन स्मोक:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

यह Gemini से प्रतिक्रिया जनरेट करने के लिए नहीं कहता। यह वही सिस्टम
सेटिंग लिखता है जो OpenClaw, Gemini को देता है, फिर यह सिद्ध करने के लिए `gemini --debug mcp list` चलाता है कि
सहेजे गए `transport: "streamable-http"` सर्वर को Gemini के HTTP MCP
आकार में सामान्यीकृत किया जाता है और वह स्थानीय स्ट्रीम-योग्य HTTP MCP सर्वर से कनेक्ट हो सकता है।

Docker रेसिपी:

```bash
pnpm test:docker:live-cli-backend
```

एकल-प्रदाता Docker रेसिपी:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

टिप्पणियाँ:

- Docker रनर `scripts/test-live-cli-backend-docker.sh` पर स्थित है।
- यह रेपो Docker इमेज के भीतर गैर-रूट `node` उपयोगकर्ता के रूप में लाइव CLI-बैकएंड स्मोक चलाता है।
- यह स्वामी Plugin से CLI स्मोक मेटाडेटा का समाधान करता है, फिर मेल खाने वाले Linux CLI पैकेज (`@anthropic-ai/claude-code` या `@google/gemini-cli`) को `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (डिफ़ॉल्ट: `~/.cache/openclaw/docker-cli-tools`) पर कैश किए गए, लिखने योग्य प्रीफ़िक्स में इंस्टॉल करता है।
- `codex-cli` अब बंडल किया गया CLI बैकएंड नहीं है; इसके बजाय Codex app-server रनटाइम के साथ `openai/*` का उपयोग करें ([लाइव: Codex app-server हार्नेस स्मोक](#live-codex-app-server-harness-smoke) देखें)।
- `pnpm test:docker:live-cli-backend:claude-subscription` को या तो `claudeAiOauth.subscriptionType` के साथ `~/.claude/.credentials.json` या `claude setup-token` से `CLAUDE_CODE_OAUTH_TOKEN` के माध्यम से पोर्टेबल Claude Code सब्सक्रिप्शन OAuth की आवश्यकता होती है। यह पहले Docker में प्रत्यक्ष `claude -p` को प्रमाणित करता है, फिर Anthropic API-कुंजी एनवायरनमेंट वेरिएबल संरक्षित किए बिना दो Gateway CLI-बैकएंड टर्न चलाता है। यह सब्सक्रिप्शन लेन डिफ़ॉल्ट रूप से Claude MCP/टूल और इमेज प्रोब अक्षम करती है, क्योंकि यह साइन-इन किए गए सब्सक्रिप्शन की उपयोग सीमाओं का उपभोग करती है और Anthropic किसी OpenClaw रिलीज़ के बिना Claude Agent SDK / `claude -p` की बिलिंग और दर-सीमा व्यवहार बदल सकता है।
- Claude और Gemini ऊपर दिए गए फ़्लैग के माध्यम से समान प्रोब सेट (टेक्स्ट टर्न, इमेज वर्गीकरण, MCP `cron` टूल कॉल, मॉडल-स्विच निरंतरता) का समर्थन करते हैं, लेकिन इनमें से कोई भी प्रोब डिफ़ॉल्ट रूप से नहीं चलता—आवश्यकतानुसार प्रत्येक फ़्लैग से इसे चालू करें।

## लाइव: APNs HTTP/2 प्रॉक्सी पहुँच-योग्यता

- परीक्षण: `src/infra/push-apns-http2.live.test.ts`
- लक्ष्य: स्थानीय HTTP CONNECT प्रॉक्सी के माध्यम से Apple के सैंडबॉक्स APNs एंडपॉइंट तक टनल बनाना, APNs HTTP/2 सत्यापन अनुरोध भेजना और यह दावा करना कि Apple की वास्तविक `403 InvalidProviderToken` प्रतिक्रिया प्रॉक्सी पथ से वापस आती है।
- सक्षम करें:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- वैकल्पिक टाइमआउट:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## लाइव: ACP बाइंड स्मोक (`/acp spawn ... --bind here`)

- परीक्षण: `src/gateway/gateway-acp-bind.live.test.ts`
- लक्ष्य: लाइव ACP एजेंट के साथ वास्तविक ACP वार्तालाप-बाइंड प्रवाह को सत्यापित करना:
  - `/acp spawn <agent> --bind here` भेजना
  - किसी कृत्रिम संदेश-चैनल वार्तालाप को उसी स्थान पर बाइंड करना
  - उसी वार्तालाप पर सामान्य अनुवर्ती संदेश भेजना
  - सत्यापित करना कि अनुवर्ती संदेश बाइंड किए गए ACP सत्र ट्रांसक्रिप्ट में पहुँचा है
- सक्षम करें:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- डिफ़ॉल्ट:
  - Docker में ACP एजेंट: `claude,codex,gemini`
  - प्रत्यक्ष `pnpm test:live ...` के लिए ACP एजेंट: `claude`
  - कृत्रिम चैनल: Slack DM-शैली का वार्तालाप संदर्भ
  - ACP बैकएंड: `acpx`
- ओवरराइड:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - इमेज प्रोब को चालू करने के लिए `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (या `on`/`true`/`yes`); कोई भी अन्य मान इसे बंद कर देता है। `opencode` को छोड़कर प्रत्येक एजेंट के लिए यह डिफ़ॉल्ट रूप से चलता है।
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- टिप्पणियाँ:
  - यह लेन केवल-एडमिन कृत्रिम उद्गम-रूट फ़ील्ड के साथ Gateway `chat.send` सतह का उपयोग करती है, ताकि परीक्षण बाहरी डिलीवरी का दिखावा किए बिना संदेश-चैनल संदर्भ संलग्न कर सकें।
  - जब `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` सेट नहीं होता, तो परीक्षण चयनित ACP हार्नेस एजेंट के लिए एम्बेडेड `acpx` Plugin की अंतर्निर्मित एजेंट रजिस्ट्री का उपयोग करता है।
  - बाइंड किए गए सत्र में Cron MCP निर्माण डिफ़ॉल्ट रूप से सर्वोत्तम-प्रयास है, क्योंकि बाहरी ACP हार्नेस बाइंड/इमेज प्रमाण सफल होने के बाद MCP कॉल रद्द कर सकते हैं; बाइंड के बाद के उस Cron प्रोब को सख्त बनाने के लिए `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` सेट करें।

उदाहरण:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker विधि:

```bash
pnpm test:docker:live-acp-bind
```

एकल-एजेंट Docker विधियाँ:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker टिप्पणियाँ:

- Docker रनर `scripts/test-live-acp-bind-docker.sh` पर स्थित है।
- डिफ़ॉल्ट रूप से, यह समेकित लाइव CLI एजेंटों के विरुद्ध क्रम से ACP बाइंड स्मोक चलाता है: `claude`, `codex`, फिर `gemini`।
- मैट्रिक्स को सीमित करने के लिए `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, या `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` का उपयोग करें।
- यह मेल खाने वाली CLI प्रमाणीकरण सामग्री को कंटेनर में स्टेज करता है, फिर अनुपस्थित होने पर अनुरोधित लाइव CLI (`@anthropic-ai/claude-code`, `@openai/codex`, `https://app.factory.ai/cli` के माध्यम से Factory Droid, `@google/gemini-cli`, या `opencode-ai`) इंस्टॉल करता है। ACP बैकएंड स्वयं आधिकारिक `acpx` Plugin का एम्बेडेड `acpx/runtime` पैकेज है।
- Droid Docker वैरिएंट सेटिंग्स के लिए `~/.factory` को स्टेज करता है, `FACTORY_API_KEY` को अग्रेषित करता है और उस API कुंजी की आवश्यकता रखता है, क्योंकि स्थानीय Factory OAuth/कीरिंग प्रमाणीकरण कंटेनर में पोर्टेबल नहीं है। यह ACPX की अंतर्निर्मित `droid exec --output-format acp` रजिस्ट्री प्रविष्टि का उपयोग करता है।
- OpenCode Docker वैरिएंट एक सख्त एकल-एजेंट रिग्रेशन लेन है। यह `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (डिफ़ॉल्ट `opencode/kimi-k2.6`) से एक अस्थायी `OPENCODE_CONFIG_CONTENT` डिफ़ॉल्ट मॉडल लिखता है।
- प्रत्यक्ष `acpx` CLI कॉल केवल Gateway के बाहर व्यवहार की तुलना करने के लिए मैन्युअल/वैकल्पिक उपाय वाला पथ हैं। Docker ACP बाइंड स्मोक OpenClaw के एम्बेडेड `acpx` रनटाइम बैकएंड का परीक्षण करता है।

## लाइव: Codex app-server हार्नेस स्मोक

- लक्ष्य: सामान्य Gateway
  `agent` विधि के माध्यम से Plugin-स्वामित्व वाले Codex हार्नेस को सत्यापित करना:
  - बंडल किया गया `codex` Plugin लोड करना
  - `/model <ref> --runtime codex` के माध्यम से OpenAI मॉडल चुनना
  - अनुरोधित चिंतन स्तर के साथ पहला Gateway एजेंट टर्न भेजना
  - उसी OpenClaw सत्र में दूसरा टर्न भेजना और सत्यापित करना कि app-server
    थ्रेड फिर से शुरू हो सकता है
  - उसी Gateway कमांड
    पथ के माध्यम से `/codex status` और `/codex models` चलाना
  - वैकल्पिक रूप से Guardian द्वारा समीक्षित, उन्नत विशेषाधिकार वाले दो शेल प्रोब चलाना: एक निरापद
    कमांड जिसे स्वीकृत किया जाना चाहिए और एक नकली-सीक्रेट अपलोड जिसे
    अस्वीकार किया जाना चाहिए, ताकि एजेंट वापस पूछे
- परीक्षण: `src/gateway/gateway-codex-harness.live.test.ts`
- सक्षम करें: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- हार्नेस आधारभूत मॉडल: `openai/gpt-5.6-luna`
- नई OpenAI API-कुंजी चयन का डिफ़ॉल्ट: `openai/gpt-5.6`
- डिफ़ॉल्ट चिंतन: `low`
- मॉडल ओवरराइड: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- चिंतन ओवरराइड: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- गैर-डिफ़ॉल्ट मॉडल प्रयास अभिकथन:
  `OPENCLAW_LIVE_CODEX_HARNESS_EXPECTED_EFFORT=<level>`
- मैट्रिक्स ओवरराइड: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- प्रमाणीकरण मोड: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (डिफ़ॉल्ट) कॉपी किए गए
  Codex लॉगिन का उपयोग करता है; `api-key`, Codex app-server के माध्यम से `OPENAI_API_KEY` का उपयोग करता है।
- वैकल्पिक इमेज प्रोब: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- वैकल्पिक MCP/टूल प्रोब: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- वैकल्पिक Guardian प्रोब: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- वैकल्पिक पुनरारंभ तनाव: `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1`
  चार इतिहास टर्न जोड़ता है, फिर समान नेटिव थ्रेड आईडी और वार्तालाप
  इतिहास की आवश्यकता रखते हुए Gateway और Codex app-server को
  तीन बार बंद करके पुनरारंभ करता है। सीमित गणनाओं को
  `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_HISTORY_TURNS` (1-20) और
  `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_RESTARTS` (1-10) से ओवरराइड करें।
- वैकल्पिक फैन-आउट तनाव: `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1`
  और `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_COUNT` (1-12) सेट करें। हार्नेस
  प्रत्येक चाइल्ड को समवर्ती रूप से शुरू करता है, प्रत्येक अंतिम रन की प्रतीक्षा करता है और प्रत्येक
  अद्वितीय चाइल्ड उत्तर तथा नेटिव थ्रेड पहचान को सत्यापित करता है।
- वैकल्पिक Compaction तनाव: `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS=1`
  सीमित नेटिव टूल आउटपुट उत्पन्न करता है, स्वचालित Compaction इवेंट की आवश्यकता रखता है,
  स्थायी Compaction गणना और छिपे-मार्कर की पुनःस्मृति को सत्यापित करता है,
  Gateway और भौतिक Codex app-server को पुनरारंभ करता है, फिर आउटपुट और
  Compaction तरंग दोहराता है। सीमित कार्य को
  `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS_TURNS` (1-8) और
  `OPENCLAW_LIVE_CODEX_HARNESS_LARGE_OUTPUT_BYTES` (100000-1000000) से समायोजित करें।
- वैकल्पिक लूप-रिले ऑप्ट-आउट प्रोब:
  `OPENCLAW_LIVE_CODEX_HARNESS_DISABLE_LOOP_RELAY=1`
- अनुरोधित चिंतन प्राथमिकता उस मॉडल के लिए Codex द्वारा घोषित निकटतम प्रयास से मैप हो सकती है।
  उदाहरण के लिए, Luna `minimal` को `low` से मैप करता है।
- ज्ञात Codex कैटलॉग मॉडल वही सटीक नेटिव प्रयास स्वचालित रूप से प्राप्त करते हैं।
  अज्ञात मॉडल ओवरराइड में अपेक्षित मैप किया गया प्रयास बताया जाना आवश्यक है।
- यह स्मोक प्रदाता/मॉडल `agentRuntime.id: "codex"` को बाध्य करता है, ताकि खराब Codex
  हार्नेस चुपचाप OpenClaw पर फ़ॉलबैक होकर सफल न हो सके।
- प्रमाणीकरण: स्थानीय Codex सब्सक्रिप्शन लॉगिन से Codex app-server प्रमाणीकरण, या
  `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key` होने पर `OPENAI_API_KEY`। Docker सब्सक्रिप्शन रन के लिए
  `~/.codex/auth.json` और `~/.codex/config.toml` कॉपी कर सकता है।

स्थानीय विधि:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker विधि:

```bash
pnpm test:docker:live-codex-harness
```

पुनरारंभ और इतिहास तनाव:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1 \
pnpm test:docker:live-codex-harness
```

फैन-आउट, बड़ा आउटपुट, Compaction और पुनरारंभ तनाव:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_COUNT=8 \
  OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS=1 \
  pnpm test:docker:live-codex-harness
```

GPT-5.6 नेटिव Codex मैट्रिक्स:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

नई OpenAI API-कुंजी का डिफ़ॉल्ट:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

यह प्रमाण `OPENCLAW_LIVE_GATEWAY_MODELS` को सेट नहीं करता, नई ऑनबोर्डिंग अनुमान-चयन सीम के माध्यम से
मॉडल का समाधान करता है, `openai/gpt-5.6` का दावा करता है और फिर
उस समाधान किए गए मॉडल के साथ वास्तविक Gateway टर्न चलाता है।

GPT-5.6 एम्बेडेड OpenClaw मैट्रिक्स:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Docker टिप्पणियाँ:

- Docker रनर `scripts/test-live-codex-harness-docker.sh` पर स्थित है।
- यह `OPENAI_API_KEY` पास करता है, उपलब्ध होने पर Codex CLI प्रमाणीकरण फ़ाइलों को कॉपी करता है, लिखने योग्य माउंट किए गए npm
  प्रीफ़िक्स में `@openai/codex` इंस्टॉल करता है,
  स्रोत ट्री को स्टेज करता है, फिर केवल Codex-हार्नेस लाइव परीक्षण चलाता है।
- Docker डिफ़ॉल्ट रूप से इमेज, MCP/टूल और Guardian प्रोब सक्षम करता है। जब आपको अधिक सीमित डीबग
  रन चाहिए, तो `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` या
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` या
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` सेट करें।
- Docker उसी स्पष्ट Codex रनटाइम कॉन्फ़िगरेशन का उपयोग करता है, इसलिए पुराने उपनाम या OpenClaw
  फ़ॉलबैक Codex हार्नेस रिग्रेशन को छिपा नहीं सकते।
- Matrix लक्ष्य एक कंटेनर में क्रमिक रूप से चलते हैं। Docker स्क्रिप्ट अपने
  डिफ़ॉल्ट 35-मिनट के टाइमआउट को लक्ष्यों की संख्या के अनुसार बढ़ाती है; किसी भी बाहरी शेल या CI टाइमआउट में
  उतना ही कुल समय उपलब्ध होना चाहिए। कैनॉनिकल CI प्रत्येक GPT-5.6 लक्ष्य को अलग शार्ड में रखता है।

### अनुशंसित लाइव विधियाँ

सीमित, स्पष्ट अनुमत-सूचियाँ सबसे तेज़ और सबसे कम अस्थिर होती हैं:

- एकल मॉडल, प्रत्यक्ष (Gateway के बिना):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- छोटे मॉडल की प्रत्यक्ष प्रोफ़ाइल:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- छोटे मॉडल की Gateway प्रोफ़ाइल:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API स्मोक:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- एकल मॉडल, Gateway स्मोक:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- कई प्रदाताओं में टूल कॉलिंग:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 प्रत्यक्ष स्मोक:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google-केंद्रित (Gemini API कुंजी + Antigravity):
  - Gemini (API कुंजी): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google अनुकूली चिंतन स्मोक (निजी QA CLI से `qa manual` — इसके लिए `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` और स्रोत चेकआउट आवश्यक हैं; [QA अवलोकन](/hi/concepts/qa-e2e-automation) देखें):
  - Gemini 3 डायनेमिक डिफ़ॉल्ट: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 डायनेमिक बजट: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

टिप्पणियाँ:

- `google/...` Gemini API (API कुंजी) का उपयोग करता है।
- `google-antigravity/...` Antigravity OAuth ब्रिज (Cloud Code Assist-शैली एजेंट एंडपॉइंट) का उपयोग करता है।
- `google-gemini-cli/...` आपकी मशीन पर स्थानीय Gemini CLI का उपयोग करता है (अलग प्रमाणीकरण + टूलिंग की विशिष्टताएँ)।
- Gemini API बनाम Gemini CLI:
  - API: OpenClaw HTTP के माध्यम से Google की होस्ट की गई Gemini API को कॉल करता है (API कुंजी / प्रोफ़ाइल प्रमाणीकरण); अधिकांश उपयोगकर्ता "Gemini" से यही समझते हैं।
  - CLI: OpenClaw स्थानीय `gemini` बाइनरी को शेल के माध्यम से चलाता है; इसका अपना प्रमाणीकरण होता है और यह अलग ढंग से व्यवहार कर सकता है (स्ट्रीमिंग/टूल समर्थन/संस्करण असंगति)।

## लाइव: मॉडल मैट्रिक्स (हम क्या कवर करते हैं)

लाइव वैकल्पिक रूप से सक्षम किया जाता है, इसलिए कोई निश्चित "CI मॉडल सूची" नहीं है। `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (और उनका `all` उपनाम) `src/agents/live-model-filter.ts` में `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` से चुनी गई प्राथमिकता सूची को इस प्राथमिकता क्रम में चलाते हैं:

| प्रदाता/मॉडल                                  | टिप्पणियाँ |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k3`                            |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

`SMALL_LIVE_MODEL_PRIORITY` से चुनी गई **छोटे मॉडल** की सूची (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`):

| प्रदाता/मॉडल                 |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

आधुनिक सूची पर टिप्पणियाँ:

- `codex` और `codex-cli` प्रदाताओं को डिफ़ॉल्ट आधुनिक स्वीप से बाहर रखा गया है (वे CLI-बैकएंड/ACP व्यवहार को कवर करते हैं, जिसका ऊपर अलग से परीक्षण किया गया है)। `openai/gpt-5.5` स्वयं डिफ़ॉल्ट रूप से Codex ऐप-सर्वर हार्नेस के माध्यम से रूट होता है; [लाइव: Codex ऐप-सर्वर हार्नेस स्मोक](#live-codex-app-server-harness-smoke) देखें।
- `fireworks`, `google`, `openrouter`, और `xai` आधुनिक स्वीप में केवल उनके स्पष्ट रूप से चुने गए मॉडल आईडी चलाते हैं (स्वचालित रूप से "इस प्रदाता का प्रत्येक मॉडल" विस्तार नहीं होता)।
- इमेज प्रोब का परीक्षण करने के लिए `OPENCLAW_LIVE_GATEWAY_MODELS` में कम-से-कम एक इमेज-सक्षम मॉडल (Claude/Gemini/OpenAI-परिवार के विज़न वेरिएंट आदि) शामिल करें।

हाथ से चुने गए विभिन्न प्रदाताओं के समूह में टूल + इमेज के साथ Gateway स्मोक चलाएँ:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

चुनी गई सूचियों के बाहर वैकल्पिक अतिरिक्त कवरेज (हो तो अच्छा है; आपके द्वारा सक्षम कोई "टूल"-सक्षम मॉडल चुनें):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (यदि आपके पास पहुँच है)
- LM Studio: `lmstudio/...` (स्थानीय; टूल कॉलिंग API मोड पर निर्भर करती है)

### एग्रीगेटर / वैकल्पिक Gateway

यदि आपकी कुंजियाँ सक्षम हैं, तो आप इनके माध्यम से भी परीक्षण कर सकते हैं:

- OpenRouter: `openrouter/...` (सैकड़ों मॉडल; टूल+इमेज-सक्षम उम्मीदवार खोजने के लिए `openclaw models scan` का उपयोग करें)
- OpenCode: Zen के लिए `opencode/...` और Go के लिए `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` के माध्यम से प्रमाणीकरण)

लाइव मैट्रिक्स में शामिल किए जा सकने वाले अन्य प्रदाता (यदि आपके पास क्रेडेंशियल/कॉन्फ़िगरेशन हैं):

- अंतर्निहित: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- `models.providers` के माध्यम से (कस्टम एंडपॉइंट): `minimax` (क्लाउड/API), साथ ही कोई भी OpenAI/Anthropic-संगत प्रॉक्सी (LM Studio, vLLM, LiteLLM आदि)

<Tip>
दस्तावेज़ों में "सभी मॉडल" हार्डकोड न करें। प्रामाणिक सूची वह है जो आपकी मशीन पर `discoverModels(...)` लौटाता है और जिन कुंजियों की उपलब्धता है।
</Tip>

## क्रेडेंशियल (कभी कमिट न करें)

लाइव परीक्षण क्रेडेंशियल उसी तरह खोजते हैं जैसे CLI खोजता है। व्यावहारिक प्रभाव:

- यदि CLI काम करता है, तो लाइव परीक्षणों को भी वही कुंजियाँ मिलनी चाहिए।
- यदि लाइव परीक्षण "कोई क्रेडेंशियल नहीं" कहता है, तो उसी तरह डीबग करें जैसे आप `openclaw models list` / मॉडल चयन को डीबग करेंगे।

- प्रति-एजेंट प्रमाणीकरण प्रोफ़ाइल: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (लाइव परीक्षणों में "प्रोफ़ाइल कुंजियाँ" का यही अर्थ है)
- कॉन्फ़िगरेशन: `~/.openclaw/openclaw.json` (या `OPENCLAW_CONFIG_PATH`)
- पुरानी OAuth डायरेक्टरी: `~/.openclaw/credentials/` (उपलब्ध होने पर स्टेज किए गए लाइव होम में कॉपी की जाती है, लेकिन यह मुख्य प्रोफ़ाइल-कुंजी स्टोर नहीं है)
- स्थानीय लाइव रन सक्रिय कॉन्फ़िगरेशन (`agents.*.workspace` / `agentDir` ओवरराइड हटाकर) और प्रत्येक एजेंट की `auth-profiles.json` कॉपी करते हैं—उस एजेंट की शेष डायरेक्टरी नहीं, इसलिए `workspace/` और `sandboxes/` डेटा कभी भी स्टेज किए गए होम तक नहीं पहुँचता—साथ ही पुरानी `credentials/` डायरेक्टरी और समर्थित बाहरी CLI प्रमाणीकरण फ़ाइलों/डायरेक्टरियों (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) को एक अस्थायी परीक्षण होम में कॉपी करते हैं।

यदि आप एन्वायरनमेंट कुंजियों पर निर्भर रहना चाहते हैं, तो उन्हें स्थानीय परीक्षणों से पहले एक्सपोर्ट करें या नीचे दिए गए
Docker रनर का स्पष्ट `OPENCLAW_PROFILE_FILE` के साथ उपयोग करें।

## Deepgram लाइव (ऑडियो ट्रांसक्रिप्शन)

- परीक्षण: `extensions/deepgram/audio.live.test.ts`
- सक्षम करें: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus कोडिंग प्लान लाइव

- परीक्षण: `extensions/byteplus/live.test.ts`
- सक्षम करें: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- वैकल्पिक मॉडल ओवरराइड: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI वर्कफ़्लो मीडिया लाइव

- परीक्षण: `extensions/comfy/comfy.live.test.ts`
- सक्षम करें: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- दायरा:
  - बंडल किए गए comfy इमेज, वीडियो और `music_generate` पथों का परीक्षण करता है
  - जब तक `plugins.entries.comfy.config.<capability>` कॉन्फ़िगर न हो, प्रत्येक क्षमता को छोड़ देता है
  - comfy वर्कफ़्लो सबमिशन, पोलिंग, डाउनलोड या Plugin पंजीकरण बदलने के बाद उपयोगी है

## इमेज जनरेशन लाइव

- परीक्षण: `test/image-generation.runtime.live.test.ts`
- कमांड: `pnpm test:live test/image-generation.runtime.live.test.ts`
- हार्नेस: `pnpm test:live:media image`
- दायरा:
  - प्रत्येक पंजीकृत इमेज-जनरेशन प्रदाता Plugin को सूचीबद्ध करता है
  - प्रोब करने से पहले पहले से एक्सपोर्ट किए गए प्रदाता एन्वायरनमेंट वेरिएबल का उपयोग करता है
  - डिफ़ॉल्ट रूप से संग्रहीत प्रमाणीकरण प्रोफ़ाइल से पहले लाइव/एन्वायरनमेंट API कुंजियों का उपयोग करता है, ताकि `auth-profiles.json` में पुरानी परीक्षण कुंजियाँ वास्तविक शेल क्रेडेंशियल को न छिपाएँ
  - उपयोग योग्य प्रमाणीकरण/प्रोफ़ाइल/मॉडल के बिना प्रदाताओं को छोड़ देता है
  - प्रत्येक कॉन्फ़िगर किए गए प्रदाता को साझा इमेज-जनरेशन रनटाइम के माध्यम से चलाता है:
    - `<provider>:generate`
    - जब प्रदाता संपादन समर्थन घोषित करता है, तब `<provider>:edit`
- कवर किए गए मौजूदा बंडल प्रदाता:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- वैकल्पिक सीमितकरण:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- वैकल्पिक प्रमाणीकरण व्यवहार:
  - प्रोफ़ाइल-स्टोर प्रमाणीकरण को बाध्य करने और केवल एन्वायरनमेंट वाले ओवरराइड को अनदेखा करने के लिए `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

शिप किए गए CLI पथ के लिए, प्रदाता/रनटाइम लाइव परीक्षण पास होने के बाद एक `infer` स्मोक
जोड़ें:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image \
  --prompt "साधारण सपाट परीक्षण इमेज: सफ़ेद पृष्ठभूमि पर एक नीला वर्ग, कोई टेक्स्ट नहीं।" \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

यह CLI आर्ग्युमेंट पार्सिंग, कॉन्फ़िगरेशन/डिफ़ॉल्ट-एजेंट रिज़ॉल्यूशन, बंडल किए गए
Plugin सक्रियण, साझा इमेज-जनरेशन रनटाइम और लाइव प्रदाता
अनुरोध को कवर करता है। रनटाइम लोड होने से पहले Plugin निर्भरताओं का उपस्थित होना अपेक्षित है।

## संगीत जनरेशन लाइव

- परीक्षण: `extensions/music-generation-providers.live.test.ts`
- सक्षम करें: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- हार्नेस: `pnpm test:live:media music`
- दायरा:
  - साझा बंडल किए गए संगीत-जनरेशन प्रदाता पथ का परीक्षण करता है
  - वर्तमान में `fal`, `google`, `minimax`, और `openrouter` को कवर करता है
  - जाँच करने से पहले पहले से निर्यात किए गए प्रदाता एनवायरनमेंट वेरिएबल का उपयोग करता है
  - डिफ़ॉल्ट रूप से संग्रहीत प्रमाणीकरण प्रोफ़ाइल से पहले लाइव/एनवायरनमेंट API कुंजियों का उपयोग करता है, ताकि `auth-profiles.json` में पुरानी परीक्षण कुंजियाँ वास्तविक शेल क्रेडेंशियल को न छिपाएँ
  - उपयोग योग्य प्रमाणीकरण/प्रोफ़ाइल/मॉडल न रखने वाले प्रदाताओं को छोड़ देता है
  - उपलब्ध होने पर घोषित दोनों रनटाइम मोड चलाता है:
    - `generate` केवल प्रॉम्प्ट इनपुट के साथ
    - `edit` जब प्रदाता `capabilities.edit.enabled` घोषित करता है
  - `comfy` की अपनी अलग लाइव फ़ाइल है, यह साझा स्वीप नहीं
- वैकल्पिक सीमितकरण:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- वैकल्पिक प्रमाणीकरण व्यवहार:
  - प्रोफ़ाइल-स्टोर प्रमाणीकरण को बाध्य करने और केवल एनवायरनमेंट वाले ओवरराइड अनदेखे करने के लिए `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## वीडियो जनरेशन लाइव

- परीक्षण: `extensions/video-generation-providers.live.test.ts`
- सक्षम करें: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- हार्नेस: `pnpm test:live:media video`
- दायरा:
  - `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai` में साझा बंडल किए गए वीडियो-जनरेशन प्रदाता पथ का परीक्षण करता है
  - डिफ़ॉल्ट रूप से रिलीज़-सुरक्षित स्मोक पथ का उपयोग करता है: प्रति प्रदाता एक टेक्स्ट-टू-वीडियो अनुरोध, एक-सेकंड का लॉबस्टर प्रॉम्प्ट, और `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` से प्रति-प्रदाता ऑपरेशन सीमा (डिफ़ॉल्ट रूप से `180000`)
  - डिफ़ॉल्ट रूप से FAL को छोड़ देता है क्योंकि प्रदाता-पक्ष की कतार विलंबता रिलीज़ समय पर हावी हो सकती है; इसे स्पष्ट रूप से चलाने के लिए `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` पास करें (या स्किप सूची साफ़ करें)
  - जाँच करने से पहले पहले से निर्यात किए गए प्रदाता एनवायरनमेंट वेरिएबल का उपयोग करता है
  - डिफ़ॉल्ट रूप से संग्रहीत प्रमाणीकरण प्रोफ़ाइल से पहले लाइव/एनवायरनमेंट API कुंजियों का उपयोग करता है, ताकि `auth-profiles.json` में पुरानी परीक्षण कुंजियाँ वास्तविक शेल क्रेडेंशियल को न छिपाएँ
  - उपयोग योग्य प्रमाणीकरण/प्रोफ़ाइल/मॉडल न रखने वाले प्रदाताओं को छोड़ देता है
  - डिफ़ॉल्ट रूप से केवल `generate` चलाता है
  - उपलब्ध होने पर घोषित ट्रांसफ़ॉर्म मोड भी चलाने के लिए `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` सेट करें:
    - `imageToVideo` जब प्रदाता `capabilities.imageToVideo.enabled` घोषित करता है और चयनित प्रदाता/मॉडल साझा स्वीप में बफ़र-समर्थित स्थानीय इमेज इनपुट स्वीकार करता है
    - `videoToVideo` जब प्रदाता `capabilities.videoToVideo.enabled` घोषित करता है और चयनित प्रदाता/मॉडल साझा स्वीप में बफ़र-समर्थित स्थानीय वीडियो इनपुट स्वीकार करता है
  - साझा स्वीप में वर्तमान घोषित-लेकिन-छोड़ा-गया `imageToVideo` प्रदाता:
    - `vydra` (इस लेन में बफ़र-समर्थित स्थानीय इमेज इनपुट समर्थित नहीं है)
  - Vydra के लिए प्रदाता-विशिष्ट कवरेज:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - वह फ़ाइल `veo3` टेक्स्ट-टू-वीडियो के साथ एक `kling` इमेज-टू-वीडियो लेन चलाती है, जो डिफ़ॉल्ट रूप से एक रिमोट इमेज URL फ़िक्स्चर का उपयोग करती है (ओवरराइड करने के लिए `OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL`)।
  - xAI के लिए प्रदाता-विशिष्ट कवरेज:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - क्लासिक केस पहले एक वर्गाकार स्थानीय PNG प्रथम फ़्रेम जनरेट करता है, ज्यामिति छोड़ देता है, एक-सेकंड की इमेज-टू-वीडियो क्लिप का अनुरोध करता है, पूर्ण होने तक पोल करता है, और डाउनलोड किए गए बफ़र का सत्यापन करता है।
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - 1.5 केस एक स्थानीय PNG प्रथम फ़्रेम जनरेट करता है, एक-सेकंड की 1080P इमेज-टू-वीडियो क्लिप का अनुरोध करता है, पूर्ण होने तक पोल करता है, और डाउनलोड किए गए बफ़र का सत्यापन करता है।
  - वर्तमान `videoToVideo` लाइव कवरेज:
    - `runway` केवल तभी, जब चयनित मॉडल `gen4_aleph` में रिज़ॉल्व होता है
  - साझा स्वीप में वर्तमान घोषित-लेकिन-छोड़े-गए `videoToVideo` प्रदाता:
    - `alibaba`, `google`, `openai`, `qwen`, `xai`, क्योंकि उन पथों को वर्तमान में बफ़र-समर्थित स्थानीय इनपुट के बजाय रिमोट `http(s)` संदर्भ URL की आवश्यकता होती है
- वैकल्पिक सीमितकरण:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL सहित प्रत्येक प्रदाता को डिफ़ॉल्ट स्वीप में शामिल करने के लिए `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - आक्रामक स्मोक रन के लिए प्रत्येक प्रदाता की ऑपरेशन सीमा घटाने हेतु `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- वैकल्पिक प्रमाणीकरण व्यवहार:
  - प्रोफ़ाइल-स्टोर प्रमाणीकरण को बाध्य करने और केवल एनवायरनमेंट वाले ओवरराइड अनदेखे करने के लिए `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## मीडिया लाइव हार्नेस

- कमांड: `pnpm test:live:media`
- एंट्रीपॉइंट: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, जो प्रत्येक चयनित सुइट के लिए `pnpm test:live -- <suite-test-file>` चलाता है, ताकि Heartbeat और शांत-मोड का व्यवहार अन्य `pnpm test:live` रन के अनुरूप रहे।
- उद्देश्य:
  - एक ही रिपॉज़िटरी-नेटिव एंट्रीपॉइंट के माध्यम से साझा इमेज, संगीत और वीडियो लाइव सुइट चलाता है
  - `~/.profile` से अनुपलब्ध प्रदाता एनवायरनमेंट वेरिएबल स्वतः लोड करता है
  - डिफ़ॉल्ट रूप से प्रत्येक सुइट को उन प्रदाताओं तक स्वतः सीमित करता है जिनके पास वर्तमान में उपयोग योग्य प्रमाणीकरण है
- फ़्लैग:
  - `--providers <csv>` वैश्विक प्रदाता फ़िल्टर; `--image-providers` / `--music-providers` / `--video-providers` किसी फ़िल्टर का दायरा एक सुइट तक सीमित करते हैं
  - `--all-providers` प्रमाणीकरण-आधारित स्वतः फ़िल्टर को छोड़ देता है
  - फ़िल्टरिंग के बाद कोई चलाने योग्य प्रदाता न बचने पर `--allow-empty`, `0` के साथ बाहर निकलता है
  - `--quiet` / `--no-quiet`, `test:live` को पास किए जाते हैं
- उदाहरण:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## संबंधित

- [परीक्षण](/hi/help/testing) - यूनिट, इंटीग्रेशन, QA और Docker सुइट
