---
read_when:
    - Configuración de Matrix en OpenClaw
    - Configuración de Matrix E2EE y verificación
summary: Estado de soporte, configuración y ejemplos de configuración de Matrix
title: Matriz
x-i18n:
    generated_at: "2026-07-01T12:47:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2aa86a477c4f15e792ba01c45bb06f37a55fee26ee2c895bfa308ff57ef6d819
    source_path: channels/matrix.md
    workflow: 16
---

Matrix es un plugin de canal descargable para OpenClaw.
Usa el `matrix-js-sdk` oficial y admite MD, salas, hilos, contenido multimedia, reacciones, encuestas, ubicación y E2EE.

## Instalación

Instala Matrix desde ClawHub antes de configurar el canal:

```bash
openclaw plugins install @openclaw/matrix
```

Las especificaciones de plugin sin prefijo prueban ClawHub primero y luego recurren a npm. Para forzar el origen del registro, usa `openclaw plugins install clawhub:@openclaw/matrix` o `openclaw plugins install npm:@openclaw/matrix`.

Desde una copia local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registra y habilita el plugin, así que no se necesita un paso separado de `openclaw plugins enable matrix`. El plugin seguirá sin hacer nada hasta que configures el canal más abajo. Consulta [Plugins](/es/tools/plugin) para ver el comportamiento general de los plugins y las reglas de instalación.

## Configuración

