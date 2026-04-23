---
read_when:
    - Quieres actualizar de forma segura un repositorio clonado desde código fuente
    - Necesitas entender el comportamiento abreviado de `--update`
summary: Referencia de CLI para `openclaw update` (actualización de código fuente relativamente segura + reinicio automático del Gateway)
title: actualizar
x-i18n:
    generated_at: "2026-04-23T14:02:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: abcfbd2fb66f560f2c6e9d78d37355510d78946eaeafa17d67fe36bc158ad5cd
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Actualiza OpenClaw de forma segura y cambia entre canales stable/beta/dev.

Si instalaste mediante **npm/pnpm/bun** (instalación global, sin metadatos de git),
las actualizaciones se realizan mediante el flujo del gestor de paquetes descrito en [Actualización](/es/install/updating).

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

- `--no-restart`: omite el reinicio del servicio Gateway después de una actualización correcta.
- `--channel <stable|beta|dev>`: establece el canal de actualización (git + npm; se conserva en la configuración).
- `--tag <dist-tag|version|spec>`: sobrescribe el destino del paquete solo para esta actualización. Para instalaciones de paquete, `main` se asigna a `github:openclaw/openclaw#main`.
- `--dry-run`: previsualiza las acciones de actualización planificadas (canal/etiqueta/destino/flujo de reinicio) sin escribir configuración, instalar, sincronizar Plugins ni reiniciar.
- `--json`: imprime JSON legible por máquina de `UpdateRunResult`, incluido
  `postUpdate.plugins.integrityDrifts` cuando se detecta deriva de integridad de
  artefactos de Plugin de npm durante la sincronización de Plugins posterior a la actualización.
- `--timeout <seconds>`: tiempo de espera por paso (el valor predeterminado es 1200 s).
- `--yes`: omite las solicitudes de confirmación (por ejemplo, la confirmación de degradación)

Nota: las degradaciones requieren confirmación porque las versiones antiguas pueden romper la configuración.

## `update status`

Muestra el canal de actualización activo + etiqueta/rama/SHA de git (para repositorios clonados desde código fuente), además de la disponibilidad de actualizaciones.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opciones:

- `--json`: imprime JSON de estado legible por máquina.
- `--timeout <seconds>`: tiempo de espera para las comprobaciones (predeterminado: 3 s).

## `update wizard`

Flujo interactivo para elegir un canal de actualización y confirmar si se debe reiniciar el Gateway
después de actualizar (el valor predeterminado es reiniciar). Si seleccionas `dev` sin un repositorio git clonado,
ofrece crear uno.

Opciones:

- `--timeout <seconds>`: tiempo de espera para cada paso de actualización (predeterminado `1200`)

## Qué hace

Cuando cambias de canal explícitamente (`--channel ...`), OpenClaw también mantiene
alineado el método de instalación:

- `dev` → garantiza un repositorio git clonado (predeterminado: `~/openclaw`, sobrescritura con `OPENCLAW_GIT_DIR`),
  lo actualiza e instala la CLI global desde ese repositorio.
- `stable` → instala desde npm usando `latest`.
- `beta` → prefiere la dist-tag `beta` de npm, pero recurre a `latest` cuando `beta`
  falta o es más antigua que la versión stable actual.

El autoactualizador del núcleo del Gateway (cuando está habilitado mediante configuración) reutiliza esta misma ruta de actualización.

Para instalaciones mediante gestor de paquetes, `openclaw update` resuelve la versión
objetivo del paquete antes de invocar el gestor de paquetes. Si la versión instalada coincide exactamente
con el objetivo y no es necesario conservar ningún cambio de canal de actualización, el
comando termina como omitido antes de la instalación del paquete, la sincronización de Plugins, la actualización de finalización
o el trabajo de reinicio del Gateway.

## Flujo para repositorios git clonados

Canales:

- `stable`: cambia a la etiqueta no beta más reciente y luego ejecuta build + doctor.
- `beta`: prefiere la etiqueta `-beta` más reciente, pero recurre a la etiqueta stable más reciente
  cuando falta `beta` o es más antigua.
- `dev`: cambia a `main` y luego hace fetch + rebase.

Resumen:

1. Requiere un árbol de trabajo limpio (sin cambios sin confirmar).
2. Cambia al canal seleccionado (etiqueta o rama).
3. Hace fetch del upstream (solo `dev`).
4. Solo `dev`: ejecuta un lint preventivo + compilación de TypeScript en un árbol de trabajo temporal; si la punta falla, retrocede hasta 10 commits para encontrar la compilación limpia más reciente.
5. Hace rebase sobre el commit seleccionado (solo `dev`).
6. Instala dependencias con el gestor de paquetes del repositorio. Para repositorios con pnpm, el actualizador prepara `pnpm` bajo demanda (primero mediante `corepack`, luego con una alternativa temporal `npm install pnpm@10`) en lugar de ejecutar `npm run build` dentro de un espacio de trabajo pnpm.
7. Ejecuta la build + la build de la UI de Control.
8. Ejecuta `openclaw doctor` como comprobación final de “actualización segura”.
9. Sincroniza los Plugins con el canal activo (`dev` usa Plugins integrados; `stable`/`beta` usan npm) y actualiza los Plugins instalados desde npm.

Si una actualización exacta de un Plugin de npm fijado resuelve a un artefacto cuya integridad
difiere del registro de instalación almacenado, `openclaw update` aborta esa actualización
del artefacto del Plugin en lugar de instalarlo. Reinstala o actualiza el Plugin
explícitamente solo después de verificar que confías en el nuevo artefacto.

Si la preparación de pnpm sigue fallando, el actualizador ahora se detiene antes con un error específico del gestor de paquetes en lugar de intentar `npm run build` dentro del repositorio.

## Forma abreviada `--update`

`openclaw --update` se reescribe como `openclaw update` (útil para shells y scripts de lanzamiento).

## Véase también

- `openclaw doctor` (ofrece ejecutar primero la actualización en repositorios git clonados)
- [Canales de desarrollo](/es/install/development-channels)
- [Actualización](/es/install/updating)
- [Referencia de CLI](/es/cli)
