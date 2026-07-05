---
read_when:
    - Actualización de una instalación existente de Matrix
    - Migración del historial cifrado de Matrix y del estado del dispositivo
summary: Cómo OpenClaw actualiza el Plugin de Matrix anterior in situ, incluidos los límites de recuperación de estado cifrado y los pasos de recuperación manual.
title: Migración de Matrix
x-i18n:
    generated_at: "2026-07-05T11:02:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6607045ac7760dc9d1ecdb1dd3d3885a7213d4e6f45eb32fd9a47c76f178c8c
    source_path: channels/matrix-migration.md
    workflow: 16
---

Actualiza desde el `matrix` Plugin público anterior a la implementación actual.

Para la mayoría de los usuarios, la actualización se realiza en el lugar:

- el Plugin sigue siendo `@openclaw/matrix`
- el canal sigue siendo `matrix`
- tu configuración sigue estando en `channels.matrix`
- las credenciales en caché siguen estando en `~/.openclaw/credentials/matrix/`
- el estado en tiempo de ejecución sigue estando en `~/.openclaw/matrix/`

No necesitas cambiar el nombre de las claves de configuración ni reinstalar el Plugin con un nombre nuevo.
El paquete raíz `openclaw` ya no incluye código de tiempo de ejecución de Matrix ni dependencias del SDK de Matrix. Si `openclaw channels status` muestra que Matrix está configurado pero el Plugin no está instalado, ejecuta `openclaw doctor --fix` o `openclaw plugins install @openclaw/matrix`; no instales paquetes del SDK de Matrix en el paquete raíz de OpenClaw.

## Qué hace automáticamente la migración

La migración de Matrix se ejecuta cuando se inicia el Gateway (a través del Plugin de Matrix cargado), cuando ejecutas [`openclaw doctor --fix`](/es/gateway/doctor) y como alternativa cuando se inicia el cliente de Matrix y todavía encuentra estado antiguo en disco. Antes de que cualquier paso de migración accionable modifique el estado en disco, OpenClaw crea o reutiliza una instantánea de recuperación enfocada.

Cuando usas `openclaw update`, el disparador exacto depende de cómo esté instalado OpenClaw:

- las instalaciones desde código fuente ejecutan una pasada no interactiva de `openclaw doctor --fix` durante el flujo de actualización y luego reinician el Gateway de forma predeterminada
- las instalaciones mediante gestor de paquetes actualizan el paquete, ejecutan `openclaw doctor --non-interactive --fix` y luego dependen del reinicio predeterminado del Gateway para que el inicio pueda terminar la migración de Matrix
- si usas `openclaw update --no-restart`, la migración de Matrix respaldada por el inicio se aplaza hasta que más tarde ejecutes `openclaw doctor --fix` y reinicies el Gateway

La migración automática cubre:

- crear o reutilizar una instantánea previa a la migración en `~/Backups/openclaw-migrations/`
- reutilizar tus credenciales de Matrix en caché
- mantener la misma selección de cuenta y la configuración `channels.matrix`
- mover el antiguo almacén plano de sincronización de Matrix y el almacén de cifrado a la ubicación actual con ámbito de cuenta cuando la cuenta de destino puede resolverse de forma segura
- importar estado complementario basado en archivos (caché de sincronización `bot-storage.json`, `recovery-key.json`, `legacy-crypto-migration.json`, instantáneas de IndexedDB) al estado SQLite de Matrix; los archivos migrados se archivan con el sufijo `.migrated`
- extraer una clave de descifrado de copia de seguridad de claves de sala de Matrix guardada previamente desde el antiguo almacén de cifrado de rust, cuando esa clave existe localmente
- reutilizar la raíz de almacenamiento de hash de token existente más completa para la misma cuenta de Matrix, homeserver, usuario y dispositivo cuando el token de acceso cambia más tarde
- escanear raíces de almacenamiento de hash de token hermanas en busca de metadatos pendientes de restauración de estado cifrado cuando el token de acceso de Matrix cambió pero la identidad de la cuenta/dispositivo siguió siendo la misma
- restaurar claves de sala respaldadas en el nuevo almacén de cifrado en el siguiente inicio de Matrix

Detalles de la instantánea:

- OpenClaw escribe un archivo marcador en `~/.openclaw/matrix/migration-snapshot.json` después de una instantánea correcta para que los inicios y pasadas de reparación posteriores puedan reutilizar el mismo archivo.
- Estas instantáneas automáticas de migración de Matrix solo respaldan configuración + estado (`includeWorkspace: false`).
- Si Matrix solo tiene estado de migración de solo advertencia, por ejemplo porque `userId` o `accessToken` todavía faltan, OpenClaw aún no crea la instantánea porque no hay ninguna mutación accionable de Matrix.
- Si el paso de instantánea falla, OpenClaw omite la migración de Matrix para esa ejecución en lugar de modificar estado sin un punto de recuperación.

