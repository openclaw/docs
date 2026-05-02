---
read_when:
    - Je wilt een beginnersvriendelijke stapsgewijze uitleg van de TUI
    - Je hebt de volledige lijst met TUI-functies, commando's en sneltoetsen nodig
summary: 'Terminalgebruikersinterface (TUI): maak verbinding met de Gateway of voer lokaal uit in ingesloten modus'
title: TUI
x-i18n:
    generated_at: "2026-05-02T11:31:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c13268991bf11eece9984f21eb959e7a5fab7071be6dc3a47855b525bfe80d8
    source_path: web/tui.md
    workflow: 16
---

## Snel aan de slag

### Gateway-modus

1. Start de Gateway.

```bash
openclaw gateway
```

2. Open de TUI.

```bash
openclaw tui
```

3. Typ een bericht en druk op Enter.

Externe Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gebruik `--password` als je Gateway wachtwoordauthenticatie gebruikt.

### Lokale modus

Voer de TUI uit zonder Gateway:

```bash
openclaw chat
# or
openclaw tui --local
```

Opmerkingen:

- `openclaw chat` en `openclaw terminal` zijn aliassen voor `openclaw tui --local`.
- `--local` kan niet worden gecombineerd met `--url`, `--token` of `--password`.
- De lokale modus gebruikt de ingesloten agent-runtime rechtstreeks. De meeste lokale tools werken, maar functies die alleen voor de Gateway zijn, zijn niet beschikbaar.
- `openclaw` en `openclaw crestodian` gebruiken ook deze TUI-shell, met Crestodian als de lokale setup- en herstelchatbackend.

## Wat je ziet

- Koptekst: verbindings-URL, huidige agent, huidige sessie.
- Chatlog: gebruikersberichten, antwoorden van de assistent, systeemmeldingen, toolkaarten.
- Statusregel: verbindings-/uitvoeringsstatus (verbinden, actief, streamen, inactief, fout).
- Voettekst: verbindingsstatus + agent + sessie + model + think/fast/verbose/trace/reasoning + tokentellingen + bezorgen.
- Invoer: teksteditor met autocomplete.

## Mentaal model: agenten + sessies

- Agenten zijn unieke slugs (bijv. `main`, `research`). De Gateway stelt de lijst beschikbaar.
- Sessies horen bij de huidige agent.
- Sessiesleutels worden opgeslagen als `agent:<agentId>:<sessionKey>`.
  - Als je `/session main` typt, breidt de TUI dit uit naar `agent:<currentAgent>:main`.
  - Als je `/session agent:other:main` typt, schakel je expliciet over naar die agentsessie.
- Sessiebereik:
  - `per-sender` (standaard): elke agent heeft veel sessies.
  - `global`: de TUI gebruikt altijd de `global`-sessie (de kiezer kan leeg zijn).
- De huidige agent + sessie zijn altijd zichtbaar in de voettekst.
- Wanneer de TUI in gateway-modus zonder `--session` wordt gestart, hervat deze de laatst geselecteerde sessie voor dezelfde gateway, agent en hetzelfde sessiebereik als die sessie nog bestaat. Het doorgeven van `--session`, `/session`, `/new` of `/reset` blijft expliciet.

## Verzenden + levering

- Berichten worden naar de Gateway verzonden; levering aan providers staat standaard uit.
- Zet levering aan:
  - `/deliver on`
  - of het paneel Instellingen
  - of start met `openclaw tui --deliver`

## Kiezers + overlays

- Modelkiezer: beschikbare modellen weergeven en de sessie-override instellen.
- Agentkiezer: kies een andere agent.
- Sessiekiezer: toont alleen sessies voor de huidige agent.
- Instellingen: schakel levering, uitklappen van tooluitvoer en zichtbaarheid van denken in of uit.

## Sneltoetsen

- Enter: bericht verzenden
- Esc: actieve uitvoering afbreken
- Ctrl+C: invoer wissen (druk twee keer om af te sluiten)
- Ctrl+D: afsluiten
- Ctrl+L: modelkiezer
- Ctrl+G: agentkiezer
- Ctrl+P: sessiekiezer
- Ctrl+O: uitklappen van tooluitvoer in-/uitschakelen
- Ctrl+T: zichtbaarheid van denken in-/uitschakelen (laadt geschiedenis opnieuw)

## Slash-opdrachten

Kern:

- `/help`
- `/status`
- `/agent <id>` (of `/agents`)
- `/session <key>` (of `/sessions`)
- `/model <provider/model>` (of `/models`)

Sessiebesturing:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Sessielevenscyclus:

- `/new` of `/reset` (de sessie resetten)
- `/abort` (de actieve uitvoering afbreken)
- `/settings`
- `/exit`

Alleen lokale modus:

- `/auth [provider]` opent de provider-authenticatie-/inlogflow binnen de TUI.

Andere Gateway-slash-opdrachten (bijvoorbeeld `/context`) worden doorgestuurd naar de Gateway en weergegeven als systeemuitvoer. Zie [Slash-opdrachten](/nl/tools/slash-commands).

## Lokale shellopdrachten

