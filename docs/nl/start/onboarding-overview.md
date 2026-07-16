---
read_when:
    - Een onboardingstraject kiezen
    - Een nieuwe omgeving instellen
sidebarTitle: Onboarding Overview
summary: Overzicht van de onboardingopties en -processen van OpenClaw
title: Overzicht van de onboarding
x-i18n:
    generated_at: "2026-07-16T16:28:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4bcda1dcfb91f388ca6bef59f9bdf5177571d93c0d89c45025ef837628fa7ba0
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw biedt onboarding via de terminal en de macOS-app. Beide stellen eerst inferentie in:
ze detecteren bestaande AI-toegang, vereisen een live voltooiing en starten pas daarna
OpenClaw om de resterende installatie te configureren. Een bereikbare, geconfigureerde Gateway
waarvan de standaardagent al een geconfigureerd model heeft, slaat de onboarding over en opent
de normale agentinterface. De terminalprocedure biedt ook de volledige klassieke wizard voor
gedetailleerde configuratie.

## Welk traject moet ik gebruiken?

|                 | CLI-onboarding                         | Onboarding via de macOS-app    |
| --------------- | -------------------------------------- | ------------------------------ |
| **Platformen**  | macOS, Linux, Windows (native of WSL2) | Alleen macOS                   |
| **Interface**   | Inferentie instellen, daarna OpenClaw  | Inferentie instellen, daarna OpenClaw |
| **Meest geschikt voor** | Servers, headless gebruik, volledige controle | Desktop-Mac, visuele configuratie |
| **Automatisering** | `--non-interactive` voor scripts     | Alleen handmatig               |
| **Opdracht**    | `openclaw onboard`                     | Start de app                   |

De meeste gebruikers kunnen het beste beginnen met **CLI-onboarding** — dit werkt overal en geeft
je de meeste controle.

## Wat onboarding configureert

De begeleide inferentiefase stelt alleen het volgende in:

1. **Modelprovider en authenticatie** — gedetecteerde toegang of een geverifieerde aanmelding bij een provider,
   API-sleutel of token
2. **Geverifieerde inferentie** — een echte voltooiing met het effectieve
   model van de standaardagent

Nadat die voltooiing slaagt, kan OpenClaw de werkruimte, Gateway,
Gateway-service, kanalen, agents, plugins en andere optionele functies configureren.

De klassieke CLI-wizard kan daarnaast het volgende configureren:

1. **Kanalen** (optioneel) — ingebouwde en meegeleverde chatkanalen zoals
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp en meer
2. **Geavanceerde Gateway-bediening** — externe modus, netwerkinstellingen en daemonkeuzes

## CLI-onboarding

Voer dit uit in een willekeurige terminal:

```bash
openclaw onboard
```

De begeleide procedure detecteert bestaande AI-toegang, test kandidaten live in de juiste volgorde
en gaat bij een fout door naar de volgende optie. Als alle detectieopties zijn uitgeput, toont deze eerst OpenAI,
Anthropic, xAI (Grok), Google en OpenRouter. **Meer…** bevat de
overige providers in providergroepen, met regio's, abonnementen en ondersteunde
browser-, apparaat-, API-sleutel- of tokenmethoden in een tweede menu. Het model
en de referentie worden pas na een geslaagde voltooiing opgeslagen, waarna OpenClaw wordt gestart om
de werkruimte, Gateway, kanalen, agents, plugins en andere optionele
functies te configureren. **Voorlopig overslaan** sluit af zonder OpenClaw te starten. Er is geen
overdracht naar de klassieke wizard binnen de procedure; sluit af en voer `openclaw onboard --classic` uit wanneer je
in plaats daarvan de klassieke wizard wilt gebruiken.

Nadat inferentie slaagt, kan OpenClaw de kanaalconfiguratie overdragen aan een gemaskeerde terminalwizard.
Deze opent geen begeleide of klassieke providerconfiguratie; sluit OpenClaw af en
voer `openclaw onboard` uit om de modelprovider of de authenticatie ervan te wijzigen.

Gebruik `openclaw onboard --classic` voor gedetailleerde model-/authenticatie-, kanaal-, skill-,
externe Gateway- of importconfiguratie. Door ook `--install-daemon` toe te voegen, selecteer je
de klassieke procedure en installeer je de achtergrondservice in één stap. Gebruik `openclaw
openclaw` voor conversationele configuratie en reparatie zonder inferentie. `openclaw
onboard --modern` is een compatibiliteitsalias die dezelfde live-inferentiepoort
gebruikt.

Volledige referentie: [Onboarding (CLI)](/nl/start/wizard)
Documentatie voor CLI-opdrachten: [`openclaw onboard`](/nl/cli/onboard)

## Onboarding via de macOS-app

Open de OpenClaw-app. Als de geconfigureerde lokale of externe Gateway bereikbaar is
en de standaardagent al een geconfigureerd model heeft, slaat de app de onboarding
en OpenClaw over en opent deze onmiddellijk de normale agentinterface.

Voor een nieuwe of onvolledige Gateway detecteert de procedure bij de eerste start bestaande AI-
toegang (Claude Code, Codex of API-sleutels), test deze de beste
optie live en slaat deze die pas op na een echt antwoord — met automatische
terugval en een geverifieerde handmatige API-sleutelstap wanneer niets wordt gevonden. Gevoelige
referenties gebruiken gemaskeerde invoer. Zodra inferentie slaagt, wordt OpenClaw gestart en
helpt het de rest te configureren.

Gemini CLI blijft na de configuratie beschikbaar voor normale agents, maar wordt niet
aangeboden voor deze inferentiepoort omdat het de probe zonder tools niet kan afdwingen.

Volledige referentie: [Onboarding (macOS-app)](/nl/start/onboarding)

## Aangepaste of niet-vermelde providers

Als je provider niet wordt vermeld, voer je `openclaw onboard --classic` uit, kies je
**Aangepaste provider** en voer je het volgende in:

- Endpointcompatibiliteit: OpenAI-compatibel (`/chat/completions`), compatibel met OpenAI Responses (`/responses`), Anthropic-compatibel (`/messages`) of onbekend (test alle drie en detecteert automatisch)
- Basis-URL en API-sleutel (de API-sleutel is optioneel als het endpoint er geen vereist)
- Model-ID en optionele modelalias

Er kunnen meerdere aangepaste endpoints naast elkaar bestaan — elk krijgt een eigen endpoint-ID.

## Gerelateerd

- [Aan de slag](/nl/start/getting-started)
- [Referentie voor CLI-configuratie](/nl/start/wizard-cli-reference)
