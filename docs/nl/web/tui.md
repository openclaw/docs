---
read_when:
    - Je wilt een beginnersvriendelijke stapsgewijze uitleg van de TUI
    - Je hebt de volledige lijst met TUI-functies, -opdrachten en -sneltoetsen nodig
summary: 'Terminal-UI (TUI): verbind met de Gateway of voer lokaal uit in ingebedde modus'
title: TUI
x-i18n:
    generated_at: "2026-06-27T18:32:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed02875ea5dcb8cef987d16fe11701eba11160525caf9791f74c610b1b6bec6e
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
- Lokale modus gebruikt de ingebedde agentruntime rechtstreeks. De meeste lokale tools werken, maar functies die alleen via de Gateway beschikbaar zijn, zijn niet beschikbaar.
- Nadat een configuratiebestand instellingen bevat die zijn aangemaakt, gebruiken `openclaw` en `openclaw crestodian` ook deze TUI-shell, met Crestodian als lokale backend voor setup- en reparatiechat.

## Wat je ziet

- Koptekst: verbindings-URL, huidige agent, huidige sessie.
- Chatlog: gebruikersberichten, assistentantwoorden, systeemmeldingen, toolkaarten.
- Statusregel: verbindings-/uitvoeringsstatus (verbinden, actief, streamen, inactief, fout).
- Voettekst: agent + sessie + model + doelstatus + think/fast/verbose/trace/reasoning + tokenaantallen + afleveren. Wanneer `tui.footer.showRemoteHost` is ingeschakeld, tonen externe Gateway-verbindingen ook de verbindingshost.
- Invoer: teksteditor met autocomplete.

## Mentaal model: agents + sessies

- Agents zijn unieke slugs (bijv. `main`, `research`). De Gateway stelt de lijst beschikbaar.
- Sessies horen bij de huidige agent.
- Sessiesleutels worden opgeslagen als `agent:<agentId>:<sessionKey>`.
  - Als je `/session main` typt, breidt de TUI dit uit naar `agent:<currentAgent>:main`.
  - Als je `/session agent:other:main` typt, schakel je expliciet over naar die agentsessie.
- Sessiebereik:
  - `per-sender` (standaard): elke agent heeft meerdere sessies.
  - `global`: de TUI gebruikt altijd de sessie `global` (de kiezer kan leeg zijn).
- De huidige agent + sessie zijn altijd zichtbaar in de voettekst.
- Schakel dit in om de Gateway-host voor niet-lokale URL-ondersteunde verbindingen te tonen:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Loopback- en ingebedde lokale verbindingen tonen nooit een hostlabel.

- Als de sessie een [doel](/nl/tools/goal) heeft, toont de voettekst de compacte status,
  zoals `Pursuing goal`, `Goal paused (/goal resume)` of
  `Goal achieved`.
- Wanneer de TUI in Gateway-modus zonder `--session` wordt gestart, hervat die de laatst geselecteerde sessie voor dezelfde Gateway, agent en hetzelfde sessiebereik als die sessie nog bestaat. Het doorgeven van `--session`, `/session`, `/new` of `/reset` blijft expliciet.

## Verzenden + aflevering

- Berichten worden naar de Gateway verzonden; aflevering aan providers staat standaard uit.
- De TUI is een intern bronoppervlak zoals WebChat, geen generiek uitgaand kanaal. Harnassen die `tools.message` vereisen voor zichtbare antwoorden kunnen de actieve TUI-beurt afhandelen met een doelloze `message.send`; expliciete provideraflevering gebruikt nog steeds normale geconfigureerde kanalen en valt nooit terug op `lastChannel`.
- Schakel aflevering in:
  - `/deliver on`
  - of het paneel Instellingen
  - of start met `openclaw tui --deliver`

## Kiezers + overlays

- Modelkiezer: lijst beschikbare modellen weergeven en de sessie-override instellen.
- Agentkiezer: een andere agent kiezen.
- Sessiekiezer: toont tot 50 sessies voor de huidige agent die in de afgelopen 7 dagen zijn bijgewerkt. Gebruik `/session <key>` om naar een oudere bekende sessie te springen.
- Instellingen: aflevering, uitvouwen van tooluitvoer en zichtbaarheid van denkproces in- of uitschakelen.

## Sneltoetsen

- Enter: bericht verzenden
- Esc: actieve uitvoering afbreken
- Ctrl+C: invoer wissen (druk twee keer om af te sluiten)
- Ctrl+D: afsluiten
- Ctrl+L: modelkiezer
- Ctrl+G: agentkiezer
- Ctrl+P: sessiekiezer
- Ctrl+O: uitvouwen van tooluitvoer in- of uitschakelen
- Ctrl+T: zichtbaarheid van denkproces in- of uitschakelen (laadt geschiedenis opnieuw)

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
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` wist de sessie-override)
- `/goal [status] | /goal start <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Sessielevenloop:

- `/new` of `/reset` (de sessie resetten)
- `/abort` (de actieve uitvoering afbreken)
- `/settings`
- `/exit`

Alleen lokale modus:

- `/auth [provider]` opent de provider-authenticatie-/inlogflow binnen de TUI.

Andere Gateway-slash-opdrachten (bijvoorbeeld `/context`) worden doorgestuurd naar de Gateway en getoond als systeemuitvoer. Zie [Slash-opdrachten](/nl/tools/slash-commands).

## Lokale shellopdrachten

