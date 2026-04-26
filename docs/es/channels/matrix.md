---
read_when:
    - Configuración de Matrix en OpenClaw
    - Configuración de E2EE y verificación de Matrix
summary: Estado de compatibilidad, configuración y ejemplos de configuración de Matrix
title: Matrix
x-i18n:
    generated_at: "2026-04-26T11:23:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1850d51aba7279a3d495c346809b4df26d7da4b7611c5a8c9ab70f9a2b3c827d
    source_path: channels/matrix.md
    workflow: 15
---

Matrix es un plugin de canal incluido en OpenClaw.
Usa el `matrix-js-sdk` oficial y admite mensajes directos, salas, hilos, contenido multimedia, reacciones, encuestas, ubicación y E2EE.

## Plugin incluido

Matrix se distribuye como plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación independiente.

Si usas una compilación antigua o una instalación personalizada que excluye Matrix, instálalo manualmente:

Instalar desde npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instalar desde una copia local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Consulta [Plugins](/es/tools/plugin) para conocer el comportamiento de los plugins y las reglas de instalación.

## Configuración

1. Asegúrate de que el plugin de Matrix esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas/personalizadas pueden añadirlo manualmente con los comandos anteriores.
2. Crea una cuenta de Matrix en tu homeserver.
3. Configura `channels.matrix` con una de estas opciones:
   - `homeserver` + `accessToken`, o
   - `homeserver` + `userId` + `password`.
4. Reinicia el gateway.
5. Inicia un mensaje directo con el bot o invítalo a una sala.
   - Las invitaciones nuevas de Matrix solo funcionan cuando `channels.matrix.autoJoin` las permite.

Rutas de configuración interactiva:

```bash
openclaw channels add
openclaw configure --section channels
```

El asistente de Matrix solicita:

- URL del homeserver
- método de autenticación: token de acceso o contraseña
- ID de usuario (solo autenticación por contraseña)
- nombre opcional del dispositivo
- si se debe habilitar E2EE
- si se debe configurar el acceso a salas y la unión automática a invitaciones

Comportamientos clave del asistente:

- Si las variables de entorno de autenticación de Matrix ya existen y esa cuenta aún no tiene autenticación guardada en la configuración, el asistente ofrece un atajo de variables de entorno para mantener la autenticación en variables de entorno.
- Los nombres de cuenta se normalizan al ID de cuenta. Por ejemplo, `Ops Bot` se convierte en `ops-bot`.
- Las entradas de lista de permitidos para mensajes directos aceptan `@user:server` directamente; los nombres para mostrar solo funcionan cuando una búsqueda en vivo en el directorio encuentra una coincidencia exacta.
- Las entradas de lista de permitidos para salas aceptan directamente ID de sala y alias. Prefiere `!room:server` o `#alias:server`; los nombres no resueltos se ignoran en tiempo de ejecución durante la resolución de la lista de permitidos.
- En el modo de lista de permitidos de unión automática a invitaciones, usa solo destinos de invitación estables: `!roomId:server`, `#alias:server` o `*`. Los nombres simples de sala se rechazan.
- Para resolver nombres de sala antes de guardar, usa `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` usa `off` de forma predeterminada.

Si lo dejas sin definir, el bot no se unirá a salas invitadas ni a invitaciones nuevas de tipo mensaje directo, por lo que no aparecerá en grupos nuevos ni en mensajes directos por invitación a menos que te unas manualmente primero.

Establece `autoJoin: "allowlist"` junto con `autoJoinAllowlist` para restringir qué invitaciones acepta, o establece `autoJoin: "always"` si quieres que se una a todas las invitaciones.

En el modo `allowlist`, `autoJoinAllowlist` solo acepta `!roomId:server`, `#alias:server` o `*`.
</Warning>

Ejemplo de lista de permitidos:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Unirse a todas las invitaciones:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

Configuración mínima basada en token:

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

Configuración basada en contraseña (el token se almacena en caché después del inicio de sesión):

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

Matrix almacena las credenciales en caché en `~/.openclaw/credentials/matrix/`.
La cuenta predeterminada usa `credentials.json`; las cuentas con nombre usan `credentials-<account>.json`.
Cuando existen credenciales en caché allí, OpenClaw considera Matrix como configurado para la configuración inicial, `doctor` y la detección del estado del canal, incluso si la autenticación actual no está definida directamente en la configuración.

