---
read_when:
    - Ви вирішуєте, чи Plugin постачається в основному пакеті npm, чи встановлюється окремо
    - Ви оновлюєте метадані пакета вбудованого Plugin або автоматизацію випуску
    - Вам потрібен канонічний список внутрішніх і зовнішніх Plugin
summary: Згенерований перелік Plugin OpenClaw, що постачаються в ядрі, публікуються зовнішньо або зберігаються лише у вихідному коді
title: Інвентаризація Plugin
x-i18n:
    generated_at: "2026-07-04T04:06:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1af48e3d1ca8e994780dae2ac39dd2d3c3ed0bc8c136cbf3448fe18fadddfb0a
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Інвентар Plugin

Цю сторінку згенеровано з `extensions/*/package.json`, `openclaw.plugin.json`
і винятків `files` кореневого npm-пакета. Перегенеруйте її за допомогою:

```bash
pnpm plugins:inventory:gen
```

## Визначення

- **Основний npm-пакет:** вбудований у npm-пакет `openclaw` і доступний без окремого встановлення plugin.
- **Офіційний зовнішній пакет:** підтримуваний OpenClaw plugin, вилучений з основного npm-пакета, збережений у цьому офіційному інвентарі та встановлюваний на вимогу через ClawHub і/або npm.
- **Лише source checkout:** локальний для репозиторію plugin, вилучений з опублікованих npm-артефактів і не рекламований як пакет, доступний для встановлення.

Source checkout відрізняються від npm-встановлень: після `pnpm install` пакетні
plugins завантажуються з `extensions/<id>`, тож локальні зміни й локальні для пакета
залежності workspace доступні.

## Встановлення plugin

Використовуйте маршрут встановлення в кожному записі, щоб визначити, чи потрібне встановлення. Plugins,
для яких указано `included in OpenClaw`, уже присутні в основному пакеті.
Офіційні зовнішні пакети потребують одного встановлення, а потім перезапуску Gateway.

Наприклад, Discord є офіційним зовнішнім пакетом:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Під час запускового переходу звичайні bare package specs усе ще встановлюються з npm.
Використовуйте `clawhub:@openclaw/discord` або `npm:@openclaw/discord`, коли потрібне
явне джерело. Після встановлення дотримуйтесь документа з налаштування plugin, наприклад
[Discord](/uk/channels/discord), щоб додати облікові дані та конфігурацію каналу. Див.
[Керування plugins](/uk/plugins/manage-plugins) для команд оновлення, видалення та публікації.

Кожен запис містить пакет, маршрут розповсюдження та опис.

## Основний npm-пакет

60 plugins

