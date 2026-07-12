---
read_when:
    - Está aprobando solicitudes de emparejamiento de dispositivos
    - Debe rotar o revocar los tokens de dispositivo
summary: Referencia de la CLI para `openclaw devices` (emparejamiento de dispositivos + rotación/revocación de tokens)
title: Dispositivos
x-i18n:
    generated_at: "2026-07-12T14:22:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Gestiona las solicitudes de emparejamiento de dispositivos y los tokens específicos de cada dispositivo.

## Opciones comunes

- `--url <url>`: URL de WebSocket del Gateway (de forma predeterminada, usa `gateway.remote.url` cuando está configurado)
- `--token <token>`: token del Gateway (si es necesario)
- `--password <password>`: contraseña del Gateway (autenticación mediante contraseña)
- `--timeout <ms>`: tiempo de espera de RPC
- `--json`: salida JSON (recomendada para scripts)

<Warning>
Cuando se establece `--url`, la CLI no recurre a las credenciales de la configuración ni del entorno. Se debe proporcionar `--token` o `--password` explícitamente; de lo contrario, el comando genera un error.
</Warning>

## Comandos

### `openclaw devices list`

Enumera las solicitudes de emparejamiento pendientes y los dispositivos emparejados.

```bash
openclaw devices list
openclaw devices list --json
```

En el caso de una solicitud pendiente de un dispositivo ya emparejado, la salida muestra el acceso solicitado junto al acceso aprobado actualmente para el dispositivo, de modo que las ampliaciones de ámbitos o roles sean visibles en lugar de parecer un emparejamiento perdido.

Los nombres para mostrar de los dispositivos emparejados usan esta precedencia: etiqueta del operador (`operatorLabel` de `devices rename`), luego `displayName` del cliente, luego `clientId` y, por último, `deviceId`.

### `openclaw devices approve [requestId] [--latest]`

Aprueba una solicitud de emparejamiento pendiente mediante el `requestId` exacto. Si se omite `requestId` o se proporciona `--latest`, solo se muestra una vista previa de la solicitud pendiente más reciente y se finaliza (código 1); se debe volver a ejecutar el comando con el ID exacto de la solicitud para aprobarla.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
Si un dispositivo vuelve a intentar el emparejamiento con datos de autenticación modificados (rol, ámbitos o clave pública), OpenClaw sustituye la entrada pendiente anterior por un nuevo `requestId`. Se debe ejecutar `openclaw devices list` justo antes de la aprobación para obtener el ID actual.
</Note>

Comportamiento de la aprobación:

- Si el dispositivo ya está emparejado y solicita ámbitos más amplios u otro rol, OpenClaw conserva la aprobación existente y crea una nueva solicitud de ampliación pendiente. Antes de aprobarla, se debe comparar `Requested` con `Approved` en `openclaw devices list` o consultar una vista previa con `--latest`.
- La aprobación de un rol `node` o de cualquier otro rol que no sea de operador requiere `operator.admin`. `operator.pairing` es suficiente para aprobar dispositivos de operador, pero solo cuando los ámbitos de operador solicitados se mantienen dentro de los ámbitos del propio solicitante. Véase [Ámbitos del operador](/es/gateway/operator-scopes).
- Si `gateway.nodes.pairing.autoApproveCidrs` está configurado, las primeras solicitudes con `role: node` procedentes de direcciones IP de clientes coincidentes pueden aprobarse automáticamente antes de aparecer en esta lista. Está deshabilitado de forma predeterminada; nunca se aplica a clientes de operador o navegador ni a solicitudes de ampliación.
- `gateway.nodes.pairing.sshVerify` (activado de forma predeterminada) aprueba automáticamente las primeras solicitudes con `role: node` cuando el Gateway verifica mediante SSH la clave del dispositivo en el host del nodo. Por tanto, las solicitudes pueden pasar al estado aprobado poco después de aparecer. Se debe establecer `sshVerify: false` para deshabilitar la verificación mediante SSH; esta opción es independiente de `autoApproveCidrs`, por lo que también se debe desactivar esa opción para que el emparejamiento sea exclusivamente manual.

### `openclaw devices reject <requestId>`

Rechaza una solicitud pendiente de emparejamiento de un dispositivo.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

Elimina una entrada de dispositivo emparejado.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

Un solicitante autenticado con el token de un dispositivo emparejado solo puede eliminar la entrada de su **propio** dispositivo. Para eliminar otro dispositivo se requiere `operator.admin`.

### `openclaw devices rename --device <id> --name <label>`

Asigna una etiqueta de operador a un dispositivo emparejado. Las etiquetas son estado del lado del propietario: se conservan tras las reparaciones del emparejamiento y las nuevas aprobaciones de roles, y no cambian el `deviceId` estable.

```bash
openclaw devices rename --device <deviceId> --name "Mac de la cocina"
openclaw devices rename --device <deviceId> --name "Mac de la cocina" --json
```

- `--name` es obligatorio, se recortan sus espacios iniciales y finales, no puede estar vacío y tiene un límite de 64 caracteres.
- Las superficies de visualización (lista de la CLI, inventario de la interfaz de control) dan preferencia a la etiqueta del operador sobre el nombre para mostrar comunicado por el cliente.
- Un solicitante no administrador autenticado mediante un dispositivo emparejado solo puede cambiar el nombre de su **propio** dispositivo. Para cambiar el nombre de otro dispositivo se requiere `operator.admin`.

### `openclaw devices clear --yes [--pending]`

