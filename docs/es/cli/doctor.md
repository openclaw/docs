---
read_when:
    - Tienes problemas de conectividad/autenticación y quieres soluciones guiadas
    - Actualizaste y quieres una comprobación rápida
summary: Referencia de CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Doctor
x-i18n:
    generated_at: "2026-06-27T10:58:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Comprobaciones de salud y correcciones rápidas para el Gateway y los canales.

Relacionado:

- Solución de problemas: [Solución de problemas](/es/gateway/troubleshooting)
- Auditoría de seguridad: [Seguridad](/es/gateway/security)

## Por Qué Usarlo

`openclaw doctor` es la superficie de salud de OpenClaw. Úsalo cuando el Gateway,
los canales, plugins, skills, el enrutamiento de modelos, el estado local o las migraciones de configuración
no se comporten como se espera y quieras un único comando que pueda explicar qué
está mal.

Doctor tiene tres posturas:

| Postura | Comando                  | Comportamiento                                                                        |
| ------- | ------------------------ | ------------------------------------------------------------------------------- |
| Inspeccionar | `openclaw doctor`        | Comprobaciones orientadas a personas y avisos guiados.                                       |
| Reparar  | `openclaw doctor --fix`  | Aplica reparaciones compatibles, usando avisos salvo que la reparación no interactiva sea segura. |
| Lint    | `openclaw doctor --lint` | Hallazgos estructurados de solo lectura para CI, comprobaciones preliminares y puertas de revisión.              |

Prefiere `--lint` cuando la automatización necesita un resultado estable. Prefiere `--fix` cuando un
operador humano quiere intencionadamente que doctor edite la configuración o el estado.

## Ejemplos

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
```

Para permisos específicos de canal, usa las sondas de canal en lugar de `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

La sonda de capacidades dirigida de Discord informa los permisos de canal efectivos del bot; la sonda de estado audita los canales de Discord configurados y los destinos de auto-unión de voz.

## Opciones

- `--no-workspace-suggestions`: deshabilita las sugerencias de memoria/búsqueda del espacio de trabajo
- `--yes`: acepta los valores predeterminados sin pedir confirmación
- `--repair`: aplica reparaciones recomendadas no relacionadas con servicios sin pedir confirmación; las instalaciones y reescrituras del servicio Gateway siguen requiriendo confirmación interactiva o comandos explícitos de Gateway
- `--fix`: alias de `--repair`
- `--force`: aplica reparaciones agresivas, incluida la sobrescritura de configuración de servicio personalizada cuando sea necesario
- `--non-interactive`: ejecuta sin avisos; solo migraciones seguras y reparaciones no relacionadas con servicios
- `--generate-gateway-token`: genera y configura un token de Gateway
- `--allow-exec`: permite que doctor ejecute SecretRefs exec configuradas al verificar secretos
- `--deep`: examina los servicios del sistema en busca de instalaciones adicionales de Gateway e informa traspasos recientes de reinicio del supervisor de Gateway
- `--lint`: ejecuta comprobaciones de salud modernizadas en modo de solo lectura y emite hallazgos de diagnóstico
- `--post-upgrade`: ejecuta sondas de compatibilidad de plugins posteriores a la actualización; emite hallazgos en stdout; sale con código 1 si hay hallazgos de nivel de error
- `--json`: con `--lint`, emite hallazgos JSON en lugar de salida humana; con `--post-upgrade`, emite un sobre JSON legible por máquina (`{ probesRun, findings }`)
- `--severity-min <level>`: con `--lint`, descarta hallazgos por debajo de `info`, `warning` o `error`
- `--all`: con `--lint`, ejecuta todas las comprobaciones registradas, incluidas las comprobaciones de suscripción excluidas del conjunto de automatización predeterminado
- `--skip <id>`: con `--lint`, omite un id de comprobación; repítelo para omitir más de uno
- `--only <id>`: con `--lint`, ejecuta solo un id de comprobación; repítelo para ejecutar un conjunto pequeño seleccionado

## Modo Lint

`openclaw doctor --lint` es la postura de automatización de solo lectura para las comprobaciones de doctor.
Usa la ruta de comprobaciones de salud estructuradas, no pide confirmación y no repara
ni reescribe configuración/estado. Úsalo en CI, scripts de comprobación preliminar y flujos de revisión
cuando quieras hallazgos legibles por máquina en lugar de avisos guiados de reparación.
Las opciones de salida de lint como `--json`, `--severity-min`, `--all`, `--only` y `--skip`
solo se aceptan con `--lint`.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

La salida humana es compacta:

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

La salida JSON es la superficie de scripting para ejecuciones de lint:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

Comportamiento de salida:

- `0`: no hay hallazgos en el umbral de gravedad seleccionado o por encima de él
- `1`: al menos un hallazgo alcanza el umbral seleccionado
- `2`: fallo de comando/runtime antes de que puedan producirse hallazgos de lint

`--severity-min` controla tanto los hallazgos visibles como el umbral de salida. Por
ejemplo, `openclaw doctor --lint --severity-min error` puede no imprimir hallazgos y
salir con `0` incluso cuando existen hallazgos de menor gravedad `info` o `warning`.

`--all` controla qué comprobaciones se seleccionan antes del filtrado de gravedad. La
ejecución de lint predeterminada es la puerta de automatización estable y excluye comprobaciones que son
intencionadamente de suscripción porque son profundas, históricas o más propensas a
sacar a la luz residuos heredados reparables. Usa `--all` cuando quieras el inventario completo de lint
sin listar cada id de comprobación. `--only <id>` sigue siendo el selector más preciso
y puede ejecutar cualquier comprobación registrada por id.

## Comprobaciones de Salud Estructuradas

Las comprobaciones modernas de doctor usan un pequeño contrato estructurado:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` impulsa `doctor --lint`. `repair()` es opcional y solo se considera
por `doctor --fix` / `doctor --repair`. Las comprobaciones que no han migrado a esta
forma siguen usando el flujo heredado de contribución de doctor.

La separación es intencional: `detect()` se encarga del diagnóstico, mientras que `repair()` se encarga de
informar qué cambió o cambiaría. Los contextos de reparación pueden transportar solicitudes
`dryRun`/`diff`, y los resultados de reparación pueden devolver `diffs` estructurados para
ediciones de configuración/archivo, además de `effects` para efectos secundarios de servicio, proceso, paquete, estado u otros.
Eso permite que las comprobaciones convertidas evolucionen hacia `doctor --fix --dry-run`
e informes de diff sin mover la planificación de mutaciones a `detect()`.

`repair()` informa si intentó la reparación solicitada con `status:
"repaired" | "skipped" | "failed"`. El estado omitido significa `repaired`, por lo que las comprobaciones de
reparación simples solo necesitan devolver cambios. Cuando repair devuelve `skipped` o
`failed`, doctor informa el motivo y no ejecuta validación para esa comprobación.

Después de una reparación estructurada correcta, doctor vuelve a ejecutar `detect()` con los
hallazgos reparados como ámbito. Las comprobaciones pueden usar hallazgos seleccionados, rutas o valores `ocPath`
para una validación enfocada. Si el hallazgo sigue presente, doctor informa una
advertencia de reparación en lugar de tratar el cambio como completado silenciosamente.

Un hallazgo incluye:

| Campo             | Propósito                                                |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Id estable para filtros skip/only y listas de permitidos de CI.     |
| `severity`        | `info`, `warning` o `error`.                         |
| `message`         | Declaración del problema legible por humanos.                      |
| `path`            | Ruta de configuración, archivo o lógica cuando esté disponible.          |
| `line` / `column` | Ubicación de origen cuando esté disponible.                        |
| `ocPath`          | Dirección `oc://` precisa cuando una comprobación puede apuntar a una. |
| `fixHint`         | Acción sugerida para el operador o resumen de reparación.           |

Las comprobaciones modernizadas del núcleo de doctor permanecen adjuntas a la contribución ordenada de doctor
que posee su comportamiento humano de `doctor` / `doctor --fix`. El registro compartido de salud estructurada
es el punto de extensión: las comprobaciones empaquetadas y respaldadas por plugins se ejecutan
después de las comprobaciones del núcleo de doctor una vez que su paquete propietario las registra en la ruta de comando
activa. La subruta `openclaw/plugin-sdk/health` expone el mismo
contrato para esos consumidores de extensiones.

## Selección de Comprobaciones

