---
read_when:
    - Вы решаете, поставляется ли плагин в основном пакете npm или устанавливается отдельно
    - Вы обновляете метаданные пакетов встроенных плагинов или автоматизацию выпуска релизов
    - Вам нужен канонический список внутренних и внешних плагинов
summary: Сформированный перечень плагинов OpenClaw, поставляемых в составе ядра, публикуемых отдельно или доступных только в исходном коде
title: Перечень плагинов
x-i18n:
    generated_at: "2026-07-13T18:32:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: a56b31916c365f7382893f1a6bdfa7dedea4b2f2fa5f12ba82fc3da8c875538c
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Реестр плагинов

Эта страница создаётся на основе `extensions/*/package.json`, `openclaw.plugin.json`
и исключений корневого npm-пакета `files`. Чтобы создать её заново, выполните:

```bash
pnpm plugins:inventory:gen
```

## Определения

- **Основной npm-пакет:** встроен в npm-пакет `openclaw` и доступен без отдельной установки плагина.
- **Официальный внешний пакет:** поддерживаемый OpenClaw плагин, исключённый из основного npm-пакета, включённый в этот официальный реестр и устанавливаемый по запросу через ClawHub и/или npm.
- **Только исходный рабочий каталог:** локальный для репозитория плагин, исключённый из публикуемых артефактов npm и не предлагаемый как устанавливаемый пакет.

Исходные рабочие каталоги отличаются от установок npm: после `pnpm install` встроенные
плагины загружаются из `extensions/<id>`, поэтому доступны локальные изменения и локальные для пакета
зависимости рабочего пространства.

## Установка плагина

По указанному в каждой записи способу установки определите, нужна ли установка. Плагины,
для которых указано `included in OpenClaw`, уже присутствуют в основном пакете.
Официальные внешние пакеты необходимо установить один раз, а затем перезапустить Gateway.

Например, Discord — официальный внешний пакет:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Во время перехода при запуске обычные спецификации пакетов без префикса по-прежнему устанавливаются из npm.
Используйте `clawhub:@openclaw/discord` или `npm:@openclaw/discord`, когда требуется
явно указать источник. После установки следуйте документации по настройке плагина, например
[Discord](/ru/channels/discord), чтобы добавить учётные данные и конфигурацию канала. Команды
обновления, удаления и публикации см. в разделе
[Управление плагинами](/ru/plugins/manage-plugins).

В каждой записи указаны пакет, способ распространения и описание.

## Основной npm-пакет

66 плагинов

- **[admin-http-rpc](/ru/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) — включён в OpenClaw. Конечная точка административного HTTP RPC OpenClaw.

- **[alibaba](/ru/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) — включён в OpenClaw. Добавляет поддержку провайдера генерации видео.

- **[anthropic](/ru/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) — включён в OpenClaw. Модели Anthropic, Claude CLI и нативный каталог сеансов Claude.

- **[azure-speech](/ru/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) — включён в OpenClaw. Преобразование текста в речь с помощью Azure AI Speech (MP3, нативные голосовые сообщения Ogg/Opus, телефония PCM).

- **[bonjour](/ru/plugins/reference/bonjour)** (`@openclaw/bonjour`) — включён в OpenClaw. Объявляет локальный Gateway OpenClaw через Bonjour/mDNS.

- **[browser](/ru/plugins/reference/browser)** (`@openclaw/browser-plugin`) — включён в OpenClaw. Добавляет инструменты, вызываемые агентом.

