---
read_when:
    - OpenClaw.app verpakken
    - De macOS Gateway-launchd-service debuggen
    - De gateway-CLI voor macOS installeren
summary: Gateway-runtime op macOS (externe launchd-service)
title: Gateway op macOS
x-i18n:
    generated_at: "2026-06-28T00:12:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app bundelt Node/Bun of de Gateway-runtime niet meer. De macOS-app
verwacht een **externe** `openclaw` CLI-installatie, start de Gateway niet als een
onderliggend proces en beheert een launchd-service per gebruiker om de Gateway
draaiend te houden (of verbindt met een bestaande lokale Gateway als er al een draait).

## Installeer de CLI (vereist voor lokale modus)

Node 24 is de standaardruntime op de Mac. Node 22 LTS, momenteel `22.19+`, werkt nog steeds voor compatibiliteit. Installeer daarna `openclaw` globaal:

```bash
npm install -g openclaw@<version>
```

De knop **CLI installeren** van de macOS-app voert dezelfde globale installatiestroom uit die de app
intern gebruikt: eerst npm, daarna pnpm, en daarna bun als dat de enige
gedetecteerde pakketbeheerder is. Node blijft de aanbevolen Gateway-runtime.

## Launchd (Gateway als LaunchAgent)

Label:

- `ai.openclaw.gateway` (of `ai.openclaw.<profile>`; legacy `com.openclaw.*` kan blijven bestaan)

Plist-locatie (per gebruiker):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (of `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Beheerder:

- De macOS-app beheert de installatie/update van de LaunchAgent in lokale modus.
- De CLI kan deze ook installeren: `openclaw gateway install`.

Gedrag:

- "OpenClaw Active" schakelt de LaunchAgent in/uit.
- Het afsluiten van de app stopt de gateway **niet** (launchd houdt deze actief).
- Als er al een Gateway draait op de geconfigureerde poort, verbindt de app ermee
  in plaats van een nieuwe te starten.

Logging:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log` (profielen gebruiken `gateway-<profile>.log`)
- launchd stderr: onderdrukt

## Versiecompatibiliteit

De macOS-app controleert de gatewayversie ten opzichte van zijn eigen versie. Als ze
incompatibel zijn, werk dan de globale CLI bij zodat deze overeenkomt met de appversie.

## Statusmap op macOS

Bewaar de OpenClaw-status op een lokale, niet-gesynchroniseerde schijf. Vermijd iCloud Drive en andere
cloudgesynchroniseerde mappen, omdat synchronisatielatentie en bestandsvergrendelingen sessies,
referenties en Gateway-status kunnen beïnvloeden.

Stel `OPENCLAW_STATE_DIR` alleen in op een lokaal pad wanneer je een overschrijving nodig hebt.
`openclaw doctor` waarschuwt voor veelvoorkomende cloudgesynchroniseerde statuspaden en raadt aan
terug te gaan naar lokale opslag. Zie
[omgevingsvariabelen](/nl/help/environment#path-related-env-vars) en
[Doctor](/nl/gateway/doctor).

## Debug app-connectiviteit

Gebruik de macOS-debug-CLI vanuit een source checkout om dezelfde Gateway-
WebSocket-handshake en ontdekkingslogica uit te oefenen die de app gebruikt:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` accepteert `--url`, `--token`, `--timeout` en `--json`. `discover`
accepteert `--timeout`, `--json` en `--include-local`. Vergelijk de ontdekkingsuitvoer
met `openclaw gateway discover --json` wanneer je CLI-ontdekking moet onderscheiden
van verbindingsproblemen aan app-zijde.

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
