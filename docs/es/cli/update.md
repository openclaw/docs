---
read_when:
    - Quieres actualizar una copia de trabajo del código fuente de forma segura
    - Estás depurando la salida o las opciones de `openclaw update`
    - Debes comprender el comportamiento abreviado de `--update`
summary: Referencia de la CLI para `openclaw update` (actualización del código fuente relativamente segura + reinicio automático del Gateway)
title: Actualizar
x-i18n:
    generated_at: "2026-05-06T17:54:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
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

- `--no-restart`: omite reiniciar el servicio Gateway después de una actualización correcta. Las actualizaciones del gestor de paquetes que sí reinician el Gateway verifican que el servicio reiniciado informe la versión actualizada esperada antes de que el comando finalice correctamente.
- `--channel <stable|beta|dev>`: establece el canal de actualización (git + npm; se conserva en la configuración).
- `--tag <dist-tag|version|spec>`: sustituye el objetivo del paquete solo para esta actualización. Para instalaciones de paquete, `main` se asigna a `github:openclaw/openclaw#main`.
- `--dry-run`: previsualiza las acciones de actualización planificadas (flujo de canal/etiqueta/objetivo/reinicio) sin escribir la configuración, instalar, sincronizar plugins ni reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legible por máquina, incluidos
  `postUpdate.plugins.warnings` cuando plugins gestionados dañados o no cargables necesitan
  reparación después de que la actualización del núcleo finalice correctamente, y `postUpdate.plugins.integrityDrifts`
  cuando se detecta deriva de artefactos de plugins npm durante la sincronización de plugins posterior a la actualización.
- `--timeout <seconds>`: tiempo de espera por paso (el valor predeterminado es 1800 s).
- `--yes`: omite las solicitudes de confirmación (por ejemplo, confirmación de degradación de versión).

`openclaw update` no tiene una marca `--verbose`. Usa `--dry-run` para previsualizar
las acciones planificadas de canal/etiqueta/instalación/reinicio, `--json` para obtener
resultados legibles por máquina, y `openclaw update status --json` cuando solo necesites detalles
del canal y de disponibilidad. Si estás depurando registros del Gateway durante una actualización,
la verbosidad de la consola y el nivel de registro de archivo son independientes: `--verbose` del Gateway afecta
a la salida de terminal/WebSocket, mientras que los registros de archivo requieren `logging.level: "debug"` o
`"trace"` en la configuración. Consulta [Registro del Gateway](/es/gateway/logging).

<Note>
En modo Nix (`OPENCLAW_NIX_MODE=1`), las ejecuciones mutables de `openclaw update` están deshabilitadas. Actualiza la fuente de Nix o la entrada de flake para esta instalación en su lugar; para nix-openclaw, usa el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrado en el agente. `openclaw update status` y `openclaw update --dry-run` permanecen como solo lectura.
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

- `--json`: imprime JSON de estado legible por máquina.
- `--timeout <seconds>`: tiempo de espera para las comprobaciones (el valor predeterminado es 3 s).

## `update wizard`

Flujo interactivo para elegir un canal de actualización y confirmar si se reinicia el Gateway
después de actualizar (el valor predeterminado es reiniciar). Si seleccionas `dev` sin un checkout de git, te
ofrece crear uno.

Opciones:

- `--timeout <seconds>`: tiempo de espera para cada paso de actualización (valor predeterminado `1800`)

## Qué hace

Cuando cambias de canal explícitamente (`--channel ...`), OpenClaw también mantiene alineado el
método de instalación:

- `dev` → garantiza un checkout de git (valor predeterminado: `~/openclaw`, se puede sustituir con `OPENCLAW_GIT_DIR`),
  lo actualiza e instala la CLI global desde ese checkout.
- `stable` → instala desde npm usando `latest`.
- `beta` → prefiere el dist-tag `beta` de npm, pero recurre a `latest` cuando beta
  falta o es anterior a la versión estable actual.

El actualizador automático del núcleo del Gateway (cuando está habilitado mediante configuración) inicia la ruta de actualización de la CLI
fuera del controlador de solicitudes del Gateway en vivo. Las actualizaciones de gestor de paquetes `update.run`
del plano de control fuerzan un reinicio de actualización no diferido y sin enfriamiento después del intercambio del paquete,
porque el proceso anterior del Gateway todavía puede tener fragmentos en memoria que apuntan a
archivos eliminados por el paquete nuevo.

Para instalaciones con gestor de paquetes, `openclaw update` resuelve la versión del paquete
objetivo antes de invocar el gestor de paquetes. Las instalaciones globales de npm usan una instalación
por etapas: OpenClaw instala el paquete nuevo en un prefijo npm temporal, verifica
allí el inventario `dist` empaquetado y luego intercambia ese árbol de paquetes limpio en el
prefijo global real. Si la verificación falla, el doctor posterior a la actualización, la sincronización de plugins y
el trabajo de reinicio no se ejecutan desde el árbol sospechoso. Incluso cuando la versión instalada
ya coincide con el objetivo, el comando actualiza la instalación global del paquete,
luego ejecuta la sincronización de plugins, una actualización de finalización de comandos del núcleo y el trabajo de reinicio. Esto
mantiene los sidecars empaquetados y los registros de plugins propiedad del canal alineados con la
compilación instalada de OpenClaw, mientras deja las reconstrucciones completas de finalización de comandos de plugins para
ejecuciones explícitas de `openclaw completion --write-state`.

