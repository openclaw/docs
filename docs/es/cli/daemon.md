---
read_when:
    - Todavía se usa `openclaw daemon ...` en los scripts
    - Necesita comandos del ciclo de vida del servicio (instalar/iniciar/detener/reiniciar/consultar el estado)
summary: Referencia de la CLI para `openclaw daemon` (alias heredado para la gestión del servicio Gateway)
title: Demonio
x-i18n:
    generated_at: "2026-07-20T00:45:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 629852ebf3efe86dedc4c84f6ddc9349b25ddde832df5d78521641fe4b137658
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

- `status`: muestra el estado de instalación del servicio (launchd/systemd/schtasks) y comprueba el estado del Gateway.
- `install`: instala el servicio; `--force` vuelve a instalar o sobrescribe una instalación existente.
- `restart --safe`: solicita al Gateway en ejecución que realice una comprobación previa del trabajo activo y programe un único reinicio agrupado cuando finalice el trabajo, con un límite de 5 minutos. Cuando se agota ese plazo, el reinicio se fuerza de todos modos. `restart` sin opciones usa directamente el gestor de servicios; `--force` es la anulación inmediata.
- `restart --safe --skip-deferral`: omite la barrera de aplazamiento por trabajo activo para que el Gateway se reinicie inmediatamente, incluso cuando se notifican bloqueos. Requiere `--safe`.

## Notas

- `status` resuelve las SecretRefs de autenticación configuradas para autenticar la comprobación cuando es posible. Si una SecretRef obligatoria no se resuelve, `status --json` notifica `rpc.authWarning`; proporcione explícitamente `--token`/`--password` o resuelva primero el origen del secreto. Las advertencias de autenticación sin resolver se suprimen cuando la comprobación tiene éxito por lo demás.
- `status --deep` añade un análisis del sistema, realizado con el mejor esfuerzo posible, para detectar otros servicios similares a Gateway (muestra sugerencias de limpieza; se sigue recomendando un Gateway por máquina) y ejecuta la validación de la configuración en un modo compatible con plugins, mostrando advertencias del manifiesto del plugin que omite la ruta rápida predeterminada.
- En instalaciones de systemd en Linux, las comprobaciones de divergencia de tokens inspeccionan los orígenes de unidades `Environment=` y `EnvironmentFile=`.
- Las comprobaciones de divergencia de tokens resuelven las SecretRefs de `gateway.auth.token` mediante el entorno de ejecución combinado (primero el entorno del comando del servicio y después el entorno del proceso). Si la autenticación mediante token no está activa de forma efectiva (`gateway.auth.mode` de `password`/`none`/`trusted-proxy`, o sin definir cuando puede prevalecer la contraseña), se omite la resolución del token de configuración.
- `install` valida que una SecretRef que gestiona `gateway.auth.token` pueda resolverse, pero nunca conserva el valor resuelto en los metadatos del entorno del servicio; si no puede resolverla, la instalación falla de forma segura.
- Si están configurados tanto `gateway.auth.token` como `gateway.auth.password` y `gateway.auth.mode` no está definido, `install` bloquea la operación hasta que se establezca explícitamente el modo.
- En macOS, `install` mantiene los archivos plist de LaunchAgent y el archivo de entorno/wrapper generado accesibles únicamente para el propietario (modo `0600`/`0700`), en lugar de incrustar secretos en `EnvironmentVariables`.
- Para ejecutar varios Gateways en un mismo host, aísle los puertos, la configuración/el estado y los espacios de trabajo. Consulte [Varios gateways](/es/gateway#multiple-gateways-same-host).

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Guía operativa del Gateway](/es/gateway)
