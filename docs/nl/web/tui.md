---
read_when:
    - Je wilt een beginnersvriendelijke stapsgewijze uitleg van de TUI
    - U hebt de volledige lijst met TUI-functies, commando's en sneltoetsen nodig
summary: 'Terminal-UI (TUI): maak verbinding met de Gateway of voer lokaal uit in ingebedde modus'
title: TUI
x-i18n:
    generated_at: "2026-04-29T23:28:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5caca4b3f4df02ce1226a8ed0d759023464e5b0752b9cd1b7922b20099d58df1
    source_path: web/tui.md
    workflow: 16
---

## Snelstart

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

Gebruik `--password` als je Gateway wachtwoordverificatie gebruikt.

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
- Lokale modus gebruikt de ingesloten agentruntime rechtstreeks. De meeste lokale tools werken, maar functies die alleen voor de Gateway zijn, zijn niet beschikbaar.
- `openclaw` en `openclaw crestodian` gebruiken ook deze TUI-shell, met Crestodian als lokale setup- en reparatiechatbackend.

## Wat je ziet

- Koptekst: verbindings-URL, huidige agent, huidige sessie.
- Chatlog: gebruikersberichten, antwoorden van de assistent, systeemmeldingen, toolkaarten.
- Statusregel: verbindings-/uitvoeringsstatus (verbinden, uitvoeren, streamen, inactief, fout).
- Voettekst: verbindingsstatus + agent + sessie + model + think/fast/verbose/trace/reasoning + tokenaantallen + afleveren.
- Invoer: teksteditor met automatisch aanvullen.

## Mentaal model: agents + sessies

- Agents zijn unieke slugs (bijv. `main`, `research`). De Gateway stelt de lijst beschikbaar.
- Sessies horen bij de huidige agent.
- Sessiesleutels worden opgeslagen als `agent:<agentId>:<sessionKey>`.
  - Als je `/session main` typt, breidt de TUI dit uit naar `agent:<currentAgent>:main`.
  - Als je `/session agent:other:main` typt, schakel je expliciet over naar die agentsessie.
- Sessiebereik:
  - `per-sender` (standaard): elke agent heeft veel sessies.
  - `global`: de TUI gebruikt altijd de `global`-sessie (de kiezer kan leeg zijn).
- De huidige agent + sessie zijn altijd zichtbaar in de voettekst.

## Verzenden + aflevering

- Berichten worden naar de Gateway verzonden; aflevering aan providers staat standaard uit.
- Aflevering inschakelen:
  - `/deliver on`
  - of het paneel Instellingen
  - of start met `openclaw tui --deliver`

## Kiezers + overlays

- Modelkiezer: toon beschikbare modellen en stel de sessie-override in.
- Agentkiezer: kies een andere agent.
- Sessiekiezer: toont alleen sessies voor de huidige agent.
- Instellingen: schakel aflevering, uitbreiding van tooluitvoer en zichtbaarheid van denken om.

## Sneltoetsen

- Enter: bericht verzenden
- Esc: actieve uitvoering afbreken
- Ctrl+C: invoer wissen (druk twee keer om af te sluiten)
- Ctrl+D: afsluiten
- Ctrl+L: modelkiezer
- Ctrl+G: agentkiezer
- Ctrl+P: sessiekiezer
- Ctrl+O: uitbreiding van tooluitvoer omschakelen
- Ctrl+T: zichtbaarheid van denken omschakelen (laadt geschiedenis opnieuw)

## Slash-commando's

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

Sessielevenccyclus:

- `/new` of `/reset` (de sessie resetten)
- `/abort` (de actieve uitvoering afbreken)
- `/settings`
- `/exit`

Alleen lokale modus:

- `/auth [provider]` opent de providerverificatie-/inlogflow binnen de TUI.

Andere Gateway-slash-commando's (bijvoorbeeld `/context`) worden doorgestuurd naar de Gateway en weergegeven als systeemuitvoer. Zie [Slash-commando's](/nl/tools/slash-commands).

## Lokale shellcommando's

- Zet `!` voor een regel om een lokaal shellcommando uit te voeren op de TUI-host.
- De TUI vraagt één keer per sessie om lokale uitvoering toe te staan; weigeren houdt `!` uitgeschakeld voor de sessie.
- Commando's worden uitgevoerd in een nieuwe, niet-interactieve shell in de TUI-werkmap (geen blijvende `cd`/env).
- Lokale shellcommando's krijgen `OPENCLAW_SHELL=tui-local` in hun omgeving.
- Een losse `!` wordt als normaal bericht verzonden; voorafgaande spaties activeren geen lokale uitvoering.

## Configuraties repareren vanuit de lokale TUI

