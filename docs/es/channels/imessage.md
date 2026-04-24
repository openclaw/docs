---
read_when:
    - Configurar la compatibilidad con iMessage
    - Depurar el envío y la recepción de iMessage
summary: Compatibilidad heredada de iMessage mediante imsg (JSON-RPC sobre stdio). Las configuraciones nuevas deben usar BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-24T05:19:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff2773ebcfced8834bc5d28378d9a6e3c20826cc0e08d6ea5480f8a5975fd8e3
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (heredado: imsg)

<Warning>
Para implementaciones nuevas de iMessage, usa <a href="/es/channels/bluebubbles">BlueBubbles</a>.

La integración `imsg` es heredada y puede eliminarse en una versión futura.
</Warning>

Estado: integración heredada de CLI externa. Gateway ejecuta `imsg rpc` y se comunica mediante JSON-RPC sobre stdio (sin daemon/puerto independiente).

<CardGroup cols={3}>
  <Card title="BlueBubbles (recomendado)" icon="message-circle" href="/es/channels/bluebubbles">
    Ruta preferida de iMessage para configuraciones nuevas.
  </Card>
  <Card title="Vinculación" icon="link" href="/es/channels/pairing">
    Los mensajes directos de iMessage usan el modo de vinculación de forma predeterminada.
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

      <Step title="Aprueba la primera vinculación de mensaje directo (`dmPolicy` predeterminada)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Las solicitudes de vinculación caducan después de 1 hora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remota por SSH">
    OpenClaw solo requiere un `cliPath` compatible con stdio, por lo que puedes hacer que `cliPath` apunte a un script contenedor que se conecte por SSH a una Mac remota y ejecute `imsg`.

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
      remoteHost: "user@gateway-host", // usado para búsquedas de adjuntos mediante SCP
      includeAttachments: true,
      // Opcional: sobrescribe las raíces de adjuntos permitidas.
      // Los valores predeterminados incluyen /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Si `remoteHost` no está establecido, OpenClaw intenta detectarlo automáticamente analizando el script contenedor SSH.
    `remoteHost` debe ser `host` o `user@host` (sin espacios ni opciones SSH).
    OpenClaw usa una comprobación estricta de clave de host para SCP, por lo que la clave del host de retransmisión ya debe existir en `~/.ssh/known_hosts`.
    Las rutas de adjuntos se validan frente a las raíces permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisitos y permisos (macOS)

- Messages debe tener sesión iniciada en la Mac que ejecuta `imsg`.
- Se requiere Acceso total al disco para el contexto de proceso que ejecuta OpenClaw/`imsg` (acceso a la base de datos de Messages).
- Se requiere permiso de Automatización para enviar mensajes mediante Messages.app.

<Tip>
Los permisos se conceden por contexto de proceso. Si gateway se ejecuta sin interfaz (LaunchAgent/SSH), ejecuta un comando interactivo una sola vez en ese mismo contexto para activar las solicitudes:

```bash
imsg chats --limit 1
# o
imsg send <handle> "test"
```

</Tip>

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.imessage.dmPolicy` controla los mensajes directos:

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    Campo de lista de permitidos: `channels.imessage.allowFrom`.

    Las entradas de la lista de permitidos pueden ser handles o destinos de chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Política de grupos + menciones">
    `channels.imessage.groupPolicy` controla el manejo de grupos:

    - `allowlist` (predeterminado cuando está configurado)
    - `open`
    - `disabled`

    Lista de permitidos de remitentes de grupos: `channels.imessage.groupAllowFrom`.

    Respaldo en tiempo de ejecución: si `groupAllowFrom` no está establecido, las comprobaciones de remitentes de grupos de iMessage recurren a `allowFrom` cuando está disponible.
    Nota de tiempo de ejecución: si `channels.imessage` falta por completo, el tiempo de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (incluso si `channels.defaults.groupPolicy` está establecido).

    Filtrado por mención para grupos:

    - iMessage no tiene metadatos nativos de mención
    - la detección de menciones usa patrones regex (`agents.list[].groupChat.mentionPatterns`, con respaldo en `messages.groupChat.mentionPatterns`)
    - sin patrones configurados, el filtrado por mención no puede aplicarse

    Los comandos de control de remitentes autorizados pueden omitir el filtrado por mención en grupos.

  </Tab>

  <Tab title="Sesiones y respuestas deterministas">
    - Los mensajes directos usan enrutamiento directo; los grupos usan enrutamiento de grupo.
    - Con el valor predeterminado `session.dmScope=main`, los mensajes directos de iMessage se reducen a la sesión principal del agente.
    - Las sesiones de grupo están aisladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Las respuestas se enrutan de vuelta a iMessage usando los metadatos del canal/destino de origen.

    Comportamiento tipo hilo de grupo:

    Algunos hilos de iMessage con varios participantes pueden llegar con `is_group=false`.
    Si ese `chat_id` está configurado explícitamente en `channels.imessage.groups`, OpenClaw lo trata como tráfico de grupo (filtrado de grupo + aislamiento de sesión de grupo).

  </Tab>
</Tabs>

## Vinculaciones de conversaciones de ACP

Los chats heredados de iMessage también pueden vincularse a sesiones de ACP.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del mensaje directo o del chat grupal permitido.
- Los mensajes futuros en esa misma conversación de iMessage se enrutan a la sesión de ACP generada.
- `/new` y `/reset` restablecen la misma sesión de ACP vinculada en el lugar.
- `/acp close` cierra la sesión de ACP y elimina la vinculación.

Se admiten vinculaciones persistentes configuradas mediante entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "imessage"`.