Usa `--only` y `--skip` cuando un flujo de trabajo quiera una puerta enfocada:

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` y `--skip` aceptan ids completos de comprobación y pueden repetirse. Si un id de `--only`
no está registrado, no se ejecuta ninguna comprobación para ese id; usa los campos `checksRun`
y `checksSkipped` del comando para verificar que una puerta enfocada esté seleccionando las comprobaciones que
esperas.

## Modo Posterior a la Actualización

`openclaw doctor --post-upgrade` ejecuta sondas de compatibilidad de plugins pensadas para
encadenarse después de una compilación o actualización. Los hallazgos se emiten en stdout; el comando
sale con código 1 si algún hallazgo tiene `level: "error"`. Añade `--json` para recibir un
sobre legible por máquina (`{ probesRun, findings }`) adecuado para CI, la
Skill comunitaria `fork-upgrade` y otras herramientas de smoke posteriores a la actualización. Si el
índice de plugins instalado falta o está mal formado, el modo JSON sigue emitiendo ese
sobre con un hallazgo de error `plugin.index_unavailable`.

Notas:

- En modo Nix (`OPENCLAW_NIX_MODE=1`), las comprobaciones de doctor de solo lectura siguen funcionando, pero `doctor --fix`, `doctor --repair`, `doctor --yes` y `doctor --generate-gateway-token` están deshabilitados porque `openclaw.json` es inmutable. Edita en su lugar la fuente Nix de esta instalación; para nix-openclaw, usa el [inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.
- Los prompts interactivos (como las correcciones de keychain/OAuth) solo se ejecutan cuando stdin es una TTY y `--non-interactive` **no** está configurado. Las ejecuciones headless (cron, Telegram, sin terminal) omitirán los prompts.
- Rendimiento: las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de salud headless sigan siendo rápidas. Las sesiones interactivas de doctor aún cargan las superficies de plugin necesarias para el flujo heredado de salud y reparación.
- `--lint` es más estricto que `--non-interactive`: siempre es de solo lectura, nunca muestra prompts y nunca aplica migraciones seguras. Ejecuta `doctor --fix` o `doctor --repair` cuando quieras que doctor haga cambios.
- De forma predeterminada, doctor no ejecuta SecretRefs `exec` al comprobar secretos. Usa `openclaw doctor --allow-exec` u `openclaw doctor --lint --allow-exec` solo cuando quieras intencionalmente que doctor ejecute esos resolutores de secretos configurados.
- `--fix` (alias de `--repair`) escribe una copia de seguridad en `~/.openclaw/openclaw.json.bak` y descarta claves de configuración desconocidas, listando cada eliminación.
- Las comprobaciones de salud modernizadas pueden exponer una ruta `repair()` para `doctor --fix`; las comprobaciones que no exponen una continúan por el flujo existente de reparación de doctor.
- `doctor --fix --non-interactive` informa definiciones de servicio de Gateway ausentes u obsoletas, pero no las instala ni las reescribe fuera del modo de reparación de actualización. Ejecuta `openclaw gateway install` si falta un servicio, u `openclaw gateway install --force` cuando quieras intencionalmente reemplazar el lanzador.
- Las comprobaciones de integridad de estado ahora detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere una confirmación interactiva; `--fix`, `--yes` y las ejecuciones headless los dejan en su lugar.
- Doctor también escanea `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formas heredadas de trabajos Cron y las reescribe antes de importar filas canónicas a SQLite.
- Doctor informa trabajos Cron con anulaciones explícitas de `payload.model`, incluidos conteos por espacio de nombres de proveedor y discrepancias con `agents.defaults.model`, para que los trabajos programados que no heredan el modelo predeterminado sean visibles durante investigaciones de autenticación o facturación.
- En Linux, doctor advierte cuando el crontab del usuario aún ejecuta el `~/.openclaw/bin/ensure-whatsapp.sh` heredado; ese script ya no se mantiene y puede registrar falsas interrupciones del Gateway de WhatsApp cuando Cron carece del entorno de bus de usuario de systemd.
- Cuando WhatsApp está habilitado, doctor comprueba si hay un bucle de eventos de Gateway degradado con clientes locales `openclaw-tui` aún en ejecución. `doctor --fix` detiene solo clientes TUI locales verificados para que las respuestas de WhatsApp no queden en cola detrás de bucles de actualización TUI obsoletos.
- Doctor reescribe referencias de modelo heredadas `openai-codex/*` a referencias canónicas `openai/*` en modelos primarios, fallbacks, modelos de generación de imágenes/video, anulaciones de heartbeat/subagent/compaction, hooks, anulaciones de modelo por canal y pines obsoletos de rutas de sesión. `--fix` también migra perfiles de autenticación heredados `openai-codex:*` y entradas `auth.order.openai-codex` a `openai:*`, mueve la intención Codex a entradas `agentRuntime.id: "codex"` con alcance de proveedor/modelo, elimina pines obsoletos de runtime de agente completo/sesión y mantiene las referencias reparadas de agentes OpenAI en el enrutamiento de autenticación Codex en lugar de autenticación directa con clave de API de OpenAI.
- Doctor limpia el estado heredado de preparación de dependencias de plugins creado por versiones anteriores de OpenClaw y revincula el paquete host `openclaw` para plugins npm gestionados que lo declaran como dependencia peer. También repara plugins descargables faltantes referenciados por la configuración, como `plugins.entries`, canales configurados, ajustes configurados de proveedor/búsqueda o runtimes de agente configurados. Durante actualizaciones de paquetes, doctor omite la reparación de plugins del gestor de paquetes hasta que el intercambio de paquetes se complete; vuelve a ejecutar `openclaw doctor --fix` después si un plugin configurado aún necesita recuperación. Si la descarga falla, doctor informa el error de instalación y conserva la entrada de plugin configurada para el siguiente intento de reparación.
- Doctor repara configuración obsoleta de plugins eliminando ids de plugins faltantes de `plugins.allow`/`plugins.deny`/`plugins.entries`, además de configuración de canal colgante coincidente, destinos Heartbeat y anulaciones de modelo por canal cuando el descubrimiento de plugins está sano.
- Doctor pone en cuarentena configuración inválida de plugins deshabilitando la entrada `plugins.entries.<id>` afectada y eliminando su payload `config` inválido. El arranque de Gateway ya omite solo ese plugin defectuoso para que otros plugins y canales puedan seguir ejecutándose.
- Configura `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor posee el ciclo de vida del Gateway. Doctor sigue informando la salud de Gateway/servicio y aplica reparaciones ajenas al servicio, pero omite instalación/inicio/reinicio/bootstrap de servicio y limpieza de servicios heredados.
- En Linux, doctor ignora unidades systemd extra tipo Gateway inactivas y no reescribe metadatos de comando/entrypoint para un servicio Gateway systemd en ejecución durante la reparación. Detén primero el servicio o usa `openclaw gateway install --force` cuando quieras intencionalmente reemplazar el lanzador activo.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y similares) a `talk.provider` + `talk.providers.<provider>`.
- Las ejecuciones repetidas de `doctor --fix` ya no informan/aplican normalización de Talk cuando la única diferencia es el orden de claves del objeto.
- Doctor incluye una comprobación de preparación de búsqueda en memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embeddings.
- Doctor advierte cuando no hay ningún propietario de comandos configurado. El propietario de comandos es la cuenta del operador humano autorizada a ejecutar comandos exclusivos de propietario y aprobar acciones peligrosas. El emparejamiento por DM solo permite que alguien hable con el bot; si aprobaste un remitente antes de que existiera el bootstrap del primer propietario, configura `commands.ownerAllowFrom` explícitamente.
- Doctor informa una nota informativa cuando hay agentes en modo Codex configurados y existen recursos personales de Codex CLI en el Codex home del operador. Los lanzamientos locales del app-server de Codex usan homes aislados por agente, así que instala primero el plugin Codex si es necesario y luego usa `openclaw migrate plan codex` para inventariar los recursos que deberían promocionarse deliberadamente.
- Doctor elimina el `plugins.entries.codex.config.codexDynamicToolsProfile` retirado; el app-server de Codex siempre mantiene nativas las herramientas de workspace nativas de Codex.
- Doctor advierte cuando las Skills permitidas para el agente predeterminado no están disponibles en el entorno de runtime actual porque faltan bins, env vars, configuración o requisitos del SO. `doctor --fix` puede deshabilitar esas Skills no disponibles con `skills.entries.<skill>.enabled=false`; instala/configura el requisito faltante en su lugar cuando quieras mantener activa la Skill.
- Si el modo sandbox está habilitado pero Docker no está disponible, doctor informa una advertencia de alta señal con remediación (`install Docker` u `openclaw config set agents.defaults.sandbox.mode off`).
- Si hay archivos heredados de registro sandbox o directorios shard presentes (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` o `~/.openclaw/sandbox/browsers/`), doctor los informa; `openclaw doctor --fix` migra las entradas válidas a SQLite y pone en cuarentena los archivos heredados inválidos.
- Si `gateway.auth.token`/`gateway.auth.password` están gestionados por SecretRef y no están disponibles en la ruta de comando actual, doctor informa una advertencia de solo lectura y no escribe credenciales fallback en texto plano. Para SecretRefs respaldados por exec, doctor omite la ejecución salvo que `--allow-exec` esté presente.
- Si la inspección de SecretRef de canal falla en una ruta de corrección, doctor continúa e informa una advertencia en lugar de salir temprano.
- Después de migraciones del directorio de estado, doctor advierte cuando cuentas predeterminadas habilitadas de Telegram o Discord dependen de fallback por env y `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` no está disponible para el proceso doctor.
- La resolución automática de nombre de usuario `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta de comando actual. Si la inspección del token no está disponible, doctor informa una advertencia y omite la resolución automática en esa pasada.

## macOS: anulaciones de env de `launchctl`

Si ejecutaste anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor anula tu archivo de configuración y puede causar errores persistentes de "unauthorized".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor de Gateway](/es/gateway/doctor)
