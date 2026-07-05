---
read_when:
    - Quieres actualizar un checkout de origen de forma segura
    - Estás depurando la salida o las opciones de `openclaw update`
    - Debes comprender el comportamiento abreviado de `--update`
summary: Referencia de CLI para `openclaw update` (actualización de fuente relativamente segura + reinicio automático de Gateway)
title: Actualizar
x-i18n:
    generated_at: "2026-07-05T01:55:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe972cf9effb9df8846ab9b3da662350dcc965ff2e58a8d5dabf1fd42be88b4
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Actualiza OpenClaw de forma segura y cambia entre los canales stable/extended-stable/beta/dev.

Si instalaste mediante **npm/pnpm/bun** (instalación global, sin metadatos de git),
las actualizaciones se realizan mediante el flujo del gestor de paquetes en [Actualizar](/es/install/updating).

## Uso

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel extended-stable
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

- `--no-restart`: omite el reinicio del servicio Gateway después de una actualización correcta. Las actualizaciones del gestor de paquetes que sí reinician el Gateway verifican que el servicio reiniciado informe la versión actualizada esperada antes de que el comando se complete correctamente.
- `--channel <stable|extended-stable|beta|dev>`: establece el canal de actualización y lo conserva después de que la actualización del núcleo se complete correctamente. Extended-stable solo está disponible para paquetes.
- `--tag <dist-tag|version|spec>`: anula el destino del paquete solo para esta actualización. No se puede combinar con un canal `extended-stable` efectivo, cuyo destino exacto verificado es obligatorio. Para otras instalaciones de paquetes, `main` se asigna a `github:openclaw/openclaw#main`; las especificaciones de origen de GitHub/git se empaquetan en un tarball temporal antes de la instalación global de npm por etapas.
- `--dry-run`: previsualiza las acciones de actualización planificadas (flujo de canal/etiqueta/destino/reinicio) sin escribir configuración, instalar, sincronizar plugins ni reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legible por máquina, incluyendo
  `postUpdate.plugins.warnings` cuando plugins administrados dañados o no cargables necesitan
  reparación después de que la actualización del núcleo se complete correctamente, detalles de fallback de plugins del canal beta
  cuando un plugin no tiene versión beta, y `postUpdate.plugins.integrityDrifts`
  cuando se detecta desviación de artefactos de plugins npm durante la sincronización de plugins posterior a la actualización.
- `--timeout <seconds>`: tiempo de espera por paso (el valor predeterminado es 1800 s).
- `--yes`: omite las solicitudes de confirmación (por ejemplo, la confirmación de degradación de versión).
- `--acknowledge-clawhub-risk`: después de revisar las advertencias de confianza de ClawHub de la comunidad,
  permite que la sincronización de plugins posterior a la actualización continúe sin una solicitud interactiva.
  Sin esto, las versiones riesgosas de plugins de ClawHub de la comunidad se omiten y
  permanecen sin cambios cuando OpenClaw no puede solicitar confirmación. Los paquetes oficiales de ClawHub y
  las fuentes de plugins incluidas con OpenClaw omiten esta solicitud de confianza de versión.

`openclaw update` no tiene una bandera `--verbose`. Usa `--dry-run` para previsualizar
las acciones planificadas de canal/etiqueta/instalación/reinicio, `--json` para resultados
legibles por máquina, y `openclaw update status --json` cuando solo necesites detalles
de canal y disponibilidad. Si estás depurando registros de Gateway durante una actualización,
la verbosidad de consola y el nivel de registro en archivo están separados: Gateway `--verbose` afecta
la salida de terminal/WebSocket, mientras que los registros en archivo requieren `logging.level: "debug"` o
`"trace"` en la configuración. Consulta [registros de Gateway](/es/gateway/logging).

<Note>
En modo Nix (`OPENCLAW_NIX_MODE=1`), las ejecuciones mutantes de `openclaw update` están deshabilitadas. Actualiza en su lugar el origen de Nix o la entrada flake de esta instalación; para nix-openclaw, usa el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) agent-first. `openclaw update status` y `openclaw update --dry-run` siguen siendo de solo lectura.
</Note>

