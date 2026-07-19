---
read_when:
    - Cambiar el entorno de ejecución del agente, la inicialización del espacio de trabajo o el comportamiento de la sesión
summary: Entorno de ejecución del agente, contrato del espacio de trabajo e inicialización de la sesión
title: Entorno de ejecución del agente
x-i18n:
    generated_at: "2026-07-19T01:55:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 731de7000f261180483570f6eb597f9284ab774ebdeffd5f23019a9431e8750e
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw incluye un **entorno de ejecución de agente integrado**: un bucle de agente incorporado, la conexión de herramientas y el ensamblaje de prompts, distinto de delegar turnos a un proceso de arnés externo. Cada agente configurado (consulte [Enrutamiento multiagente](/es/concepts/multi-agent) para ejecutar varios) tiene su propio espacio de trabajo, archivos de arranque y almacén de sesiones. Esta página abarca el contrato de ese entorno de ejecución: qué debe contener el espacio de trabajo, qué archivos se inyectan y cómo se inicializan las sesiones con él.

## Espacio de trabajo (obligatorio)

Cada agente utiliza un único directorio de espacio de trabajo (`agents.defaults.workspace`, o
`agents.list[].workspace` por agente) como su **único** directorio de trabajo (`cwd`)
para las herramientas y el contexto.

Recomendación: utilice `openclaw setup` para crear `~/.openclaw/openclaw.json` si no existe e inicializar los archivos del espacio de trabajo.

Diseño completo del espacio de trabajo y guía de copias de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)

Si `agents.defaults.sandbox` está habilitado, las sesiones no principales pueden sustituirlo por espacios de trabajo por sesión en `agents.defaults.sandbox.workspaceRoot` (consulte
[Configuración del Gateway](/es/gateway/configuration)).

## Archivos de arranque (inyectados)

Dentro del espacio de trabajo, OpenClaw espera estos archivos editables por el usuario:

| Archivo           | Propósito                                              |
| -------------- | ---------------------------------------------------- |
| `AGENTS.md`    | Instrucciones de funcionamiento + «memoria»                    |
| `SOUL.md`      | Personalidad, límites, tono                            |
| `TOOLS.md`     | Notas y convenciones sobre herramientas mantenidas por el usuario           |
| `IDENTITY.md`  | Nombre/estilo/emoji del agente                                |
| `USER.md`      | Perfil de usuario + tratamiento preferido                     |
| `HEARTBEAT.md` | Instrucciones específicas de Heartbeat                      |
| `BOOTSTRAP.md` | Ritual único de la primera ejecución (se elimina al completarlo) |
| `MEMORY.md`    | Archivo raíz de memoria a largo plazo, si existe               |

En el primer turno de una sesión nueva, OpenClaw inyecta el contenido de estos archivos en el contexto del proyecto del prompt del sistema. `MEMORY.md` solo se inyecta cuando existe en la raíz del espacio de trabajo.

Los archivos vacíos se omiten. Los archivos grandes se recortan y truncan con un marcador para mantener los prompts concisos (lea el archivo para ver el contenido completo). Si falta un archivo (excepto `MEMORY.md`), se inyecta en su lugar una única línea de marcador de «archivo ausente»; `openclaw setup` crea una plantilla predeterminada segura para él.

`BOOTSTRAP.md` solo se crea para un **espacio de trabajo completamente nuevo** (sin ningún otro archivo de arranque). Mientras esté pendiente, OpenClaw lo mantiene en el contexto del proyecto y añade al prompt del sistema indicaciones de arranque para el ritual inicial, en lugar de copiarlo en el mensaje del usuario. Si se elimina después de completar el ritual, no se vuelve a crear en reinicios posteriores.

Después de que se haya detectado un espacio de trabajo, OpenClaw almacena su estado de configuración y su certificación en la base de datos SQLite compartida en
`~/.openclaw/state/openclaw.sqlite`. Si un espacio de trabajo certificado recientemente desaparece o se borra, el inicio se niega a volver a inicializar silenciosamente `BOOTSTRAP.md`; restaure el espacio de trabajo o utilice un restablecimiento completo de la incorporación para que el espacio de trabajo y el estado de su base de datos se borren conjuntamente.

Las versiones anteriores utilizaban archivos JSON del espacio de trabajo y archivos auxiliares `.attested`. El entorno de ejecución no lee esos archivos. Ejecute `openclaw doctor --fix` para validarlos, importar su estado en SQLite y eliminar cada origen después de verificar las filas importadas.

Para deshabilitar por completo la creación de archivos de arranque (para espacios de trabajo preinicializados), establezca:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Herramientas integradas

