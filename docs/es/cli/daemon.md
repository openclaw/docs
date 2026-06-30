---
read_when:
    - Aún usas `openclaw daemon ...` en scripts
    - Necesita comandos del ciclo de vida del servicio (install/start/stop/restart/status)
summary: Referencia de la CLI para `openclaw daemon` (alias heredado para la gestión del servicio Gateway)
title: Demonio
x-i18n:
    generated_at: "2026-06-30T13:47:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
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

- `status`: mostrar el estado de instalación del servicio y comprobar la salud del Gateway
- `install`: instalar el servicio (`launchd`/`systemd`/`schtasks`)
- `uninstall`: eliminar el servicio
- `start`: iniciar el servicio
- `stop`: detener el servicio
- `restart`: reiniciar el servicio

## Opciones comunes

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- ciclo de vida (`uninstall|start|stop`): `--json`

Notas:

- `status` resuelve las SecretRefs de autenticación configuradas para la autenticación de la comprobación cuando es posible.
- Si una SecretRef de autenticación requerida no se puede resolver en esta ruta de comando, `daemon status --json` informa `rpc.authWarning` cuando falla la conectividad/autenticación de la comprobación; pasa `--token`/`--password` explícitamente o resuelve primero el origen del secreto.
- Si la comprobación se realiza correctamente, las advertencias de referencias de autenticación no resueltas se suprimen para evitar falsos positivos.
- `status --deep` añade un escaneo de servicio a nivel de sistema de mejor esfuerzo. Cuando encuentra otros servicios similares a gateway, la salida para humanos imprime sugerencias de limpieza y advierte que un gateway por máquina sigue siendo la recomendación normal.
- `status --deep` también ejecuta la validación de configuración en modo compatible con plugins y muestra advertencias configuradas del manifiesto de plugins (por ejemplo, metadatos de configuración de canal ausentes) para que las comprobaciones rápidas de instalación y actualización las detecten. El `status` predeterminado mantiene la ruta rápida de solo lectura que omite la validación de plugins.
- En instalaciones systemd de Linux, las comprobaciones de desviación de token de `status` incluyen fuentes de unidad tanto `Environment=` como `EnvironmentFile=`.
- Las comprobaciones de desviación resuelven SecretRefs de `gateway.auth.token` usando el entorno de runtime fusionado (primero el entorno del comando de servicio y luego el entorno del proceso como respaldo).
- Si la autenticación por token no está efectivamente activa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, o modo sin definir cuando la contraseña puede prevalecer y ningún candidato de token puede prevalecer), las comprobaciones de desviación de token omiten la resolución del token de configuración.
- Cuando la autenticación por token requiere un token y `gateway.auth.token` está administrado por SecretRef, `install` valida que la SecretRef se pueda resolver, pero no persiste el token resuelto en los metadatos del entorno del servicio.
- Si la autenticación por token requiere un token y la SecretRef del token configurada no se puede resolver, la instalación falla en modo cerrado.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se defina explícitamente.
- En macOS, `install` mantiene los plists de LaunchAgent solo para el propietario y carga los valores administrados del entorno del servicio mediante un archivo y un wrapper solo para el propietario, en lugar de serializar claves de API o referencias env de perfil de autenticación en `EnvironmentVariables`.
- Si ejecutas intencionalmente varios gateways en un mismo host, aísla puertos, configuración/estado y espacios de trabajo; consulta [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).
- `restart --safe` pide al Gateway en ejecución que haga una comprobación previa del trabajo activo y programe un reinicio fusionado después de que el trabajo activo se drene. El reinicio seguro predeterminado espera el trabajo activo hasta el `gateway.reload.deferralTimeoutMs` configurado (valor predeterminado: 5 minutos); cuando ese presupuesto expira, el reinicio se fuerza. Define `gateway.reload.deferralTimeoutMs` en `0` para una espera segura indefinida que nunca fuerza. `restart` simple conserva el comportamiento existente del administrador de servicios; `--force` sigue siendo la ruta de anulación inmediata.
- `restart --safe --skip-deferral` ejecuta el reinicio seguro compatible con OpenClaw, pero omite la puerta de aplazamiento de trabajo activo para que el Gateway emita el reinicio inmediatamente incluso cuando se informen bloqueadores. Vía de escape del operador cuando una ejecución de tarea atascada bloquea el reinicio seguro; requiere `--safe`.

## Preferir

Usa [`openclaw gateway`](/es/cli/gateway) para la documentación y los ejemplos actuales.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Runbook del Gateway](/es/gateway)
