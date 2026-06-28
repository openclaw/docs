---
read_when:
    - Bir Plugin'in çekirdek npm paketinde mi yer alacağına yoksa ayrı mı kurulacağına karar veriyorsunuz
    - Paketle birlikte gelen Plugin paket meta verilerini veya sürüm otomasyonunu güncelliyorsunuz
    - Kanonik dahili ve harici plugin listesine ihtiyacınız var
summary: OpenClaw çekirdeğinde gönderilen, harici olarak yayımlanan veya yalnızca kaynak olarak tutulan Plugin’lerin oluşturulmuş envanteri
title: Plugin envanteri
x-i18n:
    generated_at: "2026-06-28T00:56:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f0c5aa2c3e5f25308a4398dc2582caa8f355a4dfd0d5693d9cfaf1c1ce6926
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Plugin envanteri

Bu sayfa `extensions/*/package.json`, `openclaw.plugin.json` ve kök npm paketi `files` dışlamalarından oluşturulur. Şununla yeniden oluşturun:

```bash
pnpm plugins:inventory:gen
```

## Tanımlar

- **Çekirdek npm paketi:** `openclaw` npm paketine dahil olarak oluşturulur ve ayrı bir Plugin kurulumu olmadan kullanılabilir.
- **Resmi harici paket:** çekirdek npm paketinden çıkarılmış, bu resmi envanterde tutulan ve ClawHub ve/veya npm üzerinden istek üzerine yüklenen OpenClaw tarafından sürdürülen Plugin.
- **Yalnızca kaynak checkout:** yayımlanan npm yapılarından çıkarılmış ve yüklenebilir paket olarak duyurulmayan repo yerelindeki Plugin.

Kaynak checkout'lar npm kurulumlarından farklıdır: `pnpm install` sonrasında paketli Plugin'ler `extensions/<id>` içinden yüklenir, böylece yerel düzenlemeler ve pakete yerel workspace bağımlılıkları kullanılabilir.

## Plugin yükleme

Kurulumun gerekip gerekmediğine karar vermek için her girdideki kurulum yolunu kullanın. `included in OpenClaw` diyen Plugin'ler çekirdek pakette zaten mevcuttur. Resmi harici paketler bir kurulum, ardından bir Gateway yeniden başlatması gerektirir.

