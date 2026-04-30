---
read_when:
    - Configurar la compatibilidad con iMessage
    - Depuración del envío y la recepción de iMessage
summary: Compatibilidad heredada con iMessage mediante imsg (JSON-RPC sobre stdio). Las configuraciones nuevas deben usar BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-30T05:28:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60eeb3553a6511d56b8177ca4eafbedfed2d0852ac64c230c250911cd18ce17e
    source_path: channels/imessage.md
    workflow: 16
---

<Warning>
Para nuevos despliegues de iMessage, usa <a href="/es/channels/bluebubbles">BlueBubbles</a>.

La integración `imsg` es heredada y puede eliminarse en una versión futura.
</Warning>

Estado: integración heredada de CLI externa. Gateway inicia `imsg rpc` y se comunica mediante JSON-RPC por stdio (sin daemon/puerto separado).

<CardGroup cols={3}>
  <Card title="BlueBubbles (recomendado)" icon="message-circle" href="/es/channels/bluebubbles">
    Ruta de iMessage preferida para nuevas configuraciones.
  </Card>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los MD de iMessage usan el modo de emparejamiento de forma predeterminada.
  </Card>
  <Card title="Referencia de configuración" icon="settings" href="/es/gateway/config-channels#imessage">
    Referencia completa de campos de iMessage.
  </Card>
</CardGroup>

## Configuración rápida

<Tabs>
  <Tab title="Mac local (ruta rápida)">
    <Steps>
      <Step title="Instala y verifica imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Configura OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Inicia gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Aprueba el primer emparejamiento por MD (dmPolicy predeterminada)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Las solicitudes de emparejamiento caducan después de 1 hora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto por SSH">
    OpenClaw solo requiere un `cliPath` compatible con stdio, así que puedes apuntar `cliPath` a un script envoltorio que use SSH hacia un Mac remoto y ejecute `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Configuración recomendada cuando los adjuntos están habilitados:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Si `remoteHost` no está definido, OpenClaw intenta detectarlo automáticamente analizando el script envoltorio SSH.
    `remoteHost` debe ser `host` o `user@host` (sin espacios ni opciones SSH).
    OpenClaw usa comprobación estricta de clave de host para SCP, por lo que la clave del host de retransmisión ya debe existir en `~/.ssh/known_hosts`.
    Las rutas de adjuntos se validan contra las raíces permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisitos y permisos (macOS)

- Messages debe tener sesión iniciada en el Mac que ejecuta `imsg`.
- Se requiere Acceso total al disco para el contexto de proceso que ejecuta OpenClaw/`imsg` (acceso a la base de datos de Messages).
- Se requiere permiso de automatización para enviar mensajes mediante Messages.app.

<Tip>
Los permisos se conceden por contexto de proceso. Si gateway se ejecuta sin interfaz (LaunchAgent/SSH), ejecuta un comando interactivo una sola vez en ese mismo contexto para activar los avisos:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de MD">
    `channels.imessage.dmPolicy` controla los mensajes directos:

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    Campo de lista de permitidos: `channels.imessage.allowFrom`.

    Las entradas de la lista de permitidos pueden ser identificadores o destinos de chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Política de grupo + menciones">
    `channels.imessage.groupPolicy` controla la gestión de grupos:

    - `allowlist` (predeterminado cuando está configurado)
    - `open`
    - `disabled`

    Lista de permitidos de remitentes de grupo: `channels.imessage.groupAllowFrom`.

    Alternativa en tiempo de ejecución: si `groupAllowFrom` no está definido, las comprobaciones de remitentes de grupo de iMessage recurren a `allowFrom` cuando está disponible.
    Nota de tiempo de ejecución: si `channels.imessage` falta por completo, el tiempo de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (incluso si `channels.defaults.groupPolicy` está definido).

    Filtrado por menciones para grupos:

    - iMessage no tiene metadatos de menciones nativos
    - la detección de menciones usa patrones regex (`agents.list[].groupChat.mentionPatterns`, con respaldo en `messages.groupChat.mentionPatterns`)
    - sin patrones configurados, el filtrado por menciones no se puede aplicar

    Los comandos de control de remitentes autorizados pueden omitir el filtrado por menciones en grupos.

  </Tab>

  <Tab title="Sesiones y respuestas deterministas">
    - Los MD usan enrutamiento directo; los grupos usan enrutamiento de grupo.
    - Con `session.dmScope=main` predeterminado, los MD de iMessage se agrupan en la sesión principal del agente.
    - Las sesiones de grupo están aisladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Las respuestas se enrutan de vuelta a iMessage usando metadatos del canal/destino de origen.

    Comportamiento de hilos similares a grupo:

    Algunos hilos de iMessage con varios participantes pueden llegar con `is_group=false`.
    Si ese `chat_id` está configurado explícitamente en `channels.imessage.groups`, OpenClaw lo trata como tráfico de grupo (filtrado de grupo + aislamiento de sesión de grupo).

  </Tab>
</Tabs>

## Vinculaciones de conversación ACP

Los chats heredados de iMessage también se pueden vincular a sesiones ACP.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del MD o chat de grupo permitido.
- Los mensajes futuros en esa misma conversación de iMessage se enrutan a la sesión ACP iniciada.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada en su lugar.
- `/acp close` cierra la sesión ACP y elimina la vinculación.

Se admiten vinculaciones persistentes configuradas mediante entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "imessage"`.