Gebruik de lokale modus wanneer de huidige configuratie al valideert en je wilt dat de
ingesloten agent deze op dezelfde machine inspecteert, vergelijkt met de docs,
en helpt afwijkingen te repareren zonder afhankelijk te zijn van een draaiende Gateway.

Als `openclaw config validate` al faalt, begin dan eerst met `openclaw configure`
of `openclaw doctor --fix`. `openclaw chat` omzeilt de bescherming tegen ongeldige
configuratie niet.

Typische lus:

1. Start lokale modus:

```bash
openclaw chat
```

2. Vraag de agent wat je gecontroleerd wilt hebben, bijvoorbeeld:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Gebruik lokale shellcommando's voor exacte bewijsvoering en validatie:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Pas beperkte wijzigingen toe met `openclaw config set` of `openclaw configure`, en voer daarna `!openclaw config validate` opnieuw uit.
5. Als Doctor een automatische migratie of reparatie aanbeveelt, controleer die dan en voer `!openclaw doctor --fix` uit.

Tips:

- Geef de voorkeur aan `openclaw config set` of `openclaw configure` boven handmatig bewerken van `openclaw.json`.
- `openclaw docs "<query>"` doorzoekt de live docs-index vanaf dezelfde machine.
- `openclaw config validate --json` is handig wanneer je gestructureerde schema- en SecretRef-/oplosbaarheidsfouten wilt.

## Tooluitvoer

- Toolaanroepen worden weergegeven als kaarten met argumenten + resultaten.
- Ctrl+O schakelt tussen samengevouwen/uitgevouwen weergaven.
- Terwijl tools worden uitgevoerd, streamen gedeeltelijke updates naar dezelfde kaart.

## Terminalkleuren

- De TUI houdt de hoofdtekst van de assistent in de standaardvoorgrondkleur van je terminal, zodat zowel donkere als lichte terminals leesbaar blijven.
- Als je terminal een lichte achtergrond gebruikt en automatische detectie verkeerd is, stel dan `OPENCLAW_THEME=light` in voordat je `openclaw tui` start.
- Stel `OPENCLAW_THEME=dark` in om in plaats daarvan het oorspronkelijke donkere palet af te dwingen.

## Geschiedenis + streaming

- Bij verbinding laadt de TUI de meest recente geschiedenis (standaard 200 berichten).
- Streaming-antwoorden worden ter plekke bijgewerkt tot ze definitief zijn.
- De TUI luistert ook naar agenttool-events voor rijkere toolkaarten.

## Verbindingsdetails

- De TUI registreert zich bij de Gateway als `mode: "tui"`.
- Herverbindingen tonen een systeembericht; eventgaten worden in het log weergegeven.

## Opties

- `--local`: uitvoeren tegen de lokale ingesloten agentruntime
- `--url <url>`: Gateway-WebSocket-URL (standaard vanuit configuratie of `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway-token (indien vereist)
- `--password <password>`: Gateway-wachtwoord (indien vereist)
- `--session <key>`: sessiesleutel (standaard: `main`, of `global` wanneer het bereik globaal is)
- `--deliver`: antwoorden van de assistent afleveren aan de provider (standaard uit)
- `--thinking <level>`: denkniveau voor verzendingen overschrijven
- `--message <text>`: een eerste bericht verzenden na verbinding
- `--timeout-ms <ms>`: agenttimeout in ms (standaard naar `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: te laden geschiedenisitems (standaard `200`)

<Warning>
Wanneer je `--url` instelt, valt de TUI niet terug op configuratie- of omgevingsreferenties. Geef `--token` of `--password` expliciet mee. Ontbrekende expliciete referenties zijn een fout. Geef in lokale modus geen `--url`, `--token` of `--password` mee.
</Warning>

## Probleemoplossing

Geen uitvoer na het verzenden van een bericht:

- Voer `/status` uit in de TUI om te bevestigen dat de Gateway verbonden en inactief/bezig is.
- Controleer de Gateway-logs: `openclaw logs --follow`.
- Bevestig dat de agent kan worden uitgevoerd: `openclaw status` en `openclaw models status`.
- Als je berichten in een chatkanaal verwacht, schakel aflevering in (`/deliver on` of `--deliver`).

## Problemen met verbinding oplossen

- `disconnected`: zorg dat de Gateway draait en dat je `--url/--token/--password` correct zijn.
- Geen agents in kiezer: controleer `openclaw agents list` en je routeringsconfiguratie.
- Lege sessiekiezer: je bevindt je mogelijk in globaal bereik of hebt nog geen sessies.

## Gerelateerd

- [Control UI](/nl/web/control-ui) — webgebaseerde beheerinterface
- [Config](/nl/cli/config) — `openclaw.json` inspecteren, valideren en bewerken
- [Doctor](/nl/cli/doctor) — begeleide reparatie- en migratiecontroles
- [CLI-naslag](/nl/cli) — volledige naslag voor CLI-commando's
