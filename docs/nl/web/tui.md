---
read_when:
    - Je wilt een beginnersvriendelijke rondleiding door de TUI
    - Je hebt de volledige lijst met TUI-functies, opdrachten en sneltoetsen nodig
summary: 'Terminalinterface (TUI): maak verbinding met de Gateway of voer lokaal uit in ingesloten modus'
title: TUI
x-i18n:
    generated_at: "2026-07-16T16:41:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1e171520c24d95ac1d6df28227efea0a1258a0b9e59b61fe02c09a2d87b24391
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
# of
openclaw tui --local
```

- `openclaw chat` en `openclaw terminal` zijn aliassen voor `openclaw tui --local`.
- `--local` kan niet worden gecombineerd met `--url`, `--token` of `--password`.
- De lokale modus gebruikt rechtstreeks de ingebouwde agentruntime. De meeste lokale tools werken, maar functies die alleen via de Gateway beschikbaar zijn, zijn niet beschikbaar.
- Een kale `openclaw` (zonder subopdracht) kiest automatisch een doel: een niet-geconfigureerde installatie start de onboarding voor inferentie; bij een ongeldige configuratie wordt de klassieke Doctor-begeleiding geopend; als een geconfigureerde Gateway bereikbaar is, wordt deze TUI-shell in Gateway-modus geopend; anders wordt een geconfigureerd lokaal model in lokale modus geopend.

## Wat je ziet

- Koptekst: verbindings-URL, huidige agent, huidige sessie.
- Chatlogboek: gebruikersberichten, antwoorden van de assistent, systeemmeldingen, toolkaarten.
- Statusregel: verbindings-/uitvoeringsstatus (verbinden, uitvoeren, streamen, inactief, fout).
- Voettekst: agent + sessie + model + doelstatus + denken/snel/uitgebreid/traceren/redeneren + aantallen tokens + afleveren. Wanneer `tui.footer.showRemoteHost` is ingeschakeld, tonen verbindingen met een externe Gateway ook de verbindingshost.
- Invoer: teksteditor met automatische aanvulling.

## Mentaal model: agents + sessies

- Agents zijn unieke slugs (bijv. `main`, `research`). De Gateway stelt de lijst beschikbaar.
- Sessies behoren tot de huidige agent.
- Sessiesleutels worden opgeslagen als `agent:<agentId>:<sessionKey>`.
  - Als je `/session main` typt, breidt de TUI dit uit tot `agent:<currentAgent>:main`.
  - Als je `/session agent:other:main` typt, schakel je expliciet over naar die agentsessie.
- Sessiebereik:
  - `per-sender` (standaard): elke agent heeft meerdere sessies.
  - `global`: de TUI gebruikt altijd de sessie `global` (de kiezer kan leeg zijn).
- De huidige agent + sessie zijn altijd zichtbaar in de voettekst.
- Als je de Gateway-host wilt weergeven voor niet-lokale verbindingen op basis van een URL, schakel je dit in met:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  De standaardwaarde is `false`. Loopbackverbindingen en ingebouwde lokale verbindingen tonen nooit een hostlabel.

- Als de sessie een [doel](/nl/tools/goal) heeft, toont de voettekst de compacte status ervan:
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)` of `Goal achieved`.
- Wanneer de TUI zonder `--session` wordt gestart, hervat deze in Gateway-modus de laatst geselecteerde sessie voor dezelfde Gateway, agent en hetzelfde sessiebereik, mits die sessie nog bestaat. Het doorgeven van `--session`, `/session`, `/new` of `/reset` blijft een expliciete keuze.

## Verzenden + afleveren

- Berichten gaan altijd naar de Gateway (of naar de ingebouwde runtime in lokale modus); het terugsturen van het antwoord van de assistent naar een chatprovider is een afzonderlijke stap die standaard is uitgeschakeld.
- De TUI is een intern bronoppervlak zoals WebChat, geen algemeen uitgaand kanaal. Harnassen die `tools.message` vereisen voor zichtbare antwoorden, kunnen de actieve TUI-beurt afhandelen met een doelloze `message.send`; expliciete aflevering via een provider gebruikt nog steeds de normale geconfigureerde kanalen en valt nooit terug op `lastChannel`.
- Aflevering wordt bij het starten vastgelegd voor de volledige TUI-sessie: start met `openclaw tui --deliver` om deze in te schakelen. Er is geen slash-opdracht `/deliver` of schakelaar in Instellingen om dit tijdens een sessie te wijzigen; start de TUI opnieuw om dit te veranderen.

## Kiezers + overlays

- Modelkiezer: beschikbare modellen weergeven en de sessieoverschrijving instellen.
- Agentkiezer: een andere agent kiezen.
- Sessiekiezer: toont maximaal 50 sessies voor de huidige agent die in de afgelopen 7 dagen zijn bijgewerkt. Gebruik `/session <key>` om naar een oudere bekende sessie te springen.
- Instellingen (`/settings`): de uitvouwweergave van tooluitvoer en de zichtbaarheid van denkstappen in- of uitschakelen. Dit paneel regelt de aflevering niet.

