---
read_when:
    - Quieres actualizar una copia de trabajo del código fuente de forma segura
    - Debes comprender el comportamiento abreviado de `--update`
summary: Referencia de CLI para `openclaw update` (actualización de fuente relativamente segura + reinicio automático del Gateway)
title: Actualizar
x-i18n:
    generated_at: "2026-05-02T05:23:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc88dc7963f1ae7d847a573924e9af7ede207f2f20028a18808116de4912d24e
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Actualiza OpenClaw de forma segura y cambia entre los canales stable/beta/dev.

Si instalaste mediante **npm/pnpm/bun** (instalación global, sin metadatos de git),
las actualizaciones se realizan mediante el flujo del administrador de paquetes en [Actualización](/es/install/updating).

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

- `--no-restart`: omite el reinicio del servicio Gateway después de una actualización correcta. Las actualizaciones del administrador de paquetes que sí reinician el Gateway verifican que el servicio reiniciado informe la versión actualizada esperada antes de que el comando se complete correctamente.
- `--channel <stable|beta|dev>`: establece el canal de actualización (git + npm; se conserva en la configuración).
- `--tag <dist-tag|version|spec>`: reemplaza el objetivo del paquete solo para esta actualización. Para instalaciones de paquete, `main` se asigna a `github:openclaw/openclaw#main`.
- `--dry-run`: previsualiza las acciones de actualización planificadas (canal/etiqueta/objetivo/flujo de reinicio) sin escribir configuración, instalar, sincronizar Plugins ni reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legible por máquina, incluido
  `postUpdate.plugins.integrityDrifts` cuando se detecta deriva de artefactos de Plugins de npm
  durante la sincronización de Plugins posterior a la actualización.
- `--timeout <seconds>`: tiempo de espera por paso (el valor predeterminado es 1800 s).
- `--yes`: omite las solicitudes de confirmación (por ejemplo, la confirmación de degradación de versión).

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

Flujo interactivo para elegir un canal de actualización y confirmar si se debe reiniciar el Gateway
después de actualizar (el valor predeterminado es reiniciar). Si seleccionas `dev` sin un checkout de git, ofrece crear uno.

Opciones:

- `--timeout <seconds>`: tiempo de espera para cada paso de actualización (valor predeterminado `1800`)

## Qué hace

Cuando cambias de canal explícitamente (`--channel ...`), OpenClaw también mantiene alineado el
método de instalación:

- `dev` → garantiza un checkout de git (valor predeterminado: `~/openclaw`, se puede reemplazar con `OPENCLAW_GIT_DIR`),
  lo actualiza e instala la CLI global desde ese checkout.
- `stable` → instala desde npm usando `latest`.
- `beta` → prefiere la etiqueta de distribución de npm `beta`, pero recurre a `latest` cuando beta falta
  o es anterior a la versión stable actual.

El actualizador automático del núcleo del Gateway (cuando está habilitado mediante la configuración) lanza la ruta de actualización de la CLI
fuera del manejador de solicitudes del Gateway activo. Las actualizaciones del administrador de paquetes `update.run` del plano de control
fuerzan un reinicio de actualización sin aplazamiento y sin periodo de enfriamiento después del intercambio de paquetes,
porque el proceso Gateway antiguo aún puede tener fragmentos en memoria que apuntan a
archivos eliminados por el paquete nuevo.

Para instalaciones mediante administrador de paquetes, `openclaw update` resuelve la versión del paquete objetivo
antes de invocar el administrador de paquetes. Las instalaciones globales de npm usan una instalación por etapas:
OpenClaw instala el paquete nuevo en un prefijo temporal de npm, verifica allí el inventario `dist`
empaquetado y luego intercambia ese árbol de paquetes limpio en el prefijo global real. Si la verificación falla,
el doctor posterior a la actualización, la sincronización de Plugins y el trabajo de reinicio no se ejecutan desde
el árbol sospechoso. Incluso cuando la versión instalada ya coincide con el objetivo, el comando actualiza
la instalación global del paquete y luego ejecuta la sincronización de Plugins, una actualización de finalización de comandos del núcleo
y el trabajo de reinicio. Esto mantiene los sidecars empaquetados y los registros de Plugins propiedad del canal alineados con la
compilación de OpenClaw instalada, mientras deja las reconstrucciones completas de finalización de comandos de Plugins para
ejecuciones explícitas de `openclaw completion --write-state`.

