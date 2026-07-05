---
read_when:
    - Quieres que OpenClaw reciba mensajes directos mediante Nostr
    - Estás configurando mensajería descentralizada
summary: Canal de DM de Nostr mediante mensajes cifrados NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-07-05T11:04:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr es un plugin de canal descargable (`@openclaw/nostr`) que permite que OpenClaw reciba y responda mensajes directos cifrados con NIP-04 a través de relés de Nostr. Una cuenta por Gateway; solo mensajes directos.

## Instalar

```bash
openclaw plugins install @openclaw/nostr
```

Usa la especificación de paquete sin versión para seguir la etiqueta de la versión oficial actual. Fija una versión exacta solo cuando necesites una instalación reproducible.

Desde un checkout local (flujos de desarrollo):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Reinicia el Gateway después de instalar o habilitar plugins. El onboarding (`openclaw onboard`) y `openclaw channels add` muestran Nostr desde el catálogo compartido de canales una vez instalado el plugin.

### Configuración no interactiva

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Usa `--use-env` para mantener `NOSTR_PRIVATE_KEY` en el entorno en lugar de almacenar la clave en la configuración (solo cuenta predeterminada).

## Configuración rápida

1. Genera un par de claves de Nostr (si es necesario):

```bash
# Using nak
nak key generate
```

2. Añádelo a la configuración:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Exporta la clave:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Reinicia el Gateway.

## Referencia de configuración

| Clave        | Tipo     | Predeterminado                            | Descripción                                                   |
| ------------ | -------- | ----------------------------------------- | ------------------------------------------------------------- |
| `privateKey` | string   | obligatorio                               | Clave privada en formato `nsec` o hexadecimal; se permiten referencias secretas |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URLs de relés (WebSocket)                                     |
| `dmPolicy`   | string   | `pairing`                                 | Política de acceso de mensajes directos                       |
| `allowFrom`  | string[] | `[]`                                      | Pubkeys de remitentes permitidos                              |
| `enabled`    | boolean  | `true`                                    | Habilitar/deshabilitar canal                                  |
| `name`       | string   | -                                         | Nombre para mostrar                                           |
| `profile`    | object   | -                                         | Metadatos de perfil NIP-01                                    |

## Metadatos de perfil

Los datos de perfil se publican como un evento NIP-01 `kind:0`. Puedes administrarlos desde la interfaz de control (Canales -> Nostr -> Perfil) o definirlos directamente en la configuración.

Ejemplo:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
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

- Las URLs de perfil deben usar `https://`.
- Importar desde relés fusiona campos y conserva las anulaciones locales.

## Control de acceso

### Políticas de mensajes directos

- **pairing** (predeterminada): los remitentes desconocidos reciben un código de emparejamiento.
- **allowlist**: solo las pubkeys en `allowFrom` pueden enviar mensajes directos.
- **open**: mensajes directos entrantes públicos (requiere `allowFrom: ["*"]`).
- **disabled**: ignorar mensajes directos entrantes.

Notas de aplicación:

- Las firmas de eventos entrantes se verifican antes de la política de remitentes y del descifrado NIP-04, por lo que los eventos falsificados se rechazan temprano.
- Las respuestas de emparejamiento se envían sin descifrar ni procesar el cuerpo del mensaje directo original.
- Los mensajes directos entrantes tienen límite de tasa (global y por remitente), y las cargas sobredimensionadas se descartan antes del descifrado.

### Ejemplo de allowlist

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

## Formatos de clave

Formatos aceptados:

- **Clave privada:** `nsec...` o hexadecimal de 64 caracteres
- **Pubkeys (`allowFrom`):** `npub...` o hexadecimal

## Relés

Predeterminados: `relay.damus.io` y `nos.lol`.

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

- Usa 2-3 relés para redundancia.
- Evita demasiados relés (latencia, duplicación).
- Los relés de pago pueden mejorar la confiabilidad.
- Los relés locales sirven para pruebas (`ws://localhost:7777`).

## Soporte de protocolo

| NIP    | Estado       | Descripción                                      |
| ------ | ------------ | ------------------------------------------------ |
| NIP-01 | Compatible   | Formato básico de evento + metadatos de perfil   |
| NIP-04 | Compatible   | Mensajes directos cifrados (`kind:4`)            |
| NIP-17 | Planificado  | Mensajes directos envueltos como regalo          |
| NIP-44 | Planificado  | Cifrado versionado                               |

## Pruebas

### Relé local

```bash
# Start strfry
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

1. Anota la pubkey del bot desde los registros del Gateway o `openclaw channels status` (hexadecimal; conviértela a npub en tu cliente si es necesario).
2. Abre un cliente de Nostr (Amethyst, Damus, etc.).
3. Envía un mensaje directo a la pubkey del bot.
4. Verifica la respuesta.

## Solución de problemas

### No recibe mensajes

- Verifica que la clave privada sea válida.
- Asegúrate de que las URLs de relés sean accesibles y usen `wss://` (o `ws://` para local).
- Confirma que `enabled` no sea `false`.
- Revisa los registros del Gateway en busca de errores de conexión con relés.

### No envía respuestas

- Comprueba que el relé acepte escrituras.
- Verifica la conectividad saliente.
- Vigila los límites de tasa del relé.

### Respuestas duplicadas

- Es esperable al usar varios relés.
- Los mensajes se deduplican por ID de evento; solo la primera entrega desencadena una respuesta.

## Seguridad

- Nunca confirmes claves privadas en el repositorio.
- Usa variables de entorno para las claves.
- Considera `allowlist` para bots de producción.
- Las firmas se verifican antes de la política de remitentes, y la política de remitentes se aplica antes del descifrado, por lo que los eventos falsificados se rechazan temprano y los remitentes desconocidos no pueden forzar trabajo criptográfico completo.

## Limitaciones (MVP)

- Solo mensajes directos (sin chats grupales).
- Sin adjuntos multimedia.
- Solo NIP-04 (envoltorio tipo regalo de NIP-17 planificado).

## Relacionado

- [Descripción general de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats grupales y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
