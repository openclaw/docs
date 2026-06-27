---
read_when:
    - Estás aprobando solicitudes de emparejamiento de dispositivos
    - Debe rotar o revocar los tokens de dispositivo
summary: Referencia de la CLI para `openclaw devices` (emparejamiento de dispositivos + rotación/revocación de tokens)
title: Dispositivos
x-i18n:
    generated_at: "2026-06-27T10:58:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08d6945af4fa2403a97dfec94af7bbd0dc746efe90d3e5b4c9f5c5d6d27d70a4
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
aprobado actual del dispositivo cuando el dispositivo ya está emparejado. Esto
hace explícitas las ampliaciones de alcance/rol en lugar de parecer que se perdió el emparejamiento.

### `openclaw devices remove <deviceId>`

Elimina una entrada de dispositivo emparejado.

Cuando estás autenticado con un token de dispositivo emparejado, los llamadores que no son administradores pueden
eliminar solo la entrada de **su propio** dispositivo. Eliminar otro dispositivo requiere
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

<Note>
Si un dispositivo vuelve a intentar el emparejamiento con detalles de autenticación modificados (rol, alcances o clave pública), OpenClaw reemplaza la entrada pendiente anterior y emite un nuevo `requestId`. Ejecuta `openclaw devices list` justo antes de aprobar para usar el ID actual.
</Note>

Si el dispositivo ya está emparejado y solicita alcances más amplios o un rol más amplio,
OpenClaw mantiene la aprobación existente y crea una nueva solicitud pendiente de ampliación.
Revisa las columnas `Requested` y `Approved` en `openclaw devices list`
o usa `openclaw devices approve --latest` para previsualizar la ampliación exacta antes de
aprobarla.

Si el Gateway está configurado explícitamente con
`gateway.nodes.pairing.autoApproveCidrs`, las solicitudes iniciales `role: node` desde
IP de cliente coincidentes pueden aprobarse antes de aparecer en esta lista. Esa política
está deshabilitada de forma predeterminada y nunca se aplica a clientes operador/navegador ni a solicitudes de
ampliación.

Aprobar roles de dispositivo node u otros roles de dispositivo no operador requiere `operator.admin`.
`operator.pairing` basta para aprobaciones de dispositivos de operador solo cuando los
alcances de operador solicitados permanecen dentro de los propios alcances del llamador. Consulta
[Alcances de operador](/es/gateway/operator-scopes) para las comprobaciones en el momento de aprobación.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

## Aprobación de primera ejecución de Paperclip / `openclaw_gateway`

Cuando un nuevo agente de Paperclip se conecta mediante el adaptador `openclaw_gateway` por primera vez, el Gateway puede requerir una aprobación única de emparejamiento de dispositivo antes de que las ejecuciones puedan completarse correctamente. Si Paperclip informa `openclaw_gateway_pairing_required`, aprueba el dispositivo pendiente y vuelve a intentarlo.

Para gateways locales, previsualiza la solicitud pendiente más reciente:

```bash
openclaw devices approve --latest
```

La previsualización imprime el comando exacto `openclaw devices approve <requestId>`. Verifica los detalles de la solicitud y luego vuelve a ejecutar ese comando con el ID de solicitud para aprobarla.

Para gateways remotos o credenciales explícitas, pasa las mismas opciones al previsualizar y aprobar:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Para evitar volver a aprobar después de reinicios, conserva una clave de dispositivo persistente en la configuración del adaptador Paperclip en lugar de generar una nueva identidad efímera en cada ejecución:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Si la aprobación sigue fallando, ejecuta primero `openclaw devices list` para confirmar que existe una solicitud pendiente.

### `openclaw devices reject <requestId>`

Rechaza una solicitud pendiente de emparejamiento de dispositivo.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rota un token de dispositivo para un rol específico (opcionalmente actualizando alcances).
El rol de destino ya debe existir en el contrato de emparejamiento aprobado de ese dispositivo;
la rotación no puede emitir un nuevo rol no aprobado.
Si omites `--scope`, las reconexiones posteriores con el token rotado almacenado reutilizan los
alcances aprobados en caché de ese token. Si pasas valores `--scope` explícitos, estos
se convierten en el conjunto de alcances almacenado para futuras reconexiones con token en caché.
Los llamadores con dispositivo emparejado que no son administradores pueden rotar solo el token de **su propio** dispositivo.
El conjunto de alcances del token de destino debe permanecer dentro de los propios alcances de operador
de la sesión del llamador; la rotación no puede emitir ni conservar un token de operador más amplio que el que
ya tiene el llamador.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Devuelve metadatos de rotación como JSON. Si el llamador está rotando su propio token mientras
está autenticado con ese token de dispositivo, la respuesta también incluye el token de reemplazo
para que el cliente pueda conservarlo antes de reconectarse. Las rotaciones compartidas/de administrador
no devuelven el bearer token.

