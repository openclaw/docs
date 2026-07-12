---
read_when:
    - Actualización de una instalación existente de Matrix
    - Migración del historial cifrado de Matrix y del estado del dispositivo
summary: Cómo OpenClaw actualiza el Plugin anterior de Matrix en el mismo lugar, incluidos los límites de recuperación del estado cifrado y los pasos de recuperación manual.
title: Migración de Matrix
x-i18n:
    generated_at: "2026-07-12T14:19:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 33d5ac134338c8032ca1507ceee6eade2d37b3c86f0045fb883304ad208cd5e5
    source_path: channels/matrix-migration.md
    workflow: 16
---

Actualice desde el Plugin público anterior `matrix` a la implementación actual.

Para la mayoría de los usuarios, la actualización ya está preparada:

- el Plugin sigue siendo `@openclaw/matrix`
- el canal sigue siendo `matrix`
- la configuración permanece en `channels.matrix`
- las credenciales almacenadas en caché permanecen en `~/.openclaw/credentials/matrix/`
- el estado de ejecución permanece en `~/.openclaw/matrix/`

No es necesario cambiar el nombre de las claves de configuración ni reinstalar el Plugin con un nombre nuevo.
El paquete raíz `openclaw` ya no incluye el código de ejecución de Matrix ni las
dependencias del SDK de Matrix. Si `openclaw channels status` muestra que Matrix está configurado pero el
Plugin no está instalado, ejecute `openclaw doctor --fix` o
`openclaw plugins install @openclaw/matrix`; no instale paquetes del SDK de Matrix
en el paquete raíz de OpenClaw.

## Qué hace automáticamente la migración

La migración de Matrix se ejecuta al ejecutar [`openclaw doctor --fix`](/es/gateway/doctor) y, como mecanismo alternativo, cuando el cliente de Matrix se inicia y todavía encuentra estado auxiliar basado en archivos junto a su almacén SQLite.

La migración automática abarca:

- reutilizar las credenciales de Matrix almacenadas en caché
- conservar la misma selección de cuenta y la configuración de `channels.matrix`
- importar el estado auxiliar basado en archivos (caché de sincronización `bot-storage.json`, `recovery-key.json`, `legacy-crypto-migration.json` e instantáneas de IndexedDB) al estado SQLite de Matrix; los archivos migrados se archivan con el sufijo `.migrated`
- reutilizar la raíz de almacenamiento de hashes de tokens existente más completa para la misma cuenta, servidor doméstico, usuario y dispositivo de Matrix cuando el token de acceso cambie posteriormente

## Actualización desde versiones de OpenClaw anteriores a 2026.4

Las versiones hasta la serie 2026.6 también migraban el diseño plano original de
almacén único de Matrix (`~/.openclaw/matrix/bot-storage.json` junto con
`~/.openclaw/matrix/crypto/`) y preparaban la recuperación del estado cifrado desde el
antiguo almacén criptográfico de Rust. Las versiones actuales ya no incluyen esa migración.

Si está actualizando una instalación que todavía utiliza el diseño plano, primero
actualice a una versión 2026.6, ejecute `openclaw doctor --fix` e inicie el Gateway
una vez para migrar el almacén plano y cualquier clave de sala recuperable. Después, actualice
a la versión más reciente.

El Plugin público anterior de Matrix **no** creaba automáticamente copias de seguridad de las claves de sala de Matrix. Si la instalación anterior tenía un historial cifrado exclusivamente local del que nunca se hizo una copia de seguridad, algunos mensajes cifrados antiguos podrían seguir siendo ilegibles después de la actualización, independientemente de la ruta de migración.

## Flujo de actualización recomendado

1. Actualice OpenClaw y el Plugin de Matrix de la forma habitual.
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

5. Coloque la clave de recuperación de la cuenta de Matrix que está reparando en una variable de entorno específica de la cuenta. Para una única cuenta predeterminada, `MATRIX_RECOVERY_KEY` es adecuado. Para varias cuentas, utilice una variable por cuenta, por ejemplo `MATRIX_RECOVERY_KEY_ASSISTANT`, y añada `--account assistant` al comando.

6. Si OpenClaw indica que se necesita una clave de recuperación, ejecute el comando correspondiente a la cuenta:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Si este dispositivo todavía no está verificado, ejecute el comando correspondiente a la cuenta:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Si se acepta la clave de recuperación y la copia de seguridad se puede utilizar, pero `Cross-signing verified`
   sigue siendo `no`, complete la autoverificación desde otro cliente de Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Acepte la solicitud en otro cliente de Matrix, compare los emojis o los números decimales
   y escriba `yes` únicamente cuando coincidan. El comando espera a que exista confianza plena en la
   identidad de Matrix antes de indicar que se ha completado correctamente.

8. Si está abandonando intencionadamente un historial antiguo irrecuperable y desea una base de referencia nueva para las copias de seguridad de los mensajes futuros, ejecute:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   Añada `--rotate-recovery-key` únicamente cuando la clave de recuperación antigua deba dejar de permitir el acceso a la copia de seguridad nueva.

9. Si todavía no existe una copia de seguridad de claves en el servidor, cree una para recuperaciones futuras:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Mensajes habituales y su significado

`Failed migrating legacy Matrix client storage: ...`

- Significado: el mecanismo alternativo del lado del cliente de Matrix encontró estado auxiliar basado en archivos, pero la importación a SQLite falló. OpenClaw revierte los movimientos completados y cancela ese mecanismo alternativo, en lugar de iniciarse silenciosamente con un almacén nuevo.
- Qué hacer: revise los permisos o conflictos del sistema de archivos, conserve intacto el estado antiguo y vuelva a intentarlo después de corregir el error.

