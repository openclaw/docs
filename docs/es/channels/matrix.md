---
read_when:
    - Configurar Matrix en OpenClaw
    - Configuración de E2EE y verificación de Matrix
summary: Estado de soporte, configuración y ejemplos de configuración de Matrix
title: Matriz
x-i18n:
    generated_at: "2026-07-05T11:02:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix es un plugin de canal descargable (`@openclaw/matrix`) basado en el `matrix-js-sdk` oficial. Admite MD, salas, hilos, multimedia, reacciones, encuestas, ubicación y E2EE.

## Instalar

```bash
openclaw plugins install @openclaw/matrix
```

Las especificaciones de plugin simples prueban ClawHub primero y luego recurren a npm. Fuerza un origen con `openclaw plugins install clawhub:@openclaw/matrix` o `npm:@openclaw/matrix`. Desde un checkout local: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` registra y habilita el plugin; no se necesita un paso `enable` separado. El canal sigue sin hacer nada hasta que se configure abajo. Consulta [Plugins](/es/tools/plugin) para ver las reglas generales de instalación.

## Configuración

1. Crea una cuenta de Matrix en tu homeserver.
2. Configura `channels.matrix` con `homeserver` + `accessToken`, o `homeserver` + `userId` + `password`.
3. Reinicia el Gateway.
4. Inicia un MD con el bot, o invítalo a una sala. Las invitaciones nuevas solo entran cuando [`autoJoin`](#auto-join) las permite.

### Configuración interactiva

```bash
openclaw channels add
openclaw configure --section channels
```

El asistente solicita la URL del homeserver, el método de autenticación (token o contraseña), el ID de usuario (solo autenticación con contraseña), un nombre de dispositivo opcional, si se habilita E2EE y el acceso a salas/auto-unión. Si ya existen variables de entorno `MATRIX_*` coincidentes y la cuenta no tiene autenticación guardada, el asistente ofrece un acceso directo mediante variable de entorno. Resuelve los nombres de sala antes de guardar una lista de permitidos con `openclaw channels resolve --channel matrix "Project Room"`. Habilitar E2EE en el asistente ejecuta el mismo bootstrap que [`openclaw matrix encryption setup`](#encryption-and-verification).

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

Basada en contraseña (el token se almacena en caché tras el primer inicio de sesión):

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

### Auto-unión

`channels.matrix.autoJoin` tiene `"off"` como valor predeterminado: el bot no aparecerá en salas nuevas ni en MD de invitaciones nuevas hasta que te unas manualmente. OpenClaw no puede saber en el momento de la invitación si una invitación es un MD o un grupo, así que cada invitación pasa primero por `autoJoin`; `dm.policy` solo se aplica después, cuando el bot ya se ha unido y la sala se ha clasificado.

<Warning>
Define `autoJoin: "allowlist"` más `autoJoinAllowlist` para restringir las invitaciones aceptadas, o `autoJoin: "always"` para aceptar todas las invitaciones.

`autoJoinAllowlist` acepta solo `!roomId:server`, `#alias:server` o `*`. Los nombres simples de sala se rechazan; los alias se resuelven contra el homeserver, no contra el estado que afirma la sala invitada.
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

### Formatos de destino de lista de permitidos

- MD (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): usa `@user:server`. Los nombres para mostrar se ignoran de forma predeterminada (mutables); define `dangerouslyAllowNameMatching: true` solo para compatibilidad explícita con nombres para mostrar.
- Claves de lista de permitidos de sala (`groups`, alias heredado `rooms`): usa `!room:server` o `#alias:server`. Los nombres simples se ignoran salvo que `dangerouslyAllowNameMatching: true`.
- Listas de permitidos de invitaciones (`autoJoinAllowlist`): usa `!room:server`, `#alias:server` o `*`. Los nombres simples siempre se rechazan.

### Normalización del ID de cuenta

El asistente convierte un nombre legible en un ID de cuenta normalizado (`Ops Bot` -> `ops-bot`). La puntuación se escapa en hexadecimal en nombres de variables de entorno con ámbito para que las cuentas no colisionen: `-` (0x2D) se convierte en `_X2D_`, así que `ops-prod` se asigna al prefijo de entorno `MATRIX_OPS_X2D_PROD_`.

### Credenciales en caché

Matrix almacena credenciales en caché bajo `~/.openclaw/credentials/matrix/`: `credentials.json` para la cuenta predeterminada, `credentials-<account>.json` para cuentas con nombre. Cuando existen credenciales en caché, OpenClaw trata Matrix como configurado incluso sin un `accessToken` en el archivo de configuración; esto cubre la configuración, `openclaw doctor` y las sondas de estado de canal.

### Variables de entorno

