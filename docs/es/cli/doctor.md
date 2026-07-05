---
read_when:
    - Tienes problemas de conectividad/autenticación y quieres correcciones guiadas
    - Has actualizado y quieres una comprobación rápida
summary: Referencia de CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Doctor
x-i18n:
    generated_at: "2026-07-05T11:09:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f79924f095b94ed839fa1088908c89603396fe06ea28becb989069f6b5d113bf
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Comprobaciones de estado y correcciones rápidas para el gateway, canales, plugins, Skills, enrutamiento de modelos, estado local y migraciones de configuración. Úsalo cuando algo no se comporte como se espera y quieras que un solo comando explique qué está mal.

Relacionado:

- Solución de problemas: [Solución de problemas](/es/gateway/troubleshooting)
- Auditoría de seguridad: [Seguridad](/es/gateway/security)

## Posturas

| Postura     | Comando                  | Comportamiento                                                                                 |
| ----------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| Inspección  | `openclaw doctor`        | Comprobaciones orientadas a personas e indicaciones guiadas.                                   |
| Reparación  | `openclaw doctor --fix`  | Aplica reparaciones compatibles y solicita confirmación salvo que la reparación no interactiva sea segura. |
| Lint        | `openclaw doctor --lint` | Hallazgos estructurados de solo lectura para CI, preflight y puertas de revisión.              |

Prefiere `--lint` cuando la automatización necesite un resultado estable. Prefiere `--fix` cuando un operador humano quiera que doctor edite la configuración o el estado.

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

`channels capabilities` informa los permisos efectivos del bot para un destino de canal específico. `channels status --probe` audita todos los canales configurados y los destinos de unión automática por voz.

## Opciones

| Opción                       | Efecto                                                                                                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions` | Desactiva las sugerencias de memoria/búsqueda del espacio de trabajo.                                                                                                                   |
| `--yes`                      | Acepta los valores predeterminados sin solicitar confirmación.                                                                                                                          |
| `--repair` / `--fix`         | Aplica reparaciones recomendadas que no son de servicio sin solicitar confirmación (`--fix` es un alias). Las instalaciones/reescrituras del servicio Gateway aún requieren confirmación interactiva o comandos `gateway` explícitos. |
| `--force`                    | Aplica reparaciones agresivas, incluida la sobrescritura de configuración de servicio personalizada.                                                                                     |
| `--non-interactive`          | Se ejecuta sin solicitudes; solo migraciones seguras y reparaciones que no sean de servicio.                                                                                            |
| `--generate-gateway-token`   | Genera y configura un token de gateway.                                                                                                                                                 |
| `--allow-exec`               | Permite que doctor ejecute SecretRefs `exec` configuradas al verificar secretos.                                                                                                        |
| `--deep`                     | Escanea servicios del sistema en busca de instalaciones adicionales del gateway; informa traspasos recientes de reinicio del supervisor de Gateway.                                      |
| `--lint`                     | Ejecuta comprobaciones de estado modernizadas en modo de solo lectura y emite hallazgos de diagnóstico.                                                                                 |
| `--post-upgrade`             | Ejecuta sondas de compatibilidad de plugins posteriores a la actualización; los hallazgos van a stdout; código de salida 1 si hay algún hallazgo de nivel error.                         |
| `--json`                     | Con `--lint`: hallazgos JSON. Con `--post-upgrade`: envoltorio legible por máquina `{ probesRun, findings }`.                                                                           |
| `--severity-min <level>`     | Con `--lint`: descarta hallazgos por debajo de `info`, `warning` o `error`.                                                                                                             |
| `--all`                      | Con `--lint`: ejecuta todas las comprobaciones registradas, incluidas las comprobaciones opt-in excluidas del conjunto predeterminado.                                                   |
| `--skip <id>`                | Con `--lint`: omite un id de comprobación. Repetible.                                                                                                                                   |
| `--only <id>`                | Con `--lint`: ejecuta solo los id(s) de comprobación indicados. Repetible.                                                                                                              |

`--json`, `--severity-min`, `--all`, `--only` y `--skip` solo se aceptan junto con `--lint`.

## Modo lint

`openclaw doctor --lint` es de solo lectura: sin solicitudes, sin reparación, sin reescrituras de configuración/estado.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

La salida para personas es compacta:

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

La salida JSON es la superficie de scripting:

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

Códigos de salida:

| Código | Significado                                                   |
| ------ | ------------------------------------------------------------- |
| `0`    | No hay hallazgos en el umbral de gravedad seleccionado o por encima de él. |
| `1`    | Al menos un hallazgo cumple el umbral seleccionado.           |
| `2`    | Fallo de comando/runtime antes de que puedan producirse hallazgos de lint. |

`--severity-min` controla tanto qué hallazgos se imprimen como el umbral de salida: `openclaw doctor --lint --severity-min error` puede no imprimir nada y salir con `0` incluso cuando existen hallazgos `info`/`warning` de menor gravedad.

`--all` controla qué comprobaciones se seleccionan antes del filtrado por gravedad. La ejecución lint predeterminada excluye comprobaciones profundas, históricas o con más probabilidad de exponer residuos heredados reparables; usa `--all` para el inventario completo. `--only <id>` es el selector más preciso y puede ejecutar cualquier comprobación registrada por id.

## Comprobaciones de estado estructuradas

Las comprobaciones doctor modernas usan un contrato dividido pequeño:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` alimenta `doctor --lint`. `repair()` es opcional y solo se ejecuta con `doctor --fix` / `doctor --repair`. Las comprobaciones que no han migrado a esta forma aún usan el flujo de contribución doctor heredado.

