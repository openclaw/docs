---
read_when:
    - El nodo está conectado, pero fallan las herramientas de cámara/canvas/pantalla/exec
    - Necesitas el modelo mental de vinculación de nodos frente a aprobaciones
summary: Solucionar problemas de vinculación de nodos, requisitos de primer plano, permisos y fallos de herramientas
title: Solución de problemas de nodos
x-i18n:
    generated_at: "2026-04-24T05:37:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 15
---

Usa esta página cuando un nodo sea visible en el estado pero fallen las herramientas del nodo.

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

Señales saludables:

- El nodo está conectado y vinculado para el rol `node`.
- `nodes describe` incluye la capacidad que estás llamando.
- Las aprobaciones de exec muestran el modo/lista de permitidos esperados.

## Requisitos de primer plano

`canvas.*`, `camera.*` y `screen.*` son solo de primer plano en nodos iOS/Android.

Comprobación y solución rápidas:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Si ves `NODE_BACKGROUND_UNAVAILABLE`, lleva la app del nodo a primer plano y vuelve a intentarlo.

## Matriz de permisos

| Capacidad                    | iOS                                     | Android                                      | app de nodo macOS             | Código de fallo típico         |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Cámara (+ micro para audio del clip)    | Cámara (+ micro para audio del clip)         | Cámara (+ micro para audio del clip) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Grabación de pantalla (+ micro opcional) | Solicitud de captura de pantalla (+ micro opcional) | Grabación de pantalla     | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Mientras se usa o Siempre (depende del modo) | Ubicación en primer/segundo plano según el modo | Permiso de ubicación      | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (ruta del host del nodo)            | n/a (ruta del host del nodo)                 | Se requieren aprobaciones de exec | `SYSTEM_RUN_DENIED`            |

## Vinculación frente a aprobaciones

Estas son barreras distintas:

1. **Vinculación de dispositivo**: ¿puede este nodo conectarse al gateway?
2. **Política de comandos de nodo del Gateway**: ¿está permitido el ID de comando RPC por `gateway.nodes.allowCommands` / `denyCommands` y los valores predeterminados de la plataforma?
3. **Aprobaciones de exec**: ¿puede este nodo ejecutar localmente un comando de shell específico?

Comprobaciones rápidas:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Si falta la vinculación, aprueba primero el dispositivo nodo.
Si a `nodes describe` le falta un comando, comprueba la política de comandos de nodo del gateway y si el nodo realmente declaró ese comando al conectarse.
Si la vinculación está bien pero `system.run` falla, corrige las aprobaciones/lista de permitidos de exec en ese nodo.

La vinculación de nodos es una barrera de identidad/confianza, no una superficie de aprobación por comando. Para `system.run`, la política por nodo vive en el archivo de aprobaciones de exec de ese nodo (`openclaw approvals get --node ...`), no en el registro de vinculación del gateway.

Para ejecuciones `host=node` respaldadas por aprobación, el gateway también vincula la ejecución al
`systemRunPlan` canónico preparado. Si quien llama más tarde modifica command/cwd o
metadatos de sesión antes de reenviar la ejecución aprobada, el gateway rechaza la
ejecución como desajuste de aprobación en lugar de confiar en la carga editada.

## Códigos de error comunes de nodo

- `NODE_BACKGROUND_UNAVAILABLE` → la app está en segundo plano; llévala a primer plano.
- `CAMERA_DISABLED` → el interruptor de cámara está desactivado en los ajustes del nodo.
- `*_PERMISSION_REQUIRED` → falta permiso del SO o fue denegado.
- `LOCATION_DISABLED` → el modo de ubicación está desactivado.
- `LOCATION_PERMISSION_REQUIRED` → no se concedió el modo de ubicación solicitado.
- `LOCATION_BACKGROUND_UNAVAILABLE` → la app está en segundo plano pero solo existe permiso Mientras se usa.
- `SYSTEM_RUN_DENIED: approval required` → la solicitud de exec necesita aprobación explícita.
- `SYSTEM_RUN_DENIED: allowlist miss` → el comando está bloqueado por el modo de lista de permitidos.
  En hosts de nodo Windows, formas con contenedor de shell como `cmd.exe /c ...` se tratan como fallos de lista de permitidos en
  modo de lista de permitidos salvo aprobación mediante el flujo ask.

## Bucle rápido de recuperación

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Si sigues atascado:

- Vuelve a aprobar la vinculación del dispositivo.
- Vuelve a abrir la app del nodo (primer plano).
- Vuelve a conceder permisos del SO.
- Vuelve a crear/ajustar la política de aprobaciones de exec.

Relacionado:

- [/nodes/index](/es/nodes/index)
- [/nodes/camera](/es/nodes/camera)
- [/nodes/location-command](/es/nodes/location-command)
- [/tools/exec-approvals](/es/tools/exec-approvals)
- [/gateway/pairing](/es/gateway/pairing)

## Relacionado

- [Descripción general de nodos](/es/nodes)
- [Solución de problemas de Gateway](/es/gateway/troubleshooting)
- [Solución de problemas de canales](/es/channels/troubleshooting)
