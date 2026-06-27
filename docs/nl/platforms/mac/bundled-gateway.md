---
read_when:
    - OpenClaw.app verpakken
    - Foutopsporing van de macOS Gateway-launchd-service
    - De Gateway-CLI voor macOS installeren
summary: Gateway-runtime op macOS (externe launchd-service)
title: Gateway op macOS
x-i18n:
    generated_at: "2026-06-27T17:47:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c55e3d24e5bc743233e11be4897f4f2a865c97f2e0d795a472caeb6d097d34
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app bundelt Node/Bun of de Gateway-runtime niet meer. De macOS-app
verwacht een **externe** installatie van de `openclaw` CLI, start de Gateway niet als
child process en beheert een launchd-service per gebruiker om de Gateway
actief te houden (of maakt verbinding met een bestaande lokale Gateway als er al een draait).

## Installeer de CLI (vereist voor lokale modus)

Node 24 is de standaardruntime op de Mac. Node 22 LTS, momenteel `22.19+`, werkt nog steeds voor compatibiliteit. Installeer daarna `openclaw` globaal:

```bash
npm install -g openclaw@<version>
```

De knop **CLI installeren** van de macOS-app voert dezelfde globale installatiestroom uit die de app
intern gebruikt: eerst npm, daarna pnpm, daarna bun als dat de enige
gedetecteerde package manager is. Node blijft de aanbevolen Gateway-runtime.

## Launchd (Gateway als LaunchAgent)

Label:

- `ai.openclaw.gateway` (of `ai.openclaw.<profile>`; legacy `com.openclaw.*` kan blijven bestaan)

Plist-locatie (per gebruiker):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (of `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Beheerder:

- De macOS-app beheert installatie/update van LaunchAgent in lokale modus.
- De CLI kan deze ook installeren: `openclaw gateway install`.

Gedrag:

- "OpenClaw actief" schakelt de LaunchAgent in/uit.
- Het afsluiten van de app stopt de gateway **niet** (launchd houdt deze actief).
- Als er al een Gateway draait op de geconfigureerde poort, maakt de app daar
  verbinding mee in plaats van een nieuwe te starten.

Logging:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log` (profielen gebruiken `gateway-<profile>.log`)
- launchd stderr: onderdrukt

## Versiecompatibiliteit

De macOS-app controleert de gatewayversie ten opzichte van de eigen versie. Als ze
incompatibel zijn, werk dan de globale CLI bij zodat deze overeenkomt met de appversie.

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