<Warning>
Las degradaciones de versión requieren confirmación porque las versiones anteriores pueden romper la configuración.
</Warning>

## `update status`

Muestra el canal de actualización activo + etiqueta/rama/SHA de git (para checkouts de origen), además de la disponibilidad de actualizaciones.

Para instalaciones de paquetes extended-stable, el estado realiza el mismo selector público
y la misma verificación de paquete exacto que la actualización en primer plano. Puede informar
`ahead of extended-stable` cuando la versión instalada es más reciente. Los fallos JSON
incluyen `registry.reason` (`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` o `unsupported_git_channel`).

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opciones:

- `--json`: imprime JSON de estado legible por máquina.
- `--timeout <seconds>`: tiempo de espera para las comprobaciones (el valor predeterminado es 3 s).

## `update repair`

Vuelve a ejecutar la finalización de la actualización después de que el paquete del núcleo ya haya cambiado pero el trabajo de reparación posterior
no haya terminado correctamente. Esta es la ruta de recuperación compatible cuando
`openclaw update` instaló el nuevo paquete del núcleo pero la sincronización de plugins posterior al núcleo,
los metadatos de plugins npm administrados, la actualización del registro o la reparación de doctor aún necesitan
converger.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

Opciones:

- `--channel <stable|extended-stable|beta|dev>`: conserva el canal de actualización del núcleo
  antes de la reparación. Para extended-stable, la convergencia de plugins apunta temporalmente
  a la línea de plugins stable/latest. La reparación extended-stable se rechaza en checkouts de Git
  sin cambiar la configuración.
- `--json`: imprime JSON de finalización legible por máquina.
- `--timeout <seconds>`: tiempo de espera para los pasos de reparación (valor predeterminado `1800`).
- `--yes`: omite las solicitudes de confirmación.
- `--acknowledge-clawhub-risk`: después de revisar las advertencias de confianza de ClawHub de la comunidad,
  permite que la convergencia de plugins durante la reparación continúe sin una
  solicitud interactiva. Los paquetes oficiales de ClawHub y las fuentes de plugins incluidas con OpenClaw
  omiten esta solicitud de confianza de versión.
- `--no-restart`: aceptada por paridad con el comando de actualización; repair nunca reinicia el
  Gateway.

`openclaw update repair` ejecuta `openclaw doctor --fix`, recarga la configuración
reparada y los registros de instalación, sincroniza los plugins rastreados para el canal de actualización activo,
actualiza las instalaciones de plugins npm administrados, repara payloads de plugins configurados faltantes,
actualiza el registro de plugins y escribe los metadatos de registros de instalación convergidos.
No instala un nuevo paquete del núcleo y no reinicia el Gateway.

## `update wizard`

Flujo interactivo para elegir un canal de actualización y confirmar si se debe reiniciar el Gateway
después de actualizar (el valor predeterminado es reiniciar). Si seleccionas `dev` sin un checkout de git,
ofrece crear uno.

Opciones:

- `--timeout <seconds>`: tiempo de espera para cada paso de actualización (valor predeterminado `1800`)

## Qué hace

Cuando cambias de canal explícitamente (`--channel ...`), OpenClaw también mantiene alineado el
método de instalación:

- `dev` → garantiza un checkout de git (predeterminado: `~/openclaw`, o `$OPENCLAW_HOME/openclaw` cuando
  `OPENCLAW_HOME` está establecido; anúlalo con `OPENCLAW_GIT_DIR`),
  lo actualiza e instala la CLI global desde ese checkout.
- `stable` → instala desde npm usando `latest`.
- `extended-stable` → resuelve el selector público de npm `extended-stable`,
  verifica el paquete exacto seleccionado e instala esa versión exacta. No
  recurre a otro selector y se rechaza para checkouts de Git.
- `beta` → prefiere la etiqueta de distribución npm `beta`, pero recurre a `latest` cuando beta no existe
  o es más antigua que la versión stable actual.

