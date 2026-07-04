---
read_when:
    - Вы решаете, поставляется ли plugin в составе основного пакета npm или устанавливается отдельно
    - Вы обновляете метаданные пакета встроенного Plugin или автоматизацию релиза
    - Вам нужен канонический список внутренних и внешних Plugin
summary: Сгенерированный реестр Plugin OpenClaw, поставляемых в ядре, публикуемых отдельно или сохраняемых только в виде исходного кода
title: Инвентаризация Plugin
x-i18n:
    generated_at: "2026-07-04T03:59:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1af48e3d1ca8e994780dae2ac39dd2d3c3ed0bc8c136cbf3448fe18fadddfb0a
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Инвентарь Plugin

Эта страница генерируется из `extensions/*/package.json`, `openclaw.plugin.json`
и исключений `files` корневого npm-пакета. Перегенерируйте ее с помощью:

```bash
pnpm plugins:inventory:gen
```

## Определения

- **Основной npm-пакет:** встроен в npm-пакет `openclaw` и доступен без отдельной установки Plugin.
- **Официальный внешний пакет:** поддерживаемый OpenClaw Plugin, исключенный из основного npm-пакета, сохраненный в этом официальном инвентаре и устанавливаемый по требованию через ClawHub и/или npm.
- **Только source checkout:** локальный для репозитория Plugin, исключенный из опубликованных npm-артефактов и не рекламируемый как устанавливаемый пакет.

Source checkout отличается от установки из npm: после `pnpm install` встроенные
Plugin загружаются из `extensions/<id>`, поэтому доступны локальные правки и
зависимости workspace, локальные для пакета.

## Установить Plugin

Используйте маршрут установки в каждой записи, чтобы решить, нужна ли установка. Plugin,
для которых указано `included in OpenClaw`, уже присутствуют в основном пакете.
Официальным внешним пакетам нужна одна установка, затем перезапуск Gateway.

Например, Discord является официальным внешним пакетом:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Во время перехода при запуске обычные bare package specs по-прежнему устанавливаются из npm.
Используйте `clawhub:@openclaw/discord` или `npm:@openclaw/discord`, когда нужен
явный источник. После установки следуйте документации по настройке Plugin, например
[Discord](/ru/channels/discord), чтобы добавить учетные данные и конфигурацию канала. См.
[Управление Plugin](/ru/plugins/manage-plugins) для команд обновления, удаления и публикации.

В каждой записи указаны пакет, маршрут распространения и описание.

## Основной npm-пакет

60 Plugin

