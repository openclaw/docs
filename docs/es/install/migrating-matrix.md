---
read_when:
    - Actualización de una instalación existente de Matrix
    - Migración del historial cifrado y del estado del dispositivo de Matrix
summary: Cómo OpenClaw actualiza el plugin anterior de Matrix en el mismo lugar, incluidos los límites de recuperación del estado cifrado y los pasos de recuperación manual.
title: Migración de Matrix
x-i18n:
    generated_at: "2026-04-26T11:32:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd046436126e6b76b398fb3798b068547ff80769bc9e0e8486908ba22b5f11
    source_path: install/migrating-matrix.md
    workflow: 15
---

Esta página cubre las actualizaciones desde el anterior plugin público `matrix` hasta la implementación actual.

Para la mayoría de los usuarios, la actualización se hace en el mismo lugar:

- el plugin sigue siendo `@openclaw/matrix`
- el canal sigue siendo `matrix`
- tu configuración sigue estando bajo `channels.matrix`
- las credenciales en caché siguen en `~/.openclaw/credentials/matrix/`
- el estado de runtime sigue en `~/.openclaw/matrix/`

No necesitas renombrar claves de configuración ni reinstalar el plugin con un nombre nuevo.

## Qué hace la migración automáticamente

Cuando el gateway se inicia y cuando ejecutas [`openclaw doctor --fix`](/es/gateway/doctor), OpenClaw intenta reparar automáticamente el estado antiguo de Matrix.
Antes de que cualquier paso accionable de migración de Matrix modifique el estado en disco, OpenClaw crea o reutiliza una instantánea de recuperación focalizada.

Cuando usas `openclaw update`, el desencadenante exacto depende de cómo esté instalado OpenClaw:

- las instalaciones desde código fuente ejecutan `openclaw doctor --fix` durante el flujo de actualización y luego reinician el gateway de forma predeterminada
- las instalaciones mediante gestor de paquetes actualizan el paquete, ejecutan una pasada no interactiva de `doctor` y luego dependen del reinicio predeterminado del gateway para que el inicio pueda completar la migración de Matrix
- si usas `openclaw update --no-restart`, la migración de Matrix respaldada por el inicio se aplaza hasta que más tarde ejecutes `openclaw doctor --fix` y reinicies el gateway

La migración automática cubre:

- crear o reutilizar una instantánea previa a la migración en `~/Backups/openclaw-migrations/`
- reutilizar tus credenciales de Matrix en caché
- mantener la misma selección de cuenta y la misma configuración `channels.matrix`
- mover el almacén plano de sincronización de Matrix más antiguo a la ubicación actual con alcance por cuenta
- mover el almacén criptográfico plano de Matrix más antiguo a la ubicación actual con alcance por cuenta cuando la cuenta de destino puede resolverse de forma segura
- extraer una clave de descifrado de copia de seguridad de claves de sala de Matrix previamente guardada desde el antiguo almacén criptográfico rust, cuando esa clave existe localmente
- reutilizar la raíz de almacenamiento con hash de token existente más completa para la misma cuenta de Matrix, homeserver y usuario cuando el token de acceso cambie más adelante
- escanear raíces hermanas de almacenamiento con hash de token en busca de metadatos pendientes de restauración de estado cifrado cuando el token de acceso de Matrix cambió pero la identidad de la cuenta/dispositivo siguió siendo la misma
- restaurar las claves de sala con copia de seguridad en el nuevo almacén criptográfico en el siguiente inicio de Matrix

Detalles de la instantánea:

- OpenClaw escribe un archivo marcador en `~/.openclaw/matrix/migration-snapshot.json` después de una instantánea correcta para que los pasos posteriores de inicio y reparación puedan reutilizar el mismo archivo.
- Estas instantáneas automáticas de migración de Matrix hacen copia de seguridad solo de configuración + estado (`includeWorkspace: false`).
- Si Matrix solo tiene un estado de migración de advertencia, por ejemplo porque aún faltan `userId` o `accessToken`, OpenClaw no crea todavía la instantánea porque no hay ninguna mutación de Matrix accionable.
- Si el paso de instantánea falla, OpenClaw omite la migración de Matrix en esa ejecución en lugar de modificar el estado sin un punto de recuperación.

