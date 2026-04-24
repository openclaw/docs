---
read_when:
    - Configurando Matrix en OpenClaw
    - Configurando E2EE y la verificación de Matrix
summary: Estado de compatibilidad, configuración inicial y ejemplos de configuración de Matrix
title: Matrix
x-i18n:
    generated_at: "2026-04-24T05:19:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf25a6f64ed310f33b72517ccd1526876e27caae240e9fa837a86ca2c392ab25
    source_path: channels/matrix.md
    workflow: 15
---

Matrix es un Plugin de canal incluido con OpenClaw.
Usa el `matrix-js-sdk` oficial y es compatible con mensajes directos, salas, hilos, medios, reacciones, encuestas, ubicación y E2EE.

## Plugin incluido

Matrix se distribuye como un Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación aparte.

Si usas una compilación antigua o una instalación personalizada que excluye Matrix, instálalo manualmente:

Instalar desde npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instalar desde una copia local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Consulta [Plugins](/es/tools/plugin) para conocer el comportamiento del Plugin y las reglas de instalación.

## Configuración

1. Asegúrate de que el Plugin de Matrix esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas o personalizadas pueden añadirlo manualmente con los comandos anteriores.
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
- si se debe configurar el acceso a salas y la unión automática por invitación

Comportamientos clave del asistente:

- Si ya existen variables de entorno de autenticación de Matrix y esa cuenta aún no tiene autenticación guardada en la configuración, el asistente ofrece un acceso directo de entorno para mantener la autenticación en variables de entorno.
- Los nombres de cuenta se normalizan al ID de la cuenta. Por ejemplo, `Ops Bot` se convierte en `ops-bot`.
- Las entradas de la lista de permitidos para mensajes directos aceptan `@user:server` directamente; los nombres para mostrar solo funcionan cuando la búsqueda en el directorio activo encuentra una coincidencia exacta.
- Las entradas de la lista de permitidos para salas aceptan directamente IDs y alias de sala. Prefiere `!room:server` o `#alias:server`; los nombres no resueltos se ignoran en tiempo de ejecución durante la resolución de la lista de permitidos.
- En el modo de lista de permitidos para unión automática por invitación, usa solo destinos de invitación estables: `!roomId:server`, `#alias:server` o `*`. Los nombres simples de sala se rechazan.
- Para resolver nombres de sala antes de guardar, usa `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` usa `off` de forma predeterminada.

Si lo dejas sin establecer, el bot no se unirá a salas invitadas ni a invitaciones nuevas de tipo mensaje directo, por lo que no aparecerá en grupos nuevos ni en mensajes directos por invitación a menos que te unas manualmente primero.

Establece `autoJoin: "allowlist"` junto con `autoJoinAllowlist` para restringir qué invitaciones acepta, o establece `autoJoin: "always"` si quieres que se una a todas las invitaciones.

En modo `allowlist`, `autoJoinAllowlist` solo acepta `!roomId:server`, `#alias:server` o `*`.
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
Cuando existen credenciales en caché allí, OpenClaw considera que Matrix está configurado para la detección de setup, doctor y estado de canal, incluso si la autenticación actual no está configurada directamente en la configuración.

Equivalentes en variables de entorno (se usan cuando la clave de configuración no está establecida):

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

Matrix escapa la puntuación en los IDs de cuenta para evitar colisiones en variables de entorno con alcance.
Por ejemplo, `-` se convierte en `_X2D_`, por lo que `ops-prod` se asigna a `MATRIX_OPS_X2D_PROD_*`.

El asistente interactivo solo ofrece el acceso directo de variables de entorno cuando esas variables de autenticación ya están presentes y la cuenta seleccionada aún no tiene autenticación de Matrix guardada en la configuración.

`MATRIX_HOMESERVER` no puede establecerse desde un `.env` del espacio de trabajo; consulta [Archivos `.env` del espacio de trabajo](/es/gateway/security).

## Ejemplo de configuración

Esta es una configuración base práctica con emparejamiento en mensajes directos, lista de permitidos para salas y E2EE habilitado:

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

`autoJoin` se aplica a todas las invitaciones de Matrix, incluidas las invitaciones de tipo mensaje directo. OpenClaw no puede clasificar de forma fiable una sala invitada como mensaje directo o grupo en el momento de la invitación, por lo que todas las invitaciones pasan primero por `autoJoin`. `dm.policy` se aplica después de que el bot se ha unido y la sala se clasifica como mensaje directo.

## Vistas previas de streaming

El streaming de respuestas de Matrix es opcional.

