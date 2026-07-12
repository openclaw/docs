---
read_when:
    - Quieres actualizar de forma segura una copia local del código fuente
    - Está depurando la salida o las opciones de `openclaw update`
    - Debes comprender el comportamiento de la forma abreviada `--update`
summary: Referencia de la CLI para `openclaw update` (actualización de código fuente relativamente segura + reinicio automático del Gateway)
title: Actualizar
x-i18n:
    generated_at: "2026-07-12T14:23:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2db7b636b68e693824cb49ada2c176a4e394a3100ce33fff1c96ee20ae8427ee
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Actualiza OpenClaw y cambia entre los canales stable/extended-stable/beta/dev.

Si se instaló mediante **npm/pnpm/bun** (instalación global, sin metadatos de git),
las actualizaciones siguen el flujo del gestor de paquetes descrito en
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
scripts de inicio).

## Opciones

| Indicador                                        | Descripción                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | Omite el reinicio del servicio Gateway después de una actualización correcta. Las actualizaciones mediante el gestor de paquetes que sí reinician verifican que el servicio reiniciado informe de la versión esperada antes de que el comando finalice correctamente.                                                                                             |
| `--channel <stable\|extended-stable\|beta\|dev>` | Establece el canal de actualización y lo conserva después de que la actualización del núcleo finalice correctamente. Extended-stable solo está disponible para paquetes.                                                                                                                                                                                          |
| `--tag <dist-tag\|version\|spec>`                | Sustituye el paquete de destino únicamente para esta actualización. No se puede combinar con un canal `extended-stable` efectivo, cuyo destino exacto verificado es obligatorio. Para otras instalaciones de paquetes, `main` se asigna a `github:openclaw/openclaw#main`; las especificaciones de origen GitHub/git se empaquetan en un tarball temporal antes de la instalación global de npm por etapas. |
| `--dry-run`                                      | Muestra una vista previa de las acciones planificadas (flujo de canal/etiqueta/destino/reinicio) sin escribir la configuración, instalar, sincronizar plugins ni reiniciar.                                                                                                                                                                                         |
| `--json`                                         | Imprime JSON `UpdateRunResult` legible por máquinas. Incluye `postUpdate.plugins.warnings` cuando un plugin gestionado necesita reparación, detalles del mecanismo alternativo para plugins del canal beta y `postUpdate.plugins.integrityDrifts` cuando se detecta una desviación en los artefactos de plugins de npm durante la sincronización posterior a la actualización.                         |
| `--timeout <seconds>`                            | Tiempo de espera por paso. Valor predeterminado: `1800`.                                                                                                                                                                                                                                                                                                           |
| `--yes`                                          | Omite las solicitudes de confirmación (por ejemplo, la confirmación de una degradación de versión).                                                                                                                                                                                                                                                                |
| `--acknowledge-clawhub-risk`                     | Permite que la sincronización de plugins posterior a la actualización continúe a pesar de las advertencias de confianza de la comunidad de ClawHub sin una solicitud interactiva. Sin esta opción, las versiones de la comunidad que presentan riesgos se omiten y permanecen sin cambios cuando OpenClaw no puede solicitar confirmación. Los paquetes oficiales de ClawHub y las fuentes de plugins incluidos omiten esta solicitud. |

No existe el indicador `--verbose`. Use `--dry-run` para obtener una vista previa de las acciones planificadas,
`--json` para obtener resultados legibles por máquinas y `openclaw update status --json`
solo para consultar el canal y la disponibilidad. El nivel de detalle de la consola del Gateway (`--verbose`) y
el nivel de registro en archivos (`logging.level: "debug"`/`"trace"`) son controles independientes; consulte
[Registro del Gateway](/es/gateway/logging).

