---
read_when:
    - Desea actualizar una copia de trabajo del código fuente de forma segura
    - Debe comprender el comportamiento de la forma abreviada `--update`
summary: Referencia de CLI para `openclaw update` (actualización de código fuente relativamente segura + reinicio automático del Gateway)
title: Actualizar
x-i18n:
    generated_at: "2026-04-30T05:35:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd4be6be8f6ae7df501f8bce3d208dd507ae5a1539f9772101cd844dcd93976
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Actualiza OpenClaw de forma segura y cambia entre los canales estable/beta/dev.

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
- `--tag <dist-tag|version|spec>`: sobrescribe el paquete de destino solo para esta actualización. Para instalaciones de paquetes, `main` se asigna a `github:openclaw/openclaw#main`.
- `--dry-run`: previsualiza las acciones de actualización planificadas (flujo de canal/tag/destino/reinicio) sin escribir configuración, instalar, sincronizar plugins ni reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legible por máquina, incluido
  `postUpdate.plugins.integrityDrifts` cuando se detecta una deriva de artefacto de plugin npm
  durante la sincronización de plugins posterior a la actualización.
- `--timeout <seconds>`: tiempo de espera por paso (el valor predeterminado es 1800s).
- `--yes`: omite los avisos de confirmación (por ejemplo, la confirmación de degradación de versión).

<Warning>
Las degradaciones de versión requieren confirmación porque las versiones anteriores pueden romper la configuración.
</Warning>

## `update status`

Muestra el canal de actualización activo + la etiqueta/rama/SHA de git (para checkouts de código fuente), además de la disponibilidad de actualizaciones.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opciones:

- `--json`: imprime JSON de estado legible por máquina.
- `--timeout <seconds>`: tiempo de espera para las comprobaciones (el valor predeterminado es 3s).

## `update wizard`

Flujo interactivo para elegir un canal de actualización y confirmar si se debe reiniciar el Gateway
después de actualizar (el valor predeterminado es reiniciar). Si seleccionas `dev` sin un checkout de git,
ofrece crear uno.

Opciones:

- `--timeout <seconds>`: tiempo de espera para cada paso de actualización (valor predeterminado `1800`)

## Qué hace

Cuando cambias de canal explícitamente (`--channel ...`), OpenClaw también mantiene
alineado el método de instalación:

- `dev` → asegura un checkout de git (valor predeterminado: `~/openclaw`, sobrescríbelo con `OPENCLAW_GIT_DIR`),
  lo actualiza e instala la CLI global desde ese checkout.
- `stable` → instala desde npm usando `latest`.
- `beta` → prefiere el dist-tag de npm `beta`, pero recurre a `latest` cuando beta
  falta o es anterior a la versión estable actual.

El actualizador automático del núcleo de Gateway (cuando está habilitado mediante configuración) reutiliza esta misma ruta de actualización.

Para instalaciones con gestor de paquetes, `openclaw update` resuelve la versión
del paquete de destino antes de invocar el gestor de paquetes. Las instalaciones globales de npm usan una instalación por etapas: OpenClaw instala el paquete nuevo en un prefijo temporal de npm, verifica allí el inventario de `dist` empaquetado y luego intercambia ese árbol de paquete limpio en el prefijo global real. Si la verificación falla, el doctor posterior a la actualización, la sincronización de plugins y el trabajo de reinicio no se ejecutan desde el árbol sospechoso. Incluso cuando la versión instalada ya coincide con el destino, el comando actualiza la instalación global del paquete y luego ejecuta la sincronización de plugins, una actualización de finalización de comandos principales y el trabajo de reinicio. Esto mantiene los sidecars empaquetados y los registros de plugins propiedad del canal alineados con la compilación instalada de OpenClaw, mientras deja las reconstrucciones completas de finalización de comandos de plugins para ejecuciones explícitas de `openclaw completion --write-state`.

Cuando hay instalado un servicio Gateway administrado local y el reinicio está habilitado,
las actualizaciones con gestor de paquetes detienen el servicio en ejecución antes de reemplazar el árbol del paquete, luego actualizan los metadatos del servicio desde la instalación actualizada, reinician el servicio y verifican que el Gateway reiniciado informe la versión esperada. Con `--no-restart`, el reemplazo del paquete se ejecuta de todos modos, pero el servicio administrado no se detiene ni se reinicia, por lo que el Gateway en ejecución puede conservar el código anterior hasta que lo reinicies manualmente.

## Flujo de checkout de git

### Selección de canal

- `stable`: hace checkout de la última etiqueta no beta, luego compila y ejecuta doctor.
- `beta`: prefiere la última etiqueta `-beta`, pero recurre a la última etiqueta estable cuando beta falta o es anterior.
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
    Ejecuta lint y la compilación de TypeScript en un árbol de trabajo temporal. Si la punta falla, retrocede hasta 10 commits para encontrar la compilación limpia más reciente.
  </Step>
  <Step title="Rebase">
    Hace rebase sobre el commit seleccionado (solo dev).
  </Step>
  <Step title="Instalar dependencias">
    Usa el gestor de paquetes del repositorio. Para checkouts de pnpm, el actualizador inicializa `pnpm` bajo demanda (primero mediante `corepack`, luego con una alternativa temporal `npm install pnpm@10`) en lugar de ejecutar `npm run build` dentro de un workspace pnpm.
  </Step>
  <Step title="Compilar Control UI">
    Compila el gateway y la Control UI.
  </Step>
  <Step title="Ejecutar doctor">
    `openclaw doctor` se ejecuta como comprobación final de actualización segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza plugins con el canal activo. Dev usa plugins incluidos; stable y beta usan npm. Actualiza plugins instalados desde npm.
  </Step>
</Steps>

<Warning>
Si una actualización exacta de plugin npm fijada resuelve a un artefacto cuya integridad difiere del registro de instalación almacenado, `openclaw update` cancela esa actualización de artefacto de plugin en lugar de instalarla. Reinstala o actualiza el plugin explícitamente solo después de verificar que confías en el artefacto nuevo.
</Warning>

<Note>
Los fallos de sincronización de plugins posteriores a la actualización hacen fallar el resultado de la actualización y detienen el trabajo de reinicio posterior. Corrige el error de instalación o actualización del plugin y luego vuelve a ejecutar `openclaw update`.

Cuando se inicia el Gateway actualizado, las dependencias de runtime de los plugins incluidos habilitados se preparan antes de la activación de plugins. Los reinicios disparados por actualización drenan cualquier preparación activa de dependencias de runtime antes de cerrar el Gateway, por lo que los reinicios del gestor de servicios no interrumpen una instalación npm en curso.

Si la inicialización de pnpm sigue fallando, el actualizador se detiene pronto con un error específico del gestor de paquetes en lugar de intentar `npm run build` dentro del checkout.
</Note>

## Abreviatura `--update`

`openclaw --update` se reescribe como `openclaw update` (útil para shells y scripts de lanzador).

## Relacionado

- `openclaw doctor` (ofrece ejecutar primero la actualización en checkouts de git)
- [Canales de desarrollo](/es/install/development-channels)
- [Actualización](/es/install/updating)
- [Referencia de CLI](/es/cli)
