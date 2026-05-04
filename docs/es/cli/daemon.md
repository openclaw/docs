---
read_when:
    - Aún usas `openclaw daemon ...` en los scripts
    - Necesitas comandos del ciclo de vida del servicio (install/start/stop/restart/status)
summary: Referencia de CLI para `openclaw daemon` (alias heredado para la administración del servicio Gateway)
title: Demonio
x-i18n:
    generated_at: "2026-05-04T18:23:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84e11fc50bdf38da518a8fcf415ae461a2688c2299f996eee384357c0d04a05
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias heredado para los comandos de gestión del servicio Gateway.

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
- `restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
- ciclo de vida (`uninstall|start|stop`): `--json`

Notas:

- `status` resuelve los SecretRefs de autenticación configurados para la autenticación de sondeo cuando es posible.
- Si un SecretRef de autenticación requerido no se resuelve en esta ruta de comando, `daemon status --json` informa `rpc.authWarning` cuando falla la conectividad/autenticación del sondeo; pasa `--token`/`--password` explícitamente o resuelve primero el origen del secreto.
- Si el sondeo se realiza correctamente, las advertencias de referencia de autenticación no resuelta se suprimen para evitar falsos positivos.
- `status --deep` añade un análisis de servicio a nivel de sistema de mejor esfuerzo. Cuando encuentra otros servicios similares a Gateway, la salida para humanos imprime sugerencias de limpieza y advierte que la recomendación normal sigue siendo un Gateway por máquina.
- En instalaciones systemd de Linux, las comprobaciones de deriva de token de `status` incluyen tanto fuentes de unidad `Environment=` como `EnvironmentFile=`.
- Las comprobaciones de deriva resuelven los SecretRefs de `gateway.auth.token` usando el entorno de ejecución combinado (primero el entorno del comando de servicio y luego el entorno del proceso como alternativa).
- Si la autenticación con token no está activa de forma efectiva (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, o modo no definido donde la contraseña puede ganar y ningún candidato de token puede ganar), las comprobaciones de deriva de token omiten la resolución del token de configuración.
- Cuando la autenticación con token requiere un token y `gateway.auth.token` está gestionado por SecretRef, `install` valida que el SecretRef se pueda resolver, pero no persiste el token resuelto en los metadatos del entorno del servicio.
- Si la autenticación con token requiere un token y el SecretRef del token configurado no está resuelto, la instalación falla de forma cerrada.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se defina explícitamente.
- En macOS, `install` mantiene los plists de LaunchAgent solo para el propietario y carga los valores del entorno del servicio gestionado mediante un archivo y un contenedor solo para el propietario, en lugar de serializar claves de API o referencias de entorno de perfiles de autenticación en `EnvironmentVariables`.
- Si ejecutas intencionadamente varios Gateways en un host, aísla puertos, configuración/estado y espacios de trabajo; consulta [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).
- `restart --safe` pide al Gateway en ejecución que haga una comprobación previa del trabajo activo y programe un único reinicio combinado después de que el trabajo activo se vacíe. `restart` simple mantiene el comportamiento existente del gestor de servicios; `--force` sigue siendo la ruta de anulación inmediata.

## Preferir

Usa [`openclaw gateway`](/es/cli/gateway) para la documentación y los ejemplos actuales.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Manual de operaciones de Gateway](/es/gateway)
