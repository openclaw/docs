---
read_when:
    - Configurar la compatibilidad con iMessage
    - Depuración del envío/recepción de iMessage
summary: Compatibilidad nativa con iMessage mediante imsg (JSON-RPC sobre stdio), con acciones de API privada para respuestas, tapbacks, efectos, encuestas, adjuntos y gestión de grupos. Preferido para nuevas configuraciones de iMessage de OpenClaw cuando los requisitos del host encajan.
title: iMessage
x-i18n:
    generated_at: "2026-07-05T17:39:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f4932ab612ce9ef8542e030962f64b828a633167654a0dfe09561aff543cc96
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para despliegues de OpenClaw iMessage, usa `imsg` en un host de Mensajes de macOS con sesión iniciada. Si tu Gateway se ejecuta en Linux o Windows, apunta `channels.imessage.cliPath` a un contenedor SSH que ejecute `imsg` en el Mac.

**La recuperación entrante es automática.** Después de reiniciar un puente o gateway, iMessage reproduce los mensajes perdidos mientras estaba inactivo y suprime la "bomba de backlog" obsoleta que Apple puede volcar tras una recuperación Push, deduplicando para que nada se despache dos veces. No hay configuración que habilitar; consulta [Recuperación entrante después de reiniciar un puente o gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Se eliminó la compatibilidad con BlueBubbles. Migra las configuraciones `channels.bluebubbles` a `channels.imessage`; OpenClaw admite iMessage solo mediante `imsg`. Empieza con [Eliminación de BlueBubbles y la ruta iMessage de imsg](/es/announcements/bluebubbles-imessage) para el anuncio breve, o [Migrar desde BlueBubbles](/es/channels/imessage-from-bluebubbles) para la tabla de migración completa.
</Warning>

Estado: integración nativa con CLI externa. El Gateway inicia `imsg rpc` y habla JSON-RPC por stdio, sin daemon ni puerto separados. Las acciones avanzadas requieren `imsg launch` y una comprobación correcta de API privada.

<CardGroup cols={3}>
  <Card title="Acciones de API privada" icon="wand-sparkles" href="#private-api-actions">
    Respuestas, tapbacks, efectos, encuestas, adjuntos y gestión de grupos.
  </Card>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los MD de iMessage usan por defecto el modo de emparejamiento.
  </Card>
  <Card title="Mac remoto" icon="terminal" href="#remote-mac-over-ssh">
    Usa un contenedor SSH cuando el Gateway no se ejecuta en el Mac de Mensajes.
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

      <Step title="Aprobar el primer emparejamiento por MD (dmPolicy predeterminada)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Las solicitudes de emparejamiento caducan después de 1 hora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto por SSH">
    OpenClaw solo requiere un `cliPath` compatible con stdio, por lo que puedes apuntar `cliPath` a un script contenedor que haga SSH a un Mac remoto y ejecute `imsg`.

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
      // Optional: extra allowed attachment roots (merged with the default
      // /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Si `remoteHost` no está definido, OpenClaw intenta detectarlo automáticamente analizando el script contenedor SSH.
    `remoteHost` debe ser `host` o `user@host` (sin espacios ni opciones SSH); los valores inseguros se ignoran.
    OpenClaw usa comprobación estricta de clave de host para SCP, por lo que la clave del host de retransmisión ya debe existir en `~/.ssh/known_hosts`.
    Las rutas de adjuntos se validan contra raíces permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Cualquier contenedor `cliPath` o proxy SSH que pongas delante de `imsg` DEBE comportarse como una tubería stdio transparente para JSON-RPC de larga duración. OpenClaw intercambia pequeños mensajes JSON-RPC delimitados por saltos de línea a través de stdin/stdout del contenedor durante toda la vida del canal:

- Reenvía cada fragmento/línea de stdin **en cuanto haya bytes disponibles**; no esperes a EOF.
- Reenvía puntualmente cada fragmento/línea de stdout en sentido inverso.
- Conserva los saltos de línea.
- Evita lecturas bloqueantes de tamaño fijo (`read(4096)`, `cat | buffer`, `read` predeterminado del shell) que pueden dejar sin atender marcos pequeños.
- Mantén stderr separado del flujo stdout de JSON-RPC.

Un contenedor que almacena stdin en búfer hasta llenar un bloque grande producirá síntomas que parecen una interrupción de iMessage: `imsg rpc timeout (chats.list)` o reinicios repetidos del canal, aunque `imsg rpc` en sí esté sano. `ssh -T host imsg "$@"` (arriba) es seguro porque reenvía los argumentos `cliPath` de OpenClaw, como `rpc` y `--db`. Las canalizaciones como `ssh host imsg | grep -v '^DEBUG'` NO lo son: las herramientas con búfer por línea aún pueden retener marcos; usa `stdbuf -oL -eL` en cada etapa si debes filtrar.
</Warning>

  </Tab>
</Tabs>

## Requisitos y permisos (macOS)

- Mensajes debe tener la sesión iniciada en el Mac que ejecuta `imsg`.
- Se requiere Acceso total al disco para el contexto de proceso que ejecuta OpenClaw/`imsg` (acceso a la base de datos de Mensajes).
- Se requiere permiso de Automatización para enviar mensajes a través de Messages.app.
- Para acciones avanzadas (reaccionar / editar / anular envío / respuesta en hilo / efectos / encuestas / operaciones de grupo), System Integrity Protection debe estar desactivado; consulta [Habilitar la API privada de imsg](#enabling-the-imsg-private-api). El envío y la recepción básicos de texto y medios funcionan sin ello.

<Tip>
Los permisos se conceden por contexto de proceso. Si el gateway se ejecuta sin interfaz (LaunchAgent/SSH), ejecuta una vez un comando interactivo en ese mismo contexto para activar los avisos:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="Los envíos del contenedor SSH fallan con AppleEvents -1743">
  Una configuración por SSH remoto puede leer chats, pasar `channels status --probe` y procesar mensajes entrantes mientras los envíos salientes siguen fallando con un error de autorización de AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Comprueba la base de datos TCC del usuario del Mac con sesión iniciada o Ajustes del Sistema > Privacidad y seguridad > Automatización. Si la entrada de Automatización se registra para `/usr/libexec/sshd-keygen-wrapper` en lugar del proceso `imsg` o shell local, es posible que macOS no exponga un conmutador de Mensajes usable para ese cliente del lado del servidor SSH:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

En ese estado, repetir `tccutil reset AppleEvents` o volver a ejecutar `imsg send` mediante el mismo contenedor SSH puede seguir fallando porque el contexto de proceso que necesita Automatización de Mensajes es el contenedor SSH, no una app a la que la UI pueda concederlo.

Usa en su lugar uno de los contextos de proceso de `imsg` compatibles:

- Ejecuta el Gateway, o al menos el puente `imsg`, en la sesión local del usuario de Mensajes con sesión iniciada.
- Inicia el Gateway con un LaunchAgent para ese usuario después de conceder Acceso total al disco y Automatización desde la misma sesión.
- Si mantienes la topología SSH de dos usuarios, verifica que un `imsg send` saliente real funcione mediante el contenedor exacto antes de habilitar el canal. Si no se le puede conceder Automatización, reconfigura a una configuración `imsg` de un solo usuario en lugar de depender del contenedor SSH para los envíos.

</Accordion>

## Habilitar la API privada de imsg

`imsg` se distribuye en dos modos operativos:

- **Modo básico** (predeterminado, no requiere cambios en SIP): texto y medios salientes mediante `send`, vigilancia/historial entrante, lista de chats. Esto es lo que obtienes de inmediato con una instalación nueva de `brew install steipete/tap/imsg` más los permisos estándar de macOS anteriores.
- **Modo de API privada**: `imsg` inyecta una dylib auxiliar en `Messages.app` para llamar a funciones internas de `IMCore`. Esto habilita `react`, `edit`, `unsend`, `reply` (en hilo), `sendWithEffect`, `poll` y `poll-vote` (encuestas nativas de Mensajes), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, además de indicadores de escritura y confirmaciones de lectura.

La superficie de acciones avanzadas de esta página requiere el modo de API privada. El README de `imsg` es explícito sobre el requisito:

> Las funciones avanzadas como `read`, `typing`, `launch`, envío enriquecido respaldado por puente, mutación de mensajes y gestión de chats son optativas. Requieren que SIP esté desactivado y que se inyecte una dylib auxiliar en `Messages.app`. `imsg launch` se niega a inyectar cuando SIP está activado.

La técnica de inyección de auxiliar usa la propia dylib de `imsg` para llegar a las API privadas de Mensajes. No hay servidor de terceros ni runtime de BlueBubbles en la ruta OpenClaw iMessage.

<Warning>
**Desactivar SIP es una concesión real de seguridad.** SIP es una de las protecciones centrales de macOS contra la ejecución de código de sistema modificado; desactivarlo en todo el sistema abre superficie de ataque y efectos secundarios adicionales. En particular, **desactivar SIP en Macs con Apple Silicon también desactiva la capacidad de instalar y ejecutar apps de iOS en tu Mac**.

Trata esto como una decisión operativa deliberada, no como un valor predeterminado. Si tu modelo de amenazas no puede tolerar que SIP esté desactivado, iMessage incluido se limita al modo básico: solo envío/recepción de texto y medios, sin reacciones / edición / anulación de envío / efectos / operaciones de grupo.
</Warning>

### Configuración

1. **Instala (o actualiza) `imsg`** en el Mac que ejecuta Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   La salida de `imsg status --json` informa de `bridge_version`, `rpc_methods` y `selectors` por método para que puedas ver qué admite la compilación actual antes de empezar.

2. **Desactiva System Integrity Protection y (en macOS moderno) Library Validation.** Inyectar una dylib auxiliar no Apple en la `Messages.app` firmada por Apple requiere SIP desactivado **y** validación de bibliotecas relajada. El paso de SIP en modo Recuperación es específico de la versión de macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** desactiva Library Validation mediante Terminal, reinicia en modo Recuperación, ejecuta `csrutil disable`, reinicia.
   - **macOS 11+ (Big Sur y posterior), Intel:** modo Recuperación (o Recuperación por Internet), `csrutil disable`, reinicia.
   - **macOS 11+, Apple Silicon:** secuencia de inicio con botón de encendido para entrar en Recuperación; en versiones recientes de macOS, mantén pulsada la tecla **Mayús izquierda** al hacer clic en Continuar y luego `csrutil disable`. Las configuraciones de máquina virtual siguen un flujo separado, así que toma primero una instantánea de la VM.

   **En macOS 11 y posterior, `csrutil disable` por sí solo normalmente no basta.** Apple sigue imponiendo la validación de bibliotecas contra `Messages.app` como binario de plataforma, por lo que se rechaza un auxiliar firmado ad hoc (`Library Validation failed: ... platform binary, but mapped file is not`) incluso con SIP desactivado. Después de desactivar SIP, desactiva también la validación de bibliotecas y reinicia:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), verificado en 26.5.1:** SIP desactivado **más** el comando `DisableLibraryValidation` anterior basta para inyectar el auxiliar desde 26.0 hasta 26.5.x. **No se requieren boot-args.** El plist es el factor decisivo y el paso que falta con más frecuencia cuando la inyección falla en Tahoe:
   - **Con el plist:** `imsg launch` inyecta y `imsg status` informa `advanced_features: true`.
   - **Sin el plist (incluso con SIP desactivado):** `imsg launch` falla con `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI rechaza el auxiliar ad hoc al cargarlo, por lo que el puente nunca queda listo y el lanzamiento agota el tiempo de espera. Ese tiempo de espera es el síntoma más común en Tahoe; la solución es el plist anterior, no nada más drástico.

   Si la inyección de `imsg launch` o `selectors` específicos empiezan a devolver false después de una actualización de macOS, esta barrera suele ser la causa. Comprueba el estado de SIP y de validación de bibliotecas antes de asumir que el propio paso de SIP falló. Si esos ajustes son correctos y el puente aún no puede inyectarse, recopila `imsg status --json` junto con la salida de `imsg launch` y repórtalo al proyecto `imsg` en lugar de debilitar controles de seguridad adicionales en todo el sistema.

3. **Inyecta el asistente.** Con SIP desactivado y Messages.app con la sesión iniciada:

   ```bash
   imsg launch
   ```

   `imsg launch` se niega a inyectar cuando SIP sigue activado, por lo que esto también sirve como confirmación de que el paso 2 surtió efecto.

4. **Verifica el puente desde OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   La entrada de iMessage debería informar `works`, y `imsg status --json | jq '{rpc_methods, selectors}'` debería mostrar las capacidades expuestas por tu compilación de macOS. La creación de encuestas requiere `selectors.pollPayloadMessage`; votar requiere tanto `selectors.pollVoteMessage` como el método RPC `poll.vote`. El Plugin de OpenClaw anuncia solo las acciones admitidas por la prueba almacenada en caché, mientras que una caché vacía se mantiene optimista y prueba en el primer envío.

Si `openclaw channels status --probe` informa que el canal está en `works`, pero acciones específicas lanzan "iMessage `<action>` requires the imsg private API bridge" en el momento del envío, ejecuta `imsg launch` de nuevo: el asistente puede desconectarse (reinicio de Messages.app, actualización del SO, etc.) y el estado `available: true` almacenado en caché seguirá anunciando acciones hasta que la próxima prueba lo actualice.

### Cuando SIP permanece activado

Si desactivar SIP no es aceptable para tu modelo de amenazas:

- `imsg` vuelve al modo básico: solo texto + medios + recepción.
- El Plugin de OpenClaw sigue anunciando envío de texto/medios y supervisión entrante; oculta `react`, `edit`, `unsend`, `reply`, `sendWithEffect` y las operaciones de grupo de la superficie de acciones (según la puerta de capacidad por método).
- Puedes ejecutar un Mac independiente que no sea Apple Silicon (o un Mac dedicado para bot) con SIP desactivado para la carga de trabajo de iMessage, mientras mantienes SIP activado en tus dispositivos principales. Consulta [Usuario macOS dedicado para bot (identidad de iMessage separada)](#deployment-patterns) a continuación.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de MD">
    `channels.imessage.dmPolicy` controla los mensajes directos:

    - `pairing` (predeterminado)
    - `allowlist` (requiere al menos una entrada `allowFrom`)
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    Campo de lista de permitidos: `channels.imessage.allowFrom`.

    Las entradas de la lista de permitidos deben identificar remitentes: identificadores o grupos estáticos de acceso de remitente (`accessGroup:<name>`). Usa `channels.imessage.groupAllowFrom` para destinos de chat como `chat_id:*`, `chat_guid:*` o `chat_identifier:*`; usa `channels.imessage.groups` para claves de registro numéricas `chat_id`.

  </Tab>

  <Tab title="Política de grupo + menciones">
    `channels.imessage.groupPolicy` controla el manejo de grupos:

    - `allowlist` (predeterminado)
    - `open`
    - `disabled`

    Lista de remitentes de grupo permitidos: `channels.imessage.groupAllowFrom`.

    Las entradas de `groupAllowFrom` también pueden hacer referencia a grupos estáticos de acceso de remitente (`accessGroup:<name>`).

    Alternativa en tiempo de ejecución: si `groupAllowFrom` no está definido, las comprobaciones de remitente de grupo de iMessage usan `allowFrom`; define `groupAllowFrom` cuando la admisión de MD y de grupo deba diferir. Un `groupAllowFrom: []` explícitamente vacío no recurre a la alternativa: bloquea a todos los remitentes de grupo bajo `allowlist`.
    Nota de tiempo de ejecución: si falta completamente `channels.imessage`, el tiempo de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (aunque `channels.defaults.groupPolicy` esté definido).

    <Warning>
    El enrutamiento de grupo bajo `groupPolicy: "allowlist"` ejecuta **dos** puertas seguidas:

    1. **Lista de remitentes permitidos** (`channels.imessage.groupAllowFrom`): identificador, `accessGroup:<name>`, `chat_guid`, `chat_identifier` o `chat_id`. Una lista efectiva vacía (sin `groupAllowFrom` y sin alternativa `allowFrom`) bloquea a todos los remitentes de grupo.
    2. **Registro de grupos** (`channels.imessage.groups`): se aplica una vez que el mapa tiene entradas: el chat debe coincidir con una entrada explícita por `chat_id` o con un comodín `groups: { "*": { ... } }`. Cuando `groups` está vacío o falta, la lista de remitentes permitidos decide por sí sola la admisión.

    Si no hay configurada ninguna lista efectiva de remitentes de grupo permitidos, todos los mensajes de grupo se descartan antes de la puerta del registro. Cada puerta tiene su propia señal de nivel `warn` con el nivel de registro predeterminado, y cada una nombra una corrección diferente:

    - una vez por cuenta al inicio, cuando la lista efectiva de remitentes de grupo permitidos está vacía: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`: corrígelo configurando `channels.imessage.groupAllowFrom` (o `allowFrom`); añadir solo entradas de `groups` deja la puerta 1 bloqueando a todos los remitentes.
    - una vez por `chat_id` en tiempo de ejecución, cuando un remitente superó la puerta 1 pero falta el chat en un registro `groups` poblado: `imessage: dropping group message from chat_id=<id> ...`: corrígelo añadiendo ese `chat_id` (o `"*"`) bajo `channels.imessage.groups`.

    Los MD no se ven afectados: toman una ruta de código diferente.

    Configuración recomendada para el flujo de grupos bajo `groupPolicy: "allowlist"`:

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

    `groupAllowFrom` por sí solo admite a esos remitentes en cualquier grupo; añade el bloque `groups` para delimitar qué chats están permitidos (y para definir opciones por chat como `requireMention`).
    </Warning>

    Puerta de menciones para grupos:

    - iMessage no tiene metadatos nativos de menciones
    - la detección de menciones usa patrones regex (`agents.list[].groupChat.mentionPatterns`, alternativa `messages.groupChat.mentionPatterns`)
    - sin patrones configurados, la puerta de menciones no puede aplicarse
    - los comandos de control de remitentes autorizados omiten la puerta de menciones

    `systemPrompt` por grupo:

    Cada entrada bajo `channels.imessage.groups.*` acepta una cadena opcional `systemPrompt`, inyectada en el prompt del sistema del agente en cada turno que maneja un mensaje de ese grupo. La resolución replica `channels.whatsapp.groups`:

    1. **Prompt del sistema específico del grupo** (`groups["<chat_id>"].systemPrompt`): se usa cuando la entrada específica del grupo existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), el comodín se suprime y no se aplica ningún prompt del sistema a ese grupo.
    2. **Prompt del sistema comodín de grupo** (`groups["*"].systemPrompt`): se usa cuando la entrada específica del grupo está totalmente ausente del mapa, o cuando existe pero no define ninguna clave `systemPrompt`.

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

    Los prompts por grupo solo se aplican a mensajes de grupo; los mensajes directos no se ven afectados.

  </Tab>

  <Tab title="Sesiones y respuestas deterministas">
    - Los MD usan enrutamiento directo; los grupos usan enrutamiento de grupo.
    - Con `session.dmScope=main` predeterminado, los MD de iMessage se contraen en la sesión principal del agente.
    - Las sesiones de grupo están aisladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Las respuestas se enrutan de vuelta a iMessage usando metadatos del canal/objetivo de origen.

    Comportamiento de hilos similares a grupos:

    Algunos hilos de iMessage con varios participantes pueden llegar con `is_group=false`.
    Si ese `chat_id` está configurado explícitamente bajo `channels.imessage.groups`, OpenClaw lo trata como tráfico de grupo (puerta de grupo + aislamiento de sesión de grupo).

  </Tab>