Los contextos de reparación pueden transportar solicitudes `dryRun`/`diff`; los resultados de reparación pueden devolver `diffs` estructurados (ediciones de configuración/archivo) y `effects` (servicio, proceso, paquete, estado u otros efectos secundarios), para que las comprobaciones convertidas puedan avanzar hacia `doctor --fix --dry-run` sin mover la planificación de mutaciones a `detect()`.

`repair()` informa `status: "repaired" | "skipped" | "failed"` (si se omite el estado, significa `repaired`). Cuando la reparación devuelve `skipped` o `failed`, doctor informa el motivo y omite la validación de esa comprobación. Después de una reparación correcta, doctor vuelve a ejecutar `detect()` limitado a los hallazgos reparados; si el hallazgo sigue presente, doctor informa una advertencia de reparación en lugar de tratar el cambio como completado.

Un hallazgo incluye:

| Campo             | Propósito                                              |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Id estable para filtros skip/only y listas de permitidos de CI. |
| `severity`        | `info`, `warning` o `error`.                           |
| `message`         | Declaración del problema legible por personas.         |
| `path`            | Configuración, archivo o ruta lógica cuando esté disponible. |
| `line` / `column` | Ubicación de origen cuando esté disponible.            |
| `ocPath`          | Dirección `oc://` precisa cuando una comprobación puede apuntar a una. |
| `fixHint`         | Acción sugerida para el operador o resumen de reparación. |

Las comprobaciones doctor de núcleo modernizadas permanecen adjuntas a la contribución doctor ordenada que posee su comportamiento humano `doctor` / `doctor --fix`. El registro compartido de estado estructurado es el punto de extensión: las comprobaciones empaquetadas y respaldadas por plugins se ejecutan después de las comprobaciones doctor de núcleo una vez que su paquete propietario las registra en la ruta de comando activa. `openclaw/plugin-sdk/health` expone el mismo contrato para autores de plugins.

