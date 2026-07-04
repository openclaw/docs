---
read_when:
    - Plugin'in çekirdek npm paketiyle birlikte gönderilip gönderilmeyeceğine ya da ayrı olarak yüklenip yüklenmeyeceğine karar veriyorsunuz
    - Bundled plugin paket meta verilerini veya yayın otomasyonunu güncelliyorsunuz
    - Kanonik dahili ve harici Plugin listesine ihtiyacınız var
summary: OpenClaw içinde çekirdekte gönderilen, harici olarak yayımlanan veya yalnızca kaynak olarak tutulan Plugin'lerin oluşturulmuş envanteri
title: Plugin envanteri
x-i18n:
    generated_at: "2026-07-04T04:03:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1af48e3d1ca8e994780dae2ac39dd2d3c3ed0bc8c136cbf3448fe18fadddfb0a
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Plugin envanteri

Bu sayfa `extensions/*/package.json`, `openclaw.plugin.json` ve kök npm paketinin `files` dışlamalarından oluşturulur. Şununla yeniden oluşturun:

```bash
pnpm plugins:inventory:gen
```

## Tanımlar

- **Çekirdek npm paketi:** `openclaw` npm paketinin içine yerleştirilmiştir ve ayrı bir plugin kurulumu olmadan kullanılabilir.
- **Resmi harici paket:** Çekirdek npm paketinden çıkarılmış, bu resmi envanterde tutulan ve ClawHub ve/veya npm üzerinden isteğe bağlı olarak kurulan OpenClaw tarafından bakımı yapılan plugin.
- **Yalnızca kaynak checkout:** Yayımlanan npm yapıtlarından çıkarılmış ve kurulabilir paket olarak duyurulmayan repo yerelindeki plugin.

Kaynak checkout'lar npm kurulumlarından farklıdır: `pnpm install` sonrasında paketlenmiş plugin'ler `extensions/<id>` konumundan yüklenir; böylece yerel düzenlemeler ve paket yerelindeki workspace bağımlılıkları kullanılabilir.

## Plugin kurma

Kurulumun gerekli olup olmadığına karar vermek için her girdideki kurulum yolunu kullanın. `included in OpenClaw` diyen plugin'ler çekirdek pakette zaten bulunur. Resmi harici paketler bir kez kurulum, ardından Gateway yeniden başlatması gerektirir.

