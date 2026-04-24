---
read_when:
    - Cambiar el enrutamiento de canales o el comportamiento de la bandeja de entrada
summary: Reglas de enrutamiento por canal (WhatsApp, Telegram, Discord, Slack) y contexto compartido
title: Enrutamiento de canales
x-i18n:
    generated_at: "2026-04-24T05:18:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb87a774bb094af15524702c2c4fd17cf0b41fe27ac0943d1008523a43d5553b
    source_path: channels/channel-routing.md
    workflow: 15
---

# Canales y enrutamiento

OpenClaw enruta las respuestas **de vuelta al canal del que provino un mensaje**. El
modelo no elige un canal; el enrutamiento es determinista y está controlado por la
configuración del host.

## Términos clave

- **Canal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, además de canales de Plugin. `webchat` es el canal interno de la interfaz de WebChat y no es un canal de salida configurable.
- **AccountId**: instancia de cuenta por canal (cuando se admite).
- Cuenta predeterminada opcional del canal: `channels.<channel>.defaultAccount` elige
  qué cuenta se usa cuando una ruta de salida no especifica `accountId`.
  - En configuraciones con varias cuentas, establece un valor predeterminado explícito (`defaultAccount` o `accounts.default`) cuando haya dos o más cuentas configuradas. Sin ello, el enrutamiento de respaldo puede elegir el primer ID de cuenta normalizado.
- **AgentId**: un espacio de trabajo + almacén de sesiones aislados (“cerebro”).
- **SessionKey**: la clave de contenedor usada para almacenar contexto y controlar la concurrencia.

## Formas de clave de sesión (ejemplos)

Los mensajes directos se reducen a la sesión **principal** del agente de forma predeterminada:

- `agent:<agentId>:<mainKey>` (predeterminado: `agent:main:main`)

Incluso cuando el historial de conversación de mensajes directos se comparte con la sesión principal, la política de sandbox y herramientas usa una clave de tiempo de ejecución derivada por cuenta y chat directo para los mensajes directos externos, de modo que los mensajes originados en el canal no se traten como ejecuciones locales de la sesión principal.

Los grupos y canales permanecen aislados por canal:

- Grupos: `agent:<agentId>:<channel>:group:<id>`
- Canales/salas: `agent:<agentId>:<channel>:channel:<id>`

Hilos:

- Los hilos de Slack/Discord agregan `:thread:<threadId>` a la clave base.
- Los temas de foro de Telegram insertan `:topic:<topicId>` en la clave del grupo.

Ejemplos:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Fijación de ruta de mensajes directos principales

Cuando `session.dmScope` es `main`, los mensajes directos pueden compartir una sola sesión principal.
Para evitar que `lastRoute` de la sesión sea sobrescrito por mensajes directos de no propietarios,
OpenClaw infiere un propietario fijado a partir de `allowFrom` cuando se cumplen todas estas condiciones:

- `allowFrom` tiene exactamente una entrada sin comodines.
- La entrada puede normalizarse a un ID de remitente concreto para ese canal.
- El remitente del mensaje directo entrante no coincide con ese propietario fijado.

En ese caso de discrepancia, OpenClaw sigue registrando metadatos de la sesión entrante, pero
omite actualizar `lastRoute` de la sesión principal.

## Reglas de enrutamiento (cómo se elige un agente)

El enrutamiento elige **un agente** para cada mensaje entrante:

1. **Coincidencia exacta de par** (`bindings` con `peer.kind` + `peer.id`).
2. **Coincidencia de par principal** (herencia de hilos).
3. **Coincidencia de servidor + roles** (Discord) mediante `guildId` + `roles`.
4. **Coincidencia de servidor** (Discord) mediante `guildId`.
5. **Coincidencia de equipo** (Slack) mediante `teamId`.
6. **Coincidencia de cuenta** (`accountId` en el canal).
7. **Coincidencia de canal** (cualquier cuenta de ese canal, `accountId: "*"`).
8. **Agente predeterminado** (`agents.list[].default`; en caso contrario, la primera entrada de la lista; con respaldo a `main`).

Cuando un binding incluye varios campos de coincidencia (`peer`, `guildId`, `teamId`, `roles`), **todos los campos proporcionados deben coincidir** para que ese binding se aplique.

El agente coincidente determina qué espacio de trabajo y almacén de sesiones se usan.

## Grupos de difusión (ejecutar varios agentes)

Los grupos de difusión te permiten ejecutar **varios agentes** para el mismo par **cuando OpenClaw normalmente respondería** (por ejemplo: en grupos de WhatsApp, después del filtrado por mención/activación).

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

## Descripción general de la configuración

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

Los almacenes de sesiones se encuentran en el directorio de estado (predeterminado `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Las transcripciones JSONL se guardan junto al almacén

Puedes sobrescribir la ruta del almacén mediante `session.store` y plantillas `{agentId}`.

El descubrimiento de sesiones de Gateway y ACP también explora los almacenes de agentes respaldados en disco bajo la raíz predeterminada `agents/` y bajo las raíces con plantillas de `session.store`. Los almacenes descubiertos deben permanecer dentro de esa raíz de agente resuelta y usar un archivo `sessions.json` normal. Se ignoran los enlaces simbólicos y las rutas fuera de la raíz.

## Comportamiento de WebChat

WebChat se adjunta al **agente seleccionado** y usa de forma predeterminada la
sesión principal del agente. Debido a esto, WebChat te permite ver el contexto entre canales de ese
agente en un solo lugar.

## Contexto de respuesta

Las respuestas entrantes incluyen:

- `ReplyToId`, `ReplyToBody` y `ReplyToSender` cuando están disponibles.
- El contexto citado se agrega a `Body` como un bloque `[Replying to ...]`.

Esto es coherente en todos los canales.

## Relacionado

- [Grupos](/es/channels/groups)
- [Grupos de difusión](/es/channels/broadcast-groups)
- [Vinculación](/es/channels/pairing)
