---
read_when:
    - Je wilt kanaalaccounts toevoegen/verwijderen (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Je wilt de kanaalstatus controleren of kanaallogs volgen
summary: CLI-referentie voor `openclaw channels` (accounts, status, inloggen/uitloggen, logboeken)
title: Kanalen
x-i18n:
    generated_at: "2026-04-29T22:30:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc3c5983114c17e0e7284450aa161b658312c05864db65e09d6d764e357cd1f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Beheer chatkanaalaccounts en hun runtime-status op de Gateway.

Gerelateerde documentatie:

- Kanaalgidsen: [Kanalen](/nl/channels)
- Gateway-configuratie: [Configuratie](/nl/gateway/configuration)

## Veelgebruikte opdrachten

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Status / mogelijkheden / oplossen / logboeken

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (alleen met `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` is het livepad: op een bereikbare gateway voert het per account
`probeAccount`- en optionele `auditAccount`-controles uit, zodat de uitvoer de transportstatus
plus peilresultaten kan bevatten, zoals `works`, `probe failed`, `audit ok` of `audit failed`.
Als de gateway onbereikbaar is, valt `channels status` terug op alleen-configuratiesamenvattingen
in plaats van live peiluitvoer.

## Accounts toevoegen / verwijderen

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` toont vlaggen per kanaal (token, privésleutel, apptoken, signal-cli-paden, enzovoort).
</Tip>

Veelgebruikte niet-interactieve toevoegoppervlakken zijn onder meer:

- bot-tokenkanalen: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage-transportvelden: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat-velden: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix-velden: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr-velden: `--private-key`, `--relay-urls`
- Tlon-velden: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` voor door env ondersteunde verificatie van standaardaccounts waar ondersteund

Als tijdens een door vlaggen gestuurde toevoegopdracht een kanaal-Plugin moet worden geïnstalleerd, gebruikt OpenClaw de standaardinstallatiebron van het kanaal zonder de interactieve Plugin-installatieprompt te openen.

Wanneer je `openclaw channels add` zonder vlaggen uitvoert, kan de interactieve wizard vragen om:

- account-id's per geselecteerd kanaal
- optionele weergavenamen voor die accounts
- `Bind configured channel accounts to agents now?`

Als je nu binden bevestigt, vraagt de wizard welke agent eigenaar moet zijn van elk geconfigureerd kanaalaccount en schrijft hij accountgerichte routeringsbindingen.

Je kunt dezelfde routeringsregels later ook beheren met `openclaw agents bindings`, `openclaw agents bind` en `openclaw agents unbind` (zie [agents](/nl/cli/agents)).

Wanneer je een niet-standaardaccount toevoegt aan een kanaal dat nog steeds enkelvoudige accountinstellingen op topniveau gebruikt, promoveert OpenClaw accountgerichte waarden op topniveau naar de accountmap van het kanaal voordat het nieuwe account wordt geschreven. De meeste kanalen plaatsen die waarden in `channels.<channel>.accounts.default`, maar gebundelde kanalen kunnen in plaats daarvan een bestaand overeenkomend gepromoveerd account behouden. Matrix is het huidige voorbeeld: als er al één benoemd account bestaat, of `defaultAccount` naar een bestaand benoemd account wijst, behoudt promotie dat account in plaats van een nieuw `accounts.default` te maken.

Het routeringsgedrag blijft consistent:

- Bestaande kanaalbindingen zonder account (`accountId`) blijven overeenkomen met het standaardaccount.
- `channels add` maakt of herschrijft geen bindingen automatisch in niet-interactieve modus.
- Interactieve configuratie kan optioneel accountgerichte bindingen toevoegen.

Als je configuratie al in een gemengde staat was (benoemde accounts aanwezig en enkelvoudige accountwaarden op topniveau nog ingesteld), voer dan `openclaw doctor --fix` uit om accountgerichte waarden te verplaatsen naar het gepromoveerde account dat voor dat kanaal is gekozen. De meeste kanalen promoveren naar `accounts.default`; Matrix kan in plaats daarvan een bestaand benoemd/standaarddoel behouden.

## Inloggen en uitloggen (interactief)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` ondersteunt `--verbose`.
- `channels login` en `logout` kunnen het kanaal afleiden wanneer slechts één ondersteund inlogdoel is geconfigureerd.
- Voer `channels login` uit vanaf een terminal op de gatewayhost. Agent-`exec` blokkeert deze interactieve inlogstroom; kanaaleigen agent-inlogtools, zoals `whatsapp_login`, moeten vanuit chat worden gebruikt wanneer ze beschikbaar zijn.

## Probleemoplossing

- Voer `openclaw status --deep` uit voor een brede peiling.
- Gebruik `openclaw doctor` voor begeleide oplossingen.
- `openclaw channels list` drukt `Claude: HTTP 403 ... user:profile` af → de gebruikssnapshot heeft de scope `user:profile` nodig. Gebruik `--no-usage`, of geef een claude.ai-sessiesleutel op (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), of verifieer opnieuw via Claude CLI.
- `openclaw channels status` valt terug op alleen-configuratiesamenvattingen wanneer de gateway onbereikbaar is. Als een ondersteunde kanaalcredential via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige opdrachtpad, meldt het die account als geconfigureerd met gedegradeerde opmerkingen in plaats van deze als niet geconfigureerd weer te geven.

## Mogelijkhedenpeiling

Haal hints voor providermogelijkheden op (intents/scopes waar beschikbaar) plus statische functieondersteuning:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Opmerkingen:

- `--channel` is optioneel; laat dit weg om elk kanaal te tonen (inclusief extensies).
- `--account` is alleen geldig met `--channel`.
- `--target` accepteert `channel:<id>` of een ruwe numerieke kanaal-id en is alleen van toepassing op Discord.
- Peilingen zijn providerspecifiek: Discord-intents + optionele kanaalmachtigingen; Slack-bot + gebruikersscopes; Telegram-botvlaggen + Webhook; Signal-daemonversie; Microsoft Teams-apptoken + Graph-rollen/scopes (geannoteerd waar bekend). Kanalen zonder peilingen melden `Probe: unavailable`.

## Namen omzetten naar id's

Zet kanaal-/gebruikersnamen om naar id's met behulp van de providermap:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Opmerkingen:

- Gebruik `--kind user|group|auto` om het doeltype af te dwingen.
- Oplossing geeft de voorkeur aan actieve overeenkomsten wanneer meerdere vermeldingen dezelfde naam delen.
- `channels resolve` is alleen-lezen. Als een geselecteerd account via SecretRef is geconfigureerd maar die credential niet beschikbaar is in het huidige opdrachtpad, retourneert de opdracht gedegradeerde onopgeloste resultaten met opmerkingen in plaats van de volledige uitvoering af te breken.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Kanalenoverzicht](/nl/channels)