Örneğin, Discord resmi bir harici pakettir:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Lansman geçişi sırasında sıradan çıplak paket belirtimleri hâlâ npm'den kurulur. Açık bir kaynak gerektiğinde `clawhub:@openclaw/discord` veya `npm:@openclaw/discord` kullanın. Kurulumdan sonra kimlik bilgileri ve kanal yapılandırması eklemek için [Discord](/tr/channels/discord) gibi plugin'in kurulum belgesini izleyin. Güncelleme, kaldırma ve yayımlama komutları için [Plugin'leri yönetme](/tr/plugins/manage-plugins) bölümüne bakın.

Her girdi paketi, dağıtım yolunu ve açıklamayı listeler.

## Çekirdek npm paketi

60 plugin

- **[admin-http-rpc](/tr/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - OpenClaw'a dahildir. OpenClaw yönetici HTTP RPC uç noktası.

- **[alibaba](/tr/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - OpenClaw'a dahildir. Video üretimi sağlayıcısı desteği ekler.

- **[anthropic](/tr/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - OpenClaw'a dahildir. OpenClaw'a Anthropic model sağlayıcısı desteği ekler.

- **[azure-speech](/tr/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - OpenClaw'a dahildir. Azure AI Speech metinden sese (MP3, yerel Ogg/Opus ses notları, PCM telefon).

- **[bonjour](/tr/plugins/reference/bonjour)** (`@openclaw/bonjour`) - OpenClaw'a dahildir. Yerel OpenClaw gateway'ini Bonjour/mDNS üzerinden duyurur.

- **[browser](/tr/plugins/reference/browser)** (`@openclaw/browser-plugin`) - OpenClaw'a dahildir. Aracı tarafından çağrılabilen araçlar ekler.

- **[byteplus](/tr/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - OpenClaw'a dahildir. OpenClaw'a BytePlus, BytePlus Plan model sağlayıcısı desteği ekler.

- **[canvas](/tr/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - OpenClaw'a dahildir. Eşleştirilmiş düğümler için deneysel Canvas denetimi ve A2UI render yüzeyleri.

- **[clawrouter](/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - OpenClaw'a dahildir. OpenClaw'a ClawRouter model sağlayıcısı desteği ekler.

- **[codex-supervisor](/tr/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - OpenClaw'a dahildir. Codex app-server oturumlarını OpenClaw'dan denetleyin.

- **[cohere](/tr/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - OpenClaw'a dahildir; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. OpenClaw Cohere sağlayıcı plugin'i.

- **[comfy](/tr/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - OpenClaw'a dahildir. OpenClaw'a ComfyUI model sağlayıcısı desteği ekler.

- **[copilot-proxy](/tr/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - OpenClaw'a dahildir. OpenClaw'a Copilot Proxy model sağlayıcısı desteği ekler.

- **[deepgram](/tr/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - OpenClaw'a dahildir. Medya anlama sağlayıcısı desteği ekler. Gerçek zamanlı transkripsiyon sağlayıcısı desteği ekler.

- **[document-extract](/tr/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - OpenClaw'a dahildir. Yerel belge eklerinden metin ve yedek sayfa görselleri çıkarır.

- **[duckduckgo](/tr/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - OpenClaw'a dahildir. Web arama sağlayıcısı desteği ekler.

- **[elevenlabs](/tr/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - OpenClaw'a dahildir. Medya anlama sağlayıcısı desteği ekler. Gerçek zamanlı transkripsiyon sağlayıcısı desteği ekler. Metinden sese sağlayıcısı desteği ekler.

- **[fal](/tr/plugins/reference/fal)** (`@openclaw/fal-provider`) - OpenClaw'a dahildir. OpenClaw'a fal model sağlayıcısı desteği ekler.

- **[file-transfer](/tr/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - OpenClaw'a dahildir. Eşleştirilmiş düğümlerde özel düğüm komutları üzerinden dosyaları getirir, listeler ve yazar. 16 MB'a kadar ikili dosyalar için node.invoke üzerinden base64 kullanarak bash stdout kırpmasını atlar.

- **[github-copilot](/tr/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - OpenClaw'a dahildir. OpenClaw'a GitHub Copilot model sağlayıcısı desteği ekler.

- **[google](/tr/plugins/reference/google)** (`@openclaw/google-plugin`) - OpenClaw'a dahildir. OpenClaw'a Google, Google Gemini CLI, Google Vertex model sağlayıcısı desteği ekler.

- **[huggingface](/tr/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - OpenClaw'a dahildir. OpenClaw'a Hugging Face model sağlayıcısı desteği ekler.

- **[imessage](/tr/plugins/reference/imessage)** (`@openclaw/imessage`) - OpenClaw'a dahildir. OpenClaw mesajları göndermek ve almak için iMessage kanal yüzeyini ekler.

- **[litellm](/tr/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - OpenClaw'a dahildir. OpenClaw'a LiteLLM model sağlayıcısı desteği ekler.

- **[llm-task](/tr/plugins/reference/llm-task)** (`@openclaw/llm-task`) - OpenClaw'a dahildir. İş akışlarından çağrılabilen yapılandırılmış görevler için genel, yalnızca JSON LLM aracı.

- **[lmstudio](/tr/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - OpenClaw'a dahildir. OpenClaw'a LM Studio model sağlayıcısı desteği ekler.

- **[memory-core](/tr/plugins/reference/memory-core)** (`@openclaw/memory-core`) - OpenClaw'a dahildir. Aracı tarafından çağrılabilen araçlar ekler.

- **[memory-wiki](/tr/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - OpenClaw'a dahildir. OpenClaw için kalıcı wiki derleyicisi ve Obsidian dostu bilgi kasası.

- **[microsoft](/tr/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - OpenClaw'a dahildir. Metinden sese sağlayıcısı desteği ekler.

- **[microsoft-foundry](/tr/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - OpenClaw'a dahildir. OpenClaw'a Microsoft Foundry model sağlayıcısı desteği ekler.

- **[migrate-claude](/tr/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - OpenClaw'a dahildir. Claude Code ve Claude Desktop yönergelerini, MCP sunucularını, Skills'leri ve güvenli yapılandırmayı OpenClaw'a içe aktarır.

- **[migrate-hermes](/tr/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - OpenClaw'a dahildir. Hermes yapılandırmasını, belleklerini, Skills'leri ve desteklenen kimlik bilgilerini OpenClaw'a içe aktarır.

- **[minimax](/tr/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - OpenClaw'a dahildir. OpenClaw'a MiniMax, MiniMax Portal model sağlayıcısı desteği ekler.

- **[mistral](/tr/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - OpenClaw'a dahildir. OpenClaw'a Mistral model sağlayıcısı desteği ekler.

- **[novita](/tr/plugins/reference/novita)** (`@openclaw/novita-provider`) - OpenClaw'a dahildir. OpenClaw'a Novita, Novita AI, Novitaai model sağlayıcısı desteği ekler.

- **[nvidia](/tr/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - OpenClaw'a dahildir. OpenClaw'a NVIDIA model sağlayıcısı desteği ekler.

- **[oc-path](/tr/plugins/reference/oc-path)** (`@openclaw/oc-path`) - OpenClaw'a dahildir. oc:// workspace dosya adresleme için openclaw path CLI'sini ekler.

- **[ollama](/tr/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - OpenClaw'a dahildir. OpenClaw'a Ollama, Ollama Cloud model sağlayıcısı desteği ekler.

- **[open-prose](/tr/plugins/reference/open-prose)** (`@openclaw/open-prose`) - OpenClaw'a dahildir. /prose slash komutuna sahip OpenProse VM skill paketi.

- **[openai](/tr/plugins/reference/openai)** (`@openclaw/openai-provider`) - OpenClaw'a dahildir. OpenClaw'a OpenAI model sağlayıcısı desteği ekler.

- **[opencode](/tr/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - OpenClaw'a dahildir. OpenClaw'a OpenCode model sağlayıcısı desteği ekler.

- **[opencode-go](/tr/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - OpenClaw'a dahildir. OpenClaw'a OpenCode Go model sağlayıcısı desteği ekler.

- **[openrouter](/tr/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - OpenClaw'a dahildir. OpenClaw'a OpenRouter model sağlayıcısı desteği ekler.

- **[policy](/tr/plugins/reference/policy)** (`@openclaw/policy`) - OpenClaw'a dahildir. Workspace uyumluluğu için policy destekli doctor kontrolleri ekler.

- **[runway](/tr/plugins/reference/runway)** (`@openclaw/runway-provider`) - OpenClaw'a dahildir. Video üretimi sağlayıcısı desteği ekler.

- **[senseaudio](/tr/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - OpenClaw'a dahildir. Medya anlama sağlayıcısı desteği ekler.

- **[sglang](/tr/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - OpenClaw'a dahildir. OpenClaw'a SGLang model sağlayıcısı desteği ekler.

- **[synthetic](/tr/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - OpenClaw'a dahildir. OpenClaw'a Synthetic model sağlayıcısı desteği ekler.

- **[telegram](/tr/plugins/reference/telegram)** (`@openclaw/telegram`) - OpenClaw'a dahildir. OpenClaw mesajları göndermek ve almak için Telegram kanal yüzeyini ekler.

- **[together](/tr/plugins/reference/together)** (`@openclaw/together-provider`) - OpenClaw'a dahildir. OpenClaw'a Together model sağlayıcısı desteği ekler.

- **[tts-local-cli](/tr/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - OpenClaw'a dahildir. Metinden sese sağlayıcısı desteği ekler.

- **[vllm](/tr/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - OpenClaw'a dahildir. OpenClaw'a vLLM model sağlayıcısı desteği ekler.

- **[volcengine](/tr/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - OpenClaw'a dahildir. OpenClaw'a Volcengine, Volcengine Plan model sağlayıcısı desteği ekler.

- **[voyage](/tr/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - OpenClaw'a dahildir. Bellek embedding sağlayıcısı desteği ekler.

- **[vydra](/tr/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - OpenClaw'a dahildir. OpenClaw'a Vydra model sağlayıcısı desteği ekler.

- **[web-readability](/tr/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - OpenClaw'a dahildir. Yerel HTML web getirme yanıtlarından okunabilir makale içeriği çıkarır.

- **[webhooks](/tr/plugins/reference/webhooks)** (`@openclaw/webhooks`) - OpenClaw TaskFlow'larına harici otomasyonu bağlayan kimliği doğrulanmış gelen webhooks.

- **[workboard](/tr/plugins/reference/workboard)** (`@openclaw/workboard`) - OpenClaw'a dahildir. Aracıya ait sorunlar ve oturumlar için dashboard workboard.

- **[xai](/tr/plugins/reference/xai)** (`@openclaw/xai-plugin`) - OpenClaw'a dahildir. OpenClaw'a xAI model sağlayıcısı desteği ekler.

- **[xiaomi](/tr/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - OpenClaw'a dahildir. OpenClaw'a Xiaomi, Xiaomi Token Plan model sağlayıcısı desteği ekler.

## Resmi harici paketler

68 plugin

- **[acpx](/tr/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Plugin'e ait oturum ve taşıma yönetimine sahip OpenClaw ACP çalışma zamanı arka ucu.

- **[amazon-bedrock](/tr/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Model keşfi, embedding'ler ve guardrail desteğine sahip OpenClaw Amazon Bedrock sağlayıcı plugin'i.

- **[amazon-bedrock-mantle](/tr/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. OpenAI uyumlu model yönlendirmesi için OpenClaw Amazon Bedrock Mantle sağlayıcı Plugin'i.

- **[anthropic-vertex](/tr/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Google Vertex AI üzerindeki Claude modelleri için OpenClaw Anthropic Vertex sağlayıcı Plugin'i.

- **[arcee](/tr/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. OpenClaw'a Arcee model sağlayıcısı desteği ekler.

- **[brave](/tr/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Web araması için OpenClaw Brave Search sağlayıcı Plugin'i.

- **[cerebras](/tr/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. OpenClaw'a Cerebras model sağlayıcısı desteği ekler.

- **[chutes](/tr/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. OpenClaw'a Chutes model sağlayıcısı desteği ekler.

- **[clickclack](/tr/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. OpenClaw mesajlarını göndermek ve almak için Clickclack kanal yüzeyini ekler.

- **[cloudflare-ai-gateway](/tr/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. OpenClaw'a Cloudflare AI Gateway model sağlayıcısı desteği ekler.

- **[codex](/tr/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Codex tarafından yönetilen GPT kataloğuna sahip OpenClaw Codex uygulama sunucusu yürütme düzeneği ve model sağlayıcı Plugin'i.

- **[copilot](/tr/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. GitHub Copilot ajan çalışma zamanını kaydeder.

- **[deepinfra](/tr/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. OpenClaw'a DeepInfra model sağlayıcısı desteği ekler.

- **[deepseek](/tr/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. OpenClaw'a DeepSeek model sağlayıcısı desteği ekler.

- **[diagnostics-otel](/tr/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Metrikler, izler ve günlükler için OpenClaw tanılama OpenTelemetry dışa aktarıcısı.

- **[diagnostics-prometheus](/tr/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Çalışma zamanı metrikleri için OpenClaw tanılama Prometheus dışa aktarıcısı.

- **[diffs](/tr/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Ajanlar için OpenClaw salt okunur fark görüntüleyici Plugin'i ve dosya işleyicisi.

- **[diffs-language-pack](/tr/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Varsayılan fark görüntüleyici kümesinin dışındaki diller için sözdizimi vurgulaması ekler.

- **[discord](/tr/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Kanallar, doğrudan mesajlar, komutlar ve uygulama olayları için OpenClaw Discord kanal Plugin'i.

- **[exa](/tr/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Web arama sağlayıcısı desteği ekler.

- **[feishu](/tr/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Sohbetler ve iş yeri araçları için OpenClaw Feishu/Lark kanal Plugin'i (topluluk tarafından @m1heng sürdürülür).

- **[firecrawl](/tr/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Ajan tarafından çağrılabilir araçlar ekler. Web getirme sağlayıcısı desteği ekler. Web arama sağlayıcısı desteği ekler.

- **[fireworks](/tr/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. OpenClaw'a Fireworks model sağlayıcısı desteği ekler.

- **[gmi](/tr/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. OpenClaw GMI Cloud sağlayıcı Plugin'i.

- **[google-meet](/tr/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Chrome veya Twilio taşıyıcıları üzerinden çağrılara katılmak için OpenClaw Google Meet katılımcı Plugin'i.

- **[googlechat](/tr/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Alanlar ve doğrudan mesajlar için OpenClaw Google Chat kanal Plugin'i.

- **[gradium](/tr/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Metinden konuşmaya sağlayıcı desteği ekler.

- **[groq](/tr/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. OpenClaw'a Groq model sağlayıcısı desteği ekler.

- **[inworld](/tr/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Inworld akışlı metinden konuşmaya dönüştürme (MP3, OGG_OPUS, PCM telefon).

- **[irc](/tr/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. OpenClaw mesajlarını göndermek ve almak için IRC kanal yüzeyini ekler.

- **[kilocode](/tr/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. OpenClaw'a Kilocode model sağlayıcısı desteği ekler.

- **[kimi](/tr/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. OpenClaw'a Kimi, Kimi Coding model sağlayıcısı desteği ekler.

- **[line](/tr/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. LINE Bot API sohbetleri için OpenClaw LINE kanal Plugin'i.

- **[llama-cpp](/tr/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. node-llama-cpp aracılığıyla yerel GGUF gömmeleri.

- **[lobster](/tr/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Türlendirilmiş işlem hatları ve sürdürülebilir onaylar için Lobster iş akışı aracı Plugin'i.

- **[matrix](/tr/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Odalar ve doğrudan mesajlar için OpenClaw Matrix kanal Plugin'i.

- **[mattermost](/tr/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. OpenClaw mesajlarını göndermek ve almak için Mattermost kanal yüzeyini ekler.

- **[memory-lancedb](/tr/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Otomatik geri çağırma, otomatik yakalama ve vektör araması içeren, LanceDB destekli OpenClaw uzun vadeli bellek Plugin'i.

- **[moonshot](/tr/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. OpenClaw'a Moonshot model sağlayıcısı desteği ekler.

- **[msteams](/tr/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Bot konuşmaları için OpenClaw Microsoft Teams kanal Plugin'i.

- **[nextcloud-talk](/tr/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Konuşmalar için OpenClaw Nextcloud Talk kanal Plugin'i.

- **[nostr](/tr/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. NIP-04 şifreli doğrudan mesajlar için OpenClaw Nostr kanal Plugin'i.

- **[openshell](/tr/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. Yansıtılmış yerel çalışma alanları ve SSH komut yürütmesiyle NVIDIA OpenShell CLI için OpenClaw korumalı alan arka ucu.

- **[parallel](/tr/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Web arama sağlayıcısı desteği ekler.

- **[perplexity](/tr/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Web arama sağlayıcısı desteği ekler.

- **[pixverse](/tr/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. OpenClaw PixVerse video üretim sağlayıcı Plugin'i.

- **[qianfan](/tr/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. OpenClaw'a Qianfan model sağlayıcısı desteği ekler.

- **[qqbot](/tr/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Grup ve doğrudan mesaj iş akışları için OpenClaw QQ Bot kanal Plugin'i.

- **[qwen](/tr/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. OpenClaw'a Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI model sağlayıcısı desteği ekler.

- **[raft](/tr/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Güvenli CLI uyandırma köprüleri için OpenClaw Raft kanal Plugin'i.

- **[searxng](/tr/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Web arama sağlayıcısı desteği ekler.

- **[signal](/tr/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. OpenClaw mesajlarını göndermek ve almak için Signal kanal yüzeyini ekler.

- **[slack](/tr/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Kanallar, doğrudan mesajlar, komutlar ve uygulama olayları için OpenClaw Slack kanal Plugin'i.

- **[sms](/tr/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. OpenClaw metin mesajları için Twilio SMS kanal Plugin'i.

- **[stepfun](/tr/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. OpenClaw'a StepFun, StepFun Plan model sağlayıcısı desteği ekler.

- **[synology-chat](/tr/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. OpenClaw kanalları ve doğrudan mesajlar için Synology Chat kanal Plugin'i.

- **[tavily](/tr/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Ajan tarafından çağrılabilir araçlar ekler. Web arama sağlayıcısı desteği ekler.

- **[tencent](/tr/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. OpenClaw'a Tencent TokenHub model sağlayıcısı desteği ekler.

- **[tlon](/tr/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Sohbet iş akışları için OpenClaw Tlon/Urbit kanal Plugin'i.

- **[tokenjuice](/tr/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. exec ve bash aracı sonuçlarını tokenjuice indirgeme araçlarıyla sıkıştırır.

- **[twitch](/tr/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Sohbet ve moderasyon iş akışları için OpenClaw Twitch kanal Plugin'i.

- **[venice](/tr/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. OpenClaw'a Venice model sağlayıcısı desteği ekler.

- **[vercel-ai-gateway](/tr/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. OpenClaw'a Vercel AI Gateway model sağlayıcısı desteği ekler.

- **[voice-call](/tr/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Twilio, Telnyx ve Plivo telefon çağrıları için OpenClaw voice-call Plugin'i.

- **[whatsapp](/tr/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. WhatsApp Web sohbetleri için OpenClaw WhatsApp kanal Plugin'i.

- **[zai](/tr/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. OpenClaw'a Z.AI model sağlayıcısı desteği ekler.

- **[zalo](/tr/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Bot ve Webhook sohbetleri için OpenClaw Zalo kanal Plugin'i.

- **[zalouser](/tr/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Yerel zca-js entegrasyonu üzerinden OpenClaw Zalo Kişisel Hesap Plugin'i.

## Yalnızca kaynak checkout'u

3 Plugin

- **[qa-channel](/tr/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - yalnızca kaynak checkout'u. OpenClaw mesajlarını göndermek ve almak için QA Channel yüzeyini ekler.

- **[qa-lab](/tr/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - yalnızca kaynak checkout'u. Özel hata ayıklayıcı arayüzü ve senaryo çalıştırıcısı içeren OpenClaw QA lab Plugin'i.

- **[qa-matrix](/tr/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - yalnızca kaynak checkout'u. Matrix QA taşıma çalıştırıcısı ve altyapısı.