Acerca de las actualizaciones con varias cuentas:

- el almacén plano de Matrix (`~/.openclaw/matrix/bot-storage.json` y `~/.openclaw/matrix/crypto/`) provenía de un diseño de almacén único, por lo que OpenClaw solo puede migrarlo a un destino de cuenta de Matrix resuelto
- los almacenes heredados de Matrix que ya tienen ámbito de cuenta se detectan y preparan por cada cuenta de Matrix configurada

## Qué no puede hacer automáticamente la migración

El Plugin público anterior de Matrix **no** creaba automáticamente copias de seguridad de claves de sala de Matrix. Persistía el estado de cifrado local y solicitaba verificación de dispositivo, pero no garantizaba que tus claves de sala se respaldaran en el homeserver.

Eso significa que algunas instalaciones cifradas solo pueden migrarse parcialmente.

OpenClaw no puede recuperar automáticamente:

- claves de sala solo locales que nunca se respaldaron
- estado cifrado cuando la cuenta de Matrix de destino todavía no puede resolverse porque `homeserver`, `userId` o `accessToken` aún no están disponibles
- estado cifrado cuando el antiguo almacén de cifrado no tiene ningún ID de dispositivo registrado para la cuenta
- migración automática de un almacén plano compartido de Matrix cuando hay varias cuentas de Matrix configuradas pero `channels.matrix.defaultAccount` no está definido
- instalaciones con ruta de Plugin personalizada fijadas a una ruta de repositorio en lugar del paquete estándar de Matrix (detectado por `openclaw doctor`)
- una clave de recuperación ausente cuando el almacén antiguo tenía claves respaldadas pero no conservó la clave de descifrado localmente

Si tu instalación antigua tenía historial cifrado solo local que nunca se respaldó, algunos mensajes cifrados antiguos pueden seguir siendo ilegibles después de la actualización.

## Flujo de actualización recomendado

1. Actualiza OpenClaw y el Plugin de Matrix normalmente.
   Prefiere `openclaw update` simple sin `--no-restart` para que el inicio pueda terminar la migración de Matrix de inmediato.
2. Ejecuta:

   ```bash
   openclaw doctor --fix
   ```

   Si Matrix tiene trabajo de migración accionable, doctor creará o reutilizará primero la instantánea previa a la migración e imprimirá la ruta del archivo.

3. Inicia o reinicia el Gateway.
4. Comprueba el estado actual de verificación y copia de seguridad:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Coloca la clave de recuperación de la cuenta de Matrix que estás reparando en una variable de entorno específica de la cuenta. Para una sola cuenta predeterminada, `MATRIX_RECOVERY_KEY` está bien. Para varias cuentas, usa una variable por cuenta, por ejemplo `MATRIX_RECOVERY_KEY_ASSISTANT`, y añade `--account assistant` al comando.

6. Si OpenClaw te indica que se necesita una clave de recuperación, ejecuta el comando para la cuenta correspondiente:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Si este dispositivo sigue sin verificar, ejecuta el comando para la cuenta correspondiente:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Si se acepta la clave de recuperación y la copia de seguridad es utilizable, pero `Cross-signing verified`
   sigue siendo `no`, completa la autoverificación desde otro cliente de Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Acepta la solicitud en otro cliente de Matrix, compara los emoji o decimales,
   y escribe `yes` solo cuando coincidan. El comando espera la confianza completa
   en la identidad de Matrix antes de informar que se completó correctamente.

8. Si estás abandonando intencionalmente historial antiguo irrecuperable y quieres una línea base de copia de seguridad nueva para mensajes futuros, ejecuta:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   Añade `--rotate-recovery-key` solo cuando la clave de recuperación antigua deba dejar de desbloquear la copia de seguridad nueva.

9. Si aún no existe una copia de seguridad de claves del lado del servidor, crea una para recuperaciones futuras:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Cómo funciona la migración cifrada

La migración cifrada es un proceso de dos etapas:

1. El inicio o `openclaw doctor --fix` crea o reutiliza la instantánea previa a la migración si la migración cifrada es accionable y luego inspecciona el antiguo almacén de cifrado rust de Matrix mediante el inspector de cifrado incluido con el Plugin de Matrix.
2. Si se encuentra una clave de descifrado de copia de seguridad, OpenClaw la importa al estado SQLite de Matrix y marca la restauración de claves de sala como pendiente.
3. En el siguiente inicio de Matrix, OpenClaw restaura automáticamente las claves de sala respaldadas en el nuevo almacén de cifrado. El estado de restauración pendiente también se recoge desde raíces de almacenamiento de hash de token hermanas cuando el token de acceso rotó entre medias.

Si el almacén antiguo informa claves de sala que nunca se respaldaron, OpenClaw advierte en lugar de fingir que la recuperación se completó correctamente.

## Mensajes comunes y qué significan

### Mensajes de actualización y detección

`Matrix plugin upgraded in place.` (doctor) o `matrix: plugin upgraded in place for account "..."` (inicio)

- Significado: se detectó el estado de Matrix antiguo en disco y se migró al diseño actual.
- Qué hacer: nada, a menos que la misma salida también incluya advertencias.

`Matrix migration snapshot created before applying Matrix upgrades.` / `Matrix migration snapshot reused before applying Matrix upgrades.`

- Significado: doctor creó un archivo de recuperación antes de modificar el estado de Matrix, o encontró un marcador de instantánea existente y reutilizó ese archivo en lugar de crear una copia de seguridad duplicada. El inicio registra lo mismo que `matrix: created pre-migration backup snapshot: ...` / `matrix: reusing existing pre-migration backup snapshot: ...`.
- Qué hacer: conserva la ruta del archivo impresa hasta confirmar que la migración se completó correctamente.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Significado: existe estado antiguo de Matrix, pero OpenClaw no puede mapearlo a una cuenta de Matrix actual porque Matrix no está configurado.
- Qué hacer: configura `channels.matrix` y luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significado: OpenClaw encontró estado antiguo, pero todavía no puede determinar la raíz exacta de cuenta/dispositivo actual.
- Qué hacer: inicia el Gateway una vez con un inicio de sesión de Matrix funcional, o vuelve a ejecutar `openclaw doctor --fix` después de que existan credenciales en caché.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significado: OpenClaw encontró un almacén plano compartido de Matrix, pero se niega a adivinar qué cuenta de Matrix con nombre debe recibirlo.
- Qué hacer: define `channels.matrix.defaultAccount` como la cuenta prevista y luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el Gateway.

Las mismas tres advertencias también aparecen con el prefijo `Legacy Matrix encrypted state detected at ...` cuando el almacén bloqueado es el antiguo almacén de cifrado.

`Matrix legacy sync store not migrated because the target already exists (...)` / `Matrix legacy crypto store not migrated because the target already exists (...)`

- Significado: la nueva ubicación con ámbito de cuenta ya tiene un almacén de sincronización o cifrado, por lo que OpenClaw no lo sobrescribió automáticamente.
- Qué hacer: verifica que la cuenta actual sea la correcta antes de eliminar o mover manualmente el destino en conflicto.

`Failed migrating Matrix legacy sync store (...)` o `Failed migrating Matrix legacy crypto store (...)`

