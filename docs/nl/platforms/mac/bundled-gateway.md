---
read_when:
    - OpenClaw.app verpakken
    - De macOS Gateway-launchd-service debuggen
    - De Gateway-CLI installeren voor macOS
summary: Gateway-runtime op macOS (externe launchd-service)
title: Gateway op macOS
x-i18n:
    generated_at: "2026-05-06T09:22:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f5dcc73671140d7599ffefceeb98ac7ce34da1f944c1e7c70bc9e5810e6ca66
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app bundelt Node/Bun of de Gateway-runtime niet meer. De macOS-app
verwacht een **externe** installatie van de `openclaw` CLI, start de Gateway niet als
onderliggend proces en beheert een launchd-service per gebruiker om de Gateway
actief te houden (of koppelt aan een bestaande lokale Gateway als die al draait).

## Installeer de CLI (vereist voor lokale modus)

Node 24 is de standaardruntime op de Mac. Node 22 LTS, momenteel `22.14+`, werkt nog steeds voor compatibiliteit. Installeer daarna `openclaw` globaal:

```bash
npm install -g openclaw@<version>
```

De knop **CLI installeren** in de macOS-app voert dezelfde globale installatiestroom uit die de app
intern gebruikt: eerst wordt npm geprobeerd, daarna pnpm, en daarna bun als dat de enige
gedetecteerde pakketbeheerder is. Node blijft de aanbevolen Gateway-runtime.

## Launchd (Gateway als LaunchAgent)

Label:

- `ai.openclaw.gateway` (of `ai.openclaw.<profile>`; verouderde `com.openclaw.*` kan blijven bestaan)

Plist-locatie (per gebruiker):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (of `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Beheerder:

- De macOS-app beheert installatie/bijwerking van de LaunchAgent in lokale modus.
- De CLI kan deze ook installeren: `openclaw gateway install`.

Gedrag:

- "OpenClaw actief" schakelt de LaunchAgent in of uit.
- Het afsluiten van de app stopt de gateway **niet** (launchd houdt deze actief).
- Als er al een Gateway draait op de geconfigureerde poort, koppelt de app daaraan
  in plaats van een nieuwe te starten.

Logboekregistratie:

- stdout/err van launchd: `/tmp/openclaw/openclaw-gateway.log`

## Versiecompatibiliteit

De macOS-app controleert de gatewayversie ten opzichte van de eigen versie. Als deze
niet compatibel zijn, werk dan de globale CLI bij zodat deze overeenkomt met de appversie.

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
