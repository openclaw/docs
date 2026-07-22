---
read_when:
    - आप तय कर रहे हैं कि कोई Plugin मुख्य npm पैकेज में शामिल होकर वितरित हो या अलग से इंस्टॉल किया जाए
    - आप बंडल किए गए Plugin पैकेज का मेटाडेटा या रिलीज़ स्वचालन अपडेट कर रहे हैं
    - आपको मानक आंतरिक बनाम बाहरी Plugin सूची चाहिए
summary: कोर में शामिल, बाहरी रूप से प्रकाशित या केवल स्रोत के रूप में रखे गए OpenClaw plugins की जनरेट की गई सूची
title: Plugin सूची
x-i18n:
    generated_at: "2026-07-22T04:20:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2d835087afbe9d75f883c3db9739f914bedab5ac87a9c20b69c248304b61c594
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Plugin इन्वेंटरी

यह पेज `extensions/*/package.json`, `openclaw.plugin.json`,
और रूट npm पैकेज की `files` बहिष्करण सूची से जनरेट किया गया है। इसे इससे दोबारा जनरेट करें:

```bash
pnpm plugins:inventory:gen
```

## परिभाषाएँ

- **कोर npm पैकेज:** `openclaw` npm पैकेज में अंतर्निहित और अलग Plugin इंस्टॉल किए बिना उपलब्ध।
- **आधिकारिक बाहरी पैकेज:** OpenClaw द्वारा अनुरक्षित Plugin, जिसे कोर npm पैकेज से हटाया गया है, इस आधिकारिक इन्वेंटरी में रखा गया है, और ClawHub और/या npm के माध्यम से माँग पर इंस्टॉल किया जाता है।
- **केवल सोर्स चेकआउट:** रिपॉज़िटरी-स्थानीय Plugin, जिसे प्रकाशित npm आर्टिफ़ैक्ट से हटाया गया है और इंस्टॉल किए जा सकने वाले पैकेज के रूप में प्रचारित नहीं किया जाता।

सोर्स चेकआउट npm इंस्टॉल से अलग होते हैं: `pnpm install` के बाद, बंडल किए गए
Plugin `extensions/<id>` से लोड होते हैं, ताकि स्थानीय संपादन और पैकेज-स्थानीय वर्कस्पेस
डिपेंडेंसी उपलब्ध रहें।

## Plugin इंस्टॉल करें

इंस्टॉल की आवश्यकता है या नहीं, यह तय करने के लिए प्रत्येक प्रविष्टि में इंस्टॉल मार्ग का उपयोग करें। जिन Plugin
में `included in OpenClaw` लिखा है, वे कोर पैकेज में पहले से मौजूद हैं।
आधिकारिक बाहरी पैकेज के लिए एक बार इंस्टॉल करना और फिर Gateway पुनः आरंभ करना आवश्यक है।

उदाहरण के लिए, Discord एक आधिकारिक बाहरी पैकेज है:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

लॉन्च बदलाव के दौरान, सामान्य बिना उपसर्ग वाले पैकेज विनिर्देश अब भी npm से इंस्टॉल होते हैं।
जब आपको स्पष्ट स्रोत की आवश्यकता हो, तो `clawhub:@openclaw/discord` या `npm:@openclaw/discord`
का उपयोग करें। इंस्टॉल करने के बाद, क्रेडेंशियल और चैनल कॉन्फ़िगरेशन जोड़ने के लिए Plugin के सेटअप दस्तावेज़,
जैसे [Discord](/hi/channels/discord), का पालन करें। अपडेट, अनइंस्टॉल और प्रकाशन
कमांड के लिए [Plugin प्रबंधित करें](/hi/plugins/manage-plugins) देखें।

प्रत्येक प्रविष्टि में पैकेज, वितरण मार्ग और विवरण दिए गए हैं।

## कोर npm पैकेज

70 Plugin

