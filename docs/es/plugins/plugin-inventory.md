---
read_when:
    - Está decidiendo si un plugin se incluye en el paquete npm principal o se instala por separado
    - Estás actualizando los metadatos de paquetes de plugins incluidos o la automatización de versiones
    - Necesitas la lista canónica de plugins internos y externos
summary: Inventario generado de Plugins de OpenClaw incluidos en el núcleo, publicados externamente o conservados únicamente en el código fuente
title: Inventario de Plugins
x-i18n:
    generated_at: "2026-07-12T14:42:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: aa3ccb8d9213ec35f0055331cb30509cb92a3e0581e4689bd2c0ce98326d119d
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Inventario de plugins

Esta página se genera a partir de `extensions/*/package.json`, `openclaw.plugin.json`
y las exclusiones de `files` del paquete npm raíz. Vuelva a generarla con:

```bash
pnpm plugins:inventory:gen
```

## Definiciones

- **Paquete npm principal:** integrado en el paquete npm `openclaw` y disponible sin instalar un plugin por separado.
- **Paquete externo oficial:** plugin mantenido por OpenClaw que se omite del paquete npm principal, se conserva en este inventario oficial y se instala bajo demanda mediante ClawHub o npm.
- **Solo para una copia del repositorio:** plugin local del repositorio que se omite de los artefactos npm publicados y no se anuncia como paquete instalable.

Las copias del repositorio son diferentes de las instalaciones de npm: después de `pnpm install`, los
plugins incluidos se cargan desde `extensions/<id>` para que las ediciones locales y las dependencias
del espacio de trabajo propias del paquete estén disponibles.

## Instalar un plugin

Use el método de instalación de cada entrada para determinar si es necesario instalarlo. Los plugins
que indican `included in OpenClaw` ya están presentes en el paquete principal.
Los paquetes externos oficiales requieren una instalación y, después, reiniciar el Gateway.

Por ejemplo, Discord es un paquete externo oficial:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Durante la transición del lanzamiento, las especificaciones de paquetes simples habituales siguen instalándose desde npm.
Use `clawhub:@openclaw/discord` o `npm:@openclaw/discord` cuando necesite una
fuente explícita. Después de la instalación, siga la documentación de configuración del plugin, como
[Discord](/es/channels/discord), para añadir credenciales y la configuración del canal. Consulte
[Gestionar plugins](/es/plugins/manage-plugins) para conocer los comandos de actualización, desinstalación y publicación.

Cada entrada indica el paquete, la vía de distribución y la descripción.

## Paquete npm principal

64 plugins