### `openclaw devices revoke --device <id> --role <role>`

Revoca un token de dispositivo para un rol específico.

Los llamadores con dispositivo emparejado que no son administradores pueden revocar solo el token de **su propio** dispositivo.
Revocar el token de otro dispositivo requiere `operator.admin`.
El conjunto de alcances del token de destino también debe encajar dentro de los propios
alcances de operador de la sesión del llamador; los llamadores solo de emparejamiento no pueden revocar tokens de operador admin/write.

```
openclaw devices revoke --device <deviceId> --role node
```

Devuelve el resultado de revocación como JSON.

## Opciones comunes

- `--url <url>`: URL WebSocket del Gateway (por defecto usa `gateway.remote.url` cuando está configurada).
- `--token <token>`: token del Gateway (si es necesario).
- `--password <password>`: contraseña del Gateway (autenticación por contraseña).
- `--timeout <ms>`: tiempo de espera de RPC.
- `--json`: salida JSON (recomendada para scripting).

<Warning>
Cuando estableces `--url`, la CLI no recurre a credenciales de configuración ni de entorno. Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.
</Warning>

## Notas

- La rotación de token devuelve un nuevo token (sensible). Trátalo como un secreto.
- Estos comandos requieren el alcance `operator.pairing` (o `operator.admin`). Algunas
  aprobaciones también requieren que el llamador tenga los alcances de operador que el dispositivo de destino
  emitiría o heredaría. Los roles de dispositivo no operador requieren
  `operator.admin`; consulta [Alcances de operador](/es/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` es una política opcional del Gateway solo para
  emparejamiento de dispositivos node nuevos; no cambia la autoridad de aprobación de la CLI.
- La rotación y revocación de tokens permanecen dentro del conjunto de roles de emparejamiento aprobado y
  la línea base de alcances aprobada para ese dispositivo. Una entrada de token en caché aislada no
  otorga un destino de gestión de tokens.
- Para sesiones con token de dispositivo emparejado, la gestión entre dispositivos es solo para administradores:
  `remove`, `rotate` y `revoke` son solo para el propio dispositivo salvo que el llamador tenga
  `operator.admin`.
- La mutación de tokens también está contenida por los alcances del llamador: una sesión solo de emparejamiento no puede
  rotar ni revocar un token que actualmente lleva `operator.admin` u
  `operator.write`.
- `devices clear` está protegido intencionadamente por `--yes`.
- Si el alcance de emparejamiento no está disponible en local loopback (y no se pasa ningún `--url` explícito), list/approve puede usar una alternativa local de emparejamiento.
- `devices approve` requiere un ID de solicitud explícito antes de emitir tokens; omitir `requestId` o pasar `--latest` solo previsualiza la solicitud pendiente más reciente.

## Lista de comprobación para recuperación de deriva de tokens

Usa esto cuando Control UI u otros clientes sigan fallando con `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` o `AUTH_SCOPE_MISMATCH`.

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

4. Si la rotación no basta, elimina el emparejamiento obsoleto y aprueba de nuevo:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Reintenta la conexión del cliente con el token/contraseña compartidos actuales.

Notas:

- La precedencia normal de autenticación en reconexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado y luego token de arranque.
- La recuperación de `AUTH_TOKEN_MISMATCH` de confianza puede enviar temporalmente juntos tanto el token compartido como el token de dispositivo almacenado para el único reintento delimitado.
- `AUTH_SCOPE_MISMATCH` significa que el token de dispositivo fue reconocido pero no lleva el conjunto de alcances solicitado; corrige el contrato de aprobación de emparejamiento/alcances antes de cambiar la autenticación compartida del gateway.

Relacionado:

- [Solución de problemas de autenticación del panel](/es/web/dashboard#if-you-see-unauthorized-1008)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Nodos](/es/nodes)
