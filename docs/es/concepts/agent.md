---
read_when:
    - Cambiar el entorno de ejecución del agente, la inicialización del espacio de trabajo o el comportamiento de la sesión
summary: Tiempo de ejecución del agente, contrato del espacio de trabajo e inicialización de la sesión
title: Tiempo de ejecución del agente
x-i18n:
    generated_at: "2026-05-04T02:22:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89bbbd05a9bf2054d3a1f24aeed005a05b61152a047b593addfb46817baae05a
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw ejecuta un **único runtime de agente integrado**: un proceso de agente por
Gateway, con su propio espacio de trabajo, archivos de arranque y almacén de sesiones. Esta página
cubre ese contrato de runtime: qué debe contener el espacio de trabajo, qué archivos se
inyectan y cómo se arrancan las sesiones con él.

## Espacio de trabajo (obligatorio)

OpenClaw usa un único directorio de espacio de trabajo del agente (`agents.defaults.workspace`) como el **único** directorio de trabajo (`cwd`) del agente para herramientas y contexto.

Recomendado: usa `openclaw setup` para crear `~/.openclaw/openclaw.json` si falta e inicializar los archivos del espacio de trabajo.

Diseño completo del espacio de trabajo + guía de copias de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)

Si `agents.defaults.sandbox` está habilitado, las sesiones que no son principales pueden sobrescribir esto con
espacios de trabajo por sesión bajo `agents.defaults.sandbox.workspaceRoot` (consulta
[configuración de Gateway](/es/gateway/configuration)).

## Archivos de arranque (inyectados)

Dentro de `agents.defaults.workspace`, OpenClaw espera estos archivos editables por el usuario:

- `AGENTS.md` — instrucciones operativas + “memoria”
- `SOUL.md` — persona, límites, tono
- `TOOLS.md` — notas de herramientas mantenidas por el usuario (por ejemplo, `imsg`, `sag`, convenciones)
- `BOOTSTRAP.md` — ritual de primera ejecución de una sola vez (eliminado tras completarse)
- `IDENTITY.md` — nombre/ambiente/emoji del agente
- `USER.md` — perfil de usuario + forma de tratamiento preferida

En el primer turno de una sesión nueva, OpenClaw inyecta el contenido de estos archivos en el Contexto del proyecto del prompt del sistema.

Los archivos en blanco se omiten. Los archivos grandes se recortan y truncan con un marcador para que los prompts se mantengan ligeros (lee el archivo para ver el contenido completo).

Si falta un archivo, OpenClaw inyecta una sola línea de marcador de “archivo faltante” (y `openclaw setup` creará una plantilla predeterminada segura).

`BOOTSTRAP.md` solo se crea para un **espacio de trabajo completamente nuevo** (sin otros archivos de arranque presentes). Mientras está pendiente, OpenClaw lo mantiene en el Contexto del proyecto y agrega al prompt del sistema una guía de arranque para el ritual inicial en lugar de copiarlo en el mensaje de usuario. Si lo eliminas después de completar el ritual, no debería volver a crearse en reinicios posteriores.

Para deshabilitar por completo la creación de archivos de arranque (para espacios de trabajo presembrados), establece:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Herramientas integradas

Las herramientas principales (lectura/ejecución/edición/escritura y herramientas del sistema relacionadas) siempre están disponibles,
sujetas a la política de herramientas. `apply_patch` es opcional y está restringida por
`tools.exec.applyPatch`. `TOOLS.md` **no** controla qué herramientas existen; es
una guía sobre cómo quieres _tú_ que se usen.

## Skills

OpenClaw carga Skills desde estas ubicaciones (mayor precedencia primero):

- Espacio de trabajo: `<workspace>/skills`
- Skills del agente del proyecto: `<workspace>/.agents/skills`
- Skills personales del agente: `~/.agents/skills`
- Gestionadas/locales: `~/.openclaw/skills`
- Incluidas (distribuidas con la instalación)
- Carpetas de Skills adicionales: `skills.load.extraDirs`

Las Skills pueden restringirse mediante configuración/env (consulta `skills` en [configuración de Gateway](/es/gateway/configuration)).

## Límites del runtime

El runtime de agente integrado se basa en el núcleo de agente Pi (modelos, herramientas y
canalización de prompts). La gestión de sesiones, el descubrimiento, el cableado de herramientas
y la entrega por canales son capas propiedad de OpenClaw sobre ese núcleo.

## Sesiones

Las transcripciones de sesión se almacenan como JSONL en:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

El ID de sesión es estable y lo elige OpenClaw.
Las carpetas de sesiones heredadas de otras herramientas no se leen.

## Dirección durante el streaming

Cuando el modo de cola es `steer`, los mensajes entrantes se inyectan en la ejecución actual.
La dirección en cola se entrega **después de que el turno actual del asistente termina de
ejecutar sus llamadas a herramientas**, antes de la siguiente llamada al LLM. Pi vacía todos los mensajes
de dirección pendientes juntos para `steer`; el modo heredado `queue` vacía un mensaje por
límite de modelo. La dirección ya no omite las llamadas a herramientas restantes del mensaje
actual del asistente.

Cuando el modo de cola es `followup` o `collect`, los mensajes entrantes se retienen hasta que
termina el turno actual; luego comienza un nuevo turno del agente con las cargas útiles en cola. Consulta
[Cola](/es/concepts/queue) y [Cola de dirección](/es/concepts/queue-steering) para ver el comportamiento de modos
y límites.

El streaming por bloques envía bloques completados del asistente tan pronto como terminan; está
**desactivado de forma predeterminada** (`agents.defaults.blockStreamingDefault: "off"`).
Ajusta el límite mediante `agents.defaults.blockStreamingBreak` (`text_end` frente a `message_end`; el valor predeterminado es text_end).
Controla la división flexible de bloques con `agents.defaults.blockStreamingChunk` (valor predeterminado:
800–1200 caracteres; prefiere saltos de párrafo, luego líneas nuevas; las oraciones al final).
Fusiona fragmentos transmitidos con `agents.defaults.blockStreamingCoalesce` para reducir el
spam de una sola línea (combinación basada en inactividad antes del envío). Los canales que no son Telegram requieren
`*.blockStreaming: true` explícito para habilitar respuestas por bloques.
Los resúmenes detallados de herramientas se emiten al inicio de la herramienta (sin debounce); la Control UI
transmite la salida de herramientas mediante eventos del agente cuando está disponible.
Más detalles: [Streaming + fragmentación](/es/concepts/streaming).

## Referencias de modelos

Las referencias de modelos en la configuración (por ejemplo, `agents.defaults.model` y `agents.defaults.models`) se analizan dividiendo por el **primer** `/`.

- Usa `provider/model` al configurar modelos.
- Si el ID del modelo contiene `/` (estilo OpenRouter), incluye el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw prueba primero un alias, luego una coincidencia única de
  proveedor configurado para ese ID exacto de modelo, y solo entonces recurre
  al proveedor predeterminado configurado. Si ese proveedor ya no expone el
  modelo predeterminado configurado, OpenClaw recurre al primer
  proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado.

## Configuración (mínima)

Como mínimo, establece:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (muy recomendado)

---

_Siguiente: [Chats grupales](/es/channels/group-messages)_ 🦞

## Relacionado

- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Gestión de sesiones](/es/concepts/session)
