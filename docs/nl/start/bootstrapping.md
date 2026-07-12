---
read_when:
    - Begrijpen wat er gebeurt wanneer de agent voor het eerst wordt uitgevoerd
    - Uitleg over waar bootstrapbestanden zich bevinden
    - Identiteitsconfiguratie tijdens onboarding debuggen
sidebarTitle: Bootstrapping
summary: Opstartritueel voor de agent dat de werkruimte- en identiteitsbestanden initialiseert
title: Agentinitialisatie
x-i18n:
    generated_at: "2026-07-12T09:26:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

Bootstrapping is het eenmalige ritueel bij de eerste uitvoering dat een nieuwe agentwerkruimte initialiseert en
de agent begeleidt bij het kiezen van een identiteit. Het wordt eenmaal uitgevoerd, direct na
de onboarding, tijdens de eerste echte beurt van de agent.

## Wat gebeurt er

Bij de eerste uitvoering met een volledig nieuwe werkruimte (standaard `~/.openclaw/workspace`)
voert OpenClaw het volgende uit:

- Initialiseert `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` en `BOOTSTRAP.md`.
- Laat de agent `BOOTSTRAP.md` volgen: een vrij gesprek (geen vast vraag-en-antwoordformulier) om een naam, persoonlijkheid en uitstraling te bepalen.
- Schrijft wat de agent leert naar `IDENTITY.md`, `USER.md` en `SOUL.md`.
- Verwijdert `BOOTSTRAP.md` zodra de werkruimte geconfigureerd lijkt, zodat het ritueel slechts eenmaal wordt uitgevoerd.

Een werkruimte geldt als geconfigureerd zodra `SOUL.md`, `IDENTITY.md` of `USER.md`
afwijkt van de beginsjabloon, of wanneer er een map `memory/` bestaat.

<Note>
`BOOTSTRAP.md` omvat het volledige identiteitsgesprek. Bekijk de inhoud in de
[BOOTSTRAP.md-sjabloon](/nl/reference/templates/BOOTSTRAP).
</Note>

## Uitvoeringen met ingebedde en lokale modellen

Bij uitvoeringen met ingebedde of lokale modellen houdt OpenClaw `BOOTSTRAP.md` buiten de
bevoorrechte systeemcontext. Tijdens de primaire interactieve eerste uitvoering geeft het
de inhoud van het bestand nog steeds door via de gebruikersprompt, zodat modellen die de
tool `read` niet betrouwbaar aanroepen het ritueel toch kunnen voltooien. Als de huidige
uitvoering geen veilige toegang tot de werkruimte heeft, krijgt de agent een korte, beperkte
bootstrapmelding in plaats van een algemene begroeting.

## Bootstrapping overslaan

Voer het volgende uit om dit voor een vooraf geïnitialiseerde werkruimte over te slaan:

```bash
openclaw onboard --skip-bootstrap
```

## Waar het wordt uitgevoerd

Bootstrapping wordt altijd uitgevoerd op de Gateway-host. Als de macOS-app verbinding maakt met een
externe Gateway, bevinden de werkruimte en de bootstrapbestanden zich op die externe
machine, niet op de Mac.

<Note>
Wanneer de Gateway op een andere machine wordt uitgevoerd, bewerk je de werkruimtebestanden op de Gateway-
host (bijvoorbeeld `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Gerelateerde documentatie

- Onboarding voor de macOS-app: [Onboarding](/nl/start/onboarding)
- Indeling van de werkruimte: [Agentwerkruimte](/nl/concepts/agent-workspace)
- Inhoud van de sjabloon: [BOOTSTRAP.md-sjabloon](/nl/reference/templates/BOOTSTRAP)
