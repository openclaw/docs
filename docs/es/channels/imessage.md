---
read_when:
    - Configuración de la compatibilidad con iMessage
    - Depuración del envío y la recepción de iMessage
summary: Compatibilidad nativa con iMessage mediante imsg (JSON-RPC a través de stdio), con acciones de API privada para respuestas, reacciones Tapback, efectos, encuestas, archivos adjuntos y gestión de grupos. Opción preferida para nuevas configuraciones de iMessage en OpenClaw cuando se cumplen los requisitos del host.
title: iMessage
x-i18n:
    generated_at: "2026-07-12T14:19:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 81819aad1a9199791c3c02eb0c9cc72059c663710140b33ba31f79b4bc59d8e2
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para la implementación habitual de OpenClaw con iMessage, ejecute el Gateway y `imsg` en el mismo host de macOS con sesión iniciada en Mensajes. Si el Gateway se ejecuta en otro lugar, configure `channels.imessage.cliPath` para que apunte a un wrapper SSH transparente que ejecute `imsg` en el Mac.

**La recuperación de mensajes entrantes es automática.** Después de reiniciar un puente o el Gateway, iMessage reproduce los mensajes perdidos mientras estaba inactivo y suprime la «avalancha de mensajes pendientes» obsoletos que Apple puede enviar tras una recuperación de Push, eliminando duplicados para que nada se procese dos veces. No hay ninguna opción de configuración que habilitar; consulte [Recuperación de mensajes entrantes después de reiniciar un puente o el Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Se eliminó la compatibilidad con BlueBubbles. Migre las configuraciones de `channels.bluebubbles` a `channels.imessage`; OpenClaw solo admite iMessage mediante `imsg`. Comience con [Eliminación de BlueBubbles y la ruta de iMessage mediante imsg](/es/announcements/bluebubbles-imessage) para consultar el anuncio breve, o [Migración desde BlueBubbles](/es/channels/imessage-from-bluebubbles) para ver la tabla de migración completa.
</Warning>

Estado: integración nativa con una CLI externa. El Gateway inicia `imsg rpc` y se comunica mediante JSON-RPC por la entrada y salida estándar, sin un demonio ni un puerto independientes. Se recomienda encarecidamente el modo de API privada para disponer de un canal de iMessage completo; las respuestas, reacciones tapback, efectos, encuestas, respuestas a archivos adjuntos y acciones de grupo requieren `imsg launch` y una comprobación correcta de la API privada.

Para la configuración local habitual, el asistente de configuración de OpenClaw puede ofrecer una instalación o actualización de `imsg` mediante Homebrew, previa confirmación del usuario, en el Mac con sesión iniciada en Mensajes. La configuración manual y las topologías con wrapper SSH siguen estando administradas por el operador: instale o actualice `imsg` en el mismo contexto de usuario que ejecutará el Gateway o el wrapper.

<CardGroup cols={3}>
  <Card title="Acciones de la API privada" icon="wand-sparkles" href="#private-api-actions">
    Respuestas, reacciones tapback, efectos, encuestas, archivos adjuntos y administración de grupos.
  </Card>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los mensajes directos de iMessage usan de forma predeterminada el modo de emparejamiento.
  </Card>
  <Card title="Mac remoto" icon="terminal" href="#remote-mac-over-ssh">
    Use un wrapper SSH cuando el Gateway no se ejecute en el Mac de Mensajes.
  </Card>
  <Card title="Referencia de configuración" icon="settings" href="/es/gateway/config-channels#imessage">
    Referencia completa de los campos de iMessage.
  </Card>
</CardGroup>

## Configuración rápida

<Tabs>
  <Tab title="Mac local (ruta rápida)">
    <Steps>
      <Step title="Instalar y verificar imsg">

```bash
brew install steipete/tap/imsg
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        Cuando el asistente de configuración local detecta que falta el comando `imsg` predeterminado, puede solicitar instalar `steipete/tap/imsg` mediante Homebrew. Si detecta un `imsg` administrado por Homebrew, puede solicitar reinstalarlo o actualizarlo. Los wrappers personalizados de `cliPath` no se modifican.

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
    La mayoría de las configuraciones no necesitan SSH. Use esta topología únicamente cuando el Gateway no pueda ejecutarse en el Mac con sesión iniciada en Mensajes. OpenClaw solo requiere un `cliPath` compatible con la entrada y salida estándar, por lo que puede configurar `cliPath` para que apunte a un script wrapper que se conecte mediante SSH a un Mac remoto y ejecute `imsg`.
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
      remoteHost: "user@gateway-host", // se usa para obtener archivos adjuntos mediante SCP
      includeAttachments: true,
      // Opcional: raíces adicionales permitidas para archivos adjuntos (combinadas con la predeterminada
      // /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Si no se establece `remoteHost`, OpenClaw intenta detectarlo automáticamente analizando el script wrapper SSH.
    `remoteHost` debe tener el formato `host` o `user@host` (sin espacios ni opciones SSH); los valores no seguros se ignoran.
    OpenClaw usa una comprobación estricta de la clave del host para SCP, por lo que la clave del host de retransmisión ya debe existir en `~/.ssh/known_hosts`.
    Las rutas de los archivos adjuntos se validan con respecto a las raíces permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Cualquier wrapper de `cliPath` o proxy SSH que coloque delante de `imsg` DEBE comportarse como una canalización transparente de entrada y salida estándar para una conexión JSON-RPC de larga duración. OpenClaw intercambia pequeños mensajes JSON-RPC delimitados por saltos de línea mediante la entrada y salida estándar del wrapper durante toda la vida útil del canal:

- Reenvíe cada fragmento o línea de la entrada estándar **en cuanto haya bytes disponibles**; no espere al fin del archivo.
- Reenvíe sin demora cada fragmento o línea de la salida estándar en la dirección inversa.
- Conserve los saltos de línea.
- Evite lecturas bloqueantes de tamaño fijo (`read(4096)`, `cat | buffer`, el comando `read` predeterminado del shell) que puedan privar de datos a las tramas pequeñas.
- Mantenga la salida de error separada del flujo de salida estándar de JSON-RPC.

Un wrapper que almacene en búfer la entrada estándar hasta que se llene un bloque grande producirá síntomas similares a una interrupción de iMessage —`imsg rpc timeout (chats.list)` o reinicios repetidos del canal— aunque `imsg rpc` funcione correctamente. `ssh -T host imsg "$@"` (mostrado arriba) es seguro porque reenvía los argumentos de `cliPath` de OpenClaw, como `rpc` y `--db`. Las canalizaciones como `ssh host imsg | grep -v '^DEBUG'` NO lo son: las herramientas con búfer por líneas aún pueden retener tramas; use `stdbuf -oL -eL` en cada etapa si necesita aplicar un filtro.
</Warning>

  </Tab>
</Tabs>

## Requisitos y permisos (macOS)

- Debe haber una sesión iniciada en Mensajes en el Mac que ejecuta `imsg`.
- Se requiere acceso total al disco para el contexto del proceso que ejecuta OpenClaw/`imsg` (acceso a la base de datos de Mensajes).
- Se requiere permiso de automatización para enviar mensajes mediante Messages.app.
- Para las acciones avanzadas (reaccionar / editar / anular envío / respuesta en hilo / efectos / encuestas / operaciones de grupo), debe deshabilitarse la protección de integridad del sistema; consulte [Habilitación de la API privada de imsg](#enabling-the-imsg-private-api). El envío y la recepción básicos de texto y contenido multimedia funcionan sin deshabilitarla.

<Tip>
Los permisos se conceden por contexto de proceso. Si el Gateway se ejecuta sin interfaz gráfica (LaunchAgent/SSH), ejecute una vez un comando interactivo en ese mismo contexto para activar las solicitudes de permisos:

```bash
imsg chats --limit 1
# o
imsg send <handle> "prueba"
```

</Tip>

<Accordion title="Los envíos mediante el wrapper SSH fallan con AppleEvents -1743">
  Una configuración con SSH remoto puede leer chats, superar `channels status --probe` y procesar mensajes entrantes, mientras que los envíos siguen fallando con un error de autorización de AppleEvents:

```text
No autorizado para enviar eventos de Apple a Mensajes. (-1743)
```

Revise la base de datos TCC del usuario con sesión iniciada en el Mac o System Settings > Privacy & Security > Automation. Si la entrada de Automation se registra para `/usr/libexec/sshd-keygen-wrapper` en lugar del proceso de `imsg` o del shell local, es posible que macOS no muestre un control utilizable de Mensajes para ese cliente SSH del lado del servidor:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

En ese estado, repetir `tccutil reset AppleEvents` o volver a ejecutar `imsg send` mediante el mismo wrapper SSH puede seguir fallando porque el contexto del proceso que necesita la automatización de Mensajes es el wrapper SSH, no una aplicación a la que la interfaz pueda concedérsela.

Use en su lugar uno de los contextos de proceso compatibles con `imsg`:

- Ejecute el Gateway, o al menos el puente de `imsg`, en la sesión local del usuario con sesión iniciada en Mensajes.
- Inicie el Gateway con un LaunchAgent para ese usuario después de conceder acceso total al disco y automatización desde la misma sesión.
- Si conserva la topología SSH de dos usuarios, verifique que un envío saliente real mediante `imsg send` se complete correctamente a través del wrapper exacto antes de habilitar el canal. Si no se le puede conceder automatización, reconfigure el sistema para usar `imsg` con un solo usuario en lugar de depender del wrapper SSH para los envíos.

</Accordion>

## Habilitación de la API privada de imsg

`imsg` incluye dos modos operativos. Para OpenClaw, el modo de API privada es la configuración recomendada porque proporciona al canal las acciones nativas de iMessage que esperan los usuarios. El modo básico sigue siendo útil para instalaciones de bajo riesgo, la verificación inicial o hosts en los que no se puede deshabilitar SIP.

- **Modo básico** (predeterminado, no requiere cambios en SIP): texto y contenido multimedia salientes mediante `send`, supervisión e historial de mensajes entrantes y lista de chats. Esto es lo que se obtiene de inmediato con una instalación nueva mediante `brew install steipete/tap/imsg` y los permisos estándar de macOS indicados anteriormente.
- **Modo de API privada**: `imsg` inyecta una dylib auxiliar en `Messages.app` para llamar a funciones internas de `IMCore`. Esto habilita `react`, `edit`, `unsend`, `reply` (en hilo), `sendWithEffect`, `poll` y `poll-vote` (encuestas nativas de Mensajes), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, además de indicadores de escritura y confirmaciones de lectura.

La superficie de acciones recomendada en esta página requiere el modo de API privada. El README de `imsg` indica explícitamente el requisito:

> Las funciones avanzadas como `read`, `typing`, `launch`, el envío enriquecido respaldado por el puente, la modificación de mensajes y la administración de chats son opcionales. Requieren que SIP esté deshabilitado y que se inyecte una dylib auxiliar en `Messages.app`. `imsg launch` se niega a realizar la inyección cuando SIP está habilitado.

La técnica de inyección del componente auxiliar usa la propia dylib de `imsg` para acceder a las API privadas de Mensajes. No hay ningún servidor de terceros ni entorno de ejecución de BlueBubbles en la ruta de iMessage de OpenClaw.

<Warning>
**Deshabilitar SIP supone una contrapartida real de seguridad.** SIP es una de las protecciones principales de macOS contra la ejecución de código del sistema modificado; deshabilitarlo en todo el sistema aumenta la superficie de ataque y los posibles efectos secundarios. En particular, **deshabilitar SIP en los Mac con Apple Silicon también deshabilita la capacidad de instalar y ejecutar aplicaciones de iOS en el Mac**.

Considere esta acción una decisión operativa deliberada, especialmente en un Mac personal principal. Para usar iMessage con OpenClaw con calidad de producción, es preferible un Mac dedicado o un usuario bot de macOS en el que resulte aceptable habilitar el puente. Si su modelo de amenazas no permite que SIP esté deshabilitado en ningún sistema, el iMessage incluido se limita al modo básico: solo envío y recepción de texto y contenido multimedia, sin reacciones / edición / anulación de envío / efectos / operaciones de grupo.
</Warning>

### Configuración

1. **Instale (o actualice) `imsg`** en el Mac que ejecuta Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   La salida de `imsg status --json` informa de `bridge_version`, `rpc_methods` y los `selectors` de cada método, para que pueda consultar lo que admite la compilación actual antes de comenzar.

2. **Deshabilite la protección de integridad del sistema y, en versiones modernas de macOS, la validación de bibliotecas.** Para inyectar una dylib auxiliar que no sea de Apple en `Messages.app`, firmado por Apple, es necesario deshabilitar SIP **y** relajar la validación de bibliotecas. El paso para deshabilitar SIP en el modo de recuperación depende de la versión de macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** deshabilite la validación de bibliotecas mediante Terminal, reinicie en el modo de recuperación, ejecute `csrutil disable` y vuelva a reiniciar.
   - **macOS 11+ (Big Sur y posteriores), Intel:** acceda al modo de recuperación (o recuperación por Internet), ejecute `csrutil disable` y reinicie.
   - **macOS 11+, Apple Silicon:** use la secuencia de arranque con el botón de encendido para acceder a Recuperación; en versiones recientes de macOS, mantenga pulsada la tecla **Left Shift** al hacer clic en Continue y, después, ejecute `csrutil disable`. Las configuraciones de máquinas virtuales siguen un procedimiento diferente, por lo que debe crear primero una instantánea de la máquina virtual.

   **En macOS 11 y versiones posteriores, `csrutil disable` por sí solo normalmente no es suficiente.** Apple sigue aplicando la validación de bibliotecas a `Messages.app` como binario de plataforma, por lo que se rechaza un auxiliar firmado de forma ad hoc (`Library Validation failed: ... platform binary, but mapped file is not`) incluso con SIP desactivado. Después de desactivar SIP, desactive también la validación de bibliotecas y reinicie:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), verificado en 26.5.1:** desactivar SIP **más** el comando `DisableLibraryValidation` anterior es suficiente para inyectar el auxiliar desde 26.0 hasta 26.5.x. **No se requieren argumentos de arranque.** El plist es el factor decisivo y el paso que se omite con mayor frecuencia cuando falla la inyección en Tahoe:
   - **Con el plist:** `imsg launch` realiza la inyección y `imsg status` informa `advanced_features: true`.
   - **Sin el plist (incluso con SIP desactivado):** `imsg launch` falla con `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI rechaza el auxiliar ad hoc durante la carga, por lo que el puente nunca queda listo y el inicio agota el tiempo de espera. Ese tiempo de espera agotado es el síntoma más habitual en Tahoe; la solución es el plist anterior, no una medida más drástica.

   Si la inyección de `imsg launch` o determinados `selectors` empiezan a devolver falso después de una actualización de macOS, esta restricción suele ser la causa. Compruebe el estado de SIP y de la validación de bibliotecas antes de suponer que el propio paso de SIP falló. Si esos ajustes son correctos y el puente sigue sin poder realizar la inyección, recopile `imsg status --json` junto con la salida de `imsg launch` e informe al proyecto `imsg` en lugar de debilitar controles de seguridad adicionales de todo el sistema.

3. **Inyecte el auxiliar.** Con SIP desactivado y la sesión iniciada en Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` se niega a realizar la inyección si SIP sigue activado, por lo que esto también sirve para confirmar que el paso 2 se aplicó.

4. **Verifique el puente desde OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   La entrada de iMessage debería informar `works`, y `imsg status --json | jq '{rpc_methods, selectors}'` debería mostrar las capacidades expuestas por su compilación de macOS. La creación de encuestas requiere `selectors.pollPayloadMessage`; la votación requiere tanto `selectors.pollVoteMessage` como el método RPC `poll.vote`. El Plugin de OpenClaw anuncia únicamente las acciones compatibles con la comprobación almacenada en caché, mientras que una caché vacía mantiene una postura optimista y realiza la comprobación en el primer envío.

Si `openclaw channels status --probe` informa que el canal `works`, pero determinadas acciones generan "iMessage `<action>` requires the imsg private API bridge" al enviarse, ejecute `imsg launch` de nuevo: el auxiliar puede desconectarse (por un reinicio de Messages.app, una actualización del sistema operativo, etc.) y el estado `available: true` almacenado en caché seguirá anunciando acciones hasta que la siguiente comprobación lo actualice.

### Cuando SIP permanece activado

Si desactivar SIP no es aceptable para su modelo de amenazas:

- `imsg` recurre al modo básico: solo texto, contenido multimedia y recepción.
- El Plugin de OpenClaw sigue anunciando el envío de texto/contenido multimedia y la supervisión de mensajes entrantes; oculta `react`, `edit`, `unsend`, `reply`, `sendWithEffect` y las operaciones de grupo de la superficie de acciones (según la restricción de capacidades de cada método).
- Puede ejecutar un Mac independiente que no use Apple Silicon (o un Mac dedicado al bot) con SIP desactivado para la carga de trabajo de iMessage, mientras mantiene SIP activado en sus dispositivos principales. Consulte [Usuario de macOS dedicado al bot (identidad de iMessage independiente)](#deployment-patterns) más adelante.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.imessage.dmPolicy` controla los mensajes directos:

    - `pairing` (valor predeterminado)
    - `allowlist` (requiere al menos una entrada en `allowFrom`)
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    Campo de lista de permitidos: `channels.imessage.allowFrom`.

    Las entradas de la lista de permitidos deben identificar a los remitentes: identificadores o grupos estáticos de acceso de remitentes (`accessGroup:<name>`). Use `channels.imessage.groupAllowFrom` para destinos de chat como `chat_id:*`, `chat_guid:*` o `chat_identifier:*`; use `channels.imessage.groups` para claves numéricas `chat_id` del registro.

  </Tab>

  <Tab title="Política de grupos y menciones">
    `channels.imessage.groupPolicy` controla el procesamiento de grupos:

    - `allowlist` (valor predeterminado)
    - `open`
    - `disabled`

    Lista de remitentes de grupo permitidos: `channels.imessage.groupAllowFrom`.

    Las entradas de `groupAllowFrom` también pueden hacer referencia a grupos estáticos de acceso de remitentes (`accessGroup:<name>`).

    Alternativa en tiempo de ejecución: si `groupAllowFrom` no está definido, las comprobaciones de remitentes de grupos de iMessage usan `allowFrom`; defina `groupAllowFrom` cuando la admisión de mensajes directos y grupos deba ser distinta. Un valor `groupAllowFrom: []` explícitamente vacío no recurre a la alternativa: bloquea a todos los remitentes de grupos bajo `allowlist`.
    Nota sobre el tiempo de ejecución: si falta por completo `channels.imessage`, el tiempo de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (incluso si se ha definido `channels.defaults.groupPolicy`).

    <Warning>
    El enrutamiento de grupos con `groupPolicy: "allowlist"` aplica **dos** restricciones consecutivas:

    1. **Lista de remitentes permitidos** (`channels.imessage.groupAllowFrom`): identificador, `accessGroup:<name>`, `chat_guid`, `chat_identifier` o `chat_id`. Una lista efectiva vacía (sin `groupAllowFrom` ni alternativa mediante `allowFrom`) bloquea a todos los remitentes de grupos.
    2. **Registro de grupos** (`channels.imessage.groups`): se aplica en cuanto el mapa contiene entradas; el chat debe coincidir con una entrada explícita por `chat_id` o con un comodín `groups: { "*": { ... } }`. Cuando `groups` está vacío o ausente, solo la lista de remitentes permitidos decide la admisión.

    Si no se configura una lista efectiva de remitentes de grupos permitidos, todos los mensajes de grupo se descartan antes de la restricción del registro. Cada restricción tiene su propia señal de nivel `warn` en el nivel de registro predeterminado, y cada una indica una solución distinta:

    - una vez por cuenta durante el inicio, cuando la lista efectiva de remitentes de grupos permitidos está vacía: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`; soluciónelo definiendo `channels.imessage.groupAllowFrom` (o `allowFrom`); añadir únicamente entradas a `groups` deja la restricción 1 bloqueando a todos los remitentes.
    - una vez por `chat_id` en tiempo de ejecución, cuando un remitente superó la restricción 1, pero el chat no está en un registro `groups` con contenido: `imessage: dropping group message from chat_id=<id> ...`; soluciónelo añadiendo ese `chat_id` (o `"*"`) bajo `channels.imessage.groups`.

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

    `groupAllowFrom` por sí solo admite a esos remitentes en cualquier grupo; añada el bloque `groups` para delimitar qué chats están permitidos (y para establecer opciones por chat como `requireMention`).
    </Warning>

    Restricción por menciones para grupos:

    - iMessage no dispone de metadatos nativos de menciones
    - la detección de menciones usa patrones de expresiones regulares (`agents.list[].groupChat.mentionPatterns`, con alternativa en `messages.groupChat.mentionPatterns`)
    - sin patrones configurados, no se puede aplicar la restricción por menciones
    - los comandos de control de remitentes autorizados omiten la restricción por menciones

    `systemPrompt` por grupo:

    Cada entrada bajo `channels.imessage.groups.*` acepta una cadena `systemPrompt` opcional, que se inyecta en el prompt del sistema del agente en cada turno que procesa un mensaje de ese grupo. La resolución refleja la de `channels.whatsapp.groups`:

    1. **Prompt del sistema específico del grupo** (`groups["<chat_id>"].systemPrompt`): se usa cuando la entrada específica del grupo existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), se suprime el comodín y no se aplica ningún prompt del sistema a ese grupo.
    2. **Prompt del sistema comodín para grupos** (`groups["*"].systemPrompt`): se usa cuando la entrada específica del grupo está completamente ausente del mapa o cuando existe, pero no define ninguna clave `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Usa la ortografía británica." },
            "8421": {
              requireMention: true,
              systemPrompt: "Este es el chat del turno de guardia. Limita las respuestas a menos de 3 frases.",
            },
            "9907": {
              // supresión explícita: el comodín "Usa la ortografía británica." no se aplica aquí
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Los prompts por grupo solo se aplican a los mensajes de grupo; los mensajes directos no se ven afectados.

  </Tab>

  <Tab title="Sesiones y respuestas deterministas">
    - Los mensajes directos usan enrutamiento directo; los grupos usan enrutamiento de grupos.
    - Con el valor predeterminado `session.dmScope=main`, los mensajes directos de iMessage se agrupan en la sesión principal del agente.
    - Las sesiones de grupo están aisladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Las respuestas se devuelven a iMessage mediante los metadatos del canal y destino de origen.

    Comportamiento de hilos similares a grupos:

    Algunos hilos de iMessage con varios participantes pueden llegar con `is_group=false`.
    Si ese `chat_id` está configurado explícitamente bajo `channels.imessage.groups`, OpenClaw lo trata como tráfico de grupo (restricciones de grupo y aislamiento de la sesión de grupo).

  </Tab>
</Tabs>

## Vinculaciones de conversaciones ACP

Los chats de iMessage se pueden vincular a sesiones ACP.

Flujo rápido para operadores:

- Ejecute `/acp spawn codex --bind here` dentro del mensaje directo o del chat de grupo permitido.
- Los mensajes futuros de esa misma conversación de iMessage se enrutan a la sesión ACP creada.
- `/new` y `/reset` restablecen en el mismo lugar la sesión ACP vinculada.
- `/acp close` cierra la sesión ACP y elimina la vinculación.

Las vinculaciones persistentes configuradas usan entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "imessage"`.

`match.peer.id` puede usar:

- un identificador normalizado de mensaje directo, como `+15555550123` o `user@example.com`
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

Consulte [Agentes ACP](/es/tools/acp-agents) para conocer el comportamiento compartido de las vinculaciones ACP.

## Patrones de despliegue

<AccordionGroup>
  <Accordion title="Usuario de macOS dedicado al bot (identidad de iMessage independiente)">
    Use un Apple ID y un usuario de macOS dedicados para que el tráfico del bot permanezca aislado de su perfil personal de Messages.

    Flujo habitual:

    1. Cree o inicie sesión en un usuario de macOS dedicado.
    2. Inicie sesión en Messages con el Apple ID del bot en ese usuario.
    3. Instale `imsg` en ese usuario.
    4. Cree un contenedor SSH para que OpenClaw pueda ejecutar `imsg` en el contexto de ese usuario.
    5. Dirija `channels.imessage.accounts.<id>.cliPath` y `.dbPath` al perfil de ese usuario.

    La primera ejecución puede requerir aprobaciones en la interfaz gráfica (Automatización y acceso total al disco) en la sesión de ese usuario del bot.

  </Accordion>

  <Accordion title="Mac remoto mediante Tailscale (ejemplo)">
    Topología habitual:

    - el Gateway se ejecuta en Linux o una máquina virtual
    - iMessage y `imsg` se ejecutan en un Mac de su red de Tailscale
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
    Establezca `channels.imessage.dmHistoryLimit` para inicializar las nuevas sesiones de mensajes directos con el historial reciente de `imsg` decodificado para esa conversación. Use `channels.imessage.dms["<sender>"].historyLimit` para sobrescribirlo por remitente, incluido `0` para desactivar el historial de un remitente.

    El historial de mensajes directos de iMessage se obtiene bajo demanda desde `imsg`. Si no se establece `dmHistoryLimit`, se desactiva la inicialización global del historial de mensajes directos, pero un valor positivo de `channels.imessage.dms["<sender>"].historyLimit` sigue activando la inicialización para ese remitente.

  </Accordion>
</AccordionGroup>

## Contenido multimedia, fragmentación y destinos de entrega

<AccordionGroup>
  <Accordion title="Archivos adjuntos y contenido multimedia">
    - la ingesta de archivos adjuntos entrantes está **desactivada de forma predeterminada** — establezca `channels.imessage.includeAttachments: true` para reenviar fotos, notas de voz, vídeos y otros archivos adjuntos al agente. Si está desactivada, los iMessages que solo contienen archivos adjuntos se descartan antes de llegar al agente y es posible que no generen ninguna línea de registro `Inbound message`.
    - las rutas remotas de archivos adjuntos se pueden obtener mediante SCP cuando se establece `remoteHost`
    - las rutas de archivos adjuntos deben coincidir con las raíces permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - las raíces configuradas amplían el patrón de raíz predeterminado `/Users/*/Library/Messages/Attachments` (se combinan, no se reemplazan)
    - SCP usa una comprobación estricta de la clave del host (`StrictHostKeyChecking=yes`)
    - el tamaño del contenido multimedia saliente usa `channels.imessage.mediaMaxMb` (valor predeterminado: 16 MB)

  </Accordion>

  <Accordion title="Texto saliente y fragmentación">
    - límite de fragmentos de texto: `channels.imessage.textChunkLimit` (valor predeterminado: 4000)
    - modo de fragmentación: `channels.imessage.streaming.chunkMode`
      - `length` (valor predeterminado)
      - `newline` (división prioritaria por párrafos)
    - la negrita, cursiva, subrayado y tachado de Markdown saliente se convierten en texto con estilo nativo (los destinatarios con macOS 15+ muestran el formato; los destinatarios con versiones anteriores ven texto sin formato y sin los marcadores); las tablas de Markdown se convierten según el modo de tablas Markdown del canal
    - `channels.imessage.sendTransport` (`auto` de forma predeterminada, `bridge`, `applescript`) selecciona cómo `imsg` realiza los envíos

  </Accordion>

  <Accordion title="Formatos de direccionamiento">
    Destinos explícitos preferidos:

    - `chat_id:123` (recomendado para un enrutamiento estable)
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

## Acciones de la API privada

Cuando `imsg launch` está en ejecución y `openclaw channels status --probe` informa de `privateApi.available: true`, la herramienta de mensajes puede usar acciones nativas de iMessage además de los envíos de texto normales.

Todas las acciones están activadas de forma predeterminada; use `channels.imessage.actions` para desactivar acciones individuales:

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
    - **react**: Añade o elimina reacciones de iMessage (`messageId`, `emoji`, `remove`). Las reacciones admitidas corresponden a amor, me gusta, no me gusta, risa, énfasis y pregunta. Al eliminar sin un emoji, se borra la reacción que estuviera establecida.
    - **reply**: Envía una respuesta en un hilo a un mensaje existente (`messageId`, `text` o `message`, además de `chatGuid`, `chatId`, `chatIdentifier` o `to`). La respuesta con un archivo adjunto requiere además una compilación de `imsg` cuyo `send-rich` admita `--file`.
    - **sendWithEffect**: Envía texto con un efecto de iMessage (`text` o `message`, `effect` o `effectId`). Nombres cortos: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: Edita un mensaje enviado en versiones compatibles de macOS o de la API privada (`messageId`, `text` o `newText`). Solo se pueden editar los mensajes enviados por el propio Gateway.
    - **unsend**: Retira un mensaje enviado en versiones compatibles de macOS o de la API privada (`messageId`). Solo se pueden retirar los mensajes enviados por el propio Gateway.
    - **upload-file**: Envía contenido multimedia o archivos (`buffer` como base64 o un valor preparado de `media`/`path`/`filePath`, `filename` y, opcionalmente, `asVoice`). Alias heredado: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gestionan chats de grupo cuando el destino actual es una conversación grupal. Estas acciones modifican la identidad de Messages del host, por lo que requieren un remitente propietario o un cliente del Gateway con `operator.admin`.
    - **poll**: Crea una encuesta nativa de Apple Messages (`pollQuestion`, `pollOption` repetido de 2 a 12 veces, además de `chatGuid`, `chatId`, `chatIdentifier` o `to`). Los destinatarios con iOS/iPadOS/macOS 26+ pueden verla y votar de forma nativa; las versiones anteriores del sistema operativo reciben como alternativa el texto "Se envió una encuesta". Requiere `selectors.pollPayloadMessage`.
    - **poll-vote**: Vota en una encuesta existente (`pollId` o `messageId`, además de exactamente uno de `pollOptionIndex`, `pollOptionId` o `pollOptionText`). Requiere `selectors.pollVoteMessage` y el método RPC `poll.vote`.

    Las encuestas entrantes aceptadas se muestran al agente con la pregunta, las etiquetas numeradas de las opciones, los recuentos de votos y el ID del mensaje de la encuesta que necesita `poll-vote`.

  </Accordion>

  <Accordion title="ID de mensajes">
    El contexto de iMessage entrante incluye tanto valores cortos de `MessageSid` como GUID completos de mensajes (`MessageSidFull`) cuando están disponibles. Los ID cortos se limitan a la caché reciente de respuestas respaldada por SQLite y se comprueban con respecto al chat actual antes de usarse. Si un ID corto ha caducado o pertenece a otro chat, vuelva a intentarlo con el valor completo de `MessageSidFull`.

  </Accordion>

  <Accordion title="Detección de capacidades">
    OpenClaw oculta las acciones de la API privada solo cuando el estado de sondeo almacenado en caché indica que el puente no está disponible. Si el estado es desconocido, las acciones permanecen visibles y ejecutan sondeos de forma diferida, de modo que la primera acción pueda realizarse correctamente después de `imsg launch` sin una actualización manual independiente del estado.

  </Accordion>

  <Accordion title="Confirmaciones de lectura e indicador de escritura">
    Cuando el puente de la API privada está activo, los chats entrantes aceptados se marcan como leídos y los chats directos muestran una burbuja de escritura en cuanto se acepta el turno, mientras el agente prepara el contexto y genera la respuesta. Para desactivar el marcado como leído:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Las versiones anteriores de `imsg`, previas a la lista de capacidades por método, desactivan silenciosamente el indicador de escritura y las confirmaciones de lectura; OpenClaw registra una advertencia una sola vez por reinicio para que pueda atribuirse la ausencia de la confirmación.

  </Accordion>

  <Accordion title="Tapbacks entrantes">
    OpenClaw se suscribe a los tapbacks de iMessage y enruta las reacciones aceptadas como eventos del sistema en lugar de texto de mensaje normal, por lo que el tapback de un usuario no activa un bucle de respuesta normal.

    El modo de notificación se controla mediante `channels.imessage.reactionNotifications`:

    - `"own"` (predeterminado): notifica solo cuando los usuarios reaccionan a mensajes escritos por el bot.
    - `"all"`: notifica todos los tapbacks entrantes de remitentes autorizados.
    - `"off"`: ignora los tapbacks entrantes.

    Las anulaciones por cuenta utilizan `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reacciones de aprobación (👍 / 👎)">
    Cuando `approvals.exec.enabled` o `approvals.plugin.enabled` es verdadero y la solicitud se enruta a iMessage, el Gateway entrega una solicitud de aprobación de forma nativa y acepta un tapback para resolverla:

    - `👍` (tapback de Me gusta) → `allow-once`
    - `👎` (tapback de No me gusta) → `deny`
    - `allow-always` sigue siendo una alternativa manual: envíe `/approve <id> allow-always` como respuesta normal.

    La gestión de reacciones requiere que el identificador del usuario que reacciona esté incluido explícitamente como aprobador. La lista de aprobadores se lee de `channels.imessage.allowFrom` (o `channels.imessage.accounts.<id>.allowFrom`); añada el número de teléfono del usuario en formato E.164 o el correo electrónico de su Apple ID (los destinos de chat como `chat_id:*` no son entradas de aprobador válidas). Se admite la entrada comodín `"*"`, pero permite que cualquier remitente apruebe; una lista de aprobadores vacía deshabilita por completo el atajo de reacciones. El atajo de reacciones omite intencionadamente `reactionNotifications`, `dmPolicy` y `groupAllowFrom`, porque la lista de permitidos de aprobadores explícitos es el único control relevante para resolver la aprobación.

    La autorización del comando de texto `/approve` utiliza la misma lista: cuando `channels.imessage.allowFrom` no está vacío, `/approve <id> <decision>` se autoriza según esa lista de aprobadores (no según la lista de permitidos más amplia de mensajes directos), y los remitentes permitidos en la lista de mensajes directos pero no incluidos en `allowFrom` reciben una denegación explícita. Cuando `allowFrom` está vacío, se mantiene la alternativa del mismo chat y `/approve` autoriza a cualquier persona permitida por la lista de mensajes directos. Añada a `allowFrom` todos los operadores que deban aprobar, ya sea mediante `/approve` o mediante reacciones.

    Notas para operadores:
    - La vinculación de la reacción se almacena tanto en memoria como en el almacén persistente con claves del Gateway (con un TTL que coincide con el vencimiento de la aprobación), y el Gateway también consulta periódicamente las solicitudes pendientes en busca de tapbacks, por lo que un tapback que llegue poco después de reiniciar el Gateway seguirá resolviendo la aprobación.
    - El tapback del propio operador con `is_from_me=true` (por ejemplo, desde un dispositivo Apple enlazado) resuelve la aprobación cuando ese identificador es un aprobador explícito.
    - Las solicitudes de aprobación solo se dirigen a una conversación grupal cuando hay aprobadores explícitos configurados; de lo contrario, cualquier miembro del grupo podría aprobar.
    - Los tapbacks heredados en formato de texto (`Liked "…"` como texto sin formato de clientes Apple muy antiguos) no pueden resolver aprobaciones porque no incluyen ningún GUID de mensaje; la resolución mediante reacciones requiere los metadatos estructurados de tapback que emiten los clientes actuales de macOS/iOS.

  </Accordion>
</AccordionGroup>

## Escrituras de configuración

iMessage permite de forma predeterminada las escrituras de configuración iniciadas por el canal (para `/config set|unset` cuando `commands.config: true`).

Para deshabilitarlas:

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

## Agrupación de mensajes directos divididos (comando + URL en una sola composición)

Cuando un usuario escribe juntos un comando y una URL —por ejemplo, `Dump https://example.com/article`—, la aplicación Mensajes de Apple divide el envío en **dos filas independientes de `chat.db`**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa de OG como archivos adjuntos.

Las dos filas llegan a OpenClaw con una separación de ~0.8-2.0 s en la mayoría de las configuraciones. Sin la agrupación, el agente recibe únicamente el comando en el turno 1 (y a menudo responde «envíeme la URL») antes de que la URL llegue en el turno 2. Esto se debe al proceso de envío de Apple, no a nada que introduzcan OpenClaw o `imsg`.

`channels.imessage.coalesceSameSenderDms` permite que un MD almacene en búfer filas consecutivas del mismo remitente. Cuando `imsg` expone el marcador estructural de vista previa de URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` en una de las filas de origen, OpenClaw combina únicamente ese envío dividido real y mantiene las demás filas almacenadas en búfer como turnos separados. En versiones anteriores de `imsg` que no emiten ningún metadato de globo, OpenClaw no puede distinguir un envío dividido de varios envíos separados, por lo que recurre a combinar el conjunto. Esto conserva el comportamiento anterior a los metadatos, en lugar de hacer que los envíos divididos `Dump <url>` vuelvan a convertirse en dos turnos. Los chats grupales siguen procesando cada mensaje por separado para preservar la estructura de turnos de varios usuarios.

<Tabs>
  <Tab title="Cuándo habilitarlo">
    Habilítelo cuando:

    - Distribuya Skills que esperan `command + payload` en un solo mensaje (volcar, pegar, guardar, poner en cola, etc.).
    - Los usuarios peguen URL junto con comandos.
    - Pueda aceptar la latencia adicional de los turnos de MD (consulte más abajo).

    Déjelo deshabilitado cuando:

    - Necesite la latencia mínima de los comandos para activadores de MD de una sola palabra.
    - Todos los flujos sean comandos de una sola ejecución sin cargas útiles posteriores.

  </Tab>
  <Tab title="Habilitación">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // habilitación voluntaria (valor predeterminado: false)
        },
      },
    }
    ```

    Con la opción activada y sin un valor explícito de `messages.inbound.byChannel.imessage` ni un valor global de `messages.inbound.debounceMs`, la ventana de antirrebote se amplía a **7000 ms** (el valor predeterminado heredado es 0 ms: sin antirrebote). La ventana más amplia es necesaria porque la cadencia de los envíos divididos de vistas previas de URL de Apple puede prolongarse varios segundos mientras Messages.app emite la fila de vista previa.

    Para ajustar personalmente la ventana:

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
    - **La combinación precisa requiere metadatos actuales en la carga útil de `imsg`.** Cuando `balloon_bundle_id` está presente, solo se combina el envío dividido real; la combinación de respaldo sin metadatos descrita anteriormente es una medida provisional de compatibilidad con versiones anteriores que se eliminará cuando `imsg` combine los envíos divididos en el origen.
    - **Latencia adicional para los mensajes de MD.** Con la opción activada, cada MD (incluidos los comandos de control independientes y los mensajes posteriores de un solo texto) espera hasta que finalice la ventana de antirrebote antes de procesarse, por si llega una fila de vista previa de URL. Los mensajes de chats grupales siguen procesándose al instante.
    - **La salida combinada tiene límites.** El texto combinado se limita a 4000 caracteres e incluye un marcador explícito `…[truncated]`; los archivos adjuntos se limitan a 20; las entradas de origen se limitan a 10 (si se supera este límite, se conservan la primera y las más recientes). Cada GUID de origen se registra en `coalescedMessageGuids` para la telemetría posterior.
    - **Solo para MD.** Los chats grupales pasan al procesamiento por mensaje para que el bot mantenga su capacidad de respuesta cuando varias personas están escribiendo.
    - **Habilitación voluntaria y por canal.** Los demás canales (Discord, Slack, Telegram, WhatsApp, …) no se ven afectados. Las configuraciones heredadas de BlueBubbles que establezcan `channels.bluebubbles.coalesceSameSenderDms` deben migrar ese valor a `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Situaciones y lo que ve el agente

La columna «Opción activada» muestra el comportamiento en una versión de `imsg` que emite `balloon_bundle_id`. En versiones anteriores de `imsg` que no emiten ningún metadato de globo, las filas indicadas a continuación como «Dos turnos»/«N turnos» recurren en su lugar a una combinación heredada (un turno): OpenClaw no puede distinguir estructuralmente un envío dividido de varios envíos separados, por lo que conserva la combinación anterior a los metadatos. La separación precisa se activa cuando la versión comienza a emitir metadatos de globo.

| El usuario redacta                                                 | `chat.db` produce                    | Opción desactivada (predeterminado)              | Opción activada + ventana (imsg emite metadatos de globo)                                                   |
| ------------------------------------------------------------------ | ------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (un envío)                              | 2 filas separadas por ~1 s           | Dos turnos del agente: «Dump» solo y luego la URL | Un turno: texto combinado `Dump https://example.com`                                                        |
| `Save this 📎image.jpg caption` (archivo adjunto + texto)          | 2 filas sin metadatos de globo de URL | Dos turnos                                       | Dos turnos tras observar metadatos; un turno combinado en sesiones antiguas/previas a la detección sin metadatos |
| `/status` (comando independiente)                                  | 1 fila                               | Procesamiento instantáneo                         | **Espera hasta que finalice la ventana y luego se procesa**                                                 |
| URL pegada por sí sola                                             | 1 fila                               | Procesamiento instantáneo                         | Espera hasta que finalice la ventana y luego se procesa                                                     |
| Texto + URL enviados como dos mensajes separados deliberadamente, con minutos de diferencia | 2 filas fuera de la ventana | Dos turnos                                       | Dos turnos (la ventana expira entre ambos)                                                                  |
| Ráfaga rápida (>10 MD pequeños dentro de la ventana)               | N filas sin metadatos de globo de URL | N turnos                                         | N turnos tras observar metadatos; un turno combinado y limitado en sesiones antiguas/previas a la detección sin metadatos |
| Dos personas escribiendo en un chat grupal                         | N filas de M remitentes              | M+ turnos (uno por conjunto de remitente)         | M+ turnos: los chats grupales no se combinan                                                                |

## Recuperación de mensajes entrantes tras reiniciar un puente o el Gateway

iMessage recupera los mensajes perdidos mientras el Gateway estaba inactivo y, al mismo tiempo, suprime la «bomba de mensajes pendientes» obsoletos que Apple puede descargar después de una recuperación de Push. El comportamiento predeterminado está siempre activado y se basa en la deduplicación de mensajes entrantes.

- **Deduplicación de reproducción.** Cada mensaje entrante procesado se registra mediante su GUID de Apple en el estado persistente del Plugin (`imessage.inbound-dedupe`), se reclama durante la ingesta y se confirma después de gestionarlo (se libera tras un fallo transitorio para permitir un nuevo intento). Todo lo que ya se haya gestionado se descarta en lugar de procesarse dos veces. Esto permite que la recuperación reproduzca de forma intensiva sin llevar un registro individual de cada mensaje.
- **Recuperación del tiempo de inactividad.** Al iniciarse, el monitor recuerda el último rowid procesado de `chat.db` (un cursor persistente por cuenta) y se lo pasa a `imsg watch.subscribe` como `since_rowid`, por lo que imsg reproduce las filas que llegaron mientras el Gateway estaba inactivo y después continúa siguiendo la actividad en tiempo real. La reproducción se limita a las 500 filas más recientes y a mensajes de hasta ~2 horas de antigüedad, y la deduplicación descarta todo lo que ya se haya gestionado.
- **Límite de antigüedad para mensajes pendientes obsoletos.** Las filas posteriores al límite de inicio son realmente nuevas; si la fecha de envío de una fila es más de ~15 minutos anterior a su llegada, se considera parte de los mensajes pendientes descargados por Push y se suprime. Las filas reproducidas (en el límite o antes de él) utilizan en su lugar la ventana de recuperación más amplia, por lo que se entrega un mensaje perdido recientemente, pero no el historial antiguo.

La recuperación funciona tanto con configuraciones de `cliPath` locales como remotas, porque la reproducción mediante `since_rowid` se ejecuta a través de la misma conexión RPC de `imsg`. La diferencia es la ventana: cuando el Gateway puede leer `chat.db` (local), fija el límite de rowid de inicio, restringe el intervalo de reproducción y entrega mensajes perdidos de hasta un par de horas de antigüedad. Con un `cliPath` de SSH remoto no puede leer la base de datos, por lo que la reproducción no tiene límite y cada fila utiliza el límite de antigüedad en tiempo real: sigue recuperando los mensajes perdidos recientemente y suprimiendo los mensajes pendientes antiguos, pero con la ventana en tiempo real más estrecha. Ejecute el Gateway en el Mac con Messages para disponer de la ventana de recuperación más amplia.

### Señal visible para el operador

Los mensajes pendientes suprimidos se registran en el nivel predeterminado y nunca se descartan silenciosamente (la marca `recovery` indica qué ventana se aplicó):

```text
imessage: se suprimieron mensajes entrantes pendientes obsoletos account=<id> sent=<iso> recovery=<bool> (<N> suprimidos desde el inicio)
```

### Migración

`channels.imessage.catchup.*` está obsoleto: la recuperación del tiempo de inactividad es automática y no requiere configuración en las instalaciones nuevas. Las configuraciones existentes con `catchup.enabled: true` siguen respetándose como perfil de compatibilidad para la ventana de reproducción de recuperación. Los bloques de recuperación deshabilitados (`enabled: false` o sin `enabled: true`) se retiran; `openclaw doctor --fix` los elimina.

## Solución de problemas

<AccordionGroup>
  <Accordion title="No se encuentra imsg o RPC no es compatible">
    Valide el binario y la compatibilidad con RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Si la comprobación indica que RPC no es compatible, actualice `imsg`. Si las acciones de la API privada no están disponibles, ejecute `imsg launch` en la sesión del usuario de macOS que haya iniciado sesión y vuelva a realizar la comprobación. Si el Gateway no se ejecuta en macOS, utilice la configuración de Mac remoto mediante SSH descrita anteriormente en lugar de la ruta local predeterminada de `imsg`.

  </Accordion>

  <Accordion title="Los mensajes se envían, pero los iMessages entrantes no llegan">
    Primero, compruebe si el mensaje llegó al Mac local. Si `chat.db` no cambia, OpenClaw no puede recibir el mensaje aunque `imsg status --json` indique que el puente funciona correctamente.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Si los mensajes enviados desde el teléfono no crean filas nuevas, repare la capa de Messages y Apple Push de macOS antes de cambiar la configuración de OpenClaw. Suele bastar con actualizar los servicios una vez:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Envíe un iMessage nuevo desde el teléfono y confirme que haya una fila nueva en `chat.db` o un evento de `imsg watch` antes de depurar las sesiones de OpenClaw. No ejecute este procedimiento como un bucle periódico de reinicio del puente; ejecutar repetidamente `imsg launch` y reiniciar el Gateway durante el trabajo activo puede interrumpir las entregas y dejar bloqueadas las ejecuciones del canal en curso.

  </Accordion>

  <Accordion title="El Gateway no se ejecuta en macOS">
    El valor predeterminado `cliPath: "imsg"` debe ejecutarse en el Mac que tenga una sesión iniciada en Messages. En Linux o Windows, establezca `channels.imessage.cliPath` en un script contenedor que se conecte por SSH a ese Mac y ejecute `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    A continuación, ejecute:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="Los MD se ignoran">
    Compruebe:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprobaciones de emparejamiento (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Los mensajes grupales se ignoran">
    Compruebe:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - el comportamiento de la lista de permitidos de `channels.imessage.groups`
    - la configuración de patrones de mención (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Los archivos adjuntos remotos fallan">
    Compruebe:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - la autenticación con clave SSH/SCP desde el host del Gateway
    - que la clave del host exista en `~/.ssh/known_hosts` en el host del Gateway
    - la legibilidad de las rutas remotas en el Mac que ejecuta Messages

  </Accordion>

  <Accordion title="No se atendieron las solicitudes de permisos de macOS">
    Vuelva a ejecutar los comandos en un terminal gráfico interactivo con el mismo contexto de usuario y sesión, y apruebe las solicitudes:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirme que se hayan concedido Acceso total al disco y Automatización al contexto del proceso que ejecuta OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Referencias de configuración

- [Referencia de configuración de iMessage](/es/gateway/config-channels#imessage)
- [Configuración del Gateway](/es/gateway/configuration)
- [Vinculación](/es/channels/pairing)

## Temas relacionados

- [Descripción general de los canales](/es/channels) — todos los canales compatibles
- [Eliminación de BlueBubbles y la ruta de iMessage mediante imsg](/es/announcements/bluebubbles-imessage) — anuncio y resumen de la migración
- [Migración desde BlueBubbles](/es/channels/imessage-from-bluebubbles) — tabla de equivalencias de configuración y transición paso a paso
- [Vinculación](/es/channels/pairing) — autenticación de mensajes directos y flujo de vinculación
- [Grupos](/es/channels/groups) — comportamiento de los chats grupales y control mediante menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y protección reforzada
