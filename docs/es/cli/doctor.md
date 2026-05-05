---
read_when:
    - Tienes problemas de conectividad/autenticación y quieres correcciones guiadas
    - Has actualizado y quieres una verificación rápida
summary: Referencia de CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-05T08:25:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6101008d1cb7e08f9902a8a29785710f325966524b003b87b5c628fe906ab78
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

## Opciones

- `--no-workspace-suggestions`: desactiva las sugerencias de memoria/búsqueda del espacio de trabajo
- `--yes`: acepta los valores predeterminados sin preguntar
- `--repair`: aplica las reparaciones recomendadas que no son de servicio sin preguntar; las instalaciones y reescrituras del servicio de Gateway aún requieren confirmación interactiva o comandos explícitos de Gateway
- `--fix`: alias de `--repair`
- `--force`: aplica reparaciones agresivas, incluida la sobrescritura de la configuración de servicio personalizada cuando sea necesario
- `--non-interactive`: ejecuta sin solicitudes; solo migraciones seguras y reparaciones que no son de servicio
- `--generate-gateway-token`: genera y configura un token de Gateway
- `--deep`: analiza los servicios del sistema en busca de instalaciones adicionales de Gateway e informa traspasos recientes de reinicio del supervisor de Gateway

Notas:

- Las solicitudes interactivas (como correcciones de llavero/OAuth) solo se ejecutan cuando stdin es una TTY y `--non-interactive` **no** está configurado. Las ejecuciones sin interfaz (Cron, Telegram, sin terminal) omitirán las solicitudes.
- Rendimiento: las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de estado sin interfaz sigan siendo rápidas. Las sesiones interactivas siguen cargando completamente los plugins cuando una comprobación necesita su contribución.
- `--fix` (alias de `--repair`) escribe una copia de seguridad en `~/.openclaw/openclaw.json.bak` y elimina claves de configuración desconocidas, enumerando cada eliminación.
- `doctor --fix --non-interactive` informa definiciones de servicio de Gateway faltantes u obsoletas, pero no las instala ni las reescribe fuera del modo de reparación de actualización. Ejecuta `openclaw gateway install` si falta un servicio, o `openclaw gateway install --force` cuando intencionalmente quieras reemplazar el lanzador.
- Las comprobaciones de integridad de estado ahora detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere una confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin interfaz los dejan en su lugar.
- Doctor también analiza `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formatos heredados de trabajos de Cron y puede reescribirlos in situ antes de que el planificador tenga que normalizarlos automáticamente en tiempo de ejecución.
- En Linux, Doctor advierte cuando el crontab del usuario aún ejecuta el `~/.openclaw/bin/ensure-whatsapp.sh` heredado; ese script ya no se mantiene y puede registrar falsas interrupciones del Gateway de WhatsApp cuando Cron no tiene el entorno de bus de usuario de systemd.
- Cuando WhatsApp está habilitado, Doctor comprueba si hay un bucle de eventos de Gateway degradado con clientes locales de `openclaw-tui` aún en ejecución. `doctor --fix` detiene solo clientes TUI locales verificados para que las respuestas de WhatsApp no queden en cola detrás de bucles de actualización TUI obsoletos.
- Doctor limpia el estado heredado de preparación de dependencias de plugins creado por versiones anteriores de OpenClaw. También repara plugins descargables faltantes que están referenciados por la configuración, como `plugins.entries`, canales configurados, ajustes configurados de proveedor/búsqueda o runtimes de agente configurados. Durante las actualizaciones de paquete, Doctor omite la reparación de plugins del gestor de paquetes hasta que se complete el cambio de paquete; vuelve a ejecutar `openclaw doctor --fix` después si un plugin configurado aún necesita recuperación. Si la descarga falla, Doctor informa el error de instalación y conserva la entrada del plugin configurado para el siguiente intento de reparación.
- Doctor repara configuraciones obsoletas de plugins eliminando ids de plugins faltantes de `plugins.allow`/`plugins.entries`, además de la configuración de canal colgante correspondiente, objetivos de Heartbeat y anulaciones de modelo de canal cuando la detección de plugins es correcta.
- Doctor pone en cuarentena configuraciones de plugins no válidas deshabilitando la entrada `plugins.entries.<id>` afectada y eliminando su carga útil `config` no válida. El inicio de Gateway ya omite solo ese plugin defectuoso para que otros plugins y canales puedan seguir ejecutándose.
- Establece `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor controla el ciclo de vida del Gateway. Doctor sigue informando el estado del Gateway/servicio y aplica reparaciones que no son de servicio, pero omite la instalación/inicio/reinicio/bootstrap del servicio y la limpieza de servicios heredados.
- En Linux, Doctor ignora unidades systemd inactivas adicionales similares a Gateway y no reescribe metadatos de comando/punto de entrada para un servicio Gateway de systemd en ejecución durante la reparación. Detén primero el servicio o usa `openclaw gateway install --force` cuando intencionalmente quieras reemplazar el lanzador activo.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y similares) a `talk.provider` + `talk.providers.<provider>`.
- Las ejecuciones repetidas de `doctor --fix` ya no informan/aplican normalización de Talk cuando la única diferencia es el orden de las claves del objeto.
- Doctor incluye una comprobación de preparación de búsqueda en memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embeddings.
- Doctor advierte cuando no hay un propietario de comandos configurado. El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas. El emparejamiento por DM solo permite que alguien hable con el bot; si aprobaste un remitente antes de que existiera el bootstrap del primer propietario, configura `commands.ownerAllowFrom` explícitamente.
- Doctor advierte cuando hay agentes en modo Codex configurados y existen activos personales de Codex CLI en el directorio de inicio de Codex del operador. Los inicios locales del servidor de aplicaciones de Codex usan directorios de inicio aislados por agente, así que usa `openclaw migrate codex --dry-run` para inventariar activos que deban promoverse deliberadamente.
- Doctor advierte cuando las Skills permitidas para el agente predeterminado no están disponibles en el entorno de runtime actual porque faltan binarios, variables de entorno, configuración o requisitos del SO. `doctor --fix` puede deshabilitar esas Skills no disponibles con `skills.entries.<skill>.enabled=false`; instala/configura el requisito faltante en su lugar cuando quieras mantener la Skill activa.
- Si el modo sandbox está habilitado pero Docker no está disponible, Doctor informa una advertencia de alta señal con remediación (`install Docker` u `openclaw config set agents.defaults.sandbox.mode off`).
- Si existen archivos heredados del registro de sandbox (`~/.openclaw/sandbox/containers.json` o `~/.openclaw/sandbox/browsers.json`), Doctor los informa; `openclaw doctor --fix` migra las entradas válidas a directorios de registro fragmentados y pone en cuarentena los archivos heredados no válidos.
- Si `gateway.auth.token`/`gateway.auth.password` están gestionados por SecretRef y no están disponibles en la ruta de comando actual, Doctor informa una advertencia de solo lectura y no escribe credenciales de reserva en texto plano.
- Si la inspección de SecretRef de canal falla en una ruta de corrección, Doctor continúa e informa una advertencia en lugar de salir antes.
- Después de las migraciones de directorio de estado, Doctor advierte cuando cuentas predeterminadas habilitadas de Telegram o Discord dependen de la reserva mediante entorno y `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` no están disponibles para el proceso de Doctor.
- La resolución automática de nombres de usuario de `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta de comando actual. Si la inspección del token no está disponible, Doctor informa una advertencia y omite la resolución automática en esa pasada.

## macOS: anulaciones de entorno de `launchctl`

Si anteriormente ejecutaste `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor anula tu archivo de configuración y puede causar errores persistentes de “no autorizado”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor de Gateway](/es/gateway/doctor)
