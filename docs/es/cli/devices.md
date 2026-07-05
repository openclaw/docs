---
read_when:
    - Estás aprobando solicitudes de emparejamiento de dispositivos
    - Necesitas rotar o revocar tokens de dispositivo
summary: Referencia de CLI para `openclaw devices` (emparejamiento de dispositivos + rotación/revocación de tokens)
title: Dispositivos
x-i18n:
    generated_at: "2026-07-05T11:06:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d6233acac966b3fd83618935e732366a40650503cb2e21b347e93be3e1ce5d5
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Gestiona solicitudes de emparejamiento de dispositivos y tokens con alcance de dispositivo.

## Opciones comunes

- `--url <url>`: URL de WebSocket del Gateway (usa `gateway.remote.url` de forma predeterminada cuando está configurada)
- `--token <token>`: token del Gateway (si se requiere)
- `--password <password>`: contraseña del Gateway (autenticación con contraseña)
- `--timeout <ms>`: tiempo de espera de RPC
- `--json`: salida JSON (recomendado para scripting)

<Warning>
Cuando estableces `--url`, la CLI no recurre a credenciales de configuración ni de entorno. Pasa `--token` o `--password` explícitamente, o el comando dará error.
</Warning>

## Comandos

### `openclaw devices list`

Lista las solicitudes de emparejamiento pendientes y los dispositivos emparejados.

```bash
openclaw devices list
openclaw devices list --json
```

Para una solicitud pendiente en un dispositivo ya emparejado, la salida muestra el acceso solicitado junto al acceso aprobado actual del dispositivo, por lo que las ampliaciones de alcance/rol son visibles en lugar de parecer un emparejamiento perdido.

### `openclaw devices approve [requestId] [--latest]`

Aprueba una solicitud de emparejamiento pendiente por `requestId` exacto. Omitir `requestId`, o pasar `--latest`, solo muestra una vista previa de la solicitud pendiente más reciente y sale (código 1); vuelve a ejecutar con el ID exacto de la solicitud para aprobarla.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
Si un dispositivo reintenta el emparejamiento con detalles de autenticación cambiados (rol, alcances o clave pública), OpenClaw reemplaza la entrada pendiente anterior con un nuevo `requestId`. Ejecuta `openclaw devices list` justo antes de aprobar para obtener el ID actual.
</Note>

Comportamiento de aprobación:

- Si el dispositivo ya está emparejado y solicita alcances o un rol más amplios, OpenClaw conserva la aprobación existente y crea una nueva solicitud pendiente de ampliación. Compara `Requested` frente a `Approved` en `openclaw devices list`, o previsualiza con `--latest`, antes de aprobar.
- Aprobar un rol `node` u otro rol no operador requiere `operator.admin`. `operator.pairing` es suficiente para aprobaciones de dispositivos de operador, pero solo cuando los alcances de operador solicitados permanecen dentro de los alcances propios del llamador. Consulta [Alcances de operador](/es/gateway/operator-scopes).
- Si `gateway.nodes.pairing.autoApproveCidrs` está configurado, las solicitudes iniciales `role: node` desde IPs de cliente coincidentes pueden aprobarse automáticamente antes de aparecer en esta lista. Deshabilitado de forma predeterminada; nunca se aplica a clientes operador/navegador ni a solicitudes de ampliación.

### `openclaw devices reject <requestId>`

Rechaza una solicitud pendiente de emparejamiento de dispositivo.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

Elimina una entrada de dispositivo emparejado.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

Un llamador autenticado con un token de dispositivo emparejado solo puede eliminar la entrada de su **propio** dispositivo. Eliminar otro dispositivo requiere `operator.admin`.

### `openclaw devices clear --yes [--pending]`

