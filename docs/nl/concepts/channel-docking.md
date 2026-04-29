---
read_when:
    - Je wilt dat antwoorden voor één actieve sessie van Telegram naar Discord, Slack, Mattermost of een ander gekoppeld kanaal worden verplaatst
    - Je configureert session.identityLinks voor kanaaloverschrijdende directe berichten
    - Een /dock-opdracht meldt dat de afzender niet is gekoppeld of dat er geen actieve sessie bestaat
summary: Verplaats de antwoordroute van één OpenClaw-sessie tussen gekoppelde chatkanalen
title: Kanaal vastzetten
x-i18n:
    generated_at: "2026-04-29T22:36:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: b981cd177ed76194cf18667620a1f9b2f2ba50df42fe203f6f68916971ed6a61
    source_path: concepts/channel-docking.md
    workflow: 16
---

Kanaaldocking is oproepdoorschakeling voor één OpenClaw-sessie.

Het behoudt dezelfde gesprekscontext, maar wijzigt waar toekomstige antwoorden voor
die sessie worden afgeleverd.

## Voorbeeld

Alice kan OpenClaw berichten op Telegram en Discord:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

Als Alice dit vanuit Telegram verzendt:

```text
/dock_discord
```

OpenClaw behoudt de huidige sessiecontext en wijzigt de antwoordroute:

| Vóór docking                | Na `/dock_discord`           |
| --------------------------- | ---------------------------- |
| Antwoorden gaan naar Telegram `123` | Antwoorden gaan naar Discord `456` |

De sessie wordt niet opnieuw aangemaakt. De transcriptgeschiedenis blijft aan
dezelfde sessie gekoppeld.

## Waarom gebruiken

Gebruik docking wanneer een taak in één chat-app begint, maar de volgende
antwoorden ergens anders moeten aankomen.

Veelvoorkomende flow:

1. Start een agenttaak vanuit Telegram.
2. Ga naar Discord, waar je werk coördineert.
3. Verstuur `/dock_discord` vanuit de Telegram-sessie.
4. Behoud dezelfde OpenClaw-sessie, maar ontvang toekomstige antwoorden in Discord.

## Vereiste configuratie

Docking vereist `session.identityLinks`. De bronafzender en doelpeer moeten in
dezelfde identiteitsgroep staan:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

De waarden zijn peer-ID's met kanaalprefix:

| Waarde         | Betekenis                    |
| -------------- | ---------------------------- |
| `telegram:123` | Telegram-afzender-ID `123`   |
| `discord:456`  | Discord-directe-peer-ID `456` |
| `slack:U123`   | Slack-gebruikers-ID `U123`   |

De canonieke sleutel (`alice` hierboven) is alleen de gedeelde naam van de
identiteitsgroep. Dock-commando's gebruiken de waarden met kanaalprefix om te
bewijzen dat de bronafzender en doelpeer dezelfde persoon zijn.

## Commando's

Dock-commando's worden gegenereerd uit geladen kanaal-Plugins die native
commando's ondersteunen. Huidige meegeleverde commando's:

| Doelkanaal | Commando           | Alias              |
| ---------- | ------------------ | ------------------ |
| Discord   | `/dock-discord`    | `/dock_discord`    |
| Mattermost | `/dock-mattermost` | `/dock_mattermost` |
| Slack     | `/dock-slack`      | `/dock_slack`      |
| Telegram  | `/dock-telegram`   | `/dock_telegram`   |

De aliases met underscores zijn handig op native commando-oppervlakken zoals Telegram.

## Wat verandert

Docking werkt de afleveringsvelden van de actieve sessie bij:

| Sessieveld      | Voorbeeld na `/dock_discord`             |
| --------------- | ---------------------------------------- |
| `lastChannel`   | `discord`                                |
| `lastTo`        | `456`                                    |
| `lastAccountId` | het doelkanaalaccount, of `default`      |

Die velden worden opgeslagen in de sessiestore en gebruikt door latere
antwoordaflevering voor die sessie.

## Wat niet verandert

Docking doet niet het volgende:

- kanaalaccounts aanmaken
- een nieuwe Discord-, Telegram-, Slack- of Mattermost-bot verbinden
- toegang verlenen aan een gebruiker
- kanaal-allowlists of DM-beleid omzeilen
- transcriptgeschiedenis naar een andere sessie verplaatsen
- niet-gerelateerde gebruikers een sessie laten delen

Het wijzigt alleen de afleveringsroute voor de huidige sessie.

## Problemen oplossen

**Het commando zegt dat de afzender niet gekoppeld is.**

Voeg zowel de huidige afzender als de doelpeer toe aan dezelfde
`session.identityLinks`-groep. Als Telegram-afzender `123` bijvoorbeeld moet
docken naar Discord-peer `456`, neem dan zowel `telegram:123` als `discord:456`
op.

**Het commando zegt dat er geen actieve sessie bestaat.**

Dock vanuit een bestaande directe-chatsessie. Het commando heeft een actieve
sessievermelding nodig zodat het de nieuwe route kan opslaan.

**Antwoorden gaan nog steeds naar het oude kanaal.**

Controleer of het commando met een succesbericht heeft geantwoord en bevestig
dat de doelpeer-ID overeenkomt met de ID die door dat kanaal wordt gebruikt.
Docking wijzigt alleen de actieve sessieroute; een andere sessie kan nog steeds
ergens anders naartoe routeren.

**Ik moet terugschakelen.**

Verstuur het bijbehorende commando voor het oorspronkelijke kanaal, zoals
`/dock_telegram` of `/dock-telegram`, vanuit een gekoppelde afzender.