Establece `channels.matrix.streaming` en `"partial"` cuando quieras que OpenClaw envíe una única respuesta de vista previa en vivo, edite esa vista previa en el mismo lugar mientras el modelo genera texto y luego la finalice cuando la respuesta termine:

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
- `streaming: "partial"` crea un mensaje de vista previa editable para el bloque actual del asistente usando mensajes de texto normales de Matrix. Esto conserva el comportamiento heredado de notificación con vista previa primero de Matrix, por lo que los clientes estándar pueden notificar con el primer texto de la vista previa transmitida en lugar del bloque terminado.
- `streaming: "quiet"` crea un aviso de vista previa silencioso editable para el bloque actual del asistente. Úsalo solo cuando también configures reglas push del destinatario para las ediciones de vista previa finalizadas.
- `blockStreaming: true` habilita mensajes de progreso de Matrix separados. Con la vista previa de streaming habilitada, Matrix mantiene el borrador en vivo del bloque actual y conserva los bloques completados como mensajes separados.
- Cuando la vista previa de streaming está activada y `blockStreaming` está desactivado, Matrix edita el borrador en vivo en el mismo lugar y finaliza ese mismo evento cuando termina el bloque o el turno.
- Si la vista previa deja de caber en un solo evento de Matrix, OpenClaw detiene la vista previa de streaming y vuelve a la entrega final normal.
- Las respuestas con medios siguen enviando archivos adjuntos con normalidad. Si una vista previa obsoleta ya no puede reutilizarse de forma segura, OpenClaw la redacta antes de enviar la respuesta final con medios.
- Las ediciones de vista previa cuestan llamadas adicionales a la API de Matrix. Deja el streaming desactivado si quieres el comportamiento más conservador respecto al límite de tasa.

`blockStreaming` no habilita por sí solo las vistas previas de borrador.
Usa `streaming: "partial"` o `streaming: "quiet"` para las ediciones de vista previa; luego añade `blockStreaming: true` solo si también quieres que los bloques completados del asistente sigan visibles como mensajes de progreso separados.

Si necesitas notificaciones estándar de Matrix sin reglas push personalizadas, usa `streaming: "partial"` para el comportamiento de vista previa primero o deja `streaming` desactivado para entrega solo final. Con `streaming: "off"`:

- `blockStreaming: true` envía cada bloque terminado como un mensaje normal de Matrix con notificación.
- `blockStreaming: false` envía solo la respuesta final completada como un mensaje normal de Matrix con notificación.

### Reglas push autoalojadas de Matrix para vistas previas silenciosas finalizadas

El streaming silencioso (`streaming: "quiet"`) solo notifica a los destinatarios una vez que se finaliza un bloque o turno: una regla push por usuario debe coincidir con el marcador de vista previa finalizada. Consulta [Reglas push de Matrix para vistas previas silenciosas](/es/channels/matrix-push-rules) para ver la configuración completa (token del destinatario, comprobación del pusher, instalación de reglas y notas por homeserver).

## Salas de bot a bot

De forma predeterminada, los mensajes de otras cuentas de Matrix de OpenClaw configuradas se ignoran.

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

- `allowBots: true` acepta mensajes de otras cuentas de bot de Matrix configuradas en salas permitidas y mensajes directos.
- `allowBots: "mentions"` acepta esos mensajes solo cuando mencionan visiblemente a este bot en salas. Los mensajes directos siguen permitidos.
- `groups.<room>.allowBots` anula la configuración a nivel de cuenta para una sala.
- OpenClaw sigue ignorando mensajes del mismo ID de usuario de Matrix para evitar bucles de respuesta automática.
- Matrix no expone aquí una marca nativa de bot; OpenClaw trata "escrito por bot" como "enviado por otra cuenta de Matrix configurada en este gateway de OpenClaw".

Usa listas estrictas de salas permitidas y requisitos de mención al habilitar tráfico de bot a bot en salas compartidas.

## Cifrado y verificación

En salas cifradas (E2EE), los eventos salientes de imagen usan `thumbnail_file` para que las vistas previas de imagen se cifren junto con el archivo adjunto completo. Las salas sin cifrar siguen usando `thumbnail_url` simple. No se necesita configuración: el Plugin detecta automáticamente el estado de E2EE.

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

| Command                                                        | Purpose                                                                             |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                                | Comprobar el estado de la verificación de dispositivos y la firma cruzada           |
| `openclaw matrix verify status --include-recovery-key --json`  | Incluir la clave de recuperación almacenada                                         |
| `openclaw matrix verify bootstrap`                             | Inicializar la firma cruzada y la verificación (ver abajo)                          |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | Descartar la identidad actual de firma cruzada y crear una nueva                    |
| `openclaw matrix verify device "<recovery-key>"`               | Verificar este dispositivo con una clave de recuperación                            |
| `openclaw matrix verify backup status`                         | Comprobar el estado de salud de la copia de seguridad de claves de sala             |
| `openclaw matrix verify backup restore`                        | Restaurar claves de sala desde la copia de seguridad del servidor                   |
| `openclaw matrix verify backup reset --yes`                    | Eliminar la copia de seguridad actual y crear una nueva base inicial (puede recrear el almacenamiento de secretos) |