- **[byteplus](/ru/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдеров моделей BytePlus и BytePlus Plan.

- **[canvas](/ru/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) — включён в OpenClaw. Экспериментальные поверхности управления Canvas и отрисовки A2UI для сопряжённых узлов.

- **[clawrouter](/ru/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей ClawRouter.

- **[cohere](/ru/plugins/reference/cohere)** (`@openclaw/cohere-provider`) — включён в OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. Плагин провайдера Cohere для OpenClaw.

- **[comfy](/ru/plugins/reference/comfy)** (`@openclaw/comfy-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей ComfyUI.

- **[copilot-proxy](/ru/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей Copilot Proxy.

- **[crabbox](/ru/plugins/reference/crabbox)** (`@openclaw/crabbox-provider`) — включён в OpenClaw. Провайдер облачных рабочих процессов на базе Crabbox CLI.

- **[deepgram](/ru/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) — включён в OpenClaw. Добавляет поддержку провайдера анализа медиаданных. Добавляет поддержку провайдера транскрибирования в реальном времени.

- **[document-extract](/ru/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) — включён в OpenClaw. Извлекает текст и резервные изображения страниц из локальных вложений документов.

- **[duckduckgo](/ru/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) — включён в OpenClaw. Добавляет поддержку провайдера веб-поиска.

- **[elevenlabs](/ru/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) — включён в OpenClaw. Добавляет поддержку провайдера анализа медиаданных. Добавляет поддержку провайдера транскрибирования в реальном времени. Добавляет поддержку провайдера преобразования текста в речь.

- **[fal](/ru/plugins/reference/fal)** (`@openclaw/fal-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей fal.

- **[file-transfer](/ru/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) — включён в OpenClaw. Получает, перечисляет и записывает файлы на сопряжённых узлах с помощью специальных команд узла. Позволяет избежать усечения стандартного вывода bash, используя base64 поверх node.invoke для двоичных файлов размером до 16 МБ.

- **[github-copilot](/ru/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей GitHub Copilot.

- **[google](/ru/plugins/reference/google)** (`@openclaw/google-plugin`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдеров моделей Google, Google Gemini CLI и Google Vertex.

- **[huggingface](/ru/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей Hugging Face.

- **[imessage](/ru/plugins/reference/imessage)** (`@openclaw/imessage`) — включён в OpenClaw. Добавляет поверхность канала iMessage для отправки и получения сообщений OpenClaw.

- **[litellm](/ru/plugins/reference/litellm)** (`@openclaw/litellm-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей LiteLLM.

- **[llm-task](/ru/plugins/reference/llm-task)** (`@openclaw/llm-task`) — включён в OpenClaw. Универсальный инструмент LLM, работающий только с JSON, для структурированных задач, вызываемых из рабочих процессов.

- **[lmstudio](/ru/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей LM Studio.

- **[logbook](/ru/plugins/reference/logbook)** (`@openclaw/logbook`) — включён в OpenClaw. Автоматический рабочий журнал: периодически создаёт снимки экрана сопряжённого узла и преобразует их в доступную для просмотра хронологию вашего дня.

- **[memory-core](/ru/plugins/reference/memory-core)** (`@openclaw/memory-core`) — включён в OpenClaw. Добавляет инструменты, вызываемые агентом.

- **[memory-wiki](/ru/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) — включён в OpenClaw. Компилятор постоянной вики и совместимое с Obsidian хранилище знаний для OpenClaw.

- **[meta](/ru/plugins/reference/meta)** (`@openclaw/meta-provider`) — включён в OpenClaw; npm; ClawHub: `clawhub:@openclaw/meta-provider`. Добавляет в OpenClaw поддержку провайдера моделей Meta.

- **[microsoft](/ru/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) — включён в OpenClaw. Добавляет поддержку провайдера преобразования текста в речь.

- **[microsoft-foundry](/ru/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей Microsoft Foundry.

- **[migrate-claude](/ru/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) — включён в OpenClaw. Импортирует в OpenClaw инструкции Claude Code и Claude Desktop, серверы MCP, навыки и безопасную конфигурацию.

- **[migrate-hermes](/ru/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) — включён в OpenClaw. Импортирует в OpenClaw конфигурацию, память, навыки и поддерживаемые учётные данные Hermes.

- **[minimax](/ru/plugins/reference/minimax)** (`@openclaw/minimax-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдеров моделей MiniMax и MiniMax Portal.

- **[mistral](/ru/plugins/reference/mistral)** (`@openclaw/mistral-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей Mistral.

- **[novita](/ru/plugins/reference/novita)** (`@openclaw/novita-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдеров моделей Novita, Novita AI и Novitaai.

- **[nvidia](/ru/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей NVIDIA.

- **[oc-path](/ru/plugins/reference/oc-path)** (`@openclaw/oc-path`) — включён в OpenClaw. Добавляет CLI openclaw path для адресации файлов рабочего пространства через oc://.

- **[ollama](/ru/plugins/reference/ollama)** (`@openclaw/ollama-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдеров моделей Ollama и Ollama Cloud.

- **[onepassword](/ru/plugins/reference/onepassword)** (`@openclaw/onepassword`) — включён в OpenClaw. Курируемый брокер секретов 1Password с политикой подтверждения и журналом аудита SQLite.

- **[open-prose](/ru/plugins/reference/open-prose)** (`@openclaw/open-prose`) — включён в OpenClaw. Пакет навыков виртуальной машины OpenProse с командой /prose.

- **[openai](/ru/plugins/reference/openai)** (`@openclaw/openai-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей OpenAI.

- **[opencode](/ru/plugins/reference/opencode)** (`@openclaw/opencode-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей OpenCode.

- **[opencode-go](/ru/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей OpenCode Go.

- **[openrouter](/ru/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей OpenRouter.

- **[policy](/ru/plugins/reference/policy)** (`@openclaw/policy`) — включён в OpenClaw. Добавляет основанные на политиках проверки doctor на соответствие рабочего пространства требованиям.

- **[reef](/plugins/reference/reef)** (`@openclaw/reef`) — включён в OpenClaw. Защищённый канал claw со сквозным шифрованием.

- **[runway](/ru/plugins/reference/runway)** (`@openclaw/runway-provider`) — включён в OpenClaw. Добавляет поддержку провайдера генерации видео.

- **[senseaudio](/ru/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) — включён в OpenClaw. Добавляет поддержку провайдера анализа медиаданных.

- **[sglang](/ru/plugins/reference/sglang)** (`@openclaw/sglang-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей SGLang.

- **[synthetic](/ru/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей Synthetic.

- **[telegram](/ru/plugins/reference/telegram)** (`@openclaw/telegram`) — включён в OpenClaw. Добавляет поверхность канала Telegram для отправки и получения сообщений OpenClaw.

- **[together](/ru/plugins/reference/together)** (`@openclaw/together-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей Together.

- **[tts-local-cli](/ru/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) — включён в OpenClaw. Добавляет поддержку провайдера преобразования текста в речь.

- **[vault](/ru/plugins/reference/vault)** (`@openclaw/vault`) — включён в OpenClaw. Интеграция провайдера SecretRef HashiCorp Vault.

- **[vllm](/ru/plugins/reference/vllm)** (`@openclaw/vllm-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдера моделей vLLM.

- **[volcengine](/ru/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) — включён в OpenClaw. Добавляет в OpenClaw поддержку провайдеров моделей Volcengine и Volcengine Plan.

- **[voyage](/ru/plugins/reference/voyage)** (`@openclaw/voyage-provider`) — включён в OpenClaw. Добавляет поддержку провайдера векторных представлений памяти.

- **[vydra](/ru/plugins/reference/vydra)** (`@openclaw/vydra-provider`) — входит в состав OpenClaw. Добавляет в OpenClaw поддержку поставщика моделей Vydra.

- **[web-readability](/ru/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) — входит в состав OpenClaw. Извлекает удобочитаемое содержимое статей из ответов локальной загрузки HTML-страниц.

- **[webhooks](/ru/plugins/reference/webhooks)** (`@openclaw/webhooks`) — входит в состав OpenClaw. Аутентифицированные входящие вебхуки, связывающие внешнюю автоматизацию с TaskFlow в OpenClaw.

- **[workboard](/ru/plugins/reference/workboard)** (`@openclaw/workboard`) — входит в состав OpenClaw. Панель задач для проблем и сеансов, которыми управляют агенты.

- **[workspaces](/ru/plugins/reference/workspaces)** (`@openclaw/workspaces-plugin`) — входит в состав OpenClaw. Компонуемый агентами бэкенд документов Workspaces и плоскости управления.

- **[xai](/ru/plugins/reference/xai)** (`@openclaw/xai-plugin`) — входит в состав OpenClaw. Добавляет в OpenClaw поддержку поставщика моделей xAI.

- **[xiaomi](/ru/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) — входит в состав OpenClaw. Добавляет в OpenClaw поддержку поставщика моделей Xiaomi и Xiaomi Token Plan.

## Официальные внешние пакеты

71 плагин

- **[acpx](/ru/plugins/reference/acpx)** (`@openclaw/acpx`) — npm; ClawHub. Бэкенд среды выполнения ACP для OpenClaw с управлением сеансами и транспортом на стороне плагина.

- **[amazon-bedrock](/ru/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) — npm; ClawHub. Плагин поставщика Amazon Bedrock для OpenClaw с обнаружением моделей, эмбеддингами и поддержкой защитных ограничений.

- **[amazon-bedrock-mantle](/ru/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) — npm; ClawHub. Плагин поставщика Amazon Bedrock Mantle для OpenClaw, предназначенный для маршрутизации моделей, совместимых с OpenAI.

- **[anthropic-vertex](/ru/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) — npm; ClawHub. Плагин поставщика Anthropic Vertex для OpenClaw, обеспечивающий работу моделей Claude в Google Vertex AI.

- **[arcee](/ru/plugins/reference/arcee)** (`@openclaw/arcee-provider`) — npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Добавляет в OpenClaw поддержку поставщика моделей Arcee.

- **[brave](/ru/plugins/reference/brave)** (`@openclaw/brave-plugin`) — npm; ClawHub. Плагин поставщика Brave Search для веб-поиска в OpenClaw.

- **[cerebras](/ru/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) — npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Добавляет в OpenClaw поддержку поставщика моделей Cerebras.

- **[chutes](/ru/plugins/reference/chutes)** (`@openclaw/chutes-provider`) — npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Добавляет в OpenClaw поддержку поставщика моделей Chutes.

- **[clickclack](/ru/plugins/reference/clickclack)** (`@openclaw/clickclack`) — npm; ClawHub: `clawhub:@openclaw/clickclack`. Добавляет канал Clickclack для отправки и получения сообщений OpenClaw.

- **[cloudflare-ai-gateway](/ru/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) — npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Добавляет в OpenClaw поддержку поставщика моделей Cloudflare AI Gateway.

- **[codex](/ru/plugins/reference/codex)** (`@openclaw/codex`) — npm; ClawHub. Среда интеграции сервера приложений Codex, поставщик моделей и встроенный каталог сеансов.

- **[copilot](/ru/plugins/reference/copilot)** (`@openclaw/copilot`) — npm; ClawHub: `clawhub:@openclaw/copilot`. Регистрирует среду выполнения агента GitHub Copilot.

- **[deepinfra](/ru/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) — npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Добавляет в OpenClaw поддержку поставщика моделей DeepInfra.

- **[deepseek](/ru/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) — npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Добавляет в OpenClaw поддержку поставщика моделей DeepSeek.

- **[diagnostics-otel](/ru/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) — npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Экспортёр диагностических данных OpenTelemetry для метрик, трассировок и журналов OpenClaw.

- **[diagnostics-prometheus](/ru/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) — npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Экспортёр диагностических данных Prometheus для метрик среды выполнения OpenClaw.

- **[diffs](/ru/plugins/reference/diffs)** (`@openclaw/diffs`) — npm; ClawHub. Плагин OpenClaw для просмотра различий в режиме только для чтения и средство визуализации файлов для агентов.

- **[diffs-language-pack](/ru/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) — npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Добавляет подсветку синтаксиса для языков, не входящих в стандартный набор средства просмотра различий.

- **[discord](/ru/plugins/reference/discord)** (`@openclaw/discord`) — npm; ClawHub. Плагин канала Discord для OpenClaw с поддержкой каналов, личных сообщений, команд и событий приложений.

- **[exa](/ru/plugins/reference/exa)** (`@openclaw/exa-plugin`) — npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Добавляет поддержку поставщика веб-поиска.

- **[featherless](/ru/plugins/reference/featherless)** (`@openclaw/featherless-provider`) — npm; ClawHub: `clawhub:@openclaw/featherless-provider`. Плагин поставщика Featherless AI для OpenClaw.

- **[feishu](/ru/plugins/reference/feishu)** (`@openclaw/feishu`) — npm; ClawHub. Плагин канала Feishu/Lark для OpenClaw, предназначенный для чатов и рабочих инструментов (поддерживается сообществом во главе с @m1heng).

- **[firecrawl](/ru/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) — npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Добавляет инструменты, вызываемые агентами. Добавляет поддержку поставщика загрузки веб-страниц. Добавляет поддержку поставщика веб-поиска.

- **[fireworks](/ru/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) — npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Добавляет в OpenClaw поддержку поставщика моделей Fireworks.

- **[gmi](/ru/plugins/reference/gmi)** (`@openclaw/gmi-provider`) — npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Плагин поставщика GMI Cloud для OpenClaw.

- **[google-meet](/ru/plugins/reference/google-meet)** (`@openclaw/google-meet`) — npm; ClawHub. Плагин участника Google Meet для OpenClaw, позволяющий присоединяться к звонкам через транспорт Chrome или Twilio.

- **[googlechat](/ru/plugins/reference/googlechat)** (`@openclaw/googlechat`) — npm; ClawHub. Плагин канала Google Chat для OpenClaw с поддержкой пространств и личных сообщений.

- **[gradium](/ru/plugins/reference/gradium)** (`@openclaw/gradium-speech`) — npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Добавляет поддержку поставщика преобразования текста в речь.

- **[groq](/ru/plugins/reference/groq)** (`@openclaw/groq-provider`) — npm; ClawHub: `clawhub:@openclaw/groq-provider`. Добавляет в OpenClaw поддержку поставщика моделей Groq.

- **[inworld](/ru/plugins/reference/inworld)** (`@openclaw/inworld-speech`) — npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Потоковое преобразование текста в речь Inworld (MP3, OGG_OPUS, PCM для телефонии).

- **[irc](/ru/plugins/reference/irc)** (`@openclaw/irc`) — npm; ClawHub: `clawhub:@openclaw/irc`. Добавляет канал IRC для отправки и получения сообщений OpenClaw.

- **[kilocode](/ru/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) — npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Добавляет в OpenClaw поддержку поставщика моделей Kilocode.

- **[kimi](/ru/plugins/reference/kimi)** (`@openclaw/kimi-provider`) — npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Добавляет в OpenClaw поддержку поставщика моделей Kimi и Kimi Coding.

- **[line](/ru/plugins/reference/line)** (`@openclaw/line`) — npm; ClawHub. Плагин канала LINE для OpenClaw, предназначенный для чатов LINE Bot API.

- **[llama-cpp](/ru/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) — npm; ClawHub. Локальные эмбеддинги GGUF через node-llama-cpp.

- **[lobster](/ru/plugins/reference/lobster)** (`@openclaw/lobster`) — npm; ClawHub. Плагин инструмента рабочих процессов Lobster для типизированных конвейеров и возобновляемых согласований.

- **[longcat](/ru/plugins/reference/longcat)** (`@openclaw/longcat-provider`) — npm; ClawHub: `clawhub:@openclaw/longcat-provider`. Плагин поставщика LongCat для OpenClaw.

- **[matrix](/ru/plugins/reference/matrix)** (`@openclaw/matrix`) — ClawHub: `clawhub:@openclaw/matrix`; npm. Плагин канала Matrix для OpenClaw с поддержкой комнат и личных сообщений.

- **[mattermost](/ru/plugins/reference/mattermost)** (`@openclaw/mattermost`) — npm; ClawHub: `clawhub:@openclaw/mattermost`. Добавляет канал Mattermost для отправки и получения сообщений OpenClaw.

- **[memory-lancedb](/ru/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) — npm; ClawHub. Плагин долговременной памяти OpenClaw на базе LanceDB с автоматическим извлечением, автоматическим сохранением и векторным поиском.

- **[moonshot](/ru/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) — npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Добавляет в OpenClaw поддержку поставщика моделей Moonshot.

- **[msteams](/ru/plugins/reference/msteams)** (`@openclaw/msteams`) — npm; ClawHub. Плагин канала Microsoft Teams для OpenClaw, предназначенный для общения с ботами.

- **[mxc](/plugins/reference/mxc)** (`@openclaw/mxc-sandbox`) — npm; ClawHub. Изолированное на уровне ОС выполнение инструментов через MXC для совместимых с MXC узлов Windows: команды выполняются в ProcessContainer (Windows) с настроенными файлами политик MXC.

- **[nextcloud-talk](/ru/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) — npm; ClawHub. Плагин канала Nextcloud Talk для общения в OpenClaw.

- **[nostr](/ru/plugins/reference/nostr)** (`@openclaw/nostr`) — npm; ClawHub. Плагин канала Nostr для OpenClaw с поддержкой зашифрованных личных сообщений NIP-04.

- **[openshell](/ru/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) — npm; ClawHub. Бэкенд песочницы OpenClaw для NVIDIA OpenShell CLI с зеркалируемыми локальными рабочими пространствами и выполнением команд по SSH.

- **[parallel](/ru/tools/parallel-search)** (`@openclaw/parallel-plugin`) — npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Добавляет поддержку поставщика веб-поиска.

- **[perplexity](/ru/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) — npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Добавляет поддержку поставщика веб-поиска.

- **[pixverse](/ru/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) — npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Плагин поставщика генерации видео PixVerse для OpenClaw.

- **[qianfan](/ru/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) — npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Добавляет в OpenClaw поддержку поставщика моделей Qianfan.

- **[qqbot](/ru/plugins/reference/qqbot)** (`@openclaw/qqbot`) — npm; ClawHub. Плагин канала QQ Bot для OpenClaw, предназначенный для групповых рабочих процессов и рабочих процессов с личными сообщениями.

- **[qwen](/ru/plugins/reference/qwen)** (`@openclaw/qwen-provider`) — npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Добавляет в OpenClaw поддержку поставщика моделей Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI, Qwen Token Plan и Bailian Token Plan.

- **[raft](/ru/plugins/reference/raft)** (`@openclaw/raft`) — npm; ClawHub. Плагин канала Raft для OpenClaw, обеспечивающий безопасные мосты активации CLI.

- **[searxng](/ru/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) — npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Добавляет поддержку поставщика веб-поиска.

- **[signal](/ru/plugins/reference/signal)** (`@openclaw/signal`) — npm; ClawHub: `clawhub:@openclaw/signal`. Добавляет канал Signal для отправки и получения сообщений OpenClaw.

- **[slack](/ru/plugins/reference/slack)** (`@openclaw/slack`) — npm; ClawHub. Плагин канала Slack для OpenClaw с поддержкой каналов, личных сообщений, команд и событий приложений.

- **[sms](/ru/plugins/reference/sms)** (`@openclaw/sms`) — npm; ClawHub: `clawhub:@openclaw/sms`. Плагин канала Twilio SMS для текстовых сообщений OpenClaw.

- **[stepfun](/ru/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) — npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Добавляет в OpenClaw поддержку поставщика моделей StepFun и StepFun Plan.

- **[synology-chat](/ru/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) — npm; ClawHub. Плагин канала Synology Chat для каналов и личных сообщений OpenClaw.

- **[tavily](/ru/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) — npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Добавляет инструменты, вызываемые агентами. Добавляет поддержку поставщика веб-поиска.

- **[tencent](/ru/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Добавляет в OpenClaw поддержку провайдеров моделей Tencent TokenHub и Tencent Tokenplan.

- **[tlon](/ru/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Плагин канала Tlon/Urbit для OpenClaw, предназначенный для рабочих процессов чата.

- **[tokenjuice](/ru/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Сокращает результаты инструментов exec и bash с помощью редьюсеров Tokenjuice.

- **[twitch](/ru/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Плагин канала Twitch для OpenClaw, предназначенный для рабочих процессов чата и модерации.

- **[venice](/ru/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Добавляет в OpenClaw поддержку провайдера моделей Venice.

- **[vercel-ai-gateway](/ru/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Добавляет в OpenClaw поддержку провайдера моделей Vercel AI Gateway.

- **[voice-call](/ru/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Плагин голосовых вызовов для OpenClaw, поддерживающий телефонные звонки через Twilio, Telnyx и Plivo.

- **[whatsapp](/ru/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Плагин канала WhatsApp для OpenClaw, предназначенный для чатов WhatsApp Web.

- **[zai](/ru/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Добавляет в OpenClaw поддержку провайдера моделей Z.AI.

- **[zalo](/ru/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Плагин канала Zalo для OpenClaw, предназначенный для чатов с ботами и Webhook.

- **[zalouser](/ru/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Плагин личной учётной записи Zalo для OpenClaw с нативной интеграцией zca-js.

## Только при работе с исходным кодом

3 плагина

- **[qa-channel](/ru/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - только при работе с исходным кодом. Добавляет интерфейс QA Channel для отправки и получения сообщений OpenClaw.

- **[qa-lab](/ru/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - только при работе с исходным кодом. Плагин лаборатории контроля качества OpenClaw с закрытым интерфейсом отладчика и средством запуска сценариев.

- **[qa-matrix](/ru/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - только при работе с исходным кодом. Средство запуска и базовая среда транспорта Matrix для контроля качества.
