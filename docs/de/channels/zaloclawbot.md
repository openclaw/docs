---
read_when:
    - Sie möchten einen persönlichen Zalo-Assistenten-Bot mit QR-Code-Anmeldung
    - Sie installieren das Kanal-Plugin openclaw-zaloclawbot oder beheben damit verbundene Probleme.
summary: Einrichtung des Zalo-ClawBot-Kanals über das externe Plugin openclaw-zaloclawbot
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-24T04:48:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw verbindet sich über das im Katalog aufgeführte externe Plugin `@zalo-platforms/openclaw-zaloclawbot` mit Zalo ClawBot. Die Anmeldung erfolgt über einen QR-Code einer Zalo Mini App; die Plugin-ID in der Konfiguration lautet `openclaw-zaloclawbot`.

## Kompatibilität

| Plugin-Version | OpenClaw-Version | npm-dist-tag | Status        |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.4          | >=2026.4.10      | `latest`     | Aktiv / Beta |

## Voraussetzungen

- Node.js >= 22
- [OpenClaw](https://docs.openclaw.ai/install) installiert (CLI `openclaw` verfügbar)
- Ein Zalo-Konto auf einem Mobilgerät zum Scannen des Anmelde-QR-Codes

## Installation mit Onboarding (empfohlen)

```bash
openclaw onboard
```

Wählen Sie **Zalo ClawBot** im Kanalmenü aus. Der Assistent installiert das Plugin aus dem offiziellen Katalog (mit Integritätsprüfung), zeigt den Anmelde-QR-Code im Terminal an und schließt die Kanaleinrichtung ab, sobald Sie ihn mit der Zalo-App scannen.

## Manuelle Installation

So fügen Sie den Kanal einem bereits eingerichteten Gateway hinzu:

### 1. Plugin installieren

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Verwenden Sie genau die festgelegte Version, damit OpenClaw das Paket während der Installation anhand des Integritäts-Hashes aus dem Katalog überprüft.

### 2. Plugin in der Konfiguration aktivieren

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. QR-Code generieren und anmelden

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Scannen Sie den im Terminal angezeigten QR-Code mit der mobilen Zalo-App, akzeptieren Sie die Nutzungsbedingungen in der Zalo Mini App und autorisieren Sie die Sitzung.

### 4. Gateway neu starten

```bash
openclaw gateway restart
```

## Funktionsweise

Im Gegensatz zum standardmäßigen Zalo-Kanal, für den Sie ein eigenes Zalo Official Account (OA) registrieren und statische Entwickler-Anmeldedaten konfigurieren müssen, ist Zalo ClawBot ein **inhabergebundener persönlicher Assistent** auf gemeinsam genutzter offizieller Infrastruktur:

1. **Onboarding:** Der QR-Code führt zu einer Zalo Mini App, die einen neu bereitgestellten privaten Bot unter einem gemeinsam genutzten offiziellen OA direkt mit Ihrer Zalo-Benutzer-ID verknüpft.
2. **Inhabergebundener Datenschutz:** Der Bot kommuniziert ausschließlich mit seinem Inhaber. Nachrichten anderer Benutzer werden auf Plattformebene verworfen.
3. **Offizieller API-Pfad:** Das Plugin verwendet die APIs der Zalo Bot Platform und keine Browser- oder Websitzungsautomatisierung.

## Technische Funktionsweise

Das Plugin kommuniziert über eine dauerhafte Long-Polling-Schleife (`getUpdates`) mit Zalo. Webhooks sind standardmäßig für lokale Desktop-/Terminal-Ausführungen des Gateways deaktiviert. Nachrichten werden clientseitig verarbeitet und Ihrer lokalen Agentenlaufzeit zugeordnet.

Das Plugin verwaltet die Bot-Anmeldedaten im OpenClaw-Zustandsverzeichnis. Behandeln Sie dieses Verzeichnis als vertraulich und wenden Sie darauf dieselben Richtlinien für Zugriffskontrolle und Sicherung an wie auf den übrigen OpenClaw-Zustand.

Die Laufzeit dieses Plugins befindet sich vollständig im externen Paket `@zalo-platforms/openclaw-zaloclawbot`; die folgenden Verhaltensdetails über Installation und Konfiguration hinaus entsprechen den Angaben der Plugin-Betreuer und wurden nicht anhand des OpenClaw-Core-Quellcodes überprüft.

## Fehlerbehebung

- **Zeitüberschreitung bei der QR-Anmeldung:** Das Anmelde-Token (`zbsk`) läuft aus Sicherheitsgründen nach 5 Minuten ab. Wenn der QR-Code abläuft, bevor Sie ihn scannen, führen Sie den Anmeldebefehl erneut aus, um einen neuen zu generieren.
- **Gateway kann nicht geladen werden:** Vergewissern Sie sich, dass die Version Ihres OpenClaw-Hosts `2026.4.10` oder höher ist. Ältere Versionen unterstützen das Installationsverzeichnis für externe npm-Plugins nicht, das für diese ID erforderlich ist.

## Verwandte Themen

- [Kanalübersicht](/de/channels) - alle unterstützten Kanäle
- [Zalo](/de/channels/zalo) - der gebündelte Kanal für Zalo Bot Creator / Marketplace
- [Kopplung](/de/channels/pairing) - DM-Authentifizierung und Kopplungsablauf
- [Plugins](/de/tools/plugin) - Plugins installieren und verwalten
