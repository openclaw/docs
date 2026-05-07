---
read_when:
    - OpenClaw.app verpakken
    - Debuggen van de macOS Gateway-launchd-service
    - De Gateway-CLI installeren voor macOS
summary: Gateway-runtime op macOS (externe launchd-service)
title: Gateway op macOS
x-i18n:
    generated_at: "2026-05-07T13:22:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf129918c46f8f54026e9db04e8ad5a033148899d3029fe1a362bb14c7f25f8
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app bundelt Node/Bun of de Gateway-runtime niet langer mee. De macOS-app
verwacht een **externe** installatie van de `openclaw` CLI, start de Gateway niet als
childproces en beheert een launchd-service per gebruiker om de Gateway
actief te houden (of koppelt met een bestaande lokale Gateway als er al een draait).

## Installeer de CLI (vereist voor lokale modus)

Node 24 is de standaardruntime op de Mac. Node 22 LTS, momenteel `22.16+`, werkt nog steeds voor compatibiliteit. Installeer daarna `openclaw` globaal:

```bash
npm install -g openclaw@<version>
```

De knop **CLI installeren** in de macOS-app voert dezelfde globale installatiestroom uit die de app
intern gebruikt: eerst wordt npm geprobeerd, daarna pnpm, daarna bun als dat de enige
gedetecteerde pakketbeheerder is. Node blijft de aanbevolen Gateway-runtime.

## Launchd (Gateway als LaunchAgent)

Label:

- `ai.openclaw.gateway` (of `ai.openclaw.<profile>`; legacy `com.openclaw.*` kan blijven bestaan)

Plist-locatie (per gebruiker):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (of `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Beheerder:

- De macOS-app is eigenaar van installatie/update van de LaunchAgent in lokale modus.
- De CLI kan deze ook installeren: `openclaw gateway install`.

Gedrag:

- "OpenClaw actief" schakelt de LaunchAgent in/uit.
- Het afsluiten van de app stopt de gateway **niet** (launchd houdt deze actief).
- Als er al een Gateway draait op de geconfigureerde poort, koppelt de app ermee
  in plaats van een nieuwe te starten.

Logging:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## Versiecompatibiliteit

De macOS-app controleert de gatewayversie ten opzichte van de eigen versie. Als ze
incompatibel zijn, werk dan de globale CLI bij zodat deze overeenkomt met de appversie.

## Smoke-check

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
