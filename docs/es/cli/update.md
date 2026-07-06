---
read_when:
    - Quieres actualizar un checkout de origen de forma segura
    - Estás depurando la salida o las opciones de `openclaw update`
    - Debes comprender el comportamiento abreviado de `--update`
summary: Referencia de CLI para `openclaw update` (actualización de origen relativamente segura + reinicio automático del gateway)
title: Actualizar
x-i18n:
    generated_at: "2026-07-06T10:49:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6abbb32f8b8132abb73dc1699d341a275e54613f18523bce4cba574d75232c2
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Actualiza OpenClaw y cambia entre los canales stable/extended-stable/beta/dev.

Si instalaste mediante **npm/pnpm/bun** (instalación global, sin metadatos de git),
las actualizaciones pasan por el flujo del gestor de paquetes descrito en
[Actualización](/es/install/updating).

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
scripts de lanzamiento).

## Opciones

| Marca                                             | Descripción                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | Omite el reinicio del servicio Gateway después de una actualización correcta. Las actualizaciones del gestor de paquetes que sí reinician verifican que el servicio reiniciado informe la versión esperada antes de que el comando se complete correctamente.                                                                                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | Establece el canal de actualización y lo conserva después de que la actualización del núcleo se complete correctamente. Extended-stable solo está disponible para paquetes.                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | Anula el destino del paquete solo para esta actualización. No se puede combinar con un canal `extended-stable` efectivo, cuyo destino exacto verificado es obligatorio. Para otras instalaciones de paquete, `main` se asigna a `github:openclaw/openclaw#main`; las especificaciones de origen de GitHub/git se empaquetan en un tarball temporal antes de la instalación global provisional de npm. |
| `--dry-run`                                      | Previsualiza las acciones planificadas (flujo de canal/etiqueta/destino/reinicio) sin escribir configuración, instalar, sincronizar plugins ni reiniciar.                                                                                                                                                                                                                |
| `--json`                                         | Imprime JSON `UpdateRunResult` legible por máquinas. Incluye `postUpdate.plugins.warnings` cuando un plugin gestionado necesita reparación, detalles de reserva de plugins del canal beta y `postUpdate.plugins.integrityDrifts` cuando se detecta deriva en artefactos de plugins de npm durante la sincronización posterior a la actualización.                                                                 |
| `--timeout <seconds>`                            | Tiempo de espera por paso. Valor predeterminado: `1800`.                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | Omite las solicitudes de confirmación (por ejemplo, la confirmación de degradación de versión).                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | Permite que la sincronización de plugins posterior a la actualización continúe pese a las advertencias de confianza de la comunidad de ClawHub sin una solicitud interactiva. Sin esta opción, las versiones de comunidad riesgosas se omiten y se dejan sin cambios cuando OpenClaw no puede solicitar confirmación. Los paquetes oficiales de ClawHub y las fuentes de plugins integrados omiten esta solicitud.                                                     |

No hay marca `--verbose`. Usa `--dry-run` para previsualizar las acciones planificadas,
`--json` para resultados legibles por máquinas y `openclaw update status --json`
solo para canal/disponibilidad. La verbosidad de la consola de Gateway (`--verbose`) y
el nivel de registro de archivo (`logging.level: "debug"`/`"trace"`) son controles independientes; consulta
[Registro de Gateway](/es/gateway/logging).

<Note>
En modo Nix (`OPENCLAW_NIX_MODE=1`), las ejecuciones modificadoras de `openclaw update` están deshabilitadas. En su lugar, actualiza el origen de Nix o la entrada flake para esta instalación; para nix-openclaw, usa el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrado en el agente. `openclaw update status` y `openclaw update --dry-run` siguen siendo de solo lectura.
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
| `--json`              | `false` | Imprime JSON de estado legible por máquinas. |
| `--timeout <seconds>` | `3`     | Tiempo de espera para las comprobaciones.                 |

Para instalaciones de paquetes extended-stable, el estado realiza el mismo selector público
y la misma verificación exacta de paquete que la actualización en primer plano. Puede informar
`ahead of extended-stable` cuando la versión instalada es más reciente. Los fallos JSON
incluyen `registry.reason` (`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` o `unsupported_git_channel`).

## `update repair`

