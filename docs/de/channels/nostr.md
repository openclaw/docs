---
read_when:
    - Sie möchten, dass OpenClaw DMs über Nostr empfängt
    - Sie richten dezentrale Nachrichtenübermittlung ein
summary: Nostr-DM-Kanal über NIP-04-verschlüsselte Nachrichten
title: Nostr
x-i18n:
    generated_at: "2026-04-30T06:41:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 545d68077c9fe81d5fa5a17262d37e3688185a1fb12d67b8b1053b27b96c3c7f
    source_path: channels/nostr.md
    workflow: 16
---

**Status:** Optionales gebündeltes Plugin (standardmäßig deaktiviert, bis es konfiguriert wurde).

Nostr ist ein dezentrales Protokoll für soziale Netzwerke. Dieser Kanal ermöglicht OpenClaw, verschlüsselte Direktnachrichten (DMs) über NIP-04 zu empfangen und zu beantworten.

## Gebündeltes Plugin

Aktuelle OpenClaw-Versionen liefern Nostr als gebündeltes Plugin aus, daher benötigen normale paketierte Builds keine separate Installation.

### Ältere/benutzerdefinierte Installationen

- Das Onboarding (`openclaw onboard`) und `openclaw channels add` zeigen Nostr weiterhin aus dem gemeinsamen Kanalkatalog an.
- Wenn Ihr Build das gebündelte Nostr ausschließt, installieren Sie ein aktuelles npm-Paket, sobald eines veröffentlicht ist.

```bash
openclaw plugins install @openclaw/nostr
```

Wenn npm das OpenClaw-eigene Paket als veraltet meldet, verwenden Sie einen aktuellen paketierten OpenClaw-Build oder einen lokalen Checkout, bis ein neueres npm-Paket veröffentlicht ist.

Verwenden Sie einen lokalen Checkout (Entwicklungs-Workflows):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Starten Sie das Gateway neu, nachdem Sie Plugins installiert oder aktiviert haben.

### Nicht interaktive Einrichtung

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Verwenden Sie `--use-env`, um `NOSTR_PRIVATE_KEY` in der Umgebung zu behalten, anstatt den Schlüssel in der Konfiguration zu speichern.

## Schnelle Einrichtung

1. Generieren Sie bei Bedarf ein Nostr-Schlüsselpaar:

```bash
# Using nak
nak key generate
```

2. Zur Konfiguration hinzufügen:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Exportieren Sie den Schlüssel:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Starten Sie das Gateway neu.

## Konfigurationsreferenz

| Schlüssel    | Typ      | Standard                                    | Beschreibung                              |
| ------------ | -------- | ------------------------------------------- | ----------------------------------------- |
| `privateKey` | string   | erforderlich                                | Privater Schlüssel im `nsec`- oder Hex-Format |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Relay-URLs (WebSocket)                    |
| `dmPolicy`   | string   | `pairing`                                   | DM-Zugriffsrichtlinie                     |
| `allowFrom`  | string[] | `[]`                                        | Zulässige Absender-Pubkeys                |
| `enabled`    | boolean  | `true`                                      | Kanal aktivieren/deaktivieren             |
| `name`       | string   | -                                           | Anzeigename                               |
| `profile`    | object   | -                                           | NIP-01-Profilmetadaten                    |

## Profilmetadaten

Profildaten werden als NIP-01-`kind:0`-Ereignis veröffentlicht. Sie können sie über die Control UI (Kanäle -> Nostr -> Profil) verwalten oder direkt in der Konfiguration festlegen.

Beispiel:

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

Hinweise:

- Profil-URLs müssen `https://` verwenden.
- Beim Import aus Relays werden Felder zusammengeführt und lokale Überschreibungen beibehalten.

## Zugriffskontrolle

### DM-Richtlinien

- **pairing** (Standard): Unbekannte Absender erhalten einen Kopplungscode.
- **allowlist**: Nur Pubkeys in `allowFrom` können DMs senden.
- **open**: Öffentliche eingehende DMs (erfordert `allowFrom: ["*"]`).
- **disabled**: Eingehende DMs ignorieren.

Hinweise zur Durchsetzung:

- Signaturen eingehender Ereignisse werden vor der Absenderrichtlinie und der NIP-04-Entschlüsselung verifiziert, sodass gefälschte Ereignisse früh abgelehnt werden.
- Kopplungsantworten werden gesendet, ohne den ursprünglichen DM-Text zu verarbeiten.
- Eingehende DMs werden ratenbegrenzt, und übergroße Nutzlasten werden vor der Entschlüsselung verworfen.

### Allowlist-Beispiel

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

## Schlüsselformate

Akzeptierte Formate:

- **Privater Schlüssel:** `nsec...` oder 64-Zeichen-Hex
- **Pubkeys (`allowFrom`):** `npub...` oder Hex

## Relays

Standardwerte: `relay.damus.io` und `nos.lol`.

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

Tipps:

- Verwenden Sie 2 bis 3 Relays für Redundanz.
- Vermeiden Sie zu viele Relays (Latenz, Duplizierung).
- Kostenpflichtige Relays können die Zuverlässigkeit verbessern.
- Lokale Relays eignen sich gut zum Testen (`ws://localhost:7777`).

## Protokollunterstützung

| NIP    | Status       | Beschreibung                             |
| ------ | ------------ | ---------------------------------------- |
| NIP-01 | Unterstützt  | Grundlegendes Ereignisformat + Profilmetadaten |
| NIP-04 | Unterstützt  | Verschlüsselte DMs (`kind:4`)            |
| NIP-17 | Geplant      | Gift-wrapped DMs                         |
| NIP-44 | Geplant      | Versionierte Verschlüsselung             |

## Testen

### Lokales Relay

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

### Manueller Test

1. Notieren Sie den Bot-Pubkey (npub) aus den Logs.
2. Öffnen Sie einen Nostr-Client (Damus, Amethyst usw.).
3. Senden Sie eine DM an den Bot-Pubkey.
4. Überprüfen Sie die Antwort.

## Fehlerbehebung

### Nachrichten werden nicht empfangen

- Überprüfen Sie, ob der private Schlüssel gültig ist.
- Stellen Sie sicher, dass Relay-URLs erreichbar sind und `wss://` verwenden (oder `ws://` für lokal).
- Bestätigen Sie, dass `enabled` nicht `false` ist.
- Prüfen Sie die Gateway-Logs auf Relay-Verbindungsfehler.

### Antworten werden nicht gesendet

- Prüfen Sie, ob das Relay Schreibvorgänge akzeptiert.
- Überprüfen Sie die ausgehende Konnektivität.
- Achten Sie auf Relay-Ratenbegrenzungen.

### Doppelte Antworten

- Erwartet, wenn mehrere Relays verwendet werden.
- Nachrichten werden anhand der Ereignis-ID dedupliziert; nur die erste Zustellung löst eine Antwort aus.

## Sicherheit

- Committen Sie niemals private Schlüssel.
- Verwenden Sie Umgebungsvariablen für Schlüssel.
- Ziehen Sie `allowlist` für Produktions-Bots in Betracht.
- Signaturen werden vor der Absenderrichtlinie verifiziert, und die Absenderrichtlinie wird vor der Entschlüsselung durchgesetzt. Dadurch werden gefälschte Ereignisse früh abgelehnt, und unbekannte Absender können keine vollständige Kryptografiearbeit erzwingen.

## Einschränkungen (MVP)

- Nur Direktnachrichten (keine Gruppenchats).
- Keine Medienanhänge.
- Nur NIP-04 (NIP-17-Gift-Wrap geplant).

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Gruppenchatverhalten und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