- **[admin-http-rpc](/hi/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - OpenClaw में शामिल। OpenClaw व्यवस्थापक HTTP RPC एंडपॉइंट।

- **[alibaba](/hi/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - OpenClaw में शामिल। वीडियो जनरेशन प्रदाता समर्थन जोड़ता है।

- **[anthropic](/hi/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - OpenClaw में शामिल। Anthropic मॉडल, Claude CLI और मूल Claude सेशन कैटलॉग।

- **[azure-speech](/hi/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - OpenClaw में शामिल। Azure AI Speech टेक्स्ट-टू-स्पीच (MP3, मूल Ogg/Opus वॉइस नोट, PCM टेलीफ़ोनी)।

- **[bonjour](/hi/plugins/reference/bonjour)** (`@openclaw/bonjour`) - OpenClaw में शामिल। स्थानीय OpenClaw Gateway को Bonjour/mDNS पर प्रसारित करता है।

- **[browser](/hi/plugins/reference/browser)** (`@openclaw/browser-plugin`) - OpenClaw में शामिल। एजेंट द्वारा कॉल किए जा सकने वाले टूल जोड़ता है।

- **[byteplus](/hi/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - OpenClaw में शामिल। OpenClaw में BytePlus और BytePlus Plan मॉडल प्रदाता समर्थन जोड़ता है।

- **[canvas](/hi/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - OpenClaw में शामिल। युग्मित Node के लिए प्रयोगात्मक Canvas नियंत्रण और A2UI रेंडरिंग सतहें।

- **[clawrouter](/hi/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - OpenClaw में शामिल। OpenClaw में ClawRouter मॉडल प्रदाता समर्थन जोड़ता है।

- **[cohere](/hi/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - OpenClaw में शामिल; npm; ClawHub: `clawhub:@openclaw/cohere-provider`। OpenClaw Cohere प्रदाता Plugin।

- **[comfy](/hi/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - OpenClaw में शामिल। OpenClaw में ComfyUI मॉडल प्रदाता समर्थन जोड़ता है।

- **[copilot-proxy](/hi/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - OpenClaw में शामिल। OpenClaw में Copilot Proxy मॉडल प्रदाता समर्थन जोड़ता है।

- **[crabbox](/hi/plugins/reference/crabbox)** (`@openclaw/crabbox-provider`) - OpenClaw में शामिल। Crabbox CLI द्वारा समर्थित क्लाउड वर्कर प्रदाता।

- **[cua-computer](/plugins/reference/cua-computer)** (`@openclaw/cua-computer`) - OpenClaw में शामिल। Windows और Linux Node होस्ट के लिए प्रयोगात्मक cua-driver कंप्यूटर नियंत्रण।

- **[deepgram](/hi/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - OpenClaw में शामिल। मीडिया समझ प्रदाता समर्थन जोड़ता है। रीयल-टाइम ट्रांसक्रिप्शन प्रदाता समर्थन जोड़ता है।

- **[document-extract](/hi/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - OpenClaw में शामिल। स्थानीय दस्तावेज़ अटैचमेंट से टेक्स्ट और फ़ॉलबैक पेज इमेज निकालता है।

- **[duckduckgo](/hi/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - OpenClaw में शामिल। वेब खोज प्रदाता समर्थन जोड़ता है।

- **[elevenlabs](/hi/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - OpenClaw में शामिल। मीडिया समझ प्रदाता समर्थन जोड़ता है। रीयल-टाइम ट्रांसक्रिप्शन प्रदाता समर्थन जोड़ता है। टेक्स्ट-टू-स्पीच प्रदाता समर्थन जोड़ता है।

- **[fal](/hi/plugins/reference/fal)** (`@openclaw/fal-provider`) - OpenClaw में शामिल। OpenClaw में fal मॉडल प्रदाता समर्थन जोड़ता है।

- **[file-transfer](/hi/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - OpenClaw में शामिल। समर्पित Node कमांड के माध्यम से युग्मित Node पर फ़ाइलें प्राप्त करता, सूचीबद्ध करता और लिखता है। 16 MB तक की बाइनरी के लिए node.invoke पर base64 का उपयोग करके bash stdout ट्रंकेशन से बचता है।

- **[github-copilot](/hi/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - OpenClaw में शामिल। OpenClaw में GitHub Copilot मॉडल प्रदाता समर्थन जोड़ता है।

- **[google](/hi/plugins/reference/google)** (`@openclaw/google-plugin`) - OpenClaw में शामिल। OpenClaw में Google, Google Gemini CLI और Google Vertex मॉडल प्रदाता समर्थन जोड़ता है।

- **[huggingface](/hi/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - OpenClaw में शामिल है। OpenClaw में Hugging Face मॉडल प्रदाता समर्थन जोड़ता है।

- **[imessage](/hi/plugins/reference/imessage)** (`@openclaw/imessage`) - OpenClaw में शामिल है। OpenClaw संदेश भेजने और प्राप्त करने के लिए iMessage चैनल सतह जोड़ता है।

- **[linux-canvas](/hi/plugins/reference/linux-canvas)** (`@openclaw/linux-canvas`) - OpenClaw में शामिल है। OpenClaw Linux डेस्कटॉप ऐप के लिए कैनवास रेंडरिंग ब्रिज।

- **[linux-node](/hi/plugins/reference/linux-node)** (`@openclaw/linux-node`) - OpenClaw में शामिल है। Linux Node होस्ट के लिए डेस्कटॉप सूचनाएँ, कैमरा कैप्चर और स्थान।

- **[litellm](/hi/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - OpenClaw में शामिल है। OpenClaw में LiteLLM मॉडल प्रदाता समर्थन जोड़ता है।

- **[llm-task](/hi/plugins/reference/llm-task)** (`@openclaw/llm-task`) - OpenClaw में शामिल है। संरचित कार्यों के लिए सामान्य, केवल-JSON LLM टूल, जिसे कार्यप्रवाहों से कॉल किया जा सकता है।

- **[lmstudio](/hi/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - OpenClaw में शामिल है। OpenClaw में LM Studio मॉडल प्रदाता समर्थन जोड़ता है।

- **[logbook](/hi/plugins/reference/logbook)** (`@openclaw/logbook`) - OpenClaw में शामिल है। स्वचालित कार्य जर्नल: युग्मित Node से समय-समय पर स्क्रीन स्नैपशॉट कैप्चर करता है और उन्हें आपके दिन की समीक्षा योग्य समयरेखा में बदलता है।

- **[memory-core](/hi/plugins/reference/memory-core)** (`@openclaw/memory-core`) - OpenClaw में शामिल है। एजेंट द्वारा कॉल किए जा सकने वाले टूल जोड़ता है।

- **[memory-wiki](/hi/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - OpenClaw में शामिल है। OpenClaw के लिए स्थायी विकी कंपाइलर और Obsidian-अनुकूल ज्ञान वॉल्ट।

- **[meta](/hi/plugins/reference/meta)** (`@openclaw/meta-provider`) - OpenClaw में शामिल है; npm; ClawHub: `clawhub:@openclaw/meta-provider`। OpenClaw में Meta मॉडल प्रदाता समर्थन जोड़ता है।

- **[microsoft](/hi/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - OpenClaw में शामिल है। टेक्स्ट-टू-स्पीच प्रदाता समर्थन जोड़ता है।

- **[microsoft-foundry](/hi/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - OpenClaw में शामिल है। OpenClaw में Microsoft Foundry मॉडल प्रदाता समर्थन जोड़ता है।

- **[migrate-claude](/hi/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - OpenClaw में शामिल है। Claude Code और Claude Desktop के निर्देशों, MCP सर्वरों, Skills और सुरक्षित कॉन्फ़िगरेशन को OpenClaw में आयात करता है।

- **[migrate-hermes](/hi/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - OpenClaw में शामिल है। Hermes कॉन्फ़िगरेशन, स्मृतियों, Skills और समर्थित क्रेडेंशियल को OpenClaw में आयात करता है।

- **[minimax](/hi/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - OpenClaw में शामिल है। OpenClaw में MiniMax और MiniMax Portal मॉडल प्रदाता समर्थन जोड़ता है।

- **[mistral](/hi/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - OpenClaw में शामिल है। OpenClaw में Mistral मॉडल प्रदाता समर्थन जोड़ता है।

- **[novita](/hi/plugins/reference/novita)** (`@openclaw/novita-provider`) - OpenClaw में शामिल है। OpenClaw में Novita, Novita AI और Novitaai मॉडल प्रदाता समर्थन जोड़ता है।

- **[nvidia](/hi/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - OpenClaw में शामिल है। OpenClaw में NVIDIA मॉडल प्रदाता का समर्थन जोड़ता है।

- **[oc-path](/hi/plugins/reference/oc-path)** (`@openclaw/oc-path`) - OpenClaw में शामिल है। oc:// वर्कस्पेस फ़ाइल एड्रेसिंग के लिए openclaw path CLI जोड़ता है।

- **[ollama](/hi/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - OpenClaw में शामिल है। OpenClaw में Ollama और Ollama Cloud मॉडल प्रदाताओं का समर्थन जोड़ता है।

- **[onepassword](/hi/plugins/reference/onepassword)** (`@openclaw/onepassword`) - OpenClaw में शामिल है। अनुमोदन नीति और SQLite ऑडिट इतिहास वाला चुनिंदा 1Password सीक्रेट ब्रोकर।

- **[open-prose](/hi/plugins/reference/open-prose)** (`@openclaw/open-prose`) - OpenClaw में शामिल है। /prose स्लैश कमांड वाला OpenProse VM स्किल पैक।

- **[openai](/hi/plugins/reference/openai)** (`@openclaw/openai-provider`) - OpenClaw में शामिल है। OpenClaw में OpenAI मॉडल प्रदाता का समर्थन जोड़ता है।

- **[opencode](/hi/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - OpenClaw में शामिल है। OpenClaw में OpenCode मॉडल प्रदाता का समर्थन जोड़ता है।

- **[opencode-go](/hi/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - OpenClaw में शामिल है। OpenClaw में OpenCode Go मॉडल प्रदाता का समर्थन जोड़ता है।

- **[openrouter](/hi/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - OpenClaw में शामिल है। OpenClaw में OpenRouter मॉडल प्रदाता का समर्थन जोड़ता है।

- **[policy](/hi/plugins/reference/policy)** (`@openclaw/policy`) - OpenClaw में शामिल है। वर्कस्पेस अनुरूपता के लिए नीति-समर्थित डॉक्टर जाँच जोड़ता है।

- **[reef](/hi/plugins/reference/reef)** (`@openclaw/reef`) - OpenClaw में शामिल है। सुरक्षित एंड-टू-एंड एन्क्रिप्टेड क्लॉ चैनल।

- **[runway](/hi/plugins/reference/runway)** (`@openclaw/runway-provider`) - OpenClaw में शामिल है। वीडियो निर्माण प्रदाता का समर्थन जोड़ता है।

- **[senseaudio](/hi/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - OpenClaw में शामिल है। मीडिया समझ प्रदाता का समर्थन जोड़ता है।

- **[sglang](/hi/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - OpenClaw में शामिल है। OpenClaw में SGLang मॉडल प्रदाता का समर्थन जोड़ता है।

- **[synthetic](/hi/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - OpenClaw में शामिल है। OpenClaw में Synthetic मॉडल प्रदाता का समर्थन जोड़ता है।

- **[teams-meetings](/hi/plugins/reference/teams-meetings)** (`@openclaw/teams-meetings`) - OpenClaw में शामिल है। Chrome ब्राउज़र अतिथि के रूप में Microsoft Teams मीटिंग में शामिल होता है।

- **[telegram](/hi/plugins/reference/telegram)** (`@openclaw/telegram`) - OpenClaw में शामिल है। OpenClaw संदेश भेजने और प्राप्त करने के लिए Telegram चैनल इंटरफ़ेस जोड़ता है।

- **[together](/hi/plugins/reference/together)** (`@openclaw/together-provider`) - OpenClaw में शामिल है। OpenClaw में Together मॉडल प्रदाता का समर्थन जोड़ता है।

- **[tts-local-cli](/hi/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - OpenClaw में शामिल है। टेक्स्ट-टू-स्पीच प्रदाता का समर्थन जोड़ता है।

- **[vault](/hi/plugins/reference/vault)** (`@openclaw/vault`) - OpenClaw में शामिल है। HashiCorp Vault SecretRef प्रदाता एकीकरण।

- **[vllm](/hi/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - OpenClaw में शामिल है। OpenClaw में vLLM मॉडल प्रदाता समर्थन जोड़ता है।

- **[volcengine](/hi/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - OpenClaw में शामिल है। OpenClaw में Volcengine और Volcengine Plan मॉडल प्रदाता समर्थन जोड़ता है।

- **[voyage](/hi/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - OpenClaw में शामिल है। मेमोरी एम्बेडिंग प्रदाता समर्थन जोड़ता है।

- **[vydra](/hi/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - OpenClaw में शामिल है। OpenClaw में Vydra मॉडल प्रदाता समर्थन जोड़ता है।

- **[web-readability](/hi/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - OpenClaw में शामिल है। स्थानीय HTML वेब फ़ेच प्रतिक्रियाओं से पठनीय लेख सामग्री निकालता है।

- **[webhooks](/hi/plugins/reference/webhooks)** (`@openclaw/webhooks`) - OpenClaw में शामिल है। प्रमाणीकृत इनबाउंड वेबहुक, जो बाहरी स्वचालन को OpenClaw TaskFlows से जोड़ते हैं।

- **[workboard](/hi/plugins/reference/workboard)** (`@openclaw/workboard`) - OpenClaw में शामिल है। एजेंट के स्वामित्व वाले मुद्दों और सत्रों के लिए डैशबोर्ड वर्कबोर्ड।

- **[xai](/hi/plugins/reference/xai)** (`@openclaw/xai-plugin`) - OpenClaw में शामिल है। OpenClaw में xAI मॉडल प्रदाता समर्थन जोड़ता है।

- **[xiaomi](/hi/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - OpenClaw में शामिल है। OpenClaw में Xiaomi और Xiaomi Token Plan मॉडल प्रदाता समर्थन जोड़ता है।

- **[zoom-meetings](/hi/plugins/reference/zoom-meetings)** (`@openclaw/zoom-meetings`) - OpenClaw में शामिल है। Chrome ब्राउज़र अतिथि के रूप में Zoom बैठकों में शामिल होता है।

## आधिकारिक बाहरी पैकेज

72 प्लगइन

- **[acpx](/hi/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub। प्लगइन-स्वामित्व वाले सत्र और ट्रांसपोर्ट प्रबंधन के साथ OpenClaw ACP रनटाइम बैकएंड।

- **[amazon-bedrock](/hi/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub। मॉडल खोज, एम्बेडिंग और गार्डरेल समर्थन वाला OpenClaw Amazon Bedrock प्रदाता प्लगइन।

- **[amazon-bedrock-mantle](/hi/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub। OpenAI-संगत मॉडल रूटिंग के लिए OpenClaw Amazon Bedrock Mantle प्रदाता प्लगइन।

- **[anthropic-vertex](/hi/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub। Google Vertex AI पर Claude मॉडल के लिए OpenClaw Anthropic Vertex प्रदाता प्लगइन।

- **[arcee](/hi/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`। OpenClaw में Arcee मॉडल प्रदाता समर्थन जोड़ता है।

- **[baseten](/hi/plugins/reference/baseten)** (`@openclaw/baseten-provider`) - npm; ClawHub: `clawhub:@openclaw/baseten-provider`। OpenClaw Baseten प्रदाता प्लगइन।

- **[brave](/hi/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub। वेब खोज के लिए OpenClaw Brave Search प्रदाता प्लगइन।

- **[cerebras](/hi/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`। OpenClaw में Cerebras मॉडल प्रदाता समर्थन जोड़ता है।

- **[chutes](/hi/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`। OpenClaw में Chutes मॉडल प्रदाता समर्थन जोड़ता है।

- **[clickclack](/hi/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`। OpenClaw संदेश भेजने और प्राप्त करने के लिए Clickclack चैनल सतह जोड़ता है।

- **[cloudflare-ai-gateway](/hi/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`। OpenClaw में Cloudflare AI Gateway मॉडल प्रदाता समर्थन जोड़ता है।

- **[codex](/hi/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub। Codex ऐप-सर्वर हार्नेस और नेटिव सत्र कैटलॉग।

- **[copilot](/hi/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`। GitHub Copilot एजेंट रनटाइम पंजीकृत करता है।

- **[deepinfra](/hi/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`। OpenClaw में DeepInfra मॉडल प्रदाता समर्थन जोड़ता है।

- **[deepseek](/hi/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`। OpenClaw में DeepSeek मॉडल प्रदाता समर्थन जोड़ता है।

- **[diagnostics-otel](/hi/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`। मेट्रिक्स, ट्रेस और लॉग के लिए OpenClaw डायग्नोस्टिक्स OpenTelemetry एक्सपोर्टर।

- **[diagnostics-prometheus](/hi/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`। रनटाइम मेट्रिक्स के लिए OpenClaw डायग्नोस्टिक्स Prometheus एक्सपोर्टर।

- **[diffs](/hi/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub। एजेंटों के लिए OpenClaw केवल-पढ़ने योग्य डिफ़ व्यूअर प्लगइन और फ़ाइल रेंडरर।

- **[diffs-language-pack](/hi/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`। डिफ़ॉल्ट डिफ़्स व्यूअर समूह से बाहर की भाषाओं के लिए सिंटैक्स हाइलाइटिंग जोड़ता है।

- **[discord](/hi/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub। चैनलों, डीएम, कमांड और ऐप इवेंट के लिए OpenClaw Discord चैनल प्लगइन।

- **[exa](/hi/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`। वेब खोज प्रदाता समर्थन जोड़ता है।

- **[featherless](/hi/plugins/reference/featherless)** (`@openclaw/featherless-provider`) - npm; ClawHub: `clawhub:@openclaw/featherless-provider`। OpenClaw Featherless AI प्रदाता प्लगइन।

- **[feishu](/hi/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub। चैट और कार्यस्थल टूल के लिए OpenClaw Feishu/Lark चैनल प्लगइन (समुदाय द्वारा अनुरक्षित: @m1heng)।

- **[firecrawl](/hi/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`। एजेंट द्वारा कॉल किए जा सकने वाले टूल जोड़ता है। वेब फ़ेच प्रदाता समर्थन जोड़ता है। वेब खोज प्रदाता समर्थन जोड़ता है।

- **[fireworks](/hi/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`। OpenClaw में Fireworks मॉडल प्रदाता समर्थन जोड़ता है।

- **[gmi](/hi/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`। OpenClaw GMI Cloud प्रदाता प्लगइन।

- **[google-meet](/hi/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub। Chrome या Twilio ट्रांसपोर्ट के माध्यम से कॉल में शामिल होने के लिए OpenClaw Google Meet प्रतिभागी प्लगइन।

- **[googlechat](/hi/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub। स्पेस और प्रत्यक्ष संदेशों के लिए OpenClaw Google Chat चैनल प्लगइन।

- **[gradium](/hi/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`। टेक्स्ट-टू-स्पीच प्रदाता समर्थन जोड़ता है।

- **[groq](/hi/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`। OpenClaw में Groq मॉडल प्रदाता समर्थन जोड़ता है।

- **[inworld](/hi/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`। Inworld स्ट्रीमिंग टेक्स्ट-टू-स्पीच (MP3, OGG_OPUS, PCM टेलीफ़ोनी)।

- **[irc](/hi/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`। OpenClaw संदेश भेजने और प्राप्त करने के लिए IRC चैनल सतह जोड़ता है।

- **[kilocode](/hi/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`। OpenClaw में Kilocode मॉडल प्रदाता समर्थन जोड़ता है।

- **[kimi](/hi/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`। OpenClaw में Kimi और Kimi Coding मॉडल प्रदाता समर्थन जोड़ता है।

- **[line](/hi/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub। LINE Bot API चैट के लिए OpenClaw LINE चैनल प्लगइन।

- **[llama-cpp](/hi/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub। node-llama-cpp के माध्यम से स्थानीय GGUF टेक्स्ट इन्फ़रेंस और एम्बेडिंग।

- **[lobster](/hi/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub। टाइप्ड पाइपलाइन और पुनः आरंभ किए जा सकने वाले अनुमोदनों के लिए Lobster वर्कफ़्लो टूल प्लगइन।

- **[longcat](/hi/plugins/reference/longcat)** (`@openclaw/longcat-provider`) - npm; ClawHub: `clawhub:@openclaw/longcat-provider`। OpenClaw LongCat प्रदाता प्लगइन।

- **[matrix](/hi/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm। रूम और प्रत्यक्ष संदेशों के लिए OpenClaw Matrix चैनल प्लगइन।

- **[mattermost](/hi/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`। OpenClaw संदेश भेजने और प्राप्त करने के लिए Mattermost चैनल सतह जोड़ता है।

- **[memory-lancedb](/hi/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub। स्वतः-पुनर्स्मरण, स्वतः-कैप्चर और वेक्टर खोज वाला OpenClaw LanceDB-समर्थित दीर्घकालिक मेमोरी प्लगइन।

- **[moonshot](/hi/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`। OpenClaw में Moonshot मॉडल प्रदाता समर्थन जोड़ता है।

- **[msteams](/hi/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub। बॉट वार्तालापों के लिए OpenClaw Microsoft Teams चैनल प्लगइन।

- **[mxc](/hi/plugins/reference/mxc)** (`@openclaw/mxc-sandbox`) - npm; ClawHub। MXC के माध्यम से OS-स्तरीय सैंडबॉक्स टूल निष्पादन: कॉन्फ़िगर की गई MXC नीति फ़ाइलों वाले Windows ProcessContainer में कमांड चलाता है।

- **[nextcloud-talk](/hi/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub। वार्तालापों के लिए OpenClaw Nextcloud Talk चैनल प्लगइन।

- **[nostr](/hi/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub। NIP-04 एन्क्रिप्टेड प्रत्यक्ष संदेशों के लिए OpenClaw Nostr चैनल प्लगइन।

- **[openshell](/hi/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub। मिरर किए गए स्थानीय कार्यस्थानों और SSH कमांड निष्पादन के साथ NVIDIA OpenShell CLI के लिए OpenClaw सैंडबॉक्स बैकएंड।

- **[parallel](/hi/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`। वेब खोज प्रदाता समर्थन जोड़ता है।

- **[perplexity](/hi/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`। वेब खोज प्रदाता समर्थन जोड़ता है।

- **[pixverse](/hi/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`। OpenClaw PixVerse वीडियो निर्माण प्रदाता प्लगइन।

- **[qianfan](/hi/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`। OpenClaw में Qianfan मॉडल प्रदाता समर्थन जोड़ता है।

- **[qqbot](/hi/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub। समूह और प्रत्यक्ष-संदेश वर्कफ़्लो के लिए OpenClaw QQ Bot चैनल प्लगइन।

- **[qwen](/hi/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`। OpenClaw में Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Token Plan और Bailian Token Plan मॉडल प्रदाता समर्थन जोड़ता है।

- **[raft](/hi/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub। सुरक्षित CLI वेक ब्रिज के लिए OpenClaw Raft चैनल प्लगइन।

- **[searxng](/hi/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`। वेब खोज प्रदाता समर्थन जोड़ता है।

- **[signal](/hi/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`। OpenClaw संदेश भेजने और प्राप्त करने के लिए Signal चैनल सतह जोड़ता है।

- **[slack](/hi/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub। चैनलों, डीएम, कमांड और ऐप इवेंट के लिए OpenClaw Slack चैनल प्लगइन।

- **[sms](/hi/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. OpenClaw टेक्स्ट संदेशों के लिए Twilio SMS चैनल Plugin।

- **[stepfun](/hi/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. OpenClaw में StepFun और StepFun Plan मॉडल प्रदाता समर्थन जोड़ता है।

- **[synology-chat](/hi/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub। OpenClaw चैनलों और सीधे संदेशों के लिए Synology Chat चैनल Plugin।

- **[tavily](/hi/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. एजेंट द्वारा कॉल किए जा सकने वाले टूल जोड़ता है। वेब खोज प्रदाता समर्थन जोड़ता है।

- **[tencent](/hi/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. OpenClaw में Tencent TokenHub और Tencent Tokenplan मॉडल प्रदाता समर्थन जोड़ता है।

- **[tlon](/hi/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub। चैट कार्यप्रवाहों के लिए OpenClaw Tlon/Urbit चैनल Plugin।

- **[tokenjuice](/hi/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Tokenjuice रिड्यूसर के साथ exec और bash टूल के परिणामों को संक्षिप्त करता है।

- **[twitch](/hi/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub। चैट और मॉडरेशन कार्यप्रवाहों के लिए OpenClaw Twitch चैनल Plugin।

- **[venice](/hi/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. OpenClaw में Venice मॉडल प्रदाता समर्थन जोड़ता है।

- **[vercel-ai-gateway](/hi/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. OpenClaw में Vercel AI Gateway मॉडल प्रदाता समर्थन जोड़ता है।

- **[voice-call](/hi/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub। Twilio, Telnyx और Plivo फ़ोन कॉल के लिए OpenClaw वॉइस-कॉल Plugin।

- **[whatsapp](/hi/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm। WhatsApp Web चैट के लिए OpenClaw WhatsApp चैनल Plugin।

- **[zai](/hi/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. OpenClaw में Z.AI मॉडल प्रदाता समर्थन जोड़ता है।

- **[zalo](/hi/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub। बॉट और Webhook चैट के लिए OpenClaw Zalo चैनल Plugin।

- **[zalouser](/hi/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub। मूल zca-js एकीकरण के माध्यम से OpenClaw Zalo व्यक्तिगत खाता Plugin।

## केवल स्रोत चेकआउट

2 Plugin

- **[qa-channel](/hi/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - केवल स्रोत चेकआउट। OpenClaw संदेश भेजने और प्राप्त करने के लिए QA Channel सतह जोड़ता है।

- **[qa-lab](/hi/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - केवल स्रोत चेकआउट। निजी डीबगर UI और परिदृश्य रनर वाला OpenClaw QA लैब Plugin।
