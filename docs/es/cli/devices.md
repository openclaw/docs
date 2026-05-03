---
read_when:
    - Estás aprobando solicitudes de emparejamiento de dispositivos
    - Debe rotar o revocar los tokens de dispositivo
summary: Referencia de CLI para `openclaw devices` (emparejamiento de dispositivos + rotación/revocación de tokens)
title: Dispositivos
x-i18n:
    generated_at: "2026-05-03T05:26:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa92fd3ffc671c827fa98870bf9df89f3be90adec167fd8ea32698cf2e69991a
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Gestiona solicitudes de emparejamiento de dispositivos y tokens con alcance de dispositivo.

## Comandos

### `openclaw devices list`

Lista las solicitudes de emparejamiento pendientes y los dispositivos emparejados.

```
openclaw devices list
openclaw devices list --json
```

La salida de solicitudes pendientes muestra el acceso solicitado junto al acceso
aprobado actual del dispositivo cuando el dispositivo ya está emparejado. Esto hace
explícitas las actualizaciones de alcance/rol en lugar de parecer que se perdió el emparejamiento.

### `openclaw devices remove <deviceId>`

Elimina una entrada de dispositivo emparejado.

Cuando estás autenticado con un token de dispositivo emparejado, los llamadores que no son administradores solo pueden
eliminar la entrada de **su propio** dispositivo. Eliminar algún otro dispositivo requiere
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

Aprueba una solicitud pendiente de emparejamiento de dispositivo por `requestId` exacto. Si se omite `requestId`
o se pasa `--latest`, OpenClaw solo imprime la solicitud pendiente seleccionada
y sale; vuelve a ejecutar la aprobación con el ID de solicitud exacto después de verificar
los detalles.

<Note>
Si un dispositivo reintenta el emparejamiento con detalles de autenticación modificados (rol, alcances o clave pública), OpenClaw sustituye la entrada pendiente anterior y emite un nuevo `requestId`. Ejecuta `openclaw devices list` justo antes de aprobar para usar el ID actual.
</Note>

Si el dispositivo ya está emparejado y solicita alcances más amplios o un rol más amplio,
OpenClaw mantiene la aprobación existente y crea una nueva solicitud pendiente de actualización.
Revisa las columnas `Requested` frente a `Approved` en `openclaw devices list`
o usa `openclaw devices approve --latest` para previsualizar la actualización exacta antes de
aprobarla.

Si el Gateway está configurado explícitamente con
`gateway.nodes.pairing.autoApproveCidrs`, las solicitudes iniciales `role: node` desde
IP de cliente coincidentes pueden aprobarse antes de aparecer en esta lista. Esa política
está desactivada de forma predeterminada y nunca se aplica a clientes operador/navegador ni a solicitudes de actualización.

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
la rotación no puede emitir un nuevo rol no aprobado.
Si omites `--scope`, las reconexiones posteriores con el token rotado almacenado reutilizan
los alcances aprobados en caché de ese token. Si pasas valores `--scope` explícitos, esos
pasan a ser el conjunto de alcances almacenado para futuras reconexiones con token en caché.
Los llamadores de dispositivos emparejados que no son administradores solo pueden rotar el token de **su propio** dispositivo.
El conjunto de alcances del token de destino debe permanecer dentro de los propios alcances
de operador de la sesión del llamador; la rotación no puede emitir ni preservar un token de operador más amplio que el
que ya tiene el llamador.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Devuelve metadatos de rotación como JSON. Si el llamador está rotando su propio token mientras
está autenticado con ese token de dispositivo, la respuesta también incluye el token de reemplazo
para que el cliente pueda conservarlo antes de reconectarse. Las rotaciones compartidas/de administrador
no devuelven el token portador.

### `openclaw devices revoke --device <id> --role <role>`

Revoca un token de dispositivo para un rol específico.

Los llamadores de dispositivos emparejados que no son administradores solo pueden revocar el token de **su propio** dispositivo.
Revocar el token de algún otro dispositivo requiere `operator.admin`.
El conjunto de alcances del token de destino también debe caber dentro de los propios alcances
de operador de la sesión del llamador; los llamadores solo de emparejamiento no pueden revocar tokens de operador de administración/escritura.

```
openclaw devices revoke --device <deviceId> --role node
```

Devuelve el resultado de revocación como JSON.

## Opciones comunes

- `--url <url>`: URL de WebSocket del Gateway (usa `gateway.remote.url` de forma predeterminada cuando está configurado).
- `--token <token>`: token del Gateway (si se requiere).
- `--password <password>`: contraseña del Gateway (autenticación con contraseña).
- `--timeout <ms>`: tiempo de espera de RPC.
- `--json`: salida JSON (recomendado para scripting).

<Warning>
Cuando configuras `--url`, la CLI no recurre a credenciales de configuración ni de entorno. Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.
</Warning>

## Notas

- La rotación de token devuelve un nuevo token (sensible). Trátalo como un secreto.
- Estos comandos requieren el alcance `operator.pairing` (o `operator.admin`). Algunas
  aprobaciones también requieren que el llamador tenga los alcances de operador que el dispositivo
  de destino emitiría o heredaría; consulta [Alcances de operador](/es/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` es una política optativa del Gateway solo para
  emparejamiento de dispositivos de nodo nuevos; no cambia la autoridad de aprobación de la CLI.
- La rotación y revocación de tokens permanecen dentro del conjunto de roles de emparejamiento aprobado y
  la base de alcances aprobada para ese dispositivo. Una entrada aislada de token en caché no
  otorga un destino de gestión de tokens.
- Para sesiones con token de dispositivo emparejado, la gestión entre dispositivos es solo de administrador:
  `remove`, `rotate` y `revoke` son solo propios salvo que el llamador tenga
  `operator.admin`.
- La mutación de tokens también está contenida por el alcance del llamador: una sesión solo de emparejamiento no puede
  rotar ni revocar un token que actualmente tenga `operator.admin` u
  `operator.write`.
- `devices clear` está protegido intencionalmente por `--yes`.
- Si el alcance de emparejamiento no está disponible en local loopback (y no se pasa un `--url` explícito), list/approve puede usar una alternativa local de emparejamiento.
- `devices approve` requiere un ID de solicitud explícito antes de emitir tokens; omitir `requestId` o pasar `--latest` solo previsualiza la solicitud pendiente más reciente.

## Lista de comprobación para la recuperación de deriva de tokens

Usa esto cuando la interfaz de Control u otros clientes sigan fallando con `AUTH_TOKEN_MISMATCH` o `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirma la fuente actual del token del Gateway:

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

- La precedencia normal de autenticación de reconexión es primero token/contraseña compartido explícito, luego `deviceToken` explícito, luego token de dispositivo almacenado y después token de arranque.
- La recuperación de confianza de `AUTH_TOKEN_MISMATCH` puede enviar temporalmente tanto el token compartido como el token de dispositivo almacenado juntos para el único reintento delimitado.

Relacionado:

- [Solución de problemas de autenticación del panel](/es/web/dashboard#if-you-see-unauthorized-1008)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Nodos](/es/nodes)
