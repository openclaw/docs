---
read_when:
    - Todavía usas `openclaw daemon ...` en scripts
    - Necesita comandos del ciclo de vida del servicio (install/start/stop/restart/status)
summary: Referencia de CLI para `openclaw daemon` (alias heredado para la gestión del servicio Gateway)
title: Demonio
x-i18n:
    generated_at: "2026-05-11T20:26:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0131c3838ac0240f38e755eb779134d19a935821d90bb2898648b947696be12e
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias heredado para comandos de administración del servicio Gateway.

`openclaw daemon ...` se asigna a la misma superficie de control de servicio que los comandos de servicio `openclaw gateway ...`.

## Uso

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Subcomandos

- `status`: muestra el estado de instalación del servicio y sondea el estado del Gateway
- `install`: instala el servicio (`launchd`/`systemd`/`schtasks`)
- `uninstall`: elimina el servicio
- `start`: inicia el servicio
- `stop`: detiene el servicio
- `restart`: reinicia el servicio

## Opciones comunes

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- ciclo de vida (`uninstall|start|stop`): `--json`

Notas:

- `status` resuelve los SecretRefs de autenticación configurados para la autenticación del sondeo cuando es posible.
- Si un SecretRef de autenticación requerido no se resuelve en esta ruta de comando, `daemon status --json` informa `rpc.authWarning` cuando falla la conectividad/autenticación del sondeo; pasa `--token`/`--password` explícitamente o resuelve primero el origen del secreto.
- Si el sondeo se realiza correctamente, las advertencias de referencias de autenticación sin resolver se suprimen para evitar falsos positivos.
- `status --deep` añade un escaneo de servicio a nivel del sistema de mejor esfuerzo. Cuando encuentra otros servicios similares a Gateway, la salida legible para humanos imprime sugerencias de limpieza y advierte que un Gateway por máquina sigue siendo la recomendación normal.
- `status --deep` también ejecuta la validación de configuración en modo consciente de Plugin y muestra advertencias de manifiesto de Plugin configuradas (por ejemplo, metadatos de configuración de canal faltantes) para que las comprobaciones rápidas de instalación y actualización las detecten. El `status` predeterminado mantiene la ruta rápida de solo lectura que omite la validación de Plugin.
- En instalaciones de systemd en Linux, las comprobaciones de desviación de token de `status` incluyen tanto las fuentes de unidad `Environment=` como `EnvironmentFile=`.
- Las comprobaciones de desviación resuelven los SecretRefs de `gateway.auth.token` usando el entorno de ejecución combinado (primero el entorno del comando de servicio y luego el entorno del proceso como alternativa).
- Si la autenticación por token no está efectivamente activa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, o modo sin definir donde la contraseña puede prevalecer y ningún candidato de token puede prevalecer), las comprobaciones de desviación de token omiten la resolución del token de configuración.
- Cuando la autenticación por token requiere un token y `gateway.auth.token` está administrado mediante SecretRef, `install` valida que el SecretRef pueda resolverse, pero no persiste el token resuelto en los metadatos del entorno del servicio.
- Si la autenticación por token requiere un token y el SecretRef de token configurado no se resuelve, la instalación falla de forma cerrada.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se establezca explícitamente.
- En macOS, `install` mantiene los plists de LaunchAgent solo para el propietario y carga los valores del entorno del servicio administrado mediante un archivo y un wrapper solo para el propietario, en lugar de serializar claves API o referencias de entorno de perfiles de autenticación en `EnvironmentVariables`.
- Si ejecutas intencionalmente varios gateways en un mismo host, aísla puertos, configuración/estado y espacios de trabajo; consulta [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).
- `restart --safe` solicita al Gateway en ejecución que verifique previamente el trabajo activo y programe un único reinicio combinado después de que el trabajo activo se vacíe. `restart` sin opciones conserva el comportamiento existente del administrador de servicios; `--force` sigue siendo la ruta de anulación inmediata.
- `restart --safe --skip-deferral` ejecuta el reinicio seguro consciente de OpenClaw, pero omite la puerta de aplazamiento por trabajo activo para que el Gateway emita el reinicio inmediatamente incluso cuando se informen bloqueadores. Es una vía de escape para el operador cuando una ejecución de tarea atascada fija el reinicio seguro; requiere `--safe`.

## Preferir

Usa [`openclaw gateway`](/es/cli/gateway) para la documentación y los ejemplos actuales.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Runbook de Gateway](/es/gateway)
