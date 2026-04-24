---
read_when:
    - Quieres actualizar un checkout del código fuente de forma segura
    - Necesitas entender el comportamiento abreviado de `--update`
summary: Referencia de la CLI para `openclaw update` (actualización del código fuente relativamente segura + reinicio automático del Gateway)
title: Actualizar
x-i18n:
    generated_at: "2026-04-24T05:24:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab28ae6fe91c094826ccbd9fa11c5d7c41849cc95d570a634a0721b82f0e3a
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

- `--no-restart`: omite reiniciar el servicio Gateway después de una actualización exitosa.
- `--channel <stable|beta|dev>`: establece el canal de actualización (git + npm; se conserva en la configuración).
- `--tag <dist-tag|version|spec>`: sobrescribe el destino del paquete solo para esta actualización. Para instalaciones por paquete, `main` se asigna a `github:openclaw/openclaw#main`.
- `--dry-run`: previsualiza las acciones de actualización planificadas (canal/tag/destino/flujo de reinicio) sin escribir configuración, instalar, sincronizar Plugins ni reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legible por máquina, incluidos
  `postUpdate.plugins.integrityDrifts` cuando se detecta deriva de integridad de artefactos de Plugins npm durante la sincronización posterior a la actualización.
- `--timeout <seconds>`: timeout por paso (predeterminado: 1200 s).
- `--yes`: omite las solicitudes de confirmación (por ejemplo, confirmación de downgrade)

Nota: los downgrades requieren confirmación porque las versiones antiguas pueden romper la configuración.

## `update status`

Muestra el canal de actualización activo + etiqueta/rama/SHA de git (para checkouts del código fuente), además de la disponibilidad de actualizaciones.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opciones:

- `--json`: imprime JSON de estado legible por máquina.
- `--timeout <seconds>`: timeout para las comprobaciones (predeterminado: 3 s).

## `update wizard`

Flujo interactivo para elegir un canal de actualización y confirmar si se debe reiniciar el Gateway
después de actualizar (el valor predeterminado es reiniciar). Si seleccionas `dev` sin un checkout de git,
ofrece crear uno.

Opciones:

- `--timeout <seconds>`: timeout para cada paso de actualización (predeterminado `1200`)

## Qué hace

Cuando cambias explícitamente de canal (`--channel ...`), OpenClaw también mantiene alineado
el método de instalación:

- `dev` → garantiza un checkout de git (predeterminado: `~/openclaw`, se sobrescribe con `OPENCLAW_GIT_DIR`),
  lo actualiza e instala la CLI global desde ese checkout.
- `stable` → instala desde npm usando `latest`.
- `beta` → prefiere la etiqueta npm dist-tag `beta`, pero recurre a `latest` cuando beta
  falta o es más antigua que la versión stable actual.

El actualizador automático del núcleo Gateway (cuando está habilitado mediante configuración) reutiliza esta misma ruta de actualización.

Para instalaciones mediante gestor de paquetes, `openclaw update` resuelve la versión
objetivo del paquete antes de invocar el gestor de paquetes. Si la versión instalada coincide
exactamente con el objetivo y no es necesario conservar ningún cambio de canal de actualización, el
comando sale como omitido antes de la instalación del paquete, la sincronización de Plugins, la actualización de finalización o el reinicio del Gateway.

## Flujo de checkout de git

Canales:

- `stable`: hace checkout de la etiqueta no beta más reciente, luego build + doctor.
- `beta`: prefiere la etiqueta `-beta` más reciente, pero recurre a la etiqueta stable más reciente
  cuando beta falta o es más antigua.
- `dev`: hace checkout de `main`, luego fetch + rebase.

Nivel general:

1. Requiere un worktree limpio (sin cambios no confirmados).
2. Cambia al canal seleccionado (etiqueta o rama).
3. Hace fetch de upstream (solo dev).
4. Solo dev: ejecuta una comprobación previa de lint + build de TypeScript en un worktree temporal; si la punta falla, retrocede hasta 10 commits para encontrar la build limpia más reciente.
5. Hace rebase sobre el commit seleccionado (solo dev).
6. Instala dependencias con el gestor de paquetes del repositorio. Para checkouts con pnpm, el actualizador inicializa `pnpm` bajo demanda (primero mediante `corepack`, luego con un fallback temporal `npm install pnpm@10`) en lugar de ejecutar `npm run build` dentro de un espacio de trabajo pnpm.
7. Ejecuta build + build de la interfaz de usuario Control.
8. Ejecuta `openclaw doctor` como verificación final de “actualización segura”.
9. Sincroniza los Plugins con el canal activo (dev usa Plugins incluidos; stable/beta usa npm) y actualiza los Plugins instalados con npm.

Si una actualización exacta de un Plugin npm anclado resuelve un artefacto cuya integridad
difiere del registro de instalación almacenado, `openclaw update` aborta la actualización de ese artefacto de Plugin en lugar de instalarlo. Reinstala o actualiza el Plugin
explícitamente solo después de verificar que confías en el nuevo artefacto.

Si la inicialización de pnpm sigue fallando, el actualizador ahora se detiene antes con un error específico del gestor de paquetes en lugar de intentar `npm run build` dentro del checkout.

## Abreviatura `--update`

`openclaw --update` se reescribe como `openclaw update` (útil para shells y scripts de lanzamiento).

## Relacionado

- `openclaw doctor` (ofrece ejecutar primero update en checkouts de git)
- [Canales de desarrollo](/es/install/development-channels)
- [Updating](/es/install/updating)
- [Referencia de CLI](/es/cli)