`match.peer.id` puede usar:

- identificador de MD normalizado, como `+15555550123` o `user@example.com`
- `chat_id:<id>` (recomendado para vinculaciones de grupo estables)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Ejemplo:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Consulta [Agentes ACP](/es/tools/acp-agents) para el comportamiento compartido de vinculación ACP.

## Patrones de despliegue

<AccordionGroup>
  <Accordion title="Usuario dedicado de macOS para bot (identidad de iMessage separada)">
    Usa un Apple ID y un usuario de macOS dedicados para que el tráfico del bot esté aislado de tu perfil personal de Messages.

    Flujo típico:

    1. Crea/inicia sesión con un usuario de macOS dedicado.
    2. Inicia sesión en Messages con el Apple ID del bot en ese usuario.
    3. Instala `imsg` en ese usuario.
    4. Crea un envoltorio SSH para que OpenClaw pueda ejecutar `imsg` en el contexto de ese usuario.
    5. Apunta `channels.imessage.accounts.<id>.cliPath` y `.dbPath` a ese perfil de usuario.

    La primera ejecución puede requerir aprobaciones de GUI (Automatización + Acceso total al disco) en esa sesión de usuario del bot.

  </Accordion>

  <Accordion title="Mac remoto por Tailscale (ejemplo)">
    Topología común:

    - gateway se ejecuta en Linux/VM
    - iMessage + `imsg` se ejecuta en un Mac dentro de tu tailnet
    - el envoltorio `cliPath` usa SSH para ejecutar `imsg`
    - `remoteHost` habilita la obtención de adjuntos mediante SCP

    Ejemplo:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    Usa claves SSH para que tanto SSH como SCP sean no interactivos.
    Asegúrate primero de que la clave de host sea de confianza (por ejemplo `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` se rellene.

  </Accordion>

  <Accordion title="Patrón de varias cuentas">
    iMessage admite configuración por cuenta en `channels.imessage.accounts`.

    Cada cuenta puede sobrescribir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, ajustes de historial y listas de permitidos de raíces de adjuntos.

  </Accordion>
</AccordionGroup>

## Medios, fragmentación y destinos de entrega

<AccordionGroup>
  <Accordion title="Adjuntos y medios">
    - la ingesta de adjuntos entrantes es opcional: `channels.imessage.includeAttachments`
    - las rutas de adjuntos remotos se pueden obtener mediante SCP cuando `remoteHost` está definido
    - las rutas de adjuntos deben coincidir con las raíces permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - patrón de raíz predeterminado: `/Users/*/Library/Messages/Attachments`
    - SCP usa comprobación estricta de clave de host (`StrictHostKeyChecking=yes`)
    - el tamaño de medios salientes usa `channels.imessage.mediaMaxMb` (predeterminado 16 MB)

  </Accordion>

  <Accordion title="Fragmentación saliente">
    - límite de fragmento de texto: `channels.imessage.textChunkLimit` (predeterminado 4000)
    - modo de fragmentación: `channels.imessage.chunkMode`
      - `length` (predeterminado)
      - `newline` (división priorizando párrafos)

  </Accordion>

  <Accordion title="Formatos de direccionamiento">
    Destinos explícitos preferidos:

    - `chat_id:123` (recomendado para enrutamiento estable)
    - `chat_guid:...`
    - `chat_identifier:...`

    También se admiten destinos por identificador:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Escrituras de configuración

iMessage permite escrituras de configuración iniciadas por canal de forma predeterminada (para `/config set|unset` cuando `commands.config: true`).

Deshabilitar:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## Solución de problemas

<AccordionGroup>
  <Accordion title="imsg no encontrado o RPC no compatible">
    Valida el binario y la compatibilidad con RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Si la comprobación informa que RPC no es compatible, actualiza `imsg`.

  </Accordion>

  <Accordion title="Los MD se ignoran">
    Comprueba:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprobaciones de emparejamiento (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Los mensajes de grupo se ignoran">
    Comprueba:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamiento de lista de permitidos de `channels.imessage.groups`
    - configuración de patrones de mención (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Los adjuntos remotos fallan">
    Comprueba:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticación por clave SSH/SCP desde el host gateway
    - la clave de host existe en `~/.ssh/known_hosts` en el host gateway
    - legibilidad de la ruta remota en el Mac que ejecuta Messages

  </Accordion>

  <Accordion title="Se omitieron los avisos de permisos de macOS">
    Vuelve a ejecutar en un terminal GUI interactivo en el mismo contexto de usuario/sesión y aprueba los avisos:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Confirma que Acceso total al disco + Automatización estén concedidos para el contexto de proceso que ejecuta OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Punteros de referencia de configuración

- [Referencia de configuración - iMessage](/es/gateway/config-channels#imessage)
- [Configuración de Gateway](/es/gateway/configuration)
- [Emparejamiento](/es/channels/pairing)
- [BlueBubbles](/es/channels/bluebubbles)

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat de grupo y filtrado por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
