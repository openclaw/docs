---
read_when:
    - Configuración de la compatibilidad con iMessage
    - Depuración del envío/recepción de iMessage
summary: Soporte nativo de iMessage mediante imsg (JSON-RPC sobre stdio). Preferido para nuevas configuraciones de OpenClaw iMessage cuando los requisitos del host son adecuados.
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para nuevas implementaciones de OpenClaw iMessage, empieza aquí cuando puedas ejecutar `imsg` en un host de macOS Messages con sesión iniciada. BlueBubbles sigue disponible como alternativa heredada para configuraciones existentes que dependen de su servidor HTTP, webhooks o acciones más avanzadas de API privada.
</Note>

Estado: integración nativa con CLI externa. Gateway inicia `imsg rpc` y se comunica mediante JSON-RPC por stdio (sin demonio/puerto independiente).

<CardGroup cols={3}>
  <Card title="BlueBubbles (alternativa heredada)" icon="message-circle" href="/es/channels/bluebubbles">
    Sigue usándolo para enrutamiento existente respaldado por BlueBubbles; evítalo en configuraciones nuevas cuando imsg encaje.
  </Card>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los MD de iMessage usan de forma predeterminada el modo de emparejamiento.
  </Card>
  <Card title="Referencia de configuración" icon="settings" href="/es/gateway/config-channels#imessage">
    Referencia completa de campos de iMessage.
  </Card>
</CardGroup>

## Configuración rápida

<Tabs>
  <Tab title="Mac local (ruta rápida)">
    <Steps>
      <Step title="Instalar y verificar imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Configurar OpenClaw">

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

      <Step title="Iniciar Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Aprobar el primer emparejamiento de MD (dmPolicy predeterminada)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Las solicitudes de emparejamiento caducan después de 1 hora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto por SSH">
    OpenClaw solo requiere un `cliPath` compatible con stdio, así que puedes apuntar `cliPath` a un script envoltorio que se conecte por SSH a un Mac remoto y ejecute `imsg`.

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

    Si `remoteHost` no está configurado, OpenClaw intenta detectarlo automáticamente analizando el script envoltorio SSH.
    `remoteHost` debe ser `host` o `user@host` (sin espacios ni opciones SSH).
    OpenClaw usa verificación estricta de clave de host para SCP, por lo que la clave del host de retransmisión ya debe existir en `~/.ssh/known_hosts`.
    Las rutas de adjuntos se validan contra raíces permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisitos y permisos (macOS)

- Messages debe tener la sesión iniciada en el Mac que ejecuta `imsg`.
- Se requiere Full Disk Access para el contexto de proceso que ejecuta OpenClaw/`imsg` (acceso a la BD de Messages).
- Se requiere permiso de automatización para enviar mensajes mediante Messages.app.

<Tip>
Los permisos se conceden por contexto de proceso. Si Gateway se ejecuta sin interfaz (LaunchAgent/SSH), ejecuta un comando interactivo de una sola vez en ese mismo contexto para activar los avisos:

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
    `channels.imessage.groupPolicy` controla el manejo de grupos:

    - `allowlist` (predeterminado cuando está configurado)
    - `open`
    - `disabled`

    Lista de remitentes de grupo permitidos: `channels.imessage.groupAllowFrom`.

    Alternativa en tiempo de ejecución: si `groupAllowFrom` no está configurado, las comprobaciones de remitente de grupo de iMessage recurren a `allowFrom` cuando esté disponible.
    Nota de tiempo de ejecución: si falta por completo `channels.imessage`, el tiempo de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (incluso si `channels.defaults.groupPolicy` está configurado).

    Control por menciones en grupos:

    - iMessage no tiene metadatos nativos de menciones
    - la detección de menciones usa patrones regex (`agents.list[].groupChat.mentionPatterns`, con alternativa `messages.groupChat.mentionPatterns`)
    - sin patrones configurados, el control por menciones no puede aplicarse

    Los comandos de control de remitentes autorizados pueden omitir el control por menciones en grupos.

  </Tab>

  <Tab title="Sesiones y respuestas deterministas">
    - Los MD usan enrutamiento directo; los grupos usan enrutamiento de grupo.
    - Con `session.dmScope=main` predeterminado, los MD de iMessage se agrupan en la sesión principal del agente.
    - Las sesiones de grupo están aisladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Las respuestas se enrutan de vuelta a iMessage usando metadatos de canal/destino de origen.

    Comportamiento de hilos similares a grupos:

    Algunos hilos de iMessage con varios participantes pueden llegar con `is_group=false`.
    Si ese `chat_id` está configurado explícitamente en `channels.imessage.groups`, OpenClaw lo trata como tráfico de grupo (control de grupo + aislamiento de sesión de grupo).

  </Tab>
