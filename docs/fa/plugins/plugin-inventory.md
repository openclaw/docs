---
read_when:
    - شما در حال تصمیم‌گیری هستید که آیا یک Plugin همراه بستهٔ اصلی npm عرضه شود یا جداگانه نصب شود
    - شما در حال به‌روزرسانی فرادادهٔ بستهٔ Plugin همراه یا خودکارسازی انتشار هستید
    - به فهرست canonical داخلی در برابر خارجی Plugin نیاز دارید
summary: فهرست موجودی تولیدشده از Pluginهای OpenClaw که همراه هسته عرضه شده‌اند، به‌صورت خارجی منتشر شده‌اند، یا فقط در سطح کد منبع نگه داشته می‌شوند
title: فهرست موجودی Plugin
x-i18n:
    generated_at: "2026-07-04T03:58:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1af48e3d1ca8e994780dae2ac39dd2d3c3ed0bc8c136cbf3448fe18fadddfb0a
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# فهرست Plugin

این صفحه از `extensions/*/package.json`، `openclaw.plugin.json`،
و استثناهای `files` در بسته npm ریشه تولید شده است. آن را با دستور زیر بازتولید کنید:

```bash
pnpm plugins:inventory:gen
```

## تعاریف

- **بسته npm هسته:** در بسته npm به نام `openclaw` ساخته شده و بدون نصب جداگانه Plugin در دسترس است.
- **بسته رسمی خارجی:** Plugin تحت نگهداری OpenClaw که از بسته npm هسته حذف شده، در این فهرست رسمی نگه داشته می‌شود، و هنگام نیاز از طریق ClawHub و/یا npm نصب می‌شود.
- **فقط checkout منبع:** Plugin محلی مخزن که از آرتیفکت‌های منتشرشده npm حذف شده و به‌عنوان بسته قابل نصب معرفی نمی‌شود.

checkoutهای منبع با نصب‌های npm متفاوت‌اند: پس از `pnpm install`، Pluginهای باندل‌شده
از `extensions/<id>` بارگذاری می‌شوند تا ویرایش‌های محلی و وابستگی‌های workspace
محلی همان بسته در دسترس باشند.

## نصب یک Plugin

از مسیر نصب در هر ورودی استفاده کنید تا تصمیم بگیرید آیا نصب لازم است یا نه. Pluginهایی
که می‌گویند `included in OpenClaw` از قبل در بسته هسته وجود دارند.
بسته‌های رسمی خارجی به یک نصب نیاز دارند، سپس یک راه‌اندازی دوباره Gateway.

برای نمونه، Discord یک بسته رسمی خارجی است:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

در طول جابه‌جایی زمان راه‌اندازی، مشخصات معمول بسته‌های bare همچنان از npm نصب می‌شوند.
وقتی به یک منبع صریح نیاز دارید، از `clawhub:@openclaw/discord` یا `npm:@openclaw/discord` استفاده کنید.
پس از نصب، سند راه‌اندازی Plugin را دنبال کنید، مانند
[Discord](/fa/channels/discord)، تا اعتبارنامه‌ها و پیکربندی کانال را اضافه کنید. برای فرمان‌های
به‌روزرسانی، حذف نصب، و انتشار، [مدیریت Pluginها](/fa/plugins/manage-plugins) را ببینید.

هر ورودی بسته، مسیر توزیع، و توضیح را فهرست می‌کند.

## بسته npm هسته

۶۰ Plugin