Equivalentes de variables de entorno (se usan cuando la clave de configuración no está definida):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Para cuentas no predeterminadas, usa variables de entorno con alcance por cuenta:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Ejemplo para la cuenta `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Para el ID de cuenta normalizado `ops-bot`, usa:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix escapa la puntuación en los ID de cuenta para mantener las variables de entorno con alcance libres de colisiones.
Por ejemplo, `-` se convierte en `_X2D_`, por lo que `ops-prod` se asigna a `MATRIX_OPS_X2D_PROD_*`.

El asistente interactivo solo ofrece el atajo de variables de entorno cuando esas variables de autenticación ya están presentes y la cuenta seleccionada todavía no tiene la autenticación de Matrix guardada en la configuración.

`MATRIX_HOMESERVER` no se puede definir desde un `.env` del espacio de trabajo; consulta [Workspace `.env` files](/es/gateway/security).

## Ejemplo de configuración

Esta es una configuración base práctica con emparejamiento de mensajes directos, lista de permitidos de salas y E2EE habilitado:

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
        "!roomid:example.org": {
          requireMention: true,
        },
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

`autoJoin` se aplica a todas las invitaciones de Matrix, incluidas las invitaciones de tipo mensaje directo. OpenClaw no puede clasificar de forma fiable una sala invitada como mensaje directo o grupo en el momento de la invitación, por lo que todas las invitaciones pasan primero por `autoJoin`. `dm.policy` se aplica después de que el bot se haya unido y la sala se clasifique como mensaje directo.

## Vistas previas de streaming

El streaming de respuestas de Matrix es opcional.

Establece `channels.matrix.streaming` en `"partial"` cuando quieras que OpenClaw envíe una sola respuesta de vista previa en vivo, edite esa vista previa en su lugar mientras el modelo genera texto y luego la finalice cuando la respuesta termine:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` es el valor predeterminado. OpenClaw espera la respuesta final y la envía una sola vez.
- `streaming: "partial"` crea un mensaje de vista previa editable para el bloque actual del asistente usando mensajes de texto normales de Matrix. Esto conserva el comportamiento heredado de Matrix de notificación primero en vista previa, por lo que los clientes estándar pueden notificar con el primer texto de vista previa transmitido en lugar del bloque finalizado.
- `streaming: "quiet"` crea un aviso silencioso de vista previa editable para el bloque actual del asistente. Úsalo solo cuando también configures reglas push del destinatario para las ediciones de vista previa finalizadas.
- `blockStreaming: true` habilita mensajes de progreso de Matrix separados. Con el streaming de vista previa habilitado, Matrix mantiene el borrador en vivo para el bloque actual y conserva los bloques completados como mensajes separados.
- Cuando el streaming de vista previa está activado y `blockStreaming` está desactivado, Matrix edita el borrador en vivo en su lugar y finaliza ese mismo evento cuando termina el bloque o el turno.
- Si la vista previa ya no cabe en un único evento de Matrix, OpenClaw detiene el streaming de vista previa y vuelve a la entrega final normal.
- Las respuestas con contenido multimedia siguen enviando adjuntos de forma normal. Si una vista previa obsoleta ya no se puede reutilizar con seguridad, OpenClaw la elimina antes de enviar la respuesta multimedia final.
- Las ediciones de vista previa tienen un coste adicional de llamadas a la API de Matrix. Deja el streaming desactivado si quieres el comportamiento más conservador respecto a los límites de tasa.

`blockStreaming` no habilita por sí solo las vistas previas de borrador.
Usa `streaming: "partial"` o `streaming: "quiet"` para las ediciones de vista previa; después añade `blockStreaming: true` solo si también quieres que los bloques completados del asistente permanezcan visibles como mensajes de progreso separados.

Si necesitas notificaciones estándar de Matrix sin reglas push personalizadas, usa `streaming: "partial"` para el comportamiento de vista previa primero o deja `streaming` desactivado para la entrega solo final. Con `streaming: "off"`:

- `blockStreaming: true` envía cada bloque terminado como un mensaje normal de Matrix con notificación.
- `blockStreaming: false` envía solo la respuesta final completada como un mensaje normal de Matrix con notificación.

### Reglas push autoalojadas de Matrix para vistas previas silenciosas finalizadas

El streaming silencioso (`streaming: "quiet"`) solo notifica a los destinatarios una vez que se finaliza un bloque o turno; una regla push por usuario tiene que coincidir con el marcador de vista previa finalizada. Consulta [Matrix push rules for quiet previews](/es/channels/matrix-push-rules) para ver la configuración completa (token del destinatario, comprobación de pusher, instalación de reglas y notas por homeserver).

## Salas bot a bot

De forma predeterminada, se ignoran los mensajes de otras cuentas Matrix de OpenClaw configuradas.

Usa `allowBots` cuando quieras intencionadamente tráfico Matrix entre agentes:

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

- `allowBots: true` acepta mensajes de otras cuentas bot de Matrix configuradas en salas permitidas y mensajes directos.
- `allowBots: "mentions"` acepta esos mensajes solo cuando mencionan visiblemente a este bot en salas. Los mensajes directos siguen permitidos.
- `groups.<room>.allowBots` sobrescribe la configuración a nivel de cuenta para una sala.
- OpenClaw sigue ignorando mensajes del mismo ID de usuario de Matrix para evitar bucles de autorrespuesta.
- Matrix no expone aquí una marca nativa de bot; OpenClaw trata «creado por bot» como «enviado por otra cuenta Matrix configurada en este gateway de OpenClaw».

Usa listas de permitidos estrictas para salas y requisitos de mención al habilitar tráfico bot a bot en salas compartidas.

## Cifrado y verificación

En salas cifradas (E2EE), los eventos salientes de imagen usan `thumbnail_file` para que las vistas previas de imagen se cifren junto con el adjunto completo. Las salas no cifradas siguen usando `thumbnail_url` sin cifrar. No se necesita configuración: el plugin detecta automáticamente el estado E2EE.

Habilitar cifrado:

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

Comandos de verificación (todos aceptan `--verbose` para diagnósticos y `--json` para salida legible por máquina):

```bash
openclaw matrix verify status
```

Estado detallado (diagnóstico completo):

```bash
openclaw matrix verify status --verbose
```

Incluir la clave de recuperación almacenada en la salida legible por máquina:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Inicializar el estado de cross-signing y verificación:

```bash
openclaw matrix verify bootstrap
```

Diagnóstico detallado de bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Forzar un reinicio limpio de la identidad de cross-signing antes de inicializar:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Verificar este dispositivo con una clave de recuperación:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Este comando informa de tres estados separados:

- `Recovery key accepted`: Matrix aceptó la clave de recuperación para el almacenamiento secreto o la confianza del dispositivo.
- `Backup usable`: la copia de seguridad de claves de sala se puede cargar con material de recuperación de confianza.
- `Device verified by owner`: el dispositivo actual de OpenClaw tiene confianza completa de identidad de cross-signing de Matrix.

`Signed by owner` en la salida detallada o JSON es solo diagnóstico. OpenClaw no lo considera suficiente a menos que `Cross-signing verified` también sea `yes`.

El comando sigue devolviendo un código distinto de cero cuando la confianza completa de identidad de Matrix está incompleta, incluso si la clave de recuperación puede desbloquear el material de copia de seguridad. En ese caso, completa la autoverificación desde otro cliente de Matrix:

```bash
openclaw matrix verify self
```

Acepta la solicitud en otro cliente de Matrix, compara los emoji o decimales de SAS y escribe `yes` solo cuando coincidan. El comando espera a que Matrix informe `Cross-signing verified: yes` antes de salir correctamente.

Usa `verify bootstrap --force-reset-cross-signing` solo cuando quieras reemplazar intencionadamente la identidad actual de cross-signing.

Detalles detallados de verificación del dispositivo:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Comprobar el estado de la copia de seguridad de claves de sala:

```bash
openclaw matrix verify backup status
```

Diagnóstico detallado del estado de la copia de seguridad:

```bash
openclaw matrix verify backup status --verbose
```

Restaurar claves de sala desde la copia de seguridad del servidor:

```bash
openclaw matrix verify backup restore
```

Si la clave de copia de seguridad todavía no está cargada en disco, pasa la clave de recuperación de Matrix:

```bash
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
```

Flujo interactivo de autoverificación:

```bash
openclaw matrix verify self
```

Para solicitudes de verificación de nivel inferior o entrantes, usa:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

Usa `openclaw matrix verify cancel <id>` para cancelar una solicitud.

Diagnóstico detallado de restauración:

```bash
openclaw matrix verify backup restore --verbose
```

Eliminar la copia de seguridad actual del servidor y crear una nueva base de copia de seguridad. Si la clave de copia de seguridad almacenada no se puede cargar limpiamente, este restablecimiento también puede recrear el almacenamiento secreto para que futuros arranques en frío puedan cargar la nueva clave de copia de seguridad:

```bash
openclaw matrix verify backup reset --yes
```

Todos los comandos `verify` son concisos por defecto (incluido el registro interno silencioso del SDK) y muestran diagnósticos detallados solo con `--verbose`.
Usa `--json` para obtener una salida completa legible por máquina al crear scripts.

