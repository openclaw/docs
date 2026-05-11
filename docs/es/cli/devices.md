---
read_when:
    - Estás aprobando solicitudes de emparejamiento de dispositivos
    - Debe rotar o revocar tokens de dispositivo
summary: Referencia de CLI para `openclaw devices` (emparejamiento de dispositivos + rotación/revocación de tokens)
title: Dispositivos
x-i18n:
    generated_at: "2026-05-11T20:26:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b38caf47697d5fd6c630285c53919f3a5eaf704b1992e57adb1902e20e2a0fc0
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Gestiona solicitudes de emparejamiento de dispositivos y tokens con ámbito de dispositivo.

## Comandos

### `openclaw devices list`

Enumera las solicitudes de emparejamiento pendientes y los dispositivos emparejados.

```
openclaw devices list
openclaw devices list --json
```

La salida de solicitudes pendientes muestra el acceso solicitado junto al acceso
aprobado actual del dispositivo cuando el dispositivo ya está emparejado. Esto hace
que las actualizaciones de alcance/rol sean explícitas en lugar de parecer que el emparejamiento se perdió.

### `openclaw devices remove <deviceId>`

Elimina una entrada de dispositivo emparejado.

Cuando estás autenticado con un token de dispositivo emparejado, los llamadores no administradores pueden
eliminar solo la entrada de dispositivo **propia**. Eliminar otro dispositivo requiere
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

Aprueba una solicitud pendiente de emparejamiento de dispositivo mediante el `requestId` exacto. Si `requestId`
se omite o se pasa `--latest`, OpenClaw solo imprime la solicitud pendiente
seleccionada y sale; vuelve a ejecutar la aprobación con el ID de solicitud exacto después de verificar
los detalles.

<Note>
Si un dispositivo reintenta el emparejamiento con detalles de autenticación modificados (rol, alcances o clave pública), OpenClaw reemplaza la entrada pendiente anterior y emite un nuevo `requestId`. Ejecuta `openclaw devices list` justo antes de la aprobación para usar el ID actual.
</Note>

Si el dispositivo ya está emparejado y solicita alcances más amplios o un rol más amplio,
OpenClaw mantiene la aprobación existente y crea una nueva solicitud pendiente
de actualización. Revisa las columnas `Requested` y `Approved` en `openclaw devices list`
o usa `openclaw devices approve --latest` para previsualizar la actualización exacta antes de
aprobarla.

Si el Gateway está configurado explícitamente con
`gateway.nodes.pairing.autoApproveCidrs`, las solicitudes iniciales `role: node` desde
IP de cliente coincidentes pueden aprobarse antes de que aparezcan en esta lista. Esa política
está deshabilitada de forma predeterminada y nunca se aplica a clientes operador/navegador ni a solicitudes
de actualización.

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

Rota un token de dispositivo para un rol específico (actualizando los alcances de forma opcional).
El rol de destino ya debe existir en el contrato de emparejamiento aprobado de ese dispositivo;
la rotación no puede emitir un nuevo rol no aprobado.
Si omites `--scope`, las reconexiones posteriores con el token rotado almacenado reutilizan los
alcances aprobados en caché de ese token. Si pasas valores `--scope` explícitos, estos
se convierten en el conjunto de alcances almacenado para futuras reconexiones con token en caché.
Los llamadores no administradores con dispositivo emparejado pueden rotar solo su token de dispositivo **propio**.
El conjunto de alcances del token de destino debe permanecer dentro de los alcances de operador
propios de la sesión del llamador; la rotación no puede emitir ni conservar un token de operador más amplio que el
que el llamador ya tiene.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Devuelve metadatos de rotación como JSON. Si el llamador está rotando su propio token mientras
está autenticado con ese token de dispositivo, la respuesta también incluye el token de reemplazo
para que el cliente pueda conservarlo antes de reconectarse. Las rotaciones compartidas/de administrador
no devuelven el token de portador.

