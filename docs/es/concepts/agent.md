---
read_when:
    - Cambiar el runtime del agente, el arranque del workspace o el comportamiento de la sesión
summary: Runtime del agente, contrato del espacio de trabajo e inicialización de la sesión
title: Tiempo de ejecución del agente
x-i18n:
    generated_at: "2026-06-27T11:10:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fb4d3f0bb6e8aa2a23d00f5def5eb0ffa152bc75f82a12c40ac7ed00776011c
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw ejecuta un **runtime de agente integrado único**: un proceso de agente por
Gateway, con su propio espacio de trabajo, archivos de arranque y almacén de sesiones. Esta página
cubre ese contrato de runtime: qué debe contener el espacio de trabajo, qué archivos se
inyectan y cómo arrancan las sesiones con él.

## Espacio de trabajo (obligatorio)

OpenClaw usa un único directorio de espacio de trabajo del agente (`agents.defaults.workspace`) como el **único** directorio de trabajo (`cwd`) del agente para herramientas y contexto.

Recomendado: usa `openclaw setup` para crear `~/.openclaw/openclaw.json` si falta e inicializar los archivos del espacio de trabajo.

Diseño completo del espacio de trabajo + guía de copias de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)

Si `agents.defaults.sandbox` está habilitado, las sesiones no principales pueden sobrescribir esto con
espacios de trabajo por sesión bajo `agents.defaults.sandbox.workspaceRoot` (consulta
[Configuración de Gateway](/es/gateway/configuration)).

## Archivos de arranque (inyectados)

Dentro de `agents.defaults.workspace`, OpenClaw espera estos archivos editables por el usuario:

- `AGENTS.md` - instrucciones operativas + "memoria"
- `SOUL.md` - persona, límites, tono
- `TOOLS.md` - notas de herramientas mantenidas por el usuario (p. ej., `imsg`, `sag`, convenciones)
- `BOOTSTRAP.md` - ritual único de primera ejecución (eliminado tras completarse)
- `IDENTITY.md` - nombre/estilo/emoji del agente
- `USER.md` - perfil del usuario + forma de tratamiento preferida

En el primer turno de una sesión nueva, OpenClaw inyecta el contenido de estos archivos en el contexto del proyecto del prompt del sistema.

Los archivos en blanco se omiten. Los archivos grandes se recortan y truncan con un marcador para que los prompts se mantengan ligeros (lee el archivo para ver el contenido completo).

Si falta un archivo, OpenClaw inyecta una sola línea de marcador de "archivo faltante" (y `openclaw setup` creará una plantilla predeterminada segura).

`BOOTSTRAP.md` solo se crea para un **espacio de trabajo completamente nuevo** (sin otros archivos de arranque presentes). Mientras esté pendiente, OpenClaw lo mantiene en el contexto del proyecto y añade guía de arranque al prompt del sistema para el ritual inicial, en lugar de copiarlo en el mensaje del usuario. Si lo eliminas después de completar el ritual, no debería recrearse en reinicios posteriores.

Después de que se haya observado un espacio de trabajo, OpenClaw también mantiene un marcador de certificación en el directorio de estado para la ruta del espacio de trabajo. Si un espacio de trabajo certificado recientemente desaparece o se borra, el inicio se niega a resembrar `BOOTSTRAP.md` en silencio; restaura el espacio de trabajo o usa un restablecimiento completo de onboarding para que el espacio de trabajo y el marcador se limpien juntos.

Para deshabilitar por completo la creación de archivos de arranque (para espacios de trabajo presembrados), define:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Herramientas integradas

Las herramientas principales (read/exec/edit/write y herramientas del sistema relacionadas) siempre están disponibles,
sujetas a la política de herramientas. `apply_patch` es opcional y está controlado por
`tools.exec.applyPatch`. `TOOLS.md` **no** controla qué herramientas existen; es
guía sobre cómo _tú_ quieres que se usen.

