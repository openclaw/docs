---
read_when:
    - Todavía usas `openclaw daemon ...` en scripts
    - Necesita comandos de ciclo de vida del servicio (install/start/stop/restart/status)
summary: Referencia de la CLI para `openclaw daemon` (alias heredado para la administración del servicio Gateway)
title: Demonio
x-i18n:
    generated_at: "2026-07-05T11:09:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias heredado para la administración del servicio Gateway. `openclaw daemon ...` se asigna a los mismos comandos de control de servicio que `openclaw gateway ...`. Prefiere [`openclaw gateway`](/es/cli/gateway) para la documentación y los ejemplos actuales.

## Uso

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Subcomandos y opciones

| Subcomando  | Opciones                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`            |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable` (solo launchd: suprime de forma persistente KeepAlive/RunAtLoad hasta el próximo inicio) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: muestra el estado de instalación del servicio (launchd/systemd/schtasks) y sondea la salud de Gateway.
- `install`: instala el servicio; `--force` reinstala/sobrescribe una instalación existente.
- `restart --safe`: pide al Gateway en ejecución que haga una comprobación previa del trabajo activo y programe un único reinicio combinado después de que el trabajo se vacíe, limitado por `gateway.reload.deferralTimeoutMs` (valor predeterminado 300000ms/5 minutos; configúralo en `0` para esperar indefinidamente). Cuando ese presupuesto expira, el reinicio se fuerza de todos modos. `restart` sin más usa directamente el administrador de servicios; `--force` es la anulación inmediata.
- `restart --safe --skip-deferral`: omite la puerta de aplazamiento por trabajo activo, de modo que Gateway se reinicia de inmediato aunque se informen bloqueadores. Requiere `--safe`.

## Notas

- `status` resuelve los SecretRefs de autenticación configurados para la autenticación del sondeo cuando es posible. Si un SecretRef requerido no está resuelto, `status --json` informa `rpc.authWarning`; pasa `--token`/`--password` explícitamente o resuelve primero el origen del secreto. Las advertencias de autenticación no resuelta se suprimen una vez que el sondeo se realiza correctamente por lo demás.
- `status --deep` agrega un escaneo de sistema de mejor esfuerzo para otros servicios similares a Gateway (imprime sugerencias de limpieza; se sigue recomendando un Gateway por máquina) y ejecuta la validación de configuración en modo consciente de plugins, mostrando advertencias de manifiestos de plugins que la ruta predeterminada rápida omite.
- En instalaciones systemd de Linux, las comprobaciones de desviación del token inspeccionan tanto las fuentes de unidad `Environment=` como `EnvironmentFile=`.
- Las comprobaciones de desviación del token resuelven los SecretRefs de `gateway.auth.token` usando el entorno de runtime combinado (primero el entorno del comando de servicio y luego el entorno del proceso). Si la autenticación por token no está efectivamente activa (`gateway.auth.mode` de `password`/`none`/`trusted-proxy`, o sin definir con la contraseña pudiendo prevalecer), se omite la resolución del token de configuración.
- `install` valida que un `gateway.auth.token` administrado por SecretRef se pueda resolver, pero nunca persiste el valor resuelto en los metadatos del entorno de servicio; si no puede resolverlo, la instalación falla de forma cerrada.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, `install` bloquea hasta que establezcas el modo explícitamente.
- En macOS, `install` mantiene los plists de LaunchAgent y el archivo de entorno/wrapper generado solo para el propietario (modo `0600`/`0700`) en lugar de incrustar secretos en `EnvironmentVariables`.
- Ejecutar varios Gateways en un host: aísla puertos, configuración/estado y espacios de trabajo. Consulta [Varios gateways](/es/gateway#multiple-gateways-same-host).

## Relacionado

- [Referencia de CLI](/es/cli)
- [Runbook de Gateway](/es/gateway)
