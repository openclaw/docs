---
read_when:
    - Een onboardingtraject kiezen
    - Een nieuwe omgeving instellen
sidebarTitle: Onboarding Overview
summary: Overzicht van OpenClaw-onboardingopties en -stromen
title: Overzicht van de ingebruikname
x-i18n:
    generated_at: "2026-05-11T20:50:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9b375b9090250992b9deead25ae6502592cb63c9774204782b2d4f69d8f3395
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw heeft twee insteltrajecten. Beide configureren authenticatie, de Gateway en
optionele chatkanalen — ze verschillen alleen in hoe je de configuratie doorloopt.

## Welk traject moet ik gebruiken?

|                | CLI-insteltraject                      | insteltraject via macOS-app |
| -------------- | -------------------------------------- | --------------------------- |
| **Platforms**  | macOS, Linux, Windows (native of WSL2) | alleen macOS                |
| **Interface**  | Terminalwizard                         | Begeleide UI in de app      |
| **Het beste voor** | Servers, headless, volledige controle | Desktop-Mac, visuele configuratie |
| **Automatisering** | `--non-interactive` voor scripts    | Alleen handmatig            |
| **Command**    | `openclaw onboard`                     | Start de app                |

De meeste gebruikers kunnen het beste beginnen met het **CLI-insteltraject** — het werkt overal en geeft
je de meeste controle.

## Wat het insteltraject configureert

Ongeacht welk traject je kiest, stelt het insteltraject het volgende in:

1. **Modelprovider en authenticatie** — API-sleutel, OAuth of configuratietoken voor je gekozen provider
2. **Werkruimte** — map voor agentbestanden, bootstrap-sjablonen en geheugen
3. **Gateway** — poort, bindadres, authenticatiemodus
4. **Kanalen** (optioneel) — ingebouwde en meegeleverde chatkanalen zoals
   iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp en meer
5. **Daemon** (optioneel) — achtergrondservice zodat de Gateway automatisch start

## CLI-insteltraject

Voer uit in een willekeurige terminal:

```bash
openclaw onboard
```

Voeg `--install-daemon` toe om ook de achtergrondservice in één stap te installeren.

Volledige referentie: [Insteltraject (CLI)](/nl/start/wizard)
CLI-commandodocumentatie: [`openclaw onboard`](/nl/cli/onboard)

## Insteltraject via macOS-app

Open de OpenClaw-app. De wizard bij de eerste keer starten leidt je door dezelfde stappen
met een visuele interface.

Volledige referentie: [Insteltraject (macOS-app)](/nl/start/onboarding)

## Aangepaste of niet-vermelde providers

Als je provider niet in het insteltraject staat, kies je **Aangepaste provider** en
voer je het volgende in:

- API-compatibiliteitsmodus (OpenAI-compatibel, Anthropic-compatibel of automatisch detecteren)
- Basis-URL en API-sleutel
- Model-ID en optionele alias

Meerdere aangepaste eindpunten kunnen naast elkaar bestaan — elk krijgt een eigen eindpunt-ID.

## Gerelateerd

- [Aan de slag](/nl/start/getting-started)
- [CLI-configuratiereferentie](/nl/start/wizard-cli-reference)