- Begin een regel met `!` om een lokale shellopdracht op de TUI-host uit te voeren.
- De TUI vraagt één keer per sessie toestemming om lokale uitvoering toe te staan; weigeren houdt `!` uitgeschakeld voor de sessie.
- Opdrachten worden uitgevoerd in een nieuwe, niet-interactieve shell in de werkdirectory van de TUI (geen persistente `cd`/env).
- Lokale shellopdrachten ontvangen `OPENCLAW_SHELL=tui-local` in hun omgeving.
- Een losse `!` wordt als normaal bericht verzonden; voorafgaande spaties activeren geen lokale uitvoering.

## Configuraties repareren vanuit de lokale TUI

Gebruik lokale modus wanneer de huidige configuratie al valideert en je wilt dat de
ingebedde agent deze op dezelfde machine inspecteert, vergelijkt met de docs
en helpt afwijkingen te repareren zonder afhankelijk te zijn van een draaiende Gateway.

Als `openclaw config validate` al faalt, begin dan eerst met `openclaw configure`
of `openclaw doctor --fix`. `openclaw chat` omzeilt de bewaking tegen ongeldige
configuratie niet.

Typische lus:

1. Start lokale modus:

```bash
openclaw chat
```

2. Vraag de agent wat je wilt laten controleren, bijvoorbeeld:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Gebruik lokale shellopdrachten voor exacte bewijzen en validatie:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Pas smalle wijzigingen toe met `openclaw config set` of `openclaw configure` en voer daarna `!openclaw config validate` opnieuw uit.
5. Als Doctor een automatische migratie of reparatie aanbeveelt, beoordeel die en voer `!openclaw doctor --fix` uit.

Tips:

- Geef de voorkeur aan `openclaw config set` of `openclaw configure` boven het handmatig bewerken van `openclaw.json`.
- `openclaw docs "<query>"` doorzoekt de live docs-index vanaf dezelfde machine.
- `openclaw config validate --json` is handig wanneer je gestructureerde schema- en SecretRef-/oplosbaarheidsfouten wilt.

## Tooluitvoer

- Toolaanroepen worden weergegeven als kaarten met args + resultaten.
- Ctrl+O schakelt tussen ingeklapte/uitgeklapte weergaven.
- Terwijl tools worden uitgevoerd, streamen gedeeltelijke updates naar dezelfde kaart.

## Terminalkleuren

- De TUI houdt de hoofdtekst van de assistent in de standaardvoorgrondkleur van je terminal, zodat donkere en lichte terminals allebei leesbaar blijven.
- Als je terminal een lichte achtergrond gebruikt en automatische detectie verkeerd is, stel dan `OPENCLAW_THEME=light` in voordat je `openclaw tui` start.
- Stel `OPENCLAW_THEME=dark` in om in plaats daarvan het oorspronkelijke donkere palet te forceren.

## Geschiedenis + streaming

- Bij verbinden laadt de TUI de nieuwste geschiedenis (standaard 200 berichten).
- Streaming-antwoorden worden ter plekke bijgewerkt totdat ze definitief zijn.
- De TUI luistert ook naar agent-toolgebeurtenissen voor rijkere toolkaarten.

## Verbindingsdetails

- De TUI registreert zich bij de Gateway als `mode: "tui"`.
- Nieuwe verbindingen tonen een systeembericht; gaten in gebeurtenissen worden in het log weergegeven.

## Opties

- `--local`: uitvoeren tegen de lokale ingebedde agentruntime
- `--url <url>`: Gateway WebSocket-URL (standaard uit configuratie of `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway-token (indien vereist)
- `--password <password>`: Gateway-wachtwoord (indien vereist)
- `--session <key>`: sessiesleutel (standaard: `main`, of `global` wanneer het bereik globaal is)
- `--deliver`: assistentantwoorden afleveren aan de provider (standaard uit)
- `--thinking <level>`: denkniveau voor verzendingen overschrijven
- `--message <text>`: een eerste bericht verzenden na verbinden
- `--timeout-ms <ms>`: agenttime-out in ms (standaard `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: te laden geschiedenisitems (standaard `200`)

<Warning>
Wanneer je `--url` instelt, valt de TUI niet terug op configuratie- of omgevingsreferenties. Geef `--token` of `--password` expliciet door. Ontbrekende expliciete referenties zijn een fout. Geef in lokale modus geen `--url`, `--token` of `--password` door.
</Warning>

## Probleemoplossing

Geen uitvoer na het verzenden van een bericht:

- Voer `/status` uit in de TUI om te bevestigen dat de Gateway verbonden en inactief/bezig is.
- Controleer de Gateway-logs: `openclaw logs --follow`.
- Bevestig dat de agent kan worden uitgevoerd: `openclaw status` en `openclaw models status`.
- Als je berichten in een chatkanaal verwacht, schakel aflevering in (`/deliver on` of `--deliver`).

## Verbindingsproblemen oplossen

- `disconnected`: zorg dat de Gateway draait en dat je `--url/--token/--password` correct zijn.
- Geen agents in kiezer: controleer `openclaw agents list` en je routeringsconfiguratie.
- Lege sessiekiezer: je bevindt je mogelijk in globaal bereik of hebt nog geen sessies.

## Gerelateerd

- [Control UI](/nl/web/control-ui) — webgebaseerde besturingsinterface
- [Config](/nl/cli/config) — `openclaw.json` inspecteren, valideren en bewerken
- [Doctor](/nl/cli/doctor) — begeleide reparatie- en migratiecontroles
- [CLI Reference](/nl/cli) — volledige CLI-opdrachtreferentie
