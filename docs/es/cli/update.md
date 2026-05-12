---
read_when:
    - Quieres actualizar una copia local del código fuente de forma segura
    - Estás depurando la salida o las opciones de `openclaw update`
    - Debes comprender el comportamiento abreviado de `--update`
summary: Referencia de CLI para `openclaw update` (actualización del código fuente relativamente segura + reinicio automático del Gateway)
title: Actualizar
x-i18n:
    generated_at: "2026-05-12T08:45:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93244af800aaa53c55a52f9593a7727910aa91acac9d1e34e89c39a95b133461
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Actualiza OpenClaw de forma segura y cambia entre los canales stable/beta/dev.

Si instalaste mediante **npm/pnpm/bun** (instalación global, sin metadatos de git),
las actualizaciones se realizan mediante el flujo del gestor de paquetes en [Actualización](/es/install/updating).

## Uso

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Opciones

- `--no-restart`: omite reiniciar el servicio Gateway después de una actualización correcta. Las actualizaciones del gestor de paquetes que sí reinician el Gateway verifican que el servicio reiniciado informe la versión actualizada esperada antes de que el comando se complete correctamente.
- `--channel <stable|beta|dev>`: establece el canal de actualización (git + npm; se conserva en la configuración).
- `--tag <dist-tag|version|spec>`: anula el paquete objetivo solo para esta actualización. Para instalaciones de paquetes, `main` se asigna a `github:openclaw/openclaw#main`.
- `--dry-run`: previsualiza las acciones de actualización planificadas (flujo de canal/etiqueta/objetivo/reinicio) sin escribir la configuración, instalar, sincronizar plugins ni reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legible por máquinas, incluido
  `postUpdate.plugins.warnings` cuando plugins administrados dañados o que no se pueden cargar necesitan
  reparación después de que la actualización del núcleo se completa correctamente, detalles de reserva de plugins del canal beta
  cuando un plugin no tiene versión beta, y `postUpdate.plugins.integrityDrifts`
  cuando se detecta deriva de artefactos de plugins de npm durante la sincronización de plugins posterior a la actualización.
- `--timeout <seconds>`: tiempo de espera por paso (el valor predeterminado es 1800s).
- `--yes`: omite las solicitudes de confirmación (por ejemplo, la confirmación de degradación de versión).

`openclaw update` no tiene una marca `--verbose`. Usa `--dry-run` para previsualizar
las acciones planificadas de canal/etiqueta/instalación/reinicio, `--json` para obtener
resultados legibles por máquinas, y `openclaw update status --json` cuando solo necesitas detalles
del canal y de disponibilidad. Si estás depurando registros del Gateway durante una actualización,
la verbosidad de consola y el nivel de registro de archivo son independientes: `--verbose` del Gateway afecta
la salida de terminal/WebSocket, mientras que los registros de archivo requieren `logging.level: "debug"` o
`"trace"` en la configuración. Consulta [registro del Gateway](/es/gateway/logging).

