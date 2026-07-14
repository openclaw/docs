---
read_when:
    - Aún se usa `openclaw daemon ...` en los scripts
    - Necesita comandos para gestionar el ciclo de vida del servicio (install/start/stop/restart/status)
summary: Referencia de la CLI para `openclaw daemon` (alias heredado para la gestión del servicio Gateway)
title: Demonio
x-i18n:
    generated_at: "2026-07-14T13:31:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: a5e08114a8a0de959b54fcb0fcef88b880424fd89c133f7c383f254d18f0d71d
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias heredado para la gestión del servicio Gateway. `openclaw daemon ...` se asigna a los mismos comandos de control del servicio que `openclaw gateway ...`. Para consultar la documentación y los ejemplos actuales, se recomienda [`openclaw gateway`](/es/cli/gateway).

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
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node>`, `--token`, `--wrapper <path>`, `--force`, `--json`                 |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable` (solo launchd: suprime de forma persistente KeepAlive/RunAtLoad hasta el siguiente inicio) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: muestra el estado de instalación del servicio (launchd/systemd/schtasks) y sondea el estado del Gateway.
- `install`: instala el servicio; `--force` reinstala o sobrescribe una instalación existente.
- `restart --safe`: solicita al Gateway en ejecución que compruebe previamente el trabajo activo y programe un único reinicio combinado una vez que finalice el trabajo, limitado por `gateway.reload.deferralTimeoutMs` (valor predeterminado: 300000ms/5 minutos; se establece en `0` para esperar indefinidamente). Cuando se agota ese plazo, el reinicio se fuerza de todos modos. `restart` sin modificadores usa directamente el gestor de servicios; `--force` es la anulación inmediata.
- `restart --safe --skip-deferral`: omite la condición de aplazamiento por trabajo activo para que el Gateway se reinicie inmediatamente, incluso cuando se notifican bloqueos. Requiere `--safe`.

## Notas

- `status` resuelve las SecretRefs de autenticación configuradas para la autenticación del sondeo cuando es posible. Si una SecretRef requerida no está resuelta, `status --json` informa de `rpc.authWarning`; se deben proporcionar explícitamente `--token`/`--password` o resolver primero el origen del secreto. Las advertencias de autenticación sin resolver se suprimen una vez que el sondeo tiene éxito por lo demás.
- `status --deep` añade un análisis a nivel del sistema, en la medida de lo posible, para detectar otros servicios similares a Gateway (muestra sugerencias de limpieza; se sigue recomendando un Gateway por máquina) y ejecuta la validación de la configuración en un modo que tiene en cuenta los plugins, mostrando advertencias de los manifiestos de los plugins que omite la ruta rápida predeterminada.
- En instalaciones de systemd en Linux, las comprobaciones de divergencia del token inspeccionan las fuentes de unidad `Environment=` y `EnvironmentFile=`.
- Las comprobaciones de divergencia del token resuelven las SecretRefs de `gateway.auth.token` mediante el entorno de ejecución combinado (primero el entorno del comando del servicio y después el entorno del proceso). Si la autenticación mediante token no está activa de forma efectiva (`gateway.auth.mode` de `password`/`none`/`trusted-proxy`, o sin establecer cuando puede prevalecer la contraseña), se omite la resolución del token de configuración.
- `install` valida que un `gateway.auth.token` gestionado mediante SecretRef se pueda resolver, pero nunca conserva el valor resuelto en los metadatos del entorno del servicio; si no puede resolverlo, la instalación falla de forma segura.
- Si están configurados tanto `gateway.auth.token` como `gateway.auth.password` y `gateway.auth.mode` no está establecido, `install` se bloquea hasta que se establezca explícitamente el modo.
- En macOS, `install` mantiene los archivos plist de LaunchAgent y el archivo de entorno o contenedor generado accesibles únicamente para el propietario (modo `0600`/`0700`), en lugar de incrustar secretos en `EnvironmentVariables`.
- Para ejecutar varios Gateways en un mismo host: se deben aislar los puertos, la configuración y el estado, y los espacios de trabajo. Consulte [Varios gateways](/es/gateway#multiple-gateways-same-host).

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Guía operativa del Gateway](/es/gateway)