<Note>
En el modo Nix (`OPENCLAW_NIX_MODE=1`), se deshabilitan las ejecuciones de `openclaw update` que realizan cambios. En su lugar, actualice el origen de Nix o la entrada de flake de esta instalación; para nix-openclaw, use la [Guía de inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrada primero en el agente. `openclaw update status` y `openclaw update --dry-run` siguen siendo de solo lectura.
</Note>

<Warning>
Las degradaciones de versión requieren confirmación porque las versiones anteriores pueden dañar la configuración.
Si la instalación ya migró las sesiones a SQLite, restaure los artefactos archivados de transcripciones heredadas
antes de iniciar una versión anterior basada en archivos. Consulte
[Doctor: Degradación de versión después de migrar las sesiones a SQLite](/es/cli/doctor#downgrading-after-session-sqlite-migration).
</Warning>

## `update status`

Muestra el canal de actualización activo, la etiqueta/rama/SHA de git (solo en copias de trabajo del código fuente)
y la disponibilidad de actualizaciones.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| Indicador             | Valor predeterminado | Descripción                                    |
| --------------------- | -------------------- | ---------------------------------------------- |
| `--json`              | `false`              | Imprime el estado en JSON legible por máquinas. |
| `--timeout <seconds>` | `3`                  | Tiempo de espera para las comprobaciones.      |

Para las instalaciones de paquetes extended-stable, el estado realiza la misma selección pública
y verificación exacta del paquete que la actualización en primer plano. Puede informar
`ahead of extended-stable` cuando la versión instalada es más reciente. Los errores JSON
incluyen `registry.reason` (`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` o `unsupported_git_channel`).

## `update repair`

Vuelve a ejecutar la finalización de la actualización después de que el paquete principal ya haya cambiado, pero el trabajo
de reparación posterior no haya finalizado correctamente. Esta es la vía de recuperación admitida cuando
`openclaw update` instaló el nuevo paquete principal, pero la sincronización de plugins posterior a la actualización del núcleo,
los metadatos de plugins de npm gestionados, la actualización del registro o la reparación mediante Doctor no
convergieron.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| Indicador                                        | Descripción                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | Conserva el canal de actualización del núcleo antes de la reparación. Para extended-stable, los plugins oficiales de npm aptos que siguen la intención básica/predeterminada o `latest` usan como destino la versión exacta instalada del núcleo. La reparación de extended-stable se rechaza en copias de trabajo de Git sin cambiar la configuración. |
| `--json`                                         | Imprime JSON de finalización legible por máquinas.                                                                                                                                                                                                                                                                                     |
| `--timeout <seconds>`                            | Tiempo de espera para los pasos de reparación. Valor predeterminado: `1800`.                                                                                                                                                                                                                                                           |
| `--yes`                                          | Omite las solicitudes de confirmación.                                                                                                                                                                                                                                                                                                 |
| `--acknowledge-clawhub-risk`                     | Tiene el mismo comportamiento que en `openclaw update`.                                                                                                                                                                                                                                                                                |
| `--no-restart`                                   | Se acepta para mantener la paridad; la reparación nunca reinicia el Gateway.                                                                                                                                                                                                                                                           |

`update repair` ejecuta `openclaw doctor --fix`, vuelve a cargar la configuración reparada y
los registros de instalación, sincroniza los plugins con seguimiento para el canal de actualización activo, actualiza
las instalaciones de plugins de npm gestionadas, repara las cargas útiles faltantes de plugins configurados,
actualiza el registro de plugins y escribe metadatos convergentes de los registros de instalación.
No instala un nuevo paquete principal ni reinicia el Gateway.

## `update wizard`

Flujo interactivo para elegir un canal de actualización y confirmar si se debe reiniciar el
Gateway después (de forma predeterminada, se reinicia). Al seleccionar `dev` sin una copia de trabajo de git,
se ofrece la posibilidad de crear una.

| Indicador             | Valor predeterminado | Descripción                                |
| --------------------- | -------------------- | ------------------------------------------ |
| `--timeout <seconds>` | `1800`               | Tiempo de espera para cada paso de actualización. |

## Qué hace

Al cambiar de canal explícitamente (`--channel ...`), también se mantiene
alineado el método de instalación:

- `dev` -> garantiza que exista una copia de trabajo de git (de forma predeterminada, `~/openclaw`, o
  `$OPENCLAW_HOME/openclaw` cuando se establece `OPENCLAW_HOME`; se puede sustituir con
  `OPENCLAW_GIT_DIR`), la actualiza e instala la CLI global desde esa
  copia de trabajo.
- `stable` -> instala desde npm mediante `latest`.
- `extended-stable` -> resuelve el selector público `extended-stable` de npm,
  verifica el paquete exacto seleccionado e instala esa versión exacta. No
  recurre a otro selector como alternativa y se rechaza para copias de trabajo de Git.
- `beta` -> prefiere la etiqueta de distribución `beta` de npm y recurre a `latest` como alternativa cuando beta
  no está disponible o es anterior a la versión estable actual.

### Transferencia del reinicio

El actualizador automático del núcleo del Gateway (cuando se habilita mediante la configuración) inicia la ruta de actualización de la CLI
fuera del controlador de solicitudes activo del Gateway. Las actualizaciones del gestor de paquetes
`update.run` del plano de control y las actualizaciones supervisadas de copias de trabajo de git utilizan
la misma transferencia al servicio gestionado, en lugar de sustituir el árbol de paquetes o
recompilar `dist/` dentro del proceso activo del Gateway: el Gateway inicia un
proceso auxiliar desacoplado y finaliza, y dicho proceso auxiliar ejecuta `openclaw update --yes --json`
desde fuera del árbol de procesos del Gateway. Si la transferencia no está disponible,
`update.run` devuelve una respuesta estructurada con el comando de shell seguro que debe ejecutarse
manualmente.

Las selecciones de estabilidad extendida almacenadas reciben avisos de inicio de solo lectura y de actualización cada 24 horas
cuando `update.checkOnStart` está habilitado. Estas comprobaciones nunca aplican una actualización,
inician una transferencia, reinician el Gateway, usan el retraso o la variación aleatoria de estable ni usan la
cadencia de sondeo de beta. Siguen siendo compatibles las actualizaciones explícitas en primer plano, las actualizaciones simples en primer plano con
`update.channel: "extended-stable"` almacenado, el estado bajo demanda y su
transferencia administrada del Gateway.

Cuando hay instalado un servicio local administrado del Gateway y el reinicio está habilitado,
las actualizaciones mediante el gestor de paquetes y desde un checkout de Git detienen el servicio en ejecución antes de
reemplazar el árbol de paquetes o modificar el checkout o la salida de compilación. A continuación, el actualizador
renueva los metadatos del servicio, reinicia el servicio y verifica el
Gateway reiniciado antes de informar `Gateway: restarted and verified.`.
Además, las actualizaciones mediante el gestor de paquetes verifican que el Gateway reiniciado indique la
versión de paquete esperada; las actualizaciones desde un checkout de Git verifican el estado del gateway y
la disponibilidad del servicio después de la recompilación.

En macOS, la comprobación posterior a la actualización también verifica que el LaunchAgent esté
cargado y en ejecución para el perfil activo y que el puerto de bucle invertido configurado esté
operativo. Si el plist está instalado pero launchd no lo supervisa, OpenClaw
vuelve a inicializar el LaunchAgent automáticamente y ejecuta de nuevo las comprobaciones de estado, versión y
disponibilidad del canal (una inicialización nueva carga directamente el trabajo `RunAtLoad`,
por lo que la recuperación no ejecuta inmediatamente `kickstart -k` en el Gateway recién iniciado). Si
el Gateway sigue sin estar operativo, el comando termina con un código distinto de cero e
imprime la ruta del registro de reinicio, además de instrucciones para reiniciar, reinstalar y revertir
el paquete.

Si no se puede ejecutar el reinicio, el comando imprime `Gateway: restart skipped (...)` o
`Gateway: restart failed: ...` con una indicación para ejecutar manualmente `openclaw gateway restart`.
Con `--no-restart`, el reemplazo del paquete o la recompilación de Git siguen ejecutándose, pero el
servicio administrado no se detiene ni se reinicia, por lo que el Gateway en ejecución conserva el código
anterior hasta que se reinicie manualmente.

### Formato de respuesta del plano de control

Cuando `update.run` se ejecuta a través del plano de control del Gateway en una instalación
mediante un gestor de paquetes o un checkout de Git supervisado, el controlador informa del inicio de la transferencia
por separado de la actualización de la CLI que continúa después de que el Gateway termina:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` y
  `handoff.status: "started"`: el Gateway creó la transferencia del servicio administrado
  y programó su propio reinicio para que el proceso auxiliar desacoplado pueda ejecutar
  `openclaw update --yes --json` fuera del proceso del servicio activo.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` y
  `handoff.status: "unavailable"`: OpenClaw no pudo encontrar un
  límite de servicio supervisor ni una identidad de servicio persistente para realizar una transferencia segura (por
  ejemplo, la transferencia de systemd requiere la identidad de unidad `OPENCLAW_SYSTEMD_UNIT`,
  no solo marcadores de proceso de systemd presentes en el entorno). La respuesta incluye
  `handoff.command`, el comando de shell que debe ejecutarse desde fuera del Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`: el Gateway
  intentó crear la transferencia, pero no pudo iniciar el proceso auxiliar desacoplado.

La carga útil `sentinel` se escribe antes de que el Gateway termine, y la transferencia de la CLI
actualiza ese mismo centinela de reinicio después de que finalicen las comprobaciones de estado
posteriores al reinicio del servicio administrado. Durante la transferencia, el centinela puede contener
`stats.reason: "restart-health-pending"` sin una continuación de éxito; el
Gateway reiniciado lo sondea y activa la continuación solo después de que la CLI haya
verificado el estado del servicio y reescrito el centinela con el resultado `ok` final.
`openclaw status` y `openclaw status --all` muestran una fila `Update restart`
mientras ese centinela esté pendiente o haya fallado, y `update.status` actualiza y
devuelve el centinela más reciente.

## Flujo de checkout de Git

### Selección del canal

- `stable`: obtiene la etiqueta no beta más reciente y, a continuación, compila y ejecuta doctor.
- `beta`: da preferencia a la etiqueta `-beta` más reciente y recurre a la etiqueta estable más reciente
  cuando beta no existe o es más antigua.
- `dev`: obtiene `main` y, a continuación, recupera y reorganiza los commits mediante rebase.
- `extended-stable`: no es compatible con los checkouts de Git; no se produce ninguna modificación
  del checkout.

### Pasos de actualización

<Steps>
  <Step title="Verificar que el árbol de trabajo esté limpio">
    Requiere que no haya cambios sin confirmar.
  </Step>
  <Step title="Cambiar de canal">
    Cambia al canal seleccionado (etiqueta o rama).
  </Step>
  <Step title="Recuperar desde el repositorio ascendente">
    Solo para dev.
  </Step>
  <Step title="Compilación preliminar (solo dev)">
    Ejecuta la compilación de TypeScript en un árbol de trabajo temporal. Si la punta falla, retrocede hasta 10 commits para encontrar el commit compilable más reciente. Establezca `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` para ejecutar también el lint durante esta comprobación preliminar; el lint se ejecuta en modo serie restringido porque los equipos de actualización de los usuarios suelen tener menos recursos que los ejecutores de CI.
  </Step>
  <Step title="Reorganizar commits mediante rebase">
    Realiza un rebase sobre el commit seleccionado (solo dev).
  </Step>
  <Step title="Instalar dependencias">
    Usa el gestor de paquetes del repositorio. Para los checkouts de pnpm, el actualizador inicializa `pnpm` bajo demanda (primero mediante `corepack` y, después, con `npm install pnpm@11` temporal como alternativa) en lugar de ejecutar `npm run build` dentro de un espacio de trabajo de pnpm. Si la inicialización de pnpm sigue fallando, el actualizador se detiene antes con un error específico del gestor de paquetes en lugar de intentar ejecutar `npm run build` en el checkout.
  </Step>
  <Step title="Compilar la interfaz de control">
    Compila el gateway y la interfaz de control.
  </Step>
  <Step title="Ejecutar doctor">
    `openclaw doctor` se ejecuta como comprobación final de actualización segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza los plugins con el canal activo. Dev usa plugins incluidos; stable y beta usan npm. Actualiza las instalaciones de plugins registradas.
  </Step>
</Steps>

### Detalles de sincronización de plugins

En el canal beta, las instalaciones registradas de plugins de npm y ClawHub que siguen la
línea predeterminada o más reciente intentan primero usar una versión `@beta` del plugin. Si el plugin no tiene una
versión beta, OpenClaw recurre a la especificación predeterminada o más reciente registrada e
informa de una advertencia. Para los plugins de npm, OpenClaw también recurre a la alternativa cuando el
paquete beta existe, pero no supera la validación de instalación. Estas advertencias de uso de alternativas no
hacen que falle la actualización del núcleo. Las versiones exactas y las etiquetas explícitas nunca se reescriben.

<Warning>
Si una actualización de un plugin de npm fijada a una versión exacta se resuelve en un artefacto cuya integridad difiere del registro de instalación almacenado, `openclaw update` cancela la actualización de ese artefacto del plugin en lugar de instalarlo. Reinstale o actualice el plugin explícitamente solo después de verificar que confía en el nuevo artefacto.
</Warning>

<Note>
Los fallos de sincronización de plugins posteriores a la actualización que se limitan a un plugin administrado y que la ruta de sincronización puede eludir (por ejemplo, un registro de npm inaccesible para un plugin no esencial) se notifican como advertencias después de que la actualización del núcleo finalice correctamente. El resultado JSON mantiene el `status: "ok"` de la actualización en el nivel superior e informa `postUpdate.plugins.status: "warning"` con indicaciones para ejecutar `openclaw update repair` y `openclaw plugins inspect <id> --runtime --json`. Las excepciones inesperadas del actualizador o de la sincronización siguen haciendo que falle el resultado de la actualización. Corrija el error de instalación o actualización del plugin y, a continuación, vuelva a ejecutar `openclaw update repair`.

Después del paso de sincronización de cada plugin, `openclaw update` ejecuta una pasada obligatoria de **convergencia posterior al núcleo** antes de que el gateway se reinicie: repara las cargas útiles ausentes de plugins configurados, valida en disco cada registro de instalación registrado _activo_ y verifica estáticamente que su `package.json` pueda analizarse (y que cualquier `main` declarado explícitamente exista). Los fallos de esta pasada, así como una instantánea de configuración no válida, devuelven `postUpdate.plugins.status: "error"` y cambian el `status` de actualización del nivel superior a `"error"`, por lo que `openclaw update` termina con un código distinto de cero y el gateway _no_ se reinicia con un conjunto de plugins sin verificar. El error incluye líneas estructuradas en `postUpdate.plugins.warnings[].guidance` que apuntan a `openclaw update repair` y `openclaw plugins inspect <id> --runtime --json`. Aquí se omiten las entradas de plugins deshabilitados y los registros que no sean destinos oficiales de sincronización vinculados a una fuente de confianza (en consonancia con la política `skipDisabledPlugins` usada por la comprobación de cargas útiles ausentes), por lo que un registro obsoleto de un plugin deshabilitado no puede bloquear una actualización que, por lo demás, sea válida.

Cuando se inicia el Gateway actualizado, la carga de plugins es solo de verificación: el inicio no ejecuta gestores de paquetes ni modifica árboles de dependencias. Los reinicios de `update.run` mediante el gestor de paquetes se transfieren a la ruta de servicio administrado de la CLI, por lo que el intercambio de paquetes se produce fuera del proceso anterior del Gateway y las comprobaciones de estado del servicio determinan si la actualización puede notificarse como completada.
</Note>

Después de que una actualización del núcleo de estabilidad extendida finalice correctamente, la integridad y
convergencia de plugins posteriores al núcleo se dirigen a los plugins oficiales de npm aptos en la versión exacta
del núcleo instalada. Para la intención predeterminada o `latest`, OpenClaw no consulta
`@extended-stable` del plugin ni recurre a `latest` de npm; obtiene la versión del paquete
a partir del núcleo instalado. Las versiones fijadas explícitamente, las etiquetas explícitas distintas de `latest`,
los paquetes de terceros y las fuentes que no sean npm conservan su intención existente.

Para las instalaciones mediante un gestor de paquetes, `openclaw update` resuelve la versión de paquete
de destino antes de invocar el gestor de paquetes. Las instalaciones globales de npm usan una instalación
por etapas: OpenClaw instala el paquete nuevo en un prefijo temporal de npm,
verifica allí el inventario de `dist` del paquete y, a continuación, intercambia ese árbol de paquetes
limpio con el prefijo global real. Si la verificación falla, las tareas posteriores de doctor,
sincronización de plugins y reinicio no se ejecutan desde el árbol sospechoso. Incluso cuando la
versión instalada ya coincide con la de destino, el comando renueva la
instalación global del paquete y, después, ejecuta la sincronización de plugins, una actualización de la finalización
de comandos del núcleo y las tareas de reinicio. Esto mantiene los componentes auxiliares incluidos en el paquete y los registros de
plugins propiedad del canal alineados con la compilación instalada de OpenClaw, mientras deja las
recompilaciones completas de finalización de comandos de plugins para ejecuciones explícitas de
`openclaw completion --write-state`.

## Contenido relacionado

- `openclaw doctor` (ofrece ejecutar primero la actualización en checkouts de Git)
- [Canales de desarrollo](/es/install/development-channels)
- [Actualización](/es/install/updating)
- [Referencia de la CLI](/es/cli)
