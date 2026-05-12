---
read_when:
    - Configuración de la compatibilidad con iMessage
    - Depuración del envío/recepción de iMessage
summary: Compatibilidad nativa con iMessage mediante imsg (JSON-RPC sobre stdio), con acciones de API privada para respuestas, tapbacks, efectos, adjuntos y gestión de grupos. Preferido para nuevas configuraciones de OpenClaw iMessage cuando se cumplen los requisitos del host.
title: iMessage
x-i18n:
    generated_at: "2026-05-12T00:56:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b0c284a5105bf9c2863f46731fb61628e264ce35c316014f25f15907142430
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para despliegues de OpenClaw iMessage, usa `imsg` en un host de macOS Messages con sesión iniciada. Si tu Gateway se ejecuta en Linux o Windows, apunta `channels.imessage.cliPath` a un wrapper SSH que ejecute `imsg` en la Mac.

**La recuperación tras inactividad del Gateway es opcional.** Cuando está habilitada (`channels.imessage.catchup.enabled: true`), el gateway reproduce los mensajes entrantes que llegaron a `chat.db` mientras estaba sin conexión (fallo, reinicio, suspensión de la Mac) en el siguiente inicio. Deshabilitada de forma predeterminada — consulta [Recuperación tras inactividad del gateway](#catching-up-after-gateway-downtime). Cierra [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Se eliminó el soporte de BlueBubbles. Migra las configuraciones de `channels.bluebubbles` a `channels.imessage`; OpenClaw admite iMessage solo mediante `imsg`. Empieza con [Eliminación de BlueBubbles y la ruta imsg para iMessage](/es/announcements/bluebubbles-imessage) para el anuncio breve, o [Migrar desde BlueBubbles](/es/channels/imessage-from-bluebubbles) para la tabla de migración completa.
</Warning>

Estado: integración nativa con CLI externa. Gateway inicia `imsg rpc` y se comunica por JSON-RPC sobre stdio (sin daemon/puerto separado). Las acciones avanzadas requieren `imsg launch` y una prueba correcta de API privada.

<CardGroup cols={3}>
  <Card title="Acciones de API privada" icon="wand-sparkles" href="#private-api-actions">
    Respuestas, tapbacks, efectos, archivos adjuntos y gestión de grupos.
  </Card>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los DM de iMessage usan el modo de emparejamiento de forma predeterminada.
  </Card>
  <Card title="Mac remota" icon="terminal" href="#remote-mac-over-ssh">
    Usa un wrapper SSH cuando el Gateway no se ejecute en la Mac de Messages.
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
imsg launch
openclaw channels status --probe
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

      <Step title="Iniciar gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Aprobar el primer emparejamiento por DM (dmPolicy predeterminada)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Las solicitudes de emparejamiento caducan después de 1 hora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remota por SSH">
    OpenClaw solo requiere un `cliPath` compatible con stdio, así que puedes apuntar `cliPath` a un script wrapper que haga SSH a una Mac remota y ejecute `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Configuración recomendada cuando los archivos adjuntos están habilitados:

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

    Si `remoteHost` no está definido, OpenClaw intenta detectarlo automáticamente analizando el script wrapper SSH.
    `remoteHost` debe ser `host` o `user@host` (sin espacios ni opciones SSH).
    OpenClaw usa comprobación estricta de claves de host para SCP, así que la clave del host de relé ya debe existir en `~/.ssh/known_hosts`.
    Las rutas de archivos adjuntos se validan contra las raíces permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisitos y permisos (macOS)

- Messages debe tener sesión iniciada en la Mac que ejecuta `imsg`.
- Se requiere Acceso total al disco para el contexto del proceso que ejecuta OpenClaw/`imsg` (acceso a la base de datos de Messages).
- Se requiere permiso de Automatización para enviar mensajes mediante Messages.app.
- Para acciones avanzadas (reaccionar / editar / deshacer envío / respuesta en hilo / efectos / operaciones de grupo), System Integrity Protection debe estar deshabilitado — consulta [Habilitar la API privada de imsg](#enabling-the-imsg-private-api) abajo. El envío/recepción básica de texto y multimedia funciona sin ello.

<Tip>
Los permisos se conceden por contexto de proceso. Si gateway se ejecuta sin interfaz (LaunchAgent/SSH), ejecuta una vez un comando interactivo en ese mismo contexto para activar los avisos:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Habilitar la API privada de imsg

`imsg` incluye dos modos operativos:

- **Modo básico** (predeterminado, no requiere cambios de SIP): texto y multimedia saliente mediante `send`, watch/historial entrante, lista de chats. Esto es lo que obtienes de inmediato con un `brew install steipete/tap/imsg` nuevo más los permisos estándar de macOS anteriores.
- **Modo de API privada**: `imsg` inyecta una dylib auxiliar en `Messages.app` para llamar funciones internas de `IMCore`. Esto desbloquea `react`, `edit`, `unsend`, `reply` (en hilo), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, además de indicadores de escritura y confirmaciones de lectura.

Para acceder a la superficie de acciones avanzadas que documenta esta página del canal, necesitas el modo de API privada. El README de `imsg` es explícito sobre el requisito:

> Las funciones avanzadas como `read`, `typing`, `launch`, envío enriquecido respaldado por bridge, mutación de mensajes y gestión de chats son opcionales. Requieren que SIP esté deshabilitado y que se inyecte una dylib auxiliar en `Messages.app`. `imsg launch` se niega a inyectar cuando SIP está habilitado.

La técnica de inyección del auxiliar usa la propia dylib de `imsg` para llegar a las API privadas de Messages. No hay servidor de terceros ni runtime de BlueBubbles en la ruta de OpenClaw iMessage.

<Warning>
**Deshabilitar SIP implica una concesión real de seguridad.** SIP es una de las protecciones centrales de macOS contra la ejecución de código del sistema modificado; desactivarlo en todo el sistema abre superficie de ataque adicional y posibles efectos secundarios. En particular, **deshabilitar SIP en Macs con Apple Silicon también deshabilita la capacidad de instalar y ejecutar apps de iOS en tu Mac**.

Trata esto como una decisión operativa deliberada, no como un valor predeterminado. Si tu modelo de amenazas no puede tolerar que SIP esté desactivado, iMessage incluido queda limitado al modo básico: solo envío/recepción de texto y multimedia, sin reacciones / edición / deshacer envío / efectos / operaciones de grupo.
</Warning>

### Configuración

1. **Instala (o actualiza) `imsg`** en la Mac que ejecuta Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   La salida de `imsg status --json` informa `bridge_version`, `rpc_methods` y `selectors` por método para que puedas ver qué admite la compilación actual antes de empezar.

2. **Deshabilita System Integrity Protection.** Esto depende de la versión de macOS porque el requisito subyacente de Apple depende del sistema operativo y del hardware:
   - **macOS 10.13–10.15 (Sierra–Catalina):** deshabilita Library Validation mediante Terminal, reinicia en Recovery Mode, ejecuta `csrutil disable`, reinicia.
   - **macOS 11+ (Big Sur y posterior), Intel:** Recovery Mode (o Internet Recovery), `csrutil disable`, reinicia.
   - **macOS 11+, Apple Silicon:** secuencia de arranque con botón de encendido para entrar en Recovery; en versiones recientes de macOS mantén pulsada la tecla **Mayús izquierda** al hacer clic en Continue, luego `csrutil disable`. Las configuraciones de máquinas virtuales siguen un flujo separado: primero toma una instantánea de la VM.
   - **macOS 26 / Tahoe:** las políticas de library-validation y las comprobaciones de derechos privados de `imagent` se han endurecido aún más; `imsg` podría necesitar una compilación actualizada para mantenerse compatible. Si la inyección de `imsg launch` o `selectors` específicos empiezan a devolver false después de una actualización mayor de macOS, revisa las notas de lanzamiento de `imsg` antes de asumir que el paso de SIP se completó correctamente.

   Sigue el flujo de Recovery-mode de Apple para tu Mac a fin de deshabilitar SIP antes de ejecutar `imsg launch`.

3. **Inyecta el auxiliar.** Con SIP deshabilitado y Messages.app con sesión iniciada:

   ```bash
   imsg launch
   ```

   `imsg launch` se niega a inyectar cuando SIP todavía está habilitado, así que esto también sirve como confirmación de que el paso 2 surtió efecto.

4. **Verifica el bridge desde OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   La entrada de iMessage debería informar `works`, y `imsg status --json | jq '.selectors'` debería mostrar `retractMessagePart: true` además de los selectores de edición / escritura / lectura que exponga tu compilación de macOS. La compuerta por método del Plugin de OpenClaw en `actions.ts` solo anuncia acciones cuyo selector subyacente es `true`, así que la superficie de acciones que ves en la lista de herramientas del agente refleja lo que el bridge realmente puede hacer en este host.

Si `openclaw channels status --probe` informa que el canal está como `works` pero acciones específicas lanzan "iMessage `<action>` requiere el bridge de API privada de imsg" en tiempo de despacho, ejecuta `imsg launch` otra vez: el auxiliar puede dejar de estar activo (reinicio de Messages.app, actualización del sistema operativo, etc.) y el estado en caché `available: true` seguirá anunciando acciones hasta que la siguiente prueba actualice el estado.

### Cuando no puedes deshabilitar SIP

Si SIP deshabilitado no es aceptable para tu modelo de amenazas:

- `imsg` recurre al modo básico: solo texto + multimedia + recepción.
- El Plugin de OpenClaw sigue anunciando envío de texto/multimedia y monitoreo entrante; simplemente oculta `react`, `edit`, `unsend`, `reply`, `sendWithEffect` y operaciones de grupo de la superficie de acciones (según la compuerta de capacidad por método).
- Puedes ejecutar una Mac separada que no sea Apple Silicon (o una Mac dedicada para bot) con SIP desactivado para la carga de trabajo de iMessage, mientras mantienes SIP habilitado en tus dispositivos principales. Consulta [Usuario macOS dedicado para bot (identidad de iMessage separada)](#deployment-patterns) abajo.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de DM">
    `channels.imessage.dmPolicy` controla los mensajes directos:

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    Campo de lista de permitidos: `channels.imessage.allowFrom`.

    Las entradas de la lista de permitidos pueden ser identificadores, grupos estáticos de acceso de remitentes (`accessGroup:<name>`) u objetivos de chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Política de grupo + menciones">
    `channels.imessage.groupPolicy` controla la gestión de grupos:

    - `allowlist` (predeterminado cuando está configurado)
    - `open`
    - `disabled`

    Lista de permitidos de remitentes de grupo: `channels.imessage.groupAllowFrom`.

    Las entradas de `groupAllowFrom` también pueden hacer referencia a grupos estáticos de acceso de remitentes (`accessGroup:<name>`).

    Respaldo en runtime: si `groupAllowFrom` no está definido, las comprobaciones de remitentes de grupos de iMessage recurren a `allowFrom` cuando está disponible.
    Nota de runtime: si `channels.imessage` falta por completo, runtime recurre a `groupPolicy="allowlist"` y registra una advertencia (incluso si `channels.defaults.groupPolicy` está definido).

    <Warning>
    El enrutamiento de grupos tiene **dos** compuertas de lista de permitidos ejecutándose una tras otra, y ambas deben pasar:

    1. **Lista de permitidos de remitente / objetivo de chat** (`channels.imessage.groupAllowFrom`) — identificador, `chat_guid`, `chat_identifier` o `chat_id`.
    2. **Registro de grupos** (`channels.imessage.groups`) — con `groupPolicy: "allowlist"`, esta compuerta requiere una entrada comodín `groups: { "*": { ... } }` (establece `allowAll = true`) o una entrada explícita por `chat_id` bajo `groups`.

    Si la compuerta 2 no contiene nada, se descartan todos los mensajes de grupo. El Plugin emite dos señales de nivel `warn` en el nivel de log predeterminado:

    - una vez por cuenta al iniciar: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - una vez por `chat_id` en runtime: `imessage: dropping group message from chat_id=<id> ...`

    Los DM siguen funcionando porque usan una ruta de código distinta.

    Configuración mínima para mantener el flujo de grupos bajo `groupPolicy: "allowlist"`:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    Si esas líneas `warn` aparecen en el log de Gateway, el filtro 2 está descartando — agrega el bloque `groups`.
    </Warning>

    Menciona el control de acceso para grupos:

    - iMessage no tiene metadatos nativos de mención
    - la detección de menciones usa patrones regex (`agents.list[].groupChat.mentionPatterns`, respaldo `messages.groupChat.mentionPatterns`)
    - sin patrones configurados, no se puede aplicar el control de menciones

    Los comandos de control de remitentes autorizados pueden omitir el control de menciones en grupos.

    `systemPrompt` por grupo:

    Cada entrada bajo `channels.imessage.groups.*` acepta una cadena opcional `systemPrompt`. El valor se inyecta en el prompt del sistema del agente en cada turno que gestiona un mensaje en ese grupo. La resolución refleja la resolución de prompt por grupo usada por `channels.whatsapp.groups`:

    1. **Prompt del sistema específico del grupo** (`groups["<chat_id>"].systemPrompt`): se usa cuando la entrada específica del grupo existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), se suprime el comodín y no se aplica ningún prompt del sistema a ese grupo.
    2. **Prompt del sistema comodín de grupo** (`groups["*"].systemPrompt`): se usa cuando la entrada específica del grupo está completamente ausente del mapa, o cuando existe pero no define ninguna clave `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Los prompts por grupo solo se aplican a mensajes de grupo — los mensajes directos en este canal no se ven afectados.

  </Tab>

  <Tab title="Sesiones y respuestas deterministas">
    - Los MD usan enrutamiento directo; los grupos usan enrutamiento de grupo.
    - Con el valor predeterminado `session.dmScope=main`, los MD de iMessage se unifican en la sesión principal del agente.
    - Las sesiones de grupo están aisladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Las respuestas se enrutan de vuelta a iMessage usando metadatos del canal/objetivo de origen.

    Comportamiento de hilos similares a grupo:

    Algunos hilos de iMessage con varios participantes pueden llegar con `is_group=false`.
    Si ese `chat_id` está configurado explícitamente bajo `channels.imessage.groups`, OpenClaw lo trata como tráfico de grupo (control de grupo + aislamiento de sesión de grupo).

  </Tab>
</Tabs>

## Vinculaciones de conversaciones ACP

Los chats heredados de iMessage también pueden vincularse a sesiones ACP.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del MD o chat de grupo permitido.
- Los mensajes futuros en esa misma conversación de iMessage se enrutan a la sesión ACP creada.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada en su lugar.
- `/acp close` cierra la sesión ACP y elimina la vinculación.

Las vinculaciones persistentes configuradas se admiten mediante entradas de nivel superior `bindings[]` con `type: "acp"` y `match.channel: "imessage"`.

`match.peer.id` puede usar:

- identificador de MD normalizado como `+15555550123` o `user@example.com`
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

    1. Crea/inicia sesión en un usuario dedicado de macOS.
    2. Inicia sesión en Messages con el Apple ID del bot en ese usuario.
    3. Instala `imsg` en ese usuario.
    4. Crea un wrapper SSH para que OpenClaw pueda ejecutar `imsg` en el contexto de ese usuario.
    5. Apunta `channels.imessage.accounts.<id>.cliPath` y `.dbPath` a ese perfil de usuario.

    La primera ejecución puede requerir aprobaciones de GUI (Automatización + Acceso total al disco) en esa sesión de usuario del bot.

  </Accordion>

  <Accordion title="Mac remoto por Tailscale (ejemplo)">
    Topología común:

    - Gateway se ejecuta en Linux/VM
    - iMessage + `imsg` se ejecutan en un Mac dentro de tu tailnet
    - el wrapper `cliPath` usa SSH para ejecutar `imsg`
    - `remoteHost` habilita recuperaciones de adjuntos por SCP

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
    Asegúrate primero de que la clave del host sea de confianza (por ejemplo `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` se complete.

  </Accordion>

  <Accordion title="Patrón de varias cuentas">
    iMessage admite configuración por cuenta bajo `channels.imessage.accounts`.

    Cada cuenta puede sobrescribir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, ajustes de historial y allowlists de raíces de adjuntos.

  </Accordion>
</AccordionGroup>

## Medios, fragmentación y objetivos de entrega

<AccordionGroup>
  <Accordion title="Adjuntos y medios">
    - la ingesta de adjuntos entrantes está **desactivada de forma predeterminada** — define `channels.imessage.includeAttachments: true` para reenviar fotos, notas de voz, video y otros adjuntos al agente. Con esto deshabilitado, los iMessages que solo contienen adjuntos se descartan antes de llegar al agente y puede que no produzcan ninguna línea de log `Inbound message`.
    - las rutas remotas de adjuntos se pueden recuperar mediante SCP cuando `remoteHost` está definido
    - las rutas de adjuntos deben coincidir con raíces permitidas:
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
    Objetivos explícitos preferidos:

    - `chat_id:123` (recomendado para enrutamiento estable)
    - `chat_guid:...`
    - `chat_identifier:...`

    Los objetivos por identificador también son compatibles:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Acciones de API privada

Cuando `imsg launch` está en ejecución y `openclaw channels status --probe` informa `privateApi.available: true`, la herramienta de mensajes puede usar acciones nativas de iMessage además de los envíos de texto normales.

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Acciones disponibles">
    - **react**: Agrega/elimina tapbacks de iMessage (`messageId`, `emoji`, `remove`). Los tapbacks compatibles se asignan a amor, me gusta, no me gusta, risa, énfasis y pregunta.
    - **reply**: Envía una respuesta en hilo a un mensaje existente (`messageId`, `text` o `message`, más `chatGuid`, `chatId`, `chatIdentifier` o `to`).
    - **sendWithEffect**: Envía texto con un efecto de iMessage (`text` o `message`, `effect` o `effectId`).
    - **edit**: Edita un mensaje enviado en versiones compatibles de macOS/API privada (`messageId`, `text` o `newText`).
    - **unsend**: Retira un mensaje enviado en versiones compatibles de macOS/API privada (`messageId`).
    - **upload-file**: Envía medios/archivos (`buffer` como base64 o un `media`/`path`/`filePath` hidratado, `filename`, `asVoice` opcional). Alias heredado: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gestiona chats de grupo cuando el objetivo actual es una conversación de grupo.

  </Accordion>

  <Accordion title="ID de mensajes">
    El contexto entrante de iMessage incluye tanto valores cortos `MessageSid` como GUID completos de mensajes cuando están disponibles. Los ID cortos están limitados a la caché reciente de respuestas en memoria y se comprueban contra el chat actual antes de su uso. Si un ID corto ha caducado o pertenece a otro chat, vuelve a intentarlo con el `MessageSidFull` completo.

  </Accordion>

  <Accordion title="Detección de capacidades">
    OpenClaw oculta acciones de API privada solo cuando el estado de prueba en caché indica que el bridge no está disponible. Si el estado es desconocido, las acciones siguen visibles y el despacho ejecuta pruebas de forma diferida para que la primera acción pueda funcionar después de `imsg launch` sin una actualización de estado manual separada.

  </Accordion>

  <Accordion title="Confirmaciones de lectura y escritura">
    Cuando el bridge de API privada está activo, los chats entrantes aceptados se marcan como leídos antes del despacho y se muestra una burbuja de escritura al remitente mientras el agente genera la respuesta. Deshabilita el marcado de lectura con:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Las versiones antiguas de `imsg` anteriores a la lista de capacidades por método desactivarán silenciosamente escritura/lectura; OpenClaw registra una advertencia única por reinicio para que la confirmación faltante sea atribuible.

  </Accordion>

  <Accordion title="Tapbacks entrantes">
    OpenClaw se suscribe a los tapbacks de iMessage y enruta las reacciones aceptadas como eventos del sistema en lugar de texto de mensaje normal, de modo que un tapback de usuario no active un bucle de respuesta ordinario.

    El modo de notificación se controla mediante `channels.imessage.reactionNotifications`:

    - `"own"` (predeterminado): notifica solo cuando los usuarios reaccionan a mensajes escritos por el bot.
    - `"all"`: notifica todos los tapbacks entrantes de remitentes autorizados.
    - `"off"`: ignora los tapbacks entrantes.

    Las sobrescrituras por cuenta usan `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>
</AccordionGroup>

## Escrituras de configuración

iMessage permite escrituras de configuración iniciadas por el canal de forma predeterminada (para `/config set|unset` cuando `commands.config: true`).

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

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Coalescencia de MD con envío dividido (comando + URL en una composición)

Cuando un usuario escribe un comando y una URL juntos — por ejemplo `Dump https://example.com/article` — la app Messages de Apple divide el envío en **dos filas separadas de `chat.db`**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa OG como adjuntos.

Las dos filas llegan a OpenClaw con ~0.8-2.0 s de diferencia en la mayoría de configuraciones. Sin coalescencia, el agente recibe solo el comando en el turno 1, responde (a menudo "envíame la URL") y solo ve la URL en el turno 2 — momento en el que el contexto del comando ya se ha perdido. Este es el pipeline de envío de Apple, no algo que OpenClaw o `imsg` introduzcan.

`channels.imessage.coalesceSameSenderDms` opta por que un DM combine filas consecutivas del mismo remitente en un único turno del agente. Los chats grupales siguen despachándose mensaje por mensaje para preservar la estructura de turnos multiusuario.

<Tabs>
  <Tab title="When to enable">
    Actívalo cuando:

    - Envíes Skills que esperan `command + payload` en un solo mensaje (volcar, pegar, guardar, poner en cola, etc.).
    - Tus usuarios peguen URL, imágenes o contenido largo junto con comandos.
    - Puedas aceptar la latencia añadida al turno de DM (ver abajo).

    Déjalo desactivado cuando:

    - Necesites latencia mínima de comando para activadores de DM de una sola palabra.
    - Todos tus flujos sean comandos de una sola ejecución sin seguimientos con carga útil.

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Con la marca activada y sin `messages.inbound.byChannel.imessage` explícito, la ventana de antirrebote se amplía a **2500 ms** (el valor predeterminado heredado es 0 ms — sin antirrebote). La ventana más amplia es necesaria porque la cadencia de envíos divididos de Apple de 0.8-2.0 s no encaja en un valor predeterminado más ajustado.

    Para ajustar la ventana por tu cuenta:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **Latencia añadida para mensajes de DM.** Con la marca activada, cada DM (incluidos comandos de control independientes y seguimientos de texto único) espera hasta la ventana de antirrebote antes de despacharse, por si viene una fila con carga útil. Los mensajes de chat grupal mantienen el despacho instantáneo.
    - **La salida combinada está acotada.** El texto combinado se limita a 4000 caracteres con un marcador explícito `…[truncated]`; los adjuntos se limitan a 20; las entradas de origen se limitan a 10 (se conservan la primera y las más recientes más allá de eso). Cada GUID de origen se registra en `coalescedMessageGuids` para la telemetría posterior.
    - **Solo DM.** Los chats grupales pasan al despacho por mensaje para que el bot siga respondiendo cuando varias personas escriben.
    - **Opt-in, por canal.** Los demás canales (Telegram, WhatsApp, Slack, …) no se ven afectados. Las configuraciones heredadas de BlueBubbles que establecen `channels.bluebubbles.coalesceSameSenderDms` deben migrar ese valor a `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Escenarios y lo que ve el agente

| El usuario compone                                                  | `chat.db` produce        | Marca desactivada (predeterminado)                 | Marca activada + ventana de 2500 ms                                      |
| ------------------------------------------------------------------- | ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (un envío)                               | 2 filas con ~1 s entre sí | Dos turnos del agente: "Dump" solo, luego la URL   | Un turno: texto combinado `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (adjunto + texto)                   | 2 filas                  | Dos turnos (adjunto descartado al combinar)        | Un turno: texto + imagen preservados                                     |
| `/status` (comando independiente)                                   | 1 fila                   | Despacho instantáneo                               | **Espera hasta la ventana y luego despacha**                             |
| URL pegada sola                                                     | 1 fila                   | Despacho instantáneo                               | Despacho instantáneo (solo una entrada en el bucket)                     |
| Texto + URL enviados como dos mensajes separados deliberados, con minutos de diferencia | 2 filas fuera de la ventana | Dos turnos                                  | Dos turnos (la ventana expira entre ellos)                               |
| Ráfaga rápida (>10 DM pequeños dentro de la ventana)                | N filas                  | N turnos                                           | Un turno, salida acotada (primero + últimos, límites de texto/adjuntos aplicados) |
| Dos personas escribiendo en un chat grupal                          | N filas de M remitentes  | M+ turnos (uno por bucket de remitente)            | M+ turnos — los chats grupales no se combinan                            |

## Ponerse al día tras una caída del Gateway

Cuando el Gateway está sin conexión (fallo, reinicio, suspensión del Mac, máquina apagada), `imsg watch` se reanuda desde el estado actual de `chat.db` una vez que el Gateway vuelve a estar activo — todo lo que llegó durante el intervalo, de forma predeterminada, nunca se ve. La puesta al día reproduce esos mensajes en el siguiente inicio para que el agente no pierda silenciosamente el tráfico entrante.

La puesta al día está **desactivada de forma predeterminada**. Actívala por canal:

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### Cómo se ejecuta

Una pasada por cada inicio de `monitorIMessageProvider`, secuenciada como `imsg launch` listo → `watch.subscribe` → `performIMessageCatchup` → bucle de despacho en vivo. La puesta al día usa `chats.list` + `messages.history` por chat contra el mismo cliente JSON-RPC que usa `imsg watch`. Todo lo que llegue durante la pasada de puesta al día fluye normalmente por el despacho en vivo; la caché de desduplicación entrante existente absorbe cualquier solapamiento con filas reproducidas.

Cada fila reproducida pasa por la ruta de despacho en vivo (`evaluateIMessageInbound` + `dispatchInboundMessage`), por lo que las listas de permitidos, la política de grupo, el antirrebote, la caché de eco y las confirmaciones de lectura se comportan de forma idéntica en mensajes reproducidos y en vivo.

### Semántica de cursor y reintentos

La puesta al día mantiene un cursor por cuenta en `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (el directorio de estado de OpenClaw usa `~/.openclaw` de forma predeterminada, reemplazable con `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- El cursor avanza con cada despacho correcto y se mantiene cuando el despacho de una fila lanza una excepción — el siguiente inicio reintenta la misma fila desde el cursor retenido.
- Tras `maxFailureRetries` excepciones consecutivas contra el mismo `guid`, la puesta al día registra un `warn` y fuerza el avance del cursor más allá del mensaje atascado para que los inicios posteriores puedan progresar.
- Los guids ya abandonados se omiten al verlos (sin intento de despacho) en ejecuciones posteriores y se cuentan en `skippedGivenUp` en el resumen de ejecución.

### Señales visibles para el operador

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Una línea `WARN ... capped to perRunLimit` significa que un solo inicio no agotó todo el atraso. Aumenta `perRunLimit` (máx. 500) si tus intervalos superan regularmente la pasada predeterminada de 50 filas.

### Cuándo dejarlo desactivado

- El Gateway se ejecuta continuamente con reinicio automático por watchdog y los intervalos siempre son < unos segundos — el valor predeterminado desactivado está bien.
- El volumen de DM es bajo y los mensajes perdidos no cambiarían el comportamiento del agente — la ventana inicial `firstRunLookbackMinutes` puede despachar contexto antiguo inesperado al activarla por primera vez.

Cuando activas la puesta al día, el primer inicio sin cursor solo mira hacia atrás `firstRunLookbackMinutes` (30 min de forma predeterminada), no toda la ventana `maxAgeMinutes` — esto evita reproducir un historial largo de mensajes previos a la activación.

## Solución de problemas

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Valida el binario y la compatibilidad con RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Si la sonda informa que RPC no es compatible, actualiza `imsg`. Si las acciones de API privada no están disponibles, ejecuta `imsg launch` en la sesión del usuario de macOS con sesión iniciada y vuelve a ejecutar la sonda. Si el Gateway no se está ejecutando en macOS, usa la configuración de Mac remoto por SSH anterior en lugar de la ruta local predeterminada de `imsg`.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    El `cliPath: "imsg"` predeterminado debe ejecutarse en el Mac que tiene sesión iniciada en Mensajes. En Linux o Windows, establece `channels.imessage.cliPath` en un script envoltorio que se conecte por SSH a ese Mac y ejecute `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Luego ejecuta:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs are ignored">
    Comprueba:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprobaciones de emparejamiento (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    Comprueba:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamiento de lista de permitidos de `channels.imessage.groups`
    - configuración de patrones de mención (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    Comprueba:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticación con clave SSH/SCP desde el host del Gateway
    - que la clave de host exista en `~/.ssh/known_hosts` en el host del Gateway
    - legibilidad de la ruta remota en el Mac que ejecuta Mensajes

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Vuelve a ejecutar en una terminal GUI interactiva en el mismo contexto de usuario/sesión y aprueba los avisos:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirma que Acceso total al disco + Automatización estén concedidos para el contexto de proceso que ejecuta OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Referencias de configuración

- [Referencia de configuración - iMessage](/es/gateway/config-channels#imessage)
- [Configuración de Gateway](/es/gateway/configuration)
- [Emparejamiento](/es/channels/pairing)

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Eliminación de BlueBubbles y la ruta de iMessage con imsg](/es/announcements/bluebubbles-imessage) — anuncio y resumen de migración
- [Migrar desde BlueBubbles](/es/channels/imessage-from-bluebubbles) — tabla de traducción de configuración y transición paso a paso
- [Emparejamiento](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats grupales y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
