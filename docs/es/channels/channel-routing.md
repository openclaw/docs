---
read_when:
    - Cambiar el enrutamiento de canales o el comportamiento de la bandeja de entrada
summary: Reglas de enrutamiento por canal (WhatsApp, Telegram, Discord, Slack) y contexto compartido
title: Enrutamiento de canales
x-i18n:
    generated_at: "2026-04-30T05:27:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43347048fcfd137cc3a0b2cfdc4cf36426fdcf9645f2d1a05ce9cf49688cf0d
    source_path: channels/channel-routing.md
    workflow: 16
---

# Canales y enrutamiento

OpenClaw enruta las respuestas **de vuelta al canal del que provino un mensaje**. El
modelo no elige un canal; el enrutamiento es determinista y está controlado por la
configuración del host.

## Términos clave

- **Canal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, además de canales de plugin. `webchat` es el canal interno de la interfaz de usuario WebChat y no es un canal saliente configurable.
- **AccountId**: instancia de cuenta por canal (cuando se admite).
- Cuenta predeterminada opcional del canal: `channels.<channel>.defaultAccount` elige
  qué cuenta se usa cuando una ruta saliente no especifica `accountId`.
  - En configuraciones con varias cuentas, establece un valor predeterminado explícito (`defaultAccount` o `accounts.default`) cuando hay dos o más cuentas configuradas. Sin él, el enrutamiento de reserva puede elegir el primer ID de cuenta normalizado.
- **AgentId**: un espacio de trabajo aislado + almacén de sesión (“cerebro”).
- **SessionKey**: la clave de depósito usada para almacenar contexto y controlar la concurrencia.

## Formas de clave de sesión (ejemplos)

Los mensajes directos se agrupan en la sesión **main** del agente de forma predeterminada:

- `agent:<agentId>:<mainKey>` (predeterminado: `agent:main:main`)

Incluso cuando el historial de conversación de mensajes directos se comparte con main, la política de sandbox y
herramientas usa una clave de runtime derivada por cuenta para chats directos en DM externos,
de modo que los mensajes originados en canales no se traten como ejecuciones locales de la sesión main.

Los grupos y canales permanecen aislados por canal:

- Grupos: `agent:<agentId>:<channel>:group:<id>`
- Canales/salas: `agent:<agentId>:<channel>:channel:<id>`

Hilos:

- Los hilos de Slack/Discord añaden `:thread:<threadId>` a la clave base.
- Los temas de foro de Telegram incrustan `:topic:<topicId>` en la clave de grupo.

Ejemplos:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Fijación de ruta de DM principal

Cuando `session.dmScope` es `main`, los mensajes directos pueden compartir una sesión main.
Para evitar que el `lastRoute` de la sesión sea sobrescrito por DM que no son del propietario,
OpenClaw infiere un propietario fijado a partir de `allowFrom` cuando todo esto es cierto:

- `allowFrom` tiene exactamente una entrada que no es comodín.
- La entrada se puede normalizar a un ID de remitente concreto para ese canal.
- El remitente del DM entrante no coincide con ese propietario fijado.

En ese caso de discrepancia, OpenClaw sigue registrando los metadatos de sesión entrantes, pero
omite actualizar el `lastRoute` de la sesión main.

## Registro entrante protegido

Los plugins de canal pueden marcar un registro de sesión entrante como `createIfMissing: false`
cuando una ruta protegida no debe crear una nueva sesión de OpenClaw. En ese modo,
OpenClaw puede actualizar metadatos y `lastRoute` para una sesión existente, pero
no crea una entrada de sesión solo de ruta simplemente porque se haya observado un mensaje.

## Reglas de enrutamiento (cómo se elige un agente)

El enrutamiento elige **un agente** para cada mensaje entrante:

1. **Coincidencia exacta de par** (`bindings` con `peer.kind` + `peer.id`).
2. **Coincidencia de par padre** (herencia de hilo).
3. **Coincidencia de servidor + roles** (Discord) mediante `guildId` + `roles`.
4. **Coincidencia de servidor** (Discord) mediante `guildId`.
5. **Coincidencia de equipo** (Slack) mediante `teamId`.
6. **Coincidencia de cuenta** (`accountId` en el canal).
7. **Coincidencia de canal** (cualquier cuenta en ese canal, `accountId: "*"`).
8. **Agente predeterminado** (`agents.list[].default`, o bien la primera entrada de la lista, con reserva a `main`).

Cuando un enlace incluye varios campos de coincidencia (`peer`, `guildId`, `teamId`, `roles`), **todos los campos proporcionados deben coincidir** para que ese enlace se aplique.

El agente coincidente determina qué espacio de trabajo y almacén de sesión se usan.

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

Los almacenes de sesión se encuentran bajo el directorio de estado (predeterminado `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Las transcripciones JSONL se encuentran junto al almacén

Puedes sobrescribir la ruta del almacén mediante `session.store` y plantillas con `{agentId}`.

El descubrimiento de sesiones de Gateway y ACP también escanea los almacenes de agentes respaldados por disco bajo la
raíz predeterminada `agents/` y bajo las raíces con plantilla de `session.store`. Los almacenes
descubiertos deben permanecer dentro de esa raíz de agente resuelta y usar un archivo
`sessions.json` normal. Los enlaces simbólicos y las rutas fuera de la raíz se ignoran.

## Comportamiento de WebChat

WebChat se conecta al **agente seleccionado** y usa de forma predeterminada la sesión main del agente.
Por esto, WebChat te permite ver en un solo lugar el contexto entre canales de ese
agente.

## Contexto de respuesta

Las respuestas entrantes incluyen:

- `ReplyToId`, `ReplyToBody` y `ReplyToSender` cuando están disponibles.
- El contexto citado se añade a `Body` como un bloque `[Replying to ...]`.

Esto es coherente en todos los canales.

## Relacionado

- [Grupos](/es/channels/groups)
- [Grupos de difusión](/es/channels/broadcast-groups)
- [Emparejamiento](/es/channels/pairing)
