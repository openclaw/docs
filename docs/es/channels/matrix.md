---
read_when:
    - Configurar Matrix en OpenClaw
    - Configuración de E2EE y verificación en Matrix
summary: Estado de soporte de Matrix, configuración inicial y ejemplos de configuración
title: Matriz
x-i18n:
    generated_at: "2026-05-06T05:27:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a35192ab3b5b9214fb3eb56f1c12737aa6966a481f43297fe0da1ac4396f917
    source_path: channels/matrix.md
    workflow: 16
---

Matrix es un plugin de canal descargable para OpenClaw.
Usa el `matrix-js-sdk` oficial y admite MD, salas, hilos, contenido multimedia, reacciones, encuestas, ubicación y E2EE.

## Instalar

Instala Matrix antes de configurar el canal:

```bash
openclaw plugins install @openclaw/matrix
```

Desde un checkout local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registra y habilita el plugin, por lo que no hace falta un paso separado de `openclaw plugins enable matrix`. El plugin sigue sin hacer nada hasta que configures el canal a continuación. Consulta [Plugins](/es/tools/plugin) para ver el comportamiento general de los plugins y las reglas de instalación.

## Configuración

1. Crea una cuenta de Matrix en tu homeserver.
2. Configura `channels.matrix` con `homeserver` + `accessToken`, o con `homeserver` + `userId` + `password`.
3. Reinicia el gateway.
4. Inicia un MD con el bot, o invítalo a una sala (consulta [unión automática](#auto-join); las invitaciones nuevas solo se aceptan cuando `autoJoin` las permite).

### Configuración interactiva

```bash
openclaw channels add
openclaw configure --section channels
```

El asistente solicita: URL del homeserver, método de autenticación (token de acceso o contraseña), ID de usuario (solo autenticación con contraseña), nombre de dispositivo opcional, si se debe habilitar E2EE y si se debe configurar el acceso a salas y la unión automática.

Si ya existen variables de entorno `MATRIX_*` coincidentes y la cuenta seleccionada no tiene autenticación guardada, el asistente ofrece un atajo de variables de entorno. Para resolver nombres de sala antes de guardar una allowlist, ejecuta `openclaw channels resolve --channel matrix "Project Room"`. Cuando E2EE está habilitado, el asistente escribe la configuración y ejecuta el mismo arranque que [`openclaw matrix encryption setup`](#encryption-and-verification).

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

### Unión automática

`channels.matrix.autoJoin` tiene el valor predeterminado `off`. Con el valor predeterminado, el bot no aparecerá en salas nuevas ni en MD de invitaciones nuevas hasta que te unas manualmente.

OpenClaw no puede saber en el momento de la invitación si una sala invitada es un MD o un grupo, por lo que todas las invitaciones, incluidas las invitaciones con formato de MD, pasan primero por `autoJoin`. `dm.policy` solo se aplica después, cuando el bot se ha unido y la sala se ha clasificado.

<Warning>
Define `autoJoin: "allowlist"` más `autoJoinAllowlist` para restringir qué invitaciones acepta el bot, o `autoJoin: "always"` para aceptar todas las invitaciones.

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

### Formatos de destino de allowlist

Las allowlists de MD y salas se completan mejor con ID estables:

- MD (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): usa `@user:server`. Los nombres para mostrar solo se resuelven cuando el directorio del homeserver devuelve exactamente una coincidencia.
- Salas (`groups`, `autoJoinAllowlist`): usa `!room:server` o `#alias:server`. Los nombres se resuelven con el mejor esfuerzo contra las salas unidas; las entradas no resueltas se ignoran en tiempo de ejecución.

### Normalización del ID de cuenta

El asistente convierte un nombre descriptivo en un ID de cuenta normalizado. Por ejemplo, `Ops Bot` se convierte en `ops-bot`. La puntuación se escapa en los nombres de variables de entorno con ámbito para que dos cuentas no puedan colisionar: `-` → `_X2D_`, por lo que `ops-prod` se asigna a `MATRIX_OPS_X2D_PROD_*`.

### Credenciales en caché

Matrix almacena credenciales en caché en `~/.openclaw/credentials/matrix/`:

- cuenta predeterminada: `credentials.json`
- cuentas con nombre: `credentials-<account>.json`

Cuando existen credenciales en caché allí, OpenClaw trata Matrix como configurado aunque el token de acceso no esté en el archivo de configuración; eso cubre la configuración, `openclaw doctor` y las comprobaciones de estado del canal.

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

Para la cuenta `ops`, los nombres pasan a ser `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, y así sucesivamente. Las variables de entorno de clave de recuperación son leídas por los flujos de CLI compatibles con recuperación (`verify backup restore`, `verify device`, `verify bootstrap`) cuando pasas la clave mediante `--recovery-key-stdin`.

`MATRIX_HOMESERVER` no puede definirse desde un `.env` del espacio de trabajo; consulta [Archivos `.env` del espacio de trabajo](/es/gateway/security).

## Ejemplo de configuración

Una base práctica con emparejamiento de MD, allowlist de salas y E2EE:

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

El streaming de respuestas de Matrix es opcional. `streaming` controla cómo OpenClaw entrega la respuesta del asistente en curso; `blockStreaming` controla si cada bloque completado se conserva como su propio mensaje de Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Para conservar las vistas previas de respuestas en vivo pero ocultar las líneas intermedias de herramientas/progreso, usa el formato de objeto:

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

| `streaming`       | Comportamiento                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `"off"` (predeterminado) | Espera la respuesta completa y envía una vez. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                       |
| `"partial"`       | Edita un mensaje de texto normal en el mismo lugar mientras el modelo escribe el bloque actual. Los clientes Matrix estándar pueden notificar en la primera vista previa, no en la edición final. |
| `"quiet"`         | Igual que `"partial"`, pero el mensaje es un aviso que no notifica. Los destinatarios solo reciben una notificación cuando una regla push por usuario coincide con la edición finalizada (consulta abajo). |

`blockStreaming` es independiente de `streaming`:

| `streaming`             | `blockStreaming: true`                                                   | `blockStreaming: false` (predeterminado)                |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| `"partial"` / `"quiet"` | Borrador en vivo para el bloque actual, bloques completados conservados como mensajes | Borrador en vivo para el bloque actual, finalizado en el mismo lugar |
| `"off"`                 | Un mensaje de Matrix con notificación por cada bloque terminado          | Un mensaje de Matrix con notificación para la respuesta completa |

Notas:

- Si una vista previa supera el límite de tamaño por evento de Matrix, OpenClaw detiene el streaming de vista previa y vuelve a entrega solo final.
- Las respuestas multimedia siempre envían archivos adjuntos normalmente. Si una vista previa obsoleta ya no se puede reutilizar de forma segura, OpenClaw la redacta antes de enviar la respuesta multimedia final.
- Las actualizaciones de vista previa de progreso de herramientas están habilitadas de forma predeterminada cuando el streaming de vistas previas de Matrix está activo. Define `streaming.preview.toolProgress: false` para mantener las ediciones de vista previa del texto de respuesta, pero dejar el progreso de herramientas en la ruta de entrega normal.
- Las ediciones de vista previa cuestan llamadas adicionales a la API de Matrix. Deja `streaming: "off"` si quieres el perfil de límite de tasa más conservador.

## Metadatos de aprobación

Los prompts de aprobación nativos de Matrix son eventos `m.room.message` normales con contenido de evento personalizado específico de OpenClaw en `com.openclaw.approval`. Matrix permite claves de contenido de evento personalizadas, por lo que los clientes estándar siguen mostrando el cuerpo de texto mientras los clientes compatibles con OpenClaw pueden leer el ID de aprobación estructurado, el tipo, el estado, las decisiones disponibles y los detalles de ejecución/plugin.

Cuando un prompt de aprobación es demasiado largo para un evento de Matrix, OpenClaw divide el texto visible en fragmentos y adjunta `com.openclaw.approval` solo al primer fragmento. Las reacciones para decisiones de permitir/denegar se vinculan a ese primer evento, por lo que los prompts largos conservan el mismo destino de aprobación que los prompts de un solo evento.

### Reglas push autoalojadas para vistas previas finalizadas silenciosas

`streaming: "quiet"` solo notifica a los destinatarios una vez que un bloque o turno está finalizado; una regla push por usuario tiene que coincidir con el marcador de vista previa finalizada. Consulta [Reglas push de Matrix para vistas previas silenciosas](/es/channels/matrix-push-rules) para ver la receta completa (token de destinatario, comprobación de pusher, instalación de regla, notas por homeserver).

## Salas de bot a bot

De forma predeterminada, los mensajes de Matrix de otras cuentas Matrix de OpenClaw configuradas se ignoran.

Usa `allowBots` cuando quieras intencionalmente tráfico Matrix entre agentes:

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

- `allowBots: true` acepta mensajes de otras cuentas bot de Matrix configuradas en salas y MD permitidos.
- `allowBots: "mentions"` acepta esos mensajes solo cuando mencionan visiblemente a este bot en salas. Los MD siguen permitidos.
- `groups.<room>.allowBots` anula la configuración de nivel de cuenta para una sala.
- OpenClaw sigue ignorando mensajes del mismo ID de usuario de Matrix para evitar bucles de autorrespuesta.
- Matrix no expone aquí una marca de bot nativa; OpenClaw trata "escrito por bot" como "enviado por otra cuenta Matrix configurada en este gateway de OpenClaw".

Usa allowlists de sala estrictas y requisitos de mención al habilitar tráfico de bot a bot en salas compartidas.

## Cifrado y verificación

En salas cifradas (E2EE), los eventos de imagen salientes usan `thumbnail_file` para que las vistas previas de imagen se cifren junto con el archivo adjunto completo. Las salas sin cifrar siguen usando `thumbnail_url` sin cifrar. No se necesita configuración; el plugin detecta el estado de E2EE automáticamente.

Todos los comandos `openclaw matrix` aceptan `--verbose` (diagnósticos completos), `--json` (salida legible por máquina) y `--account <id>` (configuraciones multicuenta). La salida es concisa de forma predeterminada, con registro interno silencioso del SDK. Los ejemplos siguientes muestran el formato canónico; agrega las marcas según sea necesario.

### Habilitar cifrado

```bash
openclaw matrix encryption setup
```

Inicializa el almacenamiento de secretos y la firma cruzada, crea una copia de seguridad de claves de sala si es necesario, y luego muestra el estado y los siguientes pasos. Flags útiles:

- `--recovery-key <key>` aplica una clave de recuperación antes de la inicialización (prefiere la forma por stdin documentada abajo)
- `--force-reset-cross-signing` descarta la identidad actual de firma cruzada y crea una nueva (úsalo solo de forma intencional)

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

`verify status` informa tres señales de confianza independientes (`--verbose` muestra todas):

- `Locally trusted`: de confianza solo para este cliente
- `Cross-signing verified`: el SDK informa verificación mediante firma cruzada
- `Signed by owner`: firmado por tu propia clave de autofirma (solo diagnóstico)

`Verified by owner` pasa a `yes` solo cuando `Cross-signing verified` es `yes`. La confianza local o una firma del propietario por sí sola no basta.

`--allow-degraded-local-state` devuelve diagnósticos de mejor esfuerzo sin preparar primero la cuenta Matrix; es útil para sondeos sin conexión o con configuración parcial.

### Verificar este dispositivo con una clave de recuperación

La clave de recuperación es sensible: pásala por stdin en lugar de pasarla en la línea de comandos. Define `MATRIX_RECOVERY_KEY` (o `MATRIX_<ID>_RECOVERY_KEY` para una cuenta con nombre):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

El comando informa tres estados:

- `Recovery key accepted`: Matrix aceptó la clave para el almacenamiento de secretos o la confianza del dispositivo.
- `Backup usable`: la copia de seguridad de claves de sala puede cargarse con el material de recuperación de confianza.
- `Device verified by owner`: este dispositivo tiene plena confianza de identidad de firma cruzada de Matrix.

Sale con código distinto de cero cuando la confianza de identidad completa está incompleta, aunque la clave de recuperación haya desbloqueado material de copia de seguridad. En ese caso, completa la autoverificación desde otro cliente Matrix:

```bash
openclaw matrix verify self
```

`verify self` espera a que `Cross-signing verified: yes` esté presente antes de salir correctamente. Usa `--timeout-ms <ms>` para ajustar la espera.

La forma con clave literal `openclaw matrix verify device "<recovery-key>"` también se acepta, pero la clave termina en el historial de tu shell.

### Inicializar o reparar la firma cruzada

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` es el comando de reparación y configuración para cuentas cifradas. En orden:

- inicializa el almacenamiento de secretos, reutilizando una clave de recuperación existente cuando sea posible
- inicializa la firma cruzada y sube las claves públicas faltantes
- marca y firma de forma cruzada el dispositivo actual
- crea una copia de seguridad de claves de sala en el servidor si todavía no existe

Si el homeserver requiere UIA para subir claves de firma cruzada, OpenClaw prueba primero sin autenticación, luego `m.login.dummy` y después `m.login.password` (requiere `channels.matrix.password`).

Flags útiles:

- `--recovery-key-stdin` (combínalo con `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) o `--recovery-key <key>`
- `--force-reset-cross-signing` para descartar la identidad actual de firma cruzada (solo de forma intencional)

### Copia de seguridad de claves de sala

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` muestra si existe una copia de seguridad en el servidor y si este dispositivo puede descifrarla. `backup restore` importa las claves de sala respaldadas al almacén criptográfico local; si la clave de recuperación ya está en disco, puedes omitir `--recovery-key-stdin`.

Para reemplazar una copia de seguridad dañada con una base nueva (acepta perder historial antiguo irrecuperable; también puede recrear el almacenamiento de secretos si el secreto de la copia actual no se puede cargar):

```bash
openclaw matrix verify backup reset --yes
```

Añade `--rotate-recovery-key` solo cuando quieras intencionalmente que la clave de recuperación anterior deje de desbloquear la nueva base de copia de seguridad.

### Listar, solicitar y responder a verificaciones

```bash
openclaw matrix verify list
```

Lista las solicitudes de verificación pendientes para la cuenta seleccionada.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Envía una solicitud de verificación desde esta cuenta de OpenClaw. `--own-user` solicita autoverificación (aceptas el aviso en otro cliente Matrix del mismo usuario); `--user-id`/`--device-id`/`--room-id` apuntan a otra persona. `--own-user` no puede combinarse con los demás flags de destino.

Para un manejo de ciclo de vida de nivel más bajo, normalmente al seguir solicitudes entrantes desde otro cliente, estos comandos actúan sobre una solicitud específica `<id>` (impresa por `verify list` y `verify request`):

| Comando                                    | Propósito                                                           |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Aceptar una solicitud entrante                                      |
| `openclaw matrix verify start <id>`        | Iniciar el flujo SAS                                                |
| `openclaw matrix verify sas <id>`          | Imprimir los emoji o decimales SAS                                  |
| `openclaw matrix verify confirm-sas <id>`  | Confirmar que el SAS coincide con lo que muestra el otro cliente    |
| `openclaw matrix verify mismatch-sas <id>` | Rechazar el SAS cuando los emoji o decimales no coinciden           |
| `openclaw matrix verify cancel <id>`       | Cancelar; acepta `--reason <text>` y `--code <matrix-code>` opcionales |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` y `cancel` aceptan `--user-id` y `--room-id` como indicios de seguimiento de DM cuando la verificación está anclada a una sala de mensaje directo específica.

### Notas para varias cuentas

Sin `--account <id>`, los comandos de Matrix CLI usan la cuenta predeterminada implícita. Si tienes varias cuentas con nombre y no definiste `channels.matrix.defaultAccount`, se negarán a adivinar y te pedirán que elijas. Cuando E2EE está deshabilitado o no disponible para una cuenta con nombre, los errores apuntan a la clave de configuración de esa cuenta, por ejemplo `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Con `encryption: true`, `startupVerification` usa `"if-unverified"` de forma predeterminada. Al iniciar, un dispositivo no verificado solicita autoverificación en otro cliente Matrix, omitiendo duplicados y aplicando un periodo de enfriamiento (24 horas de forma predeterminada). Ajústalo con `startupVerificationCooldownHours` o deshabilítalo con `startupVerification: "off"`.

    El inicio también ejecuta una pasada conservadora de inicialización criptográfica que reutiliza el almacenamiento de secretos y la identidad de firma cruzada actuales. Si el estado de inicialización está dañado, OpenClaw intenta una reparación protegida incluso sin `channels.matrix.password`; si el homeserver requiere UIA con contraseña, el inicio registra una advertencia y sigue sin ser fatal. Los dispositivos ya firmados por el propietario se conservan.

    Consulta [migración de Matrix](/es/channels/matrix-migration) para ver el flujo completo de actualización.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix publica avisos del ciclo de vida de la verificación en la sala estricta de verificación por DM como mensajes `m.notice`: solicitud, listo (con guía de "Verificar por emoji"), inicio/finalización y detalles SAS (emoji/decimal) cuando están disponibles.

    Las solicitudes entrantes desde otro cliente Matrix se rastrean y se aceptan automáticamente. Para la autoverificación, OpenClaw inicia el flujo SAS automáticamente y confirma su propio lado cuando la verificación por emoji está disponible; aun así, debes comparar y confirmar "Coinciden" en tu cliente Matrix.

    Los avisos del sistema de verificación no se reenvían al canal de chat del agente.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Si `verify status` indica que el dispositivo actual ya no figura en el homeserver, crea un nuevo dispositivo Matrix de OpenClaw. Para inicio de sesión con contraseña:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Para autenticación con token, crea un token de acceso nuevo en tu cliente Matrix o interfaz de administración, y luego actualiza OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Reemplaza `assistant` por el ID de cuenta del comando que falló, u omite `--account` para la cuenta predeterminada.

  </Accordion>

  <Accordion title="Device hygiene">
    Los dispositivos antiguos administrados por OpenClaw pueden acumularse. Lista y depura:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE usa la ruta criptográfica Rust oficial de `matrix-js-sdk` con `fake-indexeddb` como shim de IndexedDB. El estado criptográfico persiste en `crypto-idb-snapshot.json` (permisos de archivo restrictivos).

    El estado de runtime cifrado vive bajo `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e incluye el almacén de sincronización, el almacén criptográfico, la clave de recuperación, la instantánea IDB, los enlaces de hilos y el estado de verificación de inicio. Cuando el token cambia pero la identidad de la cuenta sigue siendo la misma, OpenClaw reutiliza la mejor raíz existente para que el estado anterior siga visible.

  </Accordion>
</AccordionGroup>

## Gestión de perfil

Actualiza el autoperfil de Matrix para la cuenta seleccionada:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Puedes pasar ambas opciones en una sola llamada. Matrix acepta URL de avatar `mxc://` directamente; cuando pasas `http://` o `https://`, OpenClaw sube primero el archivo y almacena la URL `mxc://` resuelta en `channels.matrix.avatarUrl` (o en la sobrescritura por cuenta).

## Hilos

Matrix admite hilos nativos de Matrix tanto para respuestas automáticas como para envíos con herramientas de mensaje. Dos controles independientes determinan el comportamiento:

### Enrutamiento de sesión (`sessionScope`)

`dm.sessionScope` decide cómo se asignan las salas DM de Matrix a sesiones de OpenClaw:

- `"per-user"` (predeterminado): todas las salas DM con el mismo par enrutado comparten una sesión.
- `"per-room"`: cada sala DM de Matrix obtiene su propia clave de sesión, incluso cuando el par es el mismo.

Los enlaces explícitos de conversación siempre tienen prioridad sobre `sessionScope`, por lo que las salas e hilos enlazados conservan su sesión de destino elegida.

### Respuestas en hilos (`threadReplies`)

`threadReplies` decide dónde publica el bot su respuesta:

- `"off"`: las respuestas son de nivel superior. Los mensajes entrantes en hilos permanecen en la sesión principal.
- `"inbound"`: responde dentro de un hilo solo cuando el mensaje entrante ya estaba en ese hilo.
- `"always"`: responde dentro de un hilo con raíz en el mensaje que lo activó; esa conversación se enruta mediante una sesión coincidente con alcance de hilo desde el primer disparador en adelante.

`dm.threadReplies` sobrescribe esto solo para DM; por ejemplo, mantén aislados los hilos de sala mientras mantienes planos los DM.

### Herencia de hilos y comandos slash

- Los mensajes entrantes en hilos incluyen el mensaje raíz del hilo como contexto adicional para el agente.
- Los envíos con la herramienta de mensajes heredan automáticamente el hilo actual de Matrix al dirigirse a la misma sala (o al mismo usuario de DM), salvo que se proporcione un `threadId` explícito.
- La reutilización del destino de usuario de DM solo se activa cuando los metadatos de la sesión actual demuestran que se trata del mismo par de DM en la misma cuenta de Matrix; de lo contrario, OpenClaw recurre al enrutamiento normal con alcance de usuario.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y `/acp spawn` enlazado a hilo funcionan en salas y DMs de Matrix.
- `/focus` de nivel superior crea un nuevo hilo de Matrix y lo vincula a la sesión de destino cuando `threadBindings.spawnSessions` está habilitado.
- Ejecutar `/focus` o `/acp spawn --thread here` dentro de un hilo de Matrix existente vincula ese hilo en su lugar.

Cuando OpenClaw detecta que una sala de DM de Matrix colisiona con otra sala de DM en la misma sesión compartida, publica una vez un `m.notice` en esa sala que apunta a la vía de escape `/focus` y sugiere un cambio en `dm.sessionScope`. El aviso solo aparece cuando los enlaces de hilos están habilitados.

## Enlaces de conversación ACP

Las salas de Matrix, los DMs y los hilos de Matrix existentes pueden convertirse en espacios de trabajo ACP duraderos sin cambiar la superficie de chat.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del DM, la sala o el hilo existente de Matrix que quieres seguir usando.
- En un DM o una sala de Matrix de nivel superior, el DM o la sala actual permanece como superficie de chat y los mensajes futuros se enrutan a la sesión ACP creada.
- Dentro de un hilo de Matrix existente, `--bind here` vincula ese hilo actual en su lugar.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada en su lugar.
- `/acp close` cierra la sesión ACP y elimina el enlace.

Notas:

- `--bind here` no crea un hilo hijo de Matrix.
- `threadBindings.spawnSessions` controla `/acp spawn --thread auto|here`, donde OpenClaw necesita crear o vincular un hilo hijo de Matrix.

### Configuración de enlace de hilos

Matrix hereda los valores predeterminados globales de `session.threadBindings` y también admite anulaciones por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

La creación de sesiones enlazadas a hilos de Matrix está activada de forma predeterminada:

- Establece `threadBindings.spawnSessions: false` para impedir que `/focus` de nivel superior y `/acp spawn --thread auto|here` creen o vinculen hilos de Matrix.
- Establece `threadBindings.defaultSpawnContext: "isolated"` cuando las creaciones de hilos de subagentes nativos no deban bifurcar la transcripción principal.

## Reacciones

Matrix admite reacciones salientes, notificaciones de reacciones entrantes y reacciones de confirmación.

Las herramientas de reacciones salientes están controladas por `channels.matrix.actions.reactions`:

- `react` añade una reacción a un evento de Matrix.
- `reactions` enumera el resumen actual de reacciones de un evento de Matrix.
- `emoji=""` elimina las reacciones propias del bot en ese evento.
- `remove: true` elimina solo la reacción del emoji especificado del bot.

**Orden de resolución** (gana el primer valor definido):

| Configuración           | Orden                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | por cuenta → canal → `messages.ackReaction` → alternativa de emoji de identidad del agente |
| `ackReactionScope`      | por cuenta → canal → `messages.ackReactionScope` → valor predeterminado `"group-mentions"` |
| `reactionNotifications` | por cuenta → canal → valor predeterminado `"own"`                                |

`reactionNotifications: "own"` reenvía eventos `m.reaction` añadidos cuando tienen como destino mensajes de Matrix escritos por el bot; `"off"` deshabilita los eventos del sistema de reacciones. Las eliminaciones de reacciones no se sintetizan como eventos del sistema porque Matrix las expone como redacciones, no como eliminaciones independientes de `m.reaction`.

## Contexto del historial

- `channels.matrix.historyLimit` controla cuántos mensajes recientes de la sala se incluyen como `InboundHistory` cuando un mensaje de una sala de Matrix activa el agente. Recurre a `messages.groupChat.historyLimit`; si ambos no están configurados, el valor predeterminado efectivo es `0`. Establece `0` para deshabilitarlo.
- El historial de salas de Matrix es solo de sala. Los DMs siguen usando el historial normal de sesión.
- El historial de salas de Matrix es solo pendiente: OpenClaw almacena temporalmente mensajes de sala que aún no activaron una respuesta y luego captura esa ventana cuando llega una mención u otro disparador.
- El mensaje disparador actual no se incluye en `InboundHistory`; permanece en el cuerpo entrante principal de ese turno.
- Los reintentos del mismo evento de Matrix reutilizan la captura original del historial en lugar de desplazarse hacia mensajes de sala más nuevos.

## Visibilidad del contexto

Matrix admite el control compartido `contextVisibility` para contexto suplementario de sala, como texto de respuesta obtenido, raíces de hilos e historial pendiente.

- `contextVisibility: "all"` es el valor predeterminado. El contexto suplementario se conserva tal como se recibió.
- `contextVisibility: "allowlist"` filtra el contexto suplementario a remitentes permitidos por las comprobaciones activas de lista de permitidos de sala o usuario.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, pero aún conserva una respuesta citada explícita.

Esta configuración afecta la visibilidad del contexto suplementario, no si el propio mensaje entrante puede activar una respuesta.
La autorización del disparador sigue viniendo de `groupPolicy`, `groups`, `groupAllowFrom` y la configuración de política de DM.

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

Para silenciar por completo los DMs y mantener funcionando las salas, establece `dm.enabled: false`:

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

Consulta [Grupos](/es/channels/groups) para el comportamiento de control por menciones y listas de permitidos.

Ejemplo de emparejamiento para DMs de Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un usuario de Matrix no aprobado sigue enviándote mensajes antes de la aprobación, OpenClaw reutiliza el mismo código de emparejamiento pendiente y puede enviar una respuesta de recordatorio tras una breve espera en lugar de emitir un código nuevo.

Consulta [Emparejamiento](/es/channels/pairing) para el flujo compartido de emparejamiento de DM y el diseño de almacenamiento.

## Reparación de sala directa

Si el estado de mensaje directo se desincroniza, OpenClaw puede terminar con asignaciones `m.direct` obsoletas que apuntan a salas individuales antiguas en lugar del DM activo. Inspecciona la asignación actual de un par:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repárala:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Ambos comandos aceptan `--account <id>` para configuraciones con varias cuentas. El flujo de reparación:

- prefiere un DM estricto 1:1 que ya esté asignado en `m.direct`
- recurre a cualquier DM estricto 1:1 actualmente unido con ese usuario
- crea una sala directa nueva y reescribe `m.direct` si no existe ningún DM saludable

No elimina salas antiguas automáticamente. Elige el DM saludable y actualiza la asignación para que los envíos futuros de Matrix, los avisos de verificación y otros flujos de mensaje directo apunten a la sala correcta.

## Aprobaciones de ejecución

Matrix puede actuar como cliente nativo de aprobación. Configura en `channels.matrix.execApprovals` (o `channels.matrix.accounts.<account>.execApprovals` para una anulación por cuenta):

- `enabled`: entrega aprobaciones mediante solicitudes nativas de Matrix. Cuando no está configurado o es `"auto"`, Matrix se habilita automáticamente una vez que se puede resolver al menos un aprobador. Establece `false` para deshabilitarlo explícitamente.
- `approvers`: IDs de usuario de Matrix (`@owner:example.org`) autorizados para aprobar solicitudes de ejecución. Opcional: recurre a `channels.matrix.dm.allowFrom`.
- `target`: dónde van las solicitudes. `"dm"` (predeterminado) las envía a los DMs de los aprobadores; `"channel"` las envía a la sala o DM de Matrix de origen; `"both"` las envía a ambos.
- `agentFilter` / `sessionFilter`: listas de permitidos opcionales para qué agentes o sesiones activan la entrega por Matrix.

La autorización difiere ligeramente entre tipos de aprobación:

- **Aprobaciones de ejecución** usan `execApprovals.approvers`, con alternativa a `dm.allowFrom`.
- **Aprobaciones de Plugin** autorizan solo mediante `dm.allowFrom`.

Ambos tipos comparten atajos de reacciones de Matrix y actualizaciones de mensajes. Los aprobadores ven atajos de reacción en el mensaje de aprobación principal:

- `✅` permitir una vez
- `❌` denegar
- `♾️` permitir siempre (cuando la política de ejecución efectiva lo permite)

Comandos slash de reserva: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Solo los aprobadores resueltos pueden aprobar o denegar. La entrega a canal para aprobaciones de ejecución incluye el texto del comando; habilita `channel` o `both` solo en salas de confianza.

Relacionado: [Aprobaciones de ejecución](/es/tools/exec-approvals).

## Comandos slash

Los comandos slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, etc.) funcionan directamente en DMs. En salas, OpenClaw también reconoce comandos prefijados con la propia mención de Matrix del bot, por lo que `@bot:server /new` activa la ruta de comandos sin una expresión regular de mención personalizada. Esto mantiene el bot receptivo a publicaciones de estilo de sala `@mention /command` que Element y clientes similares emiten cuando un usuario completa con tabulación el bot antes de escribir el comando.

Las reglas de autorización siguen aplicándose: los remitentes de comandos deben satisfacer las mismas políticas de propietario o lista de permitidos de DM o sala que los mensajes normales.

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

- Los valores de nivel superior de `channels.matrix` actúan como valores predeterminados para las cuentas con nombre salvo que una cuenta los anule.
- Limita una entrada de sala heredada a una cuenta específica con `groups.<room>.account`. Las entradas sin `account` se comparten entre cuentas; `account: "default"` sigue funcionando cuando la cuenta predeterminada está configurada en el nivel superior.

**Selección de cuenta predeterminada:**

- Establece `defaultAccount` para elegir la cuenta con nombre que prefieren el enrutamiento implícito, las pruebas y los comandos de CLI.
- Si tienes varias cuentas y una se llama literalmente `default`, OpenClaw la usa implícitamente incluso cuando `defaultAccount` no está configurado.
- Si tienes varias cuentas con nombre y no se selecciona ninguna predeterminada, los comandos de CLI se niegan a adivinar: establece `defaultAccount` o pasa `--account <id>`.
- El bloque de nivel superior `channels.matrix.*` solo se trata como la cuenta implícita `default` cuando su autenticación está completa (`homeserver` + `accessToken`, o `homeserver` + `userId` + `password`). Las cuentas con nombre siguen siendo descubribles desde `homeserver` + `userId` una vez que las credenciales en caché cubren la autenticación.

**Promoción:**

- Cuando OpenClaw promociona una configuración de cuenta única a varias cuentas durante la reparación o configuración, conserva la cuenta con nombre existente si hay una o si `defaultAccount` ya apunta a una. Solo las claves de autenticación e inicialización de Matrix se trasladan a la cuenta promocionada; las claves compartidas de política de entrega permanecen en el nivel superior.

Consulta [Referencia de configuración](/es/gateway/config-channels#multi-account-all-channels) para el patrón compartido de varias cuentas.

## Homeservers privados/LAN

De forma predeterminada, OpenClaw bloquea los homeservers privados o internos de Matrix como protección contra SSRF, salvo que
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

Ejemplo de configuración de CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Esta habilitación explícita solo permite destinos privados/internos de confianza. Los servidores domésticos públicos sin cifrado, como
`http://matrix.example.org:8008`, siguen bloqueados. Prefiere `https://` siempre que sea posible.

## Uso de proxy para el tráfico de Matrix

Si tu despliegue de Matrix necesita un proxy HTTP(S) saliente explícito, establece `channels.matrix.proxy`:

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
OpenClaw usa la misma configuración de proxy para el tráfico de Matrix en tiempo de ejecución y las comprobaciones de estado de cuenta.

## Resolución de destinos

Matrix acepta estas formas de destino en cualquier lugar donde OpenClaw te pida un destino de sala o usuario:

- Usuarios: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

Los ID de sala de Matrix distinguen entre mayúsculas y minúsculas. Usa exactamente las mismas mayúsculas y minúsculas del ID de sala de Matrix
al configurar destinos de entrega explícitos, tareas cron, vinculaciones o listas de permitidos.
OpenClaw mantiene canónicas las claves internas de sesión para almacenamiento, por lo que esas claves en minúsculas
no son una fuente fiable para los ID de entrega de Matrix.

La búsqueda de directorio en vivo usa la cuenta de Matrix con sesión iniciada:

- Las búsquedas de usuarios consultan el directorio de usuarios de Matrix en ese servidor doméstico.
- Las búsquedas de salas aceptan directamente ID de sala y alias explícitos, y luego recurren a buscar nombres de salas unidas para esa cuenta.
- La búsqueda de nombres de salas unidas es de mejor esfuerzo. Si un nombre de sala no se puede resolver a un ID o alias, se ignora durante la resolución de listas de permitidos en tiempo de ejecución.

## Referencia de configuración

Los campos de estilo lista de permitidos (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) aceptan ID de usuario de Matrix completos (lo más seguro). Las coincidencias exactas del directorio se resuelven al inicio y cada vez que la lista de permitidos cambia mientras el monitor está en ejecución; las entradas que no se pueden resolver se ignoran en tiempo de ejecución. Las listas de permitidos de salas prefieren ID de sala o alias por el mismo motivo.

### Cuenta y conexión

- `enabled`: habilita o deshabilita el canal.
- `name`: etiqueta de visualización opcional para la cuenta.
- `defaultAccount`: ID de cuenta preferido cuando se configuran varias cuentas de Matrix.
- `accounts`: sobrescrituras con nombre por cuenta. Los valores de nivel superior de `channels.matrix` se heredan como predeterminados.
- `homeserver`: URL del servidor doméstico, por ejemplo `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta cuenta se conecte a `localhost`, IP de LAN/Tailscale o nombres de host internos.
- `proxy`: URL de proxy HTTP(S) opcional para el tráfico de Matrix. Se admite sobrescritura por cuenta.
- `userId`: ID de usuario de Matrix completo (`@bot:example.org`).
- `accessToken`: token de acceso para autenticación basada en token. Se admiten valores en texto plano y SecretRef en proveedores de entorno/archivo/ejecución ([Gestión de secretos](/es/gateway/secrets)).
- `password`: contraseña para inicio de sesión basado en contraseña. Se admiten valores en texto plano y SecretRef.
- `deviceId`: ID de dispositivo de Matrix explícito.
- `deviceName`: nombre de visualización del dispositivo usado durante el inicio de sesión con contraseña.
- `avatarUrl`: URL de avatar propio almacenada para sincronización de perfil y actualizaciones de `profile set`.
- `initialSyncLimit`: número máximo de eventos obtenidos durante la sincronización de inicio.

### Cifrado

- `encryption`: habilita E2EE. Valor predeterminado: `false`.
- `startupVerification`: `"if-unverified"` (predeterminado cuando E2EE está activado) o `"off"`. Solicita automáticamente la autoverificación al inicio cuando este dispositivo no está verificado.
- `startupVerificationCooldownHours`: periodo de enfriamiento antes de la siguiente solicitud automática al inicio. Valor predeterminado: `24`.

### Acceso y política

- `groupPolicy`: `"open"`, `"allowlist"` o `"disabled"`. Valor predeterminado: `"allowlist"`.
- `groupAllowFrom`: lista de permitidos de ID de usuario para tráfico de sala.
- `dm.enabled`: cuando es `false`, ignora todos los mensajes directos. Valor predeterminado: `true`.
- `dm.policy`: `"pairing"` (predeterminado), `"allowlist"`, `"open"` o `"disabled"`. Se aplica después de que el bot se haya unido y haya clasificado la sala como mensaje directo; no afecta la gestión de invitaciones.
- `dm.allowFrom`: lista de permitidos de ID de usuario para tráfico de mensajes directos.
- `dm.sessionScope`: `"per-user"` (predeterminado) o `"per-room"`.
- `dm.threadReplies`: sobrescritura solo para mensajes directos del enhebrado de respuestas (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: acepta mensajes de otras cuentas de bot de Matrix configuradas (`true` o `"mentions"`).
- `allowlistOnly`: cuando es `true`, fuerza todas las políticas activas de mensajes directos (excepto `"disabled"`) y las políticas de grupo `"open"` a `"allowlist"`. No cambia las políticas `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"` o `"off"`. Valor predeterminado: `"off"`. Se aplica a toda invitación de Matrix, incluidas las invitaciones de tipo mensaje directo.
- `autoJoinAllowlist`: salas/alias permitidos cuando `autoJoin` es `"allowlist"`. Las entradas de alias se resuelven contra el servidor doméstico, no contra el estado declarado por la sala invitada.
- `contextVisibility`: visibilidad de contexto suplementaria (`"all"` predeterminado, `"allowlist"`, `"allowlist_quote"`).

### Comportamiento de respuesta

- `replyToMode`: `"off"`, `"first"`, `"all"` o `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` o `"always"`.
- `threadBindings`: sobrescrituras por canal para el enrutamiento y ciclo de vida de sesiones vinculadas a hilos.
- `streaming`: `"off"` (predeterminado), `"partial"`, `"quiet"` o forma de objeto `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: cuando es `true`, los bloques completados del asistente se mantienen como mensajes de progreso separados.
- `markdown`: configuración opcional de renderizado Markdown para texto saliente.
- `responsePrefix`: cadena opcional antepuesta a las respuestas salientes.
- `textChunkLimit`: tamaño de fragmento saliente en caracteres cuando `chunkMode: "length"`. Valor predeterminado: `4000`.
- `chunkMode`: `"length"` (predeterminado, divide por conteo de caracteres) o `"newline"` (divide en límites de línea).
- `historyLimit`: número de mensajes recientes de la sala incluidos como `InboundHistory` cuando un mensaje de sala activa el agente. Recurre a `messages.groupChat.historyLimit`; valor predeterminado efectivo `0` (deshabilitado).
- `mediaMaxMb`: límite de tamaño de medios en MB para envíos salientes y procesamiento entrante.

### Configuración de reacciones

- `ackReaction`: sobrescritura de reacción de confirmación para este canal/cuenta.
- `ackReactionScope`: sobrescritura de alcance (`"group-mentions"` predeterminado, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modo de notificación de reacciones entrantes (`"own"` predeterminado, `"off"`).

### Herramientas y sobrescrituras por sala

- `actions`: control de acceso de herramientas por acción (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa de políticas por sala. La identidad de sesión usa el ID de sala estable después de la resolución. (`rooms` es un alias heredado.)
  - `groups.<room>.account`: restringe una entrada de sala heredada a una cuenta específica.
  - `groups.<room>.allowBots`: sobrescritura por sala de la configuración de nivel de canal (`true` o `"mentions"`).
  - `groups.<room>.users`: lista de permitidos de remitentes por sala.
  - `groups.<room>.tools`: sobrescrituras de permitir/denegar herramientas por sala.
  - `groups.<room>.autoReply`: sobrescritura por sala del control por menciones. `true` deshabilita los requisitos de mención para esa sala; `false` los vuelve a forzar.
  - `groups.<room>.skills`: filtro de Skills por sala.
  - `groups.<room>.systemPrompt`: fragmento de prompt del sistema por sala.

### Configuración de aprobación de ejecución

- `execApprovals.enabled`: entrega aprobaciones de ejecución mediante prompts nativos de Matrix.
- `execApprovals.approvers`: ID de usuario de Matrix autorizados a aprobar. Recurre a `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (predeterminado), `"channel"` o `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: listas de permitidos opcionales de agentes/sesiones para la entrega.

## Relacionado

- [Resumen de canales](/es/channels) - todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) - autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) - comportamiento del chat de grupo y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) - enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) - modelo de acceso y endurecimiento