- Significado: OpenClaw intentó mover estado antiguo de Matrix, pero la operación del sistema de archivos falló.
- Qué hacer: inspecciona los permisos del sistema de archivos y el estado del disco, y luego vuelve a ejecutar `openclaw doctor --fix`.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Significado: OpenClaw detectó estado antiguo de Matrix, pero la migración sigue bloqueada por falta de datos de identidad o credenciales. El inicio registra esto como `matrix: migration remains in a warning-only state; no pre-migration snapshot was needed yet`.
- Qué hacer: completa el inicio de sesión de Matrix o la configuración, y luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix crypto inspector is unavailable.`

- Significado: OpenClaw encontró estado cifrado antiguo de Matrix, pero a la compilación del Plugin de Matrix le falta el módulo inspector de cifrado que inspecciona el antiguo almacén de cifrado rust.
- Qué hacer: reinstala o repara el Plugin de Matrix (`openclaw plugins install @openclaw/matrix`, o `openclaw plugins install ./path/to/local/matrix-plugin` para un checkout de repositorio), y luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el Gateway.

`- Error al crear una instantánea de migración de Matrix antes de la reparación: ...`

`- Se omiten los cambios de migración de Matrix por ahora. Resuelve el fallo de la instantánea y vuelve a ejecutar "openclaw doctor --fix".`

- Significado: OpenClaw se negó a modificar el estado de Matrix porque primero no pudo crear la instantánea de recuperación.
- Qué hacer: resuelve el error de copia de seguridad y luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`Error al migrar el almacenamiento heredado del cliente Matrix: ...`

- Significado: el fallback del lado del cliente de Matrix encontró almacenamiento antiguo, pero la migración falló. OpenClaw revierte los movimientos completados y aborta ese fallback en lugar de iniciar silenciosamente con un almacén nuevo. Este error también aparece cuando el almacén plano apunta a una cuenta distinta de la que se está iniciando actualmente.
- Qué hacer: inspecciona los permisos o conflictos del sistema de archivos, conserva intacto el estado antiguo y reintenta después de corregir el error.

`Matrix está instalado desde una ruta personalizada: ...`

- Significado: Matrix está fijado a una instalación por ruta, por lo que las actualizaciones principales no lo reemplazan automáticamente por el paquete Matrix predeterminado.
- Qué hacer: reinstala con `openclaw plugins install @openclaw/matrix` cuando quieras volver al plugin Matrix predeterminado.

### Mensajes de recuperación de estado cifrado

`matrix: se restauraron X/Y clave(s) de sala desde la copia de seguridad heredada de estado cifrado`

- Significado: las claves de sala respaldadas se restauraron correctamente en el nuevo almacén criptográfico.
- Qué hacer: normalmente nada.

`matrix: N clave(s) de sala heredadas solo locales nunca se respaldaron y no pudieron restaurarse automáticamente`

- Significado: algunas claves de sala antiguas existían solo en el almacén local antiguo y nunca se habían subido a la copia de seguridad de Matrix. Durante la preparación, el mismo límite se informa como `Legacy Matrix encrypted state for account "..." contains N room key(s) that were never backed up.`
- Qué hacer: espera que parte del historial cifrado antiguo permanezca no disponible, salvo que puedas recuperar esas claves manualmente desde otro cliente verificado.

`Estado cifrado heredado de Matrix detectado en ... pero no se encontró ningún ID de dispositivo para la cuenta "..."`

- Significado: el almacén criptográfico antiguo no registra a qué dispositivo Matrix pertenecía, por lo que OpenClaw no puede inspeccionarlo de forma segura.
- Qué hacer: el historial cifrado antiguo no puede recuperarse automáticamente; OpenClaw continúa sin él.

`El estado cifrado heredado de Matrix para la cuenta "..." tiene claves de sala respaldadas, pero no se encontró ninguna clave local de descifrado de copia de seguridad. Pide al operador que ejecute "openclaw matrix verify backup restore --recovery-key <key>" después de la actualización si tiene la clave de recuperación.`

- Significado: la copia de seguridad existe, pero OpenClaw no pudo recuperar automáticamente la clave de recuperación.
- Qué hacer: ejecuta `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` (preferible a pasar la clave como argumento).

`Error al inspeccionar el estado cifrado heredado de Matrix para la cuenta "..." (...): ...`

- Significado: OpenClaw encontró el almacén cifrado antiguo, pero no pudo inspeccionarlo con suficiente seguridad para preparar la recuperación.
- Qué hacer: vuelve a ejecutar `openclaw doctor --fix`. Si se repite, conserva intacto el directorio de estado antiguo y recupera usando otro cliente Matrix verificado junto con `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Se encontró una clave de copia de seguridad heredada de Matrix para la cuenta "...", pero el estado SQLite de Matrix ya contiene una clave de recuperación distinta. Se deja sin cambios el estado existente.`

- Significado: OpenClaw detectó un conflicto de clave de copia de seguridad y se negó a sobrescribir automáticamente el estado actual de la clave de recuperación.
- Qué hacer: verifica qué clave de recuperación es la correcta antes de reintentar cualquier comando de restauración.

`El estado cifrado heredado de Matrix para la cuenta "..." no se puede convertir por completo automáticamente porque el antiguo almacén criptográfico de rust no expone todas las claves de sala locales para exportación.`

- Significado: este es el límite estricto del formato de almacenamiento antiguo.
- Qué hacer: las claves respaldadas aún pueden restaurarse, pero el historial cifrado solo local puede permanecer no disponible.

`matrix: error al restaurar claves de sala desde la copia de seguridad heredada de estado cifrado: ...`

- Significado: el nuevo plugin intentó restaurar, pero Matrix devolvió un error.
- Qué hacer: ejecuta `openclaw matrix verify backup status` y luego reintenta con `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` si es necesario.

### Mensajes de recuperación manual

`openclaw matrix verify status` y `openclaw matrix verify backup status` imprimen una línea `Backup issue:` junto con una guía `Next steps:` cuando la copia de seguridad de claves de sala no está sana en este dispositivo:

| Problema de copia de seguridad                                      | Significado                                                        | Corrección                                                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                       | no hay nada desde lo que restaurar                                 | `openclaw matrix verify bootstrap` para crear una copia de seguridad de claves de sala                                                  |
| `backup decryption key is not loaded on this device`                | la clave existe, pero no está activa aquí                          | `openclaw matrix verify backup restore`; si aún no puede cargar la clave, pasa la clave de recuperación por pipe mediante `--recovery-key-stdin` |
| `backup decryption key could not be loaded from secret storage (...)` | la carga desde el almacenamiento secreto falló o no es compatible  | pasa la clave de recuperación por pipe: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin` |
| `backup key mismatch (...)`                                         | la clave almacenada no coincide con la copia de seguridad activa del servidor | vuelve a ejecutar `verify backup restore --recovery-key-stdin` con la clave activa de copia de seguridad del servidor, o `verify backup reset --yes` para una línea base nueva |
| `backup signature chain is not trusted by this device`              | el dispositivo aún no confía en la cadena de firma cruzada         | `verify device --recovery-key-stdin`, luego `verify self` desde otro cliente verificado si la confianza sigue incompleta                |
| `backup exists but is not active on this device`                    | la copia de seguridad del servidor está presente, la sesión local está inactiva | verifica primero el dispositivo y luego vuelve a comprobar con `openclaw matrix verify backup status`                                  |
| `backup trust state could not be fully determined`                  | los diagnósticos no fueron concluyentes                            | `openclaw matrix verify status --verbose`                                                                                              |

