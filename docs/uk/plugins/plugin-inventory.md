---
read_when:
    - Ви вирішуєте, чи Plugin постачається у складі основного npm-пакета, чи встановлюється окремо
    - Ви оновлюєте метадані пакета bundled Plugin або автоматизацію релізу
    - Вам потрібен канонічний список внутрішніх і зовнішніх Plugin
summary: Згенерований інвентар Pluginів OpenClaw, що постачаються в ядрі, публікуються зовні або зберігаються лише у вихідному коді
title: Інвентар Plugin
x-i18n:
    generated_at: "2026-06-27T17:55:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f0c5aa2c3e5f25308a4398dc2582caa8f355a4dfd0d5693d9cfaf1c1ce6926
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Інвентар Plugin

Цю сторінку згенеровано з `extensions/*/package.json`, `openclaw.plugin.json`
і виключень `files` кореневого пакета npm. Перегенеруйте її за допомогою:

```bash
pnpm plugins:inventory:gen
```

## Визначення

- **Основний пакет npm:** вбудований у пакет npm `openclaw` і доступний без окремого встановлення Plugin.
- **Офіційний зовнішній пакет:** Plugin, який підтримує OpenClaw, вилучений з основного пакета npm, збережений у цьому офіційному інвентарі та встановлюється на вимогу через ClawHub та/або npm.
- **Лише source checkout:** локальний для репозиторію Plugin, вилучений з опублікованих артефактів npm і не рекламований як пакет, доступний для встановлення.

Source checkout відрізняються від встановлень npm: після `pnpm install` вбудовані
Plugin завантажуються з `extensions/<id>`, тому локальні редагування та локальні
для пакета залежності workspace доступні.

## Встановлення Plugin

Використовуйте маршрут встановлення в кожному записі, щоб визначити, чи потрібне встановлення. Plugin,
для яких зазначено `included in OpenClaw`, уже присутні в основному пакеті.
Офіційні зовнішні пакети потребують одного встановлення, а потім перезапуску Gateway.

Наприклад, Discord є офіційним зовнішнім пакетом:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Під час переходу запуску звичайні bare package specs усе ще встановлюються з npm.
Використовуйте `clawhub:@openclaw/discord` або `npm:@openclaw/discord`, коли потрібне
явне джерело. Після встановлення дотримуйтеся документації з налаштування Plugin, наприклад
[Discord](/uk/channels/discord), щоб додати облікові дані та конфігурацію каналу. Див.
[Керування Plugin](/uk/plugins/manage-plugins) для команд оновлення, видалення та публікації.

Кожен запис містить пакет, маршрут розповсюдження та опис.

## Основний пакет npm

59 Plugin

