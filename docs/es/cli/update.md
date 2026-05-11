---
read_when:
    - Quieres actualizar una copia de trabajo del código fuente de forma segura
    - Estás depurando la salida o las opciones de `openclaw update`
    - Debe comprender el comportamiento abreviado de `--update`
summary: Referencia de CLI para `openclaw update` (actualización de origen relativamente segura + reinicio automático del Gateway)
title: Actualizar
x-i18n:
    generated_at: "2026-05-11T20:29:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: cefe31181412d398f205a51429f6f5c20e86dfa96bd3d78333cefeb8ab6873b0
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

- `--no-restart`: omite el reinicio del servicio Gateway después de una actualización correcta. Las actualizaciones del gestor de paquetes que sí reinician el Gateway verifican que el servicio reiniciado informe la versión actualizada esperada antes de que el comando se complete correctamente.
- `--channel <stable|beta|dev>`: establece el canal de actualización (git + npm; se conserva en la configuración).
- `--tag <dist-tag|version|spec>`: anula el destino del paquete solo para esta actualización. Para instalaciones de paquete, `main` se asigna a `github:openclaw/openclaw#main`.
- `--dry-run`: previsualiza las acciones de actualización planificadas (flujo de canal/etiqueta/destino/reinicio) sin escribir configuración, instalar, sincronizar plugins ni reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legible por máquina, incluido
  `postUpdate.plugins.warnings` cuando plugins administrados corruptos o no cargables necesitan
  reparación después de que la actualización del núcleo se complete correctamente, detalles de fallback de plugins del canal beta
  cuando un plugin no tiene versión beta, y `postUpdate.plugins.integrityDrifts`
  cuando se detecta deriva de artefactos de plugins npm durante la sincronización de plugins posterior a la actualización.
- `--timeout <seconds>`: tiempo de espera por paso (el valor predeterminado es 1800s).
- `--yes`: omite los avisos de confirmación (por ejemplo, la confirmación de degradación).

`openclaw update` no tiene una marca `--verbose`. Usa `--dry-run` para previsualizar
las acciones planificadas de canal/etiqueta/instalación/reinicio, `--json` para resultados
legibles por máquina, y `openclaw update status --json` cuando solo necesitas detalles
del canal y disponibilidad. Si estás depurando registros de Gateway relacionados con una actualización,
la verbosidad de consola y el nivel de registro en archivo son independientes: Gateway `--verbose` afecta
la salida de terminal/WebSocket, mientras que los registros de archivo requieren `logging.level: "debug"` o
`"trace"` en la configuración. Consulta [Registros de Gateway](/es/gateway/logging).

<Note>
En modo Nix (`OPENCLAW_NIX_MODE=1`), las ejecuciones mutantes de `openclaw update` están deshabilitadas. Actualiza la fuente Nix o la entrada flake de esta instalación en su lugar; para nix-openclaw, usa el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrado en el agente. `openclaw update status` y `openclaw update --dry-run` siguen siendo de solo lectura.
</Note>

<Warning>
Las degradaciones requieren confirmación porque las versiones anteriores pueden romper la configuración.
</Warning>

## `update status`

Muestra el canal de actualización activo + etiqueta/rama/SHA de git (para checkouts de origen), además de la disponibilidad de actualizaciones.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opciones:

- `--json`: imprime JSON de estado legible por máquina.
- `--timeout <seconds>`: tiempo de espera para comprobaciones (el valor predeterminado es 3s).

## `update wizard`

Flujo interactivo para elegir un canal de actualización y confirmar si se debe reiniciar el Gateway
después de actualizar (el valor predeterminado es reiniciar). Si seleccionas `dev` sin un checkout de git,
ofrece crear uno.

Opciones:

- `--timeout <seconds>`: tiempo de espera para cada paso de actualización (predeterminado `1800`)

## Qué hace

Cuando cambias de canal explícitamente (`--channel ...`), OpenClaw también mantiene alineado
el método de instalación:

- `dev` → garantiza un checkout de git (predeterminado: `~/openclaw`, anulable con `OPENCLAW_GIT_DIR`),
  lo actualiza e instala la CLI global desde ese checkout.
- `stable` → instala desde npm usando `latest`.
- `beta` → prefiere el dist-tag `beta` de npm, pero recurre a `latest` cuando beta
  falta o es anterior a la versión stable actual.

El actualizador automático del núcleo del Gateway (cuando está habilitado mediante la configuración) inicia la ruta de actualización de la CLI
fuera del manejador de solicitudes del Gateway en vivo. Las actualizaciones de gestor de paquetes `update.run` del plano de control
fuerzan un reinicio de actualización no diferido y sin periodo de espera después del intercambio del paquete,
porque el proceso Gateway anterior aún puede tener fragmentos en memoria que apuntan a
archivos eliminados por el paquete nuevo.

Para instalaciones mediante gestor de paquetes, `openclaw update` resuelve la versión del paquete
destino antes de invocar el gestor de paquetes. Las instalaciones globales de npm usan una instalación por etapas:
OpenClaw instala el paquete nuevo en un prefijo temporal de npm, verifica allí el inventario
`dist` empaquetado y luego intercambia ese árbol de paquete limpio en el prefijo global real.
Si la verificación falla, el doctor posterior a la actualización, la sincronización de plugins y
el trabajo de reinicio no se ejecutan desde el árbol sospechoso. Incluso cuando la versión instalada
ya coincide con el destino, el comando actualiza la instalación global del paquete,
luego ejecuta la sincronización de plugins, una actualización de completado de comandos del núcleo y el trabajo de reinicio. Esto
mantiene los sidecars empaquetados y los registros de plugins propiedad del canal alineados con la
compilación de OpenClaw instalada, dejando las reconstrucciones completas de completado de comandos de plugins para
ejecuciones explícitas de `openclaw completion --write-state`.

Cuando hay instalado un servicio Gateway administrado local y el reinicio está habilitado,
las actualizaciones mediante gestor de paquetes detienen el servicio en ejecución antes de reemplazar el árbol
del paquete, luego actualizan los metadatos del servicio desde la instalación actualizada, reinician el
servicio y verifican que el Gateway reiniciado informe la versión esperada antes de
informar éxito. En macOS, la comprobación posterior a la actualización también verifica que el LaunchAgent
esté cargado/en ejecución para el perfil activo y que el puerto local loopback configurado esté
saludable. Si el plist está instalado pero launchd no lo está supervisando, OpenClaw
vuelve a arrancar el LaunchAgent automáticamente y luego vuelve a ejecutar las comprobaciones de preparación
de salud/versión/canal. Un arranque nuevo carga directamente el trabajo RunAtLoad,
por lo que la recuperación de actualización no ejecuta de inmediato `kickstart -k` sobre el Gateway
recién iniciado. Si el Gateway aún no queda saludable, el comando sale
con un valor distinto de cero e imprime la ruta del registro de reinicio más instrucciones explícitas de reinicio, reinstalación y
reversión del paquete. Con `--no-restart`,
el reemplazo del paquete se ejecuta de todos modos, pero el servicio administrado no se detiene ni
se reinicia, por lo que el Gateway en ejecución puede conservar código antiguo hasta que lo reinicies
manualmente.

## Flujo de checkout de git

### Selección de canal

- `stable`: hace checkout de la etiqueta no beta más reciente, luego compila y ejecuta doctor.
- `beta`: prefiere la etiqueta `-beta` más reciente, pero recurre a la etiqueta stable más reciente cuando beta falta o es anterior.
- `dev`: hace checkout de `main`, luego obtiene cambios y hace rebase.

### Pasos de actualización