<Note>
En modo Nix (`OPENCLAW_NIX_MODE=1`), las ejecuciones modificadoras de `openclaw update` están deshabilitadas. Actualiza la fuente Nix o la entrada flake para esta instalación en su lugar; para nix-openclaw, usa el [inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrado en el agente. `openclaw update status` y `openclaw update --dry-run` siguen siendo de solo lectura.
</Note>

<Warning>
Las degradaciones de versión requieren confirmación porque las versiones anteriores pueden romper la configuración.
</Warning>

## `update status`

Muestra el canal de actualización activo + etiqueta/rama/SHA de git (para checkouts de código fuente), además de la disponibilidad de actualizaciones.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opciones:

- `--json`: imprime JSON de estado legible por máquinas.
- `--timeout <seconds>`: tiempo de espera para las comprobaciones (el valor predeterminado es 3s).

## `update wizard`

Flujo interactivo para elegir un canal de actualización y confirmar si se debe reiniciar el Gateway
después de actualizar (el valor predeterminado es reiniciar). Si seleccionas `dev` sin un checkout de git,
ofrece crear uno.

Opciones:

- `--timeout <seconds>`: tiempo de espera para cada paso de actualización (valor predeterminado `1800`)

## Qué hace

Cuando cambias de canal explícitamente (`--channel ...`), OpenClaw también mantiene alineado el
método de instalación:

- `dev` → garantiza un checkout de git (valor predeterminado: `~/openclaw`, se puede anular con `OPENCLAW_GIT_DIR`),
  lo actualiza e instala la CLI global desde ese checkout.
- `stable` → instala desde npm usando `latest`.
- `beta` → prefiere la dist-tag `beta` de npm, pero vuelve a `latest` cuando beta
  falta o es anterior a la versión estable actual.

El actualizador automático del núcleo del Gateway (cuando está habilitado mediante configuración) lanza la ruta de actualización de la CLI
fuera del controlador de solicitudes del Gateway en vivo. Las actualizaciones de gestor de paquetes `update.run` del plano de control
fuerzan un reinicio de actualización no diferido y sin periodo de enfriamiento después del intercambio del paquete,
porque el proceso antiguo del Gateway aún puede tener fragmentos en memoria que apuntan a
archivos eliminados por el paquete nuevo.

Para instalaciones con gestor de paquetes, `openclaw update` resuelve la versión del paquete
objetivo antes de invocar el gestor de paquetes. Las instalaciones globales de npm usan una instalación por etapas:
OpenClaw instala el paquete nuevo en un prefijo npm temporal, verifica
allí el inventario `dist` empaquetado y luego intercambia ese árbol de paquete limpio en el
prefijo global real. Si la verificación falla, el doctor posterior a la actualización, la sincronización de plugins y
el trabajo de reinicio no se ejecutan desde el árbol sospechoso. Incluso cuando la versión instalada
ya coincide con el objetivo, el comando actualiza la instalación global del paquete,
luego ejecuta la sincronización de plugins, una actualización de finalización de comandos del núcleo y el trabajo de reinicio. Esto
mantiene los sidecars empaquetados y los registros de plugins propiedad del canal alineados con la
compilación de OpenClaw instalada, mientras deja las reconstrucciones completas de finalización de comandos de plugins para
ejecuciones explícitas de `openclaw completion --write-state`.

Cuando hay instalado un servicio Gateway administrado local y el reinicio está habilitado,
las actualizaciones del gestor de paquetes detienen el servicio en ejecución antes de reemplazar el árbol
del paquete, luego actualizan los metadatos del servicio desde la instalación actualizada, reinician el
servicio y verifican que el Gateway reiniciado informe la versión esperada antes de
informar éxito. En macOS, la comprobación posterior a la actualización también verifica que el LaunchAgent
esté cargado/en ejecución para el perfil activo y que el puerto de loopback configurado esté
en buen estado. Si el plist está instalado pero launchd no lo está supervisando, OpenClaw
vuelve a arrancar el LaunchAgent automáticamente y luego vuelve a ejecutar las comprobaciones
de salud/versión/preparación del canal. Un arranque nuevo carga directamente el trabajo RunAtLoad,
por lo que la recuperación de actualización no ejecuta inmediatamente `kickstart -k` en el Gateway
recién iniciado. Si el Gateway aún no se vuelve saludable, el comando sale
con valor distinto de cero e imprime la ruta del registro de reinicio más instrucciones explícitas de reinicio, reinstalación y
reversión del paquete. Con `--no-restart`,
el reemplazo del paquete sigue ejecutándose, pero el servicio administrado no se detiene ni
se reinicia, por lo que el Gateway en ejecución puede conservar código antiguo hasta que lo reinicies
manualmente.

## Flujo de checkout de git

### Selección de canal

- `stable`: hace checkout de la etiqueta no beta más reciente, luego compila y ejecuta doctor.
- `beta`: prefiere la etiqueta `-beta` más reciente, pero vuelve a la etiqueta estable más reciente cuando beta falta o es anterior.
- `dev`: hace checkout de `main`, luego obtiene cambios y hace rebase.

### Pasos de actualización

<Steps>
  <Step title="Verify clean worktree">
    Requiere que no haya cambios sin confirmar.
  </Step>
  <Step title="Switch channel">
    Cambia al canal seleccionado (etiqueta o rama).
  </Step>
  <Step title="Fetch upstream">
    Solo dev.
  </Step>
  <Step title="Preflight build (dev only)">
    Ejecuta la compilación de TypeScript en un worktree temporal. Si la punta falla, retrocede hasta 10 commits para encontrar el commit más reciente que se pueda compilar. Establece `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` para ejecutar también lint durante esta comprobación previa; lint se ejecuta en modo serial restringido porque los hosts de actualización de usuarios suelen ser más pequeños que los runners de CI.
  </Step>
  <Step title="Rebase">
    Hace rebase sobre el commit seleccionado (solo dev).
  </Step>
  <Step title="Install dependencies">
    Usa el gestor de paquetes del repositorio. Para checkouts de pnpm, el actualizador prepara `pnpm` bajo demanda (primero mediante `corepack`, luego con una reserva temporal `npm install pnpm@11`) en lugar de ejecutar `npm run build` dentro de un workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Compila el gateway y la Control UI.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` se ejecuta como la comprobación final de actualización segura.
  </Step>
  <Step title="Sync plugins">
    Sincroniza plugins con el canal activo. Dev usa plugins incluidos; stable y beta usan npm. Actualiza las instalaciones de plugins rastreadas.
  </Step>
</Steps>

En el canal de actualización beta, las instalaciones rastreadas de plugins npm y ClawHub que siguen
la línea predeterminada/latest prueban primero una versión `@beta` del plugin. Si el plugin no tiene
versión beta, OpenClaw vuelve a la especificación default/latest registrada e informa
eso como una advertencia. Para plugins npm, OpenClaw también recurre a la reserva cuando el paquete
beta existe pero falla la validación de instalación. Estas advertencias de reserva de plugins no
hacen que la actualización del núcleo falle. Las versiones exactas y las etiquetas explícitas no se
reescriben.

<Warning>
Si una actualización de plugin npm fijada a una versión exacta resuelve a un artefacto cuya integridad difiere del registro de instalación almacenado, `openclaw update` aborta esa actualización de artefacto de plugin en lugar de instalarlo. Reinstala o actualiza el plugin explícitamente solo después de verificar que confías en el nuevo artefacto.
</Warning>

<Note>
Los fallos de sincronización de plugins posteriores a la actualización que están acotados a un plugin administrado y que la ruta de sincronización puede rodear (por ejemplo, un registro npm inalcanzable para un plugin no esencial) se informan como advertencias después de que la actualización del núcleo se completa correctamente. El resultado JSON mantiene el `status: "ok"` de nivel superior de la actualización e informa `postUpdate.plugins.status: "warning"` con guía de `openclaw doctor --fix` y `openclaw plugins inspect <id> --runtime --json`. Las excepciones inesperadas del actualizador o de sincronización siguen haciendo fallar el resultado de la actualización. Corrige el error de instalación o actualización del plugin y luego vuelve a ejecutar `openclaw doctor --fix` o `openclaw update`.

Después del paso de sincronización por plugin, `openclaw update` ejecuta una pasada obligatoria de **convergencia posterior al núcleo** antes de que se reinicie el gateway: repara cargas útiles de plugins configurados faltantes, valida en disco cada registro de instalación rastreada _activo_ y verifica estáticamente que su `package.json` sea analizable (y que cualquier `main` declarado explícitamente exista). Los fallos de esta pasada — y una instantánea de configuración de OpenClaw no válida — devuelven `postUpdate.plugins.status: "error"` y cambian el `status` de nivel superior de la actualización a `"error"`, por lo que `openclaw update` sale con valor distinto de cero y el gateway _no_ se reinicia con un conjunto de plugins sin verificar. El error incluye líneas estructuradas `postUpdate.plugins.warnings[].guidance` que apuntan a `openclaw doctor --fix` y `openclaw plugins inspect <id> --runtime --json` para seguimiento. Las entradas de plugins deshabilitados y los registros que no son objetivos oficiales de sincronización vinculados a una fuente confiable se omiten aquí, reflejando la política `skipDisabledPlugins` usada por la comprobación de cargas útiles faltantes, de modo que un registro obsoleto de plugin deshabilitado no pueda bloquear una actualización que de otro modo sería válida.

Cuando el Gateway actualizado se inicia, la carga de plugins es solo de verificación: el inicio no ejecuta gestores de paquetes ni modifica árboles de dependencias. Los reinicios de `update.run` del gestor de paquetes omiten la diferición inactiva normal y el periodo de enfriamiento de reinicio después de que el árbol del paquete se haya intercambiado, por lo que el proceso antiguo no puede seguir cargando de forma diferida fragmentos eliminados.

Si el arranque de pnpm aún falla, el actualizador se detiene pronto con un error específico del gestor de paquetes en lugar de intentar `npm run build` dentro del checkout.
</Note>

## Atajo `--update`

`openclaw --update` se reescribe como `openclaw update` (útil para shells y scripts de lanzadores).

## Relacionado

- `openclaw doctor` (ofrece ejecutar update primero en checkouts de git)
- [Canales de desarrollo](/es/install/development-channels)
- [Actualización](/es/install/updating)
- [Referencia de la CLI](/es/cli)