El actualizador automático del núcleo de Gateway (cuando está habilitado mediante configuración) inicia la ruta de actualización de la CLI
fuera del controlador de solicitudes del Gateway en vivo. Las actualizaciones del gestor de paquetes `update.run`
del plano de control y las actualizaciones supervisadas de checkouts de git también usan una
transferencia de servicio administrado en lugar de reemplazar el árbol de paquetes o recompilar
`dist/` dentro del proceso Gateway en vivo. El Gateway inicia un helper independiente,
sale, y el helper ejecuta la ruta normal de CLI `openclaw update --yes --json`
desde fuera del árbol de procesos de Gateway. Si esa transferencia no está disponible,
`update.run` devuelve una respuesta estructurada con el comando de shell seguro para ejecutar
manualmente.

Extended-stable se excluye deliberadamente de las comprobaciones de inicio y de la programación de
actualizaciones automáticas en segundo plano. Las actualizaciones explícitas en primer plano, las actualizaciones en primer plano
sin argumentos con `update.channel: "extended-stable"` almacenado, el estado bajo demanda y la transferencia administrada de
Gateway siguen siendo compatibles.

Para instalaciones del gestor de paquetes, `openclaw update` resuelve la versión del paquete de destino
antes de invocar el gestor de paquetes. Las instalaciones globales de npm usan una instalación por etapas:
OpenClaw instala el nuevo paquete en un prefijo npm temporal, verifica allí el inventario de `dist`
empaquetado y luego intercambia ese árbol de paquetes limpio en el prefijo global real.
Si la verificación falla, doctor posterior a la actualización, la sincronización de plugins y el trabajo de reinicio
no se ejecutan desde el árbol sospechoso. Incluso cuando la versión instalada ya coincide
con el destino, el comando actualiza la instalación global del paquete y luego ejecuta la sincronización de plugins,
una actualización de finalización de comandos del núcleo y el trabajo de reinicio. Esto
mantiene los sidecars empaquetados y los registros de plugins propiedad del canal alineados con la
compilación de OpenClaw instalada, mientras deja las recompilaciones completas de finalización de comandos de plugins para
ejecuciones explícitas de `openclaw completion --write-state`.

Después de que una actualización del núcleo extended-stable se complete correctamente, la integridad y
convergencia de plugins posteriores al núcleo aún se ejecutan, pero los plugins oficiales apuntan temporalmente a la línea stable/latest.
OpenClaw no consulta selectores de plugins `@extended-stable` en esta versión.

Cuando hay un servicio Gateway administrado local instalado y el reinicio está habilitado,
las actualizaciones del gestor de paquetes y de checkouts de git detienen el servicio en ejecución antes de
reemplazar el árbol de paquetes o mutar el checkout/salida de compilación. Luego, el actualizador
actualiza los metadatos del servicio desde la instalación actualizada, reinicia el
servicio y verifica el Gateway reiniciado antes de informar
`Gateway: restarted and verified.`. Las actualizaciones del gestor de paquetes además verifican
que el Gateway reiniciado informe la versión de paquete esperada; las actualizaciones de checkouts de git
verifican la salud del gateway y la preparación del servicio después de la recompilación. En macOS, la
comprobación posterior a la actualización también verifica que LaunchAgent esté cargado/en ejecución para el perfil activo
y que el puerto loopback configurado esté sano. Si el plist está instalado
pero launchd no lo supervisa, OpenClaw vuelve a iniciar automáticamente el LaunchAgent
y luego vuelve a ejecutar las comprobaciones de preparación de salud/versión/canal. Un inicio nuevo
carga directamente el trabajo RunAtLoad, por lo que la recuperación de actualización no ejecuta
inmediatamente `kickstart -k` en el Gateway recién iniciado. Si el Gateway aún no
se vuelve sano, el comando sale con estado distinto de cero e imprime la ruta del registro de reinicio
además de instrucciones explícitas de reinicio, reinstalación y reversión de paquete. Si el reinicio
no puede ejecutarse, el comando imprime `Gateway: restart skipped (...)` o
`Gateway: restart failed: ...` con una sugerencia manual de `openclaw gateway restart`.
Con `--no-restart`, el reemplazo del paquete o la recompilación de git aún se ejecuta, pero el
servicio administrado no se detiene ni reinicia, por lo que el Gateway en ejecución puede conservar código antiguo
hasta que lo reinicies manualmente.

