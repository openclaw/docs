---
read_when:
    - Está decidiendo si un plugin se incluye en el paquete npm principal o se instala por separado
    - Está actualizando los metadatos de paquetes de plugins incluidos o la automatización de versiones
    - Necesita la lista canónica de plugins internos y externos.
summary: Inventario generado de plugins de OpenClaw incluidos en el núcleo, publicados externamente o conservados únicamente en el código fuente
title: Inventario de plugins
x-i18n:
    generated_at: "2026-07-21T22:43:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2d835087afbe9d75f883c3db9739f914bedab5ac87a9c20b69c248304b61c594
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
- **Solo en el checkout del código fuente:** plugin local del repositorio que se omite de los artefactos npm publicados y no se anuncia como paquete instalable.

Los checkouts del código fuente son distintos de las instalaciones de npm: después de `pnpm install`, los plugins
incluidos se cargan desde `extensions/<id>`, de modo que estén disponibles las modificaciones locales y las dependencias
del espacio de trabajo locales del paquete.

## Instalar un plugin

Use la vía de instalación de cada entrada para determinar si es necesario instalarlo. Los plugins
que indican `included in OpenClaw` ya están presentes en el paquete principal.
Los paquetes externos oficiales requieren una instalación y, después, reiniciar el Gateway.

Por ejemplo, Discord es un paquete externo oficial:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Durante la transición del lanzamiento, las especificaciones de paquete simples siguen instalándose desde npm.
Use `clawhub:@openclaw/discord` o `npm:@openclaw/discord` cuando necesite una
fuente explícita. Después de la instalación, siga la documentación de configuración del plugin, como
[Discord](/es/channels/discord), para añadir credenciales y la configuración del canal. Consulte
[Gestionar plugins](/es/plugins/manage-plugins) para ver los comandos de actualización, desinstalación y publicación.

Cada entrada incluye el paquete, la vía de distribución y la descripción.

## Paquete npm principal

70 plugins