En configuraciones con varias cuentas, los comandos CLI de Matrix usan la cuenta predeterminada implícita de Matrix a menos que pases `--account <id>`.
Si configuras varias cuentas con nombre, establece primero `channels.matrix.defaultAccount` o esas operaciones implícitas de CLI se detendrán y te pedirán que elijas una cuenta explícitamente.
Usa `--account` siempre que quieras que las operaciones de verificación o de dispositivo apunten explícitamente a una cuenta con nombre:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Cuando el cifrado está deshabilitado o no está disponible para una cuenta con nombre, las advertencias de Matrix y los errores de verificación apuntan a la clave de configuración de esa cuenta, por ejemplo `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Qué significa verificado">
    OpenClaw trata un dispositivo como verificado solo cuando tu propia identidad de cross-signing lo firma. `verify status --verbose` muestra tres señales de confianza:

    - `Locally trusted`: de confianza solo para este cliente
    - `Cross-signing verified`: el SDK informa verificación mediante cross-signing
    - `Signed by owner`: firmado por tu propia clave de autofirma

    `Verified by owner` pasa a ser `yes` solo cuando existe verificación de cross-signing.
    La confianza local o una firma del propietario por sí sola no es suficiente para que OpenClaw trate el dispositivo como completamente verificado.

  </Accordion>

  <Accordion title="Qué hace bootstrap">
    `verify bootstrap` es el comando de reparación y configuración para cuentas cifradas. En orden, hace lo siguiente:

    - inicializa el almacenamiento secreto, reutilizando una clave de recuperación existente cuando es posible
    - inicializa el cross-signing y sube las claves públicas de cross-signing que falten
    - marca y firma mediante cross-signing el dispositivo actual
    - crea una copia de seguridad de claves de sala en el servidor si todavía no existe una

    Si el homeserver requiere UIA para subir claves de cross-signing, OpenClaw intenta primero sin autenticación, luego `m.login.dummy` y después `m.login.password` (requiere `channels.matrix.password`). Usa `--force-reset-cross-signing` solo cuando quieras descartar intencionadamente la identidad actual.

  </Accordion>

  <Accordion title="Nueva base de copia de seguridad">
    Si quieres mantener el funcionamiento de futuros mensajes cifrados y aceptas perder historial antiguo irrecuperable:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Añade `--account <id>` para apuntar a una cuenta con nombre. Esto también puede recrear el almacenamiento secreto si el secreto actual de copia de seguridad no se puede cargar de forma segura.
    Añade `--rotate-recovery-key` solo cuando quieras intencionadamente que la clave de recuperación antigua deje de desbloquear la nueva base de copia de seguridad.

  </Accordion>

  <Accordion title="Comportamiento al iniciar">
    Con `encryption: true`, `startupVerification` usa `"if-unverified"` por defecto. Al iniciar, un dispositivo no verificado solicita autoverificación en otro cliente de Matrix, omite duplicados y aplica un tiempo de espera. Ajusta esto con `startupVerificationCooldownHours` o desactívalo con `startupVerification: "off"`.

    El inicio también ejecuta una pasada conservadora de bootstrap criptográfico que reutiliza el almacenamiento secreto actual y la identidad actual de cross-signing. Si el estado de bootstrap está dañado, OpenClaw intenta una reparación protegida incluso sin `channels.matrix.password`; si el homeserver requiere UIA con contraseña, el inicio registra una advertencia y sigue sin ser fatal. Los dispositivos ya firmados por el propietario se conservan.

    Consulta [Matrix migration](/es/install/migrating-matrix) para ver el flujo de actualización completo.

  </Accordion>

  <Accordion title="Avisos de verificación">
    Matrix publica avisos del ciclo de vida de verificación en la sala estricta de verificación por mensaje directo como mensajes `m.notice`: solicitud, listo (con guía de "Verificar por emoji"), inicio/finalización y detalles de SAS (emoji/decimal) cuando están disponibles.

    Las solicitudes entrantes desde otro cliente de Matrix se rastrean y se aceptan automáticamente. Para la autoverificación, OpenClaw inicia el flujo SAS automáticamente y confirma su propio lado una vez que la verificación por emoji está disponible; aun así, necesitas comparar y confirmar "They match" en tu cliente de Matrix.

    Los avisos del sistema de verificación no se reenvían al flujo de chat del agente.

  </Accordion>

  <Accordion title="Dispositivo de Matrix eliminado o no válido">
    Si `verify status` dice que el dispositivo actual ya no aparece en el homeserver, crea un nuevo dispositivo Matrix de OpenClaw. Para inicio de sesión con contraseña:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Para autenticación con token, crea un token de acceso nuevo en tu cliente de Matrix o en la interfaz de administración y luego actualiza OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Sustituye `assistant` por el ID de cuenta del comando fallido, o omite `--account` para la cuenta predeterminada.

  </Accordion>

  <Accordion title="Higiene de dispositivos">
    Los dispositivos antiguos gestionados por OpenClaw pueden acumularse. Lista y elimina los obsoletos:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Almacén criptográfico">
    Matrix E2EE usa la ruta criptográfica Rust oficial de `matrix-js-sdk` con `fake-indexeddb` como shim de IndexedDB. El estado criptográfico persiste en `crypto-idb-snapshot.json` (permisos de archivo restrictivos).

    El estado de ejecución cifrado se guarda en `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e incluye el almacén de sincronización, el almacén criptográfico, la clave de recuperación, la instantánea IDB, los vínculos de hilos y el estado de verificación al iniciar. Cuando el token cambia pero la identidad de la cuenta sigue siendo la misma, OpenClaw reutiliza la mejor raíz existente para que el estado anterior siga siendo visible.

  </Accordion>
</AccordionGroup>

## Gestión de perfiles

Actualiza el perfil propio de Matrix para la cuenta seleccionada con:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Añade `--account <id>` cuando quieras apuntar explícitamente a una cuenta Matrix con nombre.

Matrix acepta directamente URL de avatar `mxc://`. Cuando pasas una URL de avatar `http://` o `https://`, OpenClaw primero la sube a Matrix y almacena la URL `mxc://` resuelta de vuelta en `channels.matrix.avatarUrl` (o en la anulación de la cuenta seleccionada).

## Hilos

Matrix admite hilos nativos de Matrix tanto para respuestas automáticas como para envíos de herramientas de mensajes.

- `dm.sessionScope: "per-user"` (predeterminado) mantiene el enrutamiento de mensajes directos de Matrix con alcance por remitente, de modo que varias salas de mensajes directos pueden compartir una sesión cuando se resuelven al mismo par.
- `dm.sessionScope: "per-room"` aísla cada sala de mensajes directos de Matrix en su propia clave de sesión mientras sigue usando la autenticación y las comprobaciones de lista de permitidos normales para mensajes directos.
- Los vínculos explícitos de conversación de Matrix siguen teniendo prioridad sobre `dm.sessionScope`, por lo que las salas y los hilos vinculados conservan su sesión de destino elegida.
- `threadReplies: "off"` mantiene las respuestas en el nivel superior y mantiene los mensajes entrantes en hilos en la sesión principal.
- `threadReplies: "inbound"` responde dentro de un hilo solo cuando el mensaje entrante ya estaba en ese hilo.
- `threadReplies: "always"` mantiene las respuestas de sala en un hilo con raíz en el mensaje que las desencadenó y enruta esa conversación a través de la sesión con alcance de hilo correspondiente desde el primer mensaje desencadenante.
- `dm.threadReplies` sobrescribe la configuración de nivel superior solo para mensajes directos. Por ejemplo, puedes mantener aislados los hilos de salas mientras mantienes los mensajes directos planos.
- Los mensajes entrantes en hilos incluyen el mensaje raíz del hilo como contexto adicional para el agente.
- Los envíos de herramientas de mensajes heredan automáticamente el hilo actual de Matrix cuando el destino es la misma sala, o el mismo objetivo de usuario de mensaje directo, a menos que se proporcione un `threadId` explícito.
- La reutilización del mismo objetivo de usuario de mensaje directo dentro de la misma sesión solo se activa cuando los metadatos de la sesión actual demuestran el mismo par de mensajes directos en la misma cuenta Matrix; en caso contrario, OpenClaw vuelve al enrutamiento normal con alcance por usuario.
- Cuando OpenClaw detecta que una sala de mensajes directos de Matrix colisiona con otra sala de mensajes directos en la misma sesión compartida de Matrix, publica una única vez un `m.notice` en esa sala con la vía de escape `/focus` cuando los vínculos de hilos están habilitados y la sugerencia `dm.sessionScope`.
- Se admiten vínculos de hilos en tiempo de ejecución para Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y `/acp spawn` vinculado a hilos funcionan en salas y mensajes directos de Matrix.
- `/focus` de nivel superior en una sala o mensaje directo de Matrix crea un nuevo hilo de Matrix y lo vincula a la sesión de destino cuando `threadBindings.spawnSubagentSessions=true`.
- Ejecutar `/focus` o `/acp spawn --thread here` dentro de un hilo de Matrix existente vincula ese hilo actual en su lugar.

