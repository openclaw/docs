---
read_when:
    - Je wilt OpenClaw verbinden met een Raft-werkruimte
    - U configureert een externe Raft-agent
    - Je debugt de Raft-wakelevering
sidebarTitle: Raft
summary: Ondersteuning voor externe Raft-agenten via de wake-bridge van de Raft CLI
title: Raft
x-i18n:
    generated_at: "2026-07-12T08:37:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft verbindt een OpenClaw-agent via de lokale Raft CLI met een externe Raft-agent.
Raft stuurt geauthenticeerde weksignalen naar de Gateway; de agent gebruikt
vervolgens de Raft CLI om berichten te controleren en te verzenden. Alleen
directe chats (geen groepen).

## Installeren

Raft is een officiële externe Plugin. Installeer deze op de Gateway-host:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Details: [Plugins](/nl/tools/plugin)

## Vereisten

- Een Raft-werkruimte met een externe agent.
- De Raft CLI geïnstalleerd op dezelfde host als de OpenClaw Gateway en
  beschikbaar via het `PATH` van de service.
- Een Raft CLI-profiel dat al is aangemeld en aan die externe agent is
  gekoppeld.

De Plugin slaat geen Raft-aanmeldgegevens op; de Raft CLI bewaart die
authenticatie in zijn eigen profiel.

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

Voor het standaardaccount kunt u in plaats daarvan `RAFT_PROFILE` instellen
in de Gateway-omgeving:

```bash
RAFT_PROFILE=openclaw
```

Gebruik een benoemd account wanneer één Gateway verbinding maakt met meer dan
één externe Raft-agent:

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

De interactieve configuratie registreert hetzelfde profiel:

```bash
openclaw channels add --channel raft
```

## Werking

Wanneer de Gateway wordt gestart, voert de Plugin het volgende uit:

1. Opent een HTTP-eindpunt voor weksignalen op een tijdelijke poort dat alleen
   via local loopback bereikbaar is.
2. Start `raft --profile <profile> agent bridge` met dat eindpunt en een token
   per proces.
3. Accepteert van de lokale bridge uitsluitend geauthenticeerde,
   inhoudsloze weksignalen met een identiteit ter voorkoming van herhaling.
4. Vereist bij elke wekpayload een van `eventId`, `attemptId`, `messageId`,
   `delivery_id`, `wake_id` of `id`.
5. Ontdubbelt opnieuw aangeboden weksignalen gedurende 24 uur op basis van de
   gebeurtenis-ID van de bridge, ook na herstarts van de Gateway.
6. Retourneert een stabiele runtimesessie voor de huidige bridge en een lege
   batch voor het ophalen van activiteiten voor het Raft CLI-protocol.
7. Start per geaccepteerd weksignaal één geserialiseerde uitvoeringsbeurt van
   de OpenClaw-agent.

De bridge beheert nieuwe afleverpogingen en herverbindingen voor Raft. De
OpenClaw-uitvoeringsbeurt ontvangt alleen een wekbericht en geen gekopieerde
inhoud van een Raft-bericht. De agent gebruikt de CLI om wachtende berichten te
lezen en zijn antwoord te verzenden:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft is geen transportmechanisme voor pushberichten. OpenClaw stuurt de uiteindelijke tekst van het model niet automatisch terug via de bridge. Daarom moet de agent na verwerking van een weksignaal de Raft CLI gebruiken.
</Note>

## Verifiëren

Controleer of OpenClaw de CLI kan vinden en of er een profiel is geconfigureerd:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Stuur vervolgens een bericht naar de externe Raft-agent. In het Gateway-logboek
moet eerst worden weergegeven dat de Raft-bridge wordt gestart, gevolgd door
een binnenkomend weksignaal. De agent moet het geconfigureerde Raft-profiel
gebruiken om zijn wachtende berichten te controleren.

## Problemen oplossen

<AccordionGroup>
  <Accordion title="De Raft CLI ontbreekt">
    Installeer de Raft CLI op de Gateway-host en zorg dat `raft` beschikbaar is
    via het `PATH` van de service. Controleer dit met `raft --help` en start
    vervolgens de Gateway opnieuw.
  </Accordion>
  <Accordion title="De bridge wordt onmiddellijk afgesloten">
    Controleer of het geconfigureerde profiel is aangemeld en bij de beoogde
    externe Raft-agent hoort. Voer `raft --profile <profile> agent bridge`
    rechtstreeks uit om de diagnose van de CLI te bekijken.
  </Accordion>
  <Accordion title="Er komt een weksignaal binnen, maar er wordt geen Raft-antwoord verzonden">
    Dit is te verwachten wanneer de agent de Raft CLI niet aanroept. De
    wekbridge bevat geen berichtinhoud of automatische definitieve antwoorden.
    Controleer het toolbeleid van de agent en zorg dat deze `raft --profile
    <profile> message check` en `message send` kan uitvoeren.
  </Accordion>
</AccordionGroup>

## Verwijzingen

- [Raft](https://raft.build/)
- [Raft-documentatie](https://docs.raft.build/welcome/)
- [Hermes-integratie met Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
