---
read_when:
    - Estás aprobando solicitudes de vinculación de dispositivos
    - Necesitas rotar o revocar los tokens de dispositivo
summary: Referencia de la CLI para `openclaw devices` (emparejamiento de dispositivos + rotación/revocación de tokens)
title: Dispositivos
x-i18n:
    generated_at: "2026-07-11T22:55:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Gestiona las solicitudes de emparejamiento de dispositivos y los tokens específicos de cada dispositivo.

## Opciones comunes

- `--url <url>`: URL de WebSocket del Gateway (el valor predeterminado es `gateway.remote.url` cuando está configurado)
- `--token <token>`: token del Gateway (si es obligatorio)
- `--password <password>`: contraseña del Gateway (autenticación mediante contraseña)
- `--timeout <ms>`: tiempo de espera de RPC
- `--json`: salida JSON (recomendada para scripts)

<Warning>
Cuando se establece `--url`, la CLI no recurre a las credenciales de la configuración ni del entorno. Pasa `--token` o `--password` explícitamente; de lo contrario, el comando genera un error.
</Warning>

## Comandos

### `openclaw devices list`

Enumera las solicitudes de emparejamiento pendientes y los dispositivos emparejados.

```bash
openclaw devices list
openclaw devices list --json
```

En el caso de una solicitud pendiente de un dispositivo ya emparejado, la salida muestra el acceso solicitado junto al acceso aprobado actualmente para el dispositivo, de modo que las ampliaciones de ámbitos o roles sean visibles en lugar de parecer un emparejamiento perdido.

Los nombres para mostrar de los dispositivos emparejados usan este orden de precedencia: etiqueta del operador (`operatorLabel` de `devices rename`), después `displayName` del cliente, después `clientId` y, por último, `deviceId`.

### `openclaw devices approve [requestId] [--latest]`

Aprueba una solicitud de emparejamiento pendiente mediante el `requestId` exacto. Si se omite `requestId` o se pasa `--latest`, solo se muestra una vista previa de la solicitud pendiente más reciente y se sale (código 1); vuelve a ejecutar el comando con el ID exacto de la solicitud para aprobarla.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
Si un dispositivo vuelve a intentar el emparejamiento con datos de autenticación modificados (rol, ámbitos o clave pública), OpenClaw sustituye la entrada pendiente anterior por un nuevo `requestId`. Ejecuta `openclaw devices list` justo antes de la aprobación para obtener el ID actual.
</Note>

Comportamiento de la aprobación:

- Si el dispositivo ya está emparejado y solicita ámbitos más amplios u otro rol, OpenClaw conserva la aprobación existente y crea una nueva solicitud de ampliación pendiente. Compara `Requested` con `Approved` en `openclaw devices list`, o muestra una vista previa con `--latest`, antes de aprobar.
- Aprobar un rol `node` u otro rol que no sea de operador requiere `operator.admin`. `operator.pairing` es suficiente para aprobar dispositivos de operador, pero solo cuando los ámbitos de operador solicitados se mantienen dentro de los ámbitos propios del solicitante. Consulta [Ámbitos del operador](/es/gateway/operator-scopes).
- Si `gateway.nodes.pairing.autoApproveCidrs` está configurado, las solicitudes iniciales con `role: node` provenientes de direcciones IP de cliente coincidentes pueden aprobarse automáticamente antes de aparecer en esta lista. Está desactivado de forma predeterminada y nunca se aplica a clientes de operador/navegador ni a solicitudes de ampliación.
- `gateway.nodes.pairing.sshVerify` (activado de forma predeterminada) aprueba automáticamente las solicitudes iniciales con `role: node` cuando el Gateway verifica la clave del dispositivo mediante SSH en el host del nodo. Por tanto, las solicitudes pueden pasar a estar aprobadas poco después de aparecer. Establece `sshVerify: false` para desactivar la verificación mediante SSH; esta opción es independiente de `autoApproveCidrs`, por lo que también debes desactivar esta última para permitir únicamente el emparejamiento manual.

### `openclaw devices reject <requestId>`

Rechaza una solicitud de emparejamiento de dispositivo pendiente.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

Elimina la entrada de un dispositivo emparejado.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

Un solicitante autenticado con un token de dispositivo emparejado solo puede eliminar la entrada de su **propio** dispositivo. Para eliminar otro dispositivo se requiere `operator.admin`.

### `openclaw devices rename --device <id> --name <label>`

Asigna una etiqueta de operador a un dispositivo emparejado. Las etiquetas son un estado del lado del propietario: se conservan tras las reparaciones del emparejamiento y las reaprobaciones de roles, y no cambian el `deviceId` estable.

```bash
openclaw devices rename --device <deviceId> --name "Kitchen Mac"
openclaw devices rename --device <deviceId> --name "Kitchen Mac" --json
```

- `--name` es obligatorio, se recorta, no puede estar vacío y tiene un límite de 64 caracteres.
- Las superficies de visualización (la lista de la CLI y el inventario de la interfaz de control) dan preferencia a la etiqueta del operador sobre el nombre para mostrar informado por el cliente.
- Un solicitante de dispositivo emparejado que no sea administrador solo puede cambiar el nombre de su **propio** dispositivo. Para cambiar el nombre de otro dispositivo se requiere `operator.admin`.

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

