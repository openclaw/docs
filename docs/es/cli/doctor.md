---
read_when:
    - Tienes problemas de conectividad/autenticación y quieres soluciones guiadas
    - Actualizaste y quieres una revisión rápida
summary: Referencia de CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Doctor
x-i18n:
    generated_at: "2026-05-12T08:45:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90050276597a50abcc3638e7b7b50f29ef0682f5da30d33d5dca3ad6117173e0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Comprobaciones de estado + correcciones rápidas para el Gateway y los canales.

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

La sonda dirigida de capacidades de Discord informa de los permisos efectivos del bot en el canal; la sonda de estado audita los canales de Discord configurados y los destinos de unión automática por voz.

## Opciones

- `--no-workspace-suggestions`: desactiva las sugerencias de memoria/búsqueda del espacio de trabajo
- `--yes`: acepta los valores predeterminados sin preguntar
- `--repair`: aplica las reparaciones recomendadas no relacionadas con servicios sin preguntar; las instalaciones y reescrituras del servicio Gateway aún requieren confirmación interactiva o comandos explícitos de Gateway
- `--fix`: alias de `--repair`
- `--force`: aplica reparaciones agresivas, incluida la sobrescritura de la configuración personalizada del servicio cuando sea necesario
- `--non-interactive`: ejecuta sin indicaciones; solo migraciones seguras y reparaciones no relacionadas con servicios
- `--generate-gateway-token`: genera y configura un token de Gateway
- `--deep`: analiza los servicios del sistema en busca de instalaciones adicionales de Gateway e informa de transferencias recientes de reinicio del supervisor de Gateway

Notas:

