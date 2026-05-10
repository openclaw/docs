---
read_when:
    - Configuración del soporte de iMessage
    - Depuración del envío y la recepción de iMessage
summary: Compatibilidad nativa con iMessage mediante imsg (JSON-RPC sobre stdio), con acciones de API privada para respuestas, tapbacks, efectos, adjuntos y gestión de grupos. Preferido para nuevas configuraciones de OpenClaw iMessage cuando se cumplen los requisitos del host.
title: iMessage
x-i18n:
    generated_at: "2026-05-10T19:21:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 249d5faf9718e354caecaeb8ee22f66f9e24b50c6b091997d1c2286c44c1581d
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para despliegues de iMessage en OpenClaw, usa `imsg` en un host macOS Messages con sesión iniciada. Si tu Gateway se ejecuta en Linux o Windows, apunta `channels.imessage.cliPath` a un contenedor SSH que ejecute `imsg` en el Mac.

**La recuperación tras inactividad del Gateway es opcional.** Cuando está habilitada (`channels.imessage.catchup.enabled: true`), el gateway reproduce los mensajes entrantes que llegaron a `chat.db` mientras estaba sin conexión (fallo, reinicio, reposo del Mac) en el siguiente arranque. Deshabilitada de forma predeterminada — consulta [Recuperación tras inactividad del gateway](#catching-up-after-gateway-downtime). Cierra [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Se eliminó el soporte de BlueBubbles. Migra las configuraciones de `channels.bluebubbles` a `channels.imessage`; OpenClaw admite iMessage solo mediante `imsg`.
</Warning>

Estado: integración nativa de CLI externa. Gateway inicia `imsg rpc` y se comunica mediante JSON-RPC por stdio (sin demonio/puerto separado). Las acciones avanzadas requieren `imsg launch` y una prueba correcta de la API privada.

<CardGroup cols={3}>
  <Card title="Acciones de API privada" icon="wand-sparkles" href="#private-api-actions">
    Respuestas, tapbacks, efectos, adjuntos y gestión de grupos.
  </Card>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los DM de iMessage usan el modo de emparejamiento de forma predeterminada.
  </Card>
  <Card title="Mac remoto" icon="terminal" href="#remote-mac-over-ssh">
    Usa un contenedor SSH cuando el Gateway no se ejecute en el Mac con Messages.
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

      <Step title="Aprobar el primer emparejamiento de DM (dmPolicy predeterminada)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Las solicitudes de emparejamiento caducan después de 1 hora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto por SSH">
    OpenClaw solo requiere un `cliPath` compatible con stdio, así que puedes apuntar `cliPath` a un script contenedor que se conecte por SSH a un Mac remoto y ejecute `imsg`.

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

    Si `remoteHost` no está establecido, OpenClaw intenta detectarlo automáticamente analizando el script contenedor de SSH.
    `remoteHost` debe ser `host` o `user@host` (sin espacios ni opciones SSH).
    OpenClaw usa comprobación estricta de claves de host para SCP, por lo que la clave del host de retransmisión ya debe existir en `~/.ssh/known_hosts`.
    Las rutas de adjuntos se validan contra las raíces permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisitos y permisos (macOS)

- Messages debe tener una sesión iniciada en el Mac que ejecuta `imsg`.
- Se requiere Acceso total al disco para el contexto de proceso que ejecuta OpenClaw/`imsg` (acceso a la base de datos de Messages).
- Se requiere permiso de automatización para enviar mensajes mediante Messages.app.
- Para acciones avanzadas (reaccionar / editar / anular envío / respuesta en hilo / efectos / operaciones de grupo), System Integrity Protection debe estar deshabilitado — consulta [Habilitar la API privada de imsg](#enabling-the-imsg-private-api) más abajo. El envío/recepción básico de texto y medios funciona sin ello.

<Tip>
Los permisos se conceden por contexto de proceso. Si gateway se ejecuta sin interfaz (LaunchAgent/SSH), ejecuta un comando interactivo una sola vez en ese mismo contexto para activar las solicitudes:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Habilitar la API privada de imsg

`imsg` se distribuye en dos modos operativos:

- **Modo básico** (predeterminado, sin cambios de SIP necesarios): texto y medios salientes mediante `send`, observación/historial entrante, lista de chats. Esto es lo que obtienes de inmediato con una instalación nueva de `brew install steipete/tap/imsg` más los permisos estándar de macOS indicados arriba.
- **Modo de API privada**: `imsg` inyecta una dylib auxiliar en `Messages.app` para llamar funciones internas de `IMCore`. Esto habilita `react`, `edit`, `unsend`, `reply` (en hilo), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, además de indicadores de escritura y confirmaciones de lectura.

Para llegar a la superficie de acciones avanzadas que documenta esta página de canal, necesitas el modo de API privada. El README de `imsg` es explícito sobre el requisito:

> Las funciones avanzadas como `read`, `typing`, `launch`, envío enriquecido respaldado por puente, mutación de mensajes y gestión de chats son opcionales. Requieren que SIP esté deshabilitado y que se inyecte una dylib auxiliar en `Messages.app`. `imsg launch` se niega a inyectar cuando SIP está habilitado.

La técnica de inyección auxiliar usa la propia dylib de `imsg` para acceder a las API privadas de Messages. No hay ningún servidor de terceros ni runtime de BlueBubbles en la ruta de iMessage de OpenClaw.

<Warning>
**Deshabilitar SIP es una concesión de seguridad real.** SIP es una de las protecciones centrales de macOS contra la ejecución de código de sistema modificado; desactivarlo en todo el sistema abre superficie de ataque adicional y efectos secundarios. En particular, **deshabilitar SIP en Macs con Apple Silicon también deshabilita la capacidad de instalar y ejecutar apps de iOS en tu Mac**.

Trata esto como una decisión operativa deliberada, no como un valor predeterminado. Si tu modelo de amenazas no puede tolerar que SIP esté desactivado, iMessage incluido queda limitado al modo básico: solo envío/recepción de texto y medios, sin reacciones / edición / anulación de envío / efectos / operaciones de grupo.
</Warning>

### Configuración

1. **Instala (o actualiza) `imsg`** en el Mac que ejecuta Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   La salida de `imsg status --json` informa `bridge_version`, `rpc_methods` y `selectors` por método para que puedas ver qué admite la compilación actual antes de empezar.

2. **Deshabilita System Integrity Protection.** Esto depende de la versión de macOS porque el requisito subyacente de Apple depende del sistema operativo y del hardware:
   - **macOS 10.13–10.15 (Sierra–Catalina):** deshabilita Library Validation mediante Terminal, reinicia en Recovery Mode, ejecuta `csrutil disable`, reinicia.
   - **macOS 11+ (Big Sur y posteriores), Intel:** Recovery Mode (o Internet Recovery), `csrutil disable`, reinicia.
   - **macOS 11+, Apple Silicon:** secuencia de arranque con el botón de encendido para entrar en Recovery; en versiones recientes de macOS mantén pulsada la tecla **Mayús izquierda** cuando hagas clic en Continuar, luego `csrutil disable`. Las configuraciones de máquina virtual siguen un flujo separado — crea primero una instantánea de la VM.
   - **macOS 26 / Tahoe:** las políticas de validación de bibliotecas y las comprobaciones de derechos privados de `imagent` se han endurecido aún más; `imsg` puede necesitar una compilación actualizada para mantenerse compatible. Si la inyección de `imsg launch` o `selectors` específicos empiezan a devolver false después de una actualización mayor de macOS, revisa las notas de la versión de `imsg` antes de asumir que el paso de SIP tuvo éxito.

   Sigue el flujo de Recovery mode de Apple para tu Mac a fin de deshabilitar SIP antes de ejecutar `imsg launch`.

3. **Inyecta el auxiliar.** Con SIP deshabilitado y Messages.app con sesión iniciada:

   ```bash
   imsg launch
   ```

   `imsg launch` se niega a inyectar cuando SIP sigue habilitado, así que esto también sirve como confirmación de que el paso 2 surtió efecto.

4. **Verifica el puente desde OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   La entrada de iMessage debería informar `works`, y `imsg status --json | jq '.selectors'` debería mostrar `retractMessagePart: true` además de los selectores de edición / escritura / lectura que exponga tu compilación de macOS. La compuerta por método del Plugin de OpenClaw en `actions.ts` solo anuncia acciones cuyo selector subyacente es `true`, por lo que la superficie de acciones que ves en la lista de herramientas del agente refleja lo que el puente realmente puede hacer en este host.

Si `openclaw channels status --probe` informa el canal como `works`, pero acciones específicas lanzan "iMessage `<action>` requires the imsg private API bridge" en tiempo de despacho, ejecuta `imsg launch` otra vez: el auxiliar puede dejar de estar activo (reinicio de Messages.app, actualización del sistema operativo, etc.) y el estado en caché `available: true` seguirá anunciando acciones hasta que la siguiente prueba lo actualice.

### Cuando no puedes deshabilitar SIP

Si SIP deshabilitado no es aceptable para tu modelo de amenazas:

- `imsg` vuelve al modo básico: solo texto + medios + recepción.
- El Plugin de OpenClaw sigue anunciando envío de texto/medios y supervisión entrante; simplemente oculta `react`, `edit`, `unsend`, `reply`, `sendWithEffect` y operaciones de grupo de la superficie de acciones (según la compuerta de capacidad por método).
- Puedes ejecutar un Mac separado que no sea Apple Silicon (o un Mac dedicado para bot) con SIP desactivado para la carga de trabajo de iMessage, mientras mantienes SIP habilitado en tus dispositivos principales. Consulta [Usuario macOS dedicado para bot (identidad de iMessage separada)](#deployment-patterns) más abajo.

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

    Repliegue en runtime: si `groupAllowFrom` no está definido, las comprobaciones de remitente de grupo de iMessage recurren a `allowFrom` cuando está disponible.
    Nota de runtime: si `channels.imessage` falta por completo, runtime recurre a `groupPolicy="allowlist"` y registra una advertencia (incluso si `channels.defaults.groupPolicy` está establecido).

    <Warning>
    El enrutamiento de grupo tiene **dos** compuertas de lista de permitidos que se ejecutan una tras otra, y ambas deben pasar:

    1. **Lista de permitidos de remitente / objetivo de chat** (`channels.imessage.groupAllowFrom`) — identificador, `chat_guid`, `chat_identifier` o `chat_id`.
    2. **Registro de grupos** (`channels.imessage.groups`) — con `groupPolicy: "allowlist"`, esta compuerta requiere una entrada comodín `groups: { "*": { ... } }` (establece `allowAll = true`) o una entrada explícita por `chat_id` bajo `groups`.

    Si la compuerta 2 no contiene nada, todos los mensajes de grupo se descartan. El Plugin emite dos señales de nivel `warn` con el nivel de registro predeterminado:

    - una vez por cuenta al iniciar: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - una vez por `chat_id` en runtime: `imessage: dropping group message from chat_id=<id> ...`

    Los DM siguen funcionando porque toman una ruta de código diferente.

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

    Si esas líneas `warn` aparecen en el registro de gateway, la compuerta 2 está descartando mensajes — agrega el bloque `groups`.
    </Warning>

    Compuerta de menciones para grupos:

    - iMessage no tiene metadatos nativos de menciones
    - la detección de menciones usa patrones regex (`agents.list[].groupChat.mentionPatterns`, respaldo `messages.groupChat.mentionPatterns`)
    - sin patrones configurados, no se puede aplicar el control por menciones

    Los comandos de control de remitentes autorizados pueden omitir el control por menciones en grupos.

    `systemPrompt` por grupo:

    Cada entrada bajo `channels.imessage.groups.*` acepta una cadena opcional `systemPrompt`. El valor se inyecta en el prompt del sistema del agente en cada turno que gestiona un mensaje en ese grupo. La resolución refleja la resolución de prompt por grupo usada por `channels.whatsapp.groups`:

    1. **Prompt del sistema específico del grupo** (`groups["<chat_id>"].systemPrompt`): se usa cuando la entrada específica del grupo existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), el comodín se suprime y no se aplica ningún prompt del sistema a ese grupo.
    2. **Prompt del sistema comodín de grupo** (`groups["*"].systemPrompt`): se usa cuando la entrada específica del grupo está ausente por completo del mapa, o cuando existe pero no define ninguna clave `systemPrompt`.

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

    Los prompts por grupo solo se aplican a los mensajes de grupo; los mensajes directos en este canal no se ven afectados.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - Los MD usan enrutamiento directo; los grupos usan enrutamiento de grupo.
    - Con `session.dmScope=main` predeterminado, los MD de iMessage se colapsan en la sesión principal del agente.
    - Las sesiones de grupo están aisladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Las respuestas se enrutan de vuelta a iMessage usando metadatos del canal/objetivo de origen.

    Comportamiento de hilos similares a grupos:

    Algunos hilos de iMessage con varios participantes pueden llegar con `is_group=false`.
    Si ese `chat_id` está configurado explícitamente bajo `channels.imessage.groups`, OpenClaw lo trata como tráfico de grupo (control de grupo + aislamiento de sesión de grupo).

  </Tab>
</Tabs>

## Enlaces de conversación ACP

Los chats heredados de iMessage también se pueden enlazar a sesiones ACP.

Flujo rápido del operador:

- Ejecuta `/acp spawn codex --bind here` dentro del MD o chat de grupo permitido.
- Los mensajes futuros en esa misma conversación de iMessage se enrutan a la sesión ACP creada.
- `/new` y `/reset` restablecen la misma sesión ACP enlazada en el lugar.
- `/acp close` cierra la sesión ACP y elimina el enlace.

Se admiten enlaces persistentes configurados mediante entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "imessage"`.

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
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Usa un Apple ID y un usuario de macOS dedicados para que el tráfico del bot quede aislado de tu perfil personal de Messages.

    Flujo típico:

    1. Crea/inicia sesión en un usuario de macOS dedicado.
    2. Inicia sesión en Messages con el Apple ID del bot en ese usuario.
    3. Instala `imsg` en ese usuario.
    4. Crea un wrapper SSH para que OpenClaw pueda ejecutar `imsg` en el contexto de ese usuario.
    5. Apunta `channels.imessage.accounts.<id>.cliPath` y `.dbPath` a ese perfil de usuario.

    La primera ejecución puede requerir aprobaciones en la GUI (Automatización + Acceso total al disco) en esa sesión de usuario del bot.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Topología común:

    - el gateway se ejecuta en Linux/VM
    - iMessage + `imsg` se ejecuta en una Mac de tu tailnet
    - el wrapper `cliPath` usa SSH para ejecutar `imsg`
    - `remoteHost` habilita la obtención de archivos adjuntos por SCP

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
    Asegúrate primero de que la clave del host sea de confianza (por ejemplo `ssh bot@mac-mini.tailnet-1234.ts.net`) para que se rellene `known_hosts`.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage admite configuración por cuenta bajo `channels.imessage.accounts`.

    Cada cuenta puede sobrescribir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, ajustes de historial y listas de permitidos de raíz de adjuntos.

  </Accordion>
</AccordionGroup>

## Multimedia, fragmentación y objetivos de entrega

<AccordionGroup>
  <Accordion title="Attachments and media">
    - la ingesta de adjuntos entrantes está **desactivada de forma predeterminada**; establece `channels.imessage.includeAttachments: true` para reenviar fotos, notas de voz, video y otros adjuntos al agente. Con esto deshabilitado, los iMessages que solo contienen adjuntos se descartan antes de llegar al agente y puede que no produzcan ninguna línea de registro `Inbound message`.
    - las rutas de adjuntos remotas se pueden obtener mediante SCP cuando `remoteHost` está configurado
    - las rutas de adjuntos deben coincidir con raíces permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - patrón de raíz predeterminado: `/Users/*/Library/Messages/Attachments`
    - SCP usa comprobación estricta de clave de host (`StrictHostKeyChecking=yes`)
    - el tamaño de multimedia saliente usa `channels.imessage.mediaMaxMb` (predeterminado 16 MB)

  </Accordion>

  <Accordion title="Outbound chunking">
    - límite de fragmento de texto: `channels.imessage.textChunkLimit` (predeterminado 4000)
    - modo de fragmentación: `channels.imessage.chunkMode`
      - `length` (predeterminado)
      - `newline` (división priorizando párrafos)

  </Accordion>

  <Accordion title="Addressing formats">
    Objetivos explícitos preferidos:

    - `chat_id:123` (recomendado para enrutamiento estable)
    - `chat_guid:...`
    - `chat_identifier:...`

    También se admiten objetivos por identificador:

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
  <Accordion title="Available actions">
    - **react**: añade/elimina tapbacks de iMessage (`messageId`, `emoji`, `remove`). Los tapbacks admitidos se asignan a amor, me gusta, no me gusta, risa, énfasis y pregunta.
    - **reply**: envía una respuesta en hilo a un mensaje existente (`messageId`, `text` o `message`, además de `chatGuid`, `chatId`, `chatIdentifier` o `to`).
    - **sendWithEffect**: envía texto con un efecto de iMessage (`text` o `message`, `effect` o `effectId`).
    - **edit**: edita un mensaje enviado en versiones de macOS/API privada compatibles (`messageId`, `text` o `newText`).
    - **unsend**: retrae un mensaje enviado en versiones de macOS/API privada compatibles (`messageId`).
    - **upload-file**: envía multimedia/archivos (`buffer` como base64 o un `media`/`path`/`filePath` hidratado, `filename`, `asVoice` opcional). Alias heredado: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: gestiona chats de grupo cuando el objetivo actual es una conversación de grupo.

  </Accordion>

  <Accordion title="Message IDs">
    El contexto entrante de iMessage incluye tanto valores `MessageSid` cortos como GUIDs completos de mensaje cuando están disponibles. Los ID cortos están limitados a la caché reciente de respuestas en memoria y se comprueban contra el chat actual antes de usarse. Si un ID corto ha caducado o pertenece a otro chat, vuelve a intentarlo con el `MessageSidFull` completo.

  </Accordion>

  <Accordion title="Capability detection">
    OpenClaw oculta las acciones de API privada solo cuando el estado de sondeo en caché indica que el puente no está disponible. Si el estado es desconocido, las acciones permanecen visibles y el despacho sondea de forma diferida para que la primera acción pueda tener éxito después de `imsg launch` sin una actualización manual de estado por separado.

  </Accordion>

  <Accordion title="Read receipts and typing">
    Cuando el puente de API privada está activo, los chats entrantes aceptados se marcan como leídos antes del despacho y se muestra una burbuja de escritura al remitente mientras el agente genera la respuesta. Deshabilita el marcado de lectura con:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Las compilaciones antiguas de `imsg` anteriores a la lista de capacidades por método desactivarán la escritura/lectura silenciosamente; OpenClaw registra una advertencia única por reinicio para que el recibo faltante sea atribuible.

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

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Fusión de MD enviados por separado (comando + URL en una composición)

Cuando un usuario escribe un comando y una URL juntos, por ejemplo `Dump https://example.com/article`, la app Messages de Apple divide el envío en **dos filas separadas de `chat.db`**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa OG como adjuntos.

Las dos filas llegan a OpenClaw con ~0,8-2,0 s de diferencia en la mayoría de las configuraciones. Sin fusión, el agente recibe solo el comando en el turno 1, responde (a menudo "send me the URL") y solo ve la URL en el turno 2, momento en el que el contexto del comando ya se perdió. Este es el pipeline de envío de Apple, no algo que OpenClaw o `imsg` introduzcan.

`channels.imessage.coalesceSameSenderDms` opta un MD para fusionar filas consecutivas del mismo remitente en un único turno del agente. Los chats de grupo siguen despachándose por mensaje para preservar la estructura de turnos multiusuario.

<Tabs>
  <Tab title="When to enable">
    Habilítalo cuando:

    - Distribuyas skills que esperan `command + payload` en un solo mensaje (dump, paste, save, queue, etc.).
    - Tus usuarios peguen URLs, imágenes o contenido largo junto a comandos.
    - Puedes aceptar la latencia adicional de turno de MD (consulta abajo).

    Déjalo deshabilitado cuando:

    - Necesites latencia mínima de comandos para activadores de MD de una sola palabra.
    - Todos tus flujos sean comandos de una sola ejecución sin seguimientos de carga útil.

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

    Con la marca activada y sin `messages.inbound.byChannel.imessage` explícito, la ventana de antirrebote se amplía a **2500 ms** (el valor predeterminado heredado es 0 ms: sin antirrebote). La ventana más amplia es necesaria porque la cadencia de envío dividido de Apple de 0.8-2.0 s no cabe en un valor predeterminado más ajustado.

    Para ajustar la ventana tú mismo:

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
  <Tab title="Concesiones">
    - **Latencia añadida para mensajes de MD.** Con la marca activada, cada MD (incluidos los comandos de control independientes y los seguimientos de texto único) espera hasta la ventana de antirrebote antes de enviarse, por si llega una fila de carga útil. Los mensajes de chat grupal mantienen el envío instantáneo.
    - **La salida combinada está acotada.** El texto combinado tiene un límite de 4000 caracteres con un marcador explícito `…[truncated]`; los adjuntos tienen un límite de 20; las entradas de origen tienen un límite de 10 (se conservan la primera y las más recientes más allá de eso). Cada GUID de origen se rastrea en `coalescedMessageGuids` para la telemetría posterior.
    - **Solo MD.** Los chats grupales pasan al envío por mensaje para que el bot siga respondiendo cuando varias personas escriben.
    - **Con activación explícita, por canal.** Otros canales (Telegram, WhatsApp, Slack, …) no se ven afectados. Las configuraciones heredadas de BlueBubbles que establecen `channels.bluebubbles.coalesceSameSenderDms` deben migrar ese valor a `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Escenarios y lo que ve el agente

| El usuario redacta                                                  | `chat.db` produce         | Marca desactivada (predeterminado)          | Marca activada + ventana de 2500 ms                                      |
| ------------------------------------------------------------------- | ------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (un envío)                               | 2 filas con ~1 s de diferencia | Dos turnos del agente: "Dump" solo, luego la URL | Un turno: texto combinado `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (adjunto + texto)                   | 2 filas                   | Dos turnos (adjunto descartado al combinar) | Un turno: texto + imagen preservados                                     |
| `/status` (comando independiente)                                   | 1 fila                    | Envío instantáneo                           | **Espera hasta la ventana y luego envía**                                |
| URL pegada sola                                                     | 1 fila                    | Envío instantáneo                           | Envío instantáneo (solo una entrada en el cubo)                          |
| Texto + URL enviados como dos mensajes separados deliberados, con minutos de diferencia | 2 filas fuera de la ventana | Dos turnos                                  | Dos turnos (la ventana expira entre ellos)                               |
| Ráfaga rápida (>10 MD pequeños dentro de la ventana)                | N filas                   | N turnos                                    | Un turno, salida acotada (primera + últimas, límites de texto/adjuntos aplicados) |
| Dos personas escribiendo en un chat grupal                          | N filas de M remitentes   | M+ turnos (uno por cubo de remitente)       | M+ turnos: los chats grupales no se fusionan                             |

## Ponerse al día tras una interrupción del Gateway

Cuando el Gateway está sin conexión (bloqueo, reinicio, reposo del Mac, máquina apagada), `imsg watch` se reanuda desde el estado actual de `chat.db` cuando el Gateway vuelve a estar activo; todo lo que haya llegado durante la interrupción, de forma predeterminada, nunca se ve. La recuperación reproduce esos mensajes en el siguiente inicio para que el agente no pierda tráfico entrante silenciosamente.

La recuperación está **desactivada de forma predeterminada**. Actívala por canal:

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

Una pasada por cada inicio de `monitorIMessageProvider`, secuenciada como `imsg launch` listo → `watch.subscribe` → `performIMessageCatchup` → bucle de envío en vivo. La recuperación en sí usa `chats.list` + `messages.history` por chat contra el mismo cliente JSON-RPC que usa `imsg watch`. Todo lo que llega durante la pasada de recuperación fluye normalmente por el envío en vivo; la caché existente de deduplicación entrante absorbe cualquier solapamiento con las filas reproducidas.

Cada fila reproducida pasa por la ruta de envío en vivo (`evaluateIMessageInbound` + `dispatchInboundMessage`), por lo que las listas de permitidos, la política de grupo, el antirrebote, la caché de eco y las confirmaciones de lectura se comportan de forma idéntica en mensajes reproducidos y en vivo.

### Semántica de cursor y reintento

La recuperación mantiene un cursor por cuenta en `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (el directorio de estado de OpenClaw tiene como valor predeterminado `~/.openclaw`, y se puede sobrescribir con `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- El cursor avanza tras cada envío correcto y se mantiene cuando el envío de una fila lanza una excepción; el siguiente inicio reintenta la misma fila desde el cursor mantenido.
- Después de `maxFailureRetries` excepciones consecutivas contra el mismo `guid`, la recuperación registra un `warn` y fuerza el avance del cursor más allá del mensaje atascado para que los inicios posteriores puedan avanzar.
- Los guid ya abandonados se omiten al verlos (sin intento de envío) en ejecuciones posteriores y se contabilizan en `skippedGivenUp` en el resumen de la ejecución.

### Señales visibles para el operador

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Una línea `WARN ... capped to perRunLimit` significa que un único inicio no drenó todo el trabajo pendiente. Aumenta `perRunLimit` (máximo 500) si tus interrupciones superan con frecuencia la pasada predeterminada de 50 filas.

### Cuándo dejarlo desactivado

- El Gateway se ejecuta continuamente con reinicio automático mediante watchdog y las interrupciones siempre duran < unos segundos; el valor predeterminado desactivado está bien.
- El volumen de MD es bajo y los mensajes perdidos no cambiarían el comportamiento del agente; la ventana inicial `firstRunLookbackMinutes` puede enviar contexto antiguo inesperado en la primera activación.

Cuando activas la recuperación, el primer inicio sin cursor solo mira hacia atrás `firstRunLookbackMinutes` (30 min de forma predeterminada), no toda la ventana `maxAgeMinutes`; esto evita reproducir un historial largo de mensajes previos a la activación.

## Solución de problemas

<AccordionGroup>
  <Accordion title="imsg no encontrado o RPC no compatible">
    Valida el binario y la compatibilidad con RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Si el sondeo informa que RPC no es compatible, actualiza `imsg`. Si las acciones de API privada no están disponibles, ejecuta `imsg launch` en la sesión del usuario de macOS con sesión iniciada y vuelve a sondear. Si el Gateway no se está ejecutando en macOS, usa la configuración de Mac remoto por SSH anterior en lugar de la ruta local predeterminada de `imsg`.

  </Accordion>

  <Accordion title="Gateway no se está ejecutando en macOS">
    El valor predeterminado `cliPath: "imsg"` debe ejecutarse en el Mac con sesión iniciada en Mensajes. En Linux o Windows, establece `channels.imessage.cliPath` en un script envoltorio que se conecte por SSH a ese Mac y ejecute `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Luego ejecuta:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="Los DM se ignoran">
    Comprueba:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprobaciones de emparejamiento (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Los mensajes de grupo se ignoran">
    Comprueba:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamiento de la lista de permitidos de `channels.imessage.groups`
    - configuración del patrón de mención (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Los adjuntos remotos fallan">
    Comprueba:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticación con clave SSH/SCP desde el host del gateway
    - la clave del host existe en `~/.ssh/known_hosts` en el host del gateway
    - legibilidad de la ruta remota en el Mac que ejecuta Mensajes

  </Accordion>

  <Accordion title="Se omitieron los avisos de permisos de macOS">
    Vuelve a ejecutar en una terminal GUI interactiva en el mismo contexto de usuario/sesión y aprueba los avisos:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirma que Acceso completo al disco y Automatización estén concedidos para el contexto del proceso que ejecuta OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Punteros de referencia de configuración

- [Referencia de configuración - iMessage](/es/gateway/config-channels#imessage)
- [Configuración de Gateway](/es/gateway/configuration)
- [Emparejamiento](/es/channels/pairing)

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales compatibles
- [Migración desde BlueBubbles](/es/channels/imessage-from-bluebubbles) — tabla de traducción de configuración y migración paso a paso
- [Emparejamiento](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat de grupo y control de acceso por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
