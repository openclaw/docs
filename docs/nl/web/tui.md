---
read_when:
    - Je wilt een beginnersvriendelijke stapsgewijze uitleg van de TUI
    - Je hebt de volledige lijst met TUI-functies, opdrachten en sneltoetsen nodig
summary: 'Terminal-UI (TUI): verbinding maken met de Gateway of lokaal uitvoeren in embedded modus'
title: TUI
x-i18n:
    generated_at: "2026-05-05T11:16:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b517ff434cc440aeffd8698df75d4d85c22a19e59b38a1f2383e58e1b4084ff
    source_path: web/tui.md
    workflow: 16
---

## Snel starten

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
- Lokale modus gebruikt de ingebedde agentruntime rechtstreeks. De meeste lokale tools werken, maar functies die alleen via de Gateway beschikbaar zijn, zijn niet beschikbaar.
- `openclaw` en `openclaw crestodian` gebruiken ook deze TUI-shell, met Crestodian als backend voor de lokale installatie- en reparatiechat.

## Wat je ziet

- Koptekst: verbindings-URL, huidige agent, huidige sessie.
- Chatlogboek: gebruikersberichten, antwoorden van de assistent, systeemmeldingen, toolkaarten.
- Statusregel: verbindings-/uitvoeringsstatus (verbinden, actief, streamen, inactief, fout).
- Voettekst: verbindingsstatus + agent + sessie + model + denken/snel/uitgebreid/trace/reasoning + tokenaantallen + bezorgen.
- Invoer: teksteditor met automatisch aanvullen.

## Mentaal model: agents + sessies

- Agents zijn unieke slugs (bijv. `main`, `research`). De Gateway stelt de lijst beschikbaar.
- Sessies horen bij de huidige agent.
- Sessiesleutels worden opgeslagen als `agent:<agentId>:<sessionKey>`.
  - Als je `/session main` typt, breidt de TUI dit uit naar `agent:<currentAgent>:main`.
  - Als je `/session agent:other:main` typt, schakel je expliciet over naar die agentsessie.
- Sessiebereik:
  - `per-sender` (standaard): elke agent heeft meerdere sessies.
  - `global`: de TUI gebruikt altijd de `global`-sessie (de kiezer kan leeg zijn).
- De huidige agent + sessie zijn altijd zichtbaar in de voettekst.
- Wanneer de TUI in gateway-modus zonder `--session` wordt gestart, hervat deze de laatst geselecteerde sessie voor dezelfde gateway, agent en hetzelfde sessiebereik als die sessie nog bestaat. Het doorgeven van `--session`, `/session`, `/new` of `/reset` blijft expliciet.

## Verzenden + bezorging

- Berichten worden naar de Gateway verzonden; bezorging aan providers is standaard uitgeschakeld.
- Schakel bezorging in:
  - `/deliver on`
  - of het paneel Instellingen
  - of start met `openclaw tui --deliver`

## Kiezers + overlays

- Modelkiezer: toon beschikbare modellen en stel de sessie-override in.
- Agentkiezer: kies een andere agent.
- Sessiekiezer: toont maximaal 50 sessies voor de huidige agent die in de laatste 7 dagen zijn bijgewerkt. Gebruik `/session <key>` om naar een oudere bekende sessie te springen.
- Instellingen: schakel bezorgen, uitbreiding van tooluitvoer en zichtbaarheid van denken in of uit.

## Sneltoetsen

- Enter: bericht verzenden
- Esc: actieve uitvoering afbreken
- Ctrl+C: invoer wissen (druk twee keer om af te sluiten)
- Ctrl+D: afsluiten
- Ctrl+L: modelkiezer
- Ctrl+G: agentkiezer
- Ctrl+P: sessiekiezer
- Ctrl+O: uitbreiding van tooluitvoer in-/uitschakelen
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

- `/auth [provider]` opent de verificatie-/loginflow van de provider in de TUI.

Andere Gateway-slash-opdrachten (bijvoorbeeld `/context`) worden doorgestuurd naar de Gateway en getoond als systeemuitvoer. Zie [Slash-opdrachten](/nl/tools/slash-commands).

## Lokale shellopdrachten

- Zet `!` aan het begin van een regel om een lokale shellopdracht op de TUI-host uit te voeren.
- De TUI vraagt één keer per sessie om lokale uitvoering toe te staan; als je weigert, blijft `!` uitgeschakeld voor de sessie.
- Opdrachten worden uitgevoerd in een nieuwe, niet-interactieve shell in de werkmap van de TUI (geen blijvende `cd`/env).
- Lokale shellopdrachten krijgen `OPENCLAW_SHELL=tui-local` in hun omgeving.
- Een losse `!` wordt verzonden als een normaal bericht; voorloopspaties activeren geen lokale uitvoering.

## Configs repareren vanuit de lokale TUI

