---
read_when:
    - Quieres actualizar una copia de trabajo del código fuente de forma segura
    - Debes comprender el comportamiento de la forma abreviada `--update`
summary: Referencia de CLI para `openclaw update` (actualización de origen relativamente segura + reinicio automático de Gateway)
title: Actualizar
x-i18n:
    generated_at: "2026-05-02T20:45:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35df8c6d8b1adb9597377f6e2b4844352577992c12636a88b3f3c1854dc0666b
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

- `--no-restart`: omite el reinicio del servicio Gateway después de una actualización correcta. Las actualizaciones mediante gestor de paquetes que sí reinician el Gateway verifican que el servicio reiniciado informe la versión actualizada esperada antes de que el comando se complete correctamente.
- `--channel <stable|beta|dev>`: establece el canal de actualización (git + npm; se conserva en la configuración).
- `--tag <dist-tag|version|spec>`: sobrescribe el paquete de destino solo para esta actualización. En instalaciones de paquetes, `main` se asigna a `github:openclaw/openclaw#main`.
- `--dry-run`: previsualiza las acciones de actualización planificadas (canal/etiqueta/destino/flujo de reinicio) sin escribir la configuración, instalar, sincronizar plugins ni reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legible por máquina, incluido
  `postUpdate.plugins.integrityDrifts` cuando se detecta deriva de artefactos de plugins npm
  durante la sincronización de plugins posterior a la actualización.
- `--timeout <seconds>`: tiempo de espera por paso (el valor predeterminado es 1800s).
- `--yes`: omite las solicitudes de confirmación (por ejemplo, la confirmación de degradación).

<Warning>
Las degradaciones requieren confirmación porque las versiones anteriores pueden romper la configuración.
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
- `--timeout <seconds>`: tiempo de espera para las comprobaciones (el valor predeterminado es 3s).

## `update wizard`

Flujo interactivo para elegir un canal de actualización y confirmar si se reiniciará el Gateway
después de actualizar (el valor predeterminado es reiniciar). Si seleccionas `dev` sin un checkout de git,
ofrece crear uno.

Opciones:

- `--timeout <seconds>`: tiempo de espera para cada paso de actualización (valor predeterminado `1800`)

## Qué hace

Cuando cambias de canal explícitamente (`--channel ...`), OpenClaw también mantiene alineado el
método de instalación:

- `dev` → garantiza un checkout de git (valor predeterminado: `~/openclaw`, se puede sobrescribir con `OPENCLAW_GIT_DIR`),
  lo actualiza e instala la CLI global desde ese checkout.
- `stable` → instala desde npm usando `latest`.
- `beta` → prefiere la dist-tag `beta` de npm, pero recurre a `latest` cuando beta falta
  o es anterior a la versión estable actual.

El autoactualizador del núcleo del Gateway (cuando está habilitado mediante configuración) inicia la ruta de actualización de la CLI
fuera del manejador de solicitudes del Gateway activo. Las actualizaciones de gestor de paquetes `update.run` del plano de control
fuerzan un reinicio de actualización no diferido y sin periodo de enfriamiento después del intercambio de paquetes,
porque el proceso Gateway anterior aún puede tener en memoria fragmentos que apuntan a
archivos eliminados por el paquete nuevo.

Para instalaciones mediante gestor de paquetes, `openclaw update` resuelve la versión del paquete
de destino antes de invocar el gestor de paquetes. Las instalaciones globales de npm usan una instalación por etapas:
OpenClaw instala el paquete nuevo en un prefijo temporal de npm, verifica allí
el inventario `dist` empaquetado y luego intercambia ese árbol de paquetes limpio en el
prefijo global real. Si la verificación falla, el doctor posterior a la actualización, la sincronización de plugins y
el trabajo de reinicio no se ejecutan desde el árbol sospechoso. Incluso cuando la versión instalada
ya coincide con el destino, el comando actualiza la instalación global del paquete
y luego ejecuta la sincronización de plugins, una actualización de finalización de comandos del núcleo y el trabajo de reinicio. Esto
mantiene alineados los componentes auxiliares empaquetados y los registros de plugins propiedad del canal con la
compilación instalada de OpenClaw, mientras deja las reconstrucciones completas de finalización de comandos de plugins para
ejecuciones explícitas de `openclaw completion --write-state`.