Las herramientas principales (lectura/ejecución/edición/escritura y las herramientas de sistema relacionadas) están siempre disponibles, sujetas a la política de herramientas. `apply_patch` está habilitado de forma predeterminada para los modelos de OpenAI y controlado por `tools.exec.applyPatch` (`enabled`, `workspaceOnly`, `allowModels`). `TOOLS.md` **no** controla qué herramientas existen; sirve como guía para indicar cómo desea que se utilicen.

## Skills

OpenClaw carga Skills desde estas ubicaciones (primero las de mayor precedencia):

- Espacio de trabajo: `<workspace>/skills`
- Skills del agente del proyecto: `<workspace>/.agents/skills`
- Skills personales del agente: `~/.agents/skills`
- Gestionadas/locales: `~/.openclaw/skills`
- Incluidas (distribuidas con la instalación)
- Carpetas adicionales de Skills: `skills.load.extraDirs`

Las raíces de Skills pueden contener carpetas agrupadas como
`<workspace>/skills/personal/foo/SKILL.md`; la Skill sigue exponiéndose mediante el nombre plano de su frontmatter, por ejemplo `foo`.

Las Skills pueden estar condicionadas por la configuración o las variables de entorno (consulte `skills` en [Configuración del Gateway](/es/gateway/configuration)).

## Límites del entorno de ejecución

El entorno de ejecución de agente integrado pertenece a OpenClaw: el descubrimiento de modelos, la conexión de herramientas, el ensamblaje de prompts, la gestión de sesiones y la entrega por canales comparten una única superficie de ejecución integrada.

## Sesiones

Las filas de sesiones se almacenan en la base de datos SQLite de cada agente:

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

Los archivos de transcripción JSONL aún pueden residir en
`~/.openclaw/agents/<agentId>/sessions/` como entradas de migración heredadas, archivos eliminados o restablecidos, importaciones, exportaciones y artefactos de soporte. El historial activo del agente se almacena en SQLite junto con las filas de sesiones. El ID de sesión es estable y lo elige OpenClaw. OpenClaw no lee carpetas de sesiones de otras herramientas.

## Redirección durante la transmisión

Los prompts entrantes que llegan durante una ejecución se redirigen de forma predeterminada a la ejecución actual. La redirección se entrega **después de que el turno actual del asistente termine de ejecutar sus llamadas a herramientas**, antes de la siguiente llamada al LLM, y ya no omite las llamadas a herramientas restantes del mensaje actual del asistente.

`/queue steer` es el comportamiento predeterminado durante una ejecución activa. `/queue followup` y
`/queue collect` hacen que los mensajes esperen hasta un turno posterior en lugar de redirigirlos.
`/queue interrupt` cancela en su lugar la ejecución activa. Consulte [Cola](/es/concepts/queue)
y [Cola de redirección](/es/concepts/queue-steering) para conocer el comportamiento de las colas y los límites.

La transmisión por bloques envía los bloques completados del asistente en cuanto terminan; está
**deshabilitada de forma predeterminada** (`agents.defaults.blockStreamingDefault: "off"`).
Ajuste el límite mediante `agents.defaults.blockStreamingBreak` (`text_end` frente a `message_end`; el valor predeterminado es `text_end`).
Controle la división flexible en bloques con `agents.defaults.blockStreamingChunk` (el valor predeterminado es de
800-1200 caracteres; prioriza los saltos de párrafo, después los saltos de línea y, por último, las oraciones).
Combine los fragmentos transmitidos con `agents.defaults.blockStreamingCoalesce` para reducir
la saturación de líneas individuales (combinación basada en la inactividad antes del envío). Los canales distintos de Telegram requieren
`*.streaming.block.enabled: true` explícito para habilitar las respuestas por bloques (QQ Bot
transmite en cambio las respuestas por bloques, salvo que `channels.qqbot.streaming.mode` sea `"off"`).
Los resúmenes detallados de herramientas se emiten al iniciar la herramienta (sin antirrebote); la interfaz de control
transmite la salida de las herramientas mediante eventos del agente cuando están disponibles.
Más información: [Transmisión y división en fragmentos](/es/concepts/streaming).

## Referencias de modelos

Las referencias de modelos en la configuración (por ejemplo, `agents.defaults.model` y `agents.defaults.models`) se analizan dividiéndolas por el **primer** `/`.

- Utilice `provider/model` al configurar modelos.
- Si el ID del modelo contiene `/` (al estilo de OpenRouter), incluya el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si se omite el proveedor, OpenClaw prueba primero un alias, después una coincidencia única de proveedor configurado para ese ID de modelo exacto y, solo entonces, recurre al proveedor predeterminado configurado. Si ese proveedor deja de ofrecer el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado.

## Configuración (mínima)

Como mínimo, establezca:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (muy recomendado)

## Contenido relacionado

- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Gestión de sesiones](/es/concepts/session)
- [Chats grupales](/es/channels/group-messages)