En configuraciones con varias cuentas, los comandos CLI de Matrix usan la cuenta predeterminada implícita de Matrix, a menos que pases `--account <id>`.
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
    OpenClaw trata un dispositivo como verificado solo cuando tu propia identidad de firma cruzada lo firma. `verify status --verbose` expone tres señales de confianza:

    - `Locally trusted`: confiable solo para este cliente
    - `Cross-signing verified`: el SDK informa verificación mediante firma cruzada
    - `Signed by owner`: firmado por tu propia clave de autofirma

    `Verified by owner` pasa a ser `yes` solo cuando hay firma cruzada o firma del propietario. La confianza local por sí sola no es suficiente.

  </Accordion>

  <Accordion title="Qué hace bootstrap">
    `verify bootstrap` es el comando de reparación y configuración para cuentas cifradas. En orden, hace lo siguiente:

    - inicializa el almacenamiento de secretos, reutilizando una clave de recuperación existente cuando es posible
    - inicializa la firma cruzada y sube las claves públicas de firma cruzada que falten
    - marca y firma mediante firma cruzada el dispositivo actual
    - crea una copia de seguridad de claves de sala en el servidor si todavía no existe

    Si el homeserver requiere UIA para subir claves de firma cruzada, OpenClaw primero intenta sin autenticación, luego `m.login.dummy` y después `m.login.password` (requiere `channels.matrix.password`). Usa `--force-reset-cross-signing` solo cuando quieras descartar intencionalmente la identidad actual.

  </Accordion>

  <Accordion title="Nueva base de copia de seguridad">
    Si quieres mantener el funcionamiento de futuros mensajes cifrados y aceptas perder historial antiguo irrecuperable:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Añade `--account <id>` para apuntar a una cuenta con nombre. Esto también puede recrear el almacenamiento de secretos si el secreto actual de la copia de seguridad no puede cargarse de forma segura.

  </Accordion>

  <Accordion title="Comportamiento al inicio">
    Con `encryption: true`, `startupVerification` usa `"if-unverified"` de forma predeterminada. Al iniciar, un dispositivo no verificado solicita autoverificación en otro cliente Matrix, omitiendo duplicados y aplicando un periodo de enfriamiento. Ajústalo con `startupVerificationCooldownHours` o desactívalo con `startupVerification: "off"`.

    El inicio también ejecuta una pasada conservadora de inicialización criptográfica que reutiliza el almacenamiento de secretos actual y la identidad actual de firma cruzada. Si el estado de inicialización está dañado, OpenClaw intenta una reparación protegida incluso sin `channels.matrix.password`; si el homeserver requiere UIA con contraseña, el inicio registra una advertencia y sigue siendo no fatal. Los dispositivos ya firmados por el propietario se conservan.

    Consulta [Migración de Matrix](/es/install/migrating-matrix) para ver el flujo completo de actualización.

  </Accordion>

  <Accordion title="Avisos de verificación">
    Matrix publica avisos del ciclo de vida de la verificación en la sala estricta de verificación por mensaje directo como mensajes `m.notice`: solicitud, listo (con indicaciones de "Verify by emoji"), inicio/finalización y detalles SAS (emoji/decimal) cuando están disponibles.

    Las solicitudes entrantes desde otro cliente Matrix se rastrean y se aceptan automáticamente. Para la autoverificación, OpenClaw inicia el flujo SAS automáticamente y confirma su propio lado una vez que la verificación por emoji está disponible; aun así, debes comparar y confirmar "They match" en tu cliente Matrix.

    Los avisos del sistema de verificación no se reenvían a la canalización de chat del agente.

  </Accordion>

  <Accordion title="Higiene de dispositivos">
    Los dispositivos antiguos gestionados por OpenClaw pueden acumularse. Enuméralos y depúralos:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Almacén criptográfico">
    Matrix E2EE usa la ruta criptográfica Rust oficial de `matrix-js-sdk` con `fake-indexeddb` como shim de IndexedDB. El estado criptográfico persiste en `crypto-idb-snapshot.json` (permisos de archivo restrictivos).

    El estado de ejecución cifrado vive en `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e incluye el almacén de sincronización, el almacén criptográfico, la clave de recuperación, la instantánea de IDB, los enlaces de hilos y el estado de verificación al inicio. Cuando el token cambia pero la identidad de la cuenta sigue siendo la misma, OpenClaw reutiliza la mejor raíz existente para que el estado anterior siga visible.

  </Accordion>
</AccordionGroup>

## Gestión de perfiles

Actualiza el perfil propio de Matrix para la cuenta seleccionada con:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Añade `--account <id>` cuando quieras apuntar explícitamente a una cuenta de Matrix con nombre.

Matrix acepta directamente URL de avatar `mxc://`. Cuando pasas una URL de avatar `http://` o `https://`, OpenClaw la sube primero a Matrix y vuelve a guardar la URL `mxc://` resuelta en `channels.matrix.avatarUrl` (o en la anulación de la cuenta seleccionada).