## Vínculos de conversación de ACP

Las salas, los mensajes directos y los hilos existentes de Matrix se pueden convertir en espacios de trabajo ACP duraderos sin cambiar la superficie de chat.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del mensaje directo, sala o hilo existente de Matrix que quieras seguir usando.
- En un mensaje directo o sala de Matrix de nivel superior, el mensaje directo o la sala actual se mantienen como superficie de chat y los mensajes futuros se enrutan a la sesión ACP creada.
- Dentro de un hilo de Matrix existente, `--bind here` vincula ese hilo actual en su lugar.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada en su lugar.
- `/acp close` cierra la sesión ACP y elimina el vínculo.

Notas:

- `--bind here` no crea un hilo hijo de Matrix.
- `threadBindings.spawnAcpSessions` solo es necesario para `/acp spawn --thread auto|here`, donde OpenClaw necesita crear o vincular un hilo hijo de Matrix.

### Configuración de vínculos de hilos

Matrix hereda los valores predeterminados globales de `session.threadBindings` y también admite anulaciones por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Las marcas de creación vinculada a hilos de Matrix son opcionales:

- Establece `threadBindings.spawnSubagentSessions: true` para permitir que `/focus` de nivel superior cree y vincule nuevos hilos de Matrix.
- Establece `threadBindings.spawnAcpSessions: true` para permitir que `/acp spawn --thread auto|here` vincule sesiones ACP a hilos de Matrix.

## Reacciones

Matrix admite acciones de reacción salientes, notificaciones de reacción entrantes y reacciones de acuse de recibo entrantes.

- El uso de herramientas de reacciones salientes está controlado por `channels["matrix"].actions.reactions`.
- `react` añade una reacción a un evento específico de Matrix.
- `reactions` muestra el resumen actual de reacciones para un evento específico de Matrix.
- `emoji=""` elimina las reacciones del propio bot en ese evento.
- `remove: true` elimina solo la reacción del emoji especificado de la cuenta del bot.

Las reacciones de acuse de recibo usan el orden estándar de resolución de OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- alternativa con emoji de identidad del agente

El alcance de la reacción de acuse de recibo se resuelve en este orden:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

El modo de notificación de reacciones se resuelve en este orden:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- predeterminado: `own`

Comportamiento:

- `reactionNotifications: "own"` reenvía eventos `m.reaction` añadidos cuando apuntan a mensajes de Matrix creados por el bot.
- `reactionNotifications: "off"` desactiva los eventos del sistema de reacciones.
- Las eliminaciones de reacciones no se sintetizan en eventos del sistema porque Matrix las presenta como redacciones, no como eliminaciones independientes de `m.reaction`.

## Contexto del historial

- `channels.matrix.historyLimit` controla cuántos mensajes recientes de la sala se incluyen como `InboundHistory` cuando un mensaje de una sala de Matrix activa al agente. Recurre a `messages.groupChat.historyLimit`; si ambos no están definidos, el valor efectivo predeterminado es `0`. Establece `0` para desactivarlo.
- El historial de salas de Matrix es solo de sala. Los mensajes directos siguen usando el historial normal de la sesión.
- El historial de salas de Matrix es solo de pendientes: OpenClaw almacena en búfer los mensajes de sala que todavía no han activado una respuesta y luego toma una instantánea de esa ventana cuando llega una mención u otro activador.
- El mensaje activador actual no se incluye en `InboundHistory`; permanece en el cuerpo principal entrante de ese turno.
- Los reintentos del mismo evento de Matrix reutilizan la instantánea original del historial en lugar de avanzar hacia mensajes más nuevos de la sala.

## Visibilidad del contexto

Matrix admite el control compartido `contextVisibility` para contexto suplementario de la sala, como texto de respuesta recuperado, raíces de hilos e historial pendiente.

- `contextVisibility: "all"` es el valor predeterminado. El contexto suplementario se conserva tal como se recibió.
- `contextVisibility: "allowlist"` filtra el contexto suplementario a remitentes permitidos por las comprobaciones activas de lista de permitidos de sala/usuario.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, pero sigue conservando una respuesta citada explícita.

Esta configuración afecta a la visibilidad del contexto suplementario, no a si el mensaje entrante en sí puede activar una respuesta.
La autorización del activador sigue viniendo de `groupPolicy`, `groups`, `groupAllowFrom` y la configuración de políticas de mensajes directos.

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
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Consulta [Groups](/es/channels/groups) para conocer el comportamiento de control por mención y lista de permitidos.

