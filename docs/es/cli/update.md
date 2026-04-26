---
read_when:
    - Quieres actualizar una copia del código fuente de forma segura
    - Necesitas entender el comportamiento abreviado de `--update`
summary: Referencia de la CLI para `openclaw update` (actualización de código fuente relativamente segura + reinicio automático del gateway)
title: Actualizar
x-i18n:
    generated_at: "2026-04-26T11:26:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e86e7f8ffbf3f4ccd0787ba06aead35cb96e8db98c5d32c99b18ef9fda62efd6
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Actualiza OpenClaw de forma segura y cambia entre los canales stable/beta/dev.

Si instalaste mediante **npm/pnpm/bun** (instalación global, sin metadatos de git),
las actualizaciones se realizan mediante el flujo del gestor de paquetes en [Updating](/es/install/updating).

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
- `--tag <dist-tag|version|spec>`: sobrescribe el objetivo del paquete solo para esta actualización. Para instalaciones de paquetes, `main` se asigna a `github:openclaw/openclaw#main`.
- `--dry-run`: muestra una vista previa de las acciones de actualización planificadas (canal/etiqueta/objetivo/flujo de reinicio) sin escribir configuración, instalar, sincronizar plugins ni reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legible por máquina, incluido `postUpdate.plugins.integrityDrifts` cuando se detecta deriva de artefactos de plugins npm durante la sincronización de plugins posterior a la actualización.
- `--timeout <seconds>`: tiempo de espera por paso (el valor predeterminado es 1800 s).
- `--yes`: omite las solicitudes de confirmación (por ejemplo, confirmación de degradación)

Nota: las degradaciones requieren confirmación porque las versiones anteriores pueden romper la configuración.

## `update status`

Muestra el canal de actualización activo + la etiqueta/rama/SHA de git (para copias del código fuente), además de la disponibilidad de actualizaciones.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opciones:

- `--json`: imprime JSON de estado legible por máquina.
- `--timeout <seconds>`: tiempo de espera para las comprobaciones (predeterminado: 3 s).

## `update wizard`

Flujo interactivo para elegir un canal de actualización y confirmar si se debe reiniciar el Gateway después de actualizar (de forma predeterminada se reinicia). Si seleccionas `dev` sin una copia de git, ofrece crear una.

Opciones:

- `--timeout <seconds>`: tiempo de espera para cada paso de la actualización (predeterminado `1800`)

## Qué hace

Cuando cambias de canal explícitamente (`--channel ...`), OpenClaw también mantiene alineado el método de instalación:

- `dev` → garantiza una copia de git (predeterminado: `~/openclaw`, se puede sobrescribir con `OPENCLAW_GIT_DIR`), la actualiza e instala la CLI global desde esa copia.
- `stable` → instala desde npm usando `latest`.
- `beta` → prefiere la dist-tag npm `beta`, pero recurre a `latest` cuando falta beta o es más antigua que la versión stable actual.

El autoactualizador del núcleo de Gateway (cuando está habilitado mediante configuración) reutiliza esta misma ruta de actualización.

Para instalaciones del gestor de paquetes, `openclaw update` resuelve la versión objetivo del paquete antes de invocar al gestor de paquetes. Incluso cuando la versión instalada ya coincide con el objetivo, el comando actualiza la instalación global del paquete y luego ejecuta la sincronización de plugins, la actualización de autocompletado y el reinicio. Esto mantiene alineados los sidecars empaquetados y los registros de plugins propiedad del canal con la compilación instalada de OpenClaw.

## Flujo de copia de git

Canales:

- `stable`: cambia a la etiqueta no beta más reciente y luego ejecuta build + `doctor`.
- `beta`: prefiere la etiqueta `-beta` más reciente, pero recurre a la etiqueta stable más reciente cuando falta beta o es más antigua.
- `dev`: cambia a `main` y luego hace fetch + rebase.

Resumen de alto nivel:

1. Requiere un árbol de trabajo limpio (sin cambios sin confirmar).
2. Cambia al canal seleccionado (etiqueta o rama).
3. Obtiene cambios de upstream (solo dev).
4. Solo dev: ejecuta una comprobación previa de lint + compilación TypeScript en un árbol de trabajo temporal; si la punta falla, retrocede hasta 10 commits para encontrar la compilación limpia más reciente.
5. Hace rebase sobre el commit seleccionado (solo dev).
6. Instala las dependencias con el gestor de paquetes del repositorio. Para copias con pnpm, el actualizador inicializa `pnpm` bajo demanda (primero mediante `corepack`, luego con una alternativa temporal `npm install pnpm@10`) en lugar de ejecutar `npm run build` dentro de un espacio de trabajo pnpm.
7. Ejecuta build + build de la Control UI.
8. Ejecuta `openclaw doctor` como comprobación final de “actualización segura”.
9. Sincroniza los plugins con el canal activo (dev usa plugins incluidos; stable/beta usa npm) y actualiza los plugins instalados desde npm.

Si una actualización exacta fijada de un plugin npm se resuelve a un artefacto cuya integridad difiere del registro de instalación almacenado, `openclaw update` aborta esa actualización del artefacto del plugin en lugar de instalarlo. Reinstala o actualiza el plugin explícitamente solo después de verificar que confías en el nuevo artefacto.

Los errores en la sincronización de plugins posterior a la actualización hacen fallar el resultado de la actualización y detienen las tareas posteriores de reinicio. Corrige el error de instalación/actualización del plugin y luego vuelve a ejecutar `openclaw update`.

Si la inicialización de pnpm sigue fallando, el actualizador ahora se detiene antes con un error específico del gestor de paquetes en lugar de intentar `npm run build` dentro de la copia.

## Forma abreviada `--update`

`openclaw --update` se reescribe como `openclaw update` (útil para shells y scripts de lanzamiento).

## Relacionado

- `openclaw doctor` (ofrece ejecutar primero la actualización en copias de git)
- [Development channels](/es/install/development-channels)
- [Updating](/es/install/updating)
- [CLI reference](/es/cli)
