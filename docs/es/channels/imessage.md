---
read_when:
    - Configurar la compatibilidad con iMessage
    - Depuración del envío/recepción de iMessage
summary: Compatibilidad nativa con iMessage mediante imsg (JSON-RPC sobre stdio), con acciones de API privada para respuestas, tapbacks, efectos, adjuntos y gestión de grupos. Preferido para nuevas configuraciones de OpenClaw iMessage cuando se cumplen los requisitos del host.
title: iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbce499e35c3dac12e6bb3f157d624a02a9bc8c26356f3decdfe62c85db6ee15
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para despliegues de iMessage de OpenClaw, usa `imsg` en un equipo macOS con sesión iniciada en Messages. Si tu Gateway se ejecuta en Linux o Windows, apunta `channels.imessage.cliPath` a un script envoltorio de SSH que ejecute `imsg` en el Mac.

**La puesta al día tras tiempo de inactividad del Gateway es de activación explícita.** Cuando está habilitada (`channels.imessage.catchup.enabled: true`), el gateway reproduce los mensajes entrantes que llegaron a `chat.db` mientras estaba sin conexión (fallo, reinicio, reposo del Mac) en el siguiente arranque. Está deshabilitada de forma predeterminada; consulta [Ponerse al día después del tiempo de inactividad del gateway](#catching-up-after-gateway-downtime). Cierra [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Se eliminó la compatibilidad con BlueBubbles. Migra las configuraciones de `channels.bluebubbles` a `channels.imessage`; OpenClaw admite iMessage solo mediante `imsg`. Empieza con [Eliminación de BlueBubbles y la ruta de iMessage con imsg](/es/announcements/bluebubbles-imessage) para el anuncio breve, o [Si vienes de BlueBubbles](/es/channels/imessage-from-bluebubbles) para la tabla completa de migración.
</Warning>

Estado: integración nativa con CLI externa. Gateway lanza `imsg rpc` y se comunica por JSON-RPC en stdio (sin demonio/puerto separado). Las acciones avanzadas requieren `imsg launch` y un sondeo correcto de la API privada.

<CardGroup cols={3}>
  <Card title="Acciones de API privada" icon="wand-sparkles" href="#private-api-actions">
    Respuestas, tapbacks, efectos, adjuntos y administración de grupos.
  </Card>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los mensajes directos de iMessage usan el modo de emparejamiento de forma predeterminada.
  </Card>
  <Card title="Mac remoto" icon="terminal" href="#remote-mac-over-ssh">
    Usa un script envoltorio de SSH cuando el Gateway no se ejecute en el Mac de Messages.
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

      <Step title="Aprobar el primer emparejamiento de mensajes directos (dmPolicy predeterminada)">

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

    Si `remoteHost` no está configurado, OpenClaw intenta detectarlo automáticamente analizando el script envoltorio de SSH.
    `remoteHost` debe ser `host` o `user@host` (sin espacios ni opciones de SSH).
    OpenClaw usa verificación estricta de clave de host para SCP, así que la clave del host de retransmisión ya debe existir en `~/.ssh/known_hosts`.
    Las rutas de adjuntos se validan contra raíces permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisitos y permisos (macOS)

- Messages debe tener una sesión iniciada en el Mac que ejecuta `imsg`.
- Se requiere Acceso total al disco para el contexto de proceso que ejecuta OpenClaw/`imsg` (acceso a la base de datos de Messages).
- Se requiere permiso de Automatización para enviar mensajes mediante Messages.app.
- Para acciones avanzadas (reaccionar / editar / deshacer envío / respuesta en hilo / efectos / operaciones de grupo), la Protección de integridad del sistema debe estar deshabilitada; consulta [Habilitar la API privada de imsg](#enabling-the-imsg-private-api) a continuación. El envío y la recepción básicos de texto y contenido multimedia funcionan sin esto.

<Tip>
Los permisos se conceden por contexto de proceso. Si el gateway se ejecuta sin interfaz gráfica (LaunchAgent/SSH), ejecuta un comando interactivo una sola vez en ese mismo contexto para activar los avisos:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Habilitar la API privada de imsg

`imsg` se distribuye con dos modos operativos:

- **Modo básico** (predeterminado, no requiere cambios de SIP): texto saliente y contenido multimedia mediante `send`, vigilancia/historial entrante, lista de chats. Esto es lo que obtienes de inmediato con un `brew install steipete/tap/imsg` nuevo más los permisos estándar de macOS indicados arriba.
- **Modo de API privada**: `imsg` inyecta una dylib auxiliar en `Messages.app` para llamar funciones internas de `IMCore`. Esto desbloquea `react`, `edit`, `unsend`, `reply` (en hilo), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, además de indicadores de escritura y confirmaciones de lectura.

Para llegar a la superficie de acciones avanzadas que documenta esta página del canal, necesitas el modo de API privada. El README de `imsg` es explícito sobre el requisito:

> Las funciones avanzadas como `read`, `typing`, `launch`, envío enriquecido respaldado por puente, mutación de mensajes y administración de chats son de activación explícita. Requieren que SIP esté deshabilitado y que se inyecte una dylib auxiliar en `Messages.app`. `imsg launch` se niega a inyectar cuando SIP está habilitado.

La técnica de inyección del auxiliar usa la propia dylib de `imsg` para llegar a las API privadas de Messages. No hay ningún servidor de terceros ni entorno de ejecución de BlueBubbles en la ruta de iMessage de OpenClaw.

<Warning>
**Deshabilitar SIP implica una concesión real de seguridad.** SIP es una de las protecciones principales de macOS contra la ejecución de código de sistema modificado; desactivarlo en todo el sistema abre superficie de ataque adicional y efectos secundarios. En particular, **deshabilitar SIP en Macs con Apple Silicon también deshabilita la capacidad de instalar y ejecutar apps de iOS en tu Mac**.

Trata esto como una elección operativa deliberada, no como un valor predeterminado. Si tu modelo de amenazas no puede tolerar que SIP esté desactivado, el iMessage incluido queda limitado al modo básico: solo envío/recepción de texto y contenido multimedia, sin reacciones / edición / deshacer envío / efectos / operaciones de grupo.
</Warning>

### Configuración

1. **Instala (o actualiza) `imsg`** en el Mac que ejecuta Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   La salida de `imsg status --json` informa `bridge_version`, `rpc_methods` y `selectors` por método para que puedas ver qué admite la compilación actual antes de empezar.

2. **Deshabilita la Protección de integridad del sistema.** Esto depende de la versión de macOS porque el requisito subyacente de Apple depende del sistema operativo y del hardware:
   - **macOS 10.13–10.15 (Sierra–Catalina):** deshabilita Validación de bibliotecas mediante Terminal, reinicia en modo de recuperación, ejecuta `csrutil disable`, reinicia.
   - **macOS 11+ (Big Sur y posteriores), Intel:** modo de recuperación (o recuperación por Internet), `csrutil disable`, reinicia.
   - **macOS 11+, Apple Silicon:** secuencia de arranque con el botón de encendido para entrar en recuperación; en versiones recientes de macOS, mantén pulsada la tecla **Mayús izquierda** al hacer clic en Continuar, luego `csrutil disable`. Las configuraciones de máquina virtual siguen un flujo separado; toma primero una instantánea de la VM.
   - **macOS 26 / Tahoe:** las políticas de validación de bibliotecas y las comprobaciones de derechos privados de `imagent` se han endurecido aún más; `imsg` puede necesitar una compilación actualizada para mantenerse al día. Si la inyección de `imsg launch` o `selectors` específicos empiezan a devolver false después de una actualización mayor de macOS, revisa las notas de lanzamiento de `imsg` antes de asumir que el paso de SIP se realizó correctamente.

   Sigue el flujo de modo de recuperación de Apple para tu Mac para deshabilitar SIP antes de ejecutar `imsg launch`.

3. **Inyecta el auxiliar.** Con SIP deshabilitado y sesión iniciada en Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` se niega a inyectar cuando SIP sigue habilitado, así que esto también sirve como confirmación de que el paso 2 surtió efecto.

4. **Verifica el puente desde OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   La entrada de iMessage debería informar `works`, y `imsg status --json | jq '.selectors'` debería mostrar `retractMessagePart: true` además de los selectores de edición / escritura / lectura que exponga tu compilación de macOS. El control por método del Plugin de OpenClaw en `actions.ts` solo anuncia acciones cuyo selector subyacente es `true`, así que la superficie de acciones que ves en la lista de herramientas del agente refleja lo que el puente puede hacer realmente en este host.

Si `openclaw channels status --probe` informa que el canal está en `works` pero acciones específicas lanzan "iMessage `<action>` requires the imsg private API bridge" al despachar, ejecuta `imsg launch` de nuevo: el auxiliar puede dejar de estar cargado (reinicio de Messages.app, actualización del sistema operativo, etc.) y el estado en caché `available: true` seguirá anunciando acciones hasta que el siguiente sondeo lo actualice.

### Cuando no puedes deshabilitar SIP

Si deshabilitar SIP no es aceptable para tu modelo de amenazas:

- `imsg` vuelve al modo básico: solo texto + contenido multimedia + recepción.
- El Plugin de OpenClaw todavía anuncia el envío de texto/multimedia y la supervisión entrante; simplemente oculta `react`, `edit`, `unsend`, `reply`, `sendWithEffect` y las operaciones de grupo de la superficie de acciones (según el control de capacidad por método).
- Puedes ejecutar un Mac separado que no sea Apple Silicon (o un Mac de bot dedicado) con SIP desactivado para la carga de trabajo de iMessage, manteniendo SIP habilitado en tus dispositivos principales. Consulta [Usuario de macOS dedicado para el bot (identidad de iMessage separada)](#deployment-patterns) a continuación.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.imessage.dmPolicy` controla los mensajes directos:

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    Campo de lista de permitidos: `channels.imessage.allowFrom`.

    Las entradas de la lista de permitidos pueden ser identificadores, grupos estáticos de acceso de remitentes (`accessGroup:<name>`) o destinos de chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Política de grupos + menciones">
    `channels.imessage.groupPolicy` controla el manejo de grupos:

    - `allowlist` (predeterminado cuando está configurado)
    - `open`
    - `disabled`

    Lista de permitidos de remitentes de grupo: `channels.imessage.groupAllowFrom`.

    Las entradas de `groupAllowFrom` también pueden hacer referencia a grupos estáticos de acceso de remitentes (`accessGroup:<name>`).

    Comportamiento alternativo en tiempo de ejecución: si `groupAllowFrom` no está configurado, las comprobaciones de remitentes de grupos de iMessage recurren a `allowFrom` cuando está disponible.
    Nota en tiempo de ejecución: si `channels.imessage` falta por completo, el tiempo de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (aunque `channels.defaults.groupPolicy` esté configurado).

    <Warning>
    El enrutamiento de grupos tiene **dos** controles de lista de permitidos que se ejecutan uno tras otro, y ambos deben superarse:

    1. **Lista de permitidos de remitentes / destinos de chat** (`channels.imessage.groupAllowFrom`): identificador, `chat_guid`, `chat_identifier` o `chat_id`.
    2. **Registro de grupos** (`channels.imessage.groups`): con `groupPolicy: "allowlist"`, este control requiere una entrada comodín `groups: { "*": { ... } }` (establece `allowAll = true`) o una entrada explícita por `chat_id` en `groups`.

    Si el control 2 no contiene nada, todos los mensajes de grupo se descartan. El Plugin emite dos señales de nivel `warn` en el nivel de registro predeterminado:

    - una vez por cuenta al inicio: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - una vez por `chat_id` en tiempo de ejecución: `imessage: dropping group message from chat_id=<id> ...`

    Los mensajes directos siguen funcionando porque toman una ruta de código distinta.

    Configuración mínima para mantener los grupos en funcionamiento con `groupPolicy: "allowlist"`:

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

    Si esas líneas `warn` aparecen en el registro del Gateway, la compuerta 2 está descartando; añade el bloque `groups`.
    </Warning>

    Menciona la compuerta para grupos:

    - iMessage no tiene metadatos nativos de menciones
    - la detección de menciones usa patrones regex (`agents.list[].groupChat.mentionPatterns`, alternativa `messages.groupChat.mentionPatterns`)
    - sin patrones configurados, no se puede aplicar la compuerta de menciones

    Los comandos de control de remitentes autorizados pueden omitir la compuerta de menciones en grupos.

    `systemPrompt` por grupo:

    Cada entrada bajo `channels.imessage.groups.*` acepta una cadena opcional `systemPrompt`. El valor se inyecta en el prompt del sistema del agente en cada turno que gestiona un mensaje en ese grupo. La resolución replica la resolución de prompt por grupo usada por `channels.whatsapp.groups`:

    1. **Prompt del sistema específico del grupo** (`groups["<chat_id>"].systemPrompt`): se usa cuando la entrada del grupo específico existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), se suprime el comodín y no se aplica ningún prompt del sistema a ese grupo.
    2. **Prompt del sistema comodín de grupo** (`groups["*"].systemPrompt`): se usa cuando la entrada del grupo específico está completamente ausente del mapa, o cuando existe pero no define ninguna clave `systemPrompt`.

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

    Los prompts por grupo solo se aplican a mensajes de grupo; los mensajes directos en este canal no se ven afectados.

  </Tab>

  <Tab title="Sesiones y respuestas deterministas">
    - Los MD usan enrutamiento directo; los grupos usan enrutamiento de grupo.
    - Con el valor predeterminado `session.dmScope=main`, los MD de iMessage se consolidan en la sesión principal del agente.
    - Las sesiones de grupo están aisladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Las respuestas se enrutan de vuelta a iMessage usando los metadatos del canal y destino de origen.

    Comportamiento de hilos parecidos a grupos:

    Algunos hilos de iMessage con varios participantes pueden llegar con `is_group=false`.
    Si ese `chat_id` está configurado explícitamente bajo `channels.imessage.groups`, OpenClaw lo trata como tráfico de grupo (compuerta de grupo + aislamiento de sesión de grupo).

  </Tab>
</Tabs>

## Enlaces de conversación ACP

Los chats heredados de iMessage también pueden enlazarse a sesiones ACP.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del MD o chat de grupo permitido.
- Los mensajes futuros en esa misma conversación de iMessage se enrutan a la sesión ACP generada.
- `/new` y `/reset` restablecen la misma sesión ACP enlazada en el mismo lugar.
- `/acp close` cierra la sesión ACP y elimina el enlace.

Se admiten enlaces persistentes configurados mediante entradas de nivel superior `bindings[]` con `type: "acp"` y `match.channel: "imessage"`.

`match.peer.id` puede usar:

- identificador normalizado de MD, como `+15555550123` o `user@example.com`
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

## Patrones de despliegue

<AccordionGroup>
  <Accordion title="Usuario de macOS dedicado para el bot (identidad de iMessage separada)">
    Usa un Apple ID y un usuario de macOS dedicados para aislar el tráfico del bot de tu perfil personal de Messages.

    Flujo típico:

    1. Crea o inicia sesión con un usuario de macOS dedicado.
    2. Inicia sesión en Messages con el Apple ID del bot en ese usuario.
    3. Instala `imsg` en ese usuario.
    4. Crea un envoltorio SSH para que OpenClaw pueda ejecutar `imsg` en el contexto de ese usuario.
    5. Apunta `channels.imessage.accounts.<id>.cliPath` y `.dbPath` a ese perfil de usuario.

    La primera ejecución puede requerir aprobaciones de GUI (Automatización + Acceso completo al disco) en la sesión de ese usuario bot.

  </Accordion>

  <Accordion title="Mac remoto sobre Tailscale (ejemplo)">
    Topología común:

    - el Gateway se ejecuta en Linux/VM
    - iMessage + `imsg` se ejecuta en una Mac de tu tailnet
    - el envoltorio `cliPath` usa SSH para ejecutar `imsg`
    - `remoteHost` habilita la recuperación de adjuntos por SCP

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
    Asegúrate primero de que la clave del host sea de confianza (por ejemplo, `ssh bot@mac-mini.tailnet-1234.ts.net`) para que se complete `known_hosts`.

  </Accordion>

  <Accordion title="Patrón de varias cuentas">
    iMessage admite configuración por cuenta bajo `channels.imessage.accounts`.

    Cada cuenta puede sobrescribir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, configuración de historial y listas de raíces permitidas para adjuntos.

  </Accordion>
</AccordionGroup>

## Medios, fragmentación y destinos de entrega

<AccordionGroup>
  <Accordion title="Adjuntos y medios">
    - la ingesta de adjuntos entrantes está **desactivada de forma predeterminada**; establece `channels.imessage.includeAttachments: true` para reenviar fotos, notas de voz, video y otros adjuntos al agente. Con esto desactivado, los iMessages que solo contienen adjuntos se descartan antes de llegar al agente y pueden no producir ninguna línea de registro `Inbound message`.
    - las rutas de adjuntos remotos pueden recuperarse mediante SCP cuando `remoteHost` está establecido
    - las rutas de adjuntos deben coincidir con raíces permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - patrón de raíz predeterminado: `/Users/*/Library/Messages/Attachments`
    - SCP usa comprobación estricta de clave de host (`StrictHostKeyChecking=yes`)
    - el tamaño de medios salientes usa `channels.imessage.mediaMaxMb` (predeterminado: 16 MB)

  </Accordion>

  <Accordion title="Fragmentación saliente">
    - límite de fragmento de texto: `channels.imessage.textChunkLimit` (predeterminado: 4000)
    - modo de fragmentación: `channels.imessage.chunkMode`
      - `length` (predeterminado)
      - `newline` (división priorizando párrafos)

  </Accordion>

  <Accordion title="Formatos de direccionamiento">
    Destinos explícitos preferidos:

    - `chat_id:123` (recomendado para enrutamiento estable)
    - `chat_guid:...`
    - `chat_identifier:...`

    También se admiten destinos de identificador:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Acciones de API privada

Cuando `imsg launch` está ejecutándose y `openclaw channels status --probe` informa `privateApi.available: true`, la herramienta de mensajes puede usar acciones nativas de iMessage además de los envíos de texto normales.

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
    - **react**: añade o elimina tapbacks de iMessage (`messageId`, `emoji`, `remove`). Los tapbacks admitidos se asignan a amor, me gusta, no me gusta, risa, énfasis y pregunta.
    - **reply**: envía una respuesta en hilo a un mensaje existente (`messageId`, `text` o `message`, más `chatGuid`, `chatId`, `chatIdentifier` o `to`).
    - **sendWithEffect**: envía texto con un efecto de iMessage (`text` o `message`, `effect` o `effectId`).
    - **edit**: edita un mensaje enviado en versiones compatibles de macOS/API privada (`messageId`, `text` o `newText`).
    - **unsend**: retracta un mensaje enviado en versiones compatibles de macOS/API privada (`messageId`).
    - **upload-file**: envía medios/archivos (`buffer` como base64 o un `media`/`path`/`filePath` hidratado, `filename`, `asVoice` opcional). Alias heredado: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: gestiona chats de grupo cuando el destino actual es una conversación de grupo.

  </Accordion>

  <Accordion title="ID de mensajes">
    El contexto entrante de iMessage incluye tanto valores cortos `MessageSid` como GUID completos de mensaje cuando están disponibles. Los ID cortos están acotados a la caché reciente de respuestas en memoria y se comprueban contra el chat actual antes de usarse. Si un ID corto caducó o pertenece a otro chat, vuelve a intentarlo con el `MessageSidFull` completo.

  </Accordion>

  <Accordion title="Detección de capacidades">
    OpenClaw oculta las acciones de API privada solo cuando el estado de sondeo en caché indica que el puente no está disponible. Si el estado es desconocido, las acciones permanecen visibles y el despacho sondea de forma diferida para que la primera acción pueda completarse después de `imsg launch` sin una actualización de estado manual separada.

  </Accordion>

  <Accordion title="Confirmaciones de lectura y escritura">
    Cuando el puente de API privada está activo, los chats entrantes aceptados se marcan como leídos antes del despacho y se muestra un indicador de escritura al remitente mientras el agente genera la respuesta. Desactiva el marcado como leído con:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Las compilaciones antiguas de `imsg` anteriores a la lista de capacidades por método desactivarán silenciosamente la escritura/lectura; OpenClaw registra una advertencia única por reinicio para que la confirmación faltante sea atribuible.

  </Accordion>
</AccordionGroup>

## Escrituras de configuración

iMessage permite de forma predeterminada escrituras de configuración iniciadas por el canal (para `/config set|unset` cuando `commands.config: true`).

Desactivar:

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

## Coalescencia de MD de envío dividido (comando + URL en una composición)

Cuando un usuario escribe un comando y una URL juntos, por ejemplo `Dump https://example.com/article`, la app Messages de Apple divide el envío en **dos filas de `chat.db` separadas**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa OG como adjuntos.

Las dos filas llegan a OpenClaw con una separación de ~0,8-2,0 s en la mayoría de las configuraciones. Sin coalescencia, el agente recibe solo el comando en el turno 1, responde (a menudo "envíame la URL") y solo ve la URL en el turno 2, momento en el que el contexto del comando ya se perdió. Este es el proceso de envío de Apple, no algo introducido por OpenClaw ni por `imsg`.

`channels.imessage.coalesceSameSenderDms` opta un MD a fusionar filas consecutivas del mismo remitente en un único turno del agente. Los chats de grupo siguen despachándose por mensaje para conservar la estructura de turnos con varios usuarios.

<Tabs>
  <Tab title="Cuándo habilitar">
    Habilítalo cuando:

    - Distribuyas Skills que esperan `command + payload` en un solo mensaje (volcar, pegar, guardar, poner en cola, etc.).
    - Tus usuarios peguen URL, imágenes o contenido largo junto a comandos.
    - Puedas aceptar la latencia añadida al turno de MD (ver abajo).

    Déjalo deshabilitado cuando:

    - Necesites latencia mínima de comandos para disparadores de MD de una sola palabra.
    - Todos tus flujos sean comandos de una sola ejecución sin seguimientos de carga útil.

  </Tab>
  <Tab title="Habilitación">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Con la marca activada y sin `messages.inbound.byChannel.imessage` explícito, la ventana de debounce se amplía a **2500 ms** (el valor predeterminado heredado es 0 ms: sin debounce). La ventana más amplia es necesaria porque la cadencia de envíos divididos de Apple, de 0,8 a 2,0 s, no encaja en un valor predeterminado más ajustado.

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
  <Tab title="Compensaciones">
    - **Latencia añadida para mensajes de DM.** Con la marca activada, cada DM (incluidos comandos de control independientes y seguimientos de un solo texto) espera hasta la ventana de debounce antes de despacharse, por si llega una fila de carga útil. Los mensajes de chat grupal mantienen el despacho instantáneo.
    - **La salida fusionada está acotada.** El texto fusionado se limita a 4000 caracteres con un marcador explícito `…[truncated]`; los adjuntos se limitan a 20; las entradas de origen se limitan a 10 (se conserva la primera y la más reciente más allá de ese límite). Cada GUID de origen se registra en `coalescedMessageGuids` para telemetría descendente.
    - **Solo DM.** Los chats grupales pasan al despacho por mensaje para que el bot siga respondiendo cuando varias personas escriben.
    - **Activación explícita, por canal.** Otros canales (Telegram, WhatsApp, Slack, …) no se ven afectados. Las configuraciones heredadas de BlueBubbles que establecen `channels.bluebubbles.coalesceSameSenderDms` deben migrar ese valor a `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Escenarios y lo que ve el agente

| El usuario redacta                                                  | `chat.db` produce       | Marca desactivada (predeterminado)           | Marca activada + ventana de 2500 ms                                      |
| ------------------------------------------------------------------- | ----------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (un envío)                               | 2 filas con ~1 s entre ellas | Dos turnos del agente: "Dump" solo, luego URL | Un turno: texto fusionado `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (adjunto + texto)                   | 2 filas                 | Dos turnos (adjunto descartado al fusionar)  | Un turno: texto + imagen conservados                                     |
| `/status` (comando independiente)                                   | 1 fila                  | Despacho instantáneo                         | **Espera hasta la ventana y luego despacha**                             |
| URL pegada sola                                                     | 1 fila                  | Despacho instantáneo                         | Despacho instantáneo (solo una entrada en el bucket)                     |
| Texto + URL enviados como dos mensajes separados deliberados, con minutos de diferencia | 2 filas fuera de la ventana | Dos turnos                                   | Dos turnos (la ventana expira entre ellos)                               |
| Ráfaga rápida (>10 DM pequeños dentro de la ventana)                | N filas                 | N turnos                                     | Un turno, salida acotada (primera + más reciente, con límites de texto/adjuntos aplicados) |
| Dos personas escribiendo en un chat grupal                          | N filas de M remitentes | M+ turnos (uno por bucket de remitente)      | M+ turnos: los chats grupales no se fusionan                             |

## Recuperación tras una interrupción del Gateway

Cuando el Gateway está sin conexión (bloqueo, reinicio, suspensión del Mac, máquina apagada), `imsg watch` se reanuda desde el estado actual de `chat.db` cuando el Gateway vuelve a estar activo; todo lo que llegó durante el intervalo, de forma predeterminada, nunca se ve. La recuperación reproduce esos mensajes en el siguiente arranque para que el agente no pierda silenciosamente tráfico entrante.

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

Una pasada por cada arranque de `monitorIMessageProvider`, secuenciada como `imsg launch` listo → `watch.subscribe` → `performIMessageCatchup` → bucle de despacho en vivo. La propia recuperación usa `chats.list` + `messages.history` por chat contra el mismo cliente JSON-RPC que usa `imsg watch`. Todo lo que llega durante la pasada de recuperación fluye normalmente por el despacho en vivo; la caché de deduplicación entrante existente absorbe cualquier solapamiento con filas reproducidas.

Cada fila reproducida se alimenta por la ruta de despacho en vivo (`evaluateIMessageInbound` + `dispatchInboundMessage`), de modo que las listas de permitidos, la política de grupos, el debouncer, la caché de eco y los acuses de lectura se comportan de forma idéntica en mensajes reproducidos y en vivo.

### Semántica de cursor y reintentos

La recuperación mantiene un cursor por cuenta en `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (el directorio de estado de OpenClaw usa `~/.openclaw` de forma predeterminada y se puede sobrescribir con `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- El cursor avanza con cada despacho correcto y se mantiene cuando el despacho de una fila lanza una excepción; el siguiente arranque reintenta la misma fila desde el cursor retenido.
- Después de `maxFailureRetries` excepciones consecutivas contra el mismo `guid`, la recuperación registra un `warn` y fuerza el avance del cursor más allá del mensaje atascado para que los arranques posteriores puedan progresar.
- Los GUID a los que ya se renunció se omiten al verlos (sin intento de despacho) en ejecuciones posteriores y se cuentan bajo `skippedGivenUp` en el resumen de la ejecución.

### Señales visibles para el operador

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Una línea `WARN ... capped to perRunLimit` significa que un solo arranque no vació toda la cola pendiente. Aumenta `perRunLimit` (máximo 500) si tus interrupciones superan regularmente la pasada predeterminada de 50 filas.

### Cuándo dejarlo desactivado

- El Gateway se ejecuta continuamente con reinicio automático por watchdog y las interrupciones siempre son de menos de unos segundos; el valor predeterminado desactivado está bien.
- El volumen de DM es bajo y los mensajes perdidos no cambiarían el comportamiento del agente; la ventana inicial `firstRunLookbackMinutes` puede despachar contexto antiguo inesperado en la primera activación.

Cuando activas la recuperación, el primer arranque sin cursor solo mira hacia atrás `firstRunLookbackMinutes` (30 min de forma predeterminada), no toda la ventana `maxAgeMinutes`; esto evita reproducir un historial largo de mensajes anteriores a la activación.

## Solución de problemas

<AccordionGroup>
  <Accordion title="imsg no encontrado o RPC no compatible">
    Valida el binario y la compatibilidad con RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Si la sonda informa que RPC no es compatible, actualiza `imsg`. Si las acciones de API privada no están disponibles, ejecuta `imsg launch` en la sesión del usuario de macOS con sesión iniciada y vuelve a sondear. Si el Gateway no se está ejecutando en macOS, usa la configuración de Mac remoto por SSH anterior en lugar de la ruta local predeterminada de `imsg`.

  </Accordion>

  <Accordion title="El Gateway no se está ejecutando en macOS">
    El `cliPath: "imsg"` predeterminado debe ejecutarse en el Mac con sesión iniciada en Messages. En Linux o Windows, establece `channels.imessage.cliPath` en un script envoltorio que se conecte por SSH a ese Mac y ejecute `imsg "$@"`.

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

  <Accordion title="Los mensajes grupales se ignoran">
    Comprueba:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamiento de lista de permitidos de `channels.imessage.groups`
    - configuración de patrón de menciones (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Fallan los adjuntos remotos">
    Comprueba:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticación de clave SSH/SCP desde el host del Gateway
    - la clave del host existe en `~/.ssh/known_hosts` en el host del Gateway
    - legibilidad de la ruta remota en el Mac que ejecuta Messages

  </Accordion>

  <Accordion title="Se perdieron las solicitudes de permiso de macOS">
    Vuelve a ejecutar en una terminal GUI interactiva en el mismo contexto de usuario/sesión y aprueba las solicitudes:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirma que Acceso total al disco + Automatización están concedidos para el contexto de proceso que ejecuta OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Punteros de referencia de configuración

- [Referencia de configuración: iMessage](/es/gateway/config-channels#imessage)
- [Configuración del Gateway](/es/gateway/configuration)
- [Emparejamiento](/es/channels/pairing)

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales compatibles
- [Eliminación de BlueBubbles y la ruta de iMessage con imsg](/es/announcements/bluebubbles-imessage) — anuncio y resumen de migración
- [Migración desde BlueBubbles](/es/channels/imessage-from-bluebubbles) — tabla de traducción de configuración y transición paso a paso
- [Emparejamiento](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats grupales y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
