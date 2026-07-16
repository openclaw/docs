---
read_when:
    - Configuración de la compatibilidad con iMessage
    - Depuración del envío y la recepción de iMessage
summary: Compatibilidad nativa con iMessage mediante imsg (JSON-RPC a través de stdio), con acciones de API privada para respuestas, tapbacks, efectos, encuestas, archivos adjuntos y gestión de grupos. Es la opción preferida para nuevas configuraciones de iMessage en OpenClaw cuando se cumplen los requisitos del host.
title: iMessage
x-i18n:
    generated_at: "2026-07-16T11:21:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para la implementación habitual de iMessage con OpenClaw, ejecute el Gateway y `imsg` en el mismo host macOS con sesión iniciada en Mensajes. Si el Gateway se ejecuta en otro lugar, haga que `channels.imessage.cliPath` apunte a un contenedor SSH transparente que ejecute `imsg` en el Mac.

**La recuperación de mensajes entrantes es automática.** Después de reiniciar un puente o el Gateway, iMessage reproduce los mensajes perdidos mientras estuvo inactivo y suprime la «avalancha de mensajes atrasados» obsoletos que Apple puede enviar tras una recuperación de Push, eliminando duplicados para que nada se procese dos veces. No hay ninguna configuración que habilitar; consulte [Recuperación de mensajes entrantes después de reiniciar un puente o el Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Se eliminó la compatibilidad con BlueBubbles. Migre las configuraciones de `channels.bluebubbles` a `channels.imessage`; OpenClaw solo admite iMessage mediante `imsg`. Comience por [Eliminación de BlueBubbles y la vía de iMessage con imsg](/es/announcements/bluebubbles-imessage) para consultar el anuncio breve, o por [Migración desde BlueBubbles](/es/channels/imessage-from-bluebubbles) para ver la tabla de migración completa.
</Warning>

Estado: integración nativa con una CLI externa. El Gateway inicia `imsg rpc` y se comunica mediante JSON-RPC por stdio, sin un daemon ni puerto independientes. Se recomienda encarecidamente el modo de API privada para disponer de un canal de iMessage completo; las respuestas, reacciones rápidas, efectos, encuestas, respuestas a archivos adjuntos y acciones de grupo requieren `imsg launch` y una comprobación correcta de la API privada.

Para la configuración local habitual, el asistente de configuración de OpenClaw puede ofrecer una instalación o actualización de `imsg` mediante Homebrew, previa confirmación del usuario, en el Mac con sesión iniciada en Mensajes. La configuración manual y las topologías con contenedores SSH siguen estando gestionadas por el operador: instale o actualice `imsg` en el mismo contexto de usuario que ejecutará el Gateway o el contenedor.

<CardGroup cols={3}>
  <Card title="Acciones de la API privada" icon="wand-sparkles" href="#private-api-actions">
    Respuestas, reacciones rápidas, efectos, encuestas, archivos adjuntos y gestión de grupos.
  </Card>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los mensajes directos de iMessage utilizan de forma predeterminada el modo de emparejamiento.
  </Card>
  <Card title="Mac remoto" icon="terminal" href="#remote-mac-over-ssh">
    Utilice un contenedor SSH cuando el Gateway no se ejecute en el Mac con Mensajes.
  </Card>
  <Card title="Referencia de configuración" icon="settings" href="/es/gateway/config-channels#imessage">
    Referencia completa de los campos de iMessage.
  </Card>
</CardGroup>

## Configuración rápida

<Tabs>
  <Tab title="Mac local (vía rápida)">
    <Steps>
      <Step title="Instalar y verificar imsg">

```bash
brew install steipete/tap/imsg
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        Cuando el asistente de configuración local detecta que falta el comando predeterminado `imsg`, puede solicitar la instalación de `steipete/tap/imsg` mediante Homebrew. Si detecta un `imsg` gestionado por Homebrew, puede solicitar su reinstalación o actualización. Los contenedores personalizados de `cliPath` no se modifican.

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

      <Step title="Iniciar el Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Aprobar el emparejamiento del primer mensaje directo (dmPolicy predeterminada)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Las solicitudes de emparejamiento caducan después de 1 hora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto mediante SSH">
    La mayoría de las configuraciones no necesitan SSH. Utilice esta topología únicamente cuando el Gateway no pueda ejecutarse en el Mac con sesión iniciada en Mensajes. OpenClaw solo requiere un `cliPath` compatible con stdio, por lo que puede hacer que `cliPath` apunte a un script contenedor que se conecte mediante SSH a un Mac remoto y ejecute `imsg`.
    Instale y actualice `imsg` en ese Mac remoto, no en el host del Gateway:

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Configuración recomendada cuando los archivos adjuntos están habilitados:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // se utiliza para obtener archivos adjuntos mediante SCP
      includeAttachments: true,
      // Opcional: raíces adicionales permitidas para archivos adjuntos (se combinan con la predeterminada
      // /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Si `remoteHost` no está establecido, OpenClaw intenta detectarlo automáticamente analizando el script contenedor SSH.
    `remoteHost` debe ser `host` o `user@host` (sin espacios ni opciones SSH); los valores no seguros se ignoran.
    OpenClaw utiliza una comprobación estricta de la clave del host para SCP, por lo que la clave del host de retransmisión ya debe existir en `~/.ssh/known_hosts`.
    Las rutas de los archivos adjuntos se validan con respecto a las raíces permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Todo contenedor `cliPath` o proxy SSH que se coloque delante de `imsg` DEBE comportarse como una canalización stdio transparente para JSON-RPC de larga duración. OpenClaw intercambia pequeños mensajes JSON-RPC delimitados por saltos de línea mediante stdin/stdout del contenedor durante toda la vida útil del canal:

- Reenvíe cada fragmento o línea de stdin **en cuanto haya bytes disponibles**; no espere a EOF.
- Reenvíe rápidamente cada fragmento o línea de stdout en la dirección inversa.
- Conserve los saltos de línea.
- Evite las lecturas bloqueantes de tamaño fijo (`read(4096)`, `cat | buffer`, `read` predeterminado del shell) que pueden privar de datos a las tramas pequeñas.
- Mantenga stderr separado del flujo stdout de JSON-RPC.

Un contenedor que almacene stdin en búfer hasta llenar un bloque grande producirá síntomas similares a una interrupción de iMessage — `imsg rpc timeout (chats.list)` o reinicios repetidos del canal — aunque `imsg rpc` funcione correctamente. `ssh -T host imsg "$@"` (mostrado anteriormente) es seguro porque reenvía los argumentos de `cliPath` de OpenClaw, como `rpc` y `--db`. Las canalizaciones como `ssh host imsg | grep -v '^DEBUG'` NO lo son: las herramientas con almacenamiento en búfer por líneas pueden seguir reteniendo tramas; utilice `stdbuf -oL -eL` en cada etapa si necesita aplicar filtros.
</Warning>

  </Tab>
</Tabs>

## Requisitos y permisos (macOS)

- Debe haber una sesión iniciada en Mensajes en el Mac que ejecute `imsg`.
- Se requiere acceso total al disco para el contexto del proceso que ejecuta OpenClaw/`imsg` (acceso a la base de datos de Mensajes).
- Se requiere permiso de automatización para enviar mensajes mediante Messages.app.
- Para las acciones avanzadas (reaccionar / editar / anular envío / respuesta en hilo / efectos / encuestas / operaciones de grupo), la protección de integridad del sistema debe estar deshabilitada; consulte [Habilitación de la API privada de imsg](#enabling-the-imsg-private-api). El envío y la recepción básicos de texto y contenido multimedia funcionan sin deshabilitarla.

<Tip>
Los permisos se conceden por contexto de proceso. Si el Gateway se ejecuta sin interfaz gráfica (LaunchAgent/SSH), ejecute una vez un comando interactivo en ese mismo contexto para activar las solicitudes de permisos:

```bash
imsg chats --limit 1
# o
imsg send <handle> "test"
```

</Tip>

<Accordion title="Los envíos mediante el contenedor SSH fallan con AppleEvents -1743">
  Una configuración mediante SSH remoto puede leer chats, superar `channels status --probe` y procesar mensajes entrantes, mientras los envíos salientes siguen fallando con un error de autorización de AppleEvents:

```text
No se permite enviar eventos de Apple a Mensajes. (-1743)
```

Compruebe la base de datos TCC del usuario con sesión iniciada en el Mac o System Settings > Privacy & Security > Automation. Si la entrada de automatización está registrada para `/usr/libexec/sshd-keygen-wrapper` en lugar del proceso `imsg` o del shell local, es posible que macOS no muestre un selector de Mensajes utilizable para ese cliente del servidor SSH:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

En ese estado, repetir `tccutil reset AppleEvents` o volver a ejecutar `imsg send` mediante el mismo contenedor SSH puede seguir fallando porque el contexto de proceso que necesita la automatización de Mensajes es el contenedor SSH, no una aplicación a la que la interfaz pueda conceder acceso.

Utilice en su lugar uno de los contextos de proceso `imsg` compatibles:

- Ejecute el Gateway, o al menos el puente `imsg`, en la sesión local del usuario con sesión iniciada en Mensajes.
- Inicie el Gateway con un LaunchAgent para ese usuario después de conceder acceso total al disco y automatización desde la misma sesión.
- Si mantiene la topología SSH de dos usuarios, verifique que un envío saliente real mediante `imsg send` se complete correctamente a través del contenedor exacto antes de habilitar el canal. Si no se le puede conceder automatización, reconfigure el sistema con una configuración `imsg` de un solo usuario en lugar de depender del contenedor SSH para los envíos.

</Accordion>

## Habilitación de la API privada de imsg

`imsg` incluye dos modos operativos. Para OpenClaw, el modo de API privada es la configuración recomendada porque proporciona al canal las acciones nativas de iMessage que esperan los usuarios. El modo básico sigue siendo útil para instalaciones de bajo riesgo, verificaciones iniciales o hosts donde no se pueda deshabilitar SIP.

- **Modo básico** (predeterminado, no requiere cambios en SIP): texto y contenido multimedia salientes mediante `send`, supervisión e historial de mensajes entrantes y lista de chats. Esto es lo que se obtiene de forma predeterminada con un `brew install steipete/tap/imsg` recién instalado y los permisos estándar de macOS indicados anteriormente.
- **Modo de API privada**: `imsg` inyecta una dylib auxiliar en `Messages.app` para llamar a funciones internas de `IMCore`. Esto habilita `react`, `edit`, `unsend`, `reply` (en hilo), `sendWithEffect`, `poll` y `poll-vote` (encuestas nativas de Mensajes), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, además de indicadores de escritura y confirmaciones de lectura.

La superficie de acciones recomendada en esta página requiere el modo de API privada. El README de `imsg` indica explícitamente este requisito:

> Las funciones avanzadas, como `read`, `typing`, `launch`, el envío enriquecido respaldado por el puente, la modificación de mensajes y la gestión de chats, son opcionales. Requieren que SIP esté deshabilitado y que se inyecte una dylib auxiliar en `Messages.app`. `imsg launch` rechaza la inyección cuando SIP está habilitado.

La técnica de inyección del auxiliar utiliza la propia dylib de `imsg` para acceder a las API privadas de Mensajes. No hay ningún servidor de terceros ni entorno de ejecución de BlueBubbles en la vía de iMessage de OpenClaw.

<Warning>
**Deshabilitar SIP implica una contrapartida de seguridad real.** SIP es una de las protecciones principales de macOS contra la ejecución de código del sistema modificado; deshabilitarla en todo el sistema amplía la superficie de ataque y puede producir efectos secundarios adicionales. En particular, **deshabilitar SIP en los Mac con Apple Silicon también impide instalar y ejecutar aplicaciones de iOS en el Mac**.

Considere esta opción como una decisión operativa deliberada, especialmente en un Mac personal principal. Para usar iMessage con OpenClaw con calidad de producción, es preferible emplear un Mac dedicado o un usuario bot de macOS en el que resulte aceptable habilitar el puente. Si el modelo de amenazas no permite deshabilitar SIP en ningún sistema, el iMessage incluido queda limitado al modo básico: únicamente envío y recepción de texto y contenido multimedia, sin reacciones / edición / anulación de envío / efectos / operaciones de grupo.
</Warning>

### Configuración

1. **Instale (o actualice) `imsg`** en el Mac que ejecuta Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   La salida de `imsg status --json` informa de `bridge_version`, `rpc_methods` y `selectors` por método para poder comprobar qué admite la compilación actual antes de comenzar.

2. **Desactive la Protección de Integridad del Sistema y, en versiones modernas de macOS, la validación de bibliotecas.** Inyectar una dylib auxiliar que no sea de Apple en el archivo firmado por Apple `Messages.app` requiere que SIP esté desactivado **y** que se relaje la validación de bibliotecas. El paso de SIP en el modo Recuperación depende de la versión de macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** desactive la validación de bibliotecas mediante Terminal, reinicie en Recovery Mode, ejecute `csrutil disable` y reinicie.
   - **macOS 11+ (Big Sur y posteriores), Intel:** acceda a Recovery Mode (o Internet Recovery), ejecute `csrutil disable` y reinicie.
   - **macOS 11+, Apple Silicon:** use la secuencia de arranque mediante el botón de encendido para acceder a Recuperación; en versiones recientes de macOS, mantenga pulsada la tecla **Left Shift** al hacer clic en Continue y, a continuación, ejecute `csrutil disable`. Las configuraciones de máquinas virtuales siguen un procedimiento distinto, así que cree primero una instantánea de la máquina virtual.

   **En macOS 11 y posteriores, `csrutil disable` por sí solo no suele ser suficiente.** Apple sigue aplicando la validación de bibliotecas a `Messages.app` como binario de plataforma, por lo que se rechaza un auxiliar con firma ad hoc (`Library Validation failed: ... platform binary, but mapped file is not`) incluso con SIP desactivado. Después de desactivar SIP, desactive también la validación de bibliotecas y reinicie:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), verificado en 26.5.1:** desactivar SIP **junto con** el comando `DisableLibraryValidation` anterior basta para inyectar el auxiliar en las versiones 26.0 a 26.5.x. **No se requieren argumentos de arranque.** El plist es el factor decisivo y el paso que falta con mayor frecuencia cuando falla la inyección en Tahoe:
   - **Con el plist:** `imsg launch` realiza la inyección y `imsg status` informa de `advanced_features: true`.
   - **Sin el plist (incluso con SIP desactivado):** `imsg launch` falla con `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI rechaza el auxiliar ad hoc durante la carga, por lo que el puente nunca queda listo y el inicio agota el tiempo de espera. Este tiempo de espera agotado es el síntoma que encuentra la mayoría de las personas en Tahoe; la solución es el plist anterior, no una medida más drástica.

   Si la inyección de `imsg launch` o elementos concretos de `selectors` empiezan a devolver false después de una actualización de macOS, esta comprobación suele ser la causa. Compruebe el estado de SIP y de la validación de bibliotecas antes de asumir que ha fallado el propio paso de SIP. Si esos ajustes son correctos y el puente sigue sin poder realizar la inyección, recopile `imsg status --json` junto con la salida de `imsg launch` y comuníquelo al proyecto `imsg` en lugar de debilitar otros controles de seguridad de todo el sistema.

3. **Inyecte el auxiliar.** Con SIP desactivado y la sesión iniciada en Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` se niega a realizar la inyección cuando SIP sigue activado, por lo que esto también sirve para confirmar que se ha completado el paso 2.

4. **Verifique el puente desde OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   La entrada de iMessage debería informar de `works`, y `imsg status --json | jq '{rpc_methods, selectors}'` debería mostrar las capacidades expuestas por su compilación de macOS. La creación de encuestas requiere `selectors.pollPayloadMessage`; votar requiere tanto `selectors.pollVoteMessage` como el método RPC `poll.vote`. El plugin de OpenClaw anuncia únicamente las acciones compatibles con la comprobación almacenada en caché, mientras que una caché vacía mantiene un criterio optimista y realiza la comprobación en el primer envío.

Si `openclaw channels status --probe` informa de que el canal está `works`, pero acciones concretas generan el error "iMessage `<action>` requires the imsg private API bridge" durante el envío, vuelva a ejecutar `imsg launch`: el auxiliar puede desconectarse (por un reinicio de Messages.app, una actualización del sistema operativo, etc.) y el estado `available: true` almacenado en caché seguirá anunciando acciones hasta que la siguiente comprobación lo actualice.

### Cuando SIP permanece activado

Si desactivar SIP no es aceptable para su modelo de amenazas:

- `imsg` recurre al modo básico: solo texto, contenido multimedia y recepción.
- El plugin de OpenClaw sigue anunciando el envío de texto y contenido multimedia, así como la supervisión de mensajes entrantes; oculta `react`, `edit`, `unsend`, `reply`, `sendWithEffect` y las operaciones de grupo en la superficie de acciones (según la comprobación de capacidades de cada método).
- Se puede ejecutar otro Mac que no tenga Apple Silicon (o un Mac dedicado al bot) con SIP desactivado para la carga de trabajo de iMessage y mantener SIP activado en los dispositivos principales. Consulte [Usuario de macOS dedicado al bot (identidad de iMessage independiente)](#deployment-patterns) más adelante.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.imessage.dmPolicy` controla los mensajes directos:

    - `pairing` (valor predeterminado)
    - `allowlist` (requiere al menos una entrada `allowFrom`)
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    Campo de la lista de permitidos: `channels.imessage.allowFrom`.

    Las entradas de la lista de permitidos deben identificar a los remitentes: identificadores o grupos estáticos de acceso de remitentes (`accessGroup:<name>`). Use `channels.imessage.groupAllowFrom` para destinos de chat como `chat_id:*`, `chat_guid:*` o `chat_identifier:*`; use `channels.imessage.groups` para claves numéricas del registro `chat_id`.

  </Tab>

  <Tab title="Política de grupos + menciones">
    `channels.imessage.groupPolicy` controla la gestión de grupos:

    - `allowlist` (valor predeterminado)
    - `open`
    - `disabled`

    Lista de remitentes de grupo permitidos: `channels.imessage.groupAllowFrom`.

    Las entradas `groupAllowFrom` también pueden hacer referencia a grupos estáticos de acceso de remitentes (`accessGroup:<name>`).

    Comportamiento alternativo en tiempo de ejecución: si `groupAllowFrom` no está definido, las comprobaciones de remitentes de grupos de iMessage usan `allowFrom`; defina `groupAllowFrom` cuando la admisión de mensajes directos y de grupos deba ser diferente. Un `groupAllowFrom: []` explícitamente vacío no recurre al comportamiento alternativo: bloquea a todos los remitentes de grupos con `allowlist`.
    Nota sobre el tiempo de ejecución: si `channels.imessage` falta por completo, el tiempo de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (aunque `channels.defaults.groupPolicy` esté definido).

    <Warning>
    El enrutamiento de grupos con `groupPolicy: "allowlist"` aplica **dos** comprobaciones consecutivas:

    1. **Lista de remitentes permitidos** (`channels.imessage.groupAllowFrom`): identificador, `accessGroup:<name>`, `chat_guid`, `chat_identifier` o `chat_id`. Una lista efectiva vacía (sin `groupAllowFrom` ni comportamiento alternativo mediante `allowFrom`) bloquea a todos los remitentes de grupos.
    2. **Registro de grupos** (`channels.imessage.groups`): se aplica cuando el mapa contiene entradas; el chat debe coincidir con una entrada explícita por `chat_id` o con el comodín `groups: { "*": { ... } }`. Cuando `groups` está vacío o no existe, solo la lista de remitentes permitidos determina la admisión.

    Si no se configura ninguna lista efectiva de remitentes de grupo permitidos, todos los mensajes de grupo se descartan antes de la comprobación del registro. Cada comprobación tiene su propia señal de nivel `warn` en el nivel de registro predeterminado, y cada una indica una solución distinta:

    - una vez por cuenta durante el inicio, cuando la lista efectiva de remitentes de grupo permitidos está vacía: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`; se corrige definiendo `channels.imessage.groupAllowFrom` (o `allowFrom`); añadir únicamente entradas `groups` deja la comprobación 1 bloqueando a todos los remitentes.
    - una vez por `chat_id` durante el tiempo de ejecución, cuando un remitente ha superado la comprobación 1, pero el chat no está presente en un registro `groups` que contiene entradas: `imessage: dropping group message from chat_id=<id> ...`; se corrige añadiendo ese `chat_id` (o `"*"`) en `channels.imessage.groups`.

    Los mensajes directos no se ven afectados: siguen una ruta de código distinta.

    Configuración recomendada para el flujo de grupos con `groupPolicy: "allowlist"`:

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

    `groupAllowFrom` por sí solo admite a esos remitentes en cualquier grupo; añada el bloque `groups` para delimitar qué chats están permitidos (y definir opciones específicas de cada chat, como `requireMention`).
    </Warning>

    Comprobación de menciones para grupos:

    - iMessage no dispone de metadatos nativos de menciones
    - la detección de menciones usa patrones de expresiones regulares (`agents.list[].groupChat.mentionPatterns`, con `messages.groupChat.mentionPatterns` como alternativa)
    - sin patrones configurados, no se puede aplicar la comprobación de menciones
    - los comandos de control de remitentes autorizados omiten la comprobación de menciones

    `systemPrompt` por grupo:

    Cada entrada de `channels.imessage.groups.*` acepta una cadena `systemPrompt` opcional, que se inyecta en el prompt del sistema del agente en cada turno que gestiona un mensaje de ese grupo. La resolución funciona igual que `channels.whatsapp.groups`:

    1. **Prompt del sistema específico del grupo** (`groups["<chat_id>"].systemPrompt`): se utiliza cuando existe una entrada del grupo específico en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), se suprime el comodín y no se aplica ningún prompt del sistema a ese grupo.
    2. **Prompt del sistema comodín de grupos** (`groups["*"].systemPrompt`): se utiliza cuando la entrada del grupo específico no está presente en el mapa o cuando existe, pero no define ninguna clave `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use la ortografía británica." },
            "8421": {
              requireMention: true,
              systemPrompt: "Este es el chat de rotación de guardias. Limite las respuestas a menos de 3 frases.",
            },
            "9907": {
              // supresión explícita: el comodín "Use la ortografía británica." no se aplica aquí
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Los prompts específicos de cada grupo solo se aplican a los mensajes de grupo; los mensajes directos no se ven afectados.

  </Tab>

  <Tab title="Sesiones y respuestas deterministas">
    - Los mensajes directos usan enrutamiento directo; los grupos usan enrutamiento de grupos.
    - Con el valor predeterminado `session.dmScope=main`, los mensajes directos de iMessage se agrupan en la sesión principal del agente.
    - Las sesiones de grupo están aisladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Las respuestas se redirigen a iMessage mediante los metadatos del canal y el destino de origen.

    Comportamiento de los hilos similares a grupos:

    Algunos hilos de iMessage con varios participantes pueden llegar con `is_group=false`.
    Si ese `chat_id` está configurado explícitamente en `channels.imessage.groups`, OpenClaw lo trata como tráfico de grupo (comprobaciones de grupo + aislamiento de la sesión de grupo).

  </Tab>
</Tabs>

## Vinculaciones de conversaciones ACP

Los chats de iMessage se pueden vincular a sesiones ACP.

Flujo rápido para operadores:

- Ejecute `/acp spawn codex --bind here` dentro del mensaje directo o del chat de grupo permitido.
- Los mensajes futuros de esa misma conversación de iMessage se dirigen a la sesión ACP iniciada.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada sin reemplazarla.
- `/acp close` cierra la sesión ACP y elimina la vinculación.

Las vinculaciones persistentes configuradas usan entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "imessage"`.

`match.peer.id` puede usar:

- un identificador normalizado de mensaje directo, como `+15555550123` o `user@example.com`
- `chat_id:<id>` (recomendado para vinculaciones estables de grupos)
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

Consulte [Agentes ACP](/es/tools/acp-agents) para conocer el comportamiento compartido de las vinculaciones ACP.

## Patrones de implementación

<AccordionGroup>
  <Accordion title="Usuario de macOS dedicado al bot (identidad de iMessage independiente)">
    Use un Apple ID y un usuario de macOS dedicados para aislar el tráfico del bot de su perfil personal de Messages.

    Flujo habitual:

    1. Cree/inicie sesión en un usuario de macOS dedicado.
    2. Inicie sesión en Mensajes con el Apple ID del bot en ese usuario.
    3. Instale `imsg` en ese usuario.
    4. Cree un contenedor SSH para que OpenClaw pueda ejecutar `imsg` en el contexto de ese usuario.
    5. Dirija `channels.imessage.accounts.<id>.cliPath` y `.dbPath` a ese perfil de usuario.

    La primera ejecución puede requerir aprobaciones en la interfaz gráfica (Automatización + Acceso total al disco) en la sesión de usuario de ese bot.

  </Accordion>

  <Accordion title="Mac remoto mediante Tailscale (ejemplo)">
    Topología habitual:

    - el Gateway se ejecuta en Linux/una máquina virtual
    - iMessage + `imsg` se ejecutan en un Mac de la red Tailscale
    - el contenedor `cliPath` usa SSH para ejecutar `imsg`
    - `remoteHost` habilita la obtención de archivos adjuntos mediante SCP

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

    Use claves SSH para que tanto SSH como SCP sean no interactivos.
    Asegúrese primero de que la clave del host sea de confianza (por ejemplo, `ssh bot@mac-mini.tailnet-1234.ts.net`) para que se rellene `known_hosts`.

  </Accordion>

  <Accordion title="Patrón de varias cuentas">
    iMessage admite configuración por cuenta en `channels.imessage.accounts`.

    Cada cuenta puede sobrescribir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, la configuración del historial y las listas de raíces permitidas para archivos adjuntos.

  </Accordion>

  <Accordion title="Historial de mensajes directos">
    Establezca `channels.imessage.dmHistoryLimit` para inicializar las nuevas sesiones de mensajes directos con el historial reciente de `imsg` decodificado para esa conversación. Use `channels.imessage.dms["<sender>"].historyLimit` para sobrescrituras por remitente, incluido `0` para deshabilitar el historial de un remitente.

    El historial de MD de iMessage se obtiene bajo demanda de `imsg`. Si `dmHistoryLimit` se deja sin configurar, se deshabilita la inicialización global del historial de MD, pero un valor positivo de `channels.imessage.dms["<sender>"].historyLimit` por remitente sigue habilitando la inicialización para ese remitente.

  </Accordion>
</AccordionGroup>

## Contenido multimedia, fragmentación y destinos de entrega

<AccordionGroup>
  <Accordion title="Archivos adjuntos y contenido multimedia">
    - la ingesta de archivos adjuntos entrantes está **desactivada de forma predeterminada**: establezca `channels.imessage.includeAttachments: true` para reenviar fotos, notas de voz, vídeos y otros archivos adjuntos al agente. Si está deshabilitada, los mensajes de iMessage que solo contienen archivos adjuntos se descartan antes de llegar al agente y es posible que no generen ninguna línea de registro de `Inbound message`.
    - las rutas remotas de archivos adjuntos pueden obtenerse mediante SCP cuando se establece `remoteHost`
    - las rutas de archivos adjuntos deben coincidir con las raíces permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - las raíces configuradas amplían el patrón de raíz predeterminado `/Users/*/Library/Messages/Attachments` (se combinan, no se sustituyen)
    - SCP usa una comprobación estricta de la clave del host (`StrictHostKeyChecking=yes`)
    - el tamaño del contenido multimedia saliente usa `channels.imessage.mediaMaxMb` (valor predeterminado: 16 MB)

  </Accordion>

  <Accordion title="Texto saliente y fragmentación">
    - límite de fragmento de texto: `channels.imessage.textChunkLimit` (valor predeterminado: 4000)
    - modo de fragmentación: `channels.imessage.streaming.chunkMode`
      - `length` (valor predeterminado)
      - `newline` (división prioritaria por párrafos)
    - la negrita, cursiva, el subrayado y el tachado de Markdown saliente se convierten en texto con estilo nativo (los destinatarios con macOS 15 o posterior muestran el estilo; los destinatarios con versiones anteriores ven texto sin formato y sin los marcadores); las tablas de Markdown se convierten según el modo de tablas de Markdown del canal
    - `channels.imessage.sendTransport` (`auto` de forma predeterminada, `bridge`, `applescript`) selecciona cómo `imsg` realiza los envíos

  </Accordion>

  <Accordion title="Formatos de direccionamiento">
    Destinos explícitos preferidos:

    - `chat_id:123` (recomendado para un enrutamiento estable)
    - `chat_guid:...`
    - `chat_identifier:...`

    También se admiten destinos mediante identificadores:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Acciones de la API privada

Cuando `imsg launch` está en ejecución y `openclaw channels status --probe` informa de `privateApi.available: true`, la herramienta de mensajes puede usar acciones nativas de iMessage además de los envíos de texto normales.

Todas las acciones están habilitadas de forma predeterminada; use `channels.imessage.actions` para desactivar acciones individuales:

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
    - **react**: Añade/elimina reacciones rápidas de iMessage (`messageId`, `emoji`, `remove`). Las reacciones rápidas admitidas corresponden a amor, me gusta, no me gusta, risa, énfasis y pregunta. Eliminarlas sin un emoji borra cualquier reacción rápida que estuviera establecida.
    - **reply**: Envía una respuesta en un hilo a un mensaje existente (`messageId`, `text` o `message`, además de `chatGuid`, `chatId`, `chatIdentifier` o `to`). La respuesta con archivo adjunto también necesita una compilación de `imsg` cuyo `send-rich` admita `--file`.
    - **sendWithEffect**: Envía texto con un efecto de iMessage (`text` o `message`, `effect` o `effectId`). Nombres abreviados: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: Edita un mensaje enviado en versiones compatibles de macOS o de la API privada (`messageId`, `text` o `newText`). Solo se pueden editar los mensajes enviados por el propio Gateway.
    - **unsend**: Retira un mensaje enviado en versiones compatibles de macOS o de la API privada (`messageId`). Solo se pueden retirar los mensajes enviados por el propio Gateway.
    - **upload-file**: Envía contenido multimedia o archivos (`buffer` como base64 o un `media`/`path`/`filePath` preparado, `filename`, `asVoice` opcional). Alias heredado: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gestionan chats de grupo cuando el destino actual es una conversación grupal. Estas acciones modifican la identidad de Mensajes del host, por lo que requieren un remitente propietario o un cliente de Gateway `operator.admin`.
    - **poll**: Crea una encuesta nativa de Mensajes de Apple (`pollQuestion`, `pollOption` repetido de 2 a 12 veces, además de `chatGuid`, `chatId`, `chatIdentifier` o `to`). Los destinatarios con iOS/iPadOS/macOS 26 o posterior la ven y votan en ella de forma nativa; las versiones anteriores del sistema operativo reciben el texto alternativo "Se ha enviado una encuesta". Requiere `selectors.pollPayloadMessage`.
    - **poll-vote**: Vota en una encuesta existente (`pollId` o `messageId`, además de exactamente uno de `pollOptionIndex`, `pollOptionId` o `pollOptionText`). Requiere `selectors.pollVoteMessage` y el método RPC `poll.vote`.

    Las encuestas entrantes aceptadas se muestran al agente con la pregunta, las etiquetas numeradas de las opciones, los recuentos de votos y el ID del mensaje de la encuesta que necesita `poll-vote`.

  </Accordion>

  <Accordion title="ID de mensajes">
    El contexto entrante de iMessage incluye tanto valores abreviados de `MessageSid` como GUID completos de mensajes (`MessageSidFull`) cuando están disponibles. Los ID abreviados están limitados a la caché reciente de respuestas respaldada por SQLite y se comprueban con el chat actual antes de usarlos. Si un ID abreviado caduca, vuelva a intentarlo con su `MessageSidFull` y establezca como destino la conversación que lo proporcionó. Los ID completos no eluden la vinculación con la conversación ni con la cuenta, por lo que debe sustituirse un ID de otro chat por uno del destino actual. Las llamadas delegadas remotas pueden rechazar ID completos obsoletos cuando no haya pruebas disponibles sobre la conversación actual.

  </Accordion>

  <Accordion title="Detección de capacidades">
    OpenClaw oculta las acciones de la API privada únicamente cuando el estado de sondeo almacenado en caché indica que el puente no está disponible. Si el estado es desconocido, las acciones permanecen visibles y su ejecución inicia sondeos de forma diferida para que la primera acción pueda realizarse correctamente después de `imsg launch` sin una actualización manual independiente del estado.

  </Accordion>

  <Accordion title="Confirmaciones de lectura e indicador de escritura">
    Cuando el puente de la API privada está activo, los chats entrantes aceptados se marcan como leídos y los chats directos muestran una burbuja de escritura en cuanto se acepta el turno, mientras el agente prepara el contexto y genera la respuesta. Deshabilite el marcado como leído con:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Las compilaciones antiguas de `imsg` anteriores a la lista de capacidades por método desactivan silenciosamente la escritura y la lectura; OpenClaw registra una advertencia una sola vez por reinicio para que pueda determinarse la causa de la confirmación ausente.

  </Accordion>

  <Accordion title="Reacciones rápidas entrantes">
    OpenClaw se suscribe a las reacciones rápidas de iMessage y enruta las reacciones aceptadas como eventos del sistema en lugar de texto de mensaje normal, por lo que una reacción rápida del usuario no activa un bucle de respuesta ordinario.

    El modo de notificación se controla mediante `channels.imessage.reactionNotifications`:

    - `"own"` (valor predeterminado): notifica solo cuando los usuarios reaccionan a mensajes creados por el bot.
    - `"all"`: notifica todas las reacciones rápidas entrantes de remitentes autorizados.
    - `"off"`: ignora las reacciones rápidas entrantes.

    Las sobrescrituras por cuenta usan `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reacciones de aprobación (👍 / 👎)">
    Cuando `approvals.exec.enabled` o `approvals.plugin.enabled` es verdadero y la solicitud se enruta a iMessage, el Gateway entrega una solicitud de aprobación de forma nativa y acepta una reacción rápida para resolverla:

    - `👍` (reacción rápida Me gusta) → `allow-once`
    - `👎` (reacción rápida No me gusta) → `deny`
    - `allow-always` sigue siendo una alternativa manual: envíe `/approve <id> allow-always` como respuesta normal.

    La gestión de reacciones requiere que el identificador del usuario que reacciona figure explícitamente como aprobador. La lista de aprobadores se obtiene de `channels.imessage.allowFrom` (o `channels.imessage.accounts.<id>.allowFrom`); añada el número de teléfono del usuario en formato E.164 o el correo electrónico de su Apple ID (los destinos de chat como `chat_id:*` no son entradas de aprobador válidas). Se admite la entrada comodín `"*"`, pero permite que cualquier remitente apruebe; una lista de aprobadores vacía deshabilita por completo el acceso directo mediante reacciones. El acceso directo mediante reacciones elude intencionadamente `reactionNotifications`, `dmPolicy` y `groupAllowFrom`, porque la lista explícita de aprobadores permitidos es la única condición relevante para resolver la aprobación.

    La autorización del comando de texto `/approve` sigue la misma lista: cuando `channels.imessage.allowFrom` no está vacío, `/approve <id> <decision>` se autoriza según esa lista de aprobadores (no según la lista más amplia de MD permitidos), y los remitentes permitidos en la lista de MD pero no incluidos en `allowFrom` reciben una denegación explícita. Cuando `allowFrom` está vacío, se mantiene la alternativa del mismo chat y `/approve` autoriza a cualquier persona permitida por la lista de MD. Añada a `allowFrom` todos los operadores que deban aprobar, ya sea mediante `/approve` o mediante reacciones.

    Notas para operadores:
    - La vinculación de la reacción se almacena tanto en memoria como en el almacén persistente con claves del Gateway (con un TTL que coincide con el vencimiento de la aprobación), y el Gateway también consulta periódicamente las solicitudes pendientes en busca de tapbacks, por lo que un tapback que llega poco después de reiniciar el Gateway sigue resolviendo la aprobación.
    - El tapback `is_from_me=true` del propio operador (por ejemplo, desde un dispositivo Apple emparejado) resuelve la aprobación cuando ese identificador es un aprobador explícito.
    - Las solicitudes de aprobación se dirigen a una conversación grupal solo cuando se han configurado aprobadores explícitos; de lo contrario, cualquier miembro del grupo podría aprobar.
    - Los tapbacks heredados de estilo textual (`Liked "…"` como texto sin formato de clientes Apple muy antiguos) no pueden resolver aprobaciones porque no incluyen ningún GUID de mensaje; la resolución de reacciones requiere los metadatos estructurados de tapback que emiten los clientes actuales de macOS / iOS.

  </Accordion>
</AccordionGroup>

## Escrituras de configuración

iMessage permite de forma predeterminada las escrituras de configuración iniciadas por el canal (para `/config set|unset` cuando `commands.config: true`).

Para desactivarlas:

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

## Fusión de mensajes directos enviados por separado (comando + URL en una composición)

Cuando un usuario escribe juntos un comando y una URL —por ejemplo, `Dump https://example.com/article`—, la aplicación Mensajes de Apple divide el envío en **dos filas `chat.db` separadas**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa de OG como archivos adjuntos.

Las dos filas llegan a OpenClaw con una separación de ~0.8-2.0 s en la mayoría de las configuraciones. Sin fusión, el agente recibe solo el comando en el turno 1 (y a menudo responde «envíame la URL») antes de que la URL llegue en el turno 2. Esto se debe al proceso de envío de Apple, no a algo introducido por OpenClaw o `imsg`.

`channels.imessage.coalesceSameSenderDms` habilita en un mensaje directo el almacenamiento en búfer de filas consecutivas del mismo remitente. Cuando `imsg` expone el marcador estructural de vista previa de URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` en una de las filas de origen, OpenClaw fusiona únicamente ese envío dividido real y conserva las demás filas almacenadas en búfer como turnos separados. En compilaciones antiguas de `imsg` que no emiten ningún metadato de globo, OpenClaw no puede distinguir un envío dividido de envíos separados, por lo que recurre a fusionar el grupo. Esto conserva el comportamiento anterior a los metadatos en lugar de convertir de nuevo los envíos divididos de `Dump <url>` en dos turnos. Los chats grupales se siguen procesando por mensaje para conservar la estructura de turnos de varios usuarios.

<Tabs>
  <Tab title="Cuándo habilitarlo">
    Habilítelo cuando:

    - Distribuya Skills que esperen `command + payload` en un solo mensaje (volcar, pegar, guardar, poner en cola, etc.).
    - Los usuarios peguen URL junto con comandos.
    - Se pueda aceptar la latencia adicional en los turnos de mensajes directos (véase más abajo).

    Déjelo deshabilitado cuando:

    - Se necesite la latencia mínima de los comandos para activadores de mensajes directos de una sola palabra.
    - Todos los flujos sean comandos únicos sin cargas útiles posteriores.

  </Tab>
  <Tab title="Habilitación">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // activación voluntaria (valor predeterminado: false)
        },
      },
    }
    ```

    Con la opción habilitada y sin un valor explícito para `messages.inbound.byChannel.imessage` ni un valor global para `messages.inbound.debounceMs`, la ventana de antirrebote se amplía a **7000 ms** (el valor predeterminado heredado es 0 ms: sin antirrebote). La ventana más amplia es necesaria porque la cadencia de envío dividido de vistas previas de URL de Apple puede prolongarse varios segundos mientras Messages.app emite la fila de vista previa.

    Para ajustar la ventana manualmente:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms cubren los retrasos observados en las vistas previas de URL de Messages.app.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Consideraciones">
    - **La fusión precisa requiere los metadatos actuales de la carga útil de `imsg`.** Con `balloon_bundle_id` presente, solo se fusiona el envío dividido real; la fusión alternativa sin metadatos descrita anteriormente es una compatibilidad temporal con versiones anteriores, que se eliminará cuando `imsg` fusione los envíos divididos en el origen.
    - **Latencia adicional para los mensajes directos.** Con la opción habilitada, cada mensaje directo (incluidos los comandos de control independientes y los mensajes posteriores de solo texto) espera hasta que finalice la ventana de antirrebote antes de procesarse, por si está por llegar una fila de vista previa de URL. Los mensajes de chat grupal se procesan al instante.
    - **La salida fusionada está limitada.** El texto fusionado tiene un máximo de 4000 caracteres con un marcador explícito `…[truncated]`; los archivos adjuntos tienen un máximo de 20; y las entradas de origen, un máximo de 10 (si se supera, se conservan la primera y las más recientes). Cada GUID de origen se registra en `coalescedMessageGuids` para la telemetría posterior.
    - **Solo para mensajes directos.** Los chats grupales pasan al procesamiento por mensaje para que el bot siga respondiendo cuando varias personas escriben.
    - **Activación voluntaria por canal.** Los demás canales (Discord, Slack, Telegram, WhatsApp, …) no se ven afectados. Las configuraciones heredadas de BlueBubbles que establezcan `channels.bluebubbles.coalesceSameSenderDms` deben migrar ese valor a `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Situaciones y lo que ve el agente

La columna «Opción habilitada» muestra el comportamiento en una compilación de `imsg` que emite `balloon_bundle_id`. En compilaciones antiguas de `imsg` que no emiten ningún metadato de globo, las filas siguientes marcadas como «Dos turnos» / «N turnos» recurren en su lugar a una fusión heredada (un turno): OpenClaw no puede distinguir estructuralmente un envío dividido de envíos separados, por lo que conserva la fusión anterior a los metadatos. La separación precisa se activa cuando la compilación empieza a emitir metadatos de globo.

| El usuario compone                                                 | `chat.db` produce                  | Opción deshabilitada (predeterminada)                      | Opción habilitada + ventana (imsg emite metadatos de globo)                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (un envío)                              | 2 filas con una separación de ~1 s                   | Dos turnos del agente: «Dump» solo y después la URL | Un turno: texto fusionado `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (archivo adjunto + texto)                | 2 filas sin metadatos de globo de URL | Dos turnos                               | Dos turnos tras observarse metadatos; un turno fusionado en sesiones antiguas/anteriores al enclavamiento sin metadatos       |
| `/status` (comando independiente)                                     | 1 fila                               | Procesamiento instantáneo                        | **Espera hasta que finalice la ventana y después procesa**                                                                |
| URL pegada por sí sola                                                   | 1 fila                               | Procesamiento instantáneo                        | Espera hasta que finalice la ventana y después procesa                                                                    |
| Texto + URL enviados como dos mensajes separados deliberadamente, con minutos de diferencia | 2 filas fuera de la ventana               | Dos turnos                               | Dos turnos (la ventana vence entre ambos)                                                             |
| Ráfaga rápida (>10 mensajes directos pequeños dentro de la ventana)                          | N filas sin metadatos de globo de URL | N turnos                                 | N turnos tras observarse metadatos; un turno fusionado y limitado en sesiones antiguas/anteriores al enclavamiento sin metadatos |
| Dos personas escribiendo en un chat grupal                                  | N filas de M remitentes               | M+ turnos (uno por grupo de remitente)        | M+ turnos: los chats grupales no se fusionan                                                            |

## Recuperación de entradas tras reiniciar un puente o el Gateway

iMessage recupera los mensajes perdidos mientras el Gateway no estaba disponible y, al mismo tiempo, suprime la «bomba de mensajes atrasados» obsoletos que Apple puede liberar tras una recuperación de Push. El comportamiento predeterminado está siempre habilitado y se basa en la desduplicación de entradas.

- **Desduplicación de repeticiones.** Cada mensaje entrante procesado se registra mediante su GUID de Apple en el estado persistente del Plugin (`imessage.inbound-dedupe`), se reclama durante la ingesta y se confirma después de gestionarlo (se libera si se produce un fallo transitorio para que pueda volver a intentarse). Todo lo que ya se haya gestionado se descarta en lugar de procesarse dos veces. Esto permite que la recuperación repita los mensajes de forma intensiva sin llevar un registro por mensaje.
- **Recuperación tras una interrupción.** Al iniciarse, el monitor recuerda el rowid de la última fila `chat.db` procesada (un cursor persistente por cuenta) y lo pasa a `imsg watch.subscribe` como `since_rowid`, de modo que imsg repite las filas que llegaron mientras el Gateway no estaba disponible y después continúa con las nuevas. La repetición se limita a las 500 filas más recientes y a mensajes de hasta ~2 horas de antigüedad, y la desduplicación descarta todo lo ya gestionado.
- **Límite de antigüedad para mensajes atrasados obsoletos.** Las filas posteriores al límite de inicio son realmente nuevas; si la fecha de envío de una fila es más de ~15 minutos anterior a su llegada, se considera parte de los mensajes atrasados liberados por Push y se suprime. Las filas repetidas (en el límite o antes de él) usan en su lugar la ventana de recuperación más amplia, por lo que se entrega un mensaje perdido recientemente, pero no el historial antiguo.

La recuperación funciona tanto con configuraciones `cliPath` locales como remotas, porque la repetición de `since_rowid` se ejecuta mediante la misma conexión RPC `imsg`. La diferencia es la ventana: cuando el Gateway puede leer `chat.db` (local), fija el límite de rowid de inicio, limita el intervalo de repetición y entrega mensajes perdidos de hasta un par de horas de antigüedad. Mediante una conexión SSH remota de `cliPath`, no puede leer la base de datos, por lo que la repetición no tiene límite y cada fila usa el límite de antigüedad para mensajes nuevos: sigue recuperando los mensajes perdidos recientemente y suprimiendo los mensajes atrasados antiguos, pero con la ventana más estrecha para mensajes nuevos. Ejecute el Gateway en el Mac con Mensajes para disponer de la ventana de recuperación más amplia.

### Señal visible para el operador

Los mensajes atrasados suprimidos se registran en el nivel predeterminado y nunca se descartan silenciosamente (la opción `recovery` muestra qué ventana se aplicó):

```text
imessage: se suprimieron mensajes entrantes atrasados obsoletos account=<id> sent=<iso> recovery=<bool> (<N> suprimidos desde el inicio)
```

### Migración

`channels.imessage.catchup.*` está obsoleto: la recuperación tras interrupciones es automática y no necesita configuración en instalaciones nuevas. Las configuraciones existentes con `catchup.enabled: true` se siguen respetando como perfil de compatibilidad para la ventana de repetición de recuperación. Los bloques de recuperación deshabilitados (`enabled: false` o sin `enabled: true`) se han retirado; `openclaw doctor --fix` los elimina.

## Solución de problemas

<AccordionGroup>
  <Accordion title="No se encuentra imsg o RPC no es compatible">
    Valide el binario y la compatibilidad con RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Si la comprobación informa de que RPC no es compatible, actualice `imsg`. Si las acciones de la API privada no están disponibles, ejecute `imsg launch` en la sesión del usuario de macOS que haya iniciado sesión y vuelva a realizar la comprobación. Si el Gateway no se ejecuta en macOS, use la configuración de Mac remoto mediante SSH descrita anteriormente en lugar de la ruta local predeterminada `imsg`.

  </Accordion>

  <Accordion title="Los mensajes se envían, pero los iMessages entrantes no llegan">
    Primero compruebe si el mensaje llegó al Mac local. Si `chat.db` no cambia, OpenClaw no puede recibir el mensaje aunque `imsg status --json` indique que el puente funciona correctamente.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Si los mensajes enviados desde el teléfono no crean filas nuevas, repare la capa de Mensajes de macOS y Apple Push antes de cambiar la configuración de OpenClaw. A menudo basta con actualizar el servicio una vez:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Envía un iMessage nuevo desde el teléfono y confirma que haya una nueva fila `chat.db` o un evento `imsg watch` antes de depurar las sesiones de OpenClaw. No ejecutes esto como un bucle periódico de reinicio del puente; los reinicios repetidos de `imsg launch` y del Gateway durante el trabajo activo pueden interrumpir las entregas y dejar bloqueadas las ejecuciones del canal en curso.

  </Accordion>

  <Accordion title="El Gateway no se está ejecutando en macOS">
    El `cliPath: "imsg"` predeterminado debe ejecutarse en el Mac que tiene iniciada la sesión de Messages. En Linux o Windows, establece `channels.imessage.cliPath` en un script contenedor que se conecte mediante SSH a ese Mac y ejecute `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Después, ejecuta:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="Los mensajes directos se ignoran">
    Comprueba:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprobaciones de emparejamiento (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Los mensajes de grupo se ignoran">
    Comprueba:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` comportamiento de la lista de permitidos
    - configuración del patrón de menciones (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Los archivos adjuntos remotos fallan">
    Comprobar:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticación mediante clave SSH/SCP desde el host del Gateway
    - la clave del host existe en `~/.ssh/known_hosts` en el host del Gateway
    - la ruta remota es legible en el Mac que ejecuta Mensajes

  </Accordion>

  <Accordion title="Se omitieron las solicitudes de permisos de macOS">
    Volver a ejecutar en un terminal gráfico interactivo con el mismo contexto de usuario y sesión, y aprobar las solicitudes:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirmar que se hayan concedido Acceso total al disco y Automatización al contexto del proceso que ejecuta OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Referencias de configuración

- [Referencia de configuración: iMessage](/es/gateway/config-channels#imessage)
- [Configuración del Gateway](/es/gateway/configuration)
- [Emparejamiento](/es/channels/pairing)

## Temas relacionados

- [Descripción general de los canales](/es/channels) — todos los canales compatibles
- [Eliminación de BlueBubbles y la ruta de iMessage mediante imsg](/es/announcements/bluebubbles-imessage) — anuncio y resumen de la migración
- [Migración desde BlueBubbles](/es/channels/imessage-from-bluebubbles) — tabla de conversión de la configuración y transición paso a paso
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de los chats grupales y control mediante menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de la seguridad
