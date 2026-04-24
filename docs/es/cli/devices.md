---
read_when:
    - Estás aprobando solicitudes de emparejamiento de dispositivos
    - Necesitas rotar o revocar tokens de dispositivo
summary: Referencia de la CLI para `openclaw devices` (emparejamiento de dispositivos + rotación/revocación de tokens)
title: Dispositivos
x-i18n:
    generated_at: "2026-04-24T05:22:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4ae835807ba4b0aea1073b9a84410a10fa0394d7d34e49d645071108cea6a35
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gestiona solicitudes de emparejamiento de dispositivos y tokens con alcance por dispositivo.

## Comandos

### `openclaw devices list`

Muestra las solicitudes de emparejamiento pendientes y los dispositivos emparejados.

```
openclaw devices list
openclaw devices list --json
```

La salida de solicitudes pendientes muestra el acceso solicitado junto al acceso aprobado actual del dispositivo cuando el dispositivo ya está emparejado. Esto hace explícitas las mejoras de alcance/rol en lugar de que parezca que se perdió el emparejamiento.

### `openclaw devices remove <deviceId>`

Elimina una entrada de dispositivo emparejado.

Cuando estás autenticado con un token de dispositivo emparejado, quienes no son administradores solo pueden eliminar **su propia** entrada de dispositivo. Eliminar otro dispositivo requiere `operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Elimina en bloque dispositivos emparejados.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Aprueba una solicitud pendiente de emparejamiento de dispositivo mediante `requestId` exacto. Si se omite `requestId` o se pasa `--latest`, OpenClaw solo imprime la solicitud pendiente seleccionada y sale; vuelve a ejecutar la aprobación con el ID de solicitud exacto después de verificar los detalles.

Nota: si un dispositivo vuelve a intentar el emparejamiento con detalles de autenticación modificados (rol/alcances/clave pública), OpenClaw reemplaza la entrada pendiente anterior y emite un nuevo `requestId`. Ejecuta `openclaw devices list` justo antes de aprobar para usar el ID actual.

Si el dispositivo ya está emparejado y solicita alcances más amplios o un rol más amplio, OpenClaw mantiene la aprobación existente y crea una nueva solicitud pendiente de mejora. Revisa las columnas `Requested` frente a `Approved` en `openclaw devices list` o usa `openclaw devices approve --latest` para previsualizar la mejora exacta antes de aprobarla.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Rechaza una solicitud pendiente de emparejamiento de dispositivo.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rota un token de dispositivo para un rol específico (opcionalmente actualizando alcances).
El rol de destino ya debe existir en el contrato de emparejamiento aprobado de ese dispositivo; la rotación no puede emitir un nuevo rol no aprobado.
Si omites `--scope`, las reconexiones posteriores con el token rotado almacenado reutilizan los alcances aprobados en caché de ese token.
Si pasas valores `--scope` explícitos, esos se convierten en el conjunto de alcances almacenado para futuras reconexiones con token en caché.
Quienes no son administradores y llaman con dispositivo emparejado solo pueden rotar **su propio** token de dispositivo.
Además, cualquier valor `--scope` explícito debe mantenerse dentro de los propios alcances de operador de la sesión de quien llama; la rotación no puede emitir un token de operador más amplio que el que quien llama ya tiene.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Devuelve la nueva carga útil del token como JSON.

### `openclaw devices revoke --device <id> --role <role>`

Revoca un token de dispositivo para un rol específico.

Quienes no son administradores y llaman con dispositivo emparejado solo pueden revocar **su propio** token de dispositivo.
Revocar el token de otro dispositivo requiere `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Devuelve el resultado de la revocación como JSON.

## Opciones comunes

- `--url <url>`: URL WebSocket de Gateway (usa `gateway.remote.url` de forma predeterminada cuando está configurado).
- `--token <token>`: token de Gateway (si es necesario).
- `--password <password>`: contraseña de Gateway (autenticación por contraseña).
- `--timeout <ms>`: tiempo de espera de RPC.
- `--json`: salida JSON (recomendado para scripts).

Nota: cuando estableces `--url`, la CLI no recurre a credenciales de configuración ni de entorno.
Pasa `--token` o `--password` explícitamente. La ausencia de credenciales explícitas es un error.

## Notas

- La rotación de tokens devuelve un token nuevo (confidencial). Trátalo como un secreto.
- Estos comandos requieren alcance `operator.pairing` (o `operator.admin`).
- La rotación de tokens se mantiene dentro del conjunto de roles de emparejamiento aprobados y de la línea base de alcances aprobados para ese dispositivo. Una entrada aislada de token en caché no concede un nuevo destino de rotación.
- Para sesiones de tokens de dispositivos emparejados, la gestión entre dispositivos es solo para administradores: `remove`, `rotate` y `revoke` son solo para uno mismo a menos que quien llama tenga `operator.admin`.
- `devices clear` está intencionadamente protegido por `--yes`.
- Si el alcance de emparejamiento no está disponible en `local loopback` (y no se pasa `--url` explícito), `list`/`approve` pueden usar una alternativa local de emparejamiento.
- `devices approve` requiere un ID de solicitud explícito antes de emitir tokens; omitir `requestId` o pasar `--latest` solo previsualiza la solicitud pendiente más reciente.

## Lista de comprobación para recuperación de desfase de token

Úsala cuando Control UI u otros clientes sigan fallando con `AUTH_TOKEN_MISMATCH` o `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirma la fuente actual del token de gateway:

```bash
openclaw config get gateway.auth.token
```

2. Muestra los dispositivos emparejados e identifica el ID del dispositivo afectado:

```bash
openclaw devices list
```

3. Rota el token de operador del dispositivo afectado:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Si la rotación no es suficiente, elimina el emparejamiento obsoleto y vuelve a aprobar:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Vuelve a intentar la conexión del cliente con el token/contraseña compartidos actuales.

Notas:

- La precedencia normal de autenticación de reconexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, después token de dispositivo almacenado y, por último, token de arranque.
- La recuperación confiable de `AUTH_TOKEN_MISMATCH` puede enviar temporalmente tanto el token compartido como el token de dispositivo almacenado juntos para el único reintento delimitado.

Relacionado:

- [Solución de problemas de autenticación del panel](/es/web/dashboard#if-you-see-unauthorized-1008)
- [Solución de problemas de Gateway](/es/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Nodes](/es/nodes)
