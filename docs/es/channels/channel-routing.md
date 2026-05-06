---
read_when:
    - Cambiar el enrutamiento de canales o el comportamiento de la bandeja de entrada
summary: Reglas de enrutamiento por canal (WhatsApp, Telegram, Discord, Slack) y contexto compartido
title: Enrutamiento de canales
x-i18n:
    generated_at: "2026-05-06T05:26:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92b14cf02b00312121bec2f0f8ec784f36364babd6085d684e71f425dd82715e
    source_path: channels/channel-routing.md
    workflow: 16
---

# Canales y enrutamiento

OpenClaw enruta las respuestas **de vuelta al canal del que provino el mensaje**. El
modelo no elige un canal; el enrutamiento es determinista y está controlado por la
configuración del host.

## Términos clave

- **Canal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, además de canales de Plugin. `webchat` es el canal interno de la interfaz de usuario WebChat y no es un canal saliente configurable.
- **AccountId**: instancia de cuenta por canal (cuando se admite).
- Cuenta predeterminada opcional del canal: `channels.<channel>.defaultAccount` elige
  qué cuenta se usa cuando una ruta saliente no especifica `accountId`.
  - En configuraciones con varias cuentas, establece un valor predeterminado explícito (`defaultAccount` o `accounts.default`) cuando hay dos o más cuentas configuradas. Sin él, el enrutamiento de respaldo puede elegir el primer ID de cuenta normalizado.
- **AgentId**: un espacio de trabajo aislado + almacén de sesiones ("cerebro").
- **SessionKey**: la clave de contenedor usada para almacenar contexto y controlar la concurrencia.

## Prefijos de destino saliente

Los destinos salientes explícitos pueden incluir un prefijo de proveedor, como `telegram:123` o `tg:123`. El núcleo trata ese prefijo como una sugerencia de selección de canal solo cuando el canal seleccionado es `last` o aún no está resuelto, y solo cuando el Plugin cargado anuncia ese prefijo. Si el llamador ya seleccionó un canal explícito, el prefijo de proveedor debe coincidir con ese canal; las combinaciones entre canales, como la entrega de WhatsApp a `telegram:123`, fallan antes de la normalización de destino específica del Plugin.

Los prefijos de tipo de destino y de servicio, como `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` y `sms:<number>`, permanecen dentro de la gramática del canal seleccionado. No seleccionan el proveedor por sí mismos.

## Formas de clave de sesión (ejemplos)

Los mensajes directos se agrupan en la sesión **principal** del agente de forma predeterminada:

- `agent:<agentId>:<mainKey>` (predeterminado: `agent:main:main`)

Incluso cuando el historial de conversación de mensajes directos se comparte con la sesión principal, la política de sandbox y
herramientas usa una clave de ejecución de chat directo por cuenta derivada para los MD externos,
de modo que los mensajes originados en canales no se traten como ejecuciones de sesión principal local.

Los grupos y canales permanecen aislados por canal:

- Grupos: `agent:<agentId>:<channel>:group:<id>`
- Canales/salas: `agent:<agentId>:<channel>:channel:<id>`

Hilos:

- Los hilos de Slack/Discord agregan `:thread:<threadId>` a la clave base.
- Los temas de foro de Telegram incorporan `:topic:<topicId>` en la clave del grupo.

Ejemplos:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Fijación de ruta de MD principal

Cuando `session.dmScope` es `main`, los mensajes directos pueden compartir una sesión principal.
Para evitar que el `lastRoute` de la sesión sea sobrescrito por MD que no pertenecen al propietario,
OpenClaw infiere un propietario fijado a partir de `allowFrom` cuando todo lo siguiente es verdadero:

- `allowFrom` tiene exactamente una entrada que no es comodín.
- La entrada se puede normalizar a un ID de remitente concreto para ese canal.
- El remitente del MD entrante no coincide con ese propietario fijado.

En ese caso de discrepancia, OpenClaw sigue registrando metadatos de sesión entrante, pero
omite actualizar el `lastRoute` de la sesión principal.

## Registro entrante protegido

Los Plugins de canal pueden marcar un registro de sesión entrante como `createIfMissing: false`
cuando una ruta protegida no debe crear una nueva sesión de OpenClaw. En ese modo,
OpenClaw puede actualizar metadatos y `lastRoute` para una sesión existente, pero
no crea una entrada de sesión solo de ruta simplemente porque se observó un mensaje.

## Reglas de enrutamiento (cómo se elige un agente)

El enrutamiento elige **un agente** para cada mensaje entrante:

1. **Coincidencia exacta de par** (`bindings` con `peer.kind` + `peer.id`).
2. **Coincidencia de par padre** (herencia de hilo).
3. **Coincidencia de gremio + roles** (Discord) mediante `guildId` + `roles`.
4. **Coincidencia de gremio** (Discord) mediante `guildId`.
5. **Coincidencia de equipo** (Slack) mediante `teamId`.
6. **Coincidencia de cuenta** (`accountId` en el canal).
7. **Coincidencia de canal** (cualquier cuenta en ese canal, `accountId: "*"`).
8. **Agente predeterminado** (`agents.list[].default`, o la primera entrada de la lista, con respaldo a `main`).

Cuando un binding incluye varios campos de coincidencia (`peer`, `guildId`, `teamId`, `roles`), **todos los campos proporcionados deben coincidir** para que ese binding se aplique.

El agente coincidente determina qué espacio de trabajo y almacén de sesiones se usan.

## Grupos de difusión (ejecutar varios agentes)

Los grupos de difusión te permiten ejecutar **varios agentes** para el mismo par **cuando OpenClaw respondería normalmente** (por ejemplo: en grupos de WhatsApp, después del filtrado por mención/activación).

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

Consulta: [Grupos de difusión](/es/channels/broadcast-groups).

## Resumen de configuración

- `agents.list`: definiciones de agentes con nombre (espacio de trabajo, modelo, etc.).
- `bindings`: asigna canales/cuentas/pares entrantes a agentes.

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

Los almacenes de sesiones viven bajo el directorio de estado (predeterminado `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Las transcripciones JSONL viven junto al almacén

Puedes anular la ruta del almacén mediante `session.store` y plantillas de `{agentId}`.

El descubrimiento de sesiones de Gateway y ACP también analiza almacenes de agentes respaldados por disco bajo la
raíz predeterminada `agents/` y bajo raíces de `session.store` con plantillas. Los almacenes
descubiertos deben permanecer dentro de esa raíz de agente resuelta y usar un archivo
`sessions.json` regular. Los enlaces simbólicos y las rutas fuera de la raíz se ignoran.

## Comportamiento de WebChat

WebChat se adjunta al **agente seleccionado** y usa de forma predeterminada la sesión principal
del agente. Debido a esto, WebChat te permite ver el contexto entre canales de ese
agente en un solo lugar.

## Contexto de respuesta

Las respuestas entrantes incluyen:

- `ReplyToId`, `ReplyToBody` y `ReplyToSender` cuando están disponibles.
- El contexto citado se agrega a `Body` como un bloque `[Replying to ...]`.

Esto es coherente en todos los canales.

## Relacionado

- [Grupos](/es/channels/groups)
- [Grupos de difusión](/es/channels/broadcast-groups)
- [Emparejamiento](/es/channels/pairing)