Otros errores de recuperación:

`Se requiere la clave de recuperación de Matrix`

- Significado: intentaste un paso de recuperación sin proporcionar una clave de recuperación cuando era obligatoria.
- Qué hacer: vuelve a ejecutar el comando con `--recovery-key-stdin`, por ejemplo `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Clave de recuperación de Matrix no válida: ...`

- Significado: la clave proporcionada no se pudo analizar o no coincidía con el formato esperado.
- Qué hacer: reintenta con la clave de recuperación exacta de tu cliente Matrix o de la exportación de la clave de recuperación.

`Se aplicó la clave de recuperación de Matrix, pero este dispositivo aún no tiene confianza completa de identidad de Matrix.`

- Significado: la clave de recuperación desbloqueó material de copia de seguridad utilizable, pero Matrix no ha establecido confianza completa de identidad con firma cruzada para este dispositivo. Revisa la salida del comando para `Recovery key accepted`, `Backup usable`, `Cross-signing verified` y `Device verified by owner`.
- Qué hacer: ejecuta `openclaw matrix verify self`, acepta la solicitud en otro cliente Matrix, compara el SAS y escribe `yes` solo cuando coincida. Usa `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` solo cuando quieras reemplazar intencionalmente la identidad actual de firma cruzada.

Si aceptas perder el historial cifrado antiguo irrecuperable, puedes restablecer en su lugar la
línea base de copia de seguridad actual con `openclaw matrix verify backup reset --yes`. Cuando el
secreto de copia de seguridad almacenado está roto, ese restablecimiento también repara el almacenamiento secreto para que la
nueva clave de copia de seguridad pueda cargarse correctamente después de reiniciar.

### Mensajes de instalación de plugin personalizado

`Matrix está instalado desde una ruta personalizada que ya no existe: ...`

- Significado: tu registro de instalación del plugin apunta a una ruta local que ya no existe.
- Qué hacer: reinstala con `openclaw plugins install @openclaw/matrix`, o si estás ejecutando desde un checkout del repositorio, `openclaw plugins install ./path/to/local/matrix-plugin`. `openclaw doctor --fix` también puede eliminar por ti las referencias obsoletas al plugin Matrix.

## Si el historial cifrado aún no vuelve

Ejecuta estas comprobaciones en orden:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Si la copia de seguridad se restaura correctamente pero a algunas salas antiguas aún les falta historial, probablemente esas claves faltantes nunca fueron respaldadas por el plugin anterior.

## Si quieres empezar de cero para futuros mensajes

Si aceptas perder el historial cifrado antiguo irrecuperable y solo quieres una línea base de copia de seguridad limpia de aquí en adelante, ejecuta estos comandos en orden:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Si el dispositivo sigue sin verificar después de eso, termina la verificación desde tu cliente Matrix comparando los emoji SAS o los códigos decimales y confirmando que coinciden.

## Relacionado

- [Matrix](/es/channels/matrix): configuración y ajustes del canal.
- [Reglas push de Matrix](/es/channels/matrix-push-rules): enrutamiento de notificaciones.
- [Doctor](/es/gateway/doctor): comprobación de estado y activador de migración automática.
- [Guía de migración](/es/install/migrating): todas las rutas de migración (traslados de máquina, importaciones entre sistemas).
- [Plugins](/es/tools/plugin): instalación y registro de plugins.
