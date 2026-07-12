---
read_when:
    - Je wilt dat OpenClaw privéberichten ontvangt via Nostr
    - Je stelt gedecentraliseerde berichtenuitwisseling in
summary: Nostr-DM-kanaal via NIP-04-versleutelde berichten
title: Nostr
x-i18n:
    generated_at: "2026-07-12T08:39:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr is een downloadbare kanaalplugin (`@openclaw/nostr`) waarmee OpenClaw via Nostr-relays versleutelde directe NIP-04-berichten kan ontvangen en beantwoorden. Eén account per Gateway; alleen DM's.

## Installeren

```bash
openclaw plugins install @openclaw/nostr
```

Gebruik de kale pakketspecificatie om de huidige officiële releasetag te volgen. Zet alleen een exacte versie vast wanneer u een reproduceerbare installatie nodig hebt.

Vanuit een lokale checkout (ontwikkelworkflows):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Herstart de Gateway nadat u plugins hebt geïnstalleerd of ingeschakeld. Zodra de plugin is geïnstalleerd, tonen de onboarding (`openclaw onboard`) en `openclaw channels add` Nostr vanuit de gedeelde kanaalcatalogus.

### Niet-interactieve configuratie

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Gebruik `--use-env` om `NOSTR_PRIVATE_KEY` in de omgeving te bewaren in plaats van de sleutel in de configuratie op te slaan (alleen voor het standaardaccount).

## Snelle configuratie

1. Genereer zo nodig een Nostr-sleutelpaar:

```bash
# nak gebruiken
nak key generate
```

2. Voeg het toe aan de configuratie:

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

| Sleutel      | Type     | Standaard                                   | Beschrijving                                                     |
| ------------ | -------- | ------------------------------------------- | ---------------------------------------------------------------- |
| `privateKey` | string   | vereist                                     | Privésleutel in `nsec`- of hexadecimaal formaat; geheime verwijzingen toegestaan |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Relay-URL's (WebSocket)                                          |
| `dmPolicy`   | string   | `pairing`                                   | Toegangsbeleid voor DM's                                         |
| `allowFrom`  | string[] | `[]`                                        | Toegestane openbare sleutels van afzenders                       |
| `enabled`    | boolean  | `true`                                      | Kanaal in-/uitschakelen                                          |
| `name`       | string   | -                                           | Weergavenaam                                                     |
| `profile`    | object   | -                                           | NIP-01-profielmetadata                                           |

## Profielmetadata

Profielgegevens worden gepubliceerd als een NIP-01-gebeurtenis van het type `kind:0`. U kunt deze beheren via de Control UI (Channels -> Nostr -> Profile) of rechtstreeks instellen in de configuratie.

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
- Bij importeren vanuit relays worden velden samengevoegd en blijven lokale overschrijvingen behouden.

## Toegangsbeheer

### DM-beleid

- **pairing** (standaard): onbekende afzenders krijgen een koppelingscode.
- **allowlist**: alleen openbare sleutels in `allowFrom` kunnen DM's sturen.
- **open**: openbaar toegankelijke inkomende DM's (vereist `allowFrom: ["*"]`).
- **disabled**: inkomende DM's negeren.

Opmerkingen over handhaving:

- Handtekeningen van inkomende gebeurtenissen worden vóór het afzenderbeleid en de NIP-04-ontsleuteling geverifieerd, zodat vervalste gebeurtenissen vroegtijdig worden geweigerd.
- Koppelingsantwoorden worden verzonden zonder de inhoud van de oorspronkelijke DM te ontsleutelen of te verwerken.
- Inkomende DM's hebben een frequentielimiet (globaal en per afzender) en te grote payloads worden vóór ontsleuteling verwijderd.

### Voorbeeld van een toelatingslijst

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

## Sleutelformaten

Geaccepteerde formaten:

- **Privésleutel:** `nsec...` of hexadecimaal met 64 tekens
- **Openbare sleutels (`allowFrom`):** `npub...` of hexadecimaal

## Relays

Standaard: `relay.damus.io` en `nos.lol`.

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
- Lokale relays zijn geschikt voor tests (`ws://localhost:7777`).

## Protocolondersteuning

| NIP    | Status       | Beschrijving                                      |
| ------ | ------------ | ------------------------------------------------- |
| NIP-01 | Ondersteund  | Basisindeling van gebeurtenissen + profielmetadata |
| NIP-04 | Ondersteund  | Versleutelde DM's (`kind:4`)                      |
| NIP-17 | Gepland      | Verpakt verzonden DM's                            |
| NIP-44 | Gepland      | Versleuteling met versiebeheer                    |

## Testen

### Lokale relay

```bash
# strfry starten
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

1. Noteer de openbare sleutel van de bot uit de Gateway-logboeken of uit `openclaw channels status` (hexadecimaal; converteer deze zo nodig in uw client naar npub).
2. Open een Nostr-client (Amethyst, Damus enzovoort).
3. Stuur een DM naar de openbare sleutel van de bot.
4. Controleer het antwoord.

## Problemen oplossen

### Geen berichten ontvangen

- Controleer of de privésleutel geldig is.
- Zorg dat de relay-URL's bereikbaar zijn en `wss://` gebruiken (of `ws://` voor lokaal gebruik).
- Controleer of `enabled` niet `false` is.
- Controleer de Gateway-logboeken op verbindingsfouten met relays.

### Geen antwoorden verzenden

- Controleer of de relay schrijfbewerkingen accepteert.
- Controleer de uitgaande verbinding.
- Let op frequentielimieten van de relay.

### Dubbele antwoorden

- Dit wordt verwacht bij gebruik van meerdere relays.
- Berichten worden op gebeurtenis-ID gededupliceerd; alleen de eerste aflevering activeert een antwoord.

## Beveiliging

- Leg privésleutels nooit vast in versiebeheer.
- Gebruik omgevingsvariabelen voor sleutels.
- Overweeg `allowlist` voor productiebots.
- Handtekeningen worden vóór het afzenderbeleid geverifieerd en het afzenderbeleid wordt vóór ontsleuteling afgedwongen, zodat vervalste gebeurtenissen vroegtijdig worden geweigerd en onbekende afzenders geen volledige cryptografische verwerking kunnen afdwingen.

## Beperkingen (MVP)

- Alleen directe berichten (geen groepschats).
- Geen mediabijlagen.
- Alleen NIP-04 (NIP-17-verpakking gepland).

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsproces
- [Groepen](/nl/channels/groups) — gedrag van groepschats en beperking op basis van vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en beveiliging aanscherpen
