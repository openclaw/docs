---
read_when:
    - Sie möchten, dass OpenClaw Direktnachrichten über Nostr empfängt
    - Sie richten dezentrales Messaging ein
summary: Nostr-DM-Kanal über NIP-04-verschlüsselte Nachrichten
title: Nostr
x-i18n:
    generated_at: "2026-07-12T15:05:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr ist ein herunterladbares Kanal-Plugin (`@openclaw/nostr`), mit dem OpenClaw über Nostr-Relays verschlüsselte Direktnachrichten gemäß NIP-04 empfangen und beantworten kann. Ein Konto pro Gateway; nur Direktnachrichten.

## Installation

```bash
openclaw plugins install @openclaw/nostr
```

Verwenden Sie die reine Paketspezifikation, um dem aktuellen offiziellen Release-Tag zu folgen. Legen Sie nur dann eine genaue Version fest, wenn Sie eine reproduzierbare Installation benötigen.

Aus einem lokalen Checkout (Entwicklungsabläufe):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Starten Sie das Gateway nach der Installation oder Aktivierung von Plugins neu. Das Onboarding (`openclaw onboard`) und `openclaw channels add` zeigen Nostr aus dem gemeinsamen Kanalkatalog an, sobald das Plugin installiert ist.

### Nicht interaktive Einrichtung

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Verwenden Sie `--use-env`, um `NOSTR_PRIVATE_KEY` in der Umgebung zu belassen, anstatt den Schlüssel in der Konfiguration zu speichern (nur für das Standardkonto).

## Schnelleinrichtung

1. Erzeugen Sie ein Nostr-Schlüsselpaar (falls erforderlich):

```bash
# Mit nak
nak key generate
```

2. Fügen Sie es der Konfiguration hinzu:

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

| Schlüssel     | Typ      | Standardwert                                | Beschreibung                                                     |
| ------------- | -------- | ------------------------------------------- | ---------------------------------------------------------------- |
| `privateKey`  | string   | erforderlich                               | Privater Schlüssel im `nsec`- oder Hexadezimalformat; Geheimnisreferenzen zulässig |
| `relays`      | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Relay-URLs (WebSocket)                                           |
| `dmPolicy`    | string   | `pairing`                                   | Zugriffsrichtlinie für Direktnachrichten                          |
| `allowFrom`   | string[] | `[]`                                        | Zulässige öffentliche Absenderschlüssel                           |
| `enabled`     | boolean  | `true`                                      | Kanal aktivieren/deaktivieren                                     |
| `name`        | string   | -                                           | Anzeigename                                                       |
| `profile`     | object   | -                                           | NIP-01-Profilmetadaten                                            |

## Profilmetadaten

Profildaten werden als NIP-01-Ereignis vom Typ `kind:0` veröffentlicht. Sie können sie über die Control UI (Channels -> Nostr -> Profile) verwalten oder direkt in der Konfiguration festlegen.

Beispiel:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Persönlicher Assistent für Direktnachrichten",
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
- Beim Importieren aus Relays werden Felder zusammengeführt und lokale Überschreibungen beibehalten.

## Zugriffskontrolle

### Richtlinien für Direktnachrichten

- **pairing** (Standard): Unbekannte Absender erhalten einen Kopplungscode.
- **allowlist**: Nur öffentliche Schlüssel in `allowFrom` können Direktnachrichten senden.
- **open**: Öffentliche eingehende Direktnachrichten (erfordert `allowFrom: ["*"]`).
- **disabled**: Eingehende Direktnachrichten werden ignoriert.

Hinweise zur Durchsetzung:

- Signaturen eingehender Ereignisse werden vor der Absenderrichtlinie und der NIP-04-Entschlüsselung überprüft, sodass gefälschte Ereignisse frühzeitig abgewiesen werden.
- Antworten zur Kopplung werden gesendet, ohne den ursprünglichen Inhalt der Direktnachricht zu entschlüsseln oder zu verarbeiten.
- Eingehende Direktnachrichten unterliegen global und pro Absender einer Ratenbegrenzung; übergroße Nutzdaten werden vor der Entschlüsselung verworfen.

### Beispiel für eine Zulassungsliste

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

- **Privater Schlüssel:** `nsec...` oder 64-stelliges Hexadezimalformat
- **Öffentliche Schlüssel (`allowFrom`):** `npub...` oder Hexadezimalformat

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

- Verwenden Sie für Redundanz 2-3 Relays.
- Vermeiden Sie zu viele Relays (Latenz, Duplizierung).
- Kostenpflichtige Relays können die Zuverlässigkeit verbessern.
- Lokale Relays eignen sich gut für Tests (`ws://localhost:7777`).

## Protokollunterstützung

| NIP    | Status      | Beschreibung                                      |
| ------ | ----------- | ------------------------------------------------- |
| NIP-01 | Unterstützt | Grundlegendes Ereignisformat + Profilmetadaten    |
| NIP-04 | Unterstützt | Verschlüsselte Direktnachrichten (`kind:4`)        |
| NIP-17 | Geplant     | Verpackte Direktnachrichten                        |
| NIP-44 | Geplant     | Versionierte Verschlüsselung                       |

## Tests

### Lokales Relay

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

### Manueller Test

1. Notieren Sie den öffentlichen Schlüssel des Bots aus den Gateway-Protokollen oder aus `openclaw channels status` (Hexadezimalformat; wandeln Sie ihn bei Bedarf in Ihrem Client in npub um).
2. Öffnen Sie einen Nostr-Client (Amethyst, Damus usw.).
3. Senden Sie dem öffentlichen Schlüssel des Bots eine Direktnachricht.
4. Überprüfen Sie die Antwort.

## Fehlerbehebung

### Nachrichten werden nicht empfangen

- Überprüfen Sie, ob der private Schlüssel gültig ist.
- Stellen Sie sicher, dass die Relay-URLs erreichbar sind und `wss://` verwenden (oder `ws://` für lokale Relays).
- Vergewissern Sie sich, dass `enabled` nicht auf `false` gesetzt ist.
- Prüfen Sie die Gateway-Protokolle auf Relay-Verbindungsfehler.

### Antworten werden nicht gesendet

- Prüfen Sie, ob das Relay Schreibzugriffe akzeptiert.
- Überprüfen Sie die ausgehende Konnektivität.
- Achten Sie auf Ratenbegrenzungen des Relays.

### Doppelte Antworten

- Dies ist bei der Verwendung mehrerer Relays zu erwarten.
- Nachrichten werden anhand der Ereignis-ID dedupliziert; nur die erste Zustellung löst eine Antwort aus.

## Sicherheit

- Übertragen Sie private Schlüssel niemals in die Versionsverwaltung.
- Verwenden Sie Umgebungsvariablen für Schlüssel.
- Erwägen Sie für produktiv eingesetzte Bots `allowlist`.
- Signaturen werden vor der Absenderrichtlinie überprüft, und die Absenderrichtlinie wird vor der Entschlüsselung durchgesetzt. Dadurch werden gefälschte Ereignisse frühzeitig abgewiesen, und unbekannte Absender können keine vollständigen kryptografischen Operationen erzwingen.

## Einschränkungen (MVP)

- Nur Direktnachrichten (keine Gruppenchats).
- Keine Medienanhänge.
- Nur NIP-04 (NIP-17-Verpackung geplant).

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — Authentifizierung von Direktnachrichten und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Erwähnungssteuerung
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Absicherung
