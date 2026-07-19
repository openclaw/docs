---
read_when:
    - Configuración de la compatibilidad con iMessage
    - Depuración del envío y la recepción de iMessage
summary: Compatibilidad nativa con iMessage mediante imsg (JSON-RPC a través de stdio), con acciones de API privada para respuestas, reacciones Tapback, efectos, encuestas, archivos adjuntos y gestión de grupos. Es la opción preferida para las nuevas configuraciones de iMessage en OpenClaw cuando se cumplen los requisitos del host.
title: iMessage
x-i18n:
    generated_at: "2026-07-19T01:46:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 215364b4a0424db3fccb27e29815f2a94c55ebe66d1eec21ed85e4b7947ea1ab
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para la implementación habitual de iMessage con OpenClaw, ejecute el Gateway y `imsg` en el mismo host macOS con una sesión iniciada en Mensajes. Si el Gateway se ejecuta en otro lugar, configure `channels.imessage.cliPath` para que apunte a un envoltorio SSH transparente que ejecute `imsg` en el Mac.

**La recuperación de mensajes entrantes es automática.** Tras reiniciar un puente o el Gateway, iMessage reproduce los mensajes que se perdieron mientras estaba inactivo y suprime la antigua «avalancha de mensajes pendientes» que Apple puede enviar después de una recuperación de Push, eliminando duplicados para que nada se procese dos veces. No hay ninguna configuración que habilitar; consulte [Recuperación de mensajes entrantes tras reiniciar un puente o el Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Se eliminó la compatibilidad con BlueBubbles. Migre las configuraciones de `channels.bluebubbles` a `channels.imessage`; OpenClaw solo admite iMessage mediante `imsg`. Consulte primero [Eliminación de BlueBubbles y la ruta de iMessage mediante imsg](/es/announcements/bluebubbles-imessage) para ver el anuncio breve, o [Migración desde BlueBubbles](/es/channels/imessage-from-bluebubbles) para ver la tabla completa de migración.
</Warning>

Estado: integración nativa con una CLI externa. El Gateway inicia `imsg rpc` y se comunica mediante JSON-RPC a través de la entrada y salida estándar, sin un daemon ni un puerto independientes. Se recomienda encarecidamente el modo de API privada para disponer de un canal de iMessage completo; las respuestas, reacciones tapback, efectos, encuestas, respuestas a archivos adjuntos y acciones de grupo requieren `imsg launch` y una comprobación correcta de la API privada.

Para la configuración local habitual, el asistente de configuración de OpenClaw puede ofrecer, previa confirmación del usuario, instalar o actualizar `imsg` mediante Homebrew en el Mac con la sesión de Mensajes iniciada. La configuración manual y las topologías con envoltorios SSH siguen estando a cargo del operador: instale o actualice `imsg` en el mismo contexto de usuario que ejecutará el Gateway o el envoltorio.

<CardGroup cols={3}>
  <Card title="Acciones de la API privada" icon="wand-sparkles" href="#private-api-actions">
    Respuestas, reacciones tapback, efectos, encuestas, archivos adjuntos y gestión de grupos.
  </Card>
  <Card title="Emparejamiento" icon="link" href="/es/channels/pairing">
    Los mensajes directos de iMessage usan de forma predeterminada el modo de emparejamiento.
  </Card>
  <Card title="Mac remoto" icon="terminal" href="#remote-mac-over-ssh">
    Utilice un envoltorio SSH cuando el Gateway no se ejecute en el Mac de Mensajes.
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

        Cuando el asistente de configuración local detecta que falta el comando predeterminado `imsg`, puede solicitar que se instale `steipete/tap/imsg` mediante Homebrew. Si detecta una instalación de `imsg` gestionada por Homebrew, puede solicitar que se reinstale o actualice. Los envoltorios personalizados de `cliPath` no se modifican.

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
    La mayoría de las configuraciones no necesitan SSH. Utilice esta topología únicamente cuando el Gateway no pueda ejecutarse en el Mac con la sesión de Mensajes iniciada. OpenClaw solo requiere un `cliPath` compatible con la entrada y salida estándar, por lo que puede configurar `cliPath` para que apunte a un script envoltorio que se conecte mediante SSH a un Mac remoto y ejecute `imsg`.
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
      // Opcional: raíces adicionales permitidas para archivos adjuntos (se combinan con la predeterminada
      // /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Si `remoteHost` no está establecido, OpenClaw intenta detectarlo automáticamente analizando el script envoltorio SSH.
    `remoteHost` debe ser `host` o `user@host` (sin espacios ni opciones SSH); los valores no seguros se ignoran.
    OpenClaw utiliza una comprobación estricta de la clave del host para SCP, por lo que la clave del host de retransmisión ya debe existir en `~/.ssh/known_hosts`.
    Las rutas de los archivos adjuntos se validan con respecto a las raíces permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Cualquier envoltorio de `cliPath` o proxy SSH que coloque delante de `imsg` DEBE comportarse como una canalización transparente de entrada y salida estándar para una conexión JSON-RPC de larga duración. OpenClaw intercambia pequeños mensajes JSON-RPC delimitados por saltos de línea mediante la entrada y salida estándar del envoltorio durante toda la vida útil del canal:

- Reenvíe cada fragmento o línea de la entrada estándar **en cuanto haya bytes disponibles**; no espere al fin del archivo.
- Reenvíe sin demora cada fragmento o línea de la salida estándar en la dirección inversa.
- Conserve los saltos de línea.
- Evite las lecturas bloqueantes de tamaño fijo (`read(4096)`, `cat | buffer`, el `read` predeterminado del shell), que pueden impedir el procesamiento de tramas pequeñas.
- Mantenga la salida de errores separada del flujo de salida estándar de JSON-RPC.

Un envoltorio que almacene la entrada estándar en un búfer hasta que se llene un bloque grande producirá síntomas que parecen una interrupción de iMessage —`imsg rpc timeout (chats.list)` o reinicios repetidos del canal— aunque `imsg rpc` funcione correctamente. `ssh -T host imsg "$@"` (mostrado anteriormente) es seguro porque reenvía los argumentos de `cliPath` de OpenClaw, como `rpc` y `--db`. Las canalizaciones como `ssh host imsg | grep -v '^DEBUG'` NO lo son: las herramientas con búfer por líneas aún pueden retener tramas; utilice `stdbuf -oL -eL` en cada etapa si debe aplicar un filtro.
</Warning>

  </Tab>
</Tabs>

## Requisitos y permisos (macOS)

- Debe haber una sesión iniciada en Mensajes en el Mac que ejecute `imsg`.
- Se requiere acceso total al disco para el contexto de proceso que ejecute OpenClaw/`imsg` (acceso a la base de datos de Mensajes).
- Se requiere permiso de automatización para enviar mensajes mediante Messages.app.
- Para las acciones avanzadas (reaccionar, editar, anular envío, respuesta en hilo, efectos, encuestas y operaciones de grupo), debe deshabilitarse la Protección de integridad del sistema; consulte [Habilitación de la API privada de imsg](#enabling-the-imsg-private-api). El envío y la recepción básicos de texto y contenido multimedia funcionan sin deshabilitarla.

<Tip>
Los permisos se conceden por contexto de proceso. Si el Gateway se ejecuta sin interfaz gráfica (LaunchAgent/SSH), ejecute una vez un comando interactivo en ese mismo contexto para activar las solicitudes de permisos:

```bash
imsg chats --limit 1
# o
imsg send <handle> "prueba"
```

</Tip>

<Accordion title="Los envíos mediante el envoltorio SSH fallan con AppleEvents -1743">
  Una configuración con SSH remoto puede leer chats, superar `channels status --probe` y procesar mensajes entrantes mientras los envíos salientes siguen fallando con un error de autorización de AppleEvents:

```text
No se permite enviar eventos de Apple a Mensajes. (-1743)
```

Compruebe la base de datos TCC del usuario con sesión iniciada en el Mac o System Settings > Privacy & Security > Automation. Si la entrada de automatización está registrada para `/usr/libexec/sshd-keygen-wrapper` en lugar del proceso `imsg` o del shell local, es posible que macOS no muestre un control utilizable de Mensajes para ese cliente del servidor SSH:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

En ese estado, repetir `tccutil reset AppleEvents` o volver a ejecutar `imsg send` mediante el mismo envoltorio SSH puede seguir fallando porque el contexto de proceso que necesita la automatización de Mensajes es el envoltorio SSH, no una aplicación a la que la interfaz pueda concedérsela.

Utilice en su lugar uno de los contextos de proceso de `imsg` compatibles:

- Ejecute el Gateway, o al menos el puente `imsg`, en la sesión local del usuario que haya iniciado sesión en Mensajes.
- Inicie el Gateway con un LaunchAgent para ese usuario después de conceder acceso total al disco y automatización desde la misma sesión.
- Si mantiene la topología SSH con dos usuarios, compruebe que un envío saliente real mediante `imsg send` se realice correctamente a través del envoltorio exacto antes de habilitar el canal. Si no se le puede conceder automatización, reconfigure el sistema con una configuración de `imsg` de un solo usuario en lugar de depender del envoltorio SSH para los envíos.

</Accordion>

## Habilitación de la API privada de imsg

`imsg` se distribuye con dos modos operativos. Para OpenClaw, el modo de API privada es la configuración recomendada porque proporciona al canal las acciones nativas de iMessage que los usuarios esperan. El modo básico sigue siendo útil para instalaciones de bajo riesgo, la verificación inicial o hosts donde no se pueda deshabilitar SIP.

- **Modo básico** (predeterminado, no requiere cambios en SIP): envío de texto y contenido multimedia mediante `send`, supervisión e historial de mensajes entrantes y lista de chats. Esto es lo que se obtiene de forma predeterminada con una instalación nueva de `brew install steipete/tap/imsg` y los permisos estándar de macOS indicados anteriormente.
- **Modo de API privada**: `imsg` inyecta una biblioteca auxiliar dylib en `Messages.app` para llamar a funciones internas de `IMCore`. Esto habilita `react`, `edit`, `unsend`, `reply` (en hilo), `sendWithEffect`, `poll` y `poll-vote` (encuestas nativas de Mensajes), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, además de indicadores de escritura y confirmaciones de lectura.

La superficie de acciones recomendada en esta página requiere el modo de API privada. El archivo README de `imsg` especifica claramente el requisito:

> Las funciones avanzadas, como `read`, `typing`, `launch`, el envío enriquecido respaldado por el puente, la modificación de mensajes y la gestión de chats, son opcionales. Requieren que SIP esté deshabilitado y que se inyecte una biblioteca auxiliar dylib en `Messages.app`. `imsg launch` rechaza la inyección cuando SIP está habilitado.

La técnica de inyección de la biblioteca auxiliar utiliza la propia dylib de `imsg` para acceder a las API privadas de Mensajes. No hay ningún servidor de terceros ni entorno de ejecución de BlueBubbles en la ruta de iMessage de OpenClaw.

<Warning>
**Deshabilitar SIP supone una contrapartida real de seguridad.** SIP es una de las protecciones principales de macOS contra la ejecución de código del sistema modificado; deshabilitarlo en todo el sistema aumenta la superficie de ataque y puede provocar efectos secundarios. En particular, **deshabilitar SIP en los Mac con Apple Silicon también deshabilita la capacidad de instalar y ejecutar aplicaciones de iOS en el Mac**.

Considere esta una decisión operativa deliberada, especialmente en un Mac personal principal. Para usar iMessage con OpenClaw con calidad de producción, se recomienda un Mac dedicado o un usuario bot de macOS en el que resulte aceptable habilitar el puente. Si el modelo de amenazas no permite que SIP esté deshabilitado en ningún equipo, la integración de iMessage incluida queda limitada al modo básico: solo envío y recepción de texto y contenido multimedia, sin reacciones, edición, anulación de envío, efectos ni operaciones de grupo.
</Warning>

### Configuración

1. **Instale (o actualice) `imsg`** en el Mac que ejecuta Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   La salida de `imsg status --json` informa de `bridge_version`, `rpc_methods` y `selectors` por método, para que se pueda comprobar qué admite la compilación actual antes de comenzar.

2. **Desactive System Integrity Protection y, en versiones modernas de macOS, Library Validation.** Inyectar una dylib auxiliar que no sea de Apple en el archivo firmado por Apple `Messages.app` requiere desactivar SIP **y** relajar la validación de bibliotecas. El paso de SIP en el modo de recuperación depende de la versión de macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** desactive Library Validation mediante Terminal, reinicie en Recovery Mode, ejecute `csrutil disable` y reinicie.
   - **macOS 11+ (Big Sur y posteriores), Intel:** acceda a Recovery Mode (o Internet Recovery), ejecute `csrutil disable` y reinicie.
   - **macOS 11+, Apple Silicon:** use la secuencia de arranque mediante el botón de encendido para acceder a Recovery; en versiones recientes de macOS, mantenga pulsada la tecla **Left Shift** al hacer clic en Continue y, a continuación, ejecute `csrutil disable`. Las configuraciones de máquinas virtuales siguen un flujo distinto, por lo que primero debe crear una instantánea de la VM.

   **En macOS 11 y posteriores, `csrutil disable` por sí solo no suele ser suficiente.** Apple sigue aplicando la validación de bibliotecas a `Messages.app` como binario de plataforma, por lo que se rechaza un auxiliar firmado de forma ad hoc (`Library Validation failed: ... platform binary, but mapped file is not`) incluso con SIP desactivado. Después de desactivar SIP, desactive también la validación de bibliotecas y reinicie:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), verificado en 26.5.1:** desactivar SIP **junto con** el comando `DisableLibraryValidation` anterior es suficiente para inyectar el auxiliar en las versiones 26.0 a 26.5.x. **No se requieren argumentos de arranque.** El plist es el factor decisivo y el paso que falta con mayor frecuencia cuando falla la inyección en Tahoe:
   - **Con el plist:** `imsg launch` realiza la inyección y `imsg status` informa de `advanced_features: true`.
   - **Sin el plist (incluso con SIP desactivado):** `imsg launch` falla con `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI rechaza el auxiliar ad hoc al cargarlo, por lo que el puente nunca queda listo y el inicio agota el tiempo de espera. Ese tiempo de espera agotado es el síntoma que encuentra la mayoría de las personas en Tahoe; la solución es el plist anterior, no una medida más drástica.

   Si la inyección de `imsg launch` o determinados `selectors` comienzan a devolver false después de una actualización de macOS, esta comprobación suele ser la causa. Compruebe el estado de SIP y de la validación de bibliotecas antes de asumir que el propio paso de SIP ha fallado. Si esos ajustes son correctos y el puente sigue sin poder realizar la inyección, recopile `imsg status --json` junto con la salida de `imsg launch` e informe de ello al proyecto `imsg`, en lugar de debilitar otros controles de seguridad de todo el sistema.

3. **Inyecte el auxiliar.** Con SIP desactivado y la sesión iniciada en Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` se niega a realizar la inyección si SIP sigue activado, por lo que esto también sirve para confirmar que se ha realizado el paso 2.

4. **Verifique el puente desde OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   La entrada de iMessage debería informar de `works`, y `imsg status --json | jq '{rpc_methods, selectors}'` debería mostrar las capacidades expuestas por su compilación de macOS. La creación de encuestas requiere `selectors.pollPayloadMessage`; la votación requiere tanto `selectors.pollVoteMessage` como el método RPC `poll.vote`. El plugin de OpenClaw anuncia únicamente las acciones compatibles con la comprobación almacenada en caché, mientras que una caché vacía mantiene una postura optimista y realiza la comprobación en el primer envío.

Si `openclaw channels status --probe` indica que el canal está `works`, pero determinadas acciones generan el error "iMessage `<action>` requires the imsg private API bridge" en el momento del envío, vuelva a ejecutar `imsg launch`: el auxiliar puede desconectarse (por un reinicio de Messages.app, una actualización del sistema operativo, etc.) y el estado `available: true` almacenado en caché seguirá anunciando acciones hasta que la siguiente comprobación lo actualice.

### Cuando SIP permanece activado

Si desactivar SIP no es aceptable para su modelo de amenazas:

- `imsg` vuelve al modo básico: solo texto, contenido multimedia y recepción.
- El plugin de OpenClaw sigue anunciando el envío de texto/contenido multimedia y la supervisión de mensajes entrantes; oculta `react`, `edit`, `unsend`, `reply`, `sendWithEffect` y las operaciones de grupo de la superficie de acciones (según la comprobación de capacidades de cada método).
- Puede ejecutar un Mac independiente que no utilice Apple Silicon (o un Mac dedicado al bot) con SIP desactivado para la carga de trabajo de iMessage y mantener SIP activado en sus dispositivos principales. Consulte [Usuario de macOS dedicado al bot (identidad de iMessage independiente)](#deployment-patterns) más adelante.

## Control de acceso y enrutamiento

<Tabs>
  <Tab title="Política de mensajes directos">
    `channels.imessage.dmPolicy` controla los mensajes directos:

    - `pairing` (predeterminado)
    - `allowlist` (requiere al menos una entrada de `allowFrom`)
    - `open` (requiere que `allowFrom` incluya `"*"`)
    - `disabled`

    Campo de lista de permitidos: `channels.imessage.allowFrom`.

    Las entradas de la lista de permitidos deben identificar a los remitentes: identificadores o grupos estáticos de acceso de remitentes (`accessGroup:<name>`). Use `channels.imessage.groupAllowFrom` para destinos de chat como `chat_id:*`, `chat_guid:*` o `chat_identifier:*`; use `channels.imessage.groups` para claves numéricas del registro `chat_id`.

  </Tab>

  <Tab title="Política de grupos + menciones">
    `channels.imessage.groupPolicy` controla la gestión de grupos:

    - `allowlist` (predeterminado)
    - `open`
    - `disabled`

    Lista de remitentes permitidos del grupo: `channels.imessage.groupAllowFrom`.

    Las entradas de `groupAllowFrom` también pueden hacer referencia a grupos estáticos de acceso de remitentes (`accessGroup:<name>`).

    Alternativa en tiempo de ejecución: si `groupAllowFrom` no está definido, las comprobaciones de remitentes de grupos de iMessage usan `allowFrom`; defina `groupAllowFrom` cuando la admisión de mensajes directos y de grupos deba ser diferente. Un `groupAllowFrom: []` explícitamente vacío no usa la alternativa: bloquea a todos los remitentes de grupos bajo `allowlist`.
    Nota sobre el tiempo de ejecución: si falta por completo `channels.imessage`, el entorno de ejecución recurre a `groupPolicy="allowlist"` y registra una advertencia (incluso si `channels.defaults.groupPolicy` está definido).

    <Warning>
    El enrutamiento de grupos bajo `groupPolicy: "allowlist"` ejecuta **dos** comprobaciones consecutivas:

    1. **Lista de remitentes permitidos** (`channels.imessage.groupAllowFrom`): identificador, `accessGroup:<name>`, `chat_guid`, `chat_identifier` o `chat_id`. Una lista efectiva vacía (sin `groupAllowFrom` ni alternativa de `allowFrom`) bloquea a todos los remitentes de grupos.
    2. **Registro de grupos** (`channels.imessage.groups`): se aplica cuando el mapa contiene entradas; el chat debe coincidir con una entrada explícita por `chat_id` o con el comodín `groups: { "*": { ... } }`. Cuando `groups` está vacío o no existe, solo la lista de remitentes permitidos decide la admisión.

    Si no se configura ninguna lista efectiva de remitentes permitidos para grupos, todos los mensajes de grupo se descartan antes de la comprobación del registro. Cada comprobación tiene su propia señal de nivel `warn` en el nivel de registro predeterminado y cada una indica una solución distinta:

    - una vez por cuenta al iniciar, cuando la lista efectiva de remitentes permitidos para grupos está vacía: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`; se corrige definiendo `channels.imessage.groupAllowFrom` (o `allowFrom`); añadir únicamente entradas de `groups` hace que la comprobación 1 siga bloqueando a todos los remitentes.
    - una vez por `chat_id` en tiempo de ejecución, cuando un remitente supera la comprobación 1, pero el chat no figura en un registro `groups` que contiene entradas: `imessage: dropping group message from chat_id=<id> ...`; se corrige añadiendo ese `chat_id` (o `"*"`) en `channels.imessage.groups`.

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

    `groupAllowFrom` por sí solo admite a esos remitentes en cualquier grupo; añada el bloque `groups` para delimitar qué chats están permitidos (y definir opciones por chat como `requireMention`).
    </Warning>

    Comprobación de menciones para grupos:

    - iMessage no dispone de metadatos nativos de menciones
    - la detección de menciones utiliza patrones de expresiones regulares (`agents.list[].groupChat.mentionPatterns`, con `messages.groupChat.mentionPatterns` como alternativa)
    - sin patrones configurados, no se puede aplicar la comprobación de menciones
    - los comandos de control de remitentes autorizados omiten la comprobación de menciones

    `systemPrompt` por grupo:

    Cada entrada de `channels.imessage.groups.*` acepta una cadena opcional `systemPrompt`, que se inyecta en el prompt del sistema del agente en cada turno que gestiona un mensaje de ese grupo. La resolución refleja `channels.whatsapp.groups`:

    1. **Prompt del sistema específico del grupo** (`groups["<chat_id>"].systemPrompt`): se usa cuando la entrada específica del grupo existe en el mapa **y** su clave `systemPrompt` está definida. Si `systemPrompt` es una cadena vacía (`""`), se suprime el comodín y no se aplica ningún prompt del sistema a ese grupo.
    2. **Prompt del sistema comodín para grupos** (`groups["*"].systemPrompt`): se usa cuando la entrada específica del grupo no aparece en el mapa o cuando existe, pero no define ninguna clave `systemPrompt`.

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
              systemPrompt: "Este es el chat de la rotación de guardia. Limite las respuestas a menos de 3 frases.",
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

    Los prompts por grupo solo se aplican a los mensajes de grupo; los mensajes directos no se ven afectados.

  </Tab>

  <Tab title="Sesiones y respuestas deterministas">
    - Los mensajes directos usan el enrutamiento directo; los grupos usan el enrutamiento de grupos.
    - Con el valor predeterminado `session.dmScope=main`, los mensajes directos de iMessage se agrupan en la sesión principal del agente.
    - Las sesiones de grupo están aisladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Las respuestas vuelven a iMessage mediante los metadatos del canal y destino de origen.

    Comportamiento de los hilos similares a grupos:

    Algunos hilos de iMessage con varios participantes pueden llegar con `is_group=false`.
    Si ese `chat_id` está configurado explícitamente en `channels.imessage.groups`, OpenClaw lo trata como tráfico de grupo (comprobaciones de grupo + aislamiento de la sesión de grupo).

  </Tab>
</Tabs>

## Vinculaciones de conversaciones ACP

Los chats de iMessage se pueden vincular a sesiones ACP.

Flujo rápido para operadores:

- Ejecute `/acp spawn codex --bind here` dentro del mensaje directo o del chat de grupo permitido.
- Los mensajes futuros de esa misma conversación de iMessage se enrutan a la sesión ACP creada.
- `/new` y `/reset` restablecen en el mismo lugar la misma sesión ACP vinculada.
- `/acp close` cierra la sesión ACP y elimina la vinculación.

Las vinculaciones persistentes configuradas utilizan entradas de nivel superior `bindings[]` con `type: "acp"` y `match.channel: "imessage"`.

`match.peer.id` puede usar:

- un identificador normalizado de mensajes directos, como `+15555550123` o `user@example.com`
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
    Use un Apple ID y un usuario de macOS específicos para que el tráfico del bot quede aislado de su perfil personal de Messages.

    Flujo habitual:

    1. Cree una cuenta de usuario de macOS dedicada o inicie sesión en ella.
    2. Inicie sesión en Mensajes con el Apple ID del bot en esa cuenta de usuario.
    3. Instale `imsg` en esa cuenta de usuario.
    4. Cree un contenedor SSH para que OpenClaw pueda ejecutar `imsg` en el contexto de esa cuenta de usuario.
    5. Dirija `channels.imessage.accounts.<id>.cliPath` y `.dbPath` a ese perfil de usuario.

    La primera ejecución puede requerir aprobaciones en la interfaz gráfica (Automatización + Acceso total al disco) en la sesión de usuario de ese bot.

  </Accordion>

  <Accordion title="Mac remoto mediante Tailscale (ejemplo)">
    Topología habitual:

    - El gateway se ejecuta en Linux o una máquina virtual
    - iMessage + `imsg` se ejecutan en un Mac de la red Tailscale
    - El contenedor `cliPath` utiliza SSH para ejecutar `imsg`
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

    Utilice claves SSH para que tanto SSH como SCP funcionen sin interacción.
    Asegúrese primero de que la clave del host sea de confianza (por ejemplo, `ssh bot@mac-mini.tailnet-1234.ts.net`) para que se rellene `known_hosts`.

  </Accordion>

  <Accordion title="Patrón para varias cuentas">
    iMessage admite configuración por cuenta en `channels.imessage.accounts`.

    Cada cuenta puede sobrescribir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, la configuración del historial y las listas de raíces permitidas para archivos adjuntos.

  </Accordion>

  <Accordion title="Historial de mensajes directos">
    Establezca `channels.imessage.dmHistoryLimit` para inicializar las nuevas sesiones de mensajes directos con el historial reciente de `imsg` decodificado para esa conversación. Utilice `channels.imessage.dms["<sender>"].historyLimit` para aplicar sobrescrituras por remitente, incluido `0` para deshabilitar el historial de un remitente.

    El historial de mensajes directos de iMessage se obtiene de `imsg` bajo demanda. Si no se establece `dmHistoryLimit`, se deshabilita la inicialización global del historial de mensajes directos, pero un valor positivo de `channels.imessage.dms["<sender>"].historyLimit` para un remitente sigue habilitando la inicialización para ese remitente.

  </Accordion>
</AccordionGroup>

## Contenido multimedia, división en fragmentos y destinos de entrega

<AccordionGroup>
  <Accordion title="Archivos adjuntos y contenido multimedia">
    - La ingesta de archivos adjuntos entrantes está **desactivada de forma predeterminada**; establezca `channels.imessage.includeAttachments: true` para reenviar al agente fotos, notas de voz, vídeos y otros archivos adjuntos. Cuando está deshabilitada, los mensajes de iMessage que solo contienen archivos adjuntos se descartan antes de llegar al agente y es posible que no generen ninguna línea de registro `Inbound message`.
    - Las rutas remotas de archivos adjuntos se pueden obtener mediante SCP cuando se establece `remoteHost`
    - Las rutas de archivos adjuntos deben coincidir con las raíces permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - Las raíces configuradas amplían el patrón de raíz predeterminado `/Users/*/Library/Messages/Attachments` (se combinan, no lo sustituyen)
    - SCP utiliza una comprobación estricta de la clave del host (`StrictHostKeyChecking=yes`)
    - El tamaño del contenido multimedia saliente utiliza `channels.imessage.mediaMaxMb` (16 MB de forma predeterminada)

  </Accordion>

  <Accordion title="Texto saliente y división en fragmentos">
    - Límite de texto por fragmento: `channels.imessage.textChunkLimit` (4000 de forma predeterminada)
    - Modo de división en fragmentos: `channels.imessage.streaming.chunkMode`
      - `length` (valor predeterminado)
      - `newline` (primero divide por párrafos)
    - La negrita, cursiva, el subrayado y el tachado de Markdown saliente se convierten en texto con estilo nativo (los destinatarios con macOS 15 o versiones posteriores ven el formato; los destinatarios con versiones anteriores ven texto sin formato y sin los marcadores); las tablas de Markdown se convierten según el modo de tablas de Markdown del canal
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

Cuando `imsg launch` está en ejecución y `openclaw channels status --probe` informa de `privateApi.available: true`, la herramienta de mensajes puede utilizar acciones nativas de iMessage además de los envíos de texto normales.

Todas las acciones están habilitadas de forma predeterminada; utilice `channels.imessage.actions` para deshabilitar acciones individuales:

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
    - **react**: Añade o elimina reacciones Tapback de iMessage (`messageId`, `emoji`, `remove`). Las reacciones Tapback admitidas corresponden a amor, me gusta, no me gusta, risa, énfasis y pregunta. Si se elimina sin indicar un emoji, se borra cualquier reacción Tapback establecida.
    - **reply**: Envía una respuesta en un hilo a un mensaje existente (`messageId`, `text` o `message`, además de `chatGuid`, `chatId`, `chatIdentifier` o `to`). Para responder con un archivo adjunto también se necesita una compilación de `imsg` cuyo `send-rich` admita `--file`.
    - **sendWithEffect**: Envía texto con un efecto de iMessage (`text` o `message`, `effect` o `effectId`). Nombres cortos: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: Edita un mensaje enviado en versiones compatibles de macOS o de la API privada (`messageId`, `text` o `newText`). Solo se pueden editar los mensajes enviados por el propio gateway.
    - **unsend**: Retira un mensaje enviado en versiones compatibles de macOS o de la API privada (`messageId`). Solo se pueden retirar los mensajes enviados por el propio gateway.
    - **upload-file**: Envía contenido multimedia o archivos (`buffer` como base64 o un valor hidratado de `media`/`path`/`filePath`, `filename` y, opcionalmente, `asVoice`). Alias heredado: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gestionan chats grupales cuando el destino actual es una conversación grupal. Estas acciones modifican la identidad de Mensajes del host, por lo que requieren que el remitente sea propietario o un cliente del Gateway con `operator.admin`.
    - **poll**: Crea una encuesta nativa de Mensajes de Apple (`pollQuestion`, `pollOption` repetido de 2 a 12 veces, además de `chatGuid`, `chatId`, `chatIdentifier` o `to`). Los destinatarios con iOS/iPadOS/macOS 26 o versiones posteriores pueden verla y votar de forma nativa; las versiones anteriores del sistema operativo reciben como alternativa el texto "Se envió una encuesta". Requiere `selectors.pollPayloadMessage`.
    - **poll-vote**: Vota en una encuesta existente (`pollId` o `messageId`, además de exactamente uno de `pollOptionIndex`, `pollOptionId` o `pollOptionText`). Requiere `selectors.pollVoteMessage` y el método RPC `poll.vote`.

    Las encuestas entrantes aceptadas se representan para el agente con la pregunta, las etiquetas numeradas de las opciones, el recuento de votos y el ID del mensaje de la encuesta que necesita `poll-vote`.

  </Accordion>

  <Accordion title="ID de mensajes">
    El contexto entrante de iMessage incluye tanto valores abreviados de `MessageSid` como GUID completos de mensajes (`MessageSidFull`) cuando están disponibles. Los ID abreviados se limitan a la caché reciente de respuestas respaldada por SQLite y se comprueban con el chat actual antes de usarlos. Si caduca un ID abreviado, vuelva a intentarlo con su `MessageSidFull` y establezca como destino la conversación que lo proporcionó. Los ID completos no eluden la vinculación con la conversación ni con la cuenta, por lo que debe sustituirse un ID de otro chat por uno del destino actual. Las llamadas delegadas remotas pueden rechazar ID completos obsoletos cuando no haya pruebas disponibles de la conversación actual.

  </Accordion>

  <Accordion title="Detección de capacidades">
    OpenClaw solo oculta las acciones de la API privada cuando el estado de la comprobación almacenado en caché indica que el puente no está disponible. Si el estado es desconocido, las acciones permanecen visibles y, al ejecutarse, realizan comprobaciones diferidas para que la primera acción pueda completarse correctamente después de `imsg launch` sin actualizar manualmente el estado por separado.

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

    Las compilaciones antiguas de `imsg` anteriores a la lista de capacidades por método deshabilitan silenciosamente el indicador de escritura y las confirmaciones de lectura; OpenClaw registra una advertencia una vez por reinicio para que pueda determinarse la causa de la confirmación ausente.

  </Accordion>

  <Accordion title="Reacciones Tapback entrantes">
    OpenClaw se suscribe a las reacciones Tapback de iMessage y enruta las reacciones aceptadas como eventos del sistema en lugar de texto de mensaje normal, por lo que la reacción Tapback de un usuario no activa un ciclo de respuesta ordinario.

    El modo de notificación se controla mediante `channels.imessage.reactionNotifications`:

    - `"own"` (valor predeterminado): notifica solo cuando los usuarios reaccionan a mensajes creados por el bot.
    - `"all"`: notifica todas las reacciones Tapback entrantes de remitentes autorizados.
    - `"off"`: ignora las reacciones Tapback entrantes.

    Las sobrescrituras por cuenta utilizan `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reacciones de aprobación (👍 / 👎)">
    Cuando `approvals.exec.enabled` o `approvals.plugin.enabled` es verdadero y la solicitud se enruta a iMessage, el gateway entrega de forma nativa una solicitud de aprobación y acepta una reacción Tapback para resolverla:

    - `👍` (reacción Tapback «Me gusta») → `allow-once`
    - `👎` (reacción Tapback «No me gusta») → `deny`
    - `allow-always` permanece como alternativa manual: envíe `/approve <id> allow-always` como respuesta normal.

    Para gestionar la reacción, el identificador del usuario que reacciona debe figurar explícitamente como aprobador. La lista de aprobadores se obtiene de `channels.imessage.allowFrom` (o `channels.imessage.accounts.<id>.allowFrom`); añada el número de teléfono del usuario en formato E.164 o el correo electrónico de su Apple ID (los destinos de chat como `chat_id:*` no son entradas de aprobador válidas). Se admite la entrada comodín `"*"`, pero permite que cualquier remitente apruebe; una lista de aprobadores vacía deshabilita por completo el acceso directo mediante reacciones. El acceso directo mediante reacciones omite deliberadamente `reactionNotifications`, `dmPolicy` y `groupAllowFrom`, porque la lista de aprobadores permitidos explícitamente es la única condición relevante para resolver la aprobación.

    La autorización del comando de texto `/approve` utiliza la misma lista: cuando `channels.imessage.allowFrom` no está vacío, `/approve <id> <decision>` se autoriza según esa lista de aprobadores (no según la lista de remitentes permitidos para mensajes directos), y los remitentes admitidos en la lista de mensajes directos pero ausentes de `allowFrom` reciben una denegación explícita. Cuando `allowFrom` está vacío, se mantiene la alternativa del mismo chat y `/approve` autoriza a cualquier persona admitida por la lista de mensajes directos. Añada a `allowFrom` todos los operadores que deban poder aprobar, ya sea mediante `/approve` o mediante reacciones.

    Notas para operadores:
    - La vinculación de la reacción se almacena tanto en memoria como en el almacén persistente con claves del Gateway (con el TTL ajustado a la caducidad de la aprobación), y el Gateway también sondea las solicitudes pendientes en busca de tapbacks, por lo que un tapback que llegue poco después de reiniciar el Gateway seguirá resolviendo la aprobación.
    - El tapback `is_from_me=true` del propio operador (por ejemplo, desde un dispositivo Apple enlazado) resuelve la aprobación cuando ese identificador es un aprobador explícito.
    - Las solicitudes de aprobación se dirigen a una conversación grupal solo cuando hay aprobadores explícitos configurados; de lo contrario, cualquier miembro del grupo podría aprobar.
    - Los tapbacks heredados con formato de texto (`Liked "…"` en texto sin formato de clientes Apple muy antiguos) no pueden resolver aprobaciones porque no incluyen ningún GUID de mensaje; la resolución mediante reacciones requiere los metadatos estructurados de tapback que emiten los clientes actuales de macOS / iOS.

  </Accordion>

  <Accordion title="Reacciones a preguntas (1️⃣ / 2️⃣ / 3️⃣ / 4️⃣)">
    Para una solicitud `ask_user` con una pregunta no secreta de selección única y entre una y cuatro opciones, OpenClaw añade opciones de emojis numerados. Reaccione a la solicitud entregada con el número correspondiente para responder. La reacción debe incluir el GUID estable del mensaje creado por el bot; OpenClaw asigna entonces el número a la opción canónica mediante el Gateway. Los toques obsoletos o duplicados se ignoran.

    Las solicitudes con varias preguntas, selección múltiple y texto libre siguen admitiendo únicamente respuestas de texto. Las reacciones a preguntas siguen las reglas normales de admisión de mensajes directos y grupos de iMessage. Se reconocen incluso cuando el valor general de `reactionNotifications` es `"off"`, sin convertir reacciones no relacionadas en eventos del agente.

  </Accordion>
</AccordionGroup>

## Escrituras de configuración

iMessage permite de forma predeterminada escrituras de configuración iniciadas por el canal (para `/config set|unset` cuando `commands.config: true`).

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

## Agrupación de mensajes directos enviados por separado (comando + URL en una composición)

Cuando un usuario escribe juntos un comando y una URL —por ejemplo, `Dump https://example.com/article`—, la aplicación Mensajes de Apple divide el envío en **dos filas `chat.db` independientes**:

1. Un mensaje de texto (`"Dump"`).
2. Un globo de vista previa de URL (`"https://..."`) con imágenes de vista previa de OG como archivos adjuntos.

Las dos filas llegan a OpenClaw con una separación de ~0.8-2.0 s en la mayoría de las configuraciones. Sin agrupación, el agente recibe únicamente el comando en el turno 1 (y a menudo responde «envíeme la URL») antes de que la URL llegue en el turno 2. Esto se debe al Pipeline de envío de Apple, no a nada que introduzcan OpenClaw o `imsg`.

`channels.imessage.coalesceSameSenderDms` habilita para un mensaje directo el almacenamiento en búfer de filas consecutivas del mismo remitente. Cuando `imsg` expone el marcador estructural de vista previa de URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` en una de las filas de origen, OpenClaw combina únicamente ese envío realmente dividido y conserva las demás filas almacenadas en búfer como turnos independientes. En compilaciones antiguas de `imsg` que no emiten ningún metadato de globo, OpenClaw no puede distinguir un envío dividido de varios envíos independientes, por lo que recurre a combinar el lote. Esto conserva el comportamiento anterior a los metadatos en lugar de convertir regresivamente los envíos divididos de `Dump <url>` en dos turnos. Los chats grupales siguen procesando cada mensaje por separado para preservar la estructura de turnos con varios usuarios.

<Tabs>
  <Tab title="Cuándo habilitar">
    Habilítelo cuando:

    - Distribuya Skills que esperen `command + payload` en un solo mensaje (volcar, pegar, guardar, poner en cola, etc.).
    - Los usuarios peguen URL junto a los comandos.
    - Pueda aceptar la latencia añadida a los turnos de mensajes directos (consulte más adelante).

    Déjelo deshabilitado cuando:

    - Necesite una latencia mínima para comandos activadores de una sola palabra en mensajes directos.
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

    Con la opción activada y sin un valor explícito de `messages.inbound.byChannel.imessage` ni un valor global de `messages.inbound.debounceMs`, la ventana de espera se amplía a **7000 ms** (el valor predeterminado heredado es 0 ms, sin espera). La ventana más amplia es necesaria porque la cadencia de los envíos divididos de vistas previas de URL de Apple puede prolongarse varios segundos mientras Messages.app emite la fila de vista previa.

    Para ajustar personalmente la ventana:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms cubren los retrasos observados en vistas previas de URL de Messages.app.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Consideraciones">
    - **La combinación precisa requiere metadatos actuales de la carga útil de `imsg`.** Cuando `balloon_bundle_id` está presente, solo se combina el envío realmente dividido; la combinación alternativa sin metadatos descrita anteriormente es una compatibilidad retroactiva provisional que se eliminará cuando `imsg` agrupe los envíos divididos en el origen.
    - **Latencia añadida para los mensajes directos.** Con la opción activada, cada mensaje directo (incluidos los comandos de control independientes y las continuaciones de un único texto) espera hasta que finalice la ventana antes de procesarse, por si va a llegar una fila de vista previa de URL. Los mensajes de chats grupales siguen procesándose de inmediato.
    - **La salida combinada está limitada.** El texto combinado tiene un límite de 4000 caracteres con un marcador `…[truncated]` explícito; los archivos adjuntos tienen un límite de 20; las entradas de origen tienen un límite de 10 (si se supera, se conservan la primera y las más recientes). Todos los GUID de origen se registran en `coalescedMessageGuids` para la telemetría posterior.
    - **Solo para mensajes directos.** Los chats grupales se procesan por mensaje para que el bot mantenga la capacidad de respuesta cuando varias personas escriben.
    - **Habilitación voluntaria y por canal.** Los demás canales (Discord, Slack, Telegram, WhatsApp, …) no se ven afectados. Las configuraciones heredadas de BlueBubbles que establezcan `channels.bluebubbles.coalesceSameSenderDms` deben migrar ese valor a `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Escenarios y lo que ve el agente

La columna «Opción activada» muestra el comportamiento en una compilación de `imsg` que emite `balloon_bundle_id`. En compilaciones antiguas de `imsg` que no emiten ningún metadato de globo, las filas siguientes marcadas como «Dos turnos» / «N turnos» recurren en su lugar a una combinación heredada (un turno): OpenClaw no puede distinguir estructuralmente un envío dividido de varios envíos independientes, por lo que conserva la combinación anterior a los metadatos. La separación precisa se activa cuando la compilación comienza a emitir metadatos de globo.

| El usuario compone                                                | `chat.db` produce                       | Opción desactivada (predeterminado)                 | Opción activada + ventana (imsg emite metadatos de globo)                                                         |
| ------------------------------------------------------------------ | ------------------------------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (un envío)                                     | 2 filas con ~1 s de separación                   | Dos turnos del agente: «Dump» solo y después la URL | Un turno: texto combinado `Dump https://example.com`                                                                      |
| `Save this 📎image.jpg caption` (archivo adjunto + texto)                       | 2 filas sin metadatos de globo de URL            | Dos turnos                                          | Dos turnos tras observarse metadatos; un turno combinado en sesiones antiguas/anteriores a la detección sin metadatos |
| `/status` (comando independiente)                         | 1 fila                                           | Procesamiento inmediato                             | **Espera hasta que finalice la ventana y después se procesa**                                                     |
| URL pegada de forma independiente                                  | 1 fila                                           | Procesamiento inmediato                             | Espera hasta que finalice la ventana y después se procesa                                                         |
| Texto + URL enviados deliberadamente como dos mensajes independientes, con minutos de diferencia | 2 filas fuera de la ventana | Dos turnos | Dos turnos (la ventana vence entre ambos)                                                                         |
| Ráfaga rápida (>10 mensajes directos pequeños dentro de la ventana) | N filas sin metadatos de globo de URL            | N turnos                                            | N turnos tras observarse metadatos; un turno combinado y limitado en sesiones antiguas/anteriores a la detección sin metadatos |
| Dos personas escribiendo en un chat grupal                         | N filas de M remitentes                           | M+ turnos (uno por lote de remitente)               | M+ turnos; los chats grupales no se agrupan                                                                       |

## Recuperación de entradas tras reiniciar un puente o el Gateway

iMessage recupera los mensajes perdidos mientras el Gateway estaba inactivo y, al mismo tiempo, suprime la «bomba de mensajes pendientes» obsoletos que Apple puede vaciar tras una recuperación de Push. El comportamiento predeterminado está siempre activado y se basa en una entrada duradera y un límite de antigüedad.

- **Protección duradera contra repeticiones.** Antes de avanzar el cursor de recuperación, OpenClaw registra cada fila sin procesar en la cola de entrada compartida de SQLite, utilizando su GUID de Apple como ID del evento. Una fila completada deja una marca de eliminación durante unas 4 horas, con un límite de 10,000 entradas, por lo que una repetición con el mismo GUID se descarta incluso después de un reinicio. Una fila pendiente sigue siendo recuperable hasta que el procesamiento la adopta.
- **Recuperación tras períodos de inactividad.** Al iniciarse, el monitor recuerda el último rowid de `chat.db` admitido de forma duradera (un cursor persistente por cuenta) y lo pasa a `imsg watch.subscribe` como `since_rowid`, para que imsg reproduzca las filas que aún no se habían registrado y después continúe con los eventos en tiempo real. Las filas registradas antes de un bloqueo se reanudan desde SQLite. La reproducción se limita a las 500 filas más recientes y a mensajes con una antigüedad máxima de ~2 horas, y las marcas de eliminación de GUID descartan todo lo ya procesado.
- **Límite de antigüedad para mensajes pendientes obsoletos.** Las filas posteriores al límite de inicio son realmente nuevas; si la fecha de envío de una fila precede a su llegada en más de ~15 minutos, se considera parte de los mensajes pendientes vaciados por Push y se suprime. Las filas reproducidas (en el límite o antes de él) utilizan en su lugar la ventana de recuperación más amplia, por lo que se entrega un mensaje perdido recientemente, pero no el historial antiguo.

La recuperación funciona tanto con configuraciones locales como remotas de `cliPath`, porque la reproducción de `since_rowid` se ejecuta mediante la misma conexión RPC de `imsg`. La diferencia es la ventana: cuando el Gateway puede leer `chat.db` (localmente), fija el límite de rowid de inicio, limita el intervalo de reproducción y entrega mensajes perdidos con una antigüedad de hasta un par de horas. Mediante un `cliPath` SSH remoto no puede leer la base de datos, por lo que la reproducción no tiene límite y cada fila utiliza el límite de antigüedad en tiempo real; sigue recuperando los mensajes perdidos recientemente y suprimiendo los mensajes pendientes antiguos, pero con la ventana en tiempo real más estrecha. Ejecute el Gateway en el Mac con Mensajes para obtener la ventana de recuperación más amplia.

### Señal visible para el operador

Los mensajes pendientes suprimidos se registran en el nivel predeterminado y nunca se descartan silenciosamente (la opción `recovery` muestra qué ventana se aplicó):

```text
imessage: mensajes pendientes de entrada obsoletos suprimidos cuenta=<id> enviados=<iso> recuperación=<bool> (<N> suprimidos desde el inicio)
```

### Migración

`channels.imessage.catchup.*` está obsoleto: la recuperación tras períodos de inactividad es automática y no necesita configuración en instalaciones nuevas. Las configuraciones existentes con `catchup.enabled: true` siguen respetándose como perfil de compatibilidad para la ventana de reproducción de recuperación. Los bloques de puesta al día deshabilitados (`enabled: false` o sin `enabled: true`) están retirados; `openclaw doctor --fix` los elimina.

## Solución de problemas

<AccordionGroup>
  <Accordion title="No se encuentra imsg o no se admite RPC">
    Valide el binario y la compatibilidad con RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Si la sonda informa que RPC no es compatible, actualice `imsg`. Si las acciones de la API privada no están disponibles, ejecute `imsg launch` en la sesión del usuario de macOS que ha iniciado sesión y vuelva a realizar la sonda. Si el Gateway no se está ejecutando en macOS, utilice la configuración anterior de Mac remoto mediante SSH en lugar de la ruta local predeterminada `imsg`.

  </Accordion>

  <Accordion title="Los mensajes se envían, pero los iMessages entrantes no llegan">
    Primero, compruebe si el mensaje llegó al Mac local. Si `chat.db` no cambia, OpenClaw no puede recibir el mensaje aunque `imsg status --json` indique que el puente funciona correctamente.

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

    Envíe un iMessage nuevo desde el teléfono y confirme que haya una fila `chat.db` nueva o un evento `imsg watch` antes de depurar las sesiones de OpenClaw. No ejecute esto como un bucle periódico de reinicio del puente; repetir `imsg launch` junto con reinicios del Gateway durante el trabajo activo puede interrumpir las entregas y dejar bloqueadas las ejecuciones del canal en curso.

  </Accordion>

  <Accordion title="El Gateway no se está ejecutando en macOS">
    El `cliPath: "imsg"` predeterminado debe ejecutarse en el Mac con la sesión iniciada en Mensajes. En Linux o Windows, establezca `channels.imessage.cliPath` en un script contenedor que se conecte por SSH a ese Mac y ejecute `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Después, ejecute:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="Los mensajes directos se ignoran">
    Compruebe:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprobaciones de vinculación (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Los mensajes de grupo se ignoran">
    Compruebe:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamiento de la lista de permitidos de `channels.imessage.groups`
    - configuración del patrón de menciones (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Los archivos adjuntos remotos fallan">
    Compruebe:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticación mediante clave SSH/SCP desde el host del Gateway
    - que la clave del host exista en `~/.ssh/known_hosts` en el host del Gateway
    - que la ruta remota sea legible en el Mac donde se ejecuta Mensajes

  </Accordion>

  <Accordion title="Se omitieron las solicitudes de permisos de macOS">
    Vuelva a ejecutar los comandos en un terminal gráfico interactivo, en el mismo contexto de usuario y sesión, y apruebe las solicitudes:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirme que el acceso total al disco y la automatización estén concedidos para el contexto del proceso que ejecuta OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Referencias de configuración

- [Referencia de configuración: iMessage](/es/gateway/config-channels#imessage)
- [Configuración del Gateway](/es/gateway/configuration)
- [Vinculación](/es/channels/pairing)

## Temas relacionados

- [Descripción general de los canales](/es/channels) — todos los canales compatibles
- [Eliminación de BlueBubbles y la ruta de iMessage mediante imsg](/es/announcements/bluebubbles-imessage) — anuncio y resumen de la migración
- [Migración desde BlueBubbles](/es/channels/imessage-from-bluebubbles) — tabla de equivalencias de configuración y transición paso a paso
- [Vinculación](/es/channels/pairing) — autenticación de mensajes directos y flujo de vinculación
- [Grupos](/es/channels/groups) — comportamiento de los chats de grupo y control mediante menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para los mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de la seguridad
