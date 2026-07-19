---
read_when:
    - Configuración de Matrix en OpenClaw
    - Configuración del E2EE y la verificación de Matrix
summary: Estado de compatibilidad, configuración y ejemplos de configuración de Matrix
title: Matrix
x-i18n:
    generated_at: "2026-07-19T01:46:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eabcc867ec210f57f9192b93b7bcb9d02dfb91d19eb73f5a6e3170fdf97ffdc2
    source_path: channels/matrix.md
    workflow: 16
---

Matrix es un plugin de canal descargable (`@openclaw/matrix`) basado en el `matrix-js-sdk` oficial. Admite mensajes directos, salas, hilos, contenido multimedia, reacciones, encuestas, ubicación y E2EE.

## Instalación

```bash
openclaw plugins install @openclaw/matrix
```

Las especificaciones de plugins sin calificador prueban primero ClawHub y, después, recurren a npm. Fuerce un origen con `openclaw plugins install clawhub:@openclaw/matrix` o `npm:@openclaw/matrix`. Desde un checkout local: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` registra y habilita el plugin; no se necesita un paso `enable` independiente. El canal seguirá sin hacer nada hasta que se configure como se indica a continuación. Consulte [Plugins](/es/tools/plugin) para conocer las reglas generales de instalación.

## Configuración

1. Cree una cuenta de Matrix en su servidor de origen.
2. Configure `channels.matrix` con `homeserver` + `accessToken`, o `homeserver` + `userId` + `password`.
3. Reinicie el Gateway.
4. Inicie un mensaje directo con el bot o invítelo a una sala. Las invitaciones nuevas solo se aceptan cuando [`autoJoin`](#auto-join) lo permite.

### Configuración interactiva

```bash
openclaw channels add
openclaw configure --section channels
```

El asistente solicita la URL del servidor de origen, el método de autenticación (token o contraseña), el identificador de usuario (solo para la autenticación mediante contraseña), un nombre de dispositivo opcional, si se debe habilitar E2EE y el acceso a salas y la incorporación automática. Si ya existen variables de entorno `MATRIX_*` coincidentes y la cuenta no tiene ninguna autenticación guardada, el asistente ofrece un acceso directo mediante variables de entorno. Resuelva los nombres de las salas antes de guardar una lista de permitidos con `openclaw channels resolve --channel matrix "Project Room"`. Al habilitar E2EE en el asistente, se ejecuta la misma inicialización que en [`openclaw matrix encryption setup`](#encryption-and-verification).

### Configuración mínima

Basada en tokens:

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

Basada en contraseña (el token se almacena en caché después del primer inicio de sesión):

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

### Incorporación automática

El valor predeterminado de `channels.matrix.autoJoin` es `"off"`: el bot no aparecerá en salas ni mensajes directos nuevos procedentes de invitaciones recientes hasta que se incorpore manualmente. OpenClaw no puede determinar en el momento de la invitación si se trata de un mensaje directo o de un grupo, por lo que todas las invitaciones pasan primero por `autoJoin`; `dm.policy` solo se aplica posteriormente, después de que el bot se haya incorporado y se haya clasificado la sala.

<Warning>
Configure `autoJoin: "allowlist"` junto con `autoJoinAllowlist` para restringir las invitaciones aceptadas, o `autoJoin: "always"` para aceptar todas las invitaciones.

`autoJoinAllowlist` solo acepta `!roomId:server`, `#alias:server` o `*`. Los nombres simples de salas se rechazan; los alias se resuelven mediante el servidor de origen, no mediante el estado que afirma tener la sala de la invitación.
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

### Formatos de destino de las listas de permitidos

- Mensajes directos (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): use `@user:server`. Los nombres para mostrar se ignoran de manera predeterminada (son mutables); configure `dangerouslyAllowNameMatching: true` solo para ofrecer compatibilidad explícita con nombres para mostrar.
- Claves de la lista de salas permitidas (`groups`, alias heredado `rooms`): use `!room:server` o `#alias:server`. Los nombres simples se ignoran a menos que se configure `dangerouslyAllowNameMatching: true`.
- Listas de invitaciones permitidas (`autoJoinAllowlist`): use `!room:server`, `#alias:server` o `*`. Los nombres simples siempre se rechazan.

### Normalización del identificador de cuenta

El asistente convierte un nombre descriptivo en un identificador de cuenta normalizado (`Ops Bot` -> `ops-bot`). Los signos de puntuación se escapan en formato hexadecimal en los nombres de variables de entorno con ámbito para impedir colisiones entre cuentas: `-` (0x2D) se convierte en `_X2D_`, por lo que `ops-prod` se asigna al prefijo de entorno `MATRIX_OPS_X2D_PROD_`.

### Credenciales almacenadas en caché

Matrix almacena en caché las credenciales de la cuenta en el estado compartido del plugin `state/openclaw.sqlite`. Cuando existen credenciales almacenadas en caché, OpenClaw considera que Matrix está configurado incluso sin un `accessToken` en el archivo de configuración; esto abarca la configuración, `openclaw doctor` y las comprobaciones del estado del canal. Las actualizaciones importan los archivos `~/.openclaw/credentials/matrix/credentials*.json` retirados mediante `openclaw doctor --fix`, verifican las filas de SQLite y, a continuación, archivan los archivos.

### Variables de entorno

Variables de entorno respaldadas por claves de configuración, utilizadas cuando la clave de configuración equivalente no está definida. La cuenta predeterminada utiliza nombres sin prefijo; las cuentas con nombre insertan el token de cuenta antes del sufijo (consulte [normalización](#account-id-normalization)).

| Cuenta predeterminada       | Cuenta con nombre (`<ID>` = token de cuenta) |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

Para la cuenta `ops`, los nombres se convierten en `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` y así sucesivamente. `MATRIX_HOMESERVER` (y cualquier variante con ámbito `*_HOMESERVER`) no se puede definir desde un `.env` del espacio de trabajo; consulte [Archivos `.env` del espacio de trabajo](/es/gateway/security).

<Note>
La clave de recuperación no es una variable de entorno respaldada por la configuración: OpenClaw nunca la lee directamente del entorno. El texto orientativo de la CLI sugiere canalizarla mediante una variable del shell denominada `MATRIX_RECOVERY_KEY` para la cuenta predeterminada o `MATRIX_RECOVERY_KEY_<ID>` (identificador de cuenta en mayúsculas sin formato de escape hexadecimal) para una cuenta con nombre; consulte [Verificar este dispositivo con una clave de recuperación](#verify-this-device-with-a-recovery-key).
</Note>

## Ejemplo de configuración

Una base práctica con emparejamiento de mensajes directos, lista de salas permitidas y E2EE:

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
      streaming: { mode: "partial" },
    },
  },
}
```

## Vistas previas de transmisión

La transmisión de respuestas de Matrix es opcional. `streaming.mode` controla cómo entrega OpenClaw la respuesta del asistente mientras se genera; `streaming.block.enabled` controla si cada bloque completado se conserva como un mensaje independiente de Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "partial" },
    },
  },
}
```

Para conservar las vistas previas en directo de la respuesta, pero ocultar las líneas provisionales de herramientas o progreso:

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

La configuración completa acepta `{ mode, chunkMode, block, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // elegir entre las etiquetas configuradas o integradas (false para ocultar)
          labels: ["Thinking", "Writing", "Searching"], // opciones para label: "auto"
          maxLines: 8, // máximo de líneas de progreso sucesivas (valor predeterminado: 8)
          maxLineChars: 120, // máximo de caracteres por línea antes del truncamiento (valor predeterminado: 120)
          toolProgress: true, // mostrar la actividad de herramientas/progreso (valor predeterminado: true)
        },
      },
    },
  },
}
```

- `progress.label`: etiqueta personalizada, `"auto"`/sin definir para elegir una etiqueta configurada o integrada, o `false` para ocultarla.
- `progress.labels`: opciones utilizadas solo cuando `label` es `"auto"` o no está definido.
- `progress.maxLines`: número máximo de líneas de progreso sucesivas que se conservan en el borrador; las líneas más antiguas que superen este límite se recortan.
- `progress.maxLineChars`: número máximo de caracteres por línea compacta de progreso antes del truncamiento.
- `progress.toolProgress`: cuando es `true` (valor predeterminado), la actividad en directo de las herramientas y el progreso aparece en el borrador.

| `streaming.mode`  | Comportamiento                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (valor predeterminado) | Espera la respuesta completa y la envía una vez.                                                                                                                      |
| `"partial"`       | Edita en el mismo lugar un mensaje de texto normal mientras el modelo escribe el bloque actual. Los clientes estándar pueden notificar la primera vista previa, no la edición final.          |
| `"quiet"`         | Igual que `"partial"`, pero el mensaje es un aviso que no genera notificaciones. Los destinatarios reciben una notificación cuando una regla de notificaciones push por usuario coincide con la edición finalizada (consulte más adelante). |
| `"progress"`      | Envía líneas compactas de progreso individuales mediante un borrador de progreso.                                                                                          |

`streaming.block.enabled` (valor predeterminado: `false`) es independiente de `streaming.mode`:

| `streaming.mode`        | `block.enabled: true`                                               | `block.enabled: false` (valor predeterminado)                     |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Borrador en directo del bloque actual; los bloques completados se conservan como mensajes | Borrador en directo del bloque actual, finalizado en el mismo lugar |
| `"off"`                 | Un mensaje de Matrix con notificación por cada bloque terminado                     | Un mensaje de Matrix con notificación para la respuesta completa      |

Notas:

- Si una vista previa supera el límite de tamaño por evento de Matrix, OpenClaw detiene su transmisión y pasa a entregar únicamente la versión final.
- Las respuestas multimedia siempre envían los archivos adjuntos de la forma habitual; si una vista previa obsoleta no se puede reutilizar de forma segura, OpenClaw la censura antes de enviar la respuesta multimedia final.
- Las actualizaciones de la vista previa del progreso de las herramientas están habilitadas de manera predeterminada cuando la transmisión de vistas previas está activa. Configure `streaming.preview.toolProgress: false` para conservar las ediciones de la vista previa del texto de la respuesta, pero mantener el progreso de las herramientas en la ruta de entrega normal.
- Las ediciones de las vistas previas requieren llamadas adicionales a la API de Matrix. Mantenga `streaming.mode: "off"` para obtener el perfil más conservador respecto a los límites de frecuencia.
- Los valores escalares o booleanos heredados de `streaming` y las claves planas `blockStreaming` / `chunkMode` se reescriben con esta estructura anidada mediante `openclaw doctor --fix`.

## Mensajes de voz

Las notas de voz entrantes de Matrix se transcriben antes de la comprobación de menciones de la sala, por lo que una nota de voz que diga el nombre del bot puede activar el agente en una sala `requireMention: true`, y el agente recibe la transcripción en lugar de solo un marcador de posición de archivo adjunto de audio.

Matrix utiliza el proveedor compartido de contenido multimedia de audio en `tools.media.audio`, como `gpt-4o-mini-transcribe` de OpenAI. Consulte [Descripción general de las herramientas multimedia](/es/tools/media-overview) para conocer la configuración y los límites del proveedor.

- Los eventos `m.audio` y los eventos `m.file` con un tipo MIME `audio/*` son aptos.
- En salas cifradas, OpenClaw descifra el archivo adjunto mediante la ruta de contenido multimedia de Matrix existente antes de la transcripción.
- La transcripción se marca como generada automáticamente y no confiable en el prompt del agente.
- El archivo adjunto se marca como ya transcrito para que las herramientas de contenido multimedia posteriores no vuelvan a transcribirlo.
- Establezca `tools.media.audio.enabled: false` para desactivar globalmente la transcripción de audio.

## Metadatos de aprobación

Los prompts de aprobación nativos de Matrix son eventos `m.room.message` normales con contenido específico de OpenClaw bajo la clave `com.openclaw.approval`. Los clientes estándar siguen mostrando el cuerpo del texto; los clientes compatibles con OpenClaw pueden leer el identificador estructurado de la aprobación, el tipo, el estado, las decisiones y los detalles de ejecución o del plugin.

Cuando un prompt es demasiado largo para un solo evento de Matrix, OpenClaw divide el texto visible en fragmentos y adjunta `com.openclaw.approval` únicamente al primer fragmento. Las reacciones de permitir o denegar se vinculan a ese primer evento, por lo que los prompts largos mantienen el mismo objetivo de aprobación que los prompts de un solo evento.

### Reglas push autohospedadas para vistas previas finalizadas silenciosas

`streaming.mode: "quiet"` solo notifica a los destinatarios cuando se finaliza un bloque o turno; una regla push por usuario debe coincidir con el marcador de vista previa finalizada. Consulte [Reglas push de Matrix para vistas previas silenciosas](/es/channels/matrix-push-rules) para ver la configuración completa.

## Salas de bot a bot

De forma predeterminada, se ignoran los mensajes de Matrix procedentes de otras cuentas de Matrix configuradas en OpenClaw. Use `allowBots` para permitir intencionadamente el tráfico entre agentes:

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

- `allowBots: true` acepta mensajes de otras cuentas de bot de Matrix configuradas en las salas permitidas y en los mensajes directos.
- `allowBots: "mentions"` acepta esos mensajes únicamente cuando mencionan visiblemente a este bot en las salas; los mensajes directos siguen permitiéndose en cualquier caso.
- `groups.<room>.allowBots` sustituye la configuración de la cuenta para una sala.
- Los mensajes aceptados de bots configurados usan la [protección contra bucles de bots](/es/channels/bot-loop-protection) compartida. Configure `channels.defaults.botLoopProtection` y, a continuación, sustitúyalo por cuenta con `channels.matrix.botLoopProtection` o por sala con `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw sigue ignorando los mensajes del mismo identificador de usuario de Matrix para evitar bucles de autorrespuesta.
- Matrix no tiene ningún indicador de bot nativo; OpenClaw interpreta «escrito por un bot» como «enviado por otra cuenta de Matrix configurada en este Gateway de OpenClaw».

Use listas estrictas de salas permitidas y requisitos de mención al habilitar el tráfico de bot a bot en salas compartidas.

## Cifrado y verificación

En las salas cifradas (E2EE), los eventos de imágenes salientes usan `thumbnail_file` para que las vistas previas de las imágenes se cifren junto con el archivo adjunto completo; las salas sin cifrar usan `thumbnail_url` sin cifrar. No se requiere ninguna configuración: el plugin detecta automáticamente el estado de E2EE.

Todos los comandos `openclaw matrix` aceptan `--verbose` (diagnósticos completos), `--json` (salida legible por máquinas) y `--account <id>` (configuraciones con varias cuentas). De forma predeterminada, la salida es concisa.

### Habilitar el cifrado

```bash
openclaw matrix encryption setup
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix encryption setup --recovery-key-stdin
```

Inicializa el almacenamiento de secretos y la firma cruzada, crea una copia de seguridad de las claves de las salas si es necesario y, a continuación, muestra el estado y los siguientes pasos. Opciones útiles:

- `--recovery-key-stdin` lee una clave de recuperación desde la entrada estándar sin exponerla en los argumentos del proceso; `--recovery-key <key>` sigue disponible por compatibilidad
- `--force-reset-cross-signing` descarta la identidad de firma cruzada actual y crea una nueva (solo para uso intencionado)

Para una cuenta nueva, habilite E2EE en el momento de crearla:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` es un alias de `--enable-e2ee`. Configuración manual equivalente:

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

`verify status` informa de tres señales de confianza independientes (`--verbose` las muestra todas):

- `Locally trusted`: confiable únicamente para este cliente
- `Cross-signing verified`: el SDK informa de la verificación mediante firma cruzada
- `Signed by owner`: firmado por su propia clave de autofirma (solo para diagnóstico)

`Verified by owner` es `yes` únicamente cuando `Cross-signing verified` es `yes`; la confianza local o la firma de un propietario por sí solas no bastan.

`--allow-degraded-local-state` devuelve diagnósticos de mejor esfuerzo sin preparar primero la cuenta de Matrix; resulta útil para comprobaciones sin conexión o con una configuración parcial.

### Verificar este dispositivo con una clave de recuperación

Canalice la clave de recuperación mediante la entrada estándar en lugar de pasarla en la línea de comandos:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

El comando informa de tres estados:

- `Recovery key accepted`: Matrix aceptó la clave para el almacenamiento de secretos o la confianza del dispositivo.
- `Backup usable`: se puede cargar la copia de seguridad de las claves de las salas con el material de recuperación confiable.
- `Device verified by owner`: este dispositivo tiene plena confianza en la identidad de firma cruzada de Matrix.

Finaliza con un código distinto de cero cuando la confianza plena en la identidad está incompleta, incluso si la clave de recuperación desbloqueó el material de la copia de seguridad. En ese caso, complete la autoverificación desde otro cliente de Matrix:

```bash
openclaw matrix verify self
```

`verify self` espera a `Cross-signing verified: yes` antes de finalizar correctamente. Use `--timeout-ms <ms>` para ajustar la espera.

La forma de clave literal `openclaw matrix verify device "<recovery-key>"` también funciona, pero la clave queda registrada en el historial del shell.

### Inicializar o reparar la firma cruzada

```bash
openclaw matrix verify bootstrap
```

Es el comando de reparación y configuración para cuentas cifradas. En orden:

- inicializa el almacenamiento de secretos y reutiliza una clave de recuperación existente cuando es posible
- inicializa la firma cruzada y carga las claves públicas que faltan
- marca y firma de forma cruzada el dispositivo actual
- crea una copia de seguridad de las claves de las salas en el servidor si aún no existe ninguna

Si el servidor doméstico requiere UIA para cargar las claves de firma cruzada, OpenClaw prueba primero sin autenticación, después con `m.login.dummy` y, por último, con `m.login.password` (requiere `channels.matrix.password`).

Opciones útiles:

- `--recovery-key-stdin` (combínelo con `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`) o `--recovery-key <key>`
- `--force-reset-cross-signing` para descartar la identidad de firma cruzada actual (solo de forma intencionada; requiere que la clave de recuperación activa esté almacenada o se proporcione con `--recovery-key-stdin`)

