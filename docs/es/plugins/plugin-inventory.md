---
read_when:
    - Estás decidiendo si un Plugin se distribuye en el paquete npm principal o se instala por separado
    - Estás actualizando metadatos de paquetes de Plugins incluidos o automatización de versiones
    - Necesitas la lista canónica de Plugins internos frente a externos
summary: Inventario generado de plugins de OpenClaw incluidos en el núcleo, publicados externamente o mantenidos solo como código fuente
title: Inventario de Plugin
x-i18n:
    generated_at: "2026-07-06T21:53:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 864304d1cc536e7ff826b956c82dc031aa7d2fd0b42151ccf51b2ddcb29c0381
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Inventario de Plugin

Esta página se genera a partir de `extensions/*/package.json`, `openclaw.plugin.json`
y las exclusiones de `files` del paquete npm raíz. Regenérala con:

```bash
pnpm plugins:inventory:gen
```

## Definiciones

- **Paquete npm del núcleo:** integrado en el paquete npm `openclaw` y disponible sin instalar un plugin por separado.
- **Paquete externo oficial:** plugin mantenido por OpenClaw, omitido del paquete npm del núcleo, conservado en este inventario oficial e instalado bajo demanda mediante ClawHub y/o npm.
- **Solo checkout de código fuente:** plugin local del repositorio omitido de los artefactos npm publicados y no anunciado como paquete instalable.

Los checkouts de código fuente son diferentes de las instalaciones npm: después de `pnpm install`, los
plugins incluidos se cargan desde `extensions/<id>` para que estén disponibles las ediciones locales y las
dependencias de workspace locales del paquete.

## Instalar un plugin

Usa la ruta de instalación de cada entrada para decidir si hace falta instalar. Los plugins
que dicen `included in OpenClaw` ya están presentes en el paquete del núcleo.
Los paquetes externos oficiales necesitan una instalación y luego un reinicio del Gateway.

Por ejemplo, Discord es un paquete externo oficial:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Durante la transición de lanzamiento, las especificaciones ordinarias de paquete sin prefijo todavía se instalan desde npm.
Usa `clawhub:@openclaw/discord` o `npm:@openclaw/discord` cuando necesites una
fuente explícita. Después de instalar, sigue la documentación de configuración del plugin, como
[Discord](/es/channels/discord), para agregar credenciales y configuración de canal. Consulta
[Administrar plugins](/es/plugins/manage-plugins) para los comandos de actualización, desinstalación y publicación.

Cada entrada enumera el paquete, la ruta de distribución y la descripción.

## Paquete npm del núcleo

61 plugins