## Skills

OpenClaw carga Skills desde estas ubicaciones (mayor precedencia primero):

- Espacio de trabajo: `<workspace>/skills`
- Skills de agente del proyecto: `<workspace>/.agents/skills`
- Skills de agente personales: `~/.agents/skills`
- Gestionadas/locales: `~/.openclaw/skills`
- Incluidas (enviadas con la instalación)
- Carpetas de Skills adicionales: `skills.load.extraDirs`

Las raíces de Skills pueden contener carpetas agrupadas como
`<workspace>/skills/personal/foo/SKILL.md`; la Skill sigue exponiéndose por su
nombre plano de frontmatter, por ejemplo `foo`.

Las Skills pueden condicionarse mediante config/env (consulta `skills` en [Configuración de Gateway](/es/gateway/configuration)).

## Límites del runtime

El runtime de agente integrado es propiedad de OpenClaw: el descubrimiento de modelos, el cableado de herramientas,
el ensamblado de prompts, la gestión de sesiones y la entrega a canales comparten una única superficie de
runtime integrada.

## Sesiones

Las transcripciones de sesión se almacenan como JSONL en:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

El ID de sesión es estable y lo elige OpenClaw.
Las carpetas de sesión heredadas de otras herramientas no se leen.

## Dirección durante el streaming

Los prompts entrantes que llegan a mitad de una ejecución se dirigen a la ejecución actual de forma predeterminada.
La dirección se entrega **después de que el turno actual del asistente termine de ejecutar sus
llamadas de herramientas**, antes de la siguiente llamada al LLM, y ya no omite las llamadas de herramientas restantes
del mensaje actual del asistente.

`/queue steer` es el comportamiento predeterminado de ejecución activa. `/queue followup` y
`/queue collect` hacen que los mensajes esperen a un turno posterior en lugar de dirigirlos.
`/queue interrupt` aborta la ejecución activa en su lugar. Consulta [Cola](/es/concepts/queue)
y [Cola de dirección](/es/concepts/queue-steering) para el comportamiento de cola y límites.

El streaming por bloques envía bloques completados del asistente tan pronto como terminan; está
**desactivado de forma predeterminada** (`agents.defaults.blockStreamingDefault: "off"`).
Ajusta el límite mediante `agents.defaults.blockStreamingBreak` (`text_end` frente a `message_end`; el valor predeterminado es text_end).
Controla la fragmentación suave de bloques con `agents.defaults.blockStreamingChunk` (valor predeterminado:
800-1200 caracteres; prefiere saltos de párrafo, luego líneas nuevas; las oraciones al final).
Combina fragmentos transmitidos con `agents.defaults.blockStreamingCoalesce` para reducir
el spam de una sola línea (fusión basada en inactividad antes del envío). Los canales que no son Telegram requieren
`*.blockStreaming: true` explícito para habilitar respuestas por bloques.
Los resúmenes detallados de herramientas se emiten al iniciar la herramienta (sin debounce); Control UI
transmite la salida de herramientas mediante eventos del agente cuando están disponibles.
Más detalles: [Streaming + fragmentación](/es/concepts/streaming).

## Referencias de modelo

Las referencias de modelo en la configuración (por ejemplo `agents.defaults.model` y `agents.defaults.models`) se analizan dividiendo por el **primer** `/`.

- Usa `provider/model` al configurar modelos.
- Si el ID del modelo en sí contiene `/` (estilo OpenRouter), incluye el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw intenta primero un alias, luego una coincidencia única de proveedor configurado para ese ID de modelo exacto, y solo después recurre al proveedor predeterminado configurado. Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de proveedor eliminado.

## Configuración (mínima)

Como mínimo, define:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (muy recomendado)

---

_Siguiente: [Chats grupales](/es/channels/group-messages)_ 🦞

## Relacionado

- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Gestión de sesiones](/es/concepts/session)