Ejemplo de emparejamiento para mensajes directos de Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un usuario de Matrix no aprobado sigue enviándote mensajes antes de la aprobación, OpenClaw reutiliza el mismo código de emparejamiento pendiente y puede volver a enviar una respuesta de recordatorio después de un breve tiempo de espera en lugar de generar un código nuevo.

Consulta [Pairing](/es/channels/pairing) para ver el flujo compartido de emparejamiento de mensajes directos y la estructura de almacenamiento.

## Reparación directa de salas

Si el estado de los mensajes directos se desincroniza, OpenClaw puede acabar con asignaciones `m.direct` obsoletas que apuntan a salas individuales antiguas en lugar del mensaje directo activo. Inspecciona la asignación actual de un par con:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repárala con:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

El flujo de reparación:

- prefiere un mensaje directo estricto 1:1 que ya esté asignado en `m.direct`
- recurre a cualquier mensaje directo estricto 1:1 actualmente unido con ese usuario
- crea una sala directa nueva y reescribe `m.direct` si no existe un mensaje directo en buen estado

El flujo de reparación no elimina salas antiguas automáticamente. Solo elige el mensaje directo en buen estado y actualiza la asignación para que los nuevos envíos de Matrix, avisos de verificación y otros flujos de mensajes directos vuelvan a apuntar a la sala correcta.

## Aprobaciones de exec

Matrix puede actuar como cliente de aprobación nativo para una cuenta de Matrix. Los controles nativos de enrutamiento de mensajes directos/canales siguen estando en la configuración de aprobación de exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcional; recurre a `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Los aprobadores deben ser ID de usuario de Matrix como `@owner:example.org`. Matrix habilita automáticamente las aprobaciones nativas cuando `enabled` no está definido o es `"auto"` y se puede resolver al menos un aprobador. Las aprobaciones de exec usan primero `execApprovals.approvers` y pueden recurrir a `channels.matrix.dm.allowFrom`. Las aprobaciones de plugins autorizan mediante `channels.matrix.dm.allowFrom`. Establece `enabled: false` para desactivar explícitamente Matrix como cliente de aprobación nativo. En caso contrario, las solicitudes de aprobación recurren a otras rutas de aprobación configuradas o a la política de reserva de aprobación.

El enrutamiento nativo de Matrix admite ambos tipos de aprobación:

- `channels.matrix.execApprovals.*` controla el modo nativo de distribución DM/canal para los avisos de aprobación de Matrix.
- Las aprobaciones de exec usan el conjunto de aprobadores de exec de `execApprovals.approvers` o `channels.matrix.dm.allowFrom`.
- Las aprobaciones de plugins usan la lista de permitidos de DM de Matrix de `channels.matrix.dm.allowFrom`.
- Los atajos de reacción y las actualizaciones de mensajes de Matrix se aplican tanto a aprobaciones de exec como de plugins.

Reglas de entrega:

- `target: "dm"` envía los avisos de aprobación a los mensajes directos de los aprobadores
- `target: "channel"` devuelve el aviso a la sala o DM de Matrix de origen
- `target: "both"` envía a los mensajes directos de los aprobadores y a la sala o DM de Matrix de origen

Los avisos de aprobación de Matrix inicializan atajos de reacción en el mensaje principal de aprobación:

- `✅` = permitir una vez
- `❌` = denegar
- `♾️` = permitir siempre cuando esa decisión esté permitida por la política efectiva de exec

Los aprobadores pueden reaccionar a ese mensaje o usar los comandos con barra de reserva: `/approve <id> allow-once`, `/approve <id> allow-always` o `/approve <id> deny`.

Solo los aprobadores resueltos pueden aprobar o denegar. Para las aprobaciones de exec, la entrega por canal incluye el texto del comando, así que activa `channel` o `both` solo en salas de confianza.

Anulación por cuenta:

- `channels.matrix.accounts.<account>.execApprovals`

Documentación relacionada: [Exec approvals](/es/tools/exec-approvals)

## Comandos con barra

Los comandos con barra de Matrix (por ejemplo `/new`, `/reset`, `/model`) funcionan directamente en mensajes directos. En las salas, OpenClaw también reconoce comandos con barra precedidos por la propia mención Matrix del bot, de modo que `@bot:server /new` activa la ruta del comando sin necesidad de una expresión regular personalizada de mención. Esto mantiene al bot sensible a publicaciones de estilo sala `@mención /comando` que emiten Element y clientes similares cuando un usuario completa con tabulación el bot antes de escribir el comando.

Las reglas de autorización siguen aplicándose: los remitentes de comandos deben cumplir las políticas de propietario o de lista de permitidos de mensajes directos o salas igual que los mensajes normales.

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

Los valores de nivel superior de `channels.matrix` actúan como valores predeterminados para las cuentas con nombre, a menos que una cuenta los sobrescriba.
Puedes limitar entradas de sala heredadas a una cuenta Matrix con `groups.<room>.account`.
Las entradas sin `account` siguen compartidas entre todas las cuentas Matrix, y las entradas con `account: "default"` siguen funcionando cuando la cuenta predeterminada está configurada directamente en `channels.matrix.*` de nivel superior.
Los valores predeterminados parciales de autenticación compartida no crean por sí solos una cuenta predeterminada implícita separada. OpenClaw solo sintetiza la cuenta `default` de nivel superior cuando esa predeterminada tiene autenticación nueva (`homeserver` más `accessToken`, o `homeserver` más `userId` y `password`); las cuentas con nombre pueden seguir siendo detectables desde `homeserver` más `userId` cuando las credenciales en caché satisfacen la autenticación más adelante.
Si Matrix ya tiene exactamente una cuenta con nombre, o `defaultAccount` apunta a una clave existente de cuenta con nombre, la promoción de reparación/configuración de una sola cuenta a varias cuentas conserva esa cuenta en lugar de crear una entrada nueva `accounts.default`. Solo las claves de autenticación/bootstrap de Matrix se mueven a esa cuenta promovida; las claves compartidas de política de entrega permanecen en el nivel superior.
Establece `defaultAccount` cuando quieras que OpenClaw prefiera una cuenta Matrix con nombre para el enrutamiento implícito, el sondeo y las operaciones de CLI.
Si se configuran varias cuentas Matrix y un ID de cuenta es `default`, OpenClaw usa esa cuenta implícitamente incluso cuando `defaultAccount` no está definido.
Si configuras varias cuentas con nombre, establece `defaultAccount` o pasa `--account <id>` en los comandos CLI que dependan de la selección implícita de cuenta.
Pasa `--account <id>` a `openclaw matrix verify ...` y `openclaw matrix devices ...` cuando quieras sobrescribir esa selección implícita para un comando.

Consulta [Configuration reference](/es/gateway/config-channels#multi-account-all-channels) para ver el patrón compartido de varias cuentas.

## Homeservers privados/LAN

De forma predeterminada, OpenClaw bloquea homeservers Matrix privados/internos para protección SSRF a menos que lo habilites explícitamente por cuenta.

Si tu homeserver se ejecuta en localhost, una IP LAN/Tailscale o un nombre de host interno, habilita `network.dangerouslyAllowPrivateNetwork` para esa cuenta Matrix:

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

Ejemplo de configuración por CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Esta activación explícita solo permite destinos privados/internos de confianza. Los homeservers públicos en texto claro como `http://matrix.example.org:8008` siguen bloqueados. Prefiere `https://` siempre que sea posible.

