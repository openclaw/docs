---
read_when:
    - Je wilt kanaalaccounts toevoegen/verwijderen (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - Je wilt de kanaalstatus controleren of kanaallogboeken live volgen
summary: CLI-referentie voor `openclaw channels` (accounts, status, aanmelden/afmelden, logboeken)
title: Kanalen
x-i18n:
    generated_at: "2026-05-10T19:27:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e860f2863e148a46b9beb7f855eb9f30addc1b012f1430bf33c544c5e321821d
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Beheer chatkanaalaccounts en hun runtimestatus op de Gateway.

Gerelateerde documentatie:

- Kanaalgidsen: [Kanalen](/nl/channels)
- Gateway-configuratie: [Configuratie](/nl/gateway/configuration)

## Veelgebruikte opdrachten

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` toont alleen chatkanalen: standaard geconfigureerde accounts, met statustags `installed`, `configured` en `enabled` per account. Geef `--all` mee om ook gebundelde kanalen zonder geconfigureerd account en installeerbare cataloguskanalen die nog niet op schijf staan zichtbaar te maken. Auth-providers (OAuth + API-sleutels) en snapshots van gebruik/quota voor modelproviders worden hier niet meer afgedrukt; gebruik `openclaw models auth list` voor provider-authprofielen en `openclaw status` of `openclaw models list` voor gebruik.

## Status / mogelijkheden / oplossen / logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (alleen met `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` is het livepad: op een bereikbare Gateway voert het per account
`probeAccount` en optionele `auditAccount`-controles uit, zodat de uitvoer transportstatus
plus proberesultaten kan bevatten, zoals `works`, `probe failed`, `audit ok` of `audit failed`.
Als de Gateway onbereikbaar is, valt `channels status` terug op alleen-configuratiesamenvattingen
in plaats van live-probe-uitvoer.

Gebruik `openclaw sessions`, Gateway `sessions.list` of de agenttool
`sessions_list` niet als signaal voor socketgezondheid van kanalen. Deze oppervlakken rapporteren
opgeslagen gespreksrijen, niet de runtimestatus van de provider. Na een herstart van een Discord-provider
kan een verbonden maar stil account gezond zijn terwijl er geen Discord-sessierij
verschijnt tot de volgende inkomende of uitgaande gespreksgebeurtenis.

## Accounts toevoegen / verwijderen

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` toont flags per kanaal (token, privésleutel, apptoken, signal-cli-paden, enzovoort).
</Tip>

`channels remove` werkt alleen op geïnstalleerde/geconfigureerde kanaalplugins. Gebruik eerst `channels add` voor installeerbare cataloguskanalen.
Voor kanaalplugins met runtime-ondersteuning vraagt `channels remove` ook de draaiende Gateway om het geselecteerde account te stoppen voordat de configuratie wordt bijgewerkt, zodat uitschakelen of verwijderen van een account de oude listener niet actief laat tot een herstart.

Veelgebruikte niet-interactieve toevoegoppervlakken zijn onder andere:

- kanalen met bottokens: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage-transportvelden: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat-velden: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix-velden: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr-velden: `--private-key`, `--relay-urls`
- Tlon-velden: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` voor standaardaccountauth via env waar ondersteund

Als een kanaalplugin tijdens een flaggestuurde toevoegopdracht moet worden geïnstalleerd, gebruikt OpenClaw de standaardinstallatiebron van het kanaal zonder de interactieve plugininstallatieprompt te openen.

Wanneer je `openclaw channels add` zonder flags uitvoert, kan de interactieve wizard vragen om:

- account-id's per geselecteerd kanaal
- optionele weergavenamen voor die accounts
- `Route these channel accounts to agents now?`

Als je nu binden bevestigt, vraagt de wizard welke agent eigenaar moet zijn van elk geconfigureerd kanaalaccount en schrijft accountspecifieke routeringsbindingen.

Je kunt dezelfde routeringsregels later ook beheren met `openclaw agents bindings`, `openclaw agents bind` en `openclaw agents unbind` (zie [agents](/nl/cli/agents)).

Wanneer je een niet-standaardaccount toevoegt aan een kanaal dat nog enkelaccountinstellingen op topniveau gebruikt, promoveert OpenClaw accountspecifieke waarden op topniveau naar de accountmap van het kanaal voordat het nieuwe account wordt geschreven. De meeste kanalen plaatsen die waarden in `channels.<channel>.accounts.default`, maar gebundelde kanalen kunnen in plaats daarvan een bestaand overeenkomend gepromoveerd account behouden. Matrix is het huidige voorbeeld: als er al één benoemd account bestaat, of `defaultAccount` naar een bestaand benoemd account wijst, behoudt promotie dat account in plaats van een nieuw `accounts.default` te maken.

Routeringsgedrag blijft consistent:

- Bestaande kanaal-only bindingen (zonder `accountId`) blijven overeenkomen met het standaardaccount.
- `channels add` maakt of herschrijft geen bindingen automatisch in niet-interactieve modus.
- Interactieve configuratie kan optioneel accountspecifieke bindingen toevoegen.

Als je configuratie al in een gemengde staat stond (benoemde accounts aanwezig en enkelaccountwaarden op topniveau nog ingesteld), voer dan `openclaw doctor --fix` uit om accountspecifieke waarden te verplaatsen naar het gepromoveerde account dat voor dat kanaal is gekozen. De meeste kanalen promoveren naar `accounts.default`; Matrix kan in plaats daarvan een bestaand benoemd/standaarddoel behouden.

## Inloggen en uitloggen (interactief)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` ondersteunt `--verbose`.
- `channels login` en `logout` kunnen het kanaal afleiden wanneer er slechts één ondersteund logindoel is geconfigureerd.
- `channels logout` geeft de voorkeur aan het live Gateway-pad wanneer bereikbaar, zodat uitloggen elke actieve listener stopt voordat de authstatus van het kanaal wordt gewist. Als een lokale Gateway niet bereikbaar is, valt het terug op lokale auth-opruiming.
- Voer `channels login` uit vanaf een terminal op de Gateway-host. Agent `exec` blokkeert deze interactieve loginflow; kanaaleigen agentlogintools, zoals `whatsapp_login`, moeten vanuit chat worden gebruikt wanneer beschikbaar.

## Probleemoplossing

- Voer `openclaw status --deep` uit voor een brede probe.
- Gebruik `openclaw doctor` voor begeleide oplossingen.
- `openclaw channels list` drukt geen snapshots van gebruik/quota voor modelproviders meer af. Gebruik daarvoor `openclaw status` (overzicht) of `openclaw models list` (per provider).
- `openclaw channels status` valt terug op alleen-configuratiesamenvattingen wanneer de Gateway onbereikbaar is. Als een ondersteunde kanaalreferentie via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige opdrachtpad, rapporteert het dat account als geconfigureerd met gedegradeerde opmerkingen in plaats van het als niet geconfigureerd te tonen.

## Mogelijkhedenprobe

Haal providerhints voor mogelijkheden op (intents/scopes waar beschikbaar) plus statische functieondersteuning:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Opmerkingen:

- `--channel` is optioneel; laat het weg om elk kanaal weer te geven (inclusief extensions).
- `--account` is alleen geldig met `--channel`.
- `--target` accepteert `channel:<id>` of een onbewerkte numerieke kanaal-id en geldt alleen voor Discord. Voor Discord-spraakkanalen markeert de rechtencontrole ontbrekende `ViewChannel`, `Connect`, `Speak`, `SendMessages` en `ReadMessageHistory`.
- Probes zijn providerspecifiek: Discord-intents + optionele kanaalrechten; Slack-bot + gebruikersscopes; Telegram-botflags + Webhook; Signal-daemonversie; Microsoft Teams-apptoken + Graph-rollen/scopes (geannoteerd waar bekend). Kanalen zonder probes rapporteren `Probe: unavailable`.

## Namen naar ID's oplossen

Los kanaal-/gebruikersnamen op naar ID's met behulp van de providerdirectory:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Opmerkingen:

- Gebruik `--kind user|group|auto` om het doeltype af te dwingen.
- Oplossing geeft de voorkeur aan actieve overeenkomsten wanneer meerdere vermeldingen dezelfde naam delen.
- `channels resolve` is alleen-lezen. Als een geselecteerd account via SecretRef is geconfigureerd maar die referentie niet beschikbaar is in het huidige opdrachtpad, retourneert de opdracht gedegradeerde onopgeloste resultaten met opmerkingen in plaats van de hele run af te breken.
- `channels resolve` installeert geen kanaalplugins. Gebruik `channels add --channel <name>` voordat je namen oplost voor een installeerbaar cataloguskanaal.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Kanalenoverzicht](/nl/channels)
