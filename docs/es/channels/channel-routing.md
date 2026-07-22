---
read_when:
    - Cambiar el enrutamiento de canales o el comportamiento de la bandeja de entrada
summary: Reglas de enrutamiento por canal (WhatsApp, Telegram, Discord, Slack) y contexto compartido
title: Enrutamiento de canales
x-i18n:
    generated_at: "2026-07-22T10:25:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa03f04a55015bf17e0fe1f3a9bc422875124bb64af5891c898a98bc6917d9e8
    source_path: channels/channel-routing.md
    workflow: 16
---

# Canales y enrutamiento

OpenClaw enruta las respuestas **de vuelta al canal del que provino el mensaje**. El
modelo no elige un canal; el enrutamiento es determinista y está controlado por la
configuración del host. Con el ámbito predeterminado de mensajes directos, los mensajes directos de todos los
canales convergen en la [sesión principal](/es/concepts/main-session) del agente.

## Términos clave

- **Canal**: un plugin de canal incluido, como `discord`, `googlechat`, `imessage`, `irc`, `line`, `signal`, `slack`, `telegram` o `whatsapp`, además de los canales de plugins instalados. `webchat` es el canal interno de la interfaz WebChat y no es un canal de salida configurable.
- **AccountId**: instancia de cuenta por canal (cuando se admite).
- Cuenta predeterminada opcional del canal: `channels.<channel>.defaultAccount` elige
  qué cuenta se utiliza cuando una ruta de salida no especifica `accountId`.
  - En configuraciones con varias cuentas, establezca un valor predeterminado explícito (`defaultAccount` o una cuenta denominada `default`) cuando haya dos o más cuentas configuradas. Sin él, el enrutamiento alternativo puede elegir el primer ID de cuenta normalizado.
- **AgentId**: un espacio de trabajo y almacén de sesiones aislados («cerebro»).
- **SessionKey**: la clave del contenedor utilizada para almacenar el contexto y controlar la concurrencia.

## Prefijos de destinos de salida

Los destinos de salida explícitos pueden incluir un prefijo de proveedor, como `telegram:123` o `tg:123`. El núcleo trata ese prefijo como una indicación para seleccionar el canal solo cuando el canal seleccionado es `last` o no está resuelto, y solo cuando el plugin cargado anuncia ese prefijo. Si el autor de la llamada ya seleccionó un canal explícito, el prefijo del proveedor debe coincidir con ese canal; las combinaciones entre canales, como la entrega de WhatsApp a `telegram:123`, fallan antes de la normalización del destino específica del plugin.

Los prefijos de tipo de destino y servicio, como `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` y `sms:<number>`, permanecen dentro de la gramática del canal seleccionado. No seleccionan por sí solos al proveedor.

## Formatos de claves de sesión (ejemplos)

De forma predeterminada, los mensajes directos se agrupan en la sesión **principal** del agente:

- `agent:<agentId>:<mainKey>` (predeterminado: `agent:main:main`)

`session.dmScope` controla la agrupación de mensajes directos: `main` (predeterminado) comparte una única sesión
principal, mientras que `per-peer`, `per-channel-peer` y `per-account-channel-peer`
mantienen los mensajes directos en sesiones separadas. Una vinculación de ruta puede anular el ámbito para los
pares con los que coincida mediante `bindings[].session.dmScope`.

Aunque el historial de conversaciones de mensajes directos se comparta con la sesión principal, las políticas de
entorno aislado y herramientas utilizan una clave de ejecución derivada por cuenta para el chat directo en los mensajes directos
externos, de modo que los mensajes originados en canales no se traten como ejecuciones locales de la sesión principal.

Los grupos y canales permanecen aislados por canal:

- Grupos: `agent:<agentId>:<channel>:group:<id>`
- Canales/salas: `agent:<agentId>:<channel>:channel:<id>`

Hilos:

- Los hilos de Slack/Discord añaden `:thread:<threadId>` a la clave base.
- Los temas de foros de Telegram incorporan `:topic:<topicId>` en la clave del grupo.

Ejemplos:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Fijación de rutas de mensajes directos principales

Cuando `session.dmScope` es `main`, los mensajes directos pueden compartir una única sesión principal.
Para evitar que los mensajes directos de usuarios que no son el propietario sobrescriban el valor `lastRoute` de la sesión,
OpenClaw infiere un propietario fijo a partir de `allowFrom` cuando se cumplen todas estas condiciones:

- `allowFrom` tiene exactamente una entrada sin comodines.
- La entrada se puede normalizar como un ID de remitente concreto para ese canal.
- El remitente del mensaje directo entrante no coincide con ese propietario fijo.

En ese caso de discrepancia, OpenClaw sigue registrando los metadatos de la sesión entrante, pero
omite la actualización del valor `lastRoute` de la sesión principal.

## Registro entrante protegido

Los plugins de canal pueden marcar un registro de sesión entrante como `createIfMissing: false`
cuando una ruta protegida no debe crear una nueva sesión de OpenClaw. En ese modo,
OpenClaw puede actualizar los metadatos y `lastRoute` de una sesión existente, pero
no crea una entrada de sesión exclusiva para la ruta solo porque se haya observado un mensaje.

## Reglas de enrutamiento (cómo se elige un agente)

El enrutamiento elige **un agente** para cada mensaje entrante:

1. **Coincidencia exacta de par** (`bindings` con `peer.kind` + `peer.id`).
2. **Coincidencia del par principal** (herencia de hilos).
3. **Coincidencia de par mediante comodín** (`peer.id: "*"` para un tipo de par).
4. **Coincidencia de gremio y roles** (Discord) mediante `guildId` + `roles`.
5. **Coincidencia de gremio** (Discord) mediante `guildId`.
6. **Coincidencia de equipo** (Slack) mediante `teamId`.
7. **Coincidencia de cuenta** (`accountId` en el canal).
8. **Coincidencia de canal** (cualquier cuenta de ese canal, `accountId: "*"`).
9. **Agente predeterminado** (`agents.entries.*.default`; de lo contrario, la primera entrada de la lista, con `main` como alternativa).

Cuando una vinculación incluye varios campos de coincidencia (`peer`, `guildId`, `teamId`, `roles`), **todos los campos proporcionados deben coincidir** para que se aplique esa vinculación.

El agente coincidente determina qué espacio de trabajo y almacén de sesiones se utilizan.

## Grupos de difusión (ejecutar varios agentes)

Los grupos de difusión permiten ejecutar **varios agentes** para el mismo par **cuando OpenClaw respondería normalmente** (por ejemplo, en grupos de WhatsApp, después del control de menciones/activación).

Configuración:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Consulte: [Grupos de difusión](/es/channels/broadcast-groups).

## Descripción general de la configuración

- `agents.entries`: definiciones de agentes con nombre (espacio de trabajo, modelo, etc.).
- `bindings`: asigna canales, cuentas y pares entrantes a agentes.

Ejemplo:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Almacenamiento de sesiones

Las filas de sesiones en tiempo de ejecución se almacenan en la base de datos SQLite de cada agente, dentro del
directorio de estado (valor predeterminado: `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

Las instalaciones anteriores pueden tener archivos JSONL de transcripciones heredados y un almacén
de filas `sessions.json` en `~/.openclaw/agents/<agentId>/sessions/`. El inicio del Gateway y
`openclaw doctor --fix` importan automáticamente a SQLite las filas y el historial heredados activos.
Utilice `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` y la secuencia de validación de
[Doctor](/es/cli/doctor#session-sqlite-migration) cuando necesite evidencia explícita de la migración.
Aún se puede seleccionar una ruta de almacén heredada mediante las plantillas `session.store` y `{agentId}`
para flujos de trabajo de migración y mantenimiento sin conexión.

El descubrimiento de sesiones del Gateway y ACP también examina los almacenes de agentes respaldados por disco bajo la
raíz predeterminada `agents/` y bajo las raíces de plantilla `session.store`. Los almacenes
descubiertos deben permanecer dentro de esa raíz de agente resuelta y utilizar un archivo heredado
`sessions.json` normal. Se omiten los enlaces simbólicos y las rutas externas a la raíz.

## Comportamiento de WebChat

WebChat se conecta al **agente seleccionado** y utiliza de forma predeterminada la sesión principal
del agente. Por ello, WebChat permite ver en un único lugar el contexto de ese
agente procedente de distintos canales.

## Contexto de respuesta

Las respuestas entrantes incluyen:

- `ReplyToId`, `ReplyToBody` y `ReplyToSender` cuando están disponibles.
- El contexto citado se añade a `Body` como un bloque `[Replying to ...]`.

Este comportamiento es uniforme en todos los canales.

## Temas relacionados

- [Grupos](/es/channels/groups)
- [Grupos de difusión](/es/channels/broadcast-groups)
- [Vinculación](/es/channels/pairing)