Borra en bloque los dispositivos emparejados. Requiere `--yes`.

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` también rechaza todas las solicitudes de emparejamiento pendientes.

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rota el token de un dispositivo para un rol y, opcionalmente, actualiza sus ámbitos.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- El rol de destino ya debe existir en el contrato de emparejamiento aprobado de ese dispositivo; la rotación no puede emitir un nuevo rol no aprobado.
- Si se omite `--scope`, en las reconexiones posteriores se reutilizan los ámbitos aprobados almacenados en caché del token guardado. Si se proporcionan valores explícitos de `--scope`, estos sustituyen el conjunto de ámbitos almacenado para futuras reconexiones con el token en caché.
- Un solicitante no administrador autenticado mediante un dispositivo emparejado solo puede rotar el token de su **propio** dispositivo, y el conjunto de ámbitos de destino debe mantenerse dentro de los ámbitos de operador del propio solicitante; la rotación no puede emitir ni conservar un token con más permisos de los que ya tiene el solicitante.

Devuelve los metadatos de la rotación como JSON. Si el solicitante rota su propio token mientras está autenticado con el token de ese dispositivo, la respuesta incluye el token de sustitución para que el cliente pueda conservarlo antes de volver a conectarse. Las rotaciones compartidas o de administrador nunca muestran el token al portador.

### `openclaw devices revoke --device <id> --role <role>`

Revoca el token de un dispositivo para un rol.

```bash
openclaw devices revoke --device <deviceId> --role node
```

Un solicitante no administrador autenticado mediante un dispositivo emparejado solo puede revocar el token de su **propio** dispositivo. Para revocar el token de otro dispositivo se requiere `operator.admin`. El conjunto de ámbitos de destino también debe estar dentro de los ámbitos de operador del propio solicitante; los solicitantes que solo tienen permisos de emparejamiento no pueden revocar tokens de operador con permisos de administración o escritura.

## Notas

- Estos comandos requieren el ámbito `operator.pairing` (o `operator.admin`). Los roles de dispositivo que no sean de operador siempre requieren `operator.admin`; véase [Ámbitos del operador](/es/gateway/operator-scopes).
- La rotación y la revocación de tokens se mantienen dentro del conjunto de roles de emparejamiento aprobado y de la referencia de ámbitos del dispositivo. Una entrada aislada de token en caché no concede acceso a un destino de gestión de tokens.
- En las sesiones con tokens de dispositivos emparejados, la gestión entre dispositivos (`remove`, `rename`, `rotate`, `revoke`) se limita al dispositivo propio, salvo que el solicitante tenga `operator.admin`.
- La rotación de tokens devuelve un token nuevo (confidencial); debe tratarse como un secreto.
- Si el ámbito de emparejamiento no está disponible en la interfaz de bucle invertido local y no se proporciona un valor explícito de `--url`, `list` y `approve` pueden recurrir al estado de emparejamiento local.

## Lista de comprobación para recuperar la sincronización de tokens

Se debe usar este procedimiento cuando la interfaz de control u otros clientes sigan fallando con `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` o `AUTH_SCOPE_MISMATCH`.

1. Confirmar el origen actual del token del Gateway:

   ```bash
   openclaw config get gateway.auth.token
   ```

2. Enumerar los dispositivos emparejados e identificar el ID del dispositivo afectado:

   ```bash
   openclaw devices list
   ```

3. Rotar el token de operador del dispositivo afectado:

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. Si la rotación no es suficiente, eliminar el emparejamiento obsoleto y volver a aprobarlo:

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. Volver a intentar la conexión del cliente con el token o la contraseña compartidos actuales.

Notas:

- Precedencia normal de autenticación al volver a conectarse: primero el token o la contraseña compartidos explícitos, después el `deviceToken` explícito, luego el token de dispositivo almacenado y, por último, el token de arranque.
- La recuperación de confianza de `AUTH_TOKEN_MISMATCH` puede enviar temporalmente el token compartido y el token de dispositivo almacenado juntos durante un único reintento limitado.
- `AUTH_SCOPE_MISMATCH` significa que se reconoció el token del dispositivo, pero no incluye el conjunto de ámbitos solicitado; se debe corregir el contrato de aprobación del emparejamiento o los ámbitos antes de cambiar la autenticación compartida del Gateway.

Relacionado:

- [Solución de problemas de autenticación del panel](/es/web/dashboard#if-you-see-unauthorized-1008)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Aprobación de la primera ejecución de Paperclip / `openclaw_gateway`

Los agentes de Paperclip que se conectan mediante el adaptador `openclaw_gateway` pasan por la misma aprobación inicial de emparejamiento de dispositivos que cualquier otro cliente nuevo. Si Paperclip informa de `openclaw_gateway_pairing_required`, se debe aprobar el dispositivo pendiente y volver a intentarlo.

```bash
openclaw devices approve --latest
```

La vista previa muestra el comando exacto `openclaw devices approve <requestId>`; se deben verificar los detalles y, a continuación, volver a ejecutar ese comando con el ID de la solicitud para aprobarla. Para un Gateway remoto o credenciales explícitas, se deben proporcionar las mismas opciones al obtener la vista previa y al aprobar:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Para evitar tener que volver a aprobar después de cada reinicio, se debe configurar un valor persistente de `adapterConfig.devicePrivateKeyPem` en Paperclip, en lugar de permitir que genere una nueva identidad efímera de dispositivo en cada ejecución:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Si la aprobación sigue fallando, se debe ejecutar primero `openclaw devices list` para confirmar que existe una solicitud pendiente.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Nodos](/es/nodes)