Borra dispositivos emparejados en bloque. Protegido por `--yes`.

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` también rechaza todas las solicitudes de emparejamiento pendientes.

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rota un token de dispositivo para un rol, actualizando opcionalmente sus alcances.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- El rol de destino ya debe existir en el contrato de emparejamiento aprobado de ese dispositivo; la rotación no puede emitir un nuevo rol no aprobado.
- Omitir `--scope` reutiliza los alcances aprobados almacenados en caché del token guardado en reconexiones posteriores. Pasar valores `--scope` explícitos reemplaza el conjunto de alcances almacenado para futuras reconexiones con token en caché.
- Un llamador de dispositivo emparejado sin privilegios de administrador solo puede rotar el token de su **propio** dispositivo, y el conjunto de alcances de destino debe permanecer dentro de los alcances de operador propios del llamador; la rotación no puede emitir ni conservar un token más amplio que el que el llamador ya tiene.

Devuelve metadatos de rotación como JSON. Si el llamador rota su propio token mientras está autenticado con ese token de dispositivo, la respuesta incluye el token de reemplazo para que el cliente pueda persistirlo antes de reconectarse. Las rotaciones compartidas/de administrador nunca muestran el bearer token.

### `openclaw devices revoke --device <id> --role <role>`

Revoca un token de dispositivo para un rol.

```bash
openclaw devices revoke --device <deviceId> --role node
```

Un llamador de dispositivo emparejado sin privilegios de administrador solo puede revocar el token de su **propio** dispositivo. Revocar el token de otro dispositivo requiere `operator.admin`. El conjunto de alcances de destino también debe encajar dentro de los alcances de operador propios del llamador; los llamadores solo con emparejamiento no pueden revocar tokens de operador de administrador/escritura.

## Notas

- Estos comandos requieren el alcance `operator.pairing` (o `operator.admin`). Los roles de dispositivo no operador siempre requieren `operator.admin`; consulta [Alcances de operador](/es/gateway/operator-scopes).
- La rotación y revocación de tokens permanecen dentro del conjunto de roles de emparejamiento aprobado del dispositivo y la línea base de alcances. Una entrada de token en caché suelta no concede un destino de gestión de tokens.
- Para sesiones con token de dispositivo emparejado, la gestión entre dispositivos (`remove`, `rotate`, `revoke`) se limita al propio dispositivo salvo que el llamador tenga `operator.admin`.
- La rotación de tokens devuelve un nuevo token (sensible): trátalo como un secreto.
- Si el alcance de emparejamiento no está disponible en local loopback y no se pasa ningún `--url` explícito, `list`/`approve` puede recurrir al estado de emparejamiento local.

## Lista de verificación para recuperación de deriva de tokens

Usa esto cuando Control UI u otros clientes sigan fallando con `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` o `AUTH_SCOPE_MISMATCH`.

1. Confirma la fuente actual del token del Gateway:

   ```bash
   openclaw config get gateway.auth.token
   ```

2. Lista los dispositivos emparejados e identifica el ID del dispositivo afectado:

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

5. Reintenta la conexión del cliente con el token/contraseña compartidos actuales.

Notas:

- Precedencia normal de autenticación al reconectar: token/contraseña compartidos explícitos primero, luego `deviceToken` explícito, luego token de dispositivo almacenado, luego token de arranque.
- La recuperación confiable de `AUTH_TOKEN_MISMATCH` puede enviar temporalmente tanto el token compartido como el token de dispositivo almacenado juntos para un único reintento acotado.
- `AUTH_SCOPE_MISMATCH` significa que el token de dispositivo fue reconocido, pero no lleva el conjunto de alcances solicitado; corrige el contrato de aprobación de emparejamiento/alcances antes de cambiar la autenticación compartida del Gateway.

Relacionado:

- [Solución de problemas de autenticación del Dashboard](/es/web/dashboard#if-you-see-unauthorized-1008)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Aprobación de primera ejecución de Paperclip / `openclaw_gateway`

Los agentes de Paperclip que se conectan mediante el adaptador `openclaw_gateway` pasan por la misma aprobación de emparejamiento de dispositivo de primera ejecución que cualquier otro cliente nuevo. Si Paperclip informa `openclaw_gateway_pairing_required`, aprueba el dispositivo pendiente y reintenta.

```bash
openclaw devices approve --latest
```

La vista previa imprime el comando exacto `openclaw devices approve <requestId>`; verifica los detalles y luego vuelve a ejecutar ese comando con el ID de solicitud para aprobarlo. Para un gateway remoto o credenciales explícitas, pasa las mismas opciones al previsualizar y aprobar:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Para evitar volver a aprobar después de cada reinicio, configura un `adapterConfig.devicePrivateKeyPem` persistente en Paperclip en lugar de dejar que genere una nueva identidad de dispositivo efímera en cada ejecución:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Si la aprobación sigue fallando, ejecuta primero `openclaw devices list` para confirmar que existe una solicitud pendiente.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Nodos](/es/nodes)