Cuando hay instalado un servicio Gateway administrado local y el reinicio está habilitado,
las actualizaciones del administrador de paquetes detienen el servicio en ejecución antes de reemplazar el árbol de paquetes,
luego actualizan los metadatos del servicio desde la instalación actualizada, reinician el
servicio y verifican que el Gateway reiniciado informe la versión esperada. Con
`--no-restart`, el reemplazo del paquete sigue ejecutándose, pero el servicio administrado no se
detiene ni se reinicia, por lo que el Gateway en ejecución puede conservar el código anterior hasta que lo reinicies
manualmente.

## Flujo de checkout de git

### Selección de canal

- `stable`: hace checkout de la etiqueta no beta más reciente y luego compila y ejecuta doctor.
- `beta`: prefiere la etiqueta `-beta` más reciente, pero recurre a la etiqueta stable más reciente cuando beta falta o es anterior.
- `dev`: hace checkout de `main` y luego obtiene cambios y hace rebase.

### Pasos de actualización

<Steps>
  <Step title="Verificar árbol de trabajo limpio">
    Requiere que no haya cambios sin confirmar.
  </Step>
  <Step title="Cambiar canal">
    Cambia al canal seleccionado (etiqueta o rama).
  </Step>
  <Step title="Obtener cambios upstream">
    Solo dev.
  </Step>
  <Step title="Compilación previa (solo dev)">
    Ejecuta lint y la compilación de TypeScript en un árbol de trabajo temporal. Si la punta falla, retrocede hasta 10 commits para encontrar la compilación limpia más reciente.
  </Step>
  <Step title="Rebase">
    Hace rebase sobre el commit seleccionado (solo dev).
  </Step>
  <Step title="Instalar dependencias">
    Usa el administrador de paquetes del repo. Para checkouts de pnpm, el actualizador inicializa `pnpm` bajo demanda (primero mediante `corepack`, luego con una alternativa temporal `npm install pnpm@10`) en lugar de ejecutar `npm run build` dentro de un workspace de pnpm.
  </Step>
  <Step title="Compilar la interfaz de Control">
    Compila el gateway y la interfaz de Control.
  </Step>
  <Step title="Ejecutar doctor">
    `openclaw doctor` se ejecuta como la comprobación final de actualización segura.
  </Step>
  <Step title="Sincronizar Plugins">
    Sincroniza Plugins con el canal activo. Dev usa Plugins incluidos; stable y beta usan npm. Actualiza Plugins instalados desde npm.
  </Step>
</Steps>

<Warning>
Si una actualización exacta fijada de un Plugin de npm se resuelve a un artefacto cuya integridad difiere del registro de instalación almacenado, `openclaw update` aborta esa actualización de artefacto de Plugin en lugar de instalarla. Reinstala o actualiza el Plugin explícitamente solo después de verificar que confías en el artefacto nuevo.
</Warning>

<Note>
Los errores de sincronización de Plugins posteriores a la actualización hacen fallar el resultado de la actualización y detienen el trabajo de reinicio posterior. Corrige la instalación del Plugin o el error de actualización y luego vuelve a ejecutar `openclaw update`.

Cuando se inicia el Gateway actualizado, la carga de Plugins es solo de verificación: el inicio no ejecuta administradores de paquetes ni muta árboles de dependencias. Los reinicios `update.run` del administrador de paquetes omiten el aplazamiento normal por inactividad y el periodo de enfriamiento de reinicio después de que se ha intercambiado el árbol de paquetes, por lo que el proceso anterior no puede seguir cargando de forma diferida fragmentos eliminados.

Si la inicialización de pnpm sigue fallando, el actualizador se detiene temprano con un error específico del administrador de paquetes en lugar de intentar `npm run build` dentro del checkout.
</Note>

## Abreviatura `--update`

`openclaw --update` se reescribe como `openclaw update` (útil para shells y scripts de lanzamiento).

## Relacionado

- `openclaw doctor` (ofrece ejecutar primero la actualización en checkouts de git)
- [Canales de desarrollo](/es/install/development-channels)
- [Actualización](/es/install/updating)
- [Referencia de la CLI](/es/cli)