## Hilos

Matrix es compatible con hilos nativos de Matrix tanto para respuestas automáticas como para envíos mediante herramientas de mensajes.

- `dm.sessionScope: "per-user"` (predeterminado) mantiene el enrutamiento de mensajes directos de Matrix con alcance por remitente, por lo que varias salas de mensajes directos pueden compartir una sesión cuando se resuelven al mismo interlocutor.
- `dm.sessionScope: "per-room"` aísla cada sala de mensajes directos de Matrix en su propia clave de sesión mientras sigue usando la autenticación normal de mensajes directos y las comprobaciones de lista de permitidos.
- Los enlaces explícitos de conversaciones de Matrix siguen teniendo prioridad sobre `dm.sessionScope`, por lo que las salas e hilos enlazados conservan su sesión de destino elegida.
- `threadReplies: "off"` mantiene las respuestas en el nivel superior y conserva los mensajes entrantes en hilos en la sesión principal.
- `threadReplies: "inbound"` responde dentro de un hilo solo cuando el mensaje entrante ya estaba en ese hilo.
- `threadReplies: "always"` mantiene las respuestas de sala en un hilo con raíz en el mensaje que activó la acción y enruta esa conversación mediante la sesión con alcance de hilo correspondiente desde el primer mensaje activador.
- `dm.threadReplies` anula la configuración de nivel superior solo para mensajes directos. Por ejemplo, puedes mantener aislados los hilos de sala mientras mantienes planos los mensajes directos.
- Los mensajes entrantes en hilos incluyen el mensaje raíz del hilo como contexto adicional para el agente.
- Los envíos mediante herramientas de mensajes heredan automáticamente el hilo actual de Matrix cuando el destino es la misma sala, o el mismo usuario objetivo en mensaje directo, a menos que se proporcione un `threadId` explícito.
- La reutilización de objetivo de usuario de mensaje directo en la misma sesión solo se activa cuando los metadatos de la sesión actual demuestran el mismo interlocutor de mensaje directo en la misma cuenta de Matrix; en caso contrario, OpenClaw vuelve al enrutamiento normal con alcance por usuario.
- Cuando OpenClaw detecta que una sala de mensajes directos de Matrix entra en conflicto con otra sala de mensajes directos en la misma sesión compartida de mensajes directos de Matrix, publica un `m.notice` único en esa sala con la vía de escape `/focus` cuando los enlaces de hilos están habilitados y con la pista `dm.sessionScope`.
- Se admiten enlaces de hilos en tiempo de ejecución para Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y `/acp spawn` enlazado a hilo funcionan en salas y mensajes directos de Matrix.
- `/focus` de nivel superior en sala o mensaje directo de Matrix crea un nuevo hilo de Matrix y lo enlaza a la sesión de destino cuando `threadBindings.spawnSubagentSessions=true`.
- Ejecutar `/focus` o `/acp spawn --thread here` dentro de un hilo Matrix existente enlaza ese hilo actual en su lugar.

## Enlaces de conversación ACP

Las salas, los mensajes directos y los hilos Matrix existentes pueden convertirse en espacios de trabajo ACP duraderos sin cambiar la superficie del chat.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del mensaje directo, sala o hilo existente de Matrix que quieras seguir usando.
- En un mensaje directo o sala de Matrix de nivel superior, el mensaje directo o sala actual sigue siendo la superficie del chat y los mensajes futuros se enrutan a la sesión ACP generada.
- Dentro de un hilo Matrix existente, `--bind here` enlaza ese hilo actual en su lugar.
- `/new` y `/reset` restablecen en su lugar la misma sesión ACP enlazada.
- `/acp close` cierra la sesión ACP y elimina el enlace.

Notas:

- `--bind here` no crea un hilo Matrix secundario.
- `threadBindings.spawnAcpSessions` solo es necesario para `/acp spawn --thread auto|here`, donde OpenClaw necesita crear o enlazar un hilo Matrix secundario.

### Configuración de enlaces de hilos

Matrix hereda los valores predeterminados globales de `session.threadBindings`, y también admite anulaciones por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Las marcas de generación enlazada a hilos de Matrix son opcionales:

- Establece `threadBindings.spawnSubagentSessions: true` para permitir que `/focus` de nivel superior cree y enlace nuevos hilos Matrix.
- Establece `threadBindings.spawnAcpSessions: true` para permitir que `/acp spawn --thread auto|here` enlace sesiones ACP a hilos Matrix.

