---
read_when:
    - Quieres actualizar un checkout de origen de forma segura
    - Estás depurando la salida o las opciones de `openclaw update`
    - Debes comprender el comportamiento abreviado de `--update`
summary: Referencia de CLI para `openclaw update` (actualización de origen relativamente segura + reinicio automático de Gateway)
title: Actualizar
x-i18n:
    generated_at: "2026-06-27T11:06:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Actualiza OpenClaw de forma segura y cambia entre los canales stable/beta/dev.

Si instalaste mediante **npm/pnpm/bun** (instalación global, sin metadatos de git),
las actualizaciones se realizan mediante el flujo del gestor de paquetes en [Actualizar](/es/install/updating).

## Uso

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

## Opciones

- `--no-restart`: omite reiniciar el servicio Gateway después de una actualización correcta. Las actualizaciones del gestor de paquetes que sí reinician el Gateway verifican que el servicio reiniciado informe la versión actualizada esperada antes de que el comando se complete correctamente.
- `--channel <stable|beta|dev>`: establece el canal de actualización (git + npm; persistido en la configuración).
- `--tag <dist-tag|version|spec>`: sobrescribe el destino del paquete solo para esta actualización. Para instalaciones de paquetes, `main` se asigna a `github:openclaw/openclaw#main`; las especificaciones de origen GitHub/git se empaquetan en un tarball temporal antes de la instalación global de npm por etapas.
- `--dry-run`: muestra una vista previa de las acciones de actualización planificadas (flujo de canal/etiqueta/destino/reinicio) sin escribir configuración, instalar, sincronizar plugins ni reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legible por máquina, incluidos
  `postUpdate.plugins.warnings` cuando plugins administrados corruptos o no cargables necesitan
  reparación después de que la actualización del núcleo se complete correctamente, detalles de reserva de plugins del canal beta
  cuando un plugin no tiene versión beta, y `postUpdate.plugins.integrityDrifts`
  cuando se detecta deriva de artefactos de plugins npm durante la sincronización de plugins posterior a la actualización.
- `--timeout <seconds>`: tiempo de espera por paso (el valor predeterminado es 1800s).
- `--yes`: omite las solicitudes de confirmación (por ejemplo, la confirmación de degradación de versión).
- `--acknowledge-clawhub-risk`: después de revisar las advertencias de confianza de la comunidad de ClawHub, permite que la sincronización de plugins posterior a la actualización continúe sin una solicitud interactiva. Sin esto, las versiones de plugins comunitarios de ClawHub con riesgo se omiten y se dejan sin cambios cuando OpenClaw no puede solicitar confirmación. Los paquetes oficiales de ClawHub y las fuentes de plugins de OpenClaw incluidas omiten esta solicitud de confianza de versión.

`openclaw update` no tiene una marca `--verbose`. Usa `--dry-run` para previsualizar
las acciones planificadas de canal/etiqueta/instalación/reinicio, `--json` para obtener
resultados legibles por máquina, y `openclaw update status --json` cuando solo necesites detalles de canal y disponibilidad. Si estás depurando registros de Gateway alrededor de una actualización,
la verbosidad de consola y el nivel de registro en archivo son independientes: Gateway `--verbose` afecta
la salida de terminal/WebSocket, mientras que los registros en archivo requieren `logging.level: "debug"` o
`"trace"` en la configuración. Consulta [Registros de Gateway](/es/gateway/logging).

<Note>
En modo Nix (`OPENCLAW_NIX_MODE=1`), las ejecuciones mutantes de `openclaw update` están deshabilitadas. Actualiza la fuente Nix o la entrada flake de esta instalación en su lugar; para nix-openclaw, usa el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrado en el agente. `openclaw update status` y `openclaw update --dry-run` siguen siendo de solo lectura.
</Note>

<Warning>
Las degradaciones de versión requieren confirmación porque las versiones anteriores pueden romper la configuración.
</Warning>

## `update status`

Muestra el canal de actualización activo + etiqueta/rama/SHA de git (para checkouts de origen), además de la disponibilidad de actualización.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opciones:

- `--json`: imprime JSON de estado legible por máquina.
- `--timeout <seconds>`: tiempo de espera para comprobaciones (el valor predeterminado es 3s).

## `update repair`

Vuelve a ejecutar la finalización de actualización después de que el paquete principal ya haya cambiado pero el trabajo posterior de reparación no haya terminado correctamente. Esta es la ruta de recuperación admitida cuando
`openclaw update` instaló el nuevo paquete principal pero la sincronización de plugins posterior al núcleo,
los metadatos de plugins npm administrados, la actualización del registro o la reparación de doctor aún necesitan converger.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