Vuelve a ejecutar la finalización de la actualización después de que el paquete principal ya haya cambiado, pero el trabajo de reparación posterior
no haya terminado limpiamente. Esta es la ruta de recuperación admitida cuando
`openclaw update` instaló el nuevo paquete principal, pero la sincronización de plugins posterior al núcleo,
los metadatos de plugins npm gestionados, la actualización del registro o la reparación de doctor no
convergieron.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| Marca                                             | Descripción                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | Conserva el canal de actualización del núcleo antes de reparar. Para extended-stable, los plugins npm oficiales aptos que siguen intención bare/default o `latest` apuntan a la versión exacta del núcleo instalada. La reparación de extended-stable se rechaza en checkouts de Git sin cambiar la configuración. |
| `--json`                                         | Imprime JSON de finalización legible por máquinas.                                                                                                                                                                                                                           |
| `--timeout <seconds>`                            | Tiempo de espera para los pasos de reparación. Valor predeterminado: `1800`.                                                                                                                                                                                                                           |
| `--yes`                                          | Omite las solicitudes de confirmación.                                                                                                                                                                                                                                          |
| `--acknowledge-clawhub-risk`                     | Mismo comportamiento que en `openclaw update`.                                                                                                                                                                                                                              |
| `--no-restart`                                   | Aceptado por paridad; la reparación nunca reinicia el Gateway.                                                                                                                                                                                                             |

`update repair` ejecuta `openclaw doctor --fix`, recarga la configuración reparada y
los registros de instalación, sincroniza los plugins rastreados para el canal de actualización activo, actualiza
las instalaciones de plugins npm gestionados, repara cargas útiles de plugins configuradas faltantes,
actualiza el registro de plugins y escribe metadatos de registro de instalación convergidos.
No instala un nuevo paquete principal y no reinicia el Gateway.

## `update wizard`

Flujo interactivo para elegir un canal de actualización y confirmar si se debe reiniciar el
Gateway después (el valor predeterminado es reiniciar). Seleccionar `dev` sin un checkout de git
ofrece crear uno.

| Marca                  | Predeterminado | Descripción                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | Tiempo de espera para cada paso de actualización. |

## Qué hace

Cambiar canales explícitamente (`--channel ...`) también mantiene alineado el método de instalación:

- `dev` -> garantiza un checkout de git (predeterminado `~/openclaw`, o
  `$OPENCLAW_HOME/openclaw` cuando `OPENCLAW_HOME` está definido; anúlalo con
  `OPENCLAW_GIT_DIR`), lo actualiza e instala la CLI global desde ese
  checkout.
- `stable` -> instala desde npm usando `latest`.
- `extended-stable` -> resuelve el selector público `extended-stable` de npm,
  verifica el paquete exacto seleccionado e instala esa versión exacta. No
  recurre a otro selector y se rechaza para checkouts de Git.
- `beta` -> prefiere la dist-tag `beta` de npm, recurriendo a `latest` cuando beta falta o
  es anterior a la versión stable actual.

### Traspaso de reinicio

El actualizador automático del núcleo de Gateway (cuando está habilitado mediante configuración) inicia la ruta de actualización de la CLI
fuera del controlador de solicitudes del Gateway activo. Las actualizaciones del gestor de paquetes
`update.run` del plano de control y las actualizaciones supervisadas de checkout de git usan
el mismo traspaso de servicio gestionado en lugar de reemplazar el árbol de paquetes o
reconstruir `dist/` dentro del proceso de Gateway activo: el Gateway inicia un
ayudante separado y sale, y ese ayudante ejecuta `openclaw update --yes --json`
desde fuera del árbol de procesos de Gateway. Si el traspaso no está disponible,
`update.run` devuelve una respuesta estructurada con el comando de shell seguro para ejecutar
manualmente.

Extended-stable se excluye deliberadamente de las comprobaciones de inicio y de la programación de
actualizaciones automáticas en segundo plano. Las actualizaciones explícitas en primer plano, las actualizaciones simples en primer plano
con `update.channel: "extended-stable"` almacenado, el estado bajo demanda y el traspaso gestionado de
Gateway siguen estando admitidos.

Cuando se instala un servicio Gateway administrado local y el reinicio está habilitado,
las actualizaciones del gestor de paquetes y de checkout de git detienen el servicio en ejecución antes de
reemplazar el árbol de paquetes o modificar la salida del checkout/build. El actualizador
luego actualiza los metadatos del servicio, reinicia el servicio y verifica el
Gateway reiniciado antes de informar `Gateway: restarted and verified.`.
Las actualizaciones del gestor de paquetes además verifican que el Gateway reiniciado informe la
versión de paquete esperada; las actualizaciones de checkout de git verifican el estado del gateway y
la preparación del servicio después de la reconstrucción.

En macOS, la comprobación posterior a la actualización también verifica que el LaunchAgent esté
cargado/en ejecución para el perfil activo y que el puerto loopback configurado esté
sano. Si el plist está instalado pero launchd no lo está supervisando, OpenClaw
vuelve a inicializar el LaunchAgent automáticamente y vuelve a ejecutar las comprobaciones de salud/versión/
preparación de canal (un bootstrap nuevo carga el trabajo `RunAtLoad` directamente,
por lo que la recuperación no ejecuta inmediatamente `kickstart -k` en el Gateway recién iniciado). Si
el Gateway aún no se vuelve saludable, el comando sale con código distinto de cero e
imprime la ruta del registro de reinicio junto con instrucciones de reinicio, reinstalación y reversión de paquete.

