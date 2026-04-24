---
read_when:
    - Aún usas `openclaw daemon ...` en scripts
    - Necesitas comandos del ciclo de vida del servicio (install/start/stop/restart/status)
summary: Referencia de CLI para `openclaw daemon` (alias heredado para la gestión del servicio Gateway)
title: Daemon
x-i18n:
    generated_at: "2026-04-24T05:22:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: b492768b46c459b69cd3127c375e0c573db56c76572fdbf7b2b8eecb3e9835ce
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Alias heredado para los comandos de gestión del servicio Gateway.

`openclaw daemon ...` se asigna a la misma superficie de control del servicio que los comandos de servicio `openclaw gateway ...`.

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

- `status`: muestra el estado de instalación del servicio y sondea el estado de Gateway
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

- `status` resuelve los SecretRefs de autenticación configurados para la autenticación de sondeo cuando es posible.
- Si un SecretRef de autenticación requerido no se resuelve en esta ruta de comando, `daemon status --json` informa `rpc.authWarning` cuando falla la conectividad/autenticación del sondeo; pasa `--token`/`--password` explícitamente o resuelve primero el origen del secreto.
- Si el sondeo se realiza correctamente, las advertencias de referencias de autenticación no resueltas se suprimen para evitar falsos positivos.
- `status --deep` añade un escaneo del servicio a nivel de sistema con el mejor esfuerzo posible. Cuando encuentra otros servicios similares a gateway, la salida legible imprime sugerencias de limpieza y advierte que un gateway por máquina sigue siendo la recomendación normal.
- En instalaciones Linux systemd, las comprobaciones de deriva de token de `status` incluyen tanto las fuentes `Environment=` como `EnvironmentFile=` de la unidad.
- Las comprobaciones de deriva resuelven los SecretRefs de `gateway.auth.token` usando el entorno de ejecución combinado (primero el entorno del comando de servicio y después el respaldo del entorno del proceso).
- Si la autenticación por token no está efectivamente activa (modo explícito `gateway.auth.mode` de `password`/`none`/`trusted-proxy`, o modo no configurado donde la contraseña puede prevalecer y ningún candidato de token puede prevalecer), las comprobaciones de deriva de token omiten la resolución del token de configuración.
- Cuando la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, `install` valida que el SecretRef pueda resolverse, pero no conserva el token resuelto en los metadatos del entorno del servicio.
- Si la autenticación por token requiere un token y el SecretRef del token configurado no se resuelve, la instalación falla en modo cerrado.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está configurado, la instalación se bloquea hasta que el modo se configure explícitamente.
- Si intencionalmente ejecutas varios gateways en un mismo host, aísla puertos, configuración/estado y espacios de trabajo; consulta [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).

## Preferir

Usa [`openclaw gateway`](/es/cli/gateway) para la documentación y los ejemplos actuales.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Guía operativa de Gateway](/es/gateway)