</Tabs>

## Enlaces de conversaciones ACP

Los chats heredados de iMessage también pueden enlazarse a sesiones ACP.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del MD o chat de grupo permitido.
- Los mensajes futuros en esa misma conversación de iMessage se enrutan a la sesión ACP iniciada.
- `/new` y `/reset` restablecen la misma sesión ACP enlazada in situ.
- `/acp close` cierra la sesión ACP y elimina el enlace.

Los enlaces persistentes configurados se admiten mediante entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "imessage"`.

`match.peer.id` puede usar:

- identificador de MD normalizado como `+15555550123` o `user@example.com`
- `chat_id:<id>` (recomendado para enlaces de grupo estables)
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

Consulta [Agentes ACP](/es/tools/acp-agents) para el comportamiento compartido de enlaces ACP.

## Patrones de implementación

<AccordionGroup>
  <Accordion title="Usuario macOS dedicado para el bot (identidad de iMessage separada)">
    Usa un Apple ID y un usuario de macOS dedicados para que el tráfico del bot quede aislado de tu perfil personal de Messages.

    Flujo típico:

    1. Crea/inicia sesión con un usuario de macOS dedicado.
    2. Inicia sesión en Messages con el Apple ID del bot en ese usuario.
    3. Instala `imsg` en ese usuario.
    4. Crea un envoltorio SSH para que OpenClaw pueda ejecutar `imsg` en el contexto de ese usuario.
    5. Apunta `channels.imessage.accounts.<id>.cliPath` y `.dbPath` al perfil de ese usuario.

    La primera ejecución puede requerir aprobaciones de GUI (Automatización + Full Disk Access) en la sesión de ese usuario bot.

  </Accordion>

  <Accordion title="Mac remoto por Tailscale (ejemplo)">
    Topología común:

    - Gateway se ejecuta en Linux/VM
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

  <Accordion title="Patrón multicuenta">
    iMessage admite configuración por cuenta en `channels.imessage.accounts`.

    Cada cuenta puede sobrescribir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, configuración de historial y listas de raíces de adjuntos permitidas.

  </Accordion>
</AccordionGroup>

## Medios, fragmentación y destinos de entrega

<AccordionGroup>
  <Accordion title="Adjuntos y medios">
    - la ingesta de adjuntos entrantes es opcional: `channels.imessage.includeAttachments`
    - las rutas de adjuntos remotos pueden obtenerse mediante SCP cuando `remoteHost` está configurado
    - las rutas de adjuntos deben coincidir con raíces permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - patrón de raíz predeterminado: `/Users/*/Library/Messages/Attachments`
    - SCP usa verificación estricta de clave de host (`StrictHostKeyChecking=yes`)
    - el tamaño de medios salientes usa `channels.imessage.mediaMaxMb` (predeterminado 16 MB)

  </Accordion>

  <Accordion title="Fragmentación de salida">
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

iMessage permite de forma predeterminada escrituras de configuración iniciadas por el canal (para `/config set|unset` cuando `commands.config: true`).

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
  <Accordion title="imsg no se encuentra o RPC no es compatible">
    Valida el binario y la compatibilidad con RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Si la prueba informa que RPC no es compatible, actualiza `imsg`.

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

  <Accordion title="Fallan los adjuntos remotos">
    Comprueba:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticación con claves SSH/SCP desde el host de Gateway
    - la clave de host existe en `~/.ssh/known_hosts` en el host de Gateway
    - legibilidad de la ruta remota en el Mac que ejecuta Messages

  </Accordion>

  <Accordion title="Se omitieron los avisos de permisos de macOS">
    Vuelve a ejecutar en un terminal GUI interactivo en el mismo contexto de usuario/sesión y aprueba los avisos:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Confirma que Full Disk Access + Automatización están concedidos para el contexto de proceso que ejecuta OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Punteros de referencia de configuración

- [Referencia de configuración - iMessage](/es/gateway/config-channels#imessage)
- [Configuración de Gateway](/es/gateway/configuration)
- [Emparejamiento](/es/channels/pairing)
- [BlueBubbles](/es/channels/bluebubbles)

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación por mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats grupales y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
