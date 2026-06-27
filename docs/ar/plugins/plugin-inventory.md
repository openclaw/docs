---
read_when:
    - أنت تقرر ما إذا كان Plugin سيصدر ضمن حزمة npm الأساسية أم يُثبَّت بشكل منفصل
    - أنت تحدّث بيانات تعريف حزمة Plugin المضمّنة أو أتمتة الإصدار.
    - تحتاج إلى القائمة المرجعية للـ Plugin الداخلية مقابل الخارجية
summary: جرد مُولَّد لـ OpenClaw plugins المشحونة في النواة، أو المنشورة خارجيًا، أو المحتفَظ بها كمصدر فقط
title: مخزون Plugin
x-i18n:
    generated_at: "2026-06-27T18:09:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f0c5aa2c3e5f25308a4398dc2582caa8f355a4dfd0d5693d9cfaf1c1ce6926
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# مخزون Plugin

تُنشأ هذه الصفحة من `extensions/*/package.json` و`openclaw.plugin.json`
واستثناءات `files` في حزمة npm الجذرية. أعد إنشاءها باستخدام:

```bash
pnpm plugins:inventory:gen
```

## التعريفات

- **حزمة npm الأساسية:** مضمّنة في حزمة npm باسم `openclaw` ومتاحة بدون تثبيت Plugin منفصل.
- **حزمة خارجية رسمية:** Plugin يصونه OpenClaw ومحذوف من حزمة npm الأساسية، محفوظ في هذا المخزون الرسمي، ويُثبّت عند الطلب عبر ClawHub و/أو npm.
- **نسخة المصدر فقط:** Plugin محلي في المستودع محذوف من مصنوعات npm المنشورة ولا يُعلن عنه كحزمة قابلة للتثبيت.

تختلف نسخ المصدر عن تثبيتات npm: بعد `pnpm install`، تُحمّل
Plugins المضمّنة من `extensions/<id>` بحيث تكون التعديلات المحلية وتبعيات
مساحة العمل المحلية للحزمة متاحة.

## تثبيت Plugin

استخدم مسار التثبيت في كل إدخال لتحديد ما إذا كان التثبيت مطلوبًا. Plugins
التي تذكر `included in OpenClaw` موجودة بالفعل في الحزمة الأساسية.
تحتاج الحزم الخارجية الرسمية إلى تثبيت واحد، ثم إعادة تشغيل Gateway.

على سبيل المثال، Discord حزمة خارجية رسمية:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

أثناء انتقال الإطلاق، لا تزال مواصفات الحزم العارية العادية تُثبّت من npm.
استخدم `clawhub:@openclaw/discord` أو `npm:@openclaw/discord` عندما تحتاج إلى
مصدر صريح. بعد التثبيت، اتبع مستند إعداد Plugin، مثل
[Discord](/ar/channels/discord)، لإضافة بيانات الاعتماد وتهيئة القناة. راجع
[إدارة Plugins](/ar/plugins/manage-plugins) لأوامر التحديث وإلغاء التثبيت والنشر.

يسرد كل إدخال الحزمة، ومسار التوزيع، والوصف.

## حزمة npm الأساسية

59 Plugin

