---
read_when:
    - Quieres actualizar un checkout de origen de forma segura
    - Está depurando la salida o las opciones de `openclaw update`
    - Debe comprender el comportamiento abreviado de `--update`
summary: Referencia de CLI para `openclaw update` (actualización de origen relativamente segura + reinicio automático del Gateway)
title: Actualizar
x-i18n:
    generated_at: "2026-07-05T11:10:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c26f41b6931681dce351b82640535855e919888dc2cf6dea4bdb9937dcf139f8
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Actualiza OpenClaw y cambia entre los canales stable/extended-stable/beta/dev.

Si instalaste mediante **npm/pnpm/bun** (instalación global, sin metadatos de git),
las actualizaciones pasan por el flujo del gestor de paquetes descrito en
[Actualizar](/es/install/updating).

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

`openclaw --update` se reescribe como `openclaw update` (útil para shells y
scripts de lanzador).

## Opciones

| Marca                                             | Descripción                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | Omite reiniciar el servicio Gateway después de una actualización correcta. Las actualizaciones del gestor de paquetes que sí reinician verifican que el servicio reiniciado informe la versión esperada antes de que el comando se complete correctamente.                                                                                 |
| `--channel <stable\|extended-stable\|beta\|dev>` | Define el canal de actualización y lo conserva después de que la actualización del núcleo se complete correctamente. Extended-stable es solo para paquetes.                                                                                                                                                                                  |
| `--tag <dist-tag\|version\|spec>`                | Anula el destino del paquete solo para esta actualización. No puede combinarse con un canal `extended-stable` efectivo, cuyo destino exacto verificado es obligatorio. Para otras instalaciones de paquetes, `main` se asigna a `github:openclaw/openclaw#main`; las especificaciones de origen GitHub/git se empaquetan en un tarball temporal antes de la instalación global npm preparada. |
| `--dry-run`                                      | Previsualiza las acciones planificadas (flujo de canal/etiqueta/destino/reinicio) sin escribir configuración, instalar, sincronizar plugins ni reiniciar.                                                                                                                                                                                  |
| `--json`                                         | Imprime JSON `UpdateRunResult` legible por máquina. Incluye `postUpdate.plugins.warnings` cuando un plugin gestionado necesita reparación, detalles de reserva de plugins del canal beta y `postUpdate.plugins.integrityDrifts` cuando se detecta una divergencia de artefactos de plugins npm durante la sincronización posterior a la actualización. |
| `--timeout <seconds>`                            | Tiempo de espera por paso. Valor predeterminado `1800`.                                                                                                                                                                                                                                                                                    |
| `--yes`                                          | Omite los avisos de confirmación (por ejemplo, la confirmación de degradación de versión).                                                                                                                                                                                                                                                  |
| `--acknowledge-clawhub-risk`                     | Permite que la sincronización de plugins posterior a la actualización continúe pese a las advertencias de confianza de la comunidad de ClawHub sin un aviso interactivo. Sin esta opción, las versiones de comunidad riesgosas se omiten y se dejan sin cambios cuando OpenClaw no puede solicitar confirmación. Los paquetes oficiales de ClawHub y las fuentes de plugins incluidos omiten este aviso. |

No hay ninguna marca `--verbose`. Usa `--dry-run` para previsualizar las acciones planificadas,
`--json` para resultados legibles por máquina y `openclaw update status --json`
solo para el canal/la disponibilidad. La verbosidad de consola de Gateway (`--verbose`) y
el nivel de registro de archivo (`logging.level: "debug"`/`"trace"`) son controles independientes; consulta
[Registro de Gateway](/es/gateway/logging).

<Note>
En modo Nix (`OPENCLAW_NIX_MODE=1`), las ejecuciones mutantes de `openclaw update` están deshabilitadas. Actualiza el origen de Nix o la entrada flake para esta instalación en su lugar; para nix-openclaw, usa el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrado en el agente. `openclaw update status` y `openclaw update --dry-run` siguen siendo de solo lectura.
</Note>

