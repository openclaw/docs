---
read_when:
    - Cambiar el entorno de ejecución del agente, la inicialización del espacio de trabajo o el comportamiento de la sesión
summary: Entorno de ejecución del agente, contrato del espacio de trabajo e inicialización de la sesión
title: Entorno de ejecución del agente
x-i18n:
    generated_at: "2026-05-06T05:29:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372cf6a02b35646c24e68d96938bba57721eeec512e17c2d40c8e721e7561bd1
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw ejecuta un **único runtime de agente integrado**: un proceso de agente por
Gateway, con su propio espacio de trabajo, archivos de arranque y almacén de sesiones. Esta página
cubre ese contrato de runtime: qué debe contener el espacio de trabajo, qué archivos se
inyectan y cómo las sesiones arrancan sobre él.

## Espacio de trabajo (obligatorio)

OpenClaw usa un único directorio de espacio de trabajo de agente (`agents.defaults.workspace`) como el **único** directorio de trabajo (`cwd`) del agente para herramientas y contexto.

Recomendado: usa `openclaw setup` para crear `~/.openclaw/openclaw.json` si falta e inicializar los archivos del espacio de trabajo.

Diseño completo del espacio de trabajo + guía de copias de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)

Si `agents.defaults.sandbox` está habilitado, las sesiones que no sean la principal pueden sobrescribir esto con
espacios de trabajo por sesión bajo `agents.defaults.sandbox.workspaceRoot` (consulta
[Configuración del Gateway](/es/gateway/configuration)).

## Archivos de arranque (inyectados)

Dentro de `agents.defaults.workspace`, OpenClaw espera estos archivos editables por el usuario:

- `AGENTS.md`: instrucciones operativas + "memoria"
- `SOUL.md`: personalidad, límites, tono
- `TOOLS.md`: notas de herramientas mantenidas por el usuario (p. ej., `imsg`, `sag`, convenciones)
- `BOOTSTRAP.md`: ritual único de primera ejecución (se elimina al completarse)
- `IDENTITY.md`: nombre/vibra/emoji del agente
- `USER.md`: perfil del usuario + forma preferida de dirigirse a él

En el primer turno de una nueva sesión, OpenClaw inyecta el contenido de estos archivos en el Contexto del proyecto del prompt del sistema.

Los archivos en blanco se omiten. Los archivos grandes se recortan y truncan con un marcador para que los prompts se mantengan ligeros (lee el archivo para ver el contenido completo).

Si falta un archivo, OpenClaw inyecta una sola línea de marcador de "archivo faltante" (y `openclaw setup` creará una plantilla predeterminada segura).

`BOOTSTRAP.md` solo se crea para un **espacio de trabajo completamente nuevo** (sin otros archivos de arranque presentes). Mientras esté pendiente, OpenClaw lo mantiene en el Contexto del proyecto y agrega guía de arranque en el prompt del sistema para el ritual inicial en lugar de copiarlo en el mensaje del usuario. Si lo eliminas después de completar el ritual, no debería volver a crearse en reinicios posteriores.

Para deshabilitar por completo la creación de archivos de arranque (para espacios de trabajo presembrados), configura:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Herramientas integradas

Las herramientas principales (read/exec/edit/write y herramientas de sistema relacionadas) siempre están disponibles,
sujetas a la política de herramientas. `apply_patch` es opcional y está controlada por
`tools.exec.applyPatch`. `TOOLS.md` **no** controla qué herramientas existen; es
guía sobre cómo _tú_ quieres que se usen.

## Skills

OpenClaw carga Skills desde estas ubicaciones (la precedencia más alta primero):

- Espacio de trabajo: `<workspace>/skills`
- Skills de agente del proyecto: `<workspace>/.agents/skills`
- Skills de agente personales: `~/.agents/skills`
- Administradas/locales: `~/.openclaw/skills`
- Incluidas (distribuidas con la instalación)
- Carpetas adicionales de Skills: `skills.load.extraDirs`

Las Skills pueden controlarse mediante configuración/env (consulta `skills` en [Configuración del Gateway](/es/gateway/configuration)).

## Límites del runtime

El runtime de agente integrado se basa en el núcleo de agente de Pi (modelos, herramientas y
canalización de prompts). La gestión de sesiones, el descubrimiento, el cableado de herramientas y la
entrega por canales son capas propiedad de OpenClaw sobre ese núcleo.

## Sesiones

Las transcripciones de sesión se almacenan como JSONL en:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

El ID de sesión es estable y lo elige OpenClaw.
No se leen carpetas de sesiones heredadas de otras herramientas.

## Dirección durante el streaming

Cuando el modo de cola es `steer`, los mensajes entrantes se inyectan en la ejecución actual.
La dirección en cola se entrega **después de que el turno actual del asistente termine de
ejecutar sus llamadas a herramientas**, antes de la siguiente llamada al LLM. Pi vacía juntos todos los mensajes de
dirección pendientes para `steer`; el `queue` heredado vacía un mensaje por
límite de modelo. La dirección ya no omite las llamadas a herramientas restantes del mensaje
actual del asistente.

Cuando el modo de cola es `followup` o `collect`, los mensajes entrantes se retienen hasta que
termina el turno actual; luego se inicia un nuevo turno de agente con las cargas en cola. Consulta
[Cola](/es/concepts/queue) y [Cola de dirección](/es/concepts/queue-steering) para conocer el comportamiento de modos
y límites.

El streaming de bloques envía los bloques completados del asistente en cuanto terminan; está
**desactivado de forma predeterminada** (`agents.defaults.blockStreamingDefault: "off"`).
Ajusta el límite mediante `agents.defaults.blockStreamingBreak` (`text_end` frente a `message_end`; el valor predeterminado es text_end).
Controla la fragmentación suave de bloques con `agents.defaults.blockStreamingChunk` (valor predeterminado de
800-1200 caracteres; prefiere saltos de párrafo, luego saltos de línea; las oraciones al final).
Agrupa fragmentos emitidos por streaming con `agents.defaults.blockStreamingCoalesce` para reducir el
spam de líneas individuales (fusión basada en inactividad antes del envío). Los canales que no sean Telegram requieren
`*.blockStreaming: true` explícito para habilitar respuestas por bloques.
Los resúmenes detallados de herramientas se emiten al iniciar la herramienta (sin debounce); Control UI
emite la salida de herramientas mediante eventos de agente cuando está disponible.
Más detalles: [Streaming + fragmentación](/es/concepts/streaming).

## Referencias de modelo

Las referencias de modelo en la configuración (por ejemplo `agents.defaults.model` y `agents.defaults.models`) se analizan dividiendo por el **primer** `/`.

- Usa `provider/model` al configurar modelos.
- Si el ID del modelo contiene `/` (estilo OpenRouter), incluye el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw intenta primero con un alias, luego con una coincidencia única
  de proveedor configurado para ese ID de modelo exacto, y solo después recurre
  al proveedor predeterminado configurado. Si ese proveedor ya no expone el
  modelo predeterminado configurado, OpenClaw recurre al primer
  proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado.

## Configuración (mínima)

Como mínimo, configura:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (muy recomendado)

---

_Siguiente: [Chats grupales](/es/channels/group-messages)_ 🦞

## Relacionado

- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Gestión de sesiones](/es/concepts/session)