Sobre las actualizaciones de varias cuentas:

- el almacén plano más antiguo de Matrix (`~/.openclaw/matrix/bot-storage.json` y `~/.openclaw/matrix/crypto/`) procedía de un diseño de almacén único, por lo que OpenClaw solo puede migrarlo a un único destino de cuenta Matrix resuelto
- los almacenes heredados de Matrix ya con alcance por cuenta se detectan y preparan por cada cuenta Matrix configurada

## Qué no puede hacer la migración automáticamente

El anterior plugin público de Matrix **no** creaba automáticamente copias de seguridad de claves de sala de Matrix. Persistía el estado criptográfico local y solicitaba verificación del dispositivo, pero no garantizaba que tus claves de sala estuvieran respaldadas en el homeserver.

Eso significa que algunas instalaciones cifradas solo pueden migrarse parcialmente.

OpenClaw no puede recuperar automáticamente:

- claves de sala solo locales que nunca se respaldaron
- estado cifrado cuando la cuenta Matrix de destino aún no puede resolverse porque `homeserver`, `userId` o `accessToken` todavía no están disponibles
- migración automática de un almacén plano compartido de Matrix cuando hay varias cuentas Matrix configuradas pero `channels.matrix.defaultAccount` no está definido
- instalaciones de plugins en rutas personalizadas que están fijadas a una ruta de repositorio en lugar del paquete estándar de Matrix
- una clave de recuperación ausente cuando el almacén antiguo tenía claves respaldadas pero no conservó localmente la clave de descifrado

Alcance actual de advertencias:

- las instalaciones del plugin Matrix en rutas personalizadas se muestran tanto en el inicio del gateway como en `openclaw doctor`

Si tu instalación anterior tenía historial cifrado solo local que nunca se respaldó, algunos mensajes cifrados antiguos pueden seguir siendo ilegibles después de la actualización.

## Flujo de actualización recomendado

1. Actualiza OpenClaw y el plugin Matrix de la forma habitual.
   Prefiere `openclaw update` sin `--no-restart` para que el inicio pueda completar inmediatamente la migración de Matrix.
2. Ejecuta:

   ```bash
   openclaw doctor --fix
   ```

   Si Matrix tiene trabajo de migración accionable, `doctor` creará o reutilizará primero la instantánea previa a la migración e imprimirá la ruta del archivo.

3. Inicia o reinicia el gateway.
4. Comprueba el estado actual de verificación y copia de seguridad:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Pon la clave de recuperación de la cuenta Matrix que estás reparando en una variable de entorno específica de la cuenta. Para una única cuenta predeterminada, `MATRIX_RECOVERY_KEY` es suficiente. Para varias cuentas, usa una variable por cuenta, por ejemplo `MATRIX_RECOVERY_KEY_ASSISTANT`, y añade `--account assistant` al comando.

6. Si OpenClaw te dice que se necesita una clave de recuperación, ejecuta el comando para la cuenta correspondiente:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Si este dispositivo sigue sin verificarse, ejecuta el comando para la cuenta correspondiente:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Si la clave de recuperación es aceptada y la copia de seguridad es utilizable, pero `Cross-signing verified`
   sigue siendo `no`, completa la autoverificación desde otro cliente de Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Acepta la solicitud en otro cliente de Matrix, compara los emoji o decimales
   y escribe `yes` solo cuando coincidan. El comando finaliza correctamente solo
   después de que `Cross-signing verified` pase a ser `yes`.