- **[admin-http-rpc](/fa/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - در OpenClaw گنجانده شده است. نقطه پایانی HTTP RPC مدیریتی OpenClaw.

- **[alibaba](/fa/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده تولید ویدئو را اضافه می‌کند.

- **[anthropic](/fa/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل Anthropic را به OpenClaw اضافه می‌کند.

- **[azure-speech](/fa/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - در OpenClaw گنجانده شده است. تبدیل متن به گفتار Azure AI Speech (MP3، یادداشت‌های صوتی بومی Ogg/Opus، تلفنی PCM).

- **[bonjour](/fa/plugins/reference/bonjour)** (`@openclaw/bonjour`) - در OpenClaw گنجانده شده است. Gateway محلی OpenClaw را از طریق Bonjour/mDNS تبلیغ می‌کند.

- **[browser](/fa/plugins/reference/browser)** (`@openclaw/browser-plugin`) - در OpenClaw گنجانده شده است. ابزارهای قابل فراخوانی توسط عامل را اضافه می‌کند.

- **[byteplus](/fa/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل BytePlus و BytePlus Plan را به OpenClaw اضافه می‌کند.

- **[canvas](/fa/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - در OpenClaw گنجانده شده است. سطوح آزمایشی کنترل Canvas و رندر A2UI برای گره‌های جفت‌شده.

- **[clawrouter](/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل ClawRouter را به OpenClaw اضافه می‌کند.

- **[codex-supervisor](/fa/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - در OpenClaw گنجانده شده است. جلسه‌های app-server مربوط به Codex را از OpenClaw نظارت می‌کند.

- **[cohere](/fa/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - در OpenClaw گنجانده شده است؛ npm؛ ClawHub: `clawhub:@openclaw/cohere-provider`. Plugin ارائه‌دهنده Cohere برای OpenClaw.

- **[comfy](/fa/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل ComfyUI را به OpenClaw اضافه می‌کند.

- **[copilot-proxy](/fa/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل Copilot Proxy را به OpenClaw اضافه می‌کند.

- **[deepgram](/fa/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده درک رسانه را اضافه می‌کند. پشتیبانی ارائه‌دهنده رونویسی بی‌درنگ را اضافه می‌کند.

- **[document-extract](/fa/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - در OpenClaw گنجانده شده است. متن و تصاویر صفحه جایگزین را از پیوست‌های سند محلی استخراج می‌کند.

- **[duckduckgo](/fa/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده جست‌وجوی وب را اضافه می‌کند.

- **[elevenlabs](/fa/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده درک رسانه را اضافه می‌کند. پشتیبانی ارائه‌دهنده رونویسی بی‌درنگ را اضافه می‌کند. پشتیبانی ارائه‌دهنده تبدیل متن به گفتار را اضافه می‌کند.

- **[fal](/fa/plugins/reference/fal)** (`@openclaw/fal-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل fal را به OpenClaw اضافه می‌کند.

- **[file-transfer](/fa/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - در OpenClaw گنجانده شده است. فایل‌ها را روی گره‌های جفت‌شده از طریق فرمان‌های اختصاصی گره واکشی، فهرست و نوشتن می‌کند. با استفاده از base64 روی node.invoke برای فایل‌های دودویی تا ۱۶ مگابایت، کوتاه‌سازی stdout در bash را دور می‌زند.

- **[github-copilot](/fa/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل GitHub Copilot را به OpenClaw اضافه می‌کند.

- **[google](/fa/plugins/reference/google)** (`@openclaw/google-plugin`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل Google، Google Gemini CLI، و Google Vertex را به OpenClaw اضافه می‌کند.

- **[huggingface](/fa/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل Hugging Face را به OpenClaw اضافه می‌کند.

- **[imessage](/fa/plugins/reference/imessage)** (`@openclaw/imessage`) - در OpenClaw گنجانده شده است. سطح کانال iMessage را برای ارسال و دریافت پیام‌های OpenClaw اضافه می‌کند.

- **[litellm](/fa/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل LiteLLM را به OpenClaw اضافه می‌کند.

- **[llm-task](/fa/plugins/reference/llm-task)** (`@openclaw/llm-task`) - در OpenClaw گنجانده شده است. ابزار LLM عمومی فقط JSON برای وظایف ساختاریافته که از workflowها قابل فراخوانی است.

- **[lmstudio](/fa/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل LM Studio را به OpenClaw اضافه می‌کند.

- **[memory-core](/fa/plugins/reference/memory-core)** (`@openclaw/memory-core`) - در OpenClaw گنجانده شده است. ابزارهای قابل فراخوانی توسط عامل را اضافه می‌کند.

- **[memory-wiki](/fa/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - در OpenClaw گنجانده شده است. کامپایلر wiki پایدار و مخزن دانش سازگار با Obsidian برای OpenClaw.

- **[microsoft](/fa/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده تبدیل متن به گفتار را اضافه می‌کند.

- **[microsoft-foundry](/fa/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل Microsoft Foundry را به OpenClaw اضافه می‌کند.

- **[migrate-claude](/fa/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - در OpenClaw گنجانده شده است. دستورالعمل‌های Claude Code و Claude Desktop، سرورهای MCP، Skills، و پیکربندی امن را به OpenClaw وارد می‌کند.

- **[migrate-hermes](/fa/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - در OpenClaw گنجانده شده است. پیکربندی Hermes، حافظه‌ها، Skills، و اعتبارنامه‌های پشتیبانی‌شده را به OpenClaw وارد می‌کند.

- **[minimax](/fa/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل MiniMax و MiniMax Portal را به OpenClaw اضافه می‌کند.

- **[mistral](/fa/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل Mistral را به OpenClaw اضافه می‌کند.

- **[novita](/fa/plugins/reference/novita)** (`@openclaw/novita-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل Novita، Novita AI، و Novitaai را به OpenClaw اضافه می‌کند.

- **[nvidia](/fa/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل NVIDIA را به OpenClaw اضافه می‌کند.

- **[oc-path](/fa/plugins/reference/oc-path)** (`@openclaw/oc-path`) - در OpenClaw گنجانده شده است. CLI مسیر openclaw را برای آدرس‌دهی فایل workspace با oc:// اضافه می‌کند.

- **[ollama](/fa/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل Ollama و Ollama Cloud را به OpenClaw اضافه می‌کند.

- **[open-prose](/fa/plugins/reference/open-prose)** (`@openclaw/open-prose`) - در OpenClaw گنجانده شده است. بسته Skills مربوط به OpenProse VM با یک فرمان slash به نام /prose.

- **[openai](/fa/plugins/reference/openai)** (`@openclaw/openai-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل OpenAI را به OpenClaw اضافه می‌کند.

- **[opencode](/fa/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل OpenCode را به OpenClaw اضافه می‌کند.

- **[opencode-go](/fa/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل OpenCode Go را به OpenClaw اضافه می‌کند.

- **[openrouter](/fa/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل OpenRouter را به OpenClaw اضافه می‌کند.

- **[policy](/fa/plugins/reference/policy)** (`@openclaw/policy`) - در OpenClaw گنجانده شده است. بررسی‌های doctor مبتنی بر policy را برای انطباق workspace اضافه می‌کند.

- **[runway](/fa/plugins/reference/runway)** (`@openclaw/runway-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده تولید ویدئو را اضافه می‌کند.

- **[senseaudio](/fa/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده درک رسانه را اضافه می‌کند.

- **[sglang](/fa/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل SGLang را به OpenClaw اضافه می‌کند.

- **[synthetic](/fa/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل Synthetic را به OpenClaw اضافه می‌کند.

- **[telegram](/fa/plugins/reference/telegram)** (`@openclaw/telegram`) - در OpenClaw گنجانده شده است. سطح کانال Telegram را برای ارسال و دریافت پیام‌های OpenClaw اضافه می‌کند.

- **[together](/fa/plugins/reference/together)** (`@openclaw/together-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل Together را به OpenClaw اضافه می‌کند.

- **[tts-local-cli](/fa/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده تبدیل متن به گفتار را اضافه می‌کند.

- **[vllm](/fa/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل vLLM را به OpenClaw اضافه می‌کند.

- **[volcengine](/fa/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل Volcengine و Volcengine Plan را به OpenClaw اضافه می‌کند.

- **[voyage](/fa/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده embedding حافظه را اضافه می‌کند.

- **[vydra](/fa/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل Vydra را به OpenClaw اضافه می‌کند.

- **[web-readability](/fa/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - در OpenClaw گنجانده شده است. محتوای خوانای مقاله را از پاسخ‌های واکشی وب HTML محلی استخراج می‌کند.

- **[webhooks](/fa/plugins/reference/webhooks)** (`@openclaw/webhooks`) - در OpenClaw گنجانده شده است. Webhookهای ورودی احرازهویت‌شده که اتوماسیون خارجی را به TaskFlowهای OpenClaw متصل می‌کنند.

- **[workboard](/fa/plugins/reference/workboard)** (`@openclaw/workboard`) - در OpenClaw گنجانده شده است. workboard داشبورد برای مسئله‌ها و جلسه‌های تحت مالکیت عامل.

- **[xai](/fa/plugins/reference/xai)** (`@openclaw/xai-plugin`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل xAI را به OpenClaw اضافه می‌کند.

- **[xiaomi](/fa/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - در OpenClaw گنجانده شده است. پشتیبانی ارائه‌دهنده مدل Xiaomi و Xiaomi Token Plan را به OpenClaw اضافه می‌کند.

## بسته‌های رسمی خارجی

۶۸ Plugin

- **[acpx](/fa/plugins/reference/acpx)** (`@openclaw/acpx`) - npm؛ ClawHub. backend زمان اجرای ACP برای OpenClaw با مدیریت جلسه و انتقال تحت مالکیت Plugin.

- **[amazon-bedrock](/fa/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm؛ ClawHub. Plugin ارائه‌دهنده Amazon Bedrock برای OpenClaw با پشتیبانی از کشف مدل، embeddings، و guardrail.

- **[amazon-bedrock-mantle](/fa/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm؛ ClawHub. Plugin ارائه‌دهنده OpenClaw Amazon Bedrock Mantle برای مسیریابی مدل سازگار با OpenAI.

- **[anthropic-vertex](/fa/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm؛ ClawHub. Plugin ارائه‌دهنده OpenClaw Anthropic Vertex برای مدل‌های Claude روی Google Vertex AI.

- **[arcee](/fa/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm؛ ClawHub: `clawhub:@openclaw/arcee-provider`. پشتیبانی از ارائه‌دهنده مدل Arcee را به OpenClaw اضافه می‌کند.

- **[brave](/fa/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm؛ ClawHub. Plugin ارائه‌دهنده OpenClaw Brave Search برای جستجوی وب.

- **[cerebras](/fa/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm؛ ClawHub: `clawhub:@openclaw/cerebras-provider`. پشتیبانی از ارائه‌دهنده مدل Cerebras را به OpenClaw اضافه می‌کند.

- **[chutes](/fa/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm؛ ClawHub: `clawhub:@openclaw/chutes-provider`. پشتیبانی از ارائه‌دهنده مدل Chutes را به OpenClaw اضافه می‌کند.

- **[clickclack](/fa/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm؛ ClawHub: `clawhub:@openclaw/clickclack`. سطح کانال Clickclack را برای ارسال و دریافت پیام‌های OpenClaw اضافه می‌کند.

- **[cloudflare-ai-gateway](/fa/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm؛ ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. پشتیبانی از ارائه‌دهنده مدل Cloudflare AI Gateway را به OpenClaw اضافه می‌کند.

- **[codex](/fa/plugins/reference/codex)** (`@openclaw/codex`) - npm؛ ClawHub. Plugin چارچوب app-server و ارائه‌دهنده مدل OpenClaw Codex با کاتالوگ GPT مدیریت‌شده توسط Codex.

- **[copilot](/fa/plugins/reference/copilot)** (`@openclaw/copilot`) - npm؛ ClawHub: `clawhub:@openclaw/copilot`. زمان اجرای عامل GitHub Copilot را ثبت می‌کند.

- **[deepinfra](/fa/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm؛ ClawHub: `clawhub:@openclaw/deepinfra-provider`. پشتیبانی از ارائه‌دهنده مدل DeepInfra را به OpenClaw اضافه می‌کند.

- **[deepseek](/fa/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm؛ ClawHub: `clawhub:@openclaw/deepseek-provider`. پشتیبانی از ارائه‌دهنده مدل DeepSeek را به OpenClaw اضافه می‌کند.

- **[diagnostics-otel](/fa/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm؛ ClawHub: `clawhub:@openclaw/diagnostics-otel`. صادرکننده OpenTelemetry تشخیص‌های OpenClaw برای معیارها، ردگیری‌ها، و لاگ‌ها.

- **[diagnostics-prometheus](/fa/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm؛ ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. صادرکننده Prometheus تشخیص‌های OpenClaw برای معیارهای زمان اجرا.

- **[diffs](/fa/plugins/reference/diffs)** (`@openclaw/diffs`) - npm؛ ClawHub. Plugin نمایشگر diff فقط‌خواندنی و رندرکننده فایل OpenClaw برای عامل‌ها.

- **[diffs-language-pack](/fa/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm؛ ClawHub: `clawhub:@openclaw/diffs-language-pack`. برجسته‌سازی نحوی را برای زبان‌های خارج از مجموعه پیش‌فرض نمایشگر diff اضافه می‌کند.

- **[discord](/fa/plugins/reference/discord)** (`@openclaw/discord`) - npm؛ ClawHub. Plugin کانال OpenClaw Discord برای کانال‌ها، پیام‌های مستقیم، فرمان‌ها، و رویدادهای برنامه.

- **[exa](/fa/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm؛ ClawHub: `clawhub:@openclaw/exa-plugin`. پشتیبانی از ارائه‌دهنده جستجوی وب را اضافه می‌کند.

- **[feishu](/fa/plugins/reference/feishu)** (`@openclaw/feishu`) - npm؛ ClawHub. Plugin کانال OpenClaw Feishu/Lark برای چت‌ها و ابزارهای محل کار (نگهداری‌شده توسط جامعه با @m1heng).

- **[firecrawl](/fa/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm؛ ClawHub: `clawhub:@openclaw/firecrawl-plugin`. ابزارهای قابل‌فراخوانی توسط عامل را اضافه می‌کند. پشتیبانی از ارائه‌دهنده دریافت وب را اضافه می‌کند. پشتیبانی از ارائه‌دهنده جستجوی وب را اضافه می‌کند.

- **[fireworks](/fa/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm؛ ClawHub: `clawhub:@openclaw/fireworks-provider`. پشتیبانی از ارائه‌دهنده مدل Fireworks را به OpenClaw اضافه می‌کند.

- **[gmi](/fa/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm؛ ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin ارائه‌دهنده OpenClaw GMI Cloud.

- **[google-meet](/fa/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm؛ ClawHub. Plugin شرکت‌کننده OpenClaw Google Meet برای پیوستن به تماس‌ها از طریق انتقال‌های Chrome یا Twilio.

- **[googlechat](/fa/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm؛ ClawHub. Plugin کانال OpenClaw Google Chat برای فضاها و پیام‌های مستقیم.

- **[gradium](/fa/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm؛ ClawHub: `clawhub:@openclaw/gradium-speech`. پشتیبانی از ارائه‌دهنده تبدیل متن به گفتار را اضافه می‌کند.

- **[groq](/fa/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm؛ ClawHub: `clawhub:@openclaw/groq-provider`. پشتیبانی از ارائه‌دهنده مدل Groq را به OpenClaw اضافه می‌کند.

- **[inworld](/fa/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm؛ ClawHub: `clawhub:@openclaw/inworld-speech`. تبدیل متن به گفتار جریانی Inworld (MP3، OGG_OPUS، تلفنی PCM).

- **[irc](/fa/plugins/reference/irc)** (`@openclaw/irc`) - npm؛ ClawHub: `clawhub:@openclaw/irc`. سطح کانال IRC را برای ارسال و دریافت پیام‌های OpenClaw اضافه می‌کند.

- **[kilocode](/fa/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm؛ ClawHub: `clawhub:@openclaw/kilocode-provider`. پشتیبانی از ارائه‌دهنده مدل Kilocode را به OpenClaw اضافه می‌کند.

- **[kimi](/fa/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm؛ ClawHub: `clawhub:@openclaw/kimi-provider`. پشتیبانی از ارائه‌دهنده مدل Kimi و Kimi Coding را به OpenClaw اضافه می‌کند.

- **[line](/fa/plugins/reference/line)** (`@openclaw/line`) - npm؛ ClawHub. Plugin کانال OpenClaw LINE برای چت‌های LINE Bot API.

- **[llama-cpp](/fa/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm؛ ClawHub. embeddingهای محلی GGUF از طریق node-llama-cpp.

- **[lobster](/fa/plugins/reference/lobster)** (`@openclaw/lobster`) - npm؛ ClawHub. Plugin ابزار گردش‌کار Lobster برای pipelineهای نوع‌دار و تأییدیه‌های قابل‌ازسرگیری.

- **[matrix](/fa/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`؛ npm. Plugin کانال OpenClaw Matrix برای اتاق‌ها و پیام‌های مستقیم.

- **[mattermost](/fa/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm؛ ClawHub: `clawhub:@openclaw/mattermost`. سطح کانال Mattermost را برای ارسال و دریافت پیام‌های OpenClaw اضافه می‌کند.

- **[memory-lancedb](/fa/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm؛ ClawHub. Plugin حافظه بلندمدت OpenClaw مبتنی بر LanceDB با یادآوری خودکار، ضبط خودکار، و جستجوی برداری.

- **[moonshot](/fa/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm؛ ClawHub: `clawhub:@openclaw/moonshot-provider`. پشتیبانی از ارائه‌دهنده مدل Moonshot را به OpenClaw اضافه می‌کند.

- **[msteams](/fa/plugins/reference/msteams)** (`@openclaw/msteams`) - npm؛ ClawHub. Plugin کانال OpenClaw Microsoft Teams برای گفت‌وگوهای ربات.

- **[nextcloud-talk](/fa/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm؛ ClawHub. Plugin کانال OpenClaw Nextcloud Talk برای گفت‌وگوها.

- **[nostr](/fa/plugins/reference/nostr)** (`@openclaw/nostr`) - npm؛ ClawHub. Plugin کانال OpenClaw Nostr برای پیام‌های مستقیم رمزگذاری‌شده NIP-04.

- **[openshell](/fa/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm؛ ClawHub. backend sandbox OpenClaw برای NVIDIA OpenShell CLI با workspaceهای محلی آینه‌شده و اجرای فرمان SSH.

- **[parallel](/fa/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm؛ ClawHub: `clawhub:@openclaw/parallel-plugin`. پشتیبانی از ارائه‌دهنده جستجوی وب را اضافه می‌کند.

- **[perplexity](/fa/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm؛ ClawHub: `clawhub:@openclaw/perplexity-plugin`. پشتیبانی از ارائه‌دهنده جستجوی وب را اضافه می‌کند.

- **[pixverse](/fa/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm؛ ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin ارائه‌دهنده تولید ویدیوی OpenClaw PixVerse.

- **[qianfan](/fa/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm؛ ClawHub: `clawhub:@openclaw/qianfan-provider`. پشتیبانی از ارائه‌دهنده مدل Qianfan را به OpenClaw اضافه می‌کند.

- **[qqbot](/fa/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm؛ ClawHub. Plugin کانال OpenClaw QQ Bot برای گردش‌کارهای گروهی و پیام مستقیم.

- **[qwen](/fa/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm؛ ClawHub: `clawhub:@openclaw/qwen-provider`. پشتیبانی از ارائه‌دهنده مدل Qwen، Qwen Cloud، Model Studio، DashScope، Qwen Oauth، Qwen Portal، و Qwen CLI را به OpenClaw اضافه می‌کند.

- **[raft](/fa/plugins/reference/raft)** (`@openclaw/raft`) - npm؛ ClawHub. Plugin کانال OpenClaw Raft برای پل‌های بیدارباش امن CLI.

- **[searxng](/fa/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm؛ ClawHub: `clawhub:@openclaw/searxng-plugin`. پشتیبانی از ارائه‌دهنده جستجوی وب را اضافه می‌کند.

- **[signal](/fa/plugins/reference/signal)** (`@openclaw/signal`) - npm؛ ClawHub: `clawhub:@openclaw/signal`. سطح کانال Signal را برای ارسال و دریافت پیام‌های OpenClaw اضافه می‌کند.

- **[slack](/fa/plugins/reference/slack)** (`@openclaw/slack`) - npm؛ ClawHub. Plugin کانال OpenClaw Slack برای کانال‌ها، پیام‌های مستقیم، فرمان‌ها، و رویدادهای برنامه.

- **[sms](/fa/plugins/reference/sms)** (`@openclaw/sms`) - npm؛ ClawHub: `clawhub:@openclaw/sms`. Plugin کانال Twilio SMS برای پیام‌های متنی OpenClaw.

- **[stepfun](/fa/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm؛ ClawHub: `clawhub:@openclaw/stepfun-provider`. پشتیبانی از ارائه‌دهنده مدل StepFun و StepFun Plan را به OpenClaw اضافه می‌کند.

- **[synology-chat](/fa/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm؛ ClawHub. Plugin کانال Synology Chat برای کانال‌های OpenClaw و پیام‌های مستقیم.

- **[tavily](/fa/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm؛ ClawHub: `clawhub:@openclaw/tavily-plugin`. ابزارهای قابل‌فراخوانی توسط عامل را اضافه می‌کند. پشتیبانی از ارائه‌دهنده جستجوی وب را اضافه می‌کند.

- **[tencent](/fa/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm؛ ClawHub: `clawhub:@openclaw/tencent-provider`. پشتیبانی از ارائه‌دهنده مدل Tencent TokenHub را به OpenClaw اضافه می‌کند.

- **[tlon](/fa/plugins/reference/tlon)** (`@openclaw/tlon`) - npm؛ ClawHub. Plugin کانال OpenClaw Tlon/Urbit برای گردش‌کارهای چت.

- **[tokenjuice](/fa/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm؛ ClawHub: `clawhub:@openclaw/tokenjuice`. نتایج ابزار exec و bash را با کاهش‌دهنده‌های tokenjuice فشرده می‌کند.

- **[twitch](/fa/plugins/reference/twitch)** (`@openclaw/twitch`) - npm؛ ClawHub. Plugin کانال OpenClaw Twitch برای گردش‌کارهای چت و نظارت.

- **[venice](/fa/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm؛ ClawHub: `clawhub:@openclaw/venice-provider`. پشتیبانی از ارائه‌دهنده مدل Venice را به OpenClaw اضافه می‌کند.

- **[vercel-ai-gateway](/fa/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm؛ ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. پشتیبانی از ارائه‌دهنده مدل Vercel AI Gateway را به OpenClaw اضافه می‌کند.

- **[voice-call](/fa/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm؛ ClawHub. Plugin تماس صوتی OpenClaw برای تماس‌های تلفنی Twilio، Telnyx، و Plivo.

- **[whatsapp](/fa/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`؛ npm. Plugin کانال OpenClaw WhatsApp برای چت‌های WhatsApp Web.

- **[zai](/fa/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm؛ ClawHub: `clawhub:@openclaw/zai-provider`. پشتیبانی از ارائه‌دهنده مدل Z.AI را به OpenClaw اضافه می‌کند.

- **[zalo](/fa/plugins/reference/zalo)** (`@openclaw/zalo`) - npm؛ ClawHub. Plugin کانال OpenClaw Zalo برای چت‌های ربات و webhook.

- **[zalouser](/fa/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm؛ ClawHub. Plugin حساب شخصی OpenClaw Zalo از طریق یکپارچه‌سازی بومی zca-js.

## فقط checkout منبع

3 Plugin

- **[qa-channel](/fa/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - فقط checkout منبع. سطح QA Channel را برای ارسال و دریافت پیام‌های OpenClaw اضافه می‌کند.

- **[qa-lab](/fa/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - فقط checkout منبع. Plugin آزمایشگاه QA در OpenClaw با رابط کاربری اشکال‌زدای خصوصی و اجراکننده سناریو.

- **[ماتریس QA](/fa/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - فقط برای checkout سورس. اجراکنندهٔ ترابری QA ماتریسی و زیرلایه.
