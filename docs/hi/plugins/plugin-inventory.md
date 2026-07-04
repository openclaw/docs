---
read_when:
    - आप तय कर रहे हैं कि कोई plugin मुख्य npm package में शामिल होकर शिप होता है या अलग से इंस्टॉल होता है।
    - आप बंडल किए गए Plugin पैकेज मेटाडेटा या रिलीज़ ऑटोमेशन अपडेट कर रहे हैं
    - आपको प्रामाणिक आंतरिक बनाम बाहरी Plugin सूची चाहिए
summary: कोर में भेजे गए, बाहरी रूप से प्रकाशित, या केवल-स्रोत रखे गए OpenClaw Plugin की जनरेट की गई इन्वेंटरी
title: Plugin इन्वेंट्री
x-i18n:
    generated_at: "2026-07-04T03:48:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1af48e3d1ca8e994780dae2ac39dd2d3c3ed0bc8c136cbf3448fe18fadddfb0a
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Plugin इन्वेंटरी

यह पेज `extensions/*/package.json`, `openclaw.plugin.json`,
और रूट npm पैकेज `files` exclusions से जनरेट किया गया है। इसे इसके साथ फिर से जनरेट करें:

```bash
pnpm plugins:inventory:gen
```

## परिभाषाएँ

- **कोर npm पैकेज:** `openclaw` npm पैकेज में निर्मित और अलग Plugin इंस्टॉल किए बिना उपलब्ध।
- **आधिकारिक बाहरी पैकेज:** OpenClaw-द्वारा अनुरक्षित Plugin जो कोर npm पैकेज से हटाया गया है, इस आधिकारिक इन्वेंटरी में रखा गया है, और ClawHub और/या npm के माध्यम से मांग पर इंस्टॉल किया जाता है।
- **केवल सोर्स चेकआउट:** रेपो-स्थानीय Plugin जो प्रकाशित npm आर्टिफैक्ट से हटाया गया है और इंस्टॉल करने योग्य पैकेज के रूप में विज्ञापित नहीं है।

सोर्स चेकआउट npm इंस्टॉल से अलग होते हैं: `pnpm install` के बाद, बंडल किए गए
Plugin `extensions/<id>` से लोड होते हैं ताकि स्थानीय बदलाव और पैकेज-स्थानीय workspace
dependencies उपलब्ध रहें।

## Plugin इंस्टॉल करें

इंस्टॉल की जरूरत है या नहीं, यह तय करने के लिए हर एंट्री में इंस्टॉल रूट का उपयोग करें। जिन Plugin
में `included in OpenClaw` लिखा है, वे कोर पैकेज में पहले से मौजूद हैं।
आधिकारिक बाहरी पैकेजों को एक इंस्टॉल की जरूरत होती है, फिर Gateway restart की।

उदाहरण के लिए, Discord एक आधिकारिक बाहरी पैकेज है:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

लॉन्च कटओवर के दौरान, सामान्य bare package specs अब भी npm से इंस्टॉल होते हैं।
जब आपको स्पष्ट स्रोत चाहिए, तो `clawhub:@openclaw/discord` या `npm:@openclaw/discord` का उपयोग करें।
इंस्टॉल के बाद, credentials और channel config जोड़ने के लिए Plugin के setup doc का पालन करें, जैसे
[Discord](/hi/channels/discord)। update, uninstall, और publishing
commands के लिए [Plugin प्रबंधित करें](/hi/plugins/manage-plugins) देखें।

हर एंट्री पैकेज, distribution route, और description सूचीबद्ध करती है।

## कोर npm पैकेज

60 Plugin

