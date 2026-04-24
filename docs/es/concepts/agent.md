---
read_when:
    - Cambiar el runtime del agente, el arranque del espacio de trabajo o el comportamiento de la sesión
summary: Runtime del agente, contrato del espacio de trabajo e inicio de sesión de arranque
title: Runtime del agente
x-i18n:
    generated_at: "2026-04-24T05:24:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07fe0ca3c6bc306f95ac024b97b4e6e188c2d30786b936b8bd66a5f3ec012d4e
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw ejecuta un **único runtime de agente integrado**: un proceso de agente por
Gateway, con su propio espacio de trabajo, archivos de arranque y almacén de sesiones. Esta página
cubre ese contrato de runtime: qué debe contener el espacio de trabajo, qué archivos se
inyectan y cómo las sesiones se inician sobre él.

## Espacio de trabajo (obligatorio)

OpenClaw usa un único directorio de espacio de trabajo del agente (`agents.defaults.workspace`) como el **único** directorio de trabajo (`cwd`) del agente para herramientas y contexto.

Recomendado: usa `openclaw setup` para crear `~/.openclaw/openclaw.json` si no existe e inicializar los archivos del espacio de trabajo.

Diseño completo del espacio de trabajo + guía de copias de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)

Si `agents.defaults.sandbox` está habilitado, las sesiones que no sean main pueden anular esto con
espacios de trabajo por sesión bajo `agents.defaults.sandbox.workspaceRoot` (consulta
[Configuración del Gateway](/es/gateway/configuration)).

## Archivos de arranque (inyectados)

Dentro de `agents.defaults.workspace`, OpenClaw espera estos archivos editables por el usuario:

- `AGENTS.md` — instrucciones de funcionamiento + “memoria”
- `SOUL.md` — personalidad, límites, tono
- `TOOLS.md` — notas de herramientas mantenidas por el usuario (por ejemplo, `imsg`, `sag`, convenciones)
- `BOOTSTRAP.md` — ritual único de primera ejecución (se elimina después de completarse)
- `IDENTITY.md` — nombre/estilo/emoji del agente
- `USER.md` — perfil del usuario + forma preferida de tratamiento

En el primer turno de una sesión nueva, OpenClaw inyecta directamente en el contexto del agente el contenido de estos archivos.

Los archivos vacíos se omiten. Los archivos grandes se recortan y truncan con un marcador para que los prompts sigan siendo ligeros (lee el archivo para ver el contenido completo).

Si falta un archivo, OpenClaw inyecta una única línea marcadora de “archivo faltante” (y `openclaw setup` creará una plantilla predeterminada segura).

`BOOTSTRAP.md` solo se crea para un **espacio de trabajo completamente nuevo** (sin otros archivos de arranque presentes). Si lo eliminas después de completar el ritual, no debería volver a crearse en reinicios posteriores.

Para desactivar por completo la creación de archivos de arranque (para espacios de trabajo precargados), establece:

```json5
{ agent: { skipBootstrap: true } }
```

## Herramientas integradas

Las herramientas principales (read/exec/edit/write y herramientas del sistema relacionadas) siempre están disponibles,
sujetas a la política de herramientas. `apply_patch` es opcional y está controlada por
`tools.exec.applyPatch`. `TOOLS.md` **no** controla qué herramientas existen; es
una guía sobre cómo _quieres_ usarlas.

## Skills

OpenClaw carga Skills desde estas ubicaciones (primero la de mayor precedencia):

- Espacio de trabajo: `<workspace>/skills`
- Skills de agente del proyecto: `<workspace>/.agents/skills`
- Skills de agente personales: `~/.agents/skills`
- Gestionadas/locales: `~/.openclaw/skills`
- Incluidas (se entregan con la instalación)
- Carpetas adicionales de Skills: `skills.load.extraDirs`

Las Skills pueden estar controladas por config/env (consulta `skills` en [Configuración del Gateway](/es/gateway/configuration)).

## Límites del runtime

El runtime del agente integrado se basa en el núcleo del agente Pi (modelos, herramientas y
pipeline de prompts). La gestión de sesiones, el descubrimiento, la conexión de herramientas y la
entrega por canales son capas de OpenClaw sobre ese núcleo.

## Sesiones

Las transcripciones de sesión se almacenan como JSONL en:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

El ID de sesión es estable y lo elige OpenClaw.
No se leen carpetas de sesiones heredadas de otras herramientas.

## Dirección durante el streaming

Cuando el modo de cola es `steer`, los mensajes entrantes se inyectan en la ejecución actual.
La dirección en cola se entrega **después de que el turno actual del asistente termine de
ejecutar sus llamadas a herramientas**, antes de la siguiente llamada al LLM. La dirección ya no omite
las llamadas a herramientas restantes del mensaje actual del asistente; inyecta el mensaje en cola
en el siguiente límite del modelo.

Cuando el modo de cola es `followup` o `collect`, los mensajes entrantes se retienen hasta que
termina el turno actual, y entonces comienza un nuevo turno del agente con las cargas útiles en cola. Consulta
[Cola](/es/concepts/queue) para conocer el comportamiento del modo + debounce/límite.

El block streaming envía los bloques completados del asistente en cuanto terminan; está
**desactivado de forma predeterminada** (`agents.defaults.blockStreamingDefault: "off"`).
Ajusta el límite mediante `agents.defaults.blockStreamingBreak` (`text_end` frente a `message_end`; el valor predeterminado es text_end).
Controla la fragmentación flexible de bloques con `agents.defaults.blockStreamingChunk` (predeterminado
800–1200 caracteres; prefiere saltos de párrafo, luego saltos de línea, y por último frases).
Combina los fragmentos transmitidos con `agents.defaults.blockStreamingCoalesce` para reducir
el spam de una sola línea (fusión basada en inactividad antes del envío). Los canales que no sean Telegram requieren
`*.blockStreaming: true` explícito para habilitar respuestas por bloques.
Los resúmenes detallados de herramientas se emiten al inicio de la herramienta (sin debounce); la interfaz de control
transmite la salida de las herramientas mediante eventos del agente cuando está disponible.
Más detalles: [Streaming + fragmentación](/es/concepts/streaming).

## Referencias de modelos

Las referencias de modelos en la configuración (por ejemplo `agents.defaults.model` y `agents.defaults.models`) se analizan dividiendo en la **primera** `/`.

- Usa `provider/model` al configurar modelos.
- Si el propio ID del modelo contiene `/` (estilo OpenRouter), incluye el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw primero intenta un alias, luego una coincidencia única
  de proveedor configurado para ese id de modelo exacto, y solo después recurre
  al proveedor predeterminado configurado. Si ese proveedor ya no expone el
  modelo predeterminado configurado, OpenClaw recurre al primer
  proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado.

## Configuración (mínima)

Como mínimo, establece:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (muy recomendable)

---

_Siguiente: [Chats de grupo](/es/channels/group-messages)_ 🦞

## Relacionado

- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Gestión de sesiones](/es/concepts/session)