- En modo Nix (`OPENCLAW_NIX_MODE=1`), las comprobaciones de solo lectura de doctor siguen funcionando, pero `doctor --fix`, `doctor --repair`, `doctor --yes` y `doctor --generate-gateway-token` están desactivados porque `openclaw.json` es inmutable. Edita en su lugar la fuente Nix de esta instalación; para nix-openclaw, usa la [Guía de inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrada en el agente.
- Las indicaciones interactivas (como correcciones de llavero/OAuth) solo se ejecutan cuando stdin es un TTY y `--non-interactive` **no** está definido. Las ejecuciones sin interfaz (cron, Telegram, sin terminal) omitirán las indicaciones.
- Rendimiento: las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de estado sin interfaz sigan siendo rápidas. Las sesiones interactivas siguen cargando completamente los plugins cuando una comprobación necesita su contribución.
- `--fix` (alias de `--repair`) escribe una copia de seguridad en `~/.openclaw/openclaw.json.bak` y elimina claves de configuración desconocidas, listando cada eliminación.
- `doctor --fix --non-interactive` informa de definiciones de servicio Gateway ausentes u obsoletas, pero no las instala ni las reescribe fuera del modo de reparación de actualización. Ejecuta `openclaw gateway install` si falta un servicio, o `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador.
- Las comprobaciones de integridad de estado ahora detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere una confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin interfaz los dejan en su lugar.
- Doctor también analiza `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formas heredadas de trabajos cron y puede reescribirlas en su lugar antes de que el programador tenga que normalizarlas automáticamente en tiempo de ejecución.
- En Linux, doctor advierte cuando el crontab del usuario aún ejecuta el `~/.openclaw/bin/ensure-whatsapp.sh` heredado; ese script ya no se mantiene y puede registrar falsas interrupciones del Gateway de WhatsApp cuando cron carece del entorno del bus de usuario de systemd.
- Cuando WhatsApp está activado, doctor comprueba si hay un bucle de eventos de Gateway degradado con clientes locales `openclaw-tui` aún en ejecución. `doctor --fix` detiene solo clientes TUI locales verificados para que las respuestas de WhatsApp no queden en cola detrás de bucles obsoletos de actualización de TUI.
- Doctor reescribe referencias de modelo heredadas `openai-codex/*` a referencias canónicas `openai/*` en modelos principales, alternativas, sobrescrituras de heartbeat/subagente/compaction, hooks, sobrescrituras de modelo de canal y pines obsoletos de ruta de sesión. `--fix` mueve la intención de Codex a entradas `agentRuntime.id: "codex"` con ámbito de proveedor/modelo, conserva pines de perfil de autenticación de sesión como `openai-codex:...`, elimina pines obsoletos de runtime de agente completo/sesión y mantiene las referencias reparadas de agentes de OpenAI en el enrutamiento de autenticación de Codex en lugar de autenticación directa con clave de API de OpenAI.
- Doctor limpia el estado heredado de preparación de dependencias de plugins creado por versiones anteriores de OpenClaw y vuelve a enlazar el paquete host `openclaw` para plugins npm gestionados que lo declaran como dependencia par. También repara plugins descargables ausentes que están referenciados por la configuración, como `plugins.entries`, canales configurados, ajustes configurados de proveedor/búsqueda o runtimes de agente configurados. Durante actualizaciones de paquetes, doctor omite la reparación de plugins del gestor de paquetes hasta que el intercambio de paquete se complete; vuelve a ejecutar `openclaw doctor --fix` después si un plugin configurado aún necesita recuperación. Si la descarga falla, doctor informa del error de instalación y conserva la entrada del plugin configurado para el siguiente intento de reparación.
- Doctor repara configuración obsoleta de plugins eliminando ids de plugins ausentes de `plugins.allow`/`plugins.deny`/`plugins.entries`, además de la configuración de canal colgante correspondiente, destinos de heartbeat y sobrescrituras de modelo de canal cuando el descubrimiento de plugins está correcto.
- Doctor pone en cuarentena configuración de plugin inválida desactivando la entrada `plugins.entries.<id>` afectada y eliminando su carga útil `config` inválida. El arranque de Gateway ya omite solo ese plugin defectuoso para que otros plugins y canales puedan seguir ejecutándose.
- Define `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor controla el ciclo de vida de Gateway. Doctor sigue informando del estado de Gateway/servicio y aplica reparaciones no relacionadas con servicios, pero omite la instalación/inicio/reinicio/bootstrap del servicio y la limpieza de servicios heredados.
- En Linux, doctor ignora unidades systemd inactivas adicionales similares a Gateway y no reescribe metadatos de comando/punto de entrada para un servicio Gateway systemd en ejecución durante la reparación. Detén primero el servicio o usa `openclaw gateway install --force` cuando quieras reemplazar intencionalmente el lanzador activo.
- Doctor migra automáticamente la configuración Talk plana heredada (`talk.voiceId`, `talk.modelId` y similares) a `talk.provider` + `talk.providers.<provider>`.
- Las ejecuciones repetidas de `doctor --fix` ya no informan/aplican normalización de Talk cuando la única diferencia es el orden de las claves del objeto.
- Doctor incluye una comprobación de preparación de búsqueda de memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embeddings.
- Doctor advierte cuando no hay propietario de comandos configurado. El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas. El emparejamiento por DM solo permite que alguien hable con el bot; si aprobaste un remitente antes de que existiera el bootstrap del primer propietario, define `commands.ownerAllowFrom` explícitamente.
- Doctor advierte cuando hay agentes en modo Codex configurados y existen recursos personales de Codex CLI en el directorio de inicio de Codex del operador. Los lanzamientos locales del servidor de aplicación de Codex usan directorios de inicio aislados por agente, así que usa `openclaw migrate codex --dry-run` para inventariar recursos que deberían promoverse deliberadamente.
- Doctor elimina el `plugins.entries.codex.config.codexDynamicToolsProfile` retirado; el servidor de aplicación de Codex siempre mantiene nativas las herramientas de espacio de trabajo nativas de Codex.
- Doctor advierte cuando las Skills permitidas para el agente predeterminado no están disponibles en el entorno de runtime actual porque faltan binarios, variables de entorno, configuración o requisitos del SO. `doctor --fix` puede desactivar esas Skills no disponibles con `skills.entries.<skill>.enabled=false`; instala/configura el requisito faltante en su lugar cuando quieras mantener la skill activa.
- Si el modo sandbox está activado pero Docker no está disponible, doctor informa de una advertencia de alta señal con remedio (`install Docker` u `openclaw config set agents.defaults.sandbox.mode off`).
- Si hay archivos heredados de registro de sandbox (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), doctor informa de ellos; `openclaw doctor --fix` migra entradas válidas a directorios de registro fragmentados y pone en cuarentena los archivos heredados inválidos.
- Si `gateway.auth.token`/`gateway.auth.password` son gestionados por SecretRef y no están disponibles en la ruta de comando actual, doctor informa de una advertencia de solo lectura y no escribe credenciales alternativas en texto plano.
- Si la inspección de SecretRef de canal falla en una ruta de corrección, doctor continúa e informa de una advertencia en lugar de salir antes de tiempo.
- Después de migraciones del directorio de estado, doctor advierte cuando cuentas predeterminadas activadas de Telegram o Discord dependen de la alternativa de env y `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` no está disponible para el proceso de doctor.
- La resolución automática de nombres de usuario de `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta de comando actual. Si la inspección del token no está disponible, doctor informa de una advertencia y omite la resolución automática en esa pasada.

## macOS: sobrescrituras de env de `launchctl`

Si anteriormente ejecutaste `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor sobrescribe tu archivo de configuración y puede causar errores persistentes de "unauthorized".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor de Gateway](/es/gateway/doctor)