## Reacciones

Matrix es compatible con acciones de reacción salientes, notificaciones de reacciones entrantes y reacciones de confirmación entrantes.

- Las herramientas de reacciones salientes están controladas por `channels["matrix"].actions.reactions`.
- `react` añade una reacción a un evento Matrix específico.
- `reactions` enumera el resumen actual de reacciones para un evento Matrix específico.
- `emoji=""` elimina las reacciones propias de la cuenta del bot en ese evento.
- `remove: true` elimina solo la reacción de emoji especificada de la cuenta del bot.

El alcance de reacción de confirmación se resuelve en este orden:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- alternativa de emoji de identidad del agente

El alcance de la reacción de confirmación se resuelve en este orden:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

El modo de notificación de reacciones se resuelve en este orden:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- predeterminado: `own`

Comportamiento:

- `reactionNotifications: "own"` reenvía eventos `m.reaction` añadidos cuando apuntan a mensajes Matrix escritos por el bot.
- `reactionNotifications: "off"` desactiva los eventos del sistema de reacciones.
- Las eliminaciones de reacciones no se sintetizan en eventos del sistema porque Matrix las expone como redacciones, no como eliminaciones independientes de `m.reaction`.

## Contexto del historial

- `channels.matrix.historyLimit` controla cuántos mensajes recientes de la sala se incluyen como `InboundHistory` cuando un mensaje de una sala de Matrix activa al agente. Recurre a `messages.groupChat.historyLimit`; si ambos no están establecidos, el valor predeterminado efectivo es `0`. Establece `0` para desactivarlo.
- El historial de salas de Matrix es solo de sala. Los mensajes directos siguen usando el historial de sesión normal.
- El historial de salas de Matrix es solo pendiente: OpenClaw almacena en búfer los mensajes de la sala que aún no han activado una respuesta y luego toma una instantánea de esa ventana cuando llega una mención u otro activador.
- El mensaje activador actual no se incluye en `InboundHistory`; permanece en el cuerpo principal entrante para ese turno.
- Los reintentos del mismo evento de Matrix reutilizan la instantánea de historial original en lugar de desplazarse hacia mensajes más recientes de la sala.

## Visibilidad del contexto

Matrix admite el control compartido `contextVisibility` para contexto adicional de sala, como texto de respuesta recuperado, raíces de hilos e historial pendiente.

- `contextVisibility: "all"` es el valor predeterminado. El contexto adicional se conserva tal como se recibe.
- `contextVisibility: "allowlist"` filtra el contexto adicional a remitentes permitidos por las comprobaciones activas de listas de permitidos de sala/usuario.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, pero aun así conserva una respuesta citada explícita.

Esta configuración afecta a la visibilidad del contexto adicional, no a si el propio mensaje entrante puede activar una respuesta.
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

Consulta [Grupos](/es/channels/groups) para el comportamiento de control por menciones y listas de permitidos.

Ejemplo de emparejamiento para mensajes directos de Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un usuario de Matrix no aprobado sigue enviándote mensajes antes de la aprobación, OpenClaw reutiliza el mismo código de emparejamiento pendiente y puede volver a enviar una respuesta de recordatorio tras un breve periodo de enfriamiento en lugar de generar un código nuevo.

Consulta [Emparejamiento](/es/channels/pairing) para ver el flujo compartido de emparejamiento de mensajes directos y el diseño de almacenamiento.

## Reparación directa de salas

Si el estado de mensajes directos deja de estar sincronizado, OpenClaw puede acabar con asignaciones `m.direct` obsoletas que apuntan a salas individuales antiguas en lugar del mensaje directo activo. Inspecciona la asignación actual para un interlocutor con:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repáralo con:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

El flujo de reparación:

- prefiere un mensaje directo estricto 1:1 que ya esté asignado en `m.direct`
- recurre a cualquier mensaje directo estricto 1:1 actualmente unido con ese usuario
- crea una sala directa nueva y reescribe `m.direct` si no existe ningún mensaje directo en buen estado

El flujo de reparación no elimina automáticamente las salas antiguas. Solo elige el mensaje directo en buen estado y actualiza la asignación para que los nuevos envíos de Matrix, avisos de verificación y otros flujos de mensajes directos vuelvan a apuntar a la sala correcta.

## Aprobaciones de ejecución

