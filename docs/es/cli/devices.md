---
read_when:
    - Estás aprobando solicitudes de emparejamiento de dispositivos
    - Necesitas rotar o revocar tokens de dispositivos
summary: Referencia de CLI para `openclaw devices` (emparejamiento de dispositivos + rotación/revocación de tokens)
title: dispositivos
x-i18n:
    generated_at: "2026-04-23T14:00:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e58d2dff7fc22a11ff372f4937907977dab0ffa9f971b9c0bffeb3e347caf66
    source_path: cli/devices.md
    workflow: 15
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
aprobado actualmente del dispositivo cuando el dispositivo ya está emparejado. Esto hace
explícitas las ampliaciones de ámbito/rol en lugar de parecer que se perdió el emparejamiento.

### `openclaw devices remove <deviceId>`

Elimina una entrada de dispositivo emparejado.

Cuando estás autenticado con un token de dispositivo emparejado, las llamadas sin privilegios de administrador
solo pueden eliminar la entrada de **su propio** dispositivo. Eliminar otro dispositivo requiere
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Elimina en bloque los dispositivos emparejados.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Aprueba una solicitud pendiente de emparejamiento de dispositivo mediante `requestId` exacto. Si se omite `requestId`
o se pasa `--latest`, OpenClaw solo imprime la solicitud pendiente seleccionada
y sale; vuelve a ejecutar la aprobación con el ID exacto de la solicitud después de verificar
los detalles.

Nota: si un dispositivo vuelve a intentar el emparejamiento con detalles de autenticación cambiados (rol/ámbitos/clave
pública), OpenClaw sustituye la entrada pendiente anterior y emite un nuevo
`requestId`. Ejecuta `openclaw devices list` justo antes de aprobar para usar el
ID actual.

Si el dispositivo ya está emparejado y solicita ámbitos más amplios o un rol más amplio,
OpenClaw mantiene la aprobación existente y crea una nueva solicitud pendiente de ampliación.
Revisa las columnas `Requested` frente a `Approved` en `openclaw devices list`
o usa `openclaw devices approve --latest` para previsualizar la ampliación exacta antes de
aprobarla.

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

Rota un token de dispositivo para un rol específico (opcionalmente actualizando los ámbitos).
El rol de destino ya debe existir en el contrato de emparejamiento aprobado de ese dispositivo;
la rotación no puede emitir un rol nuevo no aprobado.
Si omites `--scope`, las reconexiones posteriores con el token rotado almacenado reutilizan los
ámbitos aprobados en caché de ese token. Si pasas valores `--scope` explícitos, esos
se convierten en el conjunto de ámbitos almacenado para futuras reconexiones con token en caché.
Las llamadas sin privilegios de administrador desde dispositivos emparejados solo pueden rotar el token de **su propio** dispositivo.
Además, cualquier valor `--scope` explícito debe permanecer dentro de los propios
ámbitos de operador de la sesión que llama; la rotación no puede emitir un token de operador más amplio que el que el llamante ya tiene.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Devuelve la nueva carga útil del token como JSON.

### `openclaw devices revoke --device <id> --role <role>`

Revoca un token de dispositivo para un rol específico.

Las llamadas sin privilegios de administrador desde dispositivos emparejados solo pueden revocar el token de **su propio** dispositivo.
Revocar el token de otro dispositivo requiere `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Devuelve el resultado de la revocación como JSON.

## Opciones comunes

- `--url <url>`: URL del WebSocket del Gateway (usa por defecto `gateway.remote.url` cuando está configurado).
- `--token <token>`: token del Gateway (si es necesario).
- `--password <password>`: contraseña del Gateway (autenticación por contraseña).
- `--timeout <ms>`: tiempo de espera de RPC.
- `--json`: salida JSON (recomendado para scripts).

Nota: cuando estableces `--url`, la CLI no recurre a las credenciales de configuración ni de entorno.
Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.

## Notas

- La rotación de token devuelve un token nuevo (sensible). Trátalo como un secreto.
- Estos comandos requieren el ámbito `operator.pairing` (o `operator.admin`).
- La rotación de tokens permanece dentro del conjunto de roles aprobados del emparejamiento y de la línea base
  de ámbitos aprobados para ese dispositivo. Una entrada aislada de token en caché no concede un
  nuevo objetivo de rotación.
- Para sesiones con token de dispositivo emparejado, la gestión entre dispositivos es solo para administradores:
  `remove`, `rotate` y `revoke` son solo para uno mismo, a menos que el llamante tenga
  `operator.admin`.
- `devices clear` está intencionadamente protegido por `--yes`.
- Si el ámbito de emparejamiento no está disponible en local loopback (y no se pasa `--url` explícito), `list`/`approve` pueden usar una alternativa local de emparejamiento.
- `devices approve` requiere un ID de solicitud explícito antes de emitir tokens; omitir `requestId` o pasar `--latest` solo previsualiza la solicitud pendiente más reciente.

## Lista de comprobación para recuperación de deriva de tokens

Usa esto cuando la interfaz de Control u otros clientes sigan fallando con `AUTH_TOKEN_MISMATCH` o `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirma la fuente actual del token del Gateway:

```bash
openclaw config get gateway.auth.token
```

2. Lista los dispositivos emparejados e identifica el id del dispositivo afectado:

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

5. Reintenta la conexión del cliente con el token/contraseña compartidos actuales.

Notas:

- La precedencia normal de autenticación de reconexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, después token de dispositivo almacenado y finalmente token de arranque.
- La recuperación de confianza de `AUTH_TOKEN_MISMATCH` puede enviar temporalmente tanto el token compartido como el token de dispositivo almacenado juntos para un único reintento acotado.

Relacionado:

- [Solución de problemas de autenticación del panel](/es/web/dashboard#if-you-see-unauthorized-1008)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting#dashboard-control-ui-connectivity)
