---
read_when:
    - Configurar Matrix en OpenClaw
    - Configurar Matrix E2EE y la verificación
summary: Estado de compatibilidad con Matrix, configuración inicial y ejemplos de configuración
title: Matriz
x-i18n:
    generated_at: "2026-04-30T05:29:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261b0eaae452cff7bb9ddf8dc67ddda45fb27b6468e95450b19207348d0b577a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix es un Plugin de canal incluido para OpenClaw.
Usa el `matrix-js-sdk` oficial y admite mensajes directos, salas, hilos, multimedia, reacciones, encuestas, ubicación y E2EE.

## Plugin incluido

Las versiones empaquetadas actuales de OpenClaw incluyen el Plugin Matrix de serie. No necesitas instalar nada; configurar `channels.matrix.*` (consulta [Configuración](#setup)) es lo que lo activa.

Para compilaciones antiguas o instalaciones personalizadas que excluyen Matrix, instala un paquete npm actual cuando se publique uno:

```bash
openclaw plugins install @openclaw/matrix
```

Si npm informa que el paquete propiedad de OpenClaw está obsoleto, usa una compilación empaquetada actual de OpenClaw o un checkout local hasta que se publique un paquete npm más nuevo.

Desde un checkout local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registra y habilita el Plugin, por lo que no se necesita un paso separado `openclaw plugins enable matrix`. El Plugin todavía no hace nada hasta que configures el canal a continuación. Consulta [Plugins](/es/tools/plugin) para ver el comportamiento general de los Plugins y las reglas de instalación.

## Configuración

1. Crea una cuenta Matrix en tu homeserver.
2. Configura `channels.matrix` con `homeserver` + `accessToken`, o `homeserver` + `userId` + `password`.
3. Reinicia el Gateway.
4. Inicia un mensaje directo con el bot, o invítalo a una sala (consulta [unión automática](#auto-join): las invitaciones nuevas solo entran cuando `autoJoin` las permite).

### Configuración interactiva

```bash
openclaw channels add
openclaw configure --section channels
```

El asistente solicita: URL del homeserver, método de autenticación (token de acceso o contraseña), ID de usuario (solo autenticación con contraseña), nombre opcional del dispositivo, si se debe habilitar E2EE y si se debe configurar el acceso a salas y la unión automática.

Si ya existen variables de entorno `MATRIX_*` coincidentes y la cuenta seleccionada no tiene autenticación guardada, el asistente ofrece un atajo con variables de entorno. Para resolver nombres de salas antes de guardar una lista de permitidos, ejecuta `openclaw channels resolve --channel matrix "Project Room"`. Cuando E2EE está habilitado, el asistente escribe la configuración y ejecuta el mismo arranque que [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` tiene `off` como valor predeterminado. Con el valor predeterminado, el bot no aparecerá en salas nuevas ni mensajes directos de invitaciones recientes hasta que te unas manualmente.

OpenClaw no puede saber en el momento de la invitación si una sala invitada es un mensaje directo o un grupo, por lo que todas las invitaciones, incluidas las invitaciones con estilo de mensaje directo, pasan primero por `autoJoin`. `dm.policy` solo se aplica después, una vez que el bot se ha unido y la sala se ha clasificado.

<Warning>
Configura `autoJoin: "allowlist"` más `autoJoinAllowlist` para restringir qué invitaciones acepta el bot, o `autoJoin: "always"` para aceptar todas las invitaciones.

`autoJoinAllowlist` solo acepta destinos estables: `!roomId:server`, `#alias:server` o `*`. Los nombres simples de salas se rechazan; las entradas de alias se resuelven contra el homeserver, no contra el estado declarado por la sala invitada.
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

### Formatos de destino para listas de permitidos

Las listas de permitidos de mensajes directos y salas se rellenan mejor con ID estables:

- Mensajes directos (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): usa `@user:server`. Los nombres para mostrar solo se resuelven cuando el directorio del homeserver devuelve exactamente una coincidencia.
- Salas (`groups`, `autoJoinAllowlist`): usa `!room:server` o `#alias:server`. Los nombres se resuelven con el mejor esfuerzo contra salas unidas; las entradas no resueltas se ignoran en tiempo de ejecución.

### Normalización del ID de cuenta

El asistente convierte un nombre descriptivo en un ID de cuenta normalizado. Por ejemplo, `Ops Bot` se convierte en `ops-bot`. La puntuación se escapa en nombres de variables de entorno con ámbito para que dos cuentas no puedan colisionar: `-` → `_X2D_`, por lo que `ops-prod` se asigna a `MATRIX_OPS_X2D_PROD_*`.

### Credenciales en caché

Matrix almacena credenciales en caché en `~/.openclaw/credentials/matrix/`:

- cuenta predeterminada: `credentials.json`
- cuentas con nombre: `credentials-<account>.json`

Cuando existen credenciales en caché allí, OpenClaw trata Matrix como configurado aunque el token de acceso no esté en el archivo de configuración; eso cubre la configuración, `openclaw doctor` y las comprobaciones de estado del canal.

### Variables de entorno

Se usan cuando la clave de configuración equivalente no está establecida. La cuenta predeterminada usa nombres sin prefijo; las cuentas con nombre usan el ID de cuenta insertado antes del sufijo.

| Cuenta predeterminada | Cuenta con nombre (`<ID>` es el ID de cuenta normalizado) |
| --------------------- | --------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                  |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                                |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                     |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                    |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                   |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                                 |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                                |

Para la cuenta `ops`, los nombres se convierten en `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN`, y así sucesivamente. Las variables de entorno de clave de recuperación las leen los flujos de la CLI compatibles con recuperación (`verify backup restore`, `verify device`, `verify bootstrap`) cuando pasas la clave mediante `--recovery-key-stdin`.

`MATRIX_HOMESERVER` no se puede establecer desde un `.env` de espacio de trabajo; consulta [Archivos `.env` de espacio de trabajo](/es/gateway/security).

## Ejemplo de configuración

Una base práctica con emparejamiento de mensajes directos, lista de permitidos de salas y E2EE:

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

Para conservar las vistas previas de respuestas en vivo pero ocultar las líneas provisionales de herramientas/progreso, usa la forma de objeto:

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

| `streaming`                 | Comportamiento                                                                                                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (predeterminado)    | Espera la respuesta completa y envía una vez. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                                                   |
| `"partial"`                 | Edita un mensaje de texto normal en el mismo lugar mientras el modelo escribe el bloque actual. Los clientes Matrix estándar pueden notificar con la primera vista previa, no con la edición final.       |
| `"quiet"`                   | Igual que `"partial"`, pero el mensaje es un aviso sin notificación. Los destinatarios solo reciben una notificación cuando una regla push por usuario coincide con la edición finalizada (consulta abajo). |

`blockStreaming` es independiente de `streaming`:

| `streaming`             | `blockStreaming: true`                                                   | `blockStreaming: false` (predeterminado)              |
| ----------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| `"partial"` / `"quiet"` | Borrador en vivo del bloque actual, bloques completados como mensajes    | Borrador en vivo del bloque actual, finalizado in situ |
| `"off"`                 | Un mensaje de Matrix con notificación por cada bloque terminado          | Un mensaje de Matrix con notificación para la respuesta completa |

Notas:

- Si una vista previa supera el límite de tamaño por evento de Matrix, OpenClaw detiene el streaming de vista previa y vuelve a la entrega solo final.
- Las respuestas multimedia siempre envían adjuntos normalmente. Si una vista previa obsoleta ya no se puede reutilizar de forma segura, OpenClaw la redacta antes de enviar la respuesta multimedia final.
- Las actualizaciones de vista previa de progreso de herramientas están habilitadas de forma predeterminada cuando el streaming de vista previa de Matrix está activo. Configura `streaming.preview.toolProgress: false` para conservar las ediciones de vista previa del texto de respuesta pero dejar el progreso de herramientas en la ruta de entrega normal.
- Las ediciones de vista previa cuestan llamadas adicionales a la API de Matrix. Deja `streaming: "off"` si quieres el perfil de límite de tasa más conservador.

## Metadatos de aprobación

Las solicitudes de aprobación nativas de Matrix son eventos `m.room.message` normales con contenido de evento personalizado específico de OpenClaw bajo `com.openclaw.approval`. Matrix permite claves personalizadas de contenido de evento, por lo que los clientes estándar siguen mostrando el cuerpo de texto mientras los clientes compatibles con OpenClaw pueden leer el ID de aprobación estructurado, el tipo, el estado, las decisiones disponibles y los detalles de exec/Plugin.

Cuando una solicitud de aprobación es demasiado larga para un evento de Matrix, OpenClaw divide el texto visible en fragmentos y adjunta `com.openclaw.approval` solo al primer fragmento. Las reacciones para las decisiones de permitir/denegar se vinculan a ese primer evento, por lo que las solicitudes largas conservan el mismo destino de aprobación que las solicitudes de un solo evento.

### Reglas push autoalojadas para vistas previas finalizadas silenciosas

`streaming: "quiet"` solo notifica a los destinatarios cuando un bloque o turno se finaliza: una regla push por usuario debe coincidir con el marcador de vista previa finalizada. Consulta [Reglas push de Matrix para vistas previas silenciosas](/es/channels/matrix-push-rules) para ver la receta completa (token de destinatario, comprobación de pusher, instalación de regla, notas por homeserver).

## Salas bot a bot

De forma predeterminada, se ignoran los mensajes de Matrix de otras cuentas Matrix configuradas de OpenClaw.

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

- `allowBots: true` acepta mensajes de otras cuentas de bot de Matrix configuradas en salas permitidas y mensajes directos.
- `allowBots: "mentions"` acepta esos mensajes solo cuando mencionan visiblemente a este bot en salas. Los mensajes directos siguen estando permitidos.
- `groups.<room>.allowBots` anula la configuración de nivel de cuenta para una sala.
- OpenClaw sigue ignorando mensajes del mismo ID de usuario de Matrix para evitar bucles de autorrespuesta.
- Matrix no expone aquí una marca nativa de bot; OpenClaw trata "escrito por bot" como "enviado por otra cuenta Matrix configurada en este Gateway de OpenClaw".

Usa listas de permitidos de salas estrictas y requisitos de mención al habilitar tráfico bot a bot en salas compartidas.

## Cifrado y verificación

En salas cifradas (E2EE), los eventos de imagen salientes usan `thumbnail_file` para que las vistas previas de imágenes se cifren junto con el adjunto completo. Las salas no cifradas siguen usando `thumbnail_url` sin cifrar. No se necesita configuración: el plugin detecta automáticamente el estado de E2EE.

Todos los comandos `openclaw matrix` aceptan `--verbose` (diagnósticos completos), `--json` (salida legible por máquina) y `--account <id>` (configuraciones multicuenta). La salida es concisa por defecto, con registro interno silencioso del SDK. Los ejemplos siguientes muestran la forma canónica; añade las marcas según sea necesario.

### Habilitar el cifrado

```bash
openclaw matrix encryption setup
```

Inicializa el almacenamiento secreto y la firma cruzada, crea una copia de seguridad de claves de sala si es necesario y luego imprime el estado y los siguientes pasos. Marcas útiles:

- `--recovery-key <key>` aplica una clave de recuperación antes de la inicialización (prefiere la forma por stdin documentada abajo)
- `--force-reset-cross-signing` descarta la identidad de firma cruzada actual y crea una nueva (úsalo solo de forma intencional)

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

`verify status` informa de tres señales de confianza independientes (`--verbose` las muestra todas):

- `Locally trusted`: confiable solo para este cliente
- `Cross-signing verified`: el SDK informa verificación mediante firma cruzada
- `Signed by owner`: firmado por tu propia clave de autofirma (solo diagnóstico)

`Verified by owner` pasa a ser `yes` solo cuando `Cross-signing verified` es `yes`. La confianza local o una firma del propietario por sí sola no es suficiente.

`--allow-degraded-local-state` devuelve diagnósticos de mejor esfuerzo sin preparar primero la cuenta de Matrix; es útil para comprobaciones sin conexión o parcialmente configuradas.

### Verificar este dispositivo con una clave de recuperación

La clave de recuperación es sensible: pásala por stdin en lugar de pasarla en la línea de comandos. Define `MATRIX_RECOVERY_KEY` (o `MATRIX_<ID>_RECOVERY_KEY` para una cuenta con nombre):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

El comando informa de tres estados:

- `Recovery key accepted`: Matrix aceptó la clave para almacenamiento secreto o confianza del dispositivo.
- `Backup usable`: la copia de seguridad de claves de sala puede cargarse con el material de recuperación confiable.
- `Device verified by owner`: este dispositivo tiene confianza completa de identidad de firma cruzada de Matrix.

Sale con código distinto de cero cuando la confianza completa de identidad está incompleta, incluso si la clave de recuperación desbloqueó material de copia de seguridad. En ese caso, termina la autoverificación desde otro cliente de Matrix:

```bash
openclaw matrix verify self
```

`verify self` espera a que `Cross-signing verified: yes` antes de salir correctamente. Usa `--timeout-ms <ms>` para ajustar la espera.

La forma con clave literal `openclaw matrix verify device "<recovery-key>"` también se acepta, pero la clave queda en el historial de tu shell.

### Inicializar o reparar la firma cruzada

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` es el comando de reparación y configuración para cuentas cifradas. En orden:

- inicializa el almacenamiento secreto, reutilizando una clave de recuperación existente cuando sea posible
- inicializa la firma cruzada y sube las claves públicas que falten
- marca y firma de forma cruzada el dispositivo actual
- crea una copia de seguridad de claves de sala en el servidor si aún no existe una

Si el homeserver requiere UIA para subir claves de firma cruzada, OpenClaw prueba primero sin autenticación, luego `m.login.dummy` y después `m.login.password` (requiere `channels.matrix.password`).

Marcas útiles:

- `--recovery-key-stdin` (combínalo con `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) o `--recovery-key <key>`
- `--force-reset-cross-signing` para descartar la identidad de firma cruzada actual (solo de forma intencional)

### Copia de seguridad de claves de sala

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` muestra si existe una copia de seguridad en el servidor y si este dispositivo puede descifrarla. `backup restore` importa las claves de sala respaldadas al almacén criptográfico local; si la clave de recuperación ya está en disco, puedes omitir `--recovery-key-stdin`.

Para reemplazar una copia de seguridad dañada por una línea base nueva (acepta perder historial antiguo irrecuperable; también puede recrear el almacenamiento secreto si el secreto de copia de seguridad actual no se puede cargar):

```bash
openclaw matrix verify backup reset --yes
```

Añade `--rotate-recovery-key` solo cuando quieras intencionalmente que la clave de recuperación anterior deje de desbloquear la nueva línea base de copia de seguridad.

### Listar, solicitar y responder a verificaciones

```bash
openclaw matrix verify list
```

Lista las solicitudes de verificación pendientes para la cuenta seleccionada.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Envía una solicitud de verificación desde esta cuenta de OpenClaw. `--own-user` solicita autoverificación (aceptas el aviso en otro cliente de Matrix del mismo usuario); `--user-id`/`--device-id`/`--room-id` apuntan a otra persona. `--own-user` no puede combinarse con las otras marcas de destino.

Para la gestión de ciclo de vida de nivel inferior, normalmente al seguir solicitudes entrantes desde otro cliente, estos comandos actúan sobre una solicitud específica `<id>` (impresa por `verify list` y `verify request`):

| Comando                                    | Propósito                                                           |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Aceptar una solicitud entrante                                      |
| `openclaw matrix verify start <id>`        | Iniciar el flujo SAS                                                |
| `openclaw matrix verify sas <id>`          | Imprimir los emoji o decimales SAS                                  |
| `openclaw matrix verify confirm-sas <id>`  | Confirmar que el SAS coincide con lo que muestra el otro cliente    |
| `openclaw matrix verify mismatch-sas <id>` | Rechazar el SAS cuando los emoji o decimales no coinciden           |
| `openclaw matrix verify cancel <id>`       | Cancelar; acepta `--reason <text>` y `--code <matrix-code>` opcionales |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` y `cancel` aceptan `--user-id` y `--room-id` como pistas de seguimiento de DM cuando la verificación está anclada a una sala de mensaje directo específica.

### Notas multicuenta

Sin `--account <id>`, los comandos de la CLI de Matrix usan la cuenta predeterminada implícita. Si tienes varias cuentas con nombre y no has definido `channels.matrix.defaultAccount`, se negarán a adivinar y te pedirán que elijas. Cuando E2EE está deshabilitado o no disponible para una cuenta con nombre, los errores apuntan a la clave de configuración de esa cuenta, por ejemplo `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Comportamiento de inicio">
    Con `encryption: true`, `startupVerification` toma por defecto `"if-unverified"`. Al iniciar, un dispositivo no verificado solicita autoverificación en otro cliente de Matrix, omitiendo duplicados y aplicando un periodo de espera (24 horas por defecto). Ajústalo con `startupVerificationCooldownHours` o desactívalo con `startupVerification: "off"`.

    El inicio también ejecuta una pasada conservadora de inicialización criptográfica que reutiliza el almacenamiento secreto actual y la identidad de firma cruzada. Si el estado de inicialización está roto, OpenClaw intenta una reparación protegida incluso sin `channels.matrix.password`; si el homeserver requiere UIA con contraseña, el inicio registra una advertencia y sigue sin ser fatal. Los dispositivos ya firmados por el propietario se conservan.

    Consulta [Migración de Matrix](/es/channels/matrix-migration) para ver el flujo completo de actualización.

  </Accordion>

  <Accordion title="Avisos de verificación">
    Matrix publica avisos del ciclo de vida de verificación en la sala estricta de verificación por DM como mensajes `m.notice`: solicitud, listo (con guía de "Verificar por emoji"), inicio/finalización y detalles SAS (emoji/decimal) cuando están disponibles.

    Las solicitudes entrantes desde otro cliente de Matrix se rastrean y se aceptan automáticamente. Para la autoverificación, OpenClaw inicia el flujo SAS automáticamente y confirma su propio lado una vez que la verificación por emoji está disponible; aún debes comparar y confirmar "They match" en tu cliente de Matrix.

    Los avisos del sistema de verificación no se reenvían al flujo de chat del agente.

  </Accordion>

  <Accordion title="Dispositivo de Matrix eliminado o no válido">
    Si `verify status` indica que el dispositivo actual ya no aparece en el homeserver, crea un nuevo dispositivo de Matrix de OpenClaw. Para inicio de sesión con contraseña:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Para autenticación con token, crea un token de acceso nuevo en tu cliente de Matrix o interfaz de administrador y luego actualiza OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Sustituye `assistant` por el ID de cuenta del comando fallido, u omite `--account` para la cuenta predeterminada.

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

    El estado de ejecución cifrado vive bajo `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e incluye el almacén de sincronización, el almacén criptográfico, la clave de recuperación, la instantánea de IDB, las vinculaciones de hilos y el estado de verificación de inicio. Cuando el token cambia pero la identidad de la cuenta permanece igual, OpenClaw reutiliza la mejor raíz existente para que el estado anterior siga visible.

  </Accordion>
</AccordionGroup>

## Gestión del perfil

Actualiza el perfil propio de Matrix para la cuenta seleccionada:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Puedes pasar ambas opciones en una sola llamada. Matrix acepta directamente URLs de avatar `mxc://`; cuando pasas `http://` o `https://`, OpenClaw sube primero el archivo y almacena la URL `mxc://` resuelta en `channels.matrix.avatarUrl` (o en la sobrescritura por cuenta).

## Hilos

Matrix admite hilos nativos de Matrix tanto para respuestas automáticas como para envíos de herramientas de mensajes. Dos controles independientes determinan el comportamiento:

### Enrutamiento de sesión (`sessionScope`)

`dm.sessionScope` decide cómo se asignan las salas de DM de Matrix a sesiones de OpenClaw:

- `"per-user"` (predeterminado): todas las salas de DM con el mismo interlocutor enrutado comparten una sesión.
- `"per-room"`: cada sala de DM de Matrix obtiene su propia clave de sesión, incluso cuando el interlocutor es el mismo.

Las vinculaciones explícitas de conversación siempre prevalecen sobre `sessionScope`, por lo que las salas e hilos vinculados conservan su sesión de destino elegida.

### Respuestas en hilos (`threadReplies`)

`threadReplies` decide dónde publica el bot su respuesta:

- `"off"`: las respuestas son de nivel superior. Los mensajes entrantes en hilos permanecen en la sesión principal.
- `"inbound"`: responder dentro de un hilo solo cuando el mensaje entrante ya estaba en ese hilo.
- `"always"`: responder dentro de un hilo enraizado en el mensaje que lo activa; esa conversación se enruta mediante una sesión correspondiente con alcance de hilo desde el primer activador en adelante.

`dm.threadReplies` sobrescribe esto solo para DM; por ejemplo, mantener aislados los hilos de sala mientras los DM permanecen planos.

### Herencia de hilos y comandos slash

- Los mensajes entrantes en hilos incluyen el mensaje raíz del hilo como contexto adicional del agente.
- Los envíos de la herramienta de mensajes heredan automáticamente el hilo Matrix actual cuando apuntan a la misma sala (o al mismo destino de usuario de MD), salvo que se proporcione un `threadId` explícito.
- La reutilización de destinos de usuario de MD solo se activa cuando los metadatos de la sesión actual prueban que se trata del mismo par de MD en la misma cuenta Matrix; de lo contrario, OpenClaw recurre al enrutamiento normal con ámbito de usuario.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` y `/acp spawn` vinculado a hilos funcionan en salas Matrix y MD.
- `/focus` de nivel superior crea un nuevo hilo Matrix y lo vincula a la sesión de destino cuando `threadBindings.spawnSubagentSessions: true`.
- Ejecutar `/focus` o `/acp spawn --thread here` dentro de un hilo Matrix existente vincula ese hilo en su lugar.

Cuando OpenClaw detecta una sala de MD de Matrix que colisiona con otra sala de MD en la misma sesión compartida, publica un `m.notice` único en esa sala que apunta a la vía de escape `/focus` y sugiere un cambio de `dm.sessionScope`. El aviso solo aparece cuando las vinculaciones de hilos están habilitadas.

## Vinculaciones de conversación ACP

Las salas Matrix, los MD y los hilos Matrix existentes pueden convertirse en espacios de trabajo ACP duraderos sin cambiar la superficie de chat.

Flujo rápido para operadores:

- Ejecuta `/acp spawn codex --bind here` dentro del MD de Matrix, la sala o el hilo existente que quieras seguir usando.
- En un MD o una sala Matrix de nivel superior, el MD o la sala actual permanece como la superficie de chat y los mensajes futuros se enrutan a la sesión ACP generada.
- Dentro de un hilo Matrix existente, `--bind here` vincula ese hilo actual en su lugar.
- `/new` y `/reset` restablecen la misma sesión ACP vinculada en su lugar.
- `/acp close` cierra la sesión ACP y elimina la vinculación.

Notas:

- `--bind here` no crea un hilo Matrix secundario.
- `threadBindings.spawnAcpSessions` solo se requiere para `/acp spawn --thread auto|here`, donde OpenClaw necesita crear o vincular un hilo Matrix secundario.

### Configuración de vinculaciones de hilos

Matrix hereda los valores predeterminados globales de `session.threadBindings` y también admite sobrescrituras por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Las marcas de generación vinculada a hilos de Matrix son opcionales:

- Configura `threadBindings.spawnSubagentSessions: true` para permitir que `/focus` de nivel superior cree y vincule nuevos hilos Matrix.
- Configura `threadBindings.spawnAcpSessions: true` para permitir que `/acp spawn --thread auto|here` vincule sesiones ACP a hilos Matrix.

## Reacciones

Matrix admite reacciones salientes, notificaciones de reacciones entrantes y reacciones de acuse de recibo.

La herramienta de reacciones salientes está controlada por `channels.matrix.actions.reactions`:

- `react` añade una reacción a un evento Matrix.
- `reactions` enumera el resumen de reacciones actual de un evento Matrix.
- `emoji=""` elimina las reacciones propias del bot en ese evento.
- `remove: true` elimina solo la reacción del emoji especificado del bot.

**Orden de resolución** (gana el primer valor definido):

| Configuración           | Orden                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | por cuenta → canal → `messages.ackReaction` → emoji de identidad del agente como alternativa   |
| `ackReactionScope`      | por cuenta → canal → `messages.ackReactionScope` → valor predeterminado `"group-mentions"` |
| `reactionNotifications` | por cuenta → canal → valor predeterminado `"own"`                                          |

`reactionNotifications: "own"` reenvía los eventos `m.reaction` añadidos cuando apuntan a mensajes Matrix redactados por el bot; `"off"` desactiva los eventos del sistema de reacciones. Las eliminaciones de reacciones no se sintetizan en eventos del sistema porque Matrix las expone como redacciones, no como eliminaciones independientes de `m.reaction`.

## Contexto del historial

- `channels.matrix.historyLimit` controla cuántos mensajes recientes de la sala se incluyen como `InboundHistory` cuando un mensaje de sala Matrix activa el agente. Recurre a `messages.groupChat.historyLimit`; si ambos no están definidos, el valor predeterminado efectivo es `0`. Configura `0` para desactivarlo.
- El historial de salas Matrix es solo de sala. Los MD siguen usando el historial normal de la sesión.
- El historial de salas Matrix es solo pendiente: OpenClaw almacena en búfer los mensajes de sala que aún no activaron una respuesta y luego captura una instantánea de esa ventana cuando llega una mención u otro activador.
- El mensaje activador actual no se incluye en `InboundHistory`; permanece en el cuerpo entrante principal de ese turno.
- Los reintentos del mismo evento Matrix reutilizan la instantánea de historial original en lugar de desplazarse hacia mensajes de sala más recientes.

## Visibilidad del contexto

Matrix admite el control compartido `contextVisibility` para contexto suplementario de sala, como texto de respuesta recuperado, raíces de hilos e historial pendiente.

- `contextVisibility: "all"` es el valor predeterminado. El contexto suplementario se conserva tal como se recibió.
- `contextVisibility: "allowlist"` filtra el contexto suplementario a remitentes permitidos por las comprobaciones de lista de permitidos activas de sala/usuario.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, pero conserva aun así una respuesta citada explícita.

Esta configuración afecta la visibilidad del contexto suplementario, no si el mensaje entrante en sí puede activar una respuesta.
La autorización del activador sigue procediendo de `groupPolicy`, `groups`, `groupAllowFrom` y la configuración de política de MD.

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
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

Para silenciar los MD por completo y mantener las salas funcionando, configura `dm.enabled: false`:

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

Consulta [Grupos](/es/channels/groups) para ver el comportamiento de control por menciones y listas de permitidos.

Ejemplo de emparejamiento para MD de Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un usuario de Matrix no aprobado sigue enviándote mensajes antes de la aprobación, OpenClaw reutiliza el mismo código de emparejamiento pendiente y puede enviar una respuesta de recordatorio tras un breve periodo de espera en lugar de emitir un código nuevo.

Consulta [Emparejamiento](/es/channels/pairing) para ver el flujo compartido de emparejamiento de MD y el diseño de almacenamiento.

## Reparación de salas directas

Si el estado de mensajes directos se desincroniza, OpenClaw puede terminar con asignaciones `m.direct` obsoletas que apuntan a salas individuales antiguas en lugar del MD activo. Inspecciona la asignación actual de un par:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repárala:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Ambos comandos aceptan `--account <id>` para configuraciones con varias cuentas. El flujo de reparación:

- prefiere un MD 1:1 estricto que ya esté asignado en `m.direct`
- recurre a cualquier MD 1:1 estricto con ese usuario al que se esté unido actualmente
- crea una sala directa nueva y reescribe `m.direct` si no existe ningún MD sano

No elimina salas antiguas automáticamente. Elige el MD sano y actualiza la asignación para que los envíos futuros de Matrix, los avisos de verificación y otros flujos de mensajes directos apunten a la sala correcta.

## Aprobaciones de exec

Matrix puede actuar como cliente de aprobación nativo. Configura en `channels.matrix.execApprovals` (o `channels.matrix.accounts.<account>.execApprovals` para una sobrescritura por cuenta):

- `enabled`: entrega aprobaciones mediante avisos nativos de Matrix. Cuando no está definido o es `"auto"`, Matrix se habilita automáticamente una vez que se puede resolver al menos un aprobador. Configura `false` para desactivarlo explícitamente.
- `approvers`: ID de usuario de Matrix (`@owner:example.org`) autorizados a aprobar solicitudes de exec. Opcional; recurre a `channels.matrix.dm.allowFrom`.
- `target`: dónde van los avisos. `"dm"` (predeterminado) envía a los MD de los aprobadores; `"channel"` envía a la sala Matrix o MD de origen; `"both"` envía a ambos.
- `agentFilter` / `sessionFilter`: listas de permitidos opcionales para qué agentes/sesiones activan la entrega por Matrix.

La autorización difiere ligeramente entre tipos de aprobación:

- **Aprobaciones de exec** usa `execApprovals.approvers`, con alternativa en `dm.allowFrom`.
- **Aprobaciones de Plugin** autoriza solo mediante `dm.allowFrom`.

Ambos tipos comparten atajos de reacción de Matrix y actualizaciones de mensajes. Los aprobadores ven atajos de reacción en el mensaje de aprobación principal:

- `✅` permitir una vez
- `❌` denegar
- `♾️` permitir siempre (cuando la política efectiva de exec lo permite)

Comandos slash alternativos: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Solo los aprobadores resueltos pueden aprobar o denegar. La entrega por canal de aprobaciones de exec incluye el texto del comando; habilita `channel` o `both` solo en salas de confianza.

Relacionado: [Aprobaciones de exec](/es/tools/exec-approvals).

## Comandos slash

Los comandos slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, etc.) funcionan directamente en MD. En salas, OpenClaw también reconoce comandos que tienen como prefijo la propia mención Matrix del bot, de modo que `@bot:server /new` activa la ruta de comandos sin una expresión regular de mención personalizada. Esto mantiene al bot receptivo a las publicaciones con estilo de sala `@mention /command` que emiten Element y clientes similares cuando un usuario completa con tabulación el bot antes de escribir el comando.

Las reglas de autorización siguen aplicándose: los remitentes de comandos deben satisfacer las mismas políticas de propietario/lista de permitidos de MD o sala que los mensajes normales.

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

- Los valores de nivel superior de `channels.matrix` actúan como valores predeterminados para las cuentas con nombre salvo que una cuenta los sobrescriba.
- Delimita una entrada de sala heredada a una cuenta específica con `groups.<room>.account`. Las entradas sin `account` se comparten entre cuentas; `account: "default"` sigue funcionando cuando la cuenta predeterminada está configurada en el nivel superior.

**Selección de cuenta predeterminada:**

- Configura `defaultAccount` para elegir la cuenta con nombre que preferirán el enrutamiento implícito, las comprobaciones y los comandos CLI.
- Si tienes varias cuentas y una se llama literalmente `default`, OpenClaw la usa implícitamente incluso cuando `defaultAccount` no está definido.
- Si tienes varias cuentas con nombre y no se seleccionó ninguna predeterminada, los comandos CLI se niegan a adivinar; configura `defaultAccount` o pasa `--account <id>`.
- El bloque de nivel superior `channels.matrix.*` solo se trata como la cuenta `default` implícita cuando su autenticación está completa (`homeserver` + `accessToken`, o `homeserver` + `userId` + `password`). Las cuentas con nombre siguen siendo detectables desde `homeserver` + `userId` una vez que las credenciales en caché cubren la autenticación.

**Promoción:**

- Cuando OpenClaw promociona una configuración de una sola cuenta a varias cuentas durante una reparación o configuración inicial, conserva la cuenta con nombre existente si existe una o si `defaultAccount` ya apunta a una. Solo las claves de autenticación/arranque de Matrix se mueven a la cuenta promocionada; las claves compartidas de política de entrega permanecen en el nivel superior.

Consulta [Referencia de configuración](/es/gateway/config-channels#multi-account-all-channels) para ver el patrón compartido de varias cuentas.

## Homeservers privados/LAN

De forma predeterminada, OpenClaw bloquea los homeservers Matrix privados/internos para proteger contra SSRF, salvo que
aceptes explícitamente por cuenta.

Si tu homeserver se ejecuta en localhost, una IP de LAN/Tailscale o un nombre de host interno, habilita
`network.dangerouslyAllowPrivateNetwork` para esa cuenta Matrix:

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

Esta activación explícita solo permite destinos privados/internos de confianza. Los homeservers públicos sin cifrar, como
`http://matrix.example.org:8008`, siguen bloqueados. Prefiere `https://` siempre que sea posible.

## Uso de proxy para el tráfico de Matrix

Si tu despliegue de Matrix necesita un proxy HTTP(S) saliente explícito, configura `channels.matrix.proxy`:

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
OpenClaw usa la misma configuración de proxy para el tráfico de Matrix en tiempo de ejecución y las comprobaciones de estado de la cuenta.

## Resolución de destinos

Matrix acepta estas formas de destino en cualquier lugar donde OpenClaw te pida un destino de sala o usuario:

- Usuarios: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

Los ID de sala de Matrix distinguen entre mayúsculas y minúsculas. Usa exactamente las mismas mayúsculas y minúsculas del ID de sala de Matrix
al configurar destinos de entrega explícitos, trabajos cron, vinculaciones o listas de permitidos.
OpenClaw mantiene canónicas las claves internas de sesión para el almacenamiento, por lo que esas claves en minúsculas
no son una fuente fiable para los ID de entrega de Matrix.

La búsqueda en el directorio en vivo usa la cuenta de Matrix que ha iniciado sesión:

- Las búsquedas de usuarios consultan el directorio de usuarios de Matrix en ese homeserver.
- Las búsquedas de salas aceptan directamente ID de sala y alias explícitos, y luego recurren a buscar nombres de salas unidas para esa cuenta.
- La búsqueda por nombre de sala unida es de mejor esfuerzo. Si un nombre de sala no puede resolverse a un ID o alias, la resolución de listas de permitidos en tiempo de ejecución lo ignora.

## Referencia de configuración

Los campos de estilo lista de permitidos (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) aceptan ID de usuario de Matrix completos (lo más seguro). Las coincidencias exactas de directorio se resuelven al inicio y cada vez que cambia la lista de permitidos mientras el monitor está en ejecución; las entradas que no se pueden resolver se ignoran en tiempo de ejecución. Las listas de permitidos de salas prefieren ID de sala o alias por el mismo motivo.

### Cuenta y conexión

- `enabled`: activa o desactiva el canal.
- `name`: etiqueta de visualización opcional para la cuenta.
- `defaultAccount`: ID de cuenta preferida cuando hay varias cuentas Matrix configuradas.
- `accounts`: sobrescrituras con nombre por cuenta. Los valores de nivel superior de `channels.matrix` se heredan como valores predeterminados.
- `homeserver`: URL del servidor de origen, por ejemplo `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta cuenta se conecte a `localhost`, IPs de LAN/Tailscale o nombres de host internos.
- `proxy`: URL de proxy HTTP(S) opcional para el tráfico de Matrix. Se admite sobrescritura por cuenta.
- `userId`: ID de usuario Matrix completo (`@bot:example.org`).
- `accessToken`: token de acceso para autenticación basada en token. Se admiten valores en texto plano y SecretRef en proveedores env/file/exec ([Gestión de secretos](/es/gateway/secrets)).
- `password`: contraseña para inicio de sesión basado en contraseña. Se admiten valores en texto plano y SecretRef.
- `deviceId`: ID explícito del dispositivo Matrix.
- `deviceName`: nombre de visualización del dispositivo usado durante el inicio de sesión con contraseña.
- `avatarUrl`: URL del avatar propio almacenada para sincronización de perfil y actualizaciones de `profile set`.
- `initialSyncLimit`: número máximo de eventos obtenidos durante la sincronización de arranque.

### Cifrado

- `encryption`: activa E2EE. Valor predeterminado: `false`.
- `startupVerification`: `"if-unverified"` (predeterminado cuando E2EE está activado) o `"off"`. Solicita automáticamente la verificación propia al arrancar cuando este dispositivo no está verificado.
- `startupVerificationCooldownHours`: periodo de espera antes de la siguiente solicitud automática de arranque. Valor predeterminado: `24`.

### Acceso y política

- `groupPolicy`: `"open"`, `"allowlist"` o `"disabled"`. Valor predeterminado: `"allowlist"`.
- `groupAllowFrom`: lista de permitidos de IDs de usuario para tráfico de sala.
- `dm.enabled`: cuando es `false`, ignora todos los DM. Valor predeterminado: `true`.
- `dm.policy`: `"pairing"` (predeterminado), `"allowlist"`, `"open"` o `"disabled"`. Se aplica después de que el bot se ha unido y ha clasificado la sala como DM; no afecta la gestión de invitaciones.
- `dm.allowFrom`: lista de permitidos de IDs de usuario para tráfico de DM.
- `dm.sessionScope`: `"per-user"` (predeterminado) o `"per-room"`.
- `dm.threadReplies`: sobrescritura solo para DM de las respuestas en hilos (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: acepta mensajes de otras cuentas de bot Matrix configuradas (`true` o `"mentions"`).
- `allowlistOnly`: cuando es `true`, fuerza todas las políticas de DM activas (excepto `"disabled"`) y las políticas de grupo `"open"` a `"allowlist"`. No cambia las políticas `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"` u `"off"`. Valor predeterminado: `"off"`. Se aplica a todas las invitaciones de Matrix, incluidas las invitaciones de estilo DM.
- `autoJoinAllowlist`: salas/alias permitidos cuando `autoJoin` es `"allowlist"`. Las entradas de alias se resuelven contra el servidor de origen, no contra el estado reclamado por la sala invitada.
- `contextVisibility`: visibilidad de contexto suplementario (`"all"` predeterminado, `"allowlist"`, `"allowlist_quote"`).

### Comportamiento de respuesta

- `replyToMode`: `"off"`, `"first"`, `"all"` o `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` o `"always"`.
- `threadBindings`: sobrescrituras por canal para el enrutamiento y ciclo de vida de sesiones vinculadas a hilos.
- `streaming`: `"off"` (predeterminado), `"partial"`, `"quiet"` o forma de objeto `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: cuando es `true`, los bloques completados del asistente se conservan como mensajes de progreso separados.
- `markdown`: configuración opcional de renderizado Markdown para texto saliente.
- `responsePrefix`: cadena opcional antepuesta a las respuestas salientes.
- `textChunkLimit`: tamaño de fragmento saliente en caracteres cuando `chunkMode: "length"`. Valor predeterminado: `4000`.
- `chunkMode`: `"length"` (predeterminado, divide por número de caracteres) o `"newline"` (divide en límites de línea).
- `historyLimit`: número de mensajes recientes de la sala incluidos como `InboundHistory` cuando un mensaje de sala activa el agente. Recurre a `messages.groupChat.historyLimit`; valor predeterminado efectivo `0` (desactivado).
- `mediaMaxMb`: límite de tamaño de medios en MB para envíos salientes y procesamiento entrante.

### Ajustes de reacciones

- `ackReaction`: sobrescritura de reacción de confirmación para este canal/cuenta.
- `ackReactionScope`: sobrescritura de alcance (`"group-mentions"` predeterminado, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modo de notificación de reacción entrante (`"own"` predeterminado, `"off"`).

### Herramientas y sobrescrituras por sala

- `actions`: control de acceso a herramientas por acción (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa de políticas por sala. La identidad de sesión usa el ID estable de la sala después de la resolución. (`rooms` es un alias heredado.)
  - `groups.<room>.account`: restringe una entrada heredada de sala a una cuenta específica.
  - `groups.<room>.allowBots`: sobrescritura por sala del ajuste a nivel de canal (`true` o `"mentions"`).
  - `groups.<room>.users`: lista de permitidos de remitentes por sala.
  - `groups.<room>.tools`: sobrescrituras por sala para permitir/denegar herramientas.
  - `groups.<room>.autoReply`: sobrescritura por sala del control por menciones. `true` desactiva los requisitos de mención para esa sala; `false` los vuelve a activar.
  - `groups.<room>.skills`: filtro de Skills por sala.
  - `groups.<room>.systemPrompt`: fragmento de prompt del sistema por sala.

### Ajustes de aprobación de exec

- `execApprovals.enabled`: entrega aprobaciones de exec mediante prompts nativos de Matrix.
- `execApprovals.approvers`: IDs de usuario Matrix autorizados para aprobar. Recurre a `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (predeterminado), `"channel"` o `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: listas de permitidos opcionales de agente/sesión para la entrega.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales admitidos
- [Emparejamiento](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat de grupo y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