## Selección de comprobaciones

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` y `--skip` aceptan id completos de comprobación y pueden repetirse. Si un id `--only` no está registrado, no se ejecuta ninguna comprobación para ese id; usa `checksRun`/`checksSkipped` en la salida para confirmar que una puerta enfocada selecciona las comprobaciones que esperas.

## Modo posterior a la actualización

`openclaw doctor --post-upgrade` ejecuta sondas de compatibilidad de plugins para encadenarlas después de una compilación o actualización. Los hallazgos van a stdout; el código de salida es 1 si algún hallazgo tiene `level: "error"`. Añade `--json` para obtener un envoltorio legible por máquina (`{ probesRun, findings }`), adecuado para CI, la skill comunitaria `fork-upgrade` y otras herramientas de smoke posteriores a la actualización. Si el índice de plugins instalado falta o está mal formado, el modo JSON aún emite el envoltorio con un hallazgo de error `plugin.index_unavailable`.

## Notas

- En modo Nix (`OPENCLAW_NIX_MODE=1`), las comprobaciones de solo lectura de doctor siguen funcionando, pero `doctor --fix`, `doctor --repair`, `doctor --yes` y `doctor --generate-gateway-token` están deshabilitados porque `openclaw.json` es inmutable. Edita en su lugar el origen Nix de esta instalación; para nix-openclaw, usa el [inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) orientado a agentes.
- Los prompts interactivos (correcciones de llavero/OAuth, etc.) solo se ejecutan cuando stdin es una TTY y `--non-interactive` **no** está configurado. Las ejecuciones sin interfaz (cron, Telegram, sin terminal) omiten los prompts.
- Las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de salud sin interfaz sigan siendo rápidas. Las sesiones interactivas siguen cargando las superficies de plugin necesarias para el flujo heredado de salud/reparación.
- `--lint` es más estricto que `--non-interactive`: siempre es de solo lectura, nunca muestra prompts y nunca aplica migraciones seguras. Usa `doctor --fix` o `doctor --repair` cuando quieras que doctor realice cambios.
- Doctor no ejecuta SecretRefs `exec` al comprobar secretos de forma predeterminada. Usa `--allow-exec` (con o sin `--lint`) solo cuando quieras intencionadamente que doctor ejecute esos resolutores de secretos configurados.
- Cualquier escritura de configuración (incluida una reparación con `--fix`) rota una copia de seguridad a `~/.openclaw/openclaw.json.bak` (con un anillo numerado `.bak.1`..`.bak.4`). `--fix` también elimina claves de configuración desconocidas reportadas por la validación del esquema, listando cada eliminación; omite esto mientras hay una actualización en curso para que el estado de actualización escrito parcialmente no se elimine antes de que termine su migración.
- Configura `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor sea dueño del ciclo de vida del Gateway. Doctor sigue reportando la salud del Gateway/servicio y aplica reparaciones que no son de servicio, pero omite la instalación/inicio/reinicio/bootstrap del servicio y la limpieza del servicio heredado.
- En Linux, doctor ignora unidades systemd adicionales inactivas parecidas al Gateway y no reescribe metadatos de comando/punto de entrada para un servicio Gateway systemd en ejecución durante la reparación. Detén primero el servicio, o usa `openclaw gateway install --force` para reemplazar el lanzador activo.
- `doctor --fix --non-interactive` reporta definiciones de servicio Gateway ausentes o obsoletas, pero no las instala ni reescribe fuera del modo de reparación de actualización. Ejecuta `openclaw gateway install` para un servicio ausente, o `openclaw gateway install --force` para reemplazar el lanzador.
- Las comprobaciones de integridad de estado detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin interfaz los dejan en su lugar.
- Doctor escanea `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formas heredadas de trabajos cron y las reescribe antes de importar filas canónicas a SQLite.
- Doctor reporta trabajos cron con una anulación explícita de `payload.model`, incluidos recuentos por espacio de nombres de proveedor y discrepancias con `agents.defaults.model`, para que los trabajos programados que no heredan el modelo predeterminado sean visibles durante investigaciones de autenticación o facturación.
- En Linux, doctor advierte cuando el crontab del usuario todavía ejecuta el script heredado sin mantenimiento `~/.openclaw/bin/ensure-whatsapp.sh`, que puede reportar erróneamente `Gateway inactive` cuando cron no tiene el entorno de bus de usuario de systemd.
- Cuando WhatsApp está habilitado, doctor comprueba si hay un bucle de eventos Gateway degradado con clientes locales `openclaw-tui` aún en ejecución. `doctor --fix` detiene solo clientes TUI locales verificados para que las respuestas de WhatsApp no queden en cola detrás de bucles de actualización TUI obsoletos.
- Doctor reescribe refs de modelo heredadas `openai-codex/*` a refs canónicas `openai/*` en modelos primarios, fallbacks, modelos de generación de imagen/video, anulaciones de heartbeat/subagente/compaction, hooks, anulaciones de modelo de canal y pins obsoletos de ruta de sesión. `--fix` también migra perfiles de autenticación heredados `openai-codex:*` y entradas `auth.order.openai-codex` a `openai:*`, mueve la intención Codex a entradas `agentRuntime.id: "codex"` con alcance de proveedor/modelo, elimina pins obsoletos de runtime de agente completo/sesión, y mantiene las refs de agente OpenAI reparadas en enrutamiento de autenticación Codex en lugar de autenticación directa con clave de API de OpenAI.
- Doctor limpia el estado heredado de preparación de dependencias de plugins de versiones anteriores de OpenClaw y vuelve a enlazar el paquete host `openclaw` para plugins npm administrados que lo declaran como dependencia peer. También repara plugins descargables ausentes referenciados por la configuración (`plugins.entries`, canales configurados, ajustes configurados de proveedor/búsqueda, runtimes de agente configurados). Durante actualizaciones de paquetes, doctor omite la reparación de plugins del gestor de paquetes hasta que se complete el reemplazo del paquete; vuelve a ejecutar `openclaw doctor --fix` después si un plugin configurado aún necesita recuperación. Si una descarga falla, doctor reporta el error de instalación y conserva la entrada de plugin configurada para el siguiente intento de reparación.
- Doctor repara configuración obsoleta de plugins eliminando ids de plugin ausentes de `plugins.allow`/`plugins.deny`/`plugins.entries`, además de la configuración de canal colgante correspondiente, destinos de heartbeat y anulaciones de modelo de canal, cuando el descubrimiento de plugins está saludable.
- Doctor pone en cuarentena configuración inválida de plugins deshabilitando la entrada `plugins.entries.<id>` afectada y eliminando su payload `config` inválido. El inicio del Gateway ya omite solo ese plugin defectuoso para que otros plugins y canales sigan ejecutándose.
- Doctor elimina el retirado `plugins.entries.codex.config.codexDynamicToolsProfile`; el servidor de aplicaciones Codex siempre mantiene nativas las herramientas de workspace nativas de Codex.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y similares) a `talk.provider` + `talk.providers.<provider>`. Las ejecuciones repetidas de `doctor --fix` ya no reportan/aplican normalización de Talk cuando la única diferencia es el orden de claves del objeto.
- Doctor incluye una comprobación de preparación de búsqueda de memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embeddings.
- Doctor advierte cuando no hay un dueño de comandos configurado. El dueño de comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del dueño y aprobar acciones peligrosas. El emparejamiento por DM solo permite que alguien hable con el bot; si aprobaste un remitente antes de que existiera el bootstrap del primer dueño, configura `commands.ownerAllowFrom` explícitamente.
- Doctor reporta una nota informativa cuando hay agentes en modo Codex configurados y existen assets personales de la CLI de Codex en el home Codex del operador. Los lanzamientos del servidor de aplicaciones Codex local usan homes aislados por agente; instala primero el plugin Codex si es necesario, luego usa `openclaw migrate plan codex` para inventariar assets que deberían promocionarse deliberadamente.
- Doctor advierte cuando skills permitidas para el agente predeterminado no están disponibles en el entorno de runtime actual (bins, variables de entorno, configuración o requisitos de SO ausentes). `doctor --fix` puede deshabilitar esas skills no disponibles con `skills.entries.<skill>.enabled=false`; instala/configura el requisito faltante en su lugar si quieres mantener la skill activa.
- Si el modo sandbox está habilitado pero Docker no está disponible, doctor reporta una advertencia de alta señal con remediación (`install Docker` u `openclaw config set agents.defaults.sandbox.mode off`).
- Si hay archivos heredados de registro sandbox o directorios de shards presentes (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` o `~/.openclaw/sandbox/browsers/`), doctor los reporta; `--fix` migra entradas válidas a SQLite y pone en cuarentena archivos heredados inválidos.
- Si `gateway.auth.token`/`gateway.auth.password` están gestionados por SecretRef y no están disponibles en la ruta de comando actual, doctor reporta una advertencia de solo lectura y no escribe credenciales fallback en texto plano. Para SecretRefs respaldadas por exec, doctor omite la ejecución a menos que `--allow-exec` esté presente.
- Si la inspección de SecretRef de canal falla en una ruta de corrección, doctor continúa y reporta una advertencia en lugar de salir anticipadamente.
- Después de migraciones del directorio de estado, doctor advierte cuando las cuentas predeterminadas habilitadas de Telegram o Discord dependen de fallback de entorno y `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` no están disponibles para el proceso doctor.
- La resolución automática de nombre de usuario `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta de comando actual. Si la inspección del token no está disponible, doctor reporta una advertencia y omite la resolución automática en esa pasada.

## macOS: anulaciones de entorno de `launchctl`

Si anteriormente ejecutaste `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor anula tu archivo de configuración y puede causar errores persistentes de "unauthorized".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor del Gateway](/es/gateway/doctor)
