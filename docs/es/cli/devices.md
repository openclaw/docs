---
read_when:
    - Estás aprobando solicitudes de emparejamiento de dispositivos
    - Necesitas rotar o revocar tokens de dispositivo
summary: Referencia de CLI para `openclaw devices` (emparejamiento de dispositivos + rotación/revocación de tokens)
title: Dispositivos
x-i18n:
    generated_at: "2026-04-26T11:25:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5746de715f9c1a46b5d0845918c1512723cfed22b711711b8c6dc6e98880f480
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gestiona solicitudes de emparejamiento de dispositivos y tokens con alcance de dispositivo.

## Comandos

### `openclaw devices list`

Lista solicitudes de emparejamiento pendientes y dispositivos emparejados.

```
openclaw devices list
openclaw devices list --json
```

La salida de solicitudes pendientes muestra el acceso solicitado junto al acceso
aprobado actual del dispositivo cuando el dispositivo ya está emparejado. Esto hace
explícitas las ampliaciones de alcance/rol en lugar de hacer que parezca que se perdió
el emparejamiento.

### `openclaw devices remove <deviceId>`

Elimina una entrada de dispositivo emparejado.

Cuando te autenticas con un token de dispositivo emparejado, los llamadores no administradores
solo pueden eliminar **su propia** entrada de dispositivo. Eliminar otro dispositivo requiere
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Borra dispositivos emparejados de forma masiva.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Aprueba una solicitud pendiente de emparejamiento de dispositivo mediante el `requestId` exacto. Si se omite `requestId`
o se pasa `--latest`, OpenClaw solo imprime la solicitud pendiente seleccionada
y sale; vuelve a ejecutar la aprobación con el ID de solicitud exacto después de verificar
los detalles.

Nota: si un dispositivo vuelve a intentar el emparejamiento con detalles de autenticación cambiados (rol/alcances/clave
pública), OpenClaw reemplaza la entrada pendiente anterior y emite un nuevo
`requestId`. Ejecuta `openclaw devices list` justo antes de aprobar para usar el
ID actual.

Si el dispositivo ya está emparejado y solicita alcances más amplios o un rol más amplio,
OpenClaw mantiene la aprobación existente y crea una nueva solicitud pendiente de ampliación.
Revisa las columnas `Requested` frente a `Approved` en `openclaw devices list`
o usa `openclaw devices approve --latest` para previsualizar la ampliación exacta antes de
aprobarla.

Si el Gateway está configurado explícitamente con
`gateway.nodes.pairing.autoApproveCidrs`, las solicitudes iniciales `role: node` de
IPs cliente coincidentes pueden aprobarse antes de aparecer en esta lista. Esa política
está deshabilitada de forma predeterminada y nunca se aplica a clientes operator/browser ni a solicitudes de ampliación.

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
El rol de destino ya debe existir en el contrato de emparejamiento aprobado de ese dispositivo;
la rotación no puede acuñar un nuevo rol no aprobado.
Si omites `--scope`, las reconexiones posteriores con el token rotado almacenado reutilizan los
alcances aprobados en caché de ese token. Si pasas valores explícitos de `--scope`, esos
pasan a ser el conjunto de alcances almacenado para futuras reconexiones con token en caché.
Los llamadores no administradores con dispositivo emparejado solo pueden rotar **su propio** token de dispositivo.
El conjunto de alcances del token de destino debe mantenerse dentro de los propios alcances de operador de la sesión llamadora;
la rotación no puede acuñar ni conservar un token de operador más amplio que el
que ya tiene el llamador.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Devuelve la nueva carga útil del token como JSON.

### `openclaw devices revoke --device <id> --role <role>`

Revoca un token de dispositivo para un rol específico.

Los llamadores no administradores con dispositivo emparejado solo pueden revocar **su propio** token de dispositivo.
Revocar el token de otro dispositivo requiere `operator.admin`.
El conjunto de alcances del token de destino también debe ajustarse a los propios
alcances de operador de la sesión llamadora; los llamadores solo de emparejamiento no pueden revocar tokens de operador con `admin` o `write`.

```
openclaw devices revoke --device <deviceId> --role node
```

Devuelve el resultado de la revocación como JSON.

## Opciones comunes

- `--url <url>`: URL de WebSocket del Gateway (usa por defecto `gateway.remote.url` cuando está configurado).
- `--token <token>`: token del Gateway (si es necesario).
- `--password <password>`: contraseña del Gateway (autenticación por contraseña).
- `--timeout <ms>`: tiempo de espera de RPC.
- `--json`: salida JSON (recomendado para scripts).

Nota: cuando estableces `--url`, la CLI no recurre a credenciales de configuración ni del entorno.
Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.

## Notas

- La rotación de token devuelve un token nuevo (sensible). Trátalo como un secreto.
- Estos comandos requieren el alcance `operator.pairing` (o `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` es una política opcional del Gateway para
  emparejamiento inicial de dispositivos Node únicamente; no cambia la autoridad de aprobación de la CLI.
- La rotación y revocación de tokens permanecen dentro del conjunto de roles de emparejamiento aprobados y
  de la línea base de alcances aprobados para ese dispositivo. Una entrada de token en caché extraviada no
  concede un objetivo de gestión de tokens.
- Para sesiones de token de dispositivo emparejado, la gestión entre dispositivos es solo para administradores:
  `remove`, `rotate` y `revoke` son solo para uno mismo a menos que el llamador tenga
  `operator.admin`.
- La mutación de tokens también está contenida por los alcances del llamador: una sesión solo de emparejamiento no puede
  rotar ni revocar un token que actualmente tenga `operator.admin` o
  `operator.write`.
- `devices clear` está intencionadamente protegido por `--yes`.
- Si el alcance de emparejamiento no está disponible en `local loopback` (y no se pasa `--url` explícito), `list`/`approve` pueden usar un respaldo de emparejamiento local.
- `devices approve` requiere un ID de solicitud explícito antes de acuñar tokens; omitir `requestId` o pasar `--latest` solo previsualiza la solicitud pendiente más reciente.

## Lista de comprobación de recuperación de deriva de token

Usa esto cuando la UI de control u otros clientes sigan fallando con `AUTH_TOKEN_MISMATCH` o `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirma la fuente actual del token del gateway:

```bash
openclaw config get gateway.auth.token
```

2. Lista los dispositivos emparejados e identifica el id del dispositivo afectado:

```bash
openclaw devices list
```

3. Rota el token de operador para el dispositivo afectado:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Si la rotación no es suficiente, elimina el emparejamiento obsoleto y aprueba de nuevo:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Vuelve a intentar la conexión del cliente con el token/contraseña compartidos actuales.

Notas:

- La precedencia normal de autenticación de reconexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado y después token de bootstrap.
- La recuperación confiable de `AUTH_TOKEN_MISMATCH` puede enviar temporalmente tanto el token compartido como el token de dispositivo almacenado juntos para ese único reintento acotado.

Relacionado:

- [Solución de problemas de autenticación del panel](/es/web/dashboard#if-you-see-unauthorized-1008)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Relacionado

- [Referencia de CLI](/es/cli)
- [Node](/es/nodes)