<Warning>
Las degradaciones de versión requieren confirmación porque las versiones anteriores pueden romper la configuración.
</Warning>

## `update status`

Muestra el canal de actualización activo, la etiqueta/rama/SHA de git (solo checkouts de origen)
y la disponibilidad de actualizaciones.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| Marca                  | Predeterminado | Descripción                         |
| --------------------- | ------- | ----------------------------------- |
| `--json`              | `false` | Imprime JSON de estado legible por máquina. |
| `--timeout <seconds>` | `3`     | Tiempo de espera para comprobaciones.                 |

Para instalaciones de paquetes extended-stable, el estado realiza el mismo selector público
y la misma verificación exacta de paquete que la actualización en primer plano. Puede informar
`ahead of extended-stable` cuando la versión instalada es más reciente. Los errores JSON
incluyen `registry.reason` (`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` o `unsupported_git_channel`).

## `update repair`

Vuelve a ejecutar la finalización de la actualización después de que el paquete del núcleo ya cambió pero el trabajo
de reparación posterior no terminó correctamente. Esta es la ruta de recuperación admitida cuando
`openclaw update` instaló el nuevo paquete del núcleo pero la sincronización de plugins posterior al núcleo,
los metadatos de plugins npm gestionados, la actualización del registro o la reparación de doctor no
convergieron.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| Marca                                             | Descripción                                                                                                                                                                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | Conserva el canal de actualización del núcleo antes de reparar. Para extended-stable, la convergencia de plugins apunta temporalmente a la línea stable/latest de plugins. La reparación de extended-stable se rechaza en checkouts de Git sin cambiar la configuración. |
| `--json`                                         | Imprime JSON de finalización legible por máquina.                                                                                                                                                                              |
| `--timeout <seconds>`                            | Tiempo de espera para los pasos de reparación. Valor predeterminado `1800`.                                                                                                                                                                              |
| `--yes`                                          | Omite los avisos de confirmación.                                                                                                                                                                                             |
| `--acknowledge-clawhub-risk`                     | Mismo comportamiento que en `openclaw update`.                                                                                                                                                                                 |
| `--no-restart`                                   | Se acepta por paridad; la reparación nunca reinicia Gateway.                                                                                                                                                                |

`update repair` ejecuta `openclaw doctor --fix`, recarga la configuración reparada y
los registros de instalación, sincroniza los plugins rastreados para el canal de actualización activo, actualiza
las instalaciones de plugins npm gestionados, repara las cargas útiles de plugins configurados faltantes,
actualiza el registro de plugins y escribe metadatos convergidos de registros de instalación.
No instala un nuevo paquete del núcleo y no reinicia Gateway.

## `update wizard`

Flujo interactivo para elegir un canal de actualización y confirmar si reiniciar
Gateway después (reiniciar es el valor predeterminado). Seleccionar `dev` sin un checkout de git
ofrece crear uno.

| Marca                  | Predeterminado | Descripción                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | Tiempo de espera para cada paso de actualización. |

## Qué hace

Cambiar de canal explícitamente (`--channel ...`) también mantiene alineado el método de instalación:

- `dev` -> garantiza un checkout de git (valor predeterminado `~/openclaw`, o
  `$OPENCLAW_HOME/openclaw` cuando `OPENCLAW_HOME` está definido; anúlalo con
  `OPENCLAW_GIT_DIR`), lo actualiza e instala la CLI global desde ese
  checkout.
- `stable` -> instala desde npm usando `latest`.
- `extended-stable` -> resuelve el selector público npm `extended-stable`,
  verifica el paquete seleccionado exacto e instala esa versión exacta. No
  recurre a otro selector y se rechaza para checkouts de Git.
- `beta` -> prefiere la dist-tag npm `beta`, recurriendo a `latest` cuando beta falta
  o es anterior a la versión estable actual.

### Traspaso de reinicio

