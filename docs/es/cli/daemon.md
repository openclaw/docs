---
read_when:
    - Todavía usa `openclaw daemon ...` en los scripts
    - Necesitas comandos para gestionar el ciclo de vida del servicio (instalar/iniciar/detener/reiniciar/consultar el estado)
summary: Referencia de la CLI para `openclaw daemon` (alias heredado para la gestión del servicio Gateway)
title: Demonio
x-i18n:
    generated_at: "2026-07-11T22:59:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias heredado para la gestión del servicio Gateway. `openclaw daemon ...` corresponde a los mismos comandos de control del servicio que `openclaw gateway ...`. Se recomienda usar [`openclaw gateway`](/es/cli/gateway) en la documentación y los ejemplos actuales.

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

| Subcomando  | Opciones                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`  |
| `install`   | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`             |
| `uninstall` | `--json`                                                                                          |
| `start`     | `--json`                                                                                          |
| `stop`      | `--json`, `--disable` (solo launchd: desactiva de forma persistente KeepAlive/RunAtLoad hasta el próximo inicio) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                             |

- `status`: muestra el estado de instalación del servicio (launchd/systemd/schtasks) y comprueba el estado del Gateway.
- `install`: instala el servicio; `--force` reinstala o sobrescribe una instalación existente.
- `restart --safe`: solicita al Gateway en ejecución que compruebe previamente el trabajo activo y programe un único reinicio consolidado una vez que este finalice, limitado por `gateway.reload.deferralTimeoutMs` (valor predeterminado: 300000 ms/5 minutos; establézcalo en `0` para esperar indefinidamente). Cuando se agota ese plazo, el reinicio se fuerza de todos modos. `restart` sin opciones utiliza directamente el gestor de servicios; `--force` permite forzar el reinicio inmediato.
- `restart --safe --skip-deferral`: omite el mecanismo de aplazamiento por trabajo activo para que el Gateway se reinicie inmediatamente aunque se notifiquen bloqueos. Requiere `--safe`.

## Notas

- `status` resuelve, cuando es posible, los SecretRefs de autenticación configurados para autenticar la comprobación. Si no se puede resolver un SecretRef obligatorio, `status --json` informa de `rpc.authWarning`; proporcione `--token`/`--password` explícitamente o resuelva primero el origen del secreto. Las advertencias de autenticación no resuelta se omiten cuando la comprobación tiene éxito por lo demás.
- `status --deep` añade un análisis del sistema completo, realizado con el máximo esfuerzo, para detectar otros servicios similares a un gateway (muestra sugerencias de limpieza; aun así, se recomienda un solo Gateway por equipo) y ejecuta la validación de la configuración teniendo en cuenta los plugins, lo que permite mostrar advertencias de los manifiestos de plugins que la ruta rápida predeterminada omite.
- En instalaciones de systemd en Linux, las comprobaciones de divergencia del token inspeccionan tanto los orígenes `Environment=` como `EnvironmentFile=` de la unidad.
- Las comprobaciones de divergencia del token resuelven los SecretRefs de `gateway.auth.token` mediante el entorno combinado de ejecución (primero el entorno del comando del servicio y después el entorno del proceso). Si la autenticación mediante token no está activa de forma efectiva (`gateway.auth.mode` establecido en `password`/`none`/`trusted-proxy`, o sin establecer cuando puede prevalecer la contraseña), se omite la resolución del token de configuración.
- `install` valida que un `gateway.auth.token` gestionado mediante SecretRef pueda resolverse, pero nunca conserva el valor resuelto en los metadatos del entorno del servicio; si no puede resolverlo, la instalación se interrumpe de forma segura.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, `install` se bloquea hasta que establezca explícitamente el modo.
- En macOS, `install` mantiene los archivos plist de LaunchAgent y el archivo de entorno o wrapper generado accesibles únicamente para el propietario (modo `0600`/`0700`), en lugar de insertar secretos en `EnvironmentVariables`.
- Para ejecutar varios Gateways en un mismo host, aísle los puertos, la configuración y el estado, así como los espacios de trabajo. Consulte [Varios gateways](/es/gateway#multiple-gateways-same-host).

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Guía operativa del Gateway](/es/gateway)
