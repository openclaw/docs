---
read_when:
    - Cambiar el runtime del agente, el arranque del espacio de trabajo o el comportamiento de la sesión
summary: Ejecución del agente, contrato del espacio de trabajo e inicialización de sesión
title: Tiempo de ejecución del agente
x-i18n:
    generated_at: "2026-07-05T11:11:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9c2468239d94e393246af28a38b1db602a5d665f0fb43e80def19acb5985093f
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw incluye un **runtime de agente integrado**: un bucle de agente incorporado, integración de herramientas y ensamblaje de prompts, distinto de delegar turnos a un proceso de harness externo. Cada agente configurado (consulta [Enrutamiento multiagente](/es/concepts/multi-agent) para ejecutar varios) tiene su propio espacio de trabajo, archivos de arranque y almacén de sesiones. Esta página cubre ese contrato de runtime: qué debe contener el espacio de trabajo, qué archivos se inyectan y cómo las sesiones arrancan con él.

## Espacio de trabajo (obligatorio)

Cada agente usa un único directorio de espacio de trabajo (`agents.defaults.workspace`, o `agents.list[].workspace` por agente) como su **único** directorio de trabajo (`cwd`) para herramientas y contexto.

Recomendado: usa `openclaw setup` para crear `~/.openclaw/openclaw.json` si falta e inicializar los archivos del espacio de trabajo.

Diseño completo del espacio de trabajo + guía de copias de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)

Si `agents.defaults.sandbox` está habilitado, las sesiones que no sean principales pueden sobrescribir esto con espacios de trabajo por sesión bajo `agents.defaults.sandbox.workspaceRoot` (consulta [Configuración de Gateway](/es/gateway/configuration)).

## Archivos de arranque (inyectados)

Dentro del espacio de trabajo, OpenClaw espera estos archivos editables por el usuario:

| Archivo        | Propósito                                            |
| -------------- | ---------------------------------------------------- |
| `AGENTS.md`    | Instrucciones operativas + "memoria"                 |
| `SOUL.md`      | Persona, límites, tono                               |
| `TOOLS.md`     | Notas y convenciones de herramientas mantenidas por el usuario |
| `IDENTITY.md`  | Nombre/vibra/emoji del agente                        |
| `USER.md`      | Perfil del usuario + forma de tratamiento preferida  |
| `HEARTBEAT.md` | Instrucciones específicas de Heartbeat               |
| `BOOTSTRAP.md` | Ritual único de primera ejecución (se elimina tras completarlo) |
| `MEMORY.md`    | Archivo raíz de memoria a largo plazo, si existe     |

En el primer turno de una sesión nueva, OpenClaw inyecta el contenido de estos archivos en el Contexto del proyecto del prompt del sistema. `MEMORY.md` solo se inyecta cuando existe en la raíz del espacio de trabajo.

Los archivos en blanco se omiten. Los archivos grandes se recortan y truncan con un marcador para que los prompts se mantengan ligeros (lee el archivo para ver el contenido completo). Si falta un archivo (excepto `MEMORY.md`), se inyecta en su lugar una única línea de marcador de "archivo faltante"; `openclaw setup` crea una plantilla predeterminada segura para él.

`BOOTSTRAP.md` solo se crea para un **espacio de trabajo completamente nuevo** (sin otros archivos de arranque presentes). Mientras está pendiente, OpenClaw lo mantiene en el Contexto del proyecto y añade guía de arranque al prompt del sistema para el ritual inicial en lugar de copiarlo en el mensaje del usuario. Si lo eliminas después de completar el ritual, no se vuelve a crear en reinicios posteriores.

Después de que se ha observado un espacio de trabajo, OpenClaw también mantiene un marcador de atestación en el directorio de estado para la ruta del espacio de trabajo. Si un espacio de trabajo atestiguado recientemente desaparece o se borra, el inicio se niega a volver a sembrar `BOOTSTRAP.md` silenciosamente; restaura el espacio de trabajo o usa un restablecimiento completo de onboarding para que el espacio de trabajo y el marcador se limpien juntos.

Para deshabilitar por completo la creación de archivos de arranque (para espacios de trabajo presembrados), configura:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Herramientas integradas