- Laat een regel beginnen met `!` om een lokale shellopdracht op de TUI-host uit te voeren.
- De TUI vraagt eenmaal per sessie om lokale uitvoering toe te staan; weigeren houdt `!` uitgeschakeld voor de sessie.
- Opdrachten worden uitgevoerd in een nieuwe, niet-interactieve shell in de werkdirectory van de TUI (geen persistente `cd`/env).
- Lokale shellopdrachten ontvangen `OPENCLAW_SHELL=tui-local` in hun omgeving.
- Een losse `!` wordt als normaal bericht verzonden; voorloopspaties activeren geen lokale uitvoering.

## Configuraties herstellen vanuit de lokale TUI

Gebruik de lokale modus wanneer de huidige configuratie al valideert en je wilt dat de
ingesloten agent deze op dezelfde machine inspecteert, vergelijkt met de documentatie
en helpt drift te herstellen zonder afhankelijk te zijn van een actieve Gateway.

Als `openclaw config validate` al faalt, begin dan eerst met `openclaw configure`
of `openclaw doctor --fix`. `openclaw chat` omzeilt de ongeldige-configuratiebeveiliging niet.

Typische cyclus:

1. Start de lokale modus:

```bash
openclaw chat
```

2. Vraag de agent wat je gecontroleerd wilt hebben, bijvoorbeeld:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Gebruik lokale shellopdrachten voor exact bewijs en validatie:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Pas gerichte wijzigingen toe met `openclaw config set` of `openclaw configure` en voer daarna `!openclaw config validate` opnieuw uit.
5. Als Doctor een automatische migratie of herstelactie aanbeveelt, controleer die en voer `!openclaw doctor --fix` uit.

Tips:

- Geef de voorkeur aan `openclaw config set` of `openclaw configure` boven het handmatig bewerken van `openclaw.json`.
- `openclaw docs "<query>"` doorzoekt de live documentatie-index vanaf dezelfde machine.
- `openclaw config validate --json` is handig wanneer je gestructureerde schema- en SecretRef-/oplosbaarheidsfouten wilt.

## Tooluitvoer

- Toolaanroepen worden getoond als kaarten met argumenten + resultaten.
- Ctrl+O schakelt tussen ingeklapte/uitgeklapte weergaven.
- Terwijl tools worden uitgevoerd, streamen gedeeltelijke updates naar dezelfde kaart.

## Terminalkleuren

- De TUI houdt de hoofdtekst van de assistent in de standaardvoorgrondkleur van je terminal, zodat donkere en lichte terminals beide leesbaar blijven.
- Als je terminal een lichte achtergrond gebruikt en automatische detectie verkeerd is, stel dan `OPENCLAW_THEME=light` in voordat je `openclaw tui` start.
- Stel in plaats daarvan `OPENCLAW_THEME=dark` in om het oorspronkelijke donkere palet te forceren.

## Geschiedenis + streaming

- Bij verbinding laadt de TUI de nieuwste geschiedenis (standaard 200 berichten).
- Streamende antwoorden worden op hun plaats bijgewerkt totdat ze definitief zijn.
- De TUI luistert ook naar agent-toolgebeurtenissen voor rijkere toolkaarten.

## Verbindingsdetails

- De TUI registreert zich bij de Gateway als `mode: "tui"`.
- Nieuwe verbindingen tonen een systeembericht; gebeurtenishiaten worden zichtbaar gemaakt in het log.

## Opties

- `--local`: Uitvoeren tegen de lokale ingesloten agent-runtime
- `--url <url>`: Gateway WebSocket-URL (standaard uit configuratie of `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway-token (indien vereist)
- `--password <password>`: Gateway-wachtwoord (indien vereist)
- `--session <key>`: Sessiesleutel (standaard: `main`, of `global` wanneer bereik globaal is)
- `--deliver`: Antwoorden van de assistent aan de provider leveren (standaard uit)
- `--thinking <level>`: Denkniveau voor verzendingen overschrijven
- `--message <text>`: Een initieel bericht verzenden na verbinding
- `--timeout-ms <ms>`: Agent-time-out in ms (standaard `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Te laden geschiedenisitems (standaard `200`)

<Warning>
Wanneer je `--url` instelt, valt de TUI niet terug op configuratie- of omgevingsreferenties. Geef `--token` of `--password` expliciet door. Ontbrekende expliciete referenties zijn een fout. Geef in lokale modus geen `--url`, `--token` of `--password` door.
</Warning>

## Probleemoplossing

Geen uitvoer na het verzenden van een bericht:

- Voer `/status` uit in de TUI om te bevestigen dat de Gateway verbonden en inactief/bezig is.
- Controleer de Gateway-logboeken: `openclaw logs --follow`.
- Bevestig dat de agent kan uitvoeren: `openclaw status` en `openclaw models status`.
- Als je berichten in een chatkanaal verwacht, schakel levering in (`/deliver on` of `--deliver`).

## Verbindingsproblemen oplossen

- `disconnected`: zorg dat de Gateway actief is en dat je `--url/--token/--password` correct zijn.
- Geen agenten in de kiezer: controleer `openclaw agents list` en je routeringsconfiguratie.
- Lege sessiekiezer: je bevindt je mogelijk in globaal bereik of hebt nog geen sessies.

## Gerelateerd

- [Control UI](/nl/web/control-ui) — webgebaseerde besturingsinterface
- [Config](/nl/cli/config) — `openclaw.json` inspecteren, valideren en bewerken
- [Doctor](/nl/cli/doctor) — begeleide herstel- en migratiecontroles
- [CLI-referentie](/nl/cli) — volledige CLI-opdrachtenreferentie