Opciones:

- `--channel <stable|beta|dev>`: persiste el canal de actualización antes de reparar y
  ejecuta la convergencia de plugins contra ese canal.
- `--json`: imprime JSON de finalización legible por máquina.
- `--timeout <seconds>`: tiempo de espera para los pasos de reparación (predeterminado `1800`).
- `--yes`: omite las solicitudes de confirmación.
- `--acknowledge-clawhub-risk`: después de revisar las advertencias de confianza de la comunidad de ClawHub, permite que la convergencia de plugins durante la reparación continúe sin una solicitud interactiva. Los paquetes oficiales de ClawHub y las fuentes de plugins de OpenClaw incluidas omiten esta solicitud de confianza de versión.
- `--no-restart`: se acepta por paridad con el comando de actualización; repair nunca reinicia el
  Gateway.

`openclaw update repair` ejecuta `openclaw doctor --fix`, recarga la configuración reparada
y los registros de instalación, sincroniza los plugins rastreados para el canal de actualización activo,
actualiza las instalaciones de plugins npm administrados, repara payloads de plugins configurados faltantes,
actualiza el registro de plugins y escribe los metadatos convergidos del registro de instalación.
No instala un nuevo paquete principal ni reinicia el Gateway.

## `update wizard`

Flujo interactivo para elegir un canal de actualización y confirmar si se debe reiniciar el Gateway
después de actualizar (el valor predeterminado es reiniciar). Si seleccionas `dev` sin un checkout de git, ofrece crear uno.

Opciones:

- `--timeout <seconds>`: tiempo de espera para cada paso de actualización (predeterminado `1800`)

## Qué hace

Cuando cambias de canal explícitamente (`--channel ...`), OpenClaw también mantiene alineado el
método de instalación:

- `dev` → asegura un checkout de git (predeterminado: `~/openclaw`, o `$OPENCLAW_HOME/openclaw` cuando
  `OPENCLAW_HOME` está establecido; sobrescribe con `OPENCLAW_GIT_DIR`),
  lo actualiza e instala la CLI global desde ese checkout.
- `stable` → instala desde npm usando `latest`.
- `beta` → prefiere la dist-tag de npm `beta`, pero recurre a `latest` cuando beta falta o es
  anterior a la versión estable actual.

El autoactualizador del núcleo Gateway (cuando está habilitado mediante configuración) inicia la ruta de actualización de la CLI
fuera del manejador de solicitudes activo de Gateway. Las actualizaciones de gestor de paquetes de `update.run`
del plano de control y las actualizaciones supervisadas de checkout de git también usan una
transferencia de servicio administrado en lugar de reemplazar el árbol de paquetes o reconstruir
`dist/` dentro del proceso Gateway activo. El Gateway inicia un ayudante desacoplado,
sale, y el ayudante ejecuta la ruta normal de la CLI `openclaw update --yes --json`
desde fuera del árbol de procesos de Gateway. Si esa transferencia no está disponible,
`update.run` devuelve una respuesta estructurada con el comando de shell seguro para ejecutar
manualmente.

Para instalaciones con gestor de paquetes, `openclaw update` resuelve la versión de paquete de destino
antes de invocar el gestor de paquetes. Las instalaciones globales de npm usan una instalación
por etapas: OpenClaw instala el nuevo paquete en un prefijo npm temporal, verifica
el inventario `dist` empaquetado allí y luego intercambia ese árbol de paquetes limpio en el
prefijo global real. Si la verificación falla, doctor posterior a la actualización, la sincronización de plugins y
el trabajo de reinicio no se ejecutan desde el árbol sospechoso. Incluso cuando la versión instalada
ya coincide con el destino, el comando actualiza la instalación global del paquete,
luego ejecuta la sincronización de plugins, una actualización de finalización de comandos del núcleo y el trabajo de reinicio. Esto
mantiene los sidecars empaquetados y los registros de plugins propiedad del canal alineados con la
compilación instalada de OpenClaw, mientras deja las reconstrucciones completas de finalización de comandos de plugins para
ejecuciones explícitas de `openclaw completion --write-state`.