Matrix puede actuar como cliente de aprobación nativo para una cuenta de Matrix. Los controles nativos de enrutamiento de mensajes directos/canales siguen estando en la configuración de aprobación de ejecución:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcional; recurre a `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Los aprobadores deben ser IDs de usuario de Matrix como `@owner:example.org`. Matrix habilita automáticamente las aprobaciones nativas cuando `enabled` no está establecido o es `"auto"` y al menos puede resolverse un aprobador. Las aprobaciones de ejecución usan primero `execApprovals.approvers` y pueden recurrir a `channels.matrix.dm.allowFrom`. Las aprobaciones de Plugin autorizan mediante `channels.matrix.dm.allowFrom`. Establece `enabled: false` para deshabilitar explícitamente Matrix como cliente de aprobación nativo. En caso contrario, las solicitudes de aprobación recurren a otras rutas de aprobación configuradas o a la política de reserva de aprobación.

El enrutamiento nativo de Matrix admite ambos tipos de aprobación:

- `channels.matrix.execApprovals.*` controla el modo nativo de distribución DM/canal para las solicitudes de aprobación de Matrix.
- Las aprobaciones de ejecución usan el conjunto de aprobadores de ejecución de `execApprovals.approvers` o `channels.matrix.dm.allowFrom`.
- Las aprobaciones de Plugin usan la lista de permitidos DM de Matrix de `channels.matrix.dm.allowFrom`.
- Los accesos directos de reacción de Matrix y las actualizaciones de mensajes se aplican tanto a aprobaciones de ejecución como a aprobaciones de Plugin.

Reglas de entrega:

- `target: "dm"` envía las solicitudes de aprobación a los mensajes directos de los aprobadores
- `target: "channel"` envía la solicitud de vuelta a la sala o mensaje directo de Matrix de origen
- `target: "both"` envía a los mensajes directos de los aprobadores y a la sala o mensaje directo de Matrix de origen

Las solicitudes de aprobación de Matrix inicializan accesos directos de reacción en el mensaje principal de aprobación:

- `✅` = permitir una vez
- `❌` = denegar
- `♾️` = permitir siempre cuando esa decisión esté permitida por la política de ejecución efectiva

Los aprobadores pueden reaccionar en ese mensaje o usar los comandos slash de respaldo: `/approve <id> allow-once`, `/approve <id> allow-always` o `/approve <id> deny`.

Solo los aprobadores resueltos pueden aprobar o denegar. Para las aprobaciones de ejecución, la entrega por canal incluye el texto del comando, así que habilita `channel` o `both` solo en salas de confianza.

Anulación por cuenta:

- `channels.matrix.accounts.<account>.execApprovals`

Documentación relacionada: [Aprobaciones de ejecución](/es/tools/exec-approvals)

## Comandos slash

Los comandos slash de Matrix (por ejemplo `/new`, `/reset`, `/model`) funcionan directamente en mensajes directos. En salas, OpenClaw también reconoce comandos slash con el prefijo de la propia mención Matrix del bot, de modo que `@bot:server /new` activa la ruta de comandos sin necesidad de una expresión regular de mención personalizada. Esto mantiene al bot sensible a publicaciones de sala del tipo `@mention /command` que emiten Element y clientes similares cuando un usuario completa con tabulación el bot antes de escribir el comando.

Las reglas de autorización siguen aplicándose: los remitentes de comandos deben cumplir las políticas de listas de permitidos o propietario para mensajes directos o salas, igual que los mensajes normales.

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

Los valores de nivel superior de `channels.matrix` actúan como valores predeterminados para cuentas con nombre, a menos que una cuenta los anule.
Puedes delimitar entradas de sala heredadas a una cuenta de Matrix con `groups.<room>.account`.
Las entradas sin `account` siguen compartidas entre todas las cuentas de Matrix, y las entradas con `account: "default"` siguen funcionando cuando la cuenta predeterminada se configura directamente en `channels.matrix.*` de nivel superior.
Los valores predeterminados parciales de autenticación compartida no crean por sí solos una cuenta predeterminada implícita independiente. OpenClaw solo sintetiza la cuenta `default` de nivel superior cuando esa cuenta predeterminada tiene autenticación reciente (`homeserver` más `accessToken`, o `homeserver` más `userId` y `password`); las cuentas con nombre pueden seguir siendo detectables desde `homeserver` más `userId` cuando las credenciales en caché satisfacen la autenticación más tarde.
Si Matrix ya tiene exactamente una cuenta con nombre, o `defaultAccount` apunta a una clave de cuenta con nombre existente, la promoción de reparación/configuración de cuenta única a varias cuentas conserva esa cuenta en lugar de crear una entrada nueva `accounts.default`. Solo las claves de autenticación/inicialización de Matrix se trasladan a esa cuenta promovida; las claves compartidas de política de entrega permanecen en el nivel superior.
Establece `defaultAccount` cuando quieras que OpenClaw prefiera una cuenta de Matrix con nombre para enrutamiento implícito, sondeo y operaciones CLI.
Si se configuran varias cuentas de Matrix y un ID de cuenta es `default`, OpenClaw usa esa cuenta implícitamente incluso cuando `defaultAccount` no está establecido.
Si configuras varias cuentas con nombre, establece `defaultAccount` o pasa `--account <id>` para comandos CLI que dependen de la selección implícita de cuenta.
Pasa `--account <id>` a `openclaw matrix verify ...` y `openclaw matrix devices ...` cuando quieras anular esa selección implícita para un comando.

Consulta [Referencia de configuración](/es/gateway/config-channels#multi-account-all-channels) para el patrón compartido de varias cuentas.

## Homeservers privados/LAN

De forma predeterminada, OpenClaw bloquea homeservers Matrix privados/internos como protección SSRF, a menos que
optes explícitamente por permitirlos por cuenta.

Si tu homeserver se ejecuta en localhost, una IP LAN/Tailscale o un nombre de host interno, habilita
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

Ejemplo de configuración por CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Esta aceptación explícita solo permite destinos privados/internos de confianza. Los homeservers públicos en texto claro como
`http://matrix.example.org:8008` siguen bloqueados. Prefiere `https://` siempre que sea posible.

