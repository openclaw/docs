---
read_when:
    - El Node está conectado, pero las herramientas de cámara/canvas/pantalla/exec fallan
    - Necesita comprender el modelo mental de emparejamiento de nodos frente al de aprobaciones
summary: Soluciona problemas de emparejamiento de nodos, requisitos de primer plano, permisos y fallos de herramientas
title: Solución de problemas de Node
x-i18n:
    generated_at: "2026-07-12T14:39:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Use esta página cuando un Node esté visible en el estado, pero las herramientas de Node fallen.

## Secuencia de comandos

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

A continuación, ejecute las comprobaciones específicas del Node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Señales de funcionamiento correcto:

- El Node está conectado y emparejado para el rol `node`.
- `nodes describe` incluye la capacidad que se está invocando.
- Las aprobaciones de ejecución muestran el modo y la lista de permitidos esperados.

## Requisitos de primer plano

`canvas.*`, `camera.*` y `screen.*` solo funcionan en primer plano en los Nodes iOS/Android.

Comprobación y corrección rápidas:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Si aparece `NODE_BACKGROUND_UNAVAILABLE`, lleve la aplicación del Node al primer plano y vuelva a intentarlo.

## Matriz de permisos

| Capacidad                    | iOS                                              | Android                                                    | Aplicación de Node para macOS                | Código de error habitual                      |
| ---------------------------- | ------------------------------------------------ | ---------------------------------------------------------- | -------------------------------------------- | --------------------------------------------- |
| `camera.snap`, `camera.clip` | Cámara (+ micrófono para el audio del clip)       | Cámara (+ micrófono para el audio del clip)                 | Cámara (+ micrófono para el audio del clip)  | `*_PERMISSION_REQUIRED`                       |
| `screen.record`              | Grabación de pantalla (+ micrófono opcional)      | Solicitud de captura de pantalla (+ micrófono opcional)     | Grabación de pantalla                        | `*_PERMISSION_REQUIRED`                       |
| `computer.act`               | no disponible                                    | no disponible                                              | Accesibilidad + Grabación de pantalla        | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED` |
| `location.get`               | Al usar o Siempre (depende del modo)              | Ubicación en primer plano/segundo plano según el modo       | Permiso de ubicación                         | `LOCATION_PERMISSION_REQUIRED`                |
| `system.run`                 | no disponible (ruta del host del Node)            | no disponible (ruta del host del Node)                      | Se requieren aprobaciones de ejecución       | `SYSTEM_RUN_DENIED`                           |

## Emparejamiento frente a aprobaciones

Tres controles independientes determinan si un comando de Node se ejecuta correctamente:

1. **Emparejamiento del dispositivo**: ¿puede este Node conectarse al Gateway?
2. **Política de comandos de Node del Gateway**: ¿el identificador del comando RPC está permitido por `gateway.nodes.allowCommands` / `denyCommands` y los valores predeterminados de la plataforma?
3. **Aprobaciones de ejecución**: ¿puede este Node ejecutar localmente un comando de shell específico?

El emparejamiento de Nodes es un control de identidad y confianza, no una interfaz de aprobación por comando. Para `system.run`, la política por Node se encuentra en el archivo de aprobaciones de ejecución de ese Node (`openclaw approvals get --node ...`), no en el registro de emparejamiento del Gateway.

Comprobaciones rápidas:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- Falta el emparejamiento: apruebe primero el dispositivo Node.
- Falta un comando en `nodes describe`: compruebe la política de comandos de Node del Gateway y si el Node declaró realmente ese comando al conectarse.
- El emparejamiento es correcto, pero `system.run` falla: corrija las aprobaciones de ejecución o la lista de permitidos de ese Node.

Para las ejecuciones `host=node` respaldadas por aprobación, el Gateway también vincula la ejecución al `systemRunPlan` canónico preparado. Si un invocador posterior modifica el comando, el directorio de trabajo o los metadatos de sesión antes de reenviar la ejecución aprobada, el Gateway rechaza la ejecución por discrepancia de aprobación en lugar de confiar en la carga útil modificada.

## Códigos de error habituales de Node

| Código                                 | Significado                                                                                                                                                                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NODE_BACKGROUND_UNAVAILABLE`          | La aplicación está en segundo plano; llévela al primer plano.                                                                                                                                                                                                      |
| `CAMERA_DISABLED`                      | El control de cámara está desactivado en la configuración del Node.                                                                                                                                                                                                |
| `*_PERMISSION_REQUIRED`                | Falta el permiso del sistema operativo o se ha denegado.                                                                                                                                                                                                           |
| `LOCATION_DISABLED`                    | El modo de ubicación está desactivado.                                                                                                                                                                                                                              |
| `LOCATION_PERMISSION_REQUIRED`         | No se ha concedido el modo de ubicación solicitado.                                                                                                                                                                                                                 |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | La aplicación está en segundo plano, pero solo existe el permiso Al usar.                                                                                                                                                                                           |
| `COMPUTER_DISABLED`                    | Active **Allow Computer Control** en la aplicación para macOS y, a continuación, apruebe la actualización del emparejamiento.                                                                                                                                       |
| `ACCESSIBILITY_REQUIRED`               | Conceda Accesibilidad al paquete actual de la aplicación OpenClaw en la Configuración del Sistema de macOS.                                                                                                                                                          |
| `SYSTEM_RUN_DENIED: approval required` | La solicitud de ejecución necesita aprobación explícita.                                                                                                                                                                                                           |
| `SYSTEM_RUN_DENIED: allowlist miss`    | El comando está bloqueado por el modo de lista de permitidos. En los hosts de Node para Windows, las formas con contenedor de shell como `cmd.exe /c ...` se consideran ausentes de la lista de permitidos en dicho modo, salvo que se aprueben mediante el flujo de solicitud. |

## Bucle de recuperación rápida

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Si el problema persiste:

- Vuelva a aprobar el emparejamiento del dispositivo.
- Vuelva a abrir la aplicación del Node en primer plano.
- Vuelva a conceder los permisos del sistema operativo.
- Vuelva a crear o ajuste la política de aprobación de ejecución.

Para el control del equipo, compruebe también que un agente con capacidad de visión exponga la herramienta `computer`, que `screen.snapshot` se ejecute correctamente con el permiso Grabación de pantalla y que `/phone status` muestre la autorización temporal o persistente del Gateway que se pretendía usar. Una entrada de `gateway.nodes.denyCommands` siempre prevalece sobre `allowCommands`.

## Contenido relacionado

- [Descripción general de los Nodes](/es/nodes)
- [Nodes de cámara](/es/nodes/camera)
- [Comando de ubicación](/es/nodes/location-command)
- [Uso del equipo](/nodes/computer-use)
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
- [Emparejamiento del Gateway](/es/gateway/pairing)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
- [Solución de problemas de canales](/es/channels/troubleshooting)
