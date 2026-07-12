---
read_when:
    - Je wilt dat antwoorden voor één actieve sessie worden verplaatst van Telegram naar Discord, Slack, Mattermost of een ander gekoppeld kanaal
    - U configureert session.identityLinks voor kanaaloverschrijdende directe berichten
    - Een /dock-opdracht meldt dat de afzender niet is gekoppeld of dat er geen actieve sessie bestaat
summary: Verplaats de antwoordroute van één OpenClaw-sessie tussen gekoppelde chatkanalen
title: Kanaaldocking
x-i18n:
    generated_at: "2026-07-12T08:48:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d7af3a59b95b2c73cb74a9529584e51caed055719db2df8aad2ba8e8c9b0593
    source_path: concepts/channel-docking.md
    workflow: 16
---

Kanaaldocking is het doorschakelen van berichten voor één OpenClaw-sessie. Dezelfde
gesprekscontext blijft behouden, maar de locatie waar toekomstige antwoorden voor die sessie
worden afgeleverd, verandert. Docking werkt alleen vanuit een privéchat; het werkt niet vanuit een
groepschat.

## Voorbeeld

Alice kan OpenClaw berichten sturen via Telegram en Discord:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

Als Alice dit vanuit een privéchat op Telegram verstuurt:

```text
/dock_discord
```

behoudt OpenClaw de huidige sessiecontext en wijzigt het de antwoordroute:

| Vóór docking                     | Na `/dock_discord`             |
| -------------------------------- | ------------------------------ |
| Antwoorden gaan naar Telegram `123` | Antwoorden gaan naar Discord `456` |

De sessie wordt niet opnieuw aangemaakt. De gespreksgeschiedenis blijft aan
dezelfde sessie gekoppeld.

## Waarom u dit gebruikt

Gebruik docking wanneer een taak in de ene chatapp begint, maar de volgende antwoorden
elders moeten worden afgeleverd.

Gebruikelijke werkwijze:

1. Start een agenttaak vanuit Telegram.
2. Ga naar Discord, waar u het werk coördineert.
3. Verstuur `/dock_discord` vanuit de privéchat op Telegram.
4. Behoud dezelfde OpenClaw-sessie, maar ontvang toekomstige antwoorden in Discord.

## Vereiste configuratie

Voor docking is `session.identityLinks` vereist. De afzender van de bron en de doelpeer
moeten zich in dezelfde identiteitsgroep bevinden:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

De waarden zijn peer-ID's met een kanaalvoorvoegsel:

| Waarde         | Betekenis                       |
| -------------- | ------------------------------- |
| `telegram:123` | Telegram-afzender-ID `123`      |
| `discord:456`  | Discord-ID van privépeer `456`  |
| `slack:U123`   | Slack-gebruikers-ID `U123`      |

De canonieke sleutel (`alice` hierboven) is alleen de naam van de gedeelde identiteitsgroep. Dockingopdrachten
gebruiken de waarden met kanaalvoorvoegsel om aan te tonen dat de afzender van de bron en de
doelpeer dezelfde persoon zijn.

## Opdrachten

OpenClaw genereert één `/dock-<channel>`-opdracht voor elke geladen kanaalplugin
die systeemeigen opdrachten ondersteunt, zodat de lijst groeit wanneer er plugins worden toegevoegd. Meegeleverde
plugins die dit momenteel ondersteunen:

| Doelkanaal  | Opdracht           | Alias              |
| ----------- | ------------------ | ------------------ |
| Discord     | `/dock-discord`    | `/dock_discord`    |
| Mattermost  | `/dock-mattermost` | `/dock_mattermost` |
| Slack       | `/dock-slack`      | `/dock_slack`      |
| Telegram    | `/dock-telegram`   | `/dock_telegram`   |

De vorm met een laag streepje is ook de systeemeigen opdrachtnaam op platformen zoals Telegram
die slash-opdrachten rechtstreeks beschikbaar stellen.

## Wat er verandert

Docking werkt de afleveringsvelden van de actieve sessie bij:

| Sessieveld      | Voorbeeld na `/dock_discord`             |
| --------------- | ---------------------------------------- |
| `lastChannel`   | `discord`                                |
| `lastTo`        | `456`                                    |
| `lastAccountId` | het doelkanaalaccount, of `default`      |

Deze velden worden permanent opgeslagen in de sessieopslag en gebruikt voor de latere aflevering van
antwoorden voor die sessie.

## Wat er niet verandert

Docking doet het volgende niet:

- kanaalaccounts aanmaken
- een nieuwe Discord-, Telegram-, Slack- of Mattermost-bot verbinden
- een gebruiker toegang verlenen
- kanaaltoelatingslijsten of beleid voor privéberichten omzeilen
- gespreksgeschiedenis naar een andere sessie verplaatsen
- niet-gerelateerde gebruikers een sessie laten delen

Het wijzigt alleen de afleveringsroute voor de huidige sessie.

## Problemen oplossen

**De opdracht meldt dat de afzender niet is gekoppeld.**

Voeg zowel de huidige afzender als de doelpeer toe aan dezelfde
`session.identityLinks`-groep. Als Telegram-afzender `123` bijvoorbeeld naar
Discord-peer `456` moet docken, neemt u zowel `telegram:123` als `discord:456` op.

**De opdracht meldt dat docking alleen beschikbaar is vanuit privéchats.**

Verstuur de dockingopdracht vanuit een privéchat met OpenClaw, niet vanuit een groepschat.

**De opdracht meldt dat er geen actieve sessie bestaat.**

Dock vanuit een bestaande privéchatsessie. De opdracht heeft een vermelding voor een actieve sessie
nodig om de nieuwe route permanent op te slaan.

**Antwoorden gaan nog steeds naar het oude kanaal.**

Controleer of de opdracht met een succesbericht heeft geantwoord en bevestig dat het ID van de doelpeer
overeenkomt met het ID dat door dat kanaal wordt gebruikt. Docking wijzigt alleen de route van de actieve
sessie; een andere sessie kan nog steeds een andere route gebruiken.

**Ik moet terugschakelen.**

Verstuur de bijbehorende opdracht voor het oorspronkelijke kanaal, zoals `/dock_telegram` of
`/dock-telegram`, vanuit een gekoppelde afzender.