## Uso de proxy para tráfico Matrix

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
OpenClaw usa la misma configuración de proxy para el tráfico Matrix en tiempo de ejecución y para las comprobaciones de estado de la cuenta.

## Resolución de destinos

Matrix acepta estos formatos de destino en cualquier lugar donde OpenClaw te pida un destino de sala o usuario:

- Usuarios: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

Los ID de sala de Matrix distinguen entre mayúsculas y minúsculas. Usa la capitalización exacta del ID de sala de Matrix al configurar destinos de entrega explícitos, trabajos Cron, vínculos o listas de permitidos.
OpenClaw mantiene canónicas las claves internas de sesión para el almacenamiento, por lo que esas claves en minúsculas no son una fuente fiable para los ID de entrega de Matrix.

La búsqueda en directorio en vivo usa la cuenta Matrix con sesión iniciada:

- Las búsquedas de usuarios consultan el directorio de usuarios de Matrix en ese homeserver.
- Las búsquedas de salas aceptan directamente ID de sala y alias explícitos, y luego recurren a buscar nombres de salas unidas para esa cuenta.
- La búsqueda por nombre de sala unida es de mejor esfuerzo. Si un nombre de sala no se puede resolver a un ID o alias, se ignora en la resolución de listas de permitidos en tiempo de ejecución.

## Referencia de configuración