Cuando hay un servicio Gateway gestionado local instalado y el reinicio está habilitado,
las actualizaciones del gestor de paquetes detienen el servicio en ejecución antes de reemplazar el árbol de paquetes,
luego actualizan los metadatos del servicio desde la instalación actualizada, reinician el
servicio y verifican que el Gateway reiniciado informe la versión esperada antes de
notificar el éxito. En macOS, la comprobación posterior a la actualización también verifica que el LaunchAgent
esté cargado/en ejecución para el perfil activo y que el puerto loopback configurado esté
sano. Si el plist está instalado pero launchd no lo está supervisando, OpenClaw
vuelve a arrancar el LaunchAgent automáticamente y luego vuelve a ejecutar las
comprobaciones de preparación de salud/versión/canal. Un arranque nuevo carga el trabajo RunAtLoad
directamente, por lo que la recuperación de actualización no hace inmediatamente `kickstart -k` al Gateway
recién iniciado. Si el Gateway todavía no queda sano, el comando sale
con un valor distinto de cero e imprime la ruta del registro de reinicio junto con instrucciones explícitas de reinicio, reinstalación y
reversión del paquete. Con `--no-restart`,
el reemplazo del paquete aún se ejecuta, pero el servicio gestionado no se detiene ni
se reinicia, por lo que el Gateway en ejecución puede conservar código antiguo hasta que lo reinicies
manualmente.

## Flujo de checkout de git

### Selección de canal

- `stable`: hace checkout de la etiqueta no beta más reciente, luego compila y ejecuta doctor.
- `beta`: prefiere la etiqueta `-beta` más reciente, pero recurre a la etiqueta estable más reciente cuando beta falta o es anterior.
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
    Ejecuta la compilación de TypeScript en un worktree temporal. Si el extremo falla, retrocede hasta 10 commits para encontrar el commit compilable más reciente. Establece `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` para ejecutar también lint durante esta comprobación previa; lint se ejecuta en modo serial restringido porque los hosts de actualización de usuarios suelen ser más pequeños que los runners de CI.
  </Step>
  <Step title="Rebase">
    Hace rebase sobre el commit seleccionado (solo dev).
  </Step>
  <Step title="Install dependencies">
    Usa el gestor de paquetes del repo. Para checkouts de pnpm, el actualizador arranca `pnpm` bajo demanda (primero mediante `corepack`, luego con un recurso temporal de `npm install pnpm@10`) en lugar de ejecutar `npm run build` dentro de un workspace pnpm.
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

En el canal de actualización beta, las instalaciones de plugins npm y ClawHub rastreadas que siguen
la línea predeterminada/latest prueban primero una versión `@beta` del plugin. Si el plugin no tiene
versión beta, OpenClaw recurre a la especificación predeterminada/latest registrada. Para plugins npm,
OpenClaw también recurre a esa opción cuando el paquete beta existe pero falla la validación de instalación.
Las versiones exactas y las etiquetas explícitas no se reescriben.

<Warning>
Si una actualización exacta fijada de un plugin npm se resuelve a un artefacto cuya integridad difiere del registro de instalación almacenado, `openclaw update` cancela esa actualización de artefacto del plugin en lugar de instalarlo. Reinstala o actualiza el plugin explícitamente solo después de verificar que confías en el artefacto nuevo.
</Warning>

<Note>
Los fallos de sincronización de plugins posteriores a la actualización que están limitados a un plugin gestionado se notifican como advertencias después de que la actualización del núcleo finaliza correctamente. El resultado JSON mantiene el `status: "ok"` de actualización de nivel superior e informa `postUpdate.plugins.status: "warning"` con orientación de `openclaw doctor --fix` y `openclaw plugins inspect <id> --runtime --json`. Las excepciones inesperadas del actualizador o de sincronización siguen haciendo fallar el resultado de la actualización. Corrige la instalación del plugin o el error de actualización y luego vuelve a ejecutar `openclaw doctor --fix` o `openclaw update`.

Cuando se inicia el Gateway actualizado, la carga de plugins es solo de verificación: el arranque no ejecuta gestores de paquetes ni muta árboles de dependencias. Los reinicios `update.run` del gestor de paquetes omiten el diferimiento normal por inactividad y el enfriamiento de reinicio después de que se haya intercambiado el árbol de paquetes, por lo que el proceso anterior no puede seguir cargando diferidamente fragmentos eliminados.

Si el arranque de pnpm todavía falla, el actualizador se detiene pronto con un error específico del gestor de paquetes en lugar de intentar `npm run build` dentro del checkout.
</Note>

## Abreviatura `--update`

`openclaw --update` se reescribe como `openclaw update` (útil para shells y scripts de lanzador).

## Relacionado

- `openclaw doctor` (ofrece ejecutar update primero en checkouts de git)
- [Canales de desarrollo](/es/install/development-channels)
- [Actualización](/es/install/updating)
- [Referencia de la CLI](/es/cli)