</Tabs>

## Vinculaciones de conversaciones ACP

Los chats de iMessage pueden vincularse a sesiones ACP.

Flujo rápido para operador:

- Ejecuta `/acp spawn codex --bind here` dentro del MD o chat de grupo permitido.
- Los mensajes futuros en esa misma conversación de iMessage se enrutan a la sesión ACP generada.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada en el lugar.
- `/acp close` cierra la sesión ACP y elimina la vinculación.

Las vinculaciones persistentes configuradas usan entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "imessage"`.

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

Consulta [Agentes ACP](/es/tools/acp-agents) para el comportamiento compartido de vinculaciones ACP.

## Patrones de despliegue

<AccordionGroup>
  <Accordion title="Usuario macOS dedicado para bot (identidad de iMessage separada)">
    Usa un Apple ID dedicado y un usuario de macOS dedicado para que el tráfico del bot quede aislado de tu perfil personal de Messages.

    Flujo típico:

    1. Crea/inicia sesión con un usuario de macOS dedicado.
    2. Inicia sesión en Messages con el Apple ID del bot en ese usuario.
    3. Instala `imsg` en ese usuario.
    4. Crea un contenedor SSH para que OpenClaw pueda ejecutar `imsg` en el contexto de ese usuario.
    5. Apunta `channels.imessage.accounts.<id>.cliPath` y `.dbPath` a ese perfil de usuario.

    La primera ejecución puede requerir aprobaciones de GUI (Automatización + Acceso completo al disco) en esa sesión de usuario del bot.

  </Accordion>

  <Accordion title="Mac remoto mediante Tailscale (ejemplo)">
    Topología común:

    - Gateway se ejecuta en Linux/VM
    - iMessage + `imsg` se ejecuta en un Mac de tu tailnet
    - el contenedor `cliPath` usa SSH para ejecutar `imsg`
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
    Asegúrate primero de que la clave del host sea de confianza (por ejemplo, `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` quede poblado.

  </Accordion>

  <Accordion title="Patrón multicuenta">
    iMessage admite configuración por cuenta bajo `channels.imessage.accounts`.

    Cada cuenta puede sobrescribir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, opciones de historial y listas de permitidos de raíz de adjuntos.

  </Accordion>

  <Accordion title="Historial de mensajes directos">
    Define `channels.imessage.dmHistoryLimit` para inicializar nuevas sesiones de mensajes directos con historial reciente decodificado de `imsg` para esa conversación. Usa `channels.imessage.dms["<sender>"].historyLimit` para sobrescrituras por remitente, incluido `0` para desactivar el historial para un remitente.

    El historial de MD de iMessage se recupera bajo demanda desde `imsg`. Dejar `dmHistoryLimit` sin definir desactiva la inicialización global de historial de MD, pero un `channels.imessage.dms["<sender>"].historyLimit` positivo por remitente sigue habilitando la inicialización para ese remitente.

  </Accordion>
</AccordionGroup>

## Medios, fragmentación y destinos de entrega

<AccordionGroup>
  <Accordion title="Archivos adjuntos y medios">
    - la ingesta de archivos adjuntos entrantes está **desactivada de forma predeterminada** — establece `channels.imessage.includeAttachments: true` para reenviar fotos, notas de voz, video y otros archivos adjuntos al agente. Con esta opción desactivada, los iMessages que solo contienen adjuntos se descartan antes de llegar al agente y puede que no produzcan ninguna línea de registro `Inbound message`.
    - las rutas de archivos adjuntos remotos pueden obtenerse mediante SCP cuando `remoteHost` está establecido
    - las rutas de archivos adjuntos deben coincidir con raíces permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - las raíces configuradas amplían el patrón de raíz predeterminado `/Users/*/Library/Messages/Attachments` (se fusionan, no se reemplazan)
    - SCP usa comprobación estricta de clave de host (`StrictHostKeyChecking=yes`)
    - el tamaño de medios salientes usa `channels.imessage.mediaMaxMb` (predeterminado 16 MB)

  </Accordion>

  <Accordion title="Texto saliente y fragmentación">
    - límite de fragmento de texto: `channels.imessage.textChunkLimit` (predeterminado 4000)
    - modo de fragmentación: `channels.imessage.chunkMode`
      - `length` (predeterminado)
      - `newline` (división priorizando párrafos)
    - la negrita, cursiva, subrayado y tachado de Markdown salientes se convierten en texto con estilo nativo (los destinatarios en macOS 15+ muestran el estilo; los destinatarios más antiguos ven texto sin formato sin los marcadores); las tablas de Markdown se convierten según el modo de tablas Markdown del canal
    - `channels.imessage.sendTransport` (`auto` predeterminado, `bridge`, `applescript`) selecciona cómo `imsg` entrega los envíos

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

Todas las acciones están activadas de forma predeterminada; usa `channels.imessage.actions` para desactivar acciones individuales:

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
    - **react**: Añade/elimina tapbacks de iMessage (`messageId`, `emoji`, `remove`). Los tapbacks admitidos se asignan a me encanta, me gusta, no me gusta, risa, énfasis y pregunta. Eliminar sin un emoji borra cualquier tapback que se haya establecido.
    - **reply**: Envía una respuesta en hilo a un mensaje existente (`messageId`, `text` o `message`, más `chatGuid`, `chatId`, `chatIdentifier` o `to`). Responder con adjunto además necesita una compilación de `imsg` cuyo `send-rich` admita `--file`.
    - **sendWithEffect**: Envía texto con un efecto de iMessage (`text` o `message`, `effect` o `effectId`). Nombres cortos: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: Edita un mensaje enviado en versiones compatibles de macOS/API privada (`messageId`, `text` o `newText`). Solo se pueden editar los mensajes que el propio Gateway envió.
    - **unsend**: Retira un mensaje enviado en versiones compatibles de macOS/API privada (`messageId`). Solo se pueden anular los mensajes que el propio Gateway envió.
    - **upload-file**: Envía medios/archivos (`buffer` como base64 o un `media`/`path`/`filePath` hidratado, `filename`, `asVoice` opcional). Alias heredado: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gestiona chats grupales cuando el destino actual es una conversación grupal. Estas acciones modifican la identidad de Mensajes del host, por lo que requieren un remitente propietario o un cliente de Gateway `operator.admin`.
    - **poll**: Crea una encuesta nativa de Apple Messages (`pollQuestion`, `pollOption` repetido de 2 a 12 veces, más `chatGuid`, `chatId`, `chatIdentifier` o `to`). Los destinatarios en iOS/iPadOS/macOS 26+ la ven y votan de forma nativa; las versiones anteriores del sistema operativo reciben una alternativa de texto "Se envió una encuesta". Requiere `selectors.pollPayloadMessage`.
    - **poll-vote**: Vota en una encuesta existente (`pollId` o `messageId`, más exactamente uno de `pollOptionIndex`, `pollOptionId` o `pollOptionText`). Requiere `selectors.pollVoteMessage` y el método RPC `poll.vote`.

    Las encuestas entrantes aceptadas se muestran al agente con la pregunta, etiquetas de opciones numeradas, recuentos de votos y el ID del mensaje de encuesta que necesita `poll-vote`.

  </Accordion>

  <Accordion title="ID de mensajes">
    El contexto entrante de iMessage incluye tanto valores `MessageSid` cortos como GUIDs de mensaje completos (`MessageSidFull`) cuando están disponibles. Los ID cortos están limitados a la caché reciente de respuestas respaldada por SQLite y se comprueban contra el chat actual antes de usarse. Si un ID corto expiró o pertenece a otro chat, reintenta con el `MessageSidFull` completo.

  </Accordion>

  <Accordion title="Detección de capacidades">
    OpenClaw oculta las acciones de API privada solo cuando el estado de sondeo en caché indica que el puente no está disponible. Si el estado es desconocido, las acciones permanecen visibles y los sondeos se despachan de forma diferida para que la primera acción pueda funcionar después de `imsg launch` sin una actualización manual de estado aparte.

  </Accordion>

  <Accordion title="Confirmaciones de lectura e indicador de escritura">
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

    Las compilaciones antiguas de `imsg` que son anteriores a la lista de capacidades por método desactivan silenciosamente escritura/lectura; OpenClaw registra una advertencia una sola vez por reinicio para que la confirmación faltante sea atribuible.

  </Accordion>

  <Accordion title="Tapbacks entrantes">
    OpenClaw se suscribe a tapbacks de iMessage y enruta las reacciones aceptadas como eventos del sistema en lugar de texto de mensaje normal, por lo que un tapback de usuario no activa un bucle de respuesta ordinario.

    El modo de notificación se controla con `channels.imessage.reactionNotifications`:

    - `"own"` (predeterminado): notificar solo cuando los usuarios reaccionen a mensajes escritos por el bot.
    - `"all"`: notificar todos los tapbacks entrantes de remitentes autorizados.
    - `"off"`: ignorar tapbacks entrantes.

    Las sobrescrituras por cuenta usan `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reacciones de aprobación (👍 / 👎)">
    Cuando `approvals.exec.enabled` o `approvals.plugin.enabled` es true y la solicitud se enruta a iMessage, el Gateway entrega una solicitud de aprobación de forma nativa y acepta un tapback para resolverla:

    - `👍` (tapback Me gusta) → `allow-once`
    - `👎` (tapback No me gusta) → `deny`
    - `allow-always` sigue siendo una alternativa manual: envía `/approve <id> allow-always` como respuesta normal.

    El manejo de reacciones requiere que el identificador del usuario que reacciona sea un aprobador explícito. La lista de aprobadores se lee de `channels.imessage.allowFrom` (o `channels.imessage.accounts.<id>.allowFrom`); añade el número de teléfono del usuario en formato E.164 o su correo de Apple ID (los destinos de chat como `chat_id:*` no son entradas de aprobador válidas). La entrada comodín `"*"` se respeta, pero permite aprobar a cualquier remitente; una lista de aprobadores vacía desactiva por completo el atajo de reacción. El atajo de reacción omite intencionalmente `reactionNotifications`, `dmPolicy` y `groupAllowFrom` porque la lista de permitidos de aprobadores explícitos es la única puerta que importa para resolver aprobaciones.

    La autorización del comando de texto `/approve` sigue la misma lista: cuando `channels.imessage.allowFrom` no está vacía, `/approve <id> <decision>` se autoriza contra esa lista de aprobadores (no contra la lista más amplia de permitidos para DM), y los remitentes permitidos en la lista de DM pero no en `allowFrom` reciben una denegación explícita. Cuando `allowFrom` está vacía, la alternativa de mismo chat permanece vigente y `/approve` autoriza a cualquiera que permita la lista de DM. Añade a `allowFrom` todos los operadores que deban aprobar, mediante `/approve` o mediante reacciones.

    Notas para operadores:
    - El enlace de reacción se almacena tanto en memoria como en el almacén persistente con claves del Gateway (TTL igual al vencimiento de la aprobación), y el Gateway también sondea las solicitudes pendientes en busca de tapbacks, por lo que un tapback que llega poco después de reiniciar el Gateway todavía resuelve la aprobación.
    - El tapback propio del operador con `is_from_me=true` (por ejemplo, desde un dispositivo Apple emparejado) resuelve la aprobación cuando ese identificador es un aprobador explícito.
    - Las solicitudes de aprobación se enrutan a una conversación grupal solo cuando hay aprobadores explícitos configurados; de lo contrario, cualquier miembro del grupo podría aprobar.
    - Los tapbacks heredados con estilo de texto (`Liked "…"` como texto sin formato desde clientes Apple muy antiguos) no pueden resolver aprobaciones porque no llevan GUID de mensaje; la resolución de reacciones requiere los metadatos estructurados de tapback que emiten los clientes actuales de macOS / iOS.

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

## Fusionar DM de envío dividido (comando + URL en una composición)

Cuando un usuario escribe juntos un comando y una URL — por ejemplo, `Dump https://example.com/article` — la app Mensajes de Apple divide el envío en **dos filas `chat.db` separadas**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa OG como adjuntos.

Las dos filas llegan a OpenClaw con una separación de ~0,8-2,0 s en la mayoría de las configuraciones. Sin fusión, el agente recibe solo el comando en el turno 1 (y a menudo responde "envíame la URL") antes de que llegue la URL en el turno 2. Esto es el pipeline de envío de Apple, no algo que introduzcan OpenClaw o `imsg`.

`channels.imessage.coalesceSameSenderDms` opta un DM en el almacenamiento en búfer de filas consecutivas del mismo remitente. Cuando `imsg` expone el marcador estructural de vista previa de URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` en una de las filas de origen, OpenClaw fusiona solo ese envío dividido real y mantiene cualquier otra fila almacenada en búfer como turnos separados. En compilaciones antiguas de `imsg` que no emiten metadatos de globo en absoluto, OpenClaw no puede distinguir un envío dividido de envíos separados, por lo que recurre a fusionar el grupo. Eso preserva el comportamiento anterior a los metadatos en lugar de hacer que los envíos divididos `Dump <url>` regresen a dos turnos. Los chats grupales siguen despachándose por mensaje para preservar la estructura de turnos multiusuario.

<Tabs>
  <Tab title="Cuándo activar">
    Actívalo cuando:

    - Distribuyas Skills que esperan `command + payload` en un solo mensaje (dump, paste, save, queue, etc.).
    - Tus usuarios peguen URLs junto con comandos.
    - Puedas aceptar la latencia adicional del turno de DM (consulta abajo).

    Déjalo desactivado cuando:

    - Necesites latencia mínima de comandos para disparadores de DM de una sola palabra.
    - Todos tus flujos sean comandos de una sola ejecución sin seguimientos de carga útil.

  </Tab>
  <Tab title="Activación">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // optar por activar (predeterminado: false)
        },
      },
    }
    ```

    Con la opción activada y sin `messages.inbound.byChannel.imessage` explícito ni `messages.inbound.debounceMs` global, la ventana de antirrebote se amplía a **7000 ms** (el valor heredado predeterminado es 0 ms — sin antirrebote). La ventana más amplia es necesaria porque la cadencia de envío dividido de vista previa de URL de Apple puede extenderse varios segundos mientras Messages.app emite la fila de vista previa.

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
    - **La fusión precisa necesita los metadatos actuales de la carga útil de `imsg`.** Con `balloon_bundle_id` presente, solo se fusiona el envío dividido real; la fusión de respaldo sin metadatos descrita arriba es compatibilidad temporal hacia atrás, que se eliminará cuando `imsg` fusione los envíos divididos en origen.
    - **Latencia añadida para mensajes DM.** Con la marca activada, cada DM (incluidos comandos de control independientes y seguimientos de texto único) espera hasta la ventana de debounce antes de despacharse, por si llega una fila de vista previa de URL. Los mensajes de chat grupal mantienen el despacho instantáneo.
    - **La salida fusionada está acotada.** El texto fusionado se limita a 4000 caracteres con un marcador explícito `…[truncated]`; los archivos adjuntos se limitan a 20; las entradas de origen se limitan a 10 (se conservan la primera y las más recientes más allá de eso). Cada GUID de origen se registra en `coalescedMessageGuids` para telemetría descendente.
    - **Solo DM.** Los chats grupales pasan al despacho por mensaje para que el bot siga respondiendo cuando varias personas están escribiendo.
    - **Opt-in, por canal.** Otros canales (Discord, Slack, Telegram, WhatsApp, …) no se ven afectados. Las configuraciones heredadas de BlueBubbles que establecen `channels.bluebubbles.coalesceSameSenderDms` deben migrar ese valor a `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Escenarios y lo que ve el agente

La columna "Marca activada" muestra el comportamiento en una compilación de `imsg` que emite `balloon_bundle_id`. En compilaciones antiguas de `imsg` que no emiten metadatos de globo en absoluto, las filas siguientes marcadas como "Dos turnos" / "N turnos" recurren en su lugar a una fusión heredada (un turno): OpenClaw no puede distinguir estructuralmente un envío dividido de envíos separados, por lo que conserva la fusión previa a los metadatos. La separación precisa se activa una vez que la compilación emite metadatos de globo.

| El usuario redacta                                                  | `chat.db` produce                    | Marca desactivada (predeterminado)           | Marca activada + ventana (`imsg` emite metadatos de globo)                                               |
| ------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (un envío)                               | 2 filas con ~1 s de diferencia       | Dos turnos del agente: "Dump" solo, luego URL | Un turno: texto fusionado `Dump https://example.com`                                                     |
| `Save this 📎image.jpg caption` (archivo adjunto + texto)           | 2 filas sin metadatos de globo de URL | Dos turnos                                   | Dos turnos después de observar metadatos; un turno fusionado en sesiones antiguas/previas al latch sin metadatos |
| `/status` (comando independiente)                                   | 1 fila                               | Despacho instantáneo                         | **Espera hasta la ventana y luego despacha**                                                             |
| URL pegada sola                                                     | 1 fila                               | Despacho instantáneo                         | Espera hasta la ventana y luego despacha                                                                 |
| Texto + URL enviados como dos mensajes separados deliberados, minutos aparte | 2 filas fuera de la ventana          | Dos turnos                                   | Dos turnos (la ventana expira entre ellos)                                                               |
| Inundación rápida (>10 DM pequeños dentro de la ventana)            | N filas sin metadatos de globo de URL | N turnos                                     | N turnos después de observar metadatos; un turno fusionado acotado en sesiones antiguas/previas al latch sin metadatos |
| Dos personas escribiendo en un chat grupal                          | N filas de M remitentes              | M+ turnos (uno por bucket de remitente)       | M+ turnos — los chats grupales no se fusionan                                                            |

## Recuperación de entrada después de reiniciar un puente o Gateway

iMessage recupera los mensajes perdidos mientras el Gateway estaba inactivo y, al mismo tiempo, suprime la antigua "bomba de backlog" que Apple puede descargar después de una recuperación Push. El comportamiento predeterminado está siempre activado y se basa en la deduplicación de entrada.

- **Deduplicación de reproducción.** Cada mensaje entrante despachado se registra por su GUID de Apple en el estado persistente del Plugin (`imessage.inbound-dedupe`), se reclama durante la ingesta y se confirma después de manejarlo (se libera ante un fallo transitorio para que pueda reintentarse). Todo lo ya manejado se descarta en lugar de despacharse dos veces. Esto permite que la recuperación reproduzca de forma agresiva sin contabilidad por mensaje.
- **Recuperación de tiempo de inactividad.** Al iniciar, el monitor recuerda el último `chat.db` rowid despachado (un cursor persistido por cuenta) y lo pasa a `imsg watch.subscribe` como `since_rowid`, de modo que imsg reproduce las filas que llegaron mientras el Gateway estaba inactivo y luego sigue en vivo. La reproducción se limita a las 500 filas más recientes y a mensajes de hasta ~2 horas de antigüedad, y la deduplicación descarta todo lo ya manejado.
- **Valla de antigüedad para backlog obsoleto.** Las filas por encima del límite de inicio son realmente en vivo; una cuya fecha de envío sea más de ~15 minutos anterior a su llegada es backlog de descarga Push y se suprime. Las filas reproducidas (en el límite o por debajo) usan en cambio la ventana de recuperación más amplia, de modo que se entrega un mensaje perdido recientemente mientras que el historial antiguo no.

La recuperación funciona tanto con configuraciones `cliPath` locales como remotas, porque la reproducción `since_rowid` se ejecuta sobre la misma conexión RPC de `imsg`. La diferencia es la ventana: cuando el Gateway puede leer `chat.db` (local), ancla el límite rowid de inicio, limita el intervalo de reproducción y entrega mensajes perdidos de hasta un par de horas de antigüedad. Con un `cliPath` SSH remoto no puede leer la base de datos, por lo que la reproducción no tiene límite y cada fila usa la valla de antigüedad en vivo: aun así recupera mensajes perdidos recientemente y sigue suprimiendo backlog antiguo, solo que con la ventana en vivo más estrecha. Ejecuta el Gateway en la Mac de Messages para obtener la ventana de recuperación más amplia.

### Señal visible para el operador

El backlog suprimido se registra en el nivel predeterminado, nunca se descarta silenciosamente (la marca `recovery` muestra qué ventana se aplicó):

```text
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migración

`channels.imessage.catchup.*` está obsoleto: la recuperación de tiempo de inactividad es automática y no necesita configuración para instalaciones nuevas. Las configuraciones existentes con `catchup.enabled: true` siguen respetándose como perfil de compatibilidad para la ventana de reproducción de recuperación. Los bloques catchup deshabilitados (`enabled: false` o sin `enabled: true`) se retiran; `openclaw doctor --fix` los elimina.

## Solución de problemas

<AccordionGroup>
  <Accordion title="No se encuentra imsg o RPC no compatible">
    Valida el binario y la compatibilidad RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Si la sonda informa que RPC no es compatible, actualiza `imsg`. Si las acciones de API privada no están disponibles, ejecuta `imsg launch` en la sesión del usuario de macOS que inició sesión y vuelve a sondear. Si el Gateway no se está ejecutando en macOS, usa la configuración de Mac remota por SSH anterior en lugar de la ruta local predeterminada de `imsg`.

  </Accordion>

  <Accordion title="Los mensajes se envían, pero los iMessages entrantes no llegan">
    Primero demuestra si el mensaje llegó a la Mac local. Si `chat.db` no cambia, OpenClaw no puede recibir el mensaje incluso cuando `imsg status --json` informa de un puente saludable.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Si los mensajes enviados desde el teléfono no crean filas nuevas, repara la capa de Messages de macOS y Apple Push antes de cambiar la configuración de OpenClaw. Una actualización puntual del servicio suele ser suficiente:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Envía un iMessage nuevo desde el teléfono y confirma una fila nueva en `chat.db` o un evento de `imsg watch` antes de depurar sesiones de OpenClaw. No ejecutes esto como un bucle periódico de relanzamiento del puente; `imsg launch` repetido más reinicios del Gateway durante trabajo activo pueden interrumpir entregas y dejar ejecuciones de canal en curso varadas.

  </Accordion>

  <Accordion title="Gateway no se está ejecutando en macOS">
    El `cliPath: "imsg"` predeterminado debe ejecutarse en la Mac con sesión iniciada en Messages. En Linux o Windows, establece `channels.imessage.cliPath` en un script contenedor que haga SSH a esa Mac y ejecute `imsg "$@"`.

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
    Revisa:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprobaciones de emparejamiento (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Los mensajes de grupo se ignoran">
    Revisa:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamiento de lista de permitidos de `channels.imessage.groups`
    - configuración de patrones de mención (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Los archivos adjuntos remotos fallan">
    Revisa:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticación con clave SSH/SCP desde el host del Gateway
    - que exista la clave de host en `~/.ssh/known_hosts` en el host del Gateway
    - legibilidad de la ruta remota en la Mac que ejecuta Messages

  </Accordion>

  <Accordion title="Se omitieron los avisos de permisos de macOS">
    Vuelve a ejecutar en una terminal GUI interactiva en el mismo contexto de usuario/sesión y aprueba los avisos:

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

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Eliminación de BlueBubbles y la ruta imsg de iMessage](/es/announcements/bluebubbles-imessage) — anuncio y resumen de migración
- [Migrar desde BlueBubbles](/es/channels/imessage-from-bluebubbles) — tabla de traducción de configuración y cambio paso a paso
- [Emparejamiento](/es/channels/pairing) — autenticación DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y control por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