- **[admin-http-rpc](/ru/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - включен в OpenClaw. HTTP RPC endpoint администратора OpenClaw.

- **[alibaba](/ru/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - включен в OpenClaw. Добавляет поддержку провайдера генерации видео.

- **[anthropic](/ru/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей Anthropic.

- **[azure-speech](/ru/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - включен в OpenClaw. Azure AI Speech text-to-speech (MP3, нативные голосовые заметки Ogg/Opus, PCM-телефония).

- **[bonjour](/ru/plugins/reference/bonjour)** (`@openclaw/bonjour`) - включен в OpenClaw. Объявляет локальный Gateway OpenClaw через Bonjour/mDNS.

- **[browser](/ru/plugins/reference/browser)** (`@openclaw/browser-plugin`) - включен в OpenClaw. Добавляет инструменты, вызываемые агентом.

- **[byteplus](/ru/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдеров моделей BytePlus, BytePlus Plan.

- **[canvas](/ru/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - включен в OpenClaw. Экспериментальные поверхности управления Canvas и рендеринга A2UI для связанных узлов.

- **[clawrouter](/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей ClawRouter.

- **[codex-supervisor](/ru/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - включен в OpenClaw. Управляйте сессиями Codex app-server из OpenClaw.

- **[cohere](/ru/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - включен в OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. Plugin провайдера OpenClaw Cohere.

- **[comfy](/ru/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей ComfyUI.

- **[copilot-proxy](/ru/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей Copilot Proxy.

- **[deepgram](/ru/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - включен в OpenClaw. Добавляет поддержку провайдера понимания медиа. Добавляет поддержку провайдера транскрибации в реальном времени.

- **[document-extract](/ru/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - включен в OpenClaw. Извлекает текст и резервные изображения страниц из локальных вложений документов.

- **[duckduckgo](/ru/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - включен в OpenClaw. Добавляет поддержку провайдера веб-поиска.

- **[elevenlabs](/ru/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - включен в OpenClaw. Добавляет поддержку провайдера понимания медиа. Добавляет поддержку провайдера транскрибации в реальном времени. Добавляет поддержку провайдера text-to-speech.

- **[fal](/ru/plugins/reference/fal)** (`@openclaw/fal-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей fal.

- **[file-transfer](/ru/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - включен в OpenClaw. Получайте, перечисляйте и записывайте файлы на связанных узлах через выделенные команды узла. Обходит усечение stdout bash, используя base64 через node.invoke для бинарных файлов размером до 16 МБ.

- **[github-copilot](/ru/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей GitHub Copilot.

- **[google](/ru/plugins/reference/google)** (`@openclaw/google-plugin`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдеров моделей Google, Google Gemini CLI, Google Vertex.

- **[huggingface](/ru/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей Hugging Face.

- **[imessage](/ru/plugins/reference/imessage)** (`@openclaw/imessage`) - включен в OpenClaw. Добавляет поверхность канала iMessage для отправки и получения сообщений OpenClaw.

- **[litellm](/ru/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей LiteLLM.

- **[llm-task](/ru/plugins/reference/llm-task)** (`@openclaw/llm-task`) - включен в OpenClaw. Универсальный JSON-only LLM-инструмент для структурированных задач, вызываемый из workflows.

- **[lmstudio](/ru/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей LM Studio.

- **[memory-core](/ru/plugins/reference/memory-core)** (`@openclaw/memory-core`) - включен в OpenClaw. Добавляет инструменты, вызываемые агентом.

- **[memory-wiki](/ru/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - включен в OpenClaw. Постоянный wiki-компилятор и совместимое с Obsidian хранилище знаний для OpenClaw.

- **[microsoft](/ru/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - включен в OpenClaw. Добавляет поддержку провайдера text-to-speech.

- **[microsoft-foundry](/ru/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей Microsoft Foundry.

- **[migrate-claude](/ru/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - включен в OpenClaw. Импортирует инструкции Claude Code и Claude Desktop, MCP-серверы, skills и безопасную конфигурацию в OpenClaw.

- **[migrate-hermes](/ru/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - включен в OpenClaw. Импортирует конфигурацию Hermes, memories, skills и поддерживаемые учетные данные в OpenClaw.

- **[minimax](/ru/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдеров моделей MiniMax, MiniMax Portal.

- **[mistral](/ru/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей Mistral.

- **[novita](/ru/plugins/reference/novita)** (`@openclaw/novita-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдеров моделей Novita, Novita AI, Novitaai.

- **[nvidia](/ru/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей NVIDIA.

- **[oc-path](/ru/plugins/reference/oc-path)** (`@openclaw/oc-path`) - включен в OpenClaw. Добавляет CLI `openclaw path` для адресации файлов workspace через oc://.

- **[ollama](/ru/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдеров моделей Ollama, Ollama Cloud.

- **[open-prose](/ru/plugins/reference/open-prose)** (`@openclaw/open-prose`) - включен в OpenClaw. Пакет Skills OpenProse VM со slash-командой /prose.

- **[openai](/ru/plugins/reference/openai)** (`@openclaw/openai-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей OpenAI.

- **[opencode](/ru/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей OpenCode.

- **[opencode-go](/ru/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей OpenCode Go.

- **[openrouter](/ru/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей OpenRouter.

- **[policy](/ru/plugins/reference/policy)** (`@openclaw/policy`) - включен в OpenClaw. Добавляет doctor-проверки соответствия workspace на основе политик.

- **[runway](/ru/plugins/reference/runway)** (`@openclaw/runway-provider`) - включен в OpenClaw. Добавляет поддержку провайдера генерации видео.

- **[senseaudio](/ru/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - включен в OpenClaw. Добавляет поддержку провайдера понимания медиа.

- **[sglang](/ru/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей SGLang.

- **[synthetic](/ru/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей Synthetic.

- **[telegram](/ru/plugins/reference/telegram)** (`@openclaw/telegram`) - включен в OpenClaw. Добавляет поверхность канала Telegram для отправки и получения сообщений OpenClaw.

- **[together](/ru/plugins/reference/together)** (`@openclaw/together-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей Together.

- **[tts-local-cli](/ru/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - включен в OpenClaw. Добавляет поддержку провайдера text-to-speech.

- **[vllm](/ru/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей vLLM.

- **[volcengine](/ru/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдеров моделей Volcengine, Volcengine Plan.

- **[voyage](/ru/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - включен в OpenClaw. Добавляет поддержку провайдера embedding памяти.

- **[vydra](/ru/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей Vydra.

- **[web-readability](/ru/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - включен в OpenClaw. Извлекает читаемое содержимое статей из локальных HTML-ответов веб-запросов.

- **[webhooks](/ru/plugins/reference/webhooks)** (`@openclaw/webhooks`) - включен в OpenClaw. Аутентифицированные входящие Webhook, которые связывают внешнюю автоматизацию с OpenClaw TaskFlows.

- **[workboard](/ru/plugins/reference/workboard)** (`@openclaw/workboard`) - включен в OpenClaw. Dashboard workboard для задач и сессий, принадлежащих агентам.

- **[xai](/ru/plugins/reference/xai)** (`@openclaw/xai-plugin`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей xAI.

- **[xiaomi](/ru/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - включен в OpenClaw. Добавляет в OpenClaw поддержку провайдеров моделей Xiaomi, Xiaomi Token Plan.

## Официальные внешние пакеты

68 Plugin

- **[acpx](/ru/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Backend runtime OpenClaw ACP с управлением сессиями и транспортом, принадлежащим Plugin.

- **[amazon-bedrock](/ru/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Plugin провайдера OpenClaw Amazon Bedrock с обнаружением моделей, embeddings и поддержкой guardrails.

- **[amazon-bedrock-mantle](/ru/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Плагин поставщика OpenClaw Amazon Bedrock Mantle для маршрутизации моделей, совместимой с OpenAI.

- **[anthropic-vertex](/ru/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Плагин поставщика OpenClaw Anthropic Vertex для моделей Claude в Google Vertex AI.

- **[arcee](/ru/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Добавляет в OpenClaw поддержку поставщика моделей Arcee.

- **[brave](/ru/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Плагин поставщика OpenClaw Brave Search для веб-поиска.

- **[cerebras](/ru/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Добавляет в OpenClaw поддержку поставщика моделей Cerebras.

- **[chutes](/ru/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Добавляет в OpenClaw поддержку поставщика моделей Chutes.

- **[clickclack](/ru/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Добавляет поверхность канала Clickclack для отправки и получения сообщений OpenClaw.

- **[cloudflare-ai-gateway](/ru/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Добавляет в OpenClaw поддержку поставщика моделей Cloudflare AI Gateway.

- **[codex](/ru/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Плагин OpenClaw для обвязки app-server Codex и поставщика моделей с каталогом GPT под управлением Codex.

- **[copilot](/ru/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Регистрирует среду выполнения агента GitHub Copilot.

- **[deepinfra](/ru/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Добавляет в OpenClaw поддержку поставщика моделей DeepInfra.

- **[deepseek](/ru/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Добавляет в OpenClaw поддержку поставщика моделей DeepSeek.

- **[diagnostics-otel](/ru/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Экспортер диагностики OpenClaw OpenTelemetry для метрик, трассировок и журналов.

- **[diagnostics-prometheus](/ru/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Экспортер диагностики OpenClaw Prometheus для метрик среды выполнения.

- **[diffs](/ru/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Плагин OpenClaw для просмотра diff в режиме только для чтения и рендеринга файлов для агентов.

- **[diffs-language-pack](/ru/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Добавляет подсветку синтаксиса для языков вне стандартного набора средства просмотра diff.

- **[discord](/ru/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Плагин канала OpenClaw Discord для каналов, личных сообщений, команд и событий приложения.

- **[exa](/ru/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Добавляет поддержку поставщика веб-поиска.

- **[feishu](/ru/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Плагин канала OpenClaw Feishu/Lark для чатов и рабочих инструментов (поддерживается сообществом, @m1heng).

- **[firecrawl](/ru/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Добавляет инструменты, вызываемые агентами. Добавляет поддержку поставщика веб-загрузки. Добавляет поддержку поставщика веб-поиска.

- **[fireworks](/ru/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Добавляет в OpenClaw поддержку поставщика моделей Fireworks.

- **[gmi](/ru/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Плагин поставщика OpenClaw GMI Cloud.

- **[google-meet](/ru/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Плагин участника OpenClaw Google Meet для подключения к звонкам через транспорты Chrome или Twilio.

- **[googlechat](/ru/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Плагин канала OpenClaw Google Chat для пространств и личных сообщений.

- **[gradium](/ru/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Добавляет поддержку поставщика преобразования текста в речь.

- **[groq](/ru/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Добавляет в OpenClaw поддержку поставщика моделей Groq.

- **[inworld](/ru/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Потоковое преобразование текста в речь Inworld (MP3, OGG_OPUS, PCM-телефония).

- **[irc](/ru/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Добавляет поверхность канала IRC для отправки и получения сообщений OpenClaw.

- **[kilocode](/ru/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Добавляет в OpenClaw поддержку поставщика моделей Kilocode.

- **[kimi](/ru/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Добавляет в OpenClaw поддержку поставщика моделей Kimi, Kimi Coding.

- **[line](/ru/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. Плагин канала OpenClaw LINE для чатов LINE Bot API.

- **[llama-cpp](/ru/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Локальные GGUF-эмбеддинги через node-llama-cpp.

- **[lobster](/ru/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Плагин инструмента рабочих процессов Lobster для типизированных конвейеров и возобновляемых подтверждений.

- **[matrix](/ru/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Плагин канала OpenClaw Matrix для комнат и личных сообщений.

- **[mattermost](/ru/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Добавляет поверхность канала Mattermost для отправки и получения сообщений OpenClaw.

- **[memory-lancedb](/ru/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Плагин долговременной памяти OpenClaw на базе LanceDB с автоматическим вспоминанием, автоматическим захватом и векторным поиском.

- **[moonshot](/ru/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Добавляет в OpenClaw поддержку поставщика моделей Moonshot.

- **[msteams](/ru/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Плагин канала OpenClaw Microsoft Teams для бесед с ботом.

- **[nextcloud-talk](/ru/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Плагин канала OpenClaw Nextcloud Talk для бесед.

- **[nostr](/ru/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. Плагин канала OpenClaw Nostr для зашифрованных личных сообщений NIP-04.

- **[openshell](/ru/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. Бэкенд песочницы OpenClaw для NVIDIA OpenShell CLI с зеркалированными локальными рабочими пространствами и выполнением команд по SSH.

- **[parallel](/ru/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Добавляет поддержку поставщика веб-поиска.

- **[perplexity](/ru/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Добавляет поддержку поставщика веб-поиска.

- **[pixverse](/ru/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Плагин поставщика генерации видео OpenClaw PixVerse.

- **[qianfan](/ru/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Добавляет в OpenClaw поддержку поставщика моделей Qianfan.

- **[qqbot](/ru/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Плагин канала OpenClaw QQ Bot для рабочих процессов групп и личных сообщений.

- **[qwen](/ru/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Добавляет в OpenClaw поддержку поставщиков моделей Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI.

- **[raft](/ru/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Плагин канала OpenClaw Raft для безопасных CLI-мостов пробуждения.

- **[searxng](/ru/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Добавляет поддержку поставщика веб-поиска.

- **[signal](/ru/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Добавляет поверхность канала Signal для отправки и получения сообщений OpenClaw.

- **[slack](/ru/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Плагин канала OpenClaw Slack для каналов, личных сообщений, команд и событий приложения.

- **[sms](/ru/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Плагин канала Twilio SMS для текстовых сообщений OpenClaw.

- **[stepfun](/ru/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Добавляет в OpenClaw поддержку поставщиков моделей StepFun, StepFun Plan.

- **[synology-chat](/ru/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Плагин канала Synology Chat для каналов OpenClaw и личных сообщений.

- **[tavily](/ru/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Добавляет инструменты, вызываемые агентами. Добавляет поддержку поставщика веб-поиска.

- **[tencent](/ru/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Добавляет в OpenClaw поддержку поставщика моделей Tencent TokenHub.

- **[tlon](/ru/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Плагин канала OpenClaw Tlon/Urbit для рабочих процессов чата.

- **[tokenjuice](/ru/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Уплотняет результаты инструментов exec и bash с помощью редьюсеров tokenjuice.

- **[twitch](/ru/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Плагин канала OpenClaw Twitch для рабочих процессов чата и модерации.

- **[venice](/ru/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Добавляет в OpenClaw поддержку поставщика моделей Venice.

- **[vercel-ai-gateway](/ru/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Добавляет в OpenClaw поддержку поставщика моделей Vercel AI Gateway.

- **[voice-call](/ru/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Плагин голосовых вызовов OpenClaw для телефонных звонков через Twilio, Telnyx и Plivo.

- **[whatsapp](/ru/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Плагин канала OpenClaw WhatsApp для чатов WhatsApp Web.

- **[zai](/ru/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Добавляет в OpenClaw поддержку поставщика моделей Z.AI.

- **[zalo](/ru/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Плагин канала OpenClaw Zalo для чатов бота и Webhook.

- **[zalouser](/ru/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Плагин OpenClaw Zalo Personal Account через нативную интеграцию zca-js.

## Только source checkout

3 плагина

- **[qa-channel](/ru/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - только source checkout. Добавляет поверхность QA Channel для отправки и получения сообщений OpenClaw.

- **[qa-lab](/ru/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - только source checkout. Плагин лаборатории QA OpenClaw с частным UI отладчика и средством запуска сценариев.

- **[qa-matrix](/ru/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - только для checkout исходного кода. Исполнитель и субстрат транспортного QA Matrix.