### Forma de respuesta del plano de control

Cuando `update.run` se invoca a través del plano de control de Gateway en una
instalación del gestor de paquetes o un checkout de git supervisado, el controlador informa el
inicio de la transferencia por separado de la actualización de CLI que continúa después de que el
Gateway sale:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` y
  `handoff.status: "started"` significan que el Gateway creó la transferencia de servicio administrado
  y programó su propio reinicio para que el helper independiente pueda ejecutar
  `openclaw update --yes --json` fuera del proceso del servicio en vivo.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` y
  `handoff.status: "unavailable"` significan que OpenClaw no pudo encontrar un límite de servicio supervisor
  ni una identidad de servicio duradera para una transferencia segura. Por
  ejemplo, la transferencia de systemd requiere la identidad de unidad de OpenClaw
  (`OPENCLAW_SYSTEMD_UNIT`), no solo marcadores ambientales del proceso systemd. La
  respuesta incluye `handoff.command`, el comando de shell para ejecutar desde fuera del
  Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"` significa que el
  Gateway intentó crear la transferencia pero no pudo iniciar el helper independiente.

La carga útil `sentinel` sigue escribiéndose antes de que el Gateway salga, y el traspaso de la CLI
actualiza el mismo sentinel de reinicio después de que se completen las comprobaciones de estado
del reinicio del servicio gestionado. Durante el traspaso, el sentinel puede llevar
`stats.reason: "restart-health-pending"` sin una continuación de éxito; el
Gateway reiniciado sigue sondeándolo y solo dispara la continuación después de que la CLI
haya verificado el estado del servicio y reescrito el sentinel con el resultado final `ok`.
`openclaw status` y `openclaw status --all` muestran una fila `Update restart`
mientras ese sentinel está pendiente o ha fallado, y `update.status` actualiza y
devuelve el sentinel más reciente.

## Flujo de checkout de Git

### Selección de canal

- `stable`: hace checkout de la etiqueta no beta más reciente, luego compila y ejecuta doctor.
- `beta`: prefiere la etiqueta `-beta` más reciente, pero recurre a la etiqueta estable más reciente cuando falta beta o es más antigua.
- `dev`: hace checkout de `main`, luego obtiene cambios y hace rebase.
- `extended-stable`: no admitido para checkouts de Git; no se produce ninguna mutación del checkout.

### Pasos de actualización

<Steps>
  <Step title="Verificar worktree limpio">
    Requiere que no haya cambios sin confirmar.
  </Step>
  <Step title="Cambiar de canal">
    Cambia al canal seleccionado (etiqueta o rama).
  </Step>
  <Step title="Obtener upstream">
    Solo dev.
  </Step>
  <Step title="Compilación preflight (solo dev)">
    Ejecuta la compilación de TypeScript en un worktree temporal. Si el tip falla, retrocede hasta 10 commits para encontrar el commit compilable más nuevo. Define `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` para ejecutar también lint durante este preflight; lint se ejecuta en modo serial restringido porque los hosts de actualización de usuarios suelen ser más pequeños que los runners de CI.
  </Step>
  <Step title="Rebase">
    Hace rebase sobre el commit seleccionado (solo dev).
  </Step>
  <Step title="Instalar dependencias">
    Usa el gestor de paquetes del repositorio. Para checkouts de pnpm, el actualizador inicializa `pnpm` bajo demanda (primero mediante `corepack`, luego con un fallback temporal de `npm install pnpm@11`) en lugar de ejecutar `npm run build` dentro de un workspace de pnpm.
  </Step>
  <Step title="Compilar Control UI">
    Compila el gateway y Control UI.
  </Step>
  <Step title="Ejecutar doctor">
    `openclaw doctor` se ejecuta como la comprobación final de actualización segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza los plugins con el canal activo. Dev usa plugins incluidos; stable y beta usan npm. Actualiza las instalaciones de plugins con seguimiento.
  </Step>