Cuando hay instalado un servicio Gateway administrado local y el reinicio está habilitado,
las actualizaciones de gestor de paquetes y checkout de git detienen el servicio en ejecución antes de
reemplazar el árbol de paquetes o mutar la salida de checkout/compilación. El actualizador
luego actualiza los metadatos del servicio desde la instalación actualizada, reinicia el
servicio y verifica el Gateway reiniciado antes de informar
`Gateway: restarted and verified.`. Las actualizaciones de gestor de paquetes además verifican
que el Gateway reiniciado informe la versión de paquete esperada; las actualizaciones de checkout de git
verifican la salud del gateway y la preparación del servicio después de la reconstrucción. En macOS, la
comprobación posterior a la actualización también verifica que LaunchAgent esté cargado/en ejecución para el perfil
activo y que el puerto loopback configurado esté saludable. Si el plist está instalado
pero launchd no lo está supervisando, OpenClaw vuelve a arrancar el LaunchAgent
automáticamente, y luego vuelve a ejecutar las comprobaciones de salud/versión/canal. Un arranque
nuevo carga el trabajo RunAtLoad directamente, por lo que la recuperación de actualización no ejecuta
inmediatamente `kickstart -k` sobre el Gateway recién generado. Si el Gateway aún
no se vuelve saludable, el comando sale con código distinto de cero e imprime la ruta del registro de reinicio
más instrucciones explícitas de reinicio, reinstalación y reversión de paquete. Si el reinicio
no puede ejecutarse, el comando imprime `Gateway: restart skipped (...)` o
`Gateway: restart failed: ...` con una sugerencia manual de `openclaw gateway restart`.
Con `--no-restart`, el reemplazo del paquete o la reconstrucción de git aún se ejecutan, pero el
servicio administrado no se detiene ni se reinicia, por lo que el Gateway en ejecución puede conservar el código antiguo
hasta que lo reinicies manualmente.

### Forma de respuesta del plano de control

Cuando `update.run` se invoca a través del plano de control de Gateway en una
instalación de gestor de paquetes o un checkout de git supervisado, el manejador informa el
inicio de la transferencia por separado de la actualización de CLI que continúa después de que
Gateway sale:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"`, y
  `handoff.status: "started"` significan que el Gateway creó la transferencia de servicio administrado
  y programó su propio reinicio para que el ayudante desacoplado pueda ejecutar
  `openclaw update --yes --json` fuera del proceso del servicio activo.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"`, y
  `handoff.status: "unavailable"` significan que OpenClaw no pudo encontrar un límite de servicio
  supervisor y una identidad de servicio duradera para una transferencia segura. Por
  ejemplo, la transferencia de systemd requiere la identidad de unidad de OpenClaw
  (`OPENCLAW_SYSTEMD_UNIT`), no solo marcadores ambientales de proceso systemd. La
  respuesta incluye `handoff.command`, el comando de shell que debe ejecutarse desde fuera del
  Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"` significa que el
  Gateway intentó crear la transferencia pero no pudo iniciar el ayudante desacoplado.

El payload `sentinel` aún se escribe antes de que el Gateway salga, y la transferencia de CLI
actualiza el mismo centinela de reinicio después de que se completen las comprobaciones de salud de reinicio
del servicio administrado. Durante la transferencia, el centinela puede llevar
`stats.reason: "restart-health-pending"` sin continuación de éxito; el
Gateway reiniciado sigue sondeándolo y solo dispara la continuación después de que la CLI
haya verificado la salud del servicio y reescrito el centinela con el resultado final `ok`.
`openclaw status` y `openclaw status --all` muestran una fila `Update restart`
mientras ese centinela está pendiente o fallido, y `update.status` actualiza y
devuelve el centinela más reciente.

## Flujo de checkout de git

### Selección de canal

- `stable`: hace checkout de la última etiqueta no beta, luego compila y ejecuta doctor.
- `beta`: prefiere la última etiqueta `-beta`, pero recurre a la última etiqueta estable cuando beta falta o es anterior.
- `dev`: hace checkout de `main`, luego hace fetch y rebase.

### Pasos de actualización

<Steps>
  <Step title="Verificar árbol de trabajo limpio">
    No requiere cambios sin confirmar.
  </Step>
  <Step title="Cambiar canal">
    Cambia al canal seleccionado (etiqueta o rama).
  </Step>
  <Step title="Obtener upstream">
    Solo para desarrollo.
  </Step>
  <Step title="Compilación de preflight (solo desarrollo)">
    Ejecuta la compilación de TypeScript en un árbol de trabajo temporal. Si la punta falla, retrocede hasta 10 commits para encontrar el commit compilable más reciente. Configura `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` para ejecutar también lint durante este preflight; lint se ejecuta en modo serial restringido porque los hosts de actualización de usuario suelen ser más pequeños que los ejecutores de CI.
  </Step>
  <Step title="Rebase">
    Hace rebase sobre el commit seleccionado (solo desarrollo).
  </Step>
  <Step title="Instalar dependencias">
    Usa el gestor de paquetes del repositorio. Para checkouts de pnpm, el actualizador inicializa `pnpm` bajo demanda (primero mediante `corepack`, luego con un fallback temporal de `npm install pnpm@11`) en lugar de ejecutar `npm run build` dentro de un workspace de pnpm.
  </Step>
  <Step title="Compilar Control UI">
    Compila el Gateway y la Control UI.
  </Step>
  <Step title="Ejecutar doctor">
    `openclaw doctor` se ejecuta como la comprobación final de actualización segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza plugins con el canal activo. Desarrollo usa plugins incluidos; stable y beta usan npm. Actualiza las instalaciones de plugins registradas.
  </Step>
