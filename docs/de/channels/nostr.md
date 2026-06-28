---
read_when:
    - Sie möchten, dass OpenClaw Direktnachrichten über Nostr empfängt
    - Sie richten dezentrale Nachrichtenübermittlung ein
summary: Nostr-Direktnachrichtenkanal über NIP-04-verschlüsselte Nachrichten
title: Nostr
x-i18n:
    generated_at: "2026-05-02T22:16:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6158c22c0ffc5aea56d0ac2b68955f30c3a785013dba5410cbd70f9b689dc3c
    source_path: channels/nostr.md
    workflow: 16
    postprocess_version: locale-links-v1
---

**Status:** Optionales gebündeltes Plugin (standardmäßig deaktiviert, bis es konfiguriert wurde).

Nostr ist ein dezentrales Protokoll für soziale Netzwerke. Dieser Kanal ermöglicht OpenClaw, verschlüsselte Direktnachrichten (DMs) über NIP-04 zu empfangen und zu beantworten.

## Gebündeltes Plugin

Aktuelle OpenClaw-Versionen liefern Nostr als gebündeltes Plugin aus, sodass normale paketierte
Builds keine separate Installation benötigen.

### Ältere/benutzerdefinierte Installationen

- Onboarding (`openclaw onboard`) und `openclaw channels add` zeigen
  Nostr weiterhin aus dem gemeinsamen Kanalkatalog an.
- Wenn Ihr Build gebündeltes Nostr ausschließt, installieren Sie das npm-Paket direkt.

```bash
openclaw plugins install @openclaw/nostr
```

Verwenden Sie das reine Paket, um dem aktuellen offiziellen Release-Tag zu folgen. Pinnen Sie eine exakte
Version nur, wenn Sie eine reproduzierbare Installation benötigen.

Verwenden Sie einen lokalen Checkout (Dev-Workflows):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Starten Sie den Gateway nach dem Installieren oder Aktivieren von Plugins neu.

### Nicht interaktive Einrichtung

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Verwenden Sie `--use-env`, um `NOSTR_PRIVATE_KEY` in der Umgebung zu behalten, statt den Schlüssel in der Konfiguration zu speichern.

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

4. Starten Sie den Gateway neu.

## Konfigurationsreferenz

| Schlüssel    | Typ      | Standard                                    | Beschreibung                                |
| ------------ | -------- | ------------------------------------------- | ------------------------------------------- |
| `privateKey` | string   | erforderlich                                | Privater Schlüssel im `nsec`- oder Hex-Format |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Relay-URLs (WebSocket)                      |
| `dmPolicy`   | string   | `pairing`                                   | DM-Zugriffsrichtlinie                       |
| `allowFrom`  | string[] | `[]`                                        | Erlaubte Sender-pubkeys                     |
| `enabled`    | boolean  | `true`                                      | Kanal aktivieren/deaktivieren               |
| `name`       | string   | -                                           | Anzeigename                                 |
| `profile`    | object   | -                                           | NIP-01-Profilmetadaten                      |

## Profilmetadaten

Profildaten werden als NIP-01-Event `kind:0` veröffentlicht. Sie können sie über die Control UI (Channels -> Nostr -> Profile) verwalten oder direkt in der Konfiguration festlegen.

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
- Beim Importieren von Relays werden Felder zusammengeführt und lokale Überschreibungen beibehalten.

## Zugriffskontrolle

### DM-Richtlinien

- **pairing** (Standard): Unbekannte Sender erhalten einen Pairing-Code.
- **allowlist**: Nur pubkeys in `allowFrom` können DMs senden.
- **open**: Öffentliche eingehende DMs (erfordert `allowFrom: ["*"]`).
- **disabled**: Eingehende DMs ignorieren.

Hinweise zur Durchsetzung:

- Signaturen eingehender Events werden vor der Senderrichtlinie und NIP-04-Entschlüsselung geprüft, sodass gefälschte Events früh abgelehnt werden.
- Pairing-Antworten werden gesendet, ohne den ursprünglichen DM-Text zu verarbeiten.
- Eingehende DMs werden ratenbegrenzt, und übergroße Payloads werden vor der Entschlüsselung verworfen.

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

- Verwenden Sie 2-3 Relays für Redundanz.
- Vermeiden Sie zu viele Relays (Latenz, Duplikate).
- Bezahlte Relays können die Zuverlässigkeit verbessern.
- Lokale Relays eignen sich gut zum Testen (`ws://localhost:7777`).

## Protokollunterstützung

| NIP    | Status       | Beschreibung                              |
| ------ | ------------ | ----------------------------------------- |
| NIP-01 | Unterstützt  | Grundlegendes Event-Format + Profilmetadaten |
| NIP-04 | Unterstützt  | Verschlüsselte DMs (`kind:4`)             |
| NIP-17 | Geplant      | Geschenkverpackte DMs                     |
| NIP-44 | Geplant      | Versionierte Verschlüsselung              |

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

1. Notieren Sie den Bot-pubkey (npub) aus den Logs.
2. Öffnen Sie einen Nostr-Client (Damus, Amethyst usw.).
3. Senden Sie dem Bot-pubkey eine DM.
4. Prüfen Sie die Antwort.

## Fehlerbehebung

### Nachrichten werden nicht empfangen

- Prüfen Sie, ob der private Schlüssel gültig ist.
- Stellen Sie sicher, dass Relay-URLs erreichbar sind und `wss://` verwenden (oder `ws://` für lokale Relays).
- Bestätigen Sie, dass `enabled` nicht `false` ist.
- Prüfen Sie die Gateway-Logs auf Relay-Verbindungsfehler.

### Antworten werden nicht gesendet

- Prüfen Sie, ob das Relay Schreibvorgänge akzeptiert.
- Prüfen Sie die ausgehende Konnektivität.
- Achten Sie auf Relay-Rate-Limits.

### Doppelte Antworten

- Erwartet, wenn mehrere Relays verwendet werden.
- Nachrichten werden anhand der Event-ID dedupliziert; nur die erste Zustellung löst eine Antwort aus.

## Sicherheit

- Committen Sie niemals private Schlüssel.
- Verwenden Sie Umgebungsvariablen für Schlüssel.
- Ziehen Sie `allowlist` für Produktions-Bots in Betracht.
- Signaturen werden vor der Senderrichtlinie geprüft, und die Senderrichtlinie wird vor der Entschlüsselung durchgesetzt, sodass gefälschte Events früh abgelehnt werden und unbekannte Sender keine vollständige Kryptografiearbeit erzwingen können.

## Einschränkungen (MVP)

- Nur Direktnachrichten (keine Gruppenchats).
- Keine Medienanhänge.
- Nur NIP-04 (NIP-17-Gift-Wrap geplant).

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchateverhalten und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
