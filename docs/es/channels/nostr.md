---
read_when:
    - Quieres que OpenClaw reciba mensajes directos mediante Nostr
    - Estás configurando la mensajería descentralizada
summary: Canal de mensajes directos de Nostr mediante mensajes cifrados con NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-07-11T22:55:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr es un plugin de canal descargable (`@openclaw/nostr`) que permite a OpenClaw recibir y responder mensajes directos cifrados con NIP-04 a través de relés de Nostr. Una cuenta por Gateway; solo mensajes directos.

## Instalación

```bash
openclaw plugins install @openclaw/nostr
```

Use la especificación de paquete sin versión para seguir la etiqueta de la versión oficial actual. Fije una versión exacta solo cuando necesite una instalación reproducible.

Desde un repositorio local (flujos de desarrollo):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Reinicie el Gateway después de instalar o habilitar plugins. La incorporación (`openclaw onboard`) y `openclaw channels add` muestran Nostr desde el catálogo de canales compartido una vez instalado el plugin.

### Configuración no interactiva

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Use `--use-env` para mantener `NOSTR_PRIVATE_KEY` en el entorno en lugar de almacenar la clave en la configuración (solo para la cuenta predeterminada).

## Configuración rápida

1. Genere un par de claves de Nostr (si es necesario):

```bash
# Con nak
nak key generate
```

2. Añádalo a la configuración:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Exporte la clave:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Reinicie el Gateway.

## Referencia de configuración

| Clave        | Tipo     | Valor predeterminado                         | Descripción                                                         |
| ------------ | -------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `privateKey` | string   | obligatorio                                  | Clave privada en formato `nsec` o hexadecimal; admite refs de secretos |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']`  | URL de relés (WebSocket)                                            |
| `dmPolicy`   | string   | `pairing`                                    | Política de acceso a mensajes directos                              |
| `allowFrom`  | string[] | `[]`                                         | Claves públicas de remitentes permitidos                            |
| `enabled`    | boolean  | `true`                                       | Habilitar o deshabilitar el canal                                   |
| `name`       | string   | -                                            | Nombre para mostrar                                                 |
| `profile`    | object   | -                                            | Metadatos de perfil NIP-01                                          |

## Metadatos del perfil

Los datos del perfil se publican como un evento NIP-01 `kind:0`. Puede administrarlos desde la interfaz de control (Channels -> Nostr -> Profile) o establecerlos directamente en la configuración.

Ejemplo:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Bot de asistente personal por mensaje directo",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

Notas:

- Las URL de perfil deben usar `https://`.
- Al importar desde relés, se combinan los campos y se conservan las modificaciones locales.

## Control de acceso

### Políticas de mensajes directos

- **emparejamiento** (predeterminado): los remitentes desconocidos reciben un código de emparejamiento.
- **lista de permitidos**: solo las claves públicas de `allowFrom` pueden enviar mensajes directos.
- **abierto**: mensajes directos entrantes públicos (requiere `allowFrom: ["*"]`).
- **deshabilitado**: ignora los mensajes directos entrantes.

Notas sobre la aplicación:

- Las firmas de los eventos entrantes se verifican antes de aplicar la política del remitente y descifrar mediante NIP-04, por lo que los eventos falsificados se rechazan de forma temprana.
- Las respuestas de emparejamiento se envían sin descifrar ni procesar el contenido del mensaje directo original.
- Los mensajes directos entrantes tienen límites de frecuencia (globales y por remitente), y las cargas que exceden el tamaño permitido se descartan antes de descifrarlas.

### Ejemplo de lista de permitidos

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## Formatos de claves

Formatos aceptados:

- **Clave privada:** `nsec...` o hexadecimal de 64 caracteres
- **Claves públicas (`allowFrom`):** `npub...` o hexadecimal

## Relés

Valores predeterminados: `relay.damus.io` y `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

Consejos:

- Use entre 2 y 3 relés para disponer de redundancia.
- Evite usar demasiados relés (latencia y duplicación).
- Los relés de pago pueden mejorar la fiabilidad.
- Los relés locales son adecuados para las pruebas (`ws://localhost:7777`).

## Compatibilidad con protocolos

| NIP    | Estado        | Descripción                                        |
| ------ | ------------- | -------------------------------------------------- |
| NIP-01 | Compatible    | Formato básico de eventos y metadatos de perfil    |
| NIP-04 | Compatible    | Mensajes directos cifrados (`kind:4`)               |
| NIP-17 | Planificado   | Mensajes directos envueltos como obsequio           |
| NIP-44 | Planificado   | Cifrado con versiones                               |

## Pruebas

### Relé local

```bash
# Iniciar strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### Prueba manual

1. Anote la clave pública del bot desde los registros del Gateway o mediante `openclaw channels status` (en hexadecimal; conviértala a npub en su cliente si es necesario).
2. Abra un cliente de Nostr (Amethyst, Damus, etc.).
3. Envíe un mensaje directo a la clave pública del bot.
4. Verifique la respuesta.

## Solución de problemas

### No se reciben mensajes

- Verifique que la clave privada sea válida.
- Asegúrese de que las URL de los relés sean accesibles y usen `wss://` (o `ws://` para conexiones locales).
- Confirme que `enabled` no sea `false`.
- Revise los registros del Gateway para detectar errores de conexión con los relés.

### No se envían respuestas

- Compruebe que el relé acepte escrituras.
- Verifique la conectividad saliente.
- Compruebe si existen límites de frecuencia del relé.

### Respuestas duplicadas

- Es lo esperado cuando se utilizan varios relés.
- Los mensajes se desduplican mediante el identificador del evento; solo la primera entrega activa una respuesta.

## Seguridad

- Nunca confirme claves privadas en el repositorio.
- Use variables de entorno para las claves.
- Considere usar `allowlist` para bots de producción.
- Las firmas se verifican antes de aplicar la política del remitente, y esta se aplica antes del descifrado; por ello, los eventos falsificados se rechazan de forma temprana y los remitentes desconocidos no pueden forzar la ejecución completa de operaciones criptográficas.

## Limitaciones (producto mínimo viable)

- Solo mensajes directos (sin chats de grupo).
- Sin archivos multimedia adjuntos.
- Solo NIP-04 (se ha planificado el envoltorio de obsequio de NIP-17).

## Contenido relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de los chats de grupo y control mediante menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de la seguridad