Si el reinicio no puede ejecutarse, el comando imprime `Gateway: restart skipped (...)` o
`Gateway: restart failed: ...` con una sugerencia manual de `openclaw gateway restart`.
Con `--no-restart`, el reemplazo de paquete o la reconstrucción de git aún se ejecuta, pero el
servicio administrado no se detiene ni se reinicia, por lo que el Gateway en ejecución conserva el código anterior
hasta que lo reinicies manualmente.

### Forma de respuesta del plano de control

Cuando `update.run` se ejecuta a través del plano de control del Gateway en una instalación con gestor de paquetes
o un checkout de git supervisado, el handler informa el inicio de la entrega
por separado de la actualización de la CLI que continúa después de que el Gateway sale:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"`, y
  `handoff.status: "started"`: el Gateway creó la entrega del servicio administrado
  y programó su propio reinicio para que el helper desacoplado pueda ejecutar
  `openclaw update --yes --json` fuera del proceso del servicio activo.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"`, y
  `handoff.status: "unavailable"`: OpenClaw no pudo encontrar un límite de servicio supervisor
  y una identidad de servicio duradera para una entrega segura (por
  ejemplo, la entrega de systemd requiere la identidad de unidad `OPENCLAW_SYSTEMD_UNIT`,
  no solo marcadores de proceso systemd del entorno). La respuesta incluye
  `handoff.command`, el comando de shell que se debe ejecutar desde fuera del Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`: el Gateway
  intentó crear la entrega, pero no pudo iniciar el helper desacoplado.

La carga útil `sentinel` se escribe antes de que el Gateway salga, y la entrega de la CLI
actualiza ese mismo centinela de reinicio después de que finalizan las comprobaciones de salud del reinicio
del servicio administrado. Durante la entrega, el centinela puede contener
`stats.reason: "restart-health-pending"` sin continuación de éxito; el
Gateway reiniciado lo sondea y activa la continuación solo después de que la CLI haya
verificado la salud del servicio y reescrito el centinela con el resultado final `ok`.
`openclaw status` y `openclaw status --all` muestran una fila `Update restart`
mientras ese centinela está pendiente o falló, y `update.status` actualiza y
devuelve el centinela más reciente.

## Flujo de checkout de Git

### Selección de canal

- `stable`: hace checkout de la etiqueta no beta más reciente, luego compila y ejecuta doctor.
- `beta`: prefiere la etiqueta `-beta` más reciente y recurre a la etiqueta estable más reciente
  cuando beta falta o es más antigua.
- `dev`: hace checkout de `main`, luego obtiene cambios y aplica rebase.
- `extended-stable`: no compatible con checkouts de Git; no ocurre ninguna mutación de checkout.

### Pasos de actualización

<Steps>
  <Step title="Verify clean worktree">
    Requiere que no haya cambios sin confirmar.
  </Step>
  <Step title="Switch channel">
    Cambia al canal seleccionado (etiqueta o rama).
  </Step>
  <Step title="Fetch upstream">
    Solo dev.
  </Step>
  <Step title="Preflight build (dev only)">
    Ejecuta la compilación de TypeScript en un worktree temporal. Si la punta falla, retrocede hasta 10 commits para encontrar el commit compilable más nuevo. Define `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` para ejecutar también lint durante esta comprobación previa; lint se ejecuta en modo serial restringido porque los hosts de actualización de usuarios suelen ser más pequeños que los runners de CI.
  </Step>
  <Step title="Rebase">
    Aplica rebase sobre el commit seleccionado (solo dev).
  </Step>
  <Step title="Install dependencies">
    Usa el gestor de paquetes del repositorio. Para checkouts con pnpm, el actualizador inicializa `pnpm` bajo demanda (primero mediante `corepack`, luego con un fallback temporal `npm install pnpm@11`) en lugar de ejecutar `npm run build` dentro de un workspace pnpm. Si la inicialización de pnpm todavía falla, el actualizador se detiene temprano con un error específico del gestor de paquetes en lugar de intentar `npm run build` en el checkout.
  </Step>
  <Step title="Build Control UI">
    Compila el gateway y la Control UI.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` se ejecuta como la comprobación final de actualización segura.
  </Step>
  <Step title="Sync plugins">
    Sincroniza plugins con el canal activo. Dev usa plugins incluidos; stable y beta usan npm. Actualiza instalaciones de plugins rastreadas.
  </Step>
</Steps>

### Detalles de sincronización de plugins