- **[admin-http-rpc](/uk/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - включено в OpenClaw. Адміністративна кінцева точка HTTP RPC OpenClaw.

- **[alibaba](/uk/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - включено в OpenClaw. Додає підтримку провайдера генерації відео.

- **[anthropic](/uk/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей Anthropic.

- **[azure-speech](/uk/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - включено в OpenClaw. Azure AI Speech text-to-speech (MP3, нативні голосові нотатки Ogg/Opus, PCM-телефонія).

- **[bonjour](/uk/plugins/reference/bonjour)** (`@openclaw/bonjour`) - включено в OpenClaw. Оголошує локальний Gateway OpenClaw через Bonjour/mDNS.

- **[browser](/uk/plugins/reference/browser)** (`@openclaw/browser-plugin`) - включено в OpenClaw. Додає інструменти, які може викликати агент.

- **[byteplus](/uk/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдерів моделей BytePlus, BytePlus Plan.

- **[canvas](/uk/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - включено в OpenClaw. Експериментальні поверхні керування Canvas і рендерингу A2UI для спарених вузлів.

- **[codex-supervisor](/uk/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - включено в OpenClaw. Наглядає за сеансами app-server Codex з OpenClaw.

- **[cohere](/uk/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - включено в OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. Plugin провайдера Cohere для OpenClaw.

- **[comfy](/uk/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей ComfyUI.

- **[copilot-proxy](/uk/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей Copilot Proxy.

- **[deepgram](/uk/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - включено в OpenClaw. Додає підтримку провайдера розуміння медіа. Додає підтримку провайдера транскрипції в реальному часі.

- **[document-extract](/uk/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - включено в OpenClaw. Витягує текст і резервні зображення сторінок з локальних вкладень документів.

- **[duckduckgo](/uk/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - включено в OpenClaw. Додає підтримку провайдера вебпошуку.

- **[elevenlabs](/uk/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - включено в OpenClaw. Додає підтримку провайдера розуміння медіа. Додає підтримку провайдера транскрипції в реальному часі. Додає підтримку провайдера text-to-speech.

- **[fal](/uk/plugins/reference/fal)** (`@openclaw/fal-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей fal.

- **[file-transfer](/uk/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - включено в OpenClaw. Отримує, перелічує та записує файли на спарених вузлах через виділені команди вузла. Обходить обрізання stdout bash, використовуючи base64 через node.invoke для бінарних файлів до 16 MB.

- **[github-copilot](/uk/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей GitHub Copilot.

- **[google](/uk/plugins/reference/google)** (`@openclaw/google-plugin`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдерів моделей Google, Google Gemini CLI, Google Vertex.

- **[huggingface](/uk/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей Hugging Face.

- **[imessage](/uk/plugins/reference/imessage)** (`@openclaw/imessage`) - включено в OpenClaw. Додає поверхню каналу iMessage для надсилання й отримання повідомлень OpenClaw.

- **[litellm](/uk/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей LiteLLM.

- **[llm-task](/uk/plugins/reference/llm-task)** (`@openclaw/llm-task`) - включено в OpenClaw. Універсальний JSON-only інструмент LLM для структурованих завдань, який можна викликати з workflows.

- **[lmstudio](/uk/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей LM Studio.

- **[memory-core](/uk/plugins/reference/memory-core)** (`@openclaw/memory-core`) - включено в OpenClaw. Додає інструменти, які може викликати агент.

- **[memory-wiki](/uk/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - включено в OpenClaw. Постійний компілятор wiki та сумісне з Obsidian сховище знань для OpenClaw.

- **[microsoft](/uk/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - включено в OpenClaw. Додає підтримку провайдера text-to-speech.

- **[microsoft-foundry](/uk/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей Microsoft Foundry.

- **[migrate-claude](/uk/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - включено в OpenClaw. Імпортує інструкції Claude Code і Claude Desktop, сервери MCP, skills і безпечну конфігурацію в OpenClaw.

- **[migrate-hermes](/uk/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - включено в OpenClaw. Імпортує конфігурацію Hermes, пам’ять, skills і підтримувані облікові дані в OpenClaw.

- **[minimax](/uk/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдерів моделей MiniMax, MiniMax Portal.

- **[mistral](/uk/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей Mistral.

- **[novita](/uk/plugins/reference/novita)** (`@openclaw/novita-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдерів моделей Novita, Novita AI, Novitaai.

- **[nvidia](/uk/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей NVIDIA.

- **[oc-path](/uk/plugins/reference/oc-path)** (`@openclaw/oc-path`) - включено в OpenClaw. Додає openclaw path CLI для адресації файлів workspace через oc://.

- **[ollama](/uk/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдерів моделей Ollama, Ollama Cloud.

- **[open-prose](/uk/plugins/reference/open-prose)** (`@openclaw/open-prose`) - включено в OpenClaw. Пакет skill OpenProse VM із slash-командою /prose.

- **[openai](/uk/plugins/reference/openai)** (`@openclaw/openai-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей OpenAI.

- **[opencode](/uk/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей OpenCode.

- **[opencode-go](/uk/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей OpenCode Go.

- **[openrouter](/uk/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей OpenRouter.

- **[policy](/uk/plugins/reference/policy)** (`@openclaw/policy`) - включено в OpenClaw. Додає перевірки doctor на основі політик для відповідності workspace.

- **[runway](/uk/plugins/reference/runway)** (`@openclaw/runway-provider`) - включено в OpenClaw. Додає підтримку провайдера генерації відео.

- **[senseaudio](/uk/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - включено в OpenClaw. Додає підтримку провайдера розуміння медіа.

- **[sglang](/uk/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей SGLang.

- **[synthetic](/uk/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей Synthetic.

- **[telegram](/uk/plugins/reference/telegram)** (`@openclaw/telegram`) - включено в OpenClaw. Додає поверхню каналу Telegram для надсилання й отримання повідомлень OpenClaw.

- **[together](/uk/plugins/reference/together)** (`@openclaw/together-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей Together.

- **[tts-local-cli](/uk/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - включено в OpenClaw. Додає підтримку провайдера text-to-speech.

- **[vllm](/uk/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей vLLM.

- **[volcengine](/uk/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдерів моделей Volcengine, Volcengine Plan.

- **[voyage](/uk/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - включено в OpenClaw. Додає підтримку провайдера memory embedding.

- **[vydra](/uk/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей Vydra.

- **[web-readability](/uk/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - включено в OpenClaw. Витягує придатний для читання вміст статей із локальних HTML-відповідей веботримання.

- **[webhooks](/uk/plugins/reference/webhooks)** (`@openclaw/webhooks`) - включено в OpenClaw. Автентифіковані вхідні webhooks, які прив’язують зовнішню автоматизацію до OpenClaw TaskFlows.

- **[workboard](/uk/plugins/reference/workboard)** (`@openclaw/workboard`) - включено в OpenClaw. Dashboard workboard для issues і сеансів, якими володіє агент.

- **[xai](/uk/plugins/reference/xai)** (`@openclaw/xai-plugin`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдера моделей xAI.

- **[xiaomi](/uk/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - включено в OpenClaw. Додає до OpenClaw підтримку провайдерів моделей Xiaomi, Xiaomi Token Plan.

## Офіційні зовнішні пакети

68 Plugin

- **[acpx](/uk/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Backend runtime ACP OpenClaw з керуванням сеансами й транспортом, яким володіє Plugin.

- **[amazon-bedrock](/uk/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Plugin провайдера Amazon Bedrock для OpenClaw з виявленням моделей, embeddings і підтримкою guardrail.

- **[amazon-bedrock-mantle](/uk/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Plugin провайдера OpenClaw Amazon Bedrock Mantle для маршрутизації моделей, сумісної з OpenAI.

- **[anthropic-vertex](/uk/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Plugin провайдера OpenClaw Anthropic Vertex для моделей Claude у Google Vertex AI.

- **[arcee](/uk/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Додає підтримку провайдера моделей Arcee до OpenClaw.

- **[brave](/uk/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Plugin провайдера OpenClaw Brave Search для вебпошуку.

- **[cerebras](/uk/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Додає підтримку провайдера моделей Cerebras до OpenClaw.

- **[chutes](/uk/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Додає підтримку провайдера моделей Chutes до OpenClaw.

- **[clickclack](/uk/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Додає поверхню каналу Clickclack для надсилання й отримання повідомлень OpenClaw.

- **[cloudflare-ai-gateway](/uk/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Додає підтримку провайдера моделей Cloudflare AI Gateway до OpenClaw.

- **[codex](/uk/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Plugin каркаса app-server OpenClaw Codex і провайдера моделей із каталогом GPT, керованим Codex.

- **[copilot](/uk/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Реєструє середовище виконання агента GitHub Copilot.

- **[deepinfra](/uk/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Додає підтримку провайдера моделей DeepInfra до OpenClaw.

- **[deepseek](/uk/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Додає підтримку провайдера моделей DeepSeek до OpenClaw.

- **[diagnostics-otel](/uk/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Експортер діагностики OpenClaw OpenTelemetry для метрик, трас і журналів.

- **[diagnostics-prometheus](/uk/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Експортер діагностики OpenClaw Prometheus для метрик середовища виконання.

- **[diffs](/uk/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Plugin OpenClaw для перегляду diff у режимі лише читання і рендерер файлів для агентів.

- **[diffs-language-pack](/uk/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Додає підсвічування синтаксису для мов поза стандартним набором переглядача diff.

- **[discord](/uk/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Plugin каналу OpenClaw Discord для каналів, особистих повідомлень, команд і подій застосунку.

- **[exa](/uk/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Додає підтримку провайдера вебпошуку.

- **[feishu](/uk/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Plugin каналу OpenClaw Feishu/Lark для чатів і робочих інструментів (підтримується спільнотою @m1heng).

- **[firecrawl](/uk/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Додає інструменти, які можуть викликати агенти. Додає підтримку провайдера веботримання. Додає підтримку провайдера вебпошуку.

- **[fireworks](/uk/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Додає підтримку провайдера моделей Fireworks до OpenClaw.

- **[gmi](/uk/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin провайдера OpenClaw GMI Cloud.

- **[google-meet](/uk/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Plugin учасника OpenClaw Google Meet для приєднання до дзвінків через транспорти Chrome або Twilio.

- **[googlechat](/uk/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Plugin каналу OpenClaw Google Chat для просторів і прямих повідомлень.

- **[gradium](/uk/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Додає підтримку провайдера перетворення тексту на мовлення.

- **[groq](/uk/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Додає підтримку провайдера моделей Groq до OpenClaw.

- **[inworld](/uk/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Потокове перетворення тексту на мовлення Inworld (MP3, OGG_OPUS, PCM-телефонія).

- **[irc](/uk/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Додає поверхню каналу IRC для надсилання й отримання повідомлень OpenClaw.

- **[kilocode](/uk/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Додає підтримку провайдера моделей Kilocode до OpenClaw.

- **[kimi](/uk/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Додає підтримку провайдера моделей Kimi, Kimi Coding до OpenClaw.

- **[line](/uk/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. Plugin каналу OpenClaw LINE для чатів LINE Bot API.

- **[llama-cpp](/uk/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Локальні вбудовування GGUF через node-llama-cpp.

- **[lobster](/uk/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Plugin інструмента робочих процесів Lobster для типізованих конвеєрів і відновлюваних затверджень.

- **[matrix](/uk/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Plugin каналу OpenClaw Matrix для кімнат і прямих повідомлень.

- **[mattermost](/uk/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Додає поверхню каналу Mattermost для надсилання й отримання повідомлень OpenClaw.

- **[memory-lancedb](/uk/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Plugin довгострокової пам’яті OpenClaw на базі LanceDB з автоматичним пригадуванням, автоматичним захопленням і векторним пошуком.

- **[moonshot](/uk/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Додає підтримку провайдера моделей Moonshot до OpenClaw.

- **[msteams](/uk/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Plugin каналу OpenClaw Microsoft Teams для розмов із ботом.

- **[nextcloud-talk](/uk/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Plugin каналу OpenClaw Nextcloud Talk для розмов.

- **[nostr](/uk/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. Plugin каналу OpenClaw Nostr для зашифрованих прямих повідомлень NIP-04.

- **[openshell](/uk/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. Бекенд пісочниці OpenClaw для NVIDIA OpenShell CLI з дзеркальними локальними робочими просторами та виконанням команд SSH.

- **[parallel](/uk/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Додає підтримку провайдера вебпошуку.

- **[perplexity](/uk/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Додає підтримку провайдера вебпошуку.

- **[pixverse](/uk/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin провайдера генерації відео OpenClaw PixVerse.

- **[qianfan](/uk/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Додає підтримку провайдера моделей Qianfan до OpenClaw.

- **[qqbot](/uk/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Plugin каналу OpenClaw QQ Bot для групових робочих процесів і робочих процесів прямих повідомлень.

- **[qwen](/uk/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Додає підтримку провайдера моделей Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI до OpenClaw.

- **[raft](/uk/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Plugin каналу OpenClaw Raft для безпечних мостів пробудження CLI.

- **[searxng](/uk/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Додає підтримку провайдера вебпошуку.

- **[signal](/uk/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Додає поверхню каналу Signal для надсилання й отримання повідомлень OpenClaw.

- **[slack](/uk/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Plugin каналу OpenClaw Slack для каналів, особистих повідомлень, команд і подій застосунку.

- **[sms](/uk/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Plugin каналу Twilio SMS для текстових повідомлень OpenClaw.

- **[stepfun](/uk/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Додає підтримку провайдера моделей StepFun, StepFun Plan до OpenClaw.

- **[synology-chat](/uk/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Plugin каналу Synology Chat для каналів OpenClaw і прямих повідомлень.

- **[tavily](/uk/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Додає інструменти, які можуть викликати агенти. Додає підтримку провайдера вебпошуку.

- **[tencent](/uk/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Додає підтримку провайдера моделей Tencent TokenHub до OpenClaw.

- **[tlon](/uk/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Plugin каналу OpenClaw Tlon/Urbit для робочих процесів чату.

- **[tokenjuice](/uk/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Стискає результати інструментів exec і bash за допомогою редукторів tokenjuice.

- **[twitch](/uk/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Plugin каналу OpenClaw Twitch для робочих процесів чату та модерації.

- **[venice](/uk/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Додає підтримку провайдера моделей Venice до OpenClaw.

- **[vercel-ai-gateway](/uk/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Додає підтримку провайдера моделей Vercel AI Gateway до OpenClaw.

- **[voice-call](/uk/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Plugin голосових викликів OpenClaw для телефонних дзвінків Twilio, Telnyx і Plivo.

- **[whatsapp](/uk/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Plugin каналу OpenClaw WhatsApp для чатів WhatsApp Web.

- **[zai](/uk/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Додає підтримку провайдера моделей Z.AI до OpenClaw.

- **[zalo](/uk/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Plugin каналу OpenClaw Zalo для ботів і Webhook-чатів.

- **[zalouser](/uk/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Plugin особистого облікового запису OpenClaw Zalo через нативну інтеграцію zca-js.

## Лише робоча копія вихідного коду

3 Plugin

- **[qa-channel](/uk/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - лише робоча копія вихідного коду. Додає поверхню QA Channel для надсилання й отримання повідомлень OpenClaw.

- **[qa-lab](/uk/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - лише робоча копія вихідного коду. Plugin QA-лабораторії OpenClaw із приватним інтерфейсом налагодження та засобом запуску сценаріїв.

- **[qa-matrix](/uk/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - лише вихідний checkout. Виконавець і базовий шар транспортної матриці QA.