- El rol de destino ya debe existir en el contrato de emparejamiento aprobado de ese dispositivo; la rotación no puede emitir un rol nuevo que no esté aprobado.
- Si se omite `--scope`, en reconexiones posteriores se reutilizan los ámbitos aprobados almacenados en caché del token guardado. Al pasar valores `--scope` explícitos, se sustituye el conjunto de ámbitos almacenado para futuras reconexiones mediante tokens en caché.
- Un solicitante de dispositivo emparejado que no sea administrador solo puede rotar el token de su **propio** dispositivo, y el conjunto de ámbitos de destino debe mantenerse dentro de los ámbitos de operador propios del solicitante; la rotación no puede emitir ni conservar un token con más privilegios que los que ya posee el solicitante.

Devuelve los metadatos de rotación como JSON. Si el solicitante rota su propio token mientras está autenticado con ese token de dispositivo, la respuesta incluye el token de sustitución para que el cliente pueda conservarlo antes de volver a conectarse. Las rotaciones compartidas o de administrador nunca incluyen el token de portador.

### `openclaw devices revoke --device <id> --role <role>`

Revoca el token de un dispositivo para un rol.

```bash
openclaw devices revoke --device <deviceId> --role node
```

Un solicitante de dispositivo emparejado que no sea administrador solo puede revocar el token de su **propio** dispositivo. Para revocar el token de otro dispositivo se requiere `operator.admin`. El conjunto de ámbitos de destino también debe estar dentro de los ámbitos de operador propios del solicitante; quienes solo tienen permisos de emparejamiento no pueden revocar tokens de operador con permisos de administración o escritura.

## Notas

- Estos comandos requieren el ámbito `operator.pairing` (u `operator.admin`). Los roles de dispositivo que no sean de operador siempre requieren `operator.admin`; consulta [Ámbitos del operador](/es/gateway/operator-scopes).
- La rotación y la revocación de tokens se mantienen dentro del conjunto de roles de emparejamiento aprobados del dispositivo y de su conjunto de ámbitos de referencia. Una entrada aislada de un token en caché no concede un objetivo de administración de tokens.
- En las sesiones con tokens de dispositivos emparejados, la administración entre dispositivos (`remove`, `rename`, `rotate`, `revoke`) se limita al propio dispositivo, salvo que el solicitante tenga `operator.admin`.
- La rotación de tokens devuelve un token nuevo (confidencial); trátalo como un secreto.
- Si el ámbito de emparejamiento no está disponible en local loopback y no se pasa un `--url` explícito, `list`/`approve` pueden recurrir al estado de emparejamiento local.

## Lista de comprobación para recuperarse de la divergencia de tokens

Utiliza estos pasos cuando la interfaz de control u otros clientes sigan fallando con `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` o `AUTH_SCOPE_MISMATCH`.

1. Confirma el origen actual del token del Gateway:

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

4. Si la rotación no es suficiente, elimina el emparejamiento obsoleto y vuelve a aprobarlo:

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. Vuelve a intentar la conexión del cliente con el token o la contraseña compartidos actuales.

Notas:

- Precedencia normal de autenticación durante la reconexión: primero el token o la contraseña compartidos explícitos, después el `deviceToken` explícito, después el token de dispositivo almacenado y, por último, el token de arranque.
- La recuperación de confianza tras `AUTH_TOKEN_MISMATCH` puede enviar temporalmente el token compartido y el token de dispositivo almacenado juntos durante un único reintento limitado.
- `AUTH_SCOPE_MISMATCH` significa que se reconoció el token del dispositivo, pero este no contiene el conjunto de ámbitos solicitado; corrige el contrato de aprobación del emparejamiento o de los ámbitos antes de cambiar la autenticación compartida del Gateway.

Relacionado:

- [Solución de problemas de autenticación del panel de control](/es/web/dashboard#if-you-see-unauthorized-1008)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Aprobación inicial de Paperclip / `openclaw_gateway`

Los agentes de Paperclip que se conectan mediante el adaptador `openclaw_gateway` pasan por la misma aprobación de emparejamiento de dispositivo durante la primera ejecución que cualquier otro cliente nuevo. Si Paperclip informa de `openclaw_gateway_pairing_required`, aprueba el dispositivo pendiente y vuelve a intentarlo.

```bash
openclaw devices approve --latest
```

La vista previa muestra el comando `openclaw devices approve <requestId>` exacto; verifica los detalles y vuelve a ejecutar ese comando con el ID de la solicitud para aprobarla. Para un Gateway remoto o credenciales explícitas, pasa las mismas opciones al mostrar la vista previa y al aprobar:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Para evitar tener que volver a aprobar después de cada reinicio, configura un `adapterConfig.devicePrivateKeyPem` persistente en Paperclip en lugar de permitir que genere una identidad de dispositivo efímera nueva en cada ejecución:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Si la aprobación sigue fallando, ejecuta primero `openclaw devices list` para confirmar que existe una solicitud pendiente.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Nodos](/es/nodes)