En el canal beta, las instalaciones de plugins npm y ClawHub rastreadas que siguen la
línea predeterminada/latest prueban primero una versión de plugin `@beta`. Si el plugin no tiene
versión beta, OpenClaw recurre a la especificación predeterminada/latest registrada e
informa una advertencia. Para plugins npm, OpenClaw también recurre al fallback cuando el paquete
beta existe pero falla la validación de instalación. Estas advertencias de fallback no
hacen fallar la actualización del núcleo. Las versiones exactas y las etiquetas explícitas nunca se reescriben.

<Warning>
Si una actualización de plugin npm fijada exactamente resuelve a un artefacto cuya integridad difiere del registro de instalación almacenado, `openclaw update` aborta esa actualización de artefacto de plugin en lugar de instalarlo. Reinstala o actualiza el plugin explícitamente solo después de verificar que confías en el nuevo artefacto.
</Warning>

<Note>
Los fallos de sincronización de plugins posteriores a la actualización que están limitados a un plugin administrado y que la ruta de sincronización puede sortear (por ejemplo, un registro npm inaccesible para un plugin no esencial) se informan como advertencias después de que la actualización del núcleo tiene éxito. El resultado JSON conserva `status: "ok"` en el nivel superior de actualización e informa `postUpdate.plugins.status: "warning"` con orientación de `openclaw update repair` y `openclaw plugins inspect <id> --runtime --json`. Las excepciones inesperadas del actualizador o de sincronización todavía hacen fallar el resultado de actualización. Corrige el error de instalación o actualización del plugin y luego vuelve a ejecutar `openclaw update repair`.

Después del paso de sincronización por plugin, `openclaw update` ejecuta una pasada obligatoria de **convergencia posterior al núcleo** antes de que el gateway se reinicie: repara cargas útiles de plugins configurados faltantes, valida cada registro de instalación rastreado _activo_ en disco y verifica estáticamente que su `package.json` sea analizable (y que cualquier `main` declarado explícitamente exista). Los fallos de esta pasada, y una instantánea de configuración no válida, devuelven `postUpdate.plugins.status: "error"` y cambian el `status` de actualización de nivel superior a `"error"`, por lo que `openclaw update` sale con código distinto de cero y el gateway _no_ se reinicia con un conjunto de plugins no verificado. El error incluye líneas estructuradas `postUpdate.plugins.warnings[].guidance` que apuntan a `openclaw update repair` y `openclaw plugins inspect <id> --runtime --json`. Las entradas de plugins deshabilitados y los registros que no son destinos oficiales de sincronización vinculados a fuentes de confianza se omiten aquí (reflejando la política `skipDisabledPlugins` usada por la comprobación de cargas útiles faltantes), por lo que un registro obsoleto de plugin deshabilitado no puede bloquear una actualización que de otro modo sería válida.

Cuando el Gateway actualizado inicia, la carga de plugins es solo de verificación: el inicio no ejecuta gestores de paquetes ni modifica árboles de dependencias. Los reinicios de `update.run` del gestor de paquetes se entregan a la ruta de servicio administrado de la CLI, por lo que el intercambio de paquetes ocurre fuera del proceso antiguo del Gateway y las comprobaciones de salud del servicio deciden si la actualización puede informarse como completa.
</Note>

Después de que una actualización de núcleo extended-stable tiene éxito, la integridad y
convergencia de plugins posteriores al núcleo apuntan a plugins npm oficiales elegibles en la versión exacta del núcleo instalado. Para la intención predeterminada/`latest`, OpenClaw no consulta
`@extended-stable` del plugin ni recurre a npm `latest`; deriva la versión del paquete
del núcleo instalado. Las fijaciones de versión explícitas, las etiquetas explícitas que no son `latest`,
los paquetes de terceros y las fuentes no npm conservan su intención existente.

Para instalaciones con gestor de paquetes, `openclaw update` resuelve la versión de paquete
objetivo antes de invocar el gestor de paquetes. Las instalaciones globales npm usan una instalación por etapas: OpenClaw instala el paquete nuevo en un prefijo npm temporal,
verifica allí el inventario `dist` empaquetado y luego intercambia ese árbol de paquete limpio
en el prefijo global real. Si la verificación falla, doctor posterior a la actualización,
sincronización de plugins y trabajo de reinicio no se ejecutan desde el árbol sospechoso. Incluso cuando la
versión instalada ya coincide con el objetivo, el comando actualiza la
instalación global del paquete, luego ejecuta la sincronización de plugins, una actualización de finalización de comandos del núcleo
y el trabajo de reinicio. Esto mantiene los sidecars empaquetados y los registros de plugins
propiedad del canal alineados con la compilación instalada de OpenClaw, mientras deja las reconstrucciones completas
de finalización de comandos de plugins para ejecuciones explícitas de
`openclaw completion --write-state`.

## Relacionado

- `openclaw doctor` (ofrece ejecutar update primero en checkouts de git)
- [Canales de desarrollo](/es/install/development-channels)
- [Actualización](/es/install/updating)
- [Referencia de CLI](/es/cli)