</Steps>

En el canal de actualización beta, las instalaciones registradas de plugins de npm y ClawHub que siguen
la línea predeterminada/latest prueban primero una versión `@beta` del plugin. Si el plugin no tiene
versión beta, OpenClaw vuelve a la especificación predeterminada/latest registrada e informa
eso como una advertencia. Para plugins de npm, OpenClaw también vuelve atrás cuando el paquete
beta existe pero falla la validación de instalación. Estas advertencias de fallback de plugins no
hacen que falle la actualización del núcleo. Las versiones exactas y las etiquetas explícitas no se
reescriben.

<Warning>
Si una actualización de un plugin de npm fijado exactamente se resuelve en un artefacto cuya integridad difiere del registro de instalación almacenado, `openclaw update` aborta esa actualización del artefacto del plugin en lugar de instalarlo. Reinstala o actualiza el plugin explícitamente solo después de verificar que confías en el nuevo artefacto.
</Warning>

<Note>
Los fallos de sincronización de plugins posteriores a la actualización que están acotados a un plugin gestionado y que la ruta de sincronización puede evitar (por ejemplo, un registro de npm inaccesible para un plugin no esencial) se informan como advertencias después de que la actualización del núcleo se completa correctamente. El resultado JSON mantiene el `status: "ok"` de actualización de nivel superior e informa `postUpdate.plugins.status: "warning"` con orientación sobre `openclaw update repair` y `openclaw plugins inspect <id> --runtime --json`. Las excepciones inesperadas del actualizador o de sincronización siguen haciendo fallar el resultado de la actualización. Corrige la instalación del plugin o el error de actualización y luego vuelve a ejecutar `openclaw update repair`.

Después del paso de sincronización por plugin, `openclaw update` ejecuta una pasada obligatoria de **convergencia posterior al núcleo** antes de reiniciar el Gateway: repara cargas útiles faltantes de plugins configurados, valida cada registro de instalación rastreado _activo_ en disco y verifica estáticamente que su `package.json` se pueda analizar (y que cualquier `main` declarado explícitamente exista). Los fallos de esta pasada, y una instantánea de configuración de OpenClaw no válida, devuelven `postUpdate.plugins.status: "error"` y cambian el `status` de actualización de nivel superior a `"error"`, por lo que `openclaw update` sale con un valor distinto de cero y el Gateway _no_ se reinicia con un conjunto de plugins no verificado. El error incluye líneas estructuradas de `postUpdate.plugins.warnings[].guidance` que apuntan a `openclaw update repair` y `openclaw plugins inspect <id> --runtime --json` para el seguimiento. Las entradas de plugins deshabilitados y los registros que no son destinos de sincronización oficiales vinculados a una fuente de confianza se omiten aquí, reflejando la política `skipDisabledPlugins` usada por la comprobación de cargas útiles faltantes, por lo que un registro obsoleto de plugin deshabilitado no puede bloquear una actualización que por lo demás es válida.

Cuando se inicia el Gateway actualizado, la carga de plugins es solo de verificación: el arranque no
ejecuta gestores de paquetes ni muta árboles de dependencias. Los reinicios de `update.run` del gestor
de paquetes se entregan a la ruta de servicio gestionado por la CLI, de modo que el intercambio del
paquete ocurre fuera del proceso antiguo del Gateway y las comprobaciones de estado del servicio deciden si la
actualización puede informarse como completada.

Si la inicialización de pnpm aún falla, el actualizador se detiene pronto con un error específico del gestor de paquetes en lugar de intentar `npm run build` dentro del checkout.
</Note>

## Abreviatura `--update`

`openclaw --update` se reescribe como `openclaw update` (útil para shells y scripts de lanzador).

## Relacionado

- `openclaw doctor` (ofrece ejecutar primero la actualización en checkouts de git)
- [Canales de desarrollo](/es/install/development-channels)
- [Actualización](/es/install/updating)
- [Referencia de CLI](/es/cli)
