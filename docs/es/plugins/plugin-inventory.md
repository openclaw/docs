---
read_when:
    - Está decidiendo si un Plugin se incluye en el paquete npm principal o se instala por separado
    - Estás actualizando los metadatos de paquetes de plugins incluidos o la automatización de versiones
    - Necesita la lista canónica de plugins internos y externos
summary: Inventario generado de plugins de OpenClaw incluidos en el núcleo, publicados externamente o mantenidos solo en el código fuente
title: Inventario de plugins
x-i18n:
    generated_at: "2026-07-19T02:05:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b8a99bb683636d5fd4569f2ce7d6da5d560527af9684dcdd2f6176f4539bd81a
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Inventario de plugins

Esta página se genera a partir de `extensions/*/package.json`, `openclaw.plugin.json`
y las exclusiones del paquete npm raíz `files`. Vuelva a generarla con:

```bash
pnpm plugins:inventory:gen
```

## Definiciones

- **Paquete npm principal:** integrado en el paquete npm `openclaw` y disponible sin instalar un plugin por separado.
- **Paquete externo oficial:** plugin mantenido por OpenClaw que se omite del paquete npm principal, se conserva en este inventario oficial y se instala bajo demanda mediante ClawHub o npm.
- **Solo para el checkout del código fuente:** plugin local del repositorio que se omite de los artefactos npm publicados y no se anuncia como paquete instalable.

Los checkouts del código fuente son distintos de las instalaciones de npm: después de `pnpm install`, los plugins
incluidos se cargan desde `extensions/<id>`, por lo que están disponibles las modificaciones locales y las dependencias
del espacio de trabajo locales del paquete.

## Instalar un plugin

Utilice el método de instalación de cada entrada para determinar si es necesario instalarlo. Los plugins
que indican `included in OpenClaw` ya están presentes en el paquete principal.
Los paquetes externos oficiales requieren una instalación y, después, reiniciar el Gateway.

Por ejemplo, Discord es un paquete externo oficial:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Durante la transición del lanzamiento, las especificaciones simples de paquetes se siguen instalando desde npm.
Utilice `clawhub:@openclaw/discord` o `npm:@openclaw/discord` cuando necesite una
fuente explícita. Tras la instalación, siga la documentación de configuración del plugin, como
[Discord](/es/channels/discord), para añadir credenciales y la configuración del canal. Consulte
[Gestionar plugins](/es/plugins/manage-plugins) para conocer los comandos de actualización, desinstalación y publicación.

Cada entrada indica el paquete, el método de distribución y la descripción.

## Paquete npm principal

69 plugins

