---
read_when:
    - Cambiar el enrutamiento de canales o el comportamiento de la bandeja de entrada
summary: Reglas de enrutamiento por canal (WhatsApp, Telegram, Discord, Slack) y contexto compartido
title: Enrutamiento de canales
x-i18n:
    generated_at: "2026-07-05T11:01:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ffd204de57a3ff991953a7907d86b1a93f8af14a71ee410e9dcc36336f49d3f
    source_path: channels/channel-routing.md
    workflow: 16
---

# Canales y enrutamiento

OpenClaw enruta las respuestas **de vuelta al canal del que provino el mensaje**. El
modelo no elige un canal; el enrutamiento es determinista y lo controla la
configuración del host.

## Términos clave

- **Canal**: un plugin de canal incluido, como `discord`, `googlechat`, `imessage`, `irc`, `line`, `signal`, `slack`, `telegram` o `whatsapp`, además de los canales de plugins instalados. `webchat` es el canal interno de la interfaz de WebChat y no es un canal saliente configurable.
- **AccountId**: instancia de cuenta por canal (cuando se admite).
- Cuenta predeterminada de canal opcional: `channels.<channel>.defaultAccount` elige
  qué cuenta se usa cuando una ruta saliente no especifica `accountId`.
  - En configuraciones con varias cuentas, define una opción predeterminada explícita (`defaultAccount` o una cuenta llamada `default`) cuando haya dos o más cuentas configuradas. Sin ella, el enrutamiento de respaldo puede elegir el primer ID de cuenta normalizado.
- **AgentId**: un espacio de trabajo aislado + almacén de sesiones ("cerebro").
- **SessionKey**: la clave de depósito que se usa para almacenar el contexto y controlar la concurrencia.

## Prefijos de destino saliente

Los destinos salientes explícitos pueden incluir un prefijo de proveedor, como `telegram:123` o `tg:123`. El núcleo trata ese prefijo como una pista de selección de canal solo cuando el canal seleccionado es `last` o no está resuelto de otro modo, y solo cuando el plugin cargado anuncia ese prefijo. Si el llamador ya seleccionó un canal explícito, el prefijo del proveedor debe coincidir con ese canal; las combinaciones entre canales, como la entrega de WhatsApp a `telegram:123`, fallan antes de la normalización de destino específica del plugin.

Los prefijos de tipo de destino y servicio, como `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` y `sms:<number>`, permanecen dentro de la gramática del canal seleccionado. No seleccionan el proveedor por sí mismos.

## Formas de clave de sesión (ejemplos)

Los mensajes directos se condensan en la sesión **main** del agente de forma predeterminada:

- `agent:<agentId>:<mainKey>` (valor predeterminado: `agent:main:main`)

`session.dmScope` controla la condensación de DM: `main` (valor predeterminado) comparte una única sesión principal,
mientras que `per-peer`, `per-channel-peer` y `per-account-channel-peer`
mantienen los DM en sesiones separadas. Un enlace de ruta puede anular el alcance para sus
pares coincidentes mediante `bindings[].session.dmScope`.

Incluso cuando el historial de conversación de mensajes directos se comparte con main, la política de sandbox y
herramientas usa una clave de ejecución de chat directo por cuenta derivada para DM externos,
de modo que los mensajes originados en canales no se traten como ejecuciones de sesión principal local.

Los grupos y canales permanecen aislados por canal:

- Grupos: `agent:<agentId>:<channel>:group:<id>`
- Canales/salas: `agent:<agentId>:<channel>:channel:<id>`

Hilos:

- Los hilos de Slack/Discord agregan `:thread:<threadId>` a la clave base.
- Los temas de foro de Telegram incrustan `:topic:<topicId>` en la clave del grupo.

Ejemplos:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Fijación de ruta de DM principal

Cuando `session.dmScope` es `main`, los mensajes directos pueden compartir una única sesión principal.
Para evitar que `lastRoute` de la sesión sea sobrescrito por DM que no son del propietario,
OpenClaw infiere un propietario fijado a partir de `allowFrom` cuando se cumplen todas estas condiciones:

- `allowFrom` tiene exactamente una entrada que no es comodín.
- La entrada se puede normalizar a un ID de remitente concreto para ese canal.
- El remitente del DM entrante no coincide con ese propietario fijado.

En ese caso de discrepancia, OpenClaw aún registra los metadatos de sesión entrante, pero
omite actualizar `lastRoute` de la sesión principal.

## Registro entrante protegido

Los plugins de canal pueden marcar un registro de sesión entrante como `createIfMissing: false`
cuando una ruta protegida no debe crear una sesión nueva de OpenClaw. En ese modo,
OpenClaw puede actualizar los metadatos y `lastRoute` de una sesión existente, pero
no crea una entrada de sesión solo de ruta simplemente porque se observó un mensaje.

## Reglas de enrutamiento (cómo se elige un agente)

El enrutamiento elige **un agente** para cada mensaje entrante:

1. **Coincidencia exacta de par** (`bindings` con `peer.kind` + `peer.id`).
2. **Coincidencia de par padre** (herencia de hilo).
3. **Coincidencia de comodín de par** (`peer.id: "*"` para un tipo de par).
4. **Coincidencia de servidor + roles** (Discord) mediante `guildId` + `roles`.
5. **Coincidencia de servidor** (Discord) mediante `guildId`.
6. **Coincidencia de equipo** (Slack) mediante `teamId`.
7. **Coincidencia de cuenta** (`accountId` en el canal).
8. **Coincidencia de canal** (cualquier cuenta de ese canal, `accountId: "*"`).
9. **Agente predeterminado** (`agents.list[].default`; si no, primera entrada de la lista; como respaldo, `main`).

Cuando un enlace incluye varios campos de coincidencia (`peer`, `guildId`, `teamId`, `roles`), **todos los campos proporcionados deben coincidir** para que ese enlace se aplique.

El agente coincidente determina qué espacio de trabajo y almacén de sesiones se usan.

## Grupos de difusión (ejecutar varios agentes)

Los grupos de difusión te permiten ejecutar **varios agentes** para el mismo par **cuando OpenClaw normalmente respondería** (por ejemplo: en grupos de WhatsApp, después de las comprobaciones de mención/activación).

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

Los almacenes de sesiones viven bajo el directorio de estado (valor predeterminado `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Las transcripciones JSONL viven junto al almacén

Puedes anular la ruta del almacén mediante `session.store` y plantillas de `{agentId}`.

La detección de sesiones de Gateway y ACP también escanea los almacenes de agentes respaldados por disco bajo la
raíz predeterminada `agents/` y bajo las raíces con plantilla de `session.store`. Los almacenes descubiertos
deben permanecer dentro de esa raíz de agente resuelta y usar un archivo
`sessions.json` normal. Los enlaces simbólicos y las rutas fuera de la raíz se ignoran.

## Comportamiento de WebChat

WebChat se adjunta al **agente seleccionado** y usa de forma predeterminada la sesión principal
del agente. Por ello, WebChat te permite ver en un solo lugar el contexto entre canales de ese
agente.

## Contexto de respuesta

Las respuestas entrantes incluyen:

- `ReplyToId`, `ReplyToBody` y `ReplyToSender` cuando están disponibles.
- El contexto citado se agrega a `Body` como un bloque `[Replying to ...]`.

Esto es coherente en todos los canales.

## Relacionado

- [Grupos](/es/channels/groups)
- [Grupos de difusión](/es/channels/broadcast-groups)
- [Emparejamiento](/es/channels/pairing)
