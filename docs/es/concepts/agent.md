---
read_when:
    - Cambiar el entorno de ejecución del agente, la inicialización del espacio de trabajo o el comportamiento de la sesión
summary: Entorno de ejecución del agente, contrato del espacio de trabajo e inicialización de la sesión
title: Tiempo de ejecución del agente
x-i18n:
    generated_at: "2026-04-30T05:36:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d65ee96cece296251d7d3a0512f12d2dfa900db0e5ffc0f37dcddae7ea55ad
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw ejecuta un **único entorno de ejecución de agente integrado**: un proceso de agente por
Gateway, con su propio espacio de trabajo, archivos de arranque y almacén de sesiones. Esta página
cubre ese contrato de entorno de ejecución: qué debe contener el espacio de trabajo, qué archivos se
inyectan y cómo se inicializan las sesiones con él.

## Espacio de trabajo (obligatorio)

OpenClaw usa un único directorio de espacio de trabajo del agente (`agents.defaults.workspace`) como el **único** directorio de trabajo (`cwd`) del agente para herramientas y contexto.

Recomendado: usa `openclaw setup` para crear `~/.openclaw/openclaw.json` si falta e inicializar los archivos del espacio de trabajo.

Diseño completo del espacio de trabajo + guía de copias de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)

Si `agents.defaults.sandbox` está habilitado, las sesiones no principales pueden anular esto con
espacios de trabajo por sesión bajo `agents.defaults.sandbox.workspaceRoot` (consulta
[configuración del Gateway](/es/gateway/configuration)).

## Archivos de arranque (inyectados)

Dentro de `agents.defaults.workspace`, OpenClaw espera estos archivos editables por el usuario:

- `AGENTS.md`: instrucciones operativas + “memoria”
- `SOUL.md`: personalidad, límites, tono
- `TOOLS.md`: notas de herramientas mantenidas por el usuario (por ejemplo, `imsg`, `sag`, convenciones)
- `BOOTSTRAP.md`: ritual único de primera ejecución (eliminado tras completarse)
- `IDENTITY.md`: nombre/vibra/emoji del agente
- `USER.md`: perfil de usuario + forma de tratamiento preferida

En el primer turno de una nueva sesión, OpenClaw inyecta el contenido de estos archivos directamente en el contexto del agente.

Los archivos en blanco se omiten. Los archivos grandes se recortan y truncan con un marcador para que los prompts se mantengan ligeros (lee el archivo para ver el contenido completo).

Si falta un archivo, OpenClaw inyecta una sola línea de marcador de “archivo faltante” (y `openclaw setup` creará una plantilla predeterminada segura).

`BOOTSTRAP.md` solo se crea para un **espacio de trabajo totalmente nuevo** (sin otros archivos de arranque presentes). Si lo eliminas después de completar el ritual, no debería recrearse en reinicios posteriores.

Para deshabilitar por completo la creación de archivos de arranque (para espacios de trabajo presembrados), configura:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Herramientas integradas

Las herramientas principales (read/exec/edit/write y herramientas del sistema relacionadas) siempre están disponibles,
sujetas a la política de herramientas. `apply_patch` es opcional y está controlada por
`tools.exec.applyPatch`. `TOOLS.md` **no** controla qué herramientas existen; es
orientación sobre cómo quieres _tú_ que se usen.

## Skills

OpenClaw carga Skills desde estas ubicaciones (mayor precedencia primero):

- Espacio de trabajo: `<workspace>/skills`
- Skills de agente de proyecto: `<workspace>/.agents/skills`
- Skills de agente personales: `~/.agents/skills`
- Gestionadas/locales: `~/.openclaw/skills`
- Incluidas (enviadas con la instalación)
- Carpetas de Skills adicionales: `skills.load.extraDirs`

Las Skills pueden estar limitadas por configuración/env (consulta `skills` en [configuración del Gateway](/es/gateway/configuration)).

## Límites del entorno de ejecución

El entorno de ejecución de agente integrado está construido sobre el núcleo de agente Pi (modelos, herramientas y
canalización de prompts). La gestión de sesiones, el descubrimiento, el cableado de herramientas y la
entrega a canales son capas propiedad de OpenClaw sobre ese núcleo.

## Sesiones

Las transcripciones de sesión se almacenan como JSONL en:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

El ID de sesión es estable y lo elige OpenClaw.
No se leen carpetas de sesiones heredadas de otras herramientas.

## Dirección durante la transmisión

Cuando el modo de cola es `steer`, los mensajes entrantes se inyectan en la ejecución actual.
La dirección en cola se entrega **después de que el turno actual del asistente termine
de ejecutar sus llamadas a herramientas**, antes de la siguiente llamada al LLM. Pi vacía juntos todos los mensajes de
dirección pendientes para `steer`; el `queue` heredado vacía un mensaje por
límite de modelo. La dirección ya no omite las llamadas a herramientas restantes del mensaje actual del
asistente.

Cuando el modo de cola es `followup` o `collect`, los mensajes entrantes se retienen hasta que
termina el turno actual; luego comienza un nuevo turno del agente con las cargas útiles en cola. Consulta
[Cola](/es/concepts/queue) y [Cola de dirección](/es/concepts/queue-steering) para ver el comportamiento de modos
y límites.

La transmisión por bloques envía bloques completados del asistente en cuanto terminan; está
**desactivada de forma predeterminada** (`agents.defaults.blockStreamingDefault: "off"`).
Ajusta el límite mediante `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; el valor predeterminado es text_end).
Controla la división suave en fragmentos de bloques con `agents.defaults.blockStreamingChunk` (valor predeterminado:
800–1200 caracteres; prefiere saltos de párrafo, luego saltos de línea; oraciones al final).
Agrupa fragmentos transmitidos con `agents.defaults.blockStreamingCoalesce` para reducir
el spam de una sola línea (fusión basada en inactividad antes de enviar). Los canales que no sean Telegram requieren
`*.blockStreaming: true` explícito para habilitar respuestas por bloques.
Los resúmenes detallados de herramientas se emiten al iniciar la herramienta (sin debounce); la interfaz de usuario de Control
transmite la salida de herramientas mediante eventos de agente cuando está disponible.
Más detalles: [Transmisión + fragmentación](/es/concepts/streaming).

## Referencias de modelos

Las referencias de modelos en la configuración (por ejemplo, `agents.defaults.model` y `agents.defaults.models`) se analizan dividiendo por el **primer** `/`.

- Usa `provider/model` al configurar modelos.
- Si el ID del modelo contiene `/` (estilo OpenRouter), incluye el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw intenta primero un alias, luego una coincidencia única de
  proveedor configurado para ese ID exacto de modelo, y solo entonces recurre
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