Gebruik lokale modus wanneer de huidige config al valideert en je wilt dat de
ingebedde agent deze op dezelfde machine inspecteert, vergelijkt met de docs,
en helpt afwijkingen te repareren zonder afhankelijk te zijn van een draaiende Gateway.

Als `openclaw config validate` al faalt, begin dan eerst met `openclaw configure`
of `openclaw doctor --fix`. `openclaw chat` omzeilt de bewaking tegen ongeldige
config niet.

Typische lus:

1. Start lokale modus:

```bash
openclaw chat
```

2. Vraag de agent wat je wilt laten controleren, bijvoorbeeld:

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

4. Pas smalle wijzigingen toe met `openclaw config set` of `openclaw configure` en voer daarna `!openclaw config validate` opnieuw uit.
5. Als Doctor een automatische migratie of reparatie aanbeveelt, beoordeel die dan en voer `!openclaw doctor --fix` uit.

Tips:

- Geef de voorkeur aan `openclaw config set` of `openclaw configure` boven het handmatig bewerken van `openclaw.json`.
- `openclaw docs "<query>"` doorzoekt de live docs-index vanaf dezelfde machine.
- `openclaw config validate --json` is nuttig wanneer je gestructureerde schema- en SecretRef-/oplosbaarheidsfouten wilt.

## Tooluitvoer

- Toolaanroepen worden weergegeven als kaarten met argumenten + resultaten.
- Ctrl+O schakelt tussen ingeklapte/uitgeklapte weergaven.
- Terwijl tools draaien, streamen gedeeltelijke updates naar dezelfde kaart.

## Terminalkleuren

- De TUI houdt de hoofdtekst van de assistent in de standaardvoorgrondkleur van je terminal, zodat donkere en lichte terminals beide leesbaar blijven.
- Als je terminal een lichte achtergrond gebruikt en automatische detectie verkeerd is, stel dan `OPENCLAW_THEME=light` in voordat je `openclaw tui` start.
- Als je in plaats daarvan het oorspronkelijke donkere palet wilt afdwingen, stel dan `OPENCLAW_THEME=dark` in.

## Geschiedenis + streaming

- Bij verbinden laadt de TUI de nieuwste geschiedenis (standaard 200 berichten).
- Streamende antwoorden worden ter plekke bijgewerkt tot ze definitief zijn.
- De TUI luistert ook naar agenttoolgebeurtenissen voor rijkere toolkaarten.

## Verbindingsdetails

- De TUI registreert zich bij de Gateway als `mode: "tui"`.
- Herverbindingen tonen een systeembericht; gaten in events worden zichtbaar gemaakt in het logboek.

## Opties

- `--local`: uitvoeren tegen de lokale ingebedde agentruntime
- `--url <url>`: Gateway WebSocket-URL (standaard uit config of `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway-token (indien vereist)
- `--password <password>`: Gateway-wachtwoord (indien vereist)
- `--session <key>`: sessiesleutel (standaard: `main`, of `global` wanneer het bereik global is)
- `--deliver`: antwoorden van de assistent bezorgen aan de provider (standaard uit)
- `--thinking <level>`: denkniveau voor verzendingen overschrijven
- `--message <text>`: een eerste bericht verzenden na verbinding
- `--timeout-ms <ms>`: agenttimeout in ms (standaard uit `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: te laden geschiedenisitems (standaard `200`)

<Warning>
Wanneer je `--url` instelt, valt de TUI niet terug op config- of omgevingsreferenties. Geef `--token` of `--password` expliciet door. Ontbrekende expliciete referenties zijn een fout. Geef in lokale modus geen `--url`, `--token` of `--password` door.
</Warning>

## Problemen oplossen

Geen uitvoer na het verzenden van een bericht:

- Voer `/status` uit in de TUI om te bevestigen dat de Gateway verbonden en inactief/bezig is.
- Controleer de Gateway-logboeken: `openclaw logs --follow`.
- Bevestig dat de agent kan draaien: `openclaw status` en `openclaw models status`.
- Als je berichten in een chatkanaal verwacht, schakel bezorging in (`/deliver on` of `--deliver`).

## Verbindingsproblemen oplossen

- `disconnected`: zorg dat de Gateway draait en dat je `--url/--token/--password` correct zijn.
- Geen agents in de kiezer: controleer `openclaw agents list` en je routeringsconfig.
- Lege sessiekiezer: je bevindt je mogelijk in global bereik of je hebt nog geen sessies.

## Gerelateerd

- [Control UI](/nl/web/control-ui) — webgebaseerde besturingsinterface
- [Config](/nl/cli/config) — `openclaw.json` inspecteren, valideren en bewerken
- [Doctor](/nl/cli/doctor) — begeleide reparatie- en migratiecontroles
- [CLI Reference](/nl/cli) — volledige CLI-opdrachtenreferentie
