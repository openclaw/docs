---
read_when:
    - Quieres que OpenClaw reciba mensajes directos a través de Nostr
    - Estás configurando mensajería descentralizada
summary: Canal de mensajes directos de Nostr mediante mensajes cifrados NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-24T05:19:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f722bb4e1c5f2b3a9c1d58f5597aad2826a809cba3d165af7bf2faf72b68a0f
    source_path: channels/nostr.md
    workflow: 15
---

**Estado:** Plugin opcional incluido (desactivado de forma predeterminada hasta que se configure).

Nostr es un protocolo descentralizado para redes sociales. Este canal permite que OpenClaw reciba y responda a mensajes directos (DM) cifrados mediante NIP-04.

## Plugin incluido

Las versiones actuales de OpenClaw incluyen Nostr como un Plugin incluido, por lo que las compilaciones empaquetadas normales no necesitan una instalación independiente.

### Instalaciones antiguas/personalizadas

- El asistente de incorporación (`openclaw onboard`) y `openclaw channels add` siguen mostrando Nostr desde el catálogo compartido de canales.
- Si tu compilación excluye el Nostr incluido, instálalo manualmente.

```bash
openclaw plugins install @openclaw/nostr
```

Usa una copia local (flujos de desarrollo):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Reinicia el Gateway después de instalar o habilitar Plugins.

### Configuración no interactiva

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Usa `--use-env` para mantener `NOSTR_PRIVATE_KEY` en el entorno en lugar de almacenar la clave en la configuración.

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

| Clave        | Tipo     | Predeterminado                            | Descripción                         |
| ------------ | -------- | ----------------------------------------- | ----------------------------------- |
| `privateKey` | string   | obligatorio                               | Clave privada en formato `nsec` o hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL de los relays (WebSocket)       |
| `dmPolicy`   | string   | `pairing`                                 | Política de acceso para mensajes directos |
| `allowFrom`  | string[] | `[]`                                      | Claves públicas de remitentes permitidos |
| `enabled`    | boolean  | `true`                                    | Activa/desactiva el canal           |
| `name`       | string   | -                                         | Nombre para mostrar                 |
| `profile`    | object   | -                                         | Metadatos del perfil NIP-01         |

## Metadatos del perfil

Los datos del perfil se publican como un evento NIP-01 `kind:0`. Puedes gestionarlos desde la interfaz de control (Canales -> Nostr -> Perfil) o configurarlos directamente en la configuración.

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

- Las URL del perfil deben usar `https://`.
- La importación desde relays combina campos y conserva las anulaciones locales.

## Control de acceso

### Políticas de mensajes directos

- **pairing** (predeterminado): los remitentes desconocidos reciben un código de vinculación.
- **allowlist**: solo las claves públicas incluidas en `allowFrom` pueden enviar mensajes directos.
- **open**: mensajes directos públicos entrantes (requiere `allowFrom: ["*"]`).
- **disabled**: ignora los mensajes directos entrantes.

Notas sobre la aplicación:

- Las firmas de los eventos entrantes se verifican antes de la política del remitente y del descifrado NIP-04, por lo que los eventos falsificados se rechazan de inmediato.
- Las respuestas de vinculación se envían sin procesar el cuerpo original del mensaje directo.
- Los mensajes directos entrantes tienen limitación de velocidad y las cargas sobredimensionadas se descartan antes del descifrado.

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

## Formatos de clave

Formatos aceptados:

- **Clave privada:** `nsec...` o hex de 64 caracteres
- **Claves públicas (`allowFrom`):** `npub...` o hex

## Relays

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

- Usa 2-3 relays para redundancia.
- Evita demasiados relays (latencia, duplicación).
- Los relays de pago pueden mejorar la fiabilidad.
- Los relays locales son adecuados para pruebas (`ws://localhost:7777`).

## Compatibilidad de protocolo

| NIP    | Estado      | Descripción                            |
| ------ | ----------- | -------------------------------------- |
| NIP-01 | Compatible  | Formato básico de eventos + metadatos del perfil |
| NIP-04 | Compatible  | Mensajes directos cifrados (`kind:4`)  |
| NIP-17 | Planificado | Mensajes directos con envoltura de regalo |
| NIP-44 | Planificado | Cifrado con versiones                  |

## Pruebas

### Relay local

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

1. Anota la clave pública del bot (npub) en los registros.
2. Abre un cliente Nostr (Damus, Amethyst, etc.).
3. Envía un mensaje directo a la clave pública del bot.
4. Verifica la respuesta.

## Solución de problemas

### No se reciben mensajes

- Verifica que la clave privada sea válida.
- Asegúrate de que las URL de los relays sean accesibles y usen `wss://` (o `ws://` en local).
- Confirma que `enabled` no sea `false`.
- Revisa los registros del Gateway en busca de errores de conexión con los relays.

### No se envían respuestas

- Comprueba que el relay acepte escrituras.
- Verifica la conectividad saliente.
- Observa si hay límites de velocidad del relay.

### Respuestas duplicadas

- Es esperable cuando se usan varios relays.
- Los mensajes se desduplican por ID de evento; solo la primera entrega desencadena una respuesta.

## Seguridad

- Nunca subas claves privadas al repositorio.
- Usa variables de entorno para las claves.
- Considera `allowlist` para bots de producción.
- Las firmas se verifican antes de la política del remitente, y la política del remitente se aplica antes del descifrado, por lo que los eventos falsificados se rechazan de inmediato y los remitentes desconocidos no pueden forzar trabajo criptográfico completo.

## Limitaciones (MVP)

- Solo mensajes directos (sin chats de grupo).
- Sin archivos multimedia adjuntos.
- Solo NIP-04 (NIP-17 gift-wrap planificado).

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Vinculación](/es/channels/pairing) — autenticación por mensaje directo y flujo de vinculación
- [Grupos](/es/channels/groups) — comportamiento de los chats de grupo y control por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