### Copia de seguridad de las claves de las salas

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` muestra si existe una copia de seguridad en el servidor y si este dispositivo puede descifrarla. `backup restore` importa las claves de las salas respaldadas en el almacén criptográfico local; omita `--recovery-key-stdin` si la clave de recuperación ya está en el disco.

Para sustituir una copia de seguridad dañada por una base de referencia nueva (se acepta la pérdida del historial antiguo irrecuperable; también puede volver a crear el almacenamiento de secretos si no se puede cargar el secreto de la copia de seguridad actual):

```bash
openclaw matrix verify backup reset --yes
```

Añada `--rotate-recovery-key` únicamente cuando se quiera impedir intencionadamente que la clave de recuperación anterior desbloquee la nueva base de referencia de la copia de seguridad.

### Enumerar, solicitar y responder a verificaciones

```bash
openclaw matrix verify list
```

Enumera las solicitudes de verificación pendientes de la cuenta seleccionada.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Envía una solicitud de verificación desde esta cuenta. `--own-user` solicita la autoverificación (acepte el prompt en otro cliente de Matrix del mismo usuario); `--user-id`/`--device-id`/`--room-id` se dirigen a otra persona. `--own-user` no se puede combinar con las demás opciones de destino.

Para gestionar el ciclo de vida a un nivel inferior —normalmente mientras se replican solicitudes entrantes de otro cliente—, estos comandos actúan sobre una solicitud específica `<id>` (mostrada por `verify list` y `verify request`):

| Comando                                    | Finalidad                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Aceptar una solicitud entrante                                           |
| `openclaw matrix verify start <id>`        | Iniciar el flujo SAS                                                  |
| `openclaw matrix verify sas <id>`          | Mostrar los emojis o decimales de SAS                                     |
| `openclaw matrix verify confirm-sas <id>`  | Confirmar que SAS coincide con lo que muestra el otro cliente            |
| `openclaw matrix verify mismatch-sas <id>` | Rechazar SAS cuando los emojis o decimales no coinciden              |
| `openclaw matrix verify cancel <id>`       | Cancelar; acepta opcionalmente `--reason <text>` y `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` y `cancel` aceptan `--user-id` y `--room-id` como indicaciones de seguimiento por mensaje directo cuando la verificación está vinculada a una sala específica de mensajes directos.

### Notas sobre varias cuentas

Sin `--account <id>`, los comandos de la CLI de Matrix usan la cuenta predeterminada implícita. Si hay varias cuentas con nombre y no se especifica `channels.matrix.defaultAccount`, los comandos se niegan a adivinar y solicitan que se elija una. Cuando E2EE está deshabilitado o no está disponible para una cuenta con nombre, los errores señalan la clave de configuración de esa cuenta, por ejemplo, `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Comportamiento al iniciar">
    Con `encryption: true`, `startupVerification` tiene como valor predeterminado `"if-unverified"`. Al iniciar, un dispositivo no verificado solicita la autoverificación en otro cliente de Matrix, omite los duplicados y aplica un período de espera (24 horas de forma predeterminada). Ajústelo con `startupVerificationCooldownHours` o desactívelo con `startupVerification: "off"`.

    El inicio también ejecuta una pasada conservadora de inicialización criptográfica que reutiliza el almacenamiento de secretos y la identidad de firma cruzada actuales. Si el estado de inicialización está dañado, OpenClaw intenta realizar una reparación protegida incluso sin `channels.matrix.password`; si el servidor doméstico requiere UIA con contraseña, el inicio registra una advertencia y el error no es fatal. Se conservan los dispositivos que ya están firmados por el propietario.

    Consulte [Migración de Matrix](/es/channels/matrix-migration) para ver el flujo completo de actualización.

  </Accordion>

  <Accordion title="Avisos de verificación">
    Matrix publica avisos sobre el ciclo de vida de la verificación en la sala estricta de verificación por mensaje directo como mensajes `m.notice`: solicitud, preparación (con indicaciones para «Verificar mediante emojis»), inicio/finalización y detalles de SAS (emojis/decimales) cuando están disponibles.

    Se realiza un seguimiento de las solicitudes entrantes de otro cliente de Matrix y se aceptan automáticamente. Para la autoverificación, OpenClaw inicia automáticamente el flujo SAS y confirma su propio lado cuando está disponible la verificación mediante emojis; aun así, es necesario comparar y confirmar «They match» en el cliente de Matrix.

    Los avisos del sistema de verificación no se reenvían al pipeline de chat del agente.

  </Accordion>

  <Accordion title="Dispositivo de Matrix eliminado o no válido">
    Si `verify status` indica que el dispositivo actual ya no figura en el servidor doméstico, cree un dispositivo de Matrix nuevo para OpenClaw. Para iniciar sesión con contraseña:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Para la autenticación mediante token, cree un token de acceso nuevo en el cliente de Matrix o en la interfaz de administración y, a continuación, actualice OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Sustituya `assistant` por el ID de la cuenta del comando fallido u omita `--account` para usar la cuenta predeterminada.

  </Accordion>

  <Accordion title="Higiene de dispositivos">
    Los dispositivos antiguos gestionados por OpenClaw pueden acumularse. Enumérelos y elimine los obsoletos:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Almacén criptográfico">
    El E2EE de Matrix utiliza la ruta criptográfica oficial de Rust `matrix-js-sdk` con `fake-indexeddb` como capa de compatibilidad de IndexedDB. El estado criptográfico se conserva en `crypto-idb-snapshot.json` (con permisos de archivo restrictivos).

    El estado cifrado del entorno de ejecución se encuentra en `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e incluye el almacén de sincronización, el almacén criptográfico, la clave de recuperación, la instantánea de IDB, las vinculaciones de hilos y el estado de verificación del inicio. Cuando el token cambia, pero la identidad de la cuenta sigue siendo la misma, OpenClaw reutiliza la mejor raíz existente para que el estado anterior permanezca visible.

    Una única raíz anterior basada en el hash del token puede ser una ruta normal de continuidad durante la rotación del token. Si OpenClaw registra `matrix: multiple populated token-hash storage roots detected`, inspeccione el directorio de la cuenta y archive las raíces hermanas obsoletas solo después de confirmar que la raíz activa seleccionada funciona correctamente. Es preferible mover las raíces obsoletas a un directorio `_archive/` en lugar de eliminarlas de inmediato.

  </Accordion>
</AccordionGroup>

## Gestión del perfil

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Pase ambas opciones en una sola llamada. Matrix acepta directamente las URL de avatar `mxc://`; al pasar `http://`/`https://`, primero se carga el archivo y se almacena la URL `mxc://` resuelta en `channels.matrix.avatarUrl` (o en la anulación específica de la cuenta).

## Hilos