<Steps>
  <Step title="Verificar árbol de trabajo limpio">
    Requiere que no haya cambios sin confirmar.
  </Step>
  <Step title="Cambiar canal">
    Cambia al canal seleccionado (etiqueta o rama).
  </Step>
  <Step title="Obtener upstream">
    Solo dev.
  </Step>
  <Step title="Compilación preliminar (solo dev)">
    Ejecuta la compilación TypeScript en un árbol de trabajo temporal. Si la punta falla, retrocede hasta 10 commits para encontrar el commit compilable más reciente. Establece `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` para ejecutar también lint durante esta comprobación preliminar; lint se ejecuta en modo serial restringido porque los hosts de actualización de usuarios suelen ser más pequeños que los runners de CI.
  </Step>
  <Step title="Rebase">
    Hace rebase sobre el commit seleccionado (solo dev).
  </Step>
  <Step title="Instalar dependencias">
    Usa el gestor de paquetes del repositorio. Para checkouts con pnpm, el actualizador inicializa `pnpm` bajo demanda (primero mediante `corepack`, luego con fallback temporal a `npm install pnpm@11`) en lugar de ejecutar `npm run build` dentro de un workspace pnpm.
  </Step>
  <Step title="Compilar Control UI">
    Compila el gateway y la Control UI.
  </Step>
  <Step title="Ejecutar doctor">
    `openclaw doctor` se ejecuta como la comprobación final de actualización segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza plugins con el canal activo. Dev usa plugins incluidos; stable y beta usan npm. Actualiza instalaciones de plugins rastreadas.
  </Step>
</Steps>

En el canal de actualización beta, las instalaciones de plugins npm y ClawHub rastreadas que siguen
la línea default/latest intentan primero una versión `@beta` del plugin. Si el plugin no tiene
versión beta, OpenClaw recurre a la spec default/latest registrada e informa
eso como una advertencia. Para plugins npm, OpenClaw también recurre al fallback cuando el paquete
beta existe pero falla la validación de instalación. Estas advertencias de fallback de plugins no
hacen que falle la actualización del núcleo. Las versiones exactas y etiquetas explícitas no se
reescriben.

<Warning>
Si una actualización de plugin npm fijada exactamente se resuelve a un artefacto cuya integridad difiere del registro de instalación almacenado, `openclaw update` aborta esa actualización de artefacto de plugin en lugar de instalarlo. Reinstala o actualiza el plugin explícitamente solo después de verificar que confías en el nuevo artefacto.
</Warning>

<Note>
Los fallos de sincronización de plugins posteriores a la actualización que están acotados a un plugin administrado se informan como advertencias después de que la actualización del núcleo se complete correctamente. El resultado JSON mantiene el `status: "ok"` de actualización de nivel superior e informa `postUpdate.plugins.status: "warning"` con orientación de `openclaw doctor --fix` y `openclaw plugins inspect <id> --runtime --json`. Las excepciones inesperadas del actualizador o de sincronización siguen haciendo fallar el resultado de la actualización. Corrige la instalación del plugin o el error de actualización y luego vuelve a ejecutar `openclaw doctor --fix` o `openclaw update`.

Cuando el Gateway actualizado se inicia, la carga de plugins es solo de verificación: el arranque no ejecuta gestores de paquetes ni muta árboles de dependencias. Los reinicios de `update.run` mediante gestor de paquetes omiten la diferición normal por inactividad y el periodo de espera de reinicio después de que el árbol de paquetes se ha intercambiado, por lo que el proceso antiguo no puede seguir cargando de forma diferida fragmentos eliminados.

Si el arranque de pnpm sigue fallando, el actualizador se detiene pronto con un error específico del gestor de paquetes en lugar de intentar `npm run build` dentro del checkout.
</Note>

## Abreviatura `--update`

`openclaw --update` se reescribe como `openclaw update` (útil para shells y scripts de lanzamiento).

## Relacionado

- `openclaw doctor` (ofrece ejecutar update primero en checkouts de git)
- [Canales de desarrollo](/es/install/development-channels)
- [Actualización](/es/install/updating)
- [Referencia de CLI](/es/cli)