- **[admin-http-rpc](/hi/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - OpenClaw में शामिल। OpenClaw admin HTTP RPC endpoint।

- **[alibaba](/hi/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - OpenClaw में शामिल। video generation provider support जोड़ता है।

- **[anthropic](/hi/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - OpenClaw में शामिल। OpenClaw में Anthropic model provider support जोड़ता है।

- **[azure-speech](/hi/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - OpenClaw में शामिल। Azure AI Speech text-to-speech (MP3, native Ogg/Opus voice notes, PCM telephony)।

- **[bonjour](/hi/plugins/reference/bonjour)** (`@openclaw/bonjour`) - OpenClaw में शामिल। स्थानीय OpenClaw gateway को Bonjour/mDNS पर विज्ञापित करें।

- **[browser](/hi/plugins/reference/browser)** (`@openclaw/browser-plugin`) - OpenClaw में शामिल। agent-callable tools जोड़ता है।

- **[byteplus](/hi/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - OpenClaw में शामिल। OpenClaw में BytePlus, BytePlus Plan model provider support जोड़ता है।

- **[canvas](/hi/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - OpenClaw में शामिल। paired nodes के लिए experimental Canvas control और A2UI rendering surfaces।

- **[clawrouter](/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - OpenClaw में शामिल। OpenClaw में ClawRouter model provider support जोड़ता है।

- **[codex-supervisor](/hi/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - OpenClaw में शामिल। OpenClaw से Codex app-server sessions की निगरानी करें।

- **[cohere](/hi/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - OpenClaw में शामिल; npm; ClawHub: `clawhub:@openclaw/cohere-provider`। OpenClaw Cohere provider Plugin।

- **[comfy](/hi/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - OpenClaw में शामिल। OpenClaw में ComfyUI model provider support जोड़ता है।

- **[copilot-proxy](/hi/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - OpenClaw में शामिल। OpenClaw में Copilot Proxy model provider support जोड़ता है।

- **[deepgram](/hi/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - OpenClaw में शामिल। media understanding provider support जोड़ता है। realtime transcription provider support जोड़ता है।

- **[document-extract](/hi/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - OpenClaw में शामिल। स्थानीय document attachments से text और fallback page images निकालें।

- **[duckduckgo](/hi/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - OpenClaw में शामिल। web search provider support जोड़ता है।

- **[elevenlabs](/hi/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - OpenClaw में शामिल। media understanding provider support जोड़ता है। realtime transcription provider support जोड़ता है। text-to-speech provider support जोड़ता है।

- **[fal](/hi/plugins/reference/fal)** (`@openclaw/fal-provider`) - OpenClaw में शामिल। OpenClaw में fal model provider support जोड़ता है।

- **[file-transfer](/hi/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - OpenClaw में शामिल। dedicated node commands के जरिए paired nodes पर files fetch, list, और write करें। 16 MB तक के binaries के लिए node.invoke पर base64 का उपयोग करके bash stdout truncation को bypass करता है।

- **[github-copilot](/hi/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - OpenClaw में शामिल। OpenClaw में GitHub Copilot model provider support जोड़ता है।

- **[google](/hi/plugins/reference/google)** (`@openclaw/google-plugin`) - OpenClaw में शामिल। OpenClaw में Google, Google Gemini CLI, Google Vertex model provider support जोड़ता है।

- **[huggingface](/hi/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - OpenClaw में शामिल। OpenClaw में Hugging Face model provider support जोड़ता है।

- **[imessage](/hi/plugins/reference/imessage)** (`@openclaw/imessage`) - OpenClaw में शामिल। OpenClaw messages भेजने और प्राप्त करने के लिए iMessage channel surface जोड़ता है।

- **[litellm](/hi/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - OpenClaw में शामिल। OpenClaw में LiteLLM model provider support जोड़ता है।

- **[llm-task](/hi/plugins/reference/llm-task)** (`@openclaw/llm-task`) - OpenClaw में शामिल। workflows से callable structured tasks के लिए generic JSON-only LLM tool।

- **[lmstudio](/hi/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - OpenClaw में शामिल। OpenClaw में LM Studio model provider support जोड़ता है।

- **[memory-core](/hi/plugins/reference/memory-core)** (`@openclaw/memory-core`) - OpenClaw में शामिल। agent-callable tools जोड़ता है।

- **[memory-wiki](/hi/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - OpenClaw में शामिल। OpenClaw के लिए persistent wiki compiler और Obsidian-friendly knowledge vault।

- **[microsoft](/hi/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - OpenClaw में शामिल। text-to-speech provider support जोड़ता है।

- **[microsoft-foundry](/hi/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - OpenClaw में शामिल। OpenClaw में Microsoft Foundry model provider support जोड़ता है।

- **[migrate-claude](/hi/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - OpenClaw में शामिल। Claude Code और Claude Desktop instructions, MCP servers, Skills, और सुरक्षित configuration को OpenClaw में import करता है।

- **[migrate-hermes](/hi/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - OpenClaw में शामिल। Hermes configuration, memories, Skills, और supported credentials को OpenClaw में import करता है।

- **[minimax](/hi/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - OpenClaw में शामिल। OpenClaw में MiniMax, MiniMax Portal model provider support जोड़ता है।

- **[mistral](/hi/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - OpenClaw में शामिल। OpenClaw में Mistral model provider support जोड़ता है।

- **[novita](/hi/plugins/reference/novita)** (`@openclaw/novita-provider`) - OpenClaw में शामिल। OpenClaw में Novita, Novita AI, Novitaai model provider support जोड़ता है।

- **[nvidia](/hi/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - OpenClaw में शामिल। OpenClaw में NVIDIA model provider support जोड़ता है।

- **[oc-path](/hi/plugins/reference/oc-path)** (`@openclaw/oc-path`) - OpenClaw में शामिल। oc:// workspace file addressing के लिए openclaw path CLI जोड़ता है।

- **[ollama](/hi/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - OpenClaw में शामिल। OpenClaw में Ollama, Ollama Cloud model provider support जोड़ता है।

- **[open-prose](/hi/plugins/reference/open-prose)** (`@openclaw/open-prose`) - OpenClaw में शामिल। /prose slash command के साथ OpenProse VM skill pack।

- **[openai](/hi/plugins/reference/openai)** (`@openclaw/openai-provider`) - OpenClaw में शामिल। OpenClaw में OpenAI model provider support जोड़ता है।

- **[opencode](/hi/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - OpenClaw में शामिल। OpenClaw में OpenCode model provider support जोड़ता है।

- **[opencode-go](/hi/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - OpenClaw में शामिल। OpenClaw में OpenCode Go model provider support जोड़ता है।

- **[openrouter](/hi/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - OpenClaw में शामिल। OpenClaw में OpenRouter model provider support जोड़ता है।

- **[policy](/hi/plugins/reference/policy)** (`@openclaw/policy`) - OpenClaw में शामिल। workspace conformance के लिए policy-backed doctor checks जोड़ता है।

- **[runway](/hi/plugins/reference/runway)** (`@openclaw/runway-provider`) - OpenClaw में शामिल। video generation provider support जोड़ता है।

- **[senseaudio](/hi/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - OpenClaw में शामिल। media understanding provider support जोड़ता है।

- **[sglang](/hi/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - OpenClaw में शामिल। OpenClaw में SGLang model provider support जोड़ता है।

- **[synthetic](/hi/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - OpenClaw में शामिल। OpenClaw में Synthetic model provider support जोड़ता है।

- **[telegram](/hi/plugins/reference/telegram)** (`@openclaw/telegram`) - OpenClaw में शामिल। OpenClaw messages भेजने और प्राप्त करने के लिए Telegram channel surface जोड़ता है।

- **[together](/hi/plugins/reference/together)** (`@openclaw/together-provider`) - OpenClaw में शामिल। OpenClaw में Together model provider support जोड़ता है।

- **[tts-local-cli](/hi/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - OpenClaw में शामिल। text-to-speech provider support जोड़ता है।

- **[vllm](/hi/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - OpenClaw में शामिल। OpenClaw में vLLM model provider support जोड़ता है।

- **[volcengine](/hi/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - OpenClaw में शामिल। OpenClaw में Volcengine, Volcengine Plan model provider support जोड़ता है।

- **[voyage](/hi/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - OpenClaw में शामिल। memory embedding provider support जोड़ता है।

- **[vydra](/hi/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - OpenClaw में शामिल। OpenClaw में Vydra model provider support जोड़ता है।

- **[web-readability](/hi/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - OpenClaw में शामिल। स्थानीय HTML web fetch responses से readable article content निकालें।

- **[webhooks](/hi/plugins/reference/webhooks)** (`@openclaw/webhooks`) - OpenClaw में शामिल। authenticated inbound webhooks जो external automation को OpenClaw TaskFlows से bind करते हैं।

- **[workboard](/hi/plugins/reference/workboard)** (`@openclaw/workboard`) - OpenClaw में शामिल। agent-owned issues और sessions के लिए dashboard workboard।

- **[xai](/hi/plugins/reference/xai)** (`@openclaw/xai-plugin`) - OpenClaw में शामिल। OpenClaw में xAI model provider support जोड़ता है।

- **[xiaomi](/hi/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - OpenClaw में शामिल। OpenClaw में Xiaomi, Xiaomi Token Plan model provider support जोड़ता है।

## आधिकारिक बाहरी पैकेज

68 Plugin

- **[acpx](/hi/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub। Plugin-owned session और transport management के साथ OpenClaw ACP runtime backend।

- **[amazon-bedrock](/hi/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub। model discovery, embeddings, और guardrail support के साथ OpenClaw Amazon Bedrock provider Plugin।

- **[amazon-bedrock-mantle](/hi/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. OpenAI-संगत मॉडल रूटिंग के लिए OpenClaw Amazon Bedrock Mantle प्रदाता Plugin.

- **[anthropic-vertex](/hi/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Google Vertex AI पर Claude मॉडल के लिए OpenClaw Anthropic Vertex प्रदाता Plugin.

- **[arcee](/hi/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. OpenClaw में Arcee मॉडल प्रदाता समर्थन जोड़ता है.

- **[brave](/hi/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. वेब खोज के लिए OpenClaw Brave Search प्रदाता Plugin.

- **[cerebras](/hi/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. OpenClaw में Cerebras मॉडल प्रदाता समर्थन जोड़ता है.

- **[chutes](/hi/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. OpenClaw में Chutes मॉडल प्रदाता समर्थन जोड़ता है.

- **[clickclack](/hi/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. OpenClaw संदेश भेजने और प्राप्त करने के लिए Clickclack चैनल सतह जोड़ता है.

- **[cloudflare-ai-gateway](/hi/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. OpenClaw में Cloudflare AI Gateway मॉडल प्रदाता समर्थन जोड़ता है.

- **[codex](/hi/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Codex-प्रबंधित GPT कैटलॉग के साथ OpenClaw Codex ऐप-सर्वर हार्नेस और मॉडल प्रदाता Plugin.

- **[copilot](/hi/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. GitHub Copilot एजेंट रनटाइम पंजीकृत करता है.

- **[deepinfra](/hi/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. OpenClaw में DeepInfra मॉडल प्रदाता समर्थन जोड़ता है.

- **[deepseek](/hi/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. OpenClaw में DeepSeek मॉडल प्रदाता समर्थन जोड़ता है.

- **[diagnostics-otel](/hi/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. मेट्रिक्स, ट्रेस और लॉग के लिए OpenClaw डायग्नोस्टिक्स OpenTelemetry एक्सपोर्टर.

- **[diagnostics-prometheus](/hi/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. रनटाइम मेट्रिक्स के लिए OpenClaw डायग्नोस्टिक्स Prometheus एक्सपोर्टर.

- **[diffs](/hi/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. एजेंटों के लिए OpenClaw रीड-ओनली diff viewer Plugin और फ़ाइल रेंडरर.

- **[diffs-language-pack](/hi/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. डिफ़ॉल्ट diffs viewer सेट से बाहर की भाषाओं के लिए सिंटैक्स हाइलाइटिंग जोड़ता है.

- **[discord](/hi/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. चैनलों, DMs, कमांड और ऐप इवेंट्स के लिए OpenClaw Discord चैनल Plugin.

- **[exa](/hi/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. वेब खोज प्रदाता समर्थन जोड़ता है.

- **[feishu](/hi/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. चैट और कार्यस्थल टूल्स के लिए OpenClaw Feishu/Lark चैनल Plugin (@m1heng द्वारा समुदाय-प्रबंधित).

- **[firecrawl](/hi/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. एजेंट-कॉल योग्य टूल्स जोड़ता है. वेब fetch प्रदाता समर्थन जोड़ता है. वेब खोज प्रदाता समर्थन जोड़ता है.

- **[fireworks](/hi/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. OpenClaw में Fireworks मॉडल प्रदाता समर्थन जोड़ता है.

- **[gmi](/hi/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. OpenClaw GMI Cloud प्रदाता Plugin.

- **[google-meet](/hi/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Chrome या Twilio ट्रांसपोर्ट के माध्यम से कॉल में शामिल होने के लिए OpenClaw Google Meet प्रतिभागी Plugin.

- **[googlechat](/hi/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. स्पेसेज़ और सीधे संदेशों के लिए OpenClaw Google Chat चैनल Plugin.

- **[gradium](/hi/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. टेक्स्ट-टू-स्पीच प्रदाता समर्थन जोड़ता है.

- **[groq](/hi/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. OpenClaw में Groq मॉडल प्रदाता समर्थन जोड़ता है.

- **[inworld](/hi/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Inworld स्ट्रीमिंग टेक्स्ट-टू-स्पीच (MP3, OGG_OPUS, PCM telephony).

- **[irc](/hi/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. OpenClaw संदेश भेजने और प्राप्त करने के लिए IRC चैनल सतह जोड़ता है.

- **[kilocode](/hi/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. OpenClaw में Kilocode मॉडल प्रदाता समर्थन जोड़ता है.

- **[kimi](/hi/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. OpenClaw में Kimi, Kimi Coding मॉडल प्रदाता समर्थन जोड़ता है.

- **[line](/hi/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. LINE Bot API चैट्स के लिए OpenClaw LINE चैनल Plugin.

- **[llama-cpp](/hi/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. node-llama-cpp के माध्यम से स्थानीय GGUF embeddings.

- **[lobster](/hi/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. टाइप्ड पाइपलाइनों और फिर से शुरू किए जा सकने वाले अनुमोदनों के लिए Lobster वर्कफ़्लो टूल Plugin.

- **[matrix](/hi/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. रूम्स और सीधे संदेशों के लिए OpenClaw Matrix चैनल Plugin.

- **[mattermost](/hi/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. OpenClaw संदेश भेजने और प्राप्त करने के लिए Mattermost चैनल सतह जोड़ता है.

- **[memory-lancedb](/hi/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. ऑटो-रीकॉल, ऑटो-कैप्चर और वेक्टर खोज के साथ OpenClaw LanceDB-समर्थित दीर्घकालिक मेमोरी Plugin.

- **[moonshot](/hi/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. OpenClaw में Moonshot मॉडल प्रदाता समर्थन जोड़ता है.

- **[msteams](/hi/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. बॉट वार्तालापों के लिए OpenClaw Microsoft Teams चैनल Plugin.

- **[nextcloud-talk](/hi/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. वार्तालापों के लिए OpenClaw Nextcloud Talk चैनल Plugin.

- **[nostr](/hi/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. NIP-04 एन्क्रिप्टेड सीधे संदेशों के लिए OpenClaw Nostr चैनल Plugin.

- **[openshell](/hi/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. मिरर किए गए स्थानीय वर्कस्पेस और SSH कमांड निष्पादन के साथ NVIDIA OpenShell CLI के लिए OpenClaw sandbox backend.

- **[parallel](/hi/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. वेब खोज प्रदाता समर्थन जोड़ता है.

- **[perplexity](/hi/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. वेब खोज प्रदाता समर्थन जोड़ता है.

- **[pixverse](/hi/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. OpenClaw PixVerse वीडियो जनरेशन प्रदाता Plugin.

- **[qianfan](/hi/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. OpenClaw में Qianfan मॉडल प्रदाता समर्थन जोड़ता है.

- **[qqbot](/hi/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. समूह और सीधे-संदेश वर्कफ़्लो के लिए OpenClaw QQ Bot चैनल Plugin.

- **[qwen](/hi/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. OpenClaw में Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI मॉडल प्रदाता समर्थन जोड़ता है.

- **[raft](/hi/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. सुरक्षित CLI वेक ब्रिजों के लिए OpenClaw Raft चैनल Plugin.

- **[searxng](/hi/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. वेब खोज प्रदाता समर्थन जोड़ता है.

- **[signal](/hi/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. OpenClaw संदेश भेजने और प्राप्त करने के लिए Signal चैनल सतह जोड़ता है.

- **[slack](/hi/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. चैनलों, DMs, कमांड और ऐप इवेंट्स के लिए OpenClaw Slack चैनल Plugin.

- **[sms](/hi/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. OpenClaw टेक्स्ट संदेशों के लिए Twilio SMS चैनल Plugin.

- **[stepfun](/hi/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. OpenClaw में StepFun, StepFun Plan मॉडल प्रदाता समर्थन जोड़ता है.

- **[synology-chat](/hi/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. OpenClaw चैनलों और सीधे संदेशों के लिए Synology Chat चैनल Plugin.

- **[tavily](/hi/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. एजेंट-कॉल योग्य टूल्स जोड़ता है. वेब खोज प्रदाता समर्थन जोड़ता है.

- **[tencent](/hi/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. OpenClaw में Tencent TokenHub मॉडल प्रदाता समर्थन जोड़ता है.

- **[tlon](/hi/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. चैट वर्कफ़्लो के लिए OpenClaw Tlon/Urbit चैनल Plugin.

- **[tokenjuice](/hi/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. tokenjuice रिड्यूसर के साथ exec और bash टूल परिणामों को संक्षिप्त करता है.

- **[twitch](/hi/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. चैट और मॉडरेशन वर्कफ़्लो के लिए OpenClaw Twitch चैनल Plugin.

- **[venice](/hi/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. OpenClaw में Venice मॉडल प्रदाता समर्थन जोड़ता है.

- **[vercel-ai-gateway](/hi/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. OpenClaw में Vercel AI Gateway मॉडल प्रदाता समर्थन जोड़ता है.

- **[voice-call](/hi/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Twilio, Telnyx और Plivo फ़ोन कॉलों के लिए OpenClaw voice-call Plugin.

- **[whatsapp](/hi/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. WhatsApp Web चैट्स के लिए OpenClaw WhatsApp चैनल Plugin.

- **[zai](/hi/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. OpenClaw में Z.AI मॉडल प्रदाता समर्थन जोड़ता है.

- **[zalo](/hi/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. बॉट और webhook चैट्स के लिए OpenClaw Zalo चैनल Plugin.

- **[zalouser](/hi/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. नेटिव zca-js इंटीग्रेशन के माध्यम से OpenClaw Zalo Personal Account Plugin.

## केवल स्रोत चेकआउट

3 Plugins

- **[qa-channel](/hi/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - केवल स्रोत चेकआउट. OpenClaw संदेश भेजने और प्राप्त करने के लिए QA Channel सतह जोड़ता है.

- **[qa-lab](/hi/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - केवल स्रोत चेकआउट. निजी डीबगर UI और परिदृश्य रनर के साथ OpenClaw QA lab Plugin.

- **[qa-matrix](/hi/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - केवल स्रोत checkout। Matrix QA transport runner और substrate.