- `enabled`: habilita o deshabilita el canal.
- `name`: etiqueta opcional para la cuenta.
- `defaultAccount`: ID de cuenta preferido cuando hay varias cuentas Matrix configuradas.
- `homeserver`: URL del homeserver, por ejemplo `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta cuenta Matrix se conecte a homeservers privados/internos. Habilítalo cuando el homeserver se resuelva a `localhost`, una IP LAN/Tailscale o un host interno como `matrix-synapse`.
- `proxy`: URL opcional de proxy HTTP(S) para el tráfico de Matrix. Las cuentas con nombre pueden sobrescribir el valor predeterminado de nivel superior con su propio `proxy`.
- `userId`: ID completo de usuario de Matrix, por ejemplo `@bot:example.org`.
- `accessToken`: token de acceso para autenticación basada en token. Se admiten valores en texto plano y valores SecretRef para `channels.matrix.accessToken` y `channels.matrix.accounts.<id>.accessToken` en proveedores env/file/exec. Consulta [Secrets Management](/es/gateway/secrets).
- `password`: contraseña para inicio de sesión basado en contraseña. Se admiten valores en texto plano y valores SecretRef.
- `deviceId`: ID explícito del dispositivo Matrix.
- `deviceName`: nombre para mostrar del dispositivo para inicio de sesión con contraseña.
- `avatarUrl`: URL almacenada del avatar propio para sincronización de perfil y actualizaciones de `profile set`.
- `initialSyncLimit`: número máximo de eventos obtenidos durante la sincronización de inicio.
- `encryption`: habilita E2EE.
- `allowlistOnly`: cuando es `true`, actualiza la política de sala `open` a `allowlist` y fuerza todas las políticas activas de mensajes directos salvo `disabled` (incluidas `pairing` y `open`) a `allowlist`. No afecta a las políticas `disabled`.
- `allowBots`: permite mensajes de otras cuentas Matrix configuradas de OpenClaw (`true` o `"mentions"`).
- `groupPolicy`: `open`, `allowlist` o `disabled`.
- `contextVisibility`: modo de visibilidad del contexto suplementario de la sala (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: lista de permitidos de ID de usuario para tráfico de sala. Los ID completos de usuario de Matrix son lo más seguro; las coincidencias exactas del directorio se resuelven al inicio y cuando cambia la lista de permitidos mientras el monitor está en ejecución. Los nombres no resueltos se ignoran.
- `historyLimit`: máximo de mensajes de sala que se incluirán como contexto de historial de grupo. Recurre a `messages.groupChat.historyLimit`; si ambos no están definidos, el valor efectivo predeterminado es `0`. Establece `0` para desactivarlo.
- `replyToMode`: `off`, `first`, `all` o `batched`.
- `markdown`: configuración opcional de renderizado Markdown para texto saliente de Matrix.
- `streaming`: `off` (predeterminado), `"partial"`, `"quiet"`, `true` o `false`. `"partial"` y `true` habilitan actualizaciones de borrador con vista previa primero usando mensajes de texto normales de Matrix. `"quiet"` usa avisos de vista previa sin notificación para configuraciones autoalojadas con reglas push. `false` equivale a `"off"`.
- `blockStreaming`: `true` habilita mensajes de progreso separados para bloques completados del asistente mientras el streaming de vista previa de borrador está activo.
- `threadReplies`: `off`, `inbound` o `always`.
- `threadBindings`: anulaciones por canal para enrutamiento y ciclo de vida de sesiones vinculadas a hilos.
- `startupVerification`: modo de solicitud automática de autoverificación al inicio (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: tiempo de espera antes de reintentar solicitudes automáticas de verificación al inicio.
- `textChunkLimit`: tamaño del fragmento de mensaje saliente en caracteres (se aplica cuando `chunkMode` es `length`).
- `chunkMode`: `length` divide mensajes por número de caracteres; `newline` los divide en límites de línea.
- `responsePrefix`: cadena opcional añadida al principio de todas las respuestas salientes para este canal.
- `ackReaction`: anulación opcional de reacción de acuse de recibo para este canal/cuenta.
- `ackReactionScope`: anulación opcional del alcance de la reacción de acuse de recibo (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modo de notificación de reacciones entrantes (`own`, `off`).
- `mediaMaxMb`: límite de tamaño multimedia en MB para envíos salientes y procesamiento de multimedia entrante.
- `autoJoin`: política de unión automática a invitaciones (`always`, `allowlist`, `off`). Predeterminado: `off`. Se aplica a todas las invitaciones de Matrix, incluidas las de estilo DM.
- `autoJoinAllowlist`: salas/alias permitidos cuando `autoJoin` es `allowlist`. Las entradas de alias se resuelven a ID de sala durante el procesamiento de la invitación; OpenClaw no confía en el estado del alias declarado por la sala invitada.
- `dm`: bloque de política de DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: controla el acceso a DM después de que OpenClaw se haya unido a la sala y la haya clasificado como DM. No cambia si una invitación se une automáticamente o no.
- `dm.allowFrom`: lista de permitidos de ID de usuario para tráfico DM. Los ID completos de usuario de Matrix son lo más seguro; las coincidencias exactas del directorio se resuelven al inicio y cuando cambia la lista de permitidos mientras el monitor está en ejecución. Los nombres no resueltos se ignoran.
- `dm.sessionScope`: `per-user` (predeterminado) o `per-room`. Usa `per-room` cuando quieras que cada sala DM de Matrix mantenga contexto separado aunque el par sea el mismo.
- `dm.threadReplies`: anulación de política de hilos solo para DM (`off`, `inbound`, `always`). Sobrescribe la configuración de nivel superior `threadReplies` tanto para la ubicación de respuestas como para el aislamiento de sesiones en DM.
- `execApprovals`: entrega nativa de aprobaciones de exec de Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID de usuario de Matrix autorizados para aprobar solicitudes de exec. Opcional cuando `dm.allowFrom` ya identifica a los aprobadores.
- `execApprovals.target`: `dm | channel | both` (predeterminado: `dm`).
- `accounts`: anulaciones con nombre por cuenta. Los valores de nivel superior de `channels.matrix` actúan como valores predeterminados para estas entradas.
- `groups`: mapa de políticas por sala. Prefiere ID de sala o alias; los nombres de sala no resueltos se ignoran en tiempo de ejecución. La identidad de sesión/grupo usa el ID de sala estable después de la resolución.
- `groups.<room>.account`: restringe una entrada de sala heredada a una cuenta Matrix específica en configuraciones de varias cuentas.
- `groups.<room>.allowBots`: anulación a nivel de sala para remitentes bot configurados (`true` o `"mentions"`).
- `groups.<room>.users`: lista de permitidos de remitentes por sala.
- `groups.<room>.tools`: anulaciones por sala para permitir/denegar herramientas.
- `groups.<room>.autoReply`: anulación a nivel de sala para el control por mención. `true` desactiva los requisitos de mención para esa sala; `false` los vuelve a forzar.
- `groups.<room>.skills`: filtro opcional de Skills por sala.
- `groups.<room>.systemPrompt`: fragmento opcional de prompt del sistema por sala.
- `rooms`: alias heredado de `groups`.
- `actions`: control por acción de herramientas (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Relacionado

- [Channels Overview](/es/channels) — todos los canales compatibles
- [Pairing](/es/channels/pairing) — autenticación DM y flujo de emparejamiento
- [Groups](/es/channels/groups) — comportamiento de chat de grupo y control por mención
- [Channel Routing](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Security](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