`match.peer.id` puede usar:

- handle de mensaje directo normalizado como `+15555550123` o `user@example.com`
- `chat_id:<id>` (recomendado para vinculaciones de grupos estables)
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

Consulta [Agentes ACP](/es/tools/acp-agents) para el comportamiento compartido de vinculaciones de ACP.

## Patrones de implementación

<AccordionGroup>
  <Accordion title="Usuario macOS de bot dedicado (identidad de iMessage separada)">
    Usa un Apple ID y un usuario de macOS dedicados para que el tráfico del bot quede aislado de tu perfil personal de Messages.

    Flujo típico:

    1. Crea e inicia sesión con un usuario de macOS dedicado.
    2. Inicia sesión en Messages con el Apple ID del bot en ese usuario.
    3. Instala `imsg` en ese usuario.
    4. Crea un script contenedor SSH para que OpenClaw pueda ejecutar `imsg` en el contexto de ese usuario.
    5. Haz que `channels.imessage.accounts.<id>.cliPath` y `.dbPath` apunten al perfil de ese usuario.

    La primera ejecución puede requerir aprobaciones en la interfaz gráfica (Automatización + Acceso total al disco) en la sesión de ese usuario del bot.

  </Accordion>

  <Accordion title="Mac remota por Tailscale (ejemplo)">
    Topología habitual:

    - gateway se ejecuta en Linux/VM
    - iMessage + `imsg` se ejecuta en una Mac de tu tailnet
    - el contenedor `cliPath` usa SSH para ejecutar `imsg`
    - `remoteHost` habilita búsquedas de adjuntos mediante SCP

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

    Usa claves SSH para que tanto SSH como SCP no sean interactivos.
    Asegúrate primero de que la clave del host sea de confianza (por ejemplo, `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` se complete.

  </Accordion>

  <Accordion title="Patrón de varias cuentas">
    iMessage admite configuración por cuenta en `channels.imessage.accounts`.

    Cada cuenta puede sobrescribir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, configuración del historial y listas de permitidos de raíces de adjuntos.

  </Accordion>
</AccordionGroup>

## Multimedia, fragmentación y destinos de entrega

<AccordionGroup>
  <Accordion title="Adjuntos y multimedia">
    - la ingestión de adjuntos entrantes es opcional: `channels.imessage.includeAttachments`
    - las rutas de adjuntos remotos pueden recuperarse mediante SCP cuando `remoteHost` está establecido
    - las rutas de adjuntos deben coincidir con las raíces permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - patrón de raíz predeterminado: `/Users/*/Library/Messages/Attachments`
    - SCP usa comprobación estricta de clave de host (`StrictHostKeyChecking=yes`)
    - el tamaño de multimedia saliente usa `channels.imessage.mediaMaxMb` (predeterminado 16 MB)
  </Accordion>

  <Accordion title="Fragmentación de salida">
    - límite de fragmento de texto: `channels.imessage.textChunkLimit` (predeterminado 4000)
    - modo de fragmentación: `channels.imessage.chunkMode`
      - `length` (predeterminado)
      - `newline` (división por párrafos primero)
  </Accordion>

  <Accordion title="Formatos de direccionamiento">
    Destinos explícitos preferidos:

    - `chat_id:123` (recomendado para enrutamiento estable)
    - `chat_guid:...`
    - `chat_identifier:...`

    También se admiten destinos de handle:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Escrituras de configuración

iMessage permite de forma predeterminada escrituras de configuración iniciadas por el canal (para `/config set|unset` cuando `commands.config: true`).

Desactiva:

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
  <Accordion title="imsg no se encuentra o RPC no es compatible">
    Valida el binario y la compatibilidad con RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Si la comprobación informa que RPC no es compatible, actualiza `imsg`.

  </Accordion>

  <Accordion title="Los mensajes directos se ignoran">
    Comprueba:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprobaciones de vinculación (`openclaw pairing list imessage`)

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
    - autenticación por clave SSH/SCP desde el host de gateway
    - la clave del host existe en `~/.ssh/known_hosts` en el host de gateway
    - legibilidad de la ruta remota en la Mac que ejecuta Messages

  </Accordion>

  <Accordion title="Se omitieron solicitudes de permisos de macOS">
    Vuelve a ejecutar en un terminal GUI interactivo en el mismo contexto de usuario/sesión y aprueba las solicitudes:

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
- [Vinculación](/es/channels/pairing)
- [BlueBubbles](/es/channels/bluebubbles)

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales compatibles
- [Vinculación](/es/channels/pairing) — autenticación de mensajes directos y flujo de vinculación
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y filtrado por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