Matrix admite hilos nativos tanto para las respuestas automáticas como para los envíos mediante la herramienta de mensajes. Dos opciones independientes controlan el comportamiento:

### Enrutamiento de sesiones (`sessionScope`)

`dm.sessionScope` determina cómo se asignan las salas de mensajes directos de Matrix a las sesiones de OpenClaw:

- `"per-user"` (predeterminado): todas las salas de mensajes directos con el mismo interlocutor enrutado comparten una sesión.
- `"per-room"`: cada sala de mensajes directos de Matrix obtiene su propia clave de sesión, incluso para el mismo interlocutor.

Las vinculaciones explícitas de conversaciones siempre prevalecen sobre `sessionScope`; las salas y los hilos vinculados conservan la sesión de destino elegida.

### Respuestas en hilos (`threadReplies`)

`threadReplies` determina dónde publica el bot su respuesta:

- `"off"`: las respuestas se publican en el nivel superior. Los mensajes entrantes de un hilo permanecen en la sesión principal.
- `"inbound"`: se responde dentro de un hilo solo cuando el mensaje entrante ya estaba en ese hilo.
- `"always"`: se responde dentro de un hilo cuya raíz es el mensaje desencadenante; esa conversación se enruta a través de una sesión correspondiente limitada al hilo desde el primer desencadenante en adelante.

`dm.threadReplies` anula este comportamiento solo para los mensajes directos; por ejemplo, permite mantener aislados los hilos de las salas mientras los mensajes directos permanecen sin hilos.

### Herencia de hilos y comandos con barra

- Los mensajes entrantes de un hilo incluyen el mensaje raíz del hilo como contexto adicional para el agente.
- Los envíos mediante la herramienta de mensajes heredan automáticamente el hilo actual de Matrix cuando se dirigen a la misma sala (o al mismo usuario de mensajes directos), salvo que se proporcione explícitamente un `threadId`.
- La reutilización del usuario de destino de mensajes directos solo se activa cuando los metadatos de la sesión actual demuestran que se trata del mismo interlocutor de mensajes directos en la misma cuenta de Matrix; de lo contrario, OpenClaw recurre al enrutamiento normal limitado al usuario.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y `/acp spawn` vinculado a un hilo funcionan en las salas y los mensajes directos de Matrix.
- `/focus` en el nivel superior crea un nuevo hilo de Matrix y lo vincula a la sesión de destino cuando `threadBindings.spawnSessions` está habilitado.
- Al ejecutar `/focus` o `/acp spawn --thread here` dentro de un hilo existente de Matrix, ese hilo se vincula en el mismo lugar.

Cuando OpenClaw detecta que una sala de mensajes directos de Matrix colisiona con otra sala de mensajes directos en la misma sesión compartida, publica una única notificación `m.notice` que señala la vía de escape `/focus` y sugiere un cambio en `dm.sessionScope`. La notificación solo aparece cuando las vinculaciones de hilos están habilitadas.

## Vinculaciones de conversaciones ACP

Las salas, los mensajes directos y los hilos existentes de Matrix pueden convertirse en espacios de trabajo ACP persistentes sin cambiar la interfaz de chat.

Flujo rápido para operadores:

- Ejecute `/acp spawn codex --bind here` dentro del mensaje directo, la sala o el hilo existente de Matrix que desee seguir usando.
- En un mensaje directo o una sala de nivel superior, el mensaje directo o la sala actuales se mantienen como interfaz de chat, y los mensajes futuros se enrutan a la sesión ACP iniciada.
- Dentro de un hilo existente, `--bind here` vincula ese hilo actual en el mismo lugar.
- `/new` y `/reset` restablecen en el mismo lugar la sesión ACP vinculada.
- `/acp close` cierra la sesión ACP y elimina la vinculación.

`--bind here` no crea un hilo secundario de Matrix. `threadBindings.spawnSessions` controla `/acp spawn --thread auto|here`, para el que OpenClaw necesita crear o vincular un hilo secundario.

### Configuración de vinculaciones de hilos

Matrix hereda los valores predeterminados globales de `session.threadBindings` y admite anulaciones específicas por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: controla tanto el inicio de hilos de subagentes como el de hilos ACP.
- Las claves obsoletas `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions` se migran a `spawnSessions` mediante `openclaw doctor --fix`.
- `threadBindings.defaultSpawnContext`

El inicio de sesiones vinculadas a hilos de Matrix está habilitado de forma predeterminada. Establezca `threadBindings.spawnSessions: false` para impedir que `/focus` y `/acp spawn --thread auto|here` en el nivel superior creen o vinculen hilos de Matrix. Establezca `threadBindings.defaultSpawnContext: "isolated"` cuando el inicio de hilos nativos de subagentes no deba bifurcar la transcripción principal.

## Reacciones

Matrix admite reacciones salientes, notificaciones de reacciones entrantes y reacciones de confirmación.

Las herramientas de reacciones salientes están controladas por `channels.matrix.actions.reactions`:

- `react` añade una reacción a un evento de Matrix.
- `reactions` enumera el resumen actual de reacciones de un evento de Matrix.
- `emoji=""` elimina las reacciones del propio bot en ese evento.
- `remove: true` elimina únicamente la reacción con el emoji especificado del bot.

**Orden de resolución** (se usa el primer valor definido):

| Configuración                 | Orden                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | por cuenta -> canal -> `messages.ackReaction` -> emoji de reserva de la identidad del agente   |
| `ackReactionScope`      | por cuenta -> canal -> `messages.ackReactionScope` -> valor predeterminado `"group-mentions"` |
| `reactionNotifications` | por cuenta -> canal -> valor predeterminado `"own"`                                           |

`reactionNotifications: "own"` reenvía los eventos `m.reaction` añadidos cuando tienen como destino mensajes de Matrix creados por el bot; `"off"` desactiva los eventos del sistema de reacciones. Las eliminaciones de reacciones no se sintetizan como eventos del sistema; Matrix las presenta como censuras, no como eliminaciones independientes de `m.reaction`.

## Contexto del historial