Örneğin, Discord resmi bir harici pakettir:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Lansman geçişi sırasında sıradan yalın paket belirtimleri hâlâ npm'den yüklenir. Açık bir kaynak gerektiğinde `clawhub:@openclaw/discord` veya `npm:@openclaw/discord` kullanın. Kurulumdan sonra, kimlik bilgileri ve kanal yapılandırması eklemek için [Discord](/tr/channels/discord) gibi Plugin'in kurulum belgesini izleyin. Güncelleme, kaldırma ve yayımlama komutları için [Plugin'leri yönet](/tr/plugins/manage-plugins) bölümüne bakın.

Her girdi paketi, dağıtım yolunu ve açıklamayı listeler.

## Çekirdek npm paketi

59 Plugin

- **[admin-http-rpc](/tr/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - OpenClaw'a dahildir. OpenClaw yönetici HTTP RPC uç noktası.

- **[alibaba](/tr/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - OpenClaw'a dahildir. Video üretimi sağlayıcısı desteği ekler.

- **[anthropic](/tr/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - OpenClaw'a dahildir. OpenClaw'a Anthropic model sağlayıcısı desteği ekler.

- **[azure-speech](/tr/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - OpenClaw'a dahildir. Azure AI Speech metinden konuşmaya (MP3, yerel Ogg/Opus sesli notları, PCM telefon).

- **[bonjour](/tr/plugins/reference/bonjour)** (`@openclaw/bonjour`) - OpenClaw'a dahildir. Yerel OpenClaw Gateway'ini Bonjour/mDNS üzerinden duyurur.

- **[browser](/tr/plugins/reference/browser)** (`@openclaw/browser-plugin`) - OpenClaw'a dahildir. Ajan tarafından çağrılabilir araçlar ekler.

- **[byteplus](/tr/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - OpenClaw'a dahildir. OpenClaw'a BytePlus, BytePlus Plan model sağlayıcısı desteği ekler.

- **[canvas](/tr/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - OpenClaw'a dahildir. Eşleştirilmiş düğümler için deneysel Canvas denetimi ve A2UI işleme yüzeyleri.

- **[codex-supervisor](/tr/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - OpenClaw'a dahildir. Codex uygulama sunucusu oturumlarını OpenClaw'dan denetler.

- **[cohere](/tr/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - OpenClaw'a dahildir; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. OpenClaw Cohere sağlayıcı Plugin'i.

- **[comfy](/tr/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - OpenClaw'a dahildir. OpenClaw'a ComfyUI model sağlayıcısı desteği ekler.

- **[copilot-proxy](/tr/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - OpenClaw'a dahildir. OpenClaw'a Copilot Proxy model sağlayıcısı desteği ekler.

- **[deepgram](/tr/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - OpenClaw'a dahildir. Medya anlama sağlayıcısı desteği ekler. Gerçek zamanlı transkripsiyon sağlayıcısı desteği ekler.

- **[document-extract](/tr/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - OpenClaw'a dahildir. Yerel belge eklerinden metin ve yedek sayfa görüntüleri çıkarır.

- **[duckduckgo](/tr/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - OpenClaw'a dahildir. Web arama sağlayıcısı desteği ekler.

- **[elevenlabs](/tr/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - OpenClaw'a dahildir. Medya anlama sağlayıcısı desteği ekler. Gerçek zamanlı transkripsiyon sağlayıcısı desteği ekler. Metinden konuşmaya sağlayıcısı desteği ekler.

- **[fal](/tr/plugins/reference/fal)** (`@openclaw/fal-provider`) - OpenClaw'a dahildir. OpenClaw'a fal model sağlayıcısı desteği ekler.

- **[file-transfer](/tr/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - OpenClaw'a dahildir. Ayrılmış düğüm komutları üzerinden eşleştirilmiş düğümlerde dosyaları getirir, listeler ve yazar. 16 MB'a kadar ikili dosyalar için node.invoke üzerinden base64 kullanarak bash stdout kesilmesini atlar.

- **[github-copilot](/tr/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - OpenClaw'a dahildir. OpenClaw'a GitHub Copilot model sağlayıcısı desteği ekler.

- **[google](/tr/plugins/reference/google)** (`@openclaw/google-plugin`) - OpenClaw'a dahildir. OpenClaw'a Google, Google Gemini CLI, Google Vertex model sağlayıcısı desteği ekler.

- **[huggingface](/tr/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - OpenClaw'a dahildir. OpenClaw'a Hugging Face model sağlayıcısı desteği ekler.

- **[imessage](/tr/plugins/reference/imessage)** (`@openclaw/imessage`) - OpenClaw'a dahildir. OpenClaw mesajlarını göndermek ve almak için iMessage kanal yüzeyini ekler.

- **[litellm](/tr/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - OpenClaw'a dahildir. OpenClaw'a LiteLLM model sağlayıcısı desteği ekler.

- **[llm-task](/tr/plugins/reference/llm-task)** (`@openclaw/llm-task`) - OpenClaw'a dahildir. İş akışlarından çağrılabilen yapılandırılmış görevler için genel JSON'a özel LLM aracı.

- **[lmstudio](/tr/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - OpenClaw'a dahildir. OpenClaw'a LM Studio model sağlayıcısı desteği ekler.

- **[memory-core](/tr/plugins/reference/memory-core)** (`@openclaw/memory-core`) - OpenClaw'a dahildir. Ajan tarafından çağrılabilir araçlar ekler.

- **[memory-wiki](/tr/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - OpenClaw'a dahildir. OpenClaw için kalıcı wiki derleyicisi ve Obsidian dostu bilgi kasası.

- **[microsoft](/tr/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - OpenClaw'a dahildir. Metinden konuşmaya sağlayıcısı desteği ekler.

- **[microsoft-foundry](/tr/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - OpenClaw'a dahildir. OpenClaw'a Microsoft Foundry model sağlayıcısı desteği ekler.

- **[migrate-claude](/tr/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - OpenClaw'a dahildir. Claude Code ve Claude Desktop yönergelerini, MCP sunucularını, Skills'i ve güvenli yapılandırmayı OpenClaw'a içe aktarır.

- **[migrate-hermes](/tr/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - OpenClaw'a dahildir. Hermes yapılandırmasını, bellekleri, Skills'i ve desteklenen kimlik bilgilerini OpenClaw'a içe aktarır.

- **[minimax](/tr/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - OpenClaw'a dahildir. OpenClaw'a MiniMax, MiniMax Portal model sağlayıcısı desteği ekler.

- **[mistral](/tr/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - OpenClaw'a dahildir. OpenClaw'a Mistral model sağlayıcısı desteği ekler.

- **[novita](/tr/plugins/reference/novita)** (`@openclaw/novita-provider`) - OpenClaw'a dahildir. OpenClaw'a Novita, Novita AI, Novitaai model sağlayıcısı desteği ekler.

- **[nvidia](/tr/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - OpenClaw'a dahildir. OpenClaw'a NVIDIA model sağlayıcısı desteği ekler.

- **[oc-path](/tr/plugins/reference/oc-path)** (`@openclaw/oc-path`) - OpenClaw'a dahildir. oc:// workspace dosya adreslemesi için openclaw path CLI'sini ekler.

- **[ollama](/tr/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - OpenClaw'a dahildir. OpenClaw'a Ollama, Ollama Cloud model sağlayıcısı desteği ekler.

- **[open-prose](/tr/plugins/reference/open-prose)** (`@openclaw/open-prose`) - OpenClaw'a dahildir. /prose slash komutuna sahip OpenProse VM Skills paketi.

- **[openai](/tr/plugins/reference/openai)** (`@openclaw/openai-provider`) - OpenClaw'a dahildir. OpenClaw'a OpenAI model sağlayıcısı desteği ekler.

- **[opencode](/tr/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - OpenClaw'a dahildir. OpenClaw'a OpenCode model sağlayıcısı desteği ekler.

- **[opencode-go](/tr/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - OpenClaw'a dahildir. OpenClaw'a OpenCode Go model sağlayıcısı desteği ekler.

- **[openrouter](/tr/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - OpenClaw'a dahildir. OpenClaw'a OpenRouter model sağlayıcısı desteği ekler.

- **[policy](/tr/plugins/reference/policy)** (`@openclaw/policy`) - OpenClaw'a dahildir. Workspace uyumluluğu için ilke destekli doctor kontrolleri ekler.

- **[runway](/tr/plugins/reference/runway)** (`@openclaw/runway-provider`) - OpenClaw'a dahildir. Video üretimi sağlayıcısı desteği ekler.

- **[senseaudio](/tr/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - OpenClaw'a dahildir. Medya anlama sağlayıcısı desteği ekler.

- **[sglang](/tr/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - OpenClaw'a dahildir. OpenClaw'a SGLang model sağlayıcısı desteği ekler.

- **[synthetic](/tr/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - OpenClaw'a dahildir. OpenClaw'a Synthetic model sağlayıcısı desteği ekler.

- **[telegram](/tr/plugins/reference/telegram)** (`@openclaw/telegram`) - OpenClaw'a dahildir. OpenClaw mesajlarını göndermek ve almak için Telegram kanal yüzeyini ekler.

- **[together](/tr/plugins/reference/together)** (`@openclaw/together-provider`) - OpenClaw'a dahildir. OpenClaw'a Together model sağlayıcısı desteği ekler.

- **[tts-local-cli](/tr/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - OpenClaw'a dahildir. Metinden konuşmaya sağlayıcısı desteği ekler.

- **[vllm](/tr/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - OpenClaw'a dahildir. OpenClaw'a vLLM model sağlayıcısı desteği ekler.

- **[volcengine](/tr/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - OpenClaw'a dahildir. OpenClaw'a Volcengine, Volcengine Plan model sağlayıcısı desteği ekler.

- **[voyage](/tr/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - OpenClaw'a dahildir. Bellek gömme sağlayıcısı desteği ekler.

- **[vydra](/tr/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - OpenClaw'a dahildir. OpenClaw'a Vydra model sağlayıcısı desteği ekler.

- **[web-readability](/tr/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - OpenClaw'a dahildir. Yerel HTML web getirme yanıtlarından okunabilir makale içeriğini çıkarır.

- **[webhooks](/tr/plugins/reference/webhooks)** (`@openclaw/webhooks`) - OpenClaw'a dahildir. Harici otomasyonu OpenClaw TaskFlows'a bağlayan kimliği doğrulanmış gelen Webhook'lar.

- **[workboard](/tr/plugins/reference/workboard)** (`@openclaw/workboard`) - OpenClaw'a dahildir. Ajan sahipliğindeki issue'lar ve oturumlar için pano çalışma tahtası.

- **[xai](/tr/plugins/reference/xai)** (`@openclaw/xai-plugin`) - OpenClaw'a dahildir. OpenClaw'a xAI model sağlayıcısı desteği ekler.

- **[xiaomi](/tr/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - OpenClaw'a dahildir. OpenClaw'a Xiaomi, Xiaomi Token Plan model sağlayıcısı desteği ekler.

## Resmi harici paketler

68 Plugin

- **[acpx](/tr/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Plugin sahipli oturum ve taşıma yönetimine sahip OpenClaw ACP çalışma zamanı arka ucu.

- **[amazon-bedrock](/tr/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Model keşfi, gömmeler ve guardrail desteği olan OpenClaw Amazon Bedrock sağlayıcı Plugin'i.

- **[amazon-bedrock-mantle](/tr/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. OpenAI uyumlu model yönlendirmesi için OpenClaw Amazon Bedrock Mantle sağlayıcı Plugin'i.

- **[anthropic-vertex](/tr/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Google Vertex AI üzerindeki Claude modelleri için OpenClaw Anthropic Vertex sağlayıcı Plugin'i.

- **[arcee](/tr/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. OpenClaw'a Arcee model sağlayıcı desteği ekler.

- **[brave](/tr/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Web araması için OpenClaw Brave Search sağlayıcı Plugin'i.

- **[cerebras](/tr/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. OpenClaw'a Cerebras model sağlayıcı desteği ekler.

- **[chutes](/tr/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. OpenClaw'a Chutes model sağlayıcı desteği ekler.

- **[clickclack](/tr/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. OpenClaw iletilerini göndermek ve almak için Clickclack kanal yüzeyini ekler.

- **[cloudflare-ai-gateway](/tr/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. OpenClaw'a Cloudflare AI Gateway model sağlayıcı desteği ekler.

- **[codex](/tr/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Codex tarafından yönetilen GPT kataloğuna sahip OpenClaw Codex uygulama sunucusu koşum takımı ve model sağlayıcı Plugin'i.

- **[copilot](/tr/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. GitHub Copilot ajan çalışma zamanını kaydeder.

- **[deepinfra](/tr/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. OpenClaw'a DeepInfra model sağlayıcı desteği ekler.

- **[deepseek](/tr/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. OpenClaw'a DeepSeek model sağlayıcı desteği ekler.

- **[diagnostics-otel](/tr/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Metrikler, izler ve günlükler için OpenClaw tanılama OpenTelemetry dışa aktarıcısı.

- **[diagnostics-prometheus](/tr/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Çalışma zamanı metrikleri için OpenClaw tanılama Prometheus dışa aktarıcısı.

- **[diffs](/tr/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Ajanlar için OpenClaw salt okunur fark görüntüleyici Plugin'i ve dosya işleyicisi.

- **[diffs-language-pack](/tr/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Varsayılan fark görüntüleyici kümesinin dışındaki diller için sözdizimi vurgulaması ekler.

- **[discord](/tr/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Kanallar, DM'ler, komutlar ve uygulama olayları için OpenClaw Discord kanal Plugin'i.

- **[exa](/tr/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Web araması sağlayıcı desteği ekler.

- **[feishu](/tr/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Sohbetler ve iş yeri araçları için OpenClaw Feishu/Lark kanal Plugin'i (@m1heng tarafından toplulukça sürdürülür).

- **[firecrawl](/tr/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Ajan tarafından çağrılabilir araçlar ekler. Web getirme sağlayıcı desteği ekler. Web araması sağlayıcı desteği ekler.

- **[fireworks](/tr/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. OpenClaw'a Fireworks model sağlayıcı desteği ekler.

- **[gmi](/tr/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. OpenClaw GMI Cloud sağlayıcı Plugin'i.

- **[google-meet](/tr/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Chrome veya Twilio taşıyıcıları üzerinden çağrılara katılmak için OpenClaw Google Meet katılımcı Plugin'i.

- **[googlechat](/tr/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Alanlar ve doğrudan iletiler için OpenClaw Google Chat kanal Plugin'i.

- **[gradium](/tr/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Metinden konuşmaya sağlayıcı desteği ekler.

- **[groq](/tr/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. OpenClaw'a Groq model sağlayıcı desteği ekler.

- **[inworld](/tr/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Inworld akışlı metinden konuşmaya (MP3, OGG_OPUS, PCM telefon).

- **[irc](/tr/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. OpenClaw iletilerini göndermek ve almak için IRC kanal yüzeyini ekler.

- **[kilocode](/tr/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. OpenClaw'a Kilocode model sağlayıcı desteği ekler.

- **[kimi](/tr/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. OpenClaw'a Kimi, Kimi Coding model sağlayıcı desteği ekler.

- **[line](/tr/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. LINE Bot API sohbetleri için OpenClaw LINE kanal Plugin'i.

- **[llama-cpp](/tr/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. node-llama-cpp üzerinden yerel GGUF gömmeleri.

- **[lobster](/tr/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Tipli işlem hatları ve sürdürülebilir onaylar için Lobster iş akışı aracı Plugin'i.

- **[matrix](/tr/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Odalar ve doğrudan iletiler için OpenClaw Matrix kanal Plugin'i.

- **[mattermost](/tr/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. OpenClaw iletilerini göndermek ve almak için Mattermost kanal yüzeyini ekler.

- **[memory-lancedb](/tr/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Otomatik geri çağırma, otomatik yakalama ve vektör araması özelliklerine sahip LanceDB destekli OpenClaw uzun süreli bellek Plugin'i.

- **[moonshot](/tr/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. OpenClaw'a Moonshot model sağlayıcı desteği ekler.

- **[msteams](/tr/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Bot konuşmaları için OpenClaw Microsoft Teams kanal Plugin'i.

- **[nextcloud-talk](/tr/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Konuşmalar için OpenClaw Nextcloud Talk kanal Plugin'i.

- **[nostr](/tr/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. NIP-04 şifreli doğrudan iletiler için OpenClaw Nostr kanal Plugin'i.

- **[openshell](/tr/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. Yansıtılmış yerel çalışma alanları ve SSH komut yürütmesiyle NVIDIA OpenShell CLI için OpenClaw sandbox arka ucu.

- **[parallel](/tr/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Web araması sağlayıcı desteği ekler.

- **[perplexity](/tr/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Web araması sağlayıcı desteği ekler.

- **[pixverse](/tr/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. OpenClaw PixVerse video oluşturma sağlayıcı Plugin'i.

- **[qianfan](/tr/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. OpenClaw'a Qianfan model sağlayıcı desteği ekler.

- **[qqbot](/tr/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Grup ve doğrudan ileti iş akışları için OpenClaw QQ Bot kanal Plugin'i.

- **[qwen](/tr/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. OpenClaw'a Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI model sağlayıcı desteği ekler.

- **[raft](/tr/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Güvenli CLI uyandırma köprüleri için OpenClaw Raft kanal Plugin'i.

- **[searxng](/tr/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Web araması sağlayıcı desteği ekler.

- **[signal](/tr/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. OpenClaw iletilerini göndermek ve almak için Signal kanal yüzeyini ekler.

- **[slack](/tr/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Kanallar, DM'ler, komutlar ve uygulama olayları için OpenClaw Slack kanal Plugin'i.

- **[sms](/tr/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. OpenClaw metin iletileri için Twilio SMS kanal Plugin'i.

- **[stepfun](/tr/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. OpenClaw'a StepFun, StepFun Plan model sağlayıcı desteği ekler.

- **[synology-chat](/tr/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. OpenClaw kanalları ve doğrudan iletiler için Synology Chat kanal Plugin'i.

- **[tavily](/tr/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Ajan tarafından çağrılabilir araçlar ekler. Web araması sağlayıcı desteği ekler.

- **[tencent](/tr/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. OpenClaw'a Tencent TokenHub model sağlayıcı desteği ekler.

- **[tlon](/tr/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Sohbet iş akışları için OpenClaw Tlon/Urbit kanal Plugin'i.

- **[tokenjuice](/tr/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. exec ve bash araç sonuçlarını tokenjuice indirgeyicileriyle sıkıştırır.

- **[twitch](/tr/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Sohbet ve moderasyon iş akışları için OpenClaw Twitch kanal Plugin'i.

- **[venice](/tr/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. OpenClaw'a Venice model sağlayıcı desteği ekler.

- **[vercel-ai-gateway](/tr/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. OpenClaw'a Vercel AI Gateway model sağlayıcı desteği ekler.

- **[voice-call](/tr/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Twilio, Telnyx ve Plivo telefon çağrıları için OpenClaw sesli arama Plugin'i.

- **[whatsapp](/tr/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. WhatsApp Web sohbetleri için OpenClaw WhatsApp kanal Plugin'i.

- **[zai](/tr/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. OpenClaw'a Z.AI model sağlayıcı desteği ekler.

- **[zalo](/tr/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Bot ve Webhook sohbetleri için OpenClaw Zalo kanal Plugin'i.

- **[zalouser](/tr/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Yerel zca-js entegrasyonu üzerinden OpenClaw Zalo Kişisel Hesap Plugin'i.

## Yalnızca kaynak checkout'u

3 Plugin

- **[qa-channel](/tr/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - yalnızca kaynak checkout'unda. OpenClaw iletilerini göndermek ve almak için QA Channel yüzeyini ekler.

- **[qa-lab](/tr/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - yalnızca kaynak checkout'unda. Özel hata ayıklayıcı arayüzü ve senaryo çalıştırıcısına sahip OpenClaw QA lab Plugin'i.

- **[qa-matrix](/tr/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - yalnızca kaynak çalışma kopyası. Matrix QA aktarım çalıştırıcısı ve alt katmanı.