1. Crea una cuenta de Matrix en tu homeserver.
2. Configura `channels.matrix` con `homeserver` + `accessToken`, o con `homeserver` + `userId` + `password`.
3. Reinicia el gateway.
4. Inicia un MD con el bot o invítalo a una sala (consulta [unión automática](#auto-join): las invitaciones nuevas solo aterrizan cuando `autoJoin` las permite).

### Configuración interactiva

```bash
openclaw channels add
openclaw configure --section channels
```

El asistente solicita: URL del homeserver, método de autenticación (token de acceso o contraseña), ID de usuario (solo autenticación con contraseña), nombre de dispositivo opcional, si se debe habilitar E2EE y si se debe configurar el acceso a salas y la unión automática.

Si ya existen variables de entorno `MATRIX_*` coincidentes y la cuenta seleccionada no tiene autenticación guardada, el asistente ofrece un atajo con variables de entorno. Para resolver nombres de sala antes de guardar una lista de permitidos, ejecuta `openclaw channels resolve --channel matrix "Project Room"`. Cuando E2EE está habilitado, el asistente escribe la configuración y ejecuta el mismo arranque que [`openclaw matrix encryption setup`](#encryption-and-verification).

### Configuración mínima

Basada en token:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Basada en contraseña (el token se guarda en caché después del primer inicio de sesión):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

### Unión automática

`channels.matrix.autoJoin` tiene el valor predeterminado `off`. Con el valor predeterminado, el bot no aparecerá en salas nuevas ni en MD de invitaciones nuevas hasta que te unas manualmente.

OpenClaw no puede saber en el momento de la invitación si una sala invitada es un MD o un grupo, así que todas las invitaciones, incluidas las invitaciones de estilo MD, pasan primero por `autoJoin`. `dm.policy` solo se aplica después, cuando el bot ya se unió y la sala se clasificó.

<Warning>
Define `autoJoin: "allowlist"` junto con `autoJoinAllowlist` para restringir qué invitaciones acepta el bot, o `autoJoin: "always"` para aceptar todas las invitaciones.

`autoJoinAllowlist` solo acepta destinos estables: `!roomId:server`, `#alias:server` o `*`. Los nombres simples de sala se rechazan; las entradas de alias se resuelven contra el homeserver, no contra el estado declarado por la sala invitada.
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

Para aceptar todas las invitaciones, usa `autoJoin: "always"`.

### Formatos de destino de listas de permitidos

Las listas de permitidos de MD y salas se rellenan mejor con ID estables:

- MD (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): usa `@user:server`. Los nombres para mostrar se ignoran de forma predeterminada porque son mutables; define `dangerouslyAllowNameMatching: true` solo cuando necesites explícitamente compatibilidad con entradas de nombres para mostrar.
- Claves de lista de permitidos de salas (`groups`, `rooms` heredado): usa `!room:server` o `#alias:server`. Los nombres simples de sala se ignoran de forma predeterminada; define `dangerouslyAllowNameMatching: true` solo cuando necesites explícitamente compatibilidad con la búsqueda por nombre de salas unidas.
- Listas de permitidos de invitaciones (`autoJoinAllowlist`): usa `!room:server`, `#alias:server` o `*`. Los nombres simples de sala se rechazan.

### Normalización del ID de cuenta

El asistente convierte un nombre legible en un ID de cuenta normalizado. Por ejemplo, `Ops Bot` se convierte en `ops-bot`. La puntuación se escapa en nombres de variables de entorno con ámbito para que dos cuentas no puedan colisionar: `-` → `_X2D_`, por lo que `ops-prod` se asigna a `MATRIX_OPS_X2D_PROD_*`.

### Credenciales en caché

Matrix almacena las credenciales en caché en `~/.openclaw/credentials/matrix/`:

- cuenta predeterminada: `credentials.json`
- cuentas con nombre: `credentials-<account>.json`

Cuando existen credenciales en caché allí, OpenClaw trata Matrix como configurado aunque el token de acceso no esté en el archivo de configuración; esto cubre la configuración, `openclaw doctor` y las comprobaciones de estado del canal.

### Variables de entorno

Se usan cuando la clave de configuración equivalente no está definida. La cuenta predeterminada usa nombres sin prefijo; las cuentas con nombre usan el ID de cuenta insertado antes del sufijo.

| Cuenta predeterminada | Cuenta con nombre (`<ID>` es el ID de cuenta normalizado) |
| --------------------- | --------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                  |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                                |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                     |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                    |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                   |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                                 |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                                |

Para la cuenta `ops`, los nombres pasan a ser `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, etc. Las variables de entorno de clave de recuperación las leen los flujos de CLI compatibles con recuperación (`verify backup restore`, `verify device`, `verify bootstrap`) cuando pasas la clave por tubería mediante `--recovery-key-stdin`.

`MATRIX_HOMESERVER` no se puede definir desde un `.env` del espacio de trabajo; consulta [Archivos `.env` del espacio de trabajo](/es/gateway/security).

## Ejemplo de configuración

Una base práctica con emparejamiento de MD, lista de permitidos de salas y E2EE:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## Vistas previas de streaming

El streaming de respuestas de Matrix es opcional. `streaming` controla cómo OpenClaw entrega la respuesta en curso del asistente; `blockStreaming` controla si cada bloque completado se conserva como su propio mensaje de Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Para conservar las vistas previas de respuestas en vivo pero ocultar líneas intermedias de herramienta/progreso, usa la forma de objeto:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

La forma de objeto completa acepta `{ mode, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label`: una etiqueta personalizada, `"auto"` o sin definir para elegir entre etiquetas configuradas o integradas, o `false` para ocultar la línea de etiqueta.
- `progress.labels`: etiquetas candidatas usadas solo cuando `label` es `"auto"` o no está definido. Déjalo sin definir para usar los valores predeterminados integrados.
- `progress.maxLines`: cantidad máxima de líneas de progreso móviles conservadas en el borrador. Después de este límite, las líneas más antiguas se recortan.
- `progress.maxLineChars`: cantidad máxima de caracteres por línea compacta de progreso antes del truncamiento.
- `progress.toolProgress`: cuando es `true` (predeterminado), la actividad en vivo de herramienta/progreso aparece en el borrador.

| `streaming`                 | Comportamiento                                                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (predeterminado)    | Espera la respuesta completa y la envía una vez. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                       |
| `"partial"`                 | Edita un mensaje de texto normal en el mismo lugar mientras el modelo escribe el bloque actual. Los clientes Matrix estándar pueden notificar en la primera vista previa, no en la edición final. |
| `"quiet"`                   | Igual que `"partial"`, pero el mensaje es un aviso que no notifica. Los destinatarios solo reciben una notificación cuando una regla push por usuario coincide con la edición finalizada (ver más abajo). |
| `"progress"`                | Envía líneas de progreso compactas individuales usando un borrador de progreso.                                                                                                  |

`blockStreaming` es independiente de `streaming`:

| `streaming`             | `blockStreaming: true`                                                  | `blockStreaming: false` (predeterminado)               |
| ----------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| `"partial"` / `"quiet"` | Borrador en vivo para el bloque actual; bloques completados conservados como mensajes | Borrador en vivo para el bloque actual, finalizado en el mismo lugar |
| `"off"`                 | Un mensaje Matrix con notificación por cada bloque terminado            | Un mensaje Matrix con notificación para la respuesta completa |

Notas:

- Si una vista previa supera el límite de tamaño por evento de Matrix, OpenClaw detiene el streaming de vista previa y recurre a la entrega solo final.
- Las respuestas con contenido multimedia siempre envían adjuntos de forma normal. Si una vista previa obsoleta ya no se puede reutilizar con seguridad, OpenClaw la censura antes de enviar la respuesta multimedia final.
- Las actualizaciones de vista previa de progreso de herramientas están habilitadas de forma predeterminada cuando el streaming de vista previa de Matrix está activo. Define `streaming.preview.toolProgress: false` para conservar las ediciones de vista previa del texto de respuesta pero dejar el progreso de herramientas en la ruta de entrega normal.
- Las ediciones de vista previa cuestan llamadas adicionales a la API de Matrix. Deja `streaming: "off"` si quieres el perfil de límite de tasa más conservador.

## Mensajes de voz

Las notas de voz entrantes de Matrix se transcriben antes de la puerta de mención de la sala. Esto permite que una nota de voz que diga el nombre del bot active el agente en una sala con `requireMention: true`, y entrega al agente la transcripción en lugar de solo un marcador de posición de adjunto de audio.

Matrix usa el proveedor multimedia de audio compartido configurado en `tools.media.audio`, como OpenAI `gpt-4o-mini-transcribe`. Consulta [Resumen de herramientas multimedia](/es/tools/media-overview) para la configuración y los límites del proveedor.

Detalles de comportamiento:

- Los eventos `m.audio` y los eventos `m.file` con un tipo MIME `audio/*` son elegibles.
- En salas cifradas, OpenClaw descifra el adjunto mediante la ruta de medios de Matrix existente antes de la transcripción.
- La transcripción se marca como generada por máquina y no confiable en el prompt del agente.
- El adjunto se marca como ya transcrito para que las herramientas de medios posteriores no vuelvan a transcribir la misma nota de voz.
- Define `tools.media.audio.enabled: false` para desactivar la transcripción de audio globalmente.

## Metadatos de aprobación

Los prompts de aprobación nativos de Matrix son eventos `m.room.message` normales con contenido de evento personalizado específico de OpenClaw bajo `com.openclaw.approval`. Matrix permite claves de contenido de evento personalizadas, por lo que los clientes estándar siguen mostrando el cuerpo de texto mientras que los clientes compatibles con OpenClaw pueden leer el id de aprobación estructurado, el tipo, el estado, las decisiones disponibles y los detalles de exec/Plugin.

Cuando un prompt de aprobación es demasiado largo para un solo evento de Matrix, OpenClaw divide el texto visible en fragmentos y adjunta `com.openclaw.approval` solo al primer fragmento. Las reacciones para las decisiones de permitir/denegar se vinculan a ese primer evento, por lo que los prompts largos conservan el mismo objetivo de aprobación que los prompts de un solo evento.

### Reglas push autoalojadas para previsualizaciones finalizadas silenciosas

`streaming: "quiet"` solo notifica a los destinatarios una vez que se finaliza un bloque o turno; una regla push por usuario debe coincidir con el marcador de previsualización finalizada. Consulta [Reglas push de Matrix para previsualizaciones silenciosas](/es/channels/matrix-push-rules) para ver la receta completa (token del destinatario, comprobación del pusher, instalación de la regla, notas por homeserver).

## Salas bot a bot

De forma predeterminada, se ignoran los mensajes de Matrix de otras cuentas de Matrix de OpenClaw configuradas.

Usa `allowBots` cuando quieras intencionalmente tráfico de Matrix entre agentes:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` acepta mensajes de otras cuentas de bot de Matrix configuradas en salas y MD permitidos.
- `allowBots: "mentions"` acepta esos mensajes solo cuando mencionan visiblemente a este bot en salas. Los MD siguen permitidos.
- `groups.<room>.allowBots` anula la configuración de nivel de cuenta para una sala.
- Los mensajes aceptados de bots configurados usan la [protección contra bucles de bots](/es/channels/bot-loop-protection) compartida. Configura `channels.defaults.botLoopProtection` y luego anula con `channels.matrix.botLoopProtection` o `channels.matrix.groups.<room>.botLoopProtection` cuando una sala necesite un presupuesto diferente.
- OpenClaw sigue ignorando mensajes del mismo ID de usuario de Matrix para evitar bucles de autorrespuesta.
- Matrix no expone aquí una marca de bot nativa; OpenClaw trata "creado por bot" como "enviado por otra cuenta de Matrix configurada en este Gateway de OpenClaw".

Usa listas de salas permitidas estrictas y requisitos de mención al habilitar tráfico bot a bot en salas compartidas.

## Cifrado y verificación

En salas cifradas (E2EE), los eventos de imagen salientes usan `thumbnail_file` para que las previsualizaciones de imagen se cifren junto con el adjunto completo. Las salas sin cifrar siguen usando `thumbnail_url` sin formato. No se necesita configuración: el Plugin detecta automáticamente el estado E2EE.

Todos los comandos `openclaw matrix` aceptan `--verbose` (diagnósticos completos), `--json` (salida legible por máquina) y `--account <id>` (configuraciones de varias cuentas). La salida es concisa de forma predeterminada, con registro interno silencioso del SDK. Los ejemplos siguientes muestran la forma canónica; agrega las banderas según sea necesario.

### Habilitar cifrado

```bash
openclaw matrix encryption setup
```

Inicializa el almacenamiento secreto y la firma cruzada, crea una copia de seguridad de claves de sala si es necesario y luego imprime el estado y los próximos pasos. Banderas útiles:

- `--recovery-key <key>` aplica una clave de recuperación antes de inicializar (prefiere la forma por stdin documentada abajo)
- `--force-reset-cross-signing` descarta la identidad de firma cruzada actual y crea una nueva (úsalo solo intencionalmente)

Para una cuenta nueva, habilita E2EE al crearla:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` es un alias de `--enable-e2ee`.

Equivalente de configuración manual:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

### Estado y señales de confianza

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` informa tres señales de confianza independientes (`--verbose` las muestra todas):

- `Locally trusted`: confiable solo para este cliente
- `Cross-signing verified`: el SDK informa verificación mediante firma cruzada
- `Signed by owner`: firmado por tu propia clave de autofirma (solo diagnóstico)

`Verified by owner` se convierte en `yes` solo cuando `Cross-signing verified` es `yes`. La confianza local o una firma del propietario por sí sola no basta.

`--allow-degraded-local-state` devuelve diagnósticos de mejor esfuerzo sin preparar primero la cuenta de Matrix; es útil para pruebas sin conexión o parcialmente configuradas.

### Verificar este dispositivo con una clave de recuperación

La clave de recuperación es sensible: pásala mediante stdin en lugar de pasarla en la línea de comandos. Define `MATRIX_RECOVERY_KEY` (o `MATRIX_<ID>_RECOVERY_KEY` para una cuenta con nombre):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

El comando informa tres estados:

- `Recovery key accepted`: Matrix aceptó la clave para almacenamiento secreto o confianza del dispositivo.
- `Backup usable`: la copia de seguridad de claves de sala puede cargarse con el material de recuperación confiable.
- `Device verified by owner`: este dispositivo tiene confianza completa de identidad de firma cruzada de Matrix.

Sale con código distinto de cero cuando la confianza de identidad completa está incompleta, aunque la clave de recuperación haya desbloqueado material de copia de seguridad. En ese caso, completa la autoverificación desde otro cliente de Matrix:

```bash
openclaw matrix verify self
```

`verify self` espera a `Cross-signing verified: yes` antes de salir correctamente. Usa `--timeout-ms <ms>` para ajustar la espera.

La forma con clave literal `openclaw matrix verify device "<recovery-key>"` también se acepta, pero la clave termina en el historial de tu shell.

### Inicializar o reparar la firma cruzada

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` es el comando de reparación y configuración para cuentas cifradas. En orden:

- inicializa el almacenamiento secreto, reutilizando una clave de recuperación existente cuando sea posible
- inicializa la firma cruzada y sube las claves públicas faltantes
- marca y firma de forma cruzada el dispositivo actual
- crea una copia de seguridad de claves de sala del lado del servidor si aún no existe

Si el homeserver requiere UIA para subir claves de firma cruzada, OpenClaw prueba primero sin autenticación, luego `m.login.dummy` y luego `m.login.password` (requiere `channels.matrix.password`).

Banderas útiles:

- `--recovery-key-stdin` (combínalo con `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) o `--recovery-key <key>`
- `--force-reset-cross-signing` para descartar la identidad de firma cruzada actual (solo intencionalmente; requiere que la clave de recuperación activa esté almacenada o se proporcione con `--recovery-key-stdin`)

### Copia de seguridad de claves de sala

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` muestra si existe una copia de seguridad del lado del servidor y si este dispositivo puede descifrarla. `backup restore` importa las claves de sala respaldadas al almacén criptográfico local; si la clave de recuperación ya está en disco, puedes omitir `--recovery-key-stdin`.

Para reemplazar una copia de seguridad dañada con una base nueva (acepta perder historial antiguo irrecuperable; también puede recrear el almacenamiento secreto si el secreto de la copia de seguridad actual no se puede cargar):

```bash
openclaw matrix verify backup reset --yes
```

Agrega `--rotate-recovery-key` solo cuando quieras intencionalmente que la clave de recuperación anterior deje de desbloquear la base nueva de la copia de seguridad.

### Listar, solicitar y responder a verificaciones

```bash
openclaw matrix verify list
```

Lista las solicitudes de verificación pendientes para la cuenta seleccionada.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Envía una solicitud de verificación desde esta cuenta de OpenClaw. `--own-user` solicita autoverificación (aceptas el prompt en otro cliente de Matrix del mismo usuario); `--user-id`/`--device-id`/`--room-id` apuntan a otra persona. `--own-user` no puede combinarse con las otras banderas de destino.

Para la gestión de ciclo de vida de nivel más bajo, normalmente al seguir solicitudes entrantes desde otro cliente, estos comandos actúan sobre una solicitud específica `<id>` (impresa por `verify list` y `verify request`):

| Comando                                    | Propósito                                                           |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Aceptar una solicitud entrante                                      |
| `openclaw matrix verify start <id>`        | Iniciar el flujo SAS                                                |
| `openclaw matrix verify sas <id>`          | Imprimir el emoji o los decimales SAS                               |
| `openclaw matrix verify confirm-sas <id>`  | Confirmar que el SAS coincide con lo que muestra el otro cliente    |
| `openclaw matrix verify mismatch-sas <id>` | Rechazar el SAS cuando el emoji o los decimales no coinciden        |
| `openclaw matrix verify cancel <id>`       | Cancelar; acepta `--reason <text>` y `--code <matrix-code>` opcionales |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` y `cancel` aceptan todos `--user-id` y `--room-id` como pistas de seguimiento de MD cuando la verificación está anclada a una sala de mensaje directo específica.

### Notas sobre varias cuentas

Sin `--account <id>`, los comandos de la CLI de Matrix usan la cuenta predeterminada implícita. Si tienes varias cuentas con nombre y no has definido `channels.matrix.defaultAccount`, se negarán a adivinar y te pedirán que elijas. Cuando E2EE está desactivado o no está disponible para una cuenta con nombre, los errores apuntan a la clave de configuración de esa cuenta, por ejemplo `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Comportamiento de inicio">
    Con `encryption: true`, `startupVerification` usa `"if-unverified"` de forma predeterminada. Al inicio, un dispositivo no verificado solicita autoverificación en otro cliente de Matrix, omite duplicados y aplica un periodo de espera (24 horas de forma predeterminada). Ajusta con `startupVerificationCooldownHours` o desactiva con `startupVerification: "off"`.

    El inicio también ejecuta una pasada conservadora de inicialización criptográfica que reutiliza el almacenamiento secreto y la identidad de firma cruzada actuales. Si el estado de inicialización está dañado, OpenClaw intenta una reparación protegida incluso sin `channels.matrix.password`; si el homeserver requiere UIA con contraseña, el inicio registra una advertencia y sigue sin ser fatal. Los dispositivos ya firmados por el propietario se conservan.

    Consulta [Migración de Matrix](/es/channels/matrix-migration) para ver el flujo de actualización completo.

  </Accordion>

  <Accordion title="Avisos de verificación">
    Matrix publica avisos del ciclo de vida de verificación en la sala estricta de verificación por MD como mensajes `m.notice`: solicitud, listo (con orientación "Verificar por emoji"), inicio/finalización y detalles SAS (emoji/decimal) cuando están disponibles.

    Las solicitudes entrantes de otro cliente de Matrix se rastrean y se aceptan automáticamente. Para autoverificación, OpenClaw inicia el flujo SAS automáticamente y confirma su propio lado una vez que la verificación por emoji está disponible; aun así, debes comparar y confirmar "Coinciden" en tu cliente de Matrix.

    Los avisos del sistema de verificación no se reenvían al canal de chat del agente.

  </Accordion>

  <Accordion title="Dispositivo de Matrix eliminado o no válido">
    Si `verify status` dice que el dispositivo actual ya no aparece en el homeserver, crea un nuevo dispositivo de Matrix de OpenClaw. Para inicio de sesión con contraseña:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Para la autenticación con token, crea un token de acceso nuevo en tu cliente Matrix o en la interfaz de administración y luego actualiza OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Sustituye `assistant` por el ID de cuenta del comando que falló, u omite `--account` para usar la cuenta predeterminada.

  </Accordion>

  <Accordion title="Device hygiene">
    Los dispositivos antiguos administrados por OpenClaw pueden acumularse. Enuméralos y depúralos:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE usa la ruta criptográfica Rust oficial de `matrix-js-sdk` con `fake-indexeddb` como shim de IndexedDB. El estado criptográfico persiste en `crypto-idb-snapshot.json` (permisos de archivo restrictivos).

    El estado de runtime cifrado vive bajo `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e incluye el almacén de sincronización, el almacén criptográfico, la clave de recuperación, la instantánea IDB, las vinculaciones de hilos y el estado de verificación de inicio. Cuando cambia el token pero la identidad de la cuenta sigue siendo la misma, OpenClaw reutiliza la mejor raíz existente para que el estado anterior siga visible.

    Una sola raíz antigua de token-hash puede ser una ruta normal de continuidad de rotación de token. Si OpenClaw registra `matrix: multiple populated token-hash storage roots detected`, inspecciona el directorio de la cuenta y archiva las raíces hermanas obsoletas solo después de confirmar que la raíz activa seleccionada está sana. Prefiere mover las raíces obsoletas a un directorio `_archive/` antes que eliminarlas de inmediato.

  </Accordion>
</AccordionGroup>

## Gestión del perfil

Actualiza el perfil propio de Matrix para la cuenta seleccionada:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Puedes pasar ambas opciones en una sola llamada. Matrix acepta directamente URL de avatar `mxc://`; cuando pasas `http://` o `https://`, OpenClaw sube primero el archivo y almacena la URL `mxc://` resuelta en `channels.matrix.avatarUrl` (o en la anulación por cuenta).

## Hilos

Matrix admite hilos nativos de Matrix tanto para respuestas automáticas como para envíos de herramientas de mensaje. Dos controles independientes determinan el comportamiento:

### Enrutamiento de sesión (`sessionScope`)

`dm.sessionScope` decide cómo se asignan las salas DM de Matrix a las sesiones de OpenClaw:

- `"per-user"` (predeterminado): todas las salas DM con el mismo par enrutado comparten una sesión.
- `"per-room"`: cada sala DM de Matrix obtiene su propia clave de sesión, incluso cuando el par es el mismo.

Las vinculaciones explícitas de conversación siempre prevalecen sobre `sessionScope`, por lo que las salas y los hilos vinculados conservan la sesión de destino elegida.

### Hilos de respuesta (`threadReplies`)

`threadReplies` decide dónde publica el bot su respuesta:

- `"off"`: las respuestas son de nivel superior. Los mensajes entrantes en hilos permanecen en la sesión principal.
- `"inbound"`: responde dentro de un hilo solo cuando el mensaje entrante ya estaba en ese hilo.
- `"always"`: responde dentro de un hilo enraizado en el mensaje que lo activó; esa conversación se enruta mediante una sesión con alcance de hilo coincidente desde el primer activador en adelante.

`dm.threadReplies` anula esto solo para DMs; por ejemplo, mantén aislados los hilos de salas mientras mantienes planos los DMs.

### Herencia de hilos y comandos con barra

- Los mensajes entrantes en hilos incluyen el mensaje raíz del hilo como contexto adicional del agente.
- Los envíos de herramientas de mensaje heredan automáticamente el hilo actual de Matrix cuando apuntan a la misma sala (o al mismo destino de usuario DM), salvo que se proporcione un `threadId` explícito.
- La reutilización de destino de usuario DM solo se activa cuando los metadatos de la sesión actual demuestran el mismo par DM en la misma cuenta Matrix; de lo contrario, OpenClaw recurre al enrutamiento normal con alcance de usuario.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y `/acp spawn` vinculado a hilos funcionan en salas y DMs de Matrix.
- `/focus` de nivel superior crea un nuevo hilo de Matrix y lo vincula a la sesión de destino cuando `threadBindings.spawnSessions` está habilitado.
- Ejecutar `/focus` o `/acp spawn --thread here` dentro de un hilo de Matrix existente vincula ese hilo en su lugar.

Cuando OpenClaw detecta que una sala DM de Matrix entra en conflicto con otra sala DM en la misma sesión compartida, publica un `m.notice` único en esa sala que apunta a la vía de escape `/focus` y sugiere un cambio de `dm.sessionScope`. El aviso solo aparece cuando las vinculaciones de hilos están habilitadas.

## Vinculaciones de conversación ACP

Las salas, los DMs y los hilos existentes de Matrix pueden convertirse en espacios de trabajo ACP duraderos sin cambiar la superficie de chat.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del DM, la sala o el hilo existente de Matrix que quieres seguir usando.
- En un DM o sala de Matrix de nivel superior, el DM o la sala actual sigue siendo la superficie de chat y los mensajes futuros se enrutan a la sesión ACP generada.
- Dentro de un hilo de Matrix existente, `--bind here` vincula ese hilo actual en su lugar.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada en su lugar.
- `/acp close` cierra la sesión ACP y elimina la vinculación.

Notas:

- `--bind here` no crea un hilo hijo de Matrix.
- `threadBindings.spawnSessions` controla `/acp spawn --thread auto|here`, donde OpenClaw necesita crear o vincular un hilo hijo de Matrix.

### Configuración de vinculación de hilos

Matrix hereda los valores predeterminados globales de `session.threadBindings` y también admite anulaciones por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Las generaciones de sesiones vinculadas a hilos de Matrix están activadas de forma predeterminada:

- Define `threadBindings.spawnSessions: false` para bloquear que `/focus` de nivel superior y `/acp spawn --thread auto|here` creen o vinculen hilos de Matrix.
- Define `threadBindings.defaultSpawnContext: "isolated"` cuando las generaciones de hilos de subagentes nativos no deban bifurcar la transcripción principal.

## Reacciones

Matrix admite reacciones salientes, notificaciones de reacciones entrantes y reacciones de acuse.

Las herramientas de reacción saliente están controladas por `channels.matrix.actions.reactions`:

- `react` agrega una reacción a un evento de Matrix.
- `reactions` enumera el resumen actual de reacciones para un evento de Matrix.
- `emoji=""` elimina las reacciones propias del bot en ese evento.
- `remove: true` elimina solo la reacción del emoji especificado del bot.

**Orden de resolución** (gana el primer valor definido):

| Ajuste                  | Orden                                                                           |
| ----------------------- | ------------------------------------------------------------------------------- |
| `ackReaction`           | por cuenta → canal → `messages.ackReaction` → fallback de emoji de identidad del agente |
| `ackReactionScope`      | por cuenta → canal → `messages.ackReactionScope` → predeterminado `"group-mentions"` |
| `reactionNotifications` | por cuenta → canal → predeterminado `"own"`                                     |

`reactionNotifications: "own"` reenvía eventos `m.reaction` agregados cuando apuntan a mensajes de Matrix escritos por el bot; `"off"` deshabilita los eventos del sistema de reacciones. Las eliminaciones de reacciones no se sintetizan en eventos del sistema porque Matrix las expone como redacciones, no como eliminaciones independientes de `m.reaction`.

## Contexto de historial

- `channels.matrix.historyLimit` controla cuántos mensajes recientes de la sala se incluyen como `InboundHistory` cuando un mensaje de sala de Matrix activa al agente. Recurre a `messages.groupChat.historyLimit`; si ambos no están definidos, el valor predeterminado efectivo es `0`. Define `0` para deshabilitarlo.
- El historial de salas de Matrix es solo de sala. Los DMs siguen usando el historial normal de sesión.
- El historial de salas de Matrix es solo pendiente: OpenClaw almacena en búfer los mensajes de sala que aún no activaron una respuesta y luego toma una instantánea de esa ventana cuando llega una mención u otro activador.
- El mensaje activador actual no se incluye en `InboundHistory`; permanece en el cuerpo entrante principal de ese turno.
- Los reintentos del mismo evento de Matrix reutilizan la instantánea de historial original en lugar de desplazarse hacia mensajes de sala más recientes.

## Visibilidad del contexto

Matrix admite el control compartido `contextVisibility` para contexto suplementario de sala, como texto de respuesta obtenido, raíces de hilos e historial pendiente.

- `contextVisibility: "all"` es el valor predeterminado. El contexto suplementario se conserva tal como se recibió.
- `contextVisibility: "allowlist"` filtra el contexto suplementario a remitentes permitidos por las comprobaciones activas de allowlist de sala/usuario.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, pero conserva una respuesta citada explícita.

Este ajuste afecta la visibilidad del contexto suplementario, no si el mensaje entrante en sí puede activar una respuesta.
La autorización del activador sigue viniendo de `groupPolicy`, `groups`, `groupAllowFrom` y los ajustes de política de DM.

## Política de DM y salas

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

Para silenciar por completo los DMs mientras mantienes las salas en funcionamiento, define `dm.enabled: false`:

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

Consulta [Grupos](/es/channels/groups) para el comportamiento de control por mención y allowlist.

Ejemplo de emparejamiento para DMs de Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un usuario no aprobado de Matrix sigue enviándote mensajes antes de la aprobación, OpenClaw reutiliza el mismo código de emparejamiento pendiente y puede enviar una respuesta de recordatorio después de un breve tiempo de espera en lugar de acuñar un código nuevo.

Consulta [Emparejamiento](/es/channels/pairing) para el flujo compartido de emparejamiento de DM y la disposición de almacenamiento.

## Reparación directa de salas

Si el estado de mensajes directos se desincroniza, OpenClaw puede terminar con asignaciones `m.direct` obsoletas que apuntan a salas individuales antiguas en lugar del DM activo. Inspecciona la asignación actual de un par:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repárala:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Ambos comandos aceptan `--account <id>` para configuraciones con varias cuentas. El flujo de reparación:

- prefiere un DM 1:1 estricto que ya esté asignado en `m.direct`
- recurre a cualquier DM 1:1 estricto actualmente unido con ese usuario
- crea una sala directa nueva y reescribe `m.direct` si no existe ningún DM sano

No elimina salas antiguas automáticamente. Elige el DM sano y actualiza la asignación para que los envíos futuros de Matrix, los avisos de verificación y otros flujos de mensajes directos apunten a la sala correcta.

## Aprobaciones de ejecución

Matrix puede actuar como cliente de aprobación nativo. Configura bajo `channels.matrix.execApprovals` (o `channels.matrix.accounts.<account>.execApprovals` para una anulación por cuenta):

- `enabled`: entrega aprobaciones mediante prompts nativos de Matrix. Cuando no está definido o es `"auto"`, Matrix se habilita automáticamente una vez que se puede resolver al menos un aprobador. Define `false` para deshabilitarlo explícitamente.
- `approvers`: IDs de usuario de Matrix (`@owner:example.org`) autorizados a aprobar solicitudes de ejecución. Opcional; recurre a `channels.matrix.dm.allowFrom`.
- `target`: dónde van los prompts. `"dm"` (predeterminado) envía a los DMs de aprobadores; `"channel"` envía a la sala o DM de Matrix de origen; `"both"` envía a ambos.
- `agentFilter` / `sessionFilter`: allowlists opcionales de qué agentes/sesiones activan la entrega por Matrix.

La autorización difiere ligeramente entre tipos de aprobación:

- **Aprobaciones de ejecución** usan `execApprovals.approvers`, con fallback a `dm.allowFrom`.
- **Aprobaciones de Plugin** autorizan solo mediante `dm.allowFrom`.

Ambos tipos comparten accesos directos de reacción y actualizaciones de mensajes de Matrix. Los aprobadores ven accesos directos de reacción en el mensaje principal de aprobación:

- `✅` permitir una vez
- `❌` denegar
- `♾️` permitir siempre (cuando la política efectiva de ejecución lo permite)

Comandos slash de respaldo: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Solo los aprobadores resueltos pueden aprobar o denegar. La entrega por canal para aprobaciones de exec incluye el texto del comando; habilita `channel` o `both` solo en salas de confianza.

Relacionado: [Aprobaciones de exec](/es/tools/exec-approvals).

## Comandos slash

Los comandos slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, etc.) funcionan directamente en mensajes directos. En salas, OpenClaw también reconoce comandos que llevan como prefijo la mención Matrix propia del bot, por lo que `@bot:server /new` activa la ruta del comando sin una regex de mención personalizada. Esto mantiene al bot receptivo a las publicaciones de estilo sala `@mention /command` que Element y clientes similares emiten cuando un usuario completa con tabulación el bot antes de escribir el comando.

Las reglas de autorización siguen aplicándose: quienes envían comandos deben satisfacer las mismas políticas de lista de permitidos/propietario para mensajes directos o salas que los mensajes normales.

## Varias cuentas

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

**Herencia:**

- Los valores de nivel superior de `channels.matrix` actúan como valores predeterminados para las cuentas con nombre, salvo que una cuenta los sobrescriba.
- Acota una entrada de sala heredada a una cuenta específica con `groups.<room>.account`. Las entradas sin `account` se comparten entre cuentas; `account: "default"` sigue funcionando cuando la cuenta predeterminada está configurada en el nivel superior.

**Selección de cuenta predeterminada:**

- Define `defaultAccount` para elegir la cuenta con nombre que prefieren el enrutamiento implícito, los sondeos y los comandos de la CLI.
- Si tienes varias cuentas y una se llama literalmente `default`, OpenClaw la usa implícitamente incluso cuando `defaultAccount` no está definido.
- Si tienes varias cuentas con nombre y no se selecciona ninguna predeterminada, los comandos de la CLI se niegan a adivinar; define `defaultAccount` o pasa `--account <id>`.
- El bloque de nivel superior `channels.matrix.*` solo se trata como la cuenta implícita `default` cuando su autenticación está completa (`homeserver` + `accessToken`, o `homeserver` + `userId` + `password`). Las cuentas con nombre siguen siendo detectables desde `homeserver` + `userId` una vez que las credenciales en caché cubren la autenticación.

**Promoción:**

- Cuando OpenClaw promociona una configuración de una sola cuenta a varias cuentas durante la reparación o la configuración inicial, preserva la cuenta con nombre existente si hay una o si `defaultAccount` ya apunta a una. Solo las claves de autenticación/bootstrap de Matrix se mueven a la cuenta promocionada; las claves de política de entrega compartidas permanecen en el nivel superior.

Consulta la [referencia de configuración](/es/gateway/config-channels#multi-account-all-channels) para ver el patrón compartido de varias cuentas.

## Homeservers privados/LAN

De forma predeterminada, OpenClaw bloquea los homeservers Matrix privados/internos para protección contra SSRF, salvo que
optes explícitamente por permitirlos por cuenta.

Si tu homeserver se ejecuta en localhost, una IP de LAN/Tailscale o un nombre de host interno, habilita
`network.dangerouslyAllowPrivateNetwork` para esa cuenta de Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Ejemplo de configuración con CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Esta habilitación explícita solo permite destinos privados/internos de confianza. Los homeservers públicos en texto claro, como
`http://matrix.example.org:8008`, siguen bloqueados. Prefiere `https://` siempre que sea posible.

## Proxy del tráfico de Matrix

Si tu implementación de Matrix necesita un proxy HTTP(S) saliente explícito, define `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Las cuentas con nombre pueden sobrescribir el valor predeterminado de nivel superior con `channels.matrix.accounts.<id>.proxy`.
OpenClaw usa la misma configuración de proxy para el tráfico Matrix en runtime y los sondeos de estado de cuenta.

## Resolución de destino

Matrix acepta estas formas de destino en cualquier lugar donde OpenClaw solicite una sala o un usuario de destino:

- Usuarios: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

Los ID de sala de Matrix distinguen mayúsculas y minúsculas. Usa exactamente la capitalización del ID de sala de Matrix
al configurar destinos de entrega explícitos, tareas Cron, vinculaciones o listas de permitidos.
OpenClaw mantiene canónicas las claves de sesión internas para almacenamiento, por lo que esas claves en minúsculas
no son una fuente fiable para ID de entrega de Matrix.

La búsqueda en directorio en vivo usa la cuenta de Matrix con sesión iniciada:

- Las búsquedas de usuarios consultan el directorio de usuarios de Matrix en ese homeserver.
- Las búsquedas de salas aceptan directamente ID de sala y alias explícitos. La búsqueda por nombre de salas unidas es de mejor esfuerzo y solo se aplica a las listas de permitidos de salas en runtime cuando `dangerouslyAllowNameMatching: true` está definido.
- Si un nombre de sala no puede resolverse a un ID o alias, se ignora en la resolución de listas de permitidos en runtime.

## Referencia de configuración

Los campos de usuario de estilo lista de permitidos (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) aceptan ID de usuario Matrix completos (lo más seguro). Las entradas de usuario que no son ID se ignoran de forma predeterminada. Si defines `dangerouslyAllowNameMatching: true`, las coincidencias exactas de nombres visibles del directorio de Matrix se resuelven al inicio y siempre que la lista de permitidos cambia mientras el monitor está en ejecución; las entradas que no pueden resolverse se ignoran en runtime.

Las claves de lista de permitidos de salas (`groups`, `rooms` heredado) deben ser ID de sala o alias. Las claves con nombres de sala simples se ignoran de forma predeterminada; `dangerouslyAllowNameMatching: true` restaura la búsqueda de mejor esfuerzo contra nombres de salas unidas.

### Cuenta y conexión

- `enabled`: habilita o deshabilita el canal.
- `name`: etiqueta de visualización opcional para la cuenta.
- `defaultAccount`: ID de cuenta preferido cuando se configuran varias cuentas de Matrix.
- `accounts`: sobrescrituras por cuenta con nombre. Los valores de nivel superior de `channels.matrix` se heredan como valores predeterminados.
- `homeserver`: URL del homeserver, por ejemplo `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta cuenta se conecte a `localhost`, IP de LAN/Tailscale o nombres de host internos.
- `proxy`: URL de proxy HTTP(S) opcional para el tráfico de Matrix. Se admite sobrescritura por cuenta.
- `userId`: ID de usuario Matrix completo (`@bot:example.org`).
- `accessToken`: token de acceso para autenticación basada en tokens. Se admiten valores en texto plano y SecretRef en proveedores de env/file/exec ([Gestión de secretos](/es/gateway/secrets)).
- `password`: contraseña para inicio de sesión basado en contraseña. Se admiten valores en texto plano y SecretRef.
- `deviceId`: ID de dispositivo Matrix explícito.
- `deviceName`: nombre visible del dispositivo usado durante el inicio de sesión con contraseña.
- `avatarUrl`: URL de avatar propio almacenada para sincronización de perfil y actualizaciones de `profile set`.
- `initialSyncLimit`: número máximo de eventos recuperados durante la sincronización de inicio.

### Cifrado

- `encryption`: habilita E2EE. Valor predeterminado: `false`.
- `startupVerification`: `"if-unverified"` (predeterminado cuando E2EE está activado) u `"off"`. Solicita automáticamente la autoverificación al inicio cuando este dispositivo no está verificado.
- `startupVerificationCooldownHours`: periodo de enfriamiento antes de la siguiente solicitud automática de inicio. Valor predeterminado: `24`.

### Acceso y política

- `groupPolicy`: `"open"`, `"allowlist"` o `"disabled"`. Valor predeterminado: `"allowlist"`.
- `groupAllowFrom`: lista de permitidos de ID de usuario para tráfico de sala.
- `mentionPatterns`: patrones regex acotados para menciones en salas. Objeto con `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Controla si los `agents.list[].groupChat.mentionPatterns` configurados se aplican por sala.
- `dm.enabled`: cuando es `false`, ignora todos los mensajes directos. Valor predeterminado: `true`.
- `dm.policy`: `"pairing"` (predeterminado), `"allowlist"`, `"open"` o `"disabled"`. Se aplica después de que el bot se haya unido y clasificado la sala como mensaje directo; no afecta la gestión de invitaciones.
- `dm.allowFrom`: lista de permitidos de ID de usuario para tráfico de mensajes directos.
- `dm.sessionScope`: `"per-user"` (predeterminado) o `"per-room"`.
- `dm.threadReplies`: sobrescritura solo para mensajes directos del enhebrado de respuestas (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: acepta mensajes de otras cuentas de bot Matrix configuradas (`true` o `"mentions"`).
- `allowlistOnly`: cuando es `true`, fuerza todas las políticas activas de mensajes directos (excepto `"disabled"`) y las políticas de grupo `"open"` a `"allowlist"`. No cambia las políticas `"disabled"`.
- `dangerouslyAllowNameMatching`: cuando es `true`, permite la búsqueda en el directorio de nombres visibles de Matrix para entradas de listas de permitidos de usuarios y la búsqueda por nombre de salas unidas para claves de listas de permitidos de salas. Prefiere ID completos `@user:server` e ID de sala o alias.
- `autoJoin`: `"always"`, `"allowlist"` u `"off"`. Valor predeterminado: `"off"`. Se aplica a todas las invitaciones de Matrix, incluidas las invitaciones de estilo mensaje directo.
- `autoJoinAllowlist`: salas/alias permitidos cuando `autoJoin` es `"allowlist"`. Las entradas de alias se resuelven contra el homeserver, no contra el estado declarado por la sala invitada.
- `contextVisibility`: visibilidad de contexto suplementaria (`"all"` predeterminado, `"allowlist"`, `"allowlist_quote"`).

### Comportamiento de respuesta

- `replyToMode`: `"off"`, `"first"`, `"all"` o `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` o `"always"`.
- `threadBindings`: sobrescrituras por canal para enrutamiento y ciclo de vida de sesiones vinculadas a hilos.
- `streaming`: `"off"` (predeterminado), `"partial"`, `"quiet"`, `"progress"` o forma de objeto `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: cuando es `true`, los bloques completados del asistente se conservan como mensajes de progreso separados.
- `markdown`: configuración opcional de renderizado de Markdown para texto saliente.
- `responsePrefix`: cadena opcional antepuesta a las respuestas salientes.
- `textChunkLimit`: tamaño de fragmento saliente en caracteres cuando `chunkMode: "length"`. Valor predeterminado: `4000`.
- `chunkMode`: `"length"` (predeterminado, divide por recuento de caracteres) o `"newline"` (divide en límites de línea).
- `historyLimit`: número de mensajes recientes de sala incluidos como `InboundHistory` cuando un mensaje de sala activa el agente. Recurre a `messages.groupChat.historyLimit`; valor predeterminado efectivo `0` (deshabilitado).
- `mediaMaxMb`: límite de tamaño de medios en MB para envíos salientes y procesamiento entrante.

### Configuración de reacciones

- `ackReaction`: sobrescritura de reacción de confirmación para este canal/cuenta.
- `ackReactionScope`: sobrescritura de alcance (`"group-mentions"` predeterminado, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modo de notificación de reacciones entrantes (`"own"` predeterminado, `"off"`).

### Herramientas y sobrescrituras por sala

- `actions`: control de herramientas por acción (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa de políticas por sala. La identidad de sesión usa el ID de sala estable después de la resolución. (`rooms` es un alias heredado.)
  - `groups.<room>.account`: restringe una entrada de sala heredada a una cuenta específica.
  - `groups.<room>.enabled`: conmutador por sala. Cuando es `false`, la sala se ignora como si no estuviera en el mapa.
  - `groups.<room>.requireMention`: anulación por sala del requisito de mención a nivel de canal.
  - `groups.<room>.allowBots`: anulación por sala de la configuración a nivel de canal (`true` o `"mentions"`).
  - `groups.<room>.botLoopProtection`: anulación por sala del presupuesto de protección contra bucles entre bots.
  - `groups.<room>.users`: lista de permitidos de remitentes por sala.
  - `groups.<room>.tools`: anulaciones de permitir/denegar herramientas por sala.
  - `groups.<room>.autoReply`: anulación por sala del control por menciones. `true` desactiva los requisitos de mención para esa sala; `false` fuerza que vuelvan a activarse.
  - `groups.<room>.skills`: filtro de Skills por sala.
  - `groups.<room>.systemPrompt`: fragmento de prompt del sistema por sala.

### Configuración de aprobación de exec

- `execApprovals.enabled`: entrega aprobaciones de exec mediante avisos nativos de Matrix.
- `execApprovals.approvers`: IDs de usuario de Matrix autorizados a aprobar. Recurre a `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (predeterminado), `"channel"` o `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: listas de permitidos opcionales de agentes/sesiones para la entrega.

## Relacionado

- [Resumen de canales](/es/channels) - todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) - autenticación por DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) - comportamiento del chat grupal y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo
