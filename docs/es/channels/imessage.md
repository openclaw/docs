---
read_when:
    - Configurar la compatibilidad con iMessage
    - Depuración del envío/recepción de iMessage
summary: Compatibilidad nativa con iMessage mediante imsg (JSON-RPC sobre stdio), con acciones de API privada para respuestas, tapbacks, efectos, encuestas, archivos adjuntos y gestión de grupos. Preferido para nuevas configuraciones de iMessage en OpenClaw cuando los requisitos del host encajan.
title: iMessage
x-i18n:
    generated_at: "2026-07-01T10:56:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para implementaciones de OpenClaw iMessage, usa `imsg` en un host macOS Messages con sesión iniciada. Si tu Gateway se ejecuta en Linux o Windows, apunta `channels.imessage.cliPath` a un contenedor SSH que ejecute `imsg` en la Mac.

**La recuperación entrante es automática.** Después de reiniciar un puente o Gateway, iMessage reproduce los mensajes perdidos mientras estaba inactivo y suprime la "bomba de backlog" obsoleta que Apple puede liberar después de una recuperación Push, con deduplicación para que nada se despache dos veces. No hay configuración que habilitar; consulta [Recuperación entrante después de reiniciar un puente o Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Se eliminó la compatibilidad con BlueBubbles. Migra las configuraciones `channels.bluebubbles` a `channels.imessage`; OpenClaw solo admite iMessage mediante `imsg`. Empieza con [Eliminación de BlueBubbles y la ruta imsg de iMessage](/es/announcements/bluebubbles-imessage) para ver el anuncio breve, o [Si vienes de BlueBubbles](/es/channels/imessage-from-bluebubbles) para ver la tabla de migración completa.
</Warning>

Estado: integración nativa con CLI externa. Gateway inicia `imsg rpc` y se comunica mediante JSON-RPC por stdio (sin daemon/puerto independiente). Las acciones avanzadas requieren `imsg launch` y una prueba correcta de API privada.

<CardGroup cols={3}>
  <Card title="Acciones de API privada" icon="wand-sparkles" href="#private-api-actions">
    Respuestas, tapbacks, efectos, encuestas, archivos adjuntos y gestión de grupos.
  </Card>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los DM de iMessage usan el modo de emparejamiento de forma predeterminada.
  </Card>
  <Card title="Mac remota" icon="terminal" href="#remote-mac-over-ssh">
    Usa un contenedor SSH cuando Gateway no se ejecuta en la Mac de Messages.
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

        Las solicitudes de emparejamiento expiran después de 1 hora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remota por SSH">
    OpenClaw solo requiere un `cliPath` compatible con stdio, así que puedes apuntar `cliPath` a un script contenedor que se conecte por SSH a una Mac remota y ejecute `imsg`.

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

    Si `remoteHost` no está definido, OpenClaw intenta detectarlo automáticamente analizando el script contenedor SSH.
    `remoteHost` debe ser `host` o `user@host` (sin espacios ni opciones SSH).
    OpenClaw usa comprobación estricta de clave de host para SCP, por lo que la clave de host del relé ya debe existir en `~/.ssh/known_hosts`.
    Las rutas de adjuntos se validan contra las raíces permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Cualquier contenedor `cliPath` o proxy SSH que pongas delante de `imsg` DEBE comportarse como una tubería stdio transparente para JSON-RPC de larga duración. OpenClaw intercambia pequeños mensajes JSON-RPC delimitados por saltos de línea sobre stdin/stdout del contenedor durante toda la vida útil del canal:

- Reenvía cada fragmento/línea de stdin **en cuanto haya bytes disponibles**; no esperes a EOF.
- Reenvía cada fragmento/línea de stdout puntualmente en la dirección inversa.
- Preserva los saltos de línea.
- Evita lecturas bloqueantes de tamaño fijo (`read(4096)`, `cat | buffer`, `read` predeterminado del shell) que puedan dejar sin servicio marcos pequeños.
- Mantén stderr separado del flujo stdout de JSON-RPC.

Un contenedor que almacena stdin en búfer hasta llenar un bloque grande producirá síntomas que parecen una interrupción de iMessage: `imsg rpc timeout (chats.list)` o reinicios repetidos del canal, aunque `imsg rpc` esté sano. `ssh -T host imsg "$@"` (arriba) es seguro porque reenvía los argumentos `cliPath` de OpenClaw, como `rpc` y `--db`. Las canalizaciones como `ssh host imsg | grep -v '^DEBUG'` NO lo son; las herramientas con búfer por línea aún pueden retener marcos; usa `stdbuf -oL -eL` en cada etapa si necesitas filtrar.
</Warning>

  </Tab>
</Tabs>

## Requisitos y permisos (macOS)

- Messages debe tener sesión iniciada en la Mac que ejecuta `imsg`.
- Se requiere Acceso total al disco para el contexto de proceso que ejecuta OpenClaw/`imsg` (acceso a la base de datos de Messages).
- Se requiere permiso de Automatización para enviar mensajes mediante Messages.app.
- Para acciones avanzadas (reaccionar / editar / deshacer envío / respuesta en hilo / efectos / encuestas / operaciones de grupo), System Integrity Protection debe estar deshabilitada; consulta [Habilitar la API privada de imsg](#enabling-the-imsg-private-api) a continuación. El envío y la recepción básicos de texto y medios funcionan sin ello.

<Tip>
Los permisos se conceden por contexto de proceso. Si Gateway se ejecuta sin interfaz (LaunchAgent/SSH), ejecuta una vez un comando interactivo en ese mismo contexto para activar las solicitudes:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="Los envíos del contenedor SSH fallan con AppleEvents -1743">
  Una configuración con SSH remoto puede leer chats, superar `channels status --probe` y procesar mensajes entrantes, mientras los envíos salientes siguen fallando con un error de autorización de AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Comprueba la base de datos TCC del usuario de la Mac con sesión iniciada o Configuración del sistema > Privacidad y seguridad > Automatización. Si la entrada de Automatización está registrada para `/usr/libexec/sshd-keygen-wrapper` en lugar de para el proceso `imsg` o shell local, es posible que macOS no exponga un conmutador utilizable de Messages para ese cliente del lado del servidor SSH:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

En ese estado, repetir `tccutil reset AppleEvents` o volver a ejecutar `imsg send` mediante el mismo contenedor SSH puede seguir fallando porque el contexto de proceso que necesita Automatización de Messages es el contenedor SSH, no una aplicación a la que la interfaz pueda conceder permiso.

Usa en su lugar uno de los contextos de proceso `imsg` admitidos:

- Ejecuta Gateway, o al menos el puente `imsg`, en la sesión local del usuario de Messages que tiene sesión iniciada.
- Inicia Gateway con un LaunchAgent para ese usuario después de conceder Acceso total al disco y Automatización desde la misma sesión.
- Si mantienes la topología SSH de dos usuarios, verifica que un `imsg send` saliente real se complete correctamente mediante el contenedor exacto antes de habilitar el canal. Si no se le puede conceder Automatización, reconfigura a una configuración `imsg` de un solo usuario en lugar de depender del contenedor SSH para los envíos.

</Accordion>

## Habilitar la API privada de imsg

`imsg` se distribuye en dos modos operativos:

- **Modo básico** (predeterminado, sin cambios de SIP necesarios): texto y medios salientes mediante `send`, observación/historial entrante, lista de chats. Esto es lo que obtienes de fábrica con una instalación nueva de `brew install steipete/tap/imsg` más los permisos estándar de macOS indicados arriba.
- **Modo de API privada**: `imsg` inyecta una dylib auxiliar en `Messages.app` para llamar a funciones internas de `IMCore`. Esto desbloquea `react`, `edit`, `unsend`, `reply` (en hilo), `sendWithEffect`, `poll` y `poll-vote` (encuestas nativas de Messages), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, además de indicadores de escritura y confirmaciones de lectura.

Para acceder a la superficie de acciones avanzadas que documenta esta página del canal, necesitas el modo de API privada. El README de `imsg` es explícito sobre el requisito:

> Las funciones avanzadas como `read`, `typing`, `launch`, envío enriquecido respaldado por puente, mutación de mensajes y gestión de chats son opcionales. Requieren que SIP esté deshabilitada y que se inyecte una dylib auxiliar en `Messages.app`. `imsg launch` se niega a inyectar cuando SIP está habilitada.

La técnica de inyección del auxiliar usa la propia dylib de `imsg` para acceder a las API privadas de Messages. No hay ningún servidor de terceros ni runtime de BlueBubbles en la ruta de OpenClaw iMessage.

<Warning>
**Deshabilitar SIP es una concesión de seguridad real.** SIP es una de las protecciones principales de macOS contra la ejecución de código del sistema modificado; desactivarla en todo el sistema abre superficie de ataque adicional y efectos secundarios. En particular, **deshabilitar SIP en Macs con Apple Silicon también deshabilita la capacidad de instalar y ejecutar aplicaciones de iOS en tu Mac**.

Trata esto como una decisión operativa deliberada, no como un valor predeterminado. Si tu modelo de amenazas no puede tolerar que SIP esté desactivada, iMessage incluido se limita al modo básico: solo envío/recepción de texto y medios, sin reacciones / edición / deshacer envío / efectos / operaciones de grupo.
</Warning>

### Configuración

1. **Instala (o actualiza) `imsg`** en la Mac que ejecuta Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   La salida de `imsg status --json` informa `bridge_version`, `rpc_methods` y `selectors` por método para que puedas ver qué admite la compilación actual antes de empezar.

2. **Deshabilita System Integrity Protection y (en macOS moderno) Library Validation.** Inyectar una dylib auxiliar que no es de Apple en `Messages.app`, firmada por Apple, necesita SIP desactivada **y** validación de bibliotecas relajada. El paso de SIP en modo de recuperación depende de la versión de macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** deshabilita Library Validation mediante Terminal, reinicia en modo de recuperación, ejecuta `csrutil disable` y reinicia.
   - **macOS 11+ (Big Sur y posteriores), Intel:** modo de recuperación (o Internet Recovery), `csrutil disable`, reiniciar.
   - **macOS 11+, Apple Silicon:** secuencia de inicio con el botón de encendido para entrar en recuperación; en versiones recientes de macOS, mantén pulsada la tecla **Mayús izquierda** cuando hagas clic en Continuar y luego ejecuta `csrutil disable`. Las configuraciones de máquinas virtuales siguen un flujo separado, así que crea primero una instantánea de la VM.

   **En macOS 11 y posteriores, `csrutil disable` por sí solo normalmente no basta.** Apple sigue imponiendo la validación de bibliotecas contra `Messages.app` como binario de plataforma, por lo que un auxiliar firmado ad hoc se rechaza (`Library Validation failed: ... platform binary, but mapped file is not`) incluso con SIP desactivada. Después de deshabilitar SIP, deshabilita también la validación de bibliotecas y reinicia:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), verificado en 26.5.1:** SIP desactivada **más** el comando `DisableLibraryValidation` anterior es suficiente para inyectar el auxiliar desde 26.0 hasta 26.5.x. **No se requieren boot-args.** El plist es el factor decisivo y el paso omitido más común cuando la inyección falla en Tahoe:
   - **Con el plist:** `imsg launch` inyecta y `imsg status` informa `advanced_features: true`.
   - **Sin el plist (incluso con SIP desactivada):** `imsg launch` falla con `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI rechaza el auxiliar ad hoc al cargarlo, por lo que el puente nunca queda listo y el inicio agota el tiempo de espera. Ese tiempo de espera es el síntoma que la mayoría de las personas encuentran en Tahoe, y la solución es el plist anterior, no algo más drástico.

   Esto se confirmó con una prueba controlada antes/después en macOS 26.5.1 (Apple Silicon): con el plist, la dylib se mapea en `Messages.app` y el puente se inicia; elimina el plist y reinicia, y `imsg launch` produce el fallo de tiempo de espera anterior sin que la dylib se mapee.

   Si la inyección de `imsg launch` o `selectors` específicos empiezan a devolver falso después de una actualización de macOS, esta compuerta suele ser la causa. Comprueba el estado de SIP y de validación de bibliotecas antes de asumir que el propio paso de SIP falló. Si esos ajustes son correctos y el puente aún no puede inyectar, recopila `imsg status --json` junto con la salida de `imsg launch` y repórtalo al proyecto `imsg` en lugar de debilitar controles de seguridad adicionales de todo el sistema.

   Sigue el flujo de modo de recuperación de Apple para tu Mac para desactivar SIP antes de ejecutar `imsg launch`.

3. **Inyecta el helper.** Con SIP desactivado y la sesión iniciada en Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` se niega a inyectar cuando SIP sigue activado, así que esto también sirve como confirmación de que el paso 2 surtió efecto.

4. **Verifica el puente desde OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   La entrada de iMessage debería informar `works`, y `imsg status --json | jq '{rpc_methods, selectors}'` debería mostrar las capacidades expuestas por tu compilación de macOS. La creación de encuestas requiere `selectors.pollPayloadMessage`; votar requiere tanto `selectors.pollVoteMessage` como el método RPC `poll.vote`. El Plugin de OpenClaw anuncia solo acciones admitidas por la prueba en caché, mientras que una caché vacía se mantiene optimista y prueba en el primer envío.

Si `openclaw channels status --probe` informa que el canal está `works`, pero acciones específicas arrojan "iMessage `<action>` requiere el puente de API privada de imsg" en el momento del envío, vuelve a ejecutar `imsg launch`: el helper puede desconectarse (reinicio de Messages.app, actualización del sistema operativo, etc.) y el estado en caché `available: true` seguirá anunciando acciones hasta que la siguiente prueba lo actualice.

### Cuando no puedes desactivar SIP

Si SIP desactivado no es aceptable para tu modelo de amenazas:

- `imsg` recurre al modo básico: solo texto + multimedia + recepción.
- El Plugin de OpenClaw sigue anunciando envío de texto/multimedia y monitoreo entrante; simplemente oculta `react`, `edit`, `unsend`, `reply`, `sendWithEffect` y operaciones de grupo de la superficie de acciones (según la compuerta de capacidad por método).
- Puedes ejecutar un Mac separado que no sea Apple Silicon (o un Mac dedicado para bot) con SIP desactivado para la carga de trabajo de iMessage, mientras mantienes SIP activado en tus dispositivos principales. Consulta [Usuario de macOS dedicado para bot (identidad de iMessage separada)](#deployment-patterns) más abajo.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de MD">
    `channels.imessage.dmPolicy` controla los mensajes directos:

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    Campo de lista de permitidos: `channels.imessage.allowFrom`.

    Las entradas de la lista de permitidos deben identificar remitentes: identificadores o grupos estáticos de acceso de remitente (`accessGroup:<name>`). Usa `channels.imessage.groupAllowFrom` para destinos de chat como `chat_id:*`, `chat_guid:*` o `chat_identifier:*`; usa `channels.imessage.groups` para claves numéricas de registro `chat_id`.

  </Tab>

  <Tab title="Política de grupo + menciones">
    `channels.imessage.groupPolicy` controla el manejo de grupos:

    - `allowlist` (predeterminado cuando está configurado)
    - `open`
    - `disabled`

    Lista de permitidos de remitentes de grupo: `channels.imessage.groupAllowFrom`.

    Las entradas de `groupAllowFrom` también pueden hacer referencia a grupos estáticos de acceso de remitente (`accessGroup:<name>`).

    Reserva en tiempo de ejecución: si `groupAllowFrom` no está definido, las comprobaciones de remitentes de grupo de iMessage usan `allowFrom`; define `groupAllowFrom` cuando la admisión de MD y de grupo deba diferir.
    Nota de tiempo de ejecución: si falta por completo `channels.imessage`, el tiempo de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (aunque `channels.defaults.groupPolicy` esté definido).

    <Warning>
    El enrutamiento de grupos tiene **dos** compuertas de lista de permitidos que se ejecutan una tras otra, y ambas deben pasar:

    1. **Lista de permitidos de remitente / destino de chat** (`channels.imessage.groupAllowFrom`): identificador, `chat_guid`, `chat_identifier` o `chat_id`.
    2. **Registro de grupos** (`channels.imessage.groups`): con `groupPolicy: "allowlist"`, esta compuerta requiere una entrada comodín `groups: { "*": { ... } }` (establece `allowAll = true`) o una entrada explícita por `chat_id` bajo `groups`.

    Si la compuerta 2 no contiene nada, se descartan todos los mensajes de grupo. El Plugin emite dos señales de nivel `warn` en el nivel de registro predeterminado:

    - una vez por cuenta al iniciar: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - una vez por `chat_id` en tiempo de ejecución: `imessage: dropping group message from chat_id=<id> ...`

    Los MD siguen funcionando porque toman una ruta de código diferente.

    Configuración mínima para mantener el flujo de grupos con `groupPolicy: "allowlist"`:

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

    Si esas líneas `warn` aparecen en el registro del Gateway, la compuerta 2 está descartando: añade el bloque `groups`.
    </Warning>

    Compuerta de menciones para grupos:

    - iMessage no tiene metadatos nativos de mención
    - la detección de menciones usa patrones regex (`agents.list[].groupChat.mentionPatterns`, reserva `messages.groupChat.mentionPatterns`)
    - sin patrones configurados, no se puede aplicar la compuerta de menciones

    Los comandos de control de remitentes autorizados pueden omitir la compuerta de menciones en grupos.

    `systemPrompt` por grupo:

    Cada entrada bajo `channels.imessage.groups.*` acepta una cadena opcional `systemPrompt`. El valor se inyecta en el prompt del sistema del agente en cada turno que maneja un mensaje en ese grupo. La resolución refleja la resolución de prompt por grupo usada por `channels.whatsapp.groups`:

    1. **Prompt del sistema específico del grupo** (`groups["<chat_id>"].systemPrompt`): se usa cuando la entrada del grupo específico existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), el comodín se suprime y no se aplica ningún prompt del sistema a ese grupo.
    2. **Prompt del sistema comodín de grupo** (`groups["*"].systemPrompt`): se usa cuando la entrada del grupo específico está totalmente ausente del mapa, o cuando existe pero no define ninguna clave `systemPrompt`.

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
    - Con el valor predeterminado `session.dmScope=main`, los MD de iMessage se combinan en la sesión principal del agente.
    - Las sesiones de grupo están aisladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Las respuestas se enrutan de vuelta a iMessage usando metadatos del canal/destino de origen.

    Comportamiento de hilos similares a grupos:

    Algunos hilos de iMessage con varios participantes pueden llegar con `is_group=false`.
    Si ese `chat_id` está configurado explícitamente bajo `channels.imessage.groups`, OpenClaw lo trata como tráfico de grupo (compuerta de grupo + aislamiento de sesión de grupo).

  </Tab>
</Tabs>

## Enlaces de conversaciones ACP

Los chats heredados de iMessage también pueden enlazarse a sesiones ACP.

Flujo rápido para operador:

- Ejecuta `/acp spawn codex --bind here` dentro del MD o chat de grupo permitido.
- Los mensajes futuros en esa misma conversación de iMessage se enrutan a la sesión ACP creada.
- `/new` y `/reset` restablecen la misma sesión ACP enlazada en el lugar.
- `/acp close` cierra la sesión ACP y elimina el enlace.

Se admiten enlaces persistentes configurados mediante entradas de nivel superior `bindings[]` con `type: "acp"` y `match.channel: "imessage"`.

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

## Patrones de despliegue

<AccordionGroup>
  <Accordion title="Usuario de macOS dedicado para bot (identidad de iMessage separada)">
    Usa un Apple ID y un usuario de macOS dedicados para que el tráfico del bot esté aislado de tu perfil personal de Messages.

    Flujo típico:

    1. Crea/inicia sesión con un usuario de macOS dedicado.
    2. Inicia sesión en Messages con el Apple ID del bot en ese usuario.
    3. Instala `imsg` en ese usuario.
    4. Crea un wrapper SSH para que OpenClaw pueda ejecutar `imsg` en el contexto de ese usuario.
    5. Apunta `channels.imessage.accounts.<id>.cliPath` y `.dbPath` a ese perfil de usuario.

    La primera ejecución puede requerir aprobaciones de GUI (Automatización + Acceso total al disco) en la sesión de ese usuario de bot.

  </Accordion>

  <Accordion title="Mac remoto sobre Tailscale (ejemplo)">
    Topología común:

    - el Gateway se ejecuta en Linux/VM
    - iMessage + `imsg` se ejecutan en un Mac en tu tailnet
    - el wrapper `cliPath` usa SSH para ejecutar `imsg`
    - `remoteHost` habilita la obtención de adjuntos por SCP

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
    Asegúrate primero de que la clave del host sea de confianza (por ejemplo `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` se rellene.

  </Accordion>

  <Accordion title="Patrón de varias cuentas">
    iMessage admite configuración por cuenta bajo `channels.imessage.accounts`.

    Cada cuenta puede anular campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, ajustes de historial y listas de permitidos de raíz de adjuntos.

  </Accordion>

  <Accordion title="Historial de mensajes directos">
    Define `channels.imessage.dmHistoryLimit` para inicializar nuevas sesiones de mensajes directos con historial reciente decodificado de `imsg` para esa conversación. Usa `channels.imessage.dms["<sender>"].historyLimit` para anulaciones por remitente, incluido `0` para desactivar el historial para un remitente.

    El historial de MD de iMessage se obtiene bajo demanda desde `imsg`. Dejar `dmHistoryLimit` sin definir desactiva la inicialización global de historial de MD, pero un valor positivo por remitente en `channels.imessage.dms["<sender>"].historyLimit` aún habilita la inicialización para ese remitente.

  </Accordion>
</AccordionGroup>

## Multimedia, fragmentación y destinos de entrega

<AccordionGroup>
  <Accordion title="Adjuntos y medios">
    - la ingesta de adjuntos entrantes está **desactivada de forma predeterminada**: establece `channels.imessage.includeAttachments: true` para reenviar fotos, notas de voz, video y otros adjuntos al agente. Con esto desactivado, los iMessages que solo contienen adjuntos se descartan antes de llegar al agente y puede que no produzcan ninguna línea de registro `Inbound message`.
    - las rutas de adjuntos remotos se pueden obtener mediante SCP cuando `remoteHost` está establecido
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
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Acciones disponibles">
    - **react**: Añadir/eliminar tapbacks de iMessage (`messageId`, `emoji`, `remove`). Los tapbacks admitidos se asignan a love, like, dislike, laugh, emphasize y question.
    - **reply**: Enviar una respuesta en hilo a un mensaje existente (`messageId`, `text` o `message`, además de `chatGuid`, `chatId`, `chatIdentifier` o `to`).
    - **sendWithEffect**: Enviar texto con un efecto de iMessage (`text` o `message`, `effect` o `effectId`).
    - **edit**: Editar un mensaje enviado en versiones compatibles de macOS/API privada (`messageId`, `text` o `newText`).
    - **unsend**: Retirar un mensaje enviado en versiones compatibles de macOS/API privada (`messageId`).
    - **upload-file**: Enviar medios/archivos (`buffer` como base64 o un `media`/`path`/`filePath` hidratado, `filename`, `asVoice` opcional). Alias heredado: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Administrar chats grupales cuando el destino actual es una conversación grupal.
    - **poll**: Crear una encuesta nativa de Apple Messages (`pollQuestion`, `pollOption` repetido de 2 a 12 veces, además de `chatGuid`, `chatId`, `chatIdentifier` o `to`). Los destinatarios en iOS/iPadOS/macOS 26+ la ven y votan en ella de forma nativa; las versiones anteriores del sistema operativo reciben una reserva de texto "Sent a poll". Requiere `selectors.pollPayloadMessage`.
    - **poll-vote**: Votar en una encuesta existente (`pollId` o `messageId`, además de exactamente uno de `pollOptionIndex`, `pollOptionId` o `pollOptionText`). Requiere `selectors.pollVoteMessage` y el método RPC `poll.vote`.

    Las encuestas entrantes aceptadas se representan para el agente con la pregunta, las etiquetas de opciones numeradas, los conteos de votos y el ID de mensaje de la encuesta necesario para `poll-vote`.

  </Accordion>

  <Accordion title="ID de mensajes">
    El contexto entrante de iMessage incluye tanto valores `MessageSid` cortos como GUIDs de mensaje completos cuando están disponibles. Los ID cortos están limitados a la caché reciente de respuestas respaldada por SQLite y se comprueban contra el chat actual antes de usarse. Si un ID corto ha caducado o pertenece a otro chat, reintenta con el `MessageSidFull` completo.

  </Accordion>

  <Accordion title="Detección de capacidades">
    OpenClaw oculta las acciones de API privada solo cuando el estado de sondeo en caché indica que el puente no está disponible. Si el estado es desconocido, las acciones permanecen visibles y el envío ejecuta sondeos de forma diferida para que la primera acción pueda completarse después de `imsg launch` sin una actualización manual de estado independiente.

  </Accordion>

  <Accordion title="Confirmaciones de lectura y escritura">
    Cuando el puente de API privada está activo, los chats entrantes aceptados se marcan como leídos y los chats directos muestran una burbuja de escritura en cuanto se acepta el turno, mientras el agente prepara el contexto y genera. Desactiva el marcado como leído con:

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

  <Accordion title="Tapbacks entrantes">
    OpenClaw se suscribe a los tapbacks de iMessage y enruta las reacciones aceptadas como eventos del sistema en lugar de texto de mensaje normal, por lo que un tapback de usuario no activa un bucle de respuesta ordinario.

    El modo de notificación se controla mediante `channels.imessage.reactionNotifications`:

    - `"own"` (predeterminado): notificar solo cuando los usuarios reaccionen a mensajes escritos por el bot.
    - `"all"`: notificar todos los tapbacks entrantes de remitentes autorizados.
    - `"off"`: ignorar los tapbacks entrantes.

    Las anulaciones por cuenta usan `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reacciones de aprobación (👍 / 👎)">
    Cuando `approvals.exec.enabled` o `approvals.plugin.enabled` es true y la solicitud se enruta a iMessage, el gateway entrega una solicitud de aprobación de forma nativa y acepta un tapback para resolverla:

    - `👍` (tapback Like) → `allow-once`
    - `👎` (tapback Dislike) → `deny`
    - `allow-always` sigue siendo una reserva manual: envía `/approve <id> allow-always` como una respuesta normal.

    El manejo de reacciones requiere que el identificador del usuario que reacciona sea un aprobador explícito. La lista de aprobadores se lee desde `channels.imessage.allowFrom` (o `channels.imessage.accounts.<id>.allowFrom`); añade el número de teléfono del usuario en formato E.164 o su correo de Apple ID. La entrada comodín `"*"` se respeta, pero permite que cualquier remitente apruebe. El atajo de reacción omite intencionadamente `reactionNotifications`, `dmPolicy` y `groupAllowFrom` porque la lista de permitidos de aprobadores explícitos es la única compuerta que importa para resolver aprobaciones.

    **Cambio de comportamiento con esta versión:** Cuando `channels.imessage.allowFrom` no está vacío, el comando de texto `/approve <id> <decision>` ahora se autoriza contra esa lista de aprobadores (no contra la lista de permitidos de DM más amplia). Los remitentes permitidos en la lista de permitidos de DM pero no en `allowFrom` recibirán una denegación explícita. Añade a `allowFrom` todos los operadores que deban poder aprobar mediante `/approve` (y mediante reacciones) para conservar el comportamiento anterior. Cuando `allowFrom` está vacío, la reserva heredada de "mismo chat" permanece vigente y `/approve` sigue autorizando a cualquiera que permita la lista de permitidos de DM.

    Notas para operadores:
    - El vínculo de reacción se almacena tanto en memoria (con TTL ajustado a la caducidad de la aprobación) como en el almacén persistente con claves del gateway, por lo que un tapback que llegue poco después de un reinicio del gateway aún resuelve la aprobación.
    - Los tapbacks entre dispositivos con `is_from_me=true` (la propia reacción del operador en un dispositivo Apple emparejado) se ignoran intencionadamente para que el bot no pueda autoaprobarse.
    - Los tapbacks heredados de estilo texto (`Liked "…"` como texto sin formato de clientes Apple muy antiguos) no pueden resolver aprobaciones porque no transportan GUID de mensaje; la resolución de reacciones requiere los metadatos estructurados de tapback que emiten los clientes macOS / iOS actuales.

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

## Combinación de DM de envío dividido (comando + URL en una composición)

Cuando un usuario escribe juntos un comando y una URL, por ejemplo `Dump https://example.com/article`, la app Messages de Apple divide el envío en **dos filas `chat.db` separadas**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa OG como adjuntos.

Las dos filas llegan a OpenClaw con ~0.8-2.0 s de diferencia en la mayoría de configuraciones. Sin combinación, el agente recibe solo el comando en el turno 1, responde (a menudo "envíame la URL") y solo ve la URL en el turno 2, momento en el que el contexto del comando ya se perdió. Este es el flujo de envío de Apple, no algo que introduzcan OpenClaw o `imsg`.

`channels.imessage.coalesceSameSenderDms` activa para un DM el almacenamiento en búfer de filas consecutivas del mismo remitente. Cuando `imsg` expone el marcador estructural de vista previa de URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` en una de las filas de origen, OpenClaw combina solo ese envío dividido real y mantiene cualquier otra fila en búfer como turnos separados. En compilaciones antiguas de `imsg` que no emiten ningún metadato de globo, OpenClaw no puede distinguir un envío dividido de envíos separados, por lo que recurre a combinar el grupo. Eso conserva el comportamiento previo a los metadatos en lugar de hacer que los envíos divididos `Dump <url>` regresen a dos turnos. Los chats grupales siguen despachándose por mensaje para preservar la estructura de turnos multiusuario.

<Tabs>
  <Tab title="Cuándo activarlo">
    Actívalo cuando:

    - Envías Skills que esperan `command + payload` en un solo mensaje (dump, paste, save, queue, etc.).
    - Tus usuarios pegan URLs junto a comandos.
    - Puedes aceptar la latencia adicional de turno de DM (ver abajo).

    Déjalo desactivado cuando:

    - Necesitas latencia mínima de comandos para disparadores de DM de una sola palabra.
    - Todos tus flujos son comandos de una sola vez sin seguimientos de carga útil.

  </Tab>
  <Tab title="Activación">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Con la bandera activada y sin `messages.inbound.byChannel.imessage` explícito ni `messages.inbound.debounceMs` global, la ventana de debounce se amplía a **7000 ms** (el valor predeterminado heredado es 0 ms: sin debounce). La ventana más amplia es necesaria porque la cadencia de envío dividido de vista previa de URL de Apple puede extenderse varios segundos mientras Messages.app emite la fila de vista previa.

    Para ajustar la ventana tú mismo:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Compensaciones">
    - **La fusión precisa necesita metadatos de carga útil actuales de `imsg`.** Cuando la fila de URL incluye `balloon_bundle_id`, solo ese envío dividido real se fusiona y las demás filas almacenadas en búfer permanecen separadas. En versiones anteriores de `imsg` que no exponen metadatos de globo, OpenClaw recurre a fusionar el bucket en búfer para que los envíos divididos de `Dump <url>` no regresen a dos turnos (compatibilidad retroactiva provisional, eliminada una vez que `imsg` fusione los envíos divididos en upstream).
    - **Latencia añadida para mensajes de MD.** Con la marca activada, cada MD (incluidos los comandos de control independientes y los seguimientos de texto único) espera hasta la ventana de antirrebote antes de enviarse, por si viene una fila de vista previa de URL. Los mensajes de chats grupales mantienen el envío instantáneo.
    - **La salida fusionada está acotada.** El texto fusionado se limita a 4000 caracteres con un marcador explícito `…[truncated]`; los adjuntos se limitan a 20; las entradas de origen se limitan a 10 (se conservan la primera y las más recientes más allá de eso). Cada GUID de origen se rastrea en `coalescedMessageGuids` para la telemetría descendente.
    - **Solo MD.** Los chats grupales pasan al envío por mensaje para que el bot siga respondiendo cuando varias personas escriben.
    - **Opcional, por canal.** Otros canales (Telegram, WhatsApp, Slack, …) no se ven afectados. Las configuraciones heredadas de BlueBubbles que establezcan `channels.bluebubbles.coalesceSameSenderDms` deben migrar ese valor a `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Escenarios y lo que ve el agente

La columna "Marca activada" muestra el comportamiento en una versión de `imsg` que emite `balloon_bundle_id`. En versiones anteriores de `imsg` que no emiten ningún metadato de globo, las filas siguientes marcadas como "Dos turnos" / "N turnos" recurren en su lugar a una fusión heredada (un turno): OpenClaw no puede distinguir estructuralmente un envío dividido de envíos separados, así que conserva la fusión previa a los metadatos. La separación precisa se activa cuando la versión emite metadatos de globo.

| El usuario compone                                                | `chat.db` produce                   | Marca desactivada (predeterminado)           | Marca activada + ventana (`imsg` emite metadatos de globo)                                             |
| ------------------------------------------------------------------ | ----------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `Dump https://example.com` (un envío)                              | 2 filas con ~1 s de diferencia      | Dos turnos de agente: "Dump" solo, luego URL | Un turno: texto fusionado `Dump https://example.com`                                                   |
| `Save this 📎image.jpg caption` (adjunto + texto)                  | 2 filas sin metadatos de globo URL  | Dos turnos                                  | Dos turnos después de observar metadatos; un turno fusionado en sesiones antiguas/previas al latch sin metadatos |
| `/status` (comando independiente)                                  | 1 fila                              | Envío instantáneo                           | **Espera hasta la ventana y luego envía**                                                              |
| URL pegada sola                                                    | 1 fila                              | Envío instantáneo                           | Espera hasta la ventana y luego envía                                                                  |
| Texto + URL enviados como dos mensajes separados deliberados, con minutos de diferencia | 2 filas fuera de la ventana         | Dos turnos                                  | Dos turnos (la ventana vence entre ellos)                                                              |
| Ráfaga rápida (>10 MD pequeños dentro de la ventana)               | N filas sin metadatos de globo URL  | N turnos                                    | N turnos después de observar metadatos; un turno fusionado acotado en sesiones antiguas/previas al latch sin metadatos |
| Dos personas escribiendo en un chat grupal                         | N filas de M remitentes             | M+ turnos (uno por bucket de remitente)      | M+ turnos — los chats grupales no se fusionan                                                          |

## Recuperación de entrada tras reiniciar un puente o Gateway

iMessage recupera los mensajes perdidos mientras el Gateway estuvo caído y, al mismo tiempo, suprime la "bomba de backlog" obsoleta que Apple puede descargar tras una recuperación Push. El comportamiento predeterminado siempre está activado, construido sobre la desduplicación de entrada.

- **Desduplicación de repetición.** Cada mensaje entrante enviado se registra por su GUID de Apple en el estado persistente del Plugin (`imessage.inbound-dedupe`), se reclama al ingerirse y se confirma después del manejo (se libera ante un fallo transitorio para que pueda reintentarse). Todo lo que ya se manejó se descarta en lugar de enviarse dos veces. Esto permite que la recuperación repita de forma agresiva sin contabilidad por mensaje.
- **Recuperación de inactividad.** Al iniciar, el monitor recuerda el último rowid de `chat.db` enviado (un cursor persistido por cuenta) y lo pasa a `imsg watch.subscribe` como `since_rowid`, para que imsg reproduzca las filas que llegaron mientras el Gateway estaba caído y luego siga en vivo. La repetición se limita a las filas más recientes y a mensajes de hasta ~2 horas de antigüedad, y la desduplicación descarta todo lo ya manejado.
- **Valla de antigüedad para backlog obsoleto.** Las filas por encima del límite de inicio son realmente en vivo; una cuya fecha de envío sea más de ~15 minutos anterior a su llegada es backlog descargado por Push y se suprime. Las filas reproducidas (en el límite o por debajo) usan en su lugar la ventana de recuperación más amplia, por lo que se entrega un mensaje perdido recientemente mientras que el historial antiguo no.

La recuperación funciona tanto con configuraciones `cliPath` locales como remotas, porque la repetición `since_rowid` se ejecuta sobre la misma conexión RPC de `imsg`. La diferencia es la ventana: cuando el Gateway puede leer `chat.db` (local), ancla el límite rowid de inicio, limita el intervalo de repetición y entrega mensajes perdidos de hasta un par de horas de antigüedad. Con un `cliPath` SSH remoto no puede leer la base de datos, así que la repetición no tiene límite y cada fila usa la valla de antigüedad en vivo: sigue recuperando mensajes perdidos recientemente y sigue suprimiendo backlog antiguo, solo que con la ventana en vivo más estrecha. Ejecuta el Gateway en el Mac de Messages para obtener la ventana de recuperación más amplia.

### Señal visible para el operador

El backlog suprimido se registra en el nivel predeterminado, nunca se descarta en silencio (la marca `recovery` muestra qué ventana se aplicó):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migración

`channels.imessage.catchup.*` está obsoleto: la recuperación de inactividad ahora es automática y no necesita configuración para instalaciones nuevas. Las configuraciones existentes con `catchup.enabled: true` siguen respetándose como perfil de compatibilidad para la ventana de repetición de recuperación. Los bloques de catchup desactivados (`enabled: false` o sin `enabled: true`) se retiran; `openclaw doctor --fix` los elimina.

## Solución de problemas

<AccordionGroup>
  <Accordion title="No se encontró imsg o RPC no compatible">
    Valida el binario y la compatibilidad con RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Si la prueba informa que RPC no es compatible, actualiza `imsg`. Si las acciones de API privada no están disponibles, ejecuta `imsg launch` en la sesión del usuario de macOS que inició sesión y vuelve a probar. Si el Gateway no se está ejecutando en macOS, usa la configuración de Mac remoto por SSH anterior en lugar de la ruta local predeterminada de `imsg`.

  </Accordion>

  <Accordion title="Los mensajes se envían pero los iMessages entrantes no llegan">
    Primero demuestra si el mensaje llegó al Mac local. Si `chat.db` no cambia, OpenClaw no puede recibir el mensaje aunque `imsg status --json` informe un puente saludable.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Si los mensajes enviados desde el teléfono no crean filas nuevas, repara la capa de Messages de macOS y Apple Push antes de cambiar la configuración de OpenClaw. Una actualización puntual del servicio suele bastar:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Envía un iMessage nuevo desde el teléfono y confirma una fila nueva en `chat.db` o un evento de `imsg watch` antes de depurar sesiones de OpenClaw. No ejecutes esto como un bucle periódico de relanzamiento del puente; repetir `imsg launch` más reinicios del Gateway durante trabajo activo puede interrumpir entregas y dejar ejecuciones de canal en curso varadas.

  </Accordion>

  <Accordion title="El Gateway no se está ejecutando en macOS">
    El `cliPath: "imsg"` predeterminado debe ejecutarse en el Mac con sesión iniciada en Messages. En Linux o Windows, establece `channels.imessage.cliPath` en un script envoltorio que use SSH hacia ese Mac y ejecute `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Luego ejecuta:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="Los MD se ignoran">
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
    - configuración de patrones de mención (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Los adjuntos remotos fallan">
    Comprueba:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticación de clave SSH/SCP desde el host del Gateway
    - la clave de host existe en `~/.ssh/known_hosts` en el host del Gateway
    - legibilidad de la ruta remota en el Mac que ejecuta Messages

  </Accordion>

  <Accordion title="Se perdieron los avisos de permisos de macOS">
    Vuelve a ejecutar en una terminal GUI interactiva en el mismo contexto de usuario/sesión y aprueba los avisos:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirma que Full Disk Access + Automation están concedidos para el contexto de proceso que ejecuta OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Punteros de referencia de configuración

- [Referencia de configuración - iMessage](/es/gateway/config-channels#imessage)
- [Configuración del Gateway](/es/gateway/configuration)
- [Emparejamiento](/es/channels/pairing)

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Eliminación de BlueBubbles y la ruta iMessage con imsg](/es/announcements/bluebubbles-imessage) — anuncio y resumen de migración
- [Migrar desde BlueBubbles](/es/channels/imessage-from-bluebubbles) — tabla de traducción de configuración y cambio paso a paso
- [Emparejamiento](/es/channels/pairing) — autenticación de MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
