---
read_when:
    - Je wilt dat OpenClaw privéberichten ontvangt via Nostr
    - Je stelt gedecentraliseerde berichtenuitwisseling in
summary: Nostr-DM-kanaal via NIP-04-versleutelde berichten
title: Nostr
x-i18n:
    generated_at: "2026-04-29T22:26:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 545d68077c9fe81d5fa5a17262d37e3688185a1fb12d67b8b1053b27b96c3c7f
    source_path: channels/nostr.md
    workflow: 16
---

**Status:** Optionele meegeleverde Plugin (standaard uitgeschakeld tot deze is geconfigureerd).

Nostr is een gedecentraliseerd protocol voor sociale netwerken. Dit kanaal stelt OpenClaw in staat om versleutelde directe berichten (DM's) te ontvangen en erop te reageren via NIP-04.

## Meegeleverde Plugin

Huidige OpenClaw-releases leveren Nostr als een meegeleverde Plugin, zodat normale packaged builds geen aparte installatie nodig hebben.

### Oudere/aangepaste installaties

- Onboarding (`openclaw onboard`) en `openclaw channels add` tonen Nostr nog steeds vanuit de gedeelde kanaalcatalogus.
- Als je build de meegeleverde Nostr uitsluit, installeer dan een actueel npm-pakket wanneer er een is gepubliceerd.

```bash
openclaw plugins install @openclaw/nostr
```

Als npm meldt dat het pakket dat eigendom is van OpenClaw is verouderd, gebruik dan een actuele packaged OpenClaw-build of een lokale checkout totdat een nieuwer npm-pakket is gepubliceerd.

Gebruik een lokale checkout (dev-workflows):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Herstart de Gateway na het installeren of inschakelen van Plugins.

### Niet-interactieve configuratie

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Gebruik `--use-env` om `NOSTR_PRIVATE_KEY` in de omgeving te houden in plaats van de sleutel in de configuratie op te slaan.

## Snelle configuratie

1. Genereer een Nostr-sleutelpaar (indien nodig):

```bash
# Using nak
nak key generate
```

2. Voeg toe aan de configuratie:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Exporteer de sleutel:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Herstart de Gateway.

## Configuratiereferentie

| Sleutel      | Type     | Standaard                                  | Beschrijving                                  |
| ------------ | -------- | ------------------------------------------ | --------------------------------------------- |
| `privateKey` | string   | vereist                                   | Privésleutel in `nsec`- of hex-indeling       |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Relay-URL's (WebSocket)                       |
| `dmPolicy`   | string   | `pairing`                                  | DM-toegangsbeleid                            |
| `allowFrom`  | string[] | `[]`                                       | Toegestane pubkeys van afzenders              |
| `enabled`    | boolean  | `true`                                     | Kanaal in-/uitschakelen                       |
| `name`       | string   | -                                          | Weergavenaam                                  |
| `profile`    | object   | -                                          | NIP-01-profielmetadata                        |

## Profielmetadata

Profielgegevens worden gepubliceerd als een NIP-01 `kind:0`-event. Je kunt deze beheren vanuit de Control UI (Channels -> Nostr -> Profile) of rechtstreeks instellen in de configuratie.

Voorbeeld:

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

Opmerkingen:

- Profiel-URL's moeten `https://` gebruiken.
- Importeren vanuit relays voegt velden samen en behoudt lokale overschrijvingen.

## Toegangscontrole

### DM-beleid

- **pairing** (standaard): onbekende afzenders krijgen een koppelingscode.
- **allowlist**: alleen pubkeys in `allowFrom` kunnen DM'en.
- **open**: openbare inkomende DM's (vereist `allowFrom: ["*"]`).
- **disabled**: inkomende DM's negeren.

Handhavingsopmerkingen:

- Handtekeningen van inkomende events worden geverifieerd vóór het afzenderbeleid en NIP-04-decryptie, zodat vervalste events vroeg worden geweigerd.
- Koppelingsantwoorden worden verzonden zonder de oorspronkelijke DM-body te verwerken.
- Inkomende DM's worden rate-limited en te grote payloads worden vóór decryptie geweigerd.

### Allowlist-voorbeeld

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

## Sleutelindelingen

Geaccepteerde indelingen:

- **Privésleutel:** `nsec...` of 64-tekens hex
- **Pubkeys (`allowFrom`):** `npub...` of hex

## Relays

Standaarden: `relay.damus.io` en `nos.lol`.

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

Tips:

- Gebruik 2-3 relays voor redundantie.
- Vermijd te veel relays (latentie, duplicatie).
- Betaalde relays kunnen de betrouwbaarheid verbeteren.
- Lokale relays zijn geschikt voor testen (`ws://localhost:7777`).

## Protocolondersteuning

| NIP    | Status       | Beschrijving                              |
| ------ | ------------ | ----------------------------------------- |
| NIP-01 | Ondersteund  | Basiseventindeling + profielmetadata      |
| NIP-04 | Ondersteund  | Versleutelde DM's (`kind:4`)              |
| NIP-17 | Gepland      | Gift-wrapped DM's                         |
| NIP-44 | Gepland      | Geversioneerde versleuteling              |

## Testen

### Lokale relay

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

### Handmatige test

1. Noteer de bot-pubkey (npub) uit de logs.
2. Open een Nostr-client (Damus, Amethyst, enz.).
3. DM de bot-pubkey.
4. Controleer de reactie.

## Probleemoplossing

### Geen berichten ontvangen

- Controleer of de privésleutel geldig is.
- Zorg dat relay-URL's bereikbaar zijn en `wss://` gebruiken (of `ws://` voor lokaal).
- Bevestig dat `enabled` niet `false` is.
- Controleer Gateway-logs op relay-verbindingsfouten.

### Geen reacties verzenden

- Controleer of de relay schrijfbewerkingen accepteert.
- Controleer uitgaande connectiviteit.
- Let op rate limits van relays.

### Dubbele reacties

- Verwacht bij gebruik van meerdere relays.
- Berichten worden ontdubbeld op event-ID; alleen de eerste levering triggert een reactie.

## Beveiliging

- Commit nooit privésleutels.
- Gebruik omgevingsvariabelen voor sleutels.
- Overweeg `allowlist` voor productiebots.
- Handtekeningen worden geverifieerd vóór het afzenderbeleid, en het afzenderbeleid wordt gehandhaafd vóór decryptie, zodat vervalste events vroeg worden geweigerd en onbekende afzenders geen volledige cryptografische verwerking kunnen afdwingen.

## Beperkingen (MVP)

- Alleen directe berichten (geen groepschats).
- Geen mediabijlagen.
- Alleen NIP-04 (NIP-17 gift-wrap gepland).

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en mention-gating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
