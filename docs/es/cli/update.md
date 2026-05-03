---
read_when:
    - Quieres actualizar un checkout de código fuente de forma segura
    - Está depurando la salida u opciones de `openclaw update`
    - Debes comprender el comportamiento abreviado de `--update`
summary: Referencia de CLI para `openclaw update` (actualización desde el código fuente relativamente segura + reinicio automático de Gateway)
title: Actualizar
x-i18n:
    generated_at: "2026-05-03T21:29:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ec06b8db5e2aba4000922f92a36834e8782986a77f6b5889bb19031a59f1b8
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

- `--no-restart`: omite el reinicio del servicio Gateway después de una actualización correcta. Las actualizaciones del gestor de paquetes que sí reinician el Gateway verifican que el servicio reiniciado informe la versión actualizada esperada antes de que el comando se complete correctamente.
- `--channel <stable|beta|dev>`: establece el canal de actualización (git + npm; se conserva en la configuración).
- `--tag <dist-tag|version|spec>`: anula el destino del paquete solo para esta actualización. Para instalaciones de paquetes, `main` se asigna a `github:openclaw/openclaw#main`.
- `--dry-run`: previsualiza las acciones de actualización previstas (flujo de canal/tag/destino/reinicio) sin escribir configuración, instalar, sincronizar plugins ni reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legible por máquina, incluido
  `postUpdate.plugins.integrityDrifts` cuando se detecta una deriva de artefactos de plugins npm
  durante la sincronización de plugins posterior a la actualización.
- `--timeout <seconds>`: tiempo de espera por paso (el valor predeterminado es 1800s).
- `--yes`: omite los avisos de confirmación (por ejemplo, la confirmación de degradación).

`openclaw update` no tiene una bandera `--verbose`. Usa `--dry-run` para previsualizar
las acciones previstas de canal/tag/instalación/reinicio, `--json` para obtener
resultados legibles por máquina y `openclaw update status --json` cuando solo necesites
detalles de canal y disponibilidad. Si estás depurando registros del Gateway durante una actualización,
la verbosidad de consola y el nivel de registro de archivo son independientes: Gateway `--verbose` afecta
la salida de terminal/WebSocket, mientras que los registros de archivo requieren `logging.level: "debug"` o
`"trace"` en la configuración. Consulta [Registros de Gateway](/es/gateway/logging).

<Warning>
Las degradaciones requieren confirmación porque las versiones anteriores pueden romper la configuración.
</Warning>

## `update status`

Muestra el canal de actualización activo + tag/rama/SHA de git (para checkouts de código fuente), además de la disponibilidad de actualizaciones.

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
después de actualizar (el valor predeterminado es reiniciar). Si seleccionas `dev` sin un checkout de git, ofrece
crear uno.

Opciones:

- `--timeout <seconds>`: tiempo de espera para cada paso de actualización (valor predeterminado `1800`)

## Qué hace

Cuando cambias de canal explícitamente (`--channel ...`), OpenClaw también mantiene alineado el
método de instalación:

- `dev` → garantiza un checkout de git (valor predeterminado: `~/openclaw`, anulable con `OPENCLAW_GIT_DIR`),
  lo actualiza e instala la CLI global desde ese checkout.
- `stable` → instala desde npm usando `latest`.
- `beta` → prefiere el dist-tag de npm `beta`, pero vuelve a `latest` cuando beta
  no existe o es anterior a la versión estable actual.

El actualizador automático del núcleo de Gateway (cuando está habilitado mediante configuración) inicia la ruta de actualización de la CLI
fuera del controlador de solicitudes del Gateway en ejecución. Las actualizaciones de gestor de paquetes de `update.run` del plano de control
fuerzan un reinicio de actualización no diferido y sin periodo de enfriamiento después del reemplazo del paquete,
porque el proceso anterior de Gateway aún puede tener fragmentos en memoria que apuntan a
archivos eliminados por el nuevo paquete.

Para instalaciones con gestor de paquetes, `openclaw update` resuelve la versión del paquete de destino
antes de invocar el gestor de paquetes. Las instalaciones globales de npm usan una instalación por etapas:
OpenClaw instala el paquete nuevo en un prefijo temporal de npm, verifica allí
el inventario `dist` empaquetado y luego reemplaza el árbol de paquetes limpio en el
prefijo global real. Si la verificación falla, el doctor posterior a la actualización, la sincronización de plugins y
el reinicio no se ejecutan desde el árbol sospechoso. Incluso cuando la versión instalada
ya coincide con el destino, el comando actualiza la instalación global del paquete,
luego ejecuta la sincronización de plugins, una actualización de completado de comandos principales y el reinicio. Esto
mantiene los sidecars empaquetados y los registros de plugins propiedad del canal alineados con la
compilación instalada de OpenClaw, dejando las reconstrucciones completas de completado de comandos de plugins para
ejecuciones explícitas de `openclaw completion --write-state`.

