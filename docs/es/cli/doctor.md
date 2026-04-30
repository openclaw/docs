---
read_when:
    - Tienes problemas de conectividad/autenticación y quieres correcciones guiadas
    - Has actualizado y quieres una comprobación rápida
summary: Referencia de CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Diagnóstico
x-i18n:
    generated_at: "2026-04-30T05:33:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9985c84d23861dd9468a4659ee00519573fe6d540c436548da0a68067dbabc4c
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

- `--no-workspace-suggestions`: deshabilita las sugerencias de memoria/búsqueda del espacio de trabajo
- `--yes`: acepta los valores predeterminados sin solicitar confirmación
- `--repair`: aplica las reparaciones recomendadas sin solicitar confirmación
- `--fix`: alias de `--repair`
- `--force`: aplica reparaciones agresivas, incluida la sobrescritura de la configuración personalizada del servicio cuando sea necesario
- `--non-interactive`: ejecuta sin solicitudes; solo migraciones seguras
- `--generate-gateway-token`: genera y configura un token de Gateway
- `--deep`: escanea los servicios del sistema en busca de instalaciones adicionales del Gateway

Notas:

- Las solicitudes interactivas (como correcciones de llavero/OAuth) solo se ejecutan cuando stdin es un TTY y `--non-interactive` **no** está establecido. Las ejecuciones sin interfaz (cron, Telegram, sin terminal) omitirán las solicitudes.
- Rendimiento: las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de estado sin interfaz sigan siendo rápidas. Las sesiones interactivas siguen cargando completamente los plugins cuando una comprobación necesita su contribución.
- `--fix` (alias de `--repair`) escribe una copia de seguridad en `~/.openclaw/openclaw.json.bak` y descarta claves de configuración desconocidas, listando cada eliminación.
- Las comprobaciones de integridad de estado ahora detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere una confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin interfaz los dejan en su lugar.
- Doctor también escanea `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formas heredadas de trabajos cron y puede reescribirlas en el lugar antes de que el programador tenga que normalizarlas automáticamente en tiempo de ejecución.
- Doctor repara dependencias de runtime faltantes de plugins incluidos sin escribir en instalaciones globales empaquetadas. Para instalaciones npm propiedad de root o unidades systemd endurecidas, establece `OPENCLAW_PLUGIN_STAGE_DIR` en un directorio escribible, como `/var/lib/openclaw/plugin-runtime-deps`; también puede ser una lista de rutas, como `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`, donde las raíces anteriores son capas de búsqueda de solo lectura y la raíz final es el destino de reparación.
- Doctor repara configuración obsoleta de plugins eliminando ids de plugins faltantes de `plugins.allow`/`plugins.entries`, además de la configuración de canal colgante coincidente, destinos de Heartbeat y anulaciones de modelo de canal cuando el descubrimiento de plugins está sano.
- Doctor pone en cuarentena configuración inválida de plugins deshabilitando la entrada `plugins.entries.<id>` afectada y eliminando su carga `config` inválida. El arranque del Gateway ya omite solo ese plugin defectuoso para que otros plugins y canales puedan seguir ejecutándose.
- Establece `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor posee el ciclo de vida del Gateway. Doctor sigue informando el estado del Gateway/servicio y aplica reparaciones que no son de servicio, pero omite instalación/inicio/reinicio/bootstrap del servicio y limpieza de servicios heredados.
- En Linux, doctor ignora unidades systemd adicionales inactivas similares al Gateway y no reescribe metadatos de comando/punto de entrada para un servicio de Gateway systemd en ejecución durante la reparación. Detén primero el servicio o usa `openclaw gateway install --force` cuando quieras reemplazar intencionadamente el lanzador activo.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y similares) a `talk.provider` + `talk.providers.<provider>`.
- Las ejecuciones repetidas de `doctor --fix` ya no informan/aplican normalización de Talk cuando la única diferencia es el orden de las claves del objeto.
- Doctor incluye una comprobación de preparación de búsqueda en memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embeddings.
- Doctor advierte cuando no hay ningún propietario de comandos configurado. El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas. El emparejamiento por DM solo permite que alguien hable con el bot; si aprobaste un remitente antes de que existiera el bootstrap del primer propietario, establece `commands.ownerAllowFrom` explícitamente.
- Si el modo sandbox está habilitado pero Docker no está disponible, doctor informa una advertencia de alta señal con remediación (`install Docker` u `openclaw config set agents.defaults.sandbox.mode off`).
- Si `gateway.auth.token`/`gateway.auth.password` están gestionados por SecretRef y no están disponibles en la ruta de comando actual, doctor informa una advertencia de solo lectura y no escribe credenciales alternativas en texto plano.
- Si la inspección de SecretRef de canal falla en una ruta de corrección, doctor continúa e informa una advertencia en lugar de salir antes de tiempo.
- La resolución automática de nombres de usuario `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta de comando actual. Si la inspección del token no está disponible, doctor informa una advertencia y omite la resolución automática para esa pasada.

## macOS: anulaciones de entorno de `launchctl`

Si ejecutaste anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor anula tu archivo de configuración y puede causar errores persistentes de “no autorizado”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Gateway doctor](/es/gateway/doctor)