</Steps>

En el canal de actualización beta, las instalaciones de plugins de npm y ClawHub con seguimiento que siguen
la línea predeterminada/latest intentan primero una versión `@beta` del plugin. Si el plugin no tiene
versión beta, OpenClaw recurre a la especificación predeterminada/latest registrada e informa
de ello como advertencia. Para plugins de npm, OpenClaw también recurre al fallback cuando el paquete
beta existe pero falla la validación de instalación. Estas advertencias de fallback de plugins no
hacen que falle la actualización del núcleo. Las versiones exactas y las etiquetas explícitas no se
reescriben.

<Warning>
Si una actualización exacta anclada de un plugin de npm se resuelve a un artefacto cuya integridad difiere del registro de instalación almacenado, `openclaw update` aborta esa actualización del artefacto del plugin en lugar de instalarlo. Reinstala o actualiza el plugin explícitamente solo después de verificar que confías en el nuevo artefacto.
</Warning>

<Note>
Los fallos de sincronización de plugins posteriores a la actualización que están acotados a un plugin gestionado y que la ruta de sincronización puede rodear (por ejemplo, un registro de npm inaccesible para un plugin no esencial) se notifican como advertencias después de que la actualización del núcleo se completa correctamente. El resultado JSON mantiene el `status: "ok"` de actualización de nivel superior e informa `postUpdate.plugins.status: "warning"` con orientación de `openclaw update repair` y `openclaw plugins inspect <id> --runtime --json`. Las excepciones inesperadas del actualizador o de sincronización siguen haciendo fallar el resultado de actualización. Corrige el error de instalación o actualización del plugin y luego vuelve a ejecutar `openclaw update repair`.

Después del paso de sincronización por plugin, `openclaw update` ejecuta un pase obligatorio de **convergencia posterior al núcleo** antes de reiniciar el gateway: repara cargas útiles de plugins configurados que falten, valida en disco cada registro de instalación con seguimiento _activo_ y verifica estáticamente que su `package.json` se pueda analizar (y que exista cualquier `main` declarado explícitamente). Los fallos de este pase —y una instantánea de configuración de OpenClaw no válida— devuelven `postUpdate.plugins.status: "error"` y cambian el `status` de actualización de nivel superior a `"error"`, por lo que `openclaw update` sale con un código distinto de cero y el gateway _no_ se reinicia con un conjunto de plugins sin verificar. El error incluye líneas estructuradas `postUpdate.plugins.warnings[].guidance` que apuntan a `openclaw update repair` y `openclaw plugins inspect <id> --runtime --json` para el seguimiento. Las entradas de plugins deshabilitados y los registros que no son destinos de sincronización oficiales vinculados a fuentes de confianza se omiten aquí, reflejando la política `skipDisabledPlugins` usada por la comprobación de cargas útiles faltantes, por lo que un registro obsoleto de un plugin deshabilitado no puede bloquear una actualización que de otro modo sería válida.

Cuando se inicia el Gateway actualizado, la carga de plugins es solo de verificación: el arranque no
ejecuta gestores de paquetes ni muta árboles de dependencias. Los reinicios `update.run` del gestor
de paquetes se entregan a la ruta de servicio gestionado de la CLI, por lo que el intercambio de paquetes ocurre
fuera del proceso antiguo del Gateway y las comprobaciones de estado del servicio deciden si la
actualización puede notificarse como completada.

Si la inicialización de pnpm sigue fallando, el actualizador se detiene pronto con un error específico del gestor de paquetes en lugar de intentar `npm run build` dentro del checkout.
</Note>

## Atajo `--update`

`openclaw --update` se reescribe como `openclaw update` (útil para shells y scripts de lanzamiento).

## Relacionado

- `openclaw doctor` (ofrece ejecutar primero update en checkouts de git)
- [Canales de desarrollo](/es/install/development-channels)
- [Actualización](/es/install/updating)
- [Referencia de CLI](/es/cli)