8. Si vas a abandonar intencionadamente historial antiguo irrecuperable y quieres una nueva base de copia de seguridad para mensajes futuros, ejecuta:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Si todavía no existe una copia de seguridad de claves del lado del servidor, crea una para futuras recuperaciones:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Cómo funciona la migración cifrada

La migración cifrada es un proceso de dos etapas:

1. El inicio o `openclaw doctor --fix` crea o reutiliza la instantánea previa a la migración si la migración cifrada es accionable.
2. El inicio o `openclaw doctor --fix` inspecciona el antiguo almacén criptográfico de Matrix a través de la instalación activa del plugin Matrix.
3. Si se encuentra una clave de descifrado de copia de seguridad, OpenClaw la escribe en el nuevo flujo de clave de recuperación y marca la restauración de claves de sala como pendiente.
4. En el siguiente inicio de Matrix, OpenClaw restaura automáticamente las claves de sala respaldadas en el nuevo almacén criptográfico.

Si el almacén antiguo informa de claves de sala que nunca se respaldaron, OpenClaw advierte en lugar de fingir que la recuperación tuvo éxito.

## Mensajes comunes y su significado

### Mensajes de actualización y detección

`Matrix plugin upgraded in place.`

- Significado: se detectó el antiguo estado de Matrix en disco y se migró al diseño actual.
- Qué hacer: nada, a menos que la misma salida también incluya advertencias.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Significado: OpenClaw creó un archivo de recuperación antes de modificar el estado de Matrix.
- Qué hacer: conserva la ruta del archivo impresa hasta confirmar que la migración tuvo éxito.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Significado: OpenClaw encontró un marcador existente de instantánea de migración de Matrix y reutilizó ese archivo en lugar de crear una copia de seguridad duplicada.
- Qué hacer: conserva la ruta del archivo impresa hasta confirmar que la migración tuvo éxito.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Significado: existe estado antiguo de Matrix, pero OpenClaw no puede asignarlo a una cuenta Matrix actual porque Matrix no está configurado.
- Qué hacer: configura `channels.matrix`, luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significado: OpenClaw encontró estado antiguo, pero todavía no puede determinar la raíz exacta actual de cuenta/dispositivo.
- Qué hacer: inicia el gateway una vez con un inicio de sesión Matrix funcional, o vuelve a ejecutar `openclaw doctor --fix` después de que existan credenciales en caché.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significado: OpenClaw encontró un único almacén plano compartido de Matrix, pero se niega a adivinar qué cuenta Matrix con nombre debe recibirlo.
- Qué hacer: establece `channels.matrix.defaultAccount` en la cuenta deseada y luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Significado: la ubicación nueva con alcance por cuenta ya tiene un almacén de sincronización o criptográfico, por lo que OpenClaw no lo sobrescribió automáticamente.
- Qué hacer: verifica que la cuenta actual sea la correcta antes de eliminar o mover manualmente el destino en conflicto.

`Failed migrating Matrix legacy sync store (...)` o `Failed migrating Matrix legacy crypto store (...)`

