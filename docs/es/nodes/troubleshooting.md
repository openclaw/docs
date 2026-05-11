---
read_when:
    - Node está conectado, pero fallan las herramientas camera/canvas/screen/exec
    - Necesitas el modelo mental de emparejamiento de Node frente a aprobaciones
summary: Soluciona problemas de emparejamiento de nodos, requisitos de primer plano, permisos y fallos de herramientas
title: Solución de problemas de Node
x-i18n:
    generated_at: "2026-05-11T20:41:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d53f06367b63125f04b4b542c322e6e50e1f33153e0fbdd09e7a38772c69a438
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Usa esta página cuando un nodo sea visible en el estado, pero las herramientas de nodo fallen.

## Escala de comandos

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

Señales saludables:

- El nodo está conectado y emparejado para el rol `node`.
- `nodes describe` incluye la capacidad que estás llamando.
- Las aprobaciones de ejecución muestran el modo/lista de permitidos esperados.

## Requisitos de primer plano

`canvas.*`, `camera.*` y `screen.*` solo funcionan en primer plano en nodos iOS/Android.

Comprobación y solución rápida:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Si ves `NODE_BACKGROUND_UNAVAILABLE`, lleva la aplicación del nodo al primer plano y vuelve a intentarlo.

## Matriz de permisos

| Capacidad                    | iOS                                              | Android                                               | Aplicación de nodo para macOS       | Código de fallo típico         |
| ---------------------------- | ------------------------------------------------ | ----------------------------------------------------- | ----------------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Cámara (+ micrófono para audio de clip)          | Cámara (+ micrófono para audio de clip)               | Cámara (+ micrófono para audio de clip) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Grabación de pantalla (+ micrófono opcional)     | Solicitud de captura de pantalla (+ micrófono opcional) | Grabación de pantalla               | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Al usarse o siempre (depende del modo)           | Ubicación en primer/segundo plano según el modo       | Permiso de ubicación                | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (ruta del host del nodo)                     | n/a (ruta del host del nodo)                          | Se requieren aprobaciones de ejecución | `SYSTEM_RUN_DENIED`            |

## Emparejamiento frente a aprobaciones

Son controles distintos:

1. **Emparejamiento de dispositivo**: ¿puede este nodo conectarse al Gateway?
2. **Política de comandos de nodo del Gateway**: ¿el ID del comando RPC está permitido por `gateway.nodes.allowCommands` / `denyCommands` y los valores predeterminados de la plataforma?
3. **Aprobaciones de ejecución**: ¿puede este nodo ejecutar localmente un comando de shell específico?

Comprobaciones rápidas:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Si falta el emparejamiento, aprueba primero el dispositivo del nodo.
Si a `nodes describe` le falta un comando, comprueba la política de comandos de nodo del Gateway y si el nodo declaró realmente ese comando al conectarse.
Si el emparejamiento está correcto pero `system.run` falla, corrige las aprobaciones de ejecución/lista de permitidos en ese nodo.

El emparejamiento de nodos es un control de identidad/confianza, no una superficie de aprobación por comando. Para `system.run`, la política por nodo vive en el archivo de aprobaciones de ejecución de ese nodo (`openclaw approvals get --node ...`), no en el registro de emparejamiento del Gateway.

Para ejecuciones `host=node` respaldadas por aprobación, el Gateway también vincula la ejecución al
`systemRunPlan` canónico preparado. Si un llamador posterior muta el comando/cwd o los
metadatos de sesión antes de que se reenvíe la ejecución aprobada, el Gateway rechaza la
ejecución como una discrepancia de aprobación en lugar de confiar en la carga útil editada.

## Códigos de error comunes de nodo

- `NODE_BACKGROUND_UNAVAILABLE` → la aplicación está en segundo plano; llévala al primer plano.
- `CAMERA_DISABLED` → el interruptor de cámara está desactivado en la configuración del nodo.
- `*_PERMISSION_REQUIRED` → falta el permiso del SO o fue denegado.
- `LOCATION_DISABLED` → el modo de ubicación está desactivado.
- `LOCATION_PERMISSION_REQUIRED` → no se concedió el modo de ubicación solicitado.
- `LOCATION_BACKGROUND_UNAVAILABLE` → la aplicación está en segundo plano, pero solo existe permiso Al usarse.
- `SYSTEM_RUN_DENIED: approval required` → la solicitud de ejecución necesita aprobación explícita.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado por el modo de lista de permitidos.
  En hosts de nodo Windows, las formas de envoltorio de shell como `cmd.exe /c ...` se tratan como omisiones de la lista de permitidos en
  modo de lista de permitidos, salvo que se aprueben mediante el flujo de solicitud.

## Bucle de recuperación rápida

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Si sigues atascado:

- Vuelve a aprobar el emparejamiento del dispositivo.
- Vuelve a abrir la aplicación del nodo (primer plano).
- Vuelve a conceder los permisos del SO.
- Recrea/ajusta la política de aprobación de ejecución.

## Relacionado

- [Información general de los nodos](/es/nodes)
- [Nodos de cámara](/es/nodes/camera)
- [Comando de ubicación](/es/nodes/location-command)
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
- [Emparejamiento de Gateway](/es/gateway/pairing)
- [Solución de problemas de Gateway](/es/gateway/troubleshooting)
- [Solución de problemas de canales](/es/channels/troubleshooting)