- **[admin-http-rpc](/ar/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - مضمّن في OpenClaw. نقطة نهاية OpenClaw الإدارية لـ HTTP RPC.

- **[alibaba](/ar/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر توليد الفيديو.

- **[anthropic](/ar/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج Anthropic إلى OpenClaw.

- **[azure-speech](/ar/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - مضمّن في OpenClaw. تحويل النص إلى كلام باستخدام Azure AI Speech (MP3، وملاحظات صوتية أصلية Ogg/Opus، وPCM للاتصالات الهاتفية).

- **[bonjour](/ar/plugins/reference/bonjour)** (`@openclaw/bonjour`) - مضمّن في OpenClaw. يعلن عن Gateway المحلي لـ OpenClaw عبر Bonjour/mDNS.

- **[browser](/ar/plugins/reference/browser)** (`@openclaw/browser-plugin`) - مضمّن في OpenClaw. يضيف أدوات قابلة للاستدعاء من الوكيل.

- **[byteplus](/ar/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج BytePlus وBytePlus Plan إلى OpenClaw.

- **[canvas](/ar/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - مضمّن في OpenClaw. أسطح تجريبية للتحكم في Canvas وعرض A2UI للعُقد المقترنة.

- **[codex-supervisor](/ar/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - مضمّن في OpenClaw. الإشراف على جلسات خادم تطبيق Codex من OpenClaw.

- **[cohere](/ar/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - مضمّن في OpenClaw؛ npm؛ ClawHub: `clawhub:@openclaw/cohere-provider`. Plugin موفّر Cohere لـ OpenClaw.

- **[comfy](/ar/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج ComfyUI إلى OpenClaw.

- **[copilot-proxy](/ar/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج Copilot Proxy إلى OpenClaw.

- **[deepgram](/ar/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر فهم الوسائط. يضيف دعم موفّر النسخ الفوري.

- **[document-extract](/ar/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - مضمّن في OpenClaw. يستخرج النص وصور صفحات احتياطية من مرفقات المستندات المحلية.

- **[duckduckgo](/ar/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - مضمّن في OpenClaw. يضيف دعم موفّر البحث على الويب.

- **[elevenlabs](/ar/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - مضمّن في OpenClaw. يضيف دعم موفّر فهم الوسائط. يضيف دعم موفّر النسخ الفوري. يضيف دعم موفّر تحويل النص إلى كلام.

- **[fal](/ar/plugins/reference/fal)** (`@openclaw/fal-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج fal إلى OpenClaw.

- **[file-transfer](/ar/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - مضمّن في OpenClaw. يجلب الملفات ويسردها ويكتبها على العُقد المقترنة عبر أوامر عُقد مخصصة. يتجاوز اقتطاع stdout في bash باستخدام base64 عبر node.invoke للملفات الثنائية حتى 16 MB.

- **[github-copilot](/ar/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج GitHub Copilot إلى OpenClaw.

- **[google](/ar/plugins/reference/google)** (`@openclaw/google-plugin`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج Google وGoogle Gemini CLI وGoogle Vertex إلى OpenClaw.

- **[huggingface](/ar/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج Hugging Face إلى OpenClaw.

- **[imessage](/ar/plugins/reference/imessage)** (`@openclaw/imessage`) - مضمّن في OpenClaw. يضيف سطح قناة iMessage لإرسال رسائل OpenClaw واستلامها.

- **[litellm](/ar/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج LiteLLM إلى OpenClaw.

- **[llm-task](/ar/plugins/reference/llm-task)** (`@openclaw/llm-task`) - مضمّن في OpenClaw. أداة LLM عامة تعتمد JSON فقط للمهام المنظمة القابلة للاستدعاء من سير العمل.

- **[lmstudio](/ar/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج LM Studio إلى OpenClaw.

- **[memory-core](/ar/plugins/reference/memory-core)** (`@openclaw/memory-core`) - مضمّن في OpenClaw. يضيف أدوات قابلة للاستدعاء من الوكيل.

- **[memory-wiki](/ar/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - مضمّن في OpenClaw. مُصرّف ويكي مستمر وخزنة معرفة ملائمة لـ Obsidian من أجل OpenClaw.

- **[microsoft](/ar/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - مضمّن في OpenClaw. يضيف دعم موفّر تحويل النص إلى كلام.

- **[microsoft-foundry](/ar/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج Microsoft Foundry إلى OpenClaw.

- **[migrate-claude](/ar/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - مضمّن في OpenClaw. يستورد تعليمات Claude Code وClaude Desktop وخوادم MCP وSkills والتهيئة الآمنة إلى OpenClaw.

- **[migrate-hermes](/ar/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - مضمّن في OpenClaw. يستورد تهيئة Hermes والذكريات وSkills وبيانات الاعتماد المدعومة إلى OpenClaw.

- **[minimax](/ar/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج MiniMax وMiniMax Portal إلى OpenClaw.

- **[mistral](/ar/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج Mistral إلى OpenClaw.

- **[novita](/ar/plugins/reference/novita)** (`@openclaw/novita-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج Novita وNovita AI وNovitaai إلى OpenClaw.

- **[nvidia](/ar/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج NVIDIA إلى OpenClaw.

- **[oc-path](/ar/plugins/reference/oc-path)** (`@openclaw/oc-path`) - مضمّن في OpenClaw. يضيف CLI لمسار openclaw من أجل عنونة ملفات مساحة العمل `oc://`.

- **[ollama](/ar/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج Ollama وOllama Cloud إلى OpenClaw.

- **[open-prose](/ar/plugins/reference/open-prose)** (`@openclaw/open-prose`) - مضمّن في OpenClaw. حزمة Skills لـ OpenProse VM مع أمر شرطة مائلة /prose.

- **[openai](/ar/plugins/reference/openai)** (`@openclaw/openai-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج OpenAI إلى OpenClaw.

- **[opencode](/ar/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج OpenCode إلى OpenClaw.

- **[opencode-go](/ar/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج OpenCode Go إلى OpenClaw.

- **[openrouter](/ar/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج OpenRouter إلى OpenClaw.

- **[policy](/ar/plugins/reference/policy)** (`@openclaw/policy`) - مضمّن في OpenClaw. يضيف فحوصات doctor مدعومة بالسياسات لمطابقة مساحة العمل.

- **[runway](/ar/plugins/reference/runway)** (`@openclaw/runway-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر توليد الفيديو.

- **[senseaudio](/ar/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر فهم الوسائط.

- **[sglang](/ar/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج SGLang إلى OpenClaw.

- **[synthetic](/ar/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج Synthetic إلى OpenClaw.

- **[telegram](/ar/plugins/reference/telegram)** (`@openclaw/telegram`) - مضمّن في OpenClaw. يضيف سطح قناة Telegram لإرسال رسائل OpenClaw واستلامها.

- **[together](/ar/plugins/reference/together)** (`@openclaw/together-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج Together إلى OpenClaw.

- **[tts-local-cli](/ar/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - مضمّن في OpenClaw. يضيف دعم موفّر تحويل النص إلى كلام.

- **[vllm](/ar/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج vLLM إلى OpenClaw.

- **[volcengine](/ar/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج Volcengine وVolcengine Plan إلى OpenClaw.

- **[voyage](/ar/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر تضمين الذاكرة.

- **[vydra](/ar/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج Vydra إلى OpenClaw.

- **[web-readability](/ar/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - مضمّن في OpenClaw. يستخرج محتوى المقالات القابل للقراءة من استجابات جلب ويب HTML المحلية.

- **[webhooks](/ar/plugins/reference/webhooks)** (`@openclaw/webhooks`) - مضمّن في OpenClaw. Webhooks واردة مصادَق عليها تربط الأتمتة الخارجية بـ TaskFlows في OpenClaw.

- **[workboard](/ar/plugins/reference/workboard)** (`@openclaw/workboard`) - مضمّن في OpenClaw. لوحة عمل للوحة التحكم للمشكلات والجلسات المملوكة للوكيل.

- **[xai](/ar/plugins/reference/xai)** (`@openclaw/xai-plugin`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج xAI إلى OpenClaw.

- **[xiaomi](/ar/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - مضمّن في OpenClaw. يضيف دعم موفّر نماذج Xiaomi وXiaomi Token Plan إلى OpenClaw.

## الحزم الخارجية الرسمية

68 Plugin

- **[acpx](/ar/plugins/reference/acpx)** (`@openclaw/acpx`) - npm؛ ClawHub. خلفية تشغيل ACP لـ OpenClaw مع إدارة الجلسات والنقل المملوكة لـ Plugin.

- **[amazon-bedrock](/ar/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm؛ ClawHub. Plugin موفّر Amazon Bedrock لـ OpenClaw مع اكتشاف النماذج والتضمينات ودعم حواجز الحماية.

- **[amazon-bedrock-mantle](/ar/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm؛ ClawHub. Plugin موفر OpenClaw Amazon Bedrock Mantle لتوجيه النماذج المتوافق مع OpenAI.

- **[anthropic-vertex](/ar/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm؛ ClawHub. Plugin موفر OpenClaw Anthropic Vertex لنماذج Claude على Google Vertex AI.

- **[arcee](/ar/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm؛ ClawHub: `clawhub:@openclaw/arcee-provider`. يضيف دعم موفر نماذج Arcee إلى OpenClaw.

- **[brave](/ar/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm؛ ClawHub. Plugin موفر OpenClaw Brave Search للبحث على الويب.

- **[cerebras](/ar/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm؛ ClawHub: `clawhub:@openclaw/cerebras-provider`. يضيف دعم موفر نماذج Cerebras إلى OpenClaw.

- **[chutes](/ar/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm؛ ClawHub: `clawhub:@openclaw/chutes-provider`. يضيف دعم موفر نماذج Chutes إلى OpenClaw.

- **[clickclack](/ar/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm؛ ClawHub: `clawhub:@openclaw/clickclack`. يضيف سطح قناة Clickclack لإرسال رسائل OpenClaw واستقبالها.

- **[cloudflare-ai-gateway](/ar/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm؛ ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. يضيف دعم موفر نماذج Cloudflare AI Gateway إلى OpenClaw.

- **[codex](/ar/plugins/reference/codex)** (`@openclaw/codex`) - npm؛ ClawHub. Plugin موفر النماذج وحزام خادم تطبيقات OpenClaw Codex مع كتالوج GPT مُدار من Codex.

- **[copilot](/ar/plugins/reference/copilot)** (`@openclaw/copilot`) - npm؛ ClawHub: `clawhub:@openclaw/copilot`. يسجل وقت تشغيل وكيل GitHub Copilot.

- **[deepinfra](/ar/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm؛ ClawHub: `clawhub:@openclaw/deepinfra-provider`. يضيف دعم موفر نماذج DeepInfra إلى OpenClaw.

- **[deepseek](/ar/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm؛ ClawHub: `clawhub:@openclaw/deepseek-provider`. يضيف دعم موفر نماذج DeepSeek إلى OpenClaw.

- **[diagnostics-otel](/ar/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm؛ ClawHub: `clawhub:@openclaw/diagnostics-otel`. مُصدّر تشخيصات OpenClaw OpenTelemetry للمقاييس والتتبعات والسجلات.

- **[diagnostics-prometheus](/ar/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm؛ ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. مُصدّر تشخيصات OpenClaw Prometheus لمقاييس وقت التشغيل.

- **[diffs](/ar/plugins/reference/diffs)** (`@openclaw/diffs`) - npm؛ ClawHub. Plugin عارض فروق OpenClaw للقراءة فقط ومصيّر الملفات للوكلاء.

- **[diffs-language-pack](/ar/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm؛ ClawHub: `clawhub:@openclaw/diffs-language-pack`. يضيف إبراز الصياغة للغات خارج مجموعة عارض الفروق الافتراضية.

- **[discord](/ar/plugins/reference/discord)** (`@openclaw/discord`) - npm؛ ClawHub. Plugin قناة OpenClaw Discord للقنوات والرسائل الخاصة والأوامر وأحداث التطبيق.

- **[exa](/ar/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm؛ ClawHub: `clawhub:@openclaw/exa-plugin`. يضيف دعم موفر البحث على الويب.

- **[feishu](/ar/plugins/reference/feishu)** (`@openclaw/feishu`) - npm؛ ClawHub. Plugin قناة OpenClaw Feishu/Lark للمحادثات وأدوات مكان العمل (يصونه المجتمع بواسطة @m1heng).

- **[firecrawl](/ar/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm؛ ClawHub: `clawhub:@openclaw/firecrawl-plugin`. يضيف أدوات قابلة للاستدعاء من الوكيل. يضيف دعم موفر جلب الويب. يضيف دعم موفر البحث على الويب.

- **[fireworks](/ar/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm؛ ClawHub: `clawhub:@openclaw/fireworks-provider`. يضيف دعم موفر نماذج Fireworks إلى OpenClaw.

- **[gmi](/ar/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm؛ ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin موفر OpenClaw GMI Cloud.

- **[google-meet](/ar/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm؛ ClawHub. Plugin مشارك OpenClaw Google Meet للانضمام إلى المكالمات عبر وسائل نقل Chrome أو Twilio.

- **[googlechat](/ar/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm؛ ClawHub. Plugin قناة OpenClaw Google Chat للمساحات والرسائل المباشرة.

- **[gradium](/ar/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm؛ ClawHub: `clawhub:@openclaw/gradium-speech`. يضيف دعم موفر تحويل النص إلى كلام.

- **[groq](/ar/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm؛ ClawHub: `clawhub:@openclaw/groq-provider`. يضيف دعم موفر نماذج Groq إلى OpenClaw.

- **[inworld](/ar/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm؛ ClawHub: `clawhub:@openclaw/inworld-speech`. تحويل نص إلى كلام متدفق من Inworld (MP3 وOGG_OPUS واتصالات PCM الهاتفية).

- **[irc](/ar/plugins/reference/irc)** (`@openclaw/irc`) - npm؛ ClawHub: `clawhub:@openclaw/irc`. يضيف سطح قناة IRC لإرسال رسائل OpenClaw واستقبالها.

- **[kilocode](/ar/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm؛ ClawHub: `clawhub:@openclaw/kilocode-provider`. يضيف دعم موفر نماذج Kilocode إلى OpenClaw.

- **[kimi](/ar/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm؛ ClawHub: `clawhub:@openclaw/kimi-provider`. يضيف دعم موفر نماذج Kimi وKimi Coding إلى OpenClaw.

- **[line](/ar/plugins/reference/line)** (`@openclaw/line`) - npm؛ ClawHub. Plugin قناة OpenClaw LINE لمحادثات LINE Bot API.

- **[llama-cpp](/ar/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm؛ ClawHub. تضمينات GGUF محلية عبر node-llama-cpp.

- **[lobster](/ar/plugins/reference/lobster)** (`@openclaw/lobster`) - npm؛ ClawHub. Plugin أداة سير عمل Lobster لخطوط المعالجة الموصوفة نوعيًا والموافقات القابلة للاستئناف.

- **[matrix](/ar/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`؛ npm. Plugin قناة OpenClaw Matrix للغرف والرسائل المباشرة.

- **[mattermost](/ar/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm؛ ClawHub: `clawhub:@openclaw/mattermost`. يضيف سطح قناة Mattermost لإرسال رسائل OpenClaw واستقبالها.

- **[memory-lancedb](/ar/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm؛ ClawHub. Plugin ذاكرة طويلة الأمد مدعوم بـ LanceDB في OpenClaw مع الاستدعاء التلقائي والالتقاط التلقائي والبحث المتجهي.

- **[moonshot](/ar/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm؛ ClawHub: `clawhub:@openclaw/moonshot-provider`. يضيف دعم موفر نماذج Moonshot إلى OpenClaw.

- **[msteams](/ar/plugins/reference/msteams)** (`@openclaw/msteams`) - npm؛ ClawHub. Plugin قناة OpenClaw Microsoft Teams لمحادثات الروبوتات.

- **[nextcloud-talk](/ar/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm؛ ClawHub. Plugin قناة OpenClaw Nextcloud Talk للمحادثات.

- **[nostr](/ar/plugins/reference/nostr)** (`@openclaw/nostr`) - npm؛ ClawHub. Plugin قناة OpenClaw Nostr للرسائل المباشرة المشفرة وفق NIP-04.

- **[openshell](/ar/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm؛ ClawHub. خلفية صندوق رمل OpenClaw لـ NVIDIA OpenShell CLI مع مساحات عمل محلية منعكسة وتنفيذ أوامر SSH.

- **[parallel](/ar/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm؛ ClawHub: `clawhub:@openclaw/parallel-plugin`. يضيف دعم موفر البحث على الويب.

- **[perplexity](/ar/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm؛ ClawHub: `clawhub:@openclaw/perplexity-plugin`. يضيف دعم موفر البحث على الويب.

- **[pixverse](/ar/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm؛ ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin موفر توليد الفيديو OpenClaw PixVerse.

- **[qianfan](/ar/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm؛ ClawHub: `clawhub:@openclaw/qianfan-provider`. يضيف دعم موفر نماذج Qianfan إلى OpenClaw.

- **[qqbot](/ar/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm؛ ClawHub. Plugin قناة OpenClaw QQ Bot لسير عمل المجموعات والرسائل المباشرة.

- **[qwen](/ar/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm؛ ClawHub: `clawhub:@openclaw/qwen-provider`. يضيف دعم موفر نماذج Qwen وQwen Cloud وModel Studio وDashScope وQwen Oauth وQwen Portal وQwen CLI إلى OpenClaw.

- **[raft](/ar/plugins/reference/raft)** (`@openclaw/raft`) - npm؛ ClawHub. Plugin قناة OpenClaw Raft لجسور إيقاظ CLI الآمنة.

- **[searxng](/ar/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm؛ ClawHub: `clawhub:@openclaw/searxng-plugin`. يضيف دعم موفر البحث على الويب.

- **[signal](/ar/plugins/reference/signal)** (`@openclaw/signal`) - npm؛ ClawHub: `clawhub:@openclaw/signal`. يضيف سطح قناة Signal لإرسال رسائل OpenClaw واستقبالها.

- **[slack](/ar/plugins/reference/slack)** (`@openclaw/slack`) - npm؛ ClawHub. Plugin قناة OpenClaw Slack للقنوات والرسائل الخاصة والأوامر وأحداث التطبيق.

- **[sms](/ar/plugins/reference/sms)** (`@openclaw/sms`) - npm؛ ClawHub: `clawhub:@openclaw/sms`. Plugin قناة Twilio SMS لرسائل OpenClaw النصية.

- **[stepfun](/ar/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm؛ ClawHub: `clawhub:@openclaw/stepfun-provider`. يضيف دعم موفر نماذج StepFun وStepFun Plan إلى OpenClaw.

- **[synology-chat](/ar/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm؛ ClawHub. Plugin قناة Synology Chat لقنوات OpenClaw والرسائل المباشرة.

- **[tavily](/ar/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm؛ ClawHub: `clawhub:@openclaw/tavily-plugin`. يضيف أدوات قابلة للاستدعاء من الوكيل. يضيف دعم موفر البحث على الويب.

- **[tencent](/ar/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm؛ ClawHub: `clawhub:@openclaw/tencent-provider`. يضيف دعم موفر نماذج Tencent TokenHub إلى OpenClaw.

- **[tlon](/ar/plugins/reference/tlon)** (`@openclaw/tlon`) - npm؛ ClawHub. Plugin قناة OpenClaw Tlon/Urbit لسير عمل الدردشة.

- **[tokenjuice](/ar/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm؛ ClawHub: `clawhub:@openclaw/tokenjuice`. يضغط نتائج أدوات exec وbash باستخدام مخفِّضات tokenjuice.

- **[twitch](/ar/plugins/reference/twitch)** (`@openclaw/twitch`) - npm؛ ClawHub. Plugin قناة OpenClaw Twitch لسير عمل الدردشة والإشراف.

- **[venice](/ar/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm؛ ClawHub: `clawhub:@openclaw/venice-provider`. يضيف دعم موفر نماذج Venice إلى OpenClaw.

- **[vercel-ai-gateway](/ar/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm؛ ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. يضيف دعم موفر نماذج Vercel AI Gateway إلى OpenClaw.

- **[voice-call](/ar/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm؛ ClawHub. Plugin voice-call في OpenClaw لمكالمات Twilio وTelnyx وPlivo الهاتفية.

- **[whatsapp](/ar/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`؛ npm. Plugin قناة OpenClaw WhatsApp لمحادثات WhatsApp Web.

- **[zai](/ar/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm؛ ClawHub: `clawhub:@openclaw/zai-provider`. يضيف دعم موفر نماذج Z.AI إلى OpenClaw.

- **[zalo](/ar/plugins/reference/zalo)** (`@openclaw/zalo`) - npm؛ ClawHub. Plugin قناة OpenClaw Zalo لمحادثات الروبوت وWebhook.

- **[zalouser](/ar/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm؛ ClawHub. Plugin الحساب الشخصي OpenClaw Zalo عبر تكامل zca-js الأصلي.

## سحب المصدر فقط

3 Plugins

- **[qa-channel](/ar/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - سحب المصدر فقط. يضيف سطح QA Channel لإرسال رسائل OpenClaw واستقبالها.

- **[qa-lab](/ar/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - سحب المصدر فقط. Plugin مختبر OpenClaw QA مع واجهة مستخدم خاصة لمصحح الأخطاء ومشغّل السيناريوهات.

- **[qa-matrix](/ar/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - فحص المصدر فقط. مشغّل نقل مصفوفة ضمان الجودة وركيزتها.
