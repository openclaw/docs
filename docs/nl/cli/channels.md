---
read_when:
    - Je wilt kanaalaccounts toevoegen/verwijderen (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Je wilt de kanaalstatus controleren of kanaallogboeken volgen
summary: CLI-referentie voor `openclaw channels` (accounts, status, aanmelden/afmelden, logboeken)
title: Kanalen
x-i18n:
    generated_at: "2026-05-01T11:15:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f673a626b46cd4c8ba7eb28963d27e7e3f630dd86723332faab9b4c86553da9
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
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Status / mogelijkheden / oplossen / logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (alleen met `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` is het live pad: op een bereikbare Gateway voert het per account
`probeAccount` en optionele `auditAccount`-controles uit, zodat de uitvoer transportstatus
plus proefresultaten kan bevatten, zoals `works`, `probe failed`, `audit ok` of `audit failed`.
Als de Gateway onbereikbaar is, valt `channels status` terug op alleen-configuratie-samenvattingen
in plaats van live proefuitvoer.

## Accounts toevoegen / verwijderen

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` toont kanaalspecifieke vlaggen (token, privésleutel, app-token, signal-cli-paden, enzovoort).
</Tip>

`channels remove` werkt alleen op geinstalleerde/geconfigureerde kanaalplugins. Gebruik eerst `channels add` voor installeerbare cataloguskanalen.

Veelgebruikte niet-interactieve toevoegoppervlakken zijn onder andere:

- bot-tokenkanalen: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage-transportvelden: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat-velden: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix-velden: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr-velden: `--private-key`, `--relay-urls`
- Tlon-velden: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` voor env-ondersteunde authenticatie van standaardaccounts waar ondersteund

Als een kanaalplugin tijdens een vlaggestuurde toevoegopdracht moet worden geinstalleerd, gebruikt OpenClaw de standaardinstallatiebron van het kanaal zonder de interactieve plugininstallatieprompt te openen.

Wanneer je `openclaw channels add` zonder vlaggen uitvoert, kan de interactieve wizard vragen om:

- account-id's per geselecteerd kanaal
- optionele weergavenamen voor die accounts
- `Bind configured channel accounts to agents now?`

Als je nu binden bevestigt, vraagt de wizard welke agent eigenaar moet zijn van elk geconfigureerd kanaalaccount en schrijft account-scoped routeringsbindingen.

Je kunt dezelfde routeringsregels later ook beheren met `openclaw agents bindings`, `openclaw agents bind` en `openclaw agents unbind` (zie [agents](/nl/cli/agents)).

Wanneer je een niet-standaardaccount toevoegt aan een kanaal dat nog steeds single-account-instellingen op topniveau gebruikt, promoveert OpenClaw account-scoped waarden op topniveau naar de accountmap van het kanaal voordat het nieuwe account wordt geschreven. De meeste kanalen plaatsen die waarden in `channels.<channel>.accounts.default`, maar gebundelde kanalen kunnen in plaats daarvan een bestaande overeenkomende gepromoveerde account behouden. Matrix is het huidige voorbeeld: als er al een benoemd account bestaat, of `defaultAccount` naar een bestaand benoemd account verwijst, behoudt promotie dat account in plaats van een nieuw `accounts.default` te maken.

Routeringsgedrag blijft consistent:

- Bestaande alleen-kanaalbindingen (zonder `accountId`) blijven overeenkomen met het standaardaccount.
- `channels add` maakt of herschrijft geen bindingen automatisch in niet-interactieve modus.
- Interactieve installatie kan optioneel account-scoped bindingen toevoegen.

Als je configuratie al in een gemengde staat verkeerde (benoemde accounts aanwezig en single-accountwaarden op topniveau nog steeds ingesteld), voer dan `openclaw doctor --fix` uit om account-scoped waarden te verplaatsen naar het gepromoveerde account dat voor dat kanaal is gekozen. De meeste kanalen promoveren naar `accounts.default`; Matrix kan in plaats daarvan een bestaand benoemd/standaarddoel behouden.

## Inloggen en uitloggen (interactief)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` ondersteunt `--verbose`.
- `channels login` en `logout` kunnen het kanaal afleiden wanneer slechts een ondersteund logindoel is geconfigureerd.
- Voer `channels login` uit vanaf een terminal op de Gateway-host. Agent `exec` blokkeert deze interactieve loginflow; kanaaleigen agentlogintools, zoals `whatsapp_login`, moeten vanuit chat worden gebruikt wanneer beschikbaar.

## Problemen oplossen

- Voer `openclaw status --deep` uit voor een brede probe.
- Gebruik `openclaw doctor` voor begeleide oplossingen.
- `openclaw channels list` print `Claude: HTTP 403 ... user:profile` → gebruikssnapshot heeft de scope `user:profile` nodig. Gebruik `--no-usage`, of lever een claude.ai-sessiesleutel (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), of authenticeer opnieuw via Claude CLI.
- `openclaw channels status` valt terug op alleen-configuratie-samenvattingen wanneer de Gateway onbereikbaar is. Als een ondersteunde kanaalcredential via SecretRef is geconfigureerd maar niet beschikbaar is in het huidige opdrachtpad, wordt dat account gerapporteerd als geconfigureerd met gedegradeerde opmerkingen in plaats van het als niet geconfigureerd te tonen.

## Mogelijkhedenprobe

Haal hints voor providermogelijkheden op (intents/scopes waar beschikbaar) plus statische functieondersteuning:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Opmerkingen:

- `--channel` is optioneel; laat het weg om elk kanaal (inclusief extensies) weer te geven.
- `--account` is alleen geldig met `--channel`.
- `--target` accepteert `channel:<id>` of een ruwe numerieke kanaal-id en is alleen van toepassing op Discord.
- Probes zijn providerspecifiek: Discord-intents + optionele kanaalmachtigingen; Slack-bot + gebruikersscopes; Telegram-botvlaggen + Webhook; Signal-daemonversie; Microsoft Teams-app-token + Graph-rollen/scopes (geannoteerd waar bekend). Kanalen zonder probes rapporteren `Probe: unavailable`.

## Namen oplossen naar ID's

Los kanaal-/gebruikersnamen op naar ID's met behulp van de providerdirectory:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Opmerkingen:

- Gebruik `--kind user|group|auto` om het doeltype af te dwingen.
- Oplossen geeft de voorkeur aan actieve overeenkomsten wanneer meerdere vermeldingen dezelfde naam delen.
- `channels resolve` is alleen-lezen. Als een geselecteerd account via SecretRef is geconfigureerd maar die credential niet beschikbaar is in het huidige opdrachtpad, retourneert de opdracht gedegradeerde niet-opgeloste resultaten met opmerkingen in plaats van de volledige run af te breken.
- `channels resolve` installeert geen kanaalplugins. Gebruik `channels add --channel <name>` voordat je namen oplost voor een installeerbaar cataloguskanaal.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Kanalenoverzicht](/nl/channels)