- `channels.matrix.historyLimit` controla cuántos mensajes recientes de la sala se incluyen como `InboundHistory` cuando un mensaje de la sala activa al agente. Recurre a `messages.groupChat.historyLimit`; el valor predeterminado efectivo es `0` si ninguno está configurado (desactivado).
- El historial de las salas de Matrix se limita a la sala; los mensajes directos siguen usando el historial normal de la sesión.
- El historial de la sala solo incluye mensajes pendientes: OpenClaw almacena temporalmente los mensajes de la sala que aún no han activado una respuesta y, cuando llega una mención u otro activador, captura una instantánea de ese intervalo.
- El mensaje activador actual no se incluye en `InboundHistory`; permanece en el cuerpo entrante principal de ese turno.
- Los reintentos del mismo evento de Matrix reutilizan la instantánea original del historial en lugar de avanzar hasta mensajes más recientes de la sala.

## Visibilidad del contexto

Matrix admite el control compartido `contextVisibility` para el contexto complementario de la sala, como el texto recuperado de una respuesta, las raíces de los hilos y el historial pendiente.

- `contextVisibility: "all"` es el valor predeterminado. El contexto complementario se conserva tal como se recibió.
- `contextVisibility: "allowlist"` filtra el contexto complementario para incluir únicamente remitentes permitidos por las comprobaciones activas de las listas de permitidos de la sala o los usuarios.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, pero conserva una respuesta citada explícita.

Esto solo afecta a la visibilidad del contexto complementario, no a si el propio mensaje entrante puede activar una respuesta. La autorización del activador sigue procediendo de `groupPolicy`, `groups`, `groupAllowFrom` y la configuración de la política de mensajes directos.

## Política de mensajes directos y salas

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

Para silenciar por completo los mensajes directos y mantener las salas en funcionamiento, configure `dm.enabled: false`:

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

Consulte [Grupos](/es/channels/groups) para conocer el comportamiento del requisito de mención y las listas de permitidos.

Ejemplo de vinculación para mensajes directos de Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un usuario de Matrix no aprobado sigue enviando mensajes antes de que se conceda la aprobación, OpenClaw reutiliza el mismo código de vinculación pendiente y puede enviar una respuesta de recordatorio después de un breve tiempo de espera, en lugar de generar un código nuevo.

Consulte [Vinculación](/es/channels/pairing) para conocer el flujo compartido de vinculación de mensajes directos y la disposición del almacenamiento.

## Reparación de salas directas

Si el estado de los mensajes directos deja de estar sincronizado, OpenClaw puede acabar con asignaciones `m.direct` obsoletas que apuntan a salas individuales antiguas en lugar del mensaje directo activo. Inspeccione la asignación actual de un interlocutor:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repárela:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Ambos comandos aceptan `--account <id>` para configuraciones con varias cuentas. El flujo de reparación:

- prefiere un mensaje directo estrictamente 1:1 que ya esté asignado en `m.direct`
- recurre a cualquier mensaje directo estrictamente 1:1 con ese usuario al que se haya unido actualmente
- crea una sala directa nueva y reescribe `m.direct` si no existe ningún mensaje directo en buen estado

No elimina automáticamente las salas antiguas. Selecciona el mensaje directo en buen estado y actualiza la asignación para que los futuros envíos de Matrix, avisos de verificación y demás flujos de mensajes directos se dirijan a la sala correcta.

## Aprobaciones de ejecución

Matrix puede actuar como cliente nativo de aprobaciones. Configure esta función en `channels.matrix.execApprovals` (o en `channels.matrix.accounts.<account>.execApprovals` para anularla por cuenta):

- `enabled`: entrega las aprobaciones mediante solicitudes nativas de Matrix. Si no se configura o se establece en `"auto"`, se activa automáticamente cuando puede determinarse al menos un aprobador; establezca `false` para desactivarla explícitamente.
- `approvers`: identificadores de usuario de Matrix (`@owner:example.org`) autorizados para aprobar solicitudes de ejecución. Recurre a `channels.matrix.dm.allowFrom`.
- `target`: destino de las solicitudes. `"dm"` (valor predeterminado) las envía a los mensajes directos de los aprobadores; `"channel"` las envía a la sala o al mensaje directo de origen; `"both"` las envía a ambos.
- `agentFilter` / `sessionFilter`: listas de permitidos opcionales que determinan qué agentes o sesiones activan la entrega mediante Matrix.

La autorización difiere ligeramente según el tipo de aprobación:

- **Las aprobaciones de ejecución** usan `execApprovals.approvers` y recurren a `dm.allowFrom`.
- **Las aprobaciones de plugins** se autorizan únicamente mediante `dm.allowFrom`.

Ambos tipos comparten atajos de reacciones de Matrix y actualizaciones de mensajes. Los aprobadores ven atajos de reacciones en el mensaje principal de aprobación:

- ✅ permitir una vez
- ❌ denegar
- ♾️ permitir siempre (cuando la política efectiva de ejecución lo permite)

Comandos de barra diagonal alternativos: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Solo los aprobadores identificados pueden aprobar o denegar. La entrega al canal de aprobaciones de ejecución incluye el texto del comando; habilite `channel` o `both` únicamente en salas de confianza.

Relacionado: [Aprobaciones de ejecución](/es/tools/exec-approvals).

## Comandos de barra diagonal

Los comandos de barra diagonal (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, etc.) funcionan directamente en los mensajes directos. En las salas, OpenClaw también reconoce comandos con el prefijo de la propia mención de Matrix del bot, por lo que `@bot:server /new` activa la ruta del comando sin una expresión regular de mención personalizada; esto mantiene al bot receptivo a las publicaciones de estilo de sala `@mention /command` que Element y clientes similares emiten cuando un usuario completa con el tabulador el nombre del bot antes de escribir el comando.

Las reglas de autorización siguen vigentes: los remitentes de comandos deben satisfacer las mismas políticas de lista de permitidos o de propietario para mensajes directos o salas que los mensajes normales.

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

- Los valores `channels.matrix` del nivel superior actúan como valores predeterminados para las cuentas con nombre, salvo que una cuenta los sustituya.
- Limite una entrada de sala heredada a una cuenta específica con `groups.<room>.account`. Las entradas sin `account` se comparten entre cuentas; `account: "default"` sigue funcionando cuando la cuenta predeterminada está configurada en el nivel superior.

**Selección de la cuenta predeterminada:**

