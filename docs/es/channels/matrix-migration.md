---
read_when:
    - Actualización de una instalación existente de Matrix
    - Migración del historial cifrado y del estado del dispositivo de Matrix
summary: Cómo OpenClaw actualiza en el mismo lugar el Plugin anterior de Matrix, incluidos los límites de recuperación del estado cifrado y los pasos de recuperación manual.
title: Migración de Matrix
x-i18n:
    generated_at: "2026-07-19T01:46:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 475c96914900a5597f37001264bd3d8f69a69dbd0600f2704c2a1be46924fac4
    source_path: channels/matrix-migration.md
    workflow: 16
---

Actualice desde el plugin público anterior `matrix` a la implementación actual.

Para la mayoría de los usuarios, la actualización se realiza sin cambios:

- el plugin sigue siendo `@openclaw/matrix`
- el canal sigue siendo `matrix`
- la configuración permanece en `channels.matrix`
- las credenciales almacenadas en caché se trasladan al estado compartido del plugin `state/openclaw.sqlite`
- el estado de ejecución permanece en `~/.openclaw/matrix/`

No es necesario cambiar el nombre de las claves de configuración ni reinstalar el plugin con un nombre nuevo.
El paquete raíz `openclaw` ya no incluye el código de ejecución de Matrix ni las dependencias del SDK de Matrix. Si `openclaw channels status` muestra que Matrix está configurado, pero el plugin no está instalado, ejecute `openclaw doctor --fix` o `openclaw plugins install @openclaw/matrix`; no instale paquetes del SDK de Matrix en el paquete raíz de OpenClaw.

## Qué hace automáticamente la migración

La migración de Matrix se ejecuta al usar [`openclaw doctor --fix`](/es/gateway/doctor). Los archivos auxiliares junto al almacén dedicado de Matrix conservan su mecanismo alternativo durante el inicio del cliente, pero la importación de archivos de credenciales solo se realiza mediante Doctor; durante la ejecución, solo se lee el estado canónico de credenciales de SQLite.

La migración de Doctor abarca:

- la importación y verificación de los archivos `~/.openclaw/credentials/matrix/credentials*.json` retirados antes de archivarlos
- la conservación de la misma selección de cuenta y configuración `channels.matrix`
- la importación del estado de los archivos auxiliares (`bot-storage.json` de caché de sincronización, `recovery-key.json`, `legacy-crypto-migration.json` e instantáneas de IndexedDB) al estado de Matrix en SQLite; los archivos migrados se archivan con el sufijo `.migrated`
- la reutilización de la raíz de almacenamiento de hashes de tokens existente más completa para la misma cuenta, servidor doméstico, usuario y dispositivo de Matrix cuando el token de acceso cambia posteriormente

## Actualización desde versiones de OpenClaw anteriores a 2026.4

Las versiones hasta la serie 2026.6 también migraban el diseño plano original de almacén único de Matrix (`~/.openclaw/matrix/bot-storage.json` más `~/.openclaw/matrix/crypto/`) y preparaban la recuperación del estado cifrado desde el antiguo almacén criptográfico de Rust. Las versiones actuales ya no incluyen esa migración.

Si actualiza una instalación que todavía utiliza el diseño plano, actualice primero a una versión de la serie 2026.6, ejecute `openclaw doctor --fix` e inicie el Gateway una vez para migrar el almacén plano y las claves de sala recuperables. Después, actualice a la versión más reciente.

El anterior plugin público de Matrix **no** creaba automáticamente copias de seguridad de las claves de sala de Matrix. Si la instalación anterior contenía un historial cifrado solo de forma local del que nunca se hizo una copia de seguridad, algunos mensajes cifrados antiguos podrían seguir siendo ilegibles después de la actualización, independientemente de la ruta de migración.

## Flujo de actualización recomendado

1. Actualice OpenClaw y el plugin de Matrix de la forma habitual.
2. Ejecute:

   ```bash
   openclaw doctor --fix
   ```

3. Inicie o reinicie el Gateway.
4. Compruebe el estado actual de verificación y de la copia de seguridad:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Coloque la clave de recuperación de la cuenta de Matrix que está reparando en una variable de entorno específica de esa cuenta. Para una única cuenta predeterminada, `MATRIX_RECOVERY_KEY` es suficiente. Para varias cuentas, utilice una variable por cuenta, por ejemplo `MATRIX_RECOVERY_KEY_ASSISTANT`, y añada `--account assistant` al comando.

6. Si OpenClaw indica que se necesita una clave de recuperación, ejecute el comando correspondiente a la cuenta:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Si este dispositivo aún no está verificado, ejecute el comando correspondiente a la cuenta:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Si se acepta la clave de recuperación y la copia de seguridad se puede utilizar, pero `Cross-signing verified` todavía es `no`, complete la autoverificación desde otro cliente de Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Acepte la solicitud en otro cliente de Matrix, compare los emojis o los decimales y escriba `yes` solo cuando coincidan. El comando espera hasta que exista plena confianza en la identidad de Matrix antes de indicar que la operación se completó correctamente.

8. Si abandona intencionadamente el historial antiguo irrecuperable y desea establecer una copia de seguridad inicial nueva para los mensajes futuros, ejecute:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   Añada `--rotate-recovery-key` solo cuando la clave de recuperación anterior deba dejar de desbloquear la copia de seguridad nueva.

9. Si todavía no existe ninguna copia de seguridad de claves en el servidor, cree una para permitir recuperaciones futuras:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Mensajes habituales y qué significan

`Failed migrating legacy Matrix client storage: ...`

