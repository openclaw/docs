---
read_when:
    - OpenClaw.app verpakken
    - De macOS-Gateway-launchd-service debuggen
    - De Gateway-CLI voor macOS installeren
summary: Gateway-runtime op macOS (externe launchd-service)
title: Gateway op macOS
x-i18n:
    generated_at: "2026-04-29T22:59:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app bundelt niet langer Node/Bun of de Gateway-runtime. De macOS-app
verwacht een **externe** installatie van de `openclaw` CLI, start de Gateway niet als
childproces en beheert een launchd-service per gebruiker om de Gateway
actief te houden (of koppelt aan een bestaande lokale Gateway als er al een actief is).

## Installeer de CLI (vereist voor lokale modus)

Node 24 is de standaardruntime op de Mac. Node 22 LTS, momenteel `22.14+`, werkt nog steeds voor compatibiliteit. Installeer vervolgens `openclaw` globaal:

```bash
npm install -g openclaw@<version>
```

De knop **Install CLI** van de macOS-app voert dezelfde globale installatiestroom uit die de app
intern gebruikt: deze geeft eerst de voorkeur aan npm, daarna pnpm, daarna bun als dat de enige
gedetecteerde pakketbeheerder is. Node blijft de aanbevolen Gateway-runtime.

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

- “OpenClaw Active” schakelt de LaunchAgent in/uit.
- Het afsluiten van de app stopt de Gateway **niet** (launchd houdt deze actief).
- Als er al een Gateway draait op de geconfigureerde poort, maakt de app er
  verbinding mee in plaats van een nieuwe te starten.

Logboekregistratie:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## Versiecompatibiliteit

De macOS-app controleert de Gateway-versie ten opzichte van de eigen versie. Als ze
incompatibel zijn, werk dan de globale CLI bij zodat deze overeenkomt met de appversie.

## Smokecontrole

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Vervolgens:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Gateway-draaiboek](/nl/gateway)