- Establezca `defaultAccount` para elegir la cuenta con nombre que tendrán preferencia en el enrutamiento implícito, las comprobaciones y los comandos de la CLI.
- Si hay varias cuentas y una se llama literalmente `default`, OpenClaw la usa de forma implícita incluso cuando `defaultAccount` no está definido.
- Con varias cuentas con nombre y ninguna predeterminada seleccionada, los comandos de la CLI se niegan a hacer suposiciones: establezca `defaultAccount` o pase `--account <id>`.
- El bloque `channels.matrix.*` del nivel superior solo se trata como la cuenta `default` implícita cuando su autenticación está completa (`homeserver` + `accessToken`, o `homeserver` + `userId` + `password`). Las cuentas con nombre siguen siendo detectables a partir de `homeserver` + `userId` cuando las credenciales almacenadas en caché cubren la autenticación.

**Promoción:**

- Cuando OpenClaw promociona una configuración de una sola cuenta a varias cuentas durante una reparación o configuración, conserva la cuenta con nombre existente si la hay o si `defaultAccount` ya apunta a una. Solo las claves de autenticación e inicialización de Matrix se trasladan a la cuenta promocionada; las claves compartidas de la política de entrega permanecen en el nivel superior.

Consulte la [Referencia de configuración](/es/gateway/config-channels#multi-account-all-channels) para conocer el patrón compartido de varias cuentas.

## Servidores domésticos privados o de LAN

De forma predeterminada, OpenClaw bloquea los servidores domésticos de Matrix privados o internos para proteger contra SSRF, a menos que se habiliten explícitamente por cuenta.

Si el servidor doméstico se ejecuta en localhost, una IP de LAN/Tailscale o un nombre de host interno, habilite `network.dangerouslyAllowPrivateNetwork` para esa cuenta:

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

Ejemplo de configuración mediante la CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Esta habilitación explícita solo permite destinos privados o internos de confianza. Los servidores domésticos públicos sin cifrado, como `http://matrix.example.org:8008`, siguen bloqueados. Siempre que sea posible, se recomienda `https://`.

## Uso de proxy para el tráfico de Matrix

Si el despliegue de Matrix requiere un proxy HTTP(S) de salida explícito, establezca `channels.matrix.proxy`:

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

Las cuentas con nombre pueden sustituir el valor predeterminado del nivel superior mediante `channels.matrix.accounts.<id>.proxy`. OpenClaw utiliza la misma configuración de proxy para el tráfico de Matrix en tiempo de ejecución y las comprobaciones de estado de las cuentas.

## Resolución de destinos

Matrix acepta estas formas de destino en cualquier lugar donde OpenClaw solicite una sala o un usuario de destino:

- Usuarios: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

Los identificadores de sala de Matrix distinguen entre mayúsculas y minúsculas. Use exactamente las mayúsculas y minúsculas del identificador de sala de Matrix al configurar destinos de entrega explícitos, trabajos de cron, vinculaciones o listas de permitidos. OpenClaw mantiene canónicas las claves internas de sesión para almacenarlas, por lo que esas claves en minúsculas no son una fuente fiable para los identificadores de entrega de Matrix.

La búsqueda en vivo en el directorio utiliza la cuenta de Matrix con la sesión iniciada:

- Las búsquedas de usuarios consultan el directorio de usuarios de Matrix en ese servidor doméstico.
- Las búsquedas de salas aceptan directamente identificadores y alias de sala explícitos. La búsqueda por nombre entre las salas a las que se ha unido es de mejor esfuerzo y solo se aplica a las listas de permitidos de salas en tiempo de ejecución cuando se establece `dangerouslyAllowNameMatching: true`.
- Si un nombre de sala no se puede resolver a un identificador o alias, se ignora durante la resolución de la lista de permitidos en tiempo de ejecución.

## Referencia de configuración

Los campos de usuario de tipo lista de permitidos (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) aceptan identificadores completos de usuario de Matrix (la opción más segura). De forma predeterminada, se ignoran las entradas que no sean identificadores. Si se establece `dangerouslyAllowNameMatching: true`, las coincidencias exactas con nombres para mostrar del directorio de Matrix se resuelven al iniciar y siempre que cambie la lista de permitidos mientras el monitor esté en ejecución; las entradas que no se puedan resolver se ignoran en tiempo de ejecución.

Las claves de la lista de permitidos de salas (`groups`, el valor heredado `rooms`) deben ser identificadores o alias de sala. De forma predeterminada, se ignoran las claves que solo contengan nombres de sala; `dangerouslyAllowNameMatching: true` restablece la búsqueda de mejor esfuerzo entre los nombres de las salas a las que se ha unido.

### Cuenta y conexión

- `enabled`: habilita o deshabilita el canal.
- `name`: etiqueta opcional para mostrar de la cuenta.
- `defaultAccount`: identificador de cuenta preferido cuando hay varias cuentas de Matrix configuradas.
- `accounts`: sustituciones con nombre por cuenta. Los valores `channels.matrix` del nivel superior se heredan como valores predeterminados.
- `homeserver`: URL del servidor doméstico, por ejemplo, `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta cuenta se conecte a `localhost`, IP de LAN/Tailscale o nombres de host internos.
- `proxy`: URL opcional de proxy HTTP(S) para el tráfico de Matrix. Admite la sustitución por cuenta.
- `userId`: identificador completo de usuario de Matrix (`@bot:example.org`).
- `accessToken`: token de acceso para la autenticación basada en tokens. Se admiten valores de texto sin formato y SecretRef en proveedores de entorno, archivo y ejecución ([Gestión de secretos](/es/gateway/secrets)).
- `password`: contraseña para el inicio de sesión basado en contraseña. Se admiten valores de texto sin formato y SecretRef.
- `deviceId`: identificador explícito de dispositivo de Matrix.
- `deviceName`: nombre para mostrar del dispositivo utilizado durante el inicio de sesión con contraseña.
- `avatarUrl`: URL almacenada del avatar propio para la sincronización del perfil y las actualizaciones de `profile set`.
- `initialSyncLimit`: número máximo de eventos obtenidos durante la sincronización inicial.

### Cifrado

- `encryption`: habilita E2EE. Valor predeterminado: `false`.
- `startupVerification`: `"if-unverified"` (valor predeterminado cuando E2EE está activado) o `"off"`. Solicita automáticamente la autoverificación al iniciar cuando este dispositivo no está verificado.
- `startupVerificationCooldownHours`: tiempo de espera antes de la siguiente solicitud automática al iniciar. Valor predeterminado: `24`.

### Acceso y política

- `groupPolicy`: `"open"`, `"allowlist"` o `"disabled"`. Valor predeterminado: `"allowlist"`.
- `groupAllowFrom`: lista de identificadores de usuario permitidos para el tráfico de salas.
- `mentionPatterns`: patrones de expresiones regulares con ámbito para las menciones en salas. Objeto con `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Controla si los valores `agents.list[].groupChat.mentionPatterns` configurados se aplican por sala.
- `dm.enabled`: cuando es `false`, ignora todos los mensajes directos. Valor predeterminado: `true`.
- `dm.policy`: `"pairing"` (valor predeterminado), `"allowlist"`, `"open"` o `"disabled"`. Se aplica después de que el bot se haya unido y haya clasificado la sala como mensaje directo; no afecta a la gestión de invitaciones.
- `dm.allowFrom`: lista de identificadores de usuario permitidos para el tráfico de mensajes directos.
- `dm.sessionScope`: `"per-user"` (valor predeterminado) o `"per-room"`.
- `dm.threadReplies`: sustitución exclusiva para mensajes directos del uso de hilos en las respuestas (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: acepta mensajes de otras cuentas de bot de Matrix configuradas (`true` o `"mentions"`).
- `allowlistOnly`: cuando es `true`, fuerza todas las políticas activas de mensajes directos (excepto `"disabled"`) y las políticas de grupo `"open"` a `"allowlist"`. No cambia las políticas `"disabled"`.
- `dangerouslyAllowNameMatching`: cuando es `true`, permite buscar nombres para mostrar en el directorio de Matrix para las entradas de las listas de usuarios permitidos y buscar los nombres de las salas a las que se ha unido para las claves de las listas de salas permitidas. Se recomienda usar identificadores `@user:server` completos e identificadores o alias de sala.
- `autoJoin`: `"always"`, `"allowlist"` o `"off"`. Valor predeterminado: `"off"`. Se aplica a todas las invitaciones de Matrix, incluidas las invitaciones de tipo mensaje directo.
- `autoJoinAllowlist`: salas o alias permitidos cuando `autoJoin` es `"allowlist"`. Las entradas de alias se resuelven mediante el servidor doméstico, no mediante el estado declarado por la sala que envió la invitación.
- `contextVisibility`: visibilidad del contexto complementario (`"all"` de forma predeterminada, `"allowlist"`, `"allowlist_quote"`).

### Comportamiento de las respuestas

- `replyToMode`: `"off"` (predeterminado), `"first"`, `"all"` o `"batched"`.
- `threadReplies`: `"off"` (el valor predeterminado de nivel superior se resuelve como `"inbound"` salvo que se establezca explícitamente), `"inbound"` o `"always"`.
- `threadBindings`: anulaciones por canal para el enrutamiento y el ciclo de vida de sesiones vinculadas a hilos.
- `streaming`: objeto anidado `{ mode, chunkMode, block: { enabled, coalesce }, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `mode` es `"off"` (predeterminado), `"partial"`, `"quiet"` o `"progress"`. Las formas escalares/booleanas heredadas se migran mediante `openclaw doctor --fix`.
- `streaming.block.enabled`: cuando es `true`, los bloques completados del asistente se conservan como mensajes de progreso separados. Valor predeterminado: `false`.
- `markdown`: configuración opcional de renderizado de Markdown para el texto saliente.
- `responsePrefix`: cadena opcional que se antepone a las respuestas salientes.
- `textChunkLimit`: tamaño de fragmento saliente en caracteres cuando `streaming.chunkMode: "length"`. Valor predeterminado: `4000`.
- `streaming.chunkMode`: `"length"` (predeterminado, divide según el número de caracteres) o `"newline"` (divide en los límites de línea).
- `historyLimit`: número de mensajes recientes de la sala incluidos como `InboundHistory` cuando un mensaje de la sala activa el agente. Recurre a `messages.groupChat.historyLimit`; valor predeterminado efectivo `0` (deshabilitado).
- `mediaMaxMb`: límite de tamaño de los archivos multimedia en MB para los envíos salientes y el procesamiento entrante. Valor predeterminado: `20`.

### Configuración de reacciones

- `ackReaction`: anulación de la reacción de confirmación para este canal/cuenta.
- `ackReactionScope`: anulación del ámbito (`"group-mentions"` predeterminado, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modo de notificación de reacciones entrantes (`"own"` predeterminado, `"off"`).

### Herramientas y anulaciones por sala

- `actions`: control de herramientas por acción (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa de políticas por sala. La identidad de sesión utiliza el ID estable de la sala después de la resolución. (`rooms` es un alias heredado).
  - `groups.<room>.account`: restringe una entrada de sala heredada a una cuenta específica.
  - `groups.<room>.enabled`: opción por sala. Cuando es `false`, la sala se ignora como si no estuviera en el mapa.
  - `groups.<room>.requireMention`: anulación por sala del requisito de mención del canal.
  - `groups.<room>.allowBots`: anulación por sala de la configuración del canal (`true` o `"mentions"`).
  - `groups.<room>.botLoopProtection`: anulación por sala del presupuesto de protección contra bucles entre bots.
  - `groups.<room>.users`: lista de remitentes permitidos por sala.
  - `groups.<room>.tools`: anulaciones por sala para permitir/denegar herramientas.
  - `groups.<room>.autoReply`: anulación por sala del control mediante menciones. `true` deshabilita los requisitos de mención para esa sala; `false` vuelve a imponerlos.
  - `groups.<room>.skills`: filtro de Skills por sala.
  - `groups.<room>.systemPrompt`: fragmento del prompt del sistema por sala.

### Configuración de aprobación de ejecución

- `execApprovals.enabled`: entrega las aprobaciones de ejecución mediante solicitudes nativas de Matrix.
- `execApprovals.approvers`: ID de usuario de Matrix autorizados para aprobar. Recurre a `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (predeterminado), `"channel"` o `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: listas opcionales de agentes/sesiones permitidos para la entrega.

## Contenido relacionado

- [Descripción general de los canales](/es/channels) - todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) - autenticación por mensaje directo y flujo de emparejamiento
- [Grupos](/es/channels/groups) - comportamiento de los chats grupales y control mediante menciones
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo de la seguridad
