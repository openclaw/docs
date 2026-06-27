---
read_when:
    - Je wilt OpenClaw verbinden met een Raft-werkruimte
    - Je configureert een Raft External Agent
    - Je debugt Raft-wake-bezorging
sidebarTitle: Raft
summary: Raft External Agent-ondersteuning via de wake bridge van de Raft CLI
title: Raft
x-i18n:
    generated_at: "2026-06-27T17:12:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

Raft-ondersteuning verbindt een OpenClaw-agent met een Raft Externe Agent via de lokale
Raft CLI. Raft stuurt geauthenticeerde wake-hints naar de Gateway. De agent gebruikt daarna
de Raft CLI om berichten te controleren en te verzenden.

## Installeren

Raft is een officiële externe Plugin. Installeer deze op de Gateway-host:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Details: [Plugins](/nl/tools/plugin)

## Vereisten

- Een Raft-werkruimte met een Externe Agent.
- De Raft CLI geïnstalleerd op dezelfde host als de OpenClaw Gateway.
- Een Raft CLI-profiel dat al is aangemeld en gekoppeld is aan die Externe Agent.

De Plugin slaat geen Raft-referenties op. De Raft CLI bewaart die authenticatie
in zijn eigen profiel.

## Configureren

Stel het profiel in de configuratie in:

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

Voor het standaardaccount kun je in plaats daarvan `RAFT_PROFILE` instellen in de Gateway-
omgeving:

```bash
RAFT_PROFILE=openclaw
```

Gebruik een benoemd account wanneer één Gateway verbinding maakt met meer dan één Raft Externe Agent:

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

De interactieve setup-flow registreert hetzelfde profiel:

```bash
openclaw channels setup raft
```

## Hoe Het Werkt

Wanneer de Gateway start, doet de Plugin het volgende:

1. Opent een HTTP-wake-eindpunt dat alleen via loopback bereikbaar is op een efemere poort.
2. Start `raft --profile <profile> agent bridge` met dat eindpunt en een
   procesgebonden token.
3. Accepteert alleen geauthenticeerde, inhoudsloze wake-hints met een replay-identiteit van de lokale bridge.
4. Vereist één van `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id` of `id`.
5. Dedupliceert recente opnieuw geprobeerde wake-leveringen op bridge-gebeurtenis-id, ook over Gateway-herstarts heen.
6. Retourneert een stabiele runtimesessie voor de huidige bridge en een lege activity-drain-batch voor het Raft CLI-protocol.
7. Start één geserialiseerde OpenClaw-agentbeurt voor elke geaccepteerde wake.

De bridge beheert Raft-leveringspogingen en herverbindingen. De OpenClaw-beurt ontvangt
alleen een wake-melding, geen gekopieerde Raft-berichtinhoud. Hij gebruikt de CLI om
openstaande berichten te lezen en zijn reactie te verzenden:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft is geen normaal transport voor pushberichten. OpenClaw stuurt de definitieve tekst
van het model niet automatisch terug via de bridge, dus de agent moet na het verwerken
van een wake de Raft CLI gebruiken.
</Note>

## Verifiëren

Controleer of OpenClaw de CLI kan vinden en een geconfigureerd profiel heeft:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Stuur daarna een bericht naar de Raft Externe Agent. Het Gateway-logboek zou moeten tonen
dat de Raft-bridge start, gevolgd door een inkomende wake. De agent zou het
geconfigureerde Raft-profiel moeten gebruiken om zijn openstaande berichten te controleren.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Raft CLI ontbreekt">
    Installeer de Raft CLI op de Gateway-host en maak `raft` beschikbaar op het
    `PATH` van de service. Verifieer dit met `raft --help` en herstart daarna de Gateway.
  </Accordion>
  <Accordion title="De bridge sluit onmiddellijk af">
    Controleer of het geconfigureerde profiel is aangemeld en hoort bij de beoogde
    Raft Externe Agent. Voer `raft --profile <profile> agent bridge` rechtstreeks uit
    om de CLI-diagnose te zien.
  </Accordion>
  <Accordion title="Er komt een wake binnen, maar er wordt geen Raft-reactie verzonden">
    Dit is verwacht wanneer de agent de Raft CLI niet aanroept. De wake-
    bridge bevat geen berichtinhoud of automatische definitieve antwoorden. Controleer het
    toolbeleid van de agent en zorg dat deze `raft --profile <profile> message
    check` en `message send` kan uitvoeren.
  </Accordion>
</AccordionGroup>

## Referenties

- [Raft](https://raft.build/)
- [Raft-documentatie](https://docs.raft.build/welcome/)
- [Hermes Raft-integratie](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
