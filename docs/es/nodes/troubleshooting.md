---
read_when:
    - El Node está conectado, pero las herramientas de cámara/lienzo/pantalla/ejecución fallan
    - Necesita comprender el modelo mental del emparejamiento de nodos frente a las aprobaciones
summary: Soluciona problemas de emparejamiento de nodos, requisitos de primer plano, permisos y fallos de herramientas
title: Solución de problemas de Node
x-i18n:
    generated_at: "2026-07-22T10:38:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a7ee9e48985805e91cd5acfa1b9f6b676b7e67236ce29fe91e2c8d03002e5c4
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Usa esta página cuando un Node sea visible en el estado, pero las herramientas del Node fallen.

## Secuencia de comandos

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

A continuación, ejecuta comprobaciones específicas del Node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Señales de funcionamiento correcto:

- El Node está conectado y emparejado para el rol `node`.
- `nodes describe` incluye la capacidad que se está invocando.
- Las aprobaciones de ejecución muestran el modo o la lista de permitidos esperados.

## Requisitos de primer plano

`canvas.*`, `camera.*` y `screen.*` solo funcionan en primer plano en los Nodes iOS/Android.

Comprobación y solución rápidas:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Si aparece `NODE_BACKGROUND_UNAVAILABLE`, lleva la aplicación del Node al primer plano y vuelve a intentarlo.

## Matriz de permisos

| Capacidad                    | iOS                                               | Android                                           | Aplicación del Node para macOS                    | Código de error habitual                         |
| ---------------------------- | ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| `camera.snap`, `camera.clip` | Cámara (+ micrófono para el audio del clip)        | Cámara (+ micrófono para el audio del clip)        | Cámara (+ micrófono para el audio del clip)       | `*_PERMISSION_REQUIRED`                              |
| `screen.record`           | Grabación de pantalla (+ micrófono opcional)       | Solicitud de captura de pantalla (+ micrófono opcional) | Grabación de pantalla                       | `*_PERMISSION_REQUIRED`                              |
| `computer.act`           | n/d                                               | n/d                                               | Accesibilidad + grabación de pantalla             | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED`          |
| `location.get`           | Durante el uso o siempre (depende del modo)        | Ubicación en primer plano/segundo plano según el modo | Permiso de ubicación                          | `LOCATION_PERMISSION_REQUIRED`                              |
| `system.run`           | n/d (ruta del host del Node)                       | n/d (ruta del host del Node)                       | Se requieren aprobaciones de ejecución            | `SYSTEM_RUN_DENIED`                              |

## Emparejamiento frente a aprobaciones

Tres controles independientes determinan si un comando del Node se ejecuta correctamente:

1. **Emparejamiento del dispositivo**: ¿puede este Node conectarse al Gateway?
2. **Política de comandos de Node del Gateway**: ¿permiten `gateway.nodes.commands.allow` / `gateway.nodes.commands.deny` y los valores predeterminados de la plataforma el ID del comando RPC?
3. **Aprobaciones de ejecución**: ¿puede este Node ejecutar localmente un comando de shell específico?

El emparejamiento del Node es un control de identidad y confianza, no una superficie de aprobación por comando. Para `system.run`, la política por Node reside en el archivo de aprobaciones de ejecución de ese Node (`openclaw approvals get --node ...`), no en el registro de emparejamiento del Gateway.

Comprobaciones rápidas:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- Falta el emparejamiento: aprueba primero el dispositivo del Node.
- A `nodes describe` le falta un comando: comprueba la política de comandos de Node del Gateway y si el Node declaró realmente ese comando al conectarse.
- El emparejamiento funciona, pero `system.run` falla: corrige las aprobaciones de ejecución o la lista de permitidos de ese Node.

Para las ejecuciones de `host=node` respaldadas por aprobación, el Gateway también vincula la ejecución al `systemRunPlan` canónico preparado. Si posteriormente un llamador modifica el comando, el directorio de trabajo o los metadatos de la sesión antes de que se reenvíe la ejecución aprobada, el Gateway rechaza la ejecución por discrepancia con la aprobación en lugar de confiar en la carga útil modificada.

## Códigos de error habituales de los Nodes

| Código                                 | Significado                                                                                                                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`                     | La aplicación está en segundo plano; llévala al primer plano.                                                                                                                           |
| `CAMERA_DISABLED`                     | El interruptor de la cámara está desactivado en la configuración del Node.                                                                                                              |
| `*_PERMISSION_REQUIRED`                     | Falta el permiso del sistema operativo o se ha denegado.                                                                                                                                |
| `LOCATION_DISABLED`                     | El modo de ubicación está desactivado.                                                                                                                                                   |
| `LOCATION_PERMISSION_REQUIRED`                     | No se ha concedido el modo de ubicación solicitado.                                                                                                                                     |
| `LOCATION_BACKGROUND_UNAVAILABLE`                     | La aplicación está en segundo plano, pero solo dispone del permiso Durante el uso.                                                                                                      |
| `COMPUTER_DISABLED`                     | Activa **Allow Computer Control** en la aplicación para macOS y, a continuación, aprueba la actualización del emparejamiento.                                                           |
| `ACCESSIBILITY_REQUIRED`                     | Concede Accesibilidad al paquete actual de la aplicación OpenClaw en la Configuración del Sistema de macOS.                                                                             |
| `SYSTEM_RUN_DENIED: approval required`                     | La solicitud de ejecución necesita aprobación explícita.                                                                                                                               |
| `SYSTEM_RUN_DENIED: allowlist miss`                     | El modo de lista de permitidos bloquea el comando. En los hosts de Node de Windows, las formas con envoltorio de shell como `cmd.exe /c ...` se consideran ausentes de la lista de permitidos en dicho modo, salvo que se aprueben mediante el flujo de consulta. |

## Bucle de recuperación rápida

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Si el problema persiste:

- Vuelve a aprobar el emparejamiento del dispositivo.
- Vuelve a abrir la aplicación del Node (en primer plano).
- Vuelve a conceder los permisos del sistema operativo.
- Vuelve a crear o ajusta la política de aprobaciones de ejecución.

Para el control del ordenador, comprueba también que un agente con capacidad de visión exponga la herramienta `computer`, que `screen.snapshot` se ejecute correctamente con el permiso de grabación de pantalla y que `/phone status` muestre la autorización temporal o persistente del Gateway que se pretendía usar. Una entrada `gateway.nodes.commands.deny` siempre prevalece sobre `gateway.nodes.commands.allow`.

## Temas relacionados

- [Descripción general de los Nodes](/es/nodes)
- [Nodes con cámara](/es/nodes/camera)
- [Comando de ubicación](/es/nodes/location-command)
- [Uso del ordenador](/es/nodes/computer-use)
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
- [Emparejamiento del Gateway](/es/gateway/pairing)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
- [Solución de problemas de canales](/es/channels/troubleshooting)