El autoactualizador del núcleo de Gateway (cuando está habilitado mediante configuración) inicia la ruta de actualización
de la CLI fuera del controlador de solicitudes de Gateway en vivo. Las actualizaciones de gestor de paquetes
`update.run` del plano de control y las actualizaciones supervisadas de checkouts de git usan
el mismo traspaso de servicio gestionado en lugar de reemplazar el árbol de paquetes o
recompilar `dist/` dentro del proceso Gateway en vivo: Gateway inicia un
ayudante desacoplado y sale, y ese ayudante ejecuta `openclaw update --yes --json`
desde fuera del árbol de procesos de Gateway. Si el traspaso no está disponible,
`update.run` devuelve una respuesta estructurada con el comando de shell seguro para ejecutar
manualmente.

Extended-stable se excluye deliberadamente de las comprobaciones de inicio y de la programación
de actualización automática en segundo plano. Las actualizaciones explícitas en primer plano, las actualizaciones en primer plano simples
con `update.channel: "extended-stable"` almacenado, el estado bajo demanda y el traspaso gestionado
de Gateway siguen siendo compatibles.

Cuando hay un servicio Gateway gestionado local instalado y el reinicio está habilitado,
las actualizaciones de gestor de paquetes y de checkout de git detienen el servicio en ejecución antes de
reemplazar el árbol de paquetes o mutar el checkout/la salida de compilación. Luego el actualizador
actualiza los metadatos del servicio, reinicia el servicio y verifica el
Gateway reiniciado antes de informar `Gateway: restarted and verified.`.
Las actualizaciones de gestor de paquetes verifican además que el Gateway reiniciado informe la
versión de paquete esperada; las actualizaciones de checkout de git verifican la salud de Gateway y
la preparación del servicio después de la recompilación.

En macOS, la comprobación posterior a la actualización también verifica que el LaunchAgent esté
cargado/en ejecución para el perfil activo y que el puerto loopback configurado esté
en buen estado. Si el plist está instalado pero launchd no lo supervisa, OpenClaw
vuelve a arrancar automáticamente el LaunchAgent y repite las comprobaciones de estado/versión/
preparación del canal (un arranque nuevo carga directamente el trabajo `RunAtLoad`,
por lo que la recuperación no ejecuta inmediatamente `kickstart -k` sobre el Gateway recién iniciado). Si
el Gateway sigue sin estar en buen estado, el comando sale con un valor distinto de cero e
imprime la ruta del registro de reinicio, además de instrucciones para reiniciar, reinstalar y revertir el paquete.

Si el reinicio no puede ejecutarse, el comando imprime `Gateway: restart skipped (...)` o
`Gateway: restart failed: ...` con una sugerencia manual de `openclaw gateway restart`.
Con `--no-restart`, el reemplazo del paquete o la reconstrucción desde git se ejecutan igualmente, pero el
servicio gestionado no se detiene ni se reinicia, por lo que el Gateway en ejecución conserva el
código anterior hasta que lo reinicies manualmente.

### Forma de la respuesta del plano de control

