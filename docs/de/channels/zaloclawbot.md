---
read_when:
    - Sie möchten einen persönlichen Zalo-Assistenten-Bot mit QR-Code-Anmeldung
    - Sie installieren das Channel-Plugin openclaw-zaloclawbot oder beheben Probleme damit
summary: Einrichtung des Zalo ClawBot-Kanals über das externe Plugin openclaw-zaloclawbot
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-06-27T17:13:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 982ae27b58af013bb5398266837698052b30337df0fe132f7cdfc5b66f561a99
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw verbindet sich über das im Katalog gelistete externe
`@zalo-platforms/openclaw-zaloclawbot`-Plugin mit Zalo ClawBot. Die Anmeldung verwendet einen QR-Code einer Zalo Mini App.

## Kompatibilität

| Plugin-Version | OpenClaw-Version | npm-dist-tag | Status        |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.x          | >=2026.4.10      | `latest`     | Aktiv / Beta |

## Voraussetzungen

- Node.js **>= 22**
- [OpenClaw](https://docs.openclaw.ai/install) muss installiert sein (`openclaw`-CLI verfügbar).
- Ein Zalo-Konto auf einem Mobilgerät, um den Anmelde-QR-Code zu scannen.

## Installation mit Onboarding (empfohlen)

Führen Sie den OpenClaw-Onboarding-Assistenten aus und wählen Sie **Zalo ClawBot** im Kanalmenü aus:

```bash
openclaw onboard
```

Der Assistent installiert das Plugin aus dem offiziellen Katalog (integritätsgeprüft), rendert den Anmelde-QR-Code direkt im Terminal und schließt den Kanal ab, sobald Sie ihn mit der Zalo-App scannen. Es sind keine zusätzlichen Befehle erforderlich.

## Manuelle Installation

Um den Kanal einem bereits eingerichteten Gateway hinzuzufügen, gehen Sie wie folgt vor:

### 1. Plugin installieren

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Verwenden Sie die oben gezeigte exakt festgelegte Version (sie entspricht dem offiziellen Katalogeintrag), damit OpenClaw das Paket während der Installation anhand des Katalog-Integritäts-Hashes verifiziert.

### 2. Plugin in der Konfiguration aktivieren

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. QR-Code generieren und anmelden

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Scannen Sie den im Terminal gerenderten QR-Code mit der mobilen Zalo-App, akzeptieren Sie die Nutzungsbedingungen in der Zalo Mini App und autorisieren Sie die Sitzung.

### 4. Gateway neu starten

```bash
openclaw gateway restart
```

---

## Funktionsweise

Im Gegensatz zum standardmäßigen Zalo-Entwicklerkanal, bei dem Sie Ihr eigenes Zalo Official Account (OA) registrieren und statische Entwickler-Anmeldedaten einfügen müssen, arbeitet Zalo ClawBot als **an den Besitzer gebundener persönlicher Assistent** mit gemeinsam genutzter offizieller Infrastruktur:

1. **Sicheres Onboarding:** Der QR-Code verweist auf eine sichere Zalo Mini App, die einen neu bereitgestellten privaten Bot unter einem gemeinsam genutzten offiziellen OA direkt an Ihre Zalo User ID bindet.
2. **An den Besitzer gebundene Privatsphäre:** Der Bot ist absichtlich darauf beschränkt, _nur_ mit seinem Besitzer zu kommunizieren. Nachrichten anderer Benutzer werden auf Plattformebene verworfen, wodurch die Verbindung privat und sicher bleibt.
3. **Offizieller API-Pfad:** Das Plugin verwendet Zalo Bot Platform APIs statt
   Browser- oder Web-Sitzungsautomatisierung.

## Unter der Haube

Das Zalo ClawBot-Plugin kommuniziert über eine persistente Long-Polling-Nachrichtenschleife mit Zalo-APIs. Für eine saubere und schlanke Runtime gilt:

- Long-Poll-Verbindungen verwenden den `getUpdates`-Endpunkt.
- Webhooks sind für lokale Desktop-/Terminal-Gateway-Ausführungen standardmäßig deaktiviert.
- Nachrichten werden clientseitig verarbeitet und direkt Ihrer lokalen Agent-Runtime zugeordnet.

Das externe Plugin verwaltet Bot-Anmeldedaten im OpenClaw-Zustandsverzeichnis.
Behandeln Sie dieses Verzeichnis als sensibel und beziehen Sie es in dieselbe Zugriffssteuerungs- und
Backup-Richtlinie ein wie den restlichen OpenClaw-Zustand.

---

## Fehlerbehebung

- **Zeitüberschreitung bei QR-Anmeldung:** Das Anmeldetoken (`zbsk`) läuft aus Sicherheitsgründen nach 5 Minuten ab. Wenn der QR-Code abläuft, bevor Sie ihn scannen, führen Sie einfach den Anmeldebefehl erneut aus, um einen neuen zu generieren.
- **Gateway kann nicht geladen werden:** Stellen Sie sicher, dass Ihre OpenClaw-Hostversion `2026.4.10` oder höher ist. Ältere Versionen unterstützen das Installations-Ledger für externe npm-Plugins nicht.
