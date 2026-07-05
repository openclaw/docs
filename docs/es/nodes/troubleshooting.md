---
read_when:
    - Node está conectado, pero las herramientas de cámara/canvas/pantalla/exec fallan
    - Necesitas el modelo mental de emparejamiento de nodos frente a aprobaciones
summary: Soluciona problemas de emparejamiento de nodos, requisitos de primer plano, permisos y errores de herramientas
title: Solución de problemas de Node
x-i18n:
    generated_at: "2026-07-05T11:30:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f7b98658f1090e48d4a6f4b02788f570458fa5e1d76daa1c4a43e26ffc099e9
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Usa esta página cuando un nodo sea visible en el estado pero las herramientas del nodo fallen.

## Escalera de comandos

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Luego ejecuta comprobaciones específicas del nodo:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Señales de buen estado:

- El Node está conectado y emparejado para el rol `node`.
- `nodes describe` incluye la capacidad que estás llamando.
- Las aprobaciones de ejecución muestran el modo/la lista de permitidos esperados.

## Requisitos de primer plano

`canvas.*`, `camera.*` y `screen.*` solo funcionan en primer plano en nodos iOS/Android.

Comprobación y solución rápidas:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Si ves `NODE_BACKGROUND_UNAVAILABLE`, lleva la aplicación del nodo al primer plano y vuelve a intentarlo.

## Matriz de permisos

| Capacidad                    | iOS                                               | Android                                             | Aplicación de nodo de macOS       | Código de fallo típico         |
| ---------------------------- | ------------------------------------------------- | --------------------------------------------------- | --------------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Cámara (+ micrófono para audio del clip)          | Cámara (+ micrófono para audio del clip)            | Cámara (+ micrófono para audio del clip) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Grabación de pantalla (+ micrófono opcional)      | Solicitud de captura de pantalla (+ micrófono opcional) | Grabación de pantalla             | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Al usarse o siempre (depende del modo)            | Ubicación en primer plano/segundo plano según el modo | Permiso de ubicación              | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/d (ruta del host del nodo)                      | n/d (ruta del host del nodo)                        | Aprobaciones de ejecución requeridas | `SYSTEM_RUN_DENIED`            |

## Emparejamiento frente a aprobaciones

Tres controles separados determinan si un comando de nodo tiene éxito:

1. **Emparejamiento del dispositivo**: ¿puede este nodo conectarse al Gateway?
2. **Política de comandos de nodo del Gateway**: ¿está permitido el ID de comando RPC por `gateway.nodes.allowCommands` / `denyCommands` y los valores predeterminados de la plataforma?
3. **Aprobaciones de ejecución**: ¿puede este nodo ejecutar un comando de shell específico localmente?

El emparejamiento de nodos es un control de identidad/confianza, no una superficie de aprobación por comando. Para `system.run`, la política por nodo reside en el archivo de aprobaciones de ejecución de ese nodo (`openclaw approvals get --node ...`), no en el registro de emparejamiento del Gateway.

Comprobaciones rápidas:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- Falta el emparejamiento: aprueba primero el dispositivo del nodo.
- A `nodes describe` le falta un comando: comprueba la política de comandos de nodo del Gateway y si el nodo declaró realmente ese comando al conectarse.
- El emparejamiento está bien pero `system.run` falla: corrige las aprobaciones de ejecución/lista de permitidos en ese nodo.

Para ejecuciones `host=node` respaldadas por aprobaciones, el Gateway también vincula la ejecución al `systemRunPlan` canónico preparado. Si un llamador posterior muta el comando, el cwd o los metadatos de sesión antes de que se reenvíe la ejecución aprobada, el Gateway rechaza la ejecución como una discrepancia de aprobación en lugar de confiar en la carga editada.

## Códigos comunes de error de nodo

| Código                                 | Significado                                                                                                                                                                                  |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | La aplicación está en segundo plano; tráela al primer plano.                                                                                                                                 |
| `CAMERA_DISABLED`                      | Interruptor de cámara desactivado en la configuración del nodo.                                                                                                                              |
| `*_PERMISSION_REQUIRED`                | Permiso del sistema operativo faltante/denegado.                                                                                                                                             |
| `LOCATION_DISABLED`                    | El modo de ubicación está desactivado.                                                                                                                                                       |
| `LOCATION_PERMISSION_REQUIRED`         | No se concedió el modo de ubicación solicitado.                                                                                                                                              |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | La aplicación está en segundo plano, pero solo existe el permiso Al usarse.                                                                                                                   |
| `SYSTEM_RUN_DENIED: approval required` | La solicitud de ejecución necesita aprobación explícita.                                                                                                                                      |
| `SYSTEM_RUN_DENIED: allowlist miss`    | Comando bloqueado por el modo de lista de permitidos. En hosts de nodo Windows, las formas de envoltorio de shell como `cmd.exe /c ...` se tratan como ausencias en la lista de permitidos en modo de lista de permitidos salvo que se aprueben mediante el flujo de solicitud. |

## Bucle rápido de recuperación

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Si sigues bloqueado:

- Vuelve a aprobar el emparejamiento del dispositivo.
- Vuelve a abrir la aplicación del nodo (primer plano).
- Vuelve a conceder los permisos del sistema operativo.
- Recrea/ajusta la política de aprobación de ejecución.

## Relacionado

- [Resumen de nodos](/es/nodes)
- [Nodos de cámara](/es/nodes/camera)
- [Comando de ubicación](/es/nodes/location-command)
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
- [Emparejamiento del Gateway](/es/gateway/pairing)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
- [Solución de problemas de canales](/es/channels/troubleshooting)