- Significado: OpenClaw intentó mover el estado antiguo de Matrix, pero la operación del sistema de archivos falló.
- Qué hacer: inspecciona los permisos del sistema de archivos y el estado del disco, y luego vuelve a ejecutar `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Significado: OpenClaw encontró un antiguo almacén cifrado de Matrix, pero no existe configuración actual de Matrix a la que asociarlo.
- Qué hacer: configura `channels.matrix`, luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significado: el almacén cifrado existe, pero OpenClaw no puede decidir de forma segura a qué cuenta/dispositivo actual pertenece.
- Qué hacer: inicia el gateway una vez con un inicio de sesión Matrix funcional, o vuelve a ejecutar `openclaw doctor --fix` después de que las credenciales en caché estén disponibles.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significado: OpenClaw encontró un único almacén criptográfico heredado plano compartido, pero se niega a adivinar qué cuenta Matrix con nombre debe recibirlo.
- Qué hacer: establece `channels.matrix.defaultAccount` en la cuenta deseada y luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Significado: OpenClaw detectó estado antiguo de Matrix, pero la migración sigue bloqueada por falta de datos de identidad o credenciales.
- Qué hacer: completa el inicio de sesión o la configuración de Matrix, y luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Significado: OpenClaw encontró estado cifrado antiguo de Matrix, pero no pudo cargar el punto de entrada auxiliar del plugin Matrix que normalmente inspecciona ese almacén.
- Qué hacer: reinstala o repara el plugin Matrix (`openclaw plugins install @openclaw/matrix`, o `openclaw plugins install ./path/to/local/matrix-plugin` para una copia del repositorio), luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Significado: OpenClaw encontró una ruta de archivo auxiliar que escapa de la raíz del plugin o no supera las comprobaciones de límites del plugin, por lo que se negó a importarla.
- Qué hacer: reinstala el plugin Matrix desde una ruta de confianza y luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Significado: OpenClaw se negó a modificar el estado de Matrix porque no pudo crear primero la instantánea de recuperación.
- Qué hacer: resuelve el error de copia de seguridad y luego vuelve a ejecutar `openclaw doctor --fix` o reinicia el gateway.

`Failed migrating legacy Matrix client storage: ...`

- Significado: el fallback del lado del cliente de Matrix encontró almacenamiento plano antiguo, pero el movimiento falló. OpenClaw ahora aborta ese fallback en lugar de iniciar silenciosamente con un almacén nuevo.
- Qué hacer: inspecciona permisos del sistema de archivos o conflictos, mantén intacto el estado antiguo e inténtalo de nuevo después de corregir el error.

`Matrix is installed from a custom path: ...`

- Significado: Matrix está fijado a una instalación por ruta, por lo que las actualizaciones principales no lo reemplazan automáticamente con el paquete Matrix estándar del repositorio.
- Qué hacer: reinstálalo con `openclaw plugins install @openclaw/matrix` cuando quieras volver al plugin Matrix predeterminado.

### Mensajes de recuperación de estado cifrado

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Significado: las claves de sala respaldadas se restauraron correctamente en el nuevo almacén criptográfico.
- Qué hacer: normalmente nada.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Significado: algunas claves de sala antiguas existían solo en el almacén local antiguo y nunca se habían subido a la copia de seguridad de Matrix.
- Qué hacer: espera que parte del historial cifrado antiguo siga sin estar disponible, a menos que puedas recuperar esas claves manualmente desde otro cliente verificado.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Significado: existe una copia de seguridad, pero OpenClaw no pudo recuperar automáticamente la clave de recuperación.
- Qué hacer: ejecuta `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Significado: OpenClaw encontró el antiguo almacén cifrado, pero no pudo inspeccionarlo con la seguridad suficiente para preparar la recuperación.
- Qué hacer: vuelve a ejecutar `openclaw doctor --fix`. Si se repite, conserva intacto el directorio del estado antiguo y recupéralo usando otro cliente Matrix verificado más `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Significado: OpenClaw detectó un conflicto de claves de copia de seguridad y se negó a sobrescribir automáticamente el archivo actual de clave de recuperación.
- Qué hacer: verifica qué clave de recuperación es la correcta antes de volver a intentar cualquier comando de restauración.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Significado: este es el límite rígido del antiguo formato de almacenamiento.
- Qué hacer: las claves respaldadas todavía se pueden restaurar, pero el historial cifrado solo local puede seguir sin estar disponible.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Significado: el nuevo plugin intentó restaurarlas, pero Matrix devolvió un error.
- Qué hacer: ejecuta `openclaw matrix verify backup status` y luego vuelve a intentarlo con `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` si es necesario.

### Mensajes de recuperación manual

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Significado: OpenClaw sabe que deberías tener una clave de copia de seguridad, pero no está activa en este dispositivo.
- Qué hacer: ejecuta `openclaw matrix verify backup restore`, o establece `MATRIX_RECOVERY_KEY` y ejecuta `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` si hace falta.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Significado: este dispositivo no tiene actualmente almacenada la clave de recuperación.
- Qué hacer: establece `MATRIX_RECOVERY_KEY`, ejecuta `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` y luego restaura la copia de seguridad.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Significado: la clave almacenada no coincide con la copia de seguridad activa de Matrix.
- Qué hacer: establece `MATRIX_RECOVERY_KEY` en la clave correcta y ejecuta `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Si aceptas perder historial cifrado antiguo irrecuperable, puedes en su lugar restablecer la
base actual de copia de seguridad con `openclaw matrix verify backup reset --yes`. Cuando el
secreto de copia de seguridad almacenado está roto, ese restablecimiento también puede recrear el almacenamiento secreto para que la
nueva clave de copia de seguridad pueda cargarse correctamente después del reinicio.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Significado: la copia de seguridad existe, pero este dispositivo todavía no confía con suficiente solidez en la cadena de cross-signing.
- Qué hacer: establece `MATRIX_RECOVERY_KEY` y ejecuta `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Significado: intentaste un paso de recuperación sin proporcionar una clave de recuperación cuando era necesaria.
- Qué hacer: vuelve a ejecutar el comando con `--recovery-key-stdin`, por ejemplo `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Significado: no se pudo analizar la clave proporcionada o no coincidía con el formato esperado.
- Qué hacer: vuelve a intentarlo con la clave de recuperación exacta de tu cliente Matrix o del archivo de clave de recuperación.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Significado: OpenClaw pudo aplicar la clave de recuperación, pero Matrix todavía no ha
  establecido confianza completa de identidad de cross-signing para este dispositivo. Revisa la
  salida del comando para `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` y `Device verified by owner`.
