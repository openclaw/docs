---
read_when:
    - Je wilt kanaalaccounts toevoegen of verwijderen (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp en meer)
    - Je wilt de kanaalstatus controleren of kanaallogs live volgen
summary: CLI-naslag voor `openclaw channels` (accounts, status, mogelijkheden, herleiden, logboeken, aanmelden/afmelden)
title: Kanalen
x-i18n:
    generated_at: "2026-07-12T08:40:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Beheer chatkanaalaccounts en hun runtimestatus op de Gateway.

Gerelateerde documentatie:

- Kanaalhandleidingen: [Kanalen](/nl/channels)
- Gateway-configuratie: [Configuratie](/nl/gateway/configuration)

## Veelgebruikte opdrachten

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` toont alleen chatkanalen: standaard de geconfigureerde accounts, met per account de statuslabels `installed`, `configured` en `enabled` (`--json` voor machineleesbare uitvoer). Geef `--all` op om ook meegeleverde kanalen zonder geconfigureerd account en installeerbare cataloguskanalen die nog niet op schijf staan weer te geven. Providerauthenticatie en modelgebruik worden elders beheerd: `openclaw models auth list` voor providerauthenticatieprofielen, en `openclaw status` of `openclaw models list` voor gebruik en quota.

## Status / mogelijkheden / omzetten / logboeken

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (standaard `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (vereist `--channel`), `--target <dest>` (vereist `--channel`), `--timeout <ms>` (standaard `10000`, begrensd op `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (standaard `auto`), `--json`
- `channels logs`: `--channel <name|all>` (standaard `all`), `--lines <n>` (standaard `200`), `--json`

`channels status --probe` is het livepad: op een bereikbare Gateway voert het per account
`probeAccount`-controles en optionele `auditAccount`-controles uit, zodat de uitvoer naast de
transportstatus ook resultaten kan bevatten zoals `works`, `probe failed`, `audit ok` of `audit failed`.
Als de Gateway onbereikbaar is, valt `channels status` terug op samenvattingen die uitsluitend
op de configuratie zijn gebaseerd, in plaats van liveproberesultaten.

Gebruik `openclaw sessions`, Gateway `sessions.list` of de agenttool
`sessions_list` niet als indicatie van de socketstatus van een kanaal. Deze onderdelen rapporteren
opgeslagen gespreksrijen, niet de runtimestatus van de provider. Na een herstart van de Discord-provider
kan een verbonden maar stil account gezond zijn, terwijl er pas een Discord-sessierij verschijnt
na de volgende inkomende of uitgaande gespreksgebeurtenis.

## Accounts toevoegen / verwijderen

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` toont de opties per kanaal (token, privésleutel, apptoken, paden naar signal-cli enzovoort).
</Tip>

`channels remove` werkt alleen met geïnstalleerde/geconfigureerde kanaalplugins. Gebruik eerst `channels add` voor installeerbare cataloguskanalen. Zonder `--delete` wordt gevraagd het account uit te schakelen en blijft de configuratie behouden; `--delete` verwijdert de configuratie-items zonder om bevestiging te vragen.
Voor kanaalplugins met runtimeondersteuning vraagt `channels remove` de actieve Gateway ook om het geselecteerde account te stoppen voordat de configuratie wordt bijgewerkt. Zo blijft de oude listener niet actief tot de volgende herstart wanneer een account wordt uitgeschakeld of verwijderd.

Niet-interactieve toevoegopties die door kanalen worden gedeeld: `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir` en `--use-env` (authenticatie via omgevingsvariabelen, alleen voor het standaardaccount, waar ondersteund). Kanaalspecifieke opties zijn onder meer:

| Kanaal      | Opties                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Als tijdens een optiegestuurde toevoegopdracht een kanaalplugin moet worden geïnstalleerd, gebruikt OpenClaw de standaardinstallatiebron van het kanaal zonder de interactieve installatieprompt voor de plugin te openen.

Wanneer je `openclaw channels add` zonder opties uitvoert, kan de interactieve wizard vragen om:

- account-ID's per geselecteerd kanaal
- optionele weergavenamen voor die accounts
- `Deze kanaalaccounts nu naar agents routeren?`

Als je bevestigt dat je ze nu wilt koppelen, vraagt de wizard welke agent eigenaar moet zijn van elk geconfigureerd kanaalaccount en schrijft deze routeringskoppelingen op accountniveau.

Je kunt dezelfde routeringsregels later ook beheren met `openclaw agents bindings`, `openclaw agents bind` en `openclaw agents unbind` (zie [agents](/nl/cli/agents)).

Wanneer je een niet-standaardaccount toevoegt aan een kanaal dat nog instellingen voor één account op het hoogste niveau gebruikt, promoveert OpenClaw die waarden naar de accountmap van het kanaal voordat het nieuwe account wordt geschreven. Bij de promotie wordt een bestaand benoemd account hergebruikt als het kanaal er precies één heeft of als `defaultAccount` naar een account verwijst; anders komen de waarden terecht in `channels.<channel>.accounts.default`.

Het routeringsgedrag blijft consistent:

- Bestaande koppelingen die alleen aan een kanaal zijn gekoppeld (zonder `accountId`) blijven overeenkomen met het standaardaccount.
- `channels add` maakt of herschrijft geen koppelingen automatisch in de niet-interactieve modus.
- De interactieve configuratie kan optioneel koppelingen op accountniveau toevoegen.

Als je configuratie al een gemengde toestand had (benoemde accounts aanwezig terwijl waarden voor één account op het hoogste niveau nog waren ingesteld), voer je `openclaw doctor --fix` uit om accountspecifieke waarden te verplaatsen naar het gepromoveerde account dat voor dat kanaal is gekozen.

## Aanmelden en afmelden (interactief)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` ondersteunt `--account <id>` en `--verbose`; `channels logout` ondersteunt `--account <id>`.
- `channels login` en `logout` kunnen het kanaal afleiden wanneer slechts één geconfigureerd kanaal die actie ondersteunt; geef bij meerdere kanalen `--channel` op.
- `channels logout` geeft de voorkeur aan het livepad via de Gateway wanneer die bereikbaar is, zodat bij het afmelden elke actieve listener wordt gestopt voordat de authenticatiestatus van het kanaal wordt gewist. Als een lokale Gateway niet bereikbaar is, wordt teruggevallen op het lokaal opschonen van de authenticatie; met `gateway.mode: "remote"` laat de Gateway-fout de opdracht in plaats daarvan mislukken.
- Na een geslaagde aanmelding vraagt de CLI een bereikbare lokale Gateway om het account te starten; in de externe modus wordt de authenticatie lokaal opgeslagen en wordt vermeld dat de externe runtime niet opnieuw is gestart.
- Voer `channels login` uit vanuit een terminal op de Gateway-host. Agent-`exec` blokkeert deze interactieve aanmeldingsstroom; kanaaleigen aanmeldingstools voor agents, zoals `whatsapp_login`, moeten vanuit de chat worden gebruikt wanneer ze beschikbaar zijn.

## Problemen oplossen

- Voer `openclaw status --deep` uit voor een brede controle.
- Gebruik `openclaw doctor` voor begeleide oplossingen.
- `openclaw channels status` valt terug op samenvattingen die uitsluitend op de configuratie zijn gebaseerd wanneer de Gateway onbereikbaar is. Als een ondersteunde kanaalreferentie via SecretRef is geconfigureerd, maar niet beschikbaar is in het huidige opdrachtpad, wordt dat account als geconfigureerd gerapporteerd met opmerkingen over de beperkte werking, in plaats van als niet geconfigureerd.

## Mogelijkheden controleren

Haal aanwijzingen over providermogelijkheden op (intents/scopes waar beschikbaar), samen met statische functieondersteuning:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Opmerkingen:

- `--channel` is optioneel; laat deze optie weg om elk kanaal weer te geven (inclusief kanalen die door plugins worden geleverd).
- `--account` is alleen geldig in combinatie met `--channel`.
- `--target` accepteert `channel:<id>` of een onbewerkt numeriek kanaal-ID en is alleen van toepassing op Discord. Voor Discord-spraakkanalen markeert de machtigingscontrole ontbrekende `ViewChannel`-, `Connect`-, `Speak`-, `SendMessages`- en `ReadMessageHistory`-machtigingen.
- Controles zijn providerspecifiek: Discord-botidentiteit en intents plus optionele kanaalmachtigingen; Slack-bot- en gebruikersscopes; Telegram-botopties en Webhook; versie van de Signal-daemon; Microsoft Teams-apptoken en Graph-rollen/scopes (waar bekend voorzien van annotaties). Kanalen zonder controles rapporteren `Probe: unavailable`.

## Namen omzetten naar ID's

Zet kanaal- en gebruikersnamen met behulp van de providerdirectory om naar ID's:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Opmerkingen:

- Gebruik `--kind user|group|auto` om het doeltype af te dwingen.
- Bij meerdere items met dezelfde naam geeft de omzetting de voorkeur aan actieve overeenkomsten.
- `channels resolve` is alleen-lezen. Als een geselecteerd account via SecretRef is geconfigureerd, maar die referentie niet beschikbaar is in het huidige opdrachtpad, retourneert de opdracht beperkte, niet-omgezette resultaten met opmerkingen in plaats van de volledige uitvoering af te breken.
- `channels resolve` installeert geen kanaalplugins. Gebruik `channels add --channel <name>` voordat je namen omzet voor een installeerbaar cataloguskanaal.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Overzicht van kanalen](/nl/channels)
