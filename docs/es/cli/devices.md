---
read_when:
    - Estás aprobando solicitudes de emparejamiento de dispositivos
    - Debe rotar o revocar los tokens de dispositivo
summary: Referencia de CLI para `openclaw devices` (emparejamiento de dispositivos + rotación/revocación de tokens)
title: Dispositivos
x-i18n:
    generated_at: "2026-04-30T05:33:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: df105135a12ec733e45a67792e8447628f1538fc2536a008d615d46d1eaff5c8
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Gestiona solicitudes de emparejamiento de dispositivos y tokens con ámbito de dispositivo.

## Comandos

### `openclaw devices list`

Lista las solicitudes de emparejamiento pendientes y los dispositivos emparejados.

```
openclaw devices list
openclaw devices list --json
```

La salida de solicitudes pendientes muestra el acceso solicitado junto al acceso
aprobado actual del dispositivo cuando el dispositivo ya está emparejado. Esto hace
explícitas las ampliaciones de ámbito/rol, en lugar de parecer que se perdió el emparejamiento.

### `openclaw devices remove <deviceId>`

Elimina una entrada de dispositivo emparejado.

Cuando estás autenticado con un token de dispositivo emparejado, los llamadores no administradores solo pueden
eliminar la entrada de **su propio** dispositivo. Eliminar otro dispositivo requiere
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Borra dispositivos emparejados en bloque.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Aprueba una solicitud pendiente de emparejamiento de dispositivo por `requestId` exacto. Si se omite `requestId`
o se pasa `--latest`, OpenClaw solo imprime la solicitud pendiente seleccionada
y sale; vuelve a ejecutar la aprobación con el ID de solicitud exacto después de verificar
los detalles.

<Note>
Si un dispositivo reintenta el emparejamiento con detalles de autenticación modificados (rol, ámbitos o clave pública), OpenClaw reemplaza la entrada pendiente anterior y emite un nuevo `requestId`. Ejecuta `openclaw devices list` justo antes de aprobar para usar el ID actual.
</Note>

Si el dispositivo ya está emparejado y solicita ámbitos más amplios o un rol más amplio,
OpenClaw mantiene la aprobación existente y crea una nueva solicitud pendiente de ampliación.
Revisa las columnas `Requested` frente a `Approved` en `openclaw devices list`
o usa `openclaw devices approve --latest` para previsualizar la ampliación exacta antes de
aprobarla.

Si el Gateway está configurado explícitamente con
`gateway.nodes.pairing.autoApproveCidrs`, las solicitudes iniciales `role: node` desde
IP de cliente coincidentes pueden aprobarse antes de aparecer en esta lista. Esa política
está deshabilitada de forma predeterminada y nunca se aplica a clientes operador/navegador ni a solicitudes
de ampliación.

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

Rota un token de dispositivo para un rol específico (opcionalmente actualizando ámbitos).
El rol de destino ya debe existir en el contrato de emparejamiento aprobado de ese dispositivo;
la rotación no puede emitir un nuevo rol no aprobado.
Si omites `--scope`, las reconexiones posteriores con el token rotado almacenado reutilizan los
ámbitos aprobados en caché de ese token. Si pasas valores `--scope` explícitos, esos
pasan a ser el conjunto de ámbitos almacenado para futuras reconexiones con token en caché.
Los llamadores no administradores de dispositivos emparejados solo pueden rotar el token de **su propio** dispositivo.
El conjunto de ámbitos del token de destino debe permanecer dentro de los propios ámbitos de operador
de la sesión del llamador; la rotación no puede emitir ni conservar un token de operador más amplio que el que
el llamador ya tiene.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Devuelve metadatos de rotación como JSON. Si el llamador está rotando su propio token mientras
está autenticado con ese token de dispositivo, la respuesta también incluye el token de reemplazo
para que el cliente pueda persistirlo antes de reconectarse. Las rotaciones compartidas/de administrador
no muestran el token portador.

### `openclaw devices revoke --device <id> --role <role>`

Revoca un token de dispositivo para un rol específico.

Los llamadores no administradores de dispositivos emparejados solo pueden revocar el token de **su propio** dispositivo.
Revocar el token de otro dispositivo requiere `operator.admin`.
El conjunto de ámbitos del token de destino también debe caber dentro de los propios
ámbitos de operador de la sesión del llamador; los llamadores solo de emparejamiento no pueden revocar tokens de operador de administrador/escritura.

```
openclaw devices revoke --device <deviceId> --role node
```

Devuelve el resultado de la revocación como JSON.

## Opciones comunes

- `--url <url>`: URL WebSocket del Gateway (usa `gateway.remote.url` de forma predeterminada cuando está configurado).
- `--token <token>`: token del Gateway (si es necesario).
- `--password <password>`: contraseña del Gateway (autenticación con contraseña).
- `--timeout <ms>`: tiempo de espera de RPC.
- `--json`: salida JSON (recomendado para scripts).

<Warning>
Cuando configuras `--url`, la CLI no recurre a credenciales de configuración ni de entorno. Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.
</Warning>

## Notas

- La rotación de tokens devuelve un nuevo token (sensible). Trátalo como un secreto.
- Estos comandos requieren el ámbito `operator.pairing` (u `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` es una política opcional del Gateway solo para
  el emparejamiento de dispositivos de nodo nuevos; no cambia la autoridad de aprobación de la CLI.
- La rotación y revocación de tokens permanecen dentro del conjunto de roles de emparejamiento aprobado y
  la línea base de ámbitos aprobados para ese dispositivo. Una entrada de token en caché aislada no
  concede un destino de gestión de tokens.
- Para sesiones con token de dispositivo emparejado, la gestión entre dispositivos es solo de administrador:
  `remove`, `rotate` y `revoke` son solo para uno mismo a menos que el llamador tenga
  `operator.admin`.
- La mutación de tokens también está contenida por el ámbito del llamador: una sesión solo de emparejamiento no puede
  rotar ni revocar un token que actualmente tenga `operator.admin` u
  `operator.write`.
- `devices clear` está protegido intencionadamente por `--yes`.
- Si el ámbito de emparejamiento no está disponible en local loopback (y no se pasa un `--url` explícito), list/approve puede usar una alternativa local de emparejamiento.
- `devices approve` requiere un ID de solicitud explícito antes de emitir tokens; omitir `requestId` o pasar `--latest` solo previsualiza la solicitud pendiente más reciente.

## Lista de comprobación para recuperar desajustes de tokens

Usa esto cuando Control UI u otros clientes sigan fallando con `AUTH_TOKEN_MISMATCH` o `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirma la fuente actual del token de Gateway:

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

5. Reintenta la conexión del cliente con el token/contraseña compartido actual.

Notas:

- La precedencia normal de autenticación de reconexión es primero token/contraseña compartido explícito, luego `deviceToken` explícito, luego token de dispositivo almacenado y luego token de arranque.
- La recuperación confiable de `AUTH_TOKEN_MISMATCH` puede enviar temporalmente tanto el token compartido como el token de dispositivo almacenado juntos para el único reintento acotado.

Relacionado:

- [Solución de problemas de autenticación del panel](/es/web/dashboard#if-you-see-unauthorized-1008)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Nodos](/es/nodes)