- **[admin-http-rpc](/es/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - incluido en OpenClaw. Endpoint RPC HTTP de administración de OpenClaw.

- **[alibaba](/es/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de generación de vídeo.

- **[anthropic](/es/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - incluido en OpenClaw. Modelos de Anthropic, CLI de Claude y catálogo nativo de sesiones de Claude.

- **[azure-speech](/es/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - incluido en OpenClaw. Conversión de texto a voz de Azure AI Speech (MP3, notas de voz nativas Ogg/Opus y telefonía PCM).

- **[bonjour](/es/plugins/reference/bonjour)** (`@openclaw/bonjour`) - incluido en OpenClaw. Anuncia el Gateway local de OpenClaw mediante Bonjour/mDNS.

- **[browser](/es/plugins/reference/browser)** (`@openclaw/browser-plugin`) - incluido en OpenClaw. Añade herramientas que el agente puede invocar.

- **[byteplus](/es/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos BytePlus y BytePlus Plan.

- **[canvas](/es/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - incluido en OpenClaw. Superficies experimentales de control de Canvas y renderizado A2UI para nodos emparejados.

- **[clawrouter](/es/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos ClawRouter.

- **[cohere](/es/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - incluido en OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. Plugin del proveedor Cohere para OpenClaw.

- **[comfy](/es/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos ComfyUI.

- **[copilot-proxy](/es/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Copilot Proxy.

- **[crabbox](/es/plugins/reference/crabbox)** (`@openclaw/crabbox-provider`) - incluido en OpenClaw. Proveedor de trabajadores en la nube respaldado por la CLI de Crabbox.

- **[deepgram](/es/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de comprensión multimedia. Añade compatibilidad con el proveedor de transcripción en tiempo real.

- **[document-extract](/es/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - incluido en OpenClaw. Extrae texto e imágenes de páginas alternativas de archivos de documentos locales adjuntos.

- **[duckduckgo](/es/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de búsqueda web.

- **[elevenlabs](/es/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de comprensión multimedia. Añade compatibilidad con el proveedor de transcripción en tiempo real. Añade compatibilidad con el proveedor de conversión de texto a voz.

- **[fal](/es/plugins/reference/fal)** (`@openclaw/fal-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos fal.

- **[file-transfer](/es/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - incluido en OpenClaw. Obtiene, enumera y escribe archivos en nodos emparejados mediante comandos de nodo específicos. Evita el truncamiento de la salida estándar de bash utilizando base64 mediante node.invoke para archivos binarios de hasta 16 MB.

- **[github-copilot](/es/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos GitHub Copilot.

- **[google](/es/plugins/reference/google)** (`@openclaw/google-plugin`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos Google, Google Gemini CLI y Google Vertex.

- **[huggingface](/es/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Hugging Face.

- **[imessage](/es/plugins/reference/imessage)** (`@openclaw/imessage`) - incluido en OpenClaw. Añade la superficie del canal de iMessage para enviar y recibir mensajes de OpenClaw.

- **[linux-canvas](/es/plugins/reference/linux-canvas)** (`@openclaw/linux-canvas`) - incluido en OpenClaw. Puente de renderizado de Canvas para la aplicación de escritorio de OpenClaw en Linux.

- **[linux-node](/es/plugins/reference/linux-node)** (`@openclaw/linux-node`) - incluido en OpenClaw. Notificaciones de escritorio, captura de cámara y ubicación para hosts de nodos Linux.

- **[litellm](/es/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos LiteLLM.

- **[llm-task](/es/plugins/reference/llm-task)** (`@openclaw/llm-task`) - incluido en OpenClaw. Herramienta LLM genérica exclusivamente para JSON, destinada a tareas estructuradas que pueden invocarse desde flujos de trabajo.

- **[lmstudio](/es/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos LM Studio.

- **[logbook](/es/plugins/reference/logbook)** (`@openclaw/logbook`) - incluido en OpenClaw. Diario de trabajo automático: captura periódicamente instantáneas de pantalla de un nodo emparejado y las convierte en una cronología revisable de la jornada.

- **[memory-core](/es/plugins/reference/memory-core)** (`@openclaw/memory-core`) - incluido en OpenClaw. Añade herramientas que el agente puede invocar.

- **[memory-wiki](/es/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - incluido en OpenClaw. Compilador de wiki persistente y almacén de conocimiento compatible con Obsidian para OpenClaw.

- **[meta](/es/plugins/reference/meta)** (`@openclaw/meta-provider`) - incluido en OpenClaw; npm; ClawHub: `clawhub:@openclaw/meta-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Meta.

- **[microsoft](/es/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de conversión de texto a voz.

- **[microsoft-foundry](/es/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Microsoft Foundry.

- **[migrate-claude](/es/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - incluido en OpenClaw. Importa en OpenClaw instrucciones de Claude Code y Claude Desktop, servidores MCP, Skills y configuraciones seguras.

- **[migrate-hermes](/es/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - incluido en OpenClaw. Importa en OpenClaw la configuración, las memorias, las Skills y las credenciales compatibles de Hermes.

- **[minimax](/es/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos MiniMax y MiniMax Portal.

- **[mistral](/es/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Mistral.

- **[novita](/es/plugins/reference/novita)** (`@openclaw/novita-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos Novita, Novita AI y Novitaai.

- **[nvidia](/es/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos NVIDIA.

- **[oc-path](/es/plugins/reference/oc-path)** (`@openclaw/oc-path`) - incluido en OpenClaw. Añade la CLI de rutas de openclaw para direccionar archivos del espacio de trabajo mediante oc://.

- **[ollama](/es/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos Ollama y Ollama Cloud.

- **[onepassword](/es/plugins/reference/onepassword)** (`@openclaw/onepassword`) - incluido en OpenClaw. Intermediario seleccionado de secretos de 1Password con política de aprobación e historial de auditoría en SQLite.

- **[open-prose](/es/plugins/reference/open-prose)** (`@openclaw/open-prose`) - incluido en OpenClaw. Paquete de Skills de la máquina virtual OpenProse con un comando de barra /prose.

- **[openai](/es/plugins/reference/openai)** (`@openclaw/openai-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos OpenAI.

- **[opencode](/es/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos OpenCode.

- **[opencode-go](/es/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos OpenCode Go.

- **[openrouter](/es/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos OpenRouter.

- **[policy](/es/plugins/reference/policy)** (`@openclaw/policy`) - incluido en OpenClaw. Añade comprobaciones de doctor respaldadas por políticas para verificar la conformidad del espacio de trabajo.

- **[reef](/es/plugins/reference/reef)** (`@openclaw/reef`) - incluido en OpenClaw. Canal claw protegido y cifrado de extremo a extremo.

- **[runway](/es/plugins/reference/runway)** (`@openclaw/runway-provider`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de generación de vídeo.

- **[senseaudio](/es/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de comprensión multimedia.

- **[sglang](/es/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos SGLang.

- **[synthetic](/es/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Synthetic.

- **[teams-meetings](/es/plugins/reference/teams-meetings)** (`@openclaw/teams-meetings`) - incluido en OpenClaw. Se une a reuniones de Microsoft Teams como invitado mediante el navegador Chrome.

- **[telegram](/es/plugins/reference/telegram)** (`@openclaw/telegram`) - incluido en OpenClaw. Añade la superficie del canal de Telegram para enviar y recibir mensajes de OpenClaw.

- **[together](/es/plugins/reference/together)** (`@openclaw/together-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Together.

- **[tts-local-cli](/es/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de conversión de texto a voz.

- **[vault](/es/plugins/reference/vault)** (`@openclaw/vault`) - incluido en OpenClaw. Integración del proveedor SecretRef de HashiCorp Vault.

- **[vllm](/es/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de modelos vLLM a OpenClaw.

- **[volcengine](/es/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - incluido en OpenClaw. Añade compatibilidad con los proveedores de modelos Volcengine y Volcengine Plan a OpenClaw.

- **[voyage](/es/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - incluido en OpenClaw. Añade compatibilidad con un proveedor de embeddings de memoria.

- **[vydra](/es/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de modelos Vydra a OpenClaw.

- **[web-readability](/es/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - incluido en OpenClaw. Extrae contenido legible de artículos a partir de respuestas de obtención web de HTML local.

- **[webhooks](/es/plugins/reference/webhooks)** (`@openclaw/webhooks`) - incluido en OpenClaw. Webhooks entrantes autenticados que vinculan automatizaciones externas con TaskFlows de OpenClaw.

- **[workboard](/es/plugins/reference/workboard)** (`@openclaw/workboard`) - incluido en OpenClaw. Panel de trabajo para incidencias y sesiones gestionadas por agentes.

- **[xai](/es/plugins/reference/xai)** (`@openclaw/xai-plugin`) - incluido en OpenClaw. Añade compatibilidad con el proveedor de modelos xAI a OpenClaw.

- **[xiaomi](/es/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - incluido en OpenClaw. Añade compatibilidad con los proveedores de modelos Xiaomi y Xiaomi Token Plan a OpenClaw.

- **[zoom-meetings](/plugins/reference/zoom-meetings)** (`@openclaw/zoom-meetings`) - incluido en OpenClaw. Permite unirse a reuniones de Zoom como invitado mediante el navegador Chrome.

## Paquetes externos oficiales

72 plugins

- **[acpx](/es/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Backend de ejecución ACP de OpenClaw con gestión de sesiones y transporte propia del plugin.

- **[amazon-bedrock](/es/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Plugin de proveedor Amazon Bedrock de OpenClaw con detección de modelos y compatibilidad con embeddings y barreras de protección.

- **[amazon-bedrock-mantle](/es/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Plugin de proveedor Amazon Bedrock Mantle de OpenClaw para el enrutamiento de modelos compatible con OpenAI.

- **[anthropic-vertex](/es/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Plugin de proveedor Anthropic Vertex de OpenClaw para modelos Claude en Google Vertex AI.

- **[arcee](/es/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Añade compatibilidad con el proveedor de modelos Arcee a OpenClaw.

- **[baseten](/plugins/reference/baseten)** (`@openclaw/baseten-provider`) - npm; ClawHub: `clawhub:@openclaw/baseten-provider`. Plugin de proveedor Baseten de OpenClaw.

- **[brave](/es/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Plugin de proveedor Brave Search de OpenClaw para búsquedas web.

- **[cerebras](/es/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Añade compatibilidad con el proveedor de modelos Cerebras a OpenClaw.

- **[chutes](/es/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Añade compatibilidad con el proveedor de modelos Chutes a OpenClaw.

- **[clickclack](/es/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Añade la interfaz de canal Clickclack para enviar y recibir mensajes de OpenClaw.

- **[cloudflare-ai-gateway](/es/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Añade compatibilidad con el proveedor de modelos Cloudflare AI Gateway a OpenClaw.

- **[codex](/es/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Entorno de ejecución del servidor de aplicaciones Codex y catálogo de sesiones nativas.

- **[copilot](/es/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Registra el entorno de ejecución de agentes de GitHub Copilot.

- **[deepinfra](/es/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Añade compatibilidad con el proveedor de modelos DeepInfra a OpenClaw.

- **[deepseek](/es/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Añade compatibilidad con el proveedor de modelos DeepSeek a OpenClaw.

- **[diagnostics-otel](/es/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Exportador OpenTelemetry de diagnósticos de OpenClaw para métricas, trazas y registros.

- **[diagnostics-prometheus](/es/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Exportador Prometheus de diagnósticos de OpenClaw para métricas del entorno de ejecución.

- **[diffs](/es/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Plugin de visualización de diferencias de solo lectura y renderizador de archivos de OpenClaw para agentes.

- **[diffs-language-pack](/es/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Añade resaltado de sintaxis para lenguajes no incluidos en el conjunto predeterminado del visor de diferencias.

- **[discord](/es/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Plugin de canal Discord de OpenClaw para canales, mensajes directos, comandos y eventos de aplicaciones.

- **[exa](/es/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Añade compatibilidad con un proveedor de búsqueda web.

- **[featherless](/es/plugins/reference/featherless)** (`@openclaw/featherless-provider`) - npm; ClawHub: `clawhub:@openclaw/featherless-provider`. Plugin de proveedor Featherless AI de OpenClaw.

- **[feishu](/es/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Plugin de canal Feishu/Lark de OpenClaw para chats y herramientas de trabajo (mantenido por la comunidad por @m1heng).

- **[firecrawl](/es/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Añade herramientas que los agentes pueden invocar. Añade compatibilidad con un proveedor de obtención web. Añade compatibilidad con un proveedor de búsqueda web.

- **[fireworks](/es/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Añade compatibilidad con el proveedor de modelos Fireworks a OpenClaw.

- **[gmi](/es/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin de proveedor GMI Cloud de OpenClaw.

- **[google-meet](/es/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Plugin de participante de Google Meet de OpenClaw para unirse a llamadas mediante transportes Chrome o Twilio.

- **[googlechat](/es/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Plugin de canal Google Chat de OpenClaw para espacios y mensajes directos.

- **[gradium](/es/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Añade compatibilidad con un proveedor de texto a voz.

- **[groq](/es/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Añade compatibilidad con el proveedor de modelos Groq a OpenClaw.

- **[inworld](/es/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Texto a voz por streaming de Inworld (MP3, OGG_OPUS y PCM para telefonía).

- **[irc](/es/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Añade la interfaz de canal IRC para enviar y recibir mensajes de OpenClaw.

- **[kilocode](/es/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Añade compatibilidad con el proveedor de modelos Kilocode a OpenClaw.

- **[kimi](/es/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Añade compatibilidad con los proveedores de modelos Kimi y Kimi Coding a OpenClaw.

- **[line](/es/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. Plugin de canal LINE de OpenClaw para chats de LINE Bot API.

- **[llama-cpp](/es/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Inferencia de texto y embeddings GGUF locales mediante node-llama-cpp.

- **[lobster](/es/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Plugin de herramienta de flujos de trabajo Lobster para pipelines tipados y aprobaciones reanudables.

- **[longcat](/es/plugins/reference/longcat)** (`@openclaw/longcat-provider`) - npm; ClawHub: `clawhub:@openclaw/longcat-provider`. Plugin de proveedor LongCat de OpenClaw.

- **[matrix](/es/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Plugin de canal Matrix de OpenClaw para salas y mensajes directos.

- **[mattermost](/es/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Añade la interfaz de canal Mattermost para enviar y recibir mensajes de OpenClaw.

- **[memory-lancedb](/es/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Plugin de memoria a largo plazo de OpenClaw respaldado por LanceDB, con recuperación automática, captura automática y búsqueda vectorial.

- **[moonshot](/es/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Añade compatibilidad con el proveedor de modelos Moonshot a OpenClaw.

- **[msteams](/es/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Plugin de canal Microsoft Teams de OpenClaw para conversaciones con bots.

- **[mxc](/es/plugins/reference/mxc)** (`@openclaw/mxc-sandbox`) - npm; ClawHub. Ejecución de herramientas aislada en el ámbito del sistema operativo mediante MXC para hosts Windows compatibles con MXC: ejecuta comandos en ProcessContainer (Windows) con archivos de políticas MXC configurados.

- **[nextcloud-talk](/es/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Plugin de canal Nextcloud Talk de OpenClaw para conversaciones.

- **[nostr](/es/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. Plugin de canal Nostr de OpenClaw para mensajes directos cifrados con NIP-04.

- **[openshell](/es/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. Backend de entorno aislado de OpenClaw para la CLI NVIDIA OpenShell, con espacios de trabajo locales replicados y ejecución de comandos mediante SSH.

- **[parallel](/es/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Añade compatibilidad con un proveedor de búsqueda web.

- **[perplexity](/es/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Añade compatibilidad con un proveedor de búsqueda web.

- **[pixverse](/es/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin de proveedor de generación de vídeo PixVerse de OpenClaw.

- **[qianfan](/es/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Añade compatibilidad con el proveedor de modelos Qianfan a OpenClaw.

- **[qqbot](/es/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Plugin de canal QQ Bot de OpenClaw para flujos de trabajo de grupos y mensajes directos.

- **[qwen](/es/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Añade compatibilidad con los proveedores de modelos Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Token Plan y Bailian Token Plan a OpenClaw.

- **[raft](/es/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Plugin de canal Raft de OpenClaw para puentes seguros de activación mediante CLI.

- **[searxng](/es/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Añade compatibilidad con un proveedor de búsqueda web.

- **[signal](/es/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Añade la interfaz de canal Signal para enviar y recibir mensajes de OpenClaw.

- **[slack](/es/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Plugin de canal Slack de OpenClaw para canales, mensajes directos, comandos y eventos de aplicaciones.

- **[sms](/es/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Plugin de canal SMS de Twilio para mensajes de texto de OpenClaw.

- **[stepfun](/es/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Añade compatibilidad con los proveedores de modelos StepFun y StepFun Plan a OpenClaw.

- **[synology-chat](/es/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Plugin de canal de Synology Chat para canales y mensajes directos de OpenClaw.

- **[tavily](/es/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Añade herramientas que pueden invocar los agentes. Añade compatibilidad con proveedores de búsqueda web.

- **[tencent](/es/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Añade compatibilidad con los proveedores de modelos Tencent TokenHub y Tencent Tokenplan a OpenClaw.

- **[tlon](/es/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Plugin de canal Tlon/Urbit de OpenClaw para flujos de trabajo de chat.

- **[tokenjuice](/es/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Compacta los resultados de las herramientas exec y bash con reductores de Tokenjuice.

- **[twitch](/es/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Plugin de canal de Twitch de OpenClaw para flujos de trabajo de chat y moderación.

- **[venice](/es/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Añade compatibilidad con el proveedor de modelos Venice a OpenClaw.

- **[vercel-ai-gateway](/es/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Añade compatibilidad con el proveedor de modelos Vercel AI Gateway a OpenClaw.

- **[voice-call](/es/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Plugin de llamadas de voz de OpenClaw para llamadas telefónicas mediante Twilio, Telnyx y Plivo.

- **[whatsapp](/es/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Plugin de canal de WhatsApp de OpenClaw para chats de WhatsApp Web.

- **[zai](/es/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Añade compatibilidad con el proveedor de modelos Z.AI a OpenClaw.

- **[zalo](/es/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Plugin de canal de Zalo de OpenClaw para chats de bots y Webhook.

- **[zalouser](/es/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Plugin de cuenta personal de Zalo de OpenClaw mediante la integración nativa con zca-js.

## Solo en el checkout del código fuente

2 plugins

- **[qa-channel](/es/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - solo en el checkout del código fuente. Añade la interfaz QA Channel para enviar y recibir mensajes de OpenClaw.

- **[qa-lab](/es/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - solo en el checkout del código fuente. Plugin del laboratorio de control de calidad de OpenClaw con una interfaz privada de depuración y un ejecutor de escenarios.