- **[admin-http-rpc](/es/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - incluido en OpenClaw. Endpoint RPC HTTP de administración de OpenClaw.

- **[alibaba](/es/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - incluido en OpenClaw. Añade compatibilidad con un proveedor de generación de vídeo.

- **[anthropic](/es/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - incluido en OpenClaw. Modelos de Anthropic, CLI de Claude y catálogo nativo de sesiones de Claude.

- **[azure-speech](/es/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - incluido en OpenClaw. Conversión de texto a voz de Azure AI Speech (MP3, notas de voz Ogg/Opus nativas y telefonía PCM).

- **[bonjour](/es/plugins/reference/bonjour)** (`@openclaw/bonjour`) - incluido en OpenClaw. Anuncia el Gateway local de OpenClaw mediante Bonjour/mDNS.

- **[browser](/es/plugins/reference/browser)** (`@openclaw/browser-plugin`) - incluido en OpenClaw. Añade herramientas que el agente puede invocar.

- **[byteplus](/es/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos BytePlus y BytePlus Plan.

- **[canvas](/es/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - incluido en OpenClaw. Superficies experimentales de control de Canvas y renderizado de A2UI para nodos emparejados.

- **[clawrouter](/es/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos ClawRouter.

- **[cohere](/es/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - incluido en OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. Plugin del proveedor Cohere para OpenClaw.

- **[comfy](/es/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos ComfyUI.

- **[copilot-proxy](/es/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Copilot Proxy.

- **[crabbox](/es/plugins/reference/crabbox)** (`@openclaw/crabbox-provider`) - incluido en OpenClaw. Proveedor de trabajadores en la nube respaldado por la CLI de Crabbox.

- **[cua-computer](/plugins/reference/cua-computer)** (`@openclaw/cua-computer`) - incluido en OpenClaw. Control informático experimental mediante cua-driver para hosts de nodos Windows y Linux.

- **[deepgram](/es/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - incluido en OpenClaw. Añade compatibilidad con un proveedor de comprensión multimedia. Añade compatibilidad con un proveedor de transcripción en tiempo real.

- **[document-extract](/es/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - incluido en OpenClaw. Extrae texto e imágenes de página alternativas de archivos de documento adjuntos locales.

- **[duckduckgo](/es/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - incluido en OpenClaw. Añade compatibilidad con un proveedor de búsqueda web.

- **[elevenlabs](/es/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - incluido en OpenClaw. Añade compatibilidad con un proveedor de comprensión multimedia. Añade compatibilidad con un proveedor de transcripción en tiempo real. Añade compatibilidad con un proveedor de conversión de texto a voz.

- **[fal](/es/plugins/reference/fal)** (`@openclaw/fal-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos fal.

- **[file-transfer](/es/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - incluido en OpenClaw. Obtiene, enumera y escribe archivos en nodos emparejados mediante comandos de nodo específicos. Evita el truncamiento de stdout de bash mediante el uso de base64 sobre node.invoke para archivos binarios de hasta 16 MB.

- **[github-copilot](/es/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos GitHub Copilot.

- **[google](/es/plugins/reference/google)** (`@openclaw/google-plugin`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos Google, Google Gemini CLI y Google Vertex.

- **[huggingface](/es/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Hugging Face.

- **[imessage](/es/plugins/reference/imessage)** (`@openclaw/imessage`) - incluido en OpenClaw. Añade la superficie del canal iMessage para enviar y recibir mensajes de OpenClaw.

- **[linux-canvas](/es/plugins/reference/linux-canvas)** (`@openclaw/linux-canvas`) - incluido en OpenClaw. Puente de renderizado de Canvas para la aplicación de escritorio de OpenClaw para Linux.

- **[linux-node](/es/plugins/reference/linux-node)** (`@openclaw/linux-node`) - incluido en OpenClaw. Notificaciones de escritorio, captura de cámara y ubicación para hosts de nodos Linux.

- **[litellm](/es/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos LiteLLM.

- **[llm-task](/es/plugins/reference/llm-task)** (`@openclaw/llm-task`) - incluido en OpenClaw. Herramienta LLM genérica que solo usa JSON para tareas estructuradas que pueden invocarse desde flujos de trabajo.

- **[lmstudio](/es/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos LM Studio.

- **[logbook](/es/plugins/reference/logbook)** (`@openclaw/logbook`) - incluido en OpenClaw. Diario de trabajo automático: captura instantáneas periódicas de la pantalla de un nodo emparejado y las convierte en una cronología revisable de la jornada.

- **[memory-core](/es/plugins/reference/memory-core)** (`@openclaw/memory-core`) - incluido en OpenClaw. Añade herramientas que el agente puede invocar.

- **[memory-wiki](/es/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - incluido en OpenClaw. Compilador de wiki persistente y repositorio de conocimiento compatible con Obsidian para OpenClaw.

- **[meta](/es/plugins/reference/meta)** (`@openclaw/meta-provider`) - incluido en OpenClaw; npm; ClawHub: `clawhub:@openclaw/meta-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Meta.

- **[microsoft](/es/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - incluido en OpenClaw. Añade compatibilidad con un proveedor de conversión de texto a voz.

- **[microsoft-foundry](/es/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Microsoft Foundry.

- **[migrate-claude](/es/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - incluido en OpenClaw. Importa en OpenClaw instrucciones de Claude Code y Claude Desktop, servidores MCP, skills y configuración segura.

- **[migrate-hermes](/es/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - incluido en OpenClaw. Importa en OpenClaw la configuración, las memorias, las skills y las credenciales compatibles de Hermes.

- **[minimax](/es/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos MiniMax y MiniMax Portal.

- **[mistral](/es/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Mistral.

- **[novita](/es/plugins/reference/novita)** (`@openclaw/novita-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos Novita, Novita AI y Novitaai.

- **[nvidia](/es/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos NVIDIA.

- **[oc-path](/es/plugins/reference/oc-path)** (`@openclaw/oc-path`) - incluido en OpenClaw. Añade la CLI de rutas openclaw para direccionar archivos del espacio de trabajo mediante oc://.

- **[ollama](/es/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos Ollama y Ollama Cloud.

- **[onepassword](/es/plugins/reference/onepassword)** (`@openclaw/onepassword`) - incluido en OpenClaw. Intermediario seleccionado de secretos de 1Password con política de aprobación e historial de auditoría en SQLite.

- **[open-prose](/es/plugins/reference/open-prose)** (`@openclaw/open-prose`) - incluido en OpenClaw. Paquete de skills de la máquina virtual OpenProse con un comando de barra /prose.

- **[openai](/es/plugins/reference/openai)** (`@openclaw/openai-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos OpenAI.

- **[opencode](/es/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos OpenCode.

- **[opencode-go](/es/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos OpenCode Go.

- **[openrouter](/es/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos OpenRouter.

- **[policy](/es/plugins/reference/policy)** (`@openclaw/policy`) - incluido en OpenClaw. Añade comprobaciones de doctor respaldadas por políticas para verificar la conformidad del espacio de trabajo.

- **[reef](/es/plugins/reference/reef)** (`@openclaw/reef`) - incluido en OpenClaw. Canal claw protegido y cifrado de extremo a extremo.

- **[runway](/es/plugins/reference/runway)** (`@openclaw/runway-provider`) - incluido en OpenClaw. Añade compatibilidad con un proveedor de generación de vídeo.

- **[senseaudio](/es/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - incluido en OpenClaw. Añade compatibilidad con un proveedor de comprensión multimedia.

- **[sglang](/es/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos SGLang.

- **[synthetic](/es/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Synthetic.

- **[teams-meetings](/es/plugins/reference/teams-meetings)** (`@openclaw/teams-meetings`) - incluido en OpenClaw. Permite unirse a reuniones de Microsoft Teams como invitado mediante el navegador Chrome.

- **[telegram](/es/plugins/reference/telegram)** (`@openclaw/telegram`) - incluido en OpenClaw. Añade la superficie del canal Telegram para enviar y recibir mensajes de OpenClaw.

- **[together](/es/plugins/reference/together)** (`@openclaw/together-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Together.

- **[tts-local-cli](/es/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - incluido en OpenClaw. Añade compatibilidad con un proveedor de conversión de texto a voz.

- **[vault](/es/plugins/reference/vault)** (`@openclaw/vault`) - incluido en OpenClaw. Integración del proveedor SecretRef de HashiCorp Vault.

- **[vllm](/es/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos vLLM.

- **[volcengine](/es/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos Volcengine y Volcengine Plan.

- **[voyage](/es/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - incluido en OpenClaw. Añade compatibilidad con proveedores de incrustaciones de memoria.

- **[vydra](/es/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos Vydra.

- **[web-readability](/es/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - incluido en OpenClaw. Extrae contenido legible de artículos de las respuestas locales de obtención web en HTML.

- **[webhooks](/es/plugins/reference/webhooks)** (`@openclaw/webhooks`) - incluido en OpenClaw. Webhooks entrantes autenticados que vinculan la automatización externa con los TaskFlow de OpenClaw.

- **[workboard](/es/plugins/reference/workboard)** (`@openclaw/workboard`) - incluido en OpenClaw. Panel de trabajo para incidencias y sesiones gestionadas por agentes.

- **[xai](/es/plugins/reference/xai)** (`@openclaw/xai-plugin`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con el proveedor de modelos xAI.

- **[xiaomi](/es/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - incluido en OpenClaw. Añade a OpenClaw compatibilidad con los proveedores de modelos Xiaomi y Xiaomi Token Plan.

- **[zoom-meetings](/es/plugins/reference/zoom-meetings)** (`@openclaw/zoom-meetings`) - incluido en OpenClaw. Permite unirse a reuniones de Zoom como invitado mediante el navegador Chrome.

## Paquetes externos oficiales

72 plugins

- **[acpx](/es/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Backend de ejecución ACP de OpenClaw con gestión de sesiones y transporte a cargo del plugin.

- **[amazon-bedrock](/es/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Plugin proveedor de Amazon Bedrock para OpenClaw, con detección de modelos, incrustaciones y compatibilidad con barreras de seguridad.

- **[amazon-bedrock-mantle](/es/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Plugin proveedor de Amazon Bedrock Mantle para OpenClaw destinado al enrutamiento de modelos compatibles con OpenAI.

- **[anthropic-vertex](/es/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Plugin proveedor de Anthropic Vertex para OpenClaw destinado a modelos Claude en Google Vertex AI.

- **[arcee](/es/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Arcee.

- **[baseten](/es/plugins/reference/baseten)** (`@openclaw/baseten-provider`) - npm; ClawHub: `clawhub:@openclaw/baseten-provider`. Plugin proveedor de Baseten para OpenClaw.

- **[brave](/es/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Plugin proveedor de Brave Search para búsquedas web en OpenClaw.

- **[cerebras](/es/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Cerebras.

- **[chutes](/es/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Chutes.

- **[clickclack](/es/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Añade la interfaz de canal Clickclack para enviar y recibir mensajes de OpenClaw.

- **[cloudflare-ai-gateway](/es/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Cloudflare AI Gateway.

- **[codex](/es/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Entorno de integración del servidor de aplicaciones Codex y catálogo de sesiones nativo.

- **[copilot](/es/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Registra el entorno de ejecución de agentes GitHub Copilot.

- **[deepinfra](/es/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos DeepInfra.

- **[deepseek](/es/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos DeepSeek.

- **[diagnostics-otel](/es/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Exportador de diagnósticos OpenTelemetry de OpenClaw para métricas, trazas y registros.

- **[diagnostics-prometheus](/es/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Exportador de diagnósticos Prometheus de OpenClaw para métricas de ejecución.

- **[diffs](/es/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Plugin de OpenClaw para visualizar diferencias en modo de solo lectura y representar archivos para agentes.

- **[diffs-language-pack](/es/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Añade resaltado de sintaxis para lenguajes no incluidos en el conjunto predeterminado del visor de diferencias.

- **[discord](/es/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Plugin de canal Discord para OpenClaw, compatible con canales, mensajes directos, comandos y eventos de aplicaciones.

- **[exa](/es/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Añade compatibilidad con proveedores de búsqueda web.

- **[featherless](/es/plugins/reference/featherless)** (`@openclaw/featherless-provider`) - npm; ClawHub: `clawhub:@openclaw/featherless-provider`. Plugin proveedor de Featherless AI para OpenClaw.

- **[feishu](/es/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Plugin de canal Feishu/Lark para OpenClaw destinado a chats y herramientas de trabajo (mantenido por la comunidad a cargo de @m1heng).

- **[firecrawl](/es/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Añade herramientas invocables por agentes. Añade compatibilidad con proveedores de obtención web. Añade compatibilidad con proveedores de búsqueda web.

- **[fireworks](/es/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Fireworks.

- **[gmi](/es/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin proveedor de GMI Cloud para OpenClaw.

- **[google-meet](/es/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Plugin participante de Google Meet para OpenClaw que permite unirse a llamadas mediante transportes de Chrome o Twilio.

- **[googlechat](/es/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Plugin de canal Google Chat para OpenClaw destinado a espacios y mensajes directos.

- **[gradium](/es/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Añade compatibilidad con proveedores de conversión de texto a voz.

- **[groq](/es/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Groq.

- **[inworld](/es/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Conversión de texto a voz en streaming de Inworld (MP3, OGG_OPUS y PCM para telefonía).

- **[irc](/es/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Añade la interfaz de canal IRC para enviar y recibir mensajes de OpenClaw.

- **[kilocode](/es/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Kilocode.

- **[kimi](/es/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Añade a OpenClaw compatibilidad con los proveedores de modelos Kimi y Kimi Coding.

- **[line](/es/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. Plugin de canal LINE para OpenClaw destinado a chats de LINE Bot API.

- **[llama-cpp](/es/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Inferencia de texto e incrustaciones GGUF locales mediante node-llama-cpp.

- **[lobster](/es/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Plugin de la herramienta de flujos de trabajo Lobster para pipelines con tipos y aprobaciones reanudables.

- **[longcat](/es/plugins/reference/longcat)** (`@openclaw/longcat-provider`) - npm; ClawHub: `clawhub:@openclaw/longcat-provider`. Plugin proveedor de LongCat para OpenClaw.

- **[matrix](/es/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Plugin de canal Matrix para OpenClaw destinado a salas y mensajes directos.

- **[mattermost](/es/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Añade la interfaz de canal Mattermost para enviar y recibir mensajes de OpenClaw.

- **[memory-lancedb](/es/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Plugin de memoria a largo plazo para OpenClaw respaldado por LanceDB, con recuperación automática, captura automática y búsqueda vectorial.

- **[moonshot](/es/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Moonshot.

- **[msteams](/es/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Plugin de canal Microsoft Teams para OpenClaw destinado a conversaciones con bots.

- **[mxc](/es/plugins/reference/mxc)** (`@openclaw/mxc-sandbox`) - npm; ClawHub. Ejecución de herramientas aislada en el nivel del sistema operativo mediante MXC: ejecuta comandos en un ProcessContainer de Windows con archivos de políticas MXC configurados.

- **[nextcloud-talk](/es/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Plugin de canal Nextcloud Talk para conversaciones en OpenClaw.

- **[nostr](/es/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. Plugin de canal Nostr para OpenClaw destinado a mensajes directos cifrados con NIP-04.

- **[openshell](/es/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. Backend de entorno aislado de OpenClaw para la CLI NVIDIA OpenShell, con espacios de trabajo locales replicados y ejecución de comandos mediante SSH.

- **[parallel](/es/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Añade compatibilidad con proveedores de búsqueda web.

- **[perplexity](/es/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Añade compatibilidad con proveedores de búsqueda web.

- **[pixverse](/es/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin proveedor de generación de vídeo PixVerse para OpenClaw.

- **[qianfan](/es/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Añade a OpenClaw compatibilidad con el proveedor de modelos Qianfan.

- **[qqbot](/es/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Plugin de canal QQ Bot para OpenClaw destinado a flujos de trabajo grupales y de mensajes directos.

- **[qwen](/es/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Añade a OpenClaw compatibilidad con los proveedores de modelos Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Token Plan y Bailian Token Plan.

- **[raft](/es/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Plugin de canal Raft para OpenClaw destinado a puentes seguros de activación de la CLI.

- **[searxng](/es/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Añade compatibilidad con proveedores de búsqueda web.

- **[signal](/es/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Añade la interfaz de canal Signal para enviar y recibir mensajes de OpenClaw.

- **[slack](/es/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Plugin de canal Slack para OpenClaw, compatible con canales, mensajes directos, comandos y eventos de aplicaciones.

- **[sms](/es/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Plugin de canal SMS de Twilio para mensajes de texto de OpenClaw.

- **[stepfun](/es/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Añade compatibilidad con los proveedores de modelos StepFun y StepFun Plan a OpenClaw.

- **[synology-chat](/es/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Plugin de canal Synology Chat para canales y mensajes directos de OpenClaw.

- **[tavily](/es/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Añade herramientas que puede invocar el agente. Añade compatibilidad con proveedores de búsqueda web.

- **[tencent](/es/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Añade compatibilidad con los proveedores de modelos Tencent TokenHub y Tencent Tokenplan a OpenClaw.

- **[tlon](/es/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Plugin de canal Tlon/Urbit de OpenClaw para flujos de trabajo de chat.

- **[tokenjuice](/es/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Compacta los resultados de las herramientas exec y bash mediante reductores de Tokenjuice.

- **[twitch](/es/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Plugin de canal Twitch de OpenClaw para flujos de trabajo de chat y moderación.

- **[venice](/es/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Añade compatibilidad con el proveedor de modelos Venice a OpenClaw.

- **[vercel-ai-gateway](/es/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Añade compatibilidad con el proveedor de modelos Vercel AI Gateway a OpenClaw.

- **[voice-call](/es/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Plugin de llamadas de voz de OpenClaw para llamadas telefónicas mediante Twilio, Telnyx y Plivo.

- **[whatsapp](/es/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Plugin de canal WhatsApp de OpenClaw para chats de WhatsApp Web.

- **[zai](/es/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Añade compatibilidad con el proveedor de modelos Z.AI a OpenClaw.

- **[zalo](/es/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Plugin de canal Zalo de OpenClaw para chats de bots y Webhook.

- **[zalouser](/es/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Plugin de cuenta personal de Zalo para OpenClaw mediante la integración nativa con zca-js.

## Solo en el repositorio del código fuente

2 plugins

- **[qa-channel](/es/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - solo en el repositorio del código fuente. Añade la superficie QA Channel para enviar y recibir mensajes de OpenClaw.

- **[qa-lab](/es/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - solo en el repositorio del código fuente. Plugin de laboratorio de control de calidad de OpenClaw con una interfaz privada de depuración y un ejecutor de escenarios.
