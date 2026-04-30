---
read_when:
    - Todavía usas `openclaw daemon ...` en secuencias de comandos
    - Necesitas comandos del ciclo de vida del servicio (install/start/stop/restart/status)
summary: Referencia de CLI para `openclaw daemon` (alias heredado para la gestión del servicio Gateway)
title: Demonio
x-i18n:
    generated_at: "2026-04-30T05:33:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias heredado para los comandos de administración del servicio Gateway.

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

- `status`: muestra el estado de instalación del servicio y comprueba el estado de Gateway
- `install`: instala el servicio (`launchd`/`systemd`/`schtasks`)
- `uninstall`: elimina el servicio
- `start`: inicia el servicio
- `stop`: detiene el servicio
- `restart`: reinicia el servicio

## Opciones comunes

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- ciclo de vida (`uninstall|start|stop|restart`): `--json`

Notas:

- `status` resuelve los SecretRefs de autenticación configurados para la autenticación de la comprobación cuando es posible.
- Si un SecretRef de autenticación requerido no se resuelve en esta ruta de comando, `daemon status --json` informa `rpc.authWarning` cuando falla la conectividad/autenticación de la comprobación; pasa `--token`/`--password` explícitamente o resuelve primero el origen del secreto.
- Si la comprobación se realiza correctamente, las advertencias de referencias de autenticación no resueltas se suprimen para evitar falsos positivos.
- `status --deep` añade un escaneo de servicio a nivel del sistema de mejor esfuerzo. Cuando encuentra otros servicios similares a Gateway, la salida legible imprime sugerencias de limpieza y advierte que un Gateway por máquina sigue siendo la recomendación normal.
- En instalaciones de Linux con systemd, las comprobaciones de desvío de token de `status` incluyen fuentes de unidad tanto `Environment=` como `EnvironmentFile=`.
- Las comprobaciones de desvío resuelven los SecretRefs de `gateway.auth.token` usando el entorno de ejecución combinado (primero el entorno del comando de servicio y luego el entorno del proceso como reserva).
- Si la autenticación por token no está activa de forma efectiva (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, o modo no definido donde la contraseña puede ganar y ningún candidato de token puede ganar), las comprobaciones de desvío de token omiten la resolución del token de configuración.
- Cuando la autenticación por token requiere un token y `gateway.auth.token` está administrado por SecretRef, `install` valida que el SecretRef se pueda resolver, pero no conserva el token resuelto en los metadatos del entorno de servicio.
- Si la autenticación por token requiere un token y el SecretRef de token configurado no se resuelve, la instalación falla de forma cerrada.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se establezca explícitamente.
- En macOS, `install` mantiene los plists de LaunchAgent solo para el propietario y carga los valores del entorno del servicio administrado mediante un archivo y un wrapper solo para el propietario, en lugar de serializar claves de API o referencias de entorno de perfiles de autenticación en `EnvironmentVariables`.
- Si ejecutas intencionalmente varios Gateways en un mismo host, aísla puertos, configuración/estado y espacios de trabajo; consulta [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).

## Preferir

Usa [`openclaw gateway`](/es/cli/gateway) para la documentación y los ejemplos actuales.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Guía operativa de Gateway](/es/gateway)