Cuando hay un servicio Gateway local administrado instalado y el reinicio está habilitado,
las actualizaciones mediante gestor de paquetes detienen el servicio en ejecución antes de reemplazar el árbol de paquetes,
luego actualizan los metadatos del servicio desde la instalación actualizada, reinician el
servicio y verifican que el Gateway reiniciado informe la versión esperada. Con
`--no-restart`, el reemplazo del paquete todavía se ejecuta, pero el servicio administrado no se
detiene ni reinicia, por lo que el Gateway en ejecución puede conservar código anterior hasta que lo reinicies
manualmente.

## Flujo de checkout de git

### Selección de canal

- `stable`: extrae la última etiqueta que no sea beta y luego compila y ejecuta doctor.
- `beta`: prefiere la última etiqueta `-beta`, pero recurre a la última etiqueta estable cuando beta falta o es anterior.
- `dev`: extrae `main` y luego hace fetch y rebase.

### Pasos de actualización

<Steps>
  <Step title="Verificar árbol de trabajo limpio">
    Requiere que no haya cambios sin confirmar.
  </Step>
  <Step title="Cambiar canal">
    Cambia al canal seleccionado (etiqueta o rama).
  </Step>
  <Step title="Obtener upstream">
    Solo para dev.
  </Step>
  <Step title="Compilación de comprobación previa (solo dev)">
    Ejecuta lint y la compilación de TypeScript en un árbol de trabajo temporal. Si la punta falla, retrocede hasta 10 commits para encontrar la compilación limpia más reciente.
  </Step>
  <Step title="Rebase">
    Hace rebase sobre el commit seleccionado (solo dev).
  </Step>
  <Step title="Instalar dependencias">
    Usa el gestor de paquetes del repositorio. En checkouts de pnpm, el actualizador inicializa `pnpm` bajo demanda (primero mediante `corepack` y luego con una alternativa temporal `npm install pnpm@10`) en lugar de ejecutar `npm run build` dentro de un espacio de trabajo pnpm.
  </Step>
  <Step title="Compilar Control UI">
    Compila el gateway y la Control UI.
  </Step>
  <Step title="Ejecutar doctor">
    `openclaw doctor` se ejecuta como comprobación final de actualización segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza plugins con el canal activo. Dev usa plugins incluidos; stable y beta usan npm. Actualiza las instalaciones de plugins con seguimiento.
  </Step>
</Steps>

En el canal de actualización beta, las instalaciones de plugins npm y ClawHub con seguimiento que siguen
la línea predeterminada/latest prueban primero una versión `@beta` del plugin. Si el plugin no tiene
versión beta, OpenClaw recurre a la especificación predeterminada/latest registrada. Las versiones exactas
y las etiquetas explícitas no se reescriben.

<Warning>
Si una actualización de plugin npm anclada a una versión exacta se resuelve a un artefacto cuya integridad difiere del registro de instalación almacenado, `openclaw update` aborta esa actualización del artefacto del plugin en lugar de instalarlo. Reinstala o actualiza el plugin explícitamente solo después de verificar que confías en el nuevo artefacto.
</Warning>

<Note>
Los errores de sincronización de plugins posteriores a la actualización hacen fallar el resultado de la actualización y detienen el trabajo de reinicio posterior. Corrige el error de instalación o actualización del plugin y luego vuelve a ejecutar `openclaw update`.

Cuando el Gateway actualizado se inicia, la carga de plugins es solo de verificación: el inicio no ejecuta gestores de paquetes ni muta árboles de dependencias. Los reinicios `update.run` mediante gestor de paquetes omiten la diferición normal por inactividad y el periodo de enfriamiento de reinicio después de que el árbol de paquetes se haya intercambiado, por lo que el proceso anterior no puede seguir cargando de forma diferida fragmentos eliminados.

Si la inicialización de pnpm todavía falla, el actualizador se detiene pronto con un error específico del gestor de paquetes en lugar de intentar `npm run build` dentro del checkout.
</Note>

## Abreviatura `--update`

`openclaw --update` se reescribe como `openclaw update` (útil para shells y scripts de inicio).

## Relacionado

- `openclaw doctor` (ofrece ejecutar primero update en checkouts de git)
- [Canales de desarrollo](/es/install/development-channels)
- [Actualización](/es/install/updating)
- [Referencia de la CLI](/es/cli)