Cuando un servicio local gestionado de Gateway está instalado y el reinicio está habilitado,
las actualizaciones del gestor de paquetes detienen el servicio en ejecución antes de reemplazar el árbol de paquetes,
luego actualizan los metadatos del servicio desde la instalación actualizada, reinician el
servicio y verifican que el Gateway reiniciado informe la versión esperada antes de
notificar el éxito. En macOS, la comprobación posterior a la actualización también verifica que el LaunchAgent
esté cargado/en ejecución para el perfil activo y que el puerto loopback configurado esté
saludable. Si el plist está instalado pero launchd no lo supervisa, OpenClaw
vuelve a arrancar el LaunchAgent automáticamente y luego vuelve a ejecutar las
comprobaciones de preparación de salud/versión/canal. Un arranque nuevo carga el trabajo RunAtLoad
directamente, por lo que la recuperación de actualización no ejecuta de inmediato `kickstart -k` en el Gateway
recién iniciado. Si el Gateway aún no llega a estar saludable, el comando sale
con un código distinto de cero e imprime la ruta del registro de reinicio, además de instrucciones explícitas de reinicio, reinstalación y
reversión del paquete. Con `--no-restart`,
el reemplazo del paquete se sigue ejecutando, pero el servicio gestionado no se detiene ni
reinicia, por lo que el Gateway en ejecución puede conservar el código anterior hasta que lo reinicies
manualmente.

## Flujo de checkout de git

### Selección de canal

- `stable`: hace checkout del tag no beta más reciente, luego compila y ejecuta doctor.
- `beta`: prefiere el tag `-beta` más reciente, pero vuelve al tag estable más reciente cuando beta no existe o es anterior.
- `dev`: hace checkout de `main`, luego obtiene cambios y hace rebase.

### Pasos de actualización

<Steps>
  <Step title="Verificar árbol de trabajo limpio">
    Requiere que no haya cambios sin confirmar.
  </Step>
  <Step title="Cambiar canal">
    Cambia al canal seleccionado (tag o rama).
  </Step>
  <Step title="Obtener upstream">
    Solo dev.
  </Step>
  <Step title="Compilación previa (solo dev)">
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
    `openclaw doctor` se ejecuta como la comprobación final de actualización segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza los plugins con el canal activo. Dev usa plugins incluidos; stable y beta usan npm. Actualiza las instalaciones de plugins rastreadas.
  </Step>
</Steps>

En el canal de actualización beta, las instalaciones rastreadas de plugins npm y ClawHub que siguen
la línea predeterminada/latest prueban primero una versión `@beta` del plugin. Si el plugin no tiene
versión beta, OpenClaw vuelve a la especificación predeterminada/latest registrada. Las
versiones exactas y tags explícitos no se reescriben.

<Warning>
Si una actualización exacta de plugin npm fijada resuelve a un artefacto cuya integridad difiere del registro de instalación almacenado, `openclaw update` aborta esa actualización de artefacto de plugin en lugar de instalarla. Reinstala o actualiza el plugin explícitamente solo después de verificar que confías en el nuevo artefacto.
</Warning>

<Note>
Los fallos de sincronización de plugins posteriores a la actualización hacen fallar el resultado de la actualización y detienen el trabajo posterior de reinicio. Corrige el error de instalación o actualización del plugin y luego vuelve a ejecutar `openclaw update`.

Cuando se inicia el Gateway actualizado, la carga de plugins es solo de verificación: el arranque no ejecuta gestores de paquetes ni muta árboles de dependencias. Los reinicios de `update.run` del gestor de paquetes omiten el diferimiento normal por inactividad y el periodo de enfriamiento de reinicio después de que se ha reemplazado el árbol de paquetes, de modo que el proceso anterior no pueda seguir cargando de forma diferida fragmentos eliminados.

Si el arranque de pnpm sigue fallando, el actualizador se detiene temprano con un error específico del gestor de paquetes en lugar de intentar `npm run build` dentro del checkout.
</Note>

## Abreviatura `--update`

`openclaw --update` se reescribe como `openclaw update` (útil para shells y scripts de lanzamiento).

## Relacionado

- `openclaw doctor` (ofrece ejecutar update primero en checkouts de git)
- [Canales de desarrollo](/es/install/development-channels)
- [Actualización](/es/install/updating)
- [Referencia de la CLI](/es/cli)
