---
read_when:
    - Quieres que OpenClaw reciba mensajes directos mediante Nostr
    - Estás configurando la mensajería descentralizada
summary: Canal de mensajes directos de Nostr mediante mensajes cifrados NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-05-02T22:16:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6158c22c0ffc5aea56d0ac2b68955f30c3a785013dba5410cbd70f9b689dc3c
    source_path: channels/nostr.md
    workflow: 16
---

**Estado:** Plugin incluido opcional (deshabilitado de forma predeterminada hasta que se configure).

Nostr es un protocolo descentralizado para redes sociales. Este canal permite que OpenClaw reciba y responda a mensajes directos cifrados (DM) mediante NIP-04.

## Plugin incluido

Las versiones actuales de OpenClaw incluyen Nostr como Plugin incluido, por lo que las compilaciones empaquetadas normales no necesitan una instalación separada.

### Instalaciones antiguas/personalizadas

- La incorporación (`openclaw onboard`) y `openclaw channels add` siguen mostrando Nostr desde el catálogo compartido de canales.
- Si tu compilación excluye Nostr incluido, instala el paquete npm directamente.

```bash
openclaw plugins install @openclaw/nostr
```

Usa el paquete sin versión para seguir la etiqueta de versión oficial actual. Fija una versión exacta solo cuando necesites una instalación reproducible.

Usa un checkout local (flujos de trabajo de desarrollo):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Reinicia el Gateway después de instalar o habilitar plugins.

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

| Clave        | Tipo     | Predeterminado                            | Descripción                                  |
| ------------ | -------- | ------------------------------------------ | -------------------------------------------- |
| `privateKey` | string   | obligatorio                                | Clave privada en formato `nsec` o hexadecimal |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL de relés (WebSocket)                     |
| `dmPolicy`   | string   | `pairing`                                  | Política de acceso a DM                      |
| `allowFrom`  | string[] | `[]`                                       | Pubkeys de remitentes permitidos             |
| `enabled`    | boolean  | `true`                                     | Habilitar/deshabilitar canal                 |
| `name`       | string   | -                                          | Nombre para mostrar                          |
| `profile`    | object   | -                                          | Metadatos de perfil NIP-01                   |

## Metadatos de perfil

Los datos de perfil se publican como un evento NIP-01 `kind:0`. Puedes administrarlos desde la Control UI (Canales -> Nostr -> Perfil) o configurarlos directamente en la configuración.

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

- Las URL de perfil deben usar `https://`.
- Importar desde relés combina campos y conserva las anulaciones locales.

## Control de acceso

### Políticas de DM

- **pairing** (predeterminado): los remitentes desconocidos reciben un código de emparejamiento.
- **allowlist**: solo las pubkeys en `allowFrom` pueden enviar DM.
- **open**: DM entrantes públicos (requiere `allowFrom: ["*"]`).
- **disabled**: ignora los DM entrantes.

Notas de aplicación:

- Las firmas de eventos entrantes se verifican antes de la política de remitente y del descifrado NIP-04, por lo que los eventos falsificados se rechazan pronto.
- Las respuestas de emparejamiento se envían sin procesar el cuerpo del DM original.
- Los DM entrantes tienen límite de tasa y las cargas sobredimensionadas se descartan antes del descifrado.

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
- Los relés de pago pueden mejorar la fiabilidad.
- Los relés locales son adecuados para pruebas (`ws://localhost:7777`).

## Compatibilidad de protocolo

| NIP    | Estado      | Descripción                             |
| ------ | ----------- | --------------------------------------- |
| NIP-01 | Compatible  | Formato básico de evento + metadatos de perfil |
| NIP-04 | Compatible  | DM cifrados (`kind:4`)                  |
| NIP-17 | Planificado | DM con envoltorio de regalo             |
| NIP-44 | Planificado | Cifrado versionado                      |

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

1. Anota la pubkey del bot (npub) desde los registros.
2. Abre un cliente de Nostr (Damus, Amethyst, etc.).
3. Envía un DM a la pubkey del bot.
4. Verifica la respuesta.

## Solución de problemas

### No se reciben mensajes

- Verifica que la clave privada sea válida.
- Asegúrate de que las URL de relé sean accesibles y usen `wss://` (o `ws://` para local).
- Confirma que `enabled` no sea `false`.
- Revisa los registros del Gateway para detectar errores de conexión de relé.

### No se envían respuestas

- Comprueba que el relé acepte escrituras.
- Verifica la conectividad saliente.
- Observa los límites de tasa del relé.

### Respuestas duplicadas

- Es esperado cuando se usan varios relés.
- Los mensajes se deduplican por ID de evento; solo la primera entrega activa una respuesta.

## Seguridad

- Nunca confirmes claves privadas en commits.
- Usa variables de entorno para las claves.
- Considera `allowlist` para bots de producción.
- Las firmas se verifican antes de la política de remitente, y la política de remitente se aplica antes del descifrado, por lo que los eventos falsificados se rechazan pronto y los remitentes desconocidos no pueden forzar trabajo criptográfico completo.

## Limitaciones (MVP)

- Solo mensajes directos (sin chats grupales).
- Sin archivos multimedia adjuntos.
- Solo NIP-04 (envoltorio de regalo NIP-17 planificado).

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de DM y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats grupales y control de menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