Variables de entorno respaldadas por claves de configuración, usadas cuando la clave de configuración equivalente no está definida. La cuenta predeterminada usa nombres sin prefijo; las cuentas con nombre insertan el token de cuenta antes del sufijo (consulta [normalización](#account-id-normalization)).

| Cuenta predeterminada | Cuenta con nombre (`<ID>` = token de cuenta) |
| --------------------- | -------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                     |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                   |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                        |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                       |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                      |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                    |

Para la cuenta `ops`, los nombres se convierten en `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, etc. `MATRIX_HOMESERVER` (y cualquier variante con ámbito `*_HOMESERVER`) no se puede definir desde un `.env` de workspace; consulta [Archivos `.env` de workspace](/es/gateway/security).

<Note>
La clave de recuperación no es una variable de entorno respaldada por configuración: OpenClaw nunca la lee del entorno por sí mismo. El texto de guía de la CLI sugiere pasarla por una variable de shell llamada `MATRIX_RECOVERY_KEY` para la cuenta predeterminada, o `MATRIX_RECOVERY_KEY_<ID>` (ID de cuenta en mayúsculas simple, sin escape hexadecimal) para una cuenta con nombre; consulta [Verificar este dispositivo con una clave de recuperación](#verify-this-device-with-a-recovery-key).
</Note>

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

El streaming de respuestas de Matrix es optativo. `streaming` controla cómo OpenClaw entrega la respuesta del asistente en curso; `blockStreaming` controla si cada bloque completado se conserva como su propio mensaje de Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Para conservar vistas previas de respuestas en vivo pero ocultar líneas provisionales de herramientas/progreso, usa la forma de objeto:

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

- `progress.label`: etiqueta personalizada, `"auto"`/sin definir para elegir una etiqueta configurada o integrada, o `false` para ocultarla.
- `progress.labels`: candidatas usadas solo cuando `label` es `"auto"` o está sin definir.
- `progress.maxLines`: máximo de líneas de progreso rotativas conservadas en el borrador; las líneas más antiguas se recortan al superar este límite.
- `progress.maxLineChars`: máximo de caracteres por línea de progreso compacta antes del truncamiento.
- `progress.toolProgress`: cuando es `true` (predeterminado), la actividad en vivo de herramientas/progreso aparece en el borrador.

| `streaming`             | Comportamiento                                                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (predeterminado) | Espera la respuesta completa y la envía una vez. `true` <-> `"partial"`, `false` <-> `"off"`.                                                                     |
| `"partial"`             | Edita un mensaje de texto normal en el sitio mientras el modelo escribe el bloque actual. Los clientes estándar pueden notificar en la primera vista previa, no en la edición final. |
| `"quiet"`               | Igual que `"partial"`, pero el mensaje es un aviso sin notificación. Los destinatarios reciben notificación cuando una regla push por usuario coincide con la edición finalizada (ver abajo). |
| `"progress"`            | Envía líneas de progreso compactas individuales usando un borrador de progreso.                                                                                    |

`blockStreaming` (predeterminado `false`) es independiente de `streaming`:

| `streaming`             | `blockStreaming: true`                                                   | `blockStreaming: false` (predeterminado)             |
| ----------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Borrador en vivo para el bloque actual, bloques completados conservados como mensajes | Borrador en vivo para el bloque actual, finalizado en el sitio |
| `"off"`                 | Un mensaje de Matrix con notificación por cada bloque terminado          | Un mensaje de Matrix con notificación para la respuesta completa |

Notas:

- Si una vista previa supera el límite de tamaño por evento de Matrix, OpenClaw detiene el streaming de vistas previas y recurre a la entrega solo final.
- Las respuestas multimedia siempre envían adjuntos normalmente; si una vista previa obsoleta no se puede reutilizar de forma segura, OpenClaw la redacta antes de enviar la respuesta multimedia final.
- Las actualizaciones de vista previa de progreso de herramientas están activadas de forma predeterminada cuando el streaming de vistas previas está activo. Define `streaming.preview.toolProgress: false` para conservar las ediciones de vista previa para el texto de respuesta pero dejar el progreso de herramientas en la ruta de entrega normal.
- Las ediciones de vista previa cuestan llamadas adicionales a la API de Matrix. Deja `streaming: "off"` para el perfil de límite de frecuencia más conservador.

## Mensajes de voz

Las notas de voz entrantes de Matrix se transcriben antes de la barrera de mención de sala, así que una nota de voz que diga el nombre del bot puede activar el agente en una sala con `requireMention: true`, y el agente recibe la transcripción en lugar de solo un marcador de posición de adjunto de audio.

Matrix usa el proveedor multimedia de audio compartido bajo `tools.media.audio`, como OpenAI `gpt-4o-mini-transcribe`. Consulta [Resumen de herramientas multimedia](/es/tools/media-overview) para ver la configuración y los límites del proveedor.

- Los eventos `m.audio` y los eventos `m.file` con un tipo MIME `audio/*` son elegibles.
- En salas cifradas, OpenClaw descifra el adjunto mediante la ruta multimedia de Matrix existente antes de la transcripción.
- La transcripción se marca como generada por máquina y no confiable en el prompt del agente.
- El adjunto se marca como ya transcrito para que las herramientas multimedia posteriores no lo vuelvan a transcribir.
- Define `tools.media.audio.enabled: false` para deshabilitar la transcripción de audio globalmente.

## Metadatos de aprobación

Los prompts de aprobación nativos de Matrix son eventos `m.room.message` normales con contenido específico de OpenClaw bajo la clave `com.openclaw.approval`. Los clientes estándar siguen representando el cuerpo de texto; los clientes compatibles con OpenClaw pueden leer el ID de aprobación estructurado, el tipo, el estado, las decisiones y los detalles de exec/plugin.

Cuando un prompt es demasiado largo para un evento de Matrix, OpenClaw divide el texto visible en fragmentos y adjunta `com.openclaw.approval` solo al primer fragmento. Las reacciones de permitir/denegar se vinculan a ese primer evento, así que los prompts largos conservan el mismo destino de aprobación que los prompts de un solo evento.

### Reglas de push autohospedadas para vistas previas finalizadas silenciosas

`streaming: "quiet"` solo notifica a los destinatarios una vez que un bloque o turno está finalizado: una regla de push por usuario debe coincidir con el marcador de vista previa finalizada. Consulta [Reglas de push de Matrix para vistas previas silenciosas](/es/channels/matrix-push-rules) para ver la receta completa.

## Salas de bot a bot

De forma predeterminada, se ignoran los mensajes de Matrix procedentes de otras cuentas de Matrix de OpenClaw configuradas. Usa `allowBots` para permitir intencionalmente el tráfico entre agentes:

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
- `allowBots: "mentions"` acepta esos mensajes solo cuando mencionan visiblemente a este bot en salas; los MD siguen permitidos de todos modos.
- `groups.<room>.allowBots` reemplaza la configuración de nivel de cuenta para una sala.
- Los mensajes aceptados de bots configurados usan la [protección compartida contra bucles de bot](/es/channels/bot-loop-protection). Configura `channels.defaults.botLoopProtection` y luego reemplaza por cuenta con `channels.matrix.botLoopProtection` o por sala con `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw sigue ignorando los mensajes del mismo ID de usuario de Matrix para evitar bucles de autorrespuesta.
- Matrix no tiene una marca nativa de bot; OpenClaw trata "escrito por bot" como "enviado por otra cuenta de Matrix configurada en este gateway de OpenClaw".

Usa listas estrictas de salas permitidas y requisitos de mención al habilitar tráfico de bot a bot en salas compartidas.

## Cifrado y verificación

En salas cifradas (E2EE), los eventos de imagen salientes usan `thumbnail_file` para que las vistas previas de imágenes se cifren junto con el adjunto completo; las salas sin cifrar usan `thumbnail_url` sin formato. No hace falta configuración: el plugin detecta automáticamente el estado E2EE.

Todos los comandos `openclaw matrix` aceptan `--verbose` (diagnósticos completos), `--json` (salida legible por máquina) y `--account <id>` (configuraciones con varias cuentas). La salida es concisa de forma predeterminada.

### Habilitar cifrado

```bash
openclaw matrix encryption setup
```

Inicializa el almacenamiento secreto y la firma cruzada, crea una copia de seguridad de claves de sala si es necesario y luego muestra el estado y los siguientes pasos. Banderas útiles:

- `--recovery-key <key>` aplica una clave de recuperación antes de la inicialización (prefiere la forma por stdin siguiente)
- `--force-reset-cross-signing` descarta la identidad de firma cruzada actual y crea una nueva (solo uso intencional)

Para una cuenta nueva, habilita E2EE en el momento de la creación:

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

`verify status` informa tres señales de confianza independientes (`--verbose` las muestra todas):

- `Locally trusted`: confiable solo para este cliente
- `Cross-signing verified`: el SDK informa verificación mediante firma cruzada
- `Signed by owner`: firmado por tu propia clave de autofirma (solo diagnóstico)

`Verified by owner` es `yes` solo cuando `Cross-signing verified` es `yes`; la confianza local o una firma de propietario por sí solas no bastan.

`--allow-degraded-local-state` devuelve diagnósticos de mejor esfuerzo sin preparar primero la cuenta de Matrix; es útil para sondeos sin conexión o parcialmente configurados.

### Verificar este dispositivo con una clave de recuperación

Canaliza la clave de recuperación mediante stdin en lugar de pasarla por la línea de comandos:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

El comando informa tres estados:

- `Recovery key accepted`: Matrix aceptó la clave para almacenamiento secreto o confianza del dispositivo.
- `Backup usable`: la copia de seguridad de claves de sala puede cargarse con el material de recuperación confiable.
- `Device verified by owner`: este dispositivo tiene confianza completa de identidad de firma cruzada de Matrix.

Sale con código distinto de cero cuando la confianza de identidad completa está incompleta, aunque la clave de recuperación haya desbloqueado material de copia de seguridad. En ese caso, termina la autoverificación desde otro cliente de Matrix:

```bash
openclaw matrix verify self
```

`verify self` espera a que `Cross-signing verified: yes` sea verdadero antes de salir correctamente. Usa `--timeout-ms <ms>` para ajustar la espera.

La forma con clave literal `openclaw matrix verify device "<recovery-key>"` también funciona, pero la clave queda en el historial del shell.

### Inicializar o reparar la firma cruzada

```bash
openclaw matrix verify bootstrap
```

El comando de reparación/configuración para cuentas cifradas. En orden:

- inicializa el almacenamiento secreto, reutilizando una clave de recuperación existente cuando sea posible
- inicializa la firma cruzada y sube las claves públicas faltantes
- marca y firma de forma cruzada el dispositivo actual
- crea una copia de seguridad de claves de sala en el servidor si todavía no existe

Si el homeserver requiere UIA para subir claves de firma cruzada, OpenClaw intenta primero sin autenticación, luego `m.login.dummy` y luego `m.login.password` (requiere `channels.matrix.password`).

Banderas útiles:

- `--recovery-key-stdin` (combínala con `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`) o `--recovery-key <key>`
- `--force-reset-cross-signing` para descartar la identidad de firma cruzada actual (solo intencional; requiere la clave de recuperación activa almacenada o suministrada con `--recovery-key-stdin`)

### Copia de seguridad de claves de sala

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` muestra si existe una copia de seguridad en el servidor y si este dispositivo puede descifrarla. `backup restore` importa claves de sala respaldadas al almacén criptográfico local; omite `--recovery-key-stdin` si la clave de recuperación ya está en disco.

Para reemplazar una copia de seguridad rota con una línea base nueva (acepta perder historial antiguo irrecuperable; también puede recrear el almacenamiento secreto si el secreto de la copia de seguridad actual no puede cargarse):

```bash
openclaw matrix verify backup reset --yes
```

Añade `--rotate-recovery-key` solo cuando la clave de recuperación anterior deba dejar intencionalmente de desbloquear la nueva línea base de copia de seguridad.

### Listar, solicitar y responder a verificaciones

```bash
openclaw matrix verify list
```

Lista las solicitudes de verificación pendientes para la cuenta seleccionada.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Envía una solicitud de verificación desde esta cuenta. `--own-user` solicita autoverificación (acepta el aviso en otro cliente de Matrix del mismo usuario); `--user-id`/`--device-id`/`--room-id` apuntan a otra persona. `--own-user` no puede combinarse con las otras banderas de destino.

Para un manejo de ciclo de vida de nivel inferior, normalmente al seguir solicitudes entrantes desde otro cliente, estos comandos actúan sobre una solicitud específica `<id>` (impresa por `verify list` y `verify request`):

| Comando                                    | Propósito                                                           |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Aceptar una solicitud entrante                                      |
| `openclaw matrix verify start <id>`        | Iniciar el flujo SAS                                                |
| `openclaw matrix verify sas <id>`          | Imprimir los emoji o decimales SAS                                  |
| `openclaw matrix verify confirm-sas <id>`  | Confirmar que el SAS coincide con lo que muestra el otro cliente    |
| `openclaw matrix verify mismatch-sas <id>` | Rechazar el SAS cuando los emoji o decimales no coinciden           |
| `openclaw matrix verify cancel <id>`       | Cancelar; acepta `--reason <text>` y `--code <matrix-code>` opcionales |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` y `cancel` aceptan `--user-id` y `--room-id` como pistas de seguimiento por MD cuando la verificación está anclada a una sala específica de mensajes directos.

### Notas de varias cuentas

Sin `--account <id>`, los comandos de CLI de Matrix usan la cuenta predeterminada implícita. Con varias cuentas con nombre y sin `channels.matrix.defaultAccount`, los comandos se niegan a adivinar y piden que elijas. Cuando E2EE está deshabilitado o no disponible para una cuenta con nombre, los errores apuntan a la clave de configuración de esa cuenta, por ejemplo `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Con `encryption: true`, `startupVerification` toma `"if-unverified"` como valor predeterminado. Al iniciar, un dispositivo no verificado solicita autoverificación en otro cliente de Matrix, omite duplicados y aplica un enfriamiento (24 horas de forma predeterminada). Ajústalo con `startupVerificationCooldownHours` o desactívalo con `startupVerification: "off"`.

    El inicio también ejecuta una pasada conservadora de inicialización criptográfica que reutiliza el almacenamiento secreto y la identidad de firma cruzada actuales. Si el estado de inicialización está roto, OpenClaw intenta una reparación protegida incluso sin `channels.matrix.password`; si el homeserver requiere UIA con contraseña, el inicio registra una advertencia y no falla. Los dispositivos ya firmados por el propietario se conservan.

    Consulta [Migración de Matrix](/es/channels/matrix-migration) para ver el flujo de actualización completo.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix publica avisos de ciclo de vida de verificación en la sala estricta de verificación por MD como mensajes `m.notice`: solicitud, listo (con orientación de "Verificar por emoji"), inicio/finalización y detalles de SAS (emoji/decimal) cuando están disponibles.

    Las solicitudes entrantes de otro cliente de Matrix se rastrean y se aceptan automáticamente. Para autoverificación, OpenClaw inicia el flujo SAS automáticamente y confirma su propio lado una vez que la verificación por emoji está disponible; aún debes comparar y confirmar "Coinciden" en tu cliente de Matrix.

    Los avisos del sistema de verificación no se reenvían al canal de chat del agente.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Si `verify status` indica que el dispositivo actual ya no aparece en el homeserver, crea un nuevo dispositivo de Matrix de OpenClaw. Para inicio de sesión con contraseña:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Para autenticación con token, crea un token de acceso nuevo en tu cliente de Matrix o UI de administración y luego actualiza OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Reemplaza `assistant` por el ID de cuenta del comando fallido, u omite `--account` para la cuenta predeterminada.

  </Accordion>

  <Accordion title="Device hygiene">
    Los dispositivos antiguos administrados por OpenClaw pueden acumularse. Lista y depura:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    E2EE de Matrix usa la ruta criptográfica oficial Rust de `matrix-js-sdk` con `fake-indexeddb` como shim de IndexedDB. El estado criptográfico persiste en `crypto-idb-snapshot.json` (permisos de archivo restrictivos).

    El estado de tiempo de ejecución cifrado vive bajo `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e incluye el almacén de sincronización, el almacén criptográfico, la clave de recuperación, la instantánea IDB, las vinculaciones de hilos y el estado de verificación de inicio. Cuando el token cambia pero la identidad de la cuenta sigue siendo la misma, OpenClaw reutiliza la mejor raíz existente para que el estado anterior siga visible.

    Una única raíz antigua de hash de token puede ser una ruta normal de continuidad de rotación de tokens. Si OpenClaw registra `matrix: multiple populated token-hash storage roots detected`, inspecciona el directorio de la cuenta y archiva las raíces hermanas obsoletas solo después de confirmar que la raíz activa seleccionada está en buen estado. Prefiere mover las raíces obsoletas a un directorio `_archive/` en lugar de eliminarlas de inmediato.

  </Accordion>
</AccordionGroup>

## Gestión de perfiles

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Pasa ambas opciones en una sola llamada. Matrix acepta URL de avatar `mxc://` directamente; al pasar `http://`/`https://`, primero se sube el archivo y se almacena la URL `mxc://` resuelta en `channels.matrix.avatarUrl` (o la anulación por cuenta).

## Hilos

Matrix admite hilos nativos tanto para respuestas automáticas como para envíos de herramientas de mensajes. Dos controles independientes definen el comportamiento:

### Enrutamiento de sesiones (`sessionScope`)

`dm.sessionScope` decide cómo las salas de DM de Matrix se asignan a sesiones de OpenClaw:

- `"per-user"` (predeterminado): todas las salas de DM con el mismo par enrutado comparten una sesión.
- `"per-room"`: cada sala de DM de Matrix obtiene su propia clave de sesión, incluso para el mismo par.

Los enlaces explícitos de conversación siempre prevalecen sobre `sessionScope`; las salas e hilos enlazados conservan la sesión de destino elegida.

### Respuestas en hilos (`threadReplies`)

`threadReplies` decide dónde publica el bot su respuesta:

- `"off"`: las respuestas son de nivel superior. Los mensajes entrantes en hilos permanecen en la sesión principal.
- `"inbound"`: responde dentro de un hilo solo cuando el mensaje entrante ya estaba en ese hilo.
- `"always"`: responde dentro de un hilo con raíz en el mensaje que lo activó; esa conversación se enruta mediante una sesión correspondiente con alcance de hilo desde el primer activador en adelante.

`dm.threadReplies` anula esto solo para DMs; por ejemplo, para mantener aislados los hilos de sala mientras los DMs permanecen planos.

### Herencia de hilos y comandos slash

- Los mensajes entrantes en hilos incluyen el mensaje raíz del hilo como contexto adicional para el agente.
- Los envíos de herramientas de mensajes heredan automáticamente el hilo actual de Matrix al dirigirse a la misma sala (o al mismo destino de usuario de DM), a menos que se proporcione un `threadId` explícito.
- La reutilización de destinos de usuario de DM solo se activa cuando los metadatos de la sesión actual demuestran el mismo par de DM en la misma cuenta de Matrix; de lo contrario, OpenClaw recurre al enrutamiento normal con alcance de usuario.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y `/acp spawn` enlazado a hilos funcionan en salas y DMs de Matrix.
- `/focus` de nivel superior crea un nuevo hilo de Matrix y lo enlaza a la sesión de destino cuando `threadBindings.spawnSessions` está habilitado.
- Ejecutar `/focus` o `/acp spawn --thread here` dentro de un hilo de Matrix existente enlaza ese hilo en su lugar.

Cuando OpenClaw detecta una sala de DM de Matrix que colisiona con otra sala de DM en la misma sesión compartida, publica un `m.notice` único que apunta a la salida de emergencia `/focus` y sugiere un cambio de `dm.sessionScope`. El aviso solo aparece cuando los enlaces de hilos están habilitados.

## Enlaces de conversación de ACP

Las salas, DMs e hilos existentes de Matrix pueden convertirse en espacios de trabajo duraderos de ACP sin cambiar la superficie de chat.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del DM, la sala o el hilo existente de Matrix para seguir usándolo.
- En un DM o una sala de nivel superior, el DM o la sala actual permanece como superficie de chat y los mensajes futuros se enrutan a la sesión de ACP creada.
- Dentro de un hilo existente, `--bind here` enlaza ese hilo actual en su lugar.
- `/new` y `/reset` restablecen la misma sesión de ACP enlazada en su lugar.
- `/acp close` cierra la sesión de ACP y elimina el enlace.

`--bind here` no crea un hilo hijo de Matrix. `threadBindings.spawnSessions` controla `/acp spawn --thread auto|here`, donde OpenClaw necesita crear o enlazar un hilo hijo.

### Configuración de enlaces de hilos

Matrix hereda los valores predeterminados globales de `session.threadBindings` y admite anulaciones por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: controla tanto las creaciones de subagentes como las de hilos de ACP.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: anulaciones más específicas para creaciones solo de subagentes o solo de ACP.
- `threadBindings.defaultSpawnContext`

Las creaciones de sesiones enlazadas a hilos de Matrix están activadas de forma predeterminada. Define `threadBindings.spawnSessions: false` para impedir que `/focus` de nivel superior y `/acp spawn --thread auto|here` creen o enlacen hilos de Matrix. Define `threadBindings.defaultSpawnContext: "isolated"` cuando las creaciones de hilos nativos de subagentes no deban bifurcar la transcripción principal.

## Reacciones

Matrix admite reacciones salientes, notificaciones de reacciones entrantes y reacciones de acuse.

Las herramientas de reacciones salientes están controladas por `channels.matrix.actions.reactions`:

- `react` agrega una reacción a un evento de Matrix.
- `reactions` lista el resumen actual de reacciones de un evento de Matrix.
- `emoji=""` elimina las reacciones propias del bot en ese evento.
- `remove: true` elimina del bot solo la reacción con el emoji especificado.

**Orden de resolución** (gana el primer valor definido):

| Configuración           | Orden                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | por cuenta -> canal -> `messages.ackReaction` -> reserva de emoji de identidad del agente |
| `ackReactionScope`      | por cuenta -> canal -> `messages.ackReactionScope` -> predeterminado `"group-mentions"` |
| `reactionNotifications` | por cuenta -> canal -> predeterminado `"own"`                                       |

`reactionNotifications: "own"` reenvía eventos `m.reaction` agregados cuando apuntan a mensajes de Matrix creados por el bot; `"off"` deshabilita los eventos del sistema de reacciones. Las eliminaciones de reacciones no se sintetizan como eventos del sistema: Matrix las expone como redacciones, no como eliminaciones independientes de `m.reaction`.

## Contexto de historial

- `channels.matrix.historyLimit` controla cuántos mensajes recientes de la sala se incluyen como `InboundHistory` cuando un mensaje de sala activa el agente. Recurre a `messages.groupChat.historyLimit`; el valor predeterminado efectivo es `0` si ambos no están definidos (deshabilitado).
- El historial de salas de Matrix es solo de sala; los DMs siguen usando el historial normal de sesión.
- El historial de sala solo está pendiente: OpenClaw almacena en búfer los mensajes de sala que aún no activaron una respuesta y luego captura esa ventana cuando llega una mención u otro activador.
- El mensaje activador actual no se incluye en `InboundHistory`; permanece en el cuerpo entrante principal de ese turno.
- Los reintentos del mismo evento de Matrix reutilizan la instantánea de historial original en lugar de desplazarse hacia mensajes de sala más recientes.

## Visibilidad de contexto

Matrix admite el control compartido `contextVisibility` para contexto suplementario de sala, como texto de respuesta obtenido, raíces de hilos e historial pendiente.

- `contextVisibility: "all"` es el valor predeterminado. El contexto suplementario se conserva como se recibió.
- `contextVisibility: "allowlist"` filtra el contexto suplementario para limitarlo a remitentes permitidos por las comprobaciones activas de lista de permitidos de sala/usuario.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, pero conserva igualmente una respuesta citada explícita.

Esto afecta solo la visibilidad del contexto suplementario, no si el mensaje entrante puede activar una respuesta. La autorización del activador sigue viniendo de `groupPolicy`, `groups`, `groupAllowFrom` y la configuración de política de DM.

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

Para silenciar los DMs por completo mientras las salas siguen funcionando, define `dm.enabled: false`:

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

Consulta [Grupos](/es/channels/groups) para el comportamiento de bloqueo por mención y listas de permitidos.

Ejemplo de emparejamiento para DMs de Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un usuario de Matrix no aprobado sigue enviando mensajes antes de la aprobación, OpenClaw reutiliza el mismo código de emparejamiento pendiente y puede enviar una respuesta recordatoria después de un breve tiempo de espera en lugar de generar un código nuevo.

Consulta [Emparejamiento](/es/channels/pairing) para el flujo compartido de emparejamiento de DM y el diseño de almacenamiento.

## Reparación de salas directas

Si el estado de mensajes directos se desvía, OpenClaw puede terminar con asignaciones `m.direct` obsoletas que apuntan a salas individuales antiguas en lugar del DM activo. Inspecciona la asignación actual de un par:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repárala:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Ambos comandos aceptan `--account <id>` para configuraciones con varias cuentas. El flujo de reparación:

- prefiere un DM 1:1 estricto ya asignado en `m.direct`
- recurre a cualquier DM 1:1 estricto actualmente unido con ese usuario
- crea una sala directa nueva y reescribe `m.direct` si no existe ningún DM en buen estado

No elimina salas antiguas automáticamente. Elige el DM en buen estado y actualiza la asignación para que los futuros envíos de Matrix, avisos de verificación y otros flujos de mensajes directos apunten a la sala correcta.

## Aprobaciones de exec

Matrix puede actuar como cliente nativo de aprobación. Configura en `channels.matrix.execApprovals` (o `channels.matrix.accounts.<account>.execApprovals` para una anulación por cuenta):

- `enabled`: entrega aprobaciones mediante avisos nativos de Matrix. Sin definir o `"auto"` se habilita automáticamente cuando puede resolverse al menos un aprobador; define `false` para deshabilitarlo explícitamente.
- `approvers`: IDs de usuario de Matrix (`@owner:example.org`) autorizados para aprobar solicitudes de exec. Recurre a `channels.matrix.dm.allowFrom`.
- `target`: adónde van los avisos. `"dm"` (predeterminado) envía a los DMs de aprobadores; `"channel"` envía a la sala o DM de origen; `"both"` envía a ambos.
- `agentFilter` / `sessionFilter`: listas de permitidos opcionales para qué agentes/sesiones activan la entrega por Matrix.

La autorización difiere ligeramente entre tipos de aprobación:

- **Aprobaciones de exec** usan `execApprovals.approvers`, con reserva en `dm.allowFrom`.
- **Aprobaciones de Plugin** autorizan solo mediante `dm.allowFrom`.

Ambos tipos comparten accesos directos de reacciones de Matrix y actualizaciones de mensajes. Los aprobadores ven accesos directos de reacción en el mensaje principal de aprobación:

- ✅ permitir una vez
- ❌ denegar
- ♾️ permitir siempre (cuando la política efectiva de exec lo permite)

Comandos slash de reserva: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Solo los aprobadores resueltos pueden aprobar o denegar. La entrega por canal para aprobaciones de exec incluye el texto del comando; habilita `channel` o `both` solo en salas de confianza.

Relacionado: [Aprobaciones de exec](/es/tools/exec-approvals).

## Comandos slash

Los comandos slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, etc.) funcionan directamente en DMs. En salas, OpenClaw también reconoce comandos con prefijo de la propia mención de Matrix del bot, por lo que `@bot:server /new` activa la ruta de comando sin una regex de mención personalizada; esto mantiene al bot receptivo a las publicaciones de estilo de sala `@mention /command` que Element y clientes similares emiten cuando un usuario completa con tabulación el bot antes de escribir el comando.

Las reglas de autorización siguen aplicándose: los remitentes de comandos deben satisfacer las mismas políticas de lista de permitidos/propietario de DM o sala que los mensajes normales.

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

- Los valores de nivel superior de `channels.matrix` actúan como valores predeterminados para las cuentas con nombre, a menos que una cuenta los sobrescriba.
- Limita una entrada de sala heredada a una cuenta específica con `groups.<room>.account`. Las entradas sin `account` se comparten entre cuentas; `account: "default"` sigue funcionando cuando la cuenta predeterminada está configurada en el nivel superior.

**Selección de la cuenta predeterminada:**

- Define `defaultAccount` para elegir la cuenta con nombre que prefieren el enrutamiento implícito, los sondeos y los comandos de la CLI.
- Si tienes varias cuentas y una se llama literalmente `default`, OpenClaw la usa de forma implícita incluso cuando `defaultAccount` no está definido.
- Con varias cuentas con nombre y sin una cuenta predeterminada seleccionada, los comandos de la CLI se niegan a adivinar; define `defaultAccount` o pasa `--account <id>`.
- El bloque de nivel superior `channels.matrix.*` solo se trata como la cuenta implícita `default` cuando su autenticación está completa (`homeserver` + `accessToken`, o `homeserver` + `userId` + `password`). Las cuentas con nombre siguen siendo detectables a partir de `homeserver` + `userId` una vez que las credenciales en caché cubren la autenticación.

**Promoción:**

- Cuando OpenClaw promueve una configuración de una sola cuenta a varias cuentas durante la reparación o configuración, conserva la cuenta con nombre existente si hay una o si `defaultAccount` ya apunta a una. Solo las claves de autenticación/arranque de Matrix se mueven a la cuenta promovida; las claves compartidas de política de entrega permanecen en el nivel superior.

Consulta la [referencia de configuración](/es/gateway/config-channels#multi-account-all-channels) para ver el patrón compartido de varias cuentas.

## Homeservers privados/LAN

De forma predeterminada, OpenClaw bloquea los homeservers de Matrix privados/internos para proteger contra SSRF, a menos que lo habilites por cuenta.

Si tu homeserver se ejecuta en localhost, una IP de LAN/Tailscale o un nombre de host interno, habilita `network.dangerouslyAllowPrivateNetwork` para esa cuenta:

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

Ejemplo de configuración con la CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Esta habilitación explícita solo permite destinos privados/internos de confianza. Los homeservers públicos sin cifrado, como `http://matrix.example.org:8008`, siguen bloqueados. Prefiere `https://` siempre que sea posible.

## Proxy del tráfico de Matrix

Si tu despliegue de Matrix necesita un proxy HTTP(S) saliente explícito, define `channels.matrix.proxy`:

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

Las cuentas con nombre pueden sobrescribir el valor predeterminado de nivel superior con `channels.matrix.accounts.<id>.proxy`. OpenClaw usa la misma configuración de proxy para el tráfico de Matrix en tiempo de ejecución y para los sondeos de estado de cuenta.

## Resolución de destinos

Matrix acepta estas formas de destino en cualquier lugar donde OpenClaw solicite un destino de sala o usuario:

- Usuarios: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

Los IDs de sala de Matrix distinguen entre mayúsculas y minúsculas. Usa exactamente las mismas mayúsculas y minúsculas del ID de sala de Matrix al configurar destinos de entrega explícitos, trabajos cron, vinculaciones o listas de permitidos. OpenClaw mantiene canónicas las claves de sesión internas para el almacenamiento, por lo que esas claves en minúsculas no son una fuente fiable para los IDs de entrega de Matrix.

La búsqueda en el directorio en vivo usa la cuenta de Matrix con sesión iniciada:

- Las búsquedas de usuarios consultan el directorio de usuarios de Matrix en ese homeserver.
- Las búsquedas de salas aceptan directamente IDs de sala y alias explícitos. La búsqueda por nombre de salas unidas es de mejor esfuerzo y solo se aplica a las listas de permitidos de salas en tiempo de ejecución cuando `dangerouslyAllowNameMatching: true` está definido.
- Si un nombre de sala no se puede resolver a un ID o alias, la resolución de listas de permitidos en tiempo de ejecución lo ignora.

## Referencia de configuración

Los campos de usuario de estilo lista de permitidos (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) aceptan IDs de usuario completos de Matrix (lo más seguro). Las entradas que no son IDs se ignoran de forma predeterminada. Si `dangerouslyAllowNameMatching: true` está definido, las coincidencias exactas con nombres visibles del directorio de Matrix se resuelven al iniciar y cada vez que la lista de permitidos cambia mientras el monitor está en ejecución; las entradas no resolubles se ignoran en tiempo de ejecución.

Las claves de lista de permitidos de salas (`groups`, `rooms` heredado) deben ser IDs de sala o alias. Las claves con nombres de sala simples se ignoran de forma predeterminada; `dangerouslyAllowNameMatching: true` restaura la búsqueda de mejor esfuerzo contra nombres de salas unidas.

### Cuenta y conexión

- `enabled`: habilita o deshabilita el canal.
- `name`: etiqueta de visualización opcional para la cuenta.
- `defaultAccount`: ID de cuenta preferido cuando se configuran varias cuentas de Matrix.
- `accounts`: anulaciones nombradas por cuenta. Los valores de nivel superior de `channels.matrix` se heredan como valores predeterminados.
- `homeserver`: URL del homeserver, por ejemplo `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta cuenta se conecte a `localhost`, IPs de LAN/Tailscale o nombres de host internos.
- `proxy`: URL de proxy HTTP(S) opcional para el tráfico de Matrix. Se admite anulación por cuenta.
- `userId`: ID de usuario completo de Matrix (`@bot:example.org`).
- `accessToken`: token de acceso para autenticación basada en token. Se admiten valores en texto sin formato y SecretRef en proveedores env/file/exec ([Gestión de secretos](/es/gateway/secrets)).
- `password`: contraseña para inicio de sesión basado en contraseña. Se admiten valores en texto sin formato y SecretRef.
- `deviceId`: ID de dispositivo explícito de Matrix.
- `deviceName`: nombre visible del dispositivo usado durante el inicio de sesión con contraseña.
- `avatarUrl`: URL de avatar propio almacenada para sincronización de perfil y actualizaciones de `profile set`.
- `initialSyncLimit`: número máximo de eventos recuperados durante la sincronización de inicio.

### Cifrado

- `encryption`: habilita E2EE. Valor predeterminado: `false`.
- `startupVerification`: `"if-unverified"` (predeterminado cuando E2EE está activado) o `"off"`. Solicita automáticamente la autoverificación al iniciar cuando este dispositivo no está verificado.
- `startupVerificationCooldownHours`: periodo de espera antes de la siguiente solicitud automática de inicio. Valor predeterminado: `24`.

### Acceso y política

- `groupPolicy`: `"open"`, `"allowlist"` o `"disabled"`. Valor predeterminado: `"allowlist"`.
- `groupAllowFrom`: lista de permitidos de IDs de usuario para tráfico de salas.
- `mentionPatterns`: patrones regex con ámbito para menciones en salas. Objeto con `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Controla si los `agents.list[].groupChat.mentionPatterns` configurados se aplican por sala.
- `dm.enabled`: cuando es `false`, ignora todos los DMs. Valor predeterminado: `true`.
- `dm.policy`: `"pairing"` (predeterminado), `"allowlist"`, `"open"` o `"disabled"`. Se aplica después de que el bot se haya unido y haya clasificado la sala como DM; no afecta el manejo de invitaciones.
- `dm.allowFrom`: lista de permitidos de IDs de usuario para tráfico de DM.
- `dm.sessionScope`: `"per-user"` (predeterminado) o `"per-room"`.
- `dm.threadReplies`: anulación solo para DM del anidamiento de respuestas (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: acepta mensajes de otras cuentas de bot de Matrix configuradas (`true` o `"mentions"`).
- `allowlistOnly`: cuando es `true`, fuerza todas las políticas de DM activas (excepto `"disabled"`) y las políticas de grupo `"open"` a `"allowlist"`. No cambia las políticas `"disabled"`.
- `dangerouslyAllowNameMatching`: cuando es `true`, permite la búsqueda en el directorio por nombre visible de Matrix para entradas de lista de permitidos de usuarios y la búsqueda por nombre de salas unidas para claves de lista de permitidos de salas. Prefiere IDs completos `@user:server` e IDs de sala o alias.
- `autoJoin`: `"always"`, `"allowlist"` u `"off"`. Valor predeterminado: `"off"`. Se aplica a todas las invitaciones de Matrix, incluidas las invitaciones de estilo DM.
- `autoJoinAllowlist`: salas/alias permitidos cuando `autoJoin` es `"allowlist"`. Las entradas de alias se resuelven contra el homeserver, no contra el estado declarado por la sala invitada.
- `contextVisibility`: visibilidad de contexto suplementario (`"all"` predeterminado, `"allowlist"`, `"allowlist_quote"`).

### Comportamiento de respuesta

- `replyToMode`: `"off"` (predeterminado), `"first"`, `"all"` o `"batched"`.
- `threadReplies`: `"off"` (el valor predeterminado de nivel superior se resuelve a `"inbound"` salvo que se defina explícitamente), `"inbound"` o `"always"`.
- `threadBindings`: anulaciones por canal para enrutamiento de sesiones vinculadas a hilos y ciclo de vida.
- `streaming`: `"off"` (predeterminado), `"partial"`, `"quiet"`, `"progress"` o forma de objeto `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` <-> `"partial"`, `false` <-> `"off"`.
- `blockStreaming`: cuando es `true`, los bloques completados del asistente se mantienen como mensajes de progreso separados. Valor predeterminado: `false`.
- `markdown`: configuración opcional de renderizado Markdown para texto saliente.
- `responsePrefix`: cadena opcional antepuesta a las respuestas salientes.
- `textChunkLimit`: tamaño de fragmento saliente en caracteres cuando `chunkMode: "length"`. Valor predeterminado: `4000`.
- `chunkMode`: `"length"` (predeterminado, divide por cantidad de caracteres) o `"newline"` (divide en límites de línea).
- `historyLimit`: número de mensajes recientes de sala incluidos como `InboundHistory` cuando un mensaje de sala activa el agente. Recurre a `messages.groupChat.historyLimit`; valor predeterminado efectivo `0` (deshabilitado).
- `mediaMaxMb`: límite de tamaño de medios en MB para envíos salientes y procesamiento entrante. Valor predeterminado: `20`.

### Configuración de reacciones

- `ackReaction`: anulación de reacción de confirmación para este canal/cuenta.
- `ackReactionScope`: anulación de ámbito (`"group-mentions"` predeterminado, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modo de notificación de reacciones entrantes (`"own"` predeterminado, `"off"`).

### Herramientas y anulaciones por sala

- `actions`: control de acceso de herramientas por acción (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa de políticas por sala. La identidad de sesión usa el ID de sala estable después de la resolución. (`rooms` es un alias heredado.)
  - `groups.<room>.account`: restringe una entrada de sala heredada a una cuenta específica.
  - `groups.<room>.enabled`: interruptor por sala. Cuando es `false`, la sala se ignora como si no estuviera en el mapa.
  - `groups.<room>.requireMention`: anulación por sala del requisito de mención a nivel de canal.
  - `groups.<room>.allowBots`: anulación por sala de la configuración a nivel de canal (`true` o `"mentions"`).
  - `groups.<room>.botLoopProtection`: anulación por sala del presupuesto de protección contra bucles entre bots.
  - `groups.<room>.users`: lista de permitidos de remitentes por sala.
  - `groups.<room>.tools`: anulaciones de permitir/denegar herramientas por sala.
  - `groups.<room>.autoReply`: anulación por sala del control de menciones. `true` deshabilita los requisitos de mención para esa sala; `false` los fuerza a activarse de nuevo.
  - `groups.<room>.skills`: filtro de Skills por sala.
  - `groups.<room>.systemPrompt`: fragmento de prompt del sistema por sala.

### Configuración de aprobación de exec

- `execApprovals.enabled`: entrega aprobaciones de exec mediante prompts nativos de Matrix.
- `execApprovals.approvers`: IDs de usuario de Matrix autorizados a aprobar. Recurre a `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (predeterminado), `"channel"` o `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: listas de permitidos opcionales de agente/sesión para la entrega.

## Relacionado

- [Resumen de canales](/es/channels) - todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) - autenticación por DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) - comportamiento de chat grupal y control de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y refuerzo
