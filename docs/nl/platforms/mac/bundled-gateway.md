---
read_when:
    - OpenClaw.app verpakken
    - Foutopsporing voor de macOS Gateway launchd-service
    - De Gateway-CLI installeren voor macOS
summary: Gateway-runtime op macOS (externe launchd-service)
title: Gateway op macOS
x-i18n:
    generated_at: "2026-07-04T06:42:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app bundelt Node/Bun of de Gateway-runtime niet meer. De macOS-app
verwacht een **externe** installatie van de `openclaw` CLI, start de Gateway niet
als child process, en beheert een launchd-service per gebruiker om de Gateway
actief te houden (of verbindt met een bestaande lokale Gateway als er al een
actief is).

## Automatische setup

Kies op een nieuwe Mac **Deze Mac** tijdens de onboarding. De app voert zijn
ondertekende, gebundelde installer uit vóór de Gateway-wizard, installeert een
Node-runtime in gebruikersruimte en de bijpassende `openclaw` CLI onder
`~/.openclaw`, en installeert en start daarna de launchd-service per gebruiker.
Dit pad vereist geen Terminal, Homebrew of beheerdersrechten.

De app bundelt het installerscript, niet de Node- of Gateway-payload. Setup
heeft daarom een internetverbinding nodig om de runtime en het bijpassende
OpenClaw-pakket te downloaden.

## Handmatig herstel

Node 24 wordt aanbevolen voor een handmatige installatie. Node 22 LTS, momenteel
`22.19+`, werkt ook. Installeer daarna `openclaw` globaal:

```bash
npm install -g openclaw@<version>
```

Gebruik **Setup opnieuw proberen** na een mislukte automatische setup. Als dat
nog steeds mislukt, installeer dan de CLI handmatig met de bovenstaande opdracht
en kies daarna **Opnieuw controleren** in de onboarding. Node blijft de
aanbevolen Gateway-runtime.

## Launchd (Gateway als LaunchAgent)

Label:

- `ai.openclaw.gateway` (of `ai.openclaw.<profile>`; legacy `com.openclaw.*` kan blijven bestaan)

Plist-locatie (per gebruiker):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (of `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Beheerder:

- De macOS-app beheert de installatie/update van LaunchAgent in lokale modus.
- De CLI kan deze ook installeren: `openclaw gateway install`.

Gedrag:

- "OpenClaw actief" schakelt de LaunchAgent in of uit.
- Het afsluiten van de app stopt de gateway **niet** (launchd houdt deze actief).
- Als er al een Gateway actief is op de geconfigureerde poort, verbindt de app
  daarmee in plaats van een nieuwe te starten.

Logging:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log` (profielen gebruiken `gateway-<profile>.log`)
- launchd stderr: onderdrukt

## Versiecompatibiliteit

De macOS-app controleert de Gateway-versie aan de hand van zijn eigen versie.
Onboarding voert automatisch beheerde setup uit wanneer een bestaande CLI
ontbreekt of incompatibel is. Gebruik **Setup opnieuw proberen** om de
installatie te herhalen of **Opnieuw controleren** nadat je een externe CLI hebt
hersteld.

## Statusmap op macOS

Bewaar OpenClaw-status op een lokale, niet-gesynchroniseerde schijf. Vermijd
iCloud Drive en andere cloud-gesynchroniseerde mappen, omdat synchronisatielatentie
en bestandsvergrendelingen sessies, credentials en Gateway-status kunnen
beïnvloeden.

Stel `OPENCLAW_STATE_DIR` alleen in op een lokaal pad wanneer je een override
nodig hebt. `openclaw doctor` waarschuwt voor veelvoorkomende
cloud-gesynchroniseerde statuspaden en raadt aan terug te gaan naar lokale
opslag. Zie
[omgevingsvariabelen](/nl/help/environment#path-related-env-vars) en
[Doctor](/nl/gateway/doctor).

## App-connectiviteit debuggen

Gebruik de macOS-debug-CLI vanuit een source checkout om dezelfde Gateway
WebSocket-handshake en detectielogica uit te voeren die de app gebruikt:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` accepteert `--url`, `--token`, `--timeout` en `--json`. `discover`
accepteert `--timeout`, `--json` en `--include-local`. Vergelijk de
detectie-uitvoer met `openclaw gateway discover --json` wanneer je CLI-detectie
moet scheiden van verbindingsproblemen aan de app-kant.

## Smokecheck

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Daarna:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Gateway-runbook](/nl/gateway)
