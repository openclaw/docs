---
read_when:
    - Een introductietraject kiezen
    - Een nieuwe omgeving instellen
sidebarTitle: Onboarding Overview
summary: Overzicht van OpenClaw-onboardingopties en -processen
title: Overzicht van de introductie
x-i18n:
    generated_at: "2026-04-29T23:19:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a161e504f94c633873a497dd97c971ebfed6f31ef23a3fe9e85eec5a06d1d97
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw heeft twee onboardingpaden. Beide configureren auth, de Gateway en
optionele chatkanalen; ze verschillen alleen in hoe je met de installatie werkt.

## Welk pad moet ik gebruiken?

|                | CLI-onboarding                         | macOS-app-onboarding      |
| -------------- | -------------------------------------- | ------------------------- |
| **Platformen** | macOS, Linux, Windows (native of WSL2) | alleen macOS              |
| **Interface**  | Terminalwizard                         | Begeleide UI in de app    |
| **Beste voor** | Servers, headless, volledige controle  | Desktop-Mac, visuele installatie |
| **Automatisering** | `--non-interactive` voor scripts    | Alleen handmatig          |
| **Commando**   | `openclaw onboard`                     | Start de app              |

De meeste gebruikers kunnen het best beginnen met **CLI-onboarding**; die werkt overal en geeft
je de meeste controle.

## Wat onboarding configureert

Ongeacht welk pad je kiest, stelt onboarding het volgende in:

1. **Modelprovider en auth** — API-sleutel, OAuth of installatietoken voor je gekozen provider
2. **Werkruimte** — map voor agentbestanden, bootstrap-sjablonen en geheugen
3. **Gateway** — poort, bindadres, auth-modus
4. **Kanalen** (optioneel) — ingebouwde en gebundelde chatkanalen zoals
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp en meer
5. **Daemon** (optioneel) — achtergrondservice zodat de Gateway automatisch start

## CLI-onboarding

Voer uit in een terminal:

```bash
openclaw onboard
```

Voeg `--install-daemon` toe om ook de achtergrondservice in één stap te installeren.

Volledige referentie: [Onboarding (CLI)](/nl/start/wizard)
CLI-commandodocumentatie: [`openclaw onboard`](/nl/cli/onboard)

## macOS-app-onboarding

Open de OpenClaw-app. De wizard voor de eerste start begeleidt je door dezelfde stappen
met een visuele interface.

Volledige referentie: [Onboarding (macOS-app)](/nl/start/onboarding)

## Aangepaste of niet-vermelde providers

Als je provider niet in onboarding staat, kies je **Aangepaste provider** en
voer je het volgende in:

- API-compatibiliteitsmodus (OpenAI-compatibel, Anthropic-compatibel of automatisch detecteren)
- Basis-URL en API-sleutel
- Model-ID en optionele alias

Meerdere aangepaste endpoints kunnen naast elkaar bestaan; elk krijgt een eigen endpoint-ID.

## Gerelateerd

- [Aan de slag](/nl/start/getting-started)
- [CLI-installatiereferentie](/nl/start/wizard-cli-reference)