- **[admin-http-rpc](/es/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - incluido en OpenClaw. Endpoint RPC HTTP de administración de OpenClaw.

- **[alibaba](/es/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - incluido en OpenClaw. Agrega compatibilidad con proveedor de generación de video.

- **[anthropic](/es/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos Anthropic a OpenClaw.

- **[azure-speech](/es/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - incluido en OpenClaw. Texto a voz de Azure AI Speech (MP3, notas de voz Ogg/Opus nativas, telefonía PCM).

- **[bonjour](/es/plugins/reference/bonjour)** (`@openclaw/bonjour`) - incluido en OpenClaw. Anuncia el Gateway local de OpenClaw mediante Bonjour/mDNS.

- **[browser](/es/plugins/reference/browser)** (`@openclaw/browser-plugin`) - incluido en OpenClaw. Agrega herramientas invocables por agentes.

- **[byteplus](/es/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - incluido en OpenClaw. Agrega compatibilidad con proveedores de modelos BytePlus y BytePlus Plan a OpenClaw.

- **[canvas](/es/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - incluido en OpenClaw. Superficies experimentales de control de Canvas y renderizado A2UI para nodos emparejados.

- **[clawrouter](/es/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos ClawRouter a OpenClaw.

- **[codex-supervisor](/es/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - incluido en OpenClaw. Supervisa sesiones del servidor de aplicaciones de Codex desde OpenClaw.

- **[cohere](/es/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - incluido en OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. Plugin de proveedor Cohere de OpenClaw.

- **[comfy](/es/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos ComfyUI a OpenClaw.

- **[copilot-proxy](/es/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos Copilot Proxy a OpenClaw.

- **[deepgram](/es/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - incluido en OpenClaw. Agrega compatibilidad con proveedor de comprensión de medios. Agrega compatibilidad con proveedor de transcripción en tiempo real.

- **[document-extract](/es/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - incluido en OpenClaw. Extrae texto e imágenes de página de reserva desde adjuntos de documentos locales.

- **[duckduckgo](/es/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - incluido en OpenClaw. Agrega compatibilidad con proveedor de búsqueda web.

- **[elevenlabs](/es/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - incluido en OpenClaw. Agrega compatibilidad con proveedor de comprensión de medios. Agrega compatibilidad con proveedor de transcripción en tiempo real. Agrega compatibilidad con proveedor de texto a voz.

- **[fal](/es/plugins/reference/fal)** (`@openclaw/fal-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos fal a OpenClaw.

- **[file-transfer](/es/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - incluido en OpenClaw. Obtén, enumera y escribe archivos en nodos emparejados mediante comandos de nodo dedicados. Evita el truncamiento de stdout de bash usando base64 sobre node.invoke para binarios de hasta 16 MB.

- **[github-copilot](/es/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos GitHub Copilot a OpenClaw.

- **[google](/es/plugins/reference/google)** (`@openclaw/google-plugin`) - incluido en OpenClaw. Agrega compatibilidad con proveedores de modelos Google, Google Gemini CLI y Google Vertex a OpenClaw.

- **[huggingface](/es/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos Hugging Face a OpenClaw.

- **[imessage](/es/plugins/reference/imessage)** (`@openclaw/imessage`) - incluido en OpenClaw. Agrega la superficie de canal iMessage para enviar y recibir mensajes de OpenClaw.

- **[litellm](/es/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos LiteLLM a OpenClaw.

- **[llm-task](/es/plugins/reference/llm-task)** (`@openclaw/llm-task`) - incluido en OpenClaw. Herramienta LLM genérica solo JSON para tareas estructuradas invocables desde workflows.

- **[lmstudio](/es/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos LM Studio a OpenClaw.

- **[logbook](/plugins/reference/logbook)** (`@openclaw/logbook`) - incluido en OpenClaw. Diario de trabajo automático: captura instantáneas periódicas de pantalla desde un nodo emparejado y las convierte en una línea de tiempo revisable de tu día.

- **[memory-core](/es/plugins/reference/memory-core)** (`@openclaw/memory-core`) - incluido en OpenClaw. Agrega herramientas invocables por agentes.

- **[memory-wiki](/es/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - incluido en OpenClaw. Compilador de wiki persistente y almacén de conocimiento compatible con Obsidian para OpenClaw.

- **[microsoft](/es/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - incluido en OpenClaw. Agrega compatibilidad con proveedor de texto a voz.

- **[microsoft-foundry](/es/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos Microsoft Foundry a OpenClaw.

- **[migrate-claude](/es/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - incluido en OpenClaw. Importa instrucciones de Claude Code y Claude Desktop, servidores MCP, Skills y configuración segura a OpenClaw.

- **[migrate-hermes](/es/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - incluido en OpenClaw. Importa configuración de Hermes, memorias, Skills y credenciales admitidas a OpenClaw.

- **[minimax](/es/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - incluido en OpenClaw. Agrega compatibilidad con proveedores de modelos MiniMax y MiniMax Portal a OpenClaw.

- **[mistral](/es/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos Mistral a OpenClaw.

- **[novita](/es/plugins/reference/novita)** (`@openclaw/novita-provider`) - incluido en OpenClaw. Agrega compatibilidad con proveedores de modelos Novita, Novita AI y Novitaai a OpenClaw.

- **[nvidia](/es/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos NVIDIA a OpenClaw.

- **[oc-path](/es/plugins/reference/oc-path)** (`@openclaw/oc-path`) - incluido en OpenClaw. Agrega la CLI de ruta openclaw para direccionamiento de archivos de workspace `oc://`.

- **[ollama](/es/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - incluido en OpenClaw. Agrega compatibilidad con proveedores de modelos Ollama y Ollama Cloud a OpenClaw.

- **[open-prose](/es/plugins/reference/open-prose)** (`@openclaw/open-prose`) - incluido en OpenClaw. Paquete de Skills de VM OpenProse con un comando slash /prose.

- **[openai](/es/plugins/reference/openai)** (`@openclaw/openai-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos OpenAI a OpenClaw.

- **[opencode](/es/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos OpenCode a OpenClaw.

- **[opencode-go](/es/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos OpenCode Go a OpenClaw.

- **[openrouter](/es/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos OpenRouter a OpenClaw.

- **[policy](/es/plugins/reference/policy)** (`@openclaw/policy`) - incluido en OpenClaw. Agrega comprobaciones de doctor respaldadas por políticas para la conformidad del workspace.

- **[runway](/es/plugins/reference/runway)** (`@openclaw/runway-provider`) - incluido en OpenClaw. Agrega compatibilidad con proveedor de generación de video.

- **[senseaudio](/es/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - incluido en OpenClaw. Agrega compatibilidad con proveedor de comprensión de medios.

- **[sglang](/es/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos SGLang a OpenClaw.

- **[synthetic](/es/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos Synthetic a OpenClaw.

- **[telegram](/es/plugins/reference/telegram)** (`@openclaw/telegram`) - incluido en OpenClaw. Agrega la superficie de canal Telegram para enviar y recibir mensajes de OpenClaw.

- **[together](/es/plugins/reference/together)** (`@openclaw/together-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos Together a OpenClaw.

- **[tts-local-cli](/es/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - incluido en OpenClaw. Agrega compatibilidad con proveedor de texto a voz.

- **[vllm](/es/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos vLLM a OpenClaw.

- **[volcengine](/es/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - incluido en OpenClaw. Agrega compatibilidad con proveedores de modelos Volcengine y Volcengine Plan a OpenClaw.

- **[voyage](/es/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - incluido en OpenClaw. Agrega compatibilidad con proveedor de embeddings de memoria.

- **[vydra](/es/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos Vydra a OpenClaw.

- **[web-readability](/es/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - incluido en OpenClaw. Extrae contenido legible de artículos desde respuestas locales de obtención web HTML.

- **[webhooks](/es/plugins/reference/webhooks)** (`@openclaw/webhooks`) - incluido en OpenClaw. Webhooks entrantes autenticados que vinculan automatización externa a TaskFlows de OpenClaw.

- **[workboard](/es/plugins/reference/workboard)** (`@openclaw/workboard`) - incluido en OpenClaw. Workboard de panel para incidencias y sesiones propiedad de agentes.

- **[xai](/es/plugins/reference/xai)** (`@openclaw/xai-plugin`) - incluido en OpenClaw. Agrega compatibilidad con el proveedor de modelos xAI a OpenClaw.

- **[xiaomi](/es/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - incluido en OpenClaw. Agrega compatibilidad con proveedores de modelos Xiaomi y Xiaomi Token Plan a OpenClaw.

## Paquetes externos oficiales

69 plugins

- **[acpx](/es/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Backend de runtime ACP de OpenClaw con gestión de sesión y transporte propiedad del plugin.

- **[amazon-bedrock](/es/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Plugin proveedor de OpenClaw para Amazon Bedrock con descubrimiento de modelos, embeddings y soporte para guardrails.

- **[amazon-bedrock-mantle](/es/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Plugin proveedor de OpenClaw para Amazon Bedrock Mantle para enrutamiento de modelos compatible con OpenAI.

- **[anthropic-vertex](/es/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Plugin proveedor de OpenClaw para Anthropic Vertex para modelos Claude en Google Vertex AI.

- **[arcee](/es/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Añade soporte del proveedor de modelos Arcee a OpenClaw.

- **[brave](/es/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Plugin proveedor de OpenClaw para Brave Search para búsqueda web.

- **[cerebras](/es/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Añade soporte del proveedor de modelos Cerebras a OpenClaw.

- **[chutes](/es/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Añade soporte del proveedor de modelos Chutes a OpenClaw.

- **[clickclack](/es/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Añade la superficie de canal Clickclack para enviar y recibir mensajes de OpenClaw.

- **[cloudflare-ai-gateway](/es/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Añade soporte del proveedor de modelos Cloudflare AI Gateway a OpenClaw.

- **[codex](/es/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Plugin de proveedor de modelos y arnés de servidor de aplicaciones Codex de OpenClaw con un catálogo GPT gestionado por Codex.

- **[copilot](/es/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Registra el runtime de agente GitHub Copilot.

- **[deepinfra](/es/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Añade soporte del proveedor de modelos DeepInfra a OpenClaw.

- **[deepseek](/es/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Añade soporte del proveedor de modelos DeepSeek a OpenClaw.

- **[diagnostics-otel](/es/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Exportador de diagnósticos OpenTelemetry de OpenClaw para métricas, trazas y registros.

- **[diagnostics-prometheus](/es/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Exportador de diagnósticos Prometheus de OpenClaw para métricas de runtime.

- **[diffs](/es/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Plugin visor de diffs de solo lectura y renderizador de archivos de OpenClaw para agentes.

- **[diffs-language-pack](/es/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Añade resaltado de sintaxis para lenguajes fuera del conjunto predeterminado del visor de diffs.

- **[discord](/es/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Plugin de canal Discord de OpenClaw para canales, MD, comandos y eventos de la aplicación.

- **[exa](/es/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Añade soporte de proveedor de búsqueda web.

- **[feishu](/es/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Plugin de canal Feishu/Lark de OpenClaw para chats y herramientas de trabajo (mantenido por la comunidad por @m1heng).

- **[firecrawl](/es/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Añade herramientas invocables por agentes. Añade soporte de proveedor de obtención web. Añade soporte de proveedor de búsqueda web.

- **[fireworks](/es/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Añade soporte del proveedor de modelos Fireworks a OpenClaw.

- **[gmi](/es/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin proveedor GMI Cloud de OpenClaw.

- **[google-meet](/es/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Plugin de participante Google Meet de OpenClaw para unirse a llamadas mediante transportes Chrome o Twilio.

- **[googlechat](/es/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Plugin de canal Google Chat de OpenClaw para espacios y mensajes directos.

- **[gradium](/es/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Añade soporte de proveedor de texto a voz.

- **[groq](/es/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Añade soporte del proveedor de modelos Groq a OpenClaw.

- **[inworld](/es/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Texto a voz en streaming de Inworld (MP3, OGG_OPUS, telefonía PCM).

- **[irc](/es/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Añade la superficie de canal IRC para enviar y recibir mensajes de OpenClaw.

- **[kilocode](/es/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Añade soporte del proveedor de modelos Kilocode a OpenClaw.

- **[kimi](/es/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Añade soporte del proveedor de modelos Kimi y Kimi Coding a OpenClaw.

- **[line](/es/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. Plugin de canal LINE de OpenClaw para chats de LINE Bot API.

- **[llama-cpp](/es/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Embeddings GGUF locales mediante node-llama-cpp.

- **[lobster](/es/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Plugin de herramienta de flujo de trabajo Lobster para canalizaciones tipadas y aprobaciones reanudables.

- **[longcat](/plugins/reference/longcat)** (`@openclaw/longcat-provider`) - npm; ClawHub: `clawhub:@openclaw/longcat-provider`. Plugin proveedor LongCat de OpenClaw.

- **[matrix](/es/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Plugin de canal Matrix de OpenClaw para salas y mensajes directos.

- **[mattermost](/es/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Añade la superficie de canal Mattermost para enviar y recibir mensajes de OpenClaw.

- **[memory-lancedb](/es/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Plugin de memoria a largo plazo de OpenClaw respaldado por LanceDB con recuperación automática, captura automática y búsqueda vectorial.

- **[moonshot](/es/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Añade soporte del proveedor de modelos Moonshot a OpenClaw.

- **[msteams](/es/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Plugin de canal Microsoft Teams de OpenClaw para conversaciones de bot.

- **[nextcloud-talk](/es/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Plugin de canal Nextcloud Talk de OpenClaw para conversaciones.

- **[nostr](/es/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. Plugin de canal Nostr de OpenClaw para mensajes directos cifrados NIP-04.

- **[openshell](/es/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. Backend de sandbox de OpenClaw para la CLI NVIDIA OpenShell con espacios de trabajo locales reflejados y ejecución de comandos SSH.

- **[parallel](/es/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Añade soporte de proveedor de búsqueda web.

- **[perplexity](/es/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Añade soporte de proveedor de búsqueda web.

- **[pixverse](/es/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin proveedor de generación de video PixVerse de OpenClaw.

- **[qianfan](/es/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Añade soporte del proveedor de modelos Qianfan a OpenClaw.

- **[qqbot](/es/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Plugin de canal QQ Bot de OpenClaw para flujos de trabajo de grupo y mensajes directos.

- **[qwen](/es/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Añade soporte del proveedor de modelos Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal y Qwen CLI a OpenClaw.

- **[raft](/es/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Plugin de canal Raft de OpenClaw para puentes de activación CLI seguros.

- **[searxng](/es/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Añade soporte de proveedor de búsqueda web.

- **[signal](/es/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Añade la superficie de canal Signal para enviar y recibir mensajes de OpenClaw.

- **[slack](/es/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Plugin de canal Slack de OpenClaw para canales, MD, comandos y eventos de la aplicación.

- **[sms](/es/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Plugin de canal SMS de Twilio para mensajes de texto de OpenClaw.

- **[stepfun](/es/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Añade soporte del proveedor de modelos StepFun y StepFun Plan a OpenClaw.

- **[synology-chat](/es/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Plugin de canal Synology Chat para canales y mensajes directos de OpenClaw.

- **[tavily](/es/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Añade herramientas invocables por agentes. Añade soporte de proveedor de búsqueda web.

- **[tencent](/es/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Añade soporte del proveedor de modelos Tencent TokenHub y TokenPlan a OpenClaw.

- **[tlon](/es/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Plugin de canal Tlon/Urbit de OpenClaw para flujos de trabajo de chat.

- **[tokenjuice](/es/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Compacta los resultados de herramientas exec y bash con reductores tokenjuice.

- **[twitch](/es/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Plugin de canal Twitch de OpenClaw para flujos de trabajo de chat y moderación.

- **[venice](/es/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Añade soporte del proveedor de modelos Venice a OpenClaw.

- **[vercel-ai-gateway](/es/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Añade soporte del proveedor de modelos Vercel AI Gateway a OpenClaw.

- **[voice-call](/es/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Plugin de llamadas de voz de OpenClaw para llamadas telefónicas de Twilio, Telnyx y Plivo.

- **[whatsapp](/es/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Plugin de canal WhatsApp de OpenClaw para chats de WhatsApp Web.

- **[zai](/es/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Añade soporte del proveedor de modelos Z.AI a OpenClaw.

- **[zalo](/es/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Plugin de canal Zalo de OpenClaw para chats de bot y webhook.

- **[zalouser](/es/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Plugin de cuenta personal de Zalo para OpenClaw mediante integración nativa con zca-js.

## Solo checkout del código fuente

3 plugins

- **[qa-channel](/es/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - solo checkout del código fuente. Agrega la superficie QA Channel para enviar y recibir mensajes de OpenClaw.

- **[qa-lab](/es/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - solo checkout del código fuente. Plugin de laboratorio de QA de OpenClaw con interfaz de depurador privada y ejecutor de escenarios.

- **[qa-matrix](/es/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - solo checkout del código fuente. Ejecutor y sustrato de transporte de QA de Matrix.
