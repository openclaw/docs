---
read_when:
    - Begrijpen wat er gebeurt tijdens de eerste uitvoering van de agent
    - Uitleg over waar opstartbestanden staan
    - Identiteitsconfiguratie tijdens het introductieproces debuggen
sidebarTitle: Bootstrapping
summary: Agent-bootstrappingritueel dat de werkruimte en identiteitsbestanden initialiseert
title: Agentinitialisatie
x-i18n:
    generated_at: "2026-04-29T23:19:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: de829f82016ae1e4dcd7714502ca8d11755556fed18b985a7e2bada4149a2d46
    source_path: start/bootstrapping.md
    workflow: 16
---

Opstartinitialisatie is het **eerste-uitvoer**-ritueel dat een agentwerkruimte voorbereidt en
identiteitsgegevens verzamelt. Dit gebeurt na het instapproces, wanneer de agent
voor het eerst start.

## Wat opstartinitialisatie doet

Bij de eerste agentuitvoering initialiseert OpenClaw de werkruimte (standaard
`~/.openclaw/workspace`):

- Plaatst de basisbestanden `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Voert een kort vraag-en-antwoordritueel uit (één vraag tegelijk).
- Schrijft identiteit en voorkeuren naar `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Verwijdert `BOOTSTRAP.md` na afloop, zodat dit slechts één keer wordt uitgevoerd.

Voor ingebedde/lokale modeluitvoeringen houdt OpenClaw `BOOTSTRAP.md` buiten de
bevoorrechte systeemcontext. Bij de primaire interactieve eerste uitvoering geeft het
de bestandsinhoud nog steeds mee in de gebruikersprompt, zodat modellen die niet betrouwbaar de
tool `read` aanroepen het ritueel kunnen voltooien. Als de huidige uitvoering niet veilig toegang heeft tot de
werkruimte, krijgt de agent een beperkte opstartinitialisatienotitie in plaats van een algemene begroeting.

## Opstartinitialisatie overslaan

Voer `openclaw onboard --skip-bootstrap` uit om dit over te slaan voor een vooraf gevulde werkruimte.

## Waar dit wordt uitgevoerd

Opstartinitialisatie wordt altijd uitgevoerd op de **Gateway-host**. Als de macOS-app verbinding maakt met
een externe Gateway, staan de werkruimte en de opstartinitialisatiebestanden op die externe
machine.

<Note>
Wanneer de Gateway op een andere machine draait, bewerk je werkruimtebestanden op de Gateway-
host (bijvoorbeeld `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Gerelateerde documentatie

- Instapproces van de macOS-app: [Instapproces](/nl/start/onboarding)
- Werkruimte-indeling: [Agentwerkruimte](/nl/concepts/agent-workspace)