### `openclaw devices revoke --device <id> --role <role>`

Revoca un token de dispositivo para un rol específico.

Los llamadores no administradores con dispositivo emparejado pueden revocar solo su token de dispositivo **propio**.
Revocar el token de otro dispositivo requiere `operator.admin`.
El conjunto de alcances del token de destino también debe caber dentro de los alcances de
operador propios de la sesión del llamador; los llamadores solo de emparejamiento no pueden revocar tokens de operador de administración/escritura.

```
openclaw devices revoke --device <deviceId> --role node
```

Devuelve el resultado de revocación como JSON.

## Opciones comunes

- `--url <url>`: URL WebSocket del Gateway (usa `gateway.remote.url` de forma predeterminada cuando está configurada).
- `--token <token>`: token del Gateway (si se requiere).
- `--password <password>`: contraseña del Gateway (autenticación por contraseña).
- `--timeout <ms>`: tiempo de espera de RPC.
- `--json`: salida JSON (recomendado para scripting).

<Warning>
Cuando defines `--url`, la CLI no recurre a credenciales de configuración ni de entorno. Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.
</Warning>

## Notas

- La rotación de tokens devuelve un token nuevo (sensible). Trátalo como un secreto.
- Estos comandos requieren el alcance `operator.pairing` (o `operator.admin`). Algunas
  aprobaciones también requieren que el llamador tenga los alcances de operador que el dispositivo
  de destino emitiría o heredaría; consulta [Alcances de operador](/es/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` es una política opcional del Gateway solo para
  emparejamiento inicial de dispositivos de nodo; no cambia la autoridad de aprobación de la CLI.
- La rotación y revocación de tokens permanecen dentro del conjunto de roles de emparejamiento aprobado y
  la línea base de alcances aprobada para ese dispositivo. Una entrada de token en caché suelta no
  concede un destino de administración de tokens.
- Para sesiones con token de dispositivo emparejado, la administración entre dispositivos es solo para administradores:
  `remove`, `rotate` y `revoke` son solo propios salvo que el llamador tenga
  `operator.admin`.
- La mutación de tokens también está contenida por el alcance del llamador: una sesión solo de emparejamiento no puede
  rotar ni revocar un token que actualmente lleve `operator.admin` u
  `operator.write`.
- `devices clear` está protegido intencionalmente por `--yes`.
- Si el alcance de emparejamiento no está disponible en local loopback (y no se pasa ningún `--url` explícito), list/approve puede usar una alternativa local de emparejamiento.
- `devices approve` requiere un ID de solicitud explícito antes de emitir tokens; omitir `requestId` o pasar `--latest` solo previsualiza la solicitud pendiente más reciente.

## Lista de comprobación para recuperar deriva de tokens

Usa esto cuando la interfaz de control u otros clientes sigan fallando con `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` o `AUTH_SCOPE_MISMATCH`.

1. Confirma la fuente actual del token del Gateway:

```bash
openclaw config get gateway.auth.token
```

2. Enumera los dispositivos emparejados e identifica el ID del dispositivo afectado:

```bash
openclaw devices list
```

3. Rota el token de operador del dispositivo afectado:

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

- La precedencia normal de autenticación en reconexión es primero token/contraseña compartido explícito, luego `deviceToken` explícito, luego token de dispositivo almacenado y luego token de arranque.
- La recuperación confiable de `AUTH_TOKEN_MISMATCH` puede enviar temporalmente tanto el token compartido como el token de dispositivo almacenado juntos para el único reintento acotado.
- `AUTH_SCOPE_MISMATCH` significa que el token de dispositivo fue reconocido, pero no lleva el conjunto de alcances solicitado; corrige el contrato de aprobación de emparejamiento/alcance antes de cambiar la autenticación compartida del Gateway.

Relacionado:

- [Solución de problemas de autenticación del panel](/es/web/dashboard#if-you-see-unauthorized-1008)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Nodos](/es/nodes)
