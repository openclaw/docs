---
read_when:
    - Tienes problemas de conectividad/autenticación y quieres correcciones guiadas
    - Has actualizado y quieres una comprobación rápida
summary: Referencia de CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-11T20:26:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f2dd99f339e4fcdeeae840b75098f3c251b3aa133b7ea11b040b3c7f32c200
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Comprobaciones de estado y correcciones rápidas para el Gateway y los canales.

Relacionado:

- Solución de problemas: [Solución de problemas](/es/gateway/troubleshooting)
- Auditoría de seguridad: [Seguridad](/es/gateway/security)

## Ejemplos

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

Para permisos específicos de canal, usa las sondas de canal en lugar de `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

La sonda de capacidades dirigida de Discord informa los permisos efectivos del bot en el canal; la sonda de estado audita los canales de Discord configurados y los destinos de unión automática a voz.

## Opciones

- `--no-workspace-suggestions`: desactiva las sugerencias de memoria/búsqueda del espacio de trabajo
- `--yes`: acepta los valores predeterminados sin preguntar
- `--repair`: aplica reparaciones recomendadas que no son de servicio sin preguntar; las instalaciones y reescrituras del servicio de Gateway aún requieren confirmación interactiva o comandos explícitos de Gateway
- `--fix`: alias de `--repair`
- `--force`: aplica reparaciones agresivas, incluida la sobrescritura de configuración personalizada del servicio cuando sea necesario
- `--non-interactive`: ejecuta sin avisos; solo migraciones seguras y reparaciones que no sean de servicio
- `--generate-gateway-token`: genera y configura un token de Gateway
- `--deep`: escanea servicios del sistema en busca de instalaciones adicionales de Gateway e informa traspasos recientes de reinicio del supervisor de Gateway

Notas:

- En modo Nix (`OPENCLAW_NIX_MODE=1`), las comprobaciones de solo lectura de doctor aún funcionan, pero `doctor --fix`, `doctor --repair`, `doctor --yes` y `doctor --generate-gateway-token` están desactivados porque `openclaw.json` es inmutable. Edita la fuente de Nix para esta instalación en su lugar; para nix-openclaw, usa el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) con el agente primero.
- Los avisos interactivos (como correcciones de llavero/OAuth) solo se ejecutan cuando stdin es una TTY y `--non-interactive` **no** está establecido. Las ejecuciones sin interfaz (cron, Telegram, sin terminal) omitirán los avisos.
- Rendimiento: las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de estado sin interfaz sigan siendo rápidas. Las sesiones interactivas aún cargan completamente los plugins cuando una comprobación necesita su contribución.
- `--fix` (alias de `--repair`) escribe una copia de seguridad en `~/.openclaw/openclaw.json.bak` y elimina claves de configuración desconocidas, enumerando cada eliminación.
- `doctor --fix --non-interactive` informa definiciones de servicio de Gateway faltantes u obsoletas, pero no las instala ni las reescribe fuera del modo de reparación de actualización. Ejecuta `openclaw gateway install` para un servicio faltante, o `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el iniciador.
- Las comprobaciones de integridad de estado ahora detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere una confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin interfaz los dejan en su lugar.
- Doctor también escanea `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formatos heredados de trabajos de Cron y puede reescribirlos en su lugar antes de que el programador tenga que normalizarlos automáticamente en tiempo de ejecución.
- En Linux, doctor advierte cuando el crontab del usuario aún ejecuta el `~/.openclaw/bin/ensure-whatsapp.sh` heredado; ese script ya no se mantiene y puede registrar falsas interrupciones del Gateway de WhatsApp cuando cron carece del entorno de bus de usuario de systemd.
- Cuando WhatsApp está activado, doctor comprueba si hay un bucle de eventos de Gateway degradado con clientes locales de `openclaw-tui` aún en ejecución. `doctor --fix` detiene solo clientes TUI locales verificados para que las respuestas de WhatsApp no queden en cola detrás de bucles de actualización de TUI obsoletos.
- Doctor reescribe referencias de modelo heredadas `openai-codex/*` a referencias canónicas `openai/*` en modelos principales, respaldos, anulaciones de heartbeat/subagente/compaction, hooks, anulaciones de modelo por canal y pines obsoletos de ruta de sesión. `--fix` mueve la intención de Codex a entradas `agentRuntime.id: "codex"` con ámbito de proveedor/modelo, conserva pines de perfil de autenticación de sesión como `openai-codex:...`, elimina pines obsoletos de runtime de agente completo/sesión y mantiene las referencias reparadas de agentes de OpenAI en el enrutamiento de autenticación de Codex en lugar de autenticación directa con clave de API de OpenAI.
- Doctor limpia el estado heredado de preparación de dependencias de plugins creado por versiones antiguas de OpenClaw. También repara plugins descargables faltantes a los que hace referencia la configuración, como `plugins.entries`, canales configurados, ajustes configurados de proveedor/búsqueda o runtimes de agente configurados. Durante actualizaciones de paquete, doctor omite la reparación de plugins del gestor de paquetes hasta que el intercambio de paquete esté completo; vuelve a ejecutar `openclaw doctor --fix` después si un plugin configurado aún necesita recuperación. Si la descarga falla, doctor informa el error de instalación y conserva la entrada de plugin configurada para el siguiente intento de reparación.
- Doctor repara configuración obsoleta de plugins eliminando ids de plugins faltantes de `plugins.allow`/`plugins.deny`/`plugins.entries`, además de configuración de canal colgante coincidente, destinos de heartbeat y anulaciones de modelo por canal cuando el descubrimiento de plugins está en buen estado.
- Doctor pone en cuarentena configuración inválida de plugins desactivando la entrada `plugins.entries.<id>` afectada y eliminando su carga útil `config` inválida. El inicio de Gateway ya omite solo ese plugin incorrecto para que otros plugins y canales puedan seguir ejecutándose.
- Establece `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor posee el ciclo de vida del Gateway. Doctor aún informa el estado de Gateway/servicio y aplica reparaciones que no son de servicio, pero omite instalación/inicio/reinicio/bootstrap del servicio y limpieza de servicios heredados.
- En Linux, doctor ignora unidades systemd inactivas adicionales similares a Gateway y no reescribe metadatos de comando/punto de entrada para un servicio de Gateway systemd en ejecución durante la reparación. Detén el servicio primero o usa `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el iniciador activo.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y similares) a `talk.provider` + `talk.providers.<provider>`.
- Las ejecuciones repetidas de `doctor --fix` ya no informan/aplican normalización de Talk cuando la única diferencia es el orden de claves del objeto.
- Doctor incluye una comprobación de preparación de búsqueda de memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embeddings.
- Doctor advierte cuando no hay un propietario de comandos configurado. El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas. El emparejamiento por DM solo permite que alguien hable con el bot; si aprobaste un remitente antes de que existiera el bootstrap del primer propietario, establece `commands.ownerAllowFrom` explícitamente.
- Doctor advierte cuando agentes en modo Codex están configurados y existen recursos personales de la CLI de Codex en el directorio home de Codex del operador. Los lanzamientos locales del servidor de aplicaciones de Codex usan homes aislados por agente, así que usa `openclaw migrate codex --dry-run` para inventariar recursos que deberían promocionarse deliberadamente.
- Doctor elimina el `plugins.entries.codex.config.codexDynamicToolsProfile` retirado; el servidor de aplicaciones de Codex siempre mantiene nativas las herramientas de espacio de trabajo nativas de Codex.
- Doctor advierte cuando las Skills permitidas para el agente predeterminado no están disponibles en el entorno de runtime actual porque faltan bins, variables de entorno, configuración o requisitos del SO. `doctor --fix` puede desactivar esas Skills no disponibles con `skills.entries.<skill>.enabled=false`; instala/configura el requisito faltante en su lugar cuando quieras mantener la skill activa.
- Si el modo sandbox está activado pero Docker no está disponible, doctor informa una advertencia de alta señal con remediación (`install Docker` o `openclaw config set agents.defaults.sandbox.mode off`).
- Si hay archivos heredados de registro de sandbox (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor los informa; `openclaw doctor --fix` migra entradas válidas a directorios de registro fragmentados y pone en cuarentena archivos heredados inválidos.
- Si `gateway.auth.token`/`gateway.auth.password` están gestionados por SecretRef y no están disponibles en la ruta de comando actual, doctor informa una advertencia de solo lectura y no escribe credenciales alternativas en texto plano.
- Si la inspección de SecretRef de canal falla en una ruta de corrección, doctor continúa e informa una advertencia en lugar de salir antes de tiempo.
- Después de migraciones de directorios de estado, doctor advierte cuando cuentas predeterminadas activadas de Telegram o Discord dependen de respaldo por entorno y `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` no está disponible para el proceso de doctor.
- La resolución automática de nombres de usuario `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta de comando actual. Si la inspección del token no está disponible, doctor informa una advertencia y omite la resolución automática para esa pasada.

## macOS: anulaciones de entorno de `launchctl`

Si antes ejecutaste `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor anula tu archivo de configuración y puede causar errores persistentes de "unauthorized".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor de Gateway](/es/gateway/doctor)
