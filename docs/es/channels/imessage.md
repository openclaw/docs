---
read_when:
    - Configuración de la compatibilidad con iMessage
    - Depuración del envío y la recepción de iMessage
summary: Compatibilidad nativa con iMessage mediante imsg (JSON-RPC a través de stdio), con acciones de API privada para respuestas, reacciones Tapback, efectos, encuestas, archivos adjuntos y gestión de grupos. Opción preferida para nuevas configuraciones de iMessage con OpenClaw cuando se cumplen los requisitos del host.
title: iMessage
x-i18n:
    generated_at: "2026-07-22T10:25:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f1ba05e9305591853a5965a2af3c4b250b8d98ba2bad11e350516c0c984132a9
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para la implementación habitual de iMessage con OpenClaw, ejecute el Gateway y `imsg` en el mismo host de Mensajes de macOS con la sesión iniciada. Si el Gateway se ejecuta en otro lugar, configure `channels.imessage.cliPath` para que apunte a un wrapper SSH transparente que ejecute `imsg` en el Mac.

**La recuperación de mensajes entrantes es automática.** Después de reiniciar el puente o el Gateway, iMessage reproduce los mensajes que no se recibieron mientras estaba inactivo y suprime la obsoleta «bomba de mensajes pendientes» que Apple puede descargar después de una recuperación de Push, eliminando duplicados para que nada se procese dos veces. No hay ninguna configuración que habilitar; consulte [Recuperación de mensajes entrantes después de reiniciar el puente o el Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Se eliminó la compatibilidad con BlueBubbles. Migre las configuraciones de `channels.bluebubbles` a `channels.imessage`; OpenClaw solo admite iMessage mediante `imsg`. Consulte primero [Eliminación de BlueBubbles y la ruta de iMessage con imsg](/es/announcements/bluebubbles-imessage) para leer el anuncio breve, o [Migración desde BlueBubbles](/es/channels/imessage-from-bluebubbles) para consultar la tabla de migración completa.
</Warning>

Estado: integración nativa con una CLI externa. El Gateway inicia `imsg rpc` y se comunica mediante JSON-RPC a través de la entrada y salida estándar, sin un daemon ni un puerto independientes. Se recomienda encarecidamente el modo de API privada para disponer de un canal de iMessage completo; las respuestas, los tapbacks, los efectos, las encuestas, las respuestas a archivos adjuntos y las acciones de grupo requieren `imsg launch` y una comprobación correcta de la API privada.

Para la configuración local habitual, el asistente de configuración de OpenClaw puede ofrecer una instalación o actualización de `imsg` mediante Homebrew, confirmada por el usuario, en el Mac con la sesión de Mensajes iniciada. La configuración manual y las topologías con wrappers SSH siguen estando a cargo del operador: instale o actualice `imsg` en el mismo contexto de usuario que ejecutará el Gateway o el wrapper.

<CardGroup cols={3}>
  <Card title="Acciones de la API privada" icon="wand-sparkles" href="#private-api-actions">
    Respuestas, tapbacks, efectos, encuestas, archivos adjuntos y administración de grupos.
  </Card>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los mensajes directos de iMessage usan de forma predeterminada el modo de emparejamiento.
  </Card>
  <Card title="Mac remoto" icon="terminal" href="#remote-mac-over-ssh">
    Utilice un wrapper SSH cuando el Gateway no se ejecute en el Mac de Mensajes.
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

        Cuando el asistente de configuración local detecta que falta el comando predeterminado `imsg`, puede solicitar la instalación de `steipete/tap/imsg` mediante Homebrew. Si detecta un `imsg` administrado mediante Homebrew, puede solicitar que se reinstale o actualice. Los wrappers personalizados de `cliPath` no se modifican.

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
    La mayoría de las configuraciones no necesitan SSH. Utilice esta topología solo cuando el Gateway no pueda ejecutarse en el Mac con la sesión de Mensajes iniciada. OpenClaw solo requiere un `cliPath` compatible con la entrada y salida estándar, por lo que puede configurar `cliPath` para que apunte a un script wrapper que se conecte mediante SSH a un Mac remoto y ejecute `imsg`.
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
      // Opcional: raíces adicionales permitidas para los archivos adjuntos (se combinan con la predeterminada
      // /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Si no se establece `remoteHost`, OpenClaw intenta detectarlo automáticamente analizando el script wrapper SSH.
    `remoteHost` debe ser `host` o `user@host` (sin espacios ni opciones de SSH); los valores no seguros se ignoran.
    OpenClaw utiliza una comprobación estricta de la clave de host para SCP, por lo que la clave del host de retransmisión ya debe existir en `~/.ssh/known_hosts`.
    Las rutas de los archivos adjuntos se validan respecto a las raíces permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Todo wrapper de `cliPath` o proxy SSH que se coloque delante de `imsg` DEBE comportarse como una canalización transparente de entrada y salida estándar para conexiones JSON-RPC de larga duración. OpenClaw intercambia pequeños mensajes JSON-RPC delimitados por saltos de línea mediante la entrada y salida estándar del wrapper durante toda la vida útil del canal:

- Reenvíe cada fragmento o línea de la entrada estándar **en cuanto haya bytes disponibles**; no espere al final del archivo.
- Reenvíe rápidamente cada fragmento o línea de la salida estándar en sentido inverso.
- Conserve los saltos de línea.
- Evite las lecturas bloqueantes de tamaño fijo (`read(4096)`, `cat | buffer`, `read` predeterminado del shell) que pueden privar de datos a las tramas pequeñas.
- Mantenga la salida de errores separada del flujo de salida estándar de JSON-RPC.

Un wrapper que almacene la entrada estándar en un búfer hasta llenar un bloque grande producirá síntomas similares a una interrupción de iMessage —`imsg rpc timeout (chats.list)` o reinicios repetidos del canal— aunque `imsg rpc` funcione correctamente. `ssh -T host imsg "$@"` (mostrado anteriormente) es seguro porque reenvía los argumentos de `cliPath` de OpenClaw, como `rpc` y `--db`. Las canalizaciones como `ssh host imsg | grep -v '^DEBUG'` NO son seguras: las herramientas con búfer por líneas aún pueden retener tramas; utilice `stdbuf -oL -eL` en cada etapa si es imprescindible aplicar un filtro.
</Warning>

  </Tab>
</Tabs>

## Requisitos y permisos (macOS)

- Debe haberse iniciado sesión en Mensajes en el Mac que ejecuta `imsg`.
- Se requiere acceso total al disco para el contexto del proceso que ejecuta OpenClaw/`imsg` (acceso a la base de datos de Mensajes).
- Se requiere permiso de automatización para enviar mensajes mediante Messages.app.
- Para las acciones avanzadas (reaccionar / editar / anular envío / respuesta en hilo / efectos / encuestas / operaciones de grupo), debe deshabilitarse la protección de integridad del sistema; consulte [Habilitación de la API privada de imsg](#enabling-the-imsg-private-api). El envío y la recepción básicos de texto y contenido multimedia funcionan sin deshabilitarla.

<Tip>
Los permisos se conceden por contexto de proceso. Si el Gateway se ejecuta sin interfaz (LaunchAgent/SSH), ejecute una vez un comando interactivo en ese mismo contexto para activar las solicitudes de permisos:

```bash
imsg chats --limit 1
# o
imsg send <handle> "prueba"
```

</Tip>

<Accordion title="Los envíos mediante el wrapper SSH fallan con AppleEvents -1743">
  Una configuración con SSH remoto puede leer chats, superar `channels status --probe` y procesar mensajes entrantes, mientras que los envíos salientes siguen fallando con un error de autorización de AppleEvents:

```text
No se permite enviar eventos de Apple a Mensajes. (-1743)
```

Compruebe la base de datos TCC del usuario con la sesión iniciada en el Mac o System Settings > Privacy & Security > Automation. Si la entrada de automatización está registrada para `/usr/libexec/sshd-keygen-wrapper` en lugar de para `imsg` o el proceso del shell local, es posible que macOS no muestre un control de Mensajes utilizable para ese cliente SSH del lado del servidor:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

En ese estado, repetir `tccutil reset AppleEvents` o volver a ejecutar `imsg send` mediante el mismo wrapper SSH puede seguir fallando porque el contexto del proceso que necesita la automatización de Mensajes es el wrapper SSH, no una aplicación a la que se pueda conceder el permiso desde la interfaz.

Utilice en su lugar uno de los contextos de proceso de `imsg` compatibles:

- Ejecute el Gateway, o al menos el puente `imsg`, en la sesión local del usuario con la sesión de Mensajes iniciada.
- Inicie el Gateway con un LaunchAgent para ese usuario después de conceder acceso total al disco y automatización desde la misma sesión.
- Si mantiene la topología SSH de dos usuarios, compruebe que un envío saliente real mediante `imsg send` se complete correctamente a través del wrapper exacto antes de habilitar el canal. Si no se le puede conceder automatización, reconfigure el sistema para usar una configuración de `imsg` con un único usuario en lugar de depender del wrapper SSH para los envíos.

</Accordion>

## Habilitación de la API privada de imsg

`imsg` se distribuye con dos modos operativos. Para OpenClaw, el modo de API privada es la configuración recomendada porque proporciona al canal las acciones nativas de iMessage que esperan los usuarios. El modo básico sigue siendo útil para instalaciones de bajo riesgo, la verificación inicial o hosts donde no se pueda deshabilitar SIP.

- **Modo básico** (predeterminado, no requiere cambios en SIP): envío de texto y contenido multimedia mediante `send`, supervisión e historial de mensajes entrantes y lista de chats. Esto es lo que se obtiene de inmediato con una instalación nueva de `brew install steipete/tap/imsg` y los permisos estándar de macOS indicados anteriormente.
- **Modo de API privada**: `imsg` inyecta una dylib auxiliar en `Messages.app` para invocar funciones internas de `IMCore`. Esto habilita `react`, `edit`, `unsend`, `reply` (en hilo), `sendWithEffect`, `poll` y `poll-vote` (encuestas nativas de Mensajes), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, además de indicadores de escritura y confirmaciones de lectura.

La superficie de acciones recomendada en esta página requiere el modo de API privada. El README de `imsg` indica explícitamente el requisito:

> Las funciones avanzadas, como `read`, `typing`, `launch`, el envío enriquecido respaldado por el puente, la modificación de mensajes y la administración de chats, son opcionales. Requieren que SIP esté deshabilitado y que se inyecte una dylib auxiliar en `Messages.app`. `imsg launch` rechaza la inyección cuando SIP está habilitado.

La técnica de inyección del auxiliar utiliza la propia dylib de `imsg` para acceder a las API privadas de Mensajes. No hay ningún servidor de terceros ni entorno de ejecución de BlueBubbles en la ruta de iMessage de OpenClaw.

<Warning>
**Deshabilitar SIP supone una contrapartida real de seguridad.** SIP es una de las protecciones fundamentales de macOS contra la ejecución de código del sistema modificado; deshabilitarla en todo el sistema aumenta la superficie de ataque y los posibles efectos secundarios. En particular, **deshabilitar SIP en los Mac con Apple Silicon también deshabilita la capacidad de instalar y ejecutar aplicaciones de iOS en el Mac**.

Considérelo una decisión operativa deliberada, especialmente en un Mac personal principal. Para usar iMessage con OpenClaw con calidad de producción, se recomienda un Mac dedicado o un usuario bot de macOS en el que resulte aceptable habilitar el puente. Si el modelo de amenazas no permite deshabilitar SIP en ningún equipo, la integración incluida de iMessage queda limitada al modo básico: solo envío y recepción de texto y contenido multimedia, sin reacciones / edición / anulación de envío / efectos / operaciones de grupo.
</Warning>

### Configuración

1. **Instale (o actualice) `imsg`** en el Mac que ejecuta Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   La salida de `imsg status --json` informa de `bridge_version`, `rpc_methods` y el valor de `selectors` de cada método para que pueda comprobar qué admite la compilación actual antes de comenzar.

2. **Desactive la Protección de Integridad del Sistema y, en versiones modernas de macOS, la validación de bibliotecas.** Inyectar una dylib auxiliar que no sea de Apple en el archivo `Messages.app` firmado por Apple requiere desactivar SIP **y** relajar la validación de bibliotecas. El paso de SIP en el modo de recuperación depende de la versión de macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** desactive la validación de bibliotecas mediante Terminal, reinicie en modo de recuperación, ejecute `csrutil disable` y reinicie.
   - **macOS 11+ (Big Sur y posteriores), Intel:** entre en modo de recuperación (o recuperación por Internet), ejecute `csrutil disable` y reinicie.
   - **macOS 11+, Apple Silicon:** use la secuencia de arranque con el botón de encendido para entrar en recuperación; en versiones recientes de macOS, mantenga pulsada la tecla **Left Shift** al hacer clic en Continue y, después, ejecute `csrutil disable`. Las configuraciones de máquinas virtuales siguen un flujo distinto, por lo que primero debe crear una instantánea de la máquina virtual.

   **En macOS 11 y versiones posteriores, `csrutil disable` por sí solo no suele ser suficiente.** Apple sigue aplicando la validación de bibliotecas a `Messages.app` como binario de plataforma, por lo que se rechaza un auxiliar con firma ad hoc (`Library Validation failed: ... platform binary, but mapped file is not`) incluso con SIP desactivado. Después de desactivar SIP, desactive también la validación de bibliotecas y reinicie:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), verificado en 26.5.1:** desactivar SIP **junto con** el comando `DisableLibraryValidation` anterior basta para inyectar el auxiliar desde 26.0 hasta 26.5.x. **No se requieren argumentos de arranque.** El plist es el factor decisivo y el paso que falta con mayor frecuencia cuando falla la inyección en Tahoe:
   - **Con el plist:** `imsg launch` realiza la inyección y `imsg status` informa de `advanced_features: true`.
   - **Sin el plist (incluso con SIP desactivado):** `imsg launch` falla con `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI rechaza el auxiliar con firma ad hoc al cargarlo, por lo que el puente nunca queda listo y el inicio agota el tiempo de espera. Ese tiempo de espera agotado es el síntoma que la mayoría de las personas encuentra en Tahoe; la solución es el plist anterior, no una medida más drástica.

   Si la inyección de `imsg launch` o funciones específicas de `selectors` empiezan a devolver falso después de una actualización de macOS, esta comprobación suele ser la causa. Compruebe el estado de SIP y de la validación de bibliotecas antes de asumir que ha fallado el propio paso de SIP. Si esos ajustes son correctos y el puente aún no puede realizar la inyección, recopile `imsg status --json` junto con la salida de `imsg launch` y notifíquelo al proyecto `imsg` en lugar de debilitar otros controles de seguridad de todo el sistema.

3. **Inyecte el auxiliar.** Con SIP desactivado y la sesión iniciada en Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` se niega a realizar la inyección si SIP sigue activado, por lo que esto también confirma que se ha completado el paso 2.

4. **Verifique el puente desde OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   La entrada de iMessage debe informar de `works`, y `imsg status --json | jq '{rpc_methods, selectors}'` debe mostrar las capacidades expuestas por su compilación de macOS. La creación de encuestas requiere `selectors.pollPayloadMessage`; votar requiere tanto `selectors.pollVoteMessage` como el método RPC `poll.vote`. El plugin de OpenClaw anuncia únicamente las acciones compatibles con la comprobación almacenada en caché, mientras que una caché vacía mantiene una actitud optimista y realiza la comprobación en el primer envío.

Si `openclaw channels status --probe` informa de que el canal está `works`, pero acciones específicas generan el error "iMessage `<action>` requiere el puente de API privada de imsg" en el momento del envío, vuelva a ejecutar `imsg launch`; el auxiliar puede dejar de estar inyectado (por un reinicio de Messages.app, una actualización del sistema operativo, etc.) y el estado `available: true` almacenado en caché seguirá anunciando acciones hasta que la siguiente comprobación lo actualice.

### Cuando SIP permanece activado

Si desactivar SIP no es aceptable para su modelo de amenazas:

- `imsg` recurre al modo básico: solo texto, contenido multimedia y recepción.
- El plugin de OpenClaw sigue anunciando el envío de texto y contenido multimedia, así como la supervisión de mensajes entrantes; oculta `react`, `edit`, `unsend`, `reply`, `sendWithEffect` y las operaciones de grupo en la superficie de acciones (según la comprobación de capacidades de cada método).
- Puede ejecutar un Mac independiente sin Apple Silicon (o un Mac dedicado al bot) con SIP desactivado para la carga de trabajo de iMessage, mientras mantiene SIP activado en sus dispositivos principales. Consulte [Usuario de macOS dedicado al bot (identidad de iMessage independiente)](#deployment-patterns) más adelante.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.imessage.dmPolicy` controla los mensajes directos:

    - `pairing` (valor predeterminado)
    - `allowlist` (requiere al menos una entrada `allowFrom`)
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    Campo de la lista de permitidos: `channels.imessage.allowFrom`.

    Las entradas de la lista de permitidos deben identificar a los remitentes: identificadores o grupos estáticos de acceso de remitentes (`accessGroup:<name>`). Use `channels.imessage.groupAllowFrom` para destinos de chat como `chat_id:*`, `chat_guid:*` o `chat_identifier:*`; use `channels.imessage.groups` para claves numéricas de registro `chat_id`.

  </Tab>

  <Tab title="Política de grupos y menciones">
    `channels.imessage.groupPolicy` controla la gestión de grupos:

    - `allowlist` (valor predeterminado)
    - `open`
    - `disabled`

    Lista de remitentes permitidos en grupos: `channels.imessage.groupAllowFrom`.

    Las entradas de `groupAllowFrom` también pueden hacer referencia a grupos estáticos de acceso de remitentes (`accessGroup:<name>`).

    Comportamiento alternativo en tiempo de ejecución: si `groupAllowFrom` no está definido, las comprobaciones de remitentes de grupos de iMessage usan `allowFrom`; defina `groupAllowFrom` cuando la admisión de mensajes directos y grupos deba ser diferente. Un `groupAllowFrom: []` explícitamente vacío no recurre al comportamiento alternativo: bloquea a todos los remitentes de grupos bajo `allowlist`.
    Nota sobre el tiempo de ejecución: si falta por completo `channels.imessage`, el tiempo de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (incluso si `channels.defaults.groupPolicy` está definido).

    <Warning>
    El enrutamiento de grupos bajo `groupPolicy: "allowlist"` ejecuta **dos** comprobaciones consecutivas:

    1. **Lista de remitentes permitidos** (`channels.imessage.groupAllowFrom`): identificador, `accessGroup:<name>`, `chat_guid`, `chat_identifier` o `chat_id`. Una lista efectiva vacía (sin `groupAllowFrom` ni comportamiento alternativo de `allowFrom`) bloquea a todos los remitentes de grupos.
    2. **Registro de grupos** (`channels.imessage.groups`): se aplica cuando el mapa contiene entradas; el chat debe coincidir con una entrada explícita por `chat_id` o con el comodín `groups: { "*": { ... } }`. Cuando `groups` está vacío o no existe, solo la lista de remitentes permitidos decide la admisión.

    Si no se configura ninguna lista efectiva de remitentes permitidos en grupos, todos los mensajes de grupo se descartan antes de la comprobación del registro. Cada comprobación tiene su propia señal de nivel `warn` en el nivel de registro predeterminado y cada una indica una solución diferente:

    - una vez por cuenta durante el inicio, cuando la lista efectiva de remitentes permitidos en grupos está vacía: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`; se corrige definiendo `channels.imessage.groupAllowFrom` (o `allowFrom`); añadir únicamente entradas de `groups` hace que la comprobación 1 siga bloqueando a todos los remitentes.
    - una vez por `chat_id` en tiempo de ejecución, cuando un remitente supera la comprobación 1, pero el chat no figura en un registro `groups` con entradas: `imessage: dropping group message from chat_id=<id> ...`; se corrige añadiendo ese `chat_id` (o `"*"`) bajo `channels.imessage.groups`.

    Los mensajes directos no se ven afectados: siguen una ruta de código diferente.

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

    `groupAllowFrom` por sí solo admite a esos remitentes en cualquier grupo; añada el bloque `groups` para limitar los chats permitidos (y definir opciones por chat como `requireMention`).
    </Warning>

    Comprobación de menciones en grupos:

    - iMessage no dispone de metadatos nativos de menciones
    - la detección de menciones usa patrones de expresiones regulares (`agents.entries.*.groupChat.mentionPatterns`, con `messages.groupChat.mentionPatterns` como alternativa)
    - sin patrones configurados, no se puede aplicar la comprobación de menciones
    - los comandos de control de remitentes autorizados omiten la comprobación de menciones

    `systemPrompt` por grupo:

    Cada entrada bajo `channels.imessage.groups.*` acepta una cadena `systemPrompt` opcional, que se inyecta en el prompt del sistema del agente en cada turno que gestione un mensaje de ese grupo. La resolución refleja `channels.whatsapp.groups`:

    1. **Prompt del sistema específico del grupo** (`groups["<chat_id>"].systemPrompt`): se usa cuando la entrada del grupo específico existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), se suprime el comodín y no se aplica ningún prompt del sistema a ese grupo.
    2. **Prompt del sistema comodín de grupos** (`groups["*"].systemPrompt`): se usa cuando la entrada del grupo específico está completamente ausente del mapa o cuando existe, pero no define ninguna clave `systemPrompt`.

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

    Los prompts por grupo solo se aplican a los mensajes de grupo; los mensajes directos no se ven afectados.

  </Tab>

  <Tab title="Sesiones y respuestas deterministas">
    - Los mensajes directos usan enrutamiento directo; los grupos usan enrutamiento de grupos.
    - Con el valor predeterminado `session.dmScope=main`, los mensajes directos de iMessage se agrupan en la sesión principal del agente.
    - Las sesiones de grupo están aisladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Las respuestas se devuelven a iMessage mediante los metadatos del canal y el destino de origen.

    Comportamiento de los hilos similares a grupos:

    Algunos hilos de iMessage con varios participantes pueden llegar con `is_group=false`.
    Si ese `chat_id` está configurado explícitamente bajo `channels.imessage.groups`, OpenClaw lo trata como tráfico de grupo (comprobaciones de grupo y aislamiento de la sesión de grupo).

  </Tab>
</Tabs>

## Vinculaciones de conversaciones ACP

Los chats de iMessage se pueden vincular a sesiones ACP.

Flujo rápido para operadores:

- Ejecute `/acp spawn codex --bind here` dentro del mensaje directo o del chat de grupo permitido.
- Los mensajes futuros de esa misma conversación de iMessage se enrutan a la sesión ACP iniciada.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada sin sustituirla.
- `/acp close` cierra la sesión ACP y elimina la vinculación.

Las vinculaciones persistentes configuradas usan entradas `bindings[]` de nivel superior con `type: "acp"` y `match.channel: "imessage"`.

`match.peer.id` puede usar:

- un identificador normalizado de mensaje directo como `+15555550123` o `user@example.com`
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

## Patrones de implementación

<AccordionGroup>
  <Accordion title="Usuario de macOS dedicado al bot (identidad de iMessage independiente)">
    Use un Apple ID y un usuario de macOS dedicados para aislar el tráfico del bot de su perfil personal de Messages.

    Flujo habitual:

    1. Cree/inicie sesión con un usuario dedicado de macOS.
    2. Inicie sesión en Messages con el Apple ID del bot en ese usuario.
    3. Instale `imsg` en ese usuario.
    4. Cree un contenedor SSH para que OpenClaw pueda ejecutar `imsg` en el contexto de ese usuario.
    5. Haga que `channels.imessage.accounts.<id>.cliPath` y `.dbPath` apunten a ese perfil de usuario.

    La primera ejecución puede requerir aprobaciones de la GUI (Automation + Full Disk Access) en la sesión de ese usuario del bot.

  </Accordion>

  <Accordion title="Mac remoto mediante Tailscale (ejemplo)">
    Topología habitual:

    - el gateway se ejecuta en Linux/VM
    - iMessage + `imsg` se ejecutan en un Mac de su tailnet
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
    Asegúrese primero de que la clave del host sea de confianza (por ejemplo, `ssh bot@mac-mini.tailnet-1234.ts.net`) para que se complete `known_hosts`.

  </Accordion>

  <Accordion title="Patrón de varias cuentas">
    iMessage admite configuración por cuenta en `channels.imessage.accounts`.

    Cada cuenta puede sobrescribir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, la configuración del historial y las listas de raíces permitidas para archivos adjuntos.

  </Accordion>

  <Accordion title="Historial de mensajes directos">
    Configure `channels.imessage.dmHistoryLimit` para inicializar las nuevas sesiones de mensajes directos con el historial reciente decodificado de `imsg` para esa conversación. Use `channels.imessage.dms["<sender>"].historyLimit` para sobrescrituras por remitente, incluido `0` para deshabilitar el historial de un remitente.

    El historial de mensajes directos de iMessage se obtiene bajo demanda desde `imsg`. Si `dmHistoryLimit` no está configurado, se deshabilita la inicialización global del historial de mensajes directos, pero un valor positivo de `channels.imessage.dms["<sender>"].historyLimit` por remitente sigue habilitando la inicialización para ese remitente.

  </Accordion>
</AccordionGroup>

## Contenido multimedia, fragmentación y destinos de entrega

<AccordionGroup>
  <Accordion title="Archivos adjuntos y contenido multimedia">
    - la ingesta de archivos adjuntos entrantes está **desactivada de forma predeterminada**; configure `channels.imessage.includeAttachments: true` para enviar fotos, notas de voz, vídeos y otros archivos adjuntos al agente. Si está deshabilitada, los iMessages que solo contienen archivos adjuntos se descartan antes de llegar al agente y es posible que no generen ninguna línea de registro `Inbound message`.
    - las rutas remotas de archivos adjuntos se pueden obtener mediante SCP cuando se configura `remoteHost`
    - las rutas de archivos adjuntos deben coincidir con las raíces permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - las raíces configuradas amplían el patrón de raíz predeterminado `/Users/*/Library/Messages/Attachments` (se combinan, no se sustituyen)
    - SCP usa una comprobación estricta de claves de host (`StrictHostKeyChecking=yes`)
    - el tamaño del contenido multimedia saliente usa `channels.imessage.mediaMaxMb` (valor predeterminado: 16 MB)

  </Accordion>

  <Accordion title="Texto saliente y fragmentación">
    - límite de fragmentos de texto: `channels.imessage.textChunkLimit` (valor predeterminado: 4000)
    - modo de fragmentación: `channels.imessage.streaming.chunkMode`
      - `length` (valor predeterminado)
      - `newline` (división prioritaria por párrafos)
    - la negrita, cursiva, el subrayado y tachado de Markdown saliente se convierten en texto con estilo nativo (los destinatarios con macOS 15+ ven el estilo; los destinatarios con versiones anteriores ven texto sin formato y sin los marcadores); las tablas de Markdown se convierten según el modo de tablas Markdown del canal
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
    - **react**: Añade/elimina reacciones rápidas de iMessage (`messageId`, `emoji`, `remove`). Las reacciones rápidas admitidas se corresponden con amor, me gusta, no me gusta, risa, énfasis y pregunta. Si se elimina sin un emoji, se borra cualquier reacción rápida configurada.
    - **reply**: Envía una respuesta en un hilo a un mensaje existente (`messageId`, `text` o `message`, además de `chatGuid`, `chatId`, `chatIdentifier` o `to`). Las respuestas con archivos adjuntos requieren además una compilación de `imsg` cuyo `send-rich` admita `--file`.
    - **sendWithEffect**: Envía texto con un efecto de iMessage (`text` o `message`, `effect` o `effectId`). Nombres cortos: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: Edita un mensaje enviado en las versiones compatibles de macOS/API privada (`messageId`, `text` o `newText`). Solo se pueden editar los mensajes que haya enviado el propio gateway.
    - **unsend**: Retira un mensaje enviado en las versiones compatibles de macOS/API privada (`messageId`). Solo se pueden retirar los mensajes que haya enviado el propio gateway.
    - **upload-file**: Envía contenido multimedia/archivos (`buffer` como base64 o un `media`/`path`/`filePath` preparado, `filename`, `asVoice` opcional). Alias heredado: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gestionan chats grupales cuando el destino actual es una conversación grupal. Estas acciones modifican la identidad de Messages del host, por lo que requieren un remitente propietario o un cliente Gateway `operator.admin`.
    - **poll**: Crea una encuesta nativa de Apple Messages (`pollQuestion`, `pollOption` repetido entre 2 y 12 veces, además de `chatGuid`, `chatId`, `chatIdentifier` o `to`). Los destinatarios con iOS/iPadOS/macOS 26+ pueden verla y votar de forma nativa; las versiones anteriores del sistema operativo reciben como alternativa el texto "Se envió una encuesta". Requiere `selectors.pollPayloadMessage`.
    - **poll-vote**: Vota en una encuesta existente (`pollId` o `messageId`, además de exactamente uno de `pollOptionIndex`, `pollOptionId` o `pollOptionText`). Requiere `selectors.pollVoteMessage` y el método RPC `poll.vote`.

    Las encuestas entrantes aceptadas se representan para el agente con la pregunta, las etiquetas numeradas de las opciones, los recuentos de votos y el ID del mensaje de la encuesta que necesita `poll-vote`.

  </Accordion>

  <Accordion title="ID de mensajes">
    El contexto entrante de iMessage incluye tanto valores cortos de `MessageSid` como GUID completos de mensajes (`MessageSidFull`) cuando están disponibles. Los ID cortos están limitados a la caché reciente de respuestas respaldada por SQLite y se comprueban con el chat actual antes de usarlos. Si un ID corto caduca, vuelva a intentarlo con su `MessageSidFull` y seleccione como destino la conversación que lo proporcionó. Los ID completos no omiten la vinculación con la conversación o la cuenta, por lo que debe sustituirse un ID de otro chat por uno del destino actual. Las llamadas remotas delegadas pueden rechazar ID completos obsoletos cuando no se dispone de evidencia de la conversación actual.

  </Accordion>

  <Accordion title="Detección de capacidades">
    OpenClaw oculta las acciones de la API privada únicamente cuando el estado de sondeo almacenado en caché indica que el puente no está disponible. Si el estado es desconocido, las acciones permanecen visibles y el envío realiza sondeos de forma diferida para que la primera acción pueda ejecutarse correctamente después de `imsg launch` sin actualizar manualmente el estado por separado.

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

    Las compilaciones antiguas de `imsg` anteriores a la lista de capacidades por método desactivan silenciosamente el indicador de escritura y las confirmaciones de lectura; OpenClaw registra una advertencia una sola vez por reinicio para poder atribuir la ausencia de la confirmación.

  </Accordion>

  <Accordion title="Reacciones rápidas entrantes">
    OpenClaw se suscribe a las reacciones rápidas de iMessage y enruta las reacciones aceptadas como eventos del sistema en lugar de texto de mensaje normal, por lo que la reacción rápida de un usuario no activa un bucle de respuesta ordinario.

    El modo de notificación se controla mediante `channels.imessage.reactionNotifications`:

    - `"own"` (valor predeterminado): notifica solo cuando los usuarios reaccionan a mensajes creados por el bot.
    - `"all"`: notifica todas las reacciones rápidas entrantes de remitentes autorizados.
    - `"off"`: ignora las reacciones rápidas entrantes.

    Las sobrescrituras por cuenta usan `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reacciones de aprobación (👍 / 👎)">
    Cuando `approvals.exec.enabled` o `approvals.plugin.enabled` es true y la solicitud se enruta a iMessage, el gateway entrega una solicitud de aprobación de forma nativa y acepta una reacción rápida para resolverla:

    - `👍` (reacción rápida de aprobación) → `allow-once`
    - `👎` (reacción rápida de desaprobación) → `deny`
    - `allow-always` sigue siendo una alternativa manual: envíe `/approve <id> allow-always` como respuesta normal.

    La gestión de reacciones requiere que el identificador del usuario que reacciona esté incluido explícitamente entre los aprobadores. La lista de aprobadores se lee desde `channels.imessage.allowFrom` (o `channels.imessage.accounts.<id>.allowFrom`); añada el número de teléfono del usuario en formato E.164 o el correo electrónico de su Apple ID (los destinos de chat como `chat_id:*` no son entradas válidas de aprobadores). Se admite la entrada comodín `"*"`, pero permite que cualquier remitente apruebe; una lista de aprobadores vacía deshabilita por completo el atajo de reacción. El atajo de reacción omite intencionadamente `reactionNotifications`, `dmPolicy` y `groupAllowFrom` porque la lista explícita de aprobadores permitidos es el único control relevante para resolver la aprobación.

    La autorización del comando de texto `/approve` sigue la misma lista: cuando `channels.imessage.allowFrom` no está vacío, `/approve <id> <decision>` se autoriza mediante esa lista de aprobadores (no mediante la lista permitida más amplia de mensajes directos), y los remitentes admitidos en la lista permitida de mensajes directos pero no incluidos en `allowFrom` reciben una denegación explícita. Cuando `allowFrom` está vacío, se mantiene la alternativa del mismo chat y `/approve` autoriza a cualquiera que permita la lista de mensajes directos. Añada a `allowFrom` todos los operadores que deban poder aprobar, ya sea mediante `/approve` o mediante reacciones.

    Notas para operadores:
    - La vinculación de la reacción se almacena tanto en memoria como en el almacén persistente con claves del Gateway (con el TTL ajustado al vencimiento de la aprobación), y el Gateway también sondea las solicitudes pendientes para detectar tapbacks, por lo que un tapback que llegue poco después de reiniciar el Gateway seguirá resolviendo la aprobación.
    - El tapback `is_from_me=true` del propio operador (por ejemplo, desde un dispositivo Apple enlazado) resuelve la aprobación cuando ese identificador es un aprobador explícito.
    - Las solicitudes de aprobación solo se enrutan a una conversación grupal cuando se configuran aprobadores explícitos; de lo contrario, cualquier miembro del grupo podría aprobar.
    - Los tapbacks heredados con formato de texto (`Liked "…"` en texto sin formato de clientes Apple muy antiguos) no pueden resolver aprobaciones porque no incluyen ningún GUID de mensaje; la resolución mediante reacciones requiere los metadatos estructurados de tapback que emiten los clientes actuales de macOS/iOS.

  </Accordion>

  <Accordion title="Reacciones a preguntas (1️⃣ / 2️⃣ / 3️⃣ / 4️⃣)">
    Para una solicitud `ask_user` con una pregunta no secreta, de selección única y entre una y cuatro opciones, OpenClaw añade opciones con emojis numerados. Reaccione a la solicitud entregada con el número correspondiente para responderla. La reacción debe incluir el GUID estable del mensaje creado por el bot; OpenClaw asigna entonces el número a la opción canónica a través del Gateway. Los toques obsoletos o duplicados se ignoran.

    Las solicitudes con varias preguntas, selección múltiple o texto libre siguen admitiendo únicamente respuestas de texto. Las reacciones a preguntas siguen las reglas normales de admisión de mensajes directos y grupos de iMessage. Se reconocen incluso cuando el valor general `reactionNotifications` es `"off"`, sin convertir reacciones no relacionadas en eventos del agente.

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

## Fusión de mensajes directos divididos al enviarse (comando + URL en una composición)

Cuando una persona escribe conjuntamente un comando y una URL —por ejemplo, `Dump https://example.com/article`—, la aplicación Mensajes de Apple divide el envío en **dos filas `chat.db` independientes**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa de OG como archivos adjuntos.

En la mayoría de las configuraciones, las dos filas llegan a OpenClaw con una diferencia de ~0.8-2.0 s. Sin la fusión, el agente recibe únicamente el comando en el turno 1 (y suele responder «envíeme la URL») antes de que la URL llegue en el turno 2. Esto se debe al pipeline de envío de Apple, no a nada que introduzcan OpenClaw o `imsg`.

`channels.imessage.coalesceSameSenderDms` habilita en los mensajes directos el almacenamiento temporal de filas consecutivas del mismo remitente. Cuando `imsg` expone el marcador estructural de vista previa de URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` en una de las filas de origen, OpenClaw fusiona únicamente ese envío dividido real y mantiene cualquier otra fila almacenada como un turno independiente. En compilaciones antiguas de `imsg` que no emiten ningún metadato de globo, OpenClaw no puede distinguir un envío dividido de varios envíos independientes, por lo que recurre a fusionar el grupo. Esto conserva el comportamiento anterior a los metadatos, en lugar de provocar que los envíos divididos `Dump <url>` retrocedan a dos turnos. Los chats grupales siguen procesándose mensaje por mensaje para conservar la estructura de turnos con varios usuarios.

<Tabs>
  <Tab title="Cuándo habilitarlo">
    Habilítelo cuando:

    - Distribuya Skills que esperen `command + payload` en un solo mensaje (volcar, pegar, guardar, poner en cola, etc.).
    - Los usuarios peguen URL junto con comandos.
    - Pueda aceptar la latencia adicional de los turnos de mensajes directos (consulte la información siguiente).

    Déjelo deshabilitado cuando:

    - Necesite la latencia mínima de los comandos para activadores de una sola palabra en mensajes directos.
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

    Con la marca activada y sin un valor explícito de `messages.inbound.byChannel.imessage` ni uno global de `messages.inbound.debounceMs`, la ventana de antirrebote se amplía a **7000 ms** (el valor predeterminado heredado es 0 ms, es decir, sin antirrebote). La ventana más amplia es necesaria porque el intervalo de los envíos divididos de vistas previas de URL de Apple puede prolongarse varios segundos mientras Messages.app emite la fila de vista previa.

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
    - **La fusión precisa necesita metadatos actuales de la carga útil de `imsg`.** Cuando `balloon_bundle_id` está presente, solo se fusiona el envío dividido real; la fusión alternativa sin metadatos descrita anteriormente ofrece compatibilidad provisional con versiones anteriores y se eliminará cuando `imsg` fusione los envíos divididos en el nivel superior.
    - **Latencia adicional para los mensajes directos.** Con la marca activada, cada mensaje directo (incluidos los comandos de control independientes y los mensajes posteriores de un solo texto) espera hasta que venza la ventana de antirrebote antes de procesarse, por si llega una fila de vista previa de URL. Los mensajes de chats grupales siguen procesándose al instante.
    - **El resultado fusionado está limitado.** El texto fusionado se limita a 4000 caracteres, con un marcador `…[truncated]` explícito; los archivos adjuntos, a 20; y las entradas de origen, a 10 (si se supera ese límite, se conservan la primera y las más recientes). Cada GUID de origen se registra en `coalescedMessageGuids` para la telemetría posterior.
    - **Solo para mensajes directos.** Los chats grupales se procesan mensaje por mensaje para que el bot siga respondiendo cuando escriben varias personas.
    - **Habilitación voluntaria por canal.** Los demás canales (Discord, Slack, Telegram, WhatsApp, …) no se ven afectados. Las configuraciones heredadas de BlueBubbles que establezcan `channels.bluebubbles.coalesceSameSenderDms` deben migrar ese valor a `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Situaciones y lo que ve el agente

La columna «Marca activada» muestra el comportamiento en una compilación `imsg` que emite `balloon_bundle_id`. En compilaciones antiguas de `imsg` que no emiten ningún metadato de globo, las filas marcadas a continuación como «Dos turnos»/«N turnos» recurren en su lugar a una fusión heredada (un turno): OpenClaw no puede distinguir estructuralmente un envío dividido de varios envíos independientes, por lo que conserva la fusión anterior a los metadatos. La separación precisa se activa cuando la compilación empieza a emitir metadatos de globo.

| Composición del usuario                                                      | Resultado de `chat.db`                  | Marca desactivada (valor predeterminado)                      | Marca activada + ventana (imsg emite metadatos de globo)                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (un envío)                              | 2 filas con una diferencia de ~1 s                   | Dos turnos del agente: «Dump» por separado y después la URL | Un turno: texto fusionado `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (archivo adjunto + texto)                | 2 filas sin metadatos de globo de URL | Dos turnos                               | Dos turnos después de observarse metadatos; un turno fusionado en sesiones antiguas o anteriores al establecimiento sin metadatos       |
| `/status` (comando independiente)                                     | 1 fila                               | Procesamiento instantáneo                        | **Espera hasta que venza la ventana y después se procesa**                                                                |
| URL pegada por separado                                                   | 1 fila                               | Procesamiento instantáneo                        | Espera hasta que venza la ventana y después se procesa                                                                    |
| Texto + URL enviados como dos mensajes independientes deliberados, con varios minutos de diferencia | 2 filas fuera de la ventana               | Dos turnos                               | Dos turnos (la ventana vence entre ambos)                                                             |
| Ráfaga rápida (>10 mensajes directos pequeños dentro de la ventana)                          | N filas sin metadatos de globo de URL | N turnos                                 | N turnos después de observarse metadatos; un turno fusionado y limitado en sesiones antiguas o anteriores al establecimiento sin metadatos |
| Dos personas escribiendo en un chat grupal                                  | N filas de M remitentes               | M+ turnos (uno por grupo de remitente)        | M+ turnos: los chats grupales no se fusionan                                                            |

## Recuperación de entradas tras reiniciar un puente o el Gateway

iMessage recupera los mensajes perdidos mientras el Gateway estaba inactivo y, al mismo tiempo, suprime la «bomba de mensajes pendientes» obsoletos que Apple puede enviar tras una recuperación de Push. El comportamiento predeterminado está siempre activado y se basa en una entrada duradera y un límite de antigüedad.

- **Protección duradera contra repeticiones.** Antes de avanzar el cursor de recuperación, OpenClaw registra cada fila sin procesar en la cola de entrada compartida de SQLite utilizando su GUID de Apple como identificador del evento. Una fila completada conserva una lápida durante unas 4 horas, con un límite de 10,000 entradas, de modo que una repetición con el mismo GUID se descarta incluso después de un reinicio. Una fila pendiente sigue siendo recuperable hasta que el procesamiento la adopta.
- **Recuperación tras una interrupción.** Al iniciarse, el monitor recuerda el rowid de la última fila `chat.db` admitida de forma duradera (un cursor persistente por cuenta) y se lo pasa a `imsg watch.subscribe` como `since_rowid`, para que imsg reproduzca las filas que todavía no se habían registrado y después siga los eventos en directo. Las filas registradas antes de un fallo se reanudan desde SQLite. La reproducción se limita a las 500 filas más recientes y a mensajes con una antigüedad máxima aproximada de 2 horas; las lápidas de GUID descartan todo lo que ya se haya gestionado.
- **Límite de antigüedad de los mensajes pendientes obsoletos.** Las filas posteriores al límite de inicio son realmente eventos en directo; si la fecha de envío de una fila precede su llegada en más de ~15 minutos, se considera parte de los mensajes pendientes enviados por Push y se suprime. Las filas reproducidas (en el límite o antes de él) usan en cambio la ventana de recuperación más amplia, por lo que se entrega un mensaje perdido recientemente, pero no el historial antiguo.

La recuperación funciona tanto en configuraciones locales como remotas de `cliPath`, porque la reproducción de `since_rowid` se ejecuta mediante la misma conexión RPC de `imsg`. La diferencia es la ventana: cuando el Gateway puede leer `chat.db` (localmente), fija el límite del rowid de inicio, limita el intervalo de reproducción y entrega mensajes perdidos con una antigüedad de hasta un par de horas. Mediante una conexión SSH remota de `cliPath` no puede leer la base de datos, por lo que la reproducción no tiene límite y todas las filas usan el límite de antigüedad en directo: sigue recuperando mensajes perdidos recientemente y suprimiendo los mensajes pendientes antiguos, pero con la ventana en directo más estrecha. Ejecute el Gateway en el Mac que aloja Mensajes para disponer de una ventana de recuperación más amplia.

### Señal visible para el operador

Los mensajes pendientes suprimidos se registran en el nivel predeterminado y nunca se descartan silenciosamente (la marca `recovery` muestra qué ventana se aplicó):

```text
imessage: mensajes pendientes de entrada obsoletos suprimidos account=<id> sent=<iso> recovery=<bool> (<N> suprimidos desde el inicio)
```

### Migración

`channels.imessage.catchup.*` está obsoleto: la recuperación tras interrupciones es automática y no necesita configuración en instalaciones nuevas. Las configuraciones existentes con `catchup.enabled: true` siguen respetándose como perfil de compatibilidad para la ventana de reproducción de recuperación. Los bloques de recuperación deshabilitados (`enabled: false` o sin `enabled: true`) se han retirado; `openclaw doctor --fix` los elimina.

## Solución de problemas

<AccordionGroup>
  <Accordion title="No se encuentra imsg o no se admite RPC">
    Valide el binario y la compatibilidad con RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Si el sondeo indica que RPC no es compatible, actualice `imsg`. Si las acciones de la API privada no están disponibles, ejecute `imsg launch` en la sesión del usuario de macOS que ha iniciado sesión y vuelva a realizar el sondeo. Si el Gateway no se está ejecutando en macOS, use la configuración de Mac remoto mediante SSH indicada anteriormente en lugar de la ruta local predeterminada `imsg`.

  </Accordion>

  <Accordion title="Los mensajes se envían, pero los iMessages entrantes no llegan">
    Primero compruebe si el mensaje llegó al Mac local. Si `chat.db` no cambia, OpenClaw no puede recibir el mensaje aunque `imsg status --json` indique que el puente está en buen estado.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Si los mensajes enviados desde el teléfono no crean filas nuevas, repare la capa de Mensajes y Apple Push de macOS antes de cambiar la configuración de OpenClaw. Una actualización puntual de los servicios suele ser suficiente:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Envíe un iMessage nuevo desde el teléfono y confirme que haya una fila `chat.db` nueva o un evento `imsg watch` antes de depurar las sesiones de OpenClaw. No ejecute esto como un bucle periódico de reinicio del puente; la repetición de `imsg launch` junto con reinicios del Gateway durante el trabajo activo puede interrumpir las entregas y dejar bloqueadas las ejecuciones del canal en curso.

  </Accordion>

  <Accordion title="El Gateway no se está ejecutando en macOS">
    El `cliPath: "imsg"` predeterminado debe ejecutarse en el Mac que tiene iniciada la sesión de Mensajes. En Linux o Windows, establezca `channels.imessage.cliPath` en un script contenedor que se conecte mediante SSH a ese Mac y ejecute `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    A continuación, ejecute:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="Se ignoran los mensajes directos">
    Compruebe:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprobaciones de emparejamiento (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Se ignoran los mensajes de grupo">
    Compruebe:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamiento de la lista de permitidos de `channels.imessage.groups`
    - configuración de patrones de mención (`agents.entries.*.groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Los archivos adjuntos remotos fallan">
    Compruebe:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticación mediante clave SSH/SCP desde el host del Gateway
    - que la clave del host exista en `~/.ssh/known_hosts` en el host del Gateway
    - legibilidad de la ruta remota en el Mac que ejecuta Mensajes

  </Accordion>

  <Accordion title="Se omitieron las solicitudes de permisos de macOS">
    Vuelva a ejecutar los comandos en un terminal gráfico interactivo en el mismo contexto de usuario y sesión, y apruebe las solicitudes:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirme que se hayan concedido Acceso total al disco y Automatización para el contexto del proceso que ejecuta OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Referencias de configuración

- [Referencia de configuración: iMessage](/es/gateway/config-channels#imessage)
- [Configuración del Gateway](/es/gateway/configuration)
- [Emparejamiento](/es/channels/pairing)

## Temas relacionados

- [Descripción general de los canales](/es/channels) — todos los canales compatibles
- [Eliminación de BlueBubbles y la ruta de iMessage mediante imsg](/es/announcements/bluebubbles-imessage) — anuncio y resumen de la migración
- [Migración desde BlueBubbles](/es/channels/imessage-from-bluebubbles) — tabla de traducción de la configuración y transición paso a paso
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de los chats grupales y control mediante menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo
