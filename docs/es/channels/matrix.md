---
read_when:
    - Configurar Matrix en OpenClaw
    - Configurar el cifrado de extremo a extremo y la verificación de Matrix
summary: Estado del soporte de Matrix, configuración inicial y ejemplos de configuración
title: Matrix
x-i18n:
    generated_at: "2026-04-23T14:56:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e9d4d656b47aca2dacb00e591378cb26631afc5b634074bc26e21741b418b47
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix es un plugin de canal incluido con OpenClaw.
Usa el `matrix-js-sdk` oficial y admite MD, salas, hilos, contenido multimedia, reacciones, encuestas, ubicación y cifrado de extremo a extremo.

## Plugin incluido

Matrix se incluye como plugin integrado en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación independiente.

Si estás usando una compilación anterior o una instalación personalizada que excluye Matrix, instálalo manualmente:

Instalar desde npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instalar desde una copia local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Consulta [Plugins](/es/tools/plugin) para conocer el comportamiento de los plugins y las reglas de instalación.

## Configuración inicial

1. Asegúrate de que el plugin de Matrix esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas o personalizadas pueden añadirlo manualmente con los comandos anteriores.
2. Crea una cuenta de Matrix en tu homeserver.
3. Configura `channels.matrix` con una de estas opciones:
   - `homeserver` + `accessToken`, o
   - `homeserver` + `userId` + `password`.
4. Reinicia el Gateway.
5. Inicia un MD con el bot o invítalo a una sala.
   - Las invitaciones nuevas de Matrix solo funcionan cuando `channels.matrix.autoJoin` las permite.

Rutas de configuración interactiva:

```bash
openclaw channels add
openclaw configure --section channels
```

El asistente de Matrix solicita:

- URL del homeserver
- método de autenticación: token de acceso o contraseña
- ID de usuario (solo autenticación con contraseña)
- nombre opcional del dispositivo
- si se debe habilitar el cifrado de extremo a extremo
- si se debe configurar el acceso a salas y la unión automática por invitación

Comportamientos clave del asistente:

- Si las variables de entorno de autenticación de Matrix ya existen y esa cuenta aún no tiene la autenticación guardada en la configuración, el asistente ofrece un atajo con variables de entorno para mantener la autenticación en ellas.
- Los nombres de cuenta se normalizan al ID de la cuenta. Por ejemplo, `Ops Bot` se convierte en `ops-bot`.
- Las entradas de lista de permitidos para MD aceptan `@user:server` directamente; los nombres para mostrar solo funcionan cuando la búsqueda en el directorio en vivo encuentra una coincidencia exacta.
- Las entradas de lista de permitidos para salas aceptan directamente los ID y alias de sala. Prefiere `!room:server` o `#alias:server`; los nombres no resueltos se ignoran en tiempo de ejecución durante la resolución de la lista de permitidos.
- En el modo de lista de permitidos para unión automática por invitación, usa solo destinos de invitación estables: `!roomId:server`, `#alias:server` o `*`. Los nombres de sala simples se rechazan.
- Para resolver nombres de sala antes de guardar, usa `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` tiene como valor predeterminado `off`.

Si lo dejas sin establecer, el bot no se unirá a salas invitadas ni a invitaciones nuevas de estilo MD, por lo que no aparecerá en grupos nuevos ni en MD invitados, a menos que te unas manualmente primero.

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
Cuando existen credenciales en caché allí, OpenClaw trata Matrix como configurado para la configuración inicial, doctor y el descubrimiento de estado del canal, incluso si la autenticación actual no está establecida directamente en la configuración.

Equivalentes en variables de entorno (se usan cuando la clave de configuración no está establecida):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Para cuentas no predeterminadas, usa variables de entorno con ámbito de cuenta:

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

Matrix escapa la puntuación en los ID de cuenta para evitar colisiones en las variables de entorno con ámbito.
Por ejemplo, `-` se convierte en `_X2D_`, así que `ops-prod` se asigna a `MATRIX_OPS_X2D_PROD_*`.

El asistente interactivo solo ofrece el atajo de variables de entorno cuando esas variables de autenticación ya están presentes y la cuenta seleccionada aún no tiene autenticación de Matrix guardada en la configuración.

`MATRIX_HOMESERVER` no puede establecerse desde un `.env` del espacio de trabajo; consulta [archivos `.env` del espacio de trabajo](/es/gateway/security).

## Ejemplo de configuración

Esta es una configuración base práctica con emparejamiento de MD, lista de permitidos de salas y cifrado de extremo a extremo habilitado:

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

`autoJoin` se aplica a todas las invitaciones de Matrix, incluidas las invitaciones de estilo MD. OpenClaw no puede clasificar de forma fiable una sala invitada como MD o grupo en el momento de la invitación, por lo que todas las invitaciones pasan primero por `autoJoin`. `dm.policy` se aplica después de que el bot se haya unido y la sala se haya clasificado como un MD.

## Vistas previas de streaming

El streaming de respuestas de Matrix es de participación voluntaria.

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
- `streaming: "partial"` crea un mensaje de vista previa editable para el bloque actual del asistente usando mensajes de texto normales de Matrix. Esto preserva el comportamiento heredado de Matrix de notificar primero la vista previa, por lo que los clientes estándar pueden notificar con el primer texto transmitido de la vista previa en lugar del bloque terminado.
- `streaming: "quiet"` crea un aviso de vista previa silencioso y editable para el bloque actual del asistente. Úsalo solo cuando también configures reglas push del destinatario para ediciones finalizadas de vistas previas.
- `blockStreaming: true` habilita mensajes de progreso independientes de Matrix. Con el streaming de vista previa habilitado, Matrix mantiene el borrador en vivo del bloque actual y conserva los bloques completados como mensajes independientes.
- Cuando el streaming de vista previa está activado y `blockStreaming` está desactivado, Matrix edita el borrador en vivo en el mismo lugar y finaliza ese mismo evento cuando termina el bloque o el turno.
- Si la vista previa ya no cabe en un único evento de Matrix, OpenClaw detiene el streaming de vista previa y vuelve a la entrega final normal.
- Las respuestas multimedia siguen enviando los adjuntos de forma normal. Si una vista previa obsoleta ya no puede reutilizarse de forma segura, OpenClaw la elimina antes de enviar la respuesta multimedia final.
- Las ediciones de vista previa generan llamadas adicionales a la API de Matrix. Deja el streaming desactivado si quieres el comportamiento más conservador con los límites de tasa.

`blockStreaming` no habilita por sí solo las vistas previas de borrador.
Usa `streaming: "partial"` o `streaming: "quiet"` para las ediciones de vista previa; después añade `blockStreaming: true` solo si también quieres que los bloques completados del asistente permanezcan visibles como mensajes de progreso independientes.

Si necesitas notificaciones estándar de Matrix sin reglas push personalizadas, usa `streaming: "partial"` para el comportamiento de vista previa primero o deja `streaming` desactivado para entrega solo final. Con `streaming: "off"`:

- `blockStreaming: true` envía cada bloque terminado como un mensaje normal de Matrix con notificación.
- `blockStreaming: false` envía solo la respuesta final completada como un mensaje normal de Matrix con notificación.

### Reglas push autoalojadas para vistas previas silenciosas finalizadas

El streaming silencioso (`streaming: "quiet"`) solo notifica a los destinatarios una vez que se finaliza un bloque o turno: una regla push por usuario debe coincidir con el marcador de vista previa finalizada. Consulta [Reglas push de Matrix para vistas previas silenciosas](/es/channels/matrix-push-rules) para ver la configuración completa (token del destinatario, comprobación del pusher, instalación de reglas y notas por homeserver).

## Salas de bot a bot

De forma predeterminada, los mensajes de Matrix de otras cuentas configuradas de OpenClaw Matrix se ignoran.

Usa `allowBots` cuando quieras intencionadamente tráfico de Matrix entre agentes:

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

- `allowBots: true` acepta mensajes de otras cuentas de bot de Matrix configuradas en salas permitidas y MD.
- `allowBots: "mentions"` acepta esos mensajes solo cuando mencionan visiblemente a este bot en salas. Los MD siguen estando permitidos.
- `groups.<room>.allowBots` sustituye la configuración a nivel de cuenta para una sala.
- OpenClaw sigue ignorando los mensajes del mismo ID de usuario de Matrix para evitar bucles de autorrespuesta.
- Matrix no expone aquí un indicador nativo de bot; OpenClaw trata “autoría de bot” como “enviado por otra cuenta de Matrix configurada en este Gateway de OpenClaw”.

Usa listas de permitidos estrictas para salas y requisitos de mención al habilitar tráfico bot a bot en salas compartidas.

## Cifrado y verificación

En salas cifradas (E2EE), los eventos salientes de imagen usan `thumbnail_file` para que las vistas previas de imagen se cifren junto con el adjunto completo. Las salas sin cifrar siguen usando `thumbnail_url` sin cifrar. No se necesita ninguna configuración: el plugin detecta automáticamente el estado de E2EE.

Habilitar el cifrado:

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

| Comando                                                        | Propósito                                                                           |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                                | Comprobar el estado de la firma cruzada y la verificación del dispositivo           |
| `openclaw matrix verify status --include-recovery-key --json`  | Incluir la clave de recuperación almacenada                                         |
| `openclaw matrix verify bootstrap`                             | Inicializar la firma cruzada y la verificación (ver más abajo)                      |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | Descartar la identidad actual de firma cruzada y crear una nueva                    |
| `openclaw matrix verify device "<recovery-key>"`               | Verificar este dispositivo con una clave de recuperación                            |
| `openclaw matrix verify backup status`                         | Comprobar el estado del respaldo de claves de sala                                  |
| `openclaw matrix verify backup restore`                        | Restaurar claves de sala desde el respaldo del servidor                             |
| `openclaw matrix verify backup reset --yes`                    | Eliminar el respaldo actual y crear una base nueva (puede recrear el almacenamiento de secretos) |

En configuraciones de varias cuentas, los comandos CLI de Matrix usan la cuenta predeterminada implícita de Matrix a menos que pases `--account <id>`.
Si configuras varias cuentas con nombre, primero establece `channels.matrix.defaultAccount` o esas operaciones implícitas de CLI se detendrán y te pedirán que elijas una cuenta explícitamente.
Usa `--account` siempre que quieras que las operaciones de verificación o dispositivo apunten explícitamente a una cuenta con nombre:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Cuando el cifrado está desactivado o no está disponible para una cuenta con nombre, las advertencias de Matrix y los errores de verificación apuntan a la clave de configuración de esa cuenta, por ejemplo `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Qué significa verificado">
    OpenClaw trata un dispositivo como verificado solo cuando tu propia identidad de firma cruzada lo firma. `verify status --verbose` muestra tres señales de confianza:

    - `Locally trusted`: confiable solo para este cliente
    - `Cross-signing verified`: el SDK informa verificación mediante firma cruzada
    - `Signed by owner`: firmado por tu propia clave de autofirma

    `Verified by owner` pasa a ser `yes` solo cuando hay firma cruzada o firma del propietario. La confianza local por sí sola no es suficiente.

  </Accordion>

  <Accordion title="Qué hace bootstrap">
    `verify bootstrap` es el comando de reparación y configuración para cuentas cifradas. En orden, hace lo siguiente:

    - inicializa el almacenamiento de secretos, reutilizando una clave de recuperación existente cuando sea posible
    - inicializa la firma cruzada y sube las claves públicas de firma cruzada que falten
    - marca y firma de forma cruzada el dispositivo actual
    - crea un respaldo de claves de sala en el servidor si aún no existe

    Si el homeserver requiere UIA para subir claves de firma cruzada, OpenClaw intenta primero sin autenticación, luego `m.login.dummy` y después `m.login.password` (requiere `channels.matrix.password`). Usa `--force-reset-cross-signing` solo cuando quieras descartar intencionadamente la identidad actual.

  </Accordion>

  <Accordion title="Base nueva de respaldo">
    Si quieres que los futuros mensajes cifrados sigan funcionando y aceptas perder historial antiguo irrecuperable:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Añade `--account <id>` para apuntar a una cuenta con nombre. Esto también puede recrear el almacenamiento de secretos si el secreto de respaldo actual no puede cargarse de forma segura.

  </Accordion>

  <Accordion title="Comportamiento al inicio">
    Con `encryption: true`, `startupVerification` tiene como valor predeterminado `"if-unverified"`. Al iniciar, un dispositivo no verificado solicita autoverificación en otro cliente Matrix, omitiendo duplicados y aplicando un tiempo de espera. Ajústalo con `startupVerificationCooldownHours` o desactívalo con `startupVerification: "off"`.

    El inicio también ejecuta una pasada conservadora de inicialización criptográfica que reutiliza el almacenamiento de secretos actual y la identidad actual de firma cruzada. Si el estado de inicialización está dañado, OpenClaw intenta una reparación protegida incluso sin `channels.matrix.password`; si el homeserver requiere UIA con contraseña, el inicio registra una advertencia y sigue sin ser fatal. Los dispositivos ya firmados por el propietario se conservan.

    Consulta [Migración de Matrix](/es/install/migrating-matrix) para ver el flujo completo de actualización.

  </Accordion>

  <Accordion title="Avisos de verificación">
    Matrix publica avisos del ciclo de vida de la verificación en la sala estricta de verificación por MD como mensajes `m.notice`: solicitud, listo (con indicaciones de "Verificar por emoji"), inicio/finalización y detalles SAS (emoji/decimal) cuando están disponibles.

    Las solicitudes entrantes desde otro cliente Matrix se rastrean y se aceptan automáticamente. Para la autoverificación, OpenClaw inicia el flujo SAS automáticamente y confirma su propio lado una vez que la verificación por emoji está disponible; aun así, debes comparar y confirmar "They match" en tu cliente Matrix.

    Los avisos del sistema de verificación no se reenvían al flujo de chat del agente.

  </Accordion>

  <Accordion title="Higiene de dispositivos">
    Los dispositivos antiguos gestionados por OpenClaw pueden acumularse. Listar y depurar:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Almacén criptográfico">
    El cifrado E2EE de Matrix usa la ruta criptográfica Rust oficial de `matrix-js-sdk` con `fake-indexeddb` como adaptación de IndexedDB. El estado criptográfico persiste en `crypto-idb-snapshot.json` (permisos de archivo restrictivos).

    El estado cifrado en tiempo de ejecución vive en `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e incluye el almacén de sincronización, el almacén criptográfico, la clave de recuperación, la instantánea de IDB, las vinculaciones de hilos y el estado de verificación al inicio. Cuando el token cambia pero la identidad de la cuenta sigue siendo la misma, OpenClaw reutiliza la mejor raíz existente para que el estado anterior siga siendo visible.

  </Accordion>
</AccordionGroup>

## Gestión del perfil

Actualiza el perfil propio de Matrix para la cuenta seleccionada con:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Añade `--account <id>` cuando quieras apuntar explícitamente a una cuenta de Matrix con nombre.

Matrix acepta directamente URL de avatar `mxc://`. Cuando pasas una URL de avatar `http://` o `https://`, OpenClaw primero la sube a Matrix y vuelve a guardar la URL `mxc://` resuelta en `channels.matrix.avatarUrl` (o en la sustitución de la cuenta seleccionada).

## Hilos

Matrix admite hilos nativos de Matrix tanto para respuestas automáticas como para envíos de herramientas de mensajes.

- `dm.sessionScope: "per-user"` (predeterminado) mantiene el enrutamiento de MD de Matrix con alcance por remitente, de modo que varias salas de MD pueden compartir una sesión cuando se resuelven al mismo par.
- `dm.sessionScope: "per-room"` aísla cada sala de MD de Matrix en su propia clave de sesión, mientras sigue usando la autenticación y las comprobaciones normales de lista de permitidos para MD.
- Las vinculaciones explícitas de conversación de Matrix siguen teniendo prioridad sobre `dm.sessionScope`, por lo que las salas e hilos vinculados mantienen su sesión de destino elegida.
- `threadReplies: "off"` mantiene las respuestas en el nivel superior y mantiene los mensajes entrantes en hilos en la sesión principal.
- `threadReplies: "inbound"` responde dentro de un hilo solo cuando el mensaje entrante ya estaba en ese hilo.
- `threadReplies: "always"` mantiene las respuestas de sala en un hilo anclado en el mensaje que las activó y enruta esa conversación mediante la sesión con alcance de hilo correspondiente desde el primer mensaje activador.
- `dm.threadReplies` sustituye la configuración de nivel superior solo para los MD. Por ejemplo, puedes mantener aislados los hilos de salas mientras mantienes los MD planos.
- Los mensajes entrantes en hilos incluyen el mensaje raíz del hilo como contexto adicional del agente.
- Los envíos de herramientas de mensajes heredan automáticamente el hilo actual de Matrix cuando el destino es la misma sala, o el mismo usuario objetivo de MD, a menos que se proporcione un `threadId` explícito.
- La reutilización del mismo objetivo de usuario de MD en la misma sesión solo se activa cuando los metadatos de la sesión actual prueban el mismo par de MD en la misma cuenta de Matrix; de lo contrario, OpenClaw vuelve al enrutamiento normal con alcance por usuario.
- Cuando OpenClaw detecta que una sala de MD de Matrix entra en conflicto con otra sala de MD en la misma sesión compartida de MD de Matrix, publica una única vez un `m.notice` en esa sala con la vía de escape `/focus` cuando las vinculaciones de hilos están habilitadas y con la indicación `dm.sessionScope`.
- Las vinculaciones de hilos en tiempo de ejecución son compatibles con Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y `/acp spawn` vinculado a hilos funcionan en salas y MD de Matrix.
- `/focus` de nivel superior en sala/MD de Matrix crea un nuevo hilo de Matrix y lo vincula a la sesión de destino cuando `threadBindings.spawnSubagentSessions=true`.
- Ejecutar `/focus` o `/acp spawn --thread here` dentro de un hilo de Matrix existente vincula ese hilo actual en su lugar.

## Vinculaciones de conversación de ACP

Las salas, MD e hilos existentes de Matrix pueden convertirse en espacios de trabajo ACP duraderos sin cambiar la superficie de chat.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del MD, sala o hilo existente de Matrix que quieras seguir usando.
- En un MD o sala de Matrix de nivel superior, el MD o la sala actual sigue siendo la superficie de chat y los mensajes futuros se enrutan a la sesión ACP generada.
- Dentro de un hilo de Matrix existente, `--bind here` vincula ese hilo actual en su lugar.
- `/new` y `/reset` restablecen en su lugar la misma sesión ACP vinculada.
- `/acp close` cierra la sesión ACP y elimina la vinculación.

Notas:

- `--bind here` no crea un hilo hijo de Matrix.
- `threadBindings.spawnAcpSessions` solo es necesario para `/acp spawn --thread auto|here`, donde OpenClaw necesita crear o vincular un hilo hijo de Matrix.

### Configuración de vinculación de hilos

Matrix hereda los valores predeterminados globales de `session.threadBindings` y también admite sustituciones por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Las marcas de generación vinculada a hilos de Matrix son de participación voluntaria:

- Establece `threadBindings.spawnSubagentSessions: true` para permitir que `/focus` de nivel superior cree y vincule nuevos hilos de Matrix.
- Establece `threadBindings.spawnAcpSessions: true` para permitir que `/acp spawn --thread auto|here` vincule sesiones ACP a hilos de Matrix.

## Reacciones

Matrix admite acciones de reacción salientes, notificaciones de reacciones entrantes y reacciones de confirmación entrantes.

- Las herramientas de reacción saliente están controladas por `channels["matrix"].actions.reactions`.
- `react` añade una reacción a un evento específico de Matrix.
- `reactions` enumera el resumen actual de reacciones para un evento específico de Matrix.
- `emoji=""` elimina las propias reacciones de la cuenta del bot en ese evento.
- `remove: true` elimina solo la reacción del emoji especificado de la cuenta del bot.

El alcance de las reacciones de confirmación se resuelve en este orden:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- alternativa del emoji de identidad del agente

El alcance de las reacciones de confirmación se resuelve en este orden:

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

- `channels.matrix.historyLimit` controla cuántos mensajes recientes de la sala se incluyen como `InboundHistory` cuando un mensaje de una sala de Matrix activa el agente. Recurre a `messages.groupChat.historyLimit`; si ambos no están establecidos, el valor predeterminado efectivo es `0`. Establece `0` para desactivarlo.
- El historial de salas de Matrix es solo de sala. Los MD siguen usando el historial normal de la sesión.
- El historial de salas de Matrix es solo de pendientes: OpenClaw almacena en búfer los mensajes de la sala que aún no activaron una respuesta y luego toma una instantánea de esa ventana cuando llega una mención u otro desencadenante.
- El mensaje desencadenante actual no se incluye en `InboundHistory`; permanece en el cuerpo principal entrante de ese turno.
- Los reintentos del mismo evento de Matrix reutilizan la instantánea original del historial en lugar de desplazarse hacia mensajes más recientes de la sala.

## Visibilidad del contexto

Matrix admite el control compartido `contextVisibility` para contexto adicional de la sala, como texto de respuesta recuperado, raíces de hilos e historial pendiente.

- `contextVisibility: "all"` es el valor predeterminado. El contexto adicional se conserva tal como se recibe.
- `contextVisibility: "allowlist"` filtra el contexto adicional para enviar solo remitentes permitidos por las comprobaciones activas de lista de permitidos de sala/usuario.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, pero sigue conservando una respuesta citada explícita.

Esta configuración afecta la visibilidad del contexto adicional, no si el propio mensaje entrante puede activar una respuesta.
La autorización del desencadenante sigue viniendo de la configuración de `groupPolicy`, `groups`, `groupAllowFrom` y la política de MD.

## Política de MD y salas

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

Consulta [Grupos](/es/channels/groups) para conocer el comportamiento de la exigencia de mención y la lista de permitidos.

Ejemplo de emparejamiento para MD de Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un usuario de Matrix no aprobado sigue enviándote mensajes antes de la aprobación, OpenClaw reutiliza el mismo código de emparejamiento pendiente y puede volver a enviar una respuesta de recordatorio tras un breve tiempo de espera en lugar de generar un código nuevo.

Consulta [Emparejamiento](/es/channels/pairing) para ver el flujo compartido de emparejamiento de MD y el diseño del almacenamiento.

## Reparación directa de sala

Si el estado del mensaje directo se desincroniza, OpenClaw puede acabar con asignaciones `m.direct` obsoletas que apuntan a salas individuales antiguas en lugar del MD activo. Inspecciona la asignación actual para un par con:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repárala con:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

El flujo de reparación:

- prefiere un MD estricto 1:1 que ya esté asignado en `m.direct`
- recurre a cualquier MD estricto 1:1 actualmente unido con ese usuario
- crea una nueva sala directa y reescribe `m.direct` si no existe un MD sano

El flujo de reparación no elimina automáticamente las salas antiguas. Solo selecciona el MD sano y actualiza la asignación para que los nuevos envíos de Matrix, avisos de verificación y otros flujos de mensaje directo vuelvan a dirigirse a la sala correcta.

## Aprobaciones de exec

Matrix puede actuar como cliente nativo de aprobación para una cuenta de Matrix. Los controles nativos
de enrutamiento de MD/canal siguen estando en la configuración de aprobación de exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opcional; recurre a `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, predeterminado: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Los aprobadores deben ser ID de usuario de Matrix, como `@owner:example.org`. Matrix habilita automáticamente las aprobaciones nativas cuando `enabled` no está establecido o es `"auto"` y se puede resolver al menos un aprobador. Las aprobaciones de exec usan primero `execApprovals.approvers` y pueden recurrir a `channels.matrix.dm.allowFrom`. Las aprobaciones de Plugin autorizan mediante `channels.matrix.dm.allowFrom`. Establece `enabled: false` para desactivar explícitamente Matrix como cliente nativo de aprobación. En caso contrario, las solicitudes de aprobación recurren a otras rutas de aprobación configuradas o a la política alternativa de aprobación.

El enrutamiento nativo de Matrix admite ambos tipos de aprobación:

- `channels.matrix.execApprovals.*` controla el modo nativo de distribución a MD/canal para las solicitudes de aprobación de Matrix.
- Las aprobaciones de exec usan el conjunto de aprobadores de exec de `execApprovals.approvers` o `channels.matrix.dm.allowFrom`.
- Las aprobaciones de Plugin usan la lista de permitidos de MD de Matrix de `channels.matrix.dm.allowFrom`.
- Los atajos de reacción de Matrix y las actualizaciones de mensajes se aplican tanto a las aprobaciones de exec como a las de Plugin.

Reglas de entrega:

- `target: "dm"` envía las solicitudes de aprobación a los MD de los aprobadores
- `target: "channel"` devuelve la solicitud a la sala o MD de Matrix de origen
- `target: "both"` envía a los MD de los aprobadores y a la sala o MD de Matrix de origen

Las solicitudes de aprobación de Matrix inicializan atajos de reacción en el mensaje principal de aprobación:

- `✅` = permitir una vez
- `❌` = denegar
- `♾️` = permitir siempre cuando esa decisión esté permitida por la política de exec efectiva

Los aprobadores pueden reaccionar a ese mensaje o usar los comandos con barra alternativos: `/approve <id> allow-once`, `/approve <id> allow-always` o `/approve <id> deny`.

Solo los aprobadores resueltos pueden aprobar o denegar. Para las aprobaciones de exec, la entrega por canal incluye el texto del comando, así que habilita `channel` o `both` solo en salas de confianza.

Sustitución por cuenta:

- `channels.matrix.accounts.<account>.execApprovals`

Documentación relacionada: [Aprobaciones de exec](/es/tools/exec-approvals)

## Comandos con barra

Los comandos con barra de Matrix (por ejemplo `/new`, `/reset`, `/model`) funcionan directamente en MD. En salas, OpenClaw también reconoce comandos con barra precedidos por la propia mención de Matrix del bot, por lo que `@bot:server /new` activa la ruta del comando sin necesidad de una expresión regular de mención personalizada. Esto mantiene al bot receptivo a publicaciones en salas del estilo `@mention /command` que emiten Element y clientes similares cuando un usuario autocompleta el bot antes de escribir el comando.

Las reglas de autorización siguen aplicándose: los remitentes de comandos deben cumplir las políticas de propietario o lista de permitidos de MD o sala igual que con los mensajes normales.

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

Los valores de nivel superior de `channels.matrix` actúan como valores predeterminados para las cuentas con nombre, a menos que una cuenta los sustituya.
Puedes limitar entradas de sala heredadas a una cuenta de Matrix con `groups.<room>.account`.
Las entradas sin `account` permanecen compartidas entre todas las cuentas de Matrix, y las entradas con `account: "default"` siguen funcionando cuando la cuenta predeterminada está configurada directamente en `channels.matrix.*` de nivel superior.
Los valores predeterminados parciales de autenticación compartida no crean por sí mismos una cuenta predeterminada implícita independiente. OpenClaw solo sintetiza la cuenta `default` de nivel superior cuando ese valor predeterminado tiene autenticación nueva (`homeserver` más `accessToken`, o `homeserver` más `userId` y `password`); las cuentas con nombre pueden seguir siendo detectables desde `homeserver` más `userId` cuando las credenciales en caché satisfacen la autenticación más adelante.
Si Matrix ya tiene exactamente una cuenta con nombre, o `defaultAccount` apunta a una clave de cuenta con nombre existente, la promoción de reparación/configuración de una sola cuenta a varias conserva esa cuenta en lugar de crear una nueva entrada `accounts.default`. Solo las claves de autenticación/inicialización de Matrix se mueven a esa cuenta promovida; las claves compartidas de política de entrega permanecen en el nivel superior.
Establece `defaultAccount` cuando quieras que OpenClaw prefiera una cuenta de Matrix con nombre para enrutamiento implícito, sondeo y operaciones de CLI.
Si hay varias cuentas de Matrix configuradas y un ID de cuenta es `default`, OpenClaw usa esa cuenta implícitamente incluso cuando `defaultAccount` no está establecido.
Si configuras varias cuentas con nombre, establece `defaultAccount` o pasa `--account <id>` en los comandos CLI que dependen de la selección implícita de cuenta.
Pasa `--account <id>` a `openclaw matrix verify ...` y `openclaw matrix devices ...` cuando quieras sustituir esa selección implícita para un comando.

Consulta [Referencia de configuración](/es/gateway/configuration-reference#multi-account-all-channels) para ver el patrón compartido de varias cuentas.

## Homeservers privados/LAN

De forma predeterminada, OpenClaw bloquea los homeservers privados/internos de Matrix para protección contra SSRF, a menos que
lo permitas explícitamente por cuenta.

Si tu homeserver se ejecuta en localhost, en una IP de LAN/Tailscale o en un nombre de host interno, habilita
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

Esta activación explícita solo permite destinos privados/internos de confianza. Los homeservers públicos en texto claro como
`http://matrix.example.org:8008` siguen bloqueados. Prefiere `https://` siempre que sea posible.

## Uso de proxy para el tráfico de Matrix

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

Las cuentas con nombre pueden sustituir el valor predeterminado de nivel superior con `channels.matrix.accounts.<id>.proxy`.
OpenClaw usa la misma configuración de proxy para el tráfico de Matrix en tiempo de ejecución y para los sondeos de estado de cuenta.

## Resolución de objetivos

Matrix acepta estas formas de objetivo en cualquier lugar donde OpenClaw te pida un objetivo de sala o usuario:

- Usuarios: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

La búsqueda en directorio en vivo usa la cuenta de Matrix con sesión iniciada:

- Las búsquedas de usuarios consultan el directorio de usuarios de Matrix en ese homeserver.
- Las búsquedas de salas aceptan directamente ID y alias explícitos de sala, y luego recurren a la búsqueda por nombres de salas unidas para esa cuenta.
- La búsqueda por nombre de salas unidas es de mejor esfuerzo. Si un nombre de sala no puede resolverse a un ID o alias, se ignora durante la resolución de la lista de permitidos en tiempo de ejecución.

## Referencia de configuración

- `enabled`: habilitar o deshabilitar el canal.
- `name`: etiqueta opcional para la cuenta.
- `defaultAccount`: ID de cuenta preferido cuando se configuran varias cuentas de Matrix.
- `homeserver`: URL del homeserver, por ejemplo `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta cuenta de Matrix se conecte a homeservers privados/internos. Habilítalo cuando el homeserver se resuelva a `localhost`, una IP de LAN/Tailscale o un host interno como `matrix-synapse`.
- `proxy`: URL opcional de proxy HTTP(S) para el tráfico de Matrix. Las cuentas con nombre pueden sustituir el valor predeterminado de nivel superior con su propio `proxy`.
- `userId`: ID completo de usuario de Matrix, por ejemplo `@bot:example.org`.
- `accessToken`: token de acceso para autenticación basada en token. Se admiten valores en texto claro y valores SecretRef para `channels.matrix.accessToken` y `channels.matrix.accounts.<id>.accessToken` en proveedores env/file/exec. Consulta [Gestión de secretos](/es/gateway/secrets).
- `password`: contraseña para inicio de sesión basado en contraseña. Se admiten valores en texto claro y valores SecretRef.
- `deviceId`: ID explícito del dispositivo de Matrix.
- `deviceName`: nombre para mostrar del dispositivo para el inicio de sesión con contraseña.
- `avatarUrl`: URL almacenada del avatar propio para la sincronización del perfil y las actualizaciones de `profile set`.
- `initialSyncLimit`: número máximo de eventos recuperados durante la sincronización de inicio.
- `encryption`: habilitar E2EE.
- `allowlistOnly`: cuando es `true`, convierte la política de sala `open` en `allowlist`, y fuerza todas las políticas activas de MD excepto `disabled` (incluidas `pairing` y `open`) a `allowlist`. No afecta a las políticas `disabled`.
- `allowBots`: permitir mensajes de otras cuentas configuradas de OpenClaw Matrix (`true` o `"mentions"`).
- `groupPolicy`: `open`, `allowlist` o `disabled`.
- `contextVisibility`: modo de visibilidad del contexto adicional de la sala (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: lista de permitidos de ID de usuario para tráfico de sala. Los ID completos de usuario de Matrix son lo más seguro; las coincidencias exactas de directorio se resuelven al inicio y cuando la lista de permitidos cambia mientras el monitor está en ejecución. Los nombres no resueltos se ignoran.
- `historyLimit`: número máximo de mensajes de sala que se incluirán como contexto de historial de grupo. Recurre a `messages.groupChat.historyLimit`; si ambos no están establecidos, el valor predeterminado efectivo es `0`. Establece `0` para desactivarlo.
- `replyToMode`: `off`, `first`, `all` o `batched`.
- `markdown`: configuración opcional de renderizado de Markdown para texto saliente de Matrix.
- `streaming`: `off` (predeterminado), `"partial"`, `"quiet"`, `true` o `false`. `"partial"` y `true` habilitan actualizaciones de borrador con vista previa primero usando mensajes de texto normales de Matrix. `"quiet"` usa avisos de vista previa sin notificación para configuraciones autoalojadas con reglas push. `false` equivale a `"off"`.
- `blockStreaming`: `true` habilita mensajes de progreso independientes para bloques completados del asistente mientras el streaming de vista previa de borrador está activo.
- `threadReplies`: `off`, `inbound` o `always`.
- `threadBindings`: sustituciones por canal para el enrutamiento y ciclo de vida de sesiones vinculadas a hilos.
- `startupVerification`: modo automático de solicitud de autoverificación al inicio (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: tiempo de espera antes de reintentar solicitudes automáticas de verificación al inicio.
- `textChunkLimit`: tamaño del fragmento de mensaje saliente en caracteres (se aplica cuando `chunkMode` es `length`).
- `chunkMode`: `length` divide los mensajes por número de caracteres; `newline` divide en los límites de línea.
- `responsePrefix`: cadena opcional que se antepone a todas las respuestas salientes de este canal.
- `ackReaction`: sustitución opcional de la reacción de confirmación para este canal/cuenta.
- `ackReactionScope`: sustitución opcional del alcance de la reacción de confirmación (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modo de notificación de reacciones entrantes (`own`, `off`).
- `mediaMaxMb`: límite de tamaño multimedia en MB para envíos salientes y procesamiento multimedia entrante.
- `autoJoin`: política de unión automática por invitación (`always`, `allowlist`, `off`). Predeterminado: `off`. Se aplica a todas las invitaciones de Matrix, incluidas las invitaciones de estilo MD.
- `autoJoinAllowlist`: salas/alias permitidos cuando `autoJoin` es `allowlist`. Las entradas de alias se resuelven a ID de sala durante el manejo de invitaciones; OpenClaw no confía en el estado de alias declarado por la sala invitada.
- `dm`: bloque de política de MD (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: controla el acceso a MD después de que OpenClaw se haya unido a la sala y la haya clasificado como MD. No cambia si una invitación se une automáticamente.
- `dm.allowFrom`: lista de permitidos de ID de usuario para tráfico de MD. Los ID completos de usuario de Matrix son lo más seguro; las coincidencias exactas de directorio se resuelven al inicio y cuando la lista de permitidos cambia mientras el monitor está en ejecución. Los nombres no resueltos se ignoran.
- `dm.sessionScope`: `per-user` (predeterminado) o `per-room`. Usa `per-room` cuando quieras que cada sala de MD de Matrix mantenga un contexto separado aunque el par sea el mismo.
- `dm.threadReplies`: sustitución de política de hilos solo para MD (`off`, `inbound`, `always`). Sustituye la configuración `threadReplies` de nivel superior tanto para la colocación de respuestas como para el aislamiento de sesión en MD.
- `execApprovals`: entrega nativa de aprobaciones de exec de Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID de usuario de Matrix autorizados para aprobar solicitudes de exec. Opcional cuando `dm.allowFrom` ya identifica a los aprobadores.
- `execApprovals.target`: `dm | channel | both` (predeterminado: `dm`).
- `accounts`: sustituciones con nombre por cuenta. Los valores de nivel superior de `channels.matrix` actúan como valores predeterminados para estas entradas.
- `groups`: mapa de políticas por sala. Prefiere ID o alias de sala; los nombres de sala no resueltos se ignoran en tiempo de ejecución. La identidad de sesión/grupo usa el ID de sala estable después de la resolución.
- `groups.<room>.account`: restringe una entrada de sala heredada a una cuenta específica de Matrix en configuraciones de varias cuentas.
- `groups.<room>.allowBots`: sustitución a nivel de sala para remitentes bot configurados (`true` o `"mentions"`).
- `groups.<room>.users`: lista de permitidos de remitentes por sala.
- `groups.<room>.tools`: sustituciones por sala para permitir/denegar herramientas.
- `groups.<room>.autoReply`: sustitución a nivel de sala para el requisito de mención. `true` desactiva los requisitos de mención para esa sala; `false` los vuelve a forzar.
- `groups.<room>.skills`: filtro opcional de Skills por sala.
- `groups.<room>.systemPrompt`: fragmento opcional de prompt del sistema por sala.
- `rooms`: alias heredado de `groups`.
- `actions`: control por acción de herramientas (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de MD y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat de grupo y exigencia de mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