Cuando `update.run` se ejecuta a través del plano de control del Gateway en una instalación
de gestor de paquetes o un checkout de git supervisado, el manejador informa del inicio de la transferencia
por separado de la actualización de la CLI que continúa después de que el Gateway sale:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` y
  `handoff.status: "started"`: el Gateway creó la transferencia de servicio gestionado
  y programó su propio reinicio para que el ayudante desacoplado pueda ejecutar
  `openclaw update --yes --json` fuera del proceso del servicio activo.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` y
  `handoff.status: "unavailable"`: OpenClaw no pudo encontrar un límite de
  servicio supervisor ni una identidad de servicio duradera para una transferencia segura (por
  ejemplo, la transferencia de systemd requiere la identidad de unidad `OPENCLAW_SYSTEMD_UNIT`,
  no solo marcadores ambientales del proceso systemd). La respuesta incluye
  `handoff.command`, el comando de shell que se debe ejecutar desde fuera del Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`: el Gateway
  intentó crear la transferencia, pero no pudo iniciar el ayudante desacoplado.

La carga útil `sentinel` se escribe antes de que el Gateway salga, y la CLI
de transferencia actualiza ese mismo centinela de reinicio después de que se completan las
comprobaciones de estado del reinicio del servicio gestionado. Durante la transferencia, el centinela puede contener
`stats.reason: "restart-health-pending"` sin continuación de éxito; el
Gateway reiniciado lo sondea y dispara la continuación solo después de que la CLI haya
verificado el estado del servicio y reescrito el centinela con el resultado final `ok`.
`openclaw status` y `openclaw status --all` muestran una fila `Update restart`
mientras ese centinela está pendiente o fallido, y `update.status` actualiza y
devuelve el centinela más reciente.

## Flujo de checkout de Git

### Selección de canal

- `stable`: hace checkout de la etiqueta no beta más reciente, luego compila y ejecuta doctor.
- `beta`: prefiere la etiqueta `-beta` más reciente, recurriendo a la etiqueta estable más reciente
  cuando falta beta o es más antigua.
- `dev`: hace checkout de `main`, luego obtiene cambios y hace rebase.
- `extended-stable`: no compatible con checkouts de Git; no se produce ninguna mutación
  del checkout.

### Pasos de actualización

<Steps>
  <Step title="Verificar worktree limpio">
    Requiere que no haya cambios sin confirmar.
  </Step>
  <Step title="Cambiar canal">
    Cambia al canal seleccionado (etiqueta o rama).
  </Step>
  <Step title="Obtener upstream">
    Solo dev.
  </Step>
  <Step title="Compilación preliminar (solo dev)">
    Ejecuta la compilación de TypeScript en un worktree temporal. Si la punta falla, retrocede hasta 10 commits para encontrar el commit compilable más reciente. Define `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` para ejecutar también lint durante esta comprobación preliminar; lint se ejecuta en modo serial restringido porque los hosts de actualización de usuario suelen ser más pequeños que los ejecutores de CI.
  </Step>
  <Step title="Rebase">
    Hace rebase sobre el commit seleccionado (solo dev).
  </Step>
  <Step title="Instalar dependencias">
    Usa el gestor de paquetes del repositorio. Para checkouts de pnpm, el actualizador arranca `pnpm` bajo demanda (primero mediante `corepack`, luego con una alternativa temporal `npm install pnpm@11`) en lugar de ejecutar `npm run build` dentro de un workspace pnpm. Si el arranque de pnpm sigue fallando, el actualizador se detiene pronto con un error específico del gestor de paquetes en lugar de intentar `npm run build` en el checkout.
  </Step>
  <Step title="Compilar Control UI">
    Compila el Gateway y la Control UI.
  </Step>
  <Step title="Ejecutar doctor">
    `openclaw doctor` se ejecuta como la comprobación final de actualización segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza plugins con el canal activo. Dev usa plugins incluidos; stable y beta usan npm. Actualiza las instalaciones de plugins con seguimiento.
  </Step>
</Steps>

### Detalles de sincronización de plugins

En el canal beta, las instalaciones de plugins de npm y ClawHub con seguimiento que siguen la
línea predeterminada/latest prueban primero una versión de plugin `@beta`. Si el plugin no tiene
versión beta, OpenClaw recurre a la especificación predeterminada/latest registrada e
informa una advertencia. Para plugins npm, OpenClaw también recurre a la alternativa cuando el paquete
beta existe pero falla la validación de instalación. Estas advertencias de alternativa no
hacen fallar la actualización del núcleo. Las versiones exactas y las etiquetas explícitas nunca se reescriben.

<Warning>
Si una actualización de plugin npm fijada de forma exacta se resuelve a un artefacto cuya integridad difiere del registro de instalación almacenado, `openclaw update` aborta esa actualización de artefacto de plugin en lugar de instalarla. Reinstala o actualiza el plugin explícitamente solo después de verificar que confías en el nuevo artefacto.
</Warning>

<Note>
Los fallos de sincronización de plugins posteriores a la actualización que están acotados a un plugin gestionado y que la ruta de sincronización puede esquivar (por ejemplo, un registro npm inaccesible para un plugin no esencial) se informan como advertencias después de que la actualización del núcleo tiene éxito. El resultado JSON conserva el `status: "ok"` de la actualización de nivel superior e informa `postUpdate.plugins.status: "warning"` con orientación de `openclaw update repair` y `openclaw plugins inspect <id> --runtime --json`. Las excepciones inesperadas del actualizador o de sincronización siguen haciendo fallar el resultado de actualización. Corrige el error de instalación o actualización del plugin y luego vuelve a ejecutar `openclaw update repair`.

Después del paso de sincronización por plugin, `openclaw update` ejecuta una pasada obligatoria de **convergencia posterior al núcleo** antes de que el Gateway se reinicie: repara cargas útiles de plugins configurados ausentes, valida cada registro de instalación con seguimiento _activo_ en disco y verifica estáticamente que su `package.json` se pueda analizar (y que exista cualquier `main` declarado explícitamente). Los fallos de esta pasada, y una instantánea de configuración no válida, devuelven `postUpdate.plugins.status: "error"` y cambian el `status` de actualización de nivel superior a `"error"`, por lo que `openclaw update` sale con un valor distinto de cero y el Gateway _no_ se reinicia con un conjunto de plugins no verificado. El error incluye líneas estructuradas `postUpdate.plugins.warnings[].guidance` que apuntan a `openclaw update repair` y `openclaw plugins inspect <id> --runtime --json`. Las entradas de plugins deshabilitados y los registros que no son destinos oficiales de sincronización vinculados a una fuente confiable se omiten aquí (reflejando la política `skipDisabledPlugins` usada por la comprobación de cargas útiles ausentes), por lo que un registro obsoleto de plugin deshabilitado no puede bloquear una actualización que de otro modo sería válida.

Cuando se inicia el Gateway actualizado, la carga de plugins es solo de verificación: el arranque no ejecuta gestores de paquetes ni muta árboles de dependencias. Los reinicios de `update.run` del gestor de paquetes se entregan a la ruta de servicio gestionado de la CLI, por lo que el intercambio de paquetes ocurre fuera del proceso antiguo del Gateway y las comprobaciones de estado del servicio deciden si la actualización puede informarse como completa.
</Note>

Después de que una actualización del núcleo extended-stable tiene éxito, la integridad y
convergencia de plugins posteriores al núcleo siguen ejecutándose, pero los plugins oficiales apuntan temporalmente a la
línea stable/latest. OpenClaw no consulta selectores de plugin `@extended-stable`
en esta versión.

Para instalaciones de gestor de paquetes, `openclaw update` resuelve la versión de paquete
de destino antes de invocar el gestor de paquetes. Las instalaciones globales de npm usan una instalación por etapas:
OpenClaw instala el nuevo paquete en un prefijo npm temporal,
verifica allí el inventario `dist` empaquetado y luego intercambia ese árbol de paquete
limpio al prefijo global real. Si la verificación falla, doctor posterior a la actualización,
la sincronización de plugins y el trabajo de reinicio no se ejecutan desde el árbol sospechoso. Incluso cuando la
versión instalada ya coincide con el destino, el comando actualiza la instalación global
del paquete, luego ejecuta la sincronización de plugins, una actualización de completado de comandos del núcleo
y el trabajo de reinicio. Esto mantiene los sidecars empaquetados y los registros de plugins
propiedad del canal alineados con la compilación instalada de OpenClaw, mientras deja las reconstrucciones completas
de completado de comandos de plugins para ejecuciones explícitas de
`openclaw completion --write-state`.

## Relacionado

- `openclaw doctor` (ofrece ejecutar primero la actualización en checkouts de git)
- [Canales de desarrollo](/es/install/development-channels)
- [Actualización](/es/install/updating)
- [Referencia de la CLI](/es/cli)