- Significado: el mecanismo alternativo del cliente de Matrix encontró estado en archivos auxiliares, pero no pudo importarlo a SQLite. OpenClaw revierte los traslados completados y cancela ese mecanismo alternativo, en lugar de iniciarse silenciosamente con un almacén nuevo.
- Qué hacer: examine los permisos o conflictos del sistema de archivos, mantenga intacto el estado anterior y vuelva a intentarlo después de corregir el error.

`Matrix is installed from a custom path: ...`

- Significado: Matrix está fijado a una instalación basada en una ruta, por lo que las actualizaciones de la línea principal no lo sustituyen automáticamente por el paquete predeterminado de Matrix.
- Qué hacer: vuelva a instalarlo con `openclaw plugins install @openclaw/matrix` cuando desee regresar al plugin predeterminado de Matrix.

`Matrix is installed from a custom path that no longer exists: ...`

- Significado: el registro de instalación del plugin apunta a una ruta local que ya no existe.
- Qué hacer: vuelva a instalarlo con `openclaw plugins install @openclaw/matrix` o, si lo ejecuta desde una copia de trabajo del repositorio, con `openclaw plugins install ./path/to/local/matrix-plugin`. `openclaw doctor --fix` también puede eliminar las referencias obsoletas al plugin de Matrix.

### Mensajes de recuperación manual

`openclaw matrix verify status` y `openclaw matrix verify backup status` muestran una línea `Backup issue:` y las indicaciones `Next steps:` cuando la copia de seguridad de las claves de sala no funciona correctamente en este dispositivo:

| Problema de la copia de seguridad                                     | Significado                                        | Solución                                                                                                                                  |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | no hay nada que restaurar                          | `openclaw matrix verify bootstrap` para crear una copia de seguridad de las claves de sala                                                               |
| `backup decryption key is not loaded on this device`                  | la clave existe, pero no está activa aquí          | `openclaw matrix verify backup restore`; si todavía no se puede cargar la clave, envíe la clave de recuperación mediante una canalización a `--recovery-key-stdin` |
| `backup decryption key could not be loaded from secret storage (...)` | no se pudo cargar el almacenamiento secreto o no es compatible | envíe la clave de recuperación mediante una canalización: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`                                               |
| `backup key mismatch (...)`                                           | la clave almacenada no coincide con la copia de seguridad activa del servidor | vuelva a ejecutar `verify backup restore --recovery-key-stdin` con la clave de la copia de seguridad activa del servidor, o `verify backup reset --yes` para establecer una copia inicial nueva |
| `backup signature chain is not trusted by this device`                | el dispositivo todavía no confía en la cadena de firma cruzada | `verify device --recovery-key-stdin` y, después, `verify self` desde otro cliente verificado si la confianza sigue incompleta             |
| `backup exists but is not active on this device`                      | hay una copia de seguridad en el servidor, pero la sesión local está inactiva | verifique primero el dispositivo y vuelva a comprobarlo con `openclaw matrix verify backup status`                                             |
| `backup trust state could not be fully determined`                    | los diagnósticos no fueron concluyentes            | `openclaw matrix verify status --verbose`                                                                                                                        |

Otros errores de recuperación:

`Matrix recovery key is required`

- Significado: se intentó realizar un paso de recuperación sin proporcionar una clave de recuperación cuando era necesaria.
- Qué hacer: vuelva a ejecutar el comando con `--recovery-key-stdin`, por ejemplo, `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Significado: no se pudo analizar la clave proporcionada o esta no coincidía con el formato esperado.
- Qué hacer: vuelva a intentarlo con la clave de recuperación exacta del cliente de Matrix o de la exportación de la clave de recuperación.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Significado: la clave de recuperación desbloqueó material utilizable de la copia de seguridad, pero Matrix no ha establecido plena confianza en la identidad de firma cruzada de este dispositivo. Compruebe en la salida del comando `Recovery key accepted`, `Backup usable`, `Cross-signing verified` y `Device verified by owner`.
- Qué hacer: ejecute `openclaw matrix verify self`, acepte la solicitud en otro cliente de Matrix, compare el SAS y escriba `yes` solo cuando coincida. Utilice `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` únicamente cuando desee sustituir intencionadamente la identidad de firma cruzada actual.

Si acepta perder el historial cifrado antiguo irrecuperable, puede restablecer en su lugar la copia de seguridad inicial actual con `openclaw matrix verify backup reset --yes`. Cuando el secreto almacenado de la copia de seguridad está dañado, ese restablecimiento también repara el almacenamiento secreto para que la nueva clave de la copia de seguridad pueda cargarse correctamente después del reinicio.

## Si el historial cifrado sigue sin recuperarse

Ejecute estas comprobaciones en orden:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Si la copia de seguridad se restaura correctamente, pero todavía falta el historial de algunas salas antiguas, es probable que el plugin anterior nunca hubiera incluido esas claves en la copia de seguridad.

## Si desea comenzar de cero para los mensajes futuros

Si acepta perder el historial cifrado antiguo irrecuperable y solo desea establecer una copia de seguridad inicial limpia de ahora en adelante, ejecute estos comandos en orden:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Si después de esto el dispositivo sigue sin verificar, complete la verificación desde el cliente de Matrix comparando los emojis o códigos decimales del SAS y confirmando que coincidan.

## Contenido relacionado

- [Matrix](/es/channels/matrix): configuración del canal.
- [Reglas push de Matrix](/es/channels/matrix-push-rules): enrutamiento de notificaciones.
- [Doctor](/es/gateway/doctor): comprobación de estado y activador de la migración automática.
- [Guía de migración](/es/install/migrating): todas las rutas de migración (traslados entre máquinas e importaciones entre sistemas).
- [Plugins](/es/tools/plugin): instalación y registro de plugins.