- Qué hacer: ejecuta `openclaw matrix verify self`, acepta la solicitud en otro
  cliente de Matrix, compara el SAS y escribe `yes` solo cuando coincida. El
  comando espera a que haya confianza completa de identidad de Matrix antes de informar éxito. Usa
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  solo cuando quieras reemplazar intencionadamente la identidad actual de cross-signing.

`Matrix key backup is not active on this device after loading from secret storage.`

- Significado: el almacenamiento secreto no produjo una sesión de copia de seguridad activa en este dispositivo.
- Qué hacer: primero verifica el dispositivo y luego vuelve a comprobarlo con `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Significado: este dispositivo no puede restaurar desde el almacenamiento secreto hasta que se complete la verificación del dispositivo.
- Qué hacer: primero ejecuta `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### Mensajes de instalación personalizada del plugin

`Matrix is installed from a custom path that no longer exists: ...`

- Significado: tu registro de instalación del plugin apunta a una ruta local que ya no existe.
- Qué hacer: reinstálalo con `openclaw plugins install @openclaw/matrix`, o si lo estás ejecutando desde una copia del repositorio, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Si el historial cifrado todavía no vuelve

Ejecuta estas comprobaciones en orden:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Si la copia de seguridad se restaura correctamente pero algunas salas antiguas siguen sin historial, probablemente esas claves faltantes nunca fueron respaldadas por el plugin anterior.

## Si quieres empezar de cero para los mensajes futuros

Si aceptas perder historial cifrado antiguo irrecuperable y solo quieres una base limpia de copia de seguridad a partir de ahora, ejecuta estos comandos en orden:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Si el dispositivo sigue sin verificarse después de eso, termina la verificación desde tu cliente Matrix comparando los emoji SAS o los códigos decimales y confirmando que coinciden.

## Páginas relacionadas

- [Matrix](/es/channels/matrix)
- [Doctor](/es/gateway/doctor)
- [Migrating](/es/install/migrating)
- [Plugins](/es/tools/plugin)