- **[admin-http-rpc](/es/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - incluido en OpenClaw. Endpoint RPC HTTP de administración de OpenClaw.

- **[alibaba](/es/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - incluido en OpenClaw. Añade compatibilidad con un proveedor de generación de vídeo.

- **[anthropic](/es/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - incluido en OpenClaw. Modelos de Anthropic, CLI de Claude y catálogo nativo de sesiones de Claude.

- **[azure-speech](/es/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - incluido en OpenClaw. Conversión de texto a voz de Azure AI Speech (MP3, notas de voz nativas Ogg/Opus y telefonía PCM).

- **[bonjour](/es/plugins/reference/bonjour)** (`@openclaw/bonjour`) - incluido en OpenClaw. Anuncia el Gateway local de OpenClaw mediante Bonjour/mDNS.

- **[browser](/es/plugins/reference/browser)** (`@openclaw/browser-plugin`) - incluido en OpenClaw. Añade herramientas que el agente puede invocar.

- **[byteplus](/es/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - incluido en OpenClaw. Añade compatibilidad con los proveedores de modelos BytePlus y BytePlus Plan a OpenClaw.

- **[canvas](/es/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - incluido en OpenClaw. Superficies experimentales de control de Canvas y renderizado A2UI para nodos emparejados.

- **[clawrouter](/es/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de modelos ClawRouter a OpenClaw.

- **[cohere](/es/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - incluido en OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. Plugin de proveedor Cohere de OpenClaw.

- **[comfy](/es/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de modelos ComfyUI a OpenClaw.

- **[copilot-proxy](/es/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de modelos Copilot Proxy a OpenClaw.

- **[crabbox](/es/plugins/reference/crabbox)** (`@openclaw/crabbox-provider`) - incluido en OpenClaw. Proveedor de trabajadores en la nube respaldado por la CLI de Crabbox.

- **[deepgram](/es/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - incluido en OpenClaw. Añade compatibilidad con proveedores de comprensión multimedia. Añade compatibilidad con proveedores de transcripción en tiempo real.

- **[document-extract](/es/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - incluido en OpenClaw. Extrae texto e imágenes de página de reserva de archivos adjuntos de documentos locales.

- **[duckduckgo](/es/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - incluido en OpenClaw. Añade compatibilidad con proveedores de búsqueda web.

- **[elevenlabs](/es/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - incluido en OpenClaw. Añade compatibilidad con proveedores de comprensión multimedia. Añade compatibilidad con proveedores de transcripción en tiempo real. Añade compatibilidad con proveedores de texto a voz.

- **[fal](/es/plugins/reference/fal)** (`@openclaw/fal-provider`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de modelos fal a OpenClaw.

- **[file-transfer](/es/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - incluido en OpenClaw. Obtiene, enumera y escribe archivos en nodos emparejados mediante comandos de nodo específicos. Evita el truncamiento de la salida estándar de bash mediante el uso de base64 sobre node.invoke para archivos binarios de hasta 16 MB.

- **[github-copilot](/es/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de modelos GitHub Copilot a OpenClaw.

- **[google](/es/plugins/reference/google)** (`@openclaw/google-plugin`) - incluido en OpenClaw. Añade compatibilidad con los proveedores de modelos Google, Google Gemini CLI y Google Vertex a OpenClaw.

- **[huggingface](/es/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de modelos Hugging Face a OpenClaw.

- **[imessage](/es/plugins/reference/imessage)** (`@openclaw/imessage`) - incluido en OpenClaw. Añade la superficie del canal iMessage para enviar y recibir mensajes de OpenClaw.

- **[litellm](/es/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de modelos LiteLLM a OpenClaw.

- **[llm-task](/es/plugins/reference/llm-task)** (`@openclaw/llm-task`) - incluido en OpenClaw. Herramienta genérica de LLM que solo usa JSON para tareas estructuradas y que puede invocarse desde flujos de trabajo.

- **[lmstudio](/es/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos LM Studio.

- **[logbook](/es/plugins/reference/logbook)** (`@openclaw/logbook`) - incluido en OpenClaw. Diario de trabajo automático: captura periódicamente instantáneas de pantalla de un Node emparejado y las convierte en una cronología revisable de su jornada.

- **[memory-core](/es/plugins/reference/memory-core)** (`@openclaw/memory-core`) - incluido en OpenClaw. Añade herramientas que los agentes pueden invocar.

- **[memory-wiki](/es/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - incluido en OpenClaw. Compilador de wikis persistentes y repositorio de conocimiento compatible con Obsidian para OpenClaw.

- **[meta](/es/plugins/reference/meta)** (`@openclaw/meta-provider`) - incluido en OpenClaw; npm; ClawHub: `clawhub:@openclaw/meta-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Meta.

- **[microsoft](/es/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - incluido en OpenClaw. Añade compatibilidad con un proveedor de conversión de texto a voz.

- **[microsoft-foundry](/es/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Microsoft Foundry.

- **[migrate-claude](/es/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - incluido en OpenClaw. Importa a OpenClaw instrucciones de Claude Code y Claude Desktop, servidores MCP, Skills y configuración segura.

- **[migrate-hermes](/es/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - incluido en OpenClaw. Importa a OpenClaw la configuración, las memorias, las Skills y las credenciales compatibles de Hermes.

- **[minimax](/es/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos MiniMax y MiniMax Portal.

- **[mistral](/es/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Mistral.

- **[novita](/es/plugins/reference/novita)** (`@openclaw/novita-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos Novita, Novita AI y Novitaai.

- **[nvidia](/es/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos NVIDIA.

- **[oc-path](/es/plugins/reference/oc-path)** (`@openclaw/oc-path`) - incluido en OpenClaw. Añade la CLI de rutas de openclaw para direccionar archivos del espacio de trabajo mediante oc://.

- **[ollama](/es/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos Ollama y Ollama Cloud.

- **[open-prose](/es/plugins/reference/open-prose)** (`@openclaw/open-prose`) - incluido en OpenClaw. Paquete de Skills para la máquina virtual OpenProse con un comando de barra diagonal /prose.

- **[openai](/es/plugins/reference/openai)** (`@openclaw/openai-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos OpenAI.

- **[opencode](/es/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos OpenCode.

- **[opencode-go](/es/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos OpenCode Go.

- **[openrouter](/es/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos OpenRouter.

- **[policy](/es/plugins/reference/policy)** (`@openclaw/policy`) - incluido en OpenClaw. Añade comprobaciones de diagnóstico respaldadas por políticas para verificar la conformidad del espacio de trabajo.

- **[runway](/es/plugins/reference/runway)** (`@openclaw/runway-provider`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de generación de vídeo.

- **[senseaudio](/es/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de comprensión de contenido multimedia.

- **[sglang](/es/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos SGLang.

- **[synthetic](/es/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Synthetic.

- **[telegram](/es/plugins/reference/telegram)** (`@openclaw/telegram`) - incluido en OpenClaw. Añade la interfaz del canal de Telegram para enviar y recibir mensajes de OpenClaw.

- **[together](/es/plugins/reference/together)** (`@openclaw/together-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Together.

- **[tts-local-cli](/es/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de conversión de texto a voz.

- **[vault](/plugins/reference/vault)** (`@openclaw/vault`) - incluido en OpenClaw. Integración del proveedor SecretRef de HashiCorp Vault.

- **[vllm](/es/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos vLLM.

- **[volcengine](/es/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos Volcengine y Volcengine Plan.

- **[voyage](/es/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de incrustaciones de memoria.

- **[vydra](/es/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Vydra.

- **[web-readability](/es/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - incluido en OpenClaw. Extrae contenido legible de artículos a partir de respuestas locales de obtención web en HTML.

- **[webhooks](/es/plugins/reference/webhooks)** (`@openclaw/webhooks`) - incluido en OpenClaw. Webhooks entrantes autenticados que vinculan la automatización externa con TaskFlows de OpenClaw.

- **[workboard](/es/plugins/reference/workboard)** (`@openclaw/workboard`) - incluido en OpenClaw. Panel de trabajo para incidencias y sesiones gestionadas por agentes.

- **[workspaces](/es/plugins/reference/workspaces)** (`@openclaw/workspaces-plugin`) - incluido en OpenClaw. Backend componible por agentes para documentos de Workspaces y el plano de control.

- **[xai](/es/plugins/reference/xai)** (`@openclaw/xai-plugin`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos xAI.

- **[xiaomi](/es/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos Xiaomi y Xiaomi Token Plan.

## Paquetes externos oficiales

70 plugins

- **[acpx](/es/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Backend de entorno de ejecución ACP de OpenClaw con gestión de sesiones y transporte a cargo del plugin.

- **[amazon-bedrock](/es/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Plugin de proveedor Amazon Bedrock para OpenClaw con detección de modelos, embeddings y compatibilidad con medidas de protección.

- **[amazon-bedrock-mantle](/es/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Plugin de proveedor Amazon Bedrock Mantle para OpenClaw destinado al enrutamiento de modelos compatible con OpenAI.

- **[anthropic-vertex](/es/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Plugin de proveedor Anthropic Vertex para OpenClaw destinado a los modelos Claude en Google Vertex AI.

- **[arcee](/es/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Arcee.

- **[brave](/es/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Plugin de proveedor Brave Search para búsquedas web en OpenClaw.

- **[cerebras](/es/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Cerebras.

- **[chutes](/es/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Chutes.

- **[clickclack](/es/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Añade la interfaz de canal Clickclack para enviar y recibir mensajes de OpenClaw.

- **[cloudflare-ai-gateway](/es/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Cloudflare AI Gateway.

- **[codex](/es/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Entorno de pruebas del servidor de aplicaciones Codex, proveedor de modelos y catálogo de sesiones nativas.

- **[copilot](/es/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Registra el entorno de ejecución del agente GitHub Copilot.

- **[deepinfra](/es/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos DeepInfra.

- **[deepseek](/es/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos DeepSeek.

- **[diagnostics-otel](/es/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Exportador OpenTelemetry de diagnóstico de OpenClaw para métricas, trazas y registros.

- **[diagnostics-prometheus](/es/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Exportador Prometheus de diagnóstico de OpenClaw para métricas del entorno de ejecución.

- **[diffs](/es/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Plugin de visualización de diferencias de solo lectura y renderizador de archivos para agentes de OpenClaw.

- **[diffs-language-pack](/es/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Añade resaltado de sintaxis para lenguajes que no forman parte del conjunto predeterminado del visor de diferencias.

- **[discord](/es/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Plugin de canal Discord para OpenClaw, compatible con canales, mensajes directos, comandos y eventos de aplicaciones.

- **[exa](/es/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Añade compatibilidad con un proveedor de búsquedas web.

- **[featherless](/plugins/reference/featherless)** (`@openclaw/featherless-provider`) - npm; ClawHub: `clawhub:@openclaw/featherless-provider`. Plugin de proveedor Featherless AI para OpenClaw.

- **[feishu](/es/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Plugin de canal Feishu/Lark para chats y herramientas de trabajo en OpenClaw (mantenido por la comunidad por @m1heng).

- **[firecrawl](/es/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Añade herramientas invocables por agentes. Añade compatibilidad con un proveedor de obtención de contenido web. Añade compatibilidad con un proveedor de búsquedas web.

- **[fireworks](/es/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Fireworks.

- **[gmi](/es/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin de proveedor GMI Cloud para OpenClaw.

- **[google-meet](/es/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Plugin de participante de Google Meet para OpenClaw que permite unirse a llamadas mediante transportes de Chrome o Twilio.

- **[googlechat](/es/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Plugin de canal Google Chat para espacios y mensajes directos en OpenClaw.

- **[gradium](/es/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Añade compatibilidad con un proveedor de conversión de texto a voz.

- **[groq](/es/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Groq.

- **[inworld](/es/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Conversión de texto a voz en streaming de Inworld (MP3, OGG_OPUS y PCM para telefonía).

- **[irc](/es/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Añade la interfaz de canal IRC para enviar y recibir mensajes de OpenClaw.

- **[kilocode](/es/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Kilocode.

- **[kimi](/es/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Añade a OpenClaw compatibilidad con los proveedores de modelos Kimi y Kimi Coding.

- **[line](/es/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. Plugin de canal LINE para chats de la API de LINE Bot en OpenClaw.

- **[llama-cpp](/es/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Embeddings GGUF locales mediante node-llama-cpp.

- **[lobster](/es/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Plugin de herramienta de flujos de trabajo Lobster para canalizaciones tipadas y aprobaciones reanudables.

- **[longcat](/es/plugins/reference/longcat)** (`@openclaw/longcat-provider`) - npm; ClawHub: `clawhub:@openclaw/longcat-provider`. Plugin de proveedor LongCat para OpenClaw.

- **[matrix](/es/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Plugin de canal Matrix para salas y mensajes directos en OpenClaw.

- **[mattermost](/es/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Añade la interfaz de canal Mattermost para enviar y recibir mensajes de OpenClaw.

- **[memory-lancedb](/es/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Plugin de memoria a largo plazo de OpenClaw respaldado por LanceDB, con recuperación automática, captura automática y búsqueda vectorial.

- **[moonshot](/es/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Moonshot.

- **[msteams](/es/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Plugin de canal Microsoft Teams para conversaciones de bots en OpenClaw.

- **[nextcloud-talk](/es/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Plugin de canal Nextcloud Talk para conversaciones en OpenClaw.

- **[nostr](/es/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. Plugin de canal Nostr para mensajes directos cifrados con NIP-04 en OpenClaw.

- **[openshell](/es/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. Backend de entorno aislado de OpenClaw para la CLI de NVIDIA OpenShell, con espacios de trabajo locales replicados y ejecución de comandos mediante SSH.

- **[parallel](/es/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Añade compatibilidad con un proveedor de búsquedas web.

- **[perplexity](/es/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Añade compatibilidad con un proveedor de búsquedas web.

- **[pixverse](/es/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin de proveedor de generación de vídeo PixVerse para OpenClaw.

- **[qianfan](/es/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Qianfan.

- **[qqbot](/es/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Plugin de canal QQ Bot para flujos de trabajo en grupos y mensajes directos en OpenClaw.

- **[qwen](/es/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Añade a OpenClaw compatibilidad con los proveedores de modelos Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI, Qwen Token Plan y Bailian Token Plan.

- **[raft](/es/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Plugin de canal Raft para puentes seguros de activación de la CLI en OpenClaw.

- **[searxng](/es/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Añade compatibilidad con un proveedor de búsquedas web.

- **[signal](/es/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Añade la interfaz de canal Signal para enviar y recibir mensajes de OpenClaw.

- **[slack](/es/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Plugin de canal Slack para OpenClaw, compatible con canales, mensajes directos, comandos y eventos de aplicaciones.

- **[sms](/es/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Plugin de canal SMS de Twilio para mensajes de texto de OpenClaw.

- **[stepfun](/es/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Añade a OpenClaw compatibilidad con los proveedores de modelos StepFun y StepFun Plan.

- **[synology-chat](/es/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Plugin de canal Synology Chat para canales y mensajes directos de OpenClaw.

- **[tavily](/es/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Añade herramientas invocables por agentes. Añade compatibilidad con un proveedor de búsquedas web.

- **[tencent](/es/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Añade a OpenClaw compatibilidad con los proveedores de modelos Tencent TokenHub y Tencent Tokenplan.

- **[tlon](/es/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Plugin de canal Tlon/Urbit para flujos de trabajo de chat en OpenClaw.

- **[tokenjuice](/es/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Compacta los resultados de las herramientas exec y bash mediante reductores de Tokenjuice.

- **[twitch](/es/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Plugin de canal Twitch para flujos de trabajo de chat y moderación en OpenClaw.

- **[venice](/es/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Venice.

- **[vercel-ai-gateway](/es/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Vercel AI Gateway.

- **[voice-call](/es/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Plugin de OpenClaw para llamadas de voz mediante Twilio, Telnyx y Plivo.

- **[whatsapp](/es/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Plugin de canal de WhatsApp para OpenClaw destinado a chats de WhatsApp Web.

- **[zai](/es/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Z.AI.

- **[zalo](/es/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Plugin de canal de Zalo para OpenClaw destinado a chats mediante bots y Webhook.

- **[zalouser](/es/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Plugin de OpenClaw para cuentas personales de Zalo mediante la integración nativa con zca-js.

## Solo mediante el código fuente

3 plugins

- **[qa-channel](/es/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - solo mediante el código fuente. Añade la superficie QA Channel para enviar y recibir mensajes de OpenClaw.

- **[qa-lab](/es/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - solo mediante el código fuente. Plugin de laboratorio de control de calidad de OpenClaw con una interfaz privada de depuración y un ejecutor de escenarios.

- **[qa-matrix](/es/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - solo mediante el código fuente. Ejecutor y sustrato de transporte de control de calidad de Matrix.
