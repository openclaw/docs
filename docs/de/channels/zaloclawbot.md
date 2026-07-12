---
read_when:
    - Sie möchten einen persönlichen Zalo-Assistenten-Bot mit Anmeldung per QR-Code
    - Sie installieren das Kanal-Plugin openclaw-zaloclawbot oder beheben damit verbundene Probleme.
summary: Einrichtung des Zalo-ClawBot-Kanals über das externe Plugin openclaw-zaloclawbot
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-12T01:25:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw stellt über das im Katalog aufgeführte externe Plugin `@zalo-platforms/openclaw-zaloclawbot` eine Verbindung zu Zalo ClawBot her. Die Anmeldung erfolgt über einen QR-Code einer Zalo Mini App; die Plugin-ID in der Konfiguration lautet `openclaw-zaloclawbot`.

## Kompatibilität

| Plugin-Version | OpenClaw-Version | npm-dist-tag | Status       |
| -------------- | ---------------- | ------------ | ------------ |
| 0.1.4          | >=2026.4.10      | `latest`     | Aktiv / Beta |

## Voraussetzungen

- Node.js >= 22
- [OpenClaw](https://docs.openclaw.ai/install) installiert (`openclaw`-CLI verfügbar)
- Ein Zalo-Konto auf einem Mobilgerät zum Scannen des QR-Codes für die Anmeldung

## Installation mit dem Onboarding-Assistenten (empfohlen)

```bash
openclaw onboard
```

Wählen Sie **Zalo ClawBot** im Kanalmenü aus. Der Assistent installiert das Plugin aus dem offiziellen Katalog mit Integritätsprüfung, zeigt den QR-Code für die Anmeldung im Terminal an und schließt die Kanaleinrichtung ab, sobald Sie ihn mit der Zalo-App scannen.

## Manuelle Installation

So fügen Sie den Kanal einem bereits eingerichteten Gateway hinzu:

### 1. Plugin installieren

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Verwenden Sie genau die angegebene Version, damit OpenClaw das Paket während der Installation anhand des Integritäts-Hashes im Katalog überprüft.

### 2. Plugin in der Konfiguration aktivieren

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. QR-Code erzeugen und anmelden

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Scannen Sie den im Terminal angezeigten QR-Code mit der mobilen Zalo-App, akzeptieren Sie die Nutzungsbedingungen in der Zalo Mini App und autorisieren Sie die Sitzung.

### 4. Gateway neu starten

```bash
openclaw gateway restart
```

## Funktionsweise

Im Gegensatz zum standardmäßigen Zalo-Kanal, für den Sie ein eigenes Zalo Official Account (OA) registrieren und statische Entwicklerzugangsdaten konfigurieren müssen, ist Zalo ClawBot ein **an den Eigentümer gebundener persönlicher Assistent** auf einer gemeinsam genutzten offiziellen Infrastruktur:

1. **Onboarding:** Der QR-Code führt zu einer Zalo Mini App, die einen neu bereitgestellten privaten Bot unter einem gemeinsam genutzten offiziellen OA direkt mit Ihrer Zalo-Benutzer-ID verknüpft.
2. **An den Eigentümer gebundene Privatsphäre:** Der Bot kommuniziert ausschließlich mit seinem Eigentümer. Nachrichten anderer Benutzer werden bereits auf Plattformebene verworfen.
3. **Offizieller API-Pfad:** Das Plugin verwendet die APIs der Zalo Bot Platform und keine Browser- oder Websitzungsautomatisierung.

## Technische Funktionsweise

Das Plugin kommuniziert über eine dauerhafte Long-Polling-Schleife (`getUpdates`) mit Zalo. Webhooks sind für lokale Gateway-Ausführungen auf dem Desktop oder im Terminal standardmäßig deaktiviert. Nachrichten werden clientseitig verarbeitet und Ihrer lokalen Agent-Laufzeit zugeordnet.

Das Plugin verwaltet die Bot-Zugangsdaten im OpenClaw-Zustandsverzeichnis. Behandeln Sie dieses Verzeichnis als vertraulich und beziehen Sie es in dieselben Zugriffskontroll- und Sicherungsrichtlinien wie den übrigen OpenClaw-Zustand ein.

Die Laufzeit dieses Plugins befindet sich vollständig im externen Paket `@zalo-platforms/openclaw-zaloclawbot`; die nachfolgenden Verhaltensdetails, die über Installation und Konfiguration hinausgehen, entsprechen den Angaben der Plugin-Maintainer und wurden nicht anhand des OpenClaw-Core-Quellcodes verifiziert.

## Fehlerbehebung

- **Zeitüberschreitung bei der QR-Anmeldung:** Das Anmelde-Token (`zbsk`) läuft aus Sicherheitsgründen nach 5 Minuten ab. Wenn der QR-Code abläuft, bevor Sie ihn scannen, führen Sie den Anmeldebefehl erneut aus, um einen neuen zu erzeugen.
- **Gateway kann nicht geladen werden:** Stellen Sie sicher, dass die Version Ihres OpenClaw-Hosts `2026.4.10` oder höher ist. Ältere Versionen unterstützen das für diese ID erforderliche Installationsverzeichnis für externe npm-Plugins nicht.

## Verwandte Themen

- [Kanalübersicht](/de/channels) – alle unterstützten Kanäle
- [Zalo](/de/channels/zalo) – der gebündelte Kanal für Zalo Bot Creator / Marketplace
- [Kopplung](/de/channels/pairing) – DM-Authentifizierung und Kopplungsablauf
- [Plugins](/de/tools/plugin) – Plugins installieren und verwalten