## Proxy del tráfico de Matrix

Si tu implementación de Matrix necesita un proxy HTTP(S) saliente explícito, establece `channels.matrix.proxy`:

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

Las cuentas con nombre pueden anular el valor predeterminado de nivel superior con `channels.matrix.accounts.<id>.proxy`.
OpenClaw usa la misma configuración de proxy para el tráfico de Matrix en tiempo de ejecución y para los sondeos de estado de cuenta.

## Resolución de destino

Matrix acepta estas formas de destino en cualquier lugar donde OpenClaw te pida un destino de sala o usuario:

- Usuarios: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

La búsqueda en directorio en vivo usa la cuenta de Matrix que ha iniciado sesión:

- Las búsquedas de usuarios consultan el directorio de usuarios de Matrix en ese homeserver.
- Las búsquedas de salas aceptan directamente IDs y alias de sala explícitos, y luego recurren a buscar nombres de salas unidas para esa cuenta.
- La búsqueda de nombres de salas unidas es de mejor esfuerzo. Si un nombre de sala no puede resolverse a un ID o alias, se ignora en la resolución de listas de permitidos en tiempo de ejecución.

## Referencia de configuración

- `enabled`: habilita o deshabilita el canal.
- `name`: etiqueta opcional para la cuenta.
- `defaultAccount`: ID de cuenta preferido cuando se configuran varias cuentas de Matrix.
- `homeserver`: URL del homeserver, por ejemplo `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta cuenta de Matrix se conecte a homeservers privados/internos. Habilítalo cuando el homeserver se resuelva a `localhost`, una IP LAN/Tailscale o un host interno como `matrix-synapse`.
- `proxy`: URL opcional de proxy HTTP(S) para el tráfico de Matrix. Las cuentas con nombre pueden anular el valor predeterminado de nivel superior con su propio `proxy`.
- `userId`: ID de usuario completo de Matrix, por ejemplo `@bot:example.org`.
- `accessToken`: token de acceso para autenticación basada en token. Se admiten valores en texto plano y valores SecretRef para `channels.matrix.accessToken` y `channels.matrix.accounts.<id>.accessToken` en proveedores env/file/exec. Consulta [Gestión de secretos](/es/gateway/secrets).
- `password`: contraseña para inicio de sesión basado en contraseña. Se admiten valores en texto plano y valores SecretRef.
- `deviceId`: ID explícito de dispositivo Matrix.
- `deviceName`: nombre para mostrar del dispositivo para inicio de sesión con contraseña.
- `avatarUrl`: URL almacenada del avatar propio para sincronización de perfil y actualizaciones de `profile set`.
- `initialSyncLimit`: número máximo de eventos obtenidos durante la sincronización de inicio.
- `encryption`: habilita E2EE.
- `allowlistOnly`: cuando es `true`, eleva la política de sala `open` a `allowlist`, y fuerza todas las políticas activas de mensajes directos excepto `disabled` (incluidas `pairing` y `open`) a `allowlist`. No afecta a las políticas `disabled`.
- `allowBots`: permite mensajes de otras cuentas de Matrix de OpenClaw configuradas (`true` o `"mentions"`).
- `groupPolicy`: `open`, `allowlist` o `disabled`.
- `contextVisibility`: modo de visibilidad de contexto adicional de sala (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: lista de permitidos de IDs de usuario para tráfico de sala. Los IDs completos de usuario de Matrix son los más seguros; las coincidencias exactas en el directorio se resuelven al inicio y cuando cambia la lista de permitidos mientras el monitor está en ejecución. Los nombres no resueltos se ignoran.
- `historyLimit`: número máximo de mensajes de sala que se incluirán como contexto de historial de grupo. Recurre a `messages.groupChat.historyLimit`; si ambos no están establecidos, el valor predeterminado efectivo es `0`. Establece `0` para desactivarlo.
- `replyToMode`: `off`, `first`, `all` o `batched`.
- `markdown`: configuración opcional de renderizado Markdown para texto saliente de Matrix.
- `streaming`: `off` (predeterminado), `"partial"`, `"quiet"`, `true` o `false`. `"partial"` y `true` habilitan actualizaciones de borrador con vista previa primero usando mensajes de texto normales de Matrix. `"quiet"` usa avisos de vista previa sin notificación para configuraciones autoalojadas con reglas push. `false` equivale a `"off"`.
- `blockStreaming`: `true` habilita mensajes de progreso separados para bloques completados del asistente mientras la transmisión de vista previa de borrador está activa.
- `threadReplies`: `off`, `inbound` o `always`.
- `threadBindings`: anulaciones por canal para enrutamiento y ciclo de vida de sesiones enlazadas a hilos.
- `startupVerification`: modo automático de solicitud de autoverificación al inicio (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: tiempo de espera antes de reintentar solicitudes automáticas de verificación al inicio.
- `textChunkLimit`: tamaño de fragmento de mensaje saliente en caracteres (se aplica cuando `chunkMode` es `length`).
- `chunkMode`: `length` divide mensajes por cantidad de caracteres; `newline` divide en límites de línea.
- `responsePrefix`: cadena opcional que se antepone a todas las respuestas salientes para este canal.
- `ackReaction`: anulación opcional de reacción de confirmación para este canal/cuenta.
- `ackReactionScope`: anulación opcional del alcance de la reacción de confirmación (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modo de notificación de reacciones entrantes (`own`, `off`).
- `mediaMaxMb`: límite de tamaño de medios en MB para envíos salientes y procesamiento de medios entrantes.
- `autoJoin`: política de unión automática por invitación (`always`, `allowlist`, `off`). Predeterminado: `off`. Se aplica a todas las invitaciones de Matrix, incluidas las invitaciones de tipo mensaje directo.
- `autoJoinAllowlist`: salas/alias permitidos cuando `autoJoin` es `allowlist`. Las entradas de alias se resuelven a IDs de sala durante la gestión de invitaciones; OpenClaw no confía en el estado del alias declarado por la sala invitada.
- `dm`: bloque de política de mensajes directos (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: controla el acceso a mensajes directos después de que OpenClaw se haya unido a la sala y la haya clasificado como mensaje directo. No cambia si una invitación se une automáticamente.
- `dm.allowFrom`: lista de permitidos de IDs de usuario para tráfico de mensajes directos. Los IDs completos de usuario de Matrix son los más seguros; las coincidencias exactas en el directorio se resuelven al inicio y cuando cambia la lista de permitidos mientras el monitor está en ejecución. Los nombres no resueltos se ignoran.
- `dm.sessionScope`: `per-user` (predeterminado) o `per-room`. Usa `per-room` cuando quieras que cada sala de mensajes directos de Matrix mantenga un contexto separado incluso si el interlocutor es el mismo.
- `dm.threadReplies`: anulación de política de hilos solo para mensajes directos (`off`, `inbound`, `always`). Anula la configuración de nivel superior `threadReplies` tanto para la ubicación de respuestas como para el aislamiento de sesión en mensajes directos.
- `execApprovals`: entrega nativa en Matrix de aprobaciones de ejecución (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: IDs de usuario de Matrix autorizados para aprobar solicitudes de ejecución. Opcional cuando `dm.allowFrom` ya identifica a los aprobadores.
- `execApprovals.target`: `dm | channel | both` (predeterminado: `dm`).
- `accounts`: anulaciones con nombre por cuenta. Los valores de nivel superior de `channels.matrix` actúan como valores predeterminados para estas entradas.
- `groups`: mapa de políticas por sala. Prefiere IDs o alias de sala; los nombres de sala no resueltos se ignoran en tiempo de ejecución. La identidad de sesión/grupo usa el ID estable de la sala después de la resolución.
- `groups.<room>.account`: restringe una entrada de sala heredada a una cuenta específica de Matrix en configuraciones de varias cuentas.
- `groups.<room>.allowBots`: anulación a nivel de sala para remitentes bot configurados (`true` o `"mentions"`).
- `groups.<room>.users`: lista de permitidos de remitentes por sala.
- `groups.<room>.tools`: anulaciones por sala para permitir/denegar herramientas.
- `groups.<room>.autoReply`: anulación a nivel de sala para el control por menciones. `true` deshabilita los requisitos de mención para esa sala; `false` vuelve a activarlos.
- `groups.<room>.skills`: filtro opcional de Skills por sala.
- `groups.<room>.systemPrompt`: fragmento opcional de system prompt por sala.
- `rooms`: alias heredado de `groups`.
- `actions`: control por acción de herramientas (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