- **[admin-http-rpc](/uk/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - включено до OpenClaw. HTTP RPC endpoint адміністратора OpenClaw.

- **[alibaba](/uk/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - включено до OpenClaw. Додає підтримку provider для генерації відео.

- **[anthropic](/uk/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - включено до OpenClaw. Додає підтримку provider моделей Anthropic до OpenClaw.

- **[azure-speech](/uk/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - включено до OpenClaw. Перетворення тексту на мовлення Azure AI Speech (MP3, native Ogg/Opus voice notes, PCM-телефонія).

- **[bonjour](/uk/plugins/reference/bonjour)** (`@openclaw/bonjour`) - включено до OpenClaw. Оголошує локальний Gateway OpenClaw через Bonjour/mDNS.

- **[browser](/uk/plugins/reference/browser)** (`@openclaw/browser-plugin`) - включено до OpenClaw. Додає інструменти, які може викликати агент.

- **[byteplus](/uk/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - включено до OpenClaw. Додає підтримку provider моделей BytePlus, BytePlus Plan до OpenClaw.

- **[canvas](/uk/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - включено до OpenClaw. Експериментальні поверхні керування Canvas і рендерингу A2UI для спарених вузлів.

- **[clawrouter](/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - включено до OpenClaw. Додає підтримку provider моделей ClawRouter до OpenClaw.

- **[codex-supervisor](/uk/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - включено до OpenClaw. Нагляд за сесіями app-server Codex з OpenClaw.

- **[cohere](/uk/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - включено до OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. Provider plugin Cohere для OpenClaw.

- **[comfy](/uk/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - включено до OpenClaw. Додає підтримку provider моделей ComfyUI до OpenClaw.

- **[copilot-proxy](/uk/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - включено до OpenClaw. Додає підтримку provider моделей Copilot Proxy до OpenClaw.

- **[deepgram](/uk/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - включено до OpenClaw. Додає підтримку provider для розуміння медіа. Додає підтримку provider транскрипції в реальному часі.

- **[document-extract](/uk/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - включено до OpenClaw. Видобуває текст і резервні зображення сторінок з локальних вкладень документів.

- **[duckduckgo](/uk/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - включено до OpenClaw. Додає підтримку provider вебпошуку.

- **[elevenlabs](/uk/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - включено до OpenClaw. Додає підтримку provider для розуміння медіа. Додає підтримку provider транскрипції в реальному часі. Додає підтримку provider перетворення тексту на мовлення.

- **[fal](/uk/plugins/reference/fal)** (`@openclaw/fal-provider`) - включено до OpenClaw. Додає підтримку provider моделей fal до OpenClaw.

- **[file-transfer](/uk/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - включено до OpenClaw. Отримує, перелічує та записує файли на спарених вузлах через спеціальні команди вузла. Оминає обрізання bash stdout, використовуючи base64 через node.invoke для двійкових файлів до 16 MB.

- **[github-copilot](/uk/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - включено до OpenClaw. Додає підтримку provider моделей GitHub Copilot до OpenClaw.

- **[google](/uk/plugins/reference/google)** (`@openclaw/google-plugin`) - включено до OpenClaw. Додає підтримку provider моделей Google, Google Gemini CLI, Google Vertex до OpenClaw.

- **[huggingface](/uk/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - включено до OpenClaw. Додає підтримку provider моделей Hugging Face до OpenClaw.

- **[imessage](/uk/plugins/reference/imessage)** (`@openclaw/imessage`) - включено до OpenClaw. Додає поверхню каналу iMessage для надсилання й отримання повідомлень OpenClaw.

- **[litellm](/uk/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - включено до OpenClaw. Додає підтримку provider моделей LiteLLM до OpenClaw.

- **[llm-task](/uk/plugins/reference/llm-task)** (`@openclaw/llm-task`) - включено до OpenClaw. Універсальний JSON-only LLM-інструмент для структурованих завдань, який можна викликати з workflow.

- **[lmstudio](/uk/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - включено до OpenClaw. Додає підтримку provider моделей LM Studio до OpenClaw.

- **[memory-core](/uk/plugins/reference/memory-core)** (`@openclaw/memory-core`) - включено до OpenClaw. Додає інструменти, які може викликати агент.

- **[memory-wiki](/uk/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - включено до OpenClaw. Постійний компілятор wiki та сумісне з Obsidian сховище знань для OpenClaw.

- **[microsoft](/uk/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - включено до OpenClaw. Додає підтримку provider перетворення тексту на мовлення.

- **[microsoft-foundry](/uk/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - включено до OpenClaw. Додає підтримку provider моделей Microsoft Foundry до OpenClaw.

- **[migrate-claude](/uk/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - включено до OpenClaw. Імпортує інструкції Claude Code і Claude Desktop, MCP-сервери, skills і безпечну конфігурацію в OpenClaw.

- **[migrate-hermes](/uk/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - включено до OpenClaw. Імпортує конфігурацію Hermes, пам’ять, skills і підтримувані облікові дані в OpenClaw.

- **[minimax](/uk/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - включено до OpenClaw. Додає підтримку provider моделей MiniMax, MiniMax Portal до OpenClaw.

- **[mistral](/uk/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - включено до OpenClaw. Додає підтримку provider моделей Mistral до OpenClaw.

- **[novita](/uk/plugins/reference/novita)** (`@openclaw/novita-provider`) - включено до OpenClaw. Додає підтримку provider моделей Novita, Novita AI, Novitaai до OpenClaw.

- **[nvidia](/uk/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - включено до OpenClaw. Додає підтримку provider моделей NVIDIA до OpenClaw.

- **[oc-path](/uk/plugins/reference/oc-path)** (`@openclaw/oc-path`) - включено до OpenClaw. Додає openclaw path CLI для адресації файлів workspace через oc://.

- **[ollama](/uk/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - включено до OpenClaw. Додає підтримку provider моделей Ollama, Ollama Cloud до OpenClaw.

- **[open-prose](/uk/plugins/reference/open-prose)** (`@openclaw/open-prose`) - включено до OpenClaw. Пакет Skills OpenProse VM із slash-командою /prose.

- **[openai](/uk/plugins/reference/openai)** (`@openclaw/openai-provider`) - включено до OpenClaw. Додає підтримку provider моделей OpenAI до OpenClaw.

- **[opencode](/uk/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - включено до OpenClaw. Додає підтримку provider моделей OpenCode до OpenClaw.

- **[opencode-go](/uk/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - включено до OpenClaw. Додає підтримку provider моделей OpenCode Go до OpenClaw.

- **[openrouter](/uk/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - включено до OpenClaw. Додає підтримку provider моделей OpenRouter до OpenClaw.

- **[policy](/uk/plugins/reference/policy)** (`@openclaw/policy`) - включено до OpenClaw. Додає doctor-перевірки на основі політик для відповідності workspace.

- **[runway](/uk/plugins/reference/runway)** (`@openclaw/runway-provider`) - включено до OpenClaw. Додає підтримку provider для генерації відео.

- **[senseaudio](/uk/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - включено до OpenClaw. Додає підтримку provider для розуміння медіа.

- **[sglang](/uk/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - включено до OpenClaw. Додає підтримку provider моделей SGLang до OpenClaw.

- **[synthetic](/uk/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - включено до OpenClaw. Додає підтримку provider моделей Synthetic до OpenClaw.

- **[telegram](/uk/plugins/reference/telegram)** (`@openclaw/telegram`) - включено до OpenClaw. Додає поверхню каналу Telegram для надсилання й отримання повідомлень OpenClaw.

- **[together](/uk/plugins/reference/together)** (`@openclaw/together-provider`) - включено до OpenClaw. Додає підтримку provider моделей Together до OpenClaw.

- **[tts-local-cli](/uk/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - включено до OpenClaw. Додає підтримку provider перетворення тексту на мовлення.

- **[vllm](/uk/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - включено до OpenClaw. Додає підтримку provider моделей vLLM до OpenClaw.

- **[volcengine](/uk/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - включено до OpenClaw. Додає підтримку provider моделей Volcengine, Volcengine Plan до OpenClaw.

- **[voyage](/uk/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - включено до OpenClaw. Додає підтримку provider embedding пам’яті.

- **[vydra](/uk/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - включено до OpenClaw. Додає підтримку provider моделей Vydra до OpenClaw.

- **[web-readability](/uk/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - включено до OpenClaw. Видобуває читабельний вміст статей з локальних відповідей HTML web fetch.

- **[webhooks](/uk/plugins/reference/webhooks)** (`@openclaw/webhooks`) - включено до OpenClaw. Автентифіковані вхідні webhooks, які прив’язують зовнішню автоматизацію до TaskFlows OpenClaw.

- **[workboard](/uk/plugins/reference/workboard)** (`@openclaw/workboard`) - включено до OpenClaw. Dashboard workboard для issues і сесій, якими володіє агент.

- **[xai](/uk/plugins/reference/xai)** (`@openclaw/xai-plugin`) - включено до OpenClaw. Додає підтримку provider моделей xAI до OpenClaw.

- **[xiaomi](/uk/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - включено до OpenClaw. Додає підтримку provider моделей Xiaomi, Xiaomi Token Plan до OpenClaw.

## Офіційні зовнішні пакети

68 plugins

- **[acpx](/uk/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Backend runtime OpenClaw ACP з керуванням сесіями й transport на боці plugin.

- **[amazon-bedrock](/uk/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Provider plugin OpenClaw Amazon Bedrock з discovery моделей, embeddings і підтримкою guardrail.

- **[amazon-bedrock-mantle](/uk/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Plugin провайдера OpenClaw Amazon Bedrock Mantle для маршрутизації моделей, сумісної з OpenAI.

- **[qa-matrix](/uk/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - лише для checkout вихідного коду. Виконувач і основа транспортного рівня Matrix QA.