`Matrix is installed from a custom path: ...`

- Significado: Matrix está fijado a una instalación desde una ruta, por lo que las actualizaciones de la línea principal no lo sustituyen automáticamente por el paquete predeterminado de Matrix.
- Qué hacer: vuelva a instalarlo con `openclaw plugins install @openclaw/matrix` cuando desee regresar al Plugin predeterminado de Matrix.

`Matrix is installed from a custom path that no longer exists: ...`

- Significado: el registro de instalación del Plugin apunta a una ruta local que ya no existe.
- Qué hacer: vuelva a instalarlo con `openclaw plugins install @openclaw/matrix` o, si está ejecutando desde una copia de trabajo del repositorio, con `openclaw plugins install ./path/to/local/matrix-plugin`. `openclaw doctor --fix` también puede eliminar las referencias obsoletas al Plugin de Matrix.

### Mensajes de recuperación manual

`openclaw matrix verify status` y `openclaw matrix verify backup status` muestran una línea `Backup issue:` junto con indicaciones en `Next steps:` cuando la copia de seguridad de claves de sala no está en buen estado en este dispositivo:

| Problema de la copia de seguridad                                      | Significado                                             | Solución                                                                                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `no room-key backup exists on the homeserver`                         | no hay nada desde lo que restaurar                      | `openclaw matrix verify bootstrap` para crear una copia de seguridad de las claves de sala                                                  |
| `backup decryption key is not loaded on this device`                  | la clave existe, pero no está activa aquí               | `openclaw matrix verify backup restore`; si todavía no se puede cargar la clave, pase la clave de recuperación mediante `--recovery-key-stdin` |
| `backup decryption key could not be loaded from secret storage (...)` | la carga desde el almacén de secretos falló o no se admite | pase la clave de recuperación: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`          |
| `backup key mismatch (...)`                                           | la clave almacenada no coincide con la copia de seguridad activa del servidor | vuelva a ejecutar `verify backup restore --recovery-key-stdin` con la clave de la copia de seguridad activa del servidor, o `verify backup reset --yes` para obtener una base de referencia nueva |
| `backup signature chain is not trusted by this device`                | el dispositivo todavía no confía en la cadena de firmas cruzadas | ejecute `verify device --recovery-key-stdin` y, después, `verify self` desde otro cliente verificado si la confianza sigue incompleta        |
| `backup exists but is not active on this device`                      | la copia de seguridad existe en el servidor, pero la sesión local está inactiva | verifique primero el dispositivo y, después, vuelva a comprobarlo con `openclaw matrix verify backup status`                               |
| `backup trust state could not be fully determined`                    | los diagnósticos no fueron concluyentes                 | `openclaw matrix verify status --verbose`                                                                                                  |

Otros errores de recuperación:

`Matrix recovery key is required`

- Significado: se intentó realizar un paso de recuperación sin proporcionar una clave de recuperación cuando era obligatoria.
- Qué hacer: vuelva a ejecutar el comando con `--recovery-key-stdin`, por ejemplo `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Significado: no se pudo analizar la clave proporcionada o esta no coincidía con el formato esperado.
- Qué hacer: vuelva a intentarlo con la clave de recuperación exacta de su cliente de Matrix o de la exportación de la clave de recuperación.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Significado: la clave de recuperación desbloqueó material utilizable de la copia de seguridad, pero Matrix no ha establecido una confianza plena en la identidad mediante firmas cruzadas para este dispositivo. Compruebe si la salida del comando contiene `Recovery key accepted`, `Backup usable`, `Cross-signing verified` y `Device verified by owner`.
- Qué hacer: ejecute `openclaw matrix verify self`, acepte la solicitud en otro cliente de Matrix, compare el SAS y escriba `yes` únicamente cuando coincida. Utilice `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` únicamente cuando desee sustituir intencionadamente la identidad actual de firmas cruzadas.

Si acepta perder el historial cifrado antiguo irrecuperable, puede restablecer en su lugar la
base de referencia actual de la copia de seguridad con `openclaw matrix verify backup reset --yes`. Cuando el
secreto almacenado de la copia de seguridad está dañado, este restablecimiento también repara el almacén de secretos para que la
nueva clave de la copia de seguridad pueda cargarse correctamente después del reinicio.

## Si el historial cifrado todavía no se recupera

Ejecute estas comprobaciones en orden:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Si la copia de seguridad se restaura correctamente, pero todavía falta el historial de algunas salas antiguas, es probable que el Plugin anterior nunca haya creado una copia de seguridad de esas claves ausentes.

## Si desea empezar de cero para los mensajes futuros

Si acepta perder el historial cifrado antiguo irrecuperable y solo desea una base de referencia limpia para las copias de seguridad futuras, ejecute estos comandos en orden:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Si el dispositivo todavía no está verificado después de eso, finalice la verificación desde su cliente de Matrix comparando los emojis o códigos decimales del SAS y confirmando que coinciden.

## Temas relacionados

- [Matrix](/es/channels/matrix): configuración del canal.
- [Reglas push de Matrix](/es/channels/matrix-push-rules): enrutamiento de notificaciones.
- [Doctor](/es/gateway/doctor): comprobación de estado y activador de la migración automática.
- [Guía de migración](/es/install/migrating): todas las rutas de migración (traslados entre máquinas e importaciones entre sistemas).
- [Plugins](/es/tools/plugin): instalación y registro de Plugins.