Las herramientas principales (lectura/ejecución/edición/escritura y herramientas de sistema relacionadas) siempre están disponibles, sujetas a la política de herramientas. `apply_patch` está activada de forma predeterminada para modelos de OpenAI y controlada por `tools.exec.applyPatch` (`enabled`, `workspaceOnly`, `allowModels`). `TOOLS.md` **no** controla qué herramientas existen; es una guía sobre cómo quieres que se usen.

## Skills

OpenClaw carga Skills desde estas ubicaciones (mayor precedencia primero):

- Espacio de trabajo: `<workspace>/skills`
- Skills de agente del proyecto: `<workspace>/.agents/skills`
- Skills de agente personales: `~/.agents/skills`
- Gestionadas/locales: `~/.openclaw/skills`
- Incluidas (enviadas con la instalación)
- Carpetas de Skills adicionales: `skills.load.extraDirs`

Las raíces de Skills pueden contener carpetas agrupadas como `<workspace>/skills/personal/foo/SKILL.md`; la Skill sigue exponiéndose por su nombre plano de frontmatter, por ejemplo `foo`.

Las Skills pueden controlarse mediante config/env (consulta `skills` en [Configuración de Gateway](/es/gateway/configuration)).

## Límites del runtime

El runtime de agente integrado es propiedad de OpenClaw: el descubrimiento de modelos, la integración de herramientas, el ensamblaje de prompts, la gestión de sesiones y la entrega por canal comparten una superficie de runtime integrada.

## Sesiones

Las transcripciones de sesiones se almacenan como JSONL en:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

El ID de sesión es estable y lo elige OpenClaw. OpenClaw no lee carpetas de sesiones de otras herramientas.

## Direccionamiento durante streaming

Los prompts entrantes que llegan a mitad de ejecución se dirigen al proceso actual de forma predeterminada. El direccionamiento se entrega **después de que el turno actual del asistente termina de ejecutar sus llamadas a herramientas**, antes de la siguiente llamada al LLM, y ya no omite las llamadas a herramientas restantes del mensaje actual del asistente.

`/queue steer` es el comportamiento predeterminado de una ejecución activa. `/queue followup` y `/queue collect` hacen que los mensajes esperen a un turno posterior en lugar de direccionarse. `/queue interrupt` aborta la ejecución activa en su lugar. Consulta [Cola](/es/concepts/queue) y [Cola de direccionamiento](/es/concepts/queue-steering) para el comportamiento de colas y límites.

El streaming por bloques envía bloques completados del asistente en cuanto terminan; está **desactivado de forma predeterminada** (`agents.defaults.blockStreamingDefault: "off"`). Ajusta el límite mediante `agents.defaults.blockStreamingBreak` (`text_end` frente a `message_end`; el valor predeterminado es `text_end`). Controla la fragmentación suave de bloques con `agents.defaults.blockStreamingChunk` (valor predeterminado de 800-1200 caracteres; prefiere cortes de párrafo, luego saltos de línea; las oraciones al final). Combina fragmentos transmitidos con `agents.defaults.blockStreamingCoalesce` para reducir el spam de líneas individuales (fusión basada en inactividad antes de enviar). Los canales que no sean Telegram requieren `*.blockStreaming: true` explícito para habilitar respuestas por bloques. Los resúmenes detallados de herramientas se emiten al inicio de la herramienta (sin debounce); Control UI transmite la salida de herramientas mediante eventos de agente cuando están disponibles. Más detalles: [Streaming + fragmentación](/es/concepts/streaming).

## Referencias de modelos

Las referencias de modelos en la configuración (por ejemplo `agents.defaults.model` y `agents.defaults.models`) se analizan dividiendo por el **primer** `/`.

- Usa `provider/model` al configurar modelos.
- Si el ID del modelo contiene `/` (estilo OpenRouter), incluye el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw prueba primero un alias, luego una coincidencia única de proveedor configurado para ese ID de modelo exacto, y solo después recurre al proveedor predeterminado configurado. Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado.

## Configuración (mínima)

Como mínimo, configura:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (muy recomendado)

## Relacionado

- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Gestión de sesiones](/es/concepts/session)
- [Chats grupales](/es/channels/group-messages)