## Sneltoetsen

- Enter: bericht verzenden
- Esc: actieve uitvoering afbreken
- Ctrl+C: invoer wissen (druk tweemaal om af te sluiten)
- Ctrl+D: afsluiten
- Ctrl+L: modelkiezer
- Ctrl+G: agentkiezer
- Ctrl+P: sessiekiezer
- Ctrl+O: uitvouwweergave van tooluitvoer in- of uitschakelen
- Ctrl+T: zichtbaarheid van denkstappen in- of uitschakelen (laadt de geschiedenis opnieuw)

## Slash-opdrachten

Kern:

- `/help`
- `/status` (doorgestuurd naar de Gateway; toont een overzicht van sessie/model)
- `/gateway-status` (alias `/gwstatus`; toont rechtstreeks de verbindingsstatus van de Gateway)
- `/agent <id>` (of `/agents`)
- `/session <key>` (of `/sessions`)
- `/model <provider/model>` (of `/models`)

Sessiebesturing:

- `/think <off|minimal|low|medium|high>` (hogere niveaus kunnen afhankelijk van het model niveaus zoals `xhigh`/`max` toevoegen)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` wist de sessieoverschrijving)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`

Levenscyclus van sessies:

- `/new` (start een nieuwe, geïsoleerde sessie onder een nieuwe sleutel; heeft geen invloed op andere TUI-clients in de oude sessie)
- `/reset` (stelt de huidige sessiesleutel ter plaatse opnieuw in)
- `/abort` (breekt de actieve uitvoering af)
- `/settings`
- `/exit` (of `/quit`)

Alleen lokale modus:

- `/auth [provider]` opent de authenticatie-/aanmeldingsstroom van de provider in de TUI.

OpenClaw:

- `/openclaw [request]` keert vanuit de normale agent-TUI terug naar de [OpenClaw](#openclaw-setup-and-repair-helper)-chat voor configuratie/herstel en kan optioneel één verzoek doorsturen.

Andere slash-opdrachten van de Gateway (bijvoorbeeld `/context`) worden naar de Gateway doorgestuurd en als systeemuitvoer weergegeven. Zie [Slash-opdrachten](/nl/tools/slash-commands).

## Lokale shellopdrachten

- Laat een regel voorafgaan door `!` om een lokale shellopdracht op de TUI-host uit te voeren.
- De TUI vraagt eenmaal per sessie toestemming voor lokale uitvoering; als je weigert, blijft `!` voor die sessie uitgeschakeld.
- Opdrachten worden uitgevoerd in een nieuwe, niet-interactieve shell in de werkmap van de TUI (geen blijvende `cd`/omgeving).
- Lokale shellopdrachten ontvangen `OPENCLAW_SHELL=tui-local` in hun omgeving.
- Een losse `!` wordt als een normaal bericht verzonden; voorafgaande spaties activeren geen lokale uitvoering.

## OpenClaw-helper voor configuratie en herstel

OpenClaw is de ring-zero-assistent voor configuratie/herstel, beschikbaar als `openclaw setup` nadat het geconfigureerde standaardmodel een live inferentiecontrole heeft doorstaan. Als inferentie niet beschikbaar is, keert een interactieve aanroep terug naar de onboarding voor inferentie en mislukt automatisering met herstelbegeleiding. Deze wordt uitgevoerd in dezelfde lokale TUI-shell als `openclaw tui --local`, ondersteund door een AI-agent die is beperkt tot de getypeerde, door goedkeuring afgeschermde bewerkingen van OpenClaw:

```bash
openclaw setup                       # interactief starten
openclaw setup -m "status"           # één verzoek uitvoeren en afsluiten
openclaw setup -m "set default model openai/gpt-5.2" --yes   # een configuratiewijziging toepassen
```

- Blijvende configuratiewijzigingen vereisen goedkeuring: bevestig interactief of geef `--yes` door.
- `--json` geeft het opstartoverzicht als JSON weer in plaats van de chat te starten.
- Vanuit OpenClaw sluit een `open-tui`-verzoek (bijvoorbeeld de vraag om met een normale agent te praten) OpenClaw af en opent het de gewone agent-TUI; gebruik daar `/openclaw` om terug te keren.

Gebruik de lokale modus wanneer de huidige configuratie al geldig is en je wilt dat de ingebouwde agent deze op dezelfde machine inspecteert, met de documentatie vergelijkt en helpt afwijkingen te herstellen zonder afhankelijk te zijn van een actieve Gateway.

Als `openclaw config validate` al mislukt, begin dan eerst met `openclaw configure` of `openclaw doctor --fix`; `openclaw chat` heeft nog steeds een laadbare configuratie nodig om te starten.

Gebruikelijke cyclus:

1. Start de lokale modus:

```bash
openclaw chat
```

2. Vraag de agent wat je wilt laten controleren, bijvoorbeeld:

```text
Vergelijk mijn gateway-authenticatieconfiguratie met de documentatie en stel de kleinste oplossing voor.
```

3. Gebruik lokale shellopdrachten voor exact bewijs en validatie:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Pas beperkte wijzigingen toe met `openclaw config set` of `openclaw configure` en voer daarna `!openclaw config validate` opnieuw uit.
5. Als Doctor een automatische migratie of reparatie aanbeveelt, controleer deze dan en voer `!openclaw doctor --fix` uit.

Tips:

- Gebruik bij voorkeur `openclaw config set` of `openclaw configure` in plaats van `openclaw.json` handmatig te bewerken.
- `openclaw docs "<query>"` doorzoekt de actuele documentatie-index vanaf dezelfde machine.
- `openclaw config validate --json` is nuttig wanneer je gestructureerde schema- en SecretRef-/oplosbaarheidsfouten wilt.

## Tooluitvoer

- Toolaanroepen worden weergegeven als kaarten met argumenten + resultaten.
- Ctrl+O schakelt tussen ingeklapte/uitgevouwen weergaven.
- Terwijl tools worden uitgevoerd, worden gedeeltelijke updates naar dezelfde kaart gestreamd.

## Terminalkleuren

- De TUI gebruikt voor de hoofdtekst van de assistent de standaardvoorgrondkleur van je terminal, zodat zowel donkere als lichte terminals leesbaar blijven.
- Als je terminal een lichte achtergrond gebruikt en de automatische detectie onjuist is, stel dan `OPENCLAW_THEME=light` in voordat je `openclaw tui` start.
- Stel in plaats daarvan `OPENCLAW_THEME=dark` in om het oorspronkelijke donkere palet af te dwingen.

## Geschiedenis + streaming

- Bij het verbinden laadt de TUI de recentste geschiedenis (standaard 200 berichten).
- Streamingantwoorden worden ter plaatse bijgewerkt totdat ze definitief zijn.
- De TUI luistert ook naar toolgebeurtenissen van agents voor uitgebreidere toolkaarten.

## Verbindingsgegevens

- De TUI maakt verbinding met client-id `openclaw-tui` in de globale clientmodus `ui` (dezelfde modus die Control UI en WebChat gebruiken voor Gateway-beleid).
- Bij opnieuw verbinden wordt een systeembericht weergegeven; ontbrekende gebeurtenissen worden in het logboek gemeld.

## Opties

- `--local`: Uitvoeren met de lokale ingebouwde agentruntime
- `--url <url>`: WebSocket-URL van de Gateway (standaard `gateway.remote.url` uit de configuratie, of `ws://127.0.0.1:<port>` op loopback)
- `--token <token>`: Gateway-token (indien vereist)
- `--password <password>`: Gateway-wachtwoord (indien vereist)
- `--tls-fingerprint <sha256>`: Verwachte vingerafdruk van het TLS-certificaat voor een vastgezette `wss://` Gateway
- `--session <key>`: Sessiesleutel (standaard: `main`, of `global` wanneer het bereik globaal is)
- `--deliver`: Antwoorden van de assistent afleveren bij de provider (standaard uitgeschakeld)
- `--thinking <level>`: Denkniveau voor verzendingen overschrijven
- `--message <text>`: Na het verbinden een eerste bericht verzenden
- `--timeout-ms <ms>`: Time-out van de agent in ms (standaard `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Aantal geschiedenisitems om te laden (standaard `200`)

<Warning>
Wanneer je `--url` instelt, valt de TUI niet terug op referenties uit de configuratie of omgeving. Geef `--token` of `--password` expliciet door, plus `--tls-fingerprint` wanneer het doel een vastgezet certificaat gebruikt. Ontbrekende expliciete referenties veroorzaken een fout. Geef in de lokale modus `--url`, `--token`, `--password` of `--tls-fingerprint` niet door.
</Warning>

## Probleemoplossing

Geen uitvoer na het verzenden van een bericht:

- Voer `/status` uit in de TUI om te bevestigen dat de Gateway verbonden en inactief/bezig is.
- Controleer de Gateway-logboeken: `openclaw logs --follow`.
- Bevestig dat de agent kan worden uitgevoerd: `openclaw status` en `openclaw models status`.
- Als je berichten in een chatkanaal verwacht, bevestig dan dat de TUI is gestart met `--deliver` (dit kan later niet worden ingeschakeld zonder opnieuw op te starten).

## Verbindingsproblemen oplossen

- `disconnected`: zorg dat de Gateway actief is en je `--url/--token/--password` correct zijn.
- Geen agents in de kiezer: controleer `openclaw agents list` en je routeringsconfiguratie.
- Lege sessiekiezer: mogelijk gebruik je het globale bereik of heb je nog geen sessies.

## Gerelateerd

- [Bedieningsinterface](/nl/web/control-ui) — webgebaseerde bedieningsinterface
- [Configuratie](/nl/cli/config) — `openclaw.json` inspecteren, valideren en bewerken
- [Doctor](/nl/cli/doctor) — begeleide reparatie- en migratiecontroles
- [CLI-referentie](/nl/cli) — volledige naslag voor CLI-opdrachten
