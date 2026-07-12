---
read_when:
    - Een onboardingtraject kiezen
    - Een nieuwe omgeving instellen
sidebarTitle: Onboarding Overview
summary: Overzicht van de onboardingopties en -processen van OpenClaw
title: Overzicht van de introductie
x-i18n:
    generated_at: "2026-07-12T09:19:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3460887108dc078c963802a32238133814afcc7d36b27eb4760280328ee070e5
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw biedt onboarding via de terminal en de macOS-app. Beide stellen eerst inferentie in:
ze detecteren bestaande AI-toegang, vereisen een live voltooiing en starten pas daarna
Crestodian om de resterende configuratie in te stellen. Een bereikbare, geconfigureerde Gateway
waarvan de standaardagent al een geconfigureerd model heeft, slaat de onboarding over en opent
de normale agentinterface. De terminalprocedure biedt ook de volledige klassieke wizard voor
gedetailleerde configuratie.

## Welk traject moet ik gebruiken?

|                   | CLI-onboarding                           | Onboarding via de macOS-app       |
| ----------------- | ---------------------------------------- | --------------------------------- |
| **Platformen**    | macOS, Linux, Windows (native of via WSL2) | Alleen macOS                    |
| **Interface**     | Inferentie instellen, daarna Crestodian  | Inferentie instellen, daarna Crestodian |
| **Meest geschikt voor** | Servers, headless gebruik, volledige controle | Desktop-Mac, visuele configuratie |
| **Automatisering** | `--non-interactive` voor scripts        | Alleen handmatig                  |
| **Opdracht**      | `openclaw onboard`                       | Start de app                      |

De meeste gebruikers kunnen het beste beginnen met **CLI-onboarding** — dit werkt overal en geeft
je de meeste controle.

## Wat onboarding configureert

De begeleide inferentiefase stelt alleen het volgende in:

1. **Modelprovider en authenticatie** — gedetecteerde toegang of een geverifieerde API-sleutel
2. **Geverifieerde inferentie** — een echte voltooiing met het effectieve
   model van de standaardagent

Nadat die voltooiing is geslaagd, kan Crestodian de werkruimte, Gateway,
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

De begeleide procedure detecteert bestaande AI-toegang, test kandidaten live in de juiste volgorde,
gaat bij een fout door naar de volgende en biedt gemaskeerde handmatige invoer van een sleutel. Het model
en de referentie worden pas opgeslagen na een geslaagde voltooiing. Daarna start Crestodian
om de werkruimte, Gateway, kanalen, agents, plugins en andere
optionele functies te configureren. Er is geen Crestodian vóór inferentie, geen traject om AI over te slaan en
geen overdracht naar de klassieke wizard binnen de procedure. Sluit af en voer `openclaw onboard --classic` uit wanneer je
in plaats daarvan de klassieke wizard wilt gebruiken.

Nadat de inferentie is geslaagd, kan Crestodian de kanaalconfiguratie overdragen aan een gemaskeerde terminalwizard.
Deze opent geen begeleide of klassieke providerconfiguratie; sluit Crestodian af en
voer `openclaw onboard` uit om de modelprovider of de authenticatie daarvan te wijzigen.

Gebruik `openclaw onboard --classic` voor gedetailleerde configuratie van model/authenticatie, kanalen, Skills,
een externe Gateway of importinstellingen. Door `--install-daemon` toe te voegen, wordt ook de
klassieke procedure geselecteerd en wordt de achtergrondservice in één stap geïnstalleerd. Gebruik `openclaw
crestodian` voor conversationele configuratie en herstel die niet met inferentie te maken hebben. `openclaw
onboard --modern` is een compatibiliteitsalias die dezelfde live-inferentiepoort
gebruikt.

Volledige referentie: [Onboarding (CLI)](/nl/start/wizard)
Documentatie voor de CLI-opdracht: [`openclaw onboard`](/nl/cli/onboard)

## Onboarding via de macOS-app

Open de OpenClaw-app. Als de geconfigureerde lokale of externe Gateway bereikbaar is
en de standaardagent al een geconfigureerd model heeft, slaat de app de onboarding
en Crestodian over en opent deze onmiddellijk de normale agentinterface.

Bij een nieuwe of onvolledige Gateway detecteert de procedure voor de eerste start bestaande AI-
toegang (Claude Code, Codex of API-sleutels), test de beste
optie live en slaat deze pas op na een echt antwoord — met een automatische terugval
en een geverifieerde handmatige stap voor een API-sleutel wanneer er niets wordt gevonden. Gevoelige
inloggegevens worden gemaskeerd ingevoerd. Zodra de inferentie is geslaagd, start Crestodian en
helpt deze de rest te configureren.

Gemini CLI blijft na de configuratie beschikbaar voor normale agents, maar wordt niet
aangeboden voor deze inferentiepoort, omdat hiermee de proef zonder tools niet kan worden afgedwongen.

Volledige referentie: [Onboarding (macOS-app)](/nl/start/onboarding)

## Aangepaste of niet-vermelde providers

Als je provider niet wordt vermeld, voer je `openclaw onboard --classic` uit, kies je
**Aangepaste provider** en voer je het volgende in:

- Endpointcompatibiliteit: compatibel met OpenAI (`/chat/completions`), compatibel met OpenAI Responses (`/responses`), compatibel met Anthropic (`/messages`) of onbekend (probeert alle drie en detecteert dit automatisch)
- Basis-URL en API-sleutel (de API-sleutel is optioneel als het endpoint er geen vereist)
- Model-ID en optionele modelalias

Er kunnen meerdere aangepaste endpoints naast elkaar bestaan — elk krijgt een eigen endpoint-ID.

## Gerelateerd

- [Aan de slag](/nl/start/getting-started)
- [Referentie voor CLI-configuratie](/nl/start/wizard-cli-reference)
