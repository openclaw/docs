---
read_when:
    - Configuración de la compatibilidad con iMessage
    - Depuración del envío y la recepción de iMessage
summary: Compatibilidad nativa con iMessage mediante imsg (JSON-RPC sobre stdio), con acciones de API privada para respuestas, tapbacks, efectos, adjuntos y gestión de grupos. Recomendado para nuevas configuraciones de iMessage en OpenClaw cuando se cumplen los requisitos del host.
title: iMessage
x-i18n:
    generated_at: "2026-06-27T10:39:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para implementaciones de OpenClaw con iMessage, usa `imsg` en un host macOS Messages con sesión iniciada. Si tu Gateway se ejecuta en Linux o Windows, apunta `channels.imessage.cliPath` a un envoltorio SSH que ejecute `imsg` en el Mac.

**La recuperación entrante es automática.** Después de reiniciar un puente o gateway, iMessage reproduce los mensajes perdidos mientras estaba caído y suprime la "bomba de backlog" obsoleta que Apple puede vaciar después de una recuperación Push, deduplicando para que nada se despache dos veces. No hay ninguna configuración que habilitar: consulta [Recuperación entrante después de reiniciar un puente o gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Se eliminó el soporte de BlueBubbles. Migra las configuraciones `channels.bluebubbles` a `channels.imessage`; OpenClaw admite iMessage solo mediante `imsg`. Empieza con [Eliminación de BlueBubbles y la ruta imsg de iMessage](/es/announcements/bluebubbles-imessage) para ver el anuncio breve, o [Si vienes de BlueBubbles](/es/channels/imessage-from-bluebubbles) para ver la tabla de migración completa.
</Warning>

Estado: integración CLI externa nativa. Gateway inicia `imsg rpc` y se comunica mediante JSON-RPC sobre stdio (sin daemon/puerto separado). Las acciones avanzadas requieren `imsg launch` y una prueba correcta de API privada.

<CardGroup cols={3}>
  <Card title="Acciones de API privada" icon="wand-sparkles" href="#private-api-actions">
    Respuestas, tapbacks, efectos, adjuntos y gestión de grupos.
  </Card>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los mensajes directos de iMessage usan el modo de emparejamiento de forma predeterminada.
  </Card>
  <Card title="Mac remoto" icon="terminal" href="#remote-mac-over-ssh">
    Usa un envoltorio SSH cuando Gateway no se ejecute en el Mac de Messages.
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

      <Step title="Aprobar el primer emparejamiento de mensaje directo (dmPolicy predeterminada)">

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

    Si `remoteHost` no está definido, OpenClaw intenta detectarlo automáticamente analizando el script envoltorio SSH.
    `remoteHost` debe ser `host` o `user@host` (sin espacios ni opciones SSH).
    OpenClaw usa verificación estricta de claves de host para SCP, así que la clave de host de retransmisión ya debe existir en `~/.ssh/known_hosts`.
    Las rutas de adjuntos se validan contra las raíces permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Cualquier envoltorio `cliPath` o proxy SSH que pongas delante de `imsg` DEBE comportarse como una tubería stdio transparente para JSON-RPC de larga duración. OpenClaw intercambia pequeños mensajes JSON-RPC enmarcados por saltos de línea sobre stdin/stdout del envoltorio durante toda la vida del canal:

- Reenvía cada fragmento/línea de stdin **en cuanto haya bytes disponibles**; no esperes a EOF.
- Reenvía cada fragmento/línea de stdout rápidamente en la dirección inversa.
- Conserva los saltos de línea.
- Evita lecturas bloqueantes de tamaño fijo (`read(4096)`, `cat | buffer`, `read` predeterminado de shell) que puedan privar de datos a tramas pequeñas.
- Mantén stderr separado del flujo stdout de JSON-RPC.

Un envoltorio que almacena stdin en búfer hasta que se llena un bloque grande producirá síntomas que parecen una interrupción de iMessage: `imsg rpc timeout (chats.list)` o reinicios repetidos del canal, aunque `imsg rpc` en sí esté sano. `ssh -T host imsg "$@"` (arriba) es seguro porque reenvía los argumentos `cliPath` de OpenClaw, como `rpc` y `--db`. Las tuberías como `ssh host imsg | grep -v '^DEBUG'` NO lo son: las herramientas con búfer por línea aún pueden retener tramas; usa `stdbuf -oL -eL` en cada etapa si debes filtrar.
</Warning>

  </Tab>
</Tabs>

## Requisitos y permisos (macOS)

- Messages debe tener sesión iniciada en el Mac que ejecuta `imsg`.
- Se requiere Acceso total al disco para el contexto de proceso que ejecuta OpenClaw/`imsg` (acceso a la base de datos de Messages).
- Se requiere permiso de Automatización para enviar mensajes mediante Messages.app.
- Para acciones avanzadas (reaccionar / editar / deshacer envío / respuesta en hilo / efectos / operaciones de grupo), System Integrity Protection debe estar deshabilitado; consulta [Habilitar la API privada de imsg](#enabling-the-imsg-private-api) más abajo. El envío/recepción básico de texto y medios funciona sin ello.

<Tip>
Los permisos se conceden por contexto de proceso. Si gateway se ejecuta sin interfaz (LaunchAgent/SSH), ejecuta un comando interactivo único en ese mismo contexto para activar los avisos:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="Los envíos del envoltorio SSH fallan con AppleEvents -1743">
  Una configuración SSH remota puede leer chats, pasar `channels status --probe` y procesar mensajes entrantes mientras los envíos salientes aún fallan con un error de autorización de AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Comprueba la base de datos TCC del usuario del Mac con sesión iniciada o Ajustes del Sistema > Privacidad y seguridad > Automatización. Si la entrada de Automatización se registra para `/usr/libexec/sshd-keygen-wrapper` en lugar del proceso `imsg` o shell local, macOS puede no exponer un conmutador utilizable de Messages para ese cliente del lado servidor SSH:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

En ese estado, repetir `tccutil reset AppleEvents` o volver a ejecutar `imsg send` mediante el mismo envoltorio SSH puede seguir fallando porque el contexto de proceso que necesita Automatización de Messages es el envoltorio SSH, no una app a la que la interfaz pueda conceder permisos.

Usa en su lugar uno de los contextos de proceso `imsg` admitidos:

- Ejecuta Gateway, o al menos el puente `imsg`, en la sesión local del usuario de Messages con sesión iniciada.
- Inicia Gateway con un LaunchAgent para ese usuario después de conceder Acceso total al disco y Automatización desde la misma sesión.
- Si mantienes la topología SSH de dos usuarios, verifica que un `imsg send` saliente real funcione mediante el envoltorio exacto antes de habilitar el canal. Si no se puede conceder Automatización, reconfigura a una configuración `imsg` de un solo usuario en lugar de depender del envoltorio SSH para los envíos.

</Accordion>

## Habilitar la API privada de imsg

`imsg` se distribuye en dos modos operativos:

- **Modo básico** (predeterminado, sin cambios de SIP necesarios): texto y medios salientes mediante `send`, vigilancia/historial entrante, lista de chats. Esto es lo que obtienes de inmediato con un `brew install steipete/tap/imsg` nuevo más los permisos estándar de macOS indicados arriba.
- **Modo de API privada**: `imsg` inyecta una dylib auxiliar en `Messages.app` para llamar a funciones internas de `IMCore`. Esto desbloquea `react`, `edit`, `unsend`, `reply` (en hilo), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, además de indicadores de escritura y confirmaciones de lectura.

Para llegar a la superficie de acciones avanzadas que documenta esta página de canal, necesitas el modo de API privada. El README de `imsg` es explícito sobre el requisito:

> Las funciones avanzadas como `read`, `typing`, `launch`, envío enriquecido respaldado por puente, mutación de mensajes y gestión de chats son opt-in. Requieren que SIP esté deshabilitado y que se inyecte una dylib auxiliar en `Messages.app`. `imsg launch` se niega a inyectar cuando SIP está habilitado.

La técnica de inyección auxiliar usa la propia dylib de `imsg` para acceder a las API privadas de Messages. No hay ningún servidor de terceros ni runtime de BlueBubbles en la ruta de iMessage de OpenClaw.

<Warning>
**Deshabilitar SIP es una concesión de seguridad real.** SIP es una de las protecciones centrales de macOS contra la ejecución de código de sistema modificado; desactivarlo en todo el sistema abre superficie de ataque adicional y efectos secundarios. En particular, **deshabilitar SIP en Macs Apple Silicon también deshabilita la capacidad de instalar y ejecutar apps iOS en tu Mac**.

Trátalo como una decisión operativa deliberada, no como un valor predeterminado. Si tu modelo de amenazas no puede tolerar que SIP esté desactivado, iMessage incluido queda limitado al modo básico: solo envío/recepción de texto y medios, sin reacciones / edición / deshacer envío / efectos / operaciones de grupo.
</Warning>

### Configuración

1. **Instala (o actualiza) `imsg`** en el Mac que ejecuta Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   La salida de `imsg status --json` informa `bridge_version`, `rpc_methods` y `selectors` por método para que puedas ver qué admite la compilación actual antes de empezar.

2. **Deshabilita System Integrity Protection y (en macOS moderno) Library Validation.** Inyectar una dylib auxiliar que no es de Apple en `Messages.app` firmado por Apple requiere SIP desactivado **y** validación de bibliotecas relajada. El paso de SIP en modo Recuperación depende de la versión de macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** deshabilita Library Validation mediante Terminal, reinicia en modo Recuperación, ejecuta `csrutil disable`, reinicia.
   - **macOS 11+ (Big Sur y posteriores), Intel:** modo Recuperación (o Recuperación por Internet), `csrutil disable`, reinicia.
   - **macOS 11+, Apple Silicon:** secuencia de arranque con botón de encendido para entrar en Recuperación; en versiones recientes de macOS mantén pulsada la tecla **Mayús izquierda** cuando hagas clic en Continuar, luego `csrutil disable`. Las configuraciones de máquina virtual siguen un flujo separado, así que toma primero una instantánea de la VM.

   **En macOS 11 y posteriores, `csrutil disable` por sí solo normalmente no basta.** Apple aún aplica validación de bibliotecas contra `Messages.app` como binario de plataforma, así que un auxiliar firmado adhoc se rechaza (`Library Validation failed: ... platform binary, but mapped file is not`) incluso con SIP desactivado. Después de deshabilitar SIP, deshabilita también la validación de bibliotecas y reinicia:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), verificado en 26.5.1:** SIP desactivado **más** el comando `DisableLibraryValidation` anterior basta para inyectar el auxiliar desde 26.0 hasta 26.5.x. **No se requieren boot-args.** El plist es el factor decisivo y el paso que falta con más frecuencia cuando la inyección falla en Tahoe:
   - **Con el plist:** `imsg launch` inyecta y `imsg status` informa `advanced_features: true`.
   - **Sin el plist (incluso con SIP desactivado):** `imsg launch` falla con `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI rechaza el auxiliar adhoc al cargar, así que el puente nunca queda listo y el lanzamiento agota el tiempo de espera. Ese tiempo de espera es el síntoma que la mayoría encuentra en Tahoe, y la solución es el plist anterior, no nada más drástico.

   Esto se confirmó con un antes/después controlado en macOS 26.5.1 (Apple Silicon): con el plist, la dylib se mapea en `Messages.app` y el puente arranca; elimina el plist y reinicia, y `imsg launch` produce el fallo de tiempo de espera anterior sin la dylib mapeada.

   Si la inyección de `imsg launch` o `selectors` específicos empiezan a devolver falso después de una actualización de macOS, esta puerta suele ser la causa. Comprueba el estado de SIP y de validación de bibliotecas antes de asumir que el propio paso de SIP falló. Si esos ajustes son correctos y el puente aún no puede inyectarse, recopila `imsg status --json` junto con la salida de `imsg launch` e infórmalo al proyecto `imsg` en lugar de debilitar controles de seguridad adicionales para todo el sistema.

   Sigue el flujo de Apple en modo Recuperación para tu Mac para desactivar SIP antes de ejecutar `imsg launch`.

3. **Inyecta el helper.** Con SIP desactivado y Messages.app con la sesión iniciada:

   ```bash
   imsg launch
   ```

   `imsg launch` se niega a inyectar cuando SIP sigue activado, así que esto también sirve como confirmación de que el paso 2 surtió efecto.

4. **Verifica el puente desde OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   La entrada de iMessage debería informar `works`, y `imsg status --json | jq '.selectors'` debería mostrar `retractMessagePart: true` más cualquier selector de edición / escritura / lectura que exponga tu compilación de macOS. La puerta por método del plugin de OpenClaw en `actions.ts` solo anuncia acciones cuyo selector subyacente es `true`, así que la superficie de acciones que ves en la lista de herramientas del agente refleja lo que el puente realmente puede hacer en este host.

Si `openclaw channels status --probe` informa que el canal está como `works` pero acciones específicas arrojan "iMessage `<action>` requiere el puente de API privada imsg" en el momento del envío, vuelve a ejecutar `imsg launch`: el helper puede desprenderse (reinicio de Messages.app, actualización del sistema operativo, etc.) y el estado en caché `available: true` seguirá anunciando acciones hasta que el siguiente sondeo se actualice.

### Cuando no puedes desactivar SIP

Si SIP desactivado no es aceptable para tu modelo de amenazas:

- `imsg` recurre al modo básico: solo texto + multimedia + recepción.
- El plugin de OpenClaw sigue anunciando envío de texto/multimedia y monitoreo entrante; simplemente oculta `react`, `edit`, `unsend`, `reply`, `sendWithEffect` y operaciones de grupo de la superficie de acciones (según la puerta de capacidad por método).
- Puedes ejecutar un Mac no Apple Silicon separado (o un Mac de bot dedicado) con SIP desactivado para la carga de trabajo de iMessage, mientras mantienes SIP activado en tus dispositivos principales. Consulta [Usuario de bot macOS dedicado (identidad de iMessage separada)](#deployment-patterns) más abajo.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` controla los mensajes directos:

    - `pairing` (predeterminado)
    - `allowlist`
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    Campo de lista de permitidos: `channels.imessage.allowFrom`.

    Las entradas de la lista de permitidos deben identificar remitentes: identificadores o grupos estáticos de acceso de remitentes (`accessGroup:<name>`). Usa `channels.imessage.groupAllowFrom` para destinos de chat como `chat_id:*`, `chat_guid:*` o `chat_identifier:*`; usa `channels.imessage.groups` para claves numéricas de registro `chat_id`.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` controla el manejo de grupos:

    - `allowlist` (predeterminado cuando está configurado)
    - `open`
    - `disabled`

    Lista de permitidos de remitentes de grupo: `channels.imessage.groupAllowFrom`.

    Las entradas de `groupAllowFrom` también pueden hacer referencia a grupos estáticos de acceso de remitentes (`accessGroup:<name>`).

    Reserva en tiempo de ejecución: si `groupAllowFrom` no está establecido, las comprobaciones de remitentes de grupo de iMessage usan `allowFrom`; establece `groupAllowFrom` cuando la admisión de DM y de grupo deba diferir.
    Nota de tiempo de ejecución: si `channels.imessage` falta por completo, el tiempo de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (aunque `channels.defaults.groupPolicy` esté establecido).

    <Warning>
    El enrutamiento de grupos tiene **dos** puertas de lista de permitidos que se ejecutan una tras otra, y ambas deben pasar:

    1. **Lista de permitidos de remitente / destino de chat** (`channels.imessage.groupAllowFrom`): identificador, `chat_guid`, `chat_identifier` o `chat_id`.
    2. **Registro de grupos** (`channels.imessage.groups`): con `groupPolicy: "allowlist"`, esta puerta requiere una entrada comodín `groups: { "*": { ... } }` (establece `allowAll = true`) o una entrada explícita por `chat_id` bajo `groups`.

    Si la puerta 2 no tiene nada, todos los mensajes de grupo se descartan. El plugin emite dos señales de nivel `warn` con el nivel de registro predeterminado:

    - una vez por cuenta al inicio: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - una vez por `chat_id` en tiempo de ejecución: `imessage: dropping group message from chat_id=<id> ...`

    Los DM siguen funcionando porque toman una ruta de código distinta.

    Configuración mínima para mantener los grupos fluyendo bajo `groupPolicy: "allowlist"`:

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

    Si esas líneas `warn` aparecen en el registro del Gateway, la puerta 2 está descartando: añade el bloque `groups`.
    </Warning>

    Puerta de menciones para grupos:

    - iMessage no tiene metadatos de mención nativos
    - la detección de menciones usa patrones regex (`agents.list[].groupChat.mentionPatterns`, reserva `messages.groupChat.mentionPatterns`)
    - sin patrones configurados, la puerta de menciones no se puede aplicar

    Los comandos de control de remitentes autorizados pueden omitir la puerta de menciones en grupos.

    `systemPrompt` por grupo:

    Cada entrada bajo `channels.imessage.groups.*` acepta una cadena opcional `systemPrompt`. El valor se inyecta en el prompt de sistema del agente en cada turno que maneja un mensaje en ese grupo. La resolución refleja la resolución de prompt por grupo usada por `channels.whatsapp.groups`:

    1. **Prompt de sistema específico del grupo** (`groups["<chat_id>"].systemPrompt`): se usa cuando la entrada de grupo específica existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), el comodín se suprime y no se aplica ningún prompt de sistema a ese grupo.
    2. **Prompt de sistema comodín de grupo** (`groups["*"].systemPrompt`): se usa cuando la entrada de grupo específica está completamente ausente del mapa, o cuando existe pero no define ninguna clave `systemPrompt`.

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

  <Tab title="Sessions and deterministic replies">
    - Los MD usan enrutamiento directo; los grupos usan enrutamiento de grupo.
    - Con el valor predeterminado `session.dmScope=main`, los MD de iMessage se agrupan en la sesión principal del agente.
    - Las sesiones de grupo están aisladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Las respuestas se enrutan de vuelta a iMessage usando los metadatos de canal/destino de origen.

    Comportamiento de hilos tipo grupo:

    Algunos hilos de iMessage con varios participantes pueden llegar con `is_group=false`.
    Si ese `chat_id` está configurado explícitamente en `channels.imessage.groups`, OpenClaw lo trata como tráfico de grupo (control de acceso de grupo + aislamiento de sesión de grupo).

  </Tab>
</Tabs>

## Enlaces de conversación ACP

Los chats heredados de iMessage también se pueden enlazar a sesiones ACP.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del MD o del chat de grupo permitido.
- Los mensajes futuros en esa misma conversación de iMessage se enrutan a la sesión ACP iniciada.
- `/new` y `/reset` reinician la misma sesión ACP enlazada en el mismo lugar.
- `/acp close` cierra la sesión ACP y elimina el enlace.

Se admiten enlaces persistentes configurados mediante entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "imessage"`.

`match.peer.id` puede usar:

- identificador de MD normalizado, como `+15555550123` o `user@example.com`
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
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Usa un Apple ID y un usuario de macOS dedicados para que el tráfico del bot quede aislado de tu perfil personal de Mensajes.

    Flujo típico:

    1. Crea un usuario de macOS dedicado e inicia sesión en él.
    2. Inicia sesión en Mensajes con el Apple ID del bot en ese usuario.
    3. Instala `imsg` en ese usuario.
    4. Crea un contenedor SSH para que OpenClaw pueda ejecutar `imsg` en el contexto de ese usuario.
    5. Apunta `channels.imessage.accounts.<id>.cliPath` y `.dbPath` a ese perfil de usuario.

    La primera ejecución puede requerir aprobaciones de la GUI (Automatización + Acceso total al disco) en esa sesión de usuario del bot.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Topología común:

    - el Gateway se ejecuta en Linux/VM
    - iMessage + `imsg` se ejecuta en un Mac de tu tailnet
    - el contenedor `cliPath` usa SSH para ejecutar `imsg`
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

    Usa claves SSH para que tanto SSH como SCP no sean interactivos.
    Asegúrate primero de que la clave del host sea de confianza (por ejemplo, `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` esté poblado.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage admite configuración por cuenta en `channels.imessage.accounts`.

    Cada cuenta puede sobrescribir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, la configuración de historial y las listas de rutas raíz permitidas para adjuntos.

  </Accordion>

  <Accordion title="Direct-message history">
    Configura `channels.imessage.dmHistoryLimit` para inicializar nuevas sesiones de mensajes directos con el historial reciente decodificado de `imsg` para esa conversación. Usa `channels.imessage.dms["<sender>"].historyLimit` para sobrescrituras por remitente, incluido `0` para deshabilitar el historial de un remitente.

    El historial de MD de iMessage se obtiene bajo demanda desde `imsg`. Dejar `dmHistoryLimit` sin definir deshabilita la inicialización global del historial de MD, pero un valor positivo de `channels.imessage.dms["<sender>"].historyLimit` por remitente aún habilita la inicialización para ese remitente.

  </Accordion>
</AccordionGroup>

## Medios, fragmentación y destinos de entrega

<AccordionGroup>
  <Accordion title="Archivos adjuntos y medios">
    - la ingesta de archivos adjuntos entrantes está **desactivada de forma predeterminada**; establece `channels.imessage.includeAttachments: true` para reenviar fotos, notas de voz, video y otros archivos adjuntos al agente. Con esta opción desactivada, los iMessages que solo contienen archivos adjuntos se descartan antes de llegar al agente y es posible que no produzcan ninguna línea de registro `Inbound message`.
    - las rutas de archivos adjuntos remotos se pueden obtener mediante SCP cuando `remoteHost` está configurado
    - las rutas de archivos adjuntos deben coincidir con las raíces permitidas:
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
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Acciones disponibles">
    - **react**: Agrega/elimina tapbacks de iMessage (`messageId`, `emoji`, `remove`). Los tapbacks admitidos se asignan a amor, me gusta, no me gusta, risa, énfasis y pregunta.
    - **reply**: Envía una respuesta en hilo a un mensaje existente (`messageId`, `text` o `message`, más `chatGuid`, `chatId`, `chatIdentifier` o `to`).
    - **sendWithEffect**: Envía texto con un efecto de iMessage (`text` o `message`, `effect` o `effectId`).
    - **edit**: Edita un mensaje enviado en versiones compatibles de macOS/API privada (`messageId`, `text` o `newText`).
    - **unsend**: Retira un mensaje enviado en versiones compatibles de macOS/API privada (`messageId`).
    - **upload-file**: Envía medios/archivos (`buffer` como base64 o un `media`/`path`/`filePath` hidratado, `filename`, `asVoice` opcional). Alias heredado: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gestiona chats grupales cuando el destino actual es una conversación grupal.

  </Accordion>

  <Accordion title="ID de mensajes">
    El contexto entrante de iMessage incluye tanto valores `MessageSid` cortos como GUID completos de mensaje cuando están disponibles. Los ID cortos están limitados a la caché reciente de respuestas respaldada por SQLite y se comprueban contra el chat actual antes de usarse. Si un ID corto expiró o pertenece a otro chat, vuelve a intentarlo con el `MessageSidFull` completo.

  </Accordion>

  <Accordion title="Detección de capacidades">
    OpenClaw oculta las acciones de API privada solo cuando el estado de la comprobación en caché indica que el puente no está disponible. Si el estado es desconocido, las acciones permanecen visibles y ejecutan comprobaciones de forma diferida para que la primera acción pueda tener éxito después de `imsg launch` sin una actualización manual de estado aparte.

  </Accordion>

  <Accordion title="Confirmaciones de lectura y escritura">
    Cuando el puente de API privada está activo, los chats entrantes aceptados se marcan como leídos y los chats directos muestran una burbuja de escritura en cuanto se acepta el turno, mientras el agente prepara el contexto y genera. Desactiva el marcado de lectura con:

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

    - `"own"` (predeterminado): notificar solo cuando los usuarios reaccionen a mensajes creados por el bot.
    - `"all"`: notificar todos los tapbacks entrantes de remitentes autorizados.
    - `"off"`: ignorar tapbacks entrantes.

    Las anulaciones por cuenta usan `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reacciones de aprobación (👍 / 👎)">
    Cuando `approvals.exec.enabled` o `approvals.plugin.enabled` es true y la solicitud se enruta a iMessage, el Gateway entrega una solicitud de aprobación de forma nativa y acepta un tapback para resolverla:

    - `👍` (tapback Me gusta) → `allow-once`
    - `👎` (tapback No me gusta) → `deny`
    - `allow-always` sigue siendo una alternativa manual: envía `/approve <id> allow-always` como una respuesta normal.

    El manejo de reacciones requiere que el identificador del usuario que reacciona sea un aprobador explícito. La lista de aprobadores se lee desde `channels.imessage.allowFrom` (o `channels.imessage.accounts.<id>.allowFrom`); agrega el número de teléfono del usuario en formato E.164 o su correo de Apple ID. La entrada comodín `"*"` se respeta, pero permite que cualquier remitente apruebe. El atajo de reacción omite intencionalmente `reactionNotifications`, `dmPolicy` y `groupAllowFrom` porque la lista de permitidos de aprobadores explícitos es la única barrera que importa para resolver aprobaciones.

    **Cambio de comportamiento con esta versión:** Cuando `channels.imessage.allowFrom` no está vacío, el comando de texto `/approve <id> <decision>` ahora se autoriza contra esa lista de aprobadores (no contra la lista de permitidos de DM más amplia). Los remitentes permitidos en la lista de permitidos de DM pero no en `allowFrom` recibirán una denegación explícita. Agrega a `allowFrom` a cada operador que deba poder aprobar mediante `/approve` (y mediante reacciones) para conservar el comportamiento anterior. Cuando `allowFrom` está vacío, la alternativa heredada de "mismo chat" sigue vigente y `/approve` continúa autorizando a cualquiera que permita la lista de permitidos de DM.

    Notas para operadores:
    - El vínculo de reacción se almacena tanto en memoria (con TTL igual al vencimiento de la aprobación) como en el almacén persistente con claves del Gateway, por lo que un tapback que llegue poco después de un reinicio del Gateway aún resuelve la aprobación.
    - Los tapbacks entre dispositivos con `is_from_me=true` (la propia reacción del operador en un dispositivo Apple emparejado) se ignoran intencionalmente para que el bot no pueda autoaprobarse.
    - Los tapbacks heredados de estilo texto (`Liked "…"` como texto plano de clientes Apple muy antiguos) no pueden resolver aprobaciones porque no llevan GUID de mensaje; la resolución de reacciones requiere los metadatos estructurados de tapback que emiten los clientes actuales de macOS/iOS.

  </Accordion>
</AccordionGroup>

## Escrituras de configuración

iMessage permite escrituras de configuración iniciadas por el canal de forma predeterminada (para `/config set|unset` cuando `commands.config: true`).

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

## Coalescencia de DM de envío dividido (comando + URL en una composición)

Cuando un usuario escribe un comando y una URL juntos, por ejemplo `Dump https://example.com/article`, la app Mensajes de Apple divide el envío en **dos filas `chat.db` separadas**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa OG como archivos adjuntos.

Las dos filas llegan a OpenClaw con una separación de ~0,8-2,0 s en la mayoría de las configuraciones. Sin coalescencia, el agente recibe solo el comando en el turno 1, responde (a menudo "envíame la URL") y solo ve la URL en el turno 2, momento en el que el contexto del comando ya se perdió. Esto es la canalización de envío de Apple, no algo que introduzcan OpenClaw o `imsg`.

`channels.imessage.coalesceSameSenderDms` activa en un DM el almacenamiento en búfer de filas consecutivas del mismo remitente. Cuando `imsg` expone el marcador estructural de vista previa de URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` en una de las filas de origen, OpenClaw fusiona solo ese envío dividido real y mantiene cualquier otra fila en búfer como turnos separados. En compilaciones antiguas de `imsg` que no emiten ningún metadato de globo, OpenClaw no puede distinguir un envío dividido de envíos separados, por lo que recurre a fusionar el lote. Eso conserva el comportamiento anterior a los metadatos en lugar de hacer que los envíos divididos `Dump <url>` regresen a dos turnos. Los chats grupales siguen despachándose por mensaje para preservar la estructura de turnos multiusuario.

<Tabs>
  <Tab title="Cuándo activarlo">
    Actívalo cuando:

    - Distribuyes Skills que esperan `command + payload` en un mensaje (volcar, pegar, guardar, poner en cola, etc.).
    - Tus usuarios pegan URL junto a comandos.
    - Puedes aceptar la latencia adicional del turno de DM (ver abajo).

    Déjalo desactivado cuando:

    - Necesitas latencia mínima de comandos para disparadores de DM de una sola palabra.
    - Todos tus flujos son comandos de un solo paso sin seguimientos de carga útil.

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

    Con la marca activada y sin `messages.inbound.byChannel.imessage` explícito ni `messages.inbound.debounceMs` global, la ventana de rebote se amplía a **7000 ms** (el valor predeterminado heredado es 0 ms: sin rebote). La ventana más amplia es necesaria porque la cadencia de envío dividido de vista previa de URL de Apple puede extenderse a varios segundos mientras Messages.app emite la fila de vista previa.

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
    - **La fusión precisa necesita metadatos actuales de carga útil de `imsg`.** Cuando la fila de URL incluye `balloon_bundle_id`, solo se fusiona ese envío dividido real y otras filas en búfer permanecen separadas. En compilaciones antiguas de `imsg` que no exponen metadatos de globo, OpenClaw recurre a fusionar el lote en búfer para que los envíos divididos `Dump <url>` no regresen a dos turnos (compatibilidad temporal, se eliminará cuando `imsg` coaleszca los envíos divididos en origen).
    - **Latencia adicional para mensajes de DM.** Con la marca activada, cada DM (incluidos comandos de control independientes y seguimientos de un solo texto) espera hasta la ventana de rebote antes de despacharse, por si viene una fila de vista previa de URL. Los mensajes de chat grupal mantienen despacho instantáneo.
    - **La salida fusionada está acotada.** El texto fusionado tiene un límite de 4000 caracteres con un marcador explícito `…[truncated]`; los archivos adjuntos tienen un límite de 20; las entradas de origen tienen un límite de 10 (se conservan la primera y las más recientes más allá de eso). Cada GUID de origen se rastrea en `coalescedMessageGuids` para telemetría posterior.
    - **Solo DM.** Los chats grupales pasan al despacho por mensaje para que el bot siga respondiendo cuando varias personas escriben.
    - **Opt-in, por canal.** Otros canales (Telegram, WhatsApp, Slack, …) no se ven afectados. Las configuraciones heredadas de BlueBubbles que establecen `channels.bluebubbles.coalesceSameSenderDms` deben migrar ese valor a `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Escenarios y lo que ve el agente

La columna "Indicador activado" muestra el comportamiento en una compilación de `imsg` que emite `balloon_bundle_id`. En compilaciones antiguas de `imsg` que no emiten ningún metadato de globo, las filas marcadas abajo como "Dos turnos" / "N turnos" vuelven en su lugar a una fusión heredada (un turno): OpenClaw no puede distinguir estructuralmente un envío dividido de envíos separados, así que conserva la fusión previa a los metadatos. La separación precisa se activa cuando la compilación emite metadatos de globo.

| El usuario redacta                                                 | `chat.db` produce                   | Indicador desactivado (predeterminado)  | Indicador activado + ventana (`imsg` emite metadatos de globo)                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (un envío)                              | 2 filas con ~1 s de diferencia      | Dos turnos de agente: "Dump" solo, luego URL | Un turno: texto fusionado `Dump https://example.com`                                                |
| `Save this 📎image.jpg caption` (adjunto + texto)                  | 2 filas sin metadatos de globo de URL | Dos turnos                              | Dos turnos después de observar metadatos; un turno fusionado en sesiones antiguas/previas al latch sin metadatos |
| `/status` (comando independiente)                                  | 1 fila                              | Despacho instantáneo                    | **Esperar hasta la ventana y luego despachar**                                                      |
| URL pegada sola                                                    | 1 fila                              | Despacho instantáneo                    | Esperar hasta la ventana y luego despachar                                                          |
| Texto + URL enviados como dos mensajes separados deliberados, con minutos de diferencia | 2 filas fuera de la ventana         | Dos turnos                              | Dos turnos (la ventana expira entre ellos)                                                          |
| Avalancha rápida (>10 DM pequeños dentro de la ventana)            | N filas sin metadatos de globo de URL | N turnos                                | N turnos después de observar metadatos; un turno fusionado acotado en sesiones antiguas/previas al latch sin metadatos |
| Dos personas escribiendo en un chat grupal                         | N filas de M remitentes             | M+ turnos (uno por bloque de remitente) | M+ turnos — los chats grupales no se fusionan                                                       |

## Recuperación de entrada después de reiniciar un puente o Gateway

iMessage recupera los mensajes perdidos mientras el Gateway estaba caído y, al mismo tiempo, suprime la "bomba de backlog" obsoleta que Apple puede volcar después de una recuperación de Push. El comportamiento predeterminado está siempre activado, construido sobre la deduplicación de entrada.

- **Deduplicación de repetición.** Cada mensaje entrante despachado se registra por su GUID de Apple en el estado persistente del Plugin (`imessage.inbound-dedupe`), se reclama durante la ingesta y se confirma después de procesarlo (se libera ante un fallo transitorio para que pueda reintentarse). Todo lo ya procesado se descarta en lugar de despacharse dos veces. Esto permite que la recuperación repita de forma agresiva sin contabilidad por mensaje.
- **Recuperación de inactividad.** Al iniciar, el monitor recuerda el último `rowid` de `chat.db` despachado (un cursor persistido por cuenta) y lo pasa a `imsg watch.subscribe` como `since_rowid`, de modo que imsg repite las filas que llegaron mientras el Gateway estaba caído y luego sigue en vivo. La repetición se limita a las filas más recientes y a mensajes de hasta ~2 horas de antigüedad, y la deduplicación descarta todo lo ya procesado.
- **Valla de antigüedad para backlog obsoleto.** Las filas por encima del límite de inicio son realmente en vivo; una cuya fecha de envío sea más de ~15 minutos anterior a su llegada es backlog volcado por Push y se suprime. Las filas repetidas (en el límite o por debajo) usan en su lugar la ventana de recuperación más amplia, por lo que un mensaje perdido recientemente se entrega mientras que el historial antiguo no.

La recuperación funciona tanto con configuraciones `cliPath` locales como remotas, porque la repetición `since_rowid` se ejecuta sobre la misma conexión RPC de `imsg`. La diferencia es la ventana: cuando el Gateway puede leer `chat.db` (local), ancla el límite `rowid` de inicio, limita el intervalo de repetición y entrega mensajes perdidos de hasta un par de horas de antigüedad. Con un `cliPath` SSH remoto no puede leer la base de datos, así que la repetición no tiene límite y cada fila usa la valla de antigüedad en vivo: sigue recuperando mensajes perdidos recientemente y sigue suprimiendo backlog antiguo, solo con la ventana en vivo más estrecha. Ejecuta el Gateway en la Mac de Messages para obtener la ventana de recuperación más amplia.

### Señal visible para el operador

El backlog suprimido se registra en el nivel predeterminado, nunca se descarta silenciosamente (el indicador `recovery` muestra qué ventana se aplicó):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migración

`channels.imessage.catchup.*` está obsoleto: la recuperación de inactividad ahora es automática y no necesita configuración para nuevas instalaciones. Las configuraciones existentes con `catchup.enabled: true` siguen respetándose como perfil de compatibilidad para la ventana de repetición de recuperación. Los bloques catchup desactivados (`enabled: false` o sin `enabled: true`) se retiran; `openclaw doctor --fix` los elimina.

## Solución de problemas

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Valida el binario y el soporte RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Si la comprobación informa que RPC no es compatible, actualiza `imsg`. Si las acciones de API privada no están disponibles, ejecuta `imsg launch` en la sesión del usuario de macOS que ha iniciado sesión y vuelve a comprobar. Si el Gateway no se ejecuta en macOS, usa en su lugar la configuración de Mac remota por SSH descrita arriba en vez de la ruta local predeterminada de `imsg`.

  </Accordion>

  <Accordion title="Messages send but inbound iMessages do not arrive">
    Primero demuestra si el mensaje llegó a la Mac local. Si `chat.db` no cambia, OpenClaw no puede recibir el mensaje aunque `imsg status --json` informe que el puente está sano.

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

    Envía un iMessage nuevo desde el teléfono y confirma una nueva fila de `chat.db` o un evento de `imsg watch` antes de depurar sesiones de OpenClaw. No ejecutes esto como un bucle periódico de reinicio del puente; repetir `imsg launch` más reinicios del Gateway durante trabajo activo puede interrumpir entregas y dejar bloqueadas ejecuciones de canal en curso.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    El `cliPath: "imsg"` predeterminado debe ejecutarse en la Mac con sesión iniciada en Messages. En Linux o Windows, configura `channels.imessage.cliPath` con un script envoltorio que haga SSH a esa Mac y ejecute `imsg "$@"`.

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
    - comportamiento de la lista de permitidos `channels.imessage.groups`
    - configuración de patrones de mención (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    Comprueba:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticación con clave SSH/SCP desde el host del Gateway
    - que la clave del host exista en `~/.ssh/known_hosts` en el host del Gateway
    - legibilidad de la ruta remota en la Mac que ejecuta Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Vuelve a ejecutar en una terminal GUI interactiva en el mismo contexto de usuario/sesión y aprueba los avisos:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirma que Full Disk Access + Automation estén concedidos para el contexto de proceso que ejecuta OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Punteros de referencia de configuración

- [Referencia de configuración - iMessage](/es/gateway/config-channels#imessage)
- [Configuración del Gateway](/es/gateway/configuration)
- [Emparejamiento](/es/channels/pairing)

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Eliminación de BlueBubbles y la ruta de iMessage con imsg](/es/announcements/bluebubbles-imessage) — anuncio y resumen de migración
- [Venir de BlueBubbles](/es/channels/imessage-from-bluebubbles) — tabla de traducción de configuración y migración paso a paso
- [Emparejamiento](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats grupales y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
